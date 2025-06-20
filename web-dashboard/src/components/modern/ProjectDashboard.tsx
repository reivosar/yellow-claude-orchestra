import React, { useState, useEffect } from 'react'
import { AgentStatus } from '@/types/agent'

interface Project {
  id: string
  name: string
  repository: string
  description: string
  status: 'active' | 'archived'
  tasksCount?: number
  lastActivity?: string
}

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'in_review' | 'completed' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  requirements: string
  acceptanceCriteria: string
  assignedAgent?: string
  createdAt: string
  updatedAt: string
  projectId: string
}

interface ProjectDashboardProps {
  projects: Project[]
  tasks: Task[]
  agents: AgentStatus[]
  onTaskClick: (taskId: string) => void
  onProjectSelect: (project: Project) => void
  onCreateProject?: () => void
}

export function ProjectDashboard({ 
  projects, 
  tasks, 
  agents, 
  onTaskClick, 
  onProjectSelect,
  onCreateProject
}: ProjectDashboardProps) {
  const [expandedProject, setExpandedProject] = useState<string | null>(null)

  // プロジェクト別にタスクをグループ化
  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId)
  }

  // プロジェクトの統計情報を計算
  const getProjectStats = (projectId: string) => {
    const projectTasks = getProjectTasks(projectId)
    return {
      total: projectTasks.length,
      pending: projectTasks.filter(t => t.status === 'pending').length,
      inProgress: projectTasks.filter(t => t.status === 'in_progress').length,
      completed: projectTasks.filter(t => t.status === 'completed').length,
      rejected: projectTasks.filter(t => t.status === 'rejected').length
    }
  }

  // プロジェクトで作業中のエージェント
  const getWorkingAgents = (projectId: string) => {
    const projectTasks = getProjectTasks(projectId)
    const workingTasks = projectTasks.filter(t => t.status === 'in_progress')
    const agentIds = Array.from(new Set(workingTasks.map(t => t.assignedAgent).filter(Boolean)))
    return agents.filter(agent => agentIds.includes(agent.id))
  }

  // 最近の活動を取得
  const getRecentActivity = (projectId: string) => {
    const projectTasks = getProjectTasks(projectId)
    return projectTasks
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500'
      case 'in_progress': return 'text-gray-700'
      case 'in_review': return 'text-gray-600'
      case 'completed': return 'text-gray-800'
      case 'rejected': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      case 'in_progress':
        return <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></div>
      case 'in_review':
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
      case 'completed':
        return <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
      case 'rejected':
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
    }
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          プロジェクトがありません
        </h3>
        <p className="text-gray-500">
          最初のプロジェクトを作成してタスク管理を始めましょう
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          プロジェクト一覧
        </h2>
        <div className="flex items-center justify-center gap-6 text-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="font-semibold text-primary">{projects.length}</span>
            <span className="text-gray-600">プロジェクト</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="font-semibold text-gray-700">{tasks.length}</span>
            <span className="text-gray-600">総タスク</span>
          </div>
        </div>
      </div>

      {/* プロジェクトカードグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map(project => {
          const stats = getProjectStats(project.id)
          const workingAgents = getWorkingAgents(project.id)
          const recentTasks = getRecentActivity(project.id)

          return (
            <div
              key={project.id}
              className="card p-6 transition-all duration-200 hover:shadow-xl border-2 hover:border-primary group"
            >
              {/* プロジェクトヘッダー */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-2">
                      {project.name}
                    </h3>
                    <span className={`badge ${project.status === 'active' ? 'badge-success' : 'badge-gray'} text-xs`}>
                      {project.status === 'active' ? 'アクティブ' : 'アーカイブ'}
                    </span>
                  </div>
                  <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                )}
              </div>

              {/* 統計情報 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-xs font-medium text-gray-600">総タスク</div>
                </div>
                <div className="text-center p-3 bg-warning-50 rounded-lg">
                  <div className="text-2xl font-bold text-warning">{stats.inProgress}</div>
                  <div className="text-xs font-medium text-warning-700">進行中</div>
                </div>
              </div>

              {/* 進捗バー */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>進捗</span>
                  <span>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-success h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* エージェント状況 */}
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-700 mb-2">エージェント状況</div>
                {agents.length > 0 ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    {agents.slice(0, 3).map(agent => {
                      const getStatusColor = () => {
                        switch (agent.status) {
                          case 'active':
                          case 'working':
                            return 'bg-gray-100 text-gray-700'
                          case 'idle':
                            return 'bg-gray-50 text-gray-700'
                          case 'error':
                            return 'bg-gray-100 text-gray-700'
                          default:
                            return 'bg-gray-50 text-gray-700'
                        }
                      }
                      
                      const getStatusDot = () => {
                        switch (agent.status) {
                          case 'active':
                          case 'working':
                            return 'bg-gray-600'
                          case 'idle':
                            return 'bg-gray-400'
                          case 'error':
                            return 'bg-gray-500'
                          default:
                            return 'bg-gray-400'
                        }
                      }

                      return (
                        <div key={agent.id} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor()}`}>
                          <div className={`w-2 h-2 rounded-full ${getStatusDot()} ${agent.status === 'active' ? 'animate-pulse' : ''}`}></div>
                          <span className="font-medium">
                            {agent.type === 'system' ? 'SYS' : 
                             agent.type === 'producer' ? 'PRD' : 
                             agent.type === 'director' ? 'DIR' : 'ACT'}
                          </span>
                          <span>{agent.name}</span>
                        </div>
                      )
                    })}
                    {agents.length > 3 && (
                      <span className="text-xs text-gray-500">+{agents.length - 3}</span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">エージェント未接続</div>
                )}
              </div>

              {/* 最近の活動 */}
              <div className="border-t pt-3">
                <div className="text-xs font-medium text-gray-700 mb-2">最近の活動</div>
                {recentTasks.length > 0 ? (
                  <div className="space-y-1">
                    {recentTasks.slice(0, 2).map(task => (
                      <button
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskClick(task.id)
                        }}
                        className="flex items-center gap-2 w-full text-left hover:bg-gray-50 p-1 -m-1 rounded transition-colors"
                      >
                        {getStatusIcon(task.status)}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {task.title}
                          </div>
                        </div>
                      </button>
                    ))}
                    {recentTasks.length > 2 && (
                      <div className="text-xs text-gray-500">+{recentTasks.length - 2} その他</div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">まだタスクがありません</div>
                )}
              </div>

              {/* フッター */}
              <div className="pt-3 border-t mt-3 space-y-3">
                <div className="text-xs text-gray-400">
                  {project.repository && `${project.repository}`}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onProjectSelect(project)
                  }}
                  className="w-full px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
                >
                  タスクを依頼する
                </button>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* 新しいプロジェクトを作成ボタン */}
      <div className="text-center pt-6">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onCreateProject?.()
          }}
          className="btn btn-secondary"
        >
          新しいプロジェクトを作成
        </button>
      </div>
    </div>
  )
}