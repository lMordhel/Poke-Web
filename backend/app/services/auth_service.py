from datetime import datetime, timezone
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.schemas.token import Token
from app.core.security import (
    ACCESS_TOKEN_TYPE,
    REFRESH_TOKEN_TYPE,
    hash_password,
    verify_password,
    create_token,
)
from app.core.config import settings

EMAIL_ALREADY_EXISTS = "Email already exists"
INVALID_REFRESH_TOKEN = "Invalid refresh token"


def _email_conflict() -> HTTPException:
    """Single source for the duplicate-email response (S10)."""
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=EMAIL_ALREADY_EXISTS
    )


class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()

    async def register_user(self, payload: UserCreate) -> UserOut:
        existing = await self.user_repo.get_by_email(payload.email)
        if existing:
            raise _email_conflict()
        
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
            
        try:
            created_user = await self.user_repo.create(user_data)
        except DuplicateKeyError as duplicate:
            # A concurrent registration passed the pre-check above and inserted
            # first; the unique index on users.email rejected this insert (S10).
            raise _email_conflict() from duplicate

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
        
        access_token = create_token(user_id, settings.access_token_expires_min, ACCESS_TOKEN_TYPE)
        refresh_token = create_token(user_id, settings.refresh_token_expires_min, REFRESH_TOKEN_TYPE)
        
        return Token(access_token=access_token, refresh_token=refresh_token)

    async def refresh_user_token(self, user_id: str) -> Token:
        """Acuña tokens nuevos solo para una cuenta que siga existiendo y activa (S13)."""
        user = await self.user_repo.get_by_id(user_id)
        if user is None or not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=INVALID_REFRESH_TOKEN,
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_token(user_id, settings.access_token_expires_min, ACCESS_TOKEN_TYPE)
        refresh_token = create_token(user_id, settings.refresh_token_expires_min, REFRESH_TOKEN_TYPE)
        return Token(access_token=access_token, refresh_token=refresh_token)
