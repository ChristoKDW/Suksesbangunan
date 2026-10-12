import 'package:get/get.dart';
import '../../../routes/app_pages.dart';
import '../../../data/services/session_service.dart';

class SplashController extends GetxController {
  @override
  void onInit() {
    super.onInit();
    _checkSessionAndNavigate();
  }

  void _checkSessionAndNavigate() {
    Future.delayed(const Duration(seconds: 2), () {
      final session = Get.find<SessionService>();

      if (session.isLoggedIn) {
        if (!session.sudahLengkapData.value) {
          Get.offAllNamed(Routes.COMPLETE_PROFILE);
        } else if (!session.sudahRegistrasiWajah.value) {
          Get.offAllNamed(Routes.FACE_REGISTRATION);
        } else {
          Get.offAllNamed(Routes.DASHBOARD);
        }
      } else {
        // Belum login → ke halaman Login
        Get.offAllNamed(Routes.LOGIN);
      }
    });
  }
}
