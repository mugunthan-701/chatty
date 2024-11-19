import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const res = await axios.post('http://localhost:6001/signup', { username, password });
      localStorage.setItem('token', res.data.token);
      navigate('/chat');
    } catch (err) {
      alert('Signup failed. Please try again.');
    }
  };

  return (
    <div>
      <h1>Signup</h1>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button onClick={handleSignup}>Signup</button>
    </div>
  );
}

export default Signup;
