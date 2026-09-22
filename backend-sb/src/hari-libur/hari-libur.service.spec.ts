import { HariLiburService } from './hari-libur.service';

describe('HariLiburService schedule protection', () => {
  it.each([
    { isCuti: true, sumberUpload: 'pengajuan_cuti' },
    { isCuti: false, sumberUpload: 'regular_off' },
    { isCuti: false, sumberUpload: 'pertukaran_jadwal' },
  ])(
    'preserves approved $sumberUpload schedules',
    async (protectedSchedule) => {
      const jadwalRepo = {
        findOne: jest.fn().mockResolvedValue({
          idJadwal: 1,
          ...protectedSchedule,
        }),
        save: jest.fn(),
      };
      const service = new HariLiburService(
        {} as any,
        {
          find: jest.fn().mockResolvedValue([
            {
              idKaryawan: 7,
              statusAktif: 'aktif',
              departemen: { pengelola: [{ role: 'SPV' }] },
            },
          ]),
        } as any,
        jadwalRepo as any,
        {} as any,
        {} as any,
      );

      const count = await (service as any).applyHolidayToAllSchedules(
        '2026-09-25',
        'Hari Libur',
        true,
        null,
        4,
      );

      expect(count).toBe(0);
      expect(jadwalRepo.save).not.toHaveBeenCalled();
    },
  );
});
