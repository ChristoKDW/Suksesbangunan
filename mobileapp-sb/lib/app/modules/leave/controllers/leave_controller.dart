import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../data/services/api_service.dart';

class LeaveController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final isLoading = true.obs;
  final leaveRequests = <Map<String, dynamic>>[].obs;

  // Date filter
  final Rxn<DateTime> startDate = Rxn<DateTime>();
  final Rxn<DateTime> endDate = Rxn<DateTime>();
  final _dateFormat = DateFormat('yyyy-MM-dd');

  static const _typeLabels = {
    'izin': 'Izin',
    'sakit': 'Izin Sakit',
    'cuti': 'Cuti Tahunan',
    'dinas luar': 'Dinas Luar',
  };

  static const _statusLabels = {
    'menunggu': 'Menunggu Persetujuan',
    'disetujui': 'Disetujui',
    'ditolak': 'Ditolak',
  };

  @override
  void onInit() {
    super.onInit();
    fetchLeaveRequests();
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
    return 'Semua Periode';
  }

  Future<void> pickDateRange(BuildContext context) async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2024, 1, 1),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialDateRange: startDate.value != null && endDate.value != null
          ? DateTimeRange(start: startDate.value!, end: endDate.value!)
          : DateTimeRange(
              start: DateTime.now().subtract(const Duration(days: 90)),
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
      fetchLeaveRequests();
    }
  }

  void clearFilter() {
    startDate.value = null;
    endDate.value = null;
    fetchLeaveRequests();
  }

  Future<void> fetchLeaveRequests() async {
    isLoading.value = true;
    try {
      final data = await _api.getMyLeaveRequests(
        startDate: startDate.value != null
            ? _dateFormat.format(startDate.value!)
            : null,
        endDate: endDate.value != null
            ? _dateFormat.format(endDate.value!)
            : null,
      );
      leaveRequests.assignAll(data.map(_mapEntry).toList());
    } catch (e) {
      Get.snackbar('Error', 'Gagal memuat data izin: $e',
          snackPosition: SnackPosition.BOTTOM);
    } finally {
      isLoading.value = false;
    }
  }

  // Mapping respon backend (PengajuanIzin entity) ke field yang dipakai LeaveView.
  Map<String, dynamic> _mapEntry(dynamic raw) {
    final item = raw as Map<String, dynamic>;
    final mulai = DateTime.tryParse(item['tanggalMulai']?.toString() ?? '');
    final selesai = DateTime.tryParse(item['tanggalSelesai']?.toString() ?? '');
    final totalDays = (mulai != null && selesai != null)
        ? selesai.difference(mulai).inDays + 1
        : 0;
    final status = (item['status'] ?? 'menunggu').toString();
    final statusCode = status == 'disetujui'
        ? 'approved'
        : status == 'ditolak'
            ? 'rejected'
            : 'pending';

    return {
      'type': _typeLabels[item['jenisIzin']] ?? item['jenisIzin'] ?? '-',
      'status': _statusLabels[status] ?? status,
      'status_code': statusCode,
      'start_date': item['tanggalMulai'],
      'end_date': item['tanggalSelesai'],
      'total_days': totalDays,
      'reason': item['alasan'],
    };
  }
}
