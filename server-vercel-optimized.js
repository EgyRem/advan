const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

// In-memory storage for Vercel (since no persistent file system)
let messages = [];
let users = [];
let wallpaperData = { path: null, type: null };
let portfolios = {};

// Initialize with default admin users
users.push({
  username: 'advan',
  password: 'advan',
  profile_photo: null,
  createdAt: new Date().toISOString(),
  lastLogin: null,
  lastLogout: null,
  role: 'admin'
});

users.push({
  username: 'admin',
  password: 'admin',
  profile_photo: 'python.png',
  createdAt: new Date().toISOString(),
  lastLogin: null,
  lastLogout: null,
  role: 'admin'
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.')); // Serve static files like HTML
app.use('/uploads', express.static('uploads'));

// Configure multer for memory storage (Vercel compatible)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Helper functions for in-memory data management
function saveUsers() {
  // In Vercel, data is stored in memory only
  console.log('Users updated in memory');
}

function saveMessages() {
  console.log('Messages updated in memory');
}

function savePortfolios() {
  console.log('Portfolios updated in memory');
}

function saveWallpaperPath(wallpaperPath, type = null) {
  wallpaperData = { path: wallpaperPath, type };
  console.log('Wallpaper updated in memory');
}

// Routes
app.post('/register', upload.single('profile_photo'), (req, res) => {
  const { new_username, new_password, confirm_password } = req.body;
  if (new_password !== confirm_password) {
    return res.status(400).json({ message: 'Password tidak cocok' });
  }
  if (users.find(u => u.username === new_username)) {
    return res.status(400).json({ message: 'Username sudah ada' });
  }
  const user = {
    username: new_username,
    password: new_password,
    profile_photo: req.file ? req.file.originalname : null,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    lastLogout: null,
    role: 'member'
  };
  users.push(user);
  saveUsers();
  res.json({ message: 'Akun berhasil dibuat' });
});

app.post('/api/add-user', upload.single('profile_photo'), (req, res) => {
  const { username, password, confirm_password, role, added_by } = req.body;
  if (!username || !password || !confirm_password || !role) {
    return res.status(400).json({ message: 'Semua field harus diisi' });
  }
  if (password !== confirm_password) {
    return res.status(400).json({ message: 'Password tidak cocok' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Username sudah ada' });
  }
  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ message: 'Role tidak valid' });
  }
  if (role === 'admin') {
    const adder = users.find(u => u.username === added_by);
    if (!adder || adder.role !== 'admin') {
      return res.status(403).json({ message: 'Hanya admin yang bisa menambah admin' });
    }
  }
  const user = {
    username,
    password,
    profile_photo: req.file ? req.file.originalname : null,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    lastLogout: null,
    role
  };
  users.push(user);
  saveUsers();
  res.json({ message: 'User berhasil ditambahkan' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    user.lastLogin = new Date().toISOString();
    saveUsers();
    console.log('Login user:', user.username, 'Role:', user.role);
    res.json({ message: 'Login berhasil', user });
  } else {
    res.status(401).json({ message: 'Username atau password salah' });
  }
});

app.get('/users', (req, res) => {
  res.json(users);
});

app.post('/logout', (req, res) => {
  const { username } = req.body;
  const user = users.find(u => u.username === username);
  if (user) {
    user.lastLogout = new Date().toISOString();
    saveUsers();
    res.json({ message: 'Logout berhasil' });
  } else {
    res.status(404).json({ message: 'User tidak ditemukan' });
  }
});

app.post('/delete-account', (req, res) => {
  const { username } = req.body;
  const userIndex = users.findIndex(u => u.username === username);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }
  users.splice(userIndex, 1);
  saveUsers();
  res.json({ message: 'Akun berhasil dihapus' });
});

// Wallpaper endpoints
app.post('/upload-wallpaper', upload.single('wallpaper'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File tidak ditemukan' });
  }
  const filePath = '/wallpaper/' + req.file.originalname;
  saveWallpaperPath(filePath, req.file.mimetype);
  res.json({ message: 'Upload berhasil', filePath });
});

app.get('/wallpaper', (req, res) => {
  res.json(wallpaperData);
});

app.get('/wallpapers', (req, res) => {
  // Return empty array for Vercel (no file system)
  res.json({ wallpapers: [] });
});

app.post('/set-wallpaper', (req, res) => {
  const { path } = req.body;
  if (!path) {
    return res.status(400).json({ message: 'Path tidak ditemukan' });
  }
  saveWallpaperPath(path);
  res.json({ message: 'Wallpaper berhasil diset' });
});

app.post('/delete-wallpaper', (req, res) => {
  const wallpaperPath = req.body.path;
  if (!wallpaperPath) {
    return res.status(400).json({ message: 'Path diperlukan' });
  }
  if (wallpaperData.path === wallpaperPath) {
    saveWallpaperPath(null, null);
  }
  res.json({ message: 'Wallpaper berhasil dihapus' });
});

// Portfolio endpoints
app.get('/api/portfolio', (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ message: 'Username diperlukan' });
  }
  const portfolio = portfolios[username] || { description: '', items: [] };
  res.json(portfolio);
});

app.get('/api/portfolio/files', (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ message: 'Username diperlukan' });
  }
  const portfolio = portfolios[username];
  if (!portfolio) {
    return res.status(404).json({ message: 'Portofolio tidak ditemukan' });
  }
  res.json({ files: portfolio.items || [] });
});

app.post('/api/portfolio/upload', upload.array('files'), (req, res) => {
  const username = req.headers['x-username'];
  if (!username) {
    return res.status(400).json({ message: 'Username diperlukan' });
  }

  if (!portfolios[username]) {
    portfolios[username] = { description: '', items: [] };
  }

  if (req.body.description !== undefined) {
    portfolios[username].description = req.body.description;
  }

  if (req.files && req.files.length > 0) {
    let items = req.files.map(file => ({
      type: 'file',
      filename: file.originalname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      url: '/uploads/' + file.originalname
    }));

    portfolios[username].items = portfolios[username].items.concat(items);
  }

  savePortfolios();
  res.json({ message: 'Portofolio berhasil diperbarui' });
});

// Profile endpoints
app.get('/api/profile', (req, res) => {
  const username = req.query.username || req.headers['x-username'];
  if (!username) {
    return res.status(400).json({ message: 'Username diperlukan' });
  }

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }

  res.json({
    whatsapp: user.whatsapp || null,
    instagram: user.instagram || null
  });
});

app.post('/api/update-profile', (req, res) => {
  const { whatsapp, instagram } = req.body;
  const username = req.headers['x-username'];

  if (!username) {
    return res.status(400).json({ message: 'Username diperlukan' });
  }

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }

  user.whatsapp = whatsapp || null;
  user.instagram = instagram || null;

  saveUsers();
  res.json({ message: 'Profil berhasil diperbarui' });
});

app.post('/api/update-profile-photo', upload.single('profile_photo'), (req, res) => {
  const username = req.headers['x-username'];

  if (!username) {
    return res.status(400).json({ message: 'Username diperlukan' });
  }

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'File foto diperlukan' });
  }

  user.profile_photo = req.file.originalname;
  saveUsers();
  res.json({ message: 'Foto profil berhasil diperbarui', profile_photo: req.file.originalname });
});

// Health check endpoint for Vercel
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Server is running on Vercel',
    timestamp: new Date().toISOString()
  });
});

// Chat routes
app.use('/', require('./chatRouter'));

// Photo upload routes
app.use('/api', require('./photoUpload'));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
