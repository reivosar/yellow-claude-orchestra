import React, { useState } from 'react'
import { DirectoryBrowser } from './DirectoryBrowser'

interface ImportProjectDialogProps {
  onImport: (projectPath: string, metadata: { name: string; description: string }) => void
  onCancel: () => void
}

export function ImportProjectDialog({ onImport, onCancel }: ImportProjectDialogProps) {
  const [projectPath, setProjectPath] = useState('')
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    detectedInfo?: any
    error?: string
  } | null>(null)
  const [showDirectoryBrowser, setShowDirectoryBrowser] = useState(false)
  const [currentBrowserPath, setCurrentBrowserPath] = useState('/Users')

  const validateProjectPath = async (path: string) => {
    if (!path.trim()) {
      setValidationResult(null)
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch('/api/projects/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: path.trim() })
      })

      const result = await response.json()
      setValidationResult(result)

      // 検出された情報を自動入力
      if (result.isValid && result.detectedInfo) {
        if (!projectName && result.detectedInfo.name) {
          setProjectName(result.detectedInfo.name)
        }
        if (!description && result.detectedInfo.description) {
          setDescription(result.detectedInfo.description)
        }
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: 'プロジェクトパスの検証に失敗しました'
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value
    setProjectPath(path)
    
    // デバウンス付きでバリデーション
    const timer = setTimeout(() => {
      validateProjectPath(path)
    }, 500)

    return () => clearTimeout(timer)
  }

  const handleDirectorySelect = (selectedPath: string) => {
    setProjectPath(selectedPath)
    setShowDirectoryBrowser(false)
    validateProjectPath(selectedPath)
  }

  const handleImport = () => {
    if (validationResult?.isValid && projectName.trim()) {
      onImport(projectPath.trim(), {
        name: projectName.trim(),
        description: description.trim()
      })
    }
  }

  const canImport = validationResult?.isValid && projectName.trim()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              既存プロジェクトをインポート
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            既存のプロジェクトディレクトリを Orchestra に追加します
          </p>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* プロジェクトパス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクトディレクトリパス <span className="text-error">*</span>
            </label>
            
            {!showDirectoryBrowser ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={projectPath}
                    onChange={handlePathChange}
                    placeholder="/path/to/your/existing/project"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDirectoryBrowser(true)}
                    className="btn btn-secondary whitespace-nowrap"
                  >
                    📁 参照
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ディレクトリを選択してください</span>
                  <button
                    type="button"
                    onClick={() => setShowDirectoryBrowser(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    手動入力に戻る
                  </button>
                </div>
                <DirectoryBrowser
                  currentPath={currentBrowserPath}
                  onPathChange={setCurrentBrowserPath}
                  onSelectPath={handleDirectorySelect}
                  filterDirectoriesOnly={true}
                />
              </div>
            )}
            
            {/* バリデーション結果 */}
            {isValidating && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>プロジェクトを確認中...</span>
              </div>
            )}
            
            {validationResult && !isValidating && (
              <div className={`mt-2 p-3 rounded-md ${
                validationResult.isValid 
                  ? 'bg-success-50 border border-success-200' 
                  : 'bg-error-50 border border-error-200'
              }`}>
                {validationResult.isValid ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-success-800">有効なプロジェクトです</span>
                    </div>
                    {validationResult.detectedInfo && (
                      <div className="text-sm text-success-700 space-y-1">
                        <div><strong>検出されたフレームワーク:</strong> {validationResult.detectedInfo.framework || '不明'}</div>
                        <div><strong>パッケージマネージャー:</strong> {validationResult.detectedInfo.packageManager || '不明'}</div>
                        {validationResult.detectedInfo.hasGit && (
                          <div><strong>Git リポジトリ:</strong> 検出されました</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-error" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-error-800">{validationResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* プロジェクト名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクト名 <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="プロジェクト名を入力"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              説明 <span className="text-gray-500">(任意)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="プロジェクトの説明を入力"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* インポート後の動作説明 */}
          <div className="p-4 border border-primary-200 bg-primary-50 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-primary mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-primary-800 mb-2">インポート後の動作</h4>
                <ul className="text-sm text-primary-700 space-y-1">
                  <li>• プロジェクト情報がOrchestraに登録されます</li>
                  <li>• プロジェクト固有のCLAUDE.mdが作成されます（既存の場合は上書きされません）</li>
                  <li>• タスク管理と連携が可能になります</li>
                  <li>• Actor エージェントがプロジェクト設定を参照できるようになります</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="btn btn-secondary"
          >
            キャンセル
          </button>
          
          <button
            onClick={handleImport}
            disabled={!canImport}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            プロジェクトをインポート
          </button>
        </div>
      </div>
    </div>
  )
}