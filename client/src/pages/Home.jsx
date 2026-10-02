import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import IntroHero from '../components/IntroHero.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import { getVideoSource } from '../video.js';

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
  const finishIntro = useCallback(() => setIntroDone(true), []);

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
        <section className="about-band">
          {profile.location ? <p className="eyebrow">{profile.location}</p> : null}
          {profile.headline ? <p className="headline">{profile.headline}</p> : null}
          {profile.bio ? <p className="bio">{profile.bio}</p> : null}
          {profile.email ? (
            <a className="contact" href={`mailto:${profile.email}`}>{profile.email}</a>
          ) : null}
        </section>

        <section className="work" id="work">
          <h2 className="section-label">Work</h2>
          {videos.length === 0 ? (
            <p className="empty">New videos will show up here.</p>
          ) : (
            videos.map((post) => (
              <article className="post" key={post.id}>
                <p className="post-date">{formatDate(post.publishedAt)}</p>
                <h3 className="post-title">{post.title}</h3>
                <p className="description">{post.description}</p>
                <VideoPlayer post={post} />
              </article>
            ))
          )}
        </section>
      </main>

      <footer className="footer">
        <span>{profile.name}</span>
      </footer>
    </div>
  );
}
