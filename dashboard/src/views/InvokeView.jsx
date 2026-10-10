import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import RunTimeline from '../components/RunTimeline';
import CodeBlock from '../components/CodeBlock';
import { EmptyState, ErrorBanner } from '../components/States';
import { SendIcon, StopIcon } from '../components/Icons';
import { RunStatus } from './runConfigs';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { TERMINAL_RUN_STATUSES } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { translateServerText } from '../utils/serverText';
import Explainer from '../components/Explainer';
import { tip } from '../components/Tooltip';

/** Interactive invoke: pick an agent and deployment, set allowed parameters, send a message, and stream the transcript. */
export default function InvokeView() {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [agents, setAgents] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [deploymentsFor, setDeploymentsFor] = useState(null);
  const [agentId, setAgentId] = useState(searchParams.get('agentId') || '');
  const [deploymentId, setDeploymentId] = useState(searchParams.get('deploymentId') || '');
  const [params, setParams] = useState({});
  const [message, setMessage] = useState('');
  const [run, setRun] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const lastSeq = useRef(0);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!apiClient) return;
    apiClient
      .listAgents(tenantId, { pageNumber: 1, pageSize: 1000, activeOnly: true })
      .then((r) => {
        setAgents(r.items || []);
        setLoadError(null);
        if (!agentId && r.items?.length) setAgentId(r.items[0].id);
      })
      .catch(setLoadError);
  }, [apiClient, tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!apiClient || !agentId) {
      setDeployments([]);
      return;
    }
    apiClient
      .listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => {
        setDeployments((r.items || []).filter((d) => d.agentId === agentId));
        setDeploymentsFor(agentId);
      })
      .catch(() => {
        setDeployments([]);
        setDeploymentsFor(null);
      });
  }, [apiClient, tenantId, agentId]);

  const deployment = deployments.find((d) => d.id === deploymentId);
  // M1-26: say up front when the agent has nothing to route to, instead of letting the invoke fail.
  const noRoutableDeployment = deploymentsFor === agentId && !deployments.some((d) => d.active !== false && Number(d.weight) > 0);
  const overrides = deployment?.allowedRunOverrides || [];

  const stopStream = () => {
    streamRef.current?.abort();
    streamRef.current = null;
  };
  useEffect(() => stopStream, []);

  const append = useCallback((incoming) => {
    const list = (Array.isArray(incoming) ? incoming : [incoming]).filter((e) => e && typeof e === 'object' && e.sequence > lastSeq.current);
    if (!list.length) return;
    lastSeq.current = Math.max(lastSeq.current, ...list.map((e) => e.sequence));
    setEvents((prev) => [...prev, ...list].sort((a, b) => a.sequence - b.sequence));
  }, []);

  // Poll run status (and events when SSE is unavailable) while the run is active.
  useEffect(() => {
    if (!run || TERMINAL_RUN_STATUSES.includes(run.status)) return undefined;
    const id = setInterval(async () => {
      try {
        const r = await apiClient.getRun(tenantId, run.id);
        setRun(r);
        if (!streamRef.current) {
          const ev = await apiClient.listRunEvents(tenantId, run.id, lastSeq.current, 500);
          append(ev.items || []);
        }
      } catch {
        /* keep polling */
      }
    }, 1500);
    return () => clearInterval(id);
  }, [run, apiClient, tenantId, append]);

  const send = async () => {
    if (!agentId || !message.trim()) return;
    stopStream();
    setBusy(true);
    setError(null);
    setEvents([]);
    lastSeq.current = 0;
    try {
      const body = { input: message, deploymentId: deploymentId || undefined, parameters: Object.keys(params).length ? params : undefined };
      const created = await apiClient.invokeAgent(tenantId, agentId, body, { wait: false });
      const created2 = created?.run || created;
      setRun(created2);
      if (created2?.id) {
        streamRef.current = apiClient.streamRunEvents(tenantId, created2.id, 0, append, () => {
          streamRef.current = null;
        });
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    try {
      await apiClient.cancelRun(tenantId, run.id);
      addToast({ type: 'success', message: t('resources.runs.toasts.cancelRequested') });
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    }
  };

  const active = run && !TERMINAL_RUN_STATUSES.includes(run.status);

  return (
    <div>
      <PageHeader title={t('views.invoke.title')} subtitle={t('views.invoke.subtitle')} />
      <Explainer topic="invoke" />
      {loadError && <ErrorBanner message={errorMessage(t, loadError)} />}
      {!loadError && agents.length === 0 ? (
        <div className="table-frame">
          <EmptyState
            title={t('views.invoke.noAgentsTitle')}
            body={t('views.invoke.noAgentsBody')}
            action={
              <button type="button" className="button-primary" onClick={() => navigate(pathFor('manifests'))} {...tip(t('tips.views.invoke.applySample'))}>
                {t('views.invoke.applySample')}
              </button>
            }
          />
        </div>
      ) : (
        <div className="invoke-layout">
          <section className="panel invoke-form" aria-label={t('views.invoke.request')}>
            <div className="field">
              <label htmlFor="invoke-agent" {...tip(t('tips.views.invoke.agent'))}>{t('views.invoke.agent')}</label>
              <select id="invoke-agent" {...tip(t('tips.views.invoke.agent'))} value={agentId} onChange={(e) => { setAgentId(e.target.value); setDeploymentId(''); setParams({}); }}>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.displayName || a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="invoke-deployment" {...tip(t('tips.views.invoke.deployment'))}>{t('views.invoke.deployment')}</label>
              <select id="invoke-deployment" {...tip(t('tips.views.invoke.deployment'))} value={deploymentId} onChange={(e) => { setDeploymentId(e.target.value); setParams({}); }}>
                <option value="">{t('views.invoke.weighted')}</option>
                {deployments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            {overrides.map((o) => (
              <div className="field" key={o.name}>
                <label htmlFor={`param-${o.name}`} {...tip(t('tips.views.invoke.parameter', { name: o.name }))}>{o.name}</label>
                {o.validation === 'Enum' ? (
                  <select id={`param-${o.name}`} {...tip(t('tips.views.invoke.parameter', { name: o.name }))} value={params[o.name] || ''} onChange={(e) => setParams({ ...params, [o.name]: e.target.value })}>
                    <option value="">{t('views.invoke.default')}</option>
                    {(o.pattern || '').split(',').map((v) => v.trim()).filter(Boolean).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input id={`param-${o.name}`} {...tip(t('tips.views.invoke.parameter', { name: o.name }))} value={params[o.name] || ''} placeholder={t('views.invoke.default')} onChange={(e) => setParams({ ...params, [o.name]: e.target.value })} />
                )}
              </div>
            ))}
            <div className="field">
              <label htmlFor="invoke-message" {...tip(t('tips.views.invoke.message'))}>{t('views.invoke.message')}</label>
              <textarea id="invoke-message" {...tip(t('tips.views.invoke.message'))} rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('views.invoke.messagePlaceholder')} onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && send()} />
              <div className="field-hint">{t('views.invoke.shortcut')}</div>
            </div>
            {noRoutableDeployment && !deploymentId && (
              <div className="warning-banner" role="status" data-testid="invoke-no-deployment">
                {t('views.invoke.noDeployment')}
              </div>
            )}
            {error && <ErrorBanner message={errorMessage(t, error)} />}
            <div className="flex gap-sm">
              <button type="button" className="button-primary" onClick={send} disabled={busy || !agentId || !message.trim() || active} data-testid="invoke-send" {...tip(t('tips.views.invoke.send'))}>
                <SendIcon size={14} /> {busy ? t('views.invoke.sending') : t('views.invoke.send')}
              </button>
              {active && (
                <button type="button" className="button-danger" onClick={cancel} {...tip(t('tips.resources.runs.actions.cancel'))}>
                  <StopIcon size={14} /> {t('resources.runs.actions.cancel')}
                </button>
              )}
            </div>
          </section>
          <section className="panel invoke-output" aria-label={t('views.runDetail.transcript')} aria-live="polite">
            {!run ? (
              <EmptyState title={t('views.invoke.idleTitle')} body={t('views.invoke.idleBody')} />
            ) : (
              <>
                <div className="flex items-center justify-between gap-sm invoke-run-head">
                  <span>
                    <RunStatus status={run.status} t={t} /> <code className="text-muted">{run.id}</code>
                  </span>
                  <button type="button" className="button-secondary button-sm" onClick={() => navigate(pathFor('runs', run.id))} {...tip(t('tips.views.invoke.openRun'))}>
                    {t('views.invoke.openRun')}
                  </button>
                </div>
                <RunTimeline events={events} />
                {run.resultText && (
                  <>
                    <h3 className="section-title">{t('views.runDetail.result')}</h3>
                    <CodeBlock value={run.resultText} />
                  </>
                )}
                {run.errorMessage && <div className="error-banner">{translateServerText(t, run.errorMessage)}</div>}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
