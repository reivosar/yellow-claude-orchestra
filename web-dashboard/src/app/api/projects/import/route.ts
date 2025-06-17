import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const PROJECTS_FILE = path.join(process.cwd(), '..', 'data', 'projects.json')
const CLAUDE_TEMPLATE_FILE = path.join(process.cwd(), '..', 'config', 'templates', 'CLAUDE.md')

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
  isImported?: boolean
  originalPath?: string
}

export async function POST(request: NextRequest) {
  try {
    const { projectPath, metadata } = await request.json()

    if (!projectPath?.trim() || !metadata?.name?.trim()) {
      return NextResponse.json({ 
        error: 'プロジェクトパスと名前は必須です' 
      }, { status: 400 })
    }

    // プロジェクトパスの存在確認
    try {
      const stats = await fs.stat(projectPath)
      if (!stats.isDirectory()) {
        return NextResponse.json({
          error: '指定されたパスはディレクトリではありません'
        }, { status: 400 })
      }
    } catch (error) {
      return NextResponse.json({
        error: '指定されたパスが存在しません'
      }, { status: 400 })
    }

    // 既存プロジェクト一覧を取得
    await ensureProjectsFile()
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8')
    const projects: Project[] = JSON.parse(data)

    // 重複チェック
    const existingProject = projects.find(p => 
      p.originalPath === projectPath || 
      p.name === metadata.name.trim()
    )

    if (existingProject) {
      return NextResponse.json({
        error: 'このプロジェクトは既にインポートされているか、同名のプロジェクトが存在します'
      }, { status: 409 })
    }

    // インポートするプロジェクト情報を作成
    const newProject: Project = {
      id: `imported-${Date.now()}`,
      name: metadata.name.trim(),
      repository: path.basename(projectPath),
      description: metadata.description?.trim() || 'インポートされたプロジェクト',
      status: 'active',
      tasksCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isImported: true,
      originalPath: projectPath
    }

    // プロジェクト一覧に追加
    projects.unshift(newProject)
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2))

    // プロジェクト専用の CLAUDE.md を作成（既存の場合は上書きしない）
    const importResult = await createClaudeFileForImportedProject(projectPath, newProject)

    return NextResponse.json({ 
      project: newProject,
      import: importResult
    })

  } catch (error) {
    console.error('プロジェクトインポートエラー:', error)
    return NextResponse.json({ 
      error: 'プロジェクトのインポートに失敗しました' 
    }, { status: 500 })
  }
}

async function ensureProjectsFile() {
  try {
    await fs.access(PROJECTS_FILE)
  } catch {
    const dataDir = path.dirname(PROJECTS_FILE)
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(PROJECTS_FILE, JSON.stringify([], null, 2))
  }
}

async function createClaudeFileForImportedProject(projectPath: string, project: Project) {
  try {
    const claudeFilePath = path.join(projectPath, 'CLAUDE.md')
    
    // 既存の CLAUDE.md があるかチェック
    try {
      await fs.access(claudeFilePath)
      console.log(`既存のCLAUDE.mdが見つかりました: ${claudeFilePath}`)
      return {
        claudeFile: claudeFilePath,
        created: false,
        message: '既存のCLAUDE.mdを保持しました'
      }
    } catch {
      // CLAUDE.md が存在しない場合は新規作成
    }

    // テンプレートを読み込んで新規作成
    let claudeTemplate = await fs.readFile(CLAUDE_TEMPLATE_FILE, 'utf-8')
    
    // プロジェクト情報で置換
    claudeTemplate = claudeTemplate
      .replace(/{{PROJECT_NAME}}/g, project.name)
      .replace(/{{PROJECT_DESCRIPTION}}/g, project.description)
      .replace(/{{REPOSITORY_NAME}}/g, project.repository)
      .replace(/{{CREATED_AT}}/g, new Date(project.createdAt).toLocaleDateString('ja-JP'))
      .replace(/{{STATUS}}/g, project.status === 'active' ? 'アクティブ' : 'アーカイブ')

    // インポート情報を追加
    claudeTemplate += `\n\n## インポート情報\n- **元のパス**: ${project.originalPath}\n- **インポート日**: ${new Date().toLocaleDateString('ja-JP')}\n- **管理方法**: Yellow Claude Orchestra で管理\n`

    await fs.writeFile(claudeFilePath, claudeTemplate)
    
    console.log(`新しいCLAUDE.mdを作成: ${claudeFilePath}`)
    
    return {
      claudeFile: claudeFilePath,
      created: true,
      message: '新しいCLAUDE.mdを作成しました'
    }

  } catch (error) {
    console.error('CLAUDE.md作成エラー:', error)
    return {
      claudeFile: null,
      created: false,
      message: 'CLAUDE.mdの作成に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}