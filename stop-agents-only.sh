#!/bin/bash

# Yellow Claude Orchestra - 全エージェント停止スクリプト
# 安全にすべてのエージェントプロセスを終了する

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$SCRIPT_DIR/agents"
COMMUNICATION_DIR="$SCRIPT_DIR/communication"

echo "🛑 Yellow Claude Orchestra を停止中..."

# PIDファイルから実行中のエージェントを特定して停止
if [ -d "$AGENTS_DIR" ]; then
    for agent_dir in "$AGENTS_DIR"/*/; do
        if [ -d "$agent_dir" ]; then
            agent_name=$(basename "$agent_dir")
            pid_file="$agent_dir/pid"
            
            if [ -f "$pid_file" ]; then
                pid=$(cat "$pid_file")
                
                # プロセスが実際に実行中かチェック
                if kill -0 "$pid" 2>/dev/null; then
                    echo "エージェント '$agent_name' (PID: $pid) を停止中..."
                    
                    # まずは穏やかに終了を試行
                    kill -TERM "$pid" 2>/dev/null || true
                    
                    # 少し待つ
                    sleep 2
                    
                    # まだ実行中なら強制終了
                    if kill -0 "$pid" 2>/dev/null; then
                        echo "エージェント '$agent_name' を強制終了中..."
                        kill -KILL "$pid" 2>/dev/null || true
                    fi
                    
                    echo "✅ エージェント '$agent_name' を停止しました"
                else
                    echo "⚠️  エージェント '$agent_name' のプロセス (PID: $pid) は既に停止しています"
                fi
                
                # PIDファイルを削除
                rm -f "$pid_file"
            fi
        fi
    done
else
    echo "エージェントディレクトリが見つかりません: $AGENTS_DIR"
fi

# 名前でプロセスを検索して停止（バックアップ方法）
echo "Claude Codeプロセスを検索中..."

# Claude Codeプロセスを検索
claude_pids=$(pgrep -f "claude-code" 2>/dev/null || true)

if [ -n "$claude_pids" ]; then
    echo "実行中のClaude Codeプロセスを発見: $claude_pids"
    for pid in $claude_pids; do
        echo "Claude Codeプロセス (PID: $pid) を停止中..."
        kill -TERM "$pid" 2>/dev/null || true
        sleep 1
        
        # まだ実行中なら強制終了
        if kill -0 "$pid" 2>/dev/null; then
            kill -KILL "$pid" 2>/dev/null || true
        fi
    done
    echo "✅ Claude Codeプロセスを停止しました"
else
    echo "実行中のClaude Codeプロセスは見つかりませんでした"
fi

# WebSocket Bridgeの停止
if [ -f "$COMMUNICATION_DIR/websocket_bridge.pid" ]; then
    websocket_pid=$(cat "$COMMUNICATION_DIR/websocket_bridge.pid")
    if kill -0 "$websocket_pid" 2>/dev/null; then
        echo "WebSocket Bridge (PID: $websocket_pid) を停止中..."
        kill -TERM "$websocket_pid" 2>/dev/null || true
        sleep 2
        if kill -0 "$websocket_pid" 2>/dev/null; then
            kill -KILL "$websocket_pid" 2>/dev/null || true
        fi
        echo "✅ WebSocket Bridge を停止しました"
    fi
    rm -f "$COMMUNICATION_DIR/websocket_bridge.pid"
fi

# Python通信プロセスの停止
python_pids=$(pgrep -f "message_hub.py\|agent_client.py\|websocket_bridge.py" 2>/dev/null || true)

if [ -n "$python_pids" ]; then
    echo "通信システムプロセスを停止中..."
    for pid in $python_pids; do
        echo "通信プロセス (PID: $pid) を停止中..."
        kill -TERM "$pid" 2>/dev/null || true
        sleep 1
        
        if kill -0 "$pid" 2>/dev/null; then
            kill -KILL "$pid" 2>/dev/null || true
        fi
    done
    echo "✅ 通信システムを停止しました"
fi

# 停止ログの記録
if [ -d "$COMMUNICATION_DIR/messages" ]; then
    echo "$(date): Yellow Claude Orchestra システム停止完了" >> "$COMMUNICATION_DIR/messages/system.log"
fi

# 一時ファイルのクリーンアップ（オプション）
echo "一時ファイルをクリーンアップ中..."

# ロックファイルの削除
find "$SCRIPT_DIR" -name "*.lock" -type f -delete 2>/dev/null || true

# 古いログファイルの圧縮（7日以上古い）
if [ -d "$SCRIPT_DIR/logs" ]; then
    find "$SCRIPT_DIR/logs" -name "*.log" -type f -mtime +7 -exec gzip {} \; 2>/dev/null || true
fi

# エージェントディレクトリの状態更新
for agent_dir in "$AGENTS_DIR"/*/; do
    if [ -d "$agent_dir" ]; then
        # ステータスファイルの更新
        echo "stopped" > "$agent_dir/status" 2>/dev/null || true
    fi
done

echo ""
echo "🛑 Yellow Claude Orchestra の停止が完了しました"
echo ""
echo "状態確認:"
echo "  プロセス確認: ps aux | grep claude-code"
echo "  再起動: ./start.sh"
echo "  ログ確認: ls -la logs/"
echo ""

# 最終確認
remaining_processes=$(pgrep -f "claude-code\|message_hub.py\|agent_client.py" 2>/dev/null || true)

if [ -n "$remaining_processes" ]; then
    echo "⚠️  まだ実行中のプロセスがあります:"
    ps -p $remaining_processes -o pid,ppid,cmd 2>/dev/null || true
    echo ""
    echo "手動で停止する場合: kill $remaining_processes"
else
    echo "✅ すべてのプロセスが正常に停止しました"
fi