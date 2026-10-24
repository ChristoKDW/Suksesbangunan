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

  // Jadwal nyata milik user pemohon pada tanggalPemohon
  final mySchedule = Rxn<Map<String, dynamic>>();
  final isLoadingMySchedule = false.obs;

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
    await fetchMySchedule();
    fetchPeers();
  }

  @override
  void onClose() {
    alasanController.dispose();
    super.onClose();
  }

  /// Mengambil jadwal nyata pemohon pada tanggal yang dipilih
  Future<void> fetchMySchedule() async {
    if (tanggalPemohon.value == null) return;
    isLoadingMySchedule.value = true;
    try {
      final tglStr = dateFormat.format(tanggalPemohon.value!);
      final res = await _api.getMySchedule(tanggal: tglStr);
      mySchedule.value = res;

      if (jenisPertukaran.value == 'shift') {
        if (res['isOff'] == true || res['isCuti'] == true) {
          idShiftPemohon.value = null;
        } else if (res['idShift'] != null) {
          idShiftPemohon.value = res['idShift'] as int;
        } else {
          idShiftPemohon.value = null;
        }
      }
    } catch (e) {
      mySchedule.value = null;
      idShiftPemohon.value = null;
    } finally {
      isLoadingMySchedule.value = false;
    }
  }

  /// Mengambil kandidat rekan kerja pada tanggalTarget
  Future<void> fetchPeers() async {
    if (tanggalTarget.value == null) return;
    isLoadingPeers.value = true;
    selectedPeer.value = null;
    idShiftTarget.value = null;

    try {
      final tglStr = dateFormat.format(tanggalTarget.value!);
      final res = await _api.getAvailablePeers(
        tanggalTarget: tglStr,
        jenisPertukaran: jenisPertukaran.value,
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
    selectedPeer.value = null;
    idShiftTarget.value = null;
    if (jenis == 'shift') {
      tanggalTarget.value = tanggalPemohon.value;
    }
    fetchMySchedule();
    fetchPeers();
  }

  void setTanggalPemohon(DateTime picked) {
    tanggalPemohon.value = picked;
    if (jenisPertukaran.value == 'shift') {
      tanggalTarget.value = picked;
    }
    fetchMySchedule();
    fetchPeers();
  }

  void setTanggalTarget(DateTime picked) {
    tanggalTarget.value = picked;
    fetchPeers();
  }

  void selectPeer(Map<String, dynamic> peer) {
    selectedPeer.value = peer;
    if (jenisPertukaran.value == 'shift') {
      final currentShift = peer['currentShift'];
      if (currentShift != null && currentShift['idShift'] != null) {
        idShiftTarget.value = currentShift['idShift'] as int;
      } else {
        idShiftTarget.value = null;
      }
    } else {
      idShiftTarget.value = null;
    }
  }

  /// Cek validasi form sebelum tombol submit aktif
  bool get canSubmit {
    if (isSubmitting.value) return false;
    if (selectedPeer.value == null) return false;
    if (tanggalPemohon.value == null || tanggalTarget.value == null) return false;

    if (jenisPertukaran.value == 'shift') {
      if (mySchedule.value?['isOff'] == true || mySchedule.value?['isCuti'] == true) return false;
      if (idShiftPemohon.value == null) return false;
      if (idShiftTarget.value == null) return false;
    } else if (jenisPertukaran.value == 'off') {
      if (mySchedule.value?['isOff'] != true) return false;
      if (selectedPeer.value?['isOff'] != true) return false;
    }
    return true;
  }

  Future<void> submitPertukaran() async {
    if (!canSubmit) {
      if (selectedPeer.value == null) {
        Get.snackbar('Validasi', 'Silakan pilih rekan kerja yang ingin diajak bertukar',
            backgroundColor: AppColors.redContainer, colorText: AppColors.redPrimary);
      } else if (jenisPertukaran.value == 'shift' && mySchedule.value?['isOff'] == true) {
        Get.snackbar('Validasi', 'Anda berstatus libur pada tanggal ini, pilih tanggal saat Anda bertugas',
            backgroundColor: AppColors.redContainer, colorText: AppColors.redPrimary);
      }
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
