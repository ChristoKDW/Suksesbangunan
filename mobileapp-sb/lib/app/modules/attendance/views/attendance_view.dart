import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/attendance_controller.dart';
import '../../../core/theme/app_colors.dart';
import 'widgets/slide_to_action_widget.dart';

class AttendanceView extends GetView<AttendanceController> {
  const AttendanceView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Absensi Kehadiran'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              controller.checkTodaySchedule();
              controller.loadTodayAttendanceAndBreak();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Real-Time Clock
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 28),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderGrey),
              ),
              child: Column(
                children: [
                  Obx(() => Text(
                    controller.currentTime.value,
                    style: const TextStyle(
                      fontSize: 44,
                      fontWeight: FontWeight.w700,
                      color: AppColors.slateDark,
                    ),
                  )),
                  const SizedBox(height: 6),
                  Obx(() => Text(
                    controller.currentDate.value,
                    style: const TextStyle(
                      fontSize: 15,
                      color: AppColors.slateLight,
                    ),
                  )),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Today's Status Card (Clock In, Break, Clock Out)
            Obx(() => _buildTodayStatusCard()),

            const SizedBox(height: 16),

            // Schedule & Break Info Banner
            Obx(() => _buildScheduleBanner()),

            const SizedBox(height: 16),

            // GPS Location Info
            _buildLocationCard(),

            const SizedBox(height: 16),

            // Geofence Status Badge
            Obx(() => _buildGeofenceBadge()),

            const SizedBox(height: 24),

            // Dynamic Action Area (Absen Masuk / Istirahat / Absen Pulang)
            Obx(() => _buildActionArea()),
          ],
        ),
      ),
    );
  }

  Widget _buildTodayStatusCard() {
    final bool isMasuk = controller.isClockedIn;
    final bool isPulang = controller.isClockedOut;
    final bool onBreak = controller.isOnBreak;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderGrey),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Status Hari Ini',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: AppColors.slateDark,
                ),
              ),
              if (onBreak)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.amber.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.amber.shade700),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.coffee, size: 14, color: Colors.amber.shade800),
                      const SizedBox(width: 4),
                      Text(
                        'Sedang Istirahat',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.amber.shade900,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildStatusColumn(
                  label: 'Absen Masuk',
                  value: controller.clockInTimeText ?? '--:--',
                  icon: Icons.login,
                  color: isMasuk ? AppColors.success : AppColors.slateLight,
                ),
              ),
              Container(width: 1, height: 40, color: AppColors.borderGrey),
              Expanded(
                child: _buildStatusColumn(
                  label: 'Istirahat',
                  value: onBreak
                      ? 'Aktif'
                      : (controller.totalBreakMinutes > 0
                          ? '${controller.totalBreakMinutes} mnt'
                          : '--:--'),
                  icon: Icons.restaurant,
                  color: onBreak
                      ? Colors.amber.shade800
                      : (controller.totalBreakMinutes > 0
                          ? AppColors.info
                          : AppColors.slateLight),
                ),
              ),
              Container(width: 1, height: 40, color: AppColors.borderGrey),
              Expanded(
                child: _buildStatusColumn(
                  label: 'Absen Pulang',
                  value: controller.clockOutTimeText ?? '--:--',
                  icon: Icons.logout,
                  color: isPulang ? AppColors.success : AppColors.slateLight,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusColumn({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.slateLight),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildScheduleBanner() {
    if (controller.scheduleLoading.value) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: AppColors.borderGrey.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Row(
          children: [
            SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 12),
            Text('Memeriksa jadwal kerja...', style: TextStyle(fontSize: 13)),
          ],
        ),
      );
    }

    final state = controller.scheduleState.value;
    if (state == 'no_schedule') {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        decoration: BoxDecoration(
          color: AppColors.error.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.error.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: AppColors.error, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Belum Ada Jadwal Kerja',
                    style: TextStyle(
                      color: AppColors.error,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    controller.scheduleMessage.value,
                    style: TextStyle(
                      color: AppColors.error.withValues(alpha: 0.85),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (state == 'cuti' || state == 'libur') {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.amber.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.amber.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            Icon(state == 'cuti' ? Icons.beach_access : Icons.weekend,
                color: Colors.amber[800], size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                controller.scheduleMessage.value,
                style: TextStyle(
                  color: Colors.amber[900],
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (state == 'active') {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.info.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.info.withValues(alpha: 0.3)),
        ),
        child: Column(
          children: [
            Row(
              children: [
                const Icon(Icons.schedule, color: AppColors.info, size: 18),
                const SizedBox(width: 8),
                Text(
                  'Shift: ${controller.shiftName.value}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const Spacer(),
                Text(
                  controller.shiftHours.value,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.info,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
            if (controller.shiftBreakHours.value.isNotEmpty) ...[
              const SizedBox(height: 6),
              const Divider(height: 1, color: AppColors.borderGrey),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.coffee, color: Colors.amber, size: 18),
                  const SizedBox(width: 8),
                  const Text(
                    'Jadwal Istirahat:',
                    style: TextStyle(fontSize: 12, color: AppColors.slateLight),
                  ),
                  const Spacer(),
                  Text(
                    controller.shiftBreakHours.value,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Colors.amber[800],
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildLocationCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderGrey),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.redContainer,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Obx(() => Icon(
              controller.isLocationReady.value
                  ? Icons.location_on
                  : Icons.location_searching,
              color: AppColors.redPrimary,
            )),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Lokasi Anda',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.slateDark,
                  ),
                ),
                const SizedBox(height: 4),
                Obx(() => Text(
                  controller.locationText.value,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.slateLight,
                  ),
                )),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGeofenceBadge() {
    if (!controller.isLocationReady.value) return const SizedBox.shrink();
    if (controller.isCheckingGeofence.value) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
        decoration: BoxDecoration(
          color: AppColors.borderGrey.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Row(
          children: [
            SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 12),
            Text('Memeriksa radius kantor...', style: TextStyle(fontSize: 12)),
          ],
        ),
      );
    }

    final bool inRadius = controller.isWithinOfficeRadius.value;
    final Color badgeColor = inRadius ? AppColors.success : AppColors.error;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: badgeColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(
            inRadius ? Icons.check_circle : Icons.cancel,
            color: badgeColor,
            size: 18,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              inRadius
                  ? 'Di dalam Radius Kantor${controller.officeName.value.isNotEmpty ? ' (${controller.officeName.value})' : ''}'
                  : 'Di luar Radius Kantor',
              style: TextStyle(
                color: badgeColor,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionArea() {
    final bool canScan = controller.isLocationReady.value &&
        controller.canProceed.value &&
        !controller.scheduleLoading.value;

    // 1. Sudah absen pulang: Selesai
    if (controller.isClockedOut) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.success.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
        ),
        child: const Column(
          children: [
            Icon(Icons.check_circle, color: AppColors.success, size: 48),
            SizedBox(height: 12),
            Text(
              'Absensi Hari Ini Telah Selesai',
              style: TextStyle(
                color: AppColors.success,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            SizedBox(height: 4),
            Text(
              'Jam masuk dan jam pulang Anda telah tercatat dengan lengkap.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.slateLight, fontSize: 13),
            ),
          ],
        ),
      );
    }

    // 2. Belum absen masuk
    if (!controller.isClockedIn) {
      String buttonText = 'Geser untuk Absen Masuk';
      if (controller.scheduleLoading.value) {
        buttonText = 'Memeriksa jadwal...';
      } else if (!controller.canProceed.value) {
        buttonText = controller.scheduleMessage.value.isNotEmpty
            ? controller.scheduleMessage.value
            : 'Tidak dapat melakukan absensi';
      } else if (!controller.isLocationReady.value) {
        buttonText = 'Menunggu lokasi GPS...';
      }

      return SlideToActionWidget(
        onSlideComplete: () {
          if (canScan) {
            controller.proceedToFaceScan('masuk');
          } else {
            Get.snackbar(
              'Peringatan Absensi',
              buttonText,
              snackPosition: SnackPosition.BOTTOM,
              backgroundColor: Colors.orangeAccent,
              colorText: Colors.white,
            );
          }
        },
        text: buttonText,
        thumbIcon: Icons.face,
      );
    }

    // 3. Sudah absen masuk, belum absen pulang
    // Tampilkan tombol Istirahat (Mulai/Selesai) + Slide Absen Pulang
    final bool onBreak = controller.isOnBreak;

    return Column(
      children: [
        // Tombol Istirahat Card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: onBreak
                ? Colors.amber.withValues(alpha: 0.12)
                : AppColors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: onBreak ? Colors.amber.shade700 : AppColors.borderGrey,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.restaurant,
                    color: onBreak ? Colors.amber.shade800 : AppColors.slateDark,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Absen Istirahat (Keluar Makan)',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: onBreak ? Colors.amber.shade900 : AppColors.slateDark,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                onBreak
                    ? 'Anda saat ini sedang dalam waktu istirahat. Klik tombol di bawah jika sudah kembali bekerja.'
                    : 'Gunakan tombol ini saat Anda keluar untuk makan/istirahat, agar durasi tercatat.',
                style: const TextStyle(fontSize: 12, color: AppColors.slateLight),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: onBreak ? Colors.amber.shade800 : const Color(0xFFC02627),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  onPressed: controller.isSubmittingBreak.value
                      ? null
                      : () => controller.toggleBreak(),
                  icon: controller.isSubmittingBreak.value
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Icon(onBreak ? Icons.check_circle : Icons.restaurant_menu),
                  label: Text(
                    onBreak
                        ? 'Selesai Istirahat (Kembali Bekerja)'
                        : 'Mulai Istirahat (Keluar Makan)',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Slide Absen Pulang
        SlideToActionWidget(
          onSlideComplete: () {
            if (canScan) {
              controller.proceedToFaceScan('keluar');
            } else {
              Get.snackbar(
                'Peringatan Absen Pulang',
                'Menunggu verifikasi GPS dan jadwal...',
                snackPosition: SnackPosition.BOTTOM,
                backgroundColor: Colors.orangeAccent,
                colorText: Colors.white,
              );
            }
          },
          text: 'Geser untuk Absen Pulang',
          thumbIcon: Icons.logout,
        ),
      ],
    );
  }
}
