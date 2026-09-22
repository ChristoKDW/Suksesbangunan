import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:skeletonizer/skeletonizer.dart';

import '../../../core/theme/app_colors.dart';
import '../controllers/slip_gaji_controller.dart';

class SlipGajiView extends GetView<SlipGajiController> {
  const SlipGajiView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        title: const Text(
          'Slip Gaji Karyawan',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AppColors.redPrimary,
        foregroundColor: AppColors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Muat Ulang',
            onPressed: () => controller.fetchSlip(),
          ),
        ],
      ),
      body: Obx(() {
        final loading = controller.isLoading.value;

        if (controller.errorMessage.value.isNotEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    color: AppColors.redPrimary,
                    size: 48,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    controller.errorMessage.value,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: AppColors.slateDark,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => controller.fetchSlip(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.redPrimary,
                      foregroundColor: AppColors.white,
                    ),
                    child: const Text('Coba Lagi'),
                  ),
                ],
              ),
            ),
          );
        }

        final data =
            controller.slipData.value ?? (loading ? <String, dynamic>{} : null);
        if (data == null) {
          return const Center(child: Text('Data slip gaji tidak tersedia'));
        }

        final karyawan = data['karyawan'] as Map<String, dynamic>? ?? {};
        final bool isOfficial = data['isOfficial'] == true;
        final bool hariIniTelat = data['hariIniTelat'] == true;
        final String? pesanHariIni = data['pesanHariIni']?.toString();
        final List<dynamic> daftarTelat =
            data['daftarKeterlambatan'] as List<dynamic>? ?? [];

        return Skeletonizer(
          enabled: loading,
          child: RefreshIndicator(
            onRefresh: () => controller.fetchSlip(),
            color: AppColors.redPrimary,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: isOfficial
                          ? Colors.green.shade50
                          : Colors.amber.shade50,
                      border: Border.all(
                        color: isOfficial
                            ? Colors.green.shade300
                            : Colors.amber.shade300,
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      isOfficial
                          ? 'Slip resmi — nilai sesuai snapshot payroll periode ini.'
                          : 'Pratinjau berjalan — belum ada payroll resmi untuk periode ini.',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isOfficial
                            ? Colors.green.shade900
                            : Colors.amber.shade900,
                      ),
                    ),
                  ),

                  // Banner Notifikasi Keterlambatan Real-Time
                  if (!isOfficial && hariIniTelat && pesanHariIni != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        border: Border.all(color: const Color(0xFFEF4444)),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.warning_amber_rounded,
                            color: Color(0xFFDC2626),
                            size: 24,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Pemberitahuan Keterlambatan Hari Ini',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF991B1B),
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  pesanHariIni,
                                  style: const TextStyle(
                                    color: Color(0xFF7F1D1D),
                                    fontSize: 12,
                                    height: 1.3,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // Slip Gaji Resmi Card (Exact match CV SUKSES BANGUNINDO)
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Header Box
                        Container(
                          padding: const EdgeInsets.symmetric(
                            vertical: 8,
                            horizontal: 12,
                          ),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.black, width: 1.2),
                          ),
                          child: const Column(
                            children: [
                              Text(
                                'CV SUKSES BANGUNINDO',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 15,
                                  letterSpacing: 1.1,
                                  color: Colors.black,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'SLIP GAJI KARYAWAN',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  letterSpacing: 1.5,
                                  color: Colors.black,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Info Karyawan Box
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.black, width: 1),
                          ),
                          child: Column(
                            children: [
                              _buildInfoRow(
                                'Periode',
                                '${controller.formatDateIndo(data['periodeAwal'])} s/d ${controller.formatDateIndo(data['periodeAkhir'])} (${controller.formatPeriodeBulan(data['periodeAkhir'])})',
                                isBold: true,
                              ),
                              _buildDivider(),
                              _buildInfoRow(
                                'Nama',
                                karyawan['nama']?.toString().toUpperCase() ??
                                    '-',
                              ),
                              _buildDivider(),
                              _buildInfoRow(
                                'Jabatan',
                                karyawan['jabatan']?.toString() ?? '-',
                              ),
                              _buildDivider(),
                              _buildInfoRow(
                                'Divisi',
                                karyawan['departemen']?.toString() ?? '-',
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),

                        // Tabel Rincian Penghasilan
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.black, width: 1),
                          ),
                          child: Column(
                            children: [
                              // Section Header
                              Container(
                                width: double.infinity,
                                color: const Color(0xFFF3F4F6),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 6,
                                ),
                                child: const Text(
                                  'RINCIAN PENGHASILAN',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                    color: Colors.black,
                                  ),
                                ),
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'TOTAL TAKE HOME PAY',
                                '',
                                controller.formatCurrency(data['totalGaji']),
                                isBold: true,
                                textColor: const Color(0xFF16A34A),
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'TOTAL HARI KERJA',
                                '${data['totalHariKerja'] ?? 26}',
                                'HARI',
                                isBold: true,
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'Gaji Pokok (${data['totalHariKerja'] ?? 26} Hari Kerja)',
                                '',
                                controller.formatCurrency(data['gajiPokok']),
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'Gaji Pokok sesuai hari kerja',
                                '',
                                controller.formatCurrency(
                                  data['gajiPokokSesuaiHari'],
                                ),
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'Tunjangan Konsumsi',
                                '${data['totalHariHadir'] ?? 0} Hari × ${controller.formatCurrency(data['tarifKonsumsiPerHari'] ?? 20000)}',
                                controller.formatCurrency(
                                  data['tunjanganKonsumsi'],
                                ),
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'Tunjangan Transportasi',
                                '',
                                controller.formatCurrency(
                                  data['tunjanganTransportasi'],
                                ),
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'Tunjangan Komunikasi',
                                '',
                                controller.formatCurrency(
                                  data['tunjanganKomunikasi'],
                                ),
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'Tunjangan Jabatan',
                                '',
                                controller.formatCurrency(
                                  data['tunjanganJabatan'],
                                ),
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'Lembur',
                                '',
                                controller.formatCurrency(data['lembur']),
                              ),
                              _buildDivider(thick: true),
                              _buildTableRow(
                                'Total Penghasilan',
                                '',
                                controller.formatCurrency(
                                  data['totalPenghasilan'],
                                ),
                                isBold: true,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),

                        // Tabel Potongan
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.black, width: 1),
                          ),
                          child: Column(
                            children: [
                              Container(
                                width: double.infinity,
                                color: const Color(0xFFF3F4F6),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 6,
                                ),
                                child: const Text(
                                  'POTONGAN',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                    color: Colors.black,
                                  ),
                                ),
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'Potongan BPJS KETENAGAKERJAAN',
                                '',
                                controller.formatCurrency(data['potonganBpjs']),
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'Potongan Terlambat',
                                (data['jumlahTerlambat'] != null &&
                                        (data['jumlahTerlambat'] as num) > 0)
                                    ? '${data['jumlahTerlambat']} Kali Telat'
                                    : '',
                                controller.formatCurrency(
                                  data['potonganTerlambat'],
                                ),
                                textColor:
                                    (data['potonganTerlambat'] != null &&
                                        (data['potonganTerlambat'] as num) > 0)
                                    ? const Color(0xFFDC2626)
                                    : null,
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'Potongan pinjaman',
                                '',
                                controller.formatCurrency(
                                  data['potonganPinjaman'],
                                ),
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'Potongan Lainnya',
                                '',
                                controller.formatCurrency(
                                  data['potonganLainnya'],
                                ),
                              ),
                              _buildDivider(),
                              _buildTableRow(
                                'Sisa Pinjaman',
                                '',
                                controller.formatCurrency(data['sisaPinjaman']),
                              ),
                              _buildDivider(thick: true),
                              _buildTableRow(
                                'Total Diterima',
                                '',
                                controller.formatCurrency(data['totalGaji']),
                                isBold: true,
                                textColor: const Color(0xFF1E40AF),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),

                        // Catatan Box
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.black, width: 1),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'CATATAN:',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                  color: Colors.black,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                '1. Slip gaji bersifat rahasia. Dilarang membagikan informasi gaji kepada sesama karyawan.',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  color: Colors.black87,
                                  height: 1.3,
                                ),
                              ),
                              const SizedBox(height: 3),
                              const Text(
                                '2. Ketentuan Sakit: Jika izin sakit dengan surat dokter resmi yang disetujui, hanya tunjangan konsumsi (uang makan) yang dipotong. Gaji pokok tetap dibayarkan.',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  color: Colors.black87,
                                  height: 1.3,
                                ),
                              ),
                              const SizedBox(height: 3),
                              const Text(
                                '3. Ketentuan Izin & Alpa: Hari izin dan hari alpa/mangkir tidak dihitung dalam gaji pokok maupun uang makan (potong gaji harian proporsional & tanpa uang makan).',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  color: Colors.black87,
                                  height: 1.3,
                                ),
                              ),
                              if (data['catatan'] != null &&
                                  data['catatan'].toString().isNotEmpty) ...[
                                const SizedBox(height: 4),
                                const Divider(height: 8, color: Colors.grey),
                                Text(
                                  'ℹ️ ${data['catatan']}',
                                  style: const TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF1E3A8A),
                                    height: 1.3,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Card Metode Perhitungan Baku & Transparan
                  if (data['metodePerhitungan'] != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEFF6FF),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.calculate_outlined,
                                  color: Color(0xFF2563EB),
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 10),
                              const Expanded(
                                child: Text(
                                  'Metode Perhitungan Transparan',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: AppColors.slateDark,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _buildMetodeItem(
                            'Total Hari Kerja',
                            data['metodePerhitungan']['totalHariKerjaRumus']
                                    ?.toString() ??
                                '${data['totalHariKerja']} Hari Kerja',
                            Icons.date_range_outlined,
                          ),
                          _buildMetodeItem(
                            'Gaji Pokok',
                            data['metodePerhitungan']['gajiPokokRumus']
                                    ?.toString() ??
                                'Prorata hari kerja',
                            Icons.account_balance_wallet_outlined,
                          ),
                          _buildMetodeItem(
                            'Uang Makan',
                            data['metodePerhitungan']['uangMakanRumus']
                                    ?.toString() ??
                                'Tarif harian kehadiran',
                            Icons.restaurant_outlined,
                          ),
                          _buildMetodeItem(
                            'Denda Telat',
                            data['metodePerhitungan']['dendaTelatRumus']
                                    ?.toString() ??
                                'Denda frekuensi telat',
                            Icons.timer_outlined,
                          ),
                          _buildMetodeItem(
                            'Take Home Pay',
                            data['metodePerhitungan']['takeHomePayRumus']
                                    ?.toString() ??
                                'Total Penghasilan - Potongan',
                            Icons.payments_outlined,
                            isLast: true,
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 16),

                  // Card Edukasi & Pembelajaran Keterlambatan Harian
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderGrey),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: daftarTelat.isEmpty
                                    ? Colors.green.shade50
                                    : Colors.red.shade50,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                daftarTelat.isEmpty
                                    ? Icons.check_circle
                                    : Icons.access_time_filled,
                                color: daftarTelat.isEmpty
                                    ? Colors.green.shade700
                                    : AppColors.redPrimary,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 10),
                            const Expanded(
                              child: Text(
                                'Evaluasi Keterlambatan Periode Ini',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  color: AppColors.slateDark,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (isOfficial &&
                            ((data['jumlahTerlambat'] as num?) ?? 0) > 0) ...[
                          Text(
                            'Snapshot resmi mencatat ${data['jumlahTerlambat']} kejadian terlambat dengan total potongan ${controller.formatCurrency(data['potonganTerlambat'])}. Rincian live tidak dicampurkan ke slip resmi.',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.slateLight,
                            ),
                          ),
                        ] else if (daftarTelat.isEmpty) ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.green.shade50,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.green.shade200),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.thumb_up_alt_rounded,
                                  color: Colors.green.shade700,
                                  size: 20,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    'Hebat! Anda tidak memiliki catatan keterlambatan pada periode ini. Disiplin Anda sangat diapresiasi.',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.green.shade900,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ] else ...[
                          Text(
                            'Total ${data['jumlahTerlambat'] ?? daftarTelat.length} kali terlambat (Potongan denda akumulasi: ${controller.formatCurrency(data['potonganTerlambat'])}):',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.slateLight,
                            ),
                          ),
                          const SizedBox(height: 8),
                          ...daftarTelat.map((telat) {
                            final tgl = telat['tanggal']?.toString() ?? '-';
                            final jam = telat['jamMasuk']?.toString() ?? '-';
                            final denda = controller.formatCurrency(
                              telat['denda'],
                            );
                            return Container(
                              margin: const EdgeInsets.only(bottom: 6),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF7ED),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: const Color(0xFFFED7AA),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        controller.formatDateIndo(tgl),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 12,
                                        ),
                                      ),
                                      Text(
                                        telat['keterangan']?.toString() ??
                                            'Pukul $jam',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: Colors.grey.shade700,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    '-$denda',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: Color(0xFFDC2626),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                          const SizedBox(height: 6),
                          Text(
                            '💡 Catatan Edukatif: Setiap keterlambatan langsung otomatis dipotong denda pada slip gaji hari tersebut. Jadikan ini pembelajaran untuk selalu hadir sebelum jam kerja dimulai.',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.amber.shade900,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 70,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
                color: Colors.black,
              ),
            ),
          ),
          const Text(': ', style: TextStyle(fontSize: 11, color: Colors.black)),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
                color: Colors.black,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTableRow(
    String col1,
    String col2,
    String col3, {
    bool isBold = false,
    Color? textColor,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4.5),
      child: Row(
        children: [
          Expanded(
            flex: 6,
            child: Text(
              col1,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
                color: textColor ?? Colors.black,
              ),
            ),
          ),
          Expanded(
            flex: 4,
            child: Text(
              col2,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
                color: Colors.grey.shade800,
              ),
            ),
          ),
          Expanded(
            flex: 4,
            child: Text(
              col3,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
                fontFamily: 'monospace',
                color: textColor ?? Colors.black,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider({bool thick = false}) {
    return Divider(height: 1, thickness: thick ? 1.5 : 1, color: Colors.black);
  }

  Widget _buildMetodeItem(
    String label,
    String value,
    IconData icon, {
    bool isLast = false,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14, color: const Color(0xFF64748B)),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF334155),
                  height: 1.3,
                ),
                children: [
                  TextSpan(
                    text: '$label: ',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  TextSpan(text: value),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
