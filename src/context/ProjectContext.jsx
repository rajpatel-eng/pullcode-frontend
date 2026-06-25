/**
 * ProjectContext — fetches user repositories and makes them available
 * to the user sidebar and pages. Projects are FIFO-ordered (newest first).
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMyRepositories } from '../services/repositoryService';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyRepositories();
      // FIFO: newest first (sorted by createdAt descending)
      const sorted = [...(data || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setProjects(sorted);
      setError(null);
    } catch (err) {
      setError(err.message);
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
