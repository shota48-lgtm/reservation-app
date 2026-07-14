# Vercelへのデプロイ手順

## 前提
- GitHubリポジトリ: `shota48-lgtm/reservation-app`
- ビルドツール: Vite（`npm run build` → `dist/`）
- `vercel.json`でSPAのリライト設定・ビルドコマンドを指定済み

## 手順

### 1. Vercelプロジェクトを作成
1. https://vercel.com にPOのGitHubアカウントでログイン
2. 「Add New... > Project」から `shota48-lgtm/reservation-app` を選択してImport
3. Framework Presetは自動的に「Vite」が検出される想定（`vercel.json`があるので手動設定は基本不要）

### 2. 環境変数を設定
Vercelのプロジェクト設定 > Environment Variables で以下を追加する（値は `.env` ファイル参照。Production/Preview/Development すべてにチェック推奨）:

| 変数名 | 値の取得元 |
|---|---|
| `VITE_SUPABASE_URL` | ローカルの`.env`の`VITE_SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | ローカルの`.env`の`VITE_SUPABASE_ANON_KEY` |

> 注意: `VITE_`プレフィックスの環境変数はビルド時にクライアント側バンドルへ埋め込まれる（Viteの仕様）。これは想定通りの挙動で、anonキーは元々公開される設計のキーのため問題ない。

### 3. デプロイ
環境変数設定後、「Deploy」を実行。以降はGitHubの`main`ブランチへのpush（マージ）で自動的に再デプロイされる。

### 4. 動作確認チェックリスト
- [ ] `/` （ログイン画面）が表示される
- [ ] オーナーアカウントでログインし、ダッシュボードが表示される
- [ ] `/book/:shopId`（実在の店舗IDで）をブラウザで直接開いて（リロードも）404にならないことを確認 — `vercel.json`のrewrites設定の検証
- [ ] 公開予約ページから実際にテスト予約を送信できる（`customers`テーブルのRLS修正が本番でも反映されているか確認）

## 既知の制約
- カスタムドメインは未設定（Vercelが発行するデフォルトの `*.vercel.app` URLで運用開始する想定）
- プレビューデプロイ（PRごとのブランチデプロイ）もVercelの標準機能で自動的に有効になる。Supabase側は本番と同一プロジェクトを共有するため、プレビュー環境からのテスト操作が本番データに影響する点に注意
