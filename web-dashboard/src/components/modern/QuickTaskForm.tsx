import React, { useState } from 'react'

interface QuickTaskFormProps {
  onSubmit: (task: { title?: string; description: string }) => void
  isSubmitting?: boolean
  projectName?: string
}

export function QuickTaskForm({ onSubmit, isSubmitting = false, projectName }: QuickTaskFormProps) {
  const [description, setDescription] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customTitle, setCustomTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('QuickTaskForm送信:', { customTitle, description })
    if (!description.trim()) {
      console.log('説明が空のため送信中止')
      return
    }
    
    console.log('onSubmit呼び出し')
    onSubmit({
      title: customTitle.trim() || undefined,
      description: description.trim()
    })
    
    setDescription('')
    setCustomTitle('')
    setShowAdvanced(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* 説明入力 */}
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="何を作りたいですか？ (例: GitHubのイシュー一覧を表示して、各イシューの状態やラベルが見えるようにしてください)"
            rows={3}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {/* カスタムタイトル入力（オプション） */}
        {showAdvanced && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カスタムタイトル（任意）
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="自動生成されます（カスタマイズしたい場合のみ入力）"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!showAdvanced && (
              <button
                type="button"
                onClick={() => setShowAdvanced(true)}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                + 詳細設定
              </button>
            )}
            <span className="text-xs text-gray-500">
              ⌘+Enter で送信
            </span>
          </div>

          <div className="flex items-center gap-2">
            {showAdvanced && (
              <button
                type="button"
                onClick={() => {
                  setShowAdvanced(false)
                  setCustomTitle('')
                }}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                詳細を閉じる
              </button>
            )}
            <button
              type="submit"
              disabled={!description.trim() || isSubmitting}
              className="btn btn-primary flex items-center gap-2 px-6"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  送信中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  依頼する
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}