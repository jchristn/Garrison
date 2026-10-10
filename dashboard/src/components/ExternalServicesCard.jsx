import { useTranslation } from 'react-i18next';
import CopyButton from './CopyButton';
import { EXTERNAL_SERVICES } from '../utils/constants';

/** Links to bundled observability tools with browser-reachable URLs and default credentials. */
export default function ExternalServicesCard() {
  const { t } = useTranslation();
  const services = EXTERNAL_SERVICES.filter((s) => s.enabled);
  return (
    <section className="panel" aria-labelledby="ext-services-title">
      <h2 id="ext-services-title" className="section-title">
        {t('views.home.externalServices')}
      </h2>
      {services.length === 0 ? (
        <p className="text-muted">{t('views.home.externalServicesNone')}</p>
      ) : (
        <>
          <p className="text-muted external-note">{t('views.home.externalServicesNote')}</p>
          <ul className="external-list">
            {services.map((s) => (
              <li key={s.id} className="external-item">
                <div className="external-name">{t(`views.home.services.${s.id}`, { defaultValue: s.id })}</div>
                <div className="external-url">
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    <code>{s.url}</code>
                  </a>
                  <CopyButton value={s.url} />
                </div>
                {s.username && (
                  <div className="external-creds text-muted">
                    {t('views.home.credentials')}: <code>{s.username}</code> / <code>{s.password}</code>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
