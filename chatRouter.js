const express = require('express');
const router = express.Router();
const chatStorage = require('./chatStorage');
const users = require('./users.json');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Helper to get user profile photo by username
function getUserProfilePhoto(username) {
  const user = users.find(u => u.username === username);
  return user && user.profile_photo ? '/uploads/' + user.profile_photo : 'default-avatar.png';
}



// GET /api/chats/:username - get chats for user
router.get('/api/chats/:username', (req, res) => {
  const username = req.params.username;
  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }
  const chats = chatStorage.getChatsForUser(username);

  // Map chats to include name, avatar, lastMessage, lastTime, unreadCount, id
  const chatSummaries = chats.map(chat => {
    // Determine chat partner (other participant)
    const otherUser = chat.participants.find(p => p !== username);
    const messages = chatStorage.getMessagesBetweenUsers(username, otherUser);
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const unreadCount = messages.filter(m => m.to === username && !m.read).length;

    return {
      id: chat.id,
      name: otherUser,
      avatar: getUserProfilePhoto(otherUser),
      lastMessage: lastMessage ? lastMessage.text : '',
      lastTime: lastMessage ? lastMessage.timestamp : null,
      unreadCount,
    };
  });

  res.json(chatSummaries);
});

// GET /api/messages?user1=&user2= - get messages between two users
router.get('/api/messages', (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) {
    return res.status(400).json({ error: 'user1 and user2 query parameters required' });
  }
  const messages = chatStorage.getMessagesBetweenUsers(user1, user2);
  res.json(messages);
});

// POST /api/messages - send a message
router.post('/api/messages', upload.single('file'), (req, res) => {
  const from = req.body.from || req.headers['x-username'];
  const { to, text } = req.body;
  if (!from || !to || (!text && !req.file)) {
    return res.status(400).json({ error: 'from, to, and text or file are required' });
  }

  // Add message
  const newMessage = chatStorage.addMessage(from, to, text, req.file ? {
    fileUrl: '/uploads/' + req.file.filename,
    fileType: req.file.mimetype,
  } : null);

  // Update chats list - create chat if not exists
  const chats = chatStorage.getChatsForUser(from);
  const chatExists = chats.some(chat => chat.participants.includes(to));
  if (!chatExists) {
    // Create new chat
    const allChats = chatStorage.readJsonFile(chatStorage.chatsFilePath, []);
    const newChat = {
      id: Date.now().toString(),
      participants: [from, to],
    };
    allChats.push(newChat);
    chatStorage.writeJsonFile(chatStorage.chatsFilePath, allChats);
  }

  res.json({ msg: 'Message sent', message: newMessage });
});

// POST /api/messages/read - mark messages as read
router.post('/api/messages/read', (req, res) => {
  const { from, to } = req.body;
  if (!from || !to) {
    return res.status(400).json({ error: 'from and to are required' });
  }
  const updated = chatStorage.markMessagesAsRead(from, to);
  res.json({ msg: updated ? 'Messages marked as read' : 'No messages updated' });
});

module.exports = router;
