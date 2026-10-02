import { Router } from 'express';
import prisma from '../prisma.js';
import { asyncHandler } from '../asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } });
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
}));

router.put('/', requireAuth, asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const headline = String(req.body.headline || '').trim();
  const bio = String(req.body.bio || '').trim();
  const email = String(req.body.email || '').trim();
  const location = String(req.body.location || '').trim();

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const profile = await prisma.profile.upsert({
    where: { id: 1 },
    update: { name, headline, bio, email, location },
    create: { id: 1, name, headline, bio, email, location },
  });

  res.json(profile);
}));

export default router;
