import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../controllers/dashboard_controller.dart';
import '../../home/views/home_view.dart';
import '../../schedule/views/schedule_view.dart';
import '../../leave/views/leave_view.dart';
import '../../history/views/history_view.dart';

// ponytail: No AppBar, clean shell with IndexedStack + native NavigationBar.
class DashboardView extends GetView<DashboardController> {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Obx(
        () => IndexedStack(
          index: controller.tabIndex.value,
          children: const [
            HomeView(),
            ScheduleView(),
            LeaveView(),
            HistoryView(),
          ],
        ),
      ),
      bottomNavigationBar: Obx(
        () => NavigationBar(
          selectedIndex: controller.tabIndex.value,
          onDestinationSelected: controller.changeTabIndex,
          backgroundColor: AppColors.white,
          indicatorColor: AppColors.redContainer,
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home, color: AppColors.redPrimary),
              label: 'Beranda',
            ),
            NavigationDestination(
              icon: Icon(Icons.calendar_today_outlined),
              selectedIcon: Icon(Icons.calendar_today, color: AppColors.redPrimary),
              label: 'Jadwal',
            ),
            NavigationDestination(
              icon: Icon(Icons.assignment_outlined),
              selectedIcon: Icon(Icons.assignment, color: AppColors.redPrimary),
              label: 'Izin',
            ),
            NavigationDestination(
              icon: Icon(Icons.history_outlined),
              selectedIcon: Icon(Icons.history, color: AppColors.redPrimary),
              label: 'Riwayat',
            ),
          ],
        ),
      ),
    );
  }
}
