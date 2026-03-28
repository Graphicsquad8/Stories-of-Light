import { createContext, useContext, useState, useCallback } from "react";

export interface ViewAsContributor {
  id: string;
  username: string;
  name: string | null;
  role: string;
  permissions: string[] | null;
  avatar_url: string | null;
}

interface ViewAsContextType {
  viewAs: ViewAsContributor | null;
  setViewAs: (contributor: ViewAsContributor | null) => void;
  clearViewAs: () => void;
}

const ViewAsContext = createContext<ViewAsContextType | null>(null);

const STORAGE_KEY = "admin_view_as_contributor";

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const [viewAs, setViewAsState] = useState<ViewAsContributor | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setViewAs = useCallback((contributor: ViewAsContributor | null) => {
    setViewAsState(contributor);
    if (contributor) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(contributor));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearViewAs = useCallback(() => setViewAs(null), [setViewAs]);

  return (
    <ViewAsContext.Provider value={{ viewAs, setViewAs, clearViewAs }}>
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const ctx = useContext(ViewAsContext);
  if (!ctx) throw new Error("useViewAs must be used within ViewAsProvider");
  return ctx;
}
