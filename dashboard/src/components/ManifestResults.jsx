import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from './StatusBadge';
import { tip } from './Tooltip';
import { enumTip } from '../utils/tips';
import { enumLabel } from '../utils/enums';
import { translateServerText } from '../utils/serverText';

const RESULT_TONE = { Created: 'success', Updated: 'info', Unchanged: 'neutral', Failed: 'danger', Validated: 'neutral' };

/**
 * Per-document manifest results with field-level changes (M1-14). Each Updated item lists its `changes`
 * ({ field, before, after }) in a diff table under its row; values are the server's strings (up to 200 characters).
 */
export default function ManifestResults({ items, testId = 'manifest-results' }) {
  const { t } = useTranslation();
  const none = <span className="text-muted">{t('views.manifests.changes.empty')}</span>;
  return (
    <div className="table-scroll">
      <table className="data-table manifest-results" data-testid={testId}>
        <thead>
          <tr>
            <th scope="col" {...tip(t('tips.views.manifests.kind'))}>{t('views.manifests.kind')}</th>
            <th scope="col" {...tip(t('tips.views.manifests.name'))}>{t('views.manifests.name')}</th>
            <th scope="col" {...tip(t('tips.views.manifests.result'))}>{t('views.manifests.result')}</th>
            <th scope="col" {...tip(t('tips.views.manifests.message'))}>{t('views.manifests.message')}</th>
          </tr>
        </thead>
        <tbody>
          {(items || []).map((it, i) => {
            const changes = Array.isArray(it.changes) ? it.changes : [];
            return (
              <Fragment key={it.id || i}>
                <tr data-item={it.name}>
                  <td>{it.kind}</td>
                  <td>
                    <code>{it.name}</code>
                  </td>
                  <td>
                    <Badge tone={RESULT_TONE[it.result] || 'neutral'} tip={enumTip(t, 'manifestApplyResult', it.result)}>
                      {enumLabel(t, 'manifestApplyResult', it.result)}
                    </Badge>
                    {it.plannedResult && it.plannedResult !== it.result && (
                      <Badge tone={RESULT_TONE[it.plannedResult] || 'neutral'} tip={t('tips.views.manifests.planned')}>
                        {t('views.manifests.planned', { result: enumLabel(t, 'manifestApplyResult', it.plannedResult) })}
                      </Badge>
                    )}
                  </td>
                  <td>
                    {it.errorCode && <><code className="text-danger" data-testid="manifest-error-code">{it.errorCode}</code>{' '}</>}
                    {it.message ? translateServerText(t, it.message) : changes.length ? t('views.manifests.changes.count', { count: changes.length }) : '-'}
                  </td>
                </tr>
                {changes.length > 0 && (
                  <tr className="manifest-changes-row">
                    <td colSpan={4}>
                      <table className="data-table manifest-changes" data-testid="manifest-changes">
                        <thead>
                          <tr>
                            <th scope="col" {...tip(t('tips.views.manifests.changes.field'))}>{t('views.manifests.changes.field')}</th>
                            <th scope="col" {...tip(t('tips.views.manifests.changes.before'))}>{t('views.manifests.changes.before')}</th>
                            <th scope="col" {...tip(t('tips.views.manifests.changes.after'))}>{t('views.manifests.changes.after')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {changes.map((c, j) => (
                            <tr key={`${c.field}-${j}`}>
                              <td>
                                <code>{c.field}</code>
                              </td>
                              <td className="diff-cell diff-cell-del">{c.before === null || c.before === undefined || c.before === '' ? none : <code>{c.before}</code>}</td>
                              <td className="diff-cell diff-cell-add">{c.after === null || c.after === undefined || c.after === '' ? none : <code>{c.after}</code>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
