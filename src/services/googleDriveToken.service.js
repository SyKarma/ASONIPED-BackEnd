const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

class GoogleDriveTokenService {
  constructor() {
    this.oauth2Client = null;
    this.drive = null;
    this.db = null;
    this.credentials = null;
  }

  async initialize() {
    try {
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
        console.log('✅ Using Google Drive credentials from environment variables');
      } else {
        // Fallback to file (local development)
        const credentialsPath = path.join(__dirname, '../../credentials/oauth-credentials.json');
        
        if (!fs.existsSync(credentialsPath)) {
          console.warn('⚠️ Google Drive credentials file not found. Google Drive features will be disabled.');
          console.warn('⚠️ Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables for production.');
          return false;
        }

        credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        console.log('✅ Using Google Drive credentials from file');
      }

      this.credentials = credentials;
      
      // Initialize database connection - use same logic as main db.ts
      let dbHost = process.env.DB_HOST || 'localhost';
      let dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT.trim()) : 3306;
      
      // Check if MYSQL_PUBLIC_URL is available first (more reliable than internal URL)
      if (process.env.MYSQL_PUBLIC_URL) {
        try {
          const publicUrl = process.env.MYSQL_PUBLIC_URL.trim();
          const match = publicUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
          if (match) {
            dbHost = match[3]; // host (e.g., turntable.proxy.rlwy.net)
            dbPort = Number(match[4]); // port
            console.log('✅ Google Drive: Using MYSQL_PUBLIC_URL for database connection');
          }
        } catch (e) {
          console.warn('⚠️ Google Drive: Could not parse MYSQL_PUBLIC_URL:', e);
        }
      }
      
      // Check if MYSQL_URL is available (only if MYSQL_PUBLIC_URL didn't set dbHost)
      // If dbHost is still the original DB_HOST value, try MYSQL_URL
      const originalDbHost = process.env.DB_HOST || 'localhost';
      if (dbHost === originalDbHost && process.env.MYSQL_URL) {
        try {
          const mysqlUrl = process.env.MYSQL_URL.trim();
          const match = mysqlUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
          if (match) {
            const hostname = match[3];
            // Prefer public URLs over internal ones
            if (hostname.includes('proxy.rlwy.net') || hostname.includes('turntable.proxy.rlwy.net')) {
              dbHost = hostname;
              dbPort = Number(match[4]);
              console.log('✅ Google Drive: Using MYSQL_URL (public) for database connection');
            } else if (hostname.includes('railway.internal')) {
              // Only use internal URL if public URL is not available
              console.warn('⚠️ Google Drive: MYSQL_URL uses railway.internal - this may not be available');
              console.warn('⚠️ Google Drive: Consider using MYSQL_PUBLIC_URL instead');
              dbHost = hostname;
              dbPort = Number(match[4]);
            }
          }
        } catch (e) {
          console.warn('⚠️ Google Drive: Could not parse MYSQL_URL');
        }
      }
      
      // If DB_HOST is still railway.internal, try to use MYSQL_PUBLIC_URL as fallback
      if (dbHost && dbHost.includes('railway.internal') && !dbHost.includes('proxy.rlwy.net')) {
        if (process.env.MYSQL_PUBLIC_URL) {
          try {
            const publicUrl = process.env.MYSQL_PUBLIC_URL.trim();
            const match = publicUrl.match(/mysql:\/\/[^@]+@([^:]+):(\d+)\//);
            if (match) {
              console.log('🔄 Google Drive: Switching from internal to public MySQL URL');
              dbHost = match[1];
              dbPort = Number(match[2]);
            }
          } catch (e) {
            console.warn('⚠️ Google Drive: Could not parse MYSQL_PUBLIC_URL for fallback');
          }
        }
      }
      
      console.log('🗄️ Google Drive Database Configuration:');
      console.log(`   Host: ${dbHost}`);
      console.log(`   Port: ${dbPort}`);
      
      this.db = mysql.createPool({
        host: dbHost,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'asonipeddigitaltest',
        port: dbPort,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000
      });

      // Get redirect URI from environment or use default
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
                         (process.env.BACKEND_URL ? process.env.BACKEND_URL + '/admin/google-drive/auth/callback' : null) ||
                         'http://localhost:3000/admin/google-drive/auth/callback';

      // Initialize OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        this.credentials.web.client_id,
        this.credentials.web.client_secret,
        redirectUri
      );

      // Load token from database
      await this.loadTokenFromDatabase();

      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      return true;
    } catch (error) {
      console.error('Error initializing Google Drive Token Service:', error);
      return false;
    }
  }

  async loadTokenFromDatabase() {
    try {
      console.log('🔍 Loading token from database...');
      
      // Prefer the most recent token that has a non-null refresh_token
      const [rows] = await this.db.execute(
        `(
          SELECT access_token, refresh_token, expiry_date
          FROM google_drive_tokens
          WHERE refresh_token IS NOT NULL
          ORDER BY created_at DESC
          LIMIT 1
        )
        UNION ALL
        (
          SELECT access_token, refresh_token, expiry_date
          FROM google_drive_tokens
          WHERE refresh_token IS NULL
          ORDER BY created_at DESC
          LIMIT 1
        )
        LIMIT 1`
      );
      
      console.log('📊 Database query result:', {
        rowsFound: rows.length,
        hasAccessToken: rows.length > 0 ? !!rows[0].access_token : false,
        hasRefreshToken: rows.length > 0 ? !!rows[0].refresh_token : false,
        expiryDate: rows.length > 0 ? rows[0].expiry_date : 'none'
      });

      if (rows.length > 0) {
        const token = rows[0];
        const tokenData = {
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expiry_date: token.expiry_date
        };

        // Backfill refresh_token if missing before setting credentials
        if (!tokenData.refresh_token) {
          try {
            const [rtRows] = await this.db.execute(
              `SELECT refresh_token FROM google_drive_tokens
               WHERE refresh_token IS NOT NULL
               ORDER BY created_at DESC
               LIMIT 1`
            );
            if (rtRows && rtRows.length > 0) {
              tokenData.refresh_token = rtRows[0].refresh_token;
            }
          } catch (_e) {}
        }

        this.oauth2Client.setCredentials(tokenData);
        console.log('✅ Google Drive token loaded from database');
        console.log('🔍 Loaded token data:', {
          hasAccessToken: !!tokenData.access_token,
          hasRefreshToken: !!tokenData.refresh_token,
          expiryDate: tokenData.expiry_date
        });
        
        // Check if token needs refresh
        if (this.isTokenExpired(tokenData)) {
          console.log('🔄 Token expired, refreshing...');
          // Only attempt refresh if we have a refresh_token after backfill
          if (!this.oauth2Client.credentials.refresh_token) {
            console.warn('⚠️ No refresh token available; skipping refresh and keeping existing access token');
          } else {
            await this.refreshToken();
          }
        }
      } else {
        console.log('⚠️ No token found in database. Manual authorization required.');
        throw new Error('No valid token found. Please run the authorization flow.');
      }
    } catch (error) {
      console.error('Error loading token from database:', error);
      throw error;
    }
  }

  async saveTokenToDatabase(tokenData) {
    try {
      // Ensure all token values are properly defined
      const accessToken = tokenData.access_token || null;
      let refreshToken = tokenData.refresh_token || null;
      
      // Convert expiry_date from Unix timestamp to MySQL datetime format
      let expiryDate = null;
      if (tokenData.expiry_date) {
        try {
          expiryDate = new Date(tokenData.expiry_date).toISOString().slice(0, 19).replace('T', ' ');
        } catch (error) {
          console.error('Error converting expiry date:', error);
          expiryDate = null;
        }
      }
      
      // If Google did not return a refresh_token, reuse the latest non-null one from DB
      if (!refreshToken) {
        try {
          const [rtRows] = await this.db.execute(
            `SELECT refresh_token FROM google_drive_tokens
             WHERE refresh_token IS NOT NULL
             ORDER BY created_at DESC
             LIMIT 1`
          );
          if (rtRows && rtRows.length > 0) {
            refreshToken = rtRows[0].refresh_token;
          }
        } catch (_e) {
          // ignore, fallback to null
        }
      }

      console.log('Token data to save:', {
        accessToken: accessToken ? 'present' : 'missing',
        refreshToken: refreshToken ? 'present' : 'missing',
        expiryDate: expiryDate || 'missing'
      });

      if (refreshToken) {
        // Normal path: insert a new snapshot including refresh token
        await this.db.execute(
          'INSERT INTO google_drive_tokens (access_token, refresh_token, expiry_date, created_at) VALUES (?, ?, ?, NOW())',
          [accessToken, refreshToken, expiryDate]
        );
        console.log('✅ Token with refresh_token saved');
      } else {
        // No refresh_token returned: update the most recent row that has a refresh_token
        const [existingRtRows] = await this.db.execute(
          `SELECT id FROM google_drive_tokens
           WHERE refresh_token IS NOT NULL
           ORDER BY created_at DESC
           LIMIT 1`
        );

        if (existingRtRows && existingRtRows.length > 0) {
          const id = existingRtRows[0].id;
          await this.db.execute(
            'UPDATE google_drive_tokens SET access_token = ?, expiry_date = ?, created_at = NOW() WHERE id = ?',
            [accessToken, expiryDate, id]
          );
          console.log('✅ Updated existing token row (kept refresh_token)');
        } else {
          // No prior refresh token in DB; insert anyway (first run scenario)
          await this.db.execute(
            'INSERT INTO google_drive_tokens (access_token, refresh_token, expiry_date, created_at) VALUES (?, ?, ?, NOW())',
            [accessToken, null, expiryDate]
          );
          console.log('✅ Token saved without refresh_token (no prior token to reuse)');
        }
      }
    } catch (error) {
      console.error('Error saving token to database:', error);
      throw error;
    }
  }

  isTokenExpired(tokenData) {
    if (!tokenData.expiry_date) return true;
    
    // Handle both Unix timestamp and MySQL datetime formats
    let expiryTime;
    if (typeof tokenData.expiry_date === 'number') {
      // Unix timestamp (milliseconds)
      expiryTime = tokenData.expiry_date;
    } else {
      // MySQL datetime string
      expiryTime = new Date(tokenData.expiry_date).getTime();
    }
    
    const currentTime = new Date().getTime();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    
    return currentTime >= (expiryTime - bufferTime);
  }

  async refreshToken() {
    try {
      console.log('🔄 Refreshing Google Drive token...');
      
      if (!this.oauth2Client.credentials || !this.oauth2Client.credentials.refresh_token) {
        console.log('❌ No refresh token in credentials, attempting to reload from database...');
        
        // Try to reload the token from database
        await this.loadTokenFromDatabase();
        
        // Check again after reloading
        if (!this.oauth2Client.credentials || !this.oauth2Client.credentials.refresh_token) {
          throw new Error('No refresh token available after reloading from database.');
        }
        
        console.log('✅ Refresh token loaded from database');
      }

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update OAuth2 client with new credentials
      this.oauth2Client.setCredentials(credentials);
      
      // Save new token to database
      await this.saveTokenToDatabase(credentials);
      
      console.log('✅ Token refreshed successfully');
      return credentials;
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      
      // If refresh fails, try to get a new token using the refresh token
      if (typeof error.message === 'string' && error.message.includes('invalid_grant')) {
        console.log('🔄 Refresh token expired, attempting to get new token...');
        return await this.getNewToken();
      }
      
      throw error;
    }
  }

  async getNewToken() {
    try {
      console.log('🔑 Getting new Google Drive token...');
      
      // Generate authorization URL
      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file']
      });

      console.log('⚠️ Manual authorization required!');
      console.log('Please visit this URL to authorize the application:');
      console.log(authUrl);
      console.log('After authorization, the token will be automatically saved.');
      
      // In production, you might want to implement a webhook or admin interface
      // to handle the authorization callback
      throw new Error('Manual authorization required. Please visit the authorization URL.');
      
    } catch (error) {
      console.error('Error getting new token:', error);
      throw error;
    }
  }

  async ensureValidToken() {
    try {
      if (!this.oauth2Client.credentials) {
        console.log('🔄 No credentials found, loading from database...');
        await this.loadTokenFromDatabase();
      }

      const isExpired = this.isTokenExpired(this.oauth2Client.credentials);
      console.log('🔍 Token expiry check:', {
        isExpired: isExpired,
        expiryDate: this.oauth2Client.credentials?.expiry_date,
        currentTime: new Date().toISOString()
      });

      if (isExpired) {
        console.log('🔄 Token is expired, refreshing...');
        // Ensure we have a refresh_token before attempting refresh
        if (!this.oauth2Client.credentials.refresh_token) {
          console.log('🔄 No refresh token in credentials, trying to backfill from DB...');
          // Try to backfill refresh_token from DB
          try {
            const [rtRows] = await this.db.execute(
              `SELECT refresh_token FROM google_drive_tokens
               WHERE refresh_token IS NOT NULL
               ORDER BY created_at DESC
               LIMIT 1`
            );
            if (rtRows && rtRows.length > 0) {
              this.oauth2Client.setCredentials({
                ...this.oauth2Client.credentials,
                refresh_token: rtRows[0].refresh_token
              });
              console.log('✅ Refresh token backfilled from database');
            }
          } catch (_e) {
            console.log('❌ Failed to backfill refresh token:', _e.message);
          }
        }

        await this.refreshToken();
        console.log('✅ Token refresh completed');
      } else {
        console.log('✅ Token is still valid, no refresh needed');
      }

      return true;
    } catch (error) {
      console.error('Error ensuring valid token:', error);
      return false;
    }
  }

  async createDatabaseTable() {
    try {
      // Create table if it doesn't exist
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS google_drive_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          access_token TEXT NOT NULL,
          refresh_token TEXT NULL,
          expiry_date DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Try to modify existing table to allow NULL values (in case table already exists)
      try {
        await this.db.execute('ALTER TABLE google_drive_tokens MODIFY COLUMN refresh_token TEXT NULL');
        console.log('✅ Updated refresh_token column to allow NULL');
      } catch (alterError) {
        // Column might already be nullable, ignore this error
        console.log('ℹ️ refresh_token column already nullable or table is new');
      }
      
      try {
        await this.db.execute('ALTER TABLE google_drive_tokens MODIFY COLUMN expiry_date DATETIME NULL');
        console.log('✅ Updated expiry_date column to allow NULL');
      } catch (alterError) {
        // Column might already be nullable, ignore this error
        console.log('ℹ️ expiry_date column already nullable or table is new');
      }
      
      console.log('✅ Google Drive tokens table created/verified');
    } catch (error) {
      console.error('Error creating tokens table:', error);
      throw error;
    }
  }

  async getServiceStatus() {
    try {
      const [rows] = await this.db.execute(
        'SELECT COUNT(*) as count FROM google_drive_tokens'
      );
      
      const hasToken = rows[0].count > 0;
      const isExpired = hasToken ? this.isTokenExpired(this.oauth2Client.credentials) : true;
      
      return {
        hasToken,
        isExpired,
        isInitialized: !!this.drive,
        credentialsLoaded: !!this.credentials
      };
    } catch (error) {
      console.error('Error getting service status:', error);
      return {
        hasToken: false,
        isExpired: true,
        isInitialized: false,
        credentialsLoaded: false
      };
    }
  }
}

module.exports = new GoogleDriveTokenService();
