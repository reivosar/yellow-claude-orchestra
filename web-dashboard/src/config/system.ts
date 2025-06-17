// システム設定
export const SYSTEM_CONFIG = {
  // ポーリング設定
  polling: {
    // チャット画面のポーリング間隔（ミリ秒）
    chatInterval: 3000,
    // タスク管理画面のポーリング間隔（ミリ秒）
    taskInterval: 5000,
    // ログビューアのポーリング間隔（ミリ秒）
    logInterval: 5000,
  },
  
  // タイムアウト設定
  timeout: {
    // API リクエストのタイムアウト（ミリ秒）
    apiRequest: 30000,
    // メッセージ送信後の応答待ちタイムアウト（ミリ秒）
    messageResponse: 60000,
  },
  
  // 表示設定
  display: {
    // 1ページあたりの表示件数
    itemsPerPage: 20,
    // チャットメッセージの最大表示数
    maxChatMessages: 100,
    // ログの最大表示行数
    maxLogLines: 500,
  },
  
  // Claude Code CLI設定
  claudeCodeCLI: {
    // タイムアウト（秒）
    timeout: 5,
    // リトライ回数
    maxRetries: 3,
  }
}