import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/services/api_service.dart';
class ExchangeFormController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final jenisPertukaran = 'shift'.obs; // 'shift' | 'off'
  final tanggalPemohon = Rxn<DateTime>(DateTime.now().add(const Duration(days: 1)));
  final tanggalTarget = Rxn<DateTime>(DateTime.now().add(const Duration(days: 1)));

  final idShiftPemohon = RxnInt();
  final idShiftTarget = RxnInt();

  final availableShifts = <Map<String, dynamic>>[].obs;
  final peerCandidates = <Map<String, dynamic>>[].obs;
  final selectedPeer = Rxn<Map<String, dynamic>>();

  final alasanController = TextEditingController();

  final isLoadingShifts = false.obs;
  final isLoadingPeers = false.obs;
  final isSubmitting = false.obs;
  final isEligible = true.obs;
  final ineligibilityReason = RxnString();

  final dateFormat = DateFormat('yyyy-MM-dd');
  final displayDateFormat = DateFormat('EEEE, dd MMMM yyyy', 'id');

  @override
  void onInit() {
    super.onInit();
    checkEligibilityAndInit();
  }

  Future<void> checkEligibilityAndInit() async {
    try {
      final res = await _api.checkExchangeEligibility();
      final operasional = res['isOperasional'] == true;
      isEligible.value = operasional;
      if (!operasional) {
        ineligibilityReason.value = res['reason']?.toString() ??
            'Fitur pertukaran jadwal hanya berlaku untuk divisi operasional yang dikelola oleh Supervisor (SPV).';
        Get.defaultDialog(
          title: 'Khusus Karyawan Operasional',
          middleText: ineligibilityReason.value!,
          textConfirm: 'Kembali',
          confirmTextColor: Colors.white,
          buttonColor: AppColors.redPrimary,
          onConfirm: () {
            Get.back();
            Get.back();
          },
        );
        return;
      }
    } catch (_) {}
    fetchShifts();
  }

  @override
  void onClose() {
    alasanController.dispose();
    super.onClose();
  }

  Future<void> fetchShifts() async {
    isLoadingShifts.value = true;
    try {
      final res = await _api.getShifts();
      availableShifts.value = res.cast<Map<String, dynamic>>();
      if (availableShifts.isNotEmpty) {
        idShiftPemohon.value = availableShifts[0]['idShift'];
        if (availableShifts.length > 1) {
          idShiftTarget.value = availableShifts[1]['idShift'];
        } else {
          idShiftTarget.value = availableShifts[0]['idShift'];
        }
      }
      fetchPeers();
    } catch (e) {
      Get.snackbar('Perhatian', 'Gagal memuat daftar shift: $e',
          backgroundColor: AppColors.redContainer, colorText: AppColors.redPrimary);
    } finally {
      isLoadingShifts.value = false;
    }
  }

  Future<void> fetchPeers() async {
    if (tanggalTarget.value == null) return;
    isLoadingPeers.value = true;
    selectedPeer.value = null;

    try {
      final tglStr = dateFormat.format(tanggalTarget.value!);
      final res = await _api.getAvailablePeers(
        tanggalTarget: tglStr,
        jenisPertukaran: jenisPertukaran.value,
        idShiftTarget: jenisPertukaran.value == 'shift' ? idShiftTarget.value : null,
      );
      peerCandidates.value = res.cast<Map<String, dynamic>>();
    } catch (e) {
      peerCandidates.clear();
      Get.snackbar('Perhatian', 'Gagal mencari rekan: $e',
          backgroundColor: AppColors.redContainer, colorText: AppColors.redPrimary);
    } finally {
      isLoadingPeers.value = false;
    }
  }

  void setJenisPertukaran(String jenis) {
    if (jenisPertukaran.value == jenis) return;
    jenisPertukaran.value = jenis;
    fetchPeers();
  }

  void setTanggalPemohon(DateTime picked) {
    tanggalPemohon.value = picked;
    if (jenisPertukaran.value == 'shift') {
      tanggalTarget.value = picked;
    }
    fetchPeers();
  }

  void setTanggalTarget(DateTime picked) {
    tanggalTarget.value = picked;
    fetchPeers();
  }

  void selectPeer(Map<String, dynamic> peer) {
    selectedPeer.value = peer;
  }

  Future<void> submitPertukaran() async {
    if (selectedPeer.value == null) {
      Get.snackbar('Validasi', 'Silakan pilih rekan kerja yang ingin diajak bertukar',
          backgroundColor: AppColors.redContainer, colorText: AppColors.redPrimary);
      return;
    }

    if (tanggalPemohon.value == null || tanggalTarget.value == null) {
      Get.snackbar('Validasi', 'Silakan tentukan tanggal pertukaran',
          backgroundColor: AppColors.redContainer, colorText: AppColors.redPrimary);
      return;
    }

    isSubmitting.value = true;
    try {
      final tglPemohonStr = dateFormat.format(tanggalPemohon.value!);
      final tglTargetStr = dateFormat.format(tanggalTarget.value!);
      final targetKaryawanId = selectedPeer.value!['idKaryawan'] as int;

      await _api.createPertukaran(
        idKaryawanTarget: targetKaryawanId,
        jenisPertukaran: jenisPertukaran.value,
        tanggalPemohon: tglPemohonStr,
        idShiftPemohon: jenisPertukaran.value == 'shift' ? idShiftPemohon.value : null,
        tanggalTarget: tglTargetStr,
        idShiftTarget: jenisPertukaran.value == 'shift' ? idShiftTarget.value : null,
        alasan: alasanController.text.trim(),
      );

      Get.back(result: true);
      Get.snackbar(
        'Berhasil Diajukan',
        'Permintaan pertukaran telah dikirim ke ${selectedPeer.value!['nama']} untuk konfirmasi.',
        backgroundColor: Colors.green.shade50,
        colorText: Colors.green.shade800,
        icon: const Icon(Icons.check_circle_outline, color: Colors.green),
        duration: const Duration(seconds: 4),
      );
    } catch (e) {
      Get.snackbar('Gagal Mengajukan', e.toString(),
          backgroundColor: AppColors.redContainer, colorText: AppColors.redPrimary);
    } finally {
      isSubmitting.value = false;
    }
  }
}
