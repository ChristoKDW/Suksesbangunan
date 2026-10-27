import 'package:get/get.dart';

import '../controllers/tunda_off_controller.dart';

class TundaOffBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<TundaOffController>(() => TundaOffController());
  }
}
