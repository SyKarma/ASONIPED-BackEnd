import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Swagger setup
import { setupSwagger } from './config/swagger';

// Database connection
import { db } from './db';

// Socket.io setup
import { setupSocketIO } from './socket';

// Middleware
import { authenticateToken } from './middleware/auth.middleware';

// Route imports
import userRoutes from './modules/user/routes/user.routes';
import userDashboardRoutes from './modules/user/routes/user_dashboard.routes';
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
import landingVolunteerRoutes from './modules/landing/routes/landing-volunteer.routes';
import googleDriveRoutes from './modules/user/routes/googleDrive.routes';

// Load environment variables
dotenv.config();

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Setup Socket.io
const io = setupSocketIO(server);

// Middleware configuration
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// CORS configuration - Allow multiple origins in production
const allowedOrigins: string[] = [];
if (process.env.FRONTEND_URL) {
  try {
    const frontendUrl = process.env.FRONTEND_URL.trim();
    allowedOrigins.push(frontendUrl);
    
    // Add common Vercel patterns (only for non-localhost URLs)
    if (!frontendUrl.includes('localhost')) {
      try {
        const url = new URL(frontendUrl);
        // Add www variant if not already present
        if (!url.hostname.startsWith('www.')) {
          allowedOrigins.push(`https://www.${url.hostname}`);
        }
      } catch (e) {
        // If URL parsing fails, just use the original value
        console.warn('⚠️ Could not parse FRONTEND_URL:', frontendUrl);
      }
    }
  } catch (e) {
    console.error('❌ Error processing FRONTEND_URL:', e);
  }
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (allowedOrigins.length === 0) {
      // If no FRONTEND_URL is set, allow all (fallback)
      console.warn('⚠️ WARNING: FRONTEND_URL not set, allowing all origins');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => {
      // Exact match
      if (origin === allowed) return true;
      // Check if origin starts with allowed (for subdomains)
      if (origin.startsWith(allowed)) return true;
      // Check if it's the same domain (http vs https)
      try {
        const originUrl = new URL(origin);
        const allowedUrl = new URL(allowed);
        if (originUrl.hostname === allowedUrl.hostname) return true;
      } catch (e) {
        // Ignore URL parsing errors
      }
      return false;
    })) {
      return callback(null, true);
    }
    
    // Log blocked origin for debugging
    console.warn(`🚫 CORS blocked origin: ${origin}`);
    console.warn(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
    
    // Reject the request
    callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Log CORS configuration on startup
console.log('🌐 CORS Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'not set'}`);
if (allowedOrigins.length > 0) {
  console.log(`   ✅ Allowed origins: ${allowedOrigins.join(', ')}`);
} else {
  console.log(`   ⚠️ No FRONTEND_URL set - allowing all origins`);
}

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




// API Routes
// Note: Individual route protection is handled within each route file
app.use('/users', userRoutes);
app.use('/user', userDashboardRoutes); // User dashboard endpoints
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
app.use('/api/landing-donaciones-card', LandingDonacionesCard);
app.use('/api/landing-donaciones-component', LandingDonacionesComponent);
app.use('/api/landing-volunteer', landingVolunteerRoutes);
app.use('/admin/google-drive', googleDriveRoutes);


// Database connection and server startup
const startServer = async (): Promise<void> => {
  try {
    await db.getConnection();
    console.log('✅ MySQL connection successful!');
    
    // Initialize Google Drive service on startup
    try {
      console.log('🚀 STARTUP: Initializing Google Drive service...');
      const googleDriveService = require('./services/googleDriveOAuth.service');
      console.log('🚀 STARTUP: Google Drive service module loaded');
      
      const initialized = await googleDriveService.initialize();
      console.log('🚀 STARTUP: Google Drive service initialization result:', initialized);
      
      if (initialized) {
        console.log('✅ STARTUP: Google Drive service initialized successfully!');
        
        // Check service status
        const status = await googleDriveService.getServiceStatus();
        console.log('📊 STARTUP: Google Drive service status:', status);
      } else {
        console.log('⚠️ STARTUP: Google Drive service initialization failed - manual authorization may be required');
      }
    } catch (error) {
      console.log('❌ STARTUP: Google Drive service initialization error:', (error as Error).message);
      console.log('❌ STARTUP: Error stack:', (error as Error).stack);
    }
    
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      const serverUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
      console.log(`📊 Health check available at: ${serverUrl}/health`);
      console.log(`🔌 Socket.io server is ready for real-time chat`);
    });
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    process.exit(1);
  }
};

// Start the server
startServer();