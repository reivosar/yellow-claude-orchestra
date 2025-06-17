'use client'

import { useState, useEffect, useRef } from 'react'
import { AgentLog } from '@/types/agent'

interface TerminalConsoleProps {
  logs: AgentLog[]
  title: string
  agentType?: 'producer' | 'director' | 'actor' | 'system'
  className?: string
}

export function TerminalConsole({ 
  logs, 
  title, 
  agentType,
  className = '' 
}: TerminalConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // 新しいログが追加されたら自動スクロール
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  // スクロール位置の監視
  const handleScroll = () => {
    if (!scrollRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
    setAutoScroll(isAtBottom)
  }

  // 時刻フォーマット
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // ログレベルに応じたスタイル
  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400'
      case 'warn':
        return 'text-yellow-400'
      case 'debug':
        return 'text-gray-500'
      default:
        return 'text-gray-300'
    }
  }

  // フィルタリングされたログ
  const filteredLogs = agentType 
    ? logs.filter(log => log.agentType === agentType)
    : logs

  return (
    <div className={`orchestra-card ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {filteredLogs.length} 行
          </span>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 text-xs rounded ${
              autoScroll 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-600 text-gray-300'
            }`}
          >
            自動スクロール
          </button>
        </div>
      </div>

      {/* ターミナル */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="terminal h-80 overflow-y-auto custom-scrollbar"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            ログがありません
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`terminal-line ${log.agentType} fade-in`}
            >
              <span className="text-gray-500 mr-2">
                [{formatTime(log.timestamp)}]
              </span>
              <span className="text-gray-400 mr-2">
                {log.agentId}:
              </span>
              <span className={getLogLevelStyle(log.level)}>
                {log.message}
              </span>
              {log.data && (
                <div className="ml-16 mt-1 text-xs text-gray-600">
                  {JSON.stringify(log.data, null, 2)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 自動スクロール警告 */}
      {!autoScroll && (
        <div className="mt-2 text-xs text-yellow-400 text-center">
          自動スクロールが無効です。新しいログを見るには下にスクロールしてください。
        </div>
      )}
    </div>
  )
}