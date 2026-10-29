import { PencairanService } from './pencairan.service';
import { PengajuanPencairan } from './entities/pengajuan-pencairan.entity';
import { SaldoRo } from '../regular-off/entities/saldo-ro.entity';
import { Karyawan } from '../karyawan/entities/karyawan.entity';

describe('PencairanService', () => {
  const setup = (pengajuan: Partial<PengajuanPencairan>, saldo: Partial<SaldoRo>[] = []) => {
    const saved: any[] = [];
    const repos = new Map<any, any>([
      [
        PengajuanPencairan,
        {
          findOne: jest.fn().mockResolvedValue(pengajuan),
          save: jest.fn(async (p) => p),
        },
      ],
      [Karyawan, { findOne: jest.fn().mockResolvedValue({ idKaryawan: 7, idDepartemen: 2, nama: 'Budi' }) }],
      [
        SaldoRo,
        {
          find: jest.fn().mockResolvedValue(saldo),
          save: jest.fn(async (s) => saved.push(...s)),
          update: jest.fn(),
        },
      ],
    ]);
    const manager = { getRepository: (e: any) => repos.get(e) };
    const service = new PencairanService(
      { findOne: jest.fn().mockResolvedValue({ ...pengajuan, karyawan: { nama: 'Budi' } }) } as any,
      {} as any,
      { find: jest.fn().mockResolvedValue([]) } as any,
      { transaction: (fn: any) => fn(manager) } as any,
      { createNotification: jest.fn() } as any,
      {} as any,
    );
    return { service, repos, saved };
  };

  it('SPV tidak dapat memproses pengajuan departemen lain', async () => {
    const { service } = setup({ idPencairan: 1, idKaryawan: 7, status: 'menunggu_spv', jenis: 'cuti', jumlahHari: 1 });
    await expect(
      service.approval(1, { idUser: 9, role: 'SPV', idDepartemen: 3 }, { setuju: true }),
    ).rejects.toThrow('departemen Anda');
  });

  it('HRD menyetujui pencairan RO → saldo terkunci menjadi digunakan', async () => {
    const p = { idPencairan: 1, idKaryawan: 7, status: 'menunggu_hrd' as const, jenis: 'ro' as const, jumlahHari: 2 };
    const { service, saved } = setup(p, [
      { idSaldoRo: 1, status: 'diajukan' },
      { idSaldoRo: 2, status: 'diajukan' },
    ]);
    await service.approval(1, { idUser: 1, role: 'HRD' }, { setuju: true });
    expect(p.status).toBe('disetujui');
    expect(saved.map((s) => s.status)).toEqual(['digunakan', 'digunakan']);
  });

  it('HRD menolak pencairan RO → saldo dikembalikan tersedia', async () => {
    const p = { idPencairan: 1, idKaryawan: 7, status: 'menunggu_hrd' as const, jenis: 'ro' as const, jumlahHari: 1 };
    const { service, repos } = setup(p);
    await service.approval(1, { idUser: 1, role: 'HRD' }, { setuju: false });
    expect(p.status).toBe('ditolak_hrd');
    expect(repos.get(SaldoRo).update).toHaveBeenCalledWith(
      { idPencairan: 1 },
      { status: 'tersedia', idPencairan: null },
    );
  });
});
