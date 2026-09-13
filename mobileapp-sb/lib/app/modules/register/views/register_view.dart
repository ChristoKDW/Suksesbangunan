import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/register_controller.dart';
import '../../../core/theme/app_colors.dart';
import '../../../components/app_brand_header.dart';
import '../../../components/custom_text_field.dart';
import '../../../components/custom_button.dart';

class RegisterView extends GetView<RegisterController> {
  const RegisterView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 24),
              const AppBrandHeader(
                title: 'Claim Account',
                subtitle: 'Aktivasi akun kehadiran menggunakan NIK Anda',
              ),
              const SizedBox(height: 48),
              CustomTextField(
                controller: controller.nikController,
                label: 'Nomor Induk Karyawan (NIK)',
                hint: 'Masukkan NIK Anda',
                prefixIcon: Icons.badge_outlined,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              Obx(() => CustomButton(
                    label: 'Cari Akun',
                    onPressed: controller.searchAccountByNik,
                    isLoading: controller.isLoading.value,
                    isOutlined: controller.isAccountFound.value,
                  )),
              const SizedBox(height: 32),

              // Reactive Account Preview + Form Registrasi
              Obx(() => controller.isAccountFound.value
                  ? Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceWhite,
                        border: Border.all(color: AppColors.borderGrey),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.check_circle,
                                  color: AppColors.success),
                              const SizedBox(width: 8),
                              Text(
                                'Data Ditemukan',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      color: AppColors.success,
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                            ],
                          ),
                          const Divider(height: 24),

                          // Auto-fill read-only
                          CustomTextField(
                            controller: controller.namaController,
                            label: 'Nama Lengkap',
                            prefixIcon: Icons.person_outline,
                            enabled: false,
                          ),
                          CustomTextField(
                            controller: controller.emailController,
                            label: 'Email',
                            prefixIcon: Icons.email_outlined,
                            enabled: false,
                          ),
                          Obx(() => controller.hasPhoneFromHRD.value
                              ? CustomTextField(
                                  controller: controller.nomorTeleponController,
                                  label: 'Nomor Telepon',
                                  prefixIcon: Icons.phone_outlined,
                                  enabled: false,
                                )
                              : const SizedBox.shrink()),
                          const Divider(height: 24),
                          const Text(
                            'Buat Kredensial Akun',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 16),

                          // Input akun baru
                          CustomTextField(
                            controller: controller.usernameController,
                            label: 'Username',
                            hint: 'Buat username Anda',
                            prefixIcon: Icons.account_circle_outlined,
                          ),
                          Obx(() => CustomTextField(
                                controller: controller.passwordController,
                                label: 'Password',
                                hint: 'Minimal 6 karakter',
                                prefixIcon: Icons.lock_outline,
                                obscureText:
                                    controller.isPasswordHidden.value,
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    controller.isPasswordHidden.value
                                        ? Icons.visibility_off_outlined
                                        : Icons.visibility_outlined,
                                    color: AppColors.slateLight,
                                  ),
                                  onPressed:
                                      controller.togglePasswordVisibility,
                                ),
                              )),
                          // Tampilkan input nomor telepon HANYA jika HRD belum mengisinya
                          Obx(() => !controller.hasPhoneFromHRD.value
                              ? CustomTextField(
                                  controller: controller.nomorTeleponController,
                                  label: 'Nomor Telepon (opsional)',
                                  hint: '08xxxxxxxxxx',
                                  prefixIcon: Icons.phone_outlined,
                                  keyboardType: TextInputType.phone,
                                )
                              : const SizedBox.shrink()),
                          const SizedBox(height: 8),
                          Obx(() => CustomButton(
                                label: 'Daftar & Kirim OTP',
                                onPressed: controller.submitRegistration,
                                isLoading: controller.isSubmitting.value,
                              )),
                        ],
                      ),
                    )
                  : const SizedBox.shrink()),
                  
              const SizedBox(height: 48),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Sudah punya akun?',
                    style: TextStyle(color: AppColors.slateLight),
                  ),
                  TextButton(
                    onPressed: () => Get.back(),
                    child: const Text(
                      'Masuk',
                      style: TextStyle(
                        color: AppColors.redPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
