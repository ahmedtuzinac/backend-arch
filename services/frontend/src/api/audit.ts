import { getAccessToken } from './auth';

const AUTH_URL = '/auth';

export interface AuditEntry {
  id: number;
  actor_id: number;
  actor_email: string;
  action: string;
  resource: string;
  resource_id: number | null;
  details: Record<string, unknown>;
  created_at: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export async function listAuditLogs(
  page = 1,
  perPage = 20,
  action?: string,
  resource?: string,
): Promise<PaginatedResponse<AuditEntry>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('per_page', String(perPage));
  if (action) params.set('action', action);
  if (resource) params.set('resource', resource);

  const res = await fetch(`${AUTH_URL}/audit/?${params}`, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}
