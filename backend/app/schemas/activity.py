from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone

class ActivityCreate(BaseModel):
    type: str
    title: str
    description: str

class ActivityOut(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    description: str
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)
