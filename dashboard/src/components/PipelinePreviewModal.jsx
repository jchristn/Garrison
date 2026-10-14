import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import CodeBlock from './CodeBlock';
import { ErrorBanner } from './States';
import { Badge } from './StatusBadge';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { errorMessage } from '../utils/errors';

/**
 * Pipeline prompt preview (P12.9): POST pipelines/{id}/preview renders every stage prompt from sample input and a
 * sample output per earlier stage, with secrets redacted by the server. Stages that cannot render show the error.
 */
export default function PipelinePreviewModal({ pipeline, onClose }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const stages = [...(pipeline?.stages || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const [input, setInput] = useState(t('components.pipelinePreview.sampleInput'));
  const [outputs, setOutputs] = useState(() => stages.slice(0, -1).map((s) => t('components.pipelinePreview.sampleOutput', { stage: s.name })));
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!pipeline) return null;

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await apiClient.previewPipeline(tenantId, pipeline.id, { input, sampleOutputs: outputs }));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="xlarge"
      onClose={onClose}
      title={t('components.pipelinePreview.title', { name: pipeline.name })}
      headerMeta={<code className="cell-id">{pipeline.id}</code>}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} {...tip(t('tips.modal.close'))}>
            {t('common.actions.close')}
          </button>
          <button type="button" className="button-primary" onClick={run} disabled={busy} data-testid="pipeline-preview-render" {...tip(t('tips.pipelinePreview.render'))}>
            {busy ? t('components.pipelinePreview.rendering') : t('components.pipelinePreview.render')}
          </button>
        </>
      }
    >
      <div className="flex-col gap-md" data-testid="pipeline-preview">
        <div className="field">
          <label htmlFor="pipeline-preview-input" {...tip(t('tips.pipelinePreview.input'))}>
            {t('components.pipelinePreview.input')}
          </label>
          <textarea id="pipeline-preview-input" rows={3} value={input} onChange={(e) => setInput(e.target.value)} {...tip(t('tips.pipelinePreview.input'))} />
        </div>
        {outputs.map((value, i) => (
          <div className="field" key={stages[i]?.id || i}>
            <label htmlFor={`pipeline-preview-output-${i}`} {...tip(t('tips.pipelinePreview.sampleOutput', { stage: stages[i]?.name || i + 1 }))}>
              {t('components.pipelinePreview.outputOf', { position: i + 1, stage: stages[i]?.name || '' })}
            </label>
            <textarea
              id={`pipeline-preview-output-${i}`}
              rows={2}
              value={value}
              onChange={(e) => setOutputs((list) => list.map((v, j) => (j === i ? e.target.value : v)))}
              {...tip(t('tips.pipelinePreview.sampleOutput', { stage: stages[i]?.name || i + 1 }))}
            />
          </div>
        ))}
        {error && <ErrorBanner message={errorMessage(t, error)} />}
        {result && (
          <div className="flex-col gap-md" data-testid="pipeline-preview-result">
            {(result.stages || []).map((s) => (
              <section key={s.position} className="panel" data-preview-stage={s.position}>
                <h3 className="section-title inline-meta" {...tip(t('tips.pipelinePreview.stage'))}>
                  {t('components.pipelinePreview.stageHeading', { position: s.position, stage: s.stageName, agent: s.agentName })}
                  {s.success ? (
                    <Badge tone="success" tip={t('tips.pipelinePreview.rendered')}>{t('components.pipelinePreview.rendered')}</Badge>
                  ) : (
                    <Badge tone="danger" tip={t('tips.pipelinePreview.failed')}>{t('components.pipelinePreview.failed')}</Badge>
                  )}
                </h3>
                {(s.deploymentName || s.deploymentId) && <div className="text-muted">{t('components.pipelinePreview.deployment', { deployment: s.deploymentName || s.deploymentId })}</div>}
                {s.success ? <CodeBlock value={s.prompt || ''} /> : <ErrorBanner message={[s.errorCode, s.errorMessage].filter(Boolean).join(': ')} />}
              </section>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
