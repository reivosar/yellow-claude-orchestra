'use client'

import { AgentStatus } from '@/types/agent'

interface AgentStatusCardProps {
  agent: AgentStatus
  className?: string
}

export function AgentStatusCard({ agent, className = '' }: AgentStatusCardProps) {
  // ステータスに応じたスタイル
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active'
      case 'working':
        return 'status-working'
      case 'idle':
        return 'status-idle'
      case 'error':
        return 'status-error'
      case 'offline':
        return 'status-offline'
      default:
        return 'status-idle'
    }
  }

  // エージェントタイプに応じたアイコン
  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'producer':
        return '🎬'
      case 'director':
        return '🎭'
      case 'actor':
        return '👨‍💻'
      default:
        return '🤖'
    }
  }

  // エージェントタイプに応じた説明
  const getAgentDescription = (type: string) => {
    switch (type) {
      case 'producer':
        return '要件聞き取り・issue作成'
      case 'director':
        return 'タスク管理・レビュー'
      case 'actor':
        return '実装作業・コーディング'
      default:
        return 'システムエージェント'
    }
  }

  // ステータスの日本語表示
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'アクティブ'
      case 'working':
        return '作業中'
      case 'idle':
        return '待機中'
      case 'error':
        return 'エラー'
      case 'offline':
        return 'オフライン'
      default:
        return '不明'
    }
  }

  // 最終確認時刻
  const formatLastSeen = (timestamp: string) => {
    const now = new Date()
    const lastSeen = new Date(timestamp)
    const diffMs = now.getTime() - lastSeen.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    
    if (diffSeconds < 60) {
      return `${diffSeconds}秒前`
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}分前`
    } else {
      return lastSeen.toLocaleTimeString('ja-JP')
    }
  }

  return (
    <div className={`orchestra-card ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getAgentIcon(agent.type)}</span>
          <div>
            <h4 className="font-semibold text-gray-100">{agent.name}</h4>
            <p className="text-sm text-gray-400">{getAgentDescription(agent.type)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`status-indicator ${getStatusStyle(agent.status)}`}></div>
          <span className="text-sm text-gray-300">{getStatusText(agent.status)}</span>
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="space-y-2">
        {/* 現在のタスク */}
        {agent.currentTask && (
          <div>
            <span className="text-sm text-gray-500">現在のタスク:</span>
            <p className="text-sm text-gray-300 mt-1 p-2 bg-gray-700 rounded">
              {agent.currentTask}
            </p>
          </div>
        )}

        {/* メタ情報 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">ID:</span>
            <span className="text-gray-300 ml-2 font-mono">{agent.id}</span>
          </div>
          {agent.pid && (
            <div>
              <span className="text-gray-500">PID:</span>
              <span className="text-gray-300 ml-2 font-mono">{agent.pid}</span>
            </div>
          )}
        </div>

        {/* 最終確認 */}
        <div className="text-sm">
          <span className="text-gray-500">最終確認:</span>
          <span className="text-gray-300 ml-2">{formatLastSeen(agent.lastSeen)}</span>
        </div>
      </div>

      {/* エラー時の詳細 */}
      {agent.status === 'error' && (
        <div className="mt-3 p-2 bg-red-900 border border-red-700 rounded text-sm">
          <span className="text-red-300">⚠️ エラーが発生しています</span>
        </div>
      )}
    </div>
  )
}