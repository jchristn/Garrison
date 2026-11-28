// Japanese catalog for the Garrison dashboard. Mirrors every key in en.js.

import { tips, explainers } from './ja.tips.js';

const rp = (title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody) => ({ title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody });

const ja = {
  processSecurity: { trustedOnly: "Process 実行方式は信頼できる処理専用です。実行はワーカーのユーザー、ファイルシステム、ネットワークを共有し、他の実行やワーカーの認証情報にアクセスできます。信頼できない入力には KubernetesJob を使用してください。" },
  common: {
    eventCodes: { ApprovalRequested: '承認を要求', ApprovalDecided: '承認を決定', StructuredOutputInvalid: '構造化出力が無効', RunBlocked: '実行がブロック中', EventsDropped: 'イベントの破棄', HarnessExited: 'ハーネス終了', McpPreflightWarning: 'MCP 事前チェックの警告', McpPreflightPassed: 'MCP 事前チェック合格', RepairAttemptStarted: '出力の修復を開始', WorkspacePrepared: 'ワークスペース準備完了', RunGuardTriggered: 'ランガードが実行を停止', ConversationFallback: '会話のフォールバック', ConversationResumed: '会話を再開', ConversationStateLost: '会話の状態が失われました' },
    fieldCodes: { ExpiryInPast: '未来の日時を選んでください。', ParameterInvalid: 'この値はこのパラメーターには無効です。', ParameterNotAllowed: 'このデプロイメントでは、呼び出し元がこのパラメーターを上書きすることは許可されていません。', SettingsFileReadOnly: '設定ファイルが読み取り専用のため、この変更は保存できません。', OverriddenByEnvironment: '環境変数がこの値を設定しているため、ここでは変更できません。', PathRequired: '設定パスが必要です。', UnknownSetting: 'このサーバーにはこの設定がありません。', TooLong: '値が長すぎます。', NotAllowedValue: '許可された値のいずれかを選んでください。', NotABoolean: 'true または false を選んでください。', NotAnInteger: '整数を入力してください。', OutOfRange: '値が許可された範囲外です。' },
    serverText: {
      approvalWaitingExpires: '{{subject}} の承認を人が行うのを待っています。承認 {{id}} は {{expires}} に期限切れになります。',
      approvalWaiting: '{{subject}} の承認を人が行うのを待っています。承認 {{id}}。',
      notApplied: '別のドキュメントが検証に失敗したため、適用されませんでした。',
      wouldBeUnchanged: 'すでに最新の状態です。変更はありません。',
      wouldBeUpdated: '更新されます。',
      wouldBeCreated: '作成されます。',
      inUse: '{{what}} はまだ次のデプロイメントに結び付けられています: {{deployments}}。先に結び付けを外してください。',
      noActiveDeployment: 'エージェント {{agent}} には、重みが 0 より大きい有効なデプロイメントがありません。デプロイメントを追加するか重みを上げてから、もう一度試してください。',
      toolCallDenied: 'ツール呼び出しが拒否されました: {{id}}',
      threadStarted: 'スレッドを開始しました。',
      runStartedModel: '実行を開始しました ({{model}})。',
      runStarted: '実行を開始しました。',
      sessionInitializedModel: 'セッションを初期化しました ({{model}})。',
      sessionInitialized: 'セッションを初期化しました。',
      harnessFailed: 'ハーネスが失敗を報告しました。',
      exitedNoResult: 'ハーネスが最終結果なしで終了コード {{code}} で終了しました。',
      harnessExited: 'ハーネスが終了しました: {{status}} ({{outcome}})。',
      harnessExitedCode: 'ハーネスが終了コード {{code}} で終了しました: {{status}} ({{outcome}})。',
      mcpPreflight: 'MCP の事前チェックに合格しました。確認したサーバー: {{count}}。',
      repairAttempt: '構造化出力の修復試行 {{attempt}}: {{path}} でハーネスのセッションを再開します。',
      workspacePrepared: 'ワークスペースを {{path}} に準備しました。',
      guardRepetitionUnit: '繰り返しガード: アシスタントテキストの直近 {{window}} 文字が、{{size}} 文字の単位「{{unit}}」の {{count}} 回の繰り返しです。',
      guardDegenerate: '繰り返しガード: アシスタントテキストの直近 {{window}} 文字に文字や数字がなく (空白、句読点、記号のみ)、「{{tail}}」で終わっています。',
      guardNoProgress: '実行が {{seconds}} 秒間進行しませんでした (アシスタントテキスト、思考、ツール呼び出し、ツール結果がなく、開いているツール呼び出しもありません)。noProgressSeconds の上限は {{limit}} です。',
      guardOutputLimit: 'アシスタントテキストが実行の maxAssistantChars の上限 {{limit}} 文字を超えました。',
      valueClamped: '{{field}} の値 {{given}} は許容範囲 {{minimum}} から {{maximum}} の外にあるため、{{stored}} を保存しました。'
    },
    appName: 'Garrison',
    language: { label: '言語' },
    theme: { switchToLight: 'ライトテーマに切り替え', switchToDark: 'ダークテーマに切り替え' },
    actions: {
      apply: '適用',
      back: '戻る',
      cancel: 'キャンセル',
      clear: 'クリア',
      clone: '複製して作成',
      close: '閉じる',
      confirm: '確認',
      copied: 'コピーしました',
      copy: 'コピー',
      delete: '削除',
      duplicate: '複製',
      edit: '編集',
      hide: '値を隠す',
      logout: 'ログアウト',
      next: '次へ',
      openGithub: 'GitHub で Garrison リポジトリを開く',
      remove: '削除',
      retry: '再試行',
      reveal: '値を表示',
      save: '保存',
      view: '表示',
      viewDetails: '詳細を表示',
      viewJson: 'JSON を表示'
    },
    boolean: { yes: 'はい', no: 'いいえ' },
    confirm: {
      deleteNamed: '「{{name}}」を削除しますか? この操作は元に戻せません。',
      bulkDelete: '選択した {{count}} 件を削除しますか? この操作は元に戻せません。'
    },
    errors: {
      listItem: '項目 {{index}}: {{message}}',
      chooseOne: '少なくとも 1 つ選択してください。',
      fixFields: '確認が必要な項目があります。強調表示された値を確認してください。',
      invalidEmail: '有効なメールアドレスを入力してください。',
      invalidJson: '有効な JSON ではありません。',
      loadFailed: 'データを読み込めませんでした。',
      requestId: 'リクエスト {{id}}。',
      required: 'この項目は必須です。',
      requiredPermission: '{{resource}} に対する {{permission}} 権限が必要です。'
    },
    generic: {
      deletedName: '{{name}} (削除済み)',
      actions: '操作',
      active: '有効',
      all: 'すべて',
      any: '任意',
      builtIn: '組み込み',
      custom: 'カスタム',
      inactive: '無効',
      loading: '読み込み中...',
      never: 'なし',
      none: 'なし',
      notAvailable: '該当なし',
      saving: '保存中...'
    },
    relativeTime: { now: 'たった今' },
    states: {
      forbiddenTitle: 'このページへのアクセス権がありません',
      forbiddenBody: '管理者にアクセス権を付与するロールを依頼するか、別のページを選択してください。',
      unavailableTitle: 'このサーバーではまだ利用できません',
      unavailableBody: 'サーバーが {{resource}} のエンドポイントを公開していません。サーバーを更新するか、API エクスプローラーで対応状況を確認してください。'
    },
    toasts: {
      bulkDeleted: '{{count}} 件を削除しました ({{failed}} 件失敗)。',
      cloned: '複製しました。',
      created: '作成しました。',
      deleted: '削除しました。',
      saved: '保存しました。'
    },
    units: { msShort: 'ミリ秒', sShort: '秒', mShort: '分', tokPerSec: 'トークン/秒' }
  },
  errorCodes: {
    ApprovalNotPending: 'この承認はすでに決定済みのため、再度決定することはできません。',
    MessageIdConflict: 'この A2A メッセージ ID は別の内容ですでに使われています。新しい ID でメッセージを送ってください。',
    IdempotencyKeyConflict: 'この冪等性キーは別のリクエストですでに使われています。新しいキーを使ってください。',
    DeploymentDeleted: 'この実行のデプロイメントは削除されたため、実行を再試行できません。代わりにエージェントをもう一度呼び出してください。',
    AgentDeleted: 'この実行のエージェントは削除されたため、実行を再試行できません。',
    NoActiveDeployment: 'このエージェントには、重みが 0 より大きい有効なデプロイメントがありません。デプロイメントを追加するか、重みを上げてください。',
    TenantNotFound: 'そのテナントは存在しません。テナント ID を確認してください。',
    NetworkError: 'サーバーに接続できません。サーバー URL とサーバーの稼働状況を確認してください。',
    AuthenticationRequired: 'セッションの有効期限が切れました。再度サインインしてください。',
    InvalidCredentials: 'テナント、メール、パスワード、またはキーが正しくありません。',
    RateLimited: 'サインインの試行回数が多すぎます。1 分待ってから再試行してください。',
    AuthorizationDenied: 'この操作を行う権限がありません。',
    NotFound: 'レコードが見つかりません。',
    RouteNotFound: 'このサーバーはそのエンドポイントに対応していません。',
    ValidationFailed: '一部の値が無効です。',
    InvalidBody: 'リクエスト本文が無効です。',
    InvalidJson: 'リクエスト本文が有効な JSON ではありません。',
    Conflict: '既存のレコードと競合しています。',
    BuiltInImmutable: '組み込みのレコードは変更できません。カスタマイズするには複製してください。',
    Protected: 'このレコードは保護されているため削除できません。',
    StaleLease: 'このノードは実行のリースを保持していません。',
    InternalError: 'サーバー内部エラーが発生しました。リクエスト ID でサーバーログを確認してください。',
    Http400: 'リクエストは無効として拒否されました。',
    Http403: 'この操作を行う権限がありません。',
    Http404: '見つかりません。',
    Http409: '現在の状態と競合しています。',
    Http500: 'サーバー内部エラーが発生しました。',
    Http503: 'サーバーを利用できません。',
    ConversationBusy: 'この会話は前のターンをまだ処理しています。その実行が終わるのを待つか取り消してから、もう一度お試しください。',
    ConversationAgentMismatch: 'この会話は別のエージェントのものです。そのエージェントにターンを送るか、新しい会話を始めてください。',
    ConversationDeploymentMismatch: '会話のすべてのターンは最初のターンのデプロイメントで実行されます。デプロイメントを空にするか、新しい会話を始めてください。',
    ConversationDeploymentUnavailable: 'この会話のデプロイメントが削除されたため、会話を続けられません。新しい会話を始めてください。'
  },
  enums: {
    approvalStatus: {
      Pending: '保留中',
      Approved: '許可済み',
      Denied: '拒否済み',
      Expired: '期限切れ',
      Cancelled: 'キャンセル済み'
    },
    approvalDecision: {
      Allow: '許可',
      Deny: '拒否'
    },
    approvalSource: {
      DurableResume: "引き継いだ承認",
      Rule: 'ルール',
      Default: 'デプロイメントの既定値',
      User: '人',
      Timeout: 'タイムアウト',
      Cancelled: '実行の停止'
    },
    approvalRuleAction: {
      Allow: '許可',
      Deny: '拒否',
      Ask: '人に確認'
    },
    approvalKind: {
      Tool: 'ツール呼び出し',
      Command: 'コマンド',
      FileChange: 'ファイル変更'
    },
    principalType: { Administrator: 'システム管理者', User: 'ユーザー', Credential: 'アクセスキー', Run: '実行トークン' },
    runBlockedReason: { NoReadyWorker: '準備完了のワーカーなし', NoCapableWorker: '対応できるワーカーなし', NoMatchingPool: '一致するプールなし' },
    promptDelivery: { Stdin: '標準入力', Argument: 'コマンドライン引数', File: 'ファイル', CodexAppServer: 'Codex アプリサーバー (JSON-RPC)' },
    systemPromptDelivery: { File: 'ファイル', Argument: 'コマンドライン引数', Environment: '環境変数', PrependToPrompt: 'プロンプトの先頭に追加', None: '渡さない' },
    mcpConfigFormat: { None: 'MCP 設定なし', ClaudeJson: 'Claude Code JSON', CodexToml: 'Codex TOML', MuxJson: 'Mux JSON', GeminiSettings: 'Gemini CLI 設定' },
    outputParser: {
      ClaudeStreamJson: 'Claude Code ストリーム JSON',
      CodexJsonl: 'Codex JSONL',
      CodexAppServer: 'Codex アプリサーバー JSON-RPC',
      MuxJsonl: 'Mux JSONL',
      GeminiStreamJson: 'Gemini CLI ストリーム JSON',
      GenericJsonl: '汎用 JSONL',
      PlainText: 'プレーンテキスト'
    },
    resultSource: { ParserFinalEvent: 'パーサーの最終イベント', LastMessageFile: '最終メッセージファイル', Stdout: 'Stdout' },
    successPolicy: { FinalEvent: '最終イベント', ExitCode: '終了コード', FinalEventAndExitCode: '最終イベントと終了コード' },
    fileBaseDirectory: { Config: '設定ディレクトリ', Workspace: 'ワークスペース', Home: 'ホームディレクトリ' },
    artifactStoreKind: { Database: 'データベース', Filesystem: 'ファイルシステム', S3: 'S3' },
    agentInputMode: { Text: 'テキスト', Structured: '構造化 JSON' },
    argumentOverrideOperation: { Append: '末尾に追加', Prepend: '先頭に追加', Remove: '削除', Replace: '置換' },
    runOverrideValidation: { Any: '任意の値', Enum: 'リストのいずれか', Regex: '正規表現', IntegerRange: '整数の範囲' },
    credentialAuthMode: { DirectHeader: '直接ヘッダー', SignedRequest: '署名付きリクエスト', SessionExchange: 'セッショントークン交換', Hybrid: 'すべての方式' },
    operationType: { All: 'すべての操作', Create: '作成', Read: '読み取り', Write: '書き込み', Update: '更新', Delete: '削除', Execute: '実行', Admin: '管理' },
    usageQuotaScope: {"Tenant": "テナント", "Agent": "エージェント", "Deployment": "デプロイメント"},
    resourceType: {
      All: 'すべてのリソース',
      Account: 'アカウント',
      Tenant: 'テナント',
      Admin: '管理',
      User: 'ユーザー',
      Credential: 'アクセスキー',
      Session: 'セッション',
      Role: 'ロール',
      Permission: '権限',
      Assignment: '割り当て',
      Audit: '監査ログ',
      RequestHistory: 'リクエスト履歴',
      Settings: '設定',
      HarnessProfile: 'ハーネスプロファイル',
      PromptTemplate: 'プロンプトテンプレート',
      Agent: 'エージェント',
      Deployment: 'デプロイメント',
      McpServer: 'MCP サーバー',
      Secret: 'シークレット',
      Workspace: 'ワークスペース',
      ArtifactStore: '成果物ストア',
      ModelPrice: "モデル料金",
      UsageQuota: "使用量クォータ",
      Run: '実行',
      Node: 'ノード',
      NodePool: 'ノードプール',
      Manifest: 'マニフェスト',
      Conversation: '会話',
      Approval: '承認',
      Artifact: '成果物'
    },
    runStatus: {
      Pending: '保留中',
      Queued: 'キュー待ち',
      Leased: '割り当て済み',
      Running: '実行中',
      Cancelling: 'キャンセル中',
      Succeeded: '成功',
      Failed: '失敗',
      Cancelled: 'キャンセル済み',
      TimedOut: 'タイムアウト',
      Rejected: '拒否'
    },
    runOutcome: {
      None: 'なし',
      Succeeded: '成功',
      HarnessFailed: 'ハーネス失敗',
      NotInstalled: 'ハーネス未インストール',
      NotCredentialed: '認証情報なし',
      McpPreflightFailed: 'MCP 事前チェック失敗',
      NodeLost: 'ノード喪失',
      OutputLimitExceeded: '出力上限超過',
      SchemaValidationFailed: '出力スキーマ不一致',
      TimedOut: 'タイムアウト',
      Cancelled: 'キャンセル済み',
      StaleLease: '古いリース',
      CompileFailed: 'コンパイル失敗',
      WorkspaceFailed: 'ワークスペース失敗',
      Rejected: '拒否',
      InternalError: '内部エラー',
      NoCapableWorker: '対応できるワーカーなし',
      RepetitionDetected: '繰り返しを検出',
      NoProgress: '進行なし',
      PodFailed: '実行 Pod の失敗',
      ConversationStateLost: '会話の状態が失われました'
    },
    runEventType: {
      Lifecycle: 'ライフサイクル',
      AssistantText: 'アシスタント',
      Thinking: '思考',
      ToolCall: 'ツール呼び出し',
      ToolResult: 'ツール結果',
      Usage: '使用量',
      Progress: '進捗',
      Warning: '警告',
      Error: 'エラー',
      Stdout: '標準出力',
      Stderr: '標準エラー',
      Result: '結果'
    },
    nodeStatus: { Ready: '準備完了', Draining: 'ドレイン中', Cordoned: '隔離中', Lost: '喪失', Offline: 'オフライン' },
    controlNodeStatus: { Starting: '起動中', Ready: '準備完了', Draining: 'ドレイン中', Offline: 'オフライン' },
    backplane: { Local: 'ローカル (単一レプリカ)', Polling: 'データベースのポーリング', PostgresNotify: 'PostgreSQL の通知' },
    harnessType: { ClaudeCode: 'Claude Code', Codex: 'Codex', Mux: 'Mux', GeminiCli: 'Gemini CLI', Generic: '汎用' },
    agentKind: { Hosted: 'ホスト型', Remote: 'リモート' },
    delegationMode: { None: '委任なし', AllowList: '許可リスト', Any: '任意のエージェント' },
    secretStatus: { Ok: '正常', NeedsReauthentication: '再認証が必要' },
    secretKind: {
      AnthropicApiKey: 'Anthropic API キー',
      ClaudeCodeOAuthToken: 'Claude Code OAuth トークン',
      OpenAiApiKey: 'OpenAI API キー',
      CodexAuthJson: 'Codex auth.json',
      GeminiApiKey: 'Gemini API キー',
      GenericEnv: '環境変数の値',
      GenericFile: 'ファイル内容',
      BearerToken: 'Bearer トークン',
      BasicAuth: 'Basic 認証',
      GitCredential: 'Git 認証情報'
    },
    workspaceKind: { Empty: '空', GitRepository: 'Git リポジトリ', Seeded: '初期ファイル付き', PersistentVolume: '永続ボリューム' },
    runExecutor: { Process: 'プロセス', KubernetesJob: 'Kubernetes Job' },
    workspaceRetention: { Delete: '削除', Keep: '保持', KeepOnFailure: '失敗時に保持' },
    promptTemplateKind: { System: 'システム', Task: 'タスク', Fragment: 'フラグメント', ToolDescription: 'ツール説明', ConfigFile: '設定ファイル', Other: 'その他' },
    permissionType: { Permit: '許可', Deny: '拒否' },
    resourceScope: { Tenant: 'テナント', Resource: 'リソース' },
    resourceBindingKind: { McpServer: 'MCP サーバー', Secret: 'シークレット' },
    mcpTransport: { Http: 'HTTP', Stdio: 'stdio' },
    remoteProtocol: { A2A: 'A2A', Mcp: 'MCP' },
    manifestApplyResult: { Created: '作成', Updated: '更新', Unchanged: '変更なし', Failed: '失敗', Validated: '検証済み' },
    auditEventType: {
      ApprovalDecided: '承認を決定',
      AuthSuccess: 'サインイン成功',
      AuthFailure: 'サインイン失敗',
      SessionIssued: 'セッション発行',
      SessionRevoked: 'セッション失効',
      CredentialCreated: '認証キー作成',
      CredentialRotated: '認証キーのローテーション',
      CredentialUsed: '認証キー使用',
      AuthorizationDenied: '認可拒否',
      AuthorizationBypass: '認可バイパス',
      RoleChanged: 'ロール変更',
      PermissionChanged: '権限変更',
      AssignmentChanged: '割り当て変更',
      ConfigurationChanged: '構成変更',
      SecretChanged: 'シークレット変更',
      SettingsChanged: '設定変更',
      RestartRequested: '再起動要求',
      ManifestApplied: 'マニフェスト適用',
      NodeRegistered: 'ノード登録',
      NodeStatusChanged: 'ノード状態変更',
      RunCancelled: '実行キャンセル',
      ConversationDeleted: '会話を削除'
    },
    conversationFallbackReason: {
      AffinityNodeLost: 'アフィニティノードが準備完了でない',
      AffinityWaitExpired: 'アフィニティの待機時間切れ',
      WorkspaceLost: 'ワークスペースが失われた',
      SessionMissing: '再開するセッションがない',
      HarnessChanged: 'ハーネスプロファイルが変更された',
      ResumeUnsupported: '再開に未対応',
      ExecutorWithoutState: '状態を保持しない実行方式'
    }
  },
  nav: {
    approvalsPending_one: '{{count}} 件の承認待ち',
    approvalsPending_other: '{{count}} 件の承認待ち',
    primary: 'メインナビゲーション',
    sections: {
      operate: '運用',
      platform: 'プラットフォーム',
      administration: '管理'
    },
    hubs: {
      approvals: {
        label: '承認',
        tip: '人を待っているツール呼び出しと、すべての決定'
      },
      home: { label: 'ホーム', tip: 'フリートと実行の状態を一目で確認' },
      invoke: { label: '呼び出し', tip: 'エージェントを対話的に試す' },
      runs: { label: '実行', tip: '実行とスケジューリングキュー' },
      analytics: { label: '分析', tip: '実行速度、トークン、コスト、結果の推移' },
      agents: { label: 'エージェント', tip: 'エージェントとそれを実行するデプロイメント' },
      configuration: { label: '構成', tip: 'ハーネスプロファイル、プロンプトテンプレート、MCP サーバー、シークレット、ワークスペース、成果物ストア、マニフェスト' },
      fleet: { label: 'フリート', tip: 'コントロールプレーン、ワーカーノード、ノードプール' },
      access: { label: 'アクセス', tip: 'テナント、ユーザー、認証キー、ロール、割り当て' },
      monitoring: { label: '監視', tip: 'リクエスト履歴、監査、API エクスプローラー' },
      system: { label: 'システム', tip: 'サーバー設定とサーバー情報' }
    },
    items: {
      approvals: {
        label: '承認',
        tip: 'エージェントが要求したツール呼び出しを許可または拒否'
      },
      home: { label: 'ホーム', tip: 'フリートと実行の状態を一目で確認' },
      invoke: { label: '呼び出し', tip: 'エージェントを対話的に試す' },
      runs: { label: '実行', tip: '実行の検索、確認、キャンセル、再試行' },
      queue: { label: 'キュー', tip: 'エージェントとハーネスごとのスケジューリング状況' },
      analytics: { label: '分析', tip: '実行速度、トークン、コスト、結果の推移' },
      nodes: { label: 'ワーカーノード', tip: 'ワーカーノードとハーネス対応状況' },
      controlNodes: { label: 'コントロールプレーン', tip: 'API を提供し実行をスケジュールするサーバーのレプリカ' },
      nodePools: { label: 'ノードプール', tip: 'ノードをグループ化してテナントに割り当て' },
      agents: { label: 'エージェント', tip: 'REST、MCP、A2A で公開されるエージェント' },
      deployments: { label: 'デプロイメント', tip: 'エージェントをハーネス、プロンプト、リソースに結び付ける' },
      harnessProfiles: { label: 'ハーネスプロファイル', tip: '各ハーネスをヘッドレスで実行する方法' },
      promptTemplates: { label: 'プロンプトテンプレート', tip: 'Garrison が送るすべてのプロンプト (バージョン管理付き)' },
      mcpServers: { label: 'MCP サーバー', tip: 'エージェントが使えるツール' },
      secrets: { label: 'シークレット', tip: 'ハーネスと連携用の認証情報' },
      workspaces: { label: 'ワークスペース', tip: '実行用ワークスペースの準備方法' },
      artifactStores: { label: '成果物ストア', tip: '実行の成果物の保存先' },
      modelPrices: { label: "モデル料金", tip: "ハーネスが費用を報告しない場合の推定に使う、運用者設定の米ドル料金です。ゼロを含む報告済み費用が優先されます。" },
      usageQuotas: { label: "使用量クォータ", tip: "テナント、エージェント、デプロイメントの実行数、トークン数、既知の費用に対するUTC日次上限と現在の同時実行数です。" },
      manifests: { label: 'マニフェスト', tip: '構成をコードとして適用・エクスポート' },
      requests: { label: 'リクエスト履歴', tip: 'HTTP トラフィックと失敗の調査' },
      audit: { label: '監査', tip: 'セキュリティと構成のイベント' },
      explorer: { label: 'API エクスプローラー', tip: 'API をその場で実行' },
      tenants: { label: 'テナント', tip: 'テナントの管理' },
      users: { label: 'ユーザー', tip: 'ユーザーの管理' },
      credentials: { label: '認証キー', tip: '自動化用のアクセスキー' },
      roles: { label: 'ロール', tip: 'ロールと権限' },
      assignments: { label: '割り当て', tip: 'ユーザーと認証キーへのロール付与' },
      settings: { label: '設定', tip: 'サーバーとクラスターの設定を編集' },
      serverInfo: { label: 'サーバー情報', tip: 'エンドポイント、バージョン、現在の ID' },
      conversations: {
        label: '会話',
        tip: 'エージェントとの複数ターンのやり取り'
      }
    },
    setup: 'セットアップウィザード',
    setupTip: '認証情報を登録し、サンプルエージェントを適用してテスト',
    tour: 'ガイドツアー',
    tourTip: 'ガイドツアーを再生',
    version: 'バージョン {{version}}',
    collapseSidebar: 'ナビゲーションの切り替え',
    skipToContent: '本文へ移動'
  },
  login: {
    title: 'Garrison',
    subtitle: 'エージェントコントロールプレーンにサインイン',
    tabs: { password: 'メールとパスワード', accessKey: 'アクセスキー' },
    serverUrl: 'サーバー URL',
    serverInUse: '使用するサーバー:',
    useDifferentServer: '別のサーバーを使用',
    useDefaultServer: '既定のサーバーを使用',
    tenantId: 'テナント ID',
    email: 'メールアドレス',
    password: 'パスワード',
    accessKey: 'アクセスキー',
    secretKey: 'シークレットキー',
    submit: 'サインイン',
    connecting: 'サインイン中...',
    restoring: 'セッションを復元しています...',
    errorGeneric: 'サインインできません。認証情報と、サーバーに接続できるかを確認してください。',
    footerHint: '既定の資格情報: テナント default の admin@garrison / password。'
  },
  topbar: {
    server: 'サーバー',
    tenant: 'テナント',
    switchTenant: 'テナントを切り替え',
    copyServer: 'サーバー URL をコピー',
    live: 'ライブ',
    polling: 'ポーリング',
    liveOn: 'WebSocket でライブ更新を受信中',
    liveOff: 'ライブ更新は利用できません。各ページはポーリングで更新されます',
    health: { healthy: '正常', unhealthy: '接続不可', unknown: '確認中' }
  },
  roles: {
    systemAdmin: 'システム管理者',
    tenantAdmin: 'テナント管理者',
    user: 'ユーザー',
    credential: 'アクセスキー',
    run: '実行トークン'
  },
  components: {
    fieldWarnings: { title_one: '{{count}} 件の値を調整して保存しました', title_other: '{{count}} 件の値を調整して保存しました', body: 'サーバーはリクエストを受け付けましたが、次の値は送信した内容とは異なる値で保存されました。', dismiss: '閉じる', codes: { ValueClamped: '値を許容範囲に制限しました' } },
    approvals: {
      awaiting: '承認待ち',
      decideTitle: '{{tool}} を決定',
      decision: '決定',
      reason: '理由',
      reasonPlaceholder: '任意。エージェントと監査ログに表示されます。',
      remember: 'このデプロイメントのルールとして記憶する',
      rulePattern: 'ルールパターン',
      rememberHint: 'アクション {{action}} のルールをデプロイメントに追加し、一致する呼び出しを確認なしで決定します。デプロイメントを更新する権限も必要です。',
      submitAllow: '許可',
      submitDeny: '拒否',
      timeoutThen: 'その後 {{decision}}',
      toasts: {
        allowed: '{{tool}} を許可しました。',
        denied: '{{tool}} を拒否しました。',
        allowedRemembered: '{{tool}} を許可し、ルール {{pattern}} を追加しました。',
        deniedRemembered: '{{tool}} を拒否し、ルール {{pattern}} を追加しました。',
        notPending: 'この承認は、他の人またはタイムアウトによってすでに決定されています。一覧に結果が表示されています。',
        forbidden: '承認を閲覧できますが、決定はできません。管理者に Approval Update 権限を依頼してください。',
        forbiddenRemember: 'ルールを記憶するには、デプロイメントを更新する権限も必要です。記憶せずに決定するか、Deployment Update を依頼してください。'
      }
    },
    approvalCheck: {
      title: 'ツール呼び出しをテスト',
      saveFirst: '先にデプロイメントを保存してください。テストはサーバーに保存されたルールを確認します。',
      hint: '保存済みのルールを確認するため、テストの前に変更を保存してください。何も記録されません。',
      toolName: 'ツール',
      inputs: {
        command: 'コマンド',
        url: 'URL',
        query: '検索クエリ',
        file_path: 'ファイルパス',
        notebook_path: 'ノートブックのパス',
        pattern: 'パターン'
      },
      run: 'チェック',
      checking: 'チェック中...',
      byRule: 'このルールにより {{action}}:',
      byDefault: 'どのルールにも一致しなかったため、デプロイメントの既定値により {{action}}。',
      suggestedRule: '提案されたルール:',
      disabled: 'このデプロイメントでは承認がオフのため、その実行は確認を求めません。これらのルールを適用するには、承認をオンにして保存してください。'
    },
    blocked: {
      title: 'ワーカー待ち',
      body: 'この実行はキューにありますが、現在引き受けられるワーカーがありません。',
      reasons: {
        NoReadyWorker: '準備完了のワーカーノードがありません。ワーカーを起動するか新しく登録し、フリートページで喪失、オフライン、ドレイン中、隔離中のノードを確認してください。',
        NoCapableWorker: 'ワーカーは準備完了ですが、{{harness}} ハーネスを利用可能と報告しているものがありません。そのハーネスをインストールしたワーカーを起動または登録するか、フリートページで認証情報とプローブ結果を確認してください。',
        NoMatchingPool: '{{harness}} を実行できる準備完了のワーカーはありますが、このデプロイメントのノードプールやノードセレクターに一致しません。デプロイメントの配置を確認するか、そのプールにワーカーを追加してください。'
      },
      failNote: 'クラスター設定 Runtime.FailBlockedAfterSeconds が 0 より大きい場合、その時間ブロックされたままの実行は結果「対応できるワーカーなし」で失敗します。',
      openFleet: 'フリートを開く',
      openAgent: 'エージェントのデプロイメントを開く',
      homeBanner_other: 'キュー内の {{count}} 件の実行を開始できません。準備完了のワーカーで実行できるものがありません。',
      showRuns: 'キュー内の実行を表示',
      queueColumn: 'ブロック',
      queueCount_other: '{{count}} 件ブロック'
    },
    autoRefresh: {
      label: '自動更新',
      none: 'オフ',
      seconds_one: '{{count}} 秒ごと',
      seconds_other: '{{count}} 秒ごと'
    },
    chart: {
      success: '成功',
      failure: '失敗',
      total: '合計',
      avgDuration: '平均所要時間',
      noData: 'この期間のアクティビティはありません。',
      range: '期間',
      ranges: { hour: '過去 1 時間', day: '過去 1 日', week: '過去 1 週間', month: '過去 1 か月', custom: 'カスタム' }
    },
    compilePreview: {
      title: 'コンパイルプレビュー',
      input: 'サンプル入力',
      compile: 'コンパイル',
      compiling: 'コンパイル中...',
      commandLine: 'コマンドライン',
      stdin: '標準入力',
      environment: '環境変数',
      files_one: 'ファイル {{count}} 件',
      files_other: 'ファイル {{count}} 件'
    },
    confirm: { title: '確認してください', message: '続行してもよろしいですか?' },
    diff: { before: '変更前', after: '変更後' },
    explainer: { about: '{{topic}} について', dismiss: 'この説明を隠す' },
    export: { label: 'エクスポート', csv: 'CSV (データ)', png: 'PNG 画像', svg: 'SVG 画像', json: 'JSON (データ)', failed: 'エクスポートに失敗しました。{{message}}', tableTitle: '表 {{table}}' },
    filters: {
      allTenants: 'すべてのテナント',
      clear: 'フィルターをクリア',
      from: '開始',
      to: '終了',
      method: 'メソッド',
      path: 'パスに含む',
      pathPlaceholder: '例: /v1.0/api/tenants',
      searchName: '名前で検索',
      status: 'ステータスコード',
      statusPlaceholder: '例: 404',
      tenant: 'テナント'
    },
    form: {
      addItem: '項目を追加',
      addRow: '行を追加',
      key: 'キー',
      value: '値',
      moveUp: '上へ移動',
      moveDown: '下へ移動',
      noItems: '項目はまだありません。',
      onePerLine: '1 行に 1 つの値',
      steps: 'フォームの手順'
    },
    mcpTest: {
      title: 'MCP 接続テスト',
      testing: '接続してツールを取得しています...',
      ok: '接続成功',
      failed: '失敗',
      tools_one: 'ツール {{count}} 件',
      tools_other: 'ツール {{count}} 件'
    },
    permissions: {
      title: '有効な権限',
      none: '付与はありません。このプリンシパルはバイパスルールのみ利用できます (存在する場合)。',
      source: 'ロール',
      type: '種別',
      resources: 'リソース種別',
      operations: '操作',
      scope: 'スコープ'
    },
    requestDetails: {
      title: 'リクエストの詳細',
      metadata: 'メタデータ',
      requestHeaders: 'リクエストヘッダー',
      requestBody: 'リクエスト本文',
      responseHeaders: 'レスポンスヘッダー',
      responseBody: 'レスポンス本文',
      rawJson: '生の JSON',
      truncated: '切り詰め済み (元のサイズ {{bytes}} バイト)',
      empty: '内容はありません。',
      fields: {
        id: 'リクエスト ID',
        method: 'メソッド',
        path: 'パス',
        url: 'URL',
        status: 'ステータス',
        duration: '所要時間',
        createdUtc: '作成日時',
        completedUtc: '完了日時',
        sourceIp: '送信元 IP',
        principal: 'プリンシパル',
        tenant: 'テナント',
        user: 'ユーザー'
      }
    },
    secretOnce: {
      title: 'このシークレットを今すぐコピーしてください',
      warning: 'シークレットが表示されるのは今回だけです。閉じる前に安全な場所に保存してください。',
      accessKey: 'アクセスキー',
      secretKey: 'シークレットキー',
      done: '保存しました'
    },
    table: {
      bulkActions: '一括操作',
      bulkDelete: '選択項目を削除',
      clearSelection: '選択を解除',
      empty: '表示するレコードはありません。',
      first: '最初のページ',
      jump: 'ページへ移動',
      last: '最後のページ',
      loading: 'レコードを読み込み中...',
      next: '次のページ',
      noMatches: '現在のフィルターに一致するレコードはありません。',
      pageOf: '{{page}} / {{total}} ページ',
      pageSize: '表示件数',
      pinned: '常に表示',
      prev: '前のページ',
      records_one: '件',
      records_other: '件',
      refresh: '更新',
      selectAll: 'このページの行をすべて選択',
      selectColumns: '列を選択',
      selected_one: '{{formattedCount}} 件選択中',
      selected_other: '{{formattedCount}} 件選択中',
      selectRow: '行を選択',
      showing: '{{from}} から {{to}} 件を表示',
      sortBy: '{{column}} で並べ替え',
      sortPageOnly: '現在のページのみを並べ替えます'
    }
  },
  resources: {
    approvals: {
      ...rp('承認', 'エージェントが要求したツール呼び出しです。デプロイメントのルール、デプロイメントの既定値、人、またはタイムアウトによって決定されます。保留中のものはあなたの判断を待っています。', '承認を追加', '承認を作成', '承認を編集', '承認の詳細', '承認を削除', '承認はまだありません', '承認を有効にしたデプロイメントがツール呼び出しの前に確認すると、承認が表示されます。'),
      columns: {
        createdUtc: '要求日時',
        agentName: 'エージェント',
        toolName: 'ツール',
        summary: '要求',
        status: '状態',
        decision: '決定',
        decisionSource: '決定元',
        decidedBy: '決定者',
        expiresUtc: '期限',
        kind: '種類',
        harnessType: 'ハーネス',
        runId: '実行',
        waitMs: '待機',
        reason: '理由',
        decidedUtc: '決定日時',
        id: 'ID'
      },
      fields: {
        status: '状態',
        decision: '決定',
        decisionSource: '決定元',
        decidedBy: '決定者',
        toolName: 'ツール',
        kind: '種類',
        harnessType: 'ハーネス',
        agentName: 'エージェント',
        runId: '実行',
        rootRunId: 'ルート実行',
        deploymentId: 'デプロイメント',
        leaseEpoch: 'リースエポック',
        requestedUtc: '要求日時',
        expiresUtc: '期限',
        decidedUtc: '決定日時',
        waitMs: '待機時間',
        timeoutDecision: 'タイムアウト時の決定',
        toolCallId: 'ツール呼び出し ID',
        reason: '理由',
        summary: '概要',
        inputPreview: '入力 (秘匿済み)',
        rulePattern: '一致したルール',
        ruleId: 'ルール ID',
        suggestedRule: '提案されたルール',
        rememberedRuleId: '記憶したルールの ID'
      },
      filters: {
        runId: '実行 ID',
        runIdPlaceholder: '実行 ID (run_...)'
      },
      actions: {
        allow: '許可',
        deny: '拒否',
        openRun: '実行を開く'
      }
    },
    tenants: {
      ...rp('テナント', 'ユーザー、エージェント、シークレット、実行をそれぞれ持つ分離された領域です。', 'テナントを追加', 'テナントを作成', 'テナントを編集', 'テナントの詳細', 'テナントを削除', 'テナントはまだありません', 'チームや顧客を分離するためにテナントを作成してください。'),
      columns: { name: '名前', id: 'ID', description: '説明', active: '有効', createdUtc: '作成日時' },
      fields: { name: '名前', description: '説明', active: '有効' }
    },
    users: {
      ...rp('ユーザー', 'メールとパスワードでこのテナントにサインインする人です。', 'ユーザーを追加', 'ユーザーを作成', 'ユーザーを編集', 'ユーザーの詳細', 'ユーザーを削除', 'ユーザーはまだいません', 'このテナントにサインインできるようにユーザーを追加してください。'),
      columns: { email: 'メールアドレス', name: '名前', id: 'ID', role: 'ロール', active: '有効', createdUtc: '作成日時' },
      fields: { email: 'メールアドレス', password: 'パスワード', firstName: '名', lastName: '姓', isTenantAdmin: 'テナント管理者', isAdmin: 'システム管理者', active: '有効' },
      hints: { isAdmin: 'システム管理者はすべてのテナントを管理でき、すべての認可をバイパスします。', password: '編集時に空欄のままにすると現在のパスワードが維持されます。' },
      actions: { permissions: '有効な権限' }
    },
    credentials: {
      ...rp('認証キー', '自動化、SDK、連携で使うアクセスキーです。シークレットは一度だけ表示されます。', '認証キーを追加', '認証キーを作成', '認証キーを編集', '認証キーの詳細', '認証キーを削除', '認証キーはまだありません', 'スクリプトやサービスが Garrison を呼び出せるようにアクセスキーを作成してください。'),
      columns: { name: '名前', accessKey: 'アクセスキー', secretKeyLast4: 'シークレット', userId: '所有者', lastUsedUtc: '最終使用', expiresUtc: '有効期限', active: '有効', id: 'ID' },
      fields: { name: '名前', userId: '所有者', authMode: '認証モード', expiresUtc: '有効期限', active: '有効' },
      hints: { userId: '認証キーの権限が所有者の権限を超えることはありません。' },
      actions: { rotate: 'シークレットをローテーション' }
    },
    roles: {
      ...rp('ロール', 'ロールは権限をまとめたものです。組み込みロールは読み取り専用のため、カスタマイズするには複製してください。', 'ロールを追加', 'ロールを作成', 'ロールを編集', 'ロールの詳細', 'ロールを削除', 'ロールはまだありません', 'カスタムロールを作成するか、組み込みロールを複製してください。'),
      columns: { name: '名前', description: '説明', isBuiltIn: '種別', active: '有効', id: 'ID', createdUtc: '作成日時' },
      fields: { name: '名前', description: '説明', active: '有効' }
    },
    permissions: {
      ...rp('権限', 'リソース種別への操作を許可または拒否します。拒否が常に優先されます。', '権限を追加', '権限を作成', '権限を編集', '権限の詳細', '権限を削除', '権限はまだありません', '権限を作成してロールに割り当ててください。'),
      columns: { name: '名前', permissionType: '種別', resourceTypes: 'リソース種別', operationTypes: '操作', isBuiltIn: '由来', id: 'ID' },
      fields: { name: '名前', permissionType: '種別', resourceTypes: 'リソース種別', operationTypes: '操作', active: '有効' }
    },
    userAssignments: {
      ...rp('ユーザーの割り当て', 'テナントまたはリソースのスコープでユーザーにロールを付与します。', '割り当てを追加', '割り当てを作成', '割り当てを編集', '割り当ての詳細', '割り当てを削除', 'ユーザーの割り当てはまだありません', 'ユーザーにロールを割り当ててください。'),
      columns: { userId: 'ユーザー', roleName: 'ロール', resourceScope: 'スコープ', resourceId: 'リソース', active: '有効', createdUtc: '作成日時', id: 'ID' },
      fields: { userId: 'ユーザー', roleId: 'ロール', resourceScope: 'スコープ', resourceId: 'リソース ID', inheritsToChildren: 'テナント内のリソースにも適用', active: '有効' }
    },
    credentialAssignments: {
      ...rp('認証キーの割り当て', 'アクセスキーにロールを付与します。認証キーの権限は所有者より狭く保ってください。', '割り当てを追加', '割り当てを作成', '割り当てを編集', '割り当ての詳細', '割り当てを削除', '認証キーの割り当てはまだありません', '認証キーにロールを割り当ててください。'),
      columns: { credentialId: '認証キー', roleName: 'ロール', resourceScope: 'スコープ', resourceId: 'リソース', active: '有効', createdUtc: '作成日時', id: 'ID' },
      fields: { credentialId: '認証キー', roleId: 'ロール', resourceScope: 'スコープ', resourceId: 'リソース ID', inheritsToChildren: 'テナント内のリソースにも適用', active: '有効' }
    },
    harnessProfiles: {
      ...rp('ハーネスプロファイル', 'ハーネスをヘッドレスで実行する方法 (実行ファイル、引数、環境変数、ファイル、出力の解析) を正確に定義します。', 'プロファイルを追加', 'プロファイルを作成', 'プロファイルを編集', 'プロファイルの詳細', 'プロファイルを削除', 'ハーネスプロファイルはまだありません', 'ハーネスの起動方法をカスタマイズするには組み込みプロファイルを複製してください。'),
      steps: { basics: '基本', invocation: '呼び出し', output: '出力', limits: '制限' },
      columns: { name: '名前', harnessType: 'ハーネス', executable: '実行ファイル', outputParser: 'パーサー', isBuiltIn: '由来', id: 'ID', createdUtc: '作成日時' },
      fields: {
        name: '名前',
        description: '説明',
        harnessType: 'ハーネスの種類',
        executable: '実行ファイル',
        probeArguments: 'バージョン確認の引数',
        active: '有効',
        arguments: '引数',
        argTemplate: 'テンプレート',
        argCondition: '条件',
        argRepeatOver: '繰り返し対象',
        promptDelivery: 'プロンプトの渡し方',
        promptArgumentTemplate: 'プロンプト引数またはファイル名',
        systemPromptDelivery: 'システムプロンプトの渡し方',
        systemPromptTarget: 'システムプロンプトの渡し先',
        mcpConfigFormat: 'MCP 設定形式',
        mcpConfigFileName: 'MCP 設定ファイル名',
        environment: '環境変数',
        envName: '名前',
        envValue: '値テンプレート',
        isSecret: '機密',
        files: 'ファイル',
        fileBase: '基準ディレクトリ',
        filePath: 'パス',
        fileContent: '内容テンプレート',
        fileMode: 'モード',
        credentialEnvironmentAllowlist: '許可する認証情報変数',
        outputParser: '出力パーサー',
        genericTextField: 'テキスト項目のパス',
        genericFinalField: '最終結果項目のパス',
        genericSuccessField: '成功判定項目のパス',
        genericSuccessValue: '成功を示す値',
        resultSource: '結果の取得元',
        resultFileName: '結果ファイル名',
        successPolicy: '成功判定',
        successExitCodes: '成功とみなす終了コード',
        defaultTimeoutSeconds: '既定のタイムアウト (秒)',
        killGraceSeconds: '強制終了までの猶予 (秒)',
        maxOutputBytes: '最大出力 (バイト)',
        stderrTailBytes: '保持する標準エラー末尾 (バイト)',
        isolateHome: '実行ごとに HOME を分離',
        supportsResume: 'セッション再開に対応'
      },
      hints: {
        arguments: '各テンプレートは 1 つの引数になります。条件が空または false になる場合、その引数は省略されます。',
        executable: 'ワーカーの PATH 上のコマンド名、または絶対パス。',
        environment: '結び付けたシークレットは {{secret.alias}} で参照します。プロセスの環境変数は許可リストを除き空の状態から始まります。',
        successPolicy: 'Garrison は既定で終了コードではなく、パーサーの最終イベントで成功を判定します。'
      },
      errors: { reservedPrefix: 'builtin/ という接頭辞は予約されています。' }
    },
    promptTemplates: {
      deleteBound_other: '「{{name}}」は {{count}} 件のデプロイメントに結び付けられているため、サーバーは削除を拒否します。先に次のデプロイメントから結び付けを外してください:',
      deleteBound_one: '「{{name}}」は {{count}} 件のデプロイメントに結び付けられているため、サーバーは削除を拒否します。先に次のデプロイメントから結び付けを外してください:',
      deleteUnbound: '「{{name}}」とそのすべてのバージョンを削除しますか? このテンプレートを結び付けているデプロイメントはありません。この操作は元に戻せません。',
      ...rp('プロンプトテンプレート', 'Garrison が生成するすべてのプロンプトと設定ファイル。保存するたびに新しいバージョンが作成されます。', '新しいテンプレート', 'テンプレートを作成', 'テンプレートを編集', 'テンプレートの詳細', 'テンプレートを削除', 'プロンプトテンプレートはまだありません', 'テンプレートを作成するか、組み込みテンプレートを複製してください。'),
      columns: { name: '名前', kind: '種類', currentVersion: 'バージョン', description: '説明', isBuiltIn: '由来', id: 'ID', lastUpdateUtc: '更新日時' },
      fields: { name: '名前', kind: '種類', description: '説明' }
    },
    mcpServers: {
      ...rp('MCP サーバー', 'エージェントが使える MCP サーバーです。ヘッダーと環境変数はシークレットを参照できます。', 'MCP サーバーを追加', 'MCP サーバーを作成', 'MCP サーバーを編集', 'MCP サーバーの詳細', 'MCP サーバーを削除', 'MCP サーバーはまだありません', 'デプロイメントで使えるように MCP サーバーを登録してください。'),
      columns: { name: '名前', transport: 'トランスポート', endpoint: 'エンドポイント', required: '必須', active: '有効', id: 'ID', createdUtc: '作成日時' },
      fields: {
        name: '名前',
        transport: 'トランスポート',
        description: '説明',
        url: 'ベース URL',
        path: 'MCP パス',
        headers: 'ヘッダー',
        headerName: '名前',
        headerValue: '値テンプレート',
        command: 'コマンド',
        arguments: '引数',
        environment: '環境変数',
        requiredTools: '必須ツール',
        toolTimeoutSeconds: 'ツールのタイムアウト (秒)',
        required: '接続できない場合は実行を失敗にする',
        active: '有効'
      },
      hints: { requiredTools: '一覧のツールが見つからない場合、事前チェックで起動前に実行を失敗にします。' },
      actions: { test: '接続をテスト' }
    },
    secrets: {
      errors: { expiryPast: '有効期限には未来の日時を選ぶか、期限なしにするには空のままにしてください。' },
      ...rp('シークレット', 'ハーネスと連携のための暗号化された認証情報です。値は書き込み専用です。', 'シークレットを追加', 'シークレットを作成', 'シークレットを編集', 'シークレットの詳細', 'シークレットを削除', 'シークレットはまだありません', 'エージェントに必要な API キーやトークン (例: Anthropic API キー) を追加してください。'),
      notSet: '未設定',
      neverRefreshed: 'まだありません',
      reauth: { title: 'このログインは再認証が必要です', since: '{{time}} から', action: 'このシークレットを使う実行は、値を置き換えるまで失敗します。専用の CODEX_HOME で codex login を実行して再ログインし、「値を設定」で新しい auth.json を保存するか、デプロイメントを OpenAI API キーのシークレットに切り替えてください。同じログインを別のマシンで使い続けないでください。両方のコピーが 1 つのリフレッシュトークンを共有します。' },
      columns: { status: '状態', accessTokenExpiresUtc: 'アクセストークンの有効期限', name: '名前', kind: '種類', valueLast4: '値', rotatedUtc: '最終変更', expiresUtc: '有効期限', active: '有効', id: 'ID' },
      fields: { refreshedUtc: 'Garrison による最終更新', accessTokenExpiresUtc: 'アクセストークンの有効期限', name: '名前', kind: '種類', description: '説明', value: '値', newValue: '新しい値', expiresUtc: '有効期限', active: '有効' },
      hints: { expiresUtc: '未来の日時を指定してください。空のままにすると期限なしになります。', kind: '共有サーバーでサブスクリプショントークンを使うと、プロバイダーの規約に違反する場合があります。共有環境では API キーを推奨します。' },
      actions: { setValue: '値を設定', rotate: 'ローテーション' }
    },
    workspaces: {
      ...rp('ワークスペース', '実行用ワークスペースの準備方法 (空、Git からクローン、ファイルを配置) です。', 'テンプレートを追加', 'テンプレートを作成', 'テンプレートを編集', 'テンプレートの詳細', 'テンプレートを削除', 'ワークスペースはまだありません', 'リポジトリやファイルから開始できるようにワークスペーステンプレートを作成してください。'),
      columns: { name: '名前', kind: '種類', gitUrl: 'リポジトリ', retention: '保持', active: '有効', id: 'ID', createdUtc: '作成日時' },
      fields: { name: '名前', kind: '種類', description: '説明', gitUrl: 'リポジトリ URL', gitRef: 'ブランチ、タグ、またはコミット', gitDepth: 'クローンの深さ', gitCredentialSecretId: 'Git 認証情報', persistentVolumeClaim: 'PersistentVolumeClaim 名', files: 'ファイル', filePath: 'パス', fileContent: '内容', retention: '保持', active: '有効' },
      hints: { persistentVolumeClaim: '実行用名前空間にある既存の Claim です。Kubernetes Job エグゼキューターのデプロイメントだけがこのワークスペースを使えます。内容は実行をまたいで保持されます。' },
      errors: { claimName: '小文字、数字、ハイフン、ドットを使い、先頭と末尾は英字か数字にしてください。' }
    },
    modelPrices: {
      ...{"title": "モデル料金", "subtitle": "ハーネスが費用を報告しない場合の推定に使う、運用者設定の米ドル料金です。ゼロを含む報告済み費用が優先されます。", "add": "モデル料金を追加", "create": "モデル料金を作成", "edit": "モデル料金を編集", "view": "モデル料金の詳細", "deleteTitle": "モデル料金を削除", "emptyTitle": "モデル料金はまだありません", "emptyBody": "ハーネスと実際に使用したモデルの正確な組み合わせに料金を追加します。プロバイダー料金の初期値はありません。"},
      columns: {"name": "名前", "active": "有効", "id": "ID", "createdUtc": "作成日時", "model": "使用モデル", "harnessType": "ハーネス", "inputUsdPerMillion": "入力 USD / 100万トークン", "outputUsdPerMillion": "出力 USD / 100万トークン"},
      fields: {"name": "名前", "description": "説明", "active": "有効", "model": "使用モデル", "harnessType": "ハーネス", "inputUsdPerMillion": "入力 USD / 100万トークン", "outputUsdPerMillion": "出力 USD / 100万トークン", "cachedInputUsdPerMillion": "キャッシュ入力 USD / 100万トークン", "reasoningUsdPerMillion": "推論 USD / 100万トークン", "inputIncludesCachedTokens": "入力数にキャッシュトークンを含む", "outputIncludesReasoningTokens": "出力数に推論トークンを含む"},
      hints: {"cachedInputUsdPerMillion": "空欄の場合は対応する入力または出力料金を使用します。ゼロは無料です。", "reasoningUsdPerMillion": "空欄の場合は対応する入力または出力料金を使用します。ゼロは無料です。", "inputIncludesCachedTokens": "入力数にキャッシュトークンが含まれる場合に有効にします。キャッシュ読み取りを別に報告するClaude Codeでは無効にしてください。", "outputIncludesReasoningTokens": "出力数に推論トークンが含まれる場合に有効にします。含まれる内訳を引いてから個別の料金を適用します。"},
      errors: {"rate": "0から1,000,000,000までの有限の料金を入力してください。ゼロも有効です。", "model": "制御文字を含まない1から256文字の正確なモデル名を入力してください。"}
    },
    usageQuotas: {"title": "使用量クォータ", "subtitle": "テナント、エージェント、デプロイメントの実行数、トークン数、既知の費用に対するUTC日次上限と現在の同時実行数です。", "add": "使用量クォータを追加", "create": "使用量クォータを作成", "edit": "使用量クォータを編集", "view": "使用量クォータの詳細", "deleteTitle": "使用量クォータを削除", "emptyTitle": "使用量クォータはまだありません", "emptyBody": "テナント、エージェント、デプロイメントにクォータを追加します。空欄の上限は無制限です。", "columns": {"name": "名前", "active": "有効", "id": "ID", "createdUtc": "作成日時", "scope": "対象範囲", "resourceId": "対象リソース", "dailyRunLimit": "UTC日ごとの実行数", "dailyTokenLimit": "UTC日ごとのトークン数", "dailyCostUsdLimit": "UTC日ごとの既知のUSD", "maxConcurrentRuns": "最大アクティブ実行数", "enforcementEnabled": "制限を適用"}, "fields": {"name": "名前", "description": "説明", "active": "有効", "scope": "対象範囲", "resourceId": "対象リソース", "dailyRunLimit": "UTC日ごとの実行数", "dailyTokenLimit": "UTC日ごとのトークン数", "dailyCostUsdLimit": "UTC日ごとの既知のUSD", "maxConcurrentRuns": "最大アクティブ実行数", "enforcementEnabled": "制限を適用"}, "hints": {"dailyRunLimit": "空欄は無制限、ゼロは使用禁止です。日次カウンターはUTC午前0時にリセットされます。同時実行数は現在のアクティブ実行を数えます。 制限は適用を有効にした場合のみ適用されます。", "dailyTokenLimit": "空欄は無制限、ゼロは使用禁止です。日次カウンターはUTC午前0時にリセットされます。同時実行数は現在のアクティブ実行を数えます。 制限は適用を有効にした場合のみ適用されます。", "dailyCostUsdLimit": "空欄は無制限、ゼロは使用禁止です。日次カウンターはUTC午前0時にリセットされます。同時実行数は現在のアクティブ実行を数えます。 制限は適用を有効にした場合のみ適用されます。", "maxConcurrentRuns": "空欄は無制限、ゼロは使用禁止です。日次カウンターはUTC午前0時にリセットされます。同時実行数は現在のアクティブ実行を数えます。 制限は適用を有効にした場合のみ適用されます。", "resourceId": "テナント、エージェント、デプロイメントにクォータを追加します。空欄の上限は無制限です。", "enforcementEnabled": "既定では無効です。有効にすると、設定した制限で実行を拒否し、対応するハーネスの予算を下げます。無効時は使用量の記録のみ行い、実行には影響しません。"}, "errors": {"limit": "フィールドの範囲内で非負の上限を入力してください。件数は整数で指定してください。"}, "incomplete": "コスト集計が不完全です。完了した {{count}} 件の実行に報告または推定コストがありません。制限は適用を有効にした場合のみ適用され、コストがないことだけで実行を拒否することはありません。", "actions": {"usage": "日次使用量"}, "usage": {"windowStartUtc": "集計開始 (UTC)", "windowEndUtc": "日次リセット (UTC)", "runsUsed": "受け付けた実行", "tokensUsed": "完了トークン数", "costUsd": "既知の費用 (USD)", "unknownCostRuns": "費用不明の実行", "activeRuns": "アクティブ実行"}},
    artifactStores: {
      ...rp('成果物ストア', '実行で生成されたファイルの保存先です。', 'ストアを追加', 'ストアを作成', 'ストアを編集', 'ストアの詳細', 'ストアを削除', '成果物ストアはまだありません', '実行結果を保存するために成果物ストアを作成してください。'),
      columns: { name: '名前', kind: '種類', description: '説明', active: '有効', id: 'ID', createdUtc: '作成日時' },
      fields: { name: '名前', kind: '種類', description: '説明', active: '有効' }
    },
    agents: {
      deleteWithDeployments_other: '「{{name}}」と {{count}} 件のデプロイメントを削除しますか? 下のデプロイメントも削除されます。この操作は元に戻せません。',
      deleteWithDeployments_one: '「{{name}}」と {{count}} 件のデプロイメントを削除しますか? 下のデプロイメントも削除されます。この操作は元に戻せません。',
      deleteNoDeployments: '「{{name}}」を削除しますか? デプロイメントはありません。この操作は元に戻せません。',
      ...rp('エージェント', 'REST、MCP、A2A で公開される名前付きの機能です。実行方法はデプロイメントで決まります。', 'エージェントを追加', 'エージェントを作成', 'エージェントを編集', 'エージェントの詳細', 'エージェントを削除', 'エージェントはまだありません', 'エージェントを追加するか、構成 > マニフェストでサンプルマニフェストを適用してください。'),
      sections: { identity: '識別情報', exposure: '公開設定', io: '入力と出力', delegation: '委任' },
      columns: { name: '名前', displayName: '表示名', kind: '種類', exposure: '公開', delegationMode: '委任', tags: 'タグ', active: '有効', id: 'ID', createdUtc: '作成日時' },
      fields: {
        name: '名前',
        displayName: '表示名',
        description: '説明',
        kind: '種類',
        agentVersion: 'バージョン',
        tags: 'タグ',
        remoteProtocol: 'リモートプロトコル',
        remoteEndpointUrl: 'リモートエンドポイント URL',
        exposeA2A: 'A2A で公開',
        exposeMcpTool: '専用の MCP ツールとして公開',
        mcpToolName: 'MCP ツール名',
        skills: 'A2A スキル',
        skillId: 'スキル ID',
        skillName: '名前',
        skillDescription: '説明',
        inputMode: '入力モード',
        inputSchema: '入力 JSON スキーマ',
        outputSchema: '出力 JSON スキーマ',
        delegationMode: '委任',
        delegationAllowList: '呼び出せるエージェント',
        delegationMaxDepth: '最大の深さ',
        delegationAllowRecursion: '再帰を許可',
        active: '有効'
      },
      hints: { name: '英小文字、数字、ハイフンを使用します。URL と A2A カードで使われます。' },
      errors: { dnsName: '英小文字、数字、ハイフンを使い、先頭と末尾は英字か数字にしてください。' }
    },
    deployments: {
      approvalsOn_one: 'オン、ルール {{count}} 件',
      approvalsOn_other: 'オン、ルール {{count}} 件',
      approvalsOff: 'オフ',
      promptRoles: { Repair: '構造化出力の修復', DelegatedTask: '委任された実行のタスクラッパー', Task: 'タスクのラッパー', System: 'システムプロンプト', ConversationFallback: '会話のフォールバック (履歴)' },
      ...rp('デプロイメント', 'エージェントをハーネスプロファイル、プロンプト、シークレット、MCP サーバー、配置、制限に結び付けます。', 'デプロイメントを追加', 'デプロイメントを作成', 'デプロイメントを編集', 'デプロイメントの詳細', 'デプロイメントを削除', 'デプロイメントはまだありません', 'エージェントを実行できるようにデプロイメントを作成してください。'),
      steps: { approvals: '承認', basics: '基本', harness: 'ハーネス', prompts: 'プロンプト', resources: 'リソース', overrides: '上書き', placement: '配置と制限' },
      columns: { approvalsEnabled: '承認', name: '名前', agentId: 'エージェント', harnessProfileId: 'ハーネスプロファイル', model: 'モデル', executor: 'エグゼキューター', weight: '重み', configVersion: '構成バージョン', active: '有効', id: 'ID', createdUtc: '作成日時' },
      fields: {
        approvalsEnabled: 'ツール呼び出しの前に確認 (承認)',
        approvalDefaultAction: 'どのルールにも一致しない場合',
        approvalTimeoutSeconds: '承認のタイムアウト (秒)',
        approvalTimeoutDecision: '誰も応答しない場合の決定',
        approvalRules: '承認ルール',
        ruleAction: 'アクション',
        rulePattern: 'ルール',
        ruleInputPattern: '入力パターン',
        ruleDescription: '説明',
        approvalTest: 'ツール呼び出しをテスト',
        name: '名前',
        agentId: 'エージェント',
        description: '説明',
        weight: 'トラフィックの重み',
        active: '有効',
        harnessProfileId: 'ハーネスプロファイル',
        model: 'モデル',
        fallbackModel: '代替モデル',
        effort: 'エフォート',
        maxTurns: '最大ターン数',
        maxBudgetUsd: '最大予算 (USD)',
        parameters: 'パラメーター',
        paramName: '名前',
        paramValue: '値',
        promptBindings: 'プロンプトの結び付け',
        promptRole: 'ロール',
        template: 'テンプレート',
        pinnedVersion: '固定バージョン',
        resourceBindings: 'リソースの結び付け',
        bindingKind: '種類',
        alias: 'エイリアス',
        resource: 'リソース',
        workspaceTemplateId: 'ワークスペーステンプレート',
        artifactStoreId: '成果物ストア',
        argumentOverrides: '引数の上書き',
        operation: '操作',
        match: '一致対象',
        argTemplate: 'テンプレート',
        condition: '条件',
        environmentOverrides: '環境変数の上書き',
        envName: '名前',
        envValue: '値テンプレート',
        isSecret: '機密',
        fileOverrides: 'ファイルの上書き',
        allowedRunOverrides: '呼び出し側が実行ごとに設定できる上書き',
        validation: '検証',
        pattern: 'パターンまたは値',
        nodePoolId: 'ノードプール',
        nodeSelector: 'ノードセレクター',
        maxConcurrentRuns: '最大同時実行数',
        timeoutSeconds: 'タイムアウト (秒)',
        maxAttempts: '最大試行回数',
        repetitionGuard: '繰り返しガード',
        maxAssistantChars: '最大アシスタント文字数',
        noProgressSeconds: '進行なしタイムアウト (秒)',
        executor: 'エグゼキューター',
        podCpuRequest: 'CPU 要求',
        podCpuLimit: 'CPU 上限',
        podMemoryRequest: 'メモリ要求',
        podMemoryLimit: 'メモリ上限',
        podEphemeralStorageRequest: 'エフェメラルストレージ要求',
        podEphemeralStorageLimit: 'エフェメラルストレージ上限'
      },
      hints: {
        approvalsEnabled: 'Claude Code のプロファイルと、Codex app-server を使うプロファイルで動作します。他のハーネスには承認フックがないため、サーバーはそれらに対するこの設定を拒否します。',
        approvalDefaultAction: '「人に確認」は、誰かが決定するかタイムアウトになるまで承認の受信トレイで待機します。',
        approvalTimeoutSeconds: '10 から 3,600 秒まで。空の場合は 300 を使います。',
        approvalRules: '拒否は確認より優先され、確認は許可より優先されます。例: Bash(npm test)、Bash(npm run *)、Edit(src/**)、WebFetch(domain:example.com)、mcp__github__*。',
        secretsKinds: 'ハーネスプロファイル {{profile}} には種類が {{kinds}} のシークレットが必要です。任意のエイリアスで 1 つ結び付けてください。',
        secretsAliases: 'ハーネスプロファイル {{profile}} は次のエイリアスで結び付けられたシークレットを読み取ります: {{aliases}}。',
        secretsNone: 'ハーネスプロファイル {{profile}} はシークレットを読み取らないため、シークレットの結び付けは不要です。',
        promptBindings: 'プロンプトのロール (System、Task、DelegatedTask、およびプロファイルが使うロール) をテンプレートに対応付けます。バージョンを空にすると常に最新版を使います。',
        resourceBindings: 'エイリアスはテンプレート変数になります。例: {{secret.anthropic}}。',
        weight: 'デプロイメントを指定しないリクエストは、有効なデプロイメントに重みに応じて振り分けられます。',
        maxConcurrentRuns: '0 は無制限を意味します。',
        timeoutCap: 'すべての実行はクラスター設定 {{setting}} により {{value}} 秒に制限されます。',
        zeroUnlimited: '0 は無制限です。',
        zeroOff: '0 でガードをオフにします。',
        guardDefault: '空の場合は {{setting}} のクラスター既定値 {{value}} を使います。',
        guardDefaultUnknown: '空の場合はクラスター設定 {{setting}} を使います。',
        guardOwn: 'このデプロイメントで設定済みです。クラスター既定値 ({{setting}}) は {{value}} です。',
        guardOwnUnknown: 'クラスター設定 {{setting}} の代わりにこのデプロイメントで設定済みです。',
        guardFollowing: '{{setting}} のクラスター既定値 {{value}} に従います。',
        executorInherit: '空の場合はノードプールの既定値 ({{executor}}) を使います。',
        executorSet: 'プロセスはワーカー内でハーネスを実行し、Kubernetes Job は専用の Pod で実行します。',
        podCpuRequest: 'Pod のリソースは Kubernetes Job の実行にだけ適用されます。500m、2、512Mi、4Gi のような Kubernetes の数量で指定します。空はワーカーの既定値です。'
      },
      actions: { addRule: 'ルールを追加', compilePreview: 'コンパイルプレビュー', test: 'テスト呼び出し', useClusterDefault: 'クラスター既定値を使う' },
      sections: {
        guards: 'ランガード',
        execution: 'エグゼキューターと Pod リソース'
      },
      placeholders: {
        ruleInputPattern: '入力 JSON に対する任意の正規表現',
        clusterDefault: 'クラスター既定値 ({{value}})',
        clusterDefaultUnknown: 'クラスター既定値'
      },
      executorInherit: 'ノードプールの既定値',
      executorInheritShort: 'プール既定値',
      errors: { rulePatternRequired: 'ルールパターンを入力してください。', rulePatternOneLine: 'ルールパターンは 1 行に収める必要があります。', rulePatternTooLong: 'ルールパターンは最大 1,000 文字です。', tooManyRules: '1 つのデプロイメントに設定できる承認ルールは最大 500 件です。', approvalTimeout: '10 から 3,600 までの整数の秒数を入力してください。', quantity: '500m、2、512Mi、4Gi のような Kubernetes の数量を指定してください。' },
      guardStates: {
        on: 'オン',
        off: 'オフ'
      }
    },
    nodePools: {
      ...rp('ノードプール', 'ワーカーノードをラベルでグループ化し、必要に応じてテナント専用にします。', 'プールを追加', 'プールを作成', 'プールを編集', 'プールの詳細', 'プールを削除', 'ノードプールはまだありません', '容量を専用化するにはノードプールを作成してください。'),
      allTenants: 'すべてのテナント',
      columns: { name: '名前', description: '説明', tenants: 'テナント', defaultExecutor: '既定のエグゼキューター', active: '有効', id: 'ID', createdUtc: '作成日時' },
      fields: { name: '名前', description: '説明', defaultExecutor: '既定のエグゼキューター', tenants: '許可するテナント ID', active: '有効' },
      hints: { tenants: '空欄にするとすべてのテナントが利用できます。' }
    },
    runs: {
      ...rp('実行', 'すべてのエージェント呼び出しの状態、ノード、所要時間、結果です。', '実行を追加', '実行を作成', '実行を編集', '実行の詳細', '実行を削除', '実行はまだありません', 'エージェントを呼び出すと実行が開始されます。'),
      columns: {
        approvalWaitMs: '承認待ち時間',
        delegationWaitMs: '委任の待機時間',
        timeToFirstTokenExcludingDelegationMs: '委任を除く TTFT',
        id: '実行',
        agentName: 'エージェント',
        status: '状態',
        outcome: '結果',
        harnessType: 'ハーネス',
        leaseNodeName: 'ノード',
        timeToFirstTokenMs: 'TTFT',
        streamingMs: 'ストリーミング',
        executionMs: '所要時間',
        queueMs: 'キュー待ち時間',
        totalMs: '合計時間',
        inputTokens: '入力トークン',
        outputTokens: '出力トークン',
        cachedTokens: 'キャッシュ済みトークン',
        reasoningTokens: '推論トークン',
        outputTokensPerSecond: 'トークン/秒',
        costUsd: 'コスト',
        toolCallCount: 'ツール呼び出し',
        depth: '深さ',
        createdUtc: '作成日時',
        conversationId: '会話'
      },
      actions: { cancel: '実行をキャンセル', retry: '実行を再試行' },
      toasts: { cancelRequested: 'キャンセルを要求しました。', retried: '再試行を開始しました。' },
      turn: 'ターン {{turn}}'
    },
    nodes: {
      ...rp('ノード', '実行をリースして処理するワーカーノードです。メンテナンス前には隔離またはドレインしてください。', 'ノードを追加', 'ノードを作成', 'ノードを編集', 'ノードの詳細', 'ノードを削除', 'ノードはまだありません', 'ワーカーノードは起動時に自動で登録されます。ワーカーの StatefulSet をデプロイするか、Garrison.Worker をローカルで起動してください。'),
      columns: { name: '名前', status: '状態', capacity: '実行', harnesses: 'ハーネス', executors: 'エグゼキューター', containerized: 'コンテナ内', labels: 'ラベル', nodeVersion: 'バージョン', lastHeartbeatUtc: '最終ハートビート', id: 'ID' },
      fields: { address: 'アドレス', maxConcurrentRuns: '容量', childReserveSlots: '子用の予約枠', maxResidentWaiters: '待機中の実行の上限', activeRuns: '実行中', capabilities: '対応機能', detectedVersion: 'バージョン', available: '利用可能', detail: '詳細' },
      actions: { cordon: '隔離', uncordon: '隔離を解除', drain: 'ドレイン', runs: '実行を表示', grafana: 'Grafana で開く' },
      toasts: { cordoned: 'ノードを隔離しました。', uncordoned: 'ノードの隔離を解除しました。', draining: 'ノードをドレインしています。' }
    },
    controlNodes: {
      ...rp('コントロールプレーン', 'API、MCP、A2A を提供し、実行をスケジュールするサーバーのレプリカです。各レプリカは自分自身を登録し、5 秒ごとにハートビートを送信します。', 'コントロールノードを追加', 'コントロールノードを作成', 'コントロールノードを編集', 'コントロールノードの詳細', 'コントロールノードを削除', 'コントロールノードは報告されていません', 'コントロールノードは、サーバーのレプリカが起動すると表示されます。このコンソールより古いサーバーは報告しません。'),
      columns: { name: '名前', status: '状態', version: 'バージョン', schemaVersion: 'スキーマ', backplane: 'バックプレーン', uptime: '稼働時間', lastHeartbeatUtc: '最終ハートビート', activeRequests: 'リクエスト', openStreams: 'ストリーム', heldLongPolls: 'ロングポーリング', address: 'アドレス', hostname: 'ホスト名', startedUtc: '開始', id: 'ID' },
      fields: { name: '名前', id: 'ノード ID', hostname: 'ホスト名', address: 'アドレス', isLeader: 'リーダー', leaderEpoch: 'リーダーのエポック', version: 'バージョン', schemaVersion: 'スキーマのバージョン', backplane: 'バックプレーン', startedUtc: '開始', uptime: '稼働時間', lastHeartbeatUtc: '最終ハートビート', activeRequests: '処理中のリクエスト', openStreams: '開いているストリーム', heldLongPolls: '保持中のロングポーリング', respondingNodeId: '応答したレプリカ' },
      leader: 'リーダー',
      stale: '応答なし',
      answeredBy: '応答したレプリカ: {{node}}',
      answeredByLeader: '応答したレプリカ: {{node}} (リーダー)',
      actions: { grafana: 'Grafana で開く' }
    },
    audit: {
      ...rp('監査', 'このテナントの認証、認可、構成のイベントです。', '記録を追加', '記録を作成', '記録を編集', '監査記録の詳細', '記録を削除', '監査記録はまだありません', '人やエージェントが Garrison を使うと、ここにセキュリティイベントが表示されます。'),
      columns: { createdUtc: '日時', eventType: 'イベント', principalName: 'プリンシパル', resource: 'リソース', reason: '理由', sourceIp: '送信元 IP', id: 'ID' },
      fields: {
        eventType: 'イベント',
        principalType: 'プリンシパル種別',
        principalName: 'プリンシパル',
        principalId: 'プリンシパル ID',
        resourceType: 'リソース種別',
        resourceId: 'リソース ID',
        operation: '操作',
        method: 'メソッド',
        path: 'パス',
        authResult: '認証結果',
        authorizationResult: '認可結果',
        reason: '理由',
        bypassReason: 'バイパスの理由',
        statusCode: 'ステータスコード',
        sourceIp: '送信元 IP',
        requestId: 'リクエスト ID',
        createdUtc: '日時'
      }
    },
    manifestApplies: {
      ...rp('適用履歴', 'マニフェストの適用とドライランの履歴 (ドキュメントごとの結果付き) です。', '記録を追加', '記録を作成', '記録を編集', '適用の詳細', '記録を削除', '適用履歴はまだありません', 'マニフェストを適用またはドライランすると、ここに表示されます。'),
      columns: { createdUtc: '日時', principalName: '適用者', dryRun: 'ドライラン', counts: '結果' }
    },
    conversations: {
      title: '会話',
      subtitle: 'エージェントとの複数ターンのやり取りです。各ターンは、前のターンのハーネスセッションを再開する実行です。',
      add: '会話を追加',
      create: '会話を作成',
      edit: '会話を編集',
      view: '会話の詳細',
      deleteTitle: '会話を削除',
      emptyTitle: '会話はまだありません',
      emptyBody: '呼び出しページで「新しい会話を開始」を選んで始めるか、A2A メッセージを送信してください。A2A のコンテキストはすべて会話になります。',
      untitled: '無題の会話',
      columns: {
        title: 'タイトル',
        agentName: 'エージェント',
        state: '状態',
        turnCount: 'ターン数',
        affinityNodeName: 'アフィニティノード',
        fallbackCount: 'フォールバック数',
        lastFallbackReason: '直近のフォールバック',
        harnessType: 'ハーネス',
        callerName: '開始したユーザー',
        contextId: 'コンテキスト ID',
        sessionId: 'セッション ID',
        lastActivityUtc: '最終アクティビティ',
        createdUtc: '作成日時',
        id: 'ID'
      },
      states: {
        busy: '処理中',
        idle: '待機中'
      },
      actions: {
        continue: '続ける',
        runs: 'ターンを実行として表示'
      }
    }
  },
  views: {
    approvalDetail: {
      title: '承認',
      titleWithTool: '{{tool}} の承認',
      backToInbox: 'すべての承認',
      pending: 'このツール呼び出しを人が許可または拒否するのを待っています。',
      pendingExpires: '人の判断を待っています。誰も決定しない場合、{{when}} に決定 {{decision}} で期限切れになります。',
      request: '要求',
      rules: 'ルール',
      noRule: '一致したルールはありません',
      noInput: '入力は記録されていません。',
      notFoundTitle: '承認が見つかりません',
      notFoundBody: '別のテナントに属しているか、ID が間違っている可能性があります。'
    },
    home: {
      observabilityState: { reachable: '到達可能', unreachable: '到達不可', checking: '確認中', unknown: '状態不明' },
      observabilityVersion: 'バージョン {{version}}',
      observabilityOpen: '{{service}} を開く',
      kpisGrafana: '概要を Grafana で開く',
      grafanaDashboards: 'Grafana ダッシュボード',
      grafanaSections: { overview: '概要', http: 'HTTP API', runs: '実行', agents: 'エージェント', models: 'モデルとトークン', workers: 'ワーカー', kubernetes: 'Kubernetes エグゼキューター', protocols: 'プロトコル', scheduler: 'スケジューラーとキュー', database: 'データベース', controlPlane: 'コントロールプレーン', security: 'セキュリティと認証', integrations: '連携', logs: 'ログとトレース', autonomy: '自律' },
      observabilitySetup: 'オブザーバビリティを設定する',
      observabilityNone: 'この環境には、オブザーバビリティのサービス (Grafana、Prometheus、Tempo、Loki) が構成されていません。',
      observability: 'オブザーバビリティ',
      title: 'ホーム',
      subtitle: 'エージェントとワーカーノードの現在の状況です。',
      lastLoaded: '{{time}} に更新',
      partial: '一部のパネルを読み込めませんでした。表示中の値は不完全です。',
      getStartedTitle: 'このテナントにはまだエージェントがありません',
      getStartedBody: 'セットアップウィザードで認証情報の登録、サンプルエージェントの適用、テスト実行を行えます。',
      runSetup: 'セットアップを開始',
      kpis: {
        agents: 'エージェント',
        deployments: 'デプロイメント',
        activeRuns: '実行中',
        queued: 'キュー待ち',
        succeeded: '成功',
        failed: '失敗',
        nodes: '準備完了ノード',
        controlNodes: 'コントロールプレーン準備完了',
        nodesNote: '準備完了 / 合計',
        last24h: '過去 24 時間'
      },
      requestActivity: 'API リクエストのアクティビティ',
      nodesTitle: 'ノード',
      noNodesTitle: '登録済みのワーカーノードはありません',
      noNodesBody: 'Garrison.Worker を起動するか、ワーカーの StatefulSet をスケールしてください。ノードは自動で登録されます。',
      nodeLoad: '{{max}} 件中 {{active}} 件実行中',
      controlPlaneSection: 'コントロールプレーン',
      workersSection: 'ワーカーノード',
      openControlPlane: 'すべて表示',
      openWorkers: 'すべて表示',
      noControlNodes: 'まだ登録されたコントロールノードはありません。',
      controlNodesUnavailable: 'コントロールノードを表示できません。サーバーがこのコンソールより古いか、ノードを読み取る権限がありません。',
      recentFailures: '最近の失敗',
      noFailures: '最近失敗した実行はありません。',
      cta: {
        title: 'よく使う操作',
        invoke: 'エージェントを呼び出す',
        addAgent: 'エージェントを追加',
        applyManifest: 'マニフェストを適用',
        inspectRuns: '実行を確認',
        nodes: 'ワーカーノードを確認',
        apiExplorer: 'API エクスプローラーを開く',
        analytics: '実行の分析を表示'
      },
      externalServices: '外部サービス',
      externalServicesNote: '同梱の監視ツールです。この環境を共有する前に既定の認証情報を変更してください。',
      externalServicesNone: 'この環境には外部サービスが構成されていません。',
      credentials: '既定の認証情報',
      services: { loki: 'Loki', grafana: 'Grafana', prometheus: 'Prometheus', tempo: 'Tempo' }
    },
    markdown: {
      showRaw: '生のテキストを表示',
      showRendered: '整形して表示'
    },
    invoke: {
      stream: {
        tabsLabel: '応答の表示',
        cardLabel: '実行の出力',
        preview: 'プレビュー',
        response: '応答',
        starting: '実行を開始しています...',
        live: 'ライブ',
        finished: '完了',
        elapsed: '経過時間',
        firstToken: '最初のトークン',
        tokensPerSecond: '速度',
        finishedHint: '実行が完了しました。',
        showResponse: '応答を見る',
        reasoning: '推論',
        waiting: '出力を待っています...',
        waitingCodex: '出力を待っています。Codex は完了時に回答をまとめて送信します。',
        codexNote: 'Codex はストリーミングしません。実行が完了すると、回答がここにまとめて表示されます。',
        noText: 'この実行ではストリーミングされたテキストはありませんでした。結果は「応答」タブにあります。',
        jump: '最新へ移動',
        tool: {
          running: '実行中',
          ok: '成功',
          failed: '失敗'
        }
      },
      noDeployment: 'このエージェントには重みが 0 より大きい有効なデプロイメントがないため、呼び出しは拒否されます。デプロイメントタブで追加するか、重みを上げてください。',
      title: '呼び出し',
      subtitle: 'エージェントにメッセージを送り、実行の記録をリアルタイムで確認します。',
      request: 'リクエスト',
      agent: 'エージェント',
      deployment: 'デプロイメント',
      weighted: '有効な任意のデプロイメント (重み付け)',
      default: 'デプロイメントの既定値',
      message: 'メッセージ',
      messagePlaceholder: 'エージェントに何をさせますか?',
      shortcut: 'Ctrl+Enter または Cmd+Enter で送信します。',
      send: '送信',
      sending: '送信中...',
      openRun: '実行を開く',
      idleTitle: '実行はまだありません',
      idleBody: 'メッセージを送ると実行が始まり、記録がここに表示されます。',
      noAgentsTitle: '呼び出せるエージェントがありません',
      noAgentsBody: 'エージェントとデプロイメントを作成するか、サンプルマニフェストを適用してください。',
      applySample: 'マニフェストへ移動',
      stopOnLeave: 'ページを離れたら実行を停止',
      cancel: '実行をキャンセル',
      cancelling: 'キャンセル中...',
      timeLimit: '制限時間',
      timeLimitPlaceholder: 'デプロイメントの既定値',
      timeLimitClear: '既定値を使う',
      timeLimitRange: '許可範囲: {{min}} から {{max}}。',
      timeLimitAny: 'タイムアウトまでに実行が使える秒数。',
      timeLimitCap: 'クラスターはすべての実行を {{max}} で停止します。',
      timeLimitErrors: {
        notInteger: '秒数を整数で入力してください。',
        range: '{{min}} から {{max}} の制限時間を入力してください。',
        aboveCap: 'クラスターが許可するのは 1 実行あたり最大 {{max}} です。'
      },
      timeUnits: {
        seconds: '{{value}} 秒',
        minutes: '{{value}} 分',
        hours: '{{value}} 時間',
        secondsWord: '秒'
      },
      conversation: {
        mode: '会話',
        modes: {
          none: '単発の実行 (会話なし)',
          start: '新しい会話を開始',
          continue: '会話を続ける'
        },
        pick: '続ける会話',
        choose: '会話を選択',
        option: '{{title}} (ターン数: {{turns}})',
        pinned: 'すべてのターンは会話の最初のターンのデプロイメントで実行されるため、ここではデプロイメントを選べません。',
        busy: 'この会話は前のターンをまだ処理しています。その実行が終わるまで、新しいメッセージは拒否されます。',
        open: '会話を開く (ターン {{turn}})'
      }
    },
    runDetail: {
      awaitingApproval_one: 'この実行は {{count}} 件のツール呼び出しを人が承認するのを待っています。',
      awaitingApproval_other: 'この実行は {{count}} 件のツール呼び出しを人が承認するのを待っています。',
      reviewApprovals: '確認する',
      approvals_one: '承認 ({{count}})',
      approvals_other: '承認 ({{count}})',
      noApprovals: 'この実行は承認を要求していません。',
      openApproval: '承認を開く',
      viewTrace: 'トレースを表示',
      viewLogs: 'ログを表示',
      traceId: 'トレース ID',
      deploymentDeleted: 'この実行が使ったデプロイメントは削除されたため、再試行できません。代わりにエージェント {{agent}} をもう一度呼び出してください。',
      templatesUsed: '使用したテンプレート',
      agentDeleted: 'エージェント {{agent}} はもう存在しないため、この実行は再試行できません。レコード、トランスクリプト、テレメトリは引き続きここで確認できます。',
      title: '実行',
      titleWithAgent: '{{agent}} の実行',
      deployment: 'デプロイメント',
      model: '使用モデル',
      tokensLabel: 'トークン',
      tokens: '入力 {{input}}、出力 {{output}}',
      estimated: '推定',
      caller: '呼び出し元',
      parent: '親の実行',
      attempt: '試行',
      outputSchema: '出力スキーマ',
      outputSchemaStates: {
        valid: '有効',
        validAfterRepair: '1 回の修復後に有効',
        invalid: '無効',
        invalidAfterRepair: '1 回の修復後も無効'
      },
      started: '開始',
      completed: '完了',
      exitCode: '終了コード',
      transcript: '記録',
      result: '結果',
      input: '入力',
      stderr: '標準エラー',
      children_one: '子の実行 ({{count}})',
      children_other: '子の実行 ({{count}})',
      eventFilter: '表示',
      eventCount_one: 'イベント {{count}} 件',
      eventCount_other: 'イベント {{count}} 件',
      noEvents: 'イベントはまだありません。ハーネスが出力すると表示されます。',
      failed: '失敗',
      noResult: 'この実行は結果テキストを出力しませんでした。',
      pending: '実行が完了すると結果が表示されます。',
      structuredOutput: '構造化出力',
      templateVersions: '使用したプロンプトテンプレートのバージョン',
      noStderr: '標準エラーは記録されていません。',
      noChildren: 'この実行は他のエージェントに委任していません。',
      confirmCancel: 'この実行をキャンセルしますか? ノード上のハーネスプロセスが停止されます。',
      notFoundTitle: '実行が見つかりません',
      notFoundBody: '削除されたか、別のテナントに属している可能性があります。',
      telemetry: {
        approvalNote: 'この実行は承認の決定を {{wait}} 待ちました。実行時間にはこの待機が含まれます。',
        delegationNote: 'この実行は委任先の実行を {{wait}} 待ちました。最初のトークンまでの時間は、この待機を含めると {{ttft}}、除くと {{excluding}} です。委任しないエージェントと比べるには後者を使ってください。',
        title: 'テレメトリー',
        phases: 'フェーズ別の実行時間',
        phase: { delegation: '委任先の実行を待機', queue: 'キュー待ち', startup: '起動から最初のトークンまで', streaming: 'ストリーミング', tail: '最後のトークン以降' },
        fields: {
          approvalWaitMs: '承認待ち時間',
          delegationWaitMs: '委任の待機時間',
          timeToFirstTokenExcludingDelegationMs: '委任を除いた最初のトークンまでの時間',
          timeToFirstTokenMs: '最初のトークンまでの時間',
          streamingMs: 'ストリーミング時間',
          executionMs: '実行時間',
          queueMs: 'キュー待ち時間',
          totalMs: '合計時間',
          outputTokensPerSecond: '1 秒あたりの出力トークン数',
          inputTokens: '入力トークン',
          outputTokens: '出力トークン',
          cachedTokens: 'キャッシュ済みトークン',
          reasoningTokens: '推論トークン',
          toolCallCount: 'ツール呼び出し',
          costUsd: 'コスト',
          firstTokenUtc: '最初のトークンの日時',
          lastTokenUtc: '最後のトークンの日時'
        }
      },
      conversation: '会話',
      conversationSession: 'セッション',
      resumeSessionId: '再開したセッション',
      affinityNode: 'アフィニティノード',
      affinityUntil: '{{time}} まで'
    },
    queue: {
      title: 'キュー',
      subtitle: 'エージェントとハーネスごとの、待機中、割り当て済み、実行中の作業です。',
      queued: 'キュー待ち',
      leased: '割り当て済み',
      running: '実行中',
      emptyTitle: '待機中の作業はありません',
      emptyBody: 'ワーカーノードを待っている実行がここに表示されます。'
    },
    agentDetail: {
      invoke: '呼び出し',
      grafana: 'Grafana で開く',
      noActiveDeployment: 'このエージェントには有効なデプロイメントがないため、呼び出しは拒否されます。',
      deployments_one: 'デプロイメント ({{count}})',
      deployments_other: 'デプロイメント ({{count}})',
      recentRuns: '最近の実行',
      card: 'A2A カード',
      traffic: 'トラフィック比率',
      noDeploymentsTitle: 'デプロイメントはありません',
      noDeploymentsBody: 'このエージェントをハーネスに結び付けるデプロイメントを作成してください。',
      noRuns: 'このエージェントはまだ実行されていません。',
      selectionNote: 'デプロイメントを明示的に指定しない呼び出しは、有効なデプロイメントの 1 つに送られます。どのデプロイメントになるかは、重みに比例してランダムに選ばれます。',
      manageDeployments: 'デプロイメントを管理',
      conversations: '会話'
    },
    templateEditor: {
      cloneToEdit: '複製して編集',
      builtInReadOnly: '組み込みテンプレートは読み取り専用のため、ここのフィールドはすべてロックされています。編集可能なコピーを作るには複製してください。',
      renameHint: 'このテンプレートの名前は変更できます。デプロイメントは ID で参照するため結び付けは保たれますが、名前でこのテンプレートをインクルードしているテンプレートは手動で更新する必要があります。',
      cloneDialog: { taken: '{{name}} という名前のテンプレートはすでに存在します。別の名前を選んでください。', reserved: 'builtin/ で始まる名前は組み込みテンプレート用に予約されています。', hint: 'コピーの名前は、あとでそのページで変更できます。', name: 'コピーの名前', body: 'コピーは現在の内容をバージョン 1 として開始し、編集、名前の変更、削除ができます。', title: '{{name}} を複製' },
      newTitle: '新しいプロンプトテンプレート',
      subtitle: 'テンプレートを書き、サンプルコンテキストでプレビューして保存します。',
      builtInNote: '組み込みテンプレートは読み取り専用です。カスタマイズするには複製し、出荷時の内容に戻すにはリセットしてください。',
      content: '内容',
      changeNote: '変更メモ',
      syntaxHint: '構文: {{variable}}、{{value | default: "x"}}、{{#if x}}...{{else}}...{{/if}}、{{#each list}}...{{/each}}、{{> template-name}}。',
      variables: '使用している変数',
      noVariables: '変数は参照されていません。',
      preview: 'ライブプレビュー',
      sampleContext: 'サンプルコンテキスト (JSON)',
      rendered: 'レンダリング結果',
      previewEmpty: 'レンダリングされたテキストがここに表示されます。',
      missing: '不足している変数: {{list}}',
      versions_one: 'バージョン ({{count}})',
      versions_other: 'バージョン ({{count}})',
      noVersions: '保存されたバージョンはまだありません。',
      version: 'バージョン',
      note: 'メモ',
      author: '作成者',
      diff: '差分',
      restore: '復元',
      diffTitle: 'バージョン {{version}} とエディターの比較',
      current: 'エディター',
      reset: '既定に戻す',
      savedVersion: '新しいバージョンを保存しました。',
      restored: 'バージョン {{version}} を復元しました。',
      resetDone: '出荷時の内容に戻しました。',
      confirm: {
        restoreTitle: 'バージョンを復元',
        restoreMessage: 'バージョン {{version}} を復元しますか? 現在の内容は履歴に残ります。',
        resetTitle: 'テンプレートをリセット',
        resetMessage: '「{{name}}」を出荷時の内容に戻しますか?',
        deleteTitle: 'テンプレートを削除',
        deleteMessage: '「{{name}}」を削除しますか? これを使うデプロイメントはコンパイルできなくなります。'
      }
    },
    manifests: {
      warnings_one: '警告 {{count}} 件',
      warnings_other: '警告 {{count}} 件',
      planned: '予定: {{result}}',
      changes: { count_other: '{{count}} 個のフィールドが変わります。', count_one: '{{count}} 個のフィールドが変わります。', empty: '(空)', after: '変更後', before: '変更前', field: 'フィールド' },
      title: 'マニフェスト',
      subtitle: '構成をコードとして適用します。ドライランは書き込まずに検証します。',
      applyTab: '適用',
      exportTab: 'エクスポート',
      historyTab: '履歴',
      upload: 'ファイルをアップロード',
      loadSample: 'サンプルを読み込む',
      document: 'マニフェスト (YAML または JSON、複数ドキュメント可)',
      dryRun: 'ドライラン',
      apply: '適用',
      validated: '検証が完了しました。',
      applied: 'マニフェストを適用しました。',
      results: '結果',
      dryRunResults: 'ドライランの結果',
      kind: '種類',
      name: '名前',
      result: '結果',
      message: 'メッセージ',
      confirmTitle: 'マニフェストを適用',
      confirmMessage: 'このマニフェストのすべてのドキュメントを現在のテナントに適用しますか?',
      exportHelp: 'このテナントの構成をエクスポートします。シークレットの値はエクスポートされません。',
      export: 'エクスポート',
      download: 'ダウンロード',
      counts: '作成 {{created}}、更新 {{updated}}、変更なし {{unchanged}}、失敗 {{failed}}'
    },
    requests: {
      grafana: 'Grafana の HTTP ダッシュボード',
      title: 'リクエスト履歴',
      subtitle: '記録された API トラフィックです。各リクエストを詳しく調べ、保持期間を管理できます。',
      kpis: { total: '保持中のリクエスト', success: '成功', failure: '失敗', avgDuration: '平均所要時間' },
      columns: { time: '日時', method: 'メソッド', path: 'パス', status: 'ステータス', duration: '所要時間', principal: 'プリンシパル' },
      bulkDeleteTitle: 'リクエスト履歴を削除',
      bulkDeleteMessage: '現在のフィルターに一致する {{count}} 件のリクエストをすべて削除しますか?',
      bulkDeleteAll: '一致するものをすべて削除',
      deleteOneTitle: 'リクエストを削除',
      deleteOneMessage: 'リクエスト {{id}} を削除しますか?',
      deleted: '削除しました。',
      emptyTitle: 'リクエスト履歴はありません',
      emptyBodyNoTraffic: 'まだ API トラフィックは記録されていません。',
      emptyBodyNoMatch: '現在のフィルターに一致するリクエストはありません。'
    },
    explorer: {
      title: 'API エクスプローラー',
      subtitle: 'OpenAPI ドキュメントに基づいて、このサーバーに対して API をその場で実行します。',
      operations: '操作',
      selectOperation: 'リクエストを作成するには操作を選択してください。',
      selectOperationOption: '操作を選択...',
      pathParams: 'パスパラメーター',
      queryParams: 'クエリパラメーター',
      headers: 'ヘッダー',
      headerName: 'ヘッダー名',
      headerValue: 'ヘッダー {{name}} の値',
      removeHeader: 'ヘッダー {{name}} を削除',
      addHeader: 'ヘッダーを追加',
      body: 'リクエスト本文',
      resolvedUrl: '解決された URL',
      copyUrl: 'URL をコピー',
      execute: '実行',
      executing: '実行中...',
      stop: '停止',
      streaming: 'ストリーミング中',
      response: 'レスポンス',
      responseHeaders: 'レスポンスヘッダー',
      responseBody: 'レスポンス本文',
      snippets: 'コードスニペット',
      history: '最近のリクエスト',
      historyEmpty: '最近のリクエストはありません。',
      loadHistory: '読み込み',
      deleteHistory: '削除',
      clearHistory: '履歴をクリア',
      required: '必須',
      confirmTitle: '破壊的な操作を実行',
      confirmMessage: 'この {{method}} リクエストはデータを変更または削除する可能性があります。続行しますか?',
      noSpecTitle: 'OpenAPI ドキュメントを利用できません',
      noSpecBody: 'このサーバーが利用可能な /openapi.json を返さなかったため、操作を一覧表示できません。'
    },
    settings: {
      errors: { allowed: '次のいずれかを選んでください: {{values}}。', boolean: 'true または false を選んでください。', max: '{{max}} 以下の値を入力してください。', min: '{{min}} 以上の値を入力してください。', range: '{{min}} から {{max}} までの値を入力してください。', integer: '整数を入力してください。', number: '数値を入力してください。' },
      notSaved: '何も保存されていません。強調表示された設定を修正してから、もう一度保存してください。',
      title: '設定',
      subtitle: '設定ファイルのサーバー設定と、データベースに保存されたクラスター設定です。',
      readOnly: '設定を読み取り専用で表示しています。変更できるのはシステム管理者のみです。',
      restartBanner: '保存した変更の一部は再起動後に反映されます。',
      restarting: 'サーバーを再起動しています。このページは自動的に再接続します。',
      restarted: 'サーバーがオンラインに戻りました。',
      restartTimeout: '3 分以内にサーバーが戻りませんでした。Pod の状態を確認してください。',
      restart: 'サーバーを再起動',
      restartConfirmTitle: 'サーバーを再起動',
      restartConfirmMessage: 'このコントロールプレーンノードを今すぐ再起動しますか? 処理中のリクエストを完了させてから停止し、コンソールは再接続します。',
      savedLive: '設定を保存して反映しました。',
      savedRestart: '設定を保存しました。すべての変更を反映するにはサーバーを再起動してください。',
      live: '即時反映',
      restartRequired: '再起動が必要',
      secretSet: '設定済み (置き換えるには新しい値を入力)',
      secretNotSet: '未設定',
      invalidNumber: '数値を入力してください。',
      range: '許容範囲 {{min}} から {{max}}',
      testDatabase: 'データベース接続をテスト',
      testing: 'テスト中...',
      dbOk: '接続に成功しました',
      dbFailed: '接続に失敗しました',
      unavailableTitle: '設定を利用できません',
      unavailableBody: 'このサーバーは設定を返しませんでした。',
      sources: { File: '設定ファイル', Environment: '環境変数', ConfigMap: 'ConfigMap', Database: 'クラスター' },
      lockedBy: {
        Environment: '環境変数で設定されています。環境変数の値が優先されます。',
        ConfigMap: 'Kubernetes の ConfigMap で管理されています。マニフェストで変更してください。',
        other: 'この設定はここでは編集できません。'
      },
      groups: { Codex: 'Codex', Archive: 'アーカイブ', General: '全般', Rest: 'REST', Mcp: 'MCP', Database: 'データベース', Logging: 'ログ', Auth: '認証', Security: 'セキュリティ', RequestHistory: 'リクエスト履歴', Telemetry: 'テレメトリー', Cluster: 'クラスター', Scheduling: 'スケジューリング', Runs: '実行', Audit: '監査', Runtime: 'ランタイム', Observability: 'オブザーバビリティ' },
      fields: {
        Observability: {
          GrafanaUrl: 'Grafana の URL',
          PrometheusUrl: 'Prometheus の URL',
          LokiUrl: 'Loki の URL',
          TempoUrl: 'Tempo の URL',
          GrafanaInternalUrl: 'Grafana の内部 URL',
          PrometheusInternalUrl: 'Prometheus の内部 URL',
          LokiInternalUrl: 'Loki の内部 URL',
          TempoInternalUrl: 'Tempo の内部 URL'
        },
        Rest: {
          ExternalBaseUrl: '外部 REST URL',
          PublicBaseUrl: '実行用の内部 REST URL',
          Ssl: 'REST の TLS',
          Port: 'REST ポート',
          Hostname: 'REST のバインドホスト名'
        },
        Mcp: {
          InternalPort: '内部 MCP ポート',
          SessionIdleTimeoutSeconds: 'MCP セッションのアイドルタイムアウト (秒)',
          MaxToolWaitSeconds: 'MCP ツールの最大待機時間 (秒)',
          PublicUrl: '実行用の内部 MCP URL',
          Path: 'MCP パス',
          Port: 'MCP ポート',
          Hostname: 'MCP のバインドホスト名',
          Enable: 'MCP サーバーを有効化'
        },
        Database: {
          MinPoolSize: 'プール接続の最小数',
          ConnectionTimeoutSeconds: '接続待ちタイムアウト (秒)',
          CommandTimeoutSeconds: 'コマンドタイムアウト (秒)',
          ConnectionIdleLifetimeSeconds: 'アイドル接続の保持時間 (秒)',
          MaxPoolSize: '接続プールのサイズ',
          Schema: 'データベーススキーマ',
          Password: 'データベースのパスワード',
          Username: 'データベースユーザー',
          DatabaseName: 'データベース名',
          Port: 'データベースポート',
          Host: 'データベースホスト',
          Filename: 'Sqlite ファイル',
          Type: 'データベースの種類'
        },
        Logging: {
          MinimumSeverity: 'ログの最小重大度',
          LogFilename: 'ログファイル名',
          LogDirectory: 'ログディレクトリ',
          FileLogging: 'ファイルにログを出力',
          ConsoleLogging: 'コンソールにログを出力'
        },
        Auth: {
          RateLimitPerMinute: '1 分あたりのサインイン試行回数',
          PasswordHashIterations: 'パスワードハッシュの反復回数',
          SignedRequestSkewSeconds: '署名付きリクエストの許容時刻ずれ (秒)',
          AdminApiKey: '管理者 API キー',
          TokenLifetimeMinutes: 'セッションの有効期間 (分)',
          SigningKey: 'トークンの署名鍵',
          Issuer: 'トークンの発行者'
        },
        Security: {
          NodeSecretKey: 'ワーカーノードのシークレットキー',
          NodeAccessKey: 'ワーカーノードのアクセスキー',
          DefaultSecretKey: '既定のシークレットキー',
          DefaultAccessKey: '既定のアクセスキー',
          AdminPassword: '初期管理者のパスワード',
          AdminEmail: '初期管理者のメールアドレス',
          MasterKey: 'シークレット暗号化のマスターキー'
        },
        RequestHistory: {
          CaptureNodeProtocol: '成功したワーカープロトコル要求を記録',
          MaxResponseBodyBytes: '記録するレスポンス本文の上限 (バイト)',
          MaxRequestBodyBytes: '記録するリクエスト本文の上限 (バイト)',
          RetentionDays: 'リクエスト履歴の保持期間 (日)',
          Enabled: 'リクエスト履歴を記録'
        },
        Telemetry: {
          OtlpEndpoint: 'OTLP エンドポイント',
          OtlpEnable: 'OTLP エクスポートを有効化',
          PrometheusPort: 'Prometheus ポート',
          PrometheusEnable: 'Prometheus エンドポイントを有効化',
          ServiceName: 'テレメトリのサービス名',
          Enabled: 'テレメトリを有効化'
        },
        Archive: {
          Directory: 'アーカイブディレクトリ'
        },
        Cluster: {
          Backplane: 'イベントバックプレーン',
          BackplanePollMs: 'バックプレーンのポーリング間隔 (ms)',
          ExpectedReplicas: 'コントロールプレーンの想定レプリカ数'
        },
        Scheduling: {
          EventPollMs: 'イベントのポーリング間隔 (ms)',
          InvocationWaitPollMs: '呼び出し待機の予備再読み込み間隔 (ms)',
          NodeHeartbeatTimeoutMs: 'ノードのハートビートタイムアウト (ms)',
          LeaseWaitMs: 'リースのロングポーリング待機時間 (ms)',
          LeaseDurationMs: '実行リースの期間 (ms)',
          PauseGraceMs: 'ホスト一時停止後の猶予 (ms)'
        },
        Runs: {
          EventRetentionDays: '実行イベントの保持期間 (日)',
          RetentionDays: '実行の保持期間 (日)',
          MaxDelegationDepth: '委任の最大深さ',
          DelegationChildQueueDepth: '待機中の実行の子をキューに置ける最大数',
          DelegationRetryAfterSeconds: '委任容量不足時の再試行目安 (秒)',
          DefaultTimeoutSeconds: '実行の既定タイムアウト (秒)'
        },
        Codex: {
          RefreshBeforeExpirySeconds: '有効期限前に Codex ログインを更新 (秒)',
          RefreshCheckIntervalSeconds: 'バックグラウンド確認の間隔 (秒)',
          RefreshTimeoutSeconds: 'ログイン更新のタイムアウト (秒)',
          TokenEndpoint: 'OAuth トークンエンドポイント',
          ClientId: 'OAuth クライアント ID'
        },
        Runtime: {
          FailBlockedAfterSeconds: 'ブロックされた実行を失敗にするまでの時間 (秒)',
          MaxRunSeconds: '最大実行時間 (秒)',
          RepetitionGuard: '繰り返しガードの既定値',
          MaxAssistantChars: '最大アシスタント文字数の既定値',
          NoProgressSeconds: '進行なしタイムアウトの既定値 (秒)',
          ConversationAffinityWaitMs: '会話のアフィニティ待機時間 (ms)',
          ConversationTranscriptTurns: 'フォールバック時の履歴ターン数',
          ConversationTranscriptChars: 'フォールバック時の履歴の 1 メッセージあたりの文字数'
        },
        Audit: {
          RetentionDays: '監査の保持期間 (日)'
        }
      }
    },
    analytics: {
      grafana: 'Grafana の実行ダッシュボード',
      deletedAgent: '削除済みのエージェント ({{id}})',
      deletedDeployment: '削除済みのデプロイメント ({{id}})',
      title: '分析',
      subtitle: '実行の速度、コスト、信頼性の推移です。',
      loading: '分析を読み込み中...',
      filters: { ttft: 'TTFT から委任の待機時間を除く', range: '期間', from: '開始', to: '終了', agentId: 'エージェント', harnessType: 'ハーネス', deploymentId: 'デプロイメント', model: 'モデル', groupBy: 'グループ化' },
      allAgents: 'すべてのエージェント',
      allHarnesses: 'すべてのハーネス',
      allDeployments: 'すべてのデプロイメント',
      allModels: 'すべてのモデル',
      unknownModel: '不明なモデル',
      groupBy: { none: 'グループ化なし', agent: 'エージェント', harness: 'ハーネス', model: 'モデル', harnessModel: 'ハーネスとモデル' },
      export: { window: '期間: {{from}} から {{to}}' },
      usage: {
        title: 'ハーネスとモデル別の使用量',
        help: '期間内のハーネスとモデルの組み合わせごとのトークンとコストの推移と、内訳の表です。'
      },
      breakdown: {
        title: 'ハーネスとモデル別の内訳',
        columns: { harness: 'ハーネス', model: 'モデル', runs: '実行', inputTokens: '入力トークン', outputTokens: '出力トークン', cachedTokens: 'キャッシュ済みトークン', reasoningTokens: '推論トークン', costUsd: 'コスト', timeToFirstTokenMsAvg: '平均 TTFT' }
      },
      rangeError: {
        incomplete: 'カスタム期間の開始日時と終了日時の両方を選択してください。',
        reversed: 'カスタム期間の開始は終了より前である必要があります。'
      },
      truncated: 'この期間の実行数が、サーバーが 1 回のリクエストで集計できる数を超えているため、数値は期間の一部のみを反映しています。正確な数値を得るには、期間を狭めるかフィルターを追加してください。',
      unavailableTitle: 'このサーバーではまだ分析を利用できません',
      unavailableBody: 'このサーバーは実行分析のエンドポイントを公開していません。ここにグラフを表示するにはサーバーを更新してください。',
      emptyTitle: 'この期間の実行はありません',
      emptyBody: '期間とフィルターに一致するものはありません。期間を広げるか、フィルターを解除するか、エージェントを呼び出してください。',
      noDataInChart: '選択した期間には、このグラフのデータはありません。',
      cards: {
        delegationWait: '委任の平均待機時間',
        ttftExcludingDelegation: '委任を除いた平均 TTFT',
        runs: '実行',
        runsNote: '成功 {{succeeded}}、失敗 {{failed}}',
        successRate: '成功率',
        ttft: '最初のトークンまでの平均時間',
        execution: '平均実行時間',
        queue: '平均キュー待ち時間',
        tokens: 'トークン',
        tokensNote: '入力 {{input}}、出力 {{output}}',
        throughput: '平均出力速度',
        cost: 'コスト',
        toolCalls: 'ツール呼び出し',
        p95: 'p95 {{value}}'
      },
      charts: {
        outcomes: { title: '実行の結果', help: '区間ごとの実行数を終了の仕方別に示します。' },
        ttft: { helpExcluding: 'ハーネスの起動から最初のモデル出力までの時間です。委任先の実行を待った時間は含みません。', title: '最初のトークンまでの時間', help: 'ハーネスの起動から最初のモデル出力までの時間です。CLI の起動時間を含みます。' },
        duration: { title: 'ストリーミング時間と実行時間', help: 'ストリーミングはモデルの最初の出力から最後の出力まで、実行はプロセスの起動から終了までです。' },
        queue: { title: 'キュー待ち時間', help: 'キューに入ってからワーカーノードにリースされるまでの時間です。' },
        tokens: { title: 'トークン', help: '区間ごとの入力、出力、キャッシュ済み、推論トークンです。' },
        throughput: { title: '1 秒あたりの出力トークン数', help: '出力トークン数をストリーミング時間で割り、区間ごとに平均した値です。' },
        cost: { title: 'コスト', help: '区間ごとに報告されたコスト (米ドル) です。' },
        toolCalls: { title: 'ツール呼び出し', help: '区間ごとのツール呼び出しイベントの数です。' },
        usageTokens: { title: 'ハーネスとモデル別のトークン', help: '区間ごとの入力トークンと出力トークンの合計を、ハーネスとモデル別に積み上げて表示します。' },
        usageCost: { title: 'ハーネスとモデル別のコスト', help: '区間ごとに報告されたコストを、ハーネスとモデル別に積み上げて表示します。' }
      },
      groupedTitle: '{{chart}}: {{metric}}',
      metrics: {
        delegationWaitMsAvg: '委任の待機時間 (平均)',
        timeToFirstTokenExcludingDelegationMsP95: '委任を除く (p95)',
        timeToFirstTokenExcludingDelegationMsP50: '委任を除く (p50)',
        timeToFirstTokenExcludingDelegationMsAvg: '委任を除く (平均)',
        runs: '実行',
        succeeded: '成功',
        failed: '失敗',
        cancelled: 'キャンセル済み',
        timedOut: 'タイムアウト',
        inputTokens: '入力',
        outputTokens: '出力',
        cachedTokens: 'キャッシュ済み',
        reasoningTokens: '推論',
        totalTokens: '入力と出力のトークン合計',
        costUsd: 'コスト',
        toolCalls: 'ツール呼び出し',
        timeToFirstTokenMsAvg: '平均',
        timeToFirstTokenMsP50: '中央値 (p50)',
        timeToFirstTokenMsP95: 'p95',
        streamingMsAvg: 'ストリーミング (平均)',
        executionMsAvg: '実行 (平均)',
        executionMsP95: '実行 (p95)',
        queueMsAvg: '平均キュー待ち時間',
        outputTokensPerSecondAvg: '1 秒あたりの平均トークン数'
      },
      other: 'その他',
      hiddenGroups_one: '利用の少ない {{count}} 個のグループは表示されていません。',
      hiddenGroups_other: '利用の少ない {{count}} 個のグループは表示されていません。',
      legend: '{{chart}} の系列',
      dataTable: 'データ表',
      bucketStart: '区間の開始'
    },
    serverInfo: {
      serverInUse: '使用中のサーバー',
      title: 'サーバー情報',
      subtitle: 'エンドポイント、バージョン、サインイン中の ID です。',
      endpoints: 'エンドポイント',
      rest: 'REST API',
      mcp: 'MCP',
      a2a: 'A2A',
      openapi: 'OpenAPI',
      server: 'サーバー',
      version: 'サーバーのバージョン',
      dashboardVersion: 'ダッシュボードのバージョン',
      node: 'コントロールノード',
      database: 'データベース',
      health: '状態',
      replicas: '想定レプリカ数',
      routes: '登録済みの操作',
      serverTime: 'サーバー時刻',
      principal: 'サインイン中の ID',
      principalName: 'プリンシパル',
      principalType: 'プリンシパル種別',
      role: 'ロール',
      tenant: 'テナント',
      expires: 'セッションの有効期限',
      features: '機能フラグ'
    },
    runGuard: {
      titles: {
        RepetitionDetected: '停止: モデルが同じ出力を繰り返していました',
        NoProgress: '停止: 実行が進まなくなりました',
        OutputLimitExceeded: '停止: 回答がサイズ上限に達しました'
      },
      bodies: {
        RepetitionDetected: '繰り返しガードが、同じ短いテキスト (または空白と句読点だけ) が何度も書かれるのを検出したため、Garrison は期限まで実行を続けさせずに停止しました。',
        NoProgress: '進行なしタイムアウトより長くテキスト、思考、ツールの動きがなかったため、Garrison は実行を停止しました。',
        OutputLimitExceeded: '回答が 1 実行あたりのアシスタント文字数の上限を超えたため、Garrison は実行を停止しました。'
      },
      detected: '検出内容: {{reason}}',
      partialKept: '停止までに書かれた出力 ({{chars}} 文字) は実行結果として保持されます。',
      noPartial: '実行は停止前に何も出力しませんでした。',
      tune: 'この動作を変えるには、デプロイメント {{deployment}} を編集してください。「配置と制限」ステップに繰り返しガード、最大アシスタント文字数、進行なしタイムアウトがあります。空のままにすると、設定 (ランタイム) のクラスター既定値に従います。',
      tuneAny: 'この動作を変えるには、デプロイメントを編集してください。「配置と制限」ステップに繰り返しガード、最大アシスタント文字数、進行なしタイムアウトがあります。空のままにすると、設定 (ランタイム) のクラスター既定値に従います。',
      openDeployments: 'デプロイメントを開く',
      openSettings: '設定を開く'
    },
    conversationDetail: {
      title: '会話',
      notFoundTitle: '会話が見つかりません',
      notFoundBody: '削除されたか、別のテナントに属している可能性があります。そのターンは実行ページに残ります。',
      deployment: 'デプロイメント',
      activeRun: '未完了のターン',
      turns: 'ターン',
      turnsCount: 'ターン ({{count}})',
      noTurns: 'この会話にはまだターンがありません。',
      pending: '結果を待っています',
      columns: {
        turn: 'ターン',
        run: '実行',
        status: 'ステータス',
        outcome: '結果',
        session: 'セッション',
        input: '入力',
        result: '応答',
        node: 'ノード',
        created: '作成日時'
      },
      session: {
        first: '新しいセッション',
        resumed: '再開',
        fallback: '新規セッション',
        pending: '未配置'
      },
      continueTitle: '会話を続ける',
      message: '次のメッセージ',
      messagePlaceholder: '追加の質問や次の指示を入力...',
      busyNotice: '前のターンがまだ処理中です。終わったら次のメッセージを送信できます。',
      send: 'ターンを送信',
      turnStarted: 'ターン {{turn}} を開始しました。',
      openInvoke: '呼び出しで続ける',
      confirmDelete: '会話「{{title}}」を削除しますか? ターンは通常の実行として実行ページに残りますが、新しいターンで続けることはできなくなります。'
    }
  },
  wizard: {
    title: 'Garrison のセットアップ',
    stepOf: '手順 {{step}} / {{total}}',
    steps: { welcome: 'ようこそ', secret: '認証情報', manifest: 'サンプルエージェント', invoke: 'テスト実行' },
    welcomeBody: 'このテナントにはまだエージェントがありません。いくつかの手順で次のことを行います。',
    welcomeItem1: 'Anthropic や OpenAI の API キーなど、ハーネスの認証情報を保存します (任意)。',
    welcomeItem2: '組み込みの擬似ハーネスを使うサンプルエージェントを適用します。認証情報なしで動作します。',
    welcomeItem3: '実行して記録を確認します。',
    start: '開始',
    skip: 'セットアップをスキップ',
    skipStep: 'この手順をスキップ',
    secretBody: '実際のエージェントで必要になる認証情報を追加します。スキップして後から追加することもできます。',
    saveSecret: '保存して続行',
    secretSaved: 'シークレットを保存しました。',
    manifestBody: 'このマニフェストは、擬似ハーネスを使うエコーエージェントとデプロイメントを作成します。',
    invokeBody: 'エコーエージェントにメッセージを送ります。実行中の画面に移動します。',
    invoke: '実行',
    noAgent: 'サンプルエージェントが見つかりません。先にマニフェストを適用してください。'
  },
  tour: {
    title: 'ガイドツアー',
    skip: 'ツアーをスキップ',
    done: '完了',
    steps: {
      sidebar: { title: 'ナビゲーション', body: 'ページはハブにまとめられています。各ハブの上部にタブがあり、タブごとに固有のリンクがあります。' },
      topbar: { title: 'コンテキスト', body: 'サーバー、テナント、ID、状態、ライブ状況は常にここに表示されます。' },
      kpis: { title: '概要', body: '各カードはリソースの要約です。クリックするとフィルター済みの一覧が開きます。' },
      invoke: { title: '呼び出し', body: '任意のエージェントを対話的に試し、記録をリアルタイムで確認できます。' },
      configure: { title: '構成', body: 'ハーネスプロファイル、プロンプトテンプレート、MCP サーバー、シークレットが実行内容を決めます。エージェントとデプロイメントには専用のハブがあります。' },
      observe: { title: '監視', body: 'リクエスト履歴、監査、API エクスプローラーで確認とデバッグを行えます。' }
    }
  },
  tips,
  explainers
};


// Executor capability negotiation (P11.18).
Object.assign(ja.resources.deployments.fields, {"capIsolation": "最小分離レベル", "capColdStartClass": "起動クラス", "capEgressControl": "送信通信の制御を要求", "capFilesystemSnapshot": "ファイルシステムのスナップショットを要求", "capSessionContinuation": "セッションの継続を要求", "capCrossNodeRestore": "別ノードでの復元を要求"});
Object.assign(ja.tips.resources.deployments, {"capIsolation": "実行は必要な機能を持つワーカーを待ちます。コンテナー分離には KubernetesJob を選択してください。利用できない機能を要求すると待機状態になります。", "capColdStartClass": "実行は必要な機能を持つワーカーを待ちます。コンテナー分離には KubernetesJob を選択してください。利用できない機能を要求すると待機状態になります。", "capEgressControl": "実行は必要な機能を持つワーカーを待ちます。コンテナー分離には KubernetesJob を選択してください。利用できない機能を要求すると待機状態になります。", "capFilesystemSnapshot": "実行は必要な機能を持つワーカーを待ちます。コンテナー分離には KubernetesJob を選択してください。利用できない機能を要求すると待機状態になります。", "capSessionContinuation": "実行は必要な機能を持つワーカーを待ちます。コンテナー分離には KubernetesJob を選択してください。利用できない機能を要求すると待機状態になります。", "capCrossNodeRestore": "実行は必要な機能を持つワーカーを待ちます。コンテナー分離には KubernetesJob を選択してください。利用できない機能を要求すると待機状態になります。"});
ja.resources.deployments.hints.capabilities = "実行は必要な機能を持つワーカーを待ちます。コンテナー分離には KubernetesJob を選択してください。利用できない機能を要求すると待機状態になります。";
ja.resources.nodes.columns.executorCapabilities = "実行機能";
ja.tips.resources.nodes.executorCapabilities = "実行は必要な機能を持つワーカーを待ちます。コンテナー分離には KubernetesJob を選択してください。利用できない機能を要求すると待機状態になります。";
ja.enums.executorIsolation = {"Process": "プロセス", "Container": "コンテナー", "SandboxedRuntime": "サンドボックス実行環境"};
ja.enums.executorColdStart = {"Immediate": "即時", "Cold": "コールド", "Warm": "ウォーム"};
// Artifact collection and browsing (P12.8).
ja.nav.items.artifacts = { label: "成果物", tip: "実行から収集したファイル。" };
ja.resources.artifacts = { ...ja.resources.artifactStores, title: "成果物", subtitle: "実行から収集したファイル。", view: "成果物", deleteTitle: "成果物", emptyTitle: "成果物", emptyBody: "ストアと明示的なデプロイメントのパターンを設定して収集します。", columns: {"name": "名前", "runId": "実行", "artifactStoreId": "ストア", "mediaType": "メディアタイプ", "sizeBytes": "バイト数", "sha256": "SHA-256 ハッシュ", "createdUtc": "作成日時", "id": "ID", "leaseEpoch": "リース世代", "repairAttempt": "修復試行"}, fields: {"name": "名前", "runId": "実行", "artifactStoreId": "ストア", "mediaType": "メディアタイプ", "sizeBytes": "バイト数", "sha256": "SHA-256 ハッシュ", "createdUtc": "作成日時", "id": "ID", "leaseEpoch": "リース世代", "repairAttempt": "修復試行"}, actions: { download: "ダウンロード" } };
ja.tips.resources.artifacts = { ...{"name": "実行から収集したファイル。 名前", "runId": "実行から収集したファイル。 実行", "artifactStoreId": "実行から収集したファイル。 ストア", "mediaType": "実行から収集したファイル。 メディアタイプ", "sizeBytes": "実行から収集したファイル。 バイト数", "sha256": "実行から収集したファイル。 SHA-256", "createdUtc": "実行から収集したファイル。 作成日時", "id": "実行から収集したファイル。 ID", "leaseEpoch": "実行から収集したファイル。 リース世代", "repairAttempt": "実行から収集したファイル。 修復試行"}, actions: { download: "一時リンクでこのファイルをダウンロードします。" }, filters: { runId: "実行", storeId: "ストア" } };
Object.assign(ja.resources.artifactStores.fields, {"pathPrefix": "パスの接頭辞", "bucket": "バケット", "endpoint": "エンドポイント", "region": "リージョン", "secretId": "認証情報", "forcePathStyle": "パス形式のリクエスト"});
Object.assign(ja.tips.resources.artifactStores, {"pathPrefix": "S3 エンドポイントは省略すると AWS を使用します。GenericEnv シークレットに accessKey、secretKey、任意の sessionToken を含む JSON を保存します。未指定の場合はサーバーの認証情報を使用します。", "bucket": "S3 エンドポイントは省略すると AWS を使用します。GenericEnv シークレットに accessKey、secretKey、任意の sessionToken を含む JSON を保存します。未指定の場合はサーバーの認証情報を使用します。", "endpoint": "S3 エンドポイントは省略すると AWS を使用します。GenericEnv シークレットに accessKey、secretKey、任意の sessionToken を含む JSON を保存します。未指定の場合はサーバーの認証情報を使用します。", "region": "S3 エンドポイントは省略すると AWS を使用します。GenericEnv シークレットに accessKey、secretKey、任意の sessionToken を含む JSON を保存します。未指定の場合はサーバーの認証情報を使用します。", "secretId": "S3 エンドポイントは省略すると AWS を使用します。GenericEnv シークレットに accessKey、secretKey、任意の sessionToken を含む JSON を保存します。未指定の場合はサーバーの認証情報を使用します。", "forcePathStyle": "S3 エンドポイントは省略すると AWS を使用します。GenericEnv シークレットに accessKey、secretKey、任意の sessionToken を含む JSON を保存します。未指定の場合はサーバーの認証情報を使用します。"});
ja.resources.deployments.fields.artifactGlobs = "収集パターン";
ja.tips.resources.deployments.artifactGlobs = "reports/**/*.json などに一致するワークスペースの相対ファイルのみ収集します。空の場合は無効です。";
ja.resources.deployments.hints.artifactGlobs = "reports/**/*.json などに一致するワークスペースの相対ファイルのみ収集します。空の場合は無効です。";
Object.assign(ja.common.eventCodes, { ArtifactCollectionWarning: "成果物収集の警告", ArtifactsCollected: "成果物を収集しました" });
ja.tips.nav.tabs.artifacts = ja.nav.items.artifacts.tip + " " + ja.tips.resources.artifacts.actions.download;
Object.assign(ja.components.mcpTest, {"worker": "ワーカーノード", "chooseWorker": "準備完了のワーカーを選択します。設定済みコマンドでツールを一覧表示します。ツールは実行しません。", "runTest": "テストを実行"});
export default ja;

ja.views.settings.groups.Leases = "協調リース";
ja.views.settings.fields.Leases = {"Provider": "プロバイダー", "ClutchEndpoint": "Clutch エンドポイント", "ClutchAccessKey": "Clutch アクセスキー", "KeyPrefix": "キープレフィックス", "RequestTimeoutMs": "要求タイムアウト (ms)", "SweepIntervalMs": "確認間隔 (ms)", "MaxLeaseMs": "最大リース (ms)", "MaxHoldMs": "最大保持時間 (ms)"};

ja.enums.harnessType.ProviderApi = "プロバイダー API";
ja.enums.outputParser.ProviderApiJsonl = "プロバイダー API JSONL";
ja.enums.harnessType.OpenCode = "opencode";
ja.enums.harnessType.Pi = "pi";
ja.enums.outputParser.OpenCodeJsonl = "opencode JSONL";
ja.enums.outputParser.PiJsonl = "pi JSONL";
ja.enums.mcpConfigFormat.OpenCodeJson = "opencode JSON";
ja.enums.mcpConfigFormat.PiJson = "pi JSON";

// Pipelines (P12.9): definitions (Agents > Pipelines), pipeline runs (Runs > Pipeline runs), and stage reviews
// (Approvals > Stage reviews).
ja.nav.hubs.approvals.tip = '人を待っているツール呼び出しとパイプラインのステージ、およびすべての決定';
Object.assign(ja.nav, { approvalsPending_other: '{{count}} 件が人の対応待ち' });
Object.assign(ja.nav.items, {
  pipelines: { label: 'パイプライン', tip: '順序付けされたエージェントのステージと任意のレビューゲート' },
  pipelineRuns: { label: 'パイプライン実行', tip: 'パイプラインの実行をステージごとに確認' },
  pipelineReviews: { label: 'ステージレビュー', tip: '人によるレビューを待っているパイプラインのステージ' }
});
Object.assign(ja.errorCodes, {
  RevisionLimitReached: 'このステージはすでに修正回数をすべて使い切ったため、これ以上変更を依頼できません。代わりに承認または却下してください。',
  ReviewNotPending: 'このレビューは他の人またはタイムアウトによってすでに決定されているため、再度決定することはできません。',
  PipelineInUse: 'このパイプラインには未完了のパイプライン実行があります。完了を待つかキャンセルしてから、パイプラインを削除してください。',
  PipelineRunActive: '削除できるのは完了したパイプライン実行のみです。先にこのパイプライン実行をキャンセルしてください。',
  PipelineRunFinished: 'このパイプライン実行はすでに完了しているため、キャンセルできません。',
  PipelineRunNotRetryable: '再試行できるのは、失敗、タイムアウト、またはキャンセルされたパイプライン実行のみです。',
  PipelineRunChanged: 'リクエストの処理中にこのパイプライン実行が変更されました。再読み込みしてからもう一度試してください。',
  PipelineInactive: 'このパイプラインは無効です。開始する前に有効にしてください。',
  PipelineEmpty: 'パイプラインには少なくとも 1 つのステージが必要です。',
  PipelineStageRun: 'この実行はパイプライン実行のステージであるため、単独では再試行できません。代わりにパイプライン実行を再試行してください。',
  ReferencedByPipeline: 'パイプラインのステージがこのエージェントを使用しています。削除する前に、すべてのパイプラインからこのエージェントを外してください。'
});
ja.enums.pipelineRunStatus = { Running: '実行中', AwaitingReview: 'レビュー待ち', Cancelling: 'キャンセル中', Succeeded: '成功', Failed: '失敗', Cancelled: 'キャンセル済み', TimedOut: 'タイムアウト' };
ja.enums.pipelineRunOutcome = { None: 'なし', Succeeded: '成功', StageFailed: 'ステージ失敗', StageStartFailed: 'ステージを開始できません', ReviewRejected: 'レビューで却下', ReviewExpired: 'レビューの期限切れ', Cancelled: 'キャンセル済み', TimedOut: 'タイムアウト', InternalError: '内部エラー' };
ja.enums.pipelineStageStatus = { Pending: '保留中', Running: '実行中', AwaitingReview: 'レビュー待ち', Succeeded: '成功', Failed: '失敗', Cancelled: 'キャンセル済み' };
ja.enums.pipelineReviewStatus = { Pending: '保留中', Approved: '承認済み', ChangesRequested: '変更を依頼済み', Rejected: '却下済み', Expired: '期限切れ', Cancelled: 'キャンセル済み' };
ja.enums.pipelineReviewDecision = { Approve: '承認', RequestChanges: '変更を依頼', Reject: '却下' };
ja.enums.pipelineReviewSource = { User: '人', Timeout: 'タイムアウト', Cancelled: 'パイプライン実行の停止' };
Object.assign(ja.enums.resourceType, { Pipeline: 'パイプライン', PipelineRun: 'パイプライン実行' });
Object.assign(ja.enums.auditEventType, { PipelineReviewDecided: 'ステージレビューを決定', PipelineRunCancelled: 'パイプライン実行をキャンセル' });
ja.resources.deployments.promptRoles.PipelineStage = 'パイプラインのステージ (引き継ぎ)';
Object.assign(ja.resources.runs.columns, { pipelineRunId: 'パイプライン実行' });
ja.resources.runs.pipelineStage = 'ステージ {{position}}、{{execution}} 回目の実行';
ja.resources.pipelines = {
  ...rp('パイプライン', '順序付けされたエージェントのステージです。各ステージは 1 つのエージェントを実行し、その出力を次のステージに渡します。任意でレビューゲートを設けられます。', 'パイプラインを追加', 'パイプラインを作成', 'パイプラインを編集', 'パイプラインの詳細', 'パイプラインを削除', 'パイプラインはまだありません', 'パイプラインを作成してエージェントをつなげましょう。各ステージは前のステージの出力を受け取ります。'),
  columns: { name: '名前', stages: 'ステージ', reviewGates: 'レビューゲート', maxDurationSeconds: '制限時間', version: 'バージョン', active: '有効', description: '説明', id: 'ID', lastUpdateUtc: '更新日時', createdUtc: '作成日時' },
  fields: {
    name: '名前',
    description: '説明',
    maxDurationSeconds: '制限時間 (秒)',
    active: '有効',
    stages: 'ステージ',
    stageName: 'ステージ名',
    agentId: 'エージェント',
    deploymentId: 'デプロイメント',
    handoffTemplateId: '引き継ぎテンプレート',
    handoffTemplateVersion: '固定するテンプレートのバージョン',
    outputCharLimit: '引き継ぎの文字数上限',
    maxAttempts: '最大試行回数',
    continueOnFailure: '失敗しても続行',
    requiresReview: 'レビューが必要',
    reviewTimeoutSeconds: 'レビューのタイムアウト (秒)',
    reviewTimeoutAction: 'レビューがタイムアウトしたとき',
    maxRevisions: '最大修正回数',
    stageDescription: 'ステージの説明',
    parameters: '実行パラメーター'
  },
  hints: {
    maxDurationSeconds: '{{min}} から {{max}} まで。0 は無制限です。この制限はレビュー待ちの時間を含むパイプライン実行全体に適用されます。',
    stages: 'ステージはこの順序で実行されます。各ステージは、前のステージが成功したとき (または「失敗しても続行」で失敗したとき) に開始し、レビューが必要な場合は人が承認した後に開始します。',
    noDeployments: 'このエージェントにはまだデプロイメントがありません。デプロイメントを空のままにするか、「デプロイメント」で追加してください。',
    handoffTemplateVersion: '空の場合はテンプレートの現在のバージョンを使用します。',
    outputCharLimit: '{{min}} から {{max}} まで。既定値は {{default}} です。',
    maxAttempts: '{{min}} から {{max}} まで。既定値は {{default}} です。',
    reviewTimeoutSeconds: '{{min}} から {{max}} まで。0 は無期限に待ちます。',
    maxRevisions: '{{min}} から {{max}} まで。既定値は {{default}} です。',
    parameters: 'デプロイメントを指定した場合のみ、かつそのデプロイメントが呼び出し元に上書きを許可するパラメーターのみ使用できます。'
  },
  errors: {
    dnsName: '英小文字、数字、ハイフンを 1 から 64 文字で使用し、先頭と末尾は英字または数字にしてください。',
    range: '{{min}} から {{max}} までの整数を入力してください。',
    noStages: 'ステージを少なくとも 1 つ追加してください。',
    tooManyStages: 'パイプラインのステージは最大 {{max}} 個です。',
    stageNameLong: 'ステージ名は 128 文字までです。',
    stageNameDuplicate: '{{name}} という名前のステージがすでにあります。',
    version: '1 以上のバージョン番号を入力するか、空のままにしてください。',
    parametersNeedDeployment: '実行パラメーターはデプロイメントで許可された上書きと照合されるため、デプロイメントが必要です。',
    parametersUnique: '各パラメーター名は 1 回だけ指定できます。',
    stageInvalid: 'このステージにはエラーがあります。'
  },
  actions: { start: '開始', preview: 'プロンプトをプレビュー', runs: 'パイプライン実行を表示' },
  stageHeading: 'ステージ {{position}}: {{name}}',
  stageCount: '{{count}} / 最大 {{max}}',
  stageSummary: '{{count}} ステージ: {{chain}}',
  addStage: 'ステージを追加',
  removeStage: 'ステージを削除',
  noStages: 'ステージはまだありません。',
  chooseAgent: 'エージェントを選択',
  anyDeployment: '有効な任意のデプロイメント (重み付け)',
  defaultHandoff: 'デプロイメントの結び付けまたは組み込み',
  parameterName: 'パラメーター',
  parameterValue: '値',
  noLimit: '無制限',
  versionNotice: 'バージョン {{version}}。保存すると新しいバージョンが作成されます。すでに開始したパイプライン実行は、開始時のステージを使い続けます。'
};
ja.resources.pipelineRuns = {
  ...rp('パイプライン実行', 'パイプラインのすべての実行です。開くとステージの進行を確認し、レビューを決定し、キャンセルや再試行を行えます。', 'パイプライン実行を追加', 'パイプライン実行を作成', 'パイプライン実行を編集', 'パイプライン実行の詳細', 'パイプライン実行を削除', 'パイプライン実行はまだありません', '「エージェント > パイプライン」からパイプラインを開始すると、ここに実行が表示されます。'),
  columns: { id: 'ID', pipelineName: 'パイプライン', status: '状態', outcome: '結果', progress: 'ステージ', callerName: '開始したユーザー', errorMessage: 'エラー', priority: '優先度', deadlineUtc: '期限', completedUtc: '完了日時', createdUtc: '作成日時' },
  actions: { cancel: 'キャンセル', retry: '再試行', stageRuns: 'ステージ実行を表示', finalRun: '最終実行を開く' },
  toasts: { cancelRequested: 'パイプライン実行と現在のステージのキャンセルを要求しました。', retried: 'パイプライン実行は停止したステージから再開します。' },
  progressValue: '{{position}} / {{count}}',
  versionShort: '(バージョン {{version}})'
};
ja.resources.pipelineReviews = {
  ...rp('ステージレビュー', '人による承認、変更の依頼、または却下を待っているパイプラインのステージです。', 'ステージレビューを追加', 'ステージレビューを作成', 'ステージレビューを編集', 'ステージレビューの詳細', 'ステージレビューを削除', 'ステージレビューはまだありません', 'レビューが必要なステージは、完了後にここに表示されます。'),
  columns: { createdUtc: '要求日時', pipelineName: 'パイプライン', stageName: 'ステージ', status: '状態', decision: '決定', decisionSource: '決定者の種別', comment: 'コメント', decidedBy: 'レビュー担当者', expiresUtc: 'タイムアウト日時', pipelineRunId: 'パイプライン実行', runId: 'ステージ実行', decidedUtc: '決定日時', id: 'ID' },
  filters: { pipelineRunId: 'パイプライン実行 ID', pipelineRunIdPlaceholder: 'パイプライン実行 ID (plr_...)' },
  actions: { approve: '承認', requestChanges: '変更を依頼', reject: '却下', openStageRun: 'ステージ実行を開く' },
  noTimeout: '無期限に待機'
};
ja.components.pipelineReviews = {
  decideTitle: '{{pipeline}} のステージ {{stage}} をレビュー',
  decision: '決定',
  positionExecution: 'ステージ {{position}}、{{execution}} 回目の実行',
  revisionsLeft: '残りの修正回数',
  revisionsLeftValue: '{{left}} / {{max}}',
  noRevisionsLeft: 'このステージは {{max}} 回の修正をすべて使い切りました。サーバーは変更の依頼を拒否するため、承認または却下してください。',
  timeoutThen: 'その後 {{decision}}',
  commentApprove: '次のステージへのメモ',
  commentApprovePlaceholder: '任意。次のステージは出力とともにこのメモを受け取ります。',
  commentRequestChanges: '変更してほしい内容',
  commentRequestChangesPlaceholder: '必須。ステージはこのフィードバックをもとに再実行されます。',
  commentReject: '理由',
  commentRejectPlaceholder: '任意。決定とともに記録され、パイプライン実行は失敗します。',
  commentRequired: '変更してほしい内容を記入してください。ステージはこのフィードバックをもとに再実行されます。',
  commentTooLong: 'コメントは {{max}} 文字までです。',
  submit: { Approve: 'ステージを承認', RequestChanges: '変更を依頼', Reject: 'ステージを却下' },
  toasts: {
    Approve: '{{pipeline}} のステージ {{stage}} を承認しました。',
    RequestChanges: '{{pipeline}} のステージ {{stage}} に変更を依頼しました。フィードバックをもとに再実行されます。',
    Reject: '{{pipeline}} のステージ {{stage}} を却下しました。パイプライン実行は失敗します。',
    notPending: 'このレビューは他の人またはタイムアウトによってすでに決定されています。一覧に現在の状態が表示されています。',
    revisionLimit: 'このステージはすでに修正回数をすべて使い切ったため (最大 {{max}} 回)、これ以上変更を依頼できません。代わりに承認または却下してください。'
  }
};
ja.components.pipelineStart = {
  title: '{{name}} を開始',
  intro_other: '入力は {{count}} 個のステージのうち最初のステージに渡されます。すべてのステージは元のタスクとしてもこの入力を参照します。',
  input: '入力',
  inputPlaceholder: 'パイプラインに何を処理させますか?',
  shortcut: 'Ctrl+Enter または Cmd+Enter で開始します。',
  submit: 'パイプラインを開始',
  starting: '開始しています...',
  started: '{{name}} を開始しました。'
};
ja.components.pipelinePreview = {
  title: '{{name}} のプロンプトをプレビュー',
  input: 'サンプル入力',
  sampleInput: '未解決の課題を要約し、最も緊急なものの修正案を提示してください。',
  sampleOutput: '{{stage}} のサンプル出力です。',
  outputOf: 'ステージ {{position}} ({{stage}}) のサンプル出力',
  render: 'プロンプトをレンダリング',
  rendering: 'レンダリング中...',
  stageHeading: 'ステージ {{position}}: {{stage}} ({{agent}})',
  deployment: 'デプロイメント: {{deployment}}',
  rendered: 'レンダリング済み',
  failed: '失敗'
};
ja.views.pipelineRunDetail = {
  title: 'パイプライン実行',
  heading: '{{pipeline}} のパイプライン実行',
  notFoundTitle: 'パイプライン実行が見つかりません',
  notFoundBody: '削除されたか、別のテナントに属している可能性があります。',
  live: 'ライブ',
  polling: '定期更新中',
  finalRun: '最終実行',
  started: '開始日時',
  input: '入力',
  reviewTitle: 'あなたのレビューを待っています',
  reviewBody: 'ステージ {{position}} ({{stage}}) が {{execution}} 回目の実行を終え、レビューを待っています。ステージ実行で出力を確認してください:',
  reviewExpires: '{{time}} までに誰も決定しない場合、レビューは自動的に決定されます: {{decision}}。',
  reviewNoTimeout: 'パイプラインの制限時間で先に実行が終了しない限り、レビューは人が決定するまで待機します。',
  stages: 'ステージ',
  stagesCount_other: '{{count}} ステージ',
  noStages: 'このパイプライン実行にはステージがありません。',
  current: '現在',
  reviewGate: 'レビューゲート',
  agent: 'エージェント {{agent}}',
  counts: '実行 {{executions}} 回、試行 {{attempts}} / {{maxAttempts}}、修正 {{revisions}} / {{maxRevisions}}',
  startedAt: '開始',
  blocked: '開始待ち: {{reason}}。',
  nextAttempt: '次の試行は {{time}} です。',
  reviewItem: '{{execution}} 回目の実行のレビュー',
  columns: { execution: '実行回', run: 'ステージ実行', status: '状態', outcome: '結果', error: 'エラー', created: '作成日時' },
  confirmCancelTitle: 'パイプライン実行をキャンセル',
  confirmCancel: '{{pipeline}} のこのパイプライン実行をキャンセルしますか? 現在のステージ実行はキャンセルされ、保留中のレビューは閉じられます。後で再試行できます。',
  confirmDelete: '{{pipeline}} のこのパイプライン実行とそのレビューを削除しますか? ステージ実行は「実行」ページに残ります。'
};
Object.assign(ja.views.runDetail, { pipelineRun: 'パイプライン実行' });
ja.views.settings.fields.Runtime.PipelineSweepIntervalMs = 'パイプラインの確認間隔 (ms)';
ja.views.settings.fields.Runtime.PipelineMaxStages = 'パイプラインあたりの最大ステージ数';

// Deployment trust level (P11.14).
ja.enums.trustLevel = { Trusted: "信頼済み", Untrusted: "信頼されていない" };
ja.enums.runBlockedReason.NoIsolatingWorker = "分離できるワーカーなし";
ja.components.blocked.reasons.NoIsolatingWorker = "この実行は信頼されていないため、コンテナー分離が必要ですが、{{harness}} を実行できる準備完了のワーカーはそれを提供していません。Job を作成できるクラスターに、Kubernetes Job 実行方式のワーカーを追加してください。";
ja.tips.enums.runBlockedReason.NoIsolatingWorker = "ブロック中: この信頼されていない実行にはコンテナー分離が必要ですが、このハーネスを持つ準備完了のワーカーはそれを提供していません。Kubernetes Job 実行方式のワーカーが登録されるまでキューで待機します。";
ja.tips.enums.trustLevel = { Trusted: "入力は信頼できる呼び出し元からのみ届きます。実行には Process 実行方式を使えますが、他の実行やワーカーから分離されていません。", Untrusted: "入力が信頼できない送信元から届く可能性があります。実行はコンテナー分離以上の実行方式にのみ割り当てられ、利用できるまでキューで待機します。" };
Object.assign(ja.common.fieldCodes, { TenantRequiresUntrusted: "このテナントでは、すべてのデプロイメントを信頼されていない設定にする必要があります。", UntrustedNeedsIsolation: "信頼されていないデプロイメントは Process 実行方式を使えません。Kubernetes Job を選ぶか、実行方式を空のままにしてください。" });
ja.resources.deployments.fields.trustLevel = "信頼レベル";
ja.resources.deployments.columns.trustLevel = "信頼レベル";
ja.resources.deployments.hints.trustLevel = "呼び出し元や内容が信頼できない可能性がある場合は、信頼されていないを選んでください。その実行にはコンテナー分離が必要です。実行方式が空なら Kubernetes Job となり、分離できるワーカーが現れるまで実行は待機します。";
ja.tips.resources.deployments.trustLevel = "信頼済みでは、分離されていない Process 実行方式を使えます。信頼されていない場合は、コンテナー分離以上の実行方式でのみ実行されます。";
ja.tips.resources.deployments.trustFlagged = "このテナントでは信頼されていないデプロイメントが必須です。このデプロイメントはポリシーを有効にする前から信頼済みでした。現在の設定のまま動作し続けますが、次に保存するときは信頼されていないに変更する必要があります。";
ja.resources.deployments.trust = { tenantRequiresUntrusted: "このテナントでは信頼されていないデプロイメントが必須です。このデプロイメントを保存するには、信頼レベルを信頼されていないに変更してください。", untrustedProcess: "信頼されていないデプロイメントは Process 実行方式を使えません。Kubernetes Job を選ぶか、実行方式を空のままにしてください。", flagged: "信頼済み (ポリシーでは信頼されていないが必須)" };
ja.resources.tenants.fields.requireUntrustedDeployments = "信頼されていないデプロイメントを必須にする";
ja.resources.tenants.columns.requireUntrustedDeployments = "信頼されていないが必須";
ja.resources.tenants.hints = { ...(ja.resources.tenants.hints || {}), requireUntrustedDeployments: "信頼済みデプロイメントの作成や保存は拒否されます。既存の信頼済みデプロイメントは動作し続け、信頼されていないとして保存されるまで警告が表示されます。" };
ja.tips.resources.tenants.requireUntrustedDeployments = "有効にすると、このテナントのすべてのデプロイメントを信頼されていない設定にする必要があり、その実行は分離された実行方式にのみ割り当てられます。";
ja.views.runDetail.trustLevel = "信頼レベル";
ja.tips.views.runDetail.trustLevel = "この実行がキューに入ったときのデプロイメントの信頼レベルです。信頼されていない実行は、コンテナー分離以上の実行方式にのみ割り当てられます。";

// Deployment effect policy (P12.29).
ja.enums.effectPolicy = { AtMostOnce: "最大 1 回", AtLeastOnce: "最低 1 回", Journaled: "ジャーナル方式" };
ja.tips.enums.effectPolicy = { AtMostOnce: "実行の開始後にワーカーが失われた場合、実行はノード喪失で失敗し、再び開始されることはありません。外部への作用が 2 回起きることはありません。既定値です。", AtLeastOnce: "実行の開始後にワーカーが失われた場合、試行回数が残っている間は実行がキューに戻ります。失われた試行がすでに行った作用 (push やメッセージなど) が再び起きる可能性があります。", Journaled: "すべての作用が作用ジャーナルを経由した場合にのみ再キューします。ジャーナルはまだ提供されていないため、現在は最大 1 回と同じように動作します。" };
Object.assign(ja.common.fieldCodes, { EffectPolicyConflict: "作用ポリシーが非推奨の retryOnNodeLoss の値と矛盾しています。作用ポリシーだけを送信してください。" });
ja.resources.deployments.fields.effectPolicy = "作用ポリシー";
ja.resources.deployments.columns.effectPolicy = "作用ポリシー";
ja.resources.deployments.hints.effectPolicy = "最大 1 回 (既定) は、開始済みの実行のワーカーが失われるとノード喪失で失敗させます。最低 1 回は試行回数が残っている間は再キューし、作用が繰り返される可能性があります。ジャーナル方式は作用ジャーナルができるまで最大 1 回と同じように動作します。開始されていない実行は常に再キューされます。";
ja.tips.resources.deployments.effectPolicy = "ワーカーが失われたときに開始済みの実行をどう扱うか: 失敗させる (最大 1 回)、再キューする (最低 1 回)、または現在は最大 1 回と同じ動作のジャーナル方式。";
ja.views.runDetail.effectPolicy = "作用ポリシー";
ja.tips.views.runDetail.effectPolicy = "この実行がキューに入ったときのデプロイメントの作用ポリシーです。実行のワーカーが失われた場合の扱いを決めます。後からデプロイメントを変更しても、この実行には影響しません。";
ja.views.settings.fields.Scheduling.QueueWakeFanout = "レプリカごとに起こすポーリング数";
ja.views.settings.fields.Scheduling.RemoteWakeDelayMs = "リモート起床の保留時間 (ms)";
ja.views.settings.fields.Auth.CacheSeconds = "認証キャッシュの有効期間 (秒)";

// Deployment egress allowlists (P11.15).
ja.resources.deployments.fields.egressRules = "送信先許可リスト";
ja.resources.deployments.fields.egressCidr = "CIDR ブロック";
ja.resources.deployments.fields.egressPort = "宛先ポート";
ja.resources.deployments.fields.egressProtocol = "プロトコル";
ja.resources.deployments.columns.egressRules = "送信";
ja.resources.deployments.hints.egressRules = "空のままにすると、クラスターの既定の実行用送信 (任意の宛先への HTTPS) を使います。ルールがあると、実行 Pod は DNS、Garrison の MCP ポート、これらのブロックにだけ到達でき、実行にはそれを強制する Kubernetes ワーカーが必要です。ホスト名ではなく CIDR ブロックを入力し、名前はご自身でアドレスに解決してください。ポートが空の場合はすべてのポートを許可します。ルールは最大 64 件です。";
ja.resources.deployments.egress = {"add": "送信ルールを追加", "allPorts": "すべてのポート", "default": "既定", "count_one": "許可リスト、ルール {{count}} 件", "count_other": "許可リスト、ルール {{count}} 件", "note_one": "このデプロイメントには送信ルールが {{count}} 件あります。実行は送信許可リストを有効にした Kubernetes ワーカーでのみ行われ、DNS、Garrison の MCP ポート、ルールだけを許可する NetworkPolicy を持つ Pod で動きます。該当するワーカーが Ready でない場合、実行はキューで待機します (分離できるワーカーなし)。許可リストなしで実行されることはありません。", "note_other": "このデプロイメントには送信ルールが {{count}} 件あります。実行は送信許可リストを有効にした Kubernetes ワーカーでのみ行われ、DNS、Garrison の MCP ポート、ルールだけを許可する NetworkPolicy を持つ Pod で動きます。該当するワーカーが Ready でない場合、実行はキューで待機します (分離できるワーカーなし)。許可リストなしで実行されることはありません。", "errors": {"cidrRequired": "CIDR ブロックを入力してください (例: 203.0.113.0/24)。", "cidrFormat": "プレフィックス長付きの CIDR 表記を使ってください (例: 198.51.100.7/32)。ホスト名は使えません。", "cidrAddress": "アドレスが有効な IPv4 または IPv6 アドレスではありません。", "cidrPrefix": "プレフィックス長が範囲外です (IPv4 は 0 から 32、IPv6 は 0 から 128)。", "cidrMapped": "IPv4 射影 IPv6 アドレスは使えません。代わりに IPv4 ブロックを入力してください。", "cidrHostBits": "プレフィックスより後ろのビットが立っています。ブロックのネットワークアドレスを使ってください。"}};
Object.assign(ja.common.fieldCodes, {"InvalidCidr": "CIDR ブロックが無効です。", "PortOutOfRange": "ポートは 1 から 65535 の範囲で指定するか、すべてのポートの場合は空にしてください。", "InvalidProtocol": "不明なプロトコルです。TCP または UDP を使ってください。", "TooManyEgressRules": "1 つのデプロイメントに設定できる送信ルールは最大 64 件です。", "EgressRulesNeedKubernetesJob": "送信ルールは Kubernetes Job の実行でのみ強制されます。Kubernetes Job を選ぶか、実行方式を空のままにしてください。", "EgressRulesNeedColdStart": "ウォーム Pod は既定の送信設定ですでに動いているため、送信ルールにはコールドスタートが必要です。起動クラスを空にするか、コールドを選んでください。"});
ja.components.blocked.reasons.NoIsolatingWorkerEgress = "この実行のデプロイメントには送信許可リストがあり、送信許可リストを有効にした Kubernetes ワーカーだけがそれを強制できますが、{{harness}} を実行できる Ready のワーカーにそれを提供するものがありません。実行はキューで待機し、許可リストなしで実行されることはありません。ネットワークプラグインが NetworkPolicy を強制するクラスターで、Kubernetes Job ワーカーの送信許可リストを有効にしてください。";
ja.tips.enums.runBlockedReason.NoIsolatingWorker = "ブロック中: この実行には分離できるワーカー (信頼されていない実行にはコンテナー分離、送信許可リストのあるデプロイメントには送信制御) が必要ですが、そのハーネスを持つ Ready のワーカーに提供するものがありません。適切な Kubernetes Job ワーカーが登録されるまでキューで待機します。";
ja.tips.resources.deployments.egressRules = "このデプロイメントの実行 Pod が到達できる宛先です。CIDR ブロックと、任意のポートとプロトコルで指定します。空の場合は既定の実行用送信を使います。";
ja.tips.resources.deployments.egressRulesItems = {"cidr": "CIDR 表記の宛先ブロック (IPv4 または IPv6、例: 203.0.113.0/24)。ホスト名はご自身でアドレスに解決してください。", "port": "1 から 65535 の宛先ポート。空にするとブロックのすべてのポートを許可します。", "protocol": "多くのサービスは TCP、または UDP。"};
ja.tips.resources.deployments.egressDefault = "送信許可リストなし: 実行 Pod はクラスターの既定の実行用送信を使います。";

// Triggers (P12.5) and notification endpoints (P12.14).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "triggers": {
    "label": "トリガー",
    "tip": "実行を開始する cron スケジュールと署名付き Webhook"
   },
   "notifications": {
    "label": "通知",
    "tip": "実行、パイプライン、承認に関する署名付き Webhook"
   }
  }
 },
 "enums": {
  "triggerType": {
   "Cron": "cron スケジュール",
   "Webhook": "署名付き Webhook"
  },
  "triggerTargetType": {
   "Agent": "エージェント実行",
   "Pipeline": "パイプライン実行"
  },
  "triggerFireSource": {
   "Cron": "スケジュール",
   "Webhook": "Webhook の配信",
   "Manual": "手動で起動"
  },
  "triggerFireOutcome": {
   "Started": "開始済み",
   "Failed": "失敗",
   "Skipped": "スキップ"
  },
  "notificationEvent": {
   "RunSucceeded": "実行成功",
   "RunFailed": "実行失敗",
   "RunCancelled": "実行キャンセル",
   "RunTimedOut": "実行タイムアウト",
   "PipelineCompleted": "パイプライン完了",
   "PipelineFailed": "パイプライン失敗",
   "ApprovalRequested": "承認依頼",
   "Test": "テスト通知"
  },
  "notificationDeliveryStatus": {
   "Pending": "待機中",
   "Delivering": "配信中",
   "Succeeded": "配信済み",
   "Failed": "断念"
  },
  "runKind": {
   "Invoke": "呼び出し",
   "Delegated": "委任",
   "Test": "テスト実行",
   "Retry": "再試行",
   "Pipeline": "パイプラインのステージ",
   "Trigger": "トリガーによる開始"
  },
  "resourceType": {
   "Trigger": "トリガー",
   "NotificationEndpoint": "通知エンドポイント"
  },
  "auditEventType": {
   "SigningSecretRotated": "署名シークレットを更新"
  }
 },
 "errorCodes": {
  "ReferencedByTrigger": "トリガーがこのレコードを使用しています。先にそのトリガーを変更または削除してください。",
  "ReferencedByNotificationEndpoint": "通知エンドポイントがこのレコードで絞り込んでいます。先にそのエンドポイントを変更または削除してください。",
  "NotAWebhookTrigger": "署名シークレットを持つのは Webhook トリガーだけです。",
  "TriggerInactive": "このトリガーは無効です。",
  "InvalidSignature": "Webhook の署名がない、形式が不正、古すぎる、または一致しません。",
  "PayloadTooLarge": "ペイロードがサーバーの受け付ける上限を超えています。"
 },
 "common": {
  "fieldCodes": {
   "InvalidUrl": "ユーザー名とパスワードを含まない、絶対形式の HTTP または HTTPS の URL を入力してください。",
   "DestinationBlocked": "サーバーはこの宛先を拒否します。運用者がプライベートな宛先を許可しない限り、ループバック、プライベート、リンクローカル、メタデータのアドレスはブロックされます。",
   "EventsRequired": "イベントを 1 つ以上選んでください。",
   "InvalidEvent": "サポートされていないイベントが含まれています。",
   "InvalidCron": "cron 式が不正です。分、時、日、月、曜日の 5 つのフィールドを使ってください。",
   "InvalidTimeZone": "不明なタイムゾーンです。UTC や Asia/Tokyo などの IANA 名を使ってください。",
   "TypeImmutable": "トリガーの種類は変更できません。新しいトリガーを作成してください。",
   "TargetMismatch": "このフィールドは選択した対象に属しません。",
   "PayloadTooLarge": "ペイロードがサーバーの受け付ける上限を超えています。"
  }
 },
 "resources": {
  "runs": {
   "columns": {
    "triggerId": "トリガー",
    "kind": "実行の種類"
   }
  },
  "triggers": {
   "title": "トリガー",
   "subtitle": "エージェント実行またはパイプライン実行を開始する cron スケジュールと署名付き Webhook。",
   "add": "トリガーを追加",
   "create": "トリガーを作成",
   "edit": "トリガーを編集",
   "view": "トリガーの詳細",
   "deleteTitle": "トリガーを削除",
   "emptyTitle": "トリガーはまだありません",
   "emptyBody": "スケジュールで、または他のシステムから Webhook が届いたときにエージェントを実行するには、トリガーを作成します。",
   "columns": {
    "name": "名前",
    "type": "種類",
    "target": "開始対象",
    "schedule": "スケジュール",
    "active": "有効",
    "lastFire": "前回の起動",
    "nextFireUtc": "次回の起動",
    "fireCount": "起動回数",
    "runAs": "実行ユーザー",
    "signingSecretLast4": "シークレット末尾",
    "description": "説明",
    "id": "ID",
    "createdUtc": "作成日時"
   },
   "fields": {
    "name": "名前",
    "type": "種類",
    "description": "説明",
    "targetType": "開始対象",
    "agentId": "エージェント",
    "deploymentId": "デプロイメント",
    "pipelineId": "パイプライン",
    "inputTemplateId": "入力テンプレート",
    "priority": "優先度",
    "cronExpression": "cron 式",
    "timeZone": "タイムゾーン",
    "active": "有効",
    "webhook": "Webhook の URL"
   },
   "hints": {
    "type": "種類は作成後に変更できません。",
    "inputTemplateId": "trigger.* と webhook.* の変数から実行の入力を作る Task テンプレート。空欄なら組み込みの trigger-input テンプレートを使います。",
    "priority": "{{min}} から {{max}} まで。大きいほど先に実行されます。",
    "cronExpression": "5 つのフィールド: 分、時、日、月、曜日。例: 0 9 * * 1-5 は平日の 09:00 に実行します。",
    "timeZone": "UTC や Asia/Tokyo などの IANA 名。夏時間の切り替えは自動で処理されます。",
    "webhookNew": "保存すると Webhook の URL と署名シークレットが表示されます。シークレットは 1 回だけ表示されます。"
   },
   "errors": {
    "name": "小文字、数字、ハイフンを 1 から 64 文字で使い、先頭と末尾は英字か数字にしてください。",
    "description": "説明は {{max}} 文字までです。",
    "agentRequired": "このトリガーで実行するエージェントを選んでください。",
    "pipelineRequired": "このトリガーで開始するパイプラインを選んでください。",
    "cron": "5 つのフィールド (分 時 日 月 曜日) か、@daily などのマクロを入力してください。",
    "priority": "{{min}} から {{max}} までの整数を入力してください。"
   },
   "actions": {
    "fire": "今すぐ起動",
    "fires": "起動履歴",
    "runs": "実行を表示",
    "rotateSecret": "シークレットを更新"
   },
   "fires": {
    "firedUtc": "起動日時",
    "source": "起動元",
    "outcome": "結果",
    "started": "開始した実行",
    "deliveryId": "配信 ID",
    "error": "エラー",
    "runId": "実行",
    "pipelineRunId": "パイプライン実行"
   },
   "confirmRotateTitle": "署名シークレットを更新",
   "confirmRotate": "{{name}} の署名シークレットを置き換えますか？古いシークレットはすぐに使えなくなるため、送信側は新しいものに切り替える必要があります。",
   "anyDeployment": "任意の有効なデプロイメント (重み付け)",
   "builtinTemplate": "組み込みの trigger-input テンプレート",
   "webhookSchedule": "署名付き Webhook が届いたとき",
   "neverFired": "まだ起動していません",
   "runAsNotice": "{{name}} として実行します。変更を保存すると、このトリガーはあなたとして実行されます。",
   "secretEnding": "現在のシークレットの末尾は {{last4}} です。"
  },
  "notifications": {
   "title": "通知",
   "subtitle": "実行やパイプラインの終了時、承認待ちの発生時に署名付き通知を受け取る Webhook エンドポイント。",
   "add": "エンドポイントを追加",
   "create": "通知エンドポイントを作成",
   "edit": "通知エンドポイントを編集",
   "view": "通知エンドポイントの詳細",
   "deleteTitle": "通知エンドポイントを削除",
   "emptyTitle": "通知エンドポイントはまだありません",
   "emptyBody": "実行の失敗、パイプラインの終了、承認待ちのときに署名付きの HTTP POST を受け取るエンドポイントを追加します。",
   "columns": {
    "name": "名前",
    "url": "URL",
    "events": "イベント",
    "filters": "絞り込み",
    "active": "有効",
    "signingSecretLast4": "シークレット末尾",
    "includeResultText": "結果テキスト",
    "description": "説明",
    "id": "ID",
    "createdUtc": "作成日時",
    "agent": "エージェント",
    "deployment": "デプロイメント"
   },
   "fields": {
    "name": "名前",
    "description": "説明",
    "url": "URL",
    "events": "イベント",
    "agentId": "このエージェントのみ",
    "deploymentId": "このデプロイメントのみ",
    "includeResultText": "結果テキストを含める",
    "resultTextMaxChars": "結果テキストの上限 (文字)",
    "active": "有効"
   },
   "hints": {
    "url": "HTTP または HTTPS の URL。運用者がプライベートな宛先を許可しない限り、ループバック、プライベート、メタデータのアドレスは拒否され、リダイレクトはたどりません。",
    "events": "エージェントまたはデプロイメントの絞り込みがある間は、パイプラインのイベントは送信されません。",
    "agentId": "空欄ならすべてのエージェントのイベントを送ります。",
    "deploymentId": "空欄ならすべてのデプロイメントのイベントを送ります。",
    "includeResultText": "既定ではオフ: 通知には ID、状態、タイムスタンプが含まれますが、実行の出力は含まれません。",
    "resultTextMaxChars": "{{min}} から {{max}} まで。既定値 {{default}}。"
   },
   "errors": {
    "name": "小文字、数字、ハイフンを 1 から 64 文字で使い、先頭と末尾は英字か数字にしてください。",
    "url": "ユーザー名とパスワードを含まない、絶対形式の HTTP または HTTPS の URL を入力してください。",
    "events": "イベントを 1 つ以上選んでください。",
    "resultTextMaxChars": "{{min}} から {{max}} までの整数を入力してください。"
   },
   "actions": {
    "test": "テスト送信",
    "deliveries": "配信ログ",
    "rotateSecret": "シークレットを更新"
   },
   "deliveries": {
    "createdUtc": "キュー投入",
    "event": "イベント",
    "status": "状態",
    "attempts": "試行回数",
    "lastStatusCode": "HTTP ステータス",
    "lastError": "最後のエラー",
    "lastAttemptUtc": "最後の試行",
    "nextAttemptUtc": "次の試行",
    "deliveredUtc": "配信日時",
    "payload": "ペイロード",
    "id": "配信 ID"
   },
   "confirmRotateTitle": "署名シークレットを更新",
   "confirmRotate": "{{name}} の署名シークレットを置き換えますか？今後の通知は、すでにキューにある再試行も含めて新しいシークレットで署名されます。",
   "anyAgent": "すべてのエージェント",
   "anyDeployment": "すべてのデプロイメント",
   "noFilter": "すべて",
   "eventCount_one": "{{count}} 件のイベント",
   "eventCount_other": "{{count}} 件のイベント",
   "resultTextUpTo_one": "最大 {{count}} 文字",
   "resultTextUpTo_other": "最大 {{count}} 文字",
   "secretNotice": "通知は末尾が {{last4}} のシークレット ({{time}} に設定) で署名されます。新しいものにするには更新してください。"
  }
 },
 "components": {
  "signingSecret": {
   "title": "署名シークレット",
   "warning": "このシークレットを今すぐコピーしてください。Garrison は暗号化して保存し、二度と表示しません。紛失したら更新してください。",
   "secret": "シークレット",
   "url": "Webhook の URL",
   "done": "保存しました",
   "scheme": "各リクエストにヘッダー {{header}} で署名します: {{format}}。{{delivery}} を送ると、繰り返しの配信は 1 回として扱われます。"
  },
  "triggerFire": {
   "title": "{{name}} を起動",
   "intro": "このトリガーを今すぐ開始します。ペイロードは任意で、入力テンプレートでは webhook.body として参照できます。",
   "body": "ペイロード",
   "contentType": "ペイロードのコンテンツタイプ",
   "submit": "起動",
   "firing": "起動中..."
  },
  "triggerFires": {
   "title": "起動履歴",
   "count_one": "{{count}} 件中 {{shown}} 件の起動",
   "count_other": "{{count}} 件中 {{shown}} 件の起動",
   "empty": "このトリガーはまだ起動していません。",
   "scheduled": "{{time}} の予定分"
  },
  "notificationDeliveries": {
   "title": "配信ログ",
   "count_one": "{{count}} 件中 {{shown}} 件の配信",
   "count_other": "{{count}} 件中 {{shown}} 件の配信",
   "empty": "このエンドポイントにはまだ何も送信されていません。",
   "detail": "選択した配信"
  },
  "notificationTest": {
   "title": "テスト通知",
   "sending": "テスト通知を送信しています...",
   "succeeded": "エンドポイントがテスト通知を受け付けました。",
   "failed": "テスト通知は失敗し、再試行されません。下のエラーを確認してください。",
   "pending": "最初の試行が失敗しました。Garrison が再試行します。下のエラーを確認してください。"
  }
 },
 "views": {
  "runDetail": {
   "trigger": "トリガー"
  },
  "settings": {
   "groups": {
    "Triggers": "トリガー",
    "Notifications": "通知"
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Webhook 本文の最大サイズ (バイト)",
     "WebhookToleranceSeconds": "Webhook タイムスタンプの許容差 (秒)",
     "CronMaxLatenessSeconds": "cron の追いつき上限 (秒)",
     "FireRetentionDays": "起動履歴の保持期間 (日)"
    },
    "Notifications": {
     "AllowPrivateDestinations": "プライベートな宛先を許可",
     "MaxAttempts": "配信の試行回数",
     "InitialBackoffSeconds": "最初の再試行までの待ち時間 (秒)",
     "MaxBackoffSeconds": "再試行の最長待ち時間 (秒)",
     "TimeoutSeconds": "配信のタイムアウト (秒)",
     "DispatchIntervalMs": "送信間隔 (ミリ秒)",
     "SweepOverlapSeconds": "イベント走査の重なり (秒)",
     "DeliveryRetentionDays": "配信ログの保持期間 (日)"
    }
   }
  }
 }
});
Object.assign(ja.common.fieldCodes, {"SecretUseDenied": "このシークレットを使用する権限がありません。このシークレットに対する SecretUser または SecretManager ロールを依頼してください。", "GrantCeiling": "付与できるのは、自分が持っている権限だけです。", "ReservedRoleName": "組み込みロールの名前です。別の名前を選んでください。"});
ja.components.mcpTest.noWorkers = "準備完了のワーカーで stdio 診断を提供しているものはありません。コマンドは実行の分離の外側、ワーカーのホスト上で動くため、オペレーターがワーカーに GARRISON_WORKER_MCP_TESTS_ENABLED=true を設定した場合にのみ実行されます。";

// Transcript export (P12.27), manifest bundle export (P12.21), and schema invoke forms (P12.22).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "transcriptExport": {
   "label": "トランスクリプトをエクスポート",
   "exporting": "エクスポート中...",
   "markdown": "Markdown ドキュメント (.md)",
   "json": "JSON (.json)",
   "includeThinking": "思考を含める",
   "failed": "トランスクリプトのエクスポートに失敗しました: {{message}}"
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "構造化入力",
    "modeLabel": "入力エディター",
    "modeForm": "フォーム",
    "modeJson": "生の JSON",
    "required": "必須",
    "choose": "値を選択",
    "addItem": "項目を追加",
    "removeItem": "項目を削除",
    "jsonLabel": "入力 JSON",
    "jsonPlaceholder": "JSON 値",
    "unsupported": "この入力スキーマにはフォームを作成できるプロパティがありません。エージェントが期待する JSON ドキュメントを入力してください。",
    "invalidRaw": "JSON が無効です。フォームに切り替える前に修正してください。",
    "errors": {
     "required": "この項目は必須です。",
     "number": "数値を入力してください。",
     "integer": "整数を入力してください。",
     "json": "有効な JSON を入力してください。"
    }
   }
  },
  "manifests": {
   "bundle": {
    "scope": "エクスポート範囲",
    "scopeAll": "すべてのリソース",
    "scopeSelected": "選択したリソース",
    "kinds": "種類",
    "resources": "リソース",
    "resourcesHint": "1 行に 1 つ、またはカンマ区切りで 種類/名前 を指定します。例: Agent/triage",
    "invalidSelectors": "既知の種類の 種類/名前 ではありません: {{entries}}",
    "followReferences": "参照先も含める",
    "includeBuiltIn": "参照している組み込みも含める",
    "exporting": "エクスポート中...",
    "noSecrets": "このバンドルにシークレットは不要です。",
    "requiredSecrets": "適用する前に、対象テナントでこれらのシークレットを作成してください。シークレットの値はエクスポートされません。",
    "requiredArtifactStores": "適用する前に、対象テナントでこれらのアーティファクトストアを作成してください。"
   }
  }
 }
});

// Durable continuation and remote execution.
ja.enums.runStatus.Suspended = "一時停止中";
ja.resources.deployments.fields.suspensionEnabled = "承認待ちで一時停止";
ja.resources.harnessProfiles.fields.sessionFormat = "ハーネスのセッション形式";
ja.enums.auditEventType.QueueFull = "キューが満杯";
ja.enums.runExecutor.RemoteA2A = "リモート A2A";
ja.enums.runExecutor.RemoteMcp = "リモート MCP";
ja.tips.resources.deployments.suspensionEnabled = "待機中の永続チェックポイントを有効にします。Process、分離されたホーム、互換性のある再開可能なハーネス、アーティファクトストアが必要です。";
ja.tips.resources.harnessProfiles.sessionFormat = "移植可能なチェックポイントのセッション形式です。ハーネスの更新で互換性が変わる場合は変更してください。";
ja.tips.enums.runStatus.Suspended = "実行は永続チェックポイントに保存され、待機中はワーカーのリースや実行枠を保持しません。";
ja.tips.enums.runExecutor.RemoteA2A = "認証済みの登録 A2A エージェントを期限とキャンセル処理付きで実行します。";
ja.tips.enums.runExecutor.RemoteMcp = "検証済み JSON 入力で、選択した登録リモート MCP ツールを呼び出します。";
ja.tips.enums.auditEventType.QueueFull = "クラスター、テナント、またはエージェントのキュー上限に達したため、実行の受付が拒否されました。";

// Agent revisions, environments, and promotions (AD1.9).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "enums": {
  "agentRevisionState": {
   "Draft": "下書き",
   "Published": "公開済み"
  },
  "promotionKind": {
   "Promote": "昇格",
   "Rollback": "ロールバック"
  },
  "promotionOutcome": {
   "Applied": "適用済み",
   "RolledBack": "ロールバック済み"
  },
  "revisionChangeType": {
   "Changed": "変更",
   "Added": "追加",
   "Removed": "削除"
  },
  "resourceType": {
   "AgentRevision": "エージェントのリビジョン",
   "Promotion": "昇格"
  }
 },
 "errorCodes": {
  "PromotionOrderViolation": "昇格先が昇格元の次の環境ではありません。順序を飛ばして昇格するには「環境のスキップを許可」をオンにしてください。",
  "NoNextEnvironment": "昇格元が最後の環境のため、昇格先がありません。",
  "NoTargetDeployments": "このエージェントには昇格先の環境にデプロイメントがありません。先にそこで作成してください。",
  "NoSourceRevision": "昇格するリビジョンがありません。エージェントに昇格元の環境のデプロイメントがないか、公開済みリビジョンがありません。リビジョンを明示的に選択してください。",
  "AmbiguousSourceRevision": "昇格元の環境のデプロイメントが異なるリビジョンを実行しています。昇格するリビジョンを選択してください。",
  "RevisionNotPublished": "そのリビジョンは下書きです。昇格する前に公開してください。",
  "PromotionConflict": "昇格の適用中にデプロイメントが変更されました。何も変更されていません。再読み込みしてもう一度お試しください。",
  "NotAPromotion": "ロールバックできるのは昇格だけで、ロールバック自体はできません。",
  "AlreadyRolledBack": "この昇格はすでにロールバックされています。",
  "RevisionUnchanged": "下書きは最新の公開済みリビジョンと同じです。公開する前に変更するか、破棄してください。",
  "RevisionPublished": "このリビジョンはすでに公開済みのため、変更できません。",
  "EnvironmentInUse": "削除した環境にまだデプロイメントがあります。先にそれらを移動または削除してください。"
 },
 "views": {
  "agentDetail": {
   "revisions": "リビジョン",
   "draftNotice": "このエージェントには公開されていない下書きの変更があります。下書きが公開されるまで、デプロイメントは公開済みリビジョンを実行し続けます。",
   "reviewDraft": "下書きを確認"
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "number": "リビジョン",
    "state": "状態",
    "author": "作成者",
    "changeNote": "変更メモ",
    "publishedUtc": "公開日時",
    "actions": "操作"
   },
   "number": "リビジョン {{number}}",
   "option": "リビジョン {{number}}（{{state}}）",
   "latest": "最新",
   "empty": "このエージェントにはまだリビジョンがありません。",
   "compareTitle": "リビジョンを比較",
   "from": "比較元",
   "to": "比較先",
   "pickTwo": "比較する 2 つの異なるリビジョンを選択してください。",
   "identical": "リビジョン {{from}} と {{to}} の内容は同じです。",
   "diffSummary": "リビジョン {{from}} とリビジョン {{to}} の間で変更されたフィールド: {{changed}}。",
   "diffColumns": {
    "field": "フィールド",
    "change": "変更",
    "before": "変更前",
    "after": "変更後"
   },
   "emptyValue": "（空）",
   "compare": "比較",
   "publish": "公開",
   "discard": "下書きを破棄",
   "publishTitle": "リビジョン {{number}} を公開",
   "publishBody": "公開すると、リビジョン {{number}} が最新の公開済みリビジョンになります。最新リビジョンに追従するデプロイメントは次回の実行からこれを実行し、固定されたデプロイメントは現在のリビジョンを維持します。",
   "changeNote": "変更メモ",
   "changeNotePlaceholder": "変更内容と理由（任意）",
   "publishing": "公開中...",
   "published": "リビジョン {{number}} を公開しました。",
   "discardTitle": "下書きリビジョン {{number}} を破棄",
   "discardMessage": "下書きを破棄しますか？変更内容は失われます。公開済みリビジョンとデプロイメントには影響しません。",
   "discarded": "下書きを破棄しました。"
  },
  "promote": {
   "title": "リビジョンを昇格",
   "intro": "昇格先の環境にあるエージェントのすべてのデプロイメントを、昇格元の環境で実行中のリビジョンに固定します。各昇格は記録され、ロールバックできます。",
   "agent": "エージェント",
   "revision": "昇格するリビジョン",
   "revisionFromSource": "昇格元の環境で実行中のリビジョン",
   "source": "昇格元の環境",
   "target": "昇格先の環境",
   "targetNext": "次の環境（{{name}}）",
   "allowSkip": "環境のスキップを許可",
   "skipWarning": "{{target}} は {{source}} の直後の環境ではありません。",
   "note": "メモ",
   "notePlaceholder": "この昇格の理由（任意）",
   "submit": "昇格",
   "promoting": "昇格中...",
   "promoted": "{{target}} に昇格しました。更新されたデプロイメント: {{deployments}}。",
   "errors": {
    "noNext": "昇格元の環境の後に環境がありません。",
    "sameEnvironment": "昇格元とは異なる昇格先の環境を選択してください。",
    "needsSkip": "この昇格先は環境をスキップします。順序を飛ばして昇格するには「環境のスキップを許可」をオンにしてください。"
   }
  },
  "promotions": {
   "title": "昇格履歴",
   "agentFilter": "エージェント",
   "allAgents": "すべてのエージェント",
   "empty": "昇格やロールバックはまだありません。",
   "columns": {
    "createdUtc": "日時",
    "kind": "種類",
    "outcome": "結果",
    "agent": "エージェント",
    "revision": "リビジョン",
    "environments": "環境",
    "deployments": "デプロイメント",
    "actor": "実行者",
    "note": "メモ",
    "actions": "操作"
   },
   "path": "{{source}} から {{target}}",
   "pinChange": "（{{from}} から {{to}}）",
   "skipped": "環境をスキップ",
   "rollback": "ロールバック",
   "rollbackTitle": "昇格をロールバック",
   "rollbackMessage": "{{source}} から {{target}} へのこの昇格で変更されたデプロイメントのリビジョン固定を、昇格前の状態に戻しますか？対象のデプロイメント: {{deployments}}。",
   "rollbackNote": "ロールバックのメモ",
   "rolledBack": "ロールバックしました。以前のリビジョン固定が復元されました。"
  }
 },
 "resources": {
  "deployments": {
   "columns": {
    "environment": "環境",
    "agentRevisionId": "固定リビジョン"
   },
   "fields": {
    "environment": "環境",
    "agentRevisionId": "リビジョン固定"
   },
   "hints": {
    "environment": "昇格は、テナントの順序に従ってリビジョンを環境間で移動します。",
    "agentRevisionId": "空の場合はエージェントの最新の公開済みリビジョンに追従します。固定すると、あなたか昇格が変更するまで、このデプロイメントは 1 つのリビジョンにとどまります。"
   },
   "followLatest": "最新の公開済みに追従",
   "latest": "最新",
   "selectAgentFirst": "先にエージェントを選択してください。",
   "noPublished": "このエージェントにはまだ公開済みリビジョンがありません。",
   "actions": {
    "promote": "昇格",
    "promotions": "昇格履歴"
   }
  }
 }
});

// Agent assets: the Assets page, versions and uploads, and asset pins on revisions (AD2.8).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "agentAssets": {
    "label": "アセット",
    "tip": "エージェントのリビジョンが固定する、バージョン管理されたシステムプロンプト、スキル、参照ファイル、ドキュメントテンプレート。"
   }
  }
 },
 "enums": {
  "agentAssetKind": {
   "SystemPrompt": "システムプロンプト",
   "Skill": "スキル",
   "ReferenceFile": "参照ファイル",
   "DocumentTemplate": "ドキュメントテンプレート"
  },
  "runOutcome": {
   "AssetIntegrityFailed": "アセットの整合性チェックに失敗"
  },
  "resourceType": {
   "AgentAsset": "エージェントのアセット"
  }
 },
 "errorCodes": {
  "AssetInUse": "このアセットはまだエージェントのリビジョンに固定されています。削除する前に、それらのリビジョンから外してください。",
  "AssetKindImmutable": "アセットの種類は作成後に変更できません。新しいアセットを作成してください。",
  "AssetStoreImmutable": "アセットの成果物ストアは作成後に変更できません。新しいアセットを作成してください。",
  "AssetTemplateRequired": "システムプロンプトのアセットにはプロンプトテンプレートが必要で、他の種類には設定できません。",
  "AssetFileTooLarge": "ファイルが Assets.MaxFileBytes 設定の上限を超えています。",
  "AssetVersionTooLarge": "ファイルの合計サイズが Assets.MaxVersionBytes 設定の上限を超えています。",
  "AssetTooManyFiles": "このアップロードのファイル数が Assets.MaxFilesPerVersion 設定の上限を超えています。",
  "AssetHasNoFiles": "システムプロンプトのアセットにはファイルがありません。代わりにプロンプトテンプレートを編集してください。"
 },
 "common": {
  "fieldCodes": {
   "InvalidAssetPath": "スラッシュ区切りの相対パスを使用してください。「.」や「..」のセグメントは使用できず、最大 512 文字です。",
   "MacroFormatRefused": "マクロ有効な Office ファイルは拒否されます (Assets.AllowMacroFormats)。ファイルを .docx または .dotx として保存してください。",
   "AssetHasNoFiles": "システムプロンプトのアセットにはファイルがありません。代わりにプロンプトテンプレートを編集してください。",
   "AssetTemplateRequired": "システムプロンプトのアセットにはプロンプトテンプレートを選択してください。"
  },
  "serverText": {
   "assetInUse": "アセット {{asset}} は次のエージェントのリビジョンに固定されています: {{agents}}。先にそれらのリビジョンから外してください。",
   "assetFileTooLarge": "ファイル {{path}} は {{size}} バイトです。上限は {{limit}} バイトです (Assets.MaxFileBytes)。",
   "assetVersionTooLarge": "このバージョンは {{limit}} バイトを超えています (Assets.MaxVersionBytes)。",
   "assetTooManyFiles": "1 つのバージョンに含められるファイルは最大 {{limit}} 個です (Assets.MaxFilesPerVersion)。このアップロードには {{count}} 個あります。",
   "assetHasNoFiles": "システムプロンプトのアセットにはファイルがありません。代わりにプロンプトテンプレートを編集してください。"
  }
 },
 "resources": {
  "agentAssets": {
   "title": "アセット",
   "subtitle": "エージェントのリビジョンが固定する、バージョン管理されたシステムプロンプト、スキル、参照ファイル、ドキュメントテンプレート。",
   "add": "アセットを追加",
   "create": "アセットを作成",
   "edit": "アセットを編集",
   "view": "アセットの詳細",
   "deleteTitle": "アセットを削除",
   "emptyTitle": "アセットはまだありません",
   "emptyBody": "アセットを作成し、ファイルをバージョンとしてアップロードして、エージェントのリビジョンに固定してください。",
   "columns": {
    "name": "名前",
    "kind": "種類",
    "currentVersion": "現在のバージョン",
    "description": "説明",
    "tags": "タグ",
    "artifactStoreId": "ストア",
    "id": "アセット ID",
    "createdUtc": "作成日時"
   },
   "fields": {
    "name": "名前",
    "kind": "種類",
    "promptTemplateId": "プロンプトテンプレート",
    "artifactStoreId": "成果物ストア",
    "description": "説明",
    "tags": "タグ"
   },
   "hints": {
    "kind": "作成後は変更できません。システムプロンプトのアセットはプロンプトテンプレートからテキストを取得し、他の種類はアップロードしたファイルを保持します。",
    "promptTemplateId": "このアセットがエージェントのシステムプロンプトとして提供するテキストのプロンプトテンプレート。",
    "artifactStoreId": "アップロードしたファイルの保存先。作成後は変更できません。空のままにすると Garrison データベースに保存されます。"
   },
   "errors": {
    "templateRequired": "このシステムプロンプトのアセットが使用するプロンプトテンプレートを選択してください。"
   },
   "version": "バージョン {{number}}",
   "noVersion": "バージョンなし",
   "databaseStore": "Garrison データベース",
   "actions": {
    "versions": "バージョン"
   }
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "assetPins": "アセット"
   }
  },
  "assets": {
   "versionsTitle": "{{name}} のバージョン",
   "current": "現在",
   "noVersions": "このアセットにはまだバージョンがありません。下でファイルをアップロードしてください。",
   "systemPromptNotice": "システムプロンプトのアセットにはファイルがありません。テキストはプロンプトテンプレートから取得されるため、変更するにはテンプレートを編集してください。",
   "showFiles": "ファイル",
   "filesTitle": "バージョン {{number}} のファイル",
   "noFiles": "このバージョンにはファイルがありません。",
   "preview": "プレビュー",
   "download": "ダウンロード",
   "previewTitle": "{{path}} (バージョン {{number}})",
   "emptyFile": "このファイルは空です。",
   "versionColumns": {
    "number": "バージョン",
    "author": "作成者",
    "changeNote": "変更メモ",
    "totalBytes": "合計サイズ",
    "createdUtc": "作成日時",
    "actions": "操作"
   },
   "fileColumns": {
    "path": "パス",
    "mediaType": "メディアタイプ",
    "sizeBytes": "サイズ",
    "sha256": "SHA-256 ダイジェスト",
    "actions": "操作"
   },
   "uploadTitle": "新しいバージョンをアップロード",
   "uploadHint": "1 つ以上のファイルを選択してください。各アップロードは完全なバージョンです。含めなかったファイルは現在のバージョンから引き継がれません。",
   "files": "ファイル",
   "uploadColumns": {
    "path": "アセット内のパス",
    "mediaType": "メディアタイプ",
    "size": "サイズ",
    "actions": "削除"
   },
   "mediaTypeGuessed": "ファイル拡張子から推定",
   "removeFile": "このファイルをアップロードから外す",
   "changeNote": "変更メモ",
   "changeNotePlaceholder": "このバージョンでの変更内容",
   "upload": "バージョンをアップロード",
   "uploading": "アップロード中...",
   "uploadCreated": "バージョン {{number}} を作成しました。",
   "uploadUnchanged": "ファイルが現在のバージョン {{number}} と同じため、新しいバージョンは作成されませんでした。",
   "limitSetting": "上限はサーバー設定 {{setting}} で設定されます。",
   "duplicatePath": "このアップロード内の別のファイルが同じパスを使用しています。",
   "pinVersion": "{{name}} バージョン {{version}}",
   "pinCurrent": "{{name}} (現在)",
   "pinsTitle": "アセットの固定",
   "pinsSave": "下書きを保存",
   "pinsSaved": "下書きリビジョン {{number}} にアセットの固定を保存しました。",
   "pinsDraft": "下書きリビジョン {{number}} のアセットの固定を変更します。下書きのその他の内容はそのままです。",
   "pinsNewDraft": "開いている下書きがありません。保存すると、公開済みリビジョン {{number}} からこのアセットの固定で新しい下書きを開始します。",
   "pinsEmpty": "固定されたアセットはありません。",
   "pinAsset": "アセット",
   "pinVersionLabel": "バージョン",
   "chooseAsset": "アセットを選択",
   "assetOption": "{{name}}（{{kind}}）",
   "followCurrent": "現在のバージョン",
   "removePin": "このアセットの固定を削除",
   "addPin": "アセットを追加",
   "editPins": "アセット",
   "pinsNewDraftButton": "新しい下書きでアセットを固定"
  }
 }
});

// Conversation file spaces: the Files tab on Conversation detail, file versions and uploads, and the deployment's file space folder (AD3.8).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "views": {
  "conversationDetail": {
   "tabsLabel": "会話のセクション",
   "tabs": {
    "turns": "ターン",
    "files": "ファイル"
   }
  },
  "runDetail": {
   "fileSpace": "ファイルスペース",
   "openFiles": "ファイルを開く"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "fileSpaceMountPath": "ファイルスペースのフォルダー"
   },
   "hints": {
    "fileSpaceMountPath": "実行のワークスペース内で、開始時に会話の共有ファイルを受け取るフォルダーです。ここでの変更は終了時に書き戻されます。既定値は files です。"
   }
  }
 },
 "errorCodes": {
  "InvalidFilePath": "スラッシュ区切りの相対パスを使用してください。「.」や「..」のセグメントは使用できません。",
  "FileTooLarge": "ファイルが FileSpaces.MaxFileBytes 設定の上限を超えています。",
  "FileSpaceFull": "ファイルスペースが FileSpaces.MaxTotalBytes 設定の上限を超えてしまいます。",
  "TooManyFiles": "ファイルスペースには FileSpaces.MaxFiles 設定の上限までファイルがすでにあります。",
  "StaleFileUpload": "実行がリースを保持していないため、ファイルの変更は書き込まれませんでした。"
 },
 "common": {
  "fieldCodes": {
   "InvalidFilePath": "スラッシュ区切りの相対パスを使用してください。「.」や「..」のセグメントは使用できません。"
  },
  "serverText": {
   "fileSpaceFileTooLarge": "ファイル {{path}} は {{size}} バイトです。上限は {{limit}} バイトです (FileSpaces.MaxFileBytes)。",
   "fileSpaceFull": "ファイルスペースが {{limit}} バイトを超えてしまいます (FileSpaces.MaxTotalBytes)。",
   "fileSpaceTooManyFiles": "ファイルスペースにはすでに {{count}} 個のファイルがあります (FileSpaces.MaxFiles)。",
   "fileNotFound": "ファイル {{path}} が見つかりません。"
  }
 },
 "components": {
  "files": {
   "title": "ファイル",
   "summary": "共有ファイル: {{count}} 個 ({{size}})",
   "live": "ライブ",
   "polling": "定期取得",
   "includeDeleted": "削除済みファイルを表示",
   "refresh": "更新",
   "spaceId": "ファイルスペース {{id}}",
   "emptyTitle": "ファイルはまだありません",
   "emptyBody": "ターンが共有フォルダーに書き込んだファイルや、下でアップロードしたファイルがここに表示されます。",
   "emptyBodyDeleted": "この会話の共有フォルダーには、後で削除されたファイルも含めて、まだ何も書き込まれていません。",
   "columns": {
    "path": "パス",
    "currentVersion": "バージョン",
    "sizeBytes": "サイズ",
    "mediaType": "メディアタイプ",
    "lastUpdateUtc": "更新日時",
    "actions": "操作"
   },
   "deleted": "削除済み",
   "version": "バージョン {{number}}",
   "versions": "バージョン履歴",
   "download": "ダウンロード",
   "deleteLabel": "{{path}} を削除",
   "deletedToast": "{{path}} を削除しました。バージョンは保持されます。",
   "deleteTitle": "ファイルを削除",
   "confirmDelete": "{{path}} を共有ファイルから削除しますか? 以降のターンからは見えなくなります。バージョンは保持され、引き続きダウンロードできます。",
   "versionsTitle": "{{path}} のバージョン",
   "noVersions": "このファイルにはバージョンがありません。",
   "current": "現在",
   "versionColumns": {
    "number": "バージョン",
    "sizeBytes": "サイズ",
    "mediaType": "メディアタイプ",
    "sha256": "SHA-256 ダイジェスト",
    "writtenBy": "書き込み元",
    "createdUtc": "書き込み日時",
    "actions": "操作"
   },
   "preview": "プレビュー",
   "previewTitle": "{{path}} (バージョン {{number}})",
   "emptyFile": "このバージョンは空です。",
   "uploadTitle": "ファイルをアップロード",
   "uploadHint": "ファイルを 1 つ以上選び、パスを確認してください。一覧のファイルと同じパスなら、そのファイルの新しいバージョンになります。一覧の読み込み後にターンがそのファイルを変更していた場合、アップロードは置き換えずに競合名で隣に保存されます。",
   "uploadCreated": "{{path}} をバージョン {{version}} として追加しました。",
   "uploadReplaced": "{{path}} をバージョン {{version}} として保存しました。",
   "uploadConflict": "一覧の読み込み後に {{requested}} が変更されたため、アップロードは {{path}} として保存されました。2 つのファイルを比べて、不要な方を削除してください。",
   "chooseFiles": "アップロードするファイル",
   "uploadColumns": {
    "path": "共有フォルダー内のパス",
    "replaces": "置き換え対象",
    "size": "サイズ",
    "actions": "削除"
   },
   "replacesVersion": "バージョン {{version}}",
   "newFile": "新しいファイル",
   "removeFile": "このファイルをアップロードから外す",
   "upload": "アップロード",
   "uploading": "アップロード中...",
   "limitSetting": "上限はサーバー設定 {{setting}} で設定されます。"
  }
 }
});

// Capability catalog: the Capabilities page, refresh, tool probes on harness profiles, and capabilities on revisions (AD4.8).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "capabilities": {
    "label": "ケイパビリティ",
    "tip": "ケイパビリティカタログ: オーケストレーションを行うエージェントが見つけて使えるエージェント、MCP ツール、ハーネスの組み込みツールを、コストとレイテンシーの目安とともに一覧にします。"
   }
  }
 },
 "enums": {
  "capabilityKind": {
   "Agent": "エージェント",
   "McpTool": "MCP ツール",
   "HarnessBuiltIn": "ハーネスの組み込みツール"
  },
  "capabilityOrigin": {
   "Derived": "派生",
   "Manual": "手動"
  },
  "capabilityHintStatus": {
   "Unknown": "不明",
   "Known": "算出済み"
  },
  "runBlockedReason": {
   "NoToolWorker": "ツールを持つワーカーなし"
  },
  "resourceType": {
   "ConversationFileSpace": "会話のファイルスペース",
   "Capability": "ケイパビリティ"
  }
 },
 "errorCodes": {
  "InvalidJsonSchema": "スキーマが有効な JSON Schema ではありません。入力または出力のスキーマを修正して、もう一度保存してください。",
  "NameConflict": "この名前は別の手動ケイパビリティですでに使われています。別の名前を選んでください。",
  "CapabilityDerived": "このケイパビリティはソースから派生し、ソースに追従するため、ここでは編集も削除もできません。ソースの方を変更してください。",
  "InvalidTags": "タグは 32 個までで、それぞれ 1 から 64 文字にしてください。",
  "TooManyRequirements": "ノードラベルの要件は 16 個までです。"
 },
 "common": {
  "fieldCodes": {
   "InvalidJsonSchema": "有効な JSON Schema ではありません。",
   "InvalidTags": "タグは 32 個までで、それぞれ 1 から 64 文字にしてください。",
   "TooManyRequirements": "ノードラベルの要件は 16 個までです。"
  },
  "serverText": {
   "capabilityDerivedEdit": "ケイパビリティ {{name}} はソースから派生し、ソースに追従します。ソースの方を変更してください。",
   "capabilityDerivedDelete": "ケイパビリティ {{name}} はソースから派生し、ソースとともに消えるため、直接は削除できません。",
   "capabilityShared": "ケイパビリティ {{name}} はすべてのテナントで共有され、組み込みのハーネスプロファイルから来ているため、変更できません。",
   "capabilityNameConflict": "{{name}} という名前の手動ケイパビリティはすでに存在します。",
   "capabilitySecretsDenied": "MCP サーバー {{server}} が送信するシークレットを使用する権限がないため、そのツールは一覧にされませんでした。",
   "capabilityNoStdioWorker": "stdio MCP 診断 (GARRISON_WORKER_MCP_TESTS_ENABLED) を有効にした準備完了のワーカーがないため、stdio サーバーのツールを一覧にできませんでした。",
   "capabilityRefreshFailed": "{{when}} に更新に失敗しました: {{error}}",
   "capabilityMissingTools": "必要なツールがありません: {{tools}}。",
   "capabilityProbeShadowed": "ワーカーは {{name}} を {{probe}} としてプローブします。これは別のハーネスプロファイルが先に定義したものです。このプロファイルの定義はプローブされません。"
  }
 },
 "components": {
  "blocked": {
   "reasons": {
    "NoToolWorker": "この実行のエージェントは {{tools}} を使いますが、{{harness}} を実行できる準備完了のワーカーでそれを報告しているものはありません。ワーカーのホストにツールをインストールしてプローブがノードラベル garrison.io/tool-{name}=true を報告するようにするか、ワーカーにそのラベルを手動で追加してください。"
   }
  },
  "revisions": {
   "columns": {
    "capabilities": "ケイパビリティ"
   }
  },
  "capabilities": {
   "noSource": "手動のエントリー",
   "shared": "共有",
   "hintsLine": "中央値 {{median}}、p90 {{p90}}、1 回の実行あたり {{cost}}",
   "hintsLineNoCost": "中央値 {{median}}、p90 {{p90}}、コストの記録なし",
   "hintsTitle": "コストとレイテンシーの目安",
   "noCost": "コストの記録なし",
   "windowDays_one": "{{count}} 日",
   "windowDays_other": "{{count}} 日",
   "refreshWarning": "このエントリーのソースの前回の更新に失敗しました。",
   "requirementsTitle": "実行に必要なノードラベル",
   "noRequirements": "なし。このケイパビリティを使う実行は、どのワーカーにも割り当てられます。",
   "noSchema": "スキーマなし",
   "fields": {
    "kind": "種類",
    "origin": "由来",
    "source": "ソース",
    "lastRefreshedUtc": "最終更新",
    "tags": "タグ",
    "id": "ID",
    "summary": "概要",
    "hintStatus": "状態",
    "sampleSize": "集計した実行数",
    "medianDurationMs": "所要時間の中央値",
    "p90DurationMs": "所要時間の p90",
    "meanCostUsd": "平均コスト",
    "windowDays": "集計期間",
    "computedUtc": "算出日時",
    "inputSchema": "入力スキーマ",
    "outputSchema": "出力スキーマ"
   },
   "refreshTitle": "ケイパビリティカタログを更新",
   "refreshHint": "Garrison はエージェントとハーネスの組み込みツールのエントリーを派生し直し、各 MCP サーバーのツールを一覧にし (stdio サーバーは stdio 診断を有効にしたワーカー経由)、エージェントの目安を再計算します。サーバーを一覧にすると、そのテンプレートが参照するシークレットがサーバーに送信されるため、それらを使用する権限が必要です。",
   "refreshServer": "一覧にする MCP サーバー",
   "refreshAll": "有効なすべての MCP サーバー",
   "refreshRun": "今すぐ更新",
   "refreshing": "更新中...",
   "refreshDone": "ケイパビリティカタログは最新です。",
   "refreshPartial_one": "カタログを更新しましたが、{{count}} 個の MCP サーバーを一覧にできませんでした。",
   "refreshPartial_other": "カタログを更新しましたが、{{count}} 個の MCP サーバーを一覧にできませんでした。",
   "refresh": {
    "agents": "変更されたエージェントのエントリー",
    "harnessBuiltIns": "変更された組み込みツールのエントリー",
    "hints": "再計算した目安",
    "servers": "一覧にした MCP サーバー",
    "tools": "書き込んだツールのエントリー",
    "removed": "削除したツールのエントリー",
    "failed": "失敗したサーバー",
    "noServers": "一覧にした MCP サーバーはありません。",
    "failedBadge": "失敗",
    "listedBadge": "一覧取得済み",
    "columns": {
     "server": "MCP サーバー",
     "status": "結果",
     "tools": "ツール",
     "removed": "削除",
     "warned": "警告付きで保持",
     "error": "エラー"
    }
   },
   "errors": {
    "nameLength": "1 から {{max}} 文字にしてください。",
    "summaryLength": "{{max}} 文字以内にしてください。",
    "tags": "タグは {{max}} 個までで、それぞれ 1 から {{length}} 文字にしてください。",
    "requirementCount": "ノードラベルの要件は {{max}} 個までです。",
    "requirement": "各要件には 1 から {{max}} 文字のノードラベルのキーが必要です。",
    "toolNeedsServer": "ツールが属する MCP サーバーを選んでください。",
    "probeCount": "ハーネスプロファイルのツールプローブは {{max}} 個までです。",
    "probeName": "ツール名は 1 から 63 文字の英小文字、数字、ドット、ハイフンで、英小文字か数字で始めてください。",
    "probeDuplicate": "このプロファイルには {{name}} という名前のプローブがすでにあります。",
    "probeExecutable": "実行ファイルは PATH 上で見つかるファイル名だけ (英字、数字、ドット、アンダースコア、プラス記号、ハイフン) を指定し、フォルダーは含めないでください。",
    "probeArgument": "引数なしか、{{allowed}} のいずれかを選んでください。",
    "probeDescription": "{{max}} 文字以内にしてください。"
   },
   "draftTitle": "ケイパビリティ",
   "draftSave": "下書きを保存",
   "draftSaved": "下書きリビジョン {{number}} にケイパビリティを保存しました。",
   "draftEdit": "下書きリビジョン {{number}} のケイパビリティを変更します。下書きのその他の内容はそのままです。",
   "draftNew": "開いている下書きがありません。保存すると、公開済みリビジョン {{number}} からこれらのケイパビリティで新しい下書きを開始します。",
   "draftPlacementHint": "ここで指定したハーネスの組み込みツールは、このエージェントの実行にそのノードラベルを追加します。そのため実行は、そのツールを報告したワーカーにだけ割り当てられます。",
   "draftEmpty": "このリビジョンはケイパビリティを使用しません。",
   "notInCatalog": "カタログにありません",
   "removeName": "{{name}} を削除",
   "chooseName": "ケイパビリティを選択",
   "nameOption": "{{name}}（{{kinds}}）",
   "addName": "ケイパビリティを追加",
   "newDraftButton": "新しい下書きでケイパビリティを選ぶ",
   "editDraft": "ケイパビリティ"
  }
 },
 "resources": {
  "capabilities": {
   "title": "ケイパビリティ",
   "subtitle": "オーケストレーションを行うエージェントが見つけて使えるエージェント、MCP ツール、ハーネスの組み込みツールを、コストとレイテンシーの目安とともに表示します。",
   "add": "ケイパビリティを追加",
   "create": "ケイパビリティを作成",
   "edit": "ケイパビリティを編集",
   "view": "ケイパビリティの詳細",
   "deleteTitle": "ケイパビリティを削除",
   "emptyTitle": "ケイパビリティはまだありません",
   "emptyBody": "エージェントのリビジョンを公開するか、MCP サーバーを登録するか、ハーネスプロファイルにツールプローブを追加してから、更新してください。手動のエントリーを追加することもできます。",
   "columns": {
    "name": "名前",
    "kind": "種類",
    "origin": "由来",
    "summary": "概要",
    "source": "ソース",
    "hints": "目安",
    "tags": "タグ",
    "lastRefreshedUtc": "最終更新",
    "id": "ID",
    "createdUtc": "作成日時"
   },
   "fields": {
    "name": "名前",
    "kind": "種類",
    "summary": "概要",
    "sourceAgentId": "対応するエージェント",
    "sourceMcpServerId": "所属する MCP サーバー",
    "sourceToolName": "そのサーバー上のツール名",
    "tags": "タグ",
    "requirements": "実行に必要なノードラベル",
    "inputSchema": "入力スキーマ",
    "outputSchema": "出力スキーマ"
   },
   "hints": {
    "kind": "手動のエントリーはどの種類にもできます。たとえば、エージェントがスキル経由で利用する変換サービスなどです。",
    "requirements": "このケイパビリティを使うエージェントの実行は、これらのノードラベルをすべて持つワーカーにだけ割り当てられます。",
    "sourceMcpServerId": "省略可能。サーバーを指定したエントリーは、デプロイメントがそのサーバーを結び付けている場合にだけ実行トークンから見えます。",
    "inputSchema": "JSON Schema。例: {\"type\": \"object\"}。ケイパビリティが自由形式のテキストを受け取る場合は空のままにしてください。"
   },
   "tagFilter": "タグ",
   "refresh": "更新",
   "warningBadge": "更新に失敗",
   "warnings_one": "{{count}} 件のエントリーは、ソースの前回の更新に失敗したため、最後に正常だった内容を保持しています。開くと理由を確認できます。",
   "warnings_other": "{{count}} 件のエントリーは、ソースの前回の更新に失敗したため、最後に正常だった内容を保持しています。いずれかを開くと理由を確認できます。",
   "noSourceOption": "なし",
   "requirementKey": "ノードラベル",
   "requirementValue": "値"
  },
  "harnessProfiles": {
   "fields": {
    "toolProbes": "ツールプローブ",
    "probeName": "ツール名",
    "probeExecutable": "実行ファイル",
    "probeArgument": "引数",
    "probeDescription": "説明"
   },
   "columns": {
    "toolProbes": "ツールプローブ"
   },
   "hints": {
    "toolProbes": "ワーカーのホストにあればこのハーネスが使えるツールです。ワーカーは登録前に各プローブを実行し、応答したツールをノードラベル garrison.io/tool-{name}=true として報告します。"
   },
   "addToolProbe": "ツールプローブを追加",
   "probeNoArgument": "引数なし"
  }
 }
});

// Fan-out groups in the run tree of Run detail: status, join policy, budget, members, and Cancel group (AD5.8).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "enums": {
  "fanOutGroupStatus": {
   "Running": "実行中",
   "Joined": "合流済み",
   "TimedOut": "タイムアウト",
   "BudgetExceeded": "予算超過",
   "Cancelled": "キャンセル済み"
  },
  "fanOutJoinPolicy": {
   "All": "すべて",
   "Any": "いずれか",
   "Quorum": "定足数"
  },
  "resourceType": {
   "FanOutGroup": "ファンアウトグループ"
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "ファンアウトグループ"
  }
 },
 "components": {
  "fanOut": {
   "group": "ファンアウトグループ",
   "groupTitle": "ファンアウトグループ {{id}}",
   "otherChildren": "その他の子の実行",
   "detailsUnavailable": "グループの詳細を読み込めなかったため、メンバーの実行だけを表示しています。",
   "policy": "合流ポリシー",
   "quorumPolicy": "{{policy}}: {{total}} 件中 {{quorum}} 件",
   "progress": "進捗",
   "progressValue": "{{total}} 件中 {{finished}} 件終了、{{succeeded}} 件成功",
   "cost": "コスト",
   "tokens": "トークン",
   "usedOf": "{{limit}} 中 {{used}}",
   "noLimit": "{{used}} (上限なし)",
   "deadline": "期限",
   "noDeadline": "なし",
   "started": "開始",
   "completed": "終了",
   "pending": "まだ実行中: {{labels}}",
   "failed": "成功しなかったメンバー: {{labels}}",
   "live": "ライブ",
   "polling": "定期取得",
   "cancel": "グループをキャンセル",
   "cancelTitle": "ファンアウトグループをキャンセル",
   "confirmCancel": "ファンアウトグループ {{id}} をキャンセルしますか? 実行中のメンバーはキャンセルされ、親の実行にはグループがキャンセル済みとして見えます。",
   "cancelledToast": "ファンアウトグループ {{id}} をキャンセルしました。",
   "columns": {
    "label": "ラベル",
    "agent": "エージェント",
    "status": "ステータス",
    "costUsd": "コスト",
    "tokens": "トークン",
    "run": "実行"
   }
  }
 },
 "common": {
  "serverText": {
   "fanOutParentEnded": "親の実行が終了したか、キャンセルされました。",
   "fanOutCostExceeded": "メンバーが {{cost}} USD を使い、予算 {{budget}} USD を超えました。",
   "fanOutTokensExceeded": "メンバーが {{tokens}} トークンを使い、予算 {{budget}} を超えました。",
   "fanOutTimedOut": "グループのタイムアウト {{seconds}} 秒が経過し、{{running}} 件のメンバーがまだ実行中でした。",
   "fanOutAnySucceeded": "メンバーの 1 件が成功しました。",
   "fanOutNoneSucceeded": "すべてのメンバーが終了し、成功したものはありませんでした。",
   "fanOutQuorumMet": "{{succeeded}} 件のメンバーが成功し、定足数 {{quorum}} に達しました。",
   "fanOutQuorumUnreachable": "失敗したメンバーが多すぎて、定足数 {{quorum}} に達することができません。",
   "fanOutAllFinished": "すべてのメンバーが終了しました。",
   "fanOutCancelledByTool": "親の実行が garrison_cancel_fan_out でキャンセルしました。",
   "fanOutCancelledBy": "{{who}} がキャンセルしました。"
  }
 }
});

// Agentic apps: the Apps tab, its editor, graph, link, delegation, revisions, and promotion (AD6.11).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "apps": {
    "label": "アプリ",
    "tip": "エージェント型アプリ: エンドユーザー向けの 1 つのチャット UI の背後で動くエージェントのグループと、その呼び出しグラフ、委任、リビジョン、共有できる URL。"
   }
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "テナントのユーザー",
   "AppUsers": "アプリのユーザー",
   "Anonymous": "匿名"
  },
  "resourceType": {
   "AgenticApp": "エージェント型アプリ"
  }
 },
 "errorCodes": {
  "AppSlugTaken": "この URL スラッグは別のアプリが使用しています。スラッグはクラスター全体で一意のため、別のものを選んでください。",
  "NoPublishedRevision": "使用できる公開済みリビジョンがありません。先に公開してください。",
  "AgentInUse": "このエージェントはエージェント型アプリのメンバーです。先にアプリから外してください。"
 },
 "common": {
  "fieldCodes": {
   "InvalidName": "小文字、数字、ハイフンを 1 から 64 文字で使い、先頭と末尾は文字か数字にしてください。",
   "InvalidSlug": "小文字、数字、ハイフンを 2 から 63 文字で使い、先頭は文字か数字にしてください。",
   "UnknownAgent": "このテナントにそのエージェントはありません。",
   "DuplicateMember": "各エージェントはメンバーに 1 回しか追加できません。",
   "EntryNotMember": "エントリーエージェントはメンバーのいずれかである必要があります。",
   "EdgeNotMember": "呼び出しの両端はどちらもアプリのメンバーである必要があります。",
   "SelfEdge": "メンバーは自分自身を呼び出せません。",
   "AppGraphCycle": "メンバー間の呼び出しが循環しています。ループ内の呼び出しを 1 つ削除してください。",
   "UnreachableMember": "すべてのメンバーに、エントリーエージェントから呼び出しをたどって到達できる必要があります。",
   "UnreachableMemberNamed": "エントリーエージェントは呼び出しをたどって次のメンバーに到達できません: {{names}}。それぞれへの呼び出しを追加するか、メンバーから外してください。",
   "UnknownEnvironment": "この環境はテナントに存在しません。",
   "InvalidEntryDeployment": "この環境にあるエントリーエージェントのデプロイメントを選んでください。",
   "DuplicateEnvironment": "各環境は 1 回だけ指定してください。",
   "InvalidColor": "#RRGGBB 形式の色を指定してください (例: #1F6FEB)。",
   "UnknownAsset": "このテナントにそのエージェントのアセットはありません。",
   "Required": "この項目は必須です。",
   "TooMany": "項目が多すぎます。"
  },
  "serverText": {
   "appNameConflict": "{{name}} という名前のアプリはすでに存在します。",
   "appSlugTaken": "URL スラッグ {{slug}} は使用されています。スラッグはクラスター全体で一意のため、別のものを選んでください。",
   "appNoPublishedRevision": "アプリ {{name}} には昇格できる公開済みリビジョンがありません。",
   "appMemberNotPublished": "メンバー {{name}} には固定できる公開済みリビジョンがありません。先に公開してください。",
   "appRevisionPublished": "アプリ {{name}} のリビジョン {{number}} はすでに公開されています。",
   "appNoTargetDeployments": "メンバー {{member}} には環境 {{environment}} のデプロイメントがありません。先にそこで作成してください。何も昇格していません。",
   "agentInApps": "エージェント {{agent}} は {{apps}} のメンバーです。先にアプリから外してください。"
  }
 },
 "components": {
  "form": {
   "pickColor": "{{field}} の色を選ぶ"
  },
  "apps": {
   "graph": {
    "empty": "メンバーを追加すると、アプリのグラフが表示されます。",
    "summary": "メンバー {{members}} 件、呼び出し {{edges}} 件のアプリのグラフ",
    "edgeFanOut": "{{caller}} が {{callee}} を呼び出します。複数同時の呼び出しも可能です",
    "edgeSingle": "{{caller}} が {{callee}} を呼び出します。呼び出しは一度に 1 件です",
    "entryNode": "{{name}} (エントリーエージェント)",
    "unreachableNode": "{{name}} (エントリーエージェントから到達できません)",
    "entry": "エントリーエージェント",
    "unreachable": "到達不可",
    "legendFanOut": "並列呼び出し可",
    "legendSingle": "一度に 1 件の呼び出し"
   },
   "share": {
    "noSlug": "リンクを取得するには、アプリに名前か URL スラッグを付けてください。",
    "open": "開く",
    "copy": "アプリの URL をコピー",
    "inactive": "アプリが無効のため、再び有効にするまでリンクは機能しません。",
    "signIn": {
     "TenantUsers": "このテナントの有効なユーザーなら誰でもサインインできます。",
     "AppUsers": "このアプリで AppUser ロールを持つユーザーだけがサインインできます。",
     "Anonymous": "リンクを知っている人は誰でもサインインせずにアプリを使えます。サインインしたユーザーも引き続き使えます。",
     "AnonymousDisabled": "匿名が選択されていますが有効になっていません。そのため、サインインしないと誰も利用できず、サインインできるのはアクセス権を持つテナントのユーザーだけです。"
    }
   },
   "delegation": {
    "title": "アプリのグラフに基づく委任",
    "intro": "アプリの呼び出しがそのまま委任ポリシーになります。各メンバーは自分が呼び出すメンバーだけを許可し、その下にある最長の呼び出しの連なりをカバーする最大深度を持つ必要があります。公開済みリビジョンがこれと異なるメンバーはずれが生じています。",
    "apply": "下書きを書き込む",
    "applying": "下書きを書き込んでいます...",
    "applied": "下書きリビジョンを {{drafts}} 件書き込みました。{{skipped}} 件のメンバーはスキップしました。",
    "appliedSummary": "下書きリビジョンを {{drafts}} 件書き込みました。公開したものはありません。{{skipped}} 件のメンバーはスキップしました。各エージェントの「リビジョン」タブで下書きを確認して公開してください。",
    "drifting_one": "{{count}} 件のメンバーの公開済みの委任がグラフと異なります。",
    "drifting_other": "{{count}} 件のメンバーの公開済みの委任がグラフと異なります。",
    "inSync": "すべてのメンバーの公開済みの委任がグラフと一致しています。",
    "empty": "このアプリにはメンバーがいません。",
    "notPublished": "未公開",
    "drift": "ずれあり",
    "inSyncBadge": "一致",
    "draftConflict": "下書きの競合",
    "draft": "下書き {{number}}",
    "review": "下書きはまだ反映されていません。各エージェントを開き、「リビジョン」タブで下書きを確認して公開してください。",
    "columns": {
     "member": "メンバー",
     "desiredMode": "グラフのモード",
     "desiredAllowList": "グラフの許可リスト",
     "desiredMaxDepth": "グラフの深度",
     "publishedMode": "公開済みのモード",
     "publishedAllowList": "公開済みの許可リスト",
     "publishedMaxDepth": "公開済みの深度",
     "status": "状態"
    }
   },
   "revisions": {
    "title": "アプリのリビジョン",
    "intro": "アプリのリビジョンは、各メンバーの最新の公開済みリビジョンを固定し、メンバー間の呼び出しをコピーします。公開してから昇格すると、すべてのメンバーがまとめて次の環境に移ります。",
    "changeNote": "変更メモ",
    "changeNotePlaceholder": "前回のリビジョンからの変更内容",
    "take": "リビジョンを作成",
    "taking": "作成中...",
    "taken": "アプリのリビジョン {{number}} を作成しました。",
    "published": "アプリのリビジョン {{number}} を公開しました。",
    "empty": "アプリのリビジョンはまだありません。すべてのメンバーに公開済みリビジョンができたら作成してください。",
    "promote": "昇格",
    "publish": "公開",
    "publishTitle": "アプリのリビジョン {{number}} を公開",
    "publishConfirm": "{{name}} のリビジョン {{number}} を公開しますか? 公開済みのリビジョンは変更できず、昇格で既定に使われるリビジョンになります。",
    "pin": "{{name}}（リビジョン {{number}}）",
    "columns": {
     "number": "リビジョン",
     "state": "状態",
     "members": "固定したメンバー",
     "edges": "呼び出し",
     "author": "作成者",
     "changeNote": "変更メモ",
     "publishedUtc": "公開日時",
     "actions": "操作"
    }
   },
   "promote": {
    "title": "アプリを昇格",
    "intro": "各メンバーの固定されたリビジョンを、昇格先の環境にあるそのメンバーのすべてのデプロイメントに一度に適用します。そこにデプロイメントがないメンバーが 1 つでもあれば、何も移動しません。",
    "revision": "アプリのリビジョン",
    "latestRevision": "最新の公開済み",
    "promoted": "アプリを {{target}} に昇格しました。更新されたデプロイメント: {{deployments}}。",
    "denied": "{{target}} への昇格は許可されていません。昇格には、昇格先の環境の「昇格」に対する「実行」権限が必要です。"
   }
  }
 },
 "resources": {
  "apps": {
   "title": "アプリ",
   "subtitle": "エンドユーザー向けの 1 つのチャット UI の背後で動くエージェントのグループです。エントリーエージェントが人と対話し、アプリの呼び出しに沿って他のメンバーを呼び出します。",
   "add": "アプリを追加",
   "create": "アプリを作成",
   "edit": "アプリを編集",
   "view": "アプリの詳細",
   "deleteTitle": "アプリを削除",
   "emptyTitle": "アプリはまだありません",
   "emptyBody": "既存のエージェントからアプリを作成します。メンバー、人と対話するエントリーエージェント、どのメンバーがどれを呼び出すかを選んでください。",
   "columns": {
    "name": "名前",
    "url": "アプリの URL",
    "entryAgentId": "エントリーエージェント",
    "members": "メンバー",
    "liveEnvironment": "稼働中の環境",
    "authMode": "サインイン",
    "active": "状態",
    "description": "説明",
    "id": "アプリ ID",
    "lastUpdateUtc": "更新日時",
    "createdUtc": "作成日時"
   },
   "fields": {
    "name": "名前",
    "slug": "URL スラッグ",
    "description": "説明",
    "active": "有効",
    "members": "メンバー",
    "membersItems": {
     "agentId": "エージェント",
     "role": "役割"
    },
    "entryAgentId": "エントリーエージェント",
    "edges": "メンバー間の呼び出し",
    "edgesItems": {
     "callerAgentId": "呼び出し元",
     "calleeAgentId": "呼び出し先",
     "fanOutAllowed": "並列呼び出しを許可"
    },
    "graph": "グラフ",
    "environments": "環境ごとのエントリーデプロイメント",
    "environmentsItems": {
     "environment": "環境",
     "deploymentId": "エントリーデプロイメント"
    },
    "liveEnvironment": "稼働中の環境",
    "authMode": "アプリを使用できる人",
    "anonymousEnabled": "匿名での使用を許可",
    "showOperatorDetail": "ツール呼び出しと思考をエンドユーザーに表示",
    "share": "共有リンク",
    "displayName": "表示名",
    "logoAssetId": "ロゴ",
    "primaryColor": "メインカラー",
    "accentColor": "アクセントカラー",
    "welcomeText": "ウェルカムテキスト"
   },
   "hints": {
    "slug": "アプリは /apps/{slug}/ で公開されます。空のままにすると名前を使います。スラッグはクラスター全体で一意です。",
    "members": "アプリに含めるエージェントです。役割には、それぞれが何をするかを短く記入します。",
    "entryAgentId": "エンドユーザーと対話するメンバーです。他のすべてのメンバーにここから到達できる必要があります。",
    "edges": "どのメンバーがどれを呼び出せるかを指定します。呼び出しはループになってはならず、各メンバーの委任ポリシーになります。",
    "environments": "各環境でアプリが使う、エントリーエージェントのデプロイメントです。指定しない場合は、その環境にあるエントリーエージェントの有効なデプロイメントのうち、名前順で最初のものを使います。",
    "liveEnvironment": "アプリの UI が通信する環境です。",
    "anonymousEnabled": "匿名のサインインに必要です。匿名のセッションは短時間で、レート制限があります。",
    "showOperatorDetail": "エンドユーザーには回答、結果、エラーが常に表示されます。オンにすると、ツール呼び出し、思考、進行状況も表示します。",
    "logoAssetId": "アセットの現在のバージョンにある最初の画像です。",
    "welcomeText": "エンドユーザーが最初のメッセージを送る前に表示されます。"
   },
   "steps": {
    "general": "アプリ",
    "members": "メンバーと呼び出し",
    "environments": "環境",
    "access": "サインインとリンク",
    "branding": "ブランディング"
   },
   "actions": {
    "delegation": "委任",
    "revisions": "リビジョンと昇格"
   },
   "errors": {
    "nameTaken": "このテナントの別のアプリがすでにこの名前を使用しています。"
   },
   "addMember": "メンバーを追加",
   "addEdge": "呼び出しを追加",
   "addEnvironment": "環境を追加",
   "chooseAgent": "エージェントを選択",
   "chooseEntry": "メンバーを選択",
   "rolePlaceholder": "このメンバーの役割",
   "noEntryDeployment": "最初の有効なデプロイメント",
   "noLogo": "ロゴなし",
   "displayNamePlaceholder": "アプリのヘッダーに表示されます"
  }
 }
});

// Agent studio: the Studio tab, the draft workspace, the architect dialogs, the playground, the compile preview, and the architect prompt panel (AD7.10, AD7.16, AD9.2, AD9.3).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "studio": {
    "label": "スタジオ",
    "tip": "エージェントスタジオ：エージェントアーキテクトと一緒に下書きでエージェントやアプリを設計し、プレイグラウンドで試し、下書きの適用を依頼します。"
   }
  }
 },
 "enums": {
  "resourceType": {
   "StudioDraft": "スタジオの下書き"
  },
  "approvalKind": {
   "DraftApply": "下書きの適用"
  },
  "studioDraftStatus": {
   "Open": "編集可能",
   "PendingApproval": "承認待ち",
   "Applied": "適用済み",
   "Discarded": "破棄済み"
  },
  "studioDraftOperation": {
   "Upsert": "作成または更新",
   "Delete": "削除"
  },
  "studioDiffChange": {
   "Create": "作成",
   "Update": "更新",
   "Delete": "削除",
   "Unchanged": "変更なし",
   "Failed": "失敗"
  }
 },
 "errorCodes": {
  "DraftVersionConflict": "読み込んだ後に下書きが変更されました。もう一度読み込んでから再試行してください。",
  "DraftNotOpen": "この下書きは編集可能な状態ではないため、変更できません。編集できるのは編集可能な下書きだけです。",
  "DraftStale": "下書きの基になったライブ構成が変更されました。古くなった項目をリベースしてから、もう一度適用を依頼してください。",
  "DraftInvalid": "下書きに検証に通らないドキュメントがあります。まず「失敗」と表示された項目を修正してください。",
  "DraftEmpty": "下書きに項目がないため、適用するものがありません。",
  "ApproverLacksPermission": "この下書きを許可する権限がありません。許可するには、Manifest に対する作成権限と、下書きが削除する各種類に対する削除権限が必要です。",
  "AgentNotLive": "そのエージェントはこの下書きで新しく追加されたものです。プレイグラウンドで試す前に下書きを適用してください。",
  "NotAnArchitectDeployment": "アーキテクトプロンプトを使えるのはアーキテクトのデプロイメント（agent-architect のデプロイメント、または下書きへのアクセス権を持つデプロイメント）だけです。",
  "InvalidArchitectPrompt": "そのプロンプトはアーキテクトプロンプトにできません。このテナントの System テンプレートを選んでください。",
  "PromptTemplateInUse": "このプロンプトテンプレートはデプロイメントで使われています。先にそれらを別のテンプレートに切り替えてください。",
  "ReservedEnvironment": "draft 環境はプレイグラウンド用に予約されています。",
  "NoDeploymentInEnvironment": "このエージェントにはその環境のデプロイメントがありません。"
 },
 "views": {
  "studio": {
   "title": "スタジオ",
   "subtitle": "下書きでエージェントとアプリを設計します。下書きの適用を人が承認するまで、ライブ構成は何も変わりません。",
   "newDraft": "新しい下書き",
   "refresh": "更新",
   "search": "タイトルを検索",
   "scopeLabel": "対象の下書き",
   "scopes": {
    "mine": "自分の下書き",
    "all": "すべて"
   },
   "statusLabel": "状態",
   "columns": {
    "title": "タイトル",
    "status": "状態",
    "owner": "所有者",
    "targetApp": "対象アプリ",
    "items": "項目",
    "version": "バージョン",
    "updated": "更新日時"
   },
   "open": "開く",
   "discard": "破棄",
   "discardTitle": "下書きを破棄",
   "discardMessage": "{{title}} を破棄しますか？破棄した下書きは変更も適用もできなくなります。",
   "discardPendingMessage": "{{title}} を破棄しますか？適用の承認は取り消され、下書きは変更も適用もできなくなります。",
   "discarded": "{{title}} を破棄しました。",
   "emptyTitle": "下書きはありません",
   "emptyBody": "空の状態または既存のアプリから下書きを始め、エージェントアーキテクトと一緒に設計しましょう。",
   "emptyFiltered": "この絞り込み条件に一致する下書きはありません。",
   "untitled": "無題の下書き"
  },
  "studioDraft": {
   "title": "スタジオの下書き",
   "notFoundTitle": "下書きが見つかりません",
   "notFoundBody": "この下書きは存在しないか、読み取る権限がありません。",
   "back": "下書きの一覧",
   "version": "バージョン {{version}}",
   "live": "ライブ",
   "polling": "ポーリング中",
   "architect": "アーキテクト",
   "tabsLabel": "下書きのワークスペース",
   "tabs": {
    "architect": "アーキテクト",
    "items": "項目",
    "graph": "グラフ",
    "apply": "差分と適用",
    "playground": "プレイグラウンド",
    "preview": "コンパイルのプレビュー",
    "prompts": "アーキテクトプロンプト"
   },
   "notOpen": {
    "PendingApproval": "この下書きは適用の判断を待っているため、変更できません。再び変更するには、承認を拒否するか下書きを破棄してください。",
    "Applied": "この下書きはライブ構成に適用済みで、これ以上変更できません。さらに変更するには新しい下書きを始めてください。",
    "Discarded": "この下書きは破棄されたため、これ以上変更できません。",
    "other": "この下書きは現在変更できません。"
   },
   "liveNotice": "下書きがバージョン {{version}}（{{status}}）になりました。",
   "liveChanged": "変更された項目：{{items}}。",
   "removedTag": "削除済み",
   "dismissNotice": "閉じる"
  }
 },
 "components": {
  "studio": {
   "newDraft": {
    "title": "新しい下書き",
    "intro": "下書きには、あなたとエージェントアーキテクトが編集するマニフェストドキュメントが入ります。空の状態から始めるか、既存のアプリとそれが参照するものすべてから始めます。",
    "titleField": "タイトル",
    "titlePlaceholder": "ライター付きのリサーチアプリ",
    "fromApp": "元にするアプリ",
    "emptyDraft": "空の下書き",
    "fromAppHint": "アプリ、そのメンバー、それらのデプロイメント、プロンプト、アセットが項目になります。各項目は元にしたライブのバージョンを覚えているため、スタジオは後からの変更に気付けます。",
    "create": "下書きを作成",
    "creating": "作成中...",
    "created": "下書き {{title}} を開始しました。"
   },
   "architect": {
    "title": "新しいアーキテクト",
    "intro": "エージェントアーキテクトはあなたの下書きの中でエージェントとアプリを設計します。ハーネスプロファイル、モデル、使用するプロンプトを指定したデプロイメントを用意してください。アーキテクトが編集するのはあなたの下書きだけで、適用は決して行いません。",
    "name": "デプロイメント名",
    "harnessProfile": "ハーネスプロファイル",
    "chooseProfile": "ハーネスプロファイルを選択",
    "model": "モデル",
    "modelHint": "空のままにすると、ハーネスプロファイルの既定のモデルを使います。",
    "prompt": "アーキテクトプロンプト",
    "defaultPrompt": "{{name}}（既定）",
    "preview": "プロンプトのプレビュー",
    "previewEmpty": "プロンプトを選ぶと、レンダリング結果が表示されます。",
    "cloneLink": "このプロンプトを複製して変更する",
    "noAgent": "このテナントには {{name}} という名前のエージェントがないため、アーキテクトを作成できません。管理者に問い合わせてください。",
    "create": "アーキテクトを作成",
    "creating": "作成中...",
    "created": "アーキテクト {{name}} を作成しました。"
   },
   "chat": {
    "title": "アーキテクト",
    "architect": "アーキテクトのデプロイメント",
    "chooseArchitect": "アーキテクトを選択",
    "newArchitect": "新しいアーキテクト",
    "noArchitect": "アーキテクトのデプロイメントはまだありません。エージェントアーキテクトと設計するには、まず作成してください。",
    "openConversation": "会話を開く",
    "newConversation": "新しい会話",
    "you": "あなた",
    "architectSays": "アーキテクト",
    "openRun": "実行",
    "thinking": "作業中...",
    "empty": "何を作るかをアーキテクトに伝えてください。最初のメッセージで、どの下書きで作業するかが伝わります。",
    "pickFirst": "始めるには、アーキテクトを選ぶか作成してください。",
    "message": "メッセージ",
    "placeholder": "リサーチアプリを設計して：2 人のリサーチャーとライター 1 人に作業を分配するプランナー。",
    "firstHint": "この下書きについて、このアーキテクトとの会話を始めます。",
    "continueHint": "会話を続けます。Ctrl+Enter または Cmd+Enter で送信します。",
    "send": "送信"
   },
   "items": {
    "title": "項目",
    "titleCount": "項目（{{total}}）",
    "add": "項目を追加",
    "addConfirm": "エディターを開く",
    "columns": {
     "kind": "種類",
     "name": "名前",
     "operation": "操作",
     "stale": "古い",
     "updated": "更新日時"
    },
    "stale": "古い",
    "empty": "まだ項目はありません。追加するか、アーキテクトに依頼してください。",
    "remove": "削除",
    "removeTitle": "項目を削除",
    "removeMessage": "{{item}} を下書きから削除しますか？ライブ構成は変わりません。",
    "removed": "{{item}} を削除しました。",
    "saved": "{{item}} を保存しました。下書きはバージョン {{version}} です。",
    "editorTitle": "{{item}} を編集",
    "newEditorTitle": "新しい項目 {{item}}",
    "document": "マニフェストドキュメント",
    "versionHint": "保存時には、読み込んだバージョン {{version}} を送信します。その後に下書きが変更されていた場合は保存が拒否されますが、入力したテキストはここに残ります。",
    "unsaved": "未保存の変更",
    "errors": {
     "name": "英字、数字、ドット、スラッシュ、ハイフンを使い、英字か数字で始めてください。",
     "exists": "下書きにはすでに {{kind}}/{{name}} があります。",
     "deleteKind": "削除できるのは Agent、Deployment、Pipeline、AgenticApp の項目だけで、{{kind}} は削除できません。"
    },
    "conflict": {
     "title": "編集中に下書きが変更されました：バージョン {{from}} は現在 {{to}} です。",
     "added": "追加：{{items}}",
     "updated": "編集：{{items}}",
     "removed": "削除：{{items}}",
     "status": "現在の状態は {{status}} です。",
     "layout": "変わったのはグラフのレイアウトだけです。",
     "mine": "編集中の項目も変更されています。もう一度保存する前に、自分のテキストと新しいバージョンを比べてください。",
     "retry": "テキストはエディターに残っています。新しいバージョンに反映するには、もう一度保存してください。",
     "dismiss": "閉じる"
    }
   },
   "graph": {
    "title": "グラフ",
    "empty": "下書きには、まだ描画できるアプリやエージェントがありません。",
    "depth": "深さ {{depth}}",
    "entryAgent": "入口エージェント：{{name}}",
    "deleted": "削除予定",
    "inDraft": "下書き内",
    "loose": "どのアプリにも属さないエージェント",
    "capabilities": "対応機能：{{list}}",
    "legend": "各呼び出しには、必要な委任の深さがラベル表示されます。実線は並列呼び出しを許可し、破線は一度に 1 回の呼び出しを表します。対応機能はエージェント名の下に表示されます。"
   },
   "diff": {
    "title": "差分と適用",
    "refresh": "差分を更新",
    "validate": "検証",
    "validating": "検証中...",
    "requestApply": "適用を依頼",
    "requesting": "依頼中...",
    "requested": "適用を依頼しました。マニフェストを適用できる人が判断します。",
    "valid": "有効：作成 {{create}}、更新 {{update}}、削除 {{delete}}、変更なし {{unchanged}}。",
    "invalid": "無効：失敗 {{failed}}、古い項目 {{stale}}。予定：作成 {{create}}、更新 {{update}}、削除 {{delete}}、変更なし {{unchanged}}。",
    "validOk": "下書きは有効です。",
    "validFailed": "下書きは無効です。「失敗」または「古い」と表示された項目を確認してください。",
    "empty": "下書きに比較する項目がありません。",
    "columns": {
     "item": "項目",
     "change": "変更",
     "details": "詳細"
    },
    "none": "（なし）",
    "approval": "適用の承認",
    "allow": "許可",
    "deny": "拒否",
    "allowed": "許可しました。下書きを適用しています。",
    "denied": "拒否しました。下書きは再び編集可能になりました。",
    "reason": "理由",
    "reasonPlaceholder": "任意。判断と一緒に記録されます",
    "waiting": "承認を判断してマニフェストを適用できる人を待っています。",
    "applied": "マニフェストの適用 {{id}} として適用しました。"
   },
   "playground": {
    "title": "プレイグラウンド",
    "intro": "各ターンで、下書き内のエージェントのドキュメントを下書きリビジョンとして保存し、一時的なプレイグラウンドのデプロイメントで実行します。何も公開されず、ライブ構成も変わりません。",
    "agent": "エージェント",
    "defaultAgent": "入口エージェント（{{name}}）",
    "defaultAgentShort": "入口エージェント",
    "input": "入力",
    "answer": "回答",
    "placeholder": "エージェントに何をさせますか？",
    "firstHint": "プレイグラウンドでの会話を始めます。",
    "continueHint": "プレイグラウンドでの会話を続けます。",
    "send": "ターンを実行",
    "turn": "ターン {{number}}、{{agent}}",
    "openRun": "実行の詳細",
    "conversation": "会話",
    "export": "記録をダウンロード",
    "reset": "新しい会話",
    "empty": "まだターンはありません。",
    "exportDraft": "下書き",
    "exportTurn": "ターン",
    "exportRun": "実行"
   },
   "preview": {
    "title": "コンパイルのプレビュー",
    "intro": "デプロイする前に、実行が何で始まるかを確認できます：コマンドライン、アセットの配置先、ファイルスペースのマウント。シークレットの値は伏せられます。",
    "deployment": "デプロイメント",
    "chooseDeployment": "デプロイメントを選択",
    "revision": "エージェントのリビジョン",
    "deploymentRevision": "デプロイメント自身のリビジョン",
    "revisionOption": "リビジョン {{number}}（{{state}}）",
    "environment": "環境",
    "deploymentEnvironment": "デプロイメントの環境",
    "input": "サンプル入力",
    "compiled": "{{deployment}} を {{revision}} でコンパイルしました。",
    "assets": "配置されるアセット（{{total}}）",
    "noAssets": "このリビジョンが配置するアセットはありません。",
    "columns": {
     "path": "パス",
     "asset": "アセット",
     "kind": "種類",
     "version": "バージョン",
     "size": "サイズ"
    },
    "fileSpace": "ファイルスペース",
    "fileSpaceMount": "{{path}} にマウントされ、現在 {{files}} 個のファイルがあります（最大 {{maxFiles}} 個、各ファイル最大 {{maxBytes}}）。",
    "noFileSpace": "この実行は会話の一部にならないため、ファイルスペースはマウントされません。",
    "redacted": "サーバーは、コマンドライン、環境、ファイル内のシークレットの値を伏せます。"
   },
   "prompts": {
    "title": "アーキテクトプロンプト",
    "templatesLink": "プロンプトテンプレートで開く",
    "forArchitect": "エージェントアーキテクトが使えるプロンプトです。{{architect}} 用に 1 つ選んでください。",
    "noArchitect": "エージェントアーキテクトが使えるプロンプトです。選ぶには、まず「アーキテクト」タブでアーキテクトを選んでください。",
    "nextTurn": "新しい選択や保存した編集は、アーキテクトの次のターンから反映されます。",
    "current": "{{architect}} は {{name}} の最新バージョン（{{version}}）に従って使用しています。",
    "currentPinned": "{{architect}} は {{name}} をバージョン {{version}} に固定して使用しています。",
    "inUse": "{{name}} はデプロイメントで使われているため削除できません：{{deployments}}。先にそれらに別のプロンプトを選んでください。",
    "empty": "アーキテクトプロンプトはありません。",
    "columns": {
     "name": "名前",
     "description": "説明",
     "version": "バージョン",
     "usedBy": "使用元"
    },
    "default": "既定",
    "selectedBadge": "選択中",
    "usedBy": "アーキテクト：{{total}}",
    "select": "選択",
    "selected": "{{architect}} は次のターンから {{name}} を使います。",
    "saved": "{{name}} を新しいバージョンとして保存しました。",
    "editorTitle": "{{name}} を編集（バージョン {{version}}）",
    "name": "名前",
    "description": "説明",
    "body": "プロンプト本文",
    "preview": "レンダリングのプレビュー",
    "deleteMessage": "{{name}} を削除しますか？使用しているアーキテクトのデプロイメント：{{total}}。使用中のプロンプトは削除できません。"
   }
  }
 }
});

// Studio canvas: the interactive graph, its toolbar, property panels, runtime per environment, and outline (AD8.2 to AD8.6).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "studio": {
   "canvas": {
    "title": "キャンバス",
    "appPicker": "アプリ",
    "flowLabel": "アプリ {{app}} のキャンバス",
    "noApp": "下書きにはまだアプリがありません。アーキテクトに作成を依頼するか、既存のアプリから下書きを始めてください。",
    "calls": "呼び出し（{{total}}）",
    "noCalls": "まだ呼び出しはありません。エージェントの右端から別のエージェントへドラッグするか、一方のエージェントで C を、もう一方で Enter を押してください。",
    "addLoose": "アプリに追加",
    "remove": "アプリから外す",
    "removeTitle": "エージェントをアプリから外す",
    "removeMessage": "{{name}} を {{app}} から外しますか？その呼び出しも削除されます。エージェント自体は残り、下書きを適用するまでライブ構成は変わりません。",
    "operationFailed": "{{operation}}は拒否されました。",
    "operations": {
     "AddMember": "エージェントの追加",
     "RemoveMember": "エージェントの削除",
     "Connect": "接続",
     "Disconnect": "接続の解除",
     "SetEntry": "入口エージェントの設定",
     "MoveNode": "エージェントの移動"
    },
    "toolbar": {
     "label": "キャンバスの操作",
     "addAgent": "エージェントを追加",
     "addPlaceholder": "エージェント名",
     "role": "役割",
     "rolePlaceholder": "役割（任意）",
     "add": "追加",
     "connect": "ここから接続",
     "setEntry": "入口エージェントにする",
     "remove": "外す",
     "disconnect": "接続を解除",
     "fit": "全体を表示"
    },
    "connectBar": {
     "message": "{{name}} から接続しています。呼び出し先のエージェントを選んでください：クリックする、そこで Enter を押す、またはここで選択します。",
     "to": "呼び出し先",
     "fanOut": "並列呼び出し",
     "confirm": "接続"
    },
    "keys": {
     "title": "キーボードショートカット",
     "tab": "Tab で入口エージェントから順にエージェント間を移動します。",
     "select": "Enter または Space でフォーカス中のエージェントを選択し、プロパティを開きます。",
     "connect": "エージェントで C を押すとそこから呼び出しを始め、別のエージェントで C または Enter を押すと完了します。",
     "entry": "E でフォーカス中のエージェントを入口エージェントにします。",
     "remove": "Delete で確認の後、フォーカス中のエージェントをアプリから外します。",
     "move": "矢印キーで選択中のエージェントを移動します。Shift を押しながらだと大きく移動します。位置は少し間をおいて保存されます。",
     "add": "N で「エージェントを追加」の入力欄に移動します。",
     "calls": "呼び出しの一覧では、Enter で呼び出しを選択、Delete で接続を解除、F で並列呼び出しのオンとオフを切り替えます。",
     "escape": "Escape で始めた呼び出しを取り消します。"
    },
    "node": {
     "entry": "入口",
     "unreachable": "到達不能",
     "connecting": "ここから呼び出し中"
    },
    "a11y": {
     "node": "Enter または Space でこのエージェントを選択し、矢印キーで移動します。C で接続、E で入口エージェントに設定、Delete で外します。",
     "edge": "2 つのエージェント間の呼び出しです。キャンバスの下にある呼び出しの一覧で選択してください。",
     "handle": "接続点",
     "moved": "エージェントを{{direction}}に移動しました。新しい位置：{{x}}, {{y}}。",
     "directions": {
      "up": "上",
      "down": "下",
      "left": "左",
      "right": "右"
     }
    },
    "announce": {
     "added": "{{name}} を {{app}} に追加しました。",
     "connectStart": "{{name}} から接続しています。呼び出し先のエージェントに移動して Enter を押すか、Escape で取り消してください。",
     "connectCancelled": "接続を取り消しました。",
     "connected": "{{from}} は {{to}} を呼び出すようになりました。",
     "disconnected": "{{from}} は {{to}} を呼び出さなくなりました。",
     "fanOutOn": "{{from}} は {{to}} を並列に呼び出せるようになりました。",
     "fanOutOff": "{{from}} は {{to}} を一度に 1 回ずつ呼び出すようになりました。",
     "entry": "{{name}} が {{app}} の入口エージェントになりました。",
     "removed": "{{name}} を {{app}} から外しました。",
     "selfEdge": "エージェントは自分自身を呼び出せません。別のエージェントを選んでください。"
    },
    "summary": {
     "noApp": "説明するアプリがありません。",
     "agents_one": "アプリ {{app}} には {{count}} 個のエージェントがあります。",
     "agents_other": "アプリ {{app}} には {{count}} 個のエージェントがあります。",
     "callCount_one": "その間の呼び出しは {{count}} 件です。",
     "callCount_other": "その間の呼び出しは {{count}} 件です。",
     "entry": "入口エージェントは {{name}} です。",
     "noEntry": "入口エージェントは設定されていません。",
     "callParallel": "{{from}} は {{to}} を呼び出します。並列呼び出し可、委任の深さ {{depth}}。",
     "callSingle": "{{from}} は {{to}} を呼び出します。一度に 1 回ずつ、委任の深さ {{depth}}。"
    },
    "conflict": {
     "mine": "{{item}} も変更されています。編集内容はパネルに残っています。もう一度保存する前に新しいバージョンと比べてください。",
     "kept": "{{item}} の編集内容はパネルに残っています。新しいバージョンに反映するには、もう一度保存してください。",
     "operation": "{{operation}}は適用されませんでした。新しいバージョンでやり直すか、そのままにしてください。",
     "retry": "やり直す"
    },
    "panel": {
     "label": "プロパティ",
     "tabsLabel": "{{name}} のプロパティ",
     "properties": "エージェント",
     "runtime": "ランタイム",
     "save": "下書きに保存",
     "reset": "変更を元に戻す",
     "saved": "{{item}} を保存しました。変更は「差分と適用」で確認できます。",
     "check": "この項目に対するサーバーのチェック：{{message}}",
     "unparsable": "この項目の YAML を解析できないため、パネルでは変更できません。先に「項目」タブで修正してください。（{{message}}）"
    },
    "agent": {
     "title": "エージェント {{name}}",
     "isEntry": "これはアプリの入口エージェントです。アプリを使う人と対話します。",
     "notHeld": "下書きにはまだ {{name}} のドキュメントがありません。ここで編集するには下書きに取り込んでください。ライブ構成は変わりません。",
     "deleted": "下書きは {{name}} を削除します。編集するには「項目」タブで元に戻してください。",
     "bring": "下書きに取り込む",
     "description": "説明",
     "inputSchema": "入力スキーマ",
     "outputSchema": "出力スキーマ",
     "schemaHint": "JSON で記述した JSON Schema。プレーンテキストにする場合は空のままにします。",
     "assets": "アセット",
     "noAssets": "次のリビジョンはアセットを固定しません。",
     "assetsKept": "ドキュメントにアセットの指定がないため、エージェントは現在のアセットを保持します。",
     "assetName": "アセット名",
     "assetVersion": "バージョン",
     "latest": "最新",
     "removeAsset": "アセット {{name}} を削除",
     "addAsset": "アセットを追加",
     "capabilities": "ケイパビリティ",
     "capabilitiesHint": "名前はカンマで区切ります。空の一覧にするとすべて消去されます。",
     "capabilitiesKept": "名前はカンマで区切ります。空のままにすると、エージェントは現在のケイパビリティを保持します。",
     "systemPrompt": "システムプロンプト",
     "noDeployments": "下書きにはこのエージェントのデプロイメントがないため、ここではシステムプロンプトは設定されていません。",
     "promptLine": "{{environment}}：{{deployment}} は {{prompt}} を使用",
     "builtInPrompt": "組み込みの既定",
     "showRuntime": "「ランタイム」タブで編集",
     "errors": {
      "json": "有効な JSON ではありません。",
      "object": "スキーマは {\"type\": \"object\"} のような JSON オブジェクトです。",
      "version": "整数を入力するか、最新バージョンにする場合は空のままにしてください。"
     }
    },
    "edge": {
     "title": "{{from}} から {{to}} への呼び出し",
     "from": "呼び出し元",
     "to": "呼び出し先",
     "depth": "委任の深さ",
     "depthHint": "グラフから算出：1 に {{to}} より下の最長の呼び出しの連鎖を加えた値です。その下の呼び出しが変わると変わります。",
     "fanOut": "並列呼び出し（ファンアウト）",
     "fanOutOn": "{{from}} は {{to}} への呼び出しを同時に複数開始できます。",
     "fanOutOff": "{{from}} は {{to}} を一度に 1 回ずつ呼び出します。"
    },
    "app": {
     "title": "アプリ {{name}}",
     "hint": "編集するには、キャンバス上のエージェントか呼び出しを選択してください。何も選択していないときは、このパネルでアプリを編集します。",
     "entry": "入口エージェント",
     "noEntry": "入口エージェントなし",
     "noMembers": "まずエージェントを追加してください。最初のエージェントが入口エージェントになります。",
     "notHeld": "下書きにはまだ {{name}} のドキュメントがありません。ここでサインインとブランディングを編集するには下書きに取り込んでください。",
     "deleted": "下書きは {{name}} を削除します。編集するには「項目」タブで元に戻してください。",
     "bring": "下書きに取り込む",
     "description": "説明",
     "authMode": "サインイン",
     "authDefault": "サーバーの既定",
     "anonymous": "匿名での利用を許可",
     "branding": "ブランディング",
     "brandingFields": {
      "displayName": "表示名",
      "logo": "ロゴのアセット",
      "primaryColor": "メインカラー",
      "accentColor": "アクセントカラー",
      "welcomeText": "ウェルカムテキスト"
     },
     "errors": {
      "color": "#1F6FEB のような 16 進数の色を使ってください。"
     }
    },
    "runtime": {
     "title": "{{name}} のランタイム",
     "none": "下書きには {{name}} のデプロイメントがありません。下からライブのものを取り込むか、アーキテクトに作成を依頼してください。",
     "deployment": "環境とデプロイメント",
     "option": "{{environment}}：{{name}}",
     "scope": "編集で変わるのは {{environment}} の {{name}}（ハーネスプロファイル {{profile}}）だけです。他の環境はそれぞれの値を保持します。",
     "fields": {
      "model": "モデル",
      "effort": "推論の度合い",
      "timeoutSeconds": "制限時間（秒）",
      "maxTurns": "最大ターン数",
      "maxBudgetUsd": "予算（USD）",
      "systemTemplate": "システムプロンプトのテンプレート",
      "systemVersion": "固定するバージョン",
      "approvalsEnabled": "ツール呼び出しの承認を求める",
      "approvalDefaultAction": "どのルールにも一致しない場合"
     },
     "hints": {
      "timeoutSeconds": "1 以上の整数（秒）。空の場合はハーネスプロファイルの制限を使います。",
      "maxTurns": "1 以上の整数。空の場合はハーネスが決めます。",
      "maxBudgetUsd": "0 以上、例えば 2.50。空の場合は予算なしです。"
     },
     "builtIn": "組み込みの既定",
     "approvals": "承認",
     "noRules": "ルールはありません。すべてのツール呼び出しに既定の動作が適用されます。",
     "rule": {
      "action": "動作",
      "pattern": "ツールのパターン",
      "inputPattern": "入力のパターン",
      "inputPlaceholder": "入力のパターン（任意）",
      "remove": "ルール {{number}} を削除",
      "add": "ルールを追加"
     },
     "live": "下書きにないライブのデプロイメント",
     "noLive": "このエージェントのライブのデプロイメントはすべて下書きにあるか、1 つもありません。",
     "bring": "下書きに取り込む",
     "exportMissing": "{{name}} のエクスポートにドキュメントが含まれていませんでした。",
     "errors": {
      "integer": "1 以上の整数を使ってください。",
      "number": "0 以上の数値を使ってください。",
      "pattern": "ルールにはツールのパターンが必要です。",
      "version": "整数を使い、固定するテンプレートを指定してください。"
     }
    }
   }
  }
 },
 "common": {
  "fieldCodes": {
   "NotAMember": "そのエージェントはアプリのメンバーではありません。",
   "SelfEdge": "エージェントは自分自身を呼び出せません。",
   "NoSuchEdge": "アプリにそのような呼び出しはありません。",
   "AppDeleted": "下書きはこのアプリを削除します。先に元に戻してください。",
   "InvalidDocument": "ドキュメントを 1 つのマニフェストドキュメントとして解析できません。",
   "DocumentMismatch": "ドキュメントの種類または名前が項目と一致しません。"
  }
 }
});

// Agent Studio positioning and the About page (AD12.12), the setup wizard's Agent Studio step (AD9.5, AD9.9), and app
// environments, promotion, and rollback in the Apps tab and the studio (AD9.6).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "common": {
  "productName": "Garrison Agent Studio",
  "productLine": "Agent Studio",
  "states": {
   "studioHint": "または、エージェントスタジオを開いて必要なものを説明してください。エージェントアーキテクトが下書きを作り、あなたが確認します。",
   "openStudio": "エージェントスタジオを開く"
  }
 },
 "nav": {
  "items": {
   "studio": {
    "label": "エージェントスタジオ"
   },
   "serverInfo": {
    "label": "製品情報",
    "tip": "製品、バージョン、リンク、エンドポイント、現在の ID"
   }
  }
 },
 "wizard": {
  "steps": {
   "studio": "エージェントスタジオ"
  },
  "welcomeItemStudio": "エージェントアーキテクトにハーネスとモデルを割り当て、エージェントスタジオで一緒にエージェントやアプリを設計できるようにします (任意)。",
  "studioBody": "エージェントアーキテクトは、エージェントスタジオであなたと一緒にエージェントやアプリを設計します。実行に使うハーネスプロファイルとモデル、そしてアーキテクトを導くアーキテクトプロンプトを選んでください。このデプロイメントが編集できるのはあなたのスタジオの下書きだけです。この手順はスキップでき、後でスタジオからアーキテクトを作成できます。",
  "createArchitect": "アーキテクトを作成",
  "architectCreated": "エージェントアーキテクト {{name}} を作成しました。",
  "architectReady": "エージェントアーキテクト {{name}} の準備ができました。セットアップ後にエージェントスタジオを開き、下書きを始めてください。",
  "continue": "続行"
 },
 "views": {
  "home": {
   "getStartedBody": "セットアップウィザードは、認証情報を追加し、エージェントアーキテクトにハーネスとモデルを割り当て、サンプルエージェントを適用してテストを実行します。または、エージェントスタジオを開いて作りたいアプリを説明してください。",
   "openStudio": "エージェントスタジオを開く"
  },
  "studio": {
   "title": "エージェントスタジオ"
  },
  "studioDraft": {
   "tabs": {
    "release": "リリース"
   }
  },
  "serverInfo": {
   "title": "製品情報",
   "subtitle": "バージョン、リンク、エンドポイント、サインイン中の ID。",
   "positioning": "使い慣れたエージェントハーネスで、エージェント型アプリを構築、デプロイ、実行します。",
   "versions": "サーバーのバージョン {{server}}、ダッシュボードのバージョン {{dashboard}}",
   "docs": "ドキュメント",
   "studioDocs": "エージェントスタジオのガイド",
   "website": "Web サイト",
   "source": "ソースコード"
  }
 },
 "resources": {
  "apps": {
   "actions": {
    "environments": "環境"
   }
  }
 },
 "components": {
  "apps": {
   "release": {
    "title": "環境と昇格",
    "intro": "各メンバーの環境ごとのデプロイメントと、それぞれが固定しているリビジョンおよび環境変数の上書きです。昇格の前に 2 つの環境を比較し、履歴から昇格をロールバックできます。",
    "live": "{{environment}} で公開中",
    "environments": "環境",
    "source": "比較元",
    "target": "比較先",
    "member": "メンバー",
    "entry": "入口",
    "noDeployment": "デプロイメントなし",
    "secretOverride": "{{name}} (シークレット)",
    "difference": "{{source}} から {{target}}",
    "differenceNone": "差分",
    "diff": {
     "Same": "同じ",
     "Missing": "{{target}} にデプロイメントなし",
     "revisions": "リビジョンが異なる",
     "overrides": "上書きが異なる",
     "both": "リビジョンと上書きが異なる"
    },
    "promote": "{{source}} から {{target}} へ昇格",
    "promoteNothing": "昇格",
    "missing": "{{target}} にデプロイメントがありません: {{names}}。今昇格すると失敗し、何も移動しません。先にそこにデプロイメントを追加してください。",
    "history": "昇格履歴",
    "historyEmpty": "このアプリはまだ昇格されていません。"
   }
  },
  "studio": {
   "release": {
    "title": "リリース",
    "app": "アプリ",
    "noAppsTitle": "この下書きはアプリを作成しません",
    "noAppsBody": "グラフタブで、またはアーキテクトに頼んで下書きにアプリを追加すると、適用後にここから昇格できます。",
    "notLiveTitle": "{{name}} はまだ公開されていません",
    "notLiveBody": "まず下書きを適用してください。適用するとエージェントが公開され、dev にデプロイされます。その後、ここからアプリを昇格できます。"
   }
  }
 }
});

// Agents > Architects: reusable agent architects any studio draft can use, and the studio's link to them.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "architects": {
    "label": "アーキテクト",
    "tip": "エージェントアーキテクト: どのスタジオ下書きでもエージェントとアプリを一緒に設計する、再利用可能なエージェントアーキテクトのデプロイメントです。"
   }
  }
 },
 "resources": {
  "architects": {
   "title": "アーキテクト",
   "subtitle": "このテナントのエージェントアーキテクト。それぞれが独自のハーネスプロファイル、モデル、プロンプトを持つ agent-architect のデプロイメントで、どのスタジオ下書きからも使用できます。",
   "add": "アーキテクトを追加",
   "create": "アーキテクトを作成",
   "edit": "アーキテクトを編集",
   "view": "アーキテクトの詳細",
   "deleteTitle": "アーキテクトを削除",
   "emptyTitle": "アーキテクトはまだありません",
   "emptyBody": "エージェントスタジオでエージェントとアプリを一緒に設計するアーキテクトを作成します。実行に使うハーネスプロファイルとモデル、そして使用するプロンプトを選んでください。",
   "columns": {
    "name": "名前",
    "harnessProfileId": "ハーネスプロファイル",
    "model": "モデル",
    "architectPromptTemplateId": "アーキテクトプロンプト",
    "active": "状態",
    "description": "説明",
    "id": "ID",
    "lastUpdateUtc": "更新日時",
    "createdUtc": "作成日時"
   },
   "fields": {
    "name": "名前",
    "description": "説明",
    "harnessProfileId": "ハーネスプロファイル",
    "model": "モデル",
    "architectPromptTemplateId": "アーキテクトプロンプト",
    "architectPromptVersion": "固定するプロンプトのバージョン",
    "active": "有効"
   },
   "hints": {
    "model": "空のままにすると、ハーネスプロファイルの既定のモデルを使用します。",
    "architectPromptVersion": "空のままにすると、常にプロンプトの現在のバージョンを使います。"
   },
   "actions": {
    "prompts": "アーキテクトプロンプト",
    "deployment": "デプロイメントの設定"
   },
   "errors": {
    "nameTaken": "このテナントの別のデプロイメントがすでにこの名前を使用しています。",
    "version": "1 以上の整数を入力するか、空のままにしてください。"
   },
   "promptPinned": "{{name}} (バージョン {{version}})",
   "defaultModel": "プロファイルの既定",
   "defaultBadge": "既定",
   "promptsTitle": "{{name}} のアーキテクトプロンプト"
  }
 },
 "components": {
  "studio": {
   "chat": {
    "manageArchitects": "アーキテクトを管理"
   }
  }
 }
});

// Typed confirmation for destructive deletes, and deleting an agent from its page.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "confirm": {
   "typeToConfirm": "確認のため、下のボックスに '{{word}}' と入力してください。"
  }
 },
 "views": {
  "agentDetail": {
   "deleted": "エージェント {{name}} を削除しました。"
  }
 }
});

// Architect credentials: the secret an architect's harness signs in with, and the studio's notice when it cannot.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "studio": {
   "architect": {
    "credential": "認証情報",
    "noCredential": "なし",
    "credentialOption": "{{name}} ({{kind}})"
   },
   "chat": {
    "notCredentialedTitle": "アーキテクトがモデルプロバイダーにサインインできませんでした",
    "notCredentialedBody": "{{architect}} の認証に失敗しました。保存済み接続の認証情報を確認してください。原因は下の実行エラーに表示されます。",
    "noCredentialTitle": "このアーキテクトには認証情報がありません",
    "noCredentialBody": "{{architect}} は {{profile}} で動作し、サインインにシークレットが必要です。ないとターンが Not logged in で失敗します。アーキテクトのページで認証情報を選んでください。",
    "fixCredential": "アーキテクトの認証情報を修正",
    "openSecrets": "シークレットを開く"
   }
  }
 },
 "resources": {
  "architects": {
   "columns": {
    "credentialSecretId": "認証情報"
   },
   "fields": {
    "credentialSecretId": "認証情報"
   },
   "noCredential": "なし"
  }
 }
});

// Hints that say where a field's choices come from and link to that page (architect forms).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "dependencyHint": {
   "refresh": "一覧を更新"
  },
  "architectHints": {
   "harness": "組み込みのプロファイル (Claude Code、Codex など) はすぐに使えます。",
   "harnessLink": "構成 > ハーネスプロファイル を開く",
   "credentialNotNeeded": "{{profile}} には認証情報は不要です。",
   "credentialLink": "構成 > シークレット を開く",
   "prompt": "変更はアーキテクトの次のターンから反映されます。",
   "promptLink": "構成 > プロンプトテンプレート を開く",
   "credentialNoProfile": "ハーネスがサインインに使うシークレットです。",
   "credentialChosen": "{{profile}} がサインインに使うシークレットです。",
   "credentialPick": "{{profile}} は種類が {{kinds}} のシークレットでサインインします。選択しないと、すべてのターンが Not logged in で失敗します。",
   "credentialAdd": "{{profile}} は種類が {{kinds}} のシークレットでサインインしますが、このテナントにはまだありません。構成 > シークレット で追加してから、ここで選択してください。ないとすべてのターンが Not logged in で失敗します。"
  }
 }
});

// The New architect dialog's introduction names the credential.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "studio": {
   "architect": {
    "intro": "エージェントアーキテクトは、あなたの下書きでエージェントとアプリを設計します。ハーネスプロファイル、サインインに使うシークレット、モデル、使用するプロンプトを指定してください。アーキテクトは下書きを編集するだけで、適用は決して行いません。"
   }
  }
 }
});

// The setup wizard's Agent Studio step names the credential and where architects live.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "wizard": {
  "studioBody": "エージェントアーキテクトは、エージェントスタジオであなたと一緒にエージェントとアプリを設計します。実行に使うハーネスプロファイルとモデル、サインインに使う認証情報 (前のステップで保存したシークレットがハーネスに合えば自動で選ばれます)、そして指針となるアーキテクトプロンプトを選んでください。そのデプロイメントが編集できるのはスタジオ下書きだけです。この手順はスキップして、後で エージェント > アーキテクト で作成することもできます。"
 }
});

// Secrets: how to get the value for each kind (Create secret, Set value, and the setup wizard).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "secretGuide": {
   "title": "{{kind}} の値の取得方法",
   "AnthropicApiKey": {
    "s1": "Anthropic Console にサインインし、Settings > API keys を開きます:",
    "s2": "Create Key を選び、garrison などの名前を付けてキーをコピーします。キーは sk-ant-api で始まり、表示されるのは一度だけです。",
    "s3": "値に貼り付けます。Claude Code、opencode、pi、Mux、プロバイダー API ハーネスは ANTHROPIC_API_KEY として受け取ります。"
   },
   "ClaudeCodeOAuthToken": {
    "s1": "任意のコンピューターに、まだなければ Claude Code をインストールします:",
    "s2": "このコマンドを実行し、開いたブラウザーウィンドウで、エージェントに使わせる Pro または Max サブスクリプションの Claude アカウントでサインインします:",
    "s3": "表示されたトークンをコピーします。sk-ant-oat で始まり、有効期間は 1 年です。期限切れが分かるよう、有効期限をその日付に設定してください。",
    "s4": "値に貼り付けます。Claude Code は CLAUDE_CODE_OAUTH_TOKEN として受け取ります。",
    "note": "サブスクリプショントークンは個人のプランを使うため、他の人へのサービスに使うと Anthropic の規約に反する場合があります。共有するものには Anthropic API キーを使ってください。"
   },
   "OpenAiApiKey": {
    "s1": "OpenAI Platform にサインインし、API keys を開きます:",
    "s2": "Create new secret key を選び、実行の料金を支払うプロジェクトを選んでキーをコピーします。キーは sk- で始まり、表示されるのは一度だけです。",
    "s3": "値に貼り付けます。Codex、opencode、pi、Mux、プロバイダー API ハーネスは OPENAI_API_KEY として受け取ります。"
   },
   "CodexAuthJson": {
    "s1": "まだなければ Codex CLI をインストールします:",
    "s2": "このログインを Garrison 専用にするため、新しい空の Codex ホームで ChatGPT アカウントにサインインします:",
    "s3": "同じターミナルでファイルを検証します。Valid JSON と表示された場合のみ続行してください：",
    "copy": "macOS では、次のコマンドでファイルをクリップボードに直接コピーし、値に貼り付けます。他のシステムでは、テキストエディターで auth.json を開き、ファイル全体をコピーしてください。折り返されたターミナル出力やシェルのプロンプトはコピーしないでください。",
    "s4": "シークレットの保存に成功したら、このフォルダーを削除し、このログインを他の場所で使用しないでください。以後は Garrison が更新します：",
    "note": "同じログインの 2 つのコピーはリフレッシュトークンを共有し、後から更新した側がもう一方を壊します。個人の ChatGPT プランを他の人へのサービスに使うと OpenAI の規約に反する場合があります。共有するデプロイメントには OpenAI API キーのほうが簡単です。"
   },
   "GeminiApiKey": {
    "s1": "Google AI Studio を開き、支払いに使う Google アカウントでサインインします:",
    "s2": "Create API key を選び、Google Cloud プロジェクトを選択または作成してキーをコピーします。キーは AIza で始まります。",
    "s3": "値に貼り付けます。Gemini CLI と pi は GEMINI_API_KEY、opencode は GOOGLE_GENERATIVE_AI_API_KEY として受け取ります。"
   },
   "GenericEnv": {
    "s1": "単一の値を貼り付けます。ハーネスやツールが環境変数から読み取るトークン、パスワード、URL などです。",
    "s2": "シークレットをエイリアス付きでデプロイメントにバインドし、それを使う環境オーバーライドを追加します。例:",
    "s3": "変数はハーネスプロファイルの認証情報許可リストに含まれている必要があります。含まれていないとデプロイメントは拒否されます。"
   },
   "GenericFile": {
    "s1": "改行を含めてファイル全体を貼り付けます。サービスアカウントの JSON、証明書、設定ファイルなどです。",
    "s2": "シークレットをエイリアス付きでデプロイメントにバインドし、内容がそのシークレットであるファイルオーバーライドを追加します。例:"
   },
   "BearerToken": {
    "s1": "Bearer という語を付けずに、トークンだけを貼り付けます。",
    "s2": "リモートエージェントは認証情報シークレットとして使い、ワークスペーステンプレートはプライベートリポジトリのクローンに使います (ユーザー x-access-token のパスワードとして)。MCP サーバーは {{secret.<alias>}} と書いたヘッダーで送信できます。"
   },
   "BasicAuth": {
    "s1": "ユーザー名とパスワードを次の形式で貼り付けます:",
    "s2": "シークレットをエイリアス付きでデプロイメントにバインドし、テンプレートで {{secret.<alias>}} として使います。"
   },
   "GitCredential": {
    "s1": "GitHub の場合、クローンするリポジトリの Contents に読み取りアクセスを持つ fine-grained 個人アクセストークンを作成します:",
    "s2": "トークンだけを貼り付けます。Garrison はユーザー x-access-token のパスワードとして送信します。GitLab、Bitbucket などのホストでは username:token を貼り付けてください。",
    "s3": "リポジトリをクローンするワークスペーステンプレートの Git 認証情報として、このシークレットを選びます。"
   }
  }
 }
});

// The studio chat: wait-state phrases, thinking, per-turn telemetry labels, tool chips, and copy.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "studio": {
   "chat": {
    "wait": {
     "worker": "このターンを開始するワーカーを待っています...",
     "phrases": {
      "p1": "下書きを読んでいます...",
      "p2": "じっくり考えています...",
      "p3": "エージェントを描いています...",
      "p4": "呼び出し関係を整理しています...",
      "p5": "Garrison の規約を確認しています...",
      "p6": "適切な機能を選んでいます...",
      "p7": "マニフェストを作成しています...",
      "p8": "いくつかの設計を比べています...",
      "p9": "デプロイメントを準備しています...",
      "p10": "プロンプトを見直しています...",
      "p11": "アプリのグラフを描いています...",
      "p12": "もっと簡単な形を探しています...",
      "p13": "細部を再確認しています...",
      "p14": "部品を組み合わせています...",
      "p15": "もう少しです...",
      "p16": "まだ作業中です..."
     }
    },
    "thinkingSummary": "思考",
    "metrics": {
     "model": "モデル",
     "timeToFirstTokenMs": "TTFT",
     "streamingMs": "ストリーミング",
     "totalMs": "合計",
     "inputTokens": "入力",
     "outputTokens": "出力",
     "cachedTokens": "キャッシュ",
     "reasoningTokens": "推論",
     "outputTokensPerSecond": "トークン/秒",
     "toolCallCount": "ツール",
     "costUsd": "コスト"
    }
   }
  }
 }
});

// The studio chat: turn details popover, tool call cards, links to mentioned records, keys, and the caution.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "studio": {
   "chat": {
    "metrics": {
     "title": "ターンの詳細"
    },
    "tool": {
     "running": "実行中",
     "ok": "完了",
     "failed": "失敗",
     "input": "引数",
     "output": "結果",
     "none": "なし",
     "waiting": "結果を待っています..."
    },
    "refs": {
     "apr": "承認を開く",
     "run": "実行を開く",
     "cnv": "会話を開く",
     "agt": "エージェントを開く",
     "sdr": "下書きを開く",
     "plr": "パイプライン実行を開く",
     "tpl": "プロンプトテンプレートを開く"
    },
    "keysHint": "Enter で送信します。Ctrl+Enter または Shift+Enter で改行します。",
    "disclaimer": "AI は間違えることがあります。すべての回答を確認してください。",
    "continueHint": "会話を続けます。"
   }
  }
 }
});

// Agent wizard: the guided path from a description to approved agents running in dev, its entry points, and the studio tab it replaces.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "agentWizard": {
    "label": "エージェントウィザード",
    "tip": "必要なことの説明から、dev で動く承認済みエージェントまでを案内します。モデルへのアクセス、エージェントアーキテクトとの設計、確認、承認、最初の会話の順に進みます。"
   }
  }
 },
 "resources": {
  "agents": {
   "wizard": "エージェントウィザード"
  }
 },
 "common": {
  "states": {
   "studioHint": "または、エージェントウィザードを開いて必要なことを説明してください。エージェントの作成、承認、試用まで案内します。",
   "openStudio": "エージェントウィザードを開く"
  }
 },
 "views": {
  "home": {
   "openStudio": "エージェントウィザードを開く"
  },
  "studioDraft": {
   "back": "ウィザードに戻る"
  },
  "agentWizard": {
   "title": "エージェントウィザード",
   "subtitle": "必要なことを説明してください。そこから dev で動く承認済みエージェントまでウィザードが案内します。",
   "subtitleDraft": "作成中: {{title}}",
   "advanced": "詳細",
   "stepsLabel": "ウィザードの手順",
   "back": "戻る",
   "working": "処理中...",
   "steps": {
    "goal": "目的",
    "access": "モデルへのアクセス",
    "design": "設計",
    "review": "確認",
    "approve": "承認",
    "test": "試す"
   },
   "goal": {
    "title": "エージェントに何をさせますか?",
    "intro": "プロジェクトに名前を付け、仕事の内容をわかりやすい言葉で説明してください。エージェントアーキテクトがこれを読み、1 つのエージェントまたはエージェントのチームを設計します。",
    "name": "プロジェクト名",
    "namePlaceholder": "リサーチアシスタント",
    "nameHint": "後で見てわかる短い名前です。この手順の後は変更できません。",
    "goal": "エージェントにさせること",
    "goalPlaceholder": "Web でトピックを調べ、見つけた内容を出典付きで要約し、短いレポートを書く。",
    "goalHint": "誰が使うか、何を入力し、何を出力するかを書いてください。必要なことはアーキテクトが質問します。",
    "next": "開始",
    "resume": "または、下書きの続きから始める",
    "allDrafts": "すべての下書き"
   },
   "access": {
    "title": "モデルへのアクセス",
    "intro": "エージェントを動かすハーネスと、サインインに使う認証情報を選んでください。エージェントアーキテクトも、あなたと設計する間は同じハーネスと認証情報を使います。",
    "harness": "ハーネスプロファイル",
    "harnessHint": "エージェントを実行する CLI です。たとえば Claude Code や Codex。",
    "model": "モデル",
    "modelHint": "任意です。空欄にするとハーネスの既定のモデルを使います。",
    "credential": "認証情報",
    "noCredentialNeeded": "{{profile}} には認証情報は不要です。",
    "credentialIntro": "{{profile}} は種類 {{kinds}} のシークレットでサインインします。保存済みのものを選ぶか、今追加してください。",
    "noFittingSecret": "種類 {{kinds}} のシークレットはまだ保存されていません。下で追加してください。値の取得手順も表示されます。",
    "addSecret": "認証情報を追加",
    "saveSecret": "認証情報を保存",
    "architectDescription": "エージェントウィザードが設定したエージェントアーキテクト。",
    "next": "設計に進む"
   },
   "design": {
    "title": "アーキテクトと設計する",
    "intro": "エージェントアーキテクトとチャットします。必要なことを質問しながら、会話に合わせて下書きにエージェントを作成します。右のパネルに下書きの内容が表示されます。",
    "contents": "下書きの内容",
    "empty": "まだ何もありません。アーキテクトが設計したエージェントがここに追加されます。",
    "agents": "エージェント",
    "firstMessage": "次のものを作りたいです: {{goal}}\n\nエージェントはハーネスプロファイル {{profile}} で、認証情報のシークレット {{secret}} を使って動きます。必要なことを質問してから、この下書きにエージェントを設計してください。",
    "chatTitle": "{{architect}} とのチャット",
    "next": "確認に進む"
   },
   "review": {
    "title": "確認",
    "intro": "ウィザードは下書きの各項目を現在の構成と照らし合わせて確認します。失敗しそうなものは修正のためアーキテクトに戻されます。",
    "status": {
     "PendingApproval": "この下書きは承認待ちです。次の手順に進んでください。",
     "Applied": "この下書きは適用済みです。次の手順に進んでください。",
     "Discarded": "この下書きは破棄されました。最初の手順から新しく始めてください。"
    },
    "kind": "種類",
    "name": "名前",
    "change": "変更",
    "note": "メモ",
    "problems_one": "{{count}} 件の項目が適用できません。",
    "problems_other": "{{count}} 件の項目が適用できません。",
    "askFix": "アーキテクトに修正を依頼",
    "valid": "下書きはすべて問題ありません。承認に進んでください。",
    "validate": "再確認",
    "fixMessage": "下書きはまだ検証に通っていません。次の問題を修正してください:\n{{problems}}",
    "next": "承認に進む"
   },
   "approve": {
    "title": "承認",
    "intro": "承認すると下書きが適用され、エージェントが稼働します。その後ウィザードが各エージェントに dev のデプロイメントを用意するので、すぐに試せます。",
    "reason": "エージェントウィザードで承認しました。",
    "summary": "下書きには {{total}} 件の項目があり、そのうち {{agents}} 件がエージェントです。{{profile}} 上で認証情報 {{secret}} を使って動きます。",
    "will1": "下書きのすべての項目がまとめて作成または更新されます。1 つでも失敗すると、何も変更されません。",
    "will2": "各エージェントは選んだハーネス上に dev のデプロイメントを持ち、認証情報が紐付けられます。",
    "will3": "承認する権限がない場合、権限のある人の判断を待ちます。判断が出るとこのページは先に進みます。",
    "approve": "承認して公開",
    "waiting": "承認権限のある人の判断を待っています。判断が出るとこのページは自動で先に進みます。",
    "openApproval": "承認を開く",
    "retry": "再試行",
    "done": "承認され、公開されました。すべてのエージェントに実行可能な dev のデプロイメントがあります。",
    "agent": "エージェント",
    "deployment": "dev のデプロイメント",
    "what": "ウィザードが行ったこと",
    "actions": {
     "create": "デプロイメントを作成",
     "bind": "認証情報を紐付け",
     "ready": "準備済み"
    },
    "next": "試用に進む"
   },
   "test": {
    "title": "試す",
    "intro": "dev で新しいエージェントと話してみてください。満足したら、開いて昇格または共有します。",
    "talkingTo": "{{name}} と会話中。",
    "empty": "メッセージを送ると会話が始まります。",
    "message": "メッセージ",
    "next": "次に行うこと",
    "openAgent": "{{name}} を開く",
    "openApp": "アプリ {{name}} を開く",
    "openInvoke": "Invoke で開く",
    "another": "別のものを作る"
   }
  }
 }
});

// Agent wizard: the Try it step opens the app's own chat.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "views": {
  "agentWizard": {
   "test": {
    "openApp": "{{name}} のチャットを開く"
   }
  }
 }
});

// App branding: background, header, and agent message colors, typeface, and browser tab icon.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "resources": {
  "apps": {
   "fields": {
    "backgroundColor": "ページの背景",
    "headerColor": "ヘッダーの色",
    "agentBubbleColor": "エージェントのメッセージの色",
    "fontFamily": "書体",
    "faviconAssetId": "タブのアイコン"
   },
   "hints": {
    "displayName": "チャットのヘッダーとエージェントのメッセージに表示されます。任意の文字を 128 文字まで使えます。上の名前は識別子にすぎません。",
    "faviconAssetId": "画像のアセットです。空欄にするとロゴを使います。",
    "primaryColor": "ボタンと自分のメッセージ。",
    "accentColor": "強調表示、フォーカス枠、選択中の会話。",
    "backgroundColor": "会話の後ろのページ。",
    "headerColor": "名前とロゴがある上部のバー。",
    "agentBubbleColor": "エージェントのメッセージ。文字色はコントラストで自動的に選ばれます。"
   },
   "faviconFromLogo": "ロゴと同じ",
   "defaultColor": "既定 {{color}}"
  }
 },
 "enums": {
  "appFont": {
   "System": "システム",
   "Sans": "ゴシック体",
   "Serif": "明朝体",
   "Rounded": "丸ゴシック",
   "Mono": "等幅"
  }
 },
 "components": {
  "form": {
   "defaultColor": "既定値"
  }
 }
});

// App branding: conversation list, message input, and file list colors.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "resources": {
  "apps": {
   "fields": {
    "conversationListColor": "会話一覧の色",
    "composerColor": "入力欄の色",
    "filesColor": "ファイル一覧の色"
   },
   "hints": {
    "conversationListColor": "横にある会話の一覧。",
    "composerColor": "会話の下にある入力する場所。",
    "filesColor": "エージェントが書いたファイルの一覧。"
   }
  }
 }
});

// Wizard draft picker and credential-optional Mux endpoints.
Object.assign(ja.views.agentWizard.goal, {
  "updated": "更新日時: {{date}}",
  "continue": "再開"
});
Object.assign(ja.views.agentWizard.access, {
  "muxEndpoint": "Mux エンドポイント URL",
  "muxAdapter": "エンドポイントのアダプター",
  "muxOptionalCredential": "認証情報（任意）",
  "muxHint": "Mux はプロバイダーの API キーなしでエンドポイントを利用できます。ワーカーから接続できる URL を入力してください。エンドポイントで認証が必要な場合のみ認証情報を選択してください。",
  "needEndpoint": "HTTP または HTTPS で始まる有効な Mux エンドポイント URL を入力してください。"
});
Object.assign(ja.views.agentWizard.design, {
  "firstMessageMux": "作成したいもの: {{goal}}\n\nMux をエンドポイント {{endpoint}}、アダプター {{adapter}}、モデル {{model}} で使用してください。エンドポイントで認証が必要な場合のみ API キーが必要です。必要な質問をしてから、このドラフトでエージェントを設計してください。"
});
Object.assign(ja.views.agentWizard.approve.actions, {"configure": "エンドポイント設定済み"});

// Harness-specific wizard configuration.
Object.assign(ja.views.agentWizard.access, {
  "muxEndpoint": "Mux エンドポイント名",
  "muxHint": "実行ワーカーの Mux に設定したエンドポイント名（例: local）を入力してください。URL、アダプター、モデル、認証は Mux の設定を使用します。",
  "needEndpoint": "URL ではなく、設定済みの Mux エンドポイント名を入力してください。",
  "providerModelHint": "CLI のモデル識別子（通常 provider/model）を使用します。認証はプロバイダーによって異なり、保存済み認証情報は任意です。",
  "optionalCredentialIntro": "{{profile}} は {{kinds}} の保存済みシークレットに対応しています。プロバイダーが要求する場合は選択し、それ以外は認証情報なしで続行できます。",
  "providerEndpoint": "プロバイダー API のエンドポイント URL",
  "providerEndpointHint": "このハーネスは OpenAI 互換の HTTP API を直接呼び出します。ベース URL とモデルを入力してください。",
  "providerAnonymous": "プロバイダーのエンドポイントは認証不要",
  "needProviderEndpoint": "認証情報、クエリ、フラグメントを含まない有効な HTTP または HTTPS の URL を入力してください。"
});
Object.assign(ja.views.agentWizard.design, {
  "firstMessageMux": "作成したいもの: {{goal}}\n\n設定済みの Mux エンドポイント {{endpoint}} を使用してください。モデルと認証には Mux の設定を使用します。必要な質問をしてから、このドラフトでエージェントを設計してください。"
});
Object.assign(ja.views.agentWizard.access, {"intro": "ハーネスと接続設定を選択してください。エージェント設計者も同じ設定で設計を進めます。"});

// Typed inference protocol and authentication editor.
Object.assign(ja, {
  "inference": {
    "modelHint": "このエンドポイントで提供されるモデルを選択します。",
    "title": "推論エンドポイント",
    "protocol": "API プロトコル",
    "baseUrl": "ベース URL",
    "authentication": "認証方式",
    "name": "ヘッダー名 / パラメーター名",
    "location": "認証情報の配置",
    "header": "ヘッダー",
    "query": "クエリ文字列",
    "secret": "認証情報のシークレット",
    "addValue": "認証情報の値を追加",
    "username": "ユーザー名のシークレット",
    "password": "パスワードのシークレット",
    "hint": "プロトコルと認証を別々に選択します。Ollama Cloud はベアラー認証を使用し、ローカル Ollama は通常認証不要です。値は暗号化されたシークレットとして保存されます。",
    "invalid": "有効な URL と必要な認証情報の名前およびシークレットを指定してください。",
    "value": "認証情報の値",
    "auth": {
      "None": "なし",
      "BearerToken": "ベアラートークン",
      "ApiKey": "API キー",
      "Headers": "ヘッダー値",
      "QueryString": "クエリパラメーター",
      "Basic": "基本認証"
    }
  }
});

// Shared runtime connections and the configuration navigation split.
ja.runtime = {
  "title": "ハーネスとエンドポイント",
  "connections": "保存済み接続",
  "templates": "高度なハーネステンプレート",
  "connection": "接続",
  "architect": "アーキテクト",
  "choose": "アーキテクトまたは接続を選択",
  "harness": "ハーネステンプレート",
  "chooseHarness": "ハーネステンプレートを選択",
  "manage": "ハーネスと接続を管理",
  "configureFirst": "まず接続を保存してください。",
  "sharedHint": "ここで一度設定します。アーキテクトとデプロイはこの接続を参照し、変更は次の実行時に適用されます。",
  "reuseHint": "既存のアーキテクトを使うか、保存済み接続から作成します。認証情報や接続情報の再入力は不要です。",
  "importExport": "インポート / エクスポート"
};
ja.nav.hubs.configuration = {"label": "エージェントリソース", "tip": "エージェントとアーキテクトの接続設定。"};
ja.nav.hubs.platformConfiguration = {"label": "プラットフォーム設定", "tip": "認証情報、ストレージ、料金、使用量制限、通知。"};
ja.nav.items.harnessProfiles.label = "ハーネスとエンドポイント";
ja.views.agentWizard.access.intro = "既存のアーキテクトを使うか、保存済み接続から作成します。認証情報や接続情報の再入力は不要です。";

ja.resources.harnessProfiles.title = ja.runtime.title;
ja.resources.harnessProfiles.subtitle = ja.runtime.sharedHint;
ja.components.architectHints.harness = ja.runtime.sharedHint;
ja.components.architectHints.harnessLink = ja.runtime.manage;

Object.assign(ja.runtime, {"add": "接続を追加", "create": "接続を作成", "edit": "接続を編集", "view": "接続の詳細"});

ja.explainers.harnessProfiles.p2 = ja.runtime.sharedHint;
ja.explainers.secrets.p2 = ja.runtime.sharedHint;

// One connection registry; configuration sections use a menu.
Object.assign(ja.runtime, {"title": "接続", "sharedHint": "再利用可能なハーネスとAPIエンドポイント。一度設定すれば、各エージェントから選択できます。", "harness": "接続の種類", "chooseHarness": "ハーネスまたはAPIの種類を選択", "customHarness": "カスタムハーネス", "advancedLaunch": "高度な起動設定", "advancedArchitect": "アーキテクトのオプション（任意）", "pickConnection": "接続を選択してください。モデル、エンドポイント、認証情報は設定済みです。"});
ja.nav.hubs.connections = {"label": "接続", "tip": "再利用可能なハーネスとAPIエンドポイント。一度設定すれば、各エージェントから選択できます。"};
ja.nav.hubs.configuration = {"label": "設定", "tip": "プロンプト、アセット、ツールサーバー、認証情報、ストレージ、ポリシーを管理します。"};
ja.nav.items.harnessProfiles.label = "接続";
ja.resources.harnessProfiles.title = "接続";
ja.components.studio.architect.harnessProfile = ja.runtime.connection;

Object.assign(ja.runtime, {"emptyTitle": "接続はまだありません", "apiType": "HTTP API（Ollama / OpenAI互換）"});

ja.nav.items.manifests.label = ja.runtime.importExport;

ja.runtime.manage = "接続を管理";
ja.components.architectHints.harnessLink = ja.runtime.manage;
ja.explainers.secrets.p2 = "接続はこれらのシークレットを認証に使用します。ここで値を更新すれば、各アーキテクトやデプロイを再設定する必要はありません。";

ja.runtime.launchDefaults = "この接続は既存の起動設定を使用します。必要に応じて高度な起動設定で編集できます。";

// One horizontal workspace navigation level; the wizard selects connections only.
ja.nav.hubs.operations = {"label": "運用", "tip": "保存された出力、モデル料金、使用量制限、通知を管理します。"};
ja.nav.hubs.configuration.tip = "エージェントのプロンプト、アセット、ツール、認証情報、ワークスペース。";
ja.nav.hubs.manifests = { label: ja.runtime.importExport, tip: ja.tips.nav.tabs.manifests };
ja.runtime.choose = "接続を選択";
ja.runtime.reuseHint = "エージェントの設計と実行に使う接続を選択します。設計アシスタントはウィザードが自動的に準備します。";
ja.views.agentWizard.access.intro = ja.runtime.reuseHint;

ja.views.manifests.title = ja.runtime.importExport;

ja.views.agentWizard.design.intro = "アーキテクトの質問に答えて、エージェントを設計します。";

ja.views.studio.deleteMultiple = "複数削除";
ja.views.studio.deleteMultipleMessage = "選択した {{count}} 件の下書きを完全に削除しますか？保留中の適用承認はキャンセルされます。公開済みのエージェントとデプロイには影響しません。";

ja.views.studio.discard = ja.common.actions.delete;
ja.views.studio.discardTitle = "下書きを削除";
ja.views.studio.discardMessage = "{{title}} を完全に削除しますか？公開済みのエージェントとデプロイには影響しません。";
ja.views.studio.discardPendingMessage = "{{title}} を完全に削除しますか？保留中の適用承認はキャンセルされます。公開済みのエージェントとデプロイには影響しません。";
ja.views.studio.discarded = "{{title}} を削除しました。";

ja.components.studio.chat.resize = "チャットのサイズを変更";
ja.components.studio.chat.resizeHint = "ドラッグしてサイズを変更します。上下キーで高さを調整し、Home キーで元に戻します。";

// Secret reveal (Admin on Secret, audited as SecretRevealed).
ja.components.secretReveal = { title: "シークレットの値を表示", warning: "表示すると、保存されている値が平文で示されます。表示のたびに、あなたの名前で監査ログに記録されます。終わったらこのダイアログを閉じてください。値は保持されません。", value: "値", reveal: "表示", hide: "隠す" };
ja.tips.secretReveal = { reveal: "保存されている値を復号して表示します。サーバーは SecretRevealed の監査レコードを書き込みます。", hide: "値を再び隠します。もう一度表示すると、別の監査レコードが書き込まれます。", close: "ダイアログを閉じ、表示した値を破棄します。", value: "保存されているとおりの復号済みの値です。パスワードと同じように扱ってください。", copy: "値をクリップボードにコピーします。" };
ja.resources.secrets.actions.reveal = "表示";
ja.tips.resources.secrets.actions.reveal = "保存されている値を平文で表示します。Secret に対する Admin (SecretManager または TenantAdmin) が必要で、監査ログに記録されます。";
ja.tips.resources.secrets.revealNoValue = "このシークレットにはまだ値が保存されていません。先に「値を設定」を使ってください。";
ja.enums.auditEventType.SecretRevealed = "シークレットが表示された";
ja.tips.enums.auditEventType.SecretRevealed = "Secret に対する Admin を持つユーザーがシークレットの復号済みの値を読み取りました。";
ja.resources.secrets.subtitle = "ハーネスと連携のための暗号化された認証情報です。シークレット管理者は値を表示でき、表示はすべて監査されます。";
ja.tips.nav.tabs.secrets = "暗号化された API キーとトークンです。デプロイメントはエイリアスで紐付けます。値を表示できるのはシークレット管理者だけで、表示はすべて監査されます。";
ja.tips.resources.secrets.add = "API キーやトークンなどの新しい認証情報を、保存時に暗号化して格納します。デプロイメントはエイリアスで参照します。保存後に値を表示できるのは、Secret に対する Admin を持つユーザーだけです。";
ja.tips.resources.secrets.value = "シークレットの値です。保存時に暗号化されます。Secret に対する Admin を持つユーザーは表示でき、表示はすべて監査されます。";
ja.explainers.secrets.p1 = "シークレットは、API キーやトークンなどの暗号化された値です。保存後は置き換えやローテーションができます。値を読み戻せるのは Secret に対する Admin を持つユーザー (SecretManager ロールと TenantAdmin ロール) だけで、表示はすべて監査ログに記録されます。";

// Keepers (AA1.16): the Autonomy workspace, the keeper list and page, keeper enums, and the Home Autonomy card.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "hubs": {
   "autonomy": {
    "label": "自律運用",
    "tip": "自分で働き続けるエージェント。キーパーはスケジュールで起動し、常設の職務を見守ります。"
   }
  },
  "items": {
   "keepers": {
    "label": "キーパー",
    "tip": "スケジュールで起動し、常設の職務を見守るエージェント"
   }
  }
 },
 "enums": {
  "runKind": {
   "Keeper": "キーパーのティック"
  },
  "resourceType": {
   "Mandate": "キーパー (職務)"
  },
  "mandateStatus": {
   "Draft": "下書き",
   "Active": "稼働中",
   "Paused": "一時停止中",
   "Frozen": "凍結中",
   "CapReached": "予算上限に到達",
   "Retired": "廃止"
  },
  "mandateRevisionState": {
   "Draft": "下書き",
   "Published": "公開済み"
  },
  "mandateRevisionSource": {
   "Human": "人",
   "Board": "ボード",
   "Executive": "エグゼクティブ",
   "Architect": "エージェントアーキテクト"
  },
  "wakeMode": {
   "Fixed": "固定間隔",
   "Backoff": "静かなら間隔を延ばす"
  },
  "wakeSource": {
   "Timer": "スケジュール",
   "Manual": "手動で起動",
   "Message": "メッセージ",
   "EscalationAnswer": "エスカレーションに回答済み",
   "Webhook": "ウェブフック",
   "Report": "レポート"
  },
  "tickOutcome": {
   "Quiet": "異常なし",
   "Acted": "対応済み",
   "Attention": "要確認",
   "Escalated": "エスカレーション済み",
   "Failed": "失敗",
   "Skipped": "スキップ",
   "Unreported": "未報告"
  }
 },
 "errorCodes": {
  "MandateActive": "このキーパーのティックが実行中です。完了を待つか、キーパーを一時停止するか、そのまま削除してください。削除するとティックの実行はキャンセルされます。",
  "MandateNotActive": "起動や一時停止ができるのは、稼働中のキーパーだけです。",
  "MandateNotPaused": "再開できるのは、一時停止中のキーパーだけです。",
  "RemoteAgentUnsupported": "キーパーはホスト型デプロイメントで動作するため、リモートエージェントはキーパーにできません。",
  "DeploymentInactive": "そのデプロイメントは無効です。有効なデプロイメントを選んでください。",
  "DeploymentAgentMismatch": "そのデプロイメントは別のエージェントのものです。このエージェントのデプロイメントを選んでください。",
  "RevisionMismatch": "そのリビジョンは別のキーパーのものです。"
 },
 "resources": {
  "runs": {
   "columns": {
    "mandateId": "キーパー"
   }
  },
  "keepers": {
   "title": "キーパー",
   "subtitle": "スケジュールで起動して常設の職務を見守り、そのたびに確認した内容を報告するエージェント。",
   "add": "キーパーを追加",
   "create": "キーパーを作成",
   "edit": "キーパーを編集",
   "view": "キーパーの詳細",
   "deleteTitle": "キーパーを削除",
   "emptyTitle": "キーパーはまだありません",
   "emptyBody": "キーパーを作成すると、キュー、ダッシュボード、受信トレイなどをエージェントが定期的に確認し、必要なときは自分で対応したり助けを求めたりします。",
   "columns": {
    "name": "名前",
    "status": "ステータス",
    "agent": "エージェント",
    "deployment": "デプロイメント",
    "nextWakeUtc": "次回の起動",
    "currentIntervalSeconds": "間隔",
    "lastTick": "直近のティック",
    "tickCount": "ティック数",
    "currentRevisionNumber": "リビジョン",
    "runAs": "実行ユーザー",
    "description": "説明",
    "id": "ID",
    "createdUtc": "作成日時"
   },
   "fields": {
    "name": "名前",
    "description": "説明",
    "agentId": "エージェント",
    "deploymentId": "デプロイメント",
    "objective": "目的",
    "healthyDefinition": "正常な状態とは",
    "autonomy": "自分の判断でできること",
    "escalationPolicy": "助けを求める条件",
    "direction": "現在の方針",
    "signals": "監視するシグナル",
    "signalsItems": {
     "name": "シグナル",
     "description": "意味"
    },
    "wakeMode": "起動モード",
    "minIntervalSeconds": "最小間隔 (秒)",
    "maxIntervalSeconds": "最大間隔 (秒)",
    "backoffFactor": "バックオフ係数",
    "jitterPercent": "ジッター (パーセント)",
    "budgetPerTickUsd": "ティックあたりの予算 (USD)",
    "budgetPerDayUsd": "1 日あたりの予算 (USD)",
    "maxTokensPerTick": "ティックあたりの最大トークン数",
    "changeNote": "変更メモ"
   },
   "hints": {
    "name": "小文字の英字、数字、ハイフンが使えます。",
    "agentId": "ホスト型エージェントを選びます。キーパーの作成後にエージェントは変更できません。",
    "deploymentId": "各ティックを実行する有効なデプロイメントです。",
    "objective": "常設の職務を平易な言葉で書きます。キーパーはティックのたびにこれを読みます。",
    "minIntervalSeconds": "{{min}} から {{max}} 秒の範囲です。クラスター設定 Autonomy.MinIntervalSeconds により下限が引き上げられる場合があります。",
    "maxIntervalSeconds": "{{min}} から {{max}} 秒の範囲です。バックオフによる延長はここで止まります。",
    "backoffFactor": "{{min}} から {{max}} の範囲です。静かなティックのたびに、間隔がこの値で掛け算されます。",
    "jitterPercent": "{{min}} から {{max}} の範囲です。空欄ならクラスターの既定値を使います。",
    "budgetPerTickUsd": "空欄なら上限なしです。",
    "budgetPerDayUsd": "空欄なら上限なしです。",
    "maxTokensPerTick": "入力と出力のトークンの合計です。空欄なら上限なしです。",
    "changeNote": "このリビジョンでキーパーを変更する理由です。リビジョン一覧に表示されます。"
   },
   "sections": {
    "mandate": "職務",
    "schedule": "起動スケジュール",
    "budgets": "予算"
   },
   "sectionHints": {
    "mandate": "保存すると、これらの項目がリビジョン 1 として公開され、起動スケジュールが始まります。以降の変更は、キーパーのページの「新しいリビジョン」から行います。",
    "budgets": "現時点では保存のみで、適用は今後のリリースで行われます。"
   },
   "errors": {
    "name": "小文字の英字、数字、ハイフンで 1 から 64 文字にし、先頭と末尾は英字か数字にしてください。",
    "nameTaken": "この名前は別のキーパーがすでに使っています。",
    "text": "{{max}} 文字までです。",
    "agentRequired": "この職務を担当するエージェントを選んでください。",
    "deploymentRequired": "ティックを実行するデプロイメントを選んでください。",
    "objective": "常設の職務を記入してください。",
    "signalsMax": "1 つのリビジョンに設定できるシグナルは最大 {{max}} 個です。",
    "signalName": "シグナル名は 1 から {{max}} 文字にしてください。",
    "signalUnique": "シグナル名は重複しないようにしてください。",
    "signalsInvalid": "下でマークされたシグナルを修正してください。",
    "interval": "{{min}} から {{max}} の整数 (秒) を入力してください。",
    "maxBelowMin": "最大間隔を最小間隔より短くすることはできません。",
    "backoffFactor": "{{min}} から {{max}} の数値を入力してください。",
    "jitterPercent": "{{min}} から {{max}} の整数を入力してください。",
    "budget": "{{min}} から {{max}} の金額を入力してください。",
    "maxTokens": "{{min}} から {{max}} の整数を入力してください。"
   },
   "actions": {
    "pause": "一時停止",
    "resume": "再開",
    "wake": "今すぐ起動",
    "runs": "実行を表示"
   },
   "toasts": {
    "pause": "{{name}} を一時停止しました。",
    "resume": "{{name}} を再開しました。すぐに起動します。",
    "wake": "{{name}} をすぐに起動します。"
   },
   "units": {
    "seconds_other": "{{count}} 秒",
    "minutes_other": "{{count}} 分",
    "hours_other": "{{count}} 時間",
    "days_other": "{{count}} 日"
   },
   "ticking": "ティック実行中",
   "neverTicked": "まだ起動していません",
   "addSignal": "シグナルを追加",
   "signalNamePlaceholder": "キューの深さ",
   "editNotice": "{{name}} として実行されます。保存すると、あなたがティックの実行主体になります。目的やスケジュールを変えるには、キーパーを開いて「新しいリビジョン」を使ってください。"
  }
 },
 "components": {
  "keeperRevision": {
   "title": "{{name}} の新しいリビジョン",
   "intro": "これがリビジョン {{number}} になります。公開するとすぐに現在のリビジョンとなり、バックオフがリセットされ、キーパーが起動します。",
   "draft": "下書きとして保存",
   "publish": "公開",
   "drafted": "リビジョン {{number}} を下書きとして保存しました。",
   "published": "リビジョン {{number}} を公開しました。"
  }
 },
 "views": {
  "runDetail": {
   "keeper": "キーパー"
  },
  "home": {
   "autonomy": {
    "title": "自律運用",
    "open": "キーパーを開く",
    "empty": "キーパーはまだありません。キーパーはスケジュールで起動し、常設の職務を見守ります。",
    "active": "稼働中",
    "paused": "一時停止中",
    "ticking": "ティック実行中",
    "nextWake": "次回の起動:",
    "allQuiet": "確認が必要なキーパーはありません。",
    "attention_other": "確認が必要なキーパーが {{count}} 件あります"
   }
  },
  "keeperDetail": {
   "title": "キーパー",
   "heading": "キーパー {{name}}",
   "notFoundTitle": "キーパーが見つかりません",
   "notFoundBody": "削除されたか、別のテナントのものである可能性があります。",
   "live": "ライブ",
   "polling": "更新中",
   "newRevision": "新しいリビジョン",
   "noWake": "スケジュールなし",
   "quietStreak": "連続した異常なしのティック",
   "activeRun": "実行中のティック",
   "revisionTitle": "現在のリビジョン",
   "revisionHeading": "現在のリビジョン ({{number}})",
   "noRevision": "公開済みのリビジョンはまだありません。「新しいリビジョン」で作成して公開してください。",
   "clusterDefault": "クラスターの既定値",
   "noLimit": "上限なし",
   "ticks": "ティック",
   "outcomeFilter": "結果",
   "allOutcomes": "すべての結果",
   "noTicksTitle": "ティックはまだありません",
   "noTicksActive": "最初のティックは次回の起動時に始まります。すぐに始めるには「今すぐ起動」を使ってください。",
   "noTicksBody": "キーパーが稼働して起動すると、ここにティックが表示されます。",
   "chartTitle": "各ティック後の間隔",
   "chartHelp": "各ティックの終了時に設定された、次回の起動までの分数です。バックオフモードでは、静かなティックのたびに長くなります。",
   "chartSeries": "間隔 (分)",
   "columns": {
    "started": "開始",
    "source": "起動元",
    "outcome": "結果",
    "run": "実行",
    "interval": "次回までの間隔",
    "cost": "コスト",
    "summary": "概要",
    "number": "番号",
    "state": "状態",
    "revisionSource": "作成元",
    "author": "作成者",
    "changeNote": "変更メモ",
    "created": "作成日時"
   },
   "requested": "{{interval}} を要求",
   "revisions": "リビジョン",
   "noRevisions": "リビジョンはまだありません。",
   "current": "現在",
   "diff": "比較",
   "diffTitle": "リビジョン {{number}} と1つ前の比較",
   "diffFirst": "これは最初のリビジョンなので、内容はすべて新規です。",
   "revisionLabel": "リビジョン {{number}}",
   "nothing": "なし",
   "confirmDelete": "キーパー {{name}} を、そのリビジョンとティック履歴ごと削除しますか？ 過去の実行は残ります。",
   "confirmForceDelete": "{{name}} のティックが実行中です。このままキーパーを削除し、そのティックの実行をキャンセルしますか？",
   "forceDelete": "削除してティックをキャンセル",
   "changeNote": "変更メモ: {{note}}"
  }
 },
 "tips": {
  "nav": {
   "hubs": {
    "autonomy": "リクエストの合間にも自分で働くエージェント。キーパーはスケジュールで起動し、常設の職務を確認して、対応したり助けを求めたりします。"
   },
   "tabs": {
    "keepers": "キーパー: スケジュールで起動して常設の職務を見守るエージェント。ティックとリビジョンも確認できます。"
   }
  },
  "enums": {
   "runKind": {
    "Keeper": "キーパーの起動によって開始されました。この実行はそのキーパーの 1 回のティックで、キーパーにリンクされています。"
   },
   "resourceType": {
    "Mandate": "キーパー (職務): エージェントが起動スケジュールで見守る常設の職務。リビジョンとティックも含みます。"
   },
   "mandateStatus": {
    "Draft": "公開済みのリビジョンがない状態で作成されたため、まだ起動しません。リビジョンを公開すると開始します。",
    "Active": "スケジュールどおりに起動します。起動のたびに、そのデプロイメントの実行である 1 回のティックが始まります。",
    "Paused": "誰かが再開するまで起動しません。再開するとすぐに起動し、間隔はリセットされます。",
    "Frozen": "管理者またはポリシーによって停止されています。凍結が解除されるまで起動しません。",
    "CapReached": "1 日の予算を使い切りました。次の UTC の日が始まると、再び起動します。",
    "Retired": "使用されなくなりました。履歴は残りますが、起動することはありません。"
   },
   "mandateRevisionState": {
    "Draft": "保存されていますが、使用されていません。公開すると、キーパーの現在のリビジョンになります。",
    "Published": "使用されている、または使用されたことがあります。公開済みのリビジョンは変更できないため、代わりに新しいリビジョンを作成してください。"
   },
   "mandateRevisionSource": {
    "Human": "ダッシュボード、API、またはマニフェストで人が書いたものです。",
    "Board": "このキーパーを監督するエージェントのボードが設定したものです。",
    "Executive": "このキーパーを指揮するエグゼクティブエージェントが設定したものです。",
    "Architect": "エージェントアーキテクトがスタジオの下書きから作成したものです。"
   },
   "wakeMode": {
    "Fixed": "直近のティックの結果にかかわらず、最小間隔ごとに起動します。",
    "Backoff": "静かなティックのたびに待ち時間を延ばし、最大間隔まで伸びます。何かが起きると最小間隔に戻ります。"
   },
   "wakeSource": {
    "Timer": "起動スケジュールの時刻になり、キーパーが自分で起動しました。",
    "Manual": "誰かが「今すぐ起動」を使ったか、キーパーを再開しました。",
    "Message": "キーパー宛てのメッセージが届きました。",
    "EscalationAnswer": "キーパーがエスカレーションした質問に、誰かが回答しました。",
    "Webhook": "別のシステムがキーパーの Webhook を呼び出しました。",
    "Report": "別のエージェントのレポートが、このキーパーに確認を求めました。"
   },
   "tickOutcome": {
    "Quiet": "すべて正常で、対応は不要でした。バックオフモードでは、次の起動が遅くなります。",
    "Acted": "職務を正常に保つため、キーパーが何かを変更しました。",
    "Attention": "キーパーが、人が確認すべき点を見つけました。",
    "Escalated": "キーパーが、人または別のエージェントに判断を求めました。",
    "Failed": "ティックの実行が失敗したか、タイムアウトしたか、キャンセルされました。",
    "Skipped": "前のティックがまだ実行中に起動が来たためスキップされ、次の起動はその完了を待ちます。",
    "Unreported": "実行は結果を報告せずに終了しました。キーパーにはより明確な目的が必要かもしれません。"
   }
  },
  "resources": {
   "runs": {
    "mandateId": "この実行を自分のティックとして開始したキーパー (ある場合)。クリックするとキーパーが開きます。",
    "openKeeper": "この実行がティックとなっているキーパーを開きます。"
   },
   "keepers": {
    "add": "キーパーを作成します。ホスト型エージェントとデプロイメントを選び、常設の職務を書き、起動の頻度を設定します。",
    "name": "このテナント内で一意の名前です。URL、マニフェスト、API で使われます。",
    "status": "キーパーがスケジュールどおりに起動するか (稼働中)、待機、一時停止、凍結、廃止のいずれかを示します。",
    "agent": "この職務を担当するホスト型エージェントです。各ティックでこのエージェントが実行されます。",
    "deployment": "各ティックを実行するデプロイメントです。ハーネス、モデル、ツールが決まります。",
    "nextWakeUtc": "次のティックが始まる時刻です。カーソルを重ねると正確な時刻が表示されます。",
    "currentIntervalSeconds": "直近のティックの後の待ち時間です。バックオフモードでは、静かなティックのたびに長くなります。",
    "lastTick": "キーパーが最後に起動した時刻と、そのティックの報告内容です。",
    "tickCount": "キーパーがこれまでに実行したティックの合計数です。",
    "currentRevisionNumber": "キーパーが現在従っている公開済みのリビジョンです。",
    "runAs": "各ティックが権限を引き継ぐユーザーまたは認証情報です。キーパーを最後に保存した人になります。",
    "description": "人のためのメモです。キーパーはこれを読まず、目的を読みます。",
    "id": "キーパーの識別子です。API や実行記録で使われます。",
    "createdUtc": "キーパーが作成された日時です。",
    "agentId": "この職務を担当するホスト型エージェントです。リモートエージェントはキーパーにできません。作成後は変更できません。",
    "deploymentId": "各ティックを実行する、そのエージェントの有効なデプロイメントです。",
    "objective": "サポートキューの未対応チケットを 20 件未満に保つ、のように、常設の職務を平易な言葉で書きます。キーパーはティックのたびにこれを読みます。",
    "healthyDefinition": "良い状態がどのようなものかを示し、キーパーが静かなティックと対応が必要なティックを見分けられるようにします。",
    "autonomy": "誰にも確認せず、キーパーが自分の判断で変更してよいことです。",
    "escalationPolicy": "キーパーが手を止めて、人または別のエージェントに判断を求めるべきタイミングです。",
    "direction": "今週の重点など、頻繁に変わりうる短期的な指針です。",
    "signals": "キーパーが各ティックで確認すべき名前付きの指標と、それぞれの意味です。",
    "signalsItems": {
     "name": "指標の短い名前です。リビジョン内で一意にしてください。",
     "description": "指標の意味と、どの値が懸念されるかを書きます。"
    },
    "wakeMode": "固定は毎回、最小間隔で起動します。バックオフは静かなティックの後に待ち時間を延ばします。",
    "minIntervalSeconds": "スケジュールされた起動の間の最短の待ち時間 (秒) です。",
    "maxIntervalSeconds": "バックオフモードでの、スケジュールされた起動の間の最長の待ち時間 (秒) です。",
    "backoffFactor": "バックオフモードで、静かなティックのたびに待ち時間が伸びる倍率です。2 なら倍になります。",
    "jitterPercent": "間隔のこの割合までのランダムな遅延です。多くのキーパーが同時に起動しないようにします。",
    "budgetPerTickUsd": "1 回のティックにかけてよい最大額 (米ドル) です。",
    "budgetPerDayUsd": "このキーパーのティックが UTC の 1 日にかけてよい最大額 (米ドル) です。",
    "maxTokensPerTick": "1 回のティックで使える入力と出力のトークンの最大数です。",
    "changeNote": "このリビジョンでキーパーを変更する理由の短いメモです。リビジョンとともに保存されます。",
    "sections": {
     "mandate": "キーパーが見守る対象と、自分の判断でどこまでできるかです。",
     "schedule": "キーパーが起動する頻度と、静かなティックの後に待ち時間がどう変わるかです。",
     "budgets": "キーパーのティックにかかるコストと使用量の上限です。"
    },
    "actions": {
     "pause": "このキーパーの起動を止めます。実行中のティックは完了しますが、再開するまで新しいティックは始まりません。",
     "resume": "このキーパーの起動を再開します。すぐに起動し、間隔は最小値にリセットされます。",
     "wake": "スケジュールを待たずに、今すぐティックを開始します。ティックが実行中の場合、新しいティックはその後に始まります。",
     "runs": "このキーパーのティックで絞り込んだ実行ページを開きます。"
    },
    "ticking": "このキーパーのティックが今実行中です。"
   }
  },
  "keeperRevision": {
   "done": "このダイアログを閉じます。リビジョンは、上に示した調整後の値で保存されました。",
   "draft": "このリビジョンを使用せずに下書きとして保存します。後でリビジョン一覧から公開できます。",
   "publish": "このリビジョンを保存し、すぐに現在のリビジョンにします。バックオフがリセットされ、キーパーがすぐに起動します。"
  },
  "views": {
   "runDetail": {
    "keeper": "この実行を自分のティックとして開始したキーパーです。",
    "openKeeper": "キーパーをティックとリビジョンとともに開きます。"
   },
   "home": {
    "autonomy": {
     "title": "このテナント内のキーパーと、直近のティックで人の確認が必要なキーパーです。",
     "open": "キーパーのページを開いて、キーパーの作成、一時停止、起動、編集を行います。",
     "active": "スケジュールどおりに起動するキーパーです。",
     "paused": "誰かが再開するまで起動しないキーパーです。",
     "ticking": "今ティックを実行しているキーパーです。",
     "nextWake": "稼働中のキーパーのうち、最も早く予定されている起動です。",
     "attention": "直近のティックが要確認、エスカレーション済み、失敗、または未報告のキーパーと、予算または凍結で停止しているキーパーです。",
     "openKeeper": "このキーパーのページを開いて、ティックを確認します。"
    }
   },
   "keeperDetail": {
    "openRun": "この実行の詳細ページを開きます。トランスクリプト、ツール呼び出し、結果を確認できます。",
    "live": "ティックの開始と終了に合わせて、ライブ接続で更新が届きます。",
    "polling": "ライブ接続が利用できないため、ページが数秒ごとにキーパーを再取得します。",
    "viewJson": "現在のリビジョンを含むキーパーのレコードを JSON で表示します。",
    "newRevision": "現在のリビジョンをもとに、目的、スケジュール、予算の新しいリビジョンを書きます。",
    "delete": "このキーパーを、リビジョンとティック履歴ごと削除します。過去の実行は残ります。",
    "forceDelete": "キーパーを削除し、進行中のティックの実行をキャンセルします。",
    "openAgent": "このキーパーが実行するエージェントを開きます。",
    "quietStreak": "対応すべきことが何もなかったティックの連続回数です。バックオフモードでは、1 回ごとに待ち時間が長くなります。",
    "activeRun": "進行中のティックの実行です (ある場合)。",
    "revisionTitle": "キーパーがティックのたびに従う、公開済みのリビジョンです。",
    "ticks": "このキーパーのすべての起動を新しい順に表示します。何が起動させたか、何を見つけたか、設定した待ち時間がわかります。",
    "outcomeFilter": "この結果のティックだけを表示します。",
    "outcomeCounts": "このページのティックの、結果ごとの件数です。",
    "chart": "このページの各ティック後の待ち時間です。左が古いティックです。バックオフモードでは静かなティックの後に長くなり、何かが起きるとリセットされます。",
    "columns": {
     "started": "ティックが始まった時刻です。カーソルを重ねると正確な時刻が表示されます。",
     "source": "このティックでキーパーを起動させたものです。",
     "outcome": "ティックの報告内容です。異常なし、対応済み、要確認、エスカレーション済み、失敗のいずれかです。",
     "run": "このティックを実行した実行です。",
     "interval": "このティックの終了時に設定された、次回の起動までの待ち時間です。",
     "cost": "モデルの価格表に基づく、このティックの実行コストです。",
     "summary": "キーパーが見つけた内容や行った対応、またはティックを止めたエラーです。",
     "number": "リビジョン番号です。現在のものにはマークが付きます。",
     "state": "下書きのリビジョンは保存済みで未使用です。公開済みのものは使用中、または使用済みです。",
     "revisionSource": "リビジョンを書いたのは誰か。人、エージェントアーキテクト、監督するエージェントのいずれかです。",
     "author": "リビジョンを保存したユーザーまたは認証情報です。",
     "changeNote": "このリビジョンでキーパーを変更した理由です。",
     "created": "リビジョンが保存された日時です。"
    },
    "requested": "キーパーがこの待ち時間を要求しました。サーバーは最小間隔と最大間隔の範囲内に収めます。",
    "revisions": "このキーパーのすべてのリビジョンを新しい順に表示します。1 つ前と比較したり、下書きを公開したりできます。",
    "current": "キーパーが現在従っているリビジョンです。",
    "diff": "このリビジョンが、1 つ前のリビジョンと比べて何を変更したかを表示します。"
   }
  }
 },
 "explainers": {
  "keepers": {
   "title": "キーパー",
   "p1": "キーパーは、常設の職務 を持つエージェントです。スケジュールで起動して状況を確認し、自分の判断で許された範囲で対応し、そのたびに短い結果を報告します。起動 1 回が 1 ティックで、1 ティックはキーパーのデプロイメントの 1 回の実行です。",
   "p2": "バックオフモードでは、静かなティックのたびに次の起動が最大間隔まで遅くなり、それ以外の結果では最小間隔に戻ります。同時に実行されるティックは 1 つだけです。ティックの最中に来た起動は、その完了を待ちます。",
   "p3": "目的、スケジュール、予算の変更はリビジョンとして扱います。リビジョンを公開するとすぐに現在のリビジョンとなり、キーパーが起動します。すべてのリビジョンは履歴に残り、比較できます。"
  }
 }
});

// Escalations (AA2.13): the Escalations page, answer dialog, detail page, Autonomy badge, Home list, escalation
// enums, keeper escalation targets, and the notification endpoint minimum severity.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "hubs": {
   "autonomy": {
    "tip": "自分で動き続けるエージェント。キーパーはスケジュールどおりに起動して継続的な任務を見守り、エスカレーションは人に向けた質問です。"
   }
  },
  "items": {
   "escalations": {
    "label": "エスカレーション",
    "tip": "エージェントが人、ロール、または別のエージェントに尋ねた質問と回答"
   }
  },
  "escalationsOpen_other": "回答待ちのエスカレーションが {{count}} 件あります"
 },
 "enums": {
  "resourceType": {
   "Escalation": "エスカレーション"
  },
  "notificationEvent": {
   "EscalationRaised": "エスカレーション作成",
   "EscalationExpired": "エスカレーション期限切れ"
  },
  "escalationStatus": {
   "Open": "未回答",
   "Answered": "回答済み",
   "Expired": "期限切れ",
   "Cancelled": "キャンセル済み",
   "Withdrawn": "取り下げ"
  },
  "escalationSeverity": {
   "Info": "情報",
   "Warning": "警告",
   "Urgent": "緊急"
  },
  "escalationMode": {
   "NonBlocking": "非ブロッキング",
   "Blocking": "ブロッキング"
  },
  "escalationTargetKind": {
   "User": "ユーザー",
   "Role": "ロール",
   "Agent": "エージェント",
   "Manager": "マネージャー"
  },
  "escalationTimeoutAction": {
   "UseDefaultAnswer": "既定の回答を使う",
   "Cancel": "キャンセル",
   "EscalateUp": "上位へエスカレーション"
  },
  "escalationResolutionSource": {
   "User": "人",
   "Agent": "エージェント",
   "Timeout": "期限切れ",
   "Raiser": "作成した実行",
   "System": "Garrison"
  }
 },
 "components": {
  "escalations": {
   "passedUp": "上位へエスカレーション済み",
   "answerTitle": "{{agent}} に回答",
   "submit": "回答を送信",
   "expires": "{{when}}に期限切れ。その後: {{action}}",
   "question": "質問",
   "context": "状況",
   "choice": "選択肢を選ぶ",
   "default": "既定",
   "defaultAnswer": "既定の回答: {{answer}}",
   "explain": "説明 (任意)",
   "text": "回答",
   "textPlaceholder": "回答を書いてください。エージェントは指示ではなくデータとして読みます。",
   "errors": {
    "choice": "選択肢を 1 つ選んでください。",
    "unknownChoice": "このエスカレーションにその選択肢はありません。",
    "text": "回答を書いてください。",
    "textMax": "回答は {{max}} 文字までです。"
   },
   "toasts": {
    "answered": "{{agent}} に回答を送信しました。",
    "passedUp": "このエスカレーションは別のエスカレーションに引き継がれました。そちらに回答してください。",
    "notOpen": "先に別の人が回答したか、期限が切れました。",
    "forbidden": "回答するには Escalation の Update 権限が必要です。"
   }
  }
 },
 "resources": {
  "escalations": {
   "title": "エスカレーション",
   "subtitle": "エージェントが人、ロール、または別のエージェントに尋ねた質問です。未回答のものは回答を待ち、ブロッキングのものはそれまで実行を止めます。",
   "add": "エスカレーションを追加",
   "create": "エスカレーションを作成",
   "edit": "エスカレーションを編集",
   "view": "エスカレーションの詳細",
   "deleteTitle": "エスカレーションを削除",
   "emptyTitle": "エスカレーションはありません",
   "emptyBody": "エージェントが garrison_escalate で人、ロール、または別のエージェントに判断を求めると、ここに表示されます。",
   "columns": {
    "createdUtc": "作成",
    "severity": "重要度",
    "status": "状態",
    "question": "質問",
    "agent": "エージェント",
    "target": "宛先",
    "expiresUtc": "期限",
    "answer": "回答",
    "mode": "モード",
    "mandate": "キーパー",
    "resolvedBy": "回答者",
    "resolutionSource": "解決元",
    "resolvedUtc": "解決",
    "raisingRunId": "作成した実行",
    "id": "ID"
   },
   "filters": {
    "targetKind": "宛先"
   },
   "fields": {
    "status": "状態",
    "severity": "重要度",
    "mode": "モード",
    "target": "宛先",
    "agent": "作成者",
    "raisingRunId": "作成した実行",
    "mandate": "キーパー",
    "mandateTickId": "キーパーのティック",
    "routedRunId": "回答する実行",
    "parentEscalationId": "引き継ぎ元",
    "escalatedToId": "引き継ぎ先",
    "timeoutAction": "期限切れ時",
    "expiresUtc": "期限",
    "createdUtc": "作成",
    "leaseEpoch": "リースエポック",
    "context": "状況",
    "options": "選択肢",
    "answerChoice": "選択",
    "answerText": "回答",
    "resolvedBy": "回答者",
    "resolutionSource": "解決元",
    "resolvedUtc": "解決"
   },
   "actions": {
    "answer": "回答",
    "openEscalatedTo": "引き継ぎ先のエスカレーションを開く",
    "openRun": "作成した実行を開く",
    "openKeeper": "キーパーを開く",
    "cancel": "エスカレーションをキャンセル"
   },
   "cancelTitle": "このエスカレーションをキャンセルしますか?",
   "cancelMessage": "{{agent}} は回答を受け取りません。エスカレーションはキャンセル済みとして残ります。",
   "cancelBlocking": "{{agent}} はこの回答を待っています。エスカレーションをキャンセルすると、その実行もキャンセルされます。",
   "toasts": {
    "cancelled": "エスカレーションをキャンセルしました。"
   }
  },
  "keepers": {
   "fields": {
    "escalationTargetKind": "エスカレーション先",
    "escalationTargetId": "エスカレーション先の ID"
   },
   "noEscalationTarget": "リビジョンを保存した人",
   "escalationTargetPlaceholder": "ユーザー、ロール、またはエージェントの ID か名前",
   "errors": {
    "escalationTargetId": "エスカレーション先のユーザー、ロール、またはエージェントを指定してください。"
   }
  },
  "notifications": {
   "fields": {
    "escalationMinimumSeverity": "エスカレーションの最低重要度"
   },
   "anySeverity": "すべての重要度"
  }
 },
 "views": {
  "escalationDetail": {
   "title": "エスカレーション",
   "titleWithAgent": "{{agent}} からのエスカレーション",
   "notFoundTitle": "エスカレーションが見つかりません",
   "notFoundBody": "このテナントに存在しないか、テナントと一緒に削除されました。",
   "back": "エスカレーション一覧に戻る",
   "open": "このエスカレーションは回答を待っています。",
   "openBlocking": "このエスカレーションに回答があるまで、作成した実行は一時停止しています。",
   "expires": "{{when}}に期限切れになり、その後: {{action}}。",
   "passedUp": "期限内に回答がなかったため、このエスカレーションは引き継がれました。新しい方に回答してください:",
   "question": "質問",
   "chosen": "選択済み",
   "answer": "回答"
  },
  "home": {
   "escalations": {
    "title_other": "回答待ちのエスカレーション {{count}} 件",
    "open": "エスカレーションを開く",
    "more_other": "ほか {{count}} 件。"
   }
  }
 },
 "tips": {
  "nav": {
   "escalationsBadge_other": "回答待ちのエスカレーションが {{count}} 件あります。自律運用からエスカレーションを開いてください。",
   "tabs": {
    "escalations": "エスカレーション: エージェントが人、ロール、または別のエージェントに尋ねた質問。未回答のものが先頭で、回答とキャンセルができます。"
   }
  },
  "enums": {
   "resourceType": {
    "Escalation": "実行が人、ロール、または別のエージェントに尋ねる質問と、その回答。"
   },
   "notificationEvent": {
    "EscalationRaised": "エージェントがエスカレーションを作成しました。エンドポイントは最低重要度未満のものを除外できます。",
    "EscalationExpired": "誰も回答しないまま、エスカレーションの期限が切れました。"
   },
   "escalationStatus": {
    "Open": "回答を待っています。ブロッキングのエスカレーションはそれまで実行を止めます。",
    "Answered": "誰かが回答し、作成した実行またはキーパーが回答を受け取りました。",
    "Expired": "期限までに回答がなく、期限切れ時の動作が実行されました。",
    "Cancelled": "人がキャンセルしました。待機していた実行もキャンセルされました。",
    "Withdrawn": "作成したエージェントが質問を取り下げました。"
   },
   "escalationSeverity": {
    "Info": "情報提供です。都合のよいときに回答してください。",
    "Warning": "近いうちに判断が必要です。既定の重要度です。",
    "Urgent": "すぐに判断が必要です。一覧の先頭に表示され、購読しているすべてのエンドポイントに送られます。"
   },
   "escalationMode": {
    "NonBlocking": "実行は続行し、後で回答を受け取ります。キーパーは次のティックで受け取ります。",
    "Blocking": "誰かが回答するまで実行が一時停止し、その後回答を持って再開します。"
   },
   "escalationTargetKind": {
    "User": "1 人のユーザー。ユーザー ID またはメールで指定します。",
    "Role": "そのロールを持ち、エスカレーションを更新できる人。",
    "Agent": "別のエージェント。既定のアクティブなデプロイメントの実行が質問を受け取ります。",
    "Manager": "組織内でのエージェントのマネージャー。組織機能が入るまで使えません。"
   },
   "escalationTimeoutAction": {
    "UseDefaultAnswer": "期限内に回答がなければ、既定の回答で答えます。",
    "Cancel": "期限内に回答がなければ、エスカレーションと待機中の実行をキャンセルします。",
    "EscalateUp": "期限内に回答がなければ、キーパーの既定のエスカレーション先に質問を回します。"
   },
   "escalationResolutionSource": {
    "User": "人が回答またはキャンセルしました。",
    "Agent": "別のエージェントが garrison_answer_escalation で回答しました。",
    "Timeout": "期限切れ時の動作で解決しました。",
    "Raiser": "作成した実行が取り下げました。",
    "System": "Garrison が解決しました。たとえば実行が終了したときです。"
   }
  },
  "components": {
   "escalations": {
    "passedUp": "期限内に回答がなかったため、質問は別のエスカレーションに回されました。そちらに回答してください。",
    "submit": "回答を送信します。一時停止中の実行は再開し、キーパーは回答とともに起動します。",
    "question": "エージェントが書いたとおりの質問です。",
    "context": "エージェントが状況について述べた内容です。エージェントの文章であり、あなたへの指示ではありません。",
    "choice": "エージェントが提示した選択肢です。1 つ選んでください。",
    "defaultChoice": "既定の回答です。期限切れ時の動作が「既定の回答を使う」の場合に使われます。",
    "pickChoice": "この選択肢を選びます。",
    "explain": "選択に添える任意の文章です。たとえば理由など。",
    "text": "あなたの回答です。エージェントはデータとして受け取ります。"
   }
  },
  "resources": {
   "escalations": {
    "createdUtc": "エージェントが作成した日時。ポインターを合わせると正確な時刻が表示されます。",
    "severity": "エージェントが示した緊急度。",
    "status": "未回答、回答済み、期限切れ、キャンセル済み、または取り下げ。",
    "question": "エージェントが書いたとおりの質問。ポインターを合わせると全文を表示します。",
    "agent": "このエスカレーションを作成した実行のエージェント。",
    "target": "宛先: ユーザー、ロール、または別のエージェント。",
    "expiresUtc": "回答がない場合に期限が切れる日時。",
    "answer": "選ばれた選択肢または回答の文章。",
    "mode": "ブロッキングのエスカレーションは回答まで実行を止めます。非ブロッキングは止めません。",
    "mandate": "このエスカレーションを作成したティックのキーパー (ある場合)。",
    "resolvedBy": "回答またはキャンセルした人。",
    "resolutionSource": "解決したもの: 人、エージェント、期限切れ、または作成した実行。",
    "resolvedUtc": "回答、キャンセル、取り下げ、または期限切れになった日時。",
    "raisingRunId": "このエスカレーションを作成した実行。行のメニューから開けます。",
    "id": "エスカレーション ID (esc_...)。API と MCP ツールで使います。",
    "routedRunId": "別のエージェントが回答できるように開始された実行。",
    "mandateTickId": "このエスカレーションを作成したキーパーのティック。",
    "parentEscalationId": "期限が切れてこのエスカレーションに回されたエスカレーション。",
    "escalatedToId": "期限切れ時にこのエスカレーションが回された先。",
    "timeoutAction": "期限内に回答がない場合の動作。",
    "leaseEpoch": "エスカレーション作成時の実行のリースエポック。ブロッキングの待機はそのエポックに属します。",
    "context": "エージェントが状況について述べた内容です。エージェントの文章であり、あなたへの指示ではありません。",
    "options": "エージェントが提示した回答。期限切れ時の動作が「既定の回答を使う」の場合は既定の回答が使われます。",
    "answerChoice": "選ばれた選択肢。",
    "answerText": "回答の文章。",
    "actions": {
     "answer": "選択肢または自由記述でこのエスカレーションに回答します。",
     "openEscalatedTo": "このエスカレーションが回された先を開きます。",
     "openRun": "このエスカレーションを作成した実行を開きます。",
     "openKeeper": "このエスカレーションを作成したティックのキーパーを開きます。",
     "cancel": "回答せずにキャンセルします。待機中の実行もキャンセルされます。"
    }
   },
   "keepers": {
    "escalationTargetKind": "キーパーが宛先を指定しないときのエスカレーション先。期限切れのエスカレーションもここに回されます。",
    "escalationTargetId": "エスカレーション先のユーザー ID またはメール、ロール名、またはエージェントの ID か名前。"
   },
   "notifications": {
    "escalationMinimumSeverity": "この重要度以上のエスカレーションイベントだけを送信します。エスカレーション作成とエスカレーション期限切れに適用されます。"
   }
  },
  "views": {
   "escalationDetail": {
    "openRun": "この実行を開きます。",
    "openEscalation": "このエスカレーションを開きます。",
    "back": "エスカレーション一覧に戻ります。",
    "viewJson": "API が返すとおりのエスカレーションを表示します。",
    "question": "エージェントが書いた質問と状況、提示された選択肢。",
    "answer": "エスカレーションがどのように解決されたか。",
    "openAgent": "このエスカレーションを作成したエージェントを開きます。",
    "openKeeper": "このエスカレーションを作成したティックのキーパーを開きます。"
   },
   "home": {
    "escalations": {
     "title": "回答待ちのエスカレーション。緊急度の高いものから表示します。",
     "open": "エスカレーション一覧を開きます。"
    }
   }
  },
  "filters": {
   "severity": "この重要度のエスカレーションだけを表示します。すべてを選ぶとフィルターを外します。",
   "targetKind": "ユーザー、ロール、またはエージェント宛てのエスカレーションだけを表示します。すべてを選ぶとフィルターを外します。"
  }
 },
 "explainers": {
  "escalations": {
   "title": "エスカレーション",
   "p1": "エスカレーションは、エージェントが単独で決めるべきでないときに尋ねる質問です。ユーザー、ロールを持つ全員、または別のエージェントに送られ、選択肢、既定の回答、重要度、期限を任意で付けられます。",
   "p2": "ほとんどのエスカレーションは非ブロッキングです。実行は続行し、キーパーは次のティックで回答を見つけます。ブロッキングのエスカレーションは実行を一時停止し、誰かが回答すると回答を持って再開します。",
   "p3": "期限内に回答がなければ、期限切れ時の動作が実行されます。既定の回答を使う、キャンセルする、またはキーパーの既定のエスカレーション先に質問を回す、のいずれかです。回答はデータとしてエージェントに届き、権限を広げることはありません。"
  }
 }
});

// Brakes (AA3.8): the Freezes page, the freeze and lift dialogs, the frozen banners, the autonomy kill switch on
// Settings and the Home Autonomy card, the freeze enums and audit and notification events, and the brake error codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "freezes": {
    "label": "凍結",
    "tip": "エージェント、デプロイメント、キーパー、アプリへのブレーキと、自律運用の緊急停止スイッチ"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Freeze": "凍結"
  },
  "auditEventType": {
   "FreezeApplied": "凍結を適用",
   "FreezeLifted": "凍結を解除",
   "KillSwitchChanged": "緊急停止スイッチを変更",
   "BoardDirectionGiven": "取締役会の指示"
  },
  "notificationEvent": {
   "FreezeApplied": "凍結を適用",
   "MandateCapReached": "キーパーの支出上限に到達"
  },
  "freezeTargetKind": {
   "Agent": "エージェント",
   "Deployment": "デプロイメント",
   "Mandate": "キーパー",
   "App": "アプリ",
   "OrgUnit": "組織単位",
   "Organization": "組織",
   "TenantAutonomy": "緊急停止スイッチ"
  }
 },
 "errorCodes": {
  "Frozen": "凍結されています。凍結が解除されるまで新しい実行は拒否されます。",
  "AlreadyFrozen": "すでに凍結されています。先にその凍結を解除するか、そのままにしてください。",
  "FreezeLifted": "この凍結はすでに解除されています。",
  "KillSwitch": "自律運用の緊急停止スイッチがオンのため、キーパーの実行は拒否されます。",
  "MandateBudgetExceeded": "このキーパーはこのティックまたは今日の予算を使い切りました。",
  "OrganizationsUnavailable": "組織の凍結は組織機能とともに提供されます。代わりにエージェント、デプロイメント、キーパー、アプリを凍結してください。"
 },
 "freezes": {
  "killSwitchTarget": "自律運用の緊急停止スイッチ",
  "freezeTitle": "凍結しますか?",
  "freezeMessage": "{{target}} を凍結しますか? 凍結が解除されるまで新しい実行は拒否され、対象のキーパーは起動しなくなります。",
  "freezePickMessage": "凍結する対象を選んでください。凍結が解除されるまで新しい実行は拒否され、対象のキーパーは起動しなくなります。",
  "pickTarget": "選択...",
  "reasonPlaceholder": "理由は? 凍結を見た人がこの文章を読みます。",
  "liftTitle": "この凍結を解除しますか?",
  "liftMessage": "{{target}} の凍結を解除しますか? 新しい実行が再び受け付けられます。",
  "liftKeeperMessage": "{{target}} の凍結を解除しますか? キーパーは再び有効になり、次の起動は短い時間幅に分散されます。",
  "bannerOwn": "凍結中: 凍結が解除されるまで新しい実行は拒否されます。",
  "bannerTarget": "{{target}} は凍結中です。新しい実行は拒否されます。",
  "bannerKillSwitch": "自律運用の緊急停止スイッチがオンです。このテナントではキーパーのティックは開始されません。",
  "bannerBy": "{{who}} が {{when}} に凍結。",
  "bannerReason": "理由: {{reason}}",
  "openTarget": "開く",
  "status": {
   "active": "有効",
   "lifted": "解除済み"
  },
  "fields": {
   "targetKind": "凍結する対象の種類",
   "target": "対象",
   "reason": "理由 (任意)",
   "liftReason": "解除の理由 (任意)",
   "cancelActiveRuns": "すでに実行中の実行もキャンセルする"
  },
  "actions": {
   "freeze": "凍結",
   "freezeAny": "対象を選んで凍結",
   "lift": "凍結を解除",
   "openTarget": "凍結対象を開く"
  },
  "errors": {
   "reasonMax": "理由は {{max}} 文字以内です。",
   "target": "凍結する対象を選んでください。"
  },
  "toasts": {
   "frozen": "{{target}} を凍結しました。",
   "frozenCancelled_other": "{{target}} を凍結し、実行中の実行を {{count}} 件キャンセルしました。",
   "lifted": "{{target}} の凍結を解除しました。"
  },
  "killSwitch": {
   "title": "自律運用の緊急停止スイッチ",
   "on": "オン",
   "off": "オフ",
   "turnOn": "オンにする",
   "turnOff": "オフにする",
   "help": "緊急停止スイッチがオンの間、キーパーのティックは開始されず、キーパーの実行は拒否されます。人や API 資格情報による呼び出しは引き続き動作します。",
   "changedBy": "{{who}} が {{when}} にオンにしました。",
   "onTitle": "緊急停止スイッチをオンにしますか?",
   "onMessage": "スイッチをオフにするまで、このテナントのすべてのキーパーは起動せず、キーパーの実行は拒否されます。実行中のティックは最後まで進みます。",
   "offTitle": "緊急停止スイッチをオフにしますか?",
   "offMessage": "キーパーが再び起動するようになり、次の起動は短い時間幅に分散されます。",
   "toasts": {
    "on": "緊急停止スイッチがオンです。キーパーのティックは開始されません。",
    "off": "緊急停止スイッチがオフです。キーパーが再び起動します。"
   }
  }
 },
 "resources": {
  "freezes": {
   "title": "凍結",
   "subtitle": "誰かが解除するまで、エージェント、デプロイメント、キーパー、アプリの新しい実行を拒否するブレーキです。緊急停止スイッチもここに表示されます。",
   "add": "凍結を追加",
   "create": "凍結を作成",
   "edit": "凍結を編集",
   "view": "凍結の詳細",
   "deleteTitle": "凍結を削除",
   "emptyTitle": "凍結はありません",
   "emptyBody": "凍結されているものはありません。エージェント、デプロイメント、キーパー、アプリのページか、「対象を選んで凍結」から凍結できます。",
   "columns": {
    "createdUtc": "凍結日時",
    "status": "状態",
    "targetKind": "種類",
    "target": "対象",
    "reason": "理由",
    "createdBy": "凍結した人",
    "cancelledRunCount": "キャンセルした実行",
    "liftedUtc": "解除日時",
    "liftedBy": "解除した人",
    "liftReason": "解除の理由",
    "targetId": "対象 ID",
    "id": "ID"
   }
  }
 },
 "views": {
  "home": {
   "autonomy": {
    "freezes_other": "有効な凍結 {{count}} 件"
   }
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "freezes": "凍結: エージェント、デプロイメント、キーパー、アプリへのブレーキ。有効なものが先頭で、凍結と解除ができます。"
   }
  },
  "enums": {
   "resourceType": {
    "Freeze": "エージェント、デプロイメント、キーパー、アプリの新しい実行を止める凍結と、自律運用の緊急停止スイッチ。"
   },
   "auditEventType": {
    "FreezeApplied": "誰かがエージェント、デプロイメント、キーパー、アプリを凍結しました。",
    "FreezeLifted": "誰かが凍結を解除しました。",
    "KillSwitchChanged": "誰かが自律運用の緊急停止スイッチをオンまたはオフにしました。",
    "BoardDirectionGiven": "誰かが取締役会から CEO キーパーに指示を出しました。"
   },
   "notificationEvent": {
    "FreezeApplied": "誰かがエージェント、デプロイメント、キーパー、アプリを凍結したか、緊急停止スイッチをオンにしました。",
    "MandateCapReached": "キーパーが 1 日の支出上限に達し、次の UTC の日まで起動しません。"
   },
   "freezeTargetKind": {
    "Agent": "エージェントのすべてのデプロイメント: 新しい実行は拒否され、そのキーパーは起動しなくなります。",
    "Deployment": "1 つのデプロイメント: 新しい実行は拒否され、そこで動くキーパーは起動しなくなります。",
    "Mandate": "1 つのキーパー: 凍結が解除されるまで起動しません。",
    "App": "1 つのアプリ: そのチャットでの新しい会話とメッセージは拒否されます。",
    "OrgUnit": "組織単位。組織機能が提供されるまで使えません。",
    "Organization": "組織全体。組織機能が提供されるまで使えません。",
    "TenantAutonomy": "緊急停止スイッチ: テナント全体でキーパーのティックが開始されません。"
   }
  },
  "freezes": {
   "denied": "この操作は許可されていません。凍結に対する {{operation}} が必要です。",
   "openTarget": "この凍結が止めている対象のページを開きます。",
   "status": {
    "active": "有効: 範囲内の新しい実行は拒否されます。",
    "lifted": "解除済み: 実行は再び受け付けられます。"
   },
   "actions": {
    "freeze": "凍結します。解除されるまで新しい実行は拒否され、対象のキーパーは起動しなくなります。先に確認があります。",
    "freezeAny": "エージェント、デプロイメント、キーパー、アプリを選んで凍結します。先に確認があります。",
    "lift": "凍結を解除し、新しい実行を再び受け付けます。先に確認があります。"
   },
   "fields": {
    "targetKind": "エージェント (すべてのデプロイメント)、1 つのデプロイメント、1 つのキーパー、1 つのアプリを凍結します。",
    "target": "凍結するレコード。",
    "reason": "任意。凍結のバナーと監査ログに表示されます。",
    "liftReason": "任意。凍結と監査ログに記録されます。",
    "cancelActiveRuns": "範囲内ですでにキュー待ちまたは実行中の実行もキャンセルします。選ばない場合は最後まで実行されます。"
   },
   "filters": {
    "active": "有効な凍結だけ、または解除済みの凍結だけを表示します。両方を表示するには「すべて」を選びます。",
    "targetKind": "この種類の凍結だけを表示します。フィルターを外すには「すべて」を選びます。"
   },
   "killSwitch": {
    "title": "このテナントのすべてのキーパーを止めるスイッチ。通常の呼び出しは引き続き動作します。",
    "on": "オン: キーパーのティックは開始されず、キーパーの実行は拒否されます。",
    "off": "オフ: キーパーはスケジュールどおりに起動します。",
    "turnOn": "このテナントのすべてのキーパーを止めます。先に確認があります。",
    "turnOff": "キーパーが再び起動できるようにします。先に確認があります。"
   }
  },
  "resources": {
   "freezes": {
    "createdUtc": "凍結した日時。正確な時刻はポインターを重ねると表示されます。",
    "status": "凍結が有効な間は「有効」、その後は「解除済み」。",
    "targetKind": "凍結されたレコードの種類。",
    "target": "凍結されたエージェント、デプロイメント、キーパー、アプリ。",
    "reason": "凍結の理由。全文はポインターを重ねると表示されます。",
    "createdBy": "凍結した人。",
    "cancelledRunCount": "求められた場合に、凍結がキャンセルした実行中の実行の数。",
    "liftedUtc": "凍結を解除した日時。",
    "liftedBy": "解除した人。",
    "liftReason": "解除の理由。",
    "targetId": "凍結されたレコードの ID。",
    "id": "凍結の ID (mfz_...)。API と MCP ツールで使います。"
   }
  },
  "views": {
   "home": {
    "autonomy": {
     "freezes": "有効な凍結の一覧を開きます。"
    }
   }
  },
  "filters": {
   "active": "有効なレコードだけ、または無効なレコードだけを表示します。両方を表示するには「すべて」を選びます。"
  }
 },
 "explainers": {
  "freezes": {
   "title": "凍結",
   "p1": "凍結はブレーキです。有効な間、Garrison は凍結されたエージェント、デプロイメント、キーパー、アプリの新しい実行を 409 Frozen で拒否し、対象のキーパーは起動しなくなります。すでに実行中の実行は、凍結でキャンセルしない限り最後まで進みます。",
   "p2": "エージェント、デプロイメント、キーパー、アプリのページか、ここの「対象を選んで凍結」から凍結します。凍結を解除すると実行は再び受け付けられ、凍結されていたキーパーは有効に戻り、次の起動は短い時間幅に分散されます。",
   "p3": "設定とホームにある自律運用の緊急停止スイッチは、テナントのすべてのキーパーのティックを一度に止めます。ここでは種類が「緊急停止スイッチ」の凍結として表示されます。"
  }
 }
});

// Scoped memory (AA4.13): the Memory page, its scope list, content viewer, and delete dialog, the scope kind enum,
// the Memory resource type, and the memory error codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "memory": {
    "label": "メモリ",
    "tip": "エージェントや人が保存した内容をスコープ別に、各エントリの書き込み者と日時とともに表示"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Memory": "メモリ"
  },
  "memoryScopeKind": {
   "Agent": "エージェント",
   "App": "アプリ",
   "OrgUnit": "組織単位",
   "Organization": "組織"
  }
 },
 "errorCodes": {
  "MemoryVersionConflict": "このメモリエントリは読み込んだ後に変更されました。再読み込みしてから改めて判断してください。",
  "MemoryDisabled": "このサーバーではエージェントメモリがオフのため、エントリのテキストの読み取りもエントリの削除もできません。"
 },
 "memory": {
  "legacy": "旧形式",
  "deletedScope": "{{id}} (削除済み)",
  "neverRead": "なし",
  "noExpiry": "なし",
  "deleteTitle": "このメモリエントリを削除しますか?",
  "deleteMessage": "{{scope}} から {{key}} を削除しますか? これを探すエージェントは何も見つけられなくなり、テキストも削除されます。元に戻せません。",
  "deleteVersion": "読み込んだバージョン {{version}} を削除します。その後に誰かが新しいバージョンを書き込んでいれば、削除は拒否されます。",
  "deleteReloaded": "再読み込みしました。エントリは現在バージョン {{version}} です。削除するとこのバージョンが消えます。",
  "scopes": {
   "label": "メモリのスコープ",
   "all": "すべてのスコープ",
   "totals_other": "{{entries}} 件、{{bytes}}",
   "loadFailed": "メモリのスコープを読み込めませんでした。",
   "empty": {
    "Agent": "まだメモリを保存したエージェントはありません。",
    "App": "まだ共有メモリを持つアプリはありません。",
    "OrgUnit": "まだメモリを持つ組織単位はありません。",
    "Organization": "まだメモリを持つ組織はありません。"
   }
  },
  "filters": {
   "search": "検索",
   "searchPlaceholder": "キー、カテゴリ、タグ",
   "categoryPlaceholder": "カテゴリ",
   "tag": "タグ",
   "tagPlaceholder": "タグ",
   "writer": "書き込み者"
  },
  "actions": {
   "viewContent": "内容を表示",
   "copyId": "ID をコピー",
   "openRun": "書き込んだ実行を開く",
   "reload": "エントリを再読み込み"
  },
  "viewer": {
   "title": "メモリエントリ",
   "content": "保存された内容",
   "untrusted": "これはエージェントまたは人が保存したデータです。保存されたとおりのプレーンテキストで表示され、中身が実行、描画、または指示として扱われることはありません。",
   "loading": "保存されたテキストを読み込んでいます...",
   "empty": "このエントリにはテキストがありません。"
  },
  "errors": {
   "conflict": "バージョン {{version}} を読み込んだ後に誰かがこのエントリを変更したため、削除されませんでした。再読み込みして現在の内容を確認してください。",
   "gone": "このエントリはもう存在しません。他の人が削除した可能性があります。"
  },
  "toasts": {
   "deleted": "{{key}} を削除しました。",
   "copied": "エントリの ID をコピーしました。"
  }
 },
 "resources": {
  "memory": {
   "title": "メモリ",
   "subtitle": "エージェントや人が保存した内容をスコープ別に表示します。各エントリを誰がいつ、どの実行から書き込んだか、サイズはどれくらいかがわかります。エントリを開いて読み、覚えておくべきでないものは削除します。",
   "add": "メモリエントリを追加",
   "create": "メモリエントリを作成",
   "edit": "メモリエントリを編集",
   "view": "メモリエントリ",
   "deleteTitle": "メモリエントリを削除",
   "emptyTitle": "メモリはまだありません",
   "emptyBody": "エージェントは実行中に garrison_memory ツールでメモリを保存します。エントリが書き込まれると、ここにスコープ別に表示されます。",
   "columns": {
    "key": "キー",
    "scope": "スコープ",
    "category": "カテゴリ",
    "tags": "タグ",
    "writer": "書き込み者",
    "lastUpdateUtc": "最終書き込み",
    "lastReadUtc": "最終読み取り",
    "version": "バージョン",
    "bytes": "サイズ",
    "expiresUtc": "有効期限",
    "writerRunId": "書き込んだ実行",
    "createdUtc": "作成",
    "sha256": "SHA-256 ハッシュ",
    "id": "ID"
   }
  }
 }
});

// Reports (AA5.10): the Reports page, the report page and its metric chart, the File report dialog, the report
// enums, the Report resource type, and the ReportUnhealthy notification event.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "reports": {
    "label": "レポート",
    "tip": "エージェントや人が提出した状況報告、インシデント、決定、引き継ぎを、健全性とメトリクス付きで表示します"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Report": "レポート"
  },
  "notificationEvent": {
   "ReportUnhealthy": "異常のレポートが提出された"
  },
  "reportKind": {
   "Status": "状況",
   "Incident": "インシデント",
   "Decision": "決定",
   "Handoff": "引き継ぎ",
   "Brief": "概要"
  },
  "reportHealth": {
   "Healthy": "正常",
   "Degraded": "低下",
   "Unhealthy": "異常",
   "Unknown": "不明"
  },
  "reportAudience": {
   "Manager": "上長",
   "Chain": "上位の管理者すべて",
   "Board": "取締役会"
  },
  "reportIssueSeverity": {
   "Low": "低",
   "Medium": "中",
   "High": "高"
  }
 },
 "reports": {
  "untrusted": "このレポートはエージェントまたは人が書いたものです。タイトル、本文、メトリクス、問題、決定は、提出されたとおりのプレーンテキストで表示されます。中身が実行、描画、または指示として扱われることはありません。",
  "period": "{{from}} から {{to}}",
  "periodFrom": "{{from}} から",
  "periodTo": "{{to}} まで",
  "filters": {
   "author": "作成者",
   "app": "アプリ",
   "from": "提出日時 (以降)",
   "to": "提出日時 (以前)"
  },
  "actions": {
   "file": "レポートを提出",
   "copyId": "ID をコピー",
   "openRun": "実行を開く",
   "openKeeper": "キーパーを開く",
   "openAuthor": "作成者を開く"
  },
  "toasts": {
   "filed": "{{title}} を提出しました。",
   "copied": "レポート ID をコピーしました。"
  },
  "file": {
   "title": "レポートを提出",
   "intro": "現在の状況を書き残します。レポートを読めるすべての人がここで確認でき、健全性が異常のレポートはそのイベントを購読しているエンドポイントに通知されます。提出したレポートは変更できません。",
   "noAgent": "エージェントなし (自分の名前で提出)",
   "fields": {
    "title": "タイトル",
    "kind": "種類",
    "health": "健全性",
    "audience": "宛先",
    "agent": "代理で提出するエージェント",
    "body": "本文"
   },
   "errors": {
    "title": "タイトルは 1 から {{max}} 文字で入力してください。",
    "body": "本文は最大 {{max}} バイトです。"
   }
  },
  "chart": {
   "metric": "メトリクス",
   "title": "{{metric}} の推移",
   "help_other": "{{agent}} が報告した {{count}} 件の値です (古い順)。",
   "noMetrics": "このレポートにはメトリクスがないため、グラフにするものがありません。",
   "noAuthor": "このレポートを書いたエージェントがいないため、作成者の履歴をグラフにできません。",
   "empty": "このメトリクスの値はまだありません。",
   "failed": "メトリクスの履歴を読み込めませんでした。"
  }
 },
 "views": {
  "reportDetail": {
   "title": "レポート",
   "notFoundTitle": "レポートが見つかりません",
   "notFoundBody": "このテナントに存在しないか、テナントと一緒に削除されました。",
   "back": "レポート一覧に戻る",
   "body": "本文",
   "metrics": "メトリクス",
   "chart": "メトリクスの履歴",
   "issues": "問題",
   "decisions": "決定",
   "noBody": "このレポートには本文がありません。",
   "noMetrics": "このレポートにはメトリクスがありません。",
   "noIssues": "報告された問題はありません。",
   "noDecisions": "記録された決定はありません。",
   "columns": {
    "name": "名前",
    "value": "値",
    "unit": "単位"
   },
   "fields": {
    "health": "健全性",
    "kind": "種類",
    "audience": "宛先",
    "author": "作成者",
    "period": "対象期間",
    "createdUtc": "提出日時",
    "filedBy": "提出者",
    "runId": "実行",
    "mandateId": "キーパー",
    "mandateTickId": "キーパーのティック",
    "app": "アプリ",
    "orgUnitId": "組織単位"
   }
  }
 },
 "resources": {
  "reports": {
   "title": "レポート",
   "subtitle": "エージェントや人が上に報告した内容です。状況、インシデント、決定、引き継ぎを、健全性とメトリクス付きで表示します。開くと本文を読み、メトリクスの推移をグラフで確認できます。",
   "add": "レポートを提出",
   "create": "レポートを提出",
   "edit": "レポート",
   "view": "レポートの詳細",
   "deleteTitle": "レポートを削除",
   "emptyTitle": "レポートはまだありません",
   "emptyBody": "エージェントは実行中に garrison_file_report ツールでレポートを提出し、人はここまたは API から提出します。提出されるとここに表示されます。",
   "columns": {
    "createdUtc": "提出日時",
    "title": "タイトル",
    "author": "作成者",
    "kind": "種類",
    "health": "健全性",
    "app": "アプリ",
    "period": "対象期間",
    "issues": "問題",
    "audience": "宛先",
    "filedBy": "提出者",
    "runId": "実行",
    "id": "ID"
   }
  }
 }
});

// Messages (AA6.12): the Messages page, the thread page, the agent inbox tab, the Send message dialog, the
// Home card line, the message enums, the AgentMessage resource type, and the Message run kind.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "messages": {
    "label": "メッセージ",
    "tip": "エージェント間や人からのメール。ループガードが拒否したメッセージとその理由も表示します"
   },
   "messageThreads": {
    "label": "メッセージスレッド",
    "tip": "1 つのスレッドのすべてのメッセージ (古い順)"
   }
  }
 },
 "enums": {
  "resourceType": {
   "AgentMessage": "エージェントメッセージ"
  },
  "runKind": {
   "Message": "緊急メッセージ"
  },
  "messageStatus": {
   "Queued": "待機中",
   "Delivered": "配信済み",
   "Acknowledged": "確認済み",
   "Expired": "期限切れ",
   "Rejected": "拒否"
  },
  "messageUrgency": {
   "Normal": "通常",
   "Urgent": "緊急"
  },
  "messageRejection": {
   "HopLimit": "ホップ上限",
   "LineRate": "ライン送信レート",
   "ThreadBudget": "スレッド上限",
   "NoLine": "ラインなし",
   "Frozen": "受信者が凍結中"
  }
 },
 "messages": {
  "untrusted": "これらのメッセージはエージェントや人が書いたものです。件名、本文、拒否の詳細は送信されたとおりプレーンテキストで表示され、実行、描画、指示として従うことは一切ありません。",
  "views": {
   "label": "表示するメッセージ",
   "all": "すべてのメッセージ",
   "rejected": "拒否",
   "rejectedNote": "送信時にループガードが拒否したメッセージと、その理由です。拒否されたメッセージは一度も配信されていません。"
  },
  "filters": {
   "reason": "理由",
   "sender": "送信者",
   "recipient": "受信者",
   "from": "この日時以降に送信",
   "to": "この日時以前に送信"
  },
  "actions": {
   "send": "メッセージを送信",
   "openThread": "スレッドを開く",
   "copyId": "ID をコピー",
   "openSender": "送信者を開く",
   "openRecipient": "受信者を開く",
   "openDeliveredRun": "受信した実行を開く",
   "openEscalation": "エスカレーションを開く"
  },
  "toasts": {
   "sent": "{{recipient}} に送信しました。",
   "copied": "メッセージ ID をコピーしました。"
  },
  "send": {
   "title": "メッセージを送信",
   "intro": "エージェントにメッセージを書きます。メッセージは実行が読むまで受信箱で待機します。緊急のメッセージはすぐにエージェントを起こします。",
   "replyIntro": "このスレッドで返信します。返信はメッセージを送ったエージェントに届きます。",
   "pickRecipient": "エージェントを選択",
   "ttlPlaceholder": "サーバーの既定値",
   "sending": "送信中...",
   "rejected": "ループガードがこのメッセージを拒否しました。",
   "rejectedStored": "拒否されたメッセージは拒否の一覧に残ります。",
   "fields": {
    "recipient": "宛先",
    "subject": "件名",
    "body": "本文",
    "urgency": "緊急度",
    "ttlSeconds": "有効期限 (秒)"
   },
   "errors": {
    "recipient": "メッセージを送るエージェントを選択してください。",
    "subject": "件名は 1 から {{max}} 文字で入力してください。",
    "body": "本文は最大 {{max}} バイトです。",
    "ttlSeconds": "{{min}} から {{max}} までの整数の秒数を入力するか、空欄のままにしてください。"
   }
  }
 },
 "views": {
  "messageThread": {
   "title": "メッセージスレッド",
   "notFoundTitle": "スレッドが見つかりません",
   "notFoundBody": "このテナントに存在しないか、テナントとともに削除されました。",
   "back": "メッセージに戻る",
   "count_other": "{{count}} 件のメッセージ",
   "rejectedCount_other": "{{count}} 件拒否",
   "emptyTitle": "このスレッドにメッセージはありません",
   "emptyBody": "スレッドは存在しますが、読むことのできるメッセージがありません。",
   "listLabel": "このスレッドのメッセージ (古い順)",
   "noBody": "このメッセージには本文がありません。",
   "noDetail": "詳細はありません。",
   "woke": "受信者を起こしました",
   "artifacts": "添付された成果物",
   "reply": "返信",
   "replyPrefix": "返信: ",
   "fields": {
    "sender": "送信者",
    "recipient": "宛先",
    "createdUtc": "送信日時",
    "hopCount": "ホップ数",
    "deliveredRunId": "配信先の実行",
    "deliveredUtc": "配信日時",
    "acknowledgedUtc": "確認日時",
    "expiresUtc": "有効期限",
    "wokeRecipient": "起動",
    "escalationId": "エスカレーション",
    "id": "メッセージ ID"
   }
  },
  "agentDetail": {
   "inbox": {
    "tab": "受信箱",
    "status": "ステータス",
    "openAll": "メッセージで開く",
    "none": "このエージェント宛てのメッセージはまだありません。",
    "noneWithStatus": "このステータスのメッセージはこのエージェント宛てにありません。",
    "more": "{{total}} 件中、新しい {{shown}} 件を表示しています。すべて見るにはメッセージを開いてください。"
   }
  },
  "home": {
   "autonomy": {
    "rejected_other": "過去 24 時間にループガードが拒否したメッセージ: {{count}} 件",
    "noneRejected": "過去 24 時間にループガードが拒否したメッセージはありません"
   }
  }
 },
 "resources": {
  "messages": {
   "title": "メッセージ",
   "subtitle": "エージェント間や人からのメール (新しい順) と、ループガードが拒否したメッセージ。開くとスレッド全体を読めます。",
   "add": "メッセージを送信",
   "create": "メッセージを送信",
   "edit": "メッセージ",
   "view": "メッセージの詳細",
   "deleteTitle": "メッセージを削除",
   "emptyTitle": "メッセージはまだありません",
   "emptyBody": "エージェントは実行中に garrison_send_message ツールでメッセージを送り、人はここか API から送ります。送信されるとここに表示されます。",
   "columns": {
    "createdUtc": "送信日時",
    "urgency": "緊急度",
    "status": "ステータス",
    "subject": "件名",
    "sender": "送信者",
    "recipient": "宛先",
    "reason": "拒否",
    "hopCount": "ホップ数",
    "deliveredRunId": "配信先の実行",
    "expiresUtc": "有効期限",
    "escalationId": "エスカレーション",
    "threadId": "スレッド",
    "id": "ID"
   }
  }
 }
});

// Organizations (AA7.14): the Organizations page, the organization page with its chart, unit editor, budgets, and
// revisions, the organization enums, the Organization resource type, and the organization error codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "organizations": {
    "label": "組織",
    "tip": "責任者、メンバー、ピアライン、予算を持つ組織単位のツリー。リビジョンとして公開します"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Organization": "組織"
  },
  "organizationStatus": {
   "Draft": "下書き",
   "Active": "稼働中",
   "Frozen": "凍結中",
   "Retired": "廃止"
  },
  "budgetPeriod": {
   "Day": "日",
   "Month": "月"
  },
  "orgRevisionState": {
   "Draft": "下書き",
   "Published": "公開済み",
   "Superseded": "置き換え済み"
  }
 },
 "organizations": {
  "notPublished": "未公開",
  "actions": {
   "open": "組織を開く",
   "copyId": "ID をコピー"
  },
  "toasts": {
   "copied": "組織 ID をコピーしました。",
   "unitAdded": "組織単位 {{name}} を作業ツリーに追加しました。",
   "unitSaved": "組織単位 {{name}} を保存しました。",
   "unitRemoved": "組織単位 {{name}} を作業ツリーから削除しました。",
   "published": "リビジョン {{number}} が公開中になりました。",
   "drafted": "リビジョン {{number}} を下書きとして保存しました。",
   "rolledBack": "リビジョン {{number}} にロールバックしました。リビジョン {{live}} が公開中です。",
   "retired": "{{name}} を廃止しました。",
   "reactivated": "{{name}} を復帰させました。"
  },
  "errors": {
   "OneRoot": "組織のルート単位は 1 つだけです。親を持たない組織単位がルートになります。",
   "ParentNotFound": "親の組織単位がこの組織に含まれていません。",
   "Cycle": "組織単位を自分自身や自分の配下の組織単位の下に置くことはできません。",
   "UnitNameTaken": "この組織には同じ名前の組織単位がすでにあります。",
   "LeadsTwoUnits": "このエージェントはすでに別の組織単位の責任者です。エージェントが率いる組織単位は、1 つの組織につき 1 つまでです。",
   "PositionTaken": "このエージェントはすでにこの組織でポジションを持っています。エージェントは 1 つの組織単位の責任者かメンバーのどちらかにしかなれません。",
   "PeerNotFound": "ピアラインの接続先が、この組織に含まれない組織単位になっています。",
   "BudgetPeriodTaken": "組織単位の予算は期間ごとに 1 つです。",
   "BudgetInvalid": "予算には米ドルで正の金額を指定してください。",
   "BudgetExceedsParent": "組織単位の予算は、上位の組織単位の予算を超えられません。",
   "TooManyUnits": "この組織の組織単位数は、サーバーが許可する上限に達しています。",
   "TooManyMembers": "この組織単位のメンバー数は、サーバーが許可する上限に達しています。",
   "TooManyPeerLines": "この組織単位のピアライン数は、サーバーが許可する上限に達しています。",
   "UnitHasChildren": "先に配下の組織単位を削除するか移動してください。",
   "OrganizationRetired": "この組織は廃止されています。変更する前に復帰させてください。",
   "AgentInactive": "エージェントが存在しないか、有効ではありません。",
   "MandateMismatch": "そのキーパーは別のエージェントのものです。このポジションのエージェントのキーパーを選んでください。",
   "RevisionMismatch": "そのリビジョンは別の組織のものです。",
   "RevisionPublished": "そのリビジョンはすでに公開されています。",
   "RevisionNeverPublished": "ロールバック先にできるのは、一度でも公開中になったリビジョンだけです。",
   "AlreadyLive": "そのリビジョンはすでに公開中です。",
   "NothingToRollBack": "戻れる以前の公開リビジョンがありません。",
   "StatusNotSettable": "組織に対して行えるのは、廃止と廃止からの復帰だけです。それ以外のステータスは公開と凍結によって決まります。",
   "NameConflict": "この名前はすでに別の組織が使っています。"
  },
  "spend": {
   "noBudget": "{{period}}: {{spent}} を支出、予算なし",
   "of": "{{period}}: {{amount}} のうち {{spent}} ({{percent}})",
   "exhausted": "予算を使い切りました"
  },
  "chart": {
   "lead": "責任者",
   "noLead": "責任者なし",
   "members": "メンバー ({{count}})",
   "peers": "ピアライン",
   "app": "アプリ",
   "collapse": "{{name}} の配下の組織単位を折りたたむ",
   "expand": "{{name}} の配下の組織単位を展開する",
   "addChild": "配下に組織単位を追加"
  },
  "unit": {
   "addTitle": "組織単位を追加",
   "editTitle": "組織単位 {{name}} を編集",
   "add": "組織単位を追加",
   "saving": "保存中...",
   "intro": "変更は作業ツリーに入ります。リビジョンを公開するまで何も反映されません。名前は最大 {{max}} 文字です。",
   "namePlaceholder": "請求",
   "titlePlaceholder": "請求部門の責任者",
   "noParent": "なし (ルート単位)",
   "noLead": "責任者はまだいません",
   "noMandate": "キーパーなし",
   "noApp": "アプリなし",
   "noPeers": "ピアラインを引くには、先に別の組織単位を追加してください。",
   "noBudget": "予算なし",
   "addMember": "メンバーを追加",
   "sections": {
    "lead": "責任者",
    "members": "メンバーとピアライン",
    "budgets": "予算"
   },
   "fields": {
    "name": "名前",
    "parentUnitId": "報告先",
    "description": "説明",
    "leadAgentId": "責任者のエージェント",
    "leadTitle": "責任者の役職",
    "leadMandateId": "責任者のキーパー",
    "appId": "アプリ",
    "members": "メンバー",
    "memberAgent": "エージェント",
    "memberTitle": "役職",
    "memberMandate": "キーパー",
    "peerUnitIds": "ピアライン",
    "budgetDay": "1 日の予算 (USD)",
    "budgetMonth": "1 か月の予算 (USD)"
   },
   "errors": {
    "name": "組織単位の名前を 1 から {{max}} 文字で入力してください。",
    "description": "説明は最大 {{max}} 文字です。",
    "title": "役職は最大 {{max}} 文字です。",
    "memberAgent": "すべてのメンバーにエージェントを選ぶか、空の行を削除してください。",
    "duplicateAgent": "1 つのエージェントがこの組織単位で持てるポジションは 1 つだけです。",
    "budget": "0 より大きい金額を入力してください。予算なしにする場合は空のままにします。"
   }
  },
  "form": {
   "errors": {
    "name": "組織の名前を 1 から {{max}} 文字で入力してください。",
    "text": "この項目は最大 {{max}} 文字です。"
   }
  },
  "diff": {
   "none": "違いはありません。2 つのツリーは同じです。",
   "empty": "(なし)",
   "between": "{{before}} から {{after}} への変更です。",
   "added": "追加された組織単位 ({{count}})",
   "removed": "削除された組織単位 ({{count}})",
   "changed": "変更された組織単位 ({{count}})",
   "field": "項目",
   "fields": {
    "name": "名前",
    "description": "説明",
    "parent": "報告先",
    "lead": "責任者",
    "leadTitle": "責任者の役職",
    "leadMandate": "責任者のキーパー",
    "app": "アプリ",
    "members": "メンバー",
    "peers": "ピアライン",
    "budgets": "予算"
   },
   "title": "リビジョン {{number}} と公開中の組織の比較",
   "pendingTitle": "未公開の変更",
   "nothingLive": "まだ公開中のものはありません",
   "working": "作業ツリー"
  },
  "revisions": {
   "label": "リビジョン {{number}}",
   "rollbackOf": "(リビジョン {{number}} のコピー)"
  },
  "rollback": {
   "note": "ダッシュボードからリビジョン {{number}} にロールバックしました。"
  }
 },
 "views": {
  "organizationDetail": {
   "title": "組織",
   "heading": "組織 {{name}}",
   "notFoundTitle": "組織が見つかりません",
   "notFoundBody": "このテナントに存在しないか、削除されました。",
   "live": "ライブ更新",
   "editDetails": "詳細を編集",
   "reactivate": "復帰させる",
   "retire": "廃止",
   "publish": "変更を公開",
   "retiredBanner": "この組織は廃止されています。指揮系統、ライン、予算は適用されず、復帰させるまで何も変更できません。",
   "pending": "作業ツリーに未公開の変更があります。追加 {{added}}、変更 {{changed}}、削除 {{removed}}。",
   "neverPublished": "まだ何も公開されていません。リビジョンを公開すると、この組織が動き始めます。",
   "reviewPending": "変更を確認",
   "units": "組織単位",
   "lastUpdate": "最終変更",
   "tabs": {
    "chart": "組織図",
    "budgets": "予算と支出",
    "revisions": "リビジョン ({{count}})"
   },
   "chartView": "表示するツリー",
   "viewWorking": "作業ツリー",
   "viewLive": "公開中",
   "addUnit": "組織単位を追加",
   "addRoot": "ルート単位を追加",
   "workingNote": "作業ツリーは編集用です。リビジョンを公開すると反映されます。",
   "liveNote": "公開中のリビジョンです。指揮系統、ライン、予算はこのツリーに従います。",
   "noUnitsTitle": "組織単位はまだありません",
   "noUnitsBody": "最上位のエージェントが率いるルート単位を追加し、その配下に組織単位を追加してください。",
   "budgetsNote": "各予算は、その組織単位と配下のすべての組織単位が UTC の 1 日または 1 か月に使える金額の上限です。支出には、公開中のリビジョンのもとで完了した実行の既知のコストが計上されます。",
   "noBudgetsTitle": "予算はありません",
   "noBudgetsBody": "組織単位を編集して、1 日または 1 か月の予算を設定してください。",
   "noSpend": "支出の記録はありません",
   "columns": {
    "unit": "組織単位",
    "day": "日",
    "month": "月",
    "spend": "支出",
    "number": "リビジョン",
    "state": "状態",
    "note": "メモ",
    "author": "作成者",
    "created": "作成日時",
    "published": "公開日時"
   },
   "noRevisionsTitle": "リビジョンはまだありません",
   "noRevisionsBody": "変更を公開すると、作業ツリーのスナップショットがリビジョンとして保存されます。",
   "current": "公開中",
   "compare": "公開中と比較",
   "publishRevision": "公開",
   "rollback": "ロールバック",
   "publishTitle": "変更を公開",
   "publishIntro": "公開すると、作業ツリーのスナップショットを新しいリビジョンとして保存して公開中にし、ツリー内のキーパーはそれぞれの現在のリビジョンで固定されます。下書きとして保存すると、スナップショットは保存されますが公開されません。",
   "saveDraft": "下書きとして保存",
   "publishNow": "公開",
   "note": "メモ",
   "diffNote": "メモ: {{note}}",
   "removeUnitTitle": "組織単位を削除",
   "confirmRemoveUnit": "組織単位 {{name}} を作業ツリーから削除しますか? この組織単位を指すピアラインも削除されます。公開するまで、公開中の組織は変わりません。",
   "rollbackTitle": "ロールバック",
   "confirmRollback": "リビジョン {{live}} に代えて、リビジョン {{number}} を再び公開中にしますか? 作業ツリーとツリー内のキーパーはそのリビジョンの状態に戻り、ロールバックは新しいリビジョンとして記録されます。",
   "retireTitle": "組織を廃止",
   "confirmRetire": "{{name}} を廃止しますか? 指揮系統、ライン、予算は適用されなくなり、復帰させるまで変更できません。",
   "confirmDelete": "{{name}} を、{{units}} 個の組織単位と {{revisions}} 件のリビジョンとともに削除しますか? 組織単位と組織に保存されたメモリも削除されます。この操作は元に戻せません。"
  }
 },
 "resources": {
  "organizations": {
   "title": "組織",
   "subtitle": "組織単位のツリー。各組織単位はエージェントが率い、メンバー、ピアライン、予算を持ちます。開くと組織図を編集して公開できます。",
   "add": "組織を作成",
   "create": "組織を作成",
   "edit": "組織を編集",
   "view": "組織の詳細",
   "deleteTitle": "組織を削除",
   "emptyTitle": "組織はまだありません",
   "emptyBody": "組織を作成し、最上位のエージェントが率いるルート単位とその配下の組織単位を追加して、公開してください。",
   "columns": {
    "name": "名前",
    "status": "ステータス",
    "currentRevisionNumber": "公開中のリビジョン",
    "description": "説明",
    "createdUtc": "作成日時",
    "mission": "ミッション",
    "id": "ID"
   },
   "fields": {
    "name": "名前",
    "description": "説明",
    "mission": "ミッション"
   },
   "hints": {
    "name": "1 から {{max}} 文字。テナント内で一意です。",
    "description": "任意。最大 {{max}} 文字です。",
    "mission": "組織の目的を平易な言葉で記述します。任意。最大 {{max}} 文字です。"
   }
  }
 }
});

// Organizations on the studio canvas (AA7.10): the Apps and Organizations switch, the organization canvas, its
// toolbar, panels, outline, and keyboard help, the unit operations, and their field codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "common": {
  "fieldCodes": {
   "OneRoot": "この組織にはすでにルート単位があります。この組織単位の親を選んでください。",
   "UnitNameTaken": "この組織にはすでに同じ名前の組織単位があります。",
   "UnitNotFound": "この組織にはこの名前の組織単位がありません。",
   "UnitHasChildren": "先にこの組織単位の下にある組織単位を削除してください。",
   "NoSuchPeerLine": "この 2 つの組織単位の間にピアラインはありません。",
   "OrganizationDeleted": "この下書きはこの組織を削除します。先に元に戻してください。",
   "PeerNotFound": "組織単位は自分自身とのピアラインを持てません。"
  }
 },
 "components": {
  "studio": {
   "canvas": {
    "view": {
     "label": "キャンバスの表示内容",
     "apps": "アプリ",
     "organizations": "組織"
    },
    "operations": {
     "AddUnit": "組織単位の追加",
     "RemoveUnit": "組織単位の削除",
     "AddUnitMember": "メンバーの追加",
     "RemoveUnitMember": "メンバーの削除",
     "ConnectUnits": "ピアラインの追加",
     "DisconnectUnits": "ピアラインの削除"
    },
    "org": {
     "none": "下書きにはまだ組織がありません。上で組織名と組織単位名を入力して作成してください。最初の組織単位がルートになります。",
     "flowLabel": "組織 {{organization}}",
     "picker": "組織",
     "units": "組織単位",
     "root": "ルート単位",
     "peers": "ピアライン",
     "orgTitle": "組織 {{name}}",
     "orgHint": "組織単位を選択すると、メンバーとピアラインを編集できます。組織単位は報告先の組織単位の中に配置されます。",
     "deleted": "この下書きはこの組織を削除します。元に戻すまで組織単位は変更できません。",
     "unitTitle": "組織単位 {{name}}",
     "reportsTo": "報告先",
     "lead": "責任者",
     "members": "メンバー ({{count}})",
     "noMembers": "責任者以外のメンバーはいません。",
     "memberAgent": "エージェント",
     "memberTitle": "役職（任意）",
     "addMember": "メンバーを追加",
     "removeMember": "削除",
     "noPeers": "ピアラインはありません。",
     "disconnect": "切断",
     "addChild": "下に組織単位を追加",
     "startPeer": "ピアラインを開始",
     "removeUnit": "組織単位を削除",
     "peerTitle": "ピアライン {{from}} と {{to}}",
     "peerHint": "{{from}} と {{to}} は、共通の上司を経由せずに直接メッセージをやり取りできます。",
     "peerList": "ピアライン（{{total}}）",
     "noPeerLines": "まだピアラインはありません。組織単位を選択して開始するか、組織単位の右端のハンドルから別の組織単位へドラッグしてください。",
     "removeTitle": "組織単位を削除",
     "removeMessage": "この下書きで、組織単位 {{name}} を組織 {{organization}} から削除しますか？この組織単位を含むピアラインも削除されます。下に組織単位がある組織単位は削除できません。",
     "toolbar": {
      "label": "組織の操作",
      "addUnit": "組織単位を追加",
      "unitPlaceholder": "組織単位名",
      "parent": "報告先",
      "noParent": "親なし（ルート）",
      "under": "{{name}} の下",
      "lead": "責任者エージェント",
      "leadPlaceholder": "責任者エージェント（任意）",
      "leadTitle": "責任者の役職（任意）",
      "organization": "組織",
      "add": "追加"
     },
     "connectBar": {
      "message": "{{name}} からピアラインを引いています。"
     },
     "keys": {
      "tab": "Tab で組織単位間を移動します。各組織単位はその下の組織単位より先に移動します。",
      "select": "Enter または Space でフォーカス中の組織単位を選択し、プロパティを開きます。",
      "peer": "組織単位で C を押すとそこからピアラインを始め、別の組織単位で C または Enter を押すと完了します。",
      "remove": "Delete で確認の後、フォーカス中の組織単位を削除します。",
      "add": "N で「組織単位を追加」の入力欄に移動します。",
      "peers": "ピアラインの一覧では、Enter でラインを選択、Delete で削除します。",
      "escape": "Escape で始めたピアラインを取り消します。"
     },
     "node": {
      "root": "ルート",
      "reportsTo": "報告先 {{name}}",
      "lead": "責任者：{{name}}",
      "noLead": "責任者なし",
      "members": "メンバー {{list}}"
     },
     "summary": {
      "none": "説明する組織がありません。",
      "units_one": "組織 {{organization}} には {{count}} 個の組織単位があります。",
      "units_other": "組織 {{organization}} には {{count}} 個の組織単位があります。",
      "root": "ルート単位は {{name}} です。",
      "peerCount_one": "ピアラインは {{count}} 本です。",
      "peerCount_other": "ピアラインは {{count}} 本です。",
      "unitRoot": "{{name}} はルート単位で、{{lead}}。",
      "unitChild": "{{name}} は {{parent}} に報告し、{{lead}}。",
      "ledBy": "責任者は {{name}} です",
      "noLead": "責任者はいません",
      "peer": "{{from}} と {{to}} の間にピアラインがあります。"
     },
     "a11y": {
      "unit": "Enter または Space でこの組織単位を選択します。C でピアラインを開始、Delete で組織単位を削除します。",
      "peer": "2 つの組織単位間のピアラインです。",
      "handle": "別の組織単位へドラッグしてピアラインを引きます"
     },
     "announce": {
      "added": "組織単位 {{name}} を {{organization}} に追加しました。",
      "peerStart": "{{name}} からピアラインを引いています。もう一方の組織単位に移動して Enter を押すか、Escape で取り消してください。",
      "connected": "{{from}} と {{to}} の間にピアラインができました。",
      "disconnected": "{{from}} と {{to}} の間のピアラインがなくなりました。",
      "memberAdded": "{{name}} を組織単位 {{unit}} に追加しました。",
      "memberRemoved": "{{name}} を組織単位 {{unit}} から削除しました。",
      "removed": "組織単位 {{name}} を {{organization}} から削除しました。"
     }
    }
   }
  }
 }
});

// Change rules and proposals (AA8.12): the Change rules page, the Proposals tab of the organization page, the change
// class and management access enums, the ChangeRule resource type, the OrgProposalApplied event, and the error codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "changeRules": {
    "label": "変更ルール",
    "tip": "エグゼクティブが確認なしで配下の組織単位に行える定型的な変更"
   }
  }
 },
 "enums": {
  "resourceType": {
   "ChangeRule": "変更ルール"
  },
  "notificationEvent": {
   "OrgProposalApplied": "組織への提案が適用済み"
  },
  "managementAccess": {
   "None": "なし",
   "Drafts": "スタジオの下書き",
   "OrgSubtree": "配下を統括するエグゼクティブ"
  },
  "changeClass": {
   "PromptRetune": "プロンプトの再調整",
   "WakeTuning": "起動の調整",
   "MandateTextEdit": "キーパーのテキスト編集",
   "AddWorker": "ワーカーの追加",
   "RemoveWorker": "ワーカーの削除",
   "ModelChange": "モデルの変更",
   "DeploymentWeight": "デプロイメントの重み"
  }
 },
 "errorCodes": {
  "RulesArePeopleOnly": "変更ルールを書けるのは人だけです。エージェントはルールを作成、変更、削除できません。",
  "ProposalNotPending": "この提案はもう決定を待っていません。もう一度開いて現在の状態を確認してください。",
  "ApproverIsAgent": "エージェントは提案を決定できません。決定するのは人です。"
 },
 "changeRules": {
  "actions": {
   "openOrganization": "組織を開く",
   "copyId": "ID をコピー"
  },
  "toasts": {
   "copied": "変更ルール ID をコピーしました。"
  },
  "status": {
   "Active": "有効",
   "Inactive": "オフ",
   "Expired": "期限切れ"
  },
  "limit": {
   "text": "{{class}}、{{name}}: {{range}}",
   "between": "{{min}} から {{max}}",
   "atMost": "最大 {{max}}",
   "atLeast": "最小 {{min}}",
   "any": "制限なし"
  },
  "limitNames": {
   "count": "提案あたりの変更数",
   "minIntervalSeconds": "最短の起動間隔 (秒)",
   "maxIntervalSeconds": "最長の起動間隔 (秒)",
   "backoffFactor": "バックオフ係数",
   "jitterPercent": "ジッター (パーセント)",
   "weight": "トラフィックの重み"
  },
  "errors": {
   "UnknownLimit": "このクラスにその名前の制限はありません。一覧から選んでください。",
   "ClassNotInRule": "制限はルールに含まれるクラスに対して設定する必要があります。クラスを追加するか、制限を変更してください。",
   "UnitNotFound": "その組織単位は、この組織の公開中の組織図にありません。",
   "Duplicate": "各クラスと各制限は 1 回しか指定できません。",
   "BoundRequired": "制限には最小値、最大値、またはその両方を指定してください。",
   "MinimumAboveMaximum": "最小値が最大値より大きくなっています。",
   "NegativeBound": "制限は 0 以上です。",
   "ExpiryInPast": "未来の有効期限を選ぶか、空欄にしてルールが期限切れにならないようにしてください。",
   "OrganizationNotFound": "その組織はこのテナントに存在しません。",
   "OrganizationNotSettable": "ルールの組織は変更できません。別の組織には新しいルールを作成してください。",
   "TooMany": "1 つのルールに設定できる制限は最大 {{max}} 件です。"
  },
  "form": {
   "errors": {
    "name": "ルールには 1 から {{max}} 文字の名前を付けてください。",
    "description": "説明は最大 {{max}} 文字です。",
    "organization": "ルールの対象となる組織を選んでください。",
    "unit": "この組織の組織単位を選んでください。",
    "classes": "変更のクラスを 1 つ以上選んでください。"
   }
  }
 },
 "orgProposals": {
  "title": "提案",
  "note": "エグゼクティブは、自分が率いる組織単位への変更を提案します。提案に含まれるすべての変更が変更ルールの対象であれば、提案はすぐに適用されます。それ以外は、ここで人の判断を待ちます。",
  "rulesLink": "変更ルール",
  "views": {
   "label": "表示する提案",
   "all": "すべて",
   "needsApproval": "承認待ち",
   "needsApprovalCount": "承認待ち ({{count}})",
   "applied": "適用済み"
  },
  "emptyTitle": "ここに提案はありません",
  "emptyBody": "エグゼクティブが配下の組織単位への変更を提案すると、その提案がここに表示されます。",
  "columns": {
   "title": "提案",
   "unit": "組織単位",
   "agent": "エグゼクティブ",
   "decision": "決定",
   "updated": "最終変更"
  },
  "decision": {
   "rule": "ルールで適用",
   "approved": "許可済み",
   "needsApproval": "承認待ち",
   "denied": "拒否済み",
   "lapsed": "失効",
   "drafting": "作成中"
  },
  "byRules": "ルール: {{names}}",
  "byPerson": "{{name}} による決定",
  "decide": "確認して決定",
  "toasts": {
   "approved": "{{title}} を許可しました。現在公開中です。",
   "denied": "{{title}} を拒否しました。エグゼクティブに差し戻されました。"
  },
  "review": {
   "open": "確認",
   "title": "提案: {{title}}",
   "run": "提案した実行",
   "approve": "許可",
   "deny": "拒否",
   "appliedByRule": "すべての変更が変更ルールの対象だったため、すぐに適用されました。ルール: {{names}}。",
   "approvedBy": "{{name}} が許可しました。",
   "deniedBy": "{{name}} が拒否しました。",
   "reasonGiven": "理由: {{reason}}",
   "revision": "組織のリビジョン {{number}} として記録されました。元に戻すには、そのリビジョンをロールバックしてください。",
   "appliedNoDiff": "この提案は適用済みのため、その変更は公開中の構成に含まれています。変更内容を見るには、記録されたリビジョンを比較してください。",
   "covered": "以下のすべての変更が変更ルールの対象のため、この提案は人の判断なしで適用されます。",
   "notCovered": "以下の変更の少なくとも 1 つが変更ルールの対象外のため、人が決定します。",
   "refusals": "ハード制限により、以下の変更は拒否されます。ルールや承認でこれを解除することはできません:",
   "noChanges": "この提案には変更が含まれていません。",
   "columns": {
    "item": "変更",
    "change": "種類",
    "rule": "対象とするルール"
   },
   "coveredBy": "ルール {{name}}",
   "reason": "理由",
   "reasonPlaceholder": "任意です。エグゼクティブに表示されます。"
  }
 },
 "views": {
  "organizationDetail": {
   "tabs": {
    "proposals": "提案 ({{count}})"
   },
   "appliedProposal": "適用された提案"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "managementAccess": "管理アクセス"
   },
   "hints": {
    "managementAccess": "ほとんどのエージェントは「なし」で十分です。「スタジオの下書き」を選ぶと、実行は開始した人のためにスタジオの変更を下書きできます。「配下を統括するエグゼクティブ」を選ぶと、組織単位を率いるエージェントが配下の組織単位への変更を提案できます。"
   }
  },
  "changeRules": {
   "title": "変更ルール",
   "subtitle": "エグゼクティブが人を待たずに配下の組織単位に行える定型的な変更です。ルールの対象外の変更には、引き続き承認が必要です。",
   "add": "ルールを追加",
   "create": "変更ルールを追加",
   "edit": "変更ルールを編集",
   "view": "変更ルール",
   "deleteTitle": "変更ルールを削除",
   "emptyTitle": "変更ルールはまだありません",
   "emptyBody": "ルールを追加すると、エグゼクティブは起動の調整などの定型的な変更を承認を待たずに適用できます。",
   "noLimits": "制限なし",
   "noExpiry": "なし",
   "chooseOrganization": "組織を選択",
   "chooseUnit": "組織単位を選択",
   "addLimit": "制限を追加",
   "filters": {
    "activeOnly": "ステータス",
    "inForce": "有効なもののみ"
   },
   "columns": {
    "name": "名前",
    "status": "ステータス",
    "organization": "組織",
    "unit": "対象範囲",
    "classes": "クラス",
    "limits": "制限",
    "expiresUtc": "有効期限",
    "createdByName": "作成者",
    "description": "説明",
    "createdUtc": "作成日時",
    "id": "ID"
   },
   "fields": {
    "organizationId": "組織",
    "unitId": "組織単位 (配下の組織単位を含む)",
    "name": "名前",
    "description": "説明",
    "classes": "変更のクラス",
    "limits": "制限",
    "limitClass": "クラス",
    "limitName": "制限",
    "minimum": "最小値",
    "maximum": "最大値",
    "active": "有効",
    "expiresUtc": "有効期限"
   },
   "hints": {
    "organizationId": "必須です。ルールの組織は後から変更できません。",
    "unitId": "必須です。ルールは、この組織単位とその配下のすべての組織単位への変更を対象とします。",
    "name": "1 から {{max}} 文字です。",
    "description": "任意です。最大 {{max}} 文字です。",
    "classes": "必須です。提案がルールで適用されるのは、含まれるすべての変更が、いずれかのルールで許可されたクラスに属する場合だけです。",
    "limits": "任意です。最大 {{max}} 件です。「提案あたりの変更数」は、1 つの提案に含められるそのクラスの変更数の上限です。その他の制限は新しい値の範囲を決めます。",
    "expiresUtc": "任意です。この時刻にルールの適用が終わります。"
   }
  }
 }
});

// Evaluations (AA9.9, AA9.15): the Eval sets, Eval runs, Shadow trials, and Canary releases pages under Autonomy,
// the case and run forms, the playground's Save as eval case, the new enums, resource types, run kinds, the
// CanaryRolledBack event, and the error codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "evaluations": {
    "label": "評価セット",
    "tip": "リリース前にエージェントを採点する、バージョン管理されたケースのセット"
   },
   "evalRuns": {
    "label": "評価実行",
    "tip": "評価セットをデプロイメントまたはエージェントのリビジョンに対して実行した記録"
   },
   "shadowTrials": {
    "label": "シャドートライアル",
    "tip": "候補のデプロイメントが実際の入力を、何も操作せずに再生します"
   },
   "canaryReleases": {
    "label": "カナリアリリース",
    "tip": "候補のデプロイメントが受け持つトラフィックを段階的に増やします"
   }
  }
 },
 "enums": {
  "resourceType": {
   "EvalSet": "評価セット",
   "EvalRun": "評価実行",
   "ShadowTrial": "シャドートライアル",
   "CanaryRelease": "カナリアリリース"
  },
  "notificationEvent": {
   "CanaryRolledBack": "カナリアがロールバックされました"
  },
  "runKind": {
   "Eval": "評価ケース",
   "Shadow": "シャドーコピー"
  },
  "evalSetState": {
   "Draft": "下書き",
   "Approved": "承認済み"
  },
  "evalSetOrigin": {
   "Human": "人が作成",
   "Evaluator": "エージェントが作成",
   "Playground": "プレイグラウンドから"
  },
  "evalScorer": {
   "ExactMatch": "完全一致",
   "Contains": "含む",
   "JsonSchemaValid": "JSON Schema に適合",
   "Judge": "判定エージェント"
  },
  "evalRunStatus": {
   "Pending": "保留中",
   "Running": "実行中",
   "Completed": "完了",
   "Failed": "失敗",
   "Cancelled": "キャンセル済み"
  },
  "evalRunTarget": {
   "AgentRevision": "エージェントのリビジョン",
   "Deployment": "デプロイメント"
  },
  "evalRunInputMode": {
   "Cases": "セットのケース",
   "RecentInputs": "最近の入力"
  },
  "shadowTrialStatus": {
   "Running": "実行中",
   "Completed": "完了",
   "Stopped": "停止済み",
   "Failed": "失敗"
  },
  "canaryStatus": {
   "Running": "実行中",
   "Promoted": "昇格済み",
   "RolledBack": "ロールバック済み",
   "Aborted": "中止済み"
  }
 },
 "errorCodes": {
  "EvalSetExists": "この名前の評価セットはすでにあります。そのセットを開いて編集すると、次のバージョンが作成されます。",
  "AlreadyApproved": "このバージョンはすでに承認されています。",
  "EvalSetEmpty": "この評価セットにはまだケースがありません。先にケースを追加してください。",
  "EvalSetImmutable": "このバージョンは承認済みのため、そのまま保持されます。編集して次のバージョンを作成するか、代わりに下書きのバージョンを削除してください。",
  "ApprovalIsPeopleOnly": "評価セットを承認できるのは人だけです。エージェントは自分を採点するセットを承認できません。",
  "EvalRunFinished": "この評価実行はすでに終了しています。",
  "ShadowTrialAlreadyRunning": "この候補は別のトライアルで、すでにそのデプロイメントのシャドーを実行しています。",
  "ShadowTrialNotRunning": "このシャドートライアルはもう実行されていません。",
  "CanaryAlreadyRunning": "これらのデプロイメントのいずれかが、実行中のカナリアリリースにすでに含まれています。",
  "CanaryNotRunning": "このカナリアリリースはもう実行されていません。",
  "EvalGateFailed": "昇格するには、このリビジョンが環境の承認済み評価セットに合格した評価実行が必要ですが、まだありません。",
  "PeopleOnly": "この操作ができるのは人と API のアクセスキーだけです。実行トークンではできません。"
 },
 "evals": {
  "versionShort": "v{{version}}",
  "setVersion": "{{name}} v{{version}}",
  "percent": "{{value}}%",
  "progress": "{{total}} 件中 {{completed}} 件のケースが完了、{{passed}} 件が合格",
  "noJudge": "判定なし",
  "noSet": "なし",
  "untilStopped": "停止するまで",
  "verdict": {
   "passed": "合格",
   "failed": "しきい値未満",
   "none": "判定なし"
  },
  "outcome": {
   "passed": "合格",
   "failed": "不合格",
   "errored": "エラー"
  },
  "target": {
   "deployment": "デプロイメント {{name}}",
   "revision": "エージェント {{agent}}、リビジョン {{revision}}"
  },
  "actions": {
   "runSet": "セットを実行",
   "openSet": "セットを開く",
   "cancelRun": "実行をキャンセル",
   "stopTrial": "トライアルを停止",
   "abortCanary": "リリースを中止",
   "copyId": "ID をコピー"
  },
  "toasts": {
   "copied": "ID をコピーしました。",
   "approved": "{{name}} v{{version}} を承認しました。これで昇格のゲートとして使えます。",
   "caseSaved": "ケースを保存しました。",
   "caseSavedNextVersion": "ケースを新しい下書きのバージョン {{version}} に保存しました。",
   "caseSavedTo": "ケースを {{name}} に保存しました。",
   "caseRemoved": "ケースを削除しました。",
   "caseRemovedNextVersion": "新しい下書きのバージョン {{version}} からケースを削除しました。",
   "setSavedNextVersion": "新しい下書きのバージョン {{version}} として保存しました。",
   "runStarted": "{{name}} の評価実行を開始しました。",
   "runCancelled": "評価実行をキャンセルしました。",
   "trialStopped": "シャドートライアルを停止しました。",
   "canaryAborted": "カナリアリリースを中止しました。重みは開始前の値に戻りました。"
  },
  "reason": {
   "label": "理由",
   "placeholder": "任意。記録と監査ログに保存されます。"
  },
  "form": {
   "errors": {
    "name": "セットの名前を 1 から {{max}} 文字で入力してください。",
    "description": "説明は最大 {{max}} 文字です。",
    "judgeAgent": "判定エージェントの名前は最大 {{max}} 文字です。",
    "tags": "各タグは最大 {{max}} 文字です。"
   }
  },
  "set": {
   "nextVersion": "このバージョンは承認済みのため、保存するとバージョン {{version}} が下書きとして作成されます。このバージョンはそのまま残ります。"
  },
  "case": {
   "addTitle": "{{name}} にケースを追加",
   "editTitle": "ケース {{number}} を編集",
   "save": "ケースを保存",
   "nextVersion": "このバージョンは承認済みのため、変更は新しい下書きのバージョン {{version}} に入ります。このバージョンはそのまま残ります。",
   "fromRun": "実行 {{id}} から保存しました。",
   "fields": {
    "name": "名前",
    "inputText": "入力",
    "expectedText": "期待される出力",
    "hidden": "採点対象のエージェントには非表示",
    "checks": "チェック"
   },
   "placeholders": {
    "name": "任意。例: 上限を超える返金",
    "inputText": "エージェントが受け取るメッセージ",
    "expectedText": "良い回答が述べる内容"
   },
   "hints": {
    "name": "任意。最大 {{max}} 文字です。",
    "inputText": "必須。ケースはこれをエージェントへの入力として送ります。",
    "expectedText": "任意。完全一致と「含む」のチェックは、独自のテキストがない場合にこれと比較します。判定エージェントはこれを模範解答として読みます。",
    "hidden": "エージェント自身の実行には非表示のケースのスコアだけが見え、入力や期待される出力は見えません。そのため答えを覚えることはできません。"
   },
   "checks": {
    "scorer": "スコアラー",
    "weight": "重み",
    "add": "チェックを追加",
    "remove": "チェック {{number}} を削除",
    "none": "チェックがありません。このケースは期待される出力との完全一致で採点されます。期待される出力がない場合は判定エージェントが採点します。"
   },
   "scorerHints": {
    "ExactMatch": "前後の空白を除いて、出力がテキストと等しければ合格です。",
    "Contains": "出力がテキストを含んでいれば合格です。",
    "JsonSchemaValid": "出力がスキーマに適合する JSON であれば合格です。",
    "Judge": "セットの判定エージェントが、評価基準と期待される出力に照らして出力を採点します。"
   },
   "argumentLabels": {
    "ExactMatch": "一致させるテキスト",
    "Contains": "検索するテキスト",
    "JsonSchemaValid": "JSON Schema",
    "Judge": "評価基準"
   },
   "argumentPlaceholders": {
    "ExactMatch": "空の場合は期待される出力を使います",
    "Contains": "空の場合は期待される出力を使います",
    "JsonSchemaValid": "{\"type\": \"object\", \"required\": [\"answer\"]}",
    "Judge": "任意。良い回答が満たすべきこと"
   },
   "errors": {
    "input": "ケースには入力テキストが必要です。",
    "name": "名前は最大 {{max}} 文字です。",
    "weight": "重みは 0 から {{max}} です。",
    "schema": "ここに JSON Schema のオブジェクトを入力してください。",
    "argument": "テキストを入力するか、ケースの期待される出力を入力してください。"
   }
  },
  "run": {
   "title": "評価セットを実行",
   "titleFor": "{{name}} v{{version}} を実行",
   "intro": "各ケースはそれぞれ評価の実行として動きます。エージェントのリビジョンに対する実行は一時的なデプロイメントを使うため、本番のトラフィックには影響しません。",
   "start": "実行を開始",
   "starting": "開始しています...",
   "setOption": "{{name}} v{{version}}",
   "chooseDeployment": "デプロイメントを選択",
   "chooseAgent": "エージェントを選択",
   "fields": {
    "setId": "評価セット",
    "targetType": "評価対象",
    "deploymentId": "デプロイメント",
    "agentId": "エージェント",
    "agentRevisionId": "リビジョン",
    "inputMode": "入力",
    "recentInputCount": "再生する最近の入力の数",
    "thresholdPercent": "合格しきい値 (パーセント)",
    "budgetUsd": "予算 (USD)"
   },
   "hints": {
    "setId": "各セットの最新バージョンが表示されます。",
    "targetType": "現在動いているデプロイメント、またはエージェントのリビジョン (スタジオのプレイグラウンドが実行する下書きなど) です。",
    "agentId": "必須。リビジョンを指定しない場合は、エージェントの下書きのリビジョンか、最新の公開済みリビジョンが実行されます。",
    "agentRevisionId": "任意。エージェントのリビジョン ID です。空の場合は下書きのリビジョンを実行します。",
    "inputMode": "セットのケース、またはデプロイメントで最近成功した入力を判定エージェントが採点します。",
    "recentInputCount": "1 から {{max}} です。",
    "thresholdPercent": "任意。0 から 100 です。重み付きスコアがこの値に達すると実行は合格します。",
    "budgetUsd": "任意。ケースと判定の実行がこの額を使うと、残りのケースはスキップされ、実行は失敗になります。"
   },
   "errors": {
    "set": "実行する評価セットを選択してください。",
    "deployment": "評価するデプロイメントを選択してください。",
    "agent": "評価するエージェントを選択してください。",
    "threshold": "しきい値は 0 から 100 パーセントです。",
    "budget": "予算は 0 から {{max}} USD です。",
    "recentInputs": "再生する最近の入力は 1 から {{max}} 件です。"
   }
  },
  "save": {
   "open": "評価ケースとして保存",
   "title": "評価ケースとして保存",
   "intro": "このターンの入力とエージェントの回答がケースになります。今回の回答をなぞるだけでなく、良い回答とは何かが分かるように期待される出力を編集してください。",
   "set": "評価セット",
   "newSet": "新しい評価セット...",
   "newSetName": "新しいセットの名前",
   "newSetHint": "新しいセットは、作成元が「プレイグラウンドから」の下書きとして始まります。",
   "submit": "ケースを保存",
   "done": "完了",
   "openSet": "セットを開く",
   "runSet": "セットを実行",
   "entryAgent": "エントリーエージェント",
   "saved": "ケースを {{name}} v{{version}} に保存しました。",
   "runHint": "「セットを実行」は、このプレイグラウンドが実行した {{agent}} の下書きのリビジョンを評価します。",
   "errors": {
    "set": "評価セットを選択するか、新しく作成してください。"
   }
  },
  "setDetail": {
   "title": "評価セット",
   "back": "すべての評価セット",
   "notFoundTitle": "評価セットが見つかりません",
   "notFoundBody": "誰かが削除した下書きだった可能性があります。承認済みのバージョンは常に保持されます。",
   "approve": "承認",
   "approveTitle": "{{name}} v{{version}} を承認",
   "approveMessage": "承認済みのバージョンはそのまま保持され、昇格とカナリアリリースのゲートとして使えます。その後の編集では、次のバージョンが下書きとして作成されます。",
   "approvedNote": "このバージョンは承認済みで、そのまま保持されます。セットやケースを編集すると、バージョン {{version}} が下書きとして作成されます。",
   "approvedByAt": "{{name}}, {{when}}",
   "needsJudge": "判定エージェントが採点するケースがありますが、このセットには判定エージェントがありません。実行する前にセットを編集して判定エージェントを選んでください。",
   "editTitle": "{{name}} を編集",
   "deleteTitle": "下書きのバージョンを削除",
   "deleteMessage": "{{name}} v{{version}} を削除しますか？承認済みのバージョンには影響しません。",
   "cases": "ケース ({{count}})",
   "addCase": "ケースを追加",
   "noCases": "まだケースがありません。ここで追加するか、スタジオのプレイグラウンドからターンを保存してください。",
   "noExpected": "なし",
   "hidden": "非表示",
   "removeCaseTitle": "ケース {{number}} を削除",
   "removeCaseMessage": "このケースを下書きから削除しますか？",
   "removeCaseApproved": "このバージョンは承認済みのため、ケースは新しい下書きのバージョン {{version}} から削除されます。このバージョンにはケースが残ります。",
   "versions": "バージョン",
   "thisVersion": "v{{version}} (このバージョン)",
   "runs": "最近の評価実行",
   "allRuns": "このバージョンのすべての実行",
   "noRuns": "このバージョンはまだ実行されていません。",
   "fields": {
    "state": "状態",
    "origin": "作成元",
    "judgeAgent": "判定エージェント",
    "tags": "タグ",
    "authoredBy": "作成者",
    "approvedBy": "承認者",
    "previousVersion": "前のバージョン",
    "lastUpdateUtc": "最終変更",
    "description": "説明"
   },
   "columns": {
    "order": "#",
    "name": "名前",
    "input": "入力",
    "expected": "期待される出力",
    "scorers": "採点方法",
    "hidden": "非表示",
    "source": "元の実行"
   },
   "versionColumns": {
    "version": "バージョン",
    "state": "状態",
    "caseCount": "ケース",
    "approvedBy": "承認者",
    "lastUpdateUtc": "最終変更"
   },
   "runColumns": {
    "run": "評価実行",
    "status": "ステータス",
    "verdict": "判定",
    "score": "スコア",
    "target": "評価対象",
    "createdUtc": "開始"
   }
  },
  "runDetail": {
   "title": "評価実行",
   "back": "すべての評価実行",
   "notFoundTitle": "評価実行が見つかりません",
   "notFoundBody": "ID を確認するか、評価セットから実行を開いてください。",
   "live": "ライブ",
   "polling": "ポーリング中",
   "failure": "実行が失敗しました: {{reason}}",
   "progressLabel": "完了したケース",
   "kpi": {
    "score": "スコア",
    "threshold": "しきい値 {{threshold}}",
    "noThreshold": "しきい値なし",
    "passed": "合格したケース",
    "errored": "エラーになったケース",
    "cost": "コスト",
    "budget": "予算 {{budget}}",
    "noBudget": "予算なし"
   },
   "fields": {
    "target": "評価対象",
    "targetType": "対象の種類",
    "inputMode": "入力",
    "startedBy": "開始者",
    "createdUtc": "開始",
    "completedUtc": "終了",
    "studioDraftId": "スタジオの下書き"
   },
   "recentInputs": "最近の入力 {{count}} 件",
   "results": "ケースの結果 ({{count}})",
   "failingOnly": "不合格のみ ({{count}})",
   "noFailing": "すべてのケースが合格しました。",
   "noResults": "この実行にはケースの結果が記録されていません。",
   "waiting": "最初のケースが終わるのを待っています。",
   "caseNumber": "ケース {{number}}",
   "recentInput": "最近の入力 {{number}}",
   "checksPassed": "{{total}} 件中 {{passed}} 件が合格",
   "open": "開く",
   "columns": {
    "order": "#",
    "case": "ケース",
    "outcome": "結果",
    "score": "スコア",
    "checks": "チェック",
    "output": "出力"
   },
   "resultTitle": "ケース {{number}}",
   "resultTitleNamed": "ケース {{number}}: {{name}}",
   "scoreIs": "スコア {{score}}",
   "openCaseRun": "ケースの実行を開く",
   "openSourceRun": "元の実行を開く",
   "hiddenCase": "このケースは採点対象のエージェントには表示されません。",
   "input": "入力",
   "diff": "期待される出力と実際の出力の比較",
   "expected": "期待値",
   "output": "出力",
   "noOutput": "出力はありません。",
   "checks": "チェック",
   "noChecks": "採点されたチェックはありません。",
   "checkColumns": {
    "scorer": "スコアラー",
    "weight": "重み",
    "score": "スコア",
    "outcome": "結果",
    "note": "スコアラーのメモ",
    "judgeRun": "判定の実行"
   },
   "cancelTitle": "評価実行をキャンセル",
   "cancelMessage": "{{name}} のこの実行をキャンセルしますか？終わっていないケースも一緒にキャンセルされます。"
  },
  "shadow": {
   "errors": {
    "name": "名前は最大 {{max}} 文字です。",
    "source": "実行をコピーする元のデプロイメントを選択してください。",
    "candidate": "候補のデプロイメントを選択してください。",
    "same": "候補にはソースとは別のデプロイメントを指定してください。",
    "sample": "実行の 1 から 100 パーセントをサンプリングしてください。",
    "ends": "将来の終了日時を選ぶか、空のままにして停止するまで実行してください。"
   }
  },
  "shadowDetail": {
   "title": "シャドートライアル",
   "back": "すべてのシャドートライアル",
   "notFoundTitle": "シャドートライアルが見つかりません",
   "notFoundBody": "ID を確認するか、一覧からトライアルを開いてください。",
   "note": "シャドー実行は、ソースの入力を候補で再生します。副作用のあるツールの使用、メッセージの送信、メモリへの書き込み、レポートの提出はできません。ソースの実行には影響しません。",
   "stopReason": "停止: {{reason}}",
   "stopTitle": "シャドートライアルを停止",
   "stopMessage": "{{name}} を停止しますか？これ以上実行はコピーされません。これまでの件数は保持されます。",
   "kpi": {
    "compared": "比較済み",
    "agreed": "一致",
    "diverged": "相違",
    "failures": "候補の失敗",
    "agreement": "一致率"
   },
   "comparison": {
    "text": "正規化したテキスト",
    "set": "評価セットで比較",
    "judge": "判定エージェントで比較"
   },
   "fields": {
    "source": "ソース",
    "candidate": "候補",
    "samplePercent": "サンプリング率",
    "comparison": "比較方法",
    "endsUtc": "終了予定",
    "createdBy": "開始者",
    "createdUtc": "開始",
    "completedUtc": "終了"
   }
  },
  "canary": {
   "stepOf": "ステップ {{number}}/{{total}}、{{percent}}%",
   "gateText": "{{name}} が {{score}} 以上",
   "noGate": "評価ゲートなし",
   "errors": {
    "agent": "トラフィックを移すエージェントを選択してください。",
    "candidate": "候補のデプロイメントを選択してください。",
    "baseline": "ベースラインのデプロイメントを選択してください。",
    "same": "候補とベースラインには別々のデプロイメントを指定してください。",
    "steps": "ステップを 1 つ以上指定してください。最後のステップは 100 パーセントです。",
    "tooMany": "リリースのステップは最大 {{max}} 個です。",
    "increasing": "各ステップのパーセントは 1 から 100 で、前のステップより大きくしてください。",
    "lastStep": "最後のステップは 100 パーセントにしてください。",
    "errorRate": "エラー率の上限は 0 から 100 パーセントです。",
    "gate": "評価ゲートには評価セットと最小スコアの両方を指定するか、どちらも指定しないでください。",
    "score": "最小スコアは 0 から 100 パーセントです。"
   }
  },
  "canaryDetail": {
   "title": "カナリアリリース",
   "heading": "{{agent}} のカナリアリリース",
   "back": "すべてのカナリアリリース",
   "notFoundTitle": "カナリアリリースが見つかりません",
   "notFoundBody": "ID を確認するか、一覧からリリースを開いてください。",
   "rolledBack": "ロールバックしました: {{reason}} 重みは開始前の値に戻りました。",
   "aborted": "中止しました: {{reason}} 重みは開始前の値に戻りました。",
   "promoted": "昇格しました。{{candidate}} がすべてのトラフィックを受け持ちます。",
   "noReason": "理由は記載されていません。",
   "withWeight": "{{name}} (リリース前の重み {{weight}})",
   "gate": "最新の評価スコアが {{score}} 以上",
   "steps": "ステップ",
   "columns": {
    "step": "ステップ",
    "weightPercent": "候補のトラフィック",
    "minimumRuns": "最小実行数",
    "minimumMinutes": "最小時間 (分)",
    "state": "状態"
   },
   "stepStates": {
    "done": "完了",
    "current": "現在",
    "stopped": "ここで停止",
    "pending": "待機中"
   },
   "abortTitle": "カナリアリリースを中止",
   "abortMessage": "リリースを中止しますか？両方のデプロイメントは開始前の重みに戻ります。",
   "fields": {
    "agent": "エージェント",
    "candidate": "候補",
    "baseline": "ベースライン",
    "maxErrorRatePercent": "エラー率の上限",
    "gate": "評価ゲート",
    "stepStartedUtc": "現在のステップの開始",
    "createdBy": "開始者",
    "completedUtc": "終了"
   }
  },
  "fieldCodes": {
   "InputRequired": "ケースには入力テキストが必要です。",
   "UnknownScorer": "完全一致、含む、JSON Schema に適合、判定エージェントのいずれかを使ってください。",
   "ArgumentRequired": "テキストを入力するか、ケースの期待される出力を入力してください。",
   "InvalidJsonSchema": "有効な JSON Schema ではありません。",
   "TooManyCases": "このセットは保持できるケースの上限に達しています。",
   "EvaluatorIsForAgents": "作成元「エージェントが作成」は、エージェントが作ったセット用です。「人が作成」か「プレイグラウンドから」を選んでください。",
   "SetRequired": "実行する評価セットを選択してください。",
   "TargetRequired": "評価する対象を選択してください。",
   "RecentInputsNeedDeployment": "最近の入力はデプロイメントの実行を再生します。デプロイメントを評価してください。",
   "NoRecentInputs": "このデプロイメントには、再生できる成功した実行がまだありません。",
   "EvalSetEmpty": "このバージョンにはケースがありません。",
   "JudgeAgentRequired": "判定エージェントが必要なケースがありますが、セットに判定エージェントがありません。セットを編集して選んでください。",
   "DeploymentNotFound": "そのデプロイメントはこのテナントに存在しません。",
   "SameDeployment": "異なる 2 つのデプロイメントを選択してください。",
   "DifferentAgent": "両方のデプロイメントが同じエージェントに属している必要があります。",
   "DeploymentInactive": "そのデプロイメントは無効です。先に有効にしてください。",
   "AgentMismatch": "エージェントはソースのデプロイメントのエージェントである必要があります。",
   "EndsInPast": "将来の終了日時を選ぶか、空のままにしてください。",
   "EvalSetNotFound": "その評価セットはこのテナントに存在しません。",
   "AgentNotFound": "そのエージェントはこのテナントに存在しません。",
   "EvalGateIncomplete": "評価ゲートには評価セットと最小スコアの両方を指定するか、どちらも指定しないでください。",
   "NotIncreasing": "各ステップのパーセントは前のステップより大きくしてください。",
   "LastStepNotFull": "最後のステップは 100 パーセントにしてください。"
  }
 },
 "resources": {
  "evalSets": {
   "title": "評価セット",
   "subtitle": "エージェントを採点する、バージョン管理されたケースです。バージョンを承認すると、昇格とカナリアリリースのゲートとして使えます。",
   "add": "評価セットを追加",
   "create": "評価セットを追加",
   "edit": "評価セットを編集",
   "view": "評価セット",
   "deleteTitle": "下書きのバージョンを削除",
   "emptyTitle": "評価セットはまだありません",
   "emptyBody": "ここでセットとケースを追加するか、スタジオのプレイグラウンドのターンを最初のケースとして保存してください。",
   "filters": {
    "latestOnly": "バージョン",
    "newestOnly": "最新バージョンのみ",
    "allVersions": "すべてのバージョン"
   },
   "columns": {
    "name": "名前",
    "version": "バージョン",
    "state": "状態",
    "origin": "作成元",
    "caseCount": "ケース",
    "judgeAgent": "判定エージェント",
    "tags": "タグ",
    "authoredByName": "作成者",
    "approvedByName": "承認者",
    "description": "説明",
    "lastUpdateUtc": "最終変更",
    "id": "ID"
   },
   "fields": {
    "name": "名前",
    "description": "説明",
    "origin": "作成元",
    "judgeAgent": "判定エージェント",
    "tags": "タグ"
   },
   "hints": {
    "name": "1 から {{max}} 文字です。名前はバージョンをまたいで変わりません。",
    "description": "任意。最大 {{max}} 文字です。",
    "origin": "「プレイグラウンドから」は、プレイグラウンドのターンから作られたセットを示します。",
    "judgeAgent": "判定チェック、期待される出力のないケース、最近の入力を採点するエージェントです。",
    "tags": "任意。1 行に 1 つ、それぞれ最大 {{max}} 文字です。"
   }
  },
  "evalRuns": {
   "title": "評価実行",
   "subtitle": "評価セットのバージョンをデプロイメントまたはエージェントのリビジョンに対して実行した記録と、しきい値に対するスコアです。",
   "add": "セットを実行",
   "create": "評価セットを実行",
   "edit": "評価実行",
   "view": "評価実行",
   "deleteTitle": "評価実行を削除",
   "emptyTitle": "評価実行はまだありません",
   "emptyBody": "評価セットを実行して、リリース前のデプロイメントや下書きのリビジョンを採点しましょう。",
   "columns": {
    "setName": "評価セット",
    "status": "ステータス",
    "verdict": "判定",
    "score": "スコア",
    "threshold": "しきい値",
    "progress": "進捗",
    "target": "評価対象",
    "inputMode": "入力",
    "costUsd": "コスト",
    "startedByName": "開始者",
    "createdUtc": "開始",
    "id": "ID"
   }
  },
  "shadowTrials": {
   "title": "シャドートライアル",
   "subtitle": "候補のデプロイメントが、本番デプロイメントの入力の一部を何も操作せずに再生し、その出力を比較します。",
   "add": "シャドートライアルを開始",
   "create": "シャドートライアルを開始",
   "edit": "シャドートライアル",
   "view": "シャドートライアル",
   "deleteTitle": "シャドートライアルを削除",
   "emptyTitle": "シャドートライアルはまだありません",
   "emptyBody": "トライアルを開始すると、候補のデプロイメントがトラフィックを受け持つ前に、実際の入力にどう答えるかを確認できます。",
   "columns": {
    "name": "名前",
    "status": "ステータス",
    "source": "ソース",
    "candidate": "候補",
    "samplePercent": "サンプリング率",
    "comparedCount": "比較済み",
    "agreedCount": "一致",
    "divergedCount": "相違",
    "candidateFailureCount": "失敗",
    "agreement": "一致率",
    "endsUtc": "終了予定",
    "createdUtc": "開始",
    "id": "ID"
   },
   "fields": {
    "name": "名前",
    "sourceDeploymentId": "ソースのデプロイメント",
    "candidateDeploymentId": "候補のデプロイメント",
    "samplePercent": "サンプリング率 (パーセント)",
    "endsUtc": "終了予定",
    "comparisonEvalSetId": "評価セットで比較",
    "useJudge": "判定エージェントで比較"
   },
   "hints": {
    "name": "任意。最大 {{max}} 文字です。",
    "sourceDeploymentId": "必須。成功した実行がコピーされます。このデプロイメント自体には影響しません。",
    "candidateDeploymentId": "必須。同じエージェントの別のデプロイメントです。",
    "samplePercent": "1 から 100、既定値は 10 です。ソースの実行のうちコピーされる割合です。",
    "endsUtc": "任意。空の場合は誰かが停止するまで実行されます。",
    "comparisonEvalSetId": "任意。指定しない場合、出力は正規化したテキストとして比較されます。",
    "useJudge": "2 つの出力が一致しているかを判定エージェントに尋ねます。"
   }
  },
  "canaryReleases": {
   "title": "カナリアリリース",
   "subtitle": "候補のデプロイメントがエージェントのトラフィックを受け持つ割合を段階的に増やし、問題が起きると自動でロールバックします。",
   "add": "カナリアリリースを開始",
   "create": "カナリアリリースを開始",
   "edit": "カナリアリリース",
   "view": "カナリアリリース",
   "deleteTitle": "カナリアリリースを削除",
   "emptyTitle": "カナリアリリースはまだありません",
   "emptyBody": "リリースを開始すると、トラフィックを新しいデプロイメントへ 1 ステップずつ移せます。",
   "addStep": "ステップを追加",
   "columns": {
    "agent": "エージェント",
    "status": "ステータス",
    "candidate": "候補",
    "baseline": "ベースライン",
    "step": "ステップ",
    "maxErrorRatePercent": "エラーの上限",
    "gate": "評価ゲート",
    "rollbackReason": "ロールバックの理由",
    "createdUtc": "開始",
    "id": "ID"
   },
   "fields": {
    "agentId": "エージェント",
    "baselineDeploymentId": "ベースラインのデプロイメント",
    "candidateDeploymentId": "候補のデプロイメント",
    "steps": "ステップ",
    "weightPercent": "候補のトラフィック (パーセント)",
    "minimumRuns": "最小実行数",
    "minimumMinutes": "最小時間 (分)",
    "maxErrorRatePercent": "エラー率の上限 (パーセント)",
    "evalSetId": "評価ゲートのセット",
    "minEvalScorePercent": "最小評価スコア (パーセント)"
   },
   "hints": {
    "agentId": "必須。両方のデプロイメントがこのエージェントに属します。",
    "baselineDeploymentId": "必須。残りのトラフィックを受け持ちます。",
    "candidateDeploymentId": "必須。リリースするデプロイメントです。",
    "steps": "1 から {{max}} ステップです。各パーセントは前の値より大きく、最後は 100 です。",
    "maxErrorRatePercent": "0 から 100、既定値は 5 です。1 つのステップで候補の失敗した実行がこの割合を超えると、リリースはロールバックされます。",
    "evalSetId": "任意。このセットの最新の評価実行が最小スコアに達した場合にだけ、ステップが進みます。",
    "minEvalScorePercent": "評価ゲートのセットを指定した場合は必須です。0 から 100 です。"
   }
  }
 }
});
// The board (AA10.4, AA10.6, AA10.7, AA10.8): the Board page under Autonomy with its chart, attention, proposals with
// evidence, spend, brief, brakes, direction, and conversation with the CEO; the Autonomy tour stops; the setup wizard's
// first keeper step; the BoardBrief event; and the board error codes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "board": {
    "label": "ボード",
    "tip": "1 つの組織をひと目で: 健全性、要対応事項、提案、支出、ブレーキ、CEO"
   }
  }
 },
 "enums": {
  "notificationEvent": {
   "BoardBrief": "ボードへの概要が提出された"
  }
 },
 "errorCodes": {
  "BoardCeoMissing": "この組織には CEO がいません。ルートの組織単位に、公開中のリビジョンでキーパーを持つ責任者が必要です。",
  "BoardCeoUnavailable": "CEO のキーパーにデプロイメントがないため、話しかける相手がいません。先にキーパーにデプロイメントを設定してください。"
 },
 "views": {
  "organizationDetail": {
   "openBoard": "ボード"
  }
 },
 "board": {
  "title": "ボード",
  "subtitle": "キーパーの組織を監督します。決定が必要なこと、そのコスト、そしてブレーキ。",
  "heading": "{{name}} のボード",
  "generated": "更新日時",
  "refresh": "再読み込み",
  "openOrganization": "組織を開く",
  "killSwitchOn": "緊急停止スイッチがオンです。オフにするまで、このテナントのキーパーは起動しません。",
  "notFoundTitle": "ボードを表示できません",
  "notFoundBody": "組織が存在しないか、閲覧する権限がありません。",
  "picker": {
   "title": "組織を選択",
   "select": "組織",
   "choose": "組織を選んでください",
   "open": "ボードを開く",
   "emptyTitle": "組織はまだありません",
   "emptyBody": "まずキーパーの組織を作成してください。そのボードがここに表示されます。",
   "organizations": "組織へ移動"
  },
  "chart": {
   "title": "組織図と健全性",
   "empty": "この組織にはまだ組織単位がありません。組織のページで組織単位を追加し、リビジョンを公開してください。",
   "health": "組織単位の健全性",
   "frozen": "凍結中",
   "overBudget": "予算超過",
   "columns": {
    "unit": "組織単位",
    "health": "健全性",
    "escalations": "未解決のエスカレーション",
    "brakes": "ブレーキ",
    "lastReport": "最新のレポート"
   }
  },
  "attention": {
   "title": "要対応",
   "empty": "今ボードが対応すべきことはありません。",
   "none": "なし。",
   "escalations_one": "未解決のエスカレーション {{count}} 件",
   "escalations_other": "未解決のエスカレーション {{count}} 件",
   "reports_one": "異常のレポート {{count}} 件",
   "reports_other": "異常のレポート {{count}} 件",
   "caps_one": "予算上限に達した組織単位 {{count}} 個",
   "caps_other": "予算上限に達した組織単位 {{count}} 個",
   "raisedBy": "作成者: {{name}}",
   "filedBy": "提出者: {{name}}"
  },
  "proposals": {
   "title": "提案",
   "empty": "決定を待っている提案はありません。",
   "by": "{{unit}} の {{agent}}",
   "showChanges": "変更を表示",
   "hideChanges": "変更を隠す"
  },
  "evidence": {
   "title": "根拠",
   "empty": "この提案を裏付ける評価実行、シャドートライアル、カナリアリリースはまだありません。",
   "since": "提案が最後に変更された {{when}} 以降。",
   "evalRuns": "評価実行",
   "shadowTrials": "シャドートライアル",
   "canaryReleases": "カナリアリリース",
   "evalSet": "{{name}} v{{version}}",
   "evalScore": "スコア {{score}} (しきい値 {{threshold}})、{{total}} ケース中 {{done}} 件",
   "stale": "最後の変更より前",
   "shadow": "シャドートライアル {{name}}",
   "shadowCounts": "{{compared}} 件中 {{agreed}} 件一致、{{diverged}} 件相違、候補の失敗 {{failures}} 件",
   "canary": "{{name}} のカナリア",
   "canaryStep": "ステップ {{step}} / {{total}}",
   "rollback": "ロールバック済み: {{reason}}"
  },
  "spend": {
   "title": "予算に対する支出",
   "empty": "現在の期間に予算または支出のある組織単位はありません。"
  },
  "brief": {
   "title": "最新の概要",
   "ceo": "CEO: {{name}} ({{unit}} の責任者)。",
   "cadence_one": "概要は 1 時間ごとです。",
   "cadence_other": "概要は {{count}} 時間ごとです。",
   "noCadence": "CEO のキーパーに概要の間隔が設定されていません。",
   "empty": "CEO はまだ概要を提出していません。"
  },
  "ceo": {
   "missing": "ルートの組織単位に責任者がいないため、この組織には CEO がいません。",
   "noMandate": "CEO は公開中のリビジョンでキーパーを持っていません。",
   "noDeployment": "CEO のキーパーには話しかけられるデプロイメントがありません。"
  },
  "brakes": {
   "title": "ブレーキ",
   "active_one": "有効な凍結 {{count}} 件",
   "active_other": "有効な凍結 {{count}} 件",
   "none": "凍結されているものはありません。",
   "frozenBy": "凍結した人: {{name}}",
   "lift": "解除",
   "freezeOrg": "組織を凍結",
   "unit": "組織単位",
   "pickUnit": "組織単位を選んでください",
   "freezeUnit": "組織単位を凍結",
   "rollback": "組織図をロールバック",
   "rollbackTitle": "組織図のロールバック",
   "rollbackMessage": "組織を、リビジョン {{number}} の前に公開されていたリビジョンに戻しますか? 指揮系統、予算、メッセージの経路もすぐにそれに従います。",
   "rollbackNote": "ボードからロールバック",
   "rolledBack": "ロールバックしました。リビジョン {{number}} が公開中です。"
  },
  "direction": {
   "title": "CEO への指示",
   "note": "このテキストは CEO のキーパーの新しい公開リビジョンになり、次のティックでボードからの指示として読まれます。",
   "text": "指示",
   "placeholder": "例: 監査が終わるまで、500 ドルを超える返金は人の判断に回してください。",
   "count": "{{count}} / {{max}} 文字",
   "changeNote": "変更メモ",
   "changeNotePlaceholder": "ボードがこの指示を出した理由 (任意)",
   "submit": "指示を送信",
   "given": "指示を {{name}} のリビジョン {{number}} として公開しました。",
   "errors": {
    "required": "CEO への指示を入力してください。",
    "tooLong": "{{max}} 文字以内にしてください。"
   }
  },
  "ceoChat": {
   "title": "CEO と話す",
   "note": "メッセージはボードからのものとして、CEO のデプロイメントとの会話を始めます。",
   "talkingTo": "ボードとして {{name}} と話しています。",
   "conversation": "会話",
   "newConversation": "新しい会話",
   "new": "新規",
   "transcript": "CEO との会話",
   "empty": "まだメッセージはありません。組織の状況を CEO に聞いてみましょう。",
   "message": "メッセージ",
   "tooLong": "{{max}} 文字以内にしてください。"
  }
 },
 "wizard": {
  "steps": {
   "keeper": "最初のキーパー"
  },
  "welcomeItemKeeper": "最初のキーパーを作成します。スケジュールに従って起動し、目的に向けて働くエージェントです。",
  "keeper": {
   "body": "キーパーはサンプルエージェントに目的を与え、スケジュールに従って起動します。何も変化がない間は間隔を広げます。擬似ハーネスを使うので費用はかかりません。キーパーのページで一時停止や削除ができます。",
   "objectiveDefault": "ときどき状況を確認し、すべて平穏であることを報告してください。",
   "description": "セットアップウィザードが作成しました。",
   "create": "キーパーを作成",
   "created": "キーパー {{name}} を作成しました。スケジュールに従って起動します。",
   "ready": "キーパー {{name}} の準備ができました。テスト実行に進んでください。"
  }
 },
 "tour": {
  "steps": {
   "autonomy": {
    "title": "自律運用",
    "body": "キーパーは、スケジュールに従って起動し、目的に向けて働くエージェントです。エスカレーション、凍結、緊急停止スイッチ、メモリ、レポート、メッセージでその動きを管理します。"
   },
   "board": {
    "title": "ボード",
    "body": "組織はキーパーを CEO の下にまとめます。ボードのタブでは、1 つの組織の健全性、決定が必要なこと、支出、ブレーキを確認でき、CEO に指示を出したり話しかけたりできます。"
   }
  }
 },
 "explainers": {
  "board": {
   "title": "ボード",
   "p1": "ボードは、組織のルートの組織単位の上に立つ人またはグループです。このページには、ボードに必要な情報がまとまっています。最新のレポートに基づく各組織単位の健全性、未解決のエスカレーション、異常のレポート、予算上限に達した組織単位、そして評価、シャドー、カナリアの根拠付きで決定を待つ提案です。",
   "p2": "ブレーキを使うと、組織単位や組織全体を凍結したり、組織図をロールバックしたり、緊急停止スイッチですべてのキーパーを止めたりできます。指示は CEO のキーパーの新しいリビジョンになり、「CEO と話す」は CEO のデプロイメントとの通常の会話を開きます。"
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "board": "ボード: 1 つの組織の健全性、要対応事項、提案、支出、概要、ブレーキを 1 ページで確認します。"
   }
  },
  "enums": {
   "notificationEvent": {
    "BoardBrief": "組織の CEO がボードへの概要を提出しました。"
   }
  },
  "views": {
   "organizationDetail": {
    "openBoard": "この組織のボードを開きます。健全性、要対応事項、提案、支出、ブレーキ、CEO。"
   }
  },
  "wizard": {
   "keeper": {
    "name": "キーパーの名前です。英字、数字、ドット、ハイフン、アンダースコアを使えます。",
    "objective": "キーパーが目指すことです。ティックごとに読まれます。",
    "create": "サンプルエージェントの擬似ハーネスのデプロイメントでキーパーを作成し、テスト実行に進みます。",
    "skip": "キーパーなしで続行します。キーパーのページで後から追加できます。"
   }
  },
  "board": {
   "refresh": "ボードを読み込み直します。組織が変わったときにも更新されます。",
   "openOrganization": "組織のページを開いて、組織単位、予算、リビジョンを編集します。",
   "openEscalation": "エスカレーションを開いて回答します。",
   "openReport": "指標、問題、決定事項を含むレポートを開きます。",
   "openKeeper": "ティックとリビジョンを含む CEO のキーパーを開きます。",
   "picker": {
    "select": "ボードを開く組織です。",
    "open": "この組織のボードを開きます。",
    "organizations": "組織のページを開いて作成します。"
   },
   "chart": {
    "title": "公開中の組織図です。各組織単位の責任者、メンバー、最新のレポートに基づく健全性、支出を表示します。",
    "frozen": "有効な凍結がこの組織単位または組織全体に適用されています。",
    "overBudget": "この組織単位の配下が、現在の期間で予算を使い切りました。",
    "columns": {
     "unit": "公開中のリビジョンの組織単位です。",
     "health": "組織単位で提出された最新のレポートに基づく健全性です。レポートがない場合は不明です。",
     "escalations": "組織単位のエージェントが作成した未解決のエスカレーションです。",
     "brakes": "凍結が組織単位に適用されているか、予算を超過しているかを示します。",
     "lastReport": "最新のレポートが提出された日時です。クリックでレポートを開きます。"
    }
   },
   "attention": {
    "title": "ボードの対応を待っているもの: 未解決のエスカレーション、過去 7 日間の低下または異常のレポート、予算上限に達した組織単位。"
   },
   "proposals": {
    "title": "組織のエグゼクティブが提案し、どの変更ルールにも該当せず人の判断を待っている変更です。",
    "toggle": "提案の変更と、それぞれに該当するルールを表示または非表示にします。内容はサーバーから読み込みます。"
   },
   "evidence": {
    "title": "提案が最後に変更されて以降の、提案されたエージェントの評価実行、シャドートライアル、カナリアリリースです。",
    "openEvalRun": "ケースの結果を含む評価実行を開きます。",
    "openShadowTrial": "比較結果を含むシャドートライアルを開きます。",
    "openCanary": "ステップを含むカナリアリリースを開きます。",
    "stale": "この評価実行は提案が最後に変更される前に始まったため、現在の変更を検証していない可能性があります。"
   },
   "spend": {
    "title": "各組織単位の、現在の日と月の期間における予算に対する支出です。"
   },
   "brief": {
    "title": "CEO がボードに提出した最新の概要と、CEO のキーパーが概要を求める間隔です。"
   },
   "brakes": {
    "title": "すばやく作業を止めます。組織単位や組織の凍結、組織図のロールバック、緊急停止スイッチのオン。",
    "lift": "この凍結を解除します。対象範囲の作業が再び始まる可能性があります。",
    "freezeOrg": "凍結が解除されるまで、この組織のすべてのエージェントとキーパーを凍結します。確認を求めます。",
    "orgFrozen": "この組織はすでに凍結されています。先にその凍結を解除してください。",
    "unit": "凍結する組織単位です。その配下もすべて含みます。",
    "freezeUnit": "選んだ組織単位とその配下を凍結します。確認を求めます。",
    "rollback": "現在のリビジョンの前に公開されていたリビジョンに戻します。確認を求めます。",
    "rollbackNone": "戻せる以前の公開リビジョンがありません。"
   },
   "direction": {
    "title": "CEO に指示を出します。テキストは、ソースがボードの CEO のキーパーの新しいリビジョンとして公開されます。",
    "text": "1 から 4000 文字です。CEO の次のティックでボードからの指示として読まれます。",
    "changeNote": "任意、2000 文字以内です。リビジョンと一緒に保存されます。",
    "submit": "指示を CEO のキーパーの新しいリビジョンとして公開します。"
   },
   "ceoChat": {
    "title": "CEO のデプロイメントとの会話です。各メッセージは、ほかの実行と同じように開ける実行です。",
    "conversation": "過去のボードの会話を続けるか、新しい会話を始めます。",
    "new": "CEO との新しい会話を始めます。",
    "message": "CEO に伝える内容です。Enter で送信、Shift+Enter で改行します。",
    "send": "メッセージを送信します。返信は下にストリーミング表示されます。"
   }
  }
 }
});

// Performance signals and org-scale brakes (AA11.7): the Performance page under Autonomy with its window picker, unit
// and agent tables, chart, and scheduled checks; the EvalSet trigger target; the budget freeze margin; cancel
// everything in a unit; the rollback's in-flight ticks choice; the OrgBudgetFrozen and UnitCascadeCancelled labels;
// and the tour stop.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "items": {
   "performance": {
    "label": "パフォーマンス",
    "tip": "組織の組織単位とエージェントの働きぶりと、エージェントが採点できないチェック"
   }
  }
 },
 "enums": {
  "triggerTargetType": {
   "EvalSet": "定期チェック"
  },
  "notificationEvent": {
   "OrgBudgetFrozen": "予算超過で組織単位を凍結"
  },
  "auditEventType": {
   "OrgBudgetFrozen": "予算超過で組織単位を凍結",
   "UnitCascadeCancelled": "組織単位のすべてを取り消し"
  },
  "rollbackActiveTicks": {
   "Finish": "完了まで実行",
   "Cancel": "取り消す"
  }
 },
 "errorCodes": {
  "OrganizationNotLive": "この組織にはまだ公開リビジョンがありません。先にリビジョンを公開してください。"
 },
 "resources": {
  "organizations": {
   "fields": {
    "budgetFreezeMarginPercent": "予算凍結の余裕幅 (%)"
   },
   "hints": {
    "budgetFreezeMarginPercent": "{{min}} から {{max}}、既定値は {{default}} です。支出が予算をこの割合だけ超えた組織単位は、人が解除するまで凍結されます。0 は予算に達した時点で凍結します。"
   }
  },
  "triggers": {
   "fields": {
    "evalSetId": "評価セット",
    "evalJudgeAgentId": "採点エージェント",
    "evalRecentInputCount": "最近の入力数"
   },
   "hints": {
    "evalSetId": "チェックで実行するセットです。結果はパフォーマンスページで管理者に表示されます。",
    "checkDeployment": "必須です。チェックはこのデプロイメントの最近の入力をセットに対して再実行します。",
    "evalRecentInputCount": "{{min}} から {{max}}、既定値は {{default}} です。各チェックで再実行するデプロイメントの最新入力の数です。"
   },
   "errors": {
    "evalSetRequired": "このチェックで実行する評価セットを選んでください。",
    "deploymentRequired": "このチェックで採点するデプロイメントを選んでください。",
    "evalRecentInputCount": "{{min}} から {{max}} までの整数を入力してください。"
   },
   "setJudge": "評価セットの採点エージェント",
   "checkNotice": "定期チェックは保存した人として実行されます。エージェントはチェックを作成、変更、採点できません。"
  }
 },
 "organizations": {
  "form": {
   "errors": {
    "margin": "{{min}} から {{max}} までの整数を入力してください。"
   }
  }
 },
 "views": {
  "organizationDetail": {
   "openPerformance": "パフォーマンス",
   "freezeMargin": "予算を {{percent}}% 超えると凍結"
  }
 },
 "rollbackTicks": {
  "legend": "実行中のキーパーのティック"
 },
 "cascadeCancel": {
  "action": "この組織単位のすべてを取り消す",
  "title": "{{name}} のすべてを取り消す",
  "message": "{{name}} とその配下のすべての組織単位にいるエージェントについて、待機中と実行中の実行、キーパーのティック、未解決のエスカレーション、待機中のメッセージをすべて取り消しますか？組織単位は凍結されないため、新しい作業は再び始まる可能性があります。",
  "reason": "理由",
  "reasonPlaceholder": "すべてを止める理由 (任意)",
  "keep": "実行を続ける",
  "confirm": "すべて取り消す",
  "working": "取り消し中...",
  "done": "{{name}} のすべてを取り消しました。",
  "resultIntro": "{{name}} のすべてが停止しました:",
  "notFrozen": "組織単位は凍結されていません。新しい作業が始まらないよう凍結してください。",
  "freeze": "組織単位を凍結",
  "counts": {
   "runsCancelled": "取り消した実行",
   "ticksCancelled": "取り消したキーパーのティック",
   "escalationsWithdrawn": "取り下げたエスカレーション",
   "messagesExpired": "期限切れにしたメッセージ"
  }
 },
 "performance": {
  "title": "パフォーマンス",
  "subtitle": "組織の各組織単位とエージェントの成果: 結果、コスト、レイテンシ、エスカレーション、評価スコア。",
  "heading": "{{name}} のパフォーマンス",
  "range": "{{from}} から {{to}} まで",
  "notFoundTitle": "パフォーマンスを表示できません",
  "notFoundBody": "組織が存在しないか、読み取る権限がありません。",
  "unit": "組織単位",
  "allUnits": "すべての組織単位",
  "lead": "リーダー",
  "sample": "実行 {{n}}",
  "outcomes": "成功 {{succeeded}}、失敗 {{failed}}、取り消し {{cancelled}}",
  "evalScore_other": "{{count}} 件の評価実行で {{score}}",
  "picker": {
   "title": "組織を選ぶ",
   "emptyTitle": "組織はまだありません",
   "emptyBody": "まずキーパーの組織を作成してください。そのパフォーマンスがここに表示されます。"
  },
  "window": {
   "label": "期間",
   "24h": "24 時間",
   "7d": "7 日間",
   "30d": "30 日間",
   "custom": "カスタム",
   "from": "開始日",
   "to": "終了日",
   "apply": "適用",
   "errors": {
    "from": "最初の日を選んでください。",
    "to": "最後の日を選んでください。",
    "order": "最後の日は最初の日より前にできません。",
    "span": "期間は最大 {{max}} 日です。"
   }
  },
  "chart": {
   "title": "組織単位ごとの成功率とコスト",
   "successRate": "成功率",
   "cost": "コスト",
   "noRuns": "完了した実行なし",
   "rateLabel": "{{unit}} の成功率: {{value}}",
   "costLabel": "{{unit}} のコスト: {{value}}"
  },
  "columns": {
   "unit": "組織単位",
   "agent": "エージェント",
   "runs": "実行",
   "outcomes": "結果",
   "successRate": "成功率",
   "costUsd": "コスト",
   "latency": "レイテンシ p50 / p95 / p99",
   "escalations": "エスカレーション",
   "loopGuardRejections": "ループガードの拒否",
   "evalScore": "評価スコア",
   "samples": "サンプル実行"
  },
  "units": {
   "title": "組織単位",
   "empty": "この期間の公開組織図に組織単位がありません。"
  },
  "agents": {
   "title": "エージェント",
   "empty": "公開組織図に配置されたエージェントがありません。"
  },
  "checks": {
   "title": "定期チェック",
   "note": "チェックは、デプロイメントの最近の入力に対してスケジュールどおりに行う評価実行です。作成するのは人で、エージェントは採点も変更もできません。",
   "new": "新しいチェック",
   "empty": "この組織のデプロイメントを対象とする定期チェックはありません。",
   "never": "未実行",
   "passed": "合格",
   "failed": "しきい値未満",
   "columns": {
    "check": "チェック",
    "evalSet": "評価セット",
    "deployment": "デプロイメント",
    "schedule": "スケジュール",
    "lastRun": "前回の実行",
    "lastScore": "前回のスコア",
    "nextFire": "次回の実行"
   }
  }
 },
 "tour": {
  "steps": {
   "performance": {
    "title": "パフォーマンス",
    "body": "パフォーマンスタブには、組織の各組織単位とエージェントが期間内にどう働いたかと、エージェント自身に採点させずに評価する定期チェックが表示されます。"
   }
  }
 },
 "explainers": {
  "performance": {
   "title": "パフォーマンス",
   "p1": "組織単位の各行は、その組織単位と配下すべてを対象にします。期間内に作成された実行、その結果、成功率 (成功数を成功数と失敗数の合計で割った値)、コスト、レイテンシのパーセンタイル、発生したエスカレーション、ループガードの拒否、組織単位のデプロイメントに対する評価実行の平均スコアです。評価、シャドー、プレイグラウンドの実行は数えません。",
   "p2": "定期チェックは EvalSet トリガーです。スケジュールに従って、承認済みの評価セットをデプロイメントの最近の入力に対して実行します。作成できるのは人だけなので、エージェントが自分の仕事を採点することはできません。"
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "performance": "パフォーマンス: 組織単位とエージェントごとの結果、コスト、レイテンシ、エスカレーション、評価スコアと定期チェック。"
   }
  },
  "enums": {
   "triggerTargetType": {
    "EvalSet": "起動のたびに、デプロイメントの最近の入力に対してセットの評価実行を開始します。作成できるのは人だけです。"
   },
   "notificationEvent": {
    "OrgBudgetFrozen": "組織単位の支出が組織の余裕幅を超えて予算を上回り、予算ガードが凍結しました。"
   },
   "auditEventType": {
    "OrgBudgetFrozen": "支出が組織の余裕幅を超えて予算を上回った組織単位を、予算ガードが凍結しました。",
    "UnitCascadeCancelled": "誰かが組織単位の配下にあるすべての実行、キーパーのティック、エスカレーション、待機中のメッセージを取り消しました。"
   },
   "rollbackActiveTicks": {
    "Finish": "実行中のティックは完了しますが、そのキーパーは復元されたリビジョンのままです。",
    "Cancel": "組織図を復元する前に、実行中のティックの実行を取り消します。"
   }
  },
  "resources": {
   "organizations": {
    "budgetFreezeMarginPercent": "予算ガードが凍結する前に、組織単位が予算をどれだけ超えてよいかの割合です。0 から 100、既定値は 10 です。"
   },
   "triggers": {
    "evalSetId": "チェックが起動のたびに実行する評価セットです。",
    "evalJudgeAgentId": "回答を採点するエージェントです。空欄なら評価セットの採点エージェントを使います。",
    "evalRecentInputCount": "各評価実行で再実行するデプロイメントの最新入力の数です。1 から 50 です。"
   }
  },
  "views": {
   "organizationDetail": {
    "openPerformance": "この組織の組織単位とエージェントごとのパフォーマンスと定期チェックを開きます。"
   }
  },
  "rollbackTicks": {
   "legend": "組織図をロールバックするときに実行中のキーパーのティックをどうするか。"
  },
  "board": {
   "brakes": {
    "pickUnitFirst": "先に組織単位を選んでください。"
   }
  },
  "cascadeCancel": {
   "action": "この組織単位とその配下のすべての作業を止めます。実行、キーパーのティック、エスカレーション、待機中のメッセージが対象です。確認を求めます。",
   "confirm": "組織単位の配下にあるすべてを今すぐ取り消します。元に戻せません。",
   "reason": "任意、1024 文字以内です。監査ログと取り下げたエスカレーションに記録されます。",
   "freeze": "凍結を解除するまで新しい作業が始まらないよう、組織単位を凍結します。",
   "counts": {
    "runsCancelled": "取り消した、配下のエージェントの待機中と実行中の実行です。",
    "ticksCancelled": "取り消した実行中のキーパーのティックです。",
    "escalationsWithdrawn": "取り下げた、配下のエージェントが発生させた未解決のエスカレーションです。",
    "messagesExpired": "期限切れにした、配下のエージェント宛ての待機中のメッセージです。"
   }
  },
  "performance": {
   "refresh": "選んだ期間のパフォーマンスを読み直します。",
   "unit": "1 つの組織単位とその配下、またはすべての組織単位を表示します。",
   "lead": "このエージェントは組織単位のリーダーです。",
   "openAgent": "エージェントを開きます。",
   "openRun": "このサンプル実行を開きます。",
   "picker": {
    "open": "この組織のパフォーマンスを開きます。"
   },
   "window": {
    "24h": "直近 24 時間です。",
    "7d": "直近 7 日間です。",
    "30d": "直近 30 日間です。",
    "custom": "最初の日と最後の日を選びます。最大 90 日間です。",
    "from": "期間の最初の日 (UTC) です。",
    "to": "期間の最後の日 (UTC) で、この日も含みます。",
    "apply": "この期間のパフォーマンスを読み込みます。"
   },
   "chart": {
    "title": "期間内の各組織単位の配下全体の成功率とコストです。",
    "successRate": "成功した実行を、成功と失敗の合計で割った値です。",
    "cost": "組織単位の配下全体の支出で、最も高い組織単位を基準にしています。"
   },
   "columns": {
    "unit": "組織単位です。その行は配下すべてを対象にします。",
    "agent": "エージェントと、その所属する組織単位です。",
    "runs": "期間内に作成された実行です。評価、シャドー、プレイグラウンドの実行は除きます。",
    "outcomes": "成功、失敗、取り消しの実行数です。",
    "successRate": "成功数を成功数と失敗数の合計で割った値です。完了した実行がなければ空欄です。",
    "costUsd": "これらの実行の支出 (米ドル) です。",
    "latency": "完了した実行の所要時間の中央値、95 パーセンタイル、99 パーセンタイルです。",
    "escalations": "発生したエスカレーションと、エスカレーションを発生させた実行の割合です。",
    "loopGuardRejections": "ループガードが拒否したメッセージ送信と起動です。",
    "evalScore": "これらのデプロイメントに対する完了した評価実行の平均スコアで、定期チェックも含みます。",
    "samples": "確認用の最大 5 件の実行です。最新の失敗が先、その後に最新の成功です。"
   },
   "units": {
    "title": "各組織単位と、その配下全体の指標です。"
   },
   "agents": {
    "title": "公開組織図の各エージェントと、その指標です。"
   },
   "checks": {
    "title": "組織のデプロイメントに対してスケジュールどおりに行う、人が設定した評価実行です。",
    "new": "定期チェックを対象にしたトリガーエディターを開きます。",
    "openSet": "評価セットを開きます。",
    "openRun": "前回の評価実行とケースの結果を開きます。",
    "passed": "前回の実行はセットのしきい値に達しました。",
    "failed": "前回の実行はセットのしきい値に届きませんでした。",
    "columns": {
     "check": "チェックをスケジュールするトリガーと、それが有効かどうかです。",
     "evalSet": "チェックで実行する評価セットです。",
     "deployment": "チェックで最近の入力を再実行するデプロイメントです。",
     "schedule": "トリガーの cron 式です。",
     "lastRun": "前回の評価実行の開始時刻と状態です。実行を開きます。",
     "lastScore": "前回の評価実行のスコアで、0 から 100 パーセントです。",
     "nextFire": "次にチェックを実行する時刻です。"
    }
   }
  }
 }
});

// Simulated user findings (AA12.8): the missing-permission tooltip of Autonomy write actions (UT-03), the keeper
// link on an escalation (UT-12), the tab bar scroll buttons (UT-16), the run form's empty threshold and budget
// (UT-07), and the Manual wake source (UT-15).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "common": {
  "tabs": {
   "scrollBack": "前のタブを表示",
   "scrollForward": "ほかのタブを表示"
  }
 },
 "evals": {
  "run": {
   "placeholders": {
    "thresholdPercent": "なし",
    "budgetUsd": "なし"
   },
   "hints": {
    "thresholdPercent": "任意。0 から 100。加重スコアがこの値に達すると合格です。空のままにすると、しきい値も合否判定もありません。",
    "budgetUsd": "任意。ケースとジャッジの実行がこの金額を使うと、残りのケースはスキップされ、実行は失敗します。空のままにすると予算はありません。"
   }
  }
 },
 "tips": {
  "permissions": {
   "denied": "この操作は許可されていません。{{resource}} に対する {{operation}} が必要です。"
  },
  "views": {
   "escalationDetail": {
    "openKeeperNamed": "これを起こしたティックのキーパーを開きます。ID は {{id}} です。"
   }
  },
  "tabs": {
   "scrollBack": "タブバーを戻し、表示中の最初のタブより前に隠れているタブを表示します。",
   "scrollForward": "タブバーをスクロールし、端の先に隠れているタブを表示します。"
  },
  "enums": {
   "wakeSource": {
    "Manual": "人がキーパーを起こしました。今すぐ起こす、再開、リビジョンの公開、または指示によるものです。"
   }
  }
 }
});

// AA12.8 follow-ups: keeper and escalation audit event labels, the board's earlier unhealthy report count, the
// RevisionUnchanged refusal of keeper publish and board direction, typed field errors (InvalidType, InvalidValue),
// and the harness profile MCP tool name prefix.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "enums": {
  "auditEventType": {
   "MandatePaused": "キーパーを一時停止",
   "MandateResumed": "キーパーを再開",
   "MandateWoken": "キーパーを起動",
   "MandateDeleted": "キーパーを削除",
   "EscalationAnswered": "エスカレーションに回答",
   "EscalationCancelled": "エスカレーションを取り消し"
  }
 },
 "board": {
  "attention": {
   "earlier_one": "ほか以前の {{count}} 件",
   "earlier_other": "ほか以前の {{count}} 件"
  },
  "direction": {
   "unchanged": "{{name}} の現在のリビジョンには既にこの指示があります。何も公開されず、CEO も起動しませんでした。"
  }
 },
 "errorCodes": {
  "RevisionUnchanged": "変更はありません。下書きは最新の公開リビジョンと同じ内容のため、公開されませんでした。公開する前に変更するか、破棄してください。"
 },
 "components": {
  "keeperRevision": {
   "unchanged": "リビジョン {{number}} を下書きとして保存しましたが、公開していません。現在のリビジョンと同じ内容です。"
  }
 },
 "common": {
  "fieldCodes": {
   "InvalidType": "この値の型が正しくありません。",
   "InvalidTypeOf": "{{type}}を入力してください。",
   "InvalidValue": "この値は使用できません。",
   "InvalidValueOneOf": "次のいずれかを選んでください: {{values}}。",
   "InvalidValueRange": "{{min}} から {{max}} の値を入力してください。",
   "fieldMessage": "{{field}}: {{message}}"
  },
  "fieldTypes": {
   "text": "テキスト",
   "trueFalse": "true または false",
   "wholeNumber": "整数",
   "number": "数値",
   "map": "名前と値のオブジェクト",
   "list": "リスト",
   "object": "オブジェクト",
   "dateTime": "2026-12-31T00:00:00Z のような日時",
   "duration": "00:05:00 のような期間"
  }
 },
 "resources": {
  "harnessProfiles": {
   "fields": {
    "mcpToolNamePrefix": "MCP ツール名の接頭辞"
   },
   "hints": {
    "mcpToolNamePrefix": "任意。英字、数字、_ - . : と {server}、128 文字まで。"
   },
   "errors": {
    "toolPrefixTooLong": "{{max}} 文字以内にしてください。",
    "toolPrefixInvalid": "英字、数字、_ - . : と {server} だけを使ってください。"
   }
  }
 },
 "tips": {
  "enums": {
   "auditEventType": {
    "MandatePaused": "誰かがキーパーを一時停止しました。再開するまで起動しません。",
    "MandateResumed": "誰かが一時停止中のキーパーを再開し、すぐに起動しました。",
    "MandateWoken": "誰かがキーパーで今すぐ起こすを使いました。",
    "MandateDeleted": "誰かがキーパーをリビジョンとティックごと削除しました。",
    "EscalationAnswered": "誰かが未回答のエスカレーションに回答しました。",
    "EscalationCancelled": "誰かが未回答のエスカレーションを取り消しました。"
   }
  },
  "board": {
   "attention": {
    "earlier_one": "この作成者は過去 7 日間に、低下または異常のレポートをほかに {{count}} 件提出しています。その作成者のレポートをすべて開きます。",
    "earlier_other": "この作成者は過去 7 日間に、低下または異常のレポートをほかに {{count}} 件提出しています。その作成者のレポートをすべて開きます。"
   }
  },
  "keeperRevision": {
   "unchanged": "このリビジョンは現在のものと同じ内容のため、公開しても何も変わりません。先に何かを変更してください。"
  },
  "resources": {
   "harnessProfiles": {
    "mcpToolNamePrefix": "ハーネスが MCP ツールをモデルに示すとき、ツール名の前に付ける文字列です。サーバー名には {server} を使います。例: mcp__{server}__ や {server}.(ドット)。モデルがそのままのツール名を見る場合は空にします。"
   }
  }
 }
});

// Navigation (AA13): Organizations and Evaluations are their own hubs, split out of Autonomy.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "hubs": {
   "autonomy": {
    "tip": "自律して働き続けるエージェント。キーパーはスケジュールで起動し、互いにメッセージを送り、レポートを提出し、記憶し、行き詰まると人に尋ねます。凍結で停止できます。"
   },
   "organizations": {
    "label": "組織",
    "tip": "リーダーと予算を持つユニットの組織図として配置されたエージェント。ボード、ユニット別のパフォーマンス、エグゼクティブが提案を適用できる変更ルールを扱います。"
   },
   "evaluations": {
    "label": "評価",
    "tip": "変更が本番に届く前の確認。評価セットとその実行、稼働中のエージェントと並ぶシャドートライアル、トラフィックを段階的に移すカナリアリリースを扱います。"
   }
  }
 },
 "tips": {
  "nav": {
   "hubs": {
    "autonomy": "自律して働き続けるエージェント。キーパーはスケジュールで起動し、互いにメッセージを送り、レポートを提出し、記憶し、行き詰まると人に尋ねます。凍結で停止できます。",
    "organizations": "リーダーと予算を持つユニットの組織図として配置されたエージェント。ボード、ユニット別のパフォーマンス、エグゼクティブが提案を適用できる変更ルールを扱います。",
    "evaluations": "変更が本番に届く前の確認。評価セットとその実行、稼働中のエージェントと並ぶシャドートライアル、トラフィックを段階的に移すカナリアリリースを扱います。"
   }
  }
 }
});

(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "table": {
   "columns": "列"
  }
 }
});

// Activity trail (LP2): the Trail tab of Run detail, its sequence, graph, and list views, the step drawer, and Open trail links.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "trail": {
  "tab": "トレイル",
  "loading": "トレイルを読み込んでいます...",
  "notFound": "この実行のトレイルが見つかりません。実行が削除された可能性があります。",
  "refresh": "更新",
  "exportJson": "JSON をエクスポート",
  "openTrail": "トレイルを開く",
  "openStep": "詳細",
  "openStepNamed": "{{step}} の詳細",
  "callerLane": "呼び出し元",
  "focusRun": "開いた実行",
  "runOfKind": "実行: {{kind}}",
  "redactedTitle": "{{kind}} (非表示)",
  "redactedNote": "記録を読む権限がないため、一部のステップは非表示です。種類と時刻だけが表示されます。",
  "idleGap": "{{duration}} の待機",
  "keysHint": "矢印キーでステップを移動し、Enter で開きます。",
  "sequenceLabel": "{{lanes}} レーン、{{steps}} ステップのシーケンス",
  "graphLabel": "{{steps}} ステップのグラフ",
  "listEmpty": "このフィルターに一致するステップはありません。",
  "singleTitle": "この実行は他に何も開始していません",
  "singleBody": "メッセージの送信、他の実行の開始、提出はありませんでした。トレイルにはリクエストと応答が表示されます。",
  "truncationSetting": "トレイルの設定",
  "truncation": {
   "NodeCap": "このトレイルは、サーバーが構築する上限の {{count}} ステップで打ち切られました。以降のステップは表示されません。",
   "HopCap": "このトレイルは、サーバーがたどる上限の {{hops}} 回のメッセージホップで打ち切られました。以降のホップは表示されません。",
   "SpanCap": "このトレイルは、サーバーが扱う最長の時間幅で打ち切られました。以降のステップは表示されません。"
  },
  "views": {
   "label": "トレイルの表示",
   "sequence": "シーケンス",
   "graph": "グラフ",
   "list": "一覧"
  },
  "zoom": {
   "label": "拡大率",
   "in": "拡大",
   "out": "縮小",
   "percent": "{{value}}%"
  },
  "summary": {
   "agents": "エージェント",
   "hops": "メッセージホップ",
   "duration": "所要時間",
   "tokens": "トークン",
   "cost": "コスト",
   "failures": "失敗"
  },
  "filters": {
   "kind": "ステップ",
   "agent": "エージェント",
   "state": "状態"
  },
  "columns": {
   "order": "#",
   "step": "ステップ",
   "agent": "エージェント",
   "state": "状態",
   "reachedBy": "到達方法",
   "started": "開始",
   "duration": "所要時間",
   "unit": "ユニット",
   "runKind": "実行の種類",
   "tokens": "トークン",
   "cost": "コスト",
   "id": "ID",
   "open": "詳細"
  },
  "drawer": {
   "close": "詳細を閉じる",
   "loading": "記録を読み込んでいます...",
   "recordGone": "このステップの記録はもう存在しません。",
   "redacted": "この{{kind}}を読む権限がありません。種類と時刻だけが表示されます。",
   "dataNote": "以下のテキストはエージェントまたは人が書いたものです。データとして表示しています。指示ではなく、マークアップとして描画されることもありません。",
   "writtenByAgentInRun": "実行 {{run}} でエージェント {{agent}} が記述",
   "writtenByAgent": "エージェント {{agent}} が記述",
   "writtenBy": "{{name}} が記述",
   "unknownAuthor": "不明",
   "openRecord": "記録を開く",
   "tokens": "入力 {{input}}、出力 {{output}}",
   "texts": {
    "result": "結果",
    "subject": "件名",
    "body": "本文",
    "title": "タイトル",
    "question": "質問",
    "context": "背景",
    "answer": "回答",
    "summary": "概要",
    "input": "ツールの入力"
   },
   "fields": {
    "kind": "種類",
    "state": "状態",
    "agent": "エージェント",
    "unit": "ユニット",
    "runKind": "実行の種類",
    "tool": "ツール",
    "started": "開始",
    "ended": "終了",
    "duration": "所要時間",
    "tokens": "トークン",
    "cost": "コスト",
    "id": "ID",
    "argumentDigest": "引数のハッシュ",
    "leaseEpoch": "リースのエポック"
   }
  },
  "kinds": {
   "Caller": "リクエスト",
   "Trigger": "トリガー",
   "KeeperTick": "キーパーのティック",
   "Run": "実行",
   "Message": "メッセージ",
   "Report": "レポート",
   "Escalation": "エスカレーション",
   "Approval": "承認",
   "Effect": "ツールの効果",
   "FanOutGroup": "ファンアウト",
   "PipelineRun": "パイプライン実行",
   "Reply": "応答",
   "Redacted": "非表示のステップ"
  },
  "edges": {
   "Started": "開始",
   "Spawned": "生成",
   "FannedOut": "ファンアウト",
   "Retried": "再試行",
   "Sent": "送信",
   "Woke": "起動",
   "Filed": "提出",
   "Raised": "提起",
   "Routed": "転送",
   "Answered": "回答",
   "Requested": "要求",
   "Decided": "決定",
   "Performed": "実行",
   "Replied": "返答"
  },
  "states": {
   "Pending": "保留中",
   "Queued": "待機中",
   "Leased": "割り当て済み",
   "Running": "実行中",
   "Cancelling": "キャンセル中",
   "Suspended": "一時停止",
   "Open": "未解決",
   "Authorized": "認可済み",
   "Dispatched": "送出済み",
   "Succeeded": "成功",
   "Completed": "完了",
   "Delivered": "配信済み",
   "Acknowledged": "確認済み",
   "Answered": "回答済み",
   "Filed": "提出済み",
   "Approved": "承認済み",
   "Joined": "合流済み",
   "Failed": "失敗",
   "TimedOut": "タイムアウト",
   "Rejected": "拒否",
   "Denied": "却下",
   "Expired": "期限切れ",
   "BudgetExceeded": "予算超過",
   "Unknown": "不明",
   "Cancelled": "キャンセル済み",
   "Withdrawn": "取り下げ"
  }
 }
});

// The organization designer (LP3.2 to LP3.10): the Design tab, people palette, unit panel tabs, live checks, undo, chart overlays, and templates.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "orgDesigner": {
   "tabs": {
    "design": "設計",
    "people": "メンバー",
    "keepers": "キーパー",
    "budget": "予算",
    "rules": "ルール",
    "label": "組織単位 {{name}}"
   },
   "note": "変更はすぐに作業ツリーへ保存されます。ページ上部からリビジョンを公開するまで、本番には反映されません。",
   "empty": "組織単位はまだありません。[組織単位を追加] でルートの組織単位を作るか、テンプレートから新しい組織を始めてください。",
   "narrow": "キャンバスにはもっと広い画面が必要なため、組織単位を下に一覧で表示しています。変更はこれまでどおり作業ツリーに保存されます。",
   "failed": "{{change}}に失敗しました。",
   "operations": {
    "AddUnit": "組織単位の追加",
    "RemoveUnit": "組織単位の削除",
    "MoveUnit": "組織単位の移動",
    "SetLead": "責任者の変更",
    "AddUnitMember": "メンバーの追加",
    "RemoveUnitMember": "メンバーの削除",
    "ConnectUnits": "ピアラインの追加",
    "DisconnectUnits": "ピアラインの削除",
    "SetBudget": "予算の保存",
    "AttachMandate": "キーパーの割り当て",
    "DetachMandate": "キーパーの解除"
   },
   "minimap": "組織のミニマップ",
   "node": {
    "problems_one": "問題 {{count}} 件",
    "problems_other": "問題 {{count}} 件"
   },
   "announce": {
    "leadSet": "{{name}} が {{unit}} の責任者になりました。"
   },
   "keys": {
    "undo": "Ctrl+Z で直前の変更を元に戻し、Ctrl+Shift+Z または Ctrl+Y でやり直します (Mac では Cmd)。",
    "place": "[メンバー] でエージェントを選んだ状態で組織単位の上で Enter を押すとメンバーとして追加し、L を押すと責任者にします。"
   },
   "history": {
    "label": "元に戻す / やり直し",
    "undo": "元に戻す",
    "redo": "やり直し",
    "undone": "元に戻しました: {{change}}。",
    "redone": "やり直しました: {{change}}。",
    "methods": {
     "addUnit": "組織単位の追加",
     "removeUnit": "組織単位の削除",
     "moveUnit": "組織単位の移動",
     "setLead": "責任者の変更",
     "addMember": "メンバーの追加",
     "removeMember": "メンバーの削除",
     "connectUnits": "ピアラインの追加",
     "disconnectUnits": "ピアラインの削除",
     "setBudget": "予算の変更",
     "attachMandate": "キーパーの割り当て",
     "detachMandate": "キーパーの解除"
    }
   },
   "palette": {
    "title": "メンバー",
    "search": "エージェントを検索",
    "hint": "エージェントを組織単位にドラッグするとメンバーとして追加し、責任者の行にドラッグすると責任者にします。エージェントを選んでから行き先を選ぶこともできます。",
    "none": "このテナントにはまだエージェントがありません。",
    "noMatch": "検索に一致するエージェントはありません。",
    "inUnit": "{{unit}} に所属",
    "newAgent": "新しいエージェント",
    "newAgentTitle": "{{unit}} の新しいエージェント",
    "placing": "{{name}} の配置先:",
    "unit": "組織単位",
    "as": "役割",
    "asMember": "メンバー",
    "asLead": "責任者",
    "place": "配置"
   },
   "structure": {
    "lead": "責任者",
    "title": "責任者の肩書き",
    "setLead": "責任者を設定",
    "parent": "報告先",
    "move": "移動"
   },
   "keepers": {
    "hint": "キーパーは、エージェントが起動スケジュールに従って続ける常設の仕事です。組織単位の各ポジションに 1 つずつ割り当てられます。",
    "noPeople": "先に責任者かメンバーを追加してください。キーパーは組織単位の人に割り当てます。",
    "lead": "責任者",
    "member": "メンバー",
    "none": "キーパーは割り当てられていません。",
    "nextWake": "次回の起動 {{when}}",
    "notScheduled": "予定なし",
    "every": "{{interval}} ごと",
    "schedule": "スケジュールを編集",
    "detach": "解除",
    "pick": "割り当てるキーパー",
    "attach": "割り当て",
    "create": "新しいキーパー",
    "createTitle": "{{name}} の新しいキーパー"
   },
   "budget": {
    "hint": "予算は、この組織単位とその配下すべてが使える上限です。支出は公開中のリビジョンの現在の期間の値です。",
    "amount": "予算 (USD)",
    "clear": "クリア",
    "noSpend": "この期間の支出は記録されていません。",
    "cap": "上限は {{amount}} ({{unit}} の{{period}}予算) です。",
    "noCap": "上位の組織単位に{{period}}予算はありません。",
    "capLeft": "{{unit}} のこの期間の残りは {{left}} です。"
   },
   "rules": {
    "hint": "変更ルールがあると、このサブツリー内のエグゼクティブの定型的な提案が人の承認なしで適用されます。ルールを書けるのは人だけです。",
    "add": "ルールを追加",
    "none": "この組織単位に当てはまる変更ルールはありません。",
    "here": "この組織単位で設定されています。",
    "above": "上位の {{unit}} で設定されています。",
    "by": "作成者: {{name}}。",
    "runToken": "エージェントは変更ルールを書けないため、実行トークンではこの一覧は読み取り専用です。"
   },
   "problems": {
    "title_one": "チェック: 問題 {{count}} 件",
    "title_other": "チェック: 問題 {{count}} 件",
    "checking": "組織をチェックしています...",
    "none": "問題は見つかりませんでした。",
    "failed": "チェックを実行できませんでした: {{reason}}",
    "show": "{{unit}} を表示",
    "UnitWithoutLead": "{{unit}} に責任者がいません。",
    "AgentInTwoUnits": "{{agent}} が {{unit}} を含む複数の組織単位に所属しています。",
    "PeerLineToMissingUnit": "{{unit}} に、組織にない組織単位へのピアラインがあります。",
    "BudgetOverParent": "{{unit}} の予算が上位の組織単位の予算を超えています。",
    "KeeperDeploymentMissing": "{{unit}} の {{agent}} のキーパー {{mandate}} に有効なデプロイメントがありません。",
    "UnitDetachedFromRoot": "{{unit}} からルートの組織単位までたどれません。"
   },
   "overlay": {
    "range": "アクティビティの期間",
    "days_one": "{{count}} 日",
    "days_other": "{{count}} 日",
    "spend": "{{period}}: {{amount}} 中 {{spent}}",
    "spendOnly": "{{period}}: {{spent}} を支出",
    "activity_one": "直近 {{count}} 日で実行 {{runs}} 件、エスカレーション {{escalations}} 件、{{cost}}",
    "activity_other": "直近 {{count}} 日で実行 {{runs}} 件、エスカレーション {{escalations}} 件、{{cost}}",
    "pick": "組織単位を選ぶと最近の実行が表示されます。",
    "noReport": "まだレポートは提出されていません。",
    "noActivity": "この期間のアクティビティはありません。",
    "runs": "最近の実行",
    "noRuns": "この期間の実行はありません。",
    "openTrail": "トレイルを開く"
   },
   "chartLayout": {
    "label": "組織図の表示",
    "tree": "ツリー",
    "canvas": "キャンバス"
   },
   "templates": {
    "title": "テンプレートから新しい組織を作成",
    "open": "テンプレートから作成",
    "intro": "空の組織から始めるか、サンプルの組織を適用します。サンプルは擬似ハーネスで動くので、認証情報は不要です。",
    "apply": "テンプレートを適用",
    "create": "組織を作成",
    "preview": "作成内容を確認",
    "previewHint": "適用する前に作成内容を確認してください。マニフェストをドライランで実行し、作成または変更されるものを一覧にします。",
    "contents_one": "このテンプレートのリソース: {{count}} 件",
    "contents_other": "このテンプレートのリソース: {{count}} 件",
    "ticks": "このテンプレートのキーパーは、適用から数秒で起動を始めます。",
    "blank": {
     "name": "空の組織",
     "body": "空の組織です。ルートの組織単位は [設計] タブで追加します。"
    },
    "gerbil": {
     "name": "Gerbil",
     "body": "1 つの組織単位に 1 つのキーパー。ステータスページを監視し、ページが落ちたままのときは人に確認します。"
    },
    "siteReliability": {
     "name": "サイト信頼性",
     "body": "公開サイトを見守る責任者 1 人とキーパー 3 つ。ピアライン、予算、メモリーキュレーターも含みます。"
    }
   }
  }
 }
});

// LP4.1 to LP4.4: the Learn page, its seven concept diagrams, the glossary, and the Explainer link to them.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "nav": {
  "learn": "学ぶ",
  "hubs": {
   "learn": {
    "label": "学ぶ",
    "tip": "Garrison の全体像を示す図、ツアー、用語集"
   }
  },
  "items": {
   "learn": {
    "label": "学ぶ",
    "tip": "Garrison の全体像を示す図、ツアー、用語集"
   }
  }
 },
 "learn": {
  "title": "学ぶ",
  "subtitle": "Garrison の各部分がどうつながるかを、図ごとに説明します。ボックスを選ぶとそのページが、角の本のアイコンを選ぶとガイドが開きます。",
  "toc": "このページの内容",
  "startTourNamed": "ツアー: {{tour}}",
  "showList": "リストで表示",
  "showDiagram": "図で表示",
  "openPage": "{{name}}。{{page}} を開きます。",
  "openDoc": "{{name}} について {{doc}} で読む",
  "glossaryTitle": "用語集",
  "glossaryIntro": "ドキュメントで使っている用語です。ダッシュボードの表記が異なる場合は、その旨を書いています。",
  "list": {
   "parts": "構成要素",
   "connections": "つながり",
   "connection": "{{from}} {{arrow}} {{to}}",
   "connectionLabelled": "{{from}} {{arrow}} {{to}}: {{label}}",
   "doc": "ガイド: {{doc}}"
  },
  "tours": {
   "firstLook": "はじめての画面",
   "runAnAgent": "エージェントを実行する",
   "followARequest": "リクエストを追う",
   "buildATeam": "チームを作る",
   "keepItSafe": "安全に保つ",
   "watchAnOrganization": "組織を見守る"
  },
  "diagrams": {
   "runtime": {
    "title": "ランタイム",
    "summary": "テナントには、エージェントとそれを実行するデプロイメントがあります。デプロイメントは、エージェントをハーネスプロファイル、モデル、プロンプト、ノードプールに結び付けます。リクエストはそれぞれ実行になり、そのプールのワーカーノードが実行を取得してハーネスを起動します。ワーカーはデータベースに触れません。必要なものはすべてリースと一緒に届きます。",
    "desc": "テナントには認証キー、エージェント、ハーネスプロファイル、デプロイメント、実行があります。ノードプールとワーカーノードは、テナント間で共有するフリートです。",
    "groups": {
     "tenant": "テナント",
     "fleet": "共有フリート"
    },
    "boxes": {
     "credential": {
      "title": "認証キー",
      "body": "ユーザーが所有するアクセスキー。呼び出し元とワーカーノードはこれでサインインします。"
     },
     "agent": {
      "title": "エージェント",
      "body": "REST、MCP、A2A で呼び出す対象。変更できないリビジョンを持ちます。"
     },
     "harnessProfile": {
      "title": "ハーネスプロファイル",
      "body": "ハーネスの CLI や API をヘッドレスで動かす方法。ダッシュボードでは接続と呼びます。"
     },
     "deployment": {
      "title": "デプロイメント",
      "body": "エージェントをハーネスプロファイル、モデル、プロンプト、ノードプールに結び付けます。"
     },
     "nodePool": {
      "title": "ノードプール",
      "body": "ワーカーノードのグループ。特定のテナント専用にもできます。"
     },
     "run": {
      "title": "実行",
      "body": "1 つのデプロイメント上でのエージェントの 1 回の実行。イベントと結果を持ちます。"
     },
     "node": {
      "title": "ワーカーノード",
      "body": "処理できる実行を取得し、それぞれのハーネスを起動します。"
     }
    },
    "arrows": {
     "invokes": "呼び出す",
     "runsOn": "で動く",
     "usedBy": "が使う",
     "targets": "指定",
     "creates": "作成",
     "groups": "まとめる",
     "leases": "リース"
    }
   },
   "request": {
    "title": "リクエストの流れ",
    "summary": "エージェントを起動する方法はどれも、同じ場所にたどり着きます。REST、MCP、A2A は 1 つの呼び出し処理を共有し、デプロイメントを選んだうえで、凍結、単位の予算、キュー上限のどれにもかからないときだけ実行を受け付けます。ワーカーがキュー内の実行を取得し、コンパイル済みの仕様を受け取ってハーネスを起動します。出力はイベントとして戻り、呼び出し元が結果を受け取ります。",
    "desc": "リクエストは呼び出し元から REST、MCP、A2A を経て実行の受付とキューに進みます。ワーカーがリースしてハーネスを起動し、出力がイベントと応答として戻ります。",
    "groups": {
     "controlPlane": "コントロールプレーン",
     "worker": "ワーカーノード上"
    },
    "boxes": {
     "caller": {
      "title": "呼び出し元",
      "body": "人、SDK、MCP クライアント、または A2A エージェント。"
     },
     "surface": {
      "title": "REST、MCP、A2A",
      "body": "3 つとも同じ呼び出し処理を通り、エージェントに対する Execute を確認します。"
     },
     "admission": {
      "title": "実行の受付",
      "body": "デプロイメントを選び、凍結、単位の予算、キュー上限を確認します。拒否された実行は作成されません。"
     },
     "queued": {
      "title": "キュー待ち",
      "body": "合うハーネス、ノードプール、ラベルを持つワーカーを待ちます。"
     },
     "lease": {
      "title": "リース",
      "body": "ワーカーはロングポーリングし、compare-and-set で実行を取得して、コンパイル済みの仕様を受け取ります。"
     },
     "harness": {
      "title": "ハーネス",
      "body": "仕様の引数、ファイル、MCP サーバーで起動する CLI またはプロバイダー API。"
     },
     "events": {
      "title": "イベント",
      "body": "解析済みの出力をまとめて送ります: テキスト、ツール呼び出し、使用量、結果。"
     },
     "reply": {
      "title": "応答",
      "body": "待機中の呼び出しは実行を返します。ストリームは最後のイベントを受け取ります。"
     }
    },
    "arrows": {
     "sends": "リクエスト",
     "admitted": "受付",
     "leased": "リース",
     "starts": "起動",
     "returns": "結果"
    }
   },
   "autonomy": {
    "title": "自律運用の構成要素",
    "summary": "キーパーは、常設の仕事を持つエージェントで、その仕事は職務として書かれています。Garrison はスケジュールに従ってキーパーを起動し、起動 1 回が 1 ティックです。ティックは通常の実行 1 回で、キーパーが見つけたことを報告して終わります。その途中で、後のティックのために記憶を残し、上長へのレポートを提出し、自分だけで答えるべきでない質問をエスカレーションできます。回答が届くと、キーパーは再び起動します。",
    "desc": "キーパーは職務を持ち、その起動スケジュールがティックを開始します。ティックごとにキーパーの実行が始まり、メモリへの書き込み、レポートの提出、エスカレーションを行います。回答されたエスカレーションはキーパーを再び起動します。",
    "boxes": {
     "keeper": {
      "title": "キーパー",
      "body": "常設の仕事を持つエージェント。API ではこのレコードを mandate と呼びます。"
     },
     "mandate": {
      "title": "職務",
      "body": "公開済みのリビジョン: 目的、健全な状態の定義、自律の範囲、エスカレーション方針。"
     },
     "schedule": {
      "title": "起動スケジュール",
      "body": "バックオフ付きの最小と最大の間隔。リーダーが期限の来た起動を 1 回だけ取得します。"
     },
     "tick": {
      "title": "ティック",
      "body": "1 回の起動。起動元と結果 (異常なし、対応済み、要確認、エスカレーション済み) を記録します。"
     },
     "run": {
      "title": "キーパーの実行",
      "body": "職務のデプロイメント上の種類 Keeper の実行。ティックを報告して終わります。"
     },
     "memory": {
      "title": "メモリ",
      "body": "recall タグの付いたエントリーが、次のティックの入力に戻ってきます。"
     },
     "report": {
      "title": "レポート",
      "body": "上に向けて提出します。上長の次のティックがダイジェストで読みます。"
     },
     "escalation": {
      "title": "エスカレーション",
      "body": "人、ロール、または別のエージェントへの質問。"
     }
    },
    "arrows": {
     "holds": "持つ",
     "sets": "設定",
     "comesDue": "期限到来",
     "starts": "開始",
     "writes": "書く",
     "files": "提出",
     "raises": "起こす",
     "answerWakes": "回答で起動"
    }
   },
   "teams": {
    "title": "チーム",
    "summary": "エージェントはメールボックスを通じて互いに書き送ります。メッセージは電話ではなく郵便です。送り手は作業を続け、受け手は次の実行で読みます。緊急のメッセージならすぐに読みます。送信はすべて最初にループ防止のチェックを通り、拒否されたメッセージも理由付きで残るので、誰が誰に連絡しようとしたかを確認できます。",
    "desc": "メッセージはループ防止のチェックを通って受け手のメールボックスに入るか、拒否として保存されます。通常のメールは受け手の次の実行を待ち、緊急のメールは受け手を起動します。",
    "boxes": {
     "sender": {
      "title": "送り手",
      "body": "エージェントの実行、または人。エージェントはラインに沿ってのみ書き送れます。"
     },
     "guards": {
      "title": "ループ防止",
      "body": "順番に: 受信者が凍結中、ラインなし、ホップ上限、スレッド上限、ライン送信レート。"
     },
     "mailbox": {
      "title": "メールボックス",
      "body": "受け手のキューにあるメッセージ。古い順です。"
     },
     "normal": {
      "title": "通常の配信",
      "body": "キーパーの次のティック、または受信箱を読む実行を待ちます。"
     },
     "rejected": {
      "title": "拒否",
      "body": "理由と一緒に保存され、配信されません。"
     },
     "urgent": {
      "title": "緊急の起動",
      "body": "キーパーの次の起動を前倒しします。キーパーがなければ Message の実行を開始します。"
     },
     "recipient": {
      "title": "受け手の実行",
      "body": "届いたものをすべて 1 回の実行で運ぶので、メッセージ 10 通でもティックは 1 回です。"
     }
    },
    "arrows": {
     "sends": "送信",
     "passes": "通過",
     "refused": "拒否",
     "normal": "通常",
     "urgent": "緊急",
     "nextRun": "次の実行",
     "wakes": "すぐ起動"
    }
   },
   "organization": {
    "title": "組織",
    "summary": "組織はエージェントのグループに形を与えます。組織単位のツリーで、各単位には責任者、メンバー、任意のピアライン、予算があります。ルート単位の責任者が CEO で、その上に組織を運営する人々であるボードがいます。編集は誰も読まない作業ツリーに入ります。リビジョンを公開すると有効になり、それ以降はメッセージ、レポート、メモリ、エスカレーション、凍結、予算がすべて同じ指揮系統を参照します。",
    "desc": "ボードはルート単位を監督し、その責任者が CEO です。下の単位はレポートラインでつながり、ピアラインは単位どうしを横につなぎます。作業ツリーはリビジョンの公開で有効になり、指揮系統は公開中のリビジョンだけを読みます。",
    "groups": {
     "live": "公開中のリビジョン"
    },
    "boxes": {
     "board": {
      "title": "ボード",
      "body": "組織を運営する人々。CEO の上に位置します。"
     },
     "root": {
      "title": "ルート単位",
      "body": "責任者が CEO です。その予算がツリー全体の上限になります。"
     },
     "unitA": {
      "title": "組織単位",
      "body": "責任者 1 名、メンバー最大 200 名、日次と月次の予算。"
     },
     "unitB": {
      "title": "ピアの組織単位",
      "body": "ピアラインは 2 つの単位のエージェント全員を双方向につなぎます。"
     },
     "working": {
      "title": "作業ツリー",
      "body": "人が単位を編集する場所。実行時には誰も読みません。"
     },
     "revision": {
      "title": "公開済みリビジョン",
      "body": "変わらないスナップショット。ロールバックは以前のもののコピーを公開します。"
     },
     "chain": {
      "title": "指揮系統",
      "body": "上長、上位の系列、サブツリー、ライン。公開中のリビジョンだけから求めます。"
     }
    },
    "arrows": {
     "oversees": "監督",
     "reportsA": "レポートライン",
     "peer": "ピアライン",
     "publish": "公開",
     "readBy": "参照"
    }
   },
   "selfRevision": {
    "title": "自己改訂",
    "summary": "エグゼクティブは、配下の単位への変更を提案できる単位の責任者です。通常のスタジオの下書きを書き、ExecutiveDraftValidator がそれを誰にも解除できない厳格な制限に照らして確認します。自分自身に関すること、サブツリーより上や外にあるもの、シークレット、予算の引き上げ、管理アクセスには触れられません。人が書いた変更ルールがすべてを網羅する下書きはすぐに適用されます。それ以外は人を待ちます。適用のたびに組織のリビジョンが 1 つ公開され、元に戻す下書きが保存されるので、1 回のロールバックで取り消せます。",
    "desc": "エグゼクティブが下書きを書きます。厳格な制限で拒否されるか、変更ルールに渡されます。変更ルールは評価ゲートで止められることがあります。網羅された下書きは適用され、それ以外はシャドートライアルとカナリアリリースの結果を見る人を待ちます。適用ごとに元に戻す下書き付きの組織リビジョンが公開され、ロールバックで復元できます。",
    "boxes": {
     "executive": {
      "title": "エグゼクティブ",
      "body": "デプロイメントが自分の単位より下の変更を下書きできる単位の責任者。"
     },
     "draft": {
      "title": "下書き",
      "body": "通常のスタジオの下書き。人は提案として追跡します。"
     },
     "limits": {
      "title": "厳格な制限",
      "body": "差分時、申請時、適用直前に確認します。どのルールや承認でも解除できません。"
     },
     "refused": {
      "title": "拒否",
      "body": "申請は DraftInvalid で失敗し、何も変わりません。"
     },
     "eval": {
      "title": "評価ゲート",
      "body": "エグゼクティブは自分の下書きに評価セットを実行します。ゲート付きのルールには合格スコアが必要です。"
     },
     "rules": {
      "title": "変更ルール",
      "body": "人だけが書きます。各変更をクラスに分類し、ルールと照合します。"
     },
     "person": {
      "title": "人が判断",
      "body": "どのルールも網羅しない変更は、ほかの下書きと同じく待ちます。"
     },
     "apply": {
      "title": "適用",
      "body": "実行を始めた人、または許可した人として適用します。"
     },
     "evidence": {
      "title": "シャドートライアルとカナリア",
      "body": "人が開始します。結果は提案に表示され、カナリアは自動でロールバックします。"
     },
     "rollback": {
      "title": "ロールバック",
      "body": "以前のリビジョンを復元し、元に戻す下書きを新しい順に適用します。"
     },
     "revision": {
      "title": "組織のリビジョン",
      "body": "適用ごとに 1 つ。下書きを記録します。"
     },
     "revert": {
      "title": "元に戻す下書き",
      "body": "変更されたレコードの変更前の状態。"
     }
    },
    "arrows": {
     "writes": "書く",
     "checked": "確認",
     "breaks": "制限に違反",
     "passes": "通過",
     "gate": "スコア",
     "notCovered": "網羅外",
     "covered": "すべて網羅",
     "allows": "許可",
     "evidence": "根拠",
     "publishes": "公開",
     "saves": "保存",
     "restores": "復元"
    }
   },
   "brakes": {
    "title": "ブレーキ",
    "summary": "ブレーキはエージェントの協力に頼りません。凍結、緊急停止スイッチ、支出上限、単位の予算は、実行の受付時とキーパーの起動前にコントロールプレーンで確認されるので、拒否された実行は作成されません。実行トークンは凍結の権限を持たないため、エージェントが自分のブレーキを外すことはできません。すでに動いている作業には、単位内のすべてを取り消す操作を使い、予算を超えた単位は予算ガードに凍結させます。",
    "desc": "凍結、緊急停止スイッチ、支出上限、単位の予算は、実行の受付時とキーパーの起動前のチェックに使われ、新しい実行を拒否し、起動をスキップします。動いている作業については、すべて取り消すが単位のサブツリーを止め、予算ガードが超過した単位を凍結します。",
    "groups": {
     "newWork": "新しい作業を止める",
     "inFlight": "動いている作業を止める"
    },
    "boxes": {
     "freeze": {
      "title": "凍結",
      "body": "人が解除するまで、エージェント、デプロイメント、キーパー、アプリ、単位、組織を止めます。"
     },
     "killSwitch": {
      "title": "緊急停止スイッチ",
      "body": "テナント内のキーパーはどれも起動しません。通常の呼び出しは引き続き動きます。"
     },
     "spendCap": {
      "title": "支出上限",
      "body": "キーパーのティックごとと 1 日ごとの予算。1 日分を使い切ると CapReached になります。"
     },
     "unitBudget": {
      "title": "単位の予算",
      "body": "単位のサブツリーが実行するものすべてに対する日次または月次の上限。"
     },
     "checks": {
      "title": "受付時と起動時のチェック",
      "body": "エージェントではなくコントロールプレーンで行います。凍結はバックプレーン経由ですべてのレプリカに届きます。"
     },
     "refused": {
      "title": "拒否された実行",
      "body": "409 Frozen または BudgetExhausted。何も作成されません。"
     },
     "skipped": {
      "title": "スキップされた起動",
      "body": "コード付きのスキップされたティックとして記録され、スケジュールは先に進みます。"
     },
     "cancelAll": {
      "title": "すべて取り消す",
      "body": "単位のサブツリーの実行とティックを取り消し、エスカレーションを撤回し、メールを期限切れにします。凍結はしません。"
     },
     "autoFreeze": {
      "title": "自動凍結",
      "body": "サブツリーの支出が予算と余裕分を超えると、ガードが単位を凍結し、その実行を取り消します。"
     }
    },
    "arrows": {
     "refuses": "新しい実行",
     "skips": "キーパーの起動"
    }
   }
  },
  "glossary": {
   "tenant": {
    "term": "テナント",
    "def": "1 つの顧客のエージェント、実行、ユーザー、設定を囲む境界。テナントをまたぐ読み取りには 404 を返します。"
   },
   "agent": {
    "term": "エージェント",
    "def": "呼び出し元が呼び出すもの。設定は変更できないリビジョンに保存されます。"
   },
   "deployment": {
    "term": "デプロイメント",
    "def": "ハーネスプロファイル、モデル、プロンプト、ノードプールに結び付けたエージェント。1 つのエージェントが複数持てて、重みで選ばれます。"
   },
   "harnessProfile": {
    "term": "ハーネスプロファイル",
    "def": "ハーネスの CLI やプロバイダー API をヘッドレスで動かす方法。引数、プロンプトの渡し方、出力パーサーを決めます。ダッシュボードでは接続の下にあります。"
   },
   "nodePool": {
    "term": "ノードプール",
    "def": "デプロイメントが指定できるワーカーノードのグループ。特定のテナント専用にもできます。"
   },
   "node": {
    "term": "ワーカーノード",
    "def": "実行を取得してハーネスを起動するプロセス。データベースには触れません。"
   },
   "run": {
    "term": "実行",
    "def": "エージェントの 1 回の実行。キーパーのティック、メッセージによる起動、評価ケース、シャドーのコピーは、それぞれ独自の種類の実行です。"
   },
   "runToken": {
    "term": "実行トークン",
    "def": "各実行が Garrison の MCP ツール用に受け取る認証情報。凍結の権限は持ちません。"
   },
   "keeper": {
    "term": "キーパー",
    "def": "常設の仕事を持ち、Garrison がスケジュールに従って起動するエージェント。API では mandate と呼びます。"
   },
   "tick": {
    "term": "ティック",
    "def": "キーパーの 1 回の起動。結果と要約を報告して終わる 1 回の実行です。"
   },
   "message": {
    "term": "メッセージ",
    "def": "エージェントから別のエージェント、または人からのメール。送り手は返事を待ちません。"
   },
   "line": {
    "term": "ライン",
    "def": "エージェントが別のエージェントに書き送れる経路。アプリのエッジ、レポートライン、ピアライン、スレッド内の返信です。"
   },
   "loopGuards": {
    "term": "ループ防止",
    "def": "各メッセージのチェック。受信者の凍結、ラインなし、ホップ上限、スレッド上限、ライン送信レートです。"
   },
   "report": {
    "term": "レポート",
    "def": "エージェントが上の人やエージェントに仕事の進み具合を伝える手段。提出後は変わりません。"
   },
   "memory": {
    "term": "メモリ",
    "def": "エージェントが実行をまたいで残すテキスト。エージェント、アプリ、組織単位、組織のいずれかのスコープに入ります。"
   },
   "escalation": {
    "term": "エスカレーション",
    "def": "実行が自分だけで決めるべきでないときに出す質問。人、ロール、または別のエージェントが答えます。"
   },
   "organization": {
    "term": "組織",
    "def": "エージェントのグループに形を与える組織単位のツリー。人がリビジョンを公開するまで何も有効になりません。"
   },
   "unit": {
    "term": "組織単位",
    "def": "ツリーの 1 つのノード。責任者、メンバー、ピアライン、予算を持ちます。"
   },
   "board": {
    "term": "ボード",
    "def": "組織を運営する人々。CEO の上に位置します。"
   },
   "chain": {
    "term": "指揮系統",
    "def": "誰が誰を管理するか。有効な組織の公開済みリビジョンだけから読み取ります。"
   },
   "executive": {
    "term": "エグゼクティブ",
    "def": "厳格な制限の範囲内で、配下の単位への変更を提案できる単位の責任者。"
   },
   "changeRule": {
    "term": "変更ルール",
    "def": "エグゼクティブによる狭い種類の変更に対する、人からの継続的な許可。人だけが書きます。"
   },
   "evalSet": {
    "term": "評価セット",
    "def": "チェック付きの固定入力。評価実行がエージェントのリビジョンやデプロイメントを採点します。"
   },
   "shadowTrial": {
    "term": "シャドートライアル",
    "def": "実際の入力の一部を、何の影響も起こせない候補のデプロイメントにコピーし、回答を比べます。"
   },
   "canary": {
    "term": "カナリアリリース",
    "def": "トラフィックを段階的に候補のデプロイメントへ移し、エラー率や評価スコアが基準を超えるとロールバックします。"
   },
   "freeze": {
    "term": "凍結",
    "def": "人が解除するまで、対象の新しい実行を止めます。"
   },
   "killSwitch": {
    "term": "緊急停止スイッチ",
    "def": "テナント全体の自律運用の凍結。キーパーは起動せず、通常の呼び出しは動き続けます。"
   },
   "unitBudget": {
    "term": "単位の予算",
    "def": "単位のサブツリーが使える金額の日次または月次の上限。"
   }
  }
 },
 "components": {
  "explainer": {
   "seeDiagram": "図を見る"
  }
 }
});

// The organization designer's checks (LP3.7): errors and warnings, and every code of the validate route.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "orgDesigner": {
   "problems": {
    "errors_one": "エラー: {{count}} 件",
    "errors_other": "エラー: {{count}} 件",
    "warnings_one": "警告: {{count}} 件",
    "warnings_other": "警告: {{count}} 件",
    "warningsOnly": "残っているのは警告だけなので、作業ツリーはこのまま公開できます。",
    "OneRoot": "組織に {{unit}} を含む複数のルートの組織単位があります。",
    "Cycle": "{{unit}} が自分自身の配下にあります。",
    "UnitNameTaken": "{{unit}} という名前の組織単位が 2 つあります。",
    "TooManyUnits": "組織単位の数が上限を超えています。",
    "TooManyMembers": "{{unit}} のメンバー数が上限を超えています。",
    "TooManyPeerLines": "{{unit}} のピアライン数が上限を超えています。",
    "BudgetPeriodTaken": "{{unit}} に同じ期間の予算が 2 つあります。",
    "BudgetInvalid": "{{unit}} の予算に無効な金額があります。",
    "AgentInactive": "{{unit}} の {{agent}} は有効ではありません。",
    "MandateMismatch": "{{unit}} のキーパー {{mandate}} は {{agent}} のものではありません。"
   }
  }
 }
});

// The organization designer (LP3.9): the one-day activity line, without a count placeholder.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "orgDesigner": {
   "overlay": {
    "activity_one": "直近 1 日で実行 {{runs}} 件、エスカレーション {{escalations}} 件、{{cost}}"
   }
  }
 }
});

// LP4.5 to LP4.9: the guided tours (engine, list, sample data offer, Home card, wizard next step); the trail's
// entry surfaces and the Shadowed and Delivered edges (LP1.12, LP1.13); the kill switch also refuses message wakes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "tours": {
  "ui": {
   "finding": "次のステップを探しています...",
   "skippedMissing": "{{step}} は今このページにないため、スキップしました。",
   "skippedNoRecord": "{{step}} をスキップしました。このテナントにはまだ表示するものがありません。",
   "endTitle": "ツアーの終わり",
   "endBody": "{{tour}} はこれで終わりです。学ぶページか、サイドバーのガイドツアーからいつでももう一度見られます。"
  },
  "hub": {
   "label": "{{tour}} ツアーを開始"
  },
  "picker": {
   "title": "ガイドツアー",
   "intro": "どのツアーも、ひとつの作業について実際のページを数ステップずつ案内します。終えたツアーには印が付き、どれでももう一度見られます。",
   "start": "開始",
   "replay": "もう一度",
   "finished": "完了済み",
   "learn": "学ぶを開く",
   "steps_one": "{{count}} ステップ",
   "steps_other": "{{count}} ステップ"
  },
  "sample": {
   "title": "サンプルを読み込みますか?",
   "body": "{{tour}} には{{need}}が必要ですが、このテナントにはまだありません。マニフェストの適用で{{example}}を読み込むか、読み込まずに続けて表示するもののないステップを飛ばせます。",
   "contents_one": "読み込むと {{count}} 件のリソースが適用されます:",
   "contents_other": "読み込むと {{count}} 件のリソースが適用されます:",
   "checking": "適用で何が変わるかを確認しています...",
   "fake": "すべてフェイクハーネスで動くので、認証情報は不要で費用もかかりません。キーパーは数秒以内に起動し始めます。",
   "runsLater": "実行のステップには実行が必要です。適用の数秒後、最初のキーパーのティックが実行を作ります。",
   "load": "サンプルを読み込む",
   "loading": "読み込み中...",
   "continue": "読み込まずに続ける",
   "loaded": "{{example}}を読み込みました。",
   "needs": {
    "agents": "エージェント",
    "runs": "実行",
    "keepers": "キーパー",
    "organizations": "組織"
   },
   "examples": {
    "gerbil": "gerbil のサンプル",
    "siteReliability": "サイト信頼性のサンプル"
   }
  },
  "homeCard": {
   "title": "はじめてですか? 学ぶから始めましょう",
   "body": "学ぶページでは、Garrison の各部分のつながりを図で示し、実際のページを案内する短いツアーも用意しています。",
   "open": "学ぶを開く",
   "dismiss": "閉じる"
  },
  "wizard": {
   "nextTitle": "次にすること",
   "nextBody": "学ぶページでは各部分のつながりを説明しています。エージェントを実行するツアーは、同じ流れをダッシュボード上でたどります。",
   "learn": "学ぶを開く",
   "tour": "エージェントを実行するツアーを始める"
  },
  "firstLook": {
   "summary": "サイドバー、上部バー、ホーム、そしてヘルプの場所。",
   "steps": {
    "sidebar": {
     "title": "ナビゲーション",
     "body": "このサイドにすべてがハブごとにまとまっています。ハブのページは上部にタブとして並び、タブごとにリンクがあります。"
    },
    "topbar": {
     "title": "今いる場所",
     "body": "上部バーには、作業中のサーバーとテナント、サインイン中のユーザー、サーバーが正常か、更新がライブで届いているかが表示されます。"
    },
    "kpis": {
     "title": "ひと目で",
     "body": "今の状況です。エージェント、デプロイメント、今日の実行中と失敗した実行、仕事を受けられるワーカーノードを示します。カードをクリックすると、その一覧が開きます。"
    },
    "invoke": {
     "title": "呼び出し",
     "body": "エージェントを試すいちばん早い方法です。エージェントを選んでメッセージを送ると、回答がストリーミングで表示されます。"
    },
    "autonomy": {
     "title": "自分で動くエージェント",
     "body": "エージェントに常設の仕事を与えると、頼まれなくても動きます。キーパーがスケジュールどおりに起こし、その合間に他のエージェントへメッセージを送り、レポートを提出し、学んだことを記憶し、あなたに質問をエスカレーションできます。凍結すれば、すべてをすぐに止められます。"
    },
    "organizations": {
     "title": "組織",
     "body": "チームを組むようにエージェントをユニットに配置します。リーダー、メンバー、予算を決めます。ボードで各ユニットの状況がわかり、変更ルールで、ユニットの幹部があなたに確認せずに行える変更が決まります。"
    },
    "help": {
     "title": "ヘルプ",
     "body": "セットアップウィザードは初回設定をやり直し、ガイドツアーは全ツアーを一覧にし、学ぶは全体のつながりを図で示します。ページの ? ボタンはそのページのツアーを始めます。"
    }
   }
  },
  "runAnAgent": {
   "summary": "接続からエージェント、デプロイメント、呼び出し、そしてできあがる実行まで。",
   "steps": {
    "connections": {
     "title": "接続",
     "body": "接続は、エージェントの裏で動くエンジンの起動方法を Garrison に伝えます。Claude Code や Codex など、どの CLI や API をどんな設定で起動するかです。一度設定すれば、どのデプロイメントでも使えます。"
    },
    "agents": {
     "title": "エージェント",
     "body": "エージェントは、呼び出し側が REST、MCP、A2A で名前を指定して呼ぶ相手で、回答の形も決めます。デプロイメントがあるまでは何も実行しません。"
    },
    "deployments": {
     "title": "デプロイメント",
     "body": "デプロイメントは実際に動く部分です。1 つのエージェントの接続、モデル、プロンプト、上限をまとめます。デプロイメントが 2 つあると呼び出しは重みで振り分けられ、新しいモデルを一部のトラフィックで試せます。"
    },
    "invoke": {
     "title": "呼び出し",
     "body": "エージェントを選び、必要なら特定のデプロイメントも選んで、メッセージを入力し送信を押します。出力はフォームの横に流れてきます。"
    },
    "run": {
     "title": "実行",
     "body": "呼び出しはそれぞれひとつの実行です。そのページの上部に状態と ID があり、トランスクリプト、結果、入力などのタブが並びます。"
    },
    "trail": {
     "title": "トレイルタブ",
     "body": "トレイルは、リクエストがすべてのエージェントを通って返答に戻るまでを追います。詳しくはリクエストを追うツアーで。"
    }
   }
  },
  "followARequest": {
   "summary": "実行のトレイルタブ。3 つのビュー、合計、各ステップの詳細。",
   "steps": {
    "views": {
     "title": "3 つのビュー",
     "body": "シーケンスはエージェントごとにレーンを分け、時間が下へ流れます。グラフは各ステップを原因の後ろに並べます。一覧は各ステップを絞り込める行で表示します。"
    },
    "summary": {
     "title": "合計",
     "body": "参加したエージェントの数、エージェント間のメッセージの数、かかった時間、トークンと費用、失敗したステップの数です。"
    },
    "steps": {
     "title": "ステップ",
     "body": "各ボックスがひとつのステップです。実行、メッセージ、レポート、エスカレーション、承認、ツール呼び出しのいずれかです。矢印キーで移動し、Enter で開きます。"
    },
    "drawer": {
     "title": "ステップの詳細",
     "body": "ドロワーにはステップの状態、時刻、費用が表示されます。エージェントが書いたテキストは、書いた人と一緒にただのデータとして表示され、記録を開くで記録全体に移れます。"
    },
    "actions": {
     "title": "更新とエクスポート",
     "body": "実行中のステップがある間、トレイルはここで選んだ間隔で更新されます。JSON をエクスポートすると、エージェントが書いたテキストを含まないステップとリンクをダウンロードできます。"
    }
   }
  },
  "buildATeam": {
   "summary": "組織の設計タブ。キャンバス、メンバー、キーパー、予算、公開。",
   "steps": {
    "canvas": {
     "title": "キャンバス",
     "body": "各ボックスがユニットです。上部にリーダーとメンバーがあり、その中に報告するユニットが入ります。ボックス同士を結ぶ線はピアラインで、2 つのユニットが直接メッセージをやり取りできます。"
    },
    "palette": {
     "title": "メンバー",
     "body": "この一覧からエージェントをユニットにドラッグするか、エージェントを選んでからユニットと、率いるか加わるかを選びます。"
    },
    "keepers": {
     "title": "キーパー",
     "body": "ユニットを選ぶと、このタブにそのユニットでキーパーを持つ人が並びます。キーパーを付けたり、新しく作ったり、起動のタイミングを変えたりできます。"
    },
    "budget": {
     "title": "予算",
     "body": "ユニットに日単位か月単位の上限を設定します。そのユニットと下にあるすべてのユニットが実行するものが対象です。"
    },
    "publish": {
     "title": "公開",
     "body": "変更はすぐに作業ツリーに保存されますが、ここで公開するまでは反映されません。リビジョンはすべて残るので、元に戻せます。"
    }
   }
  },
  "keepItSafe": {
   "summary": "ブレーキ。緊急停止スイッチ、凍結、支出上限、変更ルール、承認。",
   "steps": {
    "killSwitch": {
     "title": "緊急停止スイッチ",
     "body": "オンにすると、テナントのキーパーはどれも起動せず、メッセージでエージェントが起動することもありません。通常の呼び出しはそのまま動きます。"
    },
    "freezes": {
     "title": "凍結",
     "body": "凍結は、人が解除するまでエージェント、デプロイメント、キーパー、アプリの新しい実行を拒否します。ユニットや組織全体はボードから凍結します。"
    },
    "spendCaps": {
     "title": "支出上限",
     "body": "キーパーにはティックごとと 1 日ごとの予算を設定できます。その日の予算を使い切ると、次の UTC の日まで止まり、あなたに緊急のエスカレーションを送ります。"
    },
    "changeRules": {
     "title": "変更ルール",
     "body": "ルールは、幹部が配下のユニットで行える定型的な変更をあらかじめ承認します。ルールを書けるのは人だけで、ルールにない変更は人の判断を待ちます。"
    },
    "approvals": {
     "title": "承認",
     "body": "ツール呼び出しの前に確認するデプロイメントでは、人の判断が必要な呼び出しがここで待ちます。それぞれ許可か拒否を選び、必要なら答えをルールとして残せます。"
    }
   }
  },
  "watchAnOrganization": {
   "summary": "組織のボード、パフォーマンス、レポート、エスカレーション。",
   "steps": {
    "board": {
     "title": "ボード",
     "body": "組織の状況を見るならここから始めます。各ユニットについて、最新レポートによる健全性、未解決のエスカレーション、かかっているブレーキ、最新のレポートを、組織図と表で示します。"
    },
    "attention": {
     "title": "要対応",
     "body": "今、人の対応が必要なものです。未解決のエスカレーション、不健全なレポート、予算上限に達したユニット。まずこの一覧を片付けてください。"
    },
    "performance": {
     "title": "パフォーマンス",
     "body": "選んだ期間でユニットを比較します。実行、結果、コスト、レイテンシー、エスカレーション。エスカレーションが多いユニットや、他よりコストがかかるユニットが見るべきところです。"
    },
    "reports": {
     "title": "レポート",
     "body": "実行や人が状況について提出したものです。提出したレポートは変更できず、本文は指示ではなくデータとして表示されます。"
    },
    "escalations": {
     "title": "エスカレーション",
     "body": "エージェントが人、ロール、または別のエージェントに向けて出した質問です。未解決のものが先に並びます。ここで回答すると、質問したエージェントに届きます。"
    }
   }
  }
 },
 "trail": {
  "entrySurfaces": {
   "Rest": "REST API",
   "Mcp": "MCP",
   "A2a": "A2A",
   "App": "アプリ",
   "Dashboard": "ダッシュボード",
   "Trigger": "トリガー",
   "Keeper": "キーパー",
   "Message": "メッセージ",
   "Escalation": "エスカレーション",
   "Eval": "評価",
   "Shadow": "シャドー",
   "Internal": "内部"
  },
  "columns": {
   "entrySurface": "受付経路"
  },
  "drawer": {
   "fields": {
    "entrySurface": "受付経路"
   }
  },
  "edges": {
   "Shadowed": "シャドー実行",
   "Delivered": "配達"
  }
 },
 "learn": {
  "diagrams": {
   "brakes": {
    "boxes": {
     "killSwitch": {
      "body": "テナントのキーパーはどれも起動せず、メッセージでエージェントが起動することもありません。通常の呼び出しはそのまま動きます。"
     }
    }
   }
  },
  "glossary": {
   "killSwitch": {
    "def": "テナント全体の自律運用の凍結です。キーパーは起動せず、メッセージでエージェントが起動することもありませんが、通常の呼び出しはそのまま動きます。"
   }
  }
 }
});

(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "turnActivity": {
   "worker": "ワーカーを待っています",
   "approval": "承認を待っています",
   "tool": "{{tool}} を実行中",
   "working": "次のステップに取り組んでいます",
   "quiet": "{{time}} 新しい出力がありません。実行はまだ{{status}}です。"
  }
 }
});

// App appearance (LP8.4): the appearance step, palettes, starter prompts, and the preview.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "resources": {
  "apps": {
   "steps": {
    "appearance": "外観"
   },
   "fields": {
    "appearance": "外観",
    "subtitle": "サブタイトル",
    "welcomeTitle": "ようこそのタイトル",
    "composerPlaceholder": "メッセージ欄のプレースホルダー",
    "agentDisplayName": "メッセージに表示するエージェント名",
    "agentAvatarAssetId": "エージェントのアバター",
    "paletteId": "パレット",
    "themeDefault": "既定のテーマ",
    "allowThemeSwitch": "ライトとダークの切り替えを許可",
    "cornerStyle": "角の形",
    "density": "表示密度",
    "showFilesPanel": "ファイル一覧を表示",
    "showLanguagePicker": "言語の選択を表示",
    "showPoweredBy": "プラットフォームの表記を表示",
    "starterPrompts": "最初の質問の候補"
   },
   "hints": {
    "subtitle": "ヘッダーとようこそ画面で名前の下に出る短い一行です。200 文字まで。",
    "welcomeTitle": "最初のメッセージの前に出る見出しです。空なら表示名を使います。120 文字まで。",
    "composerPlaceholder": "空のメッセージ欄に出る灰色の文字です。120 文字まで。",
    "agentDisplayName": "回答の送り主として出る名前です。空なら表示名を使います。80 文字まで。",
    "agentAvatarAssetId": "各回答のエージェント名の横に出る小さな丸い画像です。",
    "starterPrompts": "新しい会話に最大 4 つのボタンとして出ます。クリックすると最初のメッセージとして送信されます。",
    "allowThemeSwitch": "オフにするとライトとダークのボタンが消え、以前保存された選択も無視されます。"
   },
   "noAvatar": "アバターなし",
   "placeholders": {
    "subtitle": "例: 調査チームがお答えします"
   }
  }
 },
 "enums": {
  "appThemeDefault": {
   "System": "システムに合わせる",
   "Light": "ライト",
   "Dark": "ダーク"
  },
  "appCornerStyle": {
   "Sharp": "四角",
   "Rounded": "角丸",
   "Pill": "ピル型"
  },
  "appDensity": {
   "Compact": "コンパクト",
   "Comfortable": "ゆったり"
  }
 },
 "components": {
  "appAppearance": {
   "sections": {
    "text": "テキスト",
    "images": "画像",
    "colors": "色",
    "layout": "テーマとレイアウト",
    "show": "ページに表示するもの",
    "prompts": "最初の質問の候補",
    "preview": "プレビュー"
   },
   "palettes": {
    "garrison": "Garrison ティール",
    "slate": "スレート",
    "ocean": "オーシャン",
    "forest": "フォレスト",
    "sunset": "サンセット",
    "plum": "プラム",
    "graphite": "グラファイト",
    "contrast": "ハイコントラスト",
    "custom": "カスタム",
    "none": "組み込みの色"
   },
   "paletteCurrent": "パレット: {{name}}",
   "resetColors": "組み込みの色に戻す",
   "columns": {
    "role": "色",
    "light": "ライト",
    "dark": "ダーク"
   },
   "derived": "ライトから算出",
   "sameAsLight": "ライトと同じ",
   "builtIn": "組み込みのダークの色",
   "contrastWarning": "文字のコントラスト {{ratio}}:1、AA の最低 4.5:1 を下回ります",
   "darkLabel": "{{field}}（ダークテーマ）",
   "image": {
    "upload": "画像をアップロード",
    "uploading": "アップロード中...",
    "uploaded": "アセット {{name}} としてアップロードしました。",
    "notImage": "画像ファイル (PNG、JPEG、GIF、WebP、SVG、ICO) を選んでください。",
    "assetDescription": "アプリ {{app}} の{{role}}。アプリエディターからアップロード。"
   },
   "prompts": {
    "count": "{{max}} 件中 {{count}} 件",
    "chars": "{{count}}/{{max}} 文字",
    "label": "質問の候補 {{number}}",
    "placeholder": "例: 今週の更新をまとめて",
    "empty": "質問の候補はまだありません。空のメッセージ欄から始まります。",
    "keys": "質問の欄で Alt+上 と Alt+下 を押すと移動します。",
    "add": "質問を追加",
    "moveUp": "質問 {{number}} を上へ",
    "moveDown": "質問 {{number}} を下へ",
    "remove": "質問 {{number}} を削除"
   },
   "preview": {
    "appName": "あなたのアプリ",
    "welcomeDefault": "質問して始めましょう。",
    "light": "ライト",
    "dark": "ダーク",
    "you": "あなた",
    "question": "今週は何が変わりましたか?",
    "answer": "今週の変更を短くまとめました。",
    "placeholder": "メッセージを入力",
    "poweredBy": "Garrison Agent Studio で構築",
    "note": "変更に合わせて動くアプリページの略図です。実際のページはアプリのリンクで確認してください。"
   }
  }
 }
});

// Shared tables and states (LP5.5): the default-view empty message, the load error status, and row labels.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "table": {
   "noneInDefaultView": "既定のビューには何もありません。ビューの外に他のレコードがあります。",
   "showAll": "すべて表示",
   "errorStatus": "ステータス {{status}}。"
  }
 },
 "resources": {
  "runs": {
   "emptyAction": "エージェントを呼び出す"
  }
 },
 "views": {
  "organizationDetail": {
   "revisionLabel": "リビジョン {{number}}"
  }
 },
 "evals": {
  "setDetail": {
   "caseLabel": "ケース {{order}}"
  }
 }
});

// LP5.5 trail and runs fixes (UXP1-V010, V011, V037, V040, S001, S006, S010, S024).
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "trail": {
  "moreLanes": "{{count}} 本のレーン: 横にスクロールするとすべて表示されます",
  "moreSteps": "この下にもステップがあります: 下にスクロールしてください",
  "narrowGraph": "グラフには幅 768 ピクセル以上の画面が必要なため、ここでは同じステップを一覧で表示しています。",
  "narrowSequence": "シーケンス表示には幅 768 ピクセル以上の画面が必要なため、ここでは同じステップを一覧で表示しています。",
  "replyTo": "{{name}} への応答",
  "replyToCaller": "呼び出し元への応答",
  "replyFinished": "(ルート実行が終了)",
  "drawer": {
   "texts": {
    "reply": "呼び出し元が受け取った応答"
   },
   "fields": {
    "caller": "呼び出し元",
    "outcome": "結果",
    "exitCode": "終了コード"
   },
   "failureTitle": "このステップが失敗した理由",
   "noErrorMessage": "サーバーはこの実行のエラーメッセージを記録していません。実行を開いて記録と標準エラーを確認してください。",
   "replyNote": "{{name}} はルート実行が終了した時点でこの応答を受け取りました。その後に並ぶステップは、呼び出し元を待たせずに続きました。",
   "openReplyingRun": "ルート実行を開く"
  }
 },
 "views": {
  "runDetail": {
   "failure": {
    "title": "この実行が失敗した理由",
    "titleOutcome": "この実行が失敗した理由: {{outcome}}",
    "errorEvent": "記録内の最後のエラー (イベント #{{sequence}})",
    "serverError": "サーバーが記録したエラー",
    "noError": "エラーメッセージは記録されていません。記録と標準エラーに手がかりがあるかもしれません。",
    "exitCode": "ハーネスはコード {{code}} で終了しました。",
    "stderrLines_one": "標準エラーには {{count}} 行あります。",
    "stderrLines_other": "標準エラーには {{count}} 行あります。",
    "noStderr": "標準エラーは取得されていません。",
    "showError": "記録内のエラーを表示",
    "showStderr": "標準エラーを開く",
    "openDeployment": "デプロイメントを開く"
   },
   "templatesCount_one": "テンプレート {{count}} 件",
   "templatesCount_other": "テンプレート {{count}} 件",
   "telemetryToggle": "時間、トークン、コスト ({{duration}}、{{cost}})",
   "resultRaw": "生のテキストを表示",
   "resultFormatted": "整形して表示"
  }
 },
 "resources": {
  "runs": {
   "columns": {
    "callerName": "呼び出し元"
   },
   "hops": {
    "message": "メッセージによるホップ",
    "fanOut": "ファンアウトのメンバー",
    "child": "子の実行"
   },
   "callerMessage": "メッセージ"
  }
 },
 "tours": {
  "sample": {
   "needs": {
    "trails": "複数のエージェントを経由したリクエスト"
   },
   "trailsLater": "トレイルのステップには、複数のエージェントを経由したリクエストが必要です。この例では、適用の数秒後の最初のティックで、レイテンシのキーパーが依存関係のキーパーにメッセージを送ります。"
  }
 }
});

// LP5.5 (UXP1-V002, S002, S013, S015, S016, S017, S025): the organization canvas tree, the read-only chart, board
// attention, the empty organization checks, the publish checks, and what the keeper budgets enforce.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "orgDesigner": {
   "node": {
    "moreMembers_one": "ほか {{count}} 名",
    "moreMembers_other": "ほか {{count}} 名"
   },
   "collapse": {
    "label": "ツリー表示",
    "expand_one": "配下の組織単位 {{count}} 件を表示",
    "expand_other": "配下の組織単位 {{count}} 件を表示",
    "collapse_one": "配下の組織単位 {{count}} 件を隠す",
    "collapse_other": "配下の組織単位 {{count}} 件を隠す",
    "expandAll": "すべて展開",
    "collapseAll": "2 階層まで折りたたむ",
    "hidden_one": "組織単位 {{count}} 件を非表示中",
    "hidden_other": "組織単位 {{count}} 件を非表示中"
   },
   "keys": {
    "collapse": "マイナス (-) でフォーカス中の組織単位を折りたたみ、プラス (+) で展開します。"
   },
   "outlineUnits_one": "組織単位 {{count}} 件の説明文",
   "outlineUnits_other": "全 {{count}} 件の組織単位の説明文",
   "problems": {
    "OneRootMissing": "ルート組織単位を追加してください。公開するには、親を持たない組織単位が 1 つ必要です。",
    "titleEmpty": "チェック",
    "noUnits": "まだ組織単位がありません。上の「組織単位を追加」でルート組織単位を追加し、その下に組織単位を追加してください。組織単位ができるとチェックが動きます。"
   },
   "editAll": "すべての項目を編集"
  }
 },
 "board": {
  "chart": {
   "needsPerson": "人の対応が必要",
   "noReport": "レポートなし"
  },
  "attention": {
   "reports_one": "低下または不健全なレポート {{count}} 件",
   "reports_other": "低下または不健全なレポート {{count}} 件",
   "repeated_one": "{{count}} 回質問",
   "repeated_other": "{{count}} 回質問"
  }
 },
 "organizations": {
  "chart": {
   "below_one": "配下に組織単位 {{count}} 件",
   "below_other": "配下に組織単位 {{count}} 件",
   "showMore_one": "さらに {{count}} 件表示 (未表示 {{total}} 件)",
   "showMore_other": "さらに {{count}} 件表示 (未表示 {{total}} 件)",
   "toolsLabel": "組織図の表示",
   "expandAll": "すべて展開",
   "collapseAll": "2 階層まで折りたたむ"
  }
 },
 "views": {
  "organizationDetail": {
   "editOnDesign": "「設計」タブで編集",
   "chartReadOnlyNote": "作業中のツリーを組織図として表示します (閲覧用)。組織単位の追加、変更、削除は「設計」タブで行います。",
   "noUnitsBodyDesign": "「設計」タブで、最上位のエージェントが率いるルート組織単位を追加し、その下に組織単位を追加してください。",
   "publishChecks": "チェック",
   "publishChecksSummary": "エラー: {{errors}}。警告: {{warnings}}。エラーがあると公開できません。警告だけなら公開できます。"
  }
 },
 "resources": {
  "keepers": {
   "sectionHints": {
    "budgets": "2 つのドル予算はどちらも適用されます。残りのないティックは拒否され、1 日の予算を使い切るとキーパーは次の UTC 日まで停止し、あなたにエスカレーションします。ティックあたりの最大トークン数は保存されますが、まだ適用されません。"
   },
   "hints": {
    "budgetPerTickUsd": "適用されます。ティックは残りの範囲でしか使えず、残りがなければ拒否されます。空欄なら上限なしです。",
    "budgetPerDayUsd": "適用されます。1 日の予算を使い切るとキーパーは次の UTC 日まで「予算上限に到達」になり、緊急のエスカレーションを出します。空欄なら上限なしです。",
    "maxTokensPerTick": "入力と出力のトークンの合計です。保存と検証はされますが、まだ適用されません。空欄なら上限なしです。"
   }
  }
 }
});

// LP5.5 (UXP1-S015): the full unit form opens from the Design tab.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "views": {
  "organizationDetail": {
   "addUnitFull": "すべての項目を入力して組織単位を追加"
  }
 }
});

// LP5.5 (UXP1-V002): the organization canvas is a tree, not nested boxes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(ja, {
 "components": {
  "studio": {
   "canvas": {
    "org": {
     "orgHint": "組織単位を選択すると、メンバーとピアラインを編集できます。組織単位は報告先の組織単位の下に、線でつないで配置されます。"
    }
   }
  }
 }
});
