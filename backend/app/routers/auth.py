# Importaciones necesarias para el enrutador de autenticación
from datetime import datetime  # Para manejo de fechas
from fastapi import APIRouter, HTTPException, Depends, status  # Componentes FastAPI
from .. import models  # Modelos de datos Pydantic
from ..db import db  # Conexión a la base de datos
from ..security import hash_password, verify_password, create_token, get_current_user  # Funciones de seguridad
from ..config import settings  # Configuración de la aplicación

# Crear enrutador con prefijo y etiquetas para la documentación
router = APIRouter(prefix="/auth", tags=["auth"])

# ============================================================================
# ENDPOINTS DE AUTENTICACIÓN
# ============================================================================

@router.post("/register", response_model=models.UserOut, status_code=201)
async def register(payload: models.UserCreate):
    """
    Endpoint para registrar un nuevo usuario en el sistema.
    
    Proceso de registro:
    1. Verificar que el email no exista previamente
    2. Hashear la contraseña de forma segura
    3. Guardar el usuario en la base de datos
    4. Retornar los datos del usuario (sin contraseña)
    
    Args:
        payload (models.UserCreate): Datos del nuevo usuario
        
    Returns:
        models.UserOut: Datos del usuario creado
        
    Raises:
        HTTPException: Si el email ya existe (409)
    """
    # Obtener colección de usuarios
    users = db.users
    
    # Verificar si el email ya está registrado
    existing_user = await users.find_one({"email": payload.email})
    if existing_user:
        raise HTTPException(
            status_code=409, 
            detail="Email ya existe"
        )
    
    # Hashear la contraseña de forma segura
    hashed_password = hash_password(payload.password)
    
    # Preparar datos del usuario para insertar
    user_data = {
        "email": payload.email, 
        "password": hashed_password,
        "created_at": datetime.utcnow(),  # Fecha de creación
        "is_active": True,  # Usuario activo por defecto
        "token_version": 0  # Versión para invalidación de tokens
    }
    
    # Agregar nombre si fue proporcionado
    if payload.name:
        user_data["name"] = payload.name
    
    # Insertar nuevo usuario en la base de datos
    result = await users.insert_one(user_data)
    
    # Retornar datos del usuario (sin contraseña)
    return models.UserOut(
        id=str(result.inserted_id), 
        email=payload.email, 
        name=payload.name
    )

@router.post("/login", response_model=models.Token)
async def login(payload: models.UserLogin):
    """
    Endpoint para iniciar sesión y obtener tokens JWT.
    
    Proceso de login:
    1. Buscar el usuario por email
    2. Verificar la contraseña proporcionada
    3. Generar tokens de acceso y actualización
    4. Retornar los tokens para su uso en solicitudes futuras
    
    Args:
        payload (models.UserLogin): Credenciales del usuario
        
    Returns:
        models.Token: Tokens de acceso y actualización
        
    Raises:
        HTTPException: Si las credenciales son inválidas (401)
    """
    # Obtener colección de usuarios
    users = db.users
    
    # Buscar usuario por email
    user = await users.find_one({"email": payload.email})
    
    # Verificar que el usuario existe y la contraseña es correcta
    if not user or not verify_password(payload.password, user["password"]):
        raise HTTPException(
            status_code=401, 
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verificar que el usuario esté activo
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=401, 
            detail="Usuario desactivado"
        )
    
    # Crear tokens JWT
    user_id = str(user["_id"])
    access_token = create_token(user_id, settings.access_token_expires_min)
    refresh_token = create_token(user_id, settings.refresh_token_expires_min)
    
    # Retornar ambos tokens
    return models.Token(
        access_token=access_token, 
        refresh_token=refresh_token
    )

@router.get("/me", response_model=models.UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Endpoint protegido para obtener los datos del usuario autenticado.
    
    Requiere un token JWT válido en el header Authorization:
    Authorization: Bearer <access_token>
    
    Args:
        current_user (dict): Usuario obtenido de la dependencia get_current_user
        
    Returns:
        models.UserOut: Datos del usuario autenticado
    """
    return current_user

@router.post("/refresh", response_model=models.Token)
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """
    Endpoint para actualizar el token de acceso usando el token de actualización.
    
    Este endpoint permite generar un nuevo access_token sin requerir
    que el usuario vuelva a introducir sus credenciales.
    
    Args:
        current_user (dict): Usuario obtenido del token de actualización
        
    Returns:
        models.Token: Nuevo par de tokens
    """
    user_id = current_user["id"]
    
    # Generar nuevo par de tokens
    access_token = create_token(user_id, settings.access_token_expires_min)
    refresh_token = create_token(user_id, settings.refresh_token_expires_min)
    
    return models.Token(
        access_token=access_token, 
        refresh_token=refresh_token
    )

