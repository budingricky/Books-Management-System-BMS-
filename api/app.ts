/**
 * This is a API server
 */

import express, { type Request, type Response }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import booksRoutes from './routes/books.js';
import borrowsRoutes from './routes/borrows.js';
import categoriesRoutes from './routes/categories.js';
import isbnRoutes from './routes/isbn.js';
import settingsRoutes from './routes/settings.js';
import statisticsRoutes from './routes/statistics.js';
import exportRoutes from './routes/export.js';
import database from './database/database.js';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();

const app: express.Application = express();

// Initialize database
database.init();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/borrows', borrowsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/isbn', isbnRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/export', exportRoutes);

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
    database: 'Connected',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Catch all handler for SPA
app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
});

/**
 * error handler middleware
 */
app.use((err: Error, req: Request, res: Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;