import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TERMINAL_RUN_STATUSES } from '../utils/constants';
import { TURN_POLL_MS } from '../utils/studio';
import { buildPreview } from '../utils/streamPreview';

/** How often streamed events are folded into the answer, in milliseconds. */
const STREAM_FLUSH_MS = 100;

/** Pages of 500 events read for a finished turn's tool calls. */
const HISTORY_PAGES = 4;

/** How close to the bottom (pixels) the transcript must be for new output to keep it scrolled to the end. */
const STICK_PX = 140;

/**
 * The turns of one conversation as a chat transcript (the studio's architect chat and the agent wizard's test chat):
 * - turns: the conversation's runs, read when the conversation changes and again when a turn ends;
 * - the running turn (`pending`), streamed over Server-Sent Events and polled as a fallback until it ends;
 * - `live[runId]`: the events of each turn folded into text segments and tool calls (`buildPreview`), streamed for the
 *   running turn and read once for finished ones;
 * - scrolling that follows new output only while the person is at the bottom (`turnsRef`, `onTurnsScroll`).
 * The caller sends turns itself and hands the created run to `startTurn(run, input)`. `onTurnFinished(run)` runs once
 * per turn when it ends.
 */
export default function useChatTranscript({ apiClient, tenantId, conversationId, onTurnFinished }) {
  const [turns, setTurns] = useState([]);
  const [pending, setPending] = useState(null);
  const [live, setLive] = useState({});
  const unmounted = useRef(false);
  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const loadTurns = useCallback(() => {
    if (!apiClient || !conversationId) {
      setTurns([]);
      return Promise.resolve();
    }
    return apiClient
      .listConversationRuns(tenantId, conversationId)
      .then((r) => !unmounted.current && setTurns(r.items || []))
      .catch(() => !unmounted.current && setTurns([]));
  }, [apiClient, tenantId, conversationId]);

  useEffect(() => {
    loadTurns();
  }, [loadTurns]);

  const pendingActive = !!pending && !TERMINAL_RUN_STATUSES.includes(pending.status);

  // Stream the running turn's events so the answer appears as the model writes it; fold them at most every
  // STREAM_FLUSH_MS so fast token streams do not re-render the Markdown on every delta.
  const pendingId = pendingActive ? pending.id : null;
  useEffect(() => {
    if (!apiClient || !pendingId) return undefined;
    const runId = pendingId;
    const buffer = [];
    const seen = new Set();
    let events = [];
    let timer = null;
    const flush = () => {
      timer = null;
      if (!buffer.length || unmounted.current) return;
      events = [...events, ...buffer.splice(0)].sort((a, b) => a.sequence - b.sequence);
      setLive((prev) => ({ ...prev, [runId]: { events, preview: buildPreview(events) } }));
    };
    const controller = apiClient.streamRunEvents(
      tenantId,
      runId,
      0,
      (data) => {
        if (!data || typeof data !== 'object' || (data.runId && data.runId !== runId)) return;
        if (data.sequence === undefined) {
          // run.completed carries the final run; run.status carries only the status.
          if (data.id === runId && data.status) setPending(data);
          return;
        }
        if (seen.has(data.sequence)) return;
        seen.add(data.sequence);
        buffer.push(data);
        if (!timer) timer = setTimeout(flush, STREAM_FLUSH_MS);
      },
      () => {}
    );
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
      flush();
    };
  }, [apiClient, tenantId, pendingId]);

  // Polling settles the turn when the stream is unavailable.
  useEffect(() => {
    if (!pendingActive) return undefined;
    const id = setInterval(async () => {
      try {
        const run = await apiClient.getRun(tenantId, pending.id);
        if (!unmounted.current) setPending(run);
      } catch {
        /* keep polling */
      }
    }, TURN_POLL_MS);
    return () => clearInterval(id);
  }, [pendingActive, pending, apiClient, tenantId]);

  // Finished turns show the tool calls they made, so read their recorded events once; a turn streamed in this session
  // is read again when it ends, in case the stream missed the last events.
  const loaded = useRef(new Set());
  useEffect(() => {
    if (!apiClient) return;
    for (const r of turns) {
      if (!TERMINAL_RUN_STATUSES.includes(r.status) || loaded.current.has(r.id)) continue;
      loaded.current.add(r.id);
      (async () => {
        let events = [];
        let after = 0;
        try {
          for (let page = 0; page < HISTORY_PAGES; page++) {
            const res = await apiClient.listRunEvents(tenantId, r.id, after, 500);
            events = events.concat(res.items || []);
            if (!res.hasMore || res.lastSequence === null) break;
            after = res.lastSequence;
          }
        } catch {
          return;
        }
        if (unmounted.current || !events.length) return;
        events.sort((a, b) => a.sequence - b.sequence);
        setLive((prev) => ({ ...prev, [r.id]: { events, preview: buildPreview(events) } }));
      })();
    }
  }, [turns, apiClient, tenantId]);

  // A turn ended (seen by the stream or by polling): read the conversation again and report it, once per turn.
  const finished = useRef(null);
  const finishedRef = useRef(onTurnFinished);
  finishedRef.current = onTurnFinished;
  useEffect(() => {
    if (!pending || !TERMINAL_RUN_STATUSES.includes(pending.status) || finished.current === pending.id) return;
    finished.current = pending.id;
    loadTurns();
    finishedRef.current?.(pending);
  }, [pending, loadTurns]);

  // Follow the conversation as it grows, but only while the person is at the bottom.
  const turnsRef = useRef(null);
  const stick = useRef(true);
  const onTurnsScroll = () => {
    const el = turnsRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_PX;
  };
  useLayoutEffect(() => {
    const el = turnsRef.current;
    if (!el || typeof MutationObserver === 'undefined') return undefined;
    const pin = () => {
      if (stick.current) el.scrollTop = el.scrollHeight;
    };
    pin();
    const observer = new MutationObserver(pin);
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  /** Show a turn the caller just started and follow it. */
  const startTurn = useCallback((run, input) => {
    if (!run?.id) return;
    stick.current = true;
    setPending(run);
    setTurns((list) => [...list.filter((r) => r.id !== run.id), { ...run, inputText: run.inputText || input }]);
  }, []);

  /** Forget the turns (a new conversation). */
  const reset = useCallback(() => {
    setTurns([]);
    setPending(null);
  }, []);

  const shownTurns = turns.map((r) => (pending && r.id === pending.id ? { ...r, ...pending, inputText: r.inputText || pending.inputText } : r));

  return { turns: shownTurns, pending, pendingActive, live, turnsRef, onTurnsScroll, startTurn, reset, loadTurns };
}
