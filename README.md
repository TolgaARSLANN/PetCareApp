<div align="center">

# 🐾 Pawfect Care

### Smart Pet Care Assistant for Devoted Pet Owners

[![JavaScript](https://img.shields.io/badge/JavaScript-79.7%25-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://github.com/TolgaARSLANN/PetCareApp)
[![CSS](https://img.shields.io/badge/CSS-19.9%25-1572B6?style=flat-square&logo=css3&logoColor=white)](https://github.com/TolgaARSLANN/PetCareApp)
[![React](https://img.shields.io/badge/React.js-Frontend-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## 📌 About

**Pawfect Care** is a full-stack web application that helps pet owners manage their animals' health and daily care in one place. From vaccination schedules and vet appointments to emergency guidance and blog content, Pawfect Care brings everything a responsible pet owner needs into a single, easy-to-use platform.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏥 **Health & Care Records** | Log and track your pet's medical history and care notes |
| 💉 **Vaccination Tracking** | Keep up with vaccination schedules and upcoming due dates |
| 📅 **Appointment Management** | Plan and manage veterinary appointments |
| 🎯 **Recommendation System** | Get personalized care tips based on your pet's species and age |
| 📖 **Blog Content** | Access informative articles on pet health and care |
| 🚑 **Emergency Guide** | Find nearby vet info and first-aid guidance for urgent situations |

---

## 🛠️ Tech Stack

### Frontend
- **React.js** — Component-based user interface
- **CSS3** — Custom styling and animations
- **HTML5** — Structural markup

### Backend
- **Node.js** — Server-side JavaScript runtime
- **Express.js** — RESTful API framework

### Database
- **MongoDB** — NoSQL document-based database

---

## 📁 Project Structure

```
PetCareApp/
├── backend/              # Node.js & Express.js API
│   ├── index.js          # Server entry point
│   ├── models/           # MongoDB data models
│   ├── routes/           # API route definitions
│   └── controllers/      # Business logic layer
│
├── frontend/             # React.js application
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Page-level components
│       └── App.js        # Root application component
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (local installation or MongoDB Atlas)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/TolgaARSLANN/PetCareApp.git
cd PetCareApp
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/petcareapp
```

Start the server:

```bash
node index.js
```

> The backend runs at `http://localhost:5000` by default.

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

> The frontend runs at `http://localhost:3000` by default.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/pets` | Retrieve all pets |
| `POST` | `/api/pets` | Add a new pet |
| `GET` | `/api/pets/:id` | Get a specific pet |
| `PUT` | `/api/pets/:id` | Update pet information |
| `DELETE` | `/api/pets/:id` | Delete a pet |
| `GET` | `/api/appointments` | List all appointments |
| `POST` | `/api/appointments` | Create a new appointment |
| `GET` | `/api/blog` | Retrieve blog posts |
| `GET` | `/api/recommendations` | Get care recommendations |

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. **Fork** this repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add new feature'`
4. Push the branch: `git push origin feature/your-feature-name`
5. Open a **Pull Request**

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
