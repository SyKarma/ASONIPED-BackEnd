import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from './middleware/auth.middleware';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
  isAnonymous?: boolean;
  anonymousTicketId?: string;
}

export function setupSocketIO(httpServer: HTTPServer) {
  // Build allowed origins for Socket.io
  const allowedOrigins: string[] = [];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
    // Add common variations
    const url = new URL(process.env.FRONTEND_URL);
    if (!url.hostname.startsWith('www.')) {
      allowedOrigins.push(`https://www.${url.hostname}`);
    }
  }
  
  // In development, allow localhost
  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push("http://localhost:5173", "http://localhost:3000");
  }
  
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    const authSocket = socket as AuthenticatedSocket;
    try {
      const token = (socket.handshake as any).auth?.token;
      
      // Handle anonymous users (no token required)
      if (!token) {
        authSocket.isAnonymous = true;
        return next();
      }

      const decoded = await verifyToken(token);
      authSocket.userId = decoded.userId;
      authSocket.userRole = decoded.role;
      authSocket.isAnonymous = false;
      next();
    } catch (error) {
      // Allow anonymous connections
      authSocket.isAnonymous = true;
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;

    // Join ticket room (for authenticated users)
    authSocket.on('join_ticket_room', (ticketId: number) => {
      const roomName = `ticket_${ticketId}`;
      authSocket.join(roomName);
    });

    // Join anonymous ticket room (for anonymous users)
    authSocket.on('join_anonymous_ticket_room', (ticketId: string) => {
      const roomName = `anonymous_ticket_${ticketId}`;
      authSocket.join(roomName);
      authSocket.anonymousTicketId = ticketId;
    });

    // Leave ticket room
    authSocket.on('leave_ticket_room', (ticketId: number) => {
      const roomName = `ticket_${ticketId}`;
      authSocket.leave(roomName);
    });

    // Leave anonymous ticket room
    authSocket.on('leave_anonymous_ticket_room', (ticketId: string) => {
      const roomName = `anonymous_ticket_${ticketId}`;
      authSocket.leave(roomName);
      authSocket.anonymousTicketId = undefined;
    });

    // Handle new message for regular tickets
    authSocket.on('new_message', (data: { ticketId: number; message: any }) => {
      const roomName = `ticket_${data.ticketId}`;
      io.to(roomName).emit('message_received', {
        ...data.message,
        timestamp: new Date().toISOString()
      });
    });

    // Handle new message for anonymous tickets
    authSocket.on('new_anonymous_message', (data: { ticketId: string; message: any }) => {
      const roomName = `anonymous_ticket_${data.ticketId}`;
      
      // Broadcast to ALL users in the room (including sender for real-time feedback)
      io.to(roomName).emit('anonymous_message_received', {
        ...data.message,
        timestamp: new Date().toISOString()
      });
    });

    // Disconnect handling
    authSocket.on('disconnect', () => {
      // User disconnected
    });
  });

  return io;
}
