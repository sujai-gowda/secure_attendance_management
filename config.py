import os
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class Config:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "blockendance-secret-key-2018")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "5001"))
    
    BLOCKCHAIN_FILE: str = os.getenv("BLOCKCHAIN_FILE", "blockchain_data.json")
    BACKUP_DIR: str = os.getenv("BACKUP_DIR", "blockchain_backups")
    
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: Optional[str] = os.getenv("LOG_FILE", None)
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///blockendance.db"
    )
    
    USE_DATABASE: bool = os.getenv("USE_DATABASE", "False").lower() == "true"
    
    ENABLE_CSRF: bool = os.getenv("ENABLE_CSRF", "False").lower() == "true"
    
    @classmethod
    def validate(cls) -> tuple[bool, Optional[str]]:
        if not cls.SECRET_KEY:
            return False, "SECRET_KEY is required"
        
        if cls.SECRET_KEY == "blockendance-secret-key-2018":
            if not cls.DEBUG:
                return False, "SECRET_KEY must be changed from default value in production"
            logger.warning("Using default SECRET_KEY. This is insecure for production!")
        
        if len(cls.SECRET_KEY) < 32:
            if not cls.DEBUG:
                return False, "SECRET_KEY must be at least 32 characters in production"
            logger.warning("SECRET_KEY is too short. Use at least 32 characters in production!")
        
        return True, None
    
    @classmethod
    def validate_production(cls) -> tuple[bool, Optional[str]]:
        if cls.DEBUG:
            return True, None
        
        if not cls.SECRET_KEY or cls.SECRET_KEY == "blockendance-secret-key-2018":
            return False, "SECRET_KEY must be set to a strong value in production"
        
        if len(cls.SECRET_KEY) < 32:
            return False, "SECRET_KEY must be at least 32 characters in production"
        
        return True, None

