import pytest
from app.users.schemas import UserCreate, UserUpdate
from app.users.service import create_user, get_user_by_email, update_user


@pytest.mark.asyncio
async def test_create_user(init_db):
    user_data = UserCreate(email="test@example.com", password="StrongPass123!")
    user = await create_user(user_data)
    assert user.email == "test@example.com"
    assert user.hashed_password != "StrongPass123!"


@pytest.mark.asyncio
async def test_get_user_by_email(init_db):
    user_data = UserCreate(email="find@example.com", password="StrongPass123!")
    await create_user(user_data)
    found = await get_user_by_email("find@example.com")
    assert found is not None
    assert found.email == "find@example.com"


@pytest.mark.asyncio
async def test_get_user_by_email_not_found(init_db):
    found = await get_user_by_email("nonexistent@example.com")
    assert found is None


@pytest.mark.asyncio
async def test_update_user(init_db):
    user_data = UserCreate(email="update@example.com", password="StrongPass123!")
    user = await create_user(user_data)
    updated = await update_user(user.id, UserUpdate(email="new@example.com"))
    assert updated.email == "new@example.com"
