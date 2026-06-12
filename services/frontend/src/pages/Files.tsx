import { useCallback, useEffect, useRef, useState } from 'react';
import { getAccessToken } from '../api/auth';
import { useAppSettings } from '../hooks/useAppSettings';
import { useI18n } from '../hooks/useI18n';
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
  const [detailFile, setDetailFile] = useState<FileItem | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const { settings: appSettings } = useAppSettings();
  const { t } = useI18n();
  const dropRef = useRef<HTMLDivElement>(null);

  const loadFiles = async (p = 1, q = search) => {
    try {
      const params = new URLSearchParams({ page: String(p), per_page: '20' });
      if (q) params.set('search', q);
      const res = await fetch(`/api/files/files/?${params}`, {
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

  // Search triggers backend reload
  useEffect(() => {
    loadFiles(1, search);
  }, [search]);

  return (
    <div ref={dropRef} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className="relative">
      {/* Drag overlay */}
      {dragging && (
        <div className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-400 rounded-lg z-10 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-blue-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-blue-600 font-medium">{t('files.drop')}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('files.title')}</h2>
          <p className="text-sm text-gray-500">{total} {t('files.total')}</p>
        </div>
        <label className={`px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
          {uploading ? `${t('files.uploading')} ${uploadProgress}%` : t('files.upload')}
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
          placeholder={t('files.search')}
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
              <th className="text-left px-4 py-3 font-medium text-gray-600">{ t('files.name') }</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{ t('files.type') }</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{ t('files.size') }</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">{ t('files.date') }</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">{ t('files.actions') }</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
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
                  <button onClick={() => setDetailFile(file)} className="text-gray-900 hover:underline text-left">
                    {file.original_filename}
                  </button>
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

      {/* Detail side panel */}
      {detailFile && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDetailFile(null)} />
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">{ t('files.details') }</h3>
              <button onClick={() => setDetailFile(null)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>

            {/* Preview */}
            <div className="p-5 border-b border-gray-100">
              {isImage(detailFile.content_type) ? (
                <img
                  src={`/api/files/files/${detailFile.id}/preview`}
                  alt={detailFile.original_filename}
                  className="w-full rounded-lg cursor-pointer hover:opacity-90"
                  onClick={() => { setPreview(detailFile); setDetailFile(null); }}
                />
              ) : (
                <div className="w-full h-40 rounded-lg bg-gray-100 flex items-center justify-center text-5xl">
                  {getFileIcon(detailFile.content_type)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">{ t('files.filename') }</label>
                <p className="text-sm text-gray-900 mt-1">{detailFile.original_filename}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">{ t('files.type') }</label>
                  <p className="text-sm text-gray-900 mt-1">{detailFile.content_type}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">{ t('files.size') }</label>
                  <p className="text-sm text-gray-900 mt-1">{formatSize(detailFile.size)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">{ t('files.category') }</label>
                  <p className="text-sm text-gray-900 mt-1">{detailFile.category}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">{t('files.uploaded')}</label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(detailFile.created_at, appSettings.date_format)}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">{ t('files.file_url') }</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    readOnly
                    value={detailFile.url}
                    className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 font-mono"
                  />
                  <button
                    onClick={() => copyLink(detailFile)}
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {copied === detailFile.id ? t('files.copied') : t('common.copy')}
                  </button>
                </div>
              </div>
              {detailFile.thumbnail_url && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">{ t('files.thumbnail_url') }</label>
                  <p className="text-xs text-gray-500 font-mono mt-1 break-all">{detailFile.thumbnail_url}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-5 border-t border-gray-100 flex gap-2">
              {detailFile.url && (
                <a
                  href={detailFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Download
                </a>
              )}
              <button
                onClick={() => { handleDelete(detailFile.id); setDetailFile(null); }}
                className="flex-1 text-center px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-gray-600 hover:text-gray-900">
              &times;
            </button>
            <img src={`/api/files/files/${preview.id}/preview`} alt={preview.original_filename} className="max-h-[85vh] rounded-lg shadow-2xl" />
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
