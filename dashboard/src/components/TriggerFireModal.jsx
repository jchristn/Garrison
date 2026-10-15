import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { TriggerFireOutcomeBadge } from './TriggerBadges';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { pathFor } from '../config/navConfig';
import { errorMessage, errorDetail } from '../utils/errors';

/**
 * Fire a trigger now (P12.5). The optional payload reaches the input template as webhook.body (and webhook.json when
 * it is JSON), so a webhook trigger can be tried without signing a request. Shows the fire record afterwards.
 */
export default function TriggerFireModal({ trigger, onClose, onFired }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const navigate = useNavigate();
  const [body, setBody] = useState('');
  const [contentType, setContentType] = useState(trigger?.type === 'Webhook' ? 'application/json' : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fire, setFire] = useState(null);
  if (!trigger) return null;

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await apiClient.fireTrigger(tenantId, trigger.id, { body: body || null, contentType: body ? contentType || null : null });
      setFire(result);
      onFired?.(result);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const open = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('components.triggerFire.title', { name: trigger.name })}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} {...tip(t('tips.modal.close'))}>
            {t('common.actions.close')}
          </button>
          {!fire && (
            <button type="button" className="button-primary" onClick={run} disabled={busy} data-testid="trigger-fire-submit" {...tip(t('tips.triggerFire.submit'))}>
              {busy ? t('components.triggerFire.firing') : t('components.triggerFire.submit')}
            </button>
          )}
        </>
      }
    >
      {error && <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} />}
      {!fire ? (
        <>
          <p className="field-hint">{t('components.triggerFire.intro')}</p>
          <div className="field">
            <label htmlFor="trigger-fire-body" {...tip(t('tips.triggerFire.body'))}>{t('components.triggerFire.body')}</label>
            <textarea id="trigger-fire-body" className="monospace code-input" rows={6} value={body} onChange={(e) => setBody(e.target.value)} data-testid="trigger-fire-body" {...tip(t('tips.triggerFire.body'))} />
          </div>
          <div className="field">
            <label htmlFor="trigger-fire-content-type" {...tip(t('tips.triggerFire.contentType'))}>{t('components.triggerFire.contentType')}</label>
            <input id="trigger-fire-content-type" type="text" value={contentType} placeholder="application/json" onChange={(e) => setContentType(e.target.value)} {...tip(t('tips.triggerFire.contentType'))} />
          </div>
        </>
      ) : (
        <div className="detail-grid" data-testid="trigger-fire-result">
          <div className="detail-item">
            <div className="detail-item-label" {...tip(t('tips.resources.triggers.fires.outcome'))}>{t('resources.triggers.fires.outcome')}</div>
            <div className="detail-item-value"><TriggerFireOutcomeBadge outcome={fire.outcome} t={t} /></div>
          </div>
          {fire.runId && (
            <div className="detail-item">
              <div className="detail-item-label" {...tip(t('tips.resources.triggers.fires.runId'))}>{t('resources.triggers.fires.runId')}</div>
              <div className="detail-item-value">
                <button type="button" className="button-link" data-testid="trigger-fire-run" onClick={() => open(pathFor('runs', fire.runId))} {...tip(t('tips.triggerFire.openRun'))}>
                  <code>{fire.runId}</code>
                </button>
              </div>
            </div>
          )}
          {fire.pipelineRunId && (
            <div className="detail-item">
              <div className="detail-item-label" {...tip(t('tips.resources.triggers.fires.pipelineRunId'))}>{t('resources.triggers.fires.pipelineRunId')}</div>
              <div className="detail-item-value">
                <button type="button" className="button-link" data-testid="trigger-fire-pipeline-run" onClick={() => open(pathFor('pipelineRuns', fire.pipelineRunId))} {...tip(t('tips.triggerFire.openPipelineRun'))}>
                  <code>{fire.pipelineRunId}</code>
                </button>
              </div>
            </div>
          )}
          {fire.errorCode && (
            <div className="detail-item">
              <div className="detail-item-label" {...tip(t('tips.resources.triggers.fires.error'))}>{t('resources.triggers.fires.error')}</div>
              <div className="detail-item-value" data-testid="trigger-fire-error">{`${fire.errorCode}: ${fire.errorMessage || ''}`}</div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
