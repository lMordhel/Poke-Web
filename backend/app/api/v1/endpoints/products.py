from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from bson import ObjectId
from app.db import db
from app.schemas.product import ProductCreate, ProductList, ProductOut

# --- Endpoints de Productos (API REST clásica) ---
# Maneja CRUD: Create, Read, Update, Delete
# En este caso: List, Detail, Create

router = APIRouter()

@router.get("/", response_model=ProductList)
async def read_products(
    # Parámetros Query (?type=Fire&search=Pika...)
    type: Optional[str] = Query(None, description="Filtro por tipo de producto (ej: Fuego, Agua)"),
    search: Optional[str] = Query(None, description="Búsqueda parcial por nombre"),
    # Paginación básica
    skip: int = Query(0, ge=0, description="Número de registros a saltar (offset)"),
    limit: int = Query(50, ge=1, le=100, description="Máximo de registros a devolver (limit)")
):
    """
    Lista productos con filtrado, búsqueda y paginación.
    
    Uso: GET /api/v1/products?type=Fire&limit=10
    """
    
    # Construcción de la consulta MongoDB (Query object)
    query = {}
    
    if type:
        # Filtro exacto: type == "Fire"
        query["type"] = type
        
    if search:
        # Filtro regex: Contiene 'search' (insensible a mayúsculas/minúsculas)
        # $options: "i" hace la búsqueda case-insensitive
        query["name"] = {"$regex": search, "$options": "i"}
        
    # Ejecutamos dos consultas:
    # 1. Total de documentos para saber cuántas páginas hay (count_documents)
    total = await db.products.count_documents(query)
    
    # 2. Los datos paginados (find + skip + limit)
    cursor = db.products.find(query).skip(skip).limit(limit)
    
    products = []
    
    # Iteramos asíncronamente sobre el cursor de MongoDB
    async for doc in cursor:
        # Transformamos _id (ObjectId) a id (str) para Pydantic
        doc["id"] = str(doc.pop("_id"))
        products.append(doc)
        
    return ProductList(products=products, total=total)

@router.get("/{product_id}", response_model=ProductOut)
async def read_product(product_id: str):
    """
    Obtiene el detalle de un solo producto por su ID.
    Uso: GET /api/v1/products/65cde...
    """
    
    # Validamos formato ObjectId antes de consultar para evitar errores raros de BSON
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    # Buscamos por _id
    doc = await db.products.find_one({"_id": ObjectId(product_id)})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
        
    doc["id"] = str(doc.pop("_id"))
    return doc

@router.post("/", response_model=ProductOut, status_code=201)
async def create_product(product: ProductCreate):
    """
    Crea un nuevo producto. (Endpoints como este deberían protegerse con autenticación en el futuro).
    """
    
    # Verificar duplicados por nombre
    existing = await db.products.find_one({"name": product.name})
    if existing:
        raise HTTPException(status_code=409, detail="Product already exists")
        
    # Convertimos modelo Pydantic a diccionario para insertar en Mongo
    product_dict = product.model_dump()
    
    # Insertamos
    result = await db.products.insert_one(product_dict)
    
    # Construimos la respuesta con el ID generado
    product_dict["id"] = str(result.inserted_id)
    return product_dict

@router.get("/types/list")
async def get_product_types():
    """
    Retorna una lista única de todos los tipos de productos disponibles en la DB.
    Útil para llenar dropdowns o filtros en el frontend.
    """
    # distinct() es muy eficiente en Mongo para esto
    types = await db.products.distinct("type")
    
    # Agregamos "Todos" como opción por defecto para la UI
    return {"types": ["Todos"] + types}
