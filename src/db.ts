import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Log database configuration (without password)
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ? '***' : undefined,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
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
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});