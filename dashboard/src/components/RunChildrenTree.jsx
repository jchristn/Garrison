import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import FanOutGroupPanel from './FanOutGroupPanel';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { RunStatus } from '../views/runConfigs';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { buildRunTree, mergeGroup } from '../utils/fanOut';

function ChildList({ runs, t, navigate }) {
  return (
    <ul className="plain-list" data-testid="run-children">
      {runs.map((c) => (
        <li key={c.id}>
          <a
            href={pathFor('runs', c.id)}
            {...tip(t('tips.views.runDetail.openChild'))}
            onClick={(e) => {
              e.preventDefault();
              navigate(pathFor('runs', c.id));
            }}
          >
            {c.agentName}
          </a>{' '}
          <RunStatus status={c.status} t={t} /> <code className="text-muted">{c.id}</code>
        </li>
      ))}
    </ul>
  );
}

/**
 * The run tree on Run detail's Children tab. Children a run started with garrison_fan_out are gathered under their
 * fan-out group (AD5.8), oldest group first, each with its policy, progress, budget, deadline, members, and Cancel
 * group; the other children follow as a plain list. `highlightGroup` scrolls to and marks one group (the link from a
 * member run's detail).
 */
export default function RunChildrenTree({ runId, items, highlightGroup }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const load = useCallback(() => {
    if (!apiClient || !runId) return;
    apiClient
      .listRunFanOutGroups(tenantId, runId)
      .then((list) => {
        if (unmounted.current) return;
        setGroups(list);
        setError(null);
        setLoaded(true);
      })
      .catch((e) => {
        if (unmounted.current) return;
        setError(e);
        setLoaded(true);
      });
  }, [apiClient, tenantId, runId]);

  useEffect(() => {
    setGroups([]);
    setLoaded(false);
    load();
  }, [load]);

  const onGroup = useCallback((updated) => {
    if (!unmounted.current) setGroups((prev) => mergeGroup(prev, updated));
  }, []);

  const tree = useMemo(() => buildRunTree(items, groups), [items, groups]);

  return (
    <div className="flex-col gap-md" data-testid="run-tree">
      {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}
      {tree.groups.length === 0 && tree.others.length === 0 && <div className="text-muted">{t('views.runDetail.noChildren')}</div>}
      {tree.groups.map((entry) =>
        entry.group ? (
          <FanOutGroupPanel key={entry.id} group={entry.group} onChange={onGroup} highlighted={entry.id === highlightGroup} />
        ) : (
          <section key={entry.id} className="fanout-group" data-testid="fan-out-group" data-group={entry.id} aria-label={t('components.fanOut.groupTitle', { id: entry.id })}>
            <h3 className="section-title" {...tip(t('tips.fanOut.group'))}>
              {t('components.fanOut.groupTitle', { id: entry.id })}
            </h3>
            {loaded && <p className="field-hint">{t('components.fanOut.detailsUnavailable')}</p>}
            <ChildList runs={entry.runs} t={t} navigate={navigate} />
          </section>
        )
      )}
      {tree.others.length > 0 && (
        <div>
          {tree.groups.length > 0 && (
            <h3 className="section-title" {...tip(t('tips.fanOut.otherChildren'))}>
              {t('components.fanOut.otherChildren')}
            </h3>
          )}
          <ChildList runs={tree.others} t={t} navigate={navigate} />
        </div>
      )}
    </div>
  );
}
