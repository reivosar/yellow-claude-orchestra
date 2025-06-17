import React, { useState } from 'react'
import { useToast } from '@/context/ToastContext'

interface Project {
  id: string
  name: string
  repository: string
  description: string
}

interface TaskRequest {
  title: string
  description: string
  projectId: string
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  requirements: string
  acceptanceCriteria: string
}

interface TaskRequestFormProps {
  projects: Project[]
  onSubmit: (request: TaskRequest) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function TaskRequestForm({ 
  projects, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: TaskRequestFormProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState<TaskRequest>({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium',
    tags: [],
    requirements: '',
    acceptanceCriteria: ''
  })

  const [currentTag, setCurrentTag] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description || !formData.projectId) {
      showToast('タイトル、説明、プロジェクトは必須項目です', 'error')
      return
    }
    onSubmit(formData)
  }

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }))
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  return (
    <div className="card p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          新しいタスクを依頼
        </h2>
        <p className="text-gray-600">
          Producer エージェントが要件を詳しく聞き取り、GitHub issue を作成します
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* タイトル */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            タスクタイトル <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="例: ユーザー認証機能の実装"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>

        {/* 概要説明 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            概要説明 <span className="text-error">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="実現したい機能や課題について簡潔に説明してください"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>

        {/* プロジェクト選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            対象プロジェクト <span className="text-error">*</span>
          </label>
          <select
            value={formData.projectId}
            onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
            <option value="">プロジェクトを選択してください</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.description}
              </option>
            ))}
          </select>
        </div>

        {/* 優先度 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            優先度
          </label>
          <div className="flex gap-4">
            {[
              { value: 'low', label: '低', color: 'gray' },
              { value: 'medium', label: '中', color: 'warning' },
              { value: 'high', label: '高', color: 'error' }
            ].map(({ value, label, color }) => (
              <label key={value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="priority"
                  value={value}
                  checked={formData.priority === value}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="text-primary focus:ring-primary"
                />
                <span className={`badge badge-${color}`}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* タグ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            タグ
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="タグを入力 (例: frontend, api, urgent)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="button"
              onClick={addTag}
              className="btn btn-secondary"
            >
              追加
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="badge badge-gray flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 詳細要件 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            詳細要件 <span className="text-gray-500">(任意)</span>
          </label>
          <textarea
            value={formData.requirements}
            onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
            placeholder="技術的要件、制約、参考資料などがあれば記載してください"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* 受け入れ条件 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            受け入れ条件 <span className="text-gray-500">(任意)</span>
          </label>
          <textarea
            value={formData.acceptanceCriteria}
            onChange={(e) => setFormData(prev => ({ ...prev, acceptanceCriteria: e.target.value }))}
            placeholder="タスク完了の条件を明確に記載してください"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Producer エージェントに送信中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                タスクを依頼
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            キャンセル
          </button>
        </div>
      </form>

      {/* ヘルプテキスト */}
      <div className="mt-6 p-4 bg-primary-50 rounded-md">
        <h4 className="text-sm font-medium text-primary mb-2">
          タスク依頼の流れ
        </h4>
        <ol className="text-sm text-primary-700 space-y-1">
          <li>1. Producer エージェントが要件の詳細を聞き取ります</li>
          <li>2. GitHub issue が自動作成されます</li>
          <li>3. Director エージェントがタスクの優先度を決定します</li>
          <li>4. Actor エージェントが実装を開始します</li>
          <li>5. 完了後、Director エージェントがレビューを行います</li>
        </ol>
      </div>
    </div>
  )
}