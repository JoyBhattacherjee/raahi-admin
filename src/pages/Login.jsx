import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, MapPinned, ShieldCheck, Wallet } from 'lucide-react';
import { DEMO_EMAIL, DEMO_PASSWORD, useApp } from '../context/AppContext';
import Logo from '../components/Logo';

export default function Login() {
  const { user, login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Small delay so the button state is visible, like a real network call.
    setTimeout(() => {
      const res = login(email, password);
      setLoading(false);
      if (res.ok) navigate('/', { replace: true });
      else setError(res.error);
    }, 500);
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  return (
    <div className="login">
      <section className="login-hero">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="login-hero-inner">
          <div className="brand light">
            <Logo size={46} />
            <div>
              <strong>Raahi</strong>
              <span>Admin console</span>
            </div>
          </div>
          <h2>Run every ride from one place.</h2>
          <p>Monitor live trips, onboard drivers, tune pricing and launch offers, all in real time.</p>
          <ul>
            <li>
              <MapPinned size={18} /> Live fleet map with demand hotspots
            </li>
            <li>
              <ShieldCheck size={18} /> Driver verification and safety controls
            </li>
            <li>
              <Wallet size={18} /> Dynamic fares, surge and promo codes
            </li>
          </ul>
        </div>
      </section>

      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to your admin account.</p>

          <label>
            <span>Email</span>
            <div className="field">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="username"
                required
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="field">
              <Lock size={18} />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button type="button" className="plain" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
            {!loading && <ArrowRight size={18} />}
          </button>

          <div className="demo-box">
            <div>
              <strong>Demo access</strong>
              <span>
                {DEMO_EMAIL} · {DEMO_PASSWORD}
              </span>
            </div>
            <button type="button" className="btn btn-soft" onClick={fillDemo}>
              Autofill
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
