import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import DashboardLayout from '../../../layouts/DashboardLayout';
import {
  getSystemSummary, getAllHealthStatuses, getAllAlerts,
  getAllRecommendations, getAiModels, getModelDashboard,
  getUsageTrend, getCostTrend, getPerformanceTrend
} from '../../../services/analyticsService';
import { useUser } from '../../../context/UserContext'; // ← CHANGED

const HEALTH_COLOR = { HEALTHY: '#4ade80', DEGRADED: '#fbbf24', UNHEALTHY: '#f87171', UNKNOWN: '#6b7280' };
const SEVERITY_COLOR = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#fbbf24', LOW: '#6b7280' };

function StatBox({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, color: 'var(--color-textMuted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || 'var(--color-textPrimary)' }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-textSecondary)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-textPrimary)', marginBottom: 14, marginTop: 28 }}>{children}</div>;
}

function Card({ children, style }) {
  return <div style={{ background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '18px 20px', ...style }}>{children}</div>;
}

function Badge({ label, color }) {
  return <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + '20', color: color }}>{label}</span>;
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PeriodSelector({ value, onChange }) {
  const opts = [['DAYS_7','7d'], ['DAYS_30','30d'], ['DAYS_90','90d'], ['DAYS_365','1y']];
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {opts.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-border)', background: value === v ? 'var(--color-accent)' : 'var(--color-bgMuted)', color: value === v ? '#fff' : 'var(--color-textSecondary)', fontSize: 12, cursor: 'pointer', fontWeight: value === v ? 600 : 400 }}>{l}</button>
      ))}
    </div>
  );
}

function TrendChart({ data, color, label, formatter }) {
  if (!data?.points?.length) return <div style={{ fontSize: 13, color: 'var(--color-textMuted)', padding: 16, textAlign: 'center' }}>No trend data</div>;
  const points = data.points.map(p => ({ date: p.date, value: p.value }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={points} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-textMuted)' }} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--color-textMuted)' }} tickLine={false} axisLine={false} tickFormatter={formatter} />
        <Tooltip contentStyle={{ background: 'var(--color-bgElevated)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 12 }} formatter={(v) => [formatter ? formatter(v) : v, label]} />
        <Line type="monotone" dataKey="value" stroke={color || 'var(--color-accent)'} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function AnalyticsDashboardPage({ role: propRole }) {
  const { user } = useUser(); // ← CHANGED: get user (with photoUrl) from context
  const role = propRole || 'admin';

  const [summary, setSummary]       = useState(null);
  const [healthList, setHealthList] = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [recs, setRecs]             = useState([]);
  const [models, setModels]         = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelDash, setModelDash]   = useState(null);
  const [period, setPeriod]         = useState('DAYS_30');
  const [usageTrend, setUsageTrend] = useState(null);
  const [costTrend, setCostTrend]   = useState(null);
  const [perfTrend, setPerfTrend]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [modelLoading, setModelLoading] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [sum, health, al, rec, mdls] = await Promise.all([
          getSystemSummary(), getAllHealthStatuses(), getAllAlerts(),
          getAllRecommendations(), getAiModels().catch(() => []),
        ]);
        setSummary(sum); setHealthList(health || []); setAlerts(al || []);
        setRecs(rec || []); setModels(mdls || []);
        if (mdls?.length) setSelectedModel(mdls[0].id ?? mdls[0].aiModelId);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedModel) return;
    async function loadModel() {
      setModelLoading(true);
      try {
        const [dash, usage, cost, perf] = await Promise.all([
          getModelDashboard(selectedModel), getUsageTrend(selectedModel, period),
          getCostTrend(selectedModel, period), getPerformanceTrend(selectedModel, period),
        ]);
        setModelDash(dash); setUsageTrend(usage); setCostTrend(cost); setPerfTrend(perf);
      } catch (e) { /* non-fatal */ }
      finally { setModelLoading(false); }
    }
    loadModel();
  }, [selectedModel, period]);

  if (loading) return <DashboardLayout role={role} user={user}><Spinner /></DashboardLayout>;

  const healthPie = summary ? [
    { name: 'Healthy',   value: summary.healthyModels,   color: '#4ade80' },
    { name: 'Degraded',  value: summary.degradedModels,  color: '#fbbf24' },
    { name: 'Unhealthy', value: summary.unhealthyModels, color: '#f87171' },
  ].filter(d => d.value > 0) : [];

  const radarData = modelDash ? [
    { metric: 'Success Rate', value: modelDash.performance?.successRate || 0 },
    { metric: 'Quality',      value: (modelDash.quality?.avgReviewScore || 0) * 10 },
    { metric: 'Adoption',     value: modelDash.adoption?.marketSharePercentage || 0 },
    { metric: 'Feedback',     value: (modelDash.quality?.userFeedbackRating || 0) * 20 },
    { metric: 'Acceptance',   value: modelDash.quality?.acceptanceRate || 0 },
  ] : [];

  return (
    <DashboardLayout role={role} user={user}> {/* ← CHANGED: user from context */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-textPrimary)' }}>Analytics</h1>
          <div style={{ fontSize: 13, color: 'var(--color-textSecondary)', marginTop: 2 }}>AI model performance & usage overview</div>
        </div>
      </div>

      {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 13, marginBottom: 16, marginTop: 12 }}>{error}</div>}

      {summary && (
        <>
          <SectionTitle>System Overview</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <StatBox label="Total Models"    value={summary.totalModels}        sub={`${summary.activeModels} active`} />
            <StatBox label="Reviews Today"   value={summary.totalReviewsToday?.toLocaleString()} />
            <StatBox label="Reviews / Month" value={summary.totalReviewsThisMonth?.toLocaleString()} />
            <StatBox label="Cost / Month"    value={summary.totalCostThisMonth != null ? `$${summary.totalCostThisMonth}` : '—'} />
            <StatBox label="Open Alerts"     value={summary.unresolvedAlerts} color={summary.unresolvedAlerts > 0 ? '#f87171' : undefined} />
            <StatBox label="Best Performer"  value={summary.bestPerformingModel || '—'} sub="by success rate" />
            <StatBox label="Most Used"       value={summary.mostUsedModel || '—'} />
            <StatBox label="Cost Efficient"  value={summary.mostCostEfficientModel || '—'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14, marginTop: 14 }}>
            <Card>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--color-textPrimary)' }}>Model Health</div>
              {healthPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={healthPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {healthPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--color-bgElevated)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ color: 'var(--color-textMuted)', fontSize: 13, textAlign: 'center', padding: 24 }}>No data</div>}
            </Card>

            <Card>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--color-textPrimary)' }}>Model Health Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                {healthList.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 7, background: 'var(--color-bgMuted)' }}>
                    <span style={{ fontSize: 13, color: 'var(--color-textPrimary)', fontWeight: 500 }}>{h.modelName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--color-textSecondary)' }}>{h.successRateLast1h != null ? `${h.successRateLast1h.toFixed(1)}% success` : ''}</span>
                      <Badge label={h.status} color={HEALTH_COLOR[h.status] || '#6b7280'} />
                    </div>
                  </div>
                ))}
                {healthList.length === 0 && <div style={{ color: 'var(--color-textMuted)', fontSize: 13, textAlign: 'center', padding: 16 }}>No models</div>}
              </div>
            </Card>
          </div>
        </>
      )}

      {models.length > 0 && (
        <>
          <SectionTitle>Model Deep-Dive</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={selectedModel || ''} onChange={e => setSelectedModel(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bgMuted)', color: 'var(--color-textPrimary)', fontSize: 13, cursor: 'pointer' }}>
              {models.map(m => <option key={m.id ?? m.aiModelId} value={m.id ?? m.aiModelId}>{m.name || m.modelName || `Model ${m.id ?? m.aiModelId}`}</option>)}
            </select>
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>

          {modelLoading && <Spinner />}

          {!modelLoading && modelDash && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 14 }}>
                <StatBox label="Total Reviews"    value={modelDash.usage?.totalReviews?.toLocaleString()} />
                <StatBox label="Reviews Today"    value={modelDash.usage?.reviewsToday?.toLocaleString()} />
                <StatBox label="Success Rate"     value={`${(modelDash.performance?.successRate || 0).toFixed(1)}%`} color="#4ade80" />
                <StatBox label="Avg Response"     value={`${(modelDash.performance?.avgResponseTimeMs || 0).toFixed(0)}ms`} />
                <StatBox label="Avg Review Score" value={(modelDash.quality?.avgReviewScore || 0).toFixed(2)} />
                <StatBox label="Total Cost"       value={modelDash.cost?.totalCost != null ? `$${modelDash.cost.totalCost}` : '—'} />
                <StatBox label="Cost / Review"    value={modelDash.cost?.avgCostPerReview != null ? `$${modelDash.cost.avgCostPerReview}` : '—'} />
                <StatBox label="Market Share"     value={`${(modelDash.adoption?.marketSharePercentage || 0).toFixed(1)}%`} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginBottom: 14 }}>
                <Card><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--color-textPrimary)' }}>Usage Trend</div><TrendChart data={usageTrend} color="#3b82f6" label="Reviews" /></Card>
                <Card><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--color-textPrimary)' }}>Cost Trend</div><TrendChart data={costTrend} color="#10b981" label="Cost" formatter={v => `$${Number(v).toFixed(2)}`} /></Card>
                <Card><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--color-textPrimary)' }}>Response Time Trend</div><TrendChart data={perfTrend} color="#f59e0b" label="ms" formatter={v => `${v.toFixed(0)}ms`} /></Card>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--color-textPrimary)' }}>Quality Radar</div>
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="var(--color-border)" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--color-textSecondary)' }} />
                        <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                        <Tooltip contentStyle={{ background: 'var(--color-bgElevated)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : <div style={{ color: 'var(--color-textMuted)', textAlign: 'center', padding: 24, fontSize: 13 }}>No quality data</div>}
                </Card>
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--color-textPrimary)' }}>Token Usage</div>
                  {modelDash.usage ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[{ name: 'Input', tokens: modelDash.usage.inputTokens || 0 }, { name: 'Output', tokens: modelDash.usage.outputTokens || 0 }, { name: 'Total', tokens: modelDash.usage.totalTokens || 0 }]} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-textSecondary)' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--color-textMuted)' }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                        <Tooltip contentStyle={{ background: 'var(--color-bgElevated)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 12 }} />
                        <Bar dataKey="tokens" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div style={{ color: 'var(--color-textMuted)', textAlign: 'center', padding: 24, fontSize: 13 }}>No token data</div>}
                </Card>
              </div>

              {modelDash.recommendations?.length > 0 && (
                <Card style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--color-textPrimary)' }}>Model Recommendations</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {modelDash.recommendations.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 7, background: 'var(--color-bgMuted)' }}>
                        <span style={{ color: 'var(--color-accent)', marginTop: 1 }}>→</span>
                        <span style={{ fontSize: 13, color: 'var(--color-textSecondary)' }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {alerts.length > 0 && (
        <>
          <SectionTitle>Active Alerts</SectionTitle>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {alerts.slice(0, 10).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 7, background: 'var(--color-bgMuted)', borderLeft: `3px solid ${SEVERITY_COLOR[a.severity] || '#6b7280'}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-textPrimary)' }}>{a.modelName} — {String(a.alertType || '').replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-textSecondary)', marginTop: 2 }}>{a.message}</div>
                  </div>
                  <Badge label={a.severity} color={SEVERITY_COLOR[a.severity] || '#6b7280'} />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {recs.length > 0 && (
        <>
          <SectionTitle>Recommendations</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 24 }}>
            {recs.slice(0, 6).map((r, i) => (
              <Card key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-textPrimary)' }}>{r.type}</div>
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: 'var(--color-accentSubtle)', color: 'var(--color-accent)', fontWeight: 600 }}>P{r.priority}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-textSecondary)', marginBottom: 6 }}>{r.reason}</div>
                {r.impact && <div style={{ fontSize: 12, color: '#4ade80' }}>Impact: {r.impact}</div>}
                <div style={{ fontSize: 11, color: 'var(--color-textMuted)', marginTop: 4 }}>{r.modelName}</div>
              </Card>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}