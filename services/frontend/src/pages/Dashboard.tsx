import { useEffect, useState } from 'react';
import { getMe, logout } from '../api/auth';

interface DashboardProps {
  onLogout: () => void;
}

interface User {
  id: number;
  email: string;
  role: string;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getMe().then(setUser).catch(() => onLogout());
  }, [onLogout]);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">Dashboard</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user.email}
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {user.role}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-lg font-semibold text-gray-900 mb-4">
          Welcome, {user.email}
        </h1>
        <p className="text-sm text-gray-600">
          You are signed in as <strong>{user.role}</strong>.
        </p>
      </main>
    </div>
  );
}
