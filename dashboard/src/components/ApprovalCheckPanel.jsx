import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip';
import { ApprovalActionBadge } from './ApprovalBadges';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { APPROVAL_TEST_TOOLS, APPROVAL_INPUT_EXAMPLES, approvalCheckBody, approvalInputField } from '../utils/approvals';

/**
 * "Test a tool call" helper in the deployment editor (P12.3): posts a tool name and its command, URL, or path to
 * deployments/{id}/approval-check and shows what the deployment's saved rules would do. Nothing is recorded. Needs a
 * saved deployment, because the server evaluates the rules it has stored, not unsaved edits in the form.
 */
export default function ApprovalCheckPanel({ deploymentId }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [toolName, setToolName] = useState('Bash');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const field = approvalInputField(toolName);

  const check = async () => {
    if (!deploymentId || !toolName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await apiClient.checkApproval(tenantId, deploymentId, approvalCheckBody(toolName, value)));
    } catch (e) {
      setResult(null);
      setError(`${errorMessage(t, e)} ${errorDetail(t, e)}`.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="approval-check" data-testid="approval-check" aria-labelledby="approval-check-title">
      <div id="approval-check-title" className="form-section-title" {...tip(t('tips.resources.deployments.approvalTest'))}>
        {t('components.approvalCheck.title')}
      </div>
      {!deploymentId ? (
        <div className="field-hint" data-testid="approval-check-unsaved">
          {t('components.approvalCheck.saveFirst')}
        </div>
      ) : (
        <>
          <div className="field-hint">{t('components.approvalCheck.hint')}</div>
          <div className="approval-check-row">
            <div className="field">
              <label htmlFor="approval-check-tool" {...tip(t('tips.approvalCheck.toolName'))}>
                {t('components.approvalCheck.toolName')}
              </label>
              <input id="approval-check-tool" type="text" className="monospace" list="approval-check-tools" value={toolName} onChange={(e) => setToolName(e.target.value)} data-testid="approval-check-tool" {...tip(t('tips.approvalCheck.toolName'))} />
              <datalist id="approval-check-tools">
                {APPROVAL_TEST_TOOLS.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            {field && (
              <div className="field approval-check-value">
                <label htmlFor="approval-check-value" {...tip(t(`tips.approvalCheck.inputs.${field}`))}>
                  {t(`components.approvalCheck.inputs.${field}`)}
                </label>
                <input
                  id="approval-check-value"
                  type="text"
                  className="monospace"
                  value={value}
                  placeholder={APPROVAL_INPUT_EXAMPLES[field]}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      check();
                    }
                  }}
                  data-testid="approval-check-value"
                  {...tip(t(`tips.approvalCheck.inputs.${field}`))}
                />
              </div>
            )}
            <button type="button" className="button-secondary" onClick={check} disabled={busy || !toolName.trim()} data-testid="approval-check-run" {...tip(t('tips.approvalCheck.run'))}>
              {busy ? t('components.approvalCheck.checking') : t('components.approvalCheck.run')}
            </button>
          </div>
          {error && (
            <div className="field-error" role="alert">
              {error}
            </div>
          )}
          {result && (
            <div className="approval-check-result" role="status" data-testid="approval-check-result">
              <ApprovalActionBadge action={result.action} t={t} />{' '}
              <span>
                {result.source === 'Rule' && result.rulePattern
                  ? t('components.approvalCheck.byRule', { action: enumLabel(t, 'approvalRuleAction', result.action) })
                  : t('components.approvalCheck.byDefault', { action: enumLabel(t, 'approvalRuleAction', result.action) })}
              </span>
              {result.source === 'Rule' && result.rulePattern && <code data-testid="approval-check-rule">{result.rulePattern}</code>}
              {result.suggestedRule && (
                <span className="text-muted" {...tip(t('tips.approvalCheck.suggestedRule'))}>
                  {t('components.approvalCheck.suggestedRule')} <code>{result.suggestedRule}</code>
                </span>
              )}
              {result.approvalsEnabled === false && (
                <div className="field-hint" data-testid="approval-check-disabled">
                  {t('components.approvalCheck.disabled')}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
