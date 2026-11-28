// Traditional Chinese catalog for the Garrison dashboard. Mirrors every key in en.js.

import { tips, explainers } from './zh-Hant.tips.js';

const rp = (title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody) => ({ title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody });

const zhHant = {
  processSecurity: { trustedOnly: "Process 執行器僅適用於可信任的任務。執行共用工作節點的使用者、檔案系統和網路，可存取其他執行及工作節點憑證。對於不可信任的輸入，請使用 KubernetesJob。" },
  common: {
    eventCodes: { ApprovalRequested: '已要求核准', ApprovalDecided: '已決定核准', StructuredOutputInvalid: '結構化輸出無效', RunBlocked: '執行受阻', EventsDropped: '事件已捨棄', HarnessExited: 'Harness 已結束', McpPreflightWarning: 'MCP 預檢警告', McpPreflightPassed: 'MCP 預檢通過', RepairAttemptStarted: '已開始修復輸出', WorkspacePrepared: '工作區已就緒', RunGuardTriggered: '執行防護停止了執行', ConversationFallback: '對話回退', ConversationResumed: '對話已恢復', ConversationStateLost: '對話狀態遺失' },
    fieldCodes: { ExpiryInPast: '請選擇未來的時間。', ParameterInvalid: '此值對這個參數無效。', ParameterNotAllowed: '此部署不允許呼叫端覆寫此參數。', SettingsFileReadOnly: '設定檔為唯讀，因此無法儲存此變更。', OverriddenByEnvironment: '此值由環境變數設定，因此無法在這裡變更。', PathRequired: '需要設定路徑。', UnknownSetting: '此伺服器沒有這項設定。', TooLong: '此值太長。', NotAllowedValue: '請選擇允許的值之一。', NotABoolean: '請選擇 true 或 false。', NotAnInteger: '請輸入整數。', OutOfRange: '值超出允許的範圍。' },
    serverText: {
      approvalWaitingExpires: '正在等候人員核准 {{subject}}；核准 {{id}} 將於 {{expires}} 到期。',
      approvalWaiting: '正在等候人員核准 {{subject}}；核准 {{id}}。',
      notApplied: '未套用，因為另一份文件未通過驗證。',
      wouldBeUnchanged: '已是最新狀態，不會有任何變更。',
      wouldBeUpdated: '將會更新。',
      wouldBeCreated: '將會建立。',
      inUse: '{{what}} 仍由這些部署繫結：{{deployments}}。請先移除繫結。',
      noActiveDeployment: '代理程式 {{agent}} 沒有權重大於零的啟用部署。請新增部署或提高某個部署的權重，然後再試一次。',
      toolCallDenied: '工具呼叫遭拒：{{id}}',
      threadStarted: '執行緒已開始。',
      runStartedModel: '執行已開始（{{model}}）。',
      runStarted: '執行已開始。',
      sessionInitializedModel: '工作階段已初始化（{{model}}）。',
      sessionInitialized: '工作階段已初始化。',
      harnessFailed: 'Harness 回報了失敗。',
      exitedNoResult: 'Harness 以代碼 {{code}} 結束，沒有最終結果。',
      harnessExited: 'Harness 已結束：{{status}}（{{outcome}}）。',
      harnessExitedCode: 'Harness 已結束，代碼 {{code}}：{{status}}（{{outcome}}）。',
      mcpPreflight: 'MCP 預檢已通過。已檢查的伺服器：{{count}}。',
      repairAttempt: '結構化輸出修復第 {{attempt}} 次嘗試：在 {{path}} 繼續 Harness 工作階段。',
      workspacePrepared: '工作區已在 {{path}} 準備完成。',
      guardRepetitionUnit: '重複防護：助理文字的最後 {{window}} 個字元是 {{size}} 個字元的單元「{{unit}}」重複了 {{count}} 次。',
      guardDegenerate: '重複防護：助理文字的最後 {{window}} 個字元不含字母或數字（只有空白、標點或符號），結尾為「{{tail}}」。',
      guardNoProgress: '執行在 {{seconds}} 秒內沒有進展（沒有助理文字、思考、工具呼叫或工具結果，也沒有未完成的工具呼叫）；其 noProgressSeconds 限制為 {{limit}}。',
      guardOutputLimit: '助理文字超過了執行的 maxAssistantChars 上限 {{limit}} 個字元。',
      valueClamped: '{{field}} 的值 {{given}} 超出允許範圍 {{minimum}} 至 {{maximum}}，已儲存 {{stored}}。'
    },
    appName: 'Garrison',
    language: { label: '語言' },
    theme: { switchToLight: '切換為淺色主題', switchToDark: '切換為深色主題' },
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
      hide: '隱藏值',
      logout: '登出',
      next: '下一步',
      openGithub: '在 GitHub 上開啟 Garrison 儲存庫',
      remove: '移除',
      retry: '重試',
      reveal: '顯示值',
      save: '儲存',
      view: '檢視',
      viewDetails: '檢視詳細資料',
      viewJson: '檢視 JSON'
    },
    boolean: { yes: '是', no: '否' },
    confirm: {
      deleteNamed: '要刪除「{{name}}」嗎？此操作無法復原。',
      bulkDelete: '要刪除選取的 {{count}} 筆紀錄嗎？此操作無法復原。'
    },
    errors: {
      listItem: '第 {{index}} 項：{{message}}',
      chooseOne: '請至少選擇一個選項。',
      fixFields: '部分欄位需要處理，請檢查標示的值。',
      invalidEmail: '請輸入有效的電子郵件地址。',
      invalidJson: '這不是有效的 JSON。',
      loadFailed: '無法載入資料。',
      requestId: '請求 {{id}}。',
      required: '此欄位為必填。',
      requiredPermission: '需要 {{resource}} 的 {{permission}} 權限。'
    },
    generic: {
      deletedName: '{{name}}（已刪除）',
      actions: '操作',
      active: '啟用',
      all: '全部',
      any: '任何',
      builtIn: '內建',
      custom: '自訂',
      inactive: '停用',
      loading: '載入中...',
      never: '從不',
      none: '無',
      notAvailable: '不適用',
      saving: '儲存中...'
    },
    relativeTime: { now: '剛剛' },
    states: {
      forbiddenTitle: '你沒有存取此頁面的權限',
      forbiddenBody: '請向管理員申請具有存取權限的角色，或選擇其他頁面。',
      unavailableTitle: '此伺服器尚未提供此功能',
      unavailableBody: '伺服器未公開 {{resource}} 端點。請升級伺服器，或在 API 探索器中查看其支援的功能。'
    },
    toasts: {
      bulkDeleted: '已刪除 {{count}} 筆紀錄（{{failed}} 筆失敗）。',
      cloned: '已複製。',
      created: '已建立。',
      deleted: '已刪除。',
      saved: '已儲存。'
    },
    units: { msShort: '毫秒', sShort: '秒', mShort: '分鐘', tokPerSec: 'Token/秒' }
  },
  errorCodes: {
    ApprovalNotPending: '此核准已經決定，因此無法再次決定。',
    MessageIdConflict: '此 A2A 訊息 ID 已用於不同的內容。請使用新的 ID 傳送訊息。',
    IdempotencyKeyConflict: '此冪等金鑰已用於另一個要求。請使用新的金鑰。',
    DeploymentDeleted: '此執行的部署已刪除，因此無法重試此執行。請改為再次呼叫代理程式。',
    AgentDeleted: '此執行的代理程式已刪除，因此無法重試此執行。',
    NoActiveDeployment: '此代理程式沒有權重大於零的啟用部署。請新增部署或提高某個部署的權重。',
    TenantNotFound: '該租用戶不存在。請檢查租用戶 ID。',
    NetworkError: '無法連線到伺服器。請檢查伺服器 URL，並確認伺服器正在執行。',
    AuthenticationRequired: '你的工作階段已過期，請重新登入。',
    InvalidCredentials: '租用戶、電子郵件、密碼或金鑰不正確。',
    RateLimited: '登入嘗試次數過多，請等待一分鐘後再試。',
    AuthorizationDenied: '你沒有執行此操作的權限。',
    NotFound: '找不到該紀錄。',
    RouteNotFound: '此伺服器不支援該端點。',
    ValidationFailed: '部分值無效。',
    InvalidBody: '請求內容無效。',
    InvalidJson: '請求內容不是有效的 JSON。',
    Conflict: '這與現有紀錄衝突。',
    BuiltInImmutable: '內建紀錄無法變更，請複製後再自訂。',
    Protected: '此紀錄受到保護，無法刪除。',
    StaleLease: '該節點已不再持有此執行的租約。',
    InternalError: '伺服器發生內部錯誤。請使用請求 ID 檢查伺服器記錄檔。',
    Http400: '請求因無效而遭拒絕。',
    Http403: '你沒有執行此操作的權限。',
    Http404: '找不到。',
    Http409: '與目前狀態衝突。',
    Http500: '伺服器發生內部錯誤。',
    Http503: '伺服器無法使用。',
    ConversationBusy: '此對話仍在處理上一輪。請等待該執行結束或將其取消，然後再試一次。',
    ConversationAgentMismatch: '此對話屬於另一個代理程式。請將這一輪傳送給該代理程式，或開始新的對話。',
    ConversationDeploymentMismatch: '對話的每一輪都在第一輪的部署上執行。請將部署留空，或開始新的對話。',
    ConversationDeploymentUnavailable: '此對話所用的部署已被刪除，因此對話無法繼續。請開始新的對話。'
  },
  enums: {
    approvalStatus: {
      Pending: '待處理',
      Approved: '已核准',
      Denied: '已拒絕',
      Expired: '已過期',
      Cancelled: '已取消'
    },
    approvalDecision: {
      Allow: '允許',
      Deny: '拒絕'
    },
    approvalSource: {
      DurableResume: "繼承的核准",
      Rule: '規則',
      Default: '部署預設值',
      User: '人員',
      Timeout: '逾時',
      Cancelled: '執行已停止'
    },
    approvalRuleAction: {
      Allow: '允許',
      Deny: '拒絕',
      Ask: '詢問人員'
    },
    approvalKind: {
      Tool: '工具呼叫',
      Command: '命令',
      FileChange: '檔案變更'
    },
    principalType: { Administrator: '系統管理員', User: '使用者', Credential: '存取金鑰', Run: '執行權杖' },
    runBlockedReason: { NoReadyWorker: '沒有就緒的工作節點', NoCapableWorker: '沒有可執行的工作節點', NoMatchingPool: '沒有相符的節點池' },
    promptDelivery: { Stdin: '標準輸入', Argument: '命令列引數', File: '檔案', CodexAppServer: 'Codex 應用程式伺服器 (JSON-RPC)' },
    systemPromptDelivery: { File: '檔案', Argument: '命令列引數', Environment: '環境變數', PrependToPrompt: '加在提示前面', None: '不傳遞' },
    mcpConfigFormat: { None: '無 MCP 設定', ClaudeJson: 'Claude Code JSON', CodexToml: 'Codex TOML', MuxJson: 'Mux JSON', GeminiSettings: 'Gemini CLI 設定' },
    outputParser: {
      ClaudeStreamJson: 'Claude Code 串流 JSON',
      CodexJsonl: 'Codex JSONL',
      CodexAppServer: 'Codex 應用程式伺服器 JSON-RPC',
      MuxJsonl: 'Mux JSONL',
      GeminiStreamJson: 'Gemini CLI 串流 JSON',
      GenericJsonl: '通用 JSONL',
      PlainText: '純文字'
    },
    resultSource: { ParserFinalEvent: '剖析器最終事件', LastMessageFile: '最後訊息檔案', Stdout: 'Stdout' },
    successPolicy: { FinalEvent: '最終事件', ExitCode: '結束代碼', FinalEventAndExitCode: '最終事件與結束代碼' },
    fileBaseDirectory: { Config: '設定目錄', Workspace: '工作區', Home: '主目錄' },
    artifactStoreKind: { Database: '資料庫', Filesystem: '檔案系統', S3: 'S3' },
    agentInputMode: { Text: '文字', Structured: '結構化 JSON' },
    argumentOverrideOperation: { Append: '附加到結尾', Prepend: '插入到開頭', Remove: '移除', Replace: '取代' },
    runOverrideValidation: { Any: '任何值', Enum: '清單中的值', Regex: '規則運算式', IntegerRange: '整數範圍' },
    credentialAuthMode: { DirectHeader: '直接標頭', SignedRequest: '簽署要求', SessionExchange: '換取工作階段權杖', Hybrid: '任何方式' },
    operationType: { All: '所有操作', Create: '建立', Read: '讀取', Write: '寫入', Update: '更新', Delete: '刪除', Execute: '執行', Admin: '管理' },
    usageQuotaScope: {"Tenant": "租用戶", "Agent": "代理程式", "Deployment": "部署"},
    resourceType: {
      All: '所有資源',
      Account: '帳戶',
      Tenant: '租用戶',
      Admin: '系統管理',
      User: '使用者',
      Credential: '存取金鑰',
      Session: '工作階段',
      Role: '角色',
      Permission: '權限',
      Assignment: '指派',
      Audit: '稽核記錄',
      RequestHistory: '要求記錄',
      Settings: '設定',
      HarnessProfile: 'Harness 設定檔',
      PromptTemplate: '提示範本',
      Agent: '代理程式',
      Deployment: '部署',
      McpServer: 'MCP 伺服器',
      Secret: '祕密',
      Workspace: '工作區',
      ArtifactStore: '成品存放區',
      ModelPrice: "模型價格",
      UsageQuota: "使用配額",
      Run: '執行',
      Node: '節點',
      NodePool: '節點池',
      Manifest: '清單',
      Conversation: '對話',
      Approval: '核准',
      Artifact: '成品'
    },
    runStatus: {
      Pending: '待處理',
      Queued: '已排入佇列',
      Leased: '已租用',
      Running: '執行中',
      Cancelling: '取消中',
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
      NodeLost: '節點遺失',
      OutputLimitExceeded: '超出輸出上限',
      SchemaValidationFailed: '輸出結構描述無效',
      TimedOut: '逾時',
      Cancelled: '已取消',
      StaleLease: '租約過期',
      CompileFailed: '編譯失敗',
      WorkspaceFailed: '工作區失敗',
      Rejected: '已拒絕',
      InternalError: '內部錯誤',
      NoCapableWorker: '沒有可執行的工作節點',
      RepetitionDetected: '偵測到重複',
      NoProgress: '沒有進展',
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
    nodeStatus: { Ready: '就緒', Draining: '清空中', Cordoned: '已封鎖', Lost: '遺失', Offline: '離線' },
    controlNodeStatus: { Starting: '啟動中', Ready: '就緒', Draining: '清空中', Offline: '離線' },
    backplane: { Local: '本機（單一副本）', Polling: '資料庫輪詢', PostgresNotify: 'PostgreSQL 通知' },
    harnessType: { ClaudeCode: 'Claude Code', Codex: 'Codex', Mux: 'Mux', GeminiCli: 'Gemini CLI', Generic: '通用' },
    agentKind: { Hosted: '託管', Remote: '遠端' },
    delegationMode: { None: '不委派', AllowList: '允許清單', Any: '任何代理程式' },
    secretStatus: { Ok: '正常', NeedsReauthentication: '需要重新驗證' },
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
    workspaceKind: { Empty: '空白', GitRepository: 'Git 儲存庫', Seeded: '預置檔案', PersistentVolume: '持久性磁碟區' },
    runExecutor: { Process: '處理程序', KubernetesJob: 'Kubernetes Job' },
    workspaceRetention: { Delete: '刪除', Keep: '保留', KeepOnFailure: '失敗時保留' },
    promptTemplateKind: { System: '系統', Task: '任務', Fragment: '片段', ToolDescription: '工具描述', ConfigFile: '設定檔', Other: '其他' },
    permissionType: { Permit: '允許', Deny: '拒絕' },
    resourceScope: { Tenant: '租用戶', Resource: '資源' },
    resourceBindingKind: { McpServer: 'MCP 伺服器', Secret: '祕密' },
    mcpTransport: { Http: 'HTTP', Stdio: 'stdio' },
    remoteProtocol: { A2A: 'A2A', Mcp: 'MCP' },
    manifestApplyResult: { Created: '已建立', Updated: '已更新', Unchanged: '未變更', Failed: '失敗', Validated: '已驗證' },
    auditEventType: {
      ApprovalDecided: '已決定核准',
      AuthSuccess: '登入成功',
      AuthFailure: '登入失敗',
      SessionIssued: '已核發工作階段',
      SessionRevoked: '已撤銷工作階段',
      CredentialCreated: '已建立存取金鑰',
      CredentialRotated: '已輪替存取金鑰',
      CredentialUsed: '已使用存取金鑰',
      AuthorizationDenied: '授權遭拒',
      AuthorizationBypass: '略過授權',
      RoleChanged: '角色已變更',
      PermissionChanged: '權限已變更',
      AssignmentChanged: '指派已變更',
      ConfigurationChanged: '組態已變更',
      SecretChanged: '祕密已變更',
      SettingsChanged: '設定已變更',
      RestartRequested: '已要求重新啟動',
      ManifestApplied: '已套用清單',
      NodeRegistered: '節點已註冊',
      NodeStatusChanged: '節點狀態已變更',
      RunCancelled: '執行已取消',
      ConversationDeleted: '對話已刪除'
    },
    conversationFallbackReason: {
      AffinityNodeLost: '親和節點未就緒',
      AffinityWaitExpired: '親和等待已逾時',
      WorkspaceLost: '工作區已遺失',
      SessionMissing: '沒有可恢復的工作階段',
      HarnessChanged: 'Harness 設定檔已變更',
      ResumeUnsupported: '不支援恢復',
      ExecutorWithoutState: '執行器不保留狀態'
    }
  },
  nav: {
    approvalsPending_one: '{{count}} 個核准等候中',
    approvalsPending_other: '{{count}} 個核准等候中',
    primary: '主要導覽',
    sections: {
      operate: '營運',
      platform: '平台',
      administration: '管理'
    },
    hubs: {
      approvals: {
        label: '核准',
        tip: '等候人員處理的工具呼叫，以及每一項決定'
      },
      home: { label: '首頁', tip: '一覽機群與執行的健康狀態' },
      invoke: { label: '呼叫', tip: '以互動方式試用代理程式' },
      runs: { label: '執行', tip: '執行與排程佇列' },
      analytics: { label: '分析', tip: '執行速度、Token、成本與結果的歷史趨勢' },
      agents: { label: '代理程式', tip: '代理程式及執行它們的部署' },
      configuration: { label: '組態', tip: 'Harness 設定檔、提示範本、MCP 伺服器、祕密、工作區、成品存放區與清單' },
      fleet: { label: '機群', tip: '控制平面、工作節點與節點池' },
      access: { label: '存取', tip: '租用戶、使用者、存取金鑰、角色與指派' },
      monitoring: { label: '監控', tip: '請求歷程、稽核與 API 探索器' },
      system: { label: '系統', tip: '伺服器設定與伺服器資訊' }
    },
    items: {
      approvals: {
        label: '核准',
        tip: '允許或拒絕代理程式要求進行的工具呼叫'
      },
      home: { label: '首頁', tip: '一覽機群與執行的健康狀態' },
      invoke: { label: '呼叫', tip: '以互動方式試用代理程式' },
      runs: { label: '執行', tip: '尋找、檢查、取消與重試執行' },
      queue: { label: '佇列', tip: '依代理程式與 Harness 檢視排程壓力' },
      analytics: { label: '分析', tip: '執行速度、Token、成本與結果的歷史趨勢' },
      nodes: { label: '工作節點', tip: '工作節點及其 Harness 能力' },
      controlNodes: { label: '控制平面', tip: '提供 API 並排程執行的伺服器副本' },
      nodePools: { label: '節點池', tip: '將節點分組並專供特定租用戶使用' },
      agents: { label: '代理程式', tip: '透過 REST、MCP 與 A2A 公開的代理程式' },
      deployments: { label: '部署', tip: '將代理程式繫結到 Harness、提示與資源' },
      harnessProfiles: { label: 'Harness 設定檔', tip: '每個 Harness 如何以無介面模式執行' },
      promptTemplates: { label: '提示範本', tip: 'Garrison 送出的每個提示，皆有版本控管' },
      mcpServers: { label: 'MCP 伺服器', tip: '代理程式可使用的工具' },
      secrets: { label: '祕密', tip: 'Harness 與整合服務的憑證' },
      workspaces: { label: '工作區', tip: '執行工作區的準備方式' },
      artifactStores: { label: '成品存放區', tip: '執行成品的存放位置' },
      modelPrices: { label: "模型價格", tip: "在執行器未報告費用時，使用操作員設定的美元費率進行估算。已報告費用（包括零）優先。" },
      usageQuotas: { label: "使用配額", tip: "租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。" },
      manifests: { label: '清單', tip: '以程式碼形式套用與匯出設定' },
      requests: { label: '請求歷程', tip: '檢查 HTTP 流量與失敗' },
      audit: { label: '稽核', tip: '安全性與設定事件' },
      explorer: { label: 'API 探索器', tip: '執行即時 API 呼叫' },
      tenants: { label: '租用戶', tip: '管理租用戶' },
      users: { label: '使用者', tip: '管理使用者' },
      credentials: { label: '存取金鑰', tip: '供自動化使用的存取金鑰' },
      roles: { label: '角色', tip: '角色與權限' },
      assignments: { label: '指派', tip: '將角色授予使用者與存取金鑰' },
      settings: { label: '設定', tip: '編輯伺服器與叢集設定' },
      serverInfo: { label: '伺服器資訊', tip: '端點、版本與你的身分' },
      conversations: {
        label: '對話',
        tip: '與代理程式的多輪交流'
      }
    },
    setup: '設定精靈',
    setupTip: '設定憑證、套用範例代理程式並進行測試',
    tour: '導覽',
    tourTip: '重新播放導覽',
    version: '版本 {{version}}',
    collapseSidebar: '切換導覽列',
    skipToContent: '跳至內容'
  },
  login: {
    title: 'Garrison',
    subtitle: '登入代理程式控制平面',
    tabs: { password: '電子郵件與密碼', accessKey: '存取金鑰' },
    serverUrl: '伺服器 URL',
    serverInUse: '使用的伺服器：',
    useDifferentServer: '使用其他伺服器',
    useDefaultServer: '使用預設伺服器',
    tenantId: '租用戶 ID',
    email: '電子郵件',
    password: '密碼',
    accessKey: '存取金鑰',
    secretKey: '祕密金鑰',
    submit: '登入',
    connecting: '登入中...',
    restoring: '正在還原你的工作階段...',
    errorGeneric: '無法登入。請檢查你的憑證，並確認伺服器可以連線。',
    footerHint: '預設憑證：租用戶 default 中的 admin@garrison / password。'
  },
  topbar: {
    server: '伺服器',
    tenant: '租用戶',
    switchTenant: '切換租用戶',
    copyServer: '複製伺服器 URL',
    live: '即時',
    polling: '輪詢',
    liveOn: '正透過 WebSocket 接收即時更新',
    liveOff: '無法使用即時更新，頁面將以輪詢方式重新整理',
    health: { healthy: '健康', unhealthy: '無法連線', unknown: '檢查中' }
  },
  roles: {
    systemAdmin: '系統管理員',
    tenantAdmin: '租用戶管理員',
    user: '使用者',
    credential: '存取金鑰',
    run: '執行權杖'
  },
  components: {
    fieldWarnings: { title_one: '已儲存，{{count}} 個值已調整', title_other: '已儲存，{{count}} 個值已調整', body: '伺服器已接受請求，但以下值的儲存結果與送出的值不同。', dismiss: '關閉', codes: { ValueClamped: '值已限制在允許範圍內' } },
    approvals: {
      awaiting: '等候核准',
      decideTitle: '決定 {{tool}}',
      decision: '決定',
      reason: '原因',
      reasonPlaceholder: '選填。代理程式與稽核記錄都會看到。',
      remember: '記住為此部署的規則',
      rulePattern: '規則模式',
      rememberHint: '在部署中新增動作為 {{action}} 的規則，讓符合的呼叫不必詢問即可決定。這也需要更新部署的權限。',
      submitAllow: '允許',
      submitDeny: '拒絕',
      timeoutThen: '然後 {{decision}}',
      toasts: {
        allowed: '已允許 {{tool}}。',
        denied: '已拒絕 {{tool}}。',
        allowedRemembered: '已允許 {{tool}}，並新增規則 {{pattern}}。',
        deniedRemembered: '已拒絕 {{tool}}，並新增規則 {{pattern}}。',
        notPending: '此核准已由其他人或因逾時而決定。清單現在會顯示結果。',
        forbidden: '你可以讀取核准，但不能決定。請向管理員申請 Approval Update 權限。',
        forbiddenRemember: '記住規則也需要更新部署的權限。請不記住規則直接決定，或申請 Deployment Update。'
      }
    },
    approvalCheck: {
      title: '測試工具呼叫',
      saveFirst: '請先儲存部署。測試會檢查伺服器已儲存的規則。',
      hint: '檢查的是已儲存的規則，因此請先儲存變更再測試。不會記錄任何內容。',
      toolName: '工具',
      inputs: {
        command: '命令',
        url: 'URL',
        query: '搜尋查詢',
        file_path: '檔案路徑',
        notebook_path: '筆記本路徑',
        pattern: '模式'
      },
      run: '檢查',
      checking: '檢查中...',
      byRule: '依此規則 {{action}}：',
      byDefault: '依部署預設值 {{action}}，因為沒有符合的規則。',
      suggestedRule: '建議的規則：',
      disabled: '此部署已關閉核准，因此其執行永遠不會詢問。請開啟並儲存，才能套用這些規則。'
    },
    blocked: {
      title: '等待工作節點',
      body: '這個執行已排入佇列，但目前沒有工作節點能接手。',
      reasons: {
        NoReadyWorker: '沒有就緒的工作節點。請啟動或註冊工作節點，並在機群頁面檢查遺失、離線、清空中或已封鎖的節點。',
        NoCapableWorker: '有就緒的工作節點，但沒有節點回報 {{harness}} Harness 可用。請啟動或註冊已安裝該 Harness 的工作節點，或在機群頁面檢查它的憑證與探測結果。',
        NoMatchingPool: '有就緒的工作節點能執行 {{harness}}，但沒有節點符合這個部署的節點池或節點選取器。請檢查部署的排程放置，或在該節點池加入工作節點。'
      },
      failNote: '當叢集設定 Runtime.FailBlockedAfterSeconds 大於 0 時，受阻達到該時長的執行會以結果「沒有可執行的工作節點」失敗。',
      openFleet: '開啟機群',
      openAgent: '開啟代理程式的部署',
      homeBanner_other: '{{count}} 個佇列中的執行無法開始：沒有就緒的工作節點能執行它們。',
      showRuns: '檢視佇列中的執行',
      queueColumn: '受阻',
      queueCount_other: '{{count}} 個受阻'
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
      total: '總計',
      avgDuration: '平均時間',
      noData: '此時間範圍內沒有活動。',
      range: '時間範圍',
      ranges: { hour: '過去一小時', day: '過去一天', week: '過去一週', month: '過去一個月', custom: '自訂' }
    },
    compilePreview: {
      title: '編譯預覽',
      input: '範例輸入',
      compile: '編譯',
      compiling: '編譯中...',
      commandLine: '命令列',
      stdin: '標準輸入',
      environment: '環境變數',
      files_one: '{{count}} 個檔案',
      files_other: '{{count}} 個檔案'
    },
    confirm: { title: '請確認', message: '確定要繼續嗎？' },
    diff: { before: '變更前', after: '變更後' },
    explainer: { about: '關於{{topic}}', dismiss: '隱藏此說明' },
    export: { label: '匯出', csv: 'CSV（資料）', png: 'PNG 圖片', svg: 'SVG 圖片', json: 'JSON（資料）', failed: '匯出失敗。{{message}}', tableTitle: '表格 {{table}}' },
    filters: {
      allTenants: '所有租用戶',
      clear: '清除篩選條件',
      from: '起',
      to: '迄',
      method: '方法',
      path: '路徑包含',
      pathPlaceholder: '例如 /v1.0/api/tenants',
      searchName: '依名稱搜尋',
      status: '狀態碼',
      statusPlaceholder: '例如 404',
      tenant: '租用戶'
    },
    form: {
      addItem: '新增項目',
      addRow: '新增列',
      key: '鍵',
      value: '值',
      moveUp: '上移',
      moveDown: '下移',
      noItems: '尚無項目。',
      onePerLine: '每行一個值',
      steps: '表單步驟'
    },
    mcpTest: {
      title: 'MCP 連線測試',
      testing: '正在連線並列出工具...',
      ok: '已連線',
      failed: '失敗',
      tools_one: '{{count}} 個工具',
      tools_other: '{{count}} 個工具'
    },
    permissions: {
      title: '有效權限',
      none: '沒有任何授權。此主體只能使用略過規則（如有）。',
      source: '角色',
      type: '類型',
      resources: '資源類型',
      operations: '操作',
      scope: '範圍'
    },
    requestDetails: {
      title: '請求詳細資料',
      metadata: '中繼資料',
      requestHeaders: '請求標頭',
      requestBody: '請求內容',
      responseHeaders: '回應標頭',
      responseBody: '回應內容',
      rawJson: '原始 JSON',
      truncated: '已截斷（原始大小 {{bytes}} 位元組）',
      empty: '沒有內容。',
      fields: {
        id: '請求 ID',
        method: '方法',
        path: '路徑',
        url: 'URL',
        status: '狀態',
        duration: '持續時間',
        createdUtc: '建立時間',
        completedUtc: '完成時間',
        sourceIp: '來源 IP',
        principal: '主體',
        tenant: '租用戶',
        user: '使用者'
      }
    },
    secretOnce: {
      title: '請立即複製此祕密',
      warning: '祕密只會顯示這一次。關閉前請將它存放在安全的地方。',
      accessKey: '存取金鑰',
      secretKey: '祕密金鑰',
      done: '我已儲存'
    },
    table: {
      bulkActions: '批次操作',
      bulkDelete: '刪除選取項目',
      clearSelection: '清除選取',
      empty: '沒有可顯示的紀錄。',
      first: '第一頁',
      jump: '跳至頁面',
      last: '最後一頁',
      loading: '正在載入紀錄...',
      next: '下一頁',
      noMatches: '沒有符合目前篩選條件的紀錄。',
      pageOf: '第 {{page}} 頁，共 {{total}} 頁',
      pageSize: '每頁筆數',
      pinned: '一律顯示',
      prev: '上一頁',
      records_one: '筆紀錄',
      records_other: '筆紀錄',
      refresh: '重新整理',
      selectAll: '選取此頁所有列',
      selectColumns: '選擇欄位',
      selected_one: '已選取 {{formattedCount}} 筆',
      selected_other: '已選取 {{formattedCount}} 筆',
      selectRow: '選取列',
      showing: '顯示第 {{from}} 至 {{to}} 筆',
      sortBy: '依{{column}}排序',
      sortPageOnly: '僅排序目前頁面'
    }
  },
  resources: {
    approvals: {
      ...rp('核准', '代理程式要求進行的工具呼叫，由部署規則、部署預設值、人員或逾時決定。待處理的項目會等候你處理。', '新增核准', '建立核准', '編輯核准', '核准詳細資料', '刪除核准', '尚無核准', '已啟用核准的部署在工具呼叫前提出詢問時，核准就會顯示在這裡。'),
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
        kind: '種類',
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
        kind: '種類',
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
        timeoutDecision: '逾時時的決定',
        toolCallId: '工具呼叫 ID',
        reason: '原因',
        summary: '摘要',
        inputPreview: '輸入（已遮蔽）',
        rulePattern: '符合的規則',
        ruleId: '規則 ID',
        suggestedRule: '建議的規則',
        rememberedRuleId: '已記住的規則 ID'
      },
      filters: {
        runId: '執行 ID',
        runIdPlaceholder: '執行 ID（run_...）'
      },
      actions: {
        allow: '允許',
        deny: '拒絕',
        openRun: '開啟執行'
      }
    },
    tenants: {
      ...rp('租用戶', '彼此隔離的工作空間，各自擁有使用者、代理程式、祕密與執行。', '新增租用戶', '建立租用戶', '編輯租用戶', '租用戶詳細資料', '刪除租用戶', '尚無租用戶', '建立租用戶以隔離團隊或客戶。'),
      columns: { name: '名稱', id: 'ID', description: '描述', active: '啟用', createdUtc: '建立時間' },
      fields: { name: '名稱', description: '描述', active: '啟用' }
    },
    users: {
      ...rp('使用者', '以電子郵件與密碼登入此租用戶的人員。', '新增使用者', '建立使用者', '編輯使用者', '使用者詳細資料', '刪除使用者', '尚無使用者', '新增使用者，讓人員可以登入此租用戶。'),
      columns: { email: '電子郵件', name: '名稱', id: 'ID', role: '角色', active: '啟用', createdUtc: '建立時間' },
      fields: { email: '電子郵件', password: '密碼', firstName: '名字', lastName: '姓氏', isTenantAdmin: '租用戶管理員', isAdmin: '系統管理員', active: '啟用' },
      hints: { isAdmin: '系統管理員可以管理所有租用戶，並略過所有授權檢查。', password: '編輯時留空即可保留目前的密碼。' },
      actions: { permissions: '有效權限' }
    },
    credentials: {
      ...rp('存取金鑰', '供自動化、SDK 與整合服務使用的存取金鑰。祕密只會顯示一次。', '新增存取金鑰', '建立存取金鑰', '編輯存取金鑰', '存取金鑰詳細資料', '刪除存取金鑰', '尚無存取金鑰', '建立存取金鑰，讓指令碼或服務可以呼叫 Garrison。'),
      columns: { name: '名稱', accessKey: '存取金鑰', secretKeyLast4: '祕密', userId: '擁有者', lastUsedUtc: '上次使用', expiresUtc: '到期', active: '啟用', id: 'ID' },
      fields: { name: '名稱', userId: '擁有者', authMode: '驗證模式', expiresUtc: '到期', active: '啟用' },
      hints: { userId: '存取金鑰的權限永遠不會超過其擁有者。' },
      actions: { rotate: '輪替祕密' }
    },
    roles: {
      ...rp('角色', '角色是權限的集合。內建角色為唯讀，請複製後再自訂。', '新增角色', '建立角色', '編輯角色', '角色詳細資料', '刪除角色', '尚無角色', '建立自訂角色，或複製內建角色。'),
      columns: { name: '名稱', description: '描述', isBuiltIn: '類型', active: '啟用', id: 'ID', createdUtc: '建立時間' },
      fields: { name: '名稱', description: '描述', active: '啟用' }
    },
    permissions: {
      ...rp('權限', '允許或拒絕對資源類型的操作。拒絕一律優先。', '新增權限', '建立權限', '編輯權限', '權限詳細資料', '刪除權限', '尚無權限', '建立權限並將其對應到角色。'),
      columns: { name: '名稱', permissionType: '類型', resourceTypes: '資源類型', operationTypes: '操作', isBuiltIn: '來源', id: 'ID' },
      fields: { name: '名稱', permissionType: '類型', resourceTypes: '資源類型', operationTypes: '操作', active: '啟用' }
    },
    userAssignments: {
      ...rp('使用者指派', '在租用戶或資源範圍內將角色授予使用者。', '新增使用者指派', '建立使用者指派', '編輯使用者指派', '使用者指派詳細資料', '刪除使用者指派', '尚無使用者指派', '將角色指派給使用者。'),
      columns: { userId: '使用者', roleName: '角色', resourceScope: '範圍', resourceId: '資源', active: '啟用', createdUtc: '建立時間', id: 'ID' },
      fields: { userId: '使用者', roleId: '角色', resourceScope: '範圍', resourceId: '資源 ID', inheritsToChildren: '套用至租用戶內的資源', active: '啟用' }
    },
    credentialAssignments: {
      ...rp('存取金鑰指派', '將角色授予存取金鑰。存取金鑰的權限應比其擁有者更窄。', '新增存取金鑰指派', '建立存取金鑰指派', '編輯存取金鑰指派', '存取金鑰指派詳細資料', '刪除存取金鑰指派', '尚無存取金鑰指派', '將角色指派給存取金鑰。'),
      columns: { credentialId: '存取金鑰', roleName: '角色', resourceScope: '範圍', resourceId: '資源', active: '啟用', createdUtc: '建立時間', id: 'ID' },
      fields: { credentialId: '存取金鑰', roleId: '角色', resourceScope: '範圍', resourceId: '資源 ID', inheritsToChildren: '套用至租用戶內的資源', active: '啟用' }
    },
    harnessProfiles: {
      ...rp('Harness 設定檔', '精確描述 Harness 如何以無介面模式執行：執行檔、引數、環境變數、檔案與輸出剖析。', '新增 Harness 設定檔', '建立 Harness 設定檔', '編輯 Harness 設定檔', 'Harness 設定檔詳細資料', '刪除 Harness 設定檔', '尚無 Harness 設定檔', '複製內建設定檔，以自訂 Harness 的啟動方式。'),
      steps: { basics: '基本資訊', invocation: '呼叫方式', output: '輸出', limits: '限制' },
      columns: { name: '名稱', harnessType: 'Harness', executable: '執行檔', outputParser: '剖析器', isBuiltIn: '來源', id: 'ID', createdUtc: '建立時間' },
      fields: {
        name: '名稱',
        description: '描述',
        harnessType: 'Harness 類型',
        executable: '執行檔',
        probeArguments: '版本探測引數',
        active: '啟用',
        arguments: '引數',
        argTemplate: '範本',
        argCondition: '條件',
        argRepeatOver: '重複對象',
        promptDelivery: '提示傳遞方式',
        promptArgumentTemplate: '提示引數或檔案名稱',
        systemPromptDelivery: '系統提示傳遞方式',
        systemPromptTarget: '系統提示目標',
        mcpConfigFormat: 'MCP 設定格式',
        mcpConfigFileName: 'MCP 設定檔名稱',
        environment: '環境變數',
        envName: '名稱',
        envValue: '值範本',
        isSecret: '祕密',
        files: '檔案',
        fileBase: '基底目錄',
        filePath: '路徑',
        fileContent: '內容範本',
        fileMode: '模式',
        credentialEnvironmentAllowlist: '允許的憑證變數',
        outputParser: '輸出剖析器',
        genericTextField: '文字欄位路徑',
        genericFinalField: '最終結果欄位路徑',
        genericSuccessField: '成功欄位路徑',
        genericSuccessValue: '成功值',
        resultSource: '結果來源',
        resultFileName: '結果檔案名稱',
        successPolicy: '成功判定原則',
        successExitCodes: '成功的結束代碼',
        defaultTimeoutSeconds: '預設逾時（秒）',
        killGraceSeconds: '強制終止寬限時間（秒）',
        maxOutputBytes: '輸出上限（位元組）',
        stderrTailBytes: 'Stderr 結尾保留量（位元組）',
        isolateHome: '每次執行隔離 HOME',
        supportsResume: '支援繼續工作階段'
      },
      hints: {
        arguments: '每個範本會轉譯為一個引數。若條件轉譯結果為空或 false，則略過該引數。',
        executable: '工作節點 PATH 中的命令名稱，或絕對路徑。',
        environment: '使用 {{secret.alias}} 參照已繫結的祕密。除了允許清單中的變數外，程序的環境變數一開始是空的。',
        successPolicy: 'Garrison 預設依據剖析器的最終事件判定是否成功，而不是依據結束代碼。'
      },
      errors: { reservedPrefix: 'builtin/ 前置詞為保留字。' }
    },
    promptTemplates: {
      deleteBound_other: '「{{name}}」由 {{count}} 個部署繫結，因此伺服器會拒絕刪除。請先從下列部署移除繫結：',
      deleteBound_one: '「{{name}}」由 {{count}} 個部署繫結，因此伺服器會拒絕刪除。請先從下列部署移除繫結：',
      deleteUnbound: '要刪除「{{name}}」及其所有版本嗎？沒有部署繫結它。此操作無法復原。',
      ...rp('提示範本', 'Garrison 轉譯的每個提示與設定檔。每次儲存都會建立一個版本。', '新增提示範本', '建立提示範本', '編輯提示範本', '提示範本詳細資料', '刪除提示範本', '尚無提示範本', '建立範本，或複製內建範本。'),
      add: '新範本',
      columns: { name: '名稱', kind: '種類', currentVersion: '版本', description: '描述', isBuiltIn: '來源', id: 'ID', lastUpdateUtc: '更新時間' },
      fields: { name: '名稱', kind: '種類', description: '描述' }
    },
    mcpServers: {
      ...rp('MCP 伺服器', '代理程式可使用的 MCP 伺服器。標頭與環境變數可以參照祕密。', '新增 MCP 伺服器', '建立 MCP 伺服器', '編輯 MCP 伺服器', 'MCP 伺服器詳細資料', '刪除 MCP 伺服器', '尚無 MCP 伺服器', '註冊 MCP 伺服器，讓部署可以繫結它。'),
      columns: { name: '名稱', transport: '傳輸方式', endpoint: '端點', required: '必要', active: '啟用', id: 'ID', createdUtc: '建立時間' },
      fields: {
        name: '名稱',
        transport: '傳輸方式',
        description: '描述',
        url: '基底 URL',
        path: 'MCP 路徑',
        headers: '標頭',
        headerName: '名稱',
        headerValue: '值範本',
        command: '命令',
        arguments: '引數',
        environment: '環境變數',
        requiredTools: '必要工具',
        toolTimeoutSeconds: '工具逾時（秒）',
        required: '無法連線時讓執行失敗',
        active: '啟用'
      },
      hints: { requiredTools: '若缺少列出的任何工具，預檢會在啟動前讓執行失敗。' },
      actions: { test: '測試連線' }
    },
    secrets: {
      errors: { expiryPast: '請選擇未來的到期時間，或留白讓祕密永不過期。' },
      ...rp('祕密', '供 Harness 與整合服務使用的加密憑證。值為唯寫。', '新增祕密', '建立祕密', '編輯祕密', '祕密詳細資料', '刪除祕密', '尚無祕密', '新增代理程式所需的 API 金鑰或權杖，例如 Anthropic API 金鑰。'),
      notSet: '未設定',
      neverRefreshed: '尚未更新',
      reauth: { title: '此登入需要重新驗證', since: '自 {{time}} 起', action: '使用此祕密的執行會一直失敗，直到你取代它的值。請使用獨立的 CODEX_HOME 執行 codex login 重新登入，再以「設定值」儲存新的 auth.json，或將部署改用 OpenAI API 金鑰祕密。不要在另一台電腦上繼續使用同一個登入：兩份副本共用同一個更新權杖。' },
      columns: { status: '狀態', accessTokenExpiresUtc: '存取權杖到期時間', name: '名稱', kind: '種類', valueLast4: '值', rotatedUtc: '上次變更', expiresUtc: '到期', active: '啟用', id: 'ID' },
      fields: { refreshedUtc: 'Garrison 上次更新', accessTokenExpiresUtc: '存取權杖到期時間', name: '名稱', kind: '種類', description: '描述', value: '值', newValue: '新值', expiresUtc: '到期', active: '啟用' },
      hints: { expiresUtc: '必須是未來的時間。留白表示祕密永不過期。', kind: '在共用伺服器上使用訂閱權杖可能違反供應商的條款。共用部署請優先使用 API 金鑰。' },
      actions: { setValue: '設定值', rotate: '輪替' }
    },
    workspaces: {
      ...rp('工作區', '執行工作區的準備方式：空白、從 Git 複製，或預置檔案。', '新增工作區範本', '建立工作區範本', '編輯工作區範本', '工作區範本詳細資料', '刪除工作區範本', '尚無工作區', '建立工作區範本，讓部署從儲存庫或檔案開始。'),
      columns: { name: '名稱', kind: '種類', gitUrl: '儲存庫', retention: '保留', active: '啟用', id: 'ID', createdUtc: '建立時間' },
      fields: { name: '名稱', kind: '種類', description: '描述', gitUrl: '儲存庫 URL', gitRef: '分支、標籤或提交', gitDepth: '複製深度', gitCredentialSecretId: 'Git 憑證', persistentVolumeClaim: 'PersistentVolumeClaim 名稱', files: '檔案', filePath: '路徑', fileContent: '內容', retention: '保留', active: '啟用' },
      hints: { persistentVolumeClaim: '執行命名空間中已存在的 Claim。只有使用 Kubernetes Job 執行器的部署才能使用此工作區；其內容會在多次執行之間保留。' },
      errors: { claimName: '請使用小寫字母、數字、連字號與句點，並以字母或數字開頭與結尾。' }
    },
    modelPrices: {
      ...{"title": "模型價格", "subtitle": "在執行器未報告費用時，使用操作員設定的美元費率進行估算。已報告費用（包括零）優先。", "add": "新增模型價格", "create": "建立模型價格", "edit": "編輯模型價格", "view": "模型價格詳情", "deleteTitle": "刪除模型價格", "emptyTitle": "尚無模型價格", "emptyBody": "為執行器和實際使用的精確模型名稱新增價格。不預設供應商費率。"},
      columns: {"name": "名稱", "active": "啟用", "id": "ID", "createdUtc": "建立時間", "model": "實際使用的模型", "harnessType": "執行器", "inputUsdPerMillion": "輸入美元 / 百萬權杖", "outputUsdPerMillion": "輸出美元 / 百萬權杖"},
      fields: {"name": "名稱", "description": "描述", "active": "啟用", "model": "實際使用的模型", "harnessType": "執行器", "inputUsdPerMillion": "輸入美元 / 百萬權杖", "outputUsdPerMillion": "輸出美元 / 百萬權杖", "cachedInputUsdPerMillion": "快取輸入美元 / 百萬權杖", "reasoningUsdPerMillion": "推理美元 / 百萬權杖", "inputIncludesCachedTokens": "輸入計數包含快取權杖", "outputIncludesReasoningTokens": "輸出計數包含推理權杖"},
      hints: {"cachedInputUsdPerMillion": "留空時使用對應的輸入或輸出費率。零表示免費。", "reasoningUsdPerMillion": "留空時使用對應的輸入或輸出費率。零表示免費。", "inputIncludesCachedTokens": "當輸入計數包含快取權杖時啟用。Claude Code單獨報告快取讀取，應停用此項。", "outputIncludesReasoningTokens": "當輸出計數包含推理權杖時啟用。先扣除已包含的子計數，再套用單獨費率。"},
      errors: {"rate": "請輸入0至1,000,000,000之間的有限費率。零為有效值。", "model": "請輸入1至256個字元且不含控制字元的精確模型名稱。"}
    },
    usageQuotas: {"title": "使用配額", "subtitle": "租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "add": "新增使用配額", "create": "建立使用配額", "edit": "編輯使用配額", "view": "使用配額詳情", "deleteTitle": "刪除使用配額", "emptyTitle": "尚無使用配額", "emptyBody": "為租戶、代理或部署新增配額。留空的限制表示無限制。", "columns": {"name": "名稱", "active": "啟用", "id": "ID", "createdUtc": "建立時間", "scope": "範圍", "resourceId": "目標資源", "dailyRunLimit": "每UTC日執行數", "dailyTokenLimit": "每UTC日權杖數", "dailyCostUsdLimit": "每UTC日已知美元", "maxConcurrentRuns": "最大活躍執行數", "enforcementEnabled": "套用限制"}, "fields": {"name": "名稱", "description": "描述", "active": "啟用", "scope": "範圍", "resourceId": "目標資源", "dailyRunLimit": "每UTC日執行數", "dailyTokenLimit": "每UTC日權杖數", "dailyCostUsdLimit": "每UTC日已知美元", "maxConcurrentRuns": "最大活躍執行數", "enforcementEnabled": "套用限制"}, "hints": {"dailyRunLimit": "留空表示無限制，零表示禁止使用。每日計數在UTC午夜重設；並行計數為目前活躍執行數。 僅在啟用限制套用後才會套用限制。", "dailyTokenLimit": "留空表示無限制，零表示禁止使用。每日計數在UTC午夜重設；並行計數為目前活躍執行數。 僅在啟用限制套用後才會套用限制。", "dailyCostUsdLimit": "留空表示無限制，零表示禁止使用。每日計數在UTC午夜重設；並行計數為目前活躍執行數。 僅在啟用限制套用後才會套用限制。", "maxConcurrentRuns": "留空表示無限制，零表示禁止使用。每日計數在UTC午夜重設；並行計數為目前活躍執行數。 僅在啟用限制套用後才會套用限制。", "resourceId": "為租戶、代理或部署新增配額。留空的限制表示無限制。", "enforcementEnabled": "預設關閉。明確啟用後才會在達到限制時拒絕執行，並降低支援的執行器預算。關閉時僅記錄使用量，不影響執行。"}, "errors": {"limit": "請輸入欄位範圍內的非負限制。計數必須為整數。"}, "incomplete": "成本統計不完整：{{count}} 個已完成執行沒有報告或估算成本。僅在啟用限制套用後才會套用限制；缺少成本本身不會阻止執行。", "actions": {"usage": "每日使用量"}, "usage": {"windowStartUtc": "視窗開始 (UTC)", "windowEndUtc": "每日重設 (UTC)", "runsUsed": "已接收執行", "tokensUsed": "已完成權杖數", "costUsd": "已知費用 (USD)", "unknownCostRuns": "缺少費用的執行", "activeRuns": "活躍執行"}},
    artifactStores: {
      ...rp('成品存放區', '執行所產生檔案的存放位置。', '新增成品存放區', '建立成品存放區', '編輯成品存放區', '成品存放區詳細資料', '刪除成品存放區', '尚無成品存放區', '建立成品存放區以保存執行輸出。'),
      columns: { name: '名稱', kind: '種類', description: '描述', active: '啟用', id: 'ID', createdUtc: '建立時間' },
      fields: { name: '名稱', kind: '種類', description: '描述', active: '啟用' }
    },
    agents: {
      deleteWithDeployments_other: '要刪除「{{name}}」及其 {{count}} 個部署嗎？下方的部署也會一併刪除。此操作無法復原。',
      deleteWithDeployments_one: '要刪除「{{name}}」及其 {{count}} 個部署嗎？下方的部署也會一併刪除。此操作無法復原。',
      deleteNoDeployments: '要刪除「{{name}}」嗎？它沒有部署。此操作無法復原。',
      ...rp('代理程式', '透過 REST、MCP 與 A2A 公開的具名能力。部署決定它們如何執行。', '新增代理程式', '建立代理程式', '編輯代理程式', '代理程式詳細資料', '刪除代理程式', '尚無代理程式', '新增代理程式，或從「設定 > 清單」套用範例清單。'),
      sections: { identity: '識別', exposure: '公開方式', io: '輸入與輸出', delegation: '委派' },
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
        exposeA2A: '透過 A2A 公開',
        exposeMcpTool: '公開為獨立的 MCP 工具',
        mcpToolName: 'MCP 工具名稱',
        skills: 'A2A 技能',
        skillId: '技能 ID',
        skillName: '名稱',
        skillDescription: '描述',
        inputMode: '輸入模式',
        inputSchema: '輸入 JSON Schema',
        outputSchema: '輸出 JSON Schema',
        delegationMode: '委派',
        delegationAllowList: '可呼叫的代理程式',
        delegationMaxDepth: '最大深度',
        delegationAllowRecursion: '允許遞迴',
        active: '啟用'
      },
      hints: { name: '小寫字母、數字與連字號。用於 URL 與 A2A 卡片。' },
      errors: { dnsName: '請使用小寫字母、數字與連字號，且開頭與結尾必須是字母或數字。' }
    },
    deployments: {
      approvalsOn_one: '開啟，{{count}} 條規則',
      approvalsOn_other: '開啟，{{count}} 條規則',
      approvalsOff: '關閉',
      promptRoles: { Repair: '結構化輸出修復', DelegatedTask: '委派執行的任務包裝', Task: '任務包裝', System: '系統提示', ConversationFallback: '對話回退（紀錄）' },
      ...rp('部署', '將代理程式繫結到 Harness 設定檔、提示、祕密、MCP 伺服器、排程放置與限制。', '新增部署', '建立部署', '編輯部署', '部署詳細資料', '刪除部署', '尚無部署', '建立部署，讓代理程式可以執行。'),
      steps: { approvals: '核准', basics: '基本資訊', harness: 'Harness', prompts: '提示', resources: '資源', overrides: '覆寫', placement: '排程放置與限制' },
      columns: { approvalsEnabled: '核准', name: '名稱', agentId: '代理程式', harnessProfileId: 'Harness 設定檔', model: '模型', executor: '執行器', weight: '權重', configVersion: '設定版本', active: '啟用', id: 'ID', createdUtc: '建立時間' },
      fields: {
        approvalsEnabled: '工具呼叫前先詢問（核准）',
        approvalDefaultAction: '沒有規則符合時',
        approvalTimeoutSeconds: '核准逾時（秒）',
        approvalTimeoutDecision: '無人回應時的決定',
        approvalRules: '核准規則',
        ruleAction: '動作',
        rulePattern: '規則',
        ruleInputPattern: '輸入模式',
        ruleDescription: '說明',
        approvalTest: '測試工具呼叫',
        name: '名稱',
        agentId: '代理程式',
        description: '描述',
        weight: '流量權重',
        active: '啟用',
        harnessProfileId: 'Harness 設定檔',
        model: '模型',
        fallbackModel: '備援模型',
        effort: '投入程度',
        maxTurns: '最大回合數',
        maxBudgetUsd: '預算上限（USD）',
        parameters: '參數',
        paramName: '名稱',
        paramValue: '值',
        promptBindings: '提示繫結',
        promptRole: '角色',
        template: '範本',
        pinnedVersion: '固定版本',
        resourceBindings: '資源繫結',
        bindingKind: '種類',
        alias: '別名',
        resource: '資源',
        workspaceTemplateId: '工作區範本',
        artifactStoreId: '成品存放區',
        argumentOverrides: '引數覆寫',
        operation: '操作',
        match: '比對',
        argTemplate: '範本',
        condition: '條件',
        environmentOverrides: '環境變數覆寫',
        envName: '名稱',
        envValue: '值範本',
        isSecret: '祕密',
        fileOverrides: '檔案覆寫',
        allowedRunOverrides: '呼叫端可設定的單次執行覆寫',
        validation: '驗證',
        pattern: '模式或值',
        nodePoolId: '節點池',
        nodeSelector: '節點選擇器',
        maxConcurrentRuns: '最大同時執行數',
        timeoutSeconds: '逾時（秒）',
        maxAttempts: '最大嘗試次數',
        repetitionGuard: '重複防護',
        maxAssistantChars: '最大助理字元數',
        noProgressSeconds: '無進展逾時（秒）',
        executor: '執行器',
        podCpuRequest: 'CPU 請求',
        podCpuLimit: 'CPU 上限',
        podMemoryRequest: '記憶體請求',
        podMemoryLimit: '記憶體上限',
        podEphemeralStorageRequest: '暫時性儲存請求',
        podEphemeralStorageLimit: '暫時性儲存上限'
      },
      hints: {
        approvalsEnabled: '適用於 Claude Code 設定檔，以及使用 Codex app-server 的設定檔。其他 Harness 沒有核准掛鉤，因此伺服器會拒絕為它們套用此設定。',
        approvalDefaultAction: '「詢問人員」會在核准收件匣中等候，直到有人決定或逾時為止。',
        approvalTimeoutSeconds: '範圍為 10 至 3,600 秒。留空時使用 300。',
        approvalRules: '「拒絕」優先於「詢問」，「詢問」優先於「允許」。範例：Bash(npm test)、Bash(npm run *)、Edit(src/**)、WebFetch(domain:example.com)、mcp__github__*。',
        secretsKinds: 'Harness 設定檔 {{profile}} 需要任一類型為 {{kinds}} 的祕密。可用任何別名繫結。',
        secretsAliases: 'Harness 設定檔 {{profile}} 會讀取以這些別名繫結的祕密：{{aliases}}。',
        secretsNone: 'Harness 設定檔 {{profile}} 不讀取任何祕密，因此不需要繫結祕密。',
        promptBindings: '將提示角色（System、Task、DelegatedTask，以及 Harness 設定檔使用的任何角色）對應到範本。版本留空即可一律使用最新版本。',
        resourceBindings: '別名會成為範本變數，例如 {{secret.anthropic}}。',
        weight: '未明確指定部署的請求，會依權重分配到各個啟用中的部署。',
        maxConcurrentRuns: '0 表示不限制。',
        timeoutCap: '叢集設定 {{setting}} 將每個執行限制為 {{value}} 秒。',
        zeroUnlimited: '0 表示不限制。',
        zeroOff: '0 表示關閉此防護。',
        guardDefault: '留空時使用 {{setting}} 中的叢集預設值 {{value}}。',
        guardDefaultUnknown: '留空時使用叢集設定 {{setting}}。',
        guardOwn: '已在此部署上設定。叢集預設值（{{setting}}）為 {{value}}。',
        guardOwnUnknown: '已在此部署上設定，不使用叢集設定 {{setting}}。',
        guardFollowing: '依照 {{setting}} 中的叢集預設值 {{value}}。',
        executorInherit: '留空則使用節點集區預設值：{{executor}}。',
        executorSet: '處理程序會在 worker 內執行 harness；Kubernetes Job 會在獨立的 Pod 中執行。',
        podCpuRequest: 'Pod 資源只適用於 Kubernetes Job 執行。請使用 Kubernetes 數量，例如 500m、2、512Mi 或 4Gi；留空則使用 worker 預設值。'
      },
      actions: { addRule: '新增規則', compilePreview: '編譯預覽', test: '測試呼叫', useClusterDefault: '使用叢集預設值' },
      sections: {
        guards: '執行防護',
        execution: '執行器與 Pod 資源'
      },
      placeholders: {
        ruleInputPattern: '選用，比對輸入 JSON 的規則運算式',
        clusterDefault: '叢集預設值（{{value}}）',
        clusterDefaultUnknown: '叢集預設值'
      },
      executorInherit: '節點集區預設值',
      executorInheritShort: '集區預設',
      errors: { rulePatternRequired: '請輸入規則模式。', rulePatternOneLine: '規則模式必須寫在同一行。', rulePatternTooLong: '規則模式最多 1,000 個字元。', tooManyRules: '一個部署最多可以有 500 條核准規則。', approvalTimeout: '請輸入 10 至 3,600 之間的整數秒數。', quantity: '請使用 Kubernetes 數量，例如 500m、2、512Mi 或 4Gi。' },
      guardStates: {
        on: '開啟',
        off: '關閉'
      }
    },
    nodePools: {
      ...rp('節點池', '依標籤將工作節點分組，並可選擇專供特定租用戶使用。', '新增節點池', '建立節點池', '編輯節點池', '節點池詳細資料', '刪除節點池', '尚無節點池', '建立節點池以提供專用容量。'),
      allTenants: '所有租用戶',
      columns: { name: '名稱', description: '描述', tenants: '租用戶', defaultExecutor: '預設執行器', active: '啟用', id: 'ID', createdUtc: '建立時間' },
      fields: { name: '名稱', description: '描述', defaultExecutor: '預設執行器', tenants: '允許的租用戶 ID', active: '啟用' },
      hints: { tenants: '留空表示允許所有租用戶。' }
    },
    runs: {
      ...rp('執行', '每一次代理程式呼叫，以及其狀態、節點、持續時間與結果。', '新增執行', '建立執行', '編輯執行', '執行詳細資料', '刪除執行', '尚無執行', '呼叫代理程式以開始執行。'),
      columns: {
        approvalWaitMs: '核准等候',
        delegationWaitMs: '委派等待時間',
        timeToFirstTokenExcludingDelegationMs: 'TTFT（不含委派）',
        id: '執行',
        agentName: '代理程式',
        status: '狀態',
        outcome: '結果',
        harnessType: 'Harness',
        leaseNodeName: '節點',
        timeToFirstTokenMs: 'TTFT',
        streamingMs: '串流',
        executionMs: '持續時間',
        queueMs: '排隊時間',
        totalMs: '總時間',
        inputTokens: '輸入 Token',
        outputTokens: '輸出 Token',
        cachedTokens: '快取 Token',
        reasoningTokens: '推理 Token',
        outputTokensPerSecond: 'Token/秒',
        costUsd: '成本',
        toolCallCount: '工具呼叫次數',
        depth: '深度',
        createdUtc: '建立時間',
        conversationId: '對話'
      },
      actions: { cancel: '取消執行', retry: '重試執行' },
      toasts: { cancelRequested: '已要求取消。', retried: '已開始重試。' },
      turn: '第 {{turn}} 輪'
    },
    nodes: {
      ...rp('節點', '取得執行租約並加以執行的工作節點。維護前請先封鎖或清空節點。', '新增節點', '建立節點', '編輯節點', '節點詳細資料', '刪除節點', '尚無節點', '工作節點啟動時會自行註冊。請部署 worker StatefulSet，或在本機執行 Garrison.Worker。'),
      columns: { name: '名稱', status: '狀態', capacity: '執行', harnesses: 'Harness', executors: '執行器', containerized: '容器化', labels: '標籤', nodeVersion: '版本', lastHeartbeatUtc: '上次心跳訊號', id: 'ID' },
      fields: { address: '位址', maxConcurrentRuns: '容量', childReserveSlots: '子執行預留', maxResidentWaiters: '最多等待執行數', activeRuns: '進行中的執行', capabilities: '能力', detectedVersion: '版本', available: '可用', detail: '詳細資訊' },
      actions: { cordon: '封鎖', uncordon: '解除封鎖', drain: '清空', runs: '檢視執行', grafana: '在 Grafana 中開啟' },
      toasts: { cordoned: '節點已封鎖。', uncordoned: '節點已解除封鎖。', draining: '節點正在清空。' }
    },
    controlNodes: {
      ...rp('控制平面', '提供 API、MCP 與 A2A 並排程執行的伺服器副本。每個副本會自行註冊，並每 5 秒傳送一次心跳訊號。', '新增控制節點', '建立控制節點', '編輯控制節點', '控制節點詳細資料', '刪除控制節點', '沒有回報任何控制節點', '伺服器副本啟動後，控制節點就會出現在這裡。比此主控台舊的伺服器不會回報控制節點。'),
      columns: { name: '名稱', status: '狀態', version: '版本', schemaVersion: '結構描述版本', backplane: '事件匯流排', uptime: '運作時間', lastHeartbeatUtc: '上次心跳訊號', activeRequests: '要求', openStreams: '串流', heldLongPolls: '長輪詢', address: '位址', hostname: '主機名稱', startedUtc: '啟動時間', id: 'ID' },
      fields: { name: '名稱', id: '節點 ID', hostname: '主機名稱', address: '位址', isLeader: '領導者', leaderEpoch: '領導者紀元', version: '版本', schemaVersion: '資料庫結構描述版本', backplane: '事件匯流排', startedUtc: '啟動時間', uptime: '運作時間', lastHeartbeatUtc: '上次心跳訊號', activeRequests: '進行中的要求', openStreams: '開啟的串流', heldLongPolls: '保留的長輪詢', respondingNodeId: '回應的副本' },
      leader: '領導者',
      stale: '心跳逾時',
      answeredBy: '回應的副本：{{node}}',
      answeredByLeader: '回應的副本：{{node}}（領導者）',
      actions: { grafana: '在 Grafana 中開啟' }
    },
    audit: {
      ...rp('稽核', '此租用戶的驗證、授權與設定事件。', '新增稽核紀錄', '建立稽核紀錄', '編輯稽核紀錄', '稽核紀錄詳細資料', '刪除稽核紀錄', '尚無稽核紀錄', '當人員與代理程式使用 Garrison 時，安全性事件會顯示在這裡。'),
      emptyTitle: '尚無稽核紀錄',
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
      ...rp('套用歷程', '每一次清單套用與試執行，以及各文件的結果。', '新增套用紀錄', '建立套用紀錄', '編輯套用紀錄', '套用詳細資料', '刪除套用紀錄', '尚無套用歷程', '套用或試執行清單後，紀錄會顯示在這裡。'),
      columns: { createdUtc: '時間', principalName: '套用者', dryRun: '試執行', counts: '結果' }
    },
    conversations: {
      title: '對話',
      subtitle: '與代理程式的多輪交流。每一輪都是一次執行，會恢復上一輪的 Harness 工作階段。',
      add: '新增對話',
      create: '建立對話',
      edit: '編輯對話',
      view: '對話詳細資料',
      deleteTitle: '刪除對話',
      emptyTitle: '還沒有對話',
      emptyBody: '在「呼叫」頁面選擇「開始新對話」來建立一個，或傳送 A2A 訊息：每個 A2A 情境都是一個對話。',
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
        runs: '以執行形式檢視各輪'
      }
    }
  },
  views: {
    approvalDetail: {
      title: '核准',
      titleWithTool: '{{tool}} 的核准',
      backToInbox: '所有核准',
      pending: '正在等候人員允許或拒絕此工具呼叫。',
      pendingExpires: '正在等候人員處理。若無人決定，將於 {{when}} 到期，並套用決定 {{decision}}。',
      request: '要求',
      rules: '規則',
      noRule: '沒有符合的規則',
      noInput: '未記錄任何輸入。',
      notFoundTitle: '找不到核准',
      notFoundBody: '它可能屬於其他租用戶，或 ID 有誤。'
    },
    home: {
      observabilityState: { reachable: '可連線', unreachable: '無法連線', checking: '檢查中', unknown: '狀態不明' },
      observabilityVersion: '版本 {{version}}',
      observabilityOpen: '開啟 {{service}}',
      kpisGrafana: '在 Grafana 中開啟總覽',
      grafanaDashboards: 'Grafana 儀表板',
      grafanaSections: { overview: '概覽', http: 'HTTP API', runs: '執行', agents: '代理程式', models: '模型與權杖', workers: '工作節點', kubernetes: 'Kubernetes 執行器', protocols: '協定', scheduler: '排程器與佇列', database: '資料庫', controlPlane: '控制平面', security: '安全與驗證', integrations: '整合', logs: '記錄與追蹤', autonomy: '自主' },
      observabilitySetup: '設定可觀測性',
      observabilityNone: '此環境未設定任何可觀測性服務（Grafana、Prometheus、Tempo 或 Loki）。',
      observability: '可觀測性',
      title: '首頁',
      subtitle: '你的代理程式與工作節點目前的動態。',
      lastLoaded: '更新於 {{time}}',
      partial: '部分面板無法載入，顯示的值並不完整。',
      getStartedTitle: '此租用戶尚無代理程式',
      getStartedBody: '設定精靈會新增憑證、套用範例代理程式並執行測試。',
      runSetup: '執行設定精靈',
      kpis: {
        agents: '代理程式',
        deployments: '部署',
        activeRuns: '進行中的執行',
        queued: '已排入佇列',
        succeeded: '成功',
        failed: '失敗',
        nodes: '就緒節點',
        controlNodes: '控制平面就緒',
        nodesNote: '就緒 / 總數',
        last24h: '過去 24 小時'
      },
      requestActivity: 'API 請求活動',
      nodesTitle: '節點',
      noNodesTitle: '尚未註冊任何工作節點',
      noNodesBody: '啟動 Garrison.Worker，或擴充 worker StatefulSet。節點會自行註冊。',
      nodeLoad: '{{active}} / {{max}} 個執行',
      controlPlaneSection: '控制平面',
      workersSection: '工作節點',
      openControlPlane: '檢視全部',
      openWorkers: '檢視全部',
      noControlNodes: '尚未有任何控制節點註冊。',
      controlNodesUnavailable: '無法顯示控制節點：伺服器比此主控台舊，或你沒有讀取節點的權限。',
      recentFailures: '最近的失敗',
      noFailures: '最近沒有失敗的執行。',
      cta: {
        title: '常用工作',
        invoke: '呼叫代理程式',
        addAgent: '新增代理程式',
        applyManifest: '套用清單',
        inspectRuns: '檢查執行',
        nodes: '檢查工作節點',
        apiExplorer: '開啟 API 探索器',
        analytics: '檢視執行分析'
      },
      externalServices: '外部服務',
      externalServicesNote: '隨附的可觀測性工具。分享此部署前，請先變更預設憑證。',
      externalServicesNone: '此部署未設定任何外部服務。',
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
        starting: '正在啟動執行...',
        live: '即時',
        finished: '已完成',
        elapsed: '經過時間',
        firstToken: '首個 Token',
        tokensPerSecond: '速度',
        finishedHint: '執行已完成。',
        showResponse: '查看回應',
        reasoning: '推理過程',
        waiting: '正在等待輸出...',
        waitingCodex: '正在等待輸出。Codex 會在完成時一次送出回答。',
        codexNote: 'Codex 不支援串流：執行結束時，回答會一次顯示在這裡。',
        noText: '此執行沒有串流文字。結果在「回應」分頁中。',
        jump: '跳到最新',
        tool: {
          running: '執行中',
          ok: '成功',
          failed: '失敗'
        }
      },
      noDeployment: '此代理程式沒有權重大於零的啟用部署，因此呼叫會遭拒。請在「部署」分頁新增部署，或提高某個部署的權重。',
      title: '呼叫',
      subtitle: '傳送訊息給代理程式，並即時觀看對話紀錄串流。',
      request: '請求',
      agent: '代理程式',
      deployment: '部署',
      weighted: '任何啟用中的部署（依權重）',
      default: '部署預設值',
      message: '訊息',
      messagePlaceholder: '要讓代理程式做什麼？',
      shortcut: '按 Ctrl+Enter 或 Cmd+Enter 傳送。',
      send: '傳送',
      sending: '傳送中...',
      openRun: '開啟執行',
      idleTitle: '尚無執行',
      idleBody: '傳送訊息以開始執行。對話紀錄會在串流時顯示於此。',
      noAgentsTitle: '沒有可呼叫的代理程式',
      noAgentsBody: '建立代理程式與部署，或套用範例清單。',
      applySample: '前往清單',
      stopOnLeave: '離開時停止執行',
      cancel: '取消執行',
      cancelling: '正在取消...',
      timeLimit: '時間限制',
      timeLimitPlaceholder: '部署預設值',
      timeLimitClear: '使用預設值',
      timeLimitRange: '允許範圍：{{min}} 到 {{max}}。',
      timeLimitAny: '執行在逾時前可以使用的秒數。',
      timeLimitCap: '叢集會在 {{max}} 後停止每個執行。',
      timeLimitErrors: {
        notInteger: '請輸入整數秒數。',
        range: '請輸入 {{min}} 到 {{max}} 之間的時間限制。',
        aboveCap: '叢集每個執行最多允許 {{max}}。'
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
          none: '單次執行（無對話）',
          start: '開始新對話',
          continue: '繼續對話'
        },
        pick: '要繼續的對話',
        choose: '選擇對話',
        option: '{{title}}（輪數：{{turns}}）',
        pinned: '每一輪都在對話第一輪的部署上執行，因此這裡無法選擇部署。',
        busy: '此對話仍在處理上一輪。在該執行結束之前，新的訊息會被拒絕。',
        open: '開啟對話（第 {{turn}} 輪）'
      }
    },
    runDetail: {
      awaitingApproval_one: '此執行正在等候人員核准 {{count}} 個工具呼叫。',
      awaitingApproval_other: '此執行正在等候人員核准 {{count}} 個工具呼叫。',
      reviewApprovals: '審查',
      approvals_one: '核准（{{count}}）',
      approvals_other: '核准（{{count}}）',
      noApprovals: '此執行尚未要求任何核准。',
      openApproval: '開啟核准',
      viewTrace: '檢視追蹤',
      viewLogs: '檢視日誌',
      traceId: '追蹤 ID',
      deploymentDeleted: '此執行使用的部署已刪除，因此無法重試。請改為再次呼叫代理程式 {{agent}}。',
      templatesUsed: '使用的範本',
      agentDeleted: '代理程式 {{agent}} 已不存在，因此無法重試此執行。它的記錄、對話紀錄與遙測仍可在此查看。',
      title: '執行',
      titleWithAgent: '{{agent}} 的執行',
      deployment: '部署',
      model: '實際使用的模型',
      tokensLabel: 'Token',
      tokens: '輸入 {{input}}，輸出 {{output}}',
      estimated: '估計值',
      caller: '呼叫端',
      parent: '上層執行',
      attempt: '嘗試次數',
      outputSchema: '輸出結構描述',
      outputSchemaStates: {
        valid: '有效',
        validAfterRepair: '經過一次修復後有效',
        invalid: '無效',
        invalidAfterRepair: '經過一次修復後仍無效'
      },
      started: '開始時間',
      completed: '完成時間',
      exitCode: '結束代碼',
      transcript: '對話紀錄',
      result: '結果',
      input: '輸入',
      stderr: 'Stderr',
      children_one: '子執行（{{count}}）',
      children_other: '子執行（{{count}}）',
      eventFilter: '顯示',
      eventCount_one: '{{count}} 個事件',
      eventCount_other: '{{count}} 個事件',
      noEvents: '尚無事件。Harness 產生事件時會顯示於此。',
      failed: '失敗',
      noResult: '此執行未產生任何結果文字。',
      pending: '執行完成後會顯示結果。',
      structuredOutput: '結構化輸出',
      templateVersions: '使用的提示範本版本',
      noStderr: '未擷取到任何 stderr。',
      noChildren: '此執行未委派給其他代理程式。',
      confirmCancel: '要取消此執行嗎？Harness 程序會在其節點上停止。',
      notFoundTitle: '找不到執行',
      notFoundBody: '它可能已被刪除，或屬於其他租用戶。',
      telemetry: {
        approvalNote: '此執行花了 {{wait}} 等候核准決定。執行時間包含這段等候。',
        delegationNote: '此執行等待委派執行 {{wait}}。第一個 Token 時間含此等待為 {{ttft}}，不含為 {{excluding}}；與不委派的代理程式比較時請用後者。',
        title: '遙測',
        phases: '各階段執行時間',
        phase: { delegation: '等待委派執行', queue: '佇列', startup: '啟動至第一個 Token', streaming: '串流', tail: '最後一個 Token 之後' },
        fields: {
          approvalWaitMs: '核准等候',
          delegationWaitMs: '委派等待時間',
          timeToFirstTokenExcludingDelegationMs: '第一個 Token 時間（不含委派）',
          timeToFirstTokenMs: '第一個 Token 時間',
          streamingMs: '串流時間',
          executionMs: '執行時間',
          queueMs: '排隊時間',
          totalMs: '總時間',
          outputTokensPerSecond: '每秒輸出 Token 數',
          inputTokens: '輸入 Token',
          outputTokens: '輸出 Token',
          cachedTokens: '快取 Token',
          reasoningTokens: '推理 Token',
          toolCallCount: '工具呼叫次數',
          costUsd: '成本',
          firstTokenUtc: '第一個 Token 時間點',
          lastTokenUtc: '最後一個 Token 時間點'
        }
      },
      conversation: '對話',
      conversationSession: '工作階段',
      resumeSessionId: '恢復的工作階段',
      affinityNode: '親和節點',
      affinityUntil: '直到 {{time}}'
    },
    queue: {
      title: '佇列',
      subtitle: '依代理程式與 Harness 檢視等待節點、已租用與執行中的工作。',
      queued: '已排入佇列',
      leased: '已租用',
      running: '執行中',
      emptyTitle: '沒有等待中的工作',
      emptyBody: '執行在等待工作節點時會顯示於此。'
    },
    agentDetail: {
      invoke: '呼叫',
      grafana: '在 Grafana 中開啟',
      noActiveDeployment: '此代理程式沒有啟用中的部署，因此呼叫將遭到拒絕。',
      deployments_one: '部署（{{count}}）',
      deployments_other: '部署（{{count}}）',
      recentRuns: '最近的執行',
      card: 'A2A 卡片',
      traffic: '流量比例',
      noDeploymentsTitle: '沒有部署',
      noDeploymentsBody: '建立部署，將此代理程式繫結到 Harness。',
      noRuns: '此代理程式尚未執行過。',
      selectionNote: '每次未明確指定部署的呼叫，都會依權重比例隨機分配到一個啟用中的部署。',
      manageDeployments: '管理部署',
      conversations: '對話'
    },
    templateEditor: {
      cloneToEdit: '複製後編輯',
      builtInReadOnly: '內建範本為唯讀，因此這裡的所有欄位都已鎖定。複製後即可取得可編輯的副本。',
      renameHint: '你可以重新命名此範本。部署以 ID 參照，所以繫結不受影響；但以名稱引入它的範本需要手動更新。',
      cloneDialog: { taken: '已有名為 {{name}} 的範本。請換一個名稱。', reserved: '以 builtin/ 開頭的名稱保留給內建範本使用。', hint: '之後可以在副本的頁面重新命名。', name: '副本名稱', body: '副本以目前內容作為第 1 版，之後可以編輯、重新命名和刪除。', title: '複製 {{name}}' },
      newTitle: '新提示範本',
      subtitle: '撰寫範本，以範例內容預覽後再儲存。',
      builtInNote: '內建範本為唯讀。請複製後再自訂，或重設以還原隨附的內容。',
      content: '內容',
      changeNote: '變更說明',
      syntaxHint: '語法：{{variable}}、{{value | default: "x"}}、{{#if x}}...{{else}}...{{/if}}、{{#each list}}...{{/each}}、{{> template-name}}。',
      variables: '使用的變數',
      noVariables: '未參照任何變數。',
      preview: '即時預覽',
      sampleContext: '範例內容（JSON）',
      rendered: '轉譯結果',
      previewEmpty: '轉譯後的文字會顯示於此。',
      missing: '缺少的變數：{{list}}',
      versions_one: '版本（{{count}}）',
      versions_other: '版本（{{count}}）',
      noVersions: '尚無已儲存的版本。',
      version: '版本',
      note: '說明',
      author: '作者',
      diff: '差異',
      restore: '還原',
      diffTitle: '版本 {{version}} 與編輯器內容比較',
      current: '編輯器',
      reset: '重設為預設值',
      savedVersion: '已儲存新版本。',
      restored: '已還原版本 {{version}}。',
      resetDone: '已重設為隨附的內容。',
      confirm: {
        restoreTitle: '還原版本',
        restoreMessage: '要還原版本 {{version}} 嗎？目前的內容會保留在歷程中。',
        resetTitle: '重設範本',
        resetMessage: '要將「{{name}}」重設為隨附的內容嗎？',
        deleteTitle: '刪除範本',
        deleteMessage: '要刪除「{{name}}」嗎？繫結此範本的部署將無法編譯。'
      }
    },
    manifests: {
      warnings_one: '{{count}} 則警告',
      warnings_other: '{{count}} 則警告',
      planned: '預計結果：{{result}}',
      changes: { count_other: '{{count}} 個欄位有變更。', count_one: '{{count}} 個欄位有變更。', empty: '（空白）', after: '變更後', before: '變更前', field: '欄位' },
      title: '清單',
      subtitle: '以程式碼形式套用設定。試執行只會驗證，不會寫入。',
      applyTab: '套用',
      exportTab: '匯出',
      historyTab: '歷程',
      upload: '上傳檔案',
      loadSample: '載入範例',
      document: '清單（YAML 或 JSON，可包含多份文件）',
      dryRun: '試執行',
      apply: '套用',
      validated: '驗證完成。',
      applied: '已套用清單。',
      results: '結果',
      dryRunResults: '試執行結果',
      kind: '種類',
      name: '名稱',
      result: '結果',
      message: '訊息',
      confirmTitle: '套用清單',
      confirmMessage: '要將此清單中的所有文件套用到目前的租用戶嗎？',
      exportHelp: '匯出此租用戶的設定。祕密的值永遠不會被匯出。',
      export: '匯出',
      download: '下載',
      counts: '已建立 {{created}} 個，已更新 {{updated}} 個，未變更 {{unchanged}} 個，失敗 {{failed}} 個'
    },
    requests: {
      grafana: 'Grafana 中的 HTTP 儀表板',
      title: '請求歷程',
      subtitle: '擷取的 API 流量。可深入檢視任何請求並管理保留設定。',
      kpis: { total: '保留的請求', success: '成功', failure: '失敗', avgDuration: '平均時間' },
      columns: { time: '時間', method: '方法', path: '路徑', status: '狀態', duration: '持續時間', principal: '主體' },
      bulkDeleteTitle: '刪除請求歷程',
      bulkDeleteMessage: '要刪除符合目前篩選條件的全部 {{count}} 筆請求嗎？',
      bulkDeleteAll: '刪除所有符合項目',
      deleteOneTitle: '刪除請求',
      deleteOneMessage: '要刪除請求 {{id}} 嗎？',
      deleted: '已刪除。',
      emptyTitle: '沒有請求歷程',
      emptyBodyNoTraffic: '目前尚未保留任何 API 流量。',
      emptyBodyNoMatch: '沒有符合目前篩選條件的請求。'
    },
    explorer: {
      title: 'API 探索器',
      subtitle: '依據此伺服器的 OpenAPI 文件，對其執行即時呼叫。',
      operations: '操作',
      selectOperation: '選擇一個操作以建立請求。',
      selectOperationOption: '選擇操作...',
      pathParams: '路徑參數',
      queryParams: '查詢參數',
      headers: '標頭',
      addHeader: '新增標頭',
      headerName: '標頭名稱',
      headerValue: '標頭 {{name}} 的值',
      removeHeader: '移除標頭 {{name}}',
      body: '請求內容',
      resolvedUrl: '解析後的 URL',
      copyUrl: '複製 URL',
      execute: '執行',
      executing: '執行中...',
      stop: '停止',
      streaming: '串流中',
      response: '回應',
      responseHeaders: '回應標頭',
      responseBody: '回應內容',
      snippets: '程式碼片段',
      history: '最近的請求',
      historyEmpty: '沒有最近的請求。',
      loadHistory: '載入',
      deleteHistory: '刪除',
      clearHistory: '清除歷程',
      required: '必填',
      confirmTitle: '執行破壞性操作',
      confirmMessage: '此 {{method}} 請求可能會修改或刪除資料。要繼續嗎？',
      noSpecTitle: '無法取得 OpenAPI 文件',
      noSpecBody: '此伺服器未傳回可用的 /openapi.json 文件，因此 API 探索器無法列出操作。'
    },
    settings: {
      errors: { allowed: '請選擇下列其中一個值：{{values}}。', boolean: '請選擇 true 或 false。', max: '請輸入不大於 {{max}} 的值。', min: '請輸入不小於 {{min}} 的值。', range: '請輸入 {{min}} 到 {{max}} 之間的值。', integer: '請輸入整數。', number: '請輸入數字。' },
      notSaved: '沒有儲存任何內容。請修正標示的設定，然後再儲存一次。',
      title: '設定',
      subtitle: '來自設定檔的伺服器設定，以及儲存在資料庫中的叢集設定。',
      readOnly: '你正以唯讀模式檢視設定。只有系統管理員可以變更。',
      restartBanner: '部分已儲存的變更會在重新啟動後生效。',
      restarting: '伺服器正在重新啟動。此頁面會自動重新連線。',
      restarted: '伺服器已恢復上線。',
      restartTimeout: '伺服器未在三分鐘內恢復。請檢查 Pod 狀態。',
      restart: '重新啟動伺服器',
      restartConfirmTitle: '重新啟動伺服器',
      restartConfirmMessage: '要立即重新啟動此控制平面節點嗎？進行中的請求會先處理完畢，主控台會自動重新連線。',
      savedLive: '設定已儲存並套用。',
      savedRestart: '設定已儲存。請重新啟動伺服器以套用所有變更。',
      live: '即時生效',
      restartRequired: '需要重新啟動',
      secretSet: '已設定（輸入新值以取代）',
      secretNotSet: '未設定',
      invalidNumber: '請輸入數字。',
      range: '允許範圍：{{min}} 至 {{max}}',
      testDatabase: '測試資料庫連線',
      testing: '測試中...',
      dbOk: '連線成功',
      dbFailed: '連線失敗',
      unavailableTitle: '無法取得設定',
      unavailableBody: '此伺服器未傳回其設定。',
      sources: { File: '設定檔', Environment: '環境變數', ConfigMap: 'ConfigMap', Database: '叢集' },
      lockedBy: {
        Environment: '由環境變數設定，以環境變數的值為準。',
        ConfigMap: '由 Kubernetes ConfigMap 管理。請在你的清單中變更。',
        other: '此設定無法在這裡編輯。'
      },
      groups: { Codex: 'Codex', Archive: '封存', General: '一般', Rest: 'REST', Mcp: 'MCP', Database: '資料庫', Logging: '記錄', Auth: '驗證', Security: '安全性', RequestHistory: '請求歷程', Telemetry: '遙測', Cluster: '叢集', Scheduling: '排程', Runs: '執行', Audit: '稽核', Runtime: '執行階段', Observability: '可觀測性' },
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
          PublicBaseUrl: '供執行使用的內部 REST URL',
          Ssl: 'REST TLS 加密',
          Port: 'REST 連接埠',
          Hostname: 'REST 繫結主機名稱'
        },
        Mcp: {
          InternalPort: '內部 MCP 連接埠',
          SessionIdleTimeoutSeconds: 'MCP 工作階段閒置逾時（秒）',
          MaxToolWaitSeconds: 'MCP 工具最長等待時間（秒）',
          PublicUrl: '供執行使用的內部 MCP URL',
          Path: 'MCP 路徑',
          Port: 'MCP 連接埠',
          Hostname: 'MCP 繫結主機名稱',
          Enable: '啟用 MCP 伺服器'
        },
        Database: {
          MinPoolSize: '連線集區最小連線數',
          ConnectionTimeoutSeconds: '等待連線逾時（秒）',
          CommandTimeoutSeconds: '命令逾時（秒）',
          ConnectionIdleLifetimeSeconds: '閒置連線保留時間（秒）',
          MaxPoolSize: '連線集區大小',
          Schema: '資料庫結構描述',
          Password: '資料庫密碼',
          Username: '資料庫使用者',
          DatabaseName: '資料庫名稱',
          Port: '資料庫連接埠',
          Host: '資料庫主機',
          Filename: 'Sqlite 檔案',
          Type: '資料庫類型'
        },
        Logging: {
          MinimumSeverity: '最低記錄嚴重性',
          LogFilename: '記錄檔名稱',
          LogDirectory: '記錄目錄',
          FileLogging: '將記錄輸出到檔案',
          ConsoleLogging: '將記錄輸出到主控台'
        },
        Auth: {
          RateLimitPerMinute: '每分鐘登入嘗試次數',
          PasswordHashIterations: '密碼雜湊迭代次數',
          SignedRequestSkewSeconds: '簽署要求允許的時鐘誤差（秒）',
          AdminApiKey: '管理員 API 金鑰',
          TokenLifetimeMinutes: '工作階段有效期（分鐘）',
          SigningKey: '權杖簽署金鑰',
          Issuer: '權杖簽發者'
        },
        Security: {
          NodeSecretKey: '工作節點私密金鑰',
          NodeAccessKey: '工作節點存取金鑰',
          DefaultSecretKey: '預設私密金鑰',
          DefaultAccessKey: '預設存取金鑰',
          AdminPassword: '初始管理員密碼',
          AdminEmail: '初始管理員電子郵件',
          MasterKey: '祕密加密主金鑰'
        },
        RequestHistory: {
          CaptureNodeProtocol: '記錄成功的工作節點協定請求',
          MaxResponseBodyBytes: '記錄的回應本文上限（位元組）',
          MaxRequestBodyBytes: '記錄的要求本文上限（位元組）',
          RetentionDays: '要求歷程保留天數',
          Enabled: '記錄要求歷程'
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
          ExpectedReplicas: '控制平面預期複本數'
        },
        Scheduling: {
          EventPollMs: '事件輪詢間隔（毫秒）',
          InvocationWaitPollMs: '調用等待備用重讀間隔（毫秒）',
          NodeHeartbeatTimeoutMs: '節點活動訊號逾時（毫秒）',
          LeaseWaitMs: '租約長輪詢等待時間（毫秒）',
          LeaseDurationMs: '執行租約時長（毫秒）',
          PauseGraceMs: '主機暫停後的寬限時間（毫秒）'
        },
        Runs: {
          EventRetentionDays: '執行事件保留天數',
          RetentionDays: '執行保留天數',
          MaxDelegationDepth: '最大委派深度',
          DelegationChildQueueDepth: '等待中執行的子執行最大排隊數',
          DelegationRetryAfterSeconds: '委派容量耗盡時的重試提示（秒）',
          DefaultTimeoutSeconds: '預設執行逾時（秒）'
        },
        Codex: {
          RefreshBeforeExpirySeconds: '在到期前更新 Codex 登入（秒）',
          RefreshCheckIntervalSeconds: '背景檢查間隔（秒）',
          RefreshTimeoutSeconds: '登入更新逾時（秒）',
          TokenEndpoint: 'OAuth 權杖端點',
          ClientId: 'OAuth 用戶端 ID'
        },
        Runtime: {
          FailBlockedAfterSeconds: '受阻執行在幾秒後失敗',
          MaxRunSeconds: '最長執行時間（秒）',
          RepetitionGuard: '預設啟用重複防護',
          MaxAssistantChars: '預設最大助理字元數',
          NoProgressSeconds: '預設無進展逾時（秒）',
          ConversationAffinityWaitMs: '對話親和等待時間（毫秒）',
          ConversationTranscriptTurns: '回退紀錄的輪數',
          ConversationTranscriptChars: '回退紀錄中每則訊息的字元數'
        },
        Audit: {
          RetentionDays: '稽核保留天數'
        }
      }
    },
    analytics: {
      grafana: 'Grafana 中的執行儀表板',
      deletedAgent: '已刪除的代理程式（{{id}}）',
      deletedDeployment: '已刪除的部署（{{id}}）',
      title: '分析',
      subtitle: '你的執行在一段時間內的速度、成本與可靠性。',
      loading: '正在載入分析...',
      filters: { ttft: 'TTFT 不含委派等待', range: '範圍', from: '起', to: '迄', agentId: '代理程式', harnessType: 'Harness', deploymentId: '部署', model: '模型', groupBy: '分組依據' },
      allAgents: '所有代理程式',
      allHarnesses: '所有 Harness',
      allDeployments: '所有部署',
      allModels: '所有模型',
      unknownModel: '未知模型',
      groupBy: { none: '不分組', agent: '代理程式', harness: 'Harness', model: '模型', harnessModel: 'Harness 與模型' },
      export: { window: '時間範圍：{{from}} 至 {{to}}' },
      usage: { title: '依 Harness 與模型區分的用量', help: '範圍內每種 Harness 與模型組合的 Token 與成本歷史趨勢，並附明細表。' },
      breakdown: {
        title: 'Harness 與模型明細',
        columns: { harness: 'Harness', model: '模型', runs: '執行', inputTokens: '輸入 Token', outputTokens: '輸出 Token', cachedTokens: '快取 Token', reasoningTokens: '推理 Token', costUsd: '成本', timeToFirstTokenMsAvg: '平均 TTFT' }
      },
      rangeError: {
        incomplete: '請為自訂範圍選擇開始與結束時間。',
        reversed: '自訂範圍的開始時間必須早於結束時間。'
      },
      truncated: '此範圍內的執行數超過伺服器單次請求可彙總的數量，因此數字僅涵蓋其中一部分。請縮小範圍或新增篩選條件以取得精確數字。',
      unavailableTitle: '此伺服器尚未提供分析功能',
      unavailableBody: '此伺服器未公開執行分析端點。請升級伺服器以在此查看圖表。',
      emptyTitle: '此範圍內沒有執行',
      emptyBody: '沒有符合範圍與篩選條件的項目。請擴大範圍、清除篩選條件，或呼叫代理程式。',
      noDataInChart: '所選範圍內沒有此圖表的資料。',
      cards: {
        delegationWait: '平均委派等待時間',
        ttftExcludingDelegation: '平均 TTFT（不含委派）',
        runs: '執行',
        runsNote: '成功 {{succeeded}} 個，失敗 {{failed}} 個',
        successRate: '成功率',
        ttft: '平均第一個 Token 時間',
        execution: '平均執行時間',
        queue: '平均排隊時間',
        tokens: 'Token',
        tokensNote: '輸入 {{input}}，輸出 {{output}}',
        throughput: '平均輸出速度',
        cost: '成本',
        toolCalls: '工具呼叫次數',
        p95: 'P95：{{value}}'
      },
      charts: {
        outcomes: { title: '執行結果', help: '每個時間區間內依結束方式分類的執行數。' },
        ttft: { helpExcluding: '從 Harness 啟動到模型第一個輸出的時間，不含等待委派執行的時間。', title: '第一個 Token 時間', help: '從 Harness 啟動到模型第一次輸出，包含 CLI 啟動時間。' },
        duration: { title: '串流與執行時間', help: '串流時間是模型第一次到最後一次輸出的時間；執行時間是程序從啟動到結束的時間。' },
        queue: { title: '排隊時間', help: '從排入佇列到被工作節點租用的時間。' },
        tokens: { title: 'Token', help: '每個時間區間的輸入、輸出、快取與推理 Token。' },
        throughput: { title: '每秒輸出 Token 數', help: '輸出 Token 除以串流時間，並依時間區間取平均。' },
        cost: { title: '成本', help: '每個時間區間回報的成本（美元）。' },
        toolCalls: { title: '工具呼叫次數', help: '每個時間區間的工具呼叫事件數。' },
        usageTokens: { title: '依 Harness 與模型區分的 Token', help: '每個時間區間的輸入加輸出 Token，依 Harness 與模型堆疊。' },
        usageCost: { title: '依 Harness 與模型區分的成本', help: '每個時間區間回報的成本，依 Harness 與模型堆疊。' }
      },
      groupedTitle: '{{chart}}：{{metric}}',
      metrics: {
        delegationWaitMsAvg: '委派等待時間（平均）',
        timeToFirstTokenExcludingDelegationMsP95: '不含委派（p95）',
        timeToFirstTokenExcludingDelegationMsP50: '不含委派（p50）',
        timeToFirstTokenExcludingDelegationMsAvg: '不含委派（平均）',
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
        toolCalls: '工具呼叫次數',
        timeToFirstTokenMsAvg: '平均值',
        timeToFirstTokenMsP50: '中位數（P50）',
        timeToFirstTokenMsP95: 'P95 值',
        streamingMsAvg: '串流（平均）',
        executionMsAvg: '執行（平均）',
        executionMsP95: '執行（P95）',
        queueMsAvg: '平均排隊時間',
        outputTokensPerSecondAvg: '平均每秒 Token 數'
      },
      other: '其他',
      hiddenGroups_one: '未顯示 {{count}} 個較不活躍的群組。',
      hiddenGroups_other: '未顯示 {{count}} 個較不活躍的群組。',
      legend: '{{chart}} 中的數列',
      dataTable: '資料表',
      bucketStart: '區間開始'
    },
    serverInfo: {
      serverInUse: '目前使用的伺服器',
      title: '伺服器資訊',
      subtitle: '端點、版本，以及你目前登入的身分。',
      endpoints: '端點',
      rest: 'REST API',
      mcp: 'MCP',
      a2a: 'A2A',
      openapi: 'OpenAPI',
      server: '伺服器',
      version: '伺服器版本',
      dashboardVersion: '儀表板版本',
      node: '控制節點',
      database: '資料庫',
      health: '健康狀態',
      replicas: '預期副本數',
      routes: '已註冊的操作',
      serverTime: '伺服器時間',
      principal: '登入身分',
      principalName: '主體',
      principalType: '主體類型',
      role: '角色',
      tenant: '租用戶',
      expires: '工作階段到期',
      features: '功能旗標'
    },
    runGuard: {
      titles: {
        RepetitionDetected: '已停止：模型不斷重複',
        NoProgress: '已停止：執行不再有進展',
        OutputLimitExceeded: '已停止：回答達到大小上限'
      },
      bodies: {
        RepetitionDetected: '重複防護發現同一段短文字被反覆寫出（或只有空白和標點），因此 Garrison 停止了執行，而不是讓它一直執行到截止時間。',
        NoProgress: '超過無進展逾時時間仍沒有文字、思考或工具活動，因此 Garrison 停止了執行。',
        OutputLimitExceeded: '回答超過了每次執行允許的最大助理字元數，因此 Garrison 停止了執行。'
      },
      detected: '偵測到的情況：{{reason}}',
      partialKept: '停止前寫出的輸出（{{chars}} 個字元）已保留為執行結果。',
      noPartial: '執行在停止前沒有寫出任何輸出。',
      tune: '若要變更觸發條件，請編輯部署 {{deployment}}：其「排程放置與限制」步驟中有重複防護、最大助理字元數和無進展逾時。留空時，它們會依照設定（執行階段）中的叢集預設值。',
      tuneAny: '若要變更觸發條件，請編輯部署：其「排程放置與限制」步驟中有重複防護、最大助理字元數和無進展逾時。留空時，它們會依照設定（執行階段）中的叢集預設值。',
      openDeployments: '開啟部署',
      openSettings: '開啟設定'
    },
    conversationDetail: {
      title: '對話',
      notFoundTitle: '找不到對話',
      notFoundBody: '它可能已被刪除，或屬於另一個租用戶。它的各輪仍保留在「執行」頁面。',
      deployment: '部署',
      activeRun: '未完成的一輪',
      turns: '各輪',
      turnsCount: '各輪 ({{count}})',
      noTurns: '此對話還沒有任何一輪。',
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
      messagePlaceholder: '提出後續問題或給出下一個指示...',
      busyNotice: '上一輪仍在處理中。完成後即可傳送下一則訊息。',
      send: '傳送這一輪',
      turnStarted: '第 {{turn}} 輪已開始。',
      openInvoke: '在「呼叫」中繼續',
      confirmDelete: '要刪除對話「{{title}}」嗎？它的各輪會作為一般執行保留在「執行」頁面，但無法再有新的一輪繼續它。'
    }
  },
  wizard: {
    title: '設定 Garrison',
    stepOf: '第 {{step}} 步，共 {{total}} 步',
    steps: { welcome: '歡迎', secret: '憑證', manifest: '範例代理程式', invoke: '測試執行' },
    welcomeBody: '此租用戶尚無代理程式。只要幾個步驟，你就可以：',
    welcomeItem1: '儲存 Harness 憑證，例如 Anthropic 或 OpenAI API 金鑰（選用）。',
    welcomeItem2: '套用使用內建模擬 Harness 的範例代理程式，無需憑證即可運作。',
    welcomeItem3: '執行它並觀看對話紀錄。',
    start: '開始',
    skip: '略過設定',
    skipStep: '略過此步驟',
    secretBody: '新增你的實際代理程式所需的憑證。你可以略過此步驟，稍後再新增祕密。',
    saveSecret: '儲存並繼續',
    secretSaved: '祕密已儲存。',
    manifestBody: '此清單會建立一個 echo 代理程式，以及一個使用模擬 Harness 的部署。',
    invokeBody: '傳送訊息給 echo 代理程式。執行開始後，系統會帶你前往該執行。',
    invoke: '執行',
    noAgent: '找不到範例代理程式。請先套用清單。'
  },
  tour: {
    title: '導覽',
    skip: '略過導覽',
    done: '完成',
    steps: {
      sidebar: { title: '導覽列', body: '頁面依中心分組。每個中心在頁面頂端都有分頁，且每個分頁都有自己的連結。' },
      topbar: { title: '環境資訊', body: '伺服器、租用戶、你的身分、健康狀態與即時狀態會一直顯示在這裡。' },
      kpis: { title: '一覽', body: '每張卡片彙總一種資源。按一下卡片即可開啟篩選後的清單。' },
      invoke: { title: '呼叫', body: '以互動方式試用任何代理程式，並觀看其對話紀錄串流。' },
      configure: { title: '組態', body: 'Harness 設定檔、提示範本、MCP 伺服器與祕密精確控制執行的內容。代理程式與部署有各自的中心。' },
      observe: { title: '監控', body: '請求歷程、稽核與 API 探索器可協助你驗證與偵錯。' }
    }
  },
  tips,
  explainers
};


// Executor capability negotiation (P11.18).
Object.assign(zhHant.resources.deployments.fields, {"capIsolation": "最低隔離級別", "capColdStartClass": "啟動類別", "capEgressControl": "要求出站流量控制", "capFilesystemSnapshot": "要求檔案系統快照", "capSessionContinuation": "要求工作階段延續", "capCrossNodeRestore": "要求跨節點還原"});
Object.assign(zhHant.tips.resources.deployments, {"capIsolation": "執行會等待具備這些能力的工作節點。容器隔離請選擇 KubernetesJob。要求不可用的能力會使執行保持排隊。", "capColdStartClass": "執行會等待具備這些能力的工作節點。容器隔離請選擇 KubernetesJob。要求不可用的能力會使執行保持排隊。", "capEgressControl": "執行會等待具備這些能力的工作節點。容器隔離請選擇 KubernetesJob。要求不可用的能力會使執行保持排隊。", "capFilesystemSnapshot": "執行會等待具備這些能力的工作節點。容器隔離請選擇 KubernetesJob。要求不可用的能力會使執行保持排隊。", "capSessionContinuation": "執行會等待具備這些能力的工作節點。容器隔離請選擇 KubernetesJob。要求不可用的能力會使執行保持排隊。", "capCrossNodeRestore": "執行會等待具備這些能力的工作節點。容器隔離請選擇 KubernetesJob。要求不可用的能力會使執行保持排隊。"});
zhHant.resources.deployments.hints.capabilities = "執行會等待具備這些能力的工作節點。容器隔離請選擇 KubernetesJob。要求不可用的能力會使執行保持排隊。";
zhHant.resources.nodes.columns.executorCapabilities = "執行器能力";
zhHant.tips.resources.nodes.executorCapabilities = "執行會等待具備這些能力的工作節點。容器隔離請選擇 KubernetesJob。要求不可用的能力會使執行保持排隊。";
zhHant.enums.executorIsolation = {"Process": "程序", "Container": "容器", "SandboxedRuntime": "沙箱執行環境"};
zhHant.enums.executorColdStart = {"Immediate": "即時", "Cold": "冷啟動", "Warm": "預熱"};
// Artifact collection and browsing (P12.8).
zhHant.nav.items.artifacts = { label: "產物", tip: "從執行收集的檔案。" };
zhHant.resources.artifacts = { ...zhHant.resources.artifactStores, title: "產物", subtitle: "從執行收集的檔案。", view: "產物", deleteTitle: "產物", emptyTitle: "產物", emptyBody: "設定儲存和明確的部署比對模式以收集檔案。", columns: {"name": "名稱", "runId": "執行", "artifactStoreId": "儲存", "mediaType": "媒體類型", "sizeBytes": "位元組", "sha256": "SHA-256 雜湊", "createdUtc": "建立時間", "id": "ID", "leaseEpoch": "租約世代", "repairAttempt": "修復次數"}, fields: {"name": "名稱", "runId": "執行", "artifactStoreId": "儲存", "mediaType": "媒體類型", "sizeBytes": "位元組", "sha256": "SHA-256 雜湊", "createdUtc": "建立時間", "id": "ID", "leaseEpoch": "租約世代", "repairAttempt": "修復次數"}, actions: { download: "下載" } };
zhHant.tips.resources.artifacts = { ...{"name": "從執行收集的檔案。 名稱", "runId": "從執行收集的檔案。 執行", "artifactStoreId": "從執行收集的檔案。 儲存", "mediaType": "從執行收集的檔案。 媒體類型", "sizeBytes": "從執行收集的檔案。 位元組", "sha256": "從執行收集的檔案。 SHA-256", "createdUtc": "從執行收集的檔案。 建立時間", "id": "從執行收集的檔案。 ID", "leaseEpoch": "從執行收集的檔案。 租約世代", "repairAttempt": "從執行收集的檔案。 修復次數"}, actions: { download: "透過臨時連結下載此檔案。" }, filters: { runId: "執行", storeId: "儲存" } };
Object.assign(zhHant.resources.artifactStores.fields, {"pathPrefix": "路徑前綴", "bucket": "儲存桶", "endpoint": "端點", "region": "區域", "secretId": "憑證", "forcePathStyle": "路徑式請求"});
Object.assign(zhHant.tips.resources.artifactStores, {"pathPrefix": "S3 端點可選，留空使用 AWS。將包含 accessKey、secretKey 和可選 sessionToken 的 JSON 儲存為 GenericEnv 密鑰。未指定憑證時使用伺服器憑證鏈。", "bucket": "S3 端點可選，留空使用 AWS。將包含 accessKey、secretKey 和可選 sessionToken 的 JSON 儲存為 GenericEnv 密鑰。未指定憑證時使用伺服器憑證鏈。", "endpoint": "S3 端點可選，留空使用 AWS。將包含 accessKey、secretKey 和可選 sessionToken 的 JSON 儲存為 GenericEnv 密鑰。未指定憑證時使用伺服器憑證鏈。", "region": "S3 端點可選，留空使用 AWS。將包含 accessKey、secretKey 和可選 sessionToken 的 JSON 儲存為 GenericEnv 密鑰。未指定憑證時使用伺服器憑證鏈。", "secretId": "S3 端點可選，留空使用 AWS。將包含 accessKey、secretKey 和可選 sessionToken 的 JSON 儲存為 GenericEnv 密鑰。未指定憑證時使用伺服器憑證鏈。", "forcePathStyle": "S3 端點可選，留空使用 AWS。將包含 accessKey、secretKey 和可選 sessionToken 的 JSON 儲存為 GenericEnv 密鑰。未指定憑證時使用伺服器憑證鏈。"});
zhHant.resources.deployments.fields.artifactGlobs = "收集比對模式";
zhHant.tips.resources.deployments.artifactGlobs = "僅收集相符的工作區相對檔案，例如 reports/**/*.json。留空則停用收集。";
zhHant.resources.deployments.hints.artifactGlobs = "僅收集相符的工作區相對檔案，例如 reports/**/*.json。留空則停用收集。";
Object.assign(zhHant.common.eventCodes, { ArtifactCollectionWarning: "產物收集警告", ArtifactsCollected: "已收集產物" });
zhHant.tips.nav.tabs.artifacts = zhHant.nav.items.artifacts.tip + " " + zhHant.tips.resources.artifacts.actions.download;
Object.assign(zhHant.components.mcpTest, {"worker": "工作節點", "chooseWorker": "選擇就緒的工作節點。設定的命令會在該節點列出工具，不會呼叫工具。", "runTest": "執行測試"});
export default zhHant;

zhHant.views.settings.groups.Leases = "協調租約";
zhHant.views.settings.fields.Leases = {"Provider": "提供方", "ClutchEndpoint": "Clutch 端點", "ClutchAccessKey": "Clutch 存取金鑰", "KeyPrefix": "鍵前綴", "RequestTimeoutMs": "請求逾時 (ms)", "SweepIntervalMs": "檢查間隔 (ms)", "MaxLeaseMs": "最長租約 (ms)", "MaxHoldMs": "最長持有時間 (ms)"};

zhHant.enums.harnessType.ProviderApi = "提供方 API";
zhHant.enums.outputParser.ProviderApiJsonl = "提供方 API JSONL";
zhHant.enums.harnessType.OpenCode = "opencode";
zhHant.enums.harnessType.Pi = "pi";
zhHant.enums.outputParser.OpenCodeJsonl = "opencode JSONL";
zhHant.enums.outputParser.PiJsonl = "pi JSONL";
zhHant.enums.mcpConfigFormat.OpenCodeJson = "opencode JSON";
zhHant.enums.mcpConfigFormat.PiJson = "pi JSON";

// Pipelines (P12.9): definitions (Agents > Pipelines), pipeline runs (Runs > Pipeline runs), and stage reviews
// (Approvals > Stage reviews).
zhHant.nav.hubs.approvals.tip = '等候人員處理的工具呼叫與管線階段，以及每一項決定';
Object.assign(zhHant.nav, { approvalsPending_one: '{{count}} 個項目等候人員處理', approvalsPending_other: '{{count}} 個項目等候人員處理' });
Object.assign(zhHant.nav.items, {
  pipelines: { label: '管線', tip: '依序排列的代理程式階段，可選擇加上審查關卡' },
  pipelineRuns: { label: '管線執行', tip: '管線的每次執行，逐一階段呈現' },
  pipelineReviews: { label: '階段審查', tip: '等候人員審查的管線階段' }
});
Object.assign(zhHant.errorCodes, {
  RevisionLimitReached: '此階段已用完所有修訂次數，因此無法再要求變更。請改為核准或拒絕。',
  ReviewNotPending: '此審查已由其他人或因逾時而決定，因此無法再次決定。',
  PipelineInUse: '此管線仍有未完成的管線執行。請等候它們結束或將其取消，然後再刪除管線。',
  PipelineRunActive: '只能刪除已結束的管線執行。請先取消此管線執行。',
  PipelineRunFinished: '此管線執行已經結束，因此無法取消。',
  PipelineRunNotRetryable: '只有失敗、逾時或已取消的管線執行可以重試。',
  PipelineRunChanged: '處理請求期間此管線執行已變更。請重新載入後再試一次。',
  PipelineInactive: '此管線未啟用。請先開啟再啟動它。',
  PipelineEmpty: '管線至少需要一個階段。',
  PipelineStageRun: '此執行是管線執行的一個階段，因此無法單獨重試。請改為重試管線執行。',
  ReferencedByPipeline: '有管線階段使用此代理程式。請先從每個管線移除此代理程式，再將其刪除。'
});
zhHant.enums.pipelineRunStatus = { Running: '執行中', AwaitingReview: '等候審查', Cancelling: '取消中', Succeeded: '成功', Failed: '失敗', Cancelled: '已取消', TimedOut: '逾時' };
zhHant.enums.pipelineRunOutcome = { None: '無', Succeeded: '成功', StageFailed: '階段失敗', StageStartFailed: '階段無法啟動', ReviewRejected: '審查遭拒絕', ReviewExpired: '審查已過期', Cancelled: '已取消', TimedOut: '逾時', InternalError: '內部錯誤' };
zhHant.enums.pipelineStageStatus = { Pending: '待處理', Running: '執行中', AwaitingReview: '等候審查', Succeeded: '成功', Failed: '失敗', Cancelled: '已取消' };
zhHant.enums.pipelineReviewStatus = { Pending: '待處理', Approved: '已核准', ChangesRequested: '已要求變更', Rejected: '已拒絕', Expired: '已過期', Cancelled: '已取消' };
zhHant.enums.pipelineReviewDecision = { Approve: '核准', RequestChanges: '要求變更', Reject: '拒絕' };
zhHant.enums.pipelineReviewSource = { User: '人員', Timeout: '逾時', Cancelled: '管線執行已停止' };
Object.assign(zhHant.enums.resourceType, { Pipeline: '管線', PipelineRun: '管線執行' });
Object.assign(zhHant.enums.auditEventType, { PipelineReviewDecided: '已決定階段審查', PipelineRunCancelled: '管線執行已取消' });
zhHant.resources.deployments.promptRoles.PipelineStage = '管線階段（交接）';
Object.assign(zhHant.resources.runs.columns, { pipelineRunId: '管線執行' });
zhHant.resources.runs.pipelineStage = '第 {{position}} 階段，第 {{execution}} 次執行';
zhHant.resources.pipelines = {
  ...rp('管線', '依序排列的代理程式階段：每個階段執行一個代理程式並將輸出交給下一個階段，可選擇加上審查關卡。', '新增管線', '建立管線', '編輯管線', '管線詳細資料', '刪除管線', '尚無管線', '建立管線以串連代理程式：每個階段都會收到前一個階段的輸出。'),
  columns: { name: '名稱', stages: '階段', reviewGates: '審查關卡', maxDurationSeconds: '時間限制', version: '版本', active: '啟用', description: '描述', id: 'ID', lastUpdateUtc: '更新時間', createdUtc: '建立時間' },
  fields: {
    name: '名稱',
    description: '描述',
    maxDurationSeconds: '時間限制（秒）',
    active: '啟用',
    stages: '階段',
    stageName: '階段名稱',
    agentId: '代理程式',
    deploymentId: '部署',
    handoffTemplateId: '交接範本',
    handoffTemplateVersion: '固定的範本版本',
    outputCharLimit: '交接字元上限',
    maxAttempts: '最多嘗試次數',
    continueOnFailure: '失敗時繼續',
    requiresReview: '需要審查',
    reviewTimeoutSeconds: '審查逾時（秒）',
    reviewTimeoutAction: '審查逾時時',
    maxRevisions: '最多修訂次數',
    stageDescription: '階段描述',
    parameters: '執行參數'
  },
  hints: {
    maxDurationSeconds: '介於 {{min}} 到 {{max}}。0 表示沒有限制。此限制涵蓋整個管線執行，包括等候審查的時間。',
    stages: '階段依此順序執行。每個階段會在前一個階段成功（或在「失敗時繼續」下失敗）後開始；若前一個階段需要審查，則在人員核准後開始。',
    noDeployments: '此代理程式尚無部署。請將部署留空，或在「部署」下新增一個。',
    handoffTemplateVersion: '留空則使用範本的目前版本。',
    outputCharLimit: '介於 {{min}} 到 {{max}}。預設為 {{default}}。',
    maxAttempts: '介於 {{min}} 到 {{max}}。預設為 {{default}}。',
    reviewTimeoutSeconds: '介於 {{min}} 到 {{max}}。0 表示無限期等候。',
    maxRevisions: '介於 {{min}} 到 {{max}}。預設為 {{default}}。',
    parameters: '僅在指定部署時可用，且只能使用該部署允許呼叫端覆寫的參數。'
  },
  errors: {
    dnsName: '請使用 1 到 64 個小寫字母、數字與連字號，且開頭與結尾須為字母或數字。',
    range: '請輸入 {{min}} 到 {{max}} 之間的整數。',
    noStages: '請至少新增一個階段。',
    tooManyStages: '管線最多只能有 {{max}} 個階段。',
    stageNameLong: '階段名稱最多 128 個字元。',
    stageNameDuplicate: '已有另一個階段名為 {{name}}。',
    version: '請輸入 1 以上的版本號碼，或將其留空。',
    parametersNeedDeployment: '執行參數需要指定部署，因為系統會依該部署允許的覆寫項目進行檢查。',
    parametersUnique: '每個參數名稱只能出現一次。',
    stageInvalid: '此階段有錯誤。'
  },
  actions: { start: '啟動', preview: '預覽提示', runs: '檢視管線執行' },
  stageHeading: '第 {{position}} 階段：{{name}}',
  stageCount: '{{count}} 個，最多 {{max}} 個',
  stageSummary: '{{count}} 個階段：{{chain}}',
  addStage: '新增階段',
  removeStage: '移除階段',
  noStages: '尚無階段。',
  chooseAgent: '選擇代理程式',
  anyDeployment: '任一啟用的部署（依權重）',
  defaultHandoff: '部署繫結或內建範本',
  parameterName: '參數',
  parameterValue: '值',
  noLimit: '無限制',
  versionNotice: '版本 {{version}}。儲存會建立新版本；已開始的管線執行會保留開始時的階段。'
};
zhHant.resources.pipelineRuns = {
  ...rp('管線執行', '管線的每次執行。開啟一筆即可追蹤其階段、決定其審查，或取消並重試。', '新增管線執行', '建立管線執行', '編輯管線執行', '管線執行詳細資料', '刪除管線執行', '尚無管線執行', '從「代理程式 > 管線」啟動管線，即可在這裡看到其執行。'),
  columns: { id: 'ID', pipelineName: '管線', status: '狀態', outcome: '結果', progress: '階段', callerName: '啟動者', errorMessage: '錯誤', priority: '優先順序', deadlineUtc: '截止時間', completedUtc: '完成時間', createdUtc: '建立時間' },
  actions: { cancel: '取消', retry: '重試', stageRuns: '檢視階段執行', finalRun: '開啟最終執行' },
  toasts: { cancelRequested: '已要求取消管線執行及其目前階段。', retried: '管線執行會從停止的階段繼續。' },
  progressValue: '第 {{position}} / {{count}} 個',
  versionShort: '（版本 {{version}}）'
};
zhHant.resources.pipelineReviews = {
  ...rp('階段審查', '等候人員核准、要求變更或拒絕的管線階段。', '新增階段審查', '建立階段審查', '編輯階段審查', '階段審查詳細資料', '刪除階段審查', '尚無階段審查', '需要審查的階段完成後會顯示在這裡。'),
  columns: { createdUtc: '要求時間', pipelineName: '管線', stageName: '階段', status: '狀態', decision: '決定', decisionSource: '決定方式', comment: '意見', decidedBy: '審查者', expiresUtc: '逾時時間', pipelineRunId: '管線執行', runId: '階段執行', decidedUtc: '決定時間', id: 'ID' },
  filters: { pipelineRunId: '管線執行 ID', pipelineRunIdPlaceholder: '管線執行 ID（plr_...）' },
  actions: { approve: '核准', requestChanges: '要求變更', reject: '拒絕', openStageRun: '開啟階段執行' },
  noTimeout: '無限期等候'
};
zhHant.components.pipelineReviews = {
  decideTitle: '審查 {{pipeline}} 的階段 {{stage}}',
  decision: '決定',
  positionExecution: '第 {{position}} 階段，第 {{execution}} 次執行',
  revisionsLeft: '剩餘修訂次數',
  revisionsLeftValue: '{{left}} / {{max}}',
  noRevisionsLeft: '此階段已用完全部 {{max}} 次修訂。伺服器會拒絕「要求變更」；請改為核准或拒絕。',
  timeoutThen: '然後{{decision}}',
  commentApprove: '給下一個階段的備註',
  commentApprovePlaceholder: '選填。下一個階段會連同輸出一起收到這些備註。',
  commentRequestChanges: '需要變更的內容',
  commentRequestChangesPlaceholder: '必填。此階段會依據這些意見重新執行。',
  commentReject: '原因',
  commentRejectPlaceholder: '選填。會與決定一併記錄；管線執行將會失敗。',
  commentRequired: '請描述需要變更的內容。此階段會依據這些意見重新執行。',
  commentTooLong: '意見最多 {{max}} 個字元。',
  submit: { Approve: '核准階段', RequestChanges: '要求變更', Reject: '拒絕階段' },
  toasts: {
    Approve: '已核准 {{pipeline}} 的階段 {{stage}}。',
    RequestChanges: '已要求變更 {{pipeline}} 的階段 {{stage}}；它會依據你的意見重新執行。',
    Reject: '已拒絕 {{pipeline}} 的階段 {{stage}}；管線執行將會失敗。',
    notPending: '此審查已由其他人或因逾時而決定。清單現在會顯示目前狀態。',
    revisionLimit: '此階段已用完所有修訂次數（最多 {{max}} 次），因此無法再要求變更。請改為核准或拒絕。'
  }
};
zhHant.components.pipelineStart = {
  title: '啟動 {{name}}',
  intro_one: '輸入會交給此管線唯一的階段。',
  intro_other: '輸入會交給 {{count}} 個階段中的第一個；每個階段也會將其視為原始任務。',
  input: '輸入',
  inputPlaceholder: '要讓管線處理什麼？',
  shortcut: '按 Ctrl+Enter 或 Cmd+Enter 即可啟動。',
  submit: '啟動管線',
  starting: '啟動中...',
  started: '已啟動 {{name}}。'
};
zhHant.components.pipelinePreview = {
  title: '預覽 {{name}} 的提示',
  input: '範例輸入',
  sampleInput: '彙整未解決的問題，並為最緊急的問題提出修正方案。',
  sampleOutput: '{{stage}} 的範例輸出。',
  outputOf: '第 {{position}} 階段（{{stage}}）的範例輸出',
  render: '轉譯提示',
  rendering: '轉譯中...',
  stageHeading: '第 {{position}} 階段：{{stage}}（{{agent}}）',
  deployment: '部署：{{deployment}}',
  rendered: '已轉譯',
  failed: '失敗'
};
zhHant.views.pipelineRunDetail = {
  title: '管線執行',
  heading: '{{pipeline}} 的管線執行',
  notFoundTitle: '找不到管線執行',
  notFoundBody: '它可能已被刪除，或屬於其他租用戶。',
  live: '即時',
  polling: '重新整理中',
  finalRun: '最終執行',
  started: '開始時間',
  input: '輸入',
  reviewTitle: '等候你的審查',
  reviewBody: '第 {{position}} 階段（{{stage}}）已完成第 {{execution}} 次執行，正在等候審查。請在階段執行中閱讀其輸出：',
  reviewExpires: '若在 {{time}} 前無人決定，審查會自動決定為：{{decision}}。',
  reviewNoTimeout: '審查會一直等候到人員決定，除非管線的時間限制先結束了執行。',
  stages: '階段',
  stagesCount_one: '{{count}} 個階段',
  stagesCount_other: '{{count}} 個階段',
  noStages: '此管線執行沒有階段。',
  current: '目前',
  reviewGate: '審查關卡',
  agent: '代理程式 {{agent}}',
  counts: '執行 {{executions}} 次，嘗試 {{attempts}} / {{maxAttempts}} 次，修訂 {{revisions}} / {{maxRevisions}} 次',
  startedAt: '開始於',
  blocked: '等候啟動：{{reason}}。',
  nextAttempt: '下次嘗試時間：{{time}}。',
  reviewItem: '第 {{execution}} 次執行的審查',
  columns: { execution: '執行次序', run: '階段執行', status: '狀態', outcome: '結果', error: '錯誤', created: '建立時間' },
  confirmCancelTitle: '取消管線執行',
  confirmCancel: '要取消 {{pipeline}} 的這個管線執行嗎？其目前的階段執行會被取消，待處理的審查會被關閉。你之後可以重試。',
  confirmDelete: '要刪除 {{pipeline}} 的這個管線執行及其審查嗎？其階段執行會保留在「執行」頁面。'
};
Object.assign(zhHant.views.runDetail, { pipelineRun: '管線執行' });
zhHant.views.settings.fields.Runtime.PipelineSweepIntervalMs = '管線巡檢間隔（毫秒）';
zhHant.views.settings.fields.Runtime.PipelineMaxStages = '每個管線的最多階段數';

// Deployment trust level (P11.14).
zhHant.enums.trustLevel = { Trusted: "可信任", Untrusted: "不可信任" };
zhHant.enums.runBlockedReason.NoIsolatingWorker = "沒有可隔離的工作節點";
zhHant.components.blocked.reasons.NoIsolatingWorker = "這個執行不可信任，需要容器隔離，但沒有能執行 {{harness}} 的就緒工作節點提供此隔離。請在允許建立 Job 的叢集中加入使用 Kubernetes Job 執行器的工作節點。";
zhHant.tips.enums.runBlockedReason.NoIsolatingWorker = "受阻：這個不可信任的執行需要容器隔離，但沒有具備此 Harness 的就緒工作節點提供此隔離。它會在佇列中等待，直到使用 Kubernetes Job 執行器的工作節點註冊。";
zhHant.tips.enums.trustLevel = { Trusted: "輸入只來自可信任的呼叫者。執行可以使用 Process 執行器，但它與其他執行及工作節點之間沒有隔離。", Untrusted: "輸入可能來自不可信任的來源。執行只會交給具有容器隔離或更強隔離的執行器，沒有可用執行器時會在佇列中等待。" };
Object.assign(zhHant.common.fieldCodes, { TenantRequiresUntrusted: "這個租用戶要求每個部署都是不可信任。", UntrustedNeedsIsolation: "不可信任的部署不能使用 Process 執行器。請選擇 Kubernetes Job，或將執行器留空。" });
zhHant.resources.deployments.fields.trustLevel = "信任等級";
zhHant.resources.deployments.columns.trustLevel = "信任等級";
zhHant.resources.deployments.hints.trustLevel = "當呼叫者或內容可能不可信任時，請選擇不可信任。這類執行需要容器隔離：執行器留空即代表 Kubernetes Job，執行會等待能隔離它們的工作節點。";
zhHant.tips.resources.deployments.trustLevel = "可信任允許使用沒有隔離的 Process 執行器。不可信任只會在具有容器隔離或更強隔離的執行器上執行。";
zhHant.tips.resources.deployments.trustFlagged = "這個租用戶要求不可信任的部署。這個部署在啟用政策之前是可信任：它會依目前設定繼續執行，但下次儲存時必須改為不可信任。";
zhHant.resources.deployments.trust = { tenantRequiresUntrusted: "這個租用戶要求不可信任的部署。請將信任等級改為不可信任後再儲存這個部署。", untrustedProcess: "不可信任的部署不能使用 Process 執行器。請選擇 Kubernetes Job，或將執行器留空。", flagged: "可信任，但政策要求不可信任" };
zhHant.resources.tenants.fields.requireUntrustedDeployments = "要求部署為不可信任";
zhHant.resources.tenants.columns.requireUntrustedDeployments = "要求不可信任";
zhHant.resources.tenants.hints = { ...(zhHant.resources.tenants.hints || {}), requireUntrustedDeployments: "建立或儲存可信任的部署會被拒絕。現有的可信任部署會繼續執行，並會一直被標示，直到儲存為不可信任。" };
zhHant.tips.resources.tenants.requireUntrustedDeployments = "開啟後，這個租用戶的每個部署都必須是不可信任，這樣其執行只會交給有隔離的執行器。";
zhHant.views.runDetail.trustLevel = "信任等級";
zhHant.tips.views.runDetail.trustLevel = "這個執行進入佇列時部署的信任等級。不可信任的執行只會交給具有容器隔離或更強隔離的執行器。";

// Deployment effect policy (P12.29).
zhHant.enums.effectPolicy = { AtMostOnce: "至多一次", AtLeastOnce: "至少一次", Journaled: "日誌模式" };
zhHant.tips.enums.effectPolicy = { AtMostOnce: "如果執行開始後 worker 遺失，執行會以節點遺失失敗，且不會再次啟動。任何外部作用都不會發生兩次。這是預設值。", AtLeastOnce: "如果執行開始後 worker 遺失，只要還有剩餘嘗試次數，執行就會回到佇列。遺失的那次嘗試已經產生的作用 (例如 push 或訊息) 可能再次發生。", Journaled: "只有當所有作用都經過作用日誌時才重新排入佇列。日誌尚未提供，因此目前的行為與至多一次相同。" };
Object.assign(zhHant.common.fieldCodes, { EffectPolicyConflict: "作用策略與已棄用的 retryOnNodeLoss 值不一致。請只傳送作用策略。" });
zhHant.resources.deployments.fields.effectPolicy = "作用策略";
zhHant.resources.deployments.columns.effectPolicy = "作用策略";
zhHant.resources.deployments.hints.effectPolicy = "至多一次 (預設) 會讓 worker 遺失的已啟動執行以節點遺失失敗。至少一次會在還有嘗試次數時重新排入佇列，作用可能重複。日誌模式在作用日誌出現之前與至多一次相同。從未啟動的執行一律會重新排入佇列。";
zhHant.tips.resources.deployments.effectPolicy = "worker 遺失時如何處理已啟動的執行: 使其失敗 (至多一次)、重新排入佇列 (至少一次)，或日誌模式，目前與至多一次相同。";
zhHant.views.runDetail.effectPolicy = "作用策略";
zhHant.tips.views.runDetail.effectPolicy = "此執行進入佇列時部署的作用策略。它決定執行的 worker 遺失時如何處理；之後對部署的修改不會影響此執行。";
zhHant.views.settings.fields.Scheduling.QueueWakeFanout = "每個副本喚醒的輪詢數";
zhHant.views.settings.fields.Scheduling.RemoteWakeDelayMs = "遠端喚醒暫緩時間 (ms)";
zhHant.views.settings.fields.Auth.CacheSeconds = "認證快取有效期 (秒)";

// Deployment egress allowlists (P11.15).
zhHant.resources.deployments.fields.egressRules = "出站允許清單";
zhHant.resources.deployments.fields.egressCidr = "CIDR 位址區塊";
zhHant.resources.deployments.fields.egressPort = "目的連接埠";
zhHant.resources.deployments.fields.egressProtocol = "通訊協定";
zhHant.resources.deployments.columns.egressRules = "出站";
zhHant.resources.deployments.hints.egressRules = "留空則使用叢集預設的執行出站規則 (允許 HTTPS 連到任何位址)。設定規則後，執行 Pod 只能連到 DNS、Garrison MCP 連接埠和這些位址區塊，且執行需要能強制執行規則的 Kubernetes worker。請輸入 CIDR 位址區塊而非主機名稱；請自行將名稱解析為位址。連接埠留空表示允許所有連接埠。最多 64 條規則。";
zhHant.resources.deployments.egress = {"add": "新增出站規則", "allPorts": "所有連接埠", "default": "預設", "count_one": "允許清單，{{count}} 條規則", "count_other": "允許清單，{{count}} 條規則", "note_one": "這個部署有 {{count}} 條出站規則。它的執行只會在啟用出站允許清單的 Kubernetes worker 上進行，執行所在 Pod 的 NetworkPolicy 只允許 DNS、Garrison MCP 連接埠和這些規則。沒有這樣的 worker 就緒時，執行會在佇列中等待 (沒有可隔離的工作節點)；絕不會在沒有允許清單的情況下執行。", "note_other": "這個部署有 {{count}} 條出站規則。它的執行只會在啟用出站允許清單的 Kubernetes worker 上進行，執行所在 Pod 的 NetworkPolicy 只允許 DNS、Garrison MCP 連接埠和這些規則。沒有這樣的 worker 就緒時，執行會在佇列中等待 (沒有可隔離的工作節點)；絕不會在沒有允許清單的情況下執行。", "errors": {"cidrRequired": "請輸入 CIDR 位址區塊，例如 203.0.113.0/24。", "cidrFormat": "請使用含前置長度的 CIDR 表示法，例如 198.51.100.7/32。不接受主機名稱。", "cidrAddress": "這個位址不是有效的 IPv4 或 IPv6 位址。", "cidrPrefix": "前置長度超出範圍 (IPv4 為 0 到 32，IPv6 為 0 到 128)。", "cidrMapped": "不允許使用 IPv4 對應的 IPv6 位址；請改為輸入 IPv4 位址區塊。", "cidrHostBits": "這個位址在前置長度之後有設定的位元；請使用位址區塊的網路位址。"}};
Object.assign(zhHant.common.fieldCodes, {"InvalidCidr": "CIDR 位址區塊無效。", "PortOutOfRange": "連接埠必須介於 1 到 65535，或留空表示所有連接埠。", "InvalidProtocol": "不明的通訊協定；請使用 TCP 或 UDP。", "TooManyEgressRules": "一個部署最多可以有 64 條出站規則。", "EgressRulesNeedKubernetesJob": "出站規則只對 Kubernetes Job 執行強制執行。請選擇 Kubernetes Job，或將執行器留空。", "EgressRulesNeedColdStart": "出站規則需要冷啟動，因為預熱 Pod 已經在預設出站規則下執行。請清空啟動類別或選擇冷啟動。"});
zhHant.components.blocked.reasons.NoIsolatingWorkerEgress = "這個執行的部署有出站允許清單，只有啟用出站允許清單的 Kubernetes worker 才能強制執行，而能執行 {{harness}} 的就緒 worker 都不提供這項能力。執行會在佇列中等待，絕不會在沒有允許清單的情況下執行。請在網路外掛會強制執行 NetworkPolicy 的叢集中，為 Kubernetes Job worker 啟用出站允許清單。";
zhHant.tips.enums.runBlockedReason.NoIsolatingWorker = "已封鎖：這個執行需要可隔離的 worker (不可信任的執行需要容器隔離，含出站允許清單的部署需要出站控制)，而具備其 harness 的就緒 worker 都不提供。它會在佇列中等待，直到合適的 Kubernetes Job worker 註冊。";
zhHant.tips.resources.deployments.egressRules = "這個部署的執行 Pod 可以連到的目的地，以 CIDR 位址區塊表示，可選連接埠和通訊協定。留空則使用預設的執行出站規則。";
zhHant.tips.resources.deployments.egressRulesItems = {"cidr": "CIDR 表示法的目的位址區塊，IPv4 或 IPv6，例如 203.0.113.0/24。請自行將主機名稱解析為位址。", "port": "1 到 65535 之間的目的連接埠。留空則允許該位址區塊的所有連接埠。", "protocol": "大多數服務使用 TCP，或選擇 UDP。"};
zhHant.tips.resources.deployments.egressDefault = "沒有出站允許清單：執行 Pod 使用叢集預設的執行出站規則。";

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
})(zhHant, {
 "nav": {
  "items": {
   "triggers": {
    "label": "觸發器",
    "tip": "啟動執行的 cron 排程與簽章 Webhook"
   },
   "notifications": {
    "label": "通知",
    "tip": "關於執行、管線與核准的簽章 Webhook"
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
   "Skipped": "已略過"
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
   "Succeeded": "已送達",
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
  "ReferencedByTrigger": "有觸發器正在使用這筆記錄。請先修改或刪除該觸發器。",
  "ReferencedByNotificationEndpoint": "有通知端點依這筆記錄篩選。請先修改或刪除該端點。",
  "NotAWebhookTrigger": "只有 Webhook 觸發器才有簽章密鑰。",
  "TriggerInactive": "這個觸發器未啟用。",
  "InvalidSignature": "Webhook 簽章遺失、格式錯誤、過期或不相符。",
  "PayloadTooLarge": "酬載超過伺服器可接受的大小。"
 },
 "common": {
  "fieldCodes": {
   "InvalidUrl": "請輸入不含使用者名稱和密碼的絕對 HTTP 或 HTTPS URL。",
   "DestinationBlocked": "伺服器拒絕此目的地：除非維運人員允許私人目的地，否則迴路、私人、連結本機與中繼資料位址都會遭到封鎖。",
   "EventsRequired": "請至少選擇一個事件。",
   "InvalidEvent": "其中有不支援的事件。",
   "InvalidCron": "cron 運算式無效。請使用五個欄位：分、時、日、月、星期。",
   "InvalidTimeZone": "不明的時區。請使用 UTC 或 Asia/Taipei 等 IANA 名稱。",
   "TypeImmutable": "觸發器類型無法變更。請改為建立新的觸發器。",
   "TargetMismatch": "此欄位不屬於所選的目標。",
   "PayloadTooLarge": "酬載超過伺服器可接受的大小。"
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
   "subtitle": "啟動代理程式執行或管線執行的 cron 排程與簽章 Webhook。",
   "add": "新增觸發器",
   "create": "建立觸發器",
   "edit": "編輯觸發器",
   "view": "觸發器詳細資料",
   "deleteTitle": "刪除觸發器",
   "emptyTitle": "尚無觸發器",
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
    "type": "建立後無法變更類型。",
    "inputTemplateId": "以 trigger.* 與 webhook.* 變數產生執行輸入的 Task 範本。留白則使用內建的 trigger-input 範本。",
    "priority": "{{min}} 到 {{max}}。數值越大越先執行。",
    "cronExpression": "五個欄位：分、時、日、月、星期。範例：0 9 * * 1-5 表示平日 09:00 執行。",
    "timeZone": "UTC 或 Asia/Taipei 等 IANA 名稱。日光節約時間的切換會自動處理。",
    "webhookNew": "儲存後會顯示 Webhook 網址與簽章密鑰。密鑰只會顯示一次。"
   },
   "errors": {
    "name": "請使用 1 到 64 個小寫字母、數字和連字號，並以字母或數字開頭與結尾。",
    "description": "說明最多 {{max}} 個字元。",
    "agentRequired": "請選擇此觸發器要執行的代理程式。",
    "pipelineRequired": "請選擇此觸發器要啟動的管線。",
    "cron": "請輸入五個欄位（分 時 日 月 星期）或 @daily 等巨集。",
    "priority": "請輸入 {{min}} 到 {{max}} 之間的整數。"
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
    "started": "已啟動的執行",
    "deliveryId": "傳遞 ID",
    "error": "錯誤",
    "runId": "執行",
    "pipelineRunId": "管線執行"
   },
   "confirmRotateTitle": "輪替簽章密鑰",
   "confirmRotate": "要取代 {{name}} 的簽章密鑰嗎？舊密鑰會立即失效，傳送端必須改用新密鑰。",
   "anyDeployment": "任何啟用中的部署（依權重）",
   "builtinTemplate": "內建 trigger-input 範本",
   "webhookSchedule": "收到簽章 Webhook 時",
   "neverFired": "尚未觸發",
   "runAsNotice": "以 {{name}} 的身分執行。儲存變更後，此觸發器會以您的身分執行。",
   "secretEnding": "目前的密鑰結尾為 {{last4}}。"
  },
  "notifications": {
   "title": "通知",
   "subtitle": "在執行與管線結束或核准等待時接收簽章通知的 Webhook 端點。",
   "add": "新增端點",
   "create": "建立通知端點",
   "edit": "編輯通知端點",
   "view": "通知端點詳細資料",
   "deleteTitle": "刪除通知端點",
   "emptyTitle": "尚無通知端點",
   "emptyBody": "新增端點，在執行失敗、管線結束或核准等待時接收簽章的 HTTP POST。",
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
    "url": "HTTP 或 HTTPS URL。除非維運人員允許私人目的地，否則迴路、私人與中繼資料位址會遭拒，且不跟隨重新導向。",
    "events": "設定代理程式或部署篩選時，不會傳送管線事件。",
    "agentId": "留白則傳送所有代理程式的事件。",
    "deploymentId": "留白則傳送所有部署的事件。",
    "includeResultText": "預設關閉：通知包含識別碼、狀態和時間戳記，但不含執行輸出。",
    "resultTextMaxChars": "{{min}} 到 {{max}}。預設 {{default}}。"
   },
   "errors": {
    "name": "請使用 1 到 64 個小寫字母、數字和連字號，並以字母或數字開頭與結尾。",
    "url": "請輸入不含使用者名稱和密碼的絕對 HTTP 或 HTTPS URL。",
    "events": "請至少選擇一個事件。",
    "resultTextMaxChars": "請輸入 {{min}} 到 {{max}} 之間的整數。"
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
   "confirmRotate": "要取代 {{name}} 的簽章密鑰嗎？之後的通知（包括已排入佇列的重試）都會以新密鑰簽章。",
   "anyAgent": "所有代理程式",
   "anyDeployment": "所有部署",
   "noFilter": "全部",
   "eventCount_one": "{{count}} 個事件",
   "eventCount_other": "{{count}} 個事件",
   "resultTextUpTo_one": "最多 {{count}} 個字元",
   "resultTextUpTo_other": "最多 {{count}} 個字元",
   "secretNotice": "通知以結尾為 {{last4}} 的密鑰簽章，設定於 {{time}}。輪替即可取得新密鑰。"
  }
 },
 "components": {
  "signingSecret": {
   "title": "簽章密鑰",
   "warning": "請立即複製這個密鑰。Garrison 會加密儲存且不會再次顯示；遺失時請輪替。",
   "secret": "密鑰",
   "url": "Webhook 網址",
   "done": "我已儲存",
   "scheme": "以標頭 {{header}} 為每個要求簽章：{{format}}。傳送 {{delivery}} 可讓重複的傳遞只算一次。"
  },
  "triggerFire": {
   "title": "觸發 {{name}}",
   "intro": "立即啟動這個觸發器。酬載為選填；輸入範本會以 webhook.body 讀取。",
   "body": "酬載",
   "contentType": "酬載內容類型",
   "submit": "觸發",
   "firing": "觸發中..."
  },
  "triggerFires": {
   "title": "觸發紀錄",
   "count_one": "共 {{count}} 次觸發，顯示 {{shown}} 次",
   "count_other": "共 {{count}} 次觸發，顯示 {{shown}} 次",
   "empty": "這個觸發器尚未觸發。",
   "scheduled": "對應 {{time}}"
  },
  "notificationDeliveries": {
   "title": "傳遞紀錄",
   "count_one": "共 {{count}} 次傳遞，顯示 {{shown}} 次",
   "count_other": "共 {{count}} 次傳遞，顯示 {{shown}} 次",
   "empty": "尚未傳送任何內容到這個端點。",
   "detail": "所選的傳遞"
  },
  "notificationTest": {
   "title": "測試通知",
   "sending": "正在傳送測試通知...",
   "succeeded": "端點已接受測試通知。",
   "failed": "測試通知失敗，且不會重試。請查看下方錯誤。",
   "pending": "第一次嘗試失敗；Garrison 會重試。請查看下方錯誤。"
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
     "AllowPrivateDestinations": "允許私人目的地",
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
Object.assign(zhHant.common.fieldCodes, {"SecretUseDenied": "你沒有使用此祕密的權限。請申請此祕密的 SecretUser 或 SecretManager 角色。", "GrantCeiling": "你只能授予自己擁有的權限。", "ReservedRoleName": "這是內建角色的名稱。請選擇其他名稱。"});
zhHant.components.mcpTest.noWorkers = "沒有就緒的工作節點提供 stdio 診斷。指令會在工作節點主機上、執行隔離之外執行，因此只有營運人員在工作節點上設定 GARRISON_WORKER_MCP_TESTS_ENABLED=true 時才會執行。";

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
})(zhHant, {
 "components": {
  "transcriptExport": {
   "label": "匯出對話記錄",
   "exporting": "正在匯出...",
   "markdown": "Markdown 文件 (.md)",
   "json": "JSON (.json)",
   "includeThinking": "包含思考過程",
   "failed": "匯出對話記錄失敗：{{message}}"
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "結構化輸入",
    "modeLabel": "輸入編輯器",
    "modeForm": "表單",
    "modeJson": "原始 JSON",
    "required": "必填",
    "choose": "選擇一個值",
    "addItem": "新增項目",
    "removeItem": "移除項目",
    "jsonLabel": "輸入 JSON",
    "jsonPlaceholder": "JSON 值",
    "unsupported": "此輸入結構描述沒有可用來產生表單的屬性。請輸入代理程式預期的 JSON 文件。",
    "invalidRaw": "JSON 無效。請先修正，再切換到表單。",
    "errors": {
     "required": "此欄位為必填。",
     "number": "請輸入數字。",
     "integer": "請輸入整數。",
     "json": "請輸入有效的 JSON。"
    }
   }
  },
  "manifests": {
   "bundle": {
    "scope": "匯出範圍",
    "scopeAll": "所有資源",
    "scopeSelected": "所選資源",
    "kinds": "類型",
    "resources": "資源",
    "resourcesHint": "每行一個 類型/名稱，或以逗號分隔，例如 Agent/triage。",
    "invalidSelectors": "不是已知類型的 類型/名稱：{{entries}}",
    "followReferences": "包含它們參照的資源",
    "includeBuiltIn": "包含參照的內建資源",
    "exporting": "正在匯出...",
    "noSecrets": "此套件不需要任何密鑰。",
    "requiredSecrets": "套用之前，請在目標租用戶中建立這些密鑰。密鑰值永遠不會被匯出。",
    "requiredArtifactStores": "套用之前，請在目標租用戶中建立這些成品儲存區。"
   }
  }
 }
});

// Durable continuation and remote execution.
zhHant.enums.runStatus.Suspended = "已暫停";
zhHant.resources.deployments.fields.suspensionEnabled = "等待核准時暫停";
zhHant.resources.harnessProfiles.fields.sessionFormat = "Harness 工作階段格式";
zhHant.enums.auditEventType.QueueFull = "佇列已滿";
zhHant.enums.runExecutor.RemoteA2A = "遠端 A2A";
zhHant.enums.runExecutor.RemoteMcp = "遠端 MCP";
zhHant.tips.resources.deployments.suspensionEnabled = "等待時啟用持久檢查點。需要 Process、隔離的主目錄、相容且可恢復的 Harness，以及產物儲存。";
zhHant.tips.resources.harnessProfiles.sessionFormat = "可攜式檢查點的版本化工作階段格式。如果 Harness 升級改變工作階段相容性，請更新此值。";
zhHant.tips.enums.runStatus.Suspended = "執行已有持久工作階段檢查點，等待時不佔用工作節點租約或執行槽位。";
zhHant.tips.enums.runExecutor.RemoteA2A = "透過期限與取消處理執行已驗證的註冊 A2A 代理。";
zhHant.tips.enums.runExecutor.RemoteMcp = "使用經過驗證的 JSON 輸入呼叫所選的遠端 MCP 工具。";
zhHant.tips.enums.auditEventType.QueueFull = "叢集、租戶或代理的佇列達到上限，執行接納被拒絕。";

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
})(zhHant, {
 "enums": {
  "agentRevisionState": {
   "Draft": "草稿",
   "Published": "已發佈"
  },
  "promotionKind": {
   "Promote": "升級推進",
   "Rollback": "復原"
  },
  "promotionOutcome": {
   "Applied": "已套用",
   "RolledBack": "已復原"
  },
  "revisionChangeType": {
   "Changed": "已變更",
   "Added": "已新增",
   "Removed": "已移除"
  },
  "resourceType": {
   "AgentRevision": "代理程式修訂",
   "Promotion": "升級推進"
  }
 },
 "errorCodes": {
  "PromotionOrderViolation": "目標不是來源環境的下一個環境。若要不依順序推進，請開啟「允許略過環境」。",
  "NoNextEnvironment": "來源是最後一個環境，沒有可推進的目標。",
  "NoTargetDeployments": "此代理程式在目標環境中沒有部署。請先在該環境建立一個。",
  "NoSourceRevision": "沒有可推進的修訂：代理程式在來源環境中沒有部署，或沒有已發佈的修訂。請明確選擇一個修訂。",
  "AmbiguousSourceRevision": "來源環境中的部署執行不同的修訂。請選擇要推進的修訂。",
  "RevisionNotPublished": "該修訂是草稿。請先發佈再推進。",
  "PromotionConflict": "套用推進時有部署發生變更。未進行任何變更；請重新載入後再試一次。",
  "NotAPromotion": "只能復原推進記錄，不能復原復原記錄。",
  "AlreadyRolledBack": "此推進已經復原。",
  "RevisionUnchanged": "草稿與最新發佈的修訂相同。請先修改再發佈，或將其捨棄。",
  "RevisionPublished": "此修訂已發佈，無法再變更。",
  "EnvironmentInUse": "您移除的某個環境仍有部署。請先移動或刪除這些部署。"
 },
 "views": {
  "agentDetail": {
   "revisions": "修訂",
   "draftNotice": "此代理程式有尚未發佈的草稿變更。在草稿發佈之前，部署會繼續執行已發佈的修訂。",
   "reviewDraft": "檢視草稿"
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "number": "修訂編號",
    "state": "狀態",
    "author": "作者",
    "changeNote": "變更說明",
    "publishedUtc": "發佈時間",
    "actions": "動作"
   },
   "number": "修訂 {{number}}",
   "option": "修訂 {{number}}（{{state}}）",
   "latest": "最新",
   "empty": "此代理程式尚無修訂。",
   "compareTitle": "比較修訂",
   "from": "從",
   "to": "到",
   "pickTwo": "請選擇兩個不同的修訂進行比較。",
   "identical": "修訂 {{from}} 與 {{to}} 的內容相同。",
   "diffSummary": "修訂 {{from}} 與修訂 {{to}} 之間變更的欄位：{{changed}}。",
   "diffColumns": {
    "field": "欄位",
    "change": "變更",
    "before": "之前",
    "after": "之後"
   },
   "emptyValue": "（空白）",
   "compare": "比較",
   "publish": "發佈",
   "discard": "捨棄草稿",
   "publishTitle": "發佈修訂 {{number}}",
   "publishBody": "發佈後，修訂 {{number}} 會成為最新發佈的修訂。跟隨最新修訂的部署會從下一次執行起使用它；已釘選的部署則保留其修訂。",
   "changeNote": "變更說明",
   "changeNotePlaceholder": "變更了什麼以及原因（選填）",
   "publishing": "正在發佈...",
   "published": "已發佈修訂 {{number}}。",
   "discardTitle": "捨棄草稿修訂 {{number}}",
   "discardMessage": "要捨棄草稿嗎？其變更將會遺失。已發佈的修訂與部署不受影響。",
   "discarded": "已捨棄草稿。"
  },
  "promote": {
   "title": "推進修訂",
   "intro": "將目標環境中此代理程式的每個部署釘選到來源環境中正在執行的修訂。每次推進都會記錄下來，並且可以復原。",
   "agent": "代理程式",
   "revision": "要推進的修訂",
   "revisionFromSource": "來源環境中正在執行的修訂",
   "source": "來源環境",
   "target": "目標環境",
   "targetNext": "下一個環境（{{name}}）",
   "allowSkip": "允許略過環境",
   "skipWarning": "{{target}} 不是緊接在 {{source}} 之後的環境。",
   "note": "備註",
   "notePlaceholder": "此次推進的原因（選填）",
   "submit": "推進",
   "promoting": "正在推進...",
   "promoted": "已推進到 {{target}}。已更新的部署：{{deployments}}。",
   "errors": {
    "noNext": "來源環境之後沒有其他環境。",
    "sameEnvironment": "請選擇與來源不同的目標環境。",
    "needsSkip": "此目標會略過一個環境。若要不依順序推進，請開啟「允許略過環境」。"
   }
  },
  "promotions": {
   "title": "推進記錄",
   "agentFilter": "代理程式",
   "allAgents": "所有代理程式",
   "empty": "尚無推進或復原記錄。",
   "columns": {
    "createdUtc": "時間",
    "kind": "類型",
    "outcome": "結果",
    "agent": "代理程式",
    "revision": "修訂",
    "environments": "環境",
    "deployments": "部署",
    "actor": "執行者",
    "note": "備註",
    "actions": "動作"
   },
   "path": "{{source}} 到 {{target}}",
   "pinChange": "（{{from}} 到 {{to}}）",
   "skipped": "已略過環境",
   "rollback": "復原",
   "rollbackTitle": "復原推進",
   "rollbackMessage": "要將此次從 {{source}} 到 {{target}} 的推進所變更的部署還原為先前的修訂釘選嗎？受影響的部署：{{deployments}}。",
   "rollbackNote": "復原備註",
   "rolledBack": "已復原。先前的修訂釘選已還原。"
  }
 },
 "resources": {
  "deployments": {
   "columns": {
    "environment": "環境",
    "agentRevisionId": "釘選的修訂"
   },
   "fields": {
    "environment": "環境",
    "agentRevisionId": "修訂釘選"
   },
   "hints": {
    "environment": "推進會依租用戶的順序在環境之間移動修訂。",
    "agentRevisionId": "留空則跟隨代理程式最新發佈的修訂。釘選後，此部署會停留在某個修訂上，直到您或某次推進變更它。"
   },
   "followLatest": "跟隨最新發佈",
   "latest": "最新",
   "selectAgentFirst": "請先選擇代理程式。",
   "noPublished": "此代理程式尚無已發佈的修訂。",
   "actions": {
    "promote": "推進",
    "promotions": "推進記錄"
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
})(zhHant, {
 "nav": {
  "items": {
   "agentAssets": {
    "label": "資產",
    "tip": "由代理程式修訂釘選、具版本控管的系統提示、技能、參考檔案與文件範本。"
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
  "AssetInUse": "仍有代理程式修訂釘選此資產。請先從這些修訂中移除它，再刪除。",
  "AssetKindImmutable": "資產建立後無法變更其類型。請改為建立新的資產。",
  "AssetStoreImmutable": "資產建立後無法變更其成品存放區。請改為建立新的資產。",
  "AssetTemplateRequired": "系統提示資產需要提示範本，其他類型則不能有提示範本。",
  "AssetFileTooLarge": "有檔案超過 Assets.MaxFileBytes 設定允許的大小。",
  "AssetVersionTooLarge": "檔案總大小超過 Assets.MaxVersionBytes 設定允許的上限。",
  "AssetTooManyFiles": "此次上傳的檔案數超過 Assets.MaxFilesPerVersion 設定允許的數量。",
  "AssetHasNoFiles": "系統提示資產沒有檔案。請改為編輯其提示範本。"
 },
 "common": {
  "fieldCodes": {
   "InvalidAssetPath": "請使用以正斜線分隔的相對路徑，不得包含 \".\" 或 \"..\" 區段，最多 512 個字元。",
   "MacroFormatRefused": "不接受啟用巨集的 Office 檔案（Assets.AllowMacroFormats）。請將檔案另存為 .docx 或 .dotx。",
   "AssetHasNoFiles": "系統提示資產沒有檔案。請改為編輯其提示範本。",
   "AssetTemplateRequired": "請為系統提示資產選擇提示範本。"
  },
  "serverText": {
   "assetInUse": "資產 {{asset}} 被下列代理程式的修訂釘選：{{agents}}。請先從這些修訂中移除它。",
   "assetFileTooLarge": "檔案 {{path}} 為 {{size}} 位元組，上限為 {{limit}} 位元組（Assets.MaxFileBytes）。",
   "assetVersionTooLarge": "此版本超過 {{limit}} 位元組（Assets.MaxVersionBytes）。",
   "assetTooManyFiles": "每個版本最多 {{limit}} 個檔案（Assets.MaxFilesPerVersion），此次上傳有 {{count}} 個。",
   "assetHasNoFiles": "系統提示資產沒有檔案。請改為編輯其提示範本。"
  }
 },
 "resources": {
  "agentAssets": {
   "title": "資產",
   "subtitle": "由代理程式修訂釘選、具版本控管的系統提示、技能、參考檔案與文件範本。",
   "add": "新增資產",
   "create": "建立資產",
   "edit": "編輯資產",
   "view": "資產詳細資料",
   "deleteTitle": "刪除資產",
   "emptyTitle": "尚無資產",
   "emptyBody": "建立資產，將其檔案上傳為一個版本，再釘選到代理程式修訂上。",
   "columns": {
    "name": "名稱",
    "kind": "類型",
    "currentVersion": "目前版本",
    "description": "說明",
    "tags": "標籤",
    "artifactStoreId": "存放區",
    "id": "ID 識別碼",
    "createdUtc": "建立時間"
   },
   "fields": {
    "name": "名稱",
    "kind": "類型",
    "promptTemplateId": "提示範本",
    "artifactStoreId": "成品存放區",
    "description": "說明",
    "tags": "標籤"
   },
   "hints": {
    "kind": "建立後即固定。系統提示資產的文字來自提示範本，其他類型則保存上傳的檔案。",
    "promptTemplateId": "此資產作為代理程式系統提示所提供文字的提示範本。",
    "artifactStoreId": "上傳檔案的存放位置。建立後即固定。留空則保存在 Garrison 資料庫中。"
   },
   "errors": {
    "templateRequired": "請選擇此系統提示資產使用的提示範本。"
   },
   "version": "版本 {{number}}",
   "noVersion": "無版本",
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
   "versionsTitle": "{{name}} 的版本",
   "current": "目前",
   "noVersions": "此資產尚無版本。請在下方上傳其檔案。",
   "systemPromptNotice": "系統提示資產沒有檔案。其文字來自提示範本，若要變更請編輯該範本。",
   "showFiles": "檔案",
   "filesTitle": "版本 {{number}} 的檔案",
   "noFiles": "此版本沒有檔案。",
   "preview": "預覽",
   "download": "下載",
   "previewTitle": "{{path}}（版本 {{number}}）",
   "emptyFile": "此檔案為空。",
   "versionColumns": {
    "number": "版本",
    "author": "作者",
    "changeNote": "變更說明",
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
   "uploadTitle": "上傳新版本",
   "uploadHint": "選擇一或多個檔案。每次上傳都是完整的版本：未包含的檔案不會從目前版本沿用。",
   "files": "檔案",
   "uploadColumns": {
    "path": "資產內路徑",
    "mediaType": "媒體類型",
    "size": "大小",
    "actions": "移除"
   },
   "mediaTypeGuessed": "依副檔名判斷",
   "removeFile": "從此次上傳中移除此檔案",
   "changeNote": "變更說明",
   "changeNotePlaceholder": "此版本變更了什麼",
   "upload": "上傳版本",
   "uploading": "上傳中...",
   "uploadCreated": "已建立版本 {{number}}。",
   "uploadUnchanged": "檔案與目前版本 {{number}} 相同，因此未建立新版本。",
   "limitSetting": "此上限由伺服器設定 {{setting}} 決定。",
   "duplicatePath": "此次上傳中有另一個檔案使用相同路徑。",
   "pinVersion": "{{name}} 版本 {{version}}",
   "pinCurrent": "{{name}}（目前）",
   "pinsTitle": "資產釘選",
   "pinsSave": "儲存草稿",
   "pinsSaved": "已儲存草稿修訂 {{number}} 的資產釘選。",
   "pinsDraft": "變更草稿修訂 {{number}} 的資產釘選。草稿中的其他內容維持不變。",
   "pinsNewDraft": "目前沒有開啟的草稿。儲存時會以已發佈的修訂 {{number}} 為基礎，建立含這些資產釘選的新草稿。",
   "pinsEmpty": "尚未釘選任何資產。",
   "pinAsset": "資產",
   "pinVersionLabel": "版本",
   "chooseAsset": "選擇資產",
   "assetOption": "{{name}}（{{kind}}）",
   "followCurrent": "目前版本",
   "removePin": "移除此資產釘選",
   "addPin": "新增資產",
   "editPins": "資產",
   "pinsNewDraftButton": "在新草稿中釘選資產"
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
})(zhHant, {
 "views": {
  "conversationDetail": {
   "tabsLabel": "對話區段",
   "tabs": {
    "turns": "各輪",
    "files": "檔案"
   }
  },
  "runDetail": {
   "fileSpace": "檔案空間",
   "openFiles": "開啟檔案"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "fileSpaceMountPath": "檔案空間資料夾"
   },
   "hints": {
    "fileSpaceMountPath": "執行工作區中的資料夾，執行開始時接收對話的共用檔案，結束時將其中的變更寫回。預設值為 files。"
   }
  }
 },
 "errorCodes": {
  "InvalidFilePath": "請使用以正斜線分隔的相對路徑，不得包含 \".\" 或 \"..\" 區段。",
  "FileTooLarge": "檔案超出 FileSpaces.MaxFileBytes 設定允許的大小。",
  "FileSpaceFull": "檔案空間將超出 FileSpaces.MaxTotalBytes 設定。",
  "TooManyFiles": "檔案空間的檔案數已達 FileSpaces.MaxFiles 設定的上限。",
  "StaleFileUpload": "此執行已不再持有租約，因此其檔案變更並未寫入。"
 },
 "common": {
  "fieldCodes": {
   "InvalidFilePath": "請使用以正斜線分隔的相對路徑，不得包含 \".\" 或 \"..\" 區段。"
  },
  "serverText": {
   "fileSpaceFileTooLarge": "檔案 {{path}} 有 {{size}} 位元組；上限為 {{limit}} 位元組 (FileSpaces.MaxFileBytes)。",
   "fileSpaceFull": "檔案空間將超過 {{limit}} 位元組 (FileSpaces.MaxTotalBytes)。",
   "fileSpaceTooManyFiles": "檔案空間中已有 {{count}} 個檔案 (FileSpaces.MaxFiles)。",
   "fileNotFound": "找不到檔案 {{path}}。"
  }
 },
 "components": {
  "files": {
   "title": "檔案",
   "summary": "共用檔案：{{count}} 個 ({{size}})",
   "live": "即時",
   "polling": "定時重新整理",
   "includeDeleted": "顯示已刪除的檔案",
   "refresh": "重新整理",
   "spaceId": "檔案空間 {{id}}",
   "emptyTitle": "尚無檔案",
   "emptyBody": "各輪寫入共用資料夾的檔案，以及您在下方上傳的檔案，都會顯示在這裡。",
   "emptyBodyDeleted": "此對話的共用資料夾尚未寫入任何內容，包括之後被刪除的檔案。",
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
   "versions": "版本歷程",
   "download": "下載",
   "deleteLabel": "刪除 {{path}}",
   "deletedToast": "已刪除 {{path}}。其版本會保留。",
   "deleteTitle": "刪除檔案",
   "confirmDelete": "要從共用檔案中刪除 {{path}} 嗎？之後的各輪將看不到它。其版本會保留，仍可下載。",
   "versionsTitle": "{{path}} 的版本",
   "noVersions": "此檔案沒有版本。",
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
   "emptyFile": "此版本是空的。",
   "uploadTitle": "上傳檔案",
   "uploadHint": "選擇一個或多個檔案並檢查其路徑。路徑與清單中的檔案相同時，會為該檔案新增版本。如果清單載入後有某一輪變更了該檔案，您的上傳會以衝突名稱存放在旁邊，而不會取代它。",
   "uploadCreated": "已將 {{path}} 新增為版本 {{version}}。",
   "uploadReplaced": "已將 {{path}} 儲存為版本 {{version}}。",
   "uploadConflict": "{{requested}} 在清單載入後已變更，因此您的上傳已存為 {{path}}。請比較這兩個檔案，並刪除不需要的那一個。",
   "chooseFiles": "要上傳的檔案",
   "uploadColumns": {
    "path": "在共用資料夾中的路徑",
    "replaces": "取代",
    "size": "大小",
    "actions": "移除"
   },
   "replacesVersion": "版本 {{version}}",
   "newFile": "新檔案",
   "removeFile": "從上傳中移除此檔案",
   "upload": "上傳",
   "uploading": "上傳中...",
   "limitSetting": "此上限由伺服器設定 {{setting}} 決定。"
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
})(zhHant, {
 "nav": {
  "items": {
   "capabilities": {
    "label": "能力",
    "tip": "能力目錄：負責協調的代理程式可以找到並使用的代理程式、MCP 工具與 Harness 內建工具，附有成本與延遲提示。"
   }
  }
 },
 "enums": {
  "capabilityKind": {
   "Agent": "代理程式",
   "McpTool": "MCP 工具",
   "HarnessBuiltIn": "Harness 內建工具"
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
   "NoToolWorker": "沒有具備該工具的工作節點"
  },
  "resourceType": {
   "ConversationFileSpace": "對話檔案空間",
   "Capability": "能力"
  }
 },
 "errorCodes": {
  "InvalidJsonSchema": "有結構描述不是有效的 JSON Schema。請修正輸入或輸出結構描述後再儲存。",
  "NameConflict": "已有另一個手動能力使用此名稱。請選擇其他名稱。",
  "CapabilityDerived": "此能力衍生自其來源並隨來源更新，因此無法在這裡編輯或刪除。請改為變更來源。",
  "InvalidTags": "最多使用 32 個標籤，每個 1 至 64 個字元。",
  "TooManyRequirements": "最多使用 16 項節點標籤需求。"
 },
 "common": {
  "fieldCodes": {
   "InvalidJsonSchema": "這不是有效的 JSON Schema。",
   "InvalidTags": "最多使用 32 個標籤，每個 1 至 64 個字元。",
   "TooManyRequirements": "最多使用 16 項節點標籤需求。"
  },
  "serverText": {
   "capabilityDerivedEdit": "能力 {{name}} 衍生自其來源並隨來源更新。請改為變更來源。",
   "capabilityDerivedDelete": "能力 {{name}} 衍生自其來源，並會隨來源一併移除，因此無法直接刪除。",
   "capabilityShared": "能力 {{name}} 由所有租用戶共用，且來自內建的 Harness 設定檔，因此無法變更。",
   "capabilityNameConflict": "已存在名為 {{name}} 的手動能力。",
   "capabilitySecretsDenied": "您無權使用 MCP 伺服器 {{server}} 所傳送的祕密，因此未列出其工具。",
   "capabilityNoStdioWorker": "沒有任何就緒的工作節點開啟 stdio MCP 診斷（GARRISON_WORKER_MCP_TESTS_ENABLED），因此無法列出 stdio 伺服器的工具。",
   "capabilityRefreshFailed": "於 {{when}} 重新整理失敗：{{error}}",
   "capabilityMissingTools": "缺少必要的工具：{{tools}}。",
   "capabilityProbeShadowed": "工作節點以 {{probe}} 探測 {{name}}，該探測由另一個 Harness 設定檔先行定義。此設定檔的定義不會被探測。"
  }
 },
 "components": {
  "blocked": {
   "reasons": {
    "NoToolWorker": "此執行的代理程式使用 {{tools}}，但沒有任何能執行 {{harness}} 的就緒工作節點回報此工具。請在工作節點主機上安裝該工具，讓探測回報節點標籤 garrison.io/tool-{name}=true，或手動為工作節點加上該標籤。"
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
   "hintsLineNoCost": "中位數 {{median}}，p90 {{p90}}，未記錄成本",
   "hintsTitle": "成本與延遲提示",
   "noCost": "未記錄成本",
   "windowDays_one": "{{count}} 天",
   "windowDays_other": "{{count}} 天",
   "refreshWarning": "上次重新整理此項目的來源時失敗。",
   "requirementsTitle": "執行所需的節點標籤",
   "noRequirements": "無。使用此能力的執行可以分派到任何工作節點。",
   "noSchema": "無結構描述",
   "fields": {
    "kind": "類型",
    "origin": "來源方式",
    "source": "來源",
    "lastRefreshedUtc": "上次重新整理",
    "tags": "標籤",
    "id": "ID 識別碼",
    "summary": "摘要",
    "hintStatus": "狀態",
    "sampleSize": "彙整的執行數",
    "medianDurationMs": "耗時中位數",
    "p90DurationMs": "p90 耗時",
    "meanCostUsd": "平均成本",
    "windowDays": "統計期間",
    "computedUtc": "計算時間",
    "inputSchema": "輸入結構描述",
    "outputSchema": "輸出結構描述"
   },
   "refreshTitle": "重新整理能力目錄",
   "refreshHint": "Garrison 會重新衍生代理程式與 Harness 內建工具的項目、列出每個 MCP 伺服器的工具（stdio 伺服器透過已開啟 stdio 診斷的工作節點列出），並重新計算代理程式提示。列出伺服器時會傳送其範本所指名的祕密給它，因此您需要有使用這些祕密的權限。",
   "refreshServer": "要列出的 MCP 伺服器",
   "refreshAll": "所有啟用中的 MCP 伺服器",
   "refreshRun": "立即重新整理",
   "refreshing": "重新整理中...",
   "refreshDone": "能力目錄已是最新狀態。",
   "refreshPartial_one": "目錄已重新整理，但有 {{count}} 個 MCP 伺服器無法列出。",
   "refreshPartial_other": "目錄已重新整理，但有 {{count}} 個 MCP 伺服器無法列出。",
   "refresh": {
    "agents": "已變更的代理程式項目",
    "harnessBuiltIns": "已變更的內建工具項目",
    "hints": "已重新計算的提示",
    "servers": "已列出的 MCP 伺服器",
    "tools": "已寫入的工具項目",
    "removed": "已移除的工具項目",
    "failed": "失敗的伺服器",
    "noServers": "未列出任何 MCP 伺服器。",
    "failedBadge": "失敗",
    "listedBadge": "已列出",
    "columns": {
     "server": "MCP 伺服器",
     "status": "結果",
     "tools": "工具",
     "removed": "已移除",
     "warned": "保留但附警告",
     "error": "錯誤"
    }
   },
   "errors": {
    "nameLength": "請使用 1 至 {{max}} 個字元。",
    "summaryLength": "最多使用 {{max}} 個字元。",
    "tags": "最多使用 {{max}} 個標籤，每個 1 至 {{length}} 個字元。",
    "requirementCount": "最多使用 {{max}} 項節點標籤需求。",
    "requirement": "每項需求都需要長度 1 至 {{max}} 個字元的節點標籤鍵。",
    "toolNeedsServer": "請選擇此工具所屬的 MCP 伺服器。",
    "probeCount": "一個 Harness 設定檔最多有 {{max}} 個工具探測。",
    "probeName": "工具名稱為 1 至 63 個小寫字母、數字、句點與連字號，並以字母或數字開頭。",
    "probeDuplicate": "此設定檔中已有另一個名為 {{name}} 的探測。",
    "probeExecutable": "執行檔必須是可在 PATH 上找到的單純檔案名稱（字母、數字、句點、底線、加號與連字號），不得包含資料夾。",
    "probeArgument": "請不選引數，或從 {{allowed}} 中選擇一個。",
    "probeDescription": "最多使用 {{max}} 個字元。"
   },
   "draftTitle": "能力",
   "draftSave": "儲存草稿",
   "draftSaved": "已儲存草稿修訂 {{number}} 的能力。",
   "draftEdit": "變更草稿修訂 {{number}} 的能力。草稿中的其他內容維持不變。",
   "draftNew": "目前沒有開啟的草稿。儲存時會以已發佈的修訂 {{number}} 為基礎，建立含這些能力的新草稿。",
   "draftPlacementHint": "這裡列出的 Harness 內建工具會將其節點標籤加到此代理程式的執行上，讓執行只分派到已回報該工具的工作節點。",
   "draftEmpty": "此修訂未使用任何能力。",
   "notInCatalog": "不在目錄中",
   "removeName": "移除 {{name}}",
   "chooseName": "選擇能力",
   "nameOption": "{{name}}（{{kinds}}）",
   "addName": "新增能力",
   "newDraftButton": "在新草稿中選擇能力",
   "editDraft": "能力"
  }
 },
 "resources": {
  "capabilities": {
   "title": "能力",
   "subtitle": "負責協調的代理程式可以找到並使用的代理程式、MCP 工具與 Harness 內建工具，附有成本與延遲提示。",
   "add": "新增能力",
   "create": "建立能力",
   "edit": "編輯能力",
   "view": "能力詳細資料",
   "deleteTitle": "刪除能力",
   "emptyTitle": "尚無能力",
   "emptyBody": "發佈代理程式修訂、註冊 MCP 伺服器，或在 Harness 設定檔中新增工具探測，然後重新整理。您也可以新增手動項目。",
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
    "sourceAgentId": "代表的代理程式",
    "sourceMcpServerId": "所屬的 MCP 伺服器",
    "sourceToolName": "該伺服器上的工具名稱",
    "tags": "標籤",
    "requirements": "執行所需的節點標籤",
    "inputSchema": "輸入結構描述",
    "outputSchema": "輸出結構描述"
   },
   "hints": {
    "kind": "手動項目可以是任何類型，例如代理程式透過技能使用的轉換服務。",
    "requirements": "使用此能力的代理程式，其執行只會分派到具備以下所有節點標籤的工作節點。",
    "sourceMcpServerId": "選填。指名伺服器的項目，只有在執行權杖所屬的部署繫結該伺服器時才看得到。",
    "inputSchema": "JSON Schema，例如 {\"type\": \"object\"}。若能力接受自由文字，請留空。"
   },
   "tagFilter": "標籤",
   "refresh": "重新整理",
   "warningBadge": "重新整理失敗",
   "warnings_one": "有 {{count}} 個項目因來源上次重新整理失敗，而保留最後一次正常的內容。開啟該項目即可查看原因。",
   "warnings_other": "有 {{count}} 個項目因來源上次重新整理失敗，而保留最後一次正常的內容。開啟其中一個即可查看原因。",
   "noSourceOption": "無",
   "requirementKey": "節點標籤",
   "requirementValue": "值"
  },
  "harnessProfiles": {
   "fields": {
    "toolProbes": "工具探測",
    "probeName": "工具名稱",
    "probeExecutable": "執行檔",
    "probeArgument": "引數",
    "probeDescription": "說明"
   },
   "columns": {
    "toolProbes": "工具探測"
   },
   "hints": {
    "toolProbes": "工作節點主機上有安裝時，此 Harness 可以使用的工具。工作節點在註冊前會執行每個探測，並將有回應的工具回報為節點標籤 garrison.io/tool-{name}=true。"
   },
   "addToolProbe": "新增工具探測",
   "probeNoArgument": "無引數"
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
})(zhHant, {
 "enums": {
  "fanOutGroupStatus": {
   "Running": "執行中",
   "Joined": "已匯合",
   "TimedOut": "已逾時",
   "BudgetExceeded": "超出預算",
   "Cancelled": "已取消"
  },
  "fanOutJoinPolicy": {
   "All": "全部",
   "Any": "任一",
   "Quorum": "法定數"
  },
  "resourceType": {
   "FanOutGroup": "扇出群組"
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "扇出群組"
  }
 },
 "components": {
  "fanOut": {
   "group": "扇出群組",
   "groupTitle": "扇出群組 {{id}}",
   "otherChildren": "其他子執行",
   "detailsUnavailable": "無法載入此群組的詳細資料，因此只列出其成員執行。",
   "policy": "匯合策略",
   "quorumPolicy": "{{policy}}：{{total}} 個中 {{quorum}} 個",
   "progress": "進度",
   "progressValue": "{{total}} 個中已結束 {{finished}} 個，成功 {{succeeded}} 個",
   "cost": "費用",
   "tokens": "Token 數",
   "usedOf": "{{used}} / {{limit}}",
   "noLimit": "{{used}}（無上限）",
   "deadline": "截止時間",
   "noDeadline": "無",
   "started": "開始時間",
   "completed": "結束時間",
   "pending": "仍在執行：{{labels}}",
   "failed": "未成功：{{labels}}",
   "live": "即時",
   "polling": "定時重新整理",
   "cancel": "取消群組",
   "cancelTitle": "取消扇出群組",
   "confirmCancel": "要取消扇出群組 {{id}} 嗎？仍在執行的成員會被取消，上層執行會看到此群組已取消。",
   "cancelledToast": "已取消扇出群組 {{id}}。",
   "columns": {
    "label": "標籤",
    "agent": "代理程式",
    "status": "狀態",
    "costUsd": "費用",
    "tokens": "Token 數",
    "run": "執行"
   }
  }
 },
 "common": {
  "serverText": {
   "fanOutParentEnded": "上層執行已結束或已被取消。",
   "fanOutCostExceeded": "成員花費了 {{cost}} USD，超出 {{budget}} USD 的預算。",
   "fanOutTokensExceeded": "成員使用了 {{tokens}} 個 Token，超出 {{budget}} 的預算。",
   "fanOutTimedOut": "此群組 {{seconds}} 秒的逾時已到，仍有 {{running}} 個成員在執行。",
   "fanOutAnySucceeded": "有一個成員成功了。",
   "fanOutNoneSucceeded": "所有成員都已結束，沒有一個成功。",
   "fanOutQuorumMet": "{{succeeded}} 個成員成功，達到法定數 {{quorum}}。",
   "fanOutQuorumUnreachable": "失敗的成員太多，已無法達到法定數 {{quorum}}。",
   "fanOutAllFinished": "所有成員都已結束。",
   "fanOutCancelledByTool": "上層執行透過 garrison_cancel_fan_out 取消了此群組。",
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
})(zhHant, {
 "nav": {
  "items": {
   "apps": {
    "label": "應用程式",
    "tip": "代理式應用程式：在單一聊天介面後方為終端使用者提供服務的一組代理程式，包含其呼叫圖、委派、修訂與可分享的 URL。"
   }
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "租用戶使用者",
   "AppUsers": "應用程式使用者",
   "Anonymous": "匿名"
  },
  "resourceType": {
   "AgenticApp": "代理式應用程式"
  }
 },
 "errorCodes": {
  "AppSlugTaken": "另一個應用程式已使用此 URL 代稱。代稱在整個叢集中必須唯一，請選擇其他代稱。",
  "NoPublishedRevision": "沒有可使用的已發佈修訂。請先發佈一個。",
  "AgentInUse": "此代理程式是某個代理式應用程式的成員。請先將它從應用程式中移除。"
 },
 "common": {
  "fieldCodes": {
   "InvalidName": "請使用 1 到 64 個小寫字母、數字與連字號，開頭與結尾必須是字母或數字。",
   "InvalidSlug": "請使用 2 到 63 個小寫字母、數字與連字號，開頭必須是字母或數字。",
   "UnknownAgent": "此租用戶中沒有這個代理程式。",
   "DuplicateMember": "每個代理程式只能成為成員一次。",
   "EntryNotMember": "入口代理程式必須是成員之一。",
   "EdgeNotMember": "呼叫的兩端都必須是應用程式的成員。",
   "SelfEdge": "成員不能呼叫自己。",
   "AppGraphCycle": "成員之間的呼叫形成了循環。請移除循環中的其中一個呼叫。",
   "UnreachableMember": "每個成員都必須能從入口代理程式透過呼叫抵達。",
   "UnreachableMemberNamed": "入口代理程式無法透過呼叫抵達這些成員：{{names}}。請為每個成員新增呼叫，或將它們移除。",
   "UnknownEnvironment": "此租用戶中沒有這個環境。",
   "InvalidEntryDeployment": "請選擇入口代理程式在此環境中的部署。",
   "DuplicateEnvironment": "每個環境只能列出一次。",
   "InvalidColor": "請使用 #RRGGBB 格式的顏色，例如 #1F6FEB。",
   "UnknownAsset": "此租用戶中沒有這個代理程式資產。",
   "Required": "此欄位為必填。",
   "TooMany": "這裡的項目太多。"
  },
  "serverText": {
   "appNameConflict": "名為 {{name}} 的應用程式已存在。",
   "appSlugTaken": "URL 代稱 {{slug}} 已被使用。代稱在整個叢集中必須唯一，請選擇其他代稱。",
   "appNoPublishedRevision": "應用程式 {{name}} 沒有可推進的已發佈修訂。",
   "appMemberNotPublished": "成員 {{name}} 沒有可釘選的已發佈修訂。請先發佈一個。",
   "appRevisionPublished": "應用程式 {{name}} 的修訂 {{number}} 已經發佈。",
   "appNoTargetDeployments": "成員 {{member}} 在環境 {{environment}} 中沒有部署。請先在該環境建立一個。未推進任何項目。",
   "agentInApps": "代理程式 {{agent}} 是 {{apps}} 的成員。請先將它從應用程式中移除。"
  }
 },
 "components": {
  "form": {
   "pickColor": "為 {{field}} 選擇顏色"
  },
  "apps": {
   "graph": {
    "empty": "新增成員以查看應用程式的圖。",
    "summary": "應用程式圖，包含 {{members}} 個成員與 {{edges}} 個呼叫",
    "edgeFanOut": "{{caller}} 呼叫 {{callee}}，也可同時呼叫多個",
    "edgeSingle": "{{caller}} 呼叫 {{callee}}，一次一個呼叫",
    "entryNode": "{{name}}，入口代理程式",
    "unreachableNode": "{{name}}，入口代理程式無法抵達",
    "entry": "入口代理程式",
    "unreachable": "無法抵達",
    "legendFanOut": "允許平行呼叫",
    "legendSingle": "一次一個呼叫"
   },
   "share": {
    "noSlug": "為應用程式設定名稱或 URL 代稱，即可取得其連結。",
    "open": "開啟",
    "copy": "複製應用程式 URL",
    "inactive": "此應用程式未啟用，因此在你重新啟用之前，連結無法使用。",
    "signIn": {
     "TenantUsers": "此租用戶的任何啟用中使用者都可以登入。",
     "AppUsers": "只有在此應用程式上擁有 AppUser 角色的使用者可以登入。",
     "Anonymous": "任何擁有連結的人都可以不登入就使用此應用程式。已登入的使用者仍可使用。",
     "AnonymousDisabled": "已選擇匿名但尚未開啟，因此沒有人能不登入就進入，且只有具備存取權的租用戶使用者可以登入。"
    }
   },
   "delegation": {
    "title": "依應用程式圖設定委派",
    "intro": "應用程式的呼叫就是它的委派策略。每個成員應剛好允許它所呼叫的成員，且最大深度須涵蓋其下方最長的呼叫鏈。已發佈修訂與此不符的成員即為偏移。",
    "apply": "寫入草稿",
    "applying": "正在寫入草稿...",
    "applied": "已寫入 {{drafts}} 個草稿修訂；略過 {{skipped}} 個成員。",
    "appliedSummary": "已寫入 {{drafts}} 個草稿修訂，未發佈任何項目。略過了 {{skipped}} 個成員。請在各代理程式的「修訂」分頁檢閱並發佈草稿。",
    "drifting_one": "有 {{count}} 個成員的已發佈委派與圖不同。",
    "drifting_other": "有 {{count}} 個成員的已發佈委派與圖不同。",
    "inSync": "每個成員的已發佈委派都與圖相符。",
    "empty": "此應用程式沒有成員。",
    "notPublished": "未發佈",
    "drift": "偏移",
    "inSyncBadge": "已同步",
    "draftConflict": "草稿衝突",
    "draft": "草稿 {{number}}",
    "review": "草稿尚未生效。請開啟每個代理程式，在其「修訂」分頁檢閱草稿並發佈。",
    "columns": {
     "member": "成員",
     "desiredMode": "圖的模式",
     "desiredAllowList": "圖的允許清單",
     "desiredMaxDepth": "圖的深度",
     "publishedMode": "已發佈的模式",
     "publishedAllowList": "已發佈的允許清單",
     "publishedMaxDepth": "已發佈的深度",
     "status": "狀態"
    }
   },
   "revisions": {
    "title": "應用程式修訂",
    "intro": "應用程式修訂會釘選每個成員最新的已發佈修訂，並複製成員之間的呼叫。先發佈它，再推進它，讓所有成員一起移到下一個環境。",
    "changeNote": "變更說明",
    "changeNotePlaceholder": "自上一個修訂以來的變更",
    "take": "建立修訂",
    "taking": "建立中...",
    "taken": "已建立應用程式修訂 {{number}}。",
    "published": "已發佈應用程式修訂 {{number}}。",
    "empty": "尚無應用程式修訂。待每個成員都有已發佈修訂後再建立一個。",
    "promote": "推進",
    "publish": "發佈",
    "publishTitle": "發佈應用程式修訂 {{number}}",
    "publishConfirm": "要發佈 {{name}} 的修訂 {{number}} 嗎？已發佈的修訂無法變更，並會成為推進時預設使用的修訂。",
    "pin": "{{name}}（修訂 {{number}}）",
    "columns": {
     "number": "修訂",
     "state": "狀態",
     "members": "釘選的成員",
     "edges": "呼叫",
     "author": "作者",
     "changeNote": "變更說明",
     "publishedUtc": "發佈時間",
     "actions": "動作"
    }
   },
   "promote": {
    "title": "推進應用程式",
    "intro": "每個成員釘選的修訂會一次套用到該成員在目標環境中的每個部署。若有成員在該環境沒有部署，則不會推進任何項目。",
    "revision": "應用程式修訂",
    "latestRevision": "最新已發佈",
    "promoted": "已將應用程式推進到 {{target}}：更新了 {{deployments}} 個部署。",
    "denied": "你無法推進到 {{target}}。推進需要目標環境「升級推進」的「執行」權限。"
   }
  }
 },
 "resources": {
  "apps": {
   "title": "應用程式",
   "subtitle": "在單一聊天介面後方為終端使用者提供服務的一組代理程式。入口代理程式與使用者對話，並沿著應用程式的呼叫來呼叫其他成員。",
   "add": "新增應用程式",
   "create": "建立應用程式",
   "edit": "編輯應用程式",
   "view": "應用程式詳細資料",
   "deleteTitle": "刪除應用程式",
   "emptyTitle": "尚無應用程式",
   "emptyBody": "用現有的代理程式建立應用程式：選擇成員、負責與使用者對話的入口代理程式，以及誰呼叫誰。",
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
    "edges": "成員之間的呼叫",
    "edgesItems": {
     "callerAgentId": "呼叫端",
     "calleeAgentId": "被呼叫端",
     "fanOutAllowed": "允許平行呼叫"
    },
    "graph": "圖",
    "environments": "各環境的入口部署",
    "environmentsItems": {
     "environment": "環境",
     "deploymentId": "入口部署"
    },
    "liveEnvironment": "上線環境",
    "authMode": "誰可以使用此應用程式",
    "anonymousEnabled": "允許匿名使用",
    "showOperatorDetail": "向終端使用者顯示工具呼叫與思考過程",
    "share": "可分享的連結",
    "displayName": "顯示名稱",
    "logoAssetId": "標誌",
    "primaryColor": "主要顏色",
    "accentColor": "強調顏色",
    "welcomeText": "歡迎文字"
   },
   "hints": {
    "slug": "應用程式位於 /apps/{slug}/。留空則使用名稱。代稱在整個叢集中必須唯一。",
    "members": "應用程式中的代理程式。角色是簡短說明每個代理程式做什麼。",
    "entryAgentId": "與終端使用者對話的成員。其他每個成員都必須能從它抵達。",
    "edges": "誰可以呼叫誰。呼叫不能形成循環，並會成為每個成員的委派策略。",
    "environments": "應用程式在各環境中使用的入口代理程式部署。若未指定，應用程式會依名稱順序使用入口代理程式在該環境的第一個啟用中部署。",
    "liveEnvironment": "應用程式介面所連線的環境。",
    "anonymousEnabled": "匿名登入需要此選項。匿名工作階段較短，且有速率限制。",
    "showOperatorDetail": "終端使用者一律會看到回答、結果與錯誤。開啟此選項可同時顯示工具呼叫、思考過程與進度。",
    "logoAssetId": "資產目前版本中的第一張圖片。",
    "welcomeText": "在終端使用者傳送第一則訊息前顯示。"
   },
   "steps": {
    "general": "應用程式",
    "members": "成員與呼叫",
    "environments": "環境",
    "access": "登入與連結",
    "branding": "品牌"
   },
   "actions": {
    "delegation": "委派",
    "revisions": "修訂與推進"
   },
   "errors": {
    "nameTaken": "此租用戶中的另一個應用程式已使用這個名稱。"
   },
   "addMember": "新增成員",
   "addEdge": "新增呼叫",
   "addEnvironment": "新增環境",
   "chooseAgent": "選擇代理程式",
   "chooseEntry": "選擇成員",
   "rolePlaceholder": "此成員的工作",
   "noEntryDeployment": "第一個啟用中的部署",
   "noLogo": "無標誌",
   "displayNamePlaceholder": "顯示在應用程式的標頭"
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
})(zhHant, {
 "nav": {
  "items": {
   "studio": {
    "label": "工作室",
    "tip": "代理程式工作室：與代理程式架構師一起在草稿中設計代理程式和應用程式，在試驗場中試用，並申請套用草稿。"
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
   "Open": "可編輯",
   "PendingApproval": "等待核准",
   "Applied": "已套用",
   "Discarded": "已捨棄"
  },
  "studioDraftOperation": {
   "Upsert": "建立或更新",
   "Delete": "刪除"
  },
  "studioDiffChange": {
   "Create": "建立",
   "Update": "更新",
   "Delete": "刪除",
   "Unchanged": "無變更",
   "Failed": "失敗"
  }
 },
 "errorCodes": {
  "DraftVersionConflict": "你讀取草稿之後它已變更。請重新讀取後再試一次。",
  "DraftNotOpen": "此草稿不是可編輯狀態，因此無法變更。只有可編輯的草稿才能修改。",
  "DraftStale": "草稿所依據的即時設定已變更。請重訂過時的項目，然後再次申請套用。",
  "DraftInvalid": "草稿中有未通過驗證的文件。請先修正標示為「失敗」的項目。",
  "DraftEmpty": "草稿中沒有任何項目，因此沒有可套用的內容。",
  "ApproverLacksPermission": "你無權允許此草稿：允許它需要 Manifest 的建立權限，以及草稿所刪除每個種類的刪除權限。",
  "AgentNotLive": "該代理程式是此草稿中新增的。請先套用草稿，再於試驗場中試用該代理程式。",
  "NotAnArchitectDeployment": "只有架構師部署才能使用架構師提示，也就是 agent-architect 的部署或具有草稿存取權的部署。",
  "InvalidArchitectPrompt": "該提示不能作為架構師提示。請選擇此租用戶的 System 範本。",
  "PromptTemplateInUse": "此提示範本已被部署繫結。請先將這些部署切換到其他範本。",
  "ReservedEnvironment": "草稿（draft）環境保留給試驗場使用。",
  "NoDeploymentInEnvironment": "該代理程式在此環境中沒有部署。"
 },
 "views": {
  "studio": {
   "title": "工作室",
   "subtitle": "在草稿中設計代理程式和應用程式。在有人核准套用草稿之前，即時設定不會有任何變更。",
   "newDraft": "新增草稿",
   "refresh": "重新整理",
   "search": "搜尋標題",
   "scopeLabel": "草稿擁有者",
   "scopes": {
    "mine": "我的",
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
   "open": "開啟",
   "discard": "捨棄",
   "discardTitle": "捨棄草稿",
   "discardMessage": "要捨棄 {{title}} 嗎？捨棄後的草稿將無法再變更或套用。",
   "discardPendingMessage": "要捨棄 {{title}} 嗎？其套用核准將被取消，草稿將無法再變更或套用。",
   "discarded": "已捨棄 {{title}}。",
   "emptyTitle": "沒有草稿",
   "emptyBody": "從空白或現有應用程式開始一份草稿，並與代理程式架構師一起設計。",
   "emptyFiltered": "沒有符合這些篩選條件的草稿。",
   "untitled": "未命名草稿"
  },
  "studioDraft": {
   "title": "工作室草稿",
   "notFoundTitle": "找不到草稿",
   "notFoundBody": "該草稿不存在，或你無權讀取。",
   "back": "所有草稿",
   "version": "版本 {{version}}",
   "live": "即時",
   "polling": "輪詢中",
   "architect": "架構師",
   "tabsLabel": "草稿工作區",
   "tabs": {
    "architect": "架構師",
    "items": "項目",
    "graph": "關係圖",
    "apply": "差異與套用",
    "playground": "試驗場",
    "preview": "編譯預覽",
    "prompts": "架構師提示"
   },
   "notOpen": {
    "PendingApproval": "此草稿正在等待是否套用的決定，因此無法變更。拒絕核准或捨棄草稿後即可再次變更。",
    "Applied": "此草稿已套用到即時設定，無法再變更。如需進一步變更，請新增草稿。",
    "Discarded": "此草稿已被捨棄，無法再變更。",
    "other": "此草稿目前無法變更。"
   },
   "liveNotice": "草稿已更新為版本 {{version}}（{{status}}）。",
   "liveChanged": "已變更：{{items}}。",
   "removedTag": "已移除",
   "dismissNotice": "關閉"
  }
 },
 "components": {
  "studio": {
   "newDraft": {
    "title": "新增草稿",
    "intro": "草稿存放由你和代理程式架構師編輯的清單文件。可以從空白開始，也可以從現有應用程式及其參照的所有內容開始。",
    "titleField": "標題",
    "titlePlaceholder": "附撰稿者的研究應用程式",
    "fromApp": "從應用程式開始",
    "emptyDraft": "空白草稿",
    "fromAppHint": "應用程式、其成員、成員的部署、提示和資產都會成為項目。每個項目都會記住它所依據的即時版本，讓工作室能察覺之後的變更。",
    "create": "建立草稿",
    "creating": "正在建立...",
    "created": "已開始草稿 {{title}}。"
   },
   "architect": {
    "title": "新增架構師",
    "intro": "代理程式架構師會在你的草稿中設計代理程式和應用程式。請為它提供一個部署：Harness 設定檔、模型以及它使用的提示。它只會編輯你的草稿，從不套用草稿。",
    "name": "部署名稱",
    "harnessProfile": "Harness 設定檔",
    "chooseProfile": "選擇 Harness 設定檔",
    "model": "模型",
    "modelHint": "留空則使用 Harness 設定檔的預設模型。",
    "prompt": "架構師提示",
    "defaultPrompt": "{{name}}（預設）",
    "preview": "提示預覽",
    "previewEmpty": "選擇一個提示即可查看轉譯結果。",
    "cloneLink": "複製此提示以進行修改",
    "noAgent": "此租用戶沒有名為 {{name}} 的代理程式，因此無法建立架構師。請洽詢管理員。",
    "create": "建立架構師",
    "creating": "正在建立...",
    "created": "已建立架構師 {{name}}。"
   },
   "chat": {
    "title": "架構師",
    "architect": "架構師部署",
    "chooseArchitect": "選擇架構師",
    "newArchitect": "新增架構師",
    "noArchitect": "目前還沒有架構師部署。請先建立一個，以便與代理程式架構師一起設計。",
    "openConversation": "開啟對話",
    "newConversation": "新對話",
    "you": "你",
    "architectSays": "架構師",
    "openRun": "執行",
    "thinking": "處理中...",
    "empty": "告訴架構師要建構什麼。第一則訊息會告訴它要在哪份草稿中工作。",
    "pickFirst": "請選擇或建立一個架構師以開始。",
    "message": "訊息",
    "placeholder": "設計一個研究應用程式：由規劃者將工作分派給兩位研究員和一位撰稿者。",
    "firstHint": "就此草稿與這位架構師開始一段對話。",
    "continueHint": "繼續對話。按 Ctrl+Enter 或 Cmd+Enter 傳送。",
    "send": "傳送"
   },
   "items": {
    "title": "項目",
    "titleCount": "項目（{{total}}）",
    "add": "新增項目",
    "addConfirm": "開啟編輯器",
    "columns": {
     "kind": "種類",
     "name": "名稱",
     "operation": "操作",
     "stale": "已過時",
     "updated": "更新時間"
    },
    "stale": "已過時",
    "empty": "還沒有項目。新增一個，或請架構師處理。",
    "remove": "移除",
    "removeTitle": "移除項目",
    "removeMessage": "要從草稿中移除 {{item}} 嗎？即時設定不會變更。",
    "removed": "已移除 {{item}}。",
    "saved": "已儲存 {{item}}。草稿目前為版本 {{version}}。",
    "editorTitle": "編輯 {{item}}",
    "newEditorTitle": "新項目 {{item}}",
    "document": "清單文件",
    "versionHint": "儲存時會傳送你讀取的版本 {{version}}。如果之後草稿已變更，儲存會被拒絕，你的文字仍會保留在這裡。",
    "unsaved": "未儲存的變更",
    "errors": {
     "name": "請使用字母、數字、句點、斜線和連字號，並以字母或數字開頭。",
     "exists": "草稿中已有 {{kind}}/{{name}}。",
     "deleteKind": "只有 Agent、Deployment、Pipeline 和 AgenticApp 項目可以刪除，{{kind}} 不行。"
    },
    "conflict": {
     "title": "你編輯期間草稿已變更：版本 {{from}} 現在是 {{to}}。",
     "added": "新增：{{items}}",
     "updated": "已編輯：{{items}}",
     "removed": "已移除：{{items}}",
     "status": "其狀態現在是 {{status}}。",
     "layout": "只有關係圖版面配置變更。",
     "mine": "你正在編輯的項目也已變更。再次儲存前，請將你的文字與新版本比較。",
     "retry": "你的文字仍在編輯器中。再次儲存即可套用到新版本。",
     "dismiss": "關閉"
    }
   },
   "graph": {
    "title": "關係圖",
    "empty": "草稿中還沒有可繪製的應用程式或代理程式。",
    "depth": "深度 {{depth}}",
    "entryAgent": "入口代理程式：{{name}}",
    "deleted": "將刪除",
    "inDraft": "在草稿中",
    "loose": "不屬於任何應用程式的代理程式",
    "capabilities": "能力：{{list}}",
    "legend": "每次呼叫都會標示所需的委派深度。實線表示允許平行呼叫，虛線表示一次只能呼叫一次。能力顯示在代理程式名稱下方。"
   },
   "diff": {
    "title": "差異與套用",
    "refresh": "重新整理差異",
    "validate": "驗證",
    "validating": "正在驗證...",
    "requestApply": "申請套用",
    "requesting": "正在申請...",
    "requested": "已申請套用。將由有權套用清單的人做出決定。",
    "valid": "有效：{{create}} 個待建立，{{update}} 個待更新，{{delete}} 個待刪除，{{unchanged}} 個無變更。",
    "invalid": "無效：{{failed}} 個失敗，{{stale}} 個已過時。預計：{{create}} 個待建立，{{update}} 個待更新，{{delete}} 個待刪除，{{unchanged}} 個無變更。",
    "validOk": "草稿有效。",
    "validFailed": "草稿無效。請查看標示為「失敗」或「已過時」的項目。",
    "empty": "草稿中沒有可比較的項目。",
    "columns": {
     "item": "項目",
     "change": "變更",
     "details": "詳細資料"
    },
    "none": "（無）",
    "approval": "套用核准",
    "allow": "允許",
    "deny": "拒絕",
    "allowed": "已允許。正在套用草稿。",
    "denied": "已拒絕。草稿已重新變為可編輯。",
    "reason": "原因",
    "reasonPlaceholder": "選填，會與決定一起保存",
    "waiting": "正在等待有權決定核准並套用清單的人。",
    "applied": "已作為清單套用 {{id}} 完成套用。"
   },
   "playground": {
    "title": "試驗場",
    "intro": "每一輪都會將草稿中該代理程式的文件儲存為其草稿修訂版本，並在暫時的試驗場部署上執行。不會發布任何內容，即時設定也不會變更。",
    "agent": "代理程式",
    "defaultAgent": "入口代理程式（{{name}}）",
    "defaultAgentShort": "入口代理程式",
    "input": "輸入",
    "answer": "回答",
    "placeholder": "希望代理程式做什麼？",
    "firstHint": "開始一段試驗場對話。",
    "continueHint": "繼續試驗場對話。",
    "send": "執行本輪",
    "turn": "第 {{number}} 輪，{{agent}}",
    "openRun": "執行詳細資料",
    "conversation": "對話",
    "export": "下載對話紀錄",
    "reset": "新對話",
    "empty": "還沒有任何輪次。",
    "exportDraft": "草稿",
    "exportTurn": "輪次",
    "exportRun": "執行"
   },
   "preview": {
    "title": "編譯預覽",
    "intro": "在部署之前查看執行啟動時的內容：命令列、資產的放置位置以及檔案空間掛接。祕密值會被遮蔽。",
    "deployment": "部署",
    "chooseDeployment": "選擇部署",
    "revision": "代理程式修訂版本",
    "deploymentRevision": "部署本身的修訂版本",
    "revisionOption": "修訂版本 {{number}}（{{state}}）",
    "environment": "環境",
    "deploymentEnvironment": "部署所在的環境",
    "input": "範例輸入",
    "compiled": "已使用 {{revision}} 編譯 {{deployment}}。",
    "assets": "放置的資產（{{total}}）",
    "noAssets": "此修訂版本不會放置任何資產。",
    "columns": {
     "path": "路徑",
     "asset": "資產",
     "kind": "種類",
     "version": "版本",
     "size": "大小"
    },
    "fileSpace": "檔案空間",
    "fileSpaceMount": "掛接於 {{path}}，目前有 {{files}} 個檔案（最多 {{maxFiles}} 個檔案，每個最大 {{maxBytes}}）。",
    "noFileSpace": "由於此執行不屬於任何對話，因此不會掛接檔案空間。",
    "redacted": "伺服器會遮蔽命令列、環境和檔案中的祕密值。"
   },
   "prompts": {
    "title": "架構師提示",
    "templatesLink": "在提示範本中開啟",
    "forArchitect": "代理程式架構師可用的提示。請為 {{architect}} 選擇一個。",
    "noArchitect": "代理程式架構師可用的提示。請先在「架構師」分頁中選擇架構師，再為它選擇提示。",
    "nextTurn": "新的選擇或已儲存的編輯會從架構師的下一輪開始生效。",
    "current": "{{architect}} 使用 {{name}}，跟隨其目前版本（{{version}}）。",
    "currentPinned": "{{architect}} 使用 {{name}}，固定於版本 {{version}}。",
    "inUse": "{{name}} 正被以下部署使用，因此無法刪除：{{deployments}}。請先為它們選擇其他提示。",
    "empty": "沒有架構師提示。",
    "columns": {
     "name": "名稱",
     "description": "說明",
     "version": "版本",
     "usedBy": "使用者"
    },
    "default": "預設",
    "selectedBadge": "已選取",
    "usedBy": "架構師：{{total}}",
    "select": "選取",
    "selected": "{{architect}} 將從下一輪開始使用 {{name}}。",
    "saved": "已將 {{name}} 儲存為新版本。",
    "editorTitle": "編輯 {{name}}（版本 {{version}}）",
    "name": "名稱",
    "description": "說明",
    "body": "提示內文",
    "preview": "轉譯預覽",
    "deleteMessage": "要刪除 {{name}} 嗎？使用它的架構師部署：{{total}}。使用中的提示無法刪除。"
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
})(zhHant, {
 "components": {
  "studio": {
   "canvas": {
    "title": "畫布",
    "appPicker": "應用程式",
    "flowLabel": "應用程式 {{app}} 的畫布",
    "noApp": "草稿中還沒有應用程式。請架構師建立一個，或從現有應用程式開始一份草稿。",
    "calls": "呼叫（{{total}}）",
    "noCalls": "還沒有呼叫。從代理程式的右側邊緣拖曳到另一個代理程式，或在一個代理程式上按 C，再在另一個代理程式上按 Enter。",
    "addLoose": "加入應用程式",
    "remove": "從應用程式移除",
    "removeTitle": "從應用程式移除代理程式",
    "removeMessage": "要從 {{app}} 移除 {{name}} 嗎？它的呼叫也會一併移除。代理程式本身會保留，套用草稿之前即時設定都不會變更。",
    "operationFailed": "{{operation}}遭到拒絕。",
    "operations": {
     "AddMember": "新增代理程式",
     "RemoveMember": "移除代理程式",
     "Connect": "連接",
     "Disconnect": "中斷連接",
     "SetEntry": "設定入口代理程式",
     "MoveNode": "移動代理程式"
    },
    "toolbar": {
     "label": "畫布動作",
     "addAgent": "新增代理程式",
     "addPlaceholder": "代理程式名稱",
     "role": "角色",
     "rolePlaceholder": "角色（選填）",
     "add": "新增",
     "connect": "從此處連接",
     "setEntry": "設為入口代理程式",
     "remove": "移除",
     "disconnect": "中斷連接",
     "fit": "符合畫面"
    },
    "connectBar": {
     "message": "正在從 {{name}} 連接。請選擇它要呼叫的代理程式：按一下該代理程式、在其上按 Enter，或在這裡選擇。",
     "to": "呼叫",
     "fanOut": "平行呼叫",
     "confirm": "連接"
    },
    "keys": {
     "title": "鍵盤快速鍵",
     "tab": "Tab 會依閱讀順序在代理程式之間移動，從入口代理程式開始。",
     "select": "Enter 或 Space 會選取目前焦點所在的代理程式，並開啟其屬性。",
     "connect": "在代理程式上按 C 會從它開始一個呼叫；在另一個代理程式上按 C 或 Enter 即可完成。",
     "entry": "E 會將目前焦點所在的代理程式設為入口代理程式。",
     "remove": "Delete 會在確認後將目前焦點所在的代理程式從應用程式移除。",
     "move": "方向鍵可移動選取的代理程式；按住 Shift 可移動較大距離。短暫停頓後會儲存位置。",
     "add": "N 會跳到「新增代理程式」欄位。",
     "calls": "在呼叫清單中，Enter 選取呼叫，Delete 中斷連接，F 開啟或關閉平行呼叫。",
     "escape": "Escape 會取消你開始的呼叫。"
    },
    "node": {
     "entry": "入口",
     "unreachable": "無法抵達",
     "connecting": "從此處呼叫"
    },
    "a11y": {
     "node": "按 Enter 或 Space 選取此代理程式，再用方向鍵移動它。按 C 連接它，按 E 設為入口代理程式，或按 Delete 移除它。",
     "edge": "兩個代理程式之間的呼叫。請在畫布下方的呼叫清單中選取它。",
     "handle": "連接點",
     "moved": "已將代理程式向{{direction}}移動。新位置：{{x}}, {{y}}。",
     "directions": {
      "up": "上",
      "down": "下",
      "left": "左",
      "right": "右"
     }
    },
    "announce": {
     "added": "已將 {{name}} 加入 {{app}}。",
     "connectStart": "正在從 {{name}} 連接。請移到它要呼叫的代理程式並按 Enter，或按 Escape 取消。",
     "connectCancelled": "已取消連接。",
     "connected": "{{from}} 現在會呼叫 {{to}}。",
     "disconnected": "{{from}} 不再呼叫 {{to}}。",
     "fanOutOn": "{{from}} 現在可以平行呼叫 {{to}}。",
     "fanOutOff": "{{from}} 現在呼叫 {{to}} 時一次只發起一個呼叫。",
     "entry": "{{name}} 現在是 {{app}} 的入口代理程式。",
     "removed": "已從 {{app}} 移除 {{name}}。",
     "selfEdge": "代理程式不能呼叫自己。請選擇另一個代理程式。"
    },
    "summary": {
     "noApp": "沒有可描述的應用程式。",
     "agents_one": "應用程式 {{app}} 有 {{count}} 個代理程式。",
     "agents_other": "應用程式 {{app}} 有 {{count}} 個代理程式。",
     "callCount_one": "它們之間有 {{count}} 個呼叫。",
     "callCount_other": "它們之間有 {{count}} 個呼叫。",
     "entry": "入口代理程式是 {{name}}。",
     "noEntry": "尚未設定入口代理程式。",
     "callParallel": "{{from}} 呼叫 {{to}}，允許平行呼叫，委派深度 {{depth}}。",
     "callSingle": "{{from}} 呼叫 {{to}}，一次一個呼叫，委派深度 {{depth}}。"
    },
    "conflict": {
     "mine": "{{item}} 也已變更。你的編輯仍在面板中；再次儲存前，請將它與新版本比較。",
     "kept": "你對 {{item}} 的編輯仍在面板中。再次儲存即可套用到新版本。",
     "operation": "{{operation}}未套用。請在新版本上再試一次，或略過。",
     "retry": "再試一次"
    },
    "panel": {
     "label": "屬性",
     "tabsLabel": "{{name}} 的屬性",
     "properties": "代理程式",
     "runtime": "執行階段",
     "save": "儲存到草稿",
     "reset": "復原變更",
     "saved": "已儲存 {{item}}。「差異與套用」會顯示此變更。",
     "check": "伺服器對此項目的檢查結果：{{message}}",
     "unparsable": "此項目的 YAML 無法剖析，因此面板無法變更它。請先在「項目」分頁修正。（{{message}}）"
    },
    "agent": {
     "title": "代理程式 {{name}}",
     "isEntry": "這是應用程式的入口代理程式：它負責與使用應用程式的人對話。",
     "notHeld": "草稿中還沒有 {{name}} 的文件。將它帶入草稿即可在這裡編輯；即時設定不會變更。",
     "deleted": "草稿會刪除 {{name}}。請先在「項目」分頁將它還原，才能編輯。",
     "bring": "帶入草稿",
     "description": "描述",
     "inputSchema": "輸入結構描述",
     "outputSchema": "輸出結構描述",
     "schemaHint": "以 JSON 撰寫的 JSON Schema。純文字請留空。",
     "assets": "資產",
     "noAssets": "下一個修訂不會釘選任何資產。",
     "assetsKept": "文件未列出任何資產，因此代理程式會保留現有的資產。",
     "assetName": "資產名稱",
     "assetVersion": "版本",
     "latest": "最新",
     "removeAsset": "移除資產 {{name}}",
     "addAsset": "新增資產",
     "capabilities": "能力",
     "capabilitiesHint": "以逗號分隔名稱。清單留空會清除所有能力。",
     "capabilitiesKept": "以逗號分隔名稱。留空時，代理程式會保留現有的能力。",
     "systemPrompt": "系統提示",
     "noDeployments": "草稿中沒有此代理程式的部署，因此這裡未設定系統提示。",
     "promptLine": "{{environment}}：{{deployment}} 使用 {{prompt}}",
     "builtInPrompt": "內建預設值",
     "showRuntime": "在「執行階段」分頁編輯",
     "errors": {
      "json": "這不是有效的 JSON。",
      "object": "結構描述必須是 JSON 物件，例如 {\"type\": \"object\"}。",
      "version": "請輸入整數，或留空以使用最新版本。"
     }
    },
    "edge": {
     "title": "從 {{from}} 到 {{to}} 的呼叫",
     "from": "呼叫端",
     "to": "被呼叫端",
     "depth": "委派深度",
     "depthHint": "由關係圖推導：一加上 {{to}} 之下最長的呼叫鏈。其下的呼叫變更時，此值也會變更。",
     "fanOut": "平行呼叫（扇出）",
     "fanOutOn": "{{from}} 可以同時對 {{to}} 發起多個呼叫。",
     "fanOutOff": "{{from}} 呼叫 {{to}} 時一次只發起一個呼叫。"
    },
    "app": {
     "title": "應用程式 {{name}}",
     "hint": "在畫布上選取代理程式或呼叫即可編輯。未選取任何項目時，此面板會編輯應用程式。",
     "entry": "入口代理程式",
     "noEntry": "沒有入口代理程式",
     "noMembers": "請先新增代理程式；第一個會成為入口代理程式。",
     "notHeld": "草稿中還沒有 {{name}} 的文件。將它帶入草稿即可在這裡編輯登入方式和品牌。",
     "deleted": "草稿會刪除 {{name}}。請先在「項目」分頁將它還原，才能編輯。",
     "bring": "帶入草稿",
     "description": "描述",
     "authMode": "登入",
     "authDefault": "伺服器預設值",
     "anonymous": "允許匿名使用",
     "branding": "品牌",
     "brandingFields": {
      "displayName": "顯示名稱",
      "logo": "標誌資產",
      "primaryColor": "主要色彩",
      "accentColor": "強調色彩",
      "welcomeText": "歡迎文字"
     },
     "errors": {
      "color": "請使用十六進位色碼，例如 #1F6FEB。"
     }
    },
    "runtime": {
     "title": "{{name}} 的執行階段",
     "none": "草稿中沒有 {{name}} 的部署。請從下方帶入一個即時部署，或請架構師建立一個。",
     "deployment": "環境與部署",
     "option": "{{environment}}：{{name}}",
     "scope": "編輯只會變更 {{environment}} 中的 {{name}}（Harness 設定檔 {{profile}}）。其他環境保留各自的值。",
     "fields": {
      "model": "模型",
      "effort": "投入程度",
      "timeoutSeconds": "時間限制（秒）",
      "maxTurns": "最大回合數",
      "maxBudgetUsd": "預算（USD）",
      "systemTemplate": "系統提示範本",
      "systemVersion": "釘選的版本",
      "approvalsEnabled": "工具呼叫需要核准",
      "approvalDefaultAction": "沒有規則符合時"
     },
     "hints": {
      "timeoutSeconds": "整數秒數，1 或以上。留空則使用 Harness 設定檔的限制。",
      "maxTurns": "整數，1 或以上。留空則由 Harness 決定。",
      "maxBudgetUsd": "0 或以上，例如 2.50。留空表示沒有預算限制。"
     },
     "builtIn": "內建預設值",
     "approvals": "核准",
     "noRules": "沒有規則。每個工具呼叫都會套用預設動作。",
     "rule": {
      "action": "動作",
      "pattern": "工具模式",
      "inputPattern": "輸入模式",
      "inputPlaceholder": "輸入模式（選填）",
      "remove": "移除規則 {{number}}",
      "add": "新增規則"
     },
     "live": "不在草稿中的即時部署",
     "noLive": "此代理程式的每個即時部署都已在草稿中，或它沒有任何即時部署。",
     "bring": "帶入草稿",
     "exportMissing": "{{name}} 的匯出結果沒有包含其文件。",
     "errors": {
      "integer": "請輸入 1 或以上的整數。",
      "number": "請輸入 0 或以上的數字。",
      "pattern": "規則需要工具模式。",
      "version": "請輸入整數，並指定要釘選的範本。"
     }
    }
   }
  }
 },
 "common": {
  "fieldCodes": {
   "NotAMember": "該代理程式不是此應用程式的成員。",
   "SelfEdge": "代理程式不能呼叫自己。",
   "NoSuchEdge": "應用程式中沒有這個呼叫。",
   "AppDeleted": "草稿會刪除此應用程式。請先將它還原。",
   "InvalidDocument": "此文件無法剖析為單一清單文件。",
   "DocumentMismatch": "文件的種類或名稱與項目不符。"
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
})(zhHant, {
 "common": {
  "productName": "Garrison Agent Studio",
  "productLine": "Agent Studio",
  "states": {
   "studioHint": "或者開啟代理程式工作室，描述你的需求：代理程式架構師會起草，由你審閱。",
   "openStudio": "開啟代理程式工作室"
  }
 },
 "nav": {
  "items": {
   "studio": {
    "label": "代理程式工作室"
   },
   "serverInfo": {
    "label": "關於",
    "tip": "產品、版本、連結、端點和你的身分"
   }
  }
 },
 "wizard": {
  "steps": {
   "studio": "代理程式工作室"
  },
  "welcomeItemStudio": "為代理程式架構師指定 Harness 和模型，讓它在代理程式工作室中與你一起設計代理程式和應用程式（選用）。",
  "studioBody": "代理程式架構師在代理程式工作室中與你一起設計代理程式和應用程式。請選擇它執行所用的 Harness 設定檔和模型，以及引導它的架構師提示。它的部署只能編輯你的工作室草稿。你可以略過此步驟，稍後在工作室中建立架構師。",
  "createArchitect": "建立架構師",
  "architectCreated": "已建立代理程式架構師 {{name}}。",
  "architectReady": "代理程式架構師 {{name}} 已就緒。設定完成後，開啟代理程式工作室並用它開始一份草稿。",
  "continue": "繼續"
 },
 "views": {
  "home": {
   "getStartedBody": "設定精靈會新增認證，為代理程式架構師指定 Harness 和模型，套用範例代理程式並執行測試。也可以開啟代理程式工作室，描述你想要的應用程式。",
   "openStudio": "開啟代理程式工作室"
  },
  "studio": {
   "title": "代理程式工作室"
  },
  "studioDraft": {
   "tabs": {
    "release": "發行"
   }
  },
  "serverInfo": {
   "title": "關於",
   "subtitle": "版本、連結、端點，以及你目前登入所用的身分。",
   "positioning": "用你已在使用的代理程式 Harness 建置、部署和執行代理式應用程式。",
   "versions": "伺服器版本 {{server}}，儀表板版本 {{dashboard}}",
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
    "title": "環境與推進",
    "intro": "每個成員在各環境中的部署，以及每個部署固定的修訂和環境變數覆寫。推進前可比較兩個環境，也可以從記錄中復原某次推進。",
    "live": "在 {{environment}} 上線",
    "environments": "環境",
    "source": "比較",
    "target": "與",
    "member": "成員",
    "entry": "入口",
    "noDeployment": "沒有部署",
    "secretOverride": "{{name}}（祕密）",
    "difference": "{{source}} 到 {{target}}",
    "differenceNone": "差異",
    "diff": {
     "Same": "相同",
     "Missing": "{{target}} 中沒有部署",
     "revisions": "修訂不同",
     "overrides": "覆寫不同",
     "both": "修訂和覆寫都不同"
    },
    "promote": "從 {{source}} 推進到 {{target}}",
    "promoteNothing": "推進",
    "missing": "{{target}} 中沒有部署：{{names}}。現在推進會失敗，什麼都不會移動；請先在那裡新增部署。",
    "history": "推進記錄",
    "historyEmpty": "此應用程式尚未推進過。"
   }
  },
  "studio": {
   "release": {
    "title": "發行",
    "app": "應用程式",
    "noAppsTitle": "此草稿不建置任何應用程式",
    "noAppsBody": "在關係圖分頁中或請架構師在草稿中新增應用程式，套用草稿後即可在此推進。",
    "notLiveTitle": "{{name}} 尚未上線",
    "notLiveBody": "請先套用草稿。套用後會發布其代理程式並部署到 dev；之後即可在此推進該應用程式。"
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
})(zhHant, {
 "nav": {
  "items": {
   "architects": {
    "label": "架構師",
    "tip": "代理架構師：可重複使用的代理架構師部署，可在任何工作室草稿中與你一起設計代理和應用程式。"
   }
  }
 },
 "resources": {
  "architects": {
   "title": "架構師",
   "subtitle": "此租用戶中的代理架構師。每一個都是 agent-architect 的部署，擁有自己的 Harness 設定檔、模型和提示，任何工作室草稿都可以使用。",
   "add": "新增架構師",
   "create": "建立架構師",
   "edit": "編輯架構師",
   "view": "架構師詳細資料",
   "deleteTitle": "刪除架構師",
   "emptyTitle": "尚無架構師",
   "emptyBody": "建立一位架構師，在代理工作室中與你一起設計代理和應用程式。選擇它執行時使用的 Harness 設定檔和模型，以及它使用的提示。",
   "columns": {
    "name": "名稱",
    "harnessProfileId": "Harness 設定檔",
    "model": "模型",
    "architectPromptTemplateId": "架構師提示",
    "active": "狀態",
    "description": "描述",
    "id": "ID",
    "lastUpdateUtc": "更新時間",
    "createdUtc": "建立時間"
   },
   "fields": {
    "name": "名稱",
    "description": "描述",
    "harnessProfileId": "Harness 設定檔",
    "model": "模型",
    "architectPromptTemplateId": "架構師提示",
    "architectPromptVersion": "固定的提示版本",
    "active": "啟用"
   },
   "hints": {
    "model": "留空則使用 Harness 設定檔的預設模型。",
    "architectPromptVersion": "留空則一律使用提示的目前版本。"
   },
   "actions": {
    "prompts": "架構師提示",
    "deployment": "部署設定"
   },
   "errors": {
    "nameTaken": "此租用戶中的另一個部署已使用這個名稱。",
    "version": "請輸入從 1 開始的整數，或留空。"
   },
   "promptPinned": "{{name}}（版本 {{version}}）",
   "defaultModel": "設定檔預設",
   "defaultBadge": "預設",
   "promptsTitle": "{{name}} 的架構師提示"
  }
 },
 "components": {
  "studio": {
   "chat": {
    "manageArchitects": "管理架構師"
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
})(zhHant, {
 "components": {
  "confirm": {
   "typeToConfirm": "請在下方方塊中輸入 '{{word}}' 以確認。"
  }
 },
 "views": {
  "agentDetail": {
   "deleted": "已刪除代理 {{name}}。"
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
})(zhHant, {
 "components": {
  "studio": {
   "architect": {
    "credential": "憑證",
    "noCredential": "無",
    "credentialOption": "{{name}}（{{kind}}）"
   },
   "chat": {
    "notCredentialedTitle": "架構師無法登入其模型供應商",
    "notCredentialedBody": "{{architect}} 驗證失敗。請檢查其已儲存連線的憑證；下方的執行錯誤說明了原因。",
    "noCredentialTitle": "這位架構師沒有憑證",
    "noCredentialBody": "{{architect}} 在 {{profile}} 上執行，需要祕密才能登入。沒有祕密時，它的每一輪都會以 Not logged in 失敗。請在架構師頁面為它選擇憑證。",
    "fixCredential": "修正架構師的憑證",
    "openSecrets": "開啟祕密"
   }
  }
 },
 "resources": {
  "architects": {
   "columns": {
    "credentialSecretId": "憑證"
   },
   "fields": {
    "credentialSecretId": "憑證"
   },
   "noCredential": "無"
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
})(zhHant, {
 "components": {
  "dependencyHint": {
   "refresh": "重新整理清單"
  },
  "architectHints": {
   "harness": "內建設定檔（Claude Code、Codex 等）可以直接使用。",
   "harnessLink": "開啟 組態 > Harness 設定檔",
   "credentialNotNeeded": "{{profile}} 不需要憑證。",
   "credentialLink": "開啟 組態 > 祕密",
   "prompt": "變更會從架構師的下一輪開始生效。",
   "promptLink": "開啟 組態 > 提示範本",
   "credentialNoProfile": "Harness 用來登入的祕密。",
   "credentialChosen": "{{profile}} 用來登入的祕密。",
   "credentialPick": "{{profile}} 使用種類為 {{kinds}} 的祕密登入。請選擇一個，否則每一輪都會以 Not logged in 失敗。",
   "credentialAdd": "{{profile}} 使用種類為 {{kinds}} 的祕密登入，但這個租用戶還沒有。請在 組態 > 祕密 中新增一個，再回到這裡選擇它。沒有它，每一輪都會以 Not logged in 失敗。"
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
})(zhHant, {
 "components": {
  "studio": {
   "architect": {
    "intro": "代理架構師會在你的草稿中設計代理和應用程式。請為它指定 Harness 設定檔、用來登入的祕密、模型，以及它使用的提示。它只會編輯你的草稿，從不套用它們。"
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
})(zhHant, {
 "wizard": {
  "studioBody": "代理架構師會在代理工作室中與你一起設計代理和應用程式。請選擇它執行時使用的 Harness 設定檔和模型、它登入時使用的憑證（若上一步儲存的祕密適合該 Harness，會自動選取），以及引導它的架構師提示。它的部署只能編輯你的工作室草稿。你可以略過此步驟，稍後在 代理程式 > 架構師 中建立架構師。"
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
})(zhHant, {
 "components": {
  "secretGuide": {
   "title": "如何取得 {{kind}} 的值",
   "AnthropicApiKey": {
    "s1": "登入 Anthropic Console，開啟 Settings > API keys：",
    "s2": "選擇 Create Key，取個名稱（例如 garrison），然後複製金鑰。它以 sk-ant-api 開頭，只會顯示一次。",
    "s3": "把它貼到「值」。Claude Code、opencode、pi、Mux 和供應商 API Harness 會以 ANTHROPIC_API_KEY 接收它。"
   },
   "ClaudeCodeOAuthToken": {
    "s1": "在任何一台電腦上安裝 Claude Code（如尚未安裝）：",
    "s2": "執行這個指令，並在開啟的瀏覽器視窗中，用代理應使用其 Pro 或 Max 訂閱的 Claude 帳戶登入：",
    "s3": "複製它輸出的權杖。它以 sk-ant-oat 開頭，效期一年；把「到期時間」設為該日期，Garrison 就會顯示何時到期。",
    "s4": "把它貼到「值」。Claude Code 會以 CLAUDE_CODE_OAUTH_TOKEN 接收它。",
    "note": "訂閱權杖使用的是個人的方案，用它為他人提供服務可能違反 Anthropic 的條款。凡是共用的用途，請使用 Anthropic API 金鑰。"
   },
   "OpenAiApiKey": {
    "s1": "登入 OpenAI Platform，開啟 API keys：",
    "s2": "選擇 Create new secret key，選定為執行付費的專案，然後複製金鑰。它以 sk- 開頭，只會顯示一次。",
    "s3": "把它貼到「值」。Codex、opencode、pi、Mux 和供應商 API Harness 會以 OPENAI_API_KEY 接收它。"
   },
   "CodexAuthJson": {
    "s1": "安裝 Codex CLI（如尚未安裝）：",
    "s2": "在一個新的空 Codex 目錄下用你的 ChatGPT 帳戶登入，讓這個登入只屬於 Garrison：",
    "s3": "在同一個終端機中驗證檔案。只有顯示 Valid JSON 時才繼續：",
    "copy": "在 macOS 上，使用以下指令將檔案直接複製到剪貼簿，再貼上到值中。在其他系統上，用文字編輯器開啟 auth.json 並複製整個檔案。請勿複製自動換行的終端機輸出或命令提示字元。",
    "s4": "密鑰成功儲存後，刪除該資料夾，並且不要在其他地方使用此登入。此後由 Garrison 負責更新：",
    "note": "同一登入的兩份複本共用一個重新整理權杖，後更新的一方會使另一方失效。用個人 ChatGPT 方案為他人提供服務可能違反 OpenAI 的條款；共用部署使用 OpenAI API 金鑰比較簡單。"
   },
   "GeminiApiKey": {
    "s1": "開啟 Google AI Studio，用負責付費的 Google 帳戶登入：",
    "s2": "選擇 Create API key，選擇或建立一個 Google Cloud 專案，然後複製金鑰。它以 AIza 開頭。",
    "s3": "把它貼到「值」。Gemini CLI 和 pi 以 GEMINI_API_KEY 接收它，opencode 以 GOOGLE_GENERATIVE_AI_API_KEY 接收。"
   },
   "GenericEnv": {
    "s1": "貼上任何單一的值：Harness 或工具從環境變數讀取的權杖、密碼或 URL。",
    "s2": "用別名把這個祕密繫結到部署，然後新增一個使用它的環境覆寫，例如：",
    "s3": "該變數必須在 Harness 設定檔的憑證允許清單中，否則部署會被拒絕。"
   },
   "GenericFile": {
    "s1": "貼上完整檔案，包含換行：服務帳戶 JSON、憑證或設定檔。",
    "s2": "用別名把這個祕密繫結到部署，並新增一個內容為該祕密的檔案覆寫，例如："
   },
   "BearerToken": {
    "s1": "只貼上權杖，不要加上 Bearer 一字。",
    "s2": "遠端代理把它當作憑證祕密，工作區範本用它複製私人儲存庫（作為使用者 x-access-token 的密碼）。MCP 伺服器可以在寫成 {{secret.<alias>}} 的標頭中傳送它。"
   },
   "BasicAuth": {
    "s1": "依下列格式貼上使用者名稱和密碼：",
    "s2": "用別名把這個祕密繫結到部署，並在範本中以 {{secret.<alias>}} 使用它。"
   },
   "GitCredential": {
    "s1": "若是 GitHub，請建立一個細粒度個人存取權杖，對要複製的儲存庫授予 Contents 讀取權限：",
    "s2": "只貼上權杖；Garrison 會把它當作使用者 x-access-token 的密碼傳送。若是 GitLab、Bitbucket 或其他主機，請改貼 username:token。",
    "s3": "在複製該儲存庫的工作區範本中，把這個祕密選為 Git 憑證。"
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
})(zhHant, {
 "components": {
  "studio": {
   "chat": {
    "wait": {
     "worker": "正在等待工作節點開始這一輪...",
     "phrases": {
      "p1": "正在閱讀你的草稿...",
      "p2": "正在仔細思考...",
      "p3": "正在勾勒代理...",
      "p4": "正在釐清誰呼叫誰...",
      "p5": "正在核對 Garrison 的慣例...",
      "p6": "正在挑選合適的能力...",
      "p7": "正在起草清單...",
      "p8": "正在權衡幾種設計...",
      "p9": "正在安排部署...",
      "p10": "正在檢查提示...",
      "p11": "正在繪製應用程式的關係圖...",
      "p12": "正在尋找更簡單的結構...",
      "p13": "正在複核細節...",
      "p14": "正在把各部分組合起來...",
      "p15": "快好了...",
      "p16": "仍在處理中..."
     }
    },
    "thinkingSummary": "思考過程",
    "metrics": {
     "model": "模型",
     "timeToFirstTokenMs": "TTFT",
     "streamingMs": "串流",
     "totalMs": "總計",
     "inputTokens": "輸入",
     "outputTokens": "輸出",
     "cachedTokens": "快取",
     "reasoningTokens": "推理",
     "outputTokensPerSecond": "權杖/秒",
     "toolCallCount": "工具",
     "costUsd": "費用"
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
})(zhHant, {
 "components": {
  "studio": {
   "chat": {
    "metrics": {
     "title": "本輪詳細資料"
    },
    "tool": {
     "running": "執行中",
     "ok": "完成",
     "failed": "失敗",
     "input": "引數",
     "output": "結果",
     "none": "無",
     "waiting": "正在等待結果..."
    },
    "refs": {
     "apr": "開啟核准",
     "run": "開啟執行",
     "cnv": "開啟對話",
     "agt": "開啟代理程式",
     "sdr": "開啟草稿",
     "plr": "開啟管線執行",
     "tpl": "開啟提示範本"
    },
    "keysHint": "按 Enter 傳送。按 Ctrl+Enter 或 Shift+Enter 換行。",
    "disclaimer": "AI 可能會出錯。請核對所有回答。",
    "continueHint": "繼續對話。"
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
})(zhHant, {
 "nav": {
  "items": {
   "agentWizard": {
    "label": "代理程式精靈",
    "tip": "從描述需求開始，一步步引導你取得在 dev 中執行的已核准代理程式：模型存取、與代理程式架構師一起設計、檢查、核准，以及第一次對話。"
   }
  }
 },
 "resources": {
  "agents": {
   "wizard": "代理程式精靈"
  }
 },
 "common": {
  "states": {
   "studioHint": "也可以開啟代理程式精靈，描述你的需求：它會帶你完成代理程式的建立、核准和試用。",
   "openStudio": "開啟代理程式精靈"
  }
 },
 "views": {
  "home": {
   "openStudio": "開啟代理程式精靈"
  },
  "studioDraft": {
   "back": "返回精靈"
  },
  "agentWizard": {
   "title": "代理程式精靈",
   "subtitle": "描述你的需求。精靈會從這裡帶你取得在 dev 中執行的已核准代理程式。",
   "subtitleDraft": "正在建立：{{title}}",
   "advanced": "進階",
   "stepsLabel": "精靈步驟",
   "back": "上一步",
   "working": "處理中...",
   "steps": {
    "goal": "目標",
    "access": "模型存取",
    "design": "設計",
    "review": "檢查",
    "approve": "核准",
    "test": "試用"
   },
   "goal": {
    "title": "你的代理程式要做什麼？",
    "intro": "幫專案取個名稱，用淺白的話描述這項工作。代理程式架構師會閱讀這些內容，並為它設計一個代理程式或一組代理程式。",
    "name": "專案名稱",
    "namePlaceholder": "研究助理",
    "nameHint": "一個之後認得出來的簡短名稱。這個步驟之後就無法變更。",
    "goal": "代理程式要做的事",
    "goalPlaceholder": "在網路上研究一個主題，附上來源摘要找到的內容，並撰寫一份簡短報告。",
    "goalHint": "說明誰會使用、輸入什麼、應該輸出什麼。架構師需要知道的內容會主動詢問。",
    "next": "開始",
    "resume": "或繼續你的某份草稿",
    "allDrafts": "全部草稿"
   },
   "access": {
    "title": "模型存取",
    "intro": "選擇執行代理程式的 harness，以及它登入時使用的憑證。代理程式架構師與你一起設計時，也會使用同一個 harness 和憑證。",
    "harness": "Harness 設定檔",
    "harnessHint": "執行代理程式的 CLI，例如 Claude Code 或 Codex。",
    "model": "模型",
    "modelHint": "選填。留空則使用 harness 的預設模型。",
    "credential": "憑證",
    "noCredentialNeeded": "{{profile}} 不需要憑證。",
    "credentialIntro": "{{profile}} 使用類型為 {{kinds}} 的密鑰登入。選擇一個已儲存的，或現在新增一個。",
    "noFittingSecret": "你還沒有儲存類型為 {{kinds}} 的密鑰。請在下方新增；取得該值的步驟會一併顯示。",
    "addSecret": "新增憑證",
    "saveSecret": "儲存憑證",
    "architectDescription": "由代理程式精靈設定的代理程式架構師。",
    "next": "繼續設計"
   },
   "design": {
    "title": "與架構師一起設計",
    "intro": "與代理程式架構師聊天。它會詢問需要知道的內容，並在對話中把代理程式建立到你的草稿裡。右側面板會顯示草稿的內容。",
    "contents": "草稿內容",
    "empty": "目前還沒有內容。架構師設計出代理程式後會新增到這裡。",
    "agents": "代理程式",
    "firstMessage": "我想建立這個：{{goal}}\n\n代理程式將在 harness 設定檔 {{profile}} 上執行，使用憑證密鑰 {{secret}}。請先問我任何你需要知道的事，然後在這份草稿中設計代理程式。",
    "chatTitle": "與 {{architect}} 聊天",
    "next": "繼續檢查"
   },
   "review": {
    "title": "檢查",
    "intro": "精靈會將草稿中的每個項目與目前的設定比對。會失敗的項目會退回給架構師修正。",
    "status": {
     "PendingApproval": "這份草稿正在等待核准。請繼續下一步。",
     "Applied": "這份草稿已套用。請繼續下一步。",
     "Discarded": "這份草稿已捨棄。請從第一步開始建立新的。"
    },
    "kind": "類型",
    "name": "名稱",
    "change": "變更",
    "note": "備註",
    "problems_one": "{{count}} 個項目無法套用。",
    "problems_other": "{{count}} 個項目無法套用。",
    "askFix": "請架構師修正",
    "valid": "草稿中的所有內容都通過檢查。請繼續核准。",
    "validate": "重新檢查",
    "fixMessage": "草稿尚未通過驗證。請修正以下問題：\n{{problems}}",
    "next": "繼續核准"
   },
   "approve": {
    "title": "核准",
    "intro": "核准後會套用草稿並讓代理程式上線。接著精靈會為每個代理程式建立一個 dev 部署，讓你可以馬上試用。",
    "reason": "在代理程式精靈中核准。",
    "summary": "草稿包含 {{total}} 個項目，其中有 {{agents}} 個代理程式。它們將在 {{profile}} 上執行，使用憑證 {{secret}}。",
    "will1": "草稿中的所有項目會一起建立或更新。只要有一個失敗，就不會做任何變更。",
    "will2": "每個代理程式都會在你選擇的 harness 上取得一個 dev 部署，並繫結憑證。",
    "will3": "如果你沒有核准權限，請求會等待有權限的人處理，對方做出決定後此頁面會繼續。",
    "approve": "核准並發布",
    "waiting": "正在等待有核准權限的人做出決定。對方決定後此頁面會自動繼續。",
    "openApproval": "開啟核准",
    "retry": "重試",
    "done": "已核准並發布。每個代理程式都有一個可以執行的 dev 部署。",
    "agent": "代理程式",
    "deployment": "dev 部署",
    "what": "精靈執行的動作",
    "actions": {
     "create": "已建立部署",
     "bind": "已繫結憑證",
     "ready": "已就緒"
    },
    "next": "繼續試用"
   },
   "test": {
    "title": "試用",
    "intro": "在 dev 中與新的代理程式對話。滿意後，開啟它進行升級或分享。",
    "talkingTo": "正在與 {{name}} 對話。",
    "empty": "傳送一則訊息開始對話。",
    "message": "訊息",
    "next": "接下來可以做什麼",
    "openAgent": "開啟 {{name}}",
    "openApp": "開啟應用程式 {{name}}",
    "openInvoke": "在 Invoke 中開啟",
    "another": "再建立一個"
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
})(zhHant, {
 "views": {
  "agentWizard": {
   "test": {
    "openApp": "開啟 {{name}} 聊天"
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
})(zhHant, {
 "resources": {
  "apps": {
   "fields": {
    "backgroundColor": "頁面背景",
    "headerColor": "頁首顏色",
    "agentBubbleColor": "智慧代理訊息顏色",
    "fontFamily": "字型",
    "faviconAssetId": "分頁圖示"
   },
   "hints": {
    "displayName": "顯示在聊天頁首和智慧代理的訊息上。可用任意字元，最多 128 個。上面的名稱只是識別碼。",
    "faviconAssetId": "一個圖片資源。留空則使用標誌。",
    "primaryColor": "按鈕和你自己的訊息。",
    "accentColor": "醒目提示、焦點外框和所選對話。",
    "backgroundColor": "對話後面的頁面。",
    "headerColor": "頂端顯示名稱和標誌的列。",
    "agentBubbleColor": "智慧代理的訊息。文字顏色會依對比自動選擇。"
   },
   "faviconFromLogo": "與標誌相同",
   "defaultColor": "預設 {{color}}"
  }
 },
 "enums": {
  "appFont": {
   "System": "系統字型",
   "Sans": "無襯線",
   "Serif": "襯線",
   "Rounded": "圓體",
   "Mono": "等寬"
  }
 },
 "components": {
  "form": {
   "defaultColor": "預設"
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
})(zhHant, {
 "resources": {
  "apps": {
   "fields": {
    "conversationListColor": "對話清單顏色",
    "composerColor": "輸入區顏色",
    "filesColor": "檔案清單顏色"
   },
   "hints": {
    "conversationListColor": "側邊的對話清單。",
    "composerColor": "對話下方輸入訊息的區域。",
    "filesColor": "智慧代理寫入的檔案清單。"
   }
  }
 }
});

// Wizard draft picker and credential-optional Mux endpoints.
Object.assign(zhHant.views.agentWizard.goal, {
  "updated": "更新於 {{date}}",
  "continue": "繼續"
});
Object.assign(zhHant.views.agentWizard.access, {
  "muxEndpoint": "Mux 端點 URL",
  "muxAdapter": "端點配接器",
  "muxOptionalCredential": "憑證（選填）",
  "muxHint": "Mux 可以使用不需要供應商 API 金鑰的端點。請輸入工作節點可存取的端點 URL。只有端點需要驗證時才需選擇憑證。",
  "needEndpoint": "請輸入以 HTTP 或 HTTPS 開頭的有效 Mux 端點 URL。"
});
Object.assign(zhHant.views.agentWizard.design, {
  "firstMessageMux": "我想建構：{{goal}}\n\n請使用 Mux，端點為 {{endpoint}}，配接器為 {{adapter}}，模型為 {{model}}。只有端點需要驗證時才需要 API 金鑰。請先詢問必要的問題，然後在此草稿中設計代理。"
});
Object.assign(zhHant.views.agentWizard.approve.actions, {"configure": "已設定端點"});

// Harness-specific wizard configuration.
Object.assign(zhHant.views.agentWizard.access, {
  "muxEndpoint": "Mux 端點名稱",
  "muxHint": "輸入執行工作節點上 Mux 中設定的端點名稱，例如 local。URL、配接器、模型和驗證均由 Mux 提供。",
  "needEndpoint": "請輸入已設定的 Mux 端點名稱，而非 URL。",
  "providerModelHint": "使用 CLI 模型識別碼，通常為 provider/model。驗證取決於供應商，已儲存的憑證為選填。",
  "optionalCredentialIntro": "{{profile}} 支援 {{kinds}} 類型的已儲存密鑰。供應商要求時請選擇，亦可不使用已儲存憑證繼續。",
  "providerEndpoint": "供應商 API 端點 URL",
  "providerEndpointHint": "此執行框架直接呼叫相容 OpenAI 的 HTTP API。請輸入其基礎 URL 和模型。",
  "providerAnonymous": "供應商端點不需要驗證",
  "needProviderEndpoint": "請輸入不含憑證、查詢參數或片段的有效 HTTP 或 HTTPS 供應商 URL。"
});
Object.assign(zhHant.views.agentWizard.design, {
  "firstMessageMux": "我想建構：{{goal}}\n\n請使用已設定的 Mux 端點 {{endpoint}}。模型和驗證來自 Mux。請先詢問必要的問題，然後在此草稿中設計代理。"
});
Object.assign(zhHant.views.agentWizard.access, {"intro": "選擇執行框架及其連線設定。代理架構師在與你設計時使用相同設定。"});

// Typed inference protocol and authentication editor.
Object.assign(zhHant, {
  "inference": {
    "modelHint": "選擇此端點提供的模型。",
    "title": "推論端點",
    "protocol": "API 協定",
    "baseUrl": "基礎 URL",
    "authentication": "驗證類型",
    "name": "標頭 / 查詢參數名稱",
    "location": "憑證位置",
    "header": "標頭",
    "query": "查詢字串",
    "secret": "憑證密文",
    "addValue": "新增憑證值",
    "username": "使用者名稱密文",
    "password": "密碼密文",
    "hint": "分別選擇協定和驗證。Ollama Cloud 使用持有者權杖驗證；本機 Ollama 通常不需驗證。值會以加密密文儲存。",
    "invalid": "請輸入有效 URL 並選擇所有必要的憑證名稱和密文。",
    "value": "憑證值",
    "auth": {
      "None": "無",
      "BearerToken": "持有者權杖",
      "ApiKey": "API 金鑰",
      "Headers": "標頭值",
      "QueryString": "查詢參數",
      "Basic": "基本驗證"
    }
  }
});

// Shared runtime connections and the configuration navigation split.
zhHant.runtime = {
  "title": "執行框架與端點",
  "connections": "已儲存的連線",
  "templates": "進階執行框架範本",
  "connection": "連線",
  "architect": "架構師",
  "choose": "選擇架構師或連線",
  "harness": "執行框架範本",
  "chooseHarness": "選擇執行框架範本",
  "manage": "管理執行框架與端點",
  "configureFirst": "請先設定並儲存連線。",
  "sharedHint": "在此設定一次。架構師和部署參照此連線，變更將於下次執行時套用。",
  "reuseHint": "直接使用現有架構師，或從已儲存的連線建立。無須重新輸入憑證和端點資訊。",
  "importExport": "匯入 / 匯出"
};
zhHant.nav.hubs.configuration = {"label": "代理資源", "tip": "代理與架構師的連線設定。"};
zhHant.nav.hubs.platformConfiguration = {"label": "平台設定", "tip": "憑證、儲存、價格、配額與通知。"};
zhHant.nav.items.harnessProfiles.label = "執行框架與端點";
zhHant.views.agentWizard.access.intro = "直接使用現有架構師，或從已儲存的連線建立。無須重新輸入憑證和端點資訊。";

zhHant.resources.harnessProfiles.title = zhHant.runtime.title;
zhHant.resources.harnessProfiles.subtitle = zhHant.runtime.sharedHint;
zhHant.components.architectHints.harness = zhHant.runtime.sharedHint;
zhHant.components.architectHints.harnessLink = zhHant.runtime.manage;

Object.assign(zhHant.runtime, {"add": "新增連線", "create": "建立連線", "edit": "編輯連線", "view": "連線詳情"});

zhHant.explainers.harnessProfiles.p2 = zhHant.runtime.sharedHint;
zhHant.explainers.secrets.p2 = zhHant.runtime.sharedHint;

// One connection registry; configuration sections use a menu.
Object.assign(zhHant.runtime, {"title": "連線", "sharedHint": "可重用的執行框架與API端點。設定一次，即可在各代理中選用。", "harness": "連線類型", "chooseHarness": "選擇執行框架或API類型", "customHarness": "自訂執行框架", "advancedLaunch": "進階啟動設定", "advancedArchitect": "架構師選項（選填）", "pickConnection": "選擇連線即可，其模型、端點與憑證均已設定。"});
zhHant.nav.hubs.connections = {"label": "連線", "tip": "可重用的執行框架與API端點。設定一次，即可在各代理中選用。"};
zhHant.nav.hubs.configuration = {"label": "設定", "tip": "管理提示詞、資源、工具伺服器、憑證、儲存和原則。"};
zhHant.nav.items.harnessProfiles.label = "連線";
zhHant.resources.harnessProfiles.title = "連線";
zhHant.components.studio.architect.harnessProfile = zhHant.runtime.connection;

Object.assign(zhHant.runtime, {"emptyTitle": "尚無連線", "apiType": "HTTP API（Ollama / OpenAI相容）"});

zhHant.nav.items.manifests.label = zhHant.runtime.importExport;

zhHant.runtime.manage = "管理連線";
zhHant.components.architectHints.harnessLink = zhHant.runtime.manage;
zhHant.explainers.secrets.p2 = "連線參照這些機密進行驗證。在此更新值，無須重新設定各架構師或部署。";

zhHant.runtime.launchDefaults = "此連線使用現有的啟動設定。如有需要，可在進階啟動設定中編輯。";

// One horizontal workspace navigation level; the wizard selects connections only.
zhHant.nav.hubs.operations = {"label": "執行管理", "tip": "管理已儲存的輸出、模型價格、用量限制和通知。"};
zhHant.nav.hubs.configuration.tip = "代理的提示詞、資源、工具、憑證和工作區。";
zhHant.nav.hubs.manifests = { label: zhHant.runtime.importExport, tip: zhHant.tips.nav.tabs.manifests };
zhHant.runtime.choose = "選擇連線";
zhHant.runtime.reuseHint = "選擇用於設計及執行代理的連線。精靈將自動準備設計助手。";
zhHant.views.agentWizard.access.intro = zhHant.runtime.reuseHint;

zhHant.views.manifests.title = zhHant.runtime.importExport;

zhHant.views.agentWizard.design.intro = "回答架構師的問題，設計你的智慧體。";

zhHant.views.studio.deleteMultiple = "批次刪除";
zhHant.views.studio.deleteMultipleMessage = "永久刪除所選的 {{count}} 個草稿？待處理的套用核准將被取消。已發佈的智慧體和部署不受影響。";

zhHant.views.studio.discard = zhHant.common.actions.delete;
zhHant.views.studio.discardTitle = "刪除草稿";
zhHant.views.studio.discardMessage = "永久刪除 {{title}}？已發佈的智慧體和部署不受影響。";
zhHant.views.studio.discardPendingMessage = "永久刪除 {{title}}？其待處理的套用核准將被取消。已發佈的智慧體和部署不受影響。";
zhHant.views.studio.discarded = "已刪除 {{title}}。";

zhHant.components.studio.chat.resize = "調整聊天大小";
zhHant.components.studio.chat.resizeHint = "拖曳以調整聊天大小。使用上下方向鍵調整高度，或按 Home 重設。";

// Secret reveal (Admin on Secret, audited as SecretRevealed).
zhHant.components.secretReveal = { title: "顯示密鑰值", warning: "顯示後，儲存的值將以明文呈現。每次顯示都會以你的名字記錄在稽核日誌中。完成後請關閉此對話框；該值不會被保留。", value: "值", reveal: "顯示", hide: "隱藏" };
zhHant.tips.secretReveal = { reveal: "解密並顯示儲存的值。伺服器會寫入一筆 SecretRevealed 稽核記錄。", hide: "再次隱藏該值。再次顯示會寫入另一筆稽核記錄。", close: "關閉對話框並捨棄顯示的值。", value: "解密後的值，與儲存的完全一致。請像對待密碼一樣對待它。", copy: "將該值複製到剪貼簿。" };
zhHant.resources.secrets.actions.reveal = "顯示";
zhHant.tips.resources.secrets.actions.reveal = "以明文顯示儲存的值。需要 Secret 的 Admin 權限 (SecretManager 或 TenantAdmin)，並會記錄在稽核日誌中。";
zhHant.tips.resources.secrets.revealNoValue = "此密鑰尚未儲存值。請先使用「設定值」。";
zhHant.enums.auditEventType.SecretRevealed = "密鑰已顯示";
zhHant.tips.enums.auditEventType.SecretRevealed = "擁有 Secret Admin 權限的人讀取了某個密鑰解密後的值。";
zhHant.resources.secrets.subtitle = "供 harness 與整合使用的加密憑證。密鑰管理員可以顯示值；每次顯示都會被稽核。";
zhHant.tips.nav.tabs.secrets = "加密的 API 金鑰與權杖。部署透過別名繫結它們；只有密鑰管理員可以顯示值，每次顯示都會被稽核。";
zhHant.tips.resources.secrets.add = "儲存新的憑證，例如 API 金鑰或權杖，靜態加密。部署透過別名參照它；儲存後，只有擁有 Secret Admin 權限的人可以顯示它。";
zhHant.tips.resources.secrets.value = "密鑰值。儲存時會加密。擁有 Secret Admin 權限的人可以顯示它，每次顯示都會被稽核。";
zhHant.explainers.secrets.p1 = "密鑰是一個加密的值，例如 API 金鑰或權杖。儲存後你可以取代或輪替它。只有擁有 Secret Admin 權限的人 (SecretManager 與 TenantAdmin 角色) 才能讀回它，每次顯示都會記錄在稽核日誌中。";

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
})(zhHant, {
 "nav": {
  "hubs": {
   "autonomy": {
    "label": "自主運作",
    "tip": "能自行持續工作的代理程式：守護者依排程喚醒，照看一項長期職責。"
   }
  },
  "items": {
   "keepers": {
    "label": "守護者",
    "tip": "依排程喚醒、照看長期職責的代理程式"
   }
  }
 },
 "enums": {
  "runKind": {
   "Keeper": "守護者巡檢"
  },
  "resourceType": {
   "Mandate": "守護者（職責）"
  },
  "mandateStatus": {
   "Draft": "草稿",
   "Active": "啟用中",
   "Paused": "已暫停",
   "Frozen": "已凍結",
   "CapReached": "已達預算上限",
   "Retired": "已停用"
  },
  "mandateRevisionState": {
   "Draft": "草稿",
   "Published": "已發布"
  },
  "mandateRevisionSource": {
   "Human": "人員",
   "Board": "委員會",
   "Executive": "主管",
   "Architect": "代理程式架構師"
  },
  "wakeMode": {
   "Fixed": "固定間隔",
   "Backoff": "安靜時退避"
  },
  "wakeSource": {
   "Timer": "排程",
   "Manual": "手動喚醒",
   "Message": "訊息",
   "EscalationAnswer": "已回覆上報",
   "Webhook": "Webhook 回呼",
   "Report": "報告"
  },
  "tickOutcome": {
   "Quiet": "平靜",
   "Acted": "已處理",
   "Attention": "需要關注",
   "Escalated": "已上報",
   "Failed": "失敗",
   "Skipped": "已略過",
   "Unreported": "未回報"
  }
 },
 "errorCodes": {
  "MandateActive": "此守護者有一次巡檢正在執行。請等它結束，或先暫停守護者，也可以直接刪除，這會取消該次巡檢的執行。",
  "MandateNotActive": "只有啟用中的守護者才能被喚醒或暫停。",
  "MandateNotPaused": "只有已暫停的守護者才能恢復。",
  "RemoteAgentUnsupported": "守護者執行於代管部署上，因此遠端代理程式不能作為守護者。",
  "DeploymentInactive": "該部署未啟用。請選擇一個啟用中的部署。",
  "DeploymentAgentMismatch": "該部署屬於另一個代理程式。請選擇此代理程式自己的部署。",
  "RevisionMismatch": "該修訂版屬於另一個守護者。"
 },
 "resources": {
  "runs": {
   "columns": {
    "mandateId": "守護者"
   }
  },
  "keepers": {
   "title": "守護者",
   "subtitle": "依排程喚醒、照看一項長期職責的代理程式，每次都會回報發現的情況。",
   "add": "新增守護者",
   "create": "建立守護者",
   "edit": "編輯守護者",
   "view": "守護者詳細資料",
   "deleteTitle": "刪除守護者",
   "emptyTitle": "尚無守護者",
   "emptyBody": "建立守護者，讓代理程式定期查看佇列、儀表板或收件匣之類的事物，並在需要時自行處理或請求協助。",
   "columns": {
    "name": "名稱",
    "status": "狀態",
    "agent": "代理程式",
    "deployment": "部署",
    "nextWakeUtc": "下次喚醒",
    "currentIntervalSeconds": "間隔",
    "lastTick": "上次巡檢",
    "tickCount": "巡檢次數",
    "currentRevisionNumber": "修訂版",
    "runAs": "執行身分",
    "description": "說明",
    "id": "ID",
    "createdUtc": "建立時間"
   },
   "fields": {
    "name": "名稱",
    "description": "說明",
    "agentId": "代理程式",
    "deploymentId": "部署",
    "objective": "目標",
    "healthyDefinition": "健康狀態的標準",
    "autonomy": "可自行處理的事項",
    "escalationPolicy": "何時請求協助",
    "direction": "目前方向",
    "signals": "需要關注的訊號",
    "signalsItems": {
     "name": "訊號",
     "description": "意義"
    },
    "wakeMode": "喚醒模式",
    "minIntervalSeconds": "最小間隔（秒）",
    "maxIntervalSeconds": "最大間隔（秒）",
    "backoffFactor": "退避係數",
    "jitterPercent": "抖動（百分比）",
    "budgetPerTickUsd": "每次巡檢預算（USD）",
    "budgetPerDayUsd": "每日預算（USD）",
    "maxTokensPerTick": "每次巡檢最大 token 數",
    "changeNote": "變更說明"
   },
   "hints": {
    "name": "小寫字母、數字和連字號。",
    "agentId": "一個代管代理程式。守護者建立後，代理程式無法變更。",
    "deploymentId": "每次巡檢所執行的啟用中部署。",
    "objective": "用平實的話描述這項長期職責。守護者每次巡檢都會讀取它。",
    "minIntervalSeconds": "範圍為 {{min}} 到 {{max}} 秒。叢集設定 Autonomy.MinIntervalSeconds 可能會調高下限。",
    "maxIntervalSeconds": "範圍為 {{min}} 到 {{max}} 秒。退避增長到此值為止。",
    "backoffFactor": "範圍為 {{min}} 到 {{max}}。每次平靜的巡檢之後，間隔都會乘以這個值。",
    "jitterPercent": "範圍為 {{min}} 到 {{max}}。留空則使用叢集預設值。",
    "budgetPerTickUsd": "留空表示不設上限。",
    "budgetPerDayUsd": "留空表示不設上限。",
    "maxTokensPerTick": "輸入與輸出 token 的總和。留空表示不設上限。",
    "changeNote": "說明此修訂版為何要變更守護者。顯示在修訂版清單中。"
   },
   "sections": {
    "mandate": "職責",
    "schedule": "喚醒排程",
    "budgets": "預算"
   },
   "sectionHints": {
    "mandate": "儲存後，這些欄位會作為修訂版 1 發布，並啟動喚醒排程。之後的變更請在守護者頁面使用「新增修訂版」。",
    "budgets": "目前僅儲存，將於後續版本中強制執行。"
   },
   "errors": {
    "name": "請使用 1 到 64 個小寫字母、數字和連字號，並以字母或數字開頭和結尾。",
    "nameTaken": "已有另一個守護者使用此名稱。",
    "text": "最多 {{max}} 個字元。",
    "agentRequired": "請選擇負責這項職責的代理程式。",
    "deploymentRequired": "請選擇其巡檢所執行的部署。",
    "objective": "請描述這項長期職責。",
    "signalsMax": "一個修訂版最多包含 {{max}} 個訊號。",
    "signalName": "訊號名稱為 1 到 {{max}} 個字元。",
    "signalUnique": "每個訊號需要使用不同的名稱。",
    "signalsInvalid": "請修正下方標記的訊號。",
    "interval": "請輸入 {{min}} 到 {{max}} 之間的整數秒數。",
    "maxBelowMin": "最大間隔不能短於最小間隔。",
    "backoffFactor": "請輸入 {{min}} 到 {{max}} 之間的數字。",
    "jitterPercent": "請輸入 {{min}} 到 {{max}} 之間的整數。",
    "budget": "請輸入 {{min}} 到 {{max}} 之間的金額。",
    "maxTokens": "請輸入 {{min}} 到 {{max}} 之間的整數。"
   },
   "actions": {
    "pause": "暫停",
    "resume": "恢復",
    "wake": "立即喚醒",
    "runs": "檢視執行"
   },
   "toasts": {
    "pause": "已暫停 {{name}}。",
    "resume": "已恢復 {{name}}，現在喚醒它。",
    "wake": "{{name}} 現在喚醒。"
   },
   "units": {
    "seconds_other": "{{count}} 秒",
    "minutes_other": "{{count}} 分鐘",
    "hours_other": "{{count}} 小時",
    "days_other": "{{count}} 天"
   },
   "ticking": "巡檢中",
   "neverTicked": "尚未喚醒",
   "addSignal": "新增訊號",
   "signalNamePlaceholder": "佇列深度",
   "editNotice": "以 {{name}} 的身分執行。儲存後，你將成為其巡檢所用的執行身分。若要變更目標或排程，請開啟守護者並使用「新增修訂版」。"
  }
 },
 "components": {
  "keeperRevision": {
   "title": "{{name}} 的新修訂版",
   "intro": "這將成為修訂版 {{number}}。發布後它會立即成為目前版本：退避會重設，守護者隨即被喚醒。",
   "draft": "儲存為草稿",
   "publish": "發布",
   "drafted": "已將修訂版 {{number}} 儲存為草稿。",
   "published": "已發布修訂版 {{number}}。"
  }
 },
 "views": {
  "runDetail": {
   "keeper": "守護者"
  },
  "home": {
   "autonomy": {
    "title": "自主運作",
    "open": "開啟守護者",
    "empty": "尚無守護者。守護者依排程喚醒，照看一項長期職責。",
    "active": "啟用中",
    "paused": "已暫停",
    "ticking": "正在巡檢",
    "nextWake": "下次喚醒：",
    "allQuiet": "沒有需要關注的守護者。",
    "attention_other": "有 {{count}} 個守護者需要關注"
   }
  },
  "keeperDetail": {
   "title": "守護者",
   "heading": "守護者 {{name}}",
   "notFoundTitle": "找不到守護者",
   "notFoundBody": "它可能已被刪除，或屬於另一個租用戶。",
   "live": "即時",
   "polling": "重新整理中",
   "newRevision": "新增修訂版",
   "noWake": "未排程",
   "quietStreak": "連續平靜的巡檢",
   "activeRun": "正在執行的巡檢",
   "revisionTitle": "目前修訂版",
   "revisionHeading": "目前修訂版（{{number}}）",
   "noRevision": "尚未發布任何修訂版。請使用「新增修訂版」撰寫並發布一個。",
   "clusterDefault": "叢集預設值",
   "noLimit": "不設上限",
   "ticks": "巡檢",
   "outcomeFilter": "結果",
   "allOutcomes": "所有結果",
   "noTicksTitle": "尚無巡檢",
   "noTicksActive": "第一次巡檢會在下次喚醒時開始。使用「立即喚醒」可馬上開始一次。",
   "noTicksBody": "守護者啟用並被喚醒後，巡檢會顯示在這裡。",
   "chartTitle": "每次巡檢後的間隔",
   "chartHelp": "到下次喚醒的分鐘數，取每次巡檢結束時設定的值。在退避模式下，平靜的巡檢會使其變長。",
   "chartSeries": "間隔（分鐘）",
   "columns": {
    "started": "開始時間",
    "source": "喚醒來源",
    "outcome": "結果",
    "run": "執行",
    "interval": "下次間隔",
    "cost": "費用",
    "summary": "摘要",
    "number": "編號",
    "state": "狀態",
    "revisionSource": "來源",
    "author": "作者",
    "changeNote": "變更說明",
    "created": "建立時間"
   },
   "requested": "要求了 {{interval}}",
   "revisions": "修訂版",
   "noRevisions": "尚無修訂版。",
   "current": "目前",
   "diff": "比較",
   "diffTitle": "修訂版 {{number}} 與前一個版本的比較",
   "diffFirst": "這是第一個修訂版，因此其中的所有內容都是新增的。",
   "revisionLabel": "修訂版 {{number}}",
   "nothing": "無",
   "confirmDelete": "要刪除守護者 {{name}} 及其修訂版和巡檢歷程嗎？它過去的執行會保留。",
   "confirmForceDelete": "{{name}} 有一次巡檢正在執行。仍要刪除該守護者並取消這次巡檢的執行嗎？",
   "forceDelete": "刪除並取消巡檢",
   "changeNote": "變更說明：{{note}}"
  }
 },
 "tips": {
  "nav": {
   "hubs": {
    "autonomy": "在請求之間自行工作的代理程式。守護者依排程喚醒，查看一項長期職責，並採取行動或請求協助。"
   },
   "tabs": {
    "keepers": "守護者：依排程喚醒、照看一項長期職責的代理程式，附帶其巡檢和修訂版。"
   }
  },
  "enums": {
   "runKind": {
    "Keeper": "由守護者的喚醒啟動。該執行是這個守護者的一次巡檢，並連結回它。"
   },
   "resourceType": {
    "Mandate": "守護者（職責）：代理程式依喚醒排程照看的長期職責，附帶其修訂版和巡檢。"
   },
   "mandateStatus": {
    "Draft": "建立時沒有已發布的修訂版，所以還不會喚醒。發布一個修訂版即可啟動。",
    "Active": "依排程喚醒。每次喚醒會啟動一次巡檢，即其部署的一次執行。",
    "Paused": "在有人恢復之前不會喚醒。恢復後會立即喚醒，並重設間隔。",
    "Frozen": "已被管理員或原則停止。解除凍結之前不會喚醒。",
    "CapReached": "當日預算已用完。下一個 UTC 日開始時會再次喚醒。",
    "Retired": "不再使用。它保留歷程記錄，且不會再喚醒。"
   },
   "mandateRevisionState": {
    "Draft": "已儲存但未使用。發布後它會成為守護者的目前修訂版。",
    "Published": "曾經或正在使用。已發布的修訂版不會變動，請另寫一個新修訂版。"
   },
   "mandateRevisionSource": {
    "Human": "由人員在儀表板、API 或資訊清單中撰寫。",
    "Board": "由監督此守護者的代理程式委員會設定。",
    "Executive": "由指揮此守護者的主管代理程式設定。",
    "Architect": "由代理程式架構師根據工作室草稿撰寫。"
   },
   "wakeMode": {
    "Fixed": "無論上次巡檢發現了什麼，都每隔最小間隔喚醒一次。",
    "Backoff": "每次平靜的巡檢之後等待更久，最長到最大間隔，一旦有事發生就回到最小間隔。"
   },
   "wakeSource": {
    "Timer": "喚醒排程到期，守護者自行喚醒了。",
    "Manual": "有人使用了「立即喚醒」，或恢復了守護者。",
    "Message": "有一則訊息傳給了守護者。",
    "EscalationAnswer": "有人回覆了守護者上報的問題。",
    "Webhook": "另一個系統呼叫了守護者的 Webhook。",
    "Report": "另一個代理程式的報告請這個守護者去查看。"
   },
   "tickOutcome": {
    "Quiet": "一切健康，無須處理。在退避模式下，下次喚醒會更晚。",
    "Acted": "守護者為保持職責健康而變更了某些內容。",
    "Attention": "守護者發現了需要人員查看的情況。",
    "Escalated": "守護者請求某個人或另一個代理程式做出決定。",
    "Failed": "這次巡檢的執行失敗、逾時或被取消。",
    "Skipped": "喚醒到來時上一次巡檢仍在執行，因此被略過，下一次會等它結束。",
    "Unreported": "執行結束時沒有回報結果，所以守護者可能需要更清楚的目標。"
   }
  },
  "resources": {
   "runs": {
    "mandateId": "把這次執行作為自己的一次巡檢啟動的守護者（如果有）。點擊即可開啟該守護者。",
    "openKeeper": "開啟以這次執行作為巡檢的守護者。"
   },
   "keepers": {
    "add": "建立守護者：選擇代管代理程式和部署，描述長期職責，並設定喚醒的頻率。",
    "name": "在此租用戶內唯一的名稱，用於 URL、資訊清單和 API。",
    "status": "守護者是否依排程喚醒（啟用中），或處於等待、暫停、凍結、停用狀態。",
    "agent": "負責這項職責的代管代理程式。每次巡檢都會執行這個代理程式。",
    "deployment": "每次巡檢所執行的部署，它決定了 harness、模型和工具。",
    "nextWakeUtc": "下一次巡檢開始的時間。將游標停留其上可查看確切時間。",
    "currentIntervalSeconds": "上次巡檢之後的等待時間。在退避模式下，它會在平靜的巡檢之後增長。",
    "lastTick": "守護者上次喚醒的時間，以及那次巡檢回報的內容。",
    "tickCount": "守護者累計執行過的巡檢次數。",
    "currentRevisionNumber": "守護者目前遵循的已發布修訂版。",
    "runAs": "每次巡檢所用權限的使用者或認證：最後一次儲存守護者的人。",
    "description": "寫給人看的備註。守護者不會讀取它，它讀取的是目標。",
    "id": "守護者的識別碼，用於 API 和執行記錄。",
    "createdUtc": "守護者的建立時間。",
    "agentId": "負責這項職責的代管代理程式。遠端代理程式不能作為守護者。建立後無法變更。",
    "deploymentId": "該代理程式每次巡檢所執行的啟用中部署。",
    "objective": "用平實的話描述長期職責，例如讓支援佇列中的未處理工單保持在 20 個以下。守護者每次巡檢都會讀取它。",
    "healthyDefinition": "良好狀態是什麼樣子，讓守護者能區分平靜的巡檢和需要行動的巡檢。",
    "autonomy": "守護者無須詢問任何人就可以自行變更的內容。",
    "escalationPolicy": "守護者應在何時停下來，請某個人或另一個代理程式做決定。",
    "direction": "可能經常變化的短期指引，例如本週的重點。",
    "signals": "守護者每次巡檢應檢查的具名指標，以及各自的意義。",
    "signalsItems": {
     "name": "這項指標的簡短名稱，在修訂版內唯一。",
     "description": "這項指標的意義，以及哪些數值值得擔心。"
    },
    "wakeMode": "固定模式每次都依最小間隔喚醒。退避模式會在平靜的巡檢之後等待更久。",
    "minIntervalSeconds": "兩次排程喚醒之間的最短等待時間，單位為秒。",
    "maxIntervalSeconds": "退避模式下兩次排程喚醒之間的最長等待時間，單位為秒。",
    "backoffFactor": "退避模式下，每次平靜的巡檢之後等待時間增長的倍數。2 表示加倍。",
    "jitterPercent": "最多為間隔此百分比的隨機延遲，避免許多守護者在同一時刻喚醒。",
    "budgetPerTickUsd": "一次巡檢最多可花費的美元金額。",
    "budgetPerDayUsd": "此守護者的巡檢每個 UTC 日最多可花費的美元金額。",
    "maxTokensPerTick": "一次巡檢最多可使用的輸入和輸出 token 數。",
    "changeNote": "簡短說明此修訂版為何要變更守護者，隨修訂版一併儲存。",
    "sections": {
     "mandate": "守護者照看什麼，以及它可以自行處理多少事情。",
     "schedule": "守護者多久喚醒一次，以及平靜的巡檢之後等待時間如何變化。",
     "budgets": "守護者的巡檢可花費和可使用的額度上限。"
    },
    "actions": {
     "pause": "停止喚醒此守護者。正在執行的巡檢會完成，恢復之前不會開始新的巡檢。",
     "resume": "重新開始喚醒此守護者。它會立即喚醒，間隔重設為最小值。",
     "wake": "立即開始一次巡檢，而不是等待排程。如果有巡檢正在執行，新的會在它之後開始。",
     "runs": "開啟依此守護者的巡檢篩選後的執行頁面。"
    },
    "ticking": "此守護者有一次巡檢正在執行。"
   }
  },
  "keeperRevision": {
   "done": "關閉此對話方塊。修訂版已依上面列出的調整後的值儲存。",
   "draft": "將此修訂版儲存為草稿而不啟用。之後可在修訂版清單中發布。",
   "publish": "儲存此修訂版並立即設為目前版本。退避會重設，守護者隨即被喚醒。"
  },
  "views": {
   "runDetail": {
    "keeper": "把這次執行作為自己的一次巡檢啟動的守護者。",
    "openKeeper": "開啟該守護者，查看其巡檢和修訂版。"
   },
   "home": {
    "autonomy": {
     "title": "此租用戶中的守護者，以及上次巡檢需要人員處理的守護者。",
     "open": "開啟守護者頁面，建立、暫停、喚醒或編輯守護者。",
     "active": "依排程喚醒的守護者。",
     "paused": "在有人恢復之前不會喚醒的守護者。",
     "ticking": "此刻有巡檢正在執行的守護者。",
     "nextWake": "啟用中的守護者裡最早的排程喚醒時間。",
     "attention": "上次巡檢需要關注、已上報、失敗或未回報的守護者，以及因預算或凍結而停止的守護者。",
     "openKeeper": "開啟此守護者的頁面，查看它的巡檢。"
    }
   },
   "keeperDetail": {
    "openRun": "開啟這次執行的詳細資料頁：其記錄、工具呼叫和結果。",
    "live": "巡檢開始和結束時，更新會透過即時連線送達。",
    "polling": "即時連線無法使用，因此頁面每隔幾秒重新讀取一次守護者。",
    "viewJson": "以 JSON 顯示守護者記錄及其目前修訂版。",
    "newRevision": "以目前版本為起點，撰寫目標、排程或預算的新修訂版。",
    "delete": "刪除此守護者及其修訂版和巡檢歷程。它過去的執行會保留。",
    "forceDelete": "刪除守護者，並取消進行中巡檢的執行。",
    "openAgent": "開啟此守護者所執行的代理程式。",
    "quietStreak": "連續有多少次巡檢發現無事可做。在退避模式下，每一次都會拉長等待時間。",
    "activeRun": "進行中巡檢的執行（如果有）。",
    "revisionTitle": "守護者每次巡檢所遵循的已發布修訂版。",
    "ticks": "此守護者的每一次喚醒，最新的在前：是什麼喚醒了它、它發現了什麼，以及它設定的等待時間。",
    "outcomeFilter": "只顯示具有此結果的巡檢。",
    "outcomeCounts": "此頁面上各個結果的巡檢數量。",
    "chart": "此頁面上每次巡檢之後的等待時間，最早的在左側。在退避模式下它會在平靜的巡檢之後增長，有事發生時重設。",
    "columns": {
     "started": "巡檢開始的時間。將游標停留其上可查看確切時間。",
     "source": "這次巡檢是由什麼喚醒守護者的。",
     "outcome": "這次巡檢的回報：平靜、已處理、需要關注、已上報或失敗。",
     "run": "執行這次巡檢的執行。",
     "interval": "到下次喚醒的等待時間，取這次巡檢結束時設定的值。",
     "cost": "這次巡檢的執行花費，依據模型價目表計算。",
     "summary": "守護者說明的發現或所做的事，或導致巡檢停止的錯誤。",
     "number": "修訂版編號。目前版本會被標出。",
     "state": "草稿修訂版已儲存但未使用；已發布的曾經或正在使用。",
     "revisionSource": "修訂版由誰撰寫：人員、代理程式架構師或監督它的代理程式。",
     "author": "儲存此修訂版的使用者或認證。",
     "changeNote": "此修訂版為何變更守護者。",
     "created": "修訂版的儲存時間。"
    },
    "requested": "守護者要求了這個等待時間，伺服器會把它限制在最小和最大間隔之內。",
    "revisions": "此守護者的所有修訂版，最新的在前。可與前一個版本比較，或發布草稿。",
    "current": "守護者目前遵循的修訂版。",
    "diff": "顯示此修訂版相對於前一個修訂版變更了什麼。"
   }
  }
 },
 "explainers": {
  "keepers": {
   "title": "守護者",
   "p1": "守護者是承擔長期職責的代理程式。它依排程喚醒，查看事情的進展，在自己可以處理的範圍內採取行動，並在每次結束時回報一個簡短的結果。每次喚醒稱為一次巡檢，每次巡檢就是守護者所在部署的一次執行。",
   "p2": "在退避模式下，平靜的巡檢會讓下次喚醒往後延，最多延到最大間隔，其他任何結果都會讓它回到最小間隔。同一時間只會執行一次巡檢：在巡檢期間到來的喚醒要等它結束。",
   "p3": "對目標、排程或預算的變更都以修訂版的形式進行。發布修訂版會使其立即成為目前版本並喚醒守護者，每個修訂版都保留在歷程中，可供比較。"
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
})(zhHant, {
 "nav": {
  "hubs": {
   "autonomy": {
    "tip": "能自行持續工作的代理程式：守護者依排程喚醒，照看一項長期任務；上報是它們向人提出的問題。"
   }
  },
  "items": {
   "escalations": {
    "label": "上報",
    "tip": "代理程式向某人、某個角色或另一個代理程式提出的問題及回覆"
   }
  },
  "escalationsOpen_other": "有 {{count}} 則上報等待回覆"
 },
 "enums": {
  "resourceType": {
   "Escalation": "上報"
  },
  "notificationEvent": {
   "EscalationRaised": "已提出上報",
   "EscalationExpired": "上報已逾時"
  },
  "escalationStatus": {
   "Open": "待回覆",
   "Answered": "已回覆",
   "Expired": "已逾時",
   "Cancelled": "已取消",
   "Withdrawn": "已撤回"
  },
  "escalationSeverity": {
   "Info": "資訊",
   "Warning": "警告",
   "Urgent": "緊急"
  },
  "escalationMode": {
   "NonBlocking": "非阻塞",
   "Blocking": "阻塞"
  },
  "escalationTargetKind": {
   "User": "使用者",
   "Role": "角色",
   "Agent": "代理程式",
   "Manager": "主管"
  },
  "escalationTimeoutAction": {
   "UseDefaultAnswer": "使用預設回覆",
   "Cancel": "取消",
   "EscalateUp": "繼續往上上報"
  },
  "escalationResolutionSource": {
   "User": "某人",
   "Agent": "某個代理程式",
   "Timeout": "逾時",
   "Raiser": "提出它的執行",
   "System": "Garrison"
  }
 },
 "components": {
  "escalations": {
   "passedUp": "已往上轉交",
   "answerTitle": "回覆 {{agent}}",
   "submit": "送出回覆",
   "expires": "{{when}}逾時，之後：{{action}}",
   "question": "問題",
   "context": "背景",
   "choice": "選擇一個選項",
   "default": "預設",
   "defaultAnswer": "預設回覆：{{answer}}",
   "explain": "說明（選填）",
   "text": "回覆",
   "textPlaceholder": "寫下你的回覆。代理程式會把它當作資料，而不是指令。",
   "errors": {
    "choice": "請選擇一個選項。",
    "unknownChoice": "這則上報沒有提供該選項。",
    "text": "請寫下回覆。",
    "textMax": "回覆最多 {{max}} 個字元。"
   },
   "toasts": {
    "answered": "已向 {{agent}} 送出回覆。",
    "passedUp": "這則上報已轉交給另一則上報，請改為回覆那一則。",
    "notOpen": "已有其他人先回覆，或它已逾時。",
    "forbidden": "回覆需要 Escalation 的 Update 權限。"
   }
  }
 },
 "resources": {
  "escalations": {
   "title": "上報",
   "subtitle": "代理程式向某人、某個角色或另一個代理程式提出的問題。待回覆的正在等待回覆；阻塞的會讓其執行一直暫停到那時。",
   "add": "新增上報",
   "create": "建立上報",
   "edit": "編輯上報",
   "view": "上報詳細資料",
   "deleteTitle": "刪除上報",
   "emptyTitle": "沒有上報",
   "emptyBody": "當代理程式用 garrison_escalate 請某人、某個角色或另一個代理程式做決定時，上報會出現在這裡。",
   "columns": {
    "createdUtc": "提出時間",
    "severity": "嚴重程度",
    "status": "狀態",
    "question": "問題",
    "agent": "代理程式",
    "target": "發給",
    "expiresUtc": "逾時時間",
    "answer": "回覆",
    "mode": "模式",
    "mandate": "守護者",
    "resolvedBy": "回覆者",
    "resolutionSource": "解決方式",
    "resolvedUtc": "解決時間",
    "raisingRunId": "提出它的執行",
    "id": "ID"
   },
   "filters": {
    "targetKind": "發給"
   },
   "fields": {
    "status": "狀態",
    "severity": "嚴重程度",
    "mode": "模式",
    "target": "發給",
    "agent": "提出者",
    "raisingRunId": "提出它的執行",
    "mandate": "守護者",
    "mandateTickId": "守護者巡檢",
    "routedRunId": "回覆的執行",
    "parentEscalationId": "轉交自",
    "escalatedToId": "轉交至",
    "timeoutAction": "逾時後",
    "expiresUtc": "逾時時間",
    "createdUtc": "提出時間",
    "leaseEpoch": "租約紀元",
    "context": "背景",
    "options": "選項",
    "answerChoice": "所選項目",
    "answerText": "回覆",
    "resolvedBy": "回覆者",
    "resolutionSource": "解決方式",
    "resolvedUtc": "解決時間"
   },
   "actions": {
    "answer": "回覆",
    "openEscalatedTo": "開啟轉交後的上報",
    "openRun": "開啟提出它的執行",
    "openKeeper": "開啟守護者",
    "cancel": "取消上報"
   },
   "cancelTitle": "要取消這則上報嗎？",
   "cancelMessage": "{{agent}} 將不會收到回覆。這則上報會保留為已取消。",
   "cancelBlocking": "{{agent}} 正在等待這個回覆。取消上報也會取消那次執行。",
   "toasts": {
    "cancelled": "上報已取消。"
   }
  },
  "keepers": {
   "fields": {
    "escalationTargetKind": "上報給",
    "escalationTargetId": "上報對象"
   },
   "noEscalationTarget": "儲存該修訂的人",
   "escalationTargetPlaceholder": "使用者、角色或代理程式的 ID 或名稱",
   "errors": {
    "escalationTargetId": "請指定要上報給的使用者、角色或代理程式。"
   }
  },
  "notifications": {
   "fields": {
    "escalationMinimumSeverity": "上報最低嚴重程度"
   },
   "anySeverity": "任何嚴重程度"
  }
 },
 "views": {
  "escalationDetail": {
   "title": "上報",
   "titleWithAgent": "來自 {{agent}} 的上報",
   "notFoundTitle": "找不到上報",
   "notFoundBody": "它不在這個租用戶中，或已隨租用戶一起刪除。",
   "back": "返回上報清單",
   "open": "這則上報正在等待回覆。",
   "openBlocking": "在這則上報得到回覆之前，提出它的執行處於暫停狀態。",
   "expires": "它將在{{when}}逾時，之後：{{action}}。",
   "passedUp": "沒有人及時回覆，所以這則上報已被轉交。請回覆新的那一則：",
   "question": "問題",
   "chosen": "已選",
   "answer": "回覆"
  },
  "home": {
   "escalations": {
    "title_other": "{{count}} 則上報等待回覆",
    "open": "開啟上報",
    "more_other": "還有 {{count}} 則。"
   }
  }
 },
 "tips": {
  "nav": {
   "escalationsBadge_other": "有 {{count}} 則上報等待回覆。開啟「自主運作」，再開啟「上報」。",
   "tabs": {
    "escalations": "上報：代理程式向某人、某個角色或另一個代理程式提出的問題，待回覆的排在前面，可以回覆或取消。"
   }
  },
  "enums": {
   "resourceType": {
    "Escalation": "執行向某人、某個角色或另一個代理程式提出的問題及其回覆。"
   },
   "notificationEvent": {
    "EscalationRaised": "某個代理程式提出了上報。端點可以略過低於最低嚴重程度的上報。",
    "EscalationExpired": "一則上報在有人回覆之前逾時了。"
   },
   "escalationStatus": {
    "Open": "等待回覆。阻塞的上報會讓其執行一直暫停到那時。",
    "Answered": "有人已回覆；提出它的執行或守護者已收到回覆。",
    "Expired": "逾時前沒有人回覆，已執行逾時動作。",
    "Cancelled": "有人取消了它；等待它的執行也已取消。",
    "Withdrawn": "提出它的代理程式撤回了問題。"
   },
   "escalationSeverity": {
    "Info": "僅供參考：方便時再回覆。",
    "Warning": "需要盡快決定。這是預設嚴重程度。",
    "Urgent": "需要立即決定。排在最前面，並傳送給所有訂閱的端點。"
   },
   "escalationMode": {
    "NonBlocking": "執行繼續進行，稍後再取得回覆；守護者在下一次巡檢中收到。",
    "Blocking": "執行暫停，直到有人回覆，然後帶著回覆繼續。"
   },
   "escalationTargetKind": {
    "User": "某一個人，以使用者 ID 或電子郵件指定。",
    "Role": "擁有該角色且可以更新上報的任何人。",
    "Agent": "另一個代理程式：它預設的作用中部署會啟動一次執行來接收問題。",
    "Manager": "代理程式在組織中的主管。在組織功能上線前無法使用。"
   },
   "escalationTimeoutAction": {
    "UseDefaultAnswer": "無人及時回覆時，以預設回覆作答。",
    "Cancel": "無人及時回覆時，取消上報以及等待它的執行。",
    "EscalateUp": "無人及時回覆時，把問題轉交給守護者的預設上報對象。"
   },
   "escalationResolutionSource": {
    "User": "有人回覆或取消了它。",
    "Agent": "另一個代理程式用 garrison_answer_escalation 回覆了它。",
    "Timeout": "由逾時動作解決。",
    "Raiser": "提出它的執行撤回了它。",
    "System": "由 Garrison 解決，例如它的執行結束時。"
   }
  },
  "components": {
   "escalations": {
    "passedUp": "沒有人及時回覆，所以問題已轉交給另一則上報。請回覆那一則。",
    "submit": "送出回覆。暫停的執行會繼續，守護者會帶著回覆喚醒。",
    "question": "代理程式原樣寫下的問題。",
    "context": "代理程式對情況的描述。這是代理程式寫的文字，不是給你的指令。",
    "choice": "代理程式提供了這些選項。請選擇一個。",
    "defaultChoice": "預設回覆：上報以「使用預設回覆」逾時時會使用它。",
    "pickChoice": "選擇此選項。",
    "explain": "隨選擇一起送出的選填文字，例如理由。",
    "text": "你的回覆。代理程式會把它當作資料接收。"
   }
  },
  "resources": {
   "escalations": {
    "createdUtc": "代理程式提出它的時間。暫留可查看確切時間。",
    "severity": "代理程式認為的緊急程度。",
    "status": "待回覆、已回覆、已逾時、已取消或已撤回。",
    "question": "代理程式原樣寫下的問題。暫留可查看完整問題。",
    "agent": "提出它的執行所屬的代理程式。",
    "target": "發給誰：某個使用者、某個角色或另一個代理程式。",
    "expiresUtc": "無人回覆時的逾時時間。",
    "answer": "所選的選項或回覆內容。",
    "mode": "阻塞的上報會讓執行暫停到得到回覆；非阻塞的不會。",
    "mandate": "提出它的巡檢所屬的守護者（如有）。",
    "resolvedBy": "回覆或取消它的人。",
    "resolutionSource": "解決它的方式：某人、某個代理程式、逾時，或提出它的執行。",
    "resolvedUtc": "被回覆、取消、撤回或逾時的時間。",
    "raisingRunId": "提出它的執行。可從列選單開啟。",
    "id": "上報 ID（esc_...），用於 API 和 MCP 工具。",
    "routedRunId": "為讓另一個代理程式回覆而啟動的執行。",
    "mandateTickId": "提出它的守護者巡檢。",
    "parentEscalationId": "逾時後轉交給這則上報的上報。",
    "escalatedToId": "這則上報逾時後被轉交到的上報。",
    "timeoutAction": "無人及時回覆時會發生什麼。",
    "leaseEpoch": "執行提出上報時的租約紀元。阻塞等待屬於該紀元。",
    "context": "代理程式對情況的描述。這是代理程式寫的文字，不是給你的指令。",
    "options": "代理程式提供的回覆。以「使用預設回覆」逾時時會使用預設項目。",
    "answerChoice": "所選的選項。",
    "answerText": "回覆內容。",
    "actions": {
     "answer": "用其中一個選項或自由文字回覆這則上報。",
     "openEscalatedTo": "開啟這則上報被轉交到的上報。",
     "openRun": "開啟提出它的執行。",
     "openKeeper": "開啟提出它的巡檢所屬的守護者。",
     "cancel": "不回覆直接取消。等待它的執行也會被取消。"
    }
   },
   "keepers": {
    "escalationTargetKind": "守護者沒有指定對象時，它的上報發給誰；逾時的上報也會轉交到這裡。",
    "escalationTargetId": "要上報給的使用者 ID 或電子郵件、角色名稱，或代理程式 ID 或名稱。"
   },
   "notifications": {
    "escalationMinimumSeverity": "只傳送達到此嚴重程度以上的上報事件。適用於「已提出上報」和「上報已逾時」。"
   }
  },
  "views": {
   "escalationDetail": {
    "openRun": "開啟這次執行。",
    "openEscalation": "開啟這則上報。",
    "back": "返回上報清單。",
    "viewJson": "依 API 傳回的原樣顯示這則上報。",
    "question": "代理程式寫下的問題和背景，以及它提供的選項。",
    "answer": "這則上報是如何解決的。",
    "openAgent": "開啟提出它的代理程式。",
    "openKeeper": "開啟提出它的巡檢所屬的守護者。"
   },
   "home": {
    "escalations": {
     "title": "等待回覆的上報，最緊急的排在前面。",
     "open": "開啟上報清單。"
    }
   }
  },
  "filters": {
   "severity": "只顯示此嚴重程度的上報。選擇「全部」可移除篩選。",
   "targetKind": "只顯示發給使用者、角色或代理程式的上報。選擇「全部」可移除篩選。"
  }
 },
 "explainers": {
  "escalations": {
   "title": "上報",
   "p1": "上報是代理程式在不該獨自決定時提出的問題。它可以發給某個使用者、擁有某個角色的所有人，或另一個代理程式，並可附帶選項、預設回覆、嚴重程度和逾時時間。",
   "p2": "大多數上報是非阻塞的：執行繼續進行，守護者在下一次巡檢中看到回覆。阻塞的上報會暫停其執行，一旦有人回覆，執行就帶著回覆繼續。",
   "p3": "如果沒有人及時回覆，就執行逾時動作：使用預設回覆、取消，或把問題轉交給守護者的預設上報對象。回覆以資料形式送達代理程式，不會擴大它的權限。"
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
})(zhHant, {
 "nav": {
  "items": {
   "freezes": {
    "label": "凍結",
    "tip": "對代理程式、部署、守護者和應用程式的制動，以及自主運作的緊急停止開關"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Freeze": "凍結"
  },
  "auditEventType": {
   "FreezeApplied": "已套用凍結",
   "FreezeLifted": "已解除凍結",
   "KillSwitchChanged": "緊急停止開關已變更",
   "BoardDirectionGiven": "已下達董事會指示"
  },
  "notificationEvent": {
   "FreezeApplied": "已套用凍結",
   "MandateCapReached": "守護者達到支出上限"
  },
  "freezeTargetKind": {
   "Agent": "代理程式",
   "Deployment": "部署",
   "Mandate": "守護者",
   "App": "應用程式",
   "OrgUnit": "組織單位",
   "Organization": "組織",
   "TenantAutonomy": "緊急停止開關"
  }
 },
 "errorCodes": {
  "Frozen": "已被凍結：在解除凍結之前，新的執行都會被拒絕。",
  "AlreadyFrozen": "已經被凍結。請先解除那個凍結，或維持不變。",
  "FreezeLifted": "已有人解除了這個凍結。",
  "KillSwitch": "自主運作的緊急停止開關已開啟，因此守護者的執行會被拒絕。",
  "MandateBudgetExceeded": "這個守護者已用完本次巡檢或今天的預算。",
  "OrganizationsUnavailable": "組織凍結將隨組織功能一起提供。請改為凍結代理程式、部署、守護者或應用程式。"
 },
 "freezes": {
  "killSwitchTarget": "自主運作的緊急停止開關",
  "freezeTitle": "要凍結嗎？",
  "freezeMessage": "要凍結 {{target}} 嗎？在解除凍結之前，新的執行都會被拒絕，範圍內的守護者也不再喚醒。",
  "freezePickMessage": "選擇要凍結的對象。在解除凍結之前，新的執行都會被拒絕，範圍內的守護者也不再喚醒。",
  "pickTarget": "請選擇...",
  "reasonPlaceholder": "原因是什麼？看到這個凍結的人會讀到這段文字。",
  "liftTitle": "要解除這個凍結嗎？",
  "liftMessage": "要解除 {{target}} 的凍結嗎？新的執行會重新被接受。",
  "liftKeeperMessage": "要解除 {{target}} 的凍結嗎？守護者會重新啟用，下一次喚醒會分散在一個短時間範圍內。",
  "bannerOwn": "已凍結：在解除凍結之前，新的執行都會被拒絕。",
  "bannerTarget": "{{target}} 已被凍結：它的新執行會被拒絕。",
  "bannerKillSwitch": "自主運作的緊急停止開關已開啟：此租用戶中不會開始任何守護者巡檢。",
  "bannerBy": "由 {{who}} 於 {{when}} 凍結。",
  "bannerReason": "原因：{{reason}}",
  "openTarget": "開啟",
  "status": {
   "active": "生效中",
   "lifted": "已解除"
  },
  "fields": {
   "targetKind": "凍結對象類型",
   "target": "對象",
   "reason": "原因（選填）",
   "liftReason": "解除原因（選填）",
   "cancelActiveRuns": "同時取消已在進行的執行"
  },
  "actions": {
   "freeze": "凍結",
   "freezeAny": "選擇對象並凍結",
   "lift": "解除凍結",
   "openTarget": "開啟被凍結的對象"
  },
  "errors": {
   "reasonMax": "原因最多 {{max}} 個字元。",
   "target": "請選擇要凍結的對象。"
  },
  "toasts": {
   "frozen": "{{target}} 已被凍結。",
   "frozenCancelled_other": "{{target}} 已被凍結，並取消了 {{count}} 個進行中的執行。",
   "lifted": "{{target}} 的凍結已解除。"
  },
  "killSwitch": {
   "title": "自主運作緊急停止開關",
   "on": "開",
   "off": "關",
   "turnOn": "開啟",
   "turnOff": "關閉",
   "help": "緊急停止開關開啟期間，不會開始任何守護者巡檢，守護者的執行也會被拒絕。由人員和 API 憑證發起的呼叫照常運作。",
   "changedBy": "由 {{who}} 於 {{when}} 開啟。",
   "onTitle": "要開啟緊急停止開關嗎？",
   "onMessage": "在關閉開關之前，此租用戶中的所有守護者都不再喚醒，守護者的執行也會被拒絕。已在進行的巡檢會完成。",
   "offTitle": "要關閉緊急停止開關嗎？",
   "offMessage": "守護者會重新開始喚醒，下一次喚醒會分散在一個短時間範圍內。",
   "toasts": {
    "on": "緊急停止開關已開啟。不會開始任何守護者巡檢。",
    "off": "緊急停止開關已關閉。守護者會重新喚醒。"
   }
  }
 },
 "resources": {
  "freezes": {
   "title": "凍結",
   "subtitle": "在有人解除之前，拒絕代理程式、部署、守護者或應用程式新執行的制動。緊急停止開關也顯示在這裡。",
   "add": "新增凍結",
   "create": "建立凍結",
   "edit": "編輯凍結",
   "view": "凍結詳細資料",
   "deleteTitle": "刪除凍結",
   "emptyTitle": "沒有凍結",
   "emptyBody": "目前沒有任何凍結。可以在代理程式、部署、守護者或應用程式的頁面上凍結，或使用「選擇對象並凍結」。",
   "columns": {
    "createdUtc": "凍結時間",
    "status": "狀態",
    "targetKind": "類型",
    "target": "對象",
    "reason": "原因",
    "createdBy": "凍結者",
    "cancelledRunCount": "已取消的執行",
    "liftedUtc": "解除時間",
    "liftedBy": "解除者",
    "liftReason": "解除原因",
    "targetId": "對象 ID",
    "id": "ID"
   }
  }
 },
 "views": {
  "home": {
   "autonomy": {
    "freezes_other": "{{count}} 個凍結生效中"
   }
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "freezes": "凍結：對代理程式、部署、守護者和應用程式的制動，生效中的排在前面，可凍結和解除。"
   }
  },
  "enums": {
   "resourceType": {
    "Freeze": "阻止代理程式、部署、守護者或應用程式新執行的凍結，以及自主運作的緊急停止開關。"
   },
   "auditEventType": {
    "FreezeApplied": "有人凍結了代理程式、部署、守護者或應用程式。",
    "FreezeLifted": "有人解除了一個凍結。",
    "KillSwitchChanged": "有人開啟或關閉了自主運作的緊急停止開關。",
    "BoardDirectionGiven": "有人從董事會向 CEO 守護者下達了指示。"
   },
   "notificationEvent": {
    "FreezeApplied": "有人凍結了代理程式、部署、守護者或應用程式，或開啟了緊急停止開關。",
    "MandateCapReached": "某個守護者達到每日支出上限，在下一個 UTC 日之前不再喚醒。"
   },
   "freezeTargetKind": {
    "Agent": "代理程式的所有部署：新的執行會被拒絕，它的守護者不再喚醒。",
    "Deployment": "一個部署：新的執行會被拒絕，在其上執行的守護者不再喚醒。",
    "Mandate": "一個守護者：在解除凍結之前不再喚醒。",
    "App": "一個應用程式：其聊天中的新對話和新訊息會被拒絕。",
    "OrgUnit": "一個組織單位。組織功能推出之前無法使用。",
    "Organization": "整個組織。組織功能推出之前無法使用。",
    "TenantAutonomy": "緊急停止開關：整個租用戶中不會開始任何守護者巡檢。"
   }
  },
  "freezes": {
   "denied": "你無權執行此操作。需要對凍結擁有 {{operation}} 權限。",
   "openTarget": "開啟這個凍結所阻止對象的頁面。",
   "status": {
    "active": "生效中：範圍內新的執行會被拒絕。",
    "lifted": "已有人解除；執行會重新被接受。"
   },
   "actions": {
    "freeze": "凍結：在解除之前，新的執行都會被拒絕，範圍內的守護者不再喚醒。需要先確認。",
    "freezeAny": "選擇一個代理程式、部署、守護者或應用程式並凍結它。需要先確認。",
    "lift": "解除凍結，讓新的執行重新被接受。需要先確認。"
   },
   "fields": {
    "targetKind": "凍結一個代理程式（及其所有部署）、一個部署、一個守護者或一個應用程式。",
    "target": "要凍結的記錄。",
    "reason": "選填。顯示在凍結橫幅和稽核記錄中。",
    "liftReason": "選填。與凍結一起記錄，並寫入稽核記錄。",
    "cancelActiveRuns": "同時取消範圍內已在排隊或正在進行的執行。不選的話，它們會執行完畢。"
   },
   "filters": {
    "active": "只顯示生效中的凍結或只顯示已解除的凍結。選擇「全部」可同時顯示。",
    "targetKind": "只顯示此類型的凍結。選擇「全部」可移除篩選。"
   },
   "killSwitch": {
    "title": "一個能停止此租用戶中所有守護者的開關。一般呼叫照常運作。",
    "on": "開：不會開始任何守護者巡檢，守護者的執行會被拒絕。",
    "off": "關：守護者按排程喚醒。",
    "turnOn": "停止此租用戶中的所有守護者。需要先確認。",
    "turnOff": "讓守護者重新喚醒。需要先確認。"
   }
  },
  "resources": {
   "freezes": {
    "createdUtc": "凍結的時間。將指標停在上方可查看確切時間。",
    "status": "凍結生效期間為「生效中」，之後為「已解除」。",
    "targetKind": "被凍結記錄的類型。",
    "target": "被凍結的代理程式、部署、守護者或應用程式。",
    "reason": "凍結的原因。將指標停在上方可查看全文。",
    "createdBy": "執行凍結的人。",
    "cancelledRunCount": "在要求取消時，凍結取消的進行中執行數量。",
    "liftedUtc": "解除凍結的時間。",
    "liftedBy": "解除凍結的人。",
    "liftReason": "解除凍結的原因。",
    "targetId": "被凍結記錄的 ID。",
    "id": "凍結的 ID（mfz_...），用於 API 和 MCP 工具。"
   }
  },
  "views": {
   "home": {
    "autonomy": {
     "freezes": "開啟生效中的凍結清單。"
    }
   }
  },
  "filters": {
   "active": "只顯示啟用的記錄或只顯示停用的記錄。選擇「全部」可同時顯示。"
  }
 },
 "explainers": {
  "freezes": {
   "title": "凍結",
   "p1": "凍結是一種制動。生效期間，Garrison 會以 409 Frozen 拒絕被凍結的代理程式、部署、守護者或應用程式的新執行，範圍內的守護者也不再喚醒。已在進行的執行會完成，除非凍結同時取消了它們。",
   "p2": "可以在代理程式、部署、守護者或應用程式的頁面上凍結，也可以在這裡使用「選擇對象並凍結」。解除凍結後，執行會重新被接受；被凍結的守護者會重新啟用，下一次喚醒會分散在一個短時間範圍內。",
   "p3": "設定和首頁上的自主運作緊急停止開關會一次停止租用戶中所有守護者的巡檢。它在這裡顯示為類型為「緊急停止開關」的凍結。"
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
})(zhHant, {
 "nav": {
  "items": {
   "memory": {
    "label": "記憶",
    "tip": "代理程式和人員儲存的內容，依範圍列出，並顯示每筆項目的寫入者和時間"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Memory": "記憶"
  },
  "memoryScopeKind": {
   "Agent": "代理程式",
   "App": "應用程式",
   "OrgUnit": "組織單位",
   "Organization": "組織"
  }
 },
 "errorCodes": {
  "MemoryVersionConflict": "這筆記憶在你載入後已被變更。請重新載入後再做決定。",
  "MemoryDisabled": "此伺服器已關閉代理程式記憶，因此無法讀取項目文字，也無法刪除項目。"
 },
 "memory": {
  "legacy": "舊版",
  "deletedScope": "{{id}}（已刪除）",
  "neverRead": "從未",
  "noExpiry": "永不",
  "deleteTitle": "刪除這筆記憶？",
  "deleteMessage": "從 {{scope}} 中刪除 {{key}}？尋找它的代理程式將什麼也找不到，其文字也會被移除。此操作無法復原。",
  "deleteVersion": "將刪除你載入的版本 {{version}}。如果之後有人寫入了較新的版本，刪除會被拒絕。",
  "deleteReloaded": "已重新載入：該項目現在是版本 {{version}}。刪除會移除此版本。",
  "scopes": {
   "label": "記憶範圍",
   "all": "所有範圍",
   "totals_other": "{{entries}} 筆，{{bytes}}",
   "loadFailed": "無法載入記憶範圍。",
   "empty": {
    "Agent": "還沒有代理程式儲存記憶。",
    "App": "還沒有應用程式擁有共用記憶。",
    "OrgUnit": "還沒有組織單位擁有記憶。",
    "Organization": "還沒有組織擁有記憶。"
   }
  },
  "filters": {
   "search": "搜尋",
   "searchPlaceholder": "鍵、類別或標籤",
   "categoryPlaceholder": "類別",
   "tag": "標籤",
   "tagPlaceholder": "標籤",
   "writer": "寫入者"
  },
  "actions": {
   "viewContent": "檢視內容",
   "copyId": "複製 ID",
   "openRun": "開啟寫入它的執行",
   "reload": "重新載入項目"
  },
  "viewer": {
   "title": "記憶項目",
   "content": "已儲存的內容",
   "untrusted": "這是代理程式或人員儲存的資料。它依儲存原樣以純文字顯示，其中的任何內容都不會被執行、轉譯或遵從。",
   "loading": "正在載入已儲存的文字...",
   "empty": "此項目沒有文字。"
  },
  "errors": {
   "conflict": "自你載入版本 {{version}} 以來有人變更了此項目，因此未刪除。請重新載入以查看其目前內容。",
   "gone": "此項目已不存在。可能已被其他人刪除。"
  },
  "toasts": {
   "deleted": "已刪除 {{key}}。",
   "copied": "已複製項目 ID。"
  }
 },
 "resources": {
  "memory": {
   "title": "記憶",
   "subtitle": "代理程式和人員儲存的內容，依範圍列出：每筆項目由誰、何時、從哪次執行寫入，以及大小。開啟項目即可閱讀，刪除不應保留的內容。",
   "add": "新增記憶項目",
   "create": "建立記憶項目",
   "edit": "編輯記憶項目",
   "view": "記憶項目",
   "deleteTitle": "刪除記憶項目",
   "emptyTitle": "還沒有記憶",
   "emptyBody": "代理程式在執行時使用 garrison_memory 工具儲存記憶。寫入項目後，它會依範圍顯示在這裡。",
   "columns": {
    "key": "鍵",
    "scope": "範圍",
    "category": "類別",
    "tags": "標籤",
    "writer": "寫入者",
    "lastUpdateUtc": "最近寫入",
    "lastReadUtc": "最近讀取",
    "version": "版本",
    "bytes": "大小",
    "expiresUtc": "到期時間",
    "writerRunId": "寫入它的執行",
    "createdUtc": "建立時間",
    "sha256": "SHA-256 雜湊",
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
})(zhHant, {
 "nav": {
  "items": {
   "reports": {
    "label": "報告",
    "tip": "代理程式和人員提交的狀態報告、事件、決策和交接，附帶健康狀況和指標"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Report": "報告"
  },
  "notificationEvent": {
   "ReportUnhealthy": "提交了異常報告"
  },
  "reportKind": {
   "Status": "狀態",
   "Incident": "事件",
   "Decision": "決策",
   "Handoff": "交接",
   "Brief": "簡報"
  },
  "reportHealth": {
   "Healthy": "正常",
   "Degraded": "降級",
   "Unhealthy": "異常",
   "Unknown": "未知"
  },
  "reportAudience": {
   "Manager": "直屬主管",
   "Chain": "整條管理鏈",
   "Board": "董事會"
  },
  "reportIssueSeverity": {
   "Low": "低",
   "Medium": "中",
   "High": "高"
  }
 },
 "reports": {
  "untrusted": "這份報告由代理程式或人員撰寫。其標題、內文、指標、問題和決策都依提交時的原樣以純文字顯示；其中的內容不會被執行、轉譯或當作指示遵從。",
  "period": "{{from}} 至 {{to}}",
  "periodFrom": "自 {{from}} 起",
  "periodTo": "截至 {{to}}",
  "filters": {
   "author": "作者",
   "app": "應用程式",
   "from": "提交時間晚於",
   "to": "提交時間早於"
  },
  "actions": {
   "file": "提交報告",
   "copyId": "複製 ID",
   "openRun": "開啟執行",
   "openKeeper": "開啟守護者",
   "openAuthor": "開啟作者"
  },
  "toasts": {
   "filed": "已提交 {{title}}。",
   "copied": "已複製報告 ID。"
  },
  "file": {
   "title": "提交報告",
   "intro": "記下目前的情況。所有能閱讀報告的人都會在這裡看到它，健康狀況為異常的報告會通知訂閱了該事件的端點。報告提交後無法修改。",
   "noAgent": "不指定代理程式（以我本人的名義）",
   "fields": {
    "title": "標題",
    "kind": "類型",
    "health": "健康狀況",
    "audience": "讀者",
    "agent": "代表代理程式提交",
    "body": "內文"
   },
   "errors": {
    "title": "請為報告填寫 1 到 {{max}} 個字元的標題。",
    "body": "內文最多 {{max}} 位元組。"
   }
  },
  "chart": {
   "metric": "指標",
   "title": "{{metric}} 隨時間變化",
   "help_other": "{{agent}} 回報的 {{count}} 個值，依時間由早到晚排列。",
   "noMetrics": "這份報告沒有指標，因此沒有可繪製的內容。",
   "noAuthor": "這份報告不是由代理程式撰寫的，因此沒有作者的歷史可繪製。",
   "empty": "這個指標還沒有任何值。",
   "failed": "無法載入指標歷史。"
  }
 },
 "views": {
  "reportDetail": {
   "title": "報告",
   "notFoundTitle": "找不到報告",
   "notFoundBody": "它不在這個租用戶中，或已隨租用戶一起刪除。",
   "back": "返回報告清單",
   "body": "內文",
   "metrics": "指標",
   "chart": "指標歷史",
   "issues": "問題",
   "decisions": "決策",
   "noBody": "這份報告沒有內文。",
   "noMetrics": "這份報告沒有指標。",
   "noIssues": "沒有回報任何問題。",
   "noDecisions": "沒有記錄任何決策。",
   "columns": {
    "name": "名稱",
    "value": "值",
    "unit": "單位"
   },
   "fields": {
    "health": "健康狀況",
    "kind": "類型",
    "audience": "讀者",
    "author": "作者",
    "period": "時間範圍",
    "createdUtc": "提交時間",
    "filedBy": "提交者",
    "runId": "執行",
    "mandateId": "守護者",
    "mandateTickId": "守護者巡檢",
    "app": "應用程式",
    "orgUnitId": "組織單位"
   }
  }
 },
 "resources": {
  "reports": {
   "title": "報告",
   "subtitle": "代理程式和人員向上提交的內容：目前情況、事件、決策和交接，附帶健康狀況和指標。開啟一份報告即可閱讀，並查看某個指標隨時間的變化。",
   "add": "提交報告",
   "create": "提交報告",
   "edit": "報告",
   "view": "報告詳細資料",
   "deleteTitle": "刪除報告",
   "emptyTitle": "還沒有報告",
   "emptyBody": "代理程式在執行時使用 garrison_file_report 工具提交報告，人員可以在這裡或透過 API 提交。提交後會顯示在這裡。",
   "columns": {
    "createdUtc": "提交時間",
    "title": "標題",
    "author": "作者",
    "kind": "類型",
    "health": "健康狀況",
    "app": "應用程式",
    "period": "時間範圍",
    "issues": "問題",
    "audience": "讀者",
    "filedBy": "提交者",
    "runId": "執行",
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
})(zhHant, {
 "nav": {
  "items": {
   "messages": {
    "label": "訊息",
    "tip": "代理程式之間以及來自人員的郵件，包括被迴圈防護拒絕的訊息及原因"
   },
   "messageThreads": {
    "label": "訊息討論串",
    "tip": "一個討論串中的所有訊息，依時間由舊到新排列"
   }
  }
 },
 "enums": {
  "resourceType": {
   "AgentMessage": "代理程式訊息"
  },
  "runKind": {
   "Message": "緊急訊息"
  },
  "messageStatus": {
   "Queued": "排隊中",
   "Delivered": "已送達",
   "Acknowledged": "已確認",
   "Expired": "已過期",
   "Rejected": "已拒絕"
  },
  "messageUrgency": {
   "Normal": "一般",
   "Urgent": "緊急"
  },
  "messageRejection": {
   "HopLimit": "跳數上限",
   "LineRate": "線路速率",
   "ThreadBudget": "討論串上限",
   "NoLine": "無線路",
   "Frozen": "收件者已凍結"
  }
 },
 "messages": {
  "untrusted": "這些訊息由代理程式和人員撰寫。主旨、內文和拒絕詳情會依傳送時的原樣以純文字顯示；其中任何內容都不會被執行、轉譯或當作指示遵循。",
  "views": {
   "label": "顯示哪些訊息",
   "all": "所有訊息",
   "rejected": "已拒絕",
   "rejectedNote": "傳送時被迴圈防護拒絕的訊息及原因。被拒絕的訊息從未送達。"
  },
  "filters": {
   "reason": "原因",
   "sender": "寄件者",
   "recipient": "收件者",
   "from": "傳送時間晚於",
   "to": "傳送時間早於"
  },
  "actions": {
   "send": "傳送訊息",
   "openThread": "開啟討論串",
   "copyId": "複製 ID",
   "openSender": "開啟寄件者",
   "openRecipient": "開啟收件者",
   "openDeliveredRun": "開啟接收的執行",
   "openEscalation": "開啟升級"
  },
  "toasts": {
   "sent": "已傳送給 {{recipient}}。",
   "copied": "已複製訊息 ID。"
  },
  "send": {
   "title": "傳送訊息",
   "intro": "寫訊息給代理程式。訊息會在其收件匣中等待，直到某次執行讀取它；緊急訊息會立即喚醒代理程式。",
   "replyIntro": "在此討論串中回覆。回覆會傳給傳送該訊息的代理程式。",
   "pickRecipient": "選擇代理程式",
   "ttlPlaceholder": "伺服器預設值",
   "sending": "傳送中...",
   "rejected": "迴圈防護拒絕了這則訊息。",
   "rejectedStored": "被拒絕的訊息會保留在已拒絕清單中。",
   "fields": {
    "recipient": "收件者",
    "subject": "主旨",
    "body": "內文",
    "urgency": "緊急程度",
    "ttlSeconds": "到期時間（秒）"
   },
   "errors": {
    "recipient": "請選擇要接收訊息的代理程式。",
    "subject": "請為訊息填寫 1 到 {{max}} 個字元的主旨。",
    "body": "內文最多 {{max}} 位元組。",
    "ttlSeconds": "請輸入 {{min}} 到 {{max}} 之間的整數秒數，或留空。"
   }
  }
 },
 "views": {
  "messageThread": {
   "title": "訊息討論串",
   "notFoundTitle": "找不到討論串",
   "notFoundBody": "它不存在於此租用戶中，或已隨其租用戶一併移除。",
   "back": "返回訊息",
   "count_other": "{{count}} 則訊息",
   "rejectedCount_other": "{{count}} 則已拒絕",
   "emptyTitle": "此討論串中沒有訊息",
   "emptyBody": "討論串存在，但其中沒有您可以讀取的訊息。",
   "listLabel": "此討論串中的訊息，依時間由舊到新排列",
   "noBody": "這則訊息沒有內文。",
   "noDetail": "沒有更多詳情。",
   "woke": "已喚醒收件者",
   "artifacts": "附加的成品",
   "reply": "回覆",
   "replyPrefix": "回覆：",
   "fields": {
    "sender": "寄件者",
    "recipient": "收件者",
    "createdUtc": "傳送時間",
    "hopCount": "跳數",
    "deliveredRunId": "送達的執行",
    "deliveredUtc": "送達時間",
    "acknowledgedUtc": "確認時間",
    "expiresUtc": "到期時間",
    "wokeRecipient": "喚醒",
    "escalationId": "升級",
    "id": "訊息 ID"
   }
  },
  "agentDetail": {
   "inbox": {
    "tab": "收件匣",
    "status": "狀態",
    "openAll": "在訊息中開啟",
    "none": "此代理程式還沒有訊息。",
    "noneWithStatus": "此代理程式沒有該狀態的訊息。",
    "more": "顯示 {{total}} 則中最新的 {{shown}} 則。開啟訊息頁面可查看全部。"
   }
  },
  "home": {
   "autonomy": {
    "rejected_other": "過去 24 小時內有 {{count}} 則訊息被迴圈防護拒絕",
    "noneRejected": "過去 24 小時內沒有訊息被迴圈防護拒絕"
   }
  }
 },
 "resources": {
  "messages": {
   "title": "訊息",
   "subtitle": "代理程式之間以及來自人員的郵件，最新的在前，包括被迴圈防護拒絕的訊息。開啟一則即可閱讀整個討論串。",
   "add": "傳送訊息",
   "create": "傳送訊息",
   "edit": "訊息",
   "view": "訊息詳情",
   "deleteTitle": "刪除訊息",
   "emptyTitle": "還沒有訊息",
   "emptyBody": "代理程式在執行時以 garrison_send_message 工具傳送訊息，人員可在此處或透過 API 傳送。訊息傳送後會顯示在這裡。",
   "columns": {
    "createdUtc": "傳送時間",
    "urgency": "緊急程度",
    "status": "狀態",
    "subject": "主旨",
    "sender": "寄件者",
    "recipient": "收件者",
    "reason": "拒絕",
    "hopCount": "跳數",
    "deliveredRunId": "送達的執行",
    "expiresUtc": "到期時間",
    "escalationId": "升級",
    "threadId": "討論串",
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
})(zhHant, {
 "nav": {
  "items": {
   "organizations": {
    "label": "組織",
    "tip": "由單位組成的樹狀結構，包含負責人、成員、同級線路和預算，以修訂形式發佈"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Organization": "組織"
  },
  "organizationStatus": {
   "Draft": "草稿",
   "Active": "啟用中",
   "Frozen": "已凍結",
   "Retired": "已停用"
  },
  "budgetPeriod": {
   "Day": "日",
   "Month": "月"
  },
  "orgRevisionState": {
   "Draft": "草稿",
   "Published": "已發佈",
   "Superseded": "已取代"
  }
 },
 "organizations": {
  "notPublished": "未發佈",
  "actions": {
   "open": "開啟組織",
   "copyId": "複製 ID"
  },
  "toasts": {
   "copied": "已複製組織 ID。",
   "unitAdded": "已將單位 {{name}} 新增到工作樹。",
   "unitSaved": "已儲存單位 {{name}}。",
   "unitRemoved": "已從工作樹移除單位 {{name}}。",
   "published": "修訂 {{number}} 已生效。",
   "drafted": "已將修訂 {{number}} 儲存為草稿。",
   "rolledBack": "已復原到修訂 {{number}}。目前生效的是修訂 {{live}}。",
   "retired": "已停用 {{name}}。",
   "reactivated": "已恢復 {{name}}。"
  },
  "errors": {
   "OneRoot": "一個組織恰好只有一個根單位，也就是沒有上層單位的那一個。",
   "ParentNotFound": "上層單位不屬於此組織。",
   "Cycle": "單位不能位於自己之下，也不能位於自己的下層單位之下。",
   "UnitNameTaken": "此組織中已有其他單位使用這個名稱。",
   "LeadsTwoUnits": "此代理程式已經是另一個單位的負責人。在每個組織中，一個代理程式最多只能負責一個單位。",
   "PositionTaken": "此代理程式已在組織中擔任職位。一個代理程式只能是單一單位的負責人或成員。",
   "PeerNotFound": "有一條同級線路指向不屬於此組織的單位。",
   "BudgetPeriodTaken": "每個單位在每個週期只能有一個預算。",
   "BudgetInvalid": "預算必須是以美元計的正數金額。",
   "BudgetExceedsParent": "單位的預算不能大於上層單位的預算。",
   "TooManyUnits": "此組織的單位數已達伺服器允許的上限。",
   "TooManyMembers": "此單位的成員數已達伺服器允許的上限。",
   "TooManyPeerLines": "此單位的同級線路數已達伺服器允許的上限。",
   "UnitHasChildren": "請先移除或移動此單位底下的單位。",
   "OrganizationRetired": "此組織已停用。請先恢復，再進行變更。",
   "AgentInactive": "該代理程式不存在或未啟用。",
   "MandateMismatch": "該守護者屬於另一個代理程式。請選擇此職位上代理程式的守護者。",
   "RevisionMismatch": "該修訂屬於另一個組織。",
   "RevisionPublished": "該修訂已經發佈過了。",
   "RevisionNeverPublished": "只能復原到曾經生效過的修訂。",
   "AlreadyLive": "該修訂已在生效中。",
   "NothingToRollBack": "沒有更早的生效修訂可以返回。",
   "StatusNotSettable": "組織只能被停用，或從停用狀態恢復。其他狀態由發佈和凍結決定。",
   "NameConflict": "已有其他組織使用這個名稱。"
  },
  "spend": {
   "noBudget": "{{period}}：已支出 {{spent}}，無預算",
   "of": "{{period}}：{{spent}} / {{amount}}（{{percent}}）",
   "exhausted": "預算已用盡"
  },
  "chart": {
   "lead": "負責人",
   "noLead": "無負責人",
   "members": "成員（{{count}}）",
   "peers": "同級線路",
   "app": "應用程式",
   "collapse": "收合 {{name}} 底下的單位",
   "expand": "展開 {{name}} 底下的單位",
   "addChild": "在下方新增單位"
  },
  "unit": {
   "addTitle": "新增單位",
   "editTitle": "編輯單位 {{name}}",
   "add": "新增單位",
   "saving": "正在儲存...",
   "intro": "變更會寫入工作樹。在你發佈修訂之前，不會有任何變更生效。名稱最多 {{max}} 個字元。",
   "namePlaceholder": "帳務",
   "titlePlaceholder": "帳務主管",
   "noParent": "無（根單位）",
   "noLead": "尚無負責人",
   "noMandate": "無守護者",
   "noApp": "無應用程式",
   "noPeers": "請先新增另一個單位，才能建立通往它的同級線路。",
   "noBudget": "無預算",
   "addMember": "新增成員",
   "sections": {
    "lead": "負責人",
    "members": "成員與同級線路",
    "budgets": "預算"
   },
   "fields": {
    "name": "名稱",
    "parentUnitId": "上層單位",
    "description": "描述",
    "leadAgentId": "負責人代理程式",
    "leadTitle": "負責人職稱",
    "leadMandateId": "負責人守護者",
    "appId": "應用程式",
    "members": "成員",
    "memberAgent": "代理程式",
    "memberTitle": "職稱",
    "memberMandate": "守護者",
    "peerUnitIds": "同級線路",
    "budgetDay": "每日預算（USD）",
    "budgetMonth": "每月預算（USD）"
   },
   "errors": {
    "name": "請為單位取一個 1 到 {{max}} 個字元的名稱。",
    "description": "描述最多 {{max}} 個字元。",
    "title": "職稱最多 {{max}} 個字元。",
    "memberAgent": "請為每位成員選擇代理程式，或移除空白列。",
    "duplicateAgent": "一個代理程式在單位中只能擔任一個職位。",
    "budget": "請輸入大於零的金額，或留空表示無預算。"
   }
  },
  "form": {
   "errors": {
    "name": "請為組織取一個 1 到 {{max}} 個字元的名稱。",
    "text": "此欄位最多 {{max}} 個字元。"
   }
  },
  "diff": {
   "none": "沒有差異。兩棵樹完全相同。",
   "empty": "（無）",
   "between": "從 {{before}} 到 {{after}}。",
   "added": "新增的單位（{{count}}）",
   "removed": "移除的單位（{{count}}）",
   "changed": "變更的單位（{{count}}）",
   "field": "欄位",
   "fields": {
    "name": "名稱",
    "description": "描述",
    "parent": "上層單位",
    "lead": "負責人",
    "leadTitle": "負責人職稱",
    "leadMandate": "負責人守護者",
    "app": "應用程式",
    "members": "成員",
    "peers": "同級線路",
    "budgets": "預算"
   },
   "title": "修訂 {{number}} 與生效中組織的比較",
   "pendingTitle": "未發佈的變更",
   "nothingLive": "尚無生效版本",
   "working": "工作樹"
  },
  "revisions": {
   "label": "修訂 {{number}}",
   "rollbackOf": "（修訂 {{number}} 的副本）"
  },
  "rollback": {
   "note": "已從儀表板復原到修訂 {{number}}。"
  }
 },
 "views": {
  "organizationDetail": {
   "title": "組織",
   "heading": "組織 {{name}}",
   "notFoundTitle": "找不到組織",
   "notFoundBody": "它不存在於此租用戶中，或已被刪除。",
   "live": "即時更新",
   "editDetails": "編輯詳細資料",
   "reactivate": "恢復",
   "retire": "停用",
   "publish": "發佈變更",
   "retiredBanner": "此組織已停用。它的指揮鏈、線路和預算都不再適用，在你恢復它之前，其中的任何內容都無法變更。",
   "pending": "工作樹有未發佈的變更：新增 {{added}} 個、變更 {{changed}} 個、移除 {{removed}} 個。",
   "neverPublished": "尚無生效版本。請發佈修訂，讓此組織開始運作。",
   "reviewPending": "檢閱變更",
   "units": "單位",
   "lastUpdate": "上次變更",
   "tabs": {
    "chart": "組織圖",
    "budgets": "預算與支出",
    "revisions": "修訂（{{count}}）"
   },
   "chartView": "顯示哪棵樹",
   "viewWorking": "工作樹",
   "viewLive": "生效中",
   "addUnit": "新增單位",
   "addRoot": "新增根單位",
   "workingNote": "工作樹是你編輯的版本。發佈修訂即可讓它生效。",
   "liveNote": "生效中的修訂：指揮鏈、線路和預算都依照這棵樹。",
   "noUnitsTitle": "尚無單位",
   "noUnitsBody": "先新增由最上層代理程式負責的根單位，再在它底下新增單位。",
   "budgetsNote": "每個預算限制該單位及其底下所有單位在一個 UTC 日或月內可支出的金額。支出計算的是生效修訂下已完成執行的已知費用。",
   "noBudgetsTitle": "尚無預算",
   "noBudgetsBody": "編輯單位，為它設定每日或每月預算。",
   "noSpend": "尚無支出紀錄",
   "columns": {
    "unit": "單位",
    "day": "日",
    "month": "月",
    "spend": "支出",
    "number": "修訂",
    "state": "狀態",
    "note": "備註",
    "author": "作者",
    "created": "建立時間",
    "published": "發佈時間"
   },
   "noRevisionsTitle": "尚無修訂",
   "noRevisionsBody": "發佈變更，即可將工作樹快照為一個修訂。",
   "current": "生效中",
   "compare": "與生效版本比較",
   "publishRevision": "發佈",
   "rollback": "復原",
   "publishTitle": "發佈變更",
   "publishIntro": "發佈會將工作樹快照為新的修訂並使其生效，同時使用其中每個守護者的目前修訂。「儲存為草稿」只保留快照，不會使其生效。",
   "saveDraft": "儲存為草稿",
   "publishNow": "發佈",
   "note": "備註",
   "diffNote": "備註：{{note}}",
   "removeUnitTitle": "移除單位",
   "confirmRemoveUnit": "要從工作樹移除單位 {{name}} 嗎？指向它的同級線路也會一併移除。在你發佈之前，生效中的組織不會改變。",
   "rollbackTitle": "復原",
   "confirmRollback": "要讓修訂 {{number}} 重新生效，取代修訂 {{live}} 嗎？工作樹及其中的守護者都會回到該修訂，而這次復原會記錄為一個新的修訂。",
   "retireTitle": "停用組織",
   "confirmRetire": "要停用 {{name}} 嗎？它的指揮鏈、線路和預算將停止適用，在你恢復它之前都無法變更。",
   "confirmDelete": "要刪除 {{name}} 及其 {{units}} 個單位和 {{revisions}} 個修訂嗎？為其單位和組織儲存的記憶也會一併刪除。此操作無法復原。"
  }
 },
 "resources": {
  "organizations": {
   "title": "組織",
   "subtitle": "由單位組成的樹狀結構，每個單位由一個代理程式負責，並有成員、同級線路和預算。開啟組織即可編輯組織圖並發佈。",
   "add": "建立組織",
   "create": "建立組織",
   "edit": "編輯組織",
   "view": "組織詳細資料",
   "deleteTitle": "刪除組織",
   "emptyTitle": "尚無組織",
   "emptyBody": "建立組織，新增由最上層代理程式負責的根單位，在它底下新增單位，然後發佈。",
   "columns": {
    "name": "名稱",
    "status": "狀態",
    "currentRevisionNumber": "生效修訂",
    "description": "描述",
    "createdUtc": "建立時間",
    "mission": "使命",
    "id": "ID"
   },
   "fields": {
    "name": "名稱",
    "description": "描述",
    "mission": "使命"
   },
   "hints": {
    "name": "1 到 {{max}} 個字元，在租用戶中不得重複。",
    "description": "選填，最多 {{max}} 個字元。",
    "mission": "用平實的文字說明組織的目的。選填，最多 {{max}} 個字元。"
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
})(zhHant, {
 "common": {
  "fieldCodes": {
   "OneRoot": "此組織已有根單位。請為此單位選擇上層單位。",
   "UnitNameTaken": "此組織已有同名的單位。",
   "UnitNotFound": "此組織中沒有這個名稱的單位。",
   "UnitHasChildren": "請先移除此單位下方的單位。",
   "NoSuchPeerLine": "這兩個單位之間沒有同級線路。",
   "OrganizationDeleted": "草稿會刪除此組織。請先將它復原。",
   "PeerNotFound": "單位不能與自己建立同級線路。"
  }
 },
 "components": {
  "studio": {
   "canvas": {
    "view": {
     "label": "畫布顯示內容",
     "apps": "應用程式",
     "organizations": "組織"
    },
    "operations": {
     "AddUnit": "新增單位",
     "RemoveUnit": "移除單位",
     "AddUnitMember": "新增成員",
     "RemoveUnitMember": "移除成員",
     "ConnectUnits": "新增同級線路",
     "DisconnectUnits": "移除同級線路"
    },
    "org": {
     "none": "草稿中還沒有組織。在上方輸入組織名稱和單位名稱即可建立；第一個單位就是根單位。",
     "flowLabel": "組織 {{organization}}",
     "picker": "組織",
     "units": "單位",
     "root": "根單位",
     "peers": "同級線路",
     "orgTitle": "組織 {{name}}",
     "orgHint": "選取單位即可編輯其成員和同級線路。單位位於其上層單位之內。",
     "deleted": "草稿會刪除此組織。復原之前，其單位都無法變更。",
     "unitTitle": "單位 {{name}}",
     "reportsTo": "上層單位",
     "lead": "負責人",
     "members": "成員（{{count}}）",
     "noMembers": "除了負責人之外沒有其他成員。",
     "memberAgent": "代理程式",
     "memberTitle": "職稱（選填）",
     "addMember": "新增成員",
     "removeMember": "移除",
     "noPeers": "沒有同級線路。",
     "disconnect": "中斷連接",
     "addChild": "在下方新增單位",
     "startPeer": "開始同級線路",
     "removeUnit": "移除單位",
     "peerTitle": "同級線路 {{from}} 與 {{to}}",
     "peerHint": "{{from}} 與 {{to}} 可以直接互傳訊息，不必經過共同的主管。",
     "peerList": "同級線路（{{total}}）",
     "noPeerLines": "還沒有同級線路。選取一個單位並開始一條，或從單位的右側控點拖曳到另一個單位。",
     "removeTitle": "移除單位",
     "removeMessage": "要在此草稿中從組織 {{organization}} 移除單位 {{name}} 嗎？涉及它的同級線路也會一併移除。下方還有單位的單位無法移除。",
     "toolbar": {
      "label": "組織工具",
      "addUnit": "新增單位",
      "unitPlaceholder": "單位名稱",
      "parent": "上層單位",
      "noParent": "無上層單位（根單位）",
      "under": "位於 {{name}} 之下",
      "lead": "負責人代理程式",
      "leadPlaceholder": "負責人代理程式（選填）",
      "leadTitle": "負責人職稱（選填）",
      "organization": "組織",
      "add": "新增"
     },
     "connectBar": {
      "message": "正在從 {{name}} 繪製同級線路。"
     },
     "keys": {
      "tab": "Tab 會在單位之間移動，每個單位都排在其下方單位之前。",
      "select": "Enter 或 Space 會選取目前焦點所在的單位並開啟其屬性。",
      "peer": "在單位上按 C 會從它開始一條同級線路；在另一個單位上按 C 或 Enter 即完成。",
      "remove": "Delete 會在確認後移除焦點所在的單位。",
      "add": "N 會跳到「新增單位」欄位。",
      "peers": "在同級線路清單中，Enter 選取線路，Delete 移除線路。",
      "escape": "Escape 會取消你開始的同級線路。"
     },
     "node": {
      "root": "根",
      "reportsTo": "向 {{name}} 回報",
      "lead": "負責人：{{name}}",
      "noLead": "無負責人",
      "members": "成員 {{list}}"
     },
     "summary": {
      "none": "沒有可描述的組織。",
      "units_one": "組織 {{organization}} 有 {{count}} 個單位。",
      "units_other": "組織 {{organization}} 有 {{count}} 個單位。",
      "root": "根單位是 {{name}}。",
      "peerCount_one": "有 {{count}} 條同級線路。",
      "peerCount_other": "有 {{count}} 條同級線路。",
      "unitRoot": "{{name}} 是根單位，{{lead}}。",
      "unitChild": "{{name}} 向 {{parent}} 回報，{{lead}}。",
      "ledBy": "負責人是 {{name}}",
      "noLead": "沒有負責人",
      "peer": "{{from}} 與 {{to}} 之間有同級線路。"
     },
     "a11y": {
      "unit": "按 Enter 或 Space 選取此單位。按 C 開始同級線路，按 Delete 移除此單位。",
      "peer": "兩個單位之間的同級線路。",
      "handle": "拖曳到另一個單位以繪製同級線路"
     },
     "announce": {
      "added": "已將單位 {{name}} 新增到 {{organization}}。",
      "peerStart": "正在從 {{name}} 繪製同級線路。移到另一個單位並按 Enter，或按 Escape 取消。",
      "connected": "{{from}} 與 {{to}} 現在有同級線路。",
      "disconnected": "{{from}} 與 {{to}} 之間已不再有同級線路。",
      "memberAdded": "已將 {{name}} 新增到單位 {{unit}}。",
      "memberRemoved": "已從單位 {{unit}} 移除 {{name}}。",
      "removed": "已從 {{organization}} 移除單位 {{name}}。"
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
})(zhHant, {
 "nav": {
  "items": {
   "changeRules": {
    "label": "變更規則",
    "tip": "主管可以在其子樹中直接進行、不必請示的例行變更"
   }
  }
 },
 "enums": {
  "resourceType": {
   "ChangeRule": "變更規則"
  },
  "notificationEvent": {
   "OrgProposalApplied": "已套用組織提案"
  },
  "managementAccess": {
   "None": "無",
   "Drafts": "工作室草稿",
   "OrgSubtree": "主管管理其子樹"
  },
  "changeClass": {
   "PromptRetune": "提示詞調整",
   "WakeTuning": "喚醒調整",
   "MandateTextEdit": "守護者文字編輯",
   "AddWorker": "新增成員",
   "RemoveWorker": "移除成員",
   "ModelChange": "模型變更",
   "DeploymentWeight": "部署權重"
  }
 },
 "errorCodes": {
  "RulesArePeopleOnly": "只有人員可以撰寫變更規則。代理程式無法建立、變更或刪除規則。",
  "ProposalNotPending": "此提案已不再等待決定。請重新開啟以查看目前狀態。",
  "ApproverIsAgent": "代理程式無法決定提案，必須由人員決定。"
 },
 "changeRules": {
  "actions": {
   "openOrganization": "開啟組織",
   "copyId": "複製 ID"
  },
  "toasts": {
   "copied": "已複製變更規則 ID。"
  },
  "status": {
   "Active": "生效中",
   "Inactive": "已停用",
   "Expired": "已到期"
  },
  "limit": {
   "text": "{{class}}，{{name}}：{{range}}",
   "between": "{{min}} 到 {{max}}",
   "atMost": "最多 {{max}}",
   "atLeast": "至少 {{min}}",
   "any": "不限"
  },
  "limitNames": {
   "count": "每個提案的變更數",
   "minIntervalSeconds": "最短喚醒間隔（秒）",
   "maxIntervalSeconds": "最長喚醒間隔（秒）",
   "backoffFactor": "退避係數",
   "jitterPercent": "抖動（百分比）",
   "weight": "流量權重"
  },
  "errors": {
   "UnknownLimit": "此類別沒有這個名稱的限制。請從清單中選擇一個。",
   "ClassNotInRule": "限制必須針對規則所列的類別。請新增該類別或變更限制。",
   "UnitNotFound": "該單位不在此組織目前生效的組織圖中。",
   "Duplicate": "每個類別和每個限制只能出現一次。",
   "BoundRequired": "請為限制設定最小值、最大值或兩者。",
   "MinimumAboveMaximum": "最小值大於最大值。",
   "NegativeBound": "限制值必須大於或等於零。",
   "ExpiryInPast": "請選擇未來的到期時間，或留空讓規則永不到期。",
   "OrganizationNotFound": "此租用戶中沒有該組織。",
   "OrganizationNotSettable": "規則一律屬於原本的組織。若要用於其他組織，請建立新規則。",
   "TooMany": "一條規則最多包含 {{max}} 個限制。"
  },
  "form": {
   "errors": {
    "name": "請為規則輸入 1 到 {{max}} 個字元的名稱。",
    "description": "描述最多 {{max}} 個字元。",
    "organization": "請選擇規則所屬的組織。",
    "unit": "請選擇此組織中的一個單位。",
    "classes": "請至少選擇一個變更類別。"
   }
  }
 },
 "orgProposals": {
  "title": "提案",
  "note": "主管會對其負責的單位提出變更。如果變更規則涵蓋提案中的每項變更，提案會立即套用。其他提案會在這裡等待人員處理。",
  "rulesLink": "變更規則",
  "views": {
   "label": "顯示哪些提案",
   "all": "全部",
   "needsApproval": "需要核准",
   "needsApprovalCount": "需要核准（{{count}}）",
   "applied": "已套用"
  },
  "emptyTitle": "這裡沒有提案",
  "emptyBody": "當主管對其下層單位提出變更時，提案會顯示在這裡。",
  "columns": {
   "title": "提案",
   "unit": "單位",
   "agent": "主管",
   "decision": "決定",
   "updated": "最後變更"
  },
  "decision": {
   "rule": "依規則套用",
   "approved": "已核准",
   "needsApproval": "需要核准",
   "denied": "已拒絕",
   "lapsed": "已失效",
   "drafting": "草擬中"
  },
  "byRules": "規則：{{names}}",
  "byPerson": "由 {{name}} 決定",
  "decide": "審查並決定",
  "toasts": {
   "approved": "已核准 {{title}}，現已生效。",
   "denied": "已拒絕 {{title}}，已退回給主管。"
  },
  "review": {
   "open": "審查",
   "title": "提案：{{title}}",
   "run": "提出此提案的執行",
   "approve": "核准",
   "deny": "拒絕",
   "appliedByRule": "由於變更規則涵蓋每項變更，提案已立即套用。規則：{{names}}。",
   "approvedBy": "由 {{name}} 核准。",
   "deniedBy": "由 {{name}} 拒絕。",
   "reasonGiven": "原因：{{reason}}",
   "revision": "已記錄為組織的修訂 {{number}}。復原該修訂即可撤銷。",
   "appliedNoDiff": "此提案已套用，其變更已成為目前生效設定的一部分。比較它記錄成的修訂即可查看這些變更。",
   "covered": "變更規則涵蓋下方的每項變更，因此此提案不需人員即可套用。",
   "notCovered": "下方至少有一項變更未受變更規則涵蓋，因此需由人員決定。",
   "refusals": "硬性限制拒絕了以下變更，任何規則或核准都無法解除：",
   "noChanges": "此提案不包含任何變更。",
   "columns": {
    "item": "變更",
    "change": "類型",
    "rule": "涵蓋規則"
   },
   "coveredBy": "規則 {{name}}",
   "reason": "原因",
   "reasonPlaceholder": "選填。主管會看到。"
  }
 },
 "views": {
  "organizationDetail": {
   "tabs": {
    "proposals": "提案（{{count}}）"
   },
   "appliedProposal": "已套用的提案"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "managementAccess": "管理權限"
   },
   "hints": {
    "managementAccess": "大多數代理程式選擇「無」即可。「工作室草稿」可讓執行為啟動它的人員草擬工作室變更。「主管管理其子樹」可讓負責某個組織單位的代理程式對其下層單位提出變更。"
   }
  },
  "changeRules": {
   "title": "變更規則",
   "subtitle": "主管可以在其子樹中直接進行、不必等待人員的例行變更。規則未涵蓋的變更仍需核准。",
   "add": "新增規則",
   "create": "新增變更規則",
   "edit": "編輯變更規則",
   "view": "變更規則",
   "deleteTitle": "刪除變更規則",
   "emptyTitle": "尚無變更規則",
   "emptyBody": "新增規則，讓主管不必等待核准即可套用喚醒調整等例行變更。",
   "noLimits": "無限制",
   "noExpiry": "永不",
   "chooseOrganization": "選擇組織",
   "chooseUnit": "選擇單位",
   "addLimit": "新增限制",
   "filters": {
    "activeOnly": "狀態",
    "inForce": "僅顯示生效中"
   },
   "columns": {
    "name": "名稱",
    "status": "狀態",
    "organization": "組織",
    "unit": "涵蓋範圍",
    "classes": "類別",
    "limits": "限制",
    "expiresUtc": "到期時間",
    "createdByName": "建立者",
    "description": "描述",
    "createdUtc": "建立時間",
    "id": "ID"
   },
   "fields": {
    "organizationId": "組織",
    "unitId": "單位（含其下層單位）",
    "name": "名稱",
    "description": "描述",
    "classes": "變更類別",
    "limits": "限制",
    "limitClass": "類別",
    "limitName": "限制",
    "minimum": "最小值",
    "maximum": "最大值",
    "active": "生效",
    "expiresUtc": "到期時間"
   },
   "hints": {
    "organizationId": "必填。規則一律屬於原本的組織。",
    "unitId": "必填。規則涵蓋對此單位及其所有下層單位的變更。",
    "name": "1 到 {{max}} 個字元。",
    "description": "選填，最多 {{max}} 個字元。",
    "classes": "必填。只有當提案中的每項變更都屬於某條規則允許的類別時，提案才會依規則套用。",
    "limits": "選填，最多 {{max}} 個。「每個提案的變更數」限制一個提案中某類變更的數量；其他限制約束新值的範圍。",
    "expiresUtc": "選填。規則在此時間後不再適用。"
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
})(zhHant, {
 "nav": {
  "items": {
   "evaluations": {
    "label": "評估集",
    "tip": "在代理程式上線前為其評分的版本化案例集"
   },
   "evalRuns": {
    "label": "評估執行",
    "tip": "針對部署或代理程式修訂執行評估集的紀錄"
   },
   "shadowTrials": {
    "label": "影子試驗",
    "tip": "候選部署重播真實輸入，但不會實際採取行動"
   },
   "canaryReleases": {
    "label": "金絲雀發佈",
    "tip": "候選部署分階段承接越來越多的流量"
   }
  }
 },
 "enums": {
  "resourceType": {
   "EvalSet": "評估集",
   "EvalRun": "評估執行",
   "ShadowTrial": "影子試驗",
   "CanaryRelease": "金絲雀發佈"
  },
  "notificationEvent": {
   "CanaryRolledBack": "金絲雀發佈已回復"
  },
  "runKind": {
   "Eval": "評估案例",
   "Shadow": "影子副本"
  },
  "evalSetState": {
   "Draft": "草稿",
   "Approved": "已核准"
  },
  "evalSetOrigin": {
   "Human": "由人員撰寫",
   "Evaluator": "由代理程式撰寫",
   "Playground": "來自試驗場"
  },
  "evalScorer": {
   "ExactMatch": "完全相符",
   "Contains": "包含",
   "JsonSchemaValid": "符合 JSON Schema",
   "Judge": "評審代理程式"
  },
  "evalRunStatus": {
   "Pending": "等候中",
   "Running": "執行中",
   "Completed": "已完成",
   "Failed": "失敗",
   "Cancelled": "已取消"
  },
  "evalRunTarget": {
   "AgentRevision": "代理程式修訂",
   "Deployment": "部署"
  },
  "evalRunInputMode": {
   "Cases": "評估集的案例",
   "RecentInputs": "近期輸入"
  },
  "shadowTrialStatus": {
   "Running": "執行中",
   "Completed": "已完成",
   "Stopped": "已停止",
   "Failed": "失敗"
  },
  "canaryStatus": {
   "Running": "執行中",
   "Promoted": "已推進",
   "RolledBack": "已回復",
   "Aborted": "已中止"
  }
 },
 "errorCodes": {
  "EvalSetExists": "已有同名的評估集。請開啟並編輯它，以建立下一個版本。",
  "AlreadyApproved": "此版本已經核准。",
  "EvalSetEmpty": "此評估集還沒有案例。請先新增案例。",
  "EvalSetImmutable": "此版本已核准，會保持原樣。請編輯它以開啟下一個版本，或改為刪除草稿版本。",
  "ApprovalIsPeopleOnly": "只有人員可以核准評估集。代理程式不能核准為自己評分的評估集。",
  "EvalRunFinished": "此評估執行已經結束。",
  "ShadowTrialAlreadyRunning": "此候選部署已在另一個試驗中為該部署進行影子執行。",
  "ShadowTrialNotRunning": "此影子試驗已不在執行中。",
  "CanaryAlreadyRunning": "其中一個部署已在執行中的金絲雀發佈裡。",
  "CanaryNotRunning": "此金絲雀發佈已不在執行中。",
  "EvalGateFailed": "推進需要此修訂針對該環境已核准評估集的一次通過評估執行，目前還沒有。",
  "PeopleOnly": "只有人員和 API 憑證可以執行此操作，執行權杖不行。"
 },
 "evals": {
  "versionShort": "v{{version}}",
  "setVersion": "{{name}} v{{version}}",
  "percent": "{{value}}%",
  "progress": "{{completed}} / {{total}} 個案例，{{passed}} 個通過",
  "noJudge": "沒有評審",
  "noSet": "無",
  "untilStopped": "直到停止",
  "verdict": {
   "passed": "通過",
   "failed": "低於門檻",
   "none": "沒有判定"
  },
  "outcome": {
   "passed": "通過",
   "failed": "未通過",
   "errored": "發生錯誤"
  },
  "target": {
   "deployment": "部署 {{name}}",
   "revision": "代理程式 {{agent}}，修訂 {{revision}}"
  },
  "actions": {
   "runSet": "執行評估集",
   "openSet": "開啟評估集",
   "cancelRun": "取消執行",
   "stopTrial": "停止試驗",
   "abortCanary": "中止發佈",
   "copyId": "複製 ID"
  },
  "toasts": {
   "copied": "已複製 ID。",
   "approved": "已核准 {{name}} v{{version}}。現在它可以把關推進。",
   "caseSaved": "已儲存案例。",
   "caseSavedNextVersion": "已將案例儲存到新草稿版本 {{version}}。",
   "caseSavedTo": "已將案例儲存到 {{name}}。",
   "caseRemoved": "已移除案例。",
   "caseRemovedNextVersion": "已從新草稿版本 {{version}} 移除案例。",
   "setSavedNextVersion": "已儲存為新草稿版本 {{version}}。",
   "runStarted": "已開始執行 {{name}} 的評估。",
   "runCancelled": "已取消評估執行。",
   "trialStopped": "已停止影子試驗。",
   "canaryAborted": "已中止金絲雀發佈，權重已恢復為初始值。"
  },
  "reason": {
   "label": "原因",
   "placeholder": "選填。會與紀錄一起保存，並寫入稽核記錄。"
  },
  "form": {
   "errors": {
    "name": "請為評估集輸入 1 至 {{max}} 個字元的名稱。",
    "description": "描述最多 {{max}} 個字元。",
    "judgeAgent": "評審代理程式名稱最多 {{max}} 個字元。",
    "tags": "每個標籤最多 {{max}} 個字元。"
   }
  },
  "set": {
   "nextVersion": "此版本已核准，因此儲存後會建立草稿版本 {{version}}。此版本會保持原樣。"
  },
  "case": {
   "addTitle": "新增案例到 {{name}}",
   "editTitle": "編輯案例 {{number}}",
   "save": "儲存案例",
   "nextVersion": "此版本已核准，因此變更會寫入新草稿版本 {{version}}。此版本會保持原樣。",
   "fromRun": "儲存自執行 {{id}}。",
   "fields": {
    "name": "名稱",
    "inputText": "輸入",
    "expectedText": "預期輸出",
    "hidden": "對受評分的代理程式隱藏",
    "checks": "檢查項目"
   },
   "placeholders": {
    "name": "選填，例如超過上限的退款",
    "inputText": "代理程式收到的訊息",
    "expectedText": "好的回答應該說什麼"
   },
   "hints": {
    "name": "選填，最多 {{max}} 個字元。",
    "inputText": "必填。案例會把這段文字當作輸入傳給代理程式。",
    "expectedText": "選填。沒有自己文字的完全相符和包含檢查會與它比較；評審會把它當作參考答案。",
    "hidden": "代理程式自己的執行只能看到隱藏案例的分數，看不到輸入或預期輸出，因此無法得知答案。"
   },
   "checks": {
    "scorer": "評分方式",
    "weight": "權重",
    "add": "新增檢查項目",
    "remove": "移除檢查項目 {{number}}",
    "none": "沒有檢查項目。案例會以完全相符的方式與預期輸出比較評分；沒有預期輸出時，則由評審代理程式評分。"
   },
   "scorerHints": {
    "ExactMatch": "忽略前後空白後，輸出與文字相同即通過。",
    "Contains": "輸出包含該文字即通過。",
    "JsonSchemaValid": "輸出是符合結構描述的 JSON 即通過。",
    "Judge": "評估集的評審代理程式會依照評分準則和預期輸出為輸出評分。"
   },
   "argumentLabels": {
    "ExactMatch": "完全相符的文字",
    "Contains": "要尋找的文字",
    "JsonSchemaValid": "JSON Schema",
    "Judge": "評分準則"
   },
   "argumentPlaceholders": {
    "ExactMatch": "留空時使用預期輸出",
    "Contains": "留空時使用預期輸出",
    "JsonSchemaValid": "{\"type\": \"object\", \"required\": [\"answer\"]}",
    "Judge": "選填。好的回答必須做到什麼"
   },
   "errors": {
    "input": "案例需要輸入文字。",
    "name": "名稱最多 {{max}} 個字元。",
    "weight": "權重為 0 至 {{max}}。",
    "schema": "請在這裡輸入 JSON Schema 物件。",
    "argument": "請輸入文字，或填寫案例的預期輸出。"
   }
  },
  "run": {
   "title": "執行評估集",
   "titleFor": "執行 {{name}} v{{version}}",
   "intro": "每個案例會以獨立的評估執行進行。針對代理程式修訂的執行會使用臨時部署，不會影響即時流量。",
   "start": "開始執行",
   "starting": "正在開始...",
   "setOption": "{{name}} v{{version}}",
   "chooseDeployment": "選擇部署",
   "chooseAgent": "選擇代理程式",
   "fields": {
    "setId": "評估集",
    "targetType": "評估對象",
    "deploymentId": "部署",
    "agentId": "代理程式",
    "agentRevisionId": "修訂",
    "inputMode": "輸入",
    "recentInputCount": "要重播的近期輸入數",
    "thresholdPercent": "通過門檻（百分比）",
    "budgetUsd": "預算（USD）"
   },
   "hints": {
    "setId": "列出每個評估集的最新版本。",
    "targetType": "目前運作中的部署，或代理程式修訂，例如工作室試驗場執行的草稿。",
    "agentId": "必填。未指定修訂時，會執行代理程式的草稿修訂，或其最新發佈的修訂。",
    "agentRevisionId": "選填。代理程式修訂 ID；留空時執行草稿修訂。",
    "inputMode": "評估集的案例，或部署最近成功的輸入，由評審代理程式評分。",
    "recentInputCount": "1 至 {{max}}。",
    "thresholdPercent": "選填，0 至 100。加權分數達到此值時，執行即通過。",
    "budgetUsd": "選填。案例和評審執行花費達到此金額時，會略過剩下的案例，執行判定為失敗。"
   },
   "errors": {
    "set": "請選擇要執行的評估集。",
    "deployment": "請選擇要評估的部署。",
    "agent": "請選擇要評估的代理程式。",
    "threshold": "門檻為 0 至 100 百分比。",
    "budget": "預算為 0 至 {{max}} USD。",
    "recentInputs": "請重播 1 至 {{max}} 個近期輸入。"
   }
  },
  "save": {
   "open": "儲存為評估案例",
   "title": "儲存為評估案例",
   "intro": "這一輪的輸入和代理程式的回答會成為一個案例。請編輯預期輸出，寫出好的回答應有的內容，而不只是這次的回答。",
   "set": "評估集",
   "newSet": "新增評估集...",
   "newSetName": "新評估集名稱",
   "newSetHint": "新評估集會以草稿開始，來源為「來自試驗場」。",
   "submit": "儲存案例",
   "done": "完成",
   "openSet": "開啟評估集",
   "runSet": "執行評估集",
   "entryAgent": "入口代理程式",
   "saved": "已將案例儲存到 {{name}} v{{version}}。",
   "runHint": "「執行評估集」會評估 {{agent}} 的草稿修訂，也就是此試驗場執行的修訂。",
   "errors": {
    "set": "請選擇評估集，或建立新的評估集。"
   }
  },
  "setDetail": {
   "title": "評估集",
   "back": "所有評估集",
   "notFoundTitle": "找不到評估集",
   "notFoundBody": "它可能是已被刪除的草稿。已核准的版本一律會保留。",
   "approve": "核准",
   "approveTitle": "核准 {{name}} v{{version}}",
   "approveMessage": "已核准的版本會完全保持原樣，可以把關推進和金絲雀發佈。之後的編輯會建立下一個草稿版本。",
   "approvedNote": "此版本已核准並保持原樣。編輯評估集或案例會建立草稿版本 {{version}}。",
   "approvedByAt": "{{name}}, {{when}}",
   "needsJudge": "有些案例由評審代理程式評分，但此評估集沒有設定評審。執行前請編輯評估集並選擇評審代理程式。",
   "editTitle": "編輯 {{name}}",
   "deleteTitle": "刪除草稿版本",
   "deleteMessage": "要刪除 {{name}} v{{version}} 嗎？已核准的版本不受影響。",
   "cases": "案例（{{count}}）",
   "addCase": "新增案例",
   "noCases": "還沒有案例。請在這裡新增，或從工作室試驗場儲存一輪對話。",
   "noExpected": "無",
   "hidden": "已隱藏",
   "removeCaseTitle": "移除案例 {{number}}",
   "removeCaseMessage": "要從草稿移除此案例嗎？",
   "removeCaseApproved": "此版本已核准，因此案例會從新草稿版本 {{version}} 移除。此版本仍保留它。",
   "versions": "版本",
   "thisVersion": "v{{version}}（目前這個）",
   "runs": "近期評估執行",
   "allRuns": "此版本的所有執行",
   "noRuns": "此版本尚未執行過。",
   "fields": {
    "state": "狀態",
    "origin": "來源",
    "judgeAgent": "評審代理程式",
    "tags": "標籤",
    "authoredBy": "撰寫者",
    "approvedBy": "核准者",
    "previousVersion": "上一個版本",
    "lastUpdateUtc": "最後變更",
    "description": "描述"
   },
   "columns": {
    "order": "#",
    "name": "名稱",
    "input": "輸入",
    "expected": "預期輸出",
    "scorers": "評分方式",
    "hidden": "隱藏",
    "source": "來源執行"
   },
   "versionColumns": {
    "version": "版本",
    "state": "狀態",
    "caseCount": "案例",
    "approvedBy": "核准者",
    "lastUpdateUtc": "最後變更"
   },
   "runColumns": {
    "run": "評估執行",
    "status": "狀態",
    "verdict": "判定",
    "score": "分數",
    "target": "評估對象",
    "createdUtc": "開始時間"
   }
  },
  "runDetail": {
   "title": "評估執行",
   "back": "所有評估執行",
   "notFoundTitle": "找不到評估執行",
   "notFoundBody": "請檢查 ID，或從評估集開啟該執行。",
   "live": "即時",
   "polling": "輪詢",
   "failure": "執行失敗：{{reason}}",
   "progressLabel": "已完成的案例",
   "kpi": {
    "score": "分數",
    "threshold": "門檻 {{threshold}}",
    "noThreshold": "沒有門檻",
    "passed": "通過的案例",
    "errored": "發生錯誤的案例",
    "cost": "成本",
    "budget": "預算 {{budget}}",
    "noBudget": "沒有預算"
   },
   "fields": {
    "target": "評估對象",
    "targetType": "目標",
    "inputMode": "輸入",
    "startedBy": "啟動者",
    "createdUtc": "開始時間",
    "completedUtc": "結束時間",
    "studioDraftId": "工作室草稿"
   },
   "recentInputs": "{{count}} 個近期輸入",
   "results": "案例結果（{{count}}）",
   "failingOnly": "只看未通過（{{count}}）",
   "noFailing": "每個案例都通過了。",
   "noResults": "此執行沒有記錄任何案例結果。",
   "waiting": "正在等候第一個案例完成。",
   "caseNumber": "案例 {{number}}",
   "recentInput": "近期輸入 {{number}}",
   "checksPassed": "{{passed}} / {{total}} 通過",
   "open": "開啟",
   "columns": {
    "order": "#",
    "case": "案例",
    "outcome": "結果",
    "score": "分數",
    "checks": "檢查項目",
    "output": "輸出"
   },
   "resultTitle": "案例 {{number}}",
   "resultTitleNamed": "案例 {{number}}：{{name}}",
   "scoreIs": "分數 {{score}}",
   "openCaseRun": "開啟案例執行",
   "openSourceRun": "開啟來源執行",
   "hiddenCase": "此案例對受評分的代理程式隱藏。",
   "input": "輸入",
   "diff": "預期輸出與實際輸出的比較",
   "expected": "預期",
   "output": "輸出",
   "noOutput": "沒有輸出。",
   "checks": "檢查項目",
   "noChecks": "沒有任何檢查項目被評分。",
   "checkColumns": {
    "scorer": "評分方式",
    "weight": "權重",
    "score": "分數",
    "outcome": "結果",
    "note": "評分說明",
    "judgeRun": "評審執行"
   },
   "cancelTitle": "取消評估執行",
   "cancelMessage": "要取消 {{name}} 的這次執行嗎？尚未完成的案例會一併取消。"
  },
  "shadow": {
   "errors": {
    "name": "名稱最多 {{max}} 個字元。",
    "source": "請選擇要複製其執行的部署。",
    "candidate": "請選擇候選部署。",
    "same": "候選部署必須與來源部署不同。",
    "sample": "請抽樣 1 至 100 百分比的執行。",
    "ends": "請選擇未來的結束時間，或留空讓它一直執行到停止為止。"
   }
  },
  "shadowDetail": {
   "title": "影子試驗",
   "back": "所有影子試驗",
   "notFoundTitle": "找不到影子試驗",
   "notFoundBody": "請檢查 ID，或從清單開啟該試驗。",
   "note": "影子執行會在候選部署上重播來源的輸入。它們不能使用會產生副作用的工具、傳送訊息、寫入記憶或提交報告，來源的執行也不受影響。",
   "stopReason": "已停止：{{reason}}",
   "stopTitle": "停止影子試驗",
   "stopMessage": "要停止 {{name}} 嗎？之後不會再複製執行；目前的計數會保留。",
   "kpi": {
    "compared": "已比較",
    "agreed": "一致",
    "diverged": "不一致",
    "failures": "候選部署失敗",
    "agreement": "一致率"
   },
   "comparison": {
    "text": "正規化文字",
    "set": "使用評估集",
    "judge": "由評審代理程式"
   },
   "fields": {
    "source": "來源",
    "candidate": "候選",
    "samplePercent": "抽樣比例",
    "comparison": "比較方式",
    "endsUtc": "結束時間",
    "createdBy": "啟動者",
    "createdUtc": "開始時間",
    "completedUtc": "結束於"
   }
  },
  "canary": {
   "stepOf": "第 {{number}} / {{total}} 階段，{{percent}}%",
   "gateText": "{{name}} 達到 {{score}} 以上",
   "noGate": "沒有評估關卡",
   "errors": {
    "agent": "請選擇要轉移流量的代理程式。",
    "candidate": "請選擇候選部署。",
    "baseline": "請選擇基準部署。",
    "same": "候選部署與基準部署必須是不同的部署。",
    "steps": "請至少列出一個階段。最後一個階段為 100 百分比。",
    "tooMany": "一次發佈最多 {{max}} 個階段。",
    "increasing": "每個階段的百分比為 1 至 100，且高於前一個階段。",
    "lastStep": "最後一個階段必須是 100 百分比。",
    "errorRate": "錯誤率上限為 0 至 100 百分比。",
    "gate": "評估關卡需要同時設定評估集和最低分數，或兩者都不設定。",
    "score": "最低分數為 0 至 100 百分比。"
   }
  },
  "canaryDetail": {
   "title": "金絲雀發佈",
   "heading": "{{agent}} 的金絲雀發佈",
   "back": "所有金絲雀發佈",
   "notFoundTitle": "找不到金絲雀發佈",
   "notFoundBody": "請檢查 ID，或從清單開啟該發佈。",
   "rolledBack": "已回復：{{reason}} 權重已恢復為初始值。",
   "aborted": "已中止：{{reason}} 權重已恢復為初始值。",
   "promoted": "已推進。{{candidate}} 承接全部流量。",
   "noReason": "未提供原因。",
   "withWeight": "{{name}}（發佈前權重 {{weight}}）",
   "gate": "最新評估分數達到 {{score}} 以上",
   "steps": "階段",
   "columns": {
    "step": "階段",
    "weightPercent": "候選部署流量",
    "minimumRuns": "最少執行數",
    "minimumMinutes": "最少分鐘數",
    "state": "狀態"
   },
   "stepStates": {
    "done": "已完成",
    "current": "目前",
    "stopped": "停在此處",
    "pending": "等候中"
   },
   "abortTitle": "中止金絲雀發佈",
   "abortMessage": "要中止發佈嗎？兩個部署都會恢復為發佈開始前的權重。",
   "fields": {
    "agent": "代理程式",
    "candidate": "候選",
    "baseline": "基準",
    "maxErrorRatePercent": "錯誤率上限",
    "gate": "評估關卡",
    "stepStartedUtc": "目前階段開始時間",
    "createdBy": "啟動者",
    "completedUtc": "結束時間"
   }
  },
  "fieldCodes": {
   "InputRequired": "案例需要輸入文字。",
   "UnknownScorer": "請使用完全相符、包含、符合 JSON Schema 或評審代理程式。",
   "ArgumentRequired": "請輸入文字，或填寫案例的預期輸出。",
   "InvalidJsonSchema": "這不是有效的 JSON Schema。",
   "TooManyCases": "此評估集的案例數已達上限。",
   "EvaluatorIsForAgents": "「由代理程式撰寫」來源僅適用於代理程式建立的評估集。請選擇「由人員撰寫」或「來自試驗場」。",
   "SetRequired": "請選擇要執行的評估集。",
   "TargetRequired": "請選擇要評估的對象。",
   "RecentInputsNeedDeployment": "近期輸入會重播部署的執行。請評估部署。",
   "NoRecentInputs": "此部署還沒有可重播的成功執行。",
   "EvalSetEmpty": "此版本沒有案例。",
   "JudgeAgentRequired": "有些案例需要評審代理程式，但此評估集沒有設定。請編輯評估集並選擇一個。",
   "DeploymentNotFound": "此租用戶中沒有該部署。",
   "SameDeployment": "請選擇兩個不同的部署。",
   "DifferentAgent": "兩個部署必須屬於同一個代理程式。",
   "DeploymentInactive": "該部署未啟用。請先啟用它。",
   "AgentMismatch": "代理程式必須是來源部署的代理程式。",
   "EndsInPast": "請選擇未來的結束時間，或留空。",
   "EvalSetNotFound": "此租用戶中沒有該評估集。",
   "AgentNotFound": "此租用戶中沒有該代理程式。",
   "EvalGateIncomplete": "評估關卡需要同時設定評估集和最低分數，或兩者都不設定。",
   "NotIncreasing": "每個階段的百分比必須高於前一個階段。",
   "LastStepNotFull": "最後一個階段必須是 100 百分比。"
  }
 },
 "resources": {
  "evalSets": {
   "title": "評估集",
   "subtitle": "為代理程式評分的版本化案例。核准一個版本後，它就能把關推進和金絲雀發佈。",
   "add": "新增評估集",
   "create": "新增評估集",
   "edit": "編輯評估集",
   "view": "評估集",
   "deleteTitle": "刪除草稿版本",
   "emptyTitle": "還沒有評估集",
   "emptyBody": "在這裡新增評估集及其案例，或從工作室試驗場儲存一輪對話作為第一個案例。",
   "filters": {
    "latestOnly": "版本",
    "newestOnly": "只顯示最新版本",
    "allVersions": "所有版本"
   },
   "columns": {
    "name": "名稱",
    "version": "版本",
    "state": "狀態",
    "origin": "來源",
    "caseCount": "案例",
    "judgeAgent": "評審代理程式",
    "tags": "標籤",
    "authoredByName": "撰寫者",
    "approvedByName": "核准者",
    "description": "描述",
    "lastUpdateUtc": "最後變更",
    "id": "ID"
   },
   "fields": {
    "name": "名稱",
    "description": "描述",
    "origin": "來源",
    "judgeAgent": "評審代理程式",
    "tags": "標籤"
   },
   "hints": {
    "name": "1 至 {{max}} 個字元。各版本的名稱保持不變。",
    "description": "選填，最多 {{max}} 個字元。",
    "origin": "「來自試驗場」標示由試驗場對話發展而來的評估集。",
    "judgeAgent": "負責評分評審檢查、沒有預期輸出的案例以及近期輸入的代理程式。",
    "tags": "選填，每行一個，每個最多 {{max}} 個字元。"
   }
  },
  "evalRuns": {
   "title": "評估執行",
   "subtitle": "評估集版本針對部署或代理程式修訂的每次執行，以及其分數與門檻的比較。",
   "add": "執行評估集",
   "create": "執行評估集",
   "edit": "評估執行",
   "view": "評估執行",
   "deleteTitle": "刪除評估執行",
   "emptyTitle": "還沒有評估執行",
   "emptyBody": "執行評估集，在部署或草稿修訂上線前為其評分。",
   "columns": {
    "setName": "評估集",
    "status": "狀態",
    "verdict": "判定",
    "score": "分數",
    "threshold": "門檻",
    "progress": "進度",
    "target": "評估對象",
    "inputMode": "輸入",
    "costUsd": "成本",
    "startedByName": "啟動者",
    "createdUtc": "開始時間",
    "id": "ID"
   }
  },
  "shadowTrials": {
   "title": "影子試驗",
   "subtitle": "候選部署重播即時部署的一部分輸入但不採取行動，再比較兩者的輸出。",
   "add": "開始影子試驗",
   "create": "開始影子試驗",
   "edit": "影子試驗",
   "view": "影子試驗",
   "deleteTitle": "刪除影子試驗",
   "emptyTitle": "還沒有影子試驗",
   "emptyBody": "開始試驗，在候選部署承接任何流量前，看看它如何回答真實輸入。",
   "columns": {
    "name": "名稱",
    "status": "狀態",
    "source": "來源",
    "candidate": "候選",
    "samplePercent": "抽樣比例",
    "comparedCount": "已比較",
    "agreedCount": "一致",
    "divergedCount": "不一致",
    "candidateFailureCount": "失敗",
    "agreement": "一致率",
    "endsUtc": "結束時間",
    "createdUtc": "開始時間",
    "id": "ID"
   },
   "fields": {
    "name": "名稱",
    "sourceDeploymentId": "來源部署",
    "candidateDeploymentId": "候選部署",
    "samplePercent": "抽樣（百分比）",
    "endsUtc": "結束時間",
    "comparisonEvalSetId": "使用評估集比較",
    "useJudge": "使用評審代理程式比較"
   },
   "hints": {
    "name": "選填，最多 {{max}} 個字元。",
    "sourceDeploymentId": "必填。會複製它成功的執行；它本身不受影響。",
    "candidateDeploymentId": "必填。同一個代理程式的另一個部署。",
    "samplePercent": "1 至 100，預設 10。要複製的來源執行比例。",
    "endsUtc": "選填。留空時會一直執行，直到有人停止。",
    "comparisonEvalSetId": "選填。未指定時，輸出會以正規化文字比較。",
    "useJudge": "請評審代理程式判斷兩個輸出是否一致。"
   }
  },
  "canaryReleases": {
   "title": "金絲雀發佈",
   "subtitle": "候選部署分階段承接代理程式越來越多的流量，表現異常時會自動回復。",
   "add": "開始金絲雀發佈",
   "create": "開始金絲雀發佈",
   "edit": "金絲雀發佈",
   "view": "金絲雀發佈",
   "deleteTitle": "刪除金絲雀發佈",
   "emptyTitle": "還沒有金絲雀發佈",
   "emptyBody": "開始發佈，逐步將流量移到新的部署。",
   "addStep": "新增階段",
   "columns": {
    "agent": "代理程式",
    "status": "狀態",
    "candidate": "候選",
    "baseline": "基準",
    "step": "階段",
    "maxErrorRatePercent": "錯誤上限",
    "gate": "評估關卡",
    "rollbackReason": "回復原因",
    "createdUtc": "開始時間",
    "id": "ID"
   },
   "fields": {
    "agentId": "代理程式",
    "baselineDeploymentId": "基準部署",
    "candidateDeploymentId": "候選部署",
    "steps": "階段",
    "weightPercent": "候選部署流量（百分比）",
    "minimumRuns": "最少執行數",
    "minimumMinutes": "最少分鐘數",
    "maxErrorRatePercent": "錯誤率上限（百分比）",
    "evalSetId": "評估關卡評估集",
    "minEvalScorePercent": "最低評估分數（百分比）"
   },
   "hints": {
    "agentId": "必填。兩個部署都屬於它。",
    "baselineDeploymentId": "必填。它承接其餘的流量。",
    "candidateDeploymentId": "必填。要發佈的部署。",
    "steps": "1 至 {{max}} 個階段。每個百分比都高於前一個，最後一個為 100。",
    "maxErrorRatePercent": "0 至 100，預設 5。某個階段中候選部署的失敗執行超過此比例時，發佈會回復。",
    "evalSetId": "選填。只有此評估集的最新評估執行達到最低分數時，階段才會前進。",
    "minEvalScorePercent": "設定評估關卡評估集時必填，0 至 100。"
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
})(zhHant, {
 "nav": {
  "items": {
   "board": {
    "label": "委員會",
    "tip": "一覽單一組織：健康狀況、待處理事項、提案、支出、煞車措施與 CEO"
   }
  }
 },
 "enums": {
  "notificationEvent": {
   "BoardBrief": "已提交委員會簡報"
  }
 },
 "errorCodes": {
  "BoardCeoMissing": "此組織沒有 CEO：根單位需要一位在生效修訂中擁有守護者的負責人。",
  "BoardCeoUnavailable": "CEO 的守護者沒有部署，因此沒有對象可以對話。請先為該守護者設定部署。"
 },
 "views": {
  "organizationDetail": {
   "openBoard": "委員會"
  }
 },
 "board": {
  "title": "委員會",
  "subtitle": "監督由守護者組成的組織：需要決定的事項、其成本，以及煞車措施。",
  "heading": "{{name}} 的委員會",
  "generated": "更新時間",
  "refresh": "重新整理",
  "openOrganization": "開啟組織",
  "killSwitchOn": "緊急停止開關已開啟：在關閉之前，此租用戶中的守護者都不會喚醒。",
  "notFoundTitle": "無法使用委員會",
  "notFoundBody": "該組織不存在，或您沒有讀取權限。",
  "picker": {
   "title": "選擇組織",
   "select": "組織",
   "choose": "請選擇一個組織",
   "open": "開啟委員會",
   "emptyTitle": "尚無組織",
   "emptyBody": "請先建立一個由守護者組成的組織，其委員會會顯示在這裡。",
   "organizations": "前往組織"
  },
  "chart": {
   "title": "組織圖與健康狀況",
   "empty": "此組織尚無單位。請在組織頁面新增單位並發佈修訂。",
   "health": "單位健康狀況",
   "frozen": "已凍結",
   "overBudget": "超出預算",
   "columns": {
    "unit": "單位",
    "health": "健康狀況",
    "escalations": "未處理的上報",
    "brakes": "煞車",
    "lastReport": "最近的報告"
   }
  },
  "attention": {
   "title": "待處理",
   "empty": "目前沒有需要委員會處理的事項。",
   "none": "無。",
   "escalations_one": "{{count}} 個未處理的上報",
   "escalations_other": "{{count}} 個未處理的上報",
   "reports_one": "{{count}} 份異常報告",
   "reports_other": "{{count}} 份異常報告",
   "caps_one": "{{count}} 個單位已達預算上限",
   "caps_other": "{{count}} 個單位已達預算上限",
   "raisedBy": "提出者：{{name}}",
   "filedBy": "提交者：{{name}}"
  },
  "proposals": {
   "title": "提案",
   "empty": "沒有等待決定的提案。",
   "by": "{{unit}} 中的 {{agent}}",
   "showChanges": "顯示變更",
   "hideChanges": "隱藏變更"
  },
  "evidence": {
   "title": "佐證",
   "empty": "目前還沒有評估執行、影子試驗或金絲雀發佈支持此提案。",
   "since": "自提案於 {{when}} 最後一次變更以來。",
   "evalRuns": "評估執行",
   "shadowTrials": "影子試驗",
   "canaryReleases": "金絲雀發佈",
   "evalSet": "{{name}} v{{version}}",
   "evalScore": "分數 {{score}}，門檻 {{threshold}}，已完成 {{done}}/{{total}} 個案例",
   "stale": "早於最後一次變更",
   "shadow": "影子試驗 {{name}}",
   "shadowCounts": "{{compared}} 次比較中 {{agreed}} 次一致，{{diverged}} 次不一致，候選失敗 {{failures}} 次",
   "canary": "{{name}} 的金絲雀發佈",
   "canaryStep": "第 {{step}} 階段，共 {{total}} 個階段",
   "rollback": "已回復：{{reason}}"
  },
  "spend": {
   "title": "支出與預算",
   "empty": "目前的時間區間內沒有單位設有預算或產生支出。"
  },
  "brief": {
   "title": "最新簡報",
   "ceo": "CEO：{{name}}，{{unit}} 的負責人。",
   "cadence_one": "每小時提交一次簡報。",
   "cadence_other": "每 {{count}} 小時提交一次簡報。",
   "noCadence": "CEO 的守護者沒有設定簡報頻率。",
   "empty": "CEO 尚未提交簡報。"
  },
  "ceo": {
   "missing": "根單位沒有負責人，因此此組織沒有 CEO。",
   "noMandate": "CEO 在生效修訂中沒有守護者。",
   "noDeployment": "CEO 的守護者沒有可以對話的部署。"
  },
  "brakes": {
   "title": "煞車",
   "active_one": "{{count}} 個生效中的凍結",
   "active_other": "{{count}} 個生效中的凍結",
   "none": "沒有任何凍結。",
   "frozenBy": "凍結者：{{name}}",
   "lift": "解除",
   "freezeOrg": "凍結組織",
   "unit": "單位",
   "pickUnit": "請選擇一個單位",
   "freezeUnit": "凍結單位",
   "rollback": "復原組織圖",
   "rollbackTitle": "復原組織圖",
   "rollbackMessage": "要將組織恢復為修訂 {{number}} 之前生效的修訂嗎？指揮鏈、預算與訊息線路會立即跟著變更。",
   "rollbackNote": "從委員會復原",
   "rolledBack": "已復原。修訂 {{number}} 已生效。"
  },
  "direction": {
   "title": "給 CEO 的指示",
   "note": "這段文字會成為 CEO 守護者的新發佈修訂，其下一次巡檢會將它當作委員會的指示讀取。",
   "text": "指示",
   "placeholder": "例如：在稽核結束前，超過 500 美元的退款交由人員處理。",
   "count": "{{count}}/{{max}} 個字元",
   "changeNote": "變更說明",
   "changeNotePlaceholder": "委員會下達此指示的原因（選填）",
   "submit": "送出指示",
   "given": "指示已發佈為 {{name}} 的修訂 {{number}}。",
   "errors": {
    "required": "請填寫給 CEO 的指示。",
    "tooLong": "最多 {{max}} 個字元。"
   }
  },
  "ceoChat": {
   "title": "與 CEO 對話",
   "note": "訊息會以委員會的名義，開啟與 CEO 部署的對話。",
   "talkingTo": "您正以委員會身分與 {{name}} 對話。",
   "conversation": "對話",
   "newConversation": "新對話",
   "new": "新增",
   "transcript": "與 CEO 的對話",
   "empty": "尚無訊息。問問 CEO 組織的狀況如何。",
   "message": "訊息",
   "tooLong": "最多 {{max}} 個字元。"
  }
 },
 "wizard": {
  "steps": {
   "keeper": "第一個守護者"
  },
  "welcomeItemKeeper": "建立您的第一個守護者：一個依排程喚醒並朝目標工作的代理程式。",
  "keeper": {
   "body": "守護者為範例代理程式設定目標，並依排程喚醒它；沒有任何變化時會逐漸拉長間隔。它使用模擬 Harness，因此不會產生費用。您可以在守護者頁面暫停或刪除它。",
   "objectiveDefault": "偶爾檢查一下，並回報一切平靜。",
   "description": "由設定精靈建立。",
   "create": "建立守護者",
   "created": "已建立守護者 {{name}}，它會依排程喚醒。",
   "ready": "守護者 {{name}} 已就緒。請繼續進行測試執行。"
  }
 },
 "tour": {
  "steps": {
   "autonomy": {
    "title": "自主運作",
    "body": "守護者是依排程喚醒並朝目標工作的代理程式。上報、凍結、緊急停止開關、記憶、報告與訊息讓它們保持在掌控之中。"
   },
   "board": {
    "title": "委員會",
    "body": "組織將守護者歸於一位 CEO 之下。委員會分頁顯示單一組織的健康狀況、需要決定的事項、支出與煞車措施，並讓您向 CEO 下達指示或與其對話。"
   }
  }
 },
 "explainers": {
  "board": {
   "title": "委員會",
   "p1": "委員會是位於組織根單位之上的個人或團體。此頁面將他們需要的資訊集中在一處：根據最新報告得出的各單位健康狀況、未處理的上報、異常報告、已達預算上限的單位，以及附有評估、影子與金絲雀佐證、等待決定的提案。",
   "p2": "煞車措施可以凍結某個單位或整個組織、復原組織圖，或以緊急停止開關停止所有守護者。指示會成為 CEO 守護者的新修訂，而「與 CEO 對話」會與 CEO 的部署開啟一般的對話。"
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "board": "委員會：在單一頁面查看一個組織的健康狀況、待處理事項、提案、支出、簡報與煞車措施。"
   }
  },
  "enums": {
   "notificationEvent": {
    "BoardBrief": "某個組織的 CEO 為委員會提交了一份簡報。"
   }
  },
  "views": {
   "organizationDetail": {
    "openBoard": "開啟此組織的委員會：健康狀況、待處理事項、提案、支出、煞車措施與 CEO。"
   }
  },
  "wizard": {
   "keeper": {
    "name": "守護者名稱：可使用字母、數字、點、連字號與底線。",
    "objective": "守護者要達成的目標，每次巡檢都會讀取。",
    "create": "在範例代理程式的模擬 Harness 部署上建立守護者，然後前往測試執行。",
    "skip": "不建立守護者並繼續。您可以稍後在守護者頁面新增。"
   }
  },
  "board": {
   "refresh": "重新讀取委員會。組織變更時也會重新整理。",
   "openOrganization": "開啟組織頁面以編輯單位、預算與修訂。",
   "openEscalation": "開啟上報以進行回覆。",
   "openReport": "開啟報告，查看其指標、問題與決定。",
   "openKeeper": "開啟 CEO 的守護者，查看其巡檢與修訂。",
   "picker": {
    "select": "要開啟其委員會的組織。",
    "open": "開啟此組織的委員會。",
    "organizations": "開啟組織頁面以建立組織。"
   },
   "chart": {
    "title": "生效中的組織圖：每個單位及其負責人、成員、根據最新報告得出的健康狀況與支出。",
    "frozen": "有生效中的凍結涵蓋此單位或整個組織。",
    "overBudget": "此單位的子樹在目前的時間區間內已用完一整份預算。",
    "columns": {
     "unit": "生效修訂中的單位。",
     "health": "根據單位中最新提交的報告得出的健康狀況。沒有報告時為未知。",
     "escalations": "該單位的代理程式提出的未處理上報。",
     "brakes": "是否有凍結涵蓋該單位，以及它是否超出預算。",
     "lastReport": "最新報告的提交時間。點選可開啟該報告。"
    }
   },
   "attention": {
    "title": "等待委員會處理的事項：未處理的上報、最近 7 天內降級或異常的報告，以及已達預算上限的單位。"
   },
   "proposals": {
    "title": "組織主管提出、沒有任何變更規則涵蓋、正在等待人員決定的變更。",
    "toggle": "顯示或隱藏提案的變更，以及涵蓋每項變更的規則，內容從伺服器讀取。"
   },
   "evidence": {
    "title": "自提案最後一次變更以來，所提議代理程式的評估執行、影子試驗與金絲雀發佈。",
    "openEvalRun": "開啟評估執行，查看其案例結果。",
    "openShadowTrial": "開啟影子試驗，查看其比較結果。",
    "openCanary": "開啟金絲雀發佈，查看其階段。",
    "stale": "此評估執行在提案最後一次變更之前就已開始，因此可能沒有測試目前的變更。"
   },
   "spend": {
    "title": "每個單位在當日與當月時間區間內的支出與其預算的對照。"
   },
   "brief": {
    "title": "CEO 為委員會提交的最新簡報，以及 CEO 的守護者要求簡報的頻率。"
   },
   "brakes": {
    "title": "快速停止工作：凍結某個單位或整個組織、復原組織圖，或開啟緊急停止開關。",
    "lift": "解除此凍結。其範圍內的工作可能會重新開始。",
    "freezeOrg": "凍結此組織的所有代理程式與守護者，直到解除凍結為止。會要求確認。",
    "orgFrozen": "此組織已經凍結。請先解除該凍結。",
    "unit": "要凍結的單位，包含其下的所有內容。",
    "freezeUnit": "凍結所選單位及其子樹。會要求確認。",
    "rollback": "恢復為目前修訂之前生效的修訂。會要求確認。",
    "rollbackNone": "沒有更早的生效修訂可以恢復。"
   },
   "direction": {
    "title": "向 CEO 下達指示。文字會發佈為 CEO 守護者的新修訂，來源為委員會。",
    "text": "1 至 4000 個字元。CEO 的下一次巡檢會將它當作委員會的指示讀取。",
    "changeNote": "選填，最多 2000 個字元，會與修訂一起儲存。",
    "submit": "將指示發佈為 CEO 守護者的新修訂。"
   },
   "ceoChat": {
    "title": "與 CEO 部署的對話。每則訊息都是一次執行，可以像其他執行一樣開啟。",
    "conversation": "繼續過去的委員會對話，或開始新的對話。",
    "new": "與 CEO 開始新的對話。",
    "message": "要對 CEO 說的話。按 Enter 傳送，按 Shift+Enter 換行。",
    "send": "傳送訊息。回覆會在下方以串流方式顯示。"
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
})(zhHant, {
 "nav": {
  "items": {
   "performance": {
    "label": "績效",
    "tip": "組織各單位與代理程式的表現，以及代理程式無法自評的檢查"
   }
  }
 },
 "enums": {
  "triggerTargetType": {
   "EvalSet": "定期檢查"
  },
  "notificationEvent": {
   "OrgBudgetFrozen": "單位因超出預算而凍結"
  },
  "auditEventType": {
   "OrgBudgetFrozen": "單位因超出預算而凍結",
   "UnitCascadeCancelled": "已取消單位內的全部工作"
  },
  "rollbackActiveTicks": {
   "Finish": "讓它們完成",
   "Cancel": "取消它們"
  }
 },
 "errorCodes": {
  "OrganizationNotLive": "此組織還沒有生效的修訂。請先發佈一個修訂。"
 },
 "resources": {
  "organizations": {
   "fields": {
    "budgetFreezeMarginPercent": "預算凍結餘裕 (%)"
   },
   "hints": {
    "budgetFreezeMarginPercent": "{{min}} 至 {{max}}，預設 {{default}}。支出超出預算達此比例的單位會被凍結，直到有人解除凍結。0 表示達到預算即凍結。"
   }
  },
  "triggers": {
   "fields": {
    "evalSetId": "評估集",
    "evalJudgeAgentId": "評分代理程式",
    "evalRecentInputCount": "最近輸入數"
   },
   "hints": {
    "evalSetId": "檢查要執行的評估集。管理者可在績效頁面查看結果。",
    "checkDeployment": "必填。檢查會以此部署的最近輸入對評估集重新執行。",
    "evalRecentInputCount": "{{min}} 至 {{max}}，預設 {{default}}。每次檢查重播此部署最新輸入的數量。"
   },
   "errors": {
    "evalSetRequired": "請選擇此檢查要執行的評估集。",
    "deploymentRequired": "請選擇此檢查要評分的部署。",
    "evalRecentInputCount": "請輸入 {{min}} 至 {{max}} 之間的整數。"
   },
   "setJudge": "評估集本身的評分代理程式",
   "checkNotice": "定期檢查會以儲存它的人的身分執行。代理程式無法建立、變更或評分檢查。"
  }
 },
 "organizations": {
  "form": {
   "errors": {
    "margin": "請輸入 {{min}} 至 {{max}} 之間的整數。"
   }
  }
 },
 "views": {
  "organizationDetail": {
   "openPerformance": "績效",
   "freezeMargin": "超出預算 {{percent}}% 時凍結"
  }
 },
 "rollbackTicks": {
  "legend": "進行中的守護者巡檢"
 },
 "cascadeCancel": {
  "action": "取消此單位內的全部工作",
  "title": "取消 {{name}} 內的全部工作",
  "message": "要取消 {{name}} 及其下所有單位中代理程式的每個排隊與執行中的執行、守護者巡檢、未結上報與排隊訊息嗎？此操作不會凍結單位，新工作仍可能重新開始。",
  "reason": "原因",
  "reasonPlaceholder": "為什麼要全部停止（選填）",
  "keep": "繼續執行",
  "confirm": "全部取消",
  "working": "正在取消...",
  "done": "已取消 {{name}} 內的全部工作。",
  "resultIntro": "{{name}} 內的全部工作已停止：",
  "notFrozen": "此單位未凍結。凍結它可阻止新工作開始。",
  "freeze": "凍結單位",
  "counts": {
   "runsCancelled": "已取消的執行",
   "ticksCancelled": "已取消的守護者巡檢",
   "escalationsWithdrawn": "已撤回的上報",
   "messagesExpired": "已過期的訊息"
  }
 },
 "performance": {
  "title": "績效",
  "subtitle": "組織中每個單位與代理程式的表現：結果、成本、延遲、上報與評估分數。",
  "heading": "{{name}} 的績效",
  "range": "{{from}} 至 {{to}}",
  "notFoundTitle": "無法查看績效",
  "notFoundBody": "此組織不存在，或你無權讀取。",
  "unit": "單位",
  "allUnits": "所有單位",
  "lead": "負責人",
  "sample": "執行 {{n}}",
  "outcomes": "成功 {{succeeded}}，失敗 {{failed}}，取消 {{cancelled}}",
  "evalScore_other": "{{count}} 次評估執行，得分 {{score}}",
  "picker": {
   "title": "選擇組織",
   "emptyTitle": "還沒有組織",
   "emptyBody": "請先建立由守護者組成的組織。它的績效會顯示在這裡。"
  },
  "window": {
   "label": "時間範圍",
   "24h": "24 小時",
   "7d": "7 天",
   "30d": "30 天",
   "custom": "自訂",
   "from": "開始日期",
   "to": "結束日期",
   "apply": "套用",
   "errors": {
    "from": "請選擇第一天。",
    "to": "請選擇最後一天。",
    "order": "最後一天不能早於第一天。",
    "span": "時間範圍最多 {{max}} 天。"
   }
  },
  "chart": {
   "title": "各單位的成功率與成本",
   "successRate": "成功率",
   "cost": "成本",
   "noRuns": "沒有已結束的執行",
   "rateLabel": "{{unit}} 的成功率：{{value}}",
   "costLabel": "{{unit}} 的成本：{{value}}"
  },
  "columns": {
   "unit": "單位",
   "agent": "代理程式",
   "runs": "執行",
   "outcomes": "結果",
   "successRate": "成功率",
   "costUsd": "成本",
   "latency": "延遲 p50 / p95 / p99",
   "escalations": "上報",
   "loopGuardRejections": "迴圈防護拒絕",
   "evalScore": "評估分數",
   "samples": "範例執行"
  },
  "units": {
   "title": "單位",
   "empty": "此時間範圍內生效的組織圖中沒有單位。"
  },
  "agents": {
   "title": "代理程式",
   "empty": "生效的組織圖中沒有代理程式。"
  },
  "checks": {
   "title": "定期檢查",
   "note": "檢查是依排程針對某個部署的最近輸入進行的評估執行。由人建立；代理程式無法評分或變更。",
   "new": "新增檢查",
   "empty": "沒有針對此組織部署的定期檢查。",
   "never": "尚未執行",
   "passed": "通過",
   "failed": "低於門檻",
   "columns": {
    "check": "檢查",
    "evalSet": "評估集",
    "deployment": "部署",
    "schedule": "排程",
    "lastRun": "上次執行",
    "lastScore": "上次得分",
    "nextFire": "下次執行"
   }
  }
 },
 "tour": {
  "steps": {
   "performance": {
    "title": "績效",
    "body": "績效分頁顯示組織中每個單位與代理程式在一段時間內的表現，以及不讓代理程式自評、由人設定的定期檢查。"
   }
  }
 },
 "explainers": {
  "performance": {
   "title": "績效",
   "p1": "每個單位列涵蓋該單位及其下所有內容：時間範圍內建立的執行、執行結果、成功率（成功數除以成功數與失敗數的總和）、成本、延遲百分位、發起的上報、迴圈防護拒絕，以及針對該單位部署的評估執行平均分數。評估、影子與試驗場執行不計入。",
   "p2": "定期檢查是 EvalSet 觸發器：依排程以已核准的評估集針對某個部署的最近輸入執行。只有人能建立它們，因此代理程式無法替自己的工作評分。"
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "performance": "績效：依單位與代理程式顯示結果、成本、延遲、上報與評估分數，以及定期檢查。"
   }
  },
  "enums": {
   "triggerTargetType": {
    "EvalSet": "每次觸發都會針對部署的最近輸入啟動一次評估集執行。只有人可以建立。"
   },
   "notificationEvent": {
    "OrgBudgetFrozen": "某個單位的支出超出預算達組織設定的餘裕，預算守衛已將其凍結。"
   },
   "auditEventType": {
    "OrgBudgetFrozen": "預算守衛凍結了一個支出超出預算達組織餘裕的單位。",
    "UnitCascadeCancelled": "有人取消了某個單位子樹中的每個執行、守護者巡檢、上報與排隊訊息。"
   },
   "rollbackActiveTicks": {
    "Finish": "正在進行的巡檢會完成，但其守護者會留在恢復後的修訂上。",
    "Cancel": "在恢復組織圖之前取消進行中巡檢的執行。"
   }
  },
  "resources": {
   "organizations": {
    "budgetFreezeMarginPercent": "單位可以超出預算多少（百分比）才會被預算守衛凍結：0 至 100，預設 10。"
   },
   "triggers": {
    "evalSetId": "檢查每次觸發時執行的評估集。",
    "evalJudgeAgentId": "為回答評分的代理程式。留空則使用評估集的評分代理程式。",
    "evalRecentInputCount": "每次評估執行重播此部署最新輸入的數量，1 至 50。"
   }
  },
  "views": {
   "organizationDetail": {
    "openPerformance": "開啟此組織依單位與代理程式區分的績效及其定期檢查。"
   }
  },
  "rollbackTicks": {
   "legend": "復原組織圖時，進行中的守護者巡檢要如何處理。"
  },
  "board": {
   "brakes": {
    "pickUnitFirst": "請先選擇一個單位。"
   }
  },
  "cascadeCancel": {
   "action": "停止此單位及其下所有單位的全部工作：執行、守護者巡檢、上報與排隊訊息。會要求確認。",
   "confirm": "立即取消此單位子樹中的全部工作。此操作無法復原。",
   "reason": "選填，最多 1024 個字元。會記錄在稽核記錄與被撤回的上報中。",
   "freeze": "凍結此單位，在解除凍結前不會開始新工作。",
   "counts": {
    "runsCancelled": "子樹中代理程式被取消的排隊與執行中的執行。",
    "ticksCancelled": "被取消的進行中守護者巡檢。",
    "escalationsWithdrawn": "子樹中代理程式發起、已被撤回的未結上報。",
    "messagesExpired": "寄給子樹中代理程式、已過期的排隊訊息。"
   }
  },
  "performance": {
   "refresh": "重新讀取所選時間範圍的績效。",
   "unit": "顯示一個單位及其下所有內容，或顯示所有單位。",
   "lead": "此代理程式負責其單位。",
   "openAgent": "開啟代理程式。",
   "openRun": "開啟此範例執行。",
   "picker": {
    "open": "開啟此組織的績效。"
   },
   "window": {
    "24h": "最近 24 小時。",
    "7d": "最近 7 天。",
    "30d": "最近 30 天。",
    "custom": "選擇第一天與最後一天，相隔最多 90 天。",
    "from": "時間範圍的第一天（UTC）。",
    "to": "時間範圍的最後一天（UTC），包含當天。",
    "apply": "讀取這些日期的績效。"
   },
   "chart": {
    "title": "時間範圍內每個單位子樹的成功率與成本。",
    "successRate": "成功的執行除以成功與失敗執行的總和。",
    "cost": "單位子樹的支出，以最貴的單位為基準縮放。"
   },
   "columns": {
    "unit": "單位。其列涵蓋其下所有內容。",
    "agent": "代理程式及其所在的單位。",
    "runs": "時間範圍內建立的執行，不含評估、影子與試驗場執行。",
    "outcomes": "成功、失敗與已取消的執行。",
    "successRate": "成功數除以成功數與失敗數的總和。沒有執行結束時為空。",
    "costUsd": "這些執行的支出（美元）。",
    "latency": "已結束執行耗時的中位數、第 95 與第 99 百分位。",
    "escalations": "發起的上報，以及發起上報的執行所佔比例。",
    "loopGuardRejections": "被迴圈防護拒絕的訊息傳送與喚醒。",
    "evalScore": "針對這些部署已完成評估執行的平均分數，包括定期檢查。",
    "samples": "最多五個可查看的執行：先是最新的失敗執行，再來是最新的成功執行。"
   },
   "units": {
    "title": "每個單位及其整個子樹的指標。"
   },
   "agents": {
    "title": "生效組織圖中每個代理程式自己的指標。"
   },
   "checks": {
    "title": "由人設定、依排程針對組織部署進行的評估執行。",
    "new": "開啟觸發器編輯器，並將目標設為定期檢查。",
    "openSet": "開啟評估集。",
    "openRun": "開啟上次評估執行及其案例結果。",
    "passed": "上次執行達到評估集的門檻。",
    "failed": "上次執行低於評估集的門檻。",
    "columns": {
     "check": "排定此檢查的觸發器，以及它是否啟用。",
     "evalSet": "檢查執行的評估集。",
     "deployment": "檢查重播其最近輸入的部署。",
     "schedule": "觸發器的 cron 運算式。",
     "lastRun": "上次評估執行的開始時間與狀態。點選開啟該執行。",
     "lastScore": "上次評估執行的得分，0 至 100%。",
     "nextFire": "檢查下次執行的時間。"
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
})(zhHant, {
 "common": {
  "tabs": {
   "scrollBack": "顯示前面的分頁",
   "scrollForward": "顯示更多分頁"
  }
 },
 "evals": {
  "run": {
   "placeholders": {
    "thresholdPercent": "無",
    "budgetUsd": "無"
   },
   "hints": {
    "thresholdPercent": "選填，0 到 100。加權分數達到此值即為通過。留空表示沒有門檻，也沒有通過或未通過的判定。",
    "budgetUsd": "選填。案例與評審執行花費達到此金額後，其餘案例會略過，執行失敗。留空表示沒有預算。"
   }
  }
 },
 "tips": {
  "permissions": {
   "denied": "你無權執行此操作。需要{{resource}}的 {{operation}} 權限。"
  },
  "views": {
   "escalationDetail": {
    "openKeeperNamed": "開啟提出它的 tick 所屬的 keeper。其 ID 為 {{id}}。"
   }
  },
  "tabs": {
   "scrollBack": "將分頁列向後捲動，顯示第一個可見分頁之前隱藏的分頁。",
   "scrollForward": "捲動分頁列，顯示超出邊緣而隱藏的分頁。"
  },
  "enums": {
   "wakeSource": {
    "Manual": "有人喚醒了 keeper：立即喚醒、恢復、發佈修訂或給予指示。"
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
})(zhHant, {
 "enums": {
  "auditEventType": {
   "MandatePaused": "Keeper 已暫停",
   "MandateResumed": "Keeper 已恢復",
   "MandateWoken": "Keeper 已喚醒",
   "MandateDeleted": "Keeper 已刪除",
   "EscalationAnswered": "升級已回答",
   "EscalationCancelled": "升級已取消"
  }
 },
 "board": {
  "attention": {
   "earlier_one": "以及之前的 {{count}} 份",
   "earlier_other": "以及之前的 {{count}} 份"
  },
  "direction": {
   "unchanged": "{{name}} 的目前修訂已包含此指示。未發佈任何內容，CEO 也未喚醒。"
  }
 },
 "errorCodes": {
  "RevisionUnchanged": "沒有變更：草稿與最新發佈的修訂內容相同，因此未發佈。請在發佈前修改，或將其捨棄。"
 },
 "components": {
  "keeperRevision": {
   "unchanged": "已將修訂 {{number}} 儲存為草稿，但未發佈：它與目前修訂內容相同。"
  }
 },
 "common": {
  "fieldCodes": {
   "InvalidType": "此值的類型不正確。",
   "InvalidTypeOf": "請輸入{{type}}。",
   "InvalidValue": "不允許此值。",
   "InvalidValueOneOf": "請選擇以下其中之一：{{values}}。",
   "InvalidValueRange": "請輸入 {{min}} 到 {{max}} 之間的值。",
   "fieldMessage": "{{field}}：{{message}}"
  },
  "fieldTypes": {
   "text": "文字",
   "trueFalse": "true 或 false",
   "wholeNumber": "整數",
   "number": "數字",
   "map": "名稱與值的物件",
   "list": "清單",
   "object": "物件",
   "dateTime": "類似 2026-12-31T00:00:00Z 的日期時間",
   "duration": "類似 00:05:00 的時長"
  }
 },
 "resources": {
  "harnessProfiles": {
   "fields": {
    "mcpToolNamePrefix": "MCP 工具名稱前綴"
   },
   "hints": {
    "mcpToolNamePrefix": "選填。字母、數字、_ - . : 和 {server}，最多 128 個字元。"
   },
   "errors": {
    "toolPrefixTooLong": "最多使用 {{max}} 個字元。",
    "toolPrefixInvalid": "只能使用字母、數字、_ - . : 和 {server}。"
   }
  }
 },
 "tips": {
  "enums": {
   "auditEventType": {
    "MandatePaused": "有人暫停了一個 keeper：恢復之前不會再喚醒。",
    "MandateResumed": "有人恢復了一個已暫停的 keeper，它現在喚醒。",
    "MandateWoken": "有人對一個 keeper 使用了立即喚醒。",
    "MandateDeleted": "有人刪除了一個 keeper 及其修訂和 tick。",
    "EscalationAnswered": "有人回答了一個未處理的升級。",
    "EscalationCancelled": "有人取消了一個未處理的升級。"
   }
  },
  "board": {
   "attention": {
    "earlier_one": "此作者在過去 7 天內還提交了之前的 {{count}} 份降級或不健康報告。開啟其全部報告。",
    "earlier_other": "此作者在過去 7 天內還提交了之前的 {{count}} 份降級或不健康報告。開啟其全部報告。"
   }
  },
  "keeperRevision": {
   "unchanged": "此修訂與目前修訂內容相同，發佈不會改變任何內容。請先做些修改。"
  },
  "resources": {
   "harnessProfiles": {
    "mcpToolNamePrefix": "harness 向模型顯示 MCP 工具時加在工具名稱前的內容。用 {server} 代表伺服器名稱，例如 mcp__{server}__ 或 {server}.（點）。如果模型看到的是原始工具名稱，請留空。"
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
})(zhHant, {
 "nav": {
  "hubs": {
   "autonomy": {
    "tip": "自行持續工作的代理：守護者依排程喚醒，彼此傳送訊息，提交報告，記住資訊，並在受阻時詢問人員。凍結可以讓它們停止。"
   },
   "organizations": {
    "label": "組織",
    "tip": "依單位組織圖排列的代理，每個單位有負責人與預算，包括董事會、依單位的表現，以及讓高階主管代理套用提案的變更規則。"
   },
   "evaluations": {
    "label": "評估",
    "tip": "變更進入生產環境之前的檢查：評估集及其執行、與線上代理並行的影子試驗，以及分階段轉移流量的金絲雀發布。"
   }
  }
 },
 "tips": {
  "nav": {
   "hubs": {
    "autonomy": "自行持續工作的代理：守護者依排程喚醒，彼此傳送訊息，提交報告，記住資訊，並在受阻時詢問人員。凍結可以讓它們停止。",
    "organizations": "依單位組織圖排列的代理，每個單位有負責人與預算，包括董事會、依單位的表現，以及讓高階主管代理套用提案的變更規則。",
    "evaluations": "變更進入生產環境之前的檢查：評估集及其執行、與線上代理並行的影子試驗，以及分階段轉移流量的金絲雀發布。"
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
})(zhHant, {
 "components": {
  "table": {
   "columns": "欄位"
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
})(zhHant, {
 "trail": {
  "tab": "軌跡",
  "loading": "正在載入軌跡...",
  "notFound": "找不到此執行的軌跡。該執行可能已被刪除。",
  "refresh": "重新整理",
  "exportJson": "匯出 JSON",
  "openTrail": "開啟軌跡",
  "openStep": "詳細資料",
  "openStepNamed": "{{step}} 的詳細資料",
  "callerLane": "呼叫端",
  "focusRun": "你開啟的執行",
  "runOfKind": "執行：{{kind}}",
  "redactedTitle": "{{kind}}（已隱藏）",
  "redactedNote": "部分步驟已隱藏，因為你無權讀取其記錄。它們只顯示類型和時間。",
  "idleGap": "閒置 {{duration}}",
  "keysHint": "方向鍵在步驟間移動，Enter 開啟步驟。",
  "sequenceLabel": "{{lanes}} 條泳道中 {{steps}} 個步驟的序列",
  "graphLabel": "{{steps}} 個步驟的圖",
  "listEmpty": "沒有符合這些篩選條件的步驟。",
  "singleTitle": "此執行沒有啟動其他任何項目",
  "singleBody": "它沒有傳送訊息、沒有啟動其他執行，也沒有提交任何內容。軌跡顯示請求與回覆。",
  "truncationSetting": "軌跡設定",
  "truncation": {
   "NodeCap": "此軌跡在 {{count}} 個步驟處被截斷，這是伺服器建構的上限。之後的步驟未顯示。",
   "HopCap": "此軌跡在 {{hops}} 次訊息跳轉後被截斷，這是伺服器追蹤的上限。之後的跳轉未顯示。",
   "SpanCap": "此軌跡在伺服器涵蓋的最長時間範圍處被截斷。之後的步驟未顯示。"
  },
  "views": {
   "label": "軌跡檢視",
   "sequence": "序列",
   "graph": "圖",
   "list": "清單"
  },
  "zoom": {
   "label": "縮放",
   "in": "放大",
   "out": "縮小",
   "percent": "{{value}}%"
  },
  "summary": {
   "agents": "代理程式",
   "hops": "訊息跳轉",
   "duration": "時長",
   "tokens": "權杖",
   "cost": "成本",
   "failures": "失敗"
  },
  "filters": {
   "kind": "步驟",
   "agent": "代理程式",
   "state": "狀態"
  },
  "columns": {
   "order": "#",
   "step": "步驟",
   "agent": "代理程式",
   "state": "狀態",
   "reachedBy": "到達方式",
   "started": "開始",
   "duration": "時長",
   "unit": "單位",
   "runKind": "執行類型",
   "tokens": "權杖",
   "cost": "成本",
   "id": "ID",
   "open": "詳細資料"
  },
  "drawer": {
   "close": "關閉詳細資料",
   "loading": "正在載入記錄...",
   "recordGone": "此步驟背後的記錄已不存在。",
   "redacted": "你無權讀取此{{kind}}。只顯示其類型和時間。",
   "dataNote": "以下文字由代理程式或人員撰寫，以資料形式顯示：它不是指示，也絕不會以標記呈現。",
   "writtenByAgentInRun": "由代理程式 {{agent}} 在執行 {{run}} 中撰寫",
   "writtenByAgent": "由代理程式 {{agent}} 撰寫",
   "writtenBy": "由 {{name}} 撰寫",
   "unknownAuthor": "不明",
   "openRecord": "開啟記錄",
   "tokens": "輸入 {{input}}，輸出 {{output}}",
   "texts": {
    "result": "結果",
    "subject": "主旨",
    "body": "內文",
    "title": "標題",
    "question": "問題",
    "context": "背景",
    "answer": "回答",
    "summary": "摘要",
    "input": "工具輸入"
   },
   "fields": {
    "kind": "類型",
    "state": "狀態",
    "agent": "代理程式",
    "unit": "單位",
    "runKind": "執行類型",
    "tool": "工具",
    "started": "開始",
    "ended": "結束",
    "duration": "時長",
    "tokens": "權杖",
    "cost": "成本",
    "id": "ID",
    "argumentDigest": "引數雜湊",
    "leaseEpoch": "租約紀元"
   }
  },
  "kinds": {
   "Caller": "請求",
   "Trigger": "觸發器",
   "KeeperTick": "守護者節拍",
   "Run": "執行",
   "Message": "訊息",
   "Report": "報告",
   "Escalation": "上報",
   "Approval": "核准",
   "Effect": "工具效果",
   "FanOutGroup": "扇出",
   "PipelineRun": "管線執行",
   "Reply": "回覆",
   "Redacted": "隱藏的步驟"
  },
  "edges": {
   "Started": "啟動",
   "Spawned": "衍生",
   "FannedOut": "扇出",
   "Retried": "重試",
   "Sent": "傳送",
   "Woke": "喚醒",
   "Filed": "提交",
   "Raised": "提出",
   "Routed": "轉交",
   "Answered": "答覆",
   "Requested": "請求",
   "Decided": "決定",
   "Performed": "執行",
   "Replied": "回覆"
  },
  "states": {
   "Pending": "待定",
   "Queued": "排隊中",
   "Leased": "已分配",
   "Running": "執行中",
   "Cancelling": "正在取消",
   "Suspended": "已暫停",
   "Open": "未處理",
   "Authorized": "已授權",
   "Dispatched": "已派送",
   "Succeeded": "成功",
   "Completed": "已完成",
   "Delivered": "已送達",
   "Acknowledged": "已確認",
   "Answered": "已答覆",
   "Filed": "已提交",
   "Approved": "已核准",
   "Joined": "已匯合",
   "Failed": "失敗",
   "TimedOut": "已逾時",
   "Rejected": "已拒絕",
   "Denied": "已否決",
   "Expired": "已過期",
   "BudgetExceeded": "超出預算",
   "Unknown": "不明",
   "Cancelled": "已取消",
   "Withdrawn": "已撤回"
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
})(zhHant, {
 "components": {
  "orgDesigner": {
   "tabs": {
    "design": "設計",
    "people": "人員",
    "keepers": "守護者",
    "budget": "預算",
    "rules": "規則",
    "label": "單位 {{name}}"
   },
   "note": "變更會立即儲存到工作樹。從頁面頂端發佈修訂之前，不會生效。",
   "empty": "還沒有單位。用「新增單位」建立根單位，或從範本開始一個新組織。",
   "narrow": "畫布需要更寬的螢幕，所以單位以清單顯示在下方。每次變更仍會儲存到工作樹。",
   "failed": "{{change}}未能完成。",
   "operations": {
    "AddUnit": "新增單位",
    "RemoveUnit": "移除單位",
    "MoveUnit": "移動單位",
    "SetLead": "變更負責人",
    "AddUnitMember": "新增成員",
    "RemoveUnitMember": "移除成員",
    "ConnectUnits": "新增同級線路",
    "DisconnectUnits": "移除同級線路",
    "SetBudget": "儲存預算",
    "AttachMandate": "連結守護者",
    "DetachMandate": "解除守護者"
   },
   "minimap": "組織小地圖",
   "node": {
    "problems_one": "{{count}} 個問題",
    "problems_other": "{{count}} 個問題"
   },
   "announce": {
    "leadSet": "{{name}} 現在負責 {{unit}}。"
   },
   "keys": {
    "undo": "Ctrl+Z 復原上一次變更，Ctrl+Shift+Z 或 Ctrl+Y 取消復原（Mac 上用 Cmd）。",
    "place": "在「人員」中選好代理程式後，在單位上按 Enter 將其新增為成員，按 L 將其設為負責人。"
   },
   "history": {
    "label": "復原與取消復原",
    "undo": "復原",
    "redo": "取消復原",
    "undone": "已復原：{{change}}。",
    "redone": "已取消復原：{{change}}。",
    "methods": {
     "addUnit": "新增單位",
     "removeUnit": "移除單位",
     "moveUnit": "移動單位",
     "setLead": "變更負責人",
     "addMember": "新增成員",
     "removeMember": "移除成員",
     "connectUnits": "新增同級線路",
     "disconnectUnits": "移除同級線路",
     "setBudget": "變更預算",
     "attachMandate": "連結守護者",
     "detachMandate": "解除守護者"
    }
   },
   "palette": {
    "title": "人員",
    "search": "搜尋代理程式",
    "hint": "把代理程式拖到單位上可新增為成員，拖到負責人那一列可設為負責人。也可以先選取代理程式，再選擇要放到哪裡。",
    "none": "此租戶還沒有代理程式。",
    "noMatch": "沒有符合搜尋的代理程式。",
    "inUnit": "在 {{unit}}",
    "newAgent": "新增代理程式",
    "newAgentTitle": "為 {{unit}} 新增代理程式",
    "placing": "放置 {{name}}：",
    "unit": "單位",
    "as": "身分",
    "asMember": "成員",
    "asLead": "負責人",
    "place": "放置"
   },
   "structure": {
    "lead": "負責人",
    "title": "負責人職稱",
    "setLead": "設為負責人",
    "parent": "隸屬於",
    "move": "移動"
   },
   "keepers": {
    "hint": "守護者是代理程式依喚醒排程持續執行的常設工作。單位中的每個職位可以有一個守護者。",
    "noPeople": "請先新增負責人或成員。守護者會連結到單位中的人員。",
    "lead": "負責人",
    "member": "成員",
    "none": "未連結守護者。",
    "nextWake": "下次喚醒 {{when}}",
    "notScheduled": "未排程",
    "every": "每 {{interval}}",
    "schedule": "編輯排程",
    "detach": "解除",
    "pick": "要連結的守護者",
    "attach": "連結",
    "create": "新增守護者",
    "createTitle": "為 {{name}} 新增守護者"
   },
   "budget": {
    "hint": "預算限制單位及其下所有單位可花費的金額。支出是目前已發佈修訂在目前時間範圍內的數字。",
    "amount": "預算（USD）",
    "clear": "清除",
    "noSpend": "此時間範圍內沒有支出紀錄。",
    "cap": "最多 {{amount}}，即 {{unit}} 的{{period}}預算。",
    "noCap": "上層單位沒有設定{{period}}預算。",
    "capLeft": "{{unit}} 在此時間範圍內還剩 {{left}}。"
   },
   "rules": {
    "hint": "變更規則讓主管在此子樹中的例行提案不需要人員就能套用。規則只能由人撰寫。",
    "add": "新增規則",
    "none": "沒有涵蓋此單位的變更規則。",
    "here": "設定在此單位上。",
    "above": "設定在上層單位 {{unit}} 上。",
    "by": "由 {{name}} 撰寫。",
    "runToken": "代理程式不能撰寫變更規則，因此執行權杖只能以唯讀方式檢視此清單。"
   },
   "problems": {
    "title_one": "檢查：{{count}} 個問題",
    "title_other": "檢查：{{count}} 個問題",
    "checking": "正在檢查組織...",
    "none": "沒有發現問題。",
    "failed": "無法執行檢查：{{reason}}",
    "show": "顯示 {{unit}}",
    "UnitWithoutLead": "{{unit}} 沒有負責人。",
    "AgentInTwoUnits": "{{agent}} 位於多個單位中，包括 {{unit}}。",
    "PeerLineToMissingUnit": "{{unit}} 有一條同級線路指向不在此組織中的單位。",
    "BudgetOverParent": "{{unit}} 的預算高於其上層單位的預算。",
    "KeeperDeploymentMissing": "{{unit}} 中 {{agent}} 的守護者 {{mandate}} 沒有可用的部署。",
    "UnitDetachedFromRoot": "{{unit}} 無法連到根單位。"
   },
   "overlay": {
    "range": "活動時間範圍",
    "days_one": "{{count}} 天",
    "days_other": "{{count}} 天",
    "spend": "{{period}}：{{spent}} / {{amount}}",
    "spendOnly": "{{period}}：已花費 {{spent}}",
    "activity_one": "最近 {{count}} 天：{{runs}} 次執行、{{escalations}} 次上報、{{cost}}",
    "activity_other": "最近 {{count}} 天：{{runs}} 次執行、{{escalations}} 次上報、{{cost}}",
    "pick": "選取一個單位以檢視其最近的執行。",
    "noReport": "尚未提交報告。",
    "noActivity": "此時間範圍內沒有活動。",
    "runs": "最近的執行",
    "noRuns": "此時間範圍內沒有執行。",
    "openTrail": "開啟軌跡"
   },
   "chartLayout": {
    "label": "組織圖版面",
    "tree": "樹狀",
    "canvas": "畫布"
   },
   "templates": {
    "title": "從範本新增組織",
    "open": "從範本新增",
    "intro": "從空組織開始，或套用一個範例組織。範例在模擬 Harness 上執行，因此不需要憑證。",
    "apply": "套用範本",
    "create": "建立組織",
    "preview": "查看會建立什麼",
    "previewHint": "套用前先查看會建立什麼。這會以試執行方式執行資訊清單，並列出將建立或變更的項目。",
    "contents_one": "此範本包含 {{count}} 個資源",
    "contents_other": "此範本包含 {{count}} 個資源",
    "ticks": "此範本中的守護者會在套用後幾秒內開始喚醒。",
    "blank": {
     "name": "空白",
     "body": "一個空組織。根單位在「設計」分頁中新增。"
    },
    "gerbil": {
     "name": "Gerbil",
     "body": "一個單位裡有一個守護者。它監看一個狀態頁面，頁面持續停擺時會詢問人員。"
    },
    "siteReliability": {
     "name": "網站可靠性",
     "body": "一位負責人和三個守護者照看一個公開網站，包含同級線路、預算和一位記憶整理員。"
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
})(zhHant, {
 "nav": {
  "learn": "學習",
  "hubs": {
   "learn": {
    "label": "學習",
    "tip": "用圖示、導覽和詞彙表說明 Garrison 各部分如何配合"
   }
  },
  "items": {
   "learn": {
    "label": "學習",
    "tip": "用圖示、導覽和詞彙表說明 Garrison 各部分如何配合"
   }
  }
 },
 "learn": {
  "title": "學習",
  "subtitle": "一張圖一張圖地看 Garrison 的各個部分如何配合。點方塊開啟對應頁面，點角落的書本圖示開啟對應指南。",
  "toc": "本頁內容",
  "startTourNamed": "導覽：{{tour}}",
  "showList": "以清單顯示",
  "showDiagram": "以圖示顯示",
  "openPage": "{{name}}。開啟{{page}}。",
  "openDoc": "在 {{doc}} 中閱讀{{name}}",
  "glossaryTitle": "詞彙表",
  "glossaryIntro": "這裡用的是文件中的詞。儀表板用詞不同的地方，條目裡會註明。",
  "list": {
   "parts": "組成部分",
   "connections": "關係",
   "connection": "{{from}} {{arrow}} {{to}}",
   "connectionLabelled": "{{from}} {{arrow}} {{to}}：{{label}}",
   "doc": "指南：{{doc}}"
  },
  "tours": {
   "firstLook": "初次認識",
   "runAnAgent": "執行一個代理程式",
   "followARequest": "追蹤一個請求",
   "buildATeam": "組建團隊",
   "keepItSafe": "確保安全",
   "watchAnOrganization": "觀察一個組織"
  },
  "diagrams": {
   "runtime": {
    "title": "執行環境",
    "summary": "租用戶裡有代理程式，以及執行這些代理程式的部署。部署把代理程式與 Harness 設定檔、模型、提示和節點池綁在一起。每個請求都會變成一次執行，該節點池裡的工作節點領取這次執行並啟動 Harness。工作節點從不存取資料庫：它需要的一切都隨租約一起送達。",
    "desc": "租用戶包含存取金鑰、代理程式、Harness 設定檔、部署和執行。節點池和工作節點組成各租用戶共用的機群。",
    "groups": {
     "tenant": "租用戶",
     "fleet": "共用機群"
    },
    "boxes": {
     "credential": {
      "title": "存取金鑰",
      "body": "屬於某位使用者的金鑰。呼叫端和工作節點用它登入。"
     },
     "agent": {
      "title": "代理程式",
      "body": "呼叫端透過 REST、MCP 或 A2A 呼叫的對象。它保存不可變的修訂。"
     },
     "harnessProfile": {
      "title": "Harness 設定檔",
      "body": "說明某個 Harness CLI 或 API 如何無介面執行。儀表板裡稱為連線。"
     },
     "deployment": {
      "title": "部署",
      "body": "把代理程式與 Harness 設定檔、模型、提示和節點池綁定。"
     },
     "nodePool": {
      "title": "節點池",
      "body": "一組工作節點，可以專供特定租用戶使用。"
     },
     "run": {
      "title": "執行",
      "body": "代理程式在一個部署上的一次執行，附帶事件和結果。"
     },
     "node": {
      "title": "工作節點",
      "body": "領取自己能處理的執行，並為每次執行啟動 Harness。"
     }
    },
    "arrows": {
     "invokes": "呼叫",
     "runsOn": "執行於",
     "usedBy": "被使用",
     "targets": "指向",
     "creates": "建立",
     "groups": "分組",
     "leases": "租用"
    }
   },
   "request": {
    "title": "一個請求的歷程",
    "summary": "啟動代理程式的各種方式最後都走到同一個地方。REST、MCP 和 A2A 共用一個呼叫入口，它先選定部署，只有在凍結、單位預算和佇列上限都不阻擋時才接納這次執行。工作節點領取佇列中的執行，拿到編譯好的規格，然後啟動 Harness。輸出以事件的形式傳回，呼叫端拿到結果。",
    "desc": "請求從呼叫端經 REST、MCP 或 A2A 進入執行准入和佇列。工作節點租用它並啟動 Harness，輸出以事件和回覆的形式傳回。",
    "groups": {
     "controlPlane": "控制平面",
     "worker": "在工作節點上"
    },
    "boxes": {
     "caller": {
      "title": "呼叫端",
      "body": "一個人、一個 SDK、一個 MCP 用戶端或一個 A2A 代理程式。"
     },
     "surface": {
      "title": "REST、MCP 或 A2A",
      "body": "三者使用同一個呼叫入口，都會檢查對代理程式的 Execute 權限。"
     },
     "admission": {
      "title": "執行准入",
      "body": "選定部署，然後檢查凍結、單位預算和佇列上限。被拒絕的執行根本不會建立。"
     },
     "queued": {
      "title": "已排入佇列",
      "body": "等待具備合適 Harness、節點池和標籤的工作節點。"
     },
     "lease": {
      "title": "租約",
      "body": "工作節點長輪詢，用 compare-and-set 領取執行，並拿到編譯好的規格。"
     },
     "harness": {
      "title": "Harness",
      "body": "CLI 或供應商 API，依規格裡的引數、檔案和 MCP 伺服器啟動。"
     },
     "events": {
      "title": "事件",
      "body": "分批傳送解析後的輸出：文字、工具呼叫、用量和結果。"
     },
     "reply": {
      "title": "回覆",
      "body": "等待中的呼叫傳回這次執行。串流連線收到最後一個事件。"
     }
    },
    "arrows": {
     "sends": "請求",
     "admitted": "已准入",
     "leased": "已租用",
     "starts": "啟動",
     "returns": "結果"
    }
   },
   "autonomy": {
    "title": "自主運作的基本構件",
    "summary": "守護者是一個有常設任務的代理程式，這項任務寫成一份職責。Garrison 依排程喚醒它，每次喚醒就是一次巡檢：一次普通的執行，以守護者回報它的發現結束。過程中它可以為之後的巡檢記下內容，向上級提交報告，也可以把不該獨自決定的問題上報。答覆送達後會再次喚醒它。",
    "desc": "守護者持有一份職責，職責的喚醒排程啟動巡檢。每次巡檢啟動一次守護者執行，它寫入記憶、提交報告並發起上報。得到答覆的上報會再次喚醒守護者。",
    "boxes": {
     "keeper": {
      "title": "守護者",
      "body": "有常設任務的代理程式。API 把這筆紀錄稱為 mandate。"
     },
     "mandate": {
      "title": "職責",
      "body": "已發佈的修訂：目標、健康狀態的定義、自主範圍和上報政策。"
     },
     "schedule": {
      "title": "喚醒排程",
      "body": "帶退避的最短和最長間隔。領導者對每次到期的喚醒只領取一次。"
     },
     "tick": {
      "title": "巡檢",
      "body": "一次喚醒，記錄喚醒來源和結果：平靜、已處理、需要關注或已上報。"
     },
     "run": {
      "title": "守護者執行",
      "body": "在職責所用部署上的一次 Keeper 類型執行。以回報巡檢結束。"
     },
     "memory": {
      "title": "記憶",
      "body": "帶 recall 標籤的條目會出現在下一次巡檢的輸入裡。"
     },
     "report": {
      "title": "報告",
      "body": "向上提交。上級的下一次巡檢會在摘要中讀到它。"
     },
     "escalation": {
      "title": "上報",
      "body": "向某個人、某個角色或另一個代理程式提出的問題。"
     }
    },
    "arrows": {
     "holds": "持有",
     "sets": "設定",
     "comesDue": "到期",
     "starts": "啟動",
     "writes": "寫入",
     "files": "提交",
     "raises": "發起",
     "answerWakes": "答覆後喚醒"
    }
   },
   "teams": {
    "title": "團隊",
    "summary": "代理程式之間透過信箱互相寫信。訊息是信件，不是電話：寄件者繼續做自己的事，收件者在下一次執行時讀到它，緊急訊息則會立即讀到。每次傳送都先經過防迴圈檢查，被拒絕的訊息連同原因一起保存，方便你看清誰想聯絡誰。",
    "desc": "訊息通過防迴圈檢查進入收件者的信箱，或者被保存為已拒絕。一般郵件等待收件者的下一次執行，緊急郵件會喚醒收件者。",
    "boxes": {
     "sender": {
      "title": "寄件者",
      "body": "某個代理程式的執行，或一個人。代理程式只能沿著線路寫信。"
     },
     "guards": {
      "title": "防迴圈檢查",
      "body": "依序為：收件者已凍結、無線路、跳數上限、討論串上限、線路速率。"
     },
     "mailbox": {
      "title": "信箱",
      "body": "收件者排隊中的訊息，最早的在前。"
     },
     "normal": {
      "title": "一般投遞",
      "body": "等待守護者的下一次巡檢，或等待一次讀取收件匣的執行。"
     },
     "rejected": {
      "title": "已拒絕",
      "body": "連同原因一起保存，永不投遞。"
     },
     "urgent": {
      "title": "緊急喚醒",
      "body": "把守護者的下一次喚醒提前；沒有守護者時啟動一次 Message 執行。"
     },
     "recipient": {
      "title": "收件者執行",
      "body": "一次執行帶上所有已送達的訊息，所以十則訊息只花一次巡檢。"
     }
    },
    "arrows": {
     "sends": "傳送",
     "passes": "通過",
     "refused": "拒絕",
     "normal": "一般",
     "urgent": "緊急",
     "nextRun": "下一次執行",
     "wakes": "立即喚醒"
    }
   },
   "organization": {
    "title": "一個組織",
    "summary": "組織給一組代理程式一個結構：一棵由單位組成的樹，每個單位有負責人、成員、可選的同級線路和預算。根單位的負責人是 CEO，其上是委員會，也就是管理這個組織的人。編輯會進入一棵誰都不讀取的工作樹。發佈修訂後它才生效，此後訊息、報告、記憶、上報、凍結和預算都查詢同一條指揮鏈。",
    "desc": "委員會監督根單位，根單位的負責人是 CEO。下級單位透過匯報線路連到它，同級線路把單位橫向相連。工作樹在發佈修訂時生效，指揮鏈只讀取生效修訂。",
    "groups": {
     "live": "生效修訂"
    },
    "boxes": {
     "board": {
      "title": "委員會",
      "body": "管理組織的人，位於 CEO 之上。"
     },
     "root": {
      "title": "根單位",
      "body": "負責人是 CEO。它的預算限制整棵樹。"
     },
     "unitA": {
      "title": "單位",
      "body": "一名負責人、最多 200 名成員，以及日預算和月預算各一個。"
     },
     "unitB": {
      "title": "同級單位",
      "body": "同級線路雙向連接兩個單位的所有代理程式。"
     },
     "working": {
      "title": "工作樹",
      "body": "人們編輯單位的地方。執行時誰都不讀取它。"
     },
     "revision": {
      "title": "已發佈修訂",
      "body": "永不改變的快照。復原會發佈一份較早修訂的副本。"
     },
     "chain": {
      "title": "指揮鏈",
      "body": "上級、上級鏈、子樹和線路，只取自生效修訂。"
     }
    },
    "arrows": {
     "oversees": "監督",
     "reportsA": "匯報線路",
     "peer": "同級線路",
     "publish": "發佈",
     "readBy": "被讀取"
    }
   },
   "selfRevision": {
    "title": "自我修訂",
    "summary": "主管是可以對下級單位提出變更的單位負責人。它寫一份普通的工作室草稿，ExecutiveDraftValidator 用任何東西都無法解除的硬性限制來檢查它：不能涉及自己，不能涉及子樹之上或之外的東西，不能碰祕密，不能提高預算，也不能改管理權限。人寫的變更規則完全涵蓋的草稿會立即套用，其餘的都要等人決定。每次套用都會發佈一個組織修訂並保存一份還原草稿，所以一次復原就能撤銷它。",
    "desc": "主管寫一份草稿。硬性限制拒絕它，或把它交給變更規則，而評估關卡可以把它攔下。被涵蓋的草稿會套用，其餘的等待一個能看到影子試驗和金絲雀發佈結果的人。每次套用都發佈一個附還原草稿的組織修訂，復原可以還原它。",
    "boxes": {
     "executive": {
      "title": "主管",
      "body": "單位負責人，其部署可以為本單位以下草擬變更。"
     },
     "draft": {
      "title": "草稿",
      "body": "普通的工作室草稿。人們把它當作提案追蹤。"
     },
     "limits": {
      "title": "硬性限制",
      "body": "在比較差異、申請和套用前一刻都會檢查。任何規則或核准都無法解除。"
     },
     "refused": {
      "title": "已拒絕",
      "body": "申請以 DraftInvalid 失敗，什麼都不會改變。"
     },
     "eval": {
      "title": "評估關卡",
      "body": "主管對自己的草稿執行評估集。帶關卡的規則需要合格的分數。"
     },
     "rules": {
      "title": "變更規則",
      "body": "只由人撰寫。每項變更先分類，再與規則比對。"
     },
     "person": {
      "title": "由人決定",
      "body": "沒有規則涵蓋的變更和其他草稿一樣等待。"
     },
     "apply": {
      "title": "套用",
      "body": "以發起這次執行的人，或核准它的人的身分套用。"
     },
     "evidence": {
      "title": "影子試驗和金絲雀",
      "body": "由人啟動。結果顯示在提案上，金絲雀發佈會自行復原。"
     },
     "rollback": {
      "title": "復原",
      "body": "還原較早的修訂，然後從最新的開始套用還原草稿。"
     },
     "revision": {
      "title": "組織修訂",
      "body": "每次套用一個，記錄對應的草稿。"
     },
     "revert": {
      "title": "還原草稿",
      "body": "被改動的紀錄在改動前的樣子。"
     }
    },
    "arrows": {
     "writes": "撰寫",
     "checked": "檢查",
     "breaks": "違反限制",
     "passes": "通過",
     "gate": "分數",
     "notCovered": "未涵蓋",
     "covered": "完全涵蓋",
     "allows": "核准",
     "evidence": "依據",
     "publishes": "發佈",
     "saves": "保存",
     "restores": "還原"
    }
   },
   "brakes": {
    "title": "制動",
    "summary": "制動不依賴代理程式配合。凍結、緊急停止開關、支出上限和單位預算都在控制平面檢查，時機是執行准入時和每次喚醒守護者之前，所以被拒絕的執行根本不會建立。執行權杖從不擁有凍結權限，代理程式無法自己解除制動。對於已經在執行的工作，可以取消某個單位裡的全部工作，並讓預算守衛凍結超支的單位。",
    "desc": "凍結、緊急停止開關、支出上限和單位預算匯入執行准入時和喚醒守護者前的檢查，這些檢查拒絕新執行並略過喚醒。對於進行中的工作，全部取消會停止一個單位的子樹，預算守衛會凍結超支的單位。",
    "groups": {
     "newWork": "阻止新工作",
     "inFlight": "停止進行中的工作"
    },
    "boxes": {
     "freeze": {
      "title": "凍結",
      "body": "停止一個代理程式、部署、守護者、應用程式、單位或組織，直到有人解除。"
     },
     "killSwitch": {
      "title": "緊急停止開關",
      "body": "租用戶內所有守護者都不再喚醒。一般呼叫照常運作。"
     },
     "spendCap": {
      "title": "支出上限",
      "body": "守護者每次巡檢和每天的預算。一天的額度用完後進入 CapReached。"
     },
     "unitBudget": {
      "title": "單位預算",
      "body": "對一個單位的子樹所執行的一切設定的日上限或月上限。"
     },
     "checks": {
      "title": "准入和喚醒檢查",
      "body": "在控制平面進行，從不由代理程式執行。凍結透過事件匯流排傳到每個副本。"
     },
     "refused": {
      "title": "被拒絕的執行",
      "body": "409 Frozen 或 BudgetExhausted。不會建立任何東西。"
     },
     "skipped": {
      "title": "略過的喚醒",
      "body": "記為附代碼的已略過巡檢，排程繼續向前。"
     },
     "cancelAll": {
      "title": "全部取消",
      "body": "取消一個單位子樹的執行和巡檢，撤回其上報，並讓其郵件過期。不凍結任何東西。"
     },
     "autoFreeze": {
      "title": "自動凍結",
      "body": "子樹的支出達到預算加緩衝時，守衛凍結該單位並取消其執行。"
     }
    },
    "arrows": {
     "refuses": "新執行",
     "skips": "守護者喚醒"
    }
   }
  },
  "glossary": {
   "tenant": {
    "term": "租用戶",
    "def": "圍繞一個客戶的代理程式、執行、使用者和設定的邊界。跨租用戶讀取傳回 404。"
   },
   "agent": {
    "term": "代理程式",
    "def": "呼叫端呼叫的對象。它的設定保存在不可變的修訂中。"
   },
   "deployment": {
    "term": "部署",
    "def": "與 Harness 設定檔、模型、提示和節點池綁定的代理程式。一個代理程式可以有多個部署，依權重選擇。"
   },
   "harnessProfile": {
    "term": "Harness 設定檔",
    "def": "說明 Harness CLI 或供應商 API 如何無介面執行：引數、提示的傳遞方式和輸出剖析器。儀表板把它們列在連線下。"
   },
   "nodePool": {
    "term": "節點池",
    "def": "部署可以指向的一組工作節點，可以專供特定租用戶使用。"
   },
   "node": {
    "term": "工作節點",
    "def": "領取執行並啟動 Harness 的程序。它從不存取資料庫。"
   },
   "run": {
    "term": "執行",
    "def": "代理程式的一次執行。守護者巡檢、訊息喚醒、評估案例和影子副本都是各自類型的執行。"
   },
   "runToken": {
    "term": "執行權杖",
    "def": "每次執行為使用 Garrison 的 MCP 工具而取得的憑證。它從不擁有凍結權限。"
   },
   "keeper": {
    "term": "守護者",
    "def": "有常設任務、由 Garrison 依排程喚醒的代理程式。API 稱之為 mandate。"
   },
   "tick": {
    "term": "巡檢",
    "def": "守護者的一次喚醒：一次以回報結果和摘要結束的執行。"
   },
   "message": {
    "term": "訊息",
    "def": "從一個代理程式寄給另一個代理程式，或由人寄出的信件。寄件者不等待答覆。"
   },
   "line": {
    "term": "線路",
    "def": "允許一個代理程式寫信給另一個的關係：應用程式邊、匯報線路、同級線路，或討論串中的回覆。"
   },
   "loopGuards": {
    "term": "防迴圈檢查",
    "def": "每則訊息都要通過的檢查：收件者已凍結、無線路、跳數上限、討論串上限和線路速率。"
   },
   "report": {
    "term": "報告",
    "def": "代理程式向上級說明工作進度的方式。報告提交後不再改變。"
   },
   "memory": {
    "term": "記憶",
    "def": "代理程式在多次執行之間保留的文字，存放在代理程式、應用程式、組織單位或組織範圍中。"
   },
   "escalation": {
    "term": "上報",
    "def": "執行不該獨自決定時提出的問題。由人、角色或另一個代理程式答覆。"
   },
   "organization": {
    "term": "組織",
    "def": "給一組代理程式結構的單位樹。在有人發佈修訂之前，其中任何內容都不生效。"
   },
   "unit": {
    "term": "單位",
    "def": "樹中的一個節點：負責人、成員、同級線路和預算。"
   },
   "board": {
    "term": "委員會",
    "def": "管理一個組織的人，位於其 CEO 之上。"
   },
   "chain": {
    "term": "指揮鏈",
    "def": "誰管理誰，只從生效組織的已發佈修訂中讀取。"
   },
   "executive": {
    "term": "主管",
    "def": "在硬性限制內可以對下級單位提出變更的單位負責人。"
   },
   "changeRule": {
    "term": "變更規則",
    "def": "人對某一小類主管變更給出的長期許可。只有人能撰寫。"
   },
   "evalSet": {
    "term": "評估集",
    "def": "附檢查項的固定輸入。評估執行用它為代理程式修訂或部署評分。"
   },
   "shadowTrial": {
    "term": "影子試驗",
    "def": "把一部分真實輸入複製給不會產生任何影響的候選部署，並比較答覆。"
   },
   "canary": {
    "term": "金絲雀發佈",
    "def": "分步把流量轉到候選部署，錯誤率或評估分數越線時復原。"
   },
   "freeze": {
    "term": "凍結",
    "def": "停止某個目標的新執行，直到有人解除。"
   },
   "killSwitch": {
    "term": "緊急停止開關",
    "def": "對整個租用戶的自主運作實施凍結。守護者不再喚醒，一般呼叫照常運作。"
   },
   "unitBudget": {
    "term": "單位預算",
    "def": "一個單位的子樹可以花費的日上限或月上限。"
   }
  }
 },
 "components": {
  "explainer": {
   "seeDiagram": "查看圖示"
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
})(zhHant, {
 "components": {
  "orgDesigner": {
   "problems": {
    "errors_one": "錯誤：{{count}}",
    "errors_other": "錯誤：{{count}}",
    "warnings_one": "警告：{{count}}",
    "warnings_other": "警告：{{count}}",
    "warningsOnly": "只剩警告，因此工作樹仍可發佈。",
    "OneRoot": "組織有多個根單位，其中包括 {{unit}}。",
    "Cycle": "{{unit}} 位於自身之下。",
    "UnitNameTaken": "有兩個單位都名為 {{unit}}。",
    "TooManyUnits": "組織的單位數超過上限。",
    "TooManyMembers": "{{unit}} 的成員數超過上限。",
    "TooManyPeerLines": "{{unit}} 的同級線路數超過上限。",
    "BudgetPeriodTaken": "{{unit}} 有兩個同週期的預算。",
    "BudgetInvalid": "{{unit}} 的某項預算金額無效。",
    "AgentInactive": "{{unit}} 中的 {{agent}} 未啟用。",
    "MandateMismatch": "{{unit}} 中的守護者 {{mandate}} 不屬於 {{agent}}。"
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
})(zhHant, {
 "components": {
  "orgDesigner": {
   "overlay": {
    "activity_one": "最近 1 天：{{runs}} 次執行、{{escalations}} 次上報、{{cost}}"
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
})(zhHant, {
 "tours": {
  "ui": {
   "finding": "正在尋找下一步...",
   "skippedMissing": "已略過 {{step}}，它現在不在這個頁面上。",
   "skippedNoRecord": "已略過 {{step}}：這個租用戶在那裡還沒有可顯示的內容。",
   "endTitle": "導覽結束",
   "endBody": "{{tour}} 到此結束。隨時可以在學習頁面或側邊欄的導覽中再看一次。"
  },
  "hub": {
   "label": "開始{{tour}}導覽"
  },
  "picker": {
   "title": "導覽",
   "intro": "每個導覽針對一項工作，帶你逐步走過真實頁面。完成的導覽會被標記，任何一個都可以重看。",
   "start": "開始",
   "replay": "重看",
   "finished": "已完成",
   "learn": "開啟學習",
   "steps_one": "{{count}} 步",
   "steps_other": "{{count}} 步"
  },
  "sample": {
   "title": "載入範例？",
   "body": "{{tour}}需要{{need}}，而這個租用戶還沒有。你可以透過套用資訊清單載入{{example}}，也可以不載入繼續，並略過沒有內容可顯示的步驟。",
   "contents_one": "載入會套用 {{count}} 個資源：",
   "contents_other": "載入會套用 {{count}} 個資源：",
   "checking": "正在檢查套用會改變什麼...",
   "fake": "一切都在模擬 harness 上執行，所以不需要憑證，也不會產生費用。它的守護者幾秒內就會開始喚醒。",
   "runsLater": "執行相關的步驟需要一次執行。套用後幾秒，第一次守護者巡檢就會產生一次執行。",
   "load": "載入範例",
   "loading": "正在載入...",
   "continue": "不載入，繼續",
   "loaded": "已載入{{example}}。",
   "needs": {
    "agents": "一個代理程式",
    "runs": "一次執行",
    "keepers": "一個守護者",
    "organizations": "一個組織"
   },
   "examples": {
    "gerbil": "gerbil 範例",
    "siteReliability": "網站可靠性範例"
   }
  },
  "homeCard": {
   "title": "第一次來？從學習開始",
   "body": "學習頁面用圖說明 Garrison 各部分如何配合，還有帶你走過真實頁面的簡短導覽。",
   "open": "開啟學習",
   "dismiss": "關閉"
  },
  "wizard": {
   "nextTitle": "接下來",
   "nextBody": "學習頁面說明各部分如何配合，執行一個代理程式導覽會在主控台中走一次同樣的路徑。",
   "learn": "開啟學習",
   "tour": "開始執行一個代理程式導覽"
  },
  "firstLook": {
   "summary": "側邊欄、頂端列、首頁，以及在哪裡找到說明。",
   "steps": {
    "sidebar": {
     "title": "導覽列",
     "body": "這一側把所有內容按中心分組。中心的頁面在上方顯示為分頁，每個分頁都有自己的連結。"
    },
    "topbar": {
     "title": "你在哪裡",
     "body": "頂端列顯示你正在使用的伺服器和租用戶、你登入的身分，以及伺服器是否健康、更新是否即時送達。"
    },
    "kpis": {
     "title": "一目了然",
     "body": "目前的情況：代理程式、部署、今天進行中或失敗的執行，以及可以接收工作的工作節點。點選卡片即可開啟對應的清單。"
    },
    "invoke": {
     "title": "呼叫",
     "body": "試用代理程式最快的方法。選一個，傳一則訊息給它，看著它的回答逐步顯示出來。"
    },
    "autonomy": {
     "title": "自行工作的代理程式",
     "body": "給代理程式一項長期任務，它不需要別人吩咐就會工作。守護者依照排程喚醒它，在兩次喚醒之間，它可以傳訊息給其他代理程式、提交報告、記住學到的東西，並把問題上報給你。凍結可以立即停止這一切。"
    },
    "organizations": {
     "title": "組織",
     "body": "像組建團隊一樣把代理程式分到單位裡：一位負責人、成員和一份預算。委員會顯示每個單位的情況，變更規則決定單位的主管可以不經你同意做哪些變更。"
    },
    "help": {
     "title": "說明",
     "body": "設定精靈可以重新做初次設定，導覽列出所有導覽，學習用圖說明一切如何配合。頁面上的 ? 按鈕會開始該頁面的導覽。"
    }
   }
  },
  "runAnAgent": {
   "summary": "從連線到代理程式、部署、呼叫，再到它產生的執行。",
   "steps": {
    "connections": {
     "title": "連線",
     "body": "連線告訴 Garrison 如何啟動代理程式背後的引擎：啟動哪個 CLI 或 API，例如 Claude Code 或 Codex，以及使用什麼設定。設定一次，所有部署都能使用。"
    },
    "agents": {
     "title": "代理程式",
     "body": "代理程式是呼叫端透過 REST、MCP 或 A2A 以名稱呼叫的對象，它也決定回答的格式。在有部署之前，它不會執行任何東西。"
    },
    "deployments": {
     "title": "部署",
     "body": "部署是真正執行的部分：一個代理程式的連線、模型、提示詞和限制。一個代理程式有兩個部署時，呼叫會依權重分配，這樣就能用部分流量試用新模型。"
    },
    "invoke": {
     "title": "呼叫",
     "body": "選擇代理程式，需要的話再選一個特定部署，輸入訊息後按傳送。輸出會出現在表單旁邊。"
    },
    "run": {
     "title": "執行",
     "body": "每次呼叫都是一次執行。它的頁面上方顯示狀態和 ID，下面有對話記錄、結果、輸入等分頁。"
    },
    "trail": {
     "title": "軌跡分頁",
     "body": "軌跡會追蹤請求經過每個代理程式，直到回覆。追蹤一個請求導覽會詳細介紹。"
    }
   }
  },
  "followARequest": {
   "summary": "執行的軌跡分頁：三種檢視、合計和每一步的詳細資料。",
   "steps": {
    "views": {
     "title": "三種檢視",
     "body": "序列給每個代理程式一條泳道，時間向下推進。圖把每一步放在引起它的步驟之後。清單把每一步顯示為可以篩選的一列。"
    },
    "summary": {
     "title": "合計",
     "body": "有多少代理程式參與、它們之間傳了多少訊息、花了多久、token 和費用，以及有多少步驟失敗。"
    },
    "steps": {
     "title": "步驟",
     "body": "每個方框是一步：一次執行、一則訊息、一份報告、一次上報、一次核准或一次工具呼叫。方向鍵在步驟之間移動，Enter 開啟一步。"
    },
    "drawer": {
     "title": "步驟詳細資料",
     "body": "抽屜顯示一步的狀態、時間和費用。代理程式寫的文字會以純資料顯示，並註明作者，開啟記錄會前往完整記錄。"
    },
    "actions": {
     "title": "重新整理和匯出",
     "body": "只要還有步驟在執行，軌跡就會依這裡選的間隔重新整理。匯出 JSON 會下載步驟和連結，不含代理程式寫的文字。"
    }
   }
  },
  "buildATeam": {
   "summary": "組織的設計分頁：畫布、人員、守護者、預算和發佈。",
   "steps": {
    "canvas": {
     "title": "畫布",
     "body": "每個方框是一個單位，上方是負責人和成員，裡面是向它匯報的單位。方框之間的線是同級連線，讓兩個單位可以直接互傳訊息。"
    },
    "palette": {
     "title": "人員",
     "body": "把代理程式從這個清單拖到某個單位上，或者選取一個，再選擇單位以及它是負責還是加入。"
    },
    "keepers": {
     "title": "守護者",
     "body": "選取一個單位後，這個分頁會列出其中誰有守護者。可以掛上一個、新增一個，或者修改它何時喚醒。"
    },
    "budget": {
     "title": "預算",
     "body": "為單位設定每天或每月的上限。它涵蓋這個單位及其下所有單位執行的一切。"
    },
    "publish": {
     "title": "發佈",
     "body": "變更會立刻儲存到工作樹，但在這裡發佈之前都不會生效。每個修訂都會保留，所以可以復原。"
    }
   }
  },
  "keepItSafe": {
   "summary": "煞車：緊急停止開關、凍結、支出上限、變更規則和核准。",
   "steps": {
    "killSwitch": {
     "title": "緊急停止開關",
     "body": "開啟後，租用戶中的守護者都不會喚醒，訊息也不會喚醒代理程式。一般呼叫照常運作。"
    },
    "freezes": {
     "title": "凍結",
     "body": "凍結會拒絕某個代理程式、部署、守護者或應用程式的新執行，直到有人解除。單位和整個組織要在它們的委員會中凍結。"
    },
    "spendCaps": {
     "title": "支出上限",
     "body": "守護者可以設定每次巡檢和每天的預算。當天預算用完後，它會停到下一個 UTC 日，並傳一則緊急上報給你。"
    },
    "changeRules": {
     "title": "變更規則",
     "body": "規則預先核准主管可以在下屬單位中做的例行變更。只有人能寫規則，規則沒涵蓋的都要等人決定。"
    },
    "approvals": {
     "title": "核准",
     "body": "當部署在呼叫工具前要求確認時，需要人決定的呼叫會在這裡等待。逐一允許或拒絕，願意的話把答覆記成規則。"
    }
   }
  },
  "watchAnOrganization": {
   "summary": "組織的委員會、績效、報告和上報。",
   "steps": {
    "board": {
     "title": "委員會",
     "body": "要了解組織的情況，從這裡開始。每個單位都會顯示根據最新報告得出的健康狀態、未處理的上報、生效中的煞車和最新報告，在組織圖和表格中都看得到。"
    },
    "attention": {
     "title": "待處理",
     "body": "現在需要有人處理的事：未處理的上報、不健康的報告和達到預算上限的單位。先處理這份清單。"
    },
    "performance": {
     "title": "績效",
     "body": "在你選擇的時段內比較各單位：執行、結果、成本、延遲和上報。經常上報或比其他單位花費更多的單位，就是需要關注的那個。"
    },
    "reports": {
     "title": "報告",
     "body": "執行和人員就現況提交的內容。提交後的報告不能修改，其文字以資料顯示，絕不當作指令。"
    },
    "escalations": {
     "title": "上報",
     "body": "代理程式向某個人、某個角色或另一個代理程式提出的問題。未處理的排在前面。在這裡回答後，提問的代理程式就會收到你的答覆。"
    }
   }
  }
 },
 "trail": {
  "entrySurfaces": {
   "Rest": "REST API",
   "Mcp": "MCP",
   "A2a": "A2A",
   "App": "應用程式",
   "Dashboard": "主控台",
   "Trigger": "觸發器",
   "Keeper": "守護者",
   "Message": "訊息",
   "Escalation": "上報",
   "Eval": "評估",
   "Shadow": "影子",
   "Internal": "內部"
  },
  "columns": {
   "entrySurface": "進入途徑"
  },
  "drawer": {
   "fields": {
    "entrySurface": "進入途徑"
   }
  },
  "edges": {
   "Shadowed": "影子複製",
   "Delivered": "送達"
  }
 },
 "learn": {
  "diagrams": {
   "brakes": {
    "boxes": {
     "killSwitch": {
      "body": "租用戶中的守護者都不會喚醒，訊息也不會喚醒代理程式。一般呼叫照常運作。"
     }
    }
   }
  },
  "glossary": {
   "killSwitch": {
    "def": "整個租用戶範圍的自主運作凍結。守護者不會喚醒，訊息也不會喚醒代理程式，而一般呼叫照常運作。"
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
})(zhHant, {
 "components": {
  "turnActivity": {
   "worker": "正在等待工作節點",
   "approval": "正在等待核准",
   "tool": "正在執行 {{tool}}",
   "working": "正在處理下一步",
   "quiet": "已有 {{time}} 沒有新輸出。執行仍處於{{status}}狀態。"
  }
 }
});
