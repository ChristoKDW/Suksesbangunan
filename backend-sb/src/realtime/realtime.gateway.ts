import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/realtime',
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers['authorization'] as string)?.replace(/^Bearer\s+/i, '') ||
        client.handshake.query?.token;

      if (!token || typeof token !== 'string') {
        // Izinkan koneksi publik sementara atau tunggu otentikasi
        return;
      }

      let payload: any;
      try {
        payload = this.jwtService.decode(token);
      } catch {
        return;
      }

      if (payload) {
        const username = (payload.username || payload.nama || 'unknown').toLowerCase();
        const role = payload.role || 'user';
        const platform = payload.type || payload.platform || (payload.isSuperAdmin ? 'superadmin' : 'web');

        client.data.user = {
          idUser: payload.idUser || payload.sub,
          username,
          role,
          platform,
        };

        // Bergabung ke room personal & role
        client.join(`room:user:${username}`);
        client.join(`room:role:${role.toLowerCase()}`);

        if (payload.isSuperAdmin || role === 'SUPER_ADMIN' || role === 'Super Admin') {
          client.join('room:superadmin');
        }

        // Catat heartbeat awal di Redis
        await this.redisService.setHeartbeat(username, platform, {
          role,
          socketId: client.id,
        });

        this.logger.log(`[WebSocket] Connected: @${username} (${platform}) [Socket: ${client.id}]`);

        // Siarkan status online ke Super Admin panel
        this.server.to('room:superadmin').emit('user_status_changed', {
          username,
          platform,
          isOnline: true,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      this.logger.warn(`[WebSocket] Connection error: ${err.message}`);
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data?.user;
    if (user && user.username) {
      this.logger.log(`[WebSocket] Disconnected: @${user.username} (${user.platform})`);
      // Hapus heartbeat dari Redis
      await this.redisService.removeHeartbeat(user.username, user.platform);

      // Siarkan status offline ke Super Admin panel
      this.server.to('room:superadmin').emit('user_status_changed', {
        username: user.username,
        platform: user.platform,
        isOnline: false,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Listener Heartbeat dari browser / mobile klien
   */
  @SubscribeMessage('client:heartbeat')
  async handleClientHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { platform?: string; meta?: any },
  ) {
    const user = client.data?.user;
    if (user && user.username) {
      const platform = data?.platform || user.platform || 'web';
      await this.redisService.setHeartbeat(user.username, platform, {
        socketId: client.id,
        ...data?.meta,
      });

      return {
        status: 'ok',
        acknowledgedAt: new Date().toISOString(),
      };
    }
    return { status: 'unauthenticated' };
  }

  /**
   * Emit paksa logout ke user tertentu secara instan
   */
  emitForceLogout(username: string, reason = 'Sesi Anda telah diputuskan oleh Super Administrator') {
    const targetRoom = `room:user:${username.toLowerCase()}`;
    this.logger.warn(`[WebSocket] Emitting force logout to ${targetRoom}`);
    this.server.to(targetRoom).emit('session_kicked', {
      username,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast pembaruan umum ke Super Admin panel
   */
  broadcastToSuperAdmin(event: string, payload: any) {
    this.server.to('room:superadmin').emit(event, payload);
  }
}
