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
- **Security Features**: JWT authentication, bcrypt password hashing, CSRF protection (optional)
- **Testing**: Unit tests, integration tests, E2E tests with Playwright

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Development](#-development)

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** installed
- **Node.js 18+** and npm/yarn/pnpm installed
- **Git** (optional, for cloning)

### 5-Minute Setup

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
   python blockchain.py
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

## 📦 Installation

### Backend Setup

1. **Install Python Dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Create Environment File**

   Create a `.env` file in the project root:

   ```env
   SECRET_KEY=your-strong-secret-key-minimum-32-characters-long
   DEBUG=True
   HOST=0.0.0.0
   PORT=5001

   BLOCKCHAIN_FILE=blockchain_data.json
   BACKUP_DIR=blockchain_backups

   LOG_LEVEL=INFO
   LOG_FILE=

   # Database (Optional - defaults to SQLite)
   USE_DATABASE=False
   DATABASE_URL=sqlite:///blockendance.db

   # CSRF Protection (Optional - disabled by default for API-first approach)
   ENABLE_CSRF=False
   ```

   **Important**:

   - Change `SECRET_KEY` to a secure random string in production!
   - Minimum 32 characters recommended
   - Use a strong random generator: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

### Frontend Setup

1. **Navigate to Frontend Directory**

   ```bash
   cd frontend
   ```

2. **Install Dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Create Environment File** (Optional)

   Create a `.env` file in the `frontend` directory:

   ```env
   VITE_API_URL=http://localhost:5001/api/v1
   ```

## ⚙️ Configuration

### Backend Configuration

All backend configuration is done via environment variables in the `.env` file:

| Variable          | Description                                 | Default                        |
| ----------------- | ------------------------------------------- | ------------------------------ |
| `SECRET_KEY`      | Secret key for JWT and Flask sessions       | `blockendance-secret-key-2018` |
| `DEBUG`           | Enable debug mode                           | `True`                         |
| `HOST`            | Server host                                 | `0.0.0.0`                      |
| `PORT`            | Server port                                 | `5001`                         |
| `BLOCKCHAIN_FILE` | JSON file for blockchain storage            | `blockchain_data.json`         |
| `BACKUP_DIR`      | Directory for blockchain backups            | `blockchain_backups`           |
| `LOG_LEVEL`       | Logging level (DEBUG, INFO, WARNING, ERROR) | `INFO`                         |
| `USE_DATABASE`    | Enable database storage                     | `False`                        |
| `DATABASE_URL`    | Database connection string                  | `sqlite:///blockendance.db`    |
| `ENABLE_CSRF`     | Enable CSRF protection                      | `False`                        |

### Frontend Configuration

| Variable       | Description     | Default                        |
| -------------- | --------------- | ------------------------------ |
| `VITE_API_URL` | Backend API URL | `http://localhost:5001/api/v1` |

## 🏃 Running the Application

### Development Mode

**Terminal 1** - Backend:

```bash
python blockchain.py
```

**Terminal 2** - Frontend:

```bash
cd frontend
npm run dev
```

Both will auto-reload on code changes.

### Production Mode

**Backend** (using Gunicorn):

```bash
pip install gunicorn
gunicorn --config gunicorn_config.py blockchain:app
```

Or use the production script:

```bash
chmod +x start_production.sh
./start_production.sh
```

**Frontend**:

```bash
cd frontend
npm run build
# Serve the dist/ folder with nginx or any static file server
```

### Docker Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete Docker deployment instructions.

```bash
docker-compose up -d
```

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_blockchain_service.py -v

# Run security tests
python test_security.py

# Run end-to-end flow tests
python test_flows.py
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E with UI
npm run test:e2e:ui
```

### Test Structure

```
tests/
├── test_blockchain_service.py  # Blockchain service tests
├── test_validators.py           # Input validation tests
├── test_auth_service.py         # Authentication tests
└── test_integration.py          # API integration tests

frontend/src/components/__tests__/  # Component tests
frontend/e2e/                       # E2E tests
```

## 🚢 Deployment

### Docker Deployment

#### Prerequisites

- Docker and Docker Compose installed
- At least 2GB RAM available

#### Quick Start

1. **Create `.env` file** with production values:

   ```env
   SECRET_KEY=your-strong-secret-key-minimum-32-characters-long
   DEBUG=False
   HOST=0.0.0.0
   PORT=5001
   DATABASE_URL=sqlite:///blockendance.db
   USE_DATABASE=False
   BLOCKCHAIN_FILE=blockchain_data.json
   BACKUP_DIR=blockchain_backups
   LOG_LEVEL=INFO
   ```

2. **Build and start containers**:

   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:5001`
   - API Docs: `http://localhost:5001/api/v1/docs`

#### Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Production Deployment

#### Using Gunicorn

The application includes a Gunicorn configuration file (`gunicorn_config.py`).

**Using the configuration file:**

```bash
pip install gunicorn
gunicorn --config gunicorn_config.py blockchain:app
```

**Manual configuration:**

```bash
gunicorn -w 4 -b 0.0.0.0:5001 blockchain:app
```

**Production startup script:**

```bash
chmod +x start_production.sh
./start_production.sh
```

**Environment variables for Gunicorn:**

- `PORT`: Port to bind to (default: 5001)
- `WORKERS`: Number of worker processes (default: CPU count \* 2 + 1)
- `LOG_LEVEL`: Logging level (default: info)

#### Production Checklist

1. **Set strong SECRET_KEY** (minimum 32 characters)
2. **Set DEBUG=False**
3. **Use PostgreSQL** (set `USE_DATABASE=True` and configure `DATABASE_URL`)
4. **Use production WSGI server** (Gunicorn)
5. **Enable HTTPS** with reverse proxy (nginx/Apache)
6. **Configure CORS** for production domains only
7. **Set up monitoring** and logging
8. **Configure backups** for blockchain data and database

### Manual Deployment

#### Backend

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Set environment variables (create `.env` file)

3. Run with Gunicorn:
   ```bash
   gunicorn --config gunicorn_config.py blockchain:app
   ```

#### Frontend

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Build for production:

   ```bash
   npm run build
   ```

3. Serve the `dist/` folder with nginx or any static file server

### Health Checks

The backend includes health check endpoints:

```bash
curl http://localhost:5001/api/v1/stats
```

### Backup Strategy

- Blockchain data automatically backed up to `blockchain_backups/` directory
- For production: Set up automated backups of `blockchain_backups/` directory
- Consider database backups if using PostgreSQL
- Store backups in a secure, off-site location

## 🏗️ Architecture

### Blockchain Implementation

#### Core Components

- **Block Structure**: Index, timestamp, data, previous hash, current hash
- **Genesis Block**: First block (index 0) that initializes the chain
- **Chain Validation**: Cryptographic hash verification and tamper detection
- **Data Immutability**: Once written, data cannot be modified

#### File Structure

```
secure_attendance_management/
├── block.py              # Block class with hashing
├── genesis.py            # Genesis block creation
├── newBlock.py           # New block creation
├── getBlock.py           # Block retrieval and search
├── checkChain.py         # Chain integrity verification
├── blockchain.py         # Main Flask application
├── blockchain_service.py # Service layer
├── auth_service.py       # Authentication and authorization
├── api_v1.py             # Versioned API endpoints
├── config.py             # Configuration management
├── validators.py         # Input validation
├── tests/                # Backend tests
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── contexts/    # React contexts
│   └── e2e/             # E2E tests
└── templates/           # Legacy HTML templates
```

### Frontend Architecture

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **React Router** for routing
- **Axios** for API communication
- **Error Boundaries** for error handling

## 📚 API Documentation

### Base URL

- **Development**: `http://localhost:5001/api/v1`
- **Production**: `https://your-domain.com/api/v1`

### Interactive Documentation

- **Swagger UI**: `http://localhost:5001/api/v1/docs` (Interactive API testing)

### Authentication

All API endpoints (except `/auth/login`, `/auth/verify`, `/auth/refresh`, `/stats`, `/records`, `/students/{roll_no}`, `/analytics`, `/integrity`) require authentication via JWT token.

Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Standard Response Format

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**

```json
{
  "error": "error_type",
  "message": "Human-readable error message",
  "status_code": 400,
  "details": { ... }
}
```

### Key Endpoints

#### Authentication

- `POST /auth/login` - User authentication (returns JWT token)
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/verify` - Verify token validity

#### Attendance

- `POST /attendance` - Submit attendance record
- `GET /records` - Get paginated attendance records (with filters)
- `GET /students/{roll_no}` - Search attendance by student roll number

#### Analytics & Statistics

- `GET /stats` - Blockchain statistics
- `GET /analytics` - Attendance analytics and trends
- `GET /integrity` - Blockchain integrity check

#### Export

- `GET /export/{format}` - Export data (csv, analytics, json)
- `GET /report` - Generate attendance report

### Query Parameters

**Pagination** (for `/records`, `/analytics`):

- `page` (integer, default: 1) - Page number
- `per_page` (integer, default: 10, max: 100) - Items per page

**Filters** (for `/records`):

- `teacher_name` (string) - Filter by teacher name
- `course` (string) - Filter by course name
- `date` (string, YYYY-MM-DD) - Filter by date
- `year` (string) - Filter by year

### Rate Limiting

Rate limits are applied per endpoint:

- `/auth/login`: 5 requests per minute
- `/auth/refresh`: 10 requests per minute
- `/records`, `/stats`: 30 requests per minute
- `/analytics`: 20 requests per minute
- `/export`: 10 requests per minute
- Default: 200 requests per day, 50 per hour

When rate limit is exceeded, you'll receive a 429 status code.

### Error Codes

| Status Code | Error Type               | Description                       |
| ----------- | ------------------------ | --------------------------------- |
| 400         | validation_error         | Invalid request data              |
| 401         | unauthorized             | Missing or invalid authentication |
| 401         | authentication_failed    | Invalid credentials               |
| 403         | insufficient_permissions | User lacks required permissions   |
| 404         | not_found                | Resource not found                |
| 429         | rate_limit_exceeded      | Too many requests                 |
| 500         | internal_error           | Server error                      |

### Example Usage

**Using cURL:**

```bash
# Login
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get records (with token)
curl -X GET "http://localhost:5001/api/v1/records?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Using JavaScript/TypeScript:**

```typescript
// Login
const response = await fetch("http://localhost:5001/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "admin", password: "admin123" }),
});
const { data } = await response.json();
const token = data.token;

// Authenticated request
const recordsResponse = await fetch(
  "http://localhost:5001/api/v1/records?page=1&per_page=10",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);
```

For complete API reference with all endpoints and examples, visit the interactive Swagger documentation at `/api/v1/docs` when the server is running.

## 🔒 Security

### Security Features

#### Authentication & Authorization

- **JWT Authentication**: Secure token-based authentication with 24-hour expiration
- **Token Refresh**: Automatic token renewal via `/api/v1/auth/refresh` endpoint
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full access (read, write, delete, manage_users)
  - **Teacher**: Read and write access
  - **Student/Viewer**: Read-only access

#### Password Security

- **Bcrypt Password Hashing**: Secure password storage (upgraded from SHA-256)
- **Automatic Migration**: Legacy SHA-256 hashes automatically migrated to bcrypt on login

#### Input Validation & Sanitization

- **Comprehensive Validation**: All inputs validated using Marshmallow schemas
- **XSS Prevention**: HTML output sanitization
- **Length Limits**: Maximum lengths enforced (teacher: 100, course: 200, roll number: 50)
- **Format Validation**: Date formats, roll number patterns, etc.

#### Rate Limiting

- **Per-Endpoint Limits**:
  - Login: 5 requests/minute
  - API endpoints: 30 requests/minute
  - Analytics: 20 requests/minute
  - Export: 10 requests/minute
  - Default: 200/day, 50/hour

#### Additional Security

- **CSRF Protection**: Optional, configurable via `ENABLE_CSRF` environment variable
- **CORS Configuration**: Restricted to allowed origins
- **Error Handling**: Generic error messages prevent information leakage
- **Security Logging**: Failed authentication attempts and rate limit violations logged

### Security Best Practices

1. **Change Default Credentials**: Update admin password (`admin`/`admin123`) in production
2. **Strong SECRET_KEY**: Use at least 32 random characters
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```
3. **HTTPS**: Always use HTTPS in production
4. **Environment Variables**: Never commit `.env` files to version control
5. **Regular Updates**: Keep dependencies updated
6. **Production Configuration**: Set `DEBUG=False` and use strong `SECRET_KEY`
7. **Database Security**: Use PostgreSQL with proper access controls in production
8. **Token Storage**: Consider httpOnly cookies for enhanced security (optional)

### Security Checklist

- [x] Input validation on all user inputs
- [x] Output sanitization to prevent XSS
- [x] Authentication required for API endpoints
- [x] Role-based access control
- [x] Rate limiting on all endpoints
- [x] CORS configured
- [x] Secrets in environment variables
- [x] Error handling without information leakage
- [x] Logging of security events
- [x] Bcrypt password hashing
- [x] Token refresh mechanism
- [ ] CSRF protection (optional, configurable)
- [ ] Password complexity requirements (future)
- [ ] Account lockout after failed attempts (future)

## 💻 Development

### Development Workflow

1. **Make Backend Changes**: Backend auto-reloads if `DEBUG=True`
2. **Make Frontend Changes**: Frontend hot-reloads automatically
3. **Run Tests**: Ensure all tests pass before committing
4. **Check Linting**: Run `npm run lint` for frontend

### Code Style

- **Backend**: Follow PEP 8 Python style guide
- **Frontend**: ESLint configuration with TypeScript
- **Components**: Follow SOLID principles

### Project Roadmap

See [ROADMAP.md](ROADMAP.md) for development progress and planned features.

## 📖 Additional Documentation

- **[ROADMAP.md](ROADMAP.md)** - Development roadmap and progress tracking
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Adeen Shukla** - _Initial work_ - [GitHub](https://github.com/adeen-s)

---

_Built with ❤️ to demonstrate blockchain technology from scratch_
