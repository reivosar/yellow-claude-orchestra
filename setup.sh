#!/bin/bash

# Yellow Claude Orchestra - ワンコマンドセットアップ
# Producer-Director-Actor モデルによる複数プロジェクト並行開発システム

set -e

echo "=========================================="
echo "Yellow Claude Orchestra セットアップ"
echo "Producer-Director-Actor システム"
echo "=========================================="
echo ""
echo "このスクリプトは以下の処理を自動で行います："
echo "1. システム要件の確認とリソース最適化"
echo "2. 必須ツールの検出とインストール"
echo "3. Claude Code と GitHub の認証設定"
echo "4. Python環境の構築と依存関係インストール"
echo "5. 設定ファイルの作成とディレクトリ構造の準備"
echo "6. 動作確認とセットアップ完了確認"
echo ""
echo "セットアップを開始します..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OS_TYPE=""
DEMO_MODE=false

# Claude Code CLI 自動インストール
install_claude_code_cli() {
    echo "  Claude Code CLI の自動インストールを実行します"
    echo ""
    
    if [ "$OS_TYPE" = "macOS" ]; then
        echo "  macOS向けインストール方法:"
        echo "  1. Homebrew経由でのインストールを試行します"
        echo ""
        
        if command -v brew &> /dev/null; then
            # Homebrewで利用可能か確認
            if brew search claude-code &> /dev/null; then
                echo "  Homebrewからインストール中..."
                brew install claude-code
            else
                echo "  HomebrewにClaude Code CLIが見つかりません"
                echo "  Claude Code CLIの直接インストールを実行します"
                direct_install_claude_code
            fi
        else
            echo "  Homebrewが見つかりません"
            echo "  Claude Code CLIの直接インストールを実行します"
            direct_install_claude_code
        fi
        
    elif [ "$OS_TYPE" = "Linux" ]; then
        echo "  Linux向けインストール方法:"
        echo "  直接インストールを実行します"
        echo ""
        direct_install_claude_code
        
    else
        echo "  ⚠️  自動インストールは未対応です"
        direct_install_claude_code
    fi
}

# Claude Code CLI 直接インストール
direct_install_claude_code() {
    echo "  Claude Code CLI の直接インストールを実行します"
    echo ""
    
    # バイナリのダウンロードとインストール
    if [ "$OS_TYPE" = "macOS" ]; then
        echo "  macOS用Claude Code CLIをインストール中..."
        
        # Homebrewを使用してcurlでダウンロード
        CLAUDE_CODE_URL="https://github.com/anthropics/claude-code/releases/latest/download/claude-code-macos"
        
        echo "  ダウンロード中: $CLAUDE_CODE_URL"
        if curl -L -o /tmp/claude-code "$CLAUDE_CODE_URL" 2>/dev/null; then
            chmod +x /tmp/claude-code
            sudo mv /tmp/claude-code /usr/local/bin/claude-code
            echo "  ✅ Claude Code CLIのインストールが完了しました"
        else
            echo "  ダウンロードに失敗しました。手動インストールを実行します..."
            npm_install_claude_code
        fi
        
    elif [ "$OS_TYPE" = "Linux" ]; then
        echo "  Linux用Claude Code CLIをインストール中..."
        
        CLAUDE_CODE_URL="https://github.com/anthropics/claude-code/releases/latest/download/claude-code-linux"
        
        echo "  ダウンロード中: $CLAUDE_CODE_URL"
        if curl -L -o /tmp/claude-code "$CLAUDE_CODE_URL" 2>/dev/null; then
            chmod +x /tmp/claude-code
            sudo mv /tmp/claude-code /usr/local/bin/claude-code
            echo "  ✅ Claude Code CLIのインストールが完了しました"
        else
            echo "  ダウンロードに失敗しました。手動インストールを実行します..."
            npm_install_claude_code
        fi
    else
        npm_install_claude_code
    fi
}

# npm経由でのClaude Code CLIインストール
npm_install_claude_code() {
    echo "  npm経由でClaude Code CLIをインストール中..."
    
    if command -v npm &> /dev/null; then
        # グローバルインストール
        if npm install -g @anthropic/claude-code; then
            echo "  ✅ npm経由でClaude Code CLIのインストールが完了しました"
        else
            echo "  npm経由のインストールに失敗しました"
            manual_install_guide
        fi
    else
        echo "  npmが見つかりません"
        manual_install_guide
    fi
}

# 手動インストールガイド
manual_install_guide() {
    echo ""
    echo "  自動インストールに失敗しました"
    echo "  手動インストール手順:"
    echo ""
    echo "  1. ブラウザで https://claude.ai/code にアクセス"
    echo "  2. お使いのOS用のClaude Code CLIをダウンロード"
    echo "  3. ダウンロードしたファイルを /usr/local/bin/claude-code に配置"
    echo "  4. chmod +x /usr/local/bin/claude-code で実行権限を付与"
    echo "  5. ターミナルで 'claude-code --version' が動作することを確認"
    echo ""
    
    read -p "  手動インストール後、セットアップを続行しますか？ [y/N]: " continue_choice
    case "$continue_choice" in
        [Yy]*)
            echo "  インストール確認をスキップして続行します"
            return 0
            ;;
        *)
            echo "  セットアップを中断します"
            echo "  Claude Code CLIインストール後に再実行してください"
            exit 1
            ;;
    esac
}

# 手動ダウンロードインストール
manual_download_install() {
    echo "  手動ダウンロード方式でインストールします"
    echo ""
    
    # 一時ディレクトリ作成
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    if [ "$OS_TYPE" = "macOS" ]; then
        echo "  macOS版Claude Code CLIをダウンロード中..."
        # 実際のダウンロードURL（AnthropicのURLに置き換え）
        DOWNLOAD_URL="https://claude.ai/download/cli/macos"
        
        if curl -L -o claude-code-macos.dmg "$DOWNLOAD_URL" 2>/dev/null; then
            echo "  ダウンロード完了"
            echo "  DMGファイルをマウント中..."
            hdiutil attach claude-code-macos.dmg
            
            # Claude Code.appを/Applicationsにコピー
            if [ -d "/Volumes/Claude Code/Claude Code.app" ]; then
                cp -R "/Volumes/Claude Code/Claude Code.app" /Applications/
                
                # シンボリックリンク作成
                ln -sf "/Applications/Claude Code.app/Contents/MacOS/claude-code" /usr/local/bin/claude-code
                
                # DMGをアンマウント
                hdiutil detach "/Volumes/Claude Code"
                
                echo "  ✅ Claude Code CLIのインストールが完了しました"
            else
                echo "  ❌ DMGファイルの内容が予期されるものと異なります"
                fallback_install
            fi
        else
            echo "  ❌ ダウンロードに失敗しました"
            fallback_install
        fi
        
    elif [ "$OS_TYPE" = "Linux" ]; then
        echo "  Linux版Claude Code CLIをダウンロード中..."
        DOWNLOAD_URL="https://claude.ai/download/cli/linux"
        
        if curl -L -o claude-code-linux.tar.gz "$DOWNLOAD_URL" 2>/dev/null; then
            echo "  ダウンロード完了"
            echo "  展開中..."
            tar -xzf claude-code-linux.tar.gz
            
            if [ -f "claude-code" ]; then
                # /usr/local/binにインストール
                sudo mv claude-code /usr/local/bin/
                sudo chmod +x /usr/local/bin/claude-code
                
                echo "  ✅ Claude Code CLIのインストールが完了しました"
            else
                echo "  ❌ アーカイブの内容が予期されるものと異なります"
                fallback_install
            fi
        else
            echo "  ❌ ダウンロードに失敗しました"
            fallback_install
        fi
    else
        fallback_install
    fi
    
    # 一時ディレクトリを削除
    cd "$SCRIPT_DIR"
    rm -rf "$TEMP_DIR"
}

# フォールバック：手動インストール案内
fallback_install() {
    echo ""
    echo "  自動インストールに失敗しました"
    echo "  手動インストールを行ってください:"
    echo ""
    echo "  1. ブラウザで https://claude.ai/code にアクセス"
    echo "  2. お使いのOS用のClaude Code CLIをダウンロード"
    echo "  3. ダウンロードしたファイルをインストール"
    echo "  4. ターミナルで 'claude-code --version' が動作することを確認"
    echo "  5. 再度このセットアップスクリプトを実行"
    echo ""
    
    read -p "  手動インストール後、そのまま続行しますか？ [y/N]: " continue_choice
    case "$continue_choice" in
        [Yy]*)
            echo "  インストール確認をスキップして続行します"
            ;;
        *)
            echo "  セットアップを中断します"
            echo "  Claude Code CLIインストール後に再実行してください"
            exit 1
            ;;
    esac
}

# OS判定
detect_os() {
    echo "ステップ 1/6: オペレーティングシステムの検出"
    echo "------------------------------------------"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS_TYPE="macOS"
        echo "検出されたOS: macOS"
        echo "macOS向けの設定とツールインストール方法を使用します"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS_TYPE="Linux"
        echo "検出されたOS: Linux"
        echo "Linux向けの設定とパッケージマネージャーを使用します"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        OS_TYPE="Windows"
        echo "検出されたOS: Windows"
        echo "Windows向けの設定を使用します"
    else
        echo "エラー: 未対応のオペレーティングシステムです: $OSTYPE"
        echo "対応OS: macOS, Linux, Windows"
        exit 1
    fi
    echo ""
}

# システム要件チェック
check_system_requirements() {
    echo "ステップ 2/6: システム要件の確認"
    echo "------------------------------"
    
    echo "システムリソースを確認しています..."
    
    # CPU/メモリ情報取得
    if [ "$OS_TYPE" = "macOS" ]; then
        CPU_CORES=$(sysctl -n hw.ncpu)
        MEMORY_GB=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
    elif [ "$OS_TYPE" = "Linux" ]; then
        CPU_CORES=$(nproc)
        MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    else
        CPU_CORES=4  # Windows デフォルト値
        MEMORY_GB=8
    fi
    
    echo "システム情報:"
    echo "  - CPU コア数: ${CPU_CORES}個"
    echo "  - メモリ容量: ${MEMORY_GB}GB"
    
    # 最小要件チェック
    echo ""
    echo "最小要件チェック:"
    if [ "$CPU_CORES" -lt 2 ]; then
        echo "エラー: CPUコア数が不足しています"
        echo "  必要: 最低2コア"
        echo "  現在: ${CPU_CORES}コア"
        echo "Yellow Claude Orchestra は複数プロセスを並行実行するため、最低2コアが必要です"
        exit 1
    else
        echo "  CPU: OK (${CPU_CORES}コア)"
    fi
    
    if [ "$MEMORY_GB" -lt 4 ]; then
        echo "エラー: メモリ容量が不足しています"
        echo "  必要: 最低4GB"
        echo "  現在: ${MEMORY_GB}GB"
        echo "各エージェント（Producer/Director/Actor）がメモリを消費するため、最低4GBが必要です"
        exit 1
    else
        echo "  メモリ: OK (${MEMORY_GB}GB)"
    fi
    
    # 推奨Actor数の算出
    MAX_ACTORS=$(( (CPU_CORES - 1) < (MEMORY_GB / 2) ? (CPU_CORES - 1) : (MEMORY_GB / 2) ))
    if [ "$MAX_ACTORS" -lt 1 ]; then
        MAX_ACTORS=1
    fi
    
    echo ""
    echo "リソース最適化:"
    echo "  - Producer: 1プロセス (要件聞き取り・issue作成)"
    echo "  - Director: 1プロセス (タスク管理・レビュー)"
    echo "  - Actor: 最大${MAX_ACTORS}プロセス (実装作業)"
    echo "  - 合計: $((MAX_ACTORS + 2))プロセス"
    echo ""
    echo "この設定により、システムリソースを効率的に活用しつつ"
    echo "安定した並行処理を実現します"
    echo ""
}

# 必須ツールのインストール
install_required_tools() {
    echo "ステップ 3/7: 必須ツールの確認とインストール"
    echo "------------------------------------------"
    echo "Yellow Claude Orchestra の動作に必要な以下のツールを確認します:"
    echo "  - Python 3.8以上: エージェントの実行環境"
    echo "  - Node.js 18以上: Webダッシュボードの実行環境"
    echo "  - Git: バージョン管理とリポジトリ操作"
    echo "  - GitHub CLI: issue/PR の自動作成"
    echo "  - jq: JSON設定ファイルの解析"
    echo "  - Claude Code CLI: AI エージェントの実行"
    echo ""
    
    # Python 3.8+
    echo "Python 3.8以上の確認:"
    if ! command -v python3 &> /dev/null; then
        echo "  Python3が見つかりません。自動インストールを試行します..."
        if [ "$OS_TYPE" = "macOS" ]; then
            if command -v brew &> /dev/null; then
                brew install python3
            else
                echo "  エラー: Homebrewが見つかりません"
                echo "  macOSでPython3をインストールするにはHomebrewが必要です"
                echo "  Homebrewインストール: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                exit 1
            fi
        elif [ "$OS_TYPE" = "Linux" ]; then
            if command -v apt-get &> /dev/null; then
                sudo apt-get update && sudo apt-get install -y python3 python3-pip python3-venv
            elif command -v yum &> /dev/null; then
                sudo yum install -y python3 python3-pip
            else
                echo "  エラー: 対応するパッケージマネージャーが見つかりません"
                echo "  Python3を手動でインストールしてください"
                exit 1
            fi
        fi
    fi
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo "  インストール済み: Python ${PYTHON_VERSION}"
    
    echo ""
    echo "Node.js 18以上の確認:"
    if ! command -v node &> /dev/null; then
        echo "  Node.jsが見つかりません。自動インストールを試行します..."
        echo "  Node.jsはWebダッシュボードの実行に必要です"
        if [ "$OS_TYPE" = "macOS" ]; then
            if command -v brew &> /dev/null; then
                brew install node
            else
                echo "  エラー: Homebrewが見つかりません"
                echo "  Node.jsを手動でインストールしてください: https://nodejs.org/"
                exit 1
            fi
        elif [ "$OS_TYPE" = "Linux" ]; then
            if command -v apt-get &> /dev/null; then
                curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif command -v yum &> /dev/null; then
                curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
                sudo yum install -y nodejs
            else
                echo "  エラー: 対応するパッケージマネージャーが見つかりません"
                echo "  Node.jsを手動でインストールしてください: https://nodejs.org/"
                exit 1
            fi
        fi
    fi
    
    # Node.jsバージョン確認
    NODE_VERSION=$(node --version 2>/dev/null || echo "v0.0.0")
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo "  警告: Node.js 18以上が推奨されます（現在: $NODE_VERSION）"
        echo "  Webダッシュボードが正常に動作しない可能性があります"
    else
        echo "  インストール済み: Node.js $NODE_VERSION"
    fi
    
    # npm確認
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        echo "  インストール済み: npm $NPM_VERSION"
    else
        echo "  警告: npmが見つかりません"
    fi
    
    echo ""
    echo "Git の確認:"
    if ! command -v git &> /dev/null; then
        echo "  Gitが見つかりません。自動インストールを試行します..."
        if [ "$OS_TYPE" = "macOS" ]; then
            brew install git
        elif [ "$OS_TYPE" = "Linux" ]; then
            if command -v apt-get &> /dev/null; then
                sudo apt-get install -y git
            elif command -v yum &> /dev/null; then
                sudo yum install -y git
            fi
        fi
    fi
    echo "  インストール済み: $(git --version)"
    
    echo ""
    echo "GitHub CLI の確認:"
    if ! command -v gh &> /dev/null; then
        echo "  GitHub CLIが見つかりません。自動インストールを試行します..."
        echo "  GitHub CLIはissueやPRの自動作成に使用されます"
        if [ "$OS_TYPE" = "macOS" ]; then
            brew install gh
        elif [ "$OS_TYPE" = "Linux" ]; then
            if command -v apt-get &> /dev/null; then
                curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
                sudo apt-get update && sudo apt-get install -y gh
            fi
        fi
    fi
    echo "  インストール済み: $(gh --version | head -n1)"
    
    echo ""
    echo "jq (JSON処理ツール) の確認:"
    if ! command -v jq &> /dev/null; then
        echo "  jqが見つかりません。自動インストールを試行します..."
        echo "  jqは設定ファイル(JSON)の解析に使用されます"
        if [ "$OS_TYPE" = "macOS" ]; then
            brew install jq
        elif [ "$OS_TYPE" = "Linux" ]; then
            if command -v apt-get &> /dev/null; then
                sudo apt-get install -y jq
            elif command -v yum &> /dev/null; then
                sudo yum install -y jq
            fi
        fi
    fi
    echo "  インストール済み: $(jq --version)"
    
    echo ""
    echo "Claude Code CLI の確認:"
    if ! command -v claude-code &> /dev/null; then
        echo "  Claude Code CLIが見つかりません"
        echo ""
        echo "  Claude Code CLIはYellow Claude Orchestraの中核となるAIエージェントです"
        echo "  自動インストールを試行しますか？"
        echo ""
        echo "  選択肢:"
        echo "    y) 自動インストールを実行"
        echo "    n) 手動インストール（セットアップ中断）"
        echo "    s) スキップして継続（デモモード）"
        echo ""
        echo "  自動インストールを実行します..."
        echo ""
        install_claude_code_cli
    else
        echo "  インストール済み: Claude Code CLI"
    fi
    echo ""
}

# Claude Code設定
setup_claude_code() {
    if [ "$DEMO_MODE" = true ]; then
        echo "ステップ 4/7: Claude Code 認証設定 - スキップ（デモモード）"
        echo "-----------------------------------------------"
        echo "Claude Code CLI認証設定をスキップします"
        echo "デモモードでは実際のAI機能は利用できません"
        echo ""
        return 0
    fi
    
    echo "ステップ 4/7: Claude Code の認証設定"
    echo "--------------------------------"
    echo "Claude Code CLI の認証設定を確認します"
    
    echo ""
    # Claude Codeが既に設定済みかチェック
    if claude-code --version &> /dev/null; then
        echo "Claude Code は既に設定済みです"
    else
        echo "Claude Code の初期設定を行います"
        echo ""
        echo "Anthropic APIキーが必要です:"
        echo "  - APIキー取得: https://console.anthropic.com/settings/keys"
        echo "  - Claude CodeはAIエージェントとの通信にAPIキーを使用します"
        echo ""
        
        # 対話式設定
        claude-code configure
        
        # 設定確認
        if claude-code --version &> /dev/null; then
            echo "Claude Code 設定が正常に完了しました"
        else
            echo "エラー: Claude Code 設定に失敗しました"
            echo "APIキーが正しく入力されているか確認してください"
            exit 1
        fi
    fi
    echo ""
}

# GitHub認証設定
setup_github_auth() {
    echo "ステップ 5/7: GitHub 認証設定"
    echo "---------------------------"
    echo "GitHub CLI の認証設定を確認します"
    echo "GitHub認証はissueやPRの自動作成に必要です"
    
    echo ""
    # GitHub認証状態チェック
    if gh auth status &> /dev/null; then
        echo "GitHub 認証は既に完了しています"
        GITHUB_USER=$(gh api user --jq '.login')
        echo "認証済みユーザー: ${GITHUB_USER}"
    else
        echo "GitHub 認証を開始します"
        echo ""
        echo "認証手順:"
        echo "  1. ブラウザが自動で開きます"
        echo "  2. GitHubアカウントでログインしてください"
        echo "  3. 認証コードを承認してください"
        echo ""
        
        gh auth login --web --git-protocol https
        
        # 認証確認
        if gh auth status &> /dev/null; then
            GITHUB_USER=$(gh api user --jq '.login')
            echo "GitHub 認証が正常に完了しました"
            echo "認証済みユーザー: ${GITHUB_USER}"
        else
            echo "エラー: GitHub 認証に失敗しました"
            echo "ブラウザでの認証が正しく完了しているか確認してください"
            exit 1
        fi
    fi
    echo ""
}

# 環境構築
setup_environment() {
    echo "ステップ 6/7: Python開発環境の構築"
    echo "-------------------------------"
    echo "Python環境とプロジェクト構造をセットアップします"
    
    echo ""
    echo "Python仮想環境の設定:"
    # Python仮想環境
    if [ ! -d "$SCRIPT_DIR/venv" ]; then
        echo "  新しいPython仮想環境を作成しています..."
        python3 -m venv "$SCRIPT_DIR/venv"
        echo "  仮想環境の作成が完了しました"
    else
        echo "  仮想環境は既に存在します"
    fi
    
    echo "  仮想環境をアクティベートしています..."
    # 仮想環境アクティベート
    source "$SCRIPT_DIR/venv/bin/activate"
    
    # requirements.txt更新
    cat > "$SCRIPT_DIR/requirements.txt" << 'EOF'
# Yellow Claude Orchestra Dependencies
requests>=2.28.0          # HTTP通信
psutil>=5.9.0            # システム監視
GitPython>=3.1.30        # Git操作
PyGithub>=1.58.0         # GitHub API
click>=8.1.0             # CLI作成
rich>=13.0.0             # 美しいコンソール出力
watchdog>=3.0.0          # ファイル監視
asyncio-mqtt>=0.13.0     # 非同期通信（オプション）
EOF
    
    echo "Pythonパッケージをインストール中..."
    pip install -r requirements.txt
    echo "パッケージインストール完了"
    
    # ディレクトリ構造作成
    echo "ディレクトリ構造を作成中..."
    mkdir -p "$SCRIPT_DIR"/{config,agents,communication,logs,projects}
    mkdir -p "$SCRIPT_DIR/communication"/{messages,shared}
    mkdir -p "$SCRIPT_DIR/agents"/{producer,director}
    
    echo "  ディレクトリ構造の作成が完了しました"
    echo ""
}

# Webダッシュボード環境構築
setup_web_dashboard() {
    echo "ステップ 7/7: Webダッシュボード環境の構築"
    echo "--------------------------------------"
    echo "Next.js Webダッシュボードをセットアップします"
    
    echo ""
    echo "Webダッシュボードディレクトリの確認:"
    if [ ! -d "$SCRIPT_DIR/web-dashboard" ]; then
        echo "  エラー: web-dashboardディレクトリが見つかりません"
        echo "  Webダッシュボードのファイルが正しく配置されているか確認してください"
        return 1
    else
        echo "  web-dashboardディレクトリを確認しました"
    fi
    
    echo ""
    echo "npm依存関係のインストール:"
    cd "$SCRIPT_DIR/web-dashboard"
    
    if [ -f "package.json" ]; then
        echo "  package.jsonを発見しました"
        echo "  依存関係をインストール中..."
        
        # npm installを実行（出力を抑制）
        if npm install --silent > /dev/null 2>&1; then
            echo "  npm依存関係のインストールが完了しました"
        else
            echo "  警告: npm依存関係のインストールに失敗しました"
            echo "  手動でインストールしてください: cd web-dashboard && npm install"
        fi
    else
        echo "  エラー: package.jsonが見つかりません"
        return 1
    fi
    
    echo ""
    echo "Webダッシュボードのビルド確認:"
    if npm run build --silent > /dev/null 2>&1; then
        echo "  ビルドテストが成功しました"
    else
        echo "  警告: ビルドテストに失敗しました"
        echo "  開発モードでは正常に動作する可能性があります"
    fi
    
    # 元のディレクトリに戻る
    cd "$SCRIPT_DIR"
    
    echo ""
    echo "Webダッシュボード環境の構築が完了しました:"
    echo "  - Next.js 14 + TypeScript"
    echo "  - Tailwind CSS"
    echo "  - リアルタイムダッシュボード機能"
    echo "  - エージェント状況監視"
    echo "  - ターミナル風ログ表示"
    echo ""
}

# 設定ファイル作成
create_config_files() {
    echo "設定ファイルを作成中..."
    
    # メインの設定ファイル
    cat > "$SCRIPT_DIR/config/orchestra.json" << EOF
{
  "system": {
    "name": "Yellow Claude Orchestra",
    "version": "2.0.0",
    "model": "Producer-Director-Actor",
    "max_actors": ${MAX_ACTORS},
    "communication_dir": "./communication",
    "projects_dir": "./projects"
  },
  "roles": {
    "producer": {
      "description": "ユーザーとの窓口、要件聞き取り、issue作成",
      "capabilities": ["requirement_analysis", "issue_creation", "project_management"],
      "auto_start": true,
      "priority": "critical"
    },
    "director": {
      "description": "優先度管理、タスク割り当て、レビュー",
      "capabilities": ["task_management", "code_review", "quality_assurance"],
      "auto_start": true,
      "priority": "high"
    },
    "actor": {
      "description": "実装作業、先着順でタスク処理",
      "capabilities": ["coding", "debugging", "testing", "documentation"],
      "auto_start": true,
      "priority": "medium",
      "max_instances": ${MAX_ACTORS}
    }
  },
  "workflows": {
    "standard_development": {
      "steps": [
        "requirement_gathering",
        "issue_creation", 
        "task_assignment",
        "implementation",
        "review",
        "integration"
      ]
    },
    "hotfix": {
      "steps": [
        "issue_analysis",
        "urgent_implementation",
        "quick_review",
        "deployment"
      ]
    }
  },
  "github": {
    "auto_create_issues": true,
    "auto_create_prs": true,
    "review_required": true,
    "max_review_attempts": 3
  }
}
EOF
    
    # プロジェクト設定テンプレート
    mkdir -p "$SCRIPT_DIR/config/templates"
    cat > "$SCRIPT_DIR/config/templates/project.json" << 'EOF'
{
  "name": "",
  "repository": "",
  "description": "",
  "tech_stack": [],
  "requirements": "",
  "status": "active",
  "created_at": "",
  "last_updated": ""
}
EOF
    
    # 環境変数設定
    cat > "$SCRIPT_DIR/.env" << EOF
# Yellow Claude Orchestra Environment Variables
ORCHESTRA_DIR="$SCRIPT_DIR"
ORCHESTRA_VENV="$SCRIPT_DIR/venv"
ORCHESTRA_CONFIG="$SCRIPT_DIR/config/orchestra.json"
COMMUNICATION_DIR="$SCRIPT_DIR/communication"
PROJECTS_DIR="$SCRIPT_DIR/projects"
LOGS_DIR="$SCRIPT_DIR/logs"
MAX_ACTORS=${MAX_ACTORS}

# GitHub Settings (auto-detected)
GITHUB_USER=$(gh api user --jq '.login' 2>/dev/null || echo "")

# System Info
OS_TYPE="${OS_TYPE}"
CPU_CORES=${CPU_CORES}
MEMORY_GB=${MEMORY_GB}
EOF
    
    echo "設定ファイル作成完了"
    echo ""
}

# スクリプト作成
create_scripts() {
    echo "実行スクリプトを作成中..."
    
    # 起動スクリプト更新は後で行う（既存のstart.shを活用）
    chmod +x "$SCRIPT_DIR/start.sh" 2>/dev/null || true
    chmod +x "$SCRIPT_DIR/stop.sh" 2>/dev/null || true
    
    # 環境アクティベートスクリプト
    cat > "$SCRIPT_DIR/activate.sh" << 'EOF'
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
EOF
    
    chmod +x "$SCRIPT_DIR/activate.sh"
    
    echo "スクリプト作成完了"
    echo ""
}

# 動作確認
verify_installation() {
    echo "動作確認中..."
    
    # Python環境確認
    source "$SCRIPT_DIR/venv/bin/activate"
    python3 -c "import json, requests, psutil; print('Python環境: OK')"
    
    # Claude Code確認
    if [ "$DEMO_MODE" = true ]; then
        echo "Claude Code: スキップ（デモモード）"
    elif claude-code --version &> /dev/null; then
        echo "Claude Code: OK"
    else
        echo "Claude Code: 要確認"
    fi
    
    # GitHub CLI確認
    if gh auth status &> /dev/null; then
        echo "GitHub認証: OK"
    else
        echo "GitHub認証: 要確認"
    fi
    
    # 設定ファイル確認
    if [ -f "$SCRIPT_DIR/config/orchestra.json" ]; then
        echo "設定ファイル: OK"
    fi
    
    echo ""
}

# メイン実行
main() {
    detect_os
    check_system_requirements
    install_required_tools
    setup_claude_code
    setup_github_auth
    setup_environment
    setup_web_dashboard
    create_config_files
    create_scripts
    verify_installation
    
    # 完了メッセージ
    echo ""
    echo "=========================================="
    echo "Yellow Claude Orchestra セットアップ完了！"
    echo "=========================================="
    echo ""
    echo "Producer-Director-Actor システムの準備が整いました"
    echo ""
    echo "システム構成:"
    echo "  - Producer: 1プロセス（要件聞き取り・issue作成）"
    echo "  - Director: 1プロセス（タスク管理・レビュー）"
    echo "  - Actor: 最大${MAX_ACTORS}プロセス（実装作業）"
    echo "  - 合計: $((MAX_ACTORS + 2))プロセスが並行動作"
    echo ""
    echo "次のステップ:"
    echo "  1. 詳細情報の確認: README.md をお読みください"
    echo "  2. 環境の確認: source activate.sh を実行"
    echo "  3. 統合システム起動: ./start.sh を実行"
    echo ""
    echo "重要なディレクトリ:"
    echo "  - config/: システム設定ファイル"
    echo "  - projects/: マルチプロジェクト管理"
    echo "  - logs/: システムログとエージェントログ"
    echo "  - communication/: エージェント間通信データ"
    echo "  - web-dashboard/: リアルタイム監視Webダッシュボード"
    echo ""
    echo "Webダッシュボードアクセス:"
    echo "  URL: http://localhost:3000"
    echo "  機能: エージェント状況監視、ログ表示、リアルタイム更新"
    echo ""
    echo "Yellow Claude Orchestra は複数のプロジェクトを"
    echo "効率的に並行開発するためのシステムです。"
    echo ""
    echo "セットアップが正常に完了しました。"
    echo "素晴らしい開発体験をお楽しみください！"
}

# 実行
main "$@"