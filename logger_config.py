import logging
import sys
from typing import Optional
from config import Config


def setup_logging(log_file: Optional[str] = None) -> None:
    log_level = getattr(logging, Config.LOG_LEVEL.upper(), logging.INFO)
    
    handlers = [logging.StreamHandler(sys.stdout)]
    
    if log_file:
        handlers.append(logging.FileHandler(log_file))
    
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=handlers
    )
    
    logger = logging.getLogger(__name__)
    logger.info(f"Logging initialized with level: {Config.LOG_LEVEL}")

