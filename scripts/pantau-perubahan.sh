#!/usr/bin/env bash
# Pantau perubahan project LARAS di VPS dan kirim email pengingat ke pemilik.
# Dijalankan cron tiap 10 menit:  */10 * * * * /home/apps/suksesbangunan/scripts/pantau-perubahan.sh
# Penerima email: isi file /root/.laras-pantau/email (tidak disimpan di git).
set -u
REPO=/home/apps/suksesbangunan
STATE=/root/.laras-pantau
mkdir -p "$STATE"
cd "$REPO" || exit 0

# File lama milik VPS yang memang sengaja tidak masuk git
ABAIKAN='backend-sb/env$|SuksesBangunan-iOS\.ipa$'

timeout 30 git fetch -q origin 2>/dev/null
HEAD=$(git rev-parse --short HEAD)
GITHUB=$(git rev-parse --short origin/main 2>/dev/null || echo "?")
DIRTY=$(git status --porcelain | grep -Ev "$ABAIKAN" || true)

LAST_HEAD=$(cat "$STATE/last_head" 2>/dev/null || echo "")
LAST_DIRTY=$(cat "$STATE/last_dirty" 2>/dev/null || echo "")
LAST_SYNC=$(cat "$STATE/last_sync" 2>/dev/null || echo "")
DIRTY_SIG=$(printf '%s' "$DIRTY" | md5sum | cut -c1-32)
SYNC_SIG="$HEAD:$GITHUB"

PESAN=""
if [ -n "$LAST_HEAD" ] && [ "$HEAD" != "$LAST_HEAD" ]; then
  PESAN+="COMMIT BARU DI VPS:\n$(git log --format='  %h  %an  %ad  %s' --date=format:'%d-%m %H:%M' "$LAST_HEAD..$HEAD" 2>/dev/null)\n\n"
fi
if [ -n "$DIRTY" ] && [ "$DIRTY_SIG" != "$LAST_DIRTY" ]; then
  PESAN+="⚠️ ADA FILE DIUBAH LANGSUNG DI VPS TANPA COMMIT (rawan bertabrakan / tertimpa):\n$DIRTY\n\n$(git diff --stat | tail -15)\n\n"
fi
if [ "$GITHUB" != "?" ] && [ "$HEAD" != "$GITHUB" ] && [ "$SYNC_SIG" != "$LAST_SYNC" ]; then
  if git merge-base --is-ancestor HEAD origin/main 2>/dev/null; then
    PESAN+="VPS TERTINGGAL dari GitHub (GitHub $GITHUB, VPS $HEAD) — ada perubahan di GitHub yang belum di-deploy:\n$(git log --format='  %h  %an  %s' HEAD..origin/main)\n\n"
  elif git merge-base --is-ancestor origin/main HEAD 2>/dev/null; then
    PESAN+="GITHUB TERTINGGAL dari VPS (VPS $HEAD, GitHub $GITHUB) — commit di VPS belum di-push ke GitHub:\n$(git log --format='  %h  %an  %s' origin/main..HEAD)\n\n"
  else
    PESAN+="⚠️ VPS DAN GITHUB BERCABANG (VPS $HEAD, GitHub $GITHUB) — perlu digabung manual sebelum deploy berikutnya.\n\n"
  fi
fi

echo "$HEAD" > "$STATE/last_head"
echo "$DIRTY_SIG" > "$STATE/last_dirty"
echo "$SYNC_SIG" > "$STATE/last_sync"

if [ -n "$PESAN" ]; then
  PESAN+="Status saat ini → VPS: $HEAD | GitHub: $GITHUB\nPanduan menyamakan: lihat AGENTS.md bagian 2 & CATATAN_PERUBAHAN.md di root project."
  node "$REPO/scripts/kirim-pengingat.mjs" "[LARAS] Ada perubahan project di VPS" "$(printf '%b' "$PESAN")"
fi
