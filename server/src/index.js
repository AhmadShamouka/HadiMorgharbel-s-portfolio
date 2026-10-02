import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import { envPath, uploadsDir } from './paths.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import videoRoutes from './routes/videos.js';
import subscribeRoutes from './routes/subscribe.js';

dotenv.config({ path: envPath });

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Add it to server/.env');
  process.exit(1);
}

fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const port = Number(process.env.PORT) || 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/subscribe', subscribeRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  const uploadError = err?.name === 'MulterError' || err?.message === 'Upload a video file';
  if (!uploadError) console.error(err);
  if (res.headersSent) return next(err);
  res.status(uploadError ? 400 : 500).json({
    error: uploadError ? err.message : 'Server error',
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${port}`);
});
