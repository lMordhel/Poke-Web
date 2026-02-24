from fastapi import APIRouter, HTTPException, Query, Depends, UploadFile, File
from typing import Optional, List
import os
import shutil
import uuid
from bson import ObjectId
from app.db import db
from app.core.security import get_current_admin_user
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
async def create_product(
    product: ProductCreate,
    current_admin: dict = Depends(get_current_admin_user)
):
    """
    Crea un nuevo producto. Solo administradores.
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

@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    product: ProductCreate,
    current_admin: dict = Depends(get_current_admin_user)
):
    """
    Actualiza completamente un producto. Solo administradores.
    """
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    product_dict = product.model_dump()
    
    # Update Document in MongoDB
    result = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": product_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
        
    product_dict["id"] = product_id
    return product_dict

@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """
    Elimina un producto. Solo administradores.
    """
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return None

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

@router.post("/upload-image", status_code=201)
async def upload_product_image(
    file: UploadFile = File(...),
    current_admin: dict = Depends(get_current_admin_user)
):
    """
    Sube una imagen al servidor en la carpeta estática "uploads/".
    Devuelve la URL pública para ser usada en el frontend.
    Solo administradores.
    """
    # Validaciones básicas de tipo
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")
        
    # Crear directorio si no existe por algún motivo
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generar un nombre seguro y único usando UUID
    extension = file.filename.split(".")[-1]
    secure_filename = f"{uuid.uuid4().hex}.{extension}"
    file_path = os.path.join(upload_dir, secure_filename)
    
    # Guardar en disco local de forma binaria
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(500, f"Error saving file: {e}")
        
    # Retornar la URL estática (ej: http://localhost:8000/uploads/uuid.png)
    # Como Vite ya tiene un proxy o el .env la base_url, retornamos solo la ruta relativa absoluta
    image_url = f"http://localhost:8000/uploads/{secure_filename}"
    
    return {"url": image_url}
