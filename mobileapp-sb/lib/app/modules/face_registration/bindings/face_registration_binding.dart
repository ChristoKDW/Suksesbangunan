import 'package:get/get.dart';
import '../controllers/face_registration_controller.dart';

class FaceRegistrationBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<FaceRegistrationController>(
      () => FaceRegistrationController(),
    );
  }
}
