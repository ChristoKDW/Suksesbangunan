import 'dart:convert';
import 'package:camera/camera.dart';
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
      isInitialized.value = true;
    } catch (e) {
      isInitialized.value = false;
      errorMessage.value = e.toString();
    }
  }

  /// Ambil foto wajah dan kembalikan objek XFile.
  Future<XFile?> takePictureFile() async {
    if (controller == null || !controller!.value.isInitialized) return null;
    return controller!.takePicture();
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
