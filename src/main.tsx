import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import PublicProfilePage from './components/PublicProfilePage';
import './index.css';

const normalizePath = (path: string) => {
  if (path.length > 1 && path.endsWith('/')) {
    return path.replace(/\/+/g, '/').replace(/\/+$/, '');
  }
  return path;
};

const currentPath = normalizePath(window.location.pathname);
const shareMatch = currentPath.match(/^\/share\/([^/]+)$/);
const RootComponent = shareMatch ? (
  <PublicProfilePage slug={decodeURIComponent(shareMatch[1])} />
) : (
  <App />
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>{RootComponent}</StrictMode>
);
