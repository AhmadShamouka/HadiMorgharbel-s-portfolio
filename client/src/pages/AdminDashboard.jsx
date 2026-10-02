import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import VideoPlayer from '../components/VideoPlayer.jsx';

function toLocalInput(value) {
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const videoCategories = [
  'Commercials',
  'Brand Films',
  'Fashion',
  'Creative Projects',
  'Event Coverage',
];

function videoFormData({ title, description, videoUrl, category, featured, publishedAt, file, removeFile }) {
  const data = new FormData();
  data.append('title', title);
  data.append('description', description);
  data.append('videoUrl', videoUrl);
  data.append('category', category);
  data.append('featured', featured ? 'true' : 'false');
  data.append('publishedAt', publishedAt);
  if (file) data.append('video', file);
  if (removeFile) data.append('removeFile', 'true');
  return data;
}

const blankVideo = () => ({
  title: '',
  description: '',
  videoUrl: '',
  category: 'Commercials',
  featured: false,
  publishedAt: toLocalInput(new Date()),
  file: null,
});

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [draft, setDraft] = useState(blankVideo);
  const [draftMessage, setDraftMessage] = useState('');
  const [draftError, setDraftError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState(null);
  const [editError, setEditError] = useState('');
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fileKey, setFileKey] = useState(0);
  const [saving, setSaving] = useState(false);

  async function loadContent() {
    const [profileData, videoData] = await Promise.all([
      api('/api/profile'),
      api('/api/videos'),
    ]);
    setProfile(profileData);
    setVideos(videoData);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await api('/api/auth/me');
        if (!active) return;
        setEmail(me.email);
        await loadContent();
        if (active) setReady(true);
      } catch (err) {
        if (!active) return;
        if (err.status === 401) navigate('/admin/login');
        else setLoadError(err.message);
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  async function saveProfile(event) {
    event.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setSaving(true);
    try {
      const saved = await api('/api/profile', {
        method: 'PUT',
        body: {
          name: profile.name,
          headline: profile.headline,
          bio: profile.bio,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
        },
      });
      setProfile(saved);
      setProfileMessage('Profile saved.');
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addVideo(event) {
    event.preventDefault();
    setDraftError('');
    setDraftMessage('');
    setSaving(true);
    try {
      await api('/api/videos', { method: 'POST', body: videoFormData(draft), isForm: true });
      setDraft(blankVideo());
      setFileKey((n) => n + 1);
      await loadContent();
      setDraftMessage('Video added.');
    } catch (err) {
      setDraftError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(post) {
    setEditingId(post.id);
    setEdit({
      title: post.title,
      description: post.description,
      videoUrl: post.videoUrl || '',
      category: post.category || 'Commercials',
      featured: Boolean(post.featured),
      publishedAt: toLocalInput(post.publishedAt),
      file: null,
      removeFile: false,
    });
    setEditError('');
  }

  async function saveEdit(event) {
    event.preventDefault();
    setEditError('');
    setSaving(true);
    try {
      await api(`/api/videos/${editingId}`, {
        method: 'PUT',
        body: videoFormData(edit),
        isForm: true,
      });
      setEditingId(null);
      setEdit(null);
      await loadContent();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeVideo(id) {
    if (!window.confirm('Delete this video?')) return;
    setDraftError('');
    try {
      await api(`/api/videos/${id}`, { method: 'DELETE' });
      if (editingId === id) {
        setEditingId(null);
        setEdit(null);
      }
      await loadContent();
    } catch (err) {
      setDraftError(err.message);
    }
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    navigate('/');
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    try {
      await api('/api/auth/password', { method: 'POST', body: password });
      setPassword({ currentPassword: '', newPassword: '' });
      setPasswordMessage('Password updated.');
    } catch (err) {
      setPasswordError(err.message);
    }
  }

  if (loadError) {
    return <p className="status">{loadError}</p>;
  }

  if (!ready || !profile) {
    return <p className="status">Loading admin…</p>;
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Signed in as {email}</p>
          <h1>Edit portfolio</h1>
        </div>
        <div className="actions">
          <Link className="btn btn-ghost" to="/">View site</Link>
          <button className="btn btn-ghost" type="button" onClick={logout}>Log out</button>
        </div>
      </header>

      <form className="panel" onSubmit={saveProfile}>
        <h2 className="panel-title">Profile</h2>
        <label className="field">
          Name
          <input
            value={profile.name}
            onChange={(event) => setProfile({ ...profile, name: event.target.value })}
            required
          />
        </label>
        <label className="field">
          Roles
          <input
            value={profile.headline}
            onChange={(event) => setProfile({ ...profile, headline: event.target.value })}
          />
        </label>
        <label className="field">
          Introduction
          <textarea
            value={profile.bio}
            onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
          />
        </label>
        <p className="hint">The name, roles, and introduction are the lines beside the photo. Save to update the site.</p>
        <div className="split">
          <label className="field">
            Email
            <input
              type="email"
              value={profile.email}
              onChange={(event) => setProfile({ ...profile, email: event.target.value })}
            />
          </label>
          <label className="field">
            Phone
            <input
              value={profile.phone || ''}
              onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
            />
          </label>
          <label className="field">
            Location
            <input
              value={profile.location}
              onChange={(event) => setProfile({ ...profile, location: event.target.value })}
            />
          </label>
        </div>
        {profileError ? <p className="error-text">{profileError}</p> : null}
        {profileMessage ? <p className="message">{profileMessage}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={saving}>Save profile</button>
      </form>

      <form className="panel" onSubmit={addVideo}>
        <h2 className="panel-title">Add a video</h2>
        <p className="hint">The description shows above the video on the site. Add a link, upload a file, or both.</p>
        <label className="field">
          Title
          <input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            required
          />
        </label>
        <label className="field">
          Description
          <textarea
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            required
          />
        </label>
        <label className="field">
          Category
          <select
            value={draft.category}
            onChange={(event) => setDraft({ ...draft, category: event.target.value })}
            required
          >
            {videoCategories.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(event) => setDraft({ ...draft, featured: event.target.checked })}
          />
          Main video for this category
        </label>
        <label className="field">
          Video link
          <input
            value={draft.videoUrl}
            onChange={(event) => setDraft({ ...draft, videoUrl: event.target.value })}
            placeholder="YouTube, Vimeo, or a direct video link"
          />
        </label>
        <label className="field">
          Or upload a video
          <input
            key={fileKey}
            type="file"
            accept="video/*"
            onChange={(event) => setDraft({ ...draft, file: event.target.files?.[0] || null })}
          />
        </label>
        <label className="field">
          Date
          <input
            type="datetime-local"
            value={draft.publishedAt}
            onChange={(event) => setDraft({ ...draft, publishedAt: event.target.value })}
            required
          />
        </label>
        {draftError ? <p className="error-text">{draftError}</p> : null}
        {draftMessage ? <p className="message">{draftMessage}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={saving}>Add video</button>
      </form>

      <section className="panel">
        <h2 className="panel-title">Videos</h2>
        {videos.length === 0 ? <p className="empty">No videos yet.</p> : null}
        <div className="video-list">
          {videos.map((post) => (
            <article className="video-row" key={post.id}>
              {editingId === post.id && edit ? (
                <form onSubmit={saveEdit}>
                  <label className="field">
                    Title
                    <input
                      value={edit.title}
                      onChange={(event) => setEdit({ ...edit, title: event.target.value })}
                      required
                    />
                  </label>
                  <label className="field">
                    Description
                    <textarea
                      value={edit.description}
                      onChange={(event) => setEdit({ ...edit, description: event.target.value })}
                      required
                    />
                  </label>
                  <label className="field">
                    Category
                    <select
                      value={edit.category}
                      onChange={(event) => setEdit({ ...edit, category: event.target.value })}
                      required
                    >
                      {videoCategories.map((name) => <option key={name}>{name}</option>)}
                    </select>
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={edit.featured}
                      onChange={(event) => setEdit({ ...edit, featured: event.target.checked })}
                    />
                    Main video for this category
                  </label>
                  <label className="field">
                    Video link
                    <input
                      value={edit.videoUrl}
                      onChange={(event) => setEdit({ ...edit, videoUrl: event.target.value })}
                    />
                  </label>
                  {post.videoFileUrl ? (
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={edit.removeFile}
                        onChange={(event) => setEdit({ ...edit, removeFile: event.target.checked })}
                      />
                      Remove the uploaded file
                    </label>
                  ) : null}
                  <label className="field">
                    Replace uploaded video
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(event) => setEdit({ ...edit, file: event.target.files?.[0] || null })}
                    />
                  </label>
                  <label className="field">
                    Date
                    <input
                      type="datetime-local"
                      value={edit.publishedAt}
                      onChange={(event) => setEdit({ ...edit, publishedAt: event.target.value })}
                      required
                    />
                  </label>
                  <VideoPlayer post={post} />
                  {editError ? <p className="error-text">{editError}</p> : null}
                  <div className="actions">
                    <button className="btn btn-primary" type="submit" disabled={saving}>Save changes</button>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEdit(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="post-date">{toLocalInput(post.publishedAt).replace('T', ' ')}</p>
                  <p className="eyebrow">{post.category}{post.featured ? ' · Main' : ''}</p>
                  <h3 className="post-title">{post.title}</h3>
                  <p className="description">{post.description}</p>
                  <div className="actions">
                    <button className="btn btn-ghost" type="button" onClick={() => startEdit(post)}>Edit</button>
                    <button className="btn btn-danger" type="button" onClick={() => removeVideo(post.id)}>Delete</button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <form className="panel" onSubmit={changePassword}>
        <h2 className="panel-title">Password</h2>
        <label className="field">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={password.currentPassword}
            onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })}
            required
          />
        </label>
        <label className="field">
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={password.newPassword}
            onChange={(event) => setPassword({ ...password, newPassword: event.target.value })}
            minLength={8}
            required
          />
        </label>
        {passwordError ? <p className="error-text">{passwordError}</p> : null}
        {passwordMessage ? <p className="message">{passwordMessage}</p> : null}
        <button className="btn btn-primary" type="submit">Update password</button>
      </form>
    </div>
  );
}
