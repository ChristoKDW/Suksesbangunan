import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/services/api_service.dart';

class ForgotPasswordController extends GetxController {
  final api = Get.find<ApiService>();

  final isClaimMode = false.obs; // false = Request mode, true = Claim mode
  final isLoading = false.obs;

  final requestUsernameCtrl = TextEditingController();

  final claimUsernameCtrl = TextEditingController();
  final newPasswordCtrl = TextEditingController();
  final confirmPasswordCtrl = TextEditingController();

  @override
  void onClose() {
    requestUsernameCtrl.dispose();
    claimUsernameCtrl.dispose();
    newPasswordCtrl.dispose();
    confirmPasswordCtrl.dispose();
    super.onClose();
  }

  void toggleMode() {
    isClaimMode.value = !isClaimMode.value;
  }

  Future<void> submitRequest() async {
    final username = requestUsernameCtrl.text.trim();
    if (username.isEmpty) {
      Get.snackbar('Error', 'Username harus diisi',
          backgroundColor: Colors.red.withValues(alpha: 0.8), colorText: Colors.white, snackPosition: SnackPosition.BOTTOM, margin: const EdgeInsets.all(16));
      return;
    }

    isLoading.value = true;
    try {
      final res = await api.post('/auth/mobile/forgot-password/request', {'username': username});
      if (res.hasError) {
        throw res.bodyString ?? res.statusText ?? 'Terjadi kesalahan jaringan';
      }
      
      Get.snackbar('Sukses', res.body?['message'] ?? 'Permintaan berhasil dikirim',
          backgroundColor: Colors.green.withValues(alpha: 0.8), colorText: Colors.white, snackPosition: SnackPosition.BOTTOM, margin: const EdgeInsets.all(16));
      
      requestUsernameCtrl.clear();
      toggleMode();
    } catch (e) {
      Get.snackbar('Gagal', e.toString(),
          backgroundColor: Colors.red.withValues(alpha: 0.8), colorText: Colors.white, snackPosition: SnackPosition.BOTTOM, margin: const EdgeInsets.all(16));
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> submitClaim() async {
    final username = claimUsernameCtrl.text.trim();
    final newPass = newPasswordCtrl.text.trim();
    final confirmPass = confirmPasswordCtrl.text.trim();

    if (username.isEmpty || newPass.isEmpty || confirmPass.isEmpty) {
      Get.snackbar('Error', 'Semua kolom harus diisi',
          backgroundColor: Colors.red.withValues(alpha: 0.8), colorText: Colors.white, snackPosition: SnackPosition.BOTTOM, margin: const EdgeInsets.all(16));
      return;
    }

    if (newPass != confirmPass) {
      Get.snackbar('Error', 'Konfirmasi password tidak cocok',
          backgroundColor: Colors.red.withValues(alpha: 0.8), colorText: Colors.white, snackPosition: SnackPosition.BOTTOM, margin: const EdgeInsets.all(16));
      return;
    }

    isLoading.value = true;
    try {
      final res = await api.post('/auth/mobile/forgot-password/claim', {
        'username': username,
        'newPassword': newPass,
      });
      if (res.hasError) {
        throw res.bodyString ?? res.statusText ?? 'Terjadi kesalahan jaringan';
      }
      
      Get.snackbar('Sukses', res.body?['message'] ?? 'Password berhasil diubah',
          backgroundColor: Colors.green.withValues(alpha: 0.8), colorText: Colors.white, snackPosition: SnackPosition.BOTTOM, margin: const EdgeInsets.all(16));
      Get.offAllNamed('/login'); // Kembali ke login
    } catch (e) {
      Get.snackbar('Gagal', e.toString(),
          backgroundColor: Colors.red.withValues(alpha: 0.8), colorText: Colors.white, snackPosition: SnackPosition.BOTTOM, margin: const EdgeInsets.all(16));
    } finally {
      isLoading.value = false;
    }
  }
}
