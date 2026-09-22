/* ============================================================
   CAMPUSFIND — script.js
   College Lost & Found Platform
   Dedicated College Hub & Campus-First Architecture
   Interactive Live Autocomplete & Add-College System
   Resilient Dual Engine: Firebase Firestore + LocalStorage Fallback
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

// ==================== DEFAULT POPULAR COLLEGES ====================
const POPULAR_COLLEGES = [
  { name: "SVGPTC Tirupati", subtitle: "Sri Venkateswara Govt Polytechnic", icon: "🏛️", city: "Tirupati, AP", type: "polytechnic" },
  { name: "Sri Venkateswara University (SVU), Tirupati", subtitle: "SVU Campus", icon: "🎓", city: "Tirupati, AP", type: "university" },
  { name: "IIT Madras", subtitle: "Indian Institute of Technology", icon: "🔬", city: "Chennai, TN", type: "university" },
  { name: "IIT Bombay", subtitle: "Indian Institute of Technology", icon: "🚀", city: "Mumbai, MH", type: "university" },
  { name: "IIT Delhi", subtitle: "Indian Institute of Technology", icon: "💻", city: "New Delhi", type: "university" },
  { name: "NIT Trichy", subtitle: "National Institute of Technology", icon: "⚙️", city: "Tiruchirappalli, TN", type: "university" },
  { name: "NIT Warangal", subtitle: "National Institute of Technology", icon: "⚡", city: "Warangal, TS", type: "university" },
  { name: "Anna University, Chennai", subtitle: "CEG Campus", icon: "📚", city: "Chennai, TN", type: "university" },
  { name: "JNTU Anantapur", subtitle: "College of Engineering", icon: "🏗️", city: "Anantapur, AP", type: "university" },
  { name: "VIT Vellore", subtitle: "Vellore Institute of Technology", icon: "🌐", city: "Vellore, TN", type: "university" }
];

// ==================== REALISTIC SAMPLE DATA ====================
const SEED_ITEMS = [
  {
    id: "seed_1",
    name: "Student ID Card (CSE Dept)",
    category: "ID Cards",
    status: "lost",
    collegeName: "SVGPTC Tirupati",
    location: "Computer Lab 2, 1st Floor",
    description: "Diploma in CSE 2nd Year ID Card with blue college lanyard. Roll number ending with 042.",
    contact: "9876543210",
    date: new Date(Date.now() - 3600000 * 5).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    image: null
  },
  {
    id: "seed_2",
    name: "Casio fx-991CW Calculator",
    category: "Electronics",
    status: "found",
    collegeName: "SVGPTC Tirupati",
    location: "Central Library Reading Hall (Desk #14)",
    description: "Scientific calculator with white sliding cover. Left on table during evening study hours. Safe with librarian.",
    contact: "library@svgptc.edu",
    date: new Date(Date.now() - 3600000 * 20).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    image: null
  },
  {
    id: "seed_3",
    name: "boAt Airdopes 141 (Black Case)",
    category: "Accessories",
    status: "lost",
    collegeName: "SVGPTC Tirupati",
    location: "Campus Canteen counter table",
    description: "Black charging case with a red silicone sleeve and small carabiner clip attached.",
    contact: "9123456789",
    date: new Date(Date.now() - 3600000 * 30).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    image: null
  },
  {
    id: "seed_4",
    name: "Fastrack Navy Blue Backpack",
    category: "Bags",
    status: "found",
    collegeName: "SVGPTC Tirupati",
    location: "Main Gate / Security Cabin",
    description: "Contains 3 engineering drawing notebooks and a steel water bottle. Left near entrance bench.",
    contact: "security@svgptc.edu",
    date: new Date(Date.now() - 3600000 * 48).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    image: null
  },
  {
    id: "seed_5",
    name: "Higher Engineering Mathematics (B.S. Grewal)",
    category: "Books",
    status: "returned",
    collegeName: "SVGPTC Tirupati",
    location: "Mechanical Workshop Block",
    description: "Standard textbook with notes inside. Reunited with 2nd year student through CampusFind!",
    contact: "akhil@gmail.com",
    date: new Date(Date.now() - 3600000 * 72).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    image: null
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
    image: null
  }
];

// ==================== STATE ====================
let allItems = [];
let selectedCollege = null; // null = discovery / all campuses view
let selectedZone = 'all';    // 'all' or building/zone filter
let activeCollegeFilterType = 'all'; // 'all', 'polytechnic', 'university', 'active'
let currentFilters = { search: '', category: 'all', status: 'all' };
let currentUploadedImageData = null;

// ==================== DOM ELEMENTS ====================
const elements = {
  themeToggle: document.getElementById('themeToggle'),
  mobileMenuBtn: document.getElementById('mobileMenuBtn'),
  navLinks: document.getElementById('navLinks'),
  navBrandLogo: document.getElementById('navBrandLogo'),
  navHomeLink: document.getElementById('navHomeLink'),
  navItemsLink: document.getElementById('navItemsLink'),
  navCollegeIndicator: document.getElementById('navCollegeIndicator'),
  navCollegeName: document.getElementById('navCollegeName'),
  navSwitchCollegeBtn: document.getElementById('navSwitchCollegeBtn'),
  storageStatusPill: document.getElementById('storageStatusPill'),
  storageStatusText: document.getElementById('storageStatusText'),
  heroReportBtn: document.getElementById('heroReportBtn'),
  navReportBtn: document.getElementById('navReportBtn'),

  // Campus Selector (View 1)
  campusSelectorSection: document.getElementById('campusSelectorSection'),
  collegeSearchInput: document.getElementById('collegeSearchInput'),
  clearCollegeSearchBtn: document.getElementById('clearCollegeSearchBtn'),
  collegeSuggestionsDropdown: document.getElementById('collegeSuggestionsDropdown'),
  openAddCollegeBtn: document.getElementById('openAddCollegeBtn'),
  headerAddCollegeBtn: document.getElementById('headerAddCollegeBtn'),
  campusCategoryChips: document.getElementById('campusCategoryChips'),
  collegeCardsGrid: document.getElementById('collegeCardsGrid'),
  collegesCountBadge: document.getElementById('collegesCountBadge'),

  // Campus Hub (View 2)
  campusHubSection: document.getElementById('campusHubSection'),
  backToCampusesBtn: document.getElementById('backToCampusesBtn'),
  shareHubBtn: document.getElementById('shareHubBtn'),
  hubCollegeTitle: document.getElementById('hubCollegeTitle'),
  hubLostCount: document.getElementById('hubLostCount'),
  hubFoundCount: document.getElementById('hubFoundCount'),
  hubReturnedCount: document.getElementById('hubReturnedCount'),
  hubReportLostBtn: document.getElementById('hubReportLostBtn'),
  hubReportFoundBtn: document.getElementById('hubReportFoundBtn'),
  zonePills: document.querySelectorAll('.zone-pill'),

  // Filters & Items
  searchInput: document.getElementById('searchInput'),
  filterCategory: document.getElementById('filterCategory'),
  filterStatus: document.getElementById('filterStatus'),
  clearFilters: document.getElementById('clearFilters'),
  activeFilters: document.getElementById('activeFilters'),
  itemsSectionTitle: document.getElementById('itemsSectionTitle'),
  refreshItemsBtn: document.getElementById('refreshItemsBtn'),
  itemsGrid: document.getElementById('itemsGrid'),
  emptyState: document.getElementById('emptyState'),
  emptyStateHeading: document.getElementById('emptyStateHeading'),
  emptyStateText: document.getElementById('emptyStateText'),
  emptyReportBtn: document.getElementById('emptyReportBtn'),
  recoveredScroll: document.getElementById('recoveredScroll'),

  // Modals & Forms
  reportModalOverlay: document.getElementById('reportModalOverlay'),
  reportModalTitle: document.getElementById('reportModalTitle'),
  reportForm: document.getElementById('reportForm'),
  reportCollegeName: document.getElementById('reportCollegeName'),
  submitReportBtn: document.getElementById('submitReportBtn'),
  closeReportModal: document.getElementById('closeReportModal'),
  detailModalOverlay: document.getElementById('detailModalOverlay'),
  detailModalBody: document.getElementById('detailModalBody'),
  closeDetailModal: document.getElementById('closeDetailModal'),
  toastContainer: document.getElementById('toastContainer'),

  // Add College Modal
  addCollegeModalOverlay: document.getElementById('addCollegeModalOverlay'),
  closeAddCollegeModal: document.getElementById('closeAddCollegeModal'),
  addCollegeForm: document.getElementById('addCollegeForm'),
  newCollegeName: document.getElementById('newCollegeName'),
  newCollegeSubtitle: document.getElementById('newCollegeSubtitle'),
  newCollegeCity: document.getElementById('newCollegeCity'),
  newCollegeIcon: document.getElementById('newCollegeIcon'),
  iconButtons: document.querySelectorAll('.icon-btn'),

  // Image Upload
  itemImage: document.getElementById('itemImage'),
  uploadPlaceholder: document.getElementById('uploadPlaceholder'),
  previewContainer: document.getElementById('previewContainer'),
  uploadPreview: document.getElementById('uploadPreview'),
  removeImgBtn: document.getElementById('removeImgBtn'),

  // Stats
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

function getCustomColleges() {
  try {
    const raw = localStorage.getItem('campusfind_custom_colleges');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveCustomColleges(list) {
  try {
    localStorage.setItem('campusfind_custom_colleges', JSON.stringify(list));
  } catch (e) {}
}

async function loadItems() {
  // Step 1: Render local items immediately
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
      console.warn("Firestore access offline/restricted:", error.message);
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

  const college = elements.reportCollegeName.value.trim();

  const newItem = {
    id: 'cf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    name: document.getElementById('itemName').value.trim(),
    category: document.getElementById('reportCategory').value,
    status: document.getElementById('reportStatus').value,
    collegeName: college,
    location: document.getElementById('reportLocation').value.trim(),
    description: document.getElementById('reportDescription').value.trim(),
    contact: document.getElementById('reportContact').value.trim(),
    date: document.getElementById('reportDate').value,
    createdAt: new Date().toISOString(),
    image: currentUploadedImageData
  };

  allItems.unshift(newItem);
  saveLocalItems(allItems);

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

  elements.reportForm.reset();
  resetImageUpload();
  closeReportModal();

  if (!selectedCollege) {
    selectCollege(college, true);
  } else {
    renderAll();
  }

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
  showToast('🎉 Item marked as reunited!');

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

// ==================== CAMPUS DIRECTORY & ADD COLLEGE ====================
function getAllColleges() {
  const custom = getCustomColleges();
  const list = [...POPULAR_COLLEGES];

  // Add custom colleges
  custom.forEach(c => {
    if (!list.some(p => p.name.toLowerCase() === c.name.toLowerCase())) {
      list.push(c);
    }
  });

  // Also include any colleges appearing in reported items
  const itemColleges = [...new Set(allItems.map(i => i.collegeName).filter(Boolean))];
  itemColleges.forEach(cName => {
    if (!list.some(p => p.name.toLowerCase() === cName.toLowerCase())) {
      list.push({
        name: cName,
        subtitle: "Campus Hub",
        icon: "🏛️",
        city: "College Campus",
        type: cName.toLowerCase().includes('polytechnic') ? 'polytechnic' : 'university'
      });
    }
  });

  return list;
}

function renderCampusCards(searchTerm = '', filterType = activeCollegeFilterType) {
  const grid = elements.collegeCardsGrid;
  const colleges = getAllColleges();
  const term = searchTerm.toLowerCase();

  let filtered = colleges.filter(c =>
    c.name.toLowerCase().includes(term) ||
    (c.subtitle && c.subtitle.toLowerCase().includes(term)) ||
    (c.city && c.city.toLowerCase().includes(term))
  );

  // Apply chip category filter
  if (filterType === 'polytechnic') {
    filtered = filtered.filter(c =>
      c.type === 'polytechnic' ||
      c.name.toLowerCase().includes('polytechnic') ||
      c.name.toLowerCase().includes('gptc')
    );
  } else if (filterType === 'university') {
    filtered = filtered.filter(c =>
      c.type === 'university' ||
      c.name.toLowerCase().includes('university') ||
      c.name.toLowerCase().includes('iit') ||
      c.name.toLowerCase().includes('nit') ||
      c.name.toLowerCase().includes('institute')
    );
  } else if (filterType === 'active') {
    filtered = filtered.filter(c =>
      allItems.some(i => i.collegeName && i.collegeName.toLowerCase() === c.name.toLowerCase())
    );
  }

  elements.collegesCountBadge.textContent = `${filtered.length} Campuses`;
  grid.innerHTML = '';

  // Render cards
  filtered.forEach(col => {
    const colItems = allItems.filter(i => i.collegeName && i.collegeName.toLowerCase() === col.name.toLowerCase());
    const count = colItems.length;

    const card = document.createElement('div');
    card.className = 'college-card';
    card.innerHTML = `
      <div class="college-card-header">
        <div class="college-card-icon">${col.icon || '🏛️'}</div>
        <div>
          <div class="college-card-name">${escapeHtml(col.name)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(col.subtitle || 'Campus')}</div>
        </div>
      </div>
      <div class="college-card-meta">
        <span>📍 ${escapeHtml(col.city || 'Campus')}</span>
        <span class="college-card-badge ${count > 0 ? 'has-items' : ''}">
          ${count} ${count === 1 ? 'Report' : 'Reports'}
        </span>
      </div>
    `;

    card.addEventListener('click', () => {
      selectCollege(col.name, true);
    });

    grid.appendChild(card);
  });

  // Always append the persistent "+ Add Your College" card
  const addCard = document.createElement('div');
  addCard.className = 'college-card add-college-card';
  addCard.innerHTML = `
    <div class="add-card-icon">+</div>
    <div class="add-card-title">+ Add Your College</div>
    <div class="add-card-desc">Don't see your college listed? Click here to create its dedicated hub in 5 seconds.</div>
  `;
  addCard.addEventListener('click', () => {
    openAddCollegeModal(searchTerm);
  });
  grid.appendChild(addCard);
}

// ==================== LIVE AUTOCOMPLETE SUGGESTIONS ====================
function updateLiveSuggestions(query) {
  const box = elements.collegeSuggestionsDropdown;
  const term = (query || '').trim().toLowerCase();

  if (!term) {
    box.style.display = 'none';
    elements.clearCollegeSearchBtn.style.display = 'none';
    return;
  }

  elements.clearCollegeSearchBtn.style.display = 'block';

  const colleges = getAllColleges();
  const matches = colleges.filter(c =>
    c.name.toLowerCase().includes(term) ||
    (c.subtitle && c.subtitle.toLowerCase().includes(term)) ||
    (c.city && c.city.toLowerCase().includes(term))
  ).slice(0, 6);

  let html = '';

  if (matches.length > 0) {
    matches.forEach(c => {
      const colItems = allItems.filter(i => i.collegeName && i.collegeName.toLowerCase() === c.name.toLowerCase());
      html += `
        <div class="suggestion-item-col" data-name="${escapeHtml(c.name)}">
          <div class="suggestion-col-left">
            <span class="suggestion-col-icon">${c.icon || '🏛️'}</span>
            <div>
              <div class="suggestion-col-name">${escapeHtml(c.name)}</div>
              <div class="suggestion-col-city">📍 ${escapeHtml(c.city || c.subtitle || '')}</div>
            </div>
          </div>
          <span class="college-card-badge ${colItems.length > 0 ? 'has-items' : ''}">
            ${colItems.length} Reports
          </span>
        </div>
      `;
    });
  }

  // Always append the "Add New College" prompt row
  html += `
    <div class="suggestion-item-col suggestion-add-row" id="suggestionAddRow" data-name="${escapeHtml(query)}">
      <div class="suggestion-col-left">
        <span class="suggestion-col-icon">✨</span>
        <div>
          <div class="suggestion-col-name">+ Add "${escapeHtml(query)}" as a new college</div>
          <div class="suggestion-col-city">Click to create this college's campus hub</div>
        </div>
      </div>
      <span style="font-size: 1.2rem;">➔</span>
    </div>
  `;

  box.innerHTML = html;
  box.style.display = 'block';

  // Attach event listeners to suggestion items
  box.querySelectorAll('.suggestion-item-col').forEach(row => {
    row.addEventListener('click', (e) => {
      if (row.id === 'suggestionAddRow') {
        openAddCollegeModal(query);
      } else {
        selectCollege(row.dataset.name, true);
      }
      box.style.display = 'none';
    });
  });
}

function openAddCollegeModal(presetName = '') {
  if (presetName && typeof presetName === 'string') {
    elements.newCollegeName.value = presetName.trim();
  }
  elements.addCollegeModalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => elements.newCollegeName.focus(), 150);
}

function closeAddCollegeModal() {
  elements.addCollegeModalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

function handleAddCollegeSubmit(e) {
  e.preventDefault();
  const name = elements.newCollegeName.value.trim();
  const subtitle = elements.newCollegeSubtitle.value.trim() || 'Campus Hub';
  const city = elements.newCollegeCity.value.trim();
  const icon = elements.newCollegeIcon.value || '🏛️';

  if (!name) return;

  const isPoly = name.toLowerCase().includes('polytechnic') || name.toLowerCase().includes('gptc');
  const newCol = {
    name,
    subtitle,
    city,
    icon,
    type: isPoly ? 'polytechnic' : 'university'
  };

  const list = getCustomColleges();
  const existingIdx = list.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
  if (existingIdx >= 0) {
    list[existingIdx] = newCol;
  } else {
    list.unshift(newCol);
  }
  saveCustomColleges(list);

  // Sync to Firestore if cloud is active
  if (isCloudActive && db) {
    try {
      addDoc(collection(db, "customColleges"), { ...newCol, createdAt: serverTimestamp() });
    } catch(err) {
      console.warn("Could not sync college to cloud:", err.message);
    }
  }

  elements.addCollegeForm.reset();
  closeAddCollegeModal();
  selectCollege(name, true);
  showToast(`🎉 Campus Hub created for ${name}!`);
}

// ==================== HUB NAVIGATION & URL HASH ROUTING ====================
function selectCollege(collegeName, updateHash = true) {
  if (!collegeName) return;
  selectedCollege = collegeName;
  selectedZone = 'all';

  if (updateHash) {
    window.location.hash = '#college=' + encodeURIComponent(collegeName);
  }

  // Hide suggestions and reset input
  elements.collegeSuggestionsDropdown.style.display = 'none';

  // Switch to Hub View
  elements.campusSelectorSection.style.display = 'none';
  elements.campusHubSection.style.display = 'block';
  elements.navCollegeIndicator.style.display = 'flex';
  elements.navCollegeName.textContent = selectedCollege;
  elements.hubCollegeTitle.textContent = selectedCollege;

  // Reset zone pills
  elements.zonePills.forEach(pill => {
    pill.classList.toggle('active', pill.dataset.zone === 'all');
  });

  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast(`🏛️ Welcome to ${selectedCollege} Campus Hub`);
}

function exitCollegeHub(updateHash = true) {
  selectedCollege = null;
  selectedZone = 'all';

  if (updateHash) {
    window.location.hash = '';
  }

  elements.campusSelectorSection.style.display = 'block';
  elements.campusHubSection.style.display = 'none';
  elements.navCollegeIndicator.style.display = 'none';

  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function checkUrlHash() {
  const hash = window.location.hash;
  if (hash.startsWith('#college=')) {
    const cName = decodeURIComponent(hash.replace('#college=', ''));
    if (cName) {
      selectCollege(cName, false);
      return;
    }
  }
  exitCollegeHub(false);
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
    // 1. College restriction
    if (selectedCollege) {
      const matchCol = item.collegeName && item.collegeName.toLowerCase() === selectedCollege.toLowerCase();
      if (!matchCol) return false;
    }

    // 2. Campus Zone filter
    if (selectedZone !== 'all') {
      const zoneKey = selectedZone.toLowerCase();
      const locText = (item.location || '').toLowerCase();
      const descText = (item.description || '').toLowerCase();
      if (!locText.includes(zoneKey) && !descText.includes(zoneKey)) {
        return false;
      }
    }

    // 3. Search text
    const term = currentFilters.search.toLowerCase();
    const matchSearch = !term ||
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.location && item.location.toLowerCase().includes(term)) ||
      (item.collegeName && item.collegeName.toLowerCase().includes(term));

    // 4. Category & Status
    const matchCategory = currentFilters.category === 'all' || item.category === currentFilters.category;
    const matchStatus = currentFilters.status === 'all' || item.status === currentFilters.status;

    return matchSearch && matchCategory && matchStatus;
  });
}

function renderItems() {
  const filtered = getFilteredItems();
  elements.itemsGrid.innerHTML = '';

  if (selectedCollege) {
    elements.itemsSectionTitle.innerHTML = `<span class="section-icon">📋</span> ${escapeHtml(selectedCollege)} Reports <small style="font-size:0.9rem; color:var(--text-muted); font-weight:400;">(${filtered.length} found)</small>`;
  } else {
    elements.itemsSectionTitle.innerHTML = `<span class="section-icon">📋</span> Recent Campus Reports <small style="font-size:0.9rem; color:var(--text-muted); font-weight:400;">(${filtered.length} found)</small>`;
  }

  if (filtered.length === 0) {
    elements.emptyState.style.display = 'block';
    if (selectedCollege) {
      elements.emptyStateHeading.textContent = `No reports for ${selectedCollege} matching these filters`;
      elements.emptyStateText.textContent = `Have you lost or found something here? Be the first to report it!`;
    } else {
      elements.emptyStateHeading.textContent = `No reports match your filters`;
      elements.emptyStateText.textContent = `Try clearing your search or picking a college above.`;
    }
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

      card.addEventListener('click', (e) => {
        if (e.target.closest('.mark-card-btn')) return;
        openDetailModal(item.id);
      });

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
  const pool = selectedCollege ? allItems.filter(i => i.collegeName && i.collegeName.toLowerCase() === selectedCollege.toLowerCase()) : allItems;
  const returnedItems = pool.filter(i => i.status === 'returned').slice(0, 8);
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
  if (selectedCollege) {
    const colItems = allItems.filter(i => i.collegeName && i.collegeName.toLowerCase() === selectedCollege.toLowerCase());
    elements.hubLostCount.textContent = colItems.filter(i => i.status === 'lost').length;
    elements.hubFoundCount.textContent = colItems.filter(i => i.status === 'found').length;
    elements.hubReturnedCount.textContent = colItems.filter(i => i.status === 'returned').length;
  }

  // Global stats in discovery screen
  elements.stats.lost.textContent = allItems.filter(i => i.status === 'lost').length;
  elements.stats.found.textContent = allItems.filter(i => i.status === 'found').length;
  elements.stats.returned.textContent = allItems.filter(i => i.status === 'returned').length;
  const uniqueColleges = new Set(allItems.map(i => i.collegeName).filter(Boolean));
  elements.stats.colleges.textContent = uniqueColleges.size;
}

function renderActiveFilters() {
  const tags = [];
  if (selectedZone !== 'all') tags.push({ label: `📍 Zone: ${selectedZone}`, key: 'zone' });
  if (currentFilters.category !== 'all') tags.push({ label: `📂 ${currentFilters.category}`, key: 'category' });
  if (currentFilters.status !== 'all') tags.push({ label: currentFilters.status === 'lost' ? '🔴 Lost' : currentFilters.status === 'found' ? '🟢 Found' : '🟣 Reunited', key: 'status' });
  if (currentFilters.search) tags.push({ label: `🔍 "${currentFilters.search}"`, key: 'search' });

  elements.activeFilters.innerHTML = tags.map(t => `<span class="filter-tag" data-key="${t.key}">${t.label} ✕</span>`).join('');

  elements.activeFilters.querySelectorAll('.filter-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const key = tag.dataset.key;
      if (key === 'zone') {
        selectedZone = 'all';
        elements.zonePills.forEach(p => p.classList.toggle('active', p.dataset.zone === 'all'));
      }
      if (key === 'category') {
        currentFilters.category = 'all';
        elements.filterCategory.value = 'all';
      }
      if (key === 'status') {
        currentFilters.status = 'all';
        elements.filterStatus.value = 'all';
      }
      if (key === 'search') {
        currentFilters.search = '';
        elements.searchInput.value = '';
      }
      renderAll();
    });
  });
}

function renderAll() {
  renderCampusCards(elements.collegeSearchInput.value, activeCollegeFilterType);
  renderItems();
  updateStats();
  renderActiveFilters();
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

// ==================== REPORT MODAL ====================
function openReportModal(status = 'lost') {
  document.getElementById('reportStatus').value = status;
  elements.reportDate = document.getElementById('reportDate');
  elements.reportDate.value = new Date().toISOString().split('T')[0];

  if (selectedCollege) {
    elements.reportCollegeName.value = selectedCollege;
    elements.reportModalTitle.textContent = status === 'lost'
      ? `🔴 Report Lost in ${selectedCollege}`
      : `🟢 Report Found in ${selectedCollege}`;
  } else {
    elements.reportModalTitle.textContent = status === 'lost'
      ? '🔴 Report Lost Item'
      : '🟢 Report Found Item';
  }

  elements.reportModalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeReportModal() {
  elements.reportModalOverlay.classList.remove('active');
  document.body.style.overflow = '';
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

  // Nav Links
  elements.navBrandLogo.addEventListener('click', () => exitCollegeHub(true));
  elements.navHomeLink.addEventListener('click', (e) => {
    e.preventDefault();
    exitCollegeHub(true);
  });
  elements.navSwitchCollegeBtn.addEventListener('click', () => exitCollegeHub(true));
  elements.backToCampusesBtn.addEventListener('click', () => exitCollegeHub(true));

  // Share Hub link
  elements.shareHubBtn.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    showToast(`🔗 Copied share link for ${selectedCollege}!`);
  });

  // College Search Input & Live Suggestions
  elements.collegeSearchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    updateLiveSuggestions(val);
    renderCampusCards(val, activeCollegeFilterType);
  });

  elements.collegeSearchInput.addEventListener('focus', (e) => {
    if (e.target.value.trim()) {
      updateLiveSuggestions(e.target.value);
    }
  });

  elements.clearCollegeSearchBtn.addEventListener('click', () => {
    elements.collegeSearchInput.value = '';
    elements.collegeSuggestionsDropdown.style.display = 'none';
    elements.clearCollegeSearchBtn.style.display = 'none';
    renderCampusCards('', activeCollegeFilterType);
  });

  // Close live suggestions on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.college-search-box-container')) {
      elements.collegeSuggestionsDropdown.style.display = 'none';
    }
  });

  // Category Filter Chips
  if (elements.campusCategoryChips) {
    elements.campusCategoryChips.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        elements.campusCategoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeCollegeFilterType = chip.dataset.type;
        renderCampusCards(elements.collegeSearchInput.value, activeCollegeFilterType);
      });
    });
  }

  // Add College Buttons
  elements.openAddCollegeBtn.addEventListener('click', () => {
    openAddCollegeModal(elements.collegeSearchInput.value);
  });
  elements.headerAddCollegeBtn.addEventListener('click', () => {
    openAddCollegeModal(elements.collegeSearchInput.value);
  });
  elements.closeAddCollegeModal.addEventListener('click', closeAddCollegeModal);
  elements.addCollegeModalOverlay.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAddCollegeModal();
  });
  elements.addCollegeForm.addEventListener('submit', handleAddCollegeSubmit);

  // Emoji Icon Buttons in Add College Modal
  elements.iconButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.iconButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      elements.newCollegeIcon.value = btn.dataset.icon;
    });
  });

  // Zone Pills
  elements.zonePills.forEach(pill => {
    pill.addEventListener('click', () => {
      elements.zonePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedZone = pill.dataset.zone;
      renderAll();
    });
  });

  // Report buttons
  elements.heroReportBtn.addEventListener('click', () => openReportModal('lost'));
  elements.navReportBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openReportModal('lost');
  });
  elements.hubReportLostBtn.addEventListener('click', () => openReportModal('lost'));
  elements.hubReportFoundBtn.addEventListener('click', () => openReportModal('found'));
  elements.emptyReportBtn.addEventListener('click', () => openReportModal('lost'));

  // Close modals
  elements.closeReportModal.addEventListener('click', closeReportModal);
  elements.reportModalOverlay.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeReportModal();
  });
  elements.closeDetailModal.addEventListener('click', closeDetailModal);
  elements.detailModalOverlay.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDetailModal();
  });

  // Form submit
  elements.reportForm.addEventListener('submit', submitReport);

  // Search & Filters
  elements.searchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value;
    renderAll();
  });
  elements.filterCategory.addEventListener('change', (e) => {
    currentFilters.category = e.target.value;
    renderAll();
  });
  elements.filterStatus.addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    renderAll();
  });
  elements.clearFilters.addEventListener('click', () => {
    currentFilters = { search: '', category: 'all', status: 'all' };
    selectedZone = 'all';
    elements.searchInput.value = '';
    elements.filterCategory.value = 'all';
    elements.filterStatus.value = 'all';
    elements.zonePills.forEach(p => p.classList.toggle('active', p.dataset.zone === 'all'));
    renderAll();
    showToast('🔄 Filters reset');
  });

  elements.refreshItemsBtn.addEventListener('click', () => {
    loadItems();
    showToast('🔄 Reports refreshed');
  });

  // Image Upload
  elements.itemImage.addEventListener('change', function() {
    if (this.files && this.files[0]) {
      handleImageSelect(this.files[0]);
    }
  });
  elements.removeImgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetImageUpload();
  });

  // Hash route changes
  window.addEventListener('hashchange', checkUrlHash);
}

// ==================== APP INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('campusfind_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  setupListeners();
  loadItems();
  checkUrlHash();
});