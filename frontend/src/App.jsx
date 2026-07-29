/**
 * PURPOSE
 * -------
 * Root React component. Wraps the application in global providers
 * and renders the router.
 *
 * RESPONSIBILITIES
 * -------
 * - Mount context providers (AuthContext, ThemeContext)
 * - Render the top-level Router component
 *
 * NEVER
 * -------
 * - Contain page-level UI or business logic
 * - Fetch data directly
 *
 * DEPENDS ON
 * -------
 * routes/AppRouter.jsx, context/AuthContext, context/ThemeContext
 */
