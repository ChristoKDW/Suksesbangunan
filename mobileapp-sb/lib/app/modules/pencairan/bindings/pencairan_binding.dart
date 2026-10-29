import 'package:get/get.dart';

import '../controllers/pencairan_controller.dart';

class PencairanBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<PencairanController>(() => PencairanController());
  }
}
