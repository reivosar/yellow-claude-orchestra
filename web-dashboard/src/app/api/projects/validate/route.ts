import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { path: projectPath } = await request.json()

    if (!projectPath?.trim()) {
      return NextResponse.json({ 
        isValid: false, 
        error: 'プロジェクトパスが指定されていません' 
      })
    }

    // パスの存在確認
    try {
      const stats = await fs.stat(projectPath)
      if (!stats.isDirectory()) {
        return NextResponse.json({
          isValid: false,
          error: '指定されたパスはディレクトリではありません'
        })
      }
    } catch (error) {
      return NextResponse.json({
        isValid: false,
        error: '指定されたパスが存在しません'
      })
    }

    // プロジェクト情報を検出
    const detectedInfo = await detectProjectInfo(projectPath)

    return NextResponse.json({
      isValid: true,
      detectedInfo
    })

  } catch (error) {
    console.error('プロジェクト検証エラー:', error)
    return NextResponse.json({ 
      isValid: false, 
      error: 'プロジェクトの検証中にエラーが発生しました' 
    }, { status: 500 })
  }
}

async function detectProjectInfo(projectPath: string) {
  const detectedInfo: any = {
    name: path.basename(projectPath),
    framework: 'unknown',
    packageManager: 'unknown',
    hasGit: false,
    description: '',
    languages: []
  }

  try {
    const files = await fs.readdir(projectPath)
    
    // package.json の確認
    if (files.includes('package.json')) {
      try {
        const packageJson = JSON.parse(
          await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
        )
        
        if (packageJson.name) {
          detectedInfo.name = packageJson.name
        }
        if (packageJson.description) {
          detectedInfo.description = packageJson.description
        }

        // フレームワークの検出
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
        
        if (dependencies.next) {
          detectedInfo.framework = 'Next.js'
        } else if (dependencies.react) {
          detectedInfo.framework = 'React'
        } else if (dependencies.vue) {
          detectedInfo.framework = 'Vue.js'
        } else if (dependencies.angular || dependencies['@angular/core']) {
          detectedInfo.framework = 'Angular'
        } else if (dependencies.express) {
          detectedInfo.framework = 'Express.js'
        } else if (dependencies.nuxt) {
          detectedInfo.framework = 'Nuxt.js'
        } else if (dependencies.gatsby) {
          detectedInfo.framework = 'Gatsby'
        } else if (dependencies.svelte) {
          detectedInfo.framework = 'Svelte'
        } else {
          detectedInfo.framework = 'Node.js'
        }

        // 言語の検出
        if (dependencies.typescript || dependencies['@types/node']) {
          detectedInfo.languages.push('TypeScript')
        } else {
          detectedInfo.languages.push('JavaScript')
        }
      } catch (error) {
        console.log('package.json 読み込みエラー:', error)
      }
    }

    // パッケージマネージャーの検出
    if (files.includes('package-lock.json')) {
      detectedInfo.packageManager = 'npm'
    } else if (files.includes('yarn.lock')) {
      detectedInfo.packageManager = 'yarn'
    } else if (files.includes('pnpm-lock.yaml')) {
      detectedInfo.packageManager = 'pnpm'
    } else if (files.includes('bun.lockb')) {
      detectedInfo.packageManager = 'bun'
    }

    // Git リポジトリの確認
    if (files.includes('.git')) {
      detectedInfo.hasGit = true
    }

    // Python プロジェクトの検出
    if (files.includes('requirements.txt') || files.includes('pyproject.toml') || files.includes('setup.py')) {
      if (!detectedInfo.languages.includes('Python')) {
        detectedInfo.languages.push('Python')
      }
      
      if (files.includes('manage.py')) {
        detectedInfo.framework = 'Django'
      } else if (files.includes('app.py') || files.includes('main.py')) {
        detectedInfo.framework = 'Flask/FastAPI'
      } else {
        detectedInfo.framework = 'Python'
      }
    }

    // Go プロジェクトの検出
    if (files.includes('go.mod')) {
      detectedInfo.languages.push('Go')
      detectedInfo.framework = 'Go'
    }

    // Rust プロジェクトの検出
    if (files.includes('Cargo.toml')) {
      detectedInfo.languages.push('Rust')
      detectedInfo.framework = 'Rust'
    }

    // Java プロジェクトの検出
    if (files.includes('pom.xml')) {
      detectedInfo.languages.push('Java')
      detectedInfo.framework = 'Maven'
    } else if (files.includes('build.gradle')) {
      detectedInfo.languages.push('Java')
      detectedInfo.framework = 'Gradle'
    }

    // フロントエンドフレームワーク設定ファイルの確認
    if (files.includes('nuxt.config.js') || files.includes('nuxt.config.ts')) {
      detectedInfo.framework = 'Nuxt.js'
    } else if (files.includes('next.config.js') || files.includes('next.config.ts')) {
      detectedInfo.framework = 'Next.js'
    } else if (files.includes('vite.config.js') || files.includes('vite.config.ts')) {
      detectedInfo.framework = 'Vite'
    } else if (files.includes('angular.json')) {
      detectedInfo.framework = 'Angular'
    }

  } catch (error) {
    console.error('プロジェクト情報検出エラー:', error)
  }

  return detectedInfo
}