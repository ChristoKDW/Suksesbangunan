import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../controllers/tunda_off_controller.dart';

class TundaOffView extends GetView<TundaOffController> {
  const TundaOffView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Tunda Off',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        foregroundColor: const Color(0xFF1E293B),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showForm(context),
        backgroundColor: AppColors.redPrimary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_circle_outline),
        label: const Text(
          'Ajukan Tunda Off',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }
        return RefreshIndicator(
          onRefresh: controller.fetchItems,
          color: AppColors.redPrimary,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            children: [
              _buildInfoBanner(),
              const SizedBox(height: 16),
              if (controller.items.isEmpty)
                _buildEmptyState()
              else
                ...controller.items.map(_buildItem),
              const SizedBox(height: 80),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildInfoBanner() {
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
              'Tukar hari libur Anda dengan hari kerja (mis. kejar target di hari libur). Persetujuan bertahap: SPV lalu HRD.',
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

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48),
      alignment: Alignment.center,
      child: Column(
        children: [
          Icon(Icons.event_busy, size: 48, color: Colors.grey.shade400),
          const SizedBox(height: 12),
          const Text(
            'Belum ada pengajuan Tunda Off',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItem(Map<String, dynamic> item) {
    final id = item['idTundaOff'] is int
        ? item['idTundaOff'] as int
        : int.tryParse('${item['idTundaOff']}') ?? 0;
    final status = item['status']?.toString() ?? 'menunggu_spv';
    final color = _statusColor(status);
    final catatanSpv = item['catatanSpv']?.toString();
    final catatanHrd = item['catatanHrd']?.toString();
    final canCancel = status == 'menunggu_spv' || status == 'menunggu_hrd';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Pengajuan Tunda Off',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Color(0xFF1E293B),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: color.withValues(alpha: 0.3)),
                ),
                child: Text(
                  _statusLabel(status),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${_formatDateString(item['tanggalOffAsal']?.toString() ?? '')} → ${_formatDateString(item['tanggalOffBaru']?.toString() ?? '')}',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFFBE123C),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Alasan: "${item['alasan']?.toString() ?? '-'}"',
            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
          ),
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
          if (canCancel) ...[
            const SizedBox(height: 8),
            const Divider(height: 1),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: () => controller.cancel(id),
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
  }

  void _showForm(BuildContext context) {
    controller.tanggalOffAsal.value = null;
    controller.tanggalOffBaru.value = null;
    controller.alasanController.clear();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Ajukan Tunda Off',
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
              const SizedBox(height: 8),
              _dateButton(context, 'Tanggal OFF yang Ditunda', true),
              const SizedBox(height: 12),
              _dateButton(context, 'Tanggal OFF Pengganti', false),
              const SizedBox(height: 12),
              TextField(
                controller: controller.alasanController,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: 'Alasan *',
                  hintText: 'Minimal 10 karakter',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Obx(
                () => SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: controller.isSubmitting.value
                        ? null
                        : controller.submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.redPrimary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: controller.isSubmitting.value
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Kirim Pengajuan',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _dateButton(BuildContext context, String label, bool isAsal) {
    return Obx(() {
      final value = isAsal
          ? controller.tanggalOffAsal.value
          : controller.tanggalOffBaru.value;
      return InkWell(
        onTap: () => controller.pickDate(context, isAsal: isAsal),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.borderGrey),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.calendar_today_outlined,
                color: AppColors.slateLight,
                size: 20,
              ),
              const SizedBox(width: 12),
              Text(
                value == null ? label : controller.dateFormat.format(value),
                style: TextStyle(
                  color: value == null
                      ? AppColors.slateLight
                      : AppColors.slateDark,
                  fontWeight: value == null
                      ? FontWeight.normal
                      : FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      );
    });
  }

  Color _statusColor(String status) {
    if (status.startsWith('menunggu')) return Colors.orange.shade800;
    if (status == 'disetujui') return const Color(0xFF047857);
    if (status == 'dibatalkan') return Colors.grey.shade700;
    return Colors.red.shade700;
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'menunggu_spv':
        return 'Menunggu SPV';
      case 'menunggu_hrd':
        return 'Menunggu HRD';
      case 'ditolak_spv':
        return 'Ditolak SPV';
      case 'ditolak_hrd':
        return 'Ditolak HRD';
      case 'disetujui':
        return 'Disetujui';
      case 'dibatalkan':
        return 'Dibatalkan';
      default:
        return status;
    }
  }

  String _formatDateString(String value) {
    final parsed = DateTime.tryParse(value);
    return parsed == null ? value : controller.dateFormat.format(parsed);
  }
}
