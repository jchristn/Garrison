import { useTranslation } from 'react-i18next';
import { tip } from '../Tooltip';
import { errorMessage } from '../../utils/errors';
import { problemText, publishable } from '../../utils/orgCanvasSource';

/**
 * The live checks of the organization canvas (LP3.7): after each change the source validates the organization and
 * this lists what it found, errors (which stop a publish) apart from warnings (which do not), each problem with a
 * button that selects and focuses its unit on the canvas. result:
 * { valid, problems, error } from source.validate, or null before the first check. unitCount 0 (an organization with no
 * units yet) shows how to start instead of the checks, which have nothing to say about an empty tree (UXP1-S016).
 */
export default function OrgProblemsList({ result, checking = false, onShowUnit, idPrefix = 'org-problems', unitCount = null }) {
  const { t } = useTranslation();
  if (unitCount === 0) {
    return (
      <section className="org-problems" aria-labelledby={`${idPrefix}-title`} data-testid="org-problems">
        <div className="form-section-title" id={`${idPrefix}-title`} {...tip(t('tips.orgDesigner.problems.title'))}>
          {t('components.orgDesigner.problems.titleEmpty')}
        </div>
        <p className="text-muted" data-testid="org-problems-no-units">
          {t('components.orgDesigner.problems.noUnits')}
        </p>
      </section>
    );
  }
  const problems = result?.problems || [];
  return (
    <section className="org-problems" aria-labelledby={`${idPrefix}-title`} aria-busy={checking ? 'true' : undefined} data-testid="org-problems">
      <div className="form-section-title" id={`${idPrefix}-title`} {...tip(t('tips.orgDesigner.problems.title'))}>
        {t('components.orgDesigner.problems.title', { count: problems.length })}
      </div>
      <div role="status" aria-live="polite">
        {checking && !result ? (
          <p className="text-muted">{t('components.orgDesigner.problems.checking')}</p>
        ) : result?.error ? (
          <p className="text-muted" data-testid="org-problems-error">
            {t('components.orgDesigner.problems.failed', { reason: errorMessage(t, result.error) })}
          </p>
        ) : result && problems.length === 0 ? (
          <p className="text-muted" data-testid="org-problems-none">
            {t('components.orgDesigner.problems.none')}
          </p>
        ) : null}
      </div>
      {[
        ['Error', 'errors'],
        ['Warning', 'warnings']
      ].map(([severity, group]) => {
        const list = problems.map((p, i) => ({ p, i })).filter(({ p }) => (p.severity || 'Error') === severity);
        if (!list.length) return null;
        return (
          <div key={group} className={`org-problem-group is-${group}`} data-problem-group={group}>
            <div className="org-problem-group-title" id={`${idPrefix}-${group}`} {...tip(t(`tips.orgDesigner.problems.${group}`))}>
              {t(`components.orgDesigner.problems.${group}`, { count: list.length })}
            </div>
            <ul className="org-problem-list" aria-labelledby={`${idPrefix}-${group}`}>
              {list.map(({ p, i }) => (
                <li key={`${p.code}-${p.unitId || p.unit}-${p.agentId || p.agent}-${i}`} data-problem={p.code} data-problem-unit={p.unit} data-severity={severity}>
                  <span>{problemText(t, p)}</span>
                  {p.unit && onShowUnit ? (
                    <button type="button" className="button-ghost button-sm" onClick={() => onShowUnit(p.unit)} data-testid={`org-problem-show-${i}`} {...tip(t('tips.orgDesigner.problems.show'))}>
                      {t('components.orgDesigner.problems.show', { unit: p.unit })}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {problems.length > 0 && publishable(problems) && (
        <p className="field-hint" data-testid="org-problems-publishable">
          {t('components.orgDesigner.problems.warningsOnly')}
        </p>
      )}
    </section>
  );
}
