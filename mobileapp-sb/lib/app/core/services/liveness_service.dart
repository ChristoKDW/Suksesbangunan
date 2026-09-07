import 'dart:io';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';

enum LivenessStep {
  lookStraight, // Hadap lurus (tahan stabil)
  turnLeft,     // Menoleh ke kiri (tahan stabil)
  turnRight,    // Menoleh ke kanan (tahan stabil)
  lookUp,       // Menengadah ke atas (tahan stabil)
  blink,        // Kedipkan mata (Buka -> Tutup -> Buka)
  completed,    // Selesai & terverifikasi
}

class LivenessChallengeResult {
  final bool isSuccess;
  final String instruction;
  final LivenessStep currentStep;
  final double progress; // 0.0 s/d 1.0
  final int currentFrameCount;
  final int targetFrameCount;

  LivenessChallengeResult({
    required this.isSuccess,
    required this.instruction,
    required this.currentStep,
    required this.progress,
    this.currentFrameCount = 0,
    this.targetFrameCount = 3,
  });
}

/// Engine Anti-Spoofing Presisi Tinggi (Active Face Liveness Detection)
/// Memastikan subjek adalah manusia hidup melalui gerakan bertahap yang harus ditahan stabil
/// (tidak terburu-buru/skip otomatis):
/// 1. Hadap lurus (tahan 3 frame)
/// 2. Tengok ke kiri (tahan 3 frame)
/// 3. Tengok ke kanan (tahan 3 frame)
/// 4. Tengok ke atas (tahan 2 frame)
/// 5. Kedip mata nyata (siklus: Buka -> Tutup -> Buka kembali)
class LivenessService {
  late final FaceDetector _detector;
  LivenessStep currentStep = LivenessStep.lookStraight;

  // Counter stabilitas pergerakan
  int _consecutiveFrames = 0;
  static const int requiredHoldFrames = 3; // Butuh 3 frame berturut-turut (~1 detik stabil)

  // Arah putaran untuk adaptif mirroring kamera depan
  int _leftTurnDirection = 0;

  // State kedip mata
  bool _blinkSawOpenFirst = false;
  bool _blinkSawClosed = false;

  // Ambang sudut (degrees)
  static const double yawThreshold = 14.0;   // Sudut toleh kiri/kanan
  static const double pitchThreshold = 11.0; // Sudut dongak atas

  LivenessService() {
    final options = FaceDetectorOptions(
      enableClassification: true,
      enableLandmarks: true,
      performanceMode: FaceDetectorMode.accurate,
      minFaceSize: 0.15,
    );
    _detector = FaceDetector(options: options);
  }

  void reset() {
    currentStep = LivenessStep.lookStraight;
    _consecutiveFrames = 0;
    _leftTurnDirection = 0;
    _blinkSawOpenFirst = false;
    _blinkSawClosed = false;
  }

  /// Memproses file gambar dari kamera dan mengevaluasi langkah liveness secara presisi
  Future<LivenessChallengeResult> processImageFile(String filePath) async {
    final file = File(filePath);
    if (!await file.exists()) {
      return LivenessChallengeResult(
        isSuccess: false,
        instruction: 'Menunggu kamera siap...',
        currentStep: currentStep,
        progress: _calculateProgress(),
      );
    }

    try {
      final inputImage = InputImage.fromFilePath(filePath);
      final faces = await _detector.processImage(inputImage);

      if (faces.isEmpty) {
        _consecutiveFrames = 0;
        return LivenessChallengeResult(
          isSuccess: false,
          instruction: 'Wajah tidak terdeteksi. Posisikan wajah di lingkaran.',
          currentStep: currentStep,
          progress: _calculateProgress(),
        );
      }

      final face = faces.first;
      final double? yaw = face.headEulerAngleY; // Rotasi horizontal
      final double? pitch = face.headEulerAngleX; // Rotasi vertikal (angguk)
      final double? leftEye = face.leftEyeOpenProbability;
      final double? rightEye = face.rightEyeOpenProbability;

      switch (currentStep) {
        // ─── 1. HADAP LURUS KE DEPAN (Presisi 3 frame stabil) ───────────────
        case LivenessStep.lookStraight:
          final isStraight = (yaw != null && yaw.abs() < 9.0) &&
              (pitch != null && pitch.abs() < 13.0);

          if (isStraight) {
            _consecutiveFrames++;
            if (_consecutiveFrames >= requiredHoldFrames) {
              _consecutiveFrames = 0;
              currentStep = LivenessStep.turnLeft;
              return LivenessChallengeResult(
                isSuccess: false,
                instruction: 'Bagus! Sekarang perlahan tengokkan wajah ke KIRI',
                currentStep: currentStep,
                progress: _calculateProgress(),
              );
            }
            return LivenessChallengeResult(
              isSuccess: false,
              instruction: 'Tahan posisi lurus... ($_consecutiveFrames/$requiredHoldFrames)',
              currentStep: currentStep,
              progress: _calculateProgress(),
              currentFrameCount: _consecutiveFrames,
              targetFrameCount: requiredHoldFrames,
            );
          } else {
            _consecutiveFrames = 0;
            return LivenessChallengeResult(
              isSuccess: false,
              instruction: 'Posisikan wajah menghadap lurus ke kamera',
              currentStep: currentStep,
              progress: _calculateProgress(),
            );
          }

        // ─── 2. TENGOK KE KIRI (Presisi 3 frame stabil) ─────────────────────
        case LivenessStep.turnLeft:
          // Deteksi toleh kiri: yaw signifikan (pada kamera depan yaw < -14 atau > 14)
          final isTurningLeft = yaw != null && (yaw < -yawThreshold || yaw > yawThreshold);

          if (isTurningLeft) {
            _consecutiveFrames++;
            _leftTurnDirection = yaw > 0 ? 1 : -1;

            if (_consecutiveFrames >= requiredHoldFrames) {
              _consecutiveFrames = 0;
              currentStep = LivenessStep.turnRight;
              return LivenessChallengeResult(
                isSuccess: false,
                instruction: 'Sempurna! Sekarang tengokkan wajah ke KANAN',
                currentStep: currentStep,
                progress: _calculateProgress(),
              );
            }
            return LivenessChallengeResult(
              isSuccess: false,
              instruction: 'Tahan menoleh ke KIRI... ($_consecutiveFrames/$requiredHoldFrames)',
              currentStep: currentStep,
              progress: _calculateProgress(),
              currentFrameCount: _consecutiveFrames,
              targetFrameCount: requiredHoldFrames,
            );
          } else {
            _consecutiveFrames = 0;
            return LivenessChallengeResult(
              isSuccess: false,
              instruction: 'Tengokkan wajah perlahan ke KIRI dan tahan sebentar',
              currentStep: currentStep,
              progress: _calculateProgress(),
            );
          }

        // ─── 3. TENGOK KE KANAN (Arah berlawanan dari kiri, 3 frame stabil) ─
        case LivenessStep.turnRight:
          // Harus berlawanan tanda dengan arah kiri sebelumnya
          bool isTurningRight = false;
          if (yaw != null) {
            if (_leftTurnDirection != 0) {
              isTurningRight = (_leftTurnDirection > 0 && yaw < -yawThreshold) ||
                  (_leftTurnDirection < 0 && yaw > yawThreshold);
            } else {
              isTurningRight = yaw.abs() > yawThreshold;
            }
          }

          if (isTurningRight) {
            _consecutiveFrames++;
            if (_consecutiveFrames >= requiredHoldFrames) {
              _consecutiveFrames = 0;
              currentStep = LivenessStep.lookUp;
              return LivenessChallengeResult(
                isSuccess: false,
                instruction: 'Hebat! Sekarang dongakkan kepala sedikit ke ATAS',
                currentStep: currentStep,
                progress: _calculateProgress(),
              );
            }
            return LivenessChallengeResult(
              isSuccess: false,
              instruction: 'Tahan menoleh ke KANAN... ($_consecutiveFrames/$requiredHoldFrames)',
              currentStep: currentStep,
              progress: _calculateProgress(),
              currentFrameCount: _consecutiveFrames,
              targetFrameCount: requiredHoldFrames,
            );
          } else {
            _consecutiveFrames = 0;
            return LivenessChallengeResult(
              isSuccess: false,
              instruction: 'Tengokkan wajah perlahan ke KANAN dan tahan',
              currentStep: currentStep,
              progress: _calculateProgress(),
            );
          }

        // ─── 4. TENGOK KE ATAS (Dongak ke atas, 2 frame stabil) ─────────────
        case LivenessStep.lookUp:
          final isLookingUp = pitch != null && pitch.abs() >= pitchThreshold;

          if (isLookingUp) {
            _consecutiveFrames++;
            if (_consecutiveFrames >= 2) {
              _consecutiveFrames = 0;
              currentStep = LivenessStep.blink;
              _blinkSawOpenFirst = false;
              _blinkSawClosed = false;
              return LivenessChallengeResult(
                isSuccess: false,
                instruction: 'Terakhir: Silakan KEDIPKAN kedua mata Anda',
                currentStep: currentStep,
                progress: _calculateProgress(),
              );
            }
            return LivenessChallengeResult(
              isSuccess: false,
              instruction: 'Tahan kepala menengadah ke ATAS... ($_consecutiveFrames/2)',
              currentStep: currentStep,
              progress: _calculateProgress(),
            );
          } else {
            _consecutiveFrames = 0;
            return LivenessChallengeResult(
              isSuccess: false,
              instruction: 'Dongakkan kepala sedikit ke ATAS dan tahan',
              currentStep: currentStep,
              progress: _calculateProgress(),
            );
          }

        // ─── 5. KEDIPKAN MATA (Siklus asli: Terbuka -> Tertutup -> Terbuka) ──
        case LivenessStep.blink:
          if (leftEye != null && rightEye != null) {
            final areEyesOpen = leftEye > 0.60 && rightEye > 0.60;
            final areEyesClosed = leftEye < 0.35 && rightEye < 0.35;

            // Tahap 1: Pastikan awalnya mata terbuka
            if (areEyesOpen && !_blinkSawClosed) {
              _blinkSawOpenFirst = true;
              return LivenessChallengeResult(
                isSuccess: false,
                instruction: 'Mata terbuka terdeteksi... Silakan KEDIPKAN mata sekarang',
                currentStep: currentStep,
                progress: _calculateProgress(),
              );
            }

            // Tahap 2: Mata berkedip menutup
            if (_blinkSawOpenFirst && areEyesClosed) {
              _blinkSawClosed = true;
              return LivenessChallengeResult(
                isSuccess: false,
                instruction: 'Mata tertutup terdeteksi... Buka kembali mata Anda',
                currentStep: currentStep,
                progress: _calculateProgress(),
              );
            }

            // Tahap 3: Mata terbuka kembali -> Selesai!
            if (_blinkSawOpenFirst && _blinkSawClosed && areEyesOpen) {
              currentStep = LivenessStep.completed;
              return LivenessChallengeResult(
                isSuccess: true,
                instruction: 'Liveness Terverifikasi! Wajah Anda asli & hidup.',
                currentStep: currentStep,
                progress: 1.0,
              );
            }
          }

          return LivenessChallengeResult(
            isSuccess: false,
            instruction: 'Silakan KEDIPKAN kedua mata Anda secara wajar',
            currentStep: currentStep,
            progress: _calculateProgress(),
          );

        // ─── 6. SELESAI ─────────────────────────────────────────────────────
        case LivenessStep.completed:
          return LivenessChallengeResult(
            isSuccess: true,
            instruction: 'Liveness Terverifikasi!',
            currentStep: currentStep,
            progress: 1.0,
          );
      }
    } catch (e) {
      return LivenessChallengeResult(
        isSuccess: false,
        instruction: 'Mendeteksi pergerakan wajah...',
        currentStep: currentStep,
        progress: _calculateProgress(),
      );
    }
  }

  double _calculateProgress() {
    switch (currentStep) {
      case LivenessStep.lookStraight:
        return 0.15 + (_consecutiveFrames / requiredHoldFrames) * 0.10;
      case LivenessStep.turnLeft:
        return 0.25 + (_consecutiveFrames / requiredHoldFrames) * 0.20;
      case LivenessStep.turnRight:
        return 0.45 + (_consecutiveFrames / requiredHoldFrames) * 0.20;
      case LivenessStep.lookUp:
        return 0.65 + (_consecutiveFrames / 2) * 0.15;
      case LivenessStep.blink:
        return _blinkSawClosed ? 0.90 : 0.80;
      case LivenessStep.completed:
        return 1.0;
    }
  }

  void dispose() {
    _detector.close();
  }
}
