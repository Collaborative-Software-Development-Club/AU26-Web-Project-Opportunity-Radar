import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/react";
import { OpportunityFeed } from "@/features/opportunities/opportunity-feed";

export function App() {
  const { isLoaded, isSignedIn, user } = useUser();

  // Temporary demo entry point until routing exists: visit /discover
  if (window.location.pathname === "/discover")
    return (
      <div className="p-8">
        <OpportunityFeed firstName={user?.firstName ?? null} />
      </div>
    );

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/">
          Opportunity Radar
        </a>
        <nav className="auth-controls" aria-label="Account">
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
        <h1>Your next opportunity starts here.</h1>
        <p>
          One place to discover student opportunities and plan your next step.
        </p>
        {isLoaded && (
          <section className="account-card" aria-labelledby="account-heading">
            <h2 id="account-heading">
              {isSignedIn
                ? `Welcome${user?.firstName ? `, ${user.firstName}` : ""}!`
                : "Start with an account"}
            </h2>
            <p>
              {isSignedIn
                ? "You’re signed in. Open your profile menu above to manage your account or sign out."
                : "Sign in or create an account to get started."}
            </p>
            <p className="coming-soon">
              Opportunity discovery and saved opportunities are coming soon.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
