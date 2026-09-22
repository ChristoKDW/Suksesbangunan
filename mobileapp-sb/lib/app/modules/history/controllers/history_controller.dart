import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../data/services/api_service.dart';

class HistoryController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final isLoading = true.obs;
  final attendanceHistory = <Map<String, dynamic>>[].obs;

  // Date filter
  final Rxn<DateTime> startDate = Rxn<DateTime>();
  final Rxn<DateTime> endDate = Rxn<DateTime>();
  final _dateFormat = DateFormat('yyyy-MM-dd');

  static const _dayNames = [
    'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
  ];

  @override
  void onInit() {
    super.onInit();
    fetchHistory();
  }

  String get dateRangeLabel {
    if (startDate.value != null && endDate.value != null) {
      try {
        final df = DateFormat('dd MMM yyyy', 'id');
        return '${df.format(startDate.value!)} - ${df.format(endDate.value!)}';
      } catch (_) {
        final df = DateFormat('dd MMM yyyy');
        return '${df.format(startDate.value!)} - ${df.format(endDate.value!)}';
      }
    }
    return '30 Hari Terakhir';
  }

  Future<void> pickDateRange(BuildContext context) async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2024, 1, 1),
      lastDate: DateTime.now(),
      initialDateRange: startDate.value != null && endDate.value != null
          ? DateTimeRange(start: startDate.value!, end: endDate.value!)
          : DateTimeRange(
              start: DateTime.now().subtract(const Duration(days: 30)),
              end: DateTime.now(),
            ),
      builder: (context, child) {
        return Theme(
          data: AppTheme.datePickerTheme(context),
          child: child!,
        );
      },
    );
    if (picked != null) {
      startDate.value = picked.start;
      endDate.value = picked.end;
      fetchHistory();
    }
  }

  void clearFilter() {
    startDate.value = null;
    endDate.value = null;
    fetchHistory();
  }

  Future<void> fetchHistory({bool isRefresh = false}) async {
    if (!isRefresh) {
      isLoading.value = true;
    }
    try {
      final data = await _api.getAttendanceHistory(
        startDate: startDate.value != null
            ? _dateFormat.format(startDate.value!)
            : null,
        endDate: endDate.value != null
            ? _dateFormat.format(endDate.value!)
            : null,
      );
      attendanceHistory.assignAll(data.map(_mapEntry).toList());
    } catch (e) {
      Get.snackbar('Error', 'Gagal memuat riwayat: $e',
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isLoading.value = false;
    }
  }

  // Mapping respon backend (Absensi entity) ke field yang dipakai HistoryView.
  Map<String, dynamic> _mapEntry(dynamic raw) {
    final item = raw as Map<String, dynamic>;
    final masuk = item['jamMasukAktual'] != null
        ? DateTime.tryParse(item['jamMasukAktual'].toString())?.toLocal()
        : null;
    final keluar = item['jamKeluarAktual'] != null
        ? DateTime.tryParse(item['jamKeluarAktual'].toString())?.toLocal()
        : null;
    final status = (item['statusKehadiran'] ?? '-').toString();
    final isLate = status.toLowerCase().contains('telat');

    String workDuration = '-';
    if (masuk != null && keluar != null) {
      final diff = keluar.difference(masuk);
      workDuration = '${diff.inHours} Jam ${diff.inMinutes % 60} Menit';
    }

    return {
      'date': masuk?.toIso8601String() ?? '',
      'day_name': masuk != null ? _dayNames[masuk.weekday % 7] : '-',
      'clock_in': masuk != null ? _formatTime(masuk) : '--:--',
      'clock_out': keluar != null ? _formatTime(keluar) : '--:--',
      'status': status.isNotEmpty
          ? status[0].toUpperCase() + status.substring(1)
          : '-',
      'status_code': isLate ? 'late' : 'on_time',
      'work_duration': workDuration,
      'notes': 'Metode absen: ${item['metodeAbsen'] ?? '-'}',
    };
  }

  String _formatTime(DateTime d) =>
      '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
}
