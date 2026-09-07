import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/face_recognition_controller.dart';
import '../../../core/theme/app_colors.dart';

class FaceRecognitionView extends GetView<FaceRecognitionController> {
  const FaceRecognitionView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Pemindaian Wajah'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.white,
      ),
      extendBodyBehindAppBar: true,
      body: Center(
        child: Obx(() {
          if (controller.isSuccess.value) {
            return Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: const BoxDecoration(
                    color: AppColors.success,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check,
                    color: Colors.white,
                    size: 64,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Wajah Terverifikasi',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            );
          }

          final isCamReady =
              controller.cameraService.isInitialized.value &&
              controller.cameraService.controller != null;

          return Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Frame Kamera Asli
              Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: controller.isScanning.value
                        ? AppColors.redPrimary
                        : Colors.white24,
                    width: 4,
                  ),
                  color: Colors.black,
                ),
                clipBehavior: Clip.antiAlias,
                child: isCamReady
                    ? FittedBox(
                        fit: BoxFit.cover,
                        child: SizedBox(
                          width: controller.cameraService.controller!.value
                                  .previewSize?.height ??
                              280,
                          height: controller.cameraService.controller!.value
                                  .previewSize?.width ??
                              280,
                          child: CameraPreview(
                            controller.cameraService.controller!,
                          ),
                        ),
                      )
                    : Center(
                        child: Icon(
                          Icons.face_retouching_natural,
                          size: 120,
                          color: Colors.white.withValues(alpha: 0.5),
                        ),
                      ),
              ),
              const SizedBox(height: 24),
              // Liveness Progress Bar
              if (controller.isScanning.value)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: controller.livenessProgress.value,
                      backgroundColor: Colors.white24,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.redPrimary),
                      minHeight: 6,
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 24),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white24),
                ),
                child: Text(
                  controller.statusText.value,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              if (!controller.isScanning.value)
                ElevatedButton.icon(
                  onPressed: controller.retry,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Coba Lagi'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.redPrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
            ],
          );
        }),
      ),
    );
  }
}
