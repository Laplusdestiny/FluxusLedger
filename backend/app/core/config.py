from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # Database
    database_url: str
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    
    # CORS
    cors_origins: list = ["http://localhost:3000", "http://localhost:8000"]
    
    class Config:
        env_file = ".env"


settings = Settings()
