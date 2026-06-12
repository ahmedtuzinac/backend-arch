from core_shared.config import BaseAppSettings


class FilesSettings(BaseAppSettings):
    database_url: str = "postgres://postgres:postgres@localhost:5432/files_db"
    redis_url: str = "redis://localhost:6379/0"

    s3_endpoint_url: str = "http://localhost:9000"
    s3_public_url: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "uploads"
    s3_region: str = "us-east-1"

    max_file_size: int = 50 * 1024 * 1024  # 50MB
    allowed_extensions: str = (
        "jpg,jpeg,png,gif,webp,svg,bmp,ico,tiff,heic,heif,"
        "pdf,doc,docx,xls,xlsx,ppt,pptx,csv,txt,md,"
        "json,xml,yaml,yml,zip,rar,7z,tar,gz,"
        "mp3,mp4,wav,avi,mov,mkv,webm,"
        "html,css,js,ts,py,sql"
    )
    thumbnail_size: int = 200

    host: str = "0.0.0.0"
    port: int = 8005


settings = FilesSettings()
