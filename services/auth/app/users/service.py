from passlib.hash import bcrypt

from app.users.models import User
from app.users.schemas import UserCreate, UserUpdate


async def create_user(data: UserCreate) -> User:
    hashed_password = bcrypt.hash(data.password)
    return await User.create(email=data.email, hashed_password=hashed_password)


async def get_user_by_email(email: str) -> User | None:
    return await User.get_or_none(email=email)


async def get_user_by_id(user_id: int) -> User | None:
    return await User.get_or_none(id=user_id)


async def update_user(user_id: int, data: UserUpdate) -> User:
    user = await User.get(id=user_id)
    update_data = data.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = bcrypt.hash(update_data.pop("password"))
    await user.update_from_dict(update_data).save()
    return user


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.verify(plain_password, hashed_password)
