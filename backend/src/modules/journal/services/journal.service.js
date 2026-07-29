/**
 * PURPOSE
 * -------
 * Business logic for journal entry management.
 *
 * RESPONSIBILITIES
 * -------
 * - CRUD operations on journal entries
 * - Trigger emotion analysis on new entries via EmotionService
 *
 * NEVER
 * -------
 * - Store data directly
 * - Format HTTP responses
 *
 * EXPORTS
 * -------
 * create(userId, dto), getAll(userId), update(id, dto), delete(id)
 *
 * DEPENDS ON
 * -------
 * JournalRepository, EmotionService
 */
