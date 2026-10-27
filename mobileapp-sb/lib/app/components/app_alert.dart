import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../core/theme/app_colors.dart';
import '../data/services/api_service.dart';

/// Dialog bergaya SweetAlert (ikon bulat besar, judul, pesan, tombol OK)
/// untuk pemberitahuan penting di aplikasi mobile.
class AppAlert {
  AppAlert._();

  static Future<void> show({
    required String title,
    required String message,
    IconData icon = Icons.priority_high_rounded,
    Color color = AppColors.warning,
    String button = 'Mengerti',
  }) {
    return Get.dialog(
      Dialog(
        insetPadding: const EdgeInsets.symmetric(horizontal: 28),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0.6, end: 1),
                duration: const Duration(milliseconds: 380),
                curve: Curves.elasticOut,
                builder: (_, scale, child) =>
                    Transform.scale(scale: scale, child: child),
                child: Container(
                  width: 76,
                  height: 76,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: color.withValues(alpha: 0.35),
                      width: 4,
                    ),
                  ),
                  child: Icon(icon, color: color, size: 44),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.slateDark,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13.5,
                  height: 1.4,
                  color: AppColors.slateLight,
                ),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Get.back(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.redPrimary,
                    foregroundColor: AppColors.white,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    button,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      barrierDismissible: false,
    );
  }

  /// Error karena batas pengajuan habis (HTTP 409 / pesan "sudah melakukan pengajuan").
  static bool isBatasPengajuan(Object e) =>
      (e is ApiException && e.statusCode == 409) ||
      e.toString().contains('sudah melakukan pengajuan') ||
      e.toString().contains('memakai kuota');

  static Future<void> batasPengajuan(Object e) => show(
    title: 'Anda sudah melakukan pengajuan',
    message: e is ApiException
        ? e.message
        : e.toString().replaceAll('Exception:', '').trim(),
    icon: Icons.block_rounded,
  );

  /// Cek kuota sebelum mengisi form. Mengembalikan false (dan menampilkan
  /// peringatan) bila pengajuan jenis ini sudah melewati batas.
  static Future<bool> cekKuota(String jenis, {DateTime? tanggal}) async {
    try {
      final api = Get.find<ApiService>();
      final res = await api.cekKuotaPengajuan(jenis, tanggal: tanggal);
      if (res['boleh'] == false) {
        await show(
          title: 'Anda sudah melakukan pengajuan',
          message: (res['pesan'] ?? 'Batas pengajuan sudah tercapai.')
              .toString(),
          icon: Icons.block_rounded,
        );
        return false;
      }
    } catch (_) {
      // Server tidak terjangkau: biarkan, validasi tetap dilakukan saat kirim
    }
    return true;
  }
}
