import { useState } from 'react';
import { useStore } from '../store/StoreContext';

export function LoginScreen() {
  const { state, login } = useStore();
  const [staffId, setStaffId] = useState(state.staff[0]?.id ?? '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const tryLogin = (nextPin: string) => {
    if (nextPin.length < 4) return;
    const ok = login(staffId, nextPin);
    if (!ok) {
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
  };

  const press = (digit: string) => {
    setError('');
    if (digit === 'clear') {
      setPin('');
      return;
    }
    if (digit === 'del') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    setPin((p) => {
      if (p.length >= 4) return p;
      const next = p + digit;
      if (next.length === 4) setTimeout(() => tryLogin(next), 80);
      return next;
    });
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          {state.shop.logoDataUrl ? (
            <img src={state.shop.logoDataUrl} alt={state.shop.shopName} />
          ) : (
            'RBT'
          )}
        </div>
        <h1>RBT Manager</h1>
        <p className="subtitle">{state.shop.shopName} · Staff sign-in</p>

        <div className="staff-picks">
          {state.staff
            .filter((s) => s.active)
            .map((s) => (
              <button
                key={s.id}
                type="button"
                className={`staff-pick ${staffId === s.id ? 'active' : ''}`}
                onClick={() => {
                  setStaffId(s.id);
                  setPin('');
                  setError('');
                }}
              >
                <span>{s.name}</span>
                <span className="badge">{s.role}</span>
              </button>
            ))}
        </div>

        <div className="pin-dots">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />
          ))}
        </div>

        <div className="pin-pad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'del'].map((k) => (
            <button key={k} type="button" onClick={() => press(k)}>
              {k === 'clear' ? 'C' : k === 'del' ? '⌫' : k}
            </button>
          ))}
        </div>

        {error ? <div className="login-error">{error}</div> : null}
        <p className="subtitle" style={{ marginTop: 16, marginBottom: 0, fontSize: '0.78rem' }}>
          Demo PINs: owner 1234 · Amina 2222 · Jean 3333
        </p>
      </div>
    </div>
  );
}
