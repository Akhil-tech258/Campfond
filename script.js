/* ============================================================
   CAMPUSFIND — script.js
   College Lost & Found Platform
   Dedicated College Hub & Campus-First Architecture
   User-Driven College Creation & Live Search
   Resilient Dual Engine: Firebase Firestore + LocalStorage
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

// Clean slate: No hardcoded colleges or sample items
const POPULAR_COLLEGES = [];
const SEED_ITEMS = [];

// Clean up any old seed data stored from previous sessions
(function clearOldSeedData() {
  try {
    const rawItems = localStorage.getItem('campusfind_items');
    if (rawItems && rawItems.includes('seed_')) {
      const items = JSON.parse(rawItems).filter(i => !String(i.id).startsWith('seed_'));
      localStorage.setItem('campusfind_items', JSON.stringify(items));
    }
  } catch (e) {}
})();

// ==================== STATE ====================
let allItems = [];
let selectedCollege = null; // null = discovery / all campuses view
let selectedZone = 'all';    // 'all' or building/zone filter
let activeCollegeFilterType = 'all'; // 'all', 'polytechnic', 'university', 'active'
let currentFilters = { search: '', category: 'all', status: 'all' };

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
  popularCollegesDatalist: document.getElementById('popularCollegesList'),

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
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading localStorage:", e);
  }
  return [];
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
  allItems = getLocalItems();
  renderAll();

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

  // If college is not in custom list, save it automatically
  const customList = getCustomColleges();
  if (college && !customList.some(c => c.name.toLowerCase() === college.toLowerCase())) {
    const isPoly = college.toLowerCase().includes('polytechnic') || college.toLowerCase().includes('gptc');
    customList.unshift({
      name: college,
      subtitle: "Campus Hub",
      city: "College Campus",
      icon: isPoly ? "🏛️" : "🎓",
      type: isPoly ? "polytechnic" : "university"
    });
    saveCustomColleges(customList);
  }

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
    createdAt: new Date().toISOString()
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
  const list = [...custom];

  // Also include any colleges appearing in reported items
  const itemColleges = [...new Set(allItems.map(i => i.collegeName).filter(Boolean))];
  itemColleges.forEach(cName => {
    if (!list.some(p => p.name.toLowerCase() === cName.toLowerCase())) {
      const isPoly = cName.toLowerCase().includes('polytechnic') || cName.toLowerCase().includes('gptc');
      list.push({
        name: cName,
        subtitle: "Campus Hub",
        icon: isPoly ? "🏛️" : "🎓",
        city: "College Campus",
        type: isPoly ? 'polytechnic' : 'university'
      });
    }
  });

  return list;
}

function updateCollegesDatalist(colleges) {
  if (!elements.popularCollegesDatalist) return;
  elements.popularCollegesDatalist.innerHTML = colleges
    .map(c => `<option value="${escapeHtml(c.name)}">`)
    .join('');
}

function renderCampusCards(searchTerm = '', filterType = activeCollegeFilterType) {
  const grid = elements.collegeCardsGrid;
  const colleges = getAllColleges();
  updateCollegesDatalist(colleges);

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

  if (filtered.length === 0) {
    if (colleges.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; background: var(--surface); border-radius: var(--radius); border: 1px dashed var(--border);">
          <div style="font-size: 2.8rem; margin-bottom: 8px;">🏛️</div>
          <h3 style="margin-bottom: 6px;">No Colleges Added Yet</h3>
          <p style="color: var(--text-muted); margin-bottom: 16px;">Be the first student to add your college campus and start reporting lost or found items!</p>
          <button class="btn btn-primary" id="emptyStateAddCollegeBtn">+ Add Your College</button>
        </div>`;
      document.getElementById('emptyStateAddCollegeBtn')?.addEventListener('click', () => {
        openAddCollegeModal('');
      });
      return;
    } else {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 30px; background: var(--surface); border-radius: var(--radius);">
          <p style="margin-bottom: 12px; color: var(--text-secondary);">College "${escapeHtml(searchTerm)}" not found.</p>
          <button class="btn btn-primary btn-sm" id="createCollegeHubBtn">
            🏛️ Create "${escapeHtml(searchTerm)}" Hub Now
          </button>
        </div>`;
      document.getElementById('createCollegeHubBtn')?.addEventListener('click', () => {
        openAddCollegeModal(searchTerm);
      });
      return;
    }
  }

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

  elements.collegeSuggestionsDropdown.style.display = 'none';

  elements.campusSelectorSection.style.display = 'none';
  elements.campusHubSection.style.display = 'block';
  elements.navCollegeIndicator.style.display = 'flex';
  elements.navCollegeName.textContent = selectedCollege;
  elements.hubCollegeTitle.textContent = selectedCollege;

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

// ==================== RENDERING ====================
function getFilteredItems() {
  return allItems.filter(item => {
    if (selectedCollege) {
      const matchCol = item.collegeName && item.collegeName.toLowerCase() === selectedCollege.toLowerCase();
      if (!matchCol) return false;
    }

    if (selectedZone !== 'all') {
      const zoneKey = selectedZone.toLowerCase();
      const locText = (item.location || '').toLowerCase();
      const descText = (item.description || '').toLowerCase();
      if (!locText.includes(zoneKey) && !descText.includes(zoneKey)) {
        return false;
      }
    }

    const term = currentFilters.search.toLowerCase();
    const matchSearch = !term ||
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.location && item.location.toLowerCase().includes(term)) ||
      (item.collegeName && item.collegeName.toLowerCase().includes(term));

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
      elements.emptyStateText.textContent = `Try picking a college above or submitting the first report.`;
    }
  } else {
    elements.emptyState.style.display = 'none';
    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card';

      card.innerHTML = `
        <div class="card-img">
          <span class="placeholder-emoji">${getCategoryEmoji(item.category)}</span>
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
  const dateInput = document.getElementById('reportDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

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
  elements.themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('campusfind_theme', next);
  });

  elements.mobileMenuBtn.addEventListener('click', () => {
    elements.navLinks.classList.toggle('mobile-open');
  });

  elements.navBrandLogo.addEventListener('click', () => exitCollegeHub(true));
  elements.navHomeLink.addEventListener('click', (e) => {
    e.preventDefault();
    exitCollegeHub(true);
  });
  elements.navSwitchCollegeBtn.addEventListener('click', () => exitCollegeHub(true));
  elements.backToCampusesBtn.addEventListener('click', () => exitCollegeHub(true));

  elements.shareHubBtn.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    showToast(`🔗 Copied share link for ${selectedCollege}!`);
  });

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

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.college-search-box-container')) {
      elements.collegeSuggestionsDropdown.style.display = 'none';
    }
  });

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

  elements.iconButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.iconButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      elements.newCollegeIcon.value = btn.dataset.icon;
    });
  });

  elements.zonePills.forEach(pill => {
    pill.addEventListener('click', () => {
      elements.zonePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedZone = pill.dataset.zone;
      renderAll();
    });
  });

  elements.heroReportBtn.addEventListener('click', () => openReportModal('lost'));
  elements.navReportBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openReportModal('lost');
  });
  elements.hubReportLostBtn.addEventListener('click', () => openReportModal('lost'));
  elements.hubReportFoundBtn.addEventListener('click', () => openReportModal('found'));
  elements.emptyReportBtn.addEventListener('click', () => openReportModal('lost'));

  elements.closeReportModal.addEventListener('click', closeReportModal);
  elements.reportModalOverlay.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeReportModal();
  });
  elements.closeDetailModal.addEventListener('click', closeDetailModal);
  elements.detailModalOverlay.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDetailModal();
  });

  elements.reportForm.addEventListener('submit', submitReport);

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