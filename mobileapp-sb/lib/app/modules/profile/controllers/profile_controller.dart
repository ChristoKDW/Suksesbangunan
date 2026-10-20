import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/config/app_config.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/session_service.dart';

import '../../home/controllers/home_controller.dart';

class ProfileController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final isLoading = true.obs;
  final userProfile = <String, dynamic>{}.obs;
  final isUploadingPhoto = false.obs;

  @override
  void onInit() {
    super.onInit();
    fetchProfile();
  }

  Future<void> fetchProfile() async {
    isLoading.value = true;
    try {
      final data = await _api.getMyProfile();
      userProfile.assignAll(data);
    } catch (e) {
      Get.snackbar('Error', 'Gagal memuat profil: $e',
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isLoading.value = false;
    }
  }

  bool get isFaceRegistered => userProfile['sudahRegistrasiWajah'] ?? false;

  /// URL lengkap foto profil dari server.
  String? get profilePhotoUrl {
    final path = userProfile['fotoProfil']?.toString();
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final clean = path.replaceAll('\\', '/');
    return '${AppConfig.baseUrl}${clean.startsWith('/') ? '' : '/'}$clean';
  }

  /// Pick foto dari galeri/kamera lalu upload ke server.
  Future<void> pickAndUploadPhoto() async {
    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 80,
    );
    if (image == null) return;

    isUploadingPhoto.value = true;
    try {
      final result = await _api.uploadProfilePhoto(image.path);
      final photoUrl = result['fotoProfil'];
      // Update userProfile reactive map di profil
      userProfile['fotoProfil'] = photoUrl;
      userProfile.refresh();

      // Sinkronkan ke HomeController agar avatar di Beranda langsung berubah
      if (Get.isRegistered<HomeController>()) {
        final home = Get.find<HomeController>();
        home.userProfile['fotoProfil'] = photoUrl;
        home.userProfile.refresh();
      }

      Get.snackbar('Berhasil', 'Foto profil berhasil diperbarui',
          snackPosition: SnackPosition.BOTTOM);
    } catch (e) {
      Get.snackbar('Error', 'Gagal upload foto: $e',
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isUploadingPhoto.value = false;
    }
  }

  void logout() {
    Get.find<SessionService>().clear();
    Get.offAllNamed('/login');
  }

  bool get hasKtp {
    final ktp = userProfile['fotoKtp']?.toString();
    return ktp != null && ktp.trim().isNotEmpty;
  }

  bool get hasKk {
    final kk = userProfile['fotoKartuKeluarga']?.toString();
    return kk != null && kk.trim().isNotEmpty;
  }

  bool get isDokumenLengkap => hasKtp && hasKk;

  final isUploadingKtp = false.obs;
  final isUploadingKk = false.obs;

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
      Get.snackbar('Berhasil', 'Foto KTP berhasil disimpan',
          backgroundColor: const Color(0xFF16A34A), colorText: Colors.white);
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
      userProfile['fotoKartuKeluarga'] = res['fotoKartuKeluarga']?.toString() ?? image.path;
      userProfile.refresh();
      Get.snackbar('Berhasil', 'Foto Kartu Keluarga berhasil disimpan',
          backgroundColor: const Color(0xFF16A34A), colorText: Colors.white);
    } catch (e) {
      Get.snackbar('Gagal Upload', 'Foto Kartu Keluarga gagal disimpan: $e');
    } finally {
      isUploadingKk.value = false;
    }
  }
}
