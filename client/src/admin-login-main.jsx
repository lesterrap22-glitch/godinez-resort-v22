import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AdminLoginApp from './AdminLoginApp.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminLoginApp />
  </StrictMode>
);
