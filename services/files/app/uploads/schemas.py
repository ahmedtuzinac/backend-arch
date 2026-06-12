from datetime import datetime

from pydantic import BaseModel


class FileResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    content_type: str
    size: int
    s3_key: str
    thumbnail_key: str
    uploaded_by: int
    category: str
    url: str = ""
    thumbnail_url: str = ""
    created_at: datetime

    model_config = {"from_attributes": True}
