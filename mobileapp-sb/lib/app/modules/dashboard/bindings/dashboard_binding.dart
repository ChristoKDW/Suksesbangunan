import 'package:get/get.dart';

import '../controllers/dashboard_controller.dart';
import '../../home/controllers/home_controller.dart';
import '../../schedule/controllers/schedule_controller.dart';
import '../../leave/controllers/leave_controller.dart';
import '../../history/controllers/history_controller.dart';

// ponytail: Register dashboard + all child tab controllers in one binding.
class DashboardBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<DashboardController>(() => DashboardController());
    Get.lazyPut<HomeController>(() => HomeController());
    Get.lazyPut<ScheduleController>(() => ScheduleController());
    Get.lazyPut<LeaveController>(() => LeaveController());
    Get.lazyPut<HistoryController>(() => HistoryController());
  }
}
