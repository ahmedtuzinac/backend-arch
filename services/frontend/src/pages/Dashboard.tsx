import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { getMe, logout } from '../api/auth';
import { AppSettingsContext, useLoadAppSettings } from '../hooks/useAppSettings';
import { useWebSocket } from '../hooks/useWebSocket';
import Users from './admin/Users';
import AuditLog from './admin/AuditLog';
import Health from './admin/Health';
import Settings from './admin/Settings';
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
  const appSettings = useLoadAppSettings();
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
    `flex items-center px-3 py-2.5 text-sm rounded-lg ${
      isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
    }`;

  return (
    <AppSettingsContext.Provider value={appSettings}>
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 flex items-center h-14 shrink-0">
        <div className="w-64 px-5 flex items-center h-full">
          {appSettings.settings.app_logo_url && (
            <img src={appSettings.settings.app_logo_url} alt="" className="h-7 mr-2" />
          )}
          <span className="text-base font-semibold" style={{ color: appSettings.settings.primary_color }}>{appSettings.settings.app_name}</span>
        </div>
        <div className="flex-1 px-6 flex items-center justify-end">
          <div className="flex items-center gap-5">
            <NavLink to="/profile" className="text-sm text-gray-600 hover:text-gray-900">
              {user.email}
              <span className="ml-2 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {user.role}
              </span>
            </NavLink>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <nav className="p-3 space-y-1">
          <NavLink to="/" end className={linkClass}>
            <svg className="inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>
            Home
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/health" className={linkClass}>
                <svg className="inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                Health
              </NavLink>
              <NavLink to="/users" className={linkClass}>
                <svg className="inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                Users
              </NavLink>
            </>
          )}
          <NavLink to="/profile" className={linkClass}>
            <svg className="inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Profile
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/audit" className={linkClass}>
                <svg className="inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" /></svg>
                Audit Log
              </NavLink>
              <NavLink to="/settings" className={linkClass}>
                <svg className="inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><circle cx="12" cy="12" r="3" /></svg>
                Settings
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1">
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
            {isAdmin && <Route path="settings" element={<Settings />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      </div>
    </div>
    </AppSettingsContext.Provider>
  );
}
