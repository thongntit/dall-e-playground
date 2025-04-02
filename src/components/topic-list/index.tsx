import { useState } from 'react'
import { useChatStore } from '../../stores/chat'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ChatTopic } from '../../types/chat'

export function TopicList() {
  const { topics, currentTopicId, createTopic, selectTopic, deleteTopic, renameTopic } = useChatStore()
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [editingTopic, setEditingTopic] = useState<ChatTopic | null>(null)
  const [isCreatingNewTopic, setIsCreatingNewTopic] = useState(false)

  const handleCreateTopic = () => {
    if (isCreatingNewTopic) {
      if (newTopicTitle.trim()) {
        createTopic(newTopicTitle.trim())
        setNewTopicTitle('')
      }
    } else {
      // Create a default topic name
      const defaultName = `New Chat ${topics.length + 1}`
      createTopic(defaultName)
    }
    setIsCreatingNewTopic(false)
  }

  const handleRename = (topic: ChatTopic, newTitle: string) => {
    if (newTitle.trim()) {
      renameTopic(topic.id, newTitle.trim())
      setEditingTopic(null)
    }
  }

  return (
    <div className="w-64 min-w-64 border-r border-gray-200 p-4 flex flex-col gap-4 h-full">
      <div className="flex gap-2">
        {isCreatingNewTopic ? (
          <>
            <Input
              placeholder="Topic name..."
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTopic()
                } else if (e.key === 'Escape') {
                  setIsCreatingNewTopic(false)
                  setNewTopicTitle('')
                }
              }}
              autoFocus
            />
            <Button onClick={handleCreateTopic}>Add</Button>
          </>
        ) : (
          <div className="flex gap-2 w-full">
            <Button onClick={handleCreateTopic} className="flex-1">
              New Topic
            </Button>
            <Button variant="outline" onClick={() => setIsCreatingNewTopic(true)} className="px-2">
              +
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className={`p-2 rounded flex justify-between items-center cursor-pointer group ${
              topic.id === currentTopicId ? 'bg-gray-100' : 'hover:bg-gray-50'
            }`}
          >
            {editingTopic?.id === topic.id ? (
              <Input
                value={editingTopic.title}
                onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                onBlur={() => handleRename(topic, editingTopic.title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename(topic, editingTopic.title)
                  } else if (e.key === 'Escape') {
                    setEditingTopic(null)
                  }
                }}
                autoFocus
              />
            ) : (
              <div className="flex-1 min-w-0 flex items-center" onClick={() => selectTopic(topic.id)}>
                <span className="truncate select-none w-full">{topic.title}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingTopic(topic)
                }}
              >
                ✎
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteTopic(topic.id)}
              >
                ×
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
