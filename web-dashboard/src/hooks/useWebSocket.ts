import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { AgentLog, AgentStatus } from '@/types/agent'

interface UseWebSocketReturn {
  logs: AgentLog[]
  agents: AgentStatus[]
  isConnected: boolean
  connectionError: string | null
  sendMessage?: (data: any) => boolean
}

interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface WebSocketOptions {
  onMessage?: (data: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket(url?: string, options?: WebSocketOptions): UseWebSocketReturn {
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  
  // チャット用のメッセージ送信関数
  const sendMessage = useCallback((data: WebSocketMessage) => {
    if (socketRef.current?.connected) {
      try {
        socketRef.current.emit('message', data)
        return true
      } catch (error) {
        console.error('Failed to send message via Socket.IO:', error)
        return false
      }
    } else if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(data))
        return true
      } catch (error) {
        console.error('Failed to send message via WebSocket:', error)
        return false
      }
    } else {
      console.warn('No active connection available to send message:', data)
      return false
    }
  }, [])

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null
    
    const connectWebSocket = async () => {
      // 既に接続されている場合はスキップ
      if (socketRef.current?.connected) {
        console.log('WebSocketは既に接続されています')
        return
      }
      
      try {
        // WebSocketサーバーを初期化
        await initializeWebSocketServer()

        // Socket.IOクライアントを接続
        const socket = io('http://localhost:8001', {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
          reconnectionAttempts: 10,
          timeout: 20000,
          forceNew: true
        })

        socketRef.current = socket

        // 接続イベント
        socket.on('connect', () => {
          console.log('WebSocketに接続しました:', socket.id)
          setIsConnected(true)
          setConnectionError(null)
          
          // 初期状態を要求
          socket.emit('requestStatus')
          
          // 再接続タイムアウトをクリア
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
          }
        })

        // 切断イベント
        socket.on('disconnect', (reason) => {
          console.log('WebSocketから切断されました:', reason)
          setIsConnected(false)
          
          // 自動再接続の場合はエラーとして扱わない
          if (reason === 'io server disconnect' || reason === 'io client disconnect') {
            setConnectionError(`切断されました: ${reason}`)
          } else {
            setConnectionError(`一時的に切断されました。再接続を試行中...`)
          }
        })

        // 接続エラー
        socket.on('connect_error', (error) => {
          console.error('WebSocket接続エラー:', error)
          setIsConnected(false)
          setConnectionError(`接続エラー: ${error.message || '不明なエラー'}`)
        })

        // 再接続試行
        socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`WebSocket再接続試行 ${attemptNumber}`)
          setConnectionError(`再接続試行中... (${attemptNumber}回目)`)
        })

        // 再接続成功
        socket.on('reconnect', (attemptNumber) => {
          console.log(`WebSocket再接続成功 (${attemptNumber}回目で成功)`)
          setConnectionError(null)
        })

        // 再接続失敗
        socket.on('reconnect_failed', () => {
          console.error('WebSocket再接続に失敗しました')
          setConnectionError('再接続に失敗しました。ページを更新してください。')
          
          // 30秒後に再度接続を試行
          reconnectTimeout = setTimeout(() => {
            console.log('手動で再接続を試行します')
            connectWebSocket()
          }, 30000)
        })

        // サーバーエラー
        socket.on('error', (error) => {
          console.error('WebSocketサーバーエラー:', error)
          setConnectionError(`サーバーエラー: ${error.message || '不明なエラー'}`)
        })

        // ログ受信（エラーハンドリング追加）
        socket.on('log', (log: AgentLog) => {
          try {
            setLogs(prev => {
              const updated = [...prev, log]
              // 最新100件のみ保持
              return updated.slice(-100)
            })
          } catch (error) {
            console.error('ログ受信処理エラー:', error)
          }
        })

        // エージェント状態受信（エラーハンドリング追加）
        socket.on('agents', (agentList: AgentStatus[]) => {
          try {
            if (Array.isArray(agentList)) {
              setAgents(agentList)
            } else {
              console.warn('無効なエージェント状態データを受信:', agentList)
            }
          } catch (error) {
            console.error('エージェント状態受信処理エラー:', error)
          }
        })

        // システム状態更新
        socket.on('systemStatus', (status: any) => {
          try {
            console.log('システム状態更新:', status)
          } catch (error) {
            console.error('システム状態更新処理エラー:', error)
          }
        })

        // チャット用メッセージ受信
        socket.on('message', (data: WebSocketMessage) => {
          try {
            options?.onMessage?.(data)
          } catch (error) {
            console.error('チャットメッセージ受信処理エラー:', error)
          }
        })

        // チャット用のWebSocket接続（URLが指定された場合）
        if (url && options) {
          const wsUrl = url.startsWith('ws') 
            ? url 
            : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${url}`

          try {
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onopen = () => {
              console.log('Chat WebSocket connected:', wsUrl)
              options.onConnect?.()
            }

            ws.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data)
                options.onMessage?.(data)
              } catch (error) {
                console.error('Failed to parse WebSocket message:', error)
              }
            }

            ws.onclose = () => {
              console.log('Chat WebSocket disconnected')
              options.onDisconnect?.()
            }

            ws.onerror = (error) => {
              console.error('Chat WebSocket error:', error)
              options.onError?.(error)
            }
          } catch (error) {
            console.error('Failed to create chat WebSocket:', error)
          }
        }

      } catch (error) {
        console.error('WebSocket初期化エラー:', error)
        setConnectionError('WebSocketの初期化に失敗しました')
        
        // 5秒後に再試行
        reconnectTimeout = setTimeout(() => {
          connectWebSocket()
        }, 5000)
      }
    }

    // 初回接続
    connectWebSocket()

    // クリーンアップ
    return () => {
      console.log('WebSocket接続をクリーンアップします')
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  // WebSocketサーバーを初期化
  const initializeWebSocketServer = async () => {
    try {
      const response = await fetch('/api/websocket', { 
        method: 'GET'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('WebSocketサーバー初期化:', result)
      
      if (!result.connected) {
        throw new Error('WebSocketサーバーの接続に失敗しました')
      }
      
    } catch (error) {
      console.error('WebSocketサーバー初期化エラー:', error)
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      setConnectionError(`WebSocketサーバーの初期化に失敗: ${errorMessage}`)
      throw error // 呼び出し元でキャッチされる
    }
  }

  return {
    logs,
    agents,
    isConnected,
    connectionError,
    sendMessage
  }
}