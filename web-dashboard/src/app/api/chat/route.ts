import { NextRequest, NextResponse } from 'next/server'

// チャットメッセージの型定義
interface ChatRequest {
  taskId: string
  message: string
  context: Array<{
    role: 'user' | 'assistant'
    content: string
    agentType?: string
  }>
}

// エージェントの応答をシミュレート
function generateAgentResponse(message: string, context: any[], currentAgent: string): { response: string; nextAgent?: string } {
  const lowerMessage = message.toLowerCase()
  
  // Producer（要件定義）フェーズ
  if (currentAgent === 'producer') {
    if (context.length <= 2) {
      return {
        response: `なるほど、理解しました。\n\n以下の点について確認させてください：\n\n1. 使用する技術スタックやフレームワークはありますか？\n2. 特に重視する要件（パフォーマンス、セキュリティ、使いやすさなど）はありますか？\n3. 既存のコードベースに追加する形ですか、それとも新規作成ですか？`,
        nextAgent: 'producer'
      }
    } else if (context.length <= 4) {
      return {
        response: `承知しました。要件を整理すると：\n\n${message}\n\nこの理解で正しいでしょうか？正しければ、Directorに引き継いで実装計画を立てさせていただきます。`,
        nextAgent: 'director'
      }
    }
  }
  
  // Director（設計・レビュー）フェーズ
  if (currentAgent === 'director' || context.some(c => c.content.includes('Directorに引き継いで'))) {
    if (!context.some(c => c.agentType === 'director')) {
      return {
        response: `Directorです。要件を確認しました。\n\n実装計画を立てます：\n\n1. **アーキテクチャ設計**\n   - コンポーネント構造の設計\n   - データフローの定義\n\n2. **実装手順**\n   - 基本機能の実装\n   - エラーハンドリング\n   - テストの作成\n\n3. **想定される課題**\n   - パフォーマンスの考慮点\n   - セキュリティの確認事項\n\nこの計画で進めてよろしいですか？`,
        nextAgent: 'director'
      }
    } else {
      return {
        response: `了解しました。それでは、Actorに実装を開始させます。\n\n実装中は随時進捗を報告し、必要に応じて確認をお願いすることがあります。`,
        nextAgent: 'actor'
      }
    }
  }
  
  // Actor（実装）フェーズ
  if (currentAgent === 'actor' || context.some(c => c.content.includes('Actorに実装を開始'))) {
    return {
      response: `Actorです。実装を開始します。\n\n🔧 **実装中...**\n\n\`\`\`typescript\n// サンプル実装コード\nfunction processTask(input: string): string {\n  // 実装の詳細\n  return "処理結果"\n}\n\`\`\`\n\n基本的な実装が完了しました。動作確認をお願いできますか？\n\nまた、追加の要望や修正点があればお知らせください。`,
      nextAgent: 'actor'
    }
  }
  
  // デフォルト応答
  return {
    response: `ご質問ありがとうございます。「${message}」について確認させていただきます。\n\nもう少し詳しく教えていただけますか？`,
    nextAgent: 'producer'
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { taskId, message, context } = body
    
    // 現在のエージェントを判定
    const lastAssistantMessage = [...context].reverse().find(m => m.role === 'assistant')
    const currentAgent = lastAssistantMessage?.agentType || 'producer'
    
    // エージェントの応答を生成
    const { response, nextAgent } = generateAgentResponse(message, context, currentAgent)
    
    // シミュレートされた処理時間
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return NextResponse.json({
      success: true,
      response,
      agentType: nextAgent || currentAgent,
      taskId
    })
    
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'チャット処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}