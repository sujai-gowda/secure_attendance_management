#!/usr/bin/env python
"""
Entry point for Blockendance application.
This file allows running the app with: python run.py
"""

if __name__ == "__main__":
    from src.app import app
    from src.config.config import Config
    import logging
    
    logger = logging.getLogger(__name__)
    logger.info("Starting Blockendance - Blockchain-based Attendance System")
    logger.info(f"Access the application at: http://{Config.HOST}:{Config.PORT}")
    app.run(debug=Config.DEBUG, host=Config.HOST, port=Config.PORT)

