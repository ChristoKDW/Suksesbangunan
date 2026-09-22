import 'package:skeletonizer/skeletonizer.dart';

import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../controllers/history_controller.dart';

class HistoryView extends GetView<HistoryController> {
  const HistoryView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Riwayat Absensi',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 4),
              Text(
                'Catatan kehadiran anda',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.slateLight,
                    ),
              ),
              const SizedBox(height: 16),
              // -- Date Filter --
              _buildDateFilter(context),
              const SizedBox(height: 16),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => controller.fetchHistory(isRefresh: true),
                  color: AppColors.redPrimary,
                  backgroundColor: AppColors.white,
                  child: Obx(() {
                    final loading = controller.isLoading.value;
                    final List<Map<String, dynamic>> list = loading 
                        ? List.filled(5, <String, dynamic>{'status_code': 'ontime', 'tanggal': '2026-09-01', 'jamMasukAktual': '08:00:00', 'jamKeluarAktual': '17:00:00', 'totalJam': 9}) 
                        : controller.attendanceHistory.toList();

                    if (!loading && list.isEmpty) {
                      return LayoutBuilder(
                        builder: (context, constraints) {
                          return SingleChildScrollView(
                            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                            child: ConstrainedBox(
                              constraints: BoxConstraints(minHeight: constraints.maxHeight),
                              child: Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.history_toggle_off_rounded,
                                      size: 52,
                                      color: AppColors.slateLight.withValues(alpha: 0.5),
                                    ),
                                    const SizedBox(height: 12),
                                    const Text(
                                      'Belum ada riwayat absensi',
                                      style: TextStyle(
                                        color: AppColors.slateDark,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    const Text(
                                      'Tarik ke bawah untuk memuat ulang',
                                      style: TextStyle(color: AppColors.slateLight, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      );
                    }
                    return Skeletonizer(
                      enabled: loading,
                      child: ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                        padding: const EdgeInsets.only(bottom: 24),
                        itemCount: list.length,
                        itemBuilder: (context, index) {
                          final history = list[index];
                          return _buildHistoryCard(history);
                        },
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDateFilter(BuildContext context) {
    return Obx(() {
      final hasFilter = controller.startDate.value != null;
      return Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: () => controller.pickDateRange(context),
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: hasFilter ? AppColors.redContainer : AppColors.surfaceWhite,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: hasFilter ? AppColors.redPrimary : AppColors.borderGrey,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.date_range,
                      size: 18,
                      color: hasFilter ? AppColors.redPrimary : AppColors.slateLight,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        controller.dateRangeLabel,
                        style: TextStyle(
                          color: hasFilter ? AppColors.redPrimary : AppColors.slateLight,
                          fontSize: 13,
                          fontWeight: hasFilter ? FontWeight.w600 : FontWeight.normal,
                        ),
                      ),
                    ),
                    if (hasFilter)
                      Icon(Icons.check_circle, size: 16, color: AppColors.redPrimary),
                  ],
                ),
              ),
            ),
          ),
          if (hasFilter) ...[
            const SizedBox(width: 8),
            InkWell(
              onTap: controller.clearFilter,
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceWhite,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.borderGrey),
                ),
                child: const Icon(Icons.close, size: 18, color: AppColors.slateLight),
              ),
            ),
          ],
        ],
      );
    });
  }

  Widget _buildHistoryCard(Map<String, dynamic> history) {
    final isLate = history['status_code'] == 'late';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: AppColors.redContainer,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    (history['day_name'] != null &&
                            history['day_name'].toString().length >= 3)
                        ? history['day_name'].toString().substring(0, 3).toUpperCase()
                        : (history['day_name']?.toString().toUpperCase() ?? ''),
                    style: const TextStyle(
                      color: AppColors.redPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                  Text(
                    ((history['date']?.toString().length ?? 0) >= 10)
                        ? history['date'].toString().substring(8, 10)
                        : '',
                    style: const TextStyle(
                      color: AppColors.redPrimary,
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${history['clock_in']} - ${history['clock_out']}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                          color: AppColors.slateDark,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isLate
                              ? AppColors.error.withValues(alpha: 0.1)
                              : AppColors.success.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          history['status'] ?? '',
                          style: TextStyle(
                            color: isLate ? AppColors.error : AppColors.success,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.timer_outlined,
                          size: 14, color: AppColors.slateLight),
                      const SizedBox(width: 4),
                      Text(
                        'Durasi: ${history['work_duration'] ?? '-'}',
                        style: const TextStyle(
                          color: AppColors.slateLight,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.notes_outlined,
                          size: 14, color: AppColors.slateLight),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          history['notes'] ?? '-',
                          style: const TextStyle(
                            color: AppColors.slateLight,
                            fontSize: 13,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
