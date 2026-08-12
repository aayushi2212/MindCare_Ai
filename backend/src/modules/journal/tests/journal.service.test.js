/**
 * PURPOSE
 * -------
 * Unit tests for JournalService — business logic, ownership enforcement,
 * pagination, and error handling.
 *
 * Strategy: mock journalRepository, assert service behaviour.
 *
 * DEPENDS ON
 * ----------
 * jest (@jest/globals), journal.service, journal.repository (mocked), journal.errors
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../repositories/journal.repository.js', () => ({
  default: {
    create:     jest.fn(),
    findByUserId: jest.fn(),
    findById:   jest.fn(),
    update:     jest.fn(),
    deleteById: jest.fn(),
  },
}));

const { default: journalService }    = await import('../services/journal.service.js');
const { default: journalRepository } = await import('../repositories/journal.repository.js');
const {
  JournalEntryNotFoundError,
} = await import('../errors/journal.errors.js');
const { default: JOURNAL } = await import('../constants/journal.constants.js');

// ── Fixtures ───────────────────────────────────────────────────────

const USER_A  = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const USER_B  = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const ENTRY_ID = 'cccccccccccccccccccccccc';

const makeEntry = (overrides = {}) => ({
  _id:        ENTRY_ID,
  userId:     USER_A,
  emotion:    'anxiety',
  reflection: 'I felt nervous today.',
  notes:      'Talk to a friend.',
  createdAt:  new Date(),
  updatedAt:  new Date(),
  ...overrides,
});

// ── createEntry ────────────────────────────────────────────────────

describe('JournalService — createEntry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates an entry with userId from argument, not from dto', async () => {
    const entry = makeEntry();
    journalRepository.create.mockResolvedValue(entry);

    const result = await journalService.createEntry(USER_A, {
      emotion:    'anxiety',
      reflection: 'I felt nervous today.',
      notes:      'Talk to a friend.',
    });

    expect(journalRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_A, emotion: 'anxiety' })
    );
    expect(result.userId).toBe(USER_A);
  });

  it('creates an entry without notes (notes defaults to null)', async () => {
    const entry = makeEntry({ notes: null });
    journalRepository.create.mockResolvedValue(entry);

    await journalService.createEntry(USER_A, {
      emotion:    'happy',
      reflection: 'Good day!',
    });

    expect(journalRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ notes: null })
    );
  });
});

// ── listEntries ────────────────────────────────────────────────────

describe('JournalService — listEntries', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated entries with metadata', async () => {
    const entries = [makeEntry(), makeEntry({ _id: 'dddddddddddddddddddddddd' })];
    journalRepository.findByUserId.mockResolvedValue({ docs: entries, total: 2 });

    const result = await journalService.listEntries(USER_A, { page: 1, limit: 20 });

    expect(result.entries).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('caps limit at MAX_PAGE_SIZE', async () => {
    journalRepository.findByUserId.mockResolvedValue({ docs: [], total: 0 });

    await journalService.listEntries(USER_A, { limit: 99999 });

    expect(journalRepository.findByUserId).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ limit: JOURNAL.MAX_PAGE_SIZE })
    );
  });

  it('uses default page and limit when not provided', async () => {
    journalRepository.findByUserId.mockResolvedValue({ docs: [], total: 0 });

    await journalService.listEntries(USER_A, {});

    expect(journalRepository.findByUserId).toHaveBeenCalledWith(
      USER_A,
      expect.objectContaining({ page: JOURNAL.DEFAULT_PAGE, limit: JOURNAL.DEFAULT_PAGE_SIZE })
    );
  });
});

// ── getEntry ───────────────────────────────────────────────────────

describe('JournalService — getEntry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns entry for the owner', async () => {
    journalRepository.findById.mockResolvedValue(makeEntry());

    const result = await journalService.getEntry(USER_A, ENTRY_ID);

    expect(result._id).toBe(ENTRY_ID);
  });

  it('throws JournalEntryNotFoundError when entry does not exist', async () => {
    journalRepository.findById.mockResolvedValue(null);

    await expect(journalService.getEntry(USER_A, ENTRY_ID))
      .rejects.toThrow(JournalEntryNotFoundError);
  });

  it('throws JournalEntryNotFoundError (not access denied) when userId does not match — no disclosure', async () => {
    journalRepository.findById.mockResolvedValue(makeEntry()); // owned by USER_A

    // USER_B tries to access USER_A's entry — should get 404, not 403
    await expect(journalService.getEntry(USER_B, ENTRY_ID))
      .rejects.toThrow(JournalEntryNotFoundError);
  });
});

// ── updateEntry ────────────────────────────────────────────────────

describe('JournalService — updateEntry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates allowed fields for the owner', async () => {
    const updated = makeEntry({ emotion: 'happy', reflection: 'Better day.' });
    journalRepository.findById.mockResolvedValue(makeEntry());
    journalRepository.update.mockResolvedValue(updated);

    const result = await journalService.updateEntry(USER_A, ENTRY_ID, {
      emotion:    'happy',
      reflection: 'Better day.',
    });

    expect(journalRepository.update).toHaveBeenCalledWith(
      ENTRY_ID,
      expect.objectContaining({ emotion: 'happy', reflection: 'Better day.' })
    );
    expect(result.emotion).toBe('happy');
  });

  it('throws JournalEntryNotFoundError when entry does not exist', async () => {
    journalRepository.findById.mockResolvedValue(null);

    await expect(journalService.updateEntry(USER_A, ENTRY_ID, { emotion: 'sad' }))
      .rejects.toThrow(JournalEntryNotFoundError);
  });

  it('throws JournalEntryNotFoundError for non-owner (no disclosure)', async () => {
    journalRepository.findById.mockResolvedValue(makeEntry()); // owned by USER_A

    await expect(journalService.updateEntry(USER_B, ENTRY_ID, { emotion: 'sad' }))
      .rejects.toThrow(JournalEntryNotFoundError);
  });

  it('does not include userId in the update payload', async () => {
    journalRepository.findById.mockResolvedValue(makeEntry());
    journalRepository.update.mockResolvedValue(makeEntry());

    await journalService.updateEntry(USER_A, ENTRY_ID, {
      emotion: 'sad',
      userId:  USER_B, // must be stripped
    });

    const updateCall = journalRepository.update.mock.calls[0][1];
    expect(updateCall).not.toHaveProperty('userId');
  });
});

// ── deleteEntry ────────────────────────────────────────────────────

describe('JournalService — deleteEntry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes the entry for the owner', async () => {
    journalRepository.findById.mockResolvedValue(makeEntry());
    journalRepository.deleteById.mockResolvedValue(undefined);

    await expect(journalService.deleteEntry(USER_A, ENTRY_ID)).resolves.not.toThrow();
    expect(journalRepository.deleteById).toHaveBeenCalledWith(ENTRY_ID);
  });

  it('throws JournalEntryNotFoundError when entry does not exist', async () => {
    journalRepository.findById.mockResolvedValue(null);

    await expect(journalService.deleteEntry(USER_A, ENTRY_ID))
      .rejects.toThrow(JournalEntryNotFoundError);
  });

  it('throws JournalEntryNotFoundError for non-owner (no disclosure)', async () => {
    journalRepository.findById.mockResolvedValue(makeEntry()); // owned by USER_A

    await expect(journalService.deleteEntry(USER_B, ENTRY_ID))
      .rejects.toThrow(JournalEntryNotFoundError);
  });
});

// ── Ownership edge cases ───────────────────────────────────────────

describe('JournalService — ownership enforcement across all mutating operations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('all read/mutate methods refuse access for a non-owner', async () => {
    journalRepository.findById.mockResolvedValue(makeEntry()); // owned by USER_A

    const cases = [
      () => journalService.getEntry(USER_B, ENTRY_ID),
      () => journalService.updateEntry(USER_B, ENTRY_ID, { emotion: 'sad' }),
      () => journalService.deleteEntry(USER_B, ENTRY_ID),
    ];

    for (const fn of cases) {
      await expect(fn()).rejects.toThrow(JournalEntryNotFoundError);
    }
  });
});
