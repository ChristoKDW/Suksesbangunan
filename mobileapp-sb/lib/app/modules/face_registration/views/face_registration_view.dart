import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/face_registration_controller.dart';
import '../../../core/theme/app_colors.dart';

class FaceRegistrationView extends GetView<FaceRegistrationController> {
  const FaceRegistrationView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Pendaftaran Wajah'),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: AppColors.slateDark,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Text(
                'Keamanan Biometrik',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.slateDark,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Posisikan wajah Anda di dalam lingkaran. AI server akan mendeteksi dan mengekstraksi fitur biometrik (512-dim vector) secara otomatis.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.slateLight,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 32),

              // Scanner Frame dengan Kamera Asli
              Obx(() {
                final isCamReady =
                    controller.cameraService.isInitialized.value &&
                    controller.cameraService.controller != null;

                return Container(
                  width: 260,
                  height: 320,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(130),
                    border: Border.all(
                      color: controller.isSuccess.value
                          ? AppColors.success
                          : (controller.isScanning.value
                              ? AppColors.redPrimary
                              : AppColors.borderGrey),
                      width: 4,
                    ),
                    color: Colors.black,
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (isCamReady)
                        FittedBox(
                          fit: BoxFit.cover,
                          child: SizedBox(
                            width: controller
                                .cameraService.controller!.value.previewSize?.height ??
                                260,
                            height: controller
                                .cameraService.controller!.value.previewSize?.width ??
                                320,
                            child: CameraPreview(
                              controller.cameraService.controller!,
                            ),
                          ),
                        )
                      else
                        Center(
                          child: Icon(
                            Icons.person_outline,
                            size: 90,
                            color: AppColors.slateLight.withValues(alpha: 0.6),
                          ),
                        ),
                      if (controller.isScanning.value)
                        Container(
                          color: Colors.black38,
                          child: const Center(
                            child: CircularProgressIndicator(
                              color: AppColors.redPrimary,
                            ),
                          ),
                        ),
                      if (controller.isSuccess.value)
                        Container(
                          color: Colors.black38,
                          child: const Center(
                            child: Icon(
                              Icons.check_circle,
                              color: AppColors.success,
                              size: 80,
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              }),

              const SizedBox(height: 20),

              // Liveness Challenge Progress & Step Icons
              Obx(() {
                if (!controller.isScanning.value && !controller.isSuccess.value) {
                  return const SizedBox.shrink();
                }

                return Column(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: controller.livenessProgress.value,
                        backgroundColor: AppColors.borderGrey,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          controller.isSuccess.value ? AppColors.success : AppColors.redPrimary,
                        ),
                        minHeight: 8,
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                );
              }),
              
              // Instruction Text
              Obx(() => Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: controller.isSuccess.value
                      ? AppColors.success.withValues(alpha: 0.1)
                      : (controller.isScanning.value
                          ? AppColors.redPrimary.withValues(alpha: 0.08)
                          : AppColors.borderGrey.withValues(alpha: 0.3)),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: controller.isSuccess.value
                        ? AppColors.success.withValues(alpha: 0.3)
                        : (controller.isScanning.value
                            ? AppColors.redPrimary.withValues(alpha: 0.2)
                            : Colors.transparent),
                  ),
                ),
                child: Text(
                  controller.instructionText.value,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: controller.isSuccess.value
                        ? AppColors.success
                        : (controller.isScanning.value ? AppColors.redPrimary : AppColors.slateDark),
                  ),
                ),
              )),
              
              const Spacer(),
              
              // Action Button
              Obx(() => SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (controller.isScanning.value || controller.isSuccess.value) 
                      ? null 
                      : controller.startRegistration,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.redPrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    disabledBackgroundColor: AppColors.borderGrey,
                  ),
                  child: Text(controller.isScanning.value ? 'Memproses...' : 'Mulai Pendaftaran'),
                ),
              )),
            ],
          ),
        ),
      ),
    );
  }
}
