import { useTranslation } from 'react-i18next';
import { PlusIcon, TrashIcon } from './Icons';
import { tip } from './Tooltip';
import { EVAL_LIMITS, ENUMS } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { blankCheck } from '../utils/evaluations';

/**
 * The checks of an eval case (AA9.15): one row per check with its scorer, an argument whose meaning depends on the
 * scorer (the exact text or the text to find, which default to the case's expected text, a JSON Schema, or the judge's
 * rubric), and a weight from 0 to 100. errors holds keys checks[i].argument and checks[i].weight. With no checks the
 * server scores by exact match against the expected text, or by the judge when there is none.
 */
export default function EvalChecksEditor({ checks, onChange, errors = {}, disabled = false, idPrefix = 'eval-check' }) {
  const { t } = useTranslation();
  const rows = Array.isArray(checks) ? checks : [];
  const update = (i, patch) => onChange(rows.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <fieldset className="eval-checks" data-testid="eval-checks">
      <legend {...tip(t('tips.evals.case.checks'))}>{t('evals.case.fields.checks')}</legend>
      {rows.length === 0 && <p className="text-muted eval-checks-none">{t('evals.case.checks.none')}</p>}
      {rows.map((c, i) => {
        const argError = errors[`checks[${i}].argument`];
        const weightError = errors[`checks[${i}].weight`];
        const long = c.scorer === 'JsonSchemaValid' || c.scorer === 'Judge';
        return (
          <div className="eval-check-row" key={i} data-check={i}>
            <div className="field">
              <label htmlFor={`${idPrefix}-${i}-scorer`} {...tip(t('tips.evals.case.scorer'))}>
                {t('evals.case.checks.scorer')}
              </label>
              <select id={`${idPrefix}-${i}-scorer`} value={c.scorer} disabled={disabled} onChange={(e) => update(i, { scorer: e.target.value })} {...tip(t('tips.evals.case.scorer'))}>
                {ENUMS.evalScorer.map((s) => (
                  <option key={s} value={s}>
                    {enumLabel(t, 'evalScorer', s)}
                  </option>
                ))}
              </select>
              <div className="field-hint">{t(`evals.case.scorerHints.${c.scorer}`)}</div>
            </div>
            <div className={`field ${argError ? 'has-error' : ''}`}>
              <label htmlFor={`${idPrefix}-${i}-argument`} {...tip(t(`tips.evals.case.argument.${c.scorer}`))}>
                {t(`evals.case.argumentLabels.${c.scorer}`)}
              </label>
              {long ? (
                <textarea
                  id={`${idPrefix}-${i}-argument`}
                  rows={c.scorer === 'JsonSchemaValid' ? 5 : 3}
                  className={c.scorer === 'JsonSchemaValid' ? 'monospace code-input' : undefined}
                  spellCheck={c.scorer !== 'JsonSchemaValid'}
                  value={c.argument ?? ''}
                  disabled={disabled}
                  placeholder={t(`evals.case.argumentPlaceholders.${c.scorer}`)}
                  onChange={(e) => update(i, { argument: e.target.value })}
                  {...tip(t(`tips.evals.case.argument.${c.scorer}`))}
                />
              ) : (
                <input
                  id={`${idPrefix}-${i}-argument`}
                  type="text"
                  value={c.argument ?? ''}
                  disabled={disabled}
                  placeholder={t(`evals.case.argumentPlaceholders.${c.scorer}`)}
                  onChange={(e) => update(i, { argument: e.target.value })}
                  {...tip(t(`tips.evals.case.argument.${c.scorer}`))}
                />
              )}
              {argError && (
                <div className="field-error" role="alert">
                  {argError}
                </div>
              )}
            </div>
            <div className={`field eval-check-weight ${weightError ? 'has-error' : ''}`}>
              <label htmlFor={`${idPrefix}-${i}-weight`} {...tip(t('tips.evals.case.weight'))}>
                {t('evals.case.checks.weight')}
              </label>
              <input
                id={`${idPrefix}-${i}-weight`}
                type="number"
                min={0}
                max={EVAL_LIMITS.weightMax}
                step="any"
                value={c.weight ?? ''}
                disabled={disabled}
                onChange={(e) => update(i, { weight: e.target.value === '' ? '' : Number(e.target.value) })}
                {...tip(t('tips.evals.case.weight'))}
              />
              {weightError && (
                <div className="field-error" role="alert">
                  {weightError}
                </div>
              )}
            </div>
            <div className="eval-check-actions">
              <button type="button" className="icon-button" disabled={disabled} onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={t('evals.case.checks.remove', { number: i + 1 })} {...tip(t('tips.evals.case.removeCheck'))}>
                <TrashIcon size={14} />
              </button>
            </div>
          </div>
        );
      })}
      <button type="button" className="button-secondary button-sm" disabled={disabled} onClick={() => onChange([...rows, blankCheck(rows.length ? 'Contains' : 'ExactMatch')])} data-testid="eval-check-add" {...tip(t('tips.evals.case.addCheck'))}>
        <PlusIcon size={14} /> {t('evals.case.checks.add')}
      </button>
    </fieldset>
  );
}
