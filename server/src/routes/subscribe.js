import { Router } from 'express';
import prisma from '../prisma.js';
import { asyncHandler } from '../asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();


router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(subscribers);
}));

router.post('/', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const firstName = String(req.body.firstName || '').trim();
  const lastName = String(req.body.lastName || '').trim();
  const consent = req.body.consent === true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email' });
  }
  if (!consent) {
    return res.status(400).json({ error: 'Check the box to subscribe' });
  }

  const subscriber = await prisma.subscriber.upsert({
    where: { email },
    update: { firstName, lastName },
    create: { email, firstName, lastName },
  });

  res.status(201).json({ id: subscriber.id, email: subscriber.email });
}));

export default router;
