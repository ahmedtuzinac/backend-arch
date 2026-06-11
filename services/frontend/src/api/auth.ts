const AUTH_URL = '/auth';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string | null;
  scope: string;
}

interface UserResponse {
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

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

function setTokens(access: string, refresh: string | null): void {
  accessToken = access;
  if (refresh) {
    localStorage.setItem('refresh_token', refresh);
  }
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.append('grant_type', 'password');
  body.append('username', email);
  body.append('password', password);

  const res = await fetch(`${AUTH_URL}/token`, {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  }

  const data: TokenResponse = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function restoreSession(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${AUTH_URL}/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem('refresh_token');
      return false;
    }

    const data: TokenResponse = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    localStorage.removeItem('refresh_token');
    return false;
  }
}

export async function getMe(): Promise<UserResponse> {
  const res = await fetch(`${AUTH_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user');
  }

  return res.json();
}

export function logout(): void {
  accessToken = null;
  localStorage.removeItem('refresh_token');
}
