#!/bin/bash
set -e

echo "========================================================="
echo " DEPLOY & EKSEKUSI BACKEND KE VPS (137.59.126.188)"
echo "========================================================="

VPS_IP="137.59.126.188"
VPS_USER="koinshop"
PEM_KEY="/Users/potah/Documents/koinshop/koinshop.pem"
REMOTE_DIR="/home/koinshop/apps/suksesbangunan/backend-sb"

echo "1. Sinkronisasi source code backend ke VPS..."
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.env' \
  -e "ssh -i $PEM_KEY -o StrictHostKeyChecking=no" \
  /Users/potah/Documents/Suksesbangunan/backend-sb/ \
  $VPS_USER@$VPS_IP:$REMOTE_DIR/

echo "2. Build dan Restart PM2 di Server VPS..."
ssh -i $PEM_KEY -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
  cd /home/koinshop/apps/suksesbangunan/backend-sb
  npm install
  npm run build
  pm2 restart suksesbangunan-backend || pm2 restart 1 || pm2 start dist/main.js --name "suksesbangunan-backend"
  pm2 status
  echo "Backend VPS berhasil dieksekusi dan berjalan aktif!"
EOF

echo "========================================================="
echo " SELESAI: Backend di VPS telah aktif dan terupdate!"
echo "========================================================="
