import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import CodeBlock from './CodeBlock';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/errors';

/** Compiles a deployment with sample input and shows the redacted execution spec (command line, files, stdin). */
export default function CompilePreviewModal({ tenantId, deployment, onClose }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const [input, setInput] = useState('Hello from the compile preview.');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await apiClient.compileDeploymentPreview(tenantId, deployment.id, { input, parameters: {} }));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const spec = result?.spec || result;
  const commandLine = spec ? [spec.executable, ...(spec.arguments || [])].map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ') : '';
  return (
    <Modal
      open
      size="xlarge"
      onClose={onClose}
      title={t('components.compilePreview.title')}
      headerMeta={deployment.name}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} {...tip(t('tips.modal.close'))}>
            {t('common.actions.close')}
          </button>
          <button type="button" className="button-primary" onClick={run} disabled={busy} {...tip(t('tips.compilePreview.compile'))}>
            {busy ? t('components.compilePreview.compiling') : t('components.compilePreview.compile')}
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="preview-input" {...tip(t('tips.compilePreview.input'))}>{t('components.compilePreview.input')}</label>
        <textarea id="preview-input" {...tip(t('tips.compilePreview.input'))} rows={3} value={input} onChange={(e) => setInput(e.target.value)} />
      </div>
      {error && <ErrorBanner message={errorMessage(t, error)} />}
      {spec && (
        <div className="flex-col gap-md">
          <h3 className="section-title">{t('components.compilePreview.commandLine')}</h3>
          <CodeBlock value={commandLine} />
          <h3 className="section-title">{t('components.compilePreview.stdin')}</h3>
          <CodeBlock value={spec.stdin || ''} />
          <h3 className="section-title">{t('components.compilePreview.environment')}</h3>
          <CodeBlock value={(spec.environment || []).map((e) => `${e.name}=${e.isSecret ? '********' : e.value}`).join('\n')} />
          <h3 className="section-title">{t('components.compilePreview.files', { count: (spec.files || []).length })}</h3>
          {(spec.files || []).map((f, i) => (
            <details key={i} className="details-section">
              <summary>
                <code>
                  {f.baseDirectory}/{f.path}
                </code>
              </summary>
              <CodeBlock value={f.isSecret ? '********' : f.content} />
            </details>
          ))}
          <details className="details-section">
            <summary>{t('common.actions.viewJson')}</summary>
            <CodeBlock value={result} prettyJson />
          </details>
        </div>
      )}
    </Modal>
  );
}
