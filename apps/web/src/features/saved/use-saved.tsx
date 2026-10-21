import { useAuth, useClerk } from "@clerk/react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useApi } from "@/lib/api";

type Saved = { isSaved: (id: string) => boolean; toggle: (id: string) => void };

const SavedContext = createContext<Saved | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());
  const queues = useRef(new Map<string, Promise<unknown>>());

  useEffect(() => {
    setIds(new Set());
    if (!isSignedIn) return;
    const controller = new AbortController();
    api.saved
      .ids({ signal: controller.signal })
      .then(({ data }) => setIds(new Set(data)))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.error(error);
      });
    return () => controller.abort();
  }, [api, isSignedIn]);

  const mark = (id: string, saved: boolean) =>
    setIds((previous) => {
      const next = new Set(previous);
      if (saved) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggle = (id: string) => {
    if (!isSignedIn) return openSignIn();
    const wasSaved = ids.has(id);
    mark(id, !wasSaved);
    const request = (queues.current.get(id) ?? Promise.resolve())
      .then(() => (wasSaved ? api.saved.remove(id) : api.saved.save(id)))
      .catch((error: unknown) => {
        console.error(error);
        mark(id, wasSaved);
      });
    queues.current.set(id, request);
  };

  return (
    <SavedContext.Provider value={{ isSaved: (id) => ids.has(id), toggle }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const saved = useContext(SavedContext);
  if (!saved) throw new Error("useSaved must be used inside SavedProvider.");
  return saved;
}
