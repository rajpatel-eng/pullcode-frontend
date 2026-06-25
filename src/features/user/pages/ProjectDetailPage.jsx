import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserDashboardLayout from '../../../layouts/UserDashboardLayout';
import { useUser } from '../../../context/UserContext';
import { useProjects } from '../../../context/ProjectContext';
import { getRepository, deleteRepository } from '../../../services/repositoryService';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useUser();
  const { refresh } = useProjects();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRepository(id)
      .then(setProject)
      .catch(() => navigate('/user/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm(`Delete project "${project?.title}"?`)) return;
    await deleteRepository(id);
    await refresh();
    navigate('/user/dashboard');
  }

  return (
    <UserDashboardLayout user={user}>
      {loading ? (
        <div style={{ color: 'var(--color-textMuted)', fontSize: 14 }}>Loading…</div>
      ) : project ? (
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-textPrimary)', marginBottom: 4 }}>{project.title}</h1>
              <div style={{ fontSize: 13, color: 'var(--color-textMuted)' }}>{project.repoUrl}</div>
            </div>
            <button
              onClick={handleDelete}
              style={{
                padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.4)',
                background: 'rgba(248,113,113,0.08)', color: '#f87171',
                fontSize: 13, cursor: 'pointer', fontWeight: 500,
              }}
            >
              Delete
            </button>
          </div>

          <div style={{
            background: 'var(--color-bgSurface)', border: '1px solid var(--color-border)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            {[
              ['Provider', project.provider || '—'],
              ['AI Model', project.aiModelName || '—'],
              ['Webhook Status', project.webhookStatus || '—'],
              ['Has Access Token', project.hasAccessToken ? 'Yes' : 'No'],
              ['Created', project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'],
            ].map(([label, value], i) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '13px 18px',
                borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none',
              }}>
                <span style={{ fontSize: 13.5, color: 'var(--color-textSecondary)' }}>{label}</span>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-textPrimary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </UserDashboardLayout>
  );
}
