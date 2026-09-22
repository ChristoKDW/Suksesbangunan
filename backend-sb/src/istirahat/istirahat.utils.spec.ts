import {
  hitungDurasiIstirahat,
  hitungKelebihanIstirahat,
} from './istirahat.utils';

describe('istirahat utils', () => {
  it('marks any duration beyond 60 minutes as excess', () => {
    const duration = hitungDurasiIstirahat(
      new Date('2026-09-23T09:00:00+08:00'),
      new Date('2026-09-23T10:00:01+08:00'),
    );

    expect(duration).toBe(61);
    expect(hitungKelebihanIstirahat(duration)).toBe(1);
  });

  it('keeps a 60 minute break within the normal limit', () => {
    expect(hitungKelebihanIstirahat(60)).toBe(0);
  });
});
