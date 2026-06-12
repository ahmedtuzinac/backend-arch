import { useEffect, useState } from 'react';
import { getMe, getAccessToken } from '../api/auth';
import { useI18n } from '../hooks/useI18n';

interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
  language: string;
  created_at: string;
}

function getInitials(user: User): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  }
  return user.email[0].toUpperCase();
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const i18n = useI18n();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMe().then((u: User) => {
      setUser(u);
      setFirstName(u.first_name);
      setLastName(u.last_name);
      setEmail(u.email);
      setPhone(u.phone);
      setAvatarUrl(u.avatar_url);
      setLanguage(u.language || 'en');
    });
  }, []);

  const updateProfile = async (data: Record<string, unknown>, setMsg: (s: string) => void, setErr: (s: string) => void) => {
    setMsg('');
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/auth/users/me', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update');
      }
      const updated = await res.json();
      setUser(updated);
      setMsg('Saved');
    } catch (err) {
      setErr(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, string> = {};
    if (user && firstName !== user.first_name) data.first_name = firstName;
    if (user && lastName !== user.last_name) data.last_name = lastName;
    if (user && email !== user.email) data.email = email;
    if (user && phone !== user.phone) data.phone = phone;
    if (user && avatarUrl !== user.avatar_url) data.avatar_url = avatarUrl;
    if (user && language !== user.language) data.language = language;
    if (Object.keys(data).length === 0) return;
    await updateProfile(data, setProfileMsg, setProfileError);
    if (data.language) i18n.setLang(data.language);
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
    await updateProfile({ password: newPassword }, setPasswordMsg, setPasswordError);
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!user) {
    return <p className="text-gray-500 text-sm">Loading...</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold text-gray-900 mb-6">Profile</h1>

      {/* Avatar + Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-5">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {getInitials(user)}
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.email}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex items-center gap-3 mt-1">
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
              <span className="text-xs text-gray-400">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Personal information</h2>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="+381 61 123 4567"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {i18n.languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>

          {profileMsg && <p className="text-sm text-green-600">{profileMsg}</p>}
          {profileError && <p className="text-sm text-red-600">{profileError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            Save changes
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Change password</h2>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
