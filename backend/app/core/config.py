from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Configuración centralizada de la aplicación.
    
    Utiliza Pydantic Settings para cargar variables de entorno automáticamente.
    Esto permite separar la configuración del código ('The Twelve-Factor App').
    
    Prioridad de carga:
    1. Variables de entorno del sistema (OS)
    2. Archivo .env
    3. Valores por defecto definidos aquí
    """
    
    # --- Configuración de Base de Datos ---
    # URI de conexión a MongoDB. Por defecto usa localhost.
    mongo_uri: str = "mongodb://localhost:27017"
    # Nombre de la base de datos dentro de MongoDB
    mongo_db: str = "webpoke"
    
    # --- Seguridad (JWT) ---
    # ¡CRÍTICO! Esta clave secreta se usa para firmar los tokens. 
    # En producción, debe ser una cadena larga, aleatoria y mantenida en secreto.
    jwt_secret: str
    # Algoritmo de encriptación para el token (HS256 es estándar y seguro para este uso)
    jwt_alg: str = "HS256"
    
    # --- Expiración de Tokens ---
    # Tiempo de vida del token de acceso (corto para seguridad, ej: 15 min)
    access_token_expires_min: int = 15
    # Tiempo de vida del token de refresco (largo para usabilidad, permite "recordar sesión", ej: 30 días)
    refresh_token_expires_min: int = 43200

    # Configuración de Pydantic para leer el archivo .env
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

# Instancia global de settings para ser importada en otros archivos
settings = Settings()
