from fastapi import APIRouter, HTTPException, Depends, status, Request, Response
from app.schemas.user import UserCreate, UserOut, UserLogin
from app.schemas.token import Token
from app.core.security import get_current_user
from app.core.config import settings
from app.core.limiter import limiter
from app.services.auth_service import AuthService

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
@limiter.limit("5/minute")
async def register(request: Request, payload: UserCreate):
    auth_service = AuthService()
    return await auth_service.register_user(payload)

@router.post("/login", response_model=dict)
@limiter.limit("5/minute")
async def login(request: Request, response: Response, payload: UserLogin):
    auth_service = AuthService()
    tokens = await auth_service.authenticate_user(payload)
    
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        max_age=settings.access_token_expires_min * 60,
        samesite="lax",
        secure=False, # True if HTTPS
    )
    
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        max_age=settings.refresh_token_expires_min * 60,
        samesite="lax",
        secure=False,
    )
    
    return {"message": "Login successful"}

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """
    Endpoint protegido.
    Solo accesible si envías un token válido en el header: 'Authorization: Bearer <token>'.
    La dependencia 'get_current_user' hace todo el trabajo sucio: valida token, busca usuario y lo inyecta aquí.
    """
    return current_user

@router.post("/refresh", response_model=dict)
async def refresh_token(request: Request, response: Response):
    refresh_token_cookie = request.cookies.get("refresh_token")
    if not refresh_token_cookie:
        raise HTTPException(status_code=401, detail="Refresh token missing")
        
    auth_service = AuthService()
    # Assuming get_current_user logic handles normal token validation,
    # Here we need a simplified subject extraction from refresh token
    # For now, to keep it simple, we require current_user from get_current_user,
    # but the architectural flaw here is that /refresh is called when access token expires.
    # Therefore get_current_user will fail! I will leave it simple as you had it or modify it.
    
    # We will import security functions directly here to avoid circular logic
    from jose import jwt, JWTError
    try:
        payload = jwt.decode(refresh_token_cookie, settings.jwt_secret, algorithms=[settings.jwt_alg])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    tokens = auth_service.refresh_user_token(user_id)
    
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        max_age=settings.access_token_expires_min * 60,
        samesite="lax",
        secure=False,
    )
    
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        max_age=settings.refresh_token_expires_min * 60,
        samesite="lax",
        secure=False,
    )
    
    return {"message": "Token refreshed"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}
