@echo off
:: Script untuk menginstal pgvector yang telah berhasil dikompilasi ke PostgreSQL 18 (Port 5433)
:: Pastikan menjalankan file ini dengan: Klik Kanan -> "Run as administrator"

echo [1/4] Memeriksa hak Administrator...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ========================================================
    echo ERROR: Harap jalankan file ini sebagai Administrator!
    echo Klik kanan file ini lalu pilih "Run as administrator".
    echo ========================================================
    echo.
    pause
    exit /b 1
)

set "BUILD_DIR=%TEMP%\pgvector-build"
set "PG_DIR=C:\Program Files\PostgreSQL\18"

echo [2/4] Menyalin file binary ke folder PostgreSQL 18...
copy /Y "%BUILD_DIR%\vector.dll" "%PG_DIR%\lib\"
copy /Y "%BUILD_DIR%\vector.control" "%PG_DIR%\share\extension\"
copy /Y "%BUILD_DIR%\sql\vector--*.sql" "%PG_DIR%\share\extension\"

if not exist "%PG_DIR%\include\server\extension\vector" (
    mkdir "%PG_DIR%\include\server\extension\vector"
)
copy /Y "%BUILD_DIR%\src\halfvec.h" "%PG_DIR%\include\server\extension\vector\"
copy /Y "%BUILD_DIR%\src\sparsevec.h" "%PG_DIR%\include\server\extension\vector\"
copy /Y "%BUILD_DIR%\src\vector.h" "%PG_DIR%\include\server\extension\vector\"

echo [3/4] Merestart service PostgreSQL 18 (Port 5433)...
net stop postgresql-x64-18
net start postgresql-x64-18

echo [4/4] Verifikasi instalasi...
if exist "%PG_DIR%\lib\vector.dll" (
    echo.
    echo ========================================================
    echo SUKSES! pgvector berhasil diinstal ke PostgreSQL 18.
    echo.
    echo Langkah selanjutnya:
    echo Buka pgAdmin / psql pada port 5433 lalu jalankan:
    echo   CREATE EXTENSION IF NOT EXISTS vector;
    echo ========================================================
) else (
    echo.
    echo Gagal menyalin vector.dll. Periksa perizinan folder.
)

echo.
pause
