import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Absensi } from '../absensi/entities/absensi.entity.js';
import { PengajuanIzin } from '../pengajuan-izin/entities/pengajuan-izin.entity.js';
import { Penggajian } from '../penggajian/entities/penggajian.entity.js';
import { Karyawan } from '../karyawan/entities/karyawan.entity.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Absensi)
    private readonly absensiRepo: Repository<Absensi>,
    @InjectRepository(PengajuanIzin)
    private readonly pengajuanIzinRepo: Repository<PengajuanIzin>,
    @InjectRepository(Penggajian)
    private readonly penggajianRepo: Repository<Penggajian>,
    @InjectRepository(Karyawan)
    private readonly karyawanRepo: Repository<Karyawan>,
  ) {}

  async exportKehadiran(res: Response, periodeBulan: string, departemen: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Kehadiran');

    worksheet.columns = [
      { header: 'ID Absensi', key: 'id', width: 10 },
      { header: 'Nama Karyawan', key: 'nama', width: 25 },
      { header: 'Departemen', key: 'departemen', width: 20 },
      { header: 'Jam Masuk', key: 'jamMasuk', width: 20 },
      { header: 'Jam Keluar', key: 'jamKeluar', width: 20 },
      { header: 'Status Kehadiran', key: 'status', width: 20 },
      { header: 'Metode', key: 'metode', width: 15 },
    ];

    // parse YYYY-MM
    let startDate: Date;
    let endDate: Date;
    if (periodeBulan && periodeBulan !== 'undefined') {
      startDate = new Date(`${periodeBulan}-01T00:00:00Z`);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const absensiRecords = await this.absensiRepo.find({
      where: {
        jamMasukAktual: Between(startDate, endDate),
      },
      relations: { karyawan: { departemen: true } },
      order: {
        jamMasukAktual: 'ASC',
      },
    });

    const filtered = departemen && departemen !== 'all' 
      ? absensiRecords.filter(a => a.karyawan?.idDepartemen === Number(departemen))
      : absensiRecords;

    filtered.forEach((a) => {
      worksheet.addRow({
        id: a.idAbsensi,
        nama: a.karyawan?.nama || '-',
        departemen: a.karyawan?.departemen?.namaDepartemen || '-',
        jamMasuk: a.jamMasukAktual ? new Date(a.jamMasukAktual).toLocaleString() : '-',
        jamKeluar: a.jamKeluarAktual ? new Date(a.jamKeluarAktual).toLocaleString() : '-',
        status: a.statusKehadiran || '-',
        metode: a.metodeAbsen || '-',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Laporan_Kehadiran.xlsx');

    return workbook.xlsx.write(res);
  }

  async exportCutiIzin(res: Response, rentangWaktu: string, statusApproval: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Cuti & Izin');

    worksheet.columns = [
      { header: 'ID Izin', key: 'id', width: 10 },
      { header: 'Nama Karyawan', key: 'nama', width: 25 },
      { header: 'Jenis Izin', key: 'jenis', width: 15 },
      { header: 'Tanggal Mulai', key: 'mulai', width: 15 },
      { header: 'Tanggal Selesai', key: 'selesai', width: 15 },
      { header: 'Alasan', key: 'alasan', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    let query: any = {};
    if (statusApproval && statusApproval !== 'Semua Status') {
       query.status = statusApproval.toLowerCase();
    }

    const records = await this.pengajuanIzinRepo.find({
      where: query,
      relations: { karyawan: true },
      order: {
        tanggalMulai: 'DESC',
      },
    });

    records.forEach((r) => {
      worksheet.addRow({
        id: r.idIzin,
        nama: r.karyawan?.nama || '-',
        jenis: r.jenisIzin,
        mulai: r.tanggalMulai,
        selesai: r.tanggalSelesai,
        alasan: r.alasan,
        status: r.status,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Laporan_Cuti_Izin.xlsx');

    return workbook.xlsx.write(res);
  }

  async exportPenggajian(res: Response, periode: string, grup: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Penggajian');

    worksheet.columns = [
      { header: 'ID Gaji', key: 'id', width: 10 },
      { header: 'Nama Karyawan', key: 'nama', width: 25 },
      { header: 'Periode Awal', key: 'awal', width: 15 },
      { header: 'Periode Akhir', key: 'akhir', width: 15 },
      { header: 'Total Jam', key: 'jam', width: 15 },
      { header: 'Gaji Pokok', key: 'pokok', width: 15 },
      { header: 'Potongan', key: 'potongan', width: 15 },
      { header: 'Total Bersih', key: 'total', width: 15 },
    ];

    // Filter by periode (format YYYY-MM)
    let query: any = {};
    if (periode && periode !== 'undefined') {
      const startDate = `${periode}-01`;
      query.periodeAwal = startDate;
    }

    const records = await this.penggajianRepo.find({
      where: query,
      relations: { karyawan: true },
      order: {
        idGaji: 'DESC',
      },
    });

    records.forEach((r) => {
      worksheet.addRow({
        id: r.idGaji,
        nama: r.karyawan?.nama || '-',
        awal: r.periodeAwal,
        akhir: r.periodeAkhir,
        jam: r.totalJamKerja || 0,
        pokok: r.gajiPokok,
        potongan: r.potongan,
        total: r.totalGaji,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Laporan_Penggajian.xlsx');

    return workbook.xlsx.write(res);
  }
}
