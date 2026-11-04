import { useLayoutEffect, type RefObject } from "react";
import { useShell } from "@/app/shell-context";

export function useHideHeaderWhileVisible(ref: RefObject<HTMLElement | null>) {
  const { setHeroInView } = useShell();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setHeroInView(true);
    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.isIntersecting),
      { rootMargin: "-50% 0px 0px 0px" },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      setHeroInView(null);
    };
  }, [ref, setHeroInView]);
}
