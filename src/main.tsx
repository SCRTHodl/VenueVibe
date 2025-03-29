import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PromotionProvider } from './contexts/PromotionContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PromotionProvider>
      <App />
    </PromotionProvider>
  </StrictMode>
);
