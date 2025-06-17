import { NextRequest } from 'next/server'
import { Server } from 'socket.io'
import { Server as HTTPServer } from 'http'
import fs from 'fs'
import path from 'path'
import { AgentLog, AgentStatus } from '@/types/agent'

// WebSocketサーバーのインスタンス
let io: Server | null = null

// ログファイル監視とエージェント状態管理
const ORCHESTRA_DIR = process.env.ORCHESTRA_DIR || path.resolve(process.cwd(), '..')
const LOGS_DIR = path.join(ORCHESTRA_DIR, 'logs')
const COMMUNICATION_DIR = path.join(ORCHESTRA_DIR, 'communication')

// エージェント状態を管理
const agentStatuses = new Map<string, AgentStatus>()

// ログファイルを監視してリアルタイム更新
function watchLogFiles() {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      console.log('ログディレクトリが見つかりません:', LOGS_DIR)
      return
    }

    // ログファイルを監視
    const watcher = fs.watch(LOGS_DIR, { recursive: true }, (eventType, filename) => {
      try {
        if (eventType === 'change' && filename && filename.endsWith('.log')) {
          const logPath = path.join(LOGS_DIR, filename)
          readLatestLogEntry(logPath, filename)
        }
      } catch (error) {
        console.error('ログファイル監視中にエラーが発生:', error)
      }
    })

    // エラーハンドリング
    watcher.on('error', (error) => {
      console.error('ログファイル監視エラー:', error)
      // 監視を再開
      setTimeout(() => {
        console.log('ログファイル監視を再開します')
        watchLogFiles()
      }, 5000)
    })

    console.log('ログファイル監視を開始しました:', LOGS_DIR)
  } catch (error) {
    console.error('ログファイル監視の初期化に失敗:', error)
  }
}

// 最新のログエントリを読み取り
function readLatestLogEntry(logPath: string, filename: string) {
  try {
    const content = fs.readFileSync(logPath, 'utf-8')
    const lines = content.trim().split('\n')
    const lastLine = lines[lines.length - 1]

    if (lastLine && io) {
      // ログの解析とフォーマット
      const log = parseLogEntry(lastLine, filename)
      if (log) {
        io.emit('log', log)
      }
    }
  } catch (error) {
    console.error('ログファイル読み取りエラー:', error)
  }
}

// ログエントリを解析
function parseLogEntry(line: string, filename: string): AgentLog | null {
  try {
    // ログファイル名からエージェント情報を抽出
    const agentMatch = filename.match(/^(\w+)[-_]?(\d+)?\.log$/)
    if (!agentMatch) return null

    const agentType = agentMatch[1]
    const agentId = `${agentType}-${agentMatch[2] || '01'}`

    // 簡単なログ解析（実際の形式に合わせて調整）
    const timestamp = new Date().toISOString()
    
    return {
      id: `${Date.now()}-${Math.random()}`,
      timestamp,
      agentType: agentType as any,
      agentId,
      message: line,
      level: 'info'
    }
  } catch (error) {
    console.error('ログ解析エラー:', error)
    return null
  }
}

// エージェント状態を監視
function watchAgentStatus() {
  try {
    if (!fs.existsSync(COMMUNICATION_DIR)) {
      console.log('通信ディレクトリが見つかりません:', COMMUNICATION_DIR)
      return
    }

    // エージェント状態ファイルを監視
    const statusFile = path.join(COMMUNICATION_DIR, 'agent_status.json')
    
    if (fs.existsSync(statusFile)) {
      fs.watchFile(statusFile, (curr, prev) => {
        try {
          if (curr.mtime !== prev.mtime) {
            readAgentStatus(statusFile)
          }
        } catch (error) {
          console.error('エージェント状態ファイル監視中にエラーが発生:', error)
        }
      })
    }

    // 定期的にエージェント状態を更新
    const statusInterval = setInterval(() => {
      try {
        readAgentStatus(statusFile)
        broadcastAgentStatus()
      } catch (error) {
        console.error('定期的なエージェント状態更新中にエラーが発生:', error)
      }
    }, 5000)

    // グローバルにインターバルを保存してクリーンアップ可能にする
    ;(global as any).statusInterval = statusInterval

    console.log('エージェント状態監視を開始しました')
  } catch (error) {
    console.error('エージェント状態監視の初期化に失敗:', error)
  }
}

// エージェント状態を読み取り
function readAgentStatus(statusFile: string) {
  try {
    if (fs.existsSync(statusFile)) {
      const content = fs.readFileSync(statusFile, 'utf-8')
      const statuses: AgentStatus[] = JSON.parse(content)
      
      // 状態を更新
      statuses.forEach(status => {
        agentStatuses.set(status.id, status)
      })
    }
  } catch (error) {
    console.error('エージェント状態読み取りエラー:', error)
  }
}

// エージェント状態をブロードキャスト
function broadcastAgentStatus() {
  if (io && agentStatuses.size > 0) {
    const statusArray = Array.from(agentStatuses.values())
    io.emit('agents', statusArray)
  }
}

// WebSocketサーバーの初期化
function initializeWebSocket() {
  if (io) return io

  try {
    // Next.js API RouteでWebSocketを使用する場合の設定
    const httpServer = new HTTPServer()
    io = new Server(httpServer, {
      cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    })

    io.on('connection', (socket) => {
      console.log('クライアントが接続しました:', socket.id)

      // 接続時に現在の状態を送信
      try {
        const statusArray = Array.from(agentStatuses.values())
        if (statusArray.length > 0) {
          socket.emit('agents', statusArray)
        }
      } catch (error) {
        console.error('初期状態送信エラー:', error)
      }

      socket.on('disconnect', (reason) => {
        console.log('クライアントが切断しました:', socket.id, 'reason:', reason)
      })

      socket.on('error', (error) => {
        console.error('Socket エラー:', error)
      })

      // システム状態要求
      socket.on('requestStatus', () => {
        try {
          const statusArray = Array.from(agentStatuses.values())
          socket.emit('agents', statusArray)
        } catch (error) {
          console.error('状態要求処理エラー:', error)
          socket.emit('error', { message: '状態の取得に失敗しました' })
        }
      })
    })

    // サーバーレベルのエラーハンドリング
    io.on('error', (error) => {
      console.error('WebSocket サーバーエラー:', error)
    })

    // HTTPサーバーのエラーハンドリング
    httpServer.on('error', (error: any) => {
      console.error('HTTP サーバーエラー:', error)
      if (error.code === 'EADDRINUSE') {
        console.log('ポート8001が使用中です。既存のサーバーを使用します。')
        return io
      }
    })

    // ファイル監視を開始
    watchLogFiles()
    watchAgentStatus()

    // ポート8001でWebSocketサーバーを起動
    httpServer.listen(8001, () => {
      console.log('WebSocketサーバーが起動しました: http://localhost:8001')
    })

  } catch (error) {
    console.error('WebSocketサーバーの初期化に失敗:', error)
    io = null
  }

  return io
}

// API Route handlers
export async function GET(request: NextRequest) {
  // WebSocketサーバーの初期化
  const server = initializeWebSocket()
  
  return new Response(JSON.stringify({ 
    status: 'WebSocket server initialized',
    port: 8001,
    connected: server ? true : false
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // メッセージをブロードキャスト
    if (io && body.type === 'broadcast') {
      io.emit(body.event, body.data)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}