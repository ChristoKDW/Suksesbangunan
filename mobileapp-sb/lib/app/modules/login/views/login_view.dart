import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/login_controller.dart';
import '../../../core/theme/app_colors.dart';
import '../../../components/app_brand_header.dart';
import '../../../components/custom_text_field.dart';
import '../../../components/custom_button.dart';

class LoginView extends GetView<LoginController> {
  const LoginView({super.key});

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
              const SizedBox(height: 48),
              const AppBrandHeader(
                title: 'Selamat Datang',
                subtitle: 'Masuk untuk mencatat kehadiran',
              ),
              const SizedBox(height: 48),
              CustomTextField(
                controller: controller.usernameController,
                label: 'Username',
                hint: 'Masukkan username Anda',
                prefixIcon: Icons.account_circle_outlined,
                keyboardType: TextInputType.text,
              ),
              Obx(() => CustomTextField(
                    controller: controller.passwordController,
                    label: 'Password',
                    prefixIcon: Icons.lock_outline,
                    obscureText: controller.isPasswordHidden.value,
                    suffixIcon: IconButton(
                      icon: Icon(
                        controller.isPasswordHidden.value
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: AppColors.slateLight,
                      ),
                      onPressed: controller.togglePasswordVisibility,
                    ),
                  )),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () {},
                  child: const Text(
                    'Lupa Password?',
                    style: TextStyle(color: AppColors.slateLight),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Obx(() => CustomButton(
                    label: 'Masuk',
                    onPressed: controller.login,
                    isLoading: controller.isLoading.value,
                  )),
              const SizedBox(height: 48),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Belum memiliki akun karyawan?',
                    style: TextStyle(color: AppColors.slateLight),
                  ),
                  TextButton(
                    onPressed: controller.goToClaimAccount,
                    child: const Text(
                      'Claim Account',
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
