import { useEffect, useState } from 'react';
import { getAccessToken } from '../api/auth';
import { useAppSettings } from '../hooks/useAppSettings';
import { useWSListener } from '../hooks/useWebSocket';

interface FileItem {
  id: number;
  filename: string;
  original_filename: string;
  content_type: string;
  size: number;
  url: string;
  thumbnail_url: string;
  category: string;
  uploaded_by: number;
  created_at: string;
}

interface PaginatedResponse {
  items: FileItem[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(contentType: string): boolean {
  return contentType.startsWith('image/');
}

function getFileIcon(contentType: string): string {
  if (contentType.startsWith('image/')) return '🖼';
  if (contentType === 'application/pdf') return '📄';
  if (contentType.includes('spreadsheet') || contentType.includes('excel')) return '📊';
  if (contentType.includes('document') || contentType.includes('word')) return '📝';
  if (contentType.includes('zip') || contentType.includes('archive')) return '📦';
  return '📎';
}

function formatDate(date: string, format: string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  switch (format) {
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    default: return `${day}/${month}/${year}`;
  }
}

export default function Files() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const { settings: appSettings } = useAppSettings();

  const loadFiles = async (p = 1) => {
    try {
      const res = await fetch(`/api/files/files/?page=${p}&per_page=20`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) throw new Error();
      const data: PaginatedResponse = await res.json();
      setFiles(data.items);
      setPages(data.pages);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      setError('Failed to load files');
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // Real-time: reload when files change (upload, delete, thumbnail ready)
  useWSListener('table_updated', (data) => {
    if (data.table === 'files') {
      loadFiles(page);
    }
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/files/files/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }
      loadFiles(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/files/files/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      loadFiles(page);
    } catch {
      setError('Failed to delete file');
    }
  };

  const filtered = search
    ? files.filter((f) => f.original_filename.toLowerCase().includes(search.toLowerCase()))
    : files;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Files</h2>
          <p className="text-sm text-gray-500">{total} files</p>
        </div>
        <label className={`px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? 'Uploading...' : 'Upload file'}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-28"></th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Size</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((file) => (
              <tr key={file.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  {isImage(file.content_type) && file.thumbnail_url ? (
                    <img src={file.thumbnail_url} alt="" className="w-20 h-20 rounded-lg object-cover" />
                  ) : isImage(file.content_type) && !file.thumbnail_url ? (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-3xl">
                      {getFileIcon(file.content_type)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-900">{file.original_filename}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                    {file.original_filename.includes('.')
                      ? file.original_filename.split('.').pop()?.toUpperCase()
                      : file.content_type.split('/').pop()}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatSize(file.size)}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(file.created_at, appSettings.date_format)}</td>
                <td className="px-4 py-3 text-right">
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-500 hover:text-gray-900 mr-3"
                    >
                      Download
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {files.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500 text-sm">No files uploaded yet</div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => loadFiles(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page} of {pages}</span>
          <button
            onClick={() => loadFiles(page + 1)}
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
