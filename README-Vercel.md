# Deploy ke Vercel

## 🚀 **Langkah Deploy:**

### **1. Setup Vercel Account:**
```bash
1. Kunjungi: https://vercel.com
2. Sign up dengan GitHub/Google
3. No credit card required!
```

### **2. Deploy dari GitHub:**
```bash
1. Klik "New Project"
2. Import Git Repository
3. Connect repository "EgyRem/advan"
4. Settings:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: ./
   - Install Command: npm install
```

### **3. Environment Variables:**
```bash
NODE_ENV=production
```

### **4. Deploy:**
```bash
Klik "Deploy"
Tunggu 2-3 menit
URL akan muncul: https://advan-xxxxx.vercel.app
```

## ⚠️ **Catatan Penting:**

### **Fitur yang Berfungsi:**
```bash
✅ Login/Register
✅ User management
✅ Chat system
✅ Portfolio management
✅ Static pages
✅ API endpoints
```

### **Fitur yang Terbatas:**
```bash
⚠️ File upload - memory only (not persistent)
⚠️ Data storage - in-memory only
⚠️ Images - need to be re-uploaded after deploy
```

### **Free Tier Limits:**
```bash
✅ 100GB bandwidth/month
✅ Unlimited requests
✅ Global CDN
✅ SSL included
✅ Custom domains
```

## 🔧 **Troubleshooting:**

### **Jika Error:**
```bash
1. Check logs di Vercel dashboard
2. Verify package.json scripts
3. Check vercel-config.json
4. Ensure all dependencies installed
```

### **Test Local:**
```bash
npm install
npm start
# Server should run on http://localhost:3000
```

## 📱 **Setelah Deploy:**

### **URL Structure:**
```bash
https://advan-xxxxx.vercel.app/          # Dashboard
https://advan-xxxxx.vercel.app/login.html # Login page
https://advan-xxxxx.vercel.app/chat.html  # Chat page
```

### **API Endpoints:**
```bash
https://advan-xxxxx.vercel.app/api/*      # API routes
https://advan-xxxxx.vercel.app/users      # User list
```

## 🎯 **Keunggulan Vercel:**

```bash
✅ No credit card required
✅ Very fast deployment
✅ Global CDN included
✅ Perfect for demos
✅ Easy to use
✅ GitHub integration
```

**Vercel adalah pilihan terbaik untuk deploy aplikasi Anda tanpa biaya!**
