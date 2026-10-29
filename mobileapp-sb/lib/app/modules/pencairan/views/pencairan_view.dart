import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../components/app_alert.dart';
import '../../../core/theme/app_colors.dart';
import '../controllers/pencairan_controller.dart';

class PencairanView extends GetView<PencairanController> {
  const PencairanView({super.key});

  static const _statusColor = {
    'menunggu_spv': Color(0xFFD97706),
    'menunggu_hrd': Color(0xFFD97706),
    'disetujui': Color(0xFF16A34A),
    'ditolak_spv': Color(0xFFDC2626),
    'ditolak_hrd': Color(0xFFDC2626),
    'dibatalkan': Color(0xFF64748B),
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        title: const Text(
          'Pencairan RO & Cuti',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AppColors.redPrimary,
        foregroundColor: AppColors.white,
        elevation: 0,
      ),
      floatingActionButton: Obx(
        () => controller.isLoading.value
            ? const SizedBox.shrink()
            : FloatingActionButton.extended(
                onPressed: () async {
                  if (await AppAlert.cekKuota('pencairan')) _showForm(context);
                },
                backgroundColor: AppColors.redPrimary,
                foregroundColor: AppColors.white,
                icon: const Icon(Icons.add),
                label: const Text('Ajukan Pencairan'),
              ),
      ),
      body: RefreshIndicator(
        onRefresh: controller.fetch,
        color: AppColors.redPrimary,
        child: Obx(() {
          if (controller.isLoading.value) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.redPrimary),
            );
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
            children: [
              _saldoCard(),
              const SizedBox(height: 16),
              if (controller.list.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: Text(
                      'Belum ada pengajuan pencairan',
                      style: TextStyle(color: AppColors.slateLight),
                    ),
                  ),
                )
              else
                ...controller.list.map(_card),
            ],
          );
        }),
      ),
    );
  }

  Widget _saldoCard() {
    Widget item(String label, String value) => Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.redPrimary, AppColors.redVariant],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              item('Saldo RO', '${controller.saldoRo.value} hari'),
              item(
                'Sisa cuti ${controller.tahunCuti.value}',
                controller.hakCuti.value ? '${controller.sisaCuti.value} hari' : '-',
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            'Setiap 1 hari RO / cuti yang dicairkan dibayar 1 hari kerja (gaji pokok ÷ hari kerja periode) pada slip gaji setelah disetujui HRD.',
            style: TextStyle(color: Colors.white70, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _card(Map<String, dynamic> p) {
    final status = (p['status'] ?? '').toString();
    final color = _statusColor[status] ?? AppColors.slateLight;
    final jenis = p['jenis'] == 'ro' ? 'Regular Off' : 'Cuti ${p['tahun'] ?? ''}';
    final nominal = num.tryParse('${p['nominal'] ?? 0}') ?? 0;
    final catatan = (p['catatanHrd'] ?? p['catatanSpv'] ?? '').toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderGrey),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '$jenis · ${p['jumlahHari']} hari',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: AppColors.slateDark,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  (PencairanController.statusLabel[status] ?? status).toUpperCase(),
                  style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          if ((p['alasan'] ?? '').toString().isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              '${p['alasan']}',
              style: const TextStyle(color: AppColors.slateLight, fontSize: 12),
            ),
          ],
          if (status == 'disetujui') ...[
            const SizedBox(height: 8),
            Text(
              p['idGaji'] != null
                  ? 'Dibayar di slip gaji: ${controller.rp(nominal)}'
                  : 'Akan dibayar pada slip gaji periode ini',
              style: const TextStyle(fontSize: 12, color: AppColors.success),
            ),
          ],
          if (catatan.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Catatan: $catatan',
              style: const TextStyle(fontSize: 11, color: AppColors.slateLight),
            ),
          ],
          if (status == 'menunggu_spv' || status == 'menunggu_hrd')
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => controller.batalkan(p['idPencairan'] as int),
                child: const Text(
                  'Batalkan pengajuan',
                  style: TextStyle(color: AppColors.redPrimary),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showForm(BuildContext context) {
    controller.pilihJenis(controller.saldoRo.value > 0 || !controller.hakCuti.value ? 'ro' : 'cuti');
    Get.bottomSheet(
      SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + MediaQuery.of(context).viewInsets.bottom),
          child: SingleChildScrollView(
            child: Obx(
              () => Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Ajukan Pencairan',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Saldo yang dicairkan tidak bisa dipakai libur lagi. Disetujui SPV lalu HRD.',
                    style: TextStyle(fontSize: 12, color: AppColors.slateLight),
                  ),
                  const SizedBox(height: 16),
                  SegmentedButton<String>(
                    segments: [
                      ButtonSegment(value: 'ro', label: Text('RO (${controller.saldoRo.value})')),
                      ButtonSegment(
                        value: 'cuti',
                        label: Text('Cuti (${controller.sisaCuti.value})'),
                        enabled: controller.hakCuti.value,
                      ),
                    ],
                    selected: {controller.jenis.value},
                    onSelectionChanged: (s) => controller.pilihJenis(s.first),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Expanded(
                        child: Text('Jumlah hari', style: TextStyle(fontWeight: FontWeight.w600)),
                      ),
                      IconButton(
                        onPressed: controller.jumlahHari.value > 1 ? () => controller.ubahHari(-1) : null,
                        icon: const Icon(Icons.remove_circle_outline),
                      ),
                      Text(
                        '${controller.jumlahHari.value}',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        onPressed: controller.jumlahHari.value < controller.maksHari
                            ? () => controller.ubahHari(1)
                            : null,
                        icon: const Icon(Icons.add_circle_outline),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: controller.alasanController,
                    maxLines: 2,
                    maxLength: 500,
                    decoration: InputDecoration(
                      labelText: 'Catatan (opsional)',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: controller.isSubmitting.value || controller.maksHari < 1
                        ? null
                        : controller.ajukan,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.redPrimary,
                      foregroundColor: AppColors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                      controller.isSubmitting.value
                          ? 'Mengirim...'
                          : controller.maksHari < 1
                              ? 'Saldo tidak cukup'
                              : 'Kirim Pengajuan',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      backgroundColor: AppColors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
    );
  }
}
