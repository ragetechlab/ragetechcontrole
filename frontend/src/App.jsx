import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('regetech_token') || '');
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('regetech_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (newToken, userDetails) => {
    setToken(newToken);
    setUsuario(userDetails);
    localStorage.setItem('regetech_token', newToken);
    localStorage.setItem('regetech_user', JSON.stringify(userDetails));
  };

  const handleLogout = () => {
    setToken('');
    setUsuario(null);
    localStorage.removeItem('regetech_token');
    localStorage.removeItem('regetech_user');
  };

  return (
    <Router>
      <Routes>
        {/* Rota de Login */}
        <Route 
          path="/login" 
          element={
            token ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
          } 
        />

        {/* Rota do Dashboard Protegido */}
        <Route 
          path="/dashboard" 
          element={
            token ? (
              <Dashboard token={token} usuario={usuario} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Fallback de redirecionamento */}
        <Route 
          path="*" 
          element={<Navigate to={token ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}
