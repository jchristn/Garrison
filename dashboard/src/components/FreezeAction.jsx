import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FreezeModal from './FreezeModal';
import LiftFreezeModal from './LiftFreezeModal';
import { tip } from './Tooltip';
import { freezeDenied, freezeOn } from '../utils/freezes';

/**
 * The Freeze or Lift header button of an agent, deployment, keeper, or app page (AA3): Freeze while the record has no
 * freeze of its own, Lift while it does. Both open a confirmation dialog. Hidden when the caller cannot read freezes;
 * disabled with the missing permission in the tooltip when the caller may read but not change them.
 */
export default function FreezeAction({ targetKind, targetId, targetName, active, permissions = null }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  if (!active || !targetId) return null;
  const { freezes, readable } = active;
  if (!readable) return null;
  const own = freezeOn(freezes, targetKind, targetId);
  const denied = freezeDenied(t, permissions, own ? 'Update' : 'Create');

  return (
    <>
      {own ? (
        <button type="button" className="button-secondary" aria-disabled={denied ? 'true' : undefined} onClick={() => !denied && setOpen('lift')} data-testid="freeze-lift" {...tip(denied || t('tips.freezes.actions.lift'))}>
          {t('freezes.actions.lift')}
        </button>
      ) : (
        <button type="button" className="button-danger" aria-disabled={denied ? 'true' : undefined} onClick={() => !denied && setOpen('freeze')} data-testid="freeze-apply" {...tip(denied || t('tips.freezes.actions.freeze'))}>
          {t('freezes.actions.freeze')}
        </button>
      )}
      {open === 'freeze' && <FreezeModal targetKind={targetKind} targetId={targetId} targetName={targetName} onClose={() => setOpen(null)} onDone={() => setOpen(null)} />}
      {open === 'lift' && own && <LiftFreezeModal freeze={own} onClose={() => setOpen(null)} onDone={() => setOpen(null)} />}
    </>
  );
}
