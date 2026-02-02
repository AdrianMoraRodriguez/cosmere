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
        <h1>🌟 Wiki del Cosmere</h1>
        <p>Archivo de las Tormentas RPG</p>
        
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
        
        <div className="hint">
          <small>
            Por defecto: admin/admin123 o jugador1/jugador123
          </small>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .login-box {
          background: white;
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          max-width: 400px;
          width: 90%;
        }
        
        h1 {
          margin: 0 0 0.5rem;
          text-align: center;
          color: #333;
        }
        
        p {
          text-align: center;
          color: #666;
          margin-bottom: 2rem;
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
          font-weight: 500;
          color: #333;
          font-size: 0.875rem;
        }
        
        input {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        
        input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        input:disabled {
          background: #f7fafc;
          cursor: not-allowed;
        }
        
        button {
          padding: 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
          margin-top: 0.5rem;
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .error {
          color: #e53e3e;
          text-align: center;
          margin: 0.5rem 0 0;
          font-size: 0.875rem;
        }
        
        .hint {
          margin-top: 1.5rem;
          text-align: center;
          color: #718096;
        }
      `}</style>
    </div>
  );
}