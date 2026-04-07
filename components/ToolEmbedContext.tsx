'use client'

import React, { createContext, useContext } from 'react'

interface ToolEmbedContextType {
  isEmbed: boolean
  projectId: string | null
}

const ToolEmbedContext = createContext<ToolEmbedContextType>({
  isEmbed: false,
  projectId: null,
})

export const useToolEmbed = () => useContext(ToolEmbedContext)

interface ToolEmbedProviderProps {
  children: React.ReactNode
  projectId: string | null
}

export function ToolEmbedProvider({ children, projectId }: ToolEmbedProviderProps) {
  return (
    <ToolEmbedContext.Provider value={{ isEmbed: true, projectId }}>
      {children}
    </ToolEmbedContext.Provider>
  )
}
