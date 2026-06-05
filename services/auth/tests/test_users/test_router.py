import pytest


@pytest.mark.asyncio
async def test_register_user(client):
    response = await client.post("/users/register", json={
        "email": "new@example.com",
        "password": "StrongPass123!",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    await client.post("/users/register", json={
        "email": "dup@example.com",
        "password": "StrongPass123!",
    })
    response = await client.post("/users/register", json={
        "email": "dup@example.com",
        "password": "StrongPass123!",
    })
    assert response.status_code == 409
