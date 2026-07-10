import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';

export default function Login({ onLoginSuccess }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email, senha) => {
    setError('');
    setLoading(true);

    // Identificar a URL base da API
    let baseUrl = import.meta.env.VITE_API_URL;
    if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    const API_URL = baseUrl 
      ? `${baseUrl}/auth/login.php`
      : window.location.origin.includes('5173') 
        ? 'http://localhost:8000/api/auth/login.php' 
        : '/backend/api/auth/login.php'; // Caminho relativo em produção

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Falha ao autenticar.');
      }

      onLoginSuccess(data.token, data.usuario);
    } catch (err) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background radial glow */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(0,0,0,0) 70%)',
        top: '-150px',
        right: '-150px',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, rgba(0,0,0,0) 70%)',
        bottom: '-150px',
        left: '-150px',
        pointerEvents: 'none'
      }} />

      <LoginForm onLogin={handleLogin} error={error} loading={loading} />
    </div>
  );
}
