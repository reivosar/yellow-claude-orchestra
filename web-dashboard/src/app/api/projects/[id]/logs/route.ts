import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const ORCHESTRA_DIR = process.env.ORCHESTRA_DIR || path.resolve(process.cwd(), '..')
const LOGS_DIR = path.join(ORCHESTRA_DIR, 'logs')
const TASKS_FILE = path.join(ORCHESTRA_DIR, 'data', 'tasks.json')

interface LogEntry {
  timestamp: string
  agent: string
  message: string
  raw: string
}

interface TaskLog {
  taskId: string
  taskTitle: string
  projectId: string
  entries: LogEntry[]
}

interface LogResponse {
  projectId: string
  projectName: string
  logs: TaskLog[]
  totalEntries: number
}

// タスクファイルの読み込み
async function loadTasks(): Promise<any[]> {
  try {
    const content = await fs.readFile(TASKS_FILE, 'utf-8')
    const data = JSON.parse(content)
    return Array.isArray(data) ? data : (data.tasks || [])
  } catch (error) {
    console.error('タスクファイル読み込みエラー:', error)
    return []
  }
}

// ログファイルの解析
function parseLogFile(content: string): LogEntry[] {
  const lines = content.split('\n').filter(line => line.trim())
  const entries: LogEntry[] = []
  
  for (const line of lines) {
    const match = line.match(/^\[([^\]]+)\]\s+([^:]+):\s+(.+)$/)
    if (match) {
      const [, timestamp, agent, message] = match
      entries.push({
        timestamp,
        agent: agent.trim(),
        message: message.trim(),
        raw: line
      })
    }
  }
  
  return entries
}

// プロジェクトIDに関連するタスクを取得
async function getTasksForProject(projectId: string): Promise<any[]> {
  const tasks = await loadTasks()
  return tasks.filter(task => task.projectId === projectId)
}

// ログファイルを読み込んでタスクログを作成
async function getTaskLogs(projectTasks: any[]): Promise<TaskLog[]> {
  const taskLogs: TaskLog[] = []
  
  for (const task of projectTasks) {
    const logFileName = `task-${task.id}.log`
    const logFilePath = path.join(LOGS_DIR, logFileName)
    
    try {
      const logContent = await fs.readFile(logFilePath, 'utf-8')
      const entries = parseLogFile(logContent)
      
      if (entries.length > 0) {
        taskLogs.push({
          taskId: task.id,
          taskTitle: task.title || 'タイトルなし',
          projectId: task.projectId,
          entries
        })
      }
    } catch (error) {
      // ログファイルが存在しない場合はスキップ
      console.log(`ログファイルが見つかりません: ${logFileName}`)
    }
  }
  
  return taskLogs
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'プロジェクトIDが必要です' },
        { status: 400 }
      )
    }
    
    // プロジェクトIDに関連するタスクを取得
    const projectTasks = await getTasksForProject(projectId)
    
    if (projectTasks.length === 0) {
      return NextResponse.json({
        projectId,
        projectName: 'Unknown Project',
        logs: [],
        totalEntries: 0,
        message: 'このプロジェクトにはタスクがありません'
      })
    }
    
    // タスクログを取得
    const taskLogs = await getTaskLogs(projectTasks)
    
    // 全エントリ数を計算
    const totalEntries = taskLogs.reduce((sum, log) => sum + log.entries.length, 0)
    
    // プロジェクト名を取得（最初のタスクから）
    const projectName = projectTasks[0]?.projectName || 'Unknown Project'
    
    const response: LogResponse = {
      projectId,
      projectName,
      logs: taskLogs,
      totalEntries
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('ログ取得エラー:', error)
    return NextResponse.json(
      { error: 'ログの取得に失敗しました' },
      { status: 500 }
    )
  }
}