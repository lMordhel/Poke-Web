import os
import sys

# El backend exige JWT_SECRET para importar app.core.config.
# Se define antes de cualquier import de la aplicación.
os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production")
os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017")
os.environ.setdefault("MONGO_DB", "webpoke_test")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
