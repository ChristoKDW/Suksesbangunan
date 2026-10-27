import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

import '../../../components/app_alert.dart';
import '../../../core/theme/app_colors.dart';
import '../controllers/kasbon_controller.dart';

class KasbonView extends GetView<KasbonController> {
  const KasbonView({super.key});

  static const _statusColor = {
    'menunggu': Color(0xFFD97706),
    'aktif': Color(0xFF2563EB),
    'lunas': Color(0xFF16A34A),
    'ditolak': Color(0xFFDC2626),
    'dibatalkan': Color(0xFF64748B),
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        title: const Text(
          'Kasbon Saya',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AppColors.redPrimary,
        foregroundColor: AppColors.white,
        elevation: 0,
      ),
      floatingActionButton: Obx(
        () => controller.adaMenunggu || controller.isLoading.value
            ? const SizedBox.shrink()
            : FloatingActionButton.extended(
                onPressed: () async {
                  if (await AppAlert.cekKuota('kasbon')) _showForm(context);
                },
                backgroundColor: AppColors.redPrimary,
                foregroundColor: AppColors.white,
                icon: const Icon(Icons.add),
                label: const Text('Ajukan Kasbon'),
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
              _summaryCard(),
              const SizedBox(height: 16),
              if (controller.kasbonList.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: Text(
                      'Belum ada kasbon',
                      style: TextStyle(color: AppColors.slateLight),
                    ),
                  ),
                )
              else
                ...controller.kasbonList.map(_kasbonCard),
            ],
          );
        }),
      ),
    );
  }

  Widget _summaryCard() {
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
          const Text(
            'Total sisa kasbon aktif',
            style: TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            controller.rp(controller.totalSisa.value),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Cicilan dipotong otomatis dari gaji setiap periode sampai lunas.',
            style: TextStyle(color: Colors.white70, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _kasbonCard(Map<String, dynamic> k) {
    final status = (k['status'] ?? '').toString();
    final color = _statusColor[status] ?? AppColors.slateLight;
    final jumlah = num.tryParse('${k['jumlah']}') ?? 0;
    final terbayar = num.tryParse('${k['terbayar']}') ?? 0;
    final progress = jumlah > 0
        ? (terbayar / jumlah).clamp(0, 1).toDouble()
        : 0.0;
    final riwayat = (k['riwayat'] as List?) ?? [];

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
                  controller.rp(jumlah),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: AppColors.slateDark,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: TextStyle(
                    color: color,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          if ((k['alasan'] ?? '').toString().isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              '${k['alasan']}',
              style: const TextStyle(color: AppColors.slateLight, fontSize: 12),
            ),
          ],
          const SizedBox(height: 10),
          Text(
            'Cicilan ${controller.rp(k['cicilanPerBulan'])}/bulan · mulai ${controller.periodeLabel(k['mulaiPeriode'])}',
            style: const TextStyle(fontSize: 12, color: AppColors.slateDark),
          ),
          if (status == 'aktif' || status == 'lunas') ...[
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 8,
                backgroundColor: AppColors.borderGrey,
                color: status == 'lunas' ? AppColors.success : AppColors.info,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Terbayar ${controller.rp(terbayar)} · Sisa ${controller.rp(k['sisa'])}',
              style: const TextStyle(fontSize: 11, color: AppColors.slateLight),
            ),
          ],
          if ((k['catatanHrd'] ?? '').toString().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Catatan HRD: ${k['catatanHrd']}',
              style: const TextStyle(fontSize: 11, color: AppColors.slateLight),
            ),
          ],
          if (riwayat.isNotEmpty)
            Theme(
              data: ThemeData().copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                tilePadding: EdgeInsets.zero,
                title: Text(
                  'Riwayat potongan (${riwayat.length}x)',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                children: riwayat.map((c) {
                  final r = c as Map;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Gaji ${controller.periodeLabel(r['periodeAkhir']?.toString())}',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                        Text(
                          controller.rp(r['nominal']),
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          if (status == 'menunggu')
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => controller.batalkan(k['idKasbon'] as int),
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
    InputDecoration deco(String label, {String? hint}) => InputDecoration(
      labelText: label,
      hintText: hint,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      isDense: true,
    );
    Get.bottomSheet(
      SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            20,
            20,
            20 + MediaQuery.of(context).viewInsets.bottom,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Ajukan Kasbon',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Setelah disetujui HRD, cicilan dipotong otomatis dari gaji mulai periode berikutnya.',
                  style: TextStyle(fontSize: 12, color: AppColors.slateLight),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: controller.jumlahController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: deco(
                    'Jumlah kasbon (Rp)',
                    hint: 'Contoh: 1500000',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: controller.cicilanController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: deco(
                    'Cicilan per bulan (Rp)',
                    hint: 'Contoh: 500000',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: controller.alasanController,
                  maxLines: 2,
                  maxLength: 500,
                  decoration: deco('Keperluan'),
                ),
                const SizedBox(height: 8),
                Obx(
                  () => ElevatedButton(
                    onPressed: controller.isSubmitting.value
                        ? null
                        : controller.ajukan,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.redPrimary,
                      foregroundColor: AppColors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      controller.isSubmitting.value
                          ? 'Mengirim...'
                          : 'Kirim Pengajuan',
                    ),
                  ),
                ),
              ],
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
