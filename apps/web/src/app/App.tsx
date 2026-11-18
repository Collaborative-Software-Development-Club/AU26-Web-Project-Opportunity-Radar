import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router";
import { useEffect } from "react";
import { useApi } from "@/lib/api";
import { SavedProvider } from "@/features/saved/use-saved";

export function App() {
  const { isLoaded, isSignedIn, user } = useUser();
  const api = useApi();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let cancelled = false;

    async function checkOnboarding() {
      try {
        const profile = await api.users.me();
        if (cancelled) return;

      if (!profile.onboardingCompletedAt && pathname !== "/onboarding") {
        navigate("/onboarding", { replace: true });
      }
    } catch (error) {
      console.error("Failed to check onboarding status:", error);
    }
  }

  checkOnboarding();
  return () => {
    cancelled = true;
  };
}, [isLoaded, isSignedIn, user?.id, api, navigate, pathname]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          Opportunity Radar
        </Link>
        <nav className="auth-controls" aria-label="Account">
          <NavLink className="nav-link" to="/profile">
            Profile
          </NavLink>
          {!isLoaded && <span role="status">Loading account…</span>}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="button button-secondary" type="button">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="button button-primary" type="button">
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </nav>
      </header>

      <main>
        <SavedProvider>
          <Outlet />
        </SavedProvider>
      </main>
    </div>
  );
}
