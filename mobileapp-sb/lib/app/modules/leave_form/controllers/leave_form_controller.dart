import 'package:flutter/material.dart';
import 'package:get/get.dart';

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
    }
  }

  Future<void> pickDateRange(BuildContext context) async {
    final DateTime now = DateTime.now();
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: now.subtract(const Duration(days: 30)),
      lastDate: now.add(const Duration(days: 90)),
      initialDateRange: selectedDateRange.value,
      builder: (context, child) {
        return Theme(
          data: AppTheme.datePickerTheme(context),
          child: child!,
        );
      },
    );

    if (picked != null) {
      selectedDateRange.value = picked;
      // Calculate total days including both start and end dates
      totalDays.value = picked.end.difference(picked.start).inDays + 1;
    }
  }

  void pickAttachment() {
    // ponytail: nama file lokal saja; upload lampiran belum didukung API.
    attachedFileName.value = 'dokumen_pendukung_${DateTime.now().millisecondsSinceEpoch}.jpg';
  }

  void removeAttachment() {
    attachedFileName.value = null;
  }

  Future<void> submit() async {
    if (selectedDateRange.value == null) {
      Get.snackbar(
        'Peringatan', 
        'Silakan pilih rentang tanggal.', 
        backgroundColor: AppColors.warning.withValues(alpha: 0.2), 
        colorText: AppColors.warning,
      );
      return;
    }
    
    if (reasonController.text.trim().isEmpty) {
      Get.snackbar(
        'Peringatan', 
        'Silakan masukkan alasan pengajuan.',
        backgroundColor: AppColors.warning.withValues(alpha: 0.2), 
        colorText: AppColors.warning,
      );
      return;
    }

    final idKaryawan = _session.idKaryawan.value;
    if (idKaryawan == null) {
      Get.snackbar(
        'Error',
        'Sesi login tidak valid. Silakan login ulang.',
        backgroundColor: AppColors.error.withValues(alpha: 0.2),
        colorText: AppColors.error,
      );
      return;
    }

    final start = selectedDateRange.value!.start;
    final end = selectedDateRange.value!.end;
    
    // ponytail: Avoid intl package dependency by using simple padding
    String formatDate(DateTime d) => "${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}";

    isSubmitting.value = true;
    try {
      await _api.submitLeaveRequest(
        idKaryawan: idKaryawan,
        jenisIzin: selectedTypeCode.value,
        tanggalMulai: formatDate(start),
        tanggalSelesai: formatDate(end),
        alasan: reasonController.text.trim(),
      );

      Get.back(result: true); // Pop form page, tandai perlu refresh
      Get.snackbar(
        'Sukses', 
        'Pengajuan berhasil dikirim.',
        backgroundColor: AppColors.success.withValues(alpha: 0.2),
        colorText: AppColors.success,
        margin: const EdgeInsets.all(16),
        snackPosition: SnackPosition.TOP,
      );
    } catch (e) {
      Get.snackbar(
        'Gagal',
        e.toString(),
        backgroundColor: AppColors.error.withValues(alpha: 0.2),
        colorText: AppColors.error,
        margin: const EdgeInsets.all(16),
        snackPosition: SnackPosition.TOP,
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
