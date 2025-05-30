import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const res = await axios.post('http://localhost:6001/signup', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('username', res.data.username);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)'
    }}>
      <form onSubmit={handleSignup}
        style={{
          background: '#fff',
          padding: 40,
          borderRadius: 16,
          boxShadow: '0 6px 32px rgba(80,80,160,0.18)',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 320
        }}>
        <h2 style={{ color: '#2563eb', fontWeight: 900, marginBottom: 8, textAlign: 'center' }}>Create Account</h2>
        <p style={{ color: '#666', marginBottom: 24, textAlign: 'center' }}>Sign up to chat instantly</p>
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
          autoComplete="new-password"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            border: '1px solid #ddd',
            fontSize: 16
          }}
          autoComplete="new-password"
        />
        {error && <div style={{ color: 'red', marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        <button
          type="submit"
          style={{
            background: 'linear-gradient(90deg, #2563eb, #1e40af)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: 14,
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            marginBottom: 8
          }}>
          Sign Up
        </button>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span style={{ color: '#666' }}>Already have an account? </span>
          <Link to="/" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
        </div>
      </form>
    </div>
  );
}

export default Signup;
