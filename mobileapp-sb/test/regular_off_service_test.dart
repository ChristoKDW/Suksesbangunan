import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:comp_attendance_mobile/app/data/services/api_service.dart';
import 'package:comp_attendance_mobile/app/data/services/regular_off_service.dart';
import 'package:comp_attendance_mobile/app/data/services/session_service.dart';

class FakeApiService extends ApiService {
  @override
  Future<Map<String, dynamic>> checkRegularOffEligibility() async => {
    'isOperasional': true,
  };

  @override
  Future<Map<String, dynamic>> getRegularOffBalance() async => {
    'totalTersedia': 1,
    'items': [],
  };

  @override
  Future<List<dynamic>> getMyRegularOffRequests() async => [
    {'idPengajuanRo': 9, 'status': 'menunggu_hrd'},
  ];

  @override
  Future<Map<String, dynamic>> submitRegularOff({
    required List<String> tanggalDipilih,
    String? alasan,
  }) async => {'tanggalDipilih': tanggalDipilih, 'alasan': alasan};

  @override
  Future<Map<String, dynamic>> cancelRegularOff(int idPengajuan) async => {
    'idPengajuanRo': idPengajuan,
    'status': 'dibatalkan',
  };
}

void main() {
  setUp(() {
    Get.reset();
    Get.put(SessionService());
    Get.put<ApiService>(FakeApiService());
  });

  tearDown(Get.reset);

  test('maps Regular Off API responses without mock data', () async {
    final service = RegularOffService();

    expect((await service.checkEligibility())['isOperasional'], isTrue);
    expect((await service.getMySaldo())['totalTersedia'], 1);
    expect((await service.getMyPengajuan()).single['idPengajuanRo'], 9);
    expect(
      (await service.submitPengajuan(
        tanggalDipilih: ['2026-10-01'],
        alasan: 'Keluarga',
      ))['tanggalDipilih'],
      ['2026-10-01'],
    );
    expect((await service.cancelPengajuan(9))['status'], 'dibatalkan');
  });
}
