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

                    // Tampilan Jadwal Nyata Pemohon (Bukan Dropdown Palsu!)
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
                        // TUKAR SHIFT
                        if (sched['isOff'] == true) {
                          return _buildScheduleAlert(
                            icon: Icons.warning_amber_rounded,
                            color: Colors.amber,
                            title: 'Status Anda: Hari Libur (OFF)',
                            message: 'Tanggal ini adalah hari libur Anda. Untuk tukar shift kerja, pilih tanggal saat Anda memiliki shift bertugas, atau gunakan tab "Tukar Hari Off".',
                          );
                        }

                        final shiftObj = sched['shift'];
                        if (shiftObj != null) {
                          final namaShift = shiftObj['namaShift'] ?? 'Shift Kerja';
                          final jamMulai = (shiftObj['jamMulai'] as String?)?.sliceSafe(0, 5) ?? '';
                          final jamSelesai = (shiftObj['jamSelesai'] as String?)?.sliceSafe(0, 5) ?? '';

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
                          message: 'Jadwal shift kerja Anda belum ditentukan pada tanggal ini.',
                        );
                      } else {
                        // TUKAR HARI OFF
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
                                        'Hari Libur Rutin (OFF)',
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
              _buildSectionTitle('2. Tanggal Jadwal Yang Anda Inginkan'),
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
                    const SizedBox(height: 8),
                    Text(
                      controller.jenisPertukaran.value == 'shift'
                          ? 'Pilih tanggal di atas, lalu pilih rekan kerja di bawah untuk melihat shift nyata yang mereka miliki pada hari itu.'
                          : 'Pilih tanggal di atas untuk mencari rekan kerja / Supervisor yang sedang berstatus libur (OFF) pada hari tersebut.',
                      style: const TextStyle(fontSize: 11, color: AppColors.slateLight),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // -- 3. Pilih Rekan Kerja (Lawan Tukar) --
              _buildSectionTitle('3. Pilih Rekan Kerja / Supervisor (Lawan Tukar)'),
              const SizedBox(height: 10),
              Obx(() {
                if (controller.isLoadingPeers.value) {
                  return const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }

                if (controller.peerCandidates.isEmpty) {
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
                          controller.jenisPertukaran.value == 'shift'
                              ? 'Tidak ada rekan sebidang atau Supervisor yang memiliki jadwal shift kerja pada tanggal yang dipilih.'
                              : 'Tidak ada rekan sebidang atau Supervisor yang memiliki hari libur (OFF) pada tanggal yang dipilih.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: controller.peerCandidates.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final peer = controller.peerCandidates[index];
                    final isSelected = controller.selectedPeer.value?['idKaryawan'] == peer['idKaryawan'];

                    return InkWell(
                      onTap: () => controller.selectPeer(peer),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.redContainer.withValues(alpha: 0.25) : AppColors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? AppColors.redPrimary : AppColors.borderGrey,
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 20,
                              backgroundColor: isSelected ? AppColors.redPrimary : AppColors.redContainer,
                              child: Text(
                                (peer['nama'] as String?)?.isNotEmpty == true
                                    ? (peer['nama'] as String).substring(0, 1).toUpperCase()
                                    : '?',
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
                                          peer['nama'] ?? '-',
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.slateDark),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${peer['nik'] ?? '-'} · ${peer['jabatan'] ?? 'Staf'}',
                                    style: const TextStyle(fontSize: 11, color: AppColors.slateLight),
                                  ),
                                  const SizedBox(height: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: peer['isOff'] == true ? Colors.amber.shade50 : Colors.blue.shade50,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                        color: peer['isOff'] == true ? Colors.amber.shade300 : Colors.blue.shade300,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          peer['isOff'] == true ? Icons.beach_access : Icons.schedule,
                                          size: 12,
                                          color: peer['isOff'] == true ? Colors.amber.shade900 : Colors.blue.shade900,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          peer['statusLabel'] ?? '-',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: peer['isOff'] == true ? Colors.amber.shade900 : Colors.blue.shade900,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Radio indicator
                            Container(
                              width: 22,
                              height: 22,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isSelected ? AppColors.redPrimary : AppColors.slateLight.withValues(alpha: 0.5),
                                  width: isSelected ? 6 : 2,
                                ),
                                color: AppColors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
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

              // -- Submit Button (Dengan Validasi Ketat!) --
              Obx(() {
                final canSubmit = controller.canSubmit;
                return SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: canSubmit ? controller.submitPertukaran : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: canSubmit ? AppColors.redPrimary : Colors.grey.shade300,
                      foregroundColor: canSubmit ? AppColors.white : Colors.grey.shade500,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: canSubmit ? 2 : 0,
                    ),
                    child: controller.isSubmitting.value
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.white),
                          )
                        : Text(
                            controller.selectedPeer.value == null
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
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.redPrimary : AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.redPrimary : AppColors.borderGrey,
          ),
          boxShadow: isSelected
              ? [BoxShadow(color: AppColors.redPrimary.withValues(alpha: 0.25), blurRadius: 8, offset: const Offset(0, 3))]
              : null,
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
      return InkWell(
        onTap: () async {
          final picked = await showDatePicker(
            context: context,
            initialDate: date,
            firstDate: DateTime.now(),
            lastDate: DateTime.now().add(const Duration(days: 90)),
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
            color: AppColors.surfaceWhite,
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
