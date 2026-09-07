import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../data/services/api_service.dart';
import '../../../data/services/session_service.dart';

class SettingsController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  // Profile form controllers
  final namaController = TextEditingController();
  final emailController = TextEditingController();
  final teleponController = TextEditingController();

  // Password form controllers
  final currentPasswordController = TextEditingController();
  final newPasswordController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  final isUpdatingProfile = false.obs;
  final isChangingPassword = false.obs;
  final isPasswordHidden = true.obs;

  @override
  void onInit() {
    super.onInit();
    _loadProfile();
  }

  void _loadProfile() async {
    try {
      final data = await _api.getMyProfile();
      namaController.text = data['nama']?.toString() ?? '';
      emailController.text = data['email']?.toString() ?? '';
      teleponController.text = data['nomorTelepon']?.toString() ?? '';
    } catch (_) {}
  }

  void togglePasswordVisibility() => isPasswordHidden.toggle();

  Future<void> updateProfile() async {
    if (namaController.text.trim().isEmpty) {
      Get.snackbar('Error', 'Nama tidak boleh kosong',
          snackPosition: SnackPosition.BOTTOM);
      return;
    }

    isUpdatingProfile.value = true;
    try {
      await _api.updateProfile(
        nama: namaController.text.trim(),
        email: emailController.text.trim(),
        nomorTelepon: teleponController.text.trim(),
      );

      // Update nama di session juga
      final session = Get.find<SessionService>();
      session.nama.value = namaController.text.trim();

      Get.snackbar('Berhasil', 'Profil berhasil diperbarui',
          snackPosition: SnackPosition.BOTTOM);
    } catch (e) {
      Get.snackbar('Error', 'Gagal memperbarui profil: $e',
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isUpdatingProfile.value = false;
    }
  }

  Future<void> changePassword() async {
    if (currentPasswordController.text.isEmpty) {
      Get.snackbar('Error', 'Password saat ini wajib diisi',
          snackPosition: SnackPosition.BOTTOM);
      return;
    }
    if (newPasswordController.text.length < 6) {
      Get.snackbar('Error', 'Password baru minimal 6 karakter',
          snackPosition: SnackPosition.BOTTOM);
      return;
    }
    if (newPasswordController.text != confirmPasswordController.text) {
      Get.snackbar('Error', 'Konfirmasi password tidak cocok',
          snackPosition: SnackPosition.BOTTOM);
      return;
    }

    isChangingPassword.value = true;
    try {
      await _api.changePassword(
        currentPassword: currentPasswordController.text,
        newPassword: newPasswordController.text,
      );
      currentPasswordController.clear();
      newPasswordController.clear();
      confirmPasswordController.clear();
      Get.snackbar('Berhasil', 'Password berhasil diganti',
          snackPosition: SnackPosition.BOTTOM);
    } catch (e) {
      Get.snackbar('Error', 'Gagal mengganti password: $e',
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isChangingPassword.value = false;
    }
  }

  @override
  void onClose() {
    namaController.dispose();
    emailController.dispose();
    teleponController.dispose();
    currentPasswordController.dispose();
    newPasswordController.dispose();
    confirmPasswordController.dispose();
    super.onClose();
  }
}
