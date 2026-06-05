from app.connections.router import get_manager
from app.handlers.schemas import SendMessageRequest, SendMessageResponse


async def send_message(data: SendMessageRequest) -> SendMessageResponse:
    mgr = get_manager()

    if data.user_id:
        sent = await mgr.send_to_user(
            data.user_id,
            {
                "type": data.type,
                "content": data.content,
            },
        )
        return SendMessageResponse(recipients=1 if sent else 0)

    if data.room:
        count = await mgr.broadcast_to_room(
            data.room,
            {
                "type": data.type,
                "room": data.room,
                "content": data.content,
            },
        )
        return SendMessageResponse(recipients=count)

    count = await mgr.broadcast_all(
        {
            "type": data.type,
            "content": data.content,
        }
    )
    return SendMessageResponse(recipients=count)
