import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { tip } from './Tooltip';
import { MessageRejectionBadge } from './MessageBadges';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ENUMS, MESSAGE_LIMITS } from '../utils/constants';
import { errorDetail, errorMessageWithDetail } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { blankMessage, messageErrors, messageToBody, notifyMessagesChanged, rejectionOf } from '../utils/messages';

/**
 * Send a message to an agent as a person (AA6.12): a recipient, a subject, a plain-text body, the urgency, and an
 * optional time to live. initial: { recipient?, subject?, parentMessageId? } prefills the form (the agent inbox tab
 * picks its agent; Reply in a thread names the parent). A message the loop guards refuse answers 409 with the reason;
 * the dialog stays open and shows the reason, and the refused message joins the Rejected list.
 * onDone(message) receives the sent message.
 */
export default function SendMessageModal({ initial = {}, onClose, onDone }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [form, setForm] = useState(() => ({ ...blankMessage(initial.recipient), subject: initial.subject || '', parentMessageId: initial.parentMessageId || '' }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [rejection, setRejection] = useState(null);
  const [busy, setBusy] = useState(false);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    if (!apiClient?.listAgents) return undefined;
    let cancelled = false;
    apiClient
      .listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((page) => !cancelled && setAgents((page.items || []).map((a) => ({ value: a.id, label: a.displayName || a.name || a.id }))))
      .catch(() => !cancelled && setAgents([]));
    return () => {
      cancelled = true;
    };
  }, [apiClient, tenantId]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((x) => ({ ...x, [key]: undefined }));
  };

  // The preset recipient stays choosable even before (or without) the agent list.
  const options = form.recipient && !agents.some((a) => a.value === form.recipient) ? [{ value: form.recipient, label: initial.recipientName || form.recipient }, ...agents] : agents;

  const submit = async () => {
    const found = messageErrors(form, t);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError('');
    setRejection(null);
    try {
      const sent = await apiClient.sendMessage(tenantId, messageToBody(form));
      const to = sent?.recipientAgentName || options.find((a) => a.value === form.recipient)?.label || form.recipient;
      addToast({ type: 'success', message: t('messages.toasts.sent', { recipient: to }) });
      notifyMessagesChanged();
      onDone?.(sent || null);
    } catch (e) {
      const reason = rejectionOf(e);
      if (reason) {
        // The server stored the refused message, so the Rejected list has it now.
        setRejection({ reason, detail: e?.body && typeof e.body === 'object' ? e.body.message || '' : '' });
        notifyMessagesChanged();
      } else {
        setError(`${errorMessageWithDetail(t, e)} ${errorDetail(t, e)}`.trim());
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={() => !busy && onClose?.()}
      size="medium"
      title={t('messages.send.title')}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={submit} disabled={busy} data-testid="message-send-submit" {...tip(t('tips.messages.send.submit'))}>
            {busy ? t('messages.send.sending') : t('messages.actions.send')}
          </button>
        </>
      }
    >
      <div className="flex-col gap-md" data-testid="message-send">
        <p className="text-muted">{t(form.parentMessageId ? 'messages.send.replyIntro' : 'messages.send.intro')}</p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="message-recipient" {...tip(t('tips.messages.send.fields.recipient'))}>
              {t('messages.send.fields.recipient')}
            </label>
            <select
              id="message-recipient"
              value={form.recipient}
              disabled={busy}
              aria-invalid={errors.recipient ? 'true' : undefined}
              onChange={(e) => set('recipient', e.target.value)}
              data-testid="message-send-recipient"
              {...tip(t('tips.messages.send.fields.recipient'))}
            >
              <option value="">{t('messages.send.pickRecipient')}</option>
              {options.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            {errors.recipient && <div className="field-error">{errors.recipient}</div>}
          </div>
          <div className="field">
            <label htmlFor="message-urgency" {...tip(t('tips.messages.send.fields.urgency'))}>
              {t('messages.send.fields.urgency')}
            </label>
            <select id="message-urgency" value={form.urgency} disabled={busy} onChange={(e) => set('urgency', e.target.value)} data-testid="message-send-urgency" {...tip(t('tips.messages.send.fields.urgency'))}>
              {ENUMS.messageUrgency.map((v) => (
                <option key={v} value={v} {...tip(enumTip(t, 'messageUrgency', v))}>
                  {enumLabel(t, 'messageUrgency', v)}
                </option>
              ))}
            </select>
          </div>
          <div className="field span-full">
            <label htmlFor="message-subject" {...tip(t('tips.messages.send.fields.subject'))}>
              {t('messages.send.fields.subject')}
            </label>
            <input
              id="message-subject"
              type="text"
              maxLength={MESSAGE_LIMITS.subjectMax}
              value={form.subject}
              disabled={busy}
              aria-invalid={errors.subject ? 'true' : undefined}
              onChange={(e) => set('subject', e.target.value)}
              data-testid="message-send-subject"
              {...tip(t('tips.messages.send.fields.subject'))}
            />
            {errors.subject && <div className="field-error">{errors.subject}</div>}
          </div>
          <div className="field span-full">
            <label htmlFor="message-body" {...tip(t('tips.messages.send.fields.body'))}>
              {t('messages.send.fields.body')}
            </label>
            <textarea
              id="message-body"
              rows={6}
              value={form.body}
              disabled={busy}
              aria-invalid={errors.body ? 'true' : undefined}
              onChange={(e) => set('body', e.target.value)}
              data-testid="message-send-body"
              {...tip(t('tips.messages.send.fields.body'))}
            />
            {errors.body && <div className="field-error">{errors.body}</div>}
          </div>
          <div className="field">
            <label htmlFor="message-ttl" {...tip(t('tips.messages.send.fields.ttlSeconds'))}>
              {t('messages.send.fields.ttlSeconds')}
            </label>
            <input
              id="message-ttl"
              type="number"
              inputMode="numeric"
              min={MESSAGE_LIMITS.ttlMin}
              max={MESSAGE_LIMITS.ttlMax}
              step={1}
              placeholder={t('messages.send.ttlPlaceholder')}
              value={form.ttlSeconds}
              disabled={busy}
              aria-invalid={errors.ttlSeconds ? 'true' : undefined}
              onChange={(e) => set('ttlSeconds', e.target.value)}
              data-testid="message-send-ttl"
              {...tip(t('tips.messages.send.fields.ttlSeconds'))}
            />
            {errors.ttlSeconds && <div className="field-error">{errors.ttlSeconds}</div>}
          </div>
        </div>
        {rejection && (
          <div className="error-banner message-rejection" role="alert" data-testid="message-send-rejected">
            <div className="inline-meta">
              <strong>{t('messages.send.rejected')}</strong> <MessageRejectionBadge reason={rejection.reason} t={t} />
            </div>
            <p className="message-rejection-why">{enumTip(t, 'messageRejection', rejection.reason)}</p>
            {rejection.detail && <p className="message-rejection-detail">{rejection.detail}</p>}
            <p className="message-rejection-stored">{t('messages.send.rejectedStored')}</p>
          </div>
        )}
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
