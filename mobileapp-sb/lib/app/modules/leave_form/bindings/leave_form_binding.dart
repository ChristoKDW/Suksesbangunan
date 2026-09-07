import 'package:get/get.dart';

import '../controllers/leave_form_controller.dart';

class LeaveFormBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<LeaveFormController>(
      () => LeaveFormController(),
    );
  }
}
