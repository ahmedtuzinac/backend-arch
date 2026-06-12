import { useCallback, useEffect, useRef, useState } from 'react';
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
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

export default function Files() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<FileItem | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const { settings: appSettings } = useAppSettings();
  const dropRef = useRef<HTMLDivElement>(null);

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

  useWSListener('table_updated', (data) => {
    if (data.table === 'files') {
      loadFiles(page);
    }
  });

  // --- Upload logic ---
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    return new Promise<void>((resolve, reject) => {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(xhr.responseText || 'Upload failed'));
      };
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.open('POST', '/api/files/files/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${getAccessToken()}`);
      xhr.send(formData);
    });
  };

  const handleUploadFiles = async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;
    setUploading(true);
    setError('');
    setUploadProgress(0);

    for (const file of filesToUpload) {
      try {
        await uploadFile(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    }
    setUploading(false);
    setUploadProgress(0);
    loadFiles(page);
  };

  const handleInputUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleUploadFiles(e.target.files);
    e.target.value = '';
  };

  // --- Drag & drop ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleUploadFiles(e.dataTransfer.files);
      }
    },
    [page],
  );

  // --- Actions ---
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

  const copyLink = (file: FileItem) => {
    navigator.clipboard.writeText(file.url);
    setCopied(file.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = search ? files.filter((f) => f.original_filename.toLowerCase().includes(search.toLowerCase())) : files;

  return (
    <div ref={dropRef} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className="relative">
      {/* Drag overlay */}
      {dragging && (
        <div className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-400 rounded-lg z-10 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-blue-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-blue-600 font-medium">Drop files here to upload</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Files</h2>
          <p className="text-sm text-gray-500">{total} files</p>
        </div>
        <label className={`px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? `Uploading ${uploadProgress}%` : 'Upload files'}
          <input type="file" multiple className="hidden" onChange={handleInputUpload} disabled={uploading} />
        </label>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>}

      {/* Upload progress bar */}
      {uploading && (
        <div className="mb-4 w-full bg-gray-200 rounded-full h-2">
          <div className="h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%`, backgroundColor: 'var(--color-primary)' }} />
        </div>
      )}

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
                    <img
                      src={file.thumbnail_url}
                      alt=""
                      className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setPreview(file)}
                    />
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
                    {file.original_filename.includes('.') ? file.original_filename.split('.').pop()?.toUpperCase() : file.content_type.split('/').pop()}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatSize(file.size)}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(file.created_at, appSettings.date_format)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => copyLink(file)} className="text-gray-500 hover:text-gray-900 mr-3" title="Copy link">
                    {copied === file.id ? 'Copied!' : 'Copy link'}
                  </button>
                  {file.url && (
                    <a href={file.url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-900 mr-3">
                      Download
                    </a>
                  )}
                  <button onClick={() => handleDelete(file.id)} className="text-red-500 hover:text-red-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {files.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-lg mt-4">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          No files yet. Upload or drag & drop files here.
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => loadFiles(page - 1)} disabled={page <= 1} className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50">
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {pages}
          </span>
          <button onClick={() => loadFiles(page + 1)} disabled={page >= pages} className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50">
            Next
          </button>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:text-gray-900">
              &times;
            </button>
            <img src={preview.url} alt={preview.original_filename} className="max-h-[85vh] rounded-lg shadow-2xl" />
            <div className="mt-3 text-center">
              <p className="text-white text-sm">{preview.original_filename}</p>
              <p className="text-white/60 text-xs">{formatSize(preview.size)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
