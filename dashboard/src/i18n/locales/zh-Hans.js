// Simplified Chinese catalog for the Garrison dashboard. Mirrors every key in en.js.

import { tips, explainers } from './zh-Hans.tips.js';

const rp = (title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody) => ({ title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody });

const zhHans = {
  processSecurity: { trustedOnly: "Process 执行器仅用于可信任务。运行共享工作节点的用户、文件系统和网络，可访问其他运行及工作节点凭据。对于不可信输入，请使用 KubernetesJob。" },
  common: {
    eventCodes: { ApprovalRequested: '已请求审批', ApprovalDecided: '审批已决定', StructuredOutputInvalid: '结构化输出无效', RunBlocked: '运行受阻', EventsDropped: '事件已丢弃', HarnessExited: 'Harness 已退出', McpPreflightWarning: 'MCP 预检警告', McpPreflightPassed: 'MCP 预检通过', RepairAttemptStarted: '已开始修复输出', WorkspacePrepared: '工作区已就绪', RunGuardTriggered: '运行防护停止了运行', ConversationFallback: '对话回退', ConversationResumed: '对话已恢复', ConversationStateLost: '对话状态丢失' },
    fieldCodes: { ExpiryInPast: '请选择未来的时间。', ParameterInvalid: '此值对该参数无效。', ParameterNotAllowed: '此部署不允许调用方覆盖此参数。', SettingsFileReadOnly: '设置文件为只读，因此无法保存此更改。', OverriddenByEnvironment: '此值由环境变量设置，因此无法在此更改。', PathRequired: '需要设置路径。', UnknownSetting: '此服务器没有该设置。', TooLong: '此值过长。', NotAllowedValue: '请选择允许的值之一。', NotABoolean: '请选择 true 或 false。', NotAnInteger: '请输入整数。', OutOfRange: '值超出允许的范围。' },
    serverText: {
      approvalWaitingExpires: '正在等待有人批准 {{subject}}；审批 {{id}} 将于 {{expires}} 过期。',
      approvalWaiting: '正在等待有人批准 {{subject}}；审批 {{id}}。',
      notApplied: '未应用，因为另一个文档未通过验证。',
      wouldBeUnchanged: '已是最新，不会有任何变更。',
      wouldBeUpdated: '将被更新。',
      wouldBeCreated: '将被创建。',
      inUse: '{{what}} 仍被这些部署绑定：{{deployments}}。请先移除绑定。',
      noActiveDeployment: '智能体 {{agent}} 没有权重大于零的活动部署。请添加部署或提高某个部署的权重，然后重试。',
      toolCallDenied: '工具调用被拒绝：{{id}}',
      threadStarted: '线程已开始。',
      runStartedModel: '运行已开始（{{model}}）。',
      runStarted: '运行已开始。',
      sessionInitializedModel: '会话已初始化（{{model}}）。',
      sessionInitialized: '会话已初始化。',
      harnessFailed: 'Harness 报告了失败。',
      exitedNoResult: 'Harness 以代码 {{code}} 退出，没有最终结果。',
      harnessExited: 'Harness 已退出：{{status}}（{{outcome}}）。',
      harnessExitedCode: 'Harness 已退出，代码 {{code}}：{{status}}（{{outcome}}）。',
      mcpPreflight: 'MCP 预检已通过。已检查的服务器：{{count}}。',
      repairAttempt: '结构化输出修复第 {{attempt}} 次尝试：在 {{path}} 中恢复 Harness 会话。',
      workspacePrepared: '工作区已在 {{path}} 准备就绪。',
      guardRepetitionUnit: '重复防护：助手文本的最后 {{window}} 个字符是 {{size}} 个字符的单元“{{unit}}”重复了 {{count}} 次。',
      guardDegenerate: '重复防护：助手文本的最后 {{window}} 个字符不含字母或数字（只有空白、标点或符号），结尾为“{{tail}}”。',
      guardNoProgress: '运行在 {{seconds}} 秒内没有进展（没有助手文本、思考、工具调用或工具结果，也没有未完成的工具调用）；其 noProgressSeconds 限制为 {{limit}}。',
      guardOutputLimit: '助手文本超过了运行的 maxAssistantChars 限制 {{limit}} 个字符。',
      valueClamped: '{{field}} 的值 {{given}} 超出允许范围 {{minimum}} 到 {{maximum}}，已保存 {{stored}}。'
    },
    appName: 'Garrison',
    language: { label: '语言' },
    theme: { switchToLight: '切换到浅色主题', switchToDark: '切换到深色主题' },
    actions: {
      apply: '应用',
      back: '返回',
      cancel: '取消',
      clear: '清除',
      clone: '克隆',
      close: '关闭',
      confirm: '确认',
      copied: '已复制',
      copy: '复制',
      delete: '删除',
      duplicate: '复制一份',
      edit: '编辑',
      hide: '隐藏值',
      logout: '退出登录',
      next: '下一步',
      openGithub: '在 GitHub 上打开 Garrison 仓库',
      remove: '移除',
      retry: '重试',
      reveal: '显示值',
      save: '保存',
      view: '查看',
      viewDetails: '查看详情',
      viewJson: '查看 JSON'
    },
    boolean: { yes: '是', no: '否' },
    confirm: {
      deleteNamed: '删除“{{name}}”？此操作无法撤销。',
      bulkDelete: '删除所选的 {{count}} 条记录？此操作无法撤销。'
    },
    errors: {
      listItem: '第 {{index}} 项：{{message}}',
      chooseOne: '请至少选择一个选项。',
      fixFields: '部分字段需要处理，请检查突出显示的值。',
      invalidEmail: '请输入有效的电子邮件地址。',
      invalidJson: '这不是有效的 JSON。',
      loadFailed: '数据加载失败。',
      requestId: '请求 {{id}}。',
      required: '此字段为必填项。',
      requiredPermission: '需要对 {{resource}} 拥有 {{permission}} 权限。'
    },
    generic: {
      deletedName: '{{name}}（已删除）',
      actions: '操作',
      active: '启用',
      all: '全部',
      any: '任意',
      builtIn: '内置',
      custom: '自定义',
      inactive: '停用',
      loading: '加载中...',
      never: '从不',
      none: '无',
      notAvailable: '不适用',
      saving: '保存中...'
    },
    relativeTime: { now: '刚刚' },
    states: {
      forbiddenTitle: '你无权访问此页面',
      forbiddenBody: '请向管理员申请可授予访问权限的角色，或选择其他页面。',
      unavailableTitle: '此服务器暂不支持',
      unavailableBody: '服务器未提供 {{resource}} 端点。请升级服务器，或在 API 浏览器中查看它支持的功能。'
    },
    toasts: {
      bulkDeleted: '已删除 {{count}} 条记录（{{failed}} 条失败）。',
      cloned: '已克隆。',
      created: '已创建。',
      deleted: '已删除。',
      saved: '已保存。'
    },
    units: { msShort: '毫秒', sShort: '秒', mShort: '分钟', tokPerSec: 'Token/秒' }
  },
  errorCodes: {
    ApprovalNotPending: '此审批已经决定，无法再次决定。',
    MessageIdConflict: '此 A2A 消息 ID 已用于不同的内容。请使用新的 ID 发送消息。',
    IdempotencyKeyConflict: '此幂等键已用于另一个请求。请使用新的键。',
    DeploymentDeleted: '此运行的部署已被删除，因此无法重试此运行。请改为再次调用智能体。',
    AgentDeleted: '此运行的智能体已被删除，因此无法重试此运行。',
    NoActiveDeployment: '此智能体没有权重大于零的活动部署。请添加部署或提高某个部署的权重。',
    TenantNotFound: '该租户不存在。请检查租户 ID。',
    NetworkError: '无法连接到服务器。请检查服务器 URL，并确认服务器正在运行。',
    AuthenticationRequired: '你的会话已过期，请重新登录。',
    InvalidCredentials: '租户、电子邮件、密码或密钥不正确。',
    RateLimited: '登录尝试次数过多，请等待一分钟后重试。',
    AuthorizationDenied: '你无权执行此操作。',
    NotFound: '未找到该记录。',
    RouteNotFound: '此服务器不支持该端点。',
    ValidationFailed: '部分值无效。',
    InvalidBody: '请求正文无效。',
    InvalidJson: '请求正文不是有效的 JSON。',
    Conflict: '与现有记录冲突。',
    BuiltInImmutable: '内置记录无法修改。请克隆后再自定义。',
    Protected: '此记录受保护，无法删除。',
    StaleLease: '该节点已不再持有此运行的租约。',
    InternalError: '服务器发生内部错误。请使用请求 ID 查看服务器日志。',
    Http400: '请求被视为无效而遭拒绝。',
    Http403: '你无权执行此操作。',
    Http404: '未找到。',
    Http409: '与当前状态冲突。',
    Http500: '服务器发生内部错误。',
    Http503: '服务器不可用。',
    ConversationBusy: '该对话仍在处理上一轮。请等待该运行结束或将其取消，然后重试。',
    ConversationAgentMismatch: '该对话属于另一个智能体。请将这一轮发送给那个智能体，或开始新的对话。',
    ConversationDeploymentMismatch: '对话的每一轮都在第一轮的部署上运行。请将部署留空，或开始新的对话。',
    ConversationDeploymentUnavailable: '该对话所用的部署已被删除，因此对话无法继续。请开始新的对话。'
  },
  enums: {
    approvalStatus: {
      Pending: '待处理',
      Approved: '已批准',
      Denied: '已拒绝',
      Expired: '已过期',
      Cancelled: '已取消'
    },
    approvalDecision: {
      Allow: '允许',
      Deny: '拒绝'
    },
    approvalSource: {
      DurableResume: "继承的审批",
      Rule: '规则',
      Default: '部署默认设置',
      User: '人工',
      Timeout: '超时',
      Cancelled: '运行已停止'
    },
    approvalRuleAction: {
      Allow: '允许',
      Deny: '拒绝',
      Ask: '询问人员'
    },
    approvalKind: {
      Tool: '工具调用',
      Command: '命令',
      FileChange: '文件更改'
    },
    principalType: { Administrator: '系统管理员', User: '用户', Credential: '访问密钥', Run: '运行令牌' },
    runBlockedReason: { NoReadyWorker: '没有就绪的工作节点', NoCapableWorker: '没有可用的工作节点', NoMatchingPool: '没有匹配的节点池' },
    promptDelivery: { Stdin: '标准输入', Argument: '命令行参数', File: '文件', CodexAppServer: 'Codex 应用服务器 (JSON-RPC)' },
    systemPromptDelivery: { File: '文件', Argument: '命令行参数', Environment: '环境变量', PrependToPrompt: '加在提示词前面', None: '不传递' },
    mcpConfigFormat: { None: '无 MCP 配置', ClaudeJson: 'Claude Code JSON', CodexToml: 'Codex TOML', MuxJson: 'Mux JSON', GeminiSettings: 'Gemini CLI 设置' },
    outputParser: {
      ClaudeStreamJson: 'Claude Code 流式 JSON',
      CodexJsonl: 'Codex JSONL',
      CodexAppServer: 'Codex 应用服务器 JSON-RPC',
      MuxJsonl: 'Mux JSONL',
      GeminiStreamJson: 'Gemini CLI 流式 JSON',
      GenericJsonl: '通用 JSONL',
      PlainText: '纯文本'
    },
    resultSource: { ParserFinalEvent: '解析器最终事件', LastMessageFile: '最后消息文件', Stdout: 'Stdout' },
    successPolicy: { FinalEvent: '最终事件', ExitCode: '退出码', FinalEventAndExitCode: '最终事件和退出码' },
    fileBaseDirectory: { Config: '配置目录', Workspace: '工作区', Home: '主目录' },
    artifactStoreKind: { Database: '数据库', Filesystem: '文件系统', S3: 'S3' },
    agentInputMode: { Text: '文本', Structured: '结构化 JSON' },
    argumentOverrideOperation: { Append: '追加到末尾', Prepend: '插入到开头', Remove: '移除', Replace: '替换' },
    runOverrideValidation: { Any: '任意值', Enum: '列表中的值', Regex: '正则表达式', IntegerRange: '整数范围' },
    credentialAuthMode: { DirectHeader: '直接请求头', SignedRequest: '签名请求', SessionExchange: '换取会话令牌', Hybrid: '任意方式' },
    operationType: { All: '所有操作', Create: '创建', Read: '读取', Write: '写入', Update: '更新', Delete: '删除', Execute: '执行', Admin: '管理' },
    usageQuotaScope: {"Tenant": "租户", "Agent": "智能体", "Deployment": "部署"},
    resourceType: {
      All: '所有资源',
      Account: '账户',
      Tenant: '租户',
      Admin: '系统管理',
      User: '用户',
      Credential: '访问密钥',
      Session: '会话',
      Role: '角色',
      Permission: '权限',
      Assignment: '分配',
      Audit: '审计日志',
      RequestHistory: '请求历史',
      Settings: '设置',
      HarnessProfile: 'Harness 配置文件',
      PromptTemplate: '提示词模板',
      Agent: '智能体',
      Deployment: '部署',
      McpServer: 'MCP 服务器',
      Secret: '机密',
      Workspace: '工作区',
      ArtifactStore: '制品存储',
      ModelPrice: "模型价格",
      UsageQuota: "使用配额",
      Run: '运行',
      Node: '节点',
      NodePool: '节点池',
      Manifest: '清单',
      Conversation: '对话',
      Approval: '审批',
      Artifact: '制品'
    },
    runStatus: {
      Pending: '待处理',
      Queued: '已排队',
      Leased: '已租用',
      Running: '运行中',
      Cancelling: '取消中',
      Succeeded: '成功',
      Failed: '失败',
      Cancelled: '已取消',
      TimedOut: '已超时',
      Rejected: '已拒绝'
    },
    runOutcome: {
      None: '无',
      Succeeded: '成功',
      HarnessFailed: 'Harness 失败',
      NotInstalled: 'Harness 未安装',
      NotCredentialed: '缺少凭据',
      McpPreflightFailed: 'MCP 预检失败',
      NodeLost: '节点丢失',
      OutputLimitExceeded: '超出输出限制',
      SchemaValidationFailed: '输出架构无效',
      TimedOut: '已超时',
      Cancelled: '已取消',
      StaleLease: '租约已失效',
      CompileFailed: '编译失败',
      WorkspaceFailed: '工作区失败',
      Rejected: '已拒绝',
      InternalError: '内部错误',
      NoCapableWorker: '没有可用的工作节点',
      RepetitionDetected: '检测到重复',
      NoProgress: '无进展',
      PodFailed: '运行 Pod 失败',
      ConversationStateLost: '对话状态丢失'
    },
    runEventType: {
      Lifecycle: '生命周期',
      AssistantText: '助手',
      Thinking: '思考',
      ToolCall: '工具调用',
      ToolResult: '工具结果',
      Usage: '用量',
      Progress: '进度',
      Warning: '警告',
      Error: '错误',
      Stdout: 'Stdout',
      Stderr: 'Stderr',
      Result: '结果'
    },
    nodeStatus: { Ready: '就绪', Draining: '排空中', Cordoned: '已封锁', Lost: '丢失', Offline: '离线' },
    controlNodeStatus: { Starting: '启动中', Ready: '就绪', Draining: '排空中', Offline: '离线' },
    backplane: { Local: '本地（单副本）', Polling: '数据库轮询', PostgresNotify: 'PostgreSQL 通知' },
    harnessType: { ClaudeCode: 'Claude Code', Codex: 'Codex', Mux: 'Mux', GeminiCli: 'Gemini CLI', Generic: '通用' },
    agentKind: { Hosted: '托管', Remote: '远程' },
    delegationMode: { None: '不委派', AllowList: '允许列表', Any: '任意智能体' },
    secretStatus: { Ok: '正常', NeedsReauthentication: '需要重新认证' },
    secretKind: {
      AnthropicApiKey: 'Anthropic API 密钥',
      ClaudeCodeOAuthToken: 'Claude Code OAuth 令牌',
      OpenAiApiKey: 'OpenAI API 密钥',
      CodexAuthJson: 'Codex auth.json',
      GeminiApiKey: 'Gemini API 密钥',
      GenericEnv: '环境变量值',
      GenericFile: '文件内容',
      BearerToken: 'Bearer 令牌',
      BasicAuth: '基本身份验证',
      GitCredential: 'Git 凭据'
    },
    workspaceKind: { Empty: '空', GitRepository: 'Git 仓库', Seeded: '预置文件', PersistentVolume: '持久卷' },
    runExecutor: { Process: '进程', KubernetesJob: 'Kubernetes Job' },
    workspaceRetention: { Delete: '删除', Keep: '保留', KeepOnFailure: '失败时保留' },
    promptTemplateKind: { System: '系统', Task: '任务', Fragment: '片段', ToolDescription: '工具描述', ConfigFile: '配置文件', Other: '其他' },
    permissionType: { Permit: '允许', Deny: '拒绝' },
    resourceScope: { Tenant: '租户', Resource: '资源' },
    resourceBindingKind: { McpServer: 'MCP 服务器', Secret: '机密' },
    mcpTransport: { Http: 'HTTP', Stdio: 'stdio' },
    remoteProtocol: { A2A: 'A2A', Mcp: 'MCP' },
    manifestApplyResult: { Created: '已创建', Updated: '已更新', Unchanged: '未更改', Failed: '失败', Validated: '已验证' },
    auditEventType: {
      ApprovalDecided: '审批已决定',
      AuthSuccess: '登录成功',
      AuthFailure: '登录失败',
      SessionIssued: '已签发会话',
      SessionRevoked: '已吊销会话',
      CredentialCreated: '已创建访问密钥',
      CredentialRotated: '已轮换访问密钥',
      CredentialUsed: '已使用访问密钥',
      AuthorizationDenied: '授权被拒绝',
      AuthorizationBypass: '授权绕过',
      RoleChanged: '角色已更改',
      PermissionChanged: '权限已更改',
      AssignmentChanged: '分配已更改',
      ConfigurationChanged: '配置已更改',
      SecretChanged: '机密已更改',
      SettingsChanged: '设置已更改',
      RestartRequested: '已请求重启',
      ManifestApplied: '已应用清单',
      NodeRegistered: '节点已注册',
      NodeStatusChanged: '节点状态已更改',
      RunCancelled: '运行已取消',
      ConversationDeleted: '对话已删除'
    },
    conversationFallbackReason: {
      AffinityNodeLost: '亲和节点未就绪',
      AffinityWaitExpired: '亲和等待已超时',
      WorkspaceLost: '工作区已丢失',
      SessionMissing: '没有可恢复的会话',
      HarnessChanged: 'Harness 配置文件已更改',
      ResumeUnsupported: '不支持恢复',
      ExecutorWithoutState: '执行器不保留状态'
    }
  },
  nav: {
    approvalsPending_one: '{{count}} 个审批待处理',
    approvalsPending_other: '{{count}} 个审批待处理',
    primary: '主导航',
    sections: {
      operate: '运营',
      platform: '平台',
      administration: '管理'
    },
    hubs: {
      approvals: {
        label: '审批',
        tip: '等待人员处理的工具调用，以及每项决定'
      },
      home: { label: '首页', tip: '一览机群与运行的健康状况' },
      invoke: { label: '调用', tip: '以交互方式试用智能体' },
      runs: { label: '运行', tip: '运行记录与调度队列' },
      analytics: { label: '分析', tip: '运行速度、Token、成本和结果随时间的变化' },
      agents: { label: '智能体', tip: '智能体及运行它们的部署' },
      configuration: { label: '配置', tip: 'Harness 配置文件、提示词模板、MCP 服务器、机密、工作区、制品存储和清单' },
      fleet: { label: '机群', tip: '控制平面、工作节点和节点池' },
      access: { label: '访问控制', tip: '租户、用户、访问密钥、角色和分配' },
      monitoring: { label: '监控', tip: '请求历史、审计和 API 浏览器' },
      system: { label: '系统', tip: '服务器设置和服务器信息' }
    },
    items: {
      approvals: {
        label: '审批',
        tip: '允许或拒绝智能体请求进行的工具调用'
      },
      home: { label: '首页', tip: '一览机群与运行的健康状况' },
      invoke: { label: '调用', tip: '以交互方式试用智能体' },
      runs: { label: '运行', tip: '查找、检查、取消和重试运行' },
      queue: { label: '队列', tip: '按智能体和 Harness 查看调度压力' },
      analytics: { label: '分析', tip: '运行速度、Token、成本和结果随时间的变化' },
      nodes: { label: '工作节点', tip: '工作节点及其 Harness 能力' },
      controlNodes: { label: '控制平面', tip: '提供 API 并调度运行的服务器副本' },
      nodePools: { label: '节点池', tip: '将节点分组并专供特定租户使用' },
      agents: { label: '智能体', tip: '通过 REST、MCP 和 A2A 公开的智能体' },
      deployments: { label: '部署', tip: '将智能体绑定到 Harness、提示词和资源' },
      harnessProfiles: { label: 'Harness 配置文件', tip: '每个 Harness 如何以无头模式运行' },
      promptTemplates: { label: '提示词模板', tip: 'Garrison 发送的每条提示词，均有版本管理' },
      mcpServers: { label: 'MCP 服务器', tip: '智能体可用的工具' },
      secrets: { label: '机密', tip: 'Harness 和集成所用的凭据' },
      workspaces: { label: '工作区', tip: '运行工作区的准备方式' },
      artifactStores: { label: '制品存储', tip: '运行制品的存储位置' },
      modelPrices: { label: "模型价格", tip: "在执行器未报告费用时，使用操作员配置的美元费率进行估算。已报告费用（包括零）优先。" },
      usageQuotas: { label: "使用配额", tip: "租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。" },
      manifests: { label: '清单', tip: '以代码形式应用和导出配置' },
      requests: { label: '请求历史', tip: '检查 HTTP 流量和失败请求' },
      audit: { label: '审计', tip: '安全和配置事件' },
      explorer: { label: 'API 浏览器', tip: '实时执行 API 调用' },
      tenants: { label: '租户', tip: '管理租户' },
      users: { label: '用户', tip: '管理用户' },
      credentials: { label: '访问密钥', tip: '用于自动化的访问密钥' },
      roles: { label: '角色', tip: '角色和权限' },
      assignments: { label: '分配', tip: '向用户和访问密钥授予角色' },
      settings: { label: '设置', tip: '编辑服务器和集群设置' },
      serverInfo: { label: '服务器信息', tip: '端点、版本和你的身份' },
      conversations: {
        label: '对话',
        tip: '与智能体的多轮交流'
      }
    },
    setup: '设置向导',
    setupTip: '配置凭据、应用示例智能体并进行测试',
    tour: '引导教程',
    tourTip: '重新播放引导教程',
    version: '版本 {{version}}',
    collapseSidebar: '切换导航栏',
    skipToContent: '跳到主要内容'
  },
  login: {
    title: 'Garrison',
    subtitle: '登录智能体控制平面',
    tabs: { password: '电子邮件和密码', accessKey: '访问密钥' },
    serverUrl: '服务器 URL',
    serverInUse: '使用的服务器：',
    useDifferentServer: '使用其他服务器',
    useDefaultServer: '使用默认服务器',
    tenantId: '租户 ID',
    email: '电子邮件',
    password: '密码',
    accessKey: '访问密钥',
    secretKey: '私密密钥',
    submit: '登录',
    connecting: '正在登录...',
    restoring: '正在恢复你的会话...',
    errorGeneric: '无法登录。请检查你的凭据，并确认服务器可以访问。',
    footerHint: '本地开发默认账户：租户 default 中的 admin@garrison。'
  },
  topbar: {
    server: '服务器',
    tenant: '租户',
    switchTenant: '切换租户',
    copyServer: '复制服务器 URL',
    live: '实时',
    polling: '轮询',
    liveOn: '正在通过 WebSocket 接收实时更新',
    liveOff: '实时更新不可用，页面将通过轮询刷新',
    health: { healthy: '健康', unhealthy: '无法访问', unknown: '检查中' }
  },
  roles: {
    systemAdmin: '系统管理员',
    tenantAdmin: '租户管理员',
    user: '用户',
    credential: '访问密钥',
    run: '运行令牌'
  },
  components: {
    fieldWarnings: { title_one: '已保存，{{count}} 个值已调整', title_other: '已保存，{{count}} 个值已调整', body: '服务器已接受请求，但以下值的保存结果与提交的值不同。', dismiss: '关闭', codes: { ValueClamped: '值已限制在允许范围内' } },
    approvals: {
      awaiting: '等待审批',
      decideTitle: '决定 {{tool}}',
      decision: '决定',
      reason: '原因',
      reasonPlaceholder: '可选。智能体和审计日志都会看到。',
      remember: '记住为此部署的规则',
      rulePattern: '规则模式',
      rememberHint: '向部署添加一条操作为 {{action}} 的规则，之后匹配的调用无需询问即可决定。这还需要更新部署的权限。',
      submitAllow: '允许',
      submitDeny: '拒绝',
      timeoutThen: '然后 {{decision}}',
      toasts: {
        allowed: '已允许 {{tool}}。',
        denied: '已拒绝 {{tool}}。',
        allowedRemembered: '已允许 {{tool}}，并添加了规则 {{pattern}}。',
        deniedRemembered: '已拒绝 {{tool}}，并添加了规则 {{pattern}}。',
        notPending: '此审批已由其他人或因超时而决定。列表现在显示结果。',
        forbidden: '你可以查看审批，但不能决定。请向管理员申请 Approval Update 权限。',
        forbiddenRemember: '记住规则还需要更新部署的权限。请在不记住规则的情况下决定，或申请 Deployment Update 权限。'
      }
    },
    approvalCheck: {
      title: '测试工具调用',
      saveFirst: '请先保存部署。测试检查的是服务器已存储的规则。',
      hint: '检查的是已保存的规则，因此请在测试前保存更改。不会记录任何内容。',
      toolName: '工具',
      inputs: {
        command: '命令',
        url: 'URL',
        query: '搜索查询',
        file_path: '文件路径',
        notebook_path: 'Notebook 路径',
        pattern: '模式'
      },
      run: '检查',
      checking: '正在检查...',
      byRule: '由此规则 {{action}}：',
      byDefault: '没有规则匹配，因此由部署默认设置 {{action}}。',
      suggestedRule: '建议的规则：',
      disabled: '此部署的审批已关闭，因此其运行从不询问。请开启并保存以应用这些规则。'
    },
    blocked: {
      title: '等待工作节点',
      body: '此运行已排队，但目前没有工作节点能接手。',
      reasons: {
        NoReadyWorker: '没有就绪的工作节点。请启动或注册一个工作节点，并在机群页面检查丢失、离线、排空中或已封锁的节点。',
        NoCapableWorker: '有就绪的工作节点，但没有节点报告 {{harness}} Harness 可用。请启动或注册一个已安装该 Harness 的工作节点，或在机群页面检查它的凭据和探测结果。',
        NoMatchingPool: '有就绪的工作节点能运行 {{harness}}，但没有节点符合此部署的节点池或节点选择器。请检查部署的调度放置，或向该节点池添加工作节点。'
      },
      failNote: '当集群设置 Runtime.FailBlockedAfterSeconds 大于 0 时，阻塞达到该时长的运行会以结果“没有可用的工作节点”失败。',
      openFleet: '打开机群',
      openAgent: '打开智能体的部署',
      homeBanner_other: '{{count}} 个排队中的运行无法开始：没有就绪的工作节点能运行它们。',
      showRuns: '查看排队中的运行',
      queueColumn: '已阻塞',
      queueCount_other: '{{count}} 个已阻塞'
    },
    autoRefresh: {
      label: '自动刷新',
      none: '关闭',
      seconds_one: '每 {{count}} 秒',
      seconds_other: '每 {{count}} 秒'
    },
    chart: {
      success: '成功',
      failure: '失败',
      total: '总计',
      avgDuration: '平均耗时',
      noData: '此时间范围内没有活动。',
      range: '时间范围',
      ranges: { hour: '最近 1 小时', day: '最近 1 天', week: '最近 1 周', month: '最近 1 个月', custom: '自定义' }
    },
    compilePreview: {
      title: '编译预览',
      input: '示例输入',
      compile: '编译',
      compiling: '正在编译...',
      commandLine: '命令行',
      stdin: '标准输入',
      environment: '环境变量',
      files_one: '{{count}} 个文件',
      files_other: '{{count}} 个文件'
    },
    confirm: { title: '请确认', message: '确定要继续吗？' },
    diff: { before: '修改前', after: '修改后' },
    explainer: { about: '关于{{topic}}', dismiss: '隐藏此说明' },
    export: { label: '导出', csv: 'CSV（数据）', png: 'PNG 图片', svg: 'SVG 图片', json: 'JSON（数据）', failed: '导出失败。{{message}}', tableTitle: '表格 {{table}}' },
    filters: {
      allTenants: '所有租户',
      clear: '清除筛选条件',
      from: '开始',
      to: '结束',
      method: '方法',
      path: '路径包含',
      pathPlaceholder: '例如 /v1.0/api/tenants',
      searchName: '按名称搜索',
      status: '状态码',
      statusPlaceholder: '例如 404',
      tenant: '租户'
    },
    form: {
      addItem: '添加项',
      addRow: '添加行',
      key: '键',
      value: '值',
      moveUp: '上移',
      moveDown: '下移',
      noItems: '暂无项目。',
      onePerLine: '每行一个值',
      steps: '表单步骤'
    },
    mcpTest: {
      title: 'MCP 连接测试',
      testing: '正在连接并列出工具...',
      ok: '已连接',
      failed: '失败',
      tools_one: '{{count}} 个工具',
      tools_other: '{{count}} 个工具'
    },
    permissions: {
      title: '有效权限',
      none: '没有任何授权。此主体只能使用绕过规则（如果有）。',
      source: '角色',
      type: '类型',
      resources: '资源类型',
      operations: '操作',
      scope: '范围'
    },
    requestDetails: {
      title: '请求详情',
      metadata: '元数据',
      requestHeaders: '请求头',
      requestBody: '请求正文',
      responseHeaders: '响应头',
      responseBody: '响应正文',
      rawJson: '原始 JSON',
      truncated: '已截断（原始大小 {{bytes}} 字节）',
      empty: '无内容。',
      fields: {
        id: '请求 ID',
        method: '方法',
        path: '路径',
        url: 'URL',
        status: '状态',
        duration: '耗时',
        createdUtc: '创建时间',
        completedUtc: '完成时间',
        sourceIp: '来源 IP',
        principal: '主体',
        tenant: '租户',
        user: '用户'
      }
    },
    secretOnce: {
      title: '请立即复制此密钥',
      warning: '密钥仅在此时显示一次。关闭前请将其妥善保存。',
      accessKey: '访问密钥',
      secretKey: '私密密钥',
      done: '我已保存'
    },
    table: {
      bulkActions: '批量操作',
      bulkDelete: '删除所选项',
      clearSelection: '清除选择',
      empty: '没有可显示的记录。',
      first: '第一页',
      jump: '跳转到页',
      last: '最后一页',
      loading: '正在加载记录...',
      next: '下一页',
      noMatches: '没有符合当前筛选条件的记录。',
      pageOf: '第 {{page}} 页，共 {{total}} 页',
      pageSize: '每页',
      pinned: '始终显示',
      prev: '上一页',
      records_one: '条记录',
      records_other: '条记录',
      refresh: '刷新',
      selectAll: '选择本页所有行',
      selectColumns: '选择列',
      selected_one: '已选择 {{count}} 项',
      selected_other: '已选择 {{count}} 项',
      selectRow: '选择行',
      showing: '显示第 {{from}} 至 {{to}} 条',
      sortBy: '按{{column}}排序',
      sortPageOnly: '仅对当前页排序'
    }
  },
  resources: {
    approvals: {
      ...rp('审批', '智能体请求进行的工具调用，由部署规则、部署默认设置、人员或超时决定。待处理的审批等待你处理。', '添加审批', '创建审批', '编辑审批', '审批详情', '删除审批', '暂无审批', '当启用了审批的部署在工具调用前发出询问时，审批会显示在这里。'),
      columns: {
        createdUtc: '请求时间',
        agentName: '智能体',
        toolName: '工具',
        summary: '请求',
        status: '状态',
        decision: '决定',
        decisionSource: '来源',
        decidedBy: '决定者',
        expiresUtc: '过期时间',
        kind: '类别',
        harnessType: 'Harness',
        runId: '运行',
        waitMs: '等待',
        reason: '原因',
        decidedUtc: '决定时间',
        id: 'ID'
      },
      fields: {
        status: '状态',
        decision: '决定',
        decisionSource: '决定来源',
        decidedBy: '决定者',
        toolName: '工具',
        kind: '类别',
        harnessType: 'Harness',
        agentName: '智能体',
        runId: '运行',
        rootRunId: '根运行',
        deploymentId: '部署',
        leaseEpoch: '租约纪元',
        requestedUtc: '请求时间',
        expiresUtc: '过期时间',
        decidedUtc: '决定时间',
        waitMs: '等待时长',
        timeoutDecision: '超时后的决定',
        toolCallId: '工具调用 ID',
        reason: '原因',
        summary: '摘要',
        inputPreview: '输入（已脱敏）',
        rulePattern: '匹配的规则',
        ruleId: '规则 ID',
        suggestedRule: '建议的规则',
        rememberedRuleId: '已记住的规则 ID'
      },
      filters: {
        runId: '运行 ID',
        runIdPlaceholder: '运行 ID（run_...）'
      },
      actions: {
        allow: '允许',
        deny: '拒绝',
        openRun: '打开运行'
      }
    },
    tenants: {
      ...rp('租户', '相互隔离的空间，每个租户拥有各自的用户、智能体、机密和运行。', '添加租户', '创建租户', '编辑租户', '租户详情', '删除租户', '暂无租户', '创建租户以隔离团队或客户。'),
      columns: { name: '名称', id: 'ID', description: '描述', active: '启用', createdUtc: '创建时间' },
      fields: { name: '名称', description: '描述', active: '启用' }
    },
    users: {
      ...rp('用户', '使用电子邮件和密码登录此租户的人员。', '添加用户', '创建用户', '编辑用户', '用户详情', '删除用户', '暂无用户', '添加用户，以便相应人员登录此租户。'),
      columns: { email: '电子邮件', name: '姓名', id: 'ID', role: '角色', active: '启用', createdUtc: '创建时间' },
      fields: { email: '电子邮件', password: '密码', firstName: '名', lastName: '姓', isTenantAdmin: '租户管理员', isAdmin: '系统管理员', active: '启用' },
      hints: { isAdmin: '系统管理员可以管理所有租户，并绕过所有授权检查。', password: '编辑时留空即可保留当前密码。' },
      actions: { permissions: '有效权限' }
    },
    credentials: {
      ...rp('访问密钥', '供自动化脚本、SDK 和集成使用的访问密钥。私密密钥只显示一次。', '添加访问密钥', '创建访问密钥', '编辑访问密钥', '访问密钥详情', '删除访问密钥', '暂无访问密钥', '创建访问密钥，以便脚本或服务调用 Garrison。'),
      columns: { name: '名称', accessKey: '访问密钥', secretKeyLast4: '私密密钥', userId: '所有者', lastUsedUtc: '上次使用', expiresUtc: '过期时间', active: '启用', id: 'ID' },
      fields: { name: '名称', userId: '所有者', authMode: '身份验证模式', expiresUtc: '过期时间', active: '启用' },
      hints: { userId: '访问密钥的权限永远不会超过其所有者的权限。' },
      actions: { rotate: '轮换私密密钥' }
    },
    roles: {
      ...rp('角色', '角色是权限的集合。内置角色为只读，如需自定义请先克隆。', '添加角色', '创建角色', '编辑角色', '角色详情', '删除角色', '暂无角色', '创建自定义角色，或克隆内置角色。'),
      columns: { name: '名称', description: '描述', isBuiltIn: '类型', active: '启用', id: 'ID', createdUtc: '创建时间' },
      fields: { name: '名称', description: '描述', active: '启用' }
    },
    permissions: {
      ...rp('权限', '允许或拒绝对资源类型执行操作。拒绝始终优先。', '添加权限', '创建权限', '编辑权限', '权限详情', '删除权限', '暂无权限', '创建权限并将其映射到角色。'),
      columns: { name: '名称', permissionType: '类型', resourceTypes: '资源类型', operationTypes: '操作', isBuiltIn: '来源', id: 'ID' },
      fields: { name: '名称', permissionType: '类型', resourceTypes: '资源类型', operationTypes: '操作', active: '启用' }
    },
    userAssignments: {
      ...rp('用户分配', '在租户或资源范围内向用户授予角色。', '添加用户分配', '创建用户分配', '编辑用户分配', '用户分配详情', '删除用户分配', '暂无用户分配', '为用户分配角色。'),
      columns: { userId: '用户', roleName: '角色', resourceScope: '范围', resourceId: '资源', active: '启用', createdUtc: '创建时间', id: 'ID' },
      fields: { userId: '用户', roleId: '角色', resourceScope: '范围', resourceId: '资源 ID', inheritsToChildren: '应用于租户内的资源', active: '启用' }
    },
    credentialAssignments: {
      ...rp('访问密钥分配', '向访问密钥授予角色。访问密钥的权限应比其所有者更窄。', '添加访问密钥分配', '创建访问密钥分配', '编辑访问密钥分配', '访问密钥分配详情', '删除访问密钥分配', '暂无访问密钥分配', '为访问密钥分配角色。'),
      columns: { credentialId: '访问密钥', roleName: '角色', resourceScope: '范围', resourceId: '资源', active: '启用', createdUtc: '创建时间', id: 'ID' },
      fields: { credentialId: '访问密钥', roleId: '角色', resourceScope: '范围', resourceId: '资源 ID', inheritsToChildren: '应用于租户内的资源', active: '启用' }
    },
    harnessProfiles: {
      ...rp('Harness 配置文件', '精确描述 Harness 如何以无头模式运行：可执行文件、参数、环境变量、文件和输出解析。', '添加 Harness 配置文件', '创建 Harness 配置文件', '编辑 Harness 配置文件', 'Harness 配置文件详情', '删除 Harness 配置文件', '暂无 Harness 配置文件', '克隆内置配置文件，以自定义 Harness 的启动方式。'),
      steps: { basics: '基本信息', invocation: '调用方式', output: '输出', limits: '限制' },
      columns: { name: '名称', harnessType: 'Harness', executable: '可执行文件', outputParser: '解析器', isBuiltIn: '来源', id: 'ID', createdUtc: '创建时间' },
      fields: {
        name: '名称',
        description: '描述',
        harnessType: 'Harness 类型',
        executable: '可执行文件',
        probeArguments: '版本探测参数',
        active: '启用',
        arguments: '参数',
        argTemplate: '模板',
        argCondition: '条件',
        argRepeatOver: '遍历对象',
        promptDelivery: '提示词传递方式',
        promptArgumentTemplate: '提示词参数或文件名',
        systemPromptDelivery: '系统提示词传递方式',
        systemPromptTarget: '系统提示词目标',
        mcpConfigFormat: 'MCP 配置格式',
        mcpConfigFileName: 'MCP 配置文件名',
        environment: '环境变量',
        envName: '名称',
        envValue: '值模板',
        isSecret: '机密',
        files: '文件',
        fileBase: '基础目录',
        filePath: '路径',
        fileContent: '内容模板',
        fileMode: '权限模式',
        credentialEnvironmentAllowlist: '允许的凭据变量',
        outputParser: '输出解析器',
        genericTextField: '文本字段路径',
        genericFinalField: '最终结果字段路径',
        genericSuccessField: '成功字段路径',
        genericSuccessValue: '成功值',
        resultSource: '结果来源',
        resultFileName: '结果文件名',
        successPolicy: '成功判定策略',
        successExitCodes: '成功退出码',
        defaultTimeoutSeconds: '默认超时（秒）',
        killGraceSeconds: '终止宽限期（秒）',
        maxOutputBytes: '最大输出（字节）',
        stderrTailBytes: 'Stderr 尾部长度（字节）',
        isolateHome: '每次运行隔离 HOME',
        supportsResume: '支持恢复会话'
      },
      hints: {
        arguments: '每个模板渲染为一个参数。如果条件渲染结果为空或 false，则跳过该参数。',
        executable: '工作节点 PATH 中的命令名，或绝对路径。',
        environment: '使用 {{secret.alias}} 引用已绑定的机密。进程环境变量初始为空，仅包含允许列表中的变量。',
        successPolicy: '默认情况下，Garrison 根据解析器的最后一个事件判定是否成功，而不是根据退出码。'
      },
      errors: { reservedPrefix: 'builtin/ 前缀为保留前缀。' }
    },
    promptTemplates: {
      deleteBound_other: '“{{name}}”被 {{count}} 个部署绑定，因此服务器会拒绝删除。请先从以下部署中移除绑定：',
      deleteBound_one: '“{{name}}”被 {{count}} 个部署绑定，因此服务器会拒绝删除。请先从以下部署中移除绑定：',
      deleteUnbound: '删除“{{name}}”及其所有版本？没有部署绑定它。此操作无法撤销。',
      ...rp('提示词模板', 'Garrison 渲染的所有提示词和配置文件。每次保存都会创建一个新版本。', '添加模板', '创建模板', '编辑模板', '模板详情', '删除模板', '暂无提示词模板', '创建模板，或克隆内置模板。'),
      add: '新建模板',
      columns: { name: '名称', kind: '类别', currentVersion: '版本', description: '描述', isBuiltIn: '来源', id: 'ID', lastUpdateUtc: '更新时间' },
      fields: { name: '名称', kind: '类别', description: '描述' }
    },
    mcpServers: {
      ...rp('MCP 服务器', '智能体可以使用的 MCP 服务器。请求头和环境变量可以引用机密。', '添加 MCP 服务器', '创建 MCP 服务器', '编辑 MCP 服务器', 'MCP 服务器详情', '删除 MCP 服务器', '暂无 MCP 服务器', '注册 MCP 服务器，以便部署绑定它。'),
      columns: { name: '名称', transport: '传输方式', endpoint: '端点', required: '必需', active: '启用', id: 'ID', createdUtc: '创建时间' },
      fields: {
        name: '名称',
        transport: '传输方式',
        description: '描述',
        url: '基础 URL',
        path: 'MCP 路径',
        headers: '请求头',
        headerName: '名称',
        headerValue: '值模板',
        command: '命令',
        arguments: '参数',
        environment: '环境变量',
        requiredTools: '必需工具',
        toolTimeoutSeconds: '工具超时（秒）',
        required: '无法访问时使运行失败',
        active: '启用'
      },
      hints: { requiredTools: '如果缺少列出的任一工具，预检会在启动前使运行失败。' },
      actions: { test: '测试连接' }
    },
    secrets: {
      errors: { expiryPast: '请选择未来的过期时间，或留空使机密永不过期。' },
      ...rp('机密', '供 Harness 和集成使用的加密凭据。值为只写。', '添加机密', '创建机密', '编辑机密', '机密详情', '删除机密', '暂无机密', '添加智能体所需的 API 密钥或令牌，例如 Anthropic API 密钥。'),
      notSet: '未设置',
      neverRefreshed: '尚未刷新',
      reauth: { title: '此登录需要重新认证', since: '自 {{time}} 起', action: '使用此机密的运行会一直失败，直到你替换它的值。请使用单独的 CODEX_HOME 运行 codex login 重新登录，然后用“设置值”保存新的 auth.json，或将部署改用 OpenAI API 密钥机密。不要在另一台机器上继续使用同一个登录：两份副本共用同一个刷新令牌。' },
      columns: { status: '状态', accessTokenExpiresUtc: '访问令牌过期时间', name: '名称', kind: '类别', valueLast4: '值', rotatedUtc: '上次更改', expiresUtc: '过期时间', active: '启用', id: 'ID' },
      fields: { refreshedUtc: 'Garrison 上次刷新', accessTokenExpiresUtc: '访问令牌过期时间', name: '名称', kind: '类别', description: '描述', value: '值', newValue: '新值', expiresUtc: '过期时间', active: '启用' },
      hints: { expiresUtc: '必须是未来的时间。留空表示机密永不过期。', kind: '在共享服务器上使用订阅令牌可能违反提供商条款。共享部署请优先使用 API 密钥。' },
      actions: { setValue: '设置值', rotate: '轮换' }
    },
    workspaces: {
      ...rp('工作区', '运行工作区的准备方式：空目录、从 Git 克隆，或预置文件。', '添加工作区模板', '创建工作区模板', '编辑工作区模板', '工作区模板详情', '删除工作区模板', '暂无工作区', '创建工作区模板，让部署从仓库或文件开始。'),
      columns: { name: '名称', kind: '类别', gitUrl: '仓库', retention: '保留策略', active: '启用', id: 'ID', createdUtc: '创建时间' },
      fields: { name: '名称', kind: '类别', description: '描述', gitUrl: '仓库 URL', gitRef: '分支、标签或提交', gitDepth: '克隆深度', gitCredentialSecretId: 'Git 凭据', persistentVolumeClaim: 'PersistentVolumeClaim 名称', files: '文件', filePath: '路径', fileContent: '内容', retention: '保留策略', active: '启用' },
      hints: { persistentVolumeClaim: '运行命名空间中已有的 Claim。只有使用 Kubernetes Job 执行器的部署才能使用此工作区；其内容在多次运行之间保留。' },
      errors: { claimName: '请使用小写字母、数字、连字符和点，并以字母或数字开头和结尾。' }
    },
    modelPrices: {
      ...{"title": "模型价格", "subtitle": "在执行器未报告费用时，使用操作员配置的美元费率进行估算。已报告费用（包括零）优先。", "add": "添加模型价格", "create": "创建模型价格", "edit": "编辑模型价格", "view": "模型价格详情", "deleteTitle": "删除模型价格", "emptyTitle": "暂无模型价格", "emptyBody": "为执行器和实际使用的精确模型名称添加价格。不预设供应商费率。"},
      columns: {"name": "名称", "active": "启用", "id": "ID", "createdUtc": "创建时间", "model": "实际使用的模型", "harnessType": "执行器", "inputUsdPerMillion": "输入美元 / 百万令牌", "outputUsdPerMillion": "输出美元 / 百万令牌"},
      fields: {"name": "名称", "description": "描述", "active": "启用", "model": "实际使用的模型", "harnessType": "执行器", "inputUsdPerMillion": "输入美元 / 百万令牌", "outputUsdPerMillion": "输出美元 / 百万令牌", "cachedInputUsdPerMillion": "缓存输入美元 / 百万令牌", "reasoningUsdPerMillion": "推理美元 / 百万令牌", "inputIncludesCachedTokens": "输入计数包含缓存令牌", "outputIncludesReasoningTokens": "输出计数包含推理令牌"},
      hints: {"cachedInputUsdPerMillion": "留空时使用对应的输入或输出费率。零表示免费。", "reasoningUsdPerMillion": "留空时使用对应的输入或输出费率。零表示免费。", "inputIncludesCachedTokens": "当输入计数包含缓存令牌时启用。Claude Code单独报告缓存读取，应禁用此项。", "outputIncludesReasoningTokens": "当输出计数包含推理令牌时启用。先扣除已包含的子计数，再应用单独费率。"},
      errors: {"rate": "请输入0至1,000,000,000之间的有限费率。零为有效值。", "model": "请输入1至256个字符且不含控制字符的精确模型名称。"}
    },
    usageQuotas: {"title": "使用配额", "subtitle": "租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "add": "添加使用配额", "create": "创建使用配额", "edit": "编辑使用配额", "view": "使用配额详情", "deleteTitle": "删除使用配额", "emptyTitle": "暂无使用配额", "emptyBody": "为租户、代理或部署添加配额。留空的限制表示无限制。", "columns": {"name": "名称", "active": "启用", "id": "ID", "createdUtc": "创建时间", "scope": "范围", "resourceId": "目标资源", "dailyRunLimit": "每UTC日运行数", "dailyTokenLimit": "每UTC日令牌数", "dailyCostUsdLimit": "每UTC日已知美元", "maxConcurrentRuns": "最大活跃运行数", "enforcementEnabled": "执行限制"}, "fields": {"name": "名称", "description": "描述", "active": "启用", "scope": "范围", "resourceId": "目标资源", "dailyRunLimit": "每UTC日运行数", "dailyTokenLimit": "每UTC日令牌数", "dailyCostUsdLimit": "每UTC日已知美元", "maxConcurrentRuns": "最大活跃运行数", "enforcementEnabled": "执行限制"}, "hints": {"dailyRunLimit": "留空表示无限制，零表示禁止使用。每日计数在UTC午夜重置；并发计数为当前活跃运行数。 仅在启用限制执行后才会应用限制。", "dailyTokenLimit": "留空表示无限制，零表示禁止使用。每日计数在UTC午夜重置；并发计数为当前活跃运行数。 仅在启用限制执行后才会应用限制。", "dailyCostUsdLimit": "留空表示无限制，零表示禁止使用。每日计数在UTC午夜重置；并发计数为当前活跃运行数。 仅在启用限制执行后才会应用限制。", "maxConcurrentRuns": "留空表示无限制，零表示禁止使用。每日计数在UTC午夜重置；并发计数为当前活跃运行数。 仅在启用限制执行后才会应用限制。", "resourceId": "为租户、代理或部署添加配额。留空的限制表示无限制。", "enforcementEnabled": "默认关闭。明确启用后才会在达到限制时拒绝运行，并降低支持的执行器预算。关闭时仅记录使用量，不影响执行。"}, "errors": {"limit": "请输入字段范围内的非负限制。计数必须为整数。"}, "incomplete": "成本统计不完整：{{count}} 个已完成运行没有报告或估算成本。仅在启用限制执行后才会应用限制；缺少成本本身不会阻止运行。", "actions": {"usage": "每日使用量"}, "usage": {"windowStartUtc": "窗口开始 (UTC)", "windowEndUtc": "每日重置 (UTC)", "runsUsed": "已接收运行", "tokensUsed": "已完成令牌数", "costUsd": "已知费用 (USD)", "unknownCostRuns": "缺少费用的运行", "activeRuns": "活跃运行"}},
    artifactStores: {
      ...rp('制品存储', '运行生成的文件的存放位置。', '添加制品存储', '创建制品存储', '编辑制品存储', '制品存储详情', '删除制品存储', '暂无制品存储', '创建制品存储以保存运行输出。'),
      columns: { name: '名称', kind: '类别', description: '描述', active: '启用', id: 'ID', createdUtc: '创建时间' },
      fields: { name: '名称', kind: '类别', description: '描述', active: '启用' }
    },
    agents: {
      deleteWithDeployments_other: '删除“{{name}}”及其 {{count}} 个部署？下面的部署也会被删除。此操作无法撤销。',
      deleteWithDeployments_one: '删除“{{name}}”及其 {{count}} 个部署？下面的部署也会被删除。此操作无法撤销。',
      deleteNoDeployments: '删除“{{name}}”？它没有部署。此操作无法撤销。',
      ...rp('智能体', '通过 REST、MCP 和 A2A 公开的具名能力。由部署决定它们如何运行。', '添加智能体', '创建智能体', '编辑智能体', '智能体详情', '删除智能体', '暂无智能体', '添加智能体，或在“配置 > 清单”中应用示例清单。'),
      sections: { identity: '标识', exposure: '公开方式', io: '输入和输出', delegation: '委派' },
      columns: { name: '名称', displayName: '显示名称', kind: '类别', exposure: '公开方式', delegationMode: '委派', tags: '标记', active: '启用', id: 'ID', createdUtc: '创建时间' },
      fields: {
        name: '名称',
        displayName: '显示名称',
        description: '描述',
        kind: '类别',
        agentVersion: '版本',
        tags: '标记',
        remoteProtocol: '远程协议',
        remoteEndpointUrl: '远程端点 URL',
        exposeA2A: '通过 A2A 公开',
        exposeMcpTool: '作为独立的 MCP 工具公开',
        mcpToolName: 'MCP 工具名称',
        skills: 'A2A 技能',
        skillId: '技能 ID',
        skillName: '名称',
        skillDescription: '描述',
        inputMode: '输入模式',
        inputSchemaJson: '输入 JSON Schema',
        outputSchemaJson: '输出 JSON Schema',
        delegationMode: '委派',
        delegationAllowList: '可调用的智能体',
        delegationMaxDepth: '最大深度',
        delegationAllowRecursion: '允许递归',
        active: '启用'
      },
      hints: { name: '小写字母、数字和连字符。用于 URL 和 A2A 卡片。' },
      errors: { dnsName: '请使用小写字母、数字和连字符，并以字母或数字开头和结尾。' }
    },
    deployments: {
      approvalsOn_one: '已开启，{{count}} 条规则',
      approvalsOn_other: '已开启，{{count}} 条规则',
      approvalsOff: '已关闭',
      promptRoles: { Repair: '结构化输出修复', DelegatedTask: '委派运行的任务包装', Task: '任务包装', System: '系统提示词', ConversationFallback: '对话回退（记录）' },
      ...rp('部署', '将智能体绑定到 Harness 配置文件、提示词、机密、MCP 服务器、调度放置和限制。', '添加部署', '创建部署', '编辑部署', '部署详情', '删除部署', '暂无部署', '创建部署，使智能体可以运行。'),
      steps: { approvals: '审批', basics: '基本信息', harness: 'Harness', prompts: '提示词', resources: '资源', overrides: '覆盖', placement: '调度放置和限制' },
      columns: { approvalsEnabled: '审批', name: '名称', agentId: '智能体', harnessProfileId: 'Harness 配置文件', model: '模型', executor: '执行器', weight: '权重', configVersion: '配置版本', active: '启用', id: 'ID', createdUtc: '创建时间' },
      fields: {
        approvalsEnabled: '工具调用前询问（审批）',
        approvalDefaultAction: '没有规则匹配时',
        approvalTimeoutSeconds: '审批超时（秒）',
        approvalTimeoutDecision: '无人响应时的决定',
        approvalRules: '审批规则',
        ruleAction: '操作',
        rulePattern: '规则',
        ruleInputPattern: '输入模式',
        ruleDescription: '描述',
        approvalTest: '测试工具调用',
        name: '名称',
        agentId: '智能体',
        description: '描述',
        weight: '流量权重',
        active: '启用',
        harnessProfileId: 'Harness 配置文件',
        model: '模型',
        fallbackModel: '备用模型',
        effort: '推理强度',
        maxTurns: '最大轮数',
        maxBudgetUsd: '最大预算（美元）',
        parameters: '参数',
        paramName: '名称',
        paramValue: '值',
        promptBindings: '提示词绑定',
        promptRole: '角色',
        template: '模板',
        pinnedVersion: '固定版本',
        resourceBindings: '资源绑定',
        bindingKind: '类别',
        alias: '别名',
        resource: '资源',
        workspaceTemplateId: '工作区模板',
        artifactStoreId: '制品存储',
        argumentOverrides: '参数覆盖',
        operation: '操作',
        match: '匹配',
        argTemplate: '模板',
        condition: '条件',
        environmentOverrides: '环境变量覆盖',
        envName: '名称',
        envValue: '值模板',
        isSecret: '机密',
        fileOverrides: '文件覆盖',
        allowedRunOverrides: '调用方可按运行设置的覆盖项',
        validation: '验证',
        pattern: '模式或取值',
        nodePoolId: '节点池',
        nodeSelector: '节点选择器',
        maxConcurrentRuns: '最大并发运行数',
        timeoutSeconds: '超时（秒）',
        maxAttempts: '最大尝试次数',
        repetitionGuard: '重复防护',
        maxAssistantChars: '最大助手字符数',
        noProgressSeconds: '无进展超时（秒）',
        executor: '执行器',
        podCpuRequest: 'CPU 请求',
        podCpuLimit: 'CPU 上限',
        podMemoryRequest: '内存请求',
        podMemoryLimit: '内存上限',
        podEphemeralStorageRequest: '临时存储请求',
        podEphemeralStorageLimit: '临时存储上限'
      },
      hints: {
        approvalsEnabled: '适用于 Claude Code 配置文件以及使用 Codex app-server 的配置文件。其他 Harness 没有审批钩子，因此服务器会拒绝为它们启用此设置。',
        approvalDefaultAction: '“询问人员”会在审批收件箱中等待，直到有人决定或超时。',
        approvalTimeoutSeconds: '10 到 3,600 秒。留空则使用 300。',
        approvalRules: '拒绝优先于询问，询问优先于允许。示例：Bash(npm test)、Bash(npm run *)、Edit(src/**)、WebFetch(domain:example.com)、mcp__github__*。',
        secretsKinds: 'Harness 配置文件 {{profile}} 需要任意一个类型为 {{kinds}} 的机密。可用任意别名绑定。',
        secretsAliases: 'Harness 配置文件 {{profile}} 读取以这些别名绑定的机密：{{aliases}}。',
        secretsNone: 'Harness 配置文件 {{profile}} 不读取任何机密，因此无需绑定机密。',
        promptBindings: '将提示词角色（System、Task、DelegatedTask，以及 Harness 配置文件使用的任何角色）映射到模板。版本留空则始终使用最新版本。',
        resourceBindings: '别名会成为模板变量，例如 {{secret.anthropic}}。',
        weight: '未显式指定部署的请求会按权重分配到各个启用的部署。',
        maxConcurrentRuns: '0 表示不限制。',
        timeoutCap: '集群设置 {{setting}} 将每个运行限制为 {{value}} 秒。',
        zeroUnlimited: '0 表示不限制。',
        zeroOff: '0 表示关闭此防护。',
        guardDefault: '留空时使用 {{setting}} 中的集群默认值 {{value}}。',
        guardDefaultUnknown: '留空时使用集群设置 {{setting}}。',
        guardOwn: '已在此部署上设置。集群默认值（{{setting}}）为 {{value}}。',
        guardOwnUnknown: '已在此部署上设置，不使用集群设置 {{setting}}。',
        guardFollowing: '遵循 {{setting}} 中的集群默认值 {{value}}。',
        executorInherit: '留空则使用节点池默认值：{{executor}}。',
        executorSet: '进程在 worker 内运行 harness；Kubernetes Job 在独立的 Pod 中运行它。',
        podCpuRequest: 'Pod 资源仅适用于 Kubernetes Job 运行。请使用 Kubernetes 数量，例如 500m、2、512Mi 或 4Gi；留空则使用 worker 默认值。'
      },
      actions: { addRule: '添加规则', compilePreview: '编译预览', test: '测试调用', useClusterDefault: '使用集群默认值' },
      sections: {
        guards: '运行防护',
        execution: '执行器和 Pod 资源'
      },
      placeholders: {
        ruleInputPattern: '可选，匹配输入 JSON 的正则表达式',
        clusterDefault: '集群默认值（{{value}}）',
        clusterDefaultUnknown: '集群默认值'
      },
      executorInherit: '节点池默认值',
      executorInheritShort: '节点池默认',
      errors: { rulePatternRequired: '请输入规则模式。', rulePatternOneLine: '规则模式必须写在一行内。', rulePatternTooLong: '规则模式最多 1,000 个字符。', tooManyRules: '一个部署最多可有 500 条审批规则。', approvalTimeout: '请输入 10 到 3,600 之间的整数秒数。', quantity: '请使用 Kubernetes 数量，例如 500m、2、512Mi 或 4Gi。' },
      guardStates: {
        on: '开启',
        off: '关闭'
      }
    },
    nodePools: {
      ...rp('节点池', '按标签对工作节点分组，并可选择将其专供特定租户使用。', '添加节点池', '创建节点池', '编辑节点池', '节点池详情', '删除节点池', '暂无节点池', '创建节点池以分配专用容量。'),
      allTenants: '所有租户',
      columns: { name: '名称', description: '描述', tenants: '租户', defaultExecutor: '默认执行器', active: '启用', id: 'ID', createdUtc: '创建时间' },
      fields: { name: '名称', description: '描述', defaultExecutor: '默认执行器', tenants: '允许的租户 ID', active: '启用' },
      hints: { tenants: '留空则允许所有租户。' }
    },
    runs: {
      ...rp('运行', '每次智能体调用的状态、节点、耗时和结果。', '添加运行', '创建运行', '编辑运行', '运行详情', '删除运行', '暂无运行', '调用智能体即可开始一次运行。'),
      columns: {
        approvalWaitMs: '审批等待',
        delegationWaitMs: '委派等待时间',
        timeToFirstTokenExcludingDelegationMs: '首 Token 时间（不含委派）',
        id: '运行',
        agentName: '智能体',
        status: '状态',
        outcome: '结果',
        harnessType: 'Harness',
        leaseNodeName: '节点',
        timeToFirstTokenMs: '首 Token 时间',
        streamingMs: '流式输出',
        executionMs: '耗时',
        queueMs: '排队时间',
        totalMs: '总时间',
        inputTokens: '输入 Token',
        outputTokens: '输出 Token',
        cachedTokens: '缓存 Token',
        reasoningTokens: '推理 Token',
        outputTokensPerSecond: 'Token/秒',
        costUsd: '成本',
        toolCallCount: '工具调用',
        depth: '深度',
        createdUtc: '创建时间',
        conversationId: '对话'
      },
      actions: { cancel: '取消运行', retry: '重试运行' },
      toasts: { cancelRequested: '已请求取消。', retried: '已开始重试。' },
      turn: '第 {{turn}} 轮'
    },
    nodes: {
      ...rp('节点', '租用并执行运行的工作节点。维护前请先封锁或排空节点。', '添加节点', '创建节点', '编辑节点', '节点详情', '删除节点', '暂无节点', '工作节点启动时会自动注册。请部署工作节点 StatefulSet，或在本地运行 Garrison.Worker。'),
      columns: { name: '名称', status: '状态', capacity: '运行数', harnesses: 'Harness', executors: '执行器', containerized: '容器化', labels: '标签', nodeVersion: '版本', lastHeartbeatUtc: '上次心跳', id: 'ID' },
      fields: { address: '地址', maxConcurrentRuns: '容量', childReserveSlots: '子运行预留', maxResidentWaiters: '最多等待运行数', activeRuns: '活动运行', capabilities: '能力', detectedVersion: '版本', available: '可用', detail: '详细信息' },
      actions: { cordon: '封锁', uncordon: '解除封锁', drain: '排空', runs: '查看运行', grafana: '在 Grafana 中打开' },
      toasts: { cordoned: '节点已封锁。', uncordoned: '节点已解除封锁。', draining: '节点正在排空。' }
    },
    controlNodes: {
      ...rp('控制平面', '提供 API、MCP 和 A2A 并调度运行的服务器副本。每个副本会自行注册，并每 5 秒发送一次心跳。', '添加控制节点', '创建控制节点', '编辑控制节点', '控制节点详情', '删除控制节点', '没有报告任何控制节点', '服务器副本启动后，控制节点就会出现在这里。比此控制台旧的服务器不会报告控制节点。'),
      columns: { name: '名称', status: '状态', version: '版本', schemaVersion: '架构版本', backplane: '事件总线', uptime: '运行时长', lastHeartbeatUtc: '上次心跳', activeRequests: '请求', openStreams: '流', heldLongPolls: '长轮询', address: '地址', hostname: '主机名', startedUtc: '启动时间', id: 'ID' },
      fields: { name: '名称', id: '节点 ID', hostname: '主机名', address: '地址', isLeader: '领导者', leaderEpoch: '领导者纪元', version: '版本', schemaVersion: '数据库架构版本', backplane: '事件总线', startedUtc: '启动时间', uptime: '运行时长', lastHeartbeatUtc: '上次心跳', activeRequests: '活动请求', openStreams: '打开的流', heldLongPolls: '保持的长轮询', respondingNodeId: '响应副本' },
      leader: '领导者',
      stale: '心跳超时',
      answeredBy: '响应的副本：{{node}}',
      answeredByLeader: '响应的副本：{{node}}（领导者）',
      actions: { grafana: '在 Grafana 中打开' }
    },
    audit: {
      ...rp('审计', '此租户的身份验证、授权和配置事件。', '添加审计记录', '创建审计记录', '编辑审计记录', '审计记录详情', '删除审计记录', '暂无审计记录', '随着人员和智能体使用 Garrison，安全事件会显示在这里。'),
      emptyTitle: '暂无审计记录',
      columns: { createdUtc: '时间', eventType: '事件', principalName: '主体', resource: '资源', reason: '原因', sourceIp: '来源 IP', id: 'ID' },
      fields: {
        eventType: '事件',
        principalType: '主体类型',
        principalName: '主体',
        principalId: '主体 ID',
        resourceType: '资源类型',
        resourceId: '资源 ID',
        operation: '操作',
        method: '方法',
        path: '路径',
        authResult: '身份验证结果',
        authorizationResult: '授权结果',
        reason: '原因',
        bypassReason: '绕过原因',
        statusCode: '状态码',
        sourceIp: '来源 IP',
        requestId: '请求 ID',
        createdUtc: '时间'
      }
    },
    manifestApplies: {
      ...rp('应用历史', '每次清单应用和试运行，以及每个文档的结果。', '添加应用记录', '创建应用记录', '编辑应用记录', '应用详情', '删除应用记录', '暂无应用历史', '应用清单或试运行清单后，记录会显示在这里。'),
      columns: { createdUtc: '时间', principalName: '应用者', dryRun: '试运行', counts: '结果' }
    },
    conversations: {
      title: '对话',
      subtitle: '与智能体的多轮交流。每一轮都是一次运行，会恢复上一轮的 Harness 会话。',
      add: '添加对话',
      create: '创建对话',
      edit: '编辑对话',
      view: '对话详情',
      deleteTitle: '删除对话',
      emptyTitle: '还没有对话',
      emptyBody: '在“调用”页面选择“开始新对话”来创建一个，或发送 A2A 消息：每个 A2A 上下文都是一个对话。',
      untitled: '无标题对话',
      columns: {
        title: '标题',
        agentName: '智能体',
        state: '状态',
        turnCount: '轮数',
        affinityNodeName: '亲和节点',
        fallbackCount: '回退次数',
        lastFallbackReason: '最近一次回退',
        harnessType: 'Harness',
        callerName: '发起者',
        contextId: '上下文 ID',
        sessionId: '会话 ID',
        lastActivityUtc: '最近活动',
        createdUtc: '创建时间',
        id: 'ID'
      },
      states: {
        busy: '处理中',
        idle: '空闲'
      },
      actions: {
        continue: '继续',
        runs: '以运行形式查看各轮'
      }
    }
  },
  views: {
    approvalDetail: {
      title: '审批',
      titleWithTool: '{{tool}} 的审批',
      backToInbox: '所有审批',
      pending: '正在等待有人允许或拒绝此工具调用。',
      pendingExpires: '正在等待人员处理。如果无人决定，将于 {{when}} 过期，并采用决定 {{decision}}。',
      request: '请求',
      rules: '规则',
      noRule: '没有匹配的规则',
      noInput: '未记录任何输入。',
      notFoundTitle: '未找到审批',
      notFoundBody: '它可能属于其他租户，或者 ID 有误。'
    },
    home: {
      observabilityState: { reachable: '可访问', unreachable: '无法访问', checking: '检查中', unknown: '状态未知' },
      observabilityVersion: '版本 {{version}}',
      observabilityOpen: '打开 {{service}}',
      kpisGrafana: '在 Grafana 中打开概览',
      grafanaDashboards: 'Grafana 仪表板',
      grafanaSections: { overview: '概览', http: 'HTTP API', runs: '运行', agents: '智能体', models: '模型与令牌', workers: '工作节点', kubernetes: 'Kubernetes 执行器', protocols: '协议', scheduler: '调度器与队列', database: '数据库', controlPlane: '控制平面', security: '安全与认证', integrations: '集成', logs: '日志与追踪' },
      observabilitySetup: '设置可观测性',
      observabilityNone: '此环境未配置任何可观测性服务（Grafana、Prometheus、Tempo 或 Loki）。',
      observability: '可观测性',
      title: '首页',
      subtitle: '你的智能体和工作节点当前的状态。',
      lastLoaded: '更新于 {{time}}',
      partial: '部分面板未能加载，显示的数据不完整。',
      getStartedTitle: '此租户中还没有智能体',
      getStartedBody: '设置向导会添加凭据、应用示例智能体并运行测试。',
      runSetup: '运行设置向导',
      kpis: {
        agents: '智能体',
        deployments: '部署',
        activeRuns: '活动运行',
        queued: '已排队',
        succeeded: '成功',
        failed: '失败',
        nodes: '就绪节点',
        controlNodes: '控制平面就绪',
        nodesNote: '就绪 / 总数',
        last24h: '最近 24 小时'
      },
      requestActivity: 'API 请求活动',
      nodesTitle: '节点',
      noNodesTitle: '尚未注册任何工作节点',
      noNodesBody: '启动 Garrison.Worker 或扩容工作节点 StatefulSet。节点会自动注册。',
      nodeLoad: '{{active}} / {{max}} 个运行',
      controlPlaneSection: '控制平面',
      workersSection: '工作节点',
      openControlPlane: '查看全部',
      openWorkers: '查看全部',
      noControlNodes: '尚未注册任何控制节点。',
      controlNodesUnavailable: '无法显示控制节点：服务器比此控制台旧，或者你无权读取节点。',
      recentFailures: '最近的失败',
      noFailures: '最近没有失败的运行。',
      cta: {
        title: '常用任务',
        invoke: '调用智能体',
        addAgent: '添加智能体',
        applyManifest: '应用清单',
        inspectRuns: '检查运行',
        nodes: '检查工作节点',
        apiExplorer: '打开 API 浏览器',
        analytics: '查看运行分析'
      },
      externalServices: '外部服务',
      externalServicesNote: '捆绑的可观测性工具。共享此部署前请更改默认凭据。',
      externalServicesNone: '此部署未配置任何外部服务。',
      credentials: '默认凭据',
      services: { loki: 'Loki', grafana: 'Grafana', prometheus: 'Prometheus', tempo: 'Tempo' }
    },
    markdown: {
      showRaw: '显示原始文本',
      showRendered: '显示格式化内容'
    },
    invoke: {
      stream: {
        tabsLabel: '响应视图',
        cardLabel: '运行输出',
        preview: '预览',
        response: '响应',
        starting: '正在启动运行...',
        live: '实时',
        finished: '已完成',
        elapsed: '已用时间',
        firstToken: '首个 Token',
        tokensPerSecond: '速度',
        finishedHint: '运行已完成。',
        showResponse: '查看响应',
        reasoning: '推理过程',
        waiting: '正在等待输出...',
        waitingCodex: '正在等待输出。Codex 会在完成时一次性发送回答。',
        codexNote: 'Codex 不支持流式输出：运行结束时，回答会一次性显示在这里。',
        noText: '此运行没有流式文本。结果在“响应”选项卡中。',
        jump: '跳到最新',
        tool: {
          running: '运行中',
          ok: '成功',
          failed: '失败'
        }
      },
      noDeployment: '此智能体没有权重大于零的活动部署，因此调用会被拒绝。请在“部署”标签页中添加部署，或提高某个部署的权重。',
      title: '调用',
      subtitle: '向智能体发送消息，并实时查看对话记录。',
      request: '请求',
      agent: '智能体',
      deployment: '部署',
      weighted: '任意启用的部署（按权重）',
      default: '部署默认值',
      message: '消息',
      messagePlaceholder: '你希望智能体做什么？',
      shortcut: '按 Ctrl+Enter 或 Cmd+Enter 发送。',
      send: '发送',
      sending: '正在发送...',
      openRun: '打开运行',
      idleTitle: '尚无运行',
      idleBody: '发送消息即可开始运行。对话记录会以流式方式显示在这里。',
      noAgentsTitle: '没有可调用的智能体',
      noAgentsBody: '创建智能体和部署，或应用示例清单。',
      applySample: '前往清单',
      stopOnLeave: '离开时停止运行',
      cancel: '取消运行',
      cancelling: '正在取消...',
      timeLimit: '时间限制',
      timeLimitPlaceholder: '部署默认值',
      timeLimitClear: '使用默认值',
      timeLimitRange: '允许范围：{{min}} 到 {{max}}。',
      timeLimitAny: '运行在超时前可以使用的秒数。',
      timeLimitCap: '集群会在 {{max}} 后停止每个运行。',
      timeLimitErrors: {
        notInteger: '请输入整数秒数。',
        range: '请输入 {{min}} 到 {{max}} 之间的时间限制。',
        aboveCap: '集群每个运行最多允许 {{max}}。'
      },
      timeUnits: {
        seconds: '{{value}} 秒',
        minutes: '{{value}} 分钟',
        hours: '{{value}} 小时',
        secondsWord: '秒'
      },
      conversation: {
        mode: '对话',
        modes: {
          none: '单次运行（无对话）',
          start: '开始新对话',
          continue: '继续对话'
        },
        pick: '要继续的对话',
        choose: '选择对话',
        option: '{{title}}（轮数：{{turns}}）',
        pinned: '每一轮都在对话第一轮的部署上运行，因此这里不能选择部署。',
        busy: '该对话仍在处理上一轮。在该运行结束之前，新的消息会被拒绝。',
        open: '打开对话（第 {{turn}} 轮）'
      }
    },
    runDetail: {
      awaitingApproval_one: '此运行正在等待有人批准 {{count}} 个工具调用。',
      awaitingApproval_other: '此运行正在等待有人批准 {{count}} 个工具调用。',
      reviewApprovals: '审查',
      approvals_one: '审批（{{count}}）',
      approvals_other: '审批（{{count}}）',
      noApprovals: '此运行未请求任何审批。',
      openApproval: '打开审批',
      viewTrace: '查看追踪',
      viewLogs: '查看日志',
      traceId: '追踪 ID',
      deploymentDeleted: '此运行使用的部署已被删除，因此无法重试。请改为再次调用智能体 {{agent}}。',
      templatesUsed: '使用的模板',
      agentDeleted: '智能体 {{agent}} 已不存在，因此无法重试此运行。它的记录、对话记录和遥测仍可在此查看。',
      title: '运行',
      titleWithAgent: '{{agent}} 的运行',
      deployment: '部署',
      model: '实际使用的模型',
      tokensLabel: 'Token',
      tokens: '输入 {{input}}，输出 {{output}}',
      estimated: '估算值',
      caller: '调用方',
      parent: '父运行',
      attempt: '尝试次数',
      outputSchema: '输出架构',
      outputSchemaStates: {
        valid: '有效',
        validAfterRepair: '经过一次修复后有效',
        invalid: '无效',
        invalidAfterRepair: '经过一次修复后仍无效'
      },
      started: '开始时间',
      completed: '完成时间',
      exitCode: '退出码',
      transcript: '对话记录',
      result: '结果',
      input: '输入',
      stderr: 'Stderr',
      children_one: '子运行（{{count}}）',
      children_other: '子运行（{{count}}）',
      eventFilter: '显示',
      eventCount_one: '{{count}} 个事件',
      eventCount_other: '{{count}} 个事件',
      noEvents: '暂无事件。Harness 产生事件后会显示在这里。',
      failed: '失败',
      noResult: '此运行未产生结果文本。',
      pending: '运行完成后将显示结果。',
      structuredOutput: '结构化输出',
      templateVersions: '使用的提示词模板版本',
      noStderr: '未捕获到 Stderr 输出。',
      noChildren: '此运行未委派给其他智能体。',
      confirmCancel: '取消此运行？其节点上的 Harness 进程将被停止。',
      notFoundTitle: '未找到运行',
      notFoundBody: '它可能已被删除，或属于其他租户。',
      telemetry: {
        approvalNote: '此运行有 {{wait}} 用于等待审批决定。执行时间包含该等待。',
        delegationNote: '此运行等待委派运行 {{wait}}。首 Token 时间包含该等待为 {{ttft}}，不包含为 {{excluding}}；与不委派的智能体比较时请使用后者。',
        title: '遥测',
        phases: '各阶段运行时间',
        phase: { delegation: '等待委派运行', queue: '排队', startup: '启动至首个 Token', streaming: '流式输出', tail: '最后一个 Token 之后' },
        fields: {
          approvalWaitMs: '审批等待',
          delegationWaitMs: '委派等待时间',
          timeToFirstTokenExcludingDelegationMs: '首 Token 时间（不含委派）',
          timeToFirstTokenMs: '首 Token 时间',
          streamingMs: '流式输出时间',
          executionMs: '执行时间',
          queueMs: '排队时间',
          totalMs: '总时间',
          outputTokensPerSecond: '每秒输出 Token 数',
          inputTokens: '输入 Token',
          outputTokens: '输出 Token',
          cachedTokens: '缓存 Token',
          reasoningTokens: '推理 Token',
          toolCallCount: '工具调用',
          costUsd: '成本',
          firstTokenUtc: '首个 Token 时间',
          lastTokenUtc: '最后一个 Token 时间'
        }
      },
      conversation: '对话',
      conversationSession: '会话',
      resumeSessionId: '恢复的会话',
      affinityNode: '亲和节点',
      affinityUntil: '直到 {{time}}'
    },
    queue: {
      title: '队列',
      subtitle: '按智能体和 Harness 查看等待节点、已租用和运行中的工作。',
      queued: '已排队',
      leased: '已租用',
      running: '运行中',
      emptyTitle: '没有等待中的工作',
      emptyBody: '运行在等待工作节点时会显示在这里。'
    },
    agentDetail: {
      invoke: '调用',
      grafana: '在 Grafana 中打开',
      noActiveDeployment: '此智能体没有启用的部署，因此调用会被拒绝。',
      deployments_one: '部署（{{count}}）',
      deployments_other: '部署（{{count}}）',
      recentRuns: '最近的运行',
      card: 'A2A 卡片',
      traffic: '流量占比',
      noDeploymentsTitle: '暂无部署',
      noDeploymentsBody: '创建部署，将此智能体绑定到 Harness。',
      noRuns: '此智能体尚未运行过。',
      selectionNote: '每次未显式指定部署的调用都会发往一个启用的部署，按权重比例随机选择。',
      manageDeployments: '管理部署',
      conversations: '对话'
    },
    templateEditor: {
      cloneToEdit: '克隆后编辑',
      builtInReadOnly: '内置模板为只读，因此这里的所有字段都已锁定。克隆后即可获得可编辑的副本。',
      renameHint: '可以重命名此模板。部署按 ID 引用它，所以绑定不受影响；但按名称包含它的模板需要手动更新。',
      cloneDialog: { taken: '已存在名为 {{name}} 的模板。请换一个名称。', reserved: '以 builtin/ 开头的名称保留给内置模板。', hint: '之后可以在副本页面中重命名。', name: '副本名称', body: '副本以当前内容作为第 1 版，之后可以编辑、重命名和删除。', title: '克隆 {{name}}' },
      newTitle: '新建提示词模板',
      subtitle: '编写模板，使用示例上下文预览，然后保存。',
      builtInNote: '内置模板为只读。请克隆后自定义，或重置以恢复随产品提供的内容。',
      content: '内容',
      changeNote: '变更说明',
      syntaxHint: '语法：{{variable}}、{{value | default: "x"}}、{{#if x}}...{{else}}...{{/if}}、{{#each list}}...{{/each}}、{{> template-name}}。',
      variables: '使用的变量',
      noVariables: '未引用任何变量。',
      preview: '实时预览',
      sampleContext: '示例上下文（JSON）',
      rendered: '渲染结果',
      previewEmpty: '渲染后的文本会显示在这里。',
      missing: '缺少变量：{{list}}',
      versions_one: '版本（{{count}}）',
      versions_other: '版本（{{count}}）',
      noVersions: '暂无已保存的版本。',
      version: '版本',
      note: '说明',
      author: '作者',
      diff: '差异',
      restore: '恢复',
      diffTitle: '版本 {{version}} 与编辑器内容的对比',
      current: '编辑器',
      reset: '重置为默认值',
      savedVersion: '已保存新版本。',
      restored: '已恢复版本 {{version}}。',
      resetDone: '已重置为随产品提供的内容。',
      confirm: {
        restoreTitle: '恢复版本',
        restoreMessage: '恢复版本 {{version}}？当前内容会保留在历史记录中。',
        resetTitle: '重置模板',
        resetMessage: '将“{{name}}”重置为随产品提供的内容？',
        deleteTitle: '删除模板',
        deleteMessage: '删除“{{name}}”？绑定该模板的部署将无法编译。'
      }
    },
    manifests: {
      warnings_one: '{{count}} 条警告',
      warnings_other: '{{count}} 条警告',
      planned: '预计结果：{{result}}',
      changes: { count_other: '{{count}} 个字段有变更。', count_one: '{{count}} 个字段有变更。', empty: '（空）', after: '变更后', before: '变更前', field: '字段' },
      title: '清单',
      subtitle: '以代码形式应用配置。试运行只做验证，不写入数据。',
      applyTab: '应用',
      exportTab: '导出',
      historyTab: '历史',
      upload: '上传文件',
      loadSample: '加载示例',
      document: '清单（YAML 或 JSON，支持多个文档）',
      dryRun: '试运行',
      apply: '应用',
      validated: '验证完成。',
      applied: '清单已应用。',
      results: '结果',
      dryRunResults: '试运行结果',
      kind: '类别',
      name: '名称',
      result: '结果',
      message: '消息',
      confirmTitle: '应用清单',
      confirmMessage: '将此清单中的所有文档应用到当前租户？',
      exportHelp: '导出此租户的配置。机密的值永远不会被导出。',
      export: '导出',
      download: '下载',
      counts: '创建 {{created}}，更新 {{updated}}，未更改 {{unchanged}}，失败 {{failed}}'
    },
    requests: {
      grafana: 'Grafana 中的 HTTP 仪表板',
      title: '请求历史',
      subtitle: '已捕获的 API 流量。可深入查看任意请求并管理保留策略。',
      kpis: { total: '保留的请求', success: '成功', failure: '失败', avgDuration: '平均耗时' },
      columns: { time: '时间', method: '方法', path: '路径', status: '状态', duration: '耗时', principal: '主体' },
      bulkDeleteTitle: '删除请求历史',
      bulkDeleteMessage: '删除符合当前筛选条件的全部 {{count}} 个请求？',
      bulkDeleteAll: '删除所有匹配项',
      deleteOneTitle: '删除请求',
      deleteOneMessage: '删除请求 {{id}}？',
      deleted: '已删除。',
      emptyTitle: '暂无请求历史',
      emptyBodyNoTraffic: '尚未保留任何 API 流量。',
      emptyBodyNoMatch: '没有符合当前筛选条件的请求。'
    },
    explorer: {
      title: 'API 浏览器',
      subtitle: '基于此服务器的 OpenAPI 文档，对其实时执行调用。',
      operations: '操作',
      selectOperation: '选择一个操作来构建请求。',
      selectOperationOption: '选择操作...',
      pathParams: '路径参数',
      queryParams: '查询参数',
      headers: '请求头',
      addHeader: '添加请求头',
      headerName: '请求头名称',
      headerValue: '请求头 {{name}} 的值',
      removeHeader: '移除请求头 {{name}}',
      body: '请求正文',
      resolvedUrl: '解析后的 URL',
      copyUrl: '复制 URL',
      execute: '执行',
      executing: '正在执行...',
      stop: '停止',
      streaming: '流式传输',
      response: '响应',
      responseHeaders: '响应头',
      responseBody: '响应正文',
      snippets: '代码片段',
      history: '最近的请求',
      historyEmpty: '没有最近的请求。',
      loadHistory: '加载',
      deleteHistory: '删除',
      clearHistory: '清除历史',
      required: '必填',
      confirmTitle: '执行破坏性操作',
      confirmMessage: '此 {{method}} 请求可能会修改或删除数据。是否继续？',
      noSpecTitle: 'OpenAPI 文档不可用',
      noSpecBody: '此服务器未返回可用的 /openapi.json 文档，因此浏览器无法列出操作。'
    },
    settings: {
      errors: { allowed: '请选择以下值之一：{{values}}。', boolean: '请选择 true 或 false。', max: '请输入不大于 {{max}} 的值。', min: '请输入不小于 {{min}} 的值。', range: '请输入 {{min}} 到 {{max}} 之间的值。', integer: '请输入整数。', number: '请输入数字。' },
      notSaved: '未保存任何内容。请修正标出的设置，然后重新保存。',
      title: '设置',
      subtitle: '来自设置文件的服务器设置，以及存储在数据库中的集群设置。',
      readOnly: '你正在以只读方式查看设置。只有系统管理员可以更改设置。',
      restartBanner: '部分已保存的更改需要重启后才能生效。',
      restarting: '服务器正在重启。此页面会自动重新连接。',
      restarted: '服务器已恢复在线。',
      restartTimeout: '服务器在三分钟内未恢复。请检查 Pod 状态。',
      restart: '重启服务器',
      restartConfirmTitle: '重启服务器',
      restartConfirmMessage: '立即重启此控制平面节点？进行中的请求会被排空，控制台将重新连接。',
      savedLive: '设置已保存并生效。',
      savedRestart: '设置已保存。请重启服务器以应用所有更改。',
      live: '即时生效',
      restartRequired: '需要重启',
      secretSet: '已设置（输入新值可替换）',
      secretNotSet: '未设置',
      invalidNumber: '请输入数字。',
      range: '允许范围 {{min}} 至 {{max}}',
      testDatabase: '测试数据库连接',
      testing: '正在测试...',
      dbOk: '连接成功',
      dbFailed: '连接失败',
      unavailableTitle: '设置不可用',
      unavailableBody: '此服务器未返回其设置。',
      sources: { File: '设置文件', Environment: '环境变量', ConfigMap: 'ConfigMap', Database: '集群' },
      lockedBy: {
        Environment: '由环境变量设置，以环境变量的值为准。',
        ConfigMap: '由 Kubernetes ConfigMap 管理。请在你的清单中修改。',
        other: '此设置无法在此处编辑。'
      },
      groups: { Codex: 'Codex', Archive: '归档', General: '常规', Rest: 'REST', Mcp: 'MCP', Database: '数据库', Logging: '日志', Auth: '身份验证', Security: '安全', RequestHistory: '请求历史', Telemetry: '遥测', Cluster: '集群', Scheduling: '调度', Runs: '运行', Audit: '审计', Runtime: '运行时', Observability: '可观测性' },
      fields: {
        Observability: {
          GrafanaUrl: 'Grafana URL',
          PrometheusUrl: 'Prometheus URL',
          LokiUrl: 'Loki URL',
          TempoUrl: 'Tempo URL',
          GrafanaInternalUrl: 'Grafana 内部 URL',
          PrometheusInternalUrl: 'Prometheus 内部 URL',
          LokiInternalUrl: 'Loki 内部 URL',
          TempoInternalUrl: 'Tempo 内部 URL'
        },
        Rest: {
          ExternalBaseUrl: '外部 REST URL',
          PublicBaseUrl: '供运行使用的内部 REST URL',
          Ssl: 'REST TLS 加密',
          Port: 'REST 端口',
          Hostname: 'REST 绑定主机名'
        },
        Mcp: {
          InternalPort: '内部 MCP 端口',
          SessionIdleTimeoutSeconds: 'MCP 会话空闲超时（秒）',
          MaxToolWaitSeconds: 'MCP 工具最长等待时间（秒）',
          PublicUrl: '供运行使用的内部 MCP URL',
          Path: 'MCP 路径',
          Port: 'MCP 端口',
          Hostname: 'MCP 绑定主机名',
          Enable: '启用 MCP 服务器'
        },
        Database: {
          MinPoolSize: '连接池最小连接数',
          ConnectionTimeoutSeconds: '等待连接超时（秒）',
          CommandTimeoutSeconds: '命令超时（秒）',
          ConnectionIdleLifetimeSeconds: '空闲连接保留时间（秒）',
          MaxPoolSize: '连接池大小',
          Schema: '数据库架构',
          Password: '数据库密码',
          Username: '数据库用户',
          DatabaseName: '数据库名称',
          Port: '数据库端口',
          Host: '数据库主机',
          Filename: 'Sqlite 文件',
          Type: '数据库类型'
        },
        Logging: {
          MinimumSeverity: '最低日志级别',
          LogFilename: '日志文件名',
          LogDirectory: '日志目录',
          FileLogging: '输出日志到文件',
          ConsoleLogging: '输出日志到控制台'
        },
        Auth: {
          RateLimitPerMinute: '每分钟登录尝试次数',
          PasswordHashIterations: '密码哈希迭代次数',
          SignedRequestSkewSeconds: '签名请求允许的时钟偏差（秒）',
          AdminApiKey: '管理员 API 密钥',
          TokenLifetimeMinutes: '会话有效期（分钟）',
          SigningKey: '令牌签名密钥',
          Issuer: '令牌签发者'
        },
        Security: {
          NodeSecretKey: '工作节点私密密钥',
          NodeAccessKey: '工作节点访问密钥',
          DefaultSecretKey: '默认私密密钥',
          DefaultAccessKey: '默认访问密钥',
          AdminPassword: '初始管理员密码',
          AdminEmail: '初始管理员邮箱',
          MasterKey: '机密加密主密钥'
        },
        RequestHistory: {
          CaptureNodeProtocol: '记录成功的工作节点协议请求',
          MaxResponseBodyBytes: '记录的响应正文上限（字节）',
          MaxRequestBodyBytes: '记录的请求正文上限（字节）',
          RetentionDays: '请求历史保留天数',
          Enabled: '记录请求历史'
        },
        Telemetry: {
          OtlpEndpoint: 'OTLP 端点',
          OtlpEnable: '启用 OTLP 导出',
          PrometheusPort: 'Prometheus 端口',
          PrometheusEnable: '启用 Prometheus 端点',
          ServiceName: '遥测服务名称',
          Enabled: '启用遥测'
        },
        Archive: {
          Directory: '归档目录'
        },
        Cluster: {
          Backplane: '事件背板',
          BackplanePollMs: '背板轮询间隔（毫秒）',
          ExpectedReplicas: '控制平面预期副本数'
        },
        Scheduling: {
          EventPollMs: '事件轮询间隔（毫秒）',
          InvocationWaitPollMs: '调用等待备用重读间隔（毫秒）',
          NodeHeartbeatTimeoutMs: '节点心跳超时（毫秒）',
          LeaseWaitMs: '租约长轮询等待时间（毫秒）',
          LeaseDurationMs: '运行租约时长（毫秒）',
          PauseGraceMs: '主机暂停后的宽限时间（毫秒）'
        },
        Runs: {
          EventRetentionDays: '运行事件保留天数',
          RetentionDays: '运行保留天数',
          MaxDelegationDepth: '最大委派深度',
          DelegationChildQueueDepth: '等待中运行的子运行最大排队数',
          DelegationRetryAfterSeconds: '委派容量耗尽时的重试提示（秒）',
          DefaultTimeoutSeconds: '默认运行超时（秒）'
        },
        Codex: {
          RefreshBeforeExpirySeconds: '在过期前刷新 Codex 登录（秒）',
          RefreshCheckIntervalSeconds: '后台检查间隔（秒）',
          RefreshTimeoutSeconds: '登录刷新超时（秒）',
          TokenEndpoint: 'OAuth 令牌端点',
          ClientId: 'OAuth 客户端 ID'
        },
        Runtime: {
          FailBlockedAfterSeconds: '受阻运行在多少秒后失败',
          MaxRunSeconds: '最长运行时间（秒）',
          RepetitionGuard: '默认启用重复防护',
          MaxAssistantChars: '默认最大助手字符数',
          NoProgressSeconds: '默认无进展超时（秒）',
          ConversationAffinityWaitMs: '对话亲和等待时间（毫秒）',
          ConversationTranscriptTurns: '回退记录的轮数',
          ConversationTranscriptChars: '回退记录中每条消息的字符数'
        },
        Audit: {
          RetentionDays: '审计保留天数'
        }
      }
    },
    analytics: {
      grafana: 'Grafana 中的运行仪表板',
      deletedAgent: '已删除的智能体（{{id}}）',
      deletedDeployment: '已删除的部署（{{id}}）',
      title: '分析',
      subtitle: '你的运行随时间变化的速度、成本和可靠性。',
      loading: '正在加载分析数据...',
      filters: { ttft: '首 Token 时间不含委派等待', range: '范围', from: '开始', to: '结束', agentId: '智能体', harnessType: 'Harness', deploymentId: '部署', model: '模型', groupBy: '分组方式' },
      allAgents: '所有智能体',
      allHarnesses: '所有 Harness',
      allDeployments: '所有部署',
      allModels: '所有模型',
      unknownModel: '未知模型',
      groupBy: { none: '不分组', agent: '智能体', harness: 'Harness', model: '模型', harnessModel: 'Harness 和模型' },
      export: { window: '时间范围：{{from}} 至 {{to}}' },
      usage: { title: '按 Harness 和模型统计的用量', help: '范围内每种 Harness 与模型组合的 Token 和成本随时间的变化，并附明细表。' },
      breakdown: {
        title: 'Harness 与模型明细',
        columns: { harness: 'Harness', model: '模型', runs: '运行', inputTokens: '输入 Token', outputTokens: '输出 Token', cachedTokens: '缓存 Token', reasoningTokens: '推理 Token', costUsd: '成本', timeToFirstTokenMsAvg: '平均首 Token 时间' }
      },
      rangeError: {
        incomplete: '请为自定义范围同时选择开始时间和结束时间。',
        reversed: '自定义范围的开始时间必须早于结束时间。'
      },
      truncated: '此范围内的运行数超过了服务器单次请求可聚合的数量，因此数据只覆盖其中一部分。如需精确数据，请缩小范围或添加筛选条件。',
      unavailableTitle: '此服务器暂不支持分析功能',
      unavailableBody: '此服务器未提供运行分析端点。请升级服务器以在此处查看图表。',
      emptyTitle: '此范围内没有运行',
      emptyBody: '没有符合范围和筛选条件的数据。请扩大范围、清除筛选条件，或调用智能体。',
      noDataInChart: '所选范围内此图表没有数据。',
      cards: {
        delegationWait: '平均委派等待时间',
        ttftExcludingDelegation: '平均首 Token 时间（不含委派）',
        runs: '运行',
        runsNote: '成功 {{succeeded}}，失败 {{failed}}',
        successRate: '成功率',
        ttft: '平均首 Token 时间',
        execution: '平均执行时间',
        queue: '平均排队时间',
        tokens: 'Token',
        tokensNote: '输入 {{input}}，输出 {{output}}',
        throughput: '平均输出速度',
        cost: '成本',
        toolCalls: '工具调用',
        p95: 'p95 {{value}}'
      },
      charts: {
        outcomes: { title: '运行结果', help: '每个时间段内按结束方式统计的运行数。' },
        ttft: { helpExcluding: '从 Harness 启动到模型首次输出的时间，不含等待委派运行的时间。', title: '首 Token 时间', help: '从 Harness 启动到模型首次输出的时间，包含 CLI 启动时间。' },
        duration: { title: '流式输出与执行时间', help: '流式输出时间是从模型首次输出到最后一次输出；执行时间是从进程启动到退出。' },
        queue: { title: '排队时间', help: '从进入队列到被工作节点租用的时间。' },
        tokens: { title: 'Token', help: '每个时间段内的输入、输出、缓存和推理 Token。' },
        throughput: { title: '每秒输出 Token 数', help: '输出 Token 数除以流式输出时间，按时间段取平均值。' },
        cost: { title: '成本', help: '每个时间段内上报的成本（美元）。' },
        toolCalls: { title: '工具调用', help: '每个时间段内的工具调用事件数。' },
        usageTokens: { title: '按 Harness 和模型统计的 Token', help: '每个时间段内的输入加输出 Token，按 Harness 和模型堆叠显示。' },
        usageCost: { title: '按 Harness 和模型统计的成本', help: '每个时间段内上报的成本，按 Harness 和模型堆叠显示。' }
      },
      groupedTitle: '{{chart}}：{{metric}}',
      metrics: {
        delegationWaitMsAvg: '委派等待时间（平均）',
        timeToFirstTokenExcludingDelegationMsP95: '不含委派（p95）',
        timeToFirstTokenExcludingDelegationMsP50: '不含委派（p50）',
        timeToFirstTokenExcludingDelegationMsAvg: '不含委派（平均）',
        runs: '运行',
        succeeded: '成功',
        failed: '失败',
        cancelled: '已取消',
        timedOut: '已超时',
        inputTokens: '输入',
        outputTokens: '输出',
        cachedTokens: '缓存',
        reasoningTokens: '推理',
        totalTokens: '输入加输出 Token',
        costUsd: '成本',
        toolCalls: '工具调用',
        timeToFirstTokenMsAvg: '平均值',
        timeToFirstTokenMsP50: '中位数（p50）',
        timeToFirstTokenMsP95: 'p95',
        streamingMsAvg: '流式输出（平均）',
        executionMsAvg: '执行（平均）',
        executionMsP95: '执行（p95）',
        queueMsAvg: '平均排队时间',
        outputTokensPerSecondAvg: '平均每秒 Token 数'
      },
      other: '其他',
      hiddenGroups_one: '另有 {{count}} 个较不活跃的分组未显示。',
      hiddenGroups_other: '另有 {{count}} 个较不活跃的分组未显示。',
      legend: '{{chart}}中的数据系列',
      dataTable: '数据表',
      bucketStart: '时间段开始'
    },
    serverInfo: {
      serverInUse: '当前使用的服务器',
      title: '服务器信息',
      subtitle: '端点、版本以及你当前登录所用的身份。',
      endpoints: '端点',
      rest: 'REST API',
      mcp: 'MCP',
      a2a: 'A2A',
      openapi: 'OpenAPI',
      server: '服务器',
      version: '服务器版本',
      dashboardVersion: '控制台版本',
      node: '控制节点',
      database: '数据库',
      health: '健康状况',
      replicas: '预期副本数',
      routes: '已注册的操作',
      serverTime: '服务器时间',
      principal: '登录身份',
      principalName: '主体',
      principalType: '主体类型',
      role: '角色',
      tenant: '租户',
      expires: '会话过期时间',
      features: '功能开关'
    },
    runGuard: {
      titles: {
        RepetitionDetected: '已停止：模型在不断重复',
        NoProgress: '已停止：运行不再有进展',
        OutputLimitExceeded: '已停止：回答达到了大小上限'
      },
      bodies: {
        RepetitionDetected: '重复防护发现同一段短文本被反复写出（或只有空白和标点），因此 Garrison 停止了运行，而不是让它一直运行到截止时间。',
        NoProgress: '超过无进展超时时间仍没有文本、思考或工具活动，因此 Garrison 停止了运行。',
        OutputLimitExceeded: '回答超过了每次运行允许的最大助手字符数，因此 Garrison 停止了运行。'
      },
      detected: '检测到的情况：{{reason}}',
      partialKept: '停止前写出的输出（{{chars}} 个字符）已保留为运行结果。',
      noPartial: '运行在停止前没有写出任何输出。',
      tune: '要更改触发条件，请编辑部署 {{deployment}}：其“调度放置和限制”步骤中有重复防护、最大助手字符数和无进展超时。留空时，它们遵循设置（运行时）中的集群默认值。',
      tuneAny: '要更改触发条件，请编辑部署：其“调度放置和限制”步骤中有重复防护、最大助手字符数和无进展超时。留空时，它们遵循设置（运行时）中的集群默认值。',
      openDeployments: '打开部署',
      openSettings: '打开设置'
    },
    conversationDetail: {
      title: '对话',
      notFoundTitle: '未找到对话',
      notFoundBody: '它可能已被删除，或属于另一个租户。它的各轮仍保留在“运行”页面。',
      deployment: '部署',
      activeRun: '未完成的一轮',
      turns: '各轮',
      turnsCount: '各轮 ({{count}})',
      noTurns: '该对话还没有任何一轮。',
      pending: '等待结果',
      columns: {
        turn: '轮次',
        run: '运行',
        status: '状态',
        outcome: '结果',
        session: '会话',
        input: '输入',
        result: '回答',
        node: '节点',
        created: '创建时间'
      },
      session: {
        first: '新会话',
        resumed: '已恢复',
        fallback: '全新会话',
        pending: '尚未分配'
      },
      continueTitle: '继续对话',
      message: '下一条消息',
      messagePlaceholder: '提出后续问题或给出下一条指令...',
      busyNotice: '上一轮仍在处理中。完成后即可发送下一条消息。',
      send: '发送这一轮',
      turnStarted: '第 {{turn}} 轮已开始。',
      openInvoke: '在“调用”中继续',
      confirmDelete: '删除对话“{{title}}”？它的各轮会作为普通运行保留在“运行”页面，但不能再有新的一轮继续它。'
    }
  },
  wizard: {
    title: '设置 Garrison',
    stepOf: '第 {{step}} 步，共 {{total}} 步',
    steps: { welcome: '欢迎', secret: '凭据', manifest: '示例智能体', invoke: '测试运行' },
    welcomeBody: '此租户中还没有智能体。只需几步，你就可以：',
    welcomeItem1: '存储 Harness 凭据，例如 Anthropic 或 OpenAI API 密钥（可选）。',
    welcomeItem2: '应用一个使用内置模拟 Harness 的示例智能体，无需凭据即可运行。',
    welcomeItem3: '运行它并查看对话记录。',
    start: '开始',
    skip: '跳过设置',
    skipStep: '跳过此步',
    secretBody: '添加真实智能体需要的凭据。你可以跳过此步，稍后再添加机密。',
    saveSecret: '保存并继续',
    secretSaved: '机密已保存。',
    manifestBody: '此清单会创建一个 echo 智能体，以及一个使用模拟 Harness 的部署。',
    invokeBody: '向 echo 智能体发送消息。运行执行时你将被带到该运行页面。',
    invoke: '运行',
    noAgent: '未找到示例智能体。请先应用清单。'
  },
  tour: {
    title: '引导教程',
    skip: '跳过教程',
    done: '完成',
    steps: {
      sidebar: { title: '导航', body: '页面按中心分组。每个中心在页面顶部有一组标签页，每个标签页都有自己的链接。' },
      topbar: { title: '上下文', body: '服务器、租户、你的身份、健康状况和实时状态始终显示在这里。' },
      kpis: { title: '概览', body: '每张卡片汇总一种资源。点击卡片即可打开经过筛选的列表。' },
      invoke: { title: '调用', body: '以交互方式试用任意智能体，并实时查看其对话记录。' },
      configure: { title: '配置', body: 'Harness 配置文件、提示词模板、MCP 服务器和机密精确控制运行的内容。智能体和部署有自己的中心。' },
      observe: { title: '监控', body: '请求历史、审计和 API 浏览器可帮助你验证和调试。' }
    }
  },
  tips,
  explainers
};


// Executor capability negotiation (P11.18).
Object.assign(zhHans.resources.deployments.fields, {"capIsolation": "最低隔离级别", "capColdStartClass": "启动类别", "capEgressControl": "要求出站流量控制", "capFilesystemSnapshot": "要求文件系统快照", "capSessionContinuation": "要求会话继续", "capCrossNodeRestore": "要求跨节点恢复"});
Object.assign(zhHans.tips.resources.deployments, {"capIsolation": "运行会等待具备这些能力的工作节点。容器隔离请选择 KubernetesJob。要求不可用的能力会使运行保持排队。", "capColdStartClass": "运行会等待具备这些能力的工作节点。容器隔离请选择 KubernetesJob。要求不可用的能力会使运行保持排队。", "capEgressControl": "运行会等待具备这些能力的工作节点。容器隔离请选择 KubernetesJob。要求不可用的能力会使运行保持排队。", "capFilesystemSnapshot": "运行会等待具备这些能力的工作节点。容器隔离请选择 KubernetesJob。要求不可用的能力会使运行保持排队。", "capSessionContinuation": "运行会等待具备这些能力的工作节点。容器隔离请选择 KubernetesJob。要求不可用的能力会使运行保持排队。", "capCrossNodeRestore": "运行会等待具备这些能力的工作节点。容器隔离请选择 KubernetesJob。要求不可用的能力会使运行保持排队。"});
zhHans.resources.deployments.hints.capabilities = "运行会等待具备这些能力的工作节点。容器隔离请选择 KubernetesJob。要求不可用的能力会使运行保持排队。";
zhHans.resources.nodes.columns.executorCapabilities = "执行器能力";
zhHans.tips.resources.nodes.executorCapabilities = "运行会等待具备这些能力的工作节点。容器隔离请选择 KubernetesJob。要求不可用的能力会使运行保持排队。";
zhHans.enums.executorIsolation = {"Process": "进程", "Container": "容器", "SandboxedRuntime": "沙箱运行环境"};
zhHans.enums.executorColdStart = {"Immediate": "即时", "Cold": "冷启动", "Warm": "预热"};
// Artifact collection and browsing (P12.8).
zhHans.nav.items.artifacts = { label: "产物", tip: "从运行收集的文件。" };
zhHans.resources.artifacts = { ...zhHans.resources.artifactStores, title: "产物", subtitle: "从运行收集的文件。", view: "产物", deleteTitle: "产物", emptyTitle: "产物", emptyBody: "配置存储和明确的部署匹配模式来收集文件。", columns: {"name": "名称", "runId": "运行", "artifactStoreId": "存储", "mediaType": "媒体类型", "sizeBytes": "字节", "sha256": "SHA-256 哈希", "createdUtc": "创建时间", "id": "ID", "leaseEpoch": "租约世代", "repairAttempt": "修复次数"}, fields: {"name": "名称", "runId": "运行", "artifactStoreId": "存储", "mediaType": "媒体类型", "sizeBytes": "字节", "sha256": "SHA-256 哈希", "createdUtc": "创建时间", "id": "ID", "leaseEpoch": "租约世代", "repairAttempt": "修复次数"}, actions: { download: "下载" } };
zhHans.tips.resources.artifacts = { ...{"name": "从运行收集的文件。 名称", "runId": "从运行收集的文件。 运行", "artifactStoreId": "从运行收集的文件。 存储", "mediaType": "从运行收集的文件。 媒体类型", "sizeBytes": "从运行收集的文件。 字节", "sha256": "从运行收集的文件。 SHA-256", "createdUtc": "从运行收集的文件。 创建时间", "id": "从运行收集的文件。 ID", "leaseEpoch": "从运行收集的文件。 租约世代", "repairAttempt": "从运行收集的文件。 修复次数"}, actions: { download: "通过临时链接下载此文件。" }, filters: { runId: "运行", storeId: "存储" } };
Object.assign(zhHans.resources.artifactStores.fields, {"pathPrefix": "路径前缀", "bucket": "存储桶", "endpoint": "端点", "region": "区域", "secretId": "凭据", "forcePathStyle": "路径式请求"});
Object.assign(zhHans.tips.resources.artifactStores, {"pathPrefix": "S3 端点可选，留空使用 AWS。将包含 accessKey、secretKey 和可选 sessionToken 的 JSON 保存为 GenericEnv 密钥。未指定凭据时使用服务器凭据链。", "bucket": "S3 端点可选，留空使用 AWS。将包含 accessKey、secretKey 和可选 sessionToken 的 JSON 保存为 GenericEnv 密钥。未指定凭据时使用服务器凭据链。", "endpoint": "S3 端点可选，留空使用 AWS。将包含 accessKey、secretKey 和可选 sessionToken 的 JSON 保存为 GenericEnv 密钥。未指定凭据时使用服务器凭据链。", "region": "S3 端点可选，留空使用 AWS。将包含 accessKey、secretKey 和可选 sessionToken 的 JSON 保存为 GenericEnv 密钥。未指定凭据时使用服务器凭据链。", "secretId": "S3 端点可选，留空使用 AWS。将包含 accessKey、secretKey 和可选 sessionToken 的 JSON 保存为 GenericEnv 密钥。未指定凭据时使用服务器凭据链。", "forcePathStyle": "S3 端点可选，留空使用 AWS。将包含 accessKey、secretKey 和可选 sessionToken 的 JSON 保存为 GenericEnv 密钥。未指定凭据时使用服务器凭据链。"});
zhHans.resources.deployments.fields.artifactGlobs = "收集匹配模式";
zhHans.tips.resources.deployments.artifactGlobs = "仅收集匹配的工作区相对文件，例如 reports/**/*.json。留空则禁用收集。";
zhHans.resources.deployments.hints.artifactGlobs = "仅收集匹配的工作区相对文件，例如 reports/**/*.json。留空则禁用收集。";
Object.assign(zhHans.common.eventCodes, { ArtifactCollectionWarning: "产物收集警告", ArtifactsCollected: "已收集产物" });
zhHans.tips.nav.tabs.artifacts = zhHans.nav.items.artifacts.tip + " " + zhHans.tips.resources.artifacts.actions.download;
Object.assign(zhHans.components.mcpTest, {"worker": "工作节点", "chooseWorker": "选择就绪的工作节点。配置的命令将在该节点列出工具，不会调用工具。", "runTest": "运行测试"});
export default zhHans;

zhHans.views.settings.groups.Leases = "协调租约";
zhHans.views.settings.fields.Leases = {"Provider": "提供方", "ClutchEndpoint": "Clutch 端点", "ClutchAccessKey": "Clutch 访问密钥", "KeyPrefix": "键前缀", "RequestTimeoutMs": "请求超时 (ms)", "SweepIntervalMs": "检查间隔 (ms)", "MaxLeaseMs": "最长租约 (ms)", "MaxHoldMs": "最长持有时间 (ms)"};

zhHans.enums.harnessType.ProviderApi = "提供方 API";
zhHans.enums.outputParser.ProviderApiJsonl = "提供方 API JSONL";
zhHans.enums.harnessType.OpenCode = "opencode";
zhHans.enums.harnessType.Pi = "pi";
zhHans.enums.outputParser.OpenCodeJsonl = "opencode JSONL";
zhHans.enums.outputParser.PiJsonl = "pi JSONL";
zhHans.enums.mcpConfigFormat.OpenCodeJson = "opencode JSON";
zhHans.enums.mcpConfigFormat.PiJson = "pi JSON";

// Pipelines (P12.9): definitions (Agents > Pipelines), pipeline runs (Runs > Pipeline runs), and stage reviews
// (Approvals > Stage reviews).
zhHans.nav.hubs.approvals.tip = '等待人员处理的工具调用和流水线阶段，以及每项决定';
Object.assign(zhHans.nav, { approvalsPending_one: '{{count}} 项等待人员处理', approvalsPending_other: '{{count}} 项等待人员处理' });
Object.assign(zhHans.nav.items, {
  pipelines: { label: '流水线', tip: '按顺序执行的智能体阶段，可选审核关卡' },
  pipelineRuns: { label: '流水线运行', tip: '流水线的每次执行，逐阶段展示' },
  pipelineReviews: { label: '阶段审核', tip: '等待人员审核的流水线阶段' }
});
Object.assign(zhHans.errorCodes, {
  RevisionLimitReached: '此阶段已用完所有修订次数，无法再请求修改。请批准或驳回。',
  ReviewNotPending: '此审核已被其他人或因超时作出决定，无法再次决定。',
  PipelineInUse: '此流水线还有未完成的流水线运行。请等待其完成或将其取消，然后再删除流水线。',
  PipelineRunActive: '只能删除已完成的流水线运行。请先取消此流水线运行。',
  PipelineRunFinished: '此流水线运行已经完成，无法取消。',
  PipelineRunNotRetryable: '只能重试失败、超时或已取消的流水线运行。',
  PipelineRunChanged: '处理请求期间此流水线运行发生了变化。请重新加载后重试。',
  PipelineInactive: '此流水线未启用。请先启用再启动。',
  PipelineEmpty: '流水线至少需要一个阶段。',
  PipelineStageRun: '此运行是某个流水线运行的阶段，不能单独重试。请改为重试流水线运行。',
  ReferencedByPipeline: '有流水线阶段使用此智能体。请先从所有流水线中移除该智能体，再将其删除。'
});
zhHans.enums.pipelineRunStatus = { Running: '运行中', AwaitingReview: '等待审核', Cancelling: '取消中', Succeeded: '成功', Failed: '失败', Cancelled: '已取消', TimedOut: '已超时' };
zhHans.enums.pipelineRunOutcome = { None: '无', Succeeded: '成功', StageFailed: '阶段失败', StageStartFailed: '阶段无法启动', ReviewRejected: '审核被驳回', ReviewExpired: '审核已过期', Cancelled: '已取消', TimedOut: '已超时', InternalError: '内部错误' };
zhHans.enums.pipelineStageStatus = { Pending: '待处理', Running: '运行中', AwaitingReview: '等待审核', Succeeded: '成功', Failed: '失败', Cancelled: '已取消' };
zhHans.enums.pipelineReviewStatus = { Pending: '待处理', Approved: '已批准', ChangesRequested: '已请求修改', Rejected: '已驳回', Expired: '已过期', Cancelled: '已取消' };
zhHans.enums.pipelineReviewDecision = { Approve: '批准', RequestChanges: '请求修改', Reject: '驳回' };
zhHans.enums.pipelineReviewSource = { User: '人员', Timeout: '超时', Cancelled: '流水线运行已停止' };
Object.assign(zhHans.enums.resourceType, { Pipeline: '流水线', PipelineRun: '流水线运行' });
Object.assign(zhHans.enums.auditEventType, { PipelineReviewDecided: '阶段审核已决定', PipelineRunCancelled: '流水线运行已取消' });
zhHans.resources.deployments.promptRoles.PipelineStage = '流水线阶段（交接）';
Object.assign(zhHans.resources.runs.columns, { pipelineRunId: '流水线运行' });
zhHans.resources.runs.pipelineStage = '第 {{position}} 阶段，第 {{execution}} 次执行';
zhHans.resources.pipelines = {
  ...rp('流水线', '按顺序执行的智能体阶段：每个阶段运行一个智能体，并将输出交给下一个阶段，可选审核关卡。', '添加流水线', '创建流水线', '编辑流水线', '流水线详情', '删除流水线', '暂无流水线', '创建流水线来串联智能体：每个阶段都会收到上一阶段的输出。'),
  columns: { name: '名称', stages: '阶段', reviewGates: '审核关卡', maxDurationSeconds: '时间限制', version: '版本', active: '启用', description: '描述', id: 'ID', lastUpdateUtc: '更新时间', createdUtc: '创建时间' },
  fields: {
    name: '名称',
    description: '描述',
    maxDurationSeconds: '时间限制（秒）',
    active: '启用',
    stages: '阶段',
    stageName: '阶段名称',
    agentId: '智能体',
    deploymentId: '部署',
    handoffTemplateId: '交接模板',
    handoffTemplateVersion: '固定模板版本',
    outputCharLimit: '交接字符上限',
    maxAttempts: '最大尝试次数',
    continueOnFailure: '失败时继续',
    requiresReview: '需要审核',
    reviewTimeoutSeconds: '审核超时（秒）',
    reviewTimeoutAction: '审核超时后',
    maxRevisions: '最大修订次数',
    stageDescription: '阶段描述',
    parameters: '运行参数'
  },
  hints: {
    maxDurationSeconds: '范围 {{min}} 到 {{max}}。0 表示不限制。该限制涵盖整个流水线运行，包括等待审核的时间。',
    stages: '阶段按此顺序运行。每个阶段在上一阶段成功（或在开启“失败时继续”时失败）后启动；如需审核，则在人员批准后启动。',
    noDeployments: '此智能体还没有部署。可将部署留空，或在“部署”中添加。',
    handoffTemplateVersion: '留空则使用模板的当前版本。',
    outputCharLimit: '范围 {{min}} 到 {{max}}。默认 {{default}}。',
    maxAttempts: '范围 {{min}} 到 {{max}}。默认 {{default}}。',
    reviewTimeoutSeconds: '范围 {{min}} 到 {{max}}。0 表示无限期等待。',
    maxRevisions: '范围 {{min}} 到 {{max}}。默认 {{default}}。',
    parameters: '仅在指定部署时可用，且仅限该部署允许调用方覆盖的参数。'
  },
  errors: {
    dnsName: '请使用 1 到 64 个小写字母、数字和连字符，且以字母或数字开头和结尾。',
    range: '请输入 {{min}} 到 {{max}} 之间的整数。',
    noStages: '请至少添加一个阶段。',
    tooManyStages: '流水线最多有 {{max}} 个阶段。',
    stageNameLong: '阶段名称最多 128 个字符。',
    stageNameDuplicate: '已有另一个阶段名为 {{name}}。',
    version: '请输入大于等于 1 的版本号，或留空。',
    parametersNeedDeployment: '运行参数需要指定部署，因为它们会按该部署允许的覆盖项进行检查。',
    parametersUnique: '每个参数名只能出现一次。',
    stageInvalid: '此阶段存在错误。'
  },
  actions: { start: '启动', preview: '预览提示词', runs: '查看流水线运行' },
  stageHeading: '第 {{position}} 阶段：{{name}}',
  stageCount: '{{count}} 个，最多 {{max}} 个',
  stageSummary: '{{count}} 个阶段：{{chain}}',
  addStage: '添加阶段',
  removeStage: '移除阶段',
  noStages: '暂无阶段。',
  chooseAgent: '选择智能体',
  anyDeployment: '任一活动部署（按权重）',
  defaultHandoff: '部署绑定或内置模板',
  parameterName: '参数',
  parameterValue: '值',
  noLimit: '不限制',
  versionNotice: '版本 {{version}}。保存会创建新版本；已启动的流水线运行会保留启动时的阶段。'
};
zhHans.resources.pipelineRuns = {
  ...rp('流水线运行', '流水线的每次执行。打开一项可跟踪其阶段、决定审核，或取消并重试。', '添加流水线运行', '创建流水线运行', '编辑流水线运行', '流水线运行详情', '删除流水线运行', '暂无流水线运行', '从“智能体 > 流水线”启动流水线后，其运行会显示在这里。'),
  columns: { id: 'ID', pipelineName: '流水线', status: '状态', outcome: '结果', progress: '阶段', callerName: '启动者', errorMessage: '错误', priority: '优先级', deadlineUtc: '截止时间', completedUtc: '完成时间', createdUtc: '创建时间' },
  actions: { cancel: '取消', retry: '重试', stageRuns: '查看阶段运行', finalRun: '打开最终运行' },
  toasts: { cancelRequested: '已请求取消该流水线运行及其当前阶段。', retried: '流水线运行将从停止的阶段继续。' },
  progressValue: '{{position}} / {{count}}',
  versionShort: '（版本 {{version}}）'
};
zhHans.resources.pipelineReviews = {
  ...rp('阶段审核', '等待人员批准、请求修改或驳回的流水线阶段。', '添加阶段审核', '创建阶段审核', '编辑阶段审核', '阶段审核详情', '删除阶段审核', '暂无阶段审核', '需要审核的阶段完成后会显示在这里。'),
  columns: { createdUtc: '请求时间', pipelineName: '流水线', stageName: '阶段', status: '状态', decision: '决定', decisionSource: '决定方', comment: '备注', decidedBy: '审核人', expiresUtc: '超时时间', pipelineRunId: '流水线运行', runId: '阶段运行', decidedUtc: '决定时间', id: 'ID' },
  filters: { pipelineRunId: '流水线运行 ID', pipelineRunIdPlaceholder: '流水线运行 ID（plr_...）' },
  actions: { approve: '批准', requestChanges: '请求修改', reject: '驳回', openStageRun: '打开阶段运行' },
  noTimeout: '无限期等待'
};
zhHans.components.pipelineReviews = {
  decideTitle: '审核 {{pipeline}} 的阶段 {{stage}}',
  decision: '决定',
  positionExecution: '第 {{position}} 阶段，第 {{execution}} 次执行',
  revisionsLeft: '剩余修订次数',
  revisionsLeftValue: '{{left}} / {{max}}',
  noRevisionsLeft: '此阶段已用完全部 {{max}} 次修订。服务器将拒绝“请求修改”；请批准或驳回。',
  timeoutThen: '然后{{decision}}',
  commentApprove: '给下一阶段的说明',
  commentApprovePlaceholder: '可选。下一阶段会随输出一起收到这些说明。',
  commentRequestChanges: '需要修改的内容',
  commentRequestChangesPlaceholder: '必填。该阶段将根据此反馈重新运行。',
  commentReject: '原因',
  commentRejectPlaceholder: '可选。随决定一起记录；流水线运行将失败。',
  commentRequired: '请说明需要修改的内容。该阶段将根据此反馈重新运行。',
  commentTooLong: '备注最多 {{max}} 个字符。',
  submit: { Approve: '批准阶段', RequestChanges: '请求修改', Reject: '驳回阶段' },
  toasts: {
    Approve: '已批准 {{pipeline}} 的阶段 {{stage}}。',
    RequestChanges: '已请求修改 {{pipeline}} 的阶段 {{stage}}；它将根据你的反馈重新运行。',
    Reject: '已驳回 {{pipeline}} 的阶段 {{stage}}；流水线运行将失败。',
    notPending: '此审核已被其他人或因超时作出决定。列表现在显示当前状态。',
    revisionLimit: '此阶段已用完所有修订次数（最多 {{max}} 次），无法再请求修改。请批准或驳回。'
  }
};
zhHans.components.pipelineStart = {
  title: '启动 {{name}}',
  intro_one: '输入将交给流水线唯一的阶段。',
  intro_other: '输入将交给 {{count}} 个阶段中的第一个；每个阶段也会将其视为原始任务。',
  input: '输入',
  inputPlaceholder: '流水线要处理什么？',
  shortcut: '按 Ctrl+Enter 或 Cmd+Enter 启动。',
  submit: '启动流水线',
  starting: '正在启动...',
  started: '已启动 {{name}}。'
};
zhHans.components.pipelinePreview = {
  title: '预览 {{name}} 的提示词',
  input: '示例输入',
  sampleInput: '汇总未解决的问题，并为最紧急的问题提出修复方案。',
  sampleOutput: '{{stage}} 的示例输出。',
  outputOf: '第 {{position}} 阶段（{{stage}}）的示例输出',
  render: '渲染提示词',
  rendering: '正在渲染...',
  stageHeading: '第 {{position}} 阶段：{{stage}}（{{agent}}）',
  deployment: '部署：{{deployment}}',
  rendered: '已渲染',
  failed: '失败'
};
zhHans.views.pipelineRunDetail = {
  title: '流水线运行',
  heading: '{{pipeline}} 的流水线运行',
  notFoundTitle: '未找到流水线运行',
  notFoundBody: '它可能已被删除，或属于其他租户。',
  live: '实时',
  polling: '刷新中',
  finalRun: '最终运行',
  started: '开始时间',
  input: '输入',
  reviewTitle: '等待你的审核',
  reviewBody: '第 {{position}} 阶段（{{stage}}）已完成第 {{execution}} 次执行，正在等待审核。请在阶段运行中查看其输出：',
  reviewExpires: '如果到 {{time}} 仍无人决定，审核将自动决定为：{{decision}}。',
  reviewNoTimeout: '审核会一直等待人员决定，除非流水线的时间限制先结束运行。',
  stages: '阶段',
  stagesCount_one: '{{count}} 个阶段',
  stagesCount_other: '{{count}} 个阶段',
  noStages: '此流水线运行没有阶段。',
  current: '当前',
  reviewGate: '审核关卡',
  agent: '智能体 {{agent}}',
  counts: '执行 {{executions}} 次，尝试 {{attempts}} / {{maxAttempts}}，修订 {{revisions}} / {{maxRevisions}}',
  startedAt: '开始于',
  blocked: '等待启动：{{reason}}。',
  nextAttempt: '下次尝试时间：{{time}}。',
  reviewItem: '第 {{execution}} 次执行的审核',
  columns: { execution: '执行', run: '阶段运行', status: '状态', outcome: '结果', error: '错误', created: '创建时间' },
  confirmCancelTitle: '取消流水线运行',
  confirmCancel: '要取消 {{pipeline}} 的这个流水线运行吗？其当前阶段运行将被取消，待处理的审核将被关闭。你可以稍后重试。',
  confirmDelete: '要删除 {{pipeline}} 的这个流水线运行及其审核吗？其阶段运行会保留在“运行”页面。'
};
Object.assign(zhHans.views.runDetail, { pipelineRun: '流水线运行' });
zhHans.views.settings.fields.Runtime.PipelineSweepIntervalMs = '流水线检查间隔 (ms)';
zhHans.views.settings.fields.Runtime.PipelineMaxStages = '每条流水线的最大阶段数';

// Deployment trust level (P11.14).
zhHans.enums.trustLevel = { Trusted: "可信", Untrusted: "不可信" };
zhHans.enums.runBlockedReason.NoIsolatingWorker = "没有可隔离的工作节点";
zhHans.components.blocked.reasons.NoIsolatingWorker = "此运行不可信，需要容器隔离，但没有能运行 {{harness}} 的就绪工作节点提供该隔离。请在允许创建 Job 的集群中添加使用 Kubernetes Job 执行器的工作节点。";
zhHans.tips.enums.runBlockedReason.NoIsolatingWorker = "已阻塞：此不可信运行需要容器隔离，但没有带此 Harness 的就绪工作节点提供该隔离。它会在队列中等待，直到使用 Kubernetes Job 执行器的工作节点注册。";
zhHans.tips.enums.trustLevel = { Trusted: "输入仅来自可信的调用方。运行可以使用 Process 执行器，但它与其他运行及工作节点之间没有隔离。", Untrusted: "输入可能来自不可信的来源。运行只会交给具有容器隔离或更强隔离的执行器，没有可用执行器时会在队列中等待。" };
Object.assign(zhHans.common.fieldCodes, { TenantRequiresUntrusted: "此租户要求每个部署都是不可信的。", UntrustedNeedsIsolation: "不可信的部署不能使用 Process 执行器。请选择 Kubernetes Job，或将执行器留空。" });
zhHans.resources.deployments.fields.trustLevel = "信任级别";
zhHans.resources.deployments.columns.trustLevel = "信任级别";
zhHans.resources.deployments.hints.trustLevel = "当调用方或内容可能不可信时，请选择不可信。此类运行需要容器隔离：执行器留空即表示 Kubernetes Job，运行会等待能隔离它们的工作节点。";
zhHans.tips.resources.deployments.trustLevel = "可信允许使用没有隔离的 Process 执行器。不可信只会在具有容器隔离或更强隔离的执行器上运行。";
zhHans.tips.resources.deployments.trustFlagged = "此租户要求不可信的部署。此部署在启用该策略之前是可信的：它会按当前配置继续运行，但下次保存时必须改为不可信。";
zhHans.resources.deployments.trust = { tenantRequiresUntrusted: "此租户要求不可信的部署。请将信任级别改为不可信后再保存此部署。", untrustedProcess: "不可信的部署不能使用 Process 执行器。请选择 Kubernetes Job，或将执行器留空。", flagged: "可信，但策略要求不可信" };
zhHans.resources.tenants.fields.requireUntrustedDeployments = "要求部署为不可信";
zhHans.resources.tenants.columns.requireUntrustedDeployments = "要求不可信";
zhHans.resources.tenants.hints = { ...(zhHans.resources.tenants.hints || {}), requireUntrustedDeployments: "创建或保存可信部署会被拒绝。现有的可信部署会继续运行，并会一直被标记，直到保存为不可信。" };
zhHans.tips.resources.tenants.requireUntrustedDeployments = "开启后，此租户中的每个部署都必须是不可信的，这样其运行只会交给有隔离的执行器。";
zhHans.views.runDetail.trustLevel = "信任级别";
zhHans.tips.views.runDetail.trustLevel = "此运行进入队列时部署的信任级别。不可信的运行只会交给具有容器隔离或更强隔离的执行器。";

// Deployment effect policy (P12.29).
zhHans.enums.effectPolicy = { AtMostOnce: "至多一次", AtLeastOnce: "至少一次", Journaled: "日志模式" };
zhHans.tips.enums.effectPolicy = { AtMostOnce: "如果运行开始后 worker 丢失，运行以节点丢失失败，并且不会再次启动。任何外部作用都不会发生两次。这是默认值。", AtLeastOnce: "如果运行开始后 worker 丢失，只要还有剩余尝试次数，运行就会回到队列。丢失的那次尝试已经产生的作用 (例如 push 或消息) 可能再次发生。", Journaled: "只有当所有作用都经过作用日志时才重新排队。日志尚未提供，因此目前的行为与至多一次相同。" };
Object.assign(zhHans.common.fieldCodes, { EffectPolicyConflict: "作用策略与已弃用的 retryOnNodeLoss 值不一致。请只发送作用策略。" });
zhHans.resources.deployments.fields.effectPolicy = "作用策略";
zhHans.resources.deployments.columns.effectPolicy = "作用策略";
zhHans.resources.deployments.hints.effectPolicy = "至多一次 (默认) 会让 worker 丢失的已启动运行以节点丢失失败。至少一次会在还有尝试次数时重新排队，作用可能重复。日志模式在作用日志出现之前与至多一次相同。从未启动的运行总是会重新排队。";
zhHans.tips.resources.deployments.effectPolicy = "worker 丢失时如何处理已启动的运行: 使其失败 (至多一次)、重新排队 (至少一次)，或日志模式，目前与至多一次相同。";
zhHans.views.runDetail.effectPolicy = "作用策略";
zhHans.tips.views.runDetail.effectPolicy = "此运行进入队列时部署的作用策略。它决定运行的 worker 丢失时如何处理；之后对部署的修改不会影响此运行。";
zhHans.views.settings.fields.Scheduling.QueueWakeFanout = "每个副本唤醒的轮询数";
zhHans.views.settings.fields.Scheduling.RemoteWakeDelayMs = "远端唤醒暂缓时间 (ms)";
zhHans.views.settings.fields.Auth.CacheSeconds = "认证缓存有效期 (秒)";

// Deployment egress allowlists (P11.15).
zhHans.resources.deployments.fields.egressRules = "出站允许列表";
zhHans.resources.deployments.fields.egressCidr = "CIDR 地址块";
zhHans.resources.deployments.fields.egressPort = "目标端口";
zhHans.resources.deployments.fields.egressProtocol = "协议";
zhHans.resources.deployments.columns.egressRules = "出站";
zhHans.resources.deployments.hints.egressRules = "留空则使用集群默认的运行出站规则 (允许 HTTPS 访问任意地址)。设置规则后，运行 Pod 只能访问 DNS、Garrison MCP 端口和这些地址块，且运行需要能强制执行规则的 Kubernetes worker。请填写 CIDR 地址块而不是主机名；请自行将名称解析为地址。端口留空表示允许所有端口。最多 64 条规则。";
zhHans.resources.deployments.egress = {"add": "添加出站规则", "allPorts": "所有端口", "default": "默认", "count_one": "允许列表，{{count}} 条规则", "count_other": "允许列表，{{count}} 条规则", "note_one": "此部署有 {{count}} 条出站规则。它的运行只会在启用了出站允许列表的 Kubernetes worker 上进行，运行所在 Pod 的 NetworkPolicy 只允许 DNS、Garrison MCP 端口和这些规则。没有这样的 worker 就绪时，运行会在队列中等待 (没有可隔离的工作节点)；绝不会在没有允许列表的情况下运行。", "note_other": "此部署有 {{count}} 条出站规则。它的运行只会在启用了出站允许列表的 Kubernetes worker 上进行，运行所在 Pod 的 NetworkPolicy 只允许 DNS、Garrison MCP 端口和这些规则。没有这样的 worker 就绪时，运行会在队列中等待 (没有可隔离的工作节点)；绝不会在没有允许列表的情况下运行。", "errors": {"cidrRequired": "请输入 CIDR 地址块，例如 203.0.113.0/24。", "cidrFormat": "请使用带前缀长度的 CIDR 表示法，例如 198.51.100.7/32。不接受主机名。", "cidrAddress": "该地址不是有效的 IPv4 或 IPv6 地址。", "cidrPrefix": "前缀长度超出范围 (IPv4 为 0 到 32，IPv6 为 0 到 128)。", "cidrMapped": "不允许使用 IPv4 映射的 IPv6 地址；请改为输入 IPv4 地址块。", "cidrHostBits": "该地址在前缀之后有置位的比特；请使用地址块的网络地址。"}};
Object.assign(zhHans.common.fieldCodes, {"InvalidCidr": "CIDR 地址块无效。", "PortOutOfRange": "端口必须在 1 到 65535 之间，或留空表示所有端口。", "InvalidProtocol": "未知协议；请使用 TCP 或 UDP。", "TooManyEgressRules": "一个部署最多可以有 64 条出站规则。", "EgressRulesNeedKubernetesJob": "出站规则只对 Kubernetes Job 运行强制执行。请选择 Kubernetes Job，或将执行器留空。", "EgressRulesNeedColdStart": "出站规则需要冷启动，因为预热 Pod 已经在默认出站规则下运行。请清空启动类别或选择冷启动。"});
zhHans.components.blocked.reasons.NoIsolatingWorkerEgress = "此运行的部署有出站允许列表，只有启用了出站允许列表的 Kubernetes worker 才能强制执行，而能运行 {{harness}} 的就绪 worker 都不提供这一能力。运行会在队列中等待，绝不会在没有允许列表的情况下运行。请在网络插件会强制执行 NetworkPolicy 的集群中，为 Kubernetes Job worker 启用出站允许列表。";
zhHans.tips.enums.runBlockedReason.NoIsolatingWorker = "已阻塞：此运行需要可隔离的 worker (不可信的运行需要容器隔离，带出站允许列表的部署需要出站控制)，而具备其 harness 的就绪 worker 都不提供。它会在队列中等待，直到合适的 Kubernetes Job worker 注册。";
zhHans.tips.resources.deployments.egressRules = "此部署的运行 Pod 可以访问的目标，以 CIDR 地址块表示，可选端口和协议。留空则使用默认的运行出站规则。";
zhHans.tips.resources.deployments.egressRulesItems = {"cidr": "CIDR 表示法的目标地址块，IPv4 或 IPv6，例如 203.0.113.0/24。请自行将主机名解析为地址。", "port": "1 到 65535 之间的目标端口。留空则允许该地址块的所有端口。", "protocol": "大多数服务使用 TCP，或选择 UDP。"};
zhHans.tips.resources.deployments.egressDefault = "没有出站允许列表：运行 Pod 使用集群默认的运行出站规则。";

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
})(zhHans, {
 "nav": {
  "items": {
   "triggers": {
    "label": "触发器",
    "tip": "启动运行的 cron 计划和签名 Webhook"
   },
   "notifications": {
    "label": "通知",
    "tip": "关于运行、流水线和审批的签名 Webhook"
   }
  }
 },
 "enums": {
  "triggerType": {
   "Cron": "cron 计划",
   "Webhook": "签名 Webhook"
  },
  "triggerTargetType": {
   "Agent": "智能体运行",
   "Pipeline": "流水线运行"
  },
  "triggerFireSource": {
   "Cron": "计划",
   "Webhook": "Webhook 投递",
   "Manual": "手动触发"
  },
  "triggerFireOutcome": {
   "Started": "已启动",
   "Failed": "失败",
   "Skipped": "已跳过"
  },
  "notificationEvent": {
   "RunSucceeded": "运行成功",
   "RunFailed": "运行失败",
   "RunCancelled": "运行已取消",
   "RunTimedOut": "运行超时",
   "PipelineCompleted": "流水线已完成",
   "PipelineFailed": "流水线失败",
   "ApprovalRequested": "请求审批",
   "Test": "测试通知"
  },
  "notificationDeliveryStatus": {
   "Pending": "等待中",
   "Delivering": "投递中",
   "Succeeded": "已投递",
   "Failed": "已放弃"
  },
  "runKind": {
   "Invoke": "调用",
   "Delegated": "委派",
   "Test": "测试运行",
   "Retry": "重试",
   "Pipeline": "流水线阶段",
   "Trigger": "由触发器启动"
  },
  "resourceType": {
   "Trigger": "触发器",
   "NotificationEndpoint": "通知端点"
  },
  "auditEventType": {
   "SigningSecretRotated": "已轮换签名密钥"
  }
 },
 "errorCodes": {
  "ReferencedByTrigger": "有触发器在使用此记录。请先修改或删除该触发器。",
  "ReferencedByNotificationEndpoint": "有通知端点按此记录筛选。请先修改或删除该端点。",
  "NotAWebhookTrigger": "只有 Webhook 触发器才有签名密钥。",
  "TriggerInactive": "此触发器未启用。",
  "InvalidSignature": "Webhook 签名缺失、格式错误、过期或不匹配。",
  "PayloadTooLarge": "负载超过服务器可接受的大小。"
 },
 "common": {
  "fieldCodes": {
   "InvalidUrl": "请输入不含用户名和密码的绝对 HTTP 或 HTTPS URL。",
   "DestinationBlocked": "服务器拒绝此目标：除非运维人员允许私有目标，否则回环、私有、链路本地和元数据地址都会被阻止。",
   "EventsRequired": "请至少选择一个事件。",
   "InvalidEvent": "其中有不支持的事件。",
   "InvalidCron": "cron 表达式无效。请使用五个字段：分、时、日、月、星期。",
   "InvalidTimeZone": "未知时区。请使用 UTC 或 Asia/Shanghai 等 IANA 名称。",
   "TypeImmutable": "触发器类型不能更改。请改为创建新触发器。",
   "TargetMismatch": "此字段不属于所选目标。",
   "PayloadTooLarge": "负载超过服务器可接受的大小。"
  }
 },
 "resources": {
  "runs": {
   "columns": {
    "triggerId": "触发器",
    "kind": "运行类型"
   }
  },
  "triggers": {
   "title": "触发器",
   "subtitle": "启动智能体运行或流水线运行的 cron 计划和签名 Webhook。",
   "add": "添加触发器",
   "create": "创建触发器",
   "edit": "编辑触发器",
   "view": "触发器详情",
   "deleteTitle": "删除触发器",
   "emptyTitle": "还没有触发器",
   "emptyBody": "创建触发器，按计划或在其他系统发送 Webhook 时运行智能体。",
   "columns": {
    "name": "名称",
    "type": "类型",
    "target": "启动对象",
    "schedule": "计划",
    "active": "启用",
    "lastFire": "上次触发",
    "nextFireUtc": "下次触发",
    "fireCount": "触发次数",
    "runAs": "运行身份",
    "signingSecretLast4": "密钥末尾",
    "description": "描述",
    "id": "ID",
    "createdUtc": "创建时间"
   },
   "fields": {
    "name": "名称",
    "type": "类型",
    "description": "描述",
    "targetType": "启动对象",
    "agentId": "智能体",
    "deploymentId": "部署",
    "pipelineId": "流水线",
    "inputTemplateId": "输入模板",
    "priority": "优先级",
    "cronExpression": "cron 表达式",
    "timeZone": "时区",
    "active": "启用",
    "webhook": "Webhook 地址"
   },
   "hints": {
    "type": "创建后不能更改类型。",
    "inputTemplateId": "用 trigger.* 和 webhook.* 变量生成运行输入的 Task 模板。留空则使用内置的 trigger-input 模板。",
    "priority": "{{min}} 到 {{max}}。数值越大越先运行。",
    "cronExpression": "五个字段：分、时、日、月、星期。示例：0 9 * * 1-5 表示工作日 09:00 运行。",
    "timeZone": "UTC 或 Asia/Shanghai 等 IANA 名称。夏令时切换会自动处理。",
    "webhookNew": "保存后会显示 Webhook 地址和签名密钥。密钥只显示一次。"
   },
   "errors": {
    "name": "请使用 1 到 64 个小写字母、数字和连字符，并以字母或数字开头和结尾。",
    "description": "描述最多 {{max}} 个字符。",
    "agentRequired": "请选择此触发器要运行的智能体。",
    "pipelineRequired": "请选择此触发器要启动的流水线。",
    "cron": "请输入五个字段（分 时 日 月 星期）或 @daily 等宏。",
    "priority": "请输入 {{min}} 到 {{max}} 之间的整数。"
   },
   "actions": {
    "fire": "立即触发",
    "fires": "触发记录",
    "runs": "查看运行",
    "rotateSecret": "轮换密钥"
   },
   "fires": {
    "firedUtc": "触发时间",
    "source": "来源",
    "outcome": "结果",
    "started": "已启动的运行",
    "deliveryId": "投递 ID",
    "error": "错误",
    "runId": "运行",
    "pipelineRunId": "流水线运行"
   },
   "confirmRotateTitle": "轮换签名密钥",
   "confirmRotate": "要替换 {{name}} 的签名密钥吗？旧密钥会立即失效，发送方必须改用新密钥。",
   "anyDeployment": "任意启用的部署（按权重）",
   "builtinTemplate": "内置 trigger-input 模板",
   "webhookSchedule": "收到签名 Webhook 时",
   "neverFired": "尚未触发",
   "runAsNotice": "以 {{name}} 的身份运行。保存更改后，此触发器将以您的身份运行。",
   "secretEnding": "当前密钥以 {{last4}} 结尾。"
  },
  "notifications": {
   "title": "通知",
   "subtitle": "在运行和流水线结束或审批等待时接收签名通知的 Webhook 端点。",
   "add": "添加端点",
   "create": "创建通知端点",
   "edit": "编辑通知端点",
   "view": "通知端点详情",
   "deleteTitle": "删除通知端点",
   "emptyTitle": "还没有通知端点",
   "emptyBody": "添加端点，在运行失败、流水线结束或审批等待时接收签名的 HTTP POST。",
   "columns": {
    "name": "名称",
    "url": "URL",
    "events": "事件",
    "filters": "筛选",
    "active": "启用",
    "signingSecretLast4": "密钥末尾",
    "includeResultText": "结果文本",
    "description": "描述",
    "id": "ID",
    "createdUtc": "创建时间",
    "agent": "智能体",
    "deployment": "部署"
   },
   "fields": {
    "name": "名称",
    "description": "描述",
    "url": "URL",
    "events": "事件",
    "agentId": "仅此智能体",
    "deploymentId": "仅此部署",
    "includeResultText": "包含结果文本",
    "resultTextMaxChars": "结果文本上限（字符）",
    "active": "启用"
   },
   "hints": {
    "url": "HTTP 或 HTTPS URL。除非运维人员允许私有目标，否则回环、私有和元数据地址会被拒绝，且不跟随重定向。",
    "events": "设置了智能体或部署筛选时，不发送流水线事件。",
    "agentId": "留空则发送所有智能体的事件。",
    "deploymentId": "留空则发送所有部署的事件。",
    "includeResultText": "默认关闭：通知包含标识、状态和时间戳，但不含运行输出。",
    "resultTextMaxChars": "{{min}} 到 {{max}}。默认 {{default}}。"
   },
   "errors": {
    "name": "请使用 1 到 64 个小写字母、数字和连字符，并以字母或数字开头和结尾。",
    "url": "请输入不含用户名和密码的绝对 HTTP 或 HTTPS URL。",
    "events": "请至少选择一个事件。",
    "resultTextMaxChars": "请输入 {{min}} 到 {{max}} 之间的整数。"
   },
   "actions": {
    "test": "发送测试",
    "deliveries": "投递日志",
    "rotateSecret": "轮换密钥"
   },
   "deliveries": {
    "createdUtc": "入队时间",
    "event": "事件",
    "status": "状态",
    "attempts": "尝试次数",
    "lastStatusCode": "HTTP 状态",
    "lastError": "最近错误",
    "lastAttemptUtc": "最近尝试",
    "nextAttemptUtc": "下次尝试",
    "deliveredUtc": "投递时间",
    "payload": "负载",
    "id": "投递 ID"
   },
   "confirmRotateTitle": "轮换签名密钥",
   "confirmRotate": "要替换 {{name}} 的签名密钥吗？此后的通知（包括已排队的重试）都将使用新密钥签名。",
   "anyAgent": "所有智能体",
   "anyDeployment": "所有部署",
   "noFilter": "全部",
   "eventCount_one": "{{count}} 个事件",
   "eventCount_other": "{{count}} 个事件",
   "resultTextUpTo_one": "最多 {{count}} 个字符",
   "resultTextUpTo_other": "最多 {{count}} 个字符",
   "secretNotice": "通知使用以 {{last4}} 结尾的密钥签名，设置于 {{time}}。轮换即可获得新密钥。"
  }
 },
 "components": {
  "signingSecret": {
   "title": "签名密钥",
   "warning": "请立即复制此密钥。Garrison 会加密保存且不会再次显示；如有遗失请轮换。",
   "secret": "密钥",
   "url": "Webhook 地址",
   "done": "我已保存",
   "scheme": "用请求头 {{header}} 为每个请求签名：{{format}}。发送 {{delivery}} 可让重复投递只计一次。"
  },
  "triggerFire": {
   "title": "触发 {{name}}",
   "intro": "立即启动此触发器。负载可选；输入模板会以 webhook.body 读取它。",
   "body": "负载",
   "contentType": "负载内容类型",
   "submit": "触发",
   "firing": "正在触发..."
  },
  "triggerFires": {
   "title": "触发记录",
   "count_one": "共 {{count}} 次触发，显示 {{shown}} 次",
   "count_other": "共 {{count}} 次触发，显示 {{shown}} 次",
   "empty": "此触发器尚未触发。",
   "scheduled": "对应 {{time}}"
  },
  "notificationDeliveries": {
   "title": "投递日志",
   "count_one": "共 {{count}} 次投递，显示 {{shown}} 次",
   "count_other": "共 {{count}} 次投递，显示 {{shown}} 次",
   "empty": "尚未向此端点发送任何内容。",
   "detail": "所选投递"
  },
  "notificationTest": {
   "title": "测试通知",
   "sending": "正在发送测试通知...",
   "succeeded": "端点已接受测试通知。",
   "failed": "测试通知失败，且不会重试。请查看下方错误。",
   "pending": "首次尝试失败；Garrison 会重试。请查看下方错误。"
  }
 },
 "views": {
  "runDetail": {
   "trigger": "触发器"
  },
  "settings": {
   "groups": {
    "Triggers": "触发器",
    "Notifications": "通知"
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Webhook 正文上限（字节）",
     "WebhookToleranceSeconds": "Webhook 时间戳容差（秒）",
     "CronMaxLatenessSeconds": "cron 补触发上限（秒）",
     "FireRetentionDays": "触发记录保留天数"
    },
    "Notifications": {
     "AllowPrivateDestinations": "允许私有目标",
     "MaxAttempts": "投递尝试次数",
     "InitialBackoffSeconds": "首次重试等待（秒）",
     "MaxBackoffSeconds": "最长重试等待（秒）",
     "TimeoutSeconds": "投递超时（秒）",
     "DispatchIntervalMs": "派发间隔（毫秒）",
     "SweepOverlapSeconds": "事件扫描重叠（秒）",
     "DeliveryRetentionDays": "投递日志保留天数"
    }
   }
  }
 }
});
Object.assign(zhHans.common.fieldCodes, {"SecretUseDenied": "你没有使用此机密的权限。请申请此机密的 SecretUser 或 SecretManager 角色。", "GrantCeiling": "你只能授予自己拥有的权限。", "ReservedRoleName": "这是内置角色的名称。请选择其他名称。"});
zhHans.components.mcpTest.noWorkers = "没有就绪的工作节点提供 stdio 诊断。命令会在工作节点主机上、运行隔离之外执行，因此只有运维人员在工作节点上设置 GARRISON_WORKER_MCP_TESTS_ENABLED=true 时才会运行。";

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
})(zhHans, {
 "components": {
  "transcriptExport": {
   "label": "导出对话记录",
   "exporting": "正在导出...",
   "markdown": "Markdown 文档 (.md)",
   "json": "JSON (.json)",
   "includeThinking": "包含思考过程",
   "failed": "导出对话记录失败：{{message}}"
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "结构化输入",
    "modeLabel": "输入编辑器",
    "modeForm": "表单",
    "modeJson": "原始 JSON",
    "required": "必填",
    "choose": "选择一个值",
    "addItem": "添加项",
    "removeItem": "移除项",
    "jsonLabel": "输入 JSON",
    "jsonPlaceholder": "JSON 值",
    "unsupported": "此输入架构没有可用于生成表单的属性。请输入智能体期望的 JSON 文档。",
    "invalidRaw": "JSON 无效。请先修正，再切换到表单。",
    "errors": {
     "required": "此字段为必填项。",
     "number": "请输入数字。",
     "integer": "请输入整数。",
     "json": "请输入有效的 JSON。"
    }
   }
  },
  "manifests": {
   "bundle": {
    "scope": "导出范围",
    "scopeAll": "所有资源",
    "scopeSelected": "所选资源",
    "kinds": "类型",
    "resources": "资源",
    "resourcesHint": "每行一个 类型/名称，或用逗号分隔，例如 Agent/triage。",
    "invalidSelectors": "不是已知类型的 类型/名称：{{entries}}",
    "followReferences": "包含它们引用的资源",
    "includeBuiltIn": "包含引用的内置资源",
    "exporting": "正在导出...",
    "noSecrets": "此包不需要任何密钥。",
    "requiredSecrets": "应用之前，请在目标租户中创建这些密钥。密钥值永远不会被导出。",
    "requiredArtifactStores": "应用之前，请在目标租户中创建这些制品存储。"
   }
  }
 }
});

// Durable continuation and remote execution.
zhHans.enums.runStatus.Suspended = "已挂起";
zhHans.resources.deployments.fields.suspensionEnabled = "等待审批时挂起";
zhHans.resources.harnessProfiles.fields.sessionFormat = "Harness 会话格式";
zhHans.enums.auditEventType.QueueFull = "队列已满";
zhHans.enums.runExecutor.RemoteA2A = "远程 A2A";
zhHans.enums.runExecutor.RemoteMcp = "远程 MCP";
zhHans.tips.resources.deployments.suspensionEnabled = "等待时启用持久检查点。需要 Process、隔离的主目录、兼容且可恢复的 Harness，以及产物存储。";
zhHans.tips.resources.harnessProfiles.sessionFormat = "可移植检查点的版本化会话格式。如果 Harness 升级改变会话兼容性，请更新此值。";
zhHans.tips.enums.runStatus.Suspended = "运行已有持久会话检查点，等待时不占用工作节点租约或执行槽位。";
zhHans.tips.enums.runExecutor.RemoteA2A = "通过期限和取消处理执行已认证的注册 A2A 代理。";
zhHans.tips.enums.runExecutor.RemoteMcp = "使用经过验证的 JSON 输入调用所选的远程 MCP 工具。";
zhHans.tips.enums.auditEventType.QueueFull = "集群、租户或代理的队列达到上限，运行接纳被拒绝。";

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
})(zhHans, {
 "enums": {
  "agentRevisionState": {
   "Draft": "草稿",
   "Published": "已发布"
  },
  "promotionKind": {
   "Promote": "晋升",
   "Rollback": "回滚"
  },
  "promotionOutcome": {
   "Applied": "已应用",
   "RolledBack": "已回滚"
  },
  "revisionChangeType": {
   "Changed": "已更改",
   "Added": "已添加",
   "Removed": "已删除"
  },
  "resourceType": {
   "AgentRevision": "代理修订",
   "Promotion": "晋升"
  }
 },
 "errorCodes": {
  "PromotionOrderViolation": "目标不是源环境的下一个环境。要不按顺序晋升，请开启“允许跳过环境”。",
  "NoNextEnvironment": "源环境是最后一个环境，没有可晋升的目标。",
  "NoTargetDeployments": "此代理在目标环境中没有部署。请先在那里创建一个。",
  "NoSourceRevision": "没有可晋升的修订：代理在源环境中没有部署，或没有已发布的修订。请明确选择一个修订。",
  "AmbiguousSourceRevision": "源环境中的部署运行着不同的修订。请选择要晋升的修订。",
  "RevisionNotPublished": "该修订是草稿。请先发布再晋升。",
  "PromotionConflict": "应用晋升时某个部署发生了变化。未做任何更改；请重新加载后再试。",
  "NotAPromotion": "只能回滚晋升，不能回滚回滚记录。",
  "AlreadyRolledBack": "此晋升已被回滚。",
  "RevisionUnchanged": "草稿与最新发布的修订相同。请先修改再发布，或将其丢弃。",
  "RevisionPublished": "此修订已发布，无法再更改。",
  "EnvironmentInUse": "您移除的某个环境仍有部署。请先移动或删除这些部署。"
 },
 "views": {
  "agentDetail": {
   "revisions": "修订",
   "draftNotice": "此代理有尚未发布的草稿更改。在草稿发布之前，部署将继续运行已发布的修订。",
   "reviewDraft": "查看草稿"
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "number": "修订号",
    "state": "状态",
    "author": "作者",
    "changeNote": "变更说明",
    "publishedUtc": "发布时间",
    "actions": "操作"
   },
   "number": "修订 {{number}}",
   "option": "修订 {{number}}（{{state}}）",
   "latest": "最新",
   "empty": "此代理还没有修订。",
   "compareTitle": "比较修订",
   "from": "从",
   "to": "到",
   "pickTwo": "请选择两个不同的修订进行比较。",
   "identical": "修订 {{from}} 和 {{to}} 的内容相同。",
   "diffSummary": "修订 {{from}} 与修订 {{to}} 之间更改的字段：{{changed}}。",
   "diffColumns": {
    "field": "字段",
    "change": "变更",
    "before": "之前",
    "after": "之后"
   },
   "emptyValue": "（空）",
   "compare": "比较",
   "publish": "发布",
   "discard": "丢弃草稿",
   "publishTitle": "发布修订 {{number}}",
   "publishBody": "发布后，修订 {{number}} 将成为最新发布的修订。跟随最新修订的部署从下一次运行开始使用它；已固定的部署保留其修订。",
   "changeNote": "变更说明",
   "changeNotePlaceholder": "更改了什么以及原因（可选）",
   "publishing": "正在发布...",
   "published": "已发布修订 {{number}}。",
   "discardTitle": "丢弃草稿修订 {{number}}",
   "discardMessage": "要丢弃草稿吗？其更改将丢失。已发布的修订和部署不受影响。",
   "discarded": "草稿已丢弃。"
  },
  "promote": {
   "title": "晋升修订",
   "intro": "将目标环境中该代理的每个部署固定到源环境中正在运行的修订。每次晋升都会被记录，并且可以回滚。",
   "agent": "代理",
   "revision": "要晋升的修订",
   "revisionFromSource": "源环境中正在运行的修订",
   "source": "源环境",
   "target": "目标环境",
   "targetNext": "下一个环境（{{name}}）",
   "allowSkip": "允许跳过环境",
   "skipWarning": "{{target}} 不是紧接在 {{source}} 之后的环境。",
   "note": "备注",
   "notePlaceholder": "此次晋升的原因（可选）",
   "submit": "晋升",
   "promoting": "正在晋升...",
   "promoted": "已晋升到 {{target}}。已更新的部署：{{deployments}}。",
   "errors": {
    "noNext": "源环境之后没有其他环境。",
    "sameEnvironment": "请选择与源环境不同的目标环境。",
    "needsSkip": "此目标会跳过一个环境。要不按顺序晋升，请开启“允许跳过环境”。"
   }
  },
  "promotions": {
   "title": "晋升历史",
   "agentFilter": "代理",
   "allAgents": "所有代理",
   "empty": "还没有晋升或回滚记录。",
   "columns": {
    "createdUtc": "时间",
    "kind": "类型",
    "outcome": "结果",
    "agent": "代理",
    "revision": "修订",
    "environments": "环境",
    "deployments": "部署",
    "actor": "操作人",
    "note": "备注",
    "actions": "操作"
   },
   "path": "{{source}} 到 {{target}}",
   "pinChange": "（{{from}} 到 {{to}}）",
   "skipped": "跳过了环境",
   "rollback": "回滚",
   "rollbackTitle": "回滚晋升",
   "rollbackMessage": "要将此次从 {{source}} 到 {{target}} 的晋升所更改的部署恢复为之前的修订固定吗？受影响的部署：{{deployments}}。",
   "rollbackNote": "回滚备注",
   "rolledBack": "已回滚。之前的修订固定已恢复。"
  }
 },
 "resources": {
  "deployments": {
   "columns": {
    "environment": "环境",
    "agentRevisionId": "固定的修订"
   },
   "fields": {
    "environment": "环境",
    "agentRevisionId": "修订固定"
   },
   "hints": {
    "environment": "晋升按租户的顺序在环境之间移动修订。",
    "agentRevisionId": "留空则跟随代理最新发布的修订。固定后，此部署将保持在某个修订上，直到您或某次晋升更改它。"
   },
   "followLatest": "跟随最新发布",
   "latest": "最新",
   "selectAgentFirst": "请先选择一个代理。",
   "noPublished": "此代理还没有已发布的修订。",
   "actions": {
    "promote": "晋升",
    "promotions": "晋升历史"
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
})(zhHans, {
 "nav": {
  "items": {
   "agentAssets": {
    "label": "资产",
    "tip": "代理修订所固定的带版本的系统提示词、技能、参考文件和文档模板。"
   }
  }
 },
 "enums": {
  "agentAssetKind": {
   "SystemPrompt": "系统提示词",
   "Skill": "技能",
   "ReferenceFile": "参考文件",
   "DocumentTemplate": "文档模板"
  },
  "runOutcome": {
   "AssetIntegrityFailed": "资产完整性校验失败"
  },
  "resourceType": {
   "AgentAsset": "代理资产"
  }
 },
 "errorCodes": {
  "AssetInUse": "仍有代理修订固定了此资产。请先从这些修订中移除它，再删除。",
  "AssetKindImmutable": "资产创建后无法更改其类型。请改为创建新资产。",
  "AssetStoreImmutable": "资产创建后无法更改其制品存储。请改为创建新资产。",
  "AssetTemplateRequired": "系统提示词资产需要一个提示词模板，其他类型不能设置提示词模板。",
  "AssetFileTooLarge": "某个文件超过了 Assets.MaxFileBytes 设置允许的大小。",
  "AssetVersionTooLarge": "文件总大小超过了 Assets.MaxVersionBytes 设置允许的大小。",
  "AssetTooManyFiles": "此次上传的文件数超过了 Assets.MaxFilesPerVersion 设置允许的数量。",
  "AssetHasNoFiles": "系统提示词资产没有文件。请改为编辑其提示词模板。"
 },
 "common": {
  "fieldCodes": {
   "InvalidAssetPath": "请使用以正斜杠分隔的相对路径，不能包含“.”或“..”段，最多 512 个字符。",
   "MacroFormatRefused": "不接受启用宏的 Office 文件（Assets.AllowMacroFormats）。请将文件另存为 .docx 或 .dotx。",
   "AssetHasNoFiles": "系统提示词资产没有文件。请改为编辑其提示词模板。",
   "AssetTemplateRequired": "请为系统提示词资产选择一个提示词模板。"
  },
  "serverText": {
   "assetInUse": "资产 {{asset}} 被以下代理的修订固定：{{agents}}。请先从这些修订中移除它。",
   "assetFileTooLarge": "文件 {{path}} 为 {{size}} 字节，上限为 {{limit}} 字节（Assets.MaxFileBytes）。",
   "assetVersionTooLarge": "此版本超过 {{limit}} 字节（Assets.MaxVersionBytes）。",
   "assetTooManyFiles": "每个版本最多包含 {{limit}} 个文件（Assets.MaxFilesPerVersion），此次上传有 {{count}} 个。",
   "assetHasNoFiles": "系统提示词资产没有文件。请改为编辑其提示词模板。"
  }
 },
 "resources": {
  "agentAssets": {
   "title": "资产",
   "subtitle": "代理修订所固定的带版本的系统提示词、技能、参考文件和文档模板。",
   "add": "添加资产",
   "create": "创建资产",
   "edit": "编辑资产",
   "view": "资产详情",
   "deleteTitle": "删除资产",
   "emptyTitle": "还没有资产",
   "emptyBody": "创建一个资产，将其文件上传为一个版本，然后在代理修订上固定它。",
   "columns": {
    "name": "名称",
    "kind": "类型",
    "currentVersion": "当前版本",
    "description": "描述",
    "tags": "标签",
    "artifactStoreId": "存储",
    "id": "资产 ID",
    "createdUtc": "创建时间"
   },
   "fields": {
    "name": "名称",
    "kind": "类型",
    "promptTemplateId": "提示词模板",
    "artifactStoreId": "制品存储",
    "description": "描述",
    "tags": "标签"
   },
   "hints": {
    "kind": "创建后不可更改。系统提示词资产的文本来自提示词模板，其他类型保存上传的文件。",
    "promptTemplateId": "其文本将作为代理系统提示词的提示词模板。",
    "artifactStoreId": "上传文件的存放位置。创建后不可更改。留空则保存在 Garrison 数据库中。"
   },
   "errors": {
    "templateRequired": "请选择此系统提示词资产使用的提示词模板。"
   },
   "version": "版本 {{number}}",
   "noVersion": "无版本",
   "databaseStore": "Garrison 数据库",
   "actions": {
    "versions": "版本"
   }
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "assetPins": "资产"
   }
  },
  "assets": {
   "versionsTitle": "{{name}} 的版本",
   "current": "当前",
   "noVersions": "此资产还没有版本。请在下方上传其文件。",
   "systemPromptNotice": "系统提示词资产没有文件。其文本来自提示词模板，如需更改请编辑该模板。",
   "showFiles": "文件",
   "filesTitle": "版本 {{number}} 的文件",
   "noFiles": "此版本没有文件。",
   "preview": "预览",
   "download": "下载",
   "previewTitle": "{{path}}（版本 {{number}}）",
   "emptyFile": "此文件为空。",
   "versionColumns": {
    "number": "版本",
    "author": "作者",
    "changeNote": "变更说明",
    "totalBytes": "总大小",
    "createdUtc": "创建时间",
    "actions": "操作"
   },
   "fileColumns": {
    "path": "路径",
    "mediaType": "媒体类型",
    "sizeBytes": "大小",
    "sha256": "SHA-256 摘要",
    "actions": "操作"
   },
   "uploadTitle": "上传新版本",
   "uploadHint": "选择一个或多个文件。每次上传都是一个完整版本：未包含的文件不会从当前版本沿用。",
   "files": "文件",
   "uploadColumns": {
    "path": "资产内路径",
    "mediaType": "媒体类型",
    "size": "大小",
    "actions": "移除"
   },
   "mediaTypeGuessed": "根据文件扩展名推断",
   "removeFile": "从此次上传中移除此文件",
   "changeNote": "变更说明",
   "changeNotePlaceholder": "此版本中更改了什么",
   "upload": "上传版本",
   "uploading": "正在上传...",
   "uploadCreated": "已创建版本 {{number}}。",
   "uploadUnchanged": "文件与当前版本 {{number}} 相同，因此未创建新版本。",
   "limitSetting": "此上限由服务器设置 {{setting}} 决定。",
   "duplicatePath": "此次上传中另一个文件的路径与此相同。",
   "pinVersion": "{{name}} 版本 {{version}}",
   "pinCurrent": "{{name}}（当前）",
   "pinsTitle": "资产固定",
   "pinsSave": "保存草稿",
   "pinsSaved": "已在草稿修订 {{number}} 上保存资产固定。",
   "pinsDraft": "更改草稿修订 {{number}} 的资产固定。草稿中的其他内容保持不变。",
   "pinsNewDraft": "当前没有打开的草稿。保存时将基于已发布的修订 {{number}} 创建一个带有这些资产固定的新草稿。",
   "pinsEmpty": "未固定任何资产。",
   "pinAsset": "资产",
   "pinVersionLabel": "版本",
   "chooseAsset": "选择资产",
   "assetOption": "{{name}}（{{kind}}）",
   "followCurrent": "当前版本",
   "removePin": "移除此资产固定",
   "addPin": "添加资产",
   "editPins": "资产",
   "pinsNewDraftButton": "在新草稿中固定资产"
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
})(zhHans, {
 "views": {
  "conversationDetail": {
   "tabsLabel": "对话分区",
   "tabs": {
    "turns": "各轮",
    "files": "文件"
   }
  },
  "runDetail": {
   "fileSpace": "文件空间",
   "openFiles": "打开文件"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "fileSpaceMountPath": "文件空间文件夹"
   },
   "hints": {
    "fileSpaceMountPath": "运行工作区中的文件夹，运行开始时接收对话的共享文件，结束时把其中的更改写回。默认值为 files。"
   }
  }
 },
 "errorCodes": {
  "InvalidFilePath": "请使用以正斜杠分隔的相对路径，不能包含“.”或“..”段。",
  "FileTooLarge": "文件超出了 FileSpaces.MaxFileBytes 设置允许的大小。",
  "FileSpaceFull": "文件空间将超出 FileSpaces.MaxTotalBytes 设置。",
  "TooManyFiles": "文件空间中的文件数已达到 FileSpaces.MaxFiles 设置的上限。",
  "StaleFileUpload": "此运行已不再持有租约，因此其文件更改没有写入。"
 },
 "common": {
  "fieldCodes": {
   "InvalidFilePath": "请使用以正斜杠分隔的相对路径，不能包含“.”或“..”段。"
  },
  "serverText": {
   "fileSpaceFileTooLarge": "文件 {{path}} 有 {{size}} 字节；上限为 {{limit}} 字节 (FileSpaces.MaxFileBytes)。",
   "fileSpaceFull": "文件空间将超过 {{limit}} 字节 (FileSpaces.MaxTotalBytes)。",
   "fileSpaceTooManyFiles": "文件空间中已有 {{count}} 个文件 (FileSpaces.MaxFiles)。",
   "fileNotFound": "未找到文件 {{path}}。"
  }
 },
 "components": {
  "files": {
   "title": "文件",
   "summary": "共享文件：{{count}} 个 ({{size}})",
   "live": "实时",
   "polling": "定时刷新",
   "includeDeleted": "显示已删除的文件",
   "refresh": "刷新",
   "spaceId": "文件空间 {{id}}",
   "emptyTitle": "还没有文件",
   "emptyBody": "各轮写入共享文件夹的文件，以及您在下方上传的文件，都会显示在这里。",
   "emptyBodyDeleted": "此对话的共享文件夹中还没有写入任何内容，包括后来被删除的文件。",
   "columns": {
    "path": "路径",
    "currentVersion": "版本",
    "sizeBytes": "大小",
    "mediaType": "媒体类型",
    "lastUpdateUtc": "更新时间",
    "actions": "操作"
   },
   "deleted": "已删除",
   "version": "版本 {{number}}",
   "versions": "版本历史",
   "download": "下载",
   "deleteLabel": "删除 {{path}}",
   "deletedToast": "已删除 {{path}}。其版本会保留。",
   "deleteTitle": "删除文件",
   "confirmDelete": "要从共享文件中删除 {{path}} 吗？之后的各轮将看不到它。其版本会保留，仍可下载。",
   "versionsTitle": "{{path}} 的版本",
   "noVersions": "此文件没有版本。",
   "current": "当前",
   "versionColumns": {
    "number": "版本",
    "sizeBytes": "大小",
    "mediaType": "媒体类型",
    "sha256": "SHA-256 摘要",
    "writtenBy": "写入者",
    "createdUtc": "写入时间",
    "actions": "操作"
   },
   "preview": "预览",
   "previewTitle": "{{path}} (版本 {{number}})",
   "emptyFile": "此版本为空。",
   "uploadTitle": "上传文件",
   "uploadHint": "选择一个或多个文件并检查其路径。路径与列表中的文件相同时，会为该文件添加新版本。如果在列表加载后有某一轮更改了该文件，您的上传会以冲突名称保存在旁边，而不会替换它。",
   "uploadCreated": "已将 {{path}} 添加为版本 {{version}}。",
   "uploadReplaced": "已将 {{path}} 保存为版本 {{version}}。",
   "uploadConflict": "{{requested}} 在列表加载后被更改，因此您的上传已保存为 {{path}}。请比较这两个文件，并删除不需要的那个。",
   "chooseFiles": "要上传的文件",
   "uploadColumns": {
    "path": "在共享文件夹中的路径",
    "replaces": "替换",
    "size": "大小",
    "actions": "移除"
   },
   "replacesVersion": "版本 {{version}}",
   "newFile": "新文件",
   "removeFile": "从上传中移除此文件",
   "upload": "上传",
   "uploading": "正在上传...",
   "limitSetting": "此上限由服务器设置 {{setting}} 决定。"
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
})(zhHans, {
 "nav": {
  "items": {
   "capabilities": {
    "label": "能力",
    "tip": "能力目录：编排型智能体可以查找和使用的智能体、MCP 工具和 Harness 内置工具，并附有成本和延迟参考。"
   }
  }
 },
 "enums": {
  "capabilityKind": {
   "Agent": "智能体",
   "McpTool": "MCP 工具",
   "HarnessBuiltIn": "Harness 内置工具"
  },
  "capabilityOrigin": {
   "Derived": "派生",
   "Manual": "手动"
  },
  "capabilityHintStatus": {
   "Unknown": "未知",
   "Known": "已知"
  },
  "runBlockedReason": {
   "NoToolWorker": "没有具备该工具的工作节点"
  },
  "resourceType": {
   "ConversationFileSpace": "会话文件空间",
   "Capability": "能力"
  }
 },
 "errorCodes": {
  "InvalidJsonSchema": "架构不是有效的 JSON Schema。请修正输入或输出架构后重新保存。",
  "NameConflict": "另一个手动能力已在使用此名称。请换一个名称。",
  "CapabilityDerived": "此能力派生自其来源并随来源变化，因此不能在此编辑或删除。请改为修改来源。",
  "InvalidTags": "最多使用 32 个标签，每个 1 到 64 个字符。",
  "TooManyRequirements": "最多使用 16 个节点标签要求。"
 },
 "common": {
  "fieldCodes": {
   "InvalidJsonSchema": "这不是有效的 JSON Schema。",
   "InvalidTags": "最多使用 32 个标签，每个 1 到 64 个字符。",
   "TooManyRequirements": "最多使用 16 个节点标签要求。"
  },
  "serverText": {
   "capabilityDerivedEdit": "能力 {{name}} 派生自其来源并随来源变化。请改为修改来源。",
   "capabilityDerivedDelete": "能力 {{name}} 派生自其来源，会随来源一起消失，因此不能直接删除。",
   "capabilityShared": "能力 {{name}} 由所有租户共享，来自内置的 Harness 配置文件，因此无法更改。",
   "capabilityNameConflict": "已存在名为 {{name}} 的手动能力。",
   "capabilitySecretsDenied": "你无权使用 MCP 服务器 {{server}} 发送的机密，因此未列出其工具。",
   "capabilityNoStdioWorker": "没有已开启 stdio MCP 诊断（GARRISON_WORKER_MCP_TESTS_ENABLED）的就绪工作节点，因此无法列出该 stdio 服务器的工具。",
   "capabilityRefreshFailed": "{{when}} 刷新失败：{{error}}",
   "capabilityMissingTools": "缺少必需的工具：{{tools}}。",
   "capabilityProbeShadowed": "工作节点会将 {{name}} 按 {{probe}} 进行探测，该探测由另一个 Harness 配置文件先行定义。此配置文件中的定义不会被探测。"
  }
 },
 "components": {
  "blocked": {
   "reasons": {
    "NoToolWorker": "此运行的智能体使用 {{tools}}，但能运行 {{harness}} 的就绪工作节点都没有报告该工具。请在工作节点主机上安装该工具，让探测报告节点标签 garrison.io/tool-{name}=true，或手动为某个工作节点添加该标签。"
   }
  },
  "revisions": {
   "columns": {
    "capabilities": "能力"
   }
  },
  "capabilities": {
   "noSource": "手动条目",
   "shared": "共享",
   "hintsLine": "中位数 {{median}}，p90 {{p90}}，每次运行 {{cost}}",
   "hintsLineNoCost": "中位数 {{median}}，p90 {{p90}}，未记录成本",
   "hintsTitle": "成本和延迟参考",
   "noCost": "未记录成本",
   "windowDays_one": "{{count}} 天",
   "windowDays_other": "{{count}} 天",
   "refreshWarning": "上次刷新此条目的来源时失败。",
   "requirementsTitle": "运行所需的节点标签",
   "noRequirements": "无。使用此能力的运行可以分配到任意工作节点。",
   "noSchema": "无架构",
   "fields": {
    "kind": "类型",
    "origin": "来源方式",
    "source": "来源",
    "lastRefreshedUtc": "上次刷新",
    "tags": "标签",
    "id": "ID",
    "summary": "摘要",
    "hintStatus": "状态",
    "sampleSize": "统计的运行数",
    "medianDurationMs": "时长中位数",
    "p90DurationMs": "p90 时长",
    "meanCostUsd": "平均成本",
    "windowDays": "统计窗口",
    "computedUtc": "计算时间",
    "inputSchemaJson": "输入架构",
    "outputSchemaJson": "输出架构"
   },
   "refreshTitle": "刷新能力目录",
   "refreshHint": "Garrison 会重新派生智能体和 Harness 内置工具条目，列出每个 MCP 服务器的工具（stdio 服务器通过已开启 stdio 诊断的工作节点列出），并重新计算智能体的参考值。列出服务器时会向其发送模板中引用的机密，因此你需要有使用这些机密的权限。",
   "refreshServer": "要列出的 MCP 服务器",
   "refreshAll": "所有活动的 MCP 服务器",
   "refreshRun": "立即刷新",
   "refreshing": "正在刷新...",
   "refreshDone": "能力目录已是最新。",
   "refreshPartial_one": "目录已刷新，但有 {{count}} 个 MCP 服务器无法列出。",
   "refreshPartial_other": "目录已刷新，但有 {{count}} 个 MCP 服务器无法列出。",
   "refresh": {
    "agents": "已变更的智能体条目",
    "harnessBuiltIns": "已变更的内置工具条目",
    "hints": "已重新计算的参考值",
    "servers": "已列出的 MCP 服务器",
    "tools": "已写入的工具条目",
    "removed": "已移除的工具条目",
    "failed": "失败的服务器",
    "noServers": "未列出任何 MCP 服务器。",
    "failedBadge": "失败",
    "listedBadge": "已列出",
    "columns": {
     "server": "MCP 服务器",
     "status": "结果",
     "tools": "工具",
     "removed": "已移除",
     "warned": "保留并附警告",
     "error": "错误"
    }
   },
   "errors": {
    "nameLength": "请使用 1 到 {{max}} 个字符。",
    "summaryLength": "最多使用 {{max}} 个字符。",
    "tags": "最多使用 {{max}} 个标签，每个 1 到 {{length}} 个字符。",
    "requirementCount": "最多使用 {{max}} 个节点标签要求。",
    "requirement": "每个要求都需要一个 1 到 {{max}} 个字符的节点标签键。",
    "toolNeedsServer": "请选择该工具所属的 MCP 服务器。",
    "probeCount": "一个 Harness 配置文件最多有 {{max}} 个工具探测。",
    "probeName": "工具名称为 1 到 63 个小写字母、数字、点和连字符，并以字母或数字开头。",
    "probeDuplicate": "此配置文件中已有另一个名为 {{name}} 的探测。",
    "probeExecutable": "可执行文件只能是在 PATH 中能找到的纯文件名（字母、数字、点、下划线、加号和连字符），不能包含文件夹。",
    "probeArgument": "请选择不带参数，或选择 {{allowed}} 之一。",
    "probeDescription": "最多使用 {{max}} 个字符。"
   },
   "draftTitle": "能力",
   "draftSave": "保存草稿",
   "draftSaved": "已将能力保存到草稿修订 {{number}}。",
   "draftEdit": "更改草稿修订 {{number}} 的能力。草稿中的其他内容保持不变。",
   "draftNew": "当前没有打开的草稿。保存后将基于已发布修订 {{number}} 并使用这些能力创建新草稿。",
   "draftPlacementHint": "此处列出的 Harness 内置工具会把其节点标签加到此智能体的运行上，因此这些运行只会分配给报告了该工具的工作节点。",
   "draftEmpty": "此修订不使用任何能力。",
   "notInCatalog": "不在目录中",
   "removeName": "移除 {{name}}",
   "chooseName": "选择能力",
   "nameOption": "{{name}}（{{kinds}}）",
   "addName": "添加能力",
   "newDraftButton": "在新草稿中选择能力",
   "editDraft": "能力"
  }
 },
 "resources": {
  "capabilities": {
   "title": "能力",
   "subtitle": "编排型智能体可以查找和使用的智能体、MCP 工具和 Harness 内置工具，并附有成本和延迟参考。",
   "add": "添加能力",
   "create": "创建能力",
   "edit": "编辑能力",
   "view": "能力详情",
   "deleteTitle": "删除能力",
   "emptyTitle": "还没有能力",
   "emptyBody": "发布一个智能体修订、注册一个 MCP 服务器，或为 Harness 配置文件添加工具探测，然后刷新。你也可以添加手动条目。",
   "columns": {
    "name": "名称",
    "kind": "类型",
    "origin": "来源方式",
    "summary": "摘要",
    "source": "来源",
    "hints": "参考",
    "tags": "标签",
    "lastRefreshedUtc": "上次刷新",
    "id": "ID",
    "createdUtc": "创建时间"
   },
   "fields": {
    "name": "名称",
    "kind": "类型",
    "summary": "摘要",
    "sourceAgentId": "对应的智能体",
    "sourceMcpServerId": "所属的 MCP 服务器",
    "sourceToolName": "该服务器上的工具名称",
    "tags": "标签",
    "requirements": "运行所需的节点标签",
    "inputSchemaJson": "输入架构",
    "outputSchemaJson": "输出架构"
   },
   "hints": {
    "kind": "手动条目可以是任意类型，例如智能体通过技能访问的转换服务。",
    "requirements": "使用此能力的智能体运行只会分配给同时具有所有这些节点标签的工作节点。",
    "sourceMcpServerId": "可选。指定了服务器的条目，只有在部署绑定了该服务器时，运行令牌才能看到。",
    "inputSchemaJson": "一个 JSON Schema，例如 {\"type\": \"object\"}。如果能力接受自由文本，请留空。"
   },
   "tagFilter": "标签",
   "refresh": "刷新",
   "warningBadge": "刷新失败",
   "warnings_one": "有 {{count}} 个条目因上次刷新其来源失败而保留了最后一次正常的内容。打开它可查看原因。",
   "warnings_other": "有 {{count}} 个条目因上次刷新其来源失败而保留了最后一次正常的内容。打开其中一个可查看原因。",
   "noSourceOption": "无",
   "requirementKey": "节点标签",
   "requirementValue": "值"
  },
  "harnessProfiles": {
   "fields": {
    "toolProbes": "工具探测",
    "probeName": "工具名称",
    "probeExecutable": "可执行文件",
    "probeArgument": "参数",
    "probeDescription": "描述"
   },
   "columns": {
    "toolProbes": "工具探测"
   },
   "hints": {
    "toolProbes": "当工作节点主机上有这些工具时，此 Harness 可以使用它们。工作节点在注册前运行每个探测，并将有响应的工具报告为节点标签 garrison.io/tool-{name}=true。"
   },
   "addToolProbe": "添加工具探测",
   "probeNoArgument": "不带参数"
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
})(zhHans, {
 "enums": {
  "fanOutGroupStatus": {
   "Running": "运行中",
   "Joined": "已汇合",
   "TimedOut": "已超时",
   "BudgetExceeded": "超出预算",
   "Cancelled": "已取消"
  },
  "fanOutJoinPolicy": {
   "All": "全部",
   "Any": "任一",
   "Quorum": "法定数"
  },
  "resourceType": {
   "FanOutGroup": "扇出组"
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "扇出组"
  }
 },
 "components": {
  "fanOut": {
   "group": "扇出组",
   "groupTitle": "扇出组 {{id}}",
   "otherChildren": "其他子运行",
   "detailsUnavailable": "无法加载该组的详细信息，因此只列出其成员运行。",
   "policy": "汇合策略",
   "quorumPolicy": "{{policy}}：{{total}} 个中 {{quorum}} 个",
   "progress": "进度",
   "progressValue": "{{total}} 个中已结束 {{finished}} 个，成功 {{succeeded}} 个",
   "cost": "费用",
   "tokens": "Token 数",
   "usedOf": "{{used}} / {{limit}}",
   "noLimit": "{{used}}（无上限）",
   "deadline": "截止时间",
   "noDeadline": "无",
   "started": "开始时间",
   "completed": "结束时间",
   "pending": "仍在运行：{{labels}}",
   "failed": "未成功：{{labels}}",
   "live": "实时",
   "polling": "定时刷新",
   "cancel": "取消组",
   "cancelTitle": "取消扇出组",
   "confirmCancel": "要取消扇出组 {{id}} 吗？仍在运行的成员会被取消，父运行会看到该组已取消。",
   "cancelledToast": "已取消扇出组 {{id}}。",
   "columns": {
    "label": "标签",
    "agent": "代理",
    "status": "状态",
    "costUsd": "费用",
    "tokens": "Token 数",
    "run": "运行"
   }
  }
 },
 "common": {
  "serverText": {
   "fanOutParentEnded": "父运行已结束或已被取消。",
   "fanOutCostExceeded": "成员花费了 {{cost}} USD，超出了 {{budget}} USD 的预算。",
   "fanOutTokensExceeded": "成员使用了 {{tokens}} 个 Token，超出了 {{budget}} 的预算。",
   "fanOutTimedOut": "该组 {{seconds}} 秒的超时已到，仍有 {{running}} 个成员在运行。",
   "fanOutAnySucceeded": "有一个成员成功了。",
   "fanOutNoneSucceeded": "所有成员都已结束，没有一个成功。",
   "fanOutQuorumMet": "{{succeeded}} 个成员成功，达到了法定数 {{quorum}}。",
   "fanOutQuorumUnreachable": "失败的成员太多，已无法达到法定数 {{quorum}}。",
   "fanOutAllFinished": "所有成员都已结束。",
   "fanOutCancelledByTool": "父运行通过 garrison_cancel_fan_out 取消了该组。",
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
})(zhHans, {
 "nav": {
  "items": {
   "apps": {
    "label": "应用",
    "tip": "智能体应用：在同一个面向最终用户的聊天 UI 背后协作的一组智能体，以及它们的调用图、委派、修订和可分享的 URL。"
   }
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "租户用户",
   "AppUsers": "应用用户",
   "Anonymous": "匿名"
  },
  "resourceType": {
   "AgenticApp": "智能体应用"
  }
 },
 "errorCodes": {
  "AppSlugTaken": "另一个应用已在使用此 URL 短名。短名在整个集群中唯一，请另选一个。",
  "NoPublishedRevision": "没有可用的已发布修订。请先发布一个。",
  "AgentInUse": "此智能体是某个智能体应用的成员。请先将其从应用中移除。"
 },
 "common": {
  "fieldCodes": {
   "InvalidName": "请使用 1 到 64 个小写字母、数字和连字符，并以字母或数字开头和结尾。",
   "InvalidSlug": "请使用 2 到 63 个小写字母、数字和连字符，并以字母或数字开头。",
   "UnknownAgent": "此租户中没有该智能体。",
   "DuplicateMember": "每个智能体只能作为成员添加一次。",
   "EntryNotMember": "入口智能体必须是成员之一。",
   "EdgeNotMember": "调用的两端都必须是应用的成员。",
   "SelfEdge": "成员不能调用自身。",
   "AppGraphCycle": "成员之间的调用形成了循环。请移除循环中的一个调用。",
   "UnreachableMember": "每个成员都必须能从入口智能体沿调用到达。",
   "UnreachableMemberNamed": "入口智能体无法沿调用到达以下成员：{{names}}。请为每个成员添加调用，或将其移除。",
   "UnknownEnvironment": "租户中不存在此环境。",
   "InvalidEntryDeployment": "请选择入口智能体在此环境中的一个部署。",
   "DuplicateEnvironment": "每个环境只能列出一次。",
   "InvalidColor": "请使用 #RRGGBB 格式的颜色，例如 #1F6FEB。",
   "UnknownAsset": "此租户中没有该智能体资产。",
   "Required": "此字段为必填项。",
   "TooMany": "此处的项目过多。"
  },
  "serverText": {
   "appNameConflict": "名为 {{name}} 的应用已存在。",
   "appSlugTaken": "URL 短名 {{slug}} 已被占用。短名在整个集群中唯一，请另选一个。",
   "appNoPublishedRevision": "应用 {{name}} 没有可晋升的已发布修订。",
   "appMemberNotPublished": "成员 {{name}} 没有可固定的已发布修订。请先发布一个。",
   "appRevisionPublished": "应用 {{name}} 的修订 {{number}} 已发布。",
   "appNoTargetDeployments": "成员 {{member}} 在环境 {{environment}} 中没有部署。请先在那里创建一个。未晋升任何内容。",
   "agentInApps": "智能体 {{agent}} 是 {{apps}} 的成员。请先将其从应用中移除。"
  }
 },
 "components": {
  "form": {
   "pickColor": "为 {{field}} 选择颜色"
  },
  "apps": {
   "graph": {
    "empty": "添加成员后即可查看应用的图。",
    "summary": "包含 {{members}} 个成员和 {{edges}} 个调用的应用图",
    "edgeFanOut": "{{caller}} 调用 {{callee}}，也可同时发起多个调用",
    "edgeSingle": "{{caller}} 调用 {{callee}}，一次一个调用",
    "entryNode": "{{name}}，入口智能体",
    "unreachableNode": "{{name}}，入口智能体无法到达",
    "entry": "入口智能体",
    "unreachable": "不可到达",
    "legendFanOut": "允许并行调用",
    "legendSingle": "一次一个调用"
   },
   "share": {
    "noSlug": "为应用设置名称或 URL 短名后即可获得其链接。",
    "open": "打开",
    "copy": "复制应用 URL",
    "inactive": "应用已停用，在重新启用之前链接无法使用。",
    "signIn": {
     "TenantUsers": "此租户的任何启用用户都可以登录。",
     "AppUsers": "只有在此应用上拥有 AppUser 角色的用户才能登录。",
     "Anonymous": "任何拥有链接的人都无需登录即可使用此应用。已登录的用户也照常可用。",
     "AnonymousDisabled": "已选择匿名但未开启，因此不登录的人无法进入，并且只有拥有访问权限的租户用户才能登录。"
    }
   },
   "delegation": {
    "title": "基于应用图的委派",
    "intro": "应用的调用就是它的委派策略。每个成员应只允许它调用的成员，并且其最大深度应覆盖它下方最长的调用链。已发布修订与此不同的成员即为存在偏差。",
    "apply": "写入草稿",
    "applying": "正在写入草稿...",
    "applied": "已写入 {{drafts}} 个草稿修订；跳过了 {{skipped}} 个成员。",
    "appliedSummary": "已写入 {{drafts}} 个草稿修订，未发布任何内容。跳过了 {{skipped}} 个成员。请在每个智能体的“修订”选项卡中查看并发布草稿。",
    "drifting_one": "{{count}} 个成员的已发布委派与图不一致。",
    "drifting_other": "{{count}} 个成员的已发布委派与图不一致。",
    "inSync": "所有成员的已发布委派都与图一致。",
    "empty": "此应用没有成员。",
    "notPublished": "未发布",
    "drift": "有偏差",
    "inSyncBadge": "一致",
    "draftConflict": "草稿冲突",
    "draft": "草稿 {{number}}",
    "review": "草稿尚未生效。请打开每个智能体，在其“修订”选项卡中查看草稿并发布。",
    "columns": {
     "member": "成员",
     "desiredMode": "图中的模式",
     "desiredAllowList": "图中的允许列表",
     "desiredMaxDepth": "图中的深度",
     "publishedMode": "已发布的模式",
     "publishedAllowList": "已发布的允许列表",
     "publishedMaxDepth": "已发布的深度",
     "status": "状态"
    }
   },
   "revisions": {
    "title": "应用修订",
    "intro": "应用修订会固定每个成员最新发布的修订，并复制成员之间的调用。先发布，再晋升，即可将所有成员一起移到下一个环境。",
    "changeNote": "变更说明",
    "changeNotePlaceholder": "自上一个修订以来更改了什么",
    "take": "创建修订",
    "taking": "正在创建...",
    "taken": "已创建应用修订 {{number}}。",
    "published": "已发布应用修订 {{number}}。",
    "empty": "还没有应用修订。当每个成员都有已发布修订时即可创建。",
    "promote": "晋升",
    "publish": "发布",
    "publishTitle": "发布应用修订 {{number}}",
    "publishConfirm": "要发布 {{name}} 的修订 {{number}} 吗？已发布的修订无法更改，并将成为晋升默认使用的修订。",
    "pin": "{{name}}（修订 {{number}}）",
    "columns": {
     "number": "修订",
     "state": "状态",
     "members": "已固定的成员",
     "edges": "调用",
     "author": "作者",
     "changeNote": "变更说明",
     "publishedUtc": "发布时间",
     "actions": "操作"
    }
   },
   "promote": {
    "title": "晋升应用",
    "intro": "每个成员已固定的修订会一步应用到该成员在目标环境中的所有部署。如果某个成员在那里没有部署，则不会移动任何内容。",
    "revision": "应用修订",
    "latestRevision": "最新发布",
    "promoted": "已将应用晋升到 {{target}}：已更新 {{deployments}} 个部署。",
    "denied": "你无权晋升到 {{target}}。晋升需要对目标环境的“晋升”拥有“执行”权限。"
   }
  }
 },
 "resources": {
  "apps": {
   "title": "应用",
   "subtitle": "在同一个面向最终用户的聊天 UI 背后协作的一组智能体。入口智能体与用户对话，并沿应用的调用关系调用其他成员。",
   "add": "添加应用",
   "create": "创建应用",
   "edit": "编辑应用",
   "view": "应用详情",
   "deleteTitle": "删除应用",
   "emptyTitle": "暂无应用",
   "emptyBody": "用现有的智能体创建应用：选择成员、与用户对话的入口智能体，以及谁调用谁。",
   "columns": {
    "name": "名称",
    "url": "应用 URL",
    "entryAgentId": "入口智能体",
    "members": "成员",
    "liveEnvironment": "当前环境",
    "authMode": "登录",
    "active": "状态",
    "description": "描述",
    "id": "应用 ID",
    "lastUpdateUtc": "更新时间",
    "createdUtc": "创建时间"
   },
   "fields": {
    "name": "名称",
    "slug": "URL 短名",
    "description": "描述",
    "active": "启用",
    "members": "成员",
    "membersItems": {
     "agentId": "智能体",
     "role": "职责"
    },
    "entryAgentId": "入口智能体",
    "edges": "成员之间的调用",
    "edgesItems": {
     "callerAgentId": "调用方",
     "calleeAgentId": "被调用方",
     "fanOutAllowed": "允许并行调用"
    },
    "graph": "图",
    "environments": "各环境的入口部署",
    "environmentsItems": {
     "environment": "环境",
     "deploymentId": "入口部署"
    },
    "liveEnvironment": "当前环境",
    "authMode": "谁可以使用此应用",
    "anonymousEnabled": "允许匿名使用",
    "showOperatorDetail": "向最终用户显示工具调用和思考过程",
    "share": "分享链接",
    "displayName": "显示名称",
    "logoAssetId": "徽标",
    "primaryColor": "主色",
    "accentColor": "强调色",
    "welcomeText": "欢迎文本"
   },
   "hints": {
    "slug": "应用位于 /apps/{slug}/。留空则使用名称。短名在整个集群中唯一。",
    "members": "应用中的智能体。职责是对每个智能体作用的简短说明。",
    "entryAgentId": "与最终用户对话的成员。其他每个成员都必须能从它到达。",
    "edges": "谁可以调用谁。调用不能形成循环，它们会成为每个成员的委派策略。",
    "environments": "应用在每个环境中使用的入口智能体部署。未设置时，应用使用入口智能体在该环境中按名称排序的第一个启用的部署。",
    "liveEnvironment": "应用 UI 所连接的环境。",
    "anonymousEnabled": "匿名登录需要开启此项。匿名会话时间较短，并受速率限制。",
    "showOperatorDetail": "最终用户始终能看到回答、结果和错误。开启后还会显示工具调用、思考过程和进度。",
    "logoAssetId": "资产当前版本中的第一张图片。",
    "welcomeText": "在最终用户发送第一条消息之前显示。"
   },
   "steps": {
    "general": "应用",
    "members": "成员和调用",
    "environments": "环境",
    "access": "登录和链接",
    "branding": "品牌"
   },
   "actions": {
    "delegation": "委派",
    "revisions": "修订和晋升"
   },
   "errors": {
    "nameTaken": "此租户中的另一个应用已在使用此名称。"
   },
   "addMember": "添加成员",
   "addEdge": "添加调用",
   "addEnvironment": "添加环境",
   "chooseAgent": "选择智能体",
   "chooseEntry": "选择成员",
   "rolePlaceholder": "此成员的职责",
   "noEntryDeployment": "第一个启用的部署",
   "noLogo": "无徽标",
   "displayNamePlaceholder": "显示在应用的页眉中"
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
})(zhHans, {
 "nav": {
  "items": {
   "studio": {
    "label": "工作室",
    "tip": "智能体工作室：与智能体架构师一起在草稿中设计智能体和应用，在试验场中试用，并申请应用草稿。"
   }
  }
 },
 "enums": {
  "resourceType": {
   "StudioDraft": "工作室草稿"
  },
  "approvalKind": {
   "DraftApply": "应用草稿"
  },
  "studioDraftStatus": {
   "Open": "可编辑",
   "PendingApproval": "等待审批",
   "Applied": "已应用",
   "Discarded": "已丢弃"
  },
  "studioDraftOperation": {
   "Upsert": "创建或更新",
   "Delete": "删除"
  },
  "studioDiffChange": {
   "Create": "创建",
   "Update": "更新",
   "Delete": "删除",
   "Unchanged": "无变化",
   "Failed": "失败"
  }
 },
 "errorCodes": {
  "DraftVersionConflict": "你读取草稿之后它已发生变化。请重新读取后重试。",
  "DraftNotOpen": "此草稿不处于可编辑状态，因此无法更改。只有可编辑的草稿才能修改。",
  "DraftStale": "草稿所基于的实时配置已发生变化。请变基过时的项目，然后重新申请应用。",
  "DraftInvalid": "草稿中有未通过验证的文档。请先修复标记为“失败”的项目。",
  "DraftEmpty": "草稿中没有任何项目，因此没有可应用的内容。",
  "ApproverLacksPermission": "你无权批准此草稿：批准它需要对 Manifest 的创建权限，以及对草稿所删除的每个类别的删除权限。",
  "AgentNotLive": "该智能体是此草稿中新增的。请先应用草稿，再在试验场中试用该智能体。",
  "NotAnArchitectDeployment": "只有架构师部署才能使用架构师提示词，即 agent-architect 的部署或拥有草稿访问权限的部署。",
  "InvalidArchitectPrompt": "该提示词不能用作架构师提示词。请选择此租户的 System 模板。",
  "PromptTemplateInUse": "此提示词模板已被部署绑定。请先将这些部署切换到其他模板。",
  "ReservedEnvironment": "草稿（draft）环境保留给试验场使用。",
  "NoDeploymentInEnvironment": "该智能体在此环境中没有部署。"
 },
 "views": {
  "studio": {
   "title": "工作室",
   "subtitle": "在草稿中设计智能体和应用。在有人批准应用草稿之前，实时配置不会发生任何变化。",
   "newDraft": "新建草稿",
   "refresh": "刷新",
   "search": "搜索标题",
   "scopeLabel": "草稿归属",
   "scopes": {
    "mine": "我的",
    "all": "全部"
   },
   "statusLabel": "状态",
   "columns": {
    "title": "标题",
    "status": "状态",
    "owner": "所有者",
    "targetApp": "目标应用",
    "items": "项目",
    "version": "版本",
    "updated": "更新时间"
   },
   "open": "打开",
   "discard": "丢弃",
   "discardTitle": "丢弃草稿",
   "discardMessage": "要丢弃 {{title}} 吗？丢弃后的草稿将无法再更改或应用。",
   "discardPendingMessage": "要丢弃 {{title}} 吗？其应用审批将被取消，草稿将无法再更改或应用。",
   "discarded": "已丢弃 {{title}}。",
   "emptyTitle": "没有草稿",
   "emptyBody": "从空白或现有应用开始一个草稿，并与智能体架构师一起设计它。",
   "emptyFiltered": "没有符合这些筛选条件的草稿。",
   "untitled": "未命名草稿"
  },
  "studioDraft": {
   "title": "工作室草稿",
   "notFoundTitle": "未找到草稿",
   "notFoundBody": "该草稿不存在，或者你无权读取它。",
   "back": "全部草稿",
   "version": "版本 {{version}}",
   "live": "实时",
   "polling": "轮询中",
   "architect": "架构师",
   "tabsLabel": "草稿工作区",
   "tabs": {
    "architect": "架构师",
    "items": "项目",
    "graph": "关系图",
    "apply": "差异与应用",
    "playground": "试验场",
    "preview": "编译预览",
    "prompts": "架构师提示词"
   },
   "notOpen": {
    "PendingApproval": "此草稿正在等待是否应用的决定，因此无法更改。拒绝审批或丢弃草稿后即可再次更改。",
    "Applied": "此草稿已应用到实时配置，无法再更改。如需进一步更改，请新建草稿。",
    "Discarded": "此草稿已被丢弃，无法再更改。",
    "other": "此草稿目前无法更改。"
   },
   "liveNotice": "草稿已更新到版本 {{version}}（{{status}}）。",
   "liveChanged": "已更改：{{items}}。",
   "removedTag": "已移除",
   "dismissNotice": "关闭"
  }
 },
 "components": {
  "studio": {
   "newDraft": {
    "title": "新建草稿",
    "intro": "草稿中存放由你和智能体架构师编辑的清单文档。可以从空白开始，也可以从现有应用及其引用的所有内容开始。",
    "titleField": "标题",
    "titlePlaceholder": "带撰稿人的研究应用",
    "fromApp": "从应用开始",
    "emptyDraft": "空白草稿",
    "fromAppHint": "应用、其成员、成员的部署、提示词和资产都会成为项目。每个项目都会记住它所基于的实时版本，以便工作室发现之后的变化。",
    "create": "创建草稿",
    "creating": "正在创建...",
    "created": "已开始草稿 {{title}}。"
   },
   "architect": {
    "title": "新建架构师",
    "intro": "智能体架构师在你的草稿中设计智能体和应用。请为它提供一个部署：Harness 配置文件、模型以及它使用的提示词。它只编辑你的草稿，从不应用草稿。",
    "name": "部署名称",
    "harnessProfile": "Harness 配置文件",
    "chooseProfile": "选择 Harness 配置文件",
    "model": "模型",
    "modelHint": "留空则使用 Harness 配置文件的默认模型。",
    "prompt": "架构师提示词",
    "defaultPrompt": "{{name}}（默认）",
    "preview": "提示词预览",
    "previewEmpty": "选择一个提示词即可查看渲染结果。",
    "cloneLink": "克隆此提示词以进行修改",
    "noAgent": "此租户没有名为 {{name}} 的智能体，因此无法创建架构师。请联系管理员。",
    "create": "创建架构师",
    "creating": "正在创建...",
    "created": "已创建架构师 {{name}}。"
   },
   "chat": {
    "title": "架构师",
    "architect": "架构师部署",
    "chooseArchitect": "选择架构师",
    "newArchitect": "新建架构师",
    "noArchitect": "还没有架构师部署。请先创建一个，以便与智能体架构师一起设计。",
    "openConversation": "打开对话",
    "newConversation": "新对话",
    "you": "你",
    "architectSays": "架构师",
    "openRun": "运行",
    "thinking": "正在处理...",
    "empty": "告诉架构师要构建什么。第一条消息会告诉它在哪个草稿中工作。",
    "pickFirst": "请选择或创建一个架构师以开始。",
    "message": "消息",
    "placeholder": "设计一个研究应用：由规划者把任务分发给两名研究员和一名撰稿人。",
    "firstHint": "就此草稿与该架构师开始一段对话。",
    "continueHint": "继续对话。按 Ctrl+Enter 或 Cmd+Enter 发送。",
    "send": "发送"
   },
   "items": {
    "title": "项目",
    "titleCount": "项目（{{total}}）",
    "add": "添加项目",
    "addConfirm": "打开编辑器",
    "columns": {
     "kind": "类别",
     "name": "名称",
     "operation": "操作",
     "stale": "已过时",
     "updated": "更新时间"
    },
    "stale": "已过时",
    "empty": "还没有项目。添加一个，或者让架构师来做。",
    "remove": "移除",
    "removeTitle": "移除项目",
    "removeMessage": "要从草稿中移除 {{item}} 吗？实时配置不会改变。",
    "removed": "已移除 {{item}}。",
    "saved": "已保存 {{item}}。草稿当前为版本 {{version}}。",
    "editorTitle": "编辑 {{item}}",
    "newEditorTitle": "新项目 {{item}}",
    "document": "清单文档",
    "versionHint": "保存时会发送你读取的版本 {{version}}。如果此后草稿已更改，保存会被拒绝，你的文本仍会保留在这里。",
    "unsaved": "未保存的更改",
    "errors": {
     "name": "请使用字母、数字、点、斜杠和连字符，并以字母或数字开头。",
     "exists": "草稿中已存在 {{kind}}/{{name}}。",
     "deleteKind": "只有 Agent、Deployment、Pipeline 和 AgenticApp 项目可以删除，{{kind}} 不行。"
    },
    "conflict": {
     "title": "你编辑期间草稿已更改：版本 {{from}} 现在是 {{to}}。",
     "added": "新增：{{items}}",
     "updated": "已编辑：{{items}}",
     "removed": "已移除：{{items}}",
     "status": "其状态现在是 {{status}}。",
     "layout": "只有关系图布局发生了变化。",
     "mine": "你正在编辑的项目也已更改。再次保存前，请将你的文本与新版本进行比较。",
     "retry": "你的文本仍在编辑器中。再次保存即可将其应用到新版本。",
     "dismiss": "关闭"
    }
   },
   "graph": {
    "title": "关系图",
    "empty": "草稿中还没有可绘制的应用或智能体。",
    "depth": "深度 {{depth}}",
    "entryAgent": "入口智能体：{{name}}",
    "deleted": "将删除",
    "inDraft": "在草稿中",
    "loose": "不属于任何应用的智能体",
    "capabilities": "能力：{{list}}",
    "legend": "每次调用都标有它所需的委派深度。实线表示允许并行调用，虚线表示一次只能调用一次。能力显示在智能体名称下方。"
   },
   "diff": {
    "title": "差异与应用",
    "refresh": "刷新差异",
    "validate": "验证",
    "validating": "正在验证...",
    "requestApply": "申请应用",
    "requesting": "正在申请...",
    "requested": "已申请应用。将由有权应用清单的人作出决定。",
    "valid": "有效：{{create}} 个待创建，{{update}} 个待更新，{{delete}} 个待删除，{{unchanged}} 个无变化。",
    "invalid": "无效：{{failed}} 个失败，{{stale}} 个已过时。计划：{{create}} 个待创建，{{update}} 个待更新，{{delete}} 个待删除，{{unchanged}} 个无变化。",
    "validOk": "草稿有效。",
    "validFailed": "草稿无效。请查看标记为“失败”或“已过时”的项目。",
    "empty": "草稿中没有可比较的项目。",
    "columns": {
     "item": "项目",
     "change": "变化",
     "details": "详细信息"
    },
    "none": "（无）",
    "approval": "应用审批",
    "allow": "批准",
    "deny": "拒绝",
    "allowed": "已批准。正在应用草稿。",
    "denied": "已拒绝。草稿已重新变为可编辑。",
    "reason": "原因",
    "reasonPlaceholder": "可选，与决定一起保存",
    "waiting": "正在等待有权决定审批并应用清单的人。",
    "applied": "已作为清单应用 {{id}} 完成应用。"
   },
   "playground": {
    "title": "试验场",
    "intro": "每一轮都会把草稿中该智能体的文档保存为其草稿修订版本，并在临时的试验场部署上运行。不会发布任何内容，实时配置也不会改变。",
    "agent": "智能体",
    "defaultAgent": "入口智能体（{{name}}）",
    "defaultAgentShort": "入口智能体",
    "input": "输入",
    "answer": "回答",
    "placeholder": "希望智能体做什么？",
    "firstHint": "开始一段试验场对话。",
    "continueHint": "继续试验场对话。",
    "send": "运行本轮",
    "turn": "第 {{number}} 轮，{{agent}}",
    "openRun": "运行详情",
    "conversation": "对话",
    "export": "下载对话记录",
    "reset": "新对话",
    "empty": "还没有任何轮次。",
    "exportDraft": "草稿",
    "exportTurn": "轮次",
    "exportRun": "运行"
   },
   "preview": {
    "title": "编译预览",
    "intro": "在部署之前查看运行启动时的内容：命令行、资产的放置位置以及文件空间挂载。机密值会被隐去。",
    "deployment": "部署",
    "chooseDeployment": "选择部署",
    "revision": "智能体修订版本",
    "deploymentRevision": "部署自身的修订版本",
    "revisionOption": "修订版本 {{number}}（{{state}}）",
    "environment": "环境",
    "deploymentEnvironment": "部署所在的环境",
    "input": "示例输入",
    "compiled": "已使用 {{revision}} 编译 {{deployment}}。",
    "assets": "放置的资产（{{total}}）",
    "noAssets": "该修订版本不放置任何资产。",
    "columns": {
     "path": "路径",
     "asset": "资产",
     "kind": "类别",
     "version": "版本",
     "size": "大小"
    },
    "fileSpace": "文件空间",
    "fileSpaceMount": "挂载于 {{path}}，目前有 {{files}} 个文件（最多 {{maxFiles}} 个文件，每个最大 {{maxBytes}}）。",
    "noFileSpace": "由于该运行不属于任何对话，因此不会挂载文件空间。",
    "redacted": "服务器会隐去命令行、环境和文件中的机密值。"
   },
   "prompts": {
    "title": "架构师提示词",
    "templatesLink": "在提示词模板中打开",
    "forArchitect": "智能体架构师可用的提示词。请为 {{architect}} 选择一个。",
    "noArchitect": "智能体架构师可用的提示词。请先在“架构师”选项卡中选择一个架构师，再为其选择提示词。",
    "nextTurn": "新的选择或已保存的编辑将从架构师的下一轮开始生效。",
    "current": "{{architect}} 使用 {{name}}，跟随其当前版本（{{version}}）。",
    "currentPinned": "{{architect}} 使用 {{name}}，固定在版本 {{version}}。",
    "inUse": "{{name}} 正被以下部署使用，因此无法删除：{{deployments}}。请先为它们选择其他提示词。",
    "empty": "没有架构师提示词。",
    "columns": {
     "name": "名称",
     "description": "描述",
     "version": "版本",
     "usedBy": "使用者"
    },
    "default": "默认",
    "selectedBadge": "已选择",
    "usedBy": "架构师：{{total}}",
    "select": "选择",
    "selected": "{{architect}} 将从下一轮开始使用 {{name}}。",
    "saved": "已将 {{name}} 保存为新版本。",
    "editorTitle": "编辑 {{name}}（版本 {{version}}）",
    "name": "名称",
    "description": "描述",
    "body": "提示词正文",
    "preview": "渲染预览",
    "deleteMessage": "要删除 {{name}} 吗？使用它的架构师部署：{{total}}。正在使用的提示词无法删除。"
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
})(zhHans, {
 "components": {
  "studio": {
   "canvas": {
    "title": "画布",
    "appPicker": "应用",
    "flowLabel": "应用 {{app}} 的画布",
    "noApp": "草稿中还没有应用。请让架构师创建一个，或从现有应用开始一个草稿。",
    "calls": "调用（{{total}}）",
    "noCalls": "还没有调用。从一个智能体的右边缘拖到另一个智能体，或在一个智能体上按 C，再在另一个上按 Enter。",
    "addLoose": "添加到应用",
    "remove": "从应用中移除",
    "removeTitle": "从应用中移除智能体",
    "removeMessage": "要从 {{app}} 中移除 {{name}} 吗？它的调用也会一并移除。智能体本身会保留，在应用草稿之前实时配置不会改变。",
    "operationFailed": "{{operation}}被拒绝。",
    "operations": {
     "AddMember": "添加智能体",
     "RemoveMember": "移除智能体",
     "Connect": "连接",
     "Disconnect": "断开连接",
     "SetEntry": "设置入口智能体",
     "MoveNode": "移动智能体"
    },
    "toolbar": {
     "label": "画布操作",
     "addAgent": "添加智能体",
     "addPlaceholder": "智能体名称",
     "role": "角色",
     "rolePlaceholder": "角色（可选）",
     "add": "添加",
     "connect": "从此处连接",
     "setEntry": "设为入口智能体",
     "remove": "移除",
     "disconnect": "断开连接",
     "fit": "适合视图"
    },
    "connectBar": {
     "message": "正在从 {{name}} 连接。请选择它调用的智能体：点击它、在它上面按 Enter，或在这里选择。",
     "to": "调用",
     "fanOut": "并行调用",
     "confirm": "连接"
    },
    "keys": {
     "title": "键盘快捷键",
     "tab": "Tab 按阅读顺序在智能体之间移动，从入口智能体开始。",
     "select": "Enter 或 Space 选中当前聚焦的智能体并打开其属性。",
     "connect": "在一个智能体上按 C 开始从它发起调用；在另一个智能体上按 C 或 Enter 完成。",
     "entry": "E 将当前聚焦的智能体设为入口智能体。",
     "remove": "Delete 在确认后将当前聚焦的智能体从应用中移除。",
     "move": "方向键移动选中的智能体；按住 Shift 可移动更大步长。位置会在短暂停顿后保存。",
     "add": "N 跳转到“添加智能体”输入框。",
     "calls": "在调用列表中，Enter 选中调用，Delete 断开它，F 开启或关闭并行调用。",
     "escape": "Escape 取消你开始的调用。"
    },
    "node": {
     "entry": "入口",
     "unreachable": "不可达",
     "connecting": "从此处调用"
    },
    "a11y": {
     "node": "按 Enter 或 Space 选中此智能体，然后用方向键移动它。按 C 连接它，按 E 设为入口智能体，按 Delete 移除它。",
     "edge": "两个智能体之间的调用。请在画布下方的调用列表中选中它。",
     "handle": "连接点",
     "moved": "已将智能体向{{direction}}移动。新位置：{{x}}, {{y}}。",
     "directions": {
      "up": "上",
      "down": "下",
      "left": "左",
      "right": "右"
     }
    },
    "announce": {
     "added": "已将 {{name}} 添加到 {{app}}。",
     "connectStart": "正在从 {{name}} 连接。移到它调用的智能体上按 Enter，或按 Escape 取消。",
     "connectCancelled": "已取消连接。",
     "connected": "{{from}} 现在调用 {{to}}。",
     "disconnected": "{{from}} 不再调用 {{to}}。",
     "fanOutOn": "{{from}} 现在可以并行调用 {{to}}。",
     "fanOutOff": "{{from}} 现在一次调用 {{to}} 一次。",
     "entry": "{{name}} 现在是 {{app}} 的入口智能体。",
     "removed": "已从 {{app}} 中移除 {{name}}。",
     "selfEdge": "智能体不能调用自身。请选择另一个智能体。"
    },
    "summary": {
     "noApp": "没有可描述的应用。",
     "agents_one": "应用 {{app}} 有 {{count}} 个智能体。",
     "agents_other": "应用 {{app}} 有 {{count}} 个智能体。",
     "callCount_one": "它们之间有 {{count}} 个调用。",
     "callCount_other": "它们之间有 {{count}} 个调用。",
     "entry": "入口智能体是 {{name}}。",
     "noEntry": "未设置入口智能体。",
     "callParallel": "{{from}} 调用 {{to}}，允许并行调用，委派深度 {{depth}}。",
     "callSingle": "{{from}} 调用 {{to}}，一次一个调用，委派深度 {{depth}}。"
    },
    "conflict": {
     "mine": "{{item}} 也已更改。你的编辑仍在面板中；再次保存前请与新版本进行比较。",
     "kept": "你对 {{item}} 的编辑仍在面板中。再次保存即可将其应用到新版本。",
     "operation": "{{operation}}未被应用。请在新版本上重试，或保持不变。",
     "retry": "重试"
    },
    "panel": {
     "label": "属性",
     "tabsLabel": "{{name}} 的属性",
     "properties": "智能体",
     "runtime": "运行时",
     "save": "保存到草稿",
     "reset": "撤销更改",
     "saved": "已保存 {{item}}。可在“差异与应用”中查看更改。",
     "check": "服务器对此项目的检查：{{message}}",
     "unparsable": "此项目的 YAML 无法解析，因此面板无法更改它。请先在“项目”选项卡中修复。（{{message}}）"
    },
    "agent": {
     "title": "智能体 {{name}}",
     "isEntry": "这是应用的入口智能体：它与使用应用的人对话。",
     "notHeld": "草稿中还没有 {{name}} 的文档。将其引入草稿即可在此编辑；实时配置不会改变。",
     "deleted": "草稿会删除 {{name}}。请在“项目”选项卡中恢复它后再编辑。",
     "bring": "引入草稿",
     "description": "描述",
     "inputSchema": "输入架构",
     "outputSchema": "输出架构",
     "schemaHint": "以 JSON 编写的 JSON Schema。留空表示纯文本。",
     "assets": "资产",
     "noAssets": "下一个修订版本不固定任何资产。",
     "assetsKept": "文档未指定资产，因此智能体保留现有资产。",
     "assetName": "资产名称",
     "assetVersion": "版本",
     "latest": "最新",
     "removeAsset": "移除资产 {{name}}",
     "addAsset": "添加资产",
     "capabilities": "能力",
     "capabilitiesHint": "名称之间用逗号分隔。空列表会清除它们。",
     "capabilitiesKept": "名称之间用逗号分隔。留空时，智能体保留现有能力。",
     "systemPrompt": "系统提示词",
     "noDeployments": "草稿中没有此智能体的部署，因此这里没有设置系统提示词。",
     "promptLine": "{{environment}}：{{deployment}} 使用 {{prompt}}",
     "builtInPrompt": "内置默认值",
     "showRuntime": "在“运行时”选项卡中编辑",
     "errors": {
      "json": "这不是有效的 JSON。",
      "object": "架构是一个 JSON 对象，例如 {\"type\": \"object\"}。",
      "version": "请使用整数，或留空以使用最新版本。"
     }
    },
    "edge": {
     "title": "从 {{from}} 到 {{to}} 的调用",
     "from": "调用方",
     "to": "被调用方",
     "depth": "委派深度",
     "depthHint": "由关系图推导：1 加上 {{to}} 之下最长的调用链。其下的调用变化时它也会变化。",
     "fanOut": "并行调用（扇出）",
     "fanOutOn": "{{from}} 可以同时对 {{to}} 发起多个调用。",
     "fanOutOff": "{{from}} 一次调用 {{to}} 一次。"
    },
    "app": {
     "title": "应用 {{name}}",
     "hint": "在画布上选择一个智能体或调用来编辑它。未选择任何内容时，此面板编辑应用。",
     "entry": "入口智能体",
     "noEntry": "无入口智能体",
     "noMembers": "请先添加一个智能体；第一个智能体会成为入口智能体。",
     "notHeld": "草稿中还没有 {{name}} 的文档。将其引入草稿即可在此编辑登录和品牌设置。",
     "deleted": "草稿会删除 {{name}}。请在“项目”选项卡中恢复它后再编辑。",
     "bring": "引入草稿",
     "description": "描述",
     "authMode": "登录",
     "authDefault": "服务器默认值",
     "anonymous": "允许匿名使用",
     "branding": "品牌",
     "brandingFields": {
      "displayName": "显示名称",
      "logo": "徽标资产",
      "primaryColor": "主色",
      "accentColor": "强调色",
      "welcomeText": "欢迎文字"
     },
     "errors": {
      "color": "请使用十六进制颜色，例如 #1F6FEB。"
     }
    },
    "runtime": {
     "title": "{{name}} 的运行时",
     "none": "草稿中没有 {{name}} 的部署。请从下方引入一个实时部署，或让架构师创建一个。",
     "deployment": "环境和部署",
     "option": "{{environment}}：{{name}}",
     "scope": "编辑只会更改 {{environment}} 中的 {{name}}（Harness 配置文件 {{profile}}）。其他环境保留各自的值。",
     "fields": {
      "model": "模型",
      "effort": "推理强度",
      "timeoutSeconds": "时间限制（秒）",
      "maxTurns": "最大轮次",
      "maxBudgetUsd": "预算（USD）",
      "systemTemplate": "系统提示词模板",
      "systemVersion": "固定版本",
      "approvalsEnabled": "工具调用需要审批",
      "approvalDefaultAction": "没有规则匹配时"
     },
     "hints": {
      "timeoutSeconds": "整数秒，1 或以上。留空则使用 Harness 配置文件的限制。",
      "maxTurns": "整数，1 或以上。留空表示由 Harness 决定。",
      "maxBudgetUsd": "0 或以上，例如 2.50。留空表示没有预算限制。"
     },
     "builtIn": "内置默认值",
     "approvals": "审批",
     "noRules": "没有规则。所有工具调用都采用默认操作。",
     "rule": {
      "action": "操作",
      "pattern": "工具模式",
      "inputPattern": "输入模式",
      "inputPlaceholder": "输入模式（可选）",
      "remove": "移除规则 {{number}}",
      "add": "添加规则"
     },
     "live": "不在草稿中的实时部署",
     "noLive": "此智能体的所有实时部署都已在草稿中，或者它没有实时部署。",
     "bring": "引入草稿",
     "exportMissing": "{{name}} 的导出结果中没有文档。",
     "errors": {
      "integer": "请使用 1 或以上的整数。",
      "number": "请使用 0 或以上的数字。",
      "pattern": "规则需要一个工具模式。",
      "version": "请使用整数，并指定要固定的模板。"
     }
    }
   }
  }
 },
 "common": {
  "fieldCodes": {
   "NotAMember": "该智能体不是此应用的成员。",
   "SelfEdge": "智能体不能调用自身。",
   "NoSuchEdge": "应用中没有这样的调用。",
   "AppDeleted": "草稿会删除此应用。请先恢复它。",
   "InvalidDocument": "该文档无法解析为单个清单文档。",
   "DocumentMismatch": "文档的类型或名称与项目不匹配。"
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
})(zhHans, {
 "common": {
  "productName": "Garrison Agent Studio",
  "productLine": "Agent Studio",
  "states": {
   "studioHint": "或者打开智能体工作室，描述你的需求：智能体架构师会起草，由你审阅。",
   "openStudio": "打开智能体工作室"
  }
 },
 "nav": {
  "items": {
   "studio": {
    "label": "智能体工作室"
   },
   "serverInfo": {
    "label": "关于",
    "tip": "产品、版本、链接、端点和你的身份"
   }
  }
 },
 "wizard": {
  "steps": {
   "studio": "智能体工作室"
  },
  "welcomeItemStudio": "为智能体架构师指定 Harness 和模型，让它在智能体工作室中与你一起设计智能体和应用（可选）。",
  "studioBody": "智能体架构师在智能体工作室中与你一起设计智能体和应用。请选择它运行所用的 Harness 配置文件和模型，以及指导它的架构师提示词。它的部署只能编辑你的工作室草稿。你可以跳过此步，稍后在工作室中创建架构师。",
  "createArchitect": "创建架构师",
  "architectCreated": "已创建智能体架构师 {{name}}。",
  "architectReady": "智能体架构师 {{name}} 已就绪。设置完成后，打开智能体工作室并用它开始一个草稿。",
  "continue": "继续"
 },
 "views": {
  "home": {
   "getStartedBody": "设置向导会添加凭据，为智能体架构师指定 Harness 和模型，应用一个示例智能体并运行测试。也可以打开智能体工作室，描述你想要的应用。",
   "openStudio": "打开智能体工作室"
  },
  "studio": {
   "title": "智能体工作室"
  },
  "studioDraft": {
   "tabs": {
    "release": "发布"
   }
  },
  "serverInfo": {
   "title": "关于",
   "subtitle": "版本、链接、端点以及你当前登录所用的身份。",
   "positioning": "用你已在使用的智能体 Harness 构建、部署和运行智能体应用。",
   "versions": "服务器版本 {{server}}，控制台版本 {{dashboard}}",
   "docs": "文档",
   "studioDocs": "智能体工作室指南",
   "website": "网站",
   "source": "源代码"
  }
 },
 "resources": {
  "apps": {
   "actions": {
    "environments": "环境"
   }
  }
 },
 "components": {
  "apps": {
   "release": {
    "title": "环境和晋升",
    "intro": "每个成员在各环境中的部署，以及每个部署固定的修订和环境变量覆盖。晋升前可比较两个环境，也可以从历史记录中回滚某次晋升。",
    "live": "在 {{environment}} 中上线",
    "environments": "环境",
    "source": "比较",
    "target": "与",
    "member": "成员",
    "entry": "入口",
    "noDeployment": "无部署",
    "secretOverride": "{{name}}（机密）",
    "difference": "{{source}} 到 {{target}}",
    "differenceNone": "差异",
    "diff": {
     "Same": "相同",
     "Missing": "{{target}} 中无部署",
     "revisions": "修订不同",
     "overrides": "覆盖不同",
     "both": "修订和覆盖都不同"
    },
    "promote": "从 {{source}} 晋升到 {{target}}",
    "promoteNothing": "晋升",
    "missing": "{{target}} 中没有部署：{{names}}。现在晋升会失败，什么也不会移动；请先在那里添加部署。",
    "history": "晋升历史",
    "historyEmpty": "此应用尚未晋升过。"
   }
  },
  "studio": {
   "release": {
    "title": "发布",
    "app": "应用",
    "noAppsTitle": "此草稿不构建任何应用",
    "noAppsBody": "在关系图选项卡中或请架构师向草稿添加一个应用，应用草稿后即可在此晋升。",
    "notLiveTitle": "{{name}} 尚未上线",
    "notLiveBody": "请先应用草稿。应用后会发布其智能体并部署到 dev；之后即可在此晋升该应用。"
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
})(zhHans, {
 "nav": {
  "items": {
   "architects": {
    "label": "架构师",
    "tip": "代理架构师：可复用的代理架构师部署，可在任意工作室草稿中与你一起设计代理和应用。"
   }
  }
 },
 "resources": {
  "architects": {
   "title": "架构师",
   "subtitle": "此租户中的代理架构师。每个都是 agent-architect 的一个部署，拥有自己的 Harness 配置文件、模型和提示词，任意工作室草稿都可以使用。",
   "add": "添加架构师",
   "create": "创建架构师",
   "edit": "编辑架构师",
   "view": "架构师详情",
   "deleteTitle": "删除架构师",
   "emptyTitle": "暂无架构师",
   "emptyBody": "创建一个架构师，在代理工作室中与你一起设计代理和应用。选择它运行所用的 Harness 配置文件和模型，以及它使用的提示词。",
   "columns": {
    "name": "名称",
    "harnessProfileId": "Harness 配置文件",
    "model": "模型",
    "architectPromptTemplateId": "架构师提示词",
    "active": "状态",
    "description": "描述",
    "id": "ID",
    "lastUpdateUtc": "更新时间",
    "createdUtc": "创建时间"
   },
   "fields": {
    "name": "名称",
    "description": "描述",
    "harnessProfileId": "Harness 配置文件",
    "model": "模型",
    "architectPromptTemplateId": "架构师提示词",
    "architectPromptVersion": "固定的提示词版本",
    "active": "启用"
   },
   "hints": {
    "model": "留空则使用 Harness 配置文件的默认模型。",
    "architectPromptTemplateId": "架构师使用的 System 模板。更改从其下一轮开始生效。",
    "architectPromptVersion": "留空则跟随提示词的当前版本，保存的编辑会从下一轮开始生效。"
   },
   "actions": {
    "prompts": "架构师提示词",
    "deployment": "部署设置"
   },
   "errors": {
    "nameTaken": "此租户中的另一个部署已在使用此名称。",
    "version": "请输入从 1 开始的整数，或留空。"
   },
   "promptPinned": "{{name}}（版本 {{version}}）",
   "defaultModel": "配置文件默认",
   "defaultBadge": "默认",
   "promptsTitle": "{{name}} 的架构师提示词"
  }
 },
 "components": {
  "studio": {
   "chat": {
    "manageArchitects": "管理架构师"
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
})(zhHans, {
 "components": {
  "confirm": {
   "typeToConfirm": "请在下方输入框中输入 '{{word}}' 以确认。"
  }
 },
 "views": {
  "agentDetail": {
   "deleted": "已删除代理 {{name}}。"
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
})(zhHans, {
 "components": {
  "studio": {
   "architect": {
    "credential": "凭据",
    "noCredential": "无",
    "credentialOption": "{{name}}（{{kind}}）",
    "credentialHint": "Harness 用于登录的机密。Garrison 会把它绑定到架构师的部署。",
    "credentialMissing": "{{profile}} 需要凭据才能登录，但尚未选择。没有凭据时，每一轮都会因 Not logged in 而失败。",
    "addSecret": "添加机密"
   },
   "chat": {
    "notCredentialedTitle": "架构师无法登录其模型提供商",
    "notCredentialedBody": "它的 Harness 没有可用的凭据（Claude Code 会显示 Not logged in）。请在架构师页面为 {{architect}} 指定凭据机密，或检查机密的值是否正确。",
    "noCredentialTitle": "此架构师没有凭据",
    "noCredentialBody": "{{architect}} 运行在 {{profile}} 上，需要机密才能登录。没有机密时，它的每一轮都会因 Not logged in 而失败。请在架构师页面为它选择凭据。",
    "fixCredential": "修复架构师的凭据",
    "openSecrets": "打开机密"
   }
  }
 },
 "resources": {
  "architects": {
   "columns": {
    "credentialSecretId": "凭据"
   },
   "fields": {
    "credentialSecretId": "凭据"
   },
   "hints": {
    "credentialSecretId": "Harness 用于登录的机密，绑定到架构师的部署。",
    "credentialMissing": "{{profile}} 需要凭据才能登录。没有凭据时，每一轮都会因 Not logged in 而失败。"
   },
   "noCredential": "无"
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
})(zhHans, {
 "components": {
  "dependencyHint": {
   "refresh": "刷新列表"
  },
  "architectHints": {
   "harness": "Harness 配置文件来自 配置 > Harness 配置文件。内置的（Claude Code、Codex 等）可以直接使用。",
   "harnessLink": "打开 配置 > Harness 配置文件",
   "credential": "凭据是保存 Harness 的 API 密钥或令牌的机密，机密在 配置 > 机密 中创建：先在那里添加机密，然后回到这里选择它。",
   "credentialKinds": "对于 {{profile}}，请添加类型为 {{kinds}} 的机密。",
   "credentialNotNeeded": "{{profile}} 不需要凭据。",
   "credentialNone": "此租户还没有任何机密，所以列表为空。",
   "credentialMissing": "{{profile}} 需要凭据才能登录，但尚未选择。没有凭据时，每一轮都会因 Not logged in 而失败。",
   "credentialLink": "打开 配置 > 机密",
   "prompt": "架构师提示词是 配置 > 提示词模板 中的 System 模板；可以在那里克隆和编辑，或使用 智能体 > 架构师 中的架构师提示词操作。",
   "promptLink": "打开 配置 > 提示词模板"
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
})(zhHans, {
 "components": {
  "studio": {
   "architect": {
    "intro": "代理架构师在你的草稿中设计代理和应用。请为它指定 Harness 配置文件、用于登录的机密、模型以及它使用的提示词。它只编辑你的草稿，从不应用它们。"
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
})(zhHans, {
 "wizard": {
  "studioBody": "代理架构师会在代理工作室中与你一起设计代理和应用。请选择它运行所用的 Harness 配置文件和模型、它登录所用的凭据（如果上一步保存的机密适合该 Harness，会自动选中），以及指导它的架构师提示词。它的部署只能编辑你的工作室草稿。你可以跳过此步骤，稍后在 智能体 > 架构师 中创建架构师。"
 }
});
