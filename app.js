// ================================================
// PWA Service Worker Registration
// ================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registered successfully');
        showToast('App is ready to work offline!', 'success');
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// ================================================
// PWA Install Prompt
// ================================================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBanner = document.getElementById('install-banner');
  if (installBanner) {
    installBanner.classList.remove('hidden');
  }
});

const installBtn = document.getElementById('install-btn');
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      showToast('App installed successfully! 🎉', 'success');
    }
    
    deferredPrompt = null;
    document.getElementById('install-banner').classList.add('hidden');
  });
}

const dismissBtn = document.getElementById('dismiss-btn');
if (dismissBtn) {
  dismissBtn.addEventListener('click', () => {
    document.getElementById('install-banner').classList.add('hidden');
  });
}

// ================================================
// Online/Offline Status
// ================================================
function updateOnlineStatus() {
  const statusBadge = document.getElementById('online-status');
  if (navigator.onLine) {
    statusBadge.textContent = 'Online';
    statusBadge.classList.add('online');
    statusBadge.classList.remove('offline');
  } else {
    statusBadge.textContent = 'Offline';
    statusBadge.classList.remove('online');
    statusBadge.classList.add('offline');
  }
}

window.addEventListener('online', () => {
  updateOnlineStatus();
  showToast('Back online! 🌐', 'success');
});

window.addEventListener('offline', () => {
  updateOnlineStatus();
  showToast('You are offline. Changes will be saved locally.', 'info');
});

updateOnlineStatus();

// ================================================
// IndexedDB Setup
// ================================================
const DB_NAME = 'PostsDB';
const DB_VERSION = 1;
const STORE_NAME = 'posts';
let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      showToast('Database error occurred', 'error');
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('✅ Database connected successfully');
      loadPosts();
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        
        // Create indexes for searching
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        
        console.log('✅ Database created successfully');
      }
    };
  });
}

// Initialize database on page load
initDB();

// ================================================
// Handle URL Parameters (Share Target & Shortcuts)
// ================================================
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Handle share target
  const sharedTitle = urlParams.get('title');
  const sharedText = urlParams.get('text');
  
  if (sharedTitle || sharedText) {
    // Wait for DB to be ready
    setTimeout(() => {
      showForm();
      if (sharedTitle) {
        document.getElementById('post-name').value = sharedTitle;
      }
      if (sharedText) {
        document.getElementById('post-content').value = sharedText;
      }
    }, 500);
  }
  
  // Handle quick action (new post shortcut)
  const action = urlParams.get('action');
  if (action === 'new') {
    setTimeout(() => {
      showForm();
    }, 500);
  }
});

// ================================================
// CRUD Functions
// ================================================

// CREATE & UPDATE - Save Post
function savePost(event) {
  if (event) {
    event.preventDefault();
  }

  try {
    const id = document.getElementById('post-id').value;
    const name = document.getElementById('post-name').value.trim();
    const content = document.getElementById('post-content').value.trim();

    if (!name || !content) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const post = {
      name,
      content,
      timestamp: new Date().getTime(),
      lastModified: new Date().getTime()
    };

    // If ID exists, it's an update
    if (id) {
      post.id = parseInt(id);
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(post);

    request.onsuccess = () => {
      hideForm();
      loadPosts();
      const message = id ? 'Post updated successfully! ✨' : 'Post created successfully! 🎉';
      showToast(message, 'success');
    };

    request.onerror = (event) => {
      console.error('Error saving post:', event.target.error);
      showToast('Failed to save post', 'error');
    };
  } catch (error) {
    console.error('Error in savePost:', error);
    showToast('An error occurred while saving', 'error');
  }
}

// READ - Load All Posts
function loadPosts() {
  if (!db) {
    console.warn('Database not ready yet');
    return;
  }

  try {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => {
      const posts = event.target.result;
      // Sort by timestamp (newest first)
      posts.sort((a, b) => b.timestamp - a.timestamp);
      renderPosts(posts);
      updatePostsCount(posts.length);
    };

    request.onerror = (event) => {
      console.error('Error loading posts:', event.target.error);
      showToast('Failed to load posts', 'error');
    };
  } catch (error) {
    console.error('Error in loadPosts:', error);
  }
}

// DELETE - Delete Post
function deletePost(id) {
  const confirmDelete = confirm('Are you sure you want to delete this post? This action cannot be undone.');
  
  if (!confirmDelete) return;

  try {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      loadPosts();
      showToast('Post deleted successfully! 🗑️', 'success');
    };

    request.onerror = (event) => {
      console.error('Error deleting post:', event.target.error);
      showToast('Failed to delete post', 'error');
    };
  } catch (error) {
    console.error('Error in deletePost:', error);
    showToast('An error occurred while deleting', 'error');
  }
}

// EDIT - Load Post for Editing
function editPost(id) {
  try {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = (event) => {
      const post = event.target.result;
      if (post) {
        document.getElementById('post-id').value = post.id;
        document.getElementById('post-name').value = post.name;
        document.getElementById('post-content').value = post.content;
        document.getElementById('form-title').textContent = 'Edit';
        document.getElementById('save-btn-text').textContent = 'Update Post';
        showForm();
      }
    };

    request.onerror = (event) => {
      console.error('Error loading post:', event.target.error);
      showToast('Failed to load post', 'error');
    };
  } catch (error) {
    console.error('Error in editPost:', error);
    showToast('An error occurred', 'error');
  }
}

// ================================================
// UI Functions
// ================================================

// Render Posts to the Grid
function renderPosts(posts) {
  const listDiv = document.getElementById('posts-list');
  const emptyState = document.getElementById('empty-state');

  if (!posts || posts.length === 0) {
    listDiv.innerHTML = '';
    if (emptyState) {
      emptyState.classList.remove('hidden');
    }
    return;
  }

  if (emptyState) {
    emptyState.classList.add('hidden');
  }

  listDiv.innerHTML = posts.map(post => {
    const date = new Date(post.timestamp);
    const timeAgo = getTimeAgo(date);
    const truncatedContent = post.content.length > 150 
      ? post.content.substring(0, 150) + '...' 
      : post.content;

    return `
      <div class="post-card" onclick="viewPost(${post.id})">
        <div class="post-header">
          <div>
            <h3 class="post-title">${escapeHtml(post.name)}</h3>
            <div class="post-time">🕐 ${timeAgo}</div>
          </div>
        </div>
        <p class="post-content">${escapeHtml(truncatedContent)}</p>
        <div class="post-actions">
          <button class="btn-edit" onclick="event.stopPropagation(); editPost(${post.id})">
            ✏️ Edit
          </button>
          <button class="btn-delete" onclick="event.stopPropagation(); deletePost(${post.id})">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// View Full Post (Click on Card)
function viewPost(id) {
  try {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = (event) => {
      const post = event.target.result;
      if (post) {
        showPostDetailModal(post);
      }
    };
  } catch (error) {
    console.error('Error viewing post:', error);
  }
}

// Show Post Detail Modal
function showPostDetailModal(post) {
  const date = new Date(post.timestamp);
  const formattedDate = date.toLocaleString();
  
  const modal = document.getElementById('modal-overlay');
  modal.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h2>${escapeHtml(post.name)}</h2>
        <button onclick="document.getElementById('modal-overlay').classList.add('hidden')" class="btn-close">✕</button>
      </div>
      <div class="modal-body">
        <div style="color: var(--text-tertiary); margin-bottom: var(--spacing-lg); font-size: 0.875rem;">
          📅 Created: ${formattedDate}
        </div>
        <div style="line-height: 1.8; white-space: pre-wrap; color: var(--text-secondary);">
          ${escapeHtml(post.content)}
        </div>
        <div style="margin-top: var(--spacing-xl); display: flex; gap: var(--spacing-md);">
          <button onclick="editPost(${post.id})" class="btn btn-primary" style="flex: 1;">
            ✏️ Edit Post
          </button>
          <button onclick="deletePost(${post.id}); document.getElementById('modal-overlay').classList.add('hidden');" 
                  class="btn btn-secondary" style="flex: 1; background: var(--danger); color: white;">
            🗑️ Delete Post
          </button>
        </div>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  
  // Close on overlay click
  modal.onclick = () => {
    modal.classList.add('hidden');
  };
}

// Search Posts
function searchPosts() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();

  if (!db) return;

  try {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => {
      const allPosts = event.target.result;
      
      const filteredPosts = query 
        ? allPosts.filter(post =>
            post.name.toLowerCase().includes(query) ||
            post.content.toLowerCase().includes(query)
          )
        : allPosts;
      
      // Sort by timestamp
      filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
      renderPosts(filteredPosts);
      
      if (query && filteredPosts.length === 0) {
        document.getElementById('posts-list').innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: var(--spacing-2xl);">
            <div style="font-size: 3rem; margin-bottom: var(--spacing-md);">🔍</div>
            <h3>No posts found</h3>
            <p style="color: var(--text-secondary);">Try a different search term</p>
          </div>
        `;
      }
    };
  } catch (error) {
    console.error('Error searching posts:', error);
  }
}

// Form Management
function showForm() {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('form-title').textContent = 'Create';
  document.getElementById('save-btn-text').textContent = 'Save Post';
  document.getElementById('post-id').value = '';
  document.getElementById('post-name').value = '';
  document.getElementById('post-content').value = '';
  document.getElementById('post-name').focus();
}

function hideForm() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('post-form').reset();
  document.getElementById('post-id').value = '';
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal-overlay');
    if (modal && !modal.classList.contains('hidden')) {
      hideForm();
    }
  }
});

// Update Posts Count Badge
function updatePostsCount(count) {
  const badge = document.getElementById('posts-count');
  if (badge) {
    badge.textContent = `${count} ${count === 1 ? 'post' : 'posts'}`;
  }
}

// ================================================
// Utility Functions
// ================================================

// Show Toast Notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Format Time Ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
}

// Escape HTML to Prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ================================================
// PWA Lifecycle Events
// ================================================

// Handle app updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    showToast('App updated! Refresh to see changes.', 'info');
  });
}

// Log installation
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA was installed successfully');
  showToast('App installed! You can now use it offline.', 'success');
});

console.log('📱 Posts Manager PWA Loaded Successfully!');
