import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
dotenv.config({ path: envPath });

const { default: prisma } = await import('../src/prisma.js');

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');

if (!email || password.length < 8) {
  console.error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters in server/.env');
  process.exit(1);
}

const existingAdmin = await prisma.admin.findUnique({ where: { email } });
if (!existingAdmin) {
  await prisma.admin.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  console.log(`Admin created for ${email}`);
} else {
  console.log(`Admin already exists for ${email}`);
}

const profile = await prisma.profile.findUnique({ where: { id: 1 } });
if (!profile) {
  await prisma.profile.create({
    data: {
      id: 1,
      name: 'Hadi Mogharbel',
      headline: 'Cinematographer / Filmmaker / Editor / Visual Artist',
      bio: 'I am a visual storyteller who loves creating meaningful images and bringing ideas to life through film. My work includes commercials, branded content, events, and documentary-style projects, always aiming to create natural, engaging, and cinematic visuals. Explore my work and see the diverse range of projects I\'ve been involved in.',
      email: 'hadimogharbel@gmail.com',
      phone: '+971543650898',
      location: 'UAE',
    },
  });

  await prisma.videoPost.create({
    data: {
      title: 'Example video',
      description:
        'Descriptions stay above the video. Replace this example from the admin page, or delete it and add the real ones.',
      videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      category: 'Commercials',
      featured: true,
      publishedAt: new Date(),
    },
  });
  console.log('Placeholder profile and example video created');
} else {
  console.log('Profile already exists, left unchanged');
}

await prisma.$disconnect();
