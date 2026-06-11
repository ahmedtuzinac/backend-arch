import { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken } from '../api/auth';
import { useWSListener } from './useWebSocket';

export interface AppSettings {
  app_name: string;
  app_logo_url: string;
  timezone: string;
  date_format: string;
  primary_color: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  app_name: 'Dashboard',
  app_logo_url: '',
  timezone: 'UTC',
  date_format: 'DD/MM/YYYY',
  primary_color: '#111827',
};

export const AppSettingsContext = createContext<{
  settings: AppSettings;
  reload: () => void;
}>({
  settings: DEFAULT_SETTINGS,
  reload: () => {},
});

export function useAppSettings() {
  return useContext(AppSettingsContext);
}

export function useLoadAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const load = async () => {
    try {
      const res = await fetch('/auth/settings/', {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const s: Record<string, string> = {};
      for (const item of data.settings) {
        s[item.key] = item.value;
      }
      setSettings({ ...DEFAULT_SETTINGS, ...s } as AppSettings);
    } catch {
      // keep defaults
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Apply primary color as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', settings.primary_color);
  }, [settings.primary_color]);

  // Real-time: reload when settings are updated via WebSocket
  useWSListener('settings_updated', (data) => {
    const updated = data.settings as Record<string, string>;
    if (updated) {
      setSettings((prev) => ({ ...prev, ...updated }));
    }
  });

  return { settings, reload: load };
}
