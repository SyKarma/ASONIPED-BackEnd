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
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Log port configuration
console.log('🔧 Port Configuration:');
console.log(`   process.env.PORT: ${process.env.PORT || 'not set'}`);
console.log(`   Using PORT: ${PORT}`);

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
    // Remove trailing slash and trim
    let frontendUrl = process.env.FRONTEND_URL.trim();
    if (frontendUrl.endsWith('/')) {
      frontendUrl = frontendUrl.slice(0, -1);
    }
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma']
}));

// Log CORS configuration on startup
console.log('🌐 CORS Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
const rawFrontendUrl = process.env.FRONTEND_URL || 'not set';
console.log(`   FRONTEND_URL (raw): ${rawFrontendUrl}`);
if (allowedOrigins.length > 0) {
  console.log(`   ✅ Allowed origins: ${allowedOrigins.join(', ')}`);
} else {
  console.log(`   ⚠️ No FRONTEND_URL set - allowing all origins`);
}

// Handle OPTIONS requests explicitly (CORS preflight) - BEFORE other routes
// Use middleware instead of app.options('*') to avoid path-to-regexp error
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Apply CORS headers for OPTIONS requests
    const origin = req.headers.origin;
    if (!origin || process.env.NODE_ENV !== 'production') {
      res.header('Access-Control-Allow-Origin', origin || '*');
    } else if (allowedOrigins.length === 0) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed))) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', origin); // Allow for debugging
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    res.sendStatus(200);
    return;
  }
  next();
});

// Setup Swagger documentation
setupSwagger(app);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Health check endpoint for automatic detection
// This endpoint is critical for Railway's health checks
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Backend is running correctly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Additional health check for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Backend API is running correctly',
    timestamp: new Date().toISOString()
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
    
    // Start server IMMEDIATELY after DB connection (before Google Drive init)
    // This ensures Railway can connect as soon as possible
    const listenPort = PORT;
    const listenHost = '0.0.0.0';
    
    console.log(`🔧 Starting server on ${listenHost}:${listenPort}`);
    
    server.listen(listenPort, listenHost, () => {
      console.log(`🚀 Server is running on port ${listenPort} (${listenHost})`);
      console.log(`🌐 Server is listening on all network interfaces`);
      const serverUrl = process.env.BACKEND_URL || `http://localhost:${listenPort}`;
      console.log(`📊 Health check available at: ${serverUrl}/health`);
      console.log(`🔌 Socket.io server is ready for real-time chat`);
      
      // Verify the server is actually listening
      const address = server.address();
      if (address) {
        console.log(`✅ Server address: ${typeof address === 'string' ? address : `${address.address}:${address.port}`}`);
      }
    });
    
    // Initialize Google Drive service in background (non-blocking)
    // This allows the server to start responding immediately
    setImmediate(async () => {
      try {
        console.log('🚀 STARTUP: Initializing Google Drive service in background...');
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
    });
    
    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.error(`❌ Please check if another process is using this port`);
      } else {
        console.error(`❌ Server error:`, error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    process.exit(1);
  }
};

// Start the server
startServer();