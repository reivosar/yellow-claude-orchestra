#!/bin/bash
# Yellow Claude Orchestra環境をアクティベート

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 仮想環境アクティベート
source "$SCRIPT_DIR/venv/bin/activate"

# 環境変数読み込み
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
fi

echo "🎼 Yellow Claude Orchestra環境がアクティベートされました"
echo "📊 システム情報:"
echo "  - OS: $OS_TYPE"
echo "  - CPU: ${CPU_CORES}コア"
echo "  - メモリ: ${MEMORY_GB}GB"
echo "  - 最大Actor数: ${MAX_ACTORS}"
echo ""
echo "🚀 使用方法:"
echo "  ./start.sh    # システム起動"
echo "  ./stop.sh     # システム停止"
echo "  deactivate    # 環境終了"
echo ""
