import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from '../Tooltip';
import { SpendBar } from '../OrganizationBadges';
import { formatCurrency } from '../../i18n/formatters';
import { enumLabel } from '../../utils/enums';
import { orgErrorMessage, spendOf } from '../../utils/organizations';
import { budgetCap } from '../../utils/orgCanvasSource';
import { deniedProps } from '../../utils/permissions';

const PERIODS = ['Day', 'Month'];

/**
 * The Budget tab of the unit panel (LP3.5): for the Day and the Month, the unit's budget, what its subtree spent so far
 * in the current window (live revision), and the most the budget may be: the budget of the nearest unit above it for
 * that period, with what that unit has left. Save sends the budget through the source, which replaces the unit with
 * the existing unit route; Clear removes it. A budget the server refuses (409 BudgetExceedsParent, BudgetInvalid) shows
 * inline under the period with the server's reason. onSave(period, amountUsd or null) answers a promise of
 * { ok } or { error }.
 */
export default function OrgBudgetTab({ unit, units = [], spend = [], blocked = '', onSave }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const budgets = unit?.budgets || [];
  const amountOf = (period) => budgets.find((b) => b.period === period)?.amountUsd ?? '';
  const [values, setValues] = useState(() => Object.fromEntries(PERIODS.map((p) => [p, amountOf(p) === '' ? '' : String(amountOf(p))])));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState('');
  const rows = spendOf(spend, unit?.unitId);
  const usd = (v) => formatCurrency(v, lng, 'USD');

  const save = async (period, clear = false) => {
    if (blocked || busy) return;
    const raw = clear ? '' : String(values[period] ?? '').trim();
    if (raw !== '' && !(Number(raw) > 0)) {
      setErrors((e) => ({ ...e, [period]: t('organizations.unit.errors.budget') }));
      return;
    }
    setBusy(period);
    setErrors((e) => ({ ...e, [period]: '' }));
    const result = await onSave(period, raw === '' ? null : Number(raw));
    setBusy('');
    if (result?.error) setErrors((e) => ({ ...e, [period]: orgErrorMessage(t, result.error) }));
    else if (clear) setValues((v) => ({ ...v, [period]: '' }));
  };

  return (
    <div className="org-design-tab" data-testid="org-budget">
      <p className="field-hint">{t('components.orgDesigner.budget.hint')}</p>
      {PERIODS.map((period) => {
        const label = enumLabel(t, 'budgetPeriod', period);
        const cap = budgetCap(units, unit?.unitId, period);
        const capSpend = cap ? spendOf(spend, cap.unitId).find((r) => r.period === period) : null;
        const row = rows.find((r) => r.period === period);
        const id = `org-budget-${unit?.name}-${period}`;
        return (
          <fieldset key={period} className="org-budget-period" data-budget-period={period}>
            <legend {...tip(t('tips.orgDesigner.budget.period'))}>{label}</legend>
            <div className="studio-canvas-row">
              <label htmlFor={id} {...tip(t('tips.orgDesigner.budget.amount'))}>
                {t('components.orgDesigner.budget.amount')}
              </label>
              <input
                id={id}
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={values[period]}
                readOnly={!!blocked}
                placeholder={t('organizations.unit.noBudget')}
                aria-invalid={errors[period] ? 'true' : undefined}
                aria-describedby={errors[period] ? `${id}-error` : undefined}
                onChange={(e) => setValues((v) => ({ ...v, [period]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), save(period))}
                data-testid={`org-budget-input-${period}`}
                {...tip(blocked || t('tips.orgDesigner.budget.amount'))}
              />
              <button type="button" className="button-secondary button-sm" onClick={() => save(period)} data-testid={`org-budget-save-${period}`} {...deniedProps(blocked || busy)} {...tip(blocked || t('tips.orgDesigner.budget.save'))}>
                {busy === period ? t('common.generic.saving') : t('common.actions.save')}
              </button>
              {amountOf(period) !== '' && (
                <button type="button" className="button-ghost button-sm" onClick={() => save(period, true)} data-testid={`org-budget-clear-${period}`} {...deniedProps(blocked || busy)} {...tip(blocked || t('tips.orgDesigner.budget.clear'))}>
                  {t('components.orgDesigner.budget.clear')}
                </button>
              )}
            </div>
            {errors[period] && (
              <div id={`${id}-error`} className="error-banner" role="alert" data-testid={`org-budget-error-${period}`}>
                {errors[period]}
              </div>
            )}
            {row ? <SpendBar row={row} t={t} lng={lng} testId={`org-budget-spend-${period}`} /> : <p className="text-muted">{t('components.orgDesigner.budget.noSpend')}</p>}
            <p className="text-muted" data-testid={`org-budget-cap-${period}`} {...tip(t('tips.orgDesigner.budget.cap'))}>
              {cap
                ? t('components.orgDesigner.budget.cap', { amount: usd(cap.amountUsd), unit: cap.unitName, period: label })
                : t('components.orgDesigner.budget.noCap', { period: label })}
              {cap && capSpend ? ` ${t('components.orgDesigner.budget.capLeft', { left: usd(Math.max(0, Number(cap.amountUsd) - Number(capSpend.spentUsd || 0))), unit: cap.unitName })}` : ''}
            </p>
          </fieldset>
        );
      })}
    </div>
  );
}
