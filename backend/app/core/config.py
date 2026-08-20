from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = "development"
    secret_key: str
    database_url: str
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "UniConnect <noreply@localhost>"

    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    admin_emails: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def admin_email_list(self) -> list[str]:
        return [
            email.strip().lower()
            for email in self.admin_emails.split(",")
            if email.strip()
        ]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    def cookie_flags(self) -> dict[str, str | bool]:
        # Login is proxied through the frontend host, so Lax is enough and
        # avoids SameSite=None cookie issues on Vercel rewrites.
        return {
            "httponly": True,
            "samesite": "lax",
            "secure": self.is_production,
            "path": "/",
        }

    @property
    def cors_origin_regex(self) -> str | None:
        if self.is_production:
            return r"https://.*\.vercel\.app"
        return None

    @property
    def is_dev(self) -> bool:
        return self.environment == "development" or not self.smtp_host


settings = Settings()
