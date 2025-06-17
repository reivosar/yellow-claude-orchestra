#!/bin/bash

# Yellow Claude Orchestra - 全体停止スクリプト
# エージェントシステム + Webダッシュボードを停止

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Yellow Claude Orchestra 全体停止"
echo "=========================================="
echo ""

# 1. エージェントシステムの停止
echo "1. エージェントシステムを停止中..."
if [ -f "$SCRIPT_DIR/stop-agents-only.sh" ]; then
    "$SCRIPT_DIR/stop-agents-only.sh"
else
    echo "   警告: stop-agents-only.sh が見つかりません"
fi

echo ""

# 2. Webダッシュボードの停止
echo "2. Webダッシュボードを停止中..."
if [ -f "$SCRIPT_DIR/stop-web.sh" ]; then
    "$SCRIPT_DIR/stop-web.sh"
else
    echo "   警告: stop-web.sh が見つかりません"
fi

echo ""
echo "=========================================="
echo "Yellow Claude Orchestra 全体停止完了"
echo "=========================================="
echo ""

# 最終確認
remaining_processes=$(pgrep -f "claude-code\|npm run dev\|next dev\|message_hub.py\|agent_client.py" 2>/dev/null || true)

if [ -n "$remaining_processes" ]; then
    echo "警告: まだ実行中のプロセスがあります:"
    ps -p $remaining_processes -o pid,ppid,cmd 2>/dev/null || true
    echo ""
    echo "手動で停止する場合: kill $remaining_processes"
else
    echo "すべてのプロセスが正常に停止しました"
fi

echo ""
echo "再起動方法:"
echo "  ./start.sh                      # エージェント + Webダッシュボード"
echo "  ./start-agents-only.sh          # エージェントのみ"
echo "  cd web-dashboard && npm run dev # Webダッシュボードのみ"