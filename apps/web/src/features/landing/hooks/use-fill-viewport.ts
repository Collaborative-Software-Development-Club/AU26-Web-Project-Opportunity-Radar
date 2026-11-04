import { useLayoutEffect, useRef, useState } from "react";

export function useFillViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inset, setInset] = useState(0);

  useLayoutEffect(() => {
    function measure() {
      const element = ref.current;
      if (!element) return;
      const { top, left } = element.getBoundingClientRect();
      setInset(Math.round(top + window.scrollY + left));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  return { ref, minHeight: `calc(100svh - ${inset}px)` };
}
