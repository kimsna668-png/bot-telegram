import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocketIO(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // Client can join a room for a specific transaction
    socket.on('watch_payment', (transactionRef: string) => {
      socket.join(`payment:${transactionRef}`);
    });

    socket.on('disconnect', () => {
      // Clean up
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}
