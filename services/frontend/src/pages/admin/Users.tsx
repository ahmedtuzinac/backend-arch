import { useEffect, useState } from 'react';
import DynamicTable from '../../components/DynamicTable';
import { createUser, updateUser, deactivateUser, getOnlineUsers, type User } from '../../api/admin';
import { getMe } from '../../api/auth';

export default function Users() {
  const [currentUserId, setCurrentUserId] = useState(0);

  useEffect(() => {
    getMe().then((u) => setCurrentUserId(u.id));
  }, []);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadOnline = async () => {
      const ids = await getOnlineUsers();
      setOnlineUserIds(ids);
    };
    loadOnline();
    const interval = setInterval(loadOnline, 5000);
    return () => clearInterval(interval);
  }, []);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div>
      {(showForm || editUser) && (
        <UserForm
          user={editUser}
          onClose={() => {
            setShowForm(false);
            setEditUser(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditUser(null);
            refresh();
          }}
        />
      )}

      <DynamicTable
        key={refreshKey}
        configUrl="/auth/users/config"
        dataUrl="/auth/users/"
        title="Users"
        showOnlineStatus
        onlineUserIds={onlineUserIds}
        userId={currentUserId}
        onAdd={() => {
          setShowForm(true);
          setEditUser(null);
        }}
        onEdit={(item) => {
          setEditUser(item as unknown as User);
          setShowForm(false);
        }}
        onDeactivate={async (item) => {
          await deactivateUser(item.id as number);
          refresh();
        }}
      />
    </div>
  );
}

function UserForm({
  user,
  onClose,
  onSaved,
}: {
  user: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'employee');
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = !!user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        const data: Record<string, unknown> = { role, is_active: isActive };
        if (email !== user.email) data.email = email;
        if (password) data.password = password;
        await updateUser(user.id, data);
      } else {
        await createUser({ email, password, role });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{isEdit ? `Edit ${user.email}` : 'Create new user'}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={!isEdit}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {isEdit && <span className="text-gray-400">(leave empty to keep)</span>}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEdit}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="system">System</option>
            </select>
          </div>
          {isEdit && (
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Active
              </label>
            </div>
          )}
        </div>

        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
