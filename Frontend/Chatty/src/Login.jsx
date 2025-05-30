import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:6001/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('username', res.data.username);
      navigate('/chat');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)'
    }}>
      <form onSubmit={handleLogin}
        style={{
          background: '#fff',
          padding: 40,
          borderRadius: 16,
          boxShadow: '0 6px 32px rgba(80,80,160,0.18)',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 320
        }}>
        <h2 style={{ color: '#7c3aed', fontWeight: 900, marginBottom: 8, textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: '#666', marginBottom: 24, textAlign: 'center' }}>Login to your account</p>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            border: '1px solid #ddd',
            fontSize: 16
          }}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            border: '1px solid #ddd',
            fontSize: 16
          }}
          autoComplete="current-password"
        />
        {error && <div style={{ color: 'red', marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        <button
          type="submit"
          style={{
            background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: 14,
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            marginBottom: 8
          }}>
          Login
        </button>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span style={{ color: '#666' }}>Don't have an account? </span>
          <Link to="/signup" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>Sign Up</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;
