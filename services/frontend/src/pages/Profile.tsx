import { useEffect, useState } from 'react';
import { getMe, getAccessToken } from '../api/auth';

interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMe().then((u) => {
      setUser(u);
      setEmail(u.email);
    });
  }, []);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    if (!user || email === user.email) return;

    setLoading(true);
    try {
      const res = await fetch('/auth/users/me', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update email');
      }
      const updated = await res.json();
      setUser(updated);
      setProfileMsg('Email updated');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/auth/users/me', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update password');
      }
      setPasswordMsg('Password updated');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <p className="text-gray-500 text-sm">Loading...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold text-gray-900 mb-6">Profile</h1>

      {/* Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Account info</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Role</span>
            <p className="text-gray-900 font-medium mt-1">
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : user.role === 'system'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                {user.role}
              </span>
            </p>
          </div>
          <div>
            <span className="text-gray-500">Member since</span>
            <p className="text-gray-900 mt-1">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Email</h2>
        <form onSubmit={handleEmailUpdate} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          {profileMsg && <p className="text-sm text-green-600">{profileMsg}</p>}
          {profileError && <p className="text-sm text-red-600">{profileError}</p>}
          <button
            type="submit"
            disabled={loading || email === user.email}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            Update email
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Change password</h2>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          {passwordMsg && <p className="text-sm text-green-600">{passwordMsg}</p>}
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          <button
            type="submit"
            disabled={loading || !newPassword}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
