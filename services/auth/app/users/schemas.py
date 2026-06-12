from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "employee"
    first_name: str = ""
    last_name: str = ""


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: str | None = None
    role: str | None = None
    is_active: bool | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    language: str | None = None


class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    role: str
    first_name: str
    last_name: str
    phone: str
    avatar_url: str
    language: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
