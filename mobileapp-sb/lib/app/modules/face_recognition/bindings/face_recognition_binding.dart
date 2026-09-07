import 'package:get/get.dart';

import '../controllers/face_recognition_controller.dart';

class FaceRecognitionBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<FaceRecognitionController>(
      () => FaceRecognitionController(),
    );
  }
}
