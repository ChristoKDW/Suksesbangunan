import 'dart:async';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/services/api_service.dart';
import '../../../routes/app_pages.dart';

class OtpController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final otpController = TextEditingController();

  late final String nik;
  late final String email;

  final isLoading = false.obs;
  final secondsLeft = 0.obs;
  Timer? _timer;

  @override
  void onInit() {
    super.onInit();
    final args = Get.arguments as Map? ?? {};
    nik = args['nik']?.toString() ?? '';
    email = args['email']?.toString() ?? '';
    _startCountdown();
  }

  void _startCountdown() {
    secondsLeft.value = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (secondsLeft.value <= 0) {
        t.cancel();
      } else {
        secondsLeft.value--;
      }
    });
  }

  Future<void> verify() async {
    final otp = otpController.text.trim();
    if (otp.length != 6) {
      Get.snackbar('Error', 'Kode OTP harus 6 digit');
      return;
    }

    isLoading.value = true;
    try {
      await _api.verifyOtp(nik: nik, otp: otp);
      Get.snackbar('Berhasil', 'Akun aktif. Silakan login.');
      Get.offAllNamed(Routes.LOGIN);
    } catch (e) {
      Get.snackbar('Verifikasi Gagal', e.toString(),
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> resend() async {
    if (secondsLeft.value > 0) return;
    try {
      await _api.resendOtp(nik);
      Get.snackbar('Terkirim', 'Kode OTP baru telah dikirim');
      _startCountdown();
    } catch (e) {
      Get.snackbar('Gagal', e.toString(), snackPosition: SnackPosition.BOTTOM);
    }
  }

  @override
  void onClose() {
    _timer?.cancel();
    super.onClose();
  }
}
