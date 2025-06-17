import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useSettings } from '@/hooks/useSettings'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  agentType?: 'producer' | 'director' | 'actor'
  timestamp: string
  taskId?: string
}

interface ChatInterfaceProps {
  taskId: string
  taskTitle: string
  onClose: () => void
}

const MessageItem = memo(({ message, getAgentColor, getAgentName }: {
  message: Message
  getAgentColor: (agentType?: string) => string
  getAgentName: (agentType?: string) => string
}) => (
  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : ''}`}>
      {message.role === 'assistant' && (
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${getAgentColor(message.agentType)}`} />
          <span className="text-xs font-medium text-gray-600">
            {getAgentName(message.agentType)}
          </span>
        </div>
      )}
      <div className={`rounded-lg px-4 py-2 ${
        message.role === 'user'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-900'
      }`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  </div>
))

export function ChatInterface({ taskId, taskTitle, onClose }: ChatInterfaceProps) {
  const { settings } = useSettings()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      agentType: 'producer',
      content: `こんにちは！「${taskTitle}」についてお手伝いします。\n\nまず、このタスクで実現したいことを詳しく教えていただけますか？`,
      timestamp: new Date().toISOString()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastLogId, setLastLogId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timeoutId)
  }, [messages.length, scrollToBottom])

  // ログを取得してメッセージを更新
  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/logs`)
      if (response.ok) {
        const data = await response.json()
        const logs = data.logs || []
        
        // 新しいログエントリーを確認
        const newMessages: Message[] = []
        for (const log of logs) {
          // lastLogIdより新しいログのみ処理
          if (lastLogId && log.id <= lastLogId) {
            continue
          }
          
          // user/ai/producer/director/actorのログをメッセージに変換
          if (log.agent === 'user' && log.message.startsWith('User: ')) {
            const content = log.message.substring(6)
            if (!messages.find(m => m.id === log.id)) {
              newMessages.push({
                id: log.id,
                role: 'user',
                content: content,
                timestamp: log.timestamp
              })
            }
          } else if (log.agent === 'ai' && log.message.startsWith('AI: ')) {
            const content = log.message.substring(4)
            if (!messages.find(m => m.id === log.id)) {
              newMessages.push({
                id: log.id,
                role: 'assistant',
                agentType: 'actor',
                content: content,
                timestamp: log.timestamp
              })
            }
          }
        }
        
        if (newMessages.length > 0) {
          setMessages(prev => [...prev, ...newMessages])
          const lastLog = logs[logs.length - 1]
          if (lastLog) {
            setLastLogId(lastLog.id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }, [taskId, lastLogId, messages])

  // 初回ログ取得とポーリング設定
  useEffect(() => {
    // 初回は既存のログを読み込む
    const loadInitialLogs = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}/logs`)
        if (response.ok) {
          const data = await response.json()
          const logs = data.logs || []
          
          // 既存のログからメッセージを復元
          const existingMessages: Message[] = [{
            id: '1',
            role: 'assistant',
            agentType: 'producer',
            content: `こんにちは！「${taskTitle}」についてお手伝いします。\n\nまず、このタスクで実現したいことを詳しく教えていただけますか？`,
            timestamp: new Date().toISOString()
          }]
          
          for (const log of logs) {
            if (log.agent === 'user' && log.message.startsWith('User: ')) {
              existingMessages.push({
                id: log.id,
                role: 'user',
                content: log.message.substring(6),
                timestamp: log.timestamp
              })
            } else if (log.agent === 'ai' && log.message.startsWith('AI: ')) {
              existingMessages.push({
                id: log.id,
                role: 'assistant',
                agentType: 'actor',
                content: log.message.substring(4),
                timestamp: log.timestamp
              })
            }
          }
          
          setMessages(existingMessages)
          if (logs.length > 0) {
            setLastLogId(logs[logs.length - 1].id)
          }
        }
      } catch (error) {
        console.error('Error loading initial logs:', error)
      }
    }
    
    loadInitialLogs()
    
    // チャット画面が開いている間は常にポーリング
    if (settings) {
      pollingInterval.current = setInterval(() => {
        fetchLogs()
      }, settings.polling.chatInterval)
    }
    
    // クリーンアップ
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [taskId, taskTitle])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      taskId
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    try {
      // タスクメッセージAPIエンドポイントに送信
      const response = await fetch(`/api/tasks/${taskId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input
        })
      })

      if (!response.ok) {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Chat error:', error)
    }
  }

  const getAgentColor = (agentType?: string) => {
    switch (agentType) {
      case 'producer': return 'bg-blue-500'
      case 'director': return 'bg-purple-500'
      case 'actor': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getAgentName = (agentType?: string) => {
    switch (agentType) {
      case 'producer': return 'Producer（要件定義）'
      case 'director': return 'Director（設計・レビュー）'
      case 'actor': return 'Actor（実装）'
      default: return 'System'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{taskTitle}</h2>
            <p className="text-sm text-gray-500 mt-1">AIエージェントと対話しながらタスクを進めます</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageItem 
                key={message.id}
                message={message}
                getAgentColor={getAgentColor}
                getAgentName={getAgentName}
              />
            ))}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              送信
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Producer → Director → Actor の流れで対話が進みます
          </p>
        </form>
      </div>
    </div>
  )
}