import express from 'express';
import { authenticateToken } from '../../../middleware/auth.middleware';
// @ts-ignore
import googleDriveService from '../../../services/googleDriveOAuth.service';
// @ts-ignore
import tokenService from '../../../services/googleDriveToken.service';

const router = express.Router();
const mysql = require('mysql2/promise');

// Helper function to get database connection config (handles Railway internal/public URLs)
function getDatabaseConfig() {
  let dbHost = process.env.DB_HOST || 'localhost';
  let dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT.trim()) : 3306;
  let dbUser = process.env.DB_USER || 'root';
  let dbPassword = process.env.DB_PASSWORD || '';
  let dbName = process.env.DB_NAME || 'asonipeddigitaltest';
  
  // Check if MYSQL_PUBLIC_URL is available first (more reliable than internal URL)
  if (process.env.MYSQL_PUBLIC_URL) {
    try {
      const publicUrl = process.env.MYSQL_PUBLIC_URL.trim();
      const match = publicUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
      if (match) {
        dbUser = match[1];
        dbPassword = match[2];
        dbHost = match[3]; // host (e.g., turntable.proxy.rlwy.net)
        dbPort = Number(match[4]); // port
        dbName = match[5].trim(); // database name (remove query params if any)
        console.log('✅ Using MYSQL_PUBLIC_URL for database connection');
        return { dbHost, dbPort, dbUser, dbPassword, dbName };
      }
    } catch (e) {
      console.warn('⚠️ Could not parse MYSQL_PUBLIC_URL:', e);
    }
  }
  
  // Check if MYSQL_URL is available (only if MYSQL_PUBLIC_URL didn't set dbHost)
  const originalDbHost = process.env.DB_HOST || 'localhost';
  if (dbHost === originalDbHost && process.env.MYSQL_URL) {
    try {
      const mysqlUrl = process.env.MYSQL_URL.trim();
      const match = mysqlUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
      if (match) {
        const hostname = match[3];
        // Prefer public URLs over internal ones
        if (hostname.includes('proxy.rlwy.net') || hostname.includes('turntable.proxy.rlwy.net')) {
          dbUser = match[1];
          dbPassword = match[2];
          dbHost = hostname;
          dbPort = Number(match[4]);
          dbName = match[5].trim(); // database name (remove query params if any)
          console.log('✅ Using MYSQL_URL (public) for database connection');
          return { dbHost, dbPort, dbUser, dbPassword, dbName };
        } else if (hostname.includes('railway.internal')) {
          console.warn('⚠️ MYSQL_URL uses railway.internal - trying to find public URL');
          // Don't use internal URL, keep trying
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not parse MYSQL_URL');
    }
  }
  
  // If DB_HOST is still railway.internal, try to use MYSQL_PUBLIC_URL as fallback
  if (dbHost && dbHost.includes('railway.internal') && !dbHost.includes('proxy.rlwy.net')) {
    if (process.env.MYSQL_PUBLIC_URL) {
      try {
        const publicUrl = process.env.MYSQL_PUBLIC_URL.trim();
        const match = publicUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
        if (match) {
          console.log('🔄 Switching from internal to public MySQL URL');
          dbUser = match[1];
          dbPassword = match[2];
          dbHost = match[3];
          dbPort = Number(match[4]);
          dbName = match[5].trim(); // database name (remove query params if any)
          return { dbHost, dbPort, dbUser, dbPassword, dbName };
        }
      } catch (e) {
        console.warn('⚠️ Could not parse MYSQL_PUBLIC_URL for fallback');
      }
    }
  }
  
  return { dbHost, dbPort, dbUser, dbPassword, dbName };
}

// Get Google Drive service status (temporarily without auth for debugging)
router.get('/status', async (req: any, res: any) => {
  try {
    const status = await googleDriveService.getServiceStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting Google Drive status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Google Drive status'
    });
  }
});

// Initialize Google Drive service
router.post('/initialize', authenticateToken, async (req: any, res: any) => {
  try {
    const initialized = await googleDriveService.initialize();
    
    if (initialized) {
      res.json({
        success: true,
        message: 'Google Drive service initialized successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to initialize Google Drive service'
      });
    }
  } catch (error) {
    console.error('Error initializing Google Drive:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Failed to initialize Google Drive service'
    });
  }
});

// Refresh Google Drive token (temporarily without auth for debugging)
router.post('/refresh-token', async (req: any, res: any) => {
  try {
    await tokenService.refreshToken();
    res.json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Failed to refresh token'
    });
  }
});

// Clear existing tokens and force re-authorization
router.post('/clear-tokens', async (req: any, res: any) => {
  try {
    const { dbHost, dbPort, dbUser, dbPassword, dbName } = getDatabaseConfig();
    
    const db = mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: dbPort,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000
    });
    
    await db.execute('DELETE FROM google_drive_tokens');
    await db.end();
    
    res.json({
      success: true,
      message: 'Tokens cleared successfully. Please re-authorize.'
    });
  } catch (error) {
    console.error('Error clearing tokens:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Failed to clear tokens'
    });
  }
});

// Get authorization URL for manual token setup (no auth required for easier testing)
router.get('/auth-url', async (req: any, res: any) => {
  try {
    const { google } = require('googleapis');
    const fs = require('fs');
    const path = require('path');
    
    // Load credentials from environment variables or file
    let credentials;
    
    // Support both GOOGLE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_ID (legacy)
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    
    if (clientId && clientSecret) {
      // Use environment variables (production/Railway)
      credentials = {
        web: {
          client_id: clientId,
          client_secret: clientSecret
        }
      };
    } else {
      // Fallback to file (local development)
      const credentialsPath = path.join(__dirname, '../../../../credentials/oauth-credentials.json');
      
      if (!fs.existsSync(credentialsPath)) {
        return res.status(500).json({
          success: false,
          error: 'Google Drive credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
        });
      }

      credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    }
    
    // Get redirect URI from environment or use default (same logic as callback route)
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
                       (process.env.BACKEND_URL ? process.env.BACKEND_URL + '/admin/google-drive/auth/callback' : null) ||
                       'http://localhost:3000/admin/google-drive/auth/callback';
    
    const oauth2Client = new google.auth.OAuth2(
      credentials.web.client_id,
      credentials.web.client_secret,
      redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Force consent screen to get refresh token
      scope: ['https://www.googleapis.com/auth/drive.file']
    });

    res.json({
      success: true,
      authUrl,
      redirectUri, // Include redirect URI in response for debugging
      message: 'Visit this URL to authorize the application'
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL',
      details: (error as Error).message
    });
  }
});

// OAuth callback route (no authentication required)
router.get('/auth/callback', async (req: any, res: any) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      console.error('OAuth error:', error);
      return res.status(400).send(`
        <html>
          <body>
            <h1>Authorization Failed</h1>
            <p>Error: ${error}</p>
            <p>Please try again.</p>
          </body>
        </html>
      `);
    }
    
    if (!code) {
      return res.status(400).send(`
        <html>
          <body>
            <h1>Authorization Failed</h1>
            <p>No authorization code received.</p>
            <p>Please try again.</p>
          </body>
        </html>
      `);
    }
    
    
    // Get token from authorization code
    const { google } = require('googleapis');
    const fs = require('fs');
    const path = require('path');
    
    // Load credentials from environment variables or file
    let credentials;
    
    // Support both GOOGLE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_ID (legacy)
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    
    if (clientId && clientSecret) {
      // Use environment variables (production/Railway)
      credentials = {
        web: {
          client_id: clientId,
          client_secret: clientSecret
        }
      };
    } else {
      // Fallback to file (local development)
      const credentialsPath = path.join(__dirname, '../../../../credentials/oauth-credentials.json');
      
      if (!fs.existsSync(credentialsPath)) {
        return res.status(500).send(`
          <html>
            <body>
              <h1>Configuration Error</h1>
              <p>Google Drive credentials not configured.</p>
              <p>Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.</p>
            </body>
          </html>
        `);
      }
      
      credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    }
    
    // Get redirect URI from environment or use default
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
                       (process.env.BACKEND_URL ? process.env.BACKEND_URL + '/admin/google-drive/auth/callback' : null) ||
                       'http://localhost:3000/admin/google-drive/auth/callback';
    
    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      credentials.web.client_id,
      credentials.web.client_secret,
      redirectUri
    );
    
    // Get token from code
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    
    // Save token to database - use helper function to get proper database config
    const { dbHost, dbPort, dbUser, dbPassword, dbName } = getDatabaseConfig();
    
    console.log('🗄️ OAuth Callback Database Configuration:');
    console.log(`   Host: ${dbHost}`);
    console.log(`   Port: ${dbPort}`);
    console.log(`   Database: ${dbName}`);
    
    const db = mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: dbPort,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000
    });
    
    // Clear existing tokens
    await db.execute('DELETE FROM google_drive_tokens');
    
    // Ensure all token values are properly defined
    const accessToken = tokens.access_token || null;
    const refreshToken = tokens.refresh_token || null;
    
    // Convert expiry_date from Unix timestamp to MySQL datetime format
    let expiryDate = null;
    if (tokens.expiry_date) {
      try {
        expiryDate = new Date(tokens.expiry_date).toISOString().slice(0, 19).replace('T', ' ');
      } catch (error) {
        console.error('Error converting expiry date:', error);
        expiryDate = null;
      }
    }
    
    
    // Save new token
    await db.execute(
      'INSERT INTO google_drive_tokens (access_token, refresh_token, expiry_date, created_at) VALUES (?, ?, ?, NOW())',
      [accessToken, refreshToken, expiryDate]
    );
    
    // Test connection
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const testResponse = await drive.files.list({ pageSize: 1 });
    
    
    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1 style="color: #4CAF50;">✅ Google Drive Authorization Successful!</h1>
          <p>Your Google Drive integration has been set up successfully.</p>
          <p><strong>Status:</strong> Connected</p>
          <p><strong>Files found:</strong> ${testResponse.data.files.length}</p>
          <p>You can now close this window and return to your application.</p>
          <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <h3>Next Steps:</h3>
            <ul>
              <li>File uploads will now work automatically</li>
              <li>Tokens will refresh automatically when needed</li>
              <li>No manual intervention required</li>
            </ul>
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1 style="color: #f44336;">❌ Authorization Failed</h1>
          <p>An error occurred during the authorization process:</p>
          <p style="background: #ffebee; padding: 10px; border-radius: 5px; color: #c62828;">
            ${(error as Error).message}
          </p>
          <p>Please try again or contact support.</p>
        </body>
      </html>
    `);
  }
});

// Run database migration to allow NULL values
router.post('/migrate-db', async (req: any, res: any) => {
  try {
    const { dbHost, dbPort, dbUser, dbPassword, dbName } = getDatabaseConfig();
    
    const db = mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      port: dbPort,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000
    });

    // Update columns to allow NULL values
    await db.execute('ALTER TABLE google_drive_tokens MODIFY COLUMN refresh_token TEXT NULL');
    await db.execute('ALTER TABLE google_drive_tokens MODIFY COLUMN expiry_date DATETIME NULL');
    
    res.json({
      success: true,
      message: 'Database migration completed successfully. Columns now allow NULL values.'
    });
  } catch (error) {
    console.error('Error running migration:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Migration failed'
    });
  }
});

// Test Google Drive connection
router.post('/test', authenticateToken, async (req: any, res: any) => {
  try {
    await googleDriveService.initialize();
    
    // Try to list files to test connection
    const files = await googleDriveService.listFiles(null, 1);
    
    res.json({
      success: true,
      message: 'Google Drive connection test successful',
      filesCount: files?.length || 0
    });
  } catch (error) {
    console.error('Error testing Google Drive connection:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Google Drive connection test failed'
    });
  }
});

// Serve Google Drive images with authentication (supports both header and cookie auth)
router.get('/image/:fileId', async (req: any, res: any) => {
  // Check authentication via header or cookie
  const authHeader = req.headers.authorization;
  const authCookie = req.cookies?.auth_token;
  
  // Authentication check via header or cookie
  
  if (!authHeader && !authCookie) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // If we have a cookie but no header, add the header for the auth middleware
  if (authCookie && !authHeader) {
    req.headers.authorization = `Bearer ${authCookie}`;
  }
  
  // Now use the auth middleware
  return authenticateToken(req, res, async () => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // Initialize Google Drive service
    const initialized = await googleDriveService.initialize();
    
    if (!initialized) {
      return res.status(500).json({ error: 'Google Drive service not available' });
    }
    
    // Ensure we have a valid token before making API calls
    console.log('🔧 Ensuring valid Google Drive token...');
    const tokenService = require('../../../services/googleDriveToken.service');
    
    // Force token refresh to ensure we have a fresh token
    console.log('🔄 Force refreshing token to ensure fresh credentials...');
    try {
      await tokenService.refreshToken();
      console.log('✅ Token force refresh completed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('⚠️ Force refresh failed, using existing token:', errorMessage);
    }
    
    console.log('✅ Google Drive token validated');
    
    // Debug: Check token status before API call
    console.log('🔍 Token status before API call:', {
      hasCredentials: !!tokenService.oauth2Client.credentials,
      hasAccessToken: !!tokenService.oauth2Client.credentials?.access_token,
      hasRefreshToken: !!tokenService.oauth2Client.credentials?.refresh_token,
      expiryDate: tokenService.oauth2Client.credentials?.expiry_date,
      accessTokenPreview: tokenService.oauth2Client.credentials?.access_token?.substring(0, 20) + '...'
    });
    
    // Get the file from Google Drive
    const { google } = require('googleapis');
    const drive = google.drive({ version: 'v3', auth: tokenService.oauth2Client });
    
    // Get file metadata first
    const fileMetadata = await drive.files.get({
      fileId: fileId,
      fields: 'mimeType,name,size'
    });
    
    // Check if it's an image
    const mimeType = fileMetadata.data.mimeType;
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'File is not an image' });
    }
    
    // Get the file content
    const fileResponse = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, {
      responseType: 'stream'
    });
    
    // Set appropriate headers
    res.set({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Content-Disposition': `inline; filename="${fileMetadata.data.name}"`
    });
    
    // Pipe the file stream to the response
    fileResponse.data.pipe(res);
    
  } catch (error) {
    console.error('Error serving Google Drive image:', error);
    res.status(500).json({
      error: 'Failed to serve image',
      details: (error as Error).message
    });
  }
  });
});

export default router;
