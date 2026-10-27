import { KebijakanLiburService } from './kebijakan-libur.service';

describe('Kebijakan Tanggal Merah', () => {
  const make = (pengaturan: any, overrides: any[] = []) =>
    new KebijakanLiburService(
      {
        find: jest.fn().mockResolvedValue(overrides),
        findOne: jest.fn(async ({ where }: any) => overrides.find((o) => o.tanggal === where.tanggal) ?? null),
      } as any,
      { findOne: jest.fn().mockResolvedValue(pengaturan) } as any,
    );

  it('default: libur nasional = tanggal merah, cuti bersama = hari kerja biasa', async () => {
    const service = make(null);
    const merah = await service.tanggalMerahDalamRentang('2026-02-15', '2026-02-18');
    expect(merah.has('2026-02-17')).toBe(true); // Tahun Baru Imlek
    expect(merah.has('2026-02-16')).toBe(false); // Cuti Bersama Imlek → masuk kerja, tanpa RO
    await expect(service.tanggalMerah('2026-02-16')).resolves.toBeNull();
    await expect(service.tanggalMerah('2026-02-17')).resolves.toMatchObject({ jenis: 'libur_nasional' });
  });

  it('pengecualian per tanggal & default perusahaan bisa diubah', async () => {
    const service = make(
      { kebijakanLiburNasional: 'libur', kebijakanCutiBersama: 'libur' },
      [{ tanggal: '2026-02-17', perlakuan: 'kerja' }],
    );
    const merah = await service.tanggalMerahDalamRentang('2026-02-15', '2026-02-18');
    expect(merah.has('2026-02-16')).toBe(true); // cuti bersama diliburkan (default diubah)
    expect(merah.has('2026-02-17')).toBe(false); // Imlek dijadikan hari kerja khusus
  });

  it('daftar setahun menandai sumber default/khusus', async () => {
    const service = make(null, [{ tanggal: '2026-01-01', perlakuan: 'kerja' }]);
    const { daftar } = await service.daftar(2026);
    expect(daftar.find((d) => d.tanggal === '2026-01-01')).toMatchObject({ perlakuan: 'kerja', sumber: 'khusus' });
    expect(daftar.find((d) => d.tanggal === '2026-02-16')).toMatchObject({ jenis: 'cuti_bersama', perlakuan: 'kerja', sumber: 'default' });
  });
});
