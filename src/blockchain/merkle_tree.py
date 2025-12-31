import hashlib
from typing import List, Optional
from datetime import datetime


def hash_data(data: str) -> str:
    """Hash a single piece of data using SHA-256"""
    sha = hashlib.sha256()
    sha.update(data.encode('utf-8'))
    return sha.hexdigest()


def build_merkle_tree(leaves: List[str]) -> Optional[str]:
    """
    Build a Merkle tree from a list of leaf nodes (hashed student records)
    Returns the Merkle root hash
    
    Args:
        leaves: List of hashed student records
        
    Returns:
        Merkle root hash, or None if leaves is empty
    """
    if not leaves:
        return None
    
    if len(leaves) == 1:
        return leaves[0]
    
    # If odd number of leaves, duplicate the last one
    if len(leaves) % 2 == 1:
        leaves.append(leaves[-1])
    
    # Build next level by pairing leaves
    next_level = []
    for i in range(0, len(leaves), 2):
        # Concatenate and hash pairs
        combined = leaves[i] + leaves[i + 1]
        next_level.append(hash_data(combined))
    
    # Recursively build the tree
    return build_merkle_tree(next_level)


def hash_student_with_timestamp(student_id: str, timestamp: datetime) -> str:
    """
    Hash a student ID with a timestamp to create a unique leaf node
    
    Args:
        student_id: Student identifier (e.g., "CHEM-2021-01")
        timestamp: Block timestamp
        
    Returns:
        Hashed student record
    """
    # Combine student ID with timestamp string
    data = f"{student_id}:{timestamp.isoformat()}"
    return hash_data(data)


def calculate_merkle_root(present_students: List[str], block_timestamp: datetime) -> Optional[str]:
    """
    Calculate Merkle root from list of present students
    
    Args:
        present_students: List of student IDs
        block_timestamp: Timestamp of the block
        
    Returns:
        Merkle root hash, or None if no students
    """
    if not present_students:
        return None
    
    # Hash each student ID with the block timestamp
    hashed_students = [
        hash_student_with_timestamp(student_id, block_timestamp)
        for student_id in present_students
    ]
    
    # Build Merkle tree from hashed students
    return build_merkle_tree(hashed_students)


def verify_merkle_proof(leaf: str, proof: List[str], root: str) -> bool:
    """
    Verify a Merkle proof (not currently used, but useful for future features)
    
    Args:
        leaf: The leaf node to verify
        proof: List of sibling hashes along the path to root
        root: The Merkle root to verify against
        
    Returns:
        True if proof is valid, False otherwise
    """
    current_hash = leaf
    
    for sibling in proof:
        # Determine if sibling is left or right (simplified - would need position info)
        combined = current_hash + sibling
        current_hash = hash_data(combined)
    
    return current_hash == root

