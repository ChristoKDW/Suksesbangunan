import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import 'session_service.dart';

/// Unduh dokumen resmi (PDF/Excel) dari backend lalu tawarkan Buka / Bagikan.
/// Dipakai untuk slip gaji & rekap/riwayat absensi berkop perusahaan.
class DocumentService {
  DocumentService._();

  static const _bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  static String bulanLabel(DateTime d) => '${_bulan[d.month - 1]} ${d.year}';

  static String bulanParam(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}';

  /// GET [path] dengan token login → simpan ke folder dokumen aplikasi.
  static Future<File> download(
    String path, {
    Map<String, String>? query,
    required String fallbackName,
  }) async {
    final token = Get.find<SessionService>().token.value;
    final uri = Uri.parse('${AppConfig.baseUrl}$path').replace(queryParameters: query);
    final client = HttpClient()..connectionTimeout = const Duration(seconds: AppConfig.requestTimeout);
    try {
      final req = await client.getUrl(uri);
      if (token != null && token.isNotEmpty) {
        req.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
      }
      final res = await req.close().timeout(const Duration(seconds: 60));
      final bytes = await res.fold<List<int>>(<int>[], (a, b) => a..addAll(b));

      if (res.statusCode != 200) {
        String message = 'Gagal mengunduh dokumen (HTTP ${res.statusCode})';
        try {
          final data = jsonDecode(utf8.decode(bytes));
          final m = data is Map ? data['message'] : null;
          if (m != null) message = m is List ? m.join(', ') : m.toString();
        } catch (_) {}
        throw Exception(message);
      }

      var filename = fallbackName;
      final cd = res.headers.value('content-disposition') ?? '';
      final match = RegExp(r'filename="?([^";]+)"?').firstMatch(cd);
      if (match != null) filename = match.group(1)!;

      final dir = Directory('${(await getApplicationDocumentsDirectory()).path}/LARAS');
      if (!await dir.exists()) await dir.create(recursive: true);
      final file = File('${dir.path}/$filename');
      await file.writeAsBytes(bytes, flush: true);
      return file;
    } finally {
      client.close();
    }
  }

  /// Unduh dengan dialog loading, lalu tampilkan pilihan Buka / Bagikan.
  static Future<void> downloadAndShow(
    String path, {
    Map<String, String>? query,
    required String fallbackName,
    required String title,
  }) async {
    Get.dialog(
      const PopScope(
        canPop: false,
        child: Center(child: CircularProgressIndicator(color: AppColors.redPrimary)),
      ),
      barrierDismissible: false,
    );
    File file;
    try {
      file = await download(path, query: query, fallbackName: fallbackName);
    } catch (e) {
      if (Get.isDialogOpen ?? false) Get.back();
      Get.snackbar(
        'Gagal',
        e.toString().replaceFirst('Exception: ', ''),
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: AppColors.redContainer,
        colorText: AppColors.redVariant,
        margin: const EdgeInsets.all(12),
      );
      return;
    }
    if (Get.isDialogOpen ?? false) Get.back();
    _showResultSheet(file, title);
  }

  static void _showResultSheet(File file, String title) {
    final name = file.path.split(Platform.pathSeparator).last.split('/').last;
    final isPdf = name.toLowerCase().endsWith('.pdf');
    Get.bottomSheet(
      SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.borderGrey,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isPdf ? AppColors.redContainer : const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      isPdf ? Icons.picture_as_pdf_rounded : Icons.table_chart_rounded,
                      color: isPdf ? AppColors.redPrimary : AppColors.success,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '$title siap',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                            color: AppColors.slateDark,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: AppColors.slateLight),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        Get.back();
                        await SharePlus.instance.share(
                          ShareParams(files: [XFile(file.path)], text: title),
                        );
                      },
                      icon: const Icon(Icons.share_rounded),
                      label: const Text('Bagikan'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.slateDark,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        Get.back();
                        final result = await OpenFilex.open(file.path);
                        if (result.type != ResultType.done) {
                          Get.snackbar(
                            'Tidak dapat membuka file',
                            'Pasang aplikasi pembaca ${isPdf ? 'PDF' : 'Excel'} atau gunakan tombol Bagikan.',
                            snackPosition: SnackPosition.BOTTOM,
                            margin: const EdgeInsets.all(12),
                          );
                        }
                      },
                      icon: const Icon(Icons.open_in_new_rounded),
                      label: const Text('Buka'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.redPrimary,
                        foregroundColor: AppColors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
    );
  }

  /// Bottom sheet pilih bulan + format, lalu unduh rekap absensi saya.
  static void showRekapAbsensiSheet({String title = 'Rekap Absensi'}) {
    final now = DateTime.now();
    final months = List.generate(12, (i) => DateTime(now.year, now.month - i));
    final selected = months.first.obs;

    Get.bottomSheet(
      SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: AppColors.slateDark,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Format resmi berkop CV. Sukses Bangunindo lengkap dengan cap & tanda tangan HRD.',
                style: TextStyle(fontSize: 12, color: AppColors.slateLight),
              ),
              const SizedBox(height: 16),
              const Text(
                'Pilih bulan',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.slateDark),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: months.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) => Obx(() {
                    final m = months[i];
                    final active = selected.value == m;
                    return ChoiceChip(
                      label: Text(bulanLabel(m)),
                      selected: active,
                      onSelected: (_) => selected.value = m,
                      selectedColor: AppColors.redContainer,
                      labelStyle: TextStyle(
                        fontSize: 12,
                        color: active ? AppColors.redVariant : AppColors.slateDark,
                        fontWeight: active ? FontWeight.bold : FontWeight.normal,
                      ),
                    );
                  }),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _downloadRekap(selected.value, 'excel', title),
                      icon: const Icon(Icons.table_chart_rounded, color: AppColors.success),
                      label: const Text('Excel'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.slateDark,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _downloadRekap(selected.value, 'pdf', title),
                      icon: const Icon(Icons.picture_as_pdf_rounded),
                      label: const Text('PDF'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.redPrimary,
                        foregroundColor: AppColors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      backgroundColor: AppColors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
    );
  }

  static void _downloadRekap(DateTime bulan, String format, String title) {
    Get.back();
    downloadAndShow(
      '/reports/me/absensi',
      query: {'bulan': bulanParam(bulan), 'format': format},
      fallbackName: 'Rekap_Absensi_${bulanParam(bulan)}.${format == 'excel' ? 'xlsx' : 'pdf'}',
      title: '$title ${bulanLabel(bulan)}',
    );
  }

  /// Unduh slip gaji (periode sesuai tanggal acuan yang sedang dilihat).
  static void downloadSlip(DateTime tanggalAcuan, String format) {
    final t =
        '${tanggalAcuan.year}-${tanggalAcuan.month.toString().padLeft(2, '0')}-${tanggalAcuan.day.toString().padLeft(2, '0')}';
    downloadAndShow(
      '/reports/me/slip-gaji',
      query: {'tanggal': t, 'format': format},
      fallbackName: 'Slip_Gaji.${format == 'excel' ? 'xlsx' : 'pdf'}',
      title: 'Slip Gaji',
    );
  }
}
