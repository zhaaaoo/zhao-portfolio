import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Resume from './Resume';
import './resume.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Resume />
  </StrictMode>
);
