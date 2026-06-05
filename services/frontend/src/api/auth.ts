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
  created_at: string;
  updated_at: string;
}

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
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
  accessToken = data.access_token;
  return data;
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
}
