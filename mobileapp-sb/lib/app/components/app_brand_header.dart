import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

// ponytail: Header component for consistency across auth screens.
class AppBrandHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;

  const AppBrandHeader({
    super.key,
    required this.title,
    required this.subtitle,
    this.icon = Icons.business,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.redContainer,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            icon,
            color: AppColors.redPrimary,
            size: 32,
          ),
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
