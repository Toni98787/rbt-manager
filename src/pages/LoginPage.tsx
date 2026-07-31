import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore, useCurrentUser } from '../store/useAppStore';

export function LoginPage() {
  const shop = useAppStore((s) => s.shop);
  const login = useAppStore((s) => s.login);
  const user = useCurrentUser();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const press = (key: string) => {
    setError('');
    if (key === 'C') {
      setPin('');
      return;
    }
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const next = (pin + key).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      const ok = login(next);
      if (!ok) {
        setError('Wrong PIN');
        setPin('');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card panel">
        <div className="login-brand">
          {shop.logoDataUrl ? (
            <img src={shop.logoDataUrl} alt={shop.name} />
          ) : (
            <span className="mark">RBT</span>
          )}
        </div>
        <h1 className="display" style={{ fontSize: '2.4rem' }}>
          {shop.name}
        </h1>
        <p className="muted" style={{ marginTop: 6 }}>
          RBT Manager · Staff login
        </p>
        <div className="pin-dots">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={pin.length > i ? 'on' : ''} />
          ))}
        </div>
        {error ? <div style={{ color: '#fca5a5', marginBottom: 8 }}>{error}</div> : null}
        <div className="pin-pad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
            <button key={k} type="button" onClick={() => press(k)}>
              {k}
            </button>
          ))}
        </div>
        <p className="tiny muted" style={{ marginTop: 16 }}>
          Demo PINs: Owner 1234 · Alex 2222 · Jordan 3333
        </p>
      </div>
    </div>
  );
}
