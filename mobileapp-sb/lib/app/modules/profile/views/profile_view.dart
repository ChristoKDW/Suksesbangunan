import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../routes/app_pages.dart';
import '../controllers/profile_controller.dart';

// ponytail: Detail page WITH AppBar for standard back navigation.
class ProfileView extends GetView<ProfileController> {
  const ProfileView({super.key});

  String _initialsOf(String name) {
    final parts =
        name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return 'KA';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1))
        .toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil Saya'),
        elevation: 0,
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        final user = controller.userProfile;
        final nama = user['nama']?.toString() ?? 'Karyawan Aktif';

        return SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // -- Avatar with photo upload --
              _buildAvatar(nama),
              const SizedBox(height: 16),
              Text(
                nama,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 4),
              Text(
                user['jabatan']?.toString() ?? 'Staff',
                style:
                    const TextStyle(color: AppColors.slateLight, fontSize: 14),
              ),
              const SizedBox(height: 32),
              // -- Info Items --
              _buildInfoTile(Icons.badge_outlined, 'NIK',
                  user['nik']?.toString() ?? '-'),
              _buildInfoTile(Icons.apartment_outlined, 'Departemen',
                  user['departemen']?.toString() ?? '-'),
              _buildInfoTile(Icons.email_outlined, 'Email',
                  user['email']?.toString() ?? '-'),
              _buildInfoTile(Icons.phone_outlined, 'Telepon',
                  user['nomorTelepon']?.toString() ?? '-'),
              _buildInfoTile(Icons.work_outline, 'Status Kepegawaian',
                  user['statusAktif']?.toString() ?? '-'),
              _buildInfoTile(
                Icons.face,
                'Status Biometrik',
                controller.isFaceRegistered
                    ? 'Terdaftar'
                    : 'Belum Terdaftar',
              ),
              const SizedBox(height: 24),
              // -- Settings Button --
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    await Get.toNamed(Routes.SETTINGS);
                    // Refresh profile data after returning from settings
                    controller.fetchProfile();
                  },
                  icon: const Icon(Icons.settings_outlined),
                  label: const Text('Pengaturan Akun'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.slateDark,
                    side: const BorderSide(color: AppColors.borderGrey),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              // -- Logout Button --
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: controller.logout,
                  icon: const Icon(Icons.logout),
                  label: const Text('Keluar'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: BorderSide(color: AppColors.error),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildAvatar(String nama) {
    return Obx(() {
      final photoUrl = controller.profilePhotoUrl;
      final isUploading = controller.isUploadingPhoto.value;

      return GestureDetector(
        onTap: isUploading ? null : controller.pickAndUploadPhoto,
        child: Stack(
          children: [
            ClipOval(
              child: SizedBox(
                width: 104,
                height: 104,
                child: photoUrl != null
                    ? Image.network(
                        photoUrl,
                        width: 104,
                        height: 104,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: AppColors.redContainer,
                          alignment: Alignment.center,
                          child: Text(
                            _initialsOf(nama),
                            style: const TextStyle(
                              color: AppColors.redPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 28,
                            ),
                          ),
                        ),
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return Container(
                            color: AppColors.redContainer,
                            alignment: Alignment.center,
                            child: const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          );
                        },
                      )
                    : Container(
                        color: AppColors.redContainer,
                        alignment: Alignment.center,
                        child: Text(
                          _initialsOf(nama),
                          style: const TextStyle(
                            color: AppColors.redPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 28,
                          ),
                        ),
                      ),
              ),
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.redPrimary,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.white, width: 2),
                ),
                child: isUploading
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          color: AppColors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Icon(
                        Icons.camera_alt,
                        size: 14,
                        color: AppColors.white,
                      ),
              ),
            ),
          ],
        ),
      );
    });
  }

  Widget _buildInfoTile(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.redContainer,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.redPrimary, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: AppColors.slateLight,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    color: AppColors.slateDark,
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
