import 'package:get/get.dart';

import '../controllers/slip_gaji_controller.dart';

class SlipGajiBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<SlipGajiController>(() => SlipGajiController());
  }
}
