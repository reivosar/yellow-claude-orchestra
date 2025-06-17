#!/bin/bash

# Yellow Claude Orchestra - Webダッシュボード停止スクリプト

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Webダッシュボードを停止中..."

# PIDファイルから停止
if [ -f "$SCRIPT_DIR/web-dashboard.pid" ]; then
    WEB_PID=$(cat "$SCRIPT_DIR/web-dashboard.pid")
    
    if kill -0 "$WEB_PID" 2>/dev/null; then
        echo "Webダッシュボード (PID: $WEB_PID) を停止中..."
        kill -TERM "$WEB_PID" 2>/dev/null || true
        sleep 2
        
        if kill -0 "$WEB_PID" 2>/dev/null; then
            echo "強制終了中..."
            kill -KILL "$WEB_PID" 2>/dev/null || true
        fi
        
        echo "Webダッシュボードを停止しました"
    else
        echo "Webダッシュボードは既に停止しています"
    fi
    
    rm -f "$SCRIPT_DIR/web-dashboard.pid"
else
    echo "PIDファイルが見つかりません。プロセス名で検索します..."
fi

# プロセス名での検索・停止
WEB_PIDS=$(pgrep -f "npm run dev\|next dev" 2>/dev/null || true)

if [ -n "$WEB_PIDS" ]; then
    echo "実行中のNext.jsプロセスを発見: $WEB_PIDS"
    for pid in $WEB_PIDS; do
        echo "Next.jsプロセス (PID: $pid) を停止中..."
        kill -TERM "$pid" 2>/dev/null || true
        sleep 1
        
        if kill -0 "$pid" 2>/dev/null; then
            kill -KILL "$pid" 2>/dev/null || true
        fi
    done
    echo "Next.jsプロセスを停止しました"
else
    echo "実行中のNext.jsプロセスは見つかりませんでした"
fi

echo "Webダッシュボードの停止が完了しました"