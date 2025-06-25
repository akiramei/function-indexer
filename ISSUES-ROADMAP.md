# Function Indexer - Issues Roadmap

## 統合改善プラン：機能改善 + AI向け最適化

Function Indexerの本来の目的である「関数の発見とアクセス」を最優先に、メトリクス機能の整理とAI向け最適化を同時に進める包括的な改善計画です。

---

## 🎯 Priority 1: コア機能改善 (Critical)

### Issue #1: 関数一覧表示機能の追加

**Title**: Add `list` command for comprehensive function enumeration  
**Labels**: `enhancement`, `core-feature`, `ai-optimization`  
**Priority**: High  
**Scope**: Code + Documentation

#### 背景
現在の`search`コマンドはデフォルト10件制限があり、プロジェクト内の全関数を簡単に確認できません。AIがプロジェクトの全体像を把握するためには、制限なしで全関数を一覧表示できる機能が必要です。

#### 実装内容
- [ ] `list` コマンドの追加
- [ ] オプション設計
  - `--format simple` : AI向け簡潔出力 (`file:line:functionName`)
  - `--file <pattern>` : ファイルフィルタ
  - `--exported` : エクスポートされた関数のみ
  - `--async` : 非同期関数のみ
- [ ] デフォルトで全関数を表示（制限なし）
- [ ] AIが読みやすい出力フォーマット

#### 期待される効果
- AIがプロジェクト内の全関数を即座に把握可能
- 関数の発見速度向上
- より効率的なコーディング支援

---

### Issue #2: searchコマンドの改善

**Title**: Improve search command for better function discovery  
**Labels**: `enhancement`, `search`, `ai-optimization`  
**Priority**: High  
**Scope**: Code + Documentation

#### 背景
現在の`search`コマンドは10件制限により、多くの関数が隠れてしまいます。また、空クエリでの全件表示ができません。

#### 実装内容
- [ ] デフォルト制限の撤廃または大幅緩和（10 → 100+）
- [ ] `--all` オプションで制限なし表示
- [ ] 空クエリ `""` での全件表示対応
- [ ] パフォーマンス最適化（大量結果の効率的表示）
- [ ] 検索スコアリングの改善

#### 期待される効果
- 関数の見つけやすさ向上
- AIの検索効率向上
- ユーザビリティ改善

---

### Issue #3: インデックスファイル配置の改善

**Title**: Move index file to project root for better visibility  
**Labels**: `enhancement`, `configuration`, `ai-optimization`  
**Priority**: High  
**Scope**: Code + Configuration

#### 背景
現在のインデックスファイル（`.function-indexer/index.jsonl`）は隠れており、AIや開発者がアクセスしにくい状況です。

#### 実装内容
- [ ] デフォルト出力先を`function-index.jsonl`に変更
- [ ] プロジェクトルートへの配置
- [ ] 既存設定の移行対応
- [ ] `.gitignore`テンプレートの提供

#### 期待される効果
- ファイルの可視性向上
- AIによる直接アクセス改善
- 他ツールとの連携強化

---

## 📊 Priority 2: メトリクス機能整理 (Important)

### Issue #4: メトリクスコマンドの再構成

**Title**: Reorganize metrics commands with clear subcommand structure  
**Labels**: `enhancement`, `metrics`, `refactoring`  
**Priority**: Medium  
**Scope**: Code + Documentation

#### 背景
現在のメトリクス関連コマンドが分散しており、関数インデックス機能と混在しています。明確な分離が必要です。

#### 実装内容
- [ ] メトリクスサブコマンド化
  - `function-indexer metrics collect`
  - `function-indexer metrics show`
  - `function-indexer metrics trends`
  - `function-indexer metrics pr <number>`
- [ ] 既存コマンドのエイリアス保持（互換性）
- [ ] ヘルプメッセージの整理

#### 期待される効果
- 機能の明確な分離
- コマンド体系の理解しやすさ向上
- メンテナンス性向上

---

### Issue #5: メトリクスとインデックスの明確な分離

**Title**: Separate metrics and indexing configurations  
**Labels**: `architecture`, `configuration`, `metrics`  
**Priority**: Medium  
**Scope**: Architecture + Documentation

#### 実装内容
- [ ] 設定ファイルの分離
  - `.function-indexer/config.json` : インデックス設定
  - `.function-metrics/config.json` : メトリクス設定
- [ ] ディレクトリ構造の整理
- [ ] AI向け使い分けガイドの作成

---

## 🤖 Priority 3: AI最適化 (Critical)

### Issue #6: 統合AI向けマスターガイド

**Title**: Create comprehensive AI Assistant Master Guide  
**Labels**: `documentation`, `ai-optimization`, `enhancement`  
**Priority**: High  
**Scope**: Documentation + Examples

#### 背景
AIがFunction Indexerをゼロショットで理解し、即座に実用レベルで使いこなせるドキュメントが必要です。

#### 実装内容
- [ ] `docs/AI-ASSISTANT-MASTER-GUIDE.md`の作成
- [ ] 機能の優先度明示（関数発見 > メトリクス）
- [ ] よくあるタスクのテンプレート化
- [ ] GitHub Raw直接アクセス用URL最適化
- [ ] ゼロショット対応の詳細説明

#### 期待される効果
- AIの導入時間短縮
- 使いこなしレベルの向上
- 一貫した利用パターンの確立

---

### Issue #7: コマンドリファレンス最適化

**Title**: Optimize command reference for AI consumption  
**Labels**: `documentation`, `command-reference`, `ai-optimization`  
**Priority**: High  
**Scope**: Documentation + API Spec

#### 実装内容
- [ ] `docs/COMMAND-REFERENCE.md`の作成
- [ ] 機能別分類（コア/メトリクス/支援/管理）
- [ ] 使用頻度ベースの優先度表示
- [ ] JSON出力フォーマットの完全仕様
- [ ] AI向けの簡潔な説明

---

## 🔧 Priority 4: UX改善 (Nice to have)

### Issue #8: コマンド体系の簡素化

**Title**: Simplify command structure for better usability  
**Labels**: `enhancement`, `ux`, `commands`  
**Priority**: Medium  
**Scope**: Code + Documentation

#### 実装内容
- [ ] 頻用コマンドの簡潔化
- [ ] ヘルプメッセージの改善
- [ ] エラーメッセージの改善
- [ ] プログレス表示の最適化

---

### Issue #9: ユースケース別テンプレート

**Title**: Add AI task templates for common use cases  
**Labels**: `documentation`, `templates`, `ai-optimization`  
**Priority**: Low  
**Scope**: Documentation + Examples

#### 実装内容
- [ ] `docs/templates/`ディレクトリ作成
- [ ] タスク別テンプレート
  - `function-search.md`
  - `code-quality-check.md`
  - `pr-review-automation.md`
  - `codebase-understanding.md`
- [ ] 実行可能コマンド例付き

---

## 実装戦略

### Phase 1: 基盤強化（Issues #1-3）
関数発見とアクセスの基本機能を強化

### Phase 2: 機能整理（Issues #4-5）
メトリクス機能の明確な分離と整理

### Phase 3: AI最適化（Issues #6-7）
包括的なAI向けドキュメント整備

### Phase 4: 仕上げ（Issues #8-9）
UX向上とテンプレート提供

各フェーズで**コード改善とドキュメント更新を同時実装**し、段階的に理想的なFunction Indexerを構築します。