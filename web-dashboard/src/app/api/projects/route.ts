import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const PROJECTS_FILE = path.join(process.cwd(), '..', 'data', 'projects.json')
const CLAUDE_TEMPLATE_FILE = path.join(process.cwd(), '..', 'config', 'templates', 'CLAUDE.md')
const PROJECTS_DIR = path.join(process.cwd(), '..', 'projects')

interface Project {
  id: string
  name: string
  repository: string
  description: string
  status: 'active' | 'archived'
  tasksCount?: number
  lastActivity?: string
  createdAt: string
  updatedAt: string
}

async function ensureProjectsFile() {
  try {
    console.log('Projects file path:', PROJECTS_FILE)
    await fs.access(PROJECTS_FILE)
    console.log('Projects file exists')
  } catch (error) {
    console.log('Projects file does not exist, creating...')
    const dataDir = path.dirname(PROJECTS_FILE)
    console.log('Data directory:', dataDir)
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(PROJECTS_FILE, JSON.stringify([], null, 2))
    console.log('Projects file created')
  }
}

export async function GET() {
  try {
    await ensureProjectsFile()
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8')
    const projects: Project[] = JSON.parse(data)
    
    return NextResponse.json({ projects })
  } catch (error) {
    console.error('プロジェクト読み込みエラー:', error)
    return NextResponse.json({ error: 'プロジェクトの読み込みに失敗しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureProjectsFile()
    const { name, repository, description } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'プロジェクト名は必須です' }, { status: 400 })
    }

    const data = await fs.readFile(PROJECTS_FILE, 'utf-8')
    const projects: Project[] = JSON.parse(data)

    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: name.trim(),
      repository: repository?.trim() || '',
      description: description?.trim() || '',
      status: 'active',
      tasksCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    projects.unshift(newProject)
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2))

    // プロジェクトディレクトリと CLAUDE.md を作成
    const projectSetup = await createProjectDirectory(newProject)
    
    return NextResponse.json({ 
      project: newProject,
      setup: projectSetup ? {
        projectDir: projectSetup.projectDir,
        claudeFile: projectSetup.claudeFilePath
      } : null
    })
  } catch (error) {
    console.error('プロジェクト作成エラー:', error)
    return NextResponse.json({ error: 'プロジェクトの作成に失敗しました' }, { status: 500 })
  }
}

async function createProjectDirectory(project: Project) {
  try {
    // プロジェクトディレクトリを作成
    const projectDir = path.join(PROJECTS_DIR, project.repository || project.name)
    await fs.mkdir(projectDir, { recursive: true })
    
    // CLAUDE.md テンプレートを読み込み
    let claudeTemplate = await fs.readFile(CLAUDE_TEMPLATE_FILE, 'utf-8')
    
    // テンプレート変数を置換
    claudeTemplate = claudeTemplate
      .replace(/{{PROJECT_NAME}}/g, project.name)
      .replace(/{{PROJECT_DESCRIPTION}}/g, project.description || 'プロジェクトの説明がありません')
      .replace(/{{REPOSITORY_NAME}}/g, project.repository || project.name)
      .replace(/{{CREATED_AT}}/g, new Date(project.createdAt).toLocaleDateString('ja-JP'))
      .replace(/{{STATUS}}/g, project.status === 'active' ? 'アクティブ' : 'アーカイブ')
    
    // CLAUDE.md をプロジェクトディレクトリに作成
    const claudeFilePath = path.join(projectDir, 'CLAUDE.md')
    await fs.writeFile(claudeFilePath, claudeTemplate)
    
    console.log(`プロジェクトディレクトリとCLAUDE.mdを作成: ${projectDir}`)
    
    return { projectDir, claudeFilePath }
  } catch (error) {
    console.error('プロジェクトディレクトリ作成エラー:', error)
    // エラーが発生してもプロジェクト作成は続行
    return null
  }
}