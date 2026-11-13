import { useOutletContext } from "react-router";

export type ShellContext = {
  setHeroInView: (inView: boolean | null) => void;
};

export function useShell() {
  return useOutletContext<ShellContext>();
}
