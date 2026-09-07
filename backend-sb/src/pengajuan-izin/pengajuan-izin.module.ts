import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PengajuanIzin } from './entities/pengajuan-izin.entity.js';
import { PengajuanIzinService } from './pengajuan-izin.service.js';
import { PengajuanIzinController } from './pengajuan-izin.controller.js';
import { PengaturanKantorModule } from '../pengaturan-kantor/pengaturan-kantor.module.js';
import { KaryawanModule } from '../karyawan/karyawan.module.js';
import { AbsensiModule } from '../absensi/absensi.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PengajuanIzin]),
    PengaturanKantorModule,
    KaryawanModule,
    forwardRef(() => AbsensiModule),
  ],
  controllers: [PengajuanIzinController],
  providers: [PengajuanIzinService],
  exports: [PengajuanIzinService],
})
export class PengajuanIzinModule {}
