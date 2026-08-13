# Trái Tim Việt — Charity Map

A pure frontend SPA that connects donors with locations across Vietnam that need support. No server required — deployed on GitHub Pages with Firebase as the backend.

**Live site:** https://traitimviet.online

---

## Features

- Interactive map showing locations in need, color-coded by urgency
- Members can suggest new locations; admins review before publishing
- Realtime notifications for suggestion status and admin warnings
- Points and rank system for members who participate in charity
- Dark / Light mode
- Fully responsive

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Firebase Auth | Login, password reset |
| Firebase Firestore | Realtime database |
| Firebase Storage | Location image storage |
| Firebase Functions | Server-side admin operations |
| Leaflet.js | Map rendering |
| Google Maps Tiles | Map tiles |
| Nominatim | Reverse geocoding |
| GitHub Pages | Hosting |

All services used are on free tiers.

---

## Project Structure

```
trai-tim-viet/
├── index.html
├── app.js                      # Entry point, route registration
├── models/
│   ├── firebase.js             # Firebase init & config
│   ├── UserModel.js            # User CRUD + rank logic
│   ├── LocationModel.js        # Location CRUD + image upload
│   ├── SuggestionModel.js      # Location suggestions
│   └── NotificationModel.js    # Notification system
├── controllers/
│   ├── Router.js               # Hash-based front controller
│   ├── AuthController.js       # Login / Register / Forgot password
│   ├── HomeController.js       # Main map + markers
│   ├── ProfileController.js    # User profile + points history
│   ├── AdminController.js      # Location & user management
│   ├── SuggestionController.js # Submit & review suggestions
│   └── NotificationController.js
├── views/
│   ├── ViewEngine.js           # Renders HTML strings into #app
│   └── components/Toast.js
├── functions/
│   ├── index.js                # Cloud Function: deleteUser
│   └── package.json
└── public/css/main.css         # Design system, CSS variables
```

---

## Setup

### 1. Enable GitHub Pages

1. Go to repo Settings → Pages
2. Source: Deploy from a branch → `main` / `(root)` → Save

### 2. Configure Firebase

- Firebase Console → Authentication → Sign-in method → enable Email/Password
- Firestore → Indexes → Composite → Add index:
  - Collection: `notifications`, fields: `toUid` (Asc) + `createdAt` (Desc)

### 3. Deploy Cloud Functions

Required for permanently deleting user accounts from the admin panel.

```bash
npm install -g firebase-tools
firebase login

cd functions
npm install
cd ..

firebase deploy --only functions
```

### 4. Create a Founder account

1. Register a normal account through the UI
2. Firestore Console → `users` collection → find your document
3. Change the `role` field from `"member"` to `"founder"`

---

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| `member` | View map, submit location suggestions |
| `admin` | Add/edit/delete locations, review suggestions, warn members |
| `founder` | Full access + manage users |

## Member Ranks

| Rank | Points required |
|------|----------------|
| Dong Long | 0 |
| Tam Long Bac | 5 |
| Vang Tam | 15 |
| Trai Tim Vang | 30 |

---

## Routes

| URL | Page | Access |
|-----|------|--------|
| `/home` | Main map | Everyone |
| `/login` | Login | Guest |
| `/register` | Register | Guest |
| `/forgot-password` | Forgot password | Guest |
| `/profile` | User profile | Member+ |
| `/suggest` | Suggest a location | Member |
| `/admin/dashboard` | Manage locations | Admin / Founder |
| `/admin/locations/new` | Add location | Admin / Founder |
| `/admin/locations/:id/edit` | Edit location | Admin / Founder |
| `/admin/suggestions` | Review suggestions | Admin / Founder |
| `/admin/users` | Manage users | Founder |

---

## Config

Firebase config is in `models/firebase.js`. To use your own Firebase project:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};
```

---

Made with love for Vietnam.
