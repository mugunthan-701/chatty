import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:2000'); // Connect to Socket.IO server

function Chat() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const userId = 'YOUR_USER_ID'; // Replace with the logged-in user's ID
  useEffect(() => {
    // Notify server of the connected user
    socket.emit('user-connected', userId);

    // Handle incoming messages
    socket.on('receive-message', (data) => {
      setMessages((prevMessages) => [...prevMessages, { sender: selectedUser, text: data.message }]);
    });

    return () => socket.disconnect();
  }, [selectedUser]);

  const handleSearch = async () => {
    try {
      const response = await axios.get('http://localhost:6001/users');
      const filteredUsers = response.data.filter((user) => user.username.includes(search));
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedUser) {
      socket.emit('send-message', { toUserId: selectedUser._id, message: newMessage });
      setMessages((prevMessages) => [...prevMessages, { sender: userId, text: newMessage }]);
      setNewMessage('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '5px' }}
        />
        <button onClick={handleSearch} style={{ marginLeft: '10px' }}>
          Search
        </button>
      </div>

      <div style={{ width: '300px', border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
        <h4>Users</h4>
        {users.map((user) => (
          <div
            key={user._id}
            onClick={() => setSelectedUser(user)}
            style={{
              padding: '5px',
              cursor: 'pointer',
              backgroundColor: selectedUser?._id === user._id ? '#ddd' : '#fff',
            }}
          >
            {user.username}
          </div>
        ))}
      </div>

      <div style={{ width: '300px', border: '1px solid #ddd', padding: '10px' }}>
        <h4>Chat</h4>
        {selectedUser ? (
          <>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '10px' }}>
              {messages.map((msg, index) => (
                <div key={index} style={{ textAlign: msg.sender === userId ? 'right' : 'left' }}>
                  <p style={{ margin: '5px 0' }}>{msg.text}</p>
                </div>
              ))}
            </div>
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ padding: '5px', width: '70%' }}
            />
            <button onClick={handleSendMessage} style={{ marginLeft: '10px' }}>
              Send
            </button>
          </>
        ) : (
          <p>Select a user to start chatting</p>
        )}
      </div>
    </div>
  );
}

export default Chat;
