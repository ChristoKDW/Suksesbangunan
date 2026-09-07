import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/otp_controller.dart';
import '../../../core/theme/app_colors.dart';
import '../../../components/app_brand_header.dart';
import '../../../components/custom_text_field.dart';
import '../../../components/custom_button.dart';

class OtpView extends GetView<OtpController> {
  const OtpView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(backgroundColor: AppColors.white, elevation: 0),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const AppBrandHeader(
                title: 'Verifikasi OTP',
                subtitle: 'Masukkan 6 digit kode yang dikirim ke email Anda',
                icon: Icons.mark_email_read_outlined,
              ),
              const SizedBox(height: 8),
              Text(
                controller.email,
                style: const TextStyle(
                  color: AppColors.redPrimary,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 32),
              CustomTextField(
                controller: controller.otpController,
                label: 'Kode OTP',
                hint: '______',
                prefixIcon: Icons.password_outlined,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              Obx(() => CustomButton(
                    label: 'Verifikasi',
                    onPressed: controller.verify,
                    isLoading: controller.isLoading.value,
                  )),
              const SizedBox(height: 24),
              Center(
                child: Obx(() => controller.secondsLeft.value > 0
                    ? Text(
                        'Kirim ulang kode dalam ${controller.secondsLeft.value}s',
                        style: const TextStyle(color: AppColors.slateLight),
                      )
                    : TextButton(
                        onPressed: controller.resend,
                        child: const Text(
                          'Kirim Ulang OTP',
                          style: TextStyle(
                            color: AppColors.redPrimary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      )),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
