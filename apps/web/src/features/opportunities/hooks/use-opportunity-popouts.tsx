import {
  createContext,
  useContext,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

export type PopoutMode = "open" | "minimized" | "expanded";

export type Popout = { id: string; title: string; mode: PopoutMode };

type OpportunityPopouts = {
  popouts: Popout[];
  latestId: string | undefined;
  open: (id: string, title: string) => void;
  setMode: (id: string, mode: PopoutMode) => void;
  close: (id: string) => void;
};

const MAX_POPOUTS = 3;

const OpportunityPopoutsContext = createContext<OpportunityPopouts | null>(null);

export function OpportunityPopoutsProvider({ children }: { children: ReactNode }) {
  const [popouts, setPopouts] = useState<Popout[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const latestId = popouts.some((popout) => popout.id === activeId)
    ? activeId
    : popouts[popouts.length - 1]?.id;

  const open = (id: string, title: string) => {
    setActiveId(id);
    setPopouts((previous) =>
      previous.some((popout) => popout.id === id)
        ? previous.map((popout) =>
            popout.id === id ? { ...popout, mode: "expanded" } : collapse(popout),
          )
        : [...previous.map(collapse), { id, title, mode: "expanded" as const }].slice(
            -MAX_POPOUTS,
          ),
    );
  };

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
    <OpportunityPopoutsContext.Provider value={{ popouts, latestId, open, setMode, close }}>
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

export function useOpenPopoutOnCardClick(id: string, title: string) {
  const { open } = useOpportunityPopouts();
  return (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("a, button")) return;
    open(id, title);
  };
}

function collapse(popout: Popout): Popout {
  return popout.mode === "expanded" ? { ...popout, mode: "open" } : popout;
}
