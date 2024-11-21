import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Chat() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState(null); // Store the chat ID
  const userId = 'YOUR_USER_ID'; // Replace with the logged-in user's ID
  const baseURL = 'http://localhost:6001';

  useEffect(() => {
    if (selectedUser) {
      // Fetch or create a chat with the selected user
      fetchOrCreateChat();
    }
  }, [selectedUser]);

  const fetchOrCreateChat = async () => {
    try {
      const response = await axios.post(`${baseURL}/chats`, {
        participantIds: [userId, selectedUser._id],
      });
      setChatId(response.data.chatId);

      // Fetch messages for the chat
      fetchMessages(response.data.chatId);
    } catch (err) {
      console.error('Error creating or fetching chat:', err);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await axios.get(`${baseURL}/chats/${chatId}`);
      setMessages(response.data.messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(`${baseURL}/users`);
      const filteredUsers = response.data.filter((user) => user.username.includes(search));
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedUser && chatId) {
      try {
        await axios.post(`${baseURL}/chats/${chatId}/messages`, {
          senderId: userId,
          text: newMessage,
        });

        setMessages((prevMessages) => [
          ...prevMessages,
          { senderId: userId, text: newMessage },
        ]);
        setNewMessage('');
      } catch (err) {
        console.error('Error sending message:', err);
      }
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
                <div
                  key={index}
                  style={{
                    textAlign: msg.senderId === userId ? 'right' : 'left',
                  }}
                >
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
