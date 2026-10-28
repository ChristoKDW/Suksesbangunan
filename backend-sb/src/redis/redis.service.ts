import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST') || '127.0.0.1';
    const port = Number(this.configService.get<number>('REDIS_PORT')) || 6379;
    const password = this.configService.get<string>('REDIS_PASSWORD');

    const redisOptions: any = {
      host,
      port,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times: number) => {
        if (times > 5) {
          this.logger.warn(`Redis connection retry limit reached (${times}).`);
          return null;
        }
        return Math.min(times * 500, 2000);
      },
    };

    if (password) {
      redisOptions.password = password;
    }

    this.client = new Redis(redisOptions);
    this.subscriber = new Redis(redisOptions);

    this.client.connect().then(() => {
      this.isConnected = true;
      this.logger.log(`Redis connected successfully to ${host}:${port}`);
    }).catch((err) => {
      this.logger.warn(`Redis connection error (fallback mode enabled): ${err.message}`);
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis client error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    try {
      if (this.client) await this.client.quit();
      if (this.subscriber) await this.subscriber.quit();
    } catch {
      // Ignore disconnect error
    }
  }

  getClient(): Redis {
    return this.client;
  }

  /**
   * Catat heartbeat pengguna ke Redis dengan TTL (standar: 25 detik)
   */
  async setHeartbeat(
    username: string,
    platform: string,
    meta: Record<string, any> = {},
    ttlSeconds = 25,
  ): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      const key = `laras:heartbeat:${platform.toLowerCase()}:${username.toLowerCase()}`;
      const payload = JSON.stringify({
        username,
        platform,
        lastSeen: new Date().toISOString(),
        ...meta,
      });
      await this.client.set(key, payload, 'EX', ttlSeconds);
      return true;
    } catch (e: any) {
      this.logger.warn(`Failed to set Redis heartbeat: ${e.message}`);
      return false;
    }
  }

  /**
   * Hapus heartbeat pengguna dari Redis secara instan
   */
  async removeHeartbeat(username: string, platform?: string): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      if (platform) {
        const key = `laras:heartbeat:${platform.toLowerCase()}:${username.toLowerCase()}`;
        await this.client.del(key);
      } else {
        // Hapus dari semua platform
        const keys = await this.client.keys(`laras:heartbeat:*:${username.toLowerCase()}`);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      }
      return true;
    } catch (e: any) {
      this.logger.warn(`Failed to remove Redis heartbeat: ${e.message}`);
      return false;
    }
  }

  /**
   * Periksa apakah pengguna memiliki heartbeat aktif di Redis
   */
  async isHeartbeatActive(username: string, platform?: string): Promise<boolean> {
    if (!this.isConnected) return true; // Fallback jika redis offline
    try {
      if (platform) {
        const key = `laras:heartbeat:${platform.toLowerCase()}:${username.toLowerCase()}`;
        const exists = await this.client.exists(key);
        return exists === 1;
      }
      const keys = await this.client.keys(`laras:heartbeat:*:${username.toLowerCase()}`);
      return keys.length > 0;
    } catch {
      return true;
    }
  }

  /**
   * Ambil seluruh username yang saat ini memiliki heartbeat aktif di Redis
   */
  async getActiveUsernames(platform?: string): Promise<string[]> {
    if (!this.isConnected) return [];
    try {
      const pattern = platform
        ? `laras:heartbeat:${platform.toLowerCase()}:*`
        : `laras:heartbeat:*:*`;
      const keys = await this.client.keys(pattern);
      return keys.map((k) => k.split(':').pop() || '');
    } catch {
      return [];
    }
  }

  /**
   * Publish pesan ke Redis PubSub channel
   */
  async publish(channel: string, message: any): Promise<number> {
    if (!this.isConnected) return 0;
    try {
      const str = typeof message === 'string' ? message : JSON.stringify(message);
      return await this.client.publish(channel, str);
    } catch (e: any) {
      this.logger.warn(`Redis publish error: ${e.message}`);
      return 0;
    }
  }
}
