import jwt
import bcrypt
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from functools import wraps
from flask import request, jsonify, g
import logging

from config import Config

logger = logging.getLogger(__name__)

JWT_SECRET = Config.SECRET_KEY
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

ROLES = {
    "ADMIN": "admin",
    "TEACHER": "teacher",
    "STUDENT": "student",
    "VIEWER": "viewer",
}

PERMISSIONS = {
    "admin": ["read", "write", "delete", "manage_users"],
    "teacher": ["read", "write"],
    "student": ["read"],
    "viewer": ["read"],
}


class AuthService:
    def __init__(self):
        self.users: Dict[str, Dict[str, Any]] = {}
        self._initialize_default_users()

    def _initialize_default_users(self) -> None:
        default_password = "admin123"
        password_hash = self._hash_password(default_password)
        
        self.users["admin"] = {
            "username": "admin",
            "password_hash": password_hash,
            "role": ROLES["ADMIN"],
            "email": "admin@blockendance.com",
            "created_at": datetime.now().isoformat(),
        }
        
        logger.warning(
            "Default admin user created. Username: admin, Password: admin123. "
            "Please change this in production!"
        )

    def _hash_password(self, password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def _verify_password(self, password: str, password_hash: str) -> bool:
        try:
            if password_hash.startswith('$2b$') or password_hash.startswith('$2a$'):
                return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
            else:
                import hashlib
                legacy_hash = hashlib.sha256(password.encode()).hexdigest()
                if legacy_hash == password_hash:
                    return True
                return False
        except Exception as e:
            logger.error(f"Error verifying password: {str(e)}")
            return False

    def create_user(
        self, username: str, password: str, role: str = ROLES["TEACHER"], email: Optional[str] = None
    ) -> tuple[bool, Optional[str]]:
        if username in self.users:
            return False, "Username already exists"
        
        if role not in ROLES.values():
            return False, "Invalid role"
        
        password_hash = self._hash_password(password)
        
        self.users[username] = {
            "username": username,
            "password_hash": password_hash,
            "role": role,
            "email": email or f"{username}@blockendance.com",
            "created_at": datetime.now().isoformat(),
        }
        
        logger.info(f"User created: {username} with role {role}")
        return True, None

    def authenticate(self, username: str, password: str) -> tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        if username not in self.users:
            return False, "Invalid credentials", None
        
        user = self.users[username]
        
        if not self._verify_password(password, user["password_hash"]):
            return False, "Invalid credentials", None
        
        if not user["password_hash"].startswith('$2b$') and not user["password_hash"].startswith('$2a$'):
            new_hash = self._hash_password(password)
            user["password_hash"] = new_hash
            logger.info(f"Migrated password hash for user {username} to bcrypt")
        
        token = self.generate_token(username, user["role"])
        return True, None, {"token": token, "user": {"username": username, "role": user["role"]}}

    def generate_token(self, username: str, role: str, expiration_hours: Optional[int] = None) -> str:
        exp_hours = expiration_hours or JWT_EXPIRATION_HOURS
        payload = {
            "username": username,
            "role": role,
            "exp": datetime.utcnow() + timedelta(hours=exp_hours),
            "iat": datetime.utcnow(),
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    def refresh_token(self, token: str) -> tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], options={"verify_exp": False})
            username = payload.get("username")
            
            if username not in self.users:
                return False, "User not found", None
            
            user = self.users[username]
            new_token = self.generate_token(username, user["role"])
            
            return True, None, {
                "token": new_token,
                "user": {"username": username, "role": user["role"]},
                "expires_in": JWT_EXPIRATION_HOURS * 3600
            }
        except jwt.InvalidTokenError:
            return False, "Invalid token", None
        except Exception as e:
            logger.error(f"Error refreshing token: {str(e)}")
            return False, "Token refresh failed", None

    def verify_token(self, token: str) -> tuple[bool, Optional[Dict[str, Any]]]:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            username = payload.get("username")
            
            if username not in self.users:
                return False, None
            
            user = self.users[username]
            return True, {
                "username": username,
                "role": user["role"],
                "permissions": PERMISSIONS.get(user["role"], []),
            }
        except jwt.ExpiredSignatureError:
            return False, None
        except jwt.InvalidTokenError:
            return False, None

    def has_permission(self, user_info: Dict[str, Any], required_permission: str) -> bool:
        user_permissions = user_info.get("permissions", [])
        return required_permission in user_permissions

    def require_auth(self, required_permission: Optional[str] = None):
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                auth_header = request.headers.get("Authorization")
                
                if not auth_header:
                    return jsonify({"error": "Authorization header missing"}), 401
                
                try:
                    token = auth_header.split(" ")[1]
                except IndexError:
                    return jsonify({"error": "Invalid authorization header format"}), 401
                
                is_valid, user_info = self.verify_token(token)
                
                if not is_valid or not user_info:
                    return jsonify({"error": "Invalid or expired token"}), 401
                
                if required_permission:
                    if not self.has_permission(user_info, required_permission):
                        return jsonify({"error": "Insufficient permissions"}), 403
                
                g.current_user = user_info
                return f(*args, **kwargs)
            
            return decorated_function
        return decorator

    def get_current_user(self) -> Optional[Dict[str, Any]]:
        return getattr(g, "current_user", None)


auth_service = AuthService()

