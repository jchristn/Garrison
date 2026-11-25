import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TickOutcomeBadge, MandateStatusBadge } from './KeeperBadges';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { autonomySummary } from '../utils/keepers';

const PAGE = 250;

/**
 * Home Autonomy card (AA1.16): how many keepers are active, paused, and ticking, when the next one wakes, and the keepers
 * whose last tick needs a person. Hidden when the caller cannot read keepers or the server has none of the routes.
 */
export default function HomeAutonomyCard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [summary, setSummary] = useState(undefined);
  const lng = i18n.language;

  const load = useCallback(() => {
    if (!apiClient) return;
    apiClient
      .listMandates(tenantId, { pageNumber: 1, pageSize: PAGE })
      .then((r) => setSummary(autonomySummary(r.items || [], r.totalCount)))
      .catch((e) => setSummary(e?.status === 403 || e?.status === 404 ? null : undefined));
  }, [apiClient, tenantId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  if (summary === null || summary === undefined) return null;
  const open = (e, to) => {
    e.preventDefault();
    navigate(to);
  };
  return (
    <section className="panel" aria-labelledby="autonomy-title" data-testid="home-autonomy">
      <div className="node-section-head">
        <h2 id="autonomy-title" className="section-title" {...tip(t('tips.views.home.autonomy.title'))}>
          {t('views.home.autonomy.title')}
        </h2>
        <a href={pathFor('keepers')} className="button-ghost button-sm" {...tip(t('tips.views.home.autonomy.open'))} onClick={(e) => open(e, pathFor('keepers'))}>
          {t('views.home.autonomy.open')}
        </a>
      </div>
      {summary.total === 0 ? (
        <p className="text-muted" data-testid="home-autonomy-empty">
          {t('views.home.autonomy.empty')}
        </p>
      ) : (
        <>
          <div className="home-autonomy-stats">
            <span {...tip(t('tips.views.home.autonomy.active'))} data-testid="home-autonomy-active">
              <strong>{formatNumber(summary.active, {}, lng)}</strong>
              {t('views.home.autonomy.active')}
            </span>
            <span {...tip(t('tips.views.home.autonomy.paused'))}>
              <strong>{formatNumber(summary.paused, {}, lng)}</strong>
              {t('views.home.autonomy.paused')}
            </span>
            <span {...tip(t('tips.views.home.autonomy.ticking'))}>
              <strong>{formatNumber(summary.running, {}, lng)}</strong>
              {t('views.home.autonomy.ticking')}
            </span>
            <span {...tip(t('tips.views.home.autonomy.nextWake'))}>
              {t('views.home.autonomy.nextWake')}{' '}
              {summary.nextWakeUtc ? <span {...tip(formatDateTime(summary.nextWakeUtc, lng))}>{formatRelativeTime(summary.nextWakeUtc, lng)}</span> : '-'}
            </span>
          </div>
          {summary.attention.length === 0 ? (
            <p className="text-muted">{t('views.home.autonomy.allQuiet')}</p>
          ) : (
            <>
              <h3 className="node-section-title" {...tip(t('tips.views.home.autonomy.attention'))}>
                {t('views.home.autonomy.attention', { count: summary.attention.length })}
              </h3>
              <ul className="node-list" data-testid="home-autonomy-attention">
                {summary.attention.slice(0, 5).map((m) => (
                  <li key={m.id}>
                    <a href={pathFor('keepers', m.id)} {...tip(t('tips.views.home.autonomy.openKeeper'))} onClick={(e) => open(e, pathFor('keepers', m.id))}>
                      <strong>{m.name}</strong>
                    </a>
                    <MandateStatusBadge status={m.status} t={t} />
                    <TickOutcomeBadge outcome={m.lastTickOutcome} t={t} />
                    {m.lastTickUtc && <span className="text-muted node-meta">{formatRelativeTime(m.lastTickUtc, lng)}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
