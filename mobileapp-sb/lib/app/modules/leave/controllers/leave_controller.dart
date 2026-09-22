import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/session_service.dart';

class LeaveController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final SessionService _session = Get.find<SessionService>();

  // Tab switch: 0 = Izin & Cuti, 1 = Pertukaran Jadwal
  final selectedTab = 0.obs;

  final isLoading = true.obs;
  final leaveRequests = <Map<String, dynamic>>[].obs;

  // Pertukaran Jadwal state
  final isLoadingSwaps = false.obs;
  final incomingSwaps = <Map<String, dynamic>>[].obs;
  final mySwaps = <Map<String, dynamic>>[].obs;

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
    'menunggu_spv': 'Menunggu SPV',
    'menunggu_hrd': 'Menunggu HRD',
    'disetujui': 'Disetujui',
    'ditolak': 'Ditolak',
    'ditolak_spv': 'Ditolak SPV',
    'ditolak_hrd': 'Ditolak HRD',
  };

  static const swapStatusLabels = {
    'menunggu_rekan': 'Menunggu Rekan Kerja',
    'ditolak_rekan': 'Ditolak Rekan Kerja',
    'menunggu_spv': 'Menunggu Persetujuan SPV',
    'ditolak_spv': 'Ditolak Supervisor',
    'menunggu_hrd': 'Menunggu Persetujuan HRD',
    'ditolak_hrd': 'Ditolak HRD',
    'disetujui': 'Disetujui (Jadwal Berubah)',
    'dibatalkan': 'Dibatalkan',
  };

  final isOperasional = true.obs;
  final namaDepartemen = RxnString();
  final nonOperasionalReason = RxnString();

  @override
  void onInit() {
    super.onInit();
    fetchAllData();
  }

  void switchTab(int index) {
    selectedTab.value = index;
  }

  Future<void> fetchAllData({bool isRefresh = false}) async {
    await checkEligibility();
    final futures = <Future>[
      fetchLeaveRequests(isRefresh: isRefresh),
    ];
    if (isOperasional.value) {
      futures.add(fetchPertukaran(isRefresh: isRefresh));
    }
    await Future.wait(futures);
  }

  Future<void> checkEligibility() async {
    try {
      final res = await _api.checkExchangeEligibility();
      isOperasional.value = res['isOperasional'] == true;
      namaDepartemen.value = res['namaDepartemen']?.toString();
      nonOperasionalReason.value = res['reason']?.toString();
      if (!isOperasional.value) {
        selectedTab.value = 0;
      }
    } catch (_) {}
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

  Future<void> fetchLeaveRequests({bool isRefresh = false}) async {
    if (!isRefresh) {
      isLoading.value = true;
    }
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

  Future<void> fetchPertukaran({bool isRefresh = false}) async {
    if (!isRefresh) {
      isLoadingSwaps.value = true;
    }
    try {
      final results = await Future.wait([
        _api.getIncomingPertukaran(),
        _api.getMyPertukaran(),
      ]);
      incomingSwaps.assignAll(results[0].cast<Map<String, dynamic>>());
      mySwaps.assignAll(results[1].cast<Map<String, dynamic>>());
    } catch (e) {
      // ignore
    } finally {
      isLoadingSwaps.value = false;
    }
  }

  Future<void> respondPeerSwap(int idPertukaran, bool setuju, {String? catatan}) async {
    try {
      await _api.respondPeerPertukaran(idPertukaran, setuju: setuju, catatan: catatan);
      Get.snackbar(
        setuju ? 'Disetujui' : 'Ditolak',
        setuju
            ? 'Pertukaran jadwal disetujui dan diteruskan ke SPV.'
            : 'Permintaan pertukaran jadwal telah Anda tolak.',
        backgroundColor: setuju ? Colors.green.shade50 : AppColors.redContainer,
        colorText: setuju ? Colors.green.shade800 : AppColors.redPrimary,
      );
      fetchPertukaran(isRefresh: true);
    } catch (e) {
      Get.snackbar('Gagal', e.toString(),
          backgroundColor: AppColors.redContainer, colorText: AppColors.redPrimary);
    }
  }

  int get currentKaryawanId => _session.idKaryawan.value ?? 0;

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
        : status.startsWith('ditolak')
            ? 'rejected'
            : status == 'menunggu_spv'
                ? 'pending_spv'
                : status == 'menunggu_hrd'
                    ? 'pending_hrd'
                    : 'pending';

    return {
      'id': item['idIzin'],
      'type': _typeLabels[item['jenisIzin']] ?? item['jenisIzin'] ?? '-',
      'status': _statusLabels[status] ?? status,
      'status_raw': status,
      'status_code': statusCode,
      'start_date': item['tanggalMulai'],
      'end_date': item['tanggalSelesai'],
      'total_days': totalDays,
      'reason': item['alasan'],
      'catatan_spv': item['catatanSpv'],
      'catatan_hrd': item['catatanHrd'],
      'file_pendukung': item['filePendukung'],
    };
  }
}
