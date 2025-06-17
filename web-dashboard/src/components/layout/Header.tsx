import React from 'react'

interface HeaderProps {
  isConnected: boolean
  connectionError?: string | null
  onLogoClick?: () => void
}

export function Header({ isConnected, connectionError, onLogoClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* ロゴとタイトル */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">YC</span>
          </div>
          <div className="text-left">
            <h1 className="text-xl font-semibold text-gray-900">
              Yellow Claude Orchestra
            </h1>
            <p className="text-sm text-gray-500">
              マルチエージェント開発システム
            </p>
          </div>
        </button>

        {/* ステータスとアクション */}
        <div className="flex items-center gap-4">
          {/* 接続状況 */}
          <div className="flex items-center gap-2">
            <div className={`status-indicator ${isConnected ? 'status-active' : 'status-error'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'システム稼働中' : (connectionError || '接続エラー')}
            </span>
          </div>

        </div>
      </div>
    </header>
  )
}