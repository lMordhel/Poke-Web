from typing import Literal

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

    # --- Entorno de ejecución ---
    # "local" habilita http://localhost (cookies sin Secure, CORS local).
    # "production" exige HTTPS: las cookies de sesión se marcan Secure.
    environment: Literal["local", "production"] = "local"

    # --- CORS ---
    # Lista explícita de orígenes autorizados, separados por coma. No hay
    # comodines ni regex: un origen que no aparezca aquí no recibe cabeceras CORS.
    cors_origins: str = (
        "http://localhost:3000,"
        "http://localhost:5173,"
        "http://127.0.0.1:3000,"
        "http://127.0.0.1:5173"
    )

    # --- Origen público de los archivos subidos ---
    # Base absoluta con la que se construyen las URLs de las imágenes subidas.
    # Debe ser un origen que el navegador pueda alcanzar: el del backend en
    # local, el dominio público en un despliegue.
    public_base_url: str = "http://localhost:8000"

    @property
    def cors_allow_origins(self) -> list[str]:
        """La lista de CORS_ORIGINS ya normalizada, lista para CORSMiddleware."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def cookies_secure(self) -> bool:
        """Secure solo donde exista HTTPS: en local las cookies deben viajar por http."""
        return self.environment == "production"

    def upload_url(self, filename: str) -> str:
        """URL absoluta de un archivo de `uploads/` servido por esta API (S34).

        La barra final de `PUBLIC_BASE_URL` se normaliza para no generar `//uploads`.
        """
        return f"{self.public_base_url.rstrip('/')}/uploads/{filename}"

    # Configuración de Pydantic para leer el archivo .env
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

# Instancia global de settings para ser importada en otros archivos
settings = Settings()
