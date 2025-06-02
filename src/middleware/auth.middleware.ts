import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ADMIN_TOKEN=supersecrettoken
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';

const JWT_SECRET = 'your_jwt_secret_key'; // Use the same secret as in your login route

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  if (token !== ADMIN_TOKEN) {
    res.status(403).json({ error: 'Forbidden: Invalid token' });
    return;
  }
  next();
};

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ message: 'Invalid token' });
      return;
    }
    (req as any).user = user; // Attach user info to request
    next();
  });
}