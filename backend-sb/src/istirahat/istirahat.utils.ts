export const BATAS_ISTIRAHAT_MENIT = 60;

export function hitungDurasiIstirahat(jamKeluar: Date, jamMasuk: Date): number {
  return Math.max(
    1,
    Math.ceil((jamMasuk.getTime() - jamKeluar.getTime()) / 60000),
  );
}

export function hitungKelebihanIstirahat(durasiMenit: number): number {
  return Math.max(0, durasiMenit - BATAS_ISTIRAHAT_MENIT);
}
