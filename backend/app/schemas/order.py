from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
from datetime import datetime, timezone

class OrderItem(BaseModel):
    id: str = Field(description="Product ID")
    name: str
    price: float
    quantity: int
    type: str
    img: str
    size: Optional[str] = None

class OrderCreate(BaseModel):
    items: List[OrderItem] = Field(..., min_length=1, description="Cart items cannot be empty")
    total: float = Field(..., ge=0)

class OrderOut(BaseModel):
    id: str
    user_id: str
    items: List[OrderItem]
    total: float
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
