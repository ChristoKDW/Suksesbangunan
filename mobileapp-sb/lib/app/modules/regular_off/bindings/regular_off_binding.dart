import 'package:get/get.dart';
import '../controllers/regular_off_controller.dart';

class RegularOffBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<RegularOffController>(
      () => RegularOffController(),
    );
  }
}
