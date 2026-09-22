import { PenggajianController } from './penggajian.controller';

describe('PenggajianController generation parameters', () => {
  it('keeps optional overrides omitted and preserves an explicit zero', () => {
    const service = { generate: jest.fn() };
    const controller = new PenggajianController(service as any);

    controller.generate('2026-08-25', '2026-09-24');
    expect(service.generate).toHaveBeenLastCalledWith(
      '2026-08-25',
      '2026-09-24',
      undefined,
      undefined,
      undefined,
    );

    controller.generate('2026-08-25', '2026-09-24', '0', '', '');
    expect(service.generate).toHaveBeenLastCalledWith(
      '2026-08-25',
      '2026-09-24',
      0,
      undefined,
      undefined,
    );
  });
});
