import { useCallback, useEffect, useState } from 'react';
import { getAccessToken } from '../api/auth';

interface ColumnDef {
  key: string;
  label: string;
  type: string;
  sortable: boolean;
  options?: string[];
  badge_colors?: Record<string, string>;
}

interface FilterDef {
  key: string;
  label: string;
  type: string;
  options?: { value: string; label: string }[];
}

interface TableConfig {
  name: string;
  columns: ColumnDef[];
  filters: FilterDef[];
  searchable: boolean;
  search_field?: string;
  search_placeholder?: string;
  actions: string[];
}

interface PaginatedResponse {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

interface DynamicTableProps {
  configUrl: string;
  dataUrl: string;
  title: string;
  onAdd?: () => void;
  onEdit?: (item: Record<string, unknown>) => void;
  onDeactivate?: (item: Record<string, unknown>) => void;
  onlineUserIds?: string[];
  showOnlineStatus?: boolean;
}

export default function DynamicTable({
  configUrl,
  dataUrl,
  title,
  onAdd,
  onEdit,
  onDeactivate,
  onlineUserIds = [],
  showOnlineStatus = false,
}: DynamicTableProps) {
  const [config, setConfig] = useState<TableConfig | null>(null);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const headers = (): HeadersInit => ({
    Authorization: `Bearer ${getAccessToken()}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    fetch(configUrl, { headers: headers() })
      .then((r) => r.json())
      .then((c: TableConfig) => {
        setConfig(c);
        const defaultSort = c.columns.find((col) => col.sortable);
        if (defaultSort) setSortBy(defaultSort.key);
      })
      .catch(() => setError('Failed to load table config'));
  }, [configUrl]);

  const loadData = useCallback(
    async (p = page) => {
      if (!config) return;
      try {
        const params = new URLSearchParams();
        params.set('page', String(p));
        if (search && config.search_field) params.set('search', search);
        for (const [k, v] of Object.entries(filters)) {
          if (v) params.set(k, v);
        }
        if (sortBy) params.set('sort_by', sortBy);
        params.set('sort_order', sortOrder);

        const res = await fetch(`${dataUrl}?${params}`, { headers: headers() });
        if (!res.ok) throw new Error();
        const data: PaginatedResponse = await res.json();
        setItems(data.items);
        setPages(data.pages);
        setTotal(data.total);
        setPage(data.page);
      } catch {
        setError('Failed to load data');
      }
    },
    [config, search, filters, sortBy, sortOrder, dataUrl, page],
  );

  useEffect(() => {
    if (config) loadData(1);
  }, [config, search, filters, sortBy, sortOrder]);

  const toggleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const sortIcon = (key: string) => {
    const inactive = (
      <svg className="inline w-3.5 h-3.5 ml-1 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 10l5-5 5 5M7 14l5 5 5-5" />
      </svg>
    );
    const asc = (
      <svg className="inline w-3.5 h-3.5 ml-1 text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 14l5-5 5 5" />
      </svg>
    );
    const desc = (
      <svg className="inline w-3.5 h-3.5 ml-1 text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 10l5 5 5-5" />
      </svg>
    );
    if (sortBy !== key) return inactive;
    return sortOrder === 'asc' ? asc : desc;
  };

  const renderCell = (col: ColumnDef, value: unknown) => {
    if (col.type === 'badge') {
      const colorClass = col.badge_colors?.[String(value)] || 'bg-gray-100 text-gray-600';
      return <span className={`px-2 py-0.5 text-xs rounded-full ${colorClass}`}>{String(value)}</span>;
    }
    if (col.type === 'boolean') {
      const active = value === true || value === 'true';
      return (
        <span className={`px-2 py-0.5 text-xs rounded-full ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {active ? 'Active' : 'Inactive'}
        </span>
      );
    }
    if (col.type === 'date' || col.type === 'datetime') {
      return new Date(String(value)).toLocaleDateString();
    }
    return String(value ?? '');
  };

  if (!config) {
    return <p className="text-gray-500 text-sm">Loading...</p>;
  }

  const hasActiveFilters = search || Object.values(filters).some((v) => v);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        {onAdd && (
          <button onClick={onAdd} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800">
            Add {config.name.slice(0, -1)}
          </button>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>}

      {/* Filters */}
      {(config.searchable || config.filters.length > 0) && (
        <div className="mb-4 flex gap-3 items-center">
          {config.searchable && (
            <input
              type="text"
              placeholder={config.search_placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          )}
          {config.filters.map((f) => (
            <select
              key={f.key}
              value={filters[f.key] || ''}
              onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">All {f.label.toLowerCase()}s</option>
              {f.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch('');
                setFilters({});
              }}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {showOnlineStatus && <th className="text-left px-4 py-3 font-medium text-gray-600 w-8"></th>}
              {config.columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-4 py-3 font-medium text-gray-600 ${col.sortable ? 'cursor-pointer hover:text-gray-900' : ''}`}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  {col.label}
                  {col.sortable && sortIcon(col.key)}
                </th>
              ))}
              {config.actions.length > 0 && (
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const isOnline = showOnlineStatus && onlineUserIds.includes(String(item.id));
              return (
                <tr key={String(item.id ?? idx)} className="border-b border-gray-100 last:border-0">
                  {showOnlineStatus && (
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
                        title={isOnline ? 'Online' : 'Offline'}
                      />
                    </td>
                  )}
                  {config.columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-900">
                      {renderCell(col, item[col.key])}
                    </td>
                  ))}
                  {config.actions.length > 0 && (
                    <td className="px-4 py-3 text-right">
                      {config.actions.includes('edit') && onEdit && (
                        <button onClick={() => onEdit(item)} className="text-gray-500 hover:text-gray-900 mr-3">
                          Edit
                        </button>
                      )}
                      {config.actions.includes('deactivate') && onDeactivate && Boolean(item.is_active) && (
                        <button onClick={() => onDeactivate(item)} className="text-red-500 hover:text-red-700">
                          Deactivate
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => loadData(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => loadData(page + 1)}
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
