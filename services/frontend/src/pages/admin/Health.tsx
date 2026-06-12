import { useEffect, useState } from 'react';
import { getAccessToken } from '../../api/auth';
import { useI18n } from '../../hooks/useI18n';

interface CheckResult {
  status: string;
  detail?: string;
}

interface ServiceHealth {
  status: string;
  service: string;
  uptime: string;
  uptime_seconds: number;
  checks: Record<string, CheckResult>;
}

interface ServiceConfig {
  name: string;
  url: string;
}

const SERVICES: ServiceConfig[] = [
  { name: 'Auth', url: '/auth/health' },
  { name: 'WebSocket', url: '/ws/health' },
  { name: 'Files', url: '/api/files/health' },
  { name: 'Storage (MinIO)', url: '/api/files/storage/health' },
];

const STATUS_STYLES: Record<string, string> = {
  ok: 'bg-green-100 text-green-700',
  degraded: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  offline: 'bg-red-100 text-red-700',
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  return `${minutes}m ${secs}s`;
}

export default function Health() {
  const [services, setServices] = useState<Record<string, ServiceHealth | null>>({});
  const [fetchedAt, setFetchedAt] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { t } = useI18n();

  const checkAll = async () => {
    const results: Record<string, ServiceHealth | null> = {};
    const times: Record<string, number> = {};
    const now = Math.floor(Date.now() / 1000);
    for (const svc of SERVICES) {
      try {
        const res = await fetch(svc.url, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        });
        if (res.ok) {
          results[svc.name] = await res.json();
          times[svc.name] = now;
        } else {
          results[svc.name] = null;
        }
      } catch {
        results[svc.name] = null;
      }
    }
    setServices(results);
    setFetchedAt(times);
    setLastCheck(new Date());
  };

  // Fetch health every 30 seconds
  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, 30000);
    return () => clearInterval(interval);
  }, []);

  // Tick every second for live uptime
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const getLiveUptime = (name: string): string => {
    const health = services[name];
    if (!health || health.uptime_seconds === undefined) return '-';
    const fetched = fetchedAt[name] || 0;
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - fetched;
    // Suppress unused tick warning - tick drives re-render
    void tick;
    return formatUptime(health.uptime_seconds + elapsed);
  };

  const allOk = Object.values(services).every((s) => s?.status === 'ok');
  const anyOffline = Object.values(services).some((s) => s === null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{ t('health.title') }</h2>
          {lastCheck && (
            <p className="text-sm text-gray-500">{ t('health.last_checked') }: {lastCheck.toLocaleTimeString()}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-sm rounded-full font-medium ${
              anyOffline ? STATUS_STYLES.error : allOk ? STATUS_STYLES.ok : STATUS_STYLES.degraded
            }`}
          >
            {anyOffline ? t('health.offline') : allOk ? t('health.operational') : t('health.degraded')}
          </span>
          <button
            onClick={checkAll}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {t('health.refresh')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {SERVICES.map((svc) => {
          const health = services[svc.name];
          const isOffline = health === null;

          return (
            <div key={svc.name} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      isOffline ? 'bg-red-500' : health?.status === 'ok' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  />
                  <h3 className="text-sm font-semibold text-gray-900">{svc.name}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      isOffline ? STATUS_STYLES.offline : STATUS_STYLES[health?.status || 'error']
                    }`}
                  >
                    {isOffline ? 'offline' : health?.status}
                  </span>
                </div>
                <span className="text-sm text-gray-500 font-mono">{getLiveUptime(svc.name)}</span>
              </div>

              {health && Object.keys(health.checks).length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(health.checks).map(([name, check]) => (
                    <div
                      key={name}
                      className={`px-3 py-2 rounded-md text-sm ${
                        check.status === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <span className="font-medium capitalize">{name}</span>
                      <span className="ml-2">{check.status === 'ok' ? t('health.connected') : check.detail || 'Error'}</span>
                    </div>
                  ))}
                </div>
              )}

              {isOffline && (
                <p className="text-sm text-red-600">{ t('health.not_responding') }</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
