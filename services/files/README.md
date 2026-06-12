# Files Service

File upload microservice with S3-compatible storage, automatic thumbnail generation, and HEIC support.

## Features

- Upload files to S3-compatible storage (MinIO for dev, AWS S3 for production)
- Automatic thumbnail generation for images (background worker)
- HEIC/HEIF support via pillow-heif
- On-demand HEIC-to-JPEG preview conversion for browsers
- File listing with search and pagination
- File delete (removes from S3 + database)
- Storage health check
- Real-time updates via WebSocket (upload, delete, thumbnail ready)
- Task logging for all worker jobs

## API Endpoints

### Files

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/files/upload` | Upload file (multipart) |
| `GET` | `/files/` | List files (paginated, search, filter by category) |
| `GET` | `/files/{id}` | Get file details with URLs |
| `GET` | `/files/{id}/preview` | On-demand preview (converts HEIC to JPEG) |
| `DELETE` | `/files/{id}` | Delete file from S3 and database |

### Health & Tasks

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service health with DB check and uptime |
| `GET` | `/storage/health` | S3/MinIO connection and bucket status |
| `GET` | `/tasks/` | Background task logs |

## Background Workers

| Task | Trigger | Description |
|------|---------|-------------|
| `generate_thumbnail` | On image upload | Creates 200x200 thumbnail, broadcasts update |

## Supported File Types

Images: jpg, jpeg, png, gif, webp, svg, bmp, ico, tiff, heic, heif
Documents: pdf, doc, docx, xls, xlsx, ppt, pptx, csv, txt, md
Data: json, xml, yaml, yml
Archives: zip, rar, 7z, tar, gz
Media: mp3, mp4, wav, avi, mov, mkv, webm
Code: html, css, js, ts, py, sql

Max file size: 50MB (configurable)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://...` | PostgreSQL connection string |
| `REDIS_URL` | `redis://...` | Redis connection string |
| `S3_ENDPOINT_URL` | `http://localhost:9000` | S3/MinIO internal endpoint |
| `S3_PUBLIC_URL` | `http://localhost:9000` | S3/MinIO public URL for browser |
| `S3_ACCESS_KEY` | `minioadmin` | S3 access key |
| `S3_SECRET_KEY` | `minioadmin` | S3 secret key |
| `S3_BUCKET` | `uploads` | S3 bucket name |
| `S3_REGION` | `us-east-1` | S3 region |
| `MAX_FILE_SIZE` | `52428800` | Max upload size in bytes (50MB) |
| `ALLOWED_EXTENSIONS` | `jpg,png,...` | Comma-separated allowed extensions |
| `THUMBNAIL_SIZE` | `200` | Thumbnail dimensions in pixels |
