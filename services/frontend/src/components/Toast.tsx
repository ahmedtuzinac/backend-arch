import { useState } from 'react';
import { useWSListener } from '../hooks/useWebSocket';

interface ToastItem {
  id: number;
  message: string;
}

let toastId = 0;

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  useWSListener('settings_updated', (data) => {
    const actor = data.actor_email as string;
    if (actor) {
      addToast(`Settings updated by ${actor}`);
    }
  });

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-[slideIn_0.3s_ease-out]"
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-white/60 hover:text-white"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
