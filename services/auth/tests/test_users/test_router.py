import pytest


@pytest.mark.asyncio
async def test_register_user(admin_client):
    response = await admin_client.post(
        "/users/register",
        json={
            "email": "new@example.com",
            "password": "StrongPass123!",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(admin_client):
    await admin_client.post(
        "/users/register",
        json={
            "email": "dup@example.com",
            "password": "StrongPass123!",
        },
    )
    response = await admin_client.post(
        "/users/register",
        json={
            "email": "dup@example.com",
            "password": "StrongPass123!",
        },
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_requires_admin(client):
    response = await client.post(
        "/users/register",
        json={
            "email": "nope@example.com",
            "password": "StrongPass123!",
        },
    )
    assert response.status_code == 401
