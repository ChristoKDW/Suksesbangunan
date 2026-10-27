import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../controllers/laporan_masalah_controller.dart';

class LaporanMasalahView extends GetView<LaporanMasalahController> {
  const LaporanMasalahView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surfaceWhite,
      appBar: AppBar(
        title: const Text('Bantuan & Lapor Kendala'),
        elevation: 0,
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.slateDark,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Obx(
            () => Container(
              color: AppColors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.borderGrey,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _buildTabButton(
                        label: 'Kirim Laporan',
                        icon: Icons.edit_note_rounded,
                        isActive: controller.currentTabIndex.value == 0,
                        onTap: () => controller.switchTab(0),
                      ),
                    ),
                    Expanded(
                      child: _buildTabButton(
                        label: 'Riwayat Tiket',
                        icon: Icons.history_rounded,
                        isActive: controller.currentTabIndex.value == 1,
                        onTap: () => controller.switchTab(1),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
      body: Obx(() {
        if (controller.currentTabIndex.value == 0) {
          return _buildFormView(context);
        } else {
          return _buildHistoryView(context);
        }
      }),
    );
  }

  Widget _buildTabButton({
    required String label,
    required IconData icon,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 18,
              color: isActive ? AppColors.redPrimary : AppColors.slateLight,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                color: isActive ? AppColors.redPrimary : AppColors.slateLight,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormView(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner Info
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.redContainer.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.redPrimary.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.support_agent_rounded,
                  color: AppColors.redPrimary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Pusat Bantuan Teknis LARAS',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppColors.slateDark,
                        ),
                      ),
                      SizedBox(height: 3),
                      Text(
                        'Laporkan kendala aplikasi (GPS, absensi wajah, slip gaji, dll). Tim sistem akan segera menindaklanjuti dan memberi solusi.',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.slateLight,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Pilihan Kategori
          const Text(
            'Kategori Kendala',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppColors.slateDark,
            ),
          ),
          const SizedBox(height: 8),
          Obx(
            () => Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderGrey),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  isExpanded: true,
                  value: controller.selectedKategori.value,
                  items: controller.daftarKategori.map((item) {
                    return DropdownMenuItem<String>(
                      value: item.key,
                      child: Row(
                        children: [
                          Icon(item.icon, size: 18, color: AppColors.redPrimary),
                          const SizedBox(width: 10),
                          Text(
                            item.label,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.slateDark,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      controller.selectedKategori.value = val;
                    }
                  },
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Judul Masalah
          const Text(
            'Judul Kendala',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppColors.slateDark,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: controller.judulController,
            decoration: InputDecoration(
              hintText: 'Contoh: Kamera freeze saat ambil foto absen',
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
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 12,
              ),
            ),
            style: const TextStyle(fontSize: 13),
          ),
          const SizedBox(height: 16),

          // Deskripsi Masalah
          const Text(
            'Deskripsi Detail',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppColors.slateDark,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: controller.deskripsiController,
            maxLines: 4,
            decoration: InputDecoration(
              hintText:
                  'Jelaskan kendala secara rinci, apa yang terjadi, dan pesan error jika ada...',
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
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 12,
              ),
            ),
            style: const TextStyle(fontSize: 13),
          ),
          const SizedBox(height: 16),

          // Langkah Reproduksi (Opsional)
          const Text(
            'Langkah Kejadian (Opsional)',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppColors.slateDark,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: controller.langkahController,
            maxLines: 2,
            decoration: InputDecoration(
              hintText: 'Contoh: 1. Masuk menu absensi, 2. Klik foto masuk',
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
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 12,
              ),
            ),
            style: const TextStyle(fontSize: 13),
          ),
          const SizedBox(height: 16),

          // Screenshot Bukti Error
          const Text(
            'Lampirkan Foto / Tangkapan Layar',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppColors.slateDark,
            ),
          ),
          const SizedBox(height: 8),
          Obx(() {
            final file = controller.selectedImage.value;
            if (file != null) {
              return Stack(
                children: [
                  Container(
                    height: 180,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      image: DecorationImage(
                        image: FileImage(file),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: controller.removeImage,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }

            return Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => controller.pickImage(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library_outlined, size: 18),
                    label: const Text('Dari Galeri'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.slateDark,
                      side: const BorderSide(color: AppColors.borderGrey),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => controller.pickImage(ImageSource.camera),
                    icon: const Icon(Icons.camera_alt_outlined, size: 18),
                    label: const Text('Foto Kamera'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.slateDark,
                      side: const BorderSide(color: AppColors.borderGrey),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
              ],
            );
          }),
          const SizedBox(height: 26),

          // Tombol Submit
          SizedBox(
            width: double.infinity,
            child: Obx(
              () => ElevatedButton.icon(
                onPressed: controller.isSubmitting.value
                    ? null
                    : controller.submitReport,
                icon: controller.isSubmitting.value
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Icon(Icons.send_rounded, size: 18),
                label: Text(
                  controller.isSubmitting.value
                      ? 'Mengirim Laporan...'
                      : 'Kirim Laporan Kendala',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.redPrimary,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildHistoryView(BuildContext context) {
    if (controller.isLoadingHistory.value) {
      return const Center(child: CircularProgressIndicator());
    }

    if (controller.historyList.isEmpty) {
      return RefreshIndicator(
        onRefresh: controller.fetchHistory,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Container(
            height: MediaQuery.of(context).size.height * 0.6,
            alignment: Alignment.center,
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.assignment_turned_in_outlined,
                  size: 64,
                  color: AppColors.slateLight.withValues(alpha: 0.5),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Belum Ada Laporan',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.slateDark,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Semua laporan kendala yang Anda kirimkan akan tercatat di sini beserta solusinya.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: AppColors.slateLight),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: controller.fetchHistory,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: controller.historyList.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final item = controller.historyList[index];
          return _buildHistoryCard(item);
        },
      ),
    );
  }

  Widget _buildHistoryCard(Map<String, dynamic> item) {
    final tiketId = item['tiketId']?.toString() ?? '-';
    final judul = item['judul']?.toString() ?? 'Laporan Masalah';
    final deskripsi = item['deskripsi']?.toString() ?? '';
    final status = item['status']?.toString() ?? 'menunggu';
    final solusi = item['tanggapanSolusi']?.toString();
    final createdAt = item['createdAt']?.toString();

    String formattedDate = '-';
    if (createdAt != null) {
      try {
        final dt = DateTime.parse(createdAt);
        formattedDate = DateFormat('dd MMM yyyy, HH:mm').format(dt);
      } catch (_) {
        formattedDate = createdAt;
      }
    }

    Color statusColor;
    String statusLabel;
    IconData statusIcon;

    switch (status) {
      case 'sedang_diproses':
        statusColor = AppColors.info;
        statusLabel = 'Diproses';
        statusIcon = Icons.hourglass_top_rounded;
        break;
      case 'selesai':
        statusColor = AppColors.success;
        statusLabel = 'Selesai';
        statusIcon = Icons.check_circle_rounded;
        break;
      case 'ditolak':
        statusColor = AppColors.error;
        statusLabel = 'Ditolak';
        statusIcon = Icons.cancel_rounded;
        break;
      case 'menunggu':
      default:
        statusColor = AppColors.warning;
        statusLabel = 'Menunggu';
        statusIcon = Icons.schedule_rounded;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderGrey),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Tiket ID & Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.borderGrey,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  tiketId,
                  style: const TextStyle(
                    fontSize: 11,
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.bold,
                    color: AppColors.slateDark,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  children: [
                    Icon(statusIcon, size: 12, color: statusColor),
                    const SizedBox(width: 4),
                    Text(
                      statusLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Judul
          Text(
            judul,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: AppColors.slateDark,
            ),
          ),
          const SizedBox(height: 4),

          // Deskripsi
          Text(
            deskripsi,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.slateLight,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 10),

          // Tanggal dibuat
          Row(
            children: [
              const Icon(
                Icons.calendar_today_outlined,
                size: 12,
                color: AppColors.slateLight,
              ),
              const SizedBox(width: 4),
              Text(
                formattedDate,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.slateLight,
                ),
              ),
            ],
          ),

          // Solusi Jawaban Admin / IT jika ada
          if (solusi != null && solusi.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: AppColors.success.withValues(alpha: 0.25),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.verified_rounded,
                    color: AppColors.success,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Tanggapan Tim Sistem:',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppColors.success,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          solusi,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.slateDark,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
