import io
import uuid

import structlog
from app.config import settings
from app.storage.client import get_s3_client
from PIL import Image

from core_shared.workers import tracked_task

logger = structlog.get_logger()


@tracked_task
async def generate_thumbnail(ctx: dict, *, file_id: int, job_id: str | None = None) -> dict:
    """Generate thumbnail for an uploaded image."""
    from app.uploads.models import FileUpload

    record = await FileUpload.get_or_none(id=file_id)
    if record is None:
        return {"status": "skipped", "reason": "file not found"}

    client = get_s3_client()

    # Download original
    response = client.get_object(Bucket=settings.s3_bucket, Key=record.s3_key)
    image_data = response["Body"].read()

    # Create thumbnail
    img = Image.open(io.BytesIO(image_data))
    img.thumbnail((settings.thumbnail_size, settings.thumbnail_size))

    # Save to buffer
    buffer = io.BytesIO()
    img_format = "JPEG" if record.content_type == "image/jpeg" else "PNG"
    img.save(buffer, format=img_format)
    buffer.seek(0)

    # Upload thumbnail
    ext = "jpg" if img_format == "JPEG" else "png"
    thumbnail_key = f"thumbnails/{uuid.uuid4().hex}.{ext}"
    content_type = f"image/{ext}"

    client.put_object(
        Bucket=settings.s3_bucket,
        Key=thumbnail_key,
        Body=buffer.getvalue(),
        ContentType=content_type,
    )

    # Update record
    record.thumbnail_key = thumbnail_key
    await record.save()

    # Notify frontend that files table updated (thumbnail ready)
    import contextlib

    from core_shared.communication import ServiceClient

    ws_client = ServiceClient(base_url="http://websocket:8002")
    with contextlib.suppress(Exception):
        await ws_client.post("/messages/broadcast", json={
            "type": "table_updated",
            "table": "files",
        })

    await logger.ainfo("thumbnail_generated", file_id=file_id, thumbnail_key=thumbnail_key)
    return {"status": "done", "thumbnail_key": thumbnail_key}
