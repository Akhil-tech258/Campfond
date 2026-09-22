/* ============================================================
   CAMPUSFIND — script.js
   College Lost & Found Platform
   Resilient Dual Engine: Firebase Firestore + LocalStorage Fallback
   Leaflet.js OpenStreetMap (100% Free, Zero API Key Required)
   ============================================================ */

'use strict';

// ==================== FIREBASE SETUP ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAYQw5TBlS-4QpKloucJx09qyMM2zCS8wo",
  authDomain: "campusfind-b0ff2.firebaseapp.com",
  projectId: "campusfind-b0ff2",
  storageBucket: "campusfind-b0ff2.firebasestorage.app",
  messagingSenderId: "689663260810",
  appId: "1:689663260810:web:14fc634acdac2635b95573"
};

let app = null;
let db = null;
let isCloudActive = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (err) {
  console.warn("Firebase initialization skipped/offline:", err);
}

// ==================== COLLEGE COORDINATES DATABASE ====================
const COLLEGE_COORDS = {
  "SVGPTC Tirupati": { lat: 13.6288, lng: 79.4192 },
  "Sri Venkateswara University (SVU), Tirupati": { lat: 13.6358, lng: 79.4042 },
  "IIT Madras": { lat: 12.9915, lng: 80.2337 },
  "IIT Bombay": { lat: 19.1334, lng: 72.9133 },
  "IIT Delhi": { lat: 28.5450, lng: 77.1926 },
  "NIT Trichy": { lat: 10.7589, lng: 78.8132 },
  "NIT Warangal": { lat: 17.9835, lng: 79.5308 },
  "Anna University, Chennai": { lat: 13.0110, lng: 80.2354 },
  "JNTU Anantapur": { lat: 14.6542, lng: 77.6074 },
  "JNTU Kakinada": { lat: 16.9786, lng: 82.2415 },
  "VIT Vellore": { lat: 12.9692, lng: 79.1559 },
  "SRM University": { lat: 12.8230, lng: 80.0444 },
  "Delhi University": { lat: 28.6892, lng: 77.2104 }
};

// ==================== REALISTIC SAMPLE DATA ====================
const SEED_ITEMS = [
  {
    id: "seed_1",
    name: "Student ID Card (CSE Dept)",
    category: "ID Cards",
    status: "lost",
    collegeName: "SVGPTC Tirupati",
    location: "Near Computer Lab 2, 1st Floor",
    description: "Diploma in CSE 2nd Year ID Card with blue college lanyard. Roll number ending with 042.",
    contact: "9876543210",
    date: new Date(Date.now() - 3600000 * 5).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    image: null,
    coords: { lat: 13.6288, lng: 79.4192 }
  },
  {
    id: "seed_2",
    name: "Casio fx-991CW Calculator",
    category: "Electronics",
    status: "found",
    collegeName: "SVGPTC Tirupati",
    location: "Central Library Reading Hall (Table #14)",
    description: "Scientific calculator with white sliding cover. Found after evening study hours. Safe with librarian.",
    contact: "library@svgptc.edu",
    date: new Date(Date.now() - 3600000 * 20).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    image: null,
    coords: { lat: 13.6288, lng: 79.4192 }
  },
  {
    id: "seed_3",
    name: "boAt Airdopes 141 (Black Case)",
    category: "Accessories",
    status: "lost",
    collegeName: "SVGPTC Tirupati",
    location: "Campus Canteen near counter 2",
    description: "Black charging case with a red silicone sleeve and small carabiner clip attached.",
    contact: "9123456789",
    date: new Date(Date.now() - 3600000 * 30).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    image: null,
    coords: { lat: 13.6295, lng: 79.4200 }
  },
  {
    id: "seed_4",
    name: "Fastrack Navy Blue Backpack",
    category: "Bags",
    status: "found",
    collegeName: "SVGPTC Tirupati",
    location: "Main Gate Security Cabin",
    description: "Contains 3 engineering drawing notebooks and a steel water bottle. Left near entrance bench.",
    contact: "security@svgptc.edu",
    date: new Date(Date.now() - 3600000 * 48).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    image: null,
    coords: { lat: 13.6280, lng: 79.4185 }
  },
  {
    id: "seed_5",
    name: "Higher Engineering Mathematics (B.S. Grewal)",
    category: "Books",
    status: "returned",
    collegeName: "SVGPTC Tirupati",
    location: "Mechanical Workshop Block",
    description: "Standard textbook with notes inside. Reunited with owner through CampusFind!",
    contact: "akhil@gmail.com",
    date: new Date(Date.now() - 3600000 * 72).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    image: null,
    coords: { lat: 13.6275, lng: 79.4190 }
  },
  {
    id: "seed_6",
    name: "HP 65W Type-C Laptop Adapter",
    category: "Electronics",
    status: "lost",
    collegeName: "Sri Venkateswara University (SVU), Tirupati",
    location: "Seminar Hall room 102",
    description: "Original HP Type-C power brick left plugged into the wall extension board.",
    contact: "8877665544",
    date: new Date(Date.now() - 3600000 * 18).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    image: null,
    coords: { lat: 13.6358, lng: 79.4042 }
  }
];

// ==================== STATE ====================
let allItems = [];
let currentFilters = { search: '', category: 'all', status: 'all', college: 'all' };
let currentUploadedImageData = null;

let map = null;
let markersLayer = null;
let userLocationMarker = null;

// ==================== DOM ELEMENTS ====================
const elements = {
  themeToggle: document.getElementById('themeToggle'),
  mobileMenuBtn: document.getElementById('mobileMenuBtn'),
  navLinks: document.getElementById('navLinks'),
  storageStatusPill: document.getElementById('storageStatusPill'),
  storageStatusText: document.getElementById('storageStatusText'),
  heroSearchInput: document.getElementById('heroSearchInput'),
  heroCollegeSearch: document.getElementById('heroCollegeSearch'),
  mapCollegeSearch: document.getElementById('mapCollegeSearch'),
  detectLocationBtn: document.getElementById('detectLocationBtn'),
  locationStatus: document.getElementById('locationStatus'),
  itemsGrid: document.getElementById('itemsGrid'),
  emptyState: document.getElementById('emptyState'),
  recoveredScroll: document.getElementById('recoveredScroll'),
  reportModalOverlay: document.getElementById('reportModalOverlay'),
  reportForm: document.getElementById('reportForm'),
  submitReportBtn: document.getElementById('submitReportBtn'),
  toastContainer: document.getElementById('toastContainer'),
  searchInput: document.getElementById('searchInput'),
  filterCategory: document.getElementById('filterCategory'),
  filterStatus: document.getElementById('filterStatus'),
  filterCollege: document.getElementById('filterCollege'),
  clearFilters: document.getElementById('clearFilters'),
  activeFilters: document.getElementById('activeFilters'),
  refreshItemsBtn: document.getElementById('refreshItemsBtn'),
  detailModalOverlay: document.getElementById('detailModalOverlay'),
  detailModalBody: document.getElementById('detailModalBody'),
  closeDetailModal: document.getElementById('closeDetailModal'),
  itemImage: document.getElementById('itemImage'),
  uploadPlaceholder: document.getElementById('uploadPlaceholder'),
  previewContainer: document.getElementById('previewContainer'),
  uploadPreview: document.getElementById('uploadPreview'),
  removeImgBtn: document.getElementById('removeImgBtn'),
  stats: {
    lost: document.getElementById('statLost'),
    found: document.getElementById('statFound'),
    returned: document.getElementById('statReturned'),
    colleges: document.getElementById('statColleges')
  }
};

// ==================== UTILS ====================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 320);
  }, 3200);
}

function parseTimestamp(ts) {
  if (!ts) return new Date();
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  const d = new Date(ts);
  return isNaN(d.getTime()) ? new Date() : d;
}

function getRelativeTime(date) {
  const now = new Date();
  const then = parseTimestamp(date);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return then.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function getCategoryEmoji(cat) {
  const emojis = {
    'Mobiles': '📱',
    'ID Cards': '🪪',
    'Books': '📚',
    'Bags': '🎒',
    'Electronics': '💻',
    'Accessories': '⌚',
    'Others': '📦'
  };
  return emojis[cat] || '📦';
}

function updateConnectionStatus(status) {
  const pill = elements.storageStatusPill;
  const label = elements.storageStatusText;
  if (!pill || !label) return;

  pill.classList.remove('status-connecting', 'status-online', 'status-local');
  if (status === 'online') {
    pill.classList.add('status-online');
    label.textContent = '🟢 Cloud Sync Active';
    pill.title = 'Connected to Firebase Firestore cloud database';
  } else if (status === 'local') {
    pill.classList.add('status-local');
    label.textContent = '💾 Local Storage Mode';
    pill.title = 'Running in offline LocalStorage mode (Update Firebase rules in console to sync globally)';
  } else {
    pill.classList.add('status-connecting');
    label.textContent = 'Connecting...';
  }
}

// ==================== STORAGE & DATA OPERATIONS ====================
function getLocalItems() {
  try {
    const raw = localStorage.getItem('campusfind_items');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading localStorage:", e);
  }
  // Initialize with seed items
  localStorage.setItem('campusfind_items', JSON.stringify(SEED_ITEMS));
  return SEED_ITEMS;
}

function saveLocalItems(items) {
  try {
    localStorage.setItem('campusfind_items', JSON.stringify(items));
  } catch (e) {
    console.error("Error saving to localStorage:", e);
  }
}

async function loadItems() {
  // Step 1: Render cached/local items immediately to avoid empty layout
  allItems = getLocalItems();
  renderAll();

  // Step 2: Try Firebase Firestore
  if (db) {
    try {
      const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const cloudItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (cloudItems.length > 0) {
        allItems = cloudItems;
        saveLocalItems(allItems);
      }
      isCloudActive = true;
      updateConnectionStatus('online');
      renderAll();
      return;
    } catch (error) {
      console.warn("Firestore access error (falling back to LocalStorage):", error.message);
      isCloudActive = false;
      updateConnectionStatus('local');
    }
  } else {
    isCloudActive = false;
    updateConnectionStatus('local');
  }
}

async function submitReport(e) {
  e.preventDefault();
  const btn = elements.submitReportBtn;
  const btnText = btn.querySelector('.btn-text');
  const btnLoader = btn.querySelector('.btn-loader');
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';
  btn.disabled = true;

  const collegeName = document.getElementById('reportCollegeName').value.trim();
  const coords = COLLEGE_COORDS[collegeName] || { lat: 13.6288, lng: 79.4192 };

  const newItem = {
    id: 'cf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    name: document.getElementById('itemName').value.trim(),
    category: document.getElementById('reportCategory').value,
    status: document.getElementById('reportStatus').value,
    collegeName: collegeName,
    location: document.getElementById('reportLocation').value.trim(),
    description: document.getElementById('reportDescription').value.trim(),
    contact: document.getElementById('reportContact').value.trim(),
    date: document.getElementById('reportDate').value,
    createdAt: new Date().toISOString(),
    image: currentUploadedImageData,
    coords: coords
  };

  // Save to LocalStorage immediately
  allItems.unshift(newItem);
  saveLocalItems(allItems);

  // Attempt Cloud Firestore Sync
  if (isCloudActive && db) {
    try {
      const cloudPayload = { ...newItem, createdAt: serverTimestamp() };
      const docRef = await addDoc(collection(db, "items"), cloudPayload);
      newItem.id = docRef.id;
      saveLocalItems(allItems);
    } catch (cloudErr) {
      console.warn("Could not sync new report to Firestore:", cloudErr.message);
    }
  }

  // Reset form & UI
  elements.reportForm.reset();
  resetImageUpload();
  closeReportModal();
  renderAll();
  showToast('✅ Report submitted successfully!');

  btnText.style.display = 'inline';
  btnLoader.style.display = 'none';
  btn.disabled = false;
}

async function markReturned(itemId) {
  const item = allItems.find(i => i.id === itemId);
  if (!item) return;

  item.status = 'returned';
  saveLocalItems(allItems);
  renderAll();
  showToast('🎉 Item marked as returned!');

  if (isCloudActive && db) {
    try {
      await updateDoc(doc(db, "items", itemId), { status: 'returned' });
    } catch (e) {
      console.warn("Could not update returned status on cloud:", e.message);
    }
  }
}

async function deleteReport(itemId) {
  if (!confirm('Are you sure you want to remove this report?')) return;

  allItems = allItems.filter(i => i.id !== itemId);
  saveLocalItems(allItems);
  closeDetailModal();
  renderAll();
  showToast('🗑️ Report removed.');

  if (isCloudActive && db) {
    try {
      await deleteDoc(doc(db, "items", itemId));
    } catch (e) {
      console.warn("Could not delete from cloud:", e.message);
    }
  }
}

// ==================== IMAGE COMPRESSION ====================
function handleImageSelect(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxDim = 600;
      let w = img.width;
      let h = img.height;
      if (w > h && w > maxDim) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else if (h > maxDim) {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      currentUploadedImageData = canvas.toDataURL('image/jpeg', 0.75);

      elements.uploadPreview.src = currentUploadedImageData;
      elements.previewContainer.style.display = 'block';
      elements.uploadPlaceholder.style.display = 'none';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function resetImageUpload() {
  currentUploadedImageData = null;
  elements.itemImage.value = '';
  elements.uploadPreview.src = '';
  elements.previewContainer.style.display = 'none';
  elements.uploadPlaceholder.style.display = 'flex';
}

// ==================== RENDERING ====================
function getFilteredItems() {
  return allItems.filter(item => {
    const term = currentFilters.search.toLowerCase();
    const matchSearch = !term ||
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.location && item.location.toLowerCase().includes(term)) ||
      (item.collegeName && item.collegeName.toLowerCase().includes(term));

    const matchCategory = currentFilters.category === 'all' || item.category === currentFilters.category;
    const matchStatus = currentFilters.status === 'all' || item.status === currentFilters.status;
    const matchCollege = currentFilters.college === 'all' || item.collegeName === currentFilters.college;

    return matchSearch && matchCategory && matchStatus && matchCollege;
  });
}

function renderItems() {
  const filtered = getFilteredItems();
  elements.itemsGrid.innerHTML = '';

  if (filtered.length === 0) {
    elements.emptyState.style.display = 'block';
  } else {
    elements.emptyState.style.display = 'none';
    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card';

      const photoContent = item.image
        ? `<img src="${item.image}" alt="${escapeHtml(item.name)}" class="card-photo" loading="lazy">`
        : `<span class="placeholder-emoji">${getCategoryEmoji(item.category)}</span>`;

      card.innerHTML = `
        <div class="card-img">
          ${photoContent}
          <span class="card-badge badge-${item.status}">${item.status}</span>
        </div>
        <div class="card-body">
          <div class="card-college">🏛️ ${escapeHtml(item.collegeName || 'Campus')}</div>
          <div class="card-title">${escapeHtml(item.name)}</div>
          <div class="card-location">📍 ${escapeHtml(item.location)}</div>
          <div class="card-date">📅 ${item.date || 'Recent'} • ${getRelativeTime(item.createdAt)}</div>
          <div class="card-desc">${escapeHtml(item.description ? item.description.slice(0, 110) + (item.description.length > 110 ? '...' : '') : '')}</div>
          <div class="card-actions-row">
            <button class="btn btn-outline btn-sm view-detail-btn" data-id="${item.id}">🔍 View & Contact</button>
            ${item.status !== 'returned' ? `<button class="btn btn-primary btn-sm mark-card-btn" data-id="${item.id}">✅ Reunited</button>` : ''}
          </div>
        </div>`;

      // Card click opens detail
      card.addEventListener('click', (e) => {
        if (e.target.closest('.mark-card-btn')) return;
        openDetailModal(item.id);
      });

      // Quick mark returned
      const markBtn = card.querySelector('.mark-card-btn');
      if (markBtn) {
        markBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          markReturned(item.id);
        });
      }

      elements.itemsGrid.appendChild(card);
    });
  }

  // Returned scroll strip
  const returnedItems = allItems.filter(i => i.status === 'returned').slice(0, 8);
  elements.recoveredScroll.innerHTML = returnedItems.length
    ? returnedItems.map(i => `
        <div class="recovered-card">
          <div class="rec-emoji">${getCategoryEmoji(i.category)}</div>
          <div class="rec-title">${escapeHtml(i.name)}</div>
          <div class="rec-college">${escapeHtml(i.collegeName)}</div>
        </div>`).join('')
    : '<div class="recovered-card"><p>No items returned yet.</p></div>';
}

function updateStats() {
  elements.stats.lost.textContent = allItems.filter(i => i.status === 'lost').length;
  elements.stats.found.textContent = allItems.filter(i => i.status === 'found').length;
  elements.stats.returned.textContent = allItems.filter(i => i.status === 'returned').length;

  const uniqueColleges = new Set(allItems.map(i => i.collegeName).filter(Boolean));
  elements.stats.colleges.textContent = uniqueColleges.size;
}

function updateCollegeFilter() {
  const select = elements.filterCollege;
  const currentVal = select.value;
  const unique = [...new Set(allItems.map(i => i.collegeName).filter(Boolean))].sort();

  select.innerHTML = '<option value="all">🏛️ All Colleges</option>';
  unique.forEach(cName => {
    const opt = document.createElement('option');
    opt.value = cName;
    opt.textContent = cName;
    select.appendChild(opt);
  });

  if (unique.includes(currentVal)) {
    select.value = currentVal;
  }
}

function renderActiveFilters() {
  const tags = [];
  if (currentFilters.college !== 'all') tags.push({ label: `🏛️ ${currentFilters.college}`, key: 'college' });
  if (currentFilters.category !== 'all') tags.push({ label: `📂 ${currentFilters.category}`, key: 'category' });
  if (currentFilters.status !== 'all') tags.push({ label: currentFilters.status === 'lost' ? '🔴 Lost' : currentFilters.status === 'found' ? '🟢 Found' : '🟣 Returned', key: 'status' });
  if (currentFilters.search) tags.push({ label: `🔍 "${currentFilters.search}"`, key: 'search' });

  elements.activeFilters.innerHTML = tags.map(t => `<span class="filter-tag" data-key="${t.key}">${t.label} ✕</span>`).join('');

  elements.activeFilters.querySelectorAll('.filter-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const key = tag.dataset.key;
      if (key === 'college') currentFilters.college = 'all';
      if (key === 'category') currentFilters.category = 'all';
      if (key === 'status') currentFilters.status = 'all';
      if (key === 'search') {
        currentFilters.search = '';
        elements.searchInput.value = '';
        elements.heroSearchInput.value = '';
      }
      updateFiltersUI();
      renderAll();
    });
  });
}

function updateFiltersUI() {
  elements.searchInput.value = currentFilters.search;
  elements.heroSearchInput.value = currentFilters.search;
  elements.filterCategory.value = currentFilters.category;
  elements.filterStatus.value = currentFilters.status;
  elements.filterCollege.value = currentFilters.college;
}

function renderAll() {
  renderItems();
  updateStats();
  renderActiveFilters();
  updateCollegeFilter();
  updateMapMarkers();
}

// ==================== DETAIL & CONTACT MODAL ====================
function openDetailModal(itemId) {
  const item = allItems.find(i => i.id === itemId);
  if (!item) return;

  const phoneOnly = (item.contact || '').replace(/[^0-9+]/g, '');
  const isPhone = phoneOnly.length >= 10;
  const isEmail = (item.contact || '').includes('@');

  elements.detailModalBody.innerHTML = `
    <div class="detail-header">
      <div>
        <span class="card-badge badge-${item.status}">${item.status.toUpperCase()}</span>
        <h2 class="detail-title" style="margin-top: 8px;">${escapeHtml(item.name)}</h2>
      </div>
    </div>

    <div class="detail-photo-box">
      ${item.image
        ? `<img src="${item.image}" alt="${escapeHtml(item.name)}">`
        : `<div class="emoji-large">${getCategoryEmoji(item.category)}</div>`}
    </div>

    <div class="detail-info-grid">
      <div class="detail-info-item">
        <div class="detail-info-label">College / Campus</div>
        <div class="detail-info-value">🏛️ ${escapeHtml(item.collegeName || 'Unknown')}</div>
      </div>
      <div class="detail-info-item">
        <div class="detail-info-label">Campus Location</div>
        <div class="detail-info-value">📍 ${escapeHtml(item.location || 'Campus')}</div>
      </div>
      <div class="detail-info-item">
        <div class="detail-info-label">Category</div>
        <div class="detail-info-value">${getCategoryEmoji(item.category)} ${escapeHtml(item.category)}</div>
      </div>
      <div class="detail-info-item">
        <div class="detail-info-label">Date Reported</div>
        <div class="detail-info-value">📅 ${item.date || 'Recent'}</div>
      </div>
    </div>

    <div class="detail-desc-box">
      <div class="detail-info-label">Description & Details</div>
      <p>${escapeHtml(item.description || 'No additional description provided.')}</p>
    </div>

    <div class="detail-desc-box">
      <div class="detail-info-label">Reporter Contact</div>
      <p style="font-weight: 700; color: var(--accent); font-size: 1.1rem; margin-top: 4px;">
        ${escapeHtml(item.contact)}
      </p>
    </div>

    <div class="detail-actions">
      ${isPhone ? `
        <a href="https://wa.me/${phoneOnly.replace('+', '')}?text=Hi,%20I%20saw%20your%20CampusFind%20report%20about%20${encodeURIComponent(item.name)}" target="_blank" class="btn btn-whatsapp btn-sm">
          💬 WhatsApp
        </a>
        <a href="tel:${phoneOnly}" class="btn btn-primary btn-sm">
          📞 Call Now
        </a>
      ` : ''}

      ${isEmail ? `
        <a href="mailto:${item.contact}?subject=CampusFind:%20Regarding%20${encodeURIComponent(item.name)}" class="btn btn-primary btn-sm">
          ✉️ Send Email
        </a>
      ` : ''}

      <button class="btn btn-outline btn-sm" id="modalCopyBtn" data-contact="${escapeHtml(item.contact)}">
        📋 Copy Contact
      </button>

      ${item.status !== 'returned' ? `
        <button class="btn btn-outline btn-sm" id="modalMarkBtn" data-id="${item.id}">
          ✅ Mark Reunited
        </button>
      ` : ''}

      <button class="btn btn-danger btn-sm" id="modalDeleteBtn" data-id="${item.id}">
        🗑️ Delete
      </button>
    </div>
  `;

  // Attach button events
  document.getElementById('modalCopyBtn').addEventListener('click', (e) => {
    navigator.clipboard?.writeText(e.target.dataset.contact);
    showToast(`📋 Copied: ${e.target.dataset.contact}`);
  });

  const markBtn = document.getElementById('modalMarkBtn');
  if (markBtn) {
    markBtn.addEventListener('click', () => {
      markReturned(item.id);
      openDetailModal(item.id);
    });
  }

  document.getElementById('modalDeleteBtn').addEventListener('click', () => {
    deleteReport(item.id);
  });

  elements.detailModalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  elements.detailModalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ==================== MODALS ====================
function openReportModal(status = 'lost') {
  document.getElementById('reportStatus').value = status;
  document.getElementById('reportModalTitle').textContent = status === 'lost' ? '🔴 Report Lost Item' : '🟢 Report Found Item';
  document.getElementById('reportDate').value = new Date().toISOString().split('T')[0];

  // Autofill college if filtered or active
  if (currentFilters.college !== 'all') {
    document.getElementById('reportCollegeName').value = currentFilters.college;
  }

  elements.reportModalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeReportModal() {
  elements.reportModalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ==================== LEAFLET MAP ====================
function initLeafletMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Default center: SVGPTC Tirupati / South India
  const defaultCenter = [13.6288, 79.4192];
  map = L.map('map', {
    center: defaultCenter,
    zoom: 6,
    scrollWheelZoom: false
  });

  // Free OpenStreetMap CartoDB Voyager tiles (works in dark and light mode)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  updateMapMarkers();
}

function updateMapMarkers() {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();

  // Aggregate items by college
  const collegeMap = {};
  allItems.forEach(item => {
    const cName = item.collegeName || 'Unknown College';
    if (!collegeMap[cName]) {
      const coords = item.coords || COLLEGE_COORDS[cName] || { lat: 13.6288, lng: 79.4192 };
      collegeMap[cName] = {
        name: cName,
        lat: coords.lat,
        lng: coords.lng,
        lost: 0,
        found: 0,
        returned: 0,
        items: []
      };
    }
    if (item.status === 'lost') collegeMap[cName].lost++;
    else if (item.status === 'found') collegeMap[cName].found++;
    else if (item.status === 'returned') collegeMap[cName].returned++;
    collegeMap[cName].items.push(item);
  });

  // Drop markers
  Object.values(collegeMap).forEach(col => {
    const marker = L.circleMarker([col.lat, col.lng], {
      radius: 9,
      fillColor: col.lost > col.found ? '#f43f5e' : '#10b981',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85
    });

    const popupHtml = `
      <div class="map-popup-card">
        <h4>🏛️ ${escapeHtml(col.name)}</h4>
        <p>🔴 <strong>${col.lost}</strong> Lost &nbsp;•&nbsp; 🟢 <strong>${col.found}</strong> Found &nbsp;•&nbsp; 🟣 <strong>${col.returned}</strong> Reunited</p>
        <button class="btn btn-primary btn-sm filter-map-college-btn" data-college="${escapeHtml(col.name)}">
          View College Reports
        </button>
      </div>`;

    marker.bindPopup(popupHtml);
    markersLayer.addLayer(marker);
  });

  // Attach popup click listener
  map.on('popupopen', () => {
    document.querySelectorAll('.filter-map-college-btn').forEach(btn => {
      btn.onclick = () => {
        const cName = btn.dataset.college;
        currentFilters.college = cName;
        updateFiltersUI();
        renderAll();
        document.getElementById('items-section').scrollIntoView({ behavior: 'smooth' });
      };
    });
  });
}

function detectUserLocation() {
  if (!navigator.geolocation) {
    elements.locationStatus.textContent = '📍 Geolocation is not supported by your browser.';
    return;
  }

  elements.locationStatus.textContent = '📍 Locating your position...';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (userLocationMarker) map.removeLayer(userLocationMarker);

      userLocationMarker = L.marker([latitude, longitude], {
        title: 'Your Location'
      }).addTo(map);
      userLocationMarker.bindPopup('<b>📍 You are here</b>').openPopup();

      map.setView([latitude, longitude], 13);
      elements.locationStatus.textContent = `📍 Located at [${latitude.toFixed(3)}, ${longitude.toFixed(3)}]. Zoomed to your area.`;

      // Find nearest known college
      let nearest = null;
      let minDis = Infinity;
      Object.entries(COLLEGE_COORDS).forEach(([name, c]) => {
        const d = Math.hypot(c.lat - latitude, c.lng - longitude);
        if (d < minDis) {
          minDis = d;
          nearest = name;
        }
      });
      if (nearest && minDis < 0.5) {
        showToast(`🏛️ Nearest campus detected: ${nearest}`);
        elements.heroCollegeSearch.value = nearest;
      }
    },
    (err) => {
      elements.locationStatus.textContent = '📍 Location access was denied or unavailable.';
      showToast('⚠️ Could not access location.');
    }
  );
}

// ==================== EVENT LISTENERS ====================
function setupListeners() {
  // Theme toggle
  elements.themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('campusfind_theme', next);
  });

  // Mobile menu
  elements.mobileMenuBtn.addEventListener('click', () => {
    elements.navLinks.classList.toggle('mobile-open');
  });

  // Modal open buttons
  document.getElementById('heroReportBtn').addEventListener('click', () => openReportModal('lost'));
  document.getElementById('reportLostHero').addEventListener('click', () => openReportModal('lost'));
  document.getElementById('reportFoundHero').addEventListener('click', () => openReportModal('found'));
  document.getElementById('navReportBtn').addEventListener('click', (e) => {
    e.preventDefault();
    openReportModal('lost');
  });

  // Close modals
  document.getElementById('closeReportModal').addEventListener('click', closeReportModal);
  elements.reportModalOverlay.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeReportModal();
  });
  elements.closeDetailModal.addEventListener('click', closeDetailModal);
  elements.detailModalOverlay.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDetailModal();
  });

  // Form submit
  elements.reportForm.addEventListener('submit', submitReport);

  // Search input listeners
  elements.heroSearchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value;
    elements.searchInput.value = e.target.value;
    renderAll();
  });
  elements.searchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value;
    elements.heroSearchInput.value = e.target.value;
    renderAll();
  });

  // College hero input
  elements.heroCollegeSearch.addEventListener('change', (e) => {
    currentFilters.college = e.target.value.trim() || 'all';
    elements.filterCollege.value = currentFilters.college;
    renderAll();
  });

  // Filter selects
  elements.filterCategory.addEventListener('change', (e) => {
    currentFilters.category = e.target.value;
    renderAll();
  });
  elements.filterStatus.addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    renderAll();
  });
  elements.filterCollege.addEventListener('change', (e) => {
    currentFilters.college = e.target.value;
    elements.heroCollegeSearch.value = e.target.value === 'all' ? '' : e.target.value;
    renderAll();
  });

  // Clear filters
  elements.clearFilters.addEventListener('click', () => {
    currentFilters = { search: '', category: 'all', status: 'all', college: 'all' };
    updateFiltersUI();
    elements.heroCollegeSearch.value = '';
    renderAll();
    showToast('🔄 Filters reset');
  });

  // Refresh items
  if (elements.refreshItemsBtn) {
    elements.refreshItemsBtn.addEventListener('click', () => {
      loadItems();
      showToast('🔄 Reports refreshed');
    });
  }

  // Map College Search
  elements.mapCollegeSearch.addEventListener('change', (e) => {
    const val = e.target.value.trim();
    if (COLLEGE_COORDS[val]) {
      const c = COLLEGE_COORDS[val];
      map.setView([c.lat, c.lng], 14);
      currentFilters.college = val;
      updateFiltersUI();
      renderAll();
    }
  });

  // Detect location
  elements.detectLocationBtn.addEventListener('click', detectUserLocation);

  // Image Upload Handling
  elements.itemImage.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      handleImageSelect(this.files[0]);
    }
  });
  elements.removeImgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetImageUpload();
  });

  // Drag and drop image
  const dropZone = document.getElementById('imageUploadZone');
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent)';
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border)';
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  });

  // Close mobile nav on outside click
  document.addEventListener('click', (e) => {
    if (!elements.navLinks.contains(e.target) && e.target !== elements.mobileMenuBtn) {
      elements.navLinks.classList.remove('mobile-open');
    }
  });
}

// ==================== APP INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('campusfind_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  setupListeners();
  initLeafletMap();
  loadItems();
});