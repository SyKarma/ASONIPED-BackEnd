import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Swagger setup
import { setupSwagger } from './config/swagger';

// Database connection
import { db } from '../src/db';

// Socket.io setup
import { setupSocketIO } from './socket';

// Middleware
import { authenticateToken } from '../src/middleware/auth.middleware';

// Route imports
import userRoutes from './modules/user/routes/user.routes';
import volunteerRoutes from './modules/volunteer/routes/volunteer_forms.routes';
import volunteerOptionRoutes from './modules/volunteer/routes/volunteer_options.routes';
import volunteerRegistrationRoutes from './modules/volunteer/routes/volunteer_registrations.routes';
import donationRoutes from './modules/donations/routes/donation.routes';
import eventsNewsRoutes from './modules/events/routes/eventsNews.routes';
import attendanceNewRoutes from './modules/attendance/routes/attendance_new.routes';
import workshopRoutes from './modules/workshop/routes/workshop.routes';
import enrollmentRoutes from './modules/workshop/routes/enrollment.routes';
import workshopEnrollmentRoutes from './modules/workshop/routes/workshop_enrollments.routes';
import recordRoutes from './modules/records/routes/record.routes';
import recordDocumentRoutes from './modules/records/routes/document.routes';
import donationTicketRoutes from './modules/donations/routes/donation_ticket.routes';
import ticketMessageRoutes from './modules/donations/routes/ticket_message.routes';
import anonymousTicketRoutes from './modules/donations/routes/anonymous_ticket.routes';
import heroSectionRoutes from './modules/landing/routes/Hero-section.routes';
import aboutSectionRoutes from './modules/landing/routes/About-section.routes';
import LandingDonacionesComponent  from './modules/landing/routes/landing-donaciones-component.routes';
import LandingDonacionesCard  from './modules/landing/routes/landing-donaciones-card.routes';
import uploadRoutes from './modules/landing/routes/upload.routes';
import landingVolunteerRoutes from './modules/landing/routes/landing-volunteer.routes';
import googleDriveRoutes from './modules/user/routes/googleDrive.routes';

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
const uploadsPath = path.join(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadsPath));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: true, // Allow all origins for mobile access
  credentials: true
}));

// Setup Swagger documentation
setupSwagger(app);

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
app.use('/volunteer-registrations', volunteerRegistrationRoutes);
app.use('/donations', donationRoutes);
app.use('/events-news', eventsNewsRoutes);
app.use('/api/attendance', attendanceNewRoutes); // New attendance system routes
app.use('/workshops', workshopRoutes);
app.use('/enrollments', enrollmentRoutes);
app.use('/workshop-enrollments', workshopEnrollmentRoutes);
app.use('/records', recordRoutes);
app.use('/donation-tickets', donationTicketRoutes);
app.use('/ticket-messages', ticketMessageRoutes);
app.use('/anonymous-tickets', anonymousTicketRoutes);
app.use('/api/hero-section', heroSectionRoutes);
app.use('/api/about-section', aboutSectionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/landing-donaciones-card', LandingDonacionesCard);
app.use('/uploads', express.static('uploads'));
app.use('/api/landing-donaciones-component', LandingDonacionesComponent);
app.use('/api/landing-volunteer', landingVolunteerRoutes);
app.use('/admin/google-drive', googleDriveRoutes);

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