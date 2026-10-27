import { ConflictException } from '@nestjs/common';
import { AturanPengajuanService } from './aturan-pengajuan.service';

describe('Aturan pengajuan', () => {
  const make = (opts: { maks?: number; terpakai?: number; spvUsers?: string[] } = {}) =>
    new AturanPengajuanService(
      { findOne: jest.fn().mockResolvedValue(opts.maks === undefined ? null : { maksPerBulan: opts.maks }) } as any,
      {} as any,
      { find: jest.fn().mockResolvedValue((opts.spvUsers ?? []).map((nama) => ({ nama, role: 'SPV' }))) } as any,
      { query: jest.fn().mockResolvedValue([{ count: String(opts.terpakai ?? 0) }]) } as any,
    );

  it('memblokir pengajuan izin yang melewati batas per bulan (409)', async () => {
    const service = make({ maks: 2, terpakai: 2 });
    await expect(service.cekBatas(1, 'izin', '2026-11-10')).rejects.toThrow(ConflictException);
    await expect(service.cekBatas(1, 'izin', '2026-11-10')).rejects.toThrow(
      'Anda sudah melakukan pengajuan Izin sebanyak 2x pada bulan November 2026 (batas 2x per bulan).',
    );
  });

  it('batas 0 = tanpa batas', async () => {
    await expect(make({ maks: 0, terpakai: 99 }).cekBatas(1, 'tukar_shift', '2026-11-10')).resolves.toBeUndefined();
  });

  it('pemohon SPV langsung ke HRD, staf departemen ber-SPV ke SPV, kantor ke HRD', async () => {
    const service = make({ spvUsers: ['Nurul Wahyuni'] });
    const dept = (role: string) => ({ pengelola: [{ role }] });
    await expect(service.statusAwal({ nama: 'Nurul Wahyuni', departemen: dept('SPV') } as any)).resolves.toBe('menunggu_hrd');
    await expect(service.statusAwal({ nama: 'Budi', jabatan: { namaJabatan: 'Leader Gudang' }, departemen: dept('SPV') } as any)).resolves.toBe('menunggu_hrd');
    await expect(service.statusAwal({ nama: 'Christo', departemen: dept('SPV') } as any)).resolves.toBe('menunggu_spv');
    await expect(service.statusAwal({ nama: 'Andi', departemen: dept('HRD') } as any)).resolves.toBe('menunggu_hrd');
  });
});
