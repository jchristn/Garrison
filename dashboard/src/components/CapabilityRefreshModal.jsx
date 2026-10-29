import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { Badge } from './StatusBadge';
import { ErrorBanner } from './States';
import { RefreshIcon } from './Icons';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { translateServerText } from '../utils/serverText';
import { formatNumber } from '../i18n/formatters';
import { refreshTotals } from '../utils/capabilities';

/**
 * Refresh derived capabilities now (AD4.8): POST /capabilities/refresh for every MCP server, or for one. Garrison
 * re-derives agent and harness built-in entries, lists MCP tools (stdio servers through a worker with stdio
 * diagnostics on), and recomputes agent hints, then this dialog shows what changed, with one row per MCP server and
 * the reason a listing failed. `onDone` runs after a refresh so the catalog reloads.
 */
export default function CapabilityRefreshModal({ onClose, onDone }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const lng = i18n.language;
  const [servers, setServers] = useState([]);
  const [serverId, setServerId] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    apiClient
      .listMcpServers(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => active && setServers((r.items || []).filter((s) => s.active !== false)))
      .catch(() => active && setServers([]));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId]);

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await apiClient.refreshCapabilities(tenantId, serverId || null);
      setResult(r || {});
      const totals = refreshTotals(r);
      addToast({ type: totals.failed ? 'warning' : 'success', message: totals.failed ? t('components.capabilities.refreshPartial', { count: totals.failed }) : t('components.capabilities.refreshDone') });
      onDone?.(r);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const totals = result ? refreshTotals(result) : null;
  const n = (v) => formatNumber(v, {}, lng);
  const item = (key, value) => (
    <div className="detail-item" data-total={key}>
      <div className="detail-item-label" {...tip(t(`tips.capabilities.refresh.${key}`))}>
        {t(`components.capabilities.refresh.${key}`)}
      </div>
      <div className="detail-item-value">{n(value)}</div>
    </div>
  );
  const th = (key) => (
    <th scope="col" {...tip(t(`tips.capabilities.refresh.columns.${key}`))}>
      {t(`components.capabilities.refresh.columns.${key}`)}
    </th>
  );

  return (
    <Modal
      open
      size="large"
      onClose={() => !busy && onClose()}
      title={t('components.capabilities.refreshTitle')}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.close'))}>
            {t('common.actions.close')}
          </button>
          <button type="button" className="button-primary" onClick={run} disabled={busy} data-testid="capability-refresh-run" {...tip(t('tips.capabilities.refreshRun'))}>
            <RefreshIcon size={14} /> {busy ? t('components.capabilities.refreshing') : t('components.capabilities.refreshRun')}
          </button>
        </>
      }
    >
      <p className="field-hint">{t('components.capabilities.refreshHint')}</p>
      <div className="field">
        <label htmlFor="capability-refresh-server" {...tip(t('tips.capabilities.refreshServer'))}>
          {t('components.capabilities.refreshServer')}
        </label>
        <select id="capability-refresh-server" value={serverId} onChange={(e) => setServerId(e.target.value)} disabled={busy} data-testid="capability-refresh-server" {...tip(t('tips.capabilities.refreshServer'))}>
          <option value="">{t('components.capabilities.refreshAll')}</option>
          {servers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      {error && <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} />}
      {result && (
        <div data-testid="capability-refresh-result">
          <div className="detail-grid">
            {item('agents', totals.agents)}
            {item('harnessBuiltIns', totals.harnessBuiltIns)}
            {item('hints', totals.hints)}
            {item('servers', totals.servers)}
            {item('tools', totals.tools)}
            {item('removed', totals.removed)}
            {item('failed', totals.failed)}
          </div>
          {totals.servers === 0 ? (
            <p className="text-muted">{t('components.capabilities.refresh.noServers')}</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table" data-testid="capability-refresh-servers">
                <thead>
                  <tr>
                    {th('server')}
                    {th('status')}
                    {th('tools')}
                    {th('removed')}
                    {th('warned')}
                    {th('error')}
                  </tr>
                </thead>
                <tbody>
                  {result.mcpServers.map((s) => (
                    <tr key={s.mcpServerId} data-server={s.mcpServerName || s.mcpServerId} data-failed={s.error ? 'true' : 'false'}>
                      <td>
                        <strong>{s.mcpServerName || s.mcpServerId}</strong>
                      </td>
                      <td>
                        {s.error ? (
                          <Badge tone="danger" tip={t('tips.capabilities.refresh.failedBadge')}>
                            {t('components.capabilities.refresh.failedBadge')}
                          </Badge>
                        ) : (
                          <Badge tone="success" tip={t('tips.capabilities.refresh.listedBadge')}>
                            {t('components.capabilities.refresh.listedBadge')}
                          </Badge>
                        )}
                      </td>
                      <td>{n(s.tools || 0)}</td>
                      <td>{n(s.removed || 0)}</td>
                      <td>{n(s.warned || 0)}</td>
                      <td data-cell="error">{s.error ? translateServerText(t, s.error) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
