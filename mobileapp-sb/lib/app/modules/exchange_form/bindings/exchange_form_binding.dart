import 'package:get/get.dart';
import '../controllers/exchange_form_controller.dart';

class ExchangeFormBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<ExchangeFormController>(() => ExchangeFormController());
  }
}
