import { useCallback, useEffect, useRef, useState } from 'react';
import { openFileStream } from '../api/stream.js';

// The conversation's file listing, kept current by the files.changed stream. Each change refetches the listing
// (the stream's first message lists everything, so a reconnect also catches up). A path whose version differs from
// the one already listed is marked fresh so the panel can highlight it; the first listing marks nothing.
export default function useFiles(client, conversationId) {
  const [state, setState] = useState({ loading: false, listing: null, error: null, fresh: [] });
  const known = useRef(null);

  const refresh = useCallback(async () => {
    if (!conversationId) return;
    try {
      const listing = await client.files(conversationId);
      known.current = new Map((listing && listing.files ? listing.files : []).map((f) => [f.path, f.currentVersion]));
      setState((s) => ({ ...s, loading: false, listing, error: null }));
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err }));
    }
  }, [client, conversationId]);

  useEffect(() => {
    known.current = null;
    if (!conversationId) {
      setState({ loading: false, listing: null, error: null, fresh: [] });
      return undefined;
    }
    setState({ loading: true, listing: null, error: null, fresh: [] });
    refresh();
    const stream = openFileStream(client, conversationId, {
      onChanged: (data) => {
        const changed = Array.isArray(data.changed) ? data.changed : [];
        const seen = known.current;
        const paths = seen ? changed.filter((c) => !c.deleted && seen.get(c.path) !== c.version).map((c) => c.path) : [];
        if (paths.length) setState((s) => ({ ...s, fresh: [...new Set([...s.fresh, ...paths])] }));
        if (changed.length) refresh();
      }
    });
    return () => stream.close();
  }, [client, conversationId, refresh]);

  return { ...state, refresh };
}
