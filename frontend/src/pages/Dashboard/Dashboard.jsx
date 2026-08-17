import React, { useState, useEffect, useRef, useCallback } from 'react';
import analyticsService from '../../services/analytics.service.js';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import AppLayout from '../../layouts/AppLayout.jsx';

/* ── Emotion metadata ────────────────────────────────────────────── */
const EMOTION_COLORS = {
  happy: '#22c55e', sad: '#60a5fa', angry: '#ef4444',
  fear: '#a855f7', anxiety: '#f59e0b', neutral: '#94a3b8', surprise: '#ec4899',
};
const EMOTION_EMOJI = {
  happy: '😊', sad: '😢', angry: '😠', fear: '😨', anxiety: '😰', neutral: '😐', surprise: '😲',
};

// V1 emotion order for consistent display
const EMOTION_ORDER = ['happy', 'sad', 'angry', 'fear', 'anxiety', 'neutral', 'surprise'];

/* ── Canvas bar chart (emotion frequency) ───────────────────────── */
// Takes { emotion → count } distribution object
function EmotionBarChart({ distribution }) {
  const ref = useRef(null);

  const entries = EMOTION_ORDER
    .map((e) => ({ emotion: e, count: distribution?.[e] ?? 0 }))
    .filter((e) => e.count > 0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !entries.length) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvas.offsetWidth  * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const PAD = { top: 24, right: 16, bottom: 44, left: 36 };
    const innerW = w - PAD.left - PAD.right;
    const innerH = h - PAD.top  - PAD.bottom;
    const max    = Math.max(...entries.map((e) => e.count), 1);
    const barW   = (innerW / entries.length) * 0.65;
    const gap    = innerW / entries.length;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (innerH / 4) * i;
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(w - PAD.right, y); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter,sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(max - (max / 4) * i), PAD.left - 4, y + 4);
    }

    entries.forEach(({ emotion, count }, i) => {
      const x    = PAD.left + gap * i + (gap - barW) / 2;
      const barH = (count / max) * innerH;
      const y    = PAD.top + innerH - barH;
      const r    = 5;
      const color = EMOTION_COLORS[emotion] || '#6C63FF';

      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fillStyle = color; ctx.fill();

      ctx.fillStyle = '#475569'; ctx.font = 'bold 11px Inter,sans-serif'; ctx.textAlign = 'center';
      if (count > 0) ctx.fillText(count, x + barW / 2, y - 5);

      ctx.fillStyle = '#64748b'; ctx.font = '11px Inter,sans-serif';
      // Emoji + truncated label
      const lbl = `${EMOTION_EMOJI[emotion] || ''} ${emotion}`;
      ctx.fillText(lbl.length > 9 ? lbl.slice(0, 8) + '…' : lbl, x + barW / 2, PAD.top + innerH + 18);
    });
  }, [entries]);

  if (!entries.length) {
    return <EmptyState icon="📊" title="No data yet" description="Record journal entries to see emotion frequency." />;
  }
  return <canvas ref={ref} style={{ width: '100%', height: 220, display: 'block' }} />;
}

/* ── Categorical mood timeline ───────────────────────────────────── */
// moodTrend is [{ date: 'YYYY-MM-DD', emotion: string }]
// We plot emotion as colour-coded dots on a timeline
function MoodTimeline({ points }) {
  if (!points?.length) {
    return <EmptyState icon="📈" title="No trend data yet" description="Journal more entries to see your mood trend." />;
  }

  const visible = points.slice(-30); // show latest 30

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', minWidth: visible.length * 32, paddingTop: '0.5rem' }}>
        {visible.map((pt, i) => {
          const color = EMOTION_COLORS[pt.emotion] || '#94a3b8';
          const label = new Date(pt.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: '0 0 auto', width: 28 }} title={`${label}: ${pt.emotion}`}>
              <span style={{ fontSize: '0.9rem' }}>{EMOTION_EMOJI[pt.emotion] || '🔵'}</span>
              <div style={{ width: 20, height: 6, borderRadius: 3, background: color, opacity: 0.85 }} />
              {i % 5 === 0 && (
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', whiteSpace: 'nowrap', transform: 'rotate(-30deg)', marginTop: 2 }}>
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.5rem' }}>
        {EMOTION_ORDER.filter((e) => points.some((p) => p.emotion === e)).map((e) => (
          <span key={e} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', background: (EMOTION_COLORS[e] || '#94a3b8') + '18', color: EMOTION_COLORS[e] || '#94a3b8', border: `1px solid ${(EMOTION_COLORS[e] || '#94a3b8')}33` }}>
            {EMOTION_EMOJI[e]} {e}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Reusable stat card ──────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', flex: '1 1 130px', minWidth: 0 }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</p>
      <p style={{ fontSize: '1.65rem', fontWeight: 700, color: accent || 'var(--color-primary)', lineHeight: 1, marginBottom: sub ? '0.25rem' : 0 }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{sub}</p>}
    </div>
  );
}

/* ── Emotion frequency pill list from distribution map ──────────── */
function EmotionFreqList({ frequencyMap }) {
  const entries = EMOTION_ORDER
    .map((e) => ({ emotion: e, count: frequencyMap?.[e] ?? 0 }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);

  if (!entries.length) return <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No data this period.</p>;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
      {entries.map(({ emotion, count }) => (
        <span key={emotion} style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: (EMOTION_COLORS[emotion] || '#94a3b8') + '20', color: EMOTION_COLORS[emotion] || '#94a3b8', border: `1px solid ${(EMOTION_COLORS[emotion] || '#94a3b8')}33` }}>
          {EMOTION_EMOJI[emotion]} {emotion}: {count}
        </span>
      ))}
    </div>
  );
}

function Section({ title, children, style }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', ...style }}>
      <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--color-text)' }}>{title}</h3>
      {children}
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────── */
export default function Dashboard() {
  const [overview,  setOverview]  = useState(null);
  const [moodTrend, setMoodTrend] = useState([]);
  const [emotions,  setEmotions]  = useState({});
  const [weekly,    setWeekly]    = useState(null);
  const [monthly,   setMonthly]   = useState(null);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ov, mt, em, wk, mo, hist] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getMoodTrend(),
        analyticsService.getEmotionFrequency(),
        analyticsService.getWeeklySummary(),
        analyticsService.getMonthlySummary(),
        analyticsService.getJournalHistory({ page: 1, limit: 5 }),
      ]);

      // GET /analytics/overview → success() → { data: { totalEntries, mostFrequentEmotion,
      //   emotionDistribution, moodTrend, weeklySummary, monthlySummary } }
      setOverview(ov.data.data);

      // GET /analytics/mood-trend → success() → { data: { moodTrend: [{ date, emotion }] } }
      setMoodTrend(mt.data.data?.moodTrend || []);

      // GET /analytics/emotions → success() → { data: { emotionDistribution: {}, mostFrequentEmotion } }
      setEmotions(em.data.data?.emotionDistribution || {});

      // GET /analytics/weekly → success() → { data: { period, entryCount, mostFrequentEmotion, emotionFrequency, startDate, endDate } }
      setWeekly(wk.data.data);

      // GET /analytics/monthly → success() → { data: { period, entryCount, mostFrequentEmotion, emotionFrequency, startDate, endDate, month } }
      setMonthly(mo.data.data);

      // GET /analytics/journal-history → paginated() → { data: [], pagination: {} }
      setHistory(Array.isArray(hist.data.data) ? hist.data.data : []);

    } catch {
      setError('Could not load analytics. Make sure you have some journal entries first.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const isEmpty = !loading && !error && (overview?.totalEntries === 0);

  return (
    <AppLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.4rem' }}>📊 Analytics Dashboard</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>Your emotional wellbeing at a glance.</p>
        </div>

        {loading && <Loading text="Loading your analytics…" />}
        {error   && <ErrorMessage message={error} onRetry={loadAll} />}

        {isEmpty && !loading && !error && (
          <EmptyState icon="📊" title="No journal data yet" description="Record some journal entries to see your emotional trends and insights here." />
        )}

        {!loading && !error && !isEmpty && overview && (
          <>
            {/* ── Overview ── */}
            <Section title="Overview" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <StatCard label="Total Entries" value={overview.totalEntries} />
                <StatCard
                  label="Most Frequent Emotion"
                  value={overview.mostFrequentEmotion
                    ? `${EMOTION_EMOJI[overview.mostFrequentEmotion] || ''} ${overview.mostFrequentEmotion}`
                    : '—'}
                  accent="var(--color-text)"
                />
                {/* Use actual backend field names: weeklySummary.entryCount and monthlySummary.entryCount */}
                <StatCard label="This Week"  value={overview.weeklySummary?.entryCount  ?? '—'} sub="entries" />
                <StatCard label="This Month" value={overview.monthlySummary?.entryCount ?? '—'} sub="entries" />
              </div>
            </Section>

            {/* ── Mood Trend (categorical, not numeric) ── */}
            <Section title="Mood Trend" style={{ marginBottom: '1.25rem' }}>
              <MoodTimeline points={moodTrend} />
            </Section>

            {/* ── Emotion Frequency + Weekly ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <Section title="Emotion Frequency">
                <EmotionBarChart distribution={emotions} />
              </Section>

              {weekly && (
                <Section title="This Week">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {/* Backend field: entryCount (not count) */}
                    <StatCard label="Journal Entries" value={weekly.entryCount ?? '—'} />
                    {weekly.mostFrequentEmotion && (
                      <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>DOMINANT EMOTION</p>
                        <p style={{ fontSize: '1rem', fontWeight: 600, color: EMOTION_COLORS[weekly.mostFrequentEmotion] || 'var(--color-text)' }}>
                          {EMOTION_EMOJI[weekly.mostFrequentEmotion]} {weekly.mostFrequentEmotion}
                        </p>
                      </div>
                    )}
                    {/* Backend field: emotionFrequency (object map, not array) */}
                    {weekly.emotionFrequency && <EmotionFreqList frequencyMap={weekly.emotionFrequency} />}
                  </div>
                </Section>
              )}
            </div>

            {/* ── Monthly Summary ── */}
            {monthly && (
              <Section title="Monthly Summary" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {/* Backend field: entryCount (not count or totalEntries) */}
                  <StatCard label="Entries This Month" value={monthly.entryCount ?? '—'} />
                  {monthly.mostFrequentEmotion && (
                    <StatCard
                      label="Dominant Emotion"
                      value={`${EMOTION_EMOJI[monthly.mostFrequentEmotion] || ''} ${monthly.mostFrequentEmotion}`}
                      accent="var(--color-text)"
                    />
                  )}
                  {monthly.month && (
                    <StatCard label="Month" value={monthly.month} accent="var(--color-text)" />
                  )}
                </div>
                {monthly.emotionFrequency && <EmotionFreqList frequencyMap={monthly.emotionFrequency} />}
              </Section>
            )}

            {/* ── Journal History ── */}
            <Section title="Recent Journal Entries">
              {history.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No entries found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {history.map((entry) => (
                    <div key={entry._id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.85rem 1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)' }}>
                      <span style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>{EMOTION_EMOJI[entry.emotion] || '🔵'}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: EMOTION_COLORS[entry.emotion] || 'var(--color-text)' }}>{entry.emotion}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                            {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {entry.reflection}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
