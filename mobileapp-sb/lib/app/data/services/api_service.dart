import 'dart:convert';
import 'dart:io';

import 'package:get/get.dart';

import '../../core/config/app_config.dart';
import 'session_service.dart';

/// Layer pemanggilan REST API ke backend NestJS menggunakan GetConnect
/// (sudah tersedia di paket `get`, tanpa dependency tambahan).
class ApiService extends GetConnect {
  final SessionService _session = Get.find<SessionService>();

  @override
  void onInit() {
    httpClient.baseUrl = AppConfig.baseUrl;
    httpClient.timeout = const Duration(seconds: AppConfig.requestTimeout);

    // Sisipkan Bearer token otomatis jika sudah login.
    httpClient.addRequestModifier<Object?>((request) {
      final token = _session.token.value;
      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      return request;
    });

    // Token ditolak server (kadaluarsa / akun di-reset HRD) → hapus sesi & kembali ke login,
    // supaya karyawan tidak tertahan di Home dengan semua aksi gagal "Unauthorized".
    httpClient.addResponseModifier<Object?>((request, response) {
      if (response.statusCode == 401 &&
          request.headers.containsKey('Authorization') &&
          _session.isLoggedIn) {
        _session.clear();
        Get.offAllNamed('/login');
        Get.snackbar(
          'Sesi Berakhir',
          'Sesi login Anda sudah berakhir, silakan login ulang.',
          snackPosition: SnackPosition.BOTTOM,
        );
      }
      return response;
    });

    super.onInit();
  }

  // ---------- Alur registrasi ----------

  /// Langkah 2: cek NIK. Mengembalikan { nik, nama, email } jika valid.
  Future<Map<String, dynamic>> checkNik(String nik) async {
    final res = await post('/auth/mobile/check-nik', {'nik': nik});
    return _handle(res);
  }

  /// Langkah 4: submit registrasi (username/password) → backend kirim OTP.
  Future<Map<String, dynamic>> register({
    required String nik,
    required String nama,
    required String email,
    required String username,
    required String password,
    String? nomorTelepon,
  }) async {
    final res = await post('/auth/mobile/register', {
      'nik': nik,
      'nama': nama,
      'email': email,
      'username': username,
      'password': password,
      if (nomorTelepon != null && nomorTelepon.isNotEmpty)
        'nomorTelepon': nomorTelepon,
    });
    return _handle(res);
  }

  /// Langkah 5: verifikasi OTP → aktivasi akun.
  Future<Map<String, dynamic>> verifyOtp({
    required String nik,
    required String otp,
  }) async {
    final res = await post('/auth/mobile/verify-otp', {'nik': nik, 'otp': otp});
    return _handle(res);
  }

  Future<Map<String, dynamic>> resendOtp(String nik) async {
    final res = await post('/auth/mobile/resend-otp', {'nik': nik});
    return _handle(res);
  }

  // ---------- Alur login & wajah ----------

  /// Login dengan username & password. Mengembalikan accessToken + info karyawan.
  Future<Map<String, dynamic>> login({
    required String username,
    required String password,
  }) async {
    final res = await post('/auth/mobile/login', {
      'username': username,
      'password': password,
    });
    return _handle(res);
  }

  /// Kirim foto wajah base64 ke backend untuk didaftarkan.
  /// Backend yang mengekstraksi embedding 512-dim dengan AI dan menyimpannya ke pgvector.
  Future<Map<String, dynamic>> registerFace(String imageBase64) async {
    final res = await post('/auth/mobile/register-face', {
      'imageBase64': imageBase64,
    });
    return _handle(res);
  }

  /// Kirim absensi masuk/pulang dengan foto wajah.
  Future<Map<String, dynamic>> submitAbsensiWajah({
    required int idKaryawan,
    required double lat,
    required double lng,
    required String faceImageBase64,
    String tipe = 'masuk',
  }) async {
    final res = await post('/absensi', {
      'idKaryawan': idKaryawan,
      'lokasiLat': lat,
      'lokasiLng': lng,
      'metodeAbsen': 'wajah',
      'tipe': tipe,
      'faceImageBase64': faceImageBase64,
    });
    return _handle(res);
  }

  // ---------- Util ----------

  Map<String, dynamic> _handle(Response res) {
    final body = res.body;
    if (res.isOk) {
      if (body is Map<String, dynamic>) return body;
      return {'data': body};
    }

    // Ambil pesan error dari backend NestJS ({ message: string | string[] }).
    String message = 'Terjadi kesalahan (${res.statusCode ?? 'network'})';
    if (body is Map && body['message'] != null) {
      final m = body['message'];
      message = m is List ? m.join(', ') : m.toString();
    } else if (res.statusText != null && res.statusText!.isNotEmpty) {
      message = res.statusText!;
    }
    throw ApiException(message, res.statusCode);
  }

  /// Helper untuk handle response yang bisa List atau Map.
  dynamic _handleDynamic(Response res) {
    final body = res.body;
    if (res.isOk) return body;

    String message = 'Terjadi kesalahan (${res.statusCode ?? 'network'})';
    if (body is Map && body['message'] != null) {
      final m = body['message'];
      message = m is List ? m.join(', ') : m.toString();
    } else if (res.statusText != null && res.statusText!.isNotEmpty) {
      message = res.statusText!;
    }
    throw ApiException(message, res.statusCode);
  }

  // ---------- Profil Karyawan (Mobile) ----------

  /// GET /auth/mobile/me → data profil karyawan yang login.
  Future<Map<String, dynamic>> getMyProfile() async {
    final res = await get('/auth/mobile/me');
    return _handle(res);
  }

  // ---------- Absensi (Mobile) ----------

  /// GET /absensi/me/today → absensi hari ini untuk karyawan yang login.
  Future<Map<String, dynamic>?> getTodayAttendance() async {
    final res = await get('/absensi/me/today');
    if (res.isOk) {
      final body = res.body;
      if (body == null || (body is String && body.isEmpty)) return null;
      if (body is Map<String, dynamic>) return body;
      return null;
    }
    return _handle(res);
  }

  /// GET /absensi/geofence-status → cek apakah koordinat GPS berada dalam
  /// radius salah satu kantor terdaftar.
  Future<Map<String, dynamic>> checkGeofenceStatus({
    required double lat,
    required double lng,
  }) async {
    final res = await get(
      '/absensi/geofence-status',
      query: {'lat': lat.toString(), 'lng': lng.toString()},
    );
    return _handle(res);
  }

  // ---------- Istirahat (Mobile) ----------

  /// GET /istirahat/me/today → status dan riwayat istirahat hari ini.
  Future<Map<String, dynamic>> getTodayBreakStatus() async {
    final res = await get('/istirahat/me/today');
    return _handle(res);
  }

  /// POST /istirahat → mulai/selesai istirahat ('keluar' atau 'masuk').
  Future<Map<String, dynamic>> submitIstirahat({
    required String tipe,
    int? idAbsensi,
  }) async {
    final body = <String, dynamic>{'tipe': tipe};
    if (idAbsensi != null) body['idAbsensi'] = idAbsensi;
    final res = await post('/istirahat', body);
    return _handle(res);
  }

  // ---------- Jadwal Kerja (Mobile) ----------

  /// GET /jadwal-kerja/me/today → jadwal hari ini untuk karyawan yang login.
  Future<Map<String, dynamic>> getTodaySchedule() async {
    final res = await get('/jadwal-kerja/me/today');
    return _handle(res);
  }

  /// GET /jadwal-kerja/me/weekly → jadwal seminggu ke depan.
  Future<List<dynamic>> getWeeklySchedule() async {
    final res = await get('/jadwal-kerja/me/weekly');
    return _handleDynamic(res) ?? [];
  }

  /// GET /jadwal-kerja/me/monthly?year=&month= → jadwal satu bulan penuh.
  Future<List<dynamic>> getMonthlySchedule(int year, int month) async {
    final res = await get(
      '/jadwal-kerja/me/monthly',
      query: {'year': year.toString(), 'month': month.toString()},
    );
    return _handleDynamic(res) ?? [];
  }

  /// GET /hari-libur/kalender?year=&month= → sinkronisasi hari libur nasional & peringatan nasional resmi (Opica + DB).
  Future<Map<String, dynamic>> getCalendarHolidays(int year, int month) async {
    try {
      final res = await get(
        '/hari-libur/kalender',
        query: {'year': year.toString(), 'month': month.toString()},
      );
      if (res.isOk && res.body is Map) {
        return Map<String, dynamic>.from(res.body as Map);
      }
    } catch (_) {}

    // Fallback langsung ke Opica API jika server backend sedang offline
    try {
      final directLibur = await get('https://app.opica.id/api-libur/api?year=$year&month=$month');
      final directNasional = await get('https://app.opica.id/api-libur/api/hari-nasional?year=$year&month=$month');
      final list = <Map<String, dynamic>>[];
      final byDate = <String, List<dynamic>>{};

      if (directLibur.isOk && directLibur.body is Map && directLibur.body['data'] is List) {
        for (final item in directLibur.body['data']) {
          final dateKey = item['holiday_date']?.toString();
          if (dateKey != null) {
            final ev = {
              'date': dateKey,
              'name': item['description'],
              'type': item['holiday_type'],
              // Offline: ikuti default perusahaan (cuti bersama = hari kerja)
              'isLibur': item['holiday_type'] != 'cuti_bersama',
              'description': item['description'],
            };
            list.add(ev);
            byDate.putIfAbsent(dateKey, () => []).add(ev);
          }
        }
      }

      if (directNasional.isOk && directNasional.body is Map && directNasional.body['data'] is List) {
        for (final item in directNasional.body['data']) {
          final dateKey = item['date']?.toString();
          if (dateKey != null) {
            final ev = {
              'date': dateKey,
              'name': item['name'],
              'type': 'hari_nasional',
              'category': item['category'],
              'isLibur': item['is_public_holiday'] == true,
              'description': item['description'],
            };
            list.add(ev);
            byDate.putIfAbsent(dateKey, () => []).add(ev);
          }
        }
      }

      return {'status': 'success', 'data': list, 'byDate': byDate};
    } catch (_) {}

    return {'status': 'empty', 'data': [], 'byDate': {}};
  }

  // ---------- Pengajuan Izin (Mobile) ----------

  /// GET /pengajuan-izin/me → daftar izin milik karyawan.
  /// Opsional: filter berdasarkan startDate & endDate.
  Future<List<dynamic>> getMyLeaveRequests({
    String? startDate,
    String? endDate,
  }) async {
    final query = <String, String>{};
    if (startDate != null) query['startDate'] = startDate;
    if (endDate != null) query['endDate'] = endDate;

    final res = await get('/pengajuan-izin/me', query: query);
    return _handleDynamic(res) ?? [];
  }

  /// POST /pengajuan-izin → submit izin baru (JSON atau multipart jika ada file pendukung).
  Future<Map<String, dynamic>> submitLeaveRequest({
    required int idKaryawan,
    required String jenisIzin,
    required String tanggalMulai,
    required String tanggalSelesai,
    required String alasan,
    String? filePath,
    List<int>? fileBytes,
    String? fileName,
    double? lokasiLat,
    double? lokasiLng,
    String? jamMulai,
    String? jamSelesai,
  }) async {
    List<int>? uploadBytes = fileBytes;
    String? uploadFileName = fileName;

    if (uploadBytes == null && filePath != null && filePath.isNotEmpty) {
      final file = File(filePath);
      if (await file.exists()) {
        uploadBytes = await file.readAsBytes();
        uploadFileName = filePath.split(RegExp(r'[\\/]')).last;
      }
    }

    if (uploadBytes != null &&
        uploadFileName != null &&
        uploadFileName.isNotEmpty) {
      final ext = uploadFileName.contains('.')
          ? uploadFileName.split('.').last.toLowerCase()
          : '';
      String mime = 'application/octet-stream';
      if (ext == 'pdf') {
        mime = 'application/pdf';
      } else if (ext == 'png') {
        mime = 'image/png';
      } else if (ext == 'jpg' || ext == 'jpeg') {
        mime = 'image/jpeg';
      } else if (ext == 'doc') {
        mime = 'application/msword';
      } else if (ext == 'docx') {
        mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }

      final formMap = <String, dynamic>{
        'idKaryawan': idKaryawan.toString(),
        'jenisIzin': jenisIzin,
        'tanggalMulai': tanggalMulai,
        'tanggalSelesai': tanggalSelesai,
        'alasan': alasan,
        'filePendukung': MultipartFile(
          uploadBytes,
          filename: uploadFileName,
          contentType: mime,
        ),
      };
      if (lokasiLat != null) formMap['lokasiLat'] = lokasiLat.toString();
      if (lokasiLng != null) formMap['lokasiLng'] = lokasiLng.toString();
      if (jamMulai != null) formMap['jamMulai'] = jamMulai;
      if (jamSelesai != null) formMap['jamSelesai'] = jamSelesai;

      final res = await post('/pengajuan-izin', FormData(formMap));
      return _handle(res);
    }

    final body = <String, dynamic>{
      'idKaryawan': idKaryawan,
      'jenisIzin': jenisIzin,
      'tanggalMulai': tanggalMulai,
      'tanggalSelesai': tanggalSelesai,
      'alasan': alasan,
    };
    if (lokasiLat != null) body['lokasiLat'] = lokasiLat;
    if (lokasiLng != null) body['lokasiLng'] = lokasiLng;
    if (jamMulai != null) body['jamMulai'] = jamMulai;
    if (jamSelesai != null) body['jamSelesai'] = jamSelesai;

    final res = await post('/pengajuan-izin', body);
    return _handle(res);
  }

  // ---------- Riwayat Absensi (Mobile) ----------

  /// GET /absensi/me/history → riwayat absensi.
  /// Opsional: filter berdasarkan startDate & endDate.
  Future<List<dynamic>> getAttendanceHistory({
    String? startDate,
    String? endDate,
  }) async {
    final query = <String, String>{};
    if (startDate != null) query['startDate'] = startDate;
    if (endDate != null) query['endDate'] = endDate;

    final res = await get('/absensi/me/history', query: query);
    return _handleDynamic(res) ?? [];
  }

  /// PATCH /auth/mobile/update-profile → update data profil lengkap karyawan.
  Future<Map<String, dynamic>> updateProfile({
    String? nama,
    String? email,
    String? nomorTelepon,
    String? namaPanggilan,
    String? agama,
    String? tempatLahir,
    String? tanggalLahir,
    String? statusPerkawinan,
    String? namaIbuKandung,
    String? kotaTerbitKtp,
    String? kabupaten,
    String? kecamatan,
    String? kelurahan,
    String? rtRw,
    String? jenisKelamin,
  }) async {
    final body = <String, dynamic>{};
    if (nama != null) body['nama'] = nama;
    if (email != null) body['email'] = email;
    if (nomorTelepon != null) body['nomorTelepon'] = nomorTelepon;
    if (namaPanggilan != null) body['namaPanggilan'] = namaPanggilan;
    if (agama != null) body['agama'] = agama;
    if (tempatLahir != null) body['tempatLahir'] = tempatLahir;
    if (tanggalLahir != null) body['tanggalLahir'] = tanggalLahir;
    if (statusPerkawinan != null) body['statusPerkawinan'] = statusPerkawinan;
    if (namaIbuKandung != null) body['namaIbuKandung'] = namaIbuKandung;
    if (kotaTerbitKtp != null) body['kotaTerbitKtp'] = kotaTerbitKtp;
    if (kabupaten != null) body['kabupaten'] = kabupaten;
    if (kecamatan != null) body['kecamatan'] = kecamatan;
    if (kelurahan != null) body['kelurahan'] = kelurahan;
    if (rtRw != null) body['rtRw'] = rtRw;
    if (jenisKelamin != null) body['jenisKelamin'] = jenisKelamin;

    final res = await patch('/auth/mobile/update-profile', body);
    return _handle(res);
  }

  /// PATCH /auth/mobile/ktp-photo → upload foto KTP (multipart).
  Future<Map<String, dynamic>> uploadKtpPhoto(String filePath) async {
    final file = File(filePath);
    final bytes = await file.readAsBytes();
    final fileName = filePath.split(RegExp(r'[\\/]')).last;
    final ext = fileName.contains('.')
        ? fileName.split('.').last.toLowerCase()
        : 'jpg';
    final mime = ext == 'png'
        ? 'image/png'
        : ext == 'webp'
        ? 'image/webp'
        : 'image/jpeg';

    final form = FormData({
      'foto': MultipartFile(bytes, filename: fileName, contentType: mime),
    });
    final res = await patch('/auth/mobile/ktp-photo', form);
    return _handle(res);
  }

  /// PATCH /auth/mobile/kk-photo → upload foto KK (multipart).
  Future<Map<String, dynamic>> uploadKkPhoto(String filePath) async {
    final file = File(filePath);
    final bytes = await file.readAsBytes();
    final fileName = filePath.split(RegExp(r'[\\/]')).last;
    final ext = fileName.contains('.')
        ? fileName.split('.').last.toLowerCase()
        : 'jpg';
    final mime = ext == 'png'
        ? 'image/png'
        : ext == 'webp'
        ? 'image/webp'
        : 'image/jpeg';

    final form = FormData({
      'foto': MultipartFile(bytes, filename: fileName, contentType: mime),
    });
    final res = await patch('/auth/mobile/kk-photo', form);
    return _handle(res);
  }

  /// PATCH /auth/mobile/change-password → ganti password.
  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final res = await patch('/auth/mobile/change-password', {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
    return _handle(res);
  }

  /// PATCH /auth/mobile/profile-photo → upload foto profil (multipart).
  Future<Map<String, dynamic>> uploadProfilePhoto(String filePath) async {
    final file = File(filePath);
    final bytes = await file.readAsBytes();
    final fileName = filePath.split(RegExp(r'[\\/]')).last;
    final ext = fileName.contains('.')
        ? fileName.split('.').last.toLowerCase()
        : 'jpg';
    final mime = ext == 'png'
        ? 'image/png'
        : ext == 'webp'
        ? 'image/webp'
        : 'image/jpeg';

    final form = FormData({
      'foto': MultipartFile(bytes, filename: fileName, contentType: mime),
    });
    final res = await patch('/auth/mobile/profile-photo', form);
    return _handle(res);
  }

  // ---------- Alur Pertukaran Jadwal (Shift & Off) ----------

  /// Ambil daftar shift yang tersedia
  Future<List<dynamic>> getShifts() async {
    final res = await get('/pengajuan-pertukaran/shifts');
    if (!res.isOk) {
      throw ApiException(
        res.body?['message'] ?? 'Gagal mengambil data shift',
        res.statusCode,
      );
    }
    if (res.body is List) {
      return res.body as List<dynamic>;
    }
    return [];
  }

  /// Mengambil jadwal nyata karyawan pemohon pada tanggal tertentu
  Future<Map<String, dynamic>> getMySchedule({
    required String tanggal,
  }) async {
    final res = await get(
      '/pengajuan-pertukaran/my-schedule',
      query: {'tanggal': tanggal},
    );
    if (!res.isOk) {
      throw ApiException(
        res.body?['message'] ?? 'Gagal memuat jadwal Anda pada tanggal ini',
        res.statusCode,
      );
    }
    if (res.body is Map) {
      return Map<String, dynamic>.from(res.body as Map);
    }
    return {};
  }

  /// Cari rekan sebidang yang memiliki shift/off yang cocok pada tanggalTarget
  Future<List<dynamic>> getAvailablePeers({
    required String tanggalTarget,
    required String jenisPertukaran,
    int? idShiftTarget,
  }) async {
    final query = {
      'tanggalTarget': tanggalTarget,
      'jenisPertukaran': jenisPertukaran,
      if (idShiftTarget != null) 'idShiftTarget': idShiftTarget.toString(),
    };
    final res = await get(
      '/pengajuan-pertukaran/available-peers',
      query: query,
    );
    if (!res.isOk) {
      throw ApiException(
        res.body?['message'] ?? 'Gagal mencari rekan kerja yang cocok',
        res.statusCode,
      );
    }
    if (res.body is List) {
      return res.body as List<dynamic>;
    }
    return [];
  }

  /// Submit pengajuan pertukaran shift / off
  Future<Map<String, dynamic>> createPertukaran({
    required int idKaryawanTarget,
    required String jenisPertukaran,
    required String tanggalPemohon,
    int? idShiftPemohon,
    required String tanggalTarget,
    int? idShiftTarget,
    String? alasan,
  }) async {
    final body = {
      'idKaryawanTarget': idKaryawanTarget,
      'jenisPertukaran': jenisPertukaran,
      'tanggalPemohon': tanggalPemohon,
      if (idShiftPemohon != null) 'idShiftPemohon': idShiftPemohon,
      'tanggalTarget': tanggalTarget,
      if (idShiftTarget != null) 'idShiftTarget': idShiftTarget,
      if (alasan != null && alasan.isNotEmpty) 'alasan': alasan,
    };
    final res = await post('/pengajuan-pertukaran', body);
    return _handle(res);
  }

  /// Ambil semua pengajuan pertukaran saya
  Future<List<dynamic>> getMyPertukaran() async {
    final res = await get('/pengajuan-pertukaran/my');
    if (!res.isOk) {
      throw ApiException(
        res.body?['message'] ?? 'Gagal memuat pengajuan pertukaran',
        res.statusCode,
      );
    }
    if (res.body is List) {
      return res.body as List<dynamic>;
    }
    return [];
  }

  /// Ambil permintaan pertukaran masuk dari rekan (butuh konfirmasi)
  Future<List<dynamic>> getIncomingPertukaran() async {
    final res = await get('/pengajuan-pertukaran/incoming');
    if (!res.isOk) {
      throw ApiException(
        res.body?['message'] ?? 'Gagal memuat permintaan masuk',
        res.statusCode,
      );
    }
    if (res.body is List) {
      return res.body as List<dynamic>;
    }
    return [];
  }

  /// Tanggapi permintaan pertukaran dari rekan (Setujui / Tolak)
  Future<Map<String, dynamic>> respondPeerPertukaran(
    int idPertukaran, {
    required bool setuju,
    String? catatan,
  }) async {
    final body = {
      'setuju': setuju,
      'status': setuju ? 'disetujui' : 'ditolak',
      if (catatan != null && catatan.isNotEmpty) 'catatan': catatan,
    };
    final res = await patch(
      '/pengajuan-pertukaran/$idPertukaran/respond-peer',
      body,
    );
    return _handle(res);
  }

  /// Cek apakah karyawan berhak mengajukan pertukaran (khusus operasional/SPV)
  Future<Map<String, dynamic>> checkExchangeEligibility() async {
    final res = await get('/pengajuan-pertukaran/eligibility');
    return _handle(res);
  }

  // ---------- Regular Off (Mobile) ----------

  Future<Map<String, dynamic>> checkRegularOffEligibility() async {
    return _handle(await get('/regular-off/eligibility'));
  }

  Future<Map<String, dynamic>> getRegularOffBalance() async {
    return _handle(await get('/regular-off/saldo'));
  }

  Future<Map<String, dynamic>> submitRegularOff({
    required List<String> tanggalDipilih,
    String? alasan,
  }) async {
    return _handle(
      await post('/regular-off/pengajuan', {
        'tanggalDipilih': tanggalDipilih,
        if (alasan != null && alasan.isNotEmpty) 'alasan': alasan,
      }),
    );
  }

  Future<List<dynamic>> getMyRegularOffRequests() async {
    final response = await get('/regular-off/pengajuan/my');
    return (_handleDynamic(response) as List?) ?? [];
  }

  Future<Map<String, dynamic>> cancelRegularOff(int idPengajuan) async {
    return _handle(
      await patch('/regular-off/pengajuan/$idPengajuan/cancel', {}),
    );
  }

  /// GET /aturan-pengajuan/me → { boleh, pesan, terpakai, maks } untuk jenis pengajuan.
  Future<Map<String, dynamic>> cekKuotaPengajuan(String jenis, {DateTime? tanggal}) async {
    final res = await get('/aturan-pengajuan/me', query: {
      'jenis': jenis,
      if (tanggal != null)
        'tanggal':
            '${tanggal.year}-${tanggal.month.toString().padLeft(2, '0')}-${tanggal.day.toString().padLeft(2, '0')}',
    });
    return _handle(res);
  }

  /// GET /kasbon/me → { totalSisa, kasbon: [...] }.
  Future<Map<String, dynamic>> getMyKasbon() async {
    final res = await get('/kasbon/me');
    return _handle(res);
  }

  /// POST /kasbon/me → pengajuan kasbon (menunggu persetujuan HRD).
  Future<Map<String, dynamic>> ajukanKasbon({
    required int jumlah,
    required int cicilanPerBulan,
    required String alasan,
  }) async {
    final res = await post('/kasbon/me', {
      'jumlah': jumlah,
      'cicilanPerBulan': cicilanPerBulan,
      'alasan': alasan,
    });
    return _handle(res);
  }

  /// PATCH /kasbon/me/:id/batal → batalkan pengajuan yang masih menunggu.
  Future<Map<String, dynamic>> batalkanKasbon(int idKasbon) async {
    final res = await patch('/kasbon/me/$idKasbon/batal', {});
    return _handle(res);
  }

  /// GET /pengajuan-izin/me/saldo-cuti → { jatah, terpakai, menunggu, sisa, tahun }.
  Future<Map<String, dynamic>> getSaldoCuti() async {
    final res = await get('/pengajuan-izin/me/saldo-cuti');
    return _handle(res);
  }

  /// Ambil snapshot slip resmi exact-period atau pratinjau berjalan.
  Future<Map<String, dynamic>> getMySlip({String? tanggal}) async {
    final query = <String, String>{};
    if (tanggal != null && tanggal.isNotEmpty) {
      query['tanggal'] = tanggal;
    }
    final res = await get('/penggajian/me/slip', query: query);
    return _handle(res);
  }

  /// POST /laporan-masalah/mobile → kirim laporan kendala aplikasi (multipart jika ada lampiran).
  Future<Map<String, dynamic>> submitLaporanMasalah({
    required String kategori,
    required String judul,
    required String deskripsi,
    String? langkahReproduksi,
    Map<String, dynamic>? deviceInfo,
    String? filePath,
  }) async {
    final Map<String, dynamic> formMap = {
      'kategori': kategori,
      'judul': judul,
      'deskripsi': deskripsi,
    };
    if (langkahReproduksi != null && langkahReproduksi.isNotEmpty) {
      formMap['langkahReproduksi'] = langkahReproduksi;
    }
    if (deviceInfo != null) {
      formMap['deviceInfo'] = jsonEncode(deviceInfo);
    }
    if (filePath != null && filePath.isNotEmpty) {
      final file = File(filePath);
      if (await file.exists()) {
        final bytes = await file.readAsBytes();
        final fileName = filePath.split(RegExp(r'[\\/]')).last;
        final ext = fileName.contains('.') ? fileName.split('.').last.toLowerCase() : 'jpg';
        final mime = ext == 'png' ? 'image/png' : ext == 'webp' ? 'image/webp' : 'image/jpeg';
        formMap['file'] = MultipartFile(bytes, filename: fileName, contentType: mime);
      }
    }
    final res = await post('/laporan-masalah/mobile', FormData(formMap));
    return _handle(res);
  }

  /// GET /laporan-masalah/my-mobile → daftar laporan kendala milik karyawan.
  Future<List<dynamic>> getMyLaporanMasalah() async {
    final res = await get('/laporan-masalah/my-mobile');
    if (!res.isOk) {
      throw ApiException(
        res.body is Map && res.body['message'] != null
            ? res.body['message'].toString()
            : 'Gagal memuat riwayat laporan',
        res.statusCode,
      );
    }
    if (res.body is List) {
      return res.body as List<dynamic>;
    }
    return [];
  }

  /// GET /tunda-off/pengajuan/my → daftar pengajuan tunda off milik karyawan.
  Future<List<dynamic>> getMyTundaOff() async {
    final res = await get('/tunda-off/pengajuan/my');
    if (!res.isOk) {
      throw ApiException(
        res.body is Map && res.body['message'] != null
            ? res.body['message'].toString()
            : 'Gagal memuat tunda off',
        res.statusCode,
      );
    }
    if (res.body is List) {
      return res.body as List<dynamic>;
    }
    return [];
  }

  /// POST /tunda-off/pengajuan → buat pengajuan tunda off baru.
  Future<Map<String, dynamic>> createTundaOff({
    required String tanggalOffAsal,
    required String tanggalOffBaru,
    required String alasan,
  }) async {
    final res = await post('/tunda-off/pengajuan', {
      'tanggalOffAsal': tanggalOffAsal,
      'tanggalOffBaru': tanggalOffBaru,
      'alasan': alasan,
    });
    return _handle(res);
  }

  /// PATCH /tunda-off/pengajuan/:id/cancel → batalkan pengajuan tunda off.
  Future<Map<String, dynamic>> cancelTundaOff(int id) async {
    final res = await patch('/tunda-off/pengajuan/$id/cancel', {});
    return _handle(res);
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}
