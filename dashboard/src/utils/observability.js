// Observability services the dashboard may link to (M1-05). Only services the server reports as configured are
// shown, never guessed defaults.

export const OBSERVABILITY_IDS = ['grafana', 'prometheus', 'tempo', 'loki'];

/** Loopback is always 127.0.0.1, never localhost (CLAUDE.md). */
export function loopbackUrl(url) {
  return String(url).replace(/^(\w+:\/\/)localhost(?=[:/]|$)/i, '$1127.0.0.1');
}

function valid(url) {
  return typeof url === 'string' && /^https?:\/\/\S+$/i.test(url.trim());
}

/**
 * Configured services from server info (`observability: { grafanaUrl, ... }` or flat `grafanaUrl`, ...) and the
 * settings response (fields whose path ends in GrafanaUrl, PrometheusUrl, TempoUrl, or LokiUrl). Server info wins.
 * @returns {{ id: string, url: string }[]}
 */
export function observabilityServices(info, settings) {
  const found = {};
  const fromInfo = { ...(info && typeof info === 'object' ? info : {}), ...(info?.observability && typeof info.observability === 'object' ? info.observability : {}) };
  for (const id of OBSERVABILITY_IDS) {
    const url = fromInfo[`${id}Url`];
    if (valid(url)) found[id] = url.trim();
  }
  for (const f of Array.isArray(settings?.fields) ? settings.fields : []) {
    const m = String(f?.path || '').match(/\.(Grafana|Prometheus|Tempo|Loki)Url$/i);
    if (!m) continue;
    const id = m[1].toLowerCase();
    if (!found[id] && valid(f.value)) found[id] = f.value.trim();
  }
  return OBSERVABILITY_IDS.filter((id) => found[id]).map((id) => ({ id, url: loopbackUrl(found[id]) }));
}
