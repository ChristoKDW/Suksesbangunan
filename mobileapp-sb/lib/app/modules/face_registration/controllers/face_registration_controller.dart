import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/services/camera_service.dart';
import '../../../core/services/liveness_service.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/session_service.dart';
import '../../../routes/app_pages.dart';

class FaceRegistrationController extends GetxController {
  final CameraService cameraService = Get.find<CameraService>();
  final ApiService _api = Get.find<ApiService>();
  final SessionService _session = Get.find<SessionService>();
  final LivenessService _liveness = LivenessService();

  final isScanning = false.obs;
  final isSuccess = false.obs;
  final instructionText = "Tekan 'Mulai Pendaftaran' untuk memulai verifikasi liveness".obs;
  final livenessProgress = 0.0.obs;
  final currentStep = LivenessStep.lookStraight.obs;

  @override
  void onInit() {
    super.onInit();
    cameraService.startFrontCamera();
  }

  void startRegistration() async {
    isScanning.value = true;
    _liveness.reset();
    currentStep.value = LivenessStep.lookStraight;
    livenessProgress.value = 0.25;
    instructionText.value = "Posisikan wajah menghadap lurus ke kamera";

    bool passed = false;
    String? finalBase64Image;

    try {
      if (!cameraService.isInitialized.value) {
        await cameraService.startFrontCamera();
      }

      int attempts = 0;
      const maxAttempts = 150; // Toleransi waktu ~45 detik agar user leluasa menahan pose

      while (isScanning.value && !passed && attempts < maxAttempts) {
        attempts++;
        final xfile = await cameraService.takePictureFile();
        if (xfile != null) {
          final res = await _liveness.processImageFile(xfile.path);
          instructionText.value = res.instruction;
          livenessProgress.value = res.progress;
          currentStep.value = res.currentStep;

          if (res.isSuccess) {
            passed = true;
            final bytes = await xfile.readAsBytes();
            finalBase64Image = base64Encode(bytes);
            try { await File(xfile.path).delete(); } catch (_) {}
            break;
          }
          try { await File(xfile.path).delete(); } catch (_) {}
        }
        await Future.delayed(const Duration(milliseconds: 300));
      }

      if (!passed) {
        throw ApiException('Waktu verifikasi liveness habis. Silakan coba lagi dan ikuti gerakan.');
      }

      instructionText.value = "Liveness Terverifikasi! Menyimpan biometrik wajah ke AI server...";
      final res = await _api.registerFace(finalBase64Image!);
      _session.markFaceRegistered();

      isScanning.value = false;
      isSuccess.value = true;
      final conf = res['confidence'] != null ? " (${(res['confidence'] * 100).toInt()}%)" : "";
      instructionText.value = "Pendaftaran wajah & verifikasi liveness berhasil!$conf";

      await Future.delayed(const Duration(seconds: 1));
      Get.snackbar(
        'Berhasil',
        'Biometrik wajah terdaftar & liveness terverifikasi.',
        snackPosition: SnackPosition.TOP,
        backgroundColor: const Color(0xFF16A34A),
        colorText: Colors.white,
      );
      Get.offAllNamed(Routes.DASHBOARD);
    } catch (e) {
      isScanning.value = false;
      isSuccess.value = false;
      instructionText.value = "Gagal: ${e.toString()}";
      Get.snackbar('Gagal', e.toString(), snackPosition: SnackPosition.BOTTOM);
    }
  }

  @override
  void onClose() {
    _liveness.dispose();
    cameraService.stop();
    super.onClose();
  }
}
