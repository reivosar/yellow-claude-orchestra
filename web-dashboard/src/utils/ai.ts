import OpenAI from 'openai'

// OpenAI クライアントの初期化
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

/**
 * タスクの説明から短いタイトルを生成する
 * @param description タスクの説明文
 * @returns 生成されたタイトル
 */
export async function generateTaskTitle(description: string): Promise<string> {
  // OpenAI APIキーが設定されていない場合は、説明の最初の部分を返す
  if (!openai) {
    console.warn('OpenAI API key not configured. Using fallback title generation.')
    return generateFallbackTitle(description)
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'あなたはタスクのタイトルを生成するアシスタントです。与えられた説明文から、簡潔で分かりやすい日本語のタイトルを生成してください。タイトルは10文字以内で、名詞形で終わるようにしてください。例: パフォーマンス改善、認証機能実装、バグ修正、UI改良など'
        },
        {
          role: 'user',
          content: `次の説明文から短いタイトルを生成してください：\n\n${description}`
        }
      ],
      temperature: 0.7,
      max_tokens: 50,
    })

    const title = completion.choices[0]?.message?.content?.trim()
    if (title) {
      return title
    }
  } catch (error) {
    console.error('Failed to generate title with OpenAI:', error)
  }

  // エラーが発生した場合はフォールバックを使用
  return generateFallbackTitle(description)
}

/**
 * OpenAI APIが使用できない場合のフォールバックタイトル生成
 * @param description タスクの説明文
 * @returns 生成されたタイトル
 */
function generateFallbackTitle(description: string): string {
  // 説明文を整形
  const cleaned = description.trim()
  
  // 改行で分割して最初の行を取得
  const firstLine = cleaned.split('\n')[0]
  
  // 句読点で分割して最初の文を取得
  const firstSentence = firstLine.split(/[。、]/)[0]
  
  // 長すぎる場合は短縮
  if (firstSentence.length > 20) {
    // キーワードを抽出する簡単なロジック
    const keywords = firstSentence
      .split(/[をにでがはのと\s]+/)
      .filter(word => word.length > 1)
      .slice(0, 3)
    
    if (keywords.length > 0) {
      return keywords.join('') + 'の実装'
    }
  }
  
  return firstSentence || '新しいタスク'
}

/**
 * タイトルが既に適切かどうかをチェック
 * @param title タイトル
 * @param description 説明文
 * @returns タイトルが適切な場合はtrue
 */
export function isValidTitle(title: string, description: string): boolean {
  // タイトルが空または説明文と同じ場合は無効
  if (!title || title === description) {
    return false
  }
  
  // タイトルが長すぎる場合は無効（30文字以上）
  if (title.length > 30) {
    return false
  }
  
  // タイトルが説明文の最初の部分と完全に一致する場合は無効
  if (description.startsWith(title) && title.length > 50) {
    return false
  }
  
  return true
}