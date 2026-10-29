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
    footerHint: '本機開發預設值：租用戶 default 中的 admin@garrison。'
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
      selected_one: '已選取 {{count}} 筆',
      selected_other: '已選取 {{count}} 筆',
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
        inputSchemaJson: '輸入 JSON Schema',
        outputSchemaJson: '輸出 JSON Schema',
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
      grafanaSections: { overview: '概覽', http: 'HTTP API', runs: '執行', agents: '代理程式', models: '模型與權杖', workers: '工作節點', kubernetes: 'Kubernetes 執行器', protocols: '協定', scheduler: '排程器與佇列', database: '資料庫', controlPlane: '控制平面', security: '安全與驗證', integrations: '整合', logs: '記錄與追蹤' },
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
    "inputSchemaJson": "輸入結構描述",
    "outputSchemaJson": "輸出結構描述"
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
    "inputSchemaJson": "輸入結構描述",
    "outputSchemaJson": "輸出結構描述"
   },
   "hints": {
    "kind": "手動項目可以是任何類型，例如代理程式透過技能使用的轉換服務。",
    "requirements": "使用此能力的代理程式，其執行只會分派到具備以下所有節點標籤的工作節點。",
    "sourceMcpServerId": "選填。指名伺服器的項目，只有在執行權杖所屬的部署繫結該伺服器時才看得到。",
    "inputSchemaJson": "JSON Schema，例如 {\"type\": \"object\"}。若能力接受自由文字，請留空。"
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
    "architectPromptTemplateId": "架構師使用的 System 範本。變更會從它的下一輪開始生效。",
    "architectPromptVersion": "留空則跟隨提示的目前版本，儲存的編輯會從下一輪開始生效。"
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
