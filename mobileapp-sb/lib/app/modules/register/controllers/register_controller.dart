import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/services/api_service.dart';
import '../../../routes/app_pages.dart';

class RegisterController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  // Langkah 1: input NIK
  final nikController = TextEditingController();

  // Auto-fill (read-only) hasil cek NIK
  final namaController = TextEditingController();
  final emailController = TextEditingController();

  // Input akun baru
  final usernameController = TextEditingController();
  final passwordController = TextEditingController();
  final nomorTeleponController = TextEditingController();

  final isLoading = false.obs;
  final isSubmitting = false.obs;
  final isAccountFound = false.obs;
  final isPasswordHidden = true.obs;
  final hasPhoneFromHRD = false.obs;

  void togglePasswordVisibility() => isPasswordHidden.toggle();

  /// Langkah 2: cek NIK ke backend, lalu auto-fill nama, email, dan cek telepon.
  Future<void> searchAccountByNik() async {
    final nik = nikController.text.trim();
    if (nik.isEmpty) {
      Get.snackbar('Error', 'NIK tidak boleh kosong');
      return;
    }

    isLoading.value = true;
    try {
      final data = await _api.checkNik(nik);
      namaController.text = data['nama']?.toString() ?? '';
      emailController.text = data['email']?.toString() ?? '';
      
      final phone = data['nomorTelepon']?.toString().trim();
      if (phone != null && phone.isNotEmpty) {
        nomorTeleponController.text = phone;
        hasPhoneFromHRD.value = true;
      } else {
        nomorTeleponController.clear();
        hasPhoneFromHRD.value = false;
      }

      isAccountFound.value = true;
    } catch (e) {
      isAccountFound.value = false;
      hasPhoneFromHRD.value = false;
      Get.snackbar('NIK Tidak Valid', e.toString(),
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isLoading.value = false;
    }
  }

  /// Langkah 4: submit registrasi → backend kirim OTP ke email.
  Future<void> submitRegistration() async {
    if (usernameController.text.trim().isEmpty ||
        passwordController.text.isEmpty) {
      Get.snackbar('Error', 'Username dan Password wajib diisi');
      return;
    }
    if (passwordController.text.length < 6) {
      Get.snackbar('Error', 'Password minimal 6 karakter');
      return;
    }

    isSubmitting.value = true;
    try {
      await _api.register(
        nik: nikController.text.trim(),
        nama: namaController.text.trim(),
        email: emailController.text.trim(),
        username: usernameController.text.trim(),
        password: passwordController.text,
        nomorTelepon: nomorTeleponController.text.trim(),
      );

      Get.snackbar('Berhasil', 'Kode OTP telah dikirim ke email Anda');
      // Langkah 5: menuju layar verifikasi OTP
      Get.toNamed(Routes.OTP, arguments: {
        'nik': nikController.text.trim(),
        'email': emailController.text.trim(),
      });
    } catch (e) {
      Get.snackbar('Registrasi Gagal', e.toString(),
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isSubmitting.value = false;
    }
  }
}
