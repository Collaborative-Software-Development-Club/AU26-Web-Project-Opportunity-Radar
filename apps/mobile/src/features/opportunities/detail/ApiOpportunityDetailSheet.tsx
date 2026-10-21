import { useAuth } from '@clerk/expo';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '../../../lib/api';
import { createApiDetailSource } from './detail-source';
import { OpportunityDetailSheet } from './OpportunityDetailSheet';

// API-only entry point: preview consumers never need a token or a backend.
export function ApiOpportunityDetailSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const api = useApi();
  const { userId } = useAuth();
  const source = useMemo(() => createApiDetailSource(api), [api]);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    const session = ++generation.current;
    const controller = new AbortController();
    setIds(new Set()); setReady(false); setError(undefined); setPending(false); busy.current = false;
    if (userId) api.saved.ids({ signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) { setIds(new Set(data)); setReady(true); }
    }).catch(() => {
      if (!controller.signal.aborted) setError('Couldn’t load your saved opportunities. Tap to retry.');
    });
    return () => { controller.abort(); if (generation.current === session) generation.current++; };
  }, [api, userId, attempt]);

  async function toggle(opportunityId: string) {
    if (busy.current || !ready) return;
    busy.current = true; setPending(true); setError(undefined);
    const session = generation.current;
    const wasSaved = ids.has(opportunityId);
    // Commit only after the server confirms; double taps cannot create races.
    try {
      await (wasSaved ? api.saved.remove(opportunityId) : api.saved.save(opportunityId));
      if (session === generation.current) setIds(previous => {
        const next = new Set(previous);
        if (wasSaved) next.delete(opportunityId); else next.add(opportunityId);
        return next;
      });
    } catch {
      if (session === generation.current) setError('Couldn’t update this save. Please try again.');
    } finally {
      if (session === generation.current) { busy.current = false; setPending(false); }
    }
  }

  return <OpportunityDetailSheet id={id} source={source} onClose={onClose} saved={{
    isSaved: value => ids.has(value), toggle, pending, disabled: !ready,
    error: userId ? error : 'Sign in to save opportunities.',
    retry: userId && !ready ? () => setAttempt(value => value + 1) : undefined,
  }} />;
}
