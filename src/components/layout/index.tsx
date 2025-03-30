import React from 'react'
import { Header } from '../header'
import { TopicList } from '../topic-list'
import { useChatStore } from '../../stores/chat'

interface LayoutProps {
  children: React.ReactNode
}

export function DefaultLayout({ children }: LayoutProps) {
  const { currentTopicId } = useChatStore()

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <TopicList />
        <div className="flex-1 relative">
          {currentTopicId ? (
            <div className="h-full flex flex-col">{children}</div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Create a new topic or select an existing one to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
