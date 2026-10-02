import fs from 'fs/promises';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import prisma from '../prisma.js';
import { uploadsDir } from '../paths.js';
import { asyncHandler } from '../asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Upload a video file'));
  },
});

const categories = [
  'Commercials',
  'Brand Films',
  'Fashion',
  'Creative Projects',
  'Event Coverage',
];

function present(post) {
  return {
    id: post.id,
    title: post.title,
    description: post.description,
    category: post.category,
    featured: post.featured,
    videoUrl: post.videoUrl,
    videoFileUrl: post.videoFile ? `/uploads/${post.videoFile}` : '',
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
  };
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

function parseCategory(value) {
  const category = String(value || '').trim();
  return categories.includes(category) ? category : '';
}

function parseDate(value) {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function removeStoredFile(filename) {
  if (!filename) return;
  const target = path.resolve(uploadsDir, filename);
  const base = uploadsDir.endsWith(path.sep) ? uploadsDir : uploadsDir + path.sep;
  if (!target.startsWith(base)) return;
  await fs.unlink(target).catch((err) => {
    if (err.code !== 'ENOENT') throw err;
  });
}

async function rejectUpload(req, res, status, error) {
  if (req.file) await removeStoredFile(req.file.filename);
  return res.status(status).json({ error });
}

router.get('/', asyncHandler(async (req, res) => {
  const posts = await prisma.videoPost.findMany({
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
  });
  res.json(posts.map(present));
}));

router.post('/', requireAuth, upload.single('video'), asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const videoUrl = String(req.body.videoUrl || '').trim();
  const category = parseCategory(req.body.category);
  const featured = req.body.featured === 'true';
  const publishedAt = parseDate(req.body.publishedAt);

  if (!title) return rejectUpload(req, res, 400, 'Title is required');
  if (!description) return rejectUpload(req, res, 400, 'Description is required');
  if (!category) return rejectUpload(req, res, 400, 'Choose a category');
  if (!publishedAt) return rejectUpload(req, res, 400, 'Date is invalid');
  if (!videoUrl && !req.file) {
    return rejectUpload(req, res, 400, 'Add a video link or upload a video file');
  }

  try {
    const post = await prisma.$transaction(async (tx) => {
      if (featured) {
        await tx.videoPost.updateMany({ where: { category, featured: true }, data: { featured: false } });
      }
      return tx.videoPost.create({
        data: {
          title,
          description,
          videoUrl,
          category,
          featured,
          videoFile: req.file ? req.file.filename : '',
          publishedAt,
        },
      });
    });
    res.status(201).json(present(post));
  } catch (err) {
    if (req.file) await removeStoredFile(req.file.filename);
    throw err;
  }
}));

router.put('/:id', requireAuth, upload.single('video'), asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return rejectUpload(req, res, 400, 'Invalid video');

  const existing = await prisma.videoPost.findUnique({ where: { id } });
  if (!existing) return rejectUpload(req, res, 404, 'Video not found');

  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const videoUrl = String(req.body.videoUrl || '').trim();
  const category = parseCategory(req.body.category);
  const featured = req.body.featured === 'true';
  const publishedAt = parseDate(req.body.publishedAt);
  const nextFile = req.file
    ? req.file.filename
    : req.body.removeFile === 'true'
      ? ''
      : existing.videoFile;

  if (!title) return rejectUpload(req, res, 400, 'Title is required');
  if (!description) return rejectUpload(req, res, 400, 'Description is required');
  if (!category) return rejectUpload(req, res, 400, 'Choose a category');
  if (!publishedAt) return rejectUpload(req, res, 400, 'Date is invalid');
  if (!videoUrl && !nextFile) {
    return rejectUpload(req, res, 400, 'Add a video link or upload a video file');
  }

  try {
    const post = await prisma.$transaction(async (tx) => {
      if (featured) {
        await tx.videoPost.updateMany({
          where: { category, featured: true, NOT: { id } },
          data: { featured: false },
        });
      }
      return tx.videoPost.update({
        where: { id },
        data: { title, description, videoUrl, videoFile: nextFile, category, featured, publishedAt },
      });
    });
    if (existing.videoFile && existing.videoFile !== nextFile) {
      await removeStoredFile(existing.videoFile);
    }
    res.json(present(post));
  } catch (err) {
    if (req.file) await removeStoredFile(req.file.filename);
    throw err;
  }
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid video' });

  const existing = await prisma.videoPost.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Video not found' });

  await prisma.videoPost.delete({ where: { id } });
  await removeStoredFile(existing.videoFile);
  res.json({ ok: true });
}));

export default router;
