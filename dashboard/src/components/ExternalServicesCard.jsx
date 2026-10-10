import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CopyButton from './CopyButton';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { GITHUB_URL } from '../utils/constants';
import { observabilityServices } from '../utils/observability';

export const OBSERVABILITY_DOCS_URL = `${GITHUB_URL}/blob/main/docs/TELEMETRY.md`;

/**
 * Observability links (M1-05). A card appears only for services the server says are configured, from
 * GET /server-info (observability URLs) or, for administrators, the settings. Otherwise one note links to the
 * telemetry documentation. Nothing is assumed: no localhost URLs and no default credentials.
 */
export default function ExternalServicesCard() {
  const { t } = useTranslation();
  const { apiClient, principal } = useAuth();
  const [services, setServices] = useState(null);

  useEffect(() => {
    if (!apiClient) return undefined;
    let cancelled = false;
    const info = apiClient.getServerInfo().catch(() => null);
    const settings = principal?.isAdmin ? apiClient.getSettings().catch(() => null) : Promise.resolve(null);
    Promise.all([info, settings]).then(([i, s]) => {
      if (!cancelled) setServices(observabilityServices(i, s));
    });
    return () => {
      cancelled = true;
    };
  }, [apiClient, principal?.isAdmin]);

  if (services === null) return null;
  return (
    <section className="panel" aria-labelledby="ext-services-title" data-testid="observability">
      <h2 id="ext-services-title" className="section-title" {...tip(t('tips.views.home.observability'))}>
        {t('views.home.observability')}
      </h2>
      {services.length === 0 ? (
        <p className="text-muted" data-testid="observability-setup">
          {t('views.home.observabilityNone')}{' '}
          <a href={OBSERVABILITY_DOCS_URL} target="_blank" rel="noopener noreferrer" {...tip(t('tips.views.home.observabilityDocs'))}>
            {t('views.home.observabilitySetup')}
          </a>
        </p>
      ) : (
        <ul className="external-list">
          {services.map((s) => (
            <li key={s.id} className="external-item" data-service={s.id}>
              <div className="external-name">{t(`views.home.services.${s.id}`, { defaultValue: s.id })}</div>
              <div className="external-url">
                <a href={s.url} target="_blank" rel="noopener noreferrer" {...tip(t(`tips.views.home.services.${s.id}`, { defaultValue: t('tips.views.home.serviceGeneric') }))}>
                  <code>{s.url}</code>
                </a>
                <CopyButton value={s.url} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
