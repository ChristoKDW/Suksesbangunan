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
                                  ? 'Tukar shift dapat diajukan beberapa kali dalam sebulan tanpa batasan frekuensi (1 hari kerja per penukaran) dengan rekan sebidang/SPV yang sama.'
                                  : 'Penukaran hari libur (off) dibatasi maksimal 1 kali dalam sebulan dengan rekan sebidang/SPV yang sama.',
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

              // -- Jadwal Anda --
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
                  children: [
                    _buildDatePickerTile(
                      context: context,
                      label: 'Tanggal Jadwal Anda',
                      dateStream: controller.tanggalPemohon,
                      onDatePicked: (picked) {
                        controller.setTanggalPemohon(picked);
                      },
                    ),
                    Obx(() {
                      if (controller.jenisPertukaran.value != 'shift') return const SizedBox.shrink();
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Divider(height: 24),
                          const Text('Shift Anda Saat Ini', style: TextStyle(fontSize: 12, color: AppColors.slateLight)),
                          const SizedBox(height: 8),
                          _buildShiftDropdown(
                            currentValue: controller.idShiftPemohon.value,
                            onChanged: (val) {
                              controller.idShiftPemohon.value = val;
                            },
                          ),
                        ],
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // -- Jadwal Tujuan yang Diinginkan --
              _buildSectionTitle('2. Jadwal Yang Anda Inginkan'),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderGrey),
                ),
                child: Column(
                  children: [
                    _buildDatePickerTile(
                      context: context,
                      label: 'Tanggal Yang Diinginkan',
                      dateStream: controller.tanggalTarget,
                      onDatePicked: (picked) {
                        controller.setTanggalTarget(picked);
                      },
                    ),
                    Obx(() {
                      if (controller.jenisPertukaran.value != 'shift') return const SizedBox.shrink();
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Divider(height: 24),
                          const Text('Shift Yang Ingin Dituju', style: TextStyle(fontSize: 12, color: AppColors.slateLight)),
                          const SizedBox(height: 8),
                          _buildShiftDropdown(
                            currentValue: controller.idShiftTarget.value,
                            onChanged: (val) {
                              controller.idShiftTarget.value = val;
                              controller.fetchPeers();
                            },
                          ),
                        ],
                      );
                    }),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // -- Pilih Rekan Kerja --
              _buildSectionTitle('3. Pilih Rekan Kerja (1 Bidang/SPV)'),
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
                              ? 'Tidak ada rekan sebidang yang memiliki shift tersebut pada tanggal yang dipilih.'
                              : 'Tidak ada rekan sebidang yang memiliki hari libur (off) pada tanggal yang dipilih.',
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
                          color: isSelected ? AppColors.redContainer.withValues(alpha: 0.2) : AppColors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? AppColors.redPrimary : AppColors.borderGrey,
                            width: isSelected ? 1.5 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 20,
                              backgroundColor: AppColors.redContainer,
                              child: Text(
                                (peer['nama'] as String?)?.isNotEmpty == true
                                    ? (peer['nama'] as String).substring(0, 1).toUpperCase()
                                    : '?',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.redPrimary),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    peer['nama'] ?? '-',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.slateDark),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${peer['nik'] ?? '-'} · ${peer['jabatan'] ?? 'Staf'}',
                                    style: const TextStyle(fontSize: 11, color: AppColors.slateLight),
                                  ),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: peer['isOff'] == true ? Colors.amber.shade50 : Colors.blue.shade50,
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(
                                        color: peer['isOff'] == true ? Colors.amber.shade300 : Colors.blue.shade200,
                                      ),
                                    ),
                                    child: Text(
                                      peer['statusLabel'] ?? '-',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                        color: peer['isOff'] == true ? Colors.amber.shade900 : Colors.blue.shade800,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
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

              // -- Alasan Pertukaran --
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
              Obx(() => SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: controller.isSubmitting.value ? null : controller.submitPertukaran,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.redPrimary,
                    foregroundColor: AppColors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: controller.isSubmitting.value
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.white),
                        )
                      : const Text(
                          'Kirim Permintaan Pertukaran',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                ),
              )),
              const SizedBox(height: 24),
            ],
          ),
        ),
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
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.redContainer.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.calendar_month, color: AppColors.redPrimary, size: 20),
            ),
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
      );
    });
  }

  Widget _buildShiftDropdown({
    required int? currentValue,
    required Function(int?) onChanged,
  }) {
    return Obx(() {
      if (controller.availableShifts.isEmpty) {
        return const Text('Tidak ada shift', style: TextStyle(fontSize: 12, color: AppColors.slateLight));
      }
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.surfaceWhite,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.borderGrey),
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<int>(
            value: currentValue,
            isExpanded: true,
            icon: const Icon(Icons.arrow_drop_down, color: AppColors.slateDark),
            items: controller.availableShifts.map((s) {
              final id = s['idShift'] as int;
              final nama = s['namaShift'] ?? '-';
              final jamMulai = (s['jamMulai'] as String?)?.sliceSafe(0, 5) ?? '';
              final jamSelesai = (s['jamSelesai'] as String?)?.sliceSafe(0, 5) ?? '';
              return DropdownMenuItem<int>(
                value: id,
                child: Text(
                  '$nama ($jamMulai - $jamSelesai)',
                  style: const TextStyle(fontSize: 13, color: AppColors.slateDark),
                ),
              );
            }).toList(),
            onChanged: onChanged,
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
