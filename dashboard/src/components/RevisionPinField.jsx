import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { publishedRevisions } from '../utils/revisions';

/**
 * Revision pin of a deployment (AD1.9), drawn as a whole-row form field: "Follow latest published" (empty) or one of
 * the agent's published revisions. The list follows the agent picked in the same form; a pin to a revision of another
 * agent is cleared once the new agent's revisions load.
 */
export default function RevisionPinField({ data, onChange, disabled, label, tipText, hint, error, id = 'deployments-agentRevisionId' }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const agentId = data?.agentId || '';
  const value = data?.agentRevisionId || '';
  const [loaded, setLoaded] = useState({ agentId: '', revisions: [] });

  useEffect(() => {
    if (!apiClient || !agentId) return undefined;
    let active = true;
    apiClient
      .listAgentRevisions(tenantId, agentId)
      .then((r) => active && setLoaded({ agentId, revisions: publishedRevisions(r.items || []) }))
      .catch(() => active && setLoaded({ agentId, revisions: [] }));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, agentId]);

  const revisions = loaded.agentId === agentId ? loaded.revisions : [];
  const ready = !!agentId && loaded.agentId === agentId;
  const known = revisions.some((r) => r.id === value);

  useEffect(() => {
    if (disabled || !ready || !value || known || !loaded.revisions.length) return;
    onChange({ ...data, agentRevisionId: null });
  }, [disabled, ready, value, known, loaded, data, onChange]);

  return (
    <div className="field">
      <label htmlFor={id} {...tip(tipText)}>{label}</label>
      <select id={id} value={value} disabled={disabled || !agentId} onChange={(e) => onChange({ ...data, agentRevisionId: e.target.value || null })} {...tip(tipText)}>
        <option value="">{t('resources.deployments.followLatest')}</option>
        {revisions.map((r) => (
          <option key={r.id} value={r.id}>
            {t('components.revisions.number', { number: r.number })}
          </option>
        ))}
        {value && !known && <option value={value}>{value}</option>}
      </select>
      {!agentId && <div className="field-hint">{t('resources.deployments.selectAgentFirst')}</div>}
      {ready && !revisions.length && <div className="field-hint">{t('resources.deployments.noPublished')}</div>}
      {hint && <div className="field-hint">{hint}</div>}
      {error && (
        <div className="field-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
