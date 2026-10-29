from fastapi import APIRouter, HTTPException, Depends, status, Request, Response
from fastapi.responses import JSONResponse
from app.schemas.user import UserCreate, UserOut, UserLogin
from app.schemas.token import Token
from app.core.security import get_current_user, REFRESH_TOKEN_TYPE
from app.core.config import settings
from app.core.limiter import limiter
from app.services.auth_service import AuthService, INVALID_REFRESH_TOKEN

router = APIRouter()


def _set_auth_cookies(response: Response, tokens: Token) -> None:
    """Fuente única de las flags de sesión (S18).

    HttpOnly: JavaScript no puede leer los tokens. SameSite=Lax: no viajan en
    peticiones cruzadas. Secure: solo en `ENVIRONMENT=production`, porque en
    local el frontend habla http://localhost y una cookie Secure se descartaría.
    """
    flags = {
        "httponly": True,
        "samesite": "lax",
        "secure": settings.cookies_secure,
    }
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        max_age=settings.access_token_expires_min * 60,
        **flags,
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        max_age=settings.refresh_token_expires_min * 60,
        **flags,
    )


def _clear_auth_cookies(response: Response) -> None:
    """Borra ambas cookies con los mismos atributos con los que se emitieron."""
    flags = {
        "httponly": True,
        "samesite": "lax",
        "secure": settings.cookies_secure,
    }
    response.delete_cookie("access_token", **flags)
    response.delete_cookie("refresh_token", **flags)

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

    _set_auth_cookies(response, tokens)

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

    from jose import jwt, JWTError
    try:
        payload = jwt.decode(refresh_token_cookie, settings.jwt_secret, algorithms=[settings.jwt_alg])
    except JWTError:
        raise HTTPException(status_code=401, detail=INVALID_REFRESH_TOKEN)

    # Un access token (15 min) no puede canjearse por un refresh token de 30 días.
    if payload.get("type") != REFRESH_TOKEN_TYPE:
        raise HTTPException(status_code=401, detail=INVALID_REFRESH_TOKEN)

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail=INVALID_REFRESH_TOKEN)

    try:
        tokens = await auth_service.refresh_user_token(user_id)
    except HTTPException:
        # La cuenta detrás del token ya no existe o está inactiva: no se emite
        # nada nuevo y se borra la sesión caduca del navegador (S13).
        stale_session = JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": INVALID_REFRESH_TOKEN},
        )
        _clear_auth_cookies(stale_session)
        return stale_session

    _set_auth_cookies(response, tokens)

    return {"message": "Token refreshed"}

@router.post("/logout")
async def logout(response: Response):
    _clear_auth_cookies(response)
    return {"message": "Logged out successfully"}
