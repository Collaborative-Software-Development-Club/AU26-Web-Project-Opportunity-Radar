import { createContext, useContext, useState, type ReactNode } from "react";

export type PopoutMode = "open" | "minimized" | "expanded";

export type Popout = { id: string; title: string; mode: PopoutMode };

type OpportunityPopouts = {
  popouts: Popout[];
  open: (id: string, title: string) => void;
  setMode: (id: string, mode: PopoutMode) => void;
  close: (id: string) => void;
};

const MAX_POPOUTS = 3;

const OpportunityPopoutsContext = createContext<OpportunityPopouts | null>(null);

export function OpportunityPopoutsProvider({ children }: { children: ReactNode }) {
  const [popouts, setPopouts] = useState<Popout[]>([]);

  const open = (id: string, title: string) =>
    setPopouts((previous) =>
      [
        ...previous.filter((popout) => popout.id !== id).map(collapse),
        { id, title, mode: "open" as const },
      ].slice(-MAX_POPOUTS),
    );

  const setMode = (id: string, mode: PopoutMode) =>
    setPopouts((previous) =>
      previous.map((popout) => {
        if (popout.id === id) return { ...popout, mode };
        return mode === "expanded" ? collapse(popout) : popout;
      }),
    );

  const close = (id: string) =>
    setPopouts((previous) => previous.filter((popout) => popout.id !== id));

  return (
    <OpportunityPopoutsContext.Provider value={{ popouts, open, setMode, close }}>
      {children}
    </OpportunityPopoutsContext.Provider>
  );
}

export function useOpportunityPopouts() {
  const popouts = useContext(OpportunityPopoutsContext);
  if (!popouts)
    throw new Error("useOpportunityPopouts must be used inside OpportunityPopoutsProvider.");
  return popouts;
}

function collapse(popout: Popout): Popout {
  return popout.mode === "expanded" ? { ...popout, mode: "open" } : popout;
}
