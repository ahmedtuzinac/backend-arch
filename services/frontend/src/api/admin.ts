import { getAccessToken } from './auth';

const AUTH_URL = '/auth';
const WS_URL = '/ws';

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  role: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    'Content-Type': 'application/json',
  };
}

export interface UserFilters {
  page?: number;
  perPage?: number;
  role?: string;
  isActive?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export async function listUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
  const params = new URLSearchParams();
  params.set('page', String(filters.page || 1));
  params.set('per_page', String(filters.perPage || 20));
  if (filters.role) params.set('role', filters.role);
  if (filters.isActive) params.set('is_active', filters.isActive);
  if (filters.search) params.set('search', filters.search);
  if (filters.sortBy) params.set('sort_by', filters.sortBy);
  if (filters.sortOrder) params.set('sort_order', filters.sortOrder);

  const res = await fetch(`${AUTH_URL}/users/?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function createUser(data: { email: string; password: string; role: string }): Promise<User> {
  const res = await fetch(`${AUTH_URL}/users/register`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to create user');
  }
  return res.json();
}

export async function updateUser(
  userId: number,
  data: { email?: string; password?: string; role?: string; is_active?: boolean }
): Promise<User> {
  const res = await fetch(`${AUTH_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to update user');
  }
  return res.json();
}

export async function deactivateUser(userId: number): Promise<void> {
  const res = await fetch(`${AUTH_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to deactivate user');
}

export async function getOnlineUsers(): Promise<string[]> {
  const res = await fetch(`${WS_URL}/messages/online`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.user_ids;
}
