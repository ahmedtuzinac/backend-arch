from tortoise import fields

from core_shared.database import BaseModel
from core_shared.database.mixins import TimestampMixin


class FileUpload(BaseModel, TimestampMixin):
    filename = fields.CharField(max_length=255)
    original_filename = fields.CharField(max_length=255)
    content_type = fields.CharField(max_length=100)
    size = fields.IntField()
    s3_key = fields.CharField(max_length=512, unique=True, index=True)
    thumbnail_key = fields.CharField(max_length=512, default="")
    uploaded_by = fields.IntField(index=True)
    category = fields.CharField(max_length=50, default="general", index=True)

    class Meta:
        table = "file_uploads"
