import { ChevronUp, Maximize2, Minimize2, Minus, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useOpportunityPopouts,
  type Popout,
  type PopoutMode,
} from "../hooks/use-opportunity-popouts";
import { OpportunityPopoutContent } from "./opportunity-popout-content";

const DEFAULT_SIZE = { width: 544, height: 544 };
const MIN_SIZE = { width: 320, height: 240 };
const VIEWPORT_MARGIN = { width: 32, height: 96 };
const TRANSITION_MS = 200;
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
  const [phase, setPhase] = useState<"entering" | "idle" | "closing">("entering");
  const [resizeCursor, setResizeCursor] = useState<string | null>(null);
  const slot = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLElement>(null);
  const startSize = useRef(size);
  const flipFrom = useRef<DOMRect | null>(null);
  const { id, title, mode } = popout;
  const expanded = mode === "expanded";
  const minimized = mode === "minimized";
  const resizable = mode === "open";
  const collapsed = phase !== "idle";

  const changeMode = (next: PopoutMode) => {
    if (expanded || next === "expanded")
      flipFrom.current = frame.current?.getBoundingClientRect() ?? null;
    setMode(id, next);
  };

  const closeSmoothly = () => {
    if (expanded) return close(id);
    setPhase("closing");
    window.setTimeout(() => close(id), TRANSITION_MS);
  };

  useLayoutEffect(() => {
    slot.current?.getBoundingClientRect();
    setPhase("idle");
  }, []);

  useLayoutEffect(() => {
    const from = flipFrom.current;
    const element = frame.current;
    flipFrom.current = null;
    if (!from || !element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const to = element.getBoundingClientRect();
    const translate = `translate(${from.left - to.left}px, ${from.top - to.top}px)`;
    const scale = `scale(${from.width / to.width}, ${from.height / to.height})`;
    element.animate(
      [
        { transformOrigin: "top left", transform: `${translate} ${scale}` },
        { transformOrigin: "top left", transform: "none" },
      ],
      { duration: TRANSITION_MS, easing: "ease-out" },
    );
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      flipFrom.current = frame.current?.getBoundingClientRect() ?? null;
      setMode(id, "open");
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

  const startResize = (cursor: string) => {
    const rect = slot.current?.getBoundingClientRect();
    startSize.current = rect ? { width: rect.width, height: rect.height } : size;
    setResizeCursor(cursor);
  };

  const endResize = () => setResizeCursor(null);

  return (
    <div
      ref={slot}
      className={cn(
        "pointer-events-auto max-h-full max-w-full",
        isLatest || expanded ? "flex" : "hidden md:flex",
        minimized ? "h-11 w-64 shrink-0" : "min-w-0",
        !resizeCursor &&
          "transition-[width,height,opacity] duration-200 ease-out motion-reduce:transition-none",
        collapsed && "opacity-0",
      )}
      style={{ ...(minimized ? undefined : size), ...(collapsed && { width: 0 }) }}
    >
      <div
        aria-hidden
        className={cn(
          "fixed inset-0 z-10 bg-foreground/40 transition-opacity duration-200 motion-reduce:transition-none",
          !expanded && "pointer-events-none opacity-0",
        )}
        onClick={() => changeMode("open")}
      />
      {resizeCursor && <div aria-hidden className={cn("fixed inset-0 z-20", resizeCursor)} />}
      <section
        ref={frame}
        role="dialog"
        aria-label={title}
        aria-modal={expanded}
        className={cn(
          "flex flex-col",
          expanded ? "fixed inset-4 z-10 mx-auto max-w-4xl md:inset-10" : "size-full min-w-0",
        )}
      >
        {resizable && (
          <div className="flex">
            <ResizeHandle
              className="size-2"
              cursor="cursor-nwse-resize"
              onResizeStart={startResize}
              onResize={resize}
              onResizeEnd={endResize}
            />
            <ResizeHandle
              className="h-2 flex-1"
              cursor="cursor-ns-resize"
              onResizeStart={startResize}
              onResize={(_, deltaY) => resize(0, deltaY)}
              onResizeEnd={endResize}
            />
          </div>
        )}
        <div className="flex min-h-0 flex-1">
          {resizable && (
            <ResizeHandle
              className="w-2"
              cursor="cursor-ew-resize"
              onResizeStart={startResize}
              onResize={(deltaX) => resize(deltaX, 0)}
              onResizeEnd={endResize}
            />
          )}
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col overflow-hidden border-x bg-card shadow-xl",
              expanded ? "rounded-xl border-b" : "rounded-t-xl",
            )}
          >
            <header className="flex h-11 shrink-0 items-center gap-1 bg-brand px-2 text-brand-foreground">
              <Button
                variant="ghost"
                className={cn("min-w-0 flex-1 justify-start", HEADER_BUTTON_CLASS)}
                title={title}
                onClick={() => changeMode(minimized ? "open" : "minimized")}
              >
                <span className="truncate">{title}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className={HEADER_BUTTON_CLASS}
                aria-label={minimized ? `Restore ${title}` : `Minimize ${title}`}
                onClick={() => changeMode(minimized ? "open" : "minimized")}
              >
                {minimized ? <ChevronUp /> : <Minus />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className={HEADER_BUTTON_CLASS}
                aria-label={expanded ? `Exit full view of ${title}` : `Expand ${title}`}
                onClick={() => changeMode(expanded ? "open" : "expanded")}
              >
                {expanded ? <Minimize2 /> : <Maximize2 />}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className={HEADER_BUTTON_CLASS}
                aria-label={`Close ${title}`}
                onClick={closeSmoothly}
              >
                <X />
              </Button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto" inert={minimized}>
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
  cursor,
  onResizeStart,
  onResize,
  onResizeEnd,
}: {
  className: string;
  cursor: string;
  onResizeStart: (cursor: string) => void;
  onResize: (deltaX: number, deltaY: number) => void;
  onResizeEnd: () => void;
}) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const stop = () => {
    origin.current = null;
    onResizeEnd();
  };

  return (
    <div
      aria-hidden
      className={cn("shrink-0 touch-none select-none", cursor, className)}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        origin.current = { x: event.clientX, y: event.clientY };
        onResizeStart(cursor);
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
