from typing import Annotated

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user, require_role
from app.users.models import User, UserRole
from app.users.schemas import UserCreate, UserResponse, UserUpdate
from app.users.service import create_user, get_user_by_email, update_user
from app.workers.enqueue import enqueue
from core_shared.pagination import PaginatedResponse, paginate

router = APIRouter(prefix="/users", tags=["users"])

AdminUser = Annotated[User, Depends(require_role(UserRole.SYSTEM, UserRole.ADMIN))]


# --- User endpoints (any authenticated user) - must be before /{user_id} ---


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
):
    return await update_user(current_user.id, data)


# --- Admin endpoints ---


@router.get("/", response_model=PaginatedResponse[UserResponse])
async def list_users(
    _current_user: AdminUser,
    page: int = 1,
    per_page: int = 20,
    role: str | None = None,
    is_active: bool | None = None,
):
    query = User.all().order_by("-created_at")
    if role:
        query = query.filter(role=role)
    if is_active is not None:
        query = query.filter(is_active=is_active)
    return await paginate(query, page=page, per_page=per_page)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(_current_user: AdminUser, data: UserCreate):
    existing = await get_user_by_email(data.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = await create_user(data)
    if data.role != "employee":
        user.role = data.role
        await user.save()
    await enqueue("send_welcome_email", user_id=user.id)
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(_current_user: AdminUser, user_id: int):
    user = await User.get_or_none(id=user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user_by_id(_current_user: AdminUser, user_id: int, data: UserUpdate):
    user = await User.get_or_none(id=user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    update_data = data.model_dump(exclude_unset=True)
    if "role" in update_data:
        user.role = update_data.pop("role")
    if "is_active" in update_data:
        user.is_active = update_data.pop("is_active")
    if "password" in update_data:
        update_data["hashed_password"] = bcrypt.hashpw(update_data.pop("password").encode(), bcrypt.gensalt()).decode()
    if update_data:
        await user.update_from_dict(update_data)
    await user.save()
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(_current_user: AdminUser, user_id: int):
    user = await User.get_or_none(id=user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = False
    await user.save()
