#!/bin/bash

# Yellow Claude Orchestra - 統合起動スクリプト
# エージェントシステム + Webダッシュボードを同時起動

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Yellow Claude Orchestra 統合起動"
echo "=========================================="
echo ""

# 環境確認
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "エラー: 環境設定ファイルが見つかりません"
    echo "先に setup.sh を実行してください"
    exit 1
fi

# 環境変数読み込み
source "$SCRIPT_DIR/.env"

echo "システム起動中..."
echo ""

# 1. エージェントシステムの起動
echo "1. エージェントシステムを起動しています..."
if [ -f "$SCRIPT_DIR/start-agents-only.sh" ]; then
    # バックグラウンドで起動
    "$SCRIPT_DIR/start-agents-only.sh" &
    AGENTS_PID=$!
    echo "   エージェントシステムが起動しました (PID: $AGENTS_PID)"
else
    echo "   警告: start-agents-only.sh が見つかりません"
fi

# 少し待機
sleep 3

# 2. Webダッシュボードの起動
echo ""
echo "2. Webダッシュボードを起動しています..."
if [ -d "$SCRIPT_DIR/web-dashboard" ] && [ -f "$SCRIPT_DIR/web-dashboard/package.json" ]; then
    cd "$SCRIPT_DIR/web-dashboard"
    
    # 開発サーバーをバックグラウンドで起動
    npm run dev > "$SCRIPT_DIR/logs/web-dashboard.log" 2>&1 &
    WEB_PID=$!
    echo "   Webダッシュボードが起動しました (PID: $WEB_PID)"
    
    # PIDを保存
    echo "$WEB_PID" > "$SCRIPT_DIR/web-dashboard.pid"
    
    cd "$SCRIPT_DIR"
else
    echo "   警告: web-dashboard が見つかりません"
    WEB_PID=""
fi

echo ""
echo "=========================================="
echo "Yellow Claude Orchestra 起動完了！"
echo "=========================================="
echo ""

if [ -n "$AGENTS_PID" ]; then
    echo "エージェントシステム:"
    echo "  プロセスID: $AGENTS_PID"
    echo "  ログ確認: tail -f logs/*.log"
fi

if [ -n "$WEB_PID" ]; then
    echo ""
    echo "Webダッシュボード:"
    echo "  プロセスID: $WEB_PID"
    echo "  URL: http://localhost:3000"
    echo "  ログ確認: tail -f logs/web-dashboard.log"
fi

echo ""
echo "停止方法:"
echo "  エージェント: ./stop.sh"
echo "  Webダッシュボード: ./stop-web.sh"
echo "  全て停止: ./stop-all.sh"
echo ""

# Webダッシュボードの起動待機
if [ -n "$WEB_PID" ]; then
    echo "Webダッシュボードの起動を待機中..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "Webダッシュボードが利用可能になりました！"
            echo "ブラウザで http://localhost:3000 にアクセスしてください"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""
fi

echo "Yellow Claude Orchestra へようこそ！"
echo "リアルタイムでエージェントの動作を監視できます。"