import { useEffect, useRef, useState } from 'react';

const EVENTS = ['org.changed', 'report.filed', 'spend.updated', 'proposal.changed'];

/**
 * Live updates for one organization over the WebSocket channel organization:{id} (AA7.12): org.changed when the
 * organization or its tree changes (deleted: true when it is gone), report.filed for reports its members file,
 * spend.updated with the unit spend rows, and proposal.changed when an executive's proposal changes (AA8.10). Used by
 * the organization page and the board (AA10.7). Returns whether the channel is subscribed.
 */
export default function useOrganizationChannel(apiClient, organizationId, onEvent) {
  const [live, setLive] = useState(false);
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    if (!apiClient || !organizationId || typeof WebSocket === 'undefined' || typeof apiClient.webSocketUrl !== 'function') return undefined;
    const channel = `organization:${organizationId}`;
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
          else if (EVENTS.includes(message?.type)) handler.current?.(message);
        } catch {
          /* not JSON */
        }
      };
      ws.onclose = () => setLive(false);
      ws.onerror = () => setLive(false);
    } catch {
      setLive(false);
    }
    return () => ws?.close();
  }, [apiClient, organizationId]);
  return live;
}
