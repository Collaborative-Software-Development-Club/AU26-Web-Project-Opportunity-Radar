import { ChevronUp, Maximize2, Minimize2, Minus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOpportunityPopouts, type Popout } from "../hooks/use-opportunity-popouts";
import { OpportunityPopoutContent } from "./opportunity-popout-content";

const DEFAULT_SIZE = { width: 448, height: 544 };
const MIN_SIZE = { width: 320, height: 240 };
const VIEWPORT_MARGIN = { width: 32, height: 96 };
const HEADER_BUTTON_CLASS =
  "text-brand-foreground hover:bg-brand-foreground/15 hover:text-brand-foreground";

export function OpportunityPopoutWindow({
  popout,
  isLatest,
}: {
  popout: Popout;
  isLatest: boolean;
}) {
  const { setMode, close } = useOpportunityPopouts();
  const [size, setSize] = useState(DEFAULT_SIZE);
  const startSize = useRef(size);
  const { id, title, mode } = popout;
  const expanded = mode === "expanded";
  const minimized = mode === "minimized";
  const resizable = mode === "open";

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMode(id, "open");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded, id, setMode]);

  const resize = (deltaX: number, deltaY: number) =>
    setSize({
      width: clamp(
        startSize.current.width + deltaX,
        MIN_SIZE.width,
        window.innerWidth - VIEWPORT_MARGIN.width,
      ),
      height: clamp(
        startSize.current.height + deltaY,
        MIN_SIZE.height,
        window.innerHeight - VIEWPORT_MARGIN.height,
      ),
    });

  const startResize = () => {
    startSize.current = size;
  };

  return (
    <div
      className={cn(
        "pointer-events-auto",
        expanded
          ? "fixed inset-0 flex items-center justify-center bg-foreground/40 p-4 md:p-10"
          : "max-h-full",
        resizable && "min-w-0",
        minimized && "shrink-0",
        !expanded && (isLatest ? "flex" : "hidden md:flex"),
      )}
      onClick={(event) => {
        if (expanded && event.target === event.currentTarget) setMode(id, "open");
      }}
    >
      <section
        role="dialog"
        aria-label={title}
        aria-modal={expanded}
        className={cn(
          "flex max-h-full max-w-full flex-col",
          expanded && "size-full max-w-4xl",
          minimized && "w-64",
        )}
        style={resizable ? size : undefined}
      >
        {resizable && (
          <div className="flex">
            <ResizeHandle
              className="size-2 cursor-nwse-resize"
              onResizeStart={startResize}
              onResize={resize}
            />
            <ResizeHandle
              className="h-2 flex-1 cursor-ns-resize"
              onResizeStart={startResize}
              onResize={(_, deltaY) => resize(0, deltaY)}
            />
          </div>
        )}
        <div className="flex min-h-0 flex-1">
          {resizable && (
            <ResizeHandle
              className="w-2 cursor-ew-resize"
              onResizeStart={startResize}
              onResize={(deltaX) => resize(deltaX, 0)}
            />
          )}
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col overflow-hidden border bg-card shadow-xl",
              expanded ? "rounded-xl" : "rounded-t-xl border-b-0",
            )}
          >
            <header className="flex items-center gap-1 bg-brand px-2 py-1.5 text-brand-foreground">
              <Button
                variant="ghost"
                className={cn("min-w-0 flex-1 justify-start", HEADER_BUTTON_CLASS)}
                title={title}
                onClick={() => setMode(id, minimized ? "open" : "minimized")}
              >
                <span className="truncate">{title}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className={HEADER_BUTTON_CLASS}
                aria-label={minimized ? `Restore ${title}` : `Minimize ${title}`}
                onClick={() => setMode(id, minimized ? "open" : "minimized")}
              >
                {minimized ? <ChevronUp /> : <Minus />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className={HEADER_BUTTON_CLASS}
                aria-label={expanded ? `Exit full view of ${title}` : `Expand ${title}`}
                onClick={() => setMode(id, expanded ? "open" : "expanded")}
              >
                {expanded ? <Minimize2 /> : <Maximize2 />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className={HEADER_BUTTON_CLASS}
                aria-label={`Close ${title}`}
                onClick={() => close(id)}
              >
                <X />
              </Button>
            </header>
            <div className={cn("min-h-0 flex-1 overflow-y-auto", minimized && "hidden")}>
              <OpportunityPopoutContent id={id} onOpenFullPage={() => close(id)} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResizeHandle({
  className,
  onResizeStart,
  onResize,
}: {
  className: string;
  onResizeStart: () => void;
  onResize: (deltaX: number, deltaY: number) => void;
}) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const stop = () => {
    origin.current = null;
  };

  return (
    <div
      aria-hidden
      className={cn("shrink-0 touch-none select-none", className)}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        origin.current = { x: event.clientX, y: event.clientY };
        onResizeStart();
      }}
      onPointerMove={(event) => {
        if (!origin.current) return;
        onResize(origin.current.x - event.clientX, origin.current.y - event.clientY);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
    />
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}
