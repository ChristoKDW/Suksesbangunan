import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

import 'package:skeletonizer/skeletonizer.dart';
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
        final loading = controller.isLoading.value;
        final user = controller.userProfile;
        final nama = user['nama']?.toString() ?? 'Karyawan Aktif';

        return Skeletonizer(
          enabled: loading,
          child: RefreshIndicator(
          onRefresh: () async => await controller.fetchProfile(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
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
              const SizedBox(height: 24),
              // -- Warning Data Dokumen Belum Lengkap --
              if (!controller.isDokumenLengkap)
                _buildIncompleteWarningCard(context),
              // -- Info Items --
              _buildInfoTile(Icons.badge_outlined, 'NIK',
                  user['nik']?.toString() ?? '-'),
              _buildInfoTile(Icons.wc_outlined, 'Jenis Kelamin',
                  user['jenisKelamin']?.toString() ?? '-'),
              _buildInfoTile(Icons.calendar_today_outlined, 'Tanggal Masuk',
                  _formatDate(user['tanggalMasuk']?.toString())),
              _buildInfoTile(Icons.apartment_outlined, 'Departemen',
                  user['departemen']?.toString() ?? '-'),
              _buildInfoTile(Icons.email_outlined, 'Email',
                  user['email']?.toString() ?? '-'),
              _buildInfoTile(Icons.phone_outlined, 'Telepon',
                  user['nomorTelepon']?.toString() ?? '-'),
              _buildInfoTile(Icons.work_outline, 'Status Kepegawaian',
                  user['statusAktif']?.toString() ?? '-'),
              _buildInfoTile(Icons.category_outlined, 'Tipe Karyawan',
                  user['statusKaryawan']?.toString() ?? 'Internal'),
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
        ),
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

  String _formatDate(String? raw) {
    if (raw == null || raw.isEmpty) return '-';
    try {
      final clean = raw.contains('T') ? raw.split('T')[0] : raw;
      final parts = clean.split('-');
      if (parts.length == 3) {
        final year = int.parse(parts[0]);
        final month = int.parse(parts[1]);
        final day = int.parse(parts[2]);
        const months = [
          '',
          'Januari',
          'Februari',
          'Maret',
          'April',
          'Mei',
          'Juni',
          'Juli',
          'Agustus',
          'September',
          'Oktober',
          'November',
          'Desember'
        ];
        return '$day ${months[month]} $year';
      }
      return clean;
    } catch (_) {
      return raw;
    }
  }

  Widget _buildIncompleteWarningCard(BuildContext context) {
    final hasKtp = controller.hasKtp;
    final hasKk = controller.hasKk;

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.warning_amber_rounded,
                  color: Color(0xFFD97706), size: 22),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Data Dokumen Belum Lengkap',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Color(0xFFB45309),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Anda belum mengunggah ' +
                (!hasKtp && !hasKk
                    ? 'Foto KTP dan Kartu Keluarga (KK).'
                    : !hasKtp
                        ? 'Foto KTP.'
                        : 'Foto Kartu Keluarga (KK).') +
                ' Silakan unggah dokumen Anda agar data kepegawaian tuntas.',
            style: const TextStyle(
                fontSize: 12, color: Color(0xFF92400E), height: 1.4),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (!hasKtp)
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showUploadSheet(
                        context, 'Foto KTP', controller.pickAndUploadKtp),
                    icon: const Icon(Icons.upload_file, size: 16),
                    label: const Text('Unggah KTP',
                        style: TextStyle(fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFD97706),
                      side: const BorderSide(color: Color(0xFFD97706)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              if (!hasKtp && !hasKk) const SizedBox(width: 8),
              if (!hasKk)
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showUploadSheet(
                        context, 'Foto Kartu Keluarga', controller.pickAndUploadKk),
                    icon: const Icon(Icons.upload_file, size: 16),
                    label: const Text('Unggah KK',
                        style: TextStyle(fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFD97706),
                      side: const BorderSide(color: Color(0xFFD97706)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  void _showUploadSheet(BuildContext context, String title,
      Function(ImageSource) onPick) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Unggah $title',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined),
                title: const Text('Ambil dari Kamera'),
                onTap: () {
                  Navigator.pop(context);
                  onPick(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: const Text('Pilih dari Galeri'),
                onTap: () {
                  Navigator.pop(context);
                  onPick(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
