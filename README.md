# 🎼 Yellow Claude Orchestra

複数のClaude Codeエージェントを協調動作させるオーケストレーションシステム

## 概要

Yellow Claude Orchestraは、複数のClaude Codeインスタンスを統合し、それぞれが異なる役割を持ちながら協調して作業を行うシステムです。指揮者（Conductor）エージェントが全体を調整し、開発者、レビュアー、テスターなどの専門エージェントが連携して効率的な開発ワークフローを実現します。

## 特徴

- **🎯 役割ベースの分散処理**: 各エージェントが専門性を持ち、適切なタスクを担当
- **🔄 リアルタイム通信**: エージェント間でメッセージとデータを共有
- **⚡ 権限問題解決**: 起動時の権限問題を自動解決
- **📊 ワークフロー管理**: 定義済みワークフローによる効率的なタスク実行
- **🛡️ 安全な停止**: 全エージェントの安全な停止とクリーンアップ

## クイックスタート

### 1. セットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd yellow-claude-orchestra

# 依存関係のインストールと初期設定
./setup.sh
```

### 2. 起動

```bash
# 環境をアクティベート
source activate.sh

# エージェントを起動
./start.sh
```

### 3. 停止

```bash
# 全エージェントを停止
./stop.sh
```

## ディレクトリ構造

```
yellow-claude-orchestra/
├── setup.sh              # ワンコマンドセットアップ
├── start.sh              # エージェント起動（権限問題解決済み）
├── stop.sh               # 全エージェント停止
├── activate.sh           # 環境アクティベート
├── config/
│   └── agents.json       # エージェント設定
├── agents/               # 各エージェントの設定とログ
│   ├── conductor/
│   ├── developer/
│   ├── reviewer/
│   ├── tester/
│   └── analyst/
├── communication/        # メッセージング
│   ├── message_hub.py    # 通信ハブ
│   ├── agent_client.py   # エージェントクライアント
│   ├── messages/         # メッセージキュー
│   └── shared/           # 共有データ
├── logs/                 # ログファイル
├── venv/                 # Python仮想環境
├── requirements.txt      # 依存関係
├── .env                  # 環境変数
└── README.md            # このファイル
```

## エージェントの役割

### 🎼 Conductor（指揮者）
- **役割**: 全体調整とタスク管理
- **機能**: オーケストレーション、計画、監視
- **自動起動**: Yes
- **優先度**: High

### 👨‍💻 Developer（開発者）
- **役割**: コード作成と実装
- **機能**: コーディング、デバッグ、テスト実装
- **自動起動**: Yes
- **優先度**: High

### 🔍 Reviewer（レビュアー）
- **役割**: コード品質管理
- **機能**: コードレビュー、品質保証、ドキュメント作成
- **自動起動**: No（必要に応じて起動）
- **優先度**: Medium

### 🧪 Tester（テスター）
- **役割**: テスト専門
- **機能**: テスト作成、実行、自動化
- **自動起動**: No
- **優先度**: Medium

### 📊 Analyst（分析者）
- **役割**: データ分析とレポート
- **機能**: データ分析、メトリクス収集、レポート作成
- **自動起動**: No
- **優先度**: Low

## 使用方法

### 基本的な使用

1. **システムの起動**
   ```bash
   ./start.sh
   ```

2. **ログの確認**
   ```bash
   tail -f logs/*.log
   ```

3. **エージェントの状態確認**
   ```bash
   cat config/agents.json
   ```

4. **システムの停止**
   ```bash
   ./stop.sh
   ```

### 設定のカスタマイズ

`config/agents.json`を編集してエージェントの設定を変更できます：

- エージェントの有効/無効
- 自動起動設定
- メモリ制限
- タイムアウト設定
- 通信設定

### ワークフローの実行

システムには以下の定義済みワークフローがあります：

- **standard_development**: 標準的な開発フロー
- **hotfix_workflow**: 緊急修正フロー

## 通信システム

### メッセージングハブ
- エージェント間の通信を管理
- メッセージキューイング
- データ共有機能
- 自動クリーンアップ

### 通信の種類
- **Direct Messages**: 特定のエージェント間
- **Broadcast**: 全エージェントに送信
- **Shared Data**: 永続データの共有
- **Request-Response**: 同期的な通信

## トラブルシューティング

### よくある問題

**1. エージェントが起動しない**
```bash
# 権限を確認
ls -la *.sh

# 実行権限を付与
chmod +x *.sh
```

**2. jqが見つからない**
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

**3. Python環境の問題**
```bash
# 仮想環境を再作成
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**4. プロセスが残る**
```bash
# 手動でプロセスを確認
ps aux | grep claude-code

# 強制終了
./stop.sh
```

### ログの確認

```bash
# システムログ
tail -f communication/messages/system.log

# エージェント別ログ
tail -f logs/conductor.log
tail -f logs/developer.log
```

## 開発者向け情報

### 通信APIの使用

```python
from communication.agent_client import AgentClient

# エージェントクライアントの作成
client = AgentClient(
    agent_id="my_agent",
    agent_type="custom",
    communication_dir="./communication"
)

# メッセージの送信
client.send_message("developer", "code_request", {
    "task": "Create a function",
    "requirements": ["type hints", "docstring"]
})

# データの共有
client.share_data("project_config", {
    "language": "python",
    "framework": "fastapi"
})
```

### カスタムエージェントの追加

1. `config/agents.json`に新しいエージェントを定義
2. エージェント用のディレクトリを作成
3. 必要に応じて起動ロジックを追加

## 設定ファイル

### agents.json
- システム設定
- エージェント定義
- ワークフロー設定
- 通信ルール

### 環境変数（.env）
- ディレクトリパス
- Claude Code設定
- ログレベル

## セキュリティ

- **プロセス分離**: 各エージェントは独立プロセス
- **権限管理**: 最小権限の原則
- **データ分離**: エージェント別の作業ディレクトリ
- **安全な停止**: グレースフル終了の実装

## ライセンス

[ライセンス情報を追加]

## 貢献

プルリクエストやイシューの報告を歓迎します。

## サポート

問題が発生した場合は、以下の情報と共にイシューを作成してください：
- OS情報
- Python版
- エラーログ
- 設定ファイル

---

🎼 **Happy Orchestrating with Yellow Claude Orchestra!**