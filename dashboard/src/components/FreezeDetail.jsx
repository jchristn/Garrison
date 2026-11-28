import { useTranslation } from 'react-i18next';
import { resourceTip } from '../utils/tips';
import { enumLabel } from '../utils/enums';
import { formatDateTime, formatNumber } from '../i18n/formatters';
import { isActive, isKillSwitch } from '../utils/freezes';
import { FreezeStatusBadge } from './FreezeBadges';
import CopyableId from './CopyableId';
import { tip } from './Tooltip';

function Row({ label, tipText, children }) {
  const empty = children === null || children === undefined || children === '';
  return (
    <div className="info-row">
      <div className="info-label" {...tip(tipText)}>
        {label}
      </div>
      <div className="info-value">{empty ? '-' : children}</div>
    </div>
  );
}

/**
 * Read-only body of the Freeze details dialog (UXP1-V004): the target, kind, reason, who froze it and when, the
 * cancelled run count, and the lift state. The Freezes list has no form fields, so without this the dialog was empty.
 */
export default function FreezeDetail({ freeze }) {
  const { t, i18n } = useTranslation();
  const f = freeze || {};
  const lng = i18n.language;
  const label = (key) => t(`resources.freezes.columns.${key}`);
  const tipFor = (key) => resourceTip(t, 'freezes', key);
  const when = (v) => (v ? formatDateTime(v, lng, { dateStyle: 'medium', timeStyle: 'medium' }) : null);
  const lifted = !isActive(f);

  return (
    <div className="freeze-detail" data-testid="freeze-detail">
      <Row label={label('status')} tipText={tipFor('status')}>
        <FreezeStatusBadge freeze={f} t={t} />
      </Row>
      <Row label={label('targetKind')} tipText={tipFor('targetKind')}>
        {f.targetKind ? enumLabel(t, 'freezeTargetKind', f.targetKind) : null}
      </Row>
      <Row label={label('target')} tipText={tipFor('target')}>
        {isKillSwitch(f) ? t('freezes.killSwitchTarget') : f.targetName || null}
      </Row>
      {!isKillSwitch(f) && (
        <Row label={label('targetId')} tipText={tipFor('targetId')}>
          {f.targetId ? <CopyableId value={f.targetId} /> : null}
        </Row>
      )}
      <Row label={label('reason')} tipText={tipFor('reason')}>
        {f.reason ? <span className="freeze-detail-text">{f.reason}</span> : null}
      </Row>
      <Row label={label('createdBy')} tipText={tipFor('createdBy')}>
        {f.createdByName || f.createdById || null}
      </Row>
      <Row label={label('createdUtc')} tipText={tipFor('createdUtc')}>
        {when(f.createdUtc)}
      </Row>
      {f.cancelActiveRuns && (
        <Row label={label('cancelledRunCount')} tipText={tipFor('cancelledRunCount')}>
          {formatNumber(f.cancelledRunCount || 0, {}, lng)}
        </Row>
      )}
      {lifted && (
        <>
          <Row label={label('liftedUtc')} tipText={tipFor('liftedUtc')}>
            {when(f.liftedUtc)}
          </Row>
          <Row label={label('liftedBy')} tipText={tipFor('liftedBy')}>
            {f.liftedByName || f.liftedById || null}
          </Row>
          <Row label={label('liftReason')} tipText={tipFor('liftReason')}>
            {f.liftReason ? <span className="freeze-detail-text">{f.liftReason}</span> : null}
          </Row>
        </>
      )}
    </div>
  );
}
