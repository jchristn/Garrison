import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MarkdownView from '../MarkdownView';
import { DownloadIcon, PlayIcon } from '../Icons';
import { tip } from '../Tooltip';
import StudioLink from './StudioLink';
import { TurnStatus } from './StudioChatPanel';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { pathFor } from '../../config/navConfig';
import { TERMINAL_RUN_STATUSES } from '../../utils/constants';
import { errorMessage } from '../../utils/errors';
import { TURN_POLL_MS, downloadMarkdown, entryAgent, playgroundAgents, playgroundFileName, playgroundMarkdown } from '../../utils/studio';

/**
 * The playground for a draft (AD9.2): each turn writes the draft's document for the chosen agent (default: the target
 * app's entry agent) as that agent's draft revision and runs it on its playground deployment, without touching live
 * configuration (POST .../studio/drafts/{id}/playground/invoke). Turns after the first continue the same conversation.
 * Each turn shows its status and answer and links to its run, whose page has the run tree with fan-out groups and the
 * conversation's files. The turns download as Markdown.
 */
export default function StudioPlaygroundPanel({ draft, graph, blocked = '' }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [agent, setAgent] = useState('');
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const unmounted = useRef(false);
  const agents = playgroundAgents(draft, graph);
  const entry = entryAgent(draft, graph);
  const running = turns.find((turn) => turn.runId && !TERMINAL_RUN_STATUSES.includes(turn.status));

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(async () => {
      try {
        const run = await apiClient.getRun(tenantId, running.runId);
        if (unmounted.current) return;
        setTurns((list) => list.map((turn) => (turn.runId === run.id ? { ...turn, status: run.status, answer: run.resultText || '', error: run.errorMessage || '' } : turn)));
      } catch {
        /* keep polling */
      }
    }, TURN_POLL_MS);
    return () => clearInterval(id);
  }, [running, apiClient, tenantId]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy || running || blocked) return;
    setBusy(true);
    setError(null);
    try {
      const body = { input: text, wait: false };
      if (agent) body.agent = agent;
      if (conversationId) body.conversationId = conversationId;
      const run = await apiClient.invokeStudioPlayground(tenantId, draft.id, body);
      if (unmounted.current) return;
      if (run?.conversationId) setConversationId(run.conversationId);
      setTurns((list) => [...list, { runId: run?.id, input: text, agent: agent || entry || '', status: run?.status || 'Queued', answer: run?.resultText || '', error: run?.errorMessage || '' }]);
      setInput('');
    } catch (e) {
      if (!unmounted.current) setError(e);
    } finally {
      if (!unmounted.current) setBusy(false);
    }
  };

  const reset = () => {
    setConversationId(null);
    setTurns([]);
    setError(null);
  };

  const exportTranscript = () => {
    const labels = {
      title: t('components.studio.playground.title'),
      draft: t('components.studio.playground.exportDraft'),
      turn: t('components.studio.playground.exportTurn'),
      input: t('components.studio.playground.input'),
      answer: t('components.studio.playground.answer'),
      run: t('components.studio.playground.exportRun')
    };
    downloadMarkdown(playgroundFileName(draft), playgroundMarkdown(draft, turns, labels));
  };

  return (
    <section className="panel studio-playground" aria-label={t('components.studio.playground.title')} data-testid="studio-playground">
      <div className="studio-row-between">
        <h3 className="section-title" {...tip(t('tips.studio.playground.title'))}>
          {t('components.studio.playground.title')}
        </h3>
        <div className="flex gap-sm items-center">
          {conversationId && (
            <StudioLink to={pathFor('conversations', conversationId)} testId="studio-playground-conversation" tipText={t('tips.studio.playground.conversation')}>
              {t('components.studio.playground.conversation')}
            </StudioLink>
          )}
          <button type="button" className="button-secondary button-sm" onClick={exportTranscript} disabled={!turns.length} data-testid="studio-playground-export" {...tip(t('tips.studio.playground.export'))}>
            <DownloadIcon size={14} /> {t('components.studio.playground.export')}
          </button>
          <button type="button" className="button-ghost button-sm" onClick={reset} disabled={!turns.length || !!running} data-testid="studio-playground-reset" {...tip(t('tips.studio.playground.reset'))}>
            {t('components.studio.playground.reset')}
          </button>
        </div>
      </div>
      <p className="text-muted">{t('components.studio.playground.intro')}</p>
      <div className="studio-chat-turns" data-testid="studio-playground-turns">
        {turns.length === 0 ? (
          <div className="text-muted">{t('components.studio.playground.empty')}</div>
        ) : (
          turns.map((turn, i) => (
            <div key={turn.runId || i} className="studio-turn" data-playground-turn={i + 1}>
              <div className="studio-turn-you">
                <span className="studio-turn-who" {...tip(t('tips.studio.chat.you'))}>
                  {t('components.studio.playground.turn', { number: i + 1, agent: turn.agent || t('components.studio.playground.defaultAgentShort') })}
                </span>
                <div className="studio-turn-text">{turn.input}</div>
              </div>
              <div className="studio-turn-architect">
                <span className="studio-turn-who inline-meta">
                  <TurnStatus status={turn.status} />
                  {turn.runId && (
                    <StudioLink to={pathFor('runs', turn.runId)} testId="studio-playground-run" tipText={t('tips.studio.playground.openRun')}>
                      {t('components.studio.playground.openRun')}
                    </StudioLink>
                  )}
                </span>
                {turn.answer || turn.error ? (
                  <MarkdownView text={turn.answer || turn.error} testId="studio-playground-answer" />
                ) : (
                  <div className="text-muted">{TERMINAL_RUN_STATUSES.includes(turn.status) ? '-' : t('components.studio.chat.thinking')}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="studio-playground-agent" {...tip(t('tips.studio.playground.agent'))}>
            {t('components.studio.playground.agent')}
          </label>
          <select id="studio-playground-agent" value={agent} onChange={(e) => setAgent(e.target.value)} data-testid="studio-playground-agent" {...tip(t('tips.studio.playground.agent'))}>
            <option value="">{entry ? t('components.studio.playground.defaultAgent', { name: entry }) : t('components.studio.playground.defaultAgentShort')}</option>
            {agents.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="field span-full">
          <label htmlFor="studio-playground-input" {...tip(t('tips.studio.playground.input'))}>
            {t('components.studio.playground.input')}
          </label>
          <textarea
            id="studio-playground-input"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('components.studio.playground.placeholder')}
            onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && send()}
            data-testid="studio-playground-input"
            {...tip(t('tips.studio.playground.input'))}
          />
          <div className="field-hint">{t(conversationId ? 'components.studio.playground.continueHint' : 'components.studio.playground.firstHint')}</div>
        </div>
      </div>
      {error && (
        <div className="error-banner" role="alert" data-testid="studio-playground-error">
          {errorMessage(t, error)}
        </div>
      )}
      <div className="flex gap-sm items-center">
        <button
          type="button"
          className="button-primary"
          onClick={send}
          disabled={busy || !!running || !input.trim()}
          aria-disabled={blocked ? 'true' : undefined}
          data-testid="studio-playground-send"
          {...tip(blocked || t(running ? 'tips.studio.playground.sendBusy' : 'tips.studio.playground.send'))}
        >
          <PlayIcon size={14} /> {busy ? t('views.invoke.sending') : t('components.studio.playground.send')}
        </button>
      </div>
    </section>
  );
}
