from typing import List, Dict, Any, Optional, Tuple
from block import Block


def check_integrity(chain: List[Block]) -> str:
    if not chain:
        return "Error: Empty blockchain"

    if len(chain) == 1:
        genesis = chain[0]
        if genesis.is_valid() and genesis.index == 0:
            return "Blockchain integrity verified: Only genesis block present"
        else:
            return "Error: Invalid genesis block"

    for i, block in enumerate(chain):
        if not block.is_valid():
            return f"Error: Block #{i} has invalid hash"

        # Verify Merkle root if present
        if block.merkle_root:
            from merkle_tree import calculate_merkle_root
            present_students = block.data.get('present_students', []) if isinstance(block.data, dict) else []
            if present_students:
                expected_merkle = calculate_merkle_root(present_students, block.timestamp)
                if block.merkle_root != expected_merkle:
                    return f"Error: Block #{i} has invalid Merkle root"

        if i > 0:
            previous_block = chain[i-1]
            if block.prev_hash != previous_block.hash:
                return f"Error: Block #{i} is not properly linked to previous block #{i-1}"

            if block.index != previous_block.index + 1:
                return (
                    f"Error: Block #{i} has incorrect index. "
                    f"Expected {previous_block.index + 1}, got {block.index}"
                )

    return f"Blockchain integrity verified: All {len(chain)} blocks are valid and properly linked (with Merkle tree validation)"


def validate_block(
    block: Optional[Block], previous_block: Optional[Block] = None
) -> Tuple[bool, str]:
    if not block:
        return False, "Block is None"

    if not block.is_valid():
        return False, "Block hash is invalid"

    # Validate Merkle root if present
    if block.merkle_root:
        from merkle_tree import calculate_merkle_root
        present_students = block.data.get('present_students', []) if isinstance(block.data, dict) else []
        if present_students:
            expected_merkle = calculate_merkle_root(present_students, block.timestamp)
            if block.merkle_root != expected_merkle:
                return False, "Block has invalid Merkle root"

    if previous_block:
        if block.prev_hash != previous_block.hash:
            return False, "Block is not properly linked to previous block"
        if block.index != previous_block.index + 1:
            return False, "Block index is incorrect"

    return True, "Block is valid"


def get_blockchain_stats(chain: List[Block]) -> Dict[str, Any]:
    if not chain:
        return {"error": "Empty blockchain"}

    stats: Dict[str, Any] = {
        "total_blocks": len(chain),
        "genesis_block": chain[0].to_dict() if chain else None,
        "latest_block": chain[-1].to_dict() if chain else None,
        "attendance_blocks": 0,
        "total_attendance_records": 0
    }

    for block in chain:
        if (
            block.index > 0
            and isinstance(block.data, dict)
            and block.data.get("type") == "attendance"
        ):
            stats["attendance_blocks"] += 1
            stats["total_attendance_records"] += len(
                block.data.get("present_students", [])
            )

    return stats
