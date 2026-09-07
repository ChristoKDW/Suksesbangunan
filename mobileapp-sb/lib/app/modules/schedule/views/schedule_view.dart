import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../../core/theme/app_colors.dart';
import '../controllers/schedule_controller.dart';

class ScheduleView extends GetView<ScheduleController> {
  const ScheduleView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Jadwal Kerja',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Tap tanggal untuk melihat detail shift',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.slateLight,
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            // -- Calendar --
            Obx(() => _buildCalendar(context)),
            const SizedBox(height: 8),
            // -- Detail Card --
            Expanded(
              child: Obx(() => _buildSelectedDayDetail(context)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCalendar(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderGrey),
      ),
      child: TableCalendar(
        firstDay: DateTime(2024, 1, 1),
        lastDay: DateTime(2030, 12, 31),
        focusedDay: controller.focusedDay.value,
        selectedDayPredicate: (day) =>
            isSameDay(controller.selectedDay.value, day),
        onDaySelected: controller.onDaySelected,
        onPageChanged: controller.onPageChanged,
        calendarFormat: CalendarFormat.month,
        startingDayOfWeek: StartingDayOfWeek.monday,
        headerStyle: HeaderStyle(
          formatButtonVisible: false,
          titleCentered: true,
          titleTextStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 16,
            color: AppColors.slateDark,
          ),
          leftChevronIcon: const Icon(Icons.chevron_left,
              color: AppColors.redPrimary, size: 28),
          rightChevronIcon: const Icon(Icons.chevron_right,
              color: AppColors.redPrimary, size: 28),
        ),
        daysOfWeekStyle: const DaysOfWeekStyle(
          weekdayStyle:
              TextStyle(color: AppColors.slateLight, fontSize: 12, fontWeight: FontWeight.w600),
          weekendStyle:
              TextStyle(color: AppColors.redPrimary, fontSize: 12, fontWeight: FontWeight.w600),
        ),
        calendarStyle: CalendarStyle(
          outsideDaysVisible: false,
          todayDecoration: BoxDecoration(
            color: AppColors.redContainer,
            shape: BoxShape.circle,
          ),
          todayTextStyle: const TextStyle(
            color: AppColors.redPrimary,
            fontWeight: FontWeight.bold,
          ),
          selectedDecoration: const BoxDecoration(
            color: AppColors.redPrimary,
            shape: BoxShape.circle,
          ),
          selectedTextStyle: const TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.bold,
          ),
          weekendTextStyle: TextStyle(color: AppColors.redPrimary.withValues(alpha: 0.7)),
          defaultTextStyle: const TextStyle(color: AppColors.slateDark),
        ),
        calendarBuilders: CalendarBuilders(
          markerBuilder: (context, date, events) {
            final schedule = controller.getScheduleForDay(date);
            if (schedule == null) return null;

            final isDayOff = schedule['is_day_off'] == true;
            final isCuti = schedule['is_cuti'] == true;

            Color dotColor = AppColors.success;
            if (isCuti) {
              dotColor = AppColors.info;
            } else if (isDayOff) {
              dotColor = AppColors.slateLight;
            }

            return Positioned(
              bottom: 1,
              child: Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildSelectedDayDetail(BuildContext context) {
    if (controller.isLoading.value) {
      return const Center(child: CircularProgressIndicator());
    }

    final selected = controller.selectedDay.value;
    if (selected == null) {
      return const Center(
        child: Text(
          'Pilih tanggal untuk melihat jadwal',
          style: TextStyle(color: AppColors.slateLight),
        ),
      );
    }

    final schedule = controller.getScheduleForDay(selected);

    if (schedule == null) {
      return Padding(
        padding: const EdgeInsets.all(20),
        child: _buildEmptyCard(context, selected),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: _buildDetailCard(context, schedule),
    );
  }

  Widget _buildEmptyCard(BuildContext context, DateTime date) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderGrey),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.event_busy, size: 48, color: AppColors.slateLight.withValues(alpha: 0.5)),
          const SizedBox(height: 12),
          const Text(
            'Tidak ada jadwal',
            style: TextStyle(
              color: AppColors.slateLight,
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Belum ada jadwal kerja untuk tanggal ini',
            style: TextStyle(
              color: AppColors.slateLight.withValues(alpha: 0.7),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailCard(BuildContext context, Map<String, dynamic> schedule) {
    final bool isDayOff = schedule['is_day_off'] ?? false;
    final bool isCuti = schedule['is_cuti'] ?? false;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: isDayOff
            ? null
            : const LinearGradient(
                colors: [AppColors.redPrimary, AppColors.redVariant],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
        color: isDayOff ? AppColors.surfaceWhite : null,
        borderRadius: BorderRadius.circular(16),
        border: isDayOff ? Border.all(color: AppColors.borderGrey) : null,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isDayOff
                      ? AppColors.borderGrey
                      : AppColors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isCuti
                      ? Icons.beach_access
                      : isDayOff
                          ? Icons.weekend
                          : Icons.work_outline,
                  color: isDayOff ? AppColors.slateLight : AppColors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      schedule['shift_name'] ?? '-',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        color: isDayOff ? AppColors.slateDark : AppColors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      schedule['day_name'] ?? '-',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDayOff
                            ? AppColors.slateLight
                            : AppColors.white.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ),
              if (!isDayOff)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'Aktif',
                    style: TextStyle(
                      color: AppColors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
          if (!isDayOff) ...[
            const SizedBox(height: 20),
            // Time slots
            Row(
              children: [
                Expanded(
                  child: _buildTimeSlot(
                    icon: Icons.login,
                    label: 'Jam Masuk',
                    time: _formatShiftTime(schedule['time_in']),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildTimeSlot(
                    icon: Icons.logout,
                    label: 'Jam Pulang',
                    time: _formatShiftTime(schedule['time_out']),
                  ),
                ),
              ],
            ),
            if (schedule['break_start'] != null) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _buildTimeSlot(
                      icon: Icons.restaurant,
                      label: 'Istirahat',
                      time:
                          '${_formatShiftTime(schedule['break_start'])} - ${_formatShiftTime(schedule['break_end'])}',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildTimeSlot(
                      icon: Icons.location_on_outlined,
                      label: 'Lokasi',
                      time: schedule['location'] ?? '-',
                    ),
                  ),
                ],
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildTimeSlot({
    required IconData icon,
    required String label,
    required String time,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.white, size: 16),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              color: AppColors.white.withValues(alpha: 0.7),
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            time,
            style: const TextStyle(
              color: AppColors.white,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  String _formatShiftTime(String? time) {
    if (time == null || time.isEmpty) return '--:--';
    // Format "HH:mm:ss" → "HH:mm"
    return time.length >= 5 ? time.substring(0, 5) : time;
  }
}
