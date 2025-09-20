const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Messages storage
let messages = [];
const messagesFile = 'messages.json';
if (fs.existsSync(messagesFile)) {
  messages = JSON.parse(fs.readFileSync(messagesFile));
} else {
  fs.writeFileSync(messagesFile, JSON.stringify([]));
}

function saveMessages() {
  fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.')); // Serve static files like HTML
app.use('/uploads', express.static('uploads'));

const wallpaperDir = path.join(__dirname, 'wallpaper');

// Add healthcheck endpoint for Railway
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'wallpaper') {
      cb(null, wallpaperDir);
    } else {
      cb(null, path.join(__dirname, 'uploads'));
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File filter for chat messages (images and videos)
const chatFileFilter = (req, file, cb) => {
  if (file.fieldname === 'file') {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|ogg|mov|avi|wmv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file gambar dan video yang diizinkan untuk chat'));
    }
  } else {
    cb(null, true); // Allow other files for other endpoints
  }
};

const upload = multer({
  storage: storage,
  fileFilter: chatFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for chat files
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
// Ensure wallpaper directory exists
if (!fs.existsSync(wallpaperDir)) {
  fs.mkdirSync(wallpaperDir);
}

// Load users from file
let users = [];
const usersFile = 'users.json';
if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile));
} else {
  // Create default admin user if users.json does not exist
  users.push({
    username: 'advan',
    password: 'advan',
    profile_photo: null,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    lastLogout: null,
    role: 'admin'
  });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// If admin user 'advan' does not exist in users, add it
if (!users.find(u => u.username === 'advan')) {
  users.push({
    username: 'advan',
    password: 'advan',
    profile_photo: null,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    lastLogout: null,
    role: 'admin'
  });
  saveUsers();
}

// If admin user 'admin' does not exist in users, add it
if (!users.find(u => u.username === 'admin')) {
  users.push({
    username: 'admin',
    password: 'admin',
    profile_photo: 'python.png',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    lastLogout: null,
    role: 'admin'
  });
  saveUsers();
}

// Save users to file
function saveUsers() {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
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
    profile_photo: req.file ? req.file.filename : null,
    createdAt: new Date().toISOString() || new Date().toString(),
    lastLogin: null,
    lastLogout: null,
    role: 'member'
  };
  users.push(user);
  saveUsers();
  res.json({ message: 'Akun berhasil dibuat' });
});

// Add user endpoint for admin/member creation
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
  // Check if trying to add admin, only admin can add admin
  if (role === 'admin') {
    const adder = users.find(u => u.username === added_by);
    if (!adder || adder.role !== 'admin') {
      return res.status(403).json({ message: 'Hanya admin yang bisa menambah admin' });
    }
  }
  const user = {
    username,
    password,
    profile_photo: req.file ? req.file.filename : null,
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
  // Delete profile photo file if exists
  const user = users[userIndex];
  if (user.profile_photo) {
    const photoPath = path.join(__dirname, 'uploads', user.profile_photo);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
  }
  users.splice(userIndex, 1);
  saveUsers();
  res.json({ message: 'Akun berhasil dihapus' });
});

const wallpaperFile = 'wallpaper.json';

// Load wallpaper data from file
let wallpaperData = { path: null, type: null };
if (fs.existsSync(wallpaperFile)) {
  wallpaperData = JSON.parse(fs.readFileSync(wallpaperFile));
} else {
  // Initialize wallpaper.json with null data
  fs.writeFileSync(wallpaperFile, JSON.stringify({ path: null, type: null }, null, 2));
}

// Save wallpaper data to file
function saveWallpaperPath(path, type = null) {
  wallpaperData = { path, type };
  fs.writeFileSync(wallpaperFile, JSON.stringify(wallpaperData, null, 2));
}

// Upload wallpaper endpoint
app.post('/upload-wallpaper', (req, res) => {
  upload.single('wallpaper')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ message: 'Upload gagal: ' + err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'File tidak ditemukan' });
    }
    const filePath = '/wallpaper/' + req.file.filename;
    saveWallpaperPath(filePath, req.file.mimetype);
    res.json({ message: 'Upload berhasil', filePath });
  });
});

// Get current wallpaper path
app.get('/wallpaper', (req, res) => {
  res.json(wallpaperData);
});

// Get list of uploaded wallpapers
app.get('/wallpapers', (req, res) => {
  fs.readdir(wallpaperDir, (err, files) => {
    if (err) {
      return res.status(500).json({ message: 'Error reading wallpapers' });
    }
    const wallpapers = files.map(file => {
      const ext = path.extname(file).toLowerCase();
      const type = ['.mp4', '.avi', '.mov', '.wmv'].includes(ext) ? 'video' : 'image';
      return {
        name: file,
        path: '/wallpaper/' + file,
        type
      };
    });
    res.json({ wallpapers });
  });
});

// Set wallpaper from existing
app.post('/set-wallpaper', (req, res) => {
  const { path } = req.body;
  if (!path) {
    return res.status(400).json({ message: 'Path tidak ditemukan' });
  }
  saveWallpaperPath(path);
  res.json({ message: 'Wallpaper berhasil diset' });
});

// Delete wallpaper
app.post('/delete-wallpaper', (req, res) => {
  const wallpaperPath = req.body.path;
  if (!wallpaperPath) {
    return res.status(400).json({ message: 'Path diperlukan' });
  }
  const filename = wallpaperPath.replace('/wallpaper/', '');
  const fullPath = path.join(wallpaperDir, filename);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    // If it's the current wallpaper, reset
    if (wallpaperData.path === wallpaperPath) {
      saveWallpaperPath(null, null);
    }
    res.json({ message: 'Wallpaper berhasil dihapus' });
  } else {
    res.status(404).json({ message: 'File tidak ditemukan' });
  }
});

const portfolioFile = 'portfolio.json';

// Load portfolio data from file
let portfolios = {};
if (fs.existsSync(portfolioFile)) {
  portfolios = JSON.parse(fs.readFileSync(portfolioFile));
} else {
  fs.writeFileSync(portfolioFile, JSON.stringify({}));
}

// Save portfolio data to file
function savePortfolios() {
  fs.writeFileSync(portfolioFile, JSON.stringify(portfolios, null, 2));
}

// Get portfolio for a user
app.get('/api/portfolio', (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ message: 'Username diperlukan' });
  }
  const portfolio = portfolios[username] || { description: '', items: [] };
  res.json(portfolio);
});

// New endpoint to get portfolio files list for a user
app.get('/api/portfolio/files', (req, res) => {
  const username = req.query.username;
  console.log('GET /api/portfolio/files called with username:', username);
  if (!username) {
    console.log('Username missing in query');
    return res.status(400).json({ message: 'Username diperlukan' });
  }
  const portfolio = portfolios[username];
  if (!portfolio) {
    console.log('Portfolio not found for username:', username);
    return res.status(404).json({ message: 'Portofolio tidak ditemukan' });
  }
  console.log('Portfolio found:', portfolio);
  // Return only the items array as files
  res.json({ files: portfolio.items || [] });
});

// New backend for portfolio file upload
app.post('/api/portfolio/upload', (req, res) => {
  upload.array('files')(req, res, (err) => {
    console.log('Received request to /api/portfolio/upload');
    console.log('Headers:', req.headers);
    console.log('Files:', req.files);
    console.log('Body:', req.body);

    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ message: 'Upload failed: ' + err.message });
    }

    const username = req.headers['x-username'];
    if (!username) {
      console.log('Username header missing');
      return res.status(400).json({ message: 'Username diperlukan' });
    }

    // Initialize portfolio if not exists
    if (!portfolios[username]) {
      portfolios[username] = { description: '', items: [] };
    }

    // Update description if provided
    if (req.body.description !== undefined) {
      portfolios[username].description = req.body.description;
    }

    // If files are provided, add them
    if (req.files && req.files.length > 0) {
      // Save uploaded files info to portfolio items
      let items = req.files.map(file => ({
        type: 'file',
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        url: '/uploads/' + file.filename
      }));

      // Append new items to existing portfolio items
      portfolios[username].items = portfolios[username].items.concat(items);
    }

    savePortfolios();
    console.log('Portfolio updated for user:', username);
    res.json({ message: 'Portofolio berhasil diperbarui' });
  });
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

app.post('/api/update-profile-photo', (req, res) => {
  upload.single('profile_photo')(req, res, (err) => {
    console.log('Received request to /api/update-profile-photo');
    console.log('Headers:', req.headers);
    console.log('File:', req.file);

    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ message: 'Upload failed: ' + err.message });
    }

    const username = req.headers['x-username'];

    if (!username) {
      console.log('Username header missing');
      return res.status(400).json({ message: 'Username diperlukan' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
      console.log('User not found:', username);
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'File foto diperlukan' });
    }

    // Delete old photo if exists
    if (user.profile_photo) {
      const oldPath = path.join(__dirname, 'uploads', user.profile_photo);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        console.log('Deleted old photo:', oldPath);
      }
    }

    user.profile_photo = req.file.filename;
    saveUsers();
    console.log('Profile photo updated for user:', username, 'New photo:', req.file.filename);
    res.json({ message: 'Foto profil berhasil diperbarui', profile_photo: req.file.filename });
  });
});

// Chat routes
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

app.post('/api/messages', upload.single('file'), (req, res) => {
  const { username, message } = req.body;
  if (!username || (!message && !req.file)) {
    return res.status(400).json({ message: 'Username dan pesan diperlukan' });
  }

  const newMessage = {
    id: Date.now().toString(),
    username,
    message: message || '',
    file: req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      url: '/uploads/' + req.file.filename
    } : null,
    timestamp: new Date().toISOString()
  };

  messages.push(newMessage);
  saveMessages();
  res.json({ message: 'Pesan berhasil dikirim', data: newMessage });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Healthcheck available at: http://localhost:${PORT}/`);
});
