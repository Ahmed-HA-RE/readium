import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Notification } from '@repo/types';
import { Logger } from '@nestjs/common';

import { Server, Socket } from 'socket.io';
import { auth } from '../../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

@WebSocketGateway({
  cors: {
    origin: [process.env.APP_BACKEND_URL, process.env.APP_FRONTEND_URL],
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  private readonly Logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    try {
      const headers = fromNodeHeaders(client.handshake.headers);
      const session = await auth.api.getSession({ headers });

      if (!session) {
        client.disconnect();
        return;
      }

      await client.join(`user:${session.user.id}`);

      this.Logger.log(`New client connected: ${session.user.id}`);
    } catch {
      client.disconnect();
    }
  }

  sendNotification(payload: Notification) {
    this.server.to(`user:${payload.recipientId}`).emit('notification', payload);
  }
}
