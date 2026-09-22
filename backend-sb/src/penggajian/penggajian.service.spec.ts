import { BadRequestException } from '@nestjs/common';
import { PenggajianService } from './penggajian.service';

describe('PenggajianService payroll integrity', () => {
  const makeService = (payroll: Record<string, unknown> | null) => {
    const penggajianRepo = {
      findOne: jest.fn().mockResolvedValue(payroll),
      save: jest.fn(async (value) => value),
    };
    const service = new PenggajianService(
      penggajianRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    return { service, penggajianRepo };
  };

  it('rejects regeneration when an exact-period payroll is already paid', async () => {
    const { service, penggajianRepo } = makeService({
      idGaji: 10,
      tanggalBayar: new Date('2026-09-25'),
      karyawan: { nama: 'Budi' },
    });

    await expect(service.generate('2026-08-25', '2026-09-24')).rejects.toThrow(
      BadRequestException,
    );
    expect(penggajianRepo.save).not.toHaveBeenCalled();
  });

  it('preserves other deductions during edit recalculation', async () => {
    const payroll = {
      idGaji: 11,
      tanggalBayar: null,
      gajiPokokSesuaiHari: 3000000,
      tunjanganKonsumsi: 400000,
      tunjanganTransportasi: 200000,
      tunjanganKomunikasi: 100000,
      tunjanganJabatan: 300000,
      lembur: 0,
      potonganBpjs: 100000,
      potonganTerlambat: 40000,
      potonganPinjaman: 250000,
      potonganLainnya: 75000,
    };
    const { service, penggajianRepo } = makeService(payroll);

    const saved = await service.update(11, { lembur: 50000 });

    expect(saved.potongan).toBe(465000);
    expect(saved.totalPenghasilan).toBe(4050000);
    expect(saved.totalGaji).toBe(3585000);
    expect(penggajianRepo.save).toHaveBeenCalledWith(payroll);
  });

  it('rejects edits after a payroll is paid', async () => {
    const { service, penggajianRepo } = makeService({
      idGaji: 12,
      tanggalBayar: new Date('2026-09-25'),
    });

    await expect(service.update(12, { lembur: 1 })).rejects.toThrow(
      'sudah difinalisasi/dibayar',
    );
    expect(penggajianRepo.save).not.toHaveBeenCalled();
  });

  it('uses full WITA boundaries and excludes Sunday cuti defensively', async () => {
    const penggajianRepo = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const absensiService = {
      findByKaryawanDanPeriode: jest.fn().mockResolvedValue([]),
    };
    const jadwalKerjaService = {
      findByKaryawanAndPeriode: jest.fn().mockResolvedValue([]),
      findCutiByKaryawanAndPeriode: jest
        .fn()
        .mockResolvedValue([
          { tanggal: '2026-09-27' },
          { tanggal: '2026-09-28' },
        ]),
    };
    const service = new PenggajianService(
      penggajianRepo as any,
      {
        findOne: jest.fn().mockResolvedValue({
          dendaPerTelatDefault: 20000,
        }),
      } as any,
      { find: jest.fn().mockResolvedValue([]) } as any,
      {
        findAllAktif: jest.fn().mockResolvedValue([
          {
            idKaryawan: 7,
            hakCuti: true,
            gajiPokok: 2600000,
          },
        ]),
      } as any,
      absensiService as any,
      jadwalKerjaService as any,
    );

    const [saved] = await service.generate('2026-08-25', '2026-09-28');

    expect(absensiService.findByKaryawanDanPeriode).toHaveBeenCalledWith(
      7,
      new Date('2026-08-24T16:00:00.000Z'),
      new Date('2026-09-28T15:59:59.999Z'),
    );
    expect(
      jadwalKerjaService.findCutiByKaryawanAndPeriode,
    ).toHaveBeenCalledWith(7, '2026-08-25', '2026-09-28');
    expect(saved.totalJamKerja).toBe(8);
    expect(saved.catatan).toContain('1 Hari Cuti Tahunan');
  });
});
