import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from core_shared.middleware import setup_cors, setup_error_handler, RequestIdMiddleware


@pytest.fixture
def app():
    app = FastAPI()
    setup_cors(app, origins=["http://localhost:3000"])
    app.add_middleware(RequestIdMiddleware)

    @app.get("/test")
    async def test_endpoint():
        return {"status": "ok"}

    return app


@pytest.fixture
def error_app():
    app = FastAPI()
    setup_error_handler(app)

    @app.get("/error")
    async def error_endpoint():
        raise ValueError("test error")

    return app


@pytest.mark.asyncio
async def test_request_id_middleware(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/test")
        assert response.status_code == 200
        assert "x-request-id" in response.headers


@pytest.mark.asyncio
async def test_request_id_passed_through(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/test", headers={"X-Request-ID": "my-custom-id"})
        assert response.headers["x-request-id"] == "my-custom-id"


@pytest.mark.asyncio
async def test_error_handler(error_app):
    async with AsyncClient(transport=ASGITransport(app=error_app), base_url="http://test") as client:
        response = await client.get("/error")
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data
