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

  it('marks approved cuti weekdays as paid cuti and skips Sundays', async () => {
    const saved: any[] = [];
    const jadwalRepo = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({
          idJadwal: 1,
          idKaryawan: 7,
          idShift: 3,
          isCuti: false,
          isLibur: false,
        })
        .mockResolvedValueOnce(null),
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
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await (service as any).upsertCutiSchedules(
      {
        idIzin: 12,
        idKaryawan: 7,
        tanggalMulai: '2026-10-03',
        tanggalSelesai: '2026-10-05',
      },
      4,
    );

    expect(saved).toHaveLength(2);
    expect(jadwalRepo.findOne).toHaveBeenCalledTimes(2);
    expect(saved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          idShift: null,
          isCuti: true,
          isLibur: false,
          sumberUpload: 'pengajuan_cuti',
        }),
      ]),
    );
  });
});
