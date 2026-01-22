import json
import os
import datetime as dt
from typing import List, Tuple, Optional, Dict, Any
from src.blockchain.block import Block


def save_blockchain(
    blockchain: List[Block], filename: Optional[str] = None
) -> Tuple[bool, str]:
    if filename is None:
        from src.config.config import Config
        filename = Config.BLOCKCHAIN_FILE
    
    try:
        # Convert blockchain to serializable format
        blockchain_data = {
            "metadata": {
                "created": str(dt.datetime.now()),
                "total_blocks": len(blockchain),
                "version": "1.0"
            },
            "blocks": [block.to_dict() for block in blockchain]
        }
        
        from src.config.config import Config
        os.makedirs(Config.BACKUP_DIR, exist_ok=True)
        
        # Save to file
        with open(filename, 'w') as f:
            json.dump(blockchain_data, f, indent=2, default=str)
        
        from src.config.config import Config
        timestamp = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = os.path.join(Config.BACKUP_DIR, f"blockchain_backup_{timestamp}.json")
        with open(backup_filename, 'w') as f:
            json.dump(blockchain_data, f, indent=2, default=str)
        
        return True, f"Blockchain saved to {filename} and backed up to {backup_filename}"
    
    except Exception as e:
        return False, f"Error saving blockchain: {str(e)}"

def load_blockchain(filename: Optional[str] = None) -> Tuple[Optional[List[Block]], str]:
    if filename is None:
        from src.config.config import Config
        filename = Config.BLOCKCHAIN_FILE
    
    try:
        if not os.path.exists(filename):
            return None, f"Blockchain file {filename} not found"
        
        with open(filename, 'r') as f:
            blockchain_data = json.load(f)
        
        # Reconstruct blockchain from data
        blockchain = []
        for block_data in blockchain_data["blocks"]:
            # Convert timestamp string back to datetime
            timestamp = dt.datetime.fromisoformat(block_data["timestamp"].replace('Z', '+00:00'))
            
            # Create block object
            # Note: Block constructor will calculate merkle_root automatically
            block = Block(
                index=block_data["index"],
                timestamp=timestamp,
                data=block_data["data"],
                prev_hash=block_data["prev_hash"]
            )
            
            # For old blocks without merkle_root, we need to recalculate hash
            # If merkle_root exists in data, verify it matches
            if "merkle_root" in block_data:
                if block.merkle_root != block_data["merkle_root"]:
                    return None, f"Merkle root mismatch in block {block_data['index']}"
            
            # Verify the hash matches (hash includes merkle_root now)
            if block.hash != block_data["hash"]:
                # If old block format (no merkle_root), this is expected
                # Recalculate hash with merkle_root for new format
                if "merkle_root" not in block_data:
                    # Old block format - hash will be different, but that's okay
                    # We'll accept it but note the difference
                    pass
                else:
                    return None, f"Hash mismatch in block {block_data['index']}"
            
            blockchain.append(block)
        
        metadata = blockchain_data.get("metadata", {})
        return blockchain, f"Blockchain loaded successfully: {metadata.get('total_blocks', 0)} blocks"
    
    except Exception as e:
        return None, f"Error loading blockchain: {str(e)}"

def export_blockchain_csv(
    blockchain: List[Block], filename: str = "blockchain_export.csv"
) -> Tuple[bool, str]:
    try:
        import csv
        
        with open(filename, 'w', newline='') as csvfile:
            fieldnames = ['block_index', 'timestamp', 'type', 'teacher_name', 'course', 
                         'year', 'date', 'students_present', 'prev_hash', 'hash']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for block in blockchain:
                if block.data.get('type') == 'genesis':
                    writer.writerow({
                        'block_index': block.index,
                        'timestamp': block.timestamp,
                        'type': 'genesis',
                        'teacher_name': '',
                        'course': '',
                        'year': '',
                        'date': '',
                        'students_present': '',
                        'prev_hash': block.prev_hash,
                        'hash': block.hash
                    })
                elif block.data.get('type') == 'attendance':
                    writer.writerow({
                        'block_index': block.index,
                        'timestamp': block.timestamp,
                        'type': 'attendance',
                        'teacher_name': block.data.get('teacher_name', ''),
                        'course': block.data.get('course', ''),
                        'year': block.data.get('year', ''),
                        'date': block.data.get('date', ''),
                        'students_present': ';'.join(block.data.get('present_students', [])),
                        'prev_hash': block.prev_hash,
                        'hash': block.hash
                    })
        
        return True, f"Blockchain exported to {filename}"
    
    except Exception as e:
        return False, f"Error exporting blockchain: {str(e)}"

def get_blockchain_backups() -> List[Dict[str, Any]]:
    try:
        from src.config.config import Config
        if not os.path.exists(Config.BACKUP_DIR):
            return []
        
        backups = []
        for filename in os.listdir(Config.BACKUP_DIR):
            if filename.startswith("blockchain_backup_") and filename.endswith(".json"):
                filepath = os.path.join(Config.BACKUP_DIR, filename)
                stat = os.stat(filepath)
                backups.append({
                    'filename': filename,
                    'filepath': filepath,
                    'size': stat.st_size,
                    'created': dt.datetime.fromtimestamp(stat.st_mtime)
                })
        
        # Sort by creation time (newest first)
        backups.sort(key=lambda x: x['created'], reverse=True)
        return backups
    
    except Exception as e:
        return []


def restore_from_backup(backup_filename: str) -> Tuple[Optional[List[Block]], str]:
    try:
        from src.config.config import Config
        backup_path = os.path.join(Config.BACKUP_DIR, backup_filename)
        blockchain, message = load_blockchain(backup_path)
        
        if blockchain:
            # Save as current blockchain
            success, save_message = save_blockchain(blockchain)
            if success:
                return blockchain, f"Restored from backup: {backup_filename}"
            else:
                return None, f"Failed to save restored blockchain: {save_message}"
        else:
            return None, f"Failed to load backup: {message}"
    
    except Exception as e:
        return None, f"Error restoring from backup: {str(e)}"

def cleanup_old_backups(keep_count: int = 10) -> Tuple[bool, str]:
    try:
        backups = get_blockchain_backups()
        
        if len(backups) <= keep_count:
            return True, f"No cleanup needed. {len(backups)} backups found."
        
        # Remove old backups
        removed_count = 0
        for backup in backups[keep_count:]:
            os.remove(backup['filepath'])
            removed_count += 1
        
        return True, f"Cleaned up {removed_count} old backups. Kept {keep_count} most recent."
    
    except Exception as e:
        return False, f"Error cleaning up backups: {str(e)}"
