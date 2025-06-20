'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Navigation } from '@/components/layout/Navigation'
import { QuickTaskForm } from '@/components/modern/QuickTaskForm'
import { TaskTimeline } from '@/components/modern/TaskTimeline'
import { SystemStatus } from '@/components/modern/SystemStatus'
import { AgentCard } from '@/components/modern/AgentCard'
import { LogViewer } from '@/components/modern/LogViewer'
import { TaskManagement } from '@/components/TaskManagement'
import { ProjectSelection } from '@/components/ProjectSelection'
import { ProjectDashboard } from '@/components/modern/ProjectDashboard'
import { WelcomeGuide } from '@/components/onboarding/WelcomeGuide'
import { useWebSocket } from '@/hooks/useWebSocket'
import { ToastProvider, useToast } from '@/context/ToastContext'
import { ChatInterface } from '@/components/ChatInterface'
import { Breadcrumb } from '@/components/Breadcrumb'

type ViewType = 'dashboard' | 'logs' | 'tasks' | 'settings'

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
  progress?: number
}

interface Project {
  id: string
  name: string
  repository: string
  description: string
  status: 'active' | 'archived'
  tasksCount?: number
  lastActivity?: string
}

function DashboardContent() {
  const { logs, agents, isConnected, connectionError } = useWebSocket()
  const { showToast } = useToast()
  const [activeView, setActiveView] = useState<ViewType>('dashboard')
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showProjectSelection, setShowProjectSelection] = useState(false)
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(true)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [showTaskSidebar, setShowTaskSidebar] = useState(false)
  const [chatTask, setChatTask] = useState<Task | null>(null)
  
  // Logs view state (moved outside of renderLogsView to avoid Hooks error)
  const [projectLogs, setProjectLogs] = useState<any>(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logsError, setLogsError] = useState<string | null>(null)

  // URLパラメータからビューを取得
  const getViewFromURL = (): ViewType => {
    if (typeof window === 'undefined') return 'dashboard'
    const params = new URLSearchParams(window.location.search)
    const view = params.get('view') as ViewType
    return ['dashboard', 'logs', 'tasks', 'settings'].includes(view) ? view : 'dashboard'
  }

  // URLパラメータを更新してビューを変更
  const setActiveViewWithURL = (view: ViewType) => {
    setActiveView(view)
    const url = new URL(window.location.href)
    url.searchParams.set('view', view)
    if (selectedProject) {
      url.searchParams.set('project', selectedProject.id)
    }
    window.history.pushState({}, '', url.toString())
  }

  // プロジェクト選択とlocalStorage保存のラッパー
  const selectProject = (project: Project | null) => {
    setSelectedProject(project)
    if (project) {
      localStorage.setItem('yellow-claude-orchestra-selected-project', project.id)
      // URLにプロジェクトIDを追加
      const url = new URL(window.location.href)
      url.searchParams.set('project', project.id)
      window.history.pushState({}, '', url.toString())
    } else {
      localStorage.removeItem('yellow-claude-orchestra-selected-project')
      // URLからプロジェクトIDを削除
      const url = new URL(window.location.href)
      url.searchParams.delete('project')
      window.history.pushState({}, '', url.toString())
    }
  }

  // データを読み込み
  useEffect(() => {
    loadTasks()
    loadProjects()
    checkProjectSelection()
    
    // URLパラメータからビューを復元
    const urlView = getViewFromURL()
    setActiveView(urlView)
    
    // URLパラメータからプロジェクトIDを取得
    const params = new URLSearchParams(window.location.search)
    const urlProjectId = params.get('project')
    
    // 前回選択していたプロジェクトを復元（URL優先、次にlocalStorage）
    const targetProjectId = urlProjectId || localStorage.getItem('yellow-claude-orchestra-selected-project')
    
    if (targetProjectId) {
      // プロジェクト一覧取得後に復元するためにsetTimeoutで遅延
      setTimeout(() => {
        loadProjects().then(() => {
          // プロジェクト一覧から該当IDを探して設定
          fetch('/api/projects')
            .then(res => res.json())
            .then(data => {
              const project = data.projects?.find((p: any) => p.id === targetProjectId)
              if (project) {
                setSelectedProject(project) // 復元時はlocalStorage更新不要
                // URLパラメータも更新
                if (!urlProjectId) {
                  const url = new URL(window.location.href)
                  url.searchParams.set('project', project.id)
                  url.searchParams.set('view', urlView)
                  window.history.replaceState({}, '', url.toString())
                }
              }
            })
            .catch(() => {}) // エラーは無視
        })
      }, 100)
    }
  }, [])

  // プロジェクトが選択されている場合のみログを取得
  useEffect(() => {
    if (selectedProject && activeView === 'logs') {
      fetchProjectLogs(selectedProject.id)
    }
  }, [selectedProject, activeView])

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('タスク読み込みエラー:', error)
    }
  }

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('プロジェクト読み込みエラー:', error)
    }
  }

  const checkProjectSelection = async () => {
    try {
      // 初回アクセスの確認
      const hasVisited = localStorage.getItem('yellow-claude-orchestra-visited')
      if (!hasVisited) {
        setShowWelcomeGuide(true)
        return
      }
      setIsFirstTime(false)

      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setProjects(data.projects || [])
      
      if (data.projects && data.projects.length > 0) {
        // プロジェクトがある場合は既存の選択状態を維持
        // プロジェクトはユーザーが明示的にクリックした時のみ選択される
        // selectProject(null)  // リセットしない
      } else {
        setShowProjectSelection(true)
      }
    } catch (error) {
      console.error('プロジェクト確認エラー:', error)
      setLoadingError(error instanceof Error ? error.message : 'プロジェクト読み込みエラー')
      setShowProjectSelection(true)
    }
  }

  const handleWelcomeComplete = () => {
    localStorage.setItem('yellow-claude-orchestra-visited', 'true')
    setShowWelcomeGuide(false)
    setIsFirstTime(false)
    setShowProjectSelection(true)
  }

  // クイックタスク作成
  const handleQuickTaskSubmit = async (taskData: { title?: string; description: string }) => {
    console.log('=== QuickTask送信開始 ===')
    console.log('handleQuickTaskSubmit呼び出し:', taskData)
    console.log('選択されたプロジェクト:', selectedProject)
    console.log('プロジェクト一覧:', projects)
    
    if (!selectedProject) {
      console.log('プロジェクト未選択エラー')
      showToast('プロジェクトを選択してください', 'error')
      return
    }

    setIsSubmittingTask(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: taskData.title, // タイトルはオプション（APIでAI生成される）
          description: taskData.description,
          projectId: selectedProject.id,
          priority: 'medium',
          tags: [],
          requirements: '',
          acceptanceCriteria: ''
        })
      })

      const result = await response.json()

      if (response.ok) {
        console.log('=== タスク作成成功 ===')
        console.log('API応答:', result)
        
        // 成功時の通知
        const newTask: Task = {
          id: result.task.id,
          title: result.task.title,
          description: result.task.description,
          status: 'pending',
          priority: 'medium',
          tags: result.task.tags || [],
          requirements: result.task.requirements || '',
          acceptanceCriteria: result.task.acceptanceCriteria || '',
          createdAt: result.task.createdAt,
          updatedAt: result.task.updatedAt,
          projectId: selectedProject.id
        }
        
        setTasks(prev => [newTask, ...prev])
        
        // 成功フィードバック
        showToast('タスクが送信されました！', 'success')
        console.log('=== タスク作成完了 ===', newTask.id)
        
        // ワークスペースから依頼した場合はタスク管理画面のチャットを開く
        setActiveViewWithURL('tasks')
        setChatTask(newTask)
      } else {
        showToast(`エラー: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('タスク送信エラー:', error)
      showToast('タスクの送信に失敗しました', 'error')
    } finally {
      setIsSubmittingTask(false)
    }
  }

  const fetchProjectLogs = async (projectId: string) => {
    setLoadingLogs(true)
    setLogsError(null)
    try {
      const response = await fetch(`/api/projects/${projectId}/logs`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setProjectLogs(data)
    } catch (error) {
      console.error('ログ取得エラー:', error)
      setLogsError(error instanceof Error ? error.message : 'ログの取得に失敗しました')
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleTaskClick = (taskId: string) => {
    console.log(`タスク ${taskId} の詳細を表示`)
    // タスクのチャットインターフェースを開く
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setChatTask(task)
    }
  }

  // タスク統計を計算
  const taskCounts = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    total: tasks.length
  }

  // ダッシュボードメインビュー
  const renderDashboardView = () => {
    // プロジェクトが0個の場合はプロジェクト作成を促す
    if (projects.length === 0) {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Yellow Claude Orchestra
            </h1>
            <p className="text-lg text-gray-600">
              AIエージェントによる自動タスク処理システム
            </p>
          </div>
          <ProjectSelection
            onProjectSelect={(project) => {
              setSelectedProject(project)
              setProjects(prev => [project, ...prev.filter(p => p.id !== project.id)])
              loadProjects() // 再読み込み
            }}
            selectedProject={selectedProject}
          />
        </div>
      )
    }

    // プロジェクトが1つ以上ある場合はカード方式のダッシュボードを表示
    if (!selectedProject) {
      return (
        <div className="space-y-6">
          {/* プロジェクトダッシュボード */}
          <ProjectDashboard
            projects={projects}
            tasks={tasks}
            agents={agents}
            onTaskClick={handleTaskClick}
            onProjectSelect={(project) => {
              selectProject(project)
            }}
            onCreateProject={() => setShowProjectSelection(true)}
          />
        </div>
      )
    }

    // プロジェクトワークスペース
    const currentProject = selectedProject
    
    return (
      <div className="flex h-full">
        {/* メインワークスペース */}
        <div className="flex-1">
          {/* パンくずリスト */}
          <div className="mb-4">
            <Breadcrumb 
              items={[
                { 
                  label: 'プロジェクト一覧', 
                  onClick: () => {
                    selectProject(null)
                    setActiveView('dashboard')
                  }
                },
                { label: currentProject.name }
              ]}
            />
          </div>
          
          {/* プロジェクトヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">{currentProject.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{currentProject.name}</h1>
                  <p className="text-sm text-gray-500">プロジェクトワークスペース</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveViewWithURL('tasks')}
                className="btn btn-secondary text-sm"
              >
                タスク管理
              </button>
              <button
                onClick={() => {
                  selectProject(null)
                  setActiveViewWithURL('dashboard')
                }}
                className="btn btn-secondary text-sm"
              >
                プロジェクト変更
              </button>
            </div>
          </div>

          {/* タスク作成エリア */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                新しいタスクを依頼
              </h2>
              <p className="text-sm text-gray-600">
                AIエージェントに作業を依頼してください
              </p>
            </div>
            
            <QuickTaskForm 
              onSubmit={handleQuickTaskSubmit}
              isSubmitting={isSubmittingTask}
              projectName={currentProject?.name}
            />
          </div>

          {/* プロジェクト情報 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg max-w-4xl">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                {currentProject.repository && (
                  <a 
                    href={currentProject.repository} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 text-primary hover:text-primary-700"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                    リポジトリ
                  </a>
                )}
                <span className="text-gray-600">総タスク: {tasks.filter(t => t.projectId === currentProject.id).length}</span>
                <span className="text-gray-600">完了: {tasks.filter(t => t.projectId === currentProject.id && t.status === 'completed').length}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {agents.map(agent => (
                  <div key={agent.id} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.status === 'active' ? 'bg-success animate-pulse' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-xs text-gray-600">{agent.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    )
  }


  // ログ管理ビュー
  const renderLogsView = () => {

    return (
      <div className="space-y-6">
        {/* パンくずリスト */}
        <Breadcrumb 
          items={[
            { 
              label: 'プロジェクト一覧', 
              onClick: () => {
                selectProject(null)
                setActiveView('dashboard')
              }
            },
            ...(selectedProject ? [
              { 
                label: selectedProject.name,
                onClick: () => setActiveView('dashboard')
              }
            ] : []),
            { label: 'プロジェクトログ' }
          ]}
        />
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              プロジェクトログ
            </h2>
            {selectedProject && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedProject.name} のタスクログを表示しています
              </p>
            )}
          </div>
          {selectedProject && (
            <button
              onClick={() => fetchProjectLogs(selectedProject.id)}
              disabled={loadingLogs}
              className="btn btn-secondary text-sm"
            >
              {loadingLogs ? '読み込み中...' : 'ログを更新'}
            </button>
          )}
        </div>

        {/* プロジェクト未選択の場合 */}
        {!selectedProject && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              プロジェクトを選択してください
            </h3>
            <p className="text-gray-600 mb-4">
              プロジェクトのタスクログを表示するには、まずプロジェクトを選択してください。
            </p>
            <button
              onClick={() => setActiveView('dashboard')}
              className="btn btn-primary"
            >
              プロジェクト一覧に戻る
            </button>
          </div>
        )}

        {/* ローディング状態 */}
        {selectedProject && loadingLogs && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-4">ログを読み込み中...</p>
          </div>
        )}

        {/* エラー状態 */}
        {selectedProject && logsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              ログの読み込みに失敗しました
            </h3>
            <p className="text-red-700 mb-4">{logsError}</p>
            <button
              onClick={() => fetchProjectLogs(selectedProject.id)}
              className="btn btn-secondary"
            >
              再試行
            </button>
          </div>
        )}

        {/* ログ表示 */}
        {selectedProject && projectLogs && !loadingLogs && (
          <div className="space-y-6">
            {/* ログ統計 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{projectLogs.logs.length}</div>
                  <div className="text-sm text-gray-600">タスク</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{projectLogs.totalEntries}</div>
                  <div className="text-sm text-gray-600">ログエントリ</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">
                    {projectLogs.logs.filter((log: any) => log.entries.some((e: any) => e.agent === 'actor')).length}
                  </div>
                  <div className="text-sm text-gray-600">実行済み</div>
                </div>
              </div>
            </div>

            {/* ログがない場合 */}
            {projectLogs.logs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ログがありません
                </h3>
                <p className="text-gray-600">
                  このプロジェクトにはまだタスクログが存在しません。
                </p>
              </div>
            )}

            {/* タスクログ一覧 */}
            {projectLogs.logs.map((taskLog: any) => (
              <div
                key={taskLog.taskId}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* タスクヘッダー */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{taskLog.taskTitle}</h3>
                      <p className="text-sm text-gray-600">タスクID: {taskLog.taskId}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {taskLog.entries.length} エントリ
                    </div>
                  </div>
                </div>

                {/* ログエントリ */}
                <div className="max-h-96 overflow-y-auto">
                  {taskLog.entries.map((entry: any, index: number) => (
                    <div
                      key={index}
                      className={`px-6 py-3 border-b border-gray-100 ${
                        entry.agent === 'producer' ? 'bg-blue-50' :
                        entry.agent === 'director' ? 'bg-purple-50' :
                        entry.agent === 'actor' ? 'bg-green-50' :
                        entry.agent === 'user' ? 'bg-yellow-50' :
                        entry.agent === 'ai' ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            entry.agent === 'producer' ? 'bg-blue-100 text-blue-800' :
                            entry.agent === 'director' ? 'bg-purple-100 text-purple-800' :
                            entry.agent === 'actor' ? 'bg-green-100 text-green-800' :
                            entry.agent === 'user' ? 'bg-yellow-100 text-yellow-800' :
                            entry.agent === 'ai' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {entry.agent}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 font-mono whitespace-pre-wrap break-words">
                            {entry.message}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(entry.timestamp).toLocaleString('ja-JP')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 設定ビュー
  const renderSettingsView = () => {
    const SettingsPanel = require('@/components/SettingsPanel').SettingsPanel
    return (
      <div className="space-y-6">
        {/* パンくずリスト */}
        <Breadcrumb 
          items={[
            { 
              label: 'プロジェクト一覧', 
              onClick: () => {
                selectProject(null)
                setActiveView('dashboard')
              }
            },
            ...(selectedProject ? [
              { 
                label: selectedProject.name,
                onClick: () => setActiveView('dashboard')
              }
            ] : []),
            { label: 'システム設定' }
          ]}
        />
        
        <SettingsPanel />
      </div>
    )
  }

  const renderTasksView = () => (
    <div className="space-y-4">
      <TaskManagement initialTask={chatTask} />
    </div>
  )

  const renderContent = () => {
    // プロジェクトが選択されていない場合は、常にプロジェクト選択画面
    if (!selectedProject) {
      return renderDashboardView()
    }
    
    // プロジェクトが選択されている場合は、ワークスペースを表示
    // 他の機能（logs, settings）は必要に応じて追加できる
    switch (activeView) {
      case 'logs':
        return renderLogsView()
      case 'tasks':
        return renderTasksView()
      case 'settings':
        return renderSettingsView()
      default:
        return renderDashboardView()
    }
  }

  // エラー表示
  if (loadingError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-4">読み込みエラー</h1>
          <p className="text-gray-600 mb-4">{loadingError}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-yellow-800 mb-2">プロジェクト情報について</h3>
            <p className="text-sm text-yellow-700">
              プロジェクトデータは <code>/Users/mac/Workspace/yellow-claude-orchestra/data/projects.json</code> に保存されます。
              Claude Code CLI との連携により、実際のプロジェクトファイルも管理されます。
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        isConnected={isConnected}
        connectionError={connectionError}
        onLogoClick={() => {
          selectProject(null)
          setActiveView('dashboard')
        }}
      />
      
      <div className="flex">
        <Navigation 
          activeView={activeView}
          onViewChange={(view) => {
            if (view === 'dashboard' && !selectedProject) {
              // プロジェクト未選択の場合のみプロジェクト一覧に戻る
              selectProject(null)
              setActiveViewWithURL('dashboard')
            } else {
              // プロジェクト選択済みまたは他のビューの場合はビューのみ変更
              setActiveViewWithURL(view)
            }
          }}
          selectedProject={selectedProject}
          onBackToDashboard={() => {
            selectProject(null)
            setActiveViewWithURL('dashboard')
          }}
        />
        
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>

      {/* ウェルカムガイド */}
      {showWelcomeGuide && (
        <WelcomeGuide onComplete={handleWelcomeComplete} />
      )}
      
      {/* プロジェクト選択モーダル */}
      {showProjectSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">プロジェクト管理</h2>
                <button
                  onClick={() => setShowProjectSelection(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <ProjectSelection
                onProjectSelect={(project) => {
                  selectProject(project)
                  setProjects(prev => [project, ...prev.filter(p => p.id !== project.id)])
                  setShowProjectSelection(false)
                }}
                selectedProject={selectedProject}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default function Dashboard() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  )
}