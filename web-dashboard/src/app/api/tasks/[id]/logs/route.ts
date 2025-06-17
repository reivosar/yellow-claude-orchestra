import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const ORCHESTRA_DIR = process.env.ORCHESTRA_DIR || path.resolve(process.cwd(), '..')
const LOGS_DIR = path.join(ORCHESTRA_DIR, 'logs')
const COMMUNICATION_DIR = path.join(ORCHESTRA_DIR, 'communication')

interface TaskLog {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  agent?: string
  taskId?: string
}

interface TaskProgress {
  taskId: string
  status: string
  progress: number
  currentStep: string
  logs: TaskLog[]
  agentMessages: any[]
}

// タスクIDに関連するログを取得
async function getTaskLogs(taskId: string): Promise<TaskLog[]> {
  const logs: TaskLog[] = []
  
  try {
    // ログディレクトリから該当するファイルを検索
    const logFiles = await fs.readdir(LOGS_DIR)
    
    for (const file of logFiles) {
      if (file.endsWith('.log')) {
        // ファイル名からタスクIDを確認 (例: task-test-12345.log)
        const taskLogMatch = file.match(/task-(.+)\.log/)
        const fileTaskId = taskLogMatch ? taskLogMatch[1] : null
        
        if (fileTaskId === taskId || file.includes(taskId)) {
          const filePath = path.join(LOGS_DIR, file)
          try {
            const content = await fs.readFile(filePath, 'utf-8')
            const lines = content.split('\n').filter(line => line.trim())
            
            for (const line of lines) {
              // ログの解析（タイムスタンプとエージェント名を抽出）
              const timestampMatch = line.match(/\[([^\]]+)\] ([^:]+): (.+)/)
              if (timestampMatch) {
                const [, timestamp, agent, message] = timestampMatch
                logs.push({
                  id: `${Date.now()}-${Math.random()}`,
                  timestamp,
                  level: 'info',
                  message,
                  agent,
                  taskId
                })
              } else if (line.trim()) {
                // タイムスタンプなしのログ
                logs.push({
                  id: `${Date.now()}-${Math.random()}`,
                  timestamp: new Date().toISOString(),
                  level: 'info',
                  message: line,
                  agent: file.replace('.log', ''),
                  taskId
                })
              }
            }
          } catch (error) {
            console.error(`ログファイル読み取りエラー ${file}:`, error)
          }
        }
      }
    }
    
    // system.log からも検索
    try {
      const systemLogPath = path.join(COMMUNICATION_DIR, 'messages', 'system.log')
      const systemContent = await fs.readFile(systemLogPath, 'utf-8')
      const systemLines = systemContent.split('\n').filter(line => line.trim())
      
      for (const line of systemLines) {
        if (line.includes(taskId)) {
          logs.push({
            id: `sys-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: line,
            agent: 'system',
            taskId
          })
        }
      }
    } catch (error) {
      console.error('システムログ読み取りエラー:', error)
    }
    
  } catch (error) {
    console.error('ログディレクトリ読み取りエラー:', error)
  }
  
  // 時系列でソート
  return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

// エージェント間のメッセージを取得
async function getAgentMessages(taskId: string): Promise<any[]> {
  const messages: any[] = []
  
  try {
    const messagesDir = path.join(COMMUNICATION_DIR, 'messages')
    const files = await fs.readdir(messagesDir)
    
    for (const file of files) {
      if (file.endsWith('.json') && file.includes('agent-msg')) {
        try {
          const filePath = path.join(messagesDir, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const message = JSON.parse(content)
          
          // ファイル名からタスクIDを抽出 (例: agent-msg-test-12345-msg-xxx.json)
          const taskIdMatch = file.match(/agent-msg-([^-]+(?:-[^-]+)*)-msg-/)
          const fileTaskId = taskIdMatch ? taskIdMatch[1] : null
          
          if (fileTaskId === taskId || message.data?.id === taskId || message.id?.includes(taskId)) {
            messages.push({
              ...message,
              filename: file
            })
          }
        } catch (error) {
          console.error(`メッセージファイル解析エラー ${file}:`, error)
        }
      }
    }
  } catch (error) {
    console.error('メッセージディレクトリ読み取りエラー:', error)
  }
  
  return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

// タスクの進行状況を計算
function calculateProgress(logs: TaskLog[], status: string): { progress: number; currentStep: string } {
  if (status === 'completed') {
    return { progress: 100, currentStep: '完了' }
  }
  
  if (status === 'rejected') {
    return { progress: 0, currentStep: '却下' }
  }
  
  // ログからステップを推測
  const steps = [
    { keyword: 'received', step: 'タスク受信', progress: 10 },
    { keyword: 'analyzing', step: '要件分析', progress: 25 },
    { keyword: 'planning', step: '実装計画', progress: 40 },
    { keyword: 'implementing', step: '実装中', progress: 60 },
    { keyword: 'testing', step: 'テスト中', progress: 80 },
    { keyword: 'reviewing', step: 'レビュー中', progress: 90 }
  ]
  
  let currentProgress = 0
  let currentStep = '待機中'
  
  for (const log of logs.reverse()) {
    for (const step of steps) {
      if (log.message.toLowerCase().includes(step.keyword)) {
        currentProgress = step.progress
        currentStep = step.step
        break
      }
    }
    if (currentProgress > 0) break
  }
  
  return { progress: currentProgress, currentStep }
}

// GET /api/tasks/[id]/logs - タスクの進行状況とログを取得
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'タスクIDが必要です' },
        { status: 400 }
      )
    }
    
    // タスク情報を取得
    const tasksFile = path.join(ORCHESTRA_DIR, 'data', 'tasks.json')
    let task = null
    
    try {
      const tasksContent = await fs.readFile(tasksFile, 'utf-8')
      const tasksData = JSON.parse(tasksContent)
      const tasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || [])
      task = tasks.find((t: any) => t.id === taskId)
    } catch (error) {
      console.error('タスクファイル読み取りエラー:', error)
    }
    
    if (!task) {
      return NextResponse.json(
        { error: 'タスクが見つかりません' },
        { status: 404 }
      )
    }
    
    // ログとメッセージを取得
    const logs = await getTaskLogs(taskId)
    const agentMessages = await getAgentMessages(taskId)
    
    // 進行状況を計算
    const { progress, currentStep } = calculateProgress(logs, task.status)
    
    const taskProgress: TaskProgress = {
      taskId,
      status: task.status,
      progress,
      currentStep,
      logs,
      agentMessages
    }
    
    return NextResponse.json(taskProgress)
    
  } catch (error) {
    console.error('タスク進行状況取得エラー:', error)
    return NextResponse.json(
      { error: 'タスク進行状況の取得に失敗しました' },
      { status: 500 }
    )
  }
}