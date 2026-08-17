import React, { useState, useEffect, useCallback } from 'react';
import journalService from '../../services/journal.service.js';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import AppLayout from '../../layouts/AppLayout.jsx';

const EMOTIONS = ['happy', 'sad', 'angry', 'fear', 'anxiety', 'neutral', 'surprise'];

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
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)',
      fontSize: '0.78rem', fontWeight: 600,
      background: meta.color + '18', color: meta.color,
      border: `1px solid ${meta.color}33`,
    }}>
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
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <EmotionPill emotion={entry.emotion} />
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {new Date(entry.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            {' '}at{' '}
            {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => onEdit(entry)} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--color-text)' }}>✏️ Edit</button>
          <button onClick={handleDelete} disabled={deleting} style={{ background: 'var(--color-error-light)', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--color-error)' }}>
            {deleting ? '…' : '🗑️ Delete'}
          </button>
        </div>
      </div>

      <div>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>Reflection</p>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>{entry.reflection}</p>
      </div>

      {entry.notes && (
        <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.9rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Notes</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap' }}>{entry.notes}</p>
        </div>
      )}
    </div>
  );
}

function JournalForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    emotion: initial?.emotion || '',
    reflection: initial?.reflection || '',
    notes: initial?.notes || '',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label htmlFor={name} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>{label}</label>
      {type === 'select' ? (
        <select
          id={name}
          value={form[name]}
          onChange={(e) => { setForm((p) => ({ ...p, [name]: e.target.value })); setErrors((p) => ({ ...p, [name]: '' })); }}
          style={{ padding: '0.65rem 0.75rem', border: `1px solid ${errors[name] ? 'var(--color-error)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', fontSize: '0.9rem', background: 'var(--color-bg)' }}
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
          style={{ padding: '0.65rem 0.75rem', border: `1px solid ${errors[name] ? 'var(--color-error)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
        />
      )}
      {errors[name] && <span style={{ color: 'var(--color-error)', fontSize: '0.78rem' }}>{errors[name]}</span>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {field('Emotion *', 'emotion', 'select')}
      {field('Reflection *', 'reflection', 'textarea', { placeholder: 'How are you feeling? What\'s on your mind?', rows: 5 })}
      {field('Notes', 'notes', 'textarea', { placeholder: 'Any additional thoughts… (optional)', rows: 3 })}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ padding: '0.65rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
        )}
        <button type="submit" disabled={saving} style={{ padding: '0.65rem 1.5rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving…' : (initial ? 'Update Entry' : 'Save Journal Entry')}
        </button>
      </div>
    </form>
  );
}

export default function Journal() {
  const [entries, setEntries]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [showForm, setShowForm]       = useState(false);
  const [editEntry, setEditEntry]     = useState(null);
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState('');

  const loadEntries = useCallback(async (pg = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await journalService.listEntries({ page: pg, limit: 10 });
      // paginated() returns: { data: [], pagination: {} } at top level
      // axios wraps in data: { success, message, data: [], pagination: {} }
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
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.4rem' }}>📓 Mood Journal</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>Track your emotions and reflections over time.</p>
          </div>
          {!showForm && (
            <button onClick={() => { setShowForm(true); setEditEntry(null); setFormError(''); }} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.65rem 1.25rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
              + New Entry
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>{editEntry ? 'Edit Entry' : 'New Journal Entry'}</h3>
            {formError && <div style={{ marginBottom: '1rem' }}><ErrorMessage message={formError} /></div>}
            <JournalForm initial={editEntry} onSave={handleSave} onCancel={handleCancel} saving={saving} />
          </div>
        )}

        {/* Entries list */}
        {loading && <Loading text="Loading journal…" />}
        {error && <ErrorMessage message={error} onRetry={() => loadEntries(page)} />}

        {!loading && !error && entries.length === 0 && (
          <EmptyState
            icon="📓"
            title="No journal entries yet"
            description="Record your first mood to start tracking your emotional journey."
            action={!showForm && (
              <button onClick={() => { setShowForm(true); setEditEntry(null); }} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.65rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}>
                Record your first mood
              </button>
            )}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {entries.map((entry) => (
            <EntryCard key={entry._id} entry={entry} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
            <button onClick={() => loadEntries(page - 1)} disabled={page === 1} style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>← Prev</button>
            <span style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Page {page} of {totalPages}</span>
            <button onClick={() => loadEntries(page + 1)} disabled={page === totalPages} style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>Next →</button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
