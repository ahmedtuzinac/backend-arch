from unittest.mock import AsyncMock, patch

import pytest


@pytest.mark.asyncio
async def test_register_enqueues_welcome_email(admin_client):
    with patch("app.users.router.enqueue", new_callable=AsyncMock) as mock_enqueue:
        mock_enqueue.return_value = "fake-job-id"

        response = await admin_client.post(
            "/users/register",
            json={
                "email": "worker@example.com",
                "password": "StrongPass123!",
            },
        )

        assert response.status_code == 201
        mock_enqueue.assert_called_once_with("send_welcome_email", user_id=response.json()["id"])
