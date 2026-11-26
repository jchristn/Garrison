import { useEffect, useRef, useState } from 'react';
import { evalRunChannel } from '../utils/evaluations';

/**
 * Live updates for one eval run over the WebSocket channel eval-run:{id} (AA9.13): calls onEvent with each
 * eval.case.completed message (evalRunId, completedCases, totalCases, result) and the final eval.completed message
 * (evalRunId, status, score, threshold, passed, counts, costUsd, failureReason). Returns whether the channel is
 * subscribed; while it is not, the page polls. enabled false (a finished run) opens no socket.
 */
export default function useEvalRunChannel(apiClient, evalRunId, onEvent, enabled = true) {
  const [live, setLive] = useState(false);
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    if (!enabled || !apiClient || !evalRunId || typeof WebSocket === 'undefined' || typeof apiClient.webSocketUrl !== 'function') return undefined;
    const channel = evalRunChannel(evalRunId);
    let ws;
    try {
      ws = new WebSocket(apiClient.webSocketUrl());
      ws.onopen = () => {
        try {
          ws.send(JSON.stringify({ type: 'subscribe', channel }));
        } catch {
          /* ignore */
        }
      };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message?.type === 'subscribed' && message.channel === channel) setLive(true);
          else if (message?.type === 'error' && message.channel === channel) setLive(false);
          else if ((message?.type === 'eval.case.completed' || message?.type === 'eval.completed') && message.evalRunId === evalRunId) handler.current?.(message);
        } catch {
          /* not JSON */
        }
      };
      ws.onclose = () => setLive(false);
      ws.onerror = () => setLive(false);
    } catch {
      setLive(false);
    }
    return () => {
      ws?.close();
      setLive(false);
    };
  }, [apiClient, evalRunId, enabled]);
  return live;
}
