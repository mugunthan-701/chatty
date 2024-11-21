const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const io = require('socket.io')(2000);
const app = express();
const PORT = 6001;
const JWT_SECRET = 'your-secret-key';
const users = {}; // To store connected users' socket IDs

// // Socket.IO setup
// io.on('connection', (socket) => {
//   socket.on('user-connected', (userId) => {
//     users[userId] = socket.id; // Map user ID to socket ID
//     console.log(`${userId} connected: ${socket.id}`);
//   });

//   socket.on('send-message', ({ toUserId, message }) => {
//     const targetSocketId = users[toUserId];
//     if (targetSocketId) {
//       socket.to(targetSocketId).emit('receive-message', { message });
//     }
//   });

//   socket.on('disconnect', () => {
//     for (let userId in users) {
//       if (users[userId] === socket.id) {
//         delete users[userId];
//       }
//     }
//     console.log(`${socket.id} disconnected`);
//   });
// });

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// MongoDB connection
mongoose.connect('mongodb+srv://mugunthan:6384964273_m@chatty.jgkxj.mongodb.net/?retryWrites=true&w=majority&appName=Chatty', {})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

// User schema and model
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model('User', UserSchema);

// Chat schema and model
const ChatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // User IDs
  messages: [
    {
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Sender's user ID
      text: String, // Message content
      timestamp: { type: Date, default: Date.now }, // When the message was sent
    },
  ],
  createdAt: { type: Date, default: Date.now }, // When the chat was created
  updatedAt: { type: Date, default: Date.now }, // When the chat was last updated
});
const Chat = mongoose.model('Chat', ChatSchema);

// Routes

// User signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();

  res.status(201).json({ message: 'User created' });
});

// Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  res.json({ token, userId: user._id });
});

// Create a new chat
app.post('/chats', async (req, res) => {
  try {
    const { participantIds } = req.body;

    if (!participantIds || participantIds.length < 2) {
      return res.status(400).json({ message: 'A chat must include at least two participants.' });
    }

    const newChat = new Chat({ participants: participantIds });
    await newChat.save();

    res.status(201).json({ message: 'Chat created', chatId: newChat._id });
  } catch (err) {
    res.status(500).json({ message: 'Error creating chat', error: err.message });
  }
});

// Add a message to an existing chat
app.post('/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { senderId, text } = req.body;

    if (!senderId || !text) {
      return res.status(400).json({ message: 'Sender ID and message text are required.' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    chat.messages.push({ senderId, text, timestamp: new Date() });
    chat.updatedAt = new Date();
    await chat.save();

    res.status(200).json({ message: 'Message added' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding message', error: err.message });
  }
});

// Server listening
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
