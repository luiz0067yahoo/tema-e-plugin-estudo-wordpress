import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { isAuthOpen, closeAuth, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  if (!isAuthOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });

    try {
      await login(username, password);
      setStatus({ loading: false, error: '', success: 'Login efetuado com sucesso!' });
      setTimeout(() => {
        closeAuth();
      }, 500);
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Falha na autenticação', success: '' });
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={closeAuth}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h3>Autenticação REST API (JWT)</h3>
          <button className="auth-close-btn" onClick={closeAuth} aria-label="Fechar">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-username">Usuário / Login</label>
            <input
              id="auth-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário WordPress"
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Senha</label>
            <input
              id="auth-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
            />
          </div>

          {status.error && <div className="auth-alert is-error">{status.error}</div>}
          {status.success && <div className="auth-alert is-success">{status.success}</div>}

          <button type="submit" disabled={status.loading} className="auth-submit-btn">
            {status.loading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
