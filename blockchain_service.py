import logging
import threading
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime

from block import Block
from genesis import create_genesis_block, create_blockchain
from newBlock import next_block
from getBlock import find_records, get_all_attendance_records, search_by_student
from checkChain import check_integrity, get_blockchain_stats, validate_block
from persistence import (
    save_blockchain,
    load_blockchain,
    export_blockchain_csv,
    get_blockchain_backups,
    restore_from_backup,
    cleanup_old_backups
)
from analytics import (
    get_attendance_analytics,
    generate_attendance_report,
    export_analytics,
    get_blockchain_health
)
from config import Config

logger = logging.getLogger(__name__)

USE_DATABASE = Config.USE_DATABASE

if USE_DATABASE:
    try:
        from database_service import DatabaseBlockchainService
        db_blockchain_service = DatabaseBlockchainService()
        logger.info("Using database for blockchain storage")
    except ImportError:
        USE_DATABASE = False
        logger.warning("Database service not available, falling back to JSON storage")


class BlockchainService:
    def __init__(self, blockchain: Optional[List[Block]] = None):
        self._lock = threading.Lock()
        self._blockchain: List[Block] = blockchain or []
        self._initialize_blockchain()

    def _initialize_blockchain(self) -> None:
        with self._lock:
            if USE_DATABASE:
                try:
                    blocks = db_blockchain_service.get_all_blocks()
                    if blocks:
                        self._blockchain = blocks
                        logger.info(f"Loaded {len(blocks)} blocks from database")
                    else:
                        genesis = create_genesis_block()
                        db_blockchain_service.add_block(genesis)
                        self._blockchain = [genesis]
                        logger.info("Created genesis block in database")
                except Exception as e:
                    logger.error(f"Error loading from database: {str(e)}", exc_info=True)
                    self._blockchain = create_blockchain()
            else:
                if not self._blockchain:
                    loaded_blockchain, load_message = load_blockchain(Config.BLOCKCHAIN_FILE)
                    if loaded_blockchain:
                        self._blockchain = loaded_blockchain
                        logger.info(f"Loaded existing blockchain: {load_message}")
                    else:
                        self._blockchain = create_blockchain()
                        logger.info(f"Created new blockchain: {load_message}")
                        save_success, save_msg = save_blockchain(
                            self._blockchain, Config.BLOCKCHAIN_FILE
                        )
                        if save_success:
                            logger.info(f"Saved new blockchain: {save_msg}")
                        else:
                            logger.warning(f"Failed to save new blockchain: {save_msg}")

    @property
    def blockchain(self) -> List[Block]:
        with self._lock:
            if USE_DATABASE:
                try:
                    return db_blockchain_service.get_all_blocks()
                except Exception as e:
                    logger.error(f"Error loading from database: {str(e)}", exc_info=True)
                    return self._blockchain.copy()
            return self._blockchain.copy()

    def get_blockchain(self) -> List[Block]:
        return self.blockchain

    def add_attendance_block(
        self, form_data: Dict[str, Any], attendance_data: List[str]
    ) -> Tuple[bool, str]:
        try:
            with self._lock:
                attendance_dict = {
                    "type": "attendance",
                    "teacher_name": attendance_data[0] if len(attendance_data) > 0 else "",
                    "date": attendance_data[1] if len(attendance_data) > 1 else "",
                    "course": attendance_data[2] if len(attendance_data) > 2 else "",
                    "year": attendance_data[3] if len(attendance_data) > 3 else "",
                    "present_students": []
                }

                i = 1
                while form_data.get(f"roll_no{i}"):
                    roll_no = form_data.get(f"roll_no{i}", "").strip()
                    if roll_no:
                        attendance_dict["present_students"].append(roll_no)
                    i += 1

                if not attendance_dict["present_students"]:
                    return False, "Error: No students marked present!"

                if not self._blockchain:
                    return False, "Error: Blockchain not initialized"

                previous_block = self._blockchain[-1]
                block_to_add = next_block(previous_block, attendance_dict)

                if not block_to_add.is_valid():
                    return False, "Error: Invalid block created!"

                self._blockchain.append(block_to_add)

                if USE_DATABASE:
                    db_success, db_msg = db_blockchain_service.add_block(block_to_add)
                    if not db_success:
                        logger.warning(f"Failed to save block to database: {db_msg}")
                else:
                    save_success, save_msg = save_blockchain(
                        self._blockchain, Config.BLOCKCHAIN_FILE
                    )
                    if not save_success:
                        logger.warning(f"Failed to save blockchain after adding block: {save_msg}")

                logger.info(
                    f"Added block #{block_to_add.index} with {len(attendance_dict['present_students'])} students"
                )

                return True, (
                    f"Block #{block_to_add.index} has been added to the blockchain! "
                    f"{len(attendance_dict['present_students'])} students marked present."
                )

        except Exception as e:
            logger.error(f"Error adding attendance block: {str(e)}", exc_info=True)
            return False, f"Error adding block: {str(e)}"

    def find_attendance_records(
        self, search_criteria: Dict[str, Any]
    ) -> Tuple[bool, Optional[List[str]]]:
        try:
            records = find_records(search_criteria, self.blockchain)
            if records == -1:
                return False, None
            return True, records
        except Exception as e:
            logger.error(f"Error finding attendance records: {str(e)}", exc_info=True)
            return False, None

    def get_all_records(self) -> List[Dict[str, Any]]:
        try:
            return get_all_attendance_records(self.blockchain)
        except Exception as e:
            logger.error(f"Error getting all records: {str(e)}", exc_info=True)
            return []

    def search_by_student(self, roll_no: str) -> List[Dict[str, Any]]:
        try:
            return search_by_student(self.blockchain, roll_no)
        except Exception as e:
            logger.error(f"Error searching by student: {str(e)}", exc_info=True)
            return []

    def check_chain_integrity(self) -> str:
        try:
            return check_integrity(self.blockchain)
        except Exception as e:
            logger.error(f"Error checking chain integrity: {str(e)}", exc_info=True)
            return f"Error checking blockchain: {str(e)}"

    def get_stats(self) -> Dict[str, Any]:
        try:
            return get_blockchain_stats(self.blockchain)
        except Exception as e:
            logger.error(f"Error getting blockchain stats: {str(e)}", exc_info=True)
            return {"error": str(e)}

    def get_analytics(self) -> Dict[str, Any]:
        try:
            return get_attendance_analytics(self.blockchain)
        except Exception as e:
            logger.error(f"Error getting analytics: {str(e)}", exc_info=True)
            return {"error": str(e)}

    def generate_report(self, format_type: str = "text") -> str:
        try:
            return generate_attendance_report(self.blockchain, format=format_type)
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}", exc_info=True)
            return f"Error generating report: {str(e)}"

    def export_data(self, format_type: str) -> Tuple[bool, str]:
        try:
            if format_type == 'csv':
                success, message = export_blockchain_csv(self.blockchain)
                return success, message
            elif format_type == 'analytics':
                success, message = export_analytics(self.blockchain)
                return success, message
            elif format_type == 'json':
                success, message = save_blockchain(self.blockchain, Config.BLOCKCHAIN_FILE)
                return success, message
            else:
                return False, "Invalid export format"
        except Exception as e:
            logger.error(f"Error exporting data: {str(e)}", exc_info=True)
            return False, f"Error exporting data: {str(e)}"

    def reload_blockchain(self) -> Tuple[bool, str, int]:
        try:
            with self._lock:
                loaded_blockchain, message = load_blockchain(Config.BLOCKCHAIN_FILE)
                if loaded_blockchain:
                    self._blockchain = loaded_blockchain
                    logger.info(f"Reloaded blockchain: {message}")
                    return True, message, len(self._blockchain)
                else:
                    logger.warning(f"Failed to reload blockchain: {message}")
                    return False, message, 0
        except Exception as e:
            logger.error(f"Error reloading blockchain: {str(e)}", exc_info=True)
            return False, f"Error reloading blockchain: {str(e)}", 0

    def get_health(self) -> Dict[str, Any]:
        try:
            return get_blockchain_health(self.blockchain)
        except Exception as e:
            logger.error(f"Error getting blockchain health: {str(e)}", exc_info=True)
            return {"error": str(e)}

    def get_backups(self) -> List[Dict[str, Any]]:
        try:
            return get_blockchain_backups()
        except Exception as e:
            logger.error(f"Error getting backups: {str(e)}", exc_info=True)
            return []

    def restore_backup(self, backup_filename: str) -> Tuple[bool, str]:
        try:
            with self._lock:
                restored_blockchain, message = restore_from_backup(backup_filename)
                if restored_blockchain:
                    self._blockchain = restored_blockchain
                    logger.info(f"Restored from backup: {backup_filename}")
                    return True, message
                else:
                    logger.warning(f"Failed to restore backup: {message}")
                    return False, message
        except Exception as e:
            logger.error(f"Error restoring backup: {str(e)}", exc_info=True)
            return False, f"Error restoring backup: {str(e)}"

    def cleanup_backups(self, keep_count: int = 10) -> Tuple[bool, str]:
        try:
            return cleanup_old_backups(keep_count)
        except Exception as e:
            logger.error(f"Error cleaning up backups: {str(e)}", exc_info=True)
            return False, f"Error cleaning up backups: {str(e)}"

    def get_block_count(self) -> int:
        with self._lock:
            if USE_DATABASE:
                try:
                    return db_blockchain_service.get_block_count()
                except Exception as e:
                    logger.error(f"Error getting block count from database: {str(e)}", exc_info=True)
                    return len(self._blockchain)
            return len(self._blockchain)

