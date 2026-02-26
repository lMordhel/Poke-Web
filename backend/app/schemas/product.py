from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List

class ProductVariant(BaseModel):
    size: str
    price: float = Field(ge=0)
    stock: int = Field(default=0, ge=0)

class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(default="")
    
    # Old fields marked as Optional for backward compatibility with existing data
    price: Optional[float] = Field(None, ge=0)
    stock: Optional[int] = Field(None, ge=0)
    
    # New variants array
    variants: List[ProductVariant] = Field(default_factory=list)
    
    type: str
    image_url: str
    images: List[str] = Field(default_factory=list)
    short_description: Optional[str] = None
    long_description: Optional[str] = None
    description: Optional[str] = None
    is_new: bool = False
    featured: bool = False
    sold_count: int = Field(default=0, ge=0)

class ProductCreate(ProductBase):
    slug: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    stock: Optional[int] = Field(None, ge=0)
    variants: Optional[List[ProductVariant]] = None
    type: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    short_description: Optional[str] = None
    long_description: Optional[str] = None
    description: Optional[str] = None
    is_new: Optional[bool] = None
    featured: Optional[bool] = None
    sold_count: Optional[int] = Field(None, ge=0)

class ProductOut(ProductBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

class ProductList(BaseModel):
    products: List[ProductOut]
    total: int
