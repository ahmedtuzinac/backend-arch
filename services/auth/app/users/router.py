from typing import Annotated

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user, require_role
from app.users.models import User, UserRole
from app.users.schemas import UserCreate, UserResponse, UserUpdate
from app.users.service import create_user, get_user_by_email, update_user
from app.workers.enqueue import enqueue
from core_shared.audit import log_action
from core_shared.communication import ServiceClient
from core_shared.pagination import PaginatedResponse, paginate
from core_shared.table import ColumnDef, FilterDef, TableConfig

ws_client = ServiceClient(base_url="http://websocket:8002")


async def notify_table_update(table: str) -> None:
    import contextlib

    with contextlib.suppress(Exception):
        await ws_client.post("/messages/broadcast", json={
            "type": "table_updated",
            "table": table,
        })

router = APIRouter(prefix="/users", tags=["users"])

AdminUser = Annotated[User, Depends(require_role(UserRole.SYSTEM, UserRole.ADMIN))]

users_table_config = TableConfig(
    name="users",
    columns=[
        ColumnDef(
            key="avatar_url",
            label="",
            type="avatar",
        ),
        ColumnDef(
            key="first_name",
            label="First Name",
            type="text",
            sortable=True,
        ),
        ColumnDef(
            key="last_name",
            label="Last Name",
            type="text",
            sortable=True,
        ),
        ColumnDef(
            key="email",
            label="Email",
            type="text",
            sortable=True,
        ),
        ColumnDef(
            key="phone",
            label="Phone",
            type="text",
        ),
        ColumnDef(
            key="role",
            label="Role",
            type="badge",
            sortable=True,
            options=["system", "admin", "employee"],
            badge_colors={
                "system": "bg-red-100 text-red-700",
                "admin": "bg-purple-100 text-purple-700",
                "employee": "bg-gray-100 text-gray-600",
            },
        ),
        ColumnDef(
            key="is_active",
            label="Status",
            type="boolean",
        ),
        ColumnDef(
            key="created_at",
            label="Created",
            type="date",
            sortable=True,
        ),
    ],
    filters=[
        FilterDef(
            key="role",
            label="Role",
            type="select",
            options=[
                {"value": "employee", "label": "Employee"},
                {"value": "admin", "label": "Admin"},
                {"value": "system", "label": "System"},
            ],
        ),
        FilterDef(
            key="is_active",
            label="Status",
            type="select",
            options=[
                {"value": "true", "label": "Active"},
                {"value": "false", "label": "Inactive"},
            ],
        ),
    ],
    searchable=True,
    search_field="email",
    search_placeholder="Search by name or email...",
    actions=["edit", "deactivate"],
)


# --- Table config ---


@router.get("/config", response_model=TableConfig)
async def get_table_config(_current_user: AdminUser):
    return users_table_config


# --- User endpoints (any authenticated user) - must be before /{user_id} ---


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
):
    user = await update_user(current_user.id, data)
    await notify_table_update("users")
    return user


# --- Admin endpoints ---


@router.get("/", response_model=PaginatedResponse[UserResponse])
async def list_users(
    _current_user: AdminUser,
    page: int = 1,
    per_page: int = 20,
    role: str | None = None,
    is_active: bool | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
):
    query = User.all()
    if role:
        query = query.filter(role=role)
    if is_active is not None:
        query = query.filter(is_active=is_active)
    if search:
        from tortoise.expressions import Q

        query = query.filter(
            Q(email__icontains=search)
            | Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
        )
    order_field = sort_by if sort_order == "asc" else f"-{sort_by}"
    query = query.order_by(order_field)
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
    await log_action(
        actor_id=_current_user.id,
        actor_email=_current_user.email,
        action="created",
        resource="user",
        resource_id=user.id,
        details={"email": user.email, "role": user.role},
    )
    await notify_table_update("users")
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
    await log_action(
        actor_id=_current_user.id,
        actor_email=_current_user.email,
        action="updated",
        resource="user",
        resource_id=user.id,
        details=data.model_dump(exclude_unset=True, exclude={"password"}),
    )
    await notify_table_update("users")
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(_current_user: AdminUser, user_id: int):
    user = await User.get_or_none(id=user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = False
    await user.save()
    await log_action(
        actor_id=_current_user.id,
        actor_email=_current_user.email,
        action="deactivated",
        resource="user",
        resource_id=user.id,
        details={"email": user.email},
    )
    await notify_table_update("users")
