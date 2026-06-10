import { getAccessToken } from './auth';

const AUTH_URL = '/auth';

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  role: string;
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

export async function listUsers(page = 1, perPage = 20): Promise<PaginatedResponse<User>> {
  const res = await fetch(`${AUTH_URL}/users/?page=${page}&per_page=${perPage}`, {
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
