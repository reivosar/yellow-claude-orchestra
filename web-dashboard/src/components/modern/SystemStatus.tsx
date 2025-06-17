import React from 'react'
import { AgentStatus } from '@/types/agent'

interface SystemStatusProps {
  agents: AgentStatus[]
  isConnected: boolean
  taskCounts: {
    pending: number
    in_progress: number
    completed: number
    total: number
  }
}

export function SystemStatus({ agents, isConnected, taskCounts }: SystemStatusProps) {
  const activeAgents = agents.filter(a => a.status === 'active' || a.status === 'working')
  const workingAgents = agents.filter(a => a.status === 'working')

  const getAgentTypeIcon = (type: AgentStatus['type']) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* システム状態 */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">システム状態</h3>
          <div className={`status-indicator ${isConnected ? 'status-active' : 'status-error'}`}></div>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {isConnected ? '稼働中' : '停止'}
        </div>
        <div className="text-xs text-gray-500">
          {activeAgents.length}/{agents.length} エージェント稼働
        </div>
      </div>

      {/* 進行中タスク */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">進行中</h3>
          <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="text-2xl font-bold text-warning mb-1">
          {taskCounts.in_progress}
        </div>
        <div className="text-xs text-gray-500">
          {workingAgents.length} エージェントが作業中
        </div>
      </div>

      {/* 待機中タスク */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">待機中</h3>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-2xl font-bold text-gray-600 mb-1">
          {taskCounts.pending}
        </div>
        <div className="text-xs text-gray-500">
          次に処理予定
        </div>
      </div>

      {/* 完了タスク */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">今日の完了</h3>
          <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="text-2xl font-bold text-success mb-1">
          {taskCounts.completed}
        </div>
        <div className="text-xs text-gray-500">
          合計 {taskCounts.total} タスク
        </div>
      </div>

      {/* エージェント一覧（コンパクト表示） */}
      <div className="card p-4 md:col-span-2 lg:col-span-4">
        <h3 className="text-sm font-medium text-gray-600 mb-3">エージェント状況</h3>
        <div className="flex items-center gap-4 overflow-x-auto">
          {agents.map(agent => (
            <div key={agent.id} className="flex items-center gap-2 flex-shrink-0">
              <span className="text-lg">{getAgentTypeIcon(agent.type)}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {agent.name}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`status-indicator ${
                    agent.status === 'active' || agent.status === 'working' ? 'status-active' : 'status-idle'
                  }`}></div>
                  <span className="text-xs text-gray-500">
                    {agent.status === 'working' ? '作業中' : 
                     agent.status === 'active' ? '待機中' : '停止'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}