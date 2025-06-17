import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

interface DirectoryItem {
  name: string
  path: string
  isDirectory: boolean
  size?: number
  modified?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path: requestPath, filterDirectoriesOnly = true } = body

    if (!requestPath || typeof requestPath !== 'string') {
      return NextResponse.json(
        { error: 'パスが指定されていません' },
        { status: 400 }
      )
    }

    // パスの正規化とセキュリティチェック
    const normalizedPath = path.resolve(requestPath)
    
    // セキュリティ: システムファイルやディレクトリへのアクセスを制限
    const forbiddenPaths = [
      '/System',
      '/Library',
      '/private',
      '/usr',
      '/bin',
      '/sbin',
      '/etc',
      '/var',
      '/tmp'
    ]
    
    if (forbiddenPaths.some(forbidden => normalizedPath.startsWith(forbidden))) {
      return NextResponse.json(
        { error: 'このディレクトリへのアクセスは許可されていません' },
        { status: 403 }
      )
    }

    // ディレクトリの存在確認
    if (!fs.existsSync(normalizedPath)) {
      return NextResponse.json(
        { error: 'ディレクトリが見つかりません' },
        { status: 404 }
      )
    }

    const stats = fs.statSync(normalizedPath)
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { error: '指定されたパスはディレクトリではありません' },
        { status: 400 }
      )
    }

    // ディレクトリ内容を読み取り
    const items: DirectoryItem[] = []
    
    try {
      const entries = fs.readdirSync(normalizedPath)
      
      for (const entry of entries) {
        // 隠しファイル・ディレクトリをスキップ（オプション）
        if (entry.startsWith('.') && entry !== '..' && entry !== '.') {
          continue
        }
        
        const fullPath = path.join(normalizedPath, entry)
        
        try {
          const entryStats = fs.statSync(fullPath)
          const isDirectory = entryStats.isDirectory()
          
          // filterDirectoriesOnly が true の場合、ディレクトリのみを含める
          if (filterDirectoriesOnly && !isDirectory) {
            continue
          }
          
          items.push({
            name: entry,
            path: fullPath,
            isDirectory,
            size: isDirectory ? undefined : entryStats.size,
            modified: entryStats.mtime.toISOString()
          })
        } catch (statError) {
          // アクセス権限がない場合などはスキップ
          console.warn(`Unable to stat ${fullPath}:`, statError)
          continue
        }
      }
      
      // ディレクトリを先に、ファイルを後に、それぞれ名前順でソート
      items.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1
        }
        return a.name.localeCompare(b.name, 'ja', { numeric: true })
      })
      
    } catch (readError) {
      return NextResponse.json(
        { error: 'ディレクトリの読み取りに失敗しました' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      path: normalizedPath,
      items,
      count: items.length
    })

  } catch (error) {
    console.error('Directory browse error:', error)
    return NextResponse.json(
      { error: 'ディレクトリの読み込み中にエラーが発生しました' },
      { status: 500 }
    )
  }
}