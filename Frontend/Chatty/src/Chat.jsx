import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const baseURL = 'http://localhost:6001';

function Chat() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [token] = useState(localStorage.getItem('token'));
  const socketRef = useRef();
  const messagesEndRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedUser && userId) {
      fetchOrCreateChat();
    }
    // eslint-disable-next-line
  }, [selectedUser]);

  useEffect(() => {
    // Setup socket connection
    if (chatId) {
      if (!socketRef.current) {
        socketRef.current = io(baseURL);
      }
      socketRef.current.emit('joinChat', chatId);

      socketRef.current.on('newMessage', ({ message }) => {
        setMessages((prev) => [...prev, message]);
      });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('newMessage');
      }
    };
    // eslint-disable-next-line
  }, [chatId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${baseURL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filtered = response.data.filter((u) => u._id !== userId);
      setUsers(filtered);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/');
      }
    }
  };

  const fetchOrCreateChat = async () => {
    try {
      const response = await axios.post(`${baseURL}/chats`, {
        participantIds: [userId, selectedUser._id],
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const chat = response.data.chat;
      setChatId(chat._id);
      fetchMessages(chat._id);
    } catch (err) {
      alert('Error fetching or creating chat');
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await axios.get(`${baseURL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages);
    } catch (err) {
      alert('Error fetching messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && chatId) {
      try {
        const response = await axios.post(`${baseURL}/chats/${chatId}/messages`, {
          text: newMessage,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages((prev) => [...prev, response.data.message]);
        setNewMessage('');
      } catch (err) {
        alert('Error sending message');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdf6e3 0%, #e0eafc 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{
        padding: '18px 32px',
        background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
        color: '#fff',
        fontWeight: 700,
        fontSize: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>💬 Chat App</span>
        <span>
          {username && <span style={{ marginRight: 16 }}>Hi, {username}</span>}
          <button onClick={handleLogout}
            style={{
              background: '#fff',
              color: '#7c3aed',
              border: 'none',
              borderRadius: 6,
              padding: '8px 18px',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer'
            }}>
            Logout
          </button>
        </span>
      </header>
      <div style={{
        display: 'flex',
        flex: 1,
        padding: 32,
        gap: 32,
        justifyContent: 'center'
      }}>
        {/* Sidebar */}
        <div style={{
          minWidth: 240,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(80,80,160,0.10)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch'
        }}>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 6,
              border: '1px solid #ddd',
              marginBottom: 16
            }}
          />
          <button
            onClick={fetchUsers}
            style={{
              background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 0',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              marginBottom: 16
            }}>
            Refresh
          </button>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {users
              .filter(u => u.username.toLowerCase().includes(search.toLowerCase()))
              .map(user => (
                <div
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  style={{
                    padding: 12,
                    borderRadius: 6,
                    background: selectedUser?._id === user._id ? '#e0e7ff' : '#f9f9f9',
                    marginBottom: 8,
                    cursor: 'pointer',
                    fontWeight: selectedUser?._id === user._id ? 700 : 400,
                    color: selectedUser?._id === user._id ? '#4f46e5' : '#333',
                    border: selectedUser?._id === user._id ? '1.5px solid #7c3aed' : '1px solid #eee'
                  }}>
                  {user.username}
                </div>
              ))}
          </div>
        </div>
        {/* Main Chat Area */}
        <div style={{
          flex: 1,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(80,80,160,0.10)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 350,
          maxWidth: 700
        }}>
          <div style={{
            fontWeight: 700,
            fontSize: 20,
            color: '#7c3aed',
            marginBottom: 16
          }}>
            {selectedUser ? `Chat with ${selectedUser.username}` : 'Select a user to start chatting'}
          </div>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.senderId === userId ? 'flex-end' : 'flex-start',
                  background: msg.senderId === userId ? '#d1f7c4' : '#f1f0f0',
                  color: '#222',
                  borderRadius: 8,
                  padding: '9px 16px',
                  marginBottom: 8,
                  maxWidth: '65%',
                  fontSize: 16,
                  boxShadow: '0 1px 4px rgba(80,80,160,0.06)'
                }}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {selectedUser && (
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 16
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0 28px',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer'
                }}>
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
