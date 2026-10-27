import { KasbonService } from './kasbon.service';

describe('KasbonService potongan otomatis payroll', () => {
  const make = (kasbon: any[], cicilan: any[]) =>
    new KasbonService(
      { find: jest.fn().mockResolvedValue(kasbon) } as any,
      {
        find: jest.fn(async ({ where }: any) =>
          cicilan.filter((c) => {
            // Not(excludeIdGaji) → FindOperator dengan _value
            const ex = where.idGaji?._value;
            return ex === undefined || c.idGaji !== ex;
          }),
        ),
      } as any,
      {} as any,
      {} as any,
    );

  const kasbon = (id: number, jumlah: number, cicilan: number, mulai = '2026-10') => ({
    idKasbon: id,
    idKaryawan: 1,
    jumlah,
    cicilanPerBulan: cicilan,
    mulaiPeriode: mulai,
    status: 'aktif',
  });

  it('memotong cicilan per bulan dan menghitung sisa', async () => {
    const service = make([kasbon(1, 1_500_000, 500_000)], [
      { idKasbon: 1, idGaji: 10, nominal: 500_000 },
    ]);
    await expect(service.rencanaCicilan(1, '2026-11-24', 4_000_000)).resolves.toMatchObject({
      adaKasbon: true,
      total: 500_000,
      sisaSetelah: 500_000,
    });
  });

  it('cicilan terakhir hanya sebesar sisa, dan tidak membuat THP minus', async () => {
    const service = make([kasbon(1, 1_200_000, 500_000)], [
      { idKasbon: 1, idGaji: 10, nominal: 500_000 },
      { idKasbon: 1, idGaji: 11, nominal: 500_000 },
    ]);
    // sisa 200rb tapi gaji setelah potongan lain hanya 150rb
    await expect(service.rencanaCicilan(1, '2026-12-24', 150_000)).resolves.toMatchObject({
      total: 150_000,
      sisaSetelah: 50_000,
    });
  });

  it('generate ulang slip yang sama tidak memotong dua kali', async () => {
    const service = make([kasbon(1, 1_000_000, 400_000)], [
      { idKasbon: 1, idGaji: 10, nominal: 400_000 }, // slip yang sedang dihitung ulang
    ]);
    await expect(service.rencanaCicilan(1, '2026-10-24', 5_000_000, 10)).resolves.toMatchObject({
      total: 400_000,
      sisaSetelah: 600_000,
    });
  });

  it('belum dipotong sebelum bulan mulai', async () => {
    const service = make([kasbon(1, 1_000_000, 400_000, '2026-12')], []);
    await expect(service.rencanaCicilan(1, '2026-11-24', 5_000_000)).resolves.toMatchObject({
      adaKasbon: false,
      total: 0,
    });
  });
});
