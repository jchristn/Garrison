import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LiftFreezeModal from './LiftFreezeModal';
import { tip } from './Tooltip';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { freezeDenied, freezeTargetPath, freezeTargetText, isKillSwitch } from '../utils/freezes';

/**
 * Frozen banner (AA3) for the agent, deployment, keeper, and app pages: one line per active freeze that stops the
 * page's record (its own, or one on the agent or deployment it runs on, or the kill switch for keepers), with who froze
 * it, when, and why, and Lift. `own` names the freeze placed on the record itself; others link to what they freeze.
 * Lift stays visible but disabled, with the missing permission in its tooltip, for callers without Update on Freeze.
 */
export default function FrozenBanner({ freezes, permissions = null, own = null, link = true, testId = 'frozen-banner' }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [lifting, setLifting] = useState(null);
  const lng = i18n.language;
  if (!freezes || freezes.length === 0) return null;
  const denied = freezeDenied(t, permissions, 'Update');

  return (
    <>
      {freezes.map((f) => {
        const kill = isKillSwitch(f);
        const target = freezeTargetText(t, f);
        const path = f === own || kill || !link ? null : freezeTargetPath(f);
        const who = f.createdByName || f.createdById || '';
        return (
          <div key={f.id} className="warning-banner frozen-banner" role="status" data-testid={testId} data-freeze-id={f.id}>
            <span>
              <strong>{kill ? t('freezes.bannerKillSwitch') : f === own ? t('freezes.bannerOwn') : t('freezes.bannerTarget', { target })}</strong>{' '}
              {path && (
                <a
                  href={path}
                  {...tip(t('tips.freezes.openTarget'))}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(path);
                  }}
                >
                  {t('freezes.openTarget')}
                </a>
              )}{' '}
              <span className="text-muted" {...tip(formatDateTime(f.createdUtc, lng))}>
                {who ? t('freezes.bannerBy', { who, when: formatRelativeTime(f.createdUtc, lng) }) : formatRelativeTime(f.createdUtc, lng)}
              </span>
              {f.reason && <span className="frozen-reason"> {t('freezes.bannerReason', { reason: f.reason })}</span>}
            </span>
            {!kill && (
              <button
                type="button"
                className="button-secondary button-sm"
                aria-disabled={denied ? 'true' : undefined}
                onClick={() => !denied && setLifting(f)}
                data-testid="frozen-banner-lift"
                {...tip(denied || t('tips.freezes.actions.lift'))}
              >
                {t('freezes.actions.lift')}
              </button>
            )}
          </div>
        );
      })}
      {lifting && <LiftFreezeModal freeze={lifting} onClose={() => setLifting(null)} onDone={() => setLifting(null)} />}
    </>
  );
}
