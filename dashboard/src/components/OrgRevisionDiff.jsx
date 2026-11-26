import { tip } from './Tooltip';
import { diffIsEmpty } from '../utils/organizations';

/**
 * What changed between two trees of units (AA7.14), from diffOrgUnits: units added and removed, and for each changed
 * unit the fields with their value before and after. Values are plain text.
 */
export default function OrgRevisionDiff({ diff, t, beforeLabel, afterLabel }) {
  if (diffIsEmpty(diff)) {
    return (
      <p className="text-muted" data-testid="org-diff-empty">
        {t('organizations.diff.none')}
      </p>
    );
  }
  const empty = <span className="text-muted">{t('organizations.diff.empty')}</span>;
  return (
    <div className="org-diff" data-testid="org-diff">
      <p className="text-muted">{t('organizations.diff.between', { before: beforeLabel, after: afterLabel })}</p>
      {diff.added.length > 0 && (
        <div className="org-diff-group" data-testid="org-diff-added">
          <h4 className="org-diff-title" {...tip(t('tips.organizations.diff.added'))}>{t('organizations.diff.added', { count: diff.added.length })}</h4>
          <ul className="org-diff-list">
            {diff.added.map((name) => (
              <li key={`a-${name}`} className="org-diff-added">
                + {name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {diff.removed.length > 0 && (
        <div className="org-diff-group" data-testid="org-diff-removed">
          <h4 className="org-diff-title" {...tip(t('tips.organizations.diff.removed'))}>{t('organizations.diff.removed', { count: diff.removed.length })}</h4>
          <ul className="org-diff-list">
            {diff.removed.map((name) => (
              <li key={`r-${name}`} className="org-diff-removed">
                - {name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {diff.changed.length > 0 && (
        <div className="org-diff-group" data-testid="org-diff-changed">
          <h4 className="org-diff-title" {...tip(t('tips.organizations.diff.changed'))}>{t('organizations.diff.changed', { count: diff.changed.length })}</h4>
          {diff.changed.map((c) => (
            <div key={c.id || c.name} className="org-diff-unit" data-unit={c.name}>
              <div className="org-diff-unit-name">{c.name}</div>
              <div className="table-scroll">
                <table className="data-table compact">
                  <thead>
                    <tr>
                      <th scope="col">{t('organizations.diff.field')}</th>
                      <th scope="col">{beforeLabel}</th>
                      <th scope="col">{afterLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.fields.map((f) => (
                      <tr key={f.field} data-field={f.field}>
                        <td className="nowrap">{t(`organizations.diff.fields.${f.field}`)}</td>
                        <td className="org-diff-value">{f.before || empty}</td>
                        <td className="org-diff-value">{f.after || empty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
