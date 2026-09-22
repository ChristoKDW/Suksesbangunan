#!/bin/bash
set -e

echo "========================================================="
echo " MENJALANKAN FLUTTER MOBILE APP (mobileapp-sb)"
echo "========================================================="

cd /Users/potah/Documents/Suksesbangunan/mobileapp-sb

echo "1. Mengambil dependensi Flutter..."
flutter pub get

echo "2. Menjalankan aplikasi Flutter..."
flutter run
