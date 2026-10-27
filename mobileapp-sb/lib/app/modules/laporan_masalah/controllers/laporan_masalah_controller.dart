import 'dart:io';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';

import '../../../components/app_alert.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/api_service.dart';

class KategoriItem {
  final String key;
  final String label;
  final IconData icon;

  const KategoriItem({
    required this.key,
    required this.label,
    required this.icon,
  });
}

class LaporanMasalahController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final currentTabIndex = 0.obs; // 0 = Buat Laporan, 1 = Riwayat Laporan
  final isLoadingHistory = false.obs;
  final isSubmitting = false.obs;

  final selectedKategori = 'absensi_gps'.obs;
  final judulController = TextEditingController();
  final deskripsiController = TextEditingController();
  final langkahController = TextEditingController();

  final selectedImage = Rxn<File>();
  final historyList = <Map<String, dynamic>>[].obs;

  final List<KategoriItem> daftarKategori = const [
    KategoriItem(
      key: 'absensi_gps',
      label: 'Radius Absensi & Lokasi GPS',
      icon: Icons.location_on_outlined,
    ),
    KategoriItem(
      key: 'kamera_wajah',
      label: 'Kamera & Verifikasi Wajah',
      icon: Icons.camera_front_outlined,
    ),
    KategoriItem(
      key: 'jadwal_shift',
      label: 'Jadwal Kerja & Tukar Shift',
      icon: Icons.calendar_month_outlined,
    ),
    KategoriItem(
      key: 'penggajian_slip',
      label: 'Slip Gaji & Kasbon',
      icon: Icons.receipt_long_outlined,
    ),
    KategoriItem(
      key: 'performa_crash',
      label: 'Aplikasi Lambat / Keluar Sendiri',
      icon: Icons.bolt_outlined,
    ),
    KategoriItem(
      key: 'lainnya',
      label: 'Kendala Sistem Lainnya',
      icon: Icons.help_outline,
    ),
  ];

  @override
  void onInit() {
    super.onInit();
    fetchHistory();
  }

  @override
  void onClose() {
    judulController.dispose();
    deskripsiController.dispose();
    langkahController.dispose();
    super.onClose();
  }

  void switchTab(int index) {
    currentTabIndex.value = index;
    if (index == 1) {
      fetchHistory();
    }
  }

  Future<void> pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final XFile? picked = await picker.pickImage(
        source: source,
        maxWidth: 1280,
        maxHeight: 1280,
        imageQuality: 85,
      );
      if (picked != null) {
        selectedImage.value = File(picked.path);
      }
    } catch (e) {
      Get.snackbar(
        'Gagal Memilih Gambar',
        'Tidak dapat mengakses galeri/kamera: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }

  void removeImage() {
    selectedImage.value = null;
  }

  Future<Map<String, dynamic>> _captureDeviceInfo() async {
    final Map<String, dynamic> info = {
      'platform': Platform.operatingSystem,
      'osVersion': Platform.operatingSystemVersion,
      'timestamp': DateTime.now().toIso8601String(),
    };

    try {
      final hasPermission = await Geolocator.checkPermission();
      if (hasPermission == LocationPermission.always ||
          hasPermission == LocationPermission.whileInUse) {
        final pos = await Geolocator.getLastKnownPosition();
        if (pos != null) {
          info['lastLocation'] = {
            'latitude': pos.latitude,
            'longitude': pos.longitude,
            'accuracy': '${pos.accuracy.toStringAsFixed(1)}m',
          };
        }
      }
    } catch (_) {
      // Ignore location error on auto capture
    }

    return info;
  }

  Future<void> submitReport() async {
    final judul = judulController.text.trim();
    final deskripsi = deskripsiController.text.trim();
    final langkah = langkahController.text.trim();

    if (judul.isEmpty) {
      Get.snackbar('Perhatian', 'Judul masalah wajib diisi',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: AppColors.warning.withValues(alpha: 0.1),
          colorText: AppColors.warning);
      return;
    }

    if (deskripsi.isEmpty) {
      Get.snackbar('Perhatian', 'Deskripsi masalah wajib diisi',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: AppColors.warning.withValues(alpha: 0.1),
          colorText: AppColors.warning);
      return;
    }

    isSubmitting.value = true;
    try {
      final deviceInfo = await _captureDeviceInfo();
      final res = await _api.submitLaporanMasalah(
        kategori: selectedKategori.value,
        judul: judul,
        deskripsi: deskripsi,
        langkahReproduksi: langkah.isNotEmpty ? langkah : null,
        deviceInfo: deviceInfo,
        filePath: selectedImage.value?.path,
      );

      final tiketId = res['tiketId']?.toString() ?? 'RPT-TERKIRIM';

      // Reset form
      judulController.clear();
      deskripsiController.clear();
      langkahController.clear();
      selectedImage.value = null;

      // Show alert and switch to history
      await AppAlert.show(
        title: 'Laporan Diterima!',
        message:
            'Nomor Tiket Anda: $tiketId.\nTim sistem akan segera menganalisis kendala Anda.',
        icon: Icons.check_circle_outline,
        color: AppColors.success,
        button: 'Lihat Status Tiket',
      );

      switchTab(1);
    } catch (e) {
      AppAlert.show(
        title: 'Gagal Mengirim Laporan',
        message: e.toString(),
        icon: Icons.error_outline,
        color: AppColors.error,
        button: 'Tutup',
      );
    } finally {
      isSubmitting.value = false;
    }
  }

  Future<void> fetchHistory() async {
    isLoadingHistory.value = true;
    try {
      final data = await _api.getMyLaporanMasalah();
      historyList.assignAll(
        data.map((item) => Map<String, dynamic>.from(item as Map)).toList(),
      );
    } catch (e) {
      // ignore
    } finally {
      isLoadingHistory.value = false;
    }
  }
}
