import React, { memo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'

interface TaskTimelineItem {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'in_review' | 'completed' | 'rejected'
  assignedAgent?: string
  createdAt: string
  updatedAt: string
  priority: 'low' | 'medium' | 'high'
  description?: string
  progress?: number
}

interface TaskTimelineProps {
  tasks: TaskTimelineItem[]
  onTaskClick?: (taskId: string) => void
  onChatOpen?: (task: TaskTimelineItem) => void
}

const TaskTimeline = memo(function TaskTimeline({ tasks, onTaskClick, onChatOpen }: TaskTimelineProps) {
  const getStatusIcon = (status: TaskTimelineItem['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'in_progress':
        return (
          <div className="w-8 h-8 bg-warning-50 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-warning border-t-transparent rounded-full animate-spin"></div>
          </div>
        )
      case 'in_review':
        return (
          <div className="w-8 h-8 bg-warning-50 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'completed':
        return (
          <div className="w-8 h-8 bg-success-50 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'rejected':
        return (
          <div className="w-8 h-8 bg-error-50 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-error" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const getStatusText = (status: TaskTimelineItem['status']) => {
    switch (status) {
      case 'pending':
        return 'Producer が要件を確認中'
      case 'in_progress':
        return 'Actor が実装中'
      case 'in_review':
        return 'Director がレビュー中'
      case 'completed':
        return '完了'
      case 'rejected':
        return '却下'
      default:
        return '不明'
    }
  }

  const getPriorityColor = (priority: TaskTimelineItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-error'
      case 'medium':
        return 'border-l-warning'
      case 'low':
        return 'border-l-gray-300'
      default:
        return 'border-l-gray-300'
    }
  }

  const formatTime = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) {
      return 'たった今'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分前`
    } else if (diffHours < 24) {
      return `${diffHours}時間前`
    } else if (diffDays < 7) {
      return `${diffDays}日前`
    } else {
      return date.toLocaleDateString('ja-JP')
    }
  }

  const renderTaskItem = useCallback((task: TaskTimelineItem, index: number, tasks: TaskTimelineItem[]) => {
    return (
          <div
            key={task.id}
            onClick={useCallback(() => onTaskClick?.(task.id), [onTaskClick, task.id])}
            className={`
              card p-4 border-l-4 cursor-pointer transition-all hover:shadow-md
              ${getPriorityColor(task.priority)}
              ${task.status === 'in_progress' ? 'ring-2 ring-warning ring-opacity-20' : ''}
            `}
          >
            <div className="flex items-start gap-4">
              {/* ステータスアイコン */}
              {getStatusIcon(task.status)}

              <div className="flex-1 min-w-0">
                {/* タイトルと時間 */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate pr-4">
                    {task.title}
                  </h3>
                  <time className="text-xs text-gray-500 flex-shrink-0">
                    {formatTime(task.updatedAt)}
                  </time>
                </div>


                {/* ステータスと担当者 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {getStatusText(task.status)}
                    </span>
                    {task.assignedAgent && (
                      <span className="text-xs text-gray-400">
                        担当: {task.assignedAgent}
                      </span>
                    )}
                  </div>

                  {/* 優先度 */}
                  <div className="flex items-center gap-2">
                    {task.priority === 'high' && (
                      <span className="badge badge-error text-xs">高</span>
                    )}
                    {task.priority === 'medium' && (
                      <span className="badge badge-warning text-xs">中</span>
                    )}
                  </div>
                </div>

                {/* プログレスバー（実行中の場合） */}
                {task.status === 'in_progress' && task.progress !== undefined && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">進捗</span>
                      <span className="text-xs text-gray-500">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-warning h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* チャットボタン */}
                {(task.status === 'pending' || task.status === 'in_progress') && onChatOpen && (
                  <div className="mt-3">
                    <button
                      onClick={useCallback((e: React.MouseEvent) => {
                        e.stopPropagation()
                        onChatOpen(task)
                      }, [onChatOpen, task])}
                      className="btn btn-sm btn-primary flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      AIと対話する
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
  }, [onTaskClick, onChatOpen])

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          タスクがありません
        </h3>
        <p className="text-gray-500">
          上のフォームから最初のタスクを作成しましょう
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        タスクの進行状況
      </h2>
      
      {tasks.length > 50 ? (
        <List
          height={600}
          width="100%"
          itemCount={tasks.length}
          itemSize={120}
          itemData={tasks}
        >
          {({ index, style, data }) => (
            <div style={style}>
              {renderTaskItem(data[index], index, data)}
            </div>
          )}
        </List>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => renderTaskItem(task, index, tasks))}
        </div>
      )}
    </div>
  )
})

export { TaskTimeline }