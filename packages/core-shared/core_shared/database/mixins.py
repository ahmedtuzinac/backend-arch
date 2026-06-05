from tortoise import fields


class TimestampMixin:
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)


class SoftDeleteMixin:
    deleted_at = fields.DatetimeField(null=True)
    is_deleted = fields.BooleanField(default=False)
