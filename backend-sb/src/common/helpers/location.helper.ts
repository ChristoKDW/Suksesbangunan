import { Injectable } from '@nestjs/common';

@Injectable()
export class LocationHelper {
  /**
   * Menghitung jarak antara dua koordinat GPS menggunakan rumus Haversine.
   * @returns jarak dalam meter
   */
  hitungJarakMeter(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000; // radius bumi dalam meter
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Cek apakah koordinat berada dalam radius kantor.
   */
  dalamRadiusKantor(
    lat: number,
    lng: number,
    kantorLat: number,
    kantorLng: number,
    radiusMeter: number,
  ): boolean {
    const jarak = this.hitungJarakMeter(lat, lng, kantorLat, kantorLng);
    return jarak <= radiusMeter;
  }
}
