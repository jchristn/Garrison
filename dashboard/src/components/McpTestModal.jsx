import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import CodeBlock from './CodeBlock';
import { LoadingState, ErrorBanner } from './States';
import { Badge } from './StatusBadge';
import { errorMessage } from '../utils/errors';

/** Runs an MCP server connection test and lists the tools it exposes. */
export default function McpTestModal({ load, name, onClose }) {
  const { t } = useTranslation();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    load()
      .then(setResult)
      .catch(setError);
  }, [load]);

  const ok = result && (result.success ?? result.ok ?? true);
  const tools = result?.tools || [];
  return (
    <Modal open size="large" onClose={onClose} title={t('components.mcpTest.title')} headerMeta={name}>
      {!result && !error && <LoadingState label={t('components.mcpTest.testing')} />}
      {error && <ErrorBanner message={errorMessage(t, error)} />}
      {result && (
        <>
          <p>
            <Badge tone={ok ? 'success' : 'danger'}>{ok ? t('components.mcpTest.ok') : t('components.mcpTest.failed')}</Badge> {result.message || ''}
          </p>
          <h3 className="section-title">{t('components.mcpTest.tools', { count: tools.length })}</h3>
          <ul className="plain-list">
            {tools.map((tool) => (
              <li key={tool.name || tool}>
                <code>{tool.name || tool}</code> {tool.description ? <span className="text-muted">{tool.description}</span> : null}
              </li>
            ))}
          </ul>
          <details className="details-section">
            <summary>{t('common.actions.viewJson')}</summary>
            <CodeBlock value={result} prettyJson />
          </details>
        </>
      )}
    </Modal>
  );
}
