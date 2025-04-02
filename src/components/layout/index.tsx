import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import React, { useState } from 'react'
import { useChatStore } from '../../stores/chat'
import { Header } from '../header'
import { TopicList } from '../topic-list'
import { Button } from '../ui/button'

interface LayoutProps {
  children: React.ReactNode
}

export function DefaultLayout({ children }: LayoutProps) {
  const { currentTopicId } = useChatStore()
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar toggle button - positioned centered vertically on the edge of sidebar */}
        <Button
          variant="outline"
          size="icon"
          className={`absolute top-1/2 -translate-y-1/2 w-6 h-20 rounded-r-md rounded-l-none border-l-0 z-20 transition-all duration-300 flex items-center justify-center ${
            isLeftSidebarOpen ? 'left-64' : 'left-0'
          }`}
          onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        >
          {isLeftSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </Button>

        {/* Sidebar container */}
        <div
          className={`transition-transform duration-300 ease-in-out absolute left-0 h-full z-10 ${
            isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <TopicList />
        </div>

        <div className={`flex-1 relative transition-all duration-300 pl-4 ${isLeftSidebarOpen ? 'ml-64' : 'ml-0'}`}>
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
