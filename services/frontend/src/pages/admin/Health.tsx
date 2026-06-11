import { useEffect, useState } from 'react';
import { getAccessToken } from '../../api/auth';

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
];

const STATUS_STYLES: Record<string, string> = {
  ok: 'bg-green-100 text-green-700',
  degraded: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  offline: 'bg-red-100 text-red-700',
};

export default function Health() {
  const [services, setServices] = useState<Record<string, ServiceHealth | null>>({});
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkAll = async () => {
    const results: Record<string, ServiceHealth | null> = {};
    for (const svc of SERVICES) {
      try {
        const res = await fetch(svc.url, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        });
        if (res.ok) {
          results[svc.name] = await res.json();
        } else {
          results[svc.name] = null;
        }
      } catch {
        results[svc.name] = null;
      }
    }
    setServices(results);
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, 15000);
    return () => clearInterval(interval);
  }, []);

  const allOk = Object.values(services).every((s) => s?.status === 'ok');
  const anyOffline = Object.values(services).some((s) => s === null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Service Health</h2>
          {lastCheck && (
            <p className="text-sm text-gray-500">Last checked: {lastCheck.toLocaleTimeString()}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-sm rounded-full font-medium ${
              anyOffline ? STATUS_STYLES.error : allOk ? STATUS_STYLES.ok : STATUS_STYLES.degraded
            }`}
          >
            {anyOffline ? 'Services Offline' : allOk ? 'All Systems Operational' : 'Degraded'}
          </span>
          <button
            onClick={checkAll}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Refresh
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
                {health && (
                  <span className="text-sm text-gray-500">Uptime: {health.uptime}</span>
                )}
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
                      <span className="ml-2">{check.status === 'ok' ? 'Connected' : check.detail || 'Error'}</span>
                    </div>
                  ))}
                </div>
              )}

              {isOffline && (
                <p className="text-sm text-red-600">Service is not responding</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
