// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Replace with your own Google Maps API key
const GOOGLE_MAPS_API_KEY = '';

// Global state
let map, placesService, autocompleteHero, autocompleteMap;
let selectedCollege = { name: '', placeId: '', lat: null, lng: null };
let allItems = [];
let currentFilters = { search: '', category: 'all', status: 'all', college: 'all' };

// DOM Elements
const elements = {
  themeToggle: document.getElementById('themeToggle'),
  mobileMenuBtn: document.getElementById('mobileMenuBtn'),
  navLinks: document.getElementById('navLinks'),
  heroSearchInput: document.getElementById('heroSearchInput'),
  heroCollegeSearch: document.getElementById('heroCollegeSearch'),
  heroCollegeSuggestions: document.getElementById('heroCollegeSuggestions'),
  mapCollegeSearch: document.getElementById('mapCollegeSearch'),
  mapCollegeSuggestions: document.getElementById('mapCollegeSuggestions'),
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
  stats: {
    lost: document.getElementById('statLost'),
    found: document.getElementById('statFound'),
    returned: document.getElementById('statReturned'),
    colleges: document.getElementById('statColleges')
  }
};

// ==================== UTILS ====================
function escapeHtml(str) {
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
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function getRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
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

// ==================== MAP INIT ====================
function initMap() {
  const mapDiv = document.getElementById('map');
  map = new google.maps.Map(mapDiv, {
    center: { lat: 20.5937, lng: 78.9629 },
    zoom: 5,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }]
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }]
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }]
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }]
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }]
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }]
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }]
      },
      {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }]
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }]
      },
      {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }]
      }
    ]
  });
  placesService = new google.maps.places.PlacesService(map);
  setupAutocomplete();
}

function setupAutocomplete() {
  autocompleteHero = new google.maps.places.Autocomplete(
    elements.heroCollegeSearch,
    { types: ['university'] }
  );
  autocompleteHero.addListener('place_changed', () => {
    const place = autocompleteHero.getPlace();
    if (place.geometry) {
      selectCollege({
        name: place.name,
        placeId: place.place_id,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      });
      elements.heroCollegeSearch.value = place.name;
    }
  });

  autocompleteMap = new google.maps.places.Autocomplete(
    elements.mapCollegeSearch,
    { types: ['university'] }
  );
  autocompleteMap.addListener('place_changed', () => {
    const place = autocompleteMap.getPlace();
    if (place.geometry) {
      selectCollege({
        name: place.name,
        placeId: place.place_id,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      });
      elements.mapCollegeSearch.value = place.name;
      map.setCenter(place.geometry.location);
      map.setZoom(16);
    }
  });
}

function selectCollege({ name, placeId, lat, lng }) {
  selectedCollege = { name, placeId, lat, lng };
  document.getElementById('reportCollegeName').value = name;
  document.getElementById('reportCollegePlaceId').value = placeId;
  document.getElementById('reportCollegeLat').value = lat;
  document.getElementById('reportCollegeLng').value = lng;
  new google.maps.Marker({
    position: { lat, lng },
    map,
    title: name,
    animation: google.maps.Animation.DROP
  });
  showToast(`🏛️ College selected: ${name}`);
  updateCollegeFilter();
  elements.filterCollege.value = placeId;
  currentFilters.college = placeId;
  renderActiveFilters();
  loadItems();
}

function detectNearbyColleges() {
  if (!navigator.geolocation) {
    elements.locationStatus.textContent = '📍 Geolocation not supported.';
    return;
  }
  elements.locationStatus.textContent = '📍 Detecting...';
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    map.setCenter({ lat: latitude, lng: longitude });
    map.setZoom(14);
    new google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map,
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      title: 'You are here'
    });
    const request = {
      location: { lat: latitude, lng: longitude },
      radius: 10000,
      type: ['university']
    };
    placesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results.length) {
        elements.locationStatus.textContent = `📍 Found ${results.length} colleges nearby. Click on map markers.`;
        results.forEach(place => {
          new google.maps.Marker({
            position: place.geometry.location,
            map,
            title: place.name,
            animation: google.maps.Animation.DROP
          }).addListener('click', () => {
            selectCollege({
              name: place.name,
              placeId: place.place_id,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
          });
        });
      } else {
        elements.locationStatus.textContent = '📍 No colleges found nearby.';
      }
    });
  }, () => {
    elements.locationStatus.textContent = '📍 Location access denied.';
  });
}

// ==================== FIREBASE CRUD ====================
async function loadItems() {
  try {
    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderAll();
    updateStats();
  } catch (error) {
    console.error('Error loading items:', error);
    showToast('⚠️ Failed to load reports.');
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

  const item = {
    name: document.getElementById('itemName').value.trim(),
    category: document.getElementById('reportCategory').value,
    status: document.getElementById('reportStatus').value,
    collegeName: document.getElementById('reportCollegeName').value,
    collegePlaceId: document.getElementById('reportCollegePlaceId').value,
    latitude: document.getElementById('reportCollegeLat').value,
    longitude: document.getElementById('reportCollegeLng').value,
    location: document.getElementById('reportLocation').value.trim(),
    description: document.getElementById('reportDescription').value.trim(),
    contact: document.getElementById('reportContact').value.trim(),
    date: document.getElementById('reportDate').value,
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "items"), item);
    closeReportModal();
    loadItems();
    showToast('✅ Report submitted successfully!');
  } catch (error) {
    console.error('Error submitting report:', error);
    showToast('⚠️ Submission failed.');
  } finally {
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
    btn.disabled = false;
  }
}

async function markReturned(itemId) {
  try {
    await updateDoc(doc(db, "items", itemId), { status: 'returned' });
    loadItems();
    showToast('✅ Item marked as returned!');
  } catch (error) {
    console.error('Error updating item:', error);
    showToast('⚠️ Could not update status.');
  }
}

// ==================== RENDER FUNCTIONS ====================
function getFilteredItems() {
  return allItems.filter(item => {
    const matchSearch = !currentFilters.search ||
      item.name.toLowerCase().includes(currentFilters.search) ||
      item.description?.toLowerCase().includes(currentFilters.search) ||
      item.location?.toLowerCase().includes(currentFilters.search);
    const matchCategory = currentFilters.category === 'all' || item.category === currentFilters.category;
    const matchStatus = currentFilters.status === 'all' || item.status === currentFilters.status;
    const matchCollege = currentFilters.college === 'all' || item.collegePlaceId === currentFilters.college;
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
      card.innerHTML = `
        <div class="card-img">
          <span class="placeholder-emoji">${getCategoryEmoji(item.category)}</span>
          <span class="card-badge badge-${item.status}">${item.status}</span>
        </div>
        <div class="card-body">
          <div class="card-college">🏛️ ${escapeHtml(item.collegeName || 'Unknown College')}</div>
          <div class="card-title">${escapeHtml(item.name)}</div>
          <div class="card-location">📍 ${escapeHtml(item.location)}</div>
          <div class="card-date">📅 ${item.date ? new Date(item.date).toLocaleDateString() : ''} • ${item.createdAt ? getRelativeTime(item.createdAt.toDate()) : ''}</div>
          <div class="card-desc">${escapeHtml(item.description || '')}</div>
          <div class="card-footer">
            <button class="btn btn-outline btn-sm contact-btn" data-contact="${escapeHtml(item.contact)}">📞 Contact</button>
            ${item.status !== 'returned' ? `<button class="btn btn-primary btn-sm mark-returned-btn" data-id="${item.id}">✅ Mark Returned</button>` : ''}
          </div>
        </div>`;
      elements.itemsGrid.appendChild(card);
    });
    // Attach events
    document.querySelectorAll('.contact-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showToast(`📞 Contact: ${btn.dataset.contact}`);
        navigator.clipboard?.writeText(btn.dataset.contact);
      });
    });
    document.querySelectorAll('.mark-returned-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        markReturned(btn.dataset.id);
      });
    });
  }
  // Returned scroll
  const returnedItems = allItems.filter(i => i.status === 'returned').slice(0, 5);
  elements.recoveredScroll.innerHTML = returnedItems.length ? returnedItems.map(i => `
    <div class="recovered-card">
      <div class="rec-emoji">${getCategoryEmoji(i.category)}</div>
      <div class="rec-title">${escapeHtml(i.name)}</div>
      <div class="rec-college">${escapeHtml(i.collegeName)}</div>
    </div>`).join('') : '<div class="recovered-card"><p>No returned items yet.</p></div>';
}

function getCategoryEmoji(cat) {
  const emojis = { Mobiles: '📱', 'ID Cards': '🪪', Books: '📚', Bags: '🎒', Electronics: '💻', Accessories: '⌚', Others: '📦' };
  return emojis[cat] || '📦';
}

function updateStats() {
  elements.stats.lost.textContent = allItems.filter(i => i.status === 'lost').length;
  elements.stats.found.textContent = allItems.filter(i => i.status === 'found').length;
  elements.stats.returned.textContent = allItems.filter(i => i.status === 'returned').length;
  const uniqueColleges = new Set(allItems.map(i => i.collegePlaceId).filter(Boolean));
  elements.stats.colleges.textContent = uniqueColleges.size;
}

function updateCollegeFilter() {
  const select = elements.filterCollege;
  const unique = [...new Set(allItems.map(i => i.collegePlaceId).filter(Boolean))];
  select.innerHTML = '<option value="all">🏛️ All Colleges</option>';
  unique.forEach(placeId => {
    const item = allItems.find(i => i.collegePlaceId === placeId);
    if (item) {
      const opt = document.createElement('option');
      opt.value = placeId;
      opt.textContent = item.collegeName || placeId;
      select.appendChild(opt);
    }
  });
}

function renderActiveFilters() {
  const tags = [];
  if (currentFilters.college !== 'all') {
    const item = allItems.find(i => i.collegePlaceId === currentFilters.college);
    tags.push({ label: `🏛️ ${item?.collegeName || currentFilters.college}`, key: 'college' });
  }
  if (currentFilters.category !== 'all') tags.push({ label: `📂 ${currentFilters.category}`, key: 'category' });
  if (currentFilters.status !== 'all') tags.push({ label: currentFilters.status === 'lost' ? '🔴 Lost' : currentFilters.status === 'found' ? '🟢 Found' : '🟣 Returned', key: 'status' });
  if (currentFilters.search) tags.push({ label: `🔍 "${currentFilters.search}"`, key: 'search' });
  elements.activeFilters.innerHTML = tags.map(t => `<span class="filter-tag" data-key="${t.key}">${t.label} ✕</span>`).join('');
  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const key = tag.dataset.key;
      if (key === 'college') currentFilters.college = 'all';
      if (key === 'category') currentFilters.category = 'all';
      if (key === 'status') currentFilters.status = 'all';
      if (key === 'search') { currentFilters.search = ''; elements.searchInput.value = ''; elements.heroSearchInput.value = ''; }
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
}

// ==================== MODALS ====================
function openReportModal(status = 'lost') {
  document.getElementById('reportStatus').value = status;
  document.getElementById('reportModalTitle').textContent = status === 'lost' ? '📝 Report Lost Item' : '✅ Report Found Item';
  document.getElementById('reportDate').value = new Date().toISOString().split('T')[0];
  if (selectedCollege.name) {
    document.getElementById('reportCollegeName').value = selectedCollege.name;
    document.getElementById('reportCollegePlaceId').value = selectedCollege.placeId;
    document.getElementById('reportCollegeLat').value = selectedCollege.lat;
    document.getElementById('reportCollegeLng').value = selectedCollege.lng;
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
  // Theme
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

  // Report buttons
  document.getElementById('heroReportBtn').addEventListener('click', () => openReportModal('lost'));
  document.getElementById('reportLostHero').addEventListener('click', () => openReportModal('lost'));
  document.getElementById('reportFoundHero').addEventListener('click', () => openReportModal('found'));
  document.getElementById('navReportBtn').addEventListener('click', (e) => { e.preventDefault(); openReportModal('lost'); });
  document.getElementById('closeReportModal').addEventListener('click', closeReportModal);
  elements.reportModalOverlay.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeReportModal(); });

  // Form submit
  elements.reportForm.addEventListener('submit', submitReport);

  // Search & filters
  elements.heroSearchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    elements.searchInput.value = e.target.value;
    renderAll();
  });
  elements.searchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    elements.heroSearchInput.value = e.target.value;
    renderAll();
  });
  elements.filterCategory.addEventListener('change', (e) => { currentFilters.category = e.target.value; renderAll(); });
  elements.filterStatus.addEventListener('change', (e) => { currentFilters.status = e.target.value; renderAll(); });
  elements.filterCollege.addEventListener('change', (e) => { currentFilters.college = e.target.value; renderAll(); });
  elements.clearFilters.addEventListener('click', () => {
    currentFilters = { search: '', category: 'all', status: 'all', college: 'all' };
    updateFiltersUI();
    elements.heroSearchInput.value = '';
    renderAll();
  });

  // Map detection
  elements.detectLocationBtn.addEventListener('click', detectNearbyColleges);

  // Close mobile menu on outside click
  document.addEventListener('click', (e) => {
    if (!elements.navLinks.contains(e.target) && e.target !== elements.mobileMenuBtn) {
      elements.navLinks.classList.remove('mobile-open');
    }
  });

  // Image preview
  document.getElementById('itemImage').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('uploadPreview').src = e.target.result;
        document.getElementById('uploadPreview').style.display = 'block';
        document.getElementById('uploadPlaceholder').style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });
}

// ==================== INIT ====================
window.initMap = initMap;

function loadGoogleMaps() {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
  script.async = true;
  document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('campusfind_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  setupListeners();
  loadItems();
  loadGoogleMaps();
});