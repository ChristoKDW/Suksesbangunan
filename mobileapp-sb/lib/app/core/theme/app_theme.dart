import 'package:flutter/material.dart';
import 'app_colors.dart';

// ponytail: Keep theme simple, use material 3 defaults where possible.
class AppTheme {
  AppTheme._();

  static final ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.white,
    colorScheme: const ColorScheme.light(
      primary: AppColors.redPrimary,
      onPrimary: AppColors.white,
      primaryContainer: AppColors.redContainer,
      onPrimaryContainer: AppColors.redVariant,
      secondary: AppColors.redVariant,
      onSecondary: AppColors.white,
      surface: AppColors.surfaceWhite,
      onSurface: AppColors.slateDark,
      error: AppColors.error,
      onError: AppColors.white,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.white,
      foregroundColor: AppColors.slateDark,
      elevation: 0,
      centerTitle: true,
    ),
    cardTheme: CardThemeData(
      color: AppColors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.borderGrey),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.redPrimary,
        foregroundColor: AppColors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        elevation: 0,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.redPrimary,
        side: const BorderSide(color: AppColors.redPrimary),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.borderGrey),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.borderGrey),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.redPrimary),
      ),
    ),
    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: AppColors.slateDark),
      bodyMedium: TextStyle(color: AppColors.slateDark),
      titleLarge: TextStyle(color: AppColors.slateDark, fontWeight: FontWeight.bold),
    ),
    datePickerTheme: DatePickerThemeData(
      backgroundColor: AppColors.white,
      surfaceTintColor: Colors.transparent,
      headerBackgroundColor: AppColors.white,
      headerForegroundColor: AppColors.slateDark,
      rangePickerHeaderBackgroundColor: AppColors.white,
      rangePickerHeaderForegroundColor: AppColors.slateDark,
      rangePickerSurfaceTintColor: Colors.transparent,
      rangeSelectionBackgroundColor: AppColors.redSoft,
      dayForegroundColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return AppColors.white;
        }
        return AppColors.slateDark;
      }),
      dayBackgroundColor: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return AppColors.redPrimary;
        }
        return null;
      }),
      todayForegroundColor: WidgetStateProperty.all(AppColors.redPrimary),
      todayBorder: const BorderSide(color: AppColors.redPrimary, width: 1.5),
    ),
  );

  /// Helper theme khusus dialog showDateRangePicker
  static ThemeData datePickerTheme(BuildContext context) {
    return Theme.of(context).copyWith(
      scaffoldBackgroundColor: AppColors.white,
      colorScheme: const ColorScheme.light(
        primary: AppColors.redPrimary,
        onPrimary: AppColors.white,
        primaryContainer: AppColors.redSoft,
        onPrimaryContainer: AppColors.redVariant,
        secondary: AppColors.redSoft,
        onSecondary: AppColors.slateDark,
        secondaryContainer: AppColors.redSoft,
        onSecondaryContainer: AppColors.slateDark,
        surface: AppColors.white,
        onSurface: AppColors.slateDark,
      ),
      datePickerTheme: DatePickerThemeData(
        backgroundColor: AppColors.white,
        surfaceTintColor: Colors.transparent,
        headerBackgroundColor: AppColors.white,
        headerForegroundColor: AppColors.slateDark,
        rangePickerHeaderBackgroundColor: AppColors.white,
        rangePickerHeaderForegroundColor: AppColors.slateDark,
        rangePickerSurfaceTintColor: Colors.transparent,
        rangeSelectionBackgroundColor: AppColors.redSoft,
        dayForegroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.white;
          }
          return AppColors.slateDark;
        }),
        dayBackgroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.redPrimary;
          }
          return null;
        }),
        todayForegroundColor: WidgetStateProperty.all(AppColors.redPrimary),
        todayBorder: const BorderSide(color: AppColors.redPrimary, width: 1.5),
      ),
    );
  }
}
