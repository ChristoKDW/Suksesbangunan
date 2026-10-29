import { PenggajianService } from './penggajian.service';
import { PengajuanIzinService } from '../pengajuan-izin/pengajuan-izin.service';

describe('Hari kerja payroll berbasis jadwal', () => {
  const makeService = (jadwal: { tanggal: string; isLibur: boolean; sumberUpload?: string }[]) =>
    new PenggajianService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { findByKaryawanAndPeriode: jest.fn().mockResolvedValue(jadwal) } as any,
    );

  const hitung = (service: PenggajianService, liburSet = new Set<string>()) =>
    (service as any).hitungHariKerjaJadwal(1, '2026-09-25', '2026-10-24', 26, liburSet);

  it('tanggal tanpa jadwal tetap dihitung hari kerja kalender (jadwal sebagian)', async () => {
    // Hanya 2 hari dijadwalkan, sisanya kosong → tetap 26 hari kerja (Sen–Sab)
    const service = makeService([
      { tanggal: '2026-09-25', isLibur: false },
      { tanggal: '2026-09-26', isLibur: false },
    ]);
    await expect(hitung(service)).resolves.toEqual({ hariKerja: 26, hariPenting: 0 });
  });

  it('libur di jadwal mengurangi hari kerja, shift di hari Minggu menambah', async () => {
    const service = makeService([
      { tanggal: '2026-09-28', isLibur: true }, // Senin libur (off rutin)
      { tanggal: '2026-09-27', isLibur: false }, // Minggu masuk shift
    ]);
    // 26 - 1 (off Senin) + 1 (Minggu masuk); hari penting 2026-10-01 tetap hari kerja dibayar
    await expect(hitung(service, new Set(['2026-10-01']))).resolves.toEqual({
      hariKerja: 26,
      hariPenting: 1,
    });
  });

  it('hari penting HRD dibayar hanya bila tanggal itu hari kerja karyawan', async () => {
    const service = makeService([
      { tanggal: '2026-10-01', isLibur: true, sumberUpload: 'hari_penting' }, // jadwal ditimpa HRD
      { tanggal: '2026-10-02', isLibur: true, sumberUpload: 'regular_off' }, // memang off
    ]);
    // 26 - 1 (off 2 Okt); 1 Okt tetap hari kerja; Minggu 4 Okt tidak dihitung
    await expect(
      hitung(service, new Set(['2026-10-01', '2026-10-02', '2026-10-04'])),
    ).resolves.toEqual({ hariKerja: 25, hariPenting: 1 });
  });
});

describe('Saldo cuti tahunan', () => {
  const makeService = (izin: any[], karyawan: any, pencairan: any[] = []) => {
    const qb: any = {
      where: () => qb,
      andWhere: () => qb,
      getMany: jest.fn().mockResolvedValue(izin),
      getOne: jest.fn().mockResolvedValue(null),
    };
    return new PengajuanIzinService(
      { createQueryBuilder: () => qb, save: jest.fn() } as any,
      { find: jest.fn().mockResolvedValue([]) } as any,
      {} as any,
      {} as any,
      { findOne: jest.fn().mockResolvedValue(karyawan) } as any,
      {} as any,
      {} as any,
      { query: jest.fn().mockResolvedValue(pencairan) } as any,
    );
  };

  it('pencairan cuti (diuangkan) ikut memotong jatah', async () => {
    const service = makeService([], { hakCuti: true, jatahCuti: 12 }, [
      { status: 'disetujui', hari: '3' },
      { status: 'menunggu_hrd', hari: '1' },
    ]);
    await expect(service.getSaldoCuti(7, 2099)).resolves.toMatchObject({
      terpakai: 3,
      menunggu: 1,
      dicairkan: 3,
      sisa: 8,
    });
  });

  it('jatah dikurangi cuti disetujui & menunggu (tanpa hari libur tetap Minggu)', async () => {
    const service = makeService(
      [
        // Sen 5 – Sab 10 Okt 2099 = 6 hari kerja
        { status: 'disetujui', tanggalMulai: '2099-10-05', tanggalSelesai: '2099-10-10' },
        // Sab 17 – Sen 19 Okt (Minggu 18 tidak dihitung) = 2 hari
        { status: 'menunggu_hrd', tanggalMulai: '2099-10-17', tanggalSelesai: '2099-10-19' },
      ],
      { hakCuti: true, jatahCuti: 12 },
    );
    await expect(service.getSaldoCuti(7, 2099)).resolves.toMatchObject({
      jatah: 12,
      terpakai: 6,
      menunggu: 2,
      sisa: 4,
    });
  });

  it('menolak pengajuan cuti yang melebihi sisa jatah', async () => {
    const karyawan = { idKaryawan: 7, hakCuti: true, jatahCuti: 3, departemen: { pengelola: [] } };
    const service = makeService([], karyawan);
    await expect(
      service.submitIzin({
        idKaryawan: 7,
        jenisIzin: 'cuti',
        tanggalMulai: '2099-10-05',
        tanggalSelesai: '2099-10-08',
        alasan: 'Liburan keluarga',
      }),
    ).rejects.toThrow('Sisa cuti tahun 2099 hanya 3 hari');
  });
});
