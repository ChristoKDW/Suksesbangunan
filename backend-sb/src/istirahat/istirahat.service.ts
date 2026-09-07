import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between } from 'typeorm';
import { Istirahat } from './entities/istirahat.entity.js';
import { Absensi } from '../absensi/entities/absensi.entity.js';
import { CreateIstirahatDto } from './dto/create-istirahat.dto.js';

@Injectable()
export class IstirahatService {
  constructor(
    @InjectRepository(Istirahat)
    private readonly istirahatRepo: Repository<Istirahat>,
    @InjectRepository(Absensi)
    private readonly absensiRepo: Repository<Absensi>,
  ) {}

  private async findTodayAbsensi(idKaryawan: number): Promise<Absensi | null> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    return this.absensiRepo.findOne({
      where: {
        idKaryawan,
        jamMasukAktual: Between(todayStart, todayEnd),
      },
      order: { jamMasukAktual: 'DESC' },
    });
  }

  async mulaiIstirahat(
    dto: CreateIstirahatDto,
    idKaryawan?: number,
  ): Promise<Istirahat> {
    const tipe = dto.tipe || 'keluar';
    let idAbsensi = dto.idAbsensi;

    if (!idAbsensi && idKaryawan) {
      const today = await this.findTodayAbsensi(idKaryawan);
      if (!today) {
        throw new BadRequestException(
          'Anda belum melakukan absensi masuk hari ini',
        );
      }
      if (today.jamKeluarAktual) {
        throw new BadRequestException(
          'Anda sudah melakukan absensi keluar hari ini',
        );
      }
      idAbsensi = today.idAbsensi;
    }

    if (!idAbsensi) {
      throw new BadRequestException('ID Absensi wajib disertakan');
    }

    if (tipe === 'keluar') {
      const activeBreak = await this.istirahatRepo.findOne({
        where: {
          idAbsensi,
          jamMasukIstirahat: IsNull(),
        },
      });

      if (activeBreak) {
        throw new BadRequestException(
          'Anda sudah dalam sesi istirahat. Harap selesaikan istirahat terlebih dahulu.',
        );
      }

      const istirahat = new Istirahat();
      istirahat.idAbsensi = idAbsensi;
      istirahat.jamKeluarIstirahat = new Date();
      return this.istirahatRepo.save(istirahat);
    } else {
      const istirahat = await this.istirahatRepo.findOne({
        where: {
          idAbsensi,
          jamMasukIstirahat: IsNull(),
        },
        order: { jamKeluarIstirahat: 'DESC' },
      });

      if (!istirahat) {
        throw new BadRequestException(
          'Tidak ditemukan sesi istirahat yang sedang aktif untuk diakhiri',
        );
      }

      istirahat.jamMasukIstirahat = new Date();
      const durasi = Math.max(
        1,
        Math.round(
          (istirahat.jamMasukIstirahat.getTime() -
            istirahat.jamKeluarIstirahat.getTime()) /
            60000,
        ),
      );
      istirahat.durasiMenit = durasi;

      return this.istirahatRepo.save(istirahat);
    }
  }

  async findTodayBreakByKaryawan(idKaryawan: number) {
    const today = await this.findTodayAbsensi(idKaryawan);
    if (!today) {
      return {
        hasAbsenMasuk: false,
        idAbsensi: null,
        sedangIstirahat: false,
        aktifIstirahat: null,
        riwayat: [],
        totalDurasiMenit: 0,
      };
    }

    const list = await this.findByAbsensi(today.idAbsensi);
    const aktifIstirahat = list.find((i) => i.jamKeluarIstirahat && !i.jamMasukIstirahat);
    const totalDurasiMenit = list.reduce(
      (sum, i) => sum + (i.durasiMenit || 0),
      0,
    );

    return {
      hasAbsenMasuk: true,
      idAbsensi: today.idAbsensi,
      sedangIstirahat: !!aktifIstirahat,
      aktifIstirahat: aktifIstirahat || null,
      riwayat: list,
      totalDurasiMenit,
    };
  }

  async findAll(): Promise<Istirahat[]> {
    return this.istirahatRepo.find({ relations: { absensi: true } });
  }

  async findOne(id: number): Promise<Istirahat> {
    const istirahat = await this.istirahatRepo.findOne({
      where: { idIstirahat: id },
      relations: { absensi: true },
    });
    if (!istirahat) {
      throw new NotFoundException(
        `Istirahat dengan ID ${id} tidak ditemukan`,
      );
    }
    return istirahat;
  }

  async findByAbsensi(idAbsensi: number): Promise<Istirahat[]> {
    return this.istirahatRepo.find({
      where: { idAbsensi },
      order: { jamKeluarIstirahat: 'ASC' },
    });
  }

  async remove(id: number): Promise<void> {
    const istirahat = await this.findOne(id);
    await this.istirahatRepo.remove(istirahat);
  }
}
