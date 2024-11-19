const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Socket } = require('socket.io');
const io = require('socket.io')(2000);
const app = express();
const PORT = 6001;
const JWT_SECRET = 'your-secret-key';
const users = {}; // To store connected users' socket IDs

io.on('connection', (socket) => {
  socket.on('user-connected', (userId) => {
    users[userId] = socket.id; // Map user ID to socket ID
    console.log(`${userId} connected: ${socket.id}`);
  });

  const io = require('socket.io')(2000, {
    cors: {
      origin: "http://localhost:5173", // React app origin
      methods: ["GET", "POST"],
      credentials: true // If you're using cookies
    }
  });
  
  socket.on('send-message', ({ toUserId, message }) => {
    const targetSocketId = users[toUserId];
    if (targetSocketId) {
      socket.to(targetSocketId).emit('receive-message', { message });
    }
  });

  socket.on('disconnect', () => {
    // Remove disconnected users
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
      }
    }
    console.log(`${socket.id} disconnected`);
  });
});

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

mongoose.connect('mongodb+srv://mugunthan:6384964273_m@chatty.jgkxj.mongodb.net/?retryWrites=true&w=majority&appName=Chatty', {
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', UserSchema);

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();

  res.status(201).json({ message: 'User created' });
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username'); // Retrieve all users, only selecting the 'username' field
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  res.json({ token, userId: user._id });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
