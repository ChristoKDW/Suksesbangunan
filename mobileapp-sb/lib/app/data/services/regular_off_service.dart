import 'package:get/get.dart';

import 'api_service.dart';

class RegularOffService extends GetxService {
  final ApiService _api = Get.find<ApiService>();

  Future<Map<String, dynamic>> checkEligibility() =>
      _api.checkRegularOffEligibility();

  Future<Map<String, dynamic>> getMySaldo() => _api.getRegularOffBalance();

  Future<Map<String, dynamic>> submitPengajuan({
    required List<String> tanggalDipilih,
    String? alasan,
  }) => _api.submitRegularOff(tanggalDipilih: tanggalDipilih, alasan: alasan);

  Future<List<Map<String, dynamic>>> getMyPengajuan() async {
    final items = await _api.getMyRegularOffRequests();
    return items.map((item) => Map<String, dynamic>.from(item as Map)).toList();
  }

  Future<Map<String, dynamic>> cancelPengajuan(int idPengajuan) =>
      _api.cancelRegularOff(idPengajuan);
}
