import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from './middleware/auth.middleware';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
}

interface Socket {
  id: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: Function) => void;
  disconnect: () => void;
}

export function setupSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = await verifyToken(token);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 User ${socket.userId} connected with socket ID: ${socket.id}`);
    console.log(`🔌 User role: ${socket.userRole}`);

    // Join ticket room
    socket.on('join_ticket_room', (ticketId: number) => {
      const roomName = `ticket_${ticketId}`;
      socket.join(roomName);
      console.log(`🎫 User ${socket.userId} joined room: ${roomName}`);
      console.log(`🎫 Room members:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
    });

    // Leave ticket room
    socket.on('leave_ticket_room', (ticketId: number) => {
      const roomName = `ticket_${ticketId}`;
      socket.leave(roomName);
      console.log(`User ${socket.userId} left room: ${roomName}`);
    });

    // Handle new message
    socket.on('new_message', (data: { ticketId: number; message: any }) => {
      console.log(`📨 New message received for ticket ${data.ticketId}:`, data.message);
      const roomName = `ticket_${data.ticketId}`;
      console.log(`📡 Broadcasting to room: ${roomName}`);
      socket.to(roomName).emit('message_received', {
        ...data.message,
        timestamp: new Date().toISOString()
      });
      console.log(`✅ Message broadcasted to room ${roomName}`);
    });



    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
}
