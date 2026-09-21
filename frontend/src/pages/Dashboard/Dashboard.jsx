import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChartJS from 'chart.js/auto';

import analyticsService from '../../services/analytics.service.js';
import Loading   from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import EmptyState   from '../../components/common/EmptyState.jsx';
import AppLayout    from '../../layouts/AppLayout.jsx';
import './Dashboard.css';

/* ── Emotion metadata ────────────────────────────────────────────── */
// Colors are runtime data keyed by emotion label — cannot be static CSS
const EMOTION_COLORS = {
  happy: '#22c55e', sad: '#60a5fa', angry: '#ef4444',
  fear: '#a855f7', anxiety: '#f59e0b', neutral: '#94a3b8', surprise: '#ec4899',
};
const EMOTION_EMOJI = {
  happy: '😊', sad: '😢', angry: '😠', fear: '😨', anxiety: '😰', neutral: '😐', surprise: '😲',
};
const EMOTION_ORDER = ['happy', 'sad', 'angry', 'fear', 'anxiety', 'neutral', 'surprise'];

/* ── Chart.js bar chart ──────────────────────────────────────────── */
function EmotionBarChart({ distribution }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const entries = EMOTION_ORDER
    .map((e) => ({ emotion: e, count: distribution?.[e] ?? 0 }))
    .filter((e) => e.count > 0);

  useEffect(() => {
    if (!canvasRef.current || !entries.length) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    const labels = entries.map((e) => `${EMOTION_EMOJI[e.emotion] || ''} ${e.emotion}`);
    const data   = entries.map((e) => e.count);
    const colors = entries.map((e) => EMOTION_COLORS[e.emotion] || '#6C63FF');

    chartRef.current = new ChartJS(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Frequency',
          data,
          backgroundColor: colors.map((c) => c + 'cc'),
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} entries` } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
          y: { beginAtZero: true, grid: { color: '#e2e8f0' }, ticks: { color: '#64748b', font: { size: 11 }, stepSize: 1, precision: 0 } },
        },
      },
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [JSON.stringify(entries)]);

  if (!entries.length) {
    return <EmptyState icon="📊" title="No data yet" description="Record journal entries to see emotion frequency." />;
  }
  return (
    <div className="dash-chart-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}

/* ── Mood timeline ───────────────────────────────────────────────── */
function MoodTimeline({ points }) {
  if (!points?.length) {
    return <EmptyState icon="📈" title="No trend data yet" description="Journal more entries to see your mood trend." />;
  }
  const visible = points.slice(-30);

  return (
    <div className="dash-timeline-scroll">
      <div
        className="dash-timeline-track"
        style={{ minWidth: visible.length * 32 }}
      >
        {visible.map((pt, i) => {
          const color = EMOTION_COLORS[pt.emotion] || '#94a3b8';
          const label = new Date(pt.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <div key={i} className="dash-timeline-point" title={`${label}: ${pt.emotion}`}>
              <span className="dash-timeline-icon">{EMOTION_EMOJI[pt.emotion] || '🔵'}</span>
              <div className="dash-timeline-bar" style={{ background: color }} />
              {i % 5 === 0 && (
                <span className="dash-timeline-date">{label}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="dash-timeline-legend">
        {EMOTION_ORDER.filter((e) => points.some((p) => p.emotion === e)).map((e) => (
          <span
            key={e}
            className="dash-emotion-pill"
            style={{
              background: (EMOTION_COLORS[e] || '#94a3b8') + '18',
              color:      EMOTION_COLORS[e] || '#94a3b8',
              border:     `1px solid ${(EMOTION_COLORS[e] || '#94a3b8')}33`,
            }}
          >
            {EMOTION_EMOJI[e]} {e}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="dash-stat-card">
      <p className="dash-stat-label">{label}</p>
      <p className="dash-stat-value" style={{ color: accent || 'var(--color-primary)' }}>
        {value ?? '—'}
      </p>
      {sub && <p className="dash-stat-sub">{sub}</p>}
    </div>
  );
}

/* ── Emotion frequency pill list ─────────────────────────────────── */
function EmotionFreqList({ frequencyMap }) {
  const entries = EMOTION_ORDER
    .map((e) => ({ emotion: e, count: frequencyMap?.[e] ?? 0 }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);

  if (!entries.length) return <p className="dash-freq-empty">No data this period.</p>;

  return (
    <div className="dash-timeline-legend">
      {entries.map(({ emotion, count }) => (
        <span
          key={emotion}
          className="dash-freq-pill"
          style={{
            background: (EMOTION_COLORS[emotion] || '#94a3b8') + '20',
            color:      EMOTION_COLORS[emotion] || '#94a3b8',
            border:     `1px solid ${(EMOTION_COLORS[emotion] || '#94a3b8')}33`,
          }}
        >
          {EMOTION_EMOJI[emotion]} {emotion}: {count}
        </span>
      ))}
    </div>
  );
}

/* ── Section card ────────────────────────────────────────────────── */
function Section({ title, children, className = '' }) {
  return (
    <div className={`dash-section ${className}`}>
      <h3 className="dash-section-title">{title}</h3>
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
      setOverview(ov.data.data);
      setMoodTrend(mt.data.data?.moodTrend || []);
      setEmotions(em.data.data?.emotionDistribution || {});
      setWeekly(wk.data.data);
      setMonthly(mo.data.data);
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
      <div className="dash-page">
        <div className="dash-header">
          <h2 className="dash-title">📊 Analytics Dashboard</h2>
          <p className="dash-subtitle">Your emotional wellbeing at a glance.</p>
        </div>

        {loading && <Loading text="Loading your analytics…" />}
        {error   && <ErrorMessage message={error} onRetry={loadAll} />}

        {isEmpty && !loading && !error && (
          <EmptyState icon="📊" title="No journal data yet" description="Record some journal entries to see your emotional trends and insights here." />
        )}

        {!loading && !error && !isEmpty && overview && (
          <>
            <Section title="Overview" className="dash-mb">
              <div className="dash-stats-row">
                <StatCard label="Total Entries" value={overview.totalEntries} />
                <StatCard
                  label="Most Frequent Emotion"
                  value={overview.mostFrequentEmotion
                    ? `${EMOTION_EMOJI[overview.mostFrequentEmotion] || ''} ${overview.mostFrequentEmotion}`
                    : '—'}
                  accent="var(--color-text)"
                />
                <StatCard label="This Week"  value={overview.weeklySummary?.entryCount  ?? '—'} sub="entries" />
                <StatCard label="This Month" value={overview.monthlySummary?.entryCount ?? '—'} sub="entries" />
              </div>
            </Section>

            <Section title="Mood Trend" className="dash-mb">
              <MoodTimeline points={moodTrend} />
            </Section>

            <div className="dash-grid-2 dash-mb">
              <Section title="Emotion Frequency">
                <EmotionBarChart distribution={emotions} />
              </Section>

              {weekly && (
                <Section title="This Week">
                  <div className="dash-weekly-stack">
                    <StatCard label="Journal Entries" value={weekly.entryCount ?? '—'} />
                    {weekly.mostFrequentEmotion && (
                      <div className="dash-dominant">
                        <p className="dash-dominant-label">DOMINANT EMOTION</p>
                        <p
                          className="dash-dominant-value"
                          style={{ color: EMOTION_COLORS[weekly.mostFrequentEmotion] || 'var(--color-text)' }}
                        >
                          {EMOTION_EMOJI[weekly.mostFrequentEmotion]} {weekly.mostFrequentEmotion}
                        </p>
                      </div>
                    )}
                    {weekly.emotionFrequency && <EmotionFreqList frequencyMap={weekly.emotionFrequency} />}
                  </div>
                </Section>
              )}
            </div>

            {monthly && (
              <Section title="Monthly Summary" className="dash-mb">
                <div className="dash-stats-row" style={{ marginBottom: '1rem' }}>
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

            <Section title="Recent Journal Entries">
              {history.length === 0 ? (
                <p className="dash-history-empty">No entries found.</p>
              ) : (
                <div className="dash-history-list">
                  {history.map((entry) => (
                    <div key={entry._id} className="dash-history-item">
                      <span className="dash-history-icon">{EMOTION_EMOJI[entry.emotion] || '🔵'}</span>
                      <div className="dash-history-body">
                        <div className="dash-history-meta">
                          <span
                            className="dash-history-emotion"
                            style={{ color: EMOTION_COLORS[entry.emotion] || 'var(--color-text)' }}
                          >
                            {entry.emotion}
                          </span>
                          <span className="dash-history-date">
                            {new Date(entry.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="dash-history-reflection">{entry.reflection}</p>
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
