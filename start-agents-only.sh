#!/bin/bash

# Yellow Claude Orchestra - エージェント起動スクリプト
# 権限問題を解決した起動システム

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config/agents.json"
AGENTS_DIR="$SCRIPT_DIR/agents"
COMMUNICATION_DIR="$SCRIPT_DIR/communication"

# 設定ファイルの存在確認
if [ ! -f "$CONFIG_FILE" ]; then
    echo "エラー: agents.json設定ファイルが見つかりません"
    echo "場所: $CONFIG_FILE"
    exit 1
fi

# ログディレクトリの作成
mkdir -p "$SCRIPT_DIR/logs"

# 通信用ディレクトリの初期化
mkdir -p "$COMMUNICATION_DIR/messages"
mkdir -p "$COMMUNICATION_DIR/shared"

# 権限設定（必要に応じて）
chmod -R 755 "$SCRIPT_DIR"

# エージェント設定の読み込みと起動
echo "Yellow Claude Orchestra を起動中..."

# JSONから設定を読み取り、各エージェントを起動
if command -v jq &> /dev/null; then
    # jqが利用可能な場合
    agents=$(jq -c '.agents[]' "$CONFIG_FILE")
    while IFS= read -r agent; do
        name=$(echo "$agent" | jq -r '.name')
        type=$(echo "$agent" | jq -r '.type')
        config=$(echo "$agent" | jq -r '.config')
        
        echo "エージェント '$name' (タイプ: $type) を起動中..."
        
        # エージェント用ディレクトリの作成
        agent_dir="$AGENTS_DIR/$name"
        mkdir -p "$agent_dir"
        
        # エージェント設定ファイルの作成
        echo "$config" > "$agent_dir/config.json"
        
        # ログファイルの設定
        log_file="$SCRIPT_DIR/logs/${name}.log"
        
        # バックグラウンドでエージェントプロセスを開始
        case "$type" in
            "claude-code")
                if command -v claude-code &> /dev/null; then
                    nohup claude-code --config "$agent_dir/config.json" > "$log_file" 2>&1 &
                    agent_pid=$!
                    echo "✓ エージェント '$name' が起動しました (PID: $agent_pid)"
                    echo "$agent_pid" > "$agent_dir/pid"
                    echo "active" > "$agent_dir/status"
                else
                    echo "⚠️  Claude Code CLI未インストール: $name をスキップ"
                fi
                ;;
            "custom")
                # カスタムエージェントの起動ロジック
                echo "カスタムエージェント $name の起動ロジックを実装してください"
                ;;
            *)
                echo "警告: 未知のエージェントタイプ '$type' for '$name'"
                ;;
        esac
        
    done <<< "$agents"
else
    echo "警告: jqが見つかりません。基本的な起動のみ実行します"
    echo "jqをインストールすることをお勧めします: brew install jq"
fi

# 通信システムの初期化
echo "通信システムを初期化中..."
touch "$COMMUNICATION_DIR/messages/system.log"
echo "$(date): Yellow Claude Orchestra システム起動完了" >> "$COMMUNICATION_DIR/messages/system.log"

# Task Processorの起動
echo "Task Processor を起動中..."
if [ -f "$SCRIPT_DIR/venv/bin/activate" ]; then
    source "$SCRIPT_DIR/venv/bin/activate"
fi

nohup python "$SCRIPT_DIR/task_processor.py" "$SCRIPT_DIR" > "$SCRIPT_DIR/logs/task_processor.log" 2>&1 &
task_processor_pid=$!
echo "✓ Task Processor が起動しました (PID: $task_processor_pid)"
echo "$task_processor_pid" > "$COMMUNICATION_DIR/task_processor.pid"

# WebSocket Bridgeの起動
echo "WebSocket Bridge を起動中..."
if [ -f "$COMMUNICATION_DIR/websocket_bridge.py" ]; then
    nohup python "$COMMUNICATION_DIR/websocket_bridge.py" "$SCRIPT_DIR" > "$SCRIPT_DIR/logs/websocket_bridge.log" 2>&1 &
    websocket_pid=$!
    echo "✓ WebSocket Bridge が起動しました (PID: $websocket_pid)"
    echo "$websocket_pid" > "$COMMUNICATION_DIR/websocket_bridge.pid"
else
    echo "⚠️  WebSocket Bridge が見つかりません"
fi

echo ""
echo "🎼 Yellow Claude Orchestra が起動しました！"
echo ""
echo "ログ確認: tail -f logs/*.log"
echo "停止方法: ./stop.sh"
echo "設定確認: cat config/agents.json"
echo ""