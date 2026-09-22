import * as titimangsa from '@sangkan-dev/titimangsa';
import Holidays from 'date-holidays';

export interface HolidayItem {
  date: string; // YYYY-MM-DD
  localName: string;
  name?: string;
  type: 'national_holiday' | 'collective_leave';
  isNationalHoliday: boolean;
  isCollectiveLeave: boolean;
}

const hd = new Holidays('ID');

/**
 * Mendapatkan semua hari libur nasional & cuti bersama resmi Indonesia untuk SEMUA tahun (masa lalu, sekarang, dan masa depan).
 */
export function getIndonesianHolidays(year: number): HolidayItem[] {
  // 1. Jika tahun tersedia di dataset resmi SKB 3 Menteri titimangsa (misal 2025, 2026), gunakan data lengkap resmi beserta cuti bersama
  try {
    if (titimangsa.hasDataset(year)) {
      const holidays = titimangsa.getHolidays(year);
      return holidays.map((h: any) => ({
        date: h.date,
        localName: h.localName,
        name: h.name,
        type: h.type as 'national_holiday' | 'collective_leave',
        isNationalHoliday: h.isNationalHoliday,
        isCollectiveLeave: h.isCollectiveLeave,
      }));
    }
  } catch (err) {
    console.warn(
      `[Titimangsa] Gagal membaca dataset libur nasional tahun ${year}:`,
      err,
    );
  }

  // 2. Untuk tahun lainnya (2020..2024, 2027, 2028, 2029, 2030, dll.), gunakan engine date-holidays yang mengkalkulasi kalender Hijriah, Imlek, Nyepi, Waisak, Paskah, dan Masehi secara otomatis
  try {
    const list = hd.getHolidays(year) || [];
    const dateMap = new Map<string, HolidayItem>();

    for (const h of list) {
      const dateStr = String(h.date).substring(0, 10);
      const isPublic = h.type === 'public';

      if (isPublic) {
        const existing = dateMap.get(dateStr);
        if (existing) {
          if (!existing.localName.includes(h.name)) {
            existing.localName = `${existing.localName} & ${h.name}`;
          }
        } else {
          dateMap.set(dateStr, {
            date: dateStr,
            localName: h.name,
            name: h.name,
            type: 'national_holiday',
            isNationalHoliday: isPublic,
            isCollectiveLeave: false,
          });
        }
      }
    }

    const results = Array.from(dateMap.values());
    results.sort((a, b) => a.date.localeCompare(b.date));
    return results;
  } catch (err) {
    console.error(
      `[date-holidays] Gagal mengkalkulasi libur tahun ${year}:`,
      err,
    );
  }

  // 3. Fallback fixed annual national holidays
  const fixedHolidays = [
    { monthDay: '01-01', localName: 'Tahun Baru Masehi' },
    { monthDay: '05-01', localName: 'Hari Buruh Internasional' },
    { monthDay: '06-01', localName: 'Hari Lahir Pancasila' },
    { monthDay: '08-17', localName: 'Hari Proklamasi Kemerdekaan RI' },
    { monthDay: '12-25', localName: 'Hari Raya Natal' },
  ];

  return fixedHolidays.map((f) => ({
    date: `${year}-${f.monthDay}`,
    localName: f.localName,
    name: f.localName,
    type: 'national_holiday',
    isNationalHoliday: true,
    isCollectiveLeave: false,
  }));
}

/**
 * Cek apakah suatu tanggal (YYYY-MM-DD) merupakan hari libur nasional atau cuti bersama resmi untuk semua tahun.
 */
export function checkIndonesianHoliday(dateStr: string): HolidayItem | null {
  if (!dateStr) return null;
  const year = parseInt(dateStr.split('-')[0], 10);
  if (isNaN(year)) return null;

  const holidays = getIndonesianHolidays(year);
  const found = holidays.find((h) => h.date === dateStr);
  return found || null;
}
