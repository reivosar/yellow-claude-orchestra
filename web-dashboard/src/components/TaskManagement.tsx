import React, { useState, useEffect } from 'react'
import { TaskRequestForm } from './TaskRequestForm'
import { useToast } from '@/context/ToastContext'

interface Project {
  id: string
  name: string
  repository: string
  description: string
}

interface Task {
  id: string
  title: string
  description: string
  projectId: string
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  requirements: string
  acceptanceCriteria: string
  status: 'pending' | 'in_progress' | 'in_review' | 'completed' | 'rejected'
  assignedAgent?: string
  createdAt: string
  updatedAt: string
  githubIssueUrl?: string
}

interface TaskManagementProps {
  initialTask?: Task | null
}

export function TaskManagement({ initialTask }: TaskManagementProps) {
  const { showToast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // フィルター状態
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | Task['status'],
    priority: 'all' as 'all' | Task['priority'],
    project: 'all' as 'all' | string,
    search: ''
  })
  
  // ソート状態
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Task | null
    direction: 'asc' | 'desc'
  }>({
    key: null,
    direction: 'asc'
  })
  
  // ページング状態
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // 詳細表示状態
  const [showDetailView, setShowDetailView] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskProgress, setTaskProgress] = useState<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  // データ読み込み
  useEffect(() => {
    loadData()
    
    // タスク詳細を開くイベントリスナーを追加
    const handleOpenTaskDetail = (event: any) => {
      const taskId = event.detail?.taskId
      if (taskId) {
        // データが読み込まれた後にタスクを探す
        setTimeout(() => {
          loadData().then(() => {
            const task = tasks.find(t => t.id === taskId)
            if (task) {
              handleTaskDetailOpen(task)
            }
          })
        }, 100)
      }
    }
    
    window.addEventListener('openTaskDetail', handleOpenTaskDetail)
    
    return () => {
      window.removeEventListener('openTaskDetail', handleOpenTaskDetail)
    }
  }, [])
  
  // tasksが更新された時にイベントを再チェック
  useEffect(() => {
    const handleOpenTaskDetail = (event: any) => {
      const taskId = event.detail?.taskId
      if (taskId && tasks.length > 0) {
        const task = tasks.find(t => t.id === taskId)
        if (task) {
          handleTaskDetailOpen(task)
          // イベントリスナーを削除してリピートを防ぐ
          window.removeEventListener('openTaskDetail', handleOpenTaskDetail)
        }
      }
    }
    
    window.addEventListener('openTaskDetail', handleOpenTaskDetail)
    
    return () => {
      window.removeEventListener('openTaskDetail', handleOpenTaskDetail)
    }
  }, [tasks])
  
  // initialTaskが設定されたら自動的に開く
  useEffect(() => {
    if (initialTask && tasks.length > 0) {
      const task = tasks.find(t => t.id === initialTask.id)
      if (task) {
        handleTaskDetailOpen(task)
      }
    }
  }, [initialTask, tasks])

  const loadData = async () => {
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()
      setTasks(data.tasks || [])
      setProjects(data.projects || [])
    } catch (error) {
      console.error('データ読み込みエラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaskSubmit = async (taskRequest: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskRequest)
      })

      const result = await response.json()

      if (response.ok) {
        showToast('タスクが正常に作成され、Producer エージェントに送信されました！', 'success')
        setShowRequestForm(false)
        loadData() // データを再読み込み
      } else {
        showToast(`エラー: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('タスク送信エラー:', error)
      showToast('タスクの送信に失敗しました', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return 'gray'
      case 'in_progress':
        return 'gray'
      case 'in_review':
        return 'gray'
      case 'completed':
        return 'gray'
      case 'rejected':
        return 'gray'
      default:
        return 'gray'
    }
  }

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return '待機中'
      case 'in_progress':
        return '実装中'
      case 'in_review':
        return 'レビュー中'
      case 'completed':
        return '完了'
      case 'rejected':
        return '却下'
      default:
        return '不明'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'gray'
      case 'medium':
        return 'gray'
      case 'low':
        return 'gray'
      default:
        return 'gray'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP')
  }

  // タスクの進行状況を取得
  const loadTaskProgress = async (taskId: string) => {
    setLoadingProgress(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/logs`)
      if (response.ok) {
        const progress = await response.json()
        setTaskProgress(progress)
      } else {
        console.error('進行状況の取得に失敗しました')
        setTaskProgress(null)
      }
    } catch (error) {
      console.error('進行状況取得エラー:', error)
      setTaskProgress(null)
    } finally {
      setLoadingProgress(false)
    }
  }

  // タスク詳細を開く時に進行状況も取得
  const handleTaskDetailOpen = (task: Task) => {
    console.log('Selected task:', task)
    setSelectedTask(task)
    setShowDetailView(true)
    loadTaskProgress(task.id)
  }

  // 一覧に戻る
  const handleBackToList = () => {
    setShowDetailView(false)
    setSelectedTask(null)
    setTaskProgress(null)
    setMessageInput('')
  }

  // メッセージ送信
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedTask || sendingMessage) return

    setSendingMessage(true)
    const userMessage = messageInput
    
    try {
      // 一旦チャット欄にユーザーメッセージを追加表示
      const tempUserMessage = {
        type: 'user_message',
        message: userMessage,
        timestamp: new Date().toISOString(),
        agent: 'user'
      }
      
      if (taskProgress) {
        setTaskProgress({
          ...taskProgress,
          logs: [...(taskProgress.logs || []), tempUserMessage]
        })
      }
      
      // プロジェクトIDを取得（selectedTaskから取得できない場合は最初のプロジェクトIDを使用）
      let projectId = selectedTask.projectId
      if (!projectId && projects.length > 0) {
        projectId = projects[0].id
      }
      
      console.log('Sending message with projectId:', projectId)
      
      // APIエンドポイントにメッセージを送信
      const response = await fetch(`/api/tasks/${selectedTask.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage })
      })
      
      const result = await response.json()

      if (response.ok) {
        showToast('メッセージがProducerエージェントに送信されました！', 'success')
        setMessageInput('')
        
        // ポーリング開始（リアルタイム更新）
        let pollCount = 0
        const maxPolls = 10
        const pollInterval = setInterval(() => {
          loadTaskProgress(selectedTask.id)
          pollCount++
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval)
          }
        }, 1000)
      } else {
        showToast(`エラー: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('メッセージ送信エラー:', error)
      showToast('メッセージの送信に失敗しました', 'error')
    } finally {
      setSendingMessage(false)
    }
  }

  // ソート関数
  const handleSort = (key: keyof Task) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
    setCurrentPage(1) // ソート時は1ページ目に戻る
  }

  // フィルタリングとソートされたタスク
  const processedTasks = tasks
    .filter(task => {
      // ステータスフィルター
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false
      }
      
      // 優先度フィルター
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false
      }
      
      // プロジェクトフィルター
      if (filters.project !== 'all' && task.projectId !== filters.project) {
        return false
      }
      
      // 検索フィルター
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        return (
          task.title.toLowerCase().includes(searchTerm) ||
          task.description.toLowerCase().includes(searchTerm)
        )
      }
      
      return true
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0
      
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })

  // ページング処理
  const totalItems = processedTasks.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTasks = processedTasks.slice(startIndex, startIndex + itemsPerPage)

  // フィルターリセット
  const resetFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all', 
      project: 'all',
      search: ''
    })
  }

  if (showRequestForm) {
    return (
      <TaskRequestForm
        projects={projects}
        onSubmit={handleTaskSubmit}
        onCancel={() => setShowRequestForm(false)}
        isSubmitting={isSubmitting}
      />
    )
  }

  // タスク詳細表示
  if (showDetailView && selectedTask) {
    return (
      <div className="space-y-6">
        {/* パンくずナビゲーション */}
        <nav className="flex items-center text-sm text-gray-600" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <button 
            onClick={() => {
              // プロジェクト一覧に戻る処理
              window.dispatchEvent(new CustomEvent('navigate-to-projects'))
            }}
            className="hover:text-gray-800 transition-colors text-blue-600 hover:text-blue-800"
          >
            プロジェクト一覧
          </button>
          <span className="mx-1 text-gray-400">/</span>
          <button 
            onClick={() => {
              // プロジェクトダッシュボードに戻る処理
              window.dispatchEvent(new CustomEvent('navigate-to-project-dashboard'))
            }}
            className="hover:text-gray-800 transition-colors text-blue-600 hover:text-blue-800"
          >
            SafeSy
          </button>
          <span className="mx-1 text-gray-400">/</span>
          <button
            onClick={handleBackToList}
            className="hover:text-gray-800 transition-colors text-blue-600 hover:text-blue-800"
          >
            タスク管理
          </button>
          <span className="mx-1 text-gray-400">/</span>
          <span className="text-gray-900 font-medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedTask.title}
          </span>
        </nav>

        {/* チャット形式のやりとり */}
        <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-[calc(100vh-200px)]">
          {loadingProgress && (
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">エージェントとのやりとりを読み込み中...</span>
              </div>
            </div>
          )}
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* 初期メッセージ（ユーザーが送信したタスク） */}
            <div className="mb-4">
              <div className="flex items-start gap-3 justify-end">
                <div className="flex-1 max-w-[80%]">
                  <div className="bg-gray-800 text-white rounded-lg p-3 ml-auto">
                    <p className="text-sm">{selectedTask.title}</p>
                    {selectedTask.description && (
                      <p className="text-sm mt-1 opacity-90">{selectedTask.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* エージェントメッセージとログを時系列でマージして表示 */}
            {!taskProgress ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-2.58-.374l-5.34 1.781a.75.75 0 01-.936-.936l1.781-5.34A8.959 8.959 0 013 12a8 8 0 018-8c4.418 0 8 3.582 8 8z" />
                  </svg>
                </div>
                <p className="text-gray-500">エージェントがタスクを処理中です...</p>
              </div>
            ) : (
              <>
                {(() => {
                  const userMessages = (taskProgress.logs || [])
                    .filter((log: any) => log.agent === 'user' && log.message.startsWith('User: '))
                    .map((log: any) => ({
                      ...log,
                      type: 'user_message',
                      message: log.message.replace('User: ', '')
                    }))
                  
                  const aiMessages = (taskProgress.logs || [])
                    .filter((log: any) => log.agent === 'ai' && log.message.startsWith('AI: '))
                    .map((log: any) => ({
                      ...log,
                      type: 'ai_message',
                      message: log.message.replace('AI: ', '')
                    }))
                  
                  // 重複を削除（メッセージ内容とタイムスタンプで判定）
                  const allMessagesRaw = [
                    ...userMessages,
                    ...aiMessages
                  ]
                  
                  const allMessages = allMessagesRaw
                    .filter((msg, index, arr) => {
                      return arr.findIndex(m => 
                        m.message === msg.message && 
                        Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 1000
                      ) === index
                    })
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

                  if (allMessages.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3.75M9 15h3.75M9 18h3.75m3-15v18a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5v-18A2.25 2.25 0 016.75 1.5h9.75A2.25 2.25 0 0118.75 3.75z" />
                          </svg>
                        </div>
                        <p className="text-gray-500">
                          {selectedTask.status === 'completed' 
                            ? 'タスクは完了しましたが、詳細なやりとりは記録されていません'
                            : selectedTask.status === 'pending'
                            ? 'タスクは待機中です'
                            : 'エージェントがタスクを処理中です...'
                          }
                        </p>
                      </div>
                    )
                  }

                  return allMessages.map((item: any, index: number) => {
                    const isAgentMessage = item.type === 'agent_message'
                    const isUserMessage = item.type === 'user_message'
                    const isAiMessage = item.type === 'ai_message'
                    const agentName = isAgentMessage ? item.from : (item.agent || 'system')
                    const agentInitial = agentName.charAt(0).toUpperCase()
                    
                    if (isUserMessage) {
                      // ユーザーメッセージは右側に表示（Claudeスタイル）
                      return (
                        <div key={index} className="mb-4">
                          <div className="flex items-start gap-3 justify-end">
                            <div className="flex-1 max-w-[80%]">
                              <div className="bg-gray-800 text-white rounded-lg p-3 ml-auto">
                                <p className="text-sm">{item.message}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    return (
                      <div key={index} className="mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium bg-blue-500">
                            AI
                          </div>
                          <div className="flex-1">
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              {isAiMessage ? (
                                <p className="text-sm text-gray-900">{item.message}</p>
                              ) : isAgentMessage ? (
                                (() => {
                                  if (item.data && typeof item.data === 'object') {
                                    if (item.data.result) {
                                      // タスク結果の場合
                                      return (
                                        <p className="text-sm text-gray-900">{item.data.result}</p>
                                      )
                                    } else if (item.data.title) {
                                      // タスクデータの場合はタイトルのみ表示
                                      return (
                                        <p className="text-sm text-gray-900">{item.data.title}</p>
                                      )
                                    }
                                  }
                                  
                                  // その他のメッセージタイプ
                                  if (item.type === 'task_completion' || item.type === 'task_result') {
                                    return (
                                      <p className="text-sm text-gray-900">
                                        {item.data?.result || 'タスクが完了しました'}
                                      </p>
                                    )
                                  }
                                  
                                  // 基本的なメッセージ表示
                                  return (
                                    <p className="text-sm text-gray-900">
                                      {JSON.stringify(item.data || item, null, 2)}
                                    </p>
                                  )
                                })()
                              ) : (
                                <p className="text-sm text-gray-900">{item.message}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </>
            )}
          </div>
          
          {/* チャット入力欄 */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="AIエージェントに追加の指示を送信..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                disabled={sendingMessage}
              />
              <button
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageInput.trim()}
              >
                {sendingMessage ? '送信中...' : '送信'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            タスク管理
          </h2>
          <p className="text-gray-600 mt-1">
            Producer-Director-Actor システムでタスクを管理
          </p>
        </div>
        <button
          onClick={() => setShowRequestForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新しいタスクを依頼
        </button>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* 検索 */}
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="タスクを検索..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          {/* ステータスフィルター */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">全ステータス</option>
              <option value="pending">待機中</option>
              <option value="in_progress">実装中</option>
              <option value="in_review">レビュー中</option>
              <option value="completed">完了</option>
              <option value="rejected">却下</option>
            </select>
          </div>
          
          {/* 優先度フィルター */}
          <div>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">全優先度</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          
          {/* プロジェクトフィルター */}
          <div>
            <select
              value={filters.project}
              onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">全プロジェクト</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* リセットボタン */}
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            リセット
          </button>
          
          {/* 結果表示 */}
          <div className="text-sm text-gray-500">
            {totalItems} / {tasks.length} 件
          </div>
        </div>
      </div>

      {/* タスク統計 */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { status: 'pending', label: '待機中', color: 'gray' },
          { status: 'in_progress', label: '実装中', color: 'warning' },
          { status: 'in_review', label: 'レビュー中', color: 'warning' },
          { status: 'completed', label: '完了', color: 'success' },
          { status: 'rejected', label: '却下', color: 'error' }
        ].map(({ status, label, color }) => {
          const count = processedTasks.filter(t => t.status === status).length
          return (
            <div 
              key={status} 
              className="card p-4 text-center cursor-pointer transition-colors relative hover:bg-gray-50"
              onClick={() => setFilters(prev => ({ ...prev, status: status as any }))}
            >
              {filters.status === status && (
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: '#f97316' }}></div>
              )}
              <div className={`text-2xl font-bold mb-1 ${
                filters.status === status ? '' : `text-${color}`
              }`}>
                {count}
              </div>
              <div className={`text-sm ${
                filters.status === status ? '' : 'text-gray-600'
              }`}>{label}</div>
            </div>
          )
        })}
      </div>

      {/* タスク一覧 */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">タスクを読み込み中...</p>
        </div>
      ) : totalItems === 0 ? (
        <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              タスクがありません
            </h3>
            <p className="text-gray-600 mb-4">
              最初のタスクを作成して、エージェントシステムを始動しましょう
            </p>
            <button
              onClick={() => setShowRequestForm(true)}
              className="btn btn-primary"
            >
              タスクを作成
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-1">
                        タスク
                        {sortConfig.key === 'title' && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        ステータス
                        {sortConfig.key === 'status' && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('priority')}
                    >
                      <div className="flex items-center gap-1">
                        優先度
                        {sortConfig.key === 'priority' && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1">
                        作成日
                        {sortConfig.key === 'createdAt' && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTasks.map((task, index) => {
                    const project = projects.find(p => p.id === task.projectId)
                    return (
                      <tr key={task.id} className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {task.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-${getStatusColor(task.status)} ${task.status === 'in_progress' ? 'animate-pulse' : ''}`}></div>
                            <span className={`badge badge-${getStatusColor(task.status)}`}>
                              {getStatusLabel(task.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge badge-${getPriorityColor(task.priority)}`}>
                            {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {new Date(task.createdAt).toLocaleString('ja-JP')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {task.githubIssueUrl && (
                              <a
                                href={task.githubIssueUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary-700 text-sm"
                              >
                                GitHub
                              </a>
                            )}
                            <button 
                              onClick={() => handleTaskDetailOpen(task)}
                              className="text-primary hover:text-primary-700 text-sm"
                            >
                              詳細
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* ページング */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} / {totalItems} 件表示
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      前へ
                    </button>
                    
                    {/* ページ番号 */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              currentPage === pageNum
                                ? 'bg-primary text-white border-primary'
                                : 'border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      次へ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
      )}

    </div>
  )
}