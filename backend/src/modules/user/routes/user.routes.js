/**
 * PURPOSE
 * -------
 * HTTP routes for user profile operations.
 *
 * ROUTES
 * ------
 * GET   /users/me   — get current user profile
 * PATCH /users/me   — update current user profile (fullName, bio)
 *
 * DEPENDS ON
 * ----------
 * express, user.controller, shared/middleware/auth.middleware
 */

import { Router }       from 'express';
import * as controller  from '../controllers/user.controller.js';
import { authenticate } from '../../../shared/middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/me',   controller.getProfile);
router.patch('/me', controller.updateProfile);

export default router;
