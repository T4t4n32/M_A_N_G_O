from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "M.A.N.G.O. API"
    environment: str = "development"
    api_prefix: str = "/api"

    database_url: str = Field(default="sqlite:///./mango.db", alias="DATABASE_URL")
    secret_key: str = Field(default="change-me", alias="SECRET_KEY")
    jwt_algorithm: str = "HS256"
    access_token_exp_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXP_MINUTES")
    refresh_token_exp_days: int = Field(default=7, alias="REFRESH_TOKEN_EXP_DAYS")

    access_log_retention_days: int = 90


settings = Settings()
