import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../../../data/services/api_service.dart';

class TundaOffController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final isLoading = false.obs;
  final isSubmitting = false.obs;
  final items = <Map<String, dynamic>>[].obs;
  final tanggalOffAsal = Rxn<DateTime>();
  final tanggalOffBaru = Rxn<DateTime>();
  final alasanController = TextEditingController();

  final dateFormat = DateFormat('dd MMM yyyy', 'id');

  @override
  void onInit() {
    super.onInit();
    fetchItems();
  }

  @override
  void onClose() {
    alasanController.dispose();
    super.onClose();
  }

  Future<void> fetchItems() async {
    isLoading.value = true;
    try {
      final data = await _api.getMyTundaOff();
      items.value = data.map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (e) {
      Get.snackbar(
        'Gagal Memuat Tunda Off',
        e.toString(),
        backgroundColor: Colors.red.shade600,
        colorText: Colors.white,
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> pickDate(BuildContext context, {required bool isAsal}) async {
    final today = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate:
          (isAsal ? tanggalOffAsal.value : tanggalOffBaru.value) ?? today,
      firstDate: DateTime(today.year - 1),
      lastDate: today.add(const Duration(days: 180)),
      helpText: isAsal
          ? 'Pilih Tanggal OFF yang Ditunda'
          : 'Pilih Tanggal OFF Pengganti',
    );
    if (picked != null) {
      if (isAsal) {
        tanggalOffAsal.value = picked;
      } else {
        tanggalOffBaru.value = picked;
      }
    }
  }

  Future<void> submit() async {
    final alasan = alasanController.text.trim();
    if (tanggalOffAsal.value == null || tanggalOffBaru.value == null) {
      Get.snackbar(
        'Tanggal Wajib Diisi',
        'Pilih tanggal OFF yang ditunda dan tanggal pengganti.',
        backgroundColor: Colors.amber.shade700,
        colorText: Colors.white,
      );
      return;
    }
    if (alasan.length < 10) {
      Get.snackbar(
        'Alasan Terlalu Singkat',
        'Alasan minimal 10 karakter.',
        backgroundColor: Colors.amber.shade700,
        colorText: Colors.white,
      );
      return;
    }

    isSubmitting.value = true;
    try {
      await _api.createTundaOff(
        tanggalOffAsal: _apiDate(tanggalOffAsal.value!),
        tanggalOffBaru: _apiDate(tanggalOffBaru.value!),
        alasan: alasan,
      );
      Get.back();
      tanggalOffAsal.value = null;
      tanggalOffBaru.value = null;
      alasanController.clear();
      Get.snackbar(
        'Pengajuan Berhasil',
        'Pengajuan Tunda Off berhasil dikirim.',
        backgroundColor: Colors.green.shade600,
        colorText: Colors.white,
      );
      await fetchItems();
    } catch (e) {
      Get.snackbar(
        'Gagal Mengajukan',
        e.toString(),
        backgroundColor: Colors.red.shade600,
        colorText: Colors.white,
        duration: const Duration(seconds: 4),
      );
    } finally {
      isSubmitting.value = false;
    }
  }

  Future<void> cancel(int id) async {
    Get.defaultDialog(
      title: 'Batalkan Pengajuan',
      middleText:
          'Apakah Anda yakin ingin membatalkan pengajuan Tunda Off ini?',
      textConfirm: 'Ya, Batalkan',
      textCancel: 'Kembali',
      confirmTextColor: Colors.white,
      buttonColor: Colors.red.shade600,
      onConfirm: () async {
        Get.back();
        try {
          await _api.cancelTundaOff(id);
          Get.snackbar(
            'Berhasil',
            'Pengajuan berhasil dibatalkan.',
            backgroundColor: Colors.green.shade600,
            colorText: Colors.white,
          );
          await fetchItems();
        } catch (e) {
          Get.snackbar(
            'Gagal',
            e.toString(),
            backgroundColor: Colors.red.shade600,
            colorText: Colors.white,
          );
        }
      },
    );
  }

  String _apiDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}
