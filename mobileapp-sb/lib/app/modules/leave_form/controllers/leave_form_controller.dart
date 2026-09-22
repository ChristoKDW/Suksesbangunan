import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/session_service.dart';

class LeaveFormController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final SessionService _session = Get.find<SessionService>();

  final formKey = GlobalKey<FormState>();

  final RxString selectedType = 'Izin'.obs;
  final RxString selectedTypeCode = 'izin'.obs;
  final Rx<DateTimeRange?> selectedDateRange = Rx<DateTimeRange?>(null);
  final TextEditingController reasonController = TextEditingController();
  final RxnString attachedFileName = RxnString(null);
  final RxnString attachedFilePath = RxnString(null);
  final RxnString attachedFileSize = RxnString(null);
  final Rxn<Uint8List> attachedFileBytes = Rxn<Uint8List>(null);

  final RxInt totalDays = 0.obs;
  final isSubmitting = false.obs;
  final hasHakCuti = false.obs;
  final isLoadingProfile = true.obs;

  final Map<String, String> typeCodeMap = {
    'Izin': 'izin',
    'Sakit': 'sakit',
    'Cuti Tahunan': 'cuti',
  };

  @override
  void onInit() {
    super.onInit();
    _checkHakCuti();
  }

  Future<void> _checkHakCuti() async {
    isLoadingProfile.value = true;
    try {
      final profile = await _api.getMyProfile();
      hasHakCuti.value = profile['hakCuti'] == true;
    } catch (_) {
      hasHakCuti.value = false;
    } finally {
      isLoadingProfile.value = false;
    }
  }

  void onTypeChanged(String? type) {
    if (type != null) {
      if (type == 'Cuti Tahunan' && !hasHakCuti.value) {
        Get.snackbar(
          'Hak Cuti Belum Aktif',
          'Anda belum bisa cuti. Hak cuti tahunan Anda belum diaktifkan oleh HRD. Silakan hubungi HRD.',
          backgroundColor: AppColors.error.withValues(alpha: 0.2),
          colorText: AppColors.error,
          duration: const Duration(seconds: 4),
          snackPosition: SnackPosition.TOP,
          margin: const EdgeInsets.all(16),
        );
        selectedType.value = 'Izin';
        selectedTypeCode.value = 'izin';
        return;
      }
      selectedType.value = type;
      selectedTypeCode.value = typeCodeMap[type] ?? 'izin';

      // Aturan Izin: Maksimal 1 hari. Jika sebelumnya memilih rentang > 1 hari, ciutkan ke 1 hari pertama.
      if (selectedTypeCode.value == 'izin' && selectedDateRange.value != null) {
        final start = selectedDateRange.value!.start;
        selectedDateRange.value = DateTimeRange(start: start, end: start);
        totalDays.value = 1;
      }
    }
  }

  Future<void> pickDateRange(BuildContext context) async {
    final current = DateTime.now();
    final DateTime today = DateTime(current.year, current.month, current.day);

    // Khusus izin: Maksimal 1 hari -> Gunakan pemilih tanggal tunggal
    if (selectedTypeCode.value == 'izin') {
      final DateTime? picked = await showDatePicker(
        context: context,
        firstDate: today,
        lastDate: today.add(const Duration(days: 90)),
        initialDate: selectedDateRange.value?.start.isBefore(today) == true
            ? today
            : selectedDateRange.value?.start ?? today,
        helpText: 'Pilih Tanggal Izin (Maksimal 1 Hari)',
        builder: (context, child) {
          return Theme(data: AppTheme.datePickerTheme(context), child: child!);
        },
      );

      if (picked != null) {
        selectedDateRange.value = DateTimeRange(start: picked, end: picked);
        totalDays.value = 1;
      }
      return;
    }

    // Untuk Sakit & Cuti: Rentang tanggal
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: today,
      lastDate: today.add(const Duration(days: 90)),
      initialDateRange: selectedDateRange.value?.start.isBefore(today) == true
          ? null
          : selectedDateRange.value,
      helpText: selectedTypeCode.value == 'sakit'
          ? 'Pilih Rentang Tanggal Sakit'
          : 'Pilih Rentang Tanggal Cuti',
      builder: (context, child) {
        return Theme(data: AppTheme.datePickerTheme(context), child: child!);
      },
    );

    if (picked != null) {
      selectedDateRange.value = picked;
      // Calculate total days including both start and end dates
      totalDays.value = picked.end.difference(picked.start).inDays + 1;
    }
  }

  Future<void> pickAttachment() async {
    final action = await Get.bottomSheet<String>(
      Material(
        color: AppColors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        clipBehavior: Clip.antiAlias,
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Pilih Dokumen Pendukung',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.slateDark,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.close,
                        size: 20,
                        color: AppColors.slateLight,
                      ),
                      onPressed: () => Get.back(),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildAttachmentOption(
                  icon: Icons.folder_open,
                  iconColor: AppColors.redPrimary,
                  title: 'Buka File Perangkat',
                  subtitle: 'Pilih berkas PDF, DOC, DOCX, atau Gambar',
                  onTap: () => Get.back(result: 'file'),
                ),
                const Divider(height: 16, color: AppColors.borderGrey),
                _buildAttachmentOption(
                  icon: Icons.camera_alt,
                  iconColor: AppColors.info,
                  title: 'Kamera',
                  subtitle: 'Ambil foto surat dokter/dokumen secara langsung',
                  onTap: () => Get.back(result: 'camera'),
                ),
                const Divider(height: 16, color: AppColors.borderGrey),
                _buildAttachmentOption(
                  icon: Icons.photo_library,
                  iconColor: AppColors.success,
                  title: 'Galeri Foto',
                  subtitle: 'Pilih foto surat dari galeri gambar HP',
                  onTap: () => Get.back(result: 'gallery'),
                ),
              ],
            ),
          ),
        ),
      ),
      isScrollControlled: true,
    );

    if (action == null) return;
    if (action == 'file') {
      await _pickFile();
    } else if (action == 'camera') {
      await _pickImage(ImageSource.camera);
    } else if (action == 'gallery') {
      await _pickImage(ImageSource.gallery);
    }
  }

  Widget _buildAttachmentOption({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 22),
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
                      fontSize: 14,
                      color: AppColors.slateDark,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.slateLight,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right,
              color: AppColors.slateLight,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  Future<void> _pickFile() async {
    try {
      PlatformFile? file;
      try {
        file = await FilePicker.pickFile(
          type: FileType.custom,
          allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
        );
      } catch (_) {
        // Fallback jika perangkat membatasi mime types custom
        file = await FilePicker.pickFile(type: FileType.any);
      }

      if (file != null) {
        // file_picker v12: size property removed, use lengthSync() ?? await file.length()
        final int bytes = file.lengthSync() ?? await file.length();
        attachedFileSize.value = _formatFileSize(bytes);
        attachedFileName.value = file.name;
        attachedFilePath.value = file.path;
        // file_picker v12: read file content directly via readAsBytes()
        attachedFileBytes.value = await file.readAsBytes();
      }
    } catch (e) {
      Get.rawSnackbar(
        titleText: const Text(
          'Gagal Membuka File',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        messageText: Text(
          'Tidak dapat membuka pengelola file: $e',
          style: const TextStyle(color: AppColors.white, fontSize: 12),
        ),
        backgroundColor: AppColors.error,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
        icon: const Icon(Icons.error_outline_rounded, color: AppColors.white),
        duration: const Duration(seconds: 4),
      );
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: source,
        imageQuality: 85,
      );
      if (image != null) {
        final int bytes = await image.length();
        attachedFileSize.value = _formatFileSize(bytes);
        attachedFileName.value = image.name;
        attachedFilePath.value = image.path;
        attachedFileBytes.value = await image.readAsBytes();
      }
    } catch (e) {
      Get.rawSnackbar(
        titleText: const Text(
          'Gagal Mengambil Gambar',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        messageText: Text(
          'Tidak dapat mengakses kamera/galeri: $e',
          style: const TextStyle(color: AppColors.white, fontSize: 12),
        ),
        backgroundColor: AppColors.error,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
        icon: const Icon(Icons.error_outline_rounded, color: AppColors.white),
        duration: const Duration(seconds: 4),
      );
    }
  }

  void removeAttachment() {
    attachedFilePath.value = null;
    attachedFileName.value = null;
    attachedFileSize.value = null;
    attachedFileBytes.value = null;
  }

  void submit() => confirmAndSubmit();

  void confirmAndSubmit() {
    if (selectedDateRange.value == null) {
      Get.rawSnackbar(
        titleText: const Text(
          'Peringatan',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        messageText: const Text(
          'Silakan pilih rentang tanggal pengajuan.',
          style: TextStyle(color: AppColors.white, fontSize: 12),
        ),
        backgroundColor: AppColors.warning,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
        icon: const Icon(
          Icons.warning_amber_rounded,
          color: AppColors.white,
          size: 24,
        ),
        duration: const Duration(seconds: 3),
      );
      return;
    }

    if (reasonController.text.trim().isEmpty) {
      Get.rawSnackbar(
        titleText: const Text(
          'Peringatan',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        messageText: const Text(
          'Silakan masukkan alasan pengajuan.',
          style: TextStyle(color: AppColors.white, fontSize: 12),
        ),
        backgroundColor: AppColors.warning,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
        icon: const Icon(
          Icons.warning_amber_rounded,
          color: AppColors.white,
          size: 24,
        ),
        duration: const Duration(seconds: 3),
      );
      return;
    }

    // Validasi Aturan Izin: Maksimal 1 hari
    if (selectedTypeCode.value == 'izin' && totalDays.value > 1) {
      Get.rawSnackbar(
        titleText: const Text(
          'Batas Maksimal Izin',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        messageText: const Text(
          'Pengajuan izin maksimal 1 hari. Untuk izin lebih dari 1 hari, silakan ajukan cuti tahunan atau hubungi HRD.',
          style: TextStyle(color: AppColors.white, fontSize: 12),
        ),
        backgroundColor: AppColors.warning,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
        icon: const Icon(
          Icons.warning_amber_rounded,
          color: AppColors.white,
          size: 24,
        ),
        duration: const Duration(seconds: 4),
      );
      return;
    }

    // Validasi Aturan Sakit: Wajib unggah surat dokter
    if (selectedTypeCode.value == 'sakit') {
      final hasAttachment =
          (attachedFilePath.value != null &&
              attachedFilePath.value!.isNotEmpty) ||
          attachedFileBytes.value != null;
      if (!hasAttachment) {
        Get.rawSnackbar(
          titleText: const Text(
            'Dokumen Wajib',
            style: TextStyle(
              color: AppColors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          messageText: const Text(
            'Pengajuan izin sakit wajib melampirkan bukti surat keterangan dokter.',
            style: TextStyle(color: AppColors.white, fontSize: 12),
          ),
          backgroundColor: AppColors.error,
          snackPosition: SnackPosition.BOTTOM,
          margin: const EdgeInsets.all(16),
          borderRadius: 12,
          icon: const Icon(
            Icons.error_outline_rounded,
            color: AppColors.white,
            size: 24,
          ),
          duration: const Duration(seconds: 4),
        );
        return;
      }
    }

    final idKaryawan = _session.idKaryawan.value;
    if (idKaryawan == null) {
      Get.rawSnackbar(
        titleText: const Text(
          'Error',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        messageText: const Text(
          'Sesi login tidak valid. Silakan login ulang.',
          style: TextStyle(color: AppColors.white, fontSize: 12),
        ),
        backgroundColor: AppColors.error,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
        icon: const Icon(
          Icons.error_outline_rounded,
          color: AppColors.white,
          size: 24,
        ),
        duration: const Duration(seconds: 3),
      );
      return;
    }

    final start = selectedDateRange.value!.start;
    final end = selectedDateRange.value!.end;
    String formatDateDisplay(DateTime d) => "${d.day}/${d.month}/${d.year}";

    Get.bottomSheet(
      Container(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        decoration: const BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.redPrimary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.help_outline_rounded,
                      color: AppColors.redPrimary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Konfirmasi Pengajuan',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.slateDark,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Apakah Anda yakin ingin mengirim pengajuan ini?',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.slateLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Ringkasan Pengajuan
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surfaceWhite,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderGrey),
                ),
                child: Column(
                  children: [
                    _buildConfirmRow('Jenis Izin', selectedType.value),
                    const Divider(height: 14, color: AppColors.borderGrey),
                    _buildConfirmRow(
                      'Periode',
                      '${formatDateDisplay(start)} - ${formatDateDisplay(end)} (${totalDays.value} Hari)',
                    ),
                    const Divider(height: 14, color: AppColors.borderGrey),
                    _buildConfirmRow('Alasan', reasonController.text.trim()),
                    const Divider(height: 14, color: AppColors.borderGrey),
                    _buildConfirmRow(
                      'Dokumen',
                      attachedFileName.value != null
                          ? '${attachedFileName.value!}${attachedFileSize.value != null ? ' (${attachedFileSize.value})' : ''}'
                          : 'Tidak ada dokumen pendukung',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              // Action Buttons
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Get.back(); // Tutup confirmation bottomsheet
                    _executeSubmit();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.redPrimary,
                    foregroundColor: AppColors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Ya, Kirim Pengajuan',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Get.back(),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: AppColors.borderGrey),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Batalkan',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.slateLight,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      isScrollControlled: true,
    );
  }

  Widget _buildConfirmRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.slateLight,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        const Text(
          ': ',
          style: TextStyle(fontSize: 12, color: AppColors.slateLight),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.slateDark,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Future<void> _executeSubmit() async {
    final idKaryawan = _session.idKaryawan.value;
    if (idKaryawan == null) return;

    final start = selectedDateRange.value!.start;
    final end = selectedDateRange.value!.end;
    String formatDate(DateTime d) =>
        "${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}";

    isSubmitting.value = true;

    // Tampilkan bottom alert: Status Mengirim
    Get.rawSnackbar(
      titleText: const Text(
        'Mengirim Pengajuan',
        style: TextStyle(
          color: AppColors.white,
          fontWeight: FontWeight.bold,
          fontSize: 14,
        ),
      ),
      messageText: const Text(
        'Sedang mengunggah data dan dokumen pengajuan ke server...',
        style: TextStyle(color: AppColors.white, fontSize: 12),
      ),
      icon: const Padding(
        padding: EdgeInsets.all(4),
        child: SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: AppColors.white,
          ),
        ),
      ),
      backgroundColor: AppColors.slateDark,
      snackPosition: SnackPosition.BOTTOM,
      margin: const EdgeInsets.all(16),
      borderRadius: 12,
      duration: const Duration(seconds: 30),
      isDismissible: false,
    );

    try {
      await _api.submitLeaveRequest(
        idKaryawan: idKaryawan,
        jenisIzin: selectedTypeCode.value,
        tanggalMulai: formatDate(start),
        tanggalSelesai: formatDate(end),
        alasan: reasonController.text.trim(),
        filePath: attachedFilePath.value,
        fileBytes: attachedFileBytes.value,
        fileName: attachedFileName.value,
      );

      // Timer 3 detik saat mengirim data sebelum memunculkan alert sukses
      await Future.delayed(const Duration(seconds: 3));

      // Tutup bottom alert status mengirim
      if (Get.isSnackbarOpen) {
        Get.closeCurrentSnackbar();
      }

      // Tampilkan bottom alert sukses berwarna hijau
      Get.rawSnackbar(
        titleText: const Text(
          'Pengajuan Berhasil!',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        messageText: const Text(
          'Pengajuan izin Anda berhasil dikirim dan sedang diproses.',
          style: TextStyle(color: AppColors.white, fontSize: 12),
        ),
        icon: const Icon(
          Icons.check_circle_rounded,
          color: AppColors.white,
          size: 26,
        ),
        backgroundColor: AppColors.success, // Hijau (#16A34A)
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
        duration: const Duration(seconds: 3),
      );

      // Beri jeda agar user dapat melihat alert sukses sebelum kembali ke riwayat
      await Future.delayed(const Duration(milliseconds: 1500));
      Get.back(result: true); // Pop form page, tandai perlu refresh
    } catch (e) {
      // Tutup bottom alert status mengirim
      if (Get.isSnackbarOpen) {
        Get.closeCurrentSnackbar();
      }

      // Tampilkan bottom alert gagal
      Get.rawSnackbar(
        titleText: const Text(
          'Gagal Mengirim Pengajuan',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        messageText: Text(
          e.toString(),
          style: const TextStyle(color: AppColors.white, fontSize: 12),
        ),
        icon: const Icon(
          Icons.error_outline_rounded,
          color: AppColors.white,
          size: 26,
        ),
        backgroundColor: AppColors.error,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
        borderRadius: 12,
        duration: const Duration(seconds: 4),
      );
    } finally {
      isSubmitting.value = false;
    }
  }

  @override
  void onClose() {
    reasonController.dispose();
    super.onClose();
  }
}
