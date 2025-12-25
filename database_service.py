from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
from sqlalchemy.exc import IntegrityError

from database import (
    db_service,
    BlockModel,
    UserModel,
    ClassroomModel,
    StudentModel,
)
from block import Block
import logging
from datetime import datetime

from classroom_models import Classroom, StudentProfile

logger = logging.getLogger(__name__)


class DatabaseBlockchainService:
    def __init__(self):
        self.db = db_service

    def get_all_blocks(self) -> List[Block]:
        session = self.db.get_session()
        try:
            block_models = session.query(BlockModel).order_by(BlockModel.index).all()
            blocks = []
            for bm in block_models:
                block = Block(
                    index=bm.index,
                    timestamp=bm.timestamp,
                    data=bm.data,
                    prev_hash=bm.prev_hash
                )
                # Note: merkle_root is calculated automatically in Block.__init__
                blocks.append(block)
            return blocks
        finally:
            session.close()

    def get_block_by_index(self, index: int) -> Optional[Block]:
        session = self.db.get_session()
        try:
            block_model = session.query(BlockModel).filter(BlockModel.index == index).first()
            if block_model:
                block = Block(
                    index=block_model.index,
                    timestamp=block_model.timestamp,
                    data=block_model.data,
                    prev_hash=block_model.prev_hash
                )
                # Note: merkle_root is calculated automatically in Block.__init__
                return block
            return None
        finally:
            session.close()

    def get_latest_block(self) -> Optional[Block]:
        session = self.db.get_session()
        try:
            block_model = session.query(BlockModel).order_by(desc(BlockModel.index)).first()
            if block_model:
                block = Block(
                    index=block_model.index,
                    timestamp=block_model.timestamp,
                    data=block_model.data,
                    prev_hash=block_model.prev_hash
                )
                # Note: merkle_root is calculated automatically in Block.__init__
                return block
            return None
        finally:
            session.close()

    def add_block(self, block: Block) -> Tuple[bool, str]:
        session = self.db.get_session()
        try:
            existing = session.query(BlockModel).filter(BlockModel.index == block.index).first()
            if existing:
                return False, f"Block with index {block.index} already exists"

            block_model = BlockModel(
                index=block.index,
                timestamp=block.timestamp,
                data=block.data,
                prev_hash=block.prev_hash,
                merkle_root=block.merkle_root,
                hash=block.hash
            )

            session.add(block_model)
            session.commit()
            logger.info(f"Block {block.index} added to database")
            return True, f"Block {block.index} added successfully"
        except Exception as e:
            session.rollback()
            logger.error(f"Error adding block to database: {str(e)}", exc_info=True)
            return False, f"Error adding block: {str(e)}"
        finally:
            session.close()

    def get_block_count(self) -> int:
        session = self.db.get_session()
        try:
            return session.query(BlockModel).count()
        finally:
            session.close()

    def get_attendance_blocks(self, page: int = 1, per_page: int = 10) -> Tuple[List[Dict[str, Any]], int]:
        session = self.db.get_session()
        try:
            query = session.query(BlockModel).filter(
                BlockModel.data['type'].astext == 'attendance'
            ).order_by(desc(BlockModel.index))

            total = query.count()
            offset = (page - 1) * per_page
            blocks = query.offset(offset).limit(per_page).all()

            records = []
            for block in blocks:
                if isinstance(block.data, dict) and block.data.get('type') == 'attendance':
                    records.append({
                        'block_index': block.index,
                        'timestamp': str(block.timestamp),
                        'teacher_name': block.data.get('teacher_name', ''),
                        'date': block.data.get('date', ''),
                        'course': block.data.get('course', ''),
                        'year': block.data.get('year', ''),
                        'present_students': block.data.get('present_students', []),
                        'student_count': len(block.data.get('present_students', []))
                    })

            return records, total
        finally:
            session.close()

    def search_attendance_records(
        self,
        teacher_name: Optional[str] = None,
        course: Optional[str] = None,
        year: Optional[str] = None,
        date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        session = self.db.get_session()
        try:
            query = session.query(BlockModel).filter(
                BlockModel.data['type'].astext == 'attendance'
            )

            if teacher_name:
                query = query.filter(BlockModel.data['teacher_name'].astext == teacher_name)
            if course:
                query = query.filter(BlockModel.data['course'].astext == course)
            if year:
                query = query.filter(BlockModel.data['year'].astext == year)
            if date:
                query = query.filter(BlockModel.data['date'].astext == date)

            blocks = query.order_by(desc(BlockModel.index)).all()

            records = []
            for block in blocks:
                if isinstance(block.data, dict) and block.data.get('type') == 'attendance':
                    records.append({
                        'block_index': block.index,
                        'timestamp': str(block.timestamp),
                        'teacher_name': block.data.get('teacher_name', ''),
                        'date': block.data.get('date', ''),
                        'course': block.data.get('course', ''),
                        'year': block.data.get('year', ''),
                        'present_students': block.data.get('present_students', []),
                        'student_count': len(block.data.get('present_students', []))
                    })

            return records
        finally:
            session.close()

    def clear_all_blocks(self) -> Tuple[bool, str]:
        session = self.db.get_session()
        try:
            session.query(BlockModel).delete()
            session.commit()
            logger.warning("All blocks cleared from database")
            return True, "All blocks cleared"
        except Exception as e:
            session.rollback()
            logger.error(f"Error clearing blocks: {str(e)}", exc_info=True)
            return False, f"Error clearing blocks: {str(e)}"
        finally:
            session.close()


class DatabaseUserService:
    def __init__(self):
        self.db = db_service

    def get_user_by_username(self, username: str) -> Optional[UserModel]:
        session = self.db.get_session()
        try:
            return session.query(UserModel).filter(UserModel.username == username).first()
        finally:
            session.close()


class DatabaseClassroomRepository:
    def __init__(self):
        self.db = db_service

    def list_classrooms(self) -> List[Classroom]:
        session = self.db.get_session()
        try:
            models = session.query(ClassroomModel).order_by(ClassroomModel.created_at.asc()).all()
            return [self._to_domain(model) for model in models]
        finally:
            session.close()

    def get_classroom(self, class_id: str) -> Optional[Classroom]:
        session = self.db.get_session()
        try:
            model = session.query(ClassroomModel).filter(ClassroomModel.id == class_id).first()
            return self._to_domain(model) if model else None
        finally:
            session.close()

    def get_classroom_by_name(self, name: str) -> Optional[Classroom]:
        if not name:
            return None
        session = self.db.get_session()
        try:
            model = (
                session.query(ClassroomModel)
                .filter(func.lower(ClassroomModel.name) == name.strip().lower())
                .first()
            )
            return self._to_domain(model) if model else None
        finally:
            session.close()

    def save_classroom(self, classroom: Classroom) -> Classroom:
        session = self.db.get_session()
        try:
            model = session.query(ClassroomModel).filter(ClassroomModel.id == classroom.id).first()
            if not model:
                model = ClassroomModel(
                    id=classroom.id,
                    name=classroom.name,
                    description=classroom.description,
                    expected_student_count=classroom.expected_student_count,
                    created_at=classroom.created_at,
                    updated_at=classroom.updated_at,
                )
                session.add(model)
            else:
                model.name = classroom.name
                model.description = classroom.description
                model.expected_student_count = classroom.expected_student_count
                model.updated_at = datetime.utcnow()

            # Replace student roster with provided list, if any
            if classroom.students:
                model.students.clear()
                for student in classroom.students:
                    model.students.append(
                        StudentModel(
                            classroom_id=classroom.id,
                            roll_number=student.roll_number,
                            name=student.name,
                        )
                    )

            session.commit()
            session.refresh(model)
            return self._to_domain(model)
        except IntegrityError as exc:
            session.rollback()
            raise ValueError(str(exc)) from exc
        finally:
            session.close()

    def add_students(self, class_id: str, students: List[StudentProfile]) -> Classroom:
        session = self.db.get_session()
        try:
            model = session.query(ClassroomModel).filter(ClassroomModel.id == class_id).first()
            if not model:
                raise ValueError(f"Classroom {class_id} not found")

            existing_rolls = {student.roll_number.strip().lower() for student in model.students}
            for student in students:
                normalized_roll = student.roll_number.strip().lower()
                if normalized_roll in existing_rolls:
                    raise ValueError(f"Roll number '{student.roll_number}' already exists in class")
                existing_rolls.add(normalized_roll)
                model.students.append(
                    StudentModel(
                        classroom_id=class_id,
                        roll_number=student.roll_number,
                        name=student.name,
                    )
                )
            model.updated_at = datetime.utcnow()
            session.commit()
            session.refresh(model)
            return self._to_domain(model)
        except IntegrityError as exc:
            session.rollback()
            raise ValueError(str(exc)) from exc
        finally:
            session.close()

    def _to_domain(self, model: Optional[ClassroomModel]) -> Optional[Classroom]:
        if not model:
            return None
        return Classroom(
            id=model.id,
            name=model.name,
            description=model.description or "",
            expected_student_count=model.expected_student_count or 0,
            students=[
                StudentProfile(
                    roll_number=student.roll_number,
                    name=student.name,
                )
                for student in sorted(model.students, key=lambda s: s.roll_number)
            ],
            created_at=model.created_at or datetime.utcnow(),
            updated_at=model.updated_at or datetime.utcnow(),
        )

    def create_user(
        self,
        username: str,
        password_hash: str,
        role: str = 'teacher',
        email: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        session = self.db.get_session()
        try:
            existing = self.get_user_by_username(username)
            if existing:
                return False, "Username already exists"

            user = UserModel(
                username=username,
                password_hash=password_hash,
                role=role,
                email=email
            )

            session.add(user)
            session.commit()
            logger.info(f"User {username} created in database")
            return True, None
        except Exception as e:
            session.rollback()
            logger.error(f"Error creating user: {str(e)}", exc_info=True)
            return False, f"Error creating user: {str(e)}"
        finally:
            session.close()

    def update_user(self, username: str, **kwargs) -> Tuple[bool, Optional[str]]:
        session = self.db.get_session()
        try:
            user = self.get_user_by_username(username)
            if not user:
                return False, "User not found"

            for key, value in kwargs.items():
                if hasattr(user, key):
                    setattr(user, key, value)

            user.updated_at = datetime.utcnow()
            session.commit()
            logger.info(f"User {username} updated")
            return True, None
        except Exception as e:
            session.rollback()
            logger.error(f"Error updating user: {str(e)}", exc_info=True)
            return False, f"Error updating user: {str(e)}"
        finally:
            session.close()

    def get_all_users(self) -> List[UserModel]:
        session = self.db.get_session()
        try:
            return session.query(UserModel).all()
        finally:
            session.close()

