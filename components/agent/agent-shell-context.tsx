"use client"

import { createContext, useContext } from "react"

export type AgentShellContextValue = {
  collapsed: boolean
  toggle: () => void
}

export const AgentShellContext = createContext<AgentShellContextValue>({
  collapsed: false,
  toggle: () => {},
})

export function useAgentShell() {
  return useContext(AgentShellContext)
}
