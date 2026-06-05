import pytest


@pytest.mark.asyncio
async def test_send_message_endpoint(client):
    response = await client.post(
        "/messages/send",
        json={
            "content": "hello world",
            "type": "broadcast",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "sent"
    assert data["recipients"] == 0


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
