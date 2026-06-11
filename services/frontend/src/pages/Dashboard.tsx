import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { getMe, logout } from '../api/auth';
import { useWebSocket } from '../hooks/useWebSocket';
import Users from './admin/Users';
import AuditLog from './admin/AuditLog';
import Health from './admin/Health';
import Profile from './Profile';

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
  const navigate = useNavigate();
  useWebSocket();

  useEffect(() => {
    getMe().then(setUser).catch(() => onLogout());
  }, [onLogout]);

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 text-sm rounded-md ${
      isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 min-h-screen">
        <div className="p-4 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900">Dashboard</span>
        </div>
        <nav className="p-2">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            Profile
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/users" className={linkClass}>
                Users
              </NavLink>
              <NavLink to="/audit" className={linkClass}>
                Audit Log
              </NavLink>
              <NavLink to="/health" className={linkClass}>
                Health
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-3 flex items-center justify-end">
            <div className="flex items-center gap-4">
              <NavLink to="/profile" className="text-sm text-gray-600 hover:text-gray-900">
                {user.email}
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {user.role}
                </span>
              </NavLink>
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900">
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Routes>
            <Route
              index
              element={
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 mb-4">Welcome, {user.email}</h1>
                  <p className="text-sm text-gray-600">
                    You are signed in as <strong>{user.role}</strong>.
                  </p>
                </div>
              }
            />
            <Route path="profile" element={<Profile />} />
            {isAdmin && <Route path="users" element={<Users />} />}
            {isAdmin && <Route path="audit" element={<AuditLog />} />}
            {isAdmin && <Route path="health" element={<Health />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
