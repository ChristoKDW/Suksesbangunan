import 'package:get/get.dart';
import '../controllers/laporan_masalah_controller.dart';

class LaporanMasalahBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<LaporanMasalahController>(
      () => LaporanMasalahController(),
    );
  }
}
