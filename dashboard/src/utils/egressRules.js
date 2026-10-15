// Deployment egress allowlists (P11.15): helpers for the deployment form. A deployment with egress rules only runs on
// Kubernetes workers that enforce them with a per-run NetworkPolicy; with none available its runs wait in the queue
// (blocked reason NoIsolatingWorker) and are never run unenforced. Plain functions so Node-based tests can import them.

/** Most egress rules one deployment may have; the server rejects more (TooManyEgressRules). */
export const MAX_EGRESS_RULES = 64;

/** Protocols an egress rule may use; the names match Kubernetes NetworkPolicy. */
export const EGRESS_PROTOCOLS = ['TCP', 'UDP'];

function ipv4Bytes(text) {
  const parts = text.split('.');
  if (parts.length !== 4) return null;
  const bytes = [];
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p) || (p.length > 1 && p[0] === '0')) return null;
    const n = Number(p);
    if (n > 255) return null;
    bytes.push(n);
  }
  return bytes;
}

function ipv6Bytes(text) {
  if (!/^[0-9A-Fa-f:.]+$/.test(text)) return null;
  let head = text;
  let tail = [];
  const lastColon = text.lastIndexOf(':');
  if (text.includes('.')) {
    const v4 = ipv4Bytes(text.slice(lastColon + 1));
    if (!v4) return null;
    tail = [((v4[0] << 8) | v4[1]).toString(16), ((v4[2] << 8) | v4[3]).toString(16)];
    // Keep a trailing "::" (it stands for zero groups); otherwise drop the colon before the IPv4 part.
    head = text.slice(0, lastColon + 1);
    if (!head.endsWith('::')) head = head.slice(0, -1);
  }
  const halves = head.split('::');
  if (halves.length > 2) return null;
  const parse = (s) => (s === '' ? [] : s.split(':'));
  const left = parse(halves[0]);
  const right = halves.length === 2 ? parse(halves[1]) : [];
  const groups = halves.length === 2 ? [...left, ...right, ...tail] : [...left, ...tail];
  if (groups.some((g) => !/^[0-9A-Fa-f]{1,4}$/.test(g))) return null;
  let all;
  if (halves.length === 2) {
    const missing = 8 - groups.length;
    if (missing < 1) return null;
    all = [...left, ...Array(missing).fill('0'), ...right, ...tail];
  } else {
    if (groups.length !== 8) return null;
    all = groups;
  }
  const bytes = [];
  for (const g of all) {
    const n = parseInt(g, 16);
    bytes.push(n >> 8, n & 255);
  }
  return bytes;
}

/**
 * Why a CIDR block is invalid, as a key under resources.deployments.egress.errors, or null when it is valid. Mirrors
 * the server: a network address (no bits after the prefix), IPv4 without leading zeros, no IPv4-mapped IPv6, and no
 * host names.
 */
export function cidrProblem(value) {
  const text = String(value ?? '').trim();
  if (!text) return 'cidrRequired';
  const slash = text.indexOf('/');
  if (slash <= 0 || slash !== text.lastIndexOf('/') || slash === text.length - 1) return 'cidrFormat';
  const address = text.slice(0, slash);
  const prefixText = text.slice(slash + 1);
  const v4 = !address.includes(':');
  const bytes = v4 ? ipv4Bytes(address) : ipv6Bytes(address);
  if (!bytes) return 'cidrAddress';
  const max = v4 ? 32 : 128;
  if (!/^\d{1,3}$/.test(prefixText) || (prefixText.length > 1 && prefixText[0] === '0') || Number(prefixText) > max) return 'cidrPrefix';
  if (!v4 && bytes.slice(0, 10).every((b) => b === 0) && bytes[10] === 255 && bytes[11] === 255) return 'cidrMapped';
  const prefix = Number(prefixText);
  for (let bit = prefix; bit < bytes.length * 8; bit++) {
    if (bytes[bit >> 3] & (0x80 >> (bit % 8))) return 'cidrHostBits';
  }
  return null;
}

/** Form rows from an API record's egressRules: port as text (empty means every port), protocol defaulted to TCP. */
export function egressRulesToForm(rules) {
  return (Array.isArray(rules) ? rules : []).map((r) => ({ cidr: r?.cidr || '', port: r?.port ?? '', protocol: r?.protocol || 'TCP' }));
}

/** API body egressRules from form rows: CIDR trimmed, empty port sent as null, protocol TCP when unset. */
export function egressRulesToBody(rows) {
  return (Array.isArray(rows) ? rows : []).map((r) => {
    const port = r?.port;
    const empty = port === null || port === undefined || String(port).trim() === '';
    return { cidr: String(r?.cidr || '').trim(), port: empty ? null : Number(port), protocol: r?.protocol || 'TCP' };
  });
}

/** Whether a deployment form or record has an egress allowlist. */
export function hasEgressRules(d) {
  return Array.isArray(d?.egressRules) && d.egressRules.length > 0;
}

/**
 * Client-side checks that mirror the server's field codes: a valid CIDR on every rule (InvalidCidr), a port from 1 to
 * 65535 or none (PortOutOfRange), a known protocol (InvalidProtocol), at most 64 rules (TooManyEgressRules), no
 * Process executor (EgressRulesNeedKubernetesJob), and no Warm startup (EgressRulesNeedColdStart). Returns
 * { field: message } (empty when valid).
 */
export function egressErrors(form, t) {
  const errors = {};
  const rules = Array.isArray(form?.egressRules) ? form.egressRules : [];
  const problems = [];
  rules.forEach((rule, i) => {
    const cidr = cidrProblem(rule?.cidr);
    if (cidr) problems.push(t('common.errors.listItem', { index: i + 1, message: `${t('common.fieldCodes.InvalidCidr')} ${t(`resources.deployments.egress.errors.${cidr}`)}` }));
    const port = rule?.port;
    if (port !== null && port !== undefined && String(port).trim() !== '') {
      const n = Number(port);
      if (!Number.isInteger(n) || n < 1 || n > 65535) problems.push(t('common.errors.listItem', { index: i + 1, message: t('common.fieldCodes.PortOutOfRange') }));
    }
    if (rule?.protocol && !EGRESS_PROTOCOLS.includes(rule.protocol)) problems.push(t('common.errors.listItem', { index: i + 1, message: t('common.fieldCodes.InvalidProtocol') }));
  });
  if (rules.length > MAX_EGRESS_RULES) problems.push(t('common.fieldCodes.TooManyEgressRules'));
  if (problems.length) errors.egressRules = problems.join(' ');
  if (rules.length > 0 && form?.executor === 'Process') errors.executor = t('common.fieldCodes.EgressRulesNeedKubernetesJob');
  if (rules.length > 0 && form?.capColdStartClass === 'Warm') errors.capColdStartClass = t('common.fieldCodes.EgressRulesNeedColdStart');
  return errors;
}
