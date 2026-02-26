from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from typing import List
from bson import ObjectId
from app.db import db
from app.core.security import get_current_user
from app.schemas.activity import ActivityCreate, ActivityOut

router = APIRouter()

@router.post("/", response_model=ActivityOut, status_code=201)
async def log_activity(payload: ActivityCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    activity_data = payload.model_dump()
    activity_data["user_id"] = user_id
    activity_data["timestamp"] = datetime.now(timezone.utc)
    
    result = await db.activities.insert_one(activity_data)
    
    return ActivityOut(id=str(result.inserted_id), **activity_data)

@router.get("/user", response_model=List[ActivityOut])
async def get_user_activity(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Cap to 20 to match previous localStorage limit behavior
    cursor = db.activities.find({"user_id": user_id}).sort("timestamp", -1).limit(20)
    activities = await cursor.to_list(length=20)
    
    return [ActivityOut(id=str(a.pop("_id")), **a) for a in activities]
