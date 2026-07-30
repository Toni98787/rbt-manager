import { useEffect, useState } from 'react';
import { useStore } from '../store/StoreContext';
import { readFileAsDataUrl, uid } from '../utils/helpers';
import type { ThemeConfig } from '../types';
import { BUILTIN_THEMES } from '../data/seed';

export function SettingsPage() {
  const { state, theme, updateShop, saveTheme, setActiveTheme, updatePreferences } = useStore();
  const [tab, setTab] = useState<'shop' | 'appearance' | 'tax'>('appearance');
  const [draft, setDraft] = useState<ThemeConfig>({ ...theme });

  useEffect(() => {
    setDraft({ ...theme });
  }, [theme]);

  // Live preview while editing
  useEffect(() => {
    if (tab !== 'appearance') return;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', draft.primary);
    root.style.setProperty('--color-accent', draft.accent);
    root.style.setProperty('--color-bg', draft.background);
    root.style.setProperty('--color-surface', draft.surface);
    root.style.setProperty('--color-text', draft.text);
    root.style.setProperty('--color-muted', draft.textMuted);
    root.dataset.cardSize = draft.productCardSize;
    root.dataset.fontSize = draft.fontSize;
    root.dataset.buttonShape = draft.buttonShape;
  }, [draft, tab]);

  const onLogo = async (file: File | null) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    updateShop({ logoDataUrl: dataUrl });
  };

  const onWallpaper = async (file: File | null) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    updatePreferences({ wallpaper: dataUrl });
  };

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div className="filters" style={{ marginBottom: 14 }}>
        {(
          [
            ['appearance', 'Appearance'],
            ['shop', 'Shop & logo'],
            ['tax', 'TVA & currency'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`btn btn-sm ${tab === id ? 'btn-primary' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'appearance' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Saved themes</h3>
            <div className="theme-swatches">
              {state.themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`theme-swatch ${state.preferences.themeId === t.id ? 'active' : ''}`}
                  style={{ background: t.background, color: t.text }}
                  onClick={() => {
                    setActiveTheme(t.id);
                    setDraft({ ...t });
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{t.name}</div>
                  <div
                    style={{
                      marginTop: 10,
                      height: 12,
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${t.primary}, ${t.accent})`,
                    }}
                  />
                </button>
              ))}
            </div>

            <h3>Customize</h3>
            <div className="field">
              <label>Theme name</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="field-row">
              {(
                [
                  ['primary', 'Primary'],
                  ['accent', 'Accent'],
                  ['background', 'Background'],
                  ['surface', 'Surface'],
                  ['text', 'Text'],
                  ['textMuted', 'Muted text'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="field">
                  <label>{label}</label>
                  <div className="color-input-row">
                    <input
                      type="color"
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
            </div>
            <div className="field-row">
              <div className="field">
                <label>Product card size</label>
                <select
                  value={draft.productCardSize}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      productCardSize: e.target.value as ThemeConfig['productCardSize'],
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
                    setDraft({ ...draft, fontSize: e.target.value as ThemeConfig['fontSize'] })
                  }
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Button shape</label>
              <select
                value={draft.buttonShape}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    buttonShape: e.target.value as ThemeConfig['buttonShape'],
                  })
                }
              >
                <option value="sharp">Sharp</option>
                <option value="rounded">Rounded</option>
                <option value="pill">Pill</option>
              </select>
            </div>
            <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => saveTheme({ ...draft })}
              >
                Save theme
              </button>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  saveTheme({
                    ...draft,
                    id: uid('theme'),
                    name: `${draft.name} copy`,
                    mode: 'custom',
                  })
                }
              >
                Save as new theme
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  const base = BUILTIN_THEMES.find((t) => t.id === 'roots-black-gold')!;
                  setDraft({ ...base });
                  setActiveTheme(base.id);
                }}
              >
                Reset to Roots Black & Gold
              </button>
            </div>
          </div>

          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Live preview</h3>
            <div
              className="live-preview"
              style={{ background: draft.background, color: draft.text }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
                RBT Manager
              </div>
              <div
                className="preview-card"
                style={{ background: draft.surface, border: `1px solid ${draft.accent}55` }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: `linear-gradient(145deg, ${draft.accent}, ${draft.primary})`,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 700 }}>Sample product</div>
                  <div style={{ color: draft.textMuted, fontSize: '0.85rem' }}>Category · Stock 12</div>
                  <div style={{ color: draft.accent, fontWeight: 700 }}>$4.50</div>
                </div>
              </div>
              <button
                type="button"
                className="btn"
                style={{
                  background: draft.accent,
                  color: '#111',
                  borderRadius:
                    draft.buttonShape === 'pill'
                      ? 999
                      : draft.buttonShape === 'sharp'
                        ? 4
                        : 12,
                }}
              >
                Select
              </button>
              <div style={{ color: draft.textMuted, fontSize: '0.8rem' }}>
                Card size: {draft.productCardSize} · Font: {draft.fontSize}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'shop' ? (
        <div className="panel" style={{ maxWidth: 640 }}>
          <div className="field">
            <label>Shop name</label>
            <input
              value={state.shop.shopName}
              onChange={(e) => updateShop({ shopName: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Owner name</label>
            <input
              value={state.shop.ownerName}
              onChange={(e) => updateShop({ ownerName: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Address</label>
            <input
              value={state.shop.address}
              onChange={(e) => updateShop({ address: e.target.value })}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Phone</label>
              <input
                value={state.shop.phone}
                onChange={(e) => updateShop({ phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                value={state.shop.email}
                onChange={(e) => updateShop({ email: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Logo (login, dashboard, POS, invoices)</label>
            <input type="file" accept="image/*" onChange={(e) => onLogo(e.target.files?.[0] ?? null)} />
            {state.shop.logoDataUrl ? (
              <img
                src={state.shop.logoDataUrl}
                alt="logo"
                style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, marginTop: 8 }}
              />
            ) : null}
          </div>
          <div className="field">
            <label>Dashboard wallpaper</label>
            <input type="file" accept="image/*" onChange={(e) => onWallpaper(e.target.files?.[0] ?? null)} />
          </div>
        </div>
      ) : null}

      {tab === 'tax' ? (
        <div className="panel" style={{ maxWidth: 480 }}>
          <div className="field">
            <label>TVA percentage (%)</label>
            <input
              type="number"
              step="0.1"
              value={state.shop.tvaPercent}
              onChange={(e) => updateShop({ tvaPercent: parseFloat(e.target.value) || 0 })}
            />
            <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
              Currently {state.shop.tvaPercent}%. Change this if the government updates TVA. Cart and invoices use this rate.
            </p>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Currency code</label>
              <input
                value={state.shop.currency}
                onChange={(e) => updateShop({ currency: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Currency symbol</label>
              <input
                value={state.shop.currencySymbol}
                onChange={(e) => updateShop({ currencySymbol: e.target.value })}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
