import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables (dotenv only loads .env file, Railway variables are already in process.env)
dotenv.config();

// Use private Railway URL if available (for internal connections)
// MYSQL_URL format: mysql://user:pass@host:port/database
let dbHost = process.env.DB_HOST;
let dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

// Check if MYSQL_PUBLIC_URL is available first (more reliable than internal URL)
// MYSQL_PUBLIC_URL format: mysql://user:pass@host:port/database
if (process.env.MYSQL_PUBLIC_URL) {
  try {
    const publicUrl = process.env.MYSQL_PUBLIC_URL.trim();
    const match = publicUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (match) {
      dbHost = match[3]; // host (e.g., turntable.proxy.rlwy.net)
      dbPort = Number(match[4]); // port
    }
  } catch {
    // ignore parse errors; fall through to other env sources
  }
}

// Check if MYSQL_URL is available (from Railway MySQL service)
// Only use if MYSQL_PUBLIC_URL is not available
if (!dbHost && process.env.MYSQL_URL) {
  try {
    const mysqlUrl = process.env.MYSQL_URL.trim();
    // Parse mysql://user:pass@host:port/database
    const match = mysqlUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (match) {
      const hostname = match[3];
      // Prefer public URLs over internal ones
      if (hostname.includes('proxy.rlwy.net') || hostname.includes('turntable.proxy.rlwy.net')) {
        dbHost = hostname;
        dbPort = Number(match[4]);
      } else if (hostname.includes('railway.internal')) {
        dbHost = hostname;
        dbPort = Number(match[4]);
      }
    }
  } catch {
    // ignore parse errors
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
      } else {
        // Default to 10170 for Railway public MySQL
        dbPort = 10170;
      }
    } catch {
      // Default to 10170 for Railway public MySQL
      dbPort = 10170;
    }
  } else {
    // Default to 10170 for Railway public MySQL when MYSQL_PUBLIC_URL is not available
    dbPort = 10170;
  }
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
