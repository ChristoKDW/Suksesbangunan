import {
  addCalendarMonths,
  businessDateOf,
  businessDayRange,
  businessToday,
  dateRange,
  isSunday,
  normalizeDateOnly,
} from './business-date.util';

describe('business date utilities', () => {
  it('uses the WITA business date and validates date-only ranges', () => {
    expect(businessToday(new Date('2026-09-22T16:30:00.000Z'))).toBe(
      '2026-09-23',
    );
    expect(businessDateOf(new Date('2026-09-24T16:30:00.000Z'))).toBe(
      '2026-09-25',
    );
    expect(dateRange('2026-09-29', '2026-10-01')).toEqual([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
    ]);
    expect(() => normalizeDateOnly('2026-02-30')).toThrow(
      'Tanggal tidak valid',
    );
  });

  it('builds full WITA query boundaries without losing period edges', () => {
    const range = businessDayRange('2026-08-25', '2026-09-24');
    expect(range.start.toISOString()).toBe('2026-08-24T16:00:00.000Z');
    expect(range.end.toISOString()).toBe('2026-09-24T15:59:59.999Z');
    expect(businessDateOf(range.start)).toBe('2026-08-25');
    expect(businessDateOf(range.end)).toBe('2026-09-24');
  });

  it('detects Sundays from business date-only values', () => {
    expect(isSunday('2026-09-27')).toBe(true);
    expect(isSunday('2026-09-28')).toBe(false);
  });

  it('clamps three-month expiry to the last valid calendar day', () => {
    expect(addCalendarMonths('2026-11-30', 3)).toBe('2027-02-28');
  });
});
