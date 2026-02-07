from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List

class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    price: float = Field(ge=0)
    type: str
    image_url: str
    description: Optional[str] = None
    is_new: bool = False
    stock: int = Field(default=100, ge=0)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, ge=0)
    type: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    is_new: Optional[bool] = None
    stock: Optional[int] = Field(None, ge=0)

class ProductOut(ProductBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

class ProductList(BaseModel):
    products: List[ProductOut]
    total: int
