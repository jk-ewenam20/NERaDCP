import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@300;400;500&display=swap');

  .login-root {
    min-height: 100vh;
    background: #06060e;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── Diagonal watermark ── */
  .wm-wrap {
    position: absolute;
    inset: -60%;
    display: flex;
    flex-direction: column;
    gap: 0;
    transform: rotate(-18deg);
    pointer-events: none;
    user-select: none;
  }
  .wm-row {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(2.4rem, 5vw, 4rem);
    color: rgba(255,255,255,0.022);
    white-space: nowrap;
    letter-spacing: 0.12em;
    line-height: 1.15;
  }

  /* ── Radar rings ── */
  .radar-wrap {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(220, 38, 38, 0.22);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
    animation: radar-pulse 4s ease-out infinite;
  }
  .ring:nth-child(2) { animation-delay: 1.33s; }
  .ring:nth-child(3) { animation-delay: 2.66s; }
  @keyframes radar-pulse {
    0%   { transform: translate(-50%, -50%) scale(0.3); opacity: 0.7; }
    100% { transform: translate(-50%, -50%) scale(3.2); opacity: 0; }
  }

  /* ── Entry animations ── */
  @keyframes fadeslide {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .appear { opacity: 0; animation: fadeslide 0.6s ease forwards; }
  .d1 { animation-delay: 0.05s; }
  .d2 { animation-delay: 0.15s; }
  .d3 { animation-delay: 0.25s; }
  .d4 { animation-delay: 0.38s; }
  .d5 { animation-delay: 0.50s; }
  .d6 { animation-delay: 0.62s; }

  /* ── Form layout ── */
  .login-form-wrap {
    position: relative;
    width: 100%;
    max-width: 360px;
    padding: 0 24px;
  }

  /* ── Hex badge ── */
  .hex-badge {
    width: 40px; height: 40px;
    background: #dc2626;
    clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .hex-badge-inner {
    width: 0; height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 11px solid white;
    margin-bottom: 2px;
  }

  /* ── Display heading ── */
  .display-heading {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(3.8rem, 10vw, 5rem);
    color: #ffffff;
    line-height: 0.88;
    letter-spacing: 0.02em;
    margin: 0;
  }
  .display-heading span { color: #ef4444; }

  /* ── Input fields ── */
  .field-wrap { position: relative; }
  .field-label {
    display: block;
    font-size: 9px;
    font-weight: 500;
    color: rgba(255,255,255,0.3);
    letter-spacing: 0.22em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .field-input {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.875rem;
    font-weight: 300;
    padding: 8px 36px 8px 0;
    outline: none;
    transition: border-color 0.25s;
    box-sizing: border-box;
  }
  .field-input:focus { border-bottom-color: #ef4444; }
  .field-input::placeholder { color: rgba(255,255,255,0.18); }
  /* Kill autofill background */
  .field-input:-webkit-autofill,
  .field-input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px #06060e inset;
    -webkit-text-fill-color: #ffffff;
    caret-color: #ffffff;
  }

  .show-toggle {
    position: absolute; right: 0; bottom: 10px;
    background: none; border: none; cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.18em;
    color: rgba(255,255,255,0.25);
    padding: 0;
    transition: color 0.2s;
  }
  .show-toggle:hover { color: rgba(255,255,255,0.6); }

  /* ── Submit button ── */
  .submit-btn {
    width: 100%;
    background: #dc2626;
    border: none;
    color: #fff;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.25rem;
    letter-spacing: 0.16em;
    padding: 15px 0 13px;
    cursor: pointer;
    transition: background 0.2s, opacity 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .submit-btn:hover:not(:disabled) { background: #b91c1c; }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Arrow that slides in on hover */
  .submit-btn .arrow {
    display: inline-block;
    transition: transform 0.2s;
  }
  .submit-btn:hover:not(:disabled) .arrow { transform: translateX(4px); }

  /* ── Status bar ── */
  .status-bar {
    display: flex; align-items: center; gap: 8px;
    margin-top: 28px;
  }
  .status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
    animation: status-pulse 2.5s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes status-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
    50%       { box-shadow: 0 0 0 5px rgba(34, 197, 94, 0); }
  }
  .status-text {
    font-size: 9px;
    letter-spacing: 0.2em;
    color: rgba(255,255,255,0.2);
    text-transform: uppercase;
  }
`;

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? 'Invalid credentials';
      toast.error(msg);
    }
  }

  const WM_TEXT = 'EMERGENCY COMMAND · GHANA · ';

  return (
    <>
      <style>{CSS}</style>

      <div className="login-root">

        {/* Diagonal watermark */}
        <div className="wm-wrap" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="wm-row">{WM_TEXT.repeat(6)}</div>
          ))}
        </div>

        {/* Radar rings */}
        <div className="radar-wrap" aria-hidden="true">
          <div className="ring" style={{ width: 480, height: 480 }} />
          <div className="ring" style={{ width: 480, height: 480 }} />
          <div className="ring" style={{ width: 480, height: 480 }} />
        </div>

        {/* Form */}
        <div className="login-form-wrap">

          {/* Logo row */}
          <div className="appear d1" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div className="hex-badge">
              <div className="hex-badge-inner" />
            </div>
            <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
              GH · ERS · DISPATCH
            </span>
          </div>

          {/* Heading */}
          <h1 className="display-heading appear d2">
            Emergency<br />
            <span>Command</span>
          </h1>
          <p className="appear d3" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '12px 0 44px' }}>
            Authorised Access Only
          </p>

          {/* Fields */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div className="field-wrap appear d4">
              <label className="field-label">Identifier</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@example.com"
                className="field-input"
                autoComplete="email"
              />
            </div>

            <div className="field-wrap appear d5">
              <label className="field-label">Passkey</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field-input"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="show-toggle"
                onClick={() => setShowPass((s) => !s)}
                tabIndex={-1}
              >
                {showPass ? 'HIDE' : 'SHOW'}
              </button>
            </div>

            <div className="appear d6" style={{ marginTop: 4 }}>
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'VERIFYING…' : (
                  <>ACCESS SYSTEM <span className="arrow">→</span></>
                )}
              </button>
            </div>
          </form>

          {/* Status */}
          <div className="status-bar appear d6">
            <div className="status-dot" />
            <span className="status-text">All systems operational</span>
          </div>

        </div>
      </div>
    </>
  );
}
