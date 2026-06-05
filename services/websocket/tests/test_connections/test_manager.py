from unittest.mock import AsyncMock

import pytest
from app.connections.manager import ConnectionManager


@pytest.fixture
def manager():
    return ConnectionManager()


@pytest.fixture
def mock_ws():
    ws = AsyncMock()
    ws.send_json = AsyncMock()
    ws.close = AsyncMock()
    return ws


@pytest.mark.asyncio
async def test_connect(manager, mock_ws):
    await manager.connect(mock_ws, user_id="user1")
    assert "user1" in manager.active_connections


@pytest.mark.asyncio
async def test_disconnect(manager, mock_ws):
    await manager.connect(mock_ws, user_id="user1")
    manager.disconnect(user_id="user1")
    assert "user1" not in manager.active_connections


@pytest.mark.asyncio
async def test_join_room(manager, mock_ws):
    await manager.connect(mock_ws, user_id="user1")
    manager.join_room(user_id="user1", room="general")
    assert "user1" in manager.rooms["general"]


@pytest.mark.asyncio
async def test_leave_room(manager, mock_ws):
    await manager.connect(mock_ws, user_id="user1")
    manager.join_room(user_id="user1", room="general")
    manager.leave_room(user_id="user1", room="general")
    assert "user1" not in manager.rooms.get("general", set())


@pytest.mark.asyncio
async def test_send_to_user(manager, mock_ws):
    await manager.connect(mock_ws, user_id="user1")
    await manager.send_to_user("user1", {"type": "message", "content": "hello"})
    mock_ws.send_json.assert_called_once_with({"type": "message", "content": "hello"})


@pytest.mark.asyncio
async def test_broadcast_to_room(manager, mock_ws):
    ws2 = AsyncMock()
    ws2.send_json = AsyncMock()

    await manager.connect(mock_ws, user_id="user1")
    await manager.connect(ws2, user_id="user2")
    manager.join_room(user_id="user1", room="general")
    manager.join_room(user_id="user2", room="general")

    await manager.broadcast_to_room("general", {"type": "message", "content": "hello all"})
    mock_ws.send_json.assert_called_once()
    ws2.send_json.assert_called_once()
