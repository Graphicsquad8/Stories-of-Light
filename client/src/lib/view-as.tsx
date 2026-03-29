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
  viewMeMode: boolean;
  setViewMeMode: (mode: boolean) => void;
}

const ViewAsContext = createContext<ViewAsContextType | null>(null);

const STORAGE_KEY = "admin_view_as_contributor";
const VIEW_ME_KEY = "admin_view_me_mode";

export function ViewAsProvider({ children }: { children: React.ReactNode }) {
  const [viewAs, setViewAsState] = useState<ViewAsContributor | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [viewMeMode, setViewMeModeState] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(VIEW_ME_KEY) === "true";
    } catch {
      return false;
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

  const setViewMeMode = useCallback((mode: boolean) => {
    setViewMeModeState(mode);
    sessionStorage.setItem(VIEW_ME_KEY, mode ? "true" : "false");
  }, []);

  return (
    <ViewAsContext.Provider value={{ viewAs, setViewAs, clearViewAs, viewMeMode, setViewMeMode }}>
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const ctx = useContext(ViewAsContext);
  if (!ctx) throw new Error("useViewAs must be used within ViewAsProvider");
  return ctx;
}
