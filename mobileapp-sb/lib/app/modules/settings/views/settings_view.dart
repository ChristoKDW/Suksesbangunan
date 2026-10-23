import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/theme/app_colors.dart';
import '../controllers/settings_controller.dart';

class SettingsView extends GetView<SettingsController> {
  const SettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pengaturan Akun'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // -- Section: Edit Profile --
            _buildSectionHeader(
              icon: Icons.person_outline,
              title: 'Informasi Profil',
              subtitle: 'Ubah nama, email, dan nomor telepon',
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: controller.namaController,
              label: 'Nama Lengkap',
              icon: Icons.person,
            ),
            const SizedBox(height: 14),
            _buildTextField(
              controller: controller.emailController,
              label: 'Email',
              icon: Icons.email_outlined,
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 14),
            _buildTextField(
              controller: controller.teleponController,
              label: 'Nomor Telepon',
              icon: Icons.phone_outlined,
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 16),
            Obx(() => SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: controller.isUpdatingProfile.value
                        ? null
                        : controller.updateProfile,
                    icon: controller.isUpdatingProfile.value
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                color: AppColors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.save_outlined),
                    label: Text(controller.isUpdatingProfile.value
                        ? 'Menyimpan...'
                        : 'Simpan Perubahan'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                )),
            const SizedBox(height: 36),

            // -- Section: Dokumen Identitas (KTP & KK) --
            _buildDocumentSection(context),
            const SizedBox(height: 36),

            // -- Section: Change Password --
            _buildSectionHeader(
              icon: Icons.lock_outline,
              title: 'Ganti Password',
              subtitle: 'Pastikan password baru minimal 6 karakter',
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: controller.currentPasswordController,
              label: 'Password Saat Ini',
              icon: Icons.lock,
              isPassword: true,
            ),
            const SizedBox(height: 14),
            _buildTextField(
              controller: controller.newPasswordController,
              label: 'Password Baru',
              icon: Icons.lock_reset,
              isPassword: true,
            ),
            const SizedBox(height: 14),
            _buildTextField(
              controller: controller.confirmPasswordController,
              label: 'Konfirmasi Password Baru',
              icon: Icons.lock_reset,
              isPassword: true,
            ),
            const SizedBox(height: 16),
            Obx(() => SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: controller.isChangingPassword.value
                        ? null
                        : controller.changePassword,
                    icon: controller.isChangingPassword.value
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                color: AppColors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.vpn_key),
                    label: Text(controller.isChangingPassword.value
                        ? 'Menyimpan...'
                        : 'Ganti Password'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.redVariant,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                )),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.redContainer,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.redPrimary, size: 22),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                  color: AppColors.slateDark,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  color: AppColors.slateLight,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    bool isPassword = false,
  }) {
    if (!isPassword) {
      return TextField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, size: 20),
        ),
      );
    }

    return Obx(() => TextField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: this.controller.isPasswordHidden.value,
          decoration: InputDecoration(
            labelText: label,
            prefixIcon: Icon(icon, size: 20),
            suffixIcon: IconButton(
              icon: Icon(
                this.controller.isPasswordHidden.value
                    ? Icons.visibility_off
                    : Icons.visibility,
                size: 20,
              ),
              onPressed: this.controller.togglePasswordVisibility,
            ),
          ),
        ));
  }

  Widget _buildDocumentSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader(
          icon: Icons.assignment_ind_outlined,
          title: 'Dokumen Identitas',
          subtitle: 'Upload atau perbarui foto KTP dan Kartu Keluarga',
        ),
        const SizedBox(height: 16),
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
        const SizedBox(height: 14),
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

  void _showUploadSheet(
    BuildContext context,
    String title,
    Function(ImageSource) onPick,
  ) {
    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Unggah $title',
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
              const SizedBox(height: 6),
              const Text(
                'Pilih sumber foto dokumen. Pastikan tulisan terbaca jelas.',
                style: TextStyle(fontSize: 12, color: AppColors.slateLight),
              ),
              const SizedBox(height: 20),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.redContainer,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.camera_alt, color: AppColors.redPrimary),
                ),
                title: const Text('Ambil Foto Kamera',
                    style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: const Text('Foto dokumen langsung secara vertikal/horizontal'),
                onTap: () {
                  Get.back();
                  onPick(ImageSource.camera);
                },
              ),
              const SizedBox(height: 8),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.photo_library, color: Color(0xFF2563EB)),
                ),
                title: const Text('Pilih dari Galeri',
                    style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: const Text('Gunakan foto dokumen yang sudah ada di HP'),
                onTap: () {
                  Get.back();
                  onPick(ImageSource.gallery);
                },
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
      isScrollControlled: true,
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
}
