import React, { useState, useEffect, useCallback } from 'react';
import journalService from '../../services/journal.service.js';
import Loading      from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState   from '../../components/common/EmptyState.jsx';
import AppLayout    from '../../layouts/AppLayout.jsx';
import './Journal.css';

const EMOTIONS = ['happy', 'sad', 'angry', 'fear', 'anxiety', 'neutral', 'surprise'];

// Colors keyed by runtime emotion label — cannot be static CSS
const EMOTION_META = {
  happy:    { emoji: '😊', color: '#22c55e' },
  sad:      { emoji: '😢', color: '#60a5fa' },
  angry:    { emoji: '😠', color: '#ef4444' },
  fear:     { emoji: '😨', color: '#a855f7' },
  anxiety:  { emoji: '😰', color: '#f59e0b' },
  neutral:  { emoji: '😐', color: '#94a3b8' },
  surprise: { emoji: '😲', color: '#ec4899' },
};

function EmotionPill({ emotion }) {
  const meta = EMOTION_META[emotion] || { emoji: '🔵', color: '#94a3b8' };
  return (
    <span
      className="emotion-pill"
      style={{
        background: meta.color + '18',
        color:      meta.color,
        border:     `1px solid ${meta.color}33`,
      }}
    >
      {meta.emoji} {emotion}
    </span>
  );
}

function EntryCard({ entry, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Delete this journal entry?')) return;
    setDeleting(true);
    try { await onDelete(entry._id); }
    finally { setDeleting(false); }
  };

  return (
    <div className="entry-card">
      <div className="entry-card-top">
        <div className="entry-card-meta">
          <EmotionPill emotion={entry.emotion} />
          <span className="entry-card-date">
            {new Date(entry.createdAt).toLocaleDateString('en-US', {
              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            })}
            {' '}at{' '}
            {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="entry-card-actions">
          <button onClick={() => onEdit(entry)} className="entry-edit-btn">✏️ Edit</button>
          <button onClick={handleDelete} disabled={deleting} className="entry-delete-btn">
            {deleting ? '…' : '🗑️ Delete'}
          </button>
        </div>
      </div>

      <div>
        <p className="entry-section-label">Reflection</p>
        <p className="entry-reflection">{entry.reflection}</p>
      </div>

      {entry.notes && (
        <div className="entry-notes-block">
          <p className="entry-section-label">Notes</p>
          <p className="entry-notes-text">{entry.notes}</p>
        </div>
      )}
    </div>
  );
}

function JournalForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    emotion:    initial?.emotion    || '',
    reflection: initial?.reflection || '',
    notes:      initial?.notes      || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.emotion) e.emotion = 'Please select an emotion.';
    if (!form.reflection.trim()) e.reflection = 'Reflection is required.';
    if (form.reflection.length > 2000) e.reflection = 'Reflection must be under 2000 characters.';
    if (form.notes.length > 1000) e.notes = 'Notes must be under 1000 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const field = (label, name, type = 'input', extra = {}) => (
    <div className="jform-field">
      <label htmlFor={name} className="jform-label">{label}</label>
      {type === 'select' ? (
        <select
          id={name}
          value={form[name]}
          onChange={(e) => { setForm((p) => ({ ...p, [name]: e.target.value })); setErrors((p) => ({ ...p, [name]: '' })); }}
          className="jform-select"
          style={{ border: `1px solid ${errors[name] ? 'var(--color-error)' : 'var(--color-border)'}` }}
        >
          <option value="">Select emotion…</option>
          {EMOTIONS.map((em) => (
            <option key={em} value={em}>{EMOTION_META[em]?.emoji} {em}</option>
          ))}
        </select>
      ) : (
        <textarea
          id={name}
          value={form[name]}
          onChange={(e) => { setForm((p) => ({ ...p, [name]: e.target.value })); setErrors((p) => ({ ...p, [name]: '' })); }}
          rows={extra.rows || 4}
          placeholder={extra.placeholder || ''}
          className="jform-textarea"
          style={{ border: `1px solid ${errors[name] ? 'var(--color-error)' : 'var(--color-border)'}` }}
        />
      )}
      {errors[name] && <span className="jform-error-msg">{errors[name]}</span>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="jform-root">
      {field('Emotion *', 'emotion', 'select')}
      {field('Reflection *', 'reflection', 'textarea', { placeholder: "How are you feeling? What's on your mind?", rows: 5 })}
      {field('Notes', 'notes', 'textarea', { placeholder: 'Any additional thoughts… (optional)', rows: 3 })}
      <div className="jform-actions">
        {onCancel && (
          <button type="button" onClick={onCancel} className="jform-cancel-btn">Cancel</button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="jform-submit-btn"
          style={{ cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Saving…' : (initial ? 'Update Entry' : 'Save Journal Entry')}
        </button>
      </div>
    </form>
  );
}

export default function Journal() {
  const [entries,    setEntries]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm,   setShowForm]   = useState(false);
  const [editEntry,  setEditEntry]  = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');

  const loadEntries = useCallback(async (pg = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await journalService.listEntries({ page: pg, limit: 10 });
      setEntries(Array.isArray(data.data) ? data.data : []);
      const pagination = data.pagination || {};
      setTotalPages(pagination.totalPages || 1);
      setPage(pg);
    } catch {
      setError('Could not load journal entries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(1); }, [loadEntries]);

  const handleSave = async (form) => {
    setSaving(true);
    setFormError('');
    try {
      if (editEntry) {
        await journalService.updateEntry(editEntry._id, form);
      } else {
        await journalService.createEntry(form);
      }
      setShowForm(false);
      setEditEntry(null);
      loadEntries(editEntry ? page : 1);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save journal entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditEntry(entry);
    setShowForm(true);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    await journalService.deleteEntry(id);
    loadEntries(page);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditEntry(null);
    setFormError('');
  };

  return (
    <AppLayout>
      <div className="journal-page">
        {/* Header */}
        <div className="journal-header">
          <div className="journal-header-text">
            <h2 className="journal-title">📓 Mood Journal</h2>
            <p className="journal-subtitle">Track your emotions and reflections over time.</p>
          </div>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setEditEntry(null); setFormError(''); }}
              className="journal-new-btn"
            >
              + New Entry
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="journal-form-card">
            <h3 className="journal-form-title">{editEntry ? 'Edit Entry' : 'New Journal Entry'}</h3>
            {formError && <div className="journal-form-error"><ErrorMessage message={formError} /></div>}
            <JournalForm initial={editEntry} onSave={handleSave} onCancel={handleCancel} saving={saving} />
          </div>
        )}

        {/* Entries list */}
        {loading && <Loading text="Loading journal…" />}
        {error   && <ErrorMessage message={error} onRetry={() => loadEntries(page)} />}

        {!loading && !error && entries.length === 0 && (
          <EmptyState
            icon="📓"
            title="No journal entries yet"
            description="Record your first mood to start tracking your emotional journey."
            action={!showForm && (
              <button
                onClick={() => { setShowForm(true); setEditEntry(null); }}
                className="journal-empty-btn"
              >
                Record your first mood
              </button>
            )}
          />
        )}

        <div className="journal-list">
          {entries.map((entry) => (
            <EntryCard key={entry._id} entry={entry} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="journal-pagination">
            <button
              onClick={() => loadEntries(page - 1)}
              disabled={page === 1}
              className="journal-pagination-btn"
              style={{ cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
            >
              ← Prev
            </button>
            <span className="journal-pagination-info">Page {page} of {totalPages}</span>
            <button
              onClick={() => loadEntries(page + 1)}
              disabled={page === totalPages}
              className="journal-pagination-btn"
              style={{ cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
