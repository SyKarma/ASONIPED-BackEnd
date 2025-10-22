import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from './middleware/auth.middleware';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
  isAnonymous?: boolean;
  anonymousTicketId?: string;
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
      
      // Handle anonymous users (no token required)
      if (!token) {
        socket.isAnonymous = true;
        return next();
      }

      const decoded = await verifyToken(token);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.isAnonymous = false;
      next();
    } catch (error) {
      // Allow anonymous connections
      socket.isAnonymous = true;
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {

    // Join ticket room (for authenticated users)
    socket.on('join_ticket_room', (ticketId: number) => {
      const roomName = `ticket_${ticketId}`;
      socket.join(roomName);
    });

    // Join anonymous ticket room (for anonymous users)
    socket.on('join_anonymous_ticket_room', (ticketId: string) => {
      const roomName = `anonymous_ticket_${ticketId}`;
      socket.join(roomName);
      socket.anonymousTicketId = ticketId;
    });

    // Leave ticket room
    socket.on('leave_ticket_room', (ticketId: number) => {
      const roomName = `ticket_${ticketId}`;
      socket.leave(roomName);
    });

    // Leave anonymous ticket room
    socket.on('leave_anonymous_ticket_room', (ticketId: string) => {
      const roomName = `anonymous_ticket_${ticketId}`;
      socket.leave(roomName);
      socket.anonymousTicketId = undefined;
    });

    // Handle new message for regular tickets
    socket.on('new_message', (data: { ticketId: number; message: any }) => {
      const roomName = `ticket_${data.ticketId}`;
      socket.to(roomName).emit('message_received', {
        ...data.message,
        timestamp: new Date().toISOString()
      });
    });

    // Handle new message for anonymous tickets
    socket.on('new_anonymous_message', (data: { ticketId: string; message: any }) => {
      const roomName = `anonymous_ticket_${data.ticketId}`;
      
      // Broadcast to ALL users in the room (including sender for real-time feedback)
      io.to(roomName).emit('anonymous_message_received', {
        ...data.message,
        timestamp: new Date().toISOString()
      });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      // User disconnected
    });
  });

  return io;
}
