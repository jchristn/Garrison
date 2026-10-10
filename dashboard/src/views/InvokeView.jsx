import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import InvokeResponseCard from '../components/InvokeResponseCard';
import { EmptyState, ErrorBanner } from '../components/States';
import { SendIcon, StopIcon } from '../components/Icons';
import { RunStatus } from './runConfigs';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { TERMINAL_RUN_STATUSES } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { isModelOutput } from '../utils/streamPreview';
import Explainer from '../components/Explainer';
import { tip } from '../components/Tooltip';

/** How often (ms) streamed events are flushed to the screen, so a fast token stream re-renders smoothly without flicker. */
const FLUSH_MS = 50;

const EMPTY_CLOCK = { startedAt: null, firstOutputAt: null, lastOutputAt: null, finishedAt: null };

/** Interactive invoke: pick an agent and deployment, set allowed parameters, send a message, and stream the response. */
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
  const [clock, setClock] = useState(EMPTY_CLOCK);
  const [tab, setTab] = useState('preview');
  const [error, setError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const lastSeq = useRef(0);
  const streamRef = useRef(null);
  // The run the card belongs to. Events, status updates, and stream frames for any other run are ignored, so a
  // late frame from a previous run can never land in the current card.
  const runIdRef = useRef(null);
  const pendingEvents = useRef([]);
  const flushTimer = useRef(null);

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
  const clearFlush = () => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = null;
    pendingEvents.current = [];
  };
  useEffect(
    () => () => {
      stopStream();
      clearFlush();
    },
    []
  );

  // Buffer incoming events and flush them at most every FLUSH_MS, so the Markdown is re-rendered a few times per
  // second at most, however fast tokens arrive.
  const append = useCallback((runId, incoming) => {
    if (runId !== runIdRef.current) return;
    const list = (Array.isArray(incoming) ? incoming : [incoming]).filter((e) => e && typeof e === 'object' && e.sequence > lastSeq.current && (!e.runId || e.runId === runId));
    if (!list.length) return;
    lastSeq.current = Math.max(lastSeq.current, ...list.map((e) => e.sequence));
    const now = Date.now();
    if (list.some(isModelOutput)) setClock((c) => ({ ...c, firstOutputAt: c.firstOutputAt || now, lastOutputAt: now }));
    pendingEvents.current.push(...list);
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      const batch = pendingEvents.current;
      pendingEvents.current = [];
      if (runId !== runIdRef.current || !batch.length) return;
      setEvents((prev) => [...prev, ...batch].sort((a, b) => a.sequence - b.sequence));
    }, FLUSH_MS);
  }, []);

  /** Apply a run snapshot from the server, but only to the card's current run. */
  const applyRun = useCallback((r) => {
    if (!r || r.id !== runIdRef.current) return;
    setRun(r);
    if (TERMINAL_RUN_STATUSES.includes(r.status)) setClock((c) => (c.finishedAt ? c : { ...c, finishedAt: Date.now() }));
  }, []);

  // Poll run status (and events when SSE is unavailable) while the run is active.
  useEffect(() => {
    if (!run || TERMINAL_RUN_STATUSES.includes(run.status)) return undefined;
    const runId = run.id;
    const id = setInterval(async () => {
      try {
        const r = await apiClient.getRun(tenantId, runId);
        applyRun(r);
        if (!streamRef.current && runId === runIdRef.current) {
          const ev = await apiClient.listRunEvents(tenantId, runId, lastSeq.current, 500);
          append(runId, ev.items || []);
        }
      } catch {
        /* keep polling */
      }
    }, 1500);
    return () => clearInterval(id);
  }, [run, apiClient, tenantId, append, applyRun]);

  const send = async () => {
    if (!agentId || !message.trim()) return;
    // Reset the card before anything else, so nothing from the previous run stays on screen or can append later.
    stopStream();
    clearFlush();
    runIdRef.current = null;
    lastSeq.current = 0;
    setRun(null);
    setEvents([]);
    setClock({ ...EMPTY_CLOCK, startedAt: Date.now() });
    setTab('preview');
    setBusy(true);
    setError(null);
    try {
      const body = { input: message, deploymentId: deploymentId || undefined, parameters: Object.keys(params).length ? params : undefined };
      const created = await apiClient.invokeAgent(tenantId, agentId, body, { wait: false });
      const created2 = created?.run || created;
      if (created2?.id) {
        runIdRef.current = created2.id;
        applyRun(created2);
        const runId = created2.id;
        const controller = apiClient.streamRunEvents(
          tenantId,
          runId,
          0,
          (data) => {
            // run.completed carries the final run; run.event frames carry events.
            if (data && typeof data === 'object' && data.sequence === undefined && data.id === runId && data.status) applyRun(data);
            else append(runId, data);
          },
          () => {
            if (streamRef.current === controller) streamRef.current = null;
          }
        );
        streamRef.current = controller;
      } else {
        setClock(EMPTY_CLOCK);
      }
    } catch (e) {
      setError(e);
      setClock(EMPTY_CLOCK);
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
          <section className="panel invoke-output" aria-label={t('views.invoke.stream.cardLabel')}>
            {!run && !clock.startedAt ? (
              <EmptyState title={t('views.invoke.idleTitle')} body={t('views.invoke.idleBody')} />
            ) : (
              <>
                <div className="flex items-center justify-between gap-sm invoke-run-head">
                  <span>
                    {run ? (
                      <>
                        <RunStatus status={run.status} t={t} /> <code className="text-muted">{run.id}</code>
                      </>
                    ) : (
                      <span className="text-muted" data-testid="invoke-starting">{t('views.invoke.stream.starting')}</span>
                    )}
                  </span>
                  {run && (
                    <button type="button" className="button-secondary button-sm" onClick={() => navigate(pathFor('runs', run.id))} {...tip(t('tips.views.invoke.openRun'))}>
                      {t('views.invoke.openRun')}
                    </button>
                  )}
                </div>
                <InvokeResponseCard run={run} events={events} clock={clock} tab={tab} onTab={setTab} />
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
