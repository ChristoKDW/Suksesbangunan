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
              const SizedBox(height: 16),
              // -- Section: Dokumen Identitas (KTP & KK) --
              _buildDocumentSection(context),
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

  Widget _buildDocumentSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.redContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.assignment_ind_outlined,
                  color: AppColors.redPrimary, size: 20),
            ),
            const SizedBox(width: 12),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Dokumen Identitas',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: AppColors.slateDark,
                  ),
                ),
                Text(
                  'Foto KTP & Kartu Keluarga (KK)',
                  style: TextStyle(fontSize: 11, color: AppColors.slateLight),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 14),
        Obx(() => _buildDocumentItem(
              context: context,
              title: 'Foto KTP',
              subtitle: 'Kartu Tanda Penduduk Republik Indonesia',
              hasFile: controller.hasKtp,
              fileUrl: controller.ktpPhotoUrl,
              isUploading: controller.isUploadingKtp.value,
              onUpload: () => _showUploadSheet(
                context,
                'Foto KTP',
                (source) => controller.pickAndUploadKtp(source),
              ),
              onPreview: () => _showPreviewDialog(
                context,
                'Foto KTP',
                controller.ktpPhotoUrl,
                () => _showUploadSheet(
                  context,
                  'Foto KTP',
                  (source) => controller.pickAndUploadKtp(source),
                ),
              ),
            )),
        const SizedBox(height: 12),
        Obx(() => _buildDocumentItem(
              context: context,
              title: 'Foto Kartu Keluarga (KK)',
              subtitle: 'Dokumen fisik Kartu Keluarga asli',
              hasFile: controller.hasKk,
              fileUrl: controller.kkPhotoUrl,
              isUploading: controller.isUploadingKk.value,
              onUpload: () => _showUploadSheet(
                context,
                'Foto Kartu Keluarga',
                (source) => controller.pickAndUploadKk(source),
              ),
              onPreview: () => _showPreviewDialog(
                context,
                'Foto Kartu Keluarga',
                controller.kkPhotoUrl,
                () => _showUploadSheet(
                  context,
                  'Foto Kartu Keluarga',
                  (source) => controller.pickAndUploadKk(source),
                ),
              ),
            )),
      ],
    );
  }

  Widget _buildDocumentItem({
    required BuildContext context,
    required String title,
    required String subtitle,
    required bool hasFile,
    required String? fileUrl,
    required bool isUploading,
    required VoidCallback onUpload,
    required VoidCallback onPreview,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasFile ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: hasFile ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  hasFile ? Icons.check_circle_rounded : Icons.pending_actions_rounded,
                  color: hasFile ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: AppColors.slateDark,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: hasFile ? const Color(0xFFDCFCE7) : const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            hasFile ? 'Tersimpan' : 'Belum Ada',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: hasFile ? const Color(0xFF15803D) : const Color(0xFFB45309),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 11, color: AppColors.slateLight),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (hasFile) ...[
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onPreview,
                    icon: const Icon(Icons.visibility_outlined, size: 16),
                    label: const Text('Lihat Foto', style: TextStyle(fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF2563EB),
                      side: const BorderSide(color: Color(0xFF93C5FD)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
              ],
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: isUploading ? null : onUpload,
                  icon: isUploading
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Icon(hasFile ? Icons.sync : Icons.upload_file, size: 16),
                  label: Text(
                    isUploading
                        ? 'Menyimpan...'
                        : (hasFile ? 'Ganti Foto' : 'Upload Foto'),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: hasFile ? const Color(0xFF475569) : AppColors.redPrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showPreviewDialog(
    BuildContext context,
    String title,
    String? fileUrl,
    VoidCallback onReplace,
  ) {
    if (fileUrl == null || fileUrl.isEmpty) return;

    String resolvedUrl = fileUrl;
    if (fileUrl.contains('drive.google.com')) {
      final regExp = RegExp(r'[?&]id=([a-zA-Z0-9_-]+)');
      final match = regExp.firstMatch(fileUrl);
      if (match != null) {
        resolvedUrl = 'https://drive.google.com/thumbnail?id=${match.group(1)}&sz=w1000';
      }
    }

    Get.dialog(
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Container(
          constraints: const BoxConstraints(maxHeight: 560),
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.slateDark,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Get.back(),
                    icon: const Icon(Icons.close, size: 20),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const Divider(height: 20),
              Flexible(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: InteractiveViewer(
                    panEnabled: true,
                    minScale: 0.8,
                    maxScale: 3.5,
                    child: Image.network(
                      resolvedUrl,
                      fit: BoxFit.contain,
                      loadingBuilder: (context, child, progress) {
                        if (progress == null) return child;
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: CircularProgressIndicator(),
                          ),
                        );
                      },
                      errorBuilder: (context, error, stackTrace) => Container(
                        padding: const EdgeInsets.all(24),
                        color: const Color(0xFFF8FAFC),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.description_outlined,
                              size: 48,
                              color: Color(0xFF64748B),
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'Dokumen Tersimpan di Server HRD',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: Color(0xFF334155),
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Berkas dokumen Anda sudah tersimpan aman. Jika ingin memperbarui dengan foto fisik terbaru yang lebih jernih, gunakan tombol ganti foto di bawah.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Get.back(),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('Tutup'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Get.back();
                        onReplace();
                      },
                      icon: const Icon(Icons.camera_alt, size: 16),
                      label: const Text('Ganti Foto', style: TextStyle(fontSize: 12)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.redPrimary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
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
