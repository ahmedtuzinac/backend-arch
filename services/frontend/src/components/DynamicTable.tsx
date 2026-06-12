import { useCallback, useEffect, useState } from 'react';
import { getAccessToken } from '../api/auth';
import { useAppSettings } from '../hooks/useAppSettings';
import { useWSListener } from '../hooks/useWebSocket';

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
  userId?: number;
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
  userId = 0,
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
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const hdrs = (): HeadersInit => ({
    Authorization: `Bearer ${getAccessToken()}`,
    'Content-Type': 'application/json',
  });

  const loadPreferences = async (tableName: string) => {
    try {
      const res = await fetch(`/auth/table-preferences/${tableName}?user_id=${userId}`, { headers: hdrs() });
      if (res.ok) {
        const data = await res.json();
        setHiddenColumns(data.hidden_columns || []);
        if (data.column_order?.length) setColumnOrder(data.column_order);
      }
    } catch { /* ignore */ }
  };

  const savePreferences = async (hidden: string[], order: string[]) => {
    if (!config) return;
    try {
      await fetch(`/auth/table-preferences/${config.name}?user_id=${userId}`, {
        method: 'PUT',
        headers: hdrs(),
        body: JSON.stringify({ hidden_columns: hidden, column_order: order }),
      });
    } catch { /* ignore */ }
  };

  const toggleColumn = (key: string) => {
    const updated = hiddenColumns.includes(key)
      ? hiddenColumns.filter((k) => k !== key)
      : [...hiddenColumns, key];
    setHiddenColumns(updated);
    savePreferences(updated, columnOrder);
  };

  const moveColumn = (key: string, direction: -1 | 1) => {
    const order = columnOrder.length ? [...columnOrder] : config!.columns.map((c) => c.key);
    const idx = order.indexOf(key);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= order.length) return;
    [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
    setColumnOrder(order);
    savePreferences(hiddenColumns, order);
  };

  useEffect(() => {
    fetch(configUrl, { headers: hdrs() })
      .then((r) => r.json())
      .then((c: TableConfig) => {
        setConfig(c);
        const defaultSort = c.columns.find((col) => col.sortable);
        if (defaultSort) setSortBy(defaultSort.key);
        loadPreferences(c.name);
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

        const res = await fetch(`${dataUrl}?${params}`, { headers: hdrs() });
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

  // Real-time: reload when table is updated via WebSocket
  useWSListener('table_updated', (data) => {
    if (config && data.table === config.name) {
      loadData();
    }
  });

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

  const { settings: appSettings } = useAppSettings();

  const formatDate = (value: string) => {
    const d = new Date(value);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    switch (appSettings.date_format) {
      case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
      default: return `${day}/${month}/${year}`;
    }
  };

  const renderCell = (col: ColumnDef, value: unknown, item: Record<string, unknown>) => {
    if (col.type === 'avatar') {
      const url = String(value || '');
      const firstName = String(item.first_name || '');
      const lastName = String(item.last_name || '');
      const email = String(item.email || '');
      const initials = firstName && lastName
        ? `${firstName[0]}${lastName[0]}`.toUpperCase()
        : email ? email[0].toUpperCase() : '?';
      const isOnline = showOnlineStatus && onlineUserIds.includes(String(item.id));

      return (
        <div className="relative w-10 h-10">
          {url ? (
            <img src={url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold"
              style={{ backgroundColor: appSettings.primary_color }}
            >
              {initials}
            </div>
          )}
          {showOnlineStatus && (
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
            />
          )}
        </div>
      );
    }
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
      return formatDate(String(value));
    }
    return String(value ?? '');
  };

  if (!config) {
    return <p className="text-gray-500 text-sm">Loading...</p>;
  }

  const hasActiveFilters = search || Object.values(filters).some((v) => v);
  const orderedColumns = columnOrder.length
    ? columnOrder.map((key) => config.columns.find((c) => c.key === key)).filter(Boolean) as ColumnDef[]
    : config.columns;
  const visibleColumns = orderedColumns.filter((col) => !hiddenColumns.includes(col.key));
  const pickerColumns = columnOrder.length
    ? columnOrder.map((key) => config.columns.find((c) => c.key === key)).filter(Boolean) as ColumnDef[]
    : config.columns;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg className="inline w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Columns
              {hiddenColumns.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">{config.columns.length - hiddenColumns.length}/{config.columns.length}</span>
              )}
            </button>
            {showColumnPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowColumnPicker(false)} />
                <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Columns</span>
                    <button onClick={() => setShowColumnPicker(false)} className="text-gray-400 hover:text-gray-600 text-sm">&times;</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {pickerColumns.map((col, idx) => (
                      <div key={col.key} className="flex items-center px-3 py-1.5 hover:bg-gray-50 group">
                        <input
                          type="checkbox"
                          checked={!hiddenColumns.includes(col.key)}
                          onChange={() => toggleColumn(col.key)}
                          className="mr-2 rounded border-gray-300"
                        />
                        <span className="text-sm flex-1">{col.label}</span>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                          <button
                            onClick={() => moveColumn(col.key, -1)}
                            disabled={idx === 0}
                            className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 14l5-5 5 5" /></svg>
                          </button>
                          <button
                            onClick={() => moveColumn(col.key, 1)}
                            disabled={idx === pickerColumns.length - 1}
                            className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10l5 5 5-5" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          {onAdd && (
            <button onClick={onAdd} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800">
              Add {config.name.slice(0, -1)}
            </button>
          )}
        </div>
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
              {visibleColumns.map((col) => (
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
              return (
                <tr key={String(item.id ?? idx)} className="border-b border-gray-100 last:border-0">
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-900">
                      {renderCell(col, item[col.key], item)}
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
