/**
 * PURPOSE
 * -------
 * Root React component. Wraps the application in global providers
 * and renders the router.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Mount context providers (AuthProvider)
 * - Render AppRouter
 *
 * NEVER
 * -----
 * - Contain page-level UI or business logic
 * - Fetch data directly
 *
 * DEPENDS ON
 * ----------
 * routes/AppRouter, context/AuthContext
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import AppRouter         from './routes/AppRouter';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
