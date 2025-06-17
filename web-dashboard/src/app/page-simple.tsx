'use client'

import React, { useState, useEffect } from 'react'

export default function SimplePage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = await response.json()
        setProjects(data.projects || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    
    loadProjects()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">エラー</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Yellow Claude Orchestra
      </h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">プロジェクト情報の保存先について</h2>
        <div className="space-y-2 text-sm">
          <p><strong>保存場所:</strong> <code>/Users/mac/Workspace/yellow-claude-orchestra/data/projects.json</code></p>
          <p><strong>プロジェクト数:</strong> {projects.length} 個</p>
          <p><strong>Claude Code CLI:</strong> プロジェクトファイルの操作に使用されます</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">現在のプロジェクト</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500">プロジェクトがありません</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((project: any) => (
              <li key={project.id} className="p-3 bg-gray-50 rounded">
                <div className="font-medium">{project.name}</div>
                <div className="text-sm text-gray-600">{project.description}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}