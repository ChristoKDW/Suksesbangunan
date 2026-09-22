import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../controllers/leave_form_controller.dart';

class LeaveFormView extends GetView<LeaveFormController> {
  const LeaveFormView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Pengajuan Izin',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
        centerTitle: true,
        backgroundColor: AppColors.white,
        elevation: 0,
        foregroundColor: AppColors.slateDark,
      ),
      backgroundColor: AppColors.white,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: controller.formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionTitle('Jenis Pengajuan'),
              const SizedBox(height: 12),
              _buildLeaveTypeDropdown(),
              const SizedBox(height: 20),
              
              Obx(() => _buildSectionTitle(
                controller.selectedTypeCode.value == 'izin'
                    ? 'Tanggal Izin (Maksimal 1 Hari)'
                    : 'Rentang Tanggal',
              )),
              const SizedBox(height: 12),
              _buildDateRangePicker(context),
              const SizedBox(height: 20),
              
              _buildSectionTitle('Alasan'),
              const SizedBox(height: 12),
              _buildReasonInput(),
              const SizedBox(height: 20),
              
              Obx(() => _buildSectionTitle(
                controller.selectedTypeCode.value == 'sakit'
                    ? 'Surat Keterangan Dokter (Wajib)'
                    : 'Dokumen Pendukung (Opsional)',
              )),
              const SizedBox(height: 12),
              _buildAttachmentPicker(),
              const SizedBox(height: 32),
              
              SizedBox(
                width: double.infinity,
                child: Obx(() => ElevatedButton(
                  onPressed: controller.isSubmitting.value ? null : controller.submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.redPrimary,
                    foregroundColor: AppColors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                  child: controller.isSubmitting.value
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.white,
                          ),
                        )
                      : const Text(
                          'Kirim Pengajuan',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                )),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontWeight: FontWeight.w600,
        fontSize: 14,
        color: AppColors.slateDark,
      ),
    );
  }

  Widget _buildLeaveTypeDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Obx(() => DropdownButtonFormField<String>(
          initialValue: controller.selectedType.value,
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
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
          items: controller.typeCodeMap.keys.map((String type) {
            final isCuti = type == 'Cuti Tahunan';
            final canCuti = controller.hasHakCuti.value;
            return DropdownMenuItem<String>(
              value: type,
              child: Row(
                children: [
                  Text(type),
                  if (isCuti && !canCuti) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.borderGrey,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'Belum Ada Hak',
                        style: TextStyle(
                          fontSize: 10,
                          color: AppColors.slateLight,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          }).toList(),
          onChanged: controller.onTypeChanged,
        )),
        Obx(() {
          if (controller.isLoadingProfile.value) return const SizedBox.shrink();
          final typeCode = controller.selectedTypeCode.value;

          if (typeCode == 'izin') {
            return Container(
              margin: const EdgeInsets.only(top: 10),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.amber.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.amber.shade300),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, color: Colors.amber.shade800, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Ketentuan Izin (Maksimal 1 Hari)',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.amber.shade900),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Izin maksimal 1 hari. Pada hari izin, karyawan tidak mendapatkan uang makan dan tidak mendapatkan gaji harian.',
                          style: TextStyle(color: Colors.amber.shade900, fontSize: 11, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }

          if (typeCode == 'sakit') {
            return Container(
              margin: const EdgeInsets.only(top: 10),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.blue.shade300),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.medical_services_outlined, color: Colors.blue.shade800, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Ketentuan Izin Sakit (Wajib Surat Dokter)',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blue.shade900),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Durasi sakit sesuai surat dokter. Wajib mengunggah surat dokter. Karyawan tetap menerima gaji pokok, namun uang makan ditiadakan.',
                          style: TextStyle(color: Colors.blue.shade900, fontSize: 11, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }

          if (typeCode == 'cuti' && !controller.hasHakCuti.value) {
            return Container(
              margin: const EdgeInsets.only(top: 10),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: AppColors.warning, size: 18),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Catatan: Hak cuti tahunan belum diaktifkan oleh HRD.',
                      style: TextStyle(color: AppColors.warning, fontSize: 12),
                    ),
                  ),
                ],
              ),
            );
          }
          return const SizedBox.shrink();
        }),
      ],
    );
  }

  Widget _buildDateRangePicker(BuildContext context) {
    return InkWell(
      onTap: () => controller.pickDateRange(context),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderGrey),
        ),
        child: Obx(() {
          final range = controller.selectedDateRange.value;
          final isIzin = controller.selectedTypeCode.value == 'izin';

          if (range == null) {
            return Row(
              children: [
                const Icon(Icons.calendar_today_outlined, color: AppColors.slateLight, size: 20),
                const SizedBox(width: 12),
                Text(
                  isIzin ? 'Pilih Tanggal Izin (1 Hari)' : 'Pilih Tanggal Mulai & Selesai',
                  style: const TextStyle(color: AppColors.slateLight),
                ),
              ],
            );
          }
          
          final dateText = isIzin
              ? _formatDate(range.start)
              : '${_formatDate(range.start)} - ${_formatDate(range.end)}';

          return Row(
            children: [
              const Icon(Icons.calendar_today, color: AppColors.redPrimary, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  dateText,
                  style: const TextStyle(fontWeight: FontWeight.w500, color: AppColors.slateDark),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.redContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${controller.totalDays} Hari',
                  style: const TextStyle(
                    color: AppColors.redPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  String _formatDate(DateTime d) => "${d.day}/${d.month}/${d.year}";

  Widget _buildReasonInput() {
    return TextFormField(
      controller: controller.reasonController,
      maxLines: 4,
      decoration: InputDecoration(
        hintText: 'Tuliskan alasan pengajuan Anda...',
        hintStyle: const TextStyle(color: AppColors.slateLight),
        filled: true,
        fillColor: AppColors.white,
        contentPadding: const EdgeInsets.all(16),
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
    );
  }

  Widget _buildAttachmentPicker() {
    return Obx(() {
      final fileName = controller.attachedFileName.value;
      
      if (fileName != null) {
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.borderGrey),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.description, color: AppColors.success, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      fileName,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.slateDark),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (controller.attachedFileSize.value != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        controller.attachedFileSize.value!,
                        style: const TextStyle(fontSize: 11, color: AppColors.slateLight),
                      ),
                    ],
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: AppColors.slateLight, size: 20),
                onPressed: controller.removeAttachment,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        );
      }

      final isSakit = controller.selectedTypeCode.value == 'sakit';

      return InkWell(
        onTap: controller.pickAttachment,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 24),
          decoration: BoxDecoration(
            color: isSakit ? Colors.blue.shade50.withValues(alpha: 0.3) : AppColors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSakit ? Colors.blue.shade300 : AppColors.borderGrey,
              style: BorderStyle.solid,
            ),
          ),
          child: Column(
            children: [
              Icon(
                isSakit ? Icons.medical_services_outlined : Icons.upload_file,
                color: isSakit ? Colors.blue.shade700 : AppColors.slateLight,
                size: 32,
              ),
              const SizedBox(height: 8),
              Text(
                isSakit
                    ? 'Tap untuk unggah Surat Dokter (Wajib)'
                    : 'Tap untuk lampirkan dokumen (Opsional)',
                style: TextStyle(
                  color: isSakit ? Colors.blue.shade900 : AppColors.slateLight,
                  fontWeight: isSakit ? FontWeight.w600 : FontWeight.normal,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      );
    });
  }
}
