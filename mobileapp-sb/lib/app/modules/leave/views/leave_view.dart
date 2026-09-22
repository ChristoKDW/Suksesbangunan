import 'package:skeletonizer/skeletonizer.dart';

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
      floatingActionButton: Obx(() {
        final isOperasional = controller.isOperasional.value;
        return FloatingActionButton.extended(
          onPressed: () {
            if (isOperasional) {
              _showAddActionSheet(context);
            } else {
              // Karyawan kantor langsung membuka formulir pengajuan izin
              Get.toNamed(Routes.LEAVE_FORM)?.then((result) {
                if (result == true) {
                  controller.fetchLeaveRequests(isRefresh: true);
                }
              });
            }
          },
          backgroundColor: AppColors.redPrimary,
          foregroundColor: AppColors.white,
          icon: const Icon(Icons.add),
          label: Text(
            (!isOperasional || controller.selectedTab.value == 0)
                ? 'Ajukan Izin'
                : 'Ajukan Pertukaran',
          ),
        );
      }),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Pengajuan',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 4),
              Obx(() => Text(
                controller.isOperasional.value
                    ? 'Kelola izin, cuti & pertukaran jadwal kerja'
                    : 'Kelola pengajuan izin & cuti tahunan',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.slateLight,
                    ),
              )),
              const SizedBox(height: 16),

              // -- Tab Switcher (Khusus Karyawan Operasional) --
              Obx(() {
                if (!controller.isOperasional.value) {
                  return const SizedBox.shrink();
                }
                return Column(
                  children: [
                    _buildTabSwitcher(),
                    const SizedBox(height: 16),
                  ],
                );
              }),

              // -- Tab Content --
              Expanded(
                child: Obx(() {
                  if (!controller.isOperasional.value || controller.selectedTab.value == 0) {
                    return _buildLeaveTab(context);
                  } else {
                    return _buildExchangeTab(context);
                  }
                }),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAddActionSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text(
                    'Pilih Jenis Pengajuan',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.slateDark),
                  ),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.redContainer.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.assignment_outlined, color: AppColors.redPrimary),
                  ),
                  title: const Text('Ajukan Izin / Cuti', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Izin sakit, cuti tahunan, atau keperluan mendesak', style: TextStyle(fontSize: 12)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () async {
                    Navigator.pop(ctx);
                    final result = await Get.toNamed(Routes.LEAVE_FORM);
                    if (result == true) {
                      controller.fetchLeaveRequests();
                    }
                  },
                ),
                const Divider(height: 16),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(Icons.swap_horiz, color: Colors.blue.shade700),
                  ),
                  title: const Text('Ajukan Pertukaran Jadwal', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Tukar shift kerja atau tukar hari libur (off) dengan rekan sebidang', style: TextStyle(fontSize: 12)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () async {
                    Navigator.pop(ctx);
                    if (!controller.isOperasional.value) {
                      Get.dialog(
                        AlertDialog(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          title: const Row(
                            children: [
                              Icon(Icons.info_outline, color: AppColors.warning),
                              SizedBox(width: 8),
                              Text('Khusus Operasional', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          content: Text(
                            'Pengajuan pertukaran shift & hari libur (off) hanya berlaku untuk karyawan divisi operasional yang memiliki jam kerja roling di bawah Supervisor (SPV).\n\nDivisi kantor (${controller.namaDepartemen.value ?? 'Kantor'}) dikelola secara reguler/default oleh Admin & HRD.',
                            style: const TextStyle(fontSize: 13, height: 1.4),
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Get.back(),
                              child: const Text('Mengerti', style: TextStyle(color: AppColors.redPrimary, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      );
                      return;
                    }
                    final result = await Get.toNamed(Routes.EXCHANGE_FORM);
                    if (result == true) {
                      controller.switchTab(1);
                      controller.fetchPertukaran(isRefresh: true);
                    }
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTabSwitcher() {
    return Obx(() {
      final isLeaveTab = controller.selectedTab.value == 0;
      final incomingCount = controller.incomingSwaps.length;

      return Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderGrey),
        ),
        child: Row(
          children: [
            Expanded(
              child: InkWell(
                onTap: () => controller.switchTab(0),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isLeaveTab ? AppColors.redPrimary : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      'Izin & Cuti',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: isLeaveTab ? AppColors.white : AppColors.slateLight,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: InkWell(
                onTap: () => controller.switchTab(1),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: !isLeaveTab ? AppColors.redPrimary : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Pertukaran Jadwal',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: !isLeaveTab ? AppColors.white : AppColors.slateLight,
                        ),
                      ),
                      if (incomingCount > 0) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: !isLeaveTab ? AppColors.white : AppColors.redPrimary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '$incomingCount',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: !isLeaveTab ? AppColors.redPrimary : AppColors.white,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    });
  }

  // ==================== TAB 1: IZIN & CUTI ====================

  Widget _buildLeaveTab(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDateFilter(context),
        const SizedBox(height: 16),
        const Text(
          'Riwayat Pengajuan Izin',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.slateDark),
        ),
        const SizedBox(height: 10),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => controller.fetchLeaveRequests(isRefresh: true),
            color: AppColors.redPrimary,
            backgroundColor: AppColors.white,
            child: Obx(() {
              final loading = controller.isLoading.value;
              final List<Map<String, dynamic>> list = loading
                  ? List.filled(3, <String, dynamic>{'status_code': 'pending', 'status_raw': 'Menunggu', 'type': 'Cuti', 'start_date': '2026-09-01', 'end_date': '2026-09-02', 'reason': 'Loading...'})
                  : controller.leaveRequests.toList();

              if (!loading && list.isEmpty) {
                return _buildEmptyState('Belum ada pengajuan izin');
              }
              return Skeletonizer(
                enabled: loading,
                child: ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                  padding: const EdgeInsets.only(bottom: 80),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    return _buildLeaveCard(list[index]);
                  },
                ),
              );
            }),
          ),
        ),
      ],
    );
  }

  Widget _buildLeaveCard(Map<String, dynamic> item) {
    final statusCode = item['status_code'] as String? ?? 'pending';
    final statusRaw = item['status_raw'] as String? ?? 'menunggu';
    Color statusBg;
    Color statusColor;
    switch (statusCode) {
      case 'approved':
        statusBg = const Color(0xFFDCFCE7);
        statusColor = const Color(0xFF166534);
        break;
      case 'rejected':
        statusBg = const Color(0xFFFEE2E2);
        statusColor = const Color(0xFF991B1B);
        break;
      case 'pending_spv':
        statusBg = Colors.amber.shade50;
        statusColor = Colors.amber.shade900;
        break;
      case 'pending_hrd':
        statusBg = Colors.blue.shade50;
        statusColor = Colors.blue.shade800;
        break;
      default:
        statusBg = const Color(0xFFFEF3C7);
        statusColor = const Color(0xFF92400E);
    }

    String dateStr = item['start_date'] ?? '-';
    if (item['end_date'] != null && item['end_date'] != item['start_date']) {
      dateStr = '${item['start_date']} s/d ${item['end_date']}';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderGrey),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item['type'] ?? '-',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(6)),
                child: Text(item['status'] ?? '-', style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.date_range, size: 14, color: AppColors.slateLight),
              const SizedBox(width: 6),
              Text(dateStr, style: const TextStyle(fontSize: 12, color: AppColors.slateDark)),
              const Spacer(),
              Text('${item['total_days']} hari', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.slateDark)),
            ],
          ),
          if (item['reason'] != null && (item['reason'] as String).isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(item['reason'], style: const TextStyle(fontSize: 12, color: AppColors.slateLight)),
          ],
          if (item['catatan_spv'] != null && (item['catatan_spv'] as String).isNotEmpty) ...[
            const SizedBox(height: 6),
            Text('Catatan SPV: ${item['catatan_spv']}', style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.slateLight)),
          ],
          if (item['catatan_hrd'] != null && (item['catatan_hrd'] as String).isNotEmpty) ...[
            const SizedBox(height: 6),
            Text('Catatan HRD: ${item['catatan_hrd']}', style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.slateLight)),
          ],
          const SizedBox(height: 10),
          _buildLeaveStepIndicators(statusRaw),
        ],
      ),
    );
  }

  Widget _buildLeaveStepIndicators(String status) {
    int currentStep = 1;
    bool isRejected = status.startsWith('ditolak');

    if (status == 'menunggu_spv') {
      currentStep = 1;
    } else if (status == 'menunggu_hrd' || status == 'menunggu') {
      currentStep = 2;
    } else if (status == 'disetujui') {
      currentStep = 3;
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
      decoration: BoxDecoration(color: AppColors.surfaceWhite, borderRadius: BorderRadius.circular(8)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildStepItem(
            stepNumber: 1,
            label: 'SPV',
            isDone: currentStep > 1,
            isCurrent: currentStep == 1,
            isRejected: isRejected && status == 'ditolak_spv',
          ),
          const Icon(Icons.arrow_forward_ios, size: 10, color: AppColors.borderGrey),
          _buildStepItem(
            stepNumber: 2,
            label: 'HRD (Final)',
            isDone: currentStep >= 3,
            isCurrent: currentStep == 2,
            isRejected: isRejected && (status == 'ditolak_hrd' || status == 'ditolak'),
          ),
        ],
      ),
    );
  }

  // ==================== TAB 2: PERTUKARAN JADWAL ====================

  Widget _buildExchangeTab(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => controller.fetchPertukaran(isRefresh: true),
      color: AppColors.redPrimary,
      backgroundColor: AppColors.white,
      child: Obx(() {
        final loading = controller.isLoadingSwaps.value;
        final incoming = loading ? <Map<String, dynamic>>[] : controller.incomingSwaps.toList();
        final mySwaps = loading ? List.filled(2, <String, dynamic>{'idPertukaran': 0, 'idKaryawanPemohon': 0, 'jenisPertukaran': 'shift'}) : controller.mySwaps.toList();

        if (!loading && !controller.isOperasional.value) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.apartment_rounded, size: 48, color: Colors.blue.shade700),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Divisi Kantor (${controller.namaDepartemen.value ?? 'Kantor'})',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.slateDark),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Fitur pertukaran jadwal (shift & off) khusus berlaku untuk karyawan divisi operasional dengan sistem kerja roling di bawah koordinasi Supervisor (SPV).\n\nKaryawan kantor memiliki jam kerja default/tetap yang dikelola oleh Admin & HRD.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: AppColors.slateLight, height: 1.4),
                  ),
                ],
              ),
            ),
          );
        }

        if (!loading && incoming.isEmpty && mySwaps.isEmpty) {
          return _buildEmptyState('Belum ada pengajuan pertukaran jadwal.\nTekan tombol di bawah untuk mengajukan.');
        }

        return Skeletonizer(
          enabled: loading,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            padding: const EdgeInsets.only(bottom: 80),
            children: [
            // -- Permintaan Masuk Yang Butuh Konfirmasi --
            if (incoming.isNotEmpty) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.amber.shade300),
                ),
                child: Row(
                  children: [
                    Icon(Icons.notification_important, color: Colors.amber.shade800),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Ada ${incoming.length} permintaan pertukaran yang menunggu konfirmasi Anda!',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.amber.shade900),
                      ),
                    ),
                  ],
                ),
              ),
              const Text(
                'Permintaan Masuk Dari Rekan',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.slateDark),
              ),
              const SizedBox(height: 10),
              ...incoming.map((item) => _buildIncomingSwapCard(item)),
              const SizedBox(height: 20),
            ],

            // -- Riwayat Pengajuan Saya --
            const Text(
              'Riwayat Pertukaran Jadwal',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.slateDark),
            ),
            const SizedBox(height: 10),
            if (mySwaps.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Center(child: Text('Belum ada riwayat pengajuan', style: TextStyle(color: AppColors.slateLight))),
              )
            else
              ...mySwaps.map((item) => _buildSwapHistoryCard(item)),
          ],
          ),
        );
      }),
    );
  }

  /// Card untuk permintaan tukar yang diajukan oleh rekan ke user ini (Butuh Konfirmasi)
  Widget _buildIncomingSwapCard(Map<String, dynamic> item) {
    final idPertukaran = item['idPertukaran'] as int;
    final pemohon = item['karyawanPemohon'] as Map<String, dynamic>?;
    final jenis = item['jenisPertukaran'] == 'shift' ? 'Pertukaran Shift' : 'Pertukaran Hari Off';
    final tglPemohon = item['tanggalPemohon']?.toString() ?? '-';
    final tglTarget = item['tanggalTarget']?.toString() ?? '-';
    final shiftPemohon = item['shiftPemohon']?['namaShift'];
    final shiftTarget = item['shiftTarget']?['namaShift'];
    final alasan = item['alasan']?.toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.amber.shade400, width: 1.5),
        boxShadow: [
          BoxShadow(color: Colors.amber.shade100.withValues(alpha: 0.5), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(6)),
                child: Text(jenis, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.blue.shade800)),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(6)),
                child: const Text('Menunggu Anda', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.amber)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '${pemohon?['nama'] ?? 'Rekan Kerja'} ingin bertukar jadwal dengan Anda:',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.slateDark),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: AppColors.surfaceWhite, borderRadius: BorderRadius.circular(8)),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 14, color: AppColors.slateLight),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        item['jenisPertukaran'] == 'shift'
                            ? 'Jadwal Pemohon: $tglPemohon (${shiftPemohon ?? 'Shift'})'
                            : 'Off Pemohon: $tglPemohon',
                        style: const TextStyle(fontSize: 12, color: AppColors.slateDark),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.swap_horiz, size: 14, color: AppColors.redPrimary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        item['jenisPertukaran'] == 'shift'
                            ? 'Jadwal Anda: $tglTarget (${shiftTarget ?? 'Shift'})'
                            : 'Off Anda: $tglTarget',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.slateDark),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (alasan != null && alasan.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text('Alasan: "$alasan"', style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: AppColors.slateLight)),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => controller.respondPeerSwap(idPertukaran, false),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.redPrimary,
                    side: const BorderSide(color: AppColors.redPrimary),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Tolak'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => controller.respondPeerSwap(idPertukaran, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green.shade600,
                    foregroundColor: AppColors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    elevation: 0,
                  ),
                  child: const Text('Setujui'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Card riwayat pertukaran jadwal (diajukan oleh user atau yang sudah direspon)
  Widget _buildSwapHistoryCard(Map<String, dynamic> item) {
    final isRequester = item['idKaryawanPemohon'] == controller.currentKaryawanId;
    final otherName = isRequester
        ? (item['karyawanTarget']?['nama'] ?? 'Rekan Kerja')
        : (item['karyawanPemohon']?['nama'] ?? 'Pemohon');

    final jenis = item['jenisPertukaran'] == 'shift' ? 'Tukar Shift' : 'Tukar Hari Off';
    final status = (item['status'] as String?) ?? 'menunggu_rekan';
    final statusLabel = LeaveController.swapStatusLabels[status] ?? status;

    Color badgeBg;
    Color badgeColor;
    if (status == 'disetujui') {
      badgeBg = const Color(0xFFDCFCE7);
      badgeColor = const Color(0xFF166534);
    } else if (status.startsWith('ditolak')) {
      badgeBg = const Color(0xFFFEE2E2);
      badgeColor = const Color(0xFF991B1B);
    } else if (status == 'menunggu_spv') {
      badgeBg = Colors.blue.shade50;
      badgeColor = Colors.blue.shade800;
    } else if (status == 'menunggu_hrd') {
      badgeBg = Colors.purple.shade50;
      badgeColor = Colors.purple.shade800;
    } else {
      badgeBg = Colors.amber.shade50;
      badgeColor = Colors.amber.shade900;
    }

    final tglPemohon = item['tanggalPemohon']?.toString() ?? '-';
    final tglTarget = item['tanggalTarget']?.toString() ?? '-';
    final shiftPemohon = item['shiftPemohon']?['namaShift'];
    final shiftTarget = item['shiftTarget']?['namaShift'];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderGrey),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: item['jenisPertukaran'] == 'shift' ? Colors.indigo.shade50 : Colors.teal.shade50,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  jenis,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: item['jenisPertukaran'] == 'shift' ? Colors.indigo.shade800 : Colors.teal.shade800,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  isRequester ? 'Diajukan ke $otherName' : 'Diajak oleh $otherName',
                  style: const TextStyle(fontSize: 11, color: AppColors.slateLight),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(6)),
                child: Text(statusLabel, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: badgeColor)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isRequester ? 'Jadwal Asal Anda' : 'Jadwal Pemohon',
                      style: const TextStyle(fontSize: 10, color: AppColors.slateLight),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item['jenisPertukaran'] == 'shift'
                          ? '$tglPemohon\n(${shiftPemohon ?? 'Shift'})'
                          : '$tglPemohon (Off)',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.slateDark),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward, size: 16, color: AppColors.slateLight),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      isRequester ? 'Ditukar Dengan' : 'Jadwal Anda',
                      style: const TextStyle(fontSize: 10, color: AppColors.slateLight),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item['jenisPertukaran'] == 'shift'
                          ? '$tglTarget\n(${shiftTarget ?? 'Shift'})'
                          : '$tglTarget (Off)',
                      textAlign: TextAlign.end,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.slateDark),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Step timeline indicators
          _buildStepIndicators(status),
        ],
      ),
    );
  }

  Widget _buildStepIndicators(String status) {
    int currentStep = 1;
    bool isRejected = status.startsWith('ditolak');

    if (status == 'menunggu_rekan') {
      currentStep = 1;
    } else if (status == 'menunggu_spv') {
      currentStep = 2;
    } else if (status == 'menunggu_hrd') {
      currentStep = 3;
    } else if (status == 'disetujui') {
      currentStep = 4;
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
      decoration: BoxDecoration(color: AppColors.surfaceWhite, borderRadius: BorderRadius.circular(8)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildStepItem(stepNumber: 1, label: 'Rekan', isDone: currentStep > 1, isCurrent: currentStep == 1, isRejected: isRejected && status == 'ditolak_rekan'),
          const Icon(Icons.arrow_forward_ios, size: 10, color: AppColors.borderGrey),
          _buildStepItem(stepNumber: 2, label: 'SPV', isDone: currentStep > 2, isCurrent: currentStep == 2, isRejected: isRejected && status == 'ditolak_spv'),
          const Icon(Icons.arrow_forward_ios, size: 10, color: AppColors.borderGrey),
          _buildStepItem(stepNumber: 3, label: 'HRD', isDone: currentStep >= 4, isCurrent: currentStep == 3, isRejected: isRejected && status == 'ditolak_hrd'),
        ],
      ),
    );
  }

  Widget _buildStepItem({
    required int stepNumber,
    required String label,
    required bool isDone,
    required bool isCurrent,
    required bool isRejected,
  }) {
    Color bg;
    Color fg;
    if (isRejected) {
      bg = Colors.red.shade100;
      fg = Colors.red.shade800;
    } else if (isDone) {
      bg = Colors.green.shade100;
      fg = Colors.green.shade800;
    } else if (isCurrent) {
      bg = AppColors.redPrimary;
      fg = AppColors.white;
    } else {
      bg = Colors.grey.shade200;
      fg = Colors.grey.shade600;
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        CircleAvatar(
          radius: 10,
          backgroundColor: bg,
          child: isDone
              ? Icon(Icons.check, size: 12, color: fg)
              : isRejected
              ? Icon(Icons.close, size: 12, color: fg)
              : Text('$stepNumber', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: fg)),
        ),
        const SizedBox(width: 5),
        Flexible(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isCurrent || isDone ? FontWeight.bold : FontWeight.normal,
              color: isCurrent || isDone ? AppColors.slateDark : AppColors.slateLight,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildDateFilter(BuildContext context) {
    return InkWell(
      onTap: () => controller.pickDateRange(context),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderGrey),
        ),
        child: Row(
          children: [
            const Icon(Icons.calendar_today, size: 16, color: AppColors.slateLight),
            const SizedBox(width: 10),
            Expanded(
              child: Obx(() => Text(
                controller.dateRangeLabel,
                style: const TextStyle(fontSize: 13, color: AppColors.slateDark, fontWeight: FontWeight.w500),
              )),
            ),
            Obx(() {
              if (controller.startDate.value != null) {
                return GestureDetector(
                  onTap: controller.clearFilter,
                  child: const Icon(Icons.close, size: 16, color: AppColors.slateLight),
                );
              }
              return const Icon(Icons.arrow_drop_down, color: AppColors.slateLight);
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(String message) {
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
                  Icon(Icons.assignment_outlined, size: 52, color: AppColors.slateLight.withValues(alpha: 0.5)),
                  const SizedBox(height: 12),
                  Text(
                    message,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.slateDark, fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  const Text('Tarik ke bawah untuk memuat ulang', style: TextStyle(color: AppColors.slateLight, fontSize: 12)),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
