import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('user_log')
export class UserLog {
  @PrimaryGeneratedColumn({ name: 'id_log' })
  idLog: number;

  @Index()
  @Column({ name: 'id_user', type: 'int', nullable: true })
  idUser: number | null;

  @Index()
  @Column({ name: 'id_karyawan', type: 'int', nullable: true })
  idKaryawan: number | null;

  @Column({ name: 'nama', type: 'varchar', length: 150 })
  nama: string;

  @Index()
  @Column({ name: 'username', type: 'varchar', length: 100 })
  username: string;

  @Column({ name: 'role', type: 'varchar', length: 50 })
  role: string;

  @Index()
  @Column({ name: 'platform', type: 'varchar', length: 30 }) // 'web' | 'mobile' | 'superadmin'
  platform: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 50, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'device_info', type: 'varchar', length: 150, nullable: true })
  deviceInfo: string | null;

  @Index()
  @Column({ name: 'is_online', type: 'boolean', default: true })
  isOnline: boolean;

  @CreateDateColumn({ name: 'login_at' })
  loginAt: Date;

  @Column({ name: 'last_active_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActiveAt: Date;

  @Column({ name: 'logout_at', type: 'timestamp', nullable: true })
  logoutAt: Date | null;

  @Column({ name: 'session_token', type: 'varchar', length: 255, nullable: true })
  sessionToken: string | null;
}
