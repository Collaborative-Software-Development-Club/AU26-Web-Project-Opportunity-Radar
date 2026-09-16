import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode><main><span>Opportunity Radar</span><h1>Your next opportunity starts here.</h1>
    <p>The React web scaffold is running.</p><p>Discovery, authentication, saved opportunities, and database integration are still placeholders.</p>
  </main></StrictMode>,
);
