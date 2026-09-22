import 'dart:async';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart' as geo;

import '../../../data/services/api_service.dart';
import '../../../routes/app_pages.dart';

class AttendanceController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  // Jam real-time
  final currentTime = ''.obs;
  final currentDate = ''.obs;

  // Lokasi GPS
  final locationText = 'Mendapatkan lokasi...'.obs;
  final locationStatus = ''.obs;
  final isLocationReady = false.obs;
  double? currentLat;
  double? currentLng;

  // Status geofence kantor
  final isCheckingGeofence = false.obs;
  final isWithinOfficeRadius = false.obs;
  final officeName = ''.obs;

  // Status jadwal kerja
  final scheduleLoading = true.obs;
  final scheduleState = 'loading'
      .obs; // 'loading', 'no_schedule', 'cuti', 'libur', 'active', 'error'
  final scheduleMessage = ''.obs;
  final shiftName = ''.obs;
  final shiftHours = ''.obs;
  final canProceed = false.obs;

  // Status absensi hari ini & istirahat
  final todayAttendance = Rxn<Map<String, dynamic>>();
  final todayBreak = Rxn<Map<String, dynamic>>();
  final isCheckingStatus = false.obs;
  final isSubmittingBreak = false.obs;

  Timer? _clockTimer;
  final _geocoding = geo.Geocoding();

  bool get isClockedIn => todayAttendance.value?['jamMasukAktual'] != null;
  bool get isClockedOut => todayAttendance.value?['jamKeluarAktual'] != null;
  bool get isOnBreak => todayBreak.value?['sedangIstirahat'] == true;
  int get totalBreakMinutes =>
      (todayBreak.value?['totalDurasiMenit'] as num?)?.toInt() ?? 0;
  int get activeBreakSeconds {
    final start = todayBreak.value?['aktifIstirahat']?['jamKeluarIstirahat'];
    final parsed = start == null ? null : DateTime.tryParse(start.toString());
    return parsed == null
        ? 0
        : DateTime.now()
              .difference(parsed.toLocal())
              .inSeconds
              .clamp(0, 6000000)
              .toInt();
  }

  int get activeBreakMinutes {
    if (activeBreakSeconds == 0) {
      return (todayBreak.value?['durasiAktifMenit'] as num?)?.toInt() ?? 0;
    }
    return (activeBreakSeconds / 60).ceil();
  }

  int get activeBreakExcessMinutes =>
      (activeBreakMinutes - 60).clamp(0, 100000).toInt();
  bool get isActiveBreakLate =>
      todayBreak.value?['terlambatAktif'] == true || activeBreakSeconds > 3600;
  bool get hasLateBreak => breakHistory.any(
    (item) => item is Map && item['terlambatKembali'] == true,
  );
  List<dynamic> get breakHistory =>
      (todayBreak.value?['riwayat'] as List?) ?? [];

  String? get clockInTimeText =>
      _formatIsoTime(todayAttendance.value?['jamMasukAktual']);
  String? get clockOutTimeText =>
      _formatIsoTime(todayAttendance.value?['jamKeluarAktual']);

  String? _formatIsoTime(dynamic iso) {
    if (iso == null) return null;
    try {
      final dt = DateTime.parse(iso.toString()).toLocal();
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return null;
    }
  }

  @override
  void onInit() {
    super.onInit();
    _startClock();
    _getCurrentLocation();
    checkTodaySchedule();
    loadTodayAttendanceAndBreak();
  }

  void _startClock() {
    _updateTime();
    _clockTimer = Timer.periodic(
      const Duration(seconds: 1),
      (_) => _updateTime(),
    );
  }

  void _updateTime() {
    final now = DateTime.now();
    final hour = now.hour.toString().padLeft(2, '0');
    final minute = now.minute.toString().padLeft(2, '0');
    final second = now.second.toString().padLeft(2, '0');
    currentTime.value = '$hour:$minute:$second';

    final days = [
      'Minggu',
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
    ];
    final months = [
      '',
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    currentDate.value =
        '${days[now.weekday % 7]}, ${now.day.toString().padLeft(2, '0')} ${months[now.month]} ${now.year}';
  }

  Future<void> _getCurrentLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          locationText.value = 'Izin lokasi ditolak';
          locationStatus.value = 'denied';
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        locationText.value = 'Izin lokasi diblokir permanen';
        locationStatus.value = 'denied_forever';
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );

      currentLat = position.latitude;
      currentLng = position.longitude;
      isLocationReady.value = true;

      // Reverse geocoding
      try {
        final placemarks = await _geocoding.placemarkFromCoordinates(
          position.latitude,
          position.longitude,
        );
        if (placemarks.isNotEmpty) {
          final p = placemarks.first;
          final parts = <String>[
            if (p.street != null && p.street!.isNotEmpty) p.street!,
            if (p.subLocality != null && p.subLocality!.isNotEmpty)
              p.subLocality!,
            if (p.locality != null && p.locality!.isNotEmpty) p.locality!,
          ];
          locationText.value = parts.isNotEmpty
              ? parts.join(', ')
              : '${position.latitude}, ${position.longitude}';
        } else {
          locationText.value =
              '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
        }
      } catch (_) {
        locationText.value =
            '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
      }

      locationStatus.value = 'ready';
      await _checkGeofenceStatus();
    } catch (e) {
      locationText.value = 'Gagal mendapatkan lokasi';
      locationStatus.value = 'error';
    }
  }

  Future<void> _checkGeofenceStatus() async {
    if (currentLat == null || currentLng == null) return;
    isCheckingGeofence.value = true;
    try {
      final res = await _api.checkGeofenceStatus(
        lat: currentLat!,
        lng: currentLng!,
      );
      isWithinOfficeRadius.value = res['dalamRadius'] == true;
      officeName.value = res['namaKantor']?.toString() ?? '';
    } catch (_) {
      isWithinOfficeRadius.value = false;
      officeName.value = '';
    } finally {
      isCheckingGeofence.value = false;
    }
  }

  Future<void> checkTodaySchedule() async {
    scheduleLoading.value = true;
    try {
      final res = await _api.getTodaySchedule();
      if (res['hasJadwal'] == false) {
        scheduleState.value = 'no_schedule';
        scheduleMessage.value =
            res['message']?.toString() ??
            'Anda belum punya jadwal kerja, hubungi supervisor';
        canProceed.value = false;
      } else if (res['isCuti'] == true) {
        scheduleState.value = 'cuti';
        scheduleMessage.value =
            res['message']?.toString() ?? 'Hari ini Anda sedang cuti';
        canProceed.value = false;
      } else if (res['isLibur'] == true) {
        scheduleState.value = 'libur';
        scheduleMessage.value =
            res['message']?.toString() ?? 'Hari ini adalah hari libur Anda';
        canProceed.value = false;
      } else {
        scheduleState.value = 'active';
        final shift = res['shift'] as Map<String, dynamic>?;
        shiftName.value = shift?['namaShift']?.toString() ?? 'Reguler';
        final mulai = (shift?['jamMulai']?.toString() ?? '08:00').substring(
          0,
          5,
        );
        final selesai = (shift?['jamSelesai']?.toString() ?? '17:00').substring(
          0,
          5,
        );
        shiftHours.value = '$mulai - $selesai';

        canProceed.value = true;
      }
    } catch (_) {
      scheduleState.value = 'error';
      scheduleMessage.value = 'Gagal memeriksa jadwal kerja';
      canProceed.value = false;
    } finally {
      scheduleLoading.value = false;
    }
  }

  Future<void> loadTodayAttendanceAndBreak() async {
    isCheckingStatus.value = true;
    try {
      final results = await Future.wait([
        _api.getTodayAttendance(),
        _api.getTodayBreakStatus(),
      ]);
      todayAttendance.value = results[0];
      todayBreak.value = results[1];
    } catch (_) {
      // Ignored
    } finally {
      isCheckingStatus.value = false;
    }
  }

  // ponytail: Helper validasi radius untuk izin dan absensi (DRY, clean floating alert)
  bool _checkRadiusValid() {
    if (!isWithinOfficeRadius.value) {
      Get.snackbar(
        'Di Luar Radius Kantor',
        'Anda harus berada di area kantor untuk melakukan proses ini.',
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(16),
        borderRadius: 8,
        backgroundColor: Colors.redAccent,
        colorText: Colors.white,
      );
      return false;
    }
    return true;
  }

  Future<void> toggleBreak() async {
    if (!_checkRadiusValid()) return;

    if (!isClockedIn) {
      Get.snackbar(
        'Perhatian',
        'Anda belum melakukan absen masuk',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.orangeAccent,
        colorText: Colors.white,
      );
      return;
    }

    if (isClockedOut) {
      Get.snackbar(
        'Perhatian',
        'Anda sudah absen pulang hari ini',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.orangeAccent,
        colorText: Colors.white,
      );
      return;
    }

    final tipe = isOnBreak ? 'masuk' : 'keluar';
    final actionLabel = tipe == 'keluar'
        ? 'Mulai Istirahat / Keluar Makan'
        : 'Selesai Istirahat';

    final confirm = await Get.dialog<bool>(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(
              tipe == 'keluar' ? Icons.restaurant : Icons.work,
              color: const Color(0xFFC02627),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                actionLabel,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        content: Text(
          tipe == 'keluar'
              ? 'Mulai istirahat fleksibel sekarang? Batas normal istirahat adalah 60 menit.'
              : isActiveBreakLate
              ? 'Istirahat sudah melebihi 60 menit (+$activeBreakExcessMinutes menit) dan akan dicatat terlambat. Kembali bekerja sekarang?'
              : 'Apakah Anda sudah selesai istirahat dan siap melanjutkan jam kerja?',
          style: const TextStyle(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(result: false),
            child: const Text('Batal', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFC02627),
              foregroundColor: Colors.white,
            ),
            onPressed: () => Get.back(result: true),
            child: const Text('Ya, Catat'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    isSubmittingBreak.value = true;
    try {
      await _api.submitIstirahat(tipe: tipe);
      await loadTodayAttendanceAndBreak();
      Get.snackbar(
        'Berhasil',
        tipe == 'keluar'
            ? 'Waktu mulai istirahat tercatat. Selamat beristirahat!'
            : 'Selesai istirahat tercatat. Selamat bekerja kembali!',
        snackPosition: SnackPosition.TOP,
        backgroundColor: const Color(0xFF16A34A),
        colorText: Colors.white,
      );
    } catch (e) {
      Get.snackbar(
        'Gagal Mencatat Istirahat',
        e.toString(),
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.redAccent,
        colorText: Colors.white,
      );
    } finally {
      isSubmittingBreak.value = false;
    }
  }

  void proceedToFaceScan(String tipe) {
    if (!_checkRadiusValid()) return;

    if (tipe == 'keluar' && isOnBreak) {
      Get.snackbar(
        'Peringatan Absen Pulang',
        'Anda masih dalam sesi istirahat. Selesaikan sesi istirahat terlebih dahulu sebelum absen pulang.',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.orangeAccent,
        colorText: Colors.white,
      );
      return;
    }

    Get.toNamed(Routes.FACE_RECOGNITION, arguments: {'tipe': tipe});
  }

  @override
  void onClose() {
    _clockTimer?.cancel();
    super.onClose();
  }
}
