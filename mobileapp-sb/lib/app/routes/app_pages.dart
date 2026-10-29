import 'package:get/get.dart';
import '../modules/complete_profile/bindings/complete_profile_binding.dart';
import '../modules/complete_profile/views/complete_profile_view.dart';
import '../modules/forgot_password/bindings/forgot_password_binding.dart';
import '../modules/forgot_password/views/forgot_password_view.dart';


import '../modules/attendance/bindings/attendance_binding.dart';
import '../modules/attendance/views/attendance_view.dart';
import '../modules/dashboard/bindings/dashboard_binding.dart';
import '../modules/dashboard/views/dashboard_view.dart';
import '../modules/face_recognition/bindings/face_recognition_binding.dart';
import '../modules/face_recognition/views/face_recognition_view.dart';
import '../modules/face_registration/bindings/face_registration_binding.dart';
import '../modules/face_registration/views/face_registration_view.dart';
import '../modules/history/bindings/history_binding.dart';
import '../modules/history/views/history_view.dart';
import '../modules/home/bindings/home_binding.dart';
import '../modules/home/views/home_view.dart';
import '../modules/leave/bindings/leave_binding.dart';
import '../modules/leave/views/leave_view.dart';
import '../modules/leave_form/bindings/leave_form_binding.dart';
import '../modules/leave_form/views/leave_form_view.dart';
import '../modules/exchange_form/bindings/exchange_form_binding.dart';
import '../modules/exchange_form/views/exchange_form_view.dart';
import '../modules/login/bindings/login_binding.dart';
import '../modules/login/views/login_view.dart';
import '../modules/otp/bindings/otp_binding.dart';
import '../modules/otp/views/otp_view.dart';
import '../modules/profile/bindings/profile_binding.dart';
import '../modules/profile/views/profile_view.dart';
import '../modules/register/bindings/register_binding.dart';
import '../modules/register/views/register_view.dart';
import '../modules/schedule/bindings/schedule_binding.dart';
import '../modules/schedule/views/schedule_view.dart';
import '../modules/settings/bindings/settings_binding.dart';
import '../modules/settings/views/settings_view.dart';
import '../modules/slip_gaji/bindings/slip_gaji_binding.dart';
import '../modules/slip_gaji/views/slip_gaji_view.dart';
import '../modules/regular_off/bindings/regular_off_binding.dart';
import '../modules/regular_off/views/regular_off_view.dart';
import '../modules/splash/bindings/splash_binding.dart';
import '../modules/splash/views/splash_view.dart';
import '../modules/kasbon/bindings/kasbon_binding.dart';
import '../modules/kasbon/views/kasbon_view.dart';
import '../modules/pencairan/bindings/pencairan_binding.dart';
import '../modules/pencairan/views/pencairan_view.dart';
import '../modules/laporan_masalah/bindings/laporan_masalah_binding.dart';
import '../modules/laporan_masalah/views/laporan_masalah_view.dart';

part 'app_routes.dart';

class AppPages {
  AppPages._();

  static const INITIAL = Routes.SPLASH;

  static final routes = [
    GetPage(
      name: _Paths.HOME,
      page: () => const HomeView(),
      binding: HomeBinding(),
    ),
    GetPage(
      name: _Paths.SPLASH,
      page: () => const SplashView(),
      binding: SplashBinding(),
    ),
    GetPage(
      name: _Paths.LOGIN,
      page: () => const LoginView(),
      binding: LoginBinding(),
    ),
    GetPage(
      name: _Paths.REGISTER,
      page: () => const RegisterView(),
      binding: RegisterBinding(),
    ),
    GetPage(
      name: _Paths.DASHBOARD,
      page: () => const DashboardView(),
      binding: DashboardBinding(),
    ),
    GetPage(
      name: _Paths.SCHEDULE,
      page: () => const ScheduleView(),
      binding: ScheduleBinding(),
    ),
    GetPage(
      name: _Paths.LEAVE,
      page: () => const LeaveView(),
      binding: LeaveBinding(),
    ),
    GetPage(
      name: _Paths.HISTORY,
      page: () => const HistoryView(),
      binding: HistoryBinding(),
    ),
    GetPage(
      name: _Paths.PROFILE,
      page: () => const ProfileView(),
      binding: ProfileBinding(),
    ),
    GetPage(
      name: _Paths.ATTENDANCE,
      page: () => const AttendanceView(),
      binding: AttendanceBinding(),
    ),
    GetPage(
      name: _Paths.FACE_RECOGNITION,
      page: () => const FaceRecognitionView(),
      binding: FaceRecognitionBinding(),
    ),
    GetPage(
      name: _Paths.LEAVE_FORM,
      page: () => const LeaveFormView(),
      binding: LeaveFormBinding(),
    ),
    GetPage(
      name: _Paths.EXCHANGE_FORM,
      page: () => const ExchangeFormView(),
      binding: ExchangeFormBinding(),
    ),
    GetPage(
      name: _Paths.FACE_REGISTRATION,
      page: () => const FaceRegistrationView(),
      binding: FaceRegistrationBinding(),
    ),
    GetPage(
      name: _Paths.SETTINGS,
      page: () => const SettingsView(),
      binding: SettingsBinding(),
    ),
    GetPage(
      name: _Paths.OTP,
      page: () => const OtpView(),
      binding: OtpBinding(),
    ),
    GetPage(
      name: _Paths.SLIP_GAJI,
      page: () => const SlipGajiView(),
      binding: SlipGajiBinding(),
    ),
    GetPage(
      name: _Paths.KASBON,
      page: () => const KasbonView(),
      binding: KasbonBinding(),
    ),
    GetPage(
      name: _Paths.PENCAIRAN,
      page: () => const PencairanView(),
      binding: PencairanBinding(),
    ),
    GetPage(
      name: _Paths.REGULAR_OFF,
      page: () => const RegularOffView(),
      binding: RegularOffBinding(),
    ),
    GetPage(
      name: _Paths.FORGOT_PASSWORD,
      page: () => const ForgotPasswordView(),
      binding: ForgotPasswordBinding(),
    ),
    GetPage(
      name: _Paths.COMPLETE_PROFILE,
      page: () => const CompleteProfileView(),
      binding: CompleteProfileBinding(),
    ),
    GetPage(
      name: _Paths.LAPORAN_MASALAH,
      page: () => const LaporanMasalahView(),
      binding: LaporanMasalahBinding(),
    ),
  ];
}
