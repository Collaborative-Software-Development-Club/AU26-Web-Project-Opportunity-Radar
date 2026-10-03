import { Show, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/react';
import { Link, NavLink, Outlet } from 'react-router';

export function App() {
  const { isLoaded } = useUser();

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">Opportunity Radar</Link>
        <nav className="auth-controls" aria-label="Account">
          <NavLink className="nav-link" to="/profile">Profile</NavLink>
          {!isLoaded && <span role="status">Loading account…</span>}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="button button-secondary" type="button">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="button button-primary" type="button">Sign up</button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
