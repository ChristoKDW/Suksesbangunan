import { PengajuanIzinService } from './pengajuan-izin.service';

describe('PengajuanIzinService cuti schedules', () => {
  it('rejects a reversed leave range before persistence', async () => {
    const izinRepo = { save: jest.fn() };
    const service = new PengajuanIzinService(
      izinRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {
        findOne: jest.fn().mockResolvedValue({
          idKaryawan: 7,
          hakCuti: true,
          departemen: { pengelola: [] },
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.submitIzin({
        idKaryawan: 7,
        jenisIzin: 'cuti',
        tanggalMulai: '2099-10-02',
        tanggalSelesai: '2099-10-01',
        alasan: 'Cuti',
      }),
    ).rejects.toThrow('Tanggal mulai tidak boleh setelah tanggal selesai');
    expect(izinRepo.save).not.toHaveBeenCalled();
  });

  it('returns no status-filtered requests for an SPV without a department', async () => {
    const izinRepo = { createQueryBuilder: jest.fn() };
    const service = new PengajuanIzinService(
      izinRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.findByStatus('menunggu_spv', { role: 'SPV' }),
    ).resolves.toEqual([]);
    expect(izinRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('cuti operasional mengikuti jadwal: Minggu yang ada shift ikut cuti, hari off (Rabu) tetap libur', async () => {
    const saved: any[] = [];
    const jadwalRows = [
      { idKaryawan: 7, tanggal: '2026-11-01', idShift: 3, isCuti: false, isLibur: false }, // Minggu, shift Pagi
      { idKaryawan: 7, tanggal: '2026-11-04', idShift: null, isCuti: false, isLibur: true }, // Rabu, off fleksibel
    ];
    const jadwalRepo = {
      find: jest.fn().mockResolvedValue(jadwalRows),
      findOne: jest.fn(async ({ where }: any) => jadwalRows.find((j) => j.tanggal === where.tanggal) ?? null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => {
        saved.push({ ...value });
        return value;
      }),
    };
    const service = new PengajuanIzinService(
      {} as any,
      jadwalRepo as any,
      {} as any,
      {} as any,
      {
        findOne: jest.fn().mockResolvedValue({
          idKaryawan: 7,
          hariLibur: 'Minggu',
          departemen: { pengelola: [{ role: 'SPV' }] },
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any,
    );

    // Sab 31 Okt – Rab 4 Nov 2026
    await (service as any).upsertCutiSchedules(
      { idIzin: 12, idKaryawan: 7, tanggalMulai: '2026-10-31', tanggalSelesai: '2026-11-04' },
      4,
    );

    const tanggalCuti = saved.map((j) => j.tanggal).sort();
    expect(tanggalCuti).toEqual(['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03']);
    expect(saved.every((j) => j.isCuti && j.sumberUpload === 'pengajuan_cuti')).toBe(true);
  });

  it('karyawan kantor tanpa jadwal: hari Minggu tetap libur, tidak menjadi cuti', async () => {
    const service = new PengajuanIzinService(
      {} as any,
      { find: jest.fn().mockResolvedValue([]) } as any,
      {} as any,
      {} as any,
      {
        findOne: jest.fn().mockResolvedValue({
          idKaryawan: 8,
          hariLibur: 'Minggu',
          departemen: { pengelola: [{ role: 'HRD' }] },
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const hari = await (service as any).hariKerjaCuti(8, '2026-10-31', '2026-11-02');
    expect(hari).toEqual(['2026-10-31', '2026-11-02']);
  });
});
