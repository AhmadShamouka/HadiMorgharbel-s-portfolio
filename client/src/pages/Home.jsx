import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import IntroHero from '../components/IntroHero.jsx';
import { getVideoSource } from '../video.js';

const services = [
  {
    title: 'Commercials',
    text: 'Bringing brands and products to life through cinematic storytelling.',
    icon: 'reel',
  },
  {
    title: 'Brand Films',
    text: 'Authentic stories that connect people with brands and experiences.',
    icon: 'screen',
  },
  {
    title: 'Fashion',
    text: 'Visual narratives crafted around style, identity, and movement.',
    icon: 'boot',
  },
  {
    title: 'Creative Projects',
    text: 'Personal films and artistic explorations driven by passion.',
    icon: 'plane',
  },
  {
    title: 'Event Coverage',
    text: 'Capturing the energy and atmosphere of live moments.',
    icon: 'spark',
  },
];

function ServiceIcon({ name }) {
  const common = {
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.6',
    'aria-hidden': true,
  };
  if (name === 'screen') {
    return (
      <svg {...common}>
        <rect x="8" y="12" width="32" height="20" rx="2" />
        <path d="M18 38h12M24 32v6" />
      </svg>
    );
  }
  if (name === 'boot') {
    return (
      <svg {...common}>
        <path d="M16 10h8l2 8 8 4v8H14v-6l2-4V10z" />
        <path d="M14 30h20" />
      </svg>
    );
  }
  if (name === 'plane') {
    return (
      <svg {...common}>
        <path d="M8 24l32-10-8 22-6-8-8 6 2-10-12 0z" />
      </svg>
    );
  }
  if (name === 'spark') {
    return (
      <svg {...common}>
        <path d="M24 8v8M24 32v8M8 24h8M32 24h8M13 13l6 6M29 29l6 6M35 13l-6 6M19 29l-6 6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="10" y="16" width="22" height="16" rx="2" />
      <circle cx="32" cy="24" r="6" />
      <path d="M16 16v-3h8v3" />
    </svg>
  );
}

function formatClock(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
}

function categorySections(videos) {
  const order = services.map((item) => item.title);
  const buckets = new Map();
  for (const post of videos) {
    const name = post.category || 'Work';
    if (!buckets.has(name)) buckets.set(name, []);
    buckets.get(name).push(post);
  }
  const names = [
    ...order.filter((name) => buckets.has(name)),
    ...[...buckets.keys()].filter((name) => !order.includes(name)),
  ];
  return names.map((name) => {
    const posts = buckets.get(name);
    const main = posts.find((post) => post.featured) || posts[0];
    return { name, posts, main };
  });
}

function ReelSlide({ category, post, onOpen }) {
  const source = getVideoSource(post);

  return (
    <article className="reel-slide">
      {source?.type === 'file' ? (
        <video className="reel-media" src={source.src} muted playsInline preload="metadata" />
      ) : null}
      <div className="reel-shade">
        <h3>{category}</h3>
        <p>{post.title}</p>
        {source ? (
          <button className="reel-play" type="button" onClick={onOpen}>Play Video</button>
        ) : null}
        <button className="reel-more" type="button" onClick={onOpen}>{category} +</button>
      </div>
    </article>
  );
}

function WatchModal({ videos, activeId, onSelect, onClose }) {
  const active = videos.find((post) => post.id === activeId) || videos[0];
  const source = active ? getVideoSource(active) : null;
  const stripRef = useRef(null);
  const [duration, setDuration] = useState('');
  const index = videos.findIndex((post) => post.id === active?.id);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => {
    setDuration('');
    const card = stripRef.current?.querySelector('.is-on');
    card?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeId]);

  if (!active) return null;

  function step(direction) {
    if (videos.length < 2) return;
    const next = videos[(index + direction + videos.length) % videos.length];
    onSelect(next.id);
  }

  return (
    <div className="watch" role="dialog" aria-modal="true" aria-label={active.title}>
      <button className="watch-close" type="button" onClick={onClose} aria-label="Close">×</button>
      <div className="watch-stage">
        {source?.type === 'file' ? (
          <video
            key={source.src}
            src={source.src}
            controls
            autoPlay
            playsInline
            onLoadedMetadata={(event) => setDuration(formatClock(event.currentTarget.duration))}
          />
        ) : null}
        {source?.type === 'embed' ? (
          <iframe
            key={source.src}
            src={`${source.src}?autoplay=1`}
            title={active.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : null}
      </div>
      <div className="watch-copy">
        <h3>{active.title}</h3>
        {duration ? <p className="watch-time">{duration}</p> : null}
        {active.description ? <p className="watch-text">{active.description}</p> : null}
      </div>
      <div className="watch-strip">
        <button className="watch-arrow" type="button" onClick={() => step(-1)} aria-label="Previous video">‹</button>
        <div className="watch-thumbs" ref={stripRef}>
          {videos.map((post) => {
            const thumb = getVideoSource(post);
            const current = post.id === active.id;
            return (
              <button
                key={post.id}
                className={current ? 'watch-thumb is-on' : 'watch-thumb'}
                type="button"
                onClick={() => onSelect(post.id)}
              >
                {thumb?.type === 'file' ? (
                  <video src={thumb.src} muted playsInline preload="metadata" />
                ) : (
                  <span className="watch-fallback">{post.title}</span>
                )}
                {current ? <span className="watch-now">Now Playing</span> : null}
              </button>
            );
          })}
        </div>
        <button className="watch-arrow" type="button" onClick={() => step(1)} aria-label="Next video">›</button>
      </div>
    </div>
  );
}

function SiteCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine) return undefined;
    setActive(true);

    const point = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { ...point };
    let frame = 0;

    const paint = (node, x, y) => {
      if (node) node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const onMove = (event) => {
      point.x = event.clientX;
      point.y = event.clientY;
      paint(dotRef.current, point.x, point.y);
      const field = event.target instanceof Element && event.target.closest('input, textarea, select');
      const hot = event.target instanceof Element && event.target.closest('a, button');
      document.documentElement.classList.toggle('cursor-field', Boolean(field));
      document.documentElement.classList.toggle('cursor-hot', Boolean(hot) && !field);
    };

    const onLeave = () => {
      document.documentElement.classList.add('cursor-off');
    };

    const onEnter = () => {
      document.documentElement.classList.remove('cursor-off');
    };

    const tick = () => {
      const ease = reduced ? 1 : 0.18;
      ring.x += (point.x - ring.x) * ease;
      ring.y += (point.y - ring.y) * ease;
      paint(ringRef.current, ring.x, ring.y);
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.documentElement.classList.remove('cursor-field', 'cursor-hot', 'cursor-off');
    };
  }, []);

  if (!active) return null;

  return (
    <>
      <div className="cursor-dot" ref={dotRef} />
      <div className="cursor-ring" ref={ringRef} />
    </>
  );
}

function ContactBand({ profile }) {
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    consent: true,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setSending(true);
    try {
      await api('/api/subscribe', { method: 'POST', body: form });
      setMessage('You are on the list.');
      setForm({ email: '', firstName: '', lastName: '', consent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <footer className="touch">
      <div className="touch-intro">
        <h2>Get in Touch</h2>
        <p className="touch-lead">let&apos;s collaborate on your next project</p>
        <p className="touch-label">contact</p>
        {profile.email ? <a href={`mailto:${profile.email}`}>{profile.email}</a> : null}
        {profile.phone ? <a href={`tel:${profile.phone.replace(/\s/g, '')}`}>{profile.phone}</a> : null}
      </div>
      <form className="touch-form" onSubmit={submit}>
        <h2>Join my mailing list</h2>
        <label>
          Email*
          <input
            type="email"
            required
            placeholder="Enter your email here"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>
        <label className="touch-check">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(event) => setForm({ ...form, consent: event.target.checked })}
          />
          Yes, subscribe me to your newsletter.
        </label>
        <label>
          First name
          <input
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
          />
        </label>
        <label>
          Last name
          <input
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
          />
        </label>
        {profile.phone ? <p>{profile.phone}</p> : null}
        {profile.location ? <p>{profile.location}</p> : null}
        {profile.headline ? <p>{profile.headline}</p> : null}
        <button type="submit" disabled={sending}>Subscribe Now</button>
        {message ? <p className="touch-note">{message}</p> : null}
        {error ? <p className="touch-note is-error">{error}</p> : null}
      </form>
    </footer>
  );
}

function reelSource(videos) {
  for (const post of videos) {
    const source = getVideoSource(post);
    if (source?.type === 'file') return source.src;
  }
  return '';
}

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');
  const [introDone, setIntroDone] = useState(false);
  const [watch, setWatch] = useState(null);
  const finishIntro = useCallback(() => setIntroDone(true), []);
  const closeWatch = useCallback(() => setWatch(null), []);
  const sections = categorySections(videos);

  useEffect(() => {
    Promise.all([api('/api/profile'), api('/api/videos')])
      .then(([profileData, videoData]) => {
        setProfile(profileData);
        setVideos(videoData);
        if (profileData.name) document.title = profileData.name;
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p className="status">{error}</p>;
  }

  if (!profile) {
    return <p className="status">Loading…</p>;
  }

  return (
    <div className="site site-home">
      <SiteCursor />
      <header className={introDone ? 'site-header is-on' : 'site-header is-off'}>
        <a className="brand" href="#top">
          <img src="/logo.png" alt={profile.name} />
        </a>
        <nav>
          <a href="#work">Work</a>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>

      <IntroHero
        name={profile.name}
        videoSrc={reelSource(videos)}
        onReady={finishIntro}
      />

      <main>
        <section className="about-hold" aria-label="About">
          <div className="about-page">
            <div className="about-photo">
              <img src="/portrait.jpg" alt="" />
            </div>
            <div className="about-copy">
              <h2>{profile.name}</h2>
              {profile.headline ? <p className="about-roles">{profile.headline}</p> : null}
              {profile.bio ? <p className="about-bio">{profile.bio}</p> : null}
            </div>
          </div>
        </section>

        <section className="services" aria-label="Services">
          {services.map((item) => (
            <article key={item.title}>
              <ServiceIcon name={item.icon} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </section>

        <section className="reels" id="work">
          {sections.length === 0 ? (
            <p className="empty">New videos will show up here.</p>
          ) : (
            sections.map((section) => (
              <ReelSlide
                key={section.name}
                category={section.name}
                post={section.main}
                onOpen={() => setWatch({ id: section.main.id, videos: section.posts })}
              />
            ))
          )}
        </section>
      </main>

      <ContactBand profile={profile} />
      {watch ? (
        <WatchModal
          videos={watch.videos}
          activeId={watch.id}
          onSelect={(id) => setWatch({ id, videos: watch.videos })}
          onClose={closeWatch}
        />
      ) : null}
    </div>
  );
}
