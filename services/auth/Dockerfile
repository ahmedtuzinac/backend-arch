FROM python:3.13-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install core-shared first
COPY packages/core-shared /tmp/core-shared
RUN pip install --no-cache-dir /tmp/core-shared && rm -rf /tmp/core-shared

# Install service dependencies
COPY services/auth/pyproject.toml .
RUN pip install --no-cache-dir .

# Copy service code
COPY services/auth/app ./app

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
