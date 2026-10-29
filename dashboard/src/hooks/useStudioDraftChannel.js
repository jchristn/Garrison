import { useEffect, useRef, useState } from 'react';
import { isStudioDraftChanged, studioDraftChannel } from '../utils/studio';

/**
 * Live updates for one studio draft over the WebSocket channel studio-draft:{id} (AD7.10). Calls onChanged with each
 * studio-draft.changed message (draftId, version, status, changed, graph) and returns whether the channel is
 * subscribed; while it is not, the workspace polls.
 */
export default function useStudioDraftChannel(apiClient, draftId, onChanged) {
  const [live, setLive] = useState(false);
  const handler = useRef(onChanged);
  useEffect(() => {
    handler.current = onChanged;
  }, [onChanged]);
  useEffect(() => {
    if (!apiClient || !draftId || typeof WebSocket === 'undefined' || typeof apiClient.webSocketUrl !== 'function') return undefined;
    const channel = studioDraftChannel(draftId);
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
          else if (isStudioDraftChanged(message, draftId)) handler.current?.(message);
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
  }, [apiClient, draftId]);
  return live;
}
