import 'dart:convert';

import 'package:camera/camera.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

/// Mengelola inisialisasi kamera (khususnya kamera depan untuk wajah).
class CameraService extends GetxService {
  List<CameraDescription> _cameras = [];
  CameraController? controller;

  final isInitialized = false.obs;
  final hasCamera = false.obs;
  final errorMessage = RxnString();

  Future<CameraService> init() async {
    try {
      _cameras = await availableCameras();
      hasCamera.value = _cameras.isNotEmpty;
    } catch (e) {
      errorMessage.value = e.toString();
      hasCamera.value = false;
    }
    return this;
  }

  /// Mulai kamera depan (atau kamera pertama jika depan tidak ada).
  Future<void> startFrontCamera() async {
    if (_cameras.isEmpty) {
      try {
        _cameras = await availableCameras();
        hasCamera.value = _cameras.isNotEmpty;
      } catch (e) {
        errorMessage.value = e.toString();
        return;
      }
    }
    if (_cameras.isEmpty) return;

    final front = _cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.front,
      orElse: () => _cameras.first,
    );

    // Lepas controller lama jika ada
    await controller?.dispose();
    controller = CameraController(
      front,
      ResolutionPreset.medium,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    try {
      await controller!.initialize();
      await controller!.lockCaptureOrientation(DeviceOrientation.portraitUp);
      isInitialized.value = true;
      errorMessage.value = null;
    } catch (e) {
      isInitialized.value = false;
      errorMessage.value = e.toString();
    }
  }

  /// Ambil foto wajah dan kembalikan objek XFile.
  Future<XFile?> takePictureFile() async {
    final activeController = controller;
    if (activeController == null || !activeController.value.isInitialized) {
      throw StateError(
        errorMessage.value ??
            'Kamera belum siap. Tutup layar lalu coba kembali.',
      );
    }
    if (activeController.value.isTakingPicture) return null;

    final file = await activeController.takePicture();
    if (await file.length() == 0) {
      throw StateError('Kamera menghasilkan gambar kosong.');
    }
    return file;
  }

  /// Ambil foto wajah dan ubah langsung ke base64 JPEG.
  Future<String?> takePictureBase64() async {
    final file = await takePictureFile();
    if (file == null) return null;
    final bytes = await file.readAsBytes();
    return base64Encode(bytes);
  }

  Future<void> stop() async {
    isInitialized.value = false;
    await controller?.dispose();
    controller = null;
  }

  @override
  void onClose() {
    stop();
    super.onClose();
  }
}
