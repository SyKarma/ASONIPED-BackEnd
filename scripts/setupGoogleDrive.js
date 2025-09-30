const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');

// Load environment variables
require('dotenv').config();

class GoogleDriveSetup {
  constructor() {
    this.oauth2Client = null;
    this.credentials = null;
    this.db = null;
  }

  async initialize() {
    try {
      // Load credentials
      const credentialsPath = path.join(__dirname, '../credentials/oauth-credentials.json');
      
      if (!fs.existsSync(credentialsPath)) {
        throw new Error('Credentials file not found. Please ensure oauth-credentials.json exists in the credentials directory.');
      }

      this.credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      // Initialize database connection
      this.db = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'asonipeddigitaltest',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Create table if it doesn't exist
      await this.createTable();

      // Initialize OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        this.credentials.web.client_id,
        this.credentials.web.client_secret,
        'http://localhost:3000/admin/google-drive/auth/callback'
      );

      return true;
    } catch (error) {
      console.error('Error initializing setup:', error);
      return false;
    }
  }

  async createTable() {
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
      console.error('Error creating table:', error);
      throw error;
    }
  }

  async saveToken(tokenData) {
    try {
      // Ensure all token values are properly defined
      const accessToken = tokenData.access_token || null;
      const refreshToken = tokenData.refresh_token || null;
      
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
      
      console.log('Token data to save:', {
        accessToken: accessToken ? 'present' : 'missing',
        refreshToken: refreshToken ? 'present' : 'missing',
        expiryDate: expiryDate || 'missing'
      });
      
      await this.db.execute(
        'INSERT INTO google_drive_tokens (access_token, refresh_token, expiry_date, created_at) VALUES (?, ?, ?, NOW())',
        [accessToken, refreshToken, expiryDate]
      );
      console.log('✅ Token saved to database');
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  }

  async getAuthorizationUrl() {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file']
    });

    return authUrl;
  }

  async getTokenFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error getting token from code:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      const response = await drive.files.list({
        pageSize: 1,
        fields: 'nextPageToken, files(id, name)'
      });
      
      console.log('✅ Google Drive connection test successful');
      console.log(`Found ${response.data.files.length} files in Drive`);
      return true;
    } catch (error) {
      console.error('❌ Google Drive connection test failed:', error);
      return false;
    }
  }

  async runSetup() {
    console.log('🚀 Google Drive Setup Script');
    console.log('============================\n');

    const initialized = await this.initialize();
    if (!initialized) {
      console.error('❌ Failed to initialize setup');
      return;
    }

    // Check if we already have a token
    try {
      const [rows] = await this.db.execute(
        'SELECT COUNT(*) as count FROM google_drive_tokens'
      );
      
      if (rows[0].count > 0) {
        console.log('⚠️ Token already exists in database');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise((resolve) => {
          rl.question('Do you want to replace it? (y/N): ', resolve);
        });
        
        rl.close();
        
        if (answer.toLowerCase() !== 'y') {
          console.log('Setup cancelled');
          return;
        }
        
        // Clear existing tokens
        await this.db.execute('DELETE FROM google_drive_tokens');
        console.log('🗑️ Existing tokens cleared');
      }
    } catch (error) {
      console.error('Error checking existing tokens:', error);
    }

    // Get authorization URL
    const authUrl = await this.getAuthorizationUrl();
    
    console.log('\n📋 Setup Instructions:');
    console.log('1. Visit the following URL in your browser:');
    console.log(`   ${authUrl}\n`);
    console.log('2. Sign in to your Google account');
    console.log('3. Grant the requested permissions');
    console.log('4. Copy the authorization code from the URL');
    console.log('5. Paste it below\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const code = await new Promise((resolve) => {
      rl.question('Enter the authorization code: ', resolve);
    });

    rl.close();

    if (!code.trim()) {
      console.log('❌ No authorization code provided');
      return;
    }

    try {
      // Get token from authorization code
      console.log('\n🔄 Getting access token...');
      const tokens = await this.getTokenFromCode(code.trim());
      
      // Save token to database
      console.log('💾 Saving token to database...');
      await this.saveToken(tokens);
      
      // Test connection
      console.log('🧪 Testing connection...');
      const testResult = await this.testConnection();
      
      if (testResult) {
        console.log('\n✅ Google Drive setup completed successfully!');
        console.log('🎉 Your application can now upload files to Google Drive automatically.');
        console.log('🔄 Tokens will be refreshed automatically when they expire.');
      } else {
        console.log('\n❌ Setup completed but connection test failed');
        console.log('Please check your credentials and try again.');
      }
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      console.log('\nTroubleshooting:');
      console.log('- Make sure you copied the authorization code correctly');
      console.log('- Check that your OAuth credentials are valid');
      console.log('- Ensure the redirect URI matches your credentials file');
    }
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  // Check if we're in production and restrict access
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Production environment detected.');
    console.log('This script should only be run by authorized administrators.');
    console.log('To proceed, set ALLOW_GOOGLE_DRIVE_SETUP=true');
    
    if (process.env.ALLOW_GOOGLE_DRIVE_SETUP !== 'true') {
      console.log('❌ Setup blocked in production environment.');
      process.exit(1);
    }
  }
  
  const setup = new GoogleDriveSetup();
  setup.runSetup().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = GoogleDriveSetup;
