import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import DashboardLayout from '../../../layouts/DashboardLayout';
import {
  getModelDashboard, getUsageTrend, getCostTrend,
  getPerformanceTrend, getErrorTrend, getModelHealth,
  getModelAlerts, getModelRecommendations,
} from '../../../services/analyticsService';
import { getAiModel } from '../../../services/aiModelService';
import { tokenStorage } from '../../../services/authService';

function detectRole() {
  try {
    const token = tokenStorage.getAccess();
    if (!token) return 'admin';
    const payload = JSON.parse(atob(token.split('.')[1]));
    const roles = payload.roles || payload.role || [];
    if (Array.isArray(roles) ? roles.includes('ROLE_IAM') : roles === 'ROLE_IAM') return 'iam';
  } catch (_) {}
  return window.location.pathname.startsWith('/iam') ? 'iam' : 'admin';
}

function getStoredUser() {
  const email = tokenStorage.getEmail() || '';
  const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'User';
  return { name, email };
}

const CHART_COLORS = ['#6366f1', '#22d3ee', '#4ade80', '#fbbf24', '#f87171'];
const HEALTH_COLOR = { HEALTHY: '#4ade80', DEGRADED: '#fbbf24', UNHEALTHY: '#f87171', OFFLINE: '#ef4444', UNKNOWN: '#6b7280' };
const SEVERITY_COLOR = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#fbbf24', LOW: '#6b7280' };

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt    = (v, d = 1) => v == null ? '—' : Number(v).toFixed(d);
const fmtMs  = (v) => v == null || v === 0 ? '—' : v >= 1000 ? `${(v/1000).toFixed(1)}s` : `${Math.round(v)}ms`;
const fmtPct = (v) => v == null ? '—' : `${fmt(v)}%`;
const fmtCost = (v, d = 2) => v == null ? '—' : `$${Number(v).toFixed(d)}`;

// ── UI primitives ─────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '18px 20px' }}>
      {icon && <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>}
      <div style={{ fontSize: 10.5, color: 'var(--color-textMuted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || 'var(--color-textPrimary)', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-textSecondary)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-textPrimary)', margin: '32px 0 14px', paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>{children}</div>;
}

function ChartCard({ title, children, height = 260, style }) {
  return (
    <div style={{ background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '18px 20px', ...style }}>
      {title && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-textPrimary)', marginBottom: 16 }}>{title}</div>}
      <div style={{ height }}>{children}</div>
    </div>
  );
}

function PeriodSelector({ value, onChange }) {
  const opts = [['DAYS_7','7d'],['DAYS_30','30d'],['DAYS_90','90d'],['DAYS_365','1y']];
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {opts.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-border)', background: value === v ? 'var(--color-accent)' : 'var(--color-bgMuted)', color: value === v ? '#fff' : 'var(--color-textSecondary)', fontSize: 12, cursor: 'pointer', fontWeight: value === v ? 600 : 400 }}>{l}</button>
      ))}
    </div>
  );
}

// Convert backend TrendData.points (List<{date, value}>) to chart-ready array
// Backend field: points[].date (LocalDate serialized as "YYYY-MM-DD"), points[].value
const trendPoints = (trend) => {
  if (!trend?.points?.length) return [];
  return trend.points.map((p) => ({
    date: p.date ? String(p.date).slice(5) : '', // show MM-DD
    value: p.value ?? 0,
  }));
};

const tooltipStyle = { background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 };
const axisStyle = { fontSize: 10, fill: 'var(--color-textMuted)' };

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ModelAnalyticsPage() {
  const { modelId } = useParams();
  const navigate    = useNavigate();
  const role = detectRole();
  const user = getStoredUser();

  const [period, setPeriod]       = useState('DAYS_30');
  const [model, setModel]         = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [usageTrend, setUsageTrend]   = useState(null);
  const [costTrend, setCostTrend]     = useState(null);
  const [perfTrend, setPerfTrend]     = useState(null);
  const [errorTrend, setErrorTrend]   = useState(null);
  const [health, setHealth]       = useState(null);
  const [alerts, setAlerts]       = useState([]);
  const [recs, setRecs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError]         = useState(null);

  const loadBase = useCallback(async () => {
    if (!modelId) return;
    setLoading(true); setError(null);
    try {
      const [m, dash, h, a, r] = await Promise.all([
        getAiModel(modelId),
        getModelDashboard(modelId),
        getModelHealth(modelId),
        getModelAlerts(modelId),
        getModelRecommendations(modelId),
      ]);
      setModel(m); setDashboard(dash); setHealth(h);
      setAlerts(a || []); setRecs(r || []);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [modelId]);

  const loadTrends = useCallback(async () => {
    if (!modelId) return;
    setTrendLoading(true);
    try {
      const [u, c, p, e] = await Promise.all([
        getUsageTrend(modelId, period),
        getCostTrend(modelId, period),
        getPerformanceTrend(modelId, period),
        getErrorTrend(modelId, period),
      ]);
      setUsageTrend(u); setCostTrend(c); setPerfTrend(p); setErrorTrend(e);
    } catch (_) {}
    finally { setTrendLoading(false); }
  }, [modelId, period]);

  useEffect(() => { loadBase(); }, [loadBase]);
  useEffect(() => { loadTrends(); }, [loadTrends]);

  const backPath = role === 'iam' ? '/iam/ai-models' : '/admin/ai-models';

  if (loading) return <DashboardLayout role={role} user={user}><Spinner /></DashboardLayout>;
  if (error)   return (
    <DashboardLayout role={role} user={user}>
      <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: 8, padding: '14px 18px', marginTop: 24 }}>{error}</div>
    </DashboardLayout>
  );

  // ── Extract from dashboard (matches backend ModelDashboard DTO) ──
  // dashboard.usage    → UsageMetrics
  // dashboard.performance → PerformanceMetrics
  // dashboard.quality  → QualityMetrics
  // dashboard.cost     → CostMetrics
  // dashboard.adoption → AdoptionMetrics
  const usage    = dashboard?.usage;
  const perf     = dashboard?.performance;
  const quality  = dashboard?.quality;
  const cost     = dashboard?.cost;
  const adoption = dashboard?.adoption;
  const healthColor = HEALTH_COLOR[health?.status || dashboard?.healthStatus] || '#6b7280';
  const healthLabel = health?.status || dashboard?.healthStatus || 'UNKNOWN';

  // Quality pie: backend has perf.successRate and perf.failureRate
  const successRate = perf?.successRate ?? 0;
  const failureRate = perf?.failureRate ?? 0;
  const qualityPie = [
    { name: 'Success', value: successRate },
    { name: 'Failure', value: failureRate },
  ];

  // Latency perf bar chart — backend: avgResponseTimeMs, p95ResponseTimeMs
  const latencyBars = [
    { name: 'Avg', value: perf?.avgResponseTimeMs ?? 0 },
    { name: 'P95', value: perf?.p95ResponseTimeMs ?? 0 },
    { name: 'Gen Avg', value: perf?.avgReviewGenerationMs ?? 0 },
  ];

  return (
    <DashboardLayout role={role} user={user}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => navigate(backPath)} style={{ background: 'none', border: 'none', color: 'var(--color-textMuted)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Back to AI Models
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-textPrimary)', marginBottom: 4 }}>
              {model?.name || 'Model Analytics'}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--color-textSecondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {model?.provider}{model?.description ? ` · ${model.description}` : ''}
              <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: healthColor + '22', color: healthColor }}>
                {healthLabel}
              </span>
              {dashboard?.defaultModel && (
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>DEFAULT</span>
              )}
            </div>
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
        {/* Usage */}
        <StatCard label="Total Reviews"    value={usage?.totalReviews?.toLocaleString() ?? '—'} icon="📋" />
        <StatCard label="Reviews Today"    value={usage?.reviewsToday?.toLocaleString() ?? '—'} icon="📅" />
        <StatCard label="Reviews This Wk" value={usage?.reviewsThisWeek?.toLocaleString() ?? '—'} icon="📆" />
        {/* Performance */}
        <StatCard label="Success Rate"     value={fmtPct(perf?.successRate)}   color={perf?.successRate >= 95 ? '#4ade80' : perf?.successRate >= 80 ? '#fbbf24' : '#f87171'} icon="✅" />
        <StatCard label="Failure Rate"     value={fmtPct(perf?.failureRate)}   color={perf?.failureRate > 10 ? '#f87171' : '#4ade80'} icon="⚠️" />
        <StatCard label="Avg Latency"      value={fmtMs(perf?.avgResponseTimeMs)} icon="⚡" />
        {/* Cost */}
        <StatCard label="Total Cost"       value={fmtCost(cost?.totalCost)}    icon="💰" />
        <StatCard label="Cost / Review"    value={fmtCost(cost?.avgCostPerReview, 4)} icon="🧮" />
        {/* Adoption */}
        <StatCard label="Repos Using"      value={adoption?.currentRepositories ?? '—'} icon="🗂️" />
        <StatCard label="Market Share"     value={fmtPct(adoption?.marketSharePercentage)} icon="📊" />
        {/* Tokens */}
        <StatCard label="Total Tokens"     value={usage?.totalTokens?.toLocaleString() ?? '—'} sub={`In: ${usage?.inputTokens?.toLocaleString() ?? '?'} / Out: ${usage?.outputTokens?.toLocaleString() ?? '?'}`} icon="🔢" />
        {/* Quality */}
        <StatCard label="Avg Review Score" value={quality?.avgReviewScore != null ? fmt(quality.avgReviewScore) : '—'} icon="⭐" />
      </div>

      {/* ── Trend Charts ── */}
      <SectionTitle>
        Trends
        {trendLoading && <span style={{ fontSize: 11, color: 'var(--color-textMuted)', fontWeight: 400, marginLeft: 8 }}>Updating…</span>}
      </SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="Reviews Over Time">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendPoints(usageTrend)} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]+'30'} strokeWidth={2} name="Reviews" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cost Over Time (USD)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendPoints(costTrend)} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toFixed(4)}`, 'Cost']} />
              <Area type="monotone" dataKey="value" stroke={CHART_COLORS[3]} fill={CHART_COLORS[3]+'30'} strokeWidth={2} name="Cost" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Avg Latency Over Time (ms)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendPoints(perfTrend)} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmtMs(v), 'Latency']} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[1]} strokeWidth={2} name="Latency" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Error Rate Over Time (%)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendPoints(errorTrend)} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${fmt(v)}%`, 'Error Rate']} />
              <Bar dataKey="value" fill={CHART_COLORS[4]} name="Error Rate %" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Performance & Quality Detail ── */}
      <SectionTitle>Performance &amp; Quality</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="Response Time Breakdown">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={latencyBars} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" tick={axisStyle} tickFormatter={(v) => `${v}ms`} />
              <YAxis type="category" dataKey="name" width={65} tick={axisStyle} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmtMs(v), 'Latency']} />
              <Bar dataKey="value" fill={CHART_COLORS[1]} radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Success vs Failure Rate">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={qualityPie} cx="50%" cy="45%" outerRadius={95} dataKey="value"
                label={({ name, value }) => value > 0 ? `${name} ${fmt(value)}%` : null}
                labelLine={false}
              >
                <Cell fill="#4ade80" />
                <Cell fill="#f87171" />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${fmt(v)}%`]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Quality Detail ── */}
      <SectionTitle>Quality Metrics</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
        <StatCard label="Avg Review Score"  value={quality?.avgReviewScore != null ? fmt(quality.avgReviewScore) : '—'} icon="⭐" />
        <StatCard label="User Rating"       value={quality?.userFeedbackRating != null ? fmt(quality.userFeedbackRating) : '—'} icon="👍" />
        <StatCard label="Helpful Reviews"   value={fmtPct(quality?.helpfulReviewPercentage)} icon="✨" />
        <StatCard label="Acceptance Rate"   value={fmtPct(quality?.acceptanceRate)} color="#4ade80" icon="🎯" />
        <StatCard label="False Positive"    value={fmtPct(quality?.falsePositiveRate)} color={quality?.falsePositiveRate > 10 ? '#f87171' : undefined} icon="🔍" />
        <StatCard label="False Negative"    value={fmtPct(quality?.falseNegativeRate)} color={quality?.falseNegativeRate > 10 ? '#f87171' : undefined} icon="🔎" />
      </div>

      {/* ── Cost Detail ── */}
      <SectionTitle>Cost Details</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
        <StatCard label="Total Cost"        value={fmtCost(cost?.totalCost)}                     icon="💰" />
        <StatCard label="Cost Today"        value={fmtCost(cost?.costToday)}                     icon="📅" />
        <StatCard label="Cost This Month"   value={fmtCost(cost?.costThisMonth)}                 icon="📆" />
        <StatCard label="Cost / Review"     value={fmtCost(cost?.avgCostPerReview, 4)}           icon="🧮" />
        <StatCard label="Cost / Repo"       value={fmtCost(cost?.avgCostPerRepository, 4)}       icon="🗂️" />
        <StatCard label="Projected Monthly" value={fmtCost(cost?.estimatedMonthlyProjection)}    icon="📈" />
      </div>

      {/* ── Adoption ── */}
      <SectionTitle>Adoption</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
        <StatCard label="Repos Using"       value={adoption?.currentRepositories ?? '—'}         icon="🗂️" />
        <StatCard label="New This Month"    value={adoption?.newRepositoriesThisMonth ?? '—'}    icon="🆕" />
        <StatCard label="Growth Trend"      value={adoption?.repositoryGrowthTrend != null ? `${fmt(adoption.repositoryGrowthTrend)}%` : '—'}
          color={adoption?.repositoryGrowthTrend >= 0 ? '#4ade80' : '#f87171'} icon="📊" />
        <StatCard label="Market Share"      value={fmtPct(adoption?.marketSharePercentage)}      icon="🏆" />
      </div>

      {/* ── Health (last 1h) ── */}
      {health && (
        <>
          <SectionTitle>Health (Last 1 Hour)</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
            <StatCard label="Status"         value={health.status}       color={HEALTH_COLOR[health.status]} icon="💓" />
            <StatCard label="Success Rate"   value={fmtPct(health.successRateLast1h)}  icon="✅" />
            <StatCard label="Error Rate"     value={fmtPct(health.errorRateLast1h)}    color={health.errorRateLast1h > 5 ? '#f87171' : undefined} icon="⚠️" />
            <StatCard label="Avg Latency"    value={fmtMs(health.avgLatencyLast1h)}    icon="⚡" />
            <StatCard label="Timeouts"       value={health.timeoutsLast1h ?? '—'}      icon="⏱️" />
            <StatCard label="Rate Limits"    value={health.rateLimitsLast1h ?? '—'}    icon="🚦" />
          </div>
        </>
      )}

      {/* ── Perf counters ── */}
      {perf && (perf.timeoutCount > 0 || perf.rateLimitCount > 0) && (
        <>
          <SectionTitle>Error Counters (Last 30 Days)</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
            <StatCard label="Timeouts"    value={perf.timeoutCount}    color={perf.timeoutCount > 0 ? '#fbbf24' : undefined} icon="⏱️" />
            <StatCard label="Rate Limits" value={perf.rateLimitCount}  color={perf.rateLimitCount > 0 ? '#fbbf24' : undefined} icon="🚦" />
          </div>
        </>
      )}

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <>
          <SectionTitle>Active Alerts ({alerts.length})</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map((a, i) => (
              <div key={a.id ?? i} style={{ background: 'var(--color-bgSurface)', border: `1px solid ${SEVERITY_COLOR[a.severity]||'#6b7280'}44`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 18, marginTop: 1 }}>
                  {a.severity === 'CRITICAL' ? '🔴' : a.severity === 'HIGH' ? '🟠' : a.severity === 'MEDIUM' ? '🟡' : '⚪'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-textPrimary)', marginBottom: 3 }}>{a.alertType || 'Alert'}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--color-textSecondary)' }}>{a.message}</div>
                  {a.triggerValue && <div style={{ fontSize: 11.5, color: 'var(--color-textMuted)', marginTop: 4 }}>Trigger: {a.triggerValue} / Threshold: {a.thresholdValue}</div>}
                </div>
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, background: (SEVERITY_COLOR[a.severity]||'#6b7280')+'22', color: SEVERITY_COLOR[a.severity]||'#6b7280', flexShrink: 0 }}>{a.severity}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Recommendations ── */}
      {recs.length > 0 && (
        <>
          <SectionTitle>Recommendations</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
            {recs.map((r, i) => (
              <div key={r.aiModelId ? `${r.aiModelId}-${i}` : i} style={{ background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-textPrimary)', marginBottom: 3 }}>{r.type}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--color-textSecondary)' }}>{r.reason}</div>
                  {r.impact && <div style={{ fontSize: 12, color: 'var(--color-textMuted)', marginTop: 4 }}>Impact: {r.impact}</div>}
                </div>
                {r.priority != null && (
                  <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', flexShrink: 0 }}>P{r.priority}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
