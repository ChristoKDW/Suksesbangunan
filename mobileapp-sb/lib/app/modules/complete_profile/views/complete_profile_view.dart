import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

import '../../../components/custom_button.dart';
import '../../../components/custom_text_field.dart';
import '../../../core/theme/app_colors.dart';
import '../controllers/complete_profile_controller.dart';

class CompleteProfileView extends GetView<CompleteProfileController> {
  const CompleteProfileView({super.key});

  void _showPicker(
    BuildContext context, {
    required String title,
    required Function(ImageSource) onPicked,
  }) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.slateDark,
                ),
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.camera_alt, color: AppColors.redPrimary),
                title: const Text('Ambil dengan Kamera'),
                onTap: () {
                  Navigator.pop(ctx);
                  onPicked(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: AppColors.redPrimary),
                title: const Text('Pilih dari Galeri'),
                onTap: () {
                  Navigator.pop(ctx);
                  onPicked(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhotoUploadCard({
    required BuildContext context,
    required String title,
    required String subtitle,
    required RxnString serverPath,
    required RxnString localPath,
    required RxBool isUploading,
    required VoidCallback onTap,
  }) {
    return Obx(() {
      final hasLocal = localPath.value != null && localPath.value!.isNotEmpty;
      final hasServer = serverPath.value != null && serverPath.value!.isNotEmpty;
      final serverUrl = controller.fullUrl(serverPath.value);

      return Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceWhite,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: (hasLocal || hasServer) ? AppColors.success : const Color(0xFFCBD5E1),
            width: (hasLocal || hasServer) ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  (hasLocal || hasServer)
                      ? Icons.check_circle
                      : Icons.upload_file_outlined,
                  color: (hasLocal || hasServer)
                      ? AppColors.success
                      : AppColors.slateLight,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppColors.slateDark,
                        ),
                      ),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.slateLight,
                        ),
                      ),
                    ],
                  ),
                ),
                if (isUploading.value)
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else
                  TextButton.icon(
                    onPressed: onTap,
                    icon: Icon(
                      (hasLocal || hasServer) ? Icons.edit : Icons.add_a_photo,
                      size: 16,
                      color: AppColors.redPrimary,
                    ),
                    label: Text(
                      (hasLocal || hasServer) ? 'Ganti' : 'Pilih',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.redPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
            if (hasLocal || hasServer) ...[
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(
                  height: 140,
                  width: double.infinity,
                  child: hasLocal
                      ? Image.file(
                          File(localPath.value!),
                          fit: BoxFit.cover,
                        )
                      : Image.network(
                          serverUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const Center(
                            child: Icon(Icons.broken_image, size: 40, color: Colors.grey),
                          ),
                        ),
                ),
              ),
            ],
          ],
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        title: const Text(
          'Lengkapi Data Karyawan',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.slateDark,
        elevation: 0,
        centerTitle: false,
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.redPrimary),
          );
        }

        return SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Info Banner
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.redContainer.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.redSoft),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.info_outline, color: AppColors.redPrimary, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Data diri wajib dilengkapi sebelum mendaftarkan biometrik wajah. Foto KTP & KK dapat diunggah sekarang atau menyusul di halaman profil.',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.redVariant.withOpacity(0.9),
                            height: 1.3,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // SECTION 1: FOTO KTP
                const Text(
                  '1. Foto Dokumen KTP (Opsional / Bisa Menyusul)',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.slateDark,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Foto KTP harus jelas, terbaca, dan tidak terpotong',
                  style: TextStyle(fontSize: 12, color: AppColors.slateLight),
                ),
                const SizedBox(height: 12),
                _buildPhotoUploadCard(
                  context: context,
                  title: 'Foto e-KTP Asli',
                  subtitle: 'Format JPG/PNG, pastikan teks NIK dan alamat jelas',
                  serverPath: controller.fotoKtpPath,
                  localPath: controller.localKtpPath,
                  isUploading: controller.isUploadingKtp,
                  onTap: () => _showPicker(
                    context,
                    title: 'Upload Foto KTP',
                    onPicked: controller.pickKtpPhoto,
                  ),
                ),

                const SizedBox(height: 12),

                // SECTION 2: DATA TERKUNCI (READ-ONLY)
                const Text(
                  '2. Akun & Data Terverifikasi (Terkunci)',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.slateDark,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Data berikut sudah terdaftar di sistem dan tidak dapat diubah di aplikasi',
                  style: TextStyle(fontSize: 12, color: AppColors.slateLight),
                ),
                const SizedBox(height: 12),

                CustomTextField(
                  controller: controller.nikController,
                  label: 'Nomor Induk Kependudukan (NIK)',
                  prefixIcon: Icons.badge_outlined,
                  enabled: false,
                ),
                CustomTextField(
                  controller: controller.namaController,
                  label: 'Nama Lengkap (Sesuai KTP)',
                  prefixIcon: Icons.person_outline,
                  enabled: false,
                ),
                CustomTextField(
                  controller: controller.emailController,
                  label: 'Email Akun',
                  prefixIcon: Icons.email_outlined,
                  enabled: false,
                ),

                const SizedBox(height: 12),

                // SECTION 3: DATA PRIBADI & KEPENDUDUKAN
                const Text(
                  '3. Data Diri & Domisili (Sesuai KTP)',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.slateDark,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Periksa dan lengkapi data kependudukan berikut ini',
                  style: TextStyle(fontSize: 12, color: AppColors.slateLight),
                ),
                const SizedBox(height: 12),

                CustomTextField(
                  controller: controller.namaPanggilanController,
                  label: 'Nama Panggilan',
                  hint: 'Contoh: Budi',
                  prefixIcon: Icons.badge,
                ),
                CustomTextField(
                  controller: controller.nomorTeleponController,
                  label: 'Nomor WhatsApp / HP',
                  hint: 'Contoh: 081234567890',
                  prefixIcon: Icons.phone_android,
                  keyboardType: TextInputType.phone,
                ),
                CustomTextField(
                  controller: controller.tempatLahirController,
                  label: 'Tempat Lahir (Sesuai KTP)',
                  hint: 'Kota / Kabupaten tempat lahir',
                  prefixIcon: Icons.location_city_outlined,
                ),

                // Tanggal Lahir (Picker)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: TextField(
                    controller: controller.tanggalLahirController,
                    readOnly: true,
                    onTap: () => controller.pickDate(context),
                    decoration: const InputDecoration(
                      labelText: 'Tanggal Lahir',
                      hintText: 'YYYY-MM-DD',
                      prefixIcon: Icon(Icons.calendar_today_outlined, size: 20),
                      suffixIcon: Icon(Icons.arrow_drop_down),
                    ),
                  ),
                ),

                // Agama Dropdown
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Obx(() => DropdownButtonFormField<String>(
                        value: controller.selectedAgama.value,
                        decoration: const InputDecoration(
                          labelText: 'Agama',
                          prefixIcon: Icon(Icons.mosque_outlined, size: 20),
                        ),
                        items: controller.listAgama
                            .map((ag) => DropdownMenuItem(
                                  value: ag,
                                  child: Text(ag),
                                ))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) controller.selectedAgama.value = val;
                        },
                      )),
                ),

                // Status Perkawinan Dropdown
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Obx(() => DropdownButtonFormField<String>(
                        value: controller.selectedStatusPerkawinan.value,
                        decoration: const InputDecoration(
                          labelText: 'Status Perkawinan',
                          prefixIcon: Icon(Icons.favorite_outline, size: 20),
                        ),
                        items: controller.listStatusPerkawinan
                            .map((st) => DropdownMenuItem(
                                  value: st,
                                  child: Text(st),
                                ))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) controller.selectedStatusPerkawinan.value = val;
                        },
                      )),
                ),

                CustomTextField(
                  controller: controller.namaIbuKandungController,
                  label: 'Nama Gadis Ibu Kandung',
                  hint: 'Nama lengkap ibu kandung',
                  prefixIcon: Icons.family_restroom_outlined,
                ),
                CustomTextField(
                  controller: controller.kotaTerbitKtpController,
                  label: 'Kota / Kabupaten Terbit KTP',
                  hint: 'Contoh: Makassar / Gowa',
                  prefixIcon: Icons.account_balance_outlined,
                ),
                CustomTextField(
                  controller: controller.kabupatenController,
                  label: 'Kabupaten / Kota Tempat Tinggal',
                  hint: 'Contoh: Gowa / Makassar',
                  prefixIcon: Icons.home_work_outlined,
                ),
                CustomTextField(
                  controller: controller.kecamatanController,
                  label: 'Kecamatan',
                  hint: 'Contoh: Somba Opu',
                  prefixIcon: Icons.map_outlined,
                ),
                CustomTextField(
                  controller: controller.kelurahanController,
                  label: 'Kelurahan / Desa',
                  hint: 'Contoh: Sungguminasa',
                  prefixIcon: Icons.signpost_outlined,
                ),
                CustomTextField(
                  controller: controller.rtRwController,
                  label: 'RT / RW',
                  hint: 'Contoh: 001/002',
                  prefixIcon: Icons.numbers_outlined,
                ),

                const SizedBox(height: 12),

                // SECTION 4: FOTO KK & FOTO PROFIL
                const Text(
                  '4. Dokumen Tambahan & Foto Profil',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.slateDark,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Foto Kartu Keluarga (KK) dan foto profil formal',
                  style: TextStyle(fontSize: 12, color: AppColors.slateLight),
                ),
                const SizedBox(height: 12),

                _buildPhotoUploadCard(
                  context: context,
                  title: 'Foto Kartu Keluarga (KK)',
                  subtitle: 'Format JPG/PNG, pastikan nomor KK dan anggota jelas',
                  serverPath: controller.fotoKkPath,
                  localPath: controller.localKkPath,
                  isUploading: controller.isUploadingKk,
                  onTap: () => _showPicker(
                    context,
                    title: 'Upload Foto Kartu Keluarga',
                    onPicked: controller.pickKkPhoto,
                  ),
                ),

                _buildPhotoUploadCard(
                  context: context,
                  title: 'Foto Profil Karyawan',
                  subtitle: 'Foto formal tampak depan dengan pakaian rapi',
                  serverPath: controller.fotoProfilPath,
                  localPath: controller.localProfilPath,
                  isUploading: controller.isUploadingProfil,
                  onTap: () => _showPicker(
                    context,
                    title: 'Upload Foto Profil',
                    onPicked: controller.pickProfilePhoto,
                  ),
                ),

                const SizedBox(height: 24),

                // SUBMIT BUTTON
                Obx(() => CustomButton(
                      label: 'Simpan & Lanjut ke Registrasi Wajah',
                      onPressed: controller.submitAndProceed,
                      isLoading: controller.isSubmitting.value,
                    )),
                const SizedBox(height: 32),
              ],
            ),
          ),
        );
      }),
    );
  }
}
