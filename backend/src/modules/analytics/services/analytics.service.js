/**
 * PURPOSE
 * -------
 * Records and queries internal platform analytics events.
 *
 * RESPONSIBILITIES
 * -------
 * - Persist events from shared/events bus
 * - Aggregate metrics on demand
 *
 * NEVER
 * -------
 * - Expose user-facing data (that is dashboard's job)
 *
 * EXPORTS
 * -------
 * recordEvent(event), getMetrics(filter) → MetricsDTO
 *
 * DEPENDS ON
 * -------
 * AnalyticsRepository
 */
