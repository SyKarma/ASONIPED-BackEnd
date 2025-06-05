import express from 'express';
import dotenv from 'dotenv';
import { db } from '../src/db';
import volunteerRoutes from './routes/volunteer/volunteer_forms.routes';
import cors from 'cors'; 
import volunteerOptionRoutes from './routes/volunteer/volunteer_options.routes';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../src/middleware/auth.middleware'; // Adjust path as needed
import donationRoutes from './routes/donations/donation.routes';
import eventsNewsRoutes from './routes/Events/eventsNews.routes';
import attendanceRoutes from './routes/attendance/attendance.routes';
import workshopEnrollmentRoutes from './routes/workshop/enrollment.routes';
import enrollmentRoutes from './routes/workshop/enrollment.routes';
import workshopRoutes from './routes/workshop/workshop.routes';
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
app.use('/events-news', eventsNewsRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/workshop-enrollments', workshopEnrollmentRoutes);
app.use('/enrollments', enrollmentRoutes);
app.use('/workshops', workshopRoutes);
// Secret key for JWT (store securely in env variables in real apps)
const JWT_SECRET = 'your_jwt_secret_key';

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
  if (rows.length === 0) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const admin = rows[0];
  const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { username: admin.username, role: 'admin' },
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