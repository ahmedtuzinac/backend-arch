import { useEffect, useState } from 'react';
import { getMe, logout } from '../api/auth';
import { useWebSocket } from '../hooks/useWebSocket';
import Users from './admin/Users';

interface DashboardProps {
  onLogout: () => void;
}

interface User {
  id: number;
  email: string;
  role: string;
}

type Page = 'home' | 'users';

export default function Dashboard({ onLogout }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<Page>('home');
  useWebSocket();

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

  const isAdmin = user.role === 'admin' || user.role === 'system';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 min-h-screen">
        <div className="p-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Dashboard</span>
        </div>
        <nav className="p-2">
          <button
            onClick={() => setActivePage('home')}
            className={`w-full text-left px-3 py-2 text-sm rounded-md ${
              activePage === 'home' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Home
          </button>
          {isAdmin && (
            <button
              onClick={() => setActivePage('users')}
              className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                activePage === 'users' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Users
            </button>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-3 flex items-center justify-end">
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
        </header>

        <main className="p-6">
          {activePage === 'home' && (
            <div>
              <h1 className="text-lg font-semibold text-gray-900 mb-4">
                Welcome, {user.email}
              </h1>
              <p className="text-sm text-gray-600">
                You are signed in as <strong>{user.role}</strong>.
              </p>
            </div>
          )}
          {activePage === 'users' && isAdmin && <Users />}
        </main>
      </div>
    </div>
  );
}
