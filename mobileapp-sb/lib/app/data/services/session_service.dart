import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

/// Menyimpan sesi login (token & data karyawan) secara persisten ke disk
/// menggunakan GetStorage. Saat app dibuka kembali setelah ditutup,
/// sesi login tetap aktif tanpa perlu login ulang.
class SessionService extends GetxService {
  late final GetStorage _box;

  static const _keyToken = 'token';
  static const _keyIdKaryawan = 'idKaryawan';
  static const _keyNama = 'nama';
  static const _keyNik = 'nik';
  static const _keySudahRegistrasiWajah = 'sudahRegistrasiWajah';

  // Reactive wrappers agar UI yang sudah pakai .obs tetap jalan.
  final RxnString token = RxnString();
  final RxnInt idKaryawan = RxnInt();
  final RxnString nama = RxnString();
  final RxnString nik = RxnString();
  final RxBool sudahRegistrasiWajah = false.obs;

  bool get isLoggedIn => token.value != null && token.value!.isNotEmpty;

  Future<SessionService> init() async {
    _box = GetStorage();
    await GetStorage.init();
    _loadFromDisk();
    return this;
  }

  /// Baca data yang tersimpan di disk ke reactive variables.
  void _loadFromDisk() {
    token.value = _box.read<String>(_keyToken);
    idKaryawan.value = _box.read<int>(_keyIdKaryawan);
    nama.value = _box.read<String>(_keyNama);
    nik.value = _box.read<String>(_keyNik);
    sudahRegistrasiWajah.value =
        _box.read<bool>(_keySudahRegistrasiWajah) ?? false;
  }

  void saveLogin({
    required String token,
    required int idKaryawan,
    required String nama,
    required String nik,
    required bool sudahRegistrasiWajah,
  }) {
    // Simpan ke reactive
    this.token.value = token;
    this.idKaryawan.value = idKaryawan;
    this.nama.value = nama;
    this.nik.value = nik;
    this.sudahRegistrasiWajah.value = sudahRegistrasiWajah;

    // Simpan ke disk
    _box.write(_keyToken, token);
    _box.write(_keyIdKaryawan, idKaryawan);
    _box.write(_keyNama, nama);
    _box.write(_keyNik, nik);
    _box.write(_keySudahRegistrasiWajah, sudahRegistrasiWajah);
  }

  void markFaceRegistered() {
    sudahRegistrasiWajah.value = true;
    _box.write(_keySudahRegistrasiWajah, true);
  }

  void clear() {
    token.value = null;
    idKaryawan.value = null;
    nama.value = null;
    nik.value = null;
    sudahRegistrasiWajah.value = false;

    _box.remove(_keyToken);
    _box.remove(_keyIdKaryawan);
    _box.remove(_keyNama);
    _box.remove(_keyNik);
    _box.remove(_keySudahRegistrasiWajah);
  }
}
