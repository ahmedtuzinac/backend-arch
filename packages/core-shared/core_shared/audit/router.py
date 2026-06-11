from fastapi import APIRouter

from core_shared.audit.models import AuditLog
from core_shared.audit.schemas import AuditLogResponse
from core_shared.pagination import PaginatedResponse, paginate

audit_router = APIRouter(prefix="/audit", tags=["audit"])


@audit_router.get("/", response_model=PaginatedResponse[AuditLogResponse])
async def list_audit_logs(
    page: int = 1,
    per_page: int = 20,
    action: str | None = None,
    resource: str | None = None,
    actor_email: str | None = None,
):
    query = AuditLog.all().order_by("-created_at")
    if action:
        query = query.filter(action=action)
    if resource:
        query = query.filter(resource=resource)
    if actor_email:
        query = query.filter(actor_email__icontains=actor_email)
    return await paginate(query, page=page, per_page=per_page)
