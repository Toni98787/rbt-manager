import { useMemo, useState, type CSSProperties } from 'react';
import { useAppStore, useActiveTheme, useCurrentUser } from '../store/useAppStore';
import { ImagePicker } from '../components/common/ImagePicker';
import type { ThemePreset } from '../types';
import { uid } from '../lib/dates';

export function SettingsPage() {
  const shop = useAppStore((s) => s.shop);
  const updateShop = useAppStore((s) => s.updateShop);
  const setLogo = useAppStore((s) => s.setLogo);
  const themes = useAppStore((s) => s.themes);
  const setThemeId = useAppStore((s) => s.setThemeId);
  const upsertTheme = useAppStore((s) => s.upsertTheme);
  const activeThemeId = useAppStore((s) => s.activeThemeId);
  const theme = useActiveTheme();
  const user = useCurrentUser();
  const [draft, setDraft] = useState<ThemePreset>(theme);
  const [section, setSection] = useState<'shop' | 'appearance' | 'staff'>('appearance');

  const previewStyle = useMemo(
    () =>
      ({
        background: draft.background,
        color: draft.text,
        borderColor: draft.accent,
      }) as CSSProperties,
    [draft],
  );

  return (
    <div className="stack">
      <div>
        <h1>Settings</h1>
        <p className="muted">Shop details, TVA, branding, and appearance themes.</p>
      </div>

      <div className="row wrap">
        {(
          [
            ['appearance', 'Appearance'],
            ['shop', 'Shop & TVA'],
            ['staff', 'Staff tips'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={`chip ${section === id ? 'active' : ''}`}
            onClick={() => setSection(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'shop' ? (
        <div className="panel stack" style={{ padding: 16 }}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 20,
                overflow: 'hidden',
                background: '#111',
                border: '1px solid var(--border)',
              }}
            >
              {shop.logoDataUrl ? (
                <img
                  src={shop.logoDataUrl}
                  alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="muted" style={{ padding: 20 }}>
                  Logo
                </div>
              )}
            </div>
            <div className="stack">
              <ImagePicker label="Upload shop logo" onPick={(url) => setLogo(url)} />
              <button className="btn ghost" onClick={() => setLogo(null)}>
                Remove logo
              </button>
              <div className="tiny muted">
                Logo appears on login, dashboard, POS header, invoices, and reports.
              </div>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Shop name</label>
              <input value={shop.name} onChange={(e) => updateShop({ name: e.target.value })} />
            </div>
            <div className="field">
              <label>Owner name</label>
              <input
                value={shop.ownerName}
                onChange={(e) => updateShop({ ownerName: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Address</label>
              <input
                value={shop.address}
                onChange={(e) => updateShop({ address: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={shop.phone} onChange={(e) => updateShop({ phone: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={shop.email} onChange={(e) => updateShop({ email: e.target.value })} />
            </div>
            <div className="field">
              <label>Currency</label>
              <input
                value={shop.currency}
                onChange={(e) => updateShop({ currency: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="field">
              <label>TVA percentage (%)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={shop.tvaPercent}
                onChange={(e) => updateShop({ tvaPercent: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="tiny muted">Current TVA: {shop.tvaPercent}% — change anytime if rates update.</div>
        </div>
      ) : null}

      {section === 'appearance' ? (
        <div className="grid-2">
          <div className="panel stack" style={{ padding: 16 }}>
            <h3>Themes</h3>
            <div className="row wrap">
              {themes.map((t) => (
                <button
                  key={t.id}
                  className={`chip ${activeThemeId === t.id ? 'active' : ''}`}
                  onClick={() => {
                    setThemeId(t.id);
                    setDraft(t);
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Theme name</label>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Mode</label>
                <select
                  value={draft.mode}
                  onChange={(e) =>
                    setDraft({ ...draft, mode: e.target.value as ThemePreset['mode'] })
                  }
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {(
                [
                  ['primary', 'Primary'],
                  ['accent', 'Accent'],
                  ['background', 'Background'],
                  ['surface', 'Surface'],
                  ['text', 'Text'],
                  ['muted', 'Muted'],
                ] as const
              ).map(([key, label]) => (
                <div className="field" key={key}>
                  <label>{label}</label>
                  <div className="row">
                    <input
                      type="color"
                      className="color-swatch"
                      value={draft[key]}
                      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    />
                    <input
                      value={draft[key]}
                      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    />
                  </div>
                </div>
              ))}
              <div className="field">
                <label>Product card size</label>
                <select
                  value={draft.cardSize}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      cardSize: e.target.value as ThemePreset['cardSize'],
                    })
                  }
                >
                  <option value="compact">Compact</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div className="field">
                <label>Font size</label>
                <select
                  value={draft.fontSize}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      fontSize: e.target.value as ThemePreset['fontSize'],
                    })
                  }
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div className="field">
                <label>Button shape</label>
                <select
                  value={draft.buttonShape}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      buttonShape: e.target.value as ThemePreset['buttonShape'],
                    })
                  }
                >
                  <option value="sharp">Sharp</option>
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                </select>
              </div>
            </div>

            <div className="row wrap">
              <button
                className="btn primary"
                onClick={() => {
                  upsertTheme(draft);
                }}
              >
                Apply & save theme
              </button>
              <button
                className="btn"
                onClick={() => {
                  const custom: ThemePreset = {
                    ...draft,
                    id: uid('theme'),
                    name: `${draft.name} copy`,
                  };
                  upsertTheme(custom);
                  setDraft(custom);
                }}
              >
                Save as new theme
              </button>
            </div>
            <div className="tiny muted">
              Theme preference is stored per user ({user?.name}). Layout prefs live on the Home
              dashboard.
            </div>
          </div>

          <div className="panel stack" style={{ padding: 16 }}>
            <h3>Live preview</h3>
            <div className="theme-preview" style={previewStyle}>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.8rem' }}>
                {shop.name}
              </div>
              <div style={{ opacity: 0.75, marginBottom: 12 }}>RBT Manager · {draft.name}</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                }}
              >
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    style={{
                      background: draft.surface,
                      borderRadius:
                        draft.buttonShape === 'pill'
                          ? 999
                          : draft.buttonShape === 'sharp'
                            ? 6
                            : 14,
                      padding: 10,
                      border: `1px solid ${draft.accent}55`,
                    }}
                  >
                    <div
                      style={{
                        height: draft.cardSize === 'compact' ? 48 : draft.cardSize === 'large' ? 72 : 60,
                        borderRadius: 10,
                        background: `linear-gradient(135deg, ${draft.accent}, ${draft.primary})`,
                        marginBottom: 8,
                      }}
                    />
                    <div style={{ fontWeight: 700, fontSize: draft.fontSize === 'large' ? 15 : 13 }}>
                      Product {n}
                    </div>
                    <div style={{ color: draft.accent, fontWeight: 700 }}>$18.00</div>
                  </div>
                ))}
              </div>
              <button
                style={{
                  marginTop: 14,
                  border: 'none',
                  background: draft.accent,
                  color: '#111',
                  fontWeight: 700,
                  padding: '10px 14px',
                  borderRadius:
                    draft.buttonShape === 'pill' ? 999 : draft.buttonShape === 'sharp' ? 6 : 14,
                }}
              >
                Select
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {section === 'staff' ? (
        <div className="panel" style={{ padding: 16 }}>
          <h3>Staff access</h3>
          <p className="muted">
            Demo staff PINs: Owner 1234, Alex 2222, Jordan 3333. Jordan can override discounts; Alex
            cannot. Each user keeps their own theme and home layout.
          </p>
        </div>
      ) : null}
    </div>
  );
}
