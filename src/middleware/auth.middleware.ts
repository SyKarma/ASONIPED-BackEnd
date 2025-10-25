import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sessionService } from '../services/session.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export interface AuthRequest extends Request {
  user?: {
    username: string;
    role?: string;
    userId?: number;
  };
}


export const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      username: string; 
      roles?: string[]; 
      role?: string; 
      userId?: number; 
      id?: number 
    };
    
    // Ensure userId is available for session validation
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      res.status(403).json({ error: 'Invalid token: No user ID' });
      return;
    }
    
    // Check if this token is the active session for this user
    if (!sessionService.isTokenValid(userId, token)) {
      res.status(401).json({ 
        error: 'Session invalidated. Please log in again.',
        code: 'SESSION_INVALIDATED'
      });
      return;
    }
    
    // Check if user has admin role
    const hasAdminRole = decoded.roles?.includes('admin') || decoded.role === 'admin';
    
    if (!hasAdminRole) {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }
    
    req.user = { ...decoded, userId };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};


export const verifyToken = async (token: string): Promise<{ username: string; role?: string; userId?: number }> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      username: string; 
      role?: string; 
      userId?: number; 
      id?: number 
    };
    
    // Ensure userId is available for consistent access
    if (decoded.userId) {
      return { ...decoded, userId: decoded.userId };
    } else if (decoded.id) {
      return { ...decoded, userId: decoded.id };
    } else {
      return decoded;
    }
  } catch (error) {
    throw new Error('Invalid token');
  }
};


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
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      res.status(403).json({ message: 'Invalid token: No user ID' });
      return;
    }

    // Check if this token is the active session for this user
    const isTokenValid = sessionService.isTokenValid(userId, token);
    
    if (!isTokenValid) {
      res.status(401).json({ 
        message: 'Session invalidated. Please log in again.',
        code: 'SESSION_INVALIDATED'
      });
      return;
    }
    
    (req as any).user = { ...decoded, userId };
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};