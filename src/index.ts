import express from 'express';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';
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

const APP_VERSION = (() => {
  try {
    const raw = readFileSync(join(__dirname, '..', 'package.json'), 'utf8');
    return (JSON.parse(raw) as { version?: string }).version ?? 'unknown';
  } catch {
    return 'unknown';
  }
})();

const GIT_SHA =
  process.env.GIT_SHA ||
  process.env.RAILWAY_GIT_COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  null;

type SmtpStartupStatus = 'pending' | 'ok' | 'failed' | 'skipped';

const startupDiagnostics = {
  email: {
    smtpVerify: 'pending' as SmtpStartupStatus,
  },
  googleDrive: {
    initComplete: false,
    ready: false,
  },
};

async function pingDatabase(): Promise<boolean> {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    conn?.release();
  }
}

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
      } catch {
        // If URL parsing fails, just use the original value
      }
    }
  } catch {
    // ignore invalid FRONTEND_URL
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
    
    // Reject the request
    callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma']
}));

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

async function buildHealthPayload() {
  const dbOk = await pingDatabase();
  const mem = process.memoryUsage();

  let emailBlock: {
    configured: boolean;
    host: string;
    userSet: boolean;
    smtpVerifyAtStartup: SmtpStartupStatus;
  } = {
    configured: false,
    host: '',
    userSet: false,
    smtpVerifyAtStartup: startupDiagnostics.email.smtpVerify,
  };

  try {
    const { emailService } = require('./services/email.service');
    const s = emailService.instance.getServiceStatus();
    emailBlock = {
      configured: s.configured,
      host: s.host,
      userSet: !!s.user,
      smtpVerifyAtStartup: startupDiagnostics.email.smtpVerify,
    };
  } catch {
    // keep defaults
  }

  let googleDriveBlock: Record<string, unknown> = {
    serviceInitialized: false,
    driveAvailable: false,
    hasToken: false,
    credentialsLoaded: false,
  };

  try {
    const googleDriveService = require('./services/googleDriveOAuth.service');
    googleDriveBlock = await googleDriveService.getServiceStatus();
  } catch {
    // keep defaults
  }

  return {
    status: 'OK' as const,
    message: 'Backend is running correctly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    node: process.version,
    version: APP_VERSION,
    gitSha: GIT_SHA,
    listen: { host: '0.0.0.0', port: PORT },
    database: { ok: dbOk },
    socketIo: true,
    email: emailBlock,
    googleDrive: googleDriveBlock,
    memory: { rssMb: Math.round(mem.rss / 1024 / 1024) },
  };
}

// Liveness + detail (always 200 when the process is serving HTTP)
app.get('/health', async (_req, res) => {
  try {
    const body = await buildHealthPayload();
    res.status(200).json(body);
  } catch {
    res.status(200).json({
      status: 'OK',
      message: 'Backend is running; health payload failed to build',
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
    });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    const body = await buildHealthPayload();
    res.status(200).json(body);
  } catch {
    res.status(200).json({
      status: 'OK',
      message: 'Backend API is running',
      timestamp: new Date().toISOString(),
    });
  }
});

// Readiness: DB must respond (for load balancers / orchestrators)
app.get('/ready', async (_req, res) => {
  const dbOk = await pingDatabase();
  if (!dbOk) {
    res.status(503).json({
      ready: false,
      database: 'unreachable',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  res.status(200).json({
    ready: true,
    database: 'ok',
    timestamp: new Date().toISOString(),
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

    // Start server IMMEDIATELY after DB connection (before Google Drive init)
    // This ensures Railway can connect as soon as possible
    const listenPort = PORT;
    const listenHost = '0.0.0.0';

    const nodeEnv = process.env.NODE_ENV || 'development';
    server.listen(listenPort, listenHost, () => {
      const base = process.env.BACKEND_URL || `http://localhost:${listenPort}`;
      console.log(
        `Server ${listenHost}:${listenPort} (${nodeEnv}) · ${base}/health · /ready · Socket.io · Node ${process.version}`
      );
    });

    // Email + Google Drive in background; update diagnostics for /health and optional verbose log
    setImmediate(async () => {
      try {
        const { emailService } = require('./services/email.service');
        const emailStatus = emailService.instance.getServiceStatus();
        if (emailStatus.configured) {
          const r = await emailService.instance.testConnection();
          startupDiagnostics.email.smtpVerify = r.success ? 'ok' : 'failed';
        } else {
          startupDiagnostics.email.smtpVerify = 'skipped';
        }
      } catch {
        startupDiagnostics.email.smtpVerify = 'failed';
      }

      try {
        const googleDriveService = require('./services/googleDriveOAuth.service');
        await googleDriveService.initialize();
        startupDiagnostics.googleDrive.ready = !!googleDriveService.initialized;
      } catch {
        startupDiagnostics.googleDrive.ready = false;
      }
      startupDiagnostics.googleDrive.initComplete = true;

      const verbose =
        process.env.LOG_VERBOSE === '1' ||
        process.env.LOG_VERBOSE === 'true';
      if (verbose) {
        console.log(
          `Services: email SMTP @ startup=${startupDiagnostics.email.smtpVerify} · Google Drive ${startupDiagnostics.googleDrive.ready ? 'ready' : 'not ready'}`
        );
      }
    });

    // Handle server errors
    server.on('error', () => {
      process.exit(1);
    });
  } catch {
    process.exit(1);
  }
};

// Start the server
startServer();