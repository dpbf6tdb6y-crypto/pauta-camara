'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

type TopbarCtx = {
  leftContent: ReactNode
  setLeftContent: (content: ReactNode) => void
}

const TopbarContext = createContext<TopbarCtx>({ leftContent: null, setLeftContent: () => {} })

export function TopbarProvider({ children }: { children: ReactNode }) {
  const [leftContent, setLeftContent] = useState<ReactNode>(null)
  return (
    <TopbarContext.Provider value={{ leftContent, setLeftContent }}>
      {children}
    </TopbarContext.Provider>
  )
}

export const useTopbar = () => useContext(TopbarContext)
