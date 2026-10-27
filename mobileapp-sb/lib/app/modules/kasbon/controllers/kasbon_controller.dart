import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/services/api_service.dart';

/// Kasbon karyawan: lihat sisa & riwayat cicilan, ajukan kasbon baru.
/// Cicilan dipotong otomatis dari gaji setiap periode setelah disetujui HRD.
class KasbonController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final isLoading = true.obs;
  final isSubmitting = false.obs;
  final totalSisa = 0.0.obs;
  final kasbonList = <Map<String, dynamic>>[].obs;

  final jumlahController = TextEditingController();
  final cicilanController = TextEditingController();
  final alasanController = TextEditingController();

  final _rupiah = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );
  static const _bulan = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];

  String rp(dynamic v) => _rupiah.format(num.tryParse(v.toString()) ?? 0);

  String periodeLabel(String? ym) {
    if (ym == null || ym.length < 7) return '-';
    final m = int.tryParse(ym.substring(5, 7)) ?? 1;
    return '${_bulan[m - 1]} ${ym.substring(0, 4)}';
  }

  bool get adaMenunggu => kasbonList.any((k) => k['status'] == 'menunggu');

  @override
  void onInit() {
    super.onInit();
    fetch();
  }

  @override
  void onClose() {
    jumlahController.dispose();
    cicilanController.dispose();
    alasanController.dispose();
    super.onClose();
  }

  Future<void> fetch() async {
    isLoading.value = true;
    try {
      final res = await _api.getMyKasbon();
      totalSisa.value = (num.tryParse('${res['totalSisa'] ?? 0}') ?? 0)
          .toDouble();
      kasbonList.assignAll(
        ((res['kasbon'] as List?) ?? []).map(
          (e) => Map<String, dynamic>.from(e as Map),
        ),
      );
    } catch (e) {
      _snack('Gagal memuat kasbon', e.toString(), error: true);
    } finally {
      isLoading.value = false;
    }
  }

  int _angka(String text) =>
      int.tryParse(text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;

  Future<void> ajukan() async {
    final jumlah = _angka(jumlahController.text);
    final cicilan = _angka(cicilanController.text);
    final alasan = alasanController.text.trim();
    if (jumlah < 1000 || cicilan < 1000 || alasan.isEmpty) {
      _snack(
        'Data belum lengkap',
        'Isi jumlah, cicilan per bulan, dan keperluan kasbon.',
        error: true,
      );
      return;
    }
    if (cicilan > jumlah) {
      _snack(
        'Cicilan tidak valid',
        'Cicilan per bulan tidak boleh melebihi jumlah kasbon.',
        error: true,
      );
      return;
    }
    isSubmitting.value = true;
    try {
      await _api.ajukanKasbon(
        jumlah: jumlah,
        cicilanPerBulan: cicilan,
        alasan: alasan,
      );
      Get.back();
      jumlahController.clear();
      cicilanController.clear();
      alasanController.clear();
      _snack('Pengajuan terkirim', 'Kasbon menunggu persetujuan HRD.');
      fetch();
    } catch (e) {
      _snack('Gagal mengajukan', e.toString(), error: true);
    } finally {
      isSubmitting.value = false;
    }
  }

  Future<void> batalkan(int idKasbon) async {
    try {
      await _api.batalkanKasbon(idKasbon);
      _snack('Dibatalkan', 'Pengajuan kasbon dibatalkan.');
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
