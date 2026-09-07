import 'package:flutter/material.dart';

import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app/routes/app_pages.dart';
import 'app/core/theme/app_theme.dart';

import 'app/data/services/session_service.dart';
import 'app/data/services/api_service.dart';
import 'app/core/services/face_biometric_service.dart';
import 'app/core/services/camera_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inisialisasi locale formatting tanggal (id / id_ID)
  await initializeDateFormatting('id_ID', null);
  await initializeDateFormatting('id', null);

  // Inisialisasi persistent storage sebelum service lainnya.
  await GetStorage.init();

  final session = SessionService();
  await session.init();
  Get.put(session);

  Get.put(ApiService());
  Get.put(FaceBiometricService());
  await Get.putAsync(() => CameraService().init());

  runApp(
    GetMaterialApp(
      title: "Company Attendance",
      initialRoute: AppPages.INITIAL,
      getPages: AppPages.routes,
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
    ),
  );
}
