import 'package:flutter/material.dart';

// ponytail: Static class for color tokens, no external packages.
class AppColors {
  AppColors._();

  // Primitive Tokens
  static const Color redPrimary = Color(0xFFDC2626);
  static const Color redVariant = Color(0xFF991B1B);
  static const Color redContainer = Color(0xFFFEE2E2);
  static const Color redSoft = Color(0xFFFFD5D8);
  
  static const Color white = Color(0xFFFFFFFF);
  static const Color surfaceWhite = Color(0xFFF8FAFC);
  
  static const Color slateDark = Color(0xFF0F172A);
  static const Color slateLight = Color(0xFF64748B);
  
  static const Color borderGrey = Color(0xFFF1F5F9);
  
  // Semantic Status
  static const Color success = Color(0xFF16A34A);
  static const Color warning = Color(0xFFD97706);
  static const Color error = Color(0xFFDC2626);
  static const Color info = Color(0xFF2563EB);
}
