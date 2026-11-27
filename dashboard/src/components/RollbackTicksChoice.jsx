import { useId } from 'react';
import { tip } from './Tooltip';
import { ENUMS } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';

/**
 * The in-flight ticks choice of an organization rollback (AA11.6): Finish (the default) lets keeper ticks already
 * running complete on the restored revisions; Cancel cancels them before the chart is restored. value and onChange
 * carry the RollbackActiveTicksEnum wire value.
 */
export default function RollbackTicksChoice({ value = 'Finish', onChange, t, disabled = false }) {
  const name = useId();
  return (
    <fieldset className="rollback-ticks" data-testid="rollback-ticks">
      <legend {...tip(t('tips.rollbackTicks.legend'))}>{t('rollbackTicks.legend')}</legend>
      {ENUMS.rollbackActiveTicks.map((v) => (
        <label key={v} className={`checkbox-chip ${value === v ? 'selected' : ''}`} {...tip(enumTip(t, 'rollbackActiveTicks', v))}>
          <input type="radio" name={name} value={v} checked={value === v} disabled={disabled} onChange={() => onChange?.(v)} data-testid={`rollback-ticks-${v.toLowerCase()}`} />
          <span>{enumLabel(t, 'rollbackActiveTicks', v)}</span>
        </label>
      ))}
    </fieldset>
  );
}
