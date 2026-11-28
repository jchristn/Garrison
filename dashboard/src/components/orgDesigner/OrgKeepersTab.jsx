import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from '../Tooltip';
import { EmptyNote } from '../States';
import { MandateStatusBadge } from '../KeeperBadges';
import StudioLink from '../studio/StudioLink';
import { PlusIcon } from '../Icons';
import { pathFor } from '../../config/navConfig';
import { formatDateTime, formatRelativeTime } from '../../i18n/formatters';
import { formatInterval } from '../../utils/keepers';
import { deniedProps } from '../../utils/permissions';

/** The next wake of a keeper in words: relative time while it is active, else its status. */
export function nextWakeText(t, mandate, lng) {
  if (!mandate || !mandate.status) return '';
  if (mandate.status === 'Active' && mandate.nextWakeUtc) return t('components.orgDesigner.keepers.nextWake', { when: formatRelativeTime(mandate.nextWakeUtc, lng) });
  return t('components.orgDesigner.keepers.notScheduled');
}

/**
 * The Keepers tab of the unit panel (LP3.4): each person in the unit (lead first) with the keeper (mandate) attached to
 * their position and its wake schedule, and the agent's other keepers to attach instead. Attach and Detach change the
 * position through the source; New keeper opens the existing keeper form with the agent filled in and attaches what it
 * creates; Edit schedule opens New revision for the keeper. mandates: the tenant's mandates (list rows).
 */
export default function OrgKeepersTab({ unit, mandates = [], blocked = '', onAttach, onDetach, onCreate, onEditSchedule }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const [choice, setChoice] = useState({});
  const people = unit?.people || [];
  const byId = new Map(mandates.map((m) => [m.id, m]));
  if (!people.length) return <EmptyNote data-testid="org-keepers-empty">{t('components.orgDesigner.keepers.noPeople')}</EmptyNote>;
  return (
    <div className="org-design-tab" data-testid="org-keepers">
      <p className="field-hint">{t('components.orgDesigner.keepers.hint')}</p>
      <ul className="org-keeper-list">
        {people.map((p) => {
          const attached = p.mandateId ? byId.get(p.mandateId) || { id: p.mandateId, name: p.mandateId } : null;
          const own = mandates.filter((m) => m.agentId === p.agentId && m.id !== p.mandateId);
          const picked = own.some((m) => m.id === choice[p.name]) ? choice[p.name] : own[0]?.id || '';
          const selectId = `org-keeper-pick-${unit.name}-${p.name}`;
          return (
            <li key={p.name} className="org-keeper-row" data-keeper-person={p.name}>
              <div className="org-keeper-who">
                <strong>{p.name}</strong>
                <span className="text-muted">{p.lead ? t('components.orgDesigner.keepers.lead') : t('components.orgDesigner.keepers.member')}</span>
              </div>
              {attached ? (
                <div className="org-keeper-attached" data-testid={`org-keeper-attached-${p.name}`}>
                  <StudioLink to={pathFor('keepers', attached.id)} testId={`org-keeper-open-${p.name}`} tipText={t('tips.orgDesigner.keepers.open')}>
                    {attached.name}
                  </StudioLink>
                  {attached.status ? <MandateStatusBadge status={attached.status} t={t} /> : null}
                  <span className="text-muted" {...(attached.nextWakeUtc ? tip(formatDateTime(attached.nextWakeUtc, lng)) : {})}>
                    {nextWakeText(t, attached, lng)}
                    {attached.currentIntervalSeconds ? ` (${t('components.orgDesigner.keepers.every', { interval: formatInterval(t, attached.currentIntervalSeconds) })})` : ''}
                  </span>
                  <div className="flex gap-sm">
                    <button type="button" className="button-ghost button-sm" onClick={() => !blocked && onEditSchedule(attached)} data-testid={`org-keeper-schedule-${p.name}`} {...deniedProps(blocked)} {...tip(blocked || t('tips.orgDesigner.keepers.schedule'))}>
                      {t('components.orgDesigner.keepers.schedule')}
                    </button>
                    <button type="button" className="button-ghost button-sm" onClick={() => !blocked && onDetach(p.name)} data-testid={`org-keeper-detach-${p.name}`} {...deniedProps(blocked)} {...tip(blocked || t('tips.orgDesigner.keepers.detach'))}>
                      {t('components.orgDesigner.keepers.detach')}
                    </button>
                  </div>
                </div>
              ) : (
                <span className="text-muted">{t('components.orgDesigner.keepers.none')}</span>
              )}
              <div className="org-keeper-actions">
                {own.length > 0 && (
                  <>
                    <label htmlFor={selectId} className="sr-only" {...tip(t('tips.orgDesigner.keepers.pick'))}>
                      {t('components.orgDesigner.keepers.pick')}
                    </label>
                    <select id={selectId} value={picked} disabled={!!blocked} onChange={(e) => setChoice((c) => ({ ...c, [p.name]: e.target.value }))} data-testid={`org-keeper-pick-${p.name}`} {...tip(t('tips.orgDesigner.keepers.pick'))}>
                      {own.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="button-secondary button-sm" onClick={() => !blocked && picked && onAttach(p.name, picked)} data-testid={`org-keeper-attach-${p.name}`} {...deniedProps(blocked)} {...tip(blocked || t('tips.orgDesigner.keepers.attach'))}>
                      {t('components.orgDesigner.keepers.attach')}
                    </button>
                  </>
                )}
                <button type="button" className="button-secondary button-sm" onClick={() => !blocked && onCreate(p)} data-testid={`org-keeper-create-${p.name}`} {...deniedProps(blocked)} {...tip(blocked || t('tips.orgDesigner.keepers.create'))}>
                  <PlusIcon size={14} /> {t('components.orgDesigner.keepers.create')}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
