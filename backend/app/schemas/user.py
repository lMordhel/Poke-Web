from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

# --- Esquemas (Schemas) Pydantic ---
# Estos modelos definen la estructura, tipos y VALIDACIÓN de los datos.
# Pydantic v2 valida los datos en tiempo de ejecución de manera estricta y rápida.
# Si el cliente (frontend) envía JSON inválido, FastAPI devuelve 422 Unprocessable Entity automáticamente.

class UserBase(BaseModel):
    """
    Datos base compartidos por todos los modelos de usuario.
    validación automática de email gracias a EmailStr (requiere pydantic[email]).
    """
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    """
    Datos requeridos EXCLUSIVAMENTE al crear (registrar) un usuario.
    La contraseña es obligatoria aquí, pero opcional en otras situaciones.
    """
    password: str

class UserLogin(BaseModel):
    """
    Datos requeridos para el payload del login.
    """
    email: EmailStr
    password: str

class UserInDB(UserBase):
    """
    Representación interna del usuario en la base de datos.
    Incluye el hash de la contraseña (NUNCA la plana) y metadatos del sistema.
    """
    hashed_password: str
    is_active: bool = True
    created_at: str  # MongoDB y Pydantic manejan datetime, pero a veces string ISO es más portable

class UserOut(UserBase):
    """
    Schema de SALIDA (Response Model).
    Esta es la respuesta PÚBLICA que enviamos al cliente.
    
    ¡CRÍTICO! Este modelo NO incluye 'password' ni 'hashed_password'.
    Al definir este modelo en el decorador de ruta de FastAPI (response_model=UserOut),
    FastAPI filtrará automáticamente cualquier campo sensible antes de enviar el JSON.
    """
    id: str  # Convertimos el ObjectId de Mongo a string para facilidad del frontend
    
    # ConfigDict(from_attributes=True) permite crear instancias de este modelo
    # directamente desde objetos ORM o diccionarios complejos, sin tener que mapear campo a campo.
    # (En Pydantic v1 esto se llamaba 'orm_mode = True')
    model_config = ConfigDict(from_attributes=True)
