# Blockendance - Blockchain-Based Attendance Management System

![Blockchain](https://img.shields.io/badge/Blockchain-From%20Scratch-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8%2B-green.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![Flask](https://img.shields.io/badge/Flask-Web%20Framework-red.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 🚀 Project Overview

**Blockendance** is a complete blockchain implementation built from scratch in Python, demonstrating core blockchain concepts through a practical attendance management system. This project showcases how to build a functional blockchain without relying on existing blockchain frameworks.

### 🎯 Key Features

- **Pure Python Blockchain**: Every component built from scratch
- **Complete Blockchain Architecture**: Genesis block, block creation, chain validation
- **Cryptographic Security**: SHA-256 hashing and block linking
- **Modern React Frontend**: TypeScript, Tailwind CSS, shadcn/ui
- **RESTful API**: Versioned API with authentication and rate limiting
- **Production Ready**: Docker support, Gunicorn configuration, CI/CD
- **Security Features**: JWT authentication, bcrypt password hashing
- **Testing**: Unit tests, integration tests, E2E tests

## 📋 Quick Start

### Prerequisites

- **Python 3.8+** installed
- **Node.js 18+** and npm/yarn/pnpm installed

### Setup

1. **Install Backend Dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Create `.env` file** in project root:

   ```env
   SECRET_KEY=your-secret-key-here-change-in-production
   DEBUG=True
   HOST=0.0.0.0
   PORT=5001
   BLOCKCHAIN_FILE=blockchain_data.json
   BACKUP_DIR=blockchain_backups
   LOG_LEVEL=INFO
   ```

3. **Start Backend**

   ```bash
   python run.py
   ```

4. **Install Frontend Dependencies** (in a new terminal)

   ```bash
   cd frontend
   npm install
   ```

5. **Start Frontend**

   ```bash
   npm run dev
   ```

6. **Access the Application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5001`
   - API Docs: `http://localhost:5001/api/v1/docs`

**Default Login**: `admin` / `admin123` ⚠️ Change in production!

## 🏗️ Architecture

### Backend Structure

```
src/
├── app.py                    # Main Flask application
├── config/                   # Configuration
├── services/                 # Business logic (blockchain, auth, classroom)
├── api/v1/                   # API routes, schemas, documentation
├── blockchain/               # Core blockchain implementation
├── models/                   # Data models
└── utils/                    # Utilities (validators, analytics, logging)
```

### Frontend Structure

```
frontend/src/
├── components/   # React components
├── pages/       # Page components
├── services/    # API services
└── contexts/    # React contexts
```

## 📚 API Documentation

- **Interactive Docs**: `http://localhost:5001/api/v1/docs` (Swagger UI)
- **Base URL**: `http://localhost:5001/api/v1`

### Key Endpoints

- `POST /auth/login` - User authentication
- `POST /attendance` - Submit attendance record
- `GET /records` - Get attendance records
- `GET /analytics` - Attendance analytics
- `GET /integrity` - Blockchain integrity check
- `GET /classrooms` - Manage classrooms

All endpoints (except `/auth/login`, `/auth/verify`, `/stats`, `/records`, `/analytics`, `/integrity`) require JWT authentication.

## 🔒 Security

- **JWT Authentication** with 24-hour token expiration
- **Role-Based Access Control** (Admin, Teacher, Student/Viewer)
- **Bcrypt Password Hashing**
- **Rate Limiting** on all endpoints
- **Input Validation** and XSS prevention
- **CORS Configuration**

**Important**: Change default credentials and set a strong `SECRET_KEY` (minimum 32 characters) in production!

## 📖 Additional Documentation

- **[HOW_TO_RUN.md](HOW_TO_RUN.md)** - Detailed running instructions
- **[ROADMAP.md](ROADMAP.md)** - Development roadmap
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

## 👨‍💻 Author

**Sujai** & **Prathamesh**

---

_Built with ❤️ to demonstrate blockchain technology from scratch_
