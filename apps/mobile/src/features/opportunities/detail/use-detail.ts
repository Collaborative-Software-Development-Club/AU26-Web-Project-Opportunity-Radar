import { useEffect, useState } from 'react';
import { ApiError } from '@radar/api-client';
import type { DetailRecord, DetailSource, RelatedKind } from './detail-source';

export function detailError(error: unknown): string {
  if (error instanceof ApiError && [400, 404].includes(error.status)) return 'This opportunity is no longer available.';
  if (error instanceof ApiError && error.status === 401) return 'Please sign in again to continue.';
  return 'We couldn’t load this opportunity. Check your connection and try again.';
}

export function useDetail(id: string, source: DetailSource) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ record?: DetailRecord; error?: string }>({});
  useEffect(() => {
    const controller = new AbortController();
    setState({});
    source.get(id, controller.signal).then(record => {
      if (!controller.signal.aborted) setState({ record });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ error: detailError(error) });
    });
    return () => controller.abort();
  }, [id, source, attempt]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}

export function useRelated(record: DetailRecord, source: DetailSource, kind: RelatedKind) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ data: DetailRecord[]; loading: boolean; error: boolean }>({ data: [], loading: true, error: false });
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: [], loading: true, error: false });
    source.related(record, kind, controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ data, loading: false, error: false });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ data: [], loading: false, error: true });
    });
    return () => controller.abort();
  }, [record, source, kind, attempt]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}
