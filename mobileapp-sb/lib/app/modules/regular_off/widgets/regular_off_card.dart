import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../views/regular_off_view.dart';
import '../bindings/regular_off_binding.dart';
import '../../../data/services/regular_off_service.dart';

class RegularOffCard extends StatefulWidget {
  const RegularOffCard({super.key});

  @override
  State<RegularOffCard> createState() => _RegularOffCardState();
}

class _RegularOffCardState extends State<RegularOffCard> {
  final RegularOffService _service = Get.isRegistered<RegularOffService>()
      ? Get.find<RegularOffService>()
      : Get.put(RegularOffService());

  bool _isLoading = true;
  bool _isOperasional = false;
  int _totalTersedia = 0;
  String _sisaWaktuKet = '';

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final elig = await _service.checkEligibility();
      if (elig['isOperasional'] == true) {
        final saldo = await _service.getMySaldo();
        if (mounted) {
          setState(() {
            _isOperasional = true;
            _totalTersedia = saldo['totalTersedia'] ?? 0;
            final items = saldo['items'] as List?;
            if (items != null && items.isNotEmpty) {
              final firstAvailable = items.firstWhere(
                (i) => i['status'] == 'tersedia',
                orElse: () => null,
              );
              if (firstAvailable != null) {
                _sisaWaktuKet = firstAvailable['statusKeterangan'] ?? '';
              }
            }
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _isOperasional = false;
            _isLoading = false;
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading || !_isOperasional) {
      return const SizedBox.shrink();
    }

    return InkWell(
      onTap: () {
        Get.to(
          () => const RegularOffView(),
          binding: RegularOffBinding(),
        )?.then((_) => _fetchData());
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFE11D48), Color(0xFF9F1239)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFE11D48).withOpacity(0.25),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.beach_access,
                color: Colors.white,
                size: 26,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        'Hak Regular Off (RO)',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (_sisaWaktuKet.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.25),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            _sisaWaktuKet,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _totalTersedia > 0
                        ? '$_totalTersedia hari libur RO tersedia (Bisa diajukan)'
                        : 'Belum ada saldo RO aktif (Didapat jika kerja di tgl merah)',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.85),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right,
              color: Colors.white70,
            ),
          ],
        ),
      ),
    );
  }
}
