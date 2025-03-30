import React from 'react'
import { Header } from '../header'

interface ImprintLayoutProps {
  children: React.ReactNode
}

export function ImprintLayout({ children }: ImprintLayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 overflow-hidden flex items-center justify-center bg-gray-50">{children}</div>
    </div>
  )
}
