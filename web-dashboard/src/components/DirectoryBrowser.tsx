import React, { useState, useEffect } from 'react'

interface DirectoryItem {
  name: string
  path: string
  isDirectory: boolean
  size?: number
  modified?: string
}

interface DirectoryBrowserProps {
  currentPath: string
  onPathChange: (path: string) => void
  onSelectPath: (path: string) => void
  filterDirectoriesOnly?: boolean
}

export function DirectoryBrowser({ 
  currentPath, 
  onPathChange, 
  onSelectPath,
  filterDirectoriesOnly = true 
}: DirectoryBrowserProps) {
  const [items, setItems] = useState<DirectoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDirectory(currentPath)
  }, [currentPath])

  const loadDirectory = async (path: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/directory/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, filterDirectoriesOnly })
      })

      const result = await response.json()
      
      if (response.ok) {
        setItems(result.items || [])
      } else {
        setError(result.error || 'ディレクトリの読み込みに失敗しました')
      }
    } catch (error) {
      setError('ディレクトリの読み込み中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = (item: DirectoryItem) => {
    if (item.isDirectory) {
      onPathChange(item.path)
    }
  }

  const handleItemDoubleClick = (item: DirectoryItem) => {
    if (item.isDirectory) {
      onSelectPath(item.path)
    }
  }

  const goToParent = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/'
    onPathChange(parentPath)
  }

  const goToHome = () => {
    // Default to /Users on macOS, can be enhanced with server-side home detection
    onPathChange('/Users')
  }

  const pathSegments = currentPath.split('/').filter(Boolean)

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* パスナビゲーション */}
      <div className="bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={goToHome}
            className="p-1 hover:bg-gray-200 rounded"
            title="ホームディレクトリ"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </button>
          
          <button
            onClick={goToParent}
            className="p-1 hover:bg-gray-200 rounded"
            title="親ディレクトリ"
            disabled={currentPath === '/'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="flex-1 text-sm text-gray-600 font-mono bg-white border rounded px-2 py-1">
            /{pathSegments.map((segment, index) => (
              <button
                key={index}
                onClick={() => {
                  const newPath = '/' + pathSegments.slice(0, index + 1).join('/')
                  onPathChange(newPath)
                }}
                className="hover:text-primary"
              >
                {segment}
                {index < pathSegments.length - 1 && '/'}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => onSelectPath(currentPath)}
            className="btn btn-primary text-sm"
          >
            このフォルダを選択
          </button>
        </div>
      </div>

      {/* ディレクトリ内容 */}
      <div className="h-64 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              読み込み中...
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-sm text-error">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">
            {filterDirectoriesOnly ? 'ディレクトリがありません' : 'ファイルがありません'}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="divide-y divide-gray-200">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleItemClick(item)}
                onDoubleClick={() => handleItemDoubleClick(item)}
              >
                <div className="flex-shrink-0">
                  {item.isDirectory ? (
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </div>
                  {item.modified && (
                    <div className="text-xs text-gray-500">
                      {new Date(item.modified).toLocaleDateString('ja-JP')}
                    </div>
                  )}
                </div>

                {item.isDirectory && (
                  <div className="text-xs text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* ヘルプテキスト */}
      <div className="border-t border-gray-200 bg-gray-50 p-3">
        <div className="text-xs text-gray-500">
          💡 フォルダをクリックして移動、ダブルクリックで選択、または「このフォルダを選択」ボタンを使用
        </div>
      </div>
    </div>
  )
}