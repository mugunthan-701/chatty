const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
const PORT = process.env.PORT || 6001;


app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User schema and model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', UserSchema);

// Chat schema and model
const ChatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [
    {
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});
const Chat = mongoose.model('Chat', ChatSchema);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid Token' });
  }
};

// Simple route to show all users (for DB connection verification)
app.get('/show-users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// User signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ message: 'Username already exists' });
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();
  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.status(201).json({ token, userId: newUser._id, username });
});

// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, userId: user._id, username });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
});

// Get all users (protected route)
app.get('/users', verifyToken, async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// Create or fetch a chat
app.post('/chats', verifyToken, async (req, res) => {
  try {
    const { participantIds } = req.body;
    let chat = await Chat.findOne({ participants: { $all: participantIds, $size: participantIds.length } });
    if (!chat) {
      chat = new Chat({ participants: participantIds, messages: [] });
      await chat.save();
    }
    res.status(201).json({ chat });
  } catch (err) {
    res.status(500).json({ message: 'Error creating or fetching chat', error: err.message });
  }
});

// Fetch chat messages
app.get('/chats/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    res.status(200).json({ messages: chat.messages });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages', error: err.message });
  }
});

// Send a message
app.post('/chats/:chatId/messages', verifyToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    const message = { senderId: req.user.id, text, timestamp: new Date() };
    chat.messages.push(message);
    await chat.save();

    // Emit the message to both participants in the chat
    io.to(chatId).emit('newMessage', { message });

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: 'Error sending message', error: err.message });
  }
});

// --- Socket.IO for real-time chat ---
io.on('connection', (socket) => {
  // Join chat room
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
  });

  // (Optional) Handle disconnects, typing, etc.
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
