import { useState, useEffect } from 'react'

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

let cachedSettings: Settings | null = null

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(cachedSettings)
  const [loading, setLoading] = useState(!cachedSettings)

  useEffect(() => {
    if (!cachedSettings) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          cachedSettings = data
          setSettings(data)
          setLoading(false)
        })
        .catch(() => {
          // エラー時はデフォルト値を使用
          const defaultSettings = {
            polling: { chatInterval: 1000, taskInterval: 2000, logInterval: 3000 },
            timeout: { apiRequest: 30000, messageResponse: 60000, claudeCodeCLI: 5 },
            display: { itemsPerPage: 20, maxChatMessages: 100, maxLogLines: 500 }
          }
          cachedSettings = defaultSettings
          setSettings(defaultSettings)
          setLoading(false)
        })
    }
  }, [])

  return { settings, loading }
}