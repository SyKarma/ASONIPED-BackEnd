import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Database connection
import { db } from '../src/db';

// Socket.io setup
import { setupSocketIO } from './socket';

// Middleware
import { authenticateToken } from '../src/middleware/auth.middleware';

// Route imports
import userRoutes from './routes/user/user.routes';
import volunteerRoutes from './routes/volunteer/volunteer_forms.routes';
import volunteerOptionRoutes from './routes/volunteer/volunteer_options.routes';
import donationRoutes from './routes/donations/donation.routes';
import eventsNewsRoutes from './routes/Events/eventsNews.routes';
import attendanceRoutes from './routes/attendance/attendance.routes';
import workshopRoutes from './routes/workshop/workshop.routes';
import enrollmentRoutes from './routes/workshop/enrollment.routes';
import recordRoutes from './routes/records/record.routes';
import recordDocumentRoutes from './routes/records/document.routes';
import donationTicketRoutes from './routes/donations/donation_ticket.routes';
import ticketMessageRoutes from './routes/donations/ticket_message.routes';
import anonymousTicketRoutes from './routes/donations/anonymous_ticket.routes';

// Load environment variables
dotenv.config();

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Setup Socket.io
const io = setupSocketIO(server);

// Middleware configuration
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.json());
app.use(cors());

// Root endpoint
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Health check endpoint for automatic detection
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Backend is running correctly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Debug endpoint for ticket system diagnostics
app.get('/debug/tickets', async (req, res) => {
  try {
    // Check if tables exist and get row counts
    const [donationsCount] = await db.execute('SELECT COUNT(*) as count FROM donations') as [any[], any];
    const [ticketsCount] = await db.execute('SELECT COUNT(*) as count FROM donation_tickets') as [any[], any];
    const [messagesCount] = await db.execute('SELECT COUNT(*) as count FROM ticket_messages') as [any[], any];
    
    res.json({
      donations: donationsCount[0],
      tickets: ticketsCount[0],
      messages: messagesCount[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug tickets:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Legacy admin login endpoint (deprecated - use /users/login instead)
app.post('/admin-login', async (req, res): Promise<void> => {
  const { username, password } = req.body;
  
  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]) as [any[], any];
    
    if (Array.isArray(rows) && rows.length === 0) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    
    const admin = rows[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    
    const token = jwt.sign(
      { username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error during login' });
  }
});

// API Routes
// Note: Individual route protection is handled within each route file
app.use('/users', userRoutes);
app.use('/volunteers', volunteerRoutes);
app.use('/volunteer-options', volunteerOptionRoutes);
app.use('/donations', donationRoutes);
app.use('/events-news', eventsNewsRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/workshops', workshopRoutes);
app.use('/enrollments', enrollmentRoutes);
app.use('/records', recordRoutes);
app.use('/donation-tickets', donationTicketRoutes);
app.use('/ticket-messages', ticketMessageRoutes);
app.use('/anonymous-tickets', anonymousTicketRoutes);

// Temporarily disabled - uncomment when needed
// app.use('/records', recordDocumentRoutes);

// Database connection and server startup
const startServer = async (): Promise<void> => {
  try {
    await db.getConnection();
    console.log('✅ MySQL connection successful!');
    
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.io server is ready for real-time chat`);
    });
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    process.exit(1);
  }
};

// Start the server
startServer();