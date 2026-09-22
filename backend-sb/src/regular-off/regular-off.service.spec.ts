import { BadRequestException } from '@nestjs/common';
import { allocateRoBalances, RegularOffService } from './regular-off.service';
import { SaldoRo } from './entities/saldo-ro.entity';

const balance = (
  idSaldoRo: number,
  tanggalPerolehan: string,
  tanggalKadaluarsa: string,
) =>
  ({
    idSaldoRo,
    tanggalPerolehan,
    tanggalKadaluarsa,
  }) as SaldoRo;

describe('Regular Off allocation', () => {
  it('uses the earliest-expiring balance that can legally cover each date', () => {
    const allocated = allocateRoBalances(
      [
        balance(1, '2026-09-01', '2026-12-01'),
        balance(2, '2026-08-17', '2026-11-17'),
      ],
      ['2026-09-30', '2026-10-05'],
    );

    expect(allocated.map((item) => item.idSaldoRo)).toEqual([2, 1]);
  });

  it('allows use on the expiry date but not in the acquisition month', () => {
    expect(
      allocateRoBalances(
        [balance(1, '2026-08-17', '2026-11-17')],
        ['2026-11-17'],
      ),
    ).toHaveLength(1);
    expect(() =>
      allocateRoBalances(
        [balance(1, '2026-08-17', '2026-11-17')],
        ['2026-08-31'],
      ),
    ).toThrow(BadRequestException);
  });

  it('returns no supervisor requests when the SPV has no department', async () => {
    const pengajuanRepo = { createQueryBuilder: jest.fn() };
    const service = new RegularOffService(
      {} as any,
      pengajuanRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.getPengajuanForSpv({ idUser: 9, role: 'SPV' }),
    ).resolves.toEqual([]);
    expect(pengajuanRepo.createQueryBuilder).not.toHaveBeenCalled();
  });
});
