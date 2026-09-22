# 🎓 CampusFind — College Lost & Found Platform

CampusFind is a student-centric Lost & Found web platform designed specifically for college campuses. It allows students to find, report, and recover lost belongings through dedicated College Campus Hubs with zero friction.

---

## ✨ Features

- 🏛️ **College-First Architecture & Custom Campus Hubs**
  - **Dynamic College Creation:** Start with a clean slate. Students can search for their institution or add any college, polytechnic, or university name on the fly to instantly create a dedicated campus hub.
  - **Isolated Campus Feed:** Selecting a college filters all lost and found reports exclusively to that campus.
  - **Shareable WhatsApp Deep Links:** Direct hash-based URL routing (e.g., `#college=SVGPTC%20Tirupati`) enables students to share their campus hub directly in college WhatsApp and Telegram batches.

- 🏢 **Campus Zone & Department Filters**
  - Narrow down search queries by specific campus zones and hotspots: **Library**, **Computer Labs**, **Canteen**, **Workshops**, **Main Gate / Security**, and **Seminar Halls**.

- ⚡ **Dual-Engine Cloud & Offline Storage**
  - **Cloud Synchronization:** Backed by Firebase Firestore for real-time updates across all student devices.
  - **Offline Fallback:** Automatically caches data in browser LocalStorage if the device is offline or network connection is interrupted, ensuring the application never displays a blank page.

- 💬 **Instant One-Tap Reconnection**
  - **Direct WhatsApp Chat:** Opens WhatsApp (`wa.me`) with a pre-filled message referencing the specific item.
  - **Direct Phone Dialer & Email:** Immediate `tel:` and `mailto:` contact buttons so finders and owners can connect without intermediaries.
  - **Quick Contact Copy:** One-click clipboard copy for phone numbers and email addresses.

- 🔍 **Live Search & Multi-Attribute Filtering**
  - Instant live search by item name, description, and specific campus location.
  - Category filters: ID Cards, Electronics, Wallets & Bags, Documents & Books, Keys, Clothing, and Others.
  - Status filters: Lost (🔴), Found (🟢), and Reunited (🟣).

- 🎨 **Modern Responsive UI**
  - Mobile-first glassmorphic interface with full Dark Mode and Light Mode support.
  - Live campus recovery metrics displaying counts of lost items, found items, and successfully reunited belongings.

---

## 🛠️ Tech Stack

- **Frontend:** Semantic HTML5, Glassmorphism CSS3 (CSS Custom Properties, Grid, Flexbox), Vanilla JavaScript (ES6+ Modules, async/await)
- **Database & Cloud:** Google Firebase Firestore (NoSQL real-time document store) with browser LocalStorage fallback
- **Integrations:** WhatsApp Click-to-Chat API, Native Telephony (`tel:`) & Email (`mailto:`) URI schemes
- **Hosting & Deployment:** GitHub Pages (Automated Continuous Deployment via GitHub Actions)

---

## 🏫 Real-Life Scenario

### *Lost Calculator & Student ID Card at SVGPTC Tirupati*

#### 1. The Incident
During the chaotic lunch break at Sri Venkateswara Govt Polytechnic (SVGPTC), Rahul rushes from the Computer Lab to the Workshop block. In the rush, his scientific calculator (`Casio fx-991EX`) and laminated Student ID card slip out of the side pocket of his backpack in the Canteen corridor.

#### 2. Reporting the Loss
Thirty minutes later, upon entering the workshop, Rahul realizes his ID card and calculator are missing. He opens **CampusFind** on his smartphone:
1. In the search box, he selects **SVGPTC Tirupati** to enter his college's dedicated hub.
2. He taps **"Report Item"** and fills in:
   - **Status:** *Lost*
   - **Item Name:** *Casio fx-991EX Scientific Calculator & ID Card*
   - **Category:** *Electronics / ID Cards*
   - **Zone:** *Canteen*
   - **Specific Location:** *Corridor bench between Canteen and Workshop*
   - **Contact:** His WhatsApp mobile number
3. He submits the report. It immediately appears on the SVGPTC campus feed.

#### 3. Discovery by a Peer
Sneha, a final-year student heading towards the library, notices the calculator and ID card left unattended on the canteen bench. She picks them up and opens the SVGPTC WhatsApp group, where a batchmate had pinned the CampusFind link (`.../#college=SVGPTC%20Tirupati`).

#### 4. Instant Connection via WhatsApp
Opening the link takes Sneha directly to the SVGPTC campus feed. Right at the top under "Recent Campus Reports", she spots Rahul's listing: *"Casio fx-991EX Scientific Calculator & ID Card"*.
- Sneha clicks **"🔍 View & Contact"**.
- She taps the green **"💬 WhatsApp"** button.
- WhatsApp opens automatically with the pre-filled message:  
  `"Hi, I saw your CampusFind report about Casio fx-991EX Scientific Calculator & ID Card."`
- Sneha replies: *"Hey Rahul, I found your calculator and ID card at the canteen bench. I'm near the Central Library entrance."*

#### 5. Safe Return & Community Showcase
Rahul walks over to the Central Library and collects his belongings within 15 minutes of losing them. He taps **"✅ Mark Reunited"** on the report card. The status updates to *Reunited*, and the item moves to the SVGPTC **"Recently Reunited on Campus"** showcase, closing the loop without needing posters, lost-and-found boxes, or administrative intervention.
