import contextlib
import uuid

from app.config import settings
from app.storage.client import get_s3_client
from app.uploads.models import FileUpload
from app.uploads.schemas import FileResponse
from app.workers.enqueue import enqueue
from fastapi import APIRouter, HTTPException, UploadFile, status

from core_shared.communication import ServiceClient
from core_shared.pagination import PaginatedResponse, paginate

router = APIRouter(prefix="/files", tags=["files"])

ws_client = ServiceClient(base_url="http://websocket:8002")


async def notify_files_update() -> None:
    with contextlib.suppress(Exception):
        await ws_client.post("/messages/broadcast", json={
            "type": "table_updated",
            "table": "files",
        })


def get_file_url(key: str) -> str:
    if not key:
        return ""
    return f"{settings.s3_public_url}/{settings.s3_bucket}/{key}"


def validate_extension(filename: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    allowed = settings.allowed_extensions.split(",")
    return ext in allowed


@router.post("/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile,
    uploaded_by: int = 0,
    category: str = "general",
):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename")

    if not validate_extension(file.filename):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File type not allowed")

    content = await file.read()

    if len(content) > settings.max_file_size:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File too large")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
    s3_key = f"{category}/{uuid.uuid4().hex}.{ext}"

    client = get_s3_client()
    client.put_object(
        Bucket=settings.s3_bucket,
        Key=s3_key,
        Body=content,
        ContentType=file.content_type or "application/octet-stream",
    )

    record = await FileUpload.create(
        filename=f"{uuid.uuid4().hex}.{ext}",
        original_filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        size=len(content),
        s3_key=s3_key,
        uploaded_by=uploaded_by,
        category=category,
    )

    # Generate thumbnail for images
    image_extensions = {"jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "heic", "heif"}
    is_image = (file.content_type and file.content_type.startswith("image/")) or ext in image_extensions
    if is_image:
        await enqueue("generate_thumbnail", file_id=record.id)

    await notify_files_update()
    response = FileResponse.model_validate(record)
    response.url = get_file_url(record.s3_key)
    return response


@router.get("/", response_model=PaginatedResponse[FileResponse])
async def list_files(
    page: int = 1,
    per_page: int = 20,
    category: str | None = None,
    uploaded_by: int | None = None,
    search: str | None = None,
):
    query = FileUpload.all().order_by("-created_at")
    if category:
        query = query.filter(category=category)
    if uploaded_by is not None:
        query = query.filter(uploaded_by=uploaded_by)
    if search:
        query = query.filter(original_filename__icontains=search)
    result = await paginate(query, page=page, per_page=per_page)
    for item in result["items"]:
        item.url = get_file_url(item.s3_key)
        item.thumbnail_url = get_file_url(item.thumbnail_key)
    return result


@router.get("/{file_id}", response_model=FileResponse)
async def get_file(file_id: int):
    record = await FileUpload.get_or_none(id=file_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    response = FileResponse.model_validate(record)
    response.url = get_file_url(record.s3_key)
    response.thumbnail_url = get_file_url(record.thumbnail_key)
    return response


@router.get("/{file_id}/preview")
async def preview_file(file_id: int):
    """On-demand preview — converts HEIC/HEIF to JPEG for browser display."""
    from io import BytesIO

    from fastapi.responses import StreamingResponse
    from PIL import Image
    from pillow_heif import register_heif_opener

    register_heif_opener()

    record = await FileUpload.get_or_none(id=file_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    s3 = get_s3_client()
    obj = s3.get_object(Bucket=settings.s3_bucket, Key=record.s3_key)
    data = obj["Body"].read()

    ext = record.original_filename.rsplit(".", 1)[-1].lower() if "." in record.original_filename else ""
    needs_convert = ext in ("heic", "heif") or record.content_type in ("image/heic", "image/heif")

    if needs_convert:
        img = Image.open(BytesIO(data))
        buffer = BytesIO()
        img.save(buffer, format="JPEG", quality=90)
        buffer.seek(0)
        return StreamingResponse(buffer, media_type="image/jpeg")

    return StreamingResponse(BytesIO(data), media_type=record.content_type)


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(file_id: int):
    record = await FileUpload.get_or_none(id=file_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    client = get_s3_client()
    client.delete_object(Bucket=settings.s3_bucket, Key=record.s3_key)
    if record.thumbnail_key:
        client.delete_object(Bucket=settings.s3_bucket, Key=record.thumbnail_key)
    await record.delete()
    await notify_files_update()
