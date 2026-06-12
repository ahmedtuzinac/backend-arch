import { useEffect, useRef } from 'react';
import { getAccessToken } from '../api/auth';

type WSListener = (data: Record<string, unknown>) => void;

const listeners = new Map<string, Set<WSListener>>();

export function onWSEvent(type: string, listener: WSListener): () => void {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type)!.add(listener);
  return () => {
    listeners.get(type)?.delete(listener);
  };
}

function dispatch(data: Record<string, unknown>) {
  const type = data.type as string;
  if (type && listeners.has(type)) {
    listeners.get(type)!.forEach((fn) => fn(data));
  }
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/ws/connect?token=${token}`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          dispatch(data);
        } catch { /* ignore non-json */ }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setTimeout(() => {
          if (wsRef.current === ws) {
            connect();
          }
        }, 3000);
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return wsRef;
}

export function useWSListener(type: string, callback: WSListener) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
    return onWSEvent(type, (data) => callbackRef.current(data));
  }, [type]);
}
