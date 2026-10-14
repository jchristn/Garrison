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
    tenantId: 'テナント ID',
    email: 'メールアドレス',
    password: 'パスワード',
    accessKey: 'アクセスキー',
    secretKey: 'シークレットキー',
    submit: 'サインイン',
    connecting: 'サインイン中...',
    restoring: 'セッションを復元しています...',
    errorGeneric: 'サインインできません。サーバー URL と認証情報を確認してください。',
    footerHint: 'ローカル開発の既定値: テナント default の admin@garrison。'
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
      selected_one: '{{count}} 件選択中',
      selected_other: '{{count}} 件選択中',
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
        inputSchemaJson: '入力 JSON スキーマ',
        outputSchemaJson: '出力 JSON スキーマ',
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
      grafanaSections: { overview: '概要', http: 'HTTP API', runs: '実行', agents: 'エージェント', models: 'モデルとトークン', workers: 'ワーカー', kubernetes: 'Kubernetes エグゼキューター', protocols: 'プロトコル', scheduler: 'スケジューラーとキュー', database: 'データベース', controlPlane: 'コントロールプレーン', security: 'セキュリティと認証', integrations: '連携', logs: 'ログとトレース' },
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
