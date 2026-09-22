import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../../../data/services/regular_off_service.dart';

class RegularOffController extends GetxController {
  final RegularOffService _service = Get.put(RegularOffService());

  final isLoading = true.obs;
  final isSubmitting = false.obs;

  // Eligibility
  final isOperasional = false.obs;
  final nonOperasionalReason = RxnString();

  // Saldo summary & items
  final totalTersedia = 0.obs;
  final totalDiajukan = 0.obs;
  final totalDigunakan = 0.obs;
  final totalHangus = 0.obs;
  final saldoList = <Map<String, dynamic>>[].obs;

  // Riwayat Pengajuan
  final pengajuanList = <Map<String, dynamic>>[].obs;

  // Selected Tab in RO page (0: Saldo & Info, 1: Riwayat Pengajuan)
  final activeTab = 0.obs;

  // Form State
  final selectedDates = <DateTime>[].obs;
  final alasanController = TextEditingController();

  final dateFormat = DateFormat('dd MMM yyyy', 'id');

  @override
  void onInit() {
    super.onInit();
    loadAllData();
  }

  @override
  void onClose() {
    alasanController.dispose();
    super.onClose();
  }

  Future<void> loadAllData() async {
    isLoading.value = true;
    try {
      final elig = await _service.checkEligibility();
      isOperasional.value = elig['isOperasional'] == true;
      nonOperasionalReason.value = elig['reason']?.toString();

      if (isOperasional.value) {
        await Future.wait([fetchSaldo(), fetchPengajuan()]);
      } else {
        saldoList.clear();
        pengajuanList.clear();
      }
    } catch (e) {
      Get.snackbar(
        'Gagal Memuat Regular Off',
        e.toString(),
        backgroundColor: Colors.red.shade600,
        colorText: Colors.white,
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchSaldo() async {
    try {
      final res = await _service.getMySaldo();
      totalTersedia.value = res['totalTersedia'] ?? 0;
      totalDiajukan.value = res['totalDiajukan'] ?? 0;
      totalDigunakan.value = res['totalDigunakan'] ?? 0;
      totalHangus.value = res['totalHangus'] ?? 0;

      if (res['items'] is List) {
        saldoList.value = (res['items'] as List)
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<void> fetchPengajuan() async {
    try {
      final list = await _service.getMyPengajuan();
      pengajuanList.value = list;
    } catch (e) {
      rethrow;
    }
  }

  void toggleDateSelection(DateTime date) {
    // Normalisasi date tanpa jam
    final d = DateTime(date.year, date.month, date.day);
    final existsIndex = selectedDates.indexWhere(
      (element) =>
          element.year == d.year &&
          element.month == d.month &&
          element.day == d.day,
    );

    if (existsIndex >= 0) {
      selectedDates.removeAt(existsIndex);
    } else {
      if (selectedDates.length >= totalTersedia.value) {
        Get.snackbar(
          'Batas Saldo RO',
          'Anda hanya memiliki ${totalTersedia.value} hari saldo RO aktif yang tersedia.',
          backgroundColor: Colors.amber.shade700,
          colorText: Colors.white,
          snackPosition: SnackPosition.BOTTOM,
        );
        return;
      }
      selectedDates.add(d);
      selectedDates.sort();
    }
  }

  bool isDateSelected(DateTime date) {
    return selectedDates.any(
      (element) =>
          element.year == date.year &&
          element.month == date.month &&
          element.day == date.day,
    );
  }

  Future<void> submitPengajuan() async {
    if (selectedDates.isEmpty) {
      Get.snackbar(
        'Pilih Tanggal',
        'Pilih minimal 1 tanggal untuk pengajuan Regular Off.',
        backgroundColor: Colors.red.shade600,
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
      );
      return;
    }

    final dateStrings = selectedDates.map((d) {
      return "${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}";
    }).toList();

    isSubmitting.value = true;
    try {
      await _service.submitPengajuan(
        tanggalDipilih: dateStrings,
        alasan: alasanController.text.trim().isEmpty
            ? null
            : alasanController.text.trim(),
      );

      Get.back(); // Tutup sheet/dialog
      selectedDates.clear();
      alasanController.clear();

      Get.snackbar(
        'Pengajuan Berhasil',
        'Pengajuan libur Regular Off telah dikirim ke Supervisor untuk persetujuan.',
        backgroundColor: Colors.green.shade600,
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
      );

      activeTab.value = 1; // Pindah ke tab riwayat
      await loadAllData();
    } catch (e) {
      Get.snackbar(
        'Gagal Mengajukan',
        e.toString().replaceAll('Exception:', '').trim(),
        backgroundColor: Colors.red.shade600,
        colorText: Colors.white,
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 4),
      );
    } finally {
      isSubmitting.value = false;
    }
  }

  Future<void> cancelPengajuan(int idPengajuan) async {
    Get.defaultDialog(
      title: 'Batalkan Pengajuan',
      middleText: 'Apakah Anda yakin ingin membatalkan pengajuan Regular Off ini? Saldo RO akan dikembalikan.',
      textConfirm: 'Ya, Batalkan',
      textCancel: 'Kembali',
      confirmTextColor: Colors.white,
      buttonColor: Colors.red.shade600,
      onConfirm: () async {
        Get.back();
        try {
          await _service.cancelPengajuan(idPengajuan);
          Get.snackbar(
            'Berhasil',
            'Pengajuan berhasil dibatalkan dan saldo RO telah dikembalikan.',
            backgroundColor: Colors.green.shade600,
            colorText: Colors.white,
          );
          await loadAllData();
        } catch (e) {
          Get.snackbar(
            'Gagal',
            e.toString().replaceAll('Exception:', '').trim(),
            backgroundColor: Colors.red.shade600,
            colorText: Colors.white,
          );
        }
      },
    );
  }
}
