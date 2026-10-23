import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/config/app_config.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/session_service.dart';
import '../../home/controllers/home_controller.dart';
import '../../profile/controllers/profile_controller.dart';

class SettingsController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  // Profile data & observables
  final userProfile = <String, dynamic>{}.obs;
  final isUploadingKtp = false.obs;
  final isUploadingKk = false.obs;

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
      userProfile.assignAll(data);
      namaController.text = data['nama']?.toString() ?? '';
      emailController.text = data['email']?.toString() ?? '';
      teleponController.text = data['nomorTelepon']?.toString() ?? '';
    } catch (_) {}
  }

  bool get hasKtp {
    final ktp = userProfile['fotoKtp']?.toString();
    return ktp != null && ktp.trim().isNotEmpty;
  }

  bool get hasKk {
    final kk = userProfile['fotoKartuKeluarga']?.toString();
    return kk != null && kk.trim().isNotEmpty;
  }

  String? get ktpPhotoUrl {
    final path = userProfile['fotoKtp']?.toString();
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final clean = path.replaceAll('\\', '/');
    return '${AppConfig.baseUrl}${clean.startsWith('/') ? '' : '/'}$clean';
  }

  String? get kkPhotoUrl {
    final path = userProfile['fotoKartuKeluarga']?.toString();
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final clean = path.replaceAll('\\', '/');
    return '${AppConfig.baseUrl}${clean.startsWith('/') ? '' : '/'}$clean';
  }

  Future<void> pickAndUploadKtp(ImageSource source) async {
    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: source,
      maxWidth: 1600,
      maxHeight: 1200,
      imageQuality: 85,
    );
    if (image == null) return;

    isUploadingKtp.value = true;
    try {
      final res = await _api.uploadKtpPhoto(image.path);
      userProfile['fotoKtp'] = res['fotoKtp']?.toString() ?? image.path;
      userProfile.refresh();

      if (Get.isRegistered<ProfileController>()) {
        Get.find<ProfileController>().fetchProfile();
      }
      if (Get.isRegistered<HomeController>()) {
        Get.find<HomeController>().fetchData();
      }

      Get.snackbar(
        'Berhasil',
        'Foto KTP berhasil disimpan',
        backgroundColor: const Color(0xFF16A34A),
        colorText: Colors.white,
      );
    } catch (e) {
      Get.snackbar('Gagal Upload', 'Foto KTP gagal disimpan: $e');
    } finally {
      isUploadingKtp.value = false;
    }
  }

  Future<void> pickAndUploadKk(ImageSource source) async {
    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: source,
      maxWidth: 1600,
      maxHeight: 1200,
      imageQuality: 85,
    );
    if (image == null) return;

    isUploadingKk.value = true;
    try {
      final res = await _api.uploadKkPhoto(image.path);
      userProfile['fotoKartuKeluarga'] =
          res['fotoKartuKeluarga']?.toString() ?? image.path;
      userProfile.refresh();

      if (Get.isRegistered<ProfileController>()) {
        Get.find<ProfileController>().fetchProfile();
      }
      if (Get.isRegistered<HomeController>()) {
        Get.find<HomeController>().fetchData();
      }

      Get.snackbar(
        'Berhasil',
        'Foto Kartu Keluarga berhasil disimpan',
        backgroundColor: const Color(0xFF16A34A),
        colorText: Colors.white,
      );
    } catch (e) {
      Get.snackbar('Gagal Upload', 'Foto Kartu Keluarga gagal disimpan: $e');
    } finally {
      isUploadingKk.value = false;
    }
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
