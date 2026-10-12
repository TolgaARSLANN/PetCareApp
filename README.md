<div align="center">

# 🐾 Pawfect Care

### Smart Pet Care Assistant for Devoted Pet Owners

[![CI](https://github.com/TolgaARSLANN/PetCareApp/actions/workflows/ci.yml/badge.svg)](https://github.com/TolgaARSLANN/PetCareApp/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## 📌 About

**Pawfect Care** is a full-stack web application that helps pet owners keep their animals' health and care records in one place. Each user manages their own pets: health notes, weight history, medications, vet appointments and emergency contacts. The app also suggests care products based on the pet's species and weight, and includes a community blog.

The UI is in Turkish. It has light and dark themes (follows the system setting until you pick one with the sun/moon button), is responsive (mobile to desktop) and is built with accessibility in mind: visible labels, keyboard focus styles, an accessible confirm dialog, skip link and reduced-motion support.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Accounts** | Register and log in with email and password (bcrypt-hashed, JWT sessions); an account page to change the password (which signs out other devices), sign out of all devices, download all of your data as a JSON file, or permanently delete the account with all its pets and posts |
| 🐶 **Pet Profiles** | Add, edit and delete pets; every pet is visible only to its owner |
| 🏥 **Health Records** | Log dated health notes for each pet; every record (health, vaccine, weight, medication, appointment, contact) can be edited or deleted |
| 💉 **Vaccines** | Record vaccines with the date given and the booster due date; overdue and upcoming (30 days) boosters are flagged |
| ⚖️ **Weight Tracking** | Record weight measurements over time; a line chart shows the trend (hover or arrow keys for each value) |
| 💊 **Medications** | Track medication name, dosage, frequency and dates |
| 📅 **Appointments** | Keep a list of vet appointments with date, time, reason and location; an "Upcoming" panel on the pets page lists every pet's upcoming appointments and due vaccine boosters, overdue first |
| 🚑 **Emergency Contacts** | Store a vet or trusted person to call in an emergency |
| 🎯 **Recommendations** | Care suggestions based on species, weight trend (kg), vaccine boosters and existing records |
| 📖 **Blog** | Anyone can read posts, 9 per page with shareable page links (`/blogs?page=2`); logged-in users can write posts with a cover photo from their device and edit or delete their own |

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, React Router, Axios, Phosphor Icons, hand-written CSS design system (no UI framework)
- **Backend:** Node.js, Express 4, Mongoose, JSON Web Tokens, bcrypt, dotenv
- **Testing:** Jest + Supertest (backend), Vitest + Testing Library (frontend), ESLint, GitHub Actions CI
- **Database:** MongoDB

---

## 📁 Project Structure

```
PetCareApp/
├── .github/workflows/ci.yml      # Lint, tests and build on every PR (Node 22 and 24)
├── backend/
│   └── server/
│       ├── index.js              # Connects to MongoDB and starts the server
│       ├── app.js                # Express app (security headers, rate limits, routes, JSON 404 / errors)
│       ├── config.js             # Reads settings from environment variables
│       ├── eslint.config.js      # ESLint (Node + Jest)
│       ├── .env.example          # Template for your local .env
│       ├── middleware/
│       │   ├── authCookie.js     # Session cookie settings and token issuing
│       │   ├── authMiddleware.js # Checks the session (token + session version), sliding renewal
│       │   └── rateLimits.js     # Brute-force and general request limits
│       ├── models/               # Mongoose schemas with validation: User, Pet, Blog, Image
│       ├── routes/               # auth.js, pets.js, blogs.js, images.js
│       ├── services/             # Recommendation logic
│       └── tests/                # Jest + Supertest API tests (run in America/Los_Angeles, see globalSetup.js)
│
├── frontend/
│   ├── .env.example              # Optional API URL override
│   ├── index.html                # Vite entry page (applies the saved theme before first paint)
│   ├── vite.config.js            # Dev server proxy, build chunks and test settings
│   ├── eslint.config.js          # ESLint (React hooks + Fast Refresh rules)
│   ├── public/                   # Favicon
│   └── src/
│       ├── App.jsx               # Router: layout, lazy-loaded pages, error page
│       ├── components/           # Pages and page-level components (+ their tests)
│       │   └── ui/               # Shared UI: Alert, Field, ConfirmDialog, EmptyState, Pagination, Loading…
│       ├── context/              # AuthProvider and useAuth (session state)
│       ├── hooks/                # useDocumentTitle, useTheme, useUnsavedChanges
│       ├── services/             # Axios API client
│       ├── styles/               # global.css (design tokens + components), layout.css, pages.css
│       ├── test/                 # Test setup and helpers
│       └── utils/                # Dates (calendar days), vaccines, upcoming items, chart, validation, pagination
│
├── package.json                  # Root scripts: setup, dev, start, test, lint, build
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22.12+ (Node 20 is end-of-life)
- [MongoDB](https://www.mongodb.com/) running locally, or a MongoDB Atlas connection string

### 1. Clone the repository

```bash
git clone https://github.com/TolgaARSLANN/PetCareApp.git
cd PetCareApp
```

### Quick start

From the repository root:

```bash
npm run setup                                   # installs root, backend and frontend dependencies
cp backend/server/.env.example backend/server/.env   # then set JWT_SECRET (see below)
npm run dev                                     # starts the API and the frontend together
```

The app opens at `http://localhost:3000` and the API runs at `http://localhost:5000`. Press `Ctrl+C` once to stop both.

| Root script | What it does |
|---|---|
| `npm run setup` | Installs dependencies in the root, `backend/server` and `frontend` |
| `npm run dev` | Backend (restarts on file changes) + frontend dev server |
| `npm start` | Backend without file watching + frontend dev server |
| `npm test` | Backend and frontend tests |
| `npm run lint` | ESLint for backend and frontend (also runs in CI) |
| `npm run build` | Frontend production build |

The sections below describe running each part on its own.

### 2. Backend

```bash
cd backend/server
npm install
cp .env.example .env
```

Open `.env` and set at least `JWT_SECRET`. You can generate a strong value with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the API listens on |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/pet_care_db` | MongoDB connection string |
| `JWT_SECRET` | *(required)* | Secret used to sign login tokens |
| `JWT_EXPIRES_IN` | `1d` | Idle timeout: a session unused this long expires (active sessions renew themselves) |
| `SESSION_MAX_DAYS` | `30` | Maximum session length after login; then the user logs in again |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Frontend origin allowed by CORS |
| `NODE_ENV` | — | Set to `production` when deployed (session cookie becomes HTTPS-only) |
| `AUTH_RATE_LIMIT` | `10` | Failed login / register attempts per IP per 15 minutes |
| `API_RATE_LIMIT` | `1000` | API requests per IP per 15 minutes |
| `TRUST_PROXY` | `0` | Reverse proxies in front of the API (usually `1` when hosted), so rate limits see the real client IP |

Start the server:

```bash
npm run dev     # restarts on file changes
# or
npm start
```

The API runs at `http://localhost:5000`.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev     # npm start also works
```

The app opens at `http://localhost:3000`. The Vite dev server forwards `/api` requests to the backend on port 5000, so the browser sees the app and the API on the same address (required for the session cookie, see [Security](#-security)).

`npm run build` creates a production build in `frontend/build/`, and `npm run preview` serves it locally (also with the `/api` proxy).

### 4. Run the tests

From the repository root, `npm test` runs both suites. To run one of them:

```bash
cd backend/server
npm test        # Jest + Supertest API tests
```

```bash
cd frontend
npm test        # Vitest + Testing Library component tests (npm run test:watch to re-run on save)
```

The backend tests mock the database layer, so they run without MongoDB or a `.env` file. Both suites, plus the frontend build, run on every pull request via GitHub Actions (`.github/workflows/ci.yml`).

---

## 🔒 Security

- **Session cookie:** after login the JWT is stored in an `httpOnly`, `SameSite=Strict` cookie scoped to `/api` (and `Secure` in production). Page scripts cannot read it, so an XSS bug cannot steal the session, and the browser does not send it on cross-site requests (CSRF). The login response only contains the user id.
- **Sliding session:** once half of the token's lifetime has passed, the next request gets a fresh cookie, so an active user is not logged out mid-task. An idle session still expires after `JWT_EXPIRES_IN`, and no session lasts more than `SESSION_MAX_DAYS` after login.
- **Session revocation:** every token carries the account's session version, checked on each request. Changing the password or choosing "sign out of all devices" bumps the version, so stolen or forgotten sessions stop working immediately (tokens of deleted accounts are rejected too).
- **Same-site API:** because of `SameSite=Strict`, the frontend must reach the API on its own address under `/api`. In development the Vite proxy does this; when deploying, add a rewrite on the frontend host (for example a Vercel rewrite of `/api/:path*` to the backend URL) and set `TRUST_PROXY=1` on the backend.
- **Input validation:** the API enforces the same rules as the forms (required fields, trimmed text with length limits, positive weights up to 500 kg, no future birth dates), also when updating. Invalid data gets a `400 { "error": "Invalid record data" }`, never a `500`. Emails are stored in lower case, so `Ali@Mail.com` and `ali@mail.com` are the same account. Blog cover photos are checked by their content (only real JPEG, PNG or WebP, at most 2 MB); older posts may still use an `https://` image URL. Passwords are limited to 72 bytes, the part bcrypt actually uses (Turkish letters such as ğ count as 2).
- **Brute-force protection:** at most 10 failed attempts per IP per 15 minutes across login, register, password change and account deletion (`429` afterwards); successful attempts don't count. A failed login takes the same time whether or not the email is registered.
- **Rate limit:** 1000 API requests per IP per 15 minutes.
- **Security headers** via [helmet](https://helmetjs.github.io/) (no-sniff, frame denial, HSTS, CSP, no `X-Powered-By`).
- **Request size:** JSON bodies are limited to 100 KB; malformed JSON returns `400`.
- **Passwords** are hashed with bcrypt; every pet and record query is scoped to the logged-in owner.

---

## 📡 API Endpoints

🔒 = requires a session: the `token` cookie set by login (browsers), or an `Authorization: Bearer <token>` header (other API clients).

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account (`email`, `password`); logs the new user in (sets the session cookie) and returns `{ userId }` |
| `POST` | `/api/auth/login` | Log in; sets the session cookie and returns `{ userId }` |
| `GET` | `/api/auth/me` | Current user: `{ userId }`, or `{ userId: null }` when logged out |
| `POST` | `/api/auth/logout` | Clear the session cookie |
| `GET` | `/api/auth/account` 🔒 | `{ email, petCount, blogCount }` |
| `GET` | `/api/auth/account/export` 🔒 | Download all account data (email, pets with every record, blog posts) as a JSON file; no password hash or internal fields |
| `POST` | `/api/auth/logout-all` 🔒 | Sign out of every device, including this one |
| `PUT` | `/api/auth/password` 🔒 | Change the password (`currentPassword`, `newPassword`); signs out other devices and renews this session's cookie |
| `DELETE` | `/api/auth/account` 🔒 | Delete the account with all its pets and posts (`password` to confirm); clears the session cookie |

### Pets 🔒

All pet endpoints only return or modify pets owned by the logged-in user.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/pets` | List your pets |
| `POST` | `/api/pets` | Add a pet |
| `GET` | `/api/pets/:id` | Get one pet |
| `PUT` | `/api/pets/:id` | Update a pet |
| `DELETE` | `/api/pets/:id` | Delete a pet |
| `GET` / `POST` | `/api/pets/:id/health-records` | List / add health records (adding returns the updated list, like the other record types) |
| `GET` / `POST` | `/api/pets/:id/vaccines` | List / add vaccines (`vaccineName`, `vaccineDate`, optional `nextDueDate`, `notes`) |
| `GET` / `POST` | `/api/pets/:id/weight` | List / add weight measurements |
| `GET` / `POST` | `/api/pets/:id/medications` | List / add medications |
| `GET` / `POST` | `/api/pets/:id/appointments` | List / add appointments |
| `GET` / `POST` | `/api/pets/:id/emergency-contact` | List / add emergency contacts |
| `PUT` / `DELETE` | `/api/pets/:id/<type>/:recordId` | Edit / delete one record; `<type>` is `health-records`, `vaccines`, `weight`, `medications`, `appointments` or `emergency-contact`. Returns the updated list |
| `GET` | `/api/pets/:id/recommendations` | Get care recommendations |

### Blogs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/blogs?page=1&limit=9` | List posts, newest first. Returns `{ items, page, limit, total, totalPages }`; `limit` is capped at 50 and a page past the end returns the last page |
| `GET` | `/api/blogs/:id` | Get one post |
| `POST` | `/api/blogs` 🔒 | Create a post; an optional `imageData` (data URL of a JPEG/PNG/WebP photo) is stored as its cover |
| `PUT` | `/api/blogs/:id` 🔒 | Update your own post; `imageData` replaces the photo, `image: ""` removes it (the old photo is deleted) |
| `DELETE` | `/api/blogs/:id` 🔒 | Delete your own post |
| `GET` | `/api/images/:id` | A post's cover photo (cached by the browser for a week) |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Tolga Arslan**

[![GitHub](https://img.shields.io/badge/GitHub-TolgaARSLANN-181717?style=flat-square&logo=github)](https://github.com/TolgaARSLANN)

---

<div align="center">

🐶 *Because your pets deserve the very best.* 🐱

</div>
