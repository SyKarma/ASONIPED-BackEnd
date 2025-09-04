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
    if (socket.isAnonymous) {
      console.log(`🔌 Anonymous user connected with socket ID: ${socket.id}`);
    } else {
      console.log(`🔌 User ${socket.userId} connected with socket ID: ${socket.id}`);
      console.log(`🔌 User role: ${socket.userRole}`);
    }

    // Join ticket room (for authenticated users)
    socket.on('join_ticket_room', (ticketId: number) => {
      const roomName = `ticket_${ticketId}`;
      socket.join(roomName);
      if (socket.isAnonymous) {
        console.log(`🎫 Anonymous user joined room: ${roomName}`);
      } else {
        console.log(`🎫 User ${socket.userId} joined room: ${roomName}`);
      }
      console.log(`🎫 Room members:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
    });

    // Join anonymous ticket room (for anonymous users)
    socket.on('join_anonymous_ticket_room', (ticketId: string) => {
      const roomName = `anonymous_ticket_${ticketId}`;
      socket.join(roomName);
      socket.anonymousTicketId = ticketId;
      console.log(`🎫 Anonymous user joined room: ${roomName}`);
      console.log(`🎫 Room members:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
    });

    // Leave ticket room
    socket.on('leave_ticket_room', (ticketId: number) => {
      const roomName = `ticket_${ticketId}`;
      socket.leave(roomName);
      if (socket.isAnonymous) {
        console.log(`Anonymous user left room: ${roomName}`);
      } else {
        console.log(`User ${socket.userId} left room: ${roomName}`);
      }
    });

    // Leave anonymous ticket room
    socket.on('leave_anonymous_ticket_room', (ticketId: string) => {
      const roomName = `anonymous_ticket_${ticketId}`;
      socket.leave(roomName);
      socket.anonymousTicketId = undefined;
      console.log(`Anonymous user left room: ${roomName}`);
    });

    // Handle new message for regular tickets
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

    // Handle new message for anonymous tickets
    socket.on('new_anonymous_message', (data: { ticketId: string; message: any }) => {
      console.log(`📨 New anonymous message received for ticket ${data.ticketId}:`, data.message);
      const roomName = `anonymous_ticket_${data.ticketId}`;
      console.log(`📡 Broadcasting to room: ${roomName}`);
      
      // Broadcast to ALL users in the room (including sender for real-time feedback)
      io.to(roomName).emit('anonymous_message_received', {
        ...data.message,
        timestamp: new Date().toISOString()
      });
      console.log(`✅ Anonymous message broadcasted to room ${roomName}`);
      console.log(`👥 Room members:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      if (socket.isAnonymous) {
        console.log(`Anonymous user disconnected`);
      } else {
        console.log(`User ${socket.userId} disconnected`);
      }
    });
  });

  return io;
}
