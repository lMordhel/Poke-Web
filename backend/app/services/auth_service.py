from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.schemas.token import Token
from app.core.security import hash_password, verify_password, create_token
from app.core.config import settings

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()

    async def register_user(self, payload: UserCreate) -> UserOut:
        existing = await self.user_repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists"
            )
        
        hashed = hash_password(payload.password)
        user_data = {
            "email": payload.email,
            "password": hashed,
            "created_at": datetime.now(timezone.utc),
            "is_active": True,
            "token_version": 0,
            "role": "user"
        }
        if payload.name:
            user_data["name"] = payload.name
            
        created_user = await self.user_repo.create(user_data)
        
        return UserOut(
            id=str(created_user["_id"]),
            email=payload.email,
            name=payload.name,
            role="user"
        )

    async def authenticate_user(self, payload: UserLogin) -> Token:
        user = await self.user_repo.get_by_email(payload.email)
        
        if not user or not verify_password(payload.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if not user.get("is_active", True):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
            
        user_id = str(user["_id"])
        
        access_token = create_token(user_id, settings.access_token_expires_min)
        refresh_token = create_token(user_id, settings.refresh_token_expires_min)
        
        return Token(access_token=access_token, refresh_token=refresh_token)

    def refresh_user_token(self, user_id: str) -> Token:
        access_token = create_token(user_id, settings.access_token_expires_min)
        refresh_token = create_token(user_id, settings.refresh_token_expires_min)
        return Token(access_token=access_token, refresh_token=refresh_token)
