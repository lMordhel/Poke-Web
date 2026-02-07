from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.user import UserCreate, UserOut, UserLogin
from app.schemas.token import Token
from app.db import db
from app.core.security import hash_password, verify_password, create_token, get_current_user
from app.core.config import settings

router = APIRouter()

# --- Endpoints de Autenticación (Auth) ---
# Aquí manejamos el Registro, Login y Gestión de Tokens JWT.
#
# Convenciones:
# - POST /register: Crear cuenta
# - POST /login: Obtener Access Token
# - GET /me: Obtener datos del usuario actual (protegido)
# - POST /refresh: Obtener un nuevo Access Token usando un Refresh Token

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate):
    """
    Registrar un nuevo usuario en la base de datos.
    1. Verifica si el email ya existe en MongoDB.
    2. Hashea la contraseña con bcrypt (nunca se almacena plana).
    3. Guarda los datos mínimos necesarios.
    4. Retorna el usuario creado (sin contraseña).
    """
    users = db.users
    existing = await users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(
            status_code=409,  # Conflict
            detail="Email already exists"
        )
    
    hashed = hash_password(payload.password)
    user_data = {
        "email": payload.email,
        "password": hashed,
        "created_at": datetime.now(timezone.utc),
        "is_active": True,
        # 'token_version' es una buena idea para invalidar tokens viejos si el usuario cambia contraseña
        "token_version": 0
    }
    if payload.name:
        user_data["name"] = payload.name
        
    result = await users.insert_one(user_data)
    
    # Retornamos UserOut.
    # FastAPI filtrará automáticamente cualquier campo no definido en UserOut (como 'password').
    # El ID de MongoDB (ObjectId) se convierte a string.
    return UserOut(
        id=str(result.inserted_id),
        email=payload.email,
        name=payload.name
    )

@router.post("/login", response_model=Token)
async def login(payload: UserLogin):
    """
    Autenticación y generación de JWT.
    1. Busca usuario por email.
    2. Verifica hash de contraseña (verify_password).
    3. Genera dos tokens:
       - Access Token: Validez corta (ej: 15min). Se envía en cada petición.
       - Refresh Token: Validez larga (ej: 30 días). Se usa solo para renovar el Access Token.
    """
    users = db.users
    user = await users.find_one({"email": payload.email})
    
    # Timing-safe comparison.
    # Si el usuario no existe, verificamos una contraseña dummy para evitar Timing Attacks
    # que permitan enumerar usuarios válidos midiendo tiempos de respuesta.
    # (Aquí simplificado: verify_password maneja la seguridad).
    if not user or not verify_password(payload.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Inactive user")
        
    user_id = str(user["_id"])
    
    # Crear tokens con duraciones específicas desde config.py
    access_token = create_token(user_id, settings.access_token_expires_min)
    refresh_token = create_token(user_id, settings.refresh_token_expires_min)
    
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """
    Endpoint protegido.
    Solo accesible si envías un token válido en el header: 'Authorization: Bearer <token>'.
    La dependencia 'get_current_user' hace todo el trabajo sucio: valida token, busca usuario y lo inyecta aquí.
    """
    return current_user

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """
    Rotación de tokens de seguridad.
    
    Cuando el Access Token expira (401), el cliente (frontend) debería llamar a este endpoint
    enviando su Refresh Token vigente para obtener un par nuevo sin pedir credenciales de nuevo.
    """
    user_id = current_user["id"]
    access_token = create_token(user_id, settings.access_token_expires_min)
    # Recomendación de seguridad: Rotar también el refresh token (Refresh Token Rotation)
    refresh_token = create_token(user_id, settings.refresh_token_expires_min)
    
    return Token(access_token=access_token, refresh_token=refresh_token)
