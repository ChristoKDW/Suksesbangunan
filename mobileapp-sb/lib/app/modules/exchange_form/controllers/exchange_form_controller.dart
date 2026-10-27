import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/services/api_service.dart';
import '../../../components/app_alert.dart';

class ExchangeFormController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final jenisPertukaran = 'shift'.obs; // 'shift' | 'off'
  final tanggalPemohon = Rxn<DateTime>(DateTime.now().add(const Duration(days: 1)));
  final tanggalTarget = Rxn<DateTime>(DateTime.now().add(const Duration(days: 1)));

  final idShiftPemohon = RxnInt();
  final idShiftTarget = RxnInt();

  // Filter shift opsional pada Bagian 2 (null = Semua Shift)
  final selectedFilterShiftId = RxnInt();

  // Jadwal nyata milik user pemohon pada tanggalPemohon
  final mySchedule = Rxn<Map<String, dynamic>>();
  final isLoadingMySchedule = false.obs;

  final availableShifts = <Map<String, dynamic>>[].obs;
  final peerCandidates = <Map<String, dynamic>>[].obs;
  final selectedPeer = Rxn<Map<String, dynamic>>();
  final selectedPeerId = RxnInt();

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

    await fetchShifts();
    await _initSmartDefaultDate();
    await fetchPeers();
  }

  /// Cari tanggal terdekat di mana karyawan memiliki shift aktif (jika default besok kebetulan libur/OFF)
  Future<void> _initSmartDefaultDate() async {
    await fetchMySchedule();
    if (jenisPertukaran.value == 'shift' && idShiftPemohon.value == null) {
      final now = DateTime.now();
      for (int offset = 0; offset <= 6; offset++) {
        if (offset == 1) continue; // sudah dicek di atas
        final candidateDate = DateTime(now.year, now.month, now.day).add(Duration(days: offset));
        try {
          final tglStr = dateFormat.format(candidateDate);
          final res = await _api.getMySchedule(tanggal: tglStr);
          if (res['isOff'] != true && res['isCuti'] != true && res['idShift'] != null) {
            tanggalPemohon.value = candidateDate;
            tanggalTarget.value = candidateDate;
            mySchedule.value = res;
            idShiftPemohon.value = _parseInt(res['idShift']);
            return;
          }
        } catch (_) {}
      }
    }
  }

  Future<void> fetchShifts() async {
    isLoadingShifts.value = true;
    try {
      final res = await _api.getShifts();
      final mapped = res
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
      availableShifts.assignAll(mapped);
    } catch (_) {
      availableShifts.clear();
    } finally {
      isLoadingShifts.value = false;
    }
  }

  @override
  void onClose() {
    alasanController.dispose();
    super.onClose();
  }

  int? _parseInt(dynamic val) {
    if (val == null) return null;
    if (val is int) return val;
    if (val is num) return val.toInt();
    return int.tryParse(val.toString());
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
          idShiftPemohon.value = _parseInt(res['idShift']);
        } else if (res['shift'] is Map && res['shift']['idShift'] != null) {
          idShiftPemohon.value = _parseInt(res['shift']['idShift']);
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
    selectedPeerId.value = null;
    idShiftTarget.value = null;

    try {
      final tglStr = dateFormat.format(tanggalTarget.value!);
      final res = await _api.getAvailablePeers(
        tanggalTarget: tglStr,
        jenisPertukaran: jenisPertukaran.value,
      );
      final list = res
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
      peerCandidates.assignAll(list);

      // Jika filter shift aktif tidak ada di daftar kandidat baru, reset ke Semua Shift
      if (selectedFilterShiftId.value != null) {
        final hasShift = list.any((p) {
          final cs = p['currentShift'];
          final sid = cs is Map ? _parseInt(cs['idShift']) : null;
          return sid == selectedFilterShiftId.value;
        });
        if (!hasShift) {
          selectedFilterShiftId.value = null;
        }
      }
    } catch (e) {
      peerCandidates.clear();
      Get.snackbar(
        'Perhatian',
        e.toString(),
        backgroundColor: AppColors.redContainer,
        colorText: AppColors.redPrimary,
      );
    } finally {
      isLoadingPeers.value = false;
    }
  }

  /// Daftar rekan yang sudah difilter sesuai pilihan shift pada Bagian 2
  List<Map<String, dynamic>> get filteredPeers {
    final all = peerCandidates.toList();
    if (jenisPertukaran.value != 'shift') return all;
    final filterId = selectedFilterShiftId.value;
    if (filterId == null) return all;
    return all.where((p) {
      final cs = p['currentShift'];
      final sid = cs is Map ? _parseInt(cs['idShift']) : null;
      return sid == filterId;
    }).toList();
  }

  /// Pilihan filter shift beserta jumlah rekan yang terjadwal di shift tersebut pada tanggalTarget
  List<Map<String, dynamic>> get shiftFilterOptions {
    final Map<int, Map<String, dynamic>> map = {};
    for (final s in availableShifts) {
      final sid = _parseInt(s['idShift']);
      if (sid != null) {
        final jm = (s['jamMulai']?.toString() ?? '');
        final js = (s['jamSelesai']?.toString() ?? '');
        final jamStr = (jm.length >= 5 && js.length >= 5)
            ? '${jm.substring(0, 5)} - ${js.substring(0, 5)}'
            : '';
        map[sid] = {
          'idShift': sid,
          'namaShift': s['namaShift']?.toString() ?? 'Shift',
          'jam': jamStr,
          'count': 0,
        };
      }
    }
    for (final p in peerCandidates) {
      final cs = p['currentShift'];
      if (cs is Map) {
        final sid = _parseInt(cs['idShift']);
        if (sid != null) {
          if (!map.containsKey(sid)) {
            map[sid] = {
              'idShift': sid,
              'namaShift': cs['namaShift']?.toString() ?? 'Shift',
              'jam': cs['jam']?.toString() ?? '',
              'count': 1,
            };
          } else {
            map[sid]!['count'] = (map[sid]!['count'] as int) + 1;
          }
        }
      }
    }
    return map.values.toList();
  }

  void setFilterShift(int? idShift) {
    HapticFeedback.selectionClick();
    selectedFilterShiftId.value = idShift;

    final matches = filteredPeers;
    if (selectedPeerId.value != null) {
      final stillInList = matches.any((p) => _parseInt(p['idKaryawan']) == selectedPeerId.value);
      if (!stillInList) {
        selectedPeer.value = null;
        selectedPeerId.value = null;
        idShiftTarget.value = null;
      }
    }
    // Jika hanya ada 1 rekan pada shift yang dipilih, otomatis pilih rekan tersebut agar praktis
    if (idShift != null && matches.length == 1) {
      selectPeer(matches.first);
    }
  }

  void setJenisPertukaran(String jenis) {
    if (jenisPertukaran.value == jenis) return;
    HapticFeedback.selectionClick();
    jenisPertukaran.value = jenis;
    AppAlert.cekKuota(jenis == 'off' ? 'tukar_off' : 'tukar_shift');
    selectedFilterShiftId.value = null;
    selectedPeer.value = null;
    selectedPeerId.value = null;
    idShiftTarget.value = null;
    if (jenis == 'shift') {
      tanggalTarget.value = tanggalPemohon.value;
    } else {
      // Untuk tukar off, tanggal target harus berbeda dari tanggal pemohon
      if (tanggalPemohon.value != null &&
          tanggalTarget.value != null &&
          dateFormat.format(tanggalPemohon.value!) == dateFormat.format(tanggalTarget.value!)) {
        tanggalTarget.value = tanggalPemohon.value!.add(const Duration(days: 1));
      }
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
    HapticFeedback.selectionClick();
    final parsedId = _parseInt(peer['idKaryawan']);
    final peerCopy = Map<String, dynamic>.from(peer);
    selectedPeerId.value = parsedId;
    selectedPeer.value = peerCopy;
    selectedPeer.refresh();

    if (jenisPertukaran.value == 'shift') {
      final currentShift = peerCopy['currentShift'];
      if (currentShift is Map && currentShift['idShift'] != null) {
        idShiftTarget.value = _parseInt(currentShift['idShift']);
      } else if (peerCopy['idShift'] != null) {
        idShiftTarget.value = _parseInt(peerCopy['idShift']);
      } else {
        idShiftTarget.value = null;
      }
    } else {
      idShiftTarget.value = null;
    }
  }

  /// Cek validasi form sebelum tombol submit aktif penuh
  bool get canSubmit {
    if (isSubmitting.value) return false;
    if (selectedPeerId.value == null || selectedPeer.value == null) return false;
    if (tanggalPemohon.value == null || tanggalTarget.value == null) return false;

    if (jenisPertukaran.value == 'shift') {
      if (mySchedule.value?['isOff'] == true || mySchedule.value?['isCuti'] == true) return false;
      if (idShiftPemohon.value == null) return false;
      if (idShiftTarget.value == null) return false;
    } else if (jenisPertukaran.value == 'off') {
      if (mySchedule.value?['isOff'] != true) return false;
      if (selectedPeer.value?['isOff'] != true) return false;
      if (dateFormat.format(tanggalPemohon.value!) == dateFormat.format(tanggalTarget.value!)) {
        return false;
      }
    }
    return true;
  }

  Future<void> submitPertukaran() async {
    if (isSubmitting.value) return;

    if (selectedPeerId.value == null || selectedPeer.value == null) {
      Get.snackbar(
        'Pilih Rekan Kerja',
        'Silakan tekan salah satu nama rekan kerja / Supervisor pada daftar Bagian 3 terlebih dahulu.',
        backgroundColor: AppColors.redContainer,
        colorText: AppColors.redPrimary,
        snackPosition: SnackPosition.TOP,
      );
      return;
    }

    if (jenisPertukaran.value == 'shift') {
      if (mySchedule.value?['isOff'] == true) {
        Get.snackbar(
          'Status Anda Sedang Libur (OFF)',
          'Pada Tanggal Jadwal Anda (Bagian 1), Anda sedang Libur (OFF). Silakan ubah Tanggal Bagian 1 ke hari kerja Anda, atau gunakan tab "Tukar Hari Off".',
          backgroundColor: AppColors.redContainer,
          colorText: AppColors.redPrimary,
          duration: const Duration(seconds: 4),
        );
        return;
      }
      if (mySchedule.value?['isCuti'] == true) {
        Get.snackbar(
          'Sedang Cuti / Izin',
          'Jadwal Anda pada Tanggal Bagian 1 berstatus cuti/izin sehingga tidak dapat ditukar.',
          backgroundColor: AppColors.redContainer,
          colorText: AppColors.redPrimary,
        );
        return;
      }
      if (idShiftPemohon.value == null) {
        Get.snackbar(
          'Jadwal Anda Belum Ada',
          'Anda belum memiliki shift kerja tertulis pada Tanggal Bagian 1. Pilih tanggal saat Anda memiliki jadwal shift aktif.',
          backgroundColor: AppColors.redContainer,
          colorText: AppColors.redPrimary,
          duration: const Duration(seconds: 4),
        );
        return;
      }
      if (idShiftTarget.value == null) {
        Get.snackbar(
          'Shift Rekan Tidak Valid',
          'Rekan yang dipilih tidak memiliki shift kerja aktif pada tanggal yang dipilih.',
          backgroundColor: AppColors.redContainer,
          colorText: AppColors.redPrimary,
        );
        return;
      }
    } else if (jenisPertukaran.value == 'off') {
      if (mySchedule.value?['isOff'] != true) {
        Get.snackbar(
          'Bukan Hari Libur (OFF)',
          'Pada Tanggal Bagian 1 Anda tercatat masuk kerja. Untuk Tukar Hari Off, pilih tanggal saat Anda sedang berstatus Libur (OFF).',
          backgroundColor: AppColors.redContainer,
          colorText: AppColors.redPrimary,
          duration: const Duration(seconds: 4),
        );
        return;
      }
      if (selectedPeer.value?['isOff'] != true) {
        Get.snackbar(
          'Rekan Tidak Libur',
          'Rekan yang dipilih tidak sedang berstatus Libur (OFF) pada tanggal tersebut.',
          backgroundColor: AppColors.redContainer,
          colorText: AppColors.redPrimary,
        );
        return;
      }
      if (dateFormat.format(tanggalPemohon.value!) == dateFormat.format(tanggalTarget.value!)) {
        Get.snackbar(
          'Tanggal Harus Berbeda',
          'Pertukaran Hari Off harus menggunakan 2 tanggal berbeda (tanggal libur Anda dan tanggal libur rekan).',
          backgroundColor: AppColors.redContainer,
          colorText: AppColors.redPrimary,
          duration: const Duration(seconds: 4),
        );
        return;
      }
    }

    isSubmitting.value = true;
    try {
      final tglPemohonStr = dateFormat.format(tanggalPemohon.value!);
      final tglTargetStr = dateFormat.format(tanggalTarget.value!);
      final targetKaryawanId = selectedPeerId.value!;
      final peerName = selectedPeer.value?['nama']?.toString() ?? 'rekan kerja';

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
        'Permintaan pertukaran telah dikirim ke $peerName untuk konfirmasi.',
        backgroundColor: Colors.green.shade50,
        colorText: Colors.green.shade800,
        icon: const Icon(Icons.check_circle_outline, color: Colors.green),
        duration: const Duration(seconds: 4),
      );
    } catch (e) {
      if (AppAlert.isBatasPengajuan(e)) {
        await AppAlert.batasPengajuan(e);
        return;
      }
      Get.snackbar(
        'Gagal Mengajukan',
        e.toString(),
        backgroundColor: AppColors.redContainer,
        colorText: AppColors.redPrimary,
        duration: const Duration(seconds: 4),
      );
    } finally {
      isSubmitting.value = false;
    }
  }
}
