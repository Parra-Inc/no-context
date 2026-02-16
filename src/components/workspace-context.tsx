"use client";

import { createContext, useContext } from "react";

interface WorkspaceContextValue {
  workspaceId: string;
  workspaceSlug: string;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  children,
  workspaceId,
  workspaceSlug,
}: {
  children: React.ReactNode;
  workspaceId: string;
  workspaceSlug: string;
}) {
  return (
    <WorkspaceContext.Provider value={{ workspaceId, workspaceSlug }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}
