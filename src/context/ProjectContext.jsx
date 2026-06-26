import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tokenStorage, SESSION_EXPIRED_ERROR } from '../services/authService';
import { getMyRepositories } from '../services/repositoryService';

const ProjectContext = createContext(null);

function isJustAfterOAuth() {
  const ref = document.referrer;
  return (
    ref.includes('/login-success') ||
    ref.includes('/oauth2/') ||
    window.location.search.includes('token=')
  );
}

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyRepositories();
      const sorted = [...(data || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setProjects(sorted);
      setError(null);
    } catch (err) {
      if (err?.message === SESSION_EXPIRED_ERROR) {
        if (isJustAfterOAuth()) {
          console.warn('[ProjectContext] 401 during post-OAuth load — skipping redirect');
          setError(null);
        } else {
          tokenStorage.clear();
          window.location.replace('/user/login');
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <ProjectContext.Provider value={{ projects, loading, error, refresh, setProjects }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be inside ProjectProvider');
  return ctx;
}
