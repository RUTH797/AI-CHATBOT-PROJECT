import os
import logging
from dotenv import load_dotenv

load_dotenv()

class AppConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev_key_temp")
    ALGORITHM = "HS256"
    DB_URL = os.getenv("DATABASE_URL", "sqlite:///chatbot.db")
    OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
    AI_MODEL = "gpt-3.5-turbo"
    UPLOAD_DIR = "uploads"
    ALLOWED_FILES = {'txt', 'pdf', 'md'}
    MAX_SIZE = 16 * 1024 * 1024
    CHUNK_SIZE = 800
    CHUNK_OVERLAP = 150
    USE_MOCK = not bool(OPENAI_KEY)

config = AppConfig()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[logging.FileHandler('logs/app.log'), logging.StreamHandler()]
)

logger = logging.getLogger(__name__)