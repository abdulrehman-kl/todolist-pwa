# 🎮 Command Reference

Quick reference for all available commands to run your PWA.

---

## 🚀 Starting the Development Server

### Option 1: Node.js (if installed)
```bash
node server.js
```
Opens on: http://localhost:8000

### Option 2: Python 3
```bash
python -m http.server 8000
```
Opens on: http://localhost:8000

### Option 3: Python 2 (older systems)
```bash
python -m SimpleHTTPServer 8000
```
Opens on: http://localhost:8000

### Option 4: NPX (Node.js, no installation)
```bash
npx http-server -p 8000
```
Opens on: http://localhost:8000

### Option 5: NPX with auto-reload
```bash
npx live-server --port=8000
```
Opens browser automatically with live reload

### Option 6: PHP (if installed)
```bash
php -S localhost:8000
```
Opens on: http://localhost:8000

---

## 📦 NPM Scripts (if using package.json)

```bash
# Start with Node.js server
npm start

# Start with http-server
npm run serve

# Start with live-server (auto-reload)
npm run dev
```

---

## 🔍 Testing Commands

### Open in Browser
```bash
# Windows
start http://localhost:8000

# Mac
open http://localhost:8000

# Linux
xdg-open http://localhost:8000
```

### Check Service Worker
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

### Clear All Cache
```javascript
// In browser console
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
  console.log('All caches cleared!');
});
```

### Clear IndexedDB
```javascript
// In browser console
indexedDB.deleteDatabase('PostsDB').onsuccess = () => {
  console.log('Database deleted!');
  location.reload();
};
```

---

## 🧹 Cleanup Commands

### Clear Service Worker
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
  console.log('Service workers unregistered!');
});
```

### Full Reset (in console)
```javascript
// Unregister service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});

// Clear caches
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});

// Clear database
indexedDB.deleteDatabase('PostsDB');

// Reload
setTimeout(() => location.reload(), 1000);
```

---

## 🛠️ Development Tools

### Install Development Dependencies (optional)
```bash
# HTTP server
npm install -g http-server

# Live reload server
npm install -g live-server

# Browser sync
npm install -g browser-sync
```

### Using Browser Sync
```bash
browser-sync start --server --files "*.html, *.css, *.js"
```

---

## 📱 Mobile Testing

### Using ngrok (expose localhost to internet)
```bash
# Install ngrok: https://ngrok.com/download

# Start your server first on port 8000
node server.js

# In another terminal:
ngrok http 8000

# Use the https URL on mobile device
```

### Using localtunnel
```bash
# Install
npm install -g localtunnel

# Start your server
node server.js

# In another terminal:
lt --port 8000

# Use the provided URL
```

---

## 🔧 Build Commands (if you add build tools)

### Using Terser (minify JS)
```bash
# Install
npm install -g terser

# Minify
terser app.js -o app.min.js -c -m
```

### Using Clean-CSS (minify CSS)
```bash
# Install
npm install -g clean-css-cli

# Minify
cleancss -o style.min.css style.css
```

### Using HTML Minifier
```bash
# Install
npm install -g html-minifier

# Minify
html-minifier --collapse-whitespace --remove-comments index.html -o index.min.html
```

---

## 🐛 Debugging Commands

### Check if Service Worker is supported
```javascript
// In browser console
console.log('Service Worker:', 'serviceWorker' in navigator ? 'Supported ✅' : 'Not Supported ❌');
console.log('IndexedDB:', 'indexedDB' in window ? 'Supported ✅' : 'Not Supported ❌');
```

### View all posts in IndexedDB
```javascript
// In browser console
const request = indexedDB.open('PostsDB', 1);
request.onsuccess = (event) => {
  const db = event.target.result;
  const tx = db.transaction('posts', 'readonly');
  const store = tx.objectStore('posts');
  store.getAll().onsuccess = (e) => {
    console.table(e.target.result);
  };
};
```

### Force update service worker
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => {
    registration.update();
    console.log('Service worker updated!');
  });
});
```

---

## 📊 Performance Testing

### Lighthouse CLI
```bash
# Install
npm install -g lighthouse

# Run audit
lighthouse http://localhost:8000 --view

# Save report
lighthouse http://localhost:8000 --output html --output-path ./report.html
```

### Check Load Time
```javascript
// In browser console
performance.timing.loadEventEnd - performance.timing.navigationStart
// Result in milliseconds
```

---

## 🚀 Deployment Commands

### Deploy to GitHub Pages
```bash
# Create gh-pages branch
git checkout -b gh-pages

# Add and commit
git add .
git commit -m "Deploy to GitHub Pages"

# Push
git push origin gh-pages
```

### Deploy to Netlify (using CLI)
```bash
# Install
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=.
```

### Deploy to Vercel (using CLI)
```bash
# Install
npm install -g vercel

# Deploy
vercel --prod
```

### Deploy to Surge
```bash
# Install
npm install -g surge

# Deploy
surge
```

---

## 📋 Git Commands

### Initialize Repository
```bash
git init
git add .
git commit -m "Initial commit - Posts Manager PWA"
```

### Create GitHub Repository (using GitHub CLI)
```bash
# Install: https://cli.github.com/

gh repo create posts-manager-pwa --public --source=. --remote=origin
git push -u origin main
```

---

## 🎯 Quick Actions

### Full Restart (when things break)
```bash
# 1. Stop server (Ctrl+C)
# 2. Clear browser data (DevTools → Application → Clear Storage)
# 3. Start server again
node server.js
# 4. Hard refresh (Ctrl+Shift+R)
```

### Test PWA Installability
```javascript
// In browser console
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ PWA is installable!');
  deferredPrompt = e;
});
```

---

## 💡 Useful Browser Shortcuts

- **F12** - Open DevTools
- **Ctrl+Shift+R** - Hard refresh (clear cache)
- **Ctrl+Shift+I** - Open DevTools
- **Ctrl+Shift+C** - Inspect element
- **Ctrl+Shift+J** - Open Console
- **Ctrl+Shift+Delete** - Clear browsing data

---

## 🔗 Useful URLs (when server is running)

- **App**: http://localhost:8000
- **Manifest**: http://localhost:8000/manifest.json
- **Service Worker**: http://localhost:8000/service-worker.js
- **Icons**: http://localhost:8000/icons/

---

## 📝 One-Liner Setup

```bash
# Clone/download → cd into directory → run server
cd pwa && node server.js
```

---

## 🆘 Emergency Commands

### Port Already in Use?
```bash
# Windows - Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux - Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Then use a different port
node server.js  # Modify port in server.js
# or
python -m http.server 8080
```

### Can't Install Dependencies?
```bash
# Clear npm cache
npm cache clean --force

# Use npx instead (no installation needed)
npx http-server -p 8000
```

---

**Keep this file handy for quick reference! 🎯**


