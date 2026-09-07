import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../routes/app_pages.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/session_service.dart';

class LoginController extends GetxController {
  final usernameController = TextEditingController();
  final passwordController = TextEditingController();

  final ApiService _api = Get.find<ApiService>();
  final SessionService _session = Get.find<SessionService>();

  final isPasswordHidden = true.obs;
  final isLoading = false.obs;

  void togglePasswordVisibility() {
    isPasswordHidden.toggle();
  }

  void login() async {
    if (usernameController.text.trim().isEmpty ||
        passwordController.text.isEmpty) {
      Get.snackbar('Error', 'Username dan Password wajib diisi');
      return;
    }

    isLoading.value = true;
    try {
      final res = await _api.login(
        username: usernameController.text.trim(),
        password: passwordController.text,
      );

      final karyawan = (res['karyawan'] as Map?) ?? {};
      final bool sudahRegistrasiWajah = res['sudahRegistrasiWajah'] == true;

      _session.saveLogin(
        token: res['accessToken']?.toString() ?? '',
        idKaryawan: (karyawan['idKaryawan'] as num?)?.toInt() ?? 0,
        nama: karyawan['nama']?.toString() ?? '',
        nik: karyawan['nik']?.toString() ?? '',
        sudahRegistrasiWajah: sudahRegistrasiWajah,
      );

      // Langkah 2 alur wajah: wajibkan registrasi wajah jika belum ada.
      if (!sudahRegistrasiWajah) {
        Get.offAllNamed(Routes.FACE_REGISTRATION);
      } else {
        Get.offAllNamed(Routes.DASHBOARD);
      }
    } catch (e) {
      Get.snackbar('Login Gagal', e.toString(),
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isLoading.value = false;
    }
  }

  void goToClaimAccount() {
    Get.toNamed(Routes.REGISTER);
  }
}
