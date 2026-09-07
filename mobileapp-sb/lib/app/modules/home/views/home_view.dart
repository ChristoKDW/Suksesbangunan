import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../routes/app_pages.dart';
import '../controllers/home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Obx(() {
          if (controller.isLoading.value) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.redPrimary),
            );
          }

          return RefreshIndicator(
            onRefresh: controller.fetchData,
            color: AppColors.redPrimary,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildProfileCard(),
                  const SizedBox(height: 24),
                  Text(
                    'Selamat Datang! 👋',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Semoga harimu menyenangkan',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.slateLight,
                        ),
                  ),
                  const SizedBox(height: 24),
                  _buildAttendanceCard(context),
                  const SizedBox(height: 24),
                  _buildActionButton(),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildActionButton() {
    return Obx(() {
      final bool isPulang = controller.isClockedOut;
      final bool isMasuk = controller.isClockedIn;
      final bool onBreak = controller.isOnBreak;

      Color btnColor = AppColors.redPrimary;
      IconData btnIcon = Icons.fingerprint;
      String btnLabel = 'Absen Masuk Sekarang';

      if (isPulang) {
        btnColor = AppColors.success;
        btnIcon = Icons.check_circle_outline;
        btnLabel = 'Absensi Hari Ini Selesai';
      } else if (onBreak) {
        btnColor = Colors.amber.shade800;
        btnIcon = Icons.coffee;
        btnLabel = 'Sedang Istirahat • Buka Absensi';
      } else if (isMasuk) {
        btnColor = const Color(0xFFC02627);
        btnIcon = Icons.logout;
        btnLabel = 'Absen Pulang / Istirahat';
      }

      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: () => Get.toNamed(Routes.ATTENDANCE)?.then((_) => controller.fetchData()),
          icon: Icon(btnIcon, size: 22),
          label: Text(
            btnLabel,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: btnColor,
            foregroundColor: AppColors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
          ),
        ),
      );
    });
  }

  Widget _buildProfileCard() {
    return InkWell(
      onTap: () async {
        await Get.toNamed(Routes.PROFILE);
        controller.fetchData();
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderGrey),
        ),
        child: Row(
          children: [
            Obx(() {
              final photoUrl = controller.profilePhotoUrl;
              return ClipOval(
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: photoUrl != null
                      ? Image.network(
                          photoUrl,
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Container(
                            color: AppColors.redContainer,
                            alignment: Alignment.center,
                            child: Text(
                              controller.initials,
                              style: const TextStyle(
                                color: AppColors.redPrimary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        )
                      : Container(
                          color: AppColors.redContainer,
                          alignment: Alignment.center,
                          child: Text(
                            controller.initials,
                            style: const TextStyle(
                              color: AppColors.redPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                ),
              );
            }),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Obx(() => Text(
                    controller.userProfile['nama'] ?? 'Karyawan',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                      color: AppColors.slateDark,
                    ),
                  )),
                  const SizedBox(height: 2),
                  Obx(() => Text(
                    '${controller.userProfile['jabatan'] ?? 'Staff'} • NIK ${controller.userProfile['nik'] ?? '-'}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.slateLight,
                    ),
                  )),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.slateLight),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceCard(BuildContext context) {
    return Obx(() {
      final att = controller.todayAttendance.value;
      final clockIn = att?['jamMasukAktual']?.toString();
      final clockOut = att?['jamKeluarAktual']?.toString();
      final bool onBreak = controller.isOnBreak;
      final int totalBreak = controller.totalBreakMinutes;

      String breakDisplay = '--:--';
      if (onBreak) {
        breakDisplay = 'Aktif';
      } else if (totalBreak > 0) {
        breakDisplay = '$totalBreak mnt';
      }

      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.redPrimary, AppColors.redVariant],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Kehadiran Hari Ini',
                  style: TextStyle(
                    color: AppColors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                Text(
                  controller.formattedDate,
                  style: TextStyle(
                    color: AppColors.white.withValues(alpha: 0.8),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildTimeItem(
                    'Jam Masuk',
                    controller.formatTime(clockIn),
                    Icons.login,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildTimeItem(
                    'Istirahat',
                    breakDisplay,
                    Icons.restaurant,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildTimeItem(
                    'Jam Pulang',
                    controller.formatTime(clockOut),
                    Icons.logout,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    controller.attendanceStatus,
                    style: const TextStyle(
                      color: AppColors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                Text(
                  'Durasi: ${controller.workDuration}',
                  style: TextStyle(
                    color: AppColors.white.withValues(alpha: 0.9),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    });
  }

  Widget _buildTimeItem(String label, String time, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.white, size: 18),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(color: AppColors.white.withValues(alpha: 0.8), fontSize: 11),
          ),
          const SizedBox(height: 2),
          Text(
            time,
            style: const TextStyle(
              color: AppColors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
