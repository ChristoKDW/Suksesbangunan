/**
 * Helper Smart/AI Name Matcher untuk mencocokkan Nama Lengkap Karyawan dengan Pengguna Sistem (User).
 * Mendukung normalisasi case-insensitive, penghapusan gelar akademik/keagamaan/kehormatan (S.E, S.Kom, Hj, Dr, dll),
 * serta pencocokan token nama secara cerdas.
 */

export function cleanNameTokens(name: string): string[] {
  if (!name) return [];
  const titles = new Set([
    'se', 's.e', 's.e.', 'skom', 's.kom', 'spd', 's.pd', 'sh', 's.h',
    'st', 's.t', 'ssos', 's.sos', 'mm', 'm.m', 'mkom', 'm.kom',
    'mba', 'm.ba', 'h', 'h.', 'hj', 'hj.', 'dr', 'dr.', 'drs', 'drs.',
    'dra', 'dra.', 'prof', 'prof.',
  ]);
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0 && !titles.has(t));
}

export function matchUserName(karyawanName: string, userName: string): boolean {
  if (!karyawanName || !userName) return false;
  const kTokens = cleanNameTokens(karyawanName);
  const uTokens = cleanNameTokens(userName);
  if (kTokens.length === 0 || uTokens.length === 0) return false;

  const kStr = kTokens.join(' ');
  const uStr = uTokens.join(' ');
  if (kStr === uStr) return true;

  // Filter kata utama (panjang > 1) untuk pencocokan multi-kata dengan inisial
  // Contoh: user "RAYNALDI PUTRA. R" vs karyawan "RAYNALDI PUTRA RAHMAT"
  const kWords = kTokens.filter((t) => t.length > 1);
  const uWords = uTokens.filter((t) => t.length > 1);

  if (kWords.length >= 2 && uWords.length >= 2) {
    if (uWords.every((w) => kWords.includes(w))) {
      return true;
    }
    if (kWords.every((w) => uWords.includes(w))) {
      return true;
    }
  }

  // Jika nama user memiliki >= 2 kata dan semua katanya terdapat di nama karyawan
  if (uTokens.length >= 2 && uTokens.every((t) => kTokens.includes(t))) {
    return true;
  }

  if (kTokens.length >= 2 && kTokens.every((t) => uTokens.includes(t))) {
    return true;
  }

  // Untuk nama 1 kata, harus tepat sama
  // Contoh: "HERMAN" == "HERMAN", tapi "SUHERMAN" != "HERMAN"
  if (uTokens.length === 1 && kTokens.length === 1 && uTokens[0] === kTokens[0]) {
    return true;
  }

  return false;
}
