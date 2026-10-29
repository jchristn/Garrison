// Cantonese (Traditional) catalog for the Garrison dashboard. Mirrors every key in en.js.

import { tips, explainers } from './yue-Hant.tips.js';

const rp = (title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody) => ({ title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody });

const yueHant = {
  processSecurity: { trustedOnly: "Process 執行器只適用於可信任嘅任務。執行共用工作節點嘅使用者、檔案系統同網絡，可以存取其他執行同工作節點憑證。唔可信任嘅輸入請用 KubernetesJob。" },
  common: {
    eventCodes: { ApprovalRequested: '已要求批核', ApprovalDecided: '已決定批核', StructuredOutputInvalid: '結構化輸出無效', RunBlocked: '執行受阻', EventsDropped: '事件丟棄咗', HarnessExited: 'Harness 結束咗', McpPreflightWarning: 'MCP 預檢警告', McpPreflightPassed: 'MCP 預檢通過', RepairAttemptStarted: '開始咗修復輸出', WorkspacePrepared: '工作區準備好咗', RunGuardTriggered: '執行防護停咗個執行', ConversationFallback: '對話回退', ConversationResumed: '對話已恢復', ConversationStateLost: '對話狀態遺失' },
    fieldCodes: { ExpiryInPast: '請揀一個將來嘅時間。', ParameterInvalid: '呢個值對呢個參數嚟講唔啱。', ParameterNotAllowed: '呢個部署唔畀調用者覆寫呢個參數。', SettingsFileReadOnly: '設定檔係唯讀嘅，所以呢個改動儲存唔到。', OverriddenByEnvironment: '呢個值係由環境變數設定嘅，所以喺度改唔到。', PathRequired: '一定要有設定路徑。', UnknownSetting: '呢部伺服器冇呢項設定。', TooLong: '呢個值太長。', NotAllowedValue: '請揀其中一個容許嘅值。', NotABoolean: '請揀 true 或者 false。', NotAnInteger: '請輸入整數。', OutOfRange: '個值超出咗容許範圍。' },
    serverText: {
      approvalWaitingExpires: '等緊有人批核 {{subject}}；批核 {{id}} 會喺 {{expires}} 到期。',
      approvalWaiting: '等緊有人批核 {{subject}}；批核 {{id}}。',
      notApplied: '冇套用，因為另一份文件驗證唔通過。',
      wouldBeUnchanged: '已經係最新，乜都唔會改。',
      wouldBeUpdated: '會更新。',
      wouldBeCreated: '會建立。',
      inUse: '{{what}} 仲俾呢啲部署綁定緊：{{deployments}}。請先移除綁定。',
      noActiveDeployment: '代理程式 {{agent}} 冇權重大過零嘅啟用部署。請加一個部署或者調高某個部署嘅權重，然後再試。',
      toolCallDenied: '工具調用俾人拒絕咗：{{id}}',
      threadStarted: '執行緒開始咗。',
      runStartedModel: '執行開始咗（{{model}}）。',
      runStarted: '執行開始咗。',
      sessionInitializedModel: '工作階段初始化咗（{{model}}）。',
      sessionInitialized: '工作階段初始化咗。',
      harnessFailed: 'Harness 報告咗失敗。',
      exitedNoResult: 'Harness 以代碼 {{code}} 結束，冇最終結果。',
      harnessExited: 'Harness 結束咗：{{status}}（{{outcome}}）。',
      harnessExitedCode: 'Harness 結束咗，代碼 {{code}}：{{status}}（{{outcome}}）。',
      mcpPreflight: 'MCP 預檢通過咗。檢查咗嘅伺服器：{{count}}。',
      repairAttempt: '結構化輸出修復第 {{attempt}} 次嘗試：喺 {{path}} 繼續 Harness 工作階段。',
      workspacePrepared: '工作區已經喺 {{path}} 準備好。',
      guardRepetitionUnit: '重複防護：助理文字最後 {{window}} 個字元係 {{size}} 個字元嘅單元「{{unit}}」重複咗 {{count}} 次。',
      guardDegenerate: '重複防護：助理文字最後 {{window}} 個字元冇字母亦冇數字（得空白、標點或者符號），結尾係「{{tail}}」。',
      guardNoProgress: '個執行 {{seconds}} 秒都冇進展（冇助理文字、思考、工具呼叫或者工具結果，亦冇未完成嘅工具呼叫）；佢嘅 noProgressSeconds 上限係 {{limit}}。',
      guardOutputLimit: '助理文字超過咗個執行嘅 maxAssistantChars 上限 {{limit}} 個字元。',
      valueClamped: '{{field}} 嘅值 {{given}} 超出咗容許範圍 {{minimum}} 至 {{maximum}}，所以儲存咗 {{stored}}。'
    },
    appName: 'Garrison',
    language: { label: '語言' },
    theme: { switchToLight: '轉做淺色主題', switchToDark: '轉做深色主題' },
    actions: {
      apply: '套用',
      back: '返回',
      cancel: '取消',
      clear: '清除',
      clone: '複製',
      close: '關閉',
      confirm: '確認',
      copied: '已複製',
      copy: '複製',
      delete: '刪除',
      duplicate: '建立副本',
      edit: '編輯',
      hide: '隱藏數值',
      logout: '登出',
      next: '下一步',
      openGithub: '喺 GitHub 打開 Garrison 儲存庫',
      remove: '移除',
      retry: '重試',
      reveal: '顯示數值',
      save: '儲存',
      view: '檢視',
      viewDetails: '睇詳情',
      viewJson: '睇 JSON'
    },
    boolean: { yes: '係', no: '唔係' },
    confirm: {
      deleteNamed: '確定要刪除「{{name}}」？刪咗就冇得復原。',
      bulkDelete: '確定要刪除揀咗嘅 {{count}} 筆記錄？刪咗就冇得復原。'
    },
    errors: {
      listItem: '第 {{index}} 項：{{message}}',
      chooseOne: '請最少揀一個選項。',
      fixFields: '有啲欄位要跟進，請檢查標示咗嘅數值。',
      invalidEmail: '請輸入有效嘅電郵地址。',
      invalidJson: '呢個唔係有效嘅 JSON。',
      loadFailed: '載入唔到資料。',
      requestId: '請求 {{id}}。',
      required: '呢個欄位一定要填。',
      requiredPermission: '需要 {{resource}} 嘅 {{permission}} 權限。'
    },
    generic: {
      deletedName: '{{name}}（已刪除）',
      actions: '操作',
      active: '啟用中',
      all: '全部',
      any: '任何',
      builtIn: '內置',
      custom: '自訂',
      inactive: '已停用',
      loading: '載入緊...',
      never: '從未',
      none: '無',
      notAvailable: '不適用',
      saving: '儲存緊...'
    },
    relativeTime: { now: '啱啱' },
    states: {
      forbiddenTitle: '你冇權限睇呢一頁',
      forbiddenBody: '請搵管理員畀你一個有存取權嘅角色，或者揀第二頁。',
      unavailableTitle: '呢部伺服器暫時未有呢個功能',
      unavailableBody: '伺服器冇提供 {{resource}} 嘅端點。請升級伺服器，或者喺 API 探索器睇吓佢支援啲乜。'
    },
    toasts: {
      bulkDeleted: '已刪除 {{count}} 筆記錄（{{failed}} 筆失敗）。',
      cloned: '已複製。',
      created: '已建立。',
      deleted: '已刪除。',
      saved: '已儲存。'
    },
    units: { msShort: '毫秒', sShort: '秒', mShort: '分鐘', tokPerSec: 'Token/秒' }
  },
  errorCodes: {
    ApprovalNotPending: '呢個批核已經決定咗，所以唔可以再決定。',
    MessageIdConflict: '呢個 A2A 訊息 ID 已經用過喺唔同嘅內容度。請用新嘅 ID 傳送訊息。',
    IdempotencyKeyConflict: '呢個冪等金鑰已經用咗喺另一個要求度。請用新嘅金鑰。',
    DeploymentDeleted: '呢個執行嘅部署已經刪咗，所以冇得重試。請再調用代理程式一次。',
    AgentDeleted: '呢個執行嘅代理程式已經刪咗，所以冇得重試。',
    NoActiveDeployment: '呢個代理程式冇權重大過零嘅啟用部署。請加一個部署或者調高某個部署嘅權重。',
    TenantNotFound: '呢個租用戶唔存在。請檢查租用戶 ID。',
    NetworkError: '連唔到伺服器。請檢查伺服器 URL，同埋確認伺服器係咪運行緊。',
    AuthenticationRequired: '你嘅工作階段已經過期，請重新登入。',
    InvalidCredentials: '租用戶、電郵、密碼或者金鑰唔啱。',
    RateLimited: '登入嘗試太多次，請等一分鐘再試。',
    AuthorizationDenied: '你冇權限做呢個操作。',
    NotFound: '搵唔到呢筆記錄。',
    RouteNotFound: '呢部伺服器唔支援嗰個端點。',
    ValidationFailed: '有啲數值無效。',
    InvalidBody: '請求內容無效。',
    InvalidJson: '請求內容唔係有效嘅 JSON。',
    Conflict: '同現有記錄有衝突。',
    BuiltInImmutable: '內置記錄唔改得。請複製一份再自訂。',
    Protected: '呢筆記錄受保護，刪唔到。',
    StaleLease: '嗰個節點已經冇再持有呢次執行嘅租約。',
    InternalError: '伺服器出咗內部錯誤。請用請求 ID 檢查伺服器日誌。',
    Http400: '請求無效，已被拒絕。',
    Http403: '你冇權限做呢個操作。',
    Http404: '搵唔到。',
    Http409: '同目前狀態有衝突。',
    Http500: '伺服器出咗內部錯誤。',
    Http503: '伺服器暫時用唔到。',
    ConversationBusy: '呢個對話仲喺度處理上一輪。請等待該執行結束或將其取消，然後再試一次。',
    ConversationAgentMismatch: '呢個對話屬於另一個代理程式。請將呢一輪傳送畀該代理程式，或開始新嘅對話。',
    ConversationDeploymentMismatch: '對話嘅每一輪都在第一輪嘅部署上執行。請將部署留空，或開始新嘅對話。',
    ConversationDeploymentUnavailable: '呢個對話所用嘅部署已被刪除，所以對話冇辦法繼續。請開始新嘅對話。'
  },
  enums: {
    approvalStatus: {
      Pending: '等候中',
      Approved: '已批准',
      Denied: '已拒絕',
      Expired: '已過期',
      Cancelled: '已取消'
    },
    approvalDecision: {
      Allow: '允許',
      Deny: '拒絕'
    },
    approvalSource: {
      DurableResume: "沿用嘅核准",
      Rule: '規則',
      Default: '部署預設',
      User: '人手',
      Timeout: '逾時',
      Cancelled: '執行已停止'
    },
    approvalRuleAction: {
      Allow: '允許',
      Deny: '拒絕',
      Ask: '問人'
    },
    approvalKind: {
      Tool: '工具呼叫',
      Command: '指令',
      FileChange: '檔案變更'
    },
    principalType: { Administrator: '系統管理員', User: '用戶', Credential: '存取金鑰', Run: '執行權杖' },
    runBlockedReason: { NoReadyWorker: '冇就緒嘅工作節點', NoCapableWorker: '冇工作節點做到', NoMatchingPool: '冇相符嘅節點池' },
    promptDelivery: { Stdin: '標準輸入', Argument: '命令列參數', File: '檔案', CodexAppServer: 'Codex 應用程式伺服器 (JSON-RPC)' },
    systemPromptDelivery: { File: '檔案', Argument: '命令列參數', Environment: '環境變數', PrependToPrompt: '加喺提示前面', None: '唔傳遞' },
    mcpConfigFormat: { None: '冇 MCP 設定', ClaudeJson: 'Claude Code JSON', CodexToml: 'Codex TOML', MuxJson: 'Mux JSON', GeminiSettings: 'Gemini CLI 設定' },
    outputParser: {
      ClaudeStreamJson: 'Claude Code 串流 JSON',
      CodexJsonl: 'Codex JSONL',
      CodexAppServer: 'Codex 應用程式伺服器 JSON-RPC',
      MuxJsonl: 'Mux JSONL',
      GeminiStreamJson: 'Gemini CLI 串流 JSON',
      GenericJsonl: '通用 JSONL',
      PlainText: '純文字'
    },
    resultSource: { ParserFinalEvent: '解析器最後事件', LastMessageFile: '最後訊息檔案', Stdout: 'Stdout' },
    successPolicy: { FinalEvent: '最後事件', ExitCode: '結束代碼', FinalEventAndExitCode: '最後事件同結束代碼' },
    fileBaseDirectory: { Config: '設定目錄', Workspace: '工作區', Home: '主目錄' },
    artifactStoreKind: { Database: '資料庫', Filesystem: '檔案系統', S3: 'S3' },
    agentInputMode: { Text: '文字', Structured: '結構化 JSON' },
    argumentOverrideOperation: { Append: '加喺尾', Prepend: '加喺頭', Remove: '移除', Replace: '取代' },
    runOverrideValidation: { Any: '任何值', Enum: '清單入面嘅值', Regex: '正規表達式', IntegerRange: '整數範圍' },
    credentialAuthMode: { DirectHeader: '直接標頭', SignedRequest: '簽署請求', SessionExchange: '換取工作階段權杖', Hybrid: '任何方式' },
    operationType: { All: '所有操作', Create: '建立', Read: '讀取', Write: '寫入', Update: '更新', Delete: '刪除', Execute: '執行', Admin: '管理' },
    usageQuotaScope: {"Tenant": "租用戶", "Agent": "代理程式", "Deployment": "部署"},
    resourceType: {
      All: '所有資源',
      Account: '帳戶',
      Tenant: '租用戶',
      Admin: '系統管理',
      User: '用戶',
      Credential: '存取金鑰',
      Session: '工作階段',
      Role: '角色',
      Permission: '權限',
      Assignment: '指派',
      Audit: '審計記錄',
      RequestHistory: '請求記錄',
      Settings: '設定',
      HarnessProfile: 'Harness 設定檔',
      PromptTemplate: '提示範本',
      Agent: '代理程式',
      Deployment: '部署',
      McpServer: 'MCP 伺服器',
      Secret: '機密',
      Workspace: '工作區',
      ArtifactStore: '成品存放區',
      ModelPrice: "模型價格",
      UsageQuota: "使用配額",
      Run: '執行',
      Node: '節點',
      NodePool: '節點池',
      Manifest: '清單',
      Conversation: '對話',
      Approval: '批核',
      Artifact: '成品'
    },
    runStatus: {
      Pending: '等候中',
      Queued: '排隊中',
      Leased: '已租用',
      Running: '執行中',
      Cancelling: '取消緊',
      Succeeded: '成功',
      Failed: '失敗',
      Cancelled: '已取消',
      TimedOut: '逾時',
      Rejected: '已拒絕'
    },
    runOutcome: {
      None: '無',
      Succeeded: '成功',
      HarnessFailed: 'Harness 失敗',
      NotInstalled: '未安裝 Harness',
      NotCredentialed: '缺少憑證',
      McpPreflightFailed: 'MCP 預檢失敗',
      NodeLost: '節點失聯',
      OutputLimitExceeded: '輸出超出上限',
      SchemaValidationFailed: '輸出結構無效',
      TimedOut: '逾時',
      Cancelled: '已取消',
      StaleLease: '租約過時',
      CompileFailed: '編譯失敗',
      WorkspaceFailed: '工作區失敗',
      Rejected: '已拒絕',
      InternalError: '內部錯誤',
      NoCapableWorker: '冇工作節點做到',
      RepetitionDetected: '偵測到重複',
      NoProgress: '冇進展',
      PodFailed: '執行 Pod 失敗',
      ConversationStateLost: '對話狀態遺失'
    },
    runEventType: {
      Lifecycle: '生命週期',
      AssistantText: '助理',
      Thinking: '思考',
      ToolCall: '工具呼叫',
      ToolResult: '工具結果',
      Usage: '用量',
      Progress: '進度',
      Warning: '警告',
      Error: '錯誤',
      Stdout: 'Stdout',
      Stderr: 'Stderr',
      Result: '結果'
    },
    nodeStatus: { Ready: '就緒', Draining: '清空緊', Cordoned: '已封鎖', Lost: '失聯', Offline: '離線' },
    controlNodeStatus: { Starting: '啟動緊', Ready: '就緒', Draining: '清空緊', Offline: '離線' },
    backplane: { Local: '本機（單一副本）', Polling: '資料庫輪詢', PostgresNotify: 'PostgreSQL 通知' },
    harnessType: { ClaudeCode: 'Claude Code', Codex: 'Codex', Mux: 'Mux', GeminiCli: 'Gemini CLI', Generic: '通用' },
    agentKind: { Hosted: '託管', Remote: '遠端' },
    delegationMode: { None: '唔委派', AllowList: '允許清單', Any: '任何代理程式' },
    secretStatus: { Ok: '正常', NeedsReauthentication: '要重新驗證' },
    secretKind: {
      AnthropicApiKey: 'Anthropic API 金鑰',
      ClaudeCodeOAuthToken: 'Claude Code OAuth 權杖',
      OpenAiApiKey: 'OpenAI API 金鑰',
      CodexAuthJson: 'Codex auth.json',
      GeminiApiKey: 'Gemini API 金鑰',
      GenericEnv: '環境變數值',
      GenericFile: '檔案內容',
      BearerToken: 'Bearer 權杖',
      BasicAuth: '基本驗證',
      GitCredential: 'Git 憑證'
    },
    workspaceKind: { Empty: '空白', GitRepository: 'Git 儲存庫', Seeded: '預置檔案', PersistentVolume: '持久儲存卷' },
    runExecutor: { Process: '程序', KubernetesJob: 'Kubernetes Job' },
    workspaceRetention: { Delete: '刪除', Keep: '保留', KeepOnFailure: '失敗時保留' },
    promptTemplateKind: { System: '系統', Task: '任務', Fragment: '片段', ToolDescription: '工具描述', ConfigFile: '設定檔', Other: '其他' },
    permissionType: { Permit: '允許', Deny: '拒絕' },
    resourceScope: { Tenant: '租用戶', Resource: '資源' },
    resourceBindingKind: { McpServer: 'MCP 伺服器', Secret: '機密' },
    mcpTransport: { Http: 'HTTP', Stdio: 'stdio' },
    remoteProtocol: { A2A: 'A2A', Mcp: 'MCP' },
    manifestApplyResult: { Created: '已建立', Updated: '已更新', Unchanged: '冇變更', Failed: '失敗', Validated: '已驗證' },
    auditEventType: {
      ApprovalDecided: '已決定批核',
      AuthSuccess: '登入成功',
      AuthFailure: '登入失敗',
      SessionIssued: '已發出工作階段',
      SessionRevoked: '已撤銷工作階段',
      CredentialCreated: '已建立存取金鑰',
      CredentialRotated: '已輪換存取金鑰',
      CredentialUsed: '已使用存取金鑰',
      AuthorizationDenied: '授權被拒',
      AuthorizationBypass: '略過授權',
      RoleChanged: '角色已變更',
      PermissionChanged: '權限已變更',
      AssignmentChanged: '指派已變更',
      ConfigurationChanged: '配置已變更',
      SecretChanged: '機密已變更',
      SettingsChanged: '設定已變更',
      RestartRequested: '已要求重新啟動',
      ManifestApplied: '已套用清單',
      NodeRegistered: '節點已登記',
      NodeStatusChanged: '節點狀態已變更',
      RunCancelled: '執行已取消',
      ConversationDeleted: '對話已刪除'
    },
    conversationFallbackReason: {
      AffinityNodeLost: '親和節點未就緒',
      AffinityWaitExpired: '親和等待已逾時',
      WorkspaceLost: '工作區已遺失',
      SessionMissing: '冇可恢復嘅工作階段',
      HarnessChanged: 'Harness 設定檔已變更',
      ResumeUnsupported: '唔支援恢復',
      ExecutorWithoutState: '執行器唔保留狀態'
    }
  },
  nav: {
    approvalsPending_one: '{{count}} 個批核等緊',
    approvalsPending_other: '{{count}} 個批核等緊',
    primary: '主要導覽',
    sections: {
      operate: '運作',
      platform: '平台',
      administration: '管理'
    },
    hubs: {
      approvals: {
        label: '批核',
        tip: '等緊有人處理嘅工具呼叫，同埋每一個決定'
      },
      home: { label: '主頁', tip: '一眼睇晒機群同執行嘅健康狀況' },
      invoke: { label: '調用', tip: '互動咁試用代理程式' },
      runs: { label: '執行', tip: '執行記錄同排程隊列' },
      analytics: { label: '分析', tip: '隨時間變化嘅執行速度、Token、成本同結果' },
      agents: { label: '代理程式', tip: '代理程式同負責運行佢哋嘅部署' },
      configuration: { label: '配置', tip: 'Harness 設定檔、提示範本、MCP 伺服器、機密、工作區、成品存放區同清單' },
      fleet: { label: '機群', tip: '控制平面、工作節點同節點池' },
      access: { label: '存取', tip: '租用戶、用戶、存取金鑰、角色同指派' },
      monitoring: { label: '監察', tip: '請求記錄、審計同 API 探索器' },
      system: { label: '系統', tip: '伺服器設定同伺服器資訊' }
    },
    items: {
      approvals: {
        label: '批核',
        tip: '允許或者拒絕代理程式要求做嘅工具呼叫'
      },
      home: { label: '主頁', tip: '一眼睇晒機群同執行嘅健康狀況' },
      invoke: { label: '調用', tip: '互動咁試用代理程式' },
      runs: { label: '執行', tip: '搜尋、檢查、取消同重試執行' },
      queue: { label: '隊列', tip: '按代理程式同 Harness 睇排程壓力' },
      analytics: { label: '分析', tip: '隨時間變化嘅執行速度、Token、成本同結果' },
      nodes: { label: '工作節點', tip: '工作節點同佢哋支援嘅 Harness' },
      controlNodes: { label: '控制平面', tip: '提供 API 同排程執行嘅伺服器副本' },
      nodePools: { label: '節點池', tip: '將節點分組，並專門分配畀租用戶' },
      agents: { label: '代理程式', tip: '經 REST、MCP 同 A2A 公開嘅代理程式' },
      deployments: { label: '部署', tip: '將代理程式綁定到 Harness、提示同資源' },
      harnessProfiles: { label: 'Harness 設定檔', tip: '每個 Harness 點樣以無介面模式運行' },
      promptTemplates: { label: '提示範本', tip: 'Garrison 送出嘅每個提示，有版本控制' },
      mcpServers: { label: 'MCP 伺服器', tip: '代理程式用得到嘅工具' },
      secrets: { label: '機密', tip: 'Harness 同整合用嘅憑證' },
      workspaces: { label: '工作區', tip: '執行工作區點樣準備' },
      artifactStores: { label: '成品存放區', tip: '執行成品存放喺邊' },
      modelPrices: { label: "模型價格", tip: "執行器冇報告費用時，用操作員設定嘅美元費率估算。已報告費用（包括零）優先。" },
      usageQuotas: { label: "使用配額", tip: "租戶、代理或者部署嘅UTC每日執行數、權杖數、已知費用上限同目前並行上限。" },
      manifests: { label: '清單', tip: '以程式碼形式套用同匯出配置' },
      requests: { label: '請求記錄', tip: '檢查 HTTP 流量同失敗' },
      audit: { label: '審計', tip: '保安同配置事件' },
      explorer: { label: 'API 探索器', tip: '執行即時 API 呼叫' },
      tenants: { label: '租用戶', tip: '管理租用戶' },
      users: { label: '用戶', tip: '管理用戶' },
      credentials: { label: '存取金鑰', tip: '自動化用嘅存取金鑰' },
      roles: { label: '角色', tip: '角色同權限' },
      assignments: { label: '指派', tip: '將角色授予用戶同存取金鑰' },
      settings: { label: '設定', tip: '編輯伺服器同叢集設定' },
      serverInfo: { label: '伺服器資訊', tip: '端點、版本同你嘅身份' },
      conversations: {
        label: '對話',
        tip: '與代理程式嘅多輪交流'
      }
    },
    setup: '設定精靈',
    setupTip: '設定憑證、套用範例代理程式，再測試佢',
    tour: '導覽',
    tourTip: '重新播放導覽',
    version: '版本 {{version}}',
    collapseSidebar: '切換導覽列',
    skipToContent: '跳到內容'
  },
  login: {
    title: 'Garrison',
    subtitle: '登入代理程式控制平面',
    tabs: { password: '電郵同密碼', accessKey: '存取金鑰' },
    serverUrl: '伺服器 URL',
    serverInUse: '用緊嘅伺服器：',
    useDifferentServer: '用另一部伺服器',
    useDefaultServer: '用預設伺服器',
    tenantId: '租用戶 ID',
    email: '電郵',
    password: '密碼',
    accessKey: '存取金鑰',
    secretKey: '密鑰',
    submit: '登入',
    connecting: '登入緊...',
    restoring: '還原緊你嘅工作階段...',
    errorGeneric: '登入唔到。請檢查你嘅憑證，同埋伺服器係咪連得到。',
    footerHint: '本機開發預設：租用戶 default 入面嘅 admin@garrison。'
  },
  topbar: {
    server: '伺服器',
    tenant: '租用戶',
    switchTenant: '切換租用戶',
    copyServer: '複製伺服器 URL',
    live: '即時',
    polling: '輪詢',
    liveOn: '經 WebSocket 接收緊即時更新',
    liveOff: '即時更新用唔到，頁面會用輪詢方式更新',
    health: { healthy: '正常', unhealthy: '連唔到', unknown: '檢查緊' }
  },
  roles: {
    systemAdmin: '系統管理員',
    tenantAdmin: '租用戶管理員',
    user: '用戶',
    credential: '存取金鑰',
    run: '執行權杖'
  },
  components: {
    fieldWarnings: { title_one: '已經儲存，{{count}} 個值調整咗', title_other: '已經儲存，{{count}} 個值調整咗', body: '伺服器已經接受咗個請求，但係以下啲值儲存落去同送出嘅唔一樣。', dismiss: '關閉', codes: { ValueClamped: '個值已經限制喺容許範圍之內' } },
    approvals: {
      awaiting: '等緊批核',
      decideTitle: '決定 {{tool}}',
      decision: '決定',
      reason: '原因',
      reasonPlaceholder: '可選。代理程式同審計記錄都會睇到。',
      remember: '記住做呢個部署嘅規則',
      rulePattern: '規則模式',
      rememberHint: '喺部署度加一條動作係 {{action}} 嘅規則，咁符合嘅呼叫就唔使問都會決定。呢個亦都需要更新部署嘅權限。',
      submitAllow: '允許',
      submitDeny: '拒絕',
      timeoutThen: '然後 {{decision}}',
      toasts: {
        allowed: '已允許 {{tool}}。',
        denied: '已拒絕 {{tool}}。',
        allowedRemembered: '已允許 {{tool}}，仲加咗規則 {{pattern}}。',
        deniedRemembered: '已拒絕 {{tool}}，仲加咗規則 {{pattern}}。',
        notPending: '呢個批核已經俾其他人或者逾時決定咗。清單而家會顯示結果。',
        forbidden: '你可以睇批核，但唔可以決定。請搵管理員攞 Approval Update 權限。',
        forbiddenRemember: '記住規則亦都需要更新部署嘅權限。你可以唔記住就直接決定，或者申請 Deployment Update。'
      }
    },
    approvalCheck: {
      title: '測試工具呼叫',
      saveFirst: '請先儲存部署。測試會檢查伺服器儲存咗嘅規則。',
      hint: '檢查嘅係已儲存嘅規則，所以測試之前要先儲存你嘅更改。唔會記錄任何嘢。',
      toolName: '工具',
      inputs: {
        command: '指令',
        url: 'URL',
        query: '搜尋查詢',
        file_path: '檔案路徑',
        notebook_path: '筆記本路徑',
        pattern: '模式'
      },
      run: '檢查',
      checking: '檢查緊...',
      byRule: '由呢條規則 {{action}}：',
      byDefault: '由部署預設 {{action}}，因為冇規則符合。',
      suggestedRule: '建議規則：',
      disabled: '呢個部署關咗批核，所以佢嘅執行永遠唔會問。開返佢再儲存，先會套用呢啲規則。'
    },
    blocked: {
      title: '等緊工作節點',
      body: '呢個執行排緊隊，但係而家冇工作節點接得到。',
      reasons: {
        NoReadyWorker: '冇就緒嘅工作節點。請啟動或者註冊一個工作節點，再喺機群頁面睇吓邊啲節點失聯、離線、清空緊或者已封鎖。',
        NoCapableWorker: '有就緒嘅工作節點，但係冇一個話 {{harness}} Harness 用得。請啟動或者註冊一個裝咗嗰個 Harness 嘅工作節點，或者喺機群頁面睇吓佢嘅憑證同探測結果。',
        NoMatchingPool: '有就緒嘅工作節點做到 {{harness}}，但係冇一個啱呢個部署嘅節點池或者節點選取器。請檢查部署嘅排程放置，或者喺嗰個節點池加工作節點。'
      },
      failNote: '如果叢集設定 Runtime.FailBlockedAfterSeconds 大過 0，塞住咗咁耐嘅執行會以結果「冇工作節點做到」失敗。',
      openFleet: '打開機群',
      openAgent: '打開代理程式嘅部署',
      homeBanner_other: '有 {{count}} 個排緊隊嘅執行開始唔到：冇就緒嘅工作節點做到佢哋。',
      showRuns: '睇排緊隊嘅執行',
      queueColumn: '塞住咗',
      queueCount_other: '{{count}} 個塞住咗'
    },
    autoRefresh: {
      label: '自動重新整理',
      none: '關閉',
      seconds_one: '每 {{count}} 秒',
      seconds_other: '每 {{count}} 秒'
    },
    chart: {
      success: '成功',
      failure: '失敗',
      total: '總數',
      avgDuration: '平均時長',
      noData: '呢段時間冇任何活動。',
      range: '時間範圍',
      ranges: { hour: '過去一小時', day: '過去一日', week: '過去一星期', month: '過去一個月', custom: '自訂' }
    },
    compilePreview: {
      title: '編譯預覽',
      input: '範例輸入',
      compile: '編譯',
      compiling: '編譯緊...',
      commandLine: '指令行',
      stdin: '標準輸入',
      environment: '環境',
      files_one: '{{count}} 個檔案',
      files_other: '{{count}} 個檔案'
    },
    confirm: { title: '請確認', message: '你肯定要繼續？' },
    diff: { before: '之前', after: '之後' },
    explainer: { about: '關於{{topic}}', dismiss: '收埋呢段說明' },
    export: { label: '匯出', csv: 'CSV（資料）', png: 'PNG 圖片', svg: 'SVG 圖片', json: 'JSON（資料）', failed: '匯出失敗。{{message}}', tableTitle: '表格 {{table}}' },
    filters: {
      allTenants: '所有租用戶',
      clear: '清除篩選',
      from: '由',
      to: '至',
      method: '方法',
      path: '路徑包含',
      pathPlaceholder: '例如 /v1.0/api/tenants',
      searchName: '按名稱搜尋',
      status: '狀態碼',
      statusPlaceholder: '例如 404',
      tenant: '租用戶'
    },
    form: {
      addItem: '新增項目',
      addRow: '新增一行',
      key: '鍵',
      value: '值',
      moveUp: '上移',
      moveDown: '下移',
      noItems: '仲未有項目。',
      onePerLine: '每行一個值',
      steps: '表單步驟'
    },
    mcpTest: {
      title: 'MCP 連線測試',
      testing: '連線緊同列出工具...',
      ok: '已連線',
      failed: '失敗',
      tools_one: '{{count}} 個工具',
      tools_other: '{{count}} 個工具'
    },
    permissions: {
      title: '實際權限',
      none: '冇任何授權。呢個主體只可以用略過規則（如果有嘅話）。',
      source: '角色',
      type: '類型',
      resources: '資源類型',
      operations: '操作',
      scope: '範圍'
    },
    requestDetails: {
      title: '請求詳情',
      metadata: '中繼資料',
      requestHeaders: '請求標頭',
      requestBody: '請求內容',
      responseHeaders: '回應標頭',
      responseBody: '回應內容',
      rawJson: '原始 JSON',
      truncated: '已截斷（原本 {{bytes}} 位元組）',
      empty: '冇內容。',
      fields: {
        id: '請求 ID',
        method: '方法',
        path: '路徑',
        url: 'URL',
        status: '狀態',
        duration: '時長',
        createdUtc: '建立時間',
        completedUtc: '完成時間',
        sourceIp: '來源 IP',
        principal: '主體',
        tenant: '租用戶',
        user: '用戶'
      }
    },
    secretOnce: {
      title: '即刻複製呢個密鑰',
      warning: '密鑰只會喺呢度顯示一次。關閉之前請將佢存放喺安全嘅地方。',
      accessKey: '存取金鑰',
      secretKey: '密鑰',
      done: '我已經儲存咗'
    },
    table: {
      bulkActions: '批次操作',
      bulkDelete: '刪除已揀項目',
      clearSelection: '清除選擇',
      empty: '冇記錄可以顯示。',
      first: '第一頁',
      jump: '跳到指定頁',
      last: '最後一頁',
      loading: '載入緊記錄...',
      next: '下一頁',
      noMatches: '冇記錄符合目前嘅篩選條件。',
      pageOf: '第 {{page}} 頁，共 {{total}} 頁',
      pageSize: '每頁',
      pinned: '一定顯示',
      prev: '上一頁',
      records_one: '筆記錄',
      records_other: '筆記錄',
      refresh: '重新整理',
      selectAll: '揀晒呢頁所有行',
      selectColumns: '揀欄',
      selected_one: '已揀 {{count}} 項',
      selected_other: '已揀 {{count}} 項',
      selectRow: '揀呢行',
      showing: '顯示緊第 {{from}} 至 {{to}} 筆',
      sortBy: '按{{column}}排序',
      sortPageOnly: '只會排序目前呢一頁'
    }
  },
  resources: {
    approvals: {
      ...rp('批核', '代理程式要求做嘅工具呼叫，由部署規則、部署預設、人手或者逾時決定。等候中嘅就等你處理。', '新增批核', '建立批核', '編輯批核', '批核詳情', '刪除批核', '仲未有批核', '開咗批核嘅部署喺工具呼叫之前問一聲，批核就會喺度出現。'),
      columns: {
        createdUtc: '要求時間',
        agentName: '代理程式',
        toolName: '工具',
        summary: '要求',
        status: '狀態',
        decision: '決定',
        decisionSource: '來源',
        decidedBy: '決定者',
        expiresUtc: '到期時間',
        kind: '類型',
        harnessType: 'Harness',
        runId: '執行',
        waitMs: '等候',
        reason: '原因',
        decidedUtc: '決定時間',
        id: 'ID'
      },
      fields: {
        status: '狀態',
        decision: '決定',
        decisionSource: '決定來源',
        decidedBy: '決定者',
        toolName: '工具',
        kind: '類型',
        harnessType: 'Harness',
        agentName: '代理程式',
        runId: '執行',
        rootRunId: '根執行',
        deploymentId: '部署',
        leaseEpoch: '租約世代',
        requestedUtc: '要求時間',
        expiresUtc: '到期時間',
        decidedUtc: '決定時間',
        waitMs: '等候時間',
        timeoutDecision: '逾時嘅決定',
        toolCallId: '工具呼叫 ID',
        reason: '原因',
        summary: '摘要',
        inputPreview: '輸入（已遮蓋）',
        rulePattern: '符合嘅規則',
        ruleId: '規則 ID',
        suggestedRule: '建議規則',
        rememberedRuleId: '已記住嘅規則 ID'
      },
      filters: {
        runId: '執行 ID',
        runIdPlaceholder: '執行 ID（run_...）'
      },
      actions: {
        allow: '允許',
        deny: '拒絕',
        openRun: '打開執行'
      }
    },
    tenants: {
      ...rp('租用戶', '互相隔離嘅空間，每個都有自己嘅用戶、代理程式、機密同執行。', '新增租用戶', '建立租用戶', '編輯租用戶', '租用戶詳情', '刪除租用戶', '仲未有租用戶', '建立一個租用戶，將一個團隊或者客戶隔離開。'),
      columns: { name: '名稱', id: 'ID', description: '描述', active: '啟用', createdUtc: '建立時間' },
      fields: { name: '名稱', description: '描述', active: '啟用' }
    },
    users: {
      ...rp('用戶', '用電郵同密碼登入呢個租用戶嘅人。', '新增用戶', '建立用戶', '編輯用戶', '用戶詳情', '刪除用戶', '仲未有用戶', '新增一個用戶，等佢可以登入呢個租用戶。'),
      columns: { email: '電郵', name: '名稱', id: 'ID', role: '角色', active: '啟用', createdUtc: '建立時間' },
      fields: { email: '電郵', password: '密碼', firstName: '名', lastName: '姓', isTenantAdmin: '租用戶管理員', isAdmin: '系統管理員', active: '啟用' },
      hints: { isAdmin: '系統管理員可以管理所有租用戶，仲可以略過所有授權檢查。', password: '編輯嗰陣留空就會保留現有密碼。' },
      actions: { permissions: '實際權限' }
    },
    credentials: {
      ...rp('存取金鑰', '自動化、SDK 同整合用嘅存取金鑰。密鑰只會顯示一次。', '新增存取金鑰', '建立存取金鑰', '編輯存取金鑰', '存取金鑰詳情', '刪除存取金鑰', '仲未有存取金鑰', '建立一條存取金鑰，等腳本或者服務可以呼叫 Garrison。'),
      columns: { name: '名稱', accessKey: '存取金鑰', secretKeyLast4: '密鑰', userId: '擁有者', lastUsedUtc: '最後使用', expiresUtc: '到期', active: '啟用', id: 'ID' },
      fields: { name: '名稱', userId: '擁有者', authMode: '驗證模式', expiresUtc: '到期', active: '啟用' },
      hints: { userId: '存取金鑰嘅權限永遠唔會超過佢擁有者嘅權限。' },
      actions: { rotate: '輪換密鑰' }
    },
    roles: {
      ...rp('角色', '角色係一組權限。內置角色係唯讀嘅，想自訂就複製一個。', '新增角色', '建立角色', '編輯角色', '角色詳情', '刪除角色', '仲未有角色', '建立自訂角色，或者複製一個內置角色。'),
      columns: { name: '名稱', description: '描述', isBuiltIn: '類型', active: '啟用', id: 'ID', createdUtc: '建立時間' },
      fields: { name: '名稱', description: '描述', active: '啟用' }
    },
    permissions: {
      ...rp('權限', '允許或者拒絕對資源類型嘅操作。拒絕一定優先。', '新增權限', '建立權限', '編輯權限', '權限詳情', '刪除權限', '仲未有權限', '建立一個權限，再將佢對應到角色。'),
      columns: { name: '名稱', permissionType: '類型', resourceTypes: '資源類型', operationTypes: '操作', isBuiltIn: '來源', id: 'ID' },
      fields: { name: '名稱', permissionType: '類型', resourceTypes: '資源類型', operationTypes: '操作', active: '啟用' }
    },
    userAssignments: {
      ...rp('用戶指派', '喺租用戶或者資源範圍將角色授予用戶。', '新增用戶指派', '建立用戶指派', '編輯用戶指派', '用戶指派詳情', '刪除用戶指派', '仲未有用戶指派', '將一個角色指派畀用戶。'),
      columns: { userId: '用戶', roleName: '角色', resourceScope: '範圍', resourceId: '資源', active: '啟用', createdUtc: '建立時間', id: 'ID' },
      fields: { userId: '用戶', roleId: '角色', resourceScope: '範圍', resourceId: '資源 ID', inheritsToChildren: '套用到租用戶入面嘅資源', active: '啟用' }
    },
    credentialAssignments: {
      ...rp('存取金鑰指派', '將角色授予存取金鑰。存取金鑰嘅權限應該比擁有者窄。', '新增存取金鑰指派', '建立存取金鑰指派', '編輯存取金鑰指派', '存取金鑰指派詳情', '刪除存取金鑰指派', '仲未有存取金鑰指派', '將一個角色指派畀存取金鑰。'),
      columns: { credentialId: '存取金鑰', roleName: '角色', resourceScope: '範圍', resourceId: '資源', active: '啟用', createdUtc: '建立時間', id: 'ID' },
      fields: { credentialId: '存取金鑰', roleId: '角色', resourceScope: '範圍', resourceId: '資源 ID', inheritsToChildren: '套用到租用戶入面嘅資源', active: '啟用' }
    },
    harnessProfiles: {
      ...rp('Harness 設定檔', '準確描述 Harness 點樣以無介面模式運行：執行檔、參數、環境、檔案同輸出解析。', '新增 Harness 設定檔', '建立 Harness 設定檔', '編輯 Harness 設定檔', 'Harness 設定檔詳情', '刪除 Harness 設定檔', '仲未有 Harness 設定檔', '複製一個內置設定檔，就可以自訂 Harness 點樣啟動。'),
      steps: { basics: '基本', invocation: '調用方式', output: '輸出', limits: '限制' },
      columns: { name: '名稱', harnessType: 'Harness', executable: '執行檔', outputParser: '解析器', isBuiltIn: '來源', id: 'ID', createdUtc: '建立時間' },
      fields: {
        name: '名稱',
        description: '描述',
        harnessType: 'Harness 類型',
        executable: '執行檔',
        probeArguments: '版本探測參數',
        active: '啟用',
        arguments: '參數',
        argTemplate: '範本',
        argCondition: '條件',
        argRepeatOver: '逐項重複',
        promptDelivery: '提示傳遞方式',
        promptArgumentTemplate: '提示參數或者檔案名',
        systemPromptDelivery: '系統提示傳遞方式',
        systemPromptTarget: '系統提示目標',
        mcpConfigFormat: 'MCP 設定格式',
        mcpConfigFileName: 'MCP 設定檔名',
        environment: '環境',
        envName: '名稱',
        envValue: '值範本',
        isSecret: '機密',
        files: '檔案',
        fileBase: '基礎目錄',
        filePath: '路徑',
        fileContent: '內容範本',
        fileMode: '模式',
        credentialEnvironmentAllowlist: '允許嘅憑證變數',
        outputParser: '輸出解析器',
        genericTextField: '文字欄位路徑',
        genericFinalField: '最終結果欄位路徑',
        genericSuccessField: '成功欄位路徑',
        genericSuccessValue: '成功值',
        resultSource: '結果來源',
        resultFileName: '結果檔案名',
        successPolicy: '成功判定政策',
        successExitCodes: '成功結束碼',
        defaultTimeoutSeconds: '預設逾時（秒）',
        killGraceSeconds: '強制終止寬限（秒）',
        maxOutputBytes: '最大輸出（位元組）',
        stderrTailBytes: 'Stderr 尾段（位元組）',
        isolateHome: '每次執行隔離 HOME',
        supportsResume: '支援恢復工作階段'
      },
      hints: {
        arguments: '每個範本會渲染成一個參數。如果條件渲染出嚟係空白或者 false，就會略過嗰個參數。',
        executable: '工作節點 PATH 入面嘅指令名，或者絕對路徑。',
        environment: '用 {{secret.alias}} 引用已綁定嘅機密。程序環境一開始係空嘅，只有允許清單入面嘅變數。',
        successPolicy: 'Garrison 預設係睇解析器最後一個事件嚟判斷成功，唔係睇結束碼。'
      },
      errors: { reservedPrefix: 'builtin/ 前綴係保留咗嘅。' }
    },
    promptTemplates: {
      deleteBound_other: '「{{name}}」俾 {{count}} 個部署綁定緊，所以伺服器會拒絕刪除。請先喺以下部署移除綁定：',
      deleteBound_one: '「{{name}}」俾 {{count}} 個部署綁定緊，所以伺服器會拒絕刪除。請先喺以下部署移除綁定：',
      deleteUnbound: '確定要刪除「{{name}}」同佢所有版本？冇部署綁定佢。刪咗就冇得復原。',
      ...rp('提示範本', 'Garrison 渲染嘅每個提示同設定檔。每次儲存都會建立一個新版本。', '新範本', '建立範本', '編輯範本', '範本詳情', '刪除範本', '仲未有提示範本', '建立範本，或者複製一個內置範本。'),
      columns: { name: '名稱', kind: '種類', currentVersion: '版本', description: '描述', isBuiltIn: '來源', id: 'ID', lastUpdateUtc: '更新時間' },
      fields: { name: '名稱', kind: '種類', description: '描述' }
    },
    mcpServers: {
      ...rp('MCP 伺服器', '代理程式用得到嘅 MCP 伺服器。標頭同環境可以引用機密。', '新增 MCP 伺服器', '建立 MCP 伺服器', '編輯 MCP 伺服器', 'MCP 伺服器詳情', '刪除 MCP 伺服器', '仲未有 MCP 伺服器', '登記一部 MCP 伺服器，等部署可以綁定佢。'),
      columns: { name: '名稱', transport: '傳輸方式', endpoint: '端點', required: '必需', active: '啟用', id: 'ID', createdUtc: '建立時間' },
      fields: {
        name: '名稱',
        transport: '傳輸方式',
        description: '描述',
        url: '基礎 URL',
        path: 'MCP 路徑',
        headers: '標頭',
        headerName: '名稱',
        headerValue: '值範本',
        command: '指令',
        arguments: '參數',
        environment: '環境',
        requiredTools: '必需工具',
        toolTimeoutSeconds: '工具逾時（秒）',
        required: '連唔到就令執行失敗',
        active: '啟用'
      },
      hints: { requiredTools: '如果缺少列出咗嘅工具，預檢會喺啟動之前令執行失敗。' },
      actions: { test: '測試連線' }
    },
    secrets: {
      errors: { expiryPast: '請揀一個將來嘅到期時間，或者留空等機密永遠唔會過期。' },
      ...rp('機密', 'Harness 同整合用嘅加密憑證。數值只寫唔讀。', '新增機密', '建立機密', '編輯機密', '機密詳情', '刪除機密', '仲未有機密', '加入你啲代理程式需要嘅 API 金鑰或者權杖，例如 Anthropic API 金鑰。'),
      notSet: '未設定',
      neverRefreshed: '未更新過',
      reauth: { title: '呢個登入要重新驗證', since: '由 {{time}} 開始', action: '用緊呢個機密嘅執行會一直失敗，直至你換咗佢嘅數值。請用獨立嘅 CODEX_HOME 行 codex login 重新登入，再用「設定數值」儲存新嘅 auth.json，或者將部署改用 OpenAI API 金鑰機密。唔好喺另一部機繼續用同一個登入：兩份副本共用同一個更新權杖。' },
      columns: { status: '狀態', accessTokenExpiresUtc: '存取權杖到期時間', name: '名稱', kind: '種類', valueLast4: '數值', rotatedUtc: '最後變更', expiresUtc: '到期', active: '啟用', id: 'ID' },
      fields: { refreshedUtc: 'Garrison 上次更新', accessTokenExpiresUtc: '存取權杖到期時間', name: '名稱', kind: '種類', description: '描述', value: '數值', newValue: '新數值', expiresUtc: '到期', active: '啟用' },
      hints: { expiresUtc: '一定要係將來嘅時間。留空就代表機密永遠唔會過期。', kind: '喺共用伺服器用訂閱權杖可能違反供應商條款。共用部署最好用 API 金鑰。' },
      actions: { setValue: '設定數值', rotate: '輪換' }
    },
    workspaces: {
      ...rp('工作區', '執行工作區點樣準備：空白、由 Git 複製，或者預先放入檔案。', '新增工作區範本', '建立工作區範本', '編輯工作區範本', '工作區範本詳情', '刪除工作區範本', '仲未有工作區', '建立一個工作區範本，等部署可以由儲存庫或者檔案開始。'),
      columns: { name: '名稱', kind: '種類', gitUrl: '儲存庫', retention: '保留', active: '啟用', id: 'ID', createdUtc: '建立時間' },
      fields: { name: '名稱', kind: '種類', description: '描述', gitUrl: '儲存庫 URL', gitRef: '分支、標記或者 commit', gitDepth: '複製深度', gitCredentialSecretId: 'Git 憑證', persistentVolumeClaim: 'PersistentVolumeClaim 名稱', files: '檔案', filePath: '路徑', fileContent: '內容', retention: '保留', active: '啟用' },
      hints: { persistentVolumeClaim: '執行命名空間入面一個已經存在嘅 Claim。只有用 Kubernetes Job 執行器嘅部署先可以用呢個工作區；內容會喺每次執行之間保留。' },
      errors: { claimName: '請用細楷字母、數字、連字號同句點，開頭同結尾要係字母或者數字。' }
    },
    modelPrices: {
      ...{"title": "模型價格", "subtitle": "執行器冇報告費用時，用操作員設定嘅美元費率估算。已報告費用（包括零）優先。", "add": "新增模型價格", "create": "建立模型價格", "edit": "編輯模型價格", "view": "模型價格詳情", "deleteTitle": "刪除模型價格", "emptyTitle": "未有模型價格", "emptyBody": "為執行器同實際使用嘅精確模型名稱新增價格。唔會預設供應商費率。"},
      columns: {"name": "名稱", "active": "啟用", "id": "ID", "createdUtc": "建立時間", "model": "實際使用嘅模型", "harnessType": "執行器", "inputUsdPerMillion": "輸入美元 / 百萬權杖", "outputUsdPerMillion": "輸出美元 / 百萬權杖"},
      fields: {"name": "名稱", "description": "描述", "active": "啟用", "model": "實際使用嘅模型", "harnessType": "執行器", "inputUsdPerMillion": "輸入美元 / 百萬權杖", "outputUsdPerMillion": "輸出美元 / 百萬權杖", "cachedInputUsdPerMillion": "快取輸入美元 / 百萬權杖", "reasoningUsdPerMillion": "推理美元 / 百萬權杖", "inputIncludesCachedTokens": "輸入計數包含快取權杖", "outputIncludesReasoningTokens": "輸出計數包含推理權杖"},
      hints: {"cachedInputUsdPerMillion": "留空會用對應嘅輸入或輸出費率。零代表免費。", "reasoningUsdPerMillion": "留空會用對應嘅輸入或輸出費率。零代表免費。", "inputIncludesCachedTokens": "輸入計數包含快取權杖時啟用。Claude Code會分開報告快取讀取，應該停用呢項。", "outputIncludesReasoningTokens": "輸出計數包含推理權杖時啟用。先扣除已包含嘅子計數，再套用單獨費率。"},
      errors: {"rate": "請輸入0至1,000,000,000之間嘅有限費率。零係有效值。", "model": "請輸入1至256個字元、冇控制字元嘅精確模型名稱。"}
    },
    usageQuotas: {"title": "使用配額", "subtitle": "租戶、代理或者部署嘅UTC每日執行數、權杖數、已知費用上限同目前並行上限。", "add": "新增使用配額", "create": "建立使用配額", "edit": "編輯使用配額", "view": "使用配額詳情", "deleteTitle": "刪除使用配額", "emptyTitle": "未有使用配額", "emptyBody": "為租戶、代理或者部署新增配額。留空嘅限制代表無限制。", "columns": {"name": "名稱", "active": "啟用", "id": "ID", "createdUtc": "建立時間", "scope": "範圍", "resourceId": "目標資源", "dailyRunLimit": "每UTC日執行數", "dailyTokenLimit": "每UTC日權杖數", "dailyCostUsdLimit": "每UTC日已知美元", "maxConcurrentRuns": "最多活躍執行數", "enforcementEnabled": "套用限制"}, "fields": {"name": "名稱", "description": "描述", "active": "啟用", "scope": "範圍", "resourceId": "目標資源", "dailyRunLimit": "每UTC日執行數", "dailyTokenLimit": "每UTC日權杖數", "dailyCostUsdLimit": "每UTC日已知美元", "maxConcurrentRuns": "最多活躍執行數", "enforcementEnabled": "套用限制"}, "hints": {"dailyRunLimit": "留空代表無限制，零代表禁止使用。每日計數喺UTC午夜重設；並行計數係目前活躍執行數。 只有啟用限制套用之後先會套用限制。", "dailyTokenLimit": "留空代表無限制，零代表禁止使用。每日計數喺UTC午夜重設；並行計數係目前活躍執行數。 只有啟用限制套用之後先會套用限制。", "dailyCostUsdLimit": "留空代表無限制，零代表禁止使用。每日計數喺UTC午夜重設；並行計數係目前活躍執行數。 只有啟用限制套用之後先會套用限制。", "maxConcurrentRuns": "留空代表無限制，零代表禁止使用。每日計數喺UTC午夜重設；並行計數係目前活躍執行數。 只有啟用限制套用之後先會套用限制。", "resourceId": "為租戶、代理或者部署新增配額。留空嘅限制代表無限制。", "enforcementEnabled": "預設關閉。明確啟用之後，先會喺達到限制時拒絕執行，同降低支援嘅執行器預算。關閉時只記錄使用量，唔影響執行。"}, "errors": {"limit": "請輸入欄位範圍內嘅非負限制。計數必須係整數。"}, "incomplete": "成本統計唔完整：{{count}} 個已完成執行冇報告或估算成本。只有啟用限制套用之後先會套用限制；缺少成本本身唔會阻止執行。", "actions": {"usage": "每日使用量"}, "usage": {"windowStartUtc": "視窗開始 (UTC)", "windowEndUtc": "每日重設 (UTC)", "runsUsed": "已接收執行", "tokensUsed": "已完成權杖數", "costUsd": "已知費用 (USD)", "unknownCostRuns": "缺少費用嘅執行", "activeRuns": "活躍執行"}},
    artifactStores: {
      ...rp('成品存放區', '存放執行產生嘅檔案嘅地方。', '新增成品存放區', '建立成品存放區', '編輯成品存放區', '成品存放區詳情', '刪除成品存放區', '仲未有成品存放區', '建立一個成品存放區嚟保存執行輸出。'),
      columns: { name: '名稱', kind: '種類', description: '描述', active: '啟用', id: 'ID', createdUtc: '建立時間' },
      fields: { name: '名稱', kind: '種類', description: '描述', active: '啟用' }
    },
    agents: {
      deleteWithDeployments_other: '確定要刪除「{{name}}」同佢嘅 {{count}} 個部署？下面啲部署都會一齊刪咗。刪咗就冇得復原。',
      deleteWithDeployments_one: '確定要刪除「{{name}}」同佢嘅 {{count}} 個部署？下面個部署都會一齊刪咗。刪咗就冇得復原。',
      deleteNoDeployments: '確定要刪除「{{name}}」？佢冇任何部署。刪咗就冇得復原。',
      ...rp('代理程式', '經 REST、MCP 同 A2A 公開嘅具名功能。佢哋點樣運行由部署決定。', '新增代理程式', '建立代理程式', '編輯代理程式', '代理程式詳情', '刪除代理程式', '仲未有代理程式', '新增一個代理程式，或者喺「配置 > 清單」套用範例清單。'),
      sections: { identity: '身份', exposure: '公開方式', io: '輸入同輸出', delegation: '委派' },
      columns: { name: '名稱', displayName: '顯示名稱', kind: '種類', exposure: '公開方式', delegationMode: '委派', tags: '標記', active: '啟用', id: 'ID', createdUtc: '建立時間' },
      fields: {
        name: '名稱',
        displayName: '顯示名稱',
        description: '描述',
        kind: '種類',
        agentVersion: '版本',
        tags: '標記',
        remoteProtocol: '遠端協定',
        remoteEndpointUrl: '遠端端點 URL',
        exposeA2A: '經 A2A 公開',
        exposeMcpTool: '公開做獨立 MCP 工具',
        mcpToolName: 'MCP 工具名稱',
        skills: 'A2A 技能',
        skillId: '技能 ID',
        skillName: '名稱',
        skillDescription: '描述',
        inputMode: '輸入模式',
        inputSchemaJson: '輸入 JSON Schema',
        outputSchemaJson: '輸出 JSON Schema',
        delegationMode: '委派',
        delegationAllowList: '可以呼叫嘅代理程式',
        delegationMaxDepth: '最大深度',
        delegationAllowRecursion: '允許遞迴',
        active: '啟用'
      },
      hints: { name: '細楷字母、數字同連字號。會用喺 URL 同 A2A 卡入面。' },
      errors: { dnsName: '請用細楷字母、數字同連字號，開頭同結尾一定要係字母或者數字。' }
    },
    deployments: {
      approvalsOn_one: '開咗，{{count}} 條規則',
      approvalsOn_other: '開咗，{{count}} 條規則',
      approvalsOff: '關閉',
      promptRoles: { Repair: '結構化輸出修復', DelegatedTask: '委派執行嘅任務包裝', Task: '任務包裝', System: '系統提示', ConversationFallback: '對話回退（紀錄）' },
      ...rp('部署', '將代理程式綁定到 Harness 設定檔、提示、機密、MCP 伺服器、排程放置同限制。', '新增部署', '建立部署', '編輯部署', '部署詳情', '刪除部署', '仲未有部署', '建立一個部署，等代理程式可以執行。'),
      steps: { approvals: '批核', basics: '基本', harness: 'Harness', prompts: '提示', resources: '資源', overrides: '覆寫', placement: '排程放置同限制' },
      columns: { approvalsEnabled: '批核', name: '名稱', agentId: '代理程式', harnessProfileId: 'Harness 設定檔', model: '模型', executor: '執行器', weight: '權重', configVersion: '配置版本', active: '啟用', id: 'ID', createdUtc: '建立時間' },
      fields: {
        approvalsEnabled: '工具呼叫前先問（批核）',
        approvalDefaultAction: '冇規則符合嘅時候',
        approvalTimeoutSeconds: '批核逾時（秒）',
        approvalTimeoutDecision: '冇人回應嘅決定',
        approvalRules: '批核規則',
        ruleAction: '動作',
        rulePattern: '規則',
        ruleInputPattern: '輸入模式',
        ruleDescription: '描述',
        approvalTest: '測試工具呼叫',
        name: '名稱',
        agentId: '代理程式',
        description: '描述',
        weight: '流量權重',
        active: '啟用',
        harnessProfileId: 'Harness 設定檔',
        model: '模型',
        fallbackModel: '後備模型',
        effort: '投入程度',
        maxTurns: '最多回合',
        maxBudgetUsd: '最高預算（USD）',
        parameters: '參數',
        paramName: '名稱',
        paramValue: '值',
        promptBindings: '提示綁定',
        promptRole: '角色',
        template: '範本',
        pinnedVersion: '固定版本',
        resourceBindings: '資源綁定',
        bindingKind: '種類',
        alias: '別名',
        resource: '資源',
        workspaceTemplateId: '工作區範本',
        artifactStoreId: '成品存放區',
        argumentOverrides: '參數覆寫',
        operation: '操作',
        match: '比對',
        argTemplate: '範本',
        condition: '條件',
        environmentOverrides: '環境覆寫',
        envName: '名稱',
        envValue: '值範本',
        isSecret: '機密',
        fileOverrides: '檔案覆寫',
        allowedRunOverrides: '呼叫者每次執行可以設定嘅覆寫',
        validation: '驗證',
        pattern: '模式或者數值',
        nodePoolId: '節點池',
        nodeSelector: '節點選擇器',
        maxConcurrentRuns: '最大同時執行數',
        timeoutSeconds: '逾時（秒）',
        maxAttempts: '最多嘗試次數',
        repetitionGuard: '重複防護',
        maxAssistantChars: '最大助理字元數',
        noProgressSeconds: '冇進展逾時（秒）',
        executor: '執行器',
        podCpuRequest: 'CPU 請求',
        podCpuLimit: 'CPU 上限',
        podMemoryRequest: '記憶體請求',
        podMemoryLimit: '記憶體上限',
        podEphemeralStorageRequest: '臨時儲存請求',
        podEphemeralStorageLimit: '臨時儲存上限'
      },
      hints: {
        approvalsEnabled: '適用於 Claude Code 設定檔，同埋用 Codex app-server 嘅設定檔。其他 Harness 冇批核掛鈎，所以伺服器會拒絕佢哋用呢個設定。',
        approvalDefaultAction: '「問人」會喺批核收件匣度等，直至有人決定或者過咗逾時時間。',
        approvalTimeoutSeconds: '由 10 至 3,600 秒。留空就用 300。',
        approvalRules: '「拒絕」凌駕「問人」，「問人」凌駕「允許」。例子：Bash(npm test)、Bash(npm run *)、Edit(src/**)、WebFetch(domain:example.com)、mcp__github__*。',
        secretsKinds: 'Harness 設定檔 {{profile}} 需要任何一個類型係 {{kinds}} 嘅機密。用咩別名綁定都得。',
        secretsAliases: 'Harness 設定檔 {{profile}} 會讀用呢啲別名綁定嘅機密：{{aliases}}。',
        secretsNone: 'Harness 設定檔 {{profile}} 唔會讀任何機密，所以唔使綁定機密。',
        promptBindings: '將提示角色（System、Task、DelegatedTask，同 Harness 設定檔用到嘅任何角色）對應到範本。版本留空就會跟最新版本。',
        resourceBindings: '別名會變成範本變數，例如 {{secret.anthropic}}。',
        weight: '冇指明部署嘅請求，會按權重分配畀啟用中嘅部署。',
        maxConcurrentRuns: '0 即係冇上限。',
        timeoutCap: '叢集設定 {{setting}} 將每個執行限制喺 {{value}} 秒。',
        zeroUnlimited: '0 即係唔設上限。',
        zeroOff: '0 即係熄咗呢個防護。',
        guardDefault: '留空就用 {{setting}} 嘅叢集預設值 {{value}}。',
        guardDefaultUnknown: '留空就用叢集設定 {{setting}}。',
        guardOwn: '已經喺呢個部署設定咗。叢集預設值（{{setting}}）係 {{value}}。',
        guardOwnUnknown: '已經喺呢個部署設定咗，唔用叢集設定 {{setting}}。',
        guardFollowing: '跟緊 {{setting}} 嘅叢集預設值 {{value}}。',
        executorInherit: '留空就用節點池嘅預設值：{{executor}}。',
        executorSet: '程序喺 worker 入面執行 harness；Kubernetes Job 就喺佢自己嘅 Pod 入面執行。',
        podCpuRequest: 'Pod 資源只適用於 Kubernetes Job 執行。請用 Kubernetes 數量，例如 500m、2、512Mi 或者 4Gi；留空就用 worker 預設值。'
      },
      actions: { addRule: '新增規則', compilePreview: '編譯預覽', test: '測試調用', useClusterDefault: '用叢集預設值' },
      sections: {
        guards: '執行防護',
        execution: '執行器同 Pod 資源'
      },
      placeholders: {
        ruleInputPattern: '可選，用嚟比對輸入 JSON 嘅正規表達式',
        clusterDefault: '叢集預設值（{{value}}）',
        clusterDefaultUnknown: '叢集預設值'
      },
      executorInherit: '節點池預設值',
      executorInheritShort: '節點池預設',
      errors: { rulePatternRequired: '請輸入規則模式。', rulePatternOneLine: '規則模式一定要寫喺同一行。', rulePatternTooLong: '規則模式最多只可以有 1,000 個字元。', tooManyRules: '一個部署最多只可以有 500 條批核規則。', approvalTimeout: '請輸入 10 至 3,600 之間嘅整數秒數。', quantity: '請用 Kubernetes 數量，例如 500m、2、512Mi 或者 4Gi。' },
      guardStates: {
        on: '開',
        off: '熄'
      }
    },
    nodePools: {
      ...rp('節點池', '按標籤將工作節點分組，亦可以專門分配畀指定租用戶。', '新增節點池', '建立節點池', '編輯節點池', '節點池詳情', '刪除節點池', '仲未有節點池', '建立一個節點池嚟預留專用容量。'),
      allTenants: '所有租用戶',
      columns: { name: '名稱', description: '描述', tenants: '租用戶', defaultExecutor: '預設執行器', active: '啟用', id: 'ID', createdUtc: '建立時間' },
      fields: { name: '名稱', description: '描述', defaultExecutor: '預設執行器', tenants: '允許嘅租用戶 ID', active: '啟用' },
      hints: { tenants: '留空就允許所有租用戶。' }
    },
    runs: {
      ...rp('執行', '每次代理程式調用，連同佢嘅狀態、節點、時長同結果。', '新增執行', '建立執行', '編輯執行', '執行詳情', '刪除執行', '仲未有執行', '調用一個代理程式就會開始一次執行。'),
      columns: {
        approvalWaitMs: '批核等候',
        delegationWaitMs: '委派等候時間',
        timeToFirstTokenExcludingDelegationMs: 'TTFT（唔計委派）',
        id: '執行',
        agentName: '代理程式',
        status: '狀態',
        outcome: '結果',
        harnessType: 'Harness',
        leaseNodeName: '節點',
        timeToFirstTokenMs: 'TTFT',
        streamingMs: '串流',
        executionMs: '時長',
        queueMs: '排隊時間',
        totalMs: '總時間',
        inputTokens: '輸入 Token',
        outputTokens: '輸出 Token',
        cachedTokens: '快取 Token',
        reasoningTokens: '推理 Token',
        outputTokensPerSecond: 'Token/秒',
        costUsd: '成本',
        toolCallCount: '工具呼叫',
        depth: '深度',
        createdUtc: '建立時間',
        conversationId: '對話'
      },
      actions: { cancel: '取消執行', retry: '重試執行' },
      toasts: { cancelRequested: '已要求取消。', retried: '已開始重試。' },
      turn: '第 {{turn}} 輪'
    },
    nodes: {
      ...rp('節點', '租用同執行任務嘅工作節點。維護之前請先封鎖或者清空節點。', '新增節點', '建立節點', '編輯節點', '節點詳情', '刪除節點', '仲未有節點', '工作節點啟動嗰陣會自動登記。請部署 worker StatefulSet，或者喺本機運行 Garrison.Worker。'),
      columns: { name: '名稱', status: '狀態', capacity: '執行', harnesses: 'Harness', executors: '執行器', containerized: '容器化', labels: '標籤', nodeVersion: '版本', lastHeartbeatUtc: '最後心跳', id: 'ID' },
      fields: { address: '地址', maxConcurrentRuns: '容量', childReserveSlots: '子執行預留', maxResidentWaiters: '最多等緊嘅執行', activeRuns: '進行中嘅執行', capabilities: '能力', detectedVersion: '版本', available: '可用', detail: '詳情' },
      actions: { cordon: '封鎖', uncordon: '解除封鎖', drain: '清空', runs: '睇執行', grafana: '喺 Grafana 打開' },
      toasts: { cordoned: '節點已封鎖。', uncordoned: '節點已解除封鎖。', draining: '節點清空緊。' }
    },
    controlNodes: {
      ...rp('控制平面', '提供 API、MCP 同 A2A，並且排程執行嘅伺服器副本。每個副本會自己登記，每 5 秒發一次心跳。', '新增控制節點', '建立控制節點', '編輯控制節點', '控制節點詳情', '刪除控制節點', '冇回報任何控制節點', '伺服器副本一啟動，控制節點就會喺度出現。比呢個主控台舊嘅伺服器唔會回報控制節點。'),
      columns: { name: '名稱', status: '狀態', version: '版本', schemaVersion: '結構版本', backplane: '事件匯流排', uptime: '運行時間', lastHeartbeatUtc: '最後心跳', activeRequests: '請求', openStreams: '串流', heldLongPolls: '長輪詢', address: '位址', hostname: '主機名稱', startedUtc: '啟動時間', id: 'ID' },
      fields: { name: '名稱', id: '節點 ID', hostname: '主機名稱', address: '位址', isLeader: '領導者', leaderEpoch: '領導者紀元', version: '版本', schemaVersion: '資料庫結構版本', backplane: '事件匯流排', startedUtc: '啟動時間', uptime: '運行時間', lastHeartbeatUtc: '最後心跳', activeRequests: '處理緊嘅請求', openStreams: '開咗嘅串流', heldLongPolls: '保留緊嘅長輪詢', respondingNodeId: '回應嘅副本' },
      leader: '領導者',
      stale: '冇心跳',
      answeredBy: '邊個副本回應：{{node}}',
      answeredByLeader: '邊個副本回應：{{node}}（領導者）',
      actions: { grafana: '喺 Grafana 打開' }
    },
    audit: {
      ...rp('審計', '呢個租用戶嘅驗證、授權同配置事件。', '新增記錄', '建立記錄', '編輯記錄', '審計記錄詳情', '刪除記錄', '仲未有審計記錄', '當有人或者代理程式用 Garrison，保安事件就會喺度出現。'),
      emptyTitle: '仲未有審計記錄',
      columns: { createdUtc: '時間', eventType: '事件', principalName: '主體', resource: '資源', reason: '原因', sourceIp: '來源 IP', id: 'ID' },
      fields: {
        eventType: '事件',
        principalType: '主體類型',
        principalName: '主體',
        principalId: '主體 ID',
        resourceType: '資源類型',
        resourceId: '資源 ID',
        operation: '操作',
        method: '方法',
        path: '路徑',
        authResult: '驗證結果',
        authorizationResult: '授權結果',
        reason: '原因',
        bypassReason: '略過原因',
        statusCode: '狀態碼',
        sourceIp: '來源 IP',
        requestId: '請求 ID',
        createdUtc: '時間'
      }
    },
    manifestApplies: {
      ...rp('套用記錄', '每次清單套用同試行，連同每份文件嘅結果。', '新增記錄', '建立記錄', '編輯記錄', '套用詳情', '刪除記錄', '仲未有套用記錄', '你套用或者試行一份清單之後，記錄就會喺度出現。'),
      columns: { createdUtc: '時間', principalName: '套用者', dryRun: '試行', counts: '結果' }
    },
    conversations: {
      title: '對話',
      subtitle: '與代理程式嘅多輪交流。每一輪都係一次執行，會恢復上一輪嘅 Harness 工作階段。',
      add: '新增對話',
      create: '建立對話',
      edit: '編輯對話',
      view: '對話詳細資料',
      deleteTitle: '刪除對話',
      emptyTitle: '仲冇對話',
      emptyBody: '在「調用」頁面選擇「開始新對話」來建立一個，或傳送 A2A 訊息：每個 A2A 情境都係一個對話。',
      untitled: '未命名對話',
      columns: {
        title: '標題',
        agentName: '代理程式',
        state: '狀態',
        turnCount: '輪數',
        affinityNodeName: '親和節點',
        fallbackCount: '回退次數',
        lastFallbackReason: '最近一次回退',
        harnessType: 'Harness',
        callerName: '發起者',
        contextId: '情境 ID',
        sessionId: '工作階段 ID',
        lastActivityUtc: '最近活動',
        createdUtc: '建立時間',
        id: 'ID'
      },
      states: {
        busy: '處理中',
        idle: '閒置'
      },
      actions: {
        continue: '繼續',
        runs: '以執行形式睇各輪'
      }
    }
  },
  views: {
    approvalDetail: {
      title: '批核',
      titleWithTool: '{{tool}} 嘅批核',
      backToInbox: '所有批核',
      pending: '等緊有人允許或者拒絕呢個工具呼叫。',
      pendingExpires: '等緊有人處理。如果冇人決定，佢會喺 {{when}} 到期，並用 {{decision}} 呢個決定。',
      request: '要求',
      rules: '規則',
      noRule: '冇規則符合',
      noInput: '冇記錄到任何輸入。',
      notFoundTitle: '搵唔到批核',
      notFoundBody: '佢可能屬於另一個租用戶，或者 ID 唔啱。'
    },
    home: {
      observabilityState: { reachable: '連得到', unreachable: '連唔到', checking: '檢查緊', unknown: '狀態未知' },
      observabilityVersion: '版本 {{version}}',
      observabilityOpen: '打開 {{service}}',
      kpisGrafana: '喺 Grafana 打開總覽',
      grafanaDashboards: 'Grafana 儀表板',
      grafanaSections: { overview: '總覽', http: 'HTTP API', runs: '執行', agents: '代理程式', models: '模型同權杖', workers: '工作節點', kubernetes: 'Kubernetes 執行器', protocols: '協定', scheduler: '排程器同佇列', database: '資料庫', controlPlane: '控制平面', security: '安全同驗證', integrations: '整合', logs: '日誌同追蹤' },
      observabilitySetup: '設定可觀測性',
      observabilityNone: '呢個環境冇設定任何可觀測性服務（Grafana、Prometheus、Tempo 或者 Loki）。',
      observability: '可觀測性',
      title: '主頁',
      subtitle: '你啲代理程式同工作節點而家做緊乜。',
      lastLoaded: '{{time}} 更新',
      partial: '有啲面板載入唔到，顯示嘅數值唔齊全。',
      getStartedTitle: '呢個租用戶仲未有代理程式',
      getStartedBody: '設定精靈會幫你加一個憑證、套用一個範例代理程式，再行一次測試。',
      runSetup: '開始設定',
      kpis: {
        agents: '代理程式',
        deployments: '部署',
        activeRuns: '進行中嘅執行',
        queued: '排隊中',
        succeeded: '成功',
        failed: '失敗',
        nodes: '就緒節點',
        controlNodes: '控制平面就緒',
        nodesNote: '就緒 / 總數',
        last24h: '過去 24 小時'
      },
      requestActivity: 'API 請求活動',
      nodesTitle: '節點',
      noNodesTitle: '未有登記咗嘅工作節點',
      noNodesBody: '啟動 Garrison.Worker，或者擴展 worker StatefulSet。節點會自己登記。',
      nodeLoad: '{{active}} / {{max}} 個執行',
      controlPlaneSection: '控制平面',
      workersSection: '工作節點',
      openControlPlane: '睇晒全部',
      openWorkers: '睇晒全部',
      noControlNodes: '仲未有控制節點登記。',
      controlNodesUnavailable: '顯示唔到控制節點：伺服器比呢個主控台舊，或者你冇權讀取節點。',
      recentFailures: '最近失敗',
      noFailures: '最近冇失敗嘅執行。',
      cta: {
        title: '常用操作',
        invoke: '調用代理程式',
        addAgent: '新增代理程式',
        applyManifest: '套用清單',
        inspectRuns: '檢查執行',
        nodes: '檢查工作節點',
        apiExplorer: '打開 API 探索器',
        analytics: '睇執行分析'
      },
      externalServices: '外部服務',
      externalServicesNote: '隨附嘅可觀測性工具。分享呢個部署之前，請改咗預設憑證先。',
      externalServicesNone: '呢個部署冇設定任何外部服務。',
      credentials: '預設憑證',
      services: { loki: 'Loki', grafana: 'Grafana', prometheus: 'Prometheus', tempo: 'Tempo' }
    },
    markdown: {
      showRaw: '顯示原始文字',
      showRendered: '顯示格式化內容'
    },
    invoke: {
      stream: {
        tabsLabel: '回應檢視',
        cardLabel: '執行輸出',
        preview: '預覽',
        response: '回應',
        starting: '開緊執行...',
        live: '即時',
        finished: '完成咗',
        elapsed: '用咗時間',
        firstToken: '第一個 Token',
        tokensPerSecond: '速度',
        finishedHint: '執行完成咗。',
        showResponse: '睇回應',
        reasoning: '推理過程',
        waiting: '等緊輸出...',
        waitingCodex: '等緊輸出。Codex 會喺完成嗰陣一次過送出答案。',
        codexNote: 'Codex 唔支援串流：執行完咗嗰陣，答案會一次過喺呢度出現。',
        noText: '呢次執行冇串流文字。結果喺「回應」分頁度。',
        jump: '跳去最新',
        tool: {
          running: '執行緊',
          ok: '成功',
          failed: '失敗'
        }
      },
      noDeployment: '呢個代理程式冇權重大過零嘅啟用部署，所以調用會俾人拒絕。請喺「部署」分頁加一個部署，或者調高某個部署嘅權重。',
      title: '調用',
      subtitle: '傳訊息畀代理程式，即時睇住對話記錄串流出嚟。',
      request: '請求',
      agent: '代理程式',
      deployment: '部署',
      weighted: '任何啟用中嘅部署（按權重）',
      default: '部署預設值',
      message: '訊息',
      messagePlaceholder: '你想代理程式做乜？',
      shortcut: '撳 Ctrl+Enter 或者 Cmd+Enter 就可以傳送。',
      send: '傳送',
      sending: '傳送緊...',
      openRun: '打開執行',
      idleTitle: '仲未有執行',
      idleBody: '傳一個訊息就會開始執行，對話記錄會喺度即時串流出嚟。',
      noAgentsTitle: '冇代理程式可以調用',
      noAgentsBody: '建立一個代理程式同一個部署，或者套用範例清單。',
      applySample: '去清單',
      stopOnLeave: '離開時停止執行',
      cancel: '取消執行',
      cancelling: '取消緊...',
      timeLimit: '時間限制',
      timeLimitPlaceholder: '部署預設值',
      timeLimitClear: '用返預設值',
      timeLimitRange: '容許範圍：{{min}} 至 {{max}}。',
      timeLimitAny: '執行喺逾時之前可以用嘅秒數。',
      timeLimitCap: '叢集會喺 {{max}} 之後停止每個執行。',
      timeLimitErrors: {
        notInteger: '請輸入整數秒數。',
        range: '請輸入 {{min}} 至 {{max}} 之間嘅時間限制。',
        aboveCap: '叢集每個執行最多容許 {{max}}。'
      },
      timeUnits: {
        seconds: '{{value}} 秒',
        minutes: '{{value}} 分鐘',
        hours: '{{value}} 小時',
        secondsWord: '秒'
      },
      conversation: {
        mode: '對話',
        modes: {
          none: '單次執行（唔用對話）',
          start: '開始新對話',
          continue: '繼續對話'
        },
        pick: '要繼續嘅對話',
        choose: '選擇對話',
        option: '{{title}}（輪數：{{turns}}）',
        pinned: '每一輪都在對話第一輪嘅部署上執行，因此呢度冇辦法選擇部署。',
        busy: '呢個對話仲喺度處理上一輪。在該執行結束之前，新嘅訊息會被拒絕。',
        open: '打開對話（第 {{turn}} 輪）'
      }
    },
    runDetail: {
      awaitingApproval_one: '呢個執行等緊有人批核 {{count}} 個工具呼叫。',
      awaitingApproval_other: '呢個執行等緊有人批核 {{count}} 個工具呼叫。',
      reviewApprovals: '審閱',
      approvals_one: '批核（{{count}}）',
      approvals_other: '批核（{{count}}）',
      noApprovals: '呢個執行未有要求過任何批核。',
      openApproval: '打開批核',
      viewTrace: '睇追蹤',
      viewLogs: '睇日誌',
      traceId: '追蹤 ID',
      deploymentDeleted: '呢個執行用嘅部署已經刪咗，所以冇得重試。請再調用代理程式 {{agent}} 一次。',
      templatesUsed: '用咗嘅範本',
      agentDeleted: '代理程式 {{agent}} 已經唔存在，所以呢個執行冇得重試。佢嘅記錄、對話記錄同遙測仍然可以喺度睇。',
      title: '執行',
      titleWithAgent: '{{agent}} 嘅執行',
      deployment: '部署',
      model: '實際使用模型',
      tokensLabel: 'Token',
      tokens: '輸入 {{input}}，輸出 {{output}}',
      estimated: '估算',
      caller: '呼叫者',
      parent: '上層執行',
      attempt: '嘗試次數',
      outputSchema: '輸出結構',
      outputSchemaStates: {
        valid: '有效',
        validAfterRepair: '修復一次之後有效',
        invalid: '無效',
        invalidAfterRepair: '修復一次之後仍然無效'
      },
      started: '開始時間',
      completed: '完成時間',
      exitCode: '結束碼',
      transcript: '對話記錄',
      result: '結果',
      input: '輸入',
      stderr: 'Stderr',
      children_one: '子執行（{{count}}）',
      children_other: '子執行（{{count}}）',
      eventFilter: '顯示',
      eventCount_one: '{{count}} 個事件',
      eventCount_other: '{{count}} 個事件',
      noEvents: '仲未有事件。Harness 產生事件嗰陣就會喺度出現。',
      failed: '失敗',
      noResult: '呢次執行冇產生任何結果文字。',
      pending: '執行完成之後就會顯示結果。',
      structuredOutput: '結構化輸出',
      templateVersions: '用咗嘅提示範本版本',
      noStderr: '冇擷取到任何 stderr。',
      noChildren: '呢次執行冇委派畀其他代理程式。',
      confirmCancel: '確定要取消呢次執行？Harness 程序會喺佢嘅節點度停止。',
      notFoundTitle: '搵唔到呢次執行',
      notFoundBody: '佢可能已經被刪除，或者屬於另一個租用戶。',
      telemetry: {
        approvalNote: '呢個執行用咗 {{wait}} 等批核決定。執行時間包括呢段等候。',
        delegationNote: '呢個執行等咗委派執行 {{wait}}。第一個 Token 時間計埋呢段等候係 {{ttft}}，唔計就係 {{excluding}}；同唔委派嘅代理程式比較就要用後者。',
        title: '遙測',
        phases: '各階段執行時間',
        phase: { delegation: '等緊委派執行', queue: '排隊', startup: '啟動至第一個 Token', streaming: '串流', tail: '最後一個 Token 之後' },
        fields: {
          approvalWaitMs: '批核等候',
          delegationWaitMs: '委派等候時間',
          timeToFirstTokenExcludingDelegationMs: '第一個 Token 時間（唔計委派）',
          timeToFirstTokenMs: '第一個 Token 時間',
          streamingMs: '串流時間',
          executionMs: '執行時間',
          queueMs: '排隊時間',
          totalMs: '總時間',
          outputTokensPerSecond: '每秒輸出 Token',
          inputTokens: '輸入 Token',
          outputTokens: '輸出 Token',
          cachedTokens: '快取 Token',
          reasoningTokens: '推理 Token',
          toolCallCount: '工具呼叫',
          costUsd: '成本',
          firstTokenUtc: '第一個 Token 時間點',
          lastTokenUtc: '最後一個 Token 時間點'
        }
      },
      conversation: '對話',
      conversationSession: '工作階段',
      resumeSessionId: '恢復嘅工作階段',
      affinityNode: '親和節點',
      affinityUntil: '直到 {{time}}'
    },
    queue: {
      title: '隊列',
      subtitle: '按代理程式同 Harness 睇等緊節點、已租用同執行中嘅工作。',
      queued: '排隊中',
      leased: '已租用',
      running: '執行中',
      emptyTitle: '冇嘢等緊',
      emptyBody: '執行等緊工作節點嗰陣會喺度出現。'
    },
    agentDetail: {
      invoke: '調用',
      grafana: '喺 Grafana 打開',
      noActiveDeployment: '呢個代理程式冇啟用中嘅部署，所以調用會被拒絕。',
      deployments_one: '部署（{{count}}）',
      deployments_other: '部署（{{count}}）',
      recentRuns: '最近執行',
      card: 'A2A 卡',
      traffic: '流量分佈',
      noDeploymentsTitle: '冇部署',
      noDeploymentsBody: '建立一個部署，將呢個代理程式綁定到 Harness。',
      noRuns: '呢個代理程式仲未執行過。',
      selectionNote: '每次冇指明部署嘅調用，都會按權重比例隨機揀一個啟用中嘅部署。',
      manageDeployments: '管理部署',
      conversations: '對話'
    },
    templateEditor: {
      cloneToEdit: '複製一份嚟改',
      builtInReadOnly: '內置範本係唯讀嘅，所以呢度所有欄位都鎖咗。複製一份就可以攞到可以編輯嘅副本。',
      renameHint: '你可以幫呢個範本改名。部署用 ID 參照佢，所以綁定唔受影響；不過用名稱引入佢嘅範本就要自己手動更新。',
      cloneDialog: { taken: '已經有個叫 {{name}} 嘅範本。請揀過第二個名。', reserved: '以 builtin/ 開頭嘅名係留畀內置範本用嘅。', hint: '之後可以喺副本嘅頁面改名。', name: '副本名稱', body: '副本會用而家嘅內容做第 1 版，之後可以編輯、改名同刪除。', title: '複製 {{name}}' },
      newTitle: '新提示範本',
      subtitle: '寫好範本，用範例上下文預覽，然後儲存。',
      builtInNote: '內置範本係唯讀嘅。想自訂就複製一份，或者重設返原本隨附嘅內容。',
      content: '內容',
      changeNote: '變更備註',
      syntaxHint: '語法：{{variable}}、{{value | default: "x"}}、{{#if x}}...{{else}}...{{/if}}、{{#each list}}...{{/each}}、{{> template-name}}。',
      variables: '用咗嘅變數',
      noVariables: '冇引用任何變數。',
      preview: '即時預覽',
      sampleContext: '範例上下文（JSON）',
      rendered: '渲染結果',
      previewEmpty: '渲染出嚟嘅文字會喺度顯示。',
      missing: '缺少變數：{{list}}',
      versions_one: '版本（{{count}}）',
      versions_other: '版本（{{count}}）',
      noVersions: '仲未有已儲存嘅版本。',
      version: '版本',
      note: '備註',
      author: '作者',
      diff: '差異',
      restore: '還原',
      diffTitle: '版本 {{version}} 同編輯器內容比較',
      current: '編輯器',
      reset: '重設為預設',
      savedVersion: '已儲存新版本。',
      restored: '已還原版本 {{version}}。',
      resetDone: '已重設返原本隨附嘅內容。',
      confirm: {
        restoreTitle: '還原版本',
        restoreMessage: '確定要還原版本 {{version}}？目前嘅內容會保留喺歷史記錄。',
        resetTitle: '重設範本',
        resetMessage: '確定要將「{{name}}」重設返原本隨附嘅內容？',
        deleteTitle: '刪除範本',
        deleteMessage: '確定要刪除「{{name}}」？綁定咗佢嘅部署會編譯失敗。'
      }
    },
    manifests: {
      warnings_one: '{{count}} 個警告',
      warnings_other: '{{count}} 個警告',
      planned: '預計結果：{{result}}',
      changes: { count_other: '有 {{count}} 個欄位會改。', count_one: '有 {{count}} 個欄位會改。', empty: '（空白）', after: '改之後', before: '改之前', field: '欄位' },
      title: '清單',
      subtitle: '以程式碼形式套用配置。試行只會驗證，唔會寫入。',
      applyTab: '套用',
      exportTab: '匯出',
      historyTab: '記錄',
      upload: '上載檔案',
      loadSample: '載入範例',
      document: '清單（YAML 或者 JSON，可以有多份文件）',
      dryRun: '試行',
      apply: '套用',
      validated: '驗證完成。',
      applied: '已套用清單。',
      results: '結果',
      dryRunResults: '試行結果',
      kind: '種類',
      name: '名稱',
      result: '結果',
      message: '訊息',
      confirmTitle: '套用清單',
      confirmMessage: '確定要將呢份清單入面每份文件套用到目前嘅租用戶？',
      exportHelp: '匯出呢個租用戶嘅配置。機密數值永遠唔會匯出。',
      export: '匯出',
      download: '下載',
      counts: '{{created}} 個已建立，{{updated}} 個已更新，{{unchanged}} 個冇變更，{{failed}} 個失敗'
    },
    requests: {
      grafana: 'Grafana 嘅 HTTP 儀表板',
      title: '請求記錄',
      subtitle: '擷取咗嘅 API 流量。可以深入睇任何請求，同埋管理保留期。',
      kpis: { total: '保留咗嘅請求', success: '成功', failure: '失敗', avgDuration: '平均時長' },
      columns: { time: '時間', method: '方法', path: '路徑', status: '狀態', duration: '時長', principal: '主體' },
      bulkDeleteTitle: '刪除請求記錄',
      bulkDeleteMessage: '確定要刪除符合目前篩選條件嘅全部 {{count}} 個請求？',
      bulkDeleteAll: '刪除所有符合嘅',
      deleteOneTitle: '刪除請求',
      deleteOneMessage: '確定要刪除請求 {{id}}？',
      deleted: '已刪除。',
      emptyTitle: '冇請求記錄',
      emptyBodyNoTraffic: '仲未保留到任何 API 流量。',
      emptyBodyNoMatch: '冇請求符合目前嘅篩選條件。'
    },
    explorer: {
      title: 'API 探索器',
      subtitle: '根據呢部伺服器嘅 OpenAPI 文件，對佢執行即時呼叫。',
      operations: '操作',
      selectOperation: '揀一個操作嚟建立請求。',
      selectOperationOption: '揀一個操作...',
      pathParams: '路徑參數',
      queryParams: '查詢參數',
      headers: '標頭',
      addHeader: '新增標頭',
      headerName: '標頭名稱',
      headerValue: '標頭 {{name}} 嘅值',
      removeHeader: '移除標頭 {{name}}',
      body: '請求內容',
      resolvedUrl: '解析後 URL',
      copyUrl: '複製 URL',
      execute: '執行',
      executing: '執行緊...',
      stop: '停止',
      streaming: '串流中',
      response: '回應',
      responseHeaders: '回應標頭',
      responseBody: '回應內容',
      snippets: '程式碼片段',
      history: '最近請求',
      historyEmpty: '最近冇請求。',
      loadHistory: '載入',
      deleteHistory: '刪除',
      clearHistory: '清除記錄',
      required: '必填',
      confirmTitle: '執行破壞性操作',
      confirmMessage: '呢個 {{method}} 請求可能會修改或者刪除資料。確定繼續？',
      noSpecTitle: '冇 OpenAPI 文件',
      noSpecBody: '呢部伺服器冇傳回可用嘅 /openapi.json 文件，所以 API 探索器列唔到操作。'
    },
    settings: {
      errors: { allowed: '請喺以下值之中揀一個：{{values}}。', boolean: '請揀 true 或者 false。', max: '請輸入唔多過 {{max}} 嘅值。', min: '請輸入唔少過 {{min}} 嘅值。', range: '請輸入 {{min}} 至 {{max}} 之間嘅值。', integer: '請輸入整數。', number: '請輸入數字。' },
      notSaved: '乜都冇儲存到。請改好標示咗嘅設定，再儲存一次。',
      title: '設定',
      subtitle: '嚟自設定檔嘅伺服器設定，同埋儲存喺資料庫嘅叢集設定。',
      readOnly: '你而家係以唯讀模式睇設定。只有系統管理員先可以改。',
      restartBanner: '有啲已儲存嘅變更要重新啟動之後先生效。',
      restarting: '伺服器重新啟動緊。呢一頁會自動重新連線。',
      restarted: '伺服器已經重新上線。',
      restartTimeout: '伺服器三分鐘內都冇返嚟。請檢查 Pod 狀態。',
      restart: '重新啟動伺服器',
      restartConfirmTitle: '重新啟動伺服器',
      restartConfirmMessage: '確定要即刻重新啟動呢個控制平面節點？進行中嘅請求會先處理完，控制台會自動重新連線。',
      savedLive: '設定已儲存同套用。',
      savedRestart: '設定已儲存。要重新啟動伺服器，所有變更先會生效。',
      live: '即時生效',
      restartRequired: '需要重新啟動',
      secretSet: '已設定（輸入新數值就會取代）',
      secretNotSet: '未設定',
      invalidNumber: '請輸入數字。',
      range: '允許範圍 {{min}} 至 {{max}}',
      testDatabase: '測試資料庫連線',
      testing: '測試緊...',
      dbOk: '連線成功',
      dbFailed: '連線失敗',
      unavailableTitle: '冇設定可以顯示',
      unavailableBody: '呢部伺服器冇傳回佢嘅設定。',
      sources: { File: '設定檔', Environment: '環境', ConfigMap: 'ConfigMap', Database: '叢集' },
      lockedBy: {
        Environment: '由環境變數設定，會以環境變數嘅值為準。',
        ConfigMap: '由 Kubernetes ConfigMap 管理。請喺你嘅清單入面改。',
        other: '呢個設定唔可以喺度編輯。'
      },
      groups: { Codex: 'Codex', Archive: '封存', General: '一般', Rest: 'REST', Mcp: 'MCP', Database: '資料庫', Logging: '日誌', Auth: '驗證', Security: '保安', RequestHistory: '請求記錄', Telemetry: '遙測', Cluster: '叢集', Scheduling: '排程', Runs: '執行', Audit: '審計', Runtime: '執行階段', Observability: '可觀測性' },
      fields: {
        Observability: {
          GrafanaUrl: 'Grafana URL',
          PrometheusUrl: 'Prometheus URL',
          LokiUrl: 'Loki URL',
          TempoUrl: 'Tempo URL',
          GrafanaInternalUrl: 'Grafana 內部 URL',
          PrometheusInternalUrl: 'Prometheus 內部 URL',
          LokiInternalUrl: 'Loki 內部 URL',
          TempoInternalUrl: 'Tempo 內部 URL'
        },
        Rest: {
          ExternalBaseUrl: '外部 REST URL',
          PublicBaseUrl: '畀執行用嘅內部 REST URL',
          Ssl: 'REST TLS 加密',
          Port: 'REST 連接埠',
          Hostname: 'REST 綁定主機名稱'
        },
        Mcp: {
          InternalPort: '內部 MCP 埠',
          SessionIdleTimeoutSeconds: 'MCP 工作階段閒置逾時（秒）',
          MaxToolWaitSeconds: 'MCP 工具最長等候時間（秒）',
          PublicUrl: '畀執行用嘅內部 MCP URL',
          Path: 'MCP 路徑',
          Port: 'MCP 連接埠',
          Hostname: 'MCP 綁定主機名稱',
          Enable: '啟用 MCP 伺服器'
        },
        Database: {
          MinPoolSize: '連線池最少連線數',
          ConnectionTimeoutSeconds: '等連線逾時（秒）',
          CommandTimeoutSeconds: '指令逾時（秒）',
          ConnectionIdleLifetimeSeconds: '閒置連線保留時間（秒）',
          MaxPoolSize: '連線池大小',
          Schema: '資料庫架構',
          Password: '資料庫密碼',
          Username: '資料庫用戶',
          DatabaseName: '資料庫名稱',
          Port: '資料庫連接埠',
          Host: '資料庫主機',
          Filename: 'Sqlite 檔案',
          Type: '資料庫類型'
        },
        Logging: {
          MinimumSeverity: '最低日誌嚴重程度',
          LogFilename: '日誌檔名',
          LogDirectory: '日誌目錄',
          FileLogging: '將日誌寫入檔案',
          ConsoleLogging: '將日誌輸出去主控台'
        },
        Auth: {
          RateLimitPerMinute: '每分鐘登入嘗試次數',
          PasswordHashIterations: '密碼雜湊迭代次數',
          SignedRequestSkewSeconds: '簽署要求容許嘅時鐘誤差（秒）',
          AdminApiKey: '管理員 API 金鑰',
          TokenLifetimeMinutes: '工作階段有效時間（分鐘）',
          SigningKey: '權杖簽署金鑰',
          Issuer: '權杖簽發者'
        },
        Security: {
          NodeSecretKey: '工作節點私密金鑰',
          NodeAccessKey: '工作節點存取金鑰',
          DefaultSecretKey: '預設私密金鑰',
          DefaultAccessKey: '預設存取金鑰',
          AdminPassword: '初始管理員密碼',
          AdminEmail: '初始管理員電郵',
          MasterKey: '機密加密主金鑰'
        },
        RequestHistory: {
          CaptureNodeProtocol: '記錄成功嘅工作節點協定請求',
          MaxResponseBodyBytes: '記錄嘅回應內容上限（位元組）',
          MaxRequestBodyBytes: '記錄嘅要求內容上限（位元組）',
          RetentionDays: '要求歷史保留日數',
          Enabled: '記錄要求歷史'
        },
        Telemetry: {
          OtlpEndpoint: 'OTLP 端點',
          OtlpEnable: '啟用 OTLP 匯出',
          PrometheusPort: 'Prometheus 連接埠',
          PrometheusEnable: '啟用 Prometheus 端點',
          ServiceName: '遙測服務名稱',
          Enabled: '啟用遙測'
        },
        Archive: {
          Directory: '封存目錄'
        },
        Cluster: {
          Backplane: '事件背板',
          BackplanePollMs: '背板輪詢間隔（毫秒）',
          ExpectedReplicas: '控制平面預期副本數目'
        },
        Scheduling: {
          EventPollMs: '事件輪詢間隔（毫秒）',
          InvocationWaitPollMs: '調用等待後備重讀間隔（毫秒）',
          NodeHeartbeatTimeoutMs: '節點心跳逾時（毫秒）',
          LeaseWaitMs: '租約長輪詢等候時間（毫秒）',
          LeaseDurationMs: '執行租約時長（毫秒）',
          PauseGraceMs: '主機暫停之後嘅寬限時間（毫秒）'
        },
        Runs: {
          EventRetentionDays: '執行事件保留日數',
          RetentionDays: '執行保留日數',
          MaxDelegationDepth: '最大委派深度',
          DelegationChildQueueDepth: '等緊嘅執行最多可以排隊嘅子執行數',
          DelegationRetryAfterSeconds: '委派容量用盡時嘅重試提示（秒）',
          DefaultTimeoutSeconds: '預設執行逾時（秒）'
        },
        Codex: {
          RefreshBeforeExpirySeconds: '到期前更新 Codex 登入（秒）',
          RefreshCheckIntervalSeconds: '背景檢查間隔（秒）',
          RefreshTimeoutSeconds: '登入更新逾時（秒）',
          TokenEndpoint: 'OAuth 權杖端點',
          ClientId: 'OAuth 用戶端 ID'
        },
        Runtime: {
          FailBlockedAfterSeconds: '受阻執行幾多秒之後當失敗',
          MaxRunSeconds: '最長執行時間（秒）',
          RepetitionGuard: '預設開啟重複防護',
          MaxAssistantChars: '預設最大助理字元數',
          NoProgressSeconds: '預設冇進展逾時（秒）',
          ConversationAffinityWaitMs: '對話親和等待時間（毫秒）',
          ConversationTranscriptTurns: '回退紀錄嘅輪數',
          ConversationTranscriptChars: '回退紀錄中每則訊息嘅字元數'
        },
        Audit: {
          RetentionDays: '審計保留日數'
        }
      }
    },
    analytics: {
      grafana: 'Grafana 嘅執行儀表板',
      deletedAgent: '已刪除嘅代理程式（{{id}}）',
      deletedDeployment: '已刪除嘅部署（{{id}}）',
      title: '分析',
      subtitle: '你啲執行隨時間有幾快、幾貴、幾可靠。',
      loading: '載入緊分析...',
      filters: { ttft: 'TTFT 唔計委派等候', range: '範圍', from: '由', to: '至', agentId: '代理程式', harnessType: 'Harness', deploymentId: '部署', model: '模型', groupBy: '分組方式' },
      allAgents: '所有代理程式',
      allHarnesses: '所有 Harness',
      allDeployments: '所有部署',
      allModels: '所有模型',
      unknownModel: '未知模型',
      groupBy: { none: '唔分組', agent: '代理程式', harness: 'Harness', model: '模型', harnessModel: 'Harness 同模型' },
      export: { window: '時間範圍：{{from}} 至 {{to}}' },
      usage: { title: '按 Harness 同模型劃分嘅用量', help: '範圍內每個 Harness 同模型組合隨時間嘅 Token 同成本，另外附一個明細表。' },
      breakdown: {
        title: 'Harness 按模型明細',
        columns: { harness: 'Harness', model: '模型', runs: '執行', inputTokens: '輸入 Token', outputTokens: '輸出 Token', cachedTokens: '快取 Token', reasoningTokens: '推理 Token', costUsd: '成本', timeToFirstTokenMsAvg: '平均 TTFT' }
      },
      rangeError: {
        incomplete: '自訂範圍要揀埋開始同結束時間。',
        reversed: '自訂範圍嘅開始時間一定要早過結束時間。'
      },
      truncated: '呢個範圍嘅執行數量多過伺服器一次請求可以彙總嘅數量，所以數字只係涵蓋咗部分。想要準確數字，請收窄範圍或者加篩選條件。',
      unavailableTitle: '呢部伺服器暫時未有分析功能',
      unavailableBody: '呢部伺服器冇提供執行分析端點。升級伺服器之後就可以喺度睇圖表。',
      emptyTitle: '呢個範圍冇執行',
      emptyBody: '冇嘢符合呢個範圍同篩選條件。可以擴闊範圍、清除篩選，或者調用一個代理程式。',
      noDataInChart: '揀咗嘅範圍入面，呢個圖表冇資料。',
      cards: {
        delegationWait: '平均委派等候時間',
        ttftExcludingDelegation: '平均 TTFT（唔計委派）',
        runs: '執行',
        runsNote: '{{succeeded}} 個成功，{{failed}} 個失敗',
        successRate: '成功率',
        ttft: '平均第一個 Token 時間',
        execution: '平均執行時間',
        queue: '平均排隊時間',
        tokens: 'Token',
        tokensNote: '輸入 {{input}}，輸出 {{output}}',
        throughput: '平均輸出速度',
        cost: '成本',
        toolCalls: '工具呼叫',
        p95: 'p95 {{value}}'
      },
      charts: {
        outcomes: { title: '執行結果', help: '每個時段按結束方式劃分嘅執行數量。' },
        ttft: { helpExcluding: '由 Harness 啟動到模型第一個輸出嘅時間，唔計等委派執行嘅時間。', title: '第一個 Token 時間', help: '由 Harness 啟動到模型第一次輸出，包括 CLI 啟動時間。' },
        duration: { title: '串流同執行時間', help: '串流係由模型第一次到最後一次輸出；執行係由程序啟動到結束。' },
        queue: { title: '排隊時間', help: '由排隊到被工作節點租用嘅時間。' },
        tokens: { title: 'Token', help: '每個時段嘅輸入、輸出、快取同推理 Token。' },
        throughput: { title: '每秒輸出 Token', help: '輸出 Token 除以串流時間，按每個時段平均。' },
        cost: { title: '成本', help: '每個時段報告嘅成本（美元）。' },
        toolCalls: { title: '工具呼叫', help: '每個時段嘅工具呼叫事件。' },
        usageTokens: { title: '按 Harness 同模型劃分嘅 Token', help: '每個時段嘅輸入加輸出 Token，按 Harness 同模型堆疊。' },
        usageCost: { title: '按 Harness 同模型劃分嘅成本', help: '每個時段報告嘅成本，按 Harness 同模型堆疊。' }
      },
      groupedTitle: '{{chart}}：{{metric}}',
      metrics: {
        delegationWaitMsAvg: '委派等候時間（平均）',
        timeToFirstTokenExcludingDelegationMsP95: '唔計委派（p95）',
        timeToFirstTokenExcludingDelegationMsP50: '唔計委派（p50）',
        timeToFirstTokenExcludingDelegationMsAvg: '唔計委派（平均）',
        runs: '執行',
        succeeded: '成功',
        failed: '失敗',
        cancelled: '已取消',
        timedOut: '逾時',
        inputTokens: '輸入',
        outputTokens: '輸出',
        cachedTokens: '快取',
        reasoningTokens: '推理',
        totalTokens: '輸入加輸出 Token',
        costUsd: '成本',
        toolCalls: '工具呼叫',
        timeToFirstTokenMsAvg: '平均',
        timeToFirstTokenMsP50: '中位數（p50）',
        timeToFirstTokenMsP95: 'p95',
        streamingMsAvg: '串流（平均）',
        executionMsAvg: '執行（平均）',
        executionMsP95: '執行（p95）',
        queueMsAvg: '平均排隊時間',
        outputTokensPerSecondAvg: '平均每秒 Token'
      },
      other: '其他',
      hiddenGroups_one: '有 {{count}} 個比較少活動嘅組冇顯示。',
      hiddenGroups_other: '有 {{count}} 個比較少活動嘅組冇顯示。',
      legend: '{{chart}} 入面嘅數列',
      dataTable: '資料表',
      bucketStart: '時段開始'
    },
    serverInfo: {
      serverInUse: '使用緊嘅伺服器',
      title: '伺服器資訊',
      subtitle: '端點、版本，同你而家登入緊嘅身份。',
      endpoints: '端點',
      rest: 'REST API',
      mcp: 'MCP',
      a2a: 'A2A',
      openapi: 'OpenAPI',
      server: '伺服器',
      version: '伺服器版本',
      dashboardVersion: '控制台版本',
      node: '控制節點',
      database: '資料庫',
      health: '健康狀況',
      replicas: '預期副本數',
      routes: '已登記操作',
      serverTime: '伺服器時間',
      principal: '登入身份',
      principalName: '主體',
      principalType: '主體類型',
      role: '角色',
      tenant: '租用戶',
      expires: '工作階段到期',
      features: '功能旗標'
    },
    runGuard: {
      titles: {
        RepetitionDetected: '已停止：個模型不停重複',
        NoProgress: '已停止：個執行冇再進展',
        OutputLimitExceeded: '已停止：個回答去到大小上限'
      },
      bodies: {
        RepetitionDetected: '重複防護見到同一段短文字不停咁寫出嚟（或者得空白同標點），所以 Garrison 停咗個執行，唔會俾佢一直行到截止時間。',
        NoProgress: '超過冇進展逾時時間都冇文字、思考或者工具活動，所以 Garrison 停咗個執行。',
        OutputLimitExceeded: '個回答超過咗每次執行容許嘅最大助理字元數，所以 Garrison 停咗個執行。'
      },
      detected: '偵測到嘅情況：{{reason}}',
      partialKept: '停止之前寫咗嘅輸出（{{chars}} 個字元）會保留做執行結果。',
      noPartial: '個執行喺停止之前冇寫過任何輸出。',
      tune: '想改幾時觸發，就編輯部署 {{deployment}}：佢嘅「排程放置同限制」步驟有重複防護、最大助理字元數同冇進展逾時。留空嘅話，佢哋會跟設定（執行階段）入面嘅叢集預設值。',
      tuneAny: '想改幾時觸發，就編輯個部署：佢嘅「排程放置同限制」步驟有重複防護、最大助理字元數同冇進展逾時。留空嘅話，佢哋會跟設定（執行階段）入面嘅叢集預設值。',
      openDeployments: '打開部署',
      openSettings: '打開設定'
    },
    conversationDetail: {
      title: '對話',
      notFoundTitle: '搵唔到對話',
      notFoundBody: '佢可能已被刪除，或屬於另一個租用戶。佢嘅各輪仍然保留喺「執行」頁面。',
      deployment: '部署',
      activeRun: '未完成嘅一輪',
      turns: '各輪',
      turnsCount: '各輪 ({{count}})',
      noTurns: '呢個對話仲冇任何一輪。',
      pending: '等待結果',
      columns: {
        turn: '輪次',
        run: '執行',
        status: '狀態',
        outcome: '結果',
        session: '工作階段',
        input: '輸入',
        result: '回答',
        node: '節點',
        created: '建立時間'
      },
      session: {
        first: '新工作階段',
        resumed: '已恢復',
        fallback: '全新工作階段',
        pending: '尚未分配'
      },
      continueTitle: '繼續對話',
      message: '下一則訊息',
      messagePlaceholder: '問跟進問題，或者畀下一個指示...',
      busyNotice: '上一輪仲喺度處理中。完成後就可以傳送下一則訊息。',
      send: '傳送呢一輪',
      turnStarted: '第 {{turn}} 輪已開始。',
      openInvoke: '在「調用」中繼續',
      confirmDelete: '要刪除對話「{{title}}」咩？佢嘅各輪會作為一般執行保留在「執行」頁面，但冇辦法再有新嘅一輪繼續佢。'
    }
  },
  wizard: {
    title: '設定 Garrison',
    stepOf: '第 {{step}} 步，共 {{total}} 步',
    steps: { welcome: '歡迎', secret: '憑證', manifest: '範例代理程式', invoke: '測試執行' },
    welcomeBody: '呢個租用戶仲未有代理程式。只要幾個步驟，你就會：',
    welcomeItem1: '儲存一個 Harness 憑證，例如 Anthropic 或者 OpenAI API 金鑰（可選）。',
    welcomeItem2: '套用一個用內置模擬 Harness 嘅範例代理程式，所以冇憑證都用得。',
    welcomeItem3: '執行佢，然後睇對話記錄。',
    start: '開始',
    skip: '略過設定',
    skipStep: '略過呢一步',
    secretBody: '加入你嘅真正代理程式需要嘅憑證。你可以先略過，遲啲先加機密。',
    saveSecret: '儲存並繼續',
    secretSaved: '機密已儲存。',
    manifestBody: '呢份清單會建立一個 echo 代理程式，同一個用模擬 Harness 嘅部署。',
    invokeBody: '傳一個訊息畀 echo 代理程式。執行開始之後會帶你去睇嗰次執行。',
    invoke: '執行',
    noAgent: '搵唔到範例代理程式。請先套用清單。'
  },
  tour: {
    title: '導覽',
    skip: '略過導覽',
    done: '完成',
    steps: {
      sidebar: { title: '導覽列', body: '頁面按中心分組。每個中心喺頁面頂部都有分頁，而每個分頁都有自己嘅連結。' },
      topbar: { title: '環境資訊', body: '伺服器、租用戶、你嘅身份、健康狀況同即時狀態，一直都會喺度顯示。' },
      kpis: { title: '一覽', body: '每張卡都概述一種資源。撳一張卡就會打開篩選咗嘅清單。' },
      invoke: { title: '調用', body: '互動咁試用任何代理程式，睇住佢嘅對話記錄串流出嚟。' },
      configure: { title: '配置', body: 'Harness 設定檔、提示範本、MCP 伺服器同機密，準確決定執行嘅內容。代理程式同部署有自己嘅中心。' },
      observe: { title: '監察', body: '請求記錄、審計同 API 探索器幫你驗證同除錯。' }
    }
  },
  tips,
  explainers
};


// Executor capability negotiation (P11.18).
Object.assign(yueHant.resources.deployments.fields, {"capIsolation": "最低隔離級別", "capColdStartClass": "啟動類別", "capEgressControl": "需要控制對外流量", "capFilesystemSnapshot": "需要檔案系統快照", "capSessionContinuation": "需要延續工作階段", "capCrossNodeRestore": "需要跨節點還原"});
Object.assign(yueHant.tips.resources.deployments, {"capIsolation": "執行會等具備呢啲能力嘅工作節點。容器隔離請揀 KubernetesJob。要求未提供嘅能力會令執行繼續排隊。", "capColdStartClass": "執行會等具備呢啲能力嘅工作節點。容器隔離請揀 KubernetesJob。要求未提供嘅能力會令執行繼續排隊。", "capEgressControl": "執行會等具備呢啲能力嘅工作節點。容器隔離請揀 KubernetesJob。要求未提供嘅能力會令執行繼續排隊。", "capFilesystemSnapshot": "執行會等具備呢啲能力嘅工作節點。容器隔離請揀 KubernetesJob。要求未提供嘅能力會令執行繼續排隊。", "capSessionContinuation": "執行會等具備呢啲能力嘅工作節點。容器隔離請揀 KubernetesJob。要求未提供嘅能力會令執行繼續排隊。", "capCrossNodeRestore": "執行會等具備呢啲能力嘅工作節點。容器隔離請揀 KubernetesJob。要求未提供嘅能力會令執行繼續排隊。"});
yueHant.resources.deployments.hints.capabilities = "執行會等具備呢啲能力嘅工作節點。容器隔離請揀 KubernetesJob。要求未提供嘅能力會令執行繼續排隊。";
yueHant.resources.nodes.columns.executorCapabilities = "執行器能力";
yueHant.tips.resources.nodes.executorCapabilities = "執行會等具備呢啲能力嘅工作節點。容器隔離請揀 KubernetesJob。要求未提供嘅能力會令執行繼續排隊。";
yueHant.enums.executorIsolation = {"Process": "程序", "Container": "容器", "SandboxedRuntime": "沙箱執行環境"};
yueHant.enums.executorColdStart = {"Immediate": "即時", "Cold": "冷啟動", "Warm": "預熱"};
// Artifact collection and browsing (P12.8).
yueHant.nav.items.artifacts = { label: "產物", tip: "從執行收集嘅檔案。" };
yueHant.resources.artifacts = { ...yueHant.resources.artifactStores, title: "產物", subtitle: "從執行收集嘅檔案。", view: "產物", deleteTitle: "產物", emptyTitle: "產物", emptyBody: "設定儲存同明確嘅部署比對模式嚟收集檔案。", columns: {"name": "名稱", "runId": "執行", "artifactStoreId": "儲存", "mediaType": "媒體類型", "sizeBytes": "位元組", "sha256": "SHA-256 雜湊", "createdUtc": "建立時間", "id": "ID", "leaseEpoch": "租約世代", "repairAttempt": "修復次數"}, fields: {"name": "名稱", "runId": "執行", "artifactStoreId": "儲存", "mediaType": "媒體類型", "sizeBytes": "位元組", "sha256": "SHA-256 雜湊", "createdUtc": "建立時間", "id": "ID", "leaseEpoch": "租約世代", "repairAttempt": "修復次數"}, actions: { download: "下載" } };
yueHant.tips.resources.artifacts = { ...{"name": "從執行收集嘅檔案。 名稱", "runId": "從執行收集嘅檔案。 執行", "artifactStoreId": "從執行收集嘅檔案。 儲存", "mediaType": "從執行收集嘅檔案。 媒體類型", "sizeBytes": "從執行收集嘅檔案。 位元組", "sha256": "從執行收集嘅檔案。 SHA-256", "createdUtc": "從執行收集嘅檔案。 建立時間", "id": "從執行收集嘅檔案。 ID", "leaseEpoch": "從執行收集嘅檔案。 租約世代", "repairAttempt": "從執行收集嘅檔案。 修復次數"}, actions: { download: "用臨時連結下載呢個檔案。" }, filters: { runId: "執行", storeId: "儲存" } };
Object.assign(yueHant.resources.artifactStores.fields, {"pathPrefix": "路徑前綴", "bucket": "儲存桶", "endpoint": "端點", "region": "區域", "secretId": "憑證", "forcePathStyle": "路徑式請求"});
Object.assign(yueHant.tips.resources.artifactStores, {"pathPrefix": "S3 端點可選，留空用 AWS。將含 accessKey、secretKey 同可選 sessionToken 嘅 JSON 儲存為 GenericEnv 密鑰。冇指定憑證就用伺服器憑證鏈。", "bucket": "S3 端點可選，留空用 AWS。將含 accessKey、secretKey 同可選 sessionToken 嘅 JSON 儲存為 GenericEnv 密鑰。冇指定憑證就用伺服器憑證鏈。", "endpoint": "S3 端點可選，留空用 AWS。將含 accessKey、secretKey 同可選 sessionToken 嘅 JSON 儲存為 GenericEnv 密鑰。冇指定憑證就用伺服器憑證鏈。", "region": "S3 端點可選，留空用 AWS。將含 accessKey、secretKey 同可選 sessionToken 嘅 JSON 儲存為 GenericEnv 密鑰。冇指定憑證就用伺服器憑證鏈。", "secretId": "S3 端點可選，留空用 AWS。將含 accessKey、secretKey 同可選 sessionToken 嘅 JSON 儲存為 GenericEnv 密鑰。冇指定憑證就用伺服器憑證鏈。", "forcePathStyle": "S3 端點可選，留空用 AWS。將含 accessKey、secretKey 同可選 sessionToken 嘅 JSON 儲存為 GenericEnv 密鑰。冇指定憑證就用伺服器憑證鏈。"});
yueHant.resources.deployments.fields.artifactGlobs = "收集比對模式";
yueHant.tips.resources.deployments.artifactGlobs = "只收集符合模式嘅工作區相對檔案，例如 reports/**/*.json。留空會停用收集。";
yueHant.resources.deployments.hints.artifactGlobs = "只收集符合模式嘅工作區相對檔案，例如 reports/**/*.json。留空會停用收集。";
Object.assign(yueHant.common.eventCodes, { ArtifactCollectionWarning: "產物收集警告", ArtifactsCollected: "已收集產物" });
yueHant.tips.nav.tabs.artifacts = yueHant.nav.items.artifacts.tip + " " + yueHant.tips.resources.artifacts.actions.download;
Object.assign(yueHant.components.mcpTest, {"worker": "工作節點", "chooseWorker": "選擇已就緒嘅工作節點。設定嘅命令會喺該節點列出工具，唔會呼叫工具。", "runTest": "執行測試"});
export default yueHant;

yueHant.views.settings.groups.Leases = "協調租約";
yueHant.views.settings.fields.Leases = {"Provider": "供應方", "ClutchEndpoint": "Clutch 端點", "ClutchAccessKey": "Clutch 存取金鑰", "KeyPrefix": "鍵前綴", "RequestTimeoutMs": "請求逾時 (ms)", "SweepIntervalMs": "檢查間隔 (ms)", "MaxLeaseMs": "最長租約 (ms)", "MaxHoldMs": "最長持有時間 (ms)"};

yueHant.enums.harnessType.ProviderApi = "供應方 API";
yueHant.enums.outputParser.ProviderApiJsonl = "供應方 API JSONL";
yueHant.enums.harnessType.OpenCode = "opencode";
yueHant.enums.harnessType.Pi = "pi";
yueHant.enums.outputParser.OpenCodeJsonl = "opencode JSONL";
yueHant.enums.outputParser.PiJsonl = "pi JSONL";
yueHant.enums.mcpConfigFormat.OpenCodeJson = "opencode JSON";
yueHant.enums.mcpConfigFormat.PiJson = "pi JSON";

// Pipelines (P12.9): definitions (Agents > Pipelines), pipeline runs (Runs > Pipeline runs), and stage reviews
// (Approvals > Stage reviews).
yueHant.nav.hubs.approvals.tip = '等緊有人處理嘅工具呼叫同管線階段，同埋每一個決定';
Object.assign(yueHant.nav, { approvalsPending_one: '{{count}} 項等緊有人處理', approvalsPending_other: '{{count}} 項等緊有人處理' });
Object.assign(yueHant.nav.items, {
  pipelines: { label: '管線', tip: '按次序排好嘅代理程式階段，可以加審閱關卡' },
  pipelineRuns: { label: '管線執行', tip: '管線嘅每次執行，逐個階段睇' },
  pipelineReviews: { label: '階段審閱', tip: '等緊有人審閱嘅管線階段' }
});
Object.assign(yueHant.errorCodes, {
  RevisionLimitReached: '呢個階段已經用晒所有修訂次數，所以唔可以再要求修改。請改為批准或者駁回。',
  ReviewNotPending: '呢個審閱已經由其他人或者逾時決定咗，所以唔可以再決定。',
  PipelineInUse: '呢條管線仲有未完成嘅管線執行。等佢哋完成或者取消佢哋，再刪除管線。',
  PipelineRunActive: '只可以刪除已完成嘅管線執行。請先取消呢個管線執行。',
  PipelineRunFinished: '呢個管線執行已經完成，所以唔可以取消。',
  PipelineRunNotRetryable: '只有失敗、逾時或者已取消嘅管線執行先可以重試。',
  PipelineRunChanged: '處理請求期間呢個管線執行有變。請重新載入再試。',
  PipelineInactive: '呢條管線未啟用。開始之前請先啟用佢。',
  PipelineEmpty: '一條管線最少要有一個階段。',
  PipelineStageRun: '呢個執行係某個管線執行嘅一個階段，所以唔可以單獨重試。請改為重試成個管線執行。',
  ReferencedByPipeline: '有管線階段用緊呢個代理程式。刪除之前請先喺所有管線度移除佢。'
});
yueHant.enums.pipelineRunStatus = { Running: '執行中', AwaitingReview: '等候審閱', Cancelling: '取消緊', Succeeded: '成功', Failed: '失敗', Cancelled: '已取消', TimedOut: '逾時' };
yueHant.enums.pipelineRunOutcome = { None: '無', Succeeded: '成功', StageFailed: '階段失敗', StageStartFailed: '階段開始唔到', ReviewRejected: '審閱被駁回', ReviewExpired: '審閱已過期', Cancelled: '已取消', TimedOut: '逾時', InternalError: '內部錯誤' };
yueHant.enums.pipelineStageStatus = { Pending: '等候中', Running: '執行中', AwaitingReview: '等候審閱', Succeeded: '成功', Failed: '失敗', Cancelled: '已取消' };
yueHant.enums.pipelineReviewStatus = { Pending: '等候中', Approved: '已批准', ChangesRequested: '已要求修改', Rejected: '已駁回', Expired: '已過期', Cancelled: '已取消' };
yueHant.enums.pipelineReviewDecision = { Approve: '批准', RequestChanges: '要求修改', Reject: '駁回' };
yueHant.enums.pipelineReviewSource = { User: '人手', Timeout: '逾時', Cancelled: '管線執行已停止' };
Object.assign(yueHant.enums.resourceType, { Pipeline: '管線', PipelineRun: '管線執行' });
Object.assign(yueHant.enums.auditEventType, { PipelineReviewDecided: '階段審閱已決定', PipelineRunCancelled: '管線執行已取消' });
yueHant.resources.deployments.promptRoles.PipelineStage = '管線階段（交接）';
Object.assign(yueHant.resources.runs.columns, { pipelineRunId: '管線執行' });
yueHant.resources.runs.pipelineStage = '第 {{position}} 階段，第 {{execution}} 次執行';
yueHant.resources.pipelines = {
  ...rp('管線', '按次序排好嘅代理程式階段：每個階段執行一個代理程式，再將輸出交畀下一個階段，可以加審閱關卡。', '新增管線', '建立管線', '編輯管線', '管線詳情', '刪除管線', '仲未有管線', '建立一條管線將代理程式串連起嚟：每個階段都會收到上一個階段嘅輸出。'),
  columns: { name: '名稱', stages: '階段', reviewGates: '審閱關卡', maxDurationSeconds: '時間上限', version: '版本', active: '啟用', description: '描述', id: 'ID', lastUpdateUtc: '更新時間', createdUtc: '建立時間' },
  fields: {
    name: '名稱',
    description: '描述',
    maxDurationSeconds: '時間上限（秒）',
    active: '啟用',
    stages: '階段',
    stageName: '階段名稱',
    agentId: '代理程式',
    deploymentId: '部署',
    handoffTemplateId: '交接範本',
    handoffTemplateVersion: '固定範本版本',
    outputCharLimit: '交接字元上限',
    maxAttempts: '最多嘗試次數',
    continueOnFailure: '失敗都繼續',
    requiresReview: '需要審閱',
    reviewTimeoutSeconds: '審閱逾時（秒）',
    reviewTimeoutAction: '審閱逾時嗰陣',
    maxRevisions: '最多修訂次數',
    stageDescription: '階段描述',
    parameters: '執行參數'
  },
  hints: {
    maxDurationSeconds: '由 {{min}} 到 {{max}}。0 即係冇上限。上限涵蓋成個管線執行，包括等審閱嘅時間。',
    stages: '階段會按呢個次序執行。每個階段喺上一個階段成功（或者喺「失敗都繼續」下失敗）之後開始；如果需要審閱，就要等有人批准。',
    noDeployments: '呢個代理程式仲未有部署。部署可以留空，或者喺「部署」度新增一個。',
    handoffTemplateVersion: '留空就用範本嘅目前版本。',
    outputCharLimit: '由 {{min}} 到 {{max}}。預設 {{default}}。',
    maxAttempts: '由 {{min}} 到 {{max}}。預設 {{default}}。',
    reviewTimeoutSeconds: '由 {{min}} 到 {{max}}。0 即係一直等。',
    maxRevisions: '由 {{min}} 到 {{max}}。預設 {{default}}。',
    parameters: '只限有部署嘅時候，而且只可以用嗰個部署允許呼叫者覆寫嘅參數。'
  },
  errors: {
    dnsName: '用 1 到 64 個細楷字母、數字同連字號，開頭同結尾要係字母或者數字。',
    range: '請輸入 {{min}} 到 {{max}} 之間嘅整數。',
    noStages: '最少要加一個階段。',
    tooManyStages: '一條管線最多有 {{max}} 個階段。',
    stageNameLong: '階段名稱最多 128 個字元。',
    stageNameDuplicate: '已經有另一個階段叫 {{name}}。',
    version: '請輸入 1 或以上嘅版本號，或者留空。',
    parametersNeedDeployment: '執行參數需要一個部署，因為佢哋要對照嗰個部署允許嘅覆寫嚟檢查。',
    parametersUnique: '每個參數名稱只可以出現一次。',
    stageInvalid: '呢個階段有錯誤。'
  },
  actions: { start: '開始', preview: '預覽提示', runs: '睇管線執行' },
  stageHeading: '第 {{position}} 階段：{{name}}',
  stageCount: '{{count}} 個，最多 {{max}} 個',
  stageSummary: '{{count}} 個階段：{{chain}}',
  addStage: '新增階段',
  removeStage: '移除階段',
  noStages: '仲未有階段。',
  chooseAgent: '揀一個代理程式',
  anyDeployment: '任何啟用中嘅部署（按權重）',
  defaultHandoff: '部署綁定或者內置範本',
  parameterName: '參數',
  parameterValue: '數值',
  noLimit: '冇上限',
  versionNotice: '版本 {{version}}。儲存會建立新版本；已經開始嘅管線執行會保留開始時嘅階段。'
};
yueHant.resources.pipelineRuns = {
  ...rp('管線執行', '管線嘅每一次執行。打開一個就可以跟進佢嘅階段、決定審閱，或者取消同重試。', '新增管線執行', '建立管線執行', '編輯管線執行', '管線執行詳情', '刪除管線執行', '仲未有管線執行', '喺「代理程式 > 管線」開始一條管線，佢嘅執行就會喺度出現。'),
  columns: { id: 'ID', pipelineName: '管線', status: '狀態', outcome: '結果', progress: '階段', callerName: '開始者', errorMessage: '錯誤', priority: '優先次序', deadlineUtc: '期限', completedUtc: '完成時間', createdUtc: '建立時間' },
  actions: { cancel: '取消', retry: '重試', stageRuns: '睇階段執行', finalRun: '打開最後執行' },
  toasts: { cancelRequested: '已要求取消管線執行同佢目前嘅階段。', retried: '管線執行會喺停低嗰個階段繼續。' },
  progressValue: '{{position}} / {{count}}',
  versionShort: '（版本 {{version}}）'
};
yueHant.resources.pipelineReviews = {
  ...rp('階段審閱', '等緊有人批准、要求修改或者駁回嘅管線階段。', '新增階段審閱', '建立階段審閱', '編輯階段審閱', '階段審閱詳情', '刪除階段審閱', '仲未有階段審閱', '需要審閱嘅階段完成之後就會喺度出現。'),
  columns: { createdUtc: '要求時間', pipelineName: '管線', stageName: '階段', status: '狀態', decision: '決定', decisionSource: '決定方式', comment: '備註', decidedBy: '審閱者', expiresUtc: '逾時時間', pipelineRunId: '管線執行', runId: '階段執行', decidedUtc: '決定時間', id: 'ID' },
  filters: { pipelineRunId: '管線執行 ID', pipelineRunIdPlaceholder: '管線執行 ID（plr_...）' },
  actions: { approve: '批准', requestChanges: '要求修改', reject: '駁回', openStageRun: '打開階段執行' },
  noTimeout: '一直等'
};
yueHant.components.pipelineReviews = {
  decideTitle: '審閱 {{pipeline}} 嘅階段 {{stage}}',
  decision: '決定',
  positionExecution: '第 {{position}} 階段，第 {{execution}} 次執行',
  revisionsLeft: '剩餘修訂次數',
  revisionsLeftValue: '{{max}} 次之中剩 {{left}} 次',
  noRevisionsLeft: '呢個階段已經用晒 {{max}} 次修訂。伺服器會拒絕「要求修改」；請改為批准或者駁回。',
  timeoutThen: '之後{{decision}}',
  commentApprove: '畀下一個階段嘅備註',
  commentApprovePlaceholder: '可選。下一個階段會連同輸出收到呢啲備註。',
  commentRequestChanges: '要改啲乜',
  commentRequestChangesPlaceholder: '必填。階段會帶住呢個意見再執行一次。',
  commentReject: '原因',
  commentRejectPlaceholder: '可選。會同決定一齊記錄；管線執行會失敗。',
  commentRequired: '請講清楚要改啲乜。階段會帶住呢個意見再執行一次。',
  commentTooLong: '備註最多 {{max}} 個字元。',
  submit: { Approve: '批准階段', RequestChanges: '要求修改', Reject: '駁回階段' },
  toasts: {
    Approve: '已批准 {{pipeline}} 嘅階段 {{stage}}。',
    RequestChanges: '已要求修改 {{pipeline}} 嘅階段 {{stage}}；佢會帶住你嘅意見再執行。',
    Reject: '已駁回 {{pipeline}} 嘅階段 {{stage}}；管線執行會失敗。',
    notPending: '呢個審閱已經由其他人或者逾時決定咗。清單而家顯示目前狀態。',
    revisionLimit: '呢個階段已經用晒所有修訂次數（最多 {{max}} 次），所以唔可以再要求修改。請改為批准或者駁回。'
  }
};
yueHant.components.pipelineStart = {
  title: '開始 {{name}}',
  intro_one: '輸入會交畀管線唯一嘅階段。',
  intro_other: '輸入會交畀 {{count}} 個階段之中嘅第一個；每個階段都會將佢當做原本嘅任務。',
  input: '輸入',
  inputPlaceholder: '管線要處理啲乜？',
  shortcut: '撳 Ctrl+Enter 或者 Cmd+Enter 開始。',
  submit: '開始管線',
  starting: '開始緊...',
  started: '已開始 {{name}}。'
};
yueHant.components.pipelinePreview = {
  title: '預覽 {{name}} 嘅提示',
  input: '範例輸入',
  sampleInput: '總結未處理嘅問題，再為最急嗰個提出修正方法。',
  sampleOutput: '{{stage}} 嘅範例輸出。',
  outputOf: '第 {{position}} 階段（{{stage}}）嘅範例輸出',
  render: '渲染提示',
  rendering: '渲染緊...',
  stageHeading: '第 {{position}} 階段：{{stage}}（{{agent}}）',
  deployment: '部署：{{deployment}}',
  rendered: '已渲染',
  failed: '失敗'
};
yueHant.views.pipelineRunDetail = {
  title: '管線執行',
  heading: '{{pipeline}} 嘅管線執行',
  notFoundTitle: '搵唔到管線執行',
  notFoundBody: '佢可能已經刪咗，或者屬於另一個租用戶。',
  live: '即時',
  polling: '重新整理緊',
  finalRun: '最後執行',
  started: '開始時間',
  input: '輸入',
  reviewTitle: '等緊你審閱',
  reviewBody: '第 {{position}} 階段（{{stage}}）完成咗第 {{execution}} 次執行，等緊審閱。請喺階段執行度睇佢嘅輸出：',
  reviewExpires: '如果 {{time}} 之前冇人決定，審閱就會自動決定：{{decision}}。',
  reviewNoTimeout: '審閱會一直等到有人決定，除非管線嘅時間上限先結束咗個執行。',
  stages: '階段',
  stagesCount_one: '{{count}} 個階段',
  stagesCount_other: '{{count}} 個階段',
  noStages: '呢個管線執行冇階段。',
  current: '目前',
  reviewGate: '審閱關卡',
  agent: '代理程式 {{agent}}',
  counts: '執行 {{executions}} 次，嘗試 {{attempts}} / {{maxAttempts}}，修訂 {{revisions}} / {{maxRevisions}}',
  startedAt: '開始於',
  blocked: '等緊開始：{{reason}}。',
  nextAttempt: '下次嘗試喺 {{time}}。',
  reviewItem: '第 {{execution}} 次執行嘅審閱',
  columns: { execution: '執行序號', run: '階段執行', status: '狀態', outcome: '結果', error: '錯誤', created: '建立時間' },
  confirmCancelTitle: '取消管線執行',
  confirmCancel: '要取消 {{pipeline}} 嘅呢個管線執行嗎？佢目前嘅階段執行會被取消，等候中嘅審閱會關閉。你之後可以重試。',
  confirmDelete: '要刪除 {{pipeline}} 嘅呢個管線執行同佢嘅審閱嗎？佢嘅階段執行會留喺「執行」頁。'
};
Object.assign(yueHant.views.runDetail, { pipelineRun: '管線執行' });
yueHant.views.settings.fields.Runtime.PipelineSweepIntervalMs = '管線巡查間隔（毫秒）';
yueHant.views.settings.fields.Runtime.PipelineMaxStages = '每條管線最多階段數';

// Deployment trust level (P11.14).
yueHant.enums.trustLevel = { Trusted: "可信任", Untrusted: "唔可信任" };
yueHant.enums.runBlockedReason.NoIsolatingWorker = "冇可以隔離嘅工作節點";
yueHant.components.blocked.reasons.NoIsolatingWorker = "呢個執行唔可信任，需要容器隔離，但係冇一個做到 {{harness}} 嘅就緒工作節點提供。請喺可以建立 Job 嘅叢集度，加一個用 Kubernetes Job 執行器嘅工作節點。";
yueHant.tips.enums.runBlockedReason.NoIsolatingWorker = "塞住咗：呢個唔可信任嘅執行需要容器隔離，但係冇一個有呢個 Harness 嘅就緒工作節點提供。佢會喺佇列度等，直到有用 Kubernetes Job 執行器嘅工作節點登記。";
yueHant.tips.enums.trustLevel = { Trusted: "輸入只會嚟自可信任嘅呼叫者。執行可以用 Process 執行器，但佢冇同其他執行或者工作節點隔離。", Untrusted: "輸入可能嚟自唔可信任嘅來源。執行只會交俾有容器隔離或者更強隔離嘅執行器，冇嘅話會喺佇列度等。" };
Object.assign(yueHant.common.fieldCodes, { TenantRequiresUntrusted: "呢個租用戶要求每個部署都係唔可信任。", UntrustedNeedsIsolation: "唔可信任嘅部署唔可以用 Process 執行器。請揀 Kubernetes Job，或者將執行器留空。" });
yueHant.resources.deployments.fields.trustLevel = "信任等級";
yueHant.resources.deployments.columns.trustLevel = "信任等級";
yueHant.resources.deployments.hints.trustLevel = "如果呼叫者或者內容可能唔可信任，請揀唔可信任。呢啲執行需要容器隔離：執行器留空就代表 Kubernetes Job，執行會等到有工作節點可以隔離佢哋。";
yueHant.tips.resources.deployments.trustLevel = "可信任容許用冇隔離嘅 Process 執行器。唔可信任只會喺有容器隔離或者更強隔離嘅執行器度執行。";
yueHant.tips.resources.deployments.trustFlagged = "呢個租用戶要求唔可信任嘅部署。呢個部署喺開啟政策之前係可信任：佢會照現有設定繼續執行，但下次儲存嗰陣一定要改做唔可信任。";
yueHant.resources.deployments.trust = { tenantRequiresUntrusted: "呢個租用戶要求唔可信任嘅部署。請將信任等級改做唔可信任先可以儲存呢個部署。", untrustedProcess: "唔可信任嘅部署唔可以用 Process 執行器。請揀 Kubernetes Job，或者將執行器留空。", flagged: "可信任，但政策要求唔可信任" };
yueHant.resources.tenants.fields.requireUntrustedDeployments = "要求部署唔可信任";
yueHant.resources.tenants.columns.requireUntrustedDeployments = "要求唔可信任";
yueHant.resources.tenants.hints = { ...(yueHant.resources.tenants.hints || {}), requireUntrustedDeployments: "建立或者儲存可信任嘅部署會被拒絕。現有嘅可信任部署會繼續執行，並會一直被標示，直到儲存做唔可信任為止。" };
yueHant.tips.resources.tenants.requireUntrustedDeployments = "開啟之後，呢個租用戶嘅每個部署都一定要係唔可信任，咁佢哋嘅執行只會交俾有隔離嘅執行器。";
yueHant.views.runDetail.trustLevel = "信任等級";
yueHant.tips.views.runDetail.trustLevel = "呢個執行入佇列嗰陣部署嘅信任等級。唔可信任嘅執行只會交俾有容器隔離或者更強隔離嘅執行器。";

// Deployment effect policy (P12.29).
yueHant.enums.effectPolicy = { AtMostOnce: "最多一次", AtLeastOnce: "最少一次", Journaled: "日誌模式" };
yueHant.tips.enums.effectPolicy = { AtMostOnce: "如果執行開始咗之後 worker 失聯，執行會以節點失聯失敗，之後唔會再開始。冇外部作用會發生兩次。係預設值。", AtLeastOnce: "如果執行開始咗之後 worker 失聯，只要仲有嘗試次數，執行就會返入隊列。失聯嗰次嘗試已經做咗嘅作用 (例如 push 或者訊息) 可能會再發生。", Journaled: "只有當所有作用都經過作用日誌先會重新排隊。日誌暫時未有，所以而家同最多一次一樣。" };
Object.assign(yueHant.common.fieldCodes, { EffectPolicyConflict: "作用策略同已棄用嘅 retryOnNodeLoss 值唔一致。請只傳送作用策略。" });
yueHant.resources.deployments.fields.effectPolicy = "作用策略";
yueHant.resources.deployments.columns.effectPolicy = "作用策略";
yueHant.resources.deployments.hints.effectPolicy = "最多一次 (預設) 會令 worker 失聯嘅已開始執行以節點失聯失敗。最少一次會喺仲有嘗試次數時重新排隊，作用可能會重複。日誌模式喺作用日誌出現之前同最多一次一樣。從未開始嘅執行一定會重新排隊。";
yueHant.tips.resources.deployments.effectPolicy = "worker 失聯時點樣處理已開始嘅執行: 令佢失敗 (最多一次)、重新排隊 (最少一次)，或者日誌模式，而家同最多一次一樣。";
yueHant.views.runDetail.effectPolicy = "作用策略";
yueHant.tips.views.runDetail.effectPolicy = "呢個執行入隊列時部署嘅作用策略。佢決定執行嘅 worker 失聯時點處理；之後改部署唔會影響呢個執行。";
yueHant.views.settings.fields.Scheduling.QueueWakeFanout = "每個副本叫醒嘅輪詢數";
yueHant.views.settings.fields.Scheduling.RemoteWakeDelayMs = "遠端喚醒暫緩時間 (ms)";
yueHant.views.settings.fields.Auth.CacheSeconds = "認證快取有效時間 (秒)";

// Deployment egress allowlists (P11.15).
yueHant.resources.deployments.fields.egressRules = "出站允許清單";
yueHant.resources.deployments.fields.egressCidr = "CIDR 位址區塊";
yueHant.resources.deployments.fields.egressPort = "目的連接埠";
yueHant.resources.deployments.fields.egressProtocol = "通訊協定";
yueHant.resources.deployments.columns.egressRules = "出站";
yueHant.resources.deployments.hints.egressRules = "留空就用叢集預設嘅執行出站規則 (容許 HTTPS 連去任何位址)。設定咗規則之後，執行 Pod 只可以連去 DNS、Garrison MCP 連接埠同呢啲位址區塊，而執行需要一部可以強制執行規則嘅 Kubernetes worker。請輸入 CIDR 位址區塊，唔好用主機名稱；請自己將名稱解析成位址。連接埠留空即係容許所有連接埠。最多 64 條規則。";
yueHant.resources.deployments.egress = {"add": "新增出站規則", "allPorts": "所有連接埠", "default": "預設", "count_one": "允許清單，{{count}} 條規則", "count_other": "允許清單，{{count}} 條規則", "note_one": "呢個部署有 {{count}} 條出站規則。佢嘅執行只會喺啟用咗出站允許清單嘅 Kubernetes worker 上面行，而執行所在 Pod 嘅 NetworkPolicy 只容許 DNS、Garrison MCP 連接埠同呢啲規則。冇呢類 worker 就緒嘅時候，執行會喺佇列等 (冇可以隔離嘅工作節點)；絕對唔會喺冇允許清單嘅情況下行。", "note_other": "呢個部署有 {{count}} 條出站規則。佢嘅執行只會喺啟用咗出站允許清單嘅 Kubernetes worker 上面行，而執行所在 Pod 嘅 NetworkPolicy 只容許 DNS、Garrison MCP 連接埠同呢啲規則。冇呢類 worker 就緒嘅時候，執行會喺佇列等 (冇可以隔離嘅工作節點)；絕對唔會喺冇允許清單嘅情況下行。", "errors": {"cidrRequired": "請輸入 CIDR 位址區塊，例如 203.0.113.0/24。", "cidrFormat": "請用有前置長度嘅 CIDR 表示法，例如 198.51.100.7/32。唔接受主機名稱。", "cidrAddress": "呢個位址唔係有效嘅 IPv4 或者 IPv6 位址。", "cidrPrefix": "前置長度超出範圍 (IPv4 係 0 到 32，IPv6 係 0 到 128)。", "cidrMapped": "唔可以用 IPv4 對應嘅 IPv6 位址；請改為輸入 IPv4 位址區塊。", "cidrHostBits": "呢個位址喺前置長度之後有設定咗嘅位元；請用位址區塊嘅網絡位址。"}};
Object.assign(yueHant.common.fieldCodes, {"InvalidCidr": "CIDR 位址區塊無效。", "PortOutOfRange": "連接埠一定要喺 1 到 65535 之間，或者留空代表所有連接埠。", "InvalidProtocol": "唔明嘅通訊協定；請用 TCP 或者 UDP。", "TooManyEgressRules": "一個部署最多可以有 64 條出站規則。", "EgressRulesNeedKubernetesJob": "出站規則只會對 Kubernetes Job 執行強制執行。請揀 Kubernetes Job，或者將執行器留空。", "EgressRulesNeedColdStart": "出站規則需要冷啟動，因為預熱 Pod 已經喺預設出站規則之下行緊。請清空啟動類別或者揀冷啟動。"});
yueHant.components.blocked.reasons.NoIsolatingWorkerEgress = "呢個執行嘅部署有出站允許清單，只有啟用咗出站允許清單嘅 Kubernetes worker 先可以強制執行，但係可以行 {{harness}} 嘅就緒 worker 冇一部提供呢項能力。執行會喺佇列等，絕對唔會喺冇允許清單嘅情況下行。請喺網絡外掛會強制執行 NetworkPolicy 嘅叢集入面，幫 Kubernetes Job worker 啟用出站允許清單。";
yueHant.tips.enums.runBlockedReason.NoIsolatingWorker = "已封鎖：呢個執行需要可以隔離嘅 worker (唔可信任嘅執行要容器隔離，有出站允許清單嘅部署要出站控制)，但係有佢 harness 嘅就緒 worker 冇一部提供。佢會喺佇列等，直到有合適嘅 Kubernetes Job worker 註冊。";
yueHant.tips.resources.deployments.egressRules = "呢個部署嘅執行 Pod 可以連去嘅目的地，用 CIDR 位址區塊表示，可以加連接埠同通訊協定。留空就用預設嘅執行出站規則。";
yueHant.tips.resources.deployments.egressRulesItems = {"cidr": "用 CIDR 表示法寫嘅目的位址區塊，IPv4 或者 IPv6，例如 203.0.113.0/24。請自己將主機名稱解析成位址。", "port": "1 到 65535 之間嘅目的連接埠。留空就容許呢個位址區塊嘅所有連接埠。", "protocol": "大部分服務用 TCP，或者揀 UDP。"};
yueHant.tips.resources.deployments.egressDefault = "冇出站允許清單：執行 Pod 用叢集預設嘅執行出站規則。";

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
})(yueHant, {
 "nav": {
  "items": {
   "triggers": {
    "label": "觸發器",
    "tip": "用 cron 排程同簽章 Webhook 開始執行"
   },
   "notifications": {
    "label": "通知",
    "tip": "關於執行、管線同核准嘅簽章 Webhook"
   }
  }
 },
 "enums": {
  "triggerType": {
   "Cron": "cron 排程",
   "Webhook": "簽章 Webhook"
  },
  "triggerTargetType": {
   "Agent": "代理程式執行",
   "Pipeline": "管線執行"
  },
  "triggerFireSource": {
   "Cron": "排程",
   "Webhook": "Webhook 傳遞",
   "Manual": "手動觸發"
  },
  "triggerFireOutcome": {
   "Started": "已啟動",
   "Failed": "失敗",
   "Skipped": "跳咗"
  },
  "notificationEvent": {
   "RunSucceeded": "執行成功",
   "RunFailed": "執行失敗",
   "RunCancelled": "執行已取消",
   "RunTimedOut": "執行逾時",
   "PipelineCompleted": "管線已完成",
   "PipelineFailed": "管線失敗",
   "ApprovalRequested": "要求核准",
   "Test": "測試通知"
  },
  "notificationDeliveryStatus": {
   "Pending": "等待中",
   "Delivering": "傳遞中",
   "Succeeded": "已經送到",
   "Failed": "已放棄"
  },
  "runKind": {
   "Invoke": "呼叫",
   "Delegated": "委派",
   "Test": "測試執行",
   "Retry": "重試",
   "Pipeline": "管線階段",
   "Trigger": "由觸發器啟動"
  },
  "resourceType": {
   "Trigger": "觸發器",
   "NotificationEndpoint": "通知端點"
  },
  "auditEventType": {
   "SigningSecretRotated": "已輪替簽章密鑰"
  }
 },
 "errorCodes": {
  "ReferencedByTrigger": "有觸發器正在使用呢筆記錄。請先修改或刪除該觸發器。",
  "ReferencedByNotificationEndpoint": "有通知端點依呢筆記錄篩選。請先修改或刪除該端點。",
  "NotAWebhookTrigger": "只有 Webhook 觸發器才有簽章密鑰。",
  "TriggerInactive": "呢個觸發器未啟用。",
  "InvalidSignature": "Webhook 簽章遺失、格式錯誤、過期或不相符。",
  "PayloadTooLarge": "酬載超過伺服器可接受嘅大小。"
 },
 "common": {
  "fieldCodes": {
   "InvalidUrl": "請輸入不含使用者名稱同密碼嘅絕對 HTTP 或 HTTPS URL。",
   "DestinationBlocked": "伺服器拒絕此目嘅地：除非維運人員允許私人目嘅地，否則迴路、私人、連結本機同中繼資料位址都會遭到封鎖。",
   "EventsRequired": "請至少選擇一個事件。",
   "InvalidEvent": "其中有不支援嘅事件。",
   "InvalidCron": "cron 運算式無效。請使用五個欄位：分、時、日、月、星期。",
   "InvalidTimeZone": "不明嘅時區。請使用 UTC 或 Asia/Taipei 等 IANA 名稱。",
   "TypeImmutable": "觸發器類型冇辦法變更。請改為建立新嘅觸發器。",
   "TargetMismatch": "此欄位不屬於所選嘅目標。",
   "PayloadTooLarge": "酬載超過伺服器可接受嘅大小。"
  }
 },
 "resources": {
  "runs": {
   "columns": {
    "triggerId": "觸發器",
    "kind": "執行類型"
   }
  },
  "triggers": {
   "title": "觸發器",
   "subtitle": "啟動代理程式執行或管線執行嘅 cron 排程同簽章 Webhook。",
   "add": "新增觸發器",
   "create": "建立觸發器",
   "edit": "編輯觸發器",
   "view": "觸發器詳細資料",
   "deleteTitle": "刪除觸發器",
   "emptyTitle": "仲未有觸發器",
   "emptyBody": "建立觸發器，依排程或在其他系統傳送 Webhook 時執行代理程式。",
   "columns": {
    "name": "名稱",
    "type": "類型",
    "target": "啟動對象",
    "schedule": "排程",
    "active": "啟用",
    "lastFire": "上次觸發",
    "nextFireUtc": "下次觸發",
    "fireCount": "觸發次數",
    "runAs": "執行身分",
    "signingSecretLast4": "密鑰結尾",
    "description": "說明",
    "id": "ID",
    "createdUtc": "建立時間"
   },
   "fields": {
    "name": "名稱",
    "type": "類型",
    "description": "說明",
    "targetType": "啟動對象",
    "agentId": "代理程式",
    "deploymentId": "部署",
    "pipelineId": "管線",
    "inputTemplateId": "輸入範本",
    "priority": "優先順序",
    "cronExpression": "cron 運算式",
    "timeZone": "時區",
    "active": "啟用",
    "webhook": "Webhook 網址"
   },
   "hints": {
    "type": "建立後冇辦法變更類型。",
    "inputTemplateId": "以 trigger.* 同 webhook.* 變數產生執行輸入嘅 Task 範本。留空則使用內建嘅 trigger-input 範本。",
    "priority": "{{min}} 到 {{max}}。數值越大越先執行。",
    "cronExpression": "五個欄位：分、時、日、月、星期。範例：0 9 * * 1-5 表示平日 09:00 執行。",
    "timeZone": "UTC 或 Asia/Taipei 等 IANA 名稱。日光節約時間嘅切換會自動處理。",
    "webhookNew": "儲存後會顯示 Webhook 網址同簽章密鑰。密鑰只會顯示一次。"
   },
   "errors": {
    "name": "請使用 1 到 64 個小寫字母、數字同連字號，並以字母或數字開頭同結尾。",
    "description": "說明最多 {{max}} 個字元。",
    "agentRequired": "請選擇此觸發器要執行嘅代理程式。",
    "pipelineRequired": "請選擇此觸發器要啟動嘅管線。",
    "cron": "請輸入五個欄位（分 時 日 月 星期）或 @daily 等巨集。",
    "priority": "請輸入 {{min}} 到 {{max}} 之間嘅整數。"
   },
   "actions": {
    "fire": "立即觸發",
    "fires": "觸發紀錄",
    "runs": "檢視執行",
    "rotateSecret": "輪替密鑰"
   },
   "fires": {
    "firedUtc": "觸發時間",
    "source": "來源",
    "outcome": "結果",
    "started": "已啟動嘅執行",
    "deliveryId": "傳遞 ID",
    "error": "錯誤",
    "runId": "執行",
    "pipelineRunId": "管線執行"
   },
   "confirmRotateTitle": "輪替簽章密鑰",
   "confirmRotate": "要取代 {{name}} 嘅簽章密鑰嗎？舊密鑰會立即失效，傳送端必須改用新密鑰。",
   "anyDeployment": "任何啟用中嘅部署（依權重）",
   "builtinTemplate": "內建 trigger-input 範本",
   "webhookSchedule": "收到簽章 Webhook 時",
   "neverFired": "仲未觸發",
   "runAsNotice": "以 {{name}} 嘅身分執行。儲存變更後，此觸發器會以你嘅身分執行。",
   "secretEnding": "目前嘅密鑰結尾為 {{last4}}。"
  },
  "notifications": {
   "title": "通知",
   "subtitle": "在執行同管線結束或核准等待時接收簽章通知嘅 Webhook 端點。",
   "add": "新增端點",
   "create": "建立通知端點",
   "edit": "編輯通知端點",
   "view": "通知端點詳細資料",
   "deleteTitle": "刪除通知端點",
   "emptyTitle": "仲未有通知端點",
   "emptyBody": "新增端點，在執行失敗、管線結束或核准等待時接收簽章嘅 HTTP POST。",
   "columns": {
    "name": "名稱",
    "url": "URL",
    "events": "事件",
    "filters": "篩選",
    "active": "啟用",
    "signingSecretLast4": "密鑰結尾",
    "includeResultText": "結果文字",
    "description": "說明",
    "id": "ID",
    "createdUtc": "建立時間",
    "agent": "代理程式",
    "deployment": "部署"
   },
   "fields": {
    "name": "名稱",
    "description": "說明",
    "url": "URL",
    "events": "事件",
    "agentId": "僅此代理程式",
    "deploymentId": "僅此部署",
    "includeResultText": "包含結果文字",
    "resultTextMaxChars": "結果文字上限（字元）",
    "active": "啟用"
   },
   "hints": {
    "url": "HTTP 或 HTTPS URL。除非維運人員允許私人目嘅地，否則迴路、私人同中繼資料位址會遭拒，且不跟隨重新導向。",
    "events": "設定代理程式或部署篩選時，唔會傳送管線事件。",
    "agentId": "留空則傳送所有代理程式嘅事件。",
    "deploymentId": "留空則傳送所有部署嘅事件。",
    "includeResultText": "預設關閉：通知包含識別碼、狀態同時間戳記，但不含執行輸出。",
    "resultTextMaxChars": "{{min}} 到 {{max}}。預設 {{default}}。"
   },
   "errors": {
    "name": "請使用 1 到 64 個小寫字母、數字同連字號，並以字母或數字開頭同結尾。",
    "url": "請輸入不含使用者名稱同密碼嘅絕對 HTTP 或 HTTPS URL。",
    "events": "請至少選擇一個事件。",
    "resultTextMaxChars": "請輸入 {{min}} 到 {{max}} 之間嘅整數。"
   },
   "actions": {
    "test": "傳送測試",
    "deliveries": "傳遞紀錄",
    "rotateSecret": "輪替密鑰"
   },
   "deliveries": {
    "createdUtc": "排入佇列",
    "event": "事件",
    "status": "狀態",
    "attempts": "嘗試次數",
    "lastStatusCode": "HTTP 狀態",
    "lastError": "最近錯誤",
    "lastAttemptUtc": "最近嘗試",
    "nextAttemptUtc": "下次嘗試",
    "deliveredUtc": "送達時間",
    "payload": "酬載",
    "id": "傳遞 ID"
   },
   "confirmRotateTitle": "輪替簽章密鑰",
   "confirmRotate": "要取代 {{name}} 嘅簽章密鑰嗎？之後嘅通知（包括已排入佇列嘅重試）都會以新密鑰簽章。",
   "anyAgent": "所有代理程式",
   "anyDeployment": "所有部署",
   "noFilter": "全部",
   "eventCount_one": "{{count}} 個事件",
   "eventCount_other": "{{count}} 個事件",
   "resultTextUpTo_one": "最多 {{count}} 個字元",
   "resultTextUpTo_other": "最多 {{count}} 個字元",
   "secretNotice": "通知以結尾為 {{last4}} 嘅密鑰簽章，設定於 {{time}}。輪替即可取得新密鑰。"
  }
 },
 "components": {
  "signingSecret": {
   "title": "簽章密鑰",
   "warning": "請立即複製呢個密鑰。Garrison 會加密儲存且唔會再次顯示；遺失時請輪替。",
   "secret": "密鑰",
   "url": "Webhook 網址",
   "done": "我已儲存",
   "scheme": "以標頭 {{header}} 為每個要求簽章：{{format}}。傳送 {{delivery}} 可讓重複嘅傳遞只算一次。"
  },
  "triggerFire": {
   "title": "觸發 {{name}}",
   "intro": "立即啟動呢個觸發器。酬載為選填；輸入範本會以 webhook.body 讀取。",
   "body": "酬載",
   "contentType": "酬載內容類型",
   "submit": "觸發",
   "firing": "觸發中..."
  },
  "triggerFires": {
   "title": "觸發紀錄",
   "count_one": "共 {{count}} 次觸發，顯示 {{shown}} 次",
   "count_other": "共 {{count}} 次觸發，顯示 {{shown}} 次",
   "empty": "呢個觸發器仲未觸發。",
   "scheduled": "對應 {{time}}"
  },
  "notificationDeliveries": {
   "title": "傳遞紀錄",
   "count_one": "共 {{count}} 次傳遞，顯示 {{shown}} 次",
   "count_other": "共 {{count}} 次傳遞，顯示 {{shown}} 次",
   "empty": "仲未傳送任何內容到呢個端點。",
   "detail": "所選嘅傳遞"
  },
  "notificationTest": {
   "title": "測試通知",
   "sending": "正在傳送測試通知...",
   "succeeded": "端點已接受測試通知。",
   "failed": "測試通知失敗，且唔會重試。請睇下方錯誤。",
   "pending": "第一次嘗試失敗；Garrison 會重試。請睇下方錯誤。"
  }
 },
 "views": {
  "runDetail": {
   "trigger": "觸發器"
  },
  "settings": {
   "groups": {
    "Triggers": "觸發器",
    "Notifications": "通知"
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Webhook 本文上限（位元組）",
     "WebhookToleranceSeconds": "Webhook 時間戳記容許差（秒）",
     "CronMaxLatenessSeconds": "cron 補觸發上限（秒）",
     "FireRetentionDays": "觸發紀錄保留天數"
    },
    "Notifications": {
     "AllowPrivateDestinations": "允許私人目嘅地",
     "MaxAttempts": "傳遞嘗試次數",
     "InitialBackoffSeconds": "首次重試等待（秒）",
     "MaxBackoffSeconds": "最長重試等待（秒）",
     "TimeoutSeconds": "傳遞逾時（秒）",
     "DispatchIntervalMs": "派送間隔（毫秒）",
     "SweepOverlapSeconds": "事件掃描重疊（秒）",
     "DeliveryRetentionDays": "傳遞紀錄保留天數"
    }
   }
  }
 }
});
Object.assign(yueHant.common.fieldCodes, {"SecretUseDenied": "你冇權限用呢個機密。請人俾你呢個機密嘅 SecretUser 或者 SecretManager 角色。", "GrantCeiling": "你只可以授予你自己有嘅權限。", "ReservedRoleName": "呢個係內建角色嘅名。請揀第二個名。"});
yueHant.components.mcpTest.noWorkers = "冇一部就緒嘅工作節點提供 stdio 診斷。因為指令會喺工作節點主機度、執行隔離以外運行，所以只有營運人員喺工作節點設定 GARRISON_WORKER_MCP_TESTS_ENABLED=true 先會運行。";

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
})(yueHant, {
 "components": {
  "transcriptExport": {
   "label": "匯出對話紀錄",
   "exporting": "匯出緊...",
   "markdown": "Markdown 文件 (.md)",
   "json": "JSON (.json)",
   "includeThinking": "包埋思考過程",
   "failed": "匯出對話紀錄失敗：{{message}}"
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "結構化輸入",
    "modeLabel": "輸入編輯器",
    "modeForm": "表格",
    "modeJson": "原始 JSON",
    "required": "必填",
    "choose": "揀一個值",
    "addItem": "加項目",
    "removeItem": "移除項目",
    "jsonLabel": "輸入 JSON",
    "jsonPlaceholder": "JSON 值",
    "unsupported": "呢個輸入結構冇可以用嚟整表格嘅屬性。請輸入代理預期嘅 JSON 文件。",
    "invalidRaw": "JSON 唔啱。轉去表格之前請先改好佢。",
    "errors": {
     "required": "呢個欄位係必填嘅。",
     "number": "請輸入數字。",
     "integer": "請輸入整數。",
     "json": "請輸入有效嘅 JSON。"
    }
   }
  },
  "manifests": {
   "bundle": {
    "scope": "匯出範圍",
    "scopeAll": "所有資源",
    "scopeSelected": "揀咗嘅資源",
    "kinds": "類型",
    "resources": "資源",
    "resourcesHint": "每行一個 類型/名稱，或者用逗號分隔，例如 Agent/triage。",
    "invalidSelectors": "唔係已知類型嘅 類型/名稱：{{entries}}",
    "followReferences": "包埋佢哋參照嘅資源",
    "includeBuiltIn": "包埋參照嘅內建資源",
    "exporting": "匯出緊...",
    "noSecrets": "呢個套件唔使任何密鑰。",
    "requiredSecrets": "套用之前，請喺目標租戶度建立呢啲密鑰。密鑰值永遠唔會匯出。",
    "requiredArtifactStores": "套用之前，請喺目標租戶度建立呢啲成品儲存區。"
   }
  }
 }
});

// Durable continuation and remote execution.
yueHant.enums.runStatus.Suspended = "已暫停";
yueHant.resources.deployments.fields.suspensionEnabled = "等批核時暫停";
yueHant.resources.harnessProfiles.fields.sessionFormat = "Harness 工作階段格式";
yueHant.enums.auditEventType.QueueFull = "佇列滿咗";
yueHant.enums.runExecutor.RemoteA2A = "遠端 A2A";
yueHant.enums.runExecutor.RemoteMcp = "遠端 MCP";
yueHant.tips.resources.deployments.suspensionEnabled = "等候時啟用持久檢查點。需要 Process、獨立主目錄、相容而可恢復嘅 Harness 同產物儲存。";
yueHant.tips.resources.harnessProfiles.sessionFormat = "可攜式檢查點嘅版本化工作階段格式。Harness 更新改變相容性時要更新呢個值。";
yueHant.tips.enums.runStatus.Suspended = "執行有持久工作階段檢查點，等候時唔會佔用工作節點租約或者執行位置。";
yueHant.tips.enums.runExecutor.RemoteA2A = "執行已驗證嘅註冊 A2A 代理，支援期限同取消。";
yueHant.tips.enums.runExecutor.RemoteMcp = "用驗證過嘅 JSON 輸入呼叫揀咗嘅遠端 MCP 工具。";
yueHant.tips.enums.auditEventType.QueueFull = "叢集、租戶或者代理嘅佇列滿咗，所以唔接受新執行。";

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
})(yueHant, {
 "enums": {
  "agentRevisionState": {
   "Draft": "草稿",
   "Published": "已發佈"
  },
  "promotionKind": {
   "Promote": "推進",
   "Rollback": "還原"
  },
  "promotionOutcome": {
   "Applied": "已套用",
   "RolledBack": "已還原"
  },
  "revisionChangeType": {
   "Changed": "改咗",
   "Added": "加咗",
   "Removed": "移除咗"
  },
  "resourceType": {
   "AgentRevision": "代理程式修訂",
   "Promotion": "推進"
  }
 },
 "errorCodes": {
  "PromotionOrderViolation": "目標唔係來源嘅下一個環境。想唔跟次序推進，請開啟「容許跳過環境」。",
  "NoNextEnvironment": "來源已經係最後一個環境，冇得再推進。",
  "NoTargetDeployments": "呢個代理程式喺目標環境冇部署。請先喺嗰度建立一個。",
  "NoSourceRevision": "冇修訂可以推進：代理程式喺來源環境冇部署，或者冇已發佈嘅修訂。請明確揀一個修訂。",
  "AmbiguousSourceRevision": "來源環境嘅部署行緊唔同嘅修訂。請揀要推進嘅修訂。",
  "RevisionNotPublished": "嗰個修訂係草稿。請先發佈再推進。",
  "PromotionConflict": "套用推進期間有部署改咗。乜都冇改到；請重新載入再試。",
  "NotAPromotion": "只可以還原推進記錄，唔可以還原還原記錄。",
  "AlreadyRolledBack": "呢次推進已經還原咗。",
  "RevisionUnchanged": "草稿同最新發佈嘅修訂一樣。請先改咗佢先發佈，或者捨棄佢。",
  "RevisionPublished": "呢個修訂已經發佈咗，唔可以再改。",
  "EnvironmentInUse": "你移除咗嘅某個環境仲有部署。請先搬走或者刪除嗰啲部署。"
 },
 "views": {
  "agentDetail": {
   "revisions": "修訂",
   "draftNotice": "呢個代理程式有未發佈嘅草稿改動。草稿發佈之前，部署會繼續行已發佈嘅修訂。",
   "reviewDraft": "睇下草稿"
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "number": "修訂編號",
    "state": "狀態",
    "author": "作者",
    "changeNote": "改動說明",
    "publishedUtc": "發佈時間",
    "actions": "動作"
   },
   "number": "修訂 {{number}}",
   "option": "修訂 {{number}}（{{state}}）",
   "latest": "最新",
   "empty": "呢個代理程式仲未有修訂。",
   "compareTitle": "比較修訂",
   "from": "由",
   "to": "去",
   "pickTwo": "請揀兩個唔同嘅修訂嚟比較。",
   "identical": "修訂 {{from}} 同 {{to}} 嘅內容一樣。",
   "diffSummary": "修訂 {{from}} 同修訂 {{to}} 之間改咗嘅欄位：{{changed}}。",
   "diffColumns": {
    "field": "欄位",
    "change": "改動",
    "before": "之前",
    "after": "之後"
   },
   "emptyValue": "（空白）",
   "compare": "比較",
   "publish": "發佈",
   "discard": "捨棄草稿",
   "publishTitle": "發佈修訂 {{number}}",
   "publishBody": "發佈之後，修訂 {{number}} 會成為最新發佈嘅修訂。跟最新修訂嘅部署由下一次執行開始用佢；釘選咗嘅部署會保留自己嘅修訂。",
   "changeNote": "改動說明",
   "changeNotePlaceholder": "改咗乜同點解（可選）",
   "publishing": "發佈緊...",
   "published": "已發佈修訂 {{number}}。",
   "discardTitle": "捨棄草稿修訂 {{number}}",
   "discardMessage": "要捨棄草稿？佢嘅改動會冇咗。已發佈嘅修訂同部署唔受影響。",
   "discarded": "草稿已經捨棄咗。"
  },
  "promote": {
   "title": "推進修訂",
   "intro": "將目標環境入面呢個代理程式嘅每個部署，釘選到來源環境行緊嘅修訂。每次推進都會記錄低，而且可以還原。",
   "agent": "代理程式",
   "revision": "要推進嘅修訂",
   "revisionFromSource": "來源環境行緊嘅修訂",
   "source": "來源環境",
   "target": "目標環境",
   "targetNext": "下一個環境（{{name}}）",
   "allowSkip": "容許跳過環境",
   "skipWarning": "{{target}} 唔係緊接 {{source}} 嘅環境。",
   "note": "備註",
   "notePlaceholder": "點解要推進（可選）",
   "submit": "推進",
   "promoting": "推進緊...",
   "promoted": "已經推進到 {{target}}。更新咗嘅部署：{{deployments}}。",
   "errors": {
    "noNext": "來源環境之後冇其他環境。",
    "sameEnvironment": "請揀一個同來源唔同嘅目標環境。",
    "needsSkip": "呢個目標會跳過一個環境。想唔跟次序推進，請開啟「容許跳過環境」。"
   }
  },
  "promotions": {
   "title": "推進紀錄",
   "agentFilter": "代理程式",
   "allAgents": "所有代理程式",
   "empty": "仲未有推進或者還原紀錄。",
   "columns": {
    "createdUtc": "時間",
    "kind": "類型",
    "outcome": "結果",
    "agent": "代理程式",
    "revision": "修訂",
    "environments": "環境",
    "deployments": "部署",
    "actor": "執行人",
    "note": "備註",
    "actions": "動作"
   },
   "path": "{{source}} 去 {{target}}",
   "pinChange": "（{{from}} 去 {{to}}）",
   "skipped": "跳過咗環境",
   "rollback": "還原",
   "rollbackTitle": "還原推進",
   "rollbackMessage": "要將呢次由 {{source}} 去 {{target}} 嘅推進改過嘅部署，還原返之前嘅修訂釘選？受影響嘅部署：{{deployments}}。",
   "rollbackNote": "還原備註",
   "rolledBack": "已經還原。之前嘅修訂釘選已經恢復。"
  }
 },
 "resources": {
  "deployments": {
   "columns": {
    "environment": "環境",
    "agentRevisionId": "釘選嘅修訂"
   },
   "fields": {
    "environment": "環境",
    "agentRevisionId": "修訂釘選"
   },
   "hints": {
    "environment": "推進會跟租用戶嘅次序，喺環境之間移動修訂。",
    "agentRevisionId": "留空就跟代理程式最新發佈嘅修訂。釘選之後，呢個部署會停喺一個修訂，直到你或者某次推進改咗佢。"
   },
   "followLatest": "跟最新發佈",
   "latest": "最新",
   "selectAgentFirst": "請先揀一個代理程式。",
   "noPublished": "呢個代理程式仲未有已發佈嘅修訂。",
   "actions": {
    "promote": "推進",
    "promotions": "推進紀錄"
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
})(yueHant, {
 "nav": {
  "items": {
   "agentAssets": {
    "label": "資產",
    "tip": "有版本管理嘅系統提示、技能、參考檔案同文件範本，俾代理程式修訂釘選。"
   }
  }
 },
 "enums": {
  "agentAssetKind": {
   "SystemPrompt": "系統提示",
   "Skill": "技能",
   "ReferenceFile": "參考檔案",
   "DocumentTemplate": "文件範本"
  },
  "runOutcome": {
   "AssetIntegrityFailed": "資產完整性檢查失敗"
  },
  "resourceType": {
   "AgentAsset": "代理程式資產"
  }
 },
 "errorCodes": {
  "AssetInUse": "仍然有代理程式修訂釘選緊呢個資產。請先喺嗰啲修訂移除佢，再刪除。",
  "AssetKindImmutable": "資產建立之後唔可以改類型。請建立一個新資產。",
  "AssetStoreImmutable": "資產建立之後唔可以改成品存放區。請建立一個新資產。",
  "AssetTemplateRequired": "系統提示資產需要一個提示範本，其他類型就唔可以有。",
  "AssetFileTooLarge": "有個檔案超過 Assets.MaxFileBytes 設定容許嘅大小。",
  "AssetVersionTooLarge": "啲檔案加埋超過 Assets.MaxVersionBytes 設定容許嘅大小。",
  "AssetTooManyFiles": "呢次上載嘅檔案數目超過 Assets.MaxFilesPerVersion 設定容許嘅上限。",
  "AssetHasNoFiles": "系統提示資產冇檔案。請改佢嘅提示範本。"
 },
 "common": {
  "fieldCodes": {
   "InvalidAssetPath": "請用相對路徑，用正斜線分隔，唔可以有「.」或者「..」片段，最多 512 個字元。",
   "MacroFormatRefused": "唔接受啟用咗巨集嘅 Office 檔案（Assets.AllowMacroFormats）。請將檔案儲存做 .docx 或者 .dotx。",
   "AssetHasNoFiles": "系統提示資產冇檔案。請改佢嘅提示範本。",
   "AssetTemplateRequired": "請為系統提示資產揀一個提示範本。"
  },
  "serverText": {
   "assetInUse": "資產 {{asset}} 俾以下代理程式嘅修訂釘選緊：{{agents}}。請先喺嗰啲修訂移除佢。",
   "assetFileTooLarge": "檔案 {{path}} 有 {{size}} 位元組；上限係 {{limit}} 位元組（Assets.MaxFileBytes）。",
   "assetVersionTooLarge": "呢個版本超過 {{limit}} 位元組（Assets.MaxVersionBytes）。",
   "assetTooManyFiles": "每個版本最多 {{limit}} 個檔案（Assets.MaxFilesPerVersion）；呢次上載有 {{count}} 個。",
   "assetHasNoFiles": "系統提示資產冇檔案。請改佢嘅提示範本。"
  }
 },
 "resources": {
  "agentAssets": {
   "title": "資產",
   "subtitle": "有版本管理嘅系統提示、技能、參考檔案同文件範本，俾代理程式修訂釘選。",
   "add": "新增資產",
   "create": "建立資產",
   "edit": "編輯資產",
   "view": "資產詳情",
   "deleteTitle": "刪除資產",
   "emptyTitle": "仲未有資產",
   "emptyBody": "建立一個資產，將佢嘅檔案上載做一個版本，再喺代理程式修訂釘選佢。",
   "columns": {
    "name": "名稱",
    "kind": "類型",
    "currentVersion": "目前版本",
    "description": "描述",
    "tags": "標籤",
    "artifactStoreId": "存放區",
    "id": "資產 ID",
    "createdUtc": "建立時間"
   },
   "fields": {
    "name": "名稱",
    "kind": "類型",
    "promptTemplateId": "提示範本",
    "artifactStoreId": "成品存放區",
    "description": "描述",
    "tags": "標籤"
   },
   "hints": {
    "kind": "建立之後固定。系統提示資產嘅文字嚟自提示範本；其他類型就存放上載嘅檔案。",
    "promptTemplateId": "呢個資產用嚟提供代理程式系統提示文字嘅提示範本。",
    "artifactStoreId": "上載檔案存放嘅位置。建立之後固定。留空就會存喺 Garrison 資料庫。"
   },
   "errors": {
    "templateRequired": "請揀呢個系統提示資產用嘅提示範本。"
   },
   "version": "版本 {{number}}",
   "noVersion": "冇版本",
   "databaseStore": "Garrison 資料庫",
   "actions": {
    "versions": "版本"
   }
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "assetPins": "資產"
   }
  },
  "assets": {
   "versionsTitle": "{{name}} 嘅版本",
   "current": "目前",
   "noVersions": "呢個資產仲未有版本。請喺下面上載佢嘅檔案。",
   "systemPromptNotice": "系統提示資產冇檔案。佢嘅文字嚟自提示範本，所以要改就請編輯範本。",
   "showFiles": "檔案",
   "filesTitle": "版本 {{number}} 嘅檔案",
   "noFiles": "呢個版本冇檔案。",
   "preview": "預覽",
   "download": "下載",
   "previewTitle": "{{path}}（版本 {{number}}）",
   "emptyFile": "呢個檔案係空嘅。",
   "versionColumns": {
    "number": "版本",
    "author": "作者",
    "changeNote": "改動說明",
    "totalBytes": "總大小",
    "createdUtc": "建立時間",
    "actions": "動作"
   },
   "fileColumns": {
    "path": "路徑",
    "mediaType": "媒體類型",
    "sizeBytes": "大小",
    "sha256": "SHA-256 摘要",
    "actions": "動作"
   },
   "uploadTitle": "上載新版本",
   "uploadHint": "揀一個或者多個檔案。每次上載都係一個完整版本：冇揀嘅檔案唔會由目前版本帶過嚟。",
   "files": "檔案",
   "uploadColumns": {
    "path": "資產入面嘅路徑",
    "mediaType": "媒體類型",
    "size": "大小",
    "actions": "移除"
   },
   "mediaTypeGuessed": "按副檔名推斷",
   "removeFile": "喺今次上載移除呢個檔案",
   "changeNote": "改動說明",
   "changeNotePlaceholder": "呢個版本改咗啲乜",
   "upload": "上載版本",
   "uploading": "上載緊...",
   "uploadCreated": "已建立版本 {{number}}。",
   "uploadUnchanged": "啲檔案同目前版本 {{number}} 一樣，所以冇建立新版本。",
   "limitSetting": "呢個上限由伺服器設定 {{setting}} 決定。",
   "duplicatePath": "今次上載有另一個檔案用咗同一個路徑。",
   "pinVersion": "{{name}} 版本 {{version}}",
   "pinCurrent": "{{name}}（目前）",
   "pinsTitle": "資產釘選",
   "pinsSave": "儲存草稿",
   "pinsSaved": "已喺草稿修訂 {{number}} 儲存資產釘選。",
   "pinsDraft": "會改草稿修訂 {{number}} 嘅資產釘選。草稿其他部分維持不變。",
   "pinsNewDraft": "而家冇開啟緊嘅草稿。儲存會由已發佈修訂 {{number}} 開一個新草稿，並用呢啲資產釘選。",
   "pinsEmpty": "冇釘選任何資產。",
   "pinAsset": "資產",
   "pinVersionLabel": "版本",
   "chooseAsset": "揀一個資產",
   "assetOption": "{{name}}（{{kind}}）",
   "followCurrent": "目前版本",
   "removePin": "移除呢個資產釘選",
   "addPin": "新增資產",
   "editPins": "資產",
   "pinsNewDraftButton": "喺新草稿釘選資產"
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
})(yueHant, {
 "views": {
  "conversationDetail": {
   "tabsLabel": "對話分區",
   "tabs": {
    "turns": "各輪",
    "files": "檔案"
   }
  },
  "runDetail": {
   "fileSpace": "檔案空間",
   "openFiles": "打開檔案"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "fileSpaceMountPath": "檔案空間資料夾"
   },
   "hints": {
    "fileSpaceMountPath": "執行工作區入面嘅資料夾，執行開始嗰陣會收到對話嘅共用檔案，完咗之後會將入面嘅改動寫返去。預設係 files。"
   }
  }
 },
 "errorCodes": {
  "InvalidFilePath": "請用相對路徑，用正斜線分隔，唔可以有「.」或者「..」片段。",
  "FileTooLarge": "個檔案大過 FileSpaces.MaxFileBytes 設定容許嘅大小。",
  "FileSpaceFull": "檔案空間會超出 FileSpaces.MaxTotalBytes 設定。",
  "TooManyFiles": "檔案空間嘅檔案數已經到咗 FileSpaces.MaxFiles 設定嘅上限。",
  "StaleFileUpload": "呢個執行已經冇再持有租約，所以佢嘅檔案改動冇寫入。"
 },
 "common": {
  "fieldCodes": {
   "InvalidFilePath": "請用相對路徑，用正斜線分隔，唔可以有「.」或者「..」片段。"
  },
  "serverText": {
   "fileSpaceFileTooLarge": "檔案 {{path}} 有 {{size}} 位元組；上限係 {{limit}} 位元組 (FileSpaces.MaxFileBytes)。",
   "fileSpaceFull": "檔案空間會超過 {{limit}} 位元組 (FileSpaces.MaxTotalBytes)。",
   "fileSpaceTooManyFiles": "檔案空間已經有 {{count}} 個檔案 (FileSpaces.MaxFiles)。",
   "fileNotFound": "搵唔到檔案 {{path}}。"
  }
 },
 "components": {
  "files": {
   "title": "檔案",
   "summary": "共用檔案：{{count}} 個 ({{size}})",
   "live": "即時",
   "polling": "定時重新整理",
   "includeDeleted": "顯示已刪除嘅檔案",
   "refresh": "重新整理",
   "spaceId": "檔案空間 {{id}}",
   "emptyTitle": "未有檔案",
   "emptyBody": "各輪寫入共用資料夾嘅檔案，同埋你喺下面上載嘅檔案，都會喺呢度顯示。",
   "emptyBodyDeleted": "呢個對話嘅共用資料夾仲未寫入過任何嘢，連之後刪咗嘅檔案都冇。",
   "columns": {
    "path": "路徑",
    "currentVersion": "版本",
    "sizeBytes": "大小",
    "mediaType": "媒體類型",
    "lastUpdateUtc": "更新時間",
    "actions": "動作"
   },
   "deleted": "已刪除",
   "version": "版本 {{number}}",
   "versions": "版本紀錄",
   "download": "下載",
   "deleteLabel": "刪除 {{path}}",
   "deletedToast": "已經刪除 {{path}}。佢嘅版本會保留。",
   "deleteTitle": "刪除檔案",
   "confirmDelete": "要喺共用檔案度刪除 {{path}} 嗎？之後嘅各輪會睇唔到佢。佢嘅版本會保留，仲可以下載。",
   "versionsTitle": "{{path}} 嘅版本",
   "noVersions": "呢個檔案冇版本。",
   "current": "目前",
   "versionColumns": {
    "number": "版本",
    "sizeBytes": "大小",
    "mediaType": "媒體類型",
    "sha256": "SHA-256 摘要",
    "writtenBy": "寫入者",
    "createdUtc": "寫入時間",
    "actions": "動作"
   },
   "preview": "預覽",
   "previewTitle": "{{path}} (版本 {{number}})",
   "emptyFile": "呢個版本係空嘅。",
   "uploadTitle": "上載檔案",
   "uploadHint": "揀一個或者多個檔案，然後檢查佢哋嘅路徑。路徑同清單入面嘅檔案一樣嘅話，就會幫嗰個檔案加一個新版本。如果清單載入之後有一輪改咗嗰個檔案，你上載嘅嘢會用衝突名稱放喺佢隔籬，唔會取代佢。",
   "uploadCreated": "已經將 {{path}} 加入做版本 {{version}}。",
   "uploadReplaced": "已經將 {{path}} 儲存做版本 {{version}}。",
   "uploadConflict": "{{requested}} 喺清單載入之後改咗，所以你上載嘅嘢存咗做 {{path}}。請比較兩個檔案，再刪除唔要嗰個。",
   "chooseFiles": "要上載嘅檔案",
   "uploadColumns": {
    "path": "喺共用資料夾嘅路徑",
    "replaces": "取代",
    "size": "大小",
    "actions": "移除"
   },
   "replacesVersion": "版本 {{version}}",
   "newFile": "新檔案",
   "removeFile": "將呢個檔案由上載移除",
   "upload": "上載",
   "uploading": "上載緊...",
   "limitSetting": "呢個上限由伺服器設定 {{setting}} 決定。"
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
})(yueHant, {
 "nav": {
  "items": {
   "capabilities": {
    "label": "能力",
    "tip": "能力目錄：負責統籌嘅代理程式搵到同用得到嘅代理程式、MCP 工具同 Harness 內置工具，附成本同延遲提示。"
   }
  }
 },
 "enums": {
  "capabilityKind": {
   "Agent": "代理程式",
   "McpTool": "MCP 工具",
   "HarnessBuiltIn": "Harness 內置工具"
  },
  "capabilityOrigin": {
   "Derived": "衍生",
   "Manual": "手動"
  },
  "capabilityHintStatus": {
   "Unknown": "未知",
   "Known": "已知"
  },
  "runBlockedReason": {
   "NoToolWorker": "冇工作節點有呢個工具"
  },
  "resourceType": {
   "ConversationFileSpace": "對話檔案空間",
   "Capability": "能力"
  }
 },
 "errorCodes": {
  "InvalidJsonSchema": "有個結構唔係有效嘅 JSON Schema。請改好輸入或者輸出結構，再儲存。",
  "NameConflict": "已經有另一個手動能力用緊呢個名。請揀過第二個名。",
  "CapabilityDerived": "呢個能力係由佢嘅來源衍生出嚟，會跟住來源變，所以喺度改唔到亦刪唔到。請改返個來源。",
  "InvalidTags": "最多用 32 個標籤，每個 1 至 64 個字元。",
  "TooManyRequirements": "最多用 16 項節點標籤要求。"
 },
 "common": {
  "fieldCodes": {
   "InvalidJsonSchema": "呢個唔係有效嘅 JSON Schema。",
   "InvalidTags": "最多用 32 個標籤，每個 1 至 64 個字元。",
   "TooManyRequirements": "最多用 16 項節點標籤要求。"
  },
  "serverText": {
   "capabilityDerivedEdit": "能力 {{name}} 係由佢嘅來源衍生出嚟，會跟住來源變。請改返個來源。",
   "capabilityDerivedDelete": "能力 {{name}} 係由佢嘅來源衍生出嚟，來源冇咗佢就會一齊冇咗，所以唔可以直接刪除。",
   "capabilityShared": "能力 {{name}} 係所有租用戶共用，嚟自內置嘅 Harness 設定檔，所以改唔到。",
   "capabilityNameConflict": "已經有一個叫 {{name}} 嘅手動能力。",
   "capabilitySecretsDenied": "你冇權用 MCP 伺服器 {{server}} 會傳送嘅機密，所以冇列出佢嘅工具。",
   "capabilityNoStdioWorker": "冇一個就緒嘅工作節點開咗 stdio MCP 診斷（GARRISON_WORKER_MCP_TESTS_ENABLED），所以列唔到 stdio 伺服器嘅工具。",
   "capabilityRefreshFailed": "喺 {{when}} 重新整理失敗：{{error}}",
   "capabilityMissingTools": "缺少必要嘅工具：{{tools}}。",
   "capabilityProbeShadowed": "工作節點用 {{probe}} 探測 {{name}}，呢個探測係另一個 Harness 設定檔先定義咗。呢個設定檔嘅定義唔會被探測。"
  }
 },
 "components": {
  "blocked": {
   "reasons": {
    "NoToolWorker": "呢個執行嘅代理程式用到 {{tools}}，但係冇一個做到 {{harness}} 嘅就緒工作節點話有呢個工具。請喺工作節點主機裝好個工具，等佢嘅探測報返節點標籤 garrison.io/tool-{name}=true，或者自己手動幫工作節點加呢個標籤。"
   }
  },
  "revisions": {
   "columns": {
    "capabilities": "能力"
   }
  },
  "capabilities": {
   "noSource": "手動項目",
   "shared": "共用",
   "hintsLine": "中位數 {{median}}，p90 {{p90}}，每次執行 {{cost}}",
   "hintsLineNoCost": "中位數 {{median}}，p90 {{p90}}，冇記錄成本",
   "hintsTitle": "成本同延遲提示",
   "noCost": "冇記錄成本",
   "windowDays_one": "{{count}} 日",
   "windowDays_other": "{{count}} 日",
   "refreshWarning": "上次重新整理呢個項目嘅來源失敗咗。",
   "requirementsTitle": "執行需要嘅節點標籤",
   "noRequirements": "冇。用呢個能力嘅執行可以去任何工作節點。",
   "noSchema": "冇結構",
   "fields": {
    "kind": "類型",
    "origin": "來源方式",
    "source": "來源",
    "lastRefreshedUtc": "上次重新整理",
    "tags": "標籤",
    "id": "ID 識別碼",
    "summary": "摘要",
    "hintStatus": "狀態",
    "sampleSize": "統計咗嘅執行數",
    "medianDurationMs": "時長中位數",
    "p90DurationMs": "p90 時長",
    "meanCostUsd": "平均成本",
    "windowDays": "統計期",
    "computedUtc": "計算時間",
    "inputSchemaJson": "輸入結構",
    "outputSchemaJson": "輸出結構"
   },
   "refreshTitle": "重新整理能力目錄",
   "refreshHint": "Garrison 會重新衍生代理程式同 Harness 內置工具嘅項目，列出每個 MCP 伺服器嘅工具（stdio 伺服器就經一個開咗 stdio 診斷嘅工作節點列出），再重新計算代理程式提示。列出一個伺服器嗰陣會將佢範本指明嘅機密傳畀佢，所以你要有權用嗰啲機密。",
   "refreshServer": "要列出嘅 MCP 伺服器",
   "refreshAll": "所有啟用緊嘅 MCP 伺服器",
   "refreshRun": "即刻重新整理",
   "refreshing": "重新整理緊...",
   "refreshDone": "能力目錄已經係最新。",
   "refreshPartial_one": "目錄重新整理咗，但係有 {{count}} 個 MCP 伺服器列唔到。",
   "refreshPartial_other": "目錄重新整理咗，但係有 {{count}} 個 MCP 伺服器列唔到。",
   "refresh": {
    "agents": "改咗嘅代理程式項目",
    "harnessBuiltIns": "改咗嘅內置工具項目",
    "hints": "重新計算咗嘅提示",
    "servers": "列出咗嘅 MCP 伺服器",
    "tools": "寫入咗嘅工具項目",
    "removed": "移除咗嘅工具項目",
    "failed": "失敗嘅伺服器",
    "noServers": "冇列出任何 MCP 伺服器。",
    "failedBadge": "失敗",
    "listedBadge": "已列出",
    "columns": {
     "server": "MCP 伺服器",
     "status": "結果",
     "tools": "工具",
     "removed": "已移除",
     "warned": "保留但有警告",
     "error": "錯誤"
    }
   },
   "errors": {
    "nameLength": "請用 1 至 {{max}} 個字元。",
    "summaryLength": "最多用 {{max}} 個字元。",
    "tags": "最多用 {{max}} 個標籤，每個 1 至 {{length}} 個字元。",
    "requirementCount": "最多用 {{max}} 項節點標籤要求。",
    "requirement": "每項要求都要有一個 1 至 {{max}} 個字元嘅節點標籤鍵。",
    "toolNeedsServer": "請揀個工具所屬嘅 MCP 伺服器。",
    "probeCount": "一個 Harness 設定檔最多有 {{max}} 個工具探測。",
    "probeName": "工具名稱係 1 至 63 個細階字母、數字、點同連字號，要用字母或者數字開頭。",
    "probeDuplicate": "呢個設定檔已經有另一個探測叫 {{name}}。",
    "probeExecutable": "執行檔要係一個喺 PATH 搵得到嘅純檔案名（字母、數字、點、底線、加號同連字號），唔可以有資料夾。",
    "probeArgument": "唔揀參數，或者喺 {{allowed}} 入面揀一個。",
    "probeDescription": "最多用 {{max}} 個字元。"
   },
   "draftTitle": "能力",
   "draftSave": "儲存草稿",
   "draftSaved": "已喺草稿修訂 {{number}} 儲存能力。",
   "draftEdit": "會改草稿修訂 {{number}} 嘅能力。草稿其他部分維持不變。",
   "draftNew": "而家冇開啟緊嘅草稿。儲存會由已發佈修訂 {{number}} 開一個新草稿，並用呢啲能力。",
   "draftPlacementHint": "喺度指明嘅 Harness 內置工具會將佢嘅節點標籤加落呢個代理程式嘅執行，咁啲執行就只會去報咗有呢個工具嘅工作節點。",
   "draftEmpty": "呢個修訂冇用任何能力。",
   "notInCatalog": "唔喺目錄入面",
   "removeName": "移除 {{name}}",
   "chooseName": "揀一個能力",
   "nameOption": "{{name}}（{{kinds}}）",
   "addName": "加入能力",
   "newDraftButton": "喺新草稿揀能力",
   "editDraft": "能力"
  }
 },
 "resources": {
  "capabilities": {
   "title": "能力",
   "subtitle": "負責統籌嘅代理程式搵到同用得到嘅代理程式、MCP 工具同 Harness 內置工具，附成本同延遲提示。",
   "add": "新增能力",
   "create": "建立能力",
   "edit": "編輯能力",
   "view": "能力詳情",
   "deleteTitle": "刪除能力",
   "emptyTitle": "仲未有能力",
   "emptyBody": "發佈一個代理程式修訂、註冊一個 MCP 伺服器，或者喺 Harness 設定檔加一個工具探測，然後重新整理。你亦可以自己加手動項目。",
   "columns": {
    "name": "名稱",
    "kind": "類型",
    "origin": "來源方式",
    "summary": "摘要",
    "source": "來源",
    "hints": "提示",
    "tags": "標籤",
    "lastRefreshedUtc": "上次重新整理",
    "id": "ID 識別碼",
    "createdUtc": "建立時間"
   },
   "fields": {
    "name": "名稱",
    "kind": "類型",
    "summary": "摘要",
    "sourceAgentId": "代表嘅代理程式",
    "sourceMcpServerId": "所屬嘅 MCP 伺服器",
    "sourceToolName": "喺嗰個伺服器嘅工具名稱",
    "tags": "標籤",
    "requirements": "執行需要嘅節點標籤",
    "inputSchemaJson": "輸入結構",
    "outputSchemaJson": "輸出結構"
   },
   "hints": {
    "kind": "手動項目可以係任何類型，例如代理程式經技能用到嘅轉換服務。",
    "requirements": "用到呢個能力嘅代理程式，佢嘅執行只會去有齊呢啲節點標籤嘅工作節點。",
    "sourceMcpServerId": "選填。指明咗伺服器嘅項目，只有喺執行權杖所屬嘅部署綁定咗嗰個伺服器嗰陣先睇得到。",
    "inputSchemaJson": "一個 JSON Schema，例如 {\"type\": \"object\"}。如果個能力收自由文字，就留空。"
   },
   "tagFilter": "標籤",
   "refresh": "重新整理",
   "warningBadge": "重新整理失敗",
   "warnings_one": "有 {{count}} 個項目因為上次重新整理佢嘅來源失敗咗，所以保留咗最後一次正常嘅內容。打開佢就睇到原因。",
   "warnings_other": "有 {{count}} 個項目因為上次重新整理佢哋嘅來源失敗咗，所以保留咗最後一次正常嘅內容。打開其中一個就睇到原因。",
   "noSourceOption": "冇",
   "requirementKey": "節點標籤",
   "requirementValue": "值"
  },
  "harnessProfiles": {
   "fields": {
    "toolProbes": "工具探測",
    "probeName": "工具名稱",
    "probeExecutable": "執行檔",
    "probeArgument": "參數",
    "probeDescription": "說明"
   },
   "columns": {
    "toolProbes": "工具探測"
   },
   "hints": {
    "toolProbes": "工作節點主機有裝嘅話，呢個 Harness 用得到嘅工具。工作節點註冊之前會逐個探測行一次，再將有回應嘅工具報做節點標籤 garrison.io/tool-{name}=true。"
   },
   "addToolProbe": "加入工具探測",
   "probeNoArgument": "冇參數"
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
})(yueHant, {
 "enums": {
  "fanOutGroupStatus": {
   "Running": "執行緊",
   "Joined": "已匯合",
   "TimedOut": "已逾時",
   "BudgetExceeded": "超出預算",
   "Cancelled": "已取消"
  },
  "fanOutJoinPolicy": {
   "All": "全部",
   "Any": "任何一個",
   "Quorum": "法定數"
  },
  "resourceType": {
   "FanOutGroup": "扇出組"
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "扇出組"
  }
 },
 "components": {
  "fanOut": {
   "group": "扇出組",
   "groupTitle": "扇出組 {{id}}",
   "otherChildren": "其他子執行",
   "detailsUnavailable": "載入唔到呢個組嘅詳細資料，所以淨係列出佢嘅成員執行。",
   "policy": "匯合策略",
   "quorumPolicy": "{{policy}}：{{total}} 個入面 {{quorum}} 個",
   "progress": "進度",
   "progressValue": "{{total}} 個入面完咗 {{finished}} 個，成功 {{succeeded}} 個",
   "cost": "費用",
   "tokens": "Token 數",
   "usedOf": "{{used}} / {{limit}}",
   "noLimit": "{{used}}（冇上限）",
   "deadline": "截止時間",
   "noDeadline": "冇",
   "started": "開始時間",
   "completed": "結束時間",
   "pending": "仲執行緊：{{labels}}",
   "failed": "未成功：{{labels}}",
   "live": "即時",
   "polling": "定時重新整理",
   "cancel": "取消組",
   "cancelTitle": "取消扇出組",
   "confirmCancel": "要取消扇出組 {{id}} 嗎？仲執行緊嘅成員會被取消，上層執行會見到呢個組已取消。",
   "cancelledToast": "已經取消扇出組 {{id}}。",
   "columns": {
    "label": "標籤",
    "agent": "代理",
    "status": "狀態",
    "costUsd": "費用",
    "tokens": "Token 數",
    "run": "執行"
   }
  }
 },
 "common": {
  "serverText": {
   "fanOutParentEnded": "上層執行已經完咗或者被取消咗。",
   "fanOutCostExceeded": "成員用咗 {{cost}} USD，超出咗 {{budget}} USD 嘅預算。",
   "fanOutTokensExceeded": "成員用咗 {{tokens}} 個 Token，超出咗 {{budget}} 嘅預算。",
   "fanOutTimedOut": "呢個組 {{seconds}} 秒嘅逾時已經到咗，仲有 {{running}} 個成員執行緊。",
   "fanOutAnySucceeded": "有一個成員成功咗。",
   "fanOutNoneSucceeded": "所有成員都完咗，冇一個成功。",
   "fanOutQuorumMet": "{{succeeded}} 個成員成功，夠咗法定數 {{quorum}}。",
   "fanOutQuorumUnreachable": "失敗嘅成員太多，已經冇可能夠法定數 {{quorum}}。",
   "fanOutAllFinished": "所有成員都完咗。",
   "fanOutCancelledByTool": "上層執行用 garrison_cancel_fan_out 取消咗呢個組。",
   "fanOutCancelledBy": "由 {{who}} 取消。"
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
})(yueHant, {
 "nav": {
  "items": {
   "apps": {
    "label": "應用程式",
    "tip": "代理式應用程式：一組代理程式喺同一個聊天介面後面服務終端用戶，包括佢哋嘅呼叫圖、委派、修訂同可以分享嘅 URL。"
   }
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "租用戶用戶",
   "AppUsers": "應用程式用戶",
   "Anonymous": "匿名"
  },
  "resourceType": {
   "AgenticApp": "代理式應用程式"
  }
 },
 "errorCodes": {
  "AppSlugTaken": "已經有另一個應用程式用緊呢個 URL 代稱。代稱喺成個叢集入面都要唯一，請揀過第二個。",
  "NoPublishedRevision": "冇已發佈嘅修訂可以用。請先發佈一個。",
  "AgentInUse": "呢個代理程式係某個代理式應用程式嘅成員。請先將佢喺應用程式度移除。"
 },
 "common": {
  "fieldCodes": {
   "InvalidName": "請用 1 到 64 個細楷字母、數字同連字號，開頭同結尾都要係字母或者數字。",
   "InvalidSlug": "請用 2 到 63 個細楷字母、數字同連字號，開頭要係字母或者數字。",
   "UnknownAgent": "呢個租用戶冇呢個代理程式。",
   "DuplicateMember": "每個代理程式只可以做一次成員。",
   "EntryNotMember": "入口代理程式一定要係其中一個成員。",
   "EdgeNotMember": "呼叫嘅兩端都一定要係應用程式嘅成員。",
   "SelfEdge": "成員唔可以呼叫自己。",
   "AppGraphCycle": "成員之間嘅呼叫形成咗一個循環。請喺循環入面移除其中一個呼叫。",
   "UnreachableMember": "每個成員都一定要可以由入口代理程式經呼叫去到。",
   "UnreachableMemberNamed": "入口代理程式經呼叫去唔到呢啲成員：{{names}}。請加一個呼叫去每個成員，或者移除佢哋。",
   "UnknownEnvironment": "呢個租用戶冇呢個環境。",
   "InvalidEntryDeployment": "請揀入口代理程式喺呢個環境嘅一個部署。",
   "DuplicateEnvironment": "每個環境只可以列一次。",
   "InvalidColor": "請用 #RRGGBB 格式嘅顏色，例如 #1F6FEB。",
   "UnknownAsset": "呢個租用戶冇呢個代理程式資產。",
   "Required": "呢個欄位一定要填。",
   "TooMany": "呢度嘅項目太多。"
  },
  "serverText": {
   "appNameConflict": "已經有一個叫 {{name}} 嘅應用程式。",
   "appSlugTaken": "URL 代稱 {{slug}} 已經俾人用咗。代稱喺成個叢集入面都要唯一，請揀過第二個。",
   "appNoPublishedRevision": "應用程式 {{name}} 冇已發佈嘅修訂可以推進。",
   "appMemberNotPublished": "成員 {{name}} 冇已發佈嘅修訂可以釘選。請先發佈一個。",
   "appRevisionPublished": "應用程式 {{name}} 嘅修訂 {{number}} 已經發佈咗。",
   "appNoTargetDeployments": "成員 {{member}} 喺環境 {{environment}} 冇部署。請先喺嗰度建立一個。乜都冇推進。",
   "agentInApps": "代理程式 {{agent}} 係 {{apps}} 嘅成員。請先將佢喺應用程式度移除。"
  }
 },
 "components": {
  "form": {
   "pickColor": "幫 {{field}} 揀顏色"
  },
  "apps": {
   "graph": {
    "empty": "加成員就睇到應用程式嘅圖。",
    "summary": "應用程式圖，有 {{members}} 個成員同 {{edges}} 個呼叫",
    "edgeFanOut": "{{caller}} 呼叫 {{callee}}，亦可以同時呼叫幾個",
    "edgeSingle": "{{caller}} 呼叫 {{callee}}，每次一個呼叫",
    "entryNode": "{{name}}，入口代理程式",
    "unreachableNode": "{{name}}，入口代理程式去唔到",
    "entry": "入口代理程式",
    "unreachable": "去唔到",
    "legendFanOut": "容許平行呼叫",
    "legendSingle": "每次一個呼叫"
   },
   "share": {
    "noSlug": "幫應用程式改個名或者 URL 代稱，就攞到佢嘅連結。",
    "open": "打開",
    "copy": "複製應用程式 URL",
    "inactive": "呢個應用程式未啟用，所以你重新啟用之前，條連結都用唔到。",
    "signIn": {
     "TenantUsers": "呢個租用戶任何啟用中嘅用戶都可以登入。",
     "AppUsers": "只有喺呢個應用程式有 AppUser 角色嘅用戶先可以登入。",
     "Anonymous": "有連結嘅人唔使登入都可以用呢個應用程式。已登入嘅用戶照樣用得。",
     "AnonymousDisabled": "揀咗匿名但未開啟，所以冇人可以唔登入就入去，而且只有有存取權嘅租用戶用戶先可以登入。"
    }
   },
   "delegation": {
    "title": "按應用程式圖設定委派",
    "intro": "應用程式嘅呼叫就係佢嘅委派策略。每個成員應該啱啱好容許佢呼叫嘅成員，而最大深度要包到佢下面最長嗰條呼叫鏈。已發佈修訂唔係咁設定嘅成員就係偏移咗。",
    "apply": "寫入草稿",
    "applying": "寫緊草稿...",
    "applied": "寫咗 {{drafts}} 個草稿修訂；跳過咗 {{skipped}} 個成員。",
    "appliedSummary": "寫咗 {{drafts}} 個草稿修訂，冇發佈任何嘢。跳過咗 {{skipped}} 個成員。請喺每個代理程式嘅「修訂」分頁睇過草稿再發佈。",
    "drifting_one": "有 {{count}} 個成員嘅已發佈委派同圖唔一樣。",
    "drifting_other": "有 {{count}} 個成員嘅已發佈委派同圖唔一樣。",
    "inSync": "每個成員嘅已發佈委派都同圖一致。",
    "empty": "呢個應用程式冇成員。",
    "notPublished": "未發佈",
    "drift": "偏移",
    "inSyncBadge": "已同步",
    "draftConflict": "草稿衝突",
    "draft": "草稿 {{number}}",
    "review": "啲草稿仲未生效。請打開每個代理程式，喺佢嘅「修訂」分頁睇過草稿，再發佈。",
    "columns": {
     "member": "成員",
     "desiredMode": "圖嘅模式",
     "desiredAllowList": "圖嘅允許清單",
     "desiredMaxDepth": "圖嘅深度",
     "publishedMode": "已發佈嘅模式",
     "publishedAllowList": "已發佈嘅允許清單",
     "publishedMaxDepth": "已發佈嘅深度",
     "status": "狀態"
    }
   },
   "revisions": {
    "title": "應用程式修訂",
    "intro": "應用程式修訂會釘選每個成員最新嘅已發佈修訂，同埋複製成員之間嘅呼叫。先發佈佢，再推進佢，等所有成員一齊去下一個環境。",
    "changeNote": "改動說明",
    "changeNotePlaceholder": "上一個修訂之後改咗啲乜",
    "take": "建立修訂",
    "taking": "建立緊...",
    "taken": "建立咗應用程式修訂 {{number}}。",
    "published": "發佈咗應用程式修訂 {{number}}。",
    "empty": "仲未有應用程式修訂。等每個成員都有已發佈修訂之後再建立一個。",
    "promote": "推進",
    "publish": "發佈",
    "publishTitle": "發佈應用程式修訂 {{number}}",
    "publishConfirm": "要發佈 {{name}} 嘅修訂 {{number}}？已發佈嘅修訂唔可以再改，而且會成為推進時預設用嘅修訂。",
    "pin": "{{name}}（修訂 {{number}}）",
    "columns": {
     "number": "修訂",
     "state": "狀態",
     "members": "釘選咗嘅成員",
     "edges": "呼叫",
     "author": "作者",
     "changeNote": "改動說明",
     "publishedUtc": "發佈時間",
     "actions": "動作"
    }
   },
   "promote": {
    "title": "推進應用程式",
    "intro": "每個成員釘選咗嘅修訂會一次過去到嗰個成員喺目標環境嘅每個部署。如果有成員喺嗰度冇部署，乜都唔會推進。",
    "revision": "應用程式修訂",
    "latestRevision": "最新已發佈",
    "promoted": "已經將應用程式推進到 {{target}}：更新咗 {{deployments}} 個部署。",
    "denied": "你唔可以推進到 {{target}}。推進需要目標環境「推進」嘅「執行」權限。"
   }
  }
 },
 "resources": {
  "apps": {
   "title": "應用程式",
   "subtitle": "一組代理程式喺同一個聊天介面後面服務終端用戶。入口代理程式同人傾偈，再沿住應用程式嘅呼叫去呼叫其他成員。",
   "add": "新增應用程式",
   "create": "建立應用程式",
   "edit": "編輯應用程式",
   "view": "應用程式詳細資料",
   "deleteTitle": "刪除應用程式",
   "emptyTitle": "仲未有應用程式",
   "emptyBody": "用你已經有嘅代理程式建立應用程式：揀成員、同人傾偈嘅入口代理程式，同埋邊個呼叫邊個。",
   "columns": {
    "name": "名稱",
    "url": "應用程式 URL",
    "entryAgentId": "入口代理程式",
    "members": "成員",
    "liveEnvironment": "上線環境",
    "authMode": "登入",
    "active": "狀態",
    "description": "描述",
    "id": "ID 識別碼",
    "lastUpdateUtc": "更新時間",
    "createdUtc": "建立時間"
   },
   "fields": {
    "name": "名稱",
    "slug": "URL 代稱",
    "description": "描述",
    "active": "啟用",
    "members": "成員",
    "membersItems": {
     "agentId": "代理程式",
     "role": "角色"
    },
    "entryAgentId": "入口代理程式",
    "edges": "成員之間嘅呼叫",
    "edgesItems": {
     "callerAgentId": "呼叫方",
     "calleeAgentId": "被呼叫方",
     "fanOutAllowed": "容許平行呼叫"
    },
    "graph": "圖",
    "environments": "每個環境嘅入口部署",
    "environmentsItems": {
     "environment": "環境",
     "deploymentId": "入口部署"
    },
    "liveEnvironment": "上線環境",
    "authMode": "邊個可以用呢個應用程式",
    "anonymousEnabled": "容許匿名使用",
    "showOperatorDetail": "俾終端用戶睇到工具呼叫同思考過程",
    "share": "可以分享嘅連結",
    "displayName": "顯示名稱",
    "logoAssetId": "標誌",
    "primaryColor": "主色",
    "accentColor": "強調色",
    "welcomeText": "歡迎文字"
   },
   "hints": {
    "slug": "應用程式喺 /apps/{slug}/。留空就用名稱。代稱喺成個叢集入面都要唯一。",
    "members": "應用程式入面嘅代理程式。角色係簡單講下每個做乜。",
    "entryAgentId": "同終端用戶傾偈嘅成員。其他每個成員都要可以由佢去到。",
    "edges": "邊個可以呼叫邊個。啲呼叫唔可以形成循環，而且會變成每個成員嘅委派策略。",
    "environments": "應用程式喺每個環境用嘅入口代理程式部署。冇揀嘅話，應用程式會按名稱次序，用入口代理程式喺嗰度第一個啟用中嘅部署。",
    "liveEnvironment": "應用程式介面連接嘅環境。",
    "anonymousEnabled": "匿名登入需要開呢個。匿名工作階段比較短，而且有速率限制。",
    "showOperatorDetail": "終端用戶一定會見到答案、結果同錯誤。開咗呢個就連工具呼叫、思考過程同進度都會顯示。",
    "logoAssetId": "資產目前版本入面嘅第一張圖片。",
    "welcomeText": "終端用戶發第一個訊息之前會見到。"
   },
   "steps": {
    "general": "應用程式",
    "members": "成員同呼叫",
    "environments": "環境",
    "access": "登入同連結",
    "branding": "品牌"
   },
   "actions": {
    "delegation": "委派",
    "revisions": "修訂同推進"
   },
   "errors": {
    "nameTaken": "呢個租用戶已經有另一個應用程式用緊呢個名。"
   },
   "addMember": "新增成員",
   "addEdge": "新增呼叫",
   "addEnvironment": "新增環境",
   "chooseAgent": "揀一個代理程式",
   "chooseEntry": "揀一個成員",
   "rolePlaceholder": "呢個成員做乜",
   "noEntryDeployment": "第一個啟用中嘅部署",
   "noLogo": "冇標誌",
   "displayNamePlaceholder": "喺應用程式頂部顯示"
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
})(yueHant, {
 "nav": {
  "items": {
   "studio": {
    "label": "工作室",
    "tip": "代理程式工作室：同代理程式架構師一齊喺草稿度設計代理程式同應用程式，喺試驗場試吓，再申請套用草稿。"
   }
  }
 },
 "enums": {
  "resourceType": {
   "StudioDraft": "工作室草稿"
  },
  "approvalKind": {
   "DraftApply": "套用草稿"
  },
  "studioDraftStatus": {
   "Open": "可以編輯",
   "PendingApproval": "等緊批核",
   "Applied": "已套用",
   "Discarded": "已捨棄"
  },
  "studioDraftOperation": {
   "Upsert": "建立或者更新",
   "Delete": "刪除"
  },
  "studioDiffChange": {
   "Create": "建立",
   "Update": "更新",
   "Delete": "刪除",
   "Unchanged": "冇變",
   "Failed": "失敗"
  }
 },
 "errorCodes": {
  "DraftVersionConflict": "你讀完之後草稿已經改咗。請再讀一次然後重試。",
  "DraftNotOpen": "呢份草稿唔係可以編輯嘅狀態，所以改唔到。只有可以編輯嘅草稿先改得。",
  "DraftStale": "草稿所根據嘅即時配置已經改咗。請重訂過時嘅項目，然後再申請套用。",
  "DraftInvalid": "草稿入面有啲文件驗證唔到。請先修正標示咗「失敗」嘅項目。",
  "DraftEmpty": "草稿入面冇任何項目，所以冇嘢可以套用。",
  "ApproverLacksPermission": "你唔可以允許呢份草稿：要允許佢，需要 Manifest 嘅建立權限，同埋草稿刪除嘅每個種類嘅刪除權限。",
  "AgentNotLive": "呢個代理程式係呢份草稿新加嘅。喺試驗場試佢之前，請先套用草稿。",
  "NotAnArchitectDeployment": "只有架構師部署先可以用架構師提示，即係 agent-architect 嘅部署，或者有草稿存取權嘅部署。",
  "InvalidArchitectPrompt": "呢個提示唔可以做架構師提示。請揀呢個租用戶嘅 System 範本。",
  "PromptTemplateInUse": "呢個提示範本有部署綁定緊。請先將佢哋轉去用第個範本。",
  "ReservedEnvironment": "草稿（draft）環境係留畀試驗場用嘅。",
  "NoDeploymentInEnvironment": "呢個代理程式喺嗰個環境冇部署。"
 },
 "views": {
  "studio": {
   "title": "工作室",
   "subtitle": "喺草稿度設計代理程式同應用程式。未有人批核套用草稿之前，即時配置乜都唔會變。",
   "newDraft": "新草稿",
   "refresh": "重新整理",
   "search": "搜尋標題",
   "scopeLabel": "邊個嘅草稿",
   "scopes": {
    "mine": "我嘅",
    "all": "全部"
   },
   "statusLabel": "狀態",
   "columns": {
    "title": "標題",
    "status": "狀態",
    "owner": "擁有者",
    "targetApp": "目標應用程式",
    "items": "項目",
    "version": "版本",
    "updated": "更新時間"
   },
   "open": "打開",
   "discard": "捨棄",
   "discardTitle": "捨棄草稿",
   "discardMessage": "要捨棄 {{title}} 嗎？捨棄咗嘅草稿就唔可以再改或者套用。",
   "discardPendingMessage": "要捨棄 {{title}} 嗎？佢嘅套用批核會取消，草稿亦都唔可以再改或者套用。",
   "discarded": "已捨棄 {{title}}。",
   "emptyTitle": "冇草稿",
   "emptyBody": "由空白或者現有應用程式開始一份草稿，再同代理程式架構師一齊設計。",
   "emptyFiltered": "冇草稿符合呢啲篩選條件。",
   "untitled": "未命名草稿"
  },
  "studioDraft": {
   "title": "工作室草稿",
   "notFoundTitle": "搵唔到草稿",
   "notFoundBody": "呢份草稿唔存在，或者你冇權讀佢。",
   "back": "所有草稿",
   "version": "版本 {{version}}",
   "live": "即時",
   "polling": "輪詢緊",
   "architect": "架構師",
   "tabsLabel": "草稿工作區",
   "tabs": {
    "architect": "架構師",
    "items": "項目",
    "graph": "關係圖",
    "apply": "差異同套用",
    "playground": "試驗場",
    "preview": "編譯預覽",
    "prompts": "架構師提示"
   },
   "notOpen": {
    "PendingApproval": "呢份草稿等緊決定係咪套用，所以改唔到。拒絕批核或者捨棄草稿之後就可以再改。",
    "Applied": "呢份草稿已經套用咗去即時配置，唔可以再改。如果要再改，請開一份新草稿。",
    "Discarded": "呢份草稿已經捨棄咗，唔可以再改。",
    "other": "呢份草稿而家改唔到。"
   },
   "liveNotice": "草稿已經去到版本 {{version}}（{{status}}）。",
   "liveChanged": "改咗：{{items}}。",
   "removedTag": "已移除",
   "dismissNotice": "關閉"
  }
 },
 "components": {
  "studio": {
   "newDraft": {
    "title": "新草稿",
    "intro": "草稿裝住你同代理程式架構師編輯嘅清單文件。可以由空白開始，或者由現有應用程式連同佢參照嘅所有嘢開始。",
    "titleField": "標題",
    "titlePlaceholder": "有撰稿員嘅研究應用程式",
    "fromApp": "由應用程式開始",
    "emptyDraft": "空白草稿",
    "fromAppHint": "應用程式、佢嘅成員、成員嘅部署、提示同資產都會變成項目。每個項目都會記住佢由邊個即時版本開始，等工作室察覺到之後嘅改動。",
    "create": "建立草稿",
    "creating": "建立緊...",
    "created": "已開始草稿 {{title}}。"
   },
   "architect": {
    "title": "新架構師",
    "intro": "代理程式架構師喺你嘅草稿度設計代理程式同應用程式。畀佢一個部署：Harness 設定檔、模型，同埋佢用嘅提示。佢只會改你嘅草稿，永遠唔會套用。",
    "name": "部署名稱",
    "harnessProfile": "Harness 設定檔",
    "chooseProfile": "揀 Harness 設定檔",
    "model": "模型",
    "modelHint": "留空就會用 Harness 設定檔嘅預設模型。",
    "prompt": "架構師提示",
    "defaultPrompt": "{{name}}（預設）",
    "preview": "提示預覽",
    "previewEmpty": "揀一個提示就睇到轉譯結果。",
    "cloneLink": "複製呢個提示再改",
    "noAgent": "呢個租用戶冇叫 {{name}} 嘅代理程式，所以建立唔到架構師。請問管理員。",
    "create": "建立架構師",
    "creating": "建立緊...",
    "created": "已建立架構師 {{name}}。"
   },
   "chat": {
    "title": "架構師",
    "architect": "架構師部署",
    "chooseArchitect": "揀架構師",
    "newArchitect": "新架構師",
    "noArchitect": "暫時未有架構師部署。建立一個，就可以同代理程式架構師一齊設計。",
    "openConversation": "打開對話",
    "newConversation": "新對話",
    "you": "你",
    "architectSays": "架構師",
    "openRun": "執行",
    "thinking": "處理緊...",
    "empty": "話畀架構師知要整乜。第一條訊息會話畀佢知喺邊份草稿度做嘢。",
    "pickFirst": "揀或者建立一個架構師嚟開始。",
    "message": "訊息",
    "placeholder": "設計一個研究應用程式：由一個規劃員將工作分畀兩個研究員同一個撰稿員。",
    "firstHint": "就呢份草稿同呢個架構師開始對話。",
    "continueHint": "繼續對話。撳 Ctrl+Enter 或者 Cmd+Enter 傳送。",
    "send": "傳送"
   },
   "items": {
    "title": "項目",
    "titleCount": "項目（{{total}}）",
    "add": "加項目",
    "addConfirm": "打開編輯器",
    "columns": {
     "kind": "種類",
     "name": "名稱",
     "operation": "操作",
     "stale": "過時",
     "updated": "更新時間"
    },
    "stale": "過時",
    "empty": "暫時未有項目。加一個，或者叫架構師幫手。",
    "remove": "移除",
    "removeTitle": "移除項目",
    "removeMessage": "要由草稿移除 {{item}} 嗎？即時配置唔會變。",
    "removed": "已移除 {{item}}。",
    "saved": "已儲存 {{item}}。草稿而家係版本 {{version}}。",
    "editorTitle": "編輯 {{item}}",
    "newEditorTitle": "新項目 {{item}}",
    "document": "清單文件",
    "versionHint": "儲存嗰陣會傳送你讀到嘅版本 {{version}}。如果草稿之後改咗，儲存會被拒絕，你嘅文字會留喺度。",
    "unsaved": "未儲存嘅改動",
    "errors": {
     "name": "用字母、數字、點、斜線同連字號，而且要以字母或者數字開頭。",
     "exists": "草稿已經有 {{kind}}/{{name}}。",
     "deleteKind": "只有 Agent、Deployment、Pipeline 同 AgenticApp 項目先可以刪除，{{kind}} 唔得。"
    },
    "conflict": {
     "title": "你編輯緊嗰陣草稿改咗：版本 {{from}} 而家係 {{to}}。",
     "added": "加咗：{{items}}",
     "updated": "改咗：{{items}}",
     "removed": "移除咗：{{items}}",
     "status": "佢而家嘅狀態係 {{status}}。",
     "layout": "淨係關係圖版面改咗。",
     "mine": "你編輯緊嘅項目都改咗。再儲存之前，請將你嘅文字同新版本比較吓。",
     "retry": "你嘅文字仲喺編輯器度。再儲存一次就會套用落新版本。",
     "dismiss": "關閉"
    }
   },
   "graph": {
    "title": "關係圖",
    "empty": "草稿暫時未有應用程式或者代理程式可以畫。",
    "depth": "深度 {{depth}}",
    "entryAgent": "入口代理程式：{{name}}",
    "deleted": "會刪除",
    "inDraft": "喺草稿入面",
    "loose": "唔屬於任何應用程式嘅代理程式",
    "capabilities": "能力：{{list}}",
    "legend": "每個呼叫都標示咗佢需要嘅委派深度。實線即係可以平行呼叫，虛線即係一次只可以呼叫一個。能力會喺代理程式名下面顯示。"
   },
   "diff": {
    "title": "差異同套用",
    "refresh": "重新整理差異",
    "validate": "驗證",
    "validating": "驗證緊...",
    "requestApply": "申請套用",
    "requesting": "申請緊...",
    "requested": "已申請套用。會由有權套用清單嘅人決定。",
    "valid": "有效：{{create}} 個要建立，{{update}} 個要更新，{{delete}} 個要刪除，{{unchanged}} 個冇變。",
    "invalid": "無效：{{failed}} 個失敗，{{stale}} 個過時。計劃：{{create}} 個要建立，{{update}} 個要更新，{{delete}} 個要刪除，{{unchanged}} 個冇變。",
    "validOk": "草稿有效。",
    "validFailed": "草稿無效。請睇吓標示咗「失敗」或者「過時」嘅項目。",
    "empty": "草稿冇項目可以比較。",
    "columns": {
     "item": "項目",
     "change": "改動",
     "details": "詳情"
    },
    "none": "（冇）",
    "approval": "套用批核",
    "allow": "允許",
    "deny": "拒絕",
    "allowed": "已允許。草稿套用緊。",
    "denied": "已拒絕。草稿又可以編輯喇。",
    "reason": "原因",
    "reasonPlaceholder": "可以唔填，會同決定一齊保存",
    "waiting": "等緊有權決定批核同套用清單嘅人。",
    "applied": "已經以清單套用 {{id}} 套用咗。"
   },
   "playground": {
    "title": "試驗場",
    "intro": "每一輪都會將草稿入面呢個代理程式嘅文件儲存做佢嘅草稿修訂版本，再喺臨時嘅試驗場部署度執行。乜都唔會發佈，即時配置亦都唔會變。",
    "agent": "代理程式",
    "defaultAgent": "入口代理程式（{{name}}）",
    "defaultAgentShort": "入口代理程式",
    "input": "輸入",
    "answer": "回答",
    "placeholder": "想代理程式做啲乜？",
    "firstHint": "開始一段試驗場對話。",
    "continueHint": "繼續試驗場對話。",
    "send": "執行呢輪",
    "turn": "第 {{number}} 輪，{{agent}}",
    "openRun": "執行詳情",
    "conversation": "對話",
    "export": "下載對話紀錄",
    "reset": "新對話",
    "empty": "暫時未有任何一輪。",
    "exportDraft": "草稿",
    "exportTurn": "輪次",
    "exportRun": "執行"
   },
   "preview": {
    "title": "編譯預覽",
    "intro": "部署之前睇吓一次執行會點樣開始：命令列、資產放喺邊，同埋檔案空間嘅掛接。機密值會遮咗。",
    "deployment": "部署",
    "chooseDeployment": "揀部署",
    "revision": "代理程式修訂版本",
    "deploymentRevision": "部署自己嘅修訂版本",
    "revisionOption": "修訂版本 {{number}}（{{state}}）",
    "environment": "環境",
    "deploymentEnvironment": "部署所在嘅環境",
    "input": "範例輸入",
    "compiled": "已經用 {{revision}} 編譯 {{deployment}}。",
    "assets": "放置嘅資產（{{total}}）",
    "noAssets": "呢個修訂版本唔會放置任何資產。",
    "columns": {
     "path": "路徑",
     "asset": "資產",
     "kind": "種類",
     "version": "版本",
     "size": "大小"
    },
    "fileSpace": "檔案空間",
    "fileSpaceMount": "掛接喺 {{path}}，而家有 {{files}} 個檔案（最多 {{maxFiles}} 個檔案，每個最大 {{maxBytes}}）。",
    "noFileSpace": "因為呢次執行唔屬於任何對話，所以冇掛接檔案空間。",
    "redacted": "伺服器會遮咗命令列、環境同檔案入面嘅機密值。"
   },
   "prompts": {
    "title": "架構師提示",
    "templatesLink": "喺提示範本度打開",
    "forArchitect": "代理程式架構師可以用嘅提示。請幫 {{architect}} 揀一個。",
    "noArchitect": "代理程式架構師可以用嘅提示。請先喺「架構師」分頁揀一個架構師，再幫佢揀提示。",
    "nextTurn": "新揀嘅提示或者儲存咗嘅改動，會由架構師下一輪開始生效。",
    "current": "{{architect}} 用緊 {{name}}，跟住佢而家嘅版本（{{version}}）。",
    "currentPinned": "{{architect}} 用緊 {{name}}，固定喺版本 {{version}}。",
    "inUse": "{{name}} 有部署用緊，所以刪除唔到：{{deployments}}。請先幫佢哋揀第個提示。",
    "empty": "冇架構師提示。",
    "columns": {
     "name": "名稱",
     "description": "描述",
     "version": "版本",
     "usedBy": "邊個用緊"
    },
    "default": "預設",
    "selectedBadge": "已揀",
    "usedBy": "架構師：{{total}}",
    "select": "揀",
    "selected": "{{architect}} 由下一輪開始會用 {{name}}。",
    "saved": "已將 {{name}} 儲存做新版本。",
    "editorTitle": "編輯 {{name}}（版本 {{version}}）",
    "name": "名稱",
    "description": "描述",
    "body": "提示內文",
    "preview": "轉譯預覽",
    "deleteMessage": "要刪除 {{name}} 嗎？用緊佢嘅架構師部署：{{total}}。用緊嘅提示刪除唔到。"
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
})(yueHant, {
 "components": {
  "studio": {
   "canvas": {
    "title": "畫布",
    "appPicker": "應用程式",
    "flowLabel": "應用程式 {{app}} 嘅畫布",
    "noApp": "草稿入面仲未有應用程式。叫架構師整一個，或者由現有應用程式開一份草稿。",
    "calls": "呼叫（{{total}}）",
    "noCalls": "仲未有呼叫。由代理程式嘅右邊邊緣拖去另一個代理程式，或者喺一個代理程式度撳 C，再喺另一個度撳 Enter。",
    "addLoose": "加入應用程式",
    "remove": "由應用程式移除",
    "removeTitle": "由應用程式移除代理程式",
    "removeMessage": "要由 {{app}} 移除 {{name}} 嗎？佢嘅呼叫都會一齊移除。代理程式本身會保留，套用草稿之前即時配置都唔會變。",
    "operationFailed": "{{operation}}俾人拒絕咗。",
    "operations": {
     "AddMember": "加代理程式",
     "RemoveMember": "移除代理程式",
     "Connect": "連接",
     "Disconnect": "斷開連接",
     "SetEntry": "設定入口代理程式",
     "MoveNode": "移動代理程式"
    },
    "toolbar": {
     "label": "畫布動作",
     "addAgent": "加代理程式",
     "addPlaceholder": "代理程式名稱",
     "role": "角色",
     "rolePlaceholder": "角色（可以唔填）",
     "add": "加入",
     "connect": "由呢度連接",
     "setEntry": "設做入口代理程式",
     "remove": "移除",
     "disconnect": "斷開連接",
     "fit": "配合畫面"
    },
    "connectBar": {
     "message": "由 {{name}} 連接緊。揀佢要呼叫嘅代理程式：撳一下、喺佢度撳 Enter，或者喺呢度揀。",
     "to": "呼叫",
     "fanOut": "平行呼叫",
     "confirm": "連接"
    },
    "keys": {
     "title": "鍵盤快捷鍵",
     "tab": "Tab 會按閱讀次序喺代理程式之間移動，由入口代理程式開始。",
     "select": "Enter 或者 Space 會揀中焦點所在嘅代理程式，並打開佢嘅屬性。",
     "connect": "喺代理程式度撳 C 就由佢開始一個呼叫；喺另一個代理程式度撳 C 或者 Enter 就完成。",
     "entry": "E 會將焦點所在嘅代理程式設做入口代理程式。",
     "remove": "Delete 會喺確認之後，將焦點所在嘅代理程式由應用程式移除。",
     "move": "方向鍵會移動揀中嘅代理程式；撳住 Shift 就移得遠啲。停一陣之後會儲存位置。",
     "add": "N 會跳去「加代理程式」欄位。",
     "calls": "喺呼叫清單度，Enter 揀呼叫，Delete 斷開佢，F 開或者關平行呼叫。",
     "escape": "Escape 會取消你開始咗嘅呼叫。"
    },
    "node": {
     "entry": "入口",
     "unreachable": "去唔到",
     "connecting": "由呢度呼叫"
    },
    "a11y": {
     "node": "撳 Enter 或者 Space 揀呢個代理程式，再用方向鍵移動佢。撳 C 連接佢，撳 E 設佢做入口代理程式，或者撳 Delete 移除佢。",
     "edge": "兩個代理程式之間嘅呼叫。請喺畫布下面嘅呼叫清單度揀佢。",
     "handle": "連接點",
     "moved": "將代理程式向{{direction}}移咗。新位置：{{x}}, {{y}}。",
     "directions": {
      "up": "上",
      "down": "下",
      "left": "左",
      "right": "右"
     }
    },
    "announce": {
     "added": "已經將 {{name}} 加入 {{app}}。",
     "connectStart": "由 {{name}} 連接緊。移去佢要呼叫嘅代理程式再撳 Enter，或者撳 Escape 取消。",
     "connectCancelled": "已經取消連接。",
     "connected": "{{from}} 而家會呼叫 {{to}}。",
     "disconnected": "{{from}} 唔再呼叫 {{to}}。",
     "fanOutOn": "{{from}} 而家可以平行呼叫 {{to}}。",
     "fanOutOff": "{{from}} 而家呼叫 {{to}} 每次只會發一個呼叫。",
     "entry": "{{name}} 而家係 {{app}} 嘅入口代理程式。",
     "removed": "已經由 {{app}} 移除 {{name}}。",
     "selfEdge": "代理程式唔可以呼叫自己。請揀另一個代理程式。"
    },
    "summary": {
     "noApp": "冇應用程式可以描述。",
     "agents_one": "應用程式 {{app}} 有 {{count}} 個代理程式。",
     "agents_other": "應用程式 {{app}} 有 {{count}} 個代理程式。",
     "callCount_one": "佢哋之間有 {{count}} 個呼叫。",
     "callCount_other": "佢哋之間有 {{count}} 個呼叫。",
     "entry": "入口代理程式係 {{name}}。",
     "noEntry": "未設定入口代理程式。",
     "callParallel": "{{from}} 呼叫 {{to}}，容許平行呼叫，委派深度 {{depth}}。",
     "callSingle": "{{from}} 呼叫 {{to}}，每次一個呼叫，委派深度 {{depth}}。"
    },
    "conflict": {
     "mine": "{{item}} 都改咗。你嘅編輯仲喺面板度；再儲存之前，請同新版本比較吓。",
     "kept": "你對 {{item}} 嘅編輯仲喺面板度。再儲存一次就會套用落新版本。",
     "operation": "{{operation}}冇套用到。請喺新版本再試一次，或者唔理佢。",
     "retry": "再試一次"
    },
    "panel": {
     "label": "屬性",
     "tabsLabel": "{{name}} 嘅屬性",
     "properties": "代理程式",
     "runtime": "執行階段",
     "save": "儲存落草稿",
     "reset": "復原改動",
     "saved": "已儲存 {{item}}。「差異同套用」會顯示呢個改動。",
     "check": "伺服器對呢個項目嘅檢查結果：{{message}}",
     "unparsable": "呢個項目嘅 YAML 解析唔到，所以面板改唔到佢。請先喺「項目」分頁修正。（{{message}}）"
    },
    "agent": {
     "title": "代理程式 {{name}}",
     "isEntry": "呢個係應用程式嘅入口代理程式：佢負責同用緊應用程式嘅人傾偈。",
     "notHeld": "草稿入面仲未有 {{name}} 嘅文件。帶佢入草稿就可以喺度編輯；即時配置唔會變。",
     "deleted": "草稿會刪除 {{name}}。請先喺「項目」分頁將佢放返入去，先可以編輯。",
     "bring": "帶入草稿",
     "description": "描述",
     "inputSchema": "輸入結構",
     "outputSchema": "輸出結構",
     "schemaHint": "用 JSON 寫嘅 JSON Schema。純文字就留空。",
     "assets": "資產",
     "noAssets": "下一個修訂唔會釘選任何資產。",
     "assetsKept": "文件冇列出任何資產，所以代理程式會保留佢而家有嘅資產。",
     "assetName": "資產名稱",
     "assetVersion": "版本",
     "latest": "最新",
     "removeAsset": "移除資產 {{name}}",
     "addAsset": "加資產",
     "capabilities": "能力",
     "capabilitiesHint": "用逗號分隔名稱。清單留空就會清除晒。",
     "capabilitiesKept": "用逗號分隔名稱。留空嘅話，代理程式會保留佢而家有嘅能力。",
     "systemPrompt": "系統提示",
     "noDeployments": "草稿入面冇呢個代理程式嘅部署，所以呢度冇設定系統提示。",
     "promptLine": "{{environment}}：{{deployment}} 用緊 {{prompt}}",
     "builtInPrompt": "內置預設",
     "showRuntime": "喺「執行階段」分頁編輯",
     "errors": {
      "json": "呢個唔係有效嘅 JSON。",
      "object": "結構一定要係 JSON 物件，例如 {\"type\": \"object\"}。",
      "version": "請用整數，或者留空就用最新版本。"
     }
    },
    "edge": {
     "title": "由 {{from}} 去 {{to}} 嘅呼叫",
     "from": "呼叫方",
     "to": "被呼叫方",
     "depth": "委派深度",
     "depthHint": "由關係圖推算出嚟：一加 {{to}} 下面最長嗰條呼叫鏈。佢下面嘅呼叫改咗，呢個值都會跟住變。",
     "fanOut": "平行呼叫（扇出）",
     "fanOutOn": "{{from}} 可以同一時間向 {{to}} 發幾個呼叫。",
     "fanOutOff": "{{from}} 呼叫 {{to}} 每次只會發一個呼叫。"
    },
    "app": {
     "title": "應用程式 {{name}}",
     "hint": "喺畫布度揀一個代理程式或者呼叫就可以編輯。乜都冇揀嘅時候，呢個面板會編輯應用程式。",
     "entry": "入口代理程式",
     "noEntry": "冇入口代理程式",
     "noMembers": "請先加一個代理程式；第一個會成為入口代理程式。",
     "notHeld": "草稿入面仲未有 {{name}} 嘅文件。帶佢入草稿就可以喺度編輯登入同品牌。",
     "deleted": "草稿會刪除 {{name}}。請先喺「項目」分頁將佢放返入去，先可以編輯。",
     "bring": "帶入草稿",
     "description": "描述",
     "authMode": "登入",
     "authDefault": "伺服器預設",
     "anonymous": "容許匿名使用",
     "branding": "品牌",
     "brandingFields": {
      "displayName": "顯示名稱",
      "logo": "標誌資產",
      "primaryColor": "主色",
      "accentColor": "強調色",
      "welcomeText": "歡迎文字"
     },
     "errors": {
      "color": "請用十六進制顏色，例如 #1F6FEB。"
     }
    },
    "runtime": {
     "title": "{{name}} 嘅執行階段",
     "none": "草稿入面冇 {{name}} 嘅部署。喺下面帶一個即時部署入嚟，或者叫架構師整一個。",
     "deployment": "環境同部署",
     "option": "{{environment}}：{{name}}",
     "scope": "編輯只會改 {{environment}} 入面嘅 {{name}}（Harness 設定檔 {{profile}}）。其他環境會保留自己嘅值。",
     "fields": {
      "model": "模型",
      "effort": "投入程度",
      "timeoutSeconds": "時間限制（秒）",
      "maxTurns": "最多回合",
      "maxBudgetUsd": "預算（USD）",
      "systemTemplate": "系統提示範本",
      "systemVersion": "釘選嘅版本",
      "approvalsEnabled": "工具呼叫要先批核",
      "approvalDefaultAction": "冇規則符合嘅時候"
     },
     "hints": {
      "timeoutSeconds": "整數秒，1 或以上。留空就用 Harness 設定檔嘅限制。",
      "maxTurns": "整數，1 或以上。留空就由 Harness 決定。",
      "maxBudgetUsd": "0 或以上，例如 2.50。留空即係冇預算限制。"
     },
     "builtIn": "內置預設",
     "approvals": "批核",
     "noRules": "冇規則。每個工具呼叫都會用預設動作。",
     "rule": {
      "action": "動作",
      "pattern": "工具模式",
      "inputPattern": "輸入模式",
      "inputPlaceholder": "輸入模式（可以唔填）",
      "remove": "移除規則 {{number}}",
      "add": "加規則"
     },
     "live": "唔喺草稿入面嘅即時部署",
     "noLive": "呢個代理程式嘅每個即時部署都已經喺草稿入面，或者佢冇即時部署。",
     "bring": "帶入草稿",
     "exportMissing": "{{name}} 嘅匯出結果冇包含佢嘅文件。",
     "errors": {
      "integer": "請用 1 或以上嘅整數。",
      "number": "請用 0 或以上嘅數字。",
      "pattern": "規則一定要有工具模式。",
      "version": "請用整數，同埋寫低要釘選嘅範本。"
     }
    }
   }
  }
 },
 "common": {
  "fieldCodes": {
   "NotAMember": "嗰個代理程式唔係呢個應用程式嘅成員。",
   "SelfEdge": "代理程式唔可以呼叫自己。",
   "NoSuchEdge": "應用程式入面冇呢個呼叫。",
   "AppDeleted": "草稿會刪除呢個應用程式。請先將佢放返入去。",
   "InvalidDocument": "呢份文件解析唔到做單一份清單文件。",
   "DocumentMismatch": "文件嘅種類或者名稱同項目唔一致。"
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
})(yueHant, {
 "common": {
  "productName": "Garrison Agent Studio",
  "productLine": "Agent Studio",
  "states": {
   "studioHint": "又或者打開代理程式工作室，講低你要乜：代理程式架構師會起草，再俾你睇過。",
   "openStudio": "打開代理程式工作室"
  }
 },
 "nav": {
  "items": {
   "studio": {
    "label": "代理程式工作室"
   },
   "serverInfo": {
    "label": "關於",
    "tip": "產品、版本、連結、端點同你嘅身份"
   }
  }
 },
 "wizard": {
  "steps": {
   "studio": "代理程式工作室"
  },
  "welcomeItemStudio": "俾代理程式架構師指定 Harness 同模型，等佢喺代理程式工作室同你一齊設計代理程式同應用程式（可選）。",
  "studioBody": "代理程式架構師會喺代理程式工作室同你一齊設計代理程式同應用程式。揀佢運行用嘅 Harness 設定檔同模型，同埋引導佢嘅架構師提示。佢嘅部署只可以改你嘅工作室草稿。你可以略過呢一步，之後再喺工作室建立架構師。",
  "createArchitect": "建立架構師",
  "architectCreated": "已經建立代理程式架構師 {{name}}。",
  "architectReady": "代理程式架構師 {{name}} 準備好喇。設定完之後，打開代理程式工作室，用佢開始一份草稿。",
  "continue": "繼續"
 },
 "views": {
  "home": {
   "getStartedBody": "設定精靈會加認證、俾代理程式架構師指定 Harness 同模型、套用範例代理程式同埋行一次測試。又或者打開代理程式工作室，講低你想要嘅應用程式。",
   "openStudio": "打開代理程式工作室"
  },
  "studio": {
   "title": "代理程式工作室"
  },
  "studioDraft": {
   "tabs": {
    "release": "發佈"
   }
  },
  "serverInfo": {
   "title": "關於",
   "subtitle": "版本、連結、端點，同你而家登入用緊嘅身份。",
   "positioning": "用你已經用緊嘅代理程式 Harness 建立、部署同運行代理式應用程式。",
   "versions": "伺服器版本 {{server}}，控制台版本 {{dashboard}}",
   "docs": "文件",
   "studioDocs": "代理程式工作室指南",
   "website": "網站",
   "source": "原始碼"
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
    "title": "環境同推進",
    "intro": "每個成員喺各個環境嘅部署，同每個部署固定咗嘅修訂同環境覆寫。推進之前可以比較兩個環境，亦可以喺紀錄度還原某次推進。",
    "live": "喺 {{environment}} 上線",
    "environments": "環境",
    "source": "比較",
    "target": "同",
    "member": "成員",
    "entry": "入口",
    "noDeployment": "冇部署",
    "secretOverride": "{{name}}（機密）",
    "difference": "{{source}} 去 {{target}}",
    "differenceNone": "分別",
    "diff": {
     "Same": "一樣",
     "Missing": "{{target}} 冇部署",
     "revisions": "修訂唔同",
     "overrides": "覆寫唔同",
     "both": "修訂同覆寫都唔同"
    },
    "promote": "由 {{source}} 推進去 {{target}}",
    "promoteNothing": "推進",
    "missing": "{{target}} 冇部署：{{names}}。而家推進會失敗，乜都唔會郁；請先喺嗰度加部署。",
    "history": "推進紀錄",
    "historyEmpty": "呢個應用程式未推進過。"
   }
  },
  "studio": {
   "release": {
    "title": "發佈",
    "app": "應用程式",
    "noAppsTitle": "呢份草稿冇建立任何應用程式",
    "noAppsBody": "喺關係圖分頁或者叫架構師喺草稿加一個應用程式，套用草稿之後就可以喺度推進。",
    "notLiveTitle": "{{name}} 仲未上線",
    "notLiveBody": "請先套用草稿。套用之後會發佈佢嘅代理程式同部署去 dev；之後就可以喺度推進個應用程式。"
   }
  }
 }
});
