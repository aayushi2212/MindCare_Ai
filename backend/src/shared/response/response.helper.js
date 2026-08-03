/**
 * PURPOSE
 * -------
 * Provides helper functions to send standardised JSON responses.
 *
 * RESPONSIBILITIES
 * ----------------
 * - success(res, data, statusCode, message)
 * - created(res, data, message)
 * - noContent(res)
 * - error — handled via error.middleware.js, not here
 *
 * NEVER
 * -----
 * - Handle business logic
 * - Determine what data to return
 *
 * EXPORTS
 * -------
 * success, created, noContent
 *
 * DEPENDS ON
 * ----------
 * none
 */

import HTTP from '../constants/http-status.js';

export const success = (res, data = null, statusCode = HTTP.OK, message = 'Success') => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const created = (res, data = null, message = 'Created successfully') => {
  res.status(HTTP.CREATED).json({
    success: true,
    message,
    data,
  });
};

export const noContent = (res) => {
  res.status(HTTP.NO_CONTENT).end();
};

export const paginated = (res, data, pagination, message = 'Success') => {
  res.status(HTTP.OK).json({
    success: true,
    message,
    data,
    pagination,
  });
};

export default { success, created, noContent, paginated };
