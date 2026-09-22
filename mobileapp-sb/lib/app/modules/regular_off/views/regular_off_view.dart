import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:skeletonizer/skeletonizer.dart';

import '../controllers/regular_off_controller.dart';
import '../../../core/theme/app_colors.dart';

class RegularOffView extends GetView<RegularOffController> {
  const RegularOffView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Regular Off (RO)',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 18,
            color: Color(0xFF1E293B),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
      ),
      floatingActionButton: Obx(() {
        if (!controller.isOperasional.value ||
            controller.totalTersedia.value == 0) {
          return const SizedBox.shrink();
        }

        return FloatingActionButton.extended(
          onPressed: () => _showPengajuanModal(context),
          backgroundColor: AppColors.redPrimary,
          foregroundColor: Colors.white,
          icon: const Icon(Icons.add_circle_outline),
          label: const Text(
            'Ajukan Libur RO',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
        );
      }),
      body: Obx(() {
        final loading = controller.isLoading.value;

        if (!loading && !controller.isOperasional.value) {
          return _buildNonOperasionalView(context);
        }

        return Skeletonizer(
          enabled: loading,
          child: RefreshIndicator(
            onRefresh: () => controller.loadAllData(),
            color: AppColors.redPrimary,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeaderSaldoCard(context),
                  const SizedBox(height: 16),
                  _buildInfoBanner(context),
                  const SizedBox(height: 16),
                  _buildTabBar(),
                  const SizedBox(height: 16),
                  Obx(() {
                    if (controller.activeTab.value == 0) {
                      return _buildSaldoTab(context);
                    } else {
                      return _buildRiwayatTab(context);
                    }
                  }),
                  const SizedBox(height: 80), // Space for FAB
                ],
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildNonOperasionalView(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.beach_access,
                size: 56,
                color: Colors.amber.shade800,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Khusus Karyawan Operasional',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              controller.nonOperasionalReason.value ?? 'Fitur Regular Off (RO) diperuntukkan bagi karyawan operasional. Karyawan kantor otomatis libur pada setiap Hari Libur Nasional resmi.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF64748B),
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderSaldoCard(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFBE123C).withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Hak Regular Off (RO)',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Aktif 3 Bulan',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${controller.totalTersedia.value}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 42,
                  fontWeight: FontWeight.w900,
                  height: 1,
                ),
              ),
              const SizedBox(width: 8),
              const Padding(
                padding: EdgeInsets.only(bottom: 6),
                child: Text(
                  'Hari Tersedia',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: Colors.white24, height: 1),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStatSubItem(
                'Diajukan',
                '${controller.totalDiajukan.value} Hari',
              ),
              _buildStatSubItem(
                'Digunakan',
                '${controller.totalDigunakan.value} Hari',
              ),
              _buildStatSubItem(
                'Hangus',
                '${controller.totalHangus.value} Hari',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatSubItem(String title, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(color: Colors.white60, fontSize: 11),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoBanner(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, size: 20, color: Colors.blue.shade700),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'RO didapat saat masuk kerja di Hari Libur Nasional resmi (non-Minggu). RO hanya dapat digunakan mulai bulan berikutnya dan berlaku selama 3 bulan sebelum hangus.',
              style: TextStyle(
                fontSize: 12,
                color: Colors.blue.shade900,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(10),
      ),
      padding: const EdgeInsets.all(3),
      child: Obx(() {
        return Row(
          children: [
            Expanded(
              child: InkWell(
                onTap: () => controller.activeTab.value = 0,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: controller.activeTab.value == 0
                        ? Colors.white
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: controller.activeTab.value == 0
                        ? [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 4,
                            ),
                          ]
                        : null,
                  ),
                  child: Text(
                    'Daftar Saldo RO (${controller.saldoList.length})',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: controller.activeTab.value == 0
                          ? FontWeight.bold
                          : FontWeight.w500,
                      color: controller.activeTab.value == 0
                          ? const Color(0xFF1E293B)
                          : const Color(0xFF64748B),
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: InkWell(
                onTap: () => controller.activeTab.value = 1,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: controller.activeTab.value == 1
                        ? Colors.white
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: controller.activeTab.value == 1
                        ? [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 4,
                            ),
                          ]
                        : null,
                  ),
                  child: Text(
                    'Riwayat Pengajuan (${controller.pengajuanList.length})',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: controller.activeTab.value == 1
                          ? FontWeight.bold
                          : FontWeight.w500,
                      color: controller.activeTab.value == 1
                          ? const Color(0xFF1E293B)
                          : const Color(0xFF64748B),
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      }),
    );
  }

  Widget _buildSaldoTab(BuildContext context) {
    if (controller.saldoList.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 40),
        alignment: Alignment.center,
        child: Column(
          children: [
            Icon(Icons.event_busy, size: 48, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            const Text(
              'Belum ada saldo Regular Off (RO)',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Saldo akan otomatis tercatat ketika Anda masuk kerja pada hari libur nasional resmi.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: controller.saldoList.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (ctx, i) {
        final item = controller.saldoList[i];
        final status = item['status']?.toString() ?? 'tersedia';
        final namaLibur = item['namaHariLibur']?.toString() ?? 'Libur Nasional';
        final tglLibur = item['tanggalLiburNasional']?.toString() ?? '';
        final tglKadaluarsa = item['tanggalKadaluarsa']?.toString() ?? '';
        final sisaHari = item['sisaHari'] is int ? item['sisaHari'] as int : 0;
        final statusKeterangan = item['statusKeterangan']?.toString() ?? '';

        Color badgeColor;
        Color badgeBgColor;
        if (status == 'tersedia') {
          if (sisaHari <= 15) {
            badgeColor = Colors.orange.shade800;
            badgeBgColor = Colors.orange.shade50;
          } else {
            badgeColor = const Color(0xFF047857);
            badgeBgColor = const Color(0xFFECFDF5);
          }
        } else if (status == 'diajukan') {
          badgeColor = Colors.blue.shade700;
          badgeBgColor = Colors.blue.shade50;
        } else if (status == 'digunakan') {
          badgeColor = Colors.indigo.shade700;
          badgeBgColor = Colors.indigo.shade50;
        } else {
          // Hangus
          badgeColor = Colors.red.shade700;
          badgeBgColor = Colors.red.shade50;
        }

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      namaLibur,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: badgeBgColor,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: badgeColor.withOpacity(0.3)),
                    ),
                    child: Text(
                      statusKeterangan,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: badgeColor,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 14,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Masuk kerja: ${_formatDateString(tglLibur)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(
                    Icons.timer_outlined,
                    size: 14,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Berlaku hingga: ${_formatDateString(tglKadaluarsa)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRiwayatTab(BuildContext context) {
    if (controller.pengajuanList.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 40),
        alignment: Alignment.center,
        child: Column(
          children: [
            Icon(Icons.history, size: 48, color: Colors.grey.shade400),
            const SizedBox(height: 12),
            const Text(
              'Belum ada riwayat pengajuan RO',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Color(0xFF64748B),
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: controller.pengajuanList.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (ctx, i) {
        final item = controller.pengajuanList[i];
        final id = item['idPengajuanRo'] is int
            ? item['idPengajuanRo'] as int
            : 0;
        final status = item['status']?.toString() ?? 'menunggu_spv';
        final jumlahHari = item['jumlahHari'] ?? 1;
        final alasan = item['alasan']?.toString();
        final catatanSpv = item['catatanSpv']?.toString();
        final catatanHrd = item['catatanHrd']?.toString();

        List<String> tglList = [];
        if (item['tanggalDipilih'] is List) {
          tglList = List<String>.from(item['tanggalDipilih']);
        } else if (item['tanggalDipilih'] is String) {
          tglList = (item['tanggalDipilih'] as String).split(',');
        }

        Color statusColor;
        String statusLabel;
        if (status == 'disetujui') {
          statusColor = const Color(0xFF047857);
          statusLabel = 'Disetujui (Jadwal Libur RO)';
        } else if (status == 'menunggu_spv') {
          statusColor = Colors.amber.shade800;
          statusLabel = 'Menunggu SPV';
        } else if (status == 'menunggu_hrd') {
          statusColor = Colors.blue.shade700;
          statusLabel = 'Menunggu HRD';
        } else if (status == 'ditolak_spv') {
          statusColor = Colors.red.shade700;
          statusLabel = 'Ditolak SPV';
        } else if (status == 'ditolak_hrd') {
          statusColor = Colors.red.shade700;
          statusLabel = 'Ditolak HRD';
        } else {
          statusColor = Colors.grey.shade700;
          statusLabel = 'Dibatalkan';
        }

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '$jumlahHari Hari Libur RO',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: statusColor.withOpacity(0.3)),
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: tglList.map((tgl) {
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F2),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: const Color(0xFFFECDD3)),
                    ),
                    child: Text(
                      _formatDateString(tgl.trim()),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFFBE123C),
                      ),
                    ),
                  );
                }).toList(),
              ),
              if (alasan != null && alasan.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  'Alasan: "$alasan"',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
              if (catatanSpv != null && catatanSpv.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'Catatan SPV: "$catatanSpv"',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.blue.shade900,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
              if (catatanHrd != null && catatanHrd.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'Catatan HRD: "$catatanHrd"',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.indigo.shade900,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
              if (status == 'menunggu_spv' || status == 'menunggu_hrd') ...[
                const SizedBox(height: 8),
                const Divider(height: 1),
                const SizedBox(height: 4),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton.icon(
                    onPressed: () => controller.cancelPengajuan(id),
                    icon: const Icon(
                      Icons.cancel_outlined,
                      size: 16,
                      color: Colors.red,
                    ),
                    label: const Text(
                      'Batalkan Pengajuan',
                      style: TextStyle(fontSize: 12, color: Colors.red),
                    ),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  void _showPengajuanModal(BuildContext context) {
    controller.selectedDates.clear();
    controller.alasanController.clear();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.85,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          builder: (_, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Ajukan Libur Regular Off',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Get.back(),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Pilih hingga ${controller.totalTersedia.value} hari sesuai saldo RO Anda. Tanggal yang diajukan harus berada di bulan depan atau sesudahnya.',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Kalender Picker Interaktif
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    padding: const EdgeInsets.all(8),
                    child: CalendarDatePicker(
                      initialDate: DateTime.now().add(const Duration(days: 1)),
                      firstDate: DateTime.now().add(const Duration(days: 1)),
                      lastDate: DateTime.now().add(const Duration(days: 180)),
                      onDateChanged: (date) {
                        controller.toggleDateSelection(date);
                      },
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Daftar Tanggal Terpilih
                  Obx(() {
                    if (controller.selectedDates.isEmpty) {
                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.touch_app,
                              size: 18,
                              color: Colors.amber.shade800,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Sentuh tanggal pada kalender di atas untuk memilih hari libur RO.',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.amber.shade900,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Tanggal Dipilih (${controller.selectedDates.length}/${controller.totalTersedia.value} Hari):',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: controller.selectedDates.map((d) {
                            return Chip(
                              backgroundColor: const Color(0xFFFFF1F2),
                              label: Text(
                                controller.dateFormat.format(d),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFBE123C),
                                ),
                              ),
                              deleteIcon: const Icon(Icons.close, size: 16),
                              onDeleted: () =>
                                  controller.toggleDateSelection(d),
                            );
                          }).toList(),
                        ),
                      ],
                    );
                  }),
                  const SizedBox(height: 16),

                  // Alasan
                  const Text(
                    'Alasan / Catatan (Opsional)',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: controller.alasanController,
                    maxLines: 2,
                    decoration: InputDecoration(
                      hintText:
                          'Misal: Istirahat RO pengganti libur nasional...',
                      hintStyle: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF94A3B8),
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Tombol Kirim
                  Obx(() {
                    return SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: controller.isSubmitting.value
                            ? null
                            : () => controller.submitPengajuan(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.redPrimary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          elevation: 0,
                        ),
                        child: controller.isSubmitting.value
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'Kirim Pengajuan RO',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    );
                  }),
                ],
              ),
            );
          },
        );
      },
    );
  }

  String _formatDateString(String dateStr) {
    if (dateStr.isEmpty) return '—';
    try {
      final d = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy', 'id').format(d);
    } catch (_) {
      return dateStr;
    }
  }
}
