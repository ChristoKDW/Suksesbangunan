@echo off
echo Membuka port 3002 di Windows Defender Firewall...
netsh advfirewall firewall add rule name="NestJS Backend Port 3002" dir=in action=allow protocol=TCP localport=3002
if %errorlevel% equ 0 (
  echo.
  echo [SUKSES] Port 3002 berhasil dibuka di Firewall! HP fisik sekarang dapat mengakses backend.
) else (
  echo.
  echo [GAGAL] Pastikan menjalankan file ini sebagai Administrator (Klik kanan -> Run as administrator).
)
echo.
pause
