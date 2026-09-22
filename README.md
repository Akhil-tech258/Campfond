# 🎓 CampusFind — College Lost & Found Platform

> An intuitive, student-centric Lost & Found web platform for college campuses with dedicated College Campus Hubs (e.g. **SVGPTC Tirupati**), campus building/zone filters, instant WhatsApp/Call contact, and resilient dual storage (Firebase Firestore + LocalStorage fallback).

[![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-blue)](#)
[![Campus Hubs](https://img.shields.io/badge/Hubs-SVGPTC%20%7C%20SVU%20%7C%20IIT%20%7C%20NIT-brightgreen)](#)
[![Database](https://img.shields.io/badge/Database-Firebase%20Firestore%20%2B%20Offline%20Cache-orange)](#)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](#)

---

## ✨ Features

- 🏛️ **College-First Campus Hubs:**
  - Select your college (e.g. **SVGPTC Tirupati**) to enter a dedicated campus dashboard showing only your college's lost & found reports.
  - Quick-switch or search any college anytime.
- 🔗 **Shareable WhatsApp Campus Links:**
  - Direct URL routing (e.g. `#college=SVGPTC%20Tirupati`) allows students to share their college hub directly in college WhatsApp and Telegram groups.
- 🏢 **Campus Zone & Department Filters:**
  - Filter items inside your college by: **Library**, **Computer Labs**, **Canteen**, **Workshops**, **Main Gate / Security**, **Seminar Halls**.
- ⚡ **Resilient Dual Storage Engine:**
  - Connects to **Firebase Firestore** for cloud sync across devices.
  - Automatically falls back to **LocalStorage** with pre-seeded college items if offline or if cloud permissions are restricted, ensuring the app **never shows a blank screen**.
- 📸 **Item Photo Uploads:** Client-side image compression to base64 so photos are stored and previewed cleanly.
- 🔍 **Live Search & Multi-Filters:** Instant search across item names, campus locations, categories (ID Cards, Electronics, Bags, Books, etc.), and status (Lost, Found, Reunited).
- 💬 **One-Click Contact:** Direct WhatsApp chat (`wa.me`), phone call, and email links to contact the person who reported or found the item.
- 🌓 **Dark / Light Mode:** Modern glassmorphism design system with responsive theme switching.

---

## 🚀 Quick Start

### Run Locally
Simply open `index.html` in any modern web browser, or serve it using any local static server:

```bash
# Using Node / npx serve
npx serve .

# Or using Python 3
python -m http.server 3000
```
Visit `http://localhost:3000` in your browser.

---

## 🔒 Firebase Configuration & Security Rules

To enable cloud sync across all students and devices:

1. Open [Firebase Console](https://console.firebase.google.com/) and navigate to your project (`campusfind-b0ff2`).
2. Go to **Build** → **Firestore Database** → **Rules**.
3. Paste the following rules to allow read & write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
4. Click **Publish**. The status pill in the app navbar will automatically update to:  
   `🟢 Cloud Sync Active`

---

## 🛠️ Tech Stack

- **Frontend:** Semantic HTML5, Glassmorphism CSS3, Vanilla ES6+ JavaScript (Mobile-first)
- **Architecture:** College-First Campus Hub routing via URL hash
- **Cloud Database:** Firebase Firestore 12.x
- **Icons & Visuals:** Modern system emojis & SVG icons
- **Storage:** Dual-engine Firestore + LocalStorage fallback
