import json
import os
import logging
from datetime import datetime
from typing import List, Tuple

from database import db_service, BlockModel
from database_service import DatabaseBlockchainService
from block import Block
from persistence import load_blockchain
from config import Config

logger = logging.getLogger(__name__)


def migrate_json_to_database(json_file: str = None) -> Tuple[bool, str, int]:
    if json_file is None:
        json_file = Config.BLOCKCHAIN_FILE

    if not os.path.exists(json_file):
        return False, f"JSON file {json_file} not found", 0

    try:
        blockchain, message = load_blockchain(json_file)
        if not blockchain:
            return False, f"Failed to load blockchain: {message}", 0

        db_service = DatabaseBlockchainService()
        migrated_count = 0

        for block in blockchain:
            success, msg = db_service.add_block(block)
            if success:
                migrated_count += 1
            else:
                logger.warning(f"Failed to migrate block {block.index}: {msg}")

        return True, f"Migrated {migrated_count} blocks from {json_file}", migrated_count

    except Exception as e:
        logger.error(f"Error during migration: {str(e)}", exc_info=True)
        return False, f"Migration failed: {str(e)}", 0


def export_database_to_json(output_file: str = None) -> Tuple[bool, str]:
    if output_file is None:
        output_file = f"blockchain_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    try:
        db_service = DatabaseBlockchainService()
        blocks = db_service.get_all_blocks()

        blockchain_data = {
            "metadata": {
                "created": str(datetime.now()),
                "total_blocks": len(blocks),
                "version": "1.0",
                "source": "database"
            },
            "blocks": [block.to_dict() for block in blocks]
        }

        with open(output_file, 'w') as f:
            json.dump(blockchain_data, f, indent=2, default=str)

        return True, f"Exported {len(blocks)} blocks to {output_file}"

    except Exception as e:
        logger.error(f"Error exporting database: {str(e)}", exc_info=True)
        return False, f"Export failed: {str(e)}"


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "migrate":
        success, message, count = migrate_json_to_database()
        print(f"{'Success' if success else 'Failed'}: {message}")
        sys.exit(0 if success else 1)
    elif len(sys.argv) > 1 and sys.argv[1] == "export":
        success, message = export_database_to_json()
        print(f"{'Success' if success else 'Failed'}: {message}")
        sys.exit(0 if success else 1)
    else:
        print("Usage:")
        print("  python migrations/migrate_json_to_db.py migrate  # Migrate JSON to database")
        print("  python migrations/migrate_json_to_db.py export   # Export database to JSON")

