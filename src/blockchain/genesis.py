import datetime as dt
from typing import List
from src.blockchain.block import Block


def create_genesis_block() -> Block:
    genesis_data = {
        "type": "genesis",
        "message": "Genesis Block - Blockchain Initialized",
        "creator": "Blockendance System"
    }
    return Block(0, dt.datetime.now(), genesis_data, "0")


def create_blockchain() -> List[Block]:
    return [create_genesis_block()]
