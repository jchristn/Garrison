import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { pathFor } from '../config/navConfig';
import { errorMessage, errorDetail } from '../utils/errors';
import { newIdempotencyKey } from '../utils/pipelines';

/**
 * Start a pipeline (P12.9) with input text. One Idempotency-Key per dialog, so a double click or a retry after a
 * network error starts one pipeline run. On success it opens the new pipeline run.
 */
export default function PipelineStartModal({ pipeline, onClose, onStarted }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [key] = useState(newIdempotencyKey);
  if (!pipeline) return null;

  const start = async () => {
    if (!input.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const run = await apiClient.startPipeline(tenantId, pipeline.id, { input }, { idempotencyKey: key });
      addToast({ type: 'success', message: t('components.pipelineStart.started', { name: pipeline.name }) });
      onStarted?.(run);
      if (run?.id) navigate(pathFor('pipelineRuns', run.id));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="large"
      onClose={() => !busy && onClose?.()}
      title={t('components.pipelineStart.title', { name: pipeline.name })}
      headerMeta={<code className="cell-id">{pipeline.id}</code>}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={start} disabled={busy || !input.trim()} data-testid="pipeline-start-submit" {...tip(t('tips.pipelineStart.submit'))}>
            {busy ? t('components.pipelineStart.starting') : t('components.pipelineStart.submit')}
          </button>
        </>
      }
    >
      <div className="flex-col gap-md" data-testid="pipeline-start">
        <p className="text-muted">{t('components.pipelineStart.intro', { count: (pipeline.stages || []).length })}</p>
        <div className="field">
          <label htmlFor="pipeline-start-input" {...tip(t('tips.pipelineStart.input'))}>
            {t('components.pipelineStart.input')}
            <span className="required-mark" aria-hidden="true"> *</span>
          </label>
          <textarea
            id="pipeline-start-input"
            rows={8}
            value={input}
            disabled={busy}
            placeholder={t('components.pipelineStart.inputPlaceholder')}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && start()}
            data-testid="pipeline-start-input"
            {...tip(t('tips.pipelineStart.input'))}
          />
          <div className="field-hint">{t('components.pipelineStart.shortcut')}</div>
        </div>
        {error && <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} />}
      </div>
    </Modal>
  );
}
