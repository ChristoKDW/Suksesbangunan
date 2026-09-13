import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

// ponytail: Header component for consistency across auth screens.
class AppBrandHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const AppBrandHeader({
    super.key,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Image.asset(
          'assets/logo/logo.png',
          width: 64,
          height: 64,
        ),
        const SizedBox(height: 24),
        Text(
          title,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.slateDark,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.slateLight,
              ),
        ),
      ],
    );
  }
}
