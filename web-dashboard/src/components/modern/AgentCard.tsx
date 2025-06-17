import React from 'react'
import { AgentStatus } from '@/types/agent'

interface AgentCardProps {
  agent: AgentStatus
  onViewDetails?: (agentId: string) => void
  onStartStop?: (agentId: string, action: 'start' | 'stop') => void
}

export function AgentCard({ agent, onViewDetails, onStartStop }: AgentCardProps) {
  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'active':
      case 'working':
        return 'success'
      case 'idle':
        return 'gray'
      case 'error':
        return 'error'
      default:
        return 'gray'
    }
  }

  const getStatusLabel = (status: AgentStatus['status']) => {
    switch (status) {
      case 'active':
        return 'アクティブ'
      case 'working':
        return '作業中'
      case 'idle':
        return '待機中'
      case 'error':
        return 'エラー'
      default:
        return '不明'
    }
  }

  const getAgentTypeIcon = (type: AgentStatus['type']) => {
    switch (type) {
      case 'producer':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m0 0V6a2 2 0 012-2h6a2 2 0 012 2v2z" />
          </svg>
        )
      case 'director':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        )
      case 'actor':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        )
      case 'system':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
    }
  }

  const getAgentTypeLabel = (type: AgentStatus['type']) => {
    switch (type) {
      case 'producer':
        return 'プロデューサー'
      case 'director':
        return 'ディレクター'
      case 'actor':
        return 'アクター'
      case 'system':
        return 'システム'
      default:
        return 'エージェント'
    }
  }

  const formatLastSeen = (lastSeen: string) => {
    const now = new Date()
    const lastSeenDate = new Date(lastSeen)
    const diffMs = now.getTime() - lastSeenDate.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)

    if (diffSeconds < 60) {
      return `${diffSeconds}秒前`
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分前`
    } else if (diffHours < 24) {
      return `${diffHours}時間前`
    } else {
      return lastSeenDate.toLocaleDateString('ja-JP')
    }
  }

  const statusColor = getStatusColor(agent.status)

  return (
    <div className="card p-6 transition hover:shadow-lg">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${statusColor === 'success' ? 'success' : statusColor === 'error' ? 'error' : 'gray'}-50`}>
            <span className={`text-${statusColor === 'success' ? 'success' : statusColor === 'error' ? 'error' : 'gray'}-600`}>
              {getAgentTypeIcon(agent.type)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-500">{getAgentTypeLabel(agent.type)}</p>
          </div>
        </div>
        
        <div className={`badge badge-${statusColor}`}>
          {getStatusLabel(agent.status)}
        </div>
      </div>

      {/* 現在のタスク */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">現在のタスク</p>
        <p className="text-sm font-medium text-gray-900">
          {agent.currentTask || '待機中'}
        </p>
      </div>

      {/* 詳細情報 */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">プロセスID</span>
          <span className="font-mono text-gray-900">
            {agent.pid ? `#${agent.pid}` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">最終確認</span>
          <span className="text-gray-700">
            {formatLastSeen(agent.lastSeen)}
          </span>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails?.(agent.id)}
          className="btn btn-secondary text-xs flex-1"
        >
          詳細表示
        </button>
        <button
          onClick={() => onStartStop?.(agent.id, agent.status === 'idle' ? 'start' : 'stop')}
          className={`btn text-xs px-3 ${
            agent.status === 'idle' 
              ? 'btn-primary' 
              : 'bg-warning text-white hover:bg-warning-600'
          }`}
          disabled={!agent.pid && agent.status !== 'idle'}
        >
          {agent.status === 'idle' ? '開始' : '停止'}
        </button>
      </div>
    </div>
  )
}