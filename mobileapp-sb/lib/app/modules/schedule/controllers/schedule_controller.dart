import 'package:get/get.dart';

import '../../../data/services/api_service.dart';

class ScheduleController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final isLoading = true.obs;
  final monthlySchedules = <String, Map<String, dynamic>>{}.obs;
  final holidaysByDate = <String, List<Map<String, dynamic>>>{}.obs;
  final selectedDay = Rxn<DateTime>();
  final focusedDay = DateTime.now().obs;

  static const _dayNames = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];

  @override
  void onInit() {
    super.onInit();
    selectedDay.value = DateTime.now();
    fetchMonthlySchedule(DateTime.now().year, DateTime.now().month);
  }

  Future<void> fetchMonthlySchedule(int year, int month) async {
    isLoading.value = true;
    try {
      final results = await Future.wait([
        _api.getMonthlySchedule(year, month),
        _api.getCalendarHolidays(year, month),
      ]);

      final data = results[0] as List<dynamic>;
      final holidayRes = results[1] as Map<String, dynamic>;

      final Map<String, List<Map<String, dynamic>>> parsedHolidays = {};
      if (holidayRes['byDate'] is Map) {
        final rawByDate = holidayRes['byDate'] as Map;
        rawByDate.forEach((k, v) {
          if (v is List) {
            parsedHolidays[k.toString()] =
                v.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          }
        });
      }
      holidaysByDate.assignAll(parsedHolidays);

      final Map<String, Map<String, dynamic>> mapped = {};
      for (final raw in data) {
        final entry = _mapEntry(raw);
        final date = entry['date']?.toString() ?? '';
        if (date.isNotEmpty) {
          // Normalisasi key menjadi YYYY-MM-DD
          final dateKey = date.length >= 10 ? date.substring(0, 10) : date;
          mapped[dateKey] = entry;
        }
      }
      monthlySchedules.assignAll(mapped);
    } catch (e) {
      Get.snackbar(
        'Error',
        'Gagal memuat jadwal: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isLoading.value = false;
    }
  }

  void onDaySelected(DateTime selected, DateTime focused) {
    selectedDay.value = selected;
    focusedDay.value = focused;
  }

  void onPageChanged(DateTime focused) {
    focusedDay.value = focused;
    fetchMonthlySchedule(focused.year, focused.month);
  }

  /// Mendapatkan data jadwal untuk tanggal tertentu.
  Map<String, dynamic>? getScheduleForDay(DateTime day) {
    final key =
        '${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
    return monthlySchedules[key];
  }

  /// Mendapatkan daftar event libur nasional & peringatan nasional untuk tanggal tertentu
  List<Map<String, dynamic>> getHolidaysForDay(DateTime day) {
    final key =
        '${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
    return holidaysByDate[key] ?? [];
  }

  /// Apakah tanggal ini memiliki jadwal?
  bool hasSchedule(DateTime day) {
    return getScheduleForDay(day) != null;
  }

  // Mapping respon backend (JadwalKerja entity) ke field yang dipakai view.
  Map<String, dynamic> _mapEntry(dynamic raw) {
    final item = raw as Map<String, dynamic>;
    final tanggal = DateTime.tryParse(item['tanggal']?.toString() ?? '');
    final shift = item['shift'] as Map<String, dynamic>?;
    final isCuti = item['isCuti'] == true;
    final isLibur = item['isLibur'] == true;
    final keterangan = item['keterangan']?.toString();
    final isDayOff = isCuti || isLibur || shift == null;

    String shiftName = 'Libur';
    if (isCuti) {
      shiftName = 'Cuti';
    } else if (isLibur && keterangan != null && keterangan.isNotEmpty) {
      shiftName = keterangan;
    } else if (shift != null) {
      shiftName = shift['namaShift'] ?? 'Kerja';
    }

    return {
      'date': item['tanggal'],
      'day_name': tanggal != null ? _dayNames[tanggal.weekday % 7] : '-',
      'shift_name': shiftName,
      'time_in': shift?['jamMulai'],
      'time_out': shift?['jamSelesai'],
      'is_day_off': isDayOff,
      'is_cuti': isCuti,
      'is_libur': isLibur,
      'keterangan': keterangan,
      'location': 'Kantor Pusat',
    };
  }
}
