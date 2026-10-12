import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { usePendingApprovals } from '../context/ApprovalsContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';

/**
 * Decide one pending approval (P12.3): Allow or Deny, an optional reason, and "remember as rule", which adds an
 * Allow or Deny rule with an editable pattern (prefilled from the approval's suggested rule) to its deployment.
 * A 409 ApprovalNotPending (someone or a timeout decided first) and a 403 end in a toast instead of an error page.
 * onDecided(approval) receives the decided approval, or null when it was no longer pending.
 */
export default function ApprovalDecideModal({ approval, initialDecision = 'Allow', onClose, onDecided }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const { refresh } = usePendingApprovals();
  const [decision, setDecision] = useState(initialDecision === 'Deny' ? 'Deny' : 'Allow');
  const [reason, setReason] = useState('');
  const [remember, setRemember] = useState(false);
  const [rulePattern, setRulePattern] = useState(approval?.suggestedRule || '');
  const [busy, setBusy] = useState(false);
  if (!approval) return null;

  const lng = i18n.language;
  const tool = approval.toolName || '-';
  const patternMissing = remember && !rulePattern.trim();

  const submit = async () => {
    if (patternMissing) return;
    setBusy(true);
    const body = { decision };
    if (reason.trim()) body.reason = reason.trim();
    if (remember) {
      body.remember = true;
      if (rulePattern.trim()) body.rulePattern = rulePattern.trim();
    }
    try {
      const decided = await apiClient.decideApproval(tenantId, approval.id, body);
      const key = decision === 'Allow' ? 'allowed' : 'denied';
      addToast({ type: 'success', message: t(remember ? `components.approvals.toasts.${key}Remembered` : `components.approvals.toasts.${key}`, { tool, pattern: rulePattern.trim() }) });
      refresh();
      onDecided?.(decided || null);
    } catch (e) {
      if (e?.status === 409) {
        addToast({ type: 'warning', message: t('components.approvals.toasts.notPending') });
        refresh();
        onDecided?.(null);
      } else if (e?.status === 403) {
        addToast({ type: 'error', message: `${t(remember ? 'components.approvals.toasts.forbiddenRemember' : 'components.approvals.toasts.forbidden')} ${errorDetail(t, e)}`.trim() });
      } else {
        addToast({ type: 'error', message: `${errorMessage(t, e)} ${errorDetail(t, e)}`.trim() });
      }
    } finally {
      setBusy(false);
    }
  };

  const choice = (value) => (
    <label key={value} className={`checkbox-chip decision-choice decision-${value.toLowerCase()} ${decision === value ? 'selected' : ''}`} {...tip(t(`tips.approvals.decide.${value.toLowerCase()}`))}>
      <input type="radio" name="approval-decision" value={value} checked={decision === value} disabled={busy} onChange={() => setDecision(value)} data-testid={`decide-${value.toLowerCase()}`} {...tip(t(`tips.approvals.decide.${value.toLowerCase()}`))} />
      <span>{enumLabel(t, 'approvalDecision', value)}</span>
    </label>
  );

  return (
    <Modal
      open
      onClose={() => !busy && onClose?.()}
      size="medium"
      title={t('components.approvals.decideTitle', { tool })}
      headerMeta={<code className="cell-id">{approval.id}</code>}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button
            type="button"
            className={decision === 'Deny' ? 'button-danger' : 'button-primary'}
            onClick={submit}
            disabled={busy || patternMissing}
            data-testid="decide-submit"
            {...tip(t(decision === 'Deny' ? 'tips.approvals.decide.submitDeny' : 'tips.approvals.decide.submitAllow'))}
          >
            {busy ? t('common.generic.saving') : t(decision === 'Deny' ? 'components.approvals.submitDeny' : 'components.approvals.submitAllow')}
          </button>
        </>
      }
    >
      <div className="flex-col gap-md approval-decide" data-testid="approval-decide">
        <dl className="approval-facts">
          <div>
            <dt {...tip(t('tips.resources.approvals.toolName'))}>{t('resources.approvals.columns.toolName')}</dt>
            <dd>
              <code>{tool}</code> <span className="text-muted">{enumLabel(t, 'approvalKind', approval.kind)}</span>
            </dd>
          </div>
          {approval.summary && (
            <div>
              <dt {...tip(t('tips.resources.approvals.summary'))}>{t('resources.approvals.columns.summary')}</dt>
              <dd>
                <code className="approval-summary">{approval.summary}</code>
              </dd>
            </div>
          )}
          <div>
            <dt {...tip(t('tips.resources.approvals.agentName'))}>{t('resources.approvals.columns.agentName')}</dt>
            <dd>{approval.agentName || approval.agentId || '-'}</dd>
          </div>
          {approval.expiresUtc && (
            <div>
              <dt {...tip(t('tips.resources.approvals.expiresUtc'))}>{t('resources.approvals.columns.expiresUtc')}</dt>
              <dd>
                <span {...tip(formatDateTime(approval.expiresUtc, lng))}>{formatRelativeTime(approval.expiresUtc, lng)}</span>{' '}
                <span className="text-muted">{t('components.approvals.timeoutThen', { decision: enumLabel(t, 'approvalDecision', approval.timeoutDecision || 'Deny') })}</span>
              </dd>
            </div>
          )}
        </dl>

        <fieldset className="decision-choices">
          <legend {...tip(t('tips.approvals.decide.decision'))}>{t('components.approvals.decision')}</legend>
          <div className="checkbox-grid">{['Allow', 'Deny'].map(choice)}</div>
        </fieldset>

        <div className="field">
          <label htmlFor="approval-reason" {...tip(t('tips.approvals.decide.reason'))}>
            {t('components.approvals.reason')}
          </label>
          <textarea id="approval-reason" rows={3} maxLength={4000} value={reason} disabled={busy} placeholder={t('components.approvals.reasonPlaceholder')} onChange={(e) => setReason(e.target.value)} {...tip(t('tips.approvals.decide.reason'))} />
        </div>

        <div className="field field-checkbox">
          <input id="approval-remember" type="checkbox" checked={remember} disabled={busy} onChange={(e) => setRemember(e.target.checked)} data-testid="decide-remember" {...tip(t('tips.approvals.decide.remember'))} />
          <label htmlFor="approval-remember" {...tip(t('tips.approvals.decide.remember'))}>
            {t('components.approvals.remember')}
          </label>
        </div>

        {remember && (
          <div className={`field ${patternMissing ? 'has-error' : ''}`}>
            <label htmlFor="approval-rule-pattern" {...tip(t('tips.approvals.decide.rulePattern'))}>
              {t('components.approvals.rulePattern')}
              <span className="required-mark" aria-hidden="true"> *</span>
            </label>
            <input id="approval-rule-pattern" type="text" className="monospace" maxLength={1000} value={rulePattern} disabled={busy} onChange={(e) => setRulePattern(e.target.value)} data-testid="decide-rule-pattern" {...tip(t('tips.approvals.decide.rulePattern'))} />
            <div className="field-hint">{t('components.approvals.rememberHint', { action: enumLabel(t, 'approvalRuleAction', decision) })}</div>
            {patternMissing && (
              <div className="field-error" role="alert">
                {t('common.errors.required')}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
