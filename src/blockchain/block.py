import hashlib
import json
from typing import Any, Dict, Optional
from datetime import datetime
from src.blockchain.merkle_tree import calculate_merkle_root


class Block:
    def __init__(
        self, index: int, timestamp: datetime, data: Dict[str, Any], prev_hash: str
    ) -> None:
        self.index: int = index
        self.timestamp: datetime = timestamp
        self.data: Dict[str, Any] = data
        self.prev_hash: str = prev_hash
        self.merkle_root: Optional[str] = self._calculate_merkle_root()
        self.hash: str = self.hash_block()

    def _calculate_merkle_root(self) -> Optional[str]:
        """
        Calculate Merkle root from present_students in block data
        Returns None if no students or not an attendance block
        """
        if not self.data or self.data.get('type') != 'attendance':
            return None
        
        present_students = self.data.get('present_students', [])
        if not present_students:
            return None
        
        return calculate_merkle_root(present_students, self.timestamp)

    def hash_block(self) -> str:
        """
        Calculate block hash including Merkle root
        Hash includes: index + timestamp + data + prev_hash + merkle_root
        """
        data_string = json.dumps(self.data, sort_keys=True) if self.data else ""
        merkle_str = self.merkle_root if self.merkle_root else ""
        block_string = f"{self.index}{self.timestamp}{data_string}{self.prev_hash}{merkle_str}"
        sha = hashlib.sha256()
        sha.update(block_string.encode('utf-8'))
        return sha.hexdigest()

    def __str__(self) -> str:
        return f"Block #{self.index} [Hash: {self.hash[:10]}...]"

    def __repr__(self) -> str:
        return f"Block(index={self.index}, timestamp={self.timestamp}, hash={self.hash[:10]}...)"

    def to_dict(self) -> Dict[str, Any]:
        return {
            'index': self.index,
            'timestamp': str(self.timestamp),
            'data': self.data,
            'prev_hash': self.prev_hash,
            'merkle_root': self.merkle_root,
            'hash': self.hash
        }

    def is_valid(self) -> bool:
        """
        Validate block by checking:
        1. Hash matches calculated hash (includes merkle_root)
        2. Merkle root is valid if present
        """
        # Recalculate hash to verify
        calculated_hash = self.hash_block()
        if self.hash != calculated_hash:
            return False
        
        # Verify merkle root if present
        if self.merkle_root:
            present_students = self.data.get('present_students', []) if isinstance(self.data, dict) else []
            if present_students:
                expected_merkle = calculate_merkle_root(present_students, self.timestamp)
                if self.merkle_root != expected_merkle:
                    return False
        
        return True
