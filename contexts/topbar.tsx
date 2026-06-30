'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

type TopbarCtx = {
  leftContent: ReactNode
  setLeftContent: (content: ReactNode) => void
  rightContent: ReactNode
  setRightContent: (content: ReactNode) => void
}

const TopbarContext = createContext<TopbarCtx>({
  leftContent: null, setLeftContent: () => {},
  rightContent: null, setRightContent: () => {},
})

export function TopbarProvider({ children }: { children: ReactNode }) {
  const [leftContent, setLeftContent] = useState<ReactNode>(null)
  const [rightContent, setRightContent] = useState<ReactNode>(null)
  return (
    <TopbarContext.Provider value={{ leftContent, setLeftContent, rightContent, setRightContent }}>
      {children}
    </TopbarContext.Provider>
  )
}

export const useTopbar = () => useContext(TopbarContext)
