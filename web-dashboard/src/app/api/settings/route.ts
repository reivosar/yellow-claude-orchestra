import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json')

// デフォルト設定
const DEFAULT_SETTINGS = {
  polling: {
    chatInterval: 1000,
    taskInterval: 2000,
    logInterval: 3000,
  },
  timeout: {
    apiRequest: 30000,
    messageResponse: 60000,
    claudeCodeCLI: 5,
  },
  display: {
    itemsPerPage: 20,
    maxChatMessages: 100,
    maxLogLines: 500,
  },
}

// 設定を読み込む
async function loadSettings() {
  try {
    const content = await fs.readFile(SETTINGS_FILE, 'utf-8')
    return { ...DEFAULT_SETTINGS, ...JSON.parse(content) }
  } catch (error) {
    return DEFAULT_SETTINGS
  }
}

// 設定を保存
async function saveSettings(settings: any) {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

// GET /api/settings - 設定を取得
export async function GET() {
  try {
    const settings = await loadSettings()
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json(
      { error: '設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - 設定を更新
export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json()
    const currentSettings = await loadSettings()
    
    // ディープマージ
    const mergedSettings = {
      ...currentSettings,
      polling: { ...currentSettings.polling, ...(updates.polling || {}) },
      timeout: { ...currentSettings.timeout, ...(updates.timeout || {}) },
      display: { ...currentSettings.display, ...(updates.display || {}) },
    }
    
    await saveSettings(mergedSettings)
    
    return NextResponse.json({
      success: true,
      settings: mergedSettings
    })
  } catch (error) {
    return NextResponse.json(
      { error: '設定の更新に失敗しました' },
      { status: 500 }
    )
  }
}