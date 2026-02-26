from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
from app.core.limiter import limiter
from app.core.exceptions import global_http_exception_handler, validation_exception_handler, unhandled_exception_handler
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# --- Entrypoint de la Aplicación ---
# Aquí arranca el servidor. Configura el título, versión, documentación (Swagger)
# y, crucialmente, los Middlewares y Rutas.

app = FastAPI(
    title="WebPoke API", 
    description="API RESTful para E-commerce de Pokémon construida con FastAPI y MongoDB",
    version="1.0.0",
    docs_url="/docs", # URL para Swagger UI (interfaz interactiva)
    redoc_url="/redoc" # URL para ReDoc (documentación estática bonita)
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(StarletteHTTPException, global_http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# --- Configuración CORS (Cross-Origin Resource Sharing) ---
# Permite que el navegador haga peticiones fetch() desde dominios distintos al backend.
# En desarrollo, permitimos localhost:3000 (React/Next) y localhost:5173 (Vite).
# En producción, esto debe ser una lista estricta de dominios confiables.

origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# El middleware CORS intercepta cada petición y añade cabeceras como:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Methods: GET, POST...
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # Permite cookies/headers de autorización
    allow_methods=["*"],    # Métodos HTTP permitidos (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"],    # Cabeceras permitidas (Content-Type, Authorization...)
)

import os
from fastapi.staticfiles import StaticFiles

# --- Registramos las Rutas (Routers) ---
# Todas las rutas definidas en api/v1/api.py estarán prefijadas con /api/v1
# Ejemplo: /api/v1/user/me
app.include_router(api_router, prefix="/api/v1")

# Configuramos la carpeta local "uploads" para que pueda ser leída públicamente
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from app.db.database import db
from pymongo import ASCENDING, DESCENDING

@app.on_event("startup")
async def startup_event():
    # Optimización de DB y ordenamiento (FASE 4)
    await db.orders.create_index([("user_id", ASCENDING)])
    await db.orders.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    await db.activities.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])

@app.get("/")
async def root():
    """
    Ruta raíz (Health Check).
    Útil para verificar rápidamente si el servidor está vivo.
    """
    return {
        "status": "online",
        "message": "WebPoke API is running! 🚀",
        "docs": "/docs",
        "version": "1.0.0"
    }

# Para correr: uvicorn app.main:app --reload
