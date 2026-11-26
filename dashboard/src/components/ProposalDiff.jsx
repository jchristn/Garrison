import { Badge } from './StatusBadge';
import { tip } from './Tooltip';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { DIFF_CHANGES, diffChangeTone, itemKey } from '../utils/studio';

/**
 * The diff of an executive's proposal (AA8.12, shared with the board in AA10.4): whether change rules cover it, the
 * hard-limit refusals, and one row per changed item with its field changes and the rule that covers it or why it
 * needs a person. `diff` is the proposal's StudioDraftDiff.
 */
export default function ProposalDiff({ diff, t }) {
  if (!diff) return null;
  const matches = new Map((diff.ruleMatches || []).map((m) => [`${m.kind}/${m.name}`, m]));
  const refusals = diff.refusals || [];
  return (
    <>
      <div className={diff.appliesByRule ? 'info-banner' : 'warning-banner'} role="status" data-testid="org-proposal-coverage">
        {t(diff.appliesByRule ? 'orgProposals.review.covered' : 'orgProposals.review.notCovered')}
      </div>
      {refusals.length > 0 && (
        <div className="error-banner" role="alert" data-testid="org-proposal-refusals">
          <div>{t('orgProposals.review.refusals')}</div>
          <ul className="studio-list">
            {refusals.map((r, i) => (
              <li key={`${r.kind}/${r.name}/${i}`}>
                <code>{`${r.kind}/${r.name}`}</code> {r.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(diff.items || []).length === 0 ? (
        <p className="text-muted">{t('orgProposals.review.noChanges')}</p>
      ) : (
        <div className="table-scroll" tabIndex={0} role="region" aria-label={t('orgProposals.review.columns.item')}>
          <table className="data-table compact" data-testid="org-proposal-changes">
            <thead>
              <tr>
                {['item', 'change', 'rule'].map((c) => (
                  <th key={c} scope="col" {...tip(t(`tips.orgProposals.review.columns.${c}`))}>
                    {t(`orgProposals.review.columns.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {diff.items.map((item) => {
                const change = DIFF_CHANGES.includes(item.change) ? item.change : 'Unchanged';
                const match = matches.get(`${item.kind}/${item.name}`);
                return (
                  <tr key={itemKey(item)} data-change={itemKey(item)}>
                    <td>
                      <code>{itemKey(item)}</code>
                      {(item.changes || []).length > 0 && (
                        <ul className="studio-list studio-field-changes">
                          {item.changes.map((c) => (
                            <li key={c.field}>
                              <code>{c.field}</code>: <span className="studio-before">{c.before ?? t('components.studio.diff.none')}</span> {'->'} <span className="studio-after">{c.after ?? t('components.studio.diff.none')}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.message && <div className={change === 'Failed' ? 'text-danger' : 'text-muted'}>{item.message}</div>}
                    </td>
                    <td className="nowrap">
                      <Badge tone={diffChangeTone(change)} tip={enumTip(t, 'studioDiffChange', change)}>
                        {enumLabel(t, 'studioDiffChange', change)}
                      </Badge>
                    </td>
                    <td className="org-proposal-rule">
                      {match?.ruleId ? (
                        <span className="inline-meta">
                          <Badge tone="success" tip={t('tips.orgProposals.review.coveredBy')}>
                            {t('orgProposals.review.coveredBy', { name: match.ruleName || match.ruleId })}
                          </Badge>
                          {(match.classes || []).length > 0 && <span className="text-muted">{match.classes.map((c) => enumLabel(t, 'changeClass', c)).join(', ')}</span>}
                        </span>
                      ) : match ? (
                        <span className="org-proposal-decision">
                          <Badge tone="warning" tip={t('tips.orgProposals.decision.needsApproval')}>
                            {t('orgProposals.decision.needsApproval')}
                          </Badge>
                          {match.reason && <span className="text-muted">{match.reason}</span>}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
