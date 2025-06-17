import React, { useState, useEffect } from 'react'
import { useToast } from '@/context/ToastContext'

interface Settings {
  polling: {
    chatInterval: number
    taskInterval: number
    logInterval: number
  }
  timeout: {
    apiRequest: number
    messageResponse: number
    claudeCodeCLI: number
  }
  display: {
    itemsPerPage: number
    maxChatMessages: number
    maxLogLines: number
  }
}

export function SettingsPanel() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      showToast('設定の読み込みに失敗しました', 'error')
    }
  }

  const handleSave = async () => {
    if (!settings) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        showToast('設定を保存しました', 'success')
        // 設定変更を反映するためページをリロード
        setTimeout(() => window.location.reload(), 1000)
      } else {
        showToast('設定の保存に失敗しました', 'error')
      }
    } catch (error) {
      showToast('設定の保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!settings) {
    return <div className="p-6">読み込み中...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">システム設定</h2>
      
      {/* ポーリング設定 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">ポーリング設定</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              チャット画面の更新間隔（ミリ秒）
            </label>
            <input
              type="number"
              value={settings.polling.chatInterval}
              onChange={(e) => setSettings({
                ...settings,
                polling: { ...settings.polling, chatInterval: Number(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="100"
              step="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タスク管理画面の更新間隔（ミリ秒）
            </label>
            <input
              type="number"
              value={settings.polling.taskInterval}
              onChange={(e) => setSettings({
                ...settings,
                polling: { ...settings.polling, taskInterval: Number(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="100"
              step="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ログビューアの更新間隔（ミリ秒）
            </label>
            <input
              type="number"
              value={settings.polling.logInterval}
              onChange={(e) => setSettings({
                ...settings,
                polling: { ...settings.polling, logInterval: Number(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="100"
              step="100"
            />
          </div>
        </div>
      </div>

      {/* タイムアウト設定 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">タイムアウト設定</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              APIリクエスト（ミリ秒）
            </label>
            <input
              type="number"
              value={settings.timeout.apiRequest}
              onChange={(e) => setSettings({
                ...settings,
                timeout: { ...settings.timeout, apiRequest: Number(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1000"
              step="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メッセージ応答待ち（ミリ秒）
            </label>
            <input
              type="number"
              value={settings.timeout.messageResponse}
              onChange={(e) => setSettings({
                ...settings,
                timeout: { ...settings.timeout, messageResponse: Number(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1000"
              step="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Claude Code CLI（秒）
            </label>
            <input
              type="number"
              value={settings.timeout.claudeCodeCLI}
              onChange={(e) => setSettings({
                ...settings,
                timeout: { ...settings.timeout, claudeCodeCLI: Number(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1"
              max="60"
            />
          </div>
        </div>
      </div>

      {/* 表示設定 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">表示設定</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              1ページあたりの表示件数
            </label>
            <input
              type="number"
              value={settings.display.itemsPerPage}
              onChange={(e) => setSettings({
                ...settings,
                display: { ...settings.display, itemsPerPage: Number(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="5"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              チャットメッセージの最大表示数
            </label>
            <input
              type="number"
              value={settings.display.maxChatMessages}
              onChange={(e) => setSettings({
                ...settings,
                display: { ...settings.display, maxChatMessages: Number(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="10"
              max="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ログの最大表示行数
            </label>
            <input
              type="number"
              value={settings.display.maxLogLines}
              onChange={(e) => setSettings({
                ...settings,
                display: { ...settings.display, maxLogLines: Number(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="50"
              max="5000"
            />
          </div>
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </div>
  )
}