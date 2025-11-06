import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables (dotenv only loads .env file, Railway variables are already in process.env)
dotenv.config();

// Debug: Log all environment variables
console.log('🔍 Environment Variables Debug:');
console.log('  Total env vars:', Object.keys(process.env).length);
console.log('  All DB_* vars:', Object.keys(process.env).filter(key => key.startsWith('DB_')).map(key => `${key}=${key === 'DB_PASSWORD' ? '***' : process.env[key]}`).join(', ') || 'NONE FOUND');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT);
console.log('  All env var names:', Object.keys(process.env).sort().join(', '));

// Use private Railway URL if available (for internal connections)
// MYSQL_URL format: mysql://user:pass@host:port/database
let dbHost = process.env.DB_HOST;
let dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

// Check if MYSQL_URL is available (from Railway MySQL service)
if (process.env.MYSQL_URL) {
  try {
    const mysqlUrl = process.env.MYSQL_URL;
    // Parse mysql://user:pass@host:port/database
    const match = mysqlUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (match && match[3].includes('railway.internal')) {
      dbHost = match[3]; // host
      dbPort = Number(match[4]); // port
      console.log('🔗 Using Railway private MySQL URL for internal connection');
    }
  } catch (e) {
    console.log('⚠️ Could not parse MYSQL_URL, using DB_HOST');
  }
}

// If DB_HOST is a public Railway URL (proxy.rlwy.net), use it with the correct port
// Railway's public MySQL URL uses a different port (usually 10170+)
if (dbHost && dbHost.includes('proxy.rlwy.net')) {
  // Try to get port from MYSQL_PUBLIC_URL if available
  if (process.env.MYSQL_PUBLIC_URL) {
    try {
      const publicUrl = process.env.MYSQL_PUBLIC_URL;
      const match = publicUrl.match(/mysql:\/\/[^@]+@[^:]+:(\d+)\//);
      if (match) {
        dbPort = Number(match[1]);
        console.log(`🔗 Using Railway public MySQL URL: ${dbHost}:${dbPort}`);
      } else {
        console.log('⚠️ Using public URL with default port');
      }
    } catch (e) {
      console.log('⚠️ Could not parse MYSQL_PUBLIC_URL, using default port');
    }
  } else {
    console.log('⚠️ MYSQL_PUBLIC_URL not available, using public URL with default port');
  }
}

// Log database configuration (without password)
const dbConfig = {
  host: dbHost,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? '***' : undefined,
  database: process.env.DB_NAME,
  port: dbPort,
};

console.log('🔍 Database Configuration:');
console.log('  DB_HOST:', dbConfig.host || '❌ NOT SET (will use localhost)');
console.log('  DB_USER:', dbConfig.user || '❌ NOT SET');
console.log('  DB_PASSWORD:', dbConfig.password ? '✅ SET' : '❌ NOT SET');
console.log('  DB_NAME:', dbConfig.database || '❌ NOT SET');
console.log('  DB_PORT:', dbConfig.port);

// Validate required environment variables
if (!process.env.DB_HOST) {
  console.error('⚠️ WARNING: DB_HOST is not set! The connection will attempt to use localhost.');
  console.error('⚠️ Please configure DB_HOST in Railway environment variables.');
}

if (!process.env.DB_USER) {
  console.error('⚠️ WARNING: DB_USER is not set!');
}

if (!process.env.DB_PASSWORD) {
  console.error('⚠️ WARNING: DB_PASSWORD is not set!');
}

if (!process.env.DB_NAME) {
  console.error('⚠️ WARNING: DB_NAME is not set!');
}

export const db = mysql.createPool({
  host: dbHost,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: dbPort,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 seconds timeout
});