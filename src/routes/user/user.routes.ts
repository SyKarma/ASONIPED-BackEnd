import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { db } from '../../db';
import { authenticateToken, AuthRequest } from '../../middleware/auth.middleware';
import bcrypt from 'bcrypt';

const router = express.Router();

// List all users
const getUsers: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [users] = await db.query('SELECT id, username FROM admins');
    res.json(users);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Create new user
const createUser: RequestHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'Missing required fields' });
    return;
  }

  try {
    // Check if user already exists
    const [existingUsers] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      res.status(400).json({ message: 'Username already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await db.query(
      'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      [username, hashedPassword]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

// Update user
const updateUser: RequestHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { username, password } = req.body;

  if (!username) {
    res.status(400).json({ message: 'Missing required fields' });
    return;
  }

  try {
    // Check if user exists
    const [users] = await db.query('SELECT * FROM admins WHERE id = ?', [id]);
    if (Array.isArray(users) && users.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update user
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE admins SET username = ?, password_hash = ? WHERE id = ?',
        [username, hashedPassword, id]
      );
    } else {
      await db.query(
        'UPDATE admins SET username = ? WHERE id = ?',
        [username, id]
      );
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

router.get('/', authenticateToken, getUsers);
router.post('/', authenticateToken, createUser);
router.put('/:id', authenticateToken, updateUser);

export default router;