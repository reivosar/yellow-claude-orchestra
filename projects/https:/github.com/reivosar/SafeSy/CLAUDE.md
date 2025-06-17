# SafeSy

## プロジェクト概要
プロジェクトの説明がありません

## 開発環境
- **リポジトリ**: https://github.com/reivosar/SafeSy
- **作成日**: 2025/6/17
- **ステータス**: アクティブ

## Claude Code CLI 設定

### よく使うコマンド
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト実行
npm test

# リント実行
npm run lint
```

### プロジェクト固有の設定

#### テストフレームワーク
- **使用中**: Jest + Testing Library
- **テストコマンド**: `npm test`
- **カバレッジ**: `npm run test:coverage`

#### コーディング規約
- **ESLint設定**: `.eslintrc.js`
- **Prettier設定**: `.prettierrc`
- **TypeScript設定**: `tsconfig.json`

#### デプロイ設定
- **環境**: Vercel / Netlify
- **ビルドコマンド**: `npm run build`
- **出力ディレクトリ**: `dist` または `build`

## タスク履歴
<!-- Yellow Claude Orchestra のタスク履歴がここに記録されます -->

## 開発メモ
<!-- プロジェクト固有の開発メモやTODOをここに記載 -->

## 依存関係の管理
```bash
# パッケージインストール
npm install

# パッケージ追加
npm install <package-name>

# 開発依存関係追加  
npm install -D <package-name>
```

## トラブルシューティング

### よくある問題と解決方法
1. **ポートが使用中**: `lsof -ti:3000 | xargs kill -9`
2. **node_modules リセット**: `rm -rf node_modules && npm install`
3. **TypeScript エラー**: `npx tsc --noEmit` で型チェック

### Yellow Claude Orchestra 特有の設定
- **Producer エージェント**: 要件聞き取り担当
- **Director エージェント**: タスク優先度判定担当  
- **Actor エージェント**: 実装作業担当

## プロジェクト構造
```
SafeSy/
├── src/           # ソースコード
├── tests/         # テストファイル
├── docs/          # ドキュメント
├── public/        # 静的ファイル
├── package.json   # パッケージ設定
├── tsconfig.json  # TypeScript設定
├── .eslintrc.js   # ESLint設定
├── .prettierrc    # Prettier設定
└── CLAUDE.md      # このファイル
```

---
**📝 メモ**: このファイルはプロジェクト固有の設定情報を管理します。タスク実行時にActor エージェントがこの情報を参照して作業を行います。