import React from 'react'

interface NavigationProps {
  activeView: 'dashboard' | 'logs' | 'tasks' | 'settings'
  onViewChange: (view: 'dashboard' | 'logs' | 'tasks' | 'settings') => void
  selectedProject?: { id: string; name: string } | null
  onBackToDashboard?: () => void
  onProjectWorkspace?: () => void
}

export function Navigation({ activeView, onViewChange, selectedProject, onBackToDashboard, onProjectWorkspace }: NavigationProps) {
  // 基本ナビゲーション項目（常に表示）
  const basicNavItems = [
    {
      id: 'dashboard' as const,
      label: 'プロジェクト一覧',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ]

  // プロジェクト選択時のナビゲーション項目
  const projectNavItems = [
    {
      id: 'tasks' as const,
      label: 'タスク管理',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      id: 'logs' as const,
      label: 'プロジェクトログ',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ]

  // システム設定（常に表示）
  const systemNavItems = [
    {
      id: 'settings' as const,
      label: 'システム設定',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ]

  return (
    <nav className="bg-white border-r border-gray-200 w-64 flex-shrink-0">
      <div className="p-4">
        {/* 基本ナビゲーション - 常に表示 */}
        <div className="mb-6">
          <ul className="space-y-1">
            {basicNavItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition border
                    ${activeView === item.id
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                    }
                  `}
                >
                  <span className={activeView === item.id ? 'text-white' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* プロジェクト選択時の情報表示 */}
        {selectedProject && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              ワークスペース
            </h4>
            <button
              onClick={() => {
                // プロジェクトワークスペースに戻る（プロジェクト選択は維持）
                onViewChange('dashboard')
              }}
              className="w-full p-3 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-200 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="text-sm font-medium text-primary truncate">
                  {selectedProject.name}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* プロジェクト管理機能（プロジェクト選択時のみ） */}
        {selectedProject && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              プロジェクト管理
            </h4>
            <ul className="space-y-1">
              {projectNavItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onViewChange(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition border
                      ${activeView === item.id
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                      }
                    `}
                  >
                    <span className={activeView === item.id ? 'text-white' : 'text-gray-400'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* システム設定 */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            システム
          </h4>
          <ul className="space-y-1">
            {systemNavItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition border
                    ${activeView === item.id
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                    }
                  `}
                >
                  <span className={activeView === item.id ? 'text-white' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}