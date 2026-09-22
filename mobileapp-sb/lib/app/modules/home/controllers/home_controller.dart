import 'package:get/get.dart';

import '../../../core/config/app_config.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/session_service.dart';
import '../../../data/services/regular_off_service.dart';

class HomeController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final SessionService _session = Get.find<SessionService>();
  final RegularOffService _roService = Get.isRegistered<RegularOffService>()
      ? Get.find<RegularOffService>()
      : Get.put(RegularOffService());

  final isLoading = true.obs;
  final isOperasional = false.obs;
  final userProfile = <String, dynamic>{}.obs;
  final todayAttendance = Rxn<Map<String, dynamic>>();
  final todayBreak = Rxn<Map<String, dynamic>>();

  @override
  void onInit() {
    super.onInit();
    fetchData();
  }

  Future<void> fetchData() async {
    isLoading.value = true;
    try {
      final results = await Future.wait([
        _api.getMyProfile(),
        _api.getTodayAttendance(),
        _api.getTodayBreakStatus(),
        _roService.checkEligibility(),
      ]);

      userProfile.value = results[0] as Map<String, dynamic>;
      todayAttendance.value = results[1];
      todayBreak.value = results[2];
      final elig = results[3] as Map<String, dynamic>;
      isOperasional.value = elig['isOperasional'] == true;
    } catch (e) {
      // Fallback ke session data jika API gagal
      userProfile.value = {
        'nama': _session.nama.value ?? 'Karyawan',
        'nik': _session.nik.value ?? '-',
      };
      isOperasional.value = false;
    } finally {
      isLoading.value = false;
    }
  }

  bool get isClockedIn => todayAttendance.value?['jamMasukAktual'] != null;
  bool get isClockedOut => todayAttendance.value?['jamKeluarAktual'] != null;
  bool get isOnBreak => todayBreak.value?['sedangIstirahat'] == true;
  bool get isTodayLate =>
      todayAttendance.value?['statusKehadiran']?.toString().toLowerCase() ==
      'telat';
  int get totalBreakMinutes =>
      (todayBreak.value?['totalDurasiMenit'] as num?)?.toInt() ?? 0;

  /// Inisial dari nama (2 huruf pertama)
  String get initials {
    final nama = userProfile['nama']?.toString() ?? '';
    if (nama.isEmpty) return 'KA';
    final parts = nama.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return nama.substring(0, nama.length >= 2 ? 2 : 1).toUpperCase();
  }

  /// URL foto profil lengkap
  String? get profilePhotoUrl {
    final foto = userProfile['fotoProfil']?.toString();
    if (foto == null || foto.isEmpty) return null;
    if (foto.startsWith('http://') || foto.startsWith('https://')) return foto;
    final clean = foto.replaceAll('\\', '/');
    return '${AppConfig.baseUrl}${clean.startsWith('/') ? '' : '/'}$clean';
  }

  /// Format jam HH:mm dari ISO timestamp
  String formatTime(String? isoString) {
    if (isoString == null) return '--:--';
    try {
      final dt = DateTime.parse(isoString).toLocal();
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '--:--';
    }
  }

  /// Hitung durasi kerja
  String get workDuration {
    final att = todayAttendance.value;
    if (att == null) return '-';
    final masuk = att['jamMasukAktual']?.toString();
    final keluar = att['jamKeluarAktual']?.toString();
    if (masuk == null) return '-';
    try {
      final dtMasuk = DateTime.parse(masuk);
      final dtKeluar = keluar != null ? DateTime.parse(keluar) : DateTime.now();
      final diff = dtKeluar.difference(dtMasuk);
      return '${diff.inHours}j ${diff.inMinutes % 60}m';
    } catch (_) {
      return '-';
    }
  }

  /// Formatted date hari ini
  String get formattedDate {
    final now = DateTime.now();
    final days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    final months = [
      '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return '${days[now.weekday % 7]}, ${now.day} ${months[now.month]} ${now.year}';
  }

  /// Status kehadiran hari ini
  String get attendanceStatus {
    final att = todayAttendance.value;
    if (att == null) return 'Belum Absen';
    return att['statusKehadiran']?.toString() ?? 'Belum Absen';
  }
}
