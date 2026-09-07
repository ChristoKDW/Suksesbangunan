import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../controllers/leave_controller.dart';
import '../../../routes/app_pages.dart';

class LeaveView extends GetView<LeaveController> {
  const LeaveView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Get.toNamed(Routes.LEAVE_FORM);
          if (result == true) {
            controller.fetchLeaveRequests();
          }
        },
        backgroundColor: AppColors.redPrimary,
        foregroundColor: AppColors.white,
        icon: const Icon(Icons.add),
        label: const Text('Ajukan Izin'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Pengajuan Izin',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 4),
              Text(
                'Kelola izin & cuti anda',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.slateLight,
                    ),
              ),
              const SizedBox(height: 16),
              // -- Date Filter --
              _buildDateFilter(context),
              const SizedBox(height: 16),
              const Text(
                'Riwayat Pengajuan',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                  color: AppColors.slateDark,
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: Obx(() {
                  if (controller.isLoading.value) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (controller.leaveRequests.isEmpty) {
                    return const Center(
                      child: Text(
                        'Belum ada pengajuan izin',
                        style: TextStyle(color: AppColors.slateLight),
                      ),
                    );
                  }
                  return ListView.builder(
                    itemCount: controller.leaveRequests.length,
                    itemBuilder: (context, index) {
                      final request = controller.leaveRequests[index];
                      return _buildLeaveCard(request);
                    },
                  );
                }),
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

  Widget _buildLeaveCard(Map<String, dynamic> request) {
    final statusCode = request['status_code'];
    final Color statusColor = statusCode == 'approved'
        ? AppColors.success
        : statusCode == 'rejected'
            ? AppColors.error
            : AppColors.warning;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  request['type'] ?? '',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    color: AppColors.slateDark,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    request['status'] ?? '',
                    style: TextStyle(
                      color: statusColor,
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
                const Icon(Icons.calendar_today_outlined,
                    size: 14, color: AppColors.slateLight),
                const SizedBox(width: 4),
                Text(
                  '${request['start_date']} s/d ${request['end_date']} (${request['total_days']} Hari)',
                  style: const TextStyle(
                    color: AppColors.slateLight,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Alasan: ${request['reason'] ?? '-'}',
              style: const TextStyle(
                color: AppColors.slateLight,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
