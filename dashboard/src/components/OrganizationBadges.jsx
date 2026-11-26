import { Badge } from './StatusBadge';
import { tip } from './Tooltip';
import { organizationStatusTone, orgRevisionStateTone } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { formatCurrency, formatPercent } from '../i18n/formatters';
import { spendFraction, spendTone } from '../utils/organizations';

/** Organization status pill: Draft, Active, Frozen, or Retired. */
export function OrganizationStatusBadge({ status, t }) {
  if (!status) return '-';
  return (
    <Badge tone={organizationStatusTone(status)} tip={enumTip(t, 'organizationStatus', status)}>
      {enumLabel(t, 'organizationStatus', status)}
    </Badge>
  );
}

/** Org revision state pill: Draft, Published, or Superseded. */
export function OrgRevisionStateBadge({ state, t }) {
  if (!state) return '-';
  return (
    <Badge tone={orgRevisionStateTone(state)} tip={enumTip(t, 'orgRevisionState', state)}>
      {enumLabel(t, 'orgRevisionState', state)}
    </Badge>
  );
}

/**
 * One budget's spend as a bar: the period, spent of the budget, and the share. The bar is a meter for assistive
 * technology; a unit without a budget for the period shows its spend alone.
 */
export function SpendBar({ row, t, lng, testId }) {
  if (!row) return null;
  const fraction = spendFraction(row);
  const period = enumLabel(t, 'budgetPeriod', row.period);
  const spent = formatCurrency(row.spentUsd ?? 0, lng, 'USD');
  const label =
    fraction == null
      ? t('organizations.spend.noBudget', { period, spent })
      : t('organizations.spend.of', { period, spent, amount: formatCurrency(row.amountUsd, lng, 'USD'), percent: formatPercent(fraction, lng, { digits: 0 }) });
  return (
    <div className={`org-spend org-spend-${spendTone(row)}`} data-testid={testId} data-period={row.period} {...tip(row.exhausted ? t('tips.organizations.spend.exhausted') : t('tips.organizations.spend.bar'))}>
      <div className="org-spend-label">
        <span>{label}</span>
        {row.exhausted && <Badge tone="danger">{t('organizations.spend.exhausted')}</Badge>}
      </div>
      {fraction != null && (
        <div className="org-spend-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraction * 100)}>
          <div className="org-spend-fill" style={{ width: `${Math.round(fraction * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
