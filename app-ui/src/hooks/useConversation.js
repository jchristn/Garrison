import { useCallback, useEffect, useRef, useState } from 'react';
import { openTurnStream } from '../api/stream.js';
import { applyEvent, applyView, isTerminal, newTurnState } from '../utils/turns.js';

// One conversation's turns, with live streaming for any turn that is still running.
//
// Loading a conversation fetches its turns and follows the last one when it has not finished. Sending a message
// adds the new turn at once and follows its stream. Starting a conversation (no id yet) adopts the new id without
// reloading, so the first answer streams without a gap. Every stream closes when the conversation changes or the
// component unmounts.
export default function useConversation(client, conversationId, { onStarted, onTurnFinished, onMissing } = {}) {
  const [state, setState] = useState({ loading: !!conversationId, turns: [], error: null });
  const [sending, setSending] = useState(false);
  const streams = useRef(new Map());
  const adopted = useRef(null);
  const callbacks = useRef({ onStarted, onTurnFinished, onMissing });
  callbacks.current = { onStarted, onTurnFinished, onMissing };

  const closeAll = useCallback(() => {
    for (const s of streams.current.values()) s.close();
    streams.current.clear();
  }, []);

  const updateTurn = useCallback((runId, fn) => {
    setState((s) => ({ ...s, turns: s.turns.map((turn) => (turn.runId === runId ? fn(turn) : turn)) }));
  }, []);

  const follow = useCallback(
    (convId, turn) => {
      if (!turn || isTerminal(turn.status) || streams.current.has(turn.runId)) return;
      const runId = turn.runId;
      const stream = openTurnStream(client, convId, runId, {
        afterSequence: turn.lastSequence || 0,
        onOpen: () => updateTurn(runId, (x) => (x.reconnecting ? { ...x, reconnecting: false } : x)),
        onEvent: (evt) => updateTurn(runId, (x) => applyEvent(x.reconnecting ? { ...x, reconnecting: false } : x, evt)),
        onStatus: (view) => updateTurn(runId, (x) => applyView({ ...x, reconnecting: false }, view)),
        onCompleted: (view) => {
          streams.current.delete(runId);
          updateTurn(runId, (x) => applyView({ ...x, reconnecting: false }, view));
          if (callbacks.current.onTurnFinished) callbacks.current.onTurnFinished();
        },
        onReconnecting: ({ attempt }) => {
          updateTurn(runId, (x) => (x.reconnecting ? x : { ...x, reconnecting: true }));
          // EventSource hides the HTTP status. After repeated failures, a plain request finds out whether the
          // session ended (a 401 there returns the user to sign-in).
          if (attempt >= 2) client.conversation(convId).catch(() => {});
        }
      });
      streams.current.set(runId, stream);
    },
    [client, updateTurn]
  );

  useEffect(() => {
    if (conversationId && adopted.current === conversationId) {
      adopted.current = null;
      return undefined;
    }
    closeAll();
    if (!conversationId) {
      setState({ loading: false, turns: [], error: null });
      return undefined;
    }
    let cancelled = false;
    setState({ loading: true, turns: [], error: null });
    client
      .conversation(conversationId)
      .then((view) => {
        if (cancelled) return;
        const turns = (view && view.turns ? view.turns : []).map(newTurnState);
        setState({ loading: false, turns, error: null });
        const last = turns[turns.length - 1];
        if (last && !isTerminal(last.status)) follow(conversationId, last);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err && err.status === 404 && callbacks.current.onMissing) callbacks.current.onMissing();
        setState({ loading: false, turns: [], error: err });
      });
    return () => {
      cancelled = true;
    };
  }, [client, conversationId, closeAll, follow]);

  useEffect(() => closeAll, [closeAll]);

  /** Send a message; resolves true when the server accepted it. Throws the GatewayError otherwise. */
  const send = useCallback(
    async (message) => {
      setSending(true);
      try {
        if (!conversationId) {
          const res = await client.startConversation(message);
          const turn = newTurnState(res.turn);
          adopted.current = res.conversationId;
          setState({ loading: false, turns: [turn], error: null });
          follow(res.conversationId, turn);
          if (callbacks.current.onStarted) callbacks.current.onStarted(res.conversationId);
        } else {
          const view = await client.sendMessage(conversationId, message);
          const turn = newTurnState(view);
          setState((s) => ({ ...s, turns: [...s.turns, turn] }));
          follow(conversationId, turn);
        }
        return true;
      } finally {
        setSending(false);
      }
    },
    [client, conversationId, follow]
  );

  const last = state.turns[state.turns.length - 1];
  const busy = !!last && !isTerminal(last.status);
  return { ...state, sending, busy, send };
}
