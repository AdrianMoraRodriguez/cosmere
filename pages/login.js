import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const { user } = await res.json();
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/wiki');
      } else {
        setError('Credenciales inválidas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>📚 Wiki del Cosmere</h1>
        <p>Archivo de las Tormentas - Campaña RPG</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          
          {error && <p className="error">{error}</p>}
        </form>

        <div className="oath">
          <p>Vida antes que Muerte</p>
          <p>Fuerza antes que Debilidad</p>
          <p>Viaje antes que Destino</p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1e3a8a 0%, #059669 50%, #7c2d12 100%);
        }
        
        .login-box {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 3rem;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 420px;
          width: 90%;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        h1 {
          margin: 0 0 0.5rem;
          text-align: center;
          color: #1e3a8a;
          font-size: 2rem;
        }
        
        p {
          text-align: center;
          color: #059669;
          margin-bottom: 2rem;
          font-weight: 500;
        }
        
        form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        label {
          font-weight: 600;
          color: #1e3a8a;
          font-size: 0.875rem;
        }
        
        input {
          padding: 0.75rem;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
          background: white;
        }
        
        input:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }
        
        input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }
        
        button {
          padding: 0.875rem;
          background: linear-gradient(135deg, #1e3a8a 0%, #059669 50%, #7c2d12 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .error {
          color: #dc2626;
          text-align: center;
          margin: 0.5rem 0 0;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .oath {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .oath p {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0.25rem 0;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}