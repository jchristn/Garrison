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
import { TERMINAL_RUN_STATUSES, STORAGE_KEYS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { errorMessage, fieldErrorMessages } from '../utils/errors';
import { loadRuntimeLimits } from '../utils/settings';
import { TIMEOUT_OVERRIDE, TIME_LIMIT_PRESETS, timeLimitBounds, validateTimeLimit, presetAllowed, secondsLabel } from '../utils/runGuards';
import { formatNumber } from '../i18n/formatters';
import { isModelOutput } from '../utils/streamPreview';
import Explainer from '../components/Explainer';
import { tip } from '../components/Tooltip';

/** How often (ms) streamed events are flushed to the screen, so a fast token stream re-renders smoothly without flicker. */
const FLUSH_MS = 50;

const EMPTY_CLOCK = { startedAt: null, firstOutputAt: null, lastOutputAt: null, finishedAt: null };

/** Whether Invoke cancels its run when the page is left or a new run is sent (P3.15). Default on. */
function savedStopOnLeave() {
  try {
    return localStorage.getItem(STORAGE_KEYS.invokeStopOnLeave) !== 'false';
  } catch {
    return true;
  }
}

/** Interactive invoke: pick an agent and deployment, set allowed parameters, send a message, and stream the response. */
export default function InvokeView() {
  const { t, i18n } = useTranslation();
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
  const [stopOnLeave, setStopOnLeave] = useState(savedStopOnLeave);
  const [cancelling, setCancelling] = useState(null);
  const [runtime, setRuntime] = useState(undefined);
  const [timeLimitServerError, setTimeLimitServerError] = useState(null);
  // The run that is still in progress (null once it ends), plus what leaving needs: refs, because the unmount and
  // pagehide handlers run outside React's render cycle.
  const liveRunRef = useRef(null);
  const leaveRef = useRef({ apiClient: null, tenantId: null, stopOnLeave: true });
  const unmountedRef = useRef(false);
  leaveRef.current = { apiClient, tenantId, stopOnLeave };

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
  const timeRule = overrides.find((o) => o.name === TIMEOUT_OVERRIDE) || null;
  const otherOverrides = overrides.filter((o) => o.name !== TIMEOUT_OVERRIDE);

  // The cluster cap on run time, read once a deployment offers a per-run time limit. Settings may not be readable
  // (non-administrators); then the server's 400 field error is the only check beyond the deployment's range.
  useEffect(() => {
    if (!apiClient || !timeRule || runtime !== undefined) return;
    loadRuntimeLimits(apiClient).then((r) => setRuntime(r));
  }, [apiClient, timeRule, runtime]);
  const timeBounds = timeLimitBounds(timeRule, runtime?.maxRunSeconds ?? null);
  const timeLimitValue = timeRule ? params[TIMEOUT_OVERRIDE] || '' : '';
  const timeLimitProblem = timeRule ? validateTimeLimit(timeLimitValue, timeBounds) : null;
  const fmtSeconds = (n) => secondsLabel(t, n, (v) => formatNumber(v, {}, i18n.language));
  const timeLimitError = timeLimitProblem
    ? t(`views.invoke.timeLimitErrors.${timeLimitProblem.key}`, { min: fmtSeconds(timeLimitProblem.params.min ?? 0), max: fmtSeconds(timeLimitProblem.params.max ?? 0) })
    : timeLimitServerError;
  const setTimeLimit = (value) => {
    setTimeLimitServerError(null);
    const next = { ...params };
    if (value === '' || value === null || value === undefined) delete next[TIMEOUT_OVERRIDE];
    else next[TIMEOUT_OVERRIDE] = String(value);
    setParams(next);
  };
  const toggleStopOnLeave = (value) => {
    setStopOnLeave(value);
    try {
      localStorage.setItem(STORAGE_KEYS.invokeStopOnLeave, value ? 'true' : 'false');
    } catch {
      /* private mode: the choice lasts for this page only */
    }
  };

  /** Cancel the in-progress run with a request that survives the page going away (route change or tab close). */
  const cancelOnLeave = useCallback(() => {
    const id = liveRunRef.current;
    const { apiClient: client, tenantId: tenant, stopOnLeave: stop } = leaveRef.current;
    if (!id || !stop || !client) return;
    liveRunRef.current = null;
    client.cancelRunKeepalive(tenant, id);
  }, []);
  useEffect(() => {
    unmountedRef.current = false;
    window.addEventListener('pagehide', cancelOnLeave);
    return () => {
      unmountedRef.current = true;
      window.removeEventListener('pagehide', cancelOnLeave);
      cancelOnLeave();
    };
  }, [cancelOnLeave]);

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
    if (TERMINAL_RUN_STATUSES.includes(r.status)) {
      if (liveRunRef.current === r.id) liveRunRef.current = null;
      setClock((c) => (c.finishedAt ? c : { ...c, finishedAt: Date.now() }));
    }
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
    if (busy || !agentId || !message.trim() || timeLimitProblem) return;
    // The run still in progress, if any: cancelled before the new one starts unless the user keeps runs going.
    const previous = liveRunRef.current;
    liveRunRef.current = null;
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
    setCancelling(null);
    setTimeLimitServerError(null);
    if (previous && stopOnLeave) {
      try {
        await apiClient.cancelRun(tenantId, previous);
      } catch {
        // Best effort: the previous run may have just finished; the new run starts either way.
      }
    }
    try {
      const body = { input: message, deploymentId: deploymentId || undefined, parameters: Object.keys(params).length ? params : undefined };
      const created = await apiClient.invokeAgent(tenantId, agentId, body, { wait: false });
      const created2 = created?.run || created;
      if (created2?.id) {
        // Left the page while the invoke was in flight: stop the run that nobody is watching.
        if (unmountedRef.current) {
          if (leaveRef.current.stopOnLeave && !TERMINAL_RUN_STATUSES.includes(created2.status)) apiClient.cancelRunKeepalive(tenantId, created2.id);
          return;
        }
        runIdRef.current = created2.id;
        if (!TERMINAL_RUN_STATUSES.includes(created2.status)) liveRunRef.current = created2.id;
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
      // A per-run time limit the server refused (400 with a field error) is shown under the field.
      const fieldMessages = fieldErrorMessages(t, e, (key, code) =>
        key === `parameters.${TIMEOUT_OVERRIDE}` && code === 'ParameterInvalid' && timeBounds.min !== null ? t('views.invoke.timeLimitErrors.range', { min: fmtSeconds(timeBounds.min), max: fmtSeconds(timeBounds.max) }) : null
      );
      const timeMessage = fieldMessages?.[`parameters.${TIMEOUT_OVERRIDE}`];
      if (timeMessage) setTimeLimitServerError(timeMessage);
      setError(e);
      setClock(EMPTY_CLOCK);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    const id = run.id;
    setCancelling(id);
    try {
      const r = await apiClient.cancelRun(tenantId, id);
      if (r?.id) applyRun(r);
    } catch (e) {
      setCancelling(null);
      addToast({ type: 'error', message: errorMessage(t, e) });
    }
  };

  const active = run && !TERMINAL_RUN_STATUSES.includes(run.status);
  // "Cancelling..." from the click until the run reports a final status.
  const isCancelling = active && (cancelling === run.id || run.status === 'Cancelling');

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
            {otherOverrides.map((o) => (
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
            {timeRule && (
              <div className={`field ${timeLimitError ? 'has-error' : ''}`} data-testid="invoke-time-limit">
                <label htmlFor="invoke-time-limit" {...tip(t('tips.views.invoke.timeLimit'))}>{t('views.invoke.timeLimit')}</label>
                <div className="time-limit-row">
                  <input
                    id="invoke-time-limit"
                    type="number"
                    inputMode="numeric"
                    min={timeBounds.min ?? 1}
                    max={timeBounds.max ?? timeBounds.cap ?? undefined}
                    value={timeLimitValue}
                    placeholder={t('views.invoke.timeLimitPlaceholder')}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    aria-invalid={timeLimitError ? 'true' : undefined}
                    {...tip(t('tips.views.invoke.timeLimit'))}
                  />
                  <span className="text-muted">{t('views.invoke.timeUnits.secondsWord')}</span>
                  {TIME_LIMIT_PRESETS.filter((p) => presetAllowed(p, timeBounds)).map((p) => (
                    <button key={p} type="button" className={`button-secondary button-sm ${String(p) === timeLimitValue ? 'active' : ''}`} aria-pressed={String(p) === timeLimitValue} onClick={() => setTimeLimit(p)} data-testid={`time-preset-${p}`} {...tip(t('tips.views.invoke.timePreset', { value: fmtSeconds(p) }))}>
                      {fmtSeconds(p)}
                    </button>
                  ))}
                  {timeLimitValue && (
                    <button type="button" className="button-link" onClick={() => setTimeLimit('')} data-testid="time-preset-clear" {...tip(t('tips.views.invoke.timePresetClear'))}>
                      {t('views.invoke.timeLimitClear')}
                    </button>
                  )}
                </div>
                <div className="field-hint" data-testid="invoke-time-limit-hint">
                  {[
                    timeBounds.min !== null ? t('views.invoke.timeLimitRange', { min: fmtSeconds(timeBounds.min), max: fmtSeconds(timeBounds.max) }) : t('views.invoke.timeLimitAny'),
                    timeBounds.cap !== null ? t('views.invoke.timeLimitCap', { max: fmtSeconds(timeBounds.cap) }) : null
                  ]
                    .filter(Boolean)
                    .join(' ')}
                </div>
                {timeLimitError && (
                  <div className="field-error" role="alert" data-testid="invoke-time-limit-error">
                    {timeLimitError}
                  </div>
                )}
              </div>
            )}
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
            <div className="flex gap-sm invoke-actions">
              <button type="button" className="button-primary" onClick={send} disabled={busy || !agentId || !message.trim() || !!timeLimitProblem} data-testid="invoke-send" {...tip(t(active && stopOnLeave ? 'tips.views.invoke.sendReplaces' : active ? 'tips.views.invoke.sendKeeps' : 'tips.views.invoke.send'))}>
                <SendIcon size={14} /> {busy ? t('views.invoke.sending') : t('views.invoke.send')}
              </button>
              {active && (
                <button type="button" className="button-danger" onClick={cancel} disabled={isCancelling} data-testid="invoke-cancel" {...tip(t(isCancelling ? 'tips.views.invoke.cancelling' : 'tips.views.invoke.cancel'))}>
                  <StopIcon size={14} /> {isCancelling ? t('views.invoke.cancelling') : t('views.invoke.cancel')}
                </button>
              )}
              <label className="invoke-stop-on-leave" htmlFor="invoke-stop-on-leave" {...tip(t('tips.views.invoke.stopOnLeave'))}>
                <input id="invoke-stop-on-leave" type="checkbox" checked={stopOnLeave} onChange={(e) => toggleStopOnLeave(e.target.checked)} data-testid="invoke-stop-on-leave" {...tip(t('tips.views.invoke.stopOnLeave'))} />
                <span>{t('views.invoke.stopOnLeave')}</span>
              </label>
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
