import { AbsensiService } from './absensi.service';

describe('Absen pulang (zona waktu WITA)', () => {
  // Shift 08:15–16:30 WITA; absen masuk pagi ini sudah ada
  const setup = (pulangCepat: { status: string; jam_mulai: string } | null = null) => {
    const absensiHariIni: any = { idAbsensi: 1, jamKeluarAktual: null, istirahat: [] };
    const repo: any = {
      findOne: jest.fn().mockResolvedValue(absensiHariIni),
      save: jest.fn(async (a) => a),
      manager: {
        query: jest.fn(async (sql: string) =>
          sql.includes("'pulang cepat'") ? (pulangCepat ? [pulangCepat] : []) : [],
        ),
      },
    };
    const service = new AbsensiService(
      repo,
      {} as any,
      { findAll: jest.fn().mockResolvedValue([{}]) } as any,
      { findOne: jest.fn().mockResolvedValue({ statusAktif: 'aktif' }) } as any,
      {
        findByKaryawanAndTanggal: jest.fn().mockResolvedValue({
          idJadwal: 1,
          isCuti: false,
          isLibur: false,
          shift: { namaShift: 'Pagi', jamMulai: '08:15:00', jamSelesai: '16:30:00' },
        }),
      } as any,
      {} as any,
      {} as any,
    );
    jest
      .spyOn(service as any, 'cariKantorDalamRadius')
      .mockResolvedValue({ kantor: { idKantor: 1 }, jarakMeter: 5 });
    const pulang = () =>
      service.submitAbsensi({ idKaryawan: 7, lokasiLat: 0, lokasiLng: 0, metodeAbsen: 'gps', tipe: 'keluar' } as any);
    return { pulang, absensiHariIni };
  };

  afterEach(() => jest.useRealTimers());
  const jamWita = (hhmm: string) => {
    jest.useFakeTimers({ now: new Date(`2026-10-29T${hhmm}:00+08:00`), doNotFake: ['nextTick', 'setImmediate'] });
  };

  it('menolak absen pulang sebelum shift berakhir tanpa pengajuan', async () => {
    jamWita('11:44');
    await expect(setup().pulang()).rejects.toThrow('ajukan Pulang Cepat');
  });

  it('memakai WITA: 16:00 WITA (15:00 WIB) masih ditolak, 16:30 WITA diterima', async () => {
    jamWita('16:00');
    await expect(setup().pulang()).rejects.toThrow('berakhir pukul 16:30');
    jamWita('16:30');
    const { pulang, absensiHariIni } = setup();
    await pulang();
    expect(absensiHariIni.jamKeluarAktual).toBeInstanceOf(Date);
  });

  it('pulang cepat menunggu persetujuan → tetap ditolak', async () => {
    jamWita('13:00');
    await expect(setup({ status: 'menunggu_hrd', jam_mulai: '12:00' }).pulang()).rejects.toThrow(
      'masih menunggu persetujuan',
    );
  });

  it('pulang cepat disetujui → boleh absen mulai jam yang disetujui', async () => {
    jamWita('11:30');
    await expect(setup({ status: 'disetujui', jam_mulai: '12:00' }).pulang()).rejects.toThrow('mulai pukul 12:00');
    jamWita('12:05');
    const { pulang, absensiHariIni } = setup({ status: 'disetujui', jam_mulai: '12:00' });
    await pulang();
    expect(absensiHariIni.jamKeluarAktual).toBeInstanceOf(Date);
  });
});
