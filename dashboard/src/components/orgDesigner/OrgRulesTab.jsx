import { useTranslation } from 'react-i18next';
import { tip } from '../Tooltip';
import { EmptyNote } from '../States';
import { ChangeRuleStatusBadge } from '../ChangeRuleBadges';
import { PlusIcon } from '../Icons';
import { enumLabel } from '../../utils/enums';
import { limitText, ruleStatus } from '../../utils/changeRules';
import { deniedProps } from '../../utils/permissions';

/**
 * The Rules tab of the unit panel (LP3.6, LP-007): the change rules that apply to the unit (set on it or on a unit
 * above it, since a rule covers its unit's subtree), each with its status, classes, limits, the unit it is set on, and
 * the person who wrote it. Add rule and Edit open the existing change rule editor scoped to this unit; the canvas never
 * writes a rule itself and no draft operation carries one (AA-023: rules are people-only). `readOnly` is the reason the
 * tab cannot change rules (a run token, or no ChangeRule permission), shown in place of the actions.
 */
export default function OrgRulesTab({ unit, rules = [], loading = false, readOnly = '', onAdd, onEdit }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  return (
    <div className="org-design-tab" data-testid="org-rules">
      <p className="field-hint">{t('components.orgDesigner.rules.hint')}</p>
      {readOnly ? (
        <div className="info-banner" role="status" data-testid="org-rules-readonly">
          {readOnly}
        </div>
      ) : (
        <div>
          <button type="button" className="button-secondary button-sm" onClick={() => onAdd(unit)} data-testid="org-rules-add" {...tip(t('tips.orgDesigner.rules.add'))}>
            <PlusIcon size={14} /> {t('components.orgDesigner.rules.add')}
          </button>
        </div>
      )}
      {loading ? (
        <p className="text-muted">{t('common.generic.loading')}</p>
      ) : rules.length === 0 ? (
        <EmptyNote data-testid="org-rules-empty">{t('components.orgDesigner.rules.none')}</EmptyNote>
      ) : (
        <ul className="org-rule-list">
          {rules.map((r) => (
            <li key={r.id} className="org-rule-row" data-rule={r.name}>
              <div className="flex gap-sm items-center">
                <strong>{r.name}</strong>
                <ChangeRuleStatusBadge status={ruleStatus(r)} t={t} />
              </div>
              <div className="text-muted">
                {(r.classes || []).map((c) => enumLabel(t, 'changeClass', c.class)).join(', ') || '-'}
              </div>
              {(r.limits || []).length > 0 && (
                <ul className="change-rule-limits">
                  {r.limits.map((l) => (
                    <li key={`${l.class}/${l.name}`}>{limitText(t, l, lng)}</li>
                  ))}
                </ul>
              )}
              <div className="text-muted">
                {r.unitId === unit?.unitId ? t('components.orgDesigner.rules.here') : t('components.orgDesigner.rules.above', { unit: r.unitName || r.unitId })}
                {r.createdByName ? ` ${t('components.orgDesigner.rules.by', { name: r.createdByName })}` : ''}
              </div>
              <div>
                <button
                  type="button"
                  className="button-ghost button-sm"
                  onClick={() => !readOnly && onEdit(r)}
                  data-testid={`org-rules-edit-${r.name}`}
                  {...deniedProps(readOnly)}
                  {...tip(readOnly || t('tips.orgDesigner.rules.edit'))}
                >
                  {t('common.actions.edit')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
