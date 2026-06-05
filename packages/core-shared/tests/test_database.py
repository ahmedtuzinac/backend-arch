from core_shared.database import BaseModel, TimestampMixin, SoftDeleteMixin


def test_base_model_has_id_field():
    field_names = BaseModel._meta.fields_map.keys()
    assert "id" in field_names


def test_timestamp_mixin_has_fields():
    assert hasattr(TimestampMixin, "created_at")
    assert hasattr(TimestampMixin, "updated_at")


def test_soft_delete_mixin_has_fields():
    assert hasattr(SoftDeleteMixin, "deleted_at")
    assert hasattr(SoftDeleteMixin, "is_deleted")
