import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../controllers/settings_controller.dart';

class SettingsView extends GetView<SettingsController> {
  const SettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pengaturan Akun'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // -- Section: Edit Profile --
            _buildSectionHeader(
              icon: Icons.person_outline,
              title: 'Informasi Profil',
              subtitle: 'Ubah nama, email, dan nomor telepon',
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: controller.namaController,
              label: 'Nama Lengkap',
              icon: Icons.person,
            ),
            const SizedBox(height: 14),
            _buildTextField(
              controller: controller.emailController,
              label: 'Email',
              icon: Icons.email_outlined,
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 14),
            _buildTextField(
              controller: controller.teleponController,
              label: 'Nomor Telepon',
              icon: Icons.phone_outlined,
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 16),
            Obx(() => SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: controller.isUpdatingProfile.value
                        ? null
                        : controller.updateProfile,
                    icon: controller.isUpdatingProfile.value
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                color: AppColors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.save_outlined),
                    label: Text(controller.isUpdatingProfile.value
                        ? 'Menyimpan...'
                        : 'Simpan Perubahan'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                )),
            const SizedBox(height: 36),

            // -- Section: Change Password --
            _buildSectionHeader(
              icon: Icons.lock_outline,
              title: 'Ganti Password',
              subtitle: 'Pastikan password baru minimal 6 karakter',
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: controller.currentPasswordController,
              label: 'Password Saat Ini',
              icon: Icons.lock,
              isPassword: true,
            ),
            const SizedBox(height: 14),
            _buildTextField(
              controller: controller.newPasswordController,
              label: 'Password Baru',
              icon: Icons.lock_reset,
              isPassword: true,
            ),
            const SizedBox(height: 14),
            _buildTextField(
              controller: controller.confirmPasswordController,
              label: 'Konfirmasi Password Baru',
              icon: Icons.lock_reset,
              isPassword: true,
            ),
            const SizedBox(height: 16),
            Obx(() => SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: controller.isChangingPassword.value
                        ? null
                        : controller.changePassword,
                    icon: controller.isChangingPassword.value
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                color: AppColors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.vpn_key),
                    label: Text(controller.isChangingPassword.value
                        ? 'Menyimpan...'
                        : 'Ganti Password'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.redVariant,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                )),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.redContainer,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.redPrimary, size: 22),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                  color: AppColors.slateDark,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  color: AppColors.slateLight,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    bool isPassword = false,
  }) {
    if (!isPassword) {
      return TextField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, size: 20),
        ),
      );
    }

    return Obx(() => TextField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: this.controller.isPasswordHidden.value,
          decoration: InputDecoration(
            labelText: label,
            prefixIcon: Icon(icon, size: 20),
            suffixIcon: IconButton(
              icon: Icon(
                this.controller.isPasswordHidden.value
                    ? Icons.visibility_off
                    : Icons.visibility,
                size: 20,
              ),
              onPressed: this.controller.togglePasswordVisibility,
            ),
          ),
        ));
  }
}
