import asyncio
import os
from collections.abc import AsyncGenerator

os.environ["TESTCONTAINERS_RYUK_DISABLED"] = "true"

import pytest
from httpx import ASGITransport, AsyncClient
from testcontainers.postgres import PostgresContainer
from tortoise import Tortoise

TORTOISE_MODELS = [
    "app.users.models",
    "app.oauth.models",
    "core_shared.workers.models",
]


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def postgres_url():
    with PostgresContainer("postgres:17-alpine") as postgres:
        yield postgres.get_connection_url().replace("postgresql+psycopg2://", "postgres://")


@pytest.fixture(autouse=True)
async def init_db(postgres_url):
    await Tortoise.init(
        db_url=postgres_url,
        modules={"models": TORTOISE_MODELS},
    )
    await Tortoise.generate_schemas()
    yield
    for model in Tortoise.apps.get("models", {}).values():
        await model.all().delete()
    await Tortoise.close_connections()


@pytest.fixture
async def client(init_db) -> AsyncGenerator[AsyncClient]:
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def admin_client(init_db) -> AsyncGenerator[AsyncClient]:
    """Client authenticated as admin user."""
    import bcrypt
    from app.main import app
    from app.users.models import User, UserRole

    hashed = bcrypt.hashpw(b"AdminPass123!", bcrypt.gensalt()).decode()
    await User.create(email="testadmin@test.com", hashed_password=hashed, role=UserRole.ADMIN)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/token",
            data={"grant_type": "password", "username": "testadmin@test.com", "password": "AdminPass123!"},
        )
        token = response.json()["access_token"]
        ac.headers["Authorization"] = f"Bearer {token}"
        yield ac
