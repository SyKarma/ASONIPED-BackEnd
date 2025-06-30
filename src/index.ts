import express from 'express';
import dotenv from 'dotenv';
import { db } from '../src/db';
import volunteerRoutes from './routes/volunteer/volunteer_forms.routes';
import cors from 'cors'; 
import volunteerOptionRoutes from './routes/volunteer/volunteer_options.routes';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../src/middleware/auth.middleware';
import donationRoutes from './routes/donations/donation.routes';
import eventsNewsRoutes from './routes/Events/eventsNews.routes';
import attendanceRoutes from './routes/attendance/attendance.routes';
import workshopEnrollmentRoutes from './routes/workshop/enrollment.routes';
import enrollmentRoutes from './routes/workshop/enrollment.routes';
import workshopRoutes from './routes/workshop/workshop.routes';
import userRoutes from './routes/user/user.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Public login endpoint
app.post('/login', async (req, res): Promise<void> => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]) as [any[], any];
    if (Array.isArray(rows) && rows.length === 0) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const admin = rows[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign(
      { username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error during login' });
  }
});

// Routes - some public, some protected
app.use('/users', userRoutes);
app.use('/volunteers', volunteerRoutes); // Individual routes are protected in the route file
app.use('/volunteer-options', volunteerOptionRoutes); // GET is public, others protected in route file
app.use('/donations', donationRoutes); // Individual routes are protected in the route file
app.use('/events-news', eventsNewsRoutes); // GET is public, others protected in route file
app.use('/attendance', attendanceRoutes); // Individual routes are protected in the route file
app.use('/workshop-enrollments', workshopEnrollmentRoutes); // Individual routes are protected in the route file
app.use('/enrollments', enrollmentRoutes); // Individual routes are protected in the route file
app.use('/workshops', workshopRoutes); // Individual routes are protected in the route file

db.getConnection()
  .then(() => console.log('MySQL connection successful!'))
  .catch((err) => {
    console.error('MySQL connection failed:', err);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});