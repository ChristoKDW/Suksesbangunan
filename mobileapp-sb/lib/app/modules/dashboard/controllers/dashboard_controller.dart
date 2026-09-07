import 'package:get/get.dart';

// ponytail: Just an observable tab index, nothing more.
class DashboardController extends GetxController {
  final tabIndex = 0.obs;

  void changeTabIndex(int index) {
    tabIndex.value = index;
  }
}
