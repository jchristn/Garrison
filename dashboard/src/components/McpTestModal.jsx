import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import CodeBlock from './CodeBlock';
import { LoadingState, ErrorBanner } from './States';
import { Badge } from './StatusBadge';
import { errorMessage } from '../utils/errors';
import { tip } from './Tooltip';
import CopyableId from './CopyableId';

/** Runs an MCP server connection test and lists the tools it exposes. */
export default function McpTestModal({ load, loadNodes = null, name, onClose }) {
  const { t } = useTranslation();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [nodeId, setNodeId] = useState('');
  const [running, setRunning] = useState(!loadNodes);

  useEffect(() => {
    let cancelled = false;
    if (loadNodes) {
      loadNodes().then((page) => {
        if (!cancelled) setNodes((page.items || []).filter((n) => n.status === 'Ready' && n.supportsMcpTests));
      }).catch((e) => { if (!cancelled) setError(e); });
    } else {
      load().then((value) => { if (!cancelled) setResult(value); })
        .catch((e) => { if (!cancelled) setError(e); })
        .finally(() => { if (!cancelled) setRunning(false); });
    }
    return () => { cancelled = true; };
  }, [load, loadNodes]);

  const run = async () => {
    setError(null);
    setResult(null);
    setRunning(true);
    try { setResult(await load(nodeId)); }
    catch (e) { setError(e); }
    finally { setRunning(false); }
  };

  const ok = result && (result.success ?? result.ok ?? true);
  const tools = result?.tools || [];
  return (
    <Modal open size="large" onClose={onClose} title={t('components.mcpTest.title')} headerMeta={name}>
      {loadNodes && (
        <div className="form-field">
          <label htmlFor="mcp-test-worker">{t('components.mcpTest.worker')}</label>
          <select id="mcp-test-worker" value={nodeId} disabled={running} onChange={(e) => setNodeId(e.target.value)} {...tip(t('components.mcpTest.chooseWorker'))}>
            <option value="">{t('components.mcpTest.worker')}</option>
            {nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
          </select>
          <p className="text-muted">{t('components.mcpTest.chooseWorker')}</p>
          <button type="button" className="btn btn-primary" disabled={!nodeId || running} onClick={run} {...tip(t('components.mcpTest.chooseWorker'))}>{t('components.mcpTest.runTest')}</button>
        </div>
      )}
      {running && <LoadingState label={t('components.mcpTest.testing')} />}
      {error && <ErrorBanner message={errorMessage(t, error)} />}
      {result && (
        <>
          <p>
            <Badge tone={ok ? 'success' : 'danger'}>{ok ? t('components.mcpTest.ok') : t('components.mcpTest.failed')}</Badge> {result.message || ''}
          </p>
          {result.error && <ErrorBanner message={result.error} />}
          {result.nodeId && <p>{t('components.mcpTest.worker')}: <CopyableId value={result.nodeId} /></p>}
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
