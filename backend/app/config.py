from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "backend/.env"), extra="ignore")

    app_name: str = "eRTMAC-NWIS"
    app_env: str = "demo"
    secret_key: str = "change-me-to-a-long-random-string-for-demo-only"
    access_token_expire_minutes: int = 480
    api_cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    database_url: str = "postgresql+psycopg://nwis:nwis_demo_password@localhost:5432/nwis"
    redis_url: str = "redis://localhost:6379/0"
    upload_dir: str = "./uploads"
    max_upload_mb: int = 15
    demo_region_name: str = "NWIS Synthetic Block A"
    demo_region_lat: float = 27.4720
    demo_region_lon: float = 95.3180
    default_radius_km: float = 8.0
    enable_ocr: bool = False
    enable_embeddings: bool = False
    enable_ml_model: bool = True
    llm_provider: str = ""
    llm_api_key: str = ""
    llm_model: str = ""
    demo_auth: bool = True

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.api_cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
