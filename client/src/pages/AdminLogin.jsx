import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api('/api/auth/me')
      .then(() => navigate('/admin'))
      .catch(() => {});
  }, [navigate]);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api('/api/auth/login', { method: 'POST', body: { email, password } });
      navigate('/admin');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="admin login-screen">
      <form className="panel login-panel" onSubmit={onSubmit}>
        <p className="eyebrow">Admin</p>
        <h1>Sign in</h1>
        <p className="hint">Use this to edit the portfolio, including videos and the text above them.</p>
        <label className="field">
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <div className="actions">
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <Link className="btn btn-ghost" to="/">Back to site</Link>
        </div>
      </form>
    </div>
  );
}
