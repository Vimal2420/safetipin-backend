import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import destinationRoutes from './routes/destinationRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import guardingRoutes from './routes/guardingRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import trustedRoutes from './routes/trustedRoutes.js';
import policeRoutes from './routes/policeRoutes.js';
import seedDatabase from './utils/seeder.js';

// Load env vars
dotenv.config();

// Connect to database and seed
connectDB().then(async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      await seedDatabase();
    } catch (err) {
      console.error('Seeding error:', err);
    }
  }
}).catch(err => {
  console.error('DB Connection error:', err);
});

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- ABSOLUTE TOP LOGGER ---
app.use((req, res, next) => {
  console.log(`[TOP] Incoming: ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Request Logger (with body)
app.use((req, res, next) => {
  if (req.originalUrl.includes('/auth/')) {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      if (req.body && Object.keys(req.body).length > 0) {
        console.log(`  Body: ${JSON.stringify(req.body)}`);
      }
  }
  next();
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/guarding', guardingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/trusted-dashboard', trustedRoutes);
app.use('/api/police', policeRoutes);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root route
app.get('/', (req, res) => {
  res.send('Women Safety API is running...');
});

app.get('/api/health', (req, res) => {
  const isAtlas = mongoose.connection.host.includes('mongodb.net');
  res.status(200).json({
    status: 'running',
    message: 'Women Safety API is running...',
    database: isAtlas ? 'Atlas (Production)' : 'In-Memory (Empty/Testing)',
    host: mongoose.connection.host,
    timestamp: new Date()
  });
});

// 404 Handler - MUST be after all routes
app.use((req, res, next) => {
  res.status(404).json({
    message: `Not Found - ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://0.0.0.0:${PORT}`);
});

// Catch unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
