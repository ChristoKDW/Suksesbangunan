import { api } from './api';
import type { PengajuanRo } from './types-ro';

export const regularOffApi = {
  getForSpv: (): Promise<PengajuanRo[]> => api.get('regular-off/pengajuan/spv'),
  getForHrd: (): Promise<PengajuanRo[]> => api.get('regular-off/pengajuan/hrd'),
  respondSpv: (id: number, data: { setuju: boolean; catatan?: string }): Promise<PengajuanRo> =>
    api.patch(`regular-off/pengajuan/${id}/approval-spv`, data),
  respondHrd: (id: number, data: { setuju: boolean; catatan?: string }): Promise<PengajuanRo> =>
    api.patch(`regular-off/pengajuan/${id}/approval-hrd`, data),
};
