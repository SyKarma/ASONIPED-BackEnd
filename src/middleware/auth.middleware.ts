import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Environment variables for authentication
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * Extended Request interface with user authentication data
 */
export interface AuthRequest extends Request {
  user?: {
    username: string;
    role?: string;
    userId?: number;
  };
}

/**
 * Authenticate admin users using JWT token
 */
export const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role?: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};

/**
 * Authenticate users using JWT token with enhanced user ID handling
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      username: string; 
      role?: string; 
      userId?: number; 
      id?: number 
    };
    
    // Ensure userId is available for consistent access
    if (decoded.userId) {
      (req as any).user = { ...decoded, userId: decoded.userId };
    } else if (decoded.id) {
      (req as any).user = { ...decoded, userId: decoded.id };
    } else {
      (req as any).user = decoded;
    }
    
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};