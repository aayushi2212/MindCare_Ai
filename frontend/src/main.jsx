/**
 * PURPOSE
 * -------
 * Vite entry point. Mounts the React application to the DOM.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Import global CSS
 * - Call ReactDOM.createRoot().render(<App />)
 *
 * NEVER
 * -----
 * - Contain component logic
 * - Import feature modules directly
 *
 * DEPENDS ON
 * ----------
 * App.jsx
 */

import React        from 'react';
import ReactDOM     from 'react-dom/client';
import App          from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
