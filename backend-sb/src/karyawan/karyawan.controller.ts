import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { KaryawanService } from './karyawan.service.js';
import { CreateKaryawanDto } from './dto/create-karyawan.dto.js';
import { UpdateKaryawanDto } from './dto/update-karyawan.dto.js';
import { JwtWebGuard } from '../common/guards/jwt-web.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

@ApiTags('Karyawan')
@ApiBearerAuth()
@UseGuards(JwtWebGuard, RolesGuard)
@Controller('karyawan')
export class KaryawanController {
  constructor(private readonly karyawanService: KaryawanService) {}

  @Post()
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Buat karyawan baru' })
  create(@Body() dto: CreateKaryawanDto) {
    return this.karyawanService.create(dto);
  }

  @Get()
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil semua karyawan' })
  findAll(@Request() req) {
    const userRole = req.user.role;
    // Assuming jwt-web.strategy includes idDepartemen in the payload and req.user
    // Wait, we need to make sure jwt-web.strategy actually includes idDepartemen!
    const idDepartemen = req.user.idDepartemen;
    return this.karyawanService.findAll(userRole, idDepartemen);
  }

  @Get(':id')
  @Roles('Admin', 'HRD', 'SPV')
  @ApiOperation({ summary: 'Ambil karyawan berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.karyawanService.findOne(id);
  }

  @Patch(':id')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Update data karyawan' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKaryawanDto,
  ) {
    return this.karyawanService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  @ApiOperation({ summary: 'Hapus karyawan' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.karyawanService.remove(id);
  }

  @Patch(':id/approve-reset')
  @Roles('HRD')
  @ApiOperation({ summary: 'Approve request lupa password dari karyawan' })
  approveReset(@Param('id', ParseIntPipe) id: number) {
    return this.karyawanService.update(id, { resetPasswordStatus: 'approved' });
  }

  @Post(':id/foto-wajah')
  @Roles('Admin', 'HRD')
  @ApiOperation({ summary: 'Upload foto wajah referensi karyawan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: './uploads/foto-wajah',
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(new Error('Hanya file gambar yang diizinkan'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadFotoWajah(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const karyawan = await this.karyawanService.findOne(id);
    karyawan.fotoWajahReferensi = file.path;
    await this.karyawanService.saveEntity(karyawan);
    return { message: 'Foto wajah berhasil diupload', path: file.path };
  }
}
