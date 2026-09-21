import React, { useState } from 'react';
import AppLayout from '../../layouts/AppLayout.jsx';
import { useAuth } from '../../context/AuthContext';
import './Settings.css';

const THEMES = [
  { label: 'System default', value: 'system' },
  { label: 'Light',          value: 'light'  },
  { label: 'Dark',           value: 'dark'   },
];

export default function Settings() {
  const { user } = useAuth();

  const [theme, setTheme] = useState(
    () => localStorage.getItem('mc_theme') || 'system'
  );
  const [notifications, setNotifications] = useState(
    () => localStorage.getItem('mc_notifications') !== 'false'
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('mc_theme', theme);
    localStorage.setItem('mc_notifications', String(notifications));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppLayout>
      <div className="settings-page">
        <h2 className="settings-title">⚙️ Settings</h2>

        {/* ── Appearance ── */}
        <section className="settings-section">
          <h3 className="settings-section-heading">Appearance</h3>
          <div className="settings-panel">
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Theme</div>
                <div className="settings-row-sub">Controls the colour scheme of the app.</div>
              </div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="settings-select"
              >
                {THEMES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Notifications ── */}
        <section className="settings-section">
          <h3 className="settings-section-heading">Notifications</h3>
          <div className="settings-panel">
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Reminders</div>
                <div className="settings-row-sub">Show reminders to check in with your mood.</div>
              </div>
              <button
                role="switch"
                aria-checked={notifications}
                onClick={() => setNotifications((v) => !v)}
                className="settings-toggle"
                style={{
                  background: notifications ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              >
                <span
                  className="settings-toggle-knob"
                  style={{ left: notifications ? 22 : 3 }}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ── Account ── */}
        <section className="settings-section">
          <h3 className="settings-section-heading">Account</h3>
          <div className="settings-panel">
            {[
              { label: 'Full Name', value: user?.fullName },
              { label: 'Email',     value: user?.email    },
            ].map(({ label, value }, i, arr) => (
              <div
                key={label}
                className="settings-row"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none' }}
              >
                <div className="settings-row-label">{label}</div>
                <div className="settings-row-value">{value || '—'}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Save ── */}
        <button
          onClick={handleSave}
          className="settings-save-btn"
          style={{
            background: saved ? 'var(--color-success)' : 'var(--color-primary)',
          }}
        >
          {saved ? '✓ Saved' : 'Save preferences'}
        </button>
      </div>
    </AppLayout>
  );
}
