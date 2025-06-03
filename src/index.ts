import express from 'express';
import dotenv from 'dotenv';
import { db } from '../src/db';
import volunteerRoutes from './routes/volunteer/volunteer_forms.routes';
import cors from 'cors'; 
import volunteerOptionRoutes from './routes/volunteer/volunteer_options.routes';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { adminUser } from './constanst/adminUser'; 
import { authenticateToken } from '../src/middleware/auth.middleware'; // Adjust path as needed
import donationRoutes from './routes/donations/donation.routes';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.use('/volunteers', volunteerRoutes);
app.use('/volunteer-options', volunteerOptionRoutes);
app.use('/donations', donationRoutes);
// Secret key for JWT (store securely in env variables in real apps)
const JWT_SECRET = 'your_jwt_secret_key';

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', username, password);

  if (username !== adminUser.username) {
    console.log('Username mismatch');
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash);
  console.log('Password valid:', isPasswordValid);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate JWT
  const token = jwt.sign(
    { username: adminUser.username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

const adminRouter = express.Router();

adminRouter.use(authenticateToken);

adminRouter.get('/', (req, res) => {
  res.json({ message: 'Welcome, admin!', user: (req as any).user });
});

// Add more admin routes here...

app.use('/admin', adminRouter);

db.getConnection()
  .then(() => console.log('MySQL connection successful!'))
  .catch((err) => {
    console.error('MySQL connection failed:', err);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});