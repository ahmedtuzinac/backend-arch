from enum import StrEnum

from tortoise import fields

from core_shared.database import BaseModel
from core_shared.database.mixins import TimestampMixin


class UserRole(StrEnum):
    SYSTEM = "system"
    ADMIN = "admin"
    EMPLOYEE = "employee"


class User(BaseModel, TimestampMixin):
    email = fields.CharField(max_length=255, unique=True, index=True)
    hashed_password = fields.CharField(max_length=255)
    is_active = fields.BooleanField(default=True)
    role = fields.CharEnumField(UserRole, default=UserRole.EMPLOYEE)
    first_name = fields.CharField(max_length=100, default="")
    last_name = fields.CharField(max_length=100, default="")
    phone = fields.CharField(max_length=50, default="")
    avatar_url = fields.CharField(max_length=512, default="")
    language = fields.CharField(max_length=10, default="en")

    class Meta:
        table = "users"

    @property
    def is_admin(self) -> bool:
        return self.role in (UserRole.SYSTEM, UserRole.ADMIN)

    @property
    def is_system(self) -> bool:
        return self.role == UserRole.SYSTEM
