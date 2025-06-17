import React, { useState, useEffect } from 'react'
import { ImportProjectDialog } from './ImportProjectDialog'
import { useToast } from '@/context/ToastContext'

interface Project {
  id: string
  name: string
  repository: string
  description: string
  status: 'active' | 'archived'
  tasksCount?: number
  lastActivity?: string
}

interface ProjectSelectionProps {
  onProjectSelect: (project: Project) => void
  selectedProject?: Project | null
  compact?: boolean
  onShowFullSelection?: () => void
}

export function ProjectSelection({ onProjectSelect, selectedProject, compact = false, onShowFullSelection }: ProjectSelectionProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newProject, setNewProject] = useState({
    name: '',
    repository: '',
    description: '',
    agents: {
      maxActors: 3,
      enabledAgents: ['producer', 'director', 'actor']
    }
  })
  const { showToast } = useToast()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('プロジェクト読み込みエラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.name.trim()) {
      showToast('プロジェクト名は必須です', 'error')
      return
    }
    
    if (!newProject.agents.enabledAgents.includes('producer')) {
      showToast('Producerエージェントは必須です', 'error')
      return
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      })

      const result = await response.json()
      if (response.ok) {
        const createdProject = result.project
        setProjects(prev => [createdProject, ...prev])
        onProjectSelect(createdProject)
        setShowCreateForm(false)
        setNewProject({ 
          name: '', 
          repository: '', 
          description: '',
          agents: {
            maxActors: 3,
            enabledAgents: ['producer', 'director', 'actor']
          }
        })
        
        const setupInfo = result.setup
        const message = setupInfo 
          ? `プロジェクトを作成しました！\n📁 プロジェクトディレクトリ: ${setupInfo.projectDir}\n📝 CLAUDE.md: ${setupInfo.claudeFile}`
          : 'プロジェクトを作成しました！'
        
        showToast(message, 'success')
      } else {
        showToast(`エラー: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('プロジェクト作成エラー:', error)
      showToast('プロジェクトの作成に失敗しました', 'error')
    }
  }

  const handleImportProject = async (projectPath: string, metadata: { name: string; description: string }) => {
    try {
      const response = await fetch('/api/projects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, metadata })
      })

      const result = await response.json()
      if (response.ok) {
        const importedProject = result.project
        setProjects(prev => [importedProject, ...prev])
        onProjectSelect(importedProject)
        setShowImportDialog(false)
        
        const importInfo = result.import
        const message = importInfo?.created 
          ? `プロジェクトをインポートしました！\n📝 CLAUDE.md: ${importInfo.claudeFile}\n${importInfo.message}`
          : `プロジェクトをインポートしました！\n${importInfo?.message || ''}`
        
        showToast(message, 'success')
      } else {
        showToast(`エラー: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('プロジェクトインポートエラー:', error)
      showToast('プロジェクトのインポートに失敗しました', 'error')
    }
  }

  if (compact && selectedProject) {
    return (
      <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <div className="font-medium text-primary">{selectedProject.name}</div>
          <div className="text-sm text-primary-600">{selectedProject.description}</div>
        </div>
        <button
          onClick={() => {
            if (onShowFullSelection) {
              onShowFullSelection()
            } else {
              setShowCreateForm(true)
            }
          }}
          className="btn btn-secondary text-sm ml-auto"
        >
          変更
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">プロジェクトを読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          プロジェクトを選択
        </h2>
        <p className="text-gray-600">
          タスクを管理するプロジェクトを選択するか、新しく作成してください
        </p>
      </div>

      {/* 新規作成フォーム */}
      {showCreateForm && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            新しいプロジェクトを作成
          </h3>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロジェクト名 <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例: ECサイト開発"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                リポジトリ名 <span className="text-gray-500">(任意)</span>
              </label>
              <input
                type="text"
                value={newProject.repository}
                onChange={(e) => setNewProject(prev => ({ ...prev, repository: e.target.value }))}
                placeholder="例: my-ecommerce-site"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明 <span className="text-gray-500">(任意)</span>
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="プロジェクトの概要を入力"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            {/* エージェント設定 */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">エージェント設定</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大Actor数
                  </label>
                  <select
                    value={newProject.agents.maxActors}
                    onChange={(e) => setNewProject(prev => ({
                      ...prev,
                      agents: { ...prev.agents, maxActors: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value={1}>1個</option>
                    <option value={2}>2個</option>
                    <option value={3}>3個</option>
                    <option value={5}>5個</option>
                    <option value={7}>7個</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    有効なエージェント
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'producer', label: 'Producer (要件管理)' },
                      { key: 'director', label: 'Director (タスク分解)' },
                      { key: 'actor', label: 'Actor (実装)' }
                    ].map(agent => (
                      <label key={agent.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newProject.agents.enabledAgents.includes(agent.key)}
                          onChange={(e) => {
                            const agents = e.target.checked
                              ? [...newProject.agents.enabledAgents, agent.key]
                              : newProject.agents.enabledAgents.filter(a => a !== agent.key)
                            setNewProject(prev => ({
                              ...prev,
                              agents: { ...prev.agents, enabledAgents: agents }
                            }))
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{agent.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary flex-1">
                プロジェクトを作成
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn btn-secondary"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* プロジェクト一覧 */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            プロジェクトがありません
          </h3>
          <p className="text-gray-600 mb-4">
            最初のプロジェクトを作成してタスク管理を始めましょう
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            プロジェクトを作成
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              既存のプロジェクト
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportDialog(true)}
                className="btn btn-secondary text-sm"
              >
                📁 既存をインポート
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-primary text-sm"
              >
                + 新規作成
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => onProjectSelect(project)}
                className={`
                  card p-4 cursor-pointer transition-all hover:shadow-md
                  ${selectedProject?.id === project.id 
                    ? 'ring-2 ring-primary border-primary bg-primary-50' 
                    : 'hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${selectedProject?.id === project.id 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{project.name}</h4>
                      {project.repository && (
                        <p className="text-sm text-gray-500">{project.repository}</p>
                      )}
                    </div>
                  </div>
                  {selectedProject?.id === project.id && (
                    <div className="badge badge-success text-xs">選択中</div>
                  )}
                </div>

                {project.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {project.tasksCount || 0} タスク
                  </span>
                  <span className={`badge ${project.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                    {project.status === 'active' ? 'アクティブ' : 'アーカイブ'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* インポートダイアログ */}
      {showImportDialog && (
        <ImportProjectDialog
          onImport={handleImportProject}
          onCancel={() => setShowImportDialog(false)}
        />
      )}
    </div>
  )
}