from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# --- Cliente de Base de Datos Asíncrono ---
# Usamos 'motor', que es el driver oficial asíncrono de MongoDB para Python.
# Esto es crucial en FastAPI para no bloquear el bucle de eventos (async event loop)
# mientras esperamos entrada/salida (I/O) de la base de datos.
# Si usáramos un driver síncrono (como pymongo estándar), bloquearíamos todas las peticiones
# hasta que la base de datos respondiera, arruinando el rendimiento.

# 1. Crear la conexión global al clúster de MongoDB
# Esta instancia gestiona un pool de conexiones automáticamente.
client = AsyncIOMotorClient(settings.mongo_uri)

# 2. Seleccionar la base de datos específica
# En MongoDB, no necesitas crear la base de datos explícitamente antes de usarla.
# Se creará automáticamente (lazy creation) cuando insertes el primer documento.
db = client[settings.mongo_db]

async def get_database():
    """
    Función de utilidad para Inyección de Dependencias (Dependency Injection).
    
    Patrón común en FastAPI:
    En lugar de importar 'db' directamente en los endpoints, inyectamos esta función.
    
    Beneficios:
    1. Testing: Permite reemplazar (mockear) la base de datos fácilmente en los tests.
    2. Gestión de Conexiones: Podríamos añadir lógica para abrir/cerrar sesiones por request si fuera necesario (común en SQL/SQLAlchemy, menos en Mongo).
    """
    return db
