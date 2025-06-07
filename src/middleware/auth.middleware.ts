import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ADMIN_TOKEN=supersecrettoken
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export interface AuthRequest extends Request {
  user?: {
    username: string;
    role?: string;
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
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role?: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return Promise.resolve();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role?: string };
    req.user = decoded;
    next();
    return Promise.resolve();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
    return Promise.resolve();
  }
};