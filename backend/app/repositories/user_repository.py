from typing import Optional
from app.schemas.user import UserCreate
from app.db import db
from datetime import datetime, timezone

class UserRepository:
    def __init__(self):
        self.collection = db.users

    async def get_by_email(self, email: str) -> Optional[dict]:
        return await self.collection.find_one({"email": email})

    async def create(self, user_data: dict) -> dict:
        result = await self.collection.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        return user_data

    async def update(self, user_id: str, update_data: dict) -> bool:
        pass # To implement later
