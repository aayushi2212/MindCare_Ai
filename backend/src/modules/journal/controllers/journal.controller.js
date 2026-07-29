/**
 * PURPOSE
 * -------
 * HTTP layer for journal operations.
 *
 * RESPONSIBILITIES
 * -------
 * - Parse requests, delegate to JournalService, return responses
 *
 * NEVER
 * -------
 * - Analyse journal content directly
 *
 * EXPORTS
 * -------
 * createEntry, getEntries, getEntryById, updateEntry, deleteEntry
 *
 * DEPENDS ON
 * -------
 * JournalService, shared/response
 */
