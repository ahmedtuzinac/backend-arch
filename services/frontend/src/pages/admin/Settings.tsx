import { useEffect, useState } from 'react';
import { getAccessToken, getMe } from '../../api/auth';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useI18n } from '../../hooks/useI18n';

interface Setting {
  key: string;
  value: string;
  description: string;
}

const FIELD_TYPES: Record<string, string> = {
  app_name: 'text',
  app_logo_url: 'url',
  timezone: 'select',
  date_format: 'select',
  primary_color: 'color',
};

const TIMEZONE_OPTIONS = [
  'UTC',
  'Europe/Belgrade',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
];

const DATE_FORMAT_OPTIONS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

export default function Settings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { reload: reloadAppSettings } = useAppSettings();
  const { t } = useI18n();
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/auth/settings/', {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.settings);
        const vals: Record<string, string> = {};
        for (const s of data.settings) {
          vals[s.key] = s.value;
        }
        setValues(vals);
      })
      .catch(() => setError('Failed to load settings'));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const me = await getMe();
      const params = new URLSearchParams({ actor_id: String(me.id), actor_email: me.email });
      const res = await fetch(`/auth/settings/?${params}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Failed to save');
      setMessage(t('settings.saved'));
      reloadAppSettings();
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (setting: Setting) => {
    const type = FIELD_TYPES[setting.key] || 'text';

    if (type === 'select') {
      const options = setting.key === 'timezone' ? TIMEZONE_OPTIONS : DATE_FORMAT_OPTIONS;
      return (
        <select
          value={values[setting.key] || ''}
          onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'color') {
      return (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={values[setting.key] || '#111827'}
            onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
            className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={values[setting.key] || ''}
            onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      );
    }

    return (
      <input
        type={type}
        value={values[setting.key] || ''}
        onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
    );
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('settings.title')}</h2>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>}
      {message && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-md">{message}</div>}

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        {settings.map((setting) => (
          <div key={setting.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t(`settings.${setting.key}`) !== `settings.${setting.key}` ? t(`settings.${setting.key}`) : setting.description || setting.key}
            </label>
            {renderField(setting)}
          </div>
        ))}

        {settings.length > 0 && (
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('settings.save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
