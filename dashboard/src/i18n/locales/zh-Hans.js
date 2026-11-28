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
    footerHint: '默认凭据：租户 default 中的 admin@garrison / password。'
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
      selected_one: '已选择 {{formattedCount}} 项',
      selected_other: '已选择 {{formattedCount}} 项',
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
        inputSchema: '输入 JSON Schema',
        outputSchema: '输出 JSON Schema',
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
      grafanaSections: { overview: '概览', http: 'HTTP API', runs: '运行', agents: '智能体', models: '模型与令牌', workers: '工作节点', kubernetes: 'Kubernetes 执行器', protocols: '协议', scheduler: '调度器与队列', database: '数据库', controlPlane: '控制平面', security: '安全与认证', integrations: '集成', logs: '日志与追踪', autonomy: '自主' },
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
    "inputSchema": "输入架构",
    "outputSchema": "输出架构"
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
    "inputSchema": "输入架构",
    "outputSchema": "输出架构"
   },
   "hints": {
    "kind": "手动条目可以是任意类型，例如智能体通过技能访问的转换服务。",
    "requirements": "使用此能力的智能体运行只会分配给同时具有所有这些节点标签的工作节点。",
    "sourceMcpServerId": "可选。指定了服务器的条目，只有在部署绑定了该服务器时，运行令牌才能看到。",
    "inputSchema": "一个 JSON Schema，例如 {\"type\": \"object\"}。如果能力接受自由文本，请留空。"
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
    "architectPromptVersion": "留空则始终使用提示词的当前版本。"
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
    "credentialOption": "{{name}}（{{kind}}）"
   },
   "chat": {
    "notCredentialedTitle": "架构师无法登录其模型提供商",
    "notCredentialedBody": "{{architect}} 身份验证失败。请检查其已保存连接的凭据；下方的运行错误说明了原因。",
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
   "harness": "内置配置文件（Claude Code、Codex 等）可以直接使用。",
   "harnessLink": "打开 配置 > Harness 配置文件",
   "credentialNotNeeded": "{{profile}} 不需要凭据。",
   "credentialLink": "打开 配置 > 机密",
   "prompt": "更改会从架构师的下一轮开始生效。",
   "promptLink": "打开 配置 > 提示词模板",
   "credentialNoProfile": "Harness 用于登录的机密。",
   "credentialChosen": "{{profile}} 用于登录的机密。",
   "credentialPick": "{{profile}} 使用类型为 {{kinds}} 的机密登录。请选择一个，否则每一轮都会因 Not logged in 而失败。",
   "credentialAdd": "{{profile}} 使用类型为 {{kinds}} 的机密登录，但此租户还没有。请在 配置 > 机密 中添加一个，然后在这里选择它。没有它，每一轮都会因 Not logged in 而失败。"
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
})(zhHans, {
 "components": {
  "secretGuide": {
   "title": "如何获取 {{kind}} 的值",
   "AnthropicApiKey": {
    "s1": "登录 Anthropic Console，打开 Settings > API keys：",
    "s2": "选择 Create Key，起一个名字（例如 garrison），然后复制密钥。它以 sk-ant-api 开头，只显示一次。",
    "s3": "把它粘贴到“值”中。Claude Code、opencode、pi、Mux 和提供商 API Harness 会以 ANTHROPIC_API_KEY 接收它。"
   },
   "ClaudeCodeOAuthToken": {
    "s1": "在任意一台电脑上安装 Claude Code（如尚未安装）：",
    "s2": "运行此命令，并在打开的浏览器窗口中，用代理应使用其 Pro 或 Max 订阅的 Claude 账户登录：",
    "s3": "复制它输出的令牌。它以 sk-ant-oat 开头，有效期一年；把“过期时间”设为该日期，Garrison 就会显示何时到期。",
    "s4": "把它粘贴到“值”中。Claude Code 会以 CLAUDE_CODE_OAUTH_TOKEN 接收它。",
    "note": "订阅令牌使用的是个人的套餐，用它为他人提供服务可能违反 Anthropic 的条款。凡是共享的用途，请使用 Anthropic API 密钥。"
   },
   "OpenAiApiKey": {
    "s1": "登录 OpenAI Platform，打开 API keys：",
    "s2": "选择 Create new secret key，选定为运行付费的项目，然后复制密钥。它以 sk- 开头，只显示一次。",
    "s3": "把它粘贴到“值”中。Codex、opencode、pi、Mux 和提供商 API Harness 会以 OPENAI_API_KEY 接收它。"
   },
   "CodexAuthJson": {
    "s1": "安装 Codex CLI（如尚未安装）：",
    "s2": "在一个新的空 Codex 目录下用你的 ChatGPT 账户登录，让这个登录只归 Garrison 使用：",
    "s3": "在同一个终端中验证文件。只有显示 Valid JSON 时才继续：",
    "copy": "在 macOS 上，使用下面的命令将文件直接复制到剪贴板，然后粘贴到值中。在其他系统上，用文本编辑器打开 auth.json 并复制整个文件。不要复制自动换行的终端输出或命令提示符。",
    "s4": "密钥成功保存后，删除该文件夹，不要在其他地方使用此登录。此后由 Garrison 负责刷新：",
    "note": "同一登录的两份副本共用一个刷新令牌，后刷新的一方会使另一方失效。用个人 ChatGPT 套餐为他人提供服务可能违反 OpenAI 的条款；共享部署使用 OpenAI API 密钥更简单。"
   },
   "GeminiApiKey": {
    "s1": "打开 Google AI Studio，用负责付费的 Google 账户登录：",
    "s2": "选择 Create API key，选择或创建一个 Google Cloud 项目，然后复制密钥。它以 AIza 开头。",
    "s3": "把它粘贴到“值”中。Gemini CLI 和 pi 以 GEMINI_API_KEY 接收它，opencode 以 GOOGLE_GENERATIVE_AI_API_KEY 接收。"
   },
   "GenericEnv": {
    "s1": "粘贴任意单个值：Harness 或工具从环境变量读取的令牌、密码或 URL。",
    "s2": "用别名把该机密绑定到部署，然后添加一个使用它的环境覆盖，例如：",
    "s3": "该变量必须在 Harness 配置文件的凭据允许列表中，否则部署会被拒绝。"
   },
   "GenericFile": {
    "s1": "粘贴完整文件，包括换行：服务账户 JSON、证书或配置文件。",
    "s2": "用别名把该机密绑定到部署，并添加一个内容为该机密的文件覆盖，例如："
   },
   "BearerToken": {
    "s1": "只粘贴令牌，不要带 Bearer 一词。",
    "s2": "远程代理把它用作凭据机密，工作区模板用它克隆私有仓库（作为用户 x-access-token 的密码）。MCP 服务器可以在写成 {{secret.<alias>}} 的请求头中发送它。"
   },
   "BasicAuth": {
    "s1": "按以下格式粘贴用户名和密码：",
    "s2": "用别名把该机密绑定到部署，并在模板中以 {{secret.<alias>}} 使用它。"
   },
   "GitCredential": {
    "s1": "对于 GitHub，创建一个细粒度个人访问令牌，对要克隆的仓库授予 Contents 读取权限：",
    "s2": "只粘贴令牌；Garrison 会把它作为用户 x-access-token 的密码发送。对于 GitLab、Bitbucket 或其他主机，请改为粘贴 username:token。",
    "s3": "在克隆该仓库的工作区模板中，把此机密选为 Git 凭据。"
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
})(zhHans, {
 "components": {
  "studio": {
   "chat": {
    "wait": {
     "worker": "正在等待工作节点开始这一轮...",
     "phrases": {
      "p1": "正在阅读你的草稿...",
      "p2": "正在仔细思考...",
      "p3": "正在勾画代理...",
      "p4": "正在理清谁调用谁...",
      "p5": "正在核对 Garrison 的约定...",
      "p6": "正在挑选合适的能力...",
      "p7": "正在起草清单...",
      "p8": "正在权衡几种设计...",
      "p9": "正在安排部署...",
      "p10": "正在检查提示词...",
      "p11": "正在绘制应用的关系图...",
      "p12": "正在寻找更简单的结构...",
      "p13": "正在复核细节...",
      "p14": "正在把各部分拼起来...",
      "p15": "马上就好...",
      "p16": "仍在处理中..."
     }
    },
    "thinkingSummary": "思考过程",
    "metrics": {
     "model": "模型",
     "timeToFirstTokenMs": "TTFT",
     "streamingMs": "流式",
     "totalMs": "总计",
     "inputTokens": "输入",
     "outputTokens": "输出",
     "cachedTokens": "缓存",
     "reasoningTokens": "推理",
     "outputTokensPerSecond": "令牌/秒",
     "toolCallCount": "工具",
     "costUsd": "费用"
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
})(zhHans, {
 "components": {
  "studio": {
   "chat": {
    "metrics": {
     "title": "本轮详情"
    },
    "tool": {
     "running": "运行中",
     "ok": "完成",
     "failed": "失败",
     "input": "参数",
     "output": "结果",
     "none": "无",
     "waiting": "正在等待结果..."
    },
    "refs": {
     "apr": "打开审批",
     "run": "打开运行",
     "cnv": "打开对话",
     "agt": "打开智能体",
     "sdr": "打开草稿",
     "plr": "打开流水线运行",
     "tpl": "打开提示词模板"
    },
    "keysHint": "按 Enter 发送。按 Ctrl+Enter 或 Shift+Enter 换行。",
    "disclaimer": "AI 可能会出错。请核对所有回答。",
    "continueHint": "继续对话。"
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
})(zhHans, {
 "nav": {
  "items": {
   "agentWizard": {
    "label": "智能体向导",
    "tip": "从描述需求开始，一步步引导你得到在 dev 中运行的已批准智能体：模型访问、与智能体架构师一起设计、检查、批准，以及第一次对话。"
   }
  }
 },
 "resources": {
  "agents": {
   "wizard": "智能体向导"
  }
 },
 "common": {
  "states": {
   "studioHint": "也可以打开智能体向导，描述你的需求：它会带你完成智能体的构建、批准和试用。",
   "openStudio": "打开智能体向导"
  }
 },
 "views": {
  "home": {
   "openStudio": "打开智能体向导"
  },
  "studioDraft": {
   "back": "返回向导"
  },
  "agentWizard": {
   "title": "智能体向导",
   "subtitle": "描述你的需求。向导会从这里带你得到在 dev 中运行的已批准智能体。",
   "subtitleDraft": "正在构建：{{title}}",
   "advanced": "高级",
   "stepsLabel": "向导步骤",
   "back": "上一步",
   "working": "处理中...",
   "steps": {
    "goal": "目标",
    "access": "模型访问",
    "design": "设计",
    "review": "检查",
    "approve": "批准",
    "test": "试用"
   },
   "goal": {
    "title": "你的智能体要做什么？",
    "intro": "给项目起个名字，用平实的话描述这项工作。智能体架构师会阅读这些内容，并为它设计一个智能体或一组智能体。",
    "name": "项目名称",
    "namePlaceholder": "研究助手",
    "nameHint": "一个以后能认出来的简短名称。这一步之后无法更改。",
    "goal": "智能体要做的事",
    "goalPlaceholder": "在网上调研一个主题，附上来源总结发现的内容，并写一份简短报告。",
    "goalHint": "说明谁在使用、输入什么、应该输出什么。架构师需要了解的内容会主动询问。",
    "next": "开始",
    "resume": "或继续你的某个草稿",
    "allDrafts": "全部草稿"
   },
   "access": {
    "title": "模型访问",
    "intro": "选择运行智能体的 harness，以及它登录所用的凭据。智能体架构师与你一起设计时也使用同一个 harness 和凭据。",
    "harness": "Harness 配置文件",
    "harnessHint": "运行智能体的 CLI，例如 Claude Code 或 Codex。",
    "model": "模型",
    "modelHint": "可选。留空则使用 harness 的默认模型。",
    "credential": "凭据",
    "noCredentialNeeded": "{{profile}} 不需要凭据。",
    "credentialIntro": "{{profile}} 使用类型为 {{kinds}} 的密钥登录。选择一个已保存的，或现在添加一个。",
    "noFittingSecret": "你还没有保存类型为 {{kinds}} 的密钥。请在下方添加；获取该值的步骤会一并显示。",
    "addSecret": "添加凭据",
    "saveSecret": "保存凭据",
    "architectDescription": "由智能体向导设置的智能体架构师。",
    "next": "继续设计"
   },
   "design": {
    "title": "与架构师一起设计",
    "intro": "与智能体架构师聊天。它会询问需要了解的内容，并在对话中把智能体构建到你的草稿里。右侧面板显示草稿的内容。",
    "contents": "草稿内容",
    "empty": "还没有内容。架构师设计出智能体后会添加到这里。",
    "agents": "智能体",
    "firstMessage": "我想构建这个：{{goal}}\n\n智能体将在 harness 配置文件 {{profile}} 上运行，使用凭据密钥 {{secret}}。请先问我任何你需要了解的内容，然后在这个草稿中设计智能体。",
    "chatTitle": "与 {{architect}} 聊天",
    "next": "继续检查"
   },
   "review": {
    "title": "检查",
    "intro": "向导会将草稿中的每一项与当前配置进行比对。会失败的项会退回给架构师修复。",
    "status": {
     "PendingApproval": "此草稿正在等待批准。请继续下一步。",
     "Applied": "此草稿已应用。请继续下一步。",
     "Discarded": "此草稿已被丢弃。请从第一步开始新建一个。"
    },
    "kind": "类型",
    "name": "名称",
    "change": "变更",
    "note": "备注",
    "problems_one": "{{count}} 项无法应用。",
    "problems_other": "{{count}} 项无法应用。",
    "askFix": "请架构师修复",
    "valid": "草稿中的所有内容都通过了检查。请继续批准。",
    "validate": "重新检查",
    "fixMessage": "草稿尚未通过验证。请修复以下问题：\n{{problems}}",
    "next": "继续批准"
   },
   "approve": {
    "title": "批准",
    "intro": "批准后会应用草稿并让智能体上线。随后向导会为每个智能体创建一个 dev 部署，你可以马上试用。",
    "reason": "在智能体向导中批准。",
    "summary": "草稿包含 {{total}} 项，其中有 {{agents}} 个智能体。它们将在 {{profile}} 上运行，使用凭据 {{secret}}。",
    "will1": "草稿中的所有项会一起创建或更新。只要有一项失败，就不会做任何更改。",
    "will2": "每个智能体都会在你选择的 harness 上获得一个 dev 部署，并绑定凭据。",
    "will3": "如果你没有批准权限，请求会等待有权限的人处理，对方做出决定后此页面会继续。",
    "approve": "批准并发布",
    "waiting": "正在等待有批准权限的人做出决定。对方决定后此页面会自动继续。",
    "openApproval": "打开审批",
    "retry": "重试",
    "done": "已批准并发布。每个智能体都有一个可以运行的 dev 部署。",
    "agent": "智能体",
    "deployment": "dev 部署",
    "what": "向导执行的操作",
    "actions": {
     "create": "已创建部署",
     "bind": "已绑定凭据",
     "ready": "已就绪"
    },
    "next": "继续试用"
   },
   "test": {
    "title": "试用",
    "intro": "在 dev 中与新的智能体对话。满意后，打开它进行升级或共享。",
    "talkingTo": "正在与 {{name}} 对话。",
    "empty": "发送一条消息开始对话。",
    "message": "消息",
    "next": "下一步去哪里",
    "openAgent": "打开 {{name}}",
    "openApp": "打开应用 {{name}}",
    "openInvoke": "在 Invoke 中打开",
    "another": "再构建一个"
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
})(zhHans, {
 "views": {
  "agentWizard": {
   "test": {
    "openApp": "打开 {{name}} 聊天"
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
})(zhHans, {
 "resources": {
  "apps": {
   "fields": {
    "backgroundColor": "页面背景",
    "headerColor": "页眉颜色",
    "agentBubbleColor": "智能体消息颜色",
    "fontFamily": "字体",
    "faviconAssetId": "标签页图标"
   },
   "hints": {
    "displayName": "显示在聊天页眉和智能体的消息上。可用任意字符，最多 128 个。上面的名称只是标识符。",
    "faviconAssetId": "一个图片资源。留空则使用徽标。",
    "primaryColor": "按钮和你自己的消息。",
    "accentColor": "高亮、焦点边框和所选会话。",
    "backgroundColor": "对话后面的页面。",
    "headerColor": "顶部显示名称和徽标的栏。",
    "agentBubbleColor": "智能体的消息。文字颜色会按对比度自动选择。"
   },
   "faviconFromLogo": "与徽标相同",
   "defaultColor": "默认 {{color}}"
  }
 },
 "enums": {
  "appFont": {
   "System": "系统字体",
   "Sans": "无衬线",
   "Serif": "衬线",
   "Rounded": "圆体",
   "Mono": "等宽"
  }
 },
 "components": {
  "form": {
   "defaultColor": "默认"
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
})(zhHans, {
 "resources": {
  "apps": {
   "fields": {
    "conversationListColor": "会话列表颜色",
    "composerColor": "输入区颜色",
    "filesColor": "文件列表颜色"
   },
   "hints": {
    "conversationListColor": "侧边的会话列表。",
    "composerColor": "对话下方输入消息的区域。",
    "filesColor": "智能体写入的文件列表。"
   }
  }
 }
});

// Wizard draft picker and credential-optional Mux endpoints.
Object.assign(zhHans.views.agentWizard.goal, {
  "updated": "更新于 {{date}}",
  "continue": "继续"
});
Object.assign(zhHans.views.agentWizard.access, {
  "muxEndpoint": "Mux 端点 URL",
  "muxAdapter": "端点适配器",
  "muxOptionalCredential": "凭据（可选）",
  "muxHint": "Mux 可以使用无需提供商 API 密钥的端点。请输入工作节点可访问的端点 URL。仅当端点要求身份验证时才需选择凭据。",
  "needEndpoint": "请输入以 HTTP 或 HTTPS 开头的有效 Mux 端点 URL。"
});
Object.assign(zhHans.views.agentWizard.design, {
  "firstMessageMux": "我想构建：{{goal}}\n\n请使用 Mux，端点为 {{endpoint}}，适配器为 {{adapter}}，模型为 {{model}}。仅当端点要求身份验证时才需要 API 密钥。请先询问必要的问题，然后在此草稿中设计代理。"
});
Object.assign(zhHans.views.agentWizard.approve.actions, {"configure": "已配置端点"});

// Harness-specific wizard configuration.
Object.assign(zhHans.views.agentWizard.access, {
  "muxEndpoint": "Mux 端点名称",
  "muxHint": "输入执行工作节点上 Mux 中配置的端点名称，例如 local。URL、适配器、模型和身份验证均由 Mux 提供。",
  "needEndpoint": "请输入已配置的 Mux 端点名称，而非 URL。",
  "providerModelHint": "使用 CLI 模型标识符，通常为 provider/model。身份验证取决于提供商，已保存的凭据为可选项。",
  "optionalCredentialIntro": "{{profile}} 支持 {{kinds}} 类型的已保存密钥。提供商要求时请选择，也可不使用已保存凭据继续。",
  "providerEndpoint": "提供商 API 端点 URL",
  "providerEndpointHint": "此运行框架直接调用兼容 OpenAI 的 HTTP API。请输入其基础 URL 和模型。",
  "providerAnonymous": "提供商端点不需要身份验证",
  "needProviderEndpoint": "请输入不含凭据、查询参数或片段的有效 HTTP 或 HTTPS 提供商 URL。"
});
Object.assign(zhHans.views.agentWizard.design, {
  "firstMessageMux": "我想构建：{{goal}}\n\n请使用已配置的 Mux 端点 {{endpoint}}。模型和身份验证来自 Mux。请先询问必要的问题，然后在此草稿中设计代理。"
});
Object.assign(zhHans.views.agentWizard.access, {"intro": "选择运行框架及其连接设置。代理架构师在与你设计时使用相同配置。"});

// Typed inference protocol and authentication editor.
Object.assign(zhHans, {
  "inference": {
    "modelHint": "选择此端点提供的模型。",
    "title": "推理端点",
    "protocol": "API 协议",
    "baseUrl": "基础 URL",
    "authentication": "身份验证类型",
    "name": "请求头 / 查询参数名",
    "location": "凭据位置",
    "header": "请求头",
    "query": "查询字符串",
    "secret": "凭据密文",
    "addValue": "添加凭据值",
    "username": "用户名密文",
    "password": "密码密文",
    "hint": "分别选择协议和身份验证。Ollama Cloud 使用持有者令牌认证；本地 Ollama 通常无需认证。值以加密密文保存。",
    "invalid": "请输入有效 URL 并选择所有必需的凭据名称和密文。",
    "value": "凭据值",
    "auth": {
      "None": "无",
      "BearerToken": "持有者令牌",
      "ApiKey": "API 密钥",
      "Headers": "请求头值",
      "QueryString": "查询参数",
      "Basic": "基本身份验证"
    }
  }
});

// Shared runtime connections and the configuration navigation split.
zhHans.runtime = {
  "title": "运行框架与端点",
  "connections": "已保存的连接",
  "templates": "高级运行框架模板",
  "connection": "连接",
  "architect": "架构师",
  "choose": "选择架构师或连接",
  "harness": "运行框架模板",
  "chooseHarness": "选择运行框架模板",
  "manage": "管理运行框架与端点",
  "configureFirst": "请先配置并保存连接。",
  "sharedHint": "在此配置一次。架构师和部署引用此连接，更改将在下次运行时应用。",
  "reuseHint": "直接使用现有架构师，或从已保存的连接创建。无需重新输入凭据和端点信息。",
  "importExport": "导入 / 导出"
};
zhHans.nav.hubs.configuration = {"label": "代理资源", "tip": "代理与架构师的连接配置。"};
zhHans.nav.hubs.platformConfiguration = {"label": "平台配置", "tip": "凭据、存储、价格、配额与通知。"};
zhHans.nav.items.harnessProfiles.label = "运行框架与端点";
zhHans.views.agentWizard.access.intro = "直接使用现有架构师，或从已保存的连接创建。无需重新输入凭据和端点信息。";

zhHans.resources.harnessProfiles.title = zhHans.runtime.title;
zhHans.resources.harnessProfiles.subtitle = zhHans.runtime.sharedHint;
zhHans.components.architectHints.harness = zhHans.runtime.sharedHint;
zhHans.components.architectHints.harnessLink = zhHans.runtime.manage;

Object.assign(zhHans.runtime, {"add": "添加连接", "create": "创建连接", "edit": "编辑连接", "view": "连接详情"});

zhHans.explainers.harnessProfiles.p2 = zhHans.runtime.sharedHint;
zhHans.explainers.secrets.p2 = zhHans.runtime.sharedHint;

// One connection registry; configuration sections use a menu.
Object.assign(zhHans.runtime, {"title": "连接", "sharedHint": "可复用的运行框架与API端点。配置一次，即可在各代理中选择使用。", "harness": "连接类型", "chooseHarness": "选择运行框架或API类型", "customHarness": "自定义运行框架", "advancedLaunch": "高级启动设置", "advancedArchitect": "架构师选项（可选）", "pickConnection": "选择连接即可，其模型、端点和凭据均已配置。"});
zhHans.nav.hubs.connections = {"label": "连接", "tip": "可复用的运行框架与API端点。配置一次，即可在各代理中选择使用。"};
zhHans.nav.hubs.configuration = {"label": "配置", "tip": "管理提示词、资源、工具服务器、凭据、存储和策略。"};
zhHans.nav.items.harnessProfiles.label = "连接";
zhHans.resources.harnessProfiles.title = "连接";
zhHans.components.studio.architect.harnessProfile = zhHans.runtime.connection;

Object.assign(zhHans.runtime, {"emptyTitle": "暂无连接", "apiType": "HTTP API（Ollama / OpenAI兼容）"});

zhHans.nav.items.manifests.label = zhHans.runtime.importExport;

zhHans.runtime.manage = "管理连接";
zhHans.components.architectHints.harnessLink = zhHans.runtime.manage;
zhHans.explainers.secrets.p2 = "连接引用这些密钥进行身份验证。在此更新值，无需重新配置各架构师或部署。";

zhHans.runtime.launchDefaults = "此连接使用现有的启动配置。如有需要，可在高级启动设置中编辑。";

// One horizontal workspace navigation level; the wizard selects connections only.
zhHans.nav.hubs.operations = {"label": "运行管理", "tip": "管理已存储的输出、模型价格、使用限制和通知。"};
zhHans.nav.hubs.configuration.tip = "代理的提示词、资源、工具、凭据和工作区。";
zhHans.nav.hubs.manifests = { label: zhHans.runtime.importExport, tip: zhHans.tips.nav.tabs.manifests };
zhHans.runtime.choose = "选择连接";
zhHans.runtime.reuseHint = "选择用于设计和运行代理的连接。向导将自动准备设计助手。";
zhHans.views.agentWizard.access.intro = zhHans.runtime.reuseHint;

zhHans.views.manifests.title = zhHans.runtime.importExport;

zhHans.views.agentWizard.design.intro = "回答架构师的问题，设计你的智能体。";

zhHans.views.studio.deleteMultiple = "批量删除";
zhHans.views.studio.deleteMultipleMessage = "永久删除所选的 {{count}} 个草稿？待处理的应用审批将被取消。已发布的智能体和部署不受影响。";

zhHans.views.studio.discard = zhHans.common.actions.delete;
zhHans.views.studio.discardTitle = "删除草稿";
zhHans.views.studio.discardMessage = "永久删除 {{title}}？已发布的智能体和部署不受影响。";
zhHans.views.studio.discardPendingMessage = "永久删除 {{title}}？其待处理的应用审批将被取消。已发布的智能体和部署不受影响。";
zhHans.views.studio.discarded = "已删除 {{title}}。";

zhHans.components.studio.chat.resize = "调整聊天大小";
zhHans.components.studio.chat.resizeHint = "拖动以调整聊天大小。使用上下方向键调整高度，或按 Home 重置。";

// Secret reveal (Admin on Secret, audited as SecretRevealed).
zhHans.components.secretReveal = { title: "显示密钥值", warning: "显示后，存储的值将以明文呈现。每次显示都会以你的名字记录在审计日志中。完成后请关闭此对话框；该值不会被保留。", value: "值", reveal: "显示", hide: "隐藏" };
zhHans.tips.secretReveal = { reveal: "解密并显示存储的值。服务器会写入一条 SecretRevealed 审计记录。", hide: "再次隐藏该值。再次显示会写入另一条审计记录。", close: "关闭对话框并丢弃显示的值。", value: "解密后的值，与存储的完全一致。请像对待密码一样对待它。", copy: "将该值复制到剪贴板。" };
zhHans.resources.secrets.actions.reveal = "显示";
zhHans.tips.resources.secrets.actions.reveal = "以明文显示存储的值。需要 Secret 的 Admin 权限 (SecretManager 或 TenantAdmin)，并会记录在审计日志中。";
zhHans.tips.resources.secrets.revealNoValue = "此密钥尚未存储值。请先使用“设置值”。";
zhHans.enums.auditEventType.SecretRevealed = "密钥已显示";
zhHans.tips.enums.auditEventType.SecretRevealed = "拥有 Secret Admin 权限的人读取了某个密钥解密后的值。";
zhHans.resources.secrets.subtitle = "供 harness 和集成使用的加密凭据。密钥管理员可以显示值；每次显示都会被审计。";
zhHans.tips.nav.tabs.secrets = "加密的 API 密钥和令牌。部署通过别名绑定它们；只有密钥管理员可以显示值，每次显示都会被审计。";
zhHans.tips.resources.secrets.add = "存储新的凭据，例如 API 密钥或令牌，静态加密。部署通过别名引用它；保存后，只有拥有 Secret Admin 权限的人可以显示它。";
zhHans.tips.resources.secrets.value = "密钥值。保存时会加密。拥有 Secret Admin 权限的人可以显示它，每次显示都会被审计。";
zhHans.explainers.secrets.p1 = "密钥是一个加密的值，例如 API 密钥或令牌。保存后你可以替换或轮换它。只有拥有 Secret Admin 权限的人 (SecretManager 和 TenantAdmin 角色) 才能读回它，每次显示都会记录在审计日志中。";

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
})(zhHans, {
 "nav": {
  "hubs": {
   "autonomy": {
    "label": "自主运行",
    "tip": "能自己持续工作的智能体：守护者按计划唤醒，照看一项长期职责。"
   }
  },
  "items": {
   "keepers": {
    "label": "守护者",
    "tip": "按计划唤醒、照看长期职责的智能体"
   }
  }
 },
 "enums": {
  "runKind": {
   "Keeper": "守护者巡检"
  },
  "resourceType": {
   "Mandate": "守护者（职责）"
  },
  "mandateStatus": {
   "Draft": "草稿",
   "Active": "活动",
   "Paused": "已暂停",
   "Frozen": "已冻结",
   "CapReached": "已达预算上限",
   "Retired": "已停用"
  },
  "mandateRevisionState": {
   "Draft": "草稿",
   "Published": "已发布"
  },
  "mandateRevisionSource": {
   "Human": "人工",
   "Board": "委员会",
   "Executive": "主管",
   "Architect": "智能体架构师"
  },
  "wakeMode": {
   "Fixed": "固定间隔",
   "Backoff": "安静时退避"
  },
  "wakeSource": {
   "Timer": "计划",
   "Manual": "手动唤醒",
   "Message": "消息",
   "EscalationAnswer": "已答复上报",
   "Webhook": "Webhook 回调",
   "Report": "报告"
  },
  "tickOutcome": {
   "Quiet": "平静",
   "Acted": "已处理",
   "Attention": "需要关注",
   "Escalated": "已上报",
   "Failed": "失败",
   "Skipped": "已跳过",
   "Unreported": "未报告"
  }
 },
 "errorCodes": {
  "MandateActive": "此守护者有一次巡检正在运行。请等它结束，或先暂停守护者，也可以直接删除，这会取消该次巡检的运行。",
  "MandateNotActive": "只有处于活动状态的守护者才能被唤醒或暂停。",
  "MandateNotPaused": "只有已暂停的守护者才能恢复。",
  "RemoteAgentUnsupported": "守护者运行在托管部署上，因此远程智能体不能作为守护者。",
  "DeploymentInactive": "该部署未启用。请选择一个活动部署。",
  "DeploymentAgentMismatch": "该部署属于另一个智能体。请选择此智能体自己的部署。",
  "RevisionMismatch": "该修订版属于另一个守护者。"
 },
 "resources": {
  "runs": {
   "columns": {
    "mandateId": "守护者"
   }
  },
  "keepers": {
   "title": "守护者",
   "subtitle": "按计划唤醒、照看一项长期职责的智能体，每次都会汇报发现的情况。",
   "add": "添加守护者",
   "create": "创建守护者",
   "edit": "编辑守护者",
   "view": "守护者详情",
   "deleteTitle": "删除守护者",
   "emptyTitle": "还没有守护者",
   "emptyBody": "创建守护者，让智能体定期查看队列、仪表板或收件箱之类的事物，并在需要时自行处理或请求协助。",
   "columns": {
    "name": "名称",
    "status": "状态",
    "agent": "智能体",
    "deployment": "部署",
    "nextWakeUtc": "下次唤醒",
    "currentIntervalSeconds": "间隔",
    "lastTick": "上次巡检",
    "tickCount": "巡检次数",
    "currentRevisionNumber": "修订版",
    "runAs": "运行身份",
    "description": "描述",
    "id": "ID",
    "createdUtc": "创建时间"
   },
   "fields": {
    "name": "名称",
    "description": "描述",
    "agentId": "智能体",
    "deploymentId": "部署",
    "objective": "目标",
    "healthyDefinition": "健康状态的标准",
    "autonomy": "可自行处理的事项",
    "escalationPolicy": "何时请求协助",
    "direction": "当前方向",
    "signals": "需要关注的信号",
    "signalsItems": {
     "name": "信号",
     "description": "含义"
    },
    "wakeMode": "唤醒模式",
    "minIntervalSeconds": "最小间隔（秒）",
    "maxIntervalSeconds": "最大间隔（秒）",
    "backoffFactor": "退避系数",
    "jitterPercent": "抖动（百分比）",
    "budgetPerTickUsd": "每次巡检预算（USD）",
    "budgetPerDayUsd": "每日预算（USD）",
    "maxTokensPerTick": "每次巡检最大 token 数",
    "changeNote": "变更说明"
   },
   "hints": {
    "name": "小写字母、数字和连字符。",
    "agentId": "一个托管智能体。守护者创建后，智能体不可更改。",
    "deploymentId": "每次巡检所运行的活动部署。",
    "objective": "用平实的话描述这项长期职责。守护者每次巡检都会读取它。",
    "minIntervalSeconds": "范围为 {{min}} 到 {{max}} 秒。集群设置 Autonomy.MinIntervalSeconds 可能会调高下限。",
    "maxIntervalSeconds": "范围为 {{min}} 到 {{max}} 秒。退避增长到此值为止。",
    "backoffFactor": "范围为 {{min}} 到 {{max}}。每次平静的巡检之后，间隔都会乘以这个值。",
    "jitterPercent": "范围为 {{min}} 到 {{max}}。留空则使用集群默认值。",
    "budgetPerTickUsd": "留空表示不设上限。",
    "budgetPerDayUsd": "留空表示不设上限。",
    "maxTokensPerTick": "输入与输出 token 之和。留空表示不设上限。",
    "changeNote": "说明此修订版为何要改动守护者。显示在修订版列表中。"
   },
   "sections": {
    "mandate": "职责",
    "schedule": "唤醒计划",
    "budgets": "预算"
   },
   "sectionHints": {
    "mandate": "保存后，这些字段会作为修订版 1 发布，并启动唤醒计划。之后的更改请在守护者页面使用“新建修订版”。",
    "budgets": "现在只做保存，将在后续版本中强制执行。"
   },
   "errors": {
    "name": "请使用 1 到 64 个小写字母、数字和连字符，并以字母或数字开头和结尾。",
    "nameTaken": "已有另一个守护者使用此名称。",
    "text": "最多 {{max}} 个字符。",
    "agentRequired": "请选择负责这项职责的智能体。",
    "deploymentRequired": "请选择其巡检所运行的部署。",
    "objective": "请描述这项长期职责。",
    "signalsMax": "一个修订版最多包含 {{max}} 个信号。",
    "signalName": "信号名称为 1 到 {{max}} 个字符。",
    "signalUnique": "每个信号需要使用不同的名称。",
    "signalsInvalid": "请修正下方标记的信号。",
    "interval": "请输入 {{min}} 到 {{max}} 之间的整数秒数。",
    "maxBelowMin": "最大间隔不能短于最小间隔。",
    "backoffFactor": "请输入 {{min}} 到 {{max}} 之间的数字。",
    "jitterPercent": "请输入 {{min}} 到 {{max}} 之间的整数。",
    "budget": "请输入 {{min}} 到 {{max}} 之间的金额。",
    "maxTokens": "请输入 {{min}} 到 {{max}} 之间的整数。"
   },
   "actions": {
    "pause": "暂停",
    "resume": "恢复",
    "wake": "立即唤醒",
    "runs": "查看运行"
   },
   "toasts": {
    "pause": "已暂停 {{name}}。",
    "resume": "已恢复 {{name}}，现在唤醒它。",
    "wake": "{{name}} 现在唤醒。"
   },
   "units": {
    "seconds_other": "{{count}} 秒",
    "minutes_other": "{{count}} 分钟",
    "hours_other": "{{count}} 小时",
    "days_other": "{{count}} 天"
   },
   "ticking": "巡检中",
   "neverTicked": "尚未唤醒",
   "addSignal": "添加信号",
   "signalNamePlaceholder": "队列深度",
   "editNotice": "以 {{name}} 的身份运行。保存后，你将成为其巡检所用的运行身份。要更改目标或计划，请打开守护者并使用“新建修订版”。"
  }
 },
 "components": {
  "keeperRevision": {
   "title": "{{name}} 的新修订版",
   "intro": "这将成为修订版 {{number}}。发布后它立即成为当前版本：退避会重置，守护者随即被唤醒。",
   "draft": "保存为草稿",
   "publish": "发布",
   "drafted": "已将修订版 {{number}} 保存为草稿。",
   "published": "已发布修订版 {{number}}。"
  }
 },
 "views": {
  "runDetail": {
   "keeper": "守护者"
  },
  "home": {
   "autonomy": {
    "title": "自主运行",
    "open": "打开守护者",
    "empty": "还没有守护者。守护者按计划唤醒，照看一项长期职责。",
    "active": "活动",
    "paused": "已暂停",
    "ticking": "正在巡检",
    "nextWake": "下次唤醒：",
    "allQuiet": "没有需要关注的守护者。",
    "attention_other": "有 {{count}} 个守护者需要关注"
   }
  },
  "keeperDetail": {
   "title": "守护者",
   "heading": "守护者 {{name}}",
   "notFoundTitle": "未找到守护者",
   "notFoundBody": "它可能已被删除，或属于另一个租户。",
   "live": "实时",
   "polling": "刷新中",
   "newRevision": "新建修订版",
   "noWake": "未安排",
   "quietStreak": "连续平静的巡检",
   "activeRun": "正在运行的巡检",
   "revisionTitle": "当前修订版",
   "revisionHeading": "当前修订版（{{number}}）",
   "noRevision": "尚未发布任何修订版。请使用“新建修订版”编写并发布一个。",
   "clusterDefault": "集群默认值",
   "noLimit": "不设上限",
   "ticks": "巡检",
   "outcomeFilter": "结果",
   "allOutcomes": "所有结果",
   "noTicksTitle": "还没有巡检",
   "noTicksActive": "第一次巡检会在下次唤醒时开始。使用“立即唤醒”可马上开始一次。",
   "noTicksBody": "守护者处于活动状态并被唤醒后，巡检会显示在这里。",
   "chartTitle": "每次巡检后的间隔",
   "chartHelp": "到下次唤醒的分钟数，取每次巡检结束时设定的值。在退避模式下，平静的巡检会使其变长。",
   "chartSeries": "间隔（分钟）",
   "columns": {
    "started": "开始时间",
    "source": "唤醒来源",
    "outcome": "结果",
    "run": "运行",
    "interval": "下次间隔",
    "cost": "费用",
    "summary": "摘要",
    "number": "编号",
    "state": "状态",
    "revisionSource": "来源",
    "author": "作者",
    "changeNote": "变更说明",
    "created": "创建时间"
   },
   "requested": "请求了 {{interval}}",
   "revisions": "修订版",
   "noRevisions": "还没有修订版。",
   "current": "当前",
   "diff": "对比",
   "diffTitle": "修订版 {{number}} 与上一个版本的对比",
   "diffFirst": "这是第一个修订版，因此其中的所有内容都是新增的。",
   "revisionLabel": "修订版 {{number}}",
   "nothing": "无",
   "confirmDelete": "要删除守护者 {{name}} 及其修订版和巡检历史吗？它过去的运行会保留。",
   "confirmForceDelete": "{{name}} 有一次巡检正在运行。仍要删除该守护者并取消这次巡检的运行吗？",
   "forceDelete": "删除并取消巡检",
   "changeNote": "变更说明：{{note}}"
  }
 },
 "tips": {
  "nav": {
   "hubs": {
    "autonomy": "在请求之间自行工作的智能体。守护者按计划唤醒，查看一项长期职责，并采取行动或请求协助。"
   },
   "tabs": {
    "keepers": "守护者：按计划唤醒、照看一项长期职责的智能体，附带其巡检和修订版。"
   }
  },
  "enums": {
   "runKind": {
    "Keeper": "由守护者的唤醒启动。该运行是这个守护者的一次巡检，并链接回它。"
   },
   "resourceType": {
    "Mandate": "守护者（职责）：智能体按唤醒计划照看的长期职责，附带其修订版和巡检。"
   },
   "mandateStatus": {
    "Draft": "创建时没有已发布的修订版，所以还不会唤醒。发布一个修订版即可启动。",
    "Active": "按计划唤醒。每次唤醒会启动一次巡检，即其部署的一次运行。",
    "Paused": "在有人恢复之前不会唤醒。恢复后会立即唤醒，并重置间隔。",
    "Frozen": "已被管理员或策略停止。解冻之前不会唤醒。",
    "CapReached": "当日预算已用完。下一个 UTC 日开始时会再次唤醒。",
    "Retired": "不再使用。它保留历史记录，且不会再唤醒。"
   },
   "mandateRevisionState": {
    "Draft": "已保存但未使用。发布后它会成为守护者的当前修订版。",
    "Published": "曾经或正在使用。已发布的修订版不会改动，请另写一个新修订版。"
   },
   "mandateRevisionSource": {
    "Human": "由人在仪表板、API 或清单中编写。",
    "Board": "由监督此守护者的智能体委员会设定。",
    "Executive": "由指挥此守护者的主管智能体设定。",
    "Architect": "由智能体架构师根据工作室草稿编写。"
   },
   "wakeMode": {
    "Fixed": "无论上次巡检发现了什么，都每隔最小间隔唤醒一次。",
    "Backoff": "每次平静的巡检之后等待更久，最长到最大间隔，一旦有事发生就回到最小间隔。"
   },
   "wakeSource": {
    "Timer": "唤醒计划到期，守护者自行唤醒了。",
    "Manual": "有人使用了“立即唤醒”，或恢复了守护者。",
    "Message": "有一条消息发给了守护者。",
    "EscalationAnswer": "有人答复了守护者上报的问题。",
    "Webhook": "另一个系统调用了守护者的 Webhook。",
    "Report": "另一个智能体的报告请这个守护者去查看。"
   },
   "tickOutcome": {
    "Quiet": "一切健康，无需处理。在退避模式下，下次唤醒会更晚。",
    "Acted": "守护者为保持职责健康而改动了某些内容。",
    "Attention": "守护者发现了需要人来查看的情况。",
    "Escalated": "守护者请求某个人或另一个智能体做出决定。",
    "Failed": "这次巡检的运行失败、超时或被取消。",
    "Skipped": "唤醒到来时上一次巡检仍在运行，因此被跳过，下一次会等它结束。",
    "Unreported": "运行结束时没有报告结果，所以守护者可能需要更清晰的目标。"
   }
  },
  "resources": {
   "runs": {
    "mandateId": "把这次运行作为自己的一次巡检启动的守护者（如果有）。点击即可打开该守护者。",
    "openKeeper": "打开以这次运行作为巡检的守护者。"
   },
   "keepers": {
    "add": "创建守护者：选择托管智能体和部署，描述长期职责，并设定唤醒的频率。",
    "name": "在此租户内唯一的名称，用于 URL、清单和 API。",
    "status": "守护者是否按计划唤醒（活动），或处于等待、暂停、冻结、停用状态。",
    "agent": "负责这项职责的托管智能体。每次巡检都会运行这个智能体。",
    "deployment": "每次巡检所运行的部署，它决定了 harness、模型和工具。",
    "nextWakeUtc": "下一次巡检开始的时间。悬停可查看确切时间。",
    "currentIntervalSeconds": "上次巡检之后的等待时间。在退避模式下，它会在平静的巡检之后增长。",
    "lastTick": "守护者上次唤醒的时间，以及那次巡检报告的内容。",
    "tickCount": "守护者累计运行过的巡检次数。",
    "currentRevisionNumber": "守护者当前遵循的已发布修订版。",
    "runAs": "每次巡检所用权限的用户或凭据：最后一次保存守护者的人。",
    "description": "写给人看的备注。守护者不会读取它，它读取的是目标。",
    "id": "守护者的标识符，用于 API 和运行记录。",
    "createdUtc": "守护者的创建时间。",
    "agentId": "负责这项职责的托管智能体。远程智能体不能作为守护者。创建后不可更改。",
    "deploymentId": "该智能体每次巡检所运行的活动部署。",
    "objective": "用平实的话描述长期职责，例如让支持队列中的未处理工单保持在 20 个以下。守护者每次巡检都会读取它。",
    "healthyDefinition": "良好状态是什么样子，让守护者能区分平静的巡检和需要行动的巡检。",
    "autonomy": "守护者无需询问任何人就可以自行改动的内容。",
    "escalationPolicy": "守护者应在何时停下来，请某个人或另一个智能体做决定。",
    "direction": "可能经常变化的短期指引，例如本周的重点。",
    "signals": "守护者每次巡检应检查的命名指标，以及各自的含义。",
    "signalsItems": {
     "name": "这项指标的简短名称，在修订版内唯一。",
     "description": "这项指标的含义，以及哪些取值值得担心。"
    },
    "wakeMode": "固定模式每次都按最小间隔唤醒。退避模式会在平静的巡检之后等待更久。",
    "minIntervalSeconds": "两次计划唤醒之间的最短等待时间，单位为秒。",
    "maxIntervalSeconds": "退避模式下两次计划唤醒之间的最长等待时间，单位为秒。",
    "backoffFactor": "退避模式下，每次平静的巡检之后等待时间增长的倍数。2 表示翻倍。",
    "jitterPercent": "最多为间隔此百分比的随机延迟，避免许多守护者在同一时刻唤醒。",
    "budgetPerTickUsd": "一次巡检最多可花费的美元金额。",
    "budgetPerDayUsd": "此守护者的巡检每个 UTC 日最多可花费的美元金额。",
    "maxTokensPerTick": "一次巡检最多可使用的输入和输出 token 数。",
    "changeNote": "简短说明此修订版为何要改动守护者，随修订版一并保存。",
    "sections": {
     "mandate": "守护者照看什么，以及它可以自行处理多少事情。",
     "schedule": "守护者多久唤醒一次，以及平静的巡检之后等待时间如何变化。",
     "budgets": "守护者的巡检可花费和可使用的额度上限。"
    },
    "actions": {
     "pause": "停止唤醒此守护者。正在运行的巡检会完成，恢复之前不会开始新的巡检。",
     "resume": "重新开始唤醒此守护者。它会立即唤醒，间隔重置为最小值。",
     "wake": "立即开始一次巡检，而不是等待计划。如果有巡检正在运行，新的会在它之后开始。",
     "runs": "打开按此守护者的巡检筛选后的运行页面。"
    },
    "ticking": "此守护者有一次巡检正在运行。"
   }
  },
  "keeperRevision": {
   "done": "关闭此对话框。修订版已按上面列出的调整后的值保存。",
   "draft": "将此修订版保存为草稿而不启用。之后可在修订版列表中发布。",
   "publish": "保存此修订版并立即设为当前版本。退避会重置，守护者随即被唤醒。"
  },
  "views": {
   "runDetail": {
    "keeper": "把这次运行作为自己的一次巡检启动的守护者。",
    "openKeeper": "打开该守护者，查看其巡检和修订版。"
   },
   "home": {
    "autonomy": {
     "title": "此租户中的守护者，以及上次巡检需要人来处理的守护者。",
     "open": "打开守护者页面，创建、暂停、唤醒或编辑守护者。",
     "active": "按计划唤醒的守护者。",
     "paused": "在有人恢复之前不会唤醒的守护者。",
     "ticking": "此刻有巡检正在运行的守护者。",
     "nextWake": "活动守护者中最早的计划唤醒时间。",
     "attention": "上次巡检需要关注、已上报、失败或未报告的守护者，以及因预算或冻结而停止的守护者。",
     "openKeeper": "打开此守护者的页面，查看它的巡检。"
    }
   },
   "keeperDetail": {
    "openRun": "打开这次运行的详情页：其记录、工具调用和结果。",
    "live": "巡检开始和结束时，更新会通过实时连接送达。",
    "polling": "实时连接不可用，因此页面每隔几秒重新读取一次守护者。",
    "viewJson": "以 JSON 显示守护者记录及其当前修订版。",
    "newRevision": "以当前版本为起点，编写目标、计划或预算的新修订版。",
    "delete": "删除此守护者及其修订版和巡检历史。它过去的运行会保留。",
    "forceDelete": "删除守护者，并取消正在进行的巡检的运行。",
    "openAgent": "打开此守护者所运行的智能体。",
    "quietStreak": "连续有多少次巡检发现无事可做。在退避模式下，每一次都会拉长等待时间。",
    "activeRun": "正在进行的巡检的运行（如果有）。",
    "revisionTitle": "守护者每次巡检所遵循的已发布修订版。",
    "ticks": "此守护者的每一次唤醒，最新的在前：是什么唤醒了它、它发现了什么，以及它设定的等待时间。",
    "outcomeFilter": "只显示具有此结果的巡检。",
    "outcomeCounts": "此页面上各个结果的巡检数量。",
    "chart": "此页面上每次巡检之后的等待时间，最早的在左侧。在退避模式下它会在平静的巡检之后增长，有事发生时重置。",
    "columns": {
     "started": "巡检开始的时间。悬停可查看确切时间。",
     "source": "这次巡检是由什么唤醒守护者的。",
     "outcome": "这次巡检的报告：平静、已处理、需要关注、已上报或失败。",
     "run": "执行这次巡检的运行。",
     "interval": "到下次唤醒的等待时间，取这次巡检结束时设定的值。",
     "cost": "这次巡检的运行花费，依据模型价格表计算。",
     "summary": "守护者说明的发现或所做的事，或导致巡检停止的错误。",
     "number": "修订版编号。当前版本会被标出。",
     "state": "草稿修订版已保存但未使用；已发布的曾经或正在使用。",
     "revisionSource": "修订版由谁编写：人、智能体架构师或监督它的智能体。",
     "author": "保存此修订版的用户或凭据。",
     "changeNote": "此修订版为何改动守护者。",
     "created": "修订版的保存时间。"
    },
    "requested": "守护者请求了这个等待时间，服务器会把它限制在最小和最大间隔之内。",
    "revisions": "此守护者的所有修订版，最新的在前。可与上一个版本对比，或发布草稿。",
    "current": "守护者当前遵循的修订版。",
    "diff": "显示此修订版相对于上一个修订版改动了什么。"
   }
  }
 },
 "explainers": {
  "keepers": {
   "title": "守护者",
   "p1": "守护者是承担长期职责的智能体。它按计划唤醒，查看事情的进展，在自己可以处理的范围内采取行动，并在每次结束时汇报一个简短的结果。每次唤醒称为一次巡检，每次巡检就是守护者所在部署的一次运行。",
   "p2": "在退避模式下，平静的巡检会让下次唤醒推后，最多推后到最大间隔，其他任何结果都会让它回到最小间隔。同一时间只会运行一次巡检：在巡检期间到来的唤醒要等它结束。",
   "p3": "对目标、计划或预算的更改都以修订版的形式进行。发布修订版会使其立即成为当前版本并唤醒守护者，每个修订版都保留在历史中，可供对比。"
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
})(zhHans, {
 "nav": {
  "hubs": {
   "autonomy": {
    "tip": "能自行持续工作的智能体：守护者按计划唤醒，照看一项长期任务；上报是它们向人提出的问题。"
   }
  },
  "items": {
   "escalations": {
    "label": "上报",
    "tip": "智能体向某人、某个角色或另一个智能体提出的问题及答复"
   }
  },
  "escalationsOpen_other": "有 {{count}} 条上报等待答复"
 },
 "enums": {
  "resourceType": {
   "Escalation": "上报"
  },
  "notificationEvent": {
   "EscalationRaised": "已提出上报",
   "EscalationExpired": "上报已超时"
  },
  "escalationStatus": {
   "Open": "待答复",
   "Answered": "已答复",
   "Expired": "已超时",
   "Cancelled": "已取消",
   "Withdrawn": "已撤回"
  },
  "escalationSeverity": {
   "Info": "信息",
   "Warning": "警告",
   "Urgent": "紧急"
  },
  "escalationMode": {
   "NonBlocking": "非阻塞",
   "Blocking": "阻塞"
  },
  "escalationTargetKind": {
   "User": "用户",
   "Role": "角色",
   "Agent": "智能体",
   "Manager": "上级"
  },
  "escalationTimeoutAction": {
   "UseDefaultAnswer": "使用默认答复",
   "Cancel": "取消",
   "EscalateUp": "继续向上上报"
  },
  "escalationResolutionSource": {
   "User": "某人",
   "Agent": "某个智能体",
   "Timeout": "超时",
   "Raiser": "提出它的运行",
   "System": "Garrison"
  }
 },
 "components": {
  "escalations": {
   "passedUp": "已向上转交",
   "answerTitle": "答复 {{agent}}",
   "submit": "发送答复",
   "expires": "{{when}}超时，之后：{{action}}",
   "question": "问题",
   "context": "背景",
   "choice": "选择一个选项",
   "default": "默认",
   "defaultAnswer": "默认答复：{{answer}}",
   "explain": "说明（可选）",
   "text": "答复",
   "textPlaceholder": "写下你的答复。智能体会把它当作数据，而不是指令。",
   "errors": {
    "choice": "请选择一个选项。",
    "unknownChoice": "这条上报没有提供该选项。",
    "text": "请写一个答复。",
    "textMax": "答复最多 {{max}} 个字符。"
   },
   "toasts": {
    "answered": "已向 {{agent}} 发送答复。",
    "passedUp": "这条上报已转交给另一条上报，请改为答复那一条。",
    "notOpen": "已有其他人先答复了，或者它已超时。",
    "forbidden": "答复需要 Escalation 的 Update 权限。"
   }
  }
 },
 "resources": {
  "escalations": {
   "title": "上报",
   "subtitle": "智能体向某人、某个角色或另一个智能体提出的问题。待答复的在等待答复；阻塞的会让其运行一直暂停到那时。",
   "add": "添加上报",
   "create": "创建上报",
   "edit": "编辑上报",
   "view": "上报详情",
   "deleteTitle": "删除上报",
   "emptyTitle": "没有上报",
   "emptyBody": "当智能体用 garrison_escalate 请某人、某个角色或另一个智能体做决定时，上报会出现在这里。",
   "columns": {
    "createdUtc": "提出时间",
    "severity": "严重程度",
    "status": "状态",
    "question": "问题",
    "agent": "智能体",
    "target": "发给",
    "expiresUtc": "超时时间",
    "answer": "答复",
    "mode": "模式",
    "mandate": "守护者",
    "resolvedBy": "答复人",
    "resolutionSource": "解决方式",
    "resolvedUtc": "解决时间",
    "raisingRunId": "提出它的运行",
    "id": "ID"
   },
   "filters": {
    "targetKind": "发给"
   },
   "fields": {
    "status": "状态",
    "severity": "严重程度",
    "mode": "模式",
    "target": "发给",
    "agent": "提出者",
    "raisingRunId": "提出它的运行",
    "mandate": "守护者",
    "mandateTickId": "守护者巡检",
    "routedRunId": "答复的运行",
    "parentEscalationId": "转交自",
    "escalatedToId": "转交至",
    "timeoutAction": "超时后",
    "expiresUtc": "超时时间",
    "createdUtc": "提出时间",
    "leaseEpoch": "租约纪元",
    "context": "背景",
    "options": "选项",
    "answerChoice": "所选项",
    "answerText": "答复",
    "resolvedBy": "答复人",
    "resolutionSource": "解决方式",
    "resolvedUtc": "解决时间"
   },
   "actions": {
    "answer": "答复",
    "openEscalatedTo": "打开转交后的上报",
    "openRun": "打开提出它的运行",
    "openKeeper": "打开守护者",
    "cancel": "取消上报"
   },
   "cancelTitle": "取消这条上报？",
   "cancelMessage": "{{agent}} 将得不到答复。这条上报会保留为已取消。",
   "cancelBlocking": "{{agent}} 正在等待这个答复。取消上报也会取消那次运行。",
   "toasts": {
    "cancelled": "上报已取消。"
   }
  },
  "keepers": {
   "fields": {
    "escalationTargetKind": "上报给",
    "escalationTargetId": "上报对象"
   },
   "noEscalationTarget": "保存该修订的人",
   "escalationTargetPlaceholder": "用户、角色或智能体的 ID 或名称",
   "errors": {
    "escalationTargetId": "请指定要上报给的用户、角色或智能体。"
   }
  },
  "notifications": {
   "fields": {
    "escalationMinimumSeverity": "上报最低严重程度"
   },
   "anySeverity": "任意严重程度"
  }
 },
 "views": {
  "escalationDetail": {
   "title": "上报",
   "titleWithAgent": "来自 {{agent}} 的上报",
   "notFoundTitle": "找不到上报",
   "notFoundBody": "它不在这个租户中，或已随租户一起删除。",
   "back": "返回上报列表",
   "open": "这条上报正在等待答复。",
   "openBlocking": "在这条上报得到答复之前，提出它的运行处于暂停状态。",
   "expires": "它将在{{when}}超时，之后：{{action}}。",
   "passedUp": "没有人及时答复，所以这条上报已被转交。请答复新的那一条：",
   "question": "问题",
   "chosen": "已选",
   "answer": "答复"
  },
  "home": {
   "escalations": {
    "title_other": "{{count}} 条上报等待答复",
    "open": "打开上报",
    "more_other": "还有 {{count}} 条。"
   }
  }
 },
 "tips": {
  "nav": {
   "escalationsBadge_other": "有 {{count}} 条上报等待答复。打开“自主运行”，再打开“上报”。",
   "tabs": {
    "escalations": "上报：智能体向某人、某个角色或另一个智能体提出的问题，待答复的排在前面，可以答复或取消。"
   }
  },
  "enums": {
   "resourceType": {
    "Escalation": "运行向某人、某个角色或另一个智能体提出的问题及其答复。"
   },
   "notificationEvent": {
    "EscalationRaised": "某个智能体提出了上报。端点可以跳过低于最低严重程度的上报。",
    "EscalationExpired": "一条上报在有人答复之前超时了。"
   },
   "escalationStatus": {
    "Open": "等待答复。阻塞的上报会让其运行一直暂停到那时。",
    "Answered": "有人已答复；提出它的运行或守护者已收到答复。",
    "Expired": "超时前没有人答复，已执行超时操作。",
    "Cancelled": "有人取消了它；等待它的运行也已取消。",
    "Withdrawn": "提出它的智能体撤回了问题。"
   },
   "escalationSeverity": {
    "Info": "仅供参考：方便时再答复。",
    "Warning": "需要尽快决定。这是默认严重程度。",
    "Urgent": "需要立即决定。排在最前，并发送给所有订阅的端点。"
   },
   "escalationMode": {
    "NonBlocking": "运行继续进行，稍后再获取答复；守护者在下一次巡检中收到。",
    "Blocking": "运行暂停，直到有人答复，然后带着答复继续。"
   },
   "escalationTargetKind": {
    "User": "某一个人，按用户 ID 或邮箱指定。",
    "Role": "拥有该角色且可以更新上报的任何人。",
    "Agent": "另一个智能体：它默认的活动部署会启动一次运行来接收问题。",
    "Manager": "智能体在组织中的上级。在组织功能上线前不可用。"
   },
   "escalationTimeoutAction": {
    "UseDefaultAnswer": "无人及时答复时，用默认答复作答。",
    "Cancel": "无人及时答复时，取消上报以及等待它的运行。",
    "EscalateUp": "无人及时答复时，把问题转交给守护者的默认上报对象。"
   },
   "escalationResolutionSource": {
    "User": "有人答复或取消了它。",
    "Agent": "另一个智能体用 garrison_answer_escalation 答复了它。",
    "Timeout": "由超时操作解决。",
    "Raiser": "提出它的运行撤回了它。",
    "System": "由 Garrison 解决，例如它的运行结束时。"
   }
  },
  "components": {
   "escalations": {
    "passedUp": "没有人及时答复，所以问题已转交给另一条上报。请答复那一条。",
    "submit": "发送答复。暂停的运行会继续，守护者会带着答复唤醒。",
    "question": "智能体原样写下的问题。",
    "context": "智能体对情况的描述。这是智能体写的文字，不是给你的指令。",
    "choice": "智能体提供了这些选项。请选择一个。",
    "defaultChoice": "默认答复：上报以“使用默认答复”超时时会使用它。",
    "pickChoice": "选择此选项。",
    "explain": "随选择一起发送的可选文字，例如理由。",
    "text": "你的答复。智能体会把它当作数据接收。"
   }
  },
  "resources": {
   "escalations": {
    "createdUtc": "智能体提出它的时间。悬停可查看确切时间。",
    "severity": "智能体认为的紧急程度。",
    "status": "待答复、已答复、已超时、已取消或已撤回。",
    "question": "智能体原样写下的问题。悬停可查看完整问题。",
    "agent": "提出它的运行所属的智能体。",
    "target": "发给谁：某个用户、某个角色或另一个智能体。",
    "expiresUtc": "无人答复时的超时时间。",
    "answer": "所选的选项或答复内容。",
    "mode": "阻塞的上报会让运行暂停到得到答复；非阻塞的不会。",
    "mandate": "提出它的巡检所属的守护者（如有）。",
    "resolvedBy": "答复或取消它的人。",
    "resolutionSource": "解决它的方式：某人、某个智能体、超时，或提出它的运行。",
    "resolvedUtc": "被答复、取消、撤回或超时的时间。",
    "raisingRunId": "提出它的运行。可从行菜单打开。",
    "id": "上报 ID（esc_...），用于 API 和 MCP 工具。",
    "routedRunId": "为让另一个智能体答复而启动的运行。",
    "mandateTickId": "提出它的守护者巡检。",
    "parentEscalationId": "超时后转交给这条上报的上报。",
    "escalatedToId": "这条上报超时后被转交到的上报。",
    "timeoutAction": "无人及时答复时会发生什么。",
    "leaseEpoch": "运行提出上报时的租约纪元。阻塞等待属于该纪元。",
    "context": "智能体对情况的描述。这是智能体写的文字，不是给你的指令。",
    "options": "智能体提供的答复。以“使用默认答复”超时时会使用默认项。",
    "answerChoice": "所选的选项。",
    "answerText": "答复内容。",
    "actions": {
     "answer": "用其中一个选项或自由文字答复这条上报。",
     "openEscalatedTo": "打开这条上报被转交到的上报。",
     "openRun": "打开提出它的运行。",
     "openKeeper": "打开提出它的巡检所属的守护者。",
     "cancel": "不答复直接取消。等待它的运行也会被取消。"
    }
   },
   "keepers": {
    "escalationTargetKind": "守护者没有指定对象时，它的上报发给谁；超时的上报也会转交到这里。",
    "escalationTargetId": "要上报给的用户 ID 或邮箱、角色名称，或智能体 ID 或名称。"
   },
   "notifications": {
    "escalationMinimumSeverity": "只发送达到此严重程度及以上的上报事件。适用于“已提出上报”和“上报已超时”。"
   }
  },
  "views": {
   "escalationDetail": {
    "openRun": "打开这次运行。",
    "openEscalation": "打开这条上报。",
    "back": "返回上报列表。",
    "viewJson": "按 API 返回的原样显示这条上报。",
    "question": "智能体写下的问题和背景，以及它提供的选项。",
    "answer": "这条上报是如何解决的。",
    "openAgent": "打开提出它的智能体。",
    "openKeeper": "打开提出它的巡检所属的守护者。"
   },
   "home": {
    "escalations": {
     "title": "等待答复的上报，最紧急的排在前面。",
     "open": "打开上报列表。"
    }
   }
  },
  "filters": {
   "severity": "只显示此严重程度的上报。选择“全部”可移除筛选。",
   "targetKind": "只显示发给用户、角色或智能体的上报。选择“全部”可移除筛选。"
  }
 },
 "explainers": {
  "escalations": {
   "title": "上报",
   "p1": "上报是智能体在不该独自决定时提出的问题。它可以发给某个用户、拥有某个角色的所有人，或另一个智能体，并可附带选项、默认答复、严重程度和超时时间。",
   "p2": "大多数上报是非阻塞的：运行继续进行，守护者在下一次巡检中看到答复。阻塞的上报会暂停其运行，一旦有人答复，运行就带着答复继续。",
   "p3": "如果没有人及时答复，就执行超时操作：使用默认答复、取消，或把问题转交给守护者的默认上报对象。答复以数据形式送达智能体，不会扩大它的权限。"
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
})(zhHans, {
 "nav": {
  "items": {
   "freezes": {
    "label": "冻结",
    "tip": "对智能体、部署、守护者和应用的制动，以及自主运行的紧急停止开关"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Freeze": "冻结"
  },
  "auditEventType": {
   "FreezeApplied": "已施加冻结",
   "FreezeLifted": "已解除冻结",
   "KillSwitchChanged": "紧急停止开关已更改",
   "BoardDirectionGiven": "已下达董事会指示"
  },
  "notificationEvent": {
   "FreezeApplied": "已施加冻结",
   "MandateCapReached": "守护者达到支出上限"
  },
  "freezeTargetKind": {
   "Agent": "智能体",
   "Deployment": "部署",
   "Mandate": "守护者",
   "App": "应用",
   "OrgUnit": "组织单元",
   "Organization": "组织",
   "TenantAutonomy": "紧急停止开关"
  }
 },
 "errorCodes": {
  "Frozen": "已被冻结：在解除冻结之前，新的运行都会被拒绝。",
  "AlreadyFrozen": "已经被冻结。请先解除那个冻结，或保持不变。",
  "FreezeLifted": "已有人解除了这个冻结。",
  "KillSwitch": "自主运行的紧急停止开关已打开，因此守护者的运行会被拒绝。",
  "MandateBudgetExceeded": "这个守护者已用完本次巡检或今天的预算。",
  "OrganizationsUnavailable": "组织冻结将随组织功能一起提供。请改为冻结智能体、部署、守护者或应用。"
 },
 "freezes": {
  "killSwitchTarget": "自主运行的紧急停止开关",
  "freezeTitle": "要冻结吗？",
  "freezeMessage": "要冻结 {{target}} 吗？在解除冻结之前，新的运行都会被拒绝，范围内的守护者也不再唤醒。",
  "freezePickMessage": "选择要冻结的对象。在解除冻结之前，新的运行都会被拒绝，范围内的守护者也不再唤醒。",
  "pickTarget": "请选择...",
  "reasonPlaceholder": "原因是什么？看到这个冻结的人会读到这段文字。",
  "liftTitle": "要解除这个冻结吗？",
  "liftMessage": "要解除 {{target}} 的冻结吗？新的运行会重新被接受。",
  "liftKeeperMessage": "要解除 {{target}} 的冻结吗？守护者会重新启用，下一次唤醒会分散在一个短时间窗口内。",
  "bannerOwn": "已冻结：在解除冻结之前，新的运行都会被拒绝。",
  "bannerTarget": "{{target}} 已被冻结：它的新运行会被拒绝。",
  "bannerKillSwitch": "自主运行的紧急停止开关已打开：此租户中不会开始任何守护者巡检。",
  "bannerBy": "由 {{who}} 于 {{when}} 冻结。",
  "bannerReason": "原因：{{reason}}",
  "openTarget": "打开",
  "status": {
   "active": "生效中",
   "lifted": "已解除"
  },
  "fields": {
   "targetKind": "冻结对象类型",
   "target": "对象",
   "reason": "原因（可选）",
   "liftReason": "解除原因（可选）",
   "cancelActiveRuns": "同时取消已在进行的运行"
  },
  "actions": {
   "freeze": "冻结",
   "freezeAny": "选择对象并冻结",
   "lift": "解除冻结",
   "openTarget": "打开被冻结的对象"
  },
  "errors": {
   "reasonMax": "原因最多 {{max}} 个字符。",
   "target": "请选择要冻结的对象。"
  },
  "toasts": {
   "frozen": "{{target}} 已被冻结。",
   "frozenCancelled_other": "{{target}} 已被冻结，并取消了 {{count}} 个进行中的运行。",
   "lifted": "{{target}} 的冻结已解除。"
  },
  "killSwitch": {
   "title": "自主运行紧急停止开关",
   "on": "开",
   "off": "关",
   "turnOn": "打开",
   "turnOff": "关闭",
   "help": "紧急停止开关打开期间，不会开始任何守护者巡检，守护者的运行也会被拒绝。由人员和 API 凭据发起的调用照常工作。",
   "changedBy": "由 {{who}} 于 {{when}} 打开。",
   "onTitle": "要打开紧急停止开关吗？",
   "onMessage": "在关闭开关之前，此租户中的所有守护者都不再唤醒，守护者的运行也会被拒绝。已在进行的巡检会完成。",
   "offTitle": "要关闭紧急停止开关吗？",
   "offMessage": "守护者会重新开始唤醒，下一次唤醒会分散在一个短时间窗口内。",
   "toasts": {
    "on": "紧急停止开关已打开。不会开始任何守护者巡检。",
    "off": "紧急停止开关已关闭。守护者会重新唤醒。"
   }
  }
 },
 "resources": {
  "freezes": {
   "title": "冻结",
   "subtitle": "在有人解除之前，拒绝智能体、部署、守护者或应用新运行的制动。紧急停止开关也显示在这里。",
   "add": "添加冻结",
   "create": "创建冻结",
   "edit": "编辑冻结",
   "view": "冻结详情",
   "deleteTitle": "删除冻结",
   "emptyTitle": "没有冻结",
   "emptyBody": "当前没有任何冻结。可以在智能体、部署、守护者或应用的页面上冻结，或使用“选择对象并冻结”。",
   "columns": {
    "createdUtc": "冻结时间",
    "status": "状态",
    "targetKind": "类型",
    "target": "对象",
    "reason": "原因",
    "createdBy": "冻结人",
    "cancelledRunCount": "已取消的运行",
    "liftedUtc": "解除时间",
    "liftedBy": "解除人",
    "liftReason": "解除原因",
    "targetId": "对象 ID",
    "id": "ID"
   }
  }
 },
 "views": {
  "home": {
   "autonomy": {
    "freezes_other": "{{count}} 个冻结生效中"
   }
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "freezes": "冻结：对智能体、部署、守护者和应用的制动，生效中的排在前面，可冻结和解除。"
   }
  },
  "enums": {
   "resourceType": {
    "Freeze": "阻止智能体、部署、守护者或应用新运行的冻结，以及自主运行的紧急停止开关。"
   },
   "auditEventType": {
    "FreezeApplied": "有人冻结了智能体、部署、守护者或应用。",
    "FreezeLifted": "有人解除了一个冻结。",
    "KillSwitchChanged": "有人打开或关闭了自主运行的紧急停止开关。",
    "BoardDirectionGiven": "有人从董事会向 CEO 守护者下达了指示。"
   },
   "notificationEvent": {
    "FreezeApplied": "有人冻结了智能体、部署、守护者或应用，或打开了紧急停止开关。",
    "MandateCapReached": "某个守护者达到每日支出上限，在下一个 UTC 日之前不再唤醒。"
   },
   "freezeTargetKind": {
    "Agent": "智能体的所有部署：新的运行会被拒绝，它的守护者不再唤醒。",
    "Deployment": "一个部署：新的运行会被拒绝，在其上运行的守护者不再唤醒。",
    "Mandate": "一个守护者：在解除冻结之前不再唤醒。",
    "App": "一个应用：其聊天中的新对话和新消息会被拒绝。",
    "OrgUnit": "一个组织单元。组织功能推出之前不可用。",
    "Organization": "整个组织。组织功能推出之前不可用。",
    "TenantAutonomy": "紧急停止开关：整个租户中不会开始任何守护者巡检。"
   }
  },
  "freezes": {
   "denied": "你无权执行此操作。需要对冻结拥有 {{operation}} 权限。",
   "openTarget": "打开这个冻结所阻止对象的页面。",
   "status": {
    "active": "生效中：范围内新的运行会被拒绝。",
    "lifted": "已有人解除；运行会重新被接受。"
   },
   "actions": {
    "freeze": "冻结：在解除之前，新的运行都会被拒绝，范围内的守护者不再唤醒。需要先确认。",
    "freezeAny": "选择一个智能体、部署、守护者或应用并冻结它。需要先确认。",
    "lift": "解除冻结，让新的运行重新被接受。需要先确认。"
   },
   "fields": {
    "targetKind": "冻结一个智能体（及其所有部署）、一个部署、一个守护者或一个应用。",
    "target": "要冻结的记录。",
    "reason": "可选。显示在冻结横幅和审计日志中。",
    "liftReason": "可选。与冻结一起记录，并写入审计日志。",
    "cancelActiveRuns": "同时取消范围内已在排队或正在进行的运行。不选的话，它们会运行完毕。"
   },
   "filters": {
    "active": "只显示生效中的冻结或只显示已解除的冻结。选择“全部”可同时显示。",
    "targetKind": "只显示此类型的冻结。选择“全部”可移除筛选。"
   },
   "killSwitch": {
    "title": "一个能停止此租户中所有守护者的开关。普通调用照常工作。",
    "on": "开：不会开始任何守护者巡检，守护者的运行会被拒绝。",
    "off": "关：守护者按计划唤醒。",
    "turnOn": "停止此租户中的所有守护者。需要先确认。",
    "turnOff": "让守护者重新唤醒。需要先确认。"
   }
  },
  "resources": {
   "freezes": {
    "createdUtc": "冻结的时间。将指针悬停可查看确切时间。",
    "status": "冻结生效期间为“生效中”，之后为“已解除”。",
    "targetKind": "被冻结记录的类型。",
    "target": "被冻结的智能体、部署、守护者或应用。",
    "reason": "冻结的原因。将指针悬停可查看全文。",
    "createdBy": "执行冻结的人。",
    "cancelledRunCount": "在要求取消时，冻结取消的进行中运行数量。",
    "liftedUtc": "解除冻结的时间。",
    "liftedBy": "解除冻结的人。",
    "liftReason": "解除冻结的原因。",
    "targetId": "被冻结记录的 ID。",
    "id": "冻结的 ID（mfz_...），用于 API 和 MCP 工具。"
   }
  },
  "views": {
   "home": {
    "autonomy": {
     "freezes": "打开生效中的冻结列表。"
    }
   }
  },
  "filters": {
   "active": "只显示启用的记录或只显示停用的记录。选择“全部”可同时显示。"
  }
 },
 "explainers": {
  "freezes": {
   "title": "冻结",
   "p1": "冻结是一种制动。生效期间，Garrison 会以 409 Frozen 拒绝被冻结的智能体、部署、守护者或应用的新运行，范围内的守护者也不再唤醒。已在进行的运行会完成，除非冻结同时取消了它们。",
   "p2": "可以在智能体、部署、守护者或应用的页面上冻结，也可以在这里使用“选择对象并冻结”。解除冻结后，运行会重新被接受；被冻结的守护者会重新启用，下一次唤醒会分散在一个短时间窗口内。",
   "p3": "设置和主页上的自主运行紧急停止开关会一次性停止租户中所有守护者的巡检。它在这里显示为类型为“紧急停止开关”的冻结。"
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
})(zhHans, {
 "nav": {
  "items": {
   "memory": {
    "label": "记忆",
    "tip": "智能体和人员保存的内容，按范围列出，并显示每条记录的写入者和时间"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Memory": "记忆"
  },
  "memoryScopeKind": {
   "Agent": "智能体",
   "App": "应用",
   "OrgUnit": "组织单元",
   "Organization": "组织"
  }
 },
 "errorCodes": {
  "MemoryVersionConflict": "这条记忆在你加载后已被更改。请重新加载后再做决定。",
  "MemoryDisabled": "此服务器已关闭智能体记忆，因此无法读取条目文本，也无法删除条目。"
 },
 "memory": {
  "legacy": "旧版",
  "deletedScope": "{{id}}（已删除）",
  "neverRead": "从未",
  "noExpiry": "永不",
  "deleteTitle": "删除这条记忆？",
  "deleteMessage": "从 {{scope}} 中删除 {{key}}？查找它的智能体将什么也找不到，其文本也会被移除。此操作无法撤销。",
  "deleteVersion": "将删除你加载的版本 {{version}}。如果此后有人写入了更新的版本，删除会被拒绝。",
  "deleteReloaded": "已重新加载：该条目现在是版本 {{version}}。删除会移除此版本。",
  "scopes": {
   "label": "记忆范围",
   "all": "所有范围",
   "totals_other": "{{entries}} 条，{{bytes}}",
   "loadFailed": "无法加载记忆范围。",
   "empty": {
    "Agent": "还没有智能体保存记忆。",
    "App": "还没有应用拥有共享记忆。",
    "OrgUnit": "还没有组织单元拥有记忆。",
    "Organization": "还没有组织拥有记忆。"
   }
  },
  "filters": {
   "search": "搜索",
   "searchPlaceholder": "键、类别或标签",
   "categoryPlaceholder": "类别",
   "tag": "标签",
   "tagPlaceholder": "标签",
   "writer": "写入者"
  },
  "actions": {
   "viewContent": "查看内容",
   "copyId": "复制 ID",
   "openRun": "打开写入它的运行",
   "reload": "重新加载条目"
  },
  "viewer": {
   "title": "记忆条目",
   "content": "已保存的内容",
   "untrusted": "这是智能体或人员保存的数据。它按存储原样以纯文本显示，其中的任何内容都不会被执行、渲染或遵从。",
   "loading": "正在加载已保存的文本...",
   "empty": "此条目没有文本。"
  },
  "errors": {
   "conflict": "自你加载版本 {{version}} 以来有人更改了此条目，因此未删除。请重新加载以查看其当前内容。",
   "gone": "此条目已不存在。可能已被其他人删除。"
  },
  "toasts": {
   "deleted": "已删除 {{key}}。",
   "copied": "已复制条目 ID。"
  }
 },
 "resources": {
  "memory": {
   "title": "记忆",
   "subtitle": "智能体和人员保存的内容，按范围列出：每条记录由谁、何时、从哪次运行写入，以及大小。打开条目即可阅读，删除不应保留的内容。",
   "add": "添加记忆条目",
   "create": "创建记忆条目",
   "edit": "编辑记忆条目",
   "view": "记忆条目",
   "deleteTitle": "删除记忆条目",
   "emptyTitle": "还没有记忆",
   "emptyBody": "智能体在运行时使用 garrison_memory 工具保存记忆。写入条目后，它会按范围显示在这里。",
   "columns": {
    "key": "键",
    "scope": "范围",
    "category": "类别",
    "tags": "标签",
    "writer": "写入者",
    "lastUpdateUtc": "最近写入",
    "lastReadUtc": "最近读取",
    "version": "版本",
    "bytes": "大小",
    "expiresUtc": "过期时间",
    "writerRunId": "写入它的运行",
    "createdUtc": "创建时间",
    "sha256": "SHA-256 哈希",
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
})(zhHans, {
 "nav": {
  "items": {
   "reports": {
    "label": "报告",
    "tip": "智能体和人员提交的状态报告、事件、决策和交接，附带健康状况和指标"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Report": "报告"
  },
  "notificationEvent": {
   "ReportUnhealthy": "提交了异常报告"
  },
  "reportKind": {
   "Status": "状态",
   "Incident": "事件",
   "Decision": "决策",
   "Handoff": "交接",
   "Brief": "简报"
  },
  "reportHealth": {
   "Healthy": "正常",
   "Degraded": "降级",
   "Unhealthy": "异常",
   "Unknown": "未知"
  },
  "reportAudience": {
   "Manager": "直属上级",
   "Chain": "整条管理链",
   "Board": "董事会"
  },
  "reportIssueSeverity": {
   "Low": "低",
   "Medium": "中",
   "High": "高"
  }
 },
 "reports": {
  "untrusted": "这份报告由智能体或人员撰写。其标题、正文、指标、问题和决策都按提交时的原样以纯文本显示；其中的内容不会被执行、渲染或当作指令遵循。",
  "period": "{{from}} 至 {{to}}",
  "periodFrom": "自 {{from}} 起",
  "periodTo": "截至 {{to}}",
  "filters": {
   "author": "作者",
   "app": "应用",
   "from": "提交时间晚于",
   "to": "提交时间早于"
  },
  "actions": {
   "file": "提交报告",
   "copyId": "复制 ID",
   "openRun": "打开运行",
   "openKeeper": "打开守护者",
   "openAuthor": "打开作者"
  },
  "toasts": {
   "filed": "已提交 {{title}}。",
   "copied": "已复制报告 ID。"
  },
  "file": {
   "title": "提交报告",
   "intro": "记下当前的情况。所有能阅读报告的人都会在这里看到它，健康状况为异常的报告会通知订阅了该事件的端点。报告提交后无法修改。",
   "noAgent": "不指定智能体（以我本人的名义）",
   "fields": {
    "title": "标题",
    "kind": "类型",
    "health": "健康状况",
    "audience": "读者",
    "agent": "代表智能体提交",
    "body": "正文"
   },
   "errors": {
    "title": "请为报告填写 1 到 {{max}} 个字符的标题。",
    "body": "正文最多 {{max}} 字节。"
   }
  },
  "chart": {
   "metric": "指标",
   "title": "{{metric}} 随时间变化",
   "help_other": "{{agent}} 报告的 {{count}} 个值，按时间从早到晚排列。",
   "noMetrics": "这份报告没有指标，因此没有可绘制的内容。",
   "noAuthor": "这份报告不是由智能体撰写的，因此没有作者的历史可绘制。",
   "empty": "这个指标还没有任何值。",
   "failed": "无法加载指标历史。"
  }
 },
 "views": {
  "reportDetail": {
   "title": "报告",
   "notFoundTitle": "未找到报告",
   "notFoundBody": "它不在这个租户中，或已随租户一起删除。",
   "back": "返回报告列表",
   "body": "正文",
   "metrics": "指标",
   "chart": "指标历史",
   "issues": "问题",
   "decisions": "决策",
   "noBody": "这份报告没有正文。",
   "noMetrics": "这份报告没有指标。",
   "noIssues": "没有报告任何问题。",
   "noDecisions": "没有记录任何决策。",
   "columns": {
    "name": "名称",
    "value": "值",
    "unit": "单位"
   },
   "fields": {
    "health": "健康状况",
    "kind": "类型",
    "audience": "读者",
    "author": "作者",
    "period": "时间段",
    "createdUtc": "提交时间",
    "filedBy": "提交者",
    "runId": "运行",
    "mandateId": "守护者",
    "mandateTickId": "守护者巡检",
    "app": "应用",
    "orgUnitId": "组织单元"
   }
  }
 },
 "resources": {
  "reports": {
   "title": "报告",
   "subtitle": "智能体和人员向上提交的内容：当前情况、事件、决策和交接，附带健康状况和指标。打开一份报告即可阅读，并查看某个指标随时间的变化。",
   "add": "提交报告",
   "create": "提交报告",
   "edit": "报告",
   "view": "报告详情",
   "deleteTitle": "删除报告",
   "emptyTitle": "还没有报告",
   "emptyBody": "智能体在运行时使用 garrison_file_report 工具提交报告，人员可以在这里或通过 API 提交。提交后会显示在这里。",
   "columns": {
    "createdUtc": "提交时间",
    "title": "标题",
    "author": "作者",
    "kind": "类型",
    "health": "健康状况",
    "app": "应用",
    "period": "时间段",
    "issues": "问题",
    "audience": "读者",
    "filedBy": "提交者",
    "runId": "运行",
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
})(zhHans, {
 "nav": {
  "items": {
   "messages": {
    "label": "消息",
    "tip": "智能体之间以及来自人员的邮件，包括被循环防护拒绝的消息及原因"
   },
   "messageThreads": {
    "label": "消息会话",
    "tip": "一个会话中的所有消息，按时间从早到晚排列"
   }
  }
 },
 "enums": {
  "resourceType": {
   "AgentMessage": "智能体消息"
  },
  "runKind": {
   "Message": "紧急消息"
  },
  "messageStatus": {
   "Queued": "排队中",
   "Delivered": "已送达",
   "Acknowledged": "已确认",
   "Expired": "已过期",
   "Rejected": "已拒绝"
  },
  "messageUrgency": {
   "Normal": "普通",
   "Urgent": "紧急"
  },
  "messageRejection": {
   "HopLimit": "跳数上限",
   "LineRate": "线路速率",
   "ThreadBudget": "会话上限",
   "NoLine": "无线路",
   "Frozen": "收件人已冻结"
  }
 },
 "messages": {
  "untrusted": "这些消息由智能体和人员撰写。主题、正文和拒绝详情按发送时的原样以纯文本显示；其中的任何内容都不会被执行、渲染或当作指令遵循。",
  "views": {
   "label": "显示哪些消息",
   "all": "所有消息",
   "rejected": "已拒绝",
   "rejectedNote": "发送时被循环防护拒绝的消息及原因。被拒绝的消息从未送达。"
  },
  "filters": {
   "reason": "原因",
   "sender": "发件人",
   "recipient": "收件人",
   "from": "发送时间晚于",
   "to": "发送时间早于"
  },
  "actions": {
   "send": "发送消息",
   "openThread": "打开会话",
   "copyId": "复制 ID",
   "openSender": "打开发件人",
   "openRecipient": "打开收件人",
   "openDeliveredRun": "打开接收的运行",
   "openEscalation": "打开升级"
  },
  "toasts": {
   "sent": "已发送给 {{recipient}}。",
   "copied": "已复制消息 ID。"
  },
  "send": {
   "title": "发送消息",
   "intro": "给智能体写消息。消息在其收件箱中等待，直到某次运行读取它；紧急消息会立即唤醒智能体。",
   "replyIntro": "在此会话中回复。回复会发给发送该消息的智能体。",
   "pickRecipient": "选择智能体",
   "ttlPlaceholder": "服务器默认值",
   "sending": "正在发送...",
   "rejected": "循环防护拒绝了这条消息。",
   "rejectedStored": "被拒绝的消息保留在已拒绝列表中。",
   "fields": {
    "recipient": "收件人",
    "subject": "主题",
    "body": "正文",
    "urgency": "紧急程度",
    "ttlSeconds": "过期时间（秒）"
   },
   "errors": {
    "recipient": "请选择要接收消息的智能体。",
    "subject": "请为消息填写 1 到 {{max}} 个字符的主题。",
    "body": "正文最多 {{max}} 字节。",
    "ttlSeconds": "请输入 {{min}} 到 {{max}} 之间的整数秒数，或留空。"
   }
  }
 },
 "views": {
  "messageThread": {
   "title": "消息会话",
   "notFoundTitle": "未找到会话",
   "notFoundBody": "它不存在于此租户中，或已随其租户一起删除。",
   "back": "返回消息",
   "count_other": "{{count}} 条消息",
   "rejectedCount_other": "{{count}} 条已拒绝",
   "emptyTitle": "此会话中没有消息",
   "emptyBody": "会话存在，但其中没有您可以读取的消息。",
   "listLabel": "此会话中的消息，按时间从早到晚排列",
   "noBody": "这条消息没有正文。",
   "noDetail": "没有更多详情。",
   "woke": "已唤醒收件人",
   "artifacts": "附带的产物",
   "reply": "回复",
   "replyPrefix": "回复：",
   "fields": {
    "sender": "发件人",
    "recipient": "收件人",
    "createdUtc": "发送时间",
    "hopCount": "跳数",
    "deliveredRunId": "送达的运行",
    "deliveredUtc": "送达时间",
    "acknowledgedUtc": "确认时间",
    "expiresUtc": "过期时间",
    "wokeRecipient": "唤醒",
    "escalationId": "升级",
    "id": "消息 ID"
   }
  },
  "agentDetail": {
   "inbox": {
    "tab": "收件箱",
    "status": "状态",
    "openAll": "在消息中打开",
    "none": "此智能体还没有消息。",
    "noneWithStatus": "此智能体没有该状态的消息。",
    "more": "显示 {{total}} 条中最新的 {{shown}} 条。打开消息页面可查看全部。"
   }
  },
  "home": {
   "autonomy": {
    "rejected_other": "过去 24 小时内有 {{count}} 条消息被循环防护拒绝",
    "noneRejected": "过去 24 小时内没有消息被循环防护拒绝"
   }
  }
 },
 "resources": {
  "messages": {
   "title": "消息",
   "subtitle": "智能体之间以及来自人员的邮件，最新的在前，包括被循环防护拒绝的消息。打开一条即可阅读整个会话。",
   "add": "发送消息",
   "create": "发送消息",
   "edit": "消息",
   "view": "消息详情",
   "deleteTitle": "删除消息",
   "emptyTitle": "还没有消息",
   "emptyBody": "智能体在运行时用 garrison_send_message 工具发送消息，人员可在此处或通过 API 发送。消息发送后会显示在这里。",
   "columns": {
    "createdUtc": "发送时间",
    "urgency": "紧急程度",
    "status": "状态",
    "subject": "主题",
    "sender": "发件人",
    "recipient": "收件人",
    "reason": "拒绝",
    "hopCount": "跳数",
    "deliveredRunId": "送达的运行",
    "expiresUtc": "过期时间",
    "escalationId": "升级",
    "threadId": "会话",
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
})(zhHans, {
 "nav": {
  "items": {
   "organizations": {
    "label": "组织",
    "tip": "由单元组成的树，包含负责人、成员、对等线路和预算，以修订版形式发布"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Organization": "组织"
  },
  "organizationStatus": {
   "Draft": "草稿",
   "Active": "活动",
   "Frozen": "已冻结",
   "Retired": "已停用"
  },
  "budgetPeriod": {
   "Day": "日",
   "Month": "月"
  },
  "orgRevisionState": {
   "Draft": "草稿",
   "Published": "已发布",
   "Superseded": "已被取代"
  }
 },
 "organizations": {
  "notPublished": "未发布",
  "actions": {
   "open": "打开组织",
   "copyId": "复制 ID"
  },
  "toasts": {
   "copied": "已复制组织 ID。",
   "unitAdded": "已将单元 {{name}} 添加到工作树。",
   "unitSaved": "已保存单元 {{name}}。",
   "unitRemoved": "已从工作树中移除单元 {{name}}。",
   "published": "修订版 {{number}} 已上线。",
   "drafted": "已将修订版 {{number}} 保存为草稿。",
   "rolledBack": "已回滚到修订版 {{number}}。修订版 {{live}} 已上线。",
   "retired": "已停用 {{name}}。",
   "reactivated": "已恢复 {{name}}。"
  },
  "errors": {
   "OneRoot": "一个组织只有一个根单元，也就是没有上级单元的那个。",
   "ParentNotFound": "上级单元不属于此组织。",
   "Cycle": "单元不能位于自身之下，也不能位于其下属单元之下。",
   "UnitNameTaken": "此组织中已有其他单元使用这个名称。",
   "LeadsTwoUnits": "此智能体已经是另一个单元的负责人。在一个组织中，一个智能体最多负责一个单元。",
   "PositionTaken": "此智能体已在该组织中担任职位。一个智能体只能是一个单元的负责人或成员。",
   "PeerNotFound": "某条对等线路指向的单元不属于此组织。",
   "BudgetPeriodTaken": "一个单元在每个周期只能有一个预算。",
   "BudgetInvalid": "预算必须是以美元计的正数金额。",
   "BudgetExceedsParent": "单元的预算不能超过其上级单元的预算。",
   "TooManyUnits": "此组织的单元数量已达到服务器允许的上限。",
   "TooManyMembers": "此单元的成员数量已达到服务器允许的上限。",
   "TooManyPeerLines": "此单元的对等线路数量已达到服务器允许的上限。",
   "UnitHasChildren": "请先移除或移动此单元下属的单元。",
   "OrganizationRetired": "此组织已停用。请先恢复再进行更改。",
   "AgentInactive": "该智能体不存在或未处于活动状态。",
   "MandateMismatch": "该守护者属于另一个智能体。请选择担任此职位的智能体的守护者。",
   "RevisionMismatch": "该修订版属于另一个组织。",
   "RevisionPublished": "该修订版已经发布。",
   "RevisionNeverPublished": "只能回滚到曾经上线过的修订版。",
   "AlreadyLive": "该修订版已经上线。",
   "NothingToRollBack": "没有可以返回的更早的上线修订版。",
   "StatusNotSettable": "组织只能被停用，或从停用状态恢复。其他状态由发布和冻结决定。",
   "NameConflict": "已有其他组织使用这个名称。"
  },
  "spend": {
   "noBudget": "{{period}}：已支出 {{spent}}，无预算",
   "of": "{{period}}：{{spent}} / {{amount}}（{{percent}}）",
   "exhausted": "预算已用完"
  },
  "chart": {
   "lead": "负责人",
   "noLead": "无负责人",
   "members": "成员（{{count}}）",
   "peers": "对等线路",
   "app": "应用",
   "collapse": "折叠 {{name}} 下属的单元",
   "expand": "展开 {{name}} 下属的单元",
   "addChild": "添加下属单元"
  },
  "unit": {
   "addTitle": "添加单元",
   "editTitle": "编辑单元 {{name}}",
   "add": "添加单元",
   "saving": "正在保存...",
   "intro": "更改会写入工作树。在发布修订版之前，不会有任何内容上线。名称最多 {{max}} 个字符。",
   "namePlaceholder": "计费",
   "titlePlaceholder": "计费负责人",
   "noParent": "无（根单元）",
   "noLead": "尚无负责人",
   "noMandate": "无守护者",
   "noApp": "无应用",
   "noPeers": "请先添加另一个单元，才能为它建立对等线路。",
   "noBudget": "无预算",
   "addMember": "添加成员",
   "sections": {
    "lead": "负责人",
    "members": "成员和对等线路",
    "budgets": "预算"
   },
   "fields": {
    "name": "名称",
    "parentUnitId": "汇报对象",
    "description": "描述",
    "leadAgentId": "负责人智能体",
    "leadTitle": "负责人头衔",
    "leadMandateId": "负责人守护者",
    "appId": "应用",
    "members": "成员",
    "memberAgent": "智能体",
    "memberTitle": "头衔",
    "memberMandate": "守护者",
    "peerUnitIds": "对等线路",
    "budgetDay": "每日预算（USD）",
    "budgetMonth": "每月预算（USD）"
   },
   "errors": {
    "name": "请为单元输入 1 到 {{max}} 个字符的名称。",
    "description": "描述最多 {{max}} 个字符。",
    "title": "头衔最多 {{max}} 个字符。",
    "memberAgent": "请为每个成员选择一个智能体，或删除空行。",
    "duplicateAgent": "一个智能体在该单元中只能担任一个职位。",
    "budget": "请输入大于零的金额，或留空表示不设预算。"
   }
  },
  "form": {
   "errors": {
    "name": "请为组织输入 1 到 {{max}} 个字符的名称。",
    "text": "此字段最多 {{max}} 个字符。"
   }
  },
  "diff": {
   "none": "没有差异。两棵树完全相同。",
   "empty": "（无）",
   "between": "从 {{before}} 到 {{after}}。",
   "added": "新增的单元（{{count}}）",
   "removed": "移除的单元（{{count}}）",
   "changed": "更改的单元（{{count}}）",
   "field": "字段",
   "fields": {
    "name": "名称",
    "description": "描述",
    "parent": "汇报对象",
    "lead": "负责人",
    "leadTitle": "负责人头衔",
    "leadMandate": "负责人守护者",
    "app": "应用",
    "members": "成员",
    "peers": "对等线路",
    "budgets": "预算"
   },
   "title": "修订版 {{number}} 与已上线组织的比较",
   "pendingTitle": "未发布的更改",
   "nothingLive": "尚无上线内容",
   "working": "工作树"
  },
  "revisions": {
   "label": "修订版 {{number}}",
   "rollbackOf": "（修订版 {{number}} 的副本）"
  },
  "rollback": {
   "note": "已从仪表板回滚到修订版 {{number}}。"
  }
 },
 "views": {
  "organizationDetail": {
   "title": "组织",
   "heading": "组织 {{name}}",
   "notFoundTitle": "未找到组织",
   "notFoundBody": "它不存在于此租户中，或已被删除。",
   "live": "实时更新",
   "editDetails": "编辑详情",
   "reactivate": "恢复",
   "retire": "停用",
   "publish": "发布更改",
   "retiredBanner": "此组织已停用。其指挥链、线路和预算不再生效，在恢复之前，其中的任何内容都无法更改。",
   "pending": "工作树有未发布的更改：新增 {{added}}，更改 {{changed}}，移除 {{removed}}。",
   "neverPublished": "尚无上线内容。发布一个修订版，让这个组织开始运作。",
   "reviewPending": "查看更改",
   "units": "单元",
   "lastUpdate": "上次更改",
   "tabs": {
    "chart": "组织图",
    "budgets": "预算和支出",
    "revisions": "修订版（{{count}}）"
   },
   "chartView": "显示哪棵树",
   "viewWorking": "工作树",
   "viewLive": "已上线",
   "addUnit": "添加单元",
   "addRoot": "添加根单元",
   "workingNote": "工作树是你编辑的版本。发布修订版后才会上线。",
   "liveNote": "已上线的修订版：指挥链、线路和预算都遵循这棵树。",
   "noUnitsTitle": "还没有单元",
   "noUnitsBody": "先添加由最高层智能体负责的根单元，再在其下添加单元。",
   "budgetsNote": "每项预算限制该单元及其所有下属单元在一个 UTC 日或月内可支出的金额。支出统计的是已上线修订版下已完成运行的已知成本。",
   "noBudgetsTitle": "没有预算",
   "noBudgetsBody": "编辑单元，为其设置每日或每月预算。",
   "noSpend": "没有支出记录",
   "columns": {
    "unit": "单元",
    "day": "日",
    "month": "月",
    "spend": "支出",
    "number": "修订版",
    "state": "状态",
    "note": "备注",
    "author": "作者",
    "created": "创建时间",
    "published": "发布时间"
   },
   "noRevisionsTitle": "还没有修订版",
   "noRevisionsBody": "发布更改，将工作树的快照保存为修订版。",
   "current": "已上线",
   "compare": "与已上线版本比较",
   "publishRevision": "发布",
   "rollback": "回滚",
   "publishTitle": "发布更改",
   "publishIntro": "发布会将工作树的快照保存为新修订版并使其上线，其中引用的每个守护者都使用其当前修订版。保存为草稿只保留快照，不会上线。",
   "saveDraft": "保存为草稿",
   "publishNow": "发布",
   "note": "备注",
   "diffNote": "备注：{{note}}",
   "removeUnitTitle": "移除单元",
   "confirmRemoveUnit": "要从工作树中移除单元 {{name}} 吗？指向它的对等线路也会一并移除。在发布之前，已上线的组织不会改变。",
   "rollbackTitle": "回滚",
   "confirmRollback": "要让修订版 {{number}} 重新上线，取代修订版 {{live}} 吗？工作树及其引用的守护者都会恢复到该修订版，回滚会记录为一个新修订版。",
   "retireTitle": "停用组织",
   "confirmRetire": "要停用 {{name}} 吗？其指挥链、线路和预算将不再生效，在恢复之前无法更改。",
   "confirmDelete": "要删除 {{name}} 及其 {{units}} 个单元和 {{revisions}} 个修订版吗？为其单元和组织保存的记忆也会被删除。此操作无法撤销。"
  }
 },
 "resources": {
  "organizations": {
   "title": "组织",
   "subtitle": "由单元组成的树，每个单元由一个智能体负责，并有成员、对等线路和预算。打开一个组织即可编辑组织图并发布。",
   "add": "创建组织",
   "create": "创建组织",
   "edit": "编辑组织",
   "view": "组织详情",
   "deleteTitle": "删除组织",
   "emptyTitle": "还没有组织",
   "emptyBody": "创建一个组织，添加由最高层智能体负责的根单元，再在其下添加单元，然后发布。",
   "columns": {
    "name": "名称",
    "status": "状态",
    "currentRevisionNumber": "已上线修订版",
    "description": "描述",
    "createdUtc": "创建时间",
    "mission": "使命",
    "id": "ID"
   },
   "fields": {
    "name": "名称",
    "description": "描述",
    "mission": "使命"
   },
   "hints": {
    "name": "1 到 {{max}} 个字符，在租户内唯一。",
    "description": "可选，最多 {{max}} 个字符。",
    "mission": "用平实的语言说明组织的用途。可选，最多 {{max}} 个字符。"
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
})(zhHans, {
 "common": {
  "fieldCodes": {
   "OneRoot": "该组织已有根单元。请为此单元选择一个上级单元。",
   "UnitNameTaken": "该组织已有同名单元。",
   "UnitNotFound": "该组织中没有此名称的单元。",
   "UnitHasChildren": "请先移除此单元下方的单元。",
   "NoSuchPeerLine": "这两个单元之间没有对等线路。",
   "OrganizationDeleted": "草稿会删除此组织。请先将其恢复。",
   "PeerNotFound": "单元不能与自身建立对等线路。"
  }
 },
 "components": {
  "studio": {
   "canvas": {
    "view": {
     "label": "画布显示内容",
     "apps": "应用",
     "organizations": "组织"
    },
    "operations": {
     "AddUnit": "添加单元",
     "RemoveUnit": "移除单元",
     "AddUnitMember": "添加成员",
     "RemoveUnitMember": "移除成员",
     "ConnectUnits": "添加对等线路",
     "DisconnectUnits": "移除对等线路"
    },
    "org": {
     "none": "草稿中还没有组织。在上方输入组织名称和单元名称即可创建一个；第一个单元就是根单元。",
     "flowLabel": "组织 {{organization}}",
     "picker": "组织",
     "units": "单元",
     "root": "根单元",
     "peers": "对等线路",
     "orgTitle": "组织 {{name}}",
     "orgHint": "选中一个单元即可编辑其成员和对等线路。单元位于其汇报对象单元之内。",
     "deleted": "草稿会删除此组织。在恢复之前，其单元无法更改。",
     "unitTitle": "单元 {{name}}",
     "reportsTo": "汇报对象",
     "lead": "负责人",
     "members": "成员（{{count}}）",
     "noMembers": "除负责人外没有其他成员。",
     "memberAgent": "智能体",
     "memberTitle": "头衔（可选）",
     "addMember": "添加成员",
     "removeMember": "移除",
     "noPeers": "没有对等线路。",
     "disconnect": "断开",
     "addChild": "在下方添加单元",
     "startPeer": "开始对等线路",
     "removeUnit": "移除单元",
     "peerTitle": "对等线路 {{from}} 与 {{to}}",
     "peerHint": "{{from}} 与 {{to}} 可以直接互发消息，无需经过共同的上级。",
     "peerList": "对等线路（{{total}}）",
     "noPeerLines": "还没有对等线路。选中一个单元并开始一条，或从单元的右侧手柄拖到另一个单元。",
     "removeTitle": "移除单元",
     "removeMessage": "要在此草稿中从组织 {{organization}} 移除单元 {{name}} 吗？涉及它的对等线路也会一并移除。下方还有单元的单元无法移除。",
     "toolbar": {
      "label": "组织工具",
      "addUnit": "添加单元",
      "unitPlaceholder": "单元名称",
      "parent": "汇报对象",
      "noParent": "无上级（根单元）",
      "under": "位于 {{name}} 之下",
      "lead": "负责人智能体",
      "leadPlaceholder": "负责人智能体（可选）",
      "leadTitle": "负责人头衔（可选）",
      "organization": "组织",
      "add": "添加"
     },
     "connectBar": {
      "message": "正在从 {{name}} 绘制对等线路。"
     },
     "keys": {
      "tab": "Tab 在单元之间移动，每个单元排在其下方单元之前。",
      "select": "Enter 或 Space 选中当前聚焦的单元并打开其属性。",
      "peer": "在一个单元上按 C 从它开始一条对等线路；在另一个单元上按 C 或 Enter 完成。",
      "remove": "Delete 在确认后移除当前聚焦的单元。",
      "add": "N 跳转到“添加单元”输入框。",
      "peers": "在对等线路列表中，Enter 选中线路，Delete 移除它。",
      "escape": "Escape 取消你开始的对等线路。"
     },
     "node": {
      "root": "根",
      "reportsTo": "汇报给 {{name}}",
      "lead": "负责人：{{name}}",
      "noLead": "无负责人",
      "members": "成员 {{list}}"
     },
     "summary": {
      "none": "没有可描述的组织。",
      "units_one": "组织 {{organization}} 有 {{count}} 个单元。",
      "units_other": "组织 {{organization}} 有 {{count}} 个单元。",
      "root": "根单元是 {{name}}。",
      "peerCount_one": "有 {{count}} 条对等线路。",
      "peerCount_other": "有 {{count}} 条对等线路。",
      "unitRoot": "{{name}} 是根单元，{{lead}}。",
      "unitChild": "{{name}} 汇报给 {{parent}}，{{lead}}。",
      "ledBy": "负责人是 {{name}}",
      "noLead": "没有负责人",
      "peer": "{{from}} 与 {{to}} 之间有对等线路。"
     },
     "a11y": {
      "unit": "按 Enter 或 Space 选中此单元。按 C 开始对等线路，按 Delete 移除此单元。",
      "peer": "两个单元之间的对等线路。",
      "handle": "拖到另一个单元以绘制对等线路"
     },
     "announce": {
      "added": "已将单元 {{name}} 添加到 {{organization}}。",
      "peerStart": "正在从 {{name}} 绘制对等线路。移到另一个单元上按 Enter，或按 Escape 取消。",
      "connected": "{{from}} 与 {{to}} 现在有对等线路。",
      "disconnected": "{{from}} 与 {{to}} 之间不再有对等线路。",
      "memberAdded": "已将 {{name}} 添加到单元 {{unit}}。",
      "memberRemoved": "已从单元 {{unit}} 移除 {{name}}。",
      "removed": "已从 {{organization}} 移除单元 {{name}}。"
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
})(zhHans, {
 "nav": {
  "items": {
   "changeRules": {
    "label": "变更规则",
    "tip": "主管可以在其子树中直接进行、无需请示的例行变更"
   }
  }
 },
 "enums": {
  "resourceType": {
   "ChangeRule": "变更规则"
  },
  "notificationEvent": {
   "OrgProposalApplied": "组织提案已应用"
  },
  "managementAccess": {
   "None": "无",
   "Drafts": "工作室草稿",
   "OrgSubtree": "主管管理其子树"
  },
  "changeClass": {
   "PromptRetune": "提示词调整",
   "WakeTuning": "唤醒调整",
   "MandateTextEdit": "守护者文本编辑",
   "AddWorker": "添加成员",
   "RemoveWorker": "移除成员",
   "ModelChange": "模型变更",
   "DeploymentWeight": "部署权重"
  }
 },
 "errorCodes": {
  "RulesArePeopleOnly": "只有人员可以编写变更规则。智能体不能创建、修改或删除规则。",
  "ProposalNotPending": "此提案已不再等待决定。请重新打开它查看当前状态。",
  "ApproverIsAgent": "智能体不能对提案做出决定，必须由人员决定。"
 },
 "changeRules": {
  "actions": {
   "openOrganization": "打开组织",
   "copyId": "复制 ID"
  },
  "toasts": {
   "copied": "已复制变更规则 ID。"
  },
  "status": {
   "Active": "生效中",
   "Inactive": "已停用",
   "Expired": "已过期"
  },
  "limit": {
   "text": "{{class}}，{{name}}：{{range}}",
   "between": "{{min}} 到 {{max}}",
   "atMost": "最多 {{max}}",
   "atLeast": "至少 {{min}}",
   "any": "不限"
  },
  "limitNames": {
   "count": "每个提案的变更数",
   "minIntervalSeconds": "最短唤醒间隔（秒）",
   "maxIntervalSeconds": "最长唤醒间隔（秒）",
   "backoffFactor": "退避系数",
   "jitterPercent": "抖动（百分比）",
   "weight": "流量权重"
  },
  "errors": {
   "UnknownLimit": "此类别没有这个名称的限制。请从列表中选择一个。",
   "ClassNotInRule": "限制必须针对规则所列的类别。请添加该类别或修改限制。",
   "UnitNotFound": "该单元不在此组织的现行组织图中。",
   "Duplicate": "每个类别和每个限制只能出现一次。",
   "BoundRequired": "请为限制设置最小值、最大值或两者。",
   "MinimumAboveMaximum": "最小值大于最大值。",
   "NegativeBound": "限制值必须大于或等于零。",
   "ExpiryInPast": "请选择一个将来的过期时间，或留空让规则永不过期。",
   "OrganizationNotFound": "此租户中不存在该组织。",
   "OrganizationNotSettable": "规则始终属于其所在的组织。如需用于其他组织，请新建规则。",
   "TooMany": "一条规则最多包含 {{max}} 个限制。"
  },
  "form": {
   "errors": {
    "name": "请为规则输入 1 到 {{max}} 个字符的名称。",
    "description": "描述最多 {{max}} 个字符。",
    "organization": "请选择规则所属的组织。",
    "unit": "请选择此组织中的一个单元。",
    "classes": "请至少选择一个变更类别。"
   }
  }
 },
 "orgProposals": {
  "title": "提案",
  "note": "主管会对其负责的单元提出变更。如果变更规则涵盖了提案中的每项变更，提案会立即应用。其他提案会在这里等待人员处理。",
  "rulesLink": "变更规则",
  "views": {
   "label": "显示哪些提案",
   "all": "全部",
   "needsApproval": "需要批准",
   "needsApprovalCount": "需要批准（{{count}}）",
   "applied": "已应用"
  },
  "emptyTitle": "这里没有提案",
  "emptyBody": "当主管对其下级单元提出变更时，提案会显示在这里。",
  "columns": {
   "title": "提案",
   "unit": "单元",
   "agent": "主管",
   "decision": "决定",
   "updated": "最后更改"
  },
  "decision": {
   "rule": "按规则应用",
   "approved": "已批准",
   "needsApproval": "需要批准",
   "denied": "已拒绝",
   "lapsed": "已失效",
   "drafting": "起草中"
  },
  "byRules": "规则：{{names}}",
  "byPerson": "由 {{name}} 决定",
  "decide": "审阅并决定",
  "toasts": {
   "approved": "已批准 {{title}}，现已生效。",
   "denied": "已拒绝 {{title}}，已退回给主管。"
  },
  "review": {
   "open": "审阅",
   "title": "提案：{{title}}",
   "run": "提出该提案的运行",
   "approve": "批准",
   "deny": "拒绝",
   "appliedByRule": "由于变更规则涵盖了每项变更，提案已立即应用。规则：{{names}}。",
   "approvedBy": "由 {{name}} 批准。",
   "deniedBy": "由 {{name}} 拒绝。",
   "reasonGiven": "原因：{{reason}}",
   "revision": "已记录为组织的修订版 {{number}}。回滚该修订版即可撤销。",
   "appliedNoDiff": "此提案已应用，其变更已成为现行配置的一部分。比较它所记录的修订版即可查看这些变更。",
   "covered": "变更规则涵盖了下面的每项变更，因此此提案无需人员即可应用。",
   "notCovered": "下面至少有一项变更未被变更规则涵盖，因此需要由人员决定。",
   "refusals": "硬性限制拒绝了以下变更，任何规则或批准都无法解除：",
   "noChanges": "此提案不包含任何变更。",
   "columns": {
    "item": "变更",
    "change": "类型",
    "rule": "涵盖规则"
   },
   "coveredBy": "规则 {{name}}",
   "reason": "原因",
   "reasonPlaceholder": "可选。主管会看到。"
  }
 },
 "views": {
  "organizationDetail": {
   "tabs": {
    "proposals": "提案（{{count}}）"
   },
   "appliedProposal": "已应用的提案"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "managementAccess": "管理权限"
   },
   "hints": {
    "managementAccess": "大多数智能体选择“无”即可。“工作室草稿”允许运行为启动它的人员起草工作室变更。“主管管理其子树”允许负责某个组织单元的智能体对其下级单元提出变更。"
   }
  },
  "changeRules": {
   "title": "变更规则",
   "subtitle": "主管可以在其子树中直接进行、无需等待人员的例行变更。规则未涵盖的变更仍需批准。",
   "add": "添加规则",
   "create": "添加变更规则",
   "edit": "编辑变更规则",
   "view": "变更规则",
   "deleteTitle": "删除变更规则",
   "emptyTitle": "暂无变更规则",
   "emptyBody": "添加规则，让主管无需等待批准即可应用唤醒调整等例行变更。",
   "noLimits": "无限制",
   "noExpiry": "永不",
   "chooseOrganization": "选择组织",
   "chooseUnit": "选择单元",
   "addLimit": "添加限制",
   "filters": {
    "activeOnly": "状态",
    "inForce": "仅显示生效中"
   },
   "columns": {
    "name": "名称",
    "status": "状态",
    "organization": "组织",
    "unit": "涵盖范围",
    "classes": "类别",
    "limits": "限制",
    "expiresUtc": "过期时间",
    "createdByName": "创建者",
    "description": "描述",
    "createdUtc": "创建时间",
    "id": "ID"
   },
   "fields": {
    "organizationId": "组织",
    "unitId": "单元（含其下级单元）",
    "name": "名称",
    "description": "描述",
    "classes": "变更类别",
    "limits": "限制",
    "limitClass": "类别",
    "limitName": "限制",
    "minimum": "最小值",
    "maximum": "最大值",
    "active": "生效",
    "expiresUtc": "过期时间"
   },
   "hints": {
    "organizationId": "必填。规则始终属于其所在的组织。",
    "unitId": "必填。规则涵盖对此单元及其所有下级单元的变更。",
    "name": "1 到 {{max}} 个字符。",
    "description": "可选，最多 {{max}} 个字符。",
    "classes": "必填。只有当提案中的每项变更都属于某条规则允许的类别时，提案才会按规则应用。",
    "limits": "可选，最多 {{max}} 个。“每个提案的变更数”限制一个提案中某类变更的数量；其他限制约束新值的范围。",
    "expiresUtc": "可选。规则在此时间后不再适用。"
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
})(zhHans, {
 "nav": {
  "items": {
   "evaluations": {
    "label": "评估集",
    "tip": "在智能体上线前为其评分的、带版本的用例集"
   },
   "evalRuns": {
    "label": "评估运行",
    "tip": "针对部署或智能体修订运行评估集的记录"
   },
   "shadowTrials": {
    "label": "影子试验",
    "tip": "候选部署重放真实输入，但不执行任何操作"
   },
   "canaryReleases": {
    "label": "金丝雀发布",
    "tip": "候选部署分步承接越来越多的流量"
   }
  }
 },
 "enums": {
  "resourceType": {
   "EvalSet": "评估集",
   "EvalRun": "评估运行",
   "ShadowTrial": "影子试验",
   "CanaryRelease": "金丝雀发布"
  },
  "notificationEvent": {
   "CanaryRolledBack": "金丝雀已回滚"
  },
  "runKind": {
   "Eval": "评估用例",
   "Shadow": "影子副本"
  },
  "evalSetState": {
   "Draft": "草稿",
   "Approved": "已批准"
  },
  "evalSetOrigin": {
   "Human": "由人编写",
   "Evaluator": "由智能体编写",
   "Playground": "来自试验场"
  },
  "evalScorer": {
   "ExactMatch": "完全匹配",
   "Contains": "包含",
   "JsonSchemaValid": "符合 JSON Schema",
   "Judge": "评判智能体"
  },
  "evalRunStatus": {
   "Pending": "待处理",
   "Running": "运行中",
   "Completed": "已完成",
   "Failed": "失败",
   "Cancelled": "已取消"
  },
  "evalRunTarget": {
   "AgentRevision": "智能体修订",
   "Deployment": "部署"
  },
  "evalRunInputMode": {
   "Cases": "评估集的用例",
   "RecentInputs": "最近的输入"
  },
  "shadowTrialStatus": {
   "Running": "运行中",
   "Completed": "已完成",
   "Stopped": "已停止",
   "Failed": "失败"
  },
  "canaryStatus": {
   "Running": "运行中",
   "Promoted": "已晋升",
   "RolledBack": "已回滚",
   "Aborted": "已中止"
  }
 },
 "errorCodes": {
  "EvalSetExists": "已存在同名的评估集。请打开并编辑它，以生成下一个版本。",
  "AlreadyApproved": "此版本已获批准。",
  "EvalSetEmpty": "此评估集还没有用例。请先添加一个用例。",
  "EvalSetImmutable": "此版本已获批准，将保持原样。请编辑它以生成下一个版本，或改为删除草稿版本。",
  "ApprovalIsPeopleOnly": "只有人可以批准评估集。智能体不能批准为自己评分的评估集。",
  "EvalRunFinished": "此评估运行已经结束。",
  "ShadowTrialAlreadyRunning": "此候选已在另一个试验中为该部署做影子运行。",
  "ShadowTrialNotRunning": "此影子试验已不在运行。",
  "CanaryAlreadyRunning": "其中一个部署已在一个运行中的金丝雀发布里。",
  "CanaryNotRunning": "此金丝雀发布已不在运行。",
  "EvalGateFailed": "晋升需要此修订针对该环境已批准的评估集有一次通过的评估运行，目前还没有。",
  "PeopleOnly": "只有人和 API 访问密钥可以执行此操作，运行令牌不行。"
 },
 "evals": {
  "versionShort": "v{{version}}",
  "setVersion": "{{name}} v{{version}}",
  "percent": "{{value}}%",
  "progress": "{{total}} 个用例中已完成 {{completed}} 个，通过 {{passed}} 个",
  "noJudge": "无评判",
  "noSet": "无",
  "untilStopped": "直到停止",
  "verdict": {
   "passed": "通过",
   "failed": "低于阈值",
   "none": "无结论"
  },
  "outcome": {
   "passed": "通过",
   "failed": "未通过",
   "errored": "出错"
  },
  "target": {
   "deployment": "部署 {{name}}",
   "revision": "智能体 {{agent}}，修订 {{revision}}"
  },
  "actions": {
   "runSet": "运行评估集",
   "openSet": "打开评估集",
   "cancelRun": "取消运行",
   "stopTrial": "停止试验",
   "abortCanary": "中止发布",
   "copyId": "复制 ID"
  },
  "toasts": {
   "copied": "已复制 ID。",
   "approved": "已批准 {{name}} v{{version}}。现在它可以作为晋升的关卡。",
   "caseSaved": "已保存用例。",
   "caseSavedNextVersion": "已将用例保存到新的草稿版本 {{version}}。",
   "caseSavedTo": "已将用例保存到 {{name}}。",
   "caseRemoved": "已移除用例。",
   "caseRemovedNextVersion": "已从新的草稿版本 {{version}} 中移除用例。",
   "setSavedNextVersion": "已保存为新的草稿版本 {{version}}。",
   "runStarted": "已开始 {{name}} 的评估运行。",
   "runCancelled": "已取消评估运行。",
   "trialStopped": "已停止影子试验。",
   "canaryAborted": "已中止金丝雀发布，权重已恢复为初始值。"
  },
  "reason": {
   "label": "原因",
   "placeholder": "可选。会随记录一起保存，并写入审计日志。"
  },
  "form": {
   "errors": {
    "name": "请为评估集输入 1 到 {{max}} 个字符的名称。",
    "description": "描述最多 {{max}} 个字符。",
    "judgeAgent": "评判智能体名称最多 {{max}} 个字符。",
    "tags": "每个标记最多 {{max}} 个字符。"
   }
  },
  "set": {
   "nextVersion": "此版本已获批准，因此保存会生成草稿版本 {{version}}。此版本保持原样。"
  },
  "case": {
   "addTitle": "向 {{name}} 添加用例",
   "editTitle": "编辑用例 {{number}}",
   "save": "保存用例",
   "nextVersion": "此版本已获批准，因此更改会进入新的草稿版本 {{version}}。此版本保持原样。",
   "fromRun": "从运行 {{id}} 保存。",
   "fields": {
    "name": "名称",
    "inputText": "输入",
    "expectedText": "预期输出",
    "hidden": "对被评分的智能体隐藏",
    "checks": "检查"
   },
   "placeholders": {
    "name": "可选，例如：超出限额的退款",
    "inputText": "智能体收到的消息",
    "expectedText": "好的回答应该说什么"
   },
   "hints": {
    "name": "可选，最多 {{max}} 个字符。",
    "inputText": "必填。用例会把它作为输入发送给智能体。",
    "expectedText": "可选。完全匹配和包含检查在没有自己的文本时与它比较；评判智能体把它当作参考答案。",
    "hidden": "智能体自己的运行只能看到隐藏用例的分数，看不到其输入和预期输出，因此无法学到答案。"
   },
   "checks": {
    "scorer": "评分器",
    "weight": "权重",
    "add": "添加检查",
    "remove": "移除检查 {{number}}",
    "none": "没有检查。该用例按与预期输出的完全匹配评分；没有预期输出时由评判智能体评分。"
   },
   "scorerHints": {
    "ExactMatch": "忽略首尾空白后，输出与文本相同即通过。",
    "Contains": "输出包含该文本即通过。",
    "JsonSchemaValid": "输出是符合该架构的 JSON 即通过。",
    "Judge": "评估集的评判智能体根据评分标准和预期输出为输出评分。"
   },
   "argumentLabels": {
    "ExactMatch": "精确文本",
    "Contains": "要查找的文本",
    "JsonSchemaValid": "JSON Schema",
    "Judge": "评分标准"
   },
   "argumentPlaceholders": {
    "ExactMatch": "留空则使用预期输出",
    "Contains": "留空则使用预期输出",
    "JsonSchemaValid": "{\"type\": \"object\", \"required\": [\"answer\"]}",
    "Judge": "可选。好的回答必须做到什么"
   },
   "errors": {
    "input": "用例需要输入文本。",
    "name": "名称最多 {{max}} 个字符。",
    "weight": "权重为 0 到 {{max}}。",
    "schema": "请在此处填写一个 JSON Schema 对象。",
    "argument": "请填写文本，或填写用例的预期输出。"
   }
  },
  "run": {
   "title": "运行评估集",
   "titleFor": "运行 {{name}} v{{version}}",
   "intro": "每个用例都作为单独的评估运行执行。针对智能体修订的运行使用临时部署，不影响线上流量。",
   "start": "开始运行",
   "starting": "正在开始...",
   "setOption": "{{name}} v{{version}}",
   "chooseDeployment": "选择部署",
   "chooseAgent": "选择智能体",
   "fields": {
    "setId": "评估集",
    "targetType": "评估对象",
    "deploymentId": "部署",
    "agentId": "智能体",
    "agentRevisionId": "修订",
    "inputMode": "输入",
    "recentInputCount": "要重放的最近输入数",
    "thresholdPercent": "通过阈值（百分比）",
    "budgetUsd": "预算（USD）"
   },
   "hints": {
    "setId": "列出每个评估集的最新版本。",
    "targetType": "当前运行中的部署，或智能体修订，例如工作室试验场运行的草稿。",
    "agentId": "必填。不指定修订时，运行智能体的草稿修订，或其最新发布的修订。",
    "agentRevisionId": "可选。智能体修订 ID；留空则运行草稿修订。",
    "inputMode": "评估集的用例，或部署最近成功的输入，由评判智能体评分。",
    "recentInputCount": "1 到 {{max}}。",
    "thresholdPercent": "可选，0 到 100。加权分数达到该值时运行通过。",
    "budgetUsd": "可选。当用例和评判运行花费达到此金额时，跳过剩余用例，运行判为失败。"
   },
   "errors": {
    "set": "请选择要运行的评估集。",
    "deployment": "请选择要评估的部署。",
    "agent": "请选择要评估的智能体。",
    "threshold": "阈值为 0 到 100 百分比。",
    "budget": "预算为 0 到 {{max}} USD。",
    "recentInputs": "请重放 1 到 {{max}} 个最近的输入。"
   }
  },
  "save": {
   "open": "保存为评估用例",
   "title": "保存为评估用例",
   "intro": "这一轮的输入和智能体的回答会成为一个用例。请编辑预期输出，写明好的回答是什么，而不只是这次的回答内容。",
   "set": "评估集",
   "newSet": "新建评估集...",
   "newSetName": "新评估集名称",
   "newSetHint": "新评估集以草稿开始，来源为“来自试验场”。",
   "submit": "保存用例",
   "done": "完成",
   "openSet": "打开评估集",
   "runSet": "运行评估集",
   "entryAgent": "入口智能体",
   "saved": "已将用例保存到 {{name}} v{{version}}。",
   "runHint": "“运行评估集”会评估 {{agent}} 的草稿修订，也就是此试验场运行的修订。",
   "errors": {
    "set": "请选择一个评估集，或新建一个。"
   }
  },
  "setDetail": {
   "title": "评估集",
   "back": "所有评估集",
   "notFoundTitle": "未找到评估集",
   "notFoundBody": "它可能是被他人删除的草稿。已批准的版本始终保留。",
   "approve": "批准",
   "approveTitle": "批准 {{name}} v{{version}}",
   "approveMessage": "已批准的版本会完全保持原样，可作为晋升和金丝雀发布的关卡。之后的编辑会生成下一个草稿版本。",
   "approvedNote": "此版本已获批准并保持原样。编辑评估集或用例会生成草稿版本 {{version}}。",
   "approvedByAt": "{{name}}, {{when}}",
   "needsJudge": "部分用例由评判智能体评分，但此评估集没有设置评判智能体。运行前请编辑评估集并选择一个评判智能体。",
   "editTitle": "编辑 {{name}}",
   "deleteTitle": "删除草稿版本",
   "deleteMessage": "要删除 {{name}} v{{version}} 吗？已批准的版本不受影响。",
   "cases": "用例（{{count}}）",
   "addCase": "添加用例",
   "noCases": "还没有用例。可在此添加，或从工作室试验场保存一轮对话。",
   "noExpected": "无",
   "hidden": "隐藏",
   "removeCaseTitle": "移除用例 {{number}}",
   "removeCaseMessage": "要从草稿中移除此用例吗？",
   "removeCaseApproved": "此版本已获批准，因此用例会从新的草稿版本 {{version}} 中移除。此版本仍保留该用例。",
   "versions": "版本",
   "thisVersion": "v{{version}}（当前版本）",
   "runs": "最近的评估运行",
   "allRuns": "此版本的所有运行",
   "noRuns": "此版本尚未运行。",
   "fields": {
    "state": "状态",
    "origin": "来源",
    "judgeAgent": "评判智能体",
    "tags": "标记",
    "authoredBy": "编写者",
    "approvedBy": "批准者",
    "previousVersion": "上一版本",
    "lastUpdateUtc": "最后更改",
    "description": "描述"
   },
   "columns": {
    "order": "#",
    "name": "名称",
    "input": "输入",
    "expected": "预期输出",
    "scorers": "评分方式",
    "hidden": "隐藏",
    "source": "来源运行"
   },
   "versionColumns": {
    "version": "版本",
    "state": "状态",
    "caseCount": "用例",
    "approvedBy": "批准者",
    "lastUpdateUtc": "最后更改"
   },
   "runColumns": {
    "run": "评估运行",
    "status": "状态",
    "verdict": "结论",
    "score": "分数",
    "target": "评估对象",
    "createdUtc": "开始时间"
   }
  },
  "runDetail": {
   "title": "评估运行",
   "back": "所有评估运行",
   "notFoundTitle": "未找到评估运行",
   "notFoundBody": "请检查 ID，或从评估集打开该运行。",
   "live": "实时",
   "polling": "轮询中",
   "failure": "运行失败：{{reason}}",
   "progressLabel": "已完成的用例",
   "kpi": {
    "score": "分数",
    "threshold": "阈值 {{threshold}}",
    "noThreshold": "无阈值",
    "passed": "通过的用例",
    "errored": "出错的用例",
    "cost": "费用",
    "budget": "预算 {{budget}}",
    "noBudget": "无预算"
   },
   "fields": {
    "target": "评估对象",
    "targetType": "对象类型",
    "inputMode": "输入",
    "startedBy": "发起者",
    "createdUtc": "开始时间",
    "completedUtc": "结束时间",
    "studioDraftId": "工作室草稿"
   },
   "recentInputs": "{{count}} 个最近的输入",
   "results": "用例结果（{{count}}）",
   "failingOnly": "仅未通过（{{count}}）",
   "noFailing": "所有用例均已通过。",
   "noResults": "此运行没有记录用例结果。",
   "waiting": "正在等待第一个用例完成。",
   "caseNumber": "用例 {{number}}",
   "recentInput": "最近的输入 {{number}}",
   "checksPassed": "{{total}} 个中通过 {{passed}} 个",
   "open": "打开",
   "columns": {
    "order": "#",
    "case": "用例",
    "outcome": "结果",
    "score": "分数",
    "checks": "检查",
    "output": "输出"
   },
   "resultTitle": "用例 {{number}}",
   "resultTitleNamed": "用例 {{number}}：{{name}}",
   "scoreIs": "分数 {{score}}",
   "openCaseRun": "打开用例运行",
   "openSourceRun": "打开来源运行",
   "hiddenCase": "此用例对被评分的智能体隐藏。",
   "input": "输入",
   "diff": "预期输出与实际输出对比",
   "expected": "预期",
   "output": "输出",
   "noOutput": "没有输出。",
   "checks": "检查",
   "noChecks": "没有已评分的检查。",
   "checkColumns": {
    "scorer": "评分器",
    "weight": "权重",
    "score": "分数",
    "outcome": "结果",
    "note": "评分器说明",
    "judgeRun": "评判运行"
   },
   "cancelTitle": "取消评估运行",
   "cancelMessage": "要取消 {{name}} 的这次运行吗？尚未完成的用例会一并取消。"
  },
  "shadow": {
   "errors": {
    "name": "名称最多 {{max}} 个字符。",
    "source": "请选择要复制其运行的部署。",
    "candidate": "请选择候选部署。",
    "same": "候选部署必须与来源部署不同。",
    "sample": "请抽样 1 到 100 百分比的运行。",
    "ends": "请选择未来的结束时间，或留空以一直运行到停止。"
   }
  },
  "shadowDetail": {
   "title": "影子试验",
   "back": "所有影子试验",
   "notFoundTitle": "未找到影子试验",
   "notFoundBody": "请检查 ID，或从列表中打开该试验。",
   "note": "影子运行会在候选部署上重放来源的输入。它们不能使用有副作用的工具、发送消息、写入记忆或提交报告，来源的运行也不受影响。",
   "stopReason": "已停止：{{reason}}",
   "stopTitle": "停止影子试验",
   "stopMessage": "要停止 {{name}} 吗？之后不再复制运行，目前的计数会保留。",
   "kpi": {
    "compared": "已比较",
    "agreed": "一致",
    "diverged": "不一致",
    "failures": "候选失败",
    "agreement": "一致率"
   },
   "comparison": {
    "text": "规范化文本",
    "set": "使用评估集",
    "judge": "由评判智能体"
   },
   "fields": {
    "source": "来源",
    "candidate": "候选",
    "samplePercent": "抽样比例",
    "comparison": "比较方式",
    "endsUtc": "结束时间",
    "createdBy": "发起者",
    "createdUtc": "开始时间",
    "completedUtc": "完成时间"
   }
  },
  "canary": {
   "stepOf": "第 {{number}} 步，共 {{total}} 步，{{percent}}%",
   "gateText": "{{name}} 达到 {{score}} 或以上",
   "noGate": "无评估关卡",
   "errors": {
    "agent": "请选择要转移其流量的智能体。",
    "candidate": "请选择候选部署。",
    "baseline": "请选择基线部署。",
    "same": "候选部署和基线部署必须不同。",
    "steps": "请至少列出一个步骤。最后一步为 100 百分比。",
    "tooMany": "一次发布最多 {{max}} 个步骤。",
    "increasing": "每一步的百分比为 1 到 100，并且要高于前一步。",
    "lastStep": "最后一步必须为 100 百分比。",
    "errorRate": "错误率上限为 0 到 100 百分比。",
    "gate": "评估关卡需要同时设置评估集和最低分数，或者都不设置。",
    "score": "最低分数为 0 到 100 百分比。"
   }
  },
  "canaryDetail": {
   "title": "金丝雀发布",
   "heading": "{{agent}} 的金丝雀发布",
   "back": "所有金丝雀发布",
   "notFoundTitle": "未找到金丝雀发布",
   "notFoundBody": "请检查 ID，或从列表中打开该发布。",
   "rolledBack": "已回滚：{{reason}} 权重已恢复为初始值。",
   "aborted": "已中止：{{reason}} 权重已恢复为初始值。",
   "promoted": "已晋升。{{candidate}} 承接全部流量。",
   "noReason": "未提供原因。",
   "withWeight": "{{name}}（发布前权重 {{weight}}）",
   "gate": "最新评估分数达到 {{score}} 或以上",
   "steps": "步骤",
   "columns": {
    "step": "步骤",
    "weightPercent": "候选流量",
    "minimumRuns": "最少运行数",
    "minimumMinutes": "最少分钟数",
    "state": "状态"
   },
   "stepStates": {
    "done": "已完成",
    "current": "当前",
    "stopped": "在此停止",
    "pending": "等待中"
   },
   "abortTitle": "中止金丝雀发布",
   "abortMessage": "要中止此发布吗？两个部署都会恢复到发布开始前的权重。",
   "fields": {
    "agent": "智能体",
    "candidate": "候选",
    "baseline": "基线",
    "maxErrorRatePercent": "错误率上限",
    "gate": "评估关卡",
    "stepStartedUtc": "当前步骤开始时间",
    "createdBy": "发起者",
    "completedUtc": "完成时间"
   }
  },
  "fieldCodes": {
   "InputRequired": "用例需要输入文本。",
   "UnknownScorer": "请使用完全匹配、包含、符合 JSON Schema 或评判智能体。",
   "ArgumentRequired": "请填写文本，或填写用例的预期输出。",
   "InvalidJsonSchema": "这不是有效的 JSON Schema。",
   "TooManyCases": "该评估集的用例数已达上限。",
   "EvaluatorIsForAgents": "来源“由智能体编写”用于智能体创建的评估集。请选择“由人编写”或“来自试验场”。",
   "SetRequired": "请选择要运行的评估集。",
   "TargetRequired": "请选择要评估的对象。",
   "RecentInputsNeedDeployment": "最近的输入会重放部署的运行。请评估一个部署。",
   "NoRecentInputs": "该部署还没有可重放的成功运行。",
   "EvalSetEmpty": "此版本没有用例。",
   "JudgeAgentRequired": "部分用例需要评判智能体，但该评估集没有设置。请编辑评估集并选择一个。",
   "DeploymentNotFound": "该部署在此租户中不存在。",
   "SameDeployment": "请选择两个不同的部署。",
   "DifferentAgent": "两个部署必须属于同一个智能体。",
   "DeploymentInactive": "该部署未启用。请先启用它。",
   "AgentMismatch": "智能体必须是来源部署所属的智能体。",
   "EndsInPast": "请选择未来的结束时间，或留空。",
   "EvalSetNotFound": "该评估集在此租户中不存在。",
   "AgentNotFound": "该智能体在此租户中不存在。",
   "EvalGateIncomplete": "评估关卡需要同时设置评估集和最低分数，或者都不设置。",
   "NotIncreasing": "每一步的百分比必须高于前一步。",
   "LastStepNotFull": "最后一步必须为 100 百分比。"
  }
 },
 "resources": {
  "evalSets": {
   "title": "评估集",
   "subtitle": "为智能体评分的带版本用例。批准一个版本后，它即可作为晋升和金丝雀发布的关卡。",
   "add": "添加评估集",
   "create": "添加评估集",
   "edit": "编辑评估集",
   "view": "评估集",
   "deleteTitle": "删除草稿版本",
   "emptyTitle": "还没有评估集",
   "emptyBody": "可在此添加评估集及其用例，或把工作室试验场中的一轮对话保存为第一个用例。",
   "filters": {
    "latestOnly": "版本",
    "newestOnly": "仅最新版本",
    "allVersions": "所有版本"
   },
   "columns": {
    "name": "名称",
    "version": "版本",
    "state": "状态",
    "origin": "来源",
    "caseCount": "用例",
    "judgeAgent": "评判智能体",
    "tags": "标记",
    "authoredByName": "编写者",
    "approvedByName": "批准者",
    "description": "描述",
    "lastUpdateUtc": "最后更改",
    "id": "ID"
   },
   "fields": {
    "name": "名称",
    "description": "描述",
    "origin": "来源",
    "judgeAgent": "评判智能体",
    "tags": "标记"
   },
   "hints": {
    "name": "1 到 {{max}} 个字符。名称在各版本之间保持不变。",
    "description": "可选，最多 {{max}} 个字符。",
    "origin": "“来自试验场”表示由试验场对话轮次形成的评估集。",
    "judgeAgent": "为评判检查、没有预期输出的用例以及最近的输入评分的智能体。",
    "tags": "可选，每行一个，每个最多 {{max}} 个字符。"
   }
  },
  "evalRuns": {
   "title": "评估运行",
   "subtitle": "评估集版本针对部署或智能体修订的每次运行，以及其分数与阈值的对比。",
   "add": "运行评估集",
   "create": "运行评估集",
   "edit": "评估运行",
   "view": "评估运行",
   "deleteTitle": "删除评估运行",
   "emptyTitle": "还没有评估运行",
   "emptyBody": "运行一个评估集，在部署或草稿修订上线前为其评分。",
   "columns": {
    "setName": "评估集",
    "status": "状态",
    "verdict": "结论",
    "score": "分数",
    "threshold": "阈值",
    "progress": "进度",
    "target": "评估对象",
    "inputMode": "输入",
    "costUsd": "费用",
    "startedByName": "发起者",
    "createdUtc": "开始时间",
    "id": "ID"
   }
  },
  "shadowTrials": {
   "title": "影子试验",
   "subtitle": "候选部署在不执行任何操作的情况下重放线上部署的一部分输入，并比较输出。",
   "add": "开始影子试验",
   "create": "开始影子试验",
   "edit": "影子试验",
   "view": "影子试验",
   "deleteTitle": "删除影子试验",
   "emptyTitle": "还没有影子试验",
   "emptyBody": "开始一个试验，在候选部署承接任何流量之前，看看它如何回答真实输入。",
   "columns": {
    "name": "名称",
    "status": "状态",
    "source": "来源",
    "candidate": "候选",
    "samplePercent": "抽样比例",
    "comparedCount": "已比较",
    "agreedCount": "一致",
    "divergedCount": "不一致",
    "candidateFailureCount": "失败",
    "agreement": "一致率",
    "endsUtc": "结束时间",
    "createdUtc": "开始时间",
    "id": "ID"
   },
   "fields": {
    "name": "名称",
    "sourceDeploymentId": "来源部署",
    "candidateDeploymentId": "候选部署",
    "samplePercent": "抽样（百分比）",
    "endsUtc": "结束时间",
    "comparisonEvalSetId": "使用评估集比较",
    "useJudge": "使用评判智能体比较"
   },
   "hints": {
    "name": "可选，最多 {{max}} 个字符。",
    "sourceDeploymentId": "必填。复制其成功的运行；它本身不受影响。",
    "candidateDeploymentId": "必填。同一智能体的另一个部署。",
    "samplePercent": "1 到 100，默认 10。来源运行中被复制的比例。",
    "endsUtc": "可选。留空则一直运行，直到有人停止。",
    "comparisonEvalSetId": "可选。不设置时，输出按规范化文本比较。",
    "useJudge": "让评判智能体判断两个输出是否一致。"
   }
  },
  "canaryReleases": {
   "title": "金丝雀发布",
   "subtitle": "候选部署分步承接越来越多的智能体流量，表现异常时会自动回滚。",
   "add": "开始金丝雀发布",
   "create": "开始金丝雀发布",
   "edit": "金丝雀发布",
   "view": "金丝雀发布",
   "deleteTitle": "删除金丝雀发布",
   "emptyTitle": "还没有金丝雀发布",
   "emptyBody": "开始一次发布，将流量一步一步地转移到新部署。",
   "addStep": "添加步骤",
   "columns": {
    "agent": "智能体",
    "status": "状态",
    "candidate": "候选",
    "baseline": "基线",
    "step": "步骤",
    "maxErrorRatePercent": "错误上限",
    "gate": "评估关卡",
    "rollbackReason": "回滚原因",
    "createdUtc": "开始时间",
    "id": "ID"
   },
   "fields": {
    "agentId": "智能体",
    "baselineDeploymentId": "基线部署",
    "candidateDeploymentId": "候选部署",
    "steps": "步骤",
    "weightPercent": "候选流量（百分比）",
    "minimumRuns": "最少运行数",
    "minimumMinutes": "最少分钟数",
    "maxErrorRatePercent": "错误率上限（百分比）",
    "evalSetId": "评估关卡评估集",
    "minEvalScorePercent": "最低评估分数（百分比）"
   },
   "hints": {
    "agentId": "必填。两个部署都属于它。",
    "baselineDeploymentId": "必填。承接其余流量。",
    "candidateDeploymentId": "必填。要发布的部署。",
    "steps": "1 到 {{max}} 个步骤。每个百分比都高于前一个，最后一个为 100。",
    "maxErrorRatePercent": "0 到 100，默认 5。某一步中候选运行的失败比例超过此值时，发布会回滚。",
    "evalSetId": "可选。仅当此评估集的最新评估运行达到最低分数时，步骤才会推进。",
    "minEvalScorePercent": "设置评估关卡评估集时必填，0 到 100。"
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
})(zhHans, {
 "nav": {
  "items": {
   "board": {
    "label": "委员会",
    "tip": "一览单个组织：健康状况、待处理事项、提案、支出、制动措施和 CEO"
   }
  }
 },
 "enums": {
  "notificationEvent": {
   "BoardBrief": "已提交委员会简报"
  }
 },
 "errorCodes": {
  "BoardCeoMissing": "此组织没有 CEO：根单元需要一名在已上线修订版中拥有守护者的负责人。",
  "BoardCeoUnavailable": "CEO 的守护者没有部署，因此无法对话。请先为该守护者设置部署。"
 },
 "views": {
  "organizationDetail": {
   "openBoard": "委员会"
  }
 },
 "board": {
  "title": "委员会",
  "subtitle": "监督由守护者组成的组织：需要决定的事项、它们的成本，以及制动措施。",
  "heading": "{{name}} 的委员会",
  "generated": "更新时间",
  "refresh": "刷新",
  "openOrganization": "打开组织",
  "killSwitchOn": "紧急停止开关已打开：在关闭之前，此租户中的守护者都不会唤醒。",
  "notFoundTitle": "委员会不可用",
  "notFoundBody": "该组织不存在，或者您无权读取它。",
  "picker": {
   "title": "选择组织",
   "select": "组织",
   "choose": "请选择一个组织",
   "open": "打开委员会",
   "emptyTitle": "还没有组织",
   "emptyBody": "请先创建一个由守护者组成的组织，它的委员会会显示在这里。",
   "organizations": "前往组织"
  },
  "chart": {
   "title": "架构图与健康状况",
   "empty": "该组织还没有单元。请在组织页面添加单元并发布修订版。",
   "health": "单元健康状况",
   "frozen": "已冻结",
   "overBudget": "超出预算",
   "columns": {
    "unit": "单元",
    "health": "健康状况",
    "escalations": "未处理的上报",
    "brakes": "制动",
    "lastReport": "最近报告"
   }
  },
  "attention": {
   "title": "待处理",
   "empty": "目前没有需要委员会处理的事项。",
   "none": "无。",
   "escalations_one": "{{count}} 个未处理的上报",
   "escalations_other": "{{count}} 个未处理的上报",
   "reports_one": "{{count}} 份异常报告",
   "reports_other": "{{count}} 份异常报告",
   "caps_one": "{{count}} 个单元已达预算上限",
   "caps_other": "{{count}} 个单元已达预算上限",
   "raisedBy": "提出者：{{name}}",
   "filedBy": "提交者：{{name}}"
  },
  "proposals": {
   "title": "提案",
   "empty": "没有等待决定的提案。",
   "by": "{{unit}} 中的 {{agent}}",
   "showChanges": "显示变更",
   "hideChanges": "隐藏变更"
  },
  "evidence": {
   "title": "依据",
   "empty": "目前还没有评估运行、影子试验或金丝雀发布支持此提案。",
   "since": "自提案于 {{when}} 最后一次变更以来。",
   "evalRuns": "评估运行",
   "shadowTrials": "影子试验",
   "canaryReleases": "金丝雀发布",
   "evalSet": "{{name}} v{{version}}",
   "evalScore": "得分 {{score}}，阈值 {{threshold}}，已完成 {{done}}/{{total}} 个用例",
   "stale": "早于最后一次变更",
   "shadow": "影子试验 {{name}}",
   "shadowCounts": "{{compared}} 次比较中 {{agreed}} 次一致，{{diverged}} 次不一致，候选失败 {{failures}} 次",
   "canary": "{{name}} 的金丝雀发布",
   "canaryStep": "第 {{step}} 步，共 {{total}} 步",
   "rollback": "已回滚：{{reason}}"
  },
  "spend": {
   "title": "支出与预算",
   "empty": "当前时间窗口内没有单元设有预算或产生支出。"
  },
  "brief": {
   "title": "最新简报",
   "ceo": "CEO：{{name}}，{{unit}} 的负责人。",
   "cadence_one": "每小时提交一次简报。",
   "cadence_other": "每 {{count}} 小时提交一次简报。",
   "noCadence": "CEO 的守护者没有设置简报频率。",
   "empty": "CEO 还没有提交简报。"
  },
  "ceo": {
   "missing": "根单元没有负责人，因此该组织没有 CEO。",
   "noMandate": "CEO 在已上线修订版中没有守护者。",
   "noDeployment": "CEO 的守护者没有可对话的部署。"
  },
  "brakes": {
   "title": "制动",
   "active_one": "{{count}} 个生效的冻结",
   "active_other": "{{count}} 个生效的冻结",
   "none": "没有任何冻结。",
   "frozenBy": "冻结者：{{name}}",
   "lift": "解除",
   "freezeOrg": "冻结组织",
   "unit": "单元",
   "pickUnit": "请选择一个单元",
   "freezeUnit": "冻结单元",
   "rollback": "回滚架构图",
   "rollbackTitle": "回滚架构图",
   "rollbackMessage": "将组织恢复到修订版 {{number}} 之前已上线的修订版？指挥链、预算和消息线路会立即随之变更。",
   "rollbackNote": "从委员会回滚",
   "rolledBack": "已回滚。修订版 {{number}} 已上线。"
  },
  "direction": {
   "title": "给 CEO 的指示",
   "note": "这段文本会成为 CEO 守护者的一个新发布修订版，其下一次巡检会把它当作委员会的指示读取。",
   "text": "指示",
   "placeholder": "例如：在审计结束前，超过 500 美元的退款交由人员处理。",
   "count": "{{count}}/{{max}} 个字符",
   "changeNote": "变更说明",
   "changeNotePlaceholder": "委员会给出此指示的原因（可选）",
   "submit": "发送指示",
   "given": "指示已作为 {{name}} 的修订版 {{number}} 发布。",
   "errors": {
    "required": "请填写给 CEO 的指示。",
    "tooLong": "最多 {{max}} 个字符。"
   }
  },
  "ceoChat": {
   "title": "与 CEO 对话",
   "note": "消息会以委员会的名义开启与 CEO 部署的对话。",
   "talkingTo": "您正以委员会身份与 {{name}} 对话。",
   "conversation": "对话",
   "newConversation": "新对话",
   "new": "新建",
   "transcript": "与 CEO 的对话",
   "empty": "还没有消息。问问 CEO 组织运行得怎么样。",
   "message": "消息",
   "tooLong": "最多 {{max}} 个字符。"
  }
 },
 "wizard": {
  "steps": {
   "keeper": "第一个守护者"
  },
  "welcomeItemKeeper": "创建您的第一个守护者：一个按计划唤醒并朝目标工作的智能体。",
  "keeper": {
   "body": "守护者为示例智能体设定目标，并按计划唤醒它；在没有变化时会逐渐拉长间隔。它使用模拟 Harness，因此不产生费用。您可以在守护者页面暂停或删除它。",
   "objectiveDefault": "时不时检查一下，并报告一切平静。",
   "description": "由设置向导创建。",
   "create": "创建守护者",
   "created": "已创建守护者 {{name}}，它会按计划唤醒。",
   "ready": "守护者 {{name}} 已就绪。请继续进行测试运行。"
  }
 },
 "tour": {
  "steps": {
   "autonomy": {
    "title": "自主运行",
    "body": "守护者是按计划唤醒并朝目标工作的智能体。上报、冻结、紧急停止开关、记忆、报告和消息让它们处于掌控之中。"
   },
   "board": {
    "title": "委员会",
    "body": "组织将守护者归于一名 CEO 之下。委员会标签页显示单个组织的健康状况、需要决定的事项、支出和制动措施，并让您向 CEO 下达指示或与其对话。"
   }
  }
 },
 "explainers": {
  "board": {
   "title": "委员会",
   "p1": "委员会是位于组织根单元之上的个人或团体。此页面把他们需要的信息集中在一处：根据最新报告得出的各单元健康状况、未处理的上报、异常报告、已达预算上限的单元，以及附带评估、影子和金丝雀依据、等待决定的提案。",
   "p2": "制动措施可以冻结某个单元或整个组织、回滚架构图，或用紧急停止开关停止所有守护者。指示会成为 CEO 守护者的新修订版，而“与 CEO 对话”会与 CEO 的部署开启一次普通对话。"
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "board": "委员会：在一个页面中查看单个组织的健康状况、待处理事项、提案、支出、简报和制动措施。"
   }
  },
  "enums": {
   "notificationEvent": {
    "BoardBrief": "某个组织的 CEO 为委员会提交了一份简报。"
   }
  },
  "views": {
   "organizationDetail": {
    "openBoard": "打开此组织的委员会：健康状况、待处理事项、提案、支出、制动措施和 CEO。"
   }
  },
  "wizard": {
   "keeper": {
    "name": "守护者名称：可使用字母、数字、点、短横线和下划线。",
    "objective": "守护者要达成的目标，每次巡检都会读取。",
    "create": "在示例智能体的模拟 Harness 部署上创建守护者，然后进入测试运行。",
    "skip": "不创建守护者，直接继续。您可以稍后在守护者页面添加。"
   }
  },
  "board": {
   "refresh": "重新读取委员会。组织发生变化时也会刷新。",
   "openOrganization": "打开组织页面，编辑单元、预算和修订版。",
   "openEscalation": "打开上报以作出答复。",
   "openReport": "打开报告，查看其指标、问题和决定。",
   "openKeeper": "打开 CEO 的守护者，查看其巡检和修订版。",
   "picker": {
    "select": "要打开其委员会的组织。",
    "open": "打开此组织的委员会。",
    "organizations": "打开组织页面以创建组织。"
   },
   "chart": {
    "title": "已上线的架构图：每个单元及其负责人、成员、根据最新报告得出的健康状况和支出。",
    "frozen": "有生效的冻结覆盖此单元或整个组织。",
    "overBudget": "此单元的子树在当前时间窗口内已用完一整份预算。",
    "columns": {
     "unit": "已上线修订版中的单元。",
     "health": "根据单元中最新提交的报告得出的健康状况。没有报告时为未知。",
     "escalations": "该单元的智能体提出的未处理上报。",
     "brakes": "是否有冻结覆盖该单元，以及它是否超出预算。",
     "lastReport": "最新报告的提交时间。点击打开该报告。"
    }
   },
   "attention": {
    "title": "等待委员会处理的事项：未处理的上报、最近 7 天内降级或异常的报告，以及已达预算上限的单元。"
   },
   "proposals": {
    "title": "组织主管提出、没有任何变更规则覆盖、正在等待人员决定的变更。",
    "toggle": "显示或隐藏提案的变更以及覆盖每项变更的规则，内容从服务器读取。"
   },
   "evidence": {
    "title": "自提案最后一次变更以来，所提议智能体的评估运行、影子试验和金丝雀发布。",
    "openEvalRun": "打开评估运行，查看其用例结果。",
    "openShadowTrial": "打开影子试验，查看其比较结果。",
    "openCanary": "打开金丝雀发布，查看其步骤。",
    "stale": "此评估运行在提案最后一次变更之前就已开始，因此可能没有测试当前的变更。"
   },
   "spend": {
    "title": "每个单元在当日和当月时间窗口内的支出与其预算的对比。"
   },
   "brief": {
    "title": "CEO 为委员会提交的最新简报，以及 CEO 的守护者要求提交简报的频率。"
   },
   "brakes": {
    "title": "快速停止工作：冻结某个单元或整个组织、回滚架构图，或打开紧急停止开关。",
    "lift": "解除此冻结。其范围内的工作可能会重新开始。",
    "freezeOrg": "冻结此组织的所有智能体和守护者，直到解除冻结。会要求确认。",
    "orgFrozen": "该组织已被冻结。请先解除那个冻结。",
    "unit": "要冻结的单元，包括其下的所有内容。",
    "freezeUnit": "冻结所选单元及其子树。会要求确认。",
    "rollback": "恢复到当前修订版之前已上线的修订版。会要求确认。",
    "rollbackNone": "没有更早的已上线修订版可以恢复。"
   },
   "direction": {
    "title": "向 CEO 下达指示。文本会作为 CEO 守护者的新修订版发布，来源为委员会。",
    "text": "1 到 4000 个字符。CEO 的下一次巡检会把它当作委员会的指示读取。",
    "changeNote": "可选，最多 2000 个字符，与修订版一起保存。",
    "submit": "将指示作为 CEO 守护者的新修订版发布。"
   },
   "ceoChat": {
    "title": "与 CEO 部署的对话。每条消息都是一次运行，可以像其他运行一样打开。",
    "conversation": "继续过去的委员会对话，或开始新的对话。",
    "new": "与 CEO 开始新的对话。",
    "message": "要对 CEO 说的话。按 Enter 发送，按 Shift+Enter 换行。",
    "send": "发送消息。回复会在下方以流式方式显示。"
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
})(zhHans, {
 "nav": {
  "items": {
   "performance": {
    "label": "绩效",
    "tip": "组织各单元和智能体的表现，以及智能体无法自评的检查"
   }
  }
 },
 "enums": {
  "triggerTargetType": {
   "EvalSet": "定期检查"
  },
  "notificationEvent": {
   "OrgBudgetFrozen": "单元因超预算被冻结"
  },
  "auditEventType": {
   "OrgBudgetFrozen": "单元因超预算被冻结",
   "UnitCascadeCancelled": "已取消单元内的全部工作"
  },
  "rollbackActiveTicks": {
   "Finish": "让其完成",
   "Cancel": "取消它们"
  }
 },
 "errorCodes": {
  "OrganizationNotLive": "该组织还没有已上线的修订版。请先发布一个修订版。"
 },
 "resources": {
  "organizations": {
   "fields": {
    "budgetFreezeMarginPercent": "预算冻结余量 (%)"
   },
   "hints": {
    "budgetFreezeMarginPercent": "{{min}} 到 {{max}}，默认 {{default}}。支出超出预算达到此比例的单元会被冻结，直到有人解除冻结。0 表示达到预算即冻结。"
   }
  },
  "triggers": {
   "fields": {
    "evalSetId": "评估集",
    "evalJudgeAgentId": "评分智能体",
    "evalRecentInputCount": "最近输入数"
   },
   "hints": {
    "evalSetId": "检查要运行的评估集。管理者可在绩效页面查看结果。",
    "checkDeployment": "必填。检查会用该部署的最近输入对评估集重新运行。",
    "evalRecentInputCount": "{{min}} 到 {{max}}，默认 {{default}}。每次检查重放该部署最新输入的数量。"
   },
   "errors": {
    "evalSetRequired": "请选择此检查要运行的评估集。",
    "deploymentRequired": "请选择此检查要评分的部署。",
    "evalRecentInputCount": "请输入 {{min}} 到 {{max}} 之间的整数。"
   },
   "setJudge": "评估集自带的评分智能体",
   "checkNotice": "定期检查以保存它的人的身份运行。智能体无法创建、修改或评分检查。"
  }
 },
 "organizations": {
  "form": {
   "errors": {
    "margin": "请输入 {{min}} 到 {{max}} 之间的整数。"
   }
  }
 },
 "views": {
  "organizationDetail": {
   "openPerformance": "绩效",
   "freezeMargin": "超出预算 {{percent}}% 时冻结"
  }
 },
 "rollbackTicks": {
  "legend": "进行中的守护者巡检"
 },
 "cascadeCancel": {
  "action": "取消此单元内的全部工作",
  "title": "取消 {{name}} 内的全部工作",
  "message": "要取消 {{name}} 及其下所有单元中智能体的每个排队和运行中的运行、守护者巡检、未结上报和排队消息吗？此操作不会冻结单元，新工作仍可能重新开始。",
  "reason": "原因",
  "reasonPlaceholder": "为什么要全部停止（可选）",
  "keep": "继续运行",
  "confirm": "全部取消",
  "working": "正在取消...",
  "done": "已取消 {{name}} 内的全部工作。",
  "resultIntro": "{{name}} 内的全部工作已停止：",
  "notFrozen": "该单元未被冻结。冻结它可阻止新工作开始。",
  "freeze": "冻结单元",
  "counts": {
   "runsCancelled": "已取消的运行",
   "ticksCancelled": "已取消的守护者巡检",
   "escalationsWithdrawn": "已撤回的上报",
   "messagesExpired": "已过期的消息"
  }
 },
 "performance": {
  "title": "绩效",
  "subtitle": "组织中每个单元和智能体的表现：结果、成本、延迟、上报和评估分数。",
  "heading": "{{name}} 的绩效",
  "range": "{{from}} 至 {{to}}",
  "notFoundTitle": "无法查看绩效",
  "notFoundBody": "该组织不存在，或你无权读取。",
  "unit": "单元",
  "allUnits": "所有单元",
  "lead": "负责人",
  "sample": "运行 {{n}}",
  "outcomes": "成功 {{succeeded}}，失败 {{failed}}，取消 {{cancelled}}",
  "evalScore_other": "{{count}} 次评估运行，得分 {{score}}",
  "picker": {
   "title": "选择组织",
   "emptyTitle": "还没有组织",
   "emptyBody": "请先创建一个由守护者组成的组织。它的绩效会显示在这里。"
  },
  "window": {
   "label": "时间范围",
   "24h": "24 小时",
   "7d": "7 天",
   "30d": "30 天",
   "custom": "自定义",
   "from": "开始日期",
   "to": "结束日期",
   "apply": "应用",
   "errors": {
    "from": "请选择第一天。",
    "to": "请选择最后一天。",
    "order": "最后一天不能早于第一天。",
    "span": "时间范围最多 {{max}} 天。"
   }
  },
  "chart": {
   "title": "各单元的成功率和成本",
   "successRate": "成功率",
   "cost": "成本",
   "noRuns": "没有已结束的运行",
   "rateLabel": "{{unit}} 的成功率：{{value}}",
   "costLabel": "{{unit}} 的成本：{{value}}"
  },
  "columns": {
   "unit": "单元",
   "agent": "智能体",
   "runs": "运行",
   "outcomes": "结果",
   "successRate": "成功率",
   "costUsd": "成本",
   "latency": "延迟 p50 / p95 / p99",
   "escalations": "上报",
   "loopGuardRejections": "循环防护拒绝",
   "evalScore": "评估分数",
   "samples": "示例运行"
  },
  "units": {
   "title": "单元",
   "empty": "此时间范围内已上线的架构图中没有单元。"
  },
  "agents": {
   "title": "智能体",
   "empty": "已上线的架构图中没有智能体。"
  },
  "checks": {
   "title": "定期检查",
   "note": "检查是按计划针对某个部署的最近输入运行的评估。由人创建；智能体无法评分或修改。",
   "new": "新建检查",
   "empty": "没有针对此组织部署的定期检查。",
   "never": "尚未运行",
   "passed": "通过",
   "failed": "低于阈值",
   "columns": {
    "check": "检查",
    "evalSet": "评估集",
    "deployment": "部署",
    "schedule": "计划",
    "lastRun": "上次运行",
    "lastScore": "上次得分",
    "nextFire": "下次运行"
   }
  }
 },
 "tour": {
  "steps": {
   "performance": {
    "title": "绩效",
    "body": "绩效标签页显示组织中每个单元和智能体在一段时间内的表现，以及不让智能体自评、由人设置的定期检查。"
   }
  }
 },
 "explainers": {
  "performance": {
   "title": "绩效",
   "p1": "每个单元行涵盖该单元及其下所有内容：时间范围内创建的运行、运行结果、成功率（成功数除以成功数与失败数之和）、成本、延迟百分位、发起的上报、循环防护拒绝，以及针对该单元部署的评估运行平均分。评估、影子和试验场运行不计入。",
   "p2": "定期检查是 EvalSet 触发器：按计划用已批准的评估集针对某个部署的最近输入运行。只有人能创建它们，因此智能体无法给自己的工作评分。"
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "performance": "绩效：按单元和智能体显示结果、成本、延迟、上报和评估分数，以及定期检查。"
   }
  },
  "enums": {
   "triggerTargetType": {
    "EvalSet": "每次触发都会针对部署的最近输入启动一次评估集运行。只有人可以创建。"
   },
   "notificationEvent": {
    "OrgBudgetFrozen": "某个单元的支出超出预算达到组织设定的余量，预算守卫已将其冻结。"
   },
   "auditEventType": {
    "OrgBudgetFrozen": "预算守卫冻结了一个支出超出预算达到组织余量的单元。",
    "UnitCascadeCancelled": "有人取消了某个单元子树中的每个运行、守护者巡检、上报和排队消息。"
   },
   "rollbackActiveTicks": {
    "Finish": "正在进行的巡检会完成，但其守护者保持在恢复后的修订版上。",
    "Cancel": "在恢复架构图之前取消进行中巡检的运行。"
   }
  },
  "resources": {
   "organizations": {
    "budgetFreezeMarginPercent": "单元可以超出预算多少（百分比）后才会被预算守卫冻结：0 到 100，默认 10。"
   },
   "triggers": {
    "evalSetId": "检查每次触发时运行的评估集。",
    "evalJudgeAgentId": "为回答评分的智能体。留空则使用评估集的评分智能体。",
    "evalRecentInputCount": "每次评估运行重放该部署最新输入的数量，1 到 50。"
   }
  },
  "views": {
   "organizationDetail": {
    "openPerformance": "打开此组织按单元和智能体划分的绩效及其定期检查。"
   }
  },
  "rollbackTicks": {
   "legend": "回滚架构图时，正在进行的守护者巡检如何处理。"
  },
  "board": {
   "brakes": {
    "pickUnitFirst": "请先选择一个单元。"
   }
  },
  "cascadeCancel": {
   "action": "停止此单元及其下所有单元的全部工作：运行、守护者巡检、上报和排队消息。会要求确认。",
   "confirm": "立即取消该单元子树中的全部工作。此操作无法撤销。",
   "reason": "可选，最多 1024 个字符。会记录在审计日志和被撤回的上报中。",
   "freeze": "冻结该单元，在解除冻结前不会开始新工作。",
   "counts": {
    "runsCancelled": "子树中智能体被取消的排队和运行中的运行。",
    "ticksCancelled": "被取消的进行中守护者巡检。",
    "escalationsWithdrawn": "子树中智能体发起、已被撤回的未结上报。",
    "messagesExpired": "发给子树中智能体、已过期的排队消息。"
   }
  },
  "performance": {
   "refresh": "重新读取所选时间范围的绩效。",
   "unit": "显示一个单元及其下所有内容，或显示所有单元。",
   "lead": "此智能体负责其单元。",
   "openAgent": "打开智能体。",
   "openRun": "打开此示例运行。",
   "picker": {
    "open": "打开此组织的绩效。"
   },
   "window": {
    "24h": "最近 24 小时。",
    "7d": "最近 7 天。",
    "30d": "最近 30 天。",
    "custom": "选择第一天和最后一天，相隔最多 90 天。",
    "from": "时间范围的第一天（UTC）。",
    "to": "时间范围的最后一天（UTC），包含当天。",
    "apply": "读取这些日期的绩效。"
   },
   "chart": {
    "title": "时间范围内每个单元子树的成功率和成本。",
    "successRate": "成功的运行除以成功与失败运行之和。",
    "cost": "单元子树的支出，以最贵的单元为基准缩放。"
   },
   "columns": {
    "unit": "单元。其行涵盖其下的所有内容。",
    "agent": "智能体及其所在的单元。",
    "runs": "时间范围内创建的运行，不含评估、影子和试验场运行。",
    "outcomes": "成功、失败和已取消的运行。",
    "successRate": "成功数除以成功数与失败数之和。没有运行结束时为空。",
    "costUsd": "这些运行的支出（美元）。",
    "latency": "已结束运行耗时的中位数、第 95 和第 99 百分位。",
    "escalations": "发起的上报，以及发起上报的运行所占比例。",
    "loopGuardRejections": "被循环防护拒绝的消息发送和唤醒。",
    "evalScore": "针对这些部署已完成评估运行的平均分，包括定期检查。",
    "samples": "最多五个可查看的运行：先是最新的失败运行，然后是最新的成功运行。"
   },
   "units": {
    "title": "每个单元及其整个子树的指标。"
   },
   "agents": {
    "title": "已上线架构图中每个智能体自己的指标。"
   },
   "checks": {
    "title": "由人设置、按计划针对组织部署运行的评估。",
    "new": "打开触发器编辑器，并将目标设为定期检查。",
    "openSet": "打开评估集。",
    "openRun": "打开上次评估运行及其用例结果。",
    "passed": "上次运行达到了评估集的阈值。",
    "failed": "上次运行低于评估集的阈值。",
    "columns": {
     "check": "安排该检查的触发器，以及它是否启用。",
     "evalSet": "检查运行的评估集。",
     "deployment": "检查重放其最近输入的部署。",
     "schedule": "触发器的 cron 表达式。",
     "lastRun": "上次评估运行的开始时间及其状态。点击打开该运行。",
     "lastScore": "上次评估运行的得分，0 到 100%。",
     "nextFire": "检查下次运行的时间。"
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
})(zhHans, {
 "common": {
  "tabs": {
   "scrollBack": "显示前面的标签页",
   "scrollForward": "显示更多标签页"
  }
 },
 "evals": {
  "run": {
   "placeholders": {
    "thresholdPercent": "无",
    "budgetUsd": "无"
   },
   "hints": {
    "thresholdPercent": "可选，0 到 100。加权得分达到该值即为通过。留空表示没有阈值，也没有通过或未通过的判定。",
    "budgetUsd": "可选。用例和评审运行花费达到此金额后，其余用例将被跳过，运行失败。留空表示没有预算。"
   }
  }
 },
 "tips": {
  "permissions": {
   "denied": "你无权执行此操作。需要对 {{resource}} 拥有 {{operation}} 权限。"
  },
  "views": {
   "escalationDetail": {
    "openKeeperNamed": "打开提出它的 tick 所属的 keeper。其 ID 为 {{id}}。"
   }
  },
  "tabs": {
   "scrollBack": "将标签栏向后滚动，显示第一个可见标签页之前隐藏的标签页。",
   "scrollForward": "滚动标签栏，显示超出边缘而隐藏的标签页。"
  },
  "enums": {
   "wakeSource": {
    "Manual": "有人唤醒了 keeper：立即唤醒、恢复、发布修订或给出指示。"
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
})(zhHans, {
 "enums": {
  "auditEventType": {
   "MandatePaused": "Keeper 已暂停",
   "MandateResumed": "Keeper 已恢复",
   "MandateWoken": "Keeper 已唤醒",
   "MandateDeleted": "Keeper 已删除",
   "EscalationAnswered": "升级已回答",
   "EscalationCancelled": "升级已取消"
  }
 },
 "board": {
  "attention": {
   "earlier_one": "以及之前的 {{count}} 份",
   "earlier_other": "以及之前的 {{count}} 份"
  },
  "direction": {
   "unchanged": "{{name}} 的当前修订已包含此指示。未发布任何内容，CEO 也未唤醒。"
  }
 },
 "errorCodes": {
  "RevisionUnchanged": "没有变化：草稿与最新发布的修订内容相同，因此未发布。请在发布前修改，或将其丢弃。"
 },
 "components": {
  "keeperRevision": {
   "unchanged": "已将修订 {{number}} 保存为草稿，但未发布：它与当前修订内容相同。"
  }
 },
 "common": {
  "fieldCodes": {
   "InvalidType": "此值的类型不正确。",
   "InvalidTypeOf": "请输入{{type}}。",
   "InvalidValue": "不允许此值。",
   "InvalidValueOneOf": "请选择以下之一：{{values}}。",
   "InvalidValueRange": "请输入 {{min}} 到 {{max}} 之间的值。",
   "fieldMessage": "{{field}}：{{message}}"
  },
  "fieldTypes": {
   "text": "文本",
   "trueFalse": "true 或 false",
   "wholeNumber": "整数",
   "number": "数字",
   "map": "名称与值的对象",
   "list": "列表",
   "object": "对象",
   "dateTime": "类似 2026-12-31T00:00:00Z 的日期时间",
   "duration": "类似 00:05:00 的时长"
  }
 },
 "resources": {
  "harnessProfiles": {
   "fields": {
    "mcpToolNamePrefix": "MCP 工具名称前缀"
   },
   "hints": {
    "mcpToolNamePrefix": "可选。字母、数字、_ - . : 和 {server}，最多 128 个字符。"
   },
   "errors": {
    "toolPrefixTooLong": "最多使用 {{max}} 个字符。",
    "toolPrefixInvalid": "只能使用字母、数字、_ - . : 和 {server}。"
   }
  }
 },
 "tips": {
  "enums": {
   "auditEventType": {
    "MandatePaused": "有人暂停了一个 keeper：恢复之前不会再唤醒。",
    "MandateResumed": "有人恢复了一个已暂停的 keeper，它现在唤醒。",
    "MandateWoken": "有人对一个 keeper 使用了立即唤醒。",
    "MandateDeleted": "有人删除了一个 keeper 及其修订和 tick。",
    "EscalationAnswered": "有人回答了一个未处理的升级。",
    "EscalationCancelled": "有人取消了一个未处理的升级。"
   }
  },
  "board": {
   "attention": {
    "earlier_one": "该作者在过去 7 天内还提交了之前的 {{count}} 份降级或不健康报告。打开其全部报告。",
    "earlier_other": "该作者在过去 7 天内还提交了之前的 {{count}} 份降级或不健康报告。打开其全部报告。"
   }
  },
  "keeperRevision": {
   "unchanged": "此修订与当前修订内容相同，发布不会改变任何内容。请先做些修改。"
  },
  "resources": {
   "harnessProfiles": {
    "mcpToolNamePrefix": "harness 向模型展示 MCP 工具时加在工具名称前的内容。用 {server} 表示服务器名称，例如 mcp__{server}__ 或 {server}.（点）。如果模型看到的是原始工具名称，请留空。"
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
})(zhHans, {
 "nav": {
  "hubs": {
   "autonomy": {
    "tip": "自行持续工作的代理：守护者按计划唤醒，相互发消息，提交报告，记住信息，并在受阻时询问人员。冻结可以让它们停止。"
   },
   "organizations": {
    "label": "组织",
    "tip": "按单元组织图排列的代理，每个单元有负责人和预算，包括董事会、按单元的表现，以及让高管代理应用提案的变更规则。"
   },
   "evaluations": {
    "label": "评估",
    "tip": "变更进入生产之前的检查：评估集及其运行、与在线代理并行的影子试验，以及分步转移流量的金丝雀发布。"
   }
  }
 },
 "tips": {
  "nav": {
   "hubs": {
    "autonomy": "自行持续工作的代理：守护者按计划唤醒，相互发消息，提交报告，记住信息，并在受阻时询问人员。冻结可以让它们停止。",
    "organizations": "按单元组织图排列的代理，每个单元有负责人和预算，包括董事会、按单元的表现，以及让高管代理应用提案的变更规则。",
    "evaluations": "变更进入生产之前的检查：评估集及其运行、与在线代理并行的影子试验，以及分步转移流量的金丝雀发布。"
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
})(zhHans, {
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
})(zhHans, {
 "trail": {
  "tab": "轨迹",
  "loading": "正在加载轨迹...",
  "notFound": "找不到此运行的轨迹。该运行可能已被删除。",
  "refresh": "刷新",
  "exportJson": "导出 JSON",
  "openTrail": "打开轨迹",
  "openStep": "详情",
  "openStepNamed": "{{step}} 的详情",
  "callerLane": "调用方",
  "focusRun": "你打开的运行",
  "runOfKind": "运行：{{kind}}",
  "redactedTitle": "{{kind}}（已隐藏）",
  "redactedNote": "部分步骤已隐藏，因为你无权读取其记录。它们只显示类型和时间。",
  "idleGap": "空闲 {{duration}}",
  "keysHint": "方向键在步骤间移动，Enter 打开步骤。",
  "sequenceLabel": "{{lanes}} 条泳道中 {{steps}} 个步骤的序列",
  "graphLabel": "{{steps}} 个步骤的图",
  "listEmpty": "没有符合这些筛选条件的步骤。",
  "singleTitle": "此运行没有启动其他任何内容",
  "singleBody": "它没有发送消息、没有启动其他运行，也没有提交任何内容。轨迹显示请求和回复。",
  "truncationSetting": "轨迹设置",
  "truncation": {
   "NodeCap": "此轨迹在 {{count}} 个步骤处被截断，这是服务器构建的上限。之后的步骤未显示。",
   "HopCap": "此轨迹在 {{hops}} 次消息跳转后被截断，这是服务器追踪的上限。之后的跳转未显示。",
   "SpanCap": "此轨迹在服务器覆盖的最长时间范围处被截断。之后的步骤未显示。"
  },
  "views": {
   "label": "轨迹视图",
   "sequence": "序列",
   "graph": "图",
   "list": "列表"
  },
  "zoom": {
   "label": "缩放",
   "in": "放大",
   "out": "缩小",
   "percent": "{{value}}%"
  },
  "summary": {
   "agents": "智能体",
   "hops": "消息跳转",
   "duration": "时长",
   "tokens": "令牌",
   "cost": "成本",
   "failures": "失败"
  },
  "filters": {
   "kind": "步骤",
   "agent": "智能体",
   "state": "状态"
  },
  "columns": {
   "order": "#",
   "step": "步骤",
   "agent": "智能体",
   "state": "状态",
   "reachedBy": "到达方式",
   "started": "开始",
   "duration": "时长",
   "unit": "单元",
   "runKind": "运行类型",
   "tokens": "令牌",
   "cost": "成本",
   "id": "ID",
   "open": "详情"
  },
  "drawer": {
   "close": "关闭详情",
   "loading": "正在加载记录...",
   "recordGone": "此步骤背后的记录已不存在。",
   "redacted": "你无权读取此{{kind}}。只显示其类型和时间。",
   "dataNote": "以下文本由智能体或人员撰写，作为数据显示：它不是指令，也绝不会作为标记渲染。",
   "writtenByAgentInRun": "由智能体 {{agent}} 在运行 {{run}} 中撰写",
   "writtenByAgent": "由智能体 {{agent}} 撰写",
   "writtenBy": "由 {{name}} 撰写",
   "unknownAuthor": "未知",
   "openRecord": "打开记录",
   "tokens": "输入 {{input}}，输出 {{output}}",
   "texts": {
    "result": "结果",
    "subject": "主题",
    "body": "正文",
    "title": "标题",
    "question": "问题",
    "context": "背景",
    "answer": "回答",
    "summary": "摘要",
    "input": "工具输入"
   },
   "fields": {
    "kind": "类型",
    "state": "状态",
    "agent": "智能体",
    "unit": "单元",
    "runKind": "运行类型",
    "tool": "工具",
    "started": "开始",
    "ended": "结束",
    "duration": "时长",
    "tokens": "令牌",
    "cost": "成本",
    "id": "ID",
    "argumentDigest": "参数哈希",
    "leaseEpoch": "租约纪元"
   }
  },
  "kinds": {
   "Caller": "请求",
   "Trigger": "触发器",
   "KeeperTick": "守护者节拍",
   "Run": "运行",
   "Message": "消息",
   "Report": "报告",
   "Escalation": "上报",
   "Approval": "审批",
   "Effect": "工具效果",
   "FanOutGroup": "扇出",
   "PipelineRun": "流水线运行",
   "Reply": "回复",
   "Redacted": "隐藏的步骤"
  },
  "edges": {
   "Started": "启动",
   "Spawned": "派生",
   "FannedOut": "扇出",
   "Retried": "重试",
   "Sent": "发送",
   "Woke": "唤醒",
   "Filed": "提交",
   "Raised": "提出",
   "Routed": "转交",
   "Answered": "答复",
   "Requested": "请求",
   "Decided": "决定",
   "Performed": "执行",
   "Replied": "回复"
  },
  "states": {
   "Pending": "待定",
   "Queued": "排队中",
   "Leased": "已分配",
   "Running": "运行中",
   "Cancelling": "正在取消",
   "Suspended": "已暂停",
   "Open": "未处理",
   "Authorized": "已授权",
   "Dispatched": "已派发",
   "Succeeded": "成功",
   "Completed": "已完成",
   "Delivered": "已送达",
   "Acknowledged": "已确认",
   "Answered": "已答复",
   "Filed": "已提交",
   "Approved": "已批准",
   "Joined": "已汇合",
   "Failed": "失败",
   "TimedOut": "已超时",
   "Rejected": "已拒绝",
   "Denied": "已否决",
   "Expired": "已过期",
   "BudgetExceeded": "超出预算",
   "Unknown": "未知",
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
})(zhHans, {
 "components": {
  "orgDesigner": {
   "tabs": {
    "design": "设计",
    "people": "人员",
    "keepers": "守护者",
    "budget": "预算",
    "rules": "规则",
    "label": "单元 {{name}}"
   },
   "note": "更改会立即保存到工作树。只有从页面顶部发布修订版后才会生效。",
   "empty": "还没有单元。用“添加单元”创建根单元，或从模板开始一个新组织。",
   "narrow": "画布需要更宽的屏幕，所以单元以列表形式显示在下方。每次更改仍会保存到工作树。",
   "failed": "{{change}}未能完成。",
   "operations": {
    "AddUnit": "添加单元",
    "RemoveUnit": "移除单元",
    "MoveUnit": "移动单元",
    "SetLead": "更换负责人",
    "AddUnitMember": "添加成员",
    "RemoveUnitMember": "移除成员",
    "ConnectUnits": "添加对等线路",
    "DisconnectUnits": "移除对等线路",
    "SetBudget": "保存预算",
    "AttachMandate": "关联守护者",
    "DetachMandate": "解除守护者"
   },
   "minimap": "组织小地图",
   "node": {
    "problems_one": "{{count}} 个问题",
    "problems_other": "{{count}} 个问题"
   },
   "announce": {
    "leadSet": "{{name}} 现在负责 {{unit}}。"
   },
   "keys": {
    "undo": "Ctrl+Z 撤销上一次更改，Ctrl+Shift+Z 或 Ctrl+Y 重做（Mac 上用 Cmd）。",
    "place": "在“人员”中选好智能体后，在单元上按 Enter 将其添加为成员，按 L 将其设为负责人。"
   },
   "history": {
    "label": "撤销和重做",
    "undo": "撤销",
    "redo": "重做",
    "undone": "已撤销：{{change}}。",
    "redone": "已重做：{{change}}。",
    "methods": {
     "addUnit": "添加单元",
     "removeUnit": "移除单元",
     "moveUnit": "移动单元",
     "setLead": "更换负责人",
     "addMember": "添加成员",
     "removeMember": "移除成员",
     "connectUnits": "添加对等线路",
     "disconnectUnits": "移除对等线路",
     "setBudget": "更改预算",
     "attachMandate": "关联守护者",
     "detachMandate": "解除守护者"
    }
   },
   "palette": {
    "title": "人员",
    "search": "搜索智能体",
    "hint": "把智能体拖到单元上可将其添加为成员，拖到负责人一行可将其设为负责人。也可以先选中智能体，再选择去向。",
    "none": "此租户还没有智能体。",
    "noMatch": "没有与搜索匹配的智能体。",
    "inUnit": "在 {{unit}}",
    "newAgent": "新建智能体",
    "newAgentTitle": "为 {{unit}} 新建智能体",
    "placing": "放置 {{name}}：",
    "unit": "单元",
    "as": "身份",
    "asMember": "成员",
    "asLead": "负责人",
    "place": "放置"
   },
   "structure": {
    "lead": "负责人",
    "title": "负责人头衔",
    "setLead": "设为负责人",
    "parent": "汇报对象",
    "move": "移动"
   },
   "keepers": {
    "hint": "守护者是智能体按唤醒计划持续执行的常设任务。单元中的每个职位可以有一个守护者。",
    "noPeople": "请先添加负责人或成员。守护者关联到单元中的人员。",
    "lead": "负责人",
    "member": "成员",
    "none": "未关联守护者。",
    "nextWake": "下次唤醒 {{when}}",
    "notScheduled": "未安排",
    "every": "每 {{interval}}",
    "schedule": "编辑计划",
    "detach": "解除",
    "pick": "要关联的守护者",
    "attach": "关联",
    "create": "新建守护者",
    "createTitle": "为 {{name}} 新建守护者"
   },
   "budget": {
    "hint": "预算限制单元及其下所有单元可以花费的金额。支出是当前已发布修订版在当前时间窗口内的数据。",
    "amount": "预算（USD）",
    "clear": "清除",
    "noSpend": "此时间窗口内没有支出记录。",
    "cap": "最多 {{amount}}，即 {{unit}} 的{{period}}预算。",
    "noCap": "上级单元没有设置{{period}}预算。",
    "capLeft": "{{unit}} 在此时间窗口内还剩 {{left}}。"
   },
   "rules": {
    "hint": "变更规则让高管在此子树中的常规提案无需人工即可生效。规则只能由人编写。",
    "add": "添加规则",
    "none": "没有覆盖此单元的变更规则。",
    "here": "设置在此单元上。",
    "above": "设置在上级单元 {{unit}} 上。",
    "by": "由 {{name}} 编写。",
    "runToken": "智能体不能编写变更规则，因此运行令牌只能只读查看此列表。"
   },
   "problems": {
    "title_one": "检查：{{count}} 个问题",
    "title_other": "检查：{{count}} 个问题",
    "checking": "正在检查组织...",
    "none": "未发现问题。",
    "failed": "无法运行检查：{{reason}}",
    "show": "显示 {{unit}}",
    "UnitWithoutLead": "{{unit}} 没有负责人。",
    "AgentInTwoUnits": "{{agent}} 位于多个单元中，其中包括 {{unit}}。",
    "PeerLineToMissingUnit": "{{unit}} 有一条对等线路指向不在此组织中的单元。",
    "BudgetOverParent": "{{unit}} 的预算高于其上级单元的预算。",
    "KeeperDeploymentMissing": "{{unit}} 中 {{agent}} 的守护者 {{mandate}} 没有可用的部署。",
    "UnitDetachedFromRoot": "{{unit}} 无法连到根单元。"
   },
   "overlay": {
    "range": "活动时间范围",
    "days_one": "{{count}} 天",
    "days_other": "{{count}} 天",
    "spend": "{{period}}：{{spent}} / {{amount}}",
    "spendOnly": "{{period}}：已花费 {{spent}}",
    "activity_one": "最近 {{count}} 天：{{runs}} 次运行，{{escalations}} 次上报，{{cost}}",
    "activity_other": "最近 {{count}} 天：{{runs}} 次运行，{{escalations}} 次上报，{{cost}}",
    "pick": "选择一个单元以查看其最近的运行。",
    "noReport": "尚未提交报告。",
    "noActivity": "此时间范围内没有活动。",
    "runs": "最近的运行",
    "noRuns": "此时间范围内没有运行。",
    "openTrail": "打开轨迹"
   },
   "chartLayout": {
    "label": "组织图布局",
    "tree": "树",
    "canvas": "画布"
   },
   "templates": {
    "title": "从模板新建组织",
    "open": "从模板新建",
    "intro": "从空组织开始，或应用一个示例组织。示例在模拟 Harness上运行，因此不需要凭据。",
    "apply": "应用模板",
    "create": "创建组织",
    "preview": "查看会创建什么",
    "previewHint": "应用前先查看会创建什么。这会以试运行方式执行清单，并列出将要创建或更改的内容。",
    "contents_one": "此模板包含 {{count}} 个资源",
    "contents_other": "此模板包含 {{count}} 个资源",
    "ticks": "此模板中的守护者会在应用后几秒内开始唤醒。",
    "blank": {
     "name": "空白",
     "body": "一个空组织。根单元在“设计”选项卡中添加。"
    },
    "gerbil": {
     "name": "Gerbil",
     "body": "一个单元里有一个守护者。它监视一个状态页面，页面持续宕机时会询问人员。"
    },
    "siteReliability": {
     "name": "站点可靠性",
     "body": "一名负责人和三个守护者照看一个公开网站，含对等线路、预算和一名记忆整理员。"
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
})(zhHans, {
 "nav": {
  "learn": "学习",
  "hubs": {
   "learn": {
    "label": "学习",
    "tip": "用图示、导览和术语表说明 Garrison 各部分如何配合"
   }
  },
  "items": {
   "learn": {
    "label": "学习",
    "tip": "用图示、导览和术语表说明 Garrison 各部分如何配合"
   }
  }
 },
 "learn": {
  "title": "学习",
  "subtitle": "一张图一张图地看 Garrison 的各个部分如何配合。点方框打开对应页面，点角上的书本图标打开对应指南。",
  "toc": "本页内容",
  "startTourNamed": "导览：{{tour}}",
  "showList": "以列表显示",
  "showDiagram": "以图示显示",
  "openPage": "{{name}}。打开{{page}}。",
  "openDoc": "在 {{doc}} 中阅读{{name}}",
  "glossaryTitle": "术语表",
  "glossaryIntro": "这里用的是文档里的词。仪表板用词不同的地方，条目里会注明。",
  "list": {
   "parts": "组成部分",
   "connections": "关系",
   "connection": "{{from}} {{arrow}} {{to}}",
   "connectionLabelled": "{{from}} {{arrow}} {{to}}：{{label}}",
   "doc": "指南：{{doc}}"
  },
  "tours": {
   "firstLook": "初次了解",
   "runAnAgent": "运行一个智能体",
   "followARequest": "跟踪一个请求",
   "buildATeam": "组建团队",
   "keepItSafe": "确保安全",
   "watchAnOrganization": "观察一个组织"
  },
  "diagrams": {
   "runtime": {
    "title": "运行时",
    "summary": "租户里有智能体，以及运行这些智能体的部署。部署把智能体与 Harness 配置文件、模型、提示词和节点池绑定在一起。每个请求都会变成一次运行，该节点池里的工作节点领取这次运行并启动 Harness。工作节点从不访问数据库：它需要的一切都随租约一起送达。",
    "desc": "租户包含访问密钥、智能体、Harness 配置文件、部署和运行。节点池和工作节点组成各租户共享的机群。",
    "groups": {
     "tenant": "租户",
     "fleet": "共享机群"
    },
    "boxes": {
     "credential": {
      "title": "访问密钥",
      "body": "属于某个用户的密钥。调用方和工作节点用它登录。"
     },
     "agent": {
      "title": "智能体",
      "body": "调用方通过 REST、MCP 或 A2A 调用的对象。它保存不可变的修订。"
     },
     "harnessProfile": {
      "title": "Harness 配置文件",
      "body": "说明某个 Harness CLI 或 API 如何无界面运行。仪表板里称为连接。"
     },
     "deployment": {
      "title": "部署",
      "body": "把智能体与 Harness 配置文件、模型、提示词和节点池绑定。"
     },
     "nodePool": {
      "title": "节点池",
      "body": "一组工作节点，可以专供特定租户使用。"
     },
     "run": {
      "title": "运行",
      "body": "智能体在一个部署上的一次执行，带有事件和结果。"
     },
     "node": {
      "title": "工作节点",
      "body": "领取自己能处理的运行，并为每次运行启动 Harness。"
     }
    },
    "arrows": {
     "invokes": "调用",
     "runsOn": "运行于",
     "usedBy": "被使用",
     "targets": "指向",
     "creates": "创建",
     "groups": "分组",
     "leases": "租用"
    }
   },
   "request": {
    "title": "一个请求的经历",
    "summary": "启动智能体的各种方式最终都走到同一个地方。REST、MCP 和 A2A 共用一个调用入口，它先选定部署，只有在冻结、单元预算和队列上限都不阻拦时才接纳这次运行。工作节点领取排队中的运行，拿到编译好的规格，然后启动 Harness。输出以事件的形式返回，调用方拿到结果。",
    "desc": "请求从调用方经 REST、MCP 或 A2A 进入运行准入和队列。工作节点租用它并启动 Harness，输出以事件和回复的形式返回。",
    "groups": {
     "controlPlane": "控制平面",
     "worker": "在工作节点上"
    },
    "boxes": {
     "caller": {
      "title": "调用方",
      "body": "一个人、一个 SDK、一个 MCP 客户端或一个 A2A 智能体。"
     },
     "surface": {
      "title": "REST、MCP 或 A2A",
      "body": "三者使用同一个调用入口，都会检查对智能体的 Execute 权限。"
     },
     "admission": {
      "title": "运行准入",
      "body": "选定部署，然后检查冻结、单元预算和队列上限。被拒绝的运行根本不会创建。"
     },
     "queued": {
      "title": "已排队",
      "body": "等待具备合适 Harness、节点池和标签的工作节点。"
     },
     "lease": {
      "title": "租约",
      "body": "工作节点长轮询，用 compare-and-set 领取运行，并拿到编译好的规格。"
     },
     "harness": {
      "title": "Harness",
      "body": "CLI 或提供商 API，按规格里的参数、文件和 MCP 服务器启动。"
     },
     "events": {
      "title": "事件",
      "body": "分批发送解析后的输出：文本、工具调用、用量和结果。"
     },
     "reply": {
      "title": "回复",
      "body": "等待中的调用返回这次运行。流式连接收到最后一个事件。"
     }
    },
    "arrows": {
     "sends": "请求",
     "admitted": "已准入",
     "leased": "已租用",
     "starts": "启动",
     "returns": "结果"
    }
   },
   "autonomy": {
    "title": "自主运行的基本构件",
    "summary": "守护者是一个有常设任务的智能体，这项任务写成一份职责。Garrison 按计划唤醒它，每次唤醒就是一次巡检：一次普通的运行，以守护者报告它的发现结束。过程中它可以为之后的巡检记下内容，向上级提交报告，也可以把不该独自决定的问题上报。答复到达后会再次唤醒它。",
    "desc": "守护者持有一份职责，职责的唤醒计划启动巡检。每次巡检启动一次守护者运行，它写入记忆、提交报告并发起上报。得到答复的上报会再次唤醒守护者。",
    "boxes": {
     "keeper": {
      "title": "守护者",
      "body": "有常设任务的智能体。API 把这条记录称为 mandate。"
     },
     "mandate": {
      "title": "职责",
      "body": "已发布的修订：目标、健康状态的定义、自主范围和上报策略。"
     },
     "schedule": {
      "title": "唤醒计划",
      "body": "带退避的最短和最长间隔。领导副本对每次到期的唤醒只领取一次。"
     },
     "tick": {
      "title": "巡检",
      "body": "一次唤醒，记录唤醒来源和结果：平静、已处理、需要关注或已上报。"
     },
     "run": {
      "title": "守护者运行",
      "body": "在职责所用部署上的一次 Keeper 类型运行。以报告巡检结束。"
     },
     "memory": {
      "title": "记忆",
      "body": "带 recall 标签的条目会出现在下一次巡检的输入里。"
     },
     "report": {
      "title": "报告",
      "body": "向上提交。上级的下一次巡检会在摘要中读到它。"
     },
     "escalation": {
      "title": "上报",
      "body": "向某个人、某个角色或另一个智能体提出的问题。"
     }
    },
    "arrows": {
     "holds": "持有",
     "sets": "设定",
     "comesDue": "到期",
     "starts": "启动",
     "writes": "写入",
     "files": "提交",
     "raises": "发起",
     "answerWakes": "答复后唤醒"
    }
   },
   "teams": {
    "title": "团队",
    "summary": "智能体之间通过邮箱互相写信。消息是信件，不是电话：发送方继续做自己的事，接收方在下一次运行时读到它，紧急消息则会立即读到。每次发送都先经过防循环检查，被拒绝的消息连同原因一起保存，方便你看清谁想联系谁。",
    "desc": "消息通过防循环检查进入接收方的邮箱，或者被保存为已拒绝。普通邮件等待接收方的下一次运行，紧急邮件会唤醒接收方。",
    "boxes": {
     "sender": {
      "title": "发送方",
      "body": "某个智能体的运行，或一个人。智能体只能沿着线路写信。"
     },
     "guards": {
      "title": "防循环检查",
      "body": "依次为：收件人已冻结、无线路、跳数上限、会话上限、线路速率。"
     },
     "mailbox": {
      "title": "邮箱",
      "body": "接收方排队中的消息，最早的在前。"
     },
     "normal": {
      "title": "普通投递",
      "body": "等待守护者的下一次巡检，或等待一次读取收件箱的运行。"
     },
     "rejected": {
      "title": "已拒绝",
      "body": "连同原因一起保存，永不投递。"
     },
     "urgent": {
      "title": "紧急唤醒",
      "body": "把守护者的下一次唤醒提前；没有守护者时启动一次 Message 运行。"
     },
     "recipient": {
      "title": "接收方运行",
      "body": "一次运行带上所有已到达的消息，所以十条消息只花一次巡检。"
     }
    },
    "arrows": {
     "sends": "发送",
     "passes": "通过",
     "refused": "拒绝",
     "normal": "普通",
     "urgent": "紧急",
     "nextRun": "下一次运行",
     "wakes": "立即唤醒"
    }
   },
   "organization": {
    "title": "一个组织",
    "summary": "组织给一组智能体一个结构：一棵由单元组成的树，每个单元有负责人、成员、可选的对等线路和预算。根单元的负责人是 CEO，其上是委员会，也就是管理这个组织的人。编辑会进入一棵谁都不读取的工作树。发布修订后它才生效，此后消息、报告、记忆、上报、冻结和预算都查询同一条指挥链。",
    "desc": "委员会监督根单元，根单元的负责人是 CEO。下级单元通过汇报线路连到它，对等线路把单元横向相连。工作树在发布修订时生效，指挥链只读取已上线的修订。",
    "groups": {
     "live": "已上线修订"
    },
    "boxes": {
     "board": {
      "title": "委员会",
      "body": "管理组织的人，位于 CEO 之上。"
     },
     "root": {
      "title": "根单元",
      "body": "负责人是 CEO。它的预算限制整棵树。"
     },
     "unitA": {
      "title": "单元",
      "body": "一名负责人、最多 200 名成员，以及日预算和月预算各一个。"
     },
     "unitB": {
      "title": "对等单元",
      "body": "对等线路双向连接两个单元的所有智能体。"
     },
     "working": {
      "title": "工作树",
      "body": "人们编辑单元的地方。运行时谁都不读取它。"
     },
     "revision": {
      "title": "已发布修订",
      "body": "永不改变的快照。回滚会发布一份较早修订的副本。"
     },
     "chain": {
      "title": "指挥链",
      "body": "上级、上级链、子树和线路，只取自已上线的修订。"
     }
    },
    "arrows": {
     "oversees": "监督",
     "reportsA": "汇报线路",
     "peer": "对等线路",
     "publish": "发布",
     "readBy": "被读取"
    }
   },
   "selfRevision": {
    "title": "自我修订",
    "summary": "主管是可以对下级单元提出变更的单元负责人。它写一份普通的工作室草稿，ExecutiveDraftValidator 用任何东西都无法解除的硬性限制来检查它：不能涉及自己，不能涉及子树之上或之外的东西，不能碰机密，不能提高预算，也不能改管理权限。人写的变更规则完全覆盖的草稿会立即应用，其余的都要等人决定。每次应用都会发布一个组织修订并保存一份撤销草稿，所以一次回滚就能撤销它。",
    "desc": "主管写一份草稿。硬性限制拒绝它，或把它交给变更规则，而评估关卡可以把它拦下。被覆盖的草稿会应用，其余的等待一个能看到影子试验和金丝雀发布结果的人。每次应用都发布一个带撤销草稿的组织修订，回滚可以恢复它。",
    "boxes": {
     "executive": {
      "title": "主管",
      "body": "单元负责人，其部署可以为本单元以下起草变更。"
     },
     "draft": {
      "title": "草稿",
      "body": "普通的工作室草稿。人们把它当作提案跟踪。"
     },
     "limits": {
      "title": "硬性限制",
      "body": "在比较差异、申请和应用前一刻都会检查。任何规则或审批都无法解除。"
     },
     "refused": {
      "title": "已拒绝",
      "body": "申请以 DraftInvalid 失败，什么都不会改变。"
     },
     "eval": {
      "title": "评估关卡",
      "body": "主管对自己的草稿运行评估集。带关卡的规则需要合格的分数。"
     },
     "rules": {
      "title": "变更规则",
      "body": "只由人编写。每项变更先分类，再与规则匹配。"
     },
     "person": {
      "title": "由人决定",
      "body": "没有规则覆盖的变更和其他草稿一样等待。"
     },
     "apply": {
      "title": "应用",
      "body": "以发起这次运行的人，或批准它的人的身份应用。"
     },
     "evidence": {
      "title": "影子试验和金丝雀",
      "body": "由人启动。结果显示在提案上，金丝雀发布会自行回滚。"
     },
     "rollback": {
      "title": "回滚",
      "body": "恢复较早的修订，然后从最新的开始应用撤销草稿。"
     },
     "revision": {
      "title": "组织修订",
      "body": "每次应用一个，记录对应的草稿。"
     },
     "revert": {
      "title": "撤销草稿",
      "body": "被改动的记录在改动前的样子。"
     }
    },
    "arrows": {
     "writes": "编写",
     "checked": "检查",
     "breaks": "违反限制",
     "passes": "通过",
     "gate": "分数",
     "notCovered": "未覆盖",
     "covered": "完全覆盖",
     "allows": "批准",
     "evidence": "依据",
     "publishes": "发布",
     "saves": "保存",
     "restores": "恢复"
    }
   },
   "brakes": {
    "title": "制动",
    "summary": "制动不依赖智能体配合。冻结、紧急停止开关、支出上限和单元预算都在控制平面检查，时机是运行准入时和每次唤醒守护者之前，所以被拒绝的运行根本不会创建。运行令牌从不拥有冻结权限，智能体无法自己解除制动。对于已经在运行的工作，可以取消某个单元里的全部工作，并让预算守卫冻结超支的单元。",
    "desc": "冻结、紧急停止开关、支出上限和单元预算汇入运行准入时和唤醒守护者前的检查，这些检查拒绝新运行并跳过唤醒。对于正在进行的工作，全部取消会停止一个单元的子树，预算守卫会冻结超支的单元。",
    "groups": {
     "newWork": "阻止新工作",
     "inFlight": "停止进行中的工作"
    },
    "boxes": {
     "freeze": {
      "title": "冻结",
      "body": "停止一个智能体、部署、守护者、应用、单元或组织，直到有人解除。"
     },
     "killSwitch": {
      "title": "紧急停止开关",
      "body": "租户内所有守护者都不再唤醒。普通调用照常工作。"
     },
     "spendCap": {
      "title": "支出上限",
      "body": "守护者每次巡检和每天的预算。一天的额度用完后进入 CapReached。"
     },
     "unitBudget": {
      "title": "单元预算",
      "body": "对一个单元的子树所运行的一切设定的日上限或月上限。"
     },
     "checks": {
      "title": "准入和唤醒检查",
      "body": "在控制平面进行，从不由智能体执行。冻结通过事件总线传到每个副本。"
     },
     "refused": {
      "title": "被拒绝的运行",
      "body": "409 Frozen 或 BudgetExhausted。不会创建任何东西。"
     },
     "skipped": {
      "title": "跳过的唤醒",
      "body": "记为带代码的已跳过巡检，计划继续向前。"
     },
     "cancelAll": {
      "title": "全部取消",
      "body": "取消一个单元子树的运行和巡检，撤回其上报，并让其邮件过期。不冻结任何东西。"
     },
     "autoFreeze": {
      "title": "自动冻结",
      "body": "子树的支出达到预算加余量时，守卫冻结该单元并取消其运行。"
     }
    },
    "arrows": {
     "refuses": "新运行",
     "skips": "守护者唤醒"
    }
   }
  },
  "glossary": {
   "tenant": {
    "term": "租户",
    "def": "围绕一个客户的智能体、运行、用户和设置的边界。跨租户读取返回 404。"
   },
   "agent": {
    "term": "智能体",
    "def": "调用方调用的对象。它的配置保存在不可变的修订中。"
   },
   "deployment": {
    "term": "部署",
    "def": "与 Harness 配置文件、模型、提示词和节点池绑定的智能体。一个智能体可以有多个部署，按权重选择。"
   },
   "harnessProfile": {
    "term": "Harness 配置文件",
    "def": "说明 Harness CLI 或提供商 API 如何无界面运行：参数、提示词传递方式和输出解析器。仪表板把它们列在连接下。"
   },
   "nodePool": {
    "term": "节点池",
    "def": "部署可以指向的一组工作节点，可以专供特定租户使用。"
   },
   "node": {
    "term": "工作节点",
    "def": "领取运行并启动 Harness 的进程。它从不访问数据库。"
   },
   "run": {
    "term": "运行",
    "def": "智能体的一次执行。守护者巡检、消息唤醒、评估用例和影子副本都是各自类型的运行。"
   },
   "runToken": {
    "term": "运行令牌",
    "def": "每次运行为使用 Garrison 的 MCP 工具而获得的凭据。它从不拥有冻结权限。"
   },
   "keeper": {
    "term": "守护者",
    "def": "有常设任务、由 Garrison 按计划唤醒的智能体。API 称之为 mandate。"
   },
   "tick": {
    "term": "巡检",
    "def": "守护者的一次唤醒：一次以报告结果和摘要结束的运行。"
   },
   "message": {
    "term": "消息",
    "def": "从一个智能体发给另一个智能体，或由人发出的信件。发送方不等待答复。"
   },
   "line": {
    "term": "线路",
    "def": "允许一个智能体给另一个写信的关系：应用边、汇报线路、对等线路，或会话中的回复。"
   },
   "loopGuards": {
    "term": "防循环检查",
    "def": "每条消息都要通过的检查：收件人已冻结、无线路、跳数上限、会话上限和线路速率。"
   },
   "report": {
    "term": "报告",
    "def": "智能体向上级说明工作进展的方式。报告提交后不再改变。"
   },
   "memory": {
    "term": "记忆",
    "def": "智能体在多次运行之间保留的文本，存放在智能体、应用、组织单元或组织范围中。"
   },
   "escalation": {
    "term": "上报",
    "def": "运行不该独自决定时提出的问题。由人、角色或另一个智能体答复。"
   },
   "organization": {
    "term": "组织",
    "def": "给一组智能体结构的单元树。在有人发布修订之前，其中任何内容都不生效。"
   },
   "unit": {
    "term": "单元",
    "def": "树中的一个节点：负责人、成员、对等线路和预算。"
   },
   "board": {
    "term": "委员会",
    "def": "管理一个组织的人，位于其 CEO 之上。"
   },
   "chain": {
    "term": "指挥链",
    "def": "谁管理谁，只从已上线组织的已发布修订中读取。"
   },
   "executive": {
    "term": "主管",
    "def": "在硬性限制内可以对下级单元提出变更的单元负责人。"
   },
   "changeRule": {
    "term": "变更规则",
    "def": "人对某一小类主管变更给出的长期许可。只有人能编写。"
   },
   "evalSet": {
    "term": "评估集",
    "def": "带检查项的固定输入。评估运行用它给智能体修订或部署打分。"
   },
   "shadowTrial": {
    "term": "影子试验",
    "def": "把一部分真实输入复制给不会产生任何影响的候选部署，并比较答复。"
   },
   "canary": {
    "term": "金丝雀发布",
    "def": "分步把流量转到候选部署，错误率或评估分数越线时回滚。"
   },
   "freeze": {
    "term": "冻结",
    "def": "停止某个目标的新运行，直到有人解除。"
   },
   "killSwitch": {
    "term": "紧急停止开关",
    "def": "对整个租户的自主运行实施冻结。守护者不再唤醒，普通调用照常工作。"
   },
   "unitBudget": {
    "term": "单元预算",
    "def": "一个单元的子树可以花费的日上限或月上限。"
   }
  }
 },
 "components": {
  "explainer": {
   "seeDiagram": "查看图示"
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
})(zhHans, {
 "components": {
  "orgDesigner": {
   "problems": {
    "errors_one": "错误：{{count}}",
    "errors_other": "错误：{{count}}",
    "warnings_one": "警告：{{count}}",
    "warnings_other": "警告：{{count}}",
    "warningsOnly": "只剩警告，因此工作树仍可发布。",
    "OneRoot": "组织有多个根单元，其中包括 {{unit}}。",
    "Cycle": "{{unit}} 位于自身之下。",
    "UnitNameTaken": "有两个单元都名为 {{unit}}。",
    "TooManyUnits": "组织的单元数超过上限。",
    "TooManyMembers": "{{unit}} 的成员数超过上限。",
    "TooManyPeerLines": "{{unit}} 的对等线路数超过上限。",
    "BudgetPeriodTaken": "{{unit}} 有两个同周期的预算。",
    "BudgetInvalid": "{{unit}} 的某项预算金额无效。",
    "AgentInactive": "{{unit}} 中的 {{agent}} 未启用。",
    "MandateMismatch": "{{unit}} 中的守护者 {{mandate}} 不属于 {{agent}}。"
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
})(zhHans, {
 "components": {
  "orgDesigner": {
   "overlay": {
    "activity_one": "最近 1 天：{{runs}} 次运行，{{escalations}} 次上报，{{cost}}"
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
})(zhHans, {
 "tours": {
  "ui": {
   "finding": "正在查找下一步...",
   "skippedMissing": "已跳过 {{step}}，它现在不在这个页面上。",
   "skippedNoRecord": "已跳过 {{step}}：这个租户在那里还没有可显示的内容。",
   "endTitle": "教程结束",
   "endBody": "{{tour}} 到此结束。随时可以在学习页面或侧边栏的引导教程中再看一遍。"
  },
  "hub": {
   "label": "开始{{tour}}教程"
  },
  "picker": {
   "title": "引导教程",
   "intro": "每个教程针对一项工作，带你逐步走过真实页面。完成的教程会被标记，任何一个都可以重看。",
   "start": "开始",
   "replay": "重看",
   "finished": "已完成",
   "learn": "打开学习",
   "steps_one": "{{count}} 步",
   "steps_other": "{{count}} 步"
  },
  "sample": {
   "title": "加载示例？",
   "body": "{{tour}}需要{{need}}，而这个租户还没有。你可以通过应用清单加载{{example}}，也可以不加载继续，并跳过没有内容可显示的步骤。",
   "contents_one": "加载会应用 {{count}} 个资源：",
   "contents_other": "加载会应用 {{count}} 个资源：",
   "checking": "正在检查应用会改变什么...",
   "fake": "一切都在模拟 harness 上运行，所以不需要凭据，也不产生费用。它的守护者几秒内就会开始唤醒。",
   "runsLater": "运行相关的步骤需要一次运行。应用后几秒，第一次守护者巡检就会产生一次运行。",
   "load": "加载示例",
   "loading": "正在加载...",
   "continue": "不加载，继续",
   "loaded": "已加载{{example}}。",
   "needs": {
    "agents": "一个智能体",
    "runs": "一次运行",
    "keepers": "一个守护者",
    "organizations": "一个组织"
   },
   "examples": {
    "gerbil": "gerbil 示例",
    "siteReliability": "站点可靠性示例"
   }
  },
  "homeCard": {
   "title": "新来的？从学习开始",
   "body": "学习页面用图展示 Garrison 各部分如何配合，还有带你走过真实页面的简短教程。",
   "open": "打开学习",
   "dismiss": "关闭"
  },
  "wizard": {
   "nextTitle": "接下来",
   "nextBody": "学习页面讲解各部分如何配合，运行一个智能体教程会在控制台中走一遍同样的路径。",
   "learn": "打开学习",
   "tour": "开始运行一个智能体教程"
  },
  "firstLook": {
   "summary": "侧边栏、顶部栏、首页，以及在哪里找到帮助。",
   "steps": {
    "sidebar": {
     "title": "导航",
     "body": "这一侧把所有内容按中心分组。中心的页面在顶部显示为标签页，每个标签页都有自己的链接。"
    },
    "topbar": {
     "title": "你在哪里",
     "body": "顶部栏显示你正在使用的服务器和租户、你登录的身份，以及服务器是否健康、更新是否实时到达。"
    },
    "kpis": {
     "title": "一目了然",
     "body": "当前的情况：智能体、部署、今天正在进行或失败的运行，以及可以接收工作的工作节点。点击卡片可打开对应的列表。"
    },
    "invoke": {
     "title": "调用",
     "body": "试用智能体最快的方法。选一个，给它发一条消息，看着它的回答逐步显示出来。"
    },
    "autonomy": {
     "title": "自己工作的智能体",
     "body": "给智能体一项长期任务，它不用别人吩咐就会工作。守护者按计划唤醒它，在两次唤醒之间，它可以给其他智能体发消息、提交报告、记住学到的东西，并把问题上报给你。冻结可以立即停止这一切。"
    },
    "organizations": {
     "title": "组织",
     "body": "像组建团队一样把智能体分到单元里：一个负责人、若干成员和一份预算。委员会显示每个单元的情况，变更规则决定单元的高管可以不经你同意做哪些变更。"
    },
    "help": {
     "title": "帮助",
     "body": "设置向导可以重新做首次设置，引导教程列出所有教程，学习用图说明一切如何配合。页面上的 ? 按钮会开始该页面的教程。"
    }
   }
  },
  "runAnAgent": {
   "summary": "从连接到智能体、部署、调用，再到它产生的运行。",
   "steps": {
    "connections": {
     "title": "连接",
     "body": "连接告诉 Garrison 如何启动智能体背后的引擎：启动哪个 CLI 或 API，例如 Claude Code 或 Codex，以及使用什么设置。设置一次，所有部署都能用。"
    },
    "agents": {
     "title": "智能体",
     "body": "智能体是调用方通过 REST、MCP 或 A2A 按名称调用的对象，它也决定回答的格式。在有部署之前，它不会执行任何东西。"
    },
    "deployments": {
     "title": "部署",
     "body": "部署是真正运行的部分：一个智能体的连接、模型、提示词和限制。一个智能体有两个部署时，调用按权重分配，这样就能用部分流量试用新模型。"
    },
    "invoke": {
     "title": "调用",
     "body": "选择智能体，需要的话再选一个特定部署，输入消息并按发送。输出会出现在表单旁边。"
    },
    "run": {
     "title": "运行",
     "body": "每次调用都是一次运行。它的页面顶部显示状态和 ID，下面有对话记录、结果、输入等标签页。"
    },
    "trail": {
     "title": "轨迹标签页",
     "body": "轨迹会跟踪请求经过每个智能体，直到回复。跟踪一个请求教程会详细介绍。"
    }
   }
  },
  "followARequest": {
   "summary": "运行的轨迹标签页：三种视图、合计和每一步的详情。",
   "steps": {
    "views": {
     "title": "三种视图",
     "body": "序列给每个智能体一条泳道，时间向下推进。图把每一步放在引起它的步骤之后。列表把每一步显示为可以筛选的一行。"
    },
    "summary": {
     "title": "合计",
     "body": "有多少智能体参与、它们之间传了多少消息、花了多长时间、token 和费用，以及有多少步骤失败。"
    },
    "steps": {
     "title": "步骤",
     "body": "每个方框是一步：一次运行、一条消息、一份报告、一次上报、一次审批或一次工具调用。方向键在步骤之间移动，Enter 打开一步。"
    },
    "drawer": {
     "title": "步骤详情",
     "body": "抽屉显示一步的状态、时间和费用。智能体写的文字会作为纯数据显示，并注明作者，打开记录会转到完整记录。"
    },
    "actions": {
     "title": "刷新和导出",
     "body": "只要还有步骤在运行，轨迹就按这里选的间隔刷新。导出 JSON 会下载步骤和链接，不含智能体写的文字。"
    }
   }
  },
  "buildATeam": {
   "summary": "组织的设计标签页：画布、人员、守护者、预算和发布。",
   "steps": {
    "canvas": {
     "title": "画布",
     "body": "每个方框是一个单元，顶部是负责人和成员，里面是向它汇报的单元。方框之间的线是同级连线，让两个单元可以直接互发消息。"
    },
    "palette": {
     "title": "人员",
     "body": "把智能体从这个列表拖到某个单元上，或者选中一个，再选择单元以及它是负责还是加入。"
    },
    "keepers": {
     "title": "守护者",
     "body": "选中一个单元后，这个标签页会列出其中谁有守护者。可以挂上一个、新建一个，或者修改它何时唤醒。"
    },
    "budget": {
     "title": "预算",
     "body": "为单元设置每天或每月的上限。它涵盖这个单元及其下所有单元运行的一切。"
    },
    "publish": {
     "title": "发布",
     "body": "更改会立刻保存到工作树，但在这里发布之前都不会生效。每个修订都会保留，所以可以回滚。"
    }
   }
  },
  "keepItSafe": {
   "summary": "刹车：紧急停止开关、冻结、支出上限、变更规则和审批。",
   "steps": {
    "killSwitch": {
     "title": "紧急停止开关",
     "body": "打开后，租户中的守护者都不会唤醒，消息也不会唤醒智能体。普通调用照常工作。"
    },
    "freezes": {
     "title": "冻结",
     "body": "冻结会拒绝某个智能体、部署、守护者或应用的新运行，直到有人解除。单元和整个组织要在它们的委员会中冻结。"
    },
    "spendCaps": {
     "title": "支出上限",
     "body": "守护者可以设置每次巡检和每天的预算。当天预算用完后，它会停到下一个 UTC 日，并向你发送一条紧急上报。"
    },
    "changeRules": {
     "title": "变更规则",
     "body": "规则预先批准高管可以在下属单元中做的常规更改。只有人能写规则，规则没覆盖的都要等人来定。"
    },
    "approvals": {
     "title": "审批",
     "body": "当部署在调用工具前要求确认时，需要人来决定的调用会在这里等待。逐个允许或拒绝，愿意的话把答复记成规则。"
    }
   }
  },
  "watchAnOrganization": {
   "summary": "组织的委员会、绩效、报告和上报。",
   "steps": {
    "board": {
     "title": "委员会",
     "body": "要了解组织的情况，从这里开始。每个单元都显示根据最新报告得出的健康状况、未处理的上报、正在生效的刹车和最新报告，在组织图和表格中都能看到。"
    },
    "attention": {
     "title": "待处理",
     "body": "现在需要人来处理的事：未处理的上报、不健康的报告和达到预算上限的单元。先处理这个列表。"
    },
    "performance": {
     "title": "绩效",
     "body": "在你选择的时间段内比较各单元：运行、结果、成本、延迟和上报。经常上报或比其他单元花费更多的单元，就是需要关注的那个。"
    },
    "reports": {
     "title": "报告",
     "body": "运行和人员就现状提交的内容。提交后的报告不能修改，其文字作为数据显示，绝不当作指令。"
    },
    "escalations": {
     "title": "上报",
     "body": "智能体向某个人、某个角色或另一个智能体提出的问题。未处理的排在前面。在这里回答后，提问的智能体会收到你的答复。"
    }
   }
  }
 },
 "trail": {
  "entrySurfaces": {
   "Rest": "REST API",
   "Mcp": "MCP",
   "A2a": "A2A",
   "App": "应用",
   "Dashboard": "控制台",
   "Trigger": "触发器",
   "Keeper": "守护者",
   "Message": "消息",
   "Escalation": "上报",
   "Eval": "评估",
   "Shadow": "影子",
   "Internal": "内部"
  },
  "columns": {
   "entrySurface": "进入途径"
  },
  "drawer": {
   "fields": {
    "entrySurface": "进入途径"
   }
  },
  "edges": {
   "Shadowed": "影子复制",
   "Delivered": "送达"
  }
 },
 "learn": {
  "diagrams": {
   "brakes": {
    "boxes": {
     "killSwitch": {
      "body": "租户中的守护者都不会唤醒，消息也不会唤醒智能体。普通调用照常工作。"
     }
    }
   }
  },
  "glossary": {
   "killSwitch": {
    "def": "整个租户范围的自主运行冻结。守护者不会唤醒，消息也不会唤醒智能体，而普通调用照常工作。"
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
})(zhHans, {
 "components": {
  "turnActivity": {
   "worker": "正在等待工作节点",
   "approval": "正在等待批准",
   "tool": "正在运行 {{tool}}",
   "working": "正在处理下一步",
   "quiet": "已有 {{time}} 没有新输出。运行仍处于{{status}}状态。"
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
})(zhHans, {
 "resources": {
  "apps": {
   "steps": {
    "appearance": "外观"
   },
   "fields": {
    "appearance": "外观",
    "subtitle": "副标题",
    "welcomeTitle": "欢迎标题",
    "composerPlaceholder": "消息框占位文字",
    "agentDisplayName": "消息上显示的代理名称",
    "agentAvatarAssetId": "代理头像",
    "paletteId": "调色板",
    "themeDefault": "默认主题",
    "allowThemeSwitch": "允许用户切换浅色和深色",
    "cornerStyle": "圆角样式",
    "density": "密度",
    "showFilesPanel": "显示文件列表",
    "showLanguagePicker": "显示语言选择",
    "showPoweredBy": "显示平台署名",
    "starterPrompts": "开场问题"
   },
   "hints": {
    "subtitle": "页眉和欢迎屏幕中名称下方的一行短文字，最多 200 个字符。",
    "welcomeTitle": "第一条消息之前的标题。留空则显示显示名称，最多 120 个字符。",
    "composerPlaceholder": "空消息框中的灰色文字，最多 120 个字符。",
    "agentDisplayName": "回复显示的发送者。留空则显示显示名称，最多 80 个字符。",
    "agentAvatarAssetId": "每条回复中代理名称旁边的小圆形图片。",
    "starterPrompts": "新对话中最多显示 4 个按钮，点击即作为第一条消息发送。",
    "allowThemeSwitch": "关闭后会隐藏浅色深色按钮，并忽略之前保存的选择。"
   },
   "noAvatar": "无头像",
   "placeholders": {
    "subtitle": "例如：研究团队为你解答"
   }
  }
 },
 "enums": {
  "appThemeDefault": {
   "System": "跟随系统",
   "Light": "浅色",
   "Dark": "深色"
  },
  "appCornerStyle": {
   "Sharp": "方角",
   "Rounded": "圆角",
   "Pill": "胶囊形"
  },
  "appDensity": {
   "Compact": "紧凑",
   "Comfortable": "宽松"
  }
 },
 "components": {
  "appAppearance": {
   "sections": {
    "text": "文字",
    "images": "图片",
    "colors": "颜色",
    "layout": "主题和布局",
    "show": "页面显示的内容",
    "prompts": "开场问题",
    "preview": "预览"
   },
   "palettes": {
    "garrison": "Garrison 青绿",
    "slate": "石板",
    "ocean": "海洋",
    "forest": "森林",
    "sunset": "日落",
    "plum": "梅紫",
    "graphite": "石墨",
    "contrast": "高对比度",
    "custom": "自定义",
    "none": "内置颜色"
   },
   "paletteCurrent": "调色板：{{name}}",
   "resetColors": "使用内置颜色",
   "columns": {
    "role": "颜色",
    "light": "浅色",
    "dark": "深色"
   },
   "derived": "由浅色推算",
   "sameAsLight": "与浅色相同",
   "builtIn": "内置深色",
   "contrastWarning": "文字对比度 {{ratio}}:1，低于 AA 最低要求 4.5:1",
   "darkLabel": "{{field}}（深色主题）",
   "image": {
    "upload": "上传图片",
    "uploading": "正在上传...",
    "uploaded": "已上传为资产 {{name}}。",
    "notImage": "请选择图片文件：PNG、JPEG、GIF、WebP、SVG 或 ICO。",
    "assetDescription": "应用 {{app}} 的{{role}}，从应用编辑器上传。"
   },
   "prompts": {
    "count": "{{count}} / {{max}} 个问题",
    "chars": "{{count}}/{{max}} 个字符",
    "label": "开场问题 {{number}}",
    "placeholder": "例如：总结一下本周的更新",
    "empty": "还没有开场问题，用户将从空白消息框开始。",
    "keys": "在问题框中按 Alt+上 和 Alt+下 可移动它。",
    "add": "添加问题",
    "moveUp": "将问题 {{number}} 上移",
    "moveDown": "将问题 {{number}} 下移",
    "remove": "移除问题 {{number}}"
   },
   "preview": {
    "appName": "你的应用",
    "welcomeDefault": "提个问题就可以开始。",
    "light": "浅色",
    "dark": "深色",
    "you": "你",
    "question": "本周有什么变化？",
    "answer": "这是本周变化的简短摘要。",
    "placeholder": "输入消息",
    "poweredBy": "使用 Garrison Agent Studio 构建",
    "note": "随你的修改更新的应用页面草图。打开应用链接即可查看真实页面。"
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
})(zhHans, {
 "components": {
  "table": {
   "noneInDefaultView": "默认视图中没有内容。视图之外还有其他记录。",
   "showAll": "显示全部",
   "errorStatus": "状态 {{status}}。"
  }
 },
 "resources": {
  "runs": {
   "emptyAction": "调用代理"
  }
 },
 "views": {
  "organizationDetail": {
   "revisionLabel": "修订 {{number}}"
  }
 },
 "evals": {
  "setDetail": {
   "caseLabel": "用例 {{order}}"
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
})(zhHans, {
 "trail": {
  "moreLanes": "{{count}} 条泳道：横向滚动可查看全部",
  "moreSteps": "下方还有步骤：向下滚动",
  "narrowGraph": "图视图需要至少 768 像素宽的屏幕，因此这里用列表显示相同的步骤。",
  "narrowSequence": "序列视图需要至少 768 像素宽的屏幕，因此这里用列表显示相同的步骤。",
  "replyTo": "回复给 {{name}}",
  "replyToCaller": "回复给调用方",
  "replyFinished": "（根运行已结束）",
  "drawer": {
   "texts": {
    "reply": "调用方收到的回复"
   },
   "fields": {
    "caller": "调用方",
    "outcome": "结果",
    "exitCode": "退出码"
   },
   "failureTitle": "此步骤失败的原因",
   "noErrorMessage": "服务器没有为此运行记录错误消息。打开该运行查看对话记录和 stderr。",
   "replyNote": "{{name}} 在根运行结束时收到了此回复。列在其后的步骤继续进行，调用方无需等待。",
   "openReplyingRun": "打开根运行"
  }
 },
 "views": {
  "runDetail": {
   "failure": {
    "title": "此运行失败的原因",
    "titleOutcome": "此运行失败的原因：{{outcome}}",
    "errorEvent": "对话记录中的最后一个错误（事件 #{{sequence}}）",
    "serverError": "服务器记录的错误",
    "noError": "没有记录错误消息。对话记录和 stderr 可能有更多信息。",
    "exitCode": "Harness 以代码 {{code}} 退出。",
    "stderrLines_one": "Stderr 有 {{count}} 行。",
    "stderrLines_other": "Stderr 有 {{count}} 行。",
    "noStderr": "未捕获到 stderr。",
    "showError": "在对话记录中显示错误",
    "showStderr": "打开 Stderr",
    "openDeployment": "打开部署"
   },
   "templatesCount_one": "{{count}} 个模板",
   "templatesCount_other": "{{count}} 个模板",
   "telemetryToggle": "耗时、令牌和费用（{{duration}}，{{cost}}）",
   "resultRaw": "显示原始文本",
   "resultFormatted": "显示格式化内容"
  }
 },
 "resources": {
  "runs": {
   "columns": {
    "callerName": "调用方"
   },
   "hops": {
    "message": "消息跳转",
    "fanOut": "扇出成员",
    "child": "子运行"
   },
   "callerMessage": "一条消息"
  }
 },
 "tours": {
  "sample": {
   "needs": {
    "trails": "经过多个智能体的请求"
   },
   "trailsLater": "轨迹步骤需要一个经过多个智能体的请求。在此示例中，延迟守护者会在应用后几秒的第一次运行时给依赖守护者发送消息。"
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
})(zhHans, {
 "components": {
  "orgDesigner": {
   "node": {
    "moreMembers_one": "还有 {{count}} 个",
    "moreMembers_other": "还有 {{count}} 个"
   },
   "collapse": {
    "label": "树状视图",
    "expand_one": "显示下面 {{count}} 个单元",
    "expand_other": "显示下面 {{count}} 个单元",
    "collapse_one": "隐藏下面 {{count}} 个单元",
    "collapse_other": "隐藏下面 {{count}} 个单元",
    "expandAll": "全部展开",
    "collapseAll": "折叠到两层",
    "hidden_one": "已隐藏 {{count}} 个单元",
    "hidden_other": "已隐藏 {{count}} 个单元"
   },
   "keys": {
    "collapse": "减号 (-) 折叠获得焦点的单元，加号 (+) 展开它。"
   },
   "outlineUnits_one": "用文字描述 {{count}} 个单元",
   "outlineUnits_other": "用文字描述全部 {{count}} 个单元",
   "problems": {
    "OneRootMissing": "请添加根单元。组织需要一个没有上级的单元才能发布。",
    "titleEmpty": "检查",
    "noUnits": "还没有单元。用上方的“添加单元”添加根单元，再添加它下面的单元。有了单元后检查就会运行。"
   },
   "editAll": "编辑所有字段"
  }
 },
 "board": {
  "chart": {
   "needsPerson": "需要人处理",
   "noReport": "没有报告"
  },
  "attention": {
   "reports_one": "{{count}} 份降级或不健康的报告",
   "reports_other": "{{count}} 份降级或不健康的报告",
   "repeated_one": "问了 {{count}} 次",
   "repeated_other": "问了 {{count}} 次"
  }
 },
 "organizations": {
  "chart": {
   "below_one": "下面有 {{count}} 个单元",
   "below_other": "下面有 {{count}} 个单元",
   "showMore_one": "再显示 {{count}} 个（还有 {{total}} 个未显示）",
   "showMore_other": "再显示 {{count}} 个（还有 {{total}} 个未显示）",
   "toolsLabel": "组织图视图",
   "expandAll": "全部展开",
   "collapseAll": "折叠到两层"
  }
 },
 "views": {
  "organizationDetail": {
   "editOnDesign": "在“设计”标签页中编辑",
   "chartReadOnlyNote": "以组织图显示工作树，仅供查看。单元的添加、修改和移除在“设计”标签页中进行。",
   "noUnitsBodyDesign": "在“设计”标签页中添加根单元，由最上层的代理领导，再添加它下面的单元。",
   "publishChecks": "检查",
   "publishChecksSummary": "错误：{{errors}}。警告：{{warnings}}。有错误时无法发布，只有警告时可以发布。"
  }
 },
 "resources": {
  "keepers": {
   "sectionHints": {
    "budgets": "两项美元预算都会执行。没有余额的巡检会被拒绝，当天预算用完后守护者会暂停到下一个 UTC 日，并向你升级。每次巡检的最多 token 数会保存，但尚未执行。"
   },
   "hints": {
    "budgetPerTickUsd": "会执行。每次巡检只能花费剩余的额度，没有剩余时会被拒绝。留空表示不设上限。",
    "budgetPerDayUsd": "会执行。当天预算用完后，守护者会变为“已达预算上限”直到下一个 UTC 日，并发起紧急升级。留空表示不设上限。",
    "maxTokensPerTick": "输入加输出 token。会保存并校验，但尚未执行。留空表示不设上限。"
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
})(zhHans, {
 "views": {
  "organizationDetail": {
   "addUnitFull": "填写全部字段添加单元"
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
})(zhHans, {
 "components": {
  "studio": {
   "canvas": {
    "org": {
     "orgHint": "选择一个单元即可编辑它的成员和同级连线。单元位于它所汇报的单元下方，以连线相连。"
    }
   }
  }
 }
});
