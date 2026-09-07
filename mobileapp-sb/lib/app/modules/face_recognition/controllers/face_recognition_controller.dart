import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/services/camera_service.dart';
import '../../../core/services/liveness_service.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/session_service.dart';
import '../../../routes/app_pages.dart';

class FaceRecognitionController extends GetxController {
  final CameraService cameraService = Get.find<CameraService>();
  final ApiService _api = Get.find<ApiService>();
  final SessionService _session = Get.find<SessionService>();
  final LivenessService _liveness = LivenessService();

  final isScanning = true.obs;
  final isSuccess = false.obs;
  final statusText = 'Posisikan wajah Anda menghadap kamera...'.obs;
  final livenessProgress = 0.0.obs;
  final currentStep = LivenessStep.lookStraight.obs;

  @override
  void onInit() {
    super.onInit();
    _startFaceRecognition();
  }

  Future<Position> _getCurrentPosition() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw ApiException('Izin lokasi ditolak. Aktifkan izin lokasi untuk absen.');
    }

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 15),
      ),
    );
  }

  void _startFaceRecognition() async {
    isScanning.value = true;
    isSuccess.value = false;
    _liveness.reset();
    currentStep.value = LivenessStep.lookStraight;
    livenessProgress.value = 0.25;

    await cameraService.startFrontCamera();
    await Future.delayed(const Duration(milliseconds: 500));

    bool passed = false;
    String? finalBase64;

    try {
      statusText.value = 'Posisikan wajah menghadap lurus ke kamera';
      int attempts = 0;
      const maxAttempts = 150; // ~45 detik agar gerakan presisi dan tenang

      while (isScanning.value && !passed && attempts < maxAttempts) {
        attempts++;
        final xfile = await cameraService.takePictureFile();
        if (xfile != null) {
          final res = await _liveness.processImageFile(xfile.path);
          statusText.value = res.instruction;
          livenessProgress.value = res.progress;
          currentStep.value = res.currentStep;

          if (res.isSuccess) {
            passed = true;
            final bytes = await xfile.readAsBytes();
            finalBase64 = base64Encode(bytes);
            try { await File(xfile.path).delete(); } catch (_) {}
            break;
          }
          try { await File(xfile.path).delete(); } catch (_) {}
        }
        await Future.delayed(const Duration(milliseconds: 300));
      }

      if (!passed) {
        throw ApiException('Verifikasi keaslian wajah (liveness) gagal. Pastikan mengikuti gerakan.');
      }

      statusText.value = 'Liveness terverifikasi! Mengambil lokasi GPS & mengirim absensi...';
      final position = await _getCurrentPosition();

      final tipe = (Get.arguments is Map && Get.arguments['tipe'] != null)
          ? Get.arguments['tipe'].toString()
          : 'masuk';
      final labelTipe = tipe == 'keluar' ? 'Pulang' : 'Masuk';

      final idKaryawan = _session.idKaryawan.value ?? 1;
      final res = await _api.submitAbsensiWajah(
        idKaryawan: idKaryawan,
        lat: position.latitude,
        lng: position.longitude,
        faceImageBase64: finalBase64!,
        tipe: tipe,
      );

      isScanning.value = false;
      isSuccess.value = true;
      statusText.value = 'Wajah Cocok! Absen $labelTipe tercatat.';

      await Future.delayed(const Duration(seconds: 1));
      Get.snackbar(
        'Absen $labelTipe Berhasil',
        res['message']?.toString() ?? 'Data absensi $labelTipe Anda telah tercatat',
        snackPosition: SnackPosition.TOP,
        backgroundColor: const Color(0xFF16A34A),
        colorText: const Color(0xFFFFFFFF),
        margin: const EdgeInsets.all(16),
      );

      Get.offAllNamed(Routes.DASHBOARD);
    } catch (e) {
      isScanning.value = false;
      isSuccess.value = false;
      statusText.value = e.toString();
      Get.snackbar(
        'Absensi Ditolak',
        e.toString(),
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.redAccent,
        colorText: Colors.white,
        duration: const Duration(seconds: 4),
      );
    }
  }

  void retry() {
    _startFaceRecognition();
  }

  @override
  void onClose() {
    _liveness.dispose();
    cameraService.stop();
    super.onClose();
  }
}
