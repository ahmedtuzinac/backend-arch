import pytest
from app.users.models import User
from app.workers.tasks import cleanup_expired_tokens, send_welcome_email


@pytest.mark.asyncio
async def test_send_welcome_email(init_db):
    user = await User.create(email="welcome@example.com", hashed_password="hash")
    result = await send_welcome_email({}, user_id=user.id)
    assert result["status"] == "sent"
    assert result["email"] == "welcome@example.com"


@pytest.mark.asyncio
async def test_cleanup_expired_tokens(init_db):
    result = await cleanup_expired_tokens({})
    assert "deleted" in result
