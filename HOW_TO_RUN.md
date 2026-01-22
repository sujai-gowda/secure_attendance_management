# How to Run the Backend

## Quick Start

### Development Mode

```bash
python run.py
```

The server will start at `http://localhost:5001`

### Production Mode

```bash
# Using Gunicorn
gunicorn --config gunicorn_config.py src.app:app

# Or use the production script
./start_production.sh
```

## Project Structure

All backend code is now organized in the `src/` folder:

```
src/
├── app.py                    # Main Flask application
├── config/                   # Configuration
│   └── config.py
├── services/                 # Business logic
│   ├── blockchain_service.py
│   ├── auth_service.py
│   ├── classroom_service.py
│   └── database_service.py
├── api/v1/                   # API endpoints
│   ├── routes.py
│   ├── schemas.py
│   └── docs.py
├── blockchain/               # Core blockchain
│   ├── block.py
│   ├── genesis.py
│   ├── newBlock.py
│   ├── getBlock.py
│   ├── checkChain.py
│   ├── persistence.py
│   └── merkle_tree.py
├── models/                   # Data models
│   ├── database.py
│   └── classroom_models.py
└── utils/                    # Utilities
    ├── validators.py
    ├── analytics.py
    ├── logger_config.py
    └── rate_limiter.py
```

## Running Tests

```bash
# Run all pytest tests
pytest tests/

# Run specific test file
pytest tests/test_blockchain_service.py -v

# Run security tests
python tests/test_security.py

# Run blockchain demo
python demo.py

# Run blockchain test
python test_blockchain.py
```

## Environment Variables

Create a `.env` file in the root directory:

```env
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
HOST=0.0.0.0
PORT=5001
BLOCKCHAIN_FILE=blockchain_data.json
BACKUP_DIR=blockchain_backups
LOG_LEVEL=INFO
```

## Docker

```bash
# Build and run
docker-compose up -d

# Or build manually
docker build -t blockendance-backend .
docker run -p 5001:5001 blockendance-backend
```

## Important Notes

- **Entry Point**: Use `python run.py` (not `python src/app.py`)
- **All imports**: Use `src.` prefix (e.g., `from src.services.blockchain_service import BlockchainService`)
- **Old files**: All duplicate root-level files have been removed
- **Tests**: All test files are in the `tests/` folder

