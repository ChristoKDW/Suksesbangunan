import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Karyawan } from './entities/karyawan.entity.js';
import { CreateKaryawanDto } from './dto/create-karyawan.dto.js';
import { UpdateKaryawanDto } from './dto/update-karyawan.dto.js';

@Injectable()
export class KaryawanService {
  constructor(
    @InjectRepository(Karyawan)
    private readonly karyawanRepo: Repository<Karyawan>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateKaryawanDto): Promise<Karyawan> {
    const existingNik = await this.karyawanRepo.findOne({
      where: { nik: dto.nik },
    });
    if (existingNik) {
      throw new ConflictException('NIK sudah digunakan');
    }

    if (dto.email) {
      const existingEmail = await this.karyawanRepo.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email sudah digunakan');
      }
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    const entity = new Karyawan();
    Object.assign(entity, dto);
    return this.karyawanRepo.save(entity);
  }

  async findAll(userRole?: string, idDepartemen?: number): Promise<Karyawan[]> {
    const where: any = {};
    if (userRole === 'SPV') {
      if (!idDepartemen) {
        return [];
      }
      where.idDepartemen = idDepartemen;
    }
    const list = await this.karyawanRepo.find({
      where,
      relations: { departemen: { pengelola: true }, jabatan: true },
    });
    if (userRole === 'SPV') {
      return list.filter((k) => {
        const managers = Array.isArray(k.departemen?.pengelola)
          ? k.departemen.pengelola
          : k.departemen?.pengelola
          ? [k.departemen.pengelola]
          : [];
        const isManagedByAdminOrHrd = managers.some(
          (m: any) => m.role === 'Admin' || m.role === 'HRD',
        );
        const deptName = k.departemen?.namaDepartemen
          ?.toLowerCase()
          .replace(/[\s\-_]/g, '');
        return !isManagedByAdminOrHrd && deptName !== 'backoffice';
      });
    }
    return list;
  }

  async findOne(id: number): Promise<Karyawan> {
    const karyawan = await this.karyawanRepo.findOne({
      where: { idKaryawan: id },
      relations: { departemen: { pengelola: true }, jabatan: true },
    });
    if (!karyawan) {
      throw new NotFoundException(
        `Karyawan dengan ID ${id} tidak ditemukan`,
      );
    }
    return karyawan;
  }

  async findByNik(nik: string): Promise<Karyawan | null> {
    return this.karyawanRepo.findOne({ where: { nik } });
  }

  async findByEmail(email: string): Promise<Karyawan | null> {
    return this.karyawanRepo.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<Karyawan | null> {
    return this.karyawanRepo.findOne({ where: { username } });
  }

  async findAllAktif(): Promise<Karyawan[]> {
    return this.karyawanRepo.find({
      where: { statusAktif: 'aktif' },
      relations: { departemen: true, jabatan: true },
    });
  }

  async update(id: number, dto: UpdateKaryawanDto): Promise<Karyawan> {
    const karyawan = await this.findOne(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(karyawan, dto);
    return this.karyawanRepo.save(karyawan);
  }

  async remove(id: number): Promise<{ message: string }> {
    const karyawan = await this.findOne(id);
    await this.dataSource.transaction(async (manager) => {
      // 1. Hapus notifikasi terkait karyawan
      await manager.query(`DELETE FROM notification WHERE id_karyawan = $1`, [id]);

      // 2. Hapus data istirahat dari absensi milik karyawan ini
      await manager.query(
        `DELETE FROM istirahat 
         WHERE id_absensi IN (SELECT id_absensi FROM absensi WHERE id_karyawan = $1)`,
        [id],
      );

      // 3. Putuskan relasi jadwal & izin pada absensi (jika ada) agar tidak melanggar constraint
      await manager.query(
        `UPDATE absensi SET id_jadwal = NULL 
         WHERE id_jadwal IN (SELECT id_jadwal FROM jadwal_kerja WHERE id_karyawan = $1)`,
        [id],
      );

      await manager.query(
        `UPDATE absensi SET id_izin = NULL 
         WHERE id_izin IN (SELECT id_izin FROM pengajuan_izin WHERE id_karyawan = $1)`,
        [id],
      );

      // 4. Hapus riwayat absensi karyawan
      await manager.query(`DELETE FROM absensi WHERE id_karyawan = $1`, [id]);

      // 5. Hapus jadwal kerja karyawan
      await manager.query(`DELETE FROM jadwal_kerja WHERE id_karyawan = $1`, [id]);

      // 6. Hapus pengajuan izin karyawan
      await manager.query(`DELETE FROM pengajuan_izin WHERE id_karyawan = $1`, [id]);

      // 7. Hapus riwayat penggajian karyawan
      await manager.query(`DELETE FROM penggajian WHERE id_karyawan = $1`, [id]);

      // 8. Hapus data master karyawan
      await manager.remove(karyawan);
    });
    return { message: 'Karyawan berhasil dihapus' };
  }

  async saveEntity(karyawan: Karyawan): Promise<Karyawan> {
    return this.karyawanRepo.save(karyawan);
  }

  /**
   * Cek apakah embedding wajah yang di-scan sudah terdaftar pada akun karyawan lain.
   * Menggunakan operator cosine distance pgvector (<=>).
   * Nilai cosine similarity = 1 - (face_embedding <=> new_embedding).
   */
  async findDuplicateFace(
    embedding: number[],
    excludeIdKaryawan: number,
    threshold: number = 0.4,
  ): Promise<{
    idKaryawan: number;
    nama: string;
    nik: string;
    similarity: number;
  } | null> {
    try {
      const vectorStr = `[${embedding.join(',')}]`;
      const result = await this.dataSource.query(
        `SELECT id_karyawan AS "idKaryawan", 
                nama, 
                nik, 
                round((1 - (face_embedding <=> $1::vector))::numeric, 4) AS similarity
         FROM karyawan
         WHERE face_embedding IS NOT NULL
           AND id_karyawan != $2
           AND (1 - (face_embedding <=> $1::vector)) >= $3
         ORDER BY (1 - (face_embedding <=> $1::vector)) DESC
         LIMIT 1`,
        [vectorStr, excludeIdKaryawan, threshold],
      );

      if (result && result.length > 0) {
        return {
          idKaryawan: Number(result[0].idKaryawan),
          nama: result[0].nama,
          nik: result[0].nik,
          similarity: Number(result[0].similarity),
        };
      }
      return null;
    } catch (err) {
      // Fallback in-memory jika query native mengalami kendala
      const allKaryawan = await this.karyawanRepo.find({
        where: {},
        select: {
          idKaryawan: true,
          nama: true,
          nik: true,
          faceEmbedding: true,
        },
      });

      for (const k of allKaryawan) {
        if (
          k.idKaryawan === excludeIdKaryawan ||
          !k.faceEmbedding ||
          !Array.isArray(k.faceEmbedding)
        ) {
          continue;
        }
        let dot = 0;
        for (let i = 0; i < embedding.length; i++) {
          dot += embedding[i] * k.faceEmbedding[i];
        }
        if (dot >= threshold) {
          return {
            idKaryawan: k.idKaryawan,
            nama: k.nama,
            nik: k.nik,
            similarity: Number(dot.toFixed(4)),
          };
        }
      }
      return null;
    }
  }
}
