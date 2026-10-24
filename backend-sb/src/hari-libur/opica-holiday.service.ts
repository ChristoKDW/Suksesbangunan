import { Injectable, Logger } from '@nestjs/common';
import { getIndonesianHolidays } from './indonesia-holidays.util.js';

export interface CalendarEventItem {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'libur_nasional' | 'cuti_bersama' | 'hari_nasional' | 'company_holiday';
  category?: string;
  description?: string | null;
  isLibur: boolean;
}

interface CacheEntry {
  timestamp: number;
  data: CalendarEventItem[];
}

@Injectable()
export class OpicaHolidayService {
  private readonly logger = new Logger(OpicaHolidayService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 jam

  /**
   * Mengambil daftar hari libur nasional, cuti bersama, dan hari peringatan nasional dari API Opica (app.opica.id).
   * Dilengkapi in-memory caching dan fallback otomatis ke library Titimangsa / Date-Holidays jika API eksternal offline.
   */
  async getEvents(year: number, month?: number): Promise<CalendarEventItem[]> {
    const cacheKey = `${year}-${month || 'all'}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    const events: CalendarEventItem[] = [];

    // 1. Fetch Libur Nasional & Cuti Bersama dari Opica
    try {
      const monthQuery = month ? `&month=${month}` : '';
      const urlLibur = `https://app.opica.id/api-libur/api?year=${year}${monthQuery}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const resLibur = await fetch(urlLibur, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (resLibur.ok) {
        const json = await resLibur.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          for (const item of json.data) {
            const hDate = item.holiday_date;
            if (!hDate) continue;
            const isCuti = item.holiday_type === 'cuti_bersama';
            events.push({
              date: hDate,
              name: item.description || (isCuti ? 'Cuti Bersama' : 'Libur Nasional'),
              type: isCuti ? 'cuti_bersama' : 'libur_nasional',
              category: 'nasional',
              description: item.description || null,
              isLibur: true,
            });
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Gagal fetch Opica Libur Nasional (${year}): ${err?.message || err}. Menggunakan fallback lokal.`);
    }

    // Fallback jika Opica libur nasional kosong atau gagal: gunakan dataset titimangsa / date-holidays
    if (events.filter((e) => e.isLibur).length === 0) {
      try {
        const fallbackList = getIndonesianHolidays(year);
        for (const f of fallbackList) {
          if (month) {
            const m = parseInt(f.date.substring(5, 7), 10);
            if (m !== month) continue;
          }
          events.push({
            date: f.date,
            name: f.localName,
            type: f.isCollectiveLeave ? 'cuti_bersama' : 'libur_nasional',
            category: 'nasional',
            description: f.isCollectiveLeave ? 'Cuti Bersama Resmi' : 'Hari Libur Nasional Resmi',
            isLibur: true,
          });
        }
      } catch (fbErr) {
        this.logger.error(`Fallback libur lokal gagal:`, fbErr);
      }
    }

    // 2. Fetch Hari Peringatan Nasional dari Opica
    try {
      const monthQuery = month ? `&month=${month}` : '';
      const urlNasional = `https://app.opica.id/api-libur/api/hari-nasional?year=${year}${monthQuery}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const resNasional = await fetch(urlNasional, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (resNasional.ok) {
        const json = await resNasional.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          for (const item of json.data) {
            const d = item.date;
            if (!d) continue;
            // Hindari duplikasi jika nama atau tanggalnya sama persis dengan libur nasional
            const alreadyExists = events.some(
              (e) => e.date === d && e.name.toLowerCase() === (item.name || '').toLowerCase(),
            );
            if (!alreadyExists) {
              events.push({
                date: d,
                name: item.name,
                type: 'hari_nasional',
                category: item.category || 'nasional',
                description: item.description || null,
                isLibur: Boolean(item.is_public_holiday),
              });
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Gagal fetch Opica Hari Nasional (${year}): ${err?.message || err}.`);
    }

    // Urutkan berdasarkan tanggal ASC
    events.sort((a, b) => a.date.localeCompare(b.date));

    // Simpan di cache
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data: events,
    });

    return events;
  }
}
