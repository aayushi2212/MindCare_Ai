/**
 * PURPOSE
 * -------
 * Computes and returns dashboard metrics for a given user.
 *
 * RESPONSIBILITIES
 * -------
 * - Aggregate emotion trends, session counts, and streaks from multiple repositories
 * - Cache expensive aggregations
 *
 * NEVER
 * -------
 * - Store raw event data
 * - Generate AI insights directly
 *
 * EXPORTS
 * -------
 * getDashboardData(userId, dateRange) → DashboardDTO
 *
 * DEPENDS ON
 * -------
 * DashboardRepository, EmotionService
 */
