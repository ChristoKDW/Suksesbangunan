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
}
