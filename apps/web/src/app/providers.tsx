import { ClerkProvider } from '@clerk/react';
import type { PropsWithChildren } from 'react';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();

export function Providers({ children }: PropsWithChildren) {
  if (!publishableKey) {
    return (
      <main className="setup-message">
        <span className="brand">Opportunity Radar</span>
        <h1>Authentication setup needed</h1>
        <p>
          Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in <code>apps/web/.env</code>,
          then restart the web development server.
        </p>
      </main>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      {children}
    </ClerkProvider>
  );
}
