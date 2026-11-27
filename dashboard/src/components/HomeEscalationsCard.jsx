import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EscalationAnswerModal from './EscalationAnswerModal';
import { EscalationSeverityBadge } from './EscalationBadges';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatRelativeTime, truncate } from '../i18n/formatters';
import { attentionList } from '../utils/escalations';
import { deniedProps, permissionDenied } from '../utils/permissions';
import useCallerPermissions from '../hooks/useCallerPermissions';

const PAGE = 100;
const SHOWN = 5;

/**
 * Home escalations card (AA2.13): the open escalations waiting for an answer, Urgent first and then oldest first, each
 * with Answer. Hidden when none are open, and when the caller cannot read escalations.
 */
export default function HomeEscalationsCard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [items, setItems] = useState(null);
  const [answering, setAnswering] = useState(null);
  const permissions = useCallerPermissions();
  const lng = i18n.language;

  const load = useCallback(() => {
    if (!apiClient || typeof apiClient.listEscalations !== 'function') return;
    apiClient
      .listEscalations(tenantId, { status: 'Open', pageNumber: 1, pageSize: PAGE })
      .then((r) => setItems(attentionList(r.items || [])))
      .catch(() => setItems(null));
  }, [apiClient, tenantId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  if (!items || items.length === 0) return null;
  const open = (e, to) => {
    e.preventDefault();
    navigate(to);
  };
  return (
    <section className="panel" aria-labelledby="escalations-title" data-testid="home-escalations">
      <div className="node-section-head">
        <h2 id="escalations-title" className="section-title" {...tip(t('tips.views.home.escalations.title'))}>
          {t('views.home.escalations.title', { count: items.length })}
        </h2>
        <a href={pathFor('escalations')} className="button-ghost button-sm" {...tip(t('tips.views.home.escalations.open'))} onClick={(e) => open(e, pathFor('escalations'))}>
          {t('views.home.escalations.open')}
        </a>
      </div>
      <ul className="node-list home-escalations" data-testid="home-escalations-list">
        {items.slice(0, SHOWN).map((x) => {
          const denied = permissionDenied(t, permissions, 'Escalation', 'Update', { resourceId: x.id });
          return (
            <li key={x.id}>
              <EscalationSeverityBadge severity={x.severity} t={t} />
              <a href={pathFor('escalations', x.id)} {...tip(x.question)} onClick={(e) => open(e, pathFor('escalations', x.id))}>
                <strong>{x.agentName || x.agentId || '-'}</strong>: {truncate(x.question || '', 80)}
              </a>
              <span className="text-muted node-meta" {...tip(formatDateTime(x.createdUtc, lng))}>
                {formatRelativeTime(x.createdUtc, lng)}
              </span>
              <button
                type="button"
                className="button-secondary button-sm"
                onClick={() => !denied && setAnswering(x)}
                data-testid={`home-escalation-answer-${x.id}`}
                {...deniedProps(denied)}
                {...tip(denied || t('tips.resources.escalations.actions.answer'))}
              >
                {t('resources.escalations.actions.answer')}
              </button>
            </li>
          );
        })}
      </ul>
      {items.length > SHOWN && <p className="text-muted">{t('views.home.escalations.more', { count: items.length - SHOWN })}</p>}
      {answering && (
        <EscalationAnswerModal
          escalation={answering}
          onClose={() => setAnswering(null)}
          onAnswered={() => {
            setAnswering(null);
            load();
          }}
        />
      )}
    </section>
  );
}
