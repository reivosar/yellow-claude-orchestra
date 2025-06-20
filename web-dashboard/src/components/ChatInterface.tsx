import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useWebSocket } from '@/hooks/useWebSocket'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  agentType?: 'producer' | 'director' | 'actor' | 'analyst' | 'reviewer' | 'tester' | 'conductor'
  timestamp: string
  taskId?: string
  status?: 'sending' | 'sent' | 'delivered' | 'error'
  attachments?: {
    type: 'file' | 'image' | 'code'
    name: string
    content?: string
    language?: string
  }[]
  reactions?: {
    emoji: string
    users: string[]
  }[]
}

interface ChatInterfaceProps {
  taskId: string
  taskTitle: string
  onClose: () => void
  theme?: 'light' | 'dark'
}

// エージェント設定
const AGENTS = {
  producer: {
    name: 'Producer',
    description: '要件定義・企画',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    avatar: '🎬',
    borderColor: 'border-blue-200 dark:border-blue-700'
  },
  director: {
    name: 'Director',
    description: '設計・アーキテクチャ',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    textColor: 'text-purple-700 dark:text-purple-300',
    avatar: '🎭',
    borderColor: 'border-purple-200 dark:border-purple-700'
  },
  actor: {
    name: 'Actor',
    description: '実装・開発',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    avatar: '⚡',
    borderColor: 'border-green-200 dark:border-green-700'
  },
  analyst: {
    name: 'Analyst',
    description: 'データ分析・調査',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-700 dark:text-orange-300',
    avatar: '📊',
    borderColor: 'border-orange-200 dark:border-orange-700'
  },
  reviewer: {
    name: 'Reviewer',
    description: 'コードレビュー・品質管理',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    avatar: '🔍',
    borderColor: 'border-red-200 dark:border-red-700'
  },
  tester: {
    name: 'Tester',
    description: 'テスト・QA',
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    avatar: '🧪',
    borderColor: 'border-indigo-200 dark:border-indigo-700'
  },
  conductor: {
    name: 'Conductor',
    description: 'プロジェクト統括',
    color: 'from-gray-500 to-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    textColor: 'text-gray-700 dark:text-gray-300',
    avatar: '🎼',
    borderColor: 'border-gray-200 dark:border-gray-700'
  }
}

// メッセージアイテムコンポーネント
const MessageItem = memo(({ 
  message, 
  isTyping = false,
  onReaction,
  theme = 'light'
}: {
  message: Message
  isTyping?: boolean
  onReaction?: (messageId: string, emoji: string) => void
  theme?: 'light' | 'dark'
}) => {
  const agent = message.agentType ? AGENTS[message.agentType] : null
  const isUser = message.role === 'user'
  const [showReactions, setShowReactions] = useState(false)

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleReaction = (emoji: string) => {
    onReaction?.(message.id, emoji)
    setShowReactions(false)
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-[70%] ${isUser ? 'order-2' : ''}`}>
        {/* エージェント情報 */}
        {!isUser && agent && (
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
              {agent.avatar}
            </div>
            <div>
              <span className={`text-sm font-semibold ${agent.textColor}`}>
                {agent.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {agent.description}
              </span>
            </div>
          </div>
        )}

        {/* メッセージバブル */}
        <div className="relative group">
          <div className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
              : agent 
                ? `${agent.bgColor} ${agent.textColor} border ${agent.borderColor}`
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          } ${
            isTyping ? 'animate-pulse' : ''
          }`}>
            {/* メッセージ内容 */}
            <div className="whitespace-pre-wrap break-words">
              {message.content}
              {isTyping && (
                <span className="inline-flex items-center ml-2">
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce"></span>
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce mx-1" style={{ animationDelay: '0.1s' }}></span>
                  <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                </span>
              )}
            </div>

            {/* 添付ファイル */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className={`rounded-lg p-3 ${
                    isUser ? 'bg-white/10' : 'bg-white/50 dark:bg-gray-700/50'
                  }`}>
                    {attachment.type === 'code' ? (
                      <div>
                        <div className="text-xs opacity-75 mb-2">
                          {attachment.language} • {attachment.name}
                        </div>
                        <pre className="text-sm overflow-x-auto">
                          <code>{attachment.content}</code>
                        </pre>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📎</span>
                        <span className="text-sm">{attachment.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ステータス表示 */}
            {message.status && (
              <div className="mt-2 flex items-center gap-1">
                {message.status === 'sending' && (
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin opacity-50"></div>
                )}
                {message.status === 'sent' && (
                  <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {message.status === 'delivered' && (
                  <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )}
          </div>

          {/* タイムスタンプとリアクション */}
          <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(message.timestamp)}
            </span>
            
            {/* リアクションボタン */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                😊
              </button>
              
              {showReactions && (
                <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex gap-1 z-10">
                  {['👍', '👎', '❤️', '😄', '😮', '😢'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* リアクション表示 */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 text-xs"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-gray-600 dark:text-gray-400">{reaction.users.length}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export function ChatInterface({ taskId, taskTitle, onClose, theme = 'light' }: ChatInterfaceProps) {
  const { settings } = useSettings()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      agentType: 'conductor',
      content: `🎼 **タスク「${taskTitle}」を開始します**

こんにちは！プロジェクト統括のConductorです。このタスクを最適なエージェントチームで進めさせていただきます。

**利用可能なエージェント:**
• 🎬 **Producer** - 要件定義・企画
• 🎭 **Director** - 設計・アーキテクチャ  
• ⚡ **Actor** - 実装・開発
• 📊 **Analyst** - データ分析・調査
• 🔍 **Reviewer** - コードレビュー・品質管理
• 🧪 **Tester** - テスト・QA

まず、どのような作業をご希望でしょうか？詳しく教えてください。`,
      timestamp: new Date().toISOString(),
      status: 'delivered'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<string>('conductor')
  const [lastLogId, setLastLogId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  // WebSocket接続
  const { isConnected, sendMessage } = useWebSocket(`/api/websocket?taskId=${taskId}`, {
    onMessage: (data) => {
      if (data.type === 'agent_message') {
        const newMessage: Message = {
          id: data.id,
          role: 'assistant',
          agentType: data.agentType,
          content: data.content,
          timestamp: data.timestamp,
          status: 'delivered'
        }
        setMessages(prev => [...prev, newMessage])
        setIsTyping(false)
      } else if (data.type === 'agent_typing') {
        setIsTyping(true)
        setCurrentAgent(data.agentType)
      }
    }
  })

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timeoutId)
  }, [messages.length, scrollToBottom])

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // ログの取得とポーリング
  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/logs`)
      if (response.ok) {
        const data = await response.json()
        const logs = data.logs || []
        
        const newMessages: Message[] = []
        for (const log of logs) {
          if (lastLogId && log.id <= lastLogId) continue
          
          if (log.agent === 'user' && log.message.startsWith('User: ')) {
            const content = log.message.substring(6)
            if (!messages.find(m => m.id === log.id)) {
              newMessages.push({
                id: log.id,
                role: 'user',
                content: content,
                timestamp: log.timestamp,
                status: 'delivered'
              })
            }
          } else if (log.agent !== 'user' && log.message.startsWith(`${log.agent}: `)) {
            const content = log.message.substring(log.agent.length + 2)
            if (!messages.find(m => m.id === log.id)) {
              newMessages.push({
                id: log.id,
                role: 'assistant',
                agentType: log.agent as any,
                content: content,
                timestamp: log.timestamp,
                status: 'delivered'
              })
            }
          }
        }
        
        if (newMessages.length > 0) {
          setMessages(prev => [...prev, ...newMessages])
          const lastLog = logs[logs.length - 1]
          if (lastLog) setLastLogId(lastLog.id)
        }
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }, [taskId, lastLogId, messages])

  useEffect(() => {
    const loadInitialLogs = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}/logs`)
        if (response.ok) {
          const data = await response.json()
          const logs = data.logs || []
          
          const existingMessages: Message[] = [messages[0]] // Keep initial conductor message
          
          for (const log of logs) {
            if (log.agent === 'user' && log.message.startsWith('User: ')) {
              existingMessages.push({
                id: log.id,
                role: 'user',
                content: log.message.substring(6),
                timestamp: log.timestamp,
                status: 'delivered'
              })
            } else if (log.agent !== 'user' && log.message.startsWith(`${log.agent}: `)) {
              existingMessages.push({
                id: log.id,
                role: 'assistant',
                agentType: log.agent as any,
                content: log.message.substring(log.agent.length + 2),
                timestamp: log.timestamp,
                status: 'delivered'
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
    
    if (settings && !isConnected) {
      pollingInterval.current = setInterval(fetchLogs, settings.polling.chatInterval)
    }
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current)
      }
    }
  }, [taskId, taskTitle, settings, isConnected])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      taskId,
      status: 'sending'
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // WebSocketで送信を試行
    if (isConnected && sendMessage) {
      sendMessage({
        type: 'user_message',
        taskId,
        content: input,
        timestamp: new Date().toISOString()
      })
    }

    try {
      // ローカルメッセージのステータス更新
      setMessages(prev => 
        prev.map(m => 
          m.id === userMessage.id 
            ? { ...m, status: 'sent' } 
            : m
        )
      )

      const response = await fetch(`/api/tasks/${taskId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })

      if (response.ok) {
        // 送信成功
        setMessages(prev => 
          prev.map(m => 
            m.id === userMessage.id 
              ? { ...m, status: 'delivered' } 
              : m
          )
        )
      } else {
        // 送信エラー
        setMessages(prev => 
          prev.map(m => 
            m.id === userMessage.id 
              ? { ...m, status: 'error' } 
              : m
          )
        )
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => 
        prev.map(m => 
          m.id === userMessage.id 
            ? { ...m, status: 'error' } 
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => 
      prev.map(message => {
        if (message.id === messageId) {
          const reactions = message.reactions || []
          const existingReaction = reactions.find(r => r.emoji === emoji)
          
          if (existingReaction) {
            // Toggle reaction
            if (existingReaction.users.includes('current-user')) {
              existingReaction.users = existingReaction.users.filter(u => u !== 'current-user')
              if (existingReaction.users.length === 0) {
                return {
                  ...message,
                  reactions: reactions.filter(r => r.emoji !== emoji)
                }
              }
            } else {
              existingReaction.users.push('current-user')
            }
          } else {
            reactions.push({
              emoji,
              users: ['current-user']
            })
          }
          
          return { ...message, reactions }
        }
        return message
      })
    )
  }

  const themeClasses = theme === 'dark' 
    ? 'bg-gray-900 text-white' 
    : 'bg-white text-gray-900'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses} rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col border border-gray-200 dark:border-gray-700`}>
        {/* ヘッダー */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                🎼
              </div>
              <div>
                <h2 className="text-xl font-bold">{taskTitle}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isConnected ? '🟢 リアルタイム接続中' : '🔄 ポーリング中'} • {messages.length - 1} メッセージ
                </p>
              </div>
            </div>
            
            {/* アクティブエージェント表示 */}
            {isTyping && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${AGENTS[currentAgent as keyof typeof AGENTS]?.color} flex items-center justify-center text-white text-xs`}>
                  {AGENTS[currentAgent as keyof typeof AGENTS]?.avatar}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">入力中...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              ESC で閉じる • / でフォーカス
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="チャットを閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <MessageItem 
              key={message.id}
              message={message}
              onReaction={handleReaction}
              theme={theme}
            />
          ))}
          
          {/* タイピングインジケーター */}
          {isTyping && (
            <MessageItem
              message={{
                id: 'typing',
                role: 'assistant',
                agentType: currentAgent as any,
                content: '',
                timestamp: new Date().toISOString()
              }}
              isTyping={true}
              theme={theme}
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="メッセージを入力... (/ でフォーカス)"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 transition-all"
                  disabled={isLoading}
                  maxLength={2000}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  {input.length}/2000
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 font-medium shadow-lg"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                エージェントが協力してタスクを進めます
              </span>
              <span>
                Enter で送信
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}