/**
 * PURPOSE
 * -------
 * Defines all HTTP routes for the auth module.
 *
 * ROUTES
 * ------
 * POST  /auth/register  — create new account
 * POST  /auth/login     — authenticate and receive tokens
 * POST  /auth/refresh   — rotate refresh token
 * POST  /auth/logout    — revoke refresh token
 * GET   /auth/me        — get current authenticated user
 *
 * NEVER
 * -----
 * - Contain logic
 * - Access database directly
 *
 * DEPENDS ON
 * ----------
 * auth.controller, auth.validator, shared/middleware/auth.middleware
 */

import { Router }            from 'express';
import * as controller       from '../controllers/auth.controller.js';
import {
  validateRegister,
  validateLogin,
  validateRefresh,
}                            from '../validators/auth.validator.js';
import { authenticate }      from '../../../shared/middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and session management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Aayu Shah"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "aayu@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "SecurePass123"
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
router.post('/register', validateRegister, controller.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateLogin, controller.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rotate refresh token and issue a new token pair
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New token pair issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', validateRefresh, controller.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Revoke the current session's refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       204:
 *         description: Logged out successfully
 *       401:
 *         description: Not authenticated
 */
router.post('/logout', authenticate, controller.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user object
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticate, controller.getMe);

export default router;
