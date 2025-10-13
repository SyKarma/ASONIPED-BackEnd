import express from 'express';
import { authenticateToken } from '../../../middleware/auth.middleware';
// @ts-ignore
import googleDriveService from '../../../services/googleDriveOAuth.service';
// @ts-ignore
import tokenService from '../../../services/googleDriveToken.service';

const router = express.Router();

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
    const mysql = require('mysql2/promise');
    
    const db = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'asonipeddigitaltest',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
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
    
    const credentialsPath = path.join(__dirname, '../../../credentials/oauth-credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    const oauth2Client = new google.auth.OAuth2(
      credentials.web.client_id,
      credentials.web.client_secret,
      'http://localhost:3000/admin/google-drive/auth/callback'
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // Force consent screen to get refresh token
      scope: ['https://www.googleapis.com/auth/drive.file']
    });

    res.json({
      success: true,
      authUrl,
      message: 'Visit this URL to authorize the application'
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL'
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
    const mysql = require('mysql2/promise');
    
    // Load credentials
    const credentialsPath = path.join(__dirname, '../../../credentials/oauth-credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      credentials.web.client_id,
      credentials.web.client_secret,
      'http://localhost:3000/admin/google-drive/auth/callback'
    );
    
    // Get token from code
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    
    // Save token to database
    const db = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'asonipeddigitaltest',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
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
    const mysql = require('mysql2/promise');
    
    const db = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'asonipeddigitaltest',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
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
      filesCount: files.length
    });
  } catch (error) {
    console.error('Error testing Google Drive connection:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Google Drive connection test failed'
    });
  }
});

export default router;
