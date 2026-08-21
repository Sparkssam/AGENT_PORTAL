"use client"

import { createContext, useContext } from "react"

export type AdminShellContextValue = {
  collapsed: boolean
  toggle: () => void
}

export const AdminShellContext = createContext<AdminShellContextValue>({
  collapsed: false,
  toggle: () => {},
})

export function useAdminShell() {
  return useContext(AdminShellContext)
}
