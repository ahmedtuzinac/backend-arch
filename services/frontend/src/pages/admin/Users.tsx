import { useEffect, useState } from 'react';
import { listUsers, createUser, updateUser, deactivateUser, type User } from '../../api/admin';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  const loadUsers = async (p = page) => {
    try {
      const data = await listUsers(p);
      setUsers(data.items);
      setPages(data.pages);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      setError('Failed to load users');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Users</h2>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setEditUser(null); }}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800"
        >
          Add user
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>
      )}

      {(showCreate || editUser) && (
        <UserForm
          user={editUser}
          onClose={() => { setShowCreate(false); setEditUser(null); }}
          onSaved={() => { setShowCreate(false); setEditUser(null); loadUsers(); }}
        />
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 text-gray-900">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'system' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => { setEditUser(user); setShowCreate(false); }}
                    className="text-gray-500 hover:text-gray-900 mr-3"
                  >
                    Edit
                  </button>
                  {user.is_active && (
                    <button
                      onClick={async () => {
                        await deactivateUser(user.id);
                        loadUsers();
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => loadUsers(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => loadUsers(page + 1)}
            disabled={page >= pages}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
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
        <h3 className="text-sm font-semibold text-gray-900">
          {isEdit ? `Edit ${user.email}` : 'Create new user'}
        </h3>
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

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
