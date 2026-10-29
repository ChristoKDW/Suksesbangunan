import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/services/api_service.dart';
import '../../../components/app_alert.dart';

/// Pencairan (diuangkan) saldo RO & cuti tahunan.
/// Diajukan ke SPV → HRD; 1 hari = gaji pokok ÷ hari kerja periode,
/// dibayar di slip gaji periode saat HRD menyetujui.
class PencairanController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final isLoading = true.obs;
  final isSubmitting = false.obs;
  final saldoRo = 0.obs;
  final sisaCuti = 0.obs;
  final hakCuti = false.obs;
  final tahunCuti = DateTime.now().year.obs;
  final list = <Map<String, dynamic>>[].obs;

  final jenis = 'ro'.obs;
  final jumlahHari = 1.obs;
  final alasanController = TextEditingController();

  final _rupiah = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  String rp(dynamic v) => _rupiah.format(num.tryParse(v.toString()) ?? 0);

  int get maksHari => jenis.value == 'ro' ? saldoRo.value : sisaCuti.value;

  static const statusLabel = {
    'menunggu_spv': 'Menunggu SPV',
    'menunggu_hrd': 'Menunggu HRD',
    'disetujui': 'Disetujui',
    'ditolak_spv': 'Ditolak SPV',
    'ditolak_hrd': 'Ditolak HRD',
    'dibatalkan': 'Dibatalkan',
  };

  @override
  void onInit() {
    super.onInit();
    fetch();
  }

  @override
  void onClose() {
    alasanController.dispose();
    super.onClose();
  }

  Future<void> fetch() async {
    isLoading.value = true;
    try {
      final saldo = await _api.getSaldoPencairan();
      final cuti = Map<String, dynamic>.from((saldo['cuti'] as Map?) ?? {});
      saldoRo.value = (saldo['ro'] as num?)?.toInt() ?? 0;
      sisaCuti.value = (cuti['sisa'] as num?)?.toInt() ?? 0;
      hakCuti.value = cuti['hakCuti'] == true;
      tahunCuti.value = (cuti['tahun'] as num?)?.toInt() ?? DateTime.now().year;
      list.assignAll(
        (await _api.getMyPencairan()).map(
          (e) => Map<String, dynamic>.from(e as Map),
        ),
      );
    } catch (e) {
      _snack('Gagal memuat data', e.toString(), error: true);
    } finally {
      isLoading.value = false;
    }
  }

  void pilihJenis(String value) {
    jenis.value = value;
    jumlahHari.value = maksHari > 0 ? 1 : 0;
  }

  void ubahHari(int delta) {
    jumlahHari.value = (jumlahHari.value + delta).clamp(1, maksHari);
  }

  Future<void> ajukan() async {
    if (maksHari < 1) {
      _snack(
        'Saldo tidak cukup',
        jenis.value == 'ro'
            ? 'Anda belum memiliki saldo RO yang bisa dicairkan.'
            : 'Sisa cuti Anda tahun ini sudah habis.',
        error: true,
      );
      return;
    }
    isSubmitting.value = true;
    try {
      await _api.ajukanPencairan(
        jenis: jenis.value,
        jumlahHari: jumlahHari.value,
        alasan: alasanController.text.trim(),
      );
      Get.back();
      alasanController.clear();
      _snack('Pengajuan terkirim', 'Pencairan menunggu persetujuan.');
      fetch();
    } catch (e) {
      if (AppAlert.isBatasPengajuan(e)) {
        Get.back();
        await AppAlert.batasPengajuan(e);
        return;
      }
      _snack('Gagal mengajukan', e.toString(), error: true);
    } finally {
      isSubmitting.value = false;
    }
  }

  Future<void> batalkan(int id) async {
    try {
      await _api.batalkanPencairan(id);
      _snack('Dibatalkan', 'Pengajuan pencairan dibatalkan, saldo dikembalikan.');
      fetch();
    } catch (e) {
      _snack('Gagal membatalkan', e.toString(), error: true);
    }
  }

  void _snack(String title, String message, {bool error = false}) {
    Get.snackbar(
      title,
      message.replaceFirst('ApiException: ', ''),
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: error ? AppColors.redContainer : const Color(0xFFDCFCE7),
      colorText: error ? AppColors.redVariant : AppColors.success,
      margin: const EdgeInsets.all(12),
    );
  }
}
