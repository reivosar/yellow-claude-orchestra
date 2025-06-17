import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const ORCHESTRA_DIR = process.env.ORCHESTRA_DIR || path.resolve(process.cwd(), '..')

// Producer エージェントにメッセージを送信
async function sendMessageToProducer(taskId: string, message: string): Promise<void> {
  const messageDir = path.join(ORCHESTRA_DIR, 'communication', 'messages')
  await fs.mkdir(messageDir, { recursive: true })
  
  const messageData = {
    id: `msg-${taskId}-${Date.now()}`,
    type: 'task_update',
    from: 'web_dashboard',
    to: 'producer',
    timestamp: new Date().toISOString(),
    data: {
      taskId,
      message,
      action: 'append_message'
    }
  }
  
  const messageFile = path.join(messageDir, `msg-${taskId}-${Date.now()}.json`)
  await fs.writeFile(messageFile, JSON.stringify(messageData, null, 2))
  
  console.log(`メッセージ ${messageData.id} をProducerエージェントに送信しました`)
}

// POST /api/tasks/[id]/messages - タスクにメッセージを追加
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id
    const { message } = await request.json()
    
    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      )
    }
    
    // Producer エージェントにメッセージを送信
    await sendMessageToProducer(taskId, message)
    
    return NextResponse.json({
      success: true,
      message: 'メッセージがProducerエージェントに送信されました'
    })
    
  } catch (error) {
    console.error('メッセージ送信エラー:', error)
    return NextResponse.json(
      { error: 'メッセージの送信に失敗しました' },
      { status: 500 }
    )
  }
}