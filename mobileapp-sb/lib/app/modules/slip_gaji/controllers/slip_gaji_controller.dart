import 'package:get/get.dart';
import 'package:intl/intl.dart';

import '../../../data/services/api_service.dart';

class SlipGajiController extends GetxController {
  final ApiService _api = Get.find<ApiService>();

  final isLoading = true.obs;
  final errorMessage = ''.obs;
  final slipData = Rxn<Map<String, dynamic>>();
  final selectedDate = Rxn<DateTime>();

  final currencyFormatter = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  @override
  void onInit() {
    super.onInit();
    selectedDate.value = DateTime.now();
    fetchSlip();
  }

  Future<void> fetchSlip([DateTime? targetDate]) async {
    isLoading.value = true;
    errorMessage.value = '';

    final date = targetDate ?? selectedDate.value ?? DateTime.now();
    selectedDate.value = date;
    final dateStr = DateFormat('yyyy-MM-dd').format(date);

    try {
      final res = await _api.getMySlip(tanggal: dateStr);
      slipData.value = res;
    } catch (e) {
      errorMessage.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }

  String formatCurrency(dynamic value) {
    if (value == null) return 'Rp 0';
    final numVal = num.tryParse(value.toString()) ?? 0;
    return currencyFormatter.format(numVal);
  }

  String formatDateIndo(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '-';
    try {
      final dt = DateTime.parse(dateStr).toLocal();
      const months = [
        '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return '${dt.day} ${months[dt.month]} ${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }

  String formatPeriodeBulan(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '-';
    try {
      final dt = DateTime.parse(dateStr).toLocal();
      const months = [
        '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return '${months[dt.month]} ${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }
}
