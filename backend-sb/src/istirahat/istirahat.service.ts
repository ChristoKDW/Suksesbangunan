import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between, EntityManager } from 'typeorm';
import { Istirahat } from './entities/istirahat.entity.js';
import { Absensi } from '../absensi/entities/absensi.entity.js';
import { CreateIstirahatDto } from './dto/create-istirahat.dto.js';
import {
  hitungDurasiIstirahat,
  hitungKelebihanIstirahat,
} from './istirahat.utils.js';

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
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    return this.absensiRepo.findOne({
      where: {
        idKaryawan,
        jamMasukAktual: Between(todayStart, todayEnd),
      },
      order: { jamMasukAktual: 'DESC' },
    });
  }

  async mulaiIstirahat(dto: CreateIstirahatDto, idKaryawan: number) {
    const tipe = dto.tipe || 'keluar';
    if (tipe !== 'keluar' && tipe !== 'masuk') {
      throw new BadRequestException('Tipe istirahat harus keluar atau masuk');
    }

    return this.absensiRepo.manager.transaction(async (manager) => {
      const absensi = await this.findAndLockActiveAttendance(
        manager,
        idKaryawan,
        dto.idAbsensi,
      );
      const breakRepo = manager.getRepository(Istirahat);
      const activeBreak = await breakRepo.findOne({
        where: {
          idAbsensi: absensi.idAbsensi,
          jamMasukIstirahat: IsNull(),
        },
        order: { jamKeluarIstirahat: 'DESC' },
      });

      if (tipe === 'keluar') {
        if (activeBreak) {
          throw new BadRequestException(
            'Anda sudah dalam sesi istirahat. Harap selesaikan istirahat terlebih dahulu.',
          );
        }
        const istirahat = breakRepo.create({
          idAbsensi: absensi.idAbsensi,
          jamKeluarIstirahat: new Date(),
        });
        return this.withBreakStatus(await breakRepo.save(istirahat));
      }

      if (!activeBreak) {
        throw new BadRequestException(
          'Tidak ditemukan sesi istirahat yang sedang aktif untuk diakhiri',
        );
      }

      activeBreak.jamMasukIstirahat = new Date();
      activeBreak.durasiMenit = hitungDurasiIstirahat(
        activeBreak.jamKeluarIstirahat,
        activeBreak.jamMasukIstirahat,
      );
      return this.withBreakStatus(await breakRepo.save(activeBreak));
    });
  }

  private async findAndLockActiveAttendance(
    manager: EntityManager,
    idKaryawan: number,
    requestedId?: number,
  ): Promise<Absensi> {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const repo = manager.getRepository(Absensi);
    const absensi = requestedId
      ? await repo.findOne({
          where: { idAbsensi: requestedId },
          lock: { mode: 'pessimistic_write' },
        })
      : await repo.findOne({
          where: {
            idKaryawan,
            jamMasukAktual: Between(todayStart, todayEnd),
          },
          order: { jamMasukAktual: 'DESC' },
          lock: { mode: 'pessimistic_write' },
        });

    if (
      !absensi ||
      absensi.idKaryawan !== idKaryawan ||
      !absensi.jamMasukAktual ||
      absensi.jamMasukAktual < todayStart ||
      absensi.jamMasukAktual >= todayEnd
    ) {
      throw new BadRequestException(
        'Absensi tidak ditemukan atau bukan absensi aktif Anda hari ini',
      );
    }
    if (absensi.jamKeluarAktual) {
      throw new BadRequestException(
        'Anda sudah melakukan absensi keluar hari ini',
      );
    }
    return absensi;
  }

  private withBreakStatus(istirahat: Istirahat, now = new Date()) {
    const durasiAktifMenit = istirahat.jamMasukIstirahat
      ? null
      : Math.max(
          0,
          Math.ceil(
            (now.getTime() - new Date(istirahat.jamKeluarIstirahat).getTime()) /
              60000,
          ),
        );
    const durasiMenit = istirahat.durasiMenit ?? durasiAktifMenit;
    const kelebihanMenit = hitungKelebihanIstirahat(durasiMenit || 0);
    return {
      ...istirahat,
      durasiAktifMenit,
      kelebihanMenit,
      terlambatKembali: !!istirahat.jamMasukIstirahat && kelebihanMenit > 0,
      terlambatAktif: !istirahat.jamMasukIstirahat && kelebihanMenit > 0,
    };
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
        durasiAktifMenit: 0,
        kelebihanAktifMenit: 0,
        terlambatAktif: false,
      };
    }

    const list = await this.findByAbsensi(today.idAbsensi);
    const aktifIstirahat = list.find(
      (i) => i.jamKeluarIstirahat && !i.jamMasukIstirahat,
    );
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
      durasiAktifMenit: aktifIstirahat?.durasiAktifMenit || 0,
      kelebihanAktifMenit: aktifIstirahat?.kelebihanMenit || 0,
      terlambatAktif: aktifIstirahat?.terlambatAktif || false,
    };
  }

  async findAll() {
    const list = await this.istirahatRepo.find({
      relations: { absensi: true },
    });
    return list.map((item) => this.withBreakStatus(item));
  }

  async findOne(id: number) {
    const istirahat = await this.istirahatRepo.findOne({
      where: { idIstirahat: id },
      relations: { absensi: true },
    });
    if (!istirahat) {
      throw new NotFoundException(`Istirahat dengan ID ${id} tidak ditemukan`);
    }
    return this.withBreakStatus(istirahat);
  }

  async findByAbsensi(idAbsensi: number) {
    const list = await this.istirahatRepo.find({
      where: { idAbsensi },
      order: { jamKeluarIstirahat: 'ASC' },
    });
    return list.map((item) => this.withBreakStatus(item));
  }

  async remove(id: number): Promise<void> {
    const istirahat = await this.istirahatRepo.findOne({
      where: { idIstirahat: id },
    });
    if (!istirahat) {
      throw new NotFoundException(`Istirahat dengan ID ${id} tidak ditemukan`);
    }
    await this.istirahatRepo.remove(istirahat);
  }
}
