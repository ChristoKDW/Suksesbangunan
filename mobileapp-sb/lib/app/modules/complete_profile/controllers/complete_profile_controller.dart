import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../../core/config/app_config.dart';
import '../../../data/services/api_service.dart';
import '../../../data/services/session_service.dart';
import '../../../routes/app_pages.dart';

class CompleteProfileController extends GetxController {
  final ApiService _api = Get.find<ApiService>();
  final SessionService _session = Get.find<SessionService>();
  final ImagePicker _picker = ImagePicker();

  // Controllers untuk field yang locked (read-only)
  final nikController = TextEditingController();
  final namaController = TextEditingController();
  final emailController = TextEditingController();

  // Controllers untuk field identitas yang dapat diisi / diedit
  final namaPanggilanController = TextEditingController();
  final nomorTeleponController = TextEditingController();
  final tempatLahirController = TextEditingController();
  final tanggalLahirController = TextEditingController();
  final namaIbuKandungController = TextEditingController();
  final kotaTerbitKtpController = TextEditingController();
  final kabupatenController = TextEditingController();
  final kecamatanController = TextEditingController();
  final kelurahanController = TextEditingController();
  final rtRwController = TextEditingController();

  // Reactive dropdown values
  final selectedAgama = 'Islam'.obs;
  final listAgama = [
    'Islam',
    'Kristen Protestan',
    'Katolik',
    'Hindu',
    'Buddha',
    'Konghucu',
  ];

  final selectedStatusPerkawinan = 'Belum Kawin'.obs;
  final listStatusPerkawinan = [
    'Belum Kawin',
    'Kawin',
    'Cerai Hidup',
    'Cerai Mati',
  ];

  // Observables untuk status upload & path
  final isLoading = true.obs;
  final isSubmitting = false.obs;

  final isUploadingKtp = false.obs;
  final isUploadingKk = false.obs;
  final isUploadingProfil = false.obs;

  final fotoKtpPath = RxnString();
  final fotoKkPath = RxnString();
  final fotoProfilPath = RxnString();

  final localKtpPath = RxnString();
  final localKkPath = RxnString();
  final localProfilPath = RxnString();

  @override
  void onInit() {
    super.onInit();
    fetchInitialProfile();
  }

  String? fullUrl(String? path) {
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final clean = path.replaceAll('\\', '/');
    return '${AppConfig.baseUrl}${clean.startsWith('/') ? '' : '/'}$clean';
  }

  Future<void> fetchInitialProfile() async {
    isLoading.value = true;
    try {
      final p = await _api.getMyProfile();

      nikController.text = p['nik']?.toString() ?? _session.nik.value ?? '';
      namaController.text = p['nama']?.toString() ?? _session.nama.value ?? '';
      emailController.text = p['email']?.toString() ?? '';
      nomorTeleponController.text = p['nomorTelepon']?.toString() ?? '';

      if (p['namaPanggilan'] != null) {
        namaPanggilanController.text = p['namaPanggilan'].toString();
      }
      if (p['tempatLahir'] != null) {
        tempatLahirController.text = p['tempatLahir'].toString();
      }
      if (p['tanggalLahir'] != null) {
        tanggalLahirController.text = p['tanggalLahir'].toString();
      }
      if (p['namaIbuKandung'] != null) {
        namaIbuKandungController.text = p['namaIbuKandung'].toString();
      }
      if (p['kotaTerbitKtp'] != null) {
        kotaTerbitKtpController.text = p['kotaTerbitKtp'].toString();
      }
      if (p['kabupaten'] != null) {
        kabupatenController.text = p['kabupaten'].toString();
      }
      if (p['kecamatan'] != null) {
        kecamatanController.text = p['kecamatan'].toString();
      }
      if (p['kelurahan'] != null) {
        kelurahanController.text = p['kelurahan'].toString();
      }
      if (p['rtRw'] != null) {
        rtRwController.text = p['rtRw'].toString();
      }

      final ag = p['agama']?.toString();
      if (ag != null && listAgama.contains(ag)) {
        selectedAgama.value = ag;
      }

      final st = p['statusPerkawinan']?.toString();
      if (st != null && listStatusPerkawinan.contains(st)) {
        selectedStatusPerkawinan.value = st;
      }

      if (p['fotoKtp'] != null && p['fotoKtp'].toString().isNotEmpty) {
        fotoKtpPath.value = p['fotoKtp'].toString();
      }
      if (p['fotoKartuKeluarga'] != null &&
          p['fotoKartuKeluarga'].toString().isNotEmpty) {
        fotoKkPath.value = p['fotoKartuKeluarga'].toString();
      }
      if (p['fotoProfil'] != null &&
          p['fotoProfil'].toString().isNotEmpty) {
        fotoProfilPath.value = p['fotoProfil'].toString();
      }
    } catch (e) {
      Get.snackbar(
        'Peringatan',
        'Gagal memuat profil: $e',
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> pickDate(BuildContext context) async {
    DateTime initial = DateTime.now().subtract(const Duration(days: 365 * 20));
    try {
      if (tanggalLahirController.text.isNotEmpty) {
        final parsed = DateFormat('yyyy-MM-dd').parse(tanggalLahirController.text);
        initial = parsed;
      }
    } catch (_) {}

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
    );

    if (picked != null) {
      tanggalLahirController.text = DateFormat('yyyy-MM-dd').format(picked);
    }
  }

  // --- Upload Foto KTP ---
  Future<void> pickKtpPhoto(ImageSource source) async {
    final XFile? file = await _picker.pickImage(
      source: source,
      imageQuality: 85,
    );
    if (file == null) return;

    localKtpPath.value = file.path;
    isUploadingKtp.value = true;
    try {
      final res = await _api.uploadKtpPhoto(file.path);
      fotoKtpPath.value = res['fotoKtp']?.toString() ?? file.path;
      Get.snackbar(
        'Berhasil',
        'Foto KTP berhasil disimpan',
        backgroundColor: const Color(0xFF16A34A),
        colorText: Colors.white,
      );
    } catch (e) {
      Get.snackbar('Gagal Upload KTP', e.toString());
    } finally {
      isUploadingKtp.value = false;
    }
  }

  // --- Upload Foto KK ---
  Future<void> pickKkPhoto(ImageSource source) async {
    final XFile? file = await _picker.pickImage(
      source: source,
      imageQuality: 85,
    );
    if (file == null) return;

    localKkPath.value = file.path;
    isUploadingKk.value = true;
    try {
      final res = await _api.uploadKkPhoto(file.path);
      fotoKkPath.value = res['fotoKartuKeluarga']?.toString() ?? file.path;
      Get.snackbar(
        'Berhasil',
        'Foto Kartu Keluarga berhasil disimpan',
        backgroundColor: const Color(0xFF16A34A),
        colorText: Colors.white,
      );
    } catch (e) {
      Get.snackbar('Gagal Upload KK', e.toString());
    } finally {
      isUploadingKk.value = false;
    }
  }

  // --- Upload Foto Profil ---
  Future<void> pickProfilePhoto(ImageSource source) async {
    final XFile? file = await _picker.pickImage(
      source: source,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 80,
    );
    if (file == null) return;

    localProfilPath.value = file.path;
    isUploadingProfil.value = true;
    try {
      final res = await _api.uploadProfilePhoto(file.path);
      fotoProfilPath.value = res['fotoProfil']?.toString() ?? file.path;
      Get.snackbar(
        'Berhasil',
        'Foto Profil berhasil disimpan',
        backgroundColor: const Color(0xFF16A34A),
        colorText: Colors.white,
      );
    } catch (e) {
      Get.snackbar('Gagal Upload Profil', e.toString());
    } finally {
      isUploadingProfil.value = false;
    }
  }

  // --- Simpan dan Lanjut ke Registrasi Wajah ---
  Future<void> submitAndProceed() async {
    // Validasi Foto KTP
    if (fotoKtpPath.value == null && localKtpPath.value == null) {
      Get.snackbar('Perhatian', 'Foto KTP wajib diupload');
      return;
    }

    // Validasi Foto KK
    if (fotoKkPath.value == null && localKkPath.value == null) {
      Get.snackbar('Perhatian', 'Foto Kartu Keluarga (KK) wajib diupload');
      return;
    }

    // Validasi Foto Profil
    if (fotoProfilPath.value == null && localProfilPath.value == null) {
      Get.snackbar('Perhatian', 'Foto profil formal wajib diupload');
      return;
    }

    // Validasi Field Identitas
    if (namaPanggilanController.text.trim().isEmpty) {
      Get.snackbar('Perhatian', 'Nama panggilan wajib diisi');
      return;
    }
    if (tempatLahirController.text.trim().isEmpty) {
      Get.snackbar('Perhatian', 'Tempat lahir wajib diisi');
      return;
    }
    if (tanggalLahirController.text.trim().isEmpty) {
      Get.snackbar('Perhatian', 'Tanggal lahir wajib diisi');
      return;
    }
    if (namaIbuKandungController.text.trim().isEmpty) {
      Get.snackbar('Perhatian', 'Nama ibu kandung wajib diisi');
      return;
    }
    if (kotaTerbitKtpController.text.trim().isEmpty) {
      Get.snackbar('Perhatian', 'Kota/Kab. terbit KTP wajib diisi');
      return;
    }
    if (kabupatenController.text.trim().isEmpty) {
      Get.snackbar('Perhatian', 'Kabupaten / Kota domisili wajib diisi');
      return;
    }
    if (kecamatanController.text.trim().isEmpty) {
      Get.snackbar('Perhatian', 'Kecamatan domisili wajib diisi');
      return;
    }
    if (kelurahanController.text.trim().isEmpty) {
      Get.snackbar('Perhatian', 'Kelurahan domisili wajib diisi');
      return;
    }
    if (rtRwController.text.trim().isEmpty) {
      Get.snackbar('Perhatian', 'RT / RW wajib diisi');
      return;
    }

    isSubmitting.value = true;
    try {
      await _api.updateProfile(
        namaPanggilan: namaPanggilanController.text.trim(),
        tempatLahir: tempatLahirController.text.trim(),
        tanggalLahir: tanggalLahirController.text.trim(),
        agama: selectedAgama.value,
        statusPerkawinan: selectedStatusPerkawinan.value,
        namaIbuKandung: namaIbuKandungController.text.trim(),
        kotaTerbitKtp: kotaTerbitKtpController.text.trim(),
        kabupaten: kabupatenController.text.trim(),
        kecamatan: kecamatanController.text.trim(),
        kelurahan: kelurahanController.text.trim(),
        rtRw: rtRwController.text.trim(),
        nomorTelepon: nomorTeleponController.text.trim().isNotEmpty
            ? nomorTeleponController.text.trim()
            : null,
      );

      _session.markProfileCompleted();

      Get.snackbar(
        'Data Lengkap!',
        'Data diri & dokumen berhasil disimpan. Silakan lanjutkan pendaftaran wajah.',
        backgroundColor: const Color(0xFF16A34A),
        colorText: Colors.white,
        duration: const Duration(seconds: 3),
      );

      // Pindah ke Registrasi Wajah
      Get.offAllNamed(Routes.FACE_REGISTRATION);
    } catch (e) {
      Get.snackbar(
        'Gagal Menyimpan Data',
        e.toString(),
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isSubmitting.value = false;
    }
  }

  @override
  void onClose() {
    nikController.dispose();
    namaController.dispose();
    emailController.dispose();
    namaPanggilanController.dispose();
    nomorTeleponController.dispose();
    tempatLahirController.dispose();
    tanggalLahirController.dispose();
    namaIbuKandungController.dispose();
    kotaTerbitKtpController.dispose();
    kabupatenController.dispose();
    kecamatanController.dispose();
    kelurahanController.dispose();
    rtRwController.dispose();
    super.onClose();
  }
}
