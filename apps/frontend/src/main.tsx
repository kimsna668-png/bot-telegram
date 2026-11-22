import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App.js';
import { StoreProvider } from './context/StoreContext.js';
import { AdminAuthProvider } from './context/AdminAuthContext.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
