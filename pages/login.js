import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('wiki-theme') || 'caminapiedras';
    document.documentElement.setAttribute('data-theme', saved);
    document.body.setAttribute('data-theme', saved);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const { user } = await res.json();
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/wiki');
      } else {
        setError('Credenciales inválidas');
      }
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg-input)',
    border: `1px solid ${focusedField === field ? 'var(--accent)' : 'var(--border-input)'}`,
    borderRadius: '8px',
    color: 'var(--text-2)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(255,255,255,0.08)' : 'none',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Card */}
      <div style={{
        position: 'relative',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '40px 36px',
        width: '100%',
        maxWidth: '400px',
        margin: '0 16px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
      }}>

        {/* Logo & title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', lineHeight: 1 }}>🌩️</div>
          <h1 style={{ margin: 0, color: 'var(--text-1)', fontSize: '22px', fontWeight: '700', letterSpacing: '-0.01em' }}>
            Wiki del Cosmere
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-6)', fontSize: '13px', fontWeight: '500' }}>
            Archivo de las Tormentas · Campaña RPG
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--accent-2)', fontSize: '12px', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Usuario
            </label>
            <input
              id="username"
              type="text"
              placeholder="Tu usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              disabled={loading}
              style={inputStyle('username')}
              autoComplete="username"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--accent-2)', fontSize: '12px', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              disabled={loading}
              style={inputStyle('password')}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              marginTop: '4px',
              padding: '11px',
              background: loading || !username || !password
                ? 'var(--btn-disabled-bg)'
                : 'var(--accent)',
              border: '1px solid',
              borderColor: loading || !username || !password ? 'var(--border)' : 'var(--accent)',
              borderRadius: '8px',
              color: loading || !username || !password ? 'var(--btn-disabled-text)' : '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => {
              if (!loading && username && password) {
                e.currentTarget.style.opacity = '0.85';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f87171',
              fontSize: '13px',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}
        </form>

        {/* Oath */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {['Vida antes que Muerte', 'Fuerza antes que Debilidad', 'Viaje antes que Destino'].map(line => (
            <p key={line} style={{ margin: 0, color: 'var(--text-7)', fontSize: '12px', fontStyle: 'italic', letterSpacing: '0.02em' }}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
