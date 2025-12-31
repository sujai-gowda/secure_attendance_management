from src.blockchain.block import Block
import datetime as dt
import copy
from typing import List, Dict, Any


def next_block(last_block: Block, data: Dict[str, Any]) -> Block:
    if not last_block:
        raise ValueError("Previous block cannot be None")

    this_index = last_block.index + 1
    this_timestamp = dt.datetime.now()
    this_data = copy.deepcopy(data)
    this_prev_hash = last_block.hash
    return Block(this_index, this_timestamp, this_data, this_prev_hash)


def add_block(
    form: Dict[str, Any], data: List[str], blockchain: List[Block]
) -> str:
    try:
        attendance_data = {
            "type": "attendance",
            "teacher_name": data[0] if len(data) > 0 else "",
            "date": data[1] if len(data) > 1 else "",
            "course": data[2] if len(data) > 2 else "",
            "year": data[3] if len(data) > 3 else "",
            "present_students": []
        }

        i = 1
        while form.get(f"roll_no{i}"):
            roll_no = form.get(f"roll_no{i}", "").strip()
            if roll_no:
                attendance_data["present_students"].append(roll_no)
            i += 1

        if not attendance_data["present_students"]:
            return "Error: No students marked present!"

        previous_block = blockchain[-1]
        block_to_add = next_block(previous_block, attendance_data)

        if not block_to_add.is_valid():
            return "Error: Invalid block created!"

        blockchain.append(block_to_add)

        return (
            f"Block #{block_to_add.index} has been added to the blockchain! "
            f"{len(attendance_data['present_students'])} students marked present."
        )

    except Exception as e:
        return f"Error adding block: {str(e)}"
