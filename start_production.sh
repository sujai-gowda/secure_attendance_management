#!/bin/bash

set -e

echo "Starting Blockendance in production mode..."

if [ -z "$SECRET_KEY" ]; then
    echo "ERROR: SECRET_KEY environment variable is not set"
    echo "Please set a secure SECRET_KEY before starting the application"
    exit 1
fi

if [ "$SECRET_KEY" = "your-secret-key-here-change-in-production" ]; then
    echo "WARNING: SECRET_KEY is using default value. This is not secure for production!"
    echo "Please set a secure SECRET_KEY in environment variables"
    exit 1
fi

WORKERS=${WORKERS:-4}
PORT=${PORT:-5001}

echo "Starting Gunicorn with $WORKERS workers on port $PORT"

exec gunicorn --config gunicorn_config.py blockchain:app

