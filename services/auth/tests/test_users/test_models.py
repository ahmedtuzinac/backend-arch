import pytest
from app.users.models import User
from tortoise.exceptions import IntegrityError


@pytest.mark.asyncio
async def test_create_user(init_db):
    user = await User.create(
        email="test@example.com",
        hashed_password="hashed123",
    )
    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.is_active is True
    assert user.is_superuser is False


@pytest.mark.asyncio
async def test_user_unique_email(init_db):
    await User.create(email="unique@example.com", hashed_password="hash1")
    with pytest.raises(IntegrityError):
        await User.create(email="unique@example.com", hashed_password="hash2")
