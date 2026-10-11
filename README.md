<div align="center">

# 🐾 Pawfect Care

### Smart Pet Care Assistant for Devoted Pet Owners

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
| 🔐 **Accounts** | Register and log in with email and password (bcrypt-hashed, JWT sessions) |
| 🐶 **Pet Profiles** | Add, edit and delete pets; every pet is visible only to its owner |
| 🏥 **Health Records** | Log dated health notes for each pet |
| ⚖️ **Weight Tracking** | Record weight measurements over time |
| 💊 **Medications** | Track medication name, dosage, frequency and dates |
| 📅 **Appointments** | Keep a list of vet appointments with date, time, reason and location |
| 🚑 **Emergency Contacts** | Store a vet or trusted person to call in an emergency |
| 🎯 **Recommendations** | Care suggestions based on species, weight trend (kg) and existing records |
| 📖 **Blog** | Anyone can read posts; logged-in users can write posts and edit or delete their own |

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, React Router, Axios, Phosphor Icons, hand-written CSS design system (no UI framework)
- **Backend:** Node.js, Express 4, Mongoose, JSON Web Tokens, bcrypt, dotenv
- **Testing:** Jest, Supertest
- **Database:** MongoDB

---

## 📁 Project Structure

```
PetCareApp/
├── backend/
│   └── server/
│       ├── index.js              # Connects to MongoDB and starts the server
│       ├── app.js                # Express app (routes, middleware)
│       ├── config.js             # Reads settings from environment variables
│       ├── .env.example          # Template for your local .env
│       ├── middleware/
│       │   └── authMiddleware.js # Verifies the JWT and sets req.userId
│       ├── models/               # Mongoose schemas: User, Pet, Blog
│       ├── routes/               # auth.js, pets.js, blogs.js
│       ├── services/             # Recommendation logic
│       └── tests/                # Jest + Supertest API tests
│
├── frontend/
│   ├── .env.example              # Optional API URL override
│   ├── index.html                # Vite entry page
│   ├── vite.config.js            # Dev server port and build settings
│   ├── public/                   # Favicon
│   └── src/
│       ├── components/           # Pages and page-level components
│       │   └── ui/               # Shared UI: Alert, Field, ConfirmDialog, EmptyState, Loading…
│       ├── hooks/                # useDocumentTitle
│       ├── services/             # Axios API client and auth helpers
│       ├── styles/               # global.css (design tokens + components), layout.css, pages.css
│       ├── utils/                # Date / age formatting
│       └── App.jsx               # Routes
│
├── package.json                  # Root scripts: setup, dev, start, test, build
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (required by Vite)
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
| `npm test` | Backend tests |
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
| `JWT_EXPIRES_IN` | `1d` | Token lifetime |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Frontend origin allowed by CORS |

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

The app opens at `http://localhost:3000`.

`npm run build` creates a production build in `frontend/build/`, and `npm run preview` serves it locally.

To point the frontend at a different API (for example after deploying the backend), copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL`.

### 4. Run the tests

```bash
cd backend/server
npm test
```

The tests mock the database layer, so they run without MongoDB or a `.env` file.

---

## 📡 API Endpoints

🔒 = requires an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create an account (`email`, `password`) |
| `POST` | `/api/auth/login` | Log in and receive a JWT |

### Pets 🔒

All pet endpoints only return or modify pets owned by the logged-in user.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/pets` | List your pets |
| `POST` | `/api/pets` | Add a pet |
| `GET` | `/api/pets/:id` | Get one pet |
| `PUT` | `/api/pets/:id` | Update a pet |
| `DELETE` | `/api/pets/:id` | Delete a pet |
| `GET` / `POST` | `/api/pets/:id/health-records` | List / add health records |
| `GET` / `POST` | `/api/pets/:id/weight` | List / add weight measurements |
| `GET` / `POST` | `/api/pets/:id/medications` | List / add medications |
| `GET` / `POST` | `/api/pets/:id/appointments` | List / add appointments |
| `GET` / `POST` | `/api/pets/:id/emergency-contact` | List / add emergency contacts |
| `GET` | `/api/pets/:id/recommendations` | Get care recommendations |

### Blogs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/blogs` | List posts (newest first) |
| `GET` | `/api/blogs/:id` | Get one post |
| `POST` | `/api/blogs` 🔒 | Create a post |
| `PUT` | `/api/blogs/:id` 🔒 | Update your own post |
| `DELETE` | `/api/blogs/:id` 🔒 | Delete your own post |

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
