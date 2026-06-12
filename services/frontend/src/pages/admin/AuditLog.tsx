import { useEffect, useState } from 'react';
import { listAuditLogs, type AuditEntry } from '../../api/audit';
import { listUsers, type User } from '../../api/admin';
import { useI18n } from '../../hooks/useI18n';
import { useAppSettings } from '../../hooks/useAppSettings';

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-700',
  updated: 'bg-blue-100 text-blue-700',
  deactivated: 'bg-red-100 text-red-700',
};

function formatDetails(details: Record<string, unknown>): string {
  return Object.entries(details)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [error, setError] = useState('');
  const [userMap, setUserMap] = useState<Record<number, User>>({});
  const { t } = useI18n();
  const { settings: appSettings } = useAppSettings();

  const loadUsers = async () => {
    try {
      const data = await listUsers({ perPage: 100 });
      const map: Record<number, User> = {};
      for (const u of data.items) map[u.id] = u;
      setUserMap(map);
    } catch { /* ignore */ }
  };

  const load = async (p = page) => {
    try {
      const data = await listAuditLogs(p, 20, actionFilter || undefined);
      setEntries(data.items);
      setPages(data.pages);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      setError('Failed to load audit log');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    load(1);
  }, [actionFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('audit.title')}</h2>
          <p className="text-sm text-gray-500">{total} {t('audit.entries')}</p>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>}

      <div className="mb-4">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">{t('audit.all_actions')}</option>
          <option value="created">{t('audit.created')}</option>
          <option value="updated">{t('audit.updated')}</option>
          <option value="deactivated">{t('audit.deactivated')}</option>
        </select>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-3">
            {(() => {
              const user = userMap[entry.actor_id];
              const avatarUrl = user?.avatar_url;
              const firstName = user?.first_name || '';
              const lastName = user?.last_name || '';
              const initials = firstName && lastName
                ? `${firstName[0]}${lastName[0]}`.toUpperCase()
                : entry.actor_email[0].toUpperCase();
              return avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                  style={{ backgroundColor: appSettings.primary_color }}
                >
                  {initials}
                </div>
              );
            })()}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">{entry.actor_email}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${ACTION_COLORS[entry.action] || 'bg-gray-100 text-gray-600'}`}>
                  {entry.action}
                </span>
                <span className="text-sm text-gray-600">
                  {entry.resource}
                  {entry.resource_id && <span className="text-gray-400"> #{entry.resource_id}</span>}
                </span>
              </div>
              {Object.keys(entry.details).length > 0 && (
                <p className="text-xs text-gray-500">{formatDetails(entry.details)}</p>
              )}
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(entry.created_at)}</span>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No audit entries yet</p>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => load(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => load(page + 1)}
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
