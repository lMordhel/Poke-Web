from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import bcrypt
import hashlib
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from app.core.config import settings
from app.db import db

from fastapi.security import OAuth2
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel
from starlette.requests import Request

class OAuth2PasswordBearerWithCookie(OAuth2):
    def __init__(
        self,
        tokenUrl: str,
        scheme_name: str = None,
        scopes: dict = None,
        description: str = None,
        auto_error: bool = True,
    ):
        if not scopes:
            scopes = {}
        flows = OAuthFlowsModel(password={"tokenUrl": tokenUrl, "scopes": scopes})
        super().__init__(
            flows=flows,
            scheme_name=scheme_name,
            description=description,
            auto_error=auto_error,
        )

    async def __call__(self, request: Request) -> str:
        # Check authorization header first
        authorization = request.headers.get("Authorization")
        if authorization:
            scheme, _, param = authorization.partition(" ")
            if scheme.lower() == "bearer":
                return param

        # Fallback to cookie
        token = request.cookies.get("access_token")
        if not token and self.auto_error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
        return token

oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="api/v1/auth/login")

def _prepare_password(password: str) -> bytes:
    """
    Prepara la contraseña para bcrypt de manera segura.
    Bcrypt tiene un límite técnico de 72 bytes. Si la contraseña es muy larga,
    la hasheamos primero con SHA-256 para evitar truncamientos silenciosos
    que podrían comprometer la seguridad.
    """
    p_bytes = password.encode('utf-8')
    if len(p_bytes) > 72:
        return hashlib.sha256(p_bytes).digest()
    return p_bytes

def hash_password(password: str) -> str:
    """
    Convierte una contraseña plana en un hash seguro usando bcrypt.
    bcrypt genera un 'salt' único para cada hash, lo que impide ataques
    de Lookup Table (Rainbow Tables).
    
    ¡NUNCA almacenes contraseñas en texto plano!
    """
    p_bytes = _prepare_password(password)
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(p_bytes, salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """
    Verifica de manera segura si una contraseña plana coincide con el hash guardado.
    Utiliza comparación en tiempo constante para evitar ataques de tiempo (Timing Attacks).
    """
    p_bytes = _prepare_password(password)
    hashed_bytes = hashed.encode('utf-8')
    return bcrypt.checkpw(p_bytes, hashed_bytes)

def create_token(subject: str, minutes: int):
    """
    Genera un Token JWT (JSON Web Token).
    La clave secreta (settings.jwt_secret) garantiza que el token no ha sido modificado.
    
    Contiene claims estándar:
    - sub (subject): ID del usuario
    - exp (expiration): fecha de caducidad
    - iat (issued at): fecha de creación
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    to_encode = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_alg)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dependencia de FastAPI CRUCIAL para proteger endpoints.
    
    Uso: @router.get("/me", response_model=UserOut)
         async def me(current_user: User = Depends(get_current_user)): ...
    
    Flujo de ejecución automática:
    1. Extrae el token del header Authorization: Bearer <token>.
    2. Decodifica y valida la firma del token con jwt.decode.
    3. Extrae el user_id (sub).
    4. Verifica que el usuario exista en la base de datos (seguridad adicional).
    5. Retorna el objeto usuario validado.
    
    Si falla cualquier paso, lanza HTTP 401 Unauthorized y detiene la ejecución.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Busca en MongoDB por _id (ObjectId)
    # Importante: Validar que el ID sea un ObjectId válido para evitar inyecciones raras (aunque poco probables aquí)
    if not ObjectId.is_valid(user_id):
        raise credentials_exception
        
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        # El token es válido pero el usuario fue borrado -> 401
        raise credentials_exception
    
    # Normalizamos el ID para que coincida con lo que espera Pydantic (id vs _id)
    user["id"] = str(user.pop("_id"))
    return user

async def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    """
    Dependencia que asegura que el usuario actual tenga rol de administrador.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user
