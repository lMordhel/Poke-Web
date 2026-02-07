from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from bson import ObjectId

from .. import models
from ..db import db

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=models.ProductList)
async def get_products(
    type: Optional[str] = Query(None, description="Filter by product type"),
    search: Optional[str] = Query(None, description="Search by product name"),
    skip: int = Query(0, ge=0, description="Number of products to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of products to return")
):
    """
    Get all products with optional filtering and pagination
    """
    products_collection = db.products
    
    # Build filter query
    filter_query = {}
    
    if type:
        filter_query["type"] = type
    
    if search:
        filter_query["name"] = {"$regex": search, "$options": "i"}
    
    # Get total count
    total = await products_collection.count_documents(filter_query)
    
    # Get products with pagination
    products_cursor = products_collection.find(filter_query).skip(skip).limit(limit)
    products_list = []
    
    async for product in products_cursor:
        product_dict = dict(product)
        product_dict["id"] = str(product_dict.pop("_id"))
        products_list.append(models.ProductOut(**product_dict))
    
    return models.ProductList(products=products_list, total=total)

@router.get("/{product_id}", response_model=models.ProductOut)
async def get_product(product_id: str):
    """
    Get a single product by ID
    """
    products_collection = db.products
    
    try:
        product_id_obj = ObjectId(product_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid product ID format")
    
    product = await products_collection.find_one({"_id": product_id_obj})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product_dict = dict(product)
    product_dict["id"] = str(product_dict.pop("_id"))
    
    return models.ProductOut(**product_dict)

@router.get("/types/list")
async def get_product_types():
    """
    Get all available product types
    """
    products_collection = db.products
    
    types = await products_collection.distinct("type")
    
    return {"types": ["Todos"] + types}

@router.post("/", response_model=models.ProductOut, status_code=201)
async def create_product(product: models.ProductCreate):
    """
    Create a new product (admin only)
    """
    products_collection = db.products
    
    # Check if product with same name already exists
    existing = await products_collection.find_one({"name": product.name})
    if existing:
        raise HTTPException(status_code=409, detail="Product with this name already exists")
    
    # Insert new product
    product_dict = product.model_dump()
    result = await products_collection.insert_one(product_dict)
    
    # Return created product
    product_dict["id"] = str(result.inserted_id)
    product_dict.pop("_id", None)
    
    return models.ProductOut(**product_dict)