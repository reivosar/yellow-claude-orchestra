import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { generateTaskTitle, isValidTitle } from '@/utils/ai'

// タスクリクエストの型定義
interface TaskRequest {
  title: string
  description: string
  projectId: string
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  requirements: string
  acceptanceCriteria: string
}

interface Task extends TaskRequest {
  id: string
  status: 'pending' | 'in_progress' | 'in_review' | 'completed' | 'rejected'
  assignedAgent?: string
  createdAt: string
  updatedAt: string
  githubIssueUrl?: string
}

const ORCHESTRA_DIR = process.env.ORCHESTRA_DIR || path.resolve(process.cwd(), '..')
const TASKS_FILE = path.join(ORCHESTRA_DIR, 'data', 'tasks.json')
const PROJECTS_FILE = path.join(ORCHESTRA_DIR, 'data', 'projects.json')

// タスクファイルの読み込み
async function loadTasks(): Promise<Task[]> {
  try {
    const content = await fs.readFile(TASKS_FILE, 'utf-8')
    const data = JSON.parse(content)
    // tasks.json の構造が {"tasks": []} の場合と [] の場合の両方に対応
    return Array.isArray(data) ? data : (data.tasks || [])
  } catch (error) {
    return []
  }
}

// タスクファイルの保存
async function saveTasks(tasks: Task[]): Promise<void> {
  const dir = path.dirname(TASKS_FILE)
  await fs.mkdir(dir, { recursive: true })
  // {"tasks": []} 形式で保存して一貫性を保つ
  await fs.writeFile(TASKS_FILE, JSON.stringify({ tasks }, null, 2))
}

// プロジェクトファイルの読み込み
async function loadProjects(): Promise<any[]> {
  try {
    const content = await fs.readFile(PROJECTS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    return []
  }
}

// Producer エージェントにタスクを送信
async function sendTaskToProducer(task: Task): Promise<void> {
  const messageDir = path.join(ORCHESTRA_DIR, 'communication', 'messages')
  await fs.mkdir(messageDir, { recursive: true })
  
  const message = {
    id: `task-${task.id}`,
    type: 'task_request',
    from: 'web_dashboard',
    to: 'producer',
    timestamp: new Date().toISOString(),
    data: task
  }
  
  const messageFile = path.join(messageDir, `task-${task.id}.json`)
  console.log(`Creating message file: ${messageFile}`)
  await fs.writeFile(messageFile, JSON.stringify(message, null, 2))
  console.log(`Message file created successfully`)
  
  console.log(`タスク ${task.id} をProducerエージェントに送信しました`)
}

// GET /api/tasks - タスク一覧とプロジェクト一覧を取得
export async function GET(request: NextRequest) {
  try {
    const tasks = await loadTasks()
    const projects = await loadProjects()
    
    return NextResponse.json({
      tasks: tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      projects
    })
  } catch (error) {
    console.error('タスク取得エラー:', error)
    return NextResponse.json(
      { error: 'タスクの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - 新しいタスクを作成
export async function POST(request: NextRequest) {
  try {
    const body: TaskRequest = await request.json()
    console.log('POST /api/tasks - Request body:', JSON.stringify(body, null, 2))
    
    // プロジェクトIDのバリデーション
    if (!body.projectId) {
      console.log('Validation failed - missing projectId:', { projectId: body.projectId })
      return NextResponse.json(
        { error: 'プロジェクトIDは必須です' },
        { status: 400 }
      )
    }
    
    // タイトルが無効な場合はAIで生成
    let title = body.title
    if (!title || !isValidTitle(title, body.description || '')) {
      console.log('Title is invalid or missing, generating with AI...')
      if (body.description) {
        title = await generateTaskTitle(body.description)
        console.log('Generated title:', title)
      } else {
        title = '新しいタスク'
      }
    }
    
    // プロジェクトの存在確認
    const projects = await loadProjects()
    console.log('Available projects:', projects.map(p => ({ id: p.id, name: p.name })))
    console.log('Looking for projectId:', body.projectId)
    const project = projects.find(p => p.id === body.projectId)
    if (!project) {
      console.log('Project not found. Available project IDs:', projects.map(p => p.id))
      return NextResponse.json(
        { error: `指定されたプロジェクトが見つかりません。利用可能なプロジェクト: ${projects.map(p => p.id).join(', ')}` },
        { status: 400 }
      )
    }
    
    // 新しいタスクを作成
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId: body.projectId,
      title, // AI生成されたタイトルを使用
      description: body.description || title, // 説明がない場合はタイトルを使用
      priority: body.priority || 'medium',
      tags: body.tags || [],
      requirements: body.requirements || '',
      acceptanceCriteria: body.acceptanceCriteria || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // タスクを保存
    const tasks = await loadTasks()
    tasks.push(task)
    await saveTasks(tasks)
    
    // Producer エージェントに送信
    await sendTaskToProducer(task)
    
    console.log(`新しいタスクが作成されました: ${task.id}`)
    
    return NextResponse.json({
      success: true,
      task,
      message: 'タスクが正常に作成され、Producer エージェントに送信されました'
    })
    
  } catch (error) {
    console.error('タスク作成エラー:', error)
    console.error('エラー詳細:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      tasksFile: TASKS_FILE,
      projectsFile: PROJECTS_FILE
    })
    return NextResponse.json(
      { error: `タスクの作成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

// PUT /api/tasks/:id - タスクの更新
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const taskId = url.searchParams.get('id')
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'タスクIDが必要です' },
        { status: 400 }
      )
    }
    
    const updates = await request.json()
    const tasks = await loadTasks()
    const taskIndex = tasks.findIndex(t => t.id === taskId)
    
    if (taskIndex === -1) {
      return NextResponse.json(
        { error: 'タスクが見つかりません' },
        { status: 404 }
      )
    }
    
    // タスクを更新
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    await saveTasks(tasks)
    
    return NextResponse.json({
      success: true,
      task: tasks[taskIndex]
    })
    
  } catch (error) {
    console.error('タスク更新エラー:', error)
    return NextResponse.json(
      { error: 'タスクの更新に失敗しました' },
      { status: 500 }
    )
  }
}