import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../controllers/exchange_form_controller.dart';

class ExchangeFormView extends GetView<ExchangeFormController> {
  const ExchangeFormView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceWhite,
      appBar: AppBar(
        title: const Text('Ajukan Pertukaran'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Get.back(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // -- Header Info Card --
              Obx(() {
                final isShift = controller.jenisPertukaran.value == 'shift';
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isShift ? Colors.indigo.shade50 : Colors.teal.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isShift ? Colors.indigo.shade200 : Colors.teal.shade200,
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        isShift ? Icons.swap_horiz : Icons.beach_access,
                        color: isShift ? Colors.indigo.shade700 : Colors.teal.shade700,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isShift
                                  ? 'Ketentuan Tukar Shift (Bebas / Tanpa Batasan)'
                                  : 'Ketentuan Tukar Hari Off (Maksimal 1x Sebulan)',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: isShift ? Colors.indigo.shade900 : Colors.teal.shade900,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              isShift
                                  ? 'Tukar shift dapat diajukan beberapa kali dalam sebulan (1 hari per penukaran) dengan rekan sebidang atau Supervisor.'
                                  : 'Penukaran hari libur (off) dibatasi maksimal 1 kali dalam sebulan dengan rekan sebidang atau Supervisor.',
                              style: TextStyle(
                                fontSize: 11.5,
                                color: isShift ? Colors.indigo.shade900 : Colors.teal.shade900,
                                height: 1.35,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 20),

              // -- Tipe Pertukaran Toggle --
              const Text(
                'Jenis Pertukaran',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.slateDark),
              ),
              const SizedBox(height: 8),
              Obx(() => Row(
                children: [
                  Expanded(
                    child: _buildTypeButton(
                      label: 'Tukar Shift',
                      icon: Icons.swap_horiz,
                      isSelected: controller.jenisPertukaran.value == 'shift',
                      onTap: () => controller.setJenisPertukaran('shift'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTypeButton(
                      label: 'Tukar Hari Off',
                      icon: Icons.beach_access,
                      isSelected: controller.jenisPertukaran.value == 'off',
                      onTap: () => controller.setJenisPertukaran('off'),
                    ),
                  ),
                ],
              )),
              const SizedBox(height: 24),

              // -- 1. Jadwal Anda Yang Mau Ditukar --
              _buildSectionTitle('1. Jadwal Anda Yang Mau Ditukar'),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderGrey),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildDatePickerTile(
                      context: context,
                      label: 'Tanggal Jadwal Anda',
                      dateStream: controller.tanggalPemohon,
                      onDatePicked: (picked) {
                        controller.setTanggalPemohon(picked);
                      },
                    ),
                    const Divider(height: 24),

                    // Tampilan Jadwal Nyata Pemohon
                    Obx(() {
                      if (controller.isLoadingMySchedule.value) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Row(
                            children: [
                              SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                              SizedBox(width: 12),
                              Text('Memuat jadwal kerja Anda pada tanggal ini...', style: TextStyle(fontSize: 12, color: AppColors.slateLight)),
                            ],
                          ),
                        );
                      }

                      final sched = controller.mySchedule.value;
                      final isShift = controller.jenisPertukaran.value == 'shift';

                      if (sched == null) {
                        return _buildScheduleAlert(
                          icon: Icons.info_outline,
                          color: Colors.amber,
                          title: 'Jadwal Belum Ditemukan',
                          message: 'Belum ada data jadwal pada tanggal ini. Hubungi Supervisor jika jadwal belum terbit.',
                        );
                      }

                      if (sched['isCuti'] == true) {
                        return _buildScheduleAlert(
                          icon: Icons.event_busy,
                          color: Colors.red,
                          title: 'Status: Sedang Cuti',
                          message: 'Anda tercatat sedang cuti/izin pada tanggal ini, tidak dapat ditukarkan.',
                        );
                      }

                      if (isShift) {
                        if (sched['isOff'] == true) {
                          return _buildScheduleAlert(
                            icon: Icons.warning_amber_rounded,
                            color: Colors.amber,
                            title: 'Status Anda: Hari Libur (OFF)',
                            message: 'Tanggal ini adalah hari libur Anda. Untuk tukar shift kerja, pilih tanggal saat Anda memiliki shift bertugas, atau gunakan tab "Tukar Hari Off".',
                          );
                        }

                        final shiftObj = sched['shift'];
                        if (shiftObj is Map) {
                          final namaShift = shiftObj['namaShift'] ?? 'Shift Kerja';
                          final jamMulai = (shiftObj['jamMulai']?.toString() ?? '').sliceSafe(0, 5);
                          final jamSelesai = (shiftObj['jamSelesai']?.toString() ?? '').sliceSafe(0, 5);

                          return Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50.withValues(alpha: 0.6),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Colors.blue.shade200),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.shade600,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.schedule, color: Colors.white, size: 20),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Shift Anda Pada Tanggal Ini:',
                                        style: TextStyle(fontSize: 11, color: AppColors.slateLight, fontWeight: FontWeight.w500),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '$namaShift ($jamMulai – $jamSelesai)',
                                        style: TextStyle(
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.blue.shade900,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.green.shade100,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'Aktif',
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green.shade800),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }

                        return _buildScheduleAlert(
                          icon: Icons.info_outline,
                          color: Colors.amber,
                          title: 'Belum Ada Shift Tertulis',
                          message: 'Jadwal shift kerja Anda belum ditentukan pada tanggal ini. Silakan pilih tanggal lain saat Anda memiliki shift.',
                        );
                      } else {
                        if (sched['isOff'] == true) {
                          return Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.teal.shade50.withValues(alpha: 0.7),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Colors.teal.shade200),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.teal.shade600,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.beach_access, color: Colors.white, size: 20),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Status Anda Pada Tanggal Ini:',
                                        style: TextStyle(fontSize: 11, color: AppColors.slateLight, fontWeight: FontWeight.w500),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Hari Libur (OFF)',
                                        style: TextStyle(
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.teal.shade900,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.teal.shade100,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    'OFF Valid',
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.teal.shade800),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }

                        return _buildScheduleAlert(
                          icon: Icons.warning_amber_rounded,
                          color: Colors.amber,
                          title: 'Bukan Hari Libur (OFF)',
                          message: 'Anda tercatat memiliki jadwal kerja pada tanggal ini. Penukaran hari off hanya bisa diajukan pada tanggal saat Anda berstatus Libur (OFF).',
                        );
                      }
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // -- 2. Jadwal Yang Anda Inginkan --
              _buildSectionTitle('2. Tanggal & Shift Yang Anda Inginkan'),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderGrey),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildDatePickerTile(
                      context: context,
                      label: 'Tanggal Yang Diinginkan',
                      dateStream: controller.tanggalTarget,
                      onDatePicked: (picked) {
                        controller.setTanggalTarget(picked);
                      },
                    ),

                    // Filter Shift Rekan pada Tanggal Target (Khusus Tukar Shift)
                    Obx(() {
                      final isShift = controller.jenisPertukaran.value == 'shift';
                      final activeFilter = controller.selectedFilterShiftId.value;
                      // Trigger reactive rebuild when shifts or peers change
                      final _ = controller.availableShifts.length + controller.peerCandidates.length;
                      final shiftOptions = controller.shiftFilterOptions;

                      if (!isShift) {
                        return const Padding(
                          padding: EdgeInsets.only(top: 10),
                          child: Text(
                            'Pilih tanggal di atas untuk menampilkan rekan kerja / Supervisor yang berstatus libur (OFF) sesuai jadwal pada hari tersebut.',
                            style: TextStyle(fontSize: 11, color: AppColors.slateLight),
                          ),
                        );
                      }

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 14),
                          const Text(
                            'Filter Shift Rekan Pada Tanggal Ini (Sesuai Jadwal):',
                            style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppColors.slateDark),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              _buildShiftFilterChip(
                                label: 'Semua Shift (${controller.peerCandidates.length})',
                                isSelected: activeFilter == null,
                                onTap: () => controller.setFilterShift(null),
                              ),
                              ...shiftOptions.map((opt) {
                                final sid = opt['idShift'] as int;
                                final nama = opt['namaShift']?.toString() ?? 'Shift';
                                final jam = opt['jam']?.toString() ?? '';
                                final cnt = opt['count'] as int? ?? 0;
                                final labelText = jam.isNotEmpty
                                    ? '$nama ($jam) • $cnt'
                                    : '$nama • $cnt';
                                return _buildShiftFilterChip(
                                  label: labelText,
                                  isSelected: activeFilter == sid,
                                  onTap: () => controller.setFilterShift(sid),
                                );
                              }),
                            ],
                          ),
                        ],
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // -- 3. Pilih Rekan Kerja (Lawan Tukar) --
              _buildSectionTitle('3. Pilih Rekan Kerja / Supervisor (Tekan Nama Rekan)'),
              const SizedBox(height: 10),
              Obx(() {
                // PENTING: Baca semua variabel reaktif secara sinkron di awal Obx!
                final isLoading = controller.isLoadingPeers.value;
                final isShift = controller.jenisPertukaran.value == 'shift';
                final currentSelectedId = controller.selectedPeerId.value;
                final currentSelectedPeer = controller.selectedPeer.value;
                final _ = controller.selectedFilterShiftId.value;
                final _ = controller.peerCandidates.length;
                final peers = controller.filteredPeers;

                if (isLoading) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }

                if (peers.isEmpty) {
                  return Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderGrey),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.people_outline, size: 40, color: Colors.grey.shade400),
                        const SizedBox(height: 8),
                        Text(
                          isShift
                              ? (controller.selectedFilterShiftId.value != null
                                  ? 'Tidak ada rekan yang terjadwal pada shift tersebut di tanggal ini. Tekan "Semua Shift" untuk melihat jadwal rekan lainnya.'
                                  : 'Tidak ada rekan sebidang atau Supervisor yang memiliki jadwal shift kerja tertulis pada tanggal yang dipilih.')
                              : 'Tidak ada rekan sebidang atau Supervisor yang memiliki jadwal libur (OFF) tertulis pada tanggal yang dipilih.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12.5, color: Colors.grey.shade600, height: 1.4),
                        ),
                      ],
                    ),
                  );
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ...peers.map((peer) {
                      final rawId = peer['idKaryawan'];
                      final peerId = rawId is int
                          ? rawId
                          : int.tryParse(rawId?.toString() ?? '');
                      final isSelected = currentSelectedId != null && peerId == currentSelectedId;
                      final nama = peer['nama']?.toString() ?? '-';
                      final nik = peer['nik']?.toString() ?? '-';
                      final jabatan = peer['jabatan']?.toString() ?? 'Staf';
                      final isPeerOff = peer['isOff'] == true;
                      final statusLabel = peer['statusLabel']?.toString() ?? '-';

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Material(
                          color: isSelected
                              ? AppColors.redContainer.withValues(alpha: 0.28)
                              : AppColors.white,
                          borderRadius: BorderRadius.circular(12),
                          child: InkWell(
                            onTap: () => controller.selectPeer(peer),
                            borderRadius: BorderRadius.circular(12),
                            splashColor: AppColors.redPrimary.withValues(alpha: 0.15),
                            highlightColor: AppColors.redPrimary.withValues(alpha: 0.08),
                            child: Container(
                              padding: const EdgeInsets.all(13),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? AppColors.redPrimary : AppColors.borderGrey,
                                  width: isSelected ? 2.0 : 1.0,
                                ),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 21,
                                    backgroundColor: isSelected
                                        ? AppColors.redPrimary
                                        : AppColors.redContainer,
                                    child: Text(
                                      nama.isNotEmpty ? nama.substring(0, 1).toUpperCase() : '?',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: isSelected ? Colors.white : AppColors.redPrimary,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                nama,
                                                style: TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 13.5,
                                                  color: isSelected ? AppColors.redPrimary : AppColors.slateDark,
                                                ),
                                              ),
                                            ),
                                            if (isSelected)
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: AppColors.redPrimary,
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: const Text(
                                                  'TERPILIH',
                                                  style: TextStyle(
                                                    fontSize: 9.5,
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '$nik · $jabatan',
                                          style: const TextStyle(fontSize: 11, color: AppColors.slateLight),
                                        ),
                                        const SizedBox(height: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                                          decoration: BoxDecoration(
                                            color: isPeerOff ? Colors.amber.shade50 : Colors.blue.shade50,
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(
                                              color: isPeerOff ? Colors.amber.shade300 : Colors.blue.shade300,
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(
                                                isPeerOff ? Icons.beach_access : Icons.schedule,
                                                size: 12,
                                                color: isPeerOff ? Colors.amber.shade900 : Colors.blue.shade900,
                                              ),
                                              const SizedBox(width: 4),
                                              Flexible(
                                                child: Text(
                                                  'Jadwal: $statusLabel',
                                                  style: TextStyle(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.bold,
                                                    color: isPeerOff ? Colors.amber.shade900 : Colors.blue.shade900,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Icon(
                                    isSelected ? Icons.check_circle : Icons.radio_button_unchecked,
                                    color: isSelected ? AppColors.redPrimary : AppColors.slateLight,
                                    size: 26,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    }),

                    // Ringkasan Pertukaran Saat Rekan Sudah Dipilih
                    if (currentSelectedPeer != null) ...[
                      const SizedBox(height: 4),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.green.shade300),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.check_circle, color: Colors.green.shade700, size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Rekan terpilih: ${currentSelectedPeer['nama']} (${currentSelectedPeer['statusLabel'] ?? '-'})',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.green.shade900,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                );
              }),
              const SizedBox(height: 24),

              // -- 4. Alasan Pertukaran --
              _buildSectionTitle('4. Alasan Pertukaran'),
              const SizedBox(height: 10),
              TextField(
                controller: controller.alasanController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Tuliskan alasan pertukaran (misal: keperluan keluarga mendesak)...',
                  hintStyle: const TextStyle(fontSize: 13, color: AppColors.slateLight),
                  filled: true,
                  fillColor: AppColors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.borderGrey),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.borderGrey),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.redPrimary),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // -- Submit Button --
              Obx(() {
                // Baca semua state reaktif agar tombol selalu sinkron
                final selectedId = controller.selectedPeerId.value;
                final _ = controller.idShiftPemohon.value;
                final _ = controller.idShiftTarget.value;
                final _ = controller.mySchedule.value;
                final isSubmitting = controller.isSubmitting.value;
                final canSubmit = controller.canSubmit;

                return SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: isSubmitting ? null : controller.submitPertukaran,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: canSubmit
                          ? AppColors.redPrimary
                          : (selectedId != null ? Colors.amber.shade800 : Colors.grey.shade400),
                      foregroundColor: AppColors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: canSubmit ? 2 : 0,
                    ),
                    child: isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.white),
                          )
                        : Text(
                            selectedId == null
                                ? 'Pilih Rekan Terlebih Dahulu'
                                : 'Kirim Permintaan Pertukaran',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                  ),
                );
              }),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildShiftFilterChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return Material(
      color: isSelected ? AppColors.redPrimary : AppColors.surfaceWhite,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? AppColors.redPrimary : AppColors.borderGrey,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: isSelected ? Colors.white : AppColors.slateDark,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildScheduleAlert({
    required IconData icon,
    required MaterialColor color,
    required String title,
    required String message,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.shade50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color.shade800, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color.shade900),
                ),
                const SizedBox(height: 2),
                Text(
                  message,
                  style: TextStyle(fontSize: 11, color: color.shade900, height: 1.3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.slateDark),
    );
  }

  Widget _buildTypeButton({
    required String label,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return Material(
      color: isSelected ? AppColors.redPrimary : AppColors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppColors.redPrimary : AppColors.borderGrey,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: isSelected ? AppColors.white : AppColors.slateDark),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: isSelected ? AppColors.white : AppColors.slateDark,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDatePickerTile({
    required BuildContext context,
    required String label,
    required Rxn<DateTime> dateStream,
    required Function(DateTime) onDatePicked,
  }) {
    final displayFormat = DateFormat('EEEE, dd MMMM yyyy', 'id');
    return Obx(() {
      final date = dateStream.value ?? DateTime.now();
      return Material(
        color: AppColors.surfaceWhite,
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          onTap: () async {
            final now = DateTime.now();
            final today = DateTime(now.year, now.month, now.day);
            final picked = await showDatePicker(
              context: context,
              initialDate: date.isBefore(today) ? today : date,
              firstDate: today,
              lastDate: today.add(const Duration(days: 90)),
              builder: (ctx, child) => Theme(data: AppTheme.datePickerTheme(ctx), child: child!),
            );
            if (picked != null) {
              onDatePicked(picked);
            }
          },
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.borderGrey),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_month, color: AppColors.redPrimary, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(label, style: const TextStyle(fontSize: 11, color: AppColors.slateLight)),
                      const SizedBox(height: 2),
                      Text(
                        displayFormat.format(date),
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.slateDark),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppColors.slateLight, size: 20),
              ],
            ),
          ),
        ),
      );
    });
  }
}

extension SafeSlice on String {
  String sliceSafe(int start, int end) {
    if (length <= start) return '';
    if (length <= end) return substring(start);
    return substring(start, end);
  }
}
