import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AgenticAppReleasePanel from '../AgenticAppReleasePanel';
import { EmptyState, LoadingState } from '../States';
import { tip } from '../Tooltip';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { draftAppNames } from '../../utils/apps';

/**
 * The draft's Release tab (AD9.6): the apps the draft builds (its AgenticApp items and its target app), each read live
 * with GET /apps/{name}. An app that exists shows the shared environments panel (URL, pins and overrides per
 * environment, the difference between two, Promote, and the promotion history with Rollback); one that does not exist
 * yet says to apply the draft first. `permissions` are the caller's (null when unknown). `draft.status` changing
 * (for example to Applied) reads the apps again.
 */
export default function StudioReleasePanel({ draft, permissions = null }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const names = useMemo(() => draftAppNames(draft), [draft]);
  const [chosen, setChosen] = useState('');
  const [app, setApp] = useState(undefined);
  const current = names.includes(chosen) ? chosen : names[0] || '';

  useEffect(() => {
    if (!apiClient || !current) return undefined;
    let active = true;
    setApp(undefined);
    apiClient
      .getApp(tenantId, current)
      .then((a) => active && setApp(a || null))
      .catch(() => active && setApp(null));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, current, draft?.status, draft?.version]);

  if (!names.length) {
    return (
      <section className="panel" data-testid="studio-release">
        <EmptyState title={t('components.studio.release.noAppsTitle')} body={t('components.studio.release.noAppsBody')} />
      </section>
    );
  }

  return (
    <section className="panel studio-release" aria-label={t('components.studio.release.title')} data-testid="studio-release">
      <div className="studio-row-between">
        <h3 className="section-title" {...tip(t('tips.studio.release.title'))}>
          {t('components.studio.release.title')}
        </h3>
        {names.length > 1 && (
          <div className="flex gap-sm items-center">
            <label htmlFor="studio-release-app" {...tip(t('tips.studio.release.app'))}>
              {t('components.studio.release.app')}
            </label>
            <select id="studio-release-app" value={current} onChange={(e) => setChosen(e.target.value)} data-testid="studio-release-app" {...tip(t('tips.studio.release.app'))}>
              {names.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {app === undefined ? (
        <LoadingState />
      ) : app === null ? (
        <div data-testid="studio-release-not-live">
          <EmptyState title={t('components.studio.release.notLiveTitle', { name: current })} body={t('components.studio.release.notLiveBody')} />
        </div>
      ) : (
        <AgenticAppReleasePanel key={app.id} app={app} permissions={permissions} />
      )}
    </section>
  );
}
