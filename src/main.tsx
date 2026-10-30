import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { brandConfig } from './brand.config';
import { applyBrand } from './theme/applyBrand';

// Applica subito il tema brand di default (build-time).
// In una tappa successiva verrà ri-applicato con i valori da `settings.theme`.
applyBrand(brandConfig.theme);

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Elemento #root non trovato in index.html');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
