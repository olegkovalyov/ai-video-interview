"use client";

import { createContext, useContext } from "react";

const RolesContext = createContext<string[]>([]);

export function RolesProvider({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  return (
    <RolesContext.Provider value={roles}>{children}</RolesContext.Provider>
  );
}

export function useUserRoles(): string[] {
  return useContext(RolesContext);
}
