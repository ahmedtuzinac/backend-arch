import pytest


@pytest.mark.asyncio
async def test_login(admin_client, client):
    await admin_client.post(
        "/users/register",
        json={"email": "login@example.com", "password": "Pass123!"},
    )
    response = await client.post(
        "/token",
        data={"grant_type": "password", "username": "login@example.com", "password": "Pass123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(admin_client, client):
    await admin_client.post(
        "/users/register",
        json={"email": "wrong@example.com", "password": "Pass123!"},
    )
    response = await client.post(
        "/token",
        data={"grant_type": "password", "username": "wrong@example.com", "password": "WrongPass!"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_token_refresh(admin_client, client):
    await admin_client.post(
        "/users/register",
        json={"email": "refreshrouter@example.com", "password": "Pass123!"},
    )
    login = await client.post(
        "/token",
        data={"grant_type": "password", "username": "refreshrouter@example.com", "password": "Pass123!"},
    )
    refresh_token = login.json()["refresh_token"]
    response = await client.post("/token/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_token_verify(admin_client, client):
    await admin_client.post(
        "/users/register",
        json={"email": "verifyr@example.com", "password": "Pass123!"},
    )
    login = await client.post(
        "/token",
        data={"grant_type": "password", "username": "verifyr@example.com", "password": "Pass123!"},
    )
    token = login.json()["access_token"]
    response = await client.post("/token/verify", json={"token": token})
    assert response.status_code == 200
    assert response.json()["active"] is True
