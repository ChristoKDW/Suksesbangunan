import { ForbiddenException } from '@nestjs/common';
import { PertukaranJadwalService } from './pertukaran-jadwal.service';

describe('PertukaranJadwalService authorization', () => {
  it('allows only exchange participants to load a mobile detail', async () => {
    const service = new PertukaranJadwalService(
      {
        findOne: jest.fn().mockResolvedValue({
          idPertukaran: 5,
          idKaryawanPemohon: 10,
          idKaryawanTarget: 11,
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(service.findOne(5, 10)).resolves.toMatchObject({
      idPertukaran: 5,
    });
    await expect(service.findOne(5, 99)).rejects.toThrow(ForbiddenException);
  });
});
