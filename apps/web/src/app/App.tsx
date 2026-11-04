import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { SavedProvider } from "@/features/saved/use-saved";
import { cn } from "@/lib/utils";
import type { ShellContext } from "./shell-context";

export function App() {
  const { isLoaded } = useUser();
  const { pathname } = useLocation();
  const [heroInView, setHeroInView] = useState<boolean | null>(null);
  const overlay = heroInView !== null;
  const hidden = heroInView === true || (!isLoaded && pathname === "/");

  return (
    <div className="app-shell">
      <header
        inert={hidden}
        className={cn(
          "top-0 z-40 flex items-center justify-between gap-4 border-b bg-background/80 px-5 py-3 backdrop-blur-md transition-transform duration-300 md:px-8",
          overlay ? "fixed inset-x-0" : "sticky",
          hidden && "-translate-y-full",
        )}
      >
        <Link className="font-bold text-brand" to="/">
          Opportunity Radar
        </Link>
        <nav className="flex items-center gap-2 md:gap-3" aria-label="Account">
          {!isLoaded && (
            <span role="status" className="text-sm text-muted-foreground">
              Loading account…
            </span>
          )}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="outline" className="h-10 border-brand px-4 font-semibold text-brand">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="brand" className="h-10 px-4 font-semibold">
                Sign up
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                cn(
                  "px-2 font-semibold text-brand underline-offset-6 hover:underline",
                  isActive && "underline",
                )
              }
            >
              Profile
            </NavLink>
            <UserButton />
          </Show>
        </nav>
      </header>

      <main>
        <SavedProvider>
          <Outlet context={{ setHeroInView } satisfies ShellContext} />
        </SavedProvider>
      </main>
    </div>
  );
}
