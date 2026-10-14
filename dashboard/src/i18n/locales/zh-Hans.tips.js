// Simplified Chinese tooltip (tips.*) and relationship explainer (explainers.*) text. Merged into zh-Hans.js. Mirrors en.tips.js key for key.

const TELEMETRY = {
  approvalWaitMs: '审批等待：此运行等待由人员或超时决定的权限审批所花费的总时间。由规则或部署默认设置立即决定的调用不计入。由服务器测量；运行从未等待时显示为 n/a。',
  delegationWaitMs: '委派等待时间：此运行等待其通过 Garrison 启动的子运行（即它委派的其他智能体）的时长，根据这些子运行的服务器时间戳计算。如果运行没有委派任何内容，则为零或不适用。',
  timeToFirstTokenExcludingDelegationMs: '首 Token 时间（不含委派）：首 Token 时间减去运行在首次输出前等待委派运行的时间。用它来公平比较会委派和不委派的智能体。基于服务器时间戳计算，绝不为负。',
  timeToFirstTokenMs: '首个 Token 时间：从工作节点启动 Harness 进程开始，到模型产生第一个输出（文本或思考）为止。其中包含 Harness 的启动时间，因此 CLI 启动缓慢会体现在这里。由工作节点使用单调时钟测量。',
  streamingMs: '流式输出时间：从模型的第一个输出到最后一个输出。这是模型实际生成输出的时长。由工作节点使用单调时钟测量。',
  executionMs: '执行时间：由工作节点测量的从 Harness 进程启动到进程退出的时长。不上报此值的旧版服务器会改用开始和完成时间戳计算。',
  queueMs: '排队时间：运行从进入队列到被工作节点租用之间等待的时长。数值偏高说明所有符合条件的节点都在忙，或者没有节点符合调度放置规则。由服务器测量。',
  totalMs: '总时间：从进入队列到完成，即排队时间加上执行时间再加上结果上报时间。由服务器测量。',
  outputTokensPerSecond: '每秒输出 Token 数：输出 Token 数除以流式输出时间。仅当流式输出持续至少 100 ms 时才显示，因为更短的时间窗口得出的速率没有意义。',
  inputTokens: 'Harness 上报的整个运行的输入 Token 数，包括系统提示词、工具结果以及多轮对话的历史记录。',
  outputTokens: '模型在本次运行的所有轮次中生成的输出 Token 数，由 Harness 解析器上报。',
  cachedTokens: '由提供商提示词缓存提供的输入 Token。缓存 Token 的计费通常更低，因此这里占比越高，成本越低。',
  reasoningTokens: '推理或思考 Token，前提是 Harness 单独上报它们（例如 Codex 的推理输出）。如果 Harness 不单独列出，则为零。',
  toolCallCount: '本次运行中的工具调用事件数：包括 MCP 工具、Harness 内置工具以及对其他 Garrison 智能体的调用。由工作节点根据事件流统计。',
  costUsd: 'Harness 上报的成本（美元）。如果是 Garrison 根据 Token 数计算得出，而不是由 Harness 上报，则会标记为估算值。',
  firstTokenUtc: '本次运行中第一个模型输出事件的实际时间（UTC，按你的时区显示）。',
  lastTokenUtc: '本次运行中最后一个模型输出事件的实际时间（UTC，按你的时区显示）。'
};

const FILE_ITEMS = {
  baseDirectory: '路径相对于哪个目录：运行配置目录、工作区，或运行的 HOME 目录。',
  pathTemplate: '启动前要写入的文件的相对路径。可以使用模板，例如 settings/{{run.id}}.json。',
  contentTemplate: '渲染为文件内容的模板。可以引用变量，也可以用 {{secret.alias}} 引用已绑定的机密。',
  condition: '模板表达式；渲染结果为空或 false 时不写入该文件。',
  mode: '八进制的 Unix 文件权限，例如保存凭据的文件可用 0600。',
  isSecret: '将渲染后的内容视为机密：永不写入日志，并在编译预览中被遮盖。'
};

const tips = {
  approvals: {
    awaiting_one: 'Harness 在工具调用前发出询问，正在等待人员处理。打开“审批”标签页来允许或拒绝（{{count}} 个待处理）。',
    awaiting_other: 'Harness 在工具调用前发出询问，正在等待人员处理。打开“审批”标签页来允许或拒绝（{{count}} 个待处理）。',
    decide: {
      decision: '选择 Harness 是否可以进行此工具调用。提交后运行会立即继续。',
      allow: '让 Harness 进行此工具调用。运行将带着该调用继续。',
      deny: '拒绝此工具调用。Harness 会收到拒绝消息，并在不进行该调用的情况下继续。',
      reason: '可选备注，随决定一起保存并写入审计日志。拒绝时会转交给智能体。',
      remember: '同时向此审批所属的部署添加一条规则，下次同类调用将自动决定。',
      rulePattern: '要添加的规则，使用 Claude Code 规则语法。初始值为建议的规则；保存前可放宽或收窄。',
      submitAllow: '立即允许此工具调用。该决定为最终决定，之后无法更改。',
      submitDeny: '立即拒绝此工具调用。该决定为最终决定，之后无法更改。'
    }
  },
  approvalCheck: {
    toolName: 'Harness 报告的工具名称，例如 Bash、Edit、WebFetch，或 mcp__github__create_issue 这样的 MCP 工具。',
    inputs: {
      command: '要测试的 Shell 命令，例如 npm run build && npm test。每个子命令都必须被允许。',
      url: '工具将要获取的 URL。WebFetch 规则按其域名匹配。',
      query: '该工具在此次调用中将要发送出去的那条搜索查询内容。',
      file_path: '工具将要读取或更改的文件路径，可以是相对于工作区的路径或绝对路径。',
      notebook_path: '该工具在此次调用中将要更改的 Notebook 文件的路径。',
      pattern: '该工具在此次调用中将要使用的 glob 模式或搜索模式。'
    },
    run: '针对此工具调用评估部署已保存的规则并显示结果。不会记录任何内容，也不会影响任何运行。',
    suggestedRule: '“记住”会为此调用添加的规则。将其复制到上方的规则中，即可覆盖类似的调用。'
  },
  ids: { deleted: '此记录已删除。ID {{id}}。复制按钮会复制此 ID。', named: 'ID {{id}}。使用复制按钮复制此 ID，用于 API、SDK 或支持请求。' },
  markdown: {
    column: '智能体输出中表格的 {{name}} 列。较宽的表格可在其框内横向滚动。',
    showRaw: '显示智能体返回的原始文本，不带 Markdown 格式，便于检查或复制。',
    showRendered: '重新以 Markdown 格式显示文本，包括表格、列表、代码块和链接。',
    copy: '将原始结果文本（包括 Markdown 语法）复制到剪贴板。',
    link: '在新标签页中打开 {{href}}。该链接来自智能体的输出，请先核对地址再信任它。'
  },
  common: {
    fields: {
      name: '此记录在租户内的唯一名称。其他记录和清单通过这个名称引用它。',
      description: '写给人看的自由文本备注，说明这条记录的用途，运行时不会使用。',
      active: '未启用的记录会保留但被忽略。关闭此项即可暂停某项内容而无需删除。',
      id: '系统生成的标识符，带有类型前缀。可在 API 调用和脚本中使用，它永远不会改变。',
      createdUtc: '此记录的创建时间。将鼠标悬停在值上可查看确切的日期和时间。',
      lastUpdateUtc: '此记录最后一次修改的时间。',
      isBuiltIn: '内置记录随 Garrison 一起提供，为只读。自定义记录是在此租户中创建的，可以编辑。',
      expiresUtc: '超过此时间后记录将失效。留空表示永不过期。'
    }
  },
  explainer: {
    reopen: '再次显示 {{topic}} 的说明：此页面管理什么，以及它与 Garrison 其他部分的关系。',
    dismiss: '隐藏此说明。原位置会保留一个小的“关于”按钮，你可以随时重新打开。'
  },
  nav: {
    approvalsBadge_one: '{{count}} 个工具调用正在等待人员允许或拒绝。打开“审批”进行决定。',
    approvalsBadge_other: '{{count}} 个工具调用正在等待人员允许或拒绝。打开“审批”进行决定。',
    hubs: {
      approvals: '审批收件箱：智能体请求进行且正在等待人员处理的工具调用，以及按规则、默认设置、人员或超时做出的每项决定的历史记录。',
      home: '从这里开始：智能体、运行和工作节点的实时计数、API 流量、近期失败，以及常用任务的快捷入口。',
      invoke: '直接在浏览器中向智能体发送消息，并实时查看对话记录，无需编写任何代码。',
      runs: '每一次智能体调用及其对话记录、结果和遥测数据，以及等待节点的工作队列。',
      analytics: '按时间展示运行速度、Token 用量、成本、结果和工具调用的图表，可按智能体、Harness 和部署筛选。',
      agents: '调用方按名称调用的智能体，以及决定每个智能体实际如何运行的部署。',
      configuration: '部署所使用的构建模块：Harness 配置文件、提示词模板、MCP 服务器、机密、工作区、制品存储和清单。',
      fleet: '提供 API 并调度运行的控制平面副本、执行运行的工作节点，以及为调度放置而对工作节点分组的节点池。',
      access: '谁可以登录以及能做什么：租户、用户、访问密钥、角色和角色分配。',
      monitoring: '调查发生了什么：捕获的 API 请求、安全审计记录，以及实时的 API 浏览器。',
      system: '服务器设置，以及当前所连接服务器的端点、版本和身份。'
    },
    tabs: {
      runs: '搜索、筛选并检查单个运行。打开某个运行可阅读其对话记录、结果和遥测数据，也可以取消或重试。',
      queue: '正在等待节点、已被租用或正在运行的运行，按智能体和 Harness 分组。',
      agents: '调用方通过 REST、MCP 或 A2A 调用的具名智能体。智能体代表身份；它的部署决定它如何运行。',
      deployments: '每个智能体的运行方式：Harness 配置文件、模型、提示词、MCP 服务器、机密、工作区、调度放置、限制和流量权重。',
      harnessProfiles: '以无头模式启动 CLI Harness 的配方：可执行文件、参数、环境变量、文件和输出解析。',
      promptTemplates: 'Garrison 发送给 Harness 的所有提示词和生成的配置文件，带版本管理和实时预览。',
      mcpServers: '智能体可以使用的工具服务器。先在这里注册，再绑定到部署。',
      secrets: '加密存储的 API 密钥和令牌。部署按别名绑定它们；值保存后不会再次显示。',
      workspaces: '运行工作目录的模板：空目录、从 Git 克隆，或预置文件。',
      artifactStores: '保存运行所产生文件的目的地，用于在运行结束后保留这些文件。',
      modelPrices: "在执行器未报告费用时，使用操作员配置的美元费率进行估算。已报告费用（包括零）优先。",
      usageQuotas: "租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。",
      manifests: '以 YAML 形式应用或导出整个租户的配置，便于纳入源代码管理。',
      nodes: '拉取运行并执行 Harness 的工作机器或 Pod。可在这里封锁、排空或检查它们。',
      controlNodes: '提供 REST、MCP 和 A2A 并调度运行的服务器副本（控制节点）。其中一个是领导者，负责集群维护。只读显示状态、版本和活动。',
      nodePools: '具名的节点分组，可选择为特定租户保留。部署可以要求使用某个节点池。',
      tenants: '此服务器上相互隔离的组织，各自拥有自己的用户、智能体、机密和运行。',
      users: '使用电子邮件和密码登录的人员。每个用户都可以拥有访问密钥。',
      credentials: '供脚本、SDK 和服务使用的访问密钥。每个密钥属于一个用户，其权限不超过该用户的权限。',
      roles: '具名的权限集合，以及权限本身。分配角色即可授予访问权限。',
      assignments: '将角色授予用户或访问密钥的授权，范围可以是整个租户或单个资源。',
      requests: '此服务器捕获的 API 请求，包括请求头、请求体、耗时和状态，用于调试集成。',
      audit: '安全和配置事件：登录、拒绝访问、机密变更、清单应用以及节点变更。',
      explorer: '从服务器的 OpenAPI 文档中选择任意 API 操作，填写参数并实时执行。',
      settings: '服务器和集群设置，显示其来源，以及修改后是实时生效还是需要重启。',
      serverInfo: 'REST、MCP 和 A2A 地址，服务器和控制台版本，以及你当前登录所用的身份。',
      conversations: '与智能体的多轮对话：每一轮都是一次运行，会恢复上一轮的会话。打开一个对话即可阅读各轮并发送下一条消息。'
    },
    subtabs: {
      roles: '角色把权限归入一个名称下，例如 Operator 或 Invoker。给某人分配一个角色，即授予其该角色的全部权限。',
      permissions: '允许或拒绝对资源类型执行操作的单条规则。角色由这些规则组成；拒绝始终优先。',
      userAssignments: '为使用电子邮件和密码登录的人员授予角色。',
      credentialAssignments: '为自动化使用的访问密钥授予角色。密钥的权限应比其所有者更窄。'
    },
    setup: '打开设置向导：保存一个 Harness 凭据，应用一个示例智能体，并运行一次以确认一切正常。',
    tour: '重新播放简短的引导教程，介绍导航、上下文以及配置所在的位置。',
    skipToContent: '跳过导航，直接进入此页面的主要内容。主要供键盘用户使用。'
  },
  topbar: {
    toggleSidebar: '折叠或展开导航侧边栏。在小屏幕上，导航会以浮层方式打开。',
    server: '此控制台连接的 Garrison 服务器：{{url}}。圆点表示其健康检查是否通过。',
    health: {
      healthy: '服务器在过去 30 秒内响应了健康检查。',
      unhealthy: '服务器没有响应健康检查。此页面发出的请求很可能会失败。',
      unknown: '正在等待服务器返回第一个健康检查结果。'
    },
    copyServer: '复制服务器 URL，例如用于配置 SDK 或 curl 命令。',
    switchTenant: '系统管理员可以查看任意租户。每个页面都显示所选租户的数据。',
    tenant: '你正在租户 {{tenant}} 中工作。你看到的每条记录和每个运行都属于该租户。',
    principal: '你当前以 {{name}} 的身份登录。你执行的操作都会记录在此身份下。',
    role: '你在此租户中的最高访问级别。它决定了哪些页面和操作可用。',
    liveOn: '已通过 WebSocket 连接到服务器，运行和节点的变化会实时显示。',
    liveOff: '没有实时连接。页面会改为按各自的计时器刷新，因此变化可能需要几秒钟才会显示。',
    github: '在新标签页中打开 GitHub 上的 Garrison 源代码仓库，查看文档和问题。',
    themeLight: '切换到浅色主题。此浏览器会记住你的选择。',
    themeDark: '切换到深色主题。此浏览器会记住你的选择。',
    logout: '退出登录并撤销此浏览器会话。之后需要重新登录。',
    language: '更改显示语言。日期和数字格式也会随语言变化，并且会记住你的选择。'
  },
  login: {
    passwordTab: '以人员身份使用租户、电子邮件和密码登录。',
    keyTab: '使用访问密钥和私密密钥登录，与脚本和 SDK 使用的密钥对相同。',
    serverUrl: 'Garrison REST API 的基础地址，例如端口转发到 127.0.0.1:8700 的服务器。',
    tenantId: '你的账户所属的租户。本地默认租户名为 default。',
    email: '你在此租户中的用户账户的电子邮件地址。',
    password: '你的账户密码。它只会发送一次用于获取会话令牌，浏览器应用不会保存它。',
    accessKey: '访问密钥的公开部分，以 access_ 开头。可在“访问控制 > 访问密钥”下创建密钥。',
    secretKey: '访问密钥的私密部分。它仅在创建或轮换密钥时显示过一次。',
    submit: '向服务器验证凭据，并打开你所在租户的控制台。'
  },
  table: {
    selectAll: '选中或取消选中此页的所有行，例如用于一起删除。',
    selectRow: '选中此行以执行批量操作，例如删除。',
    sortServer: '{{tip}} 点击可按此列对整个列表排序；再次点击可反转顺序。',
    sortPageOnly: '{{tip}} 点击仅对本页的行排序；服务器无法按此列排序。',
    clearSelection: '取消选中所有已选行，不做任何更改。',
    pageSize: '每页加载的行数。页面越大，加载越慢。每个表格会分别记住你的选择。',
    first: '转到结果的第一页。',
    prev: '返回结果的上一页。',
    jump: '输入 1 到 {{total}} 之间的页码并按 Enter，直接跳转到该页。',
    next: '前进到结果的下一页。',
    last: '转到结果的最后一页。',
    refresh: '立即从服务器重新加载此列表，保留当前页码、筛选条件和排序。',
    autoRefresh: '按计时器自动重新加载此数据。关闭后数据保持不变，方便阅读。',
    selectColumns: '选择表格显示哪些列。此浏览器会为每个表格分别记住你的选择。',
    columnPinned: '{{column}} 始终显示，因为没有它就无法识别各行。',
    columnToggle: '显示或隐藏 {{column}} 列。{{tip}}',
    actionsFor: '打开 {{name}} 的操作：查看、编辑、复制一份、查看 JSON、删除，以及该记录特有的操作。',
    actionsMenu: '打开此行可用的操作。',
    actionsColumn: '每行的操作。点击三个点可查看、编辑、复制一份、检查 JSON 或删除。',
    search: '输入名称的一部分来缩小列表范围。停止输入后会在服务器端执行搜索。',
    clearFilters: '清除搜索文本和所有筛选条件，重新显示完整列表。',
    bulkDelete: '删除所有已选行。系统会先请你确认。'
  },
  filters: {
    decisionSource: '仅显示以某种方式决定的审批：规则、部署默认设置、人员、超时或运行停止。',
    runId: '仅显示某个运行的审批。粘贴运行 ID（如 run_...）；停止输入后列表会更新。',
    status: '只显示处于此状态的记录。选择“全部”可取消筛选。',
    harnessType: '只显示某一种 Harness 的记录，例如 Claude Code 或 Codex。',
    kind: '只显示某一类记录。选择“全部”可取消筛选。',
    eventType: '只显示某一类型的审计事件，例如登录失败或机密变更。',
    fromUtc: '只显示在此时间或之后创建的记录（你的本地时区）。',
    toUtc: '只显示在此时间之前创建的记录（你的本地时区）。',
    method: '只显示使用此 HTTP 方法的请求。',
    statusCode: '只显示返回此 HTTP 状态码的请求，例如 404 或 500。',
    pathContains: '只显示路径包含此文本的请求，例如 /agents。',
    tenantId: '只显示在此租户中发出的请求。留空表示所有租户。',
    apply: '使用上面的筛选值执行搜索。',
    clear: '将上面的所有筛选条件重置为空并重新搜索。',
    agentId: '只显示属于某个智能体的记录。选择“全部”可移除此筛选。'
  },
  form: {
    option: '在 {{field}} 中包含 {{option}}。选中的选项会被保存；未选中的会被排除。',
    reveal: '以明文显示输入的值，便于保存前检查。',
    hide: '重新遮盖该值，防止旁人看到你的屏幕内容。',
    key: '{{field}} 中此条目的键。键在列表中必须唯一。',
    value: '{{field}} 中此条目的值。在注明的地方可以使用模板和机密引用。',
    removeRow: '从列表中移除此条目。在点击“保存”之前不会保存任何内容。',
    addRow: '向 {{field}} 添加一个空的键值条目。',
    moveUp: '将此项向前移动一位。这里的顺序很重要，例如参数列表。',
    moveDown: '将此项向后移动一位。这里的顺序很重要，例如参数列表。',
    removeItem: '从列表中移除此项。在点击“保存”之前不会保存任何内容。',
    addItem: '向 {{field}} 添加一个新的空项，并填写其字段。'
  },
  actions: {
    openDetail: '打开此记录的完整详情页。',
    view: '以只读方式打开此记录，查看所有字段，不会有误改的风险。',
    edit: '在表单中打开此记录进行修改。点击“保存”后更改才会生效。',
    duplicate: '以此记录的值预填一条新记录，名称带 -copy 后缀。保存之前不会创建任何内容。',
    viewJson: '显示 API 返回的原始 JSON，用于调试或复制到脚本中。',
    delete: '永久删除此记录。系统会请你确认，且无法撤销。',
    add: '在表单中创建此类型的新记录。',
    switchToEdit: '将此只读视图切换为可编辑表单。',
    retryLoad: '再次尝试从服务器加载此数据。'
  },
  modal: {
    close: '关闭此窗口。服务器上的内容不会改变。',
    dismiss: '不保存并关闭此窗口。也可以按 Escape 键。',
    cancelForm: '关闭表单并放弃未保存的更改。',
    back: '返回表单的上一步。已输入的值会保留。',
    next: '前往表单的下一步。在点击“保存”之前不会保存任何内容。',
    saveEdit: '保存对此记录的更改。服务器会进行验证，并指出需要处理的字段。',
    saveCreate: '使用这些值创建记录。服务器会进行验证，并指出需要处理的字段。',
    saveValue: '将该值发送到服务器。它在到达时即被加密，之后不会再显示。'
  },
  confirm: {
    delete: '是的，永久删除此记录。',
    bulkDelete: '是的，永久删除所有已选记录。',
    cancel: '返回，不执行任何操作。',
    danger: '执行此破坏性操作。此操作无法撤销。',
    confirm: '执行上面描述的操作。'
  },
  copy: {
    id: '将记录 ID 复制到剪贴板，供 REST API、SDK 或筛选器使用。',
    value: '将此值复制到剪贴板。',
    block: '将整个代码块复制到剪贴板，可直接粘贴到终端或文件中。',
    done: '已复制到剪贴板。'
  },
  chart: {
    ranges: {
      hour: '显示最近 60 分钟，每个区间为一分钟。',
      day: '显示最近 24 小时。区间大小会自动调整，以保持图表清晰易读。',
      week: '显示最近 7 天。区间大小会自动调整，以保持图表清晰易读。',
      month: '显示最近 30 天。区间大小会自动调整，以保持图表清晰易读。',
      custom: '自行选择开始和结束时间。时间范围过长会被服务器拒绝。'
    },
    refresh: '立即从服务器重新加载图表数据。',
    tenant: '显示单个租户或服务器上所有租户的请求活动。'
  },
  badges: {
    approvalsOn_one: '审批已开启：Harness 会在工具调用前询问，{{count}} 条规则会自动决定其中一部分。',
    approvalsOn_other: '审批已开启：Harness 会在工具调用前询问，{{count}} 条规则会自动决定其中一部分。',
    approvalsOff: '审批已关闭：Harness 按其自身的权限设置进行工具调用，不会询问。',
    active: '启用：此记录正在使用中。',
    inactive: '停用：此记录会保留，但在重新启用之前会被忽略。',
    builtIn: '内置：随 Garrison 一起提供，为只读。克隆它即可得到一个可编辑的版本。',
    custom: '自定义：在此租户中创建，因此可以编辑和删除。',
    systemAdmin: '系统管理员：可以管理所有租户，并绕过授权检查。',
    tenantAdmin: '租户管理员：可以管理此租户内的一切。',
    user: '用户：访问权限仅来自角色分配。',
    role: '此分配授予 {{role}} 角色及其中的所有权限。',
    deploymentActive: '启用：此部署会接收该智能体流量中属于它的份额。',
    deploymentInactive: '停用：此部署不接收流量，但调用时仍可显式指定它。'
  },
  permissions: {
    source: '此授权来自的角色。要调整访问权限，请修改该角色或授予该角色的分配。',
    type: '“允许”授予这些操作；“拒绝”会阻止这些操作，即使其他角色允许它们。',
    resources: '此授权涵盖的记录类型，例如 Agent 或 Run。',
    operations: '可以对这些记录执行的操作，例如 Read、Create 或 Execute。',
    scope: '租户范围涵盖该类型的所有记录；资源范围只涵盖某一条特定记录。'
  },
  compilePreview: {
    input: '用于编译的示例调用方消息。它会成为任务模板中的 {{input.message}}。',
    compile: '完全按照运行时的方式编译此部署，但不启动运行，并显示命令行、文件和环境变量。'
  },
  secretOnce: {
    accessKey: '公开的访问密钥 ID。它用于标识该访问密钥，可以安全地存放在配置中。',
    secretKey: '私密密钥。这是它唯一一次显示；请立即将其复制到你的密码管理器或机密存储中。',
    done: '关闭此窗口。私密密钥之后无法找回，只能轮换。'
  },
  wizard: {
    skip: '关闭向导，并且不再为此租户提供它。你可以从侧边栏重新打开。',
    back: '返回向导的上一步。',
    start: '开始设置：添加一个凭据，应用一个示例智能体，并进行测试。',
    saveSecret: '将凭据加密保存在此租户中，并进入下一步。',
    skipStep: '不添加凭据，直接继续。示例智能体不需要凭据。',
    apply: '根据上面显示的清单创建示例智能体和部署。',
    invoke: '用你的消息启动示例智能体的一次运行，并打开其详情页。',
    secretName: '所保存凭据的名称。部署在绑定它时通过这个名称引用。',
    manifest: 'YAML 格式的示例清单。应用前可以编辑，例如重命名智能体。',
    message: '要发送给示例智能体的消息。模拟 Harness 会原样返回它。'
  },
  tour: {
    skip: '立即结束引导教程。你可以从侧边栏重新播放。',
    back: '显示引导教程的上一步。',
    next: '前往引导教程的下一步。',
    done: '完成引导教程。你可以从侧边栏重新播放。'
  },
  telemetry: {
    ...TELEMETRY,
    panel: '此运行各阶段的耗时以及资源消耗。时长来自各字段说明中所述的工作节点和服务器时钟。',
    phases: '运行的时间花在了哪里，从左到右依次为：在队列中等待、从 Harness 启动到首个 Token、流式输出，以及其余的执行时间。',
    phase: {
      delegation: '在模型首次输出之前，运行等待其委派的子运行的时间。这不是 Harness 启动时间。',
      queue: '在队列中等待工作节点租用该运行。',
      startup: '从进程启动到模型首次输出，包括 Harness 启动和第一次模型请求。',
      streaming: '从模型第一次输出到最后一次输出。',
      tail: '模型最后一次输出之后的执行：工具调用、结果处理和进程退出。'
    }
  },
  blocked: {
    panel: '此运行为何仍在排队，以及需要改什么才能让工作节点接手。',
    openFleet: '打开机群页面，查看哪些工作节点已就绪、每个节点报告了哪些 Harness，以及探测详情。',
    openAgent: '打开此运行的智能体，检查它的部署，包括每个部署的节点池和节点选择器。',
    homeBanner: '目前没有就绪的工作节点能运行的排队运行。它们会一直排队，直到出现可用的工作节点；如果设置了 Runtime.FailBlockedAfterSeconds，超时后会失败。',
    showRuns: '打开按排队状态筛选的运行页面。被阻塞的运行带有说明原因的警告徽章。',
    queueColumn: '此分组中目前没有就绪工作节点能运行的排队运行。将鼠标悬停在徽章上可查看原因和处理方法。'
  },
  enums: {
    approvalStatus: {
      Pending: '正在等待人员允许或拒绝。在此之前，Harness 会在此调用上阻塞。',
      Approved: '该工具调用已被允许，决定来自规则、部署默认设置、人员或超时。',
      Denied: '该工具调用已被拒绝。Harness 收到了拒绝消息，并在不进行该调用的情况下继续。',
      Expired: '没有人在规定时间内做出决定，因此采用了部署设置的超时决定。',
      Cancelled: '审批待处理期间运行已停止，因此审批在没有决定的情况下关闭。'
    },
    approvalDecision: {
      Allow: '允许：Harness 已获得许可，可以进行这一次工具调用。',
      Deny: '拒绝：Harness 的请求被拒绝，并且被告知了原因。'
    },
    approvalSource: {
      Rule: '由部署上配置的规则立即决定。匹配到的规则会显示在旁边。',
      Default: '没有任何规则与之匹配，因此由部署设置的默认操作来决定。',
      User: '由人员在仪表板中、通过 API 或通过 MCP 决定。',
      Timeout: '在审批过期之前没有人做出决定，因此采用了部署设置的超时决定。',
      Cancelled: '在此审批仍处于等待状态时，发出请求的运行已经停止。'
    },
    approvalRuleAction: {
      Allow: '允许：与规则匹配的工具调用无需询问任何人即可直接进行。',
      Deny: '拒绝：匹配的工具调用会被拒绝，无需询问任何人。拒绝优先于其他所有规则。',
      Ask: '询问人员：匹配的工具调用会在审批收件箱中等待决定。'
    },
    approvalKind: {
      Tool: 'Claude Code 针对任意工具（包括 MCP 工具）发出的权限提示。',
      Command: 'Codex app-server 运行想要执行的 Shell 命令。规则将其按 Bash 评估。',
      FileChange: 'Codex app-server 运行想要进行的文件更改。规则将其按 Edit 评估。'
    },
    runBlockedReason: {
      NoReadyWorker: '已阻塞：没有任何工作节点处于就绪状态，因此没有节点能接手此运行。请启动或注册一个工作节点，然后在机群页面检查丢失、离线、排空中或已封锁的节点。',
      NoCapableWorker: '已阻塞：有就绪的工作节点，但没有节点报告此运行的 Harness 可用。请启动或注册一个已安装该 Harness 的工作节点，或在机群页面检查它的凭据和探测结果。',
      NoMatchingPool: '已阻塞：有就绪的工作节点能运行此 Harness，但没有节点符合部署的节点池、节点池的租户限制或节点选择器。请检查部署的调度放置，或向该节点池添加工作节点。'
    },
    runStatus: {
      Pending: '待处理：运行已被接受，正在准备加入队列。',
      Queued: '已排队：等待具有匹配 Harness 和调度放置条件的工作节点来租用它。',
      Leased: '已租用：某个工作节点已认领该运行，正在准备工作区。',
      Running: '运行中：Harness 进程正在工作节点上执行。',
      Cancelling: '取消中：已请求停止，工作节点正在关闭 Harness。',
      Succeeded: '成功：Harness 已完成并产生了有效结果。',
      Failed: '失败：运行以错误结束。结果列会说明原因。',
      Cancelled: '已取消：有人在运行完成前将其停止。',
      TimedOut: '已超时：运行达到截止时间并被停止。',
      Rejected: '已拒绝：运行无法启动，例如因为没有已启用的部署。'
    },
    runOutcome: {
      None: '运行尚未结束，因此还没有结果。',
      Succeeded: 'Harness 已完成，其结果通过了验证。',
      HarnessFailed: 'Harness 报告了失败，或在没有可用结果的情况下退出。请检查 stderr 和对话记录。',
      NotInstalled: '在工作节点上找不到 Harness 可执行文件。',
      NotCredentialed: 'Harness 没有可用的凭据。请为部署绑定一个机密。',
      McpPreflightFailed: '工作节点在启动前检查时，某个必需的 MCP 服务器或工具无法访问。',
      NodeLost: '工作节点在持有该运行期间停止了心跳。',
      OutputLimitExceeded: '运行产生的输出过多：回答超过了部署的最大助手字符数（一种运行防护），或者 Harness 写出的内容超过了 Harness 配置文件允许的量。已保留到目前为止的输出。',
      SchemaValidationFailed: '结果不符合智能体的输出 JSON Schema：经过一次修复尝试后，或在 Harness 无法恢复会话时立即失败。',
      TimedOut: '运行达到了截止时间。',
      Cancelled: '运行已按请求取消。',
      StaleLease: '工作节点在失去租约后才回报，因此其结果被忽略。',
      CompileFailed: '无法编译部署，例如因为缺少模板变量。',
      WorkspaceFailed: '无法准备工作区，例如因为 Git 克隆失败。',
      Rejected: '请求在运行启动前被拒绝。',
      InternalError: 'Garrison 遇到内部错误。服务器日志中有详细信息。',
      NoCapableWorker: '该运行在队列中等待的时间超过了集群设置 Runtime.FailBlockedAfterSeconds 允许的时长，且没有就绪的工作节点能运行它，因此已失败。',
      RepetitionDetected: '运行防护停止了运行，因为它的回答退化成了反复出现的同一段短文本，或者只有空白和标点。已保留到目前为止的输出。可以用部署的重复防护进行调整。',
      NoProgress: '运行防护停止了运行，因为超过部署的无进展超时时间仍没有文本、思考或工具活动。已保留到目前为止的输出。',
      PodFailed: '运行 Pod 在 harness 之外失败：无法调度、无法拉取镜像、内存不足、被驱逐，或未报告就结束。错误消息会说明原因。',
      ConversationStateLost: '本应恢复这一轮对话的节点已不再保存对话的目录。Garrison 会将这样的一轮重新排队一次以回退方式运行；只有无法这样做时才会保留此结果。'
    },
    controlNodeStatus: {
      Starting: '启动中：副本正在初始化，尚未处理流量。',
      Ready: '就绪：副本正在发送心跳，并处理 REST、MCP 和 A2A 请求。',
      Draining: '排空中：已开始关闭。就绪检查返回 503，其流和长轮询正在结束。',
      Offline: '离线：副本已正常停止，或者 30 秒没有心跳而被领导者标记。离线行会在 24 小时后删除。'
    },
    backplane: {
      Local: '本地：事件只留在此进程内。适合单副本；其他副本看不到这些事件。',
      Polling: '数据库轮询：副本通过轮询数据库共享实时事件。适用于任何数据库，有短暂延迟。',
      PostgresNotify: 'PostgreSQL 通知：副本通过 PostgreSQL 的 LISTEN 和 NOTIFY 共享实时事件，延迟很小。'
    },
    nodeStatus: {
      Ready: '就绪：正在发送心跳并接受新的运行。',
      Draining: '排空中：正在完成当前的运行，不再接受新的运行。',
      Cordoned: '已封锁：不接受新的运行；当前的运行照常继续。',
      Lost: '丢失：错过了心跳。它的运行会被重新排队或标记为失败。',
      Offline: '离线：已正常关闭，不持有任何运行。'
    },
    usageQuotaScope: {"Tenant": "租户. 租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "Agent": "智能体. 租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "Deployment": "部署. 租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。"},
    harnessType: {
      ClaudeCode: 'Anthropic Claude Code CLI，以无头模式运行，输出 stream-JSON。',
      Codex: 'OpenAI Codex CLI，通过 exec 运行，输出 JSONL。',
      Mux: '输出 JSONL 的 Mux CLI；支持本地和托管的模型端点。',
      GeminiCli: '输出 stream-JSON 的 Google Gemini CLI。',
      Generic: '任何其他命令行智能体，完全由 Harness 配置文件描述。'
    },
    agentKind: {
      Hosted: '托管：Garrison 通过其部署在工作节点上自行运行此智能体。',
      Remote: '远程：智能体在其他地方运行，Garrison 将调用转发到它的 A2A 或 MCP 端点。'
    },
    secretStatus: {
      Ok: '就 Garrison 所知，此凭据可以使用。设置新值后，机密总会回到此状态。',
      NeedsReauthentication: 'OpenAI 已永久拒绝所存的 ChatGPT 登录，例如其刷新令牌已被使用过。使用此机密的运行会一直失败，直到你用新的登录替换它的值。'
    },
    secretKind: {
      AnthropicApiKey: 'Anthropic API 密钥，由 Claude Code 配置文件以 ANTHROPIC_API_KEY 注入。',
      ClaudeCodeOAuthToken: 'Claude Code 订阅令牌。在共享服务器上使用前，请查阅提供商的条款。',
      OpenAiApiKey: '用于 Codex 或其他基于 OpenAI 的 Harness 的 OpenAI API 密钥。',
      CodexAuthJson: 'Codex auth.json 文件的内容，会写入运行的 HOME 目录。',
      GeminiApiKey: '用于 Gemini CLI 的 Google Gemini API 密钥。',
      GenericEnv: '用于环境变量的任意值。',
      GenericFile: '要写入文件的任意值。',
      BearerToken: 'Bearer 令牌，通常用于 MCP 服务器的 Authorization 请求头。',
      BasicAuth: '用于基本身份验证的用户名和密码。',
      GitCredential: '为工作区克隆私有 Git 仓库时使用的令牌或密码。'
    },
    workspaceKind: {
      Empty: '每个运行都在一个新的空目录中开始。',
      GitRepository: '每个运行都从 Git 仓库的全新克隆开始。',
      Seeded: '每个运行开始时都带有模板中列出的文件。',
      PersistentVolume: '每次运行都会把已有的 PersistentVolumeClaim 挂载为工作区，因此文件在多次运行之间保留。需要 Kubernetes Job 执行器。'
    },
    runExecutor: {
      Process: 'Harness 作为 worker 的子进程在 worker 的容器中运行，拥有独立的工作、home 和配置目录。',
      KubernetesJob: 'Worker 为每次运行创建一个 Kubernetes Job：harness 在独立的 Pod 中运行，没有 Kubernetes 或 Garrison 凭据，根文件系统只读，并受部署资源上限约束。'
    },
    promptTemplateKind: {
      System: '系统提示词：用于设定智能体的固定指令。',
      Task: '任务提示词：将调用方的消息包装成 Harness 接收的内容。',
      Fragment: '可复用的片段，其他模板通过 {{> name}} 引入。',
      ToolDescription: '将智能体描述为 MCP 工具或 A2A 技能的文本。',
      ConfigFile: '生成的配置文件的内容，例如 MCP 配置。',
      Other: 'Harness 配置文件渲染的任何其他文本。'
    },
    mcpTransport: {
      Http: 'Garrison 和 Harness 通过某个 URL 以可流式 HTTP 访问该服务器。',
      Stdio: 'Harness 将服务器作为本地进程启动，并通过 stdin 和 stdout 与其通信。'
    },
    permissionType: {
      Permit: '允许：允许列出的操作。',
      Deny: '拒绝：阻止列出的操作，即使其他权限允许它们。'
    },
    artifactStoreKind: {
      Database: '制品存储在 Garrison 数据库中。简单，但最适合小文件。',
      Filesystem: '制品写入服务器可以访问的某个目录。',
      S3: '制品上传到兼容 S3 的存储桶。'
    },
    manifestApplyResult: {
      Created: '此文档创建了一条新记录。',
      Updated: '此文档修改了一条现有记录。',
      Unchanged: '记录已与此文档一致，因此没有任何更改。',
      Failed: '此文档未通过验证。清单中的任何内容都没有写入。',
      Validated: '试运行：此文档有效，将会被应用。'
    },
    auditEventType: {
      ApprovalDecided: '有人允许或拒绝了一个待处理的工具调用。记录中包含工具、运行和原因。',
      AuthSuccess: '有人成功登录或成功对请求进行了身份验证。',
      AuthFailure: '登录或身份验证尝试失败。反复失败可能意味着有人在猜测密码。',
      SessionIssued: '签发了一个会话令牌。',
      SessionRevoked: '撤销了一个会话令牌，例如因为退出登录。',
      CredentialCreated: '创建了一个新的访问密钥。',
      CredentialRotated: '替换了某个访问密钥的私密密钥。',
      CredentialUsed: '使用访问密钥进行了身份验证。',
      AuthorizationDenied: '由于调用方缺少权限，请求被拒绝。',
      AuthorizationBypass: '请求通过绕过规则跳过了授权，例如系统管理员。',
      RoleChanged: '创建、修改或删除了一个角色。',
      PermissionChanged: '创建、修改或删除了一项权限。',
      AssignmentChanged: '创建、修改或删除了一个角色分配。',
      ConfigurationChanged: '智能体、部署、配置文件、模板或其他配置记录发生了变更。',
      SecretChanged: '创建、修改、轮换或删除了一个机密。',
      SettingsChanged: '服务器设置已更改。',
      RestartRequested: '有人请求重启服务器。',
      ManifestApplied: '向租户应用了一个清单。',
      NodeRegistered: '一个工作节点向控制平面注册。',
      NodeStatusChanged: '某个工作节点被封锁、排空、标记为丢失或恢复。',
      RunCancelled: '某个运行被用户、访问密钥或其父运行取消。',
      ConversationDeleted: '有人删除了一个对话。它的各轮作为普通运行保留。'
    },
    conversationFallbackReason: {
      AffinityNodeLost: '保存对话的节点已不再就绪（丢失、排空中、已封锁或已删除），因此由另一个节点领取了这一轮。',
      AffinityWaitExpired: '保存对话的节点保持就绪，但没有在 Runtime.ConversationAffinityWaitMs 内领取这一轮，因此由另一个节点领取。',
      WorkspaceLost: '节点领取了这一轮，但对话的工作区和主目录已不在该节点上。',
      SessionMissing: '存在先前的轮次，但没有一轮报告可恢复的 Harness 会话，例如它们都在早期失败了。',
      HarnessChanged: '自记录会话以来，部署的 Harness 配置文件已更改，新的配置文件无法恢复该会话。',
      ResumeUnsupported: '部署的 Harness 配置文件不支持恢复会话，因此后续每一轮都从记录开始。',
      ExecutorWithoutState: '这一轮以 Kubernetes Job 运行，每次都从空的主目录开始，因此后续每一轮都从记录开始。'
    }
  },
  resources: {
    approvals: {
      createdUtc: 'Harness 发出询问的时间。将鼠标悬停在值上可查看确切时间。',
      agentName: '发出请求的运行所属的智能体，即由它的运行请求了此工具调用。',
      toolName: 'Harness 想要使用的工具，例如 Bash、Edit、WebFetch 或 MCP 工具。',
      summary: '关于此调用的一行说明：命令、URL、路径或查询，机密已脱敏。',
      status: '决定前为“待处理”，之后为“已批准”“已拒绝”“已过期”（超时）或“已取消”（运行已停止）。',
      decision: '做出决定后显示“允许”或“拒绝”；审批仍待处理时此处为空。',
      decisionSource: '决定方式：规则、部署默认设置、人员、超时或运行停止。',
      decidedBy: '当审批由人员决定时，显示做出决定的那位人员或所用的访问密钥。',
      expiresUtc: '待处理的审批在此时间超时，届时将采用部署设置的超时决定。',
      kind: '工具调用（Claude Code）、命令或文件更改（Codex app-server）。',
      harnessType: '发出询问的 Harness：Claude Code 或 Codex。',
      runId: '发出询问的运行。打开它可查看此调用前后的对话记录。',
      rootRunId: '当发出询问的运行是委派运行时，委派树中的顶层运行。',
      deploymentId: '用其规则评估此调用的部署。记住的规则会添加到该部署。',
      leaseEpoch: '发出询问的运行尝试的租约纪元，确保决定不会传到后续的尝试。',
      requestedUtc: 'Harness 为此次工具调用发出权限请求的具体时间。',
      decidedUtc: '做出此审批决定的时间，即审批从待处理变为允许或拒绝的那一刻。',
      waitMs: '此工具调用从发出请求到做出决定之间所等待的总时长。',
      timeoutDecision: '如果在审批过期之前无人决定会发生什么，此值取自部署设置。',
      toolCallId: 'Harness 为此工具调用分配的 ID，用于在对话记录中找到它。',
      reason: '做出决定的人员在决定时填写的备注内容（如果有的话）。',
      inputPreview: 'Harness 发送的工具输入（JSON 格式），机密和类似令牌的值已脱敏。',
      rulePattern: '当规则决定了此调用或要求询问人员时，与此调用匹配的部署规则。',
      ruleId: '与此工具调用相匹配的那条部署规则的唯一标识 ID。',
      suggestedRule: '一条能匹配此调用的规则。“记住为规则”会预先填入它。',
      rememberedRuleId: '以“记住”方式决定此审批时添加到部署中的规则的 ID。',
      id: '审批标识符（apr_...），供 API 和 MCP 工具使用。',
      actions: {
        allow: '允许此待处理的工具调用，可填写原因，并可选择将其记住为规则。',
        deny: '拒绝此待处理的工具调用，可填写原因，并可选择将其记住为规则。',
        openRun: '打开发出询问的运行，查看此工具调用前后的对话记录。'
      }
    },
    tenants: {
      add: '创建一个新租户：一个相互隔离的空间，拥有自己的用户、智能体、机密和运行。',
      name: '租户的显示名称。人们登录时通过租户 ID 选择租户。',
      description: '此租户是为谁或为什么而设，例如某个团队或客户。',
      active: '未启用的租户无法登录或运行智能体。其数据会保留。'
    },
    users: {
      add: '创建一个使用电子邮件和密码登录的人员。之后通过角色分配为其授予访问权限。',
      email: '此人登录所用的地址。在租户内唯一。',
      name: '名字和姓氏，显示在审计记录和列表中。',
      role: '账户的管理员级别。普通用户通过角色分配获得访问权限。',
      password: '登录密码。编辑时留空即可保留当前密码。',
      firstName: '名字，显示在列表和审计记录中。',
      lastName: '姓氏，显示在列表和审计记录中。',
      isTenantAdmin: '租户管理员可以管理此租户内的一切，包括用户和机密。',
      isAdmin: '系统管理员管理所有租户并绕过授权检查。请谨慎授予。',
      active: '未启用的用户无法登录，其访问密钥也会失效。',
      actions: { permissions: '显示此用户在合并所有角色和分配后最终拥有的全部权限。' }
    },
    credentials: {
      add: '为脚本、SDK 或服务创建访问密钥。保存后私密密钥只显示一次。',
      name: '此密钥的用途，例如 ci-pipeline。便于在轮换或删除前找到它。',
      accessKey: '密钥的公开部分，随每个请求发送。可以安全地存放在配置中。',
      secretKeyLast4: '私密密钥的最后四个字符，便于在不查看密钥的情况下进行比对。',
      userId: '拥有此密钥的用户。密钥的权限永远不会超过其所有者。',
      lastUsedUtc: '此密钥最后一次对请求进行身份验证的时间。日期很久远说明密钥未被使用，可以删除。',
      authMode: '密钥的身份验证方式：直接发送、按请求签名、换取会话，或以上任意一种（Hybrid）。',
      expiresUtc: '超过此时间后密钥失效。留空表示密钥永不过期。',
      active: '未启用的密钥会被拒绝但会保留，因此可以重新启用。',
      actions: {
        rotate: '用新的私密密钥替换旧的。旧密钥立即失效；新密钥只显示一次。',
        permissions: '显示此密钥在合并其所有者、角色和分配后最终拥有的全部权限。'
      }
    },
    roles: {
      add: '创建一个自定义角色，然后为其添加权限，并分配给用户或密钥。',
      name: '分配角色时人们看到的名称，例如 Release Operator。',
      description: '此角色的用途以及应该授予谁。',
      active: '未启用的角色不授予任何权限，即使已被分配。',
      actions: { clone: '为此内置角色创建一个可编辑的副本，供你调整。' }
    },
    permissions: {
      add: '创建一条允许或拒绝对资源类型执行操作的规则。',
      name: '规则的简短名称，在构建角色时显示。',
      permissionType: '“允许”放行下面的操作。“拒绝”阻止这些操作，并且始终优先于“允许”。',
      resourceTypes: '规则涵盖哪些类型的记录。All 表示涵盖所有类型。',
      operationTypes: '规则涵盖哪些操作，例如 Read、Create 或 Execute（调用）。',
      active: '未启用的权限不起任何作用。'
    },
    userAssignments: {
      add: '为用户授予一个角色，范围可以是整个租户或某一条特定记录。',
      userId: '获得该角色的人员。',
      roleName: '授予的角色。此人将获得其中的全部权限。',
      roleId: '要授予的角色。此人将获得其中的全部权限。',
      resourceScope: '“租户”将角色应用于所有记录。“资源”将其限制为下面指定的那一条记录。',
      resourceId: '角色所适用的单条记录的标识符，例如某个智能体 ID。',
      inheritsToChildren: '将角色应用于租户中的所有记录，包括以后创建的记录。',
      active: '未启用的分配不授予任何权限，但会保留。'
    },
    credentialAssignments: {
      add: '为访问密钥授予一个角色，范围可以是整个租户或某一条特定记录。',
      credentialId: '获得该角色的访问密钥。它的权限仍然不能超过其所有者。',
      roleName: '授予该密钥的角色。',
      roleId: '要授予的角色。请选择能让自动化完成工作的最小权限角色。',
      resourceScope: '“租户”将角色应用于所有记录。“资源”将其限制为下面指定的那一条记录。',
      resourceId: '角色所适用的单条记录的标识符，例如 CI 作业可以调用的那个智能体。',
      inheritsToChildren: '将角色应用于租户中的所有记录，包括以后创建的记录。',
      active: '未启用的分配不授予任何权限，但会保留。'
    },
    harnessProfiles: {
      add: '描述一种以无头模式启动 CLI 智能体的新方式。通常克隆一个内置配置文件会更简单。',
      name: '配置文件名称。部署通过此名称选择配置文件。builtin/ 前缀为保留前缀。',
      harnessType: '此配置文件启动哪种 Harness。工作节点会声明自己能运行的类型，这决定了调度放置。',
      executable: '在工作节点上运行的命令，可在 PATH 中查找或使用绝对路径，例如 claude。',
      outputParser: 'Harness 的输出如何转换为对话记录事件和最终结果。',
      description: '此配置文件的特别之处，例如它添加了哪些参数。',
      probeArguments: '用于版本检查且不消耗 Token 的参数，例如 --version。工作节点在启动时运行它。',
      active: '未启用的配置文件不能被新的运行使用。',
      arguments: '有序的命令行参数。每个参数都是一个模板，可以通过条件跳过，也可以针对列表重复。',
      argumentsItems: {
        template: '单个参数的文本，例如 --model 或 {{deployment.model}}。',
        condition: '模板表达式；渲染结果为空或 false 时跳过此参数。',
        repeatOver: '列表变量的名称；列表中的每个元素都会输出一次该参数。'
      },
      promptDelivery: '任务提示词如何传给 Harness：通过标准输入、作为参数，或写入文件。',
      promptArgumentTemplate: '提示词不通过标准输入发送时使用的参数或文件名。',
      systemPromptDelivery: '系统提示词如何传给 Harness：文件、参数、环境变量、加在任务之前，或完全不传。',
      systemPromptTarget: '承载系统提示词的参数、变量或文件名。',
      mcpConfigFormat: '此 Harness 读取哪种 MCP 配置格式。Garrison 会以该格式写入运行所绑定的 MCP 服务器。',
      mcpConfigFileName: '生成的 MCP 配置文件的文件名，位于运行配置目录中。',
      environment: '进程的环境变量。值是模板；{{secret.alias}} 可引入已绑定的机密。',
      environmentItems: {
        name: '变量名，例如 ANTHROPIC_API_KEY。',
        valueTemplate: '值的模板。凭据请使用 {{secret.alias}}。',
        condition: '模板表达式；渲染结果为空或 false 时不设置该变量。',
        isSecret: '将该值视为机密：永不写入日志，并在预览中被遮盖。'
      },
      files: '启动前写入的文件，例如设置文件或 auth.json。',
      filesItems: FILE_ITEMS,
      credentialEnvironmentAllowlist: '此 Harness 允许从机密填充的环境变量名。其他变量一律拒绝。',
      genericTextField: '每行输出中助手文本的 JSON 路径，供 Generic JSONL 解析器使用。',
      genericFinalField: '最终结果文本的 JSON 路径，供 Generic JSONL 解析器使用。',
      genericSuccessField: '表示运行是否成功的 JSON 路径，供 Generic JSONL 解析器使用。',
      genericSuccessValue: '成功路径上表示运行成功的值，例如 true。',
      resultSource: '最终答案的来源：解析器的最终事件、最后一条消息文件，或全部标准输出。',
      resultFileName: '当结果来源为文件时，Harness 写入最后一条消息的文件名。',
      successPolicy: '如何判定成功：依据解析器的最终事件、退出码，或两者兼顾。',
      successExitCodes: '策略使用退出码时视为成功的退出码。每行一个。',
      defaultTimeoutSeconds: '部署未设置时的运行截止时间（秒）。范围为 5 到 86400。',
      killGraceSeconds: '从请求进程停止到强制终止其进程树之间的秒数。范围为 0 到 60。',
      maxOutputBytes: '运行可产生的标准输出上限，超出后会以“超出输出限制”失败。',
      stderrTailBytes: '为运行详情页保留多少标准错误输出的末尾内容。',
      isolateHome: '为每个运行提供独立的 HOME 目录，使 Harness 的设置和缓存不会在运行之间泄漏。',
      supportsResume: '此 Harness 是否可以恢复之前的会话。供对话功能使用。',
      steps: {
        basics: '名称、Harness 类型、可执行文件和版本探测。',
        invocation: '参数、提示词传递方式、MCP 配置、环境变量和文件。',
        output: '如何解析输出以及如何判定成功。',
        limits: '超时、输出限制和 HOME 隔离。'
      },
      actions: { clone: '在你的租户中创建此配置文件的可编辑副本，名称带 -custom 后缀。' }
    },
    promptTemplates: {
      actions: { clone: '以你选择的新名称复制此模板，然后在编辑器中打开副本。' },
      add: '在带实时预览的编辑器中编写新的提示词模板。每次保存都会成为一个版本。',
      name: '模板名称，在租户内唯一。部署按 ID 绑定模板，所以重命名后绑定不受影响；包含引用按名称引用它。',
      kind: '模板的用途：系统提示词、任务包装、片段、工具描述或配置文件。',
      currentVersion: '最新保存的版本。部署要么固定某个版本，要么跟随最新版本。',
      description: '模板的作用以及使用位置。'
    },
    mcpServers: {
      add: '注册一个 MCP 服务器，以便部署绑定它，其智能体可以使用它的工具。',
      name: '服务器名称。部署通过此名称绑定它并为其指定别名。',
      transport: 'HTTP 服务器通过 URL 访问；stdio 服务器由 Harness 作为本地进程启动。',
      endpoint: '服务器的访问方式：其 URL 和路径，或 stdio 服务器的命令。',
      required: '开启后，如果此服务器或其必需工具无法访问，运行会在启动前失败。',
      description: '此服务器提供哪些工具，以及哪些智能体应该使用它。',
      url: '工作节点可以访问到的服务器基础 URL，不含 MCP 路径。',
      path: '该服务器上 MCP 端点的路径，通常为 /mcp。',
      headers: '发送给服务器的 HTTP 请求头，例如 Authorization。值可以使用 {{secret.alias}}。',
      headersItems: {
        name: '请求头名称，例如 Authorization。',
        valueTemplate: '请求头值模板，例如 Bearer {{secret.github}}。'
      },
      command: '在工作节点上启动 stdio 服务器的可执行文件。',
      arguments: 'stdio 服务器命令的参数，每行一个。',
      environment: 'stdio 服务器进程的环境变量。值可以使用 {{secret.alias}}。',
      environmentItems: {
        name: '服务器进程的变量名。',
        valueTemplate: '值模板。凭据请使用 {{secret.alias}}。'
      },
      requiredTools: '此服务器上必须存在的工具。工作节点会在启动前检查，缺少任何一个都会使运行失败。',
      toolTimeoutSeconds: '单次工具调用最长可以持续多久，超时后 Harness 会放弃该调用。',
      active: '未启用的服务器不会加入新的运行，即使部署绑定了它们。',
      actions: { test: '立即连接服务器并列出其工具，以检查地址和凭据。' }
    },
    secrets: {
      status: '所存凭据是否仍然可用。当 Codex 登录无法再刷新时，Garrison 会将其标记为需要重新认证。',
      accessTokenExpiresUtc: '所存 Codex ChatGPT 登录中的访问令牌何时过期。Garrison 会在此之前刷新它，并把新令牌写回机密。',
      refreshedUtc: 'Garrison 上次自行刷新此 Codex 登录的时间。运行只会收到不含刷新令牌的副本。',
      statusMessage: '提供方报告的登录无法使用的原因。',
      statusUtc: 'Garrison 发现该登录无法再刷新的时间。',
      add: '保存一个新凭据，例如 API 密钥或令牌，静态加密存储。部署通过别名引用它；保存后该值不会再次显示。',
      name: '机密名称。部署通过此名称选择机密并为其指定别名。',
      kind: '这是哪一类凭据。内置配置文件根据类型判断要填充哪个变量或文件。',
      valueLast4: '所存值的最后四个字符，便于在不泄露值的情况下区分各个机密。',
      rotatedUtc: '该值最后一次设置或轮换的时间。',
      expiresUtc: '仅供参考的过期时间。请在此日期之前轮换该值。',
      description: '该值的来源以及哪些智能体需要它。',
      value: '机密值。保存时会被加密，之后永远无法读取，只能替换。',
      newValue: '替换用的值。保存后编译的每个运行都会使用它。',
      active: '未启用的机密不会注入到运行中。',
      saveValue: '加密并保存新值。旧值会被丢弃，无法恢复。',
      actions: {
        setValue: '用你输入的新值替换所存的值。旧值无法恢复。',
        rotate: '换入新值并记录轮换时间，例如在提供商签发新密钥之后。'
      }
    },
    workspaces: {
      add: '定义运行工作目录的准备方式：空目录、从 Git 克隆，或预置文件。',
      name: '模板名称。部署通过此名称选择工作区模板。',
      kind: '“空”从空目录开始，“Git 仓库”克隆一个仓库，“预置文件”写入下面列出的文件。',
      gitUrl: '每个运行要克隆的仓库。私有仓库需要一个 Git 凭据机密。',
      retention: '运行结束后目录如何处理：“删除”、“保留”，或“失败时保留”（仅在运行失败时保留）。',
      description: '工作区包含什么，以及哪些智能体使用它。',
      gitRef: '要检出的分支、标签或提交。留空则使用默认分支。',
      gitDepth: '要获取的提交数量。1 最快；0 获取完整历史。',
      gitCredentialSecretId: '保存克隆私有仓库所用令牌或密码的机密。',
      persistentVolumeClaim: '挂载到工作区路径的 PersistentVolumeClaim 名称。它必须已存在于运行命名空间中；Garrison 从不创建或删除它。',
      files: '运行开始前写入工作区的文件。',
      filesItems: {
        path: '文件相对于工作区根目录的路径。',
        content: '文件的文本内容。'
      },
      active: '未启用的模板不能被新的运行使用。'
    },
    modelPrices: {"add": "为执行器和实际使用的精确模型名称添加价格。不预设供应商费率。", "name": "此租户内该价格配置条目的唯一名称。", "description": "操作员关于费率来源和生效日期的说明。", "active": "不使用停用的价格。编辑或删除价格不会改变已保存的运行费用。", "model": "请输入1至256个字符且不含控制字符的精确模型名称。", "harnessType": "这些费率对应的令牌计数方式和精确模型名称所属的执行器。", "inputUsdPerMillion": "输入美元 / 百万令牌. 请输入0至1,000,000,000之间的有限费率。零为有效值。", "outputUsdPerMillion": "输出美元 / 百万令牌. 请输入0至1,000,000,000之间的有限费率。零为有效值。", "cachedInputUsdPerMillion": "留空时使用对应的输入或输出费率。零表示免费。", "reasoningUsdPerMillion": "留空时使用对应的输入或输出费率。零表示免费。", "inputIncludesCachedTokens": "当输入计数包含缓存令牌时启用。Claude Code单独报告缓存读取，应禁用此项。", "outputIncludesReasoningTokens": "当输出计数包含推理令牌时启用。先扣除已包含的子计数，再应用单独费率。"},
    usageQuotas: {"add": "为租户、代理或部署添加配额。留空的限制表示无限制。", "name": "名称. 租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "description": "描述. 租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "active": "启用. 租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "scope": "租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "resourceId": "为租户、代理或部署添加配额。留空的限制表示无限制。", "dailyRunLimit": "每UTC日运行数. 留空表示无限制，零表示禁止使用。每日计数在UTC午夜重置；并发计数为当前活跃运行数。", "dailyTokenLimit": "每UTC日令牌数. 留空表示无限制，零表示禁止使用。每日计数在UTC午夜重置；并发计数为当前活跃运行数。", "dailyCostUsdLimit": "每UTC日已知美元. 留空表示无限制，零表示禁止使用。每日计数在UTC午夜重置；并发计数为当前活跃运行数。", "maxConcurrentRuns": "最大活跃运行数. 留空表示无限制，零表示禁止使用。每日计数在UTC午夜重置；并发计数为当前活跃运行数。", "actions": {"usage": "每日使用量. 每UTC日运行数. 留空表示无限制，零表示禁止使用。每日计数在UTC午夜重置；并发计数为当前活跃运行数。"}, "usage": {"windowStartUtc": "窗口开始 (UTC). 租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "windowEndUtc": "每日重置 (UTC). 租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "runsUsed": "已接收运行. 租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "tokensUsed": "已完成令牌数. 租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "costUsd": "已知费用 (USD). 租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "unknownCostRuns": "缺少费用的运行. 租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "activeRuns": "活跃运行. 租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。"}, "enforcementEnabled": "默认关闭。明确启用后才会在达到限制时拒绝运行，并降低支持的执行器预算。关闭时仅记录使用量，不影响执行。"},
    artifactStores: {
      add: '为运行产生的文件创建一个目的地，使它们在运行的工作区删除后仍然保留。',
      name: '存储名称。部署通过此名称选择制品存储。',
      kind: '文件的存放位置：Garrison 数据库、文件系统目录或 S3 存储桶。',
      description: '这里存放什么，以及应保留多长时间。',
      active: '未启用的存储不再接收新的制品。'
    },
    agents: {
      add: '创建一个新的智能体身份。在为其添加至少一个部署之前，它不会执行任何操作。',
      name: '调用方通过 REST、MCP 和 A2A 调用智能体时使用的名称，需符合 DNS 规范。仅限小写字母、数字和连字符。',
      displayName: '在控制台和 A2A 智能体卡片中显示的友好名称。',
      kind: '托管智能体通过部署在这里运行。远程智能体在其他地方运行，通过其端点调用。',
      exposure: '哪些协议会公布此智能体：A2A 为其提供智能体卡片；MCP 使其成为 MCP 客户端可用的工具。',
      delegationMode: '此智能体的运行可以调用哪些其他智能体：“不委派”、“允许列表”中的智能体，或“任意智能体”。',
      tags: '用于查找和分组智能体的标记。它们不影响智能体的运行方式。',
      description: '用通俗的语言说明智能体做什么。它会展示给调用方并显示在 A2A 卡片中，所以请面向调用方来写。',
      agentVersion: '在 A2A 卡片中公布的版本字符串。智能体行为发生变化时请更新它。',
      remoteProtocol: 'Garrison 调用远程智能体的方式：A2A 或 MCP。',
      remoteEndpointUrl: '远程智能体的 A2A 或 MCP 端点地址。',
      exposeA2A: '发布 A2A 智能体卡片，使其他 A2A 智能体可以发现并调用此智能体。',
      exposeMcpTool: '在 Garrison 的 MCP 服务器上将此智能体作为独立工具提供，使 MCP 客户端可以直接调用它。',
      mcpToolName: 'MCP 客户端看到的工具名称。留空则使用智能体名称。',
      skills: '智能体卡片中列出的 A2A 技能。它们描述调用方可以请求什么。',
      skillsItems: {
        skillId: '技能在 A2A 卡片中的稳定标识符。',
        name: '向 A2A 调用方显示的简短技能名称。',
        description: '技能的作用，面向调用它的智能体编写。'
      },
      inputMode: 'Text 接受纯文本消息。Structured 要求输入符合输入 JSON Schema。',
      inputSchemaJson: '输入模式为 Structured 时，输入必须符合的 JSON Schema。',
      outputSchemaJson: '结果必须符合的 JSON Schema。Garrison 会验证输出，失败时使用修复提示词重试一次。',
      delegationAllowList: '委派使用允许列表时，此智能体可以调用的智能体。',
      delegationMaxDepth: '此智能体之下最多可以有多少层智能体间调用。范围为 0 到 10。',
      delegationAllowRecursion: '允许同一个智能体在一条调用链中出现两次。关闭可防止循环。',
      active: '未启用的智能体无法被调用。',
      sections: {
        identity: '智能体是谁：名称、描述、类型和版本。',
        exposure: '哪些协议会公布此智能体，以及它列出哪些技能。',
        io: '智能体接受什么输入，以及必须返回什么输出。',
        delegation: '此智能体是否可以调用其他智能体，以及可以调用多少层。'
      }
    },
    deployments: {
      approvalsEnabled: '让 Harness 在工具调用前询问。下方规则决定大部分调用；其余调用在审批收件箱中等待人员处理。仅适用于 Claude Code 和 Codex app-server 配置文件。',
      approvalDefaultAction: '没有规则匹配工具调用时的处理方式：允许、拒绝或询问人员。',
      approvalTimeoutSeconds: '调用等待人员处理多长时间后采用超时决定，范围为 10 到 3,600 秒。',
      approvalTimeoutDecision: '在规定时间内无人响应时所采用的决定。拒绝是更安全的选择。',
      approvalRules: '使用 Claude Code 语法的有序规则。拒绝优先于询问，询问优先于允许；同一操作内报告第一个匹配项。',
      approvalRulesItems: {
        action: '与此规则匹配的调用会得到什么结果：允许、拒绝或询问人员。',
        pattern: 'Claude Code 规则，例如 Bash(npm test)、Bash(npm run *)、Edit(src/**)、Read、WebFetch(domain:example.com) 或 mcp__github__*。',
        inputPattern: '可选的 .NET 正则表达式，工具输入 JSON 也必须与之匹配，可提供比模式更精细的控制。',
        description: '说明此规则存在的原因，供日后维护这条规则的人员参考。'
      },
      approvalTest: '用部署已保存的规则试验一个工具调用，查看它会被允许、拒绝还是交给人员处理。',
      add: '创建一个部署：智能体的具体运行方式，包括 Harness 配置文件、模型、提示词和资源。',
      name: '部署名称，在租户内唯一，例如 reviewer-claude。',
      agentId: '此部署运行的智能体。调用该智能体时可能会选中此部署。',
      harnessProfileId: '启动 CLI 的 Harness 配置文件，例如 builtin/claude-code。',
      model: '传给 Harness 的模型名称，例如 sonnet 或 gpt-5。模板中可通过 deployment.model 使用。',
      weight: '在该智能体所有已启用部署之间的流量权重。权重为 300 的部署获得的调用数是权重为 100 的部署的三倍。',
      configVersion: '每次更改都会递增。每个运行都会记录其编译所依据的版本。',
      description: '此部署与该智能体其他部署的区别，例如使用更便宜的模型。',
      active: '未启用的部署不接收按权重分配的流量，但调用方仍可显式指定它们。',
      fallbackModel: '主模型过载时使用的模型（需 Harness 支持）。',
      effort: '传给支持该功能的 Harness 的推理强度提示，例如 low、medium 或 high。',
      maxTurns: '在 Harness 停止运行之前，一个运行最多可以进行的智能体轮次。',
      maxBudgetUsd: '每个运行的支出上限（美元），适用于会强制执行该上限的 Harness。',
      parameters: '模板可以通过 deployment.parameters.name 读取的具名值。',
      parametersItems: {
        name: '参数名称，以 deployment.parameters.name 引用。',
        value: '默认值。只有列在“调用方可按运行设置的覆盖项”中时，调用方才可以覆盖它。'
      },
      promptBindings: '每个角色（System、Task、DelegatedTask 等）由哪个提示词模板填充。',
      promptBindingsItems: {
        role: '此绑定填充的提示词角色，例如 System 或 Task。',
        templateId: '该角色使用的模板。',
        pinnedVersion: '要固定的版本。留空则始终使用最新版本。'
      },
      resourceBindings: '此部署使用的 MCP 服务器和机密，每项都有一个供模板使用的别名。',
      resourceBindingsItems: {
        kind: '此绑定是 MCP 服务器还是机密。',
        alias: '模板使用的简短名称，例如 {{secret.anthropic}} 中的 anthropic。',
        resourceId: '要绑定的 MCP 服务器或机密。'
      },
      workspaceTemplateId: '每个运行的工作目录如何准备。留空表示使用全新的空目录。',
      artifactStoreId: '运行结束后，其产生的文件上传到哪里。',
      argumentOverrides: '仅针对此部署对 Harness 配置文件参数所做的更改：追加、前置、替换或移除。',
      argumentOverridesItems: {
        operation: '要执行的操作：追加、前置、替换匹配的参数，或移除它。',
        match: '要替换或移除的现有参数。',
        template: '新的参数文本。可以使用模板。',
        condition: '模板表达式；渲染结果为空或 false 时跳过此覆盖。'
      },
      environmentOverrides: '仅针对此部署添加或替换的环境变量。',
      environmentOverridesItems: {
        name: '要添加或替换的变量名。',
        valueTemplate: '值模板。已绑定的机密请使用 {{secret.alias}}。',
        isSecret: '将该值视为机密：永不写入日志，并在预览中被遮盖。'
      },
      fileOverrides: '仅针对此部署添加或替换的文件。',
      fileOverridesItems: FILE_ITEMS,
      allowedRunOverrides: '调用方可以按运行更改的参数，并带有验证。其他一切保持固定。',
      allowedRunOverridesItems: {
        name: '调用方可以按运行设置的参数，例如 model 或 tone。',
        validation: '如何检查调用方提供的值：不限、值列表、正则表达式或数值范围。',
        pattern: '以逗号分隔的允许值、正则表达式，或表示数值范围的 min,max。'
      },
      nodePoolId: '仅在此节点池中的节点上运行。留空则允许任何符合条件的节点。',
      nodeSelector: '必须完全匹配的节点标签，例如 gpu=true。',
      nodeSelectorItems: {
        key: '节点必须具有的标签名。',
        value: '节点必须具有的标签值。'
      },
      maxConcurrentRuns: '此部署在所有节点上同时进行的运行数上限。0 表示不限制。',
      timeoutSeconds: '运行截止时间（秒）。留空则使用 Harness 配置文件的默认值。集群设置 Runtime.MaxRunSeconds 会限制每个运行，包括每次运行的时间限制。',
      maxAttempts: '一个运行总共最多可以尝试多少次。范围为 1 到 10。',
      steps: {
        approvals: 'Harness 可以进行哪些工具调用、不可以进行哪些，以及哪些需要等待人员处理。',
        basics: '名称、智能体和流量权重。',
        harness: 'Harness 配置文件、模型、限制和参数。',
        prompts: '每个提示词角色由哪个模板填充。',
        resources: 'MCP 服务器、机密、工作区和制品存储。',
        overrides: '针对此部署对参数、环境变量和文件所做的更改，以及调用方可以覆盖的内容。',
        placement: '运行可以在哪里执行，以及可以同时执行多少个。'
      },
      actions: {
        compilePreview: '使用示例消息编译此部署，查看运行将获得的确切命令行、文件和环境变量。',
        test: '打开“调用”页面并预先选中此部署，向它发送一条真实消息。'
      },
      repetitionGuard: '当回答退化成反复出现的同一段短文本，或者只有空白和标点时停止运行（结果为检测到重复）。未设置时遵循集群默认值；勾选或取消勾选即可为此部署单独设置。',
      maxAssistantChars: '一次运行在 Garrison 停止它之前最多可以写出的助手文本字符数（结果为超出输出限制）。0 表示不限制；留空则使用集群默认值。',
      noProgressSeconds: '在没有工具调用进行时，如果这么多秒内没有文本、思考、工具调用或工具结果，就停止运行（结果为无进展）。0 表示关闭；留空则使用集群默认值。',
      executor: '运行方式：进程（在 worker 内）或 Kubernetes Job（每次运行一个 Pod，隔离更强）。留空则跟随节点池的默认执行器，否则为进程。',
      podCpuRequest: '运行 Pod 请求的 CPU，例如 250m。留空则使用 worker 默认值。',
      podCpuLimit: '运行 Pod 最多可用的 CPU，例如 2。留空则使用 worker 默认值。',
      podMemoryRequest: '运行 Pod 请求的内存，例如 512Mi。留空则使用 worker 默认值。',
      podMemoryLimit: '运行 Pod 最多可用的内存，例如 4Gi。超出的运行会以“运行 Pod 失败”结果停止。',
      podEphemeralStorageRequest: '运行 Pod 为工作区、home 和临时文件请求的本地磁盘，例如 1Gi。',
      podEphemeralStorageLimit: '运行 Pod 最多可用的本地磁盘，例如 10Gi。超出的 Pod 会被驱逐，运行失败。',
      useClusterDefault: '清除此部署自身的设置，让重复防护重新遵循集群默认值。',
      sections: {
        guards: '运行防护会在任何 Harness 上尽早停止失控的运行。留空的每一项都遵循设置（运行时）中的集群默认值。',
        execution: '选择运行在哪里执行；对于 Kubernetes Job 运行，还可设置 Pod 的 CPU、内存和磁盘。'
      }
    },
    nodePools: {
      add: '创建一个节点池来对节点分组，并可选择为特定租户保留它们。',
      name: '节点池名称。节点在注册时加入节点池，部署可以要求使用某个节点池。',
      description: '此节点池代表的硬件或用途。',
      tenants: '允许使用此节点池的租户。留空表示所有租户。',
      defaultExecutor: '此池中未自行选择执行器的部署，其运行使用的执行器。留空表示进程。',
      active: '未启用的节点池不接受新的运行。'
    },
    runs: {
      ...TELEMETRY,
      id: '运行标识符。点击该行可打开对话记录、结果和遥测数据。',
      agentName: '被调用的智能体。一个运行始终属于该智能体的某一个部署。',
      status: '运行在其生命周期中所处的位置：已排队、已租用、运行中，或某种已结束状态。',
      outcome: '运行结束的原因，比状态更详细，例如“缺少凭据”。',
      harnessType: '执行该运行的 Harness，取自部署的配置文件。',
      leaseNodeName: '执行该运行的工作节点。运行仍在排队时为空。',
      depth: '此运行处于智能体间调用的第几层。0 表示由调用方直接启动的运行。',
      createdUtc: '请求运行的时间。将鼠标悬停在值上可查看确切时间。',
      actions: {
        cancel: '停止此运行。工作节点会终止 Harness 进程，运行以“已取消”结束。',
        retry: '使用相同的输入和部署启动一个新运行。原运行会保留。'
      },
      conversationId: '此运行所属的对话及其轮次。不属于任何对话的运行此处为空。',
      conversationTurn: '此运行在对话中的位置，开始对话的那一轮为 1。'
    },
    nodes: {
      name: '节点名称，通常是工作节点的 Kubernetes Pod 名称。',
      status: '节点是否接受新的运行。维护前请先封锁或排空节点。',
      capacity: '节点当前持有的运行数，以及它同时接受的最大运行数。',
      harnesses: '节点在启动时探测到已安装且可用的 Harness。',
      executors: '节点提供的执行器。只有当 worker 在集群中运行且有权创建 Job 时，才会出现 Kubernetes Job。',
      labels: '节点声明的键值标签。部署的节点选择器会与之匹配。',
      nodeVersion: '节点上工作节点软件的版本。',
      lastHeartbeatUtc: '节点最后一次签到的时间。停止签到的节点会被标记为“丢失”。',
      address: '节点上报的地址，仅供参考。',
      maxConcurrentRuns: '此节点同时接受的最大运行数。',
      childReserveSlots: '仅供父运行正在等待的委派运行使用的额外槽位：此节点上每有一个运行在等待子运行就开放一个，最多为此数量。',
      maxResidentWaiters: '此节点上可同时等待委派运行的最大运行数。0 表示等于其容量。超出时委派会以 DelegationCapacityExhausted 失败。',
      activeRuns: '节点当前持有的运行。',
      capabilities: '每次 Harness 探测的结果：类型、检测到的版本以及是否可用。',
      labelsItems: { key: '标签名，由部署的节点选择器匹配。', value: '标签值，由部署的节点选择器精确匹配。' },
      capabilitiesItems: {
        harnessType: '探测所检查的 Harness。',
        detectedVersion: 'Harness 上报的版本字符串。',
        available: '该 Harness 能否在此节点上运行。',
        detail: '探测输出，在 Harness 不可用时很有用。'
      },
      actions: {
        grafana: '在新标签页中打开 Grafana 的 Workers 仪表板，并筛选到节点 {{node}}。',
        cordon: '停止向此节点发送新的运行。已在其上的运行会正常完成。',
        uncordon: '让此节点重新接受新的运行。',
        drain: '停止接收新的运行，让当前运行完成，之后节点进入空闲。请在关闭节点前使用。',
        runs: '打开运行列表，并筛选出此节点执行过的运行。'
      }
    },
    controlNodes: {
      name: '副本名称：服务器运行时使用的节点 ID（GARRISON_NODE_ID，在 Kubernetes 中为 Pod 名称）。',
      status: '副本的生命周期：启动中、就绪、排空中或离线。只有就绪的副本会处理流量。',
      version: '此副本运行的 Garrison 服务器版本。只有在滚动更新期间才应出现不同版本。',
      schemaVersion: '副本启动时发现的数据库架构版本。所有副本都应报告相同的数字。',
      backplane: '此副本与其他副本共享实时事件（运行的流、WebSocket 更新）的方式。',
      uptime: '副本进程已运行的时长，从启动时间算起。将指针悬停在上面可查看确切的启动时间。',
      lastHeartbeatUtc: '副本最后一次发送心跳的时间。副本每 5 秒发送一次心跳；超过 15 秒的会突出显示为心跳超时。',
      activeRequests: '副本在最后一次心跳时正在处理的 HTTP 请求数。',
      openStreams: '副本在最后一次心跳时打开的服务器发送事件流和 WebSocket 连接数。',
      heldLongPolls: '副本在最后一次心跳时保持的工作节点租约长轮询数。空闲的工作节点在这里等待新的运行。',
      address: '副本报告的 IP 地址和 REST 端口。',
      hostname: '副本所在机器或 Pod 的主机名。',
      startedUtc: '副本进程的启动时间，以你的本地时区显示。',
      id: '副本的节点 ID。它与 API 响应中的 respondingNodeId 以及指标中的 node 标签一致。',
      isLeader: '此副本是否持有用于维护的领导者租约。同一时间只有一个副本是领导者。',
      leaderEpoch: '领导者租约的隔离纪元（fencing epoch）。每当领导权转移到另一个副本时都会增加。',
      respondingNodeId: '响应这次单条读取的副本。在负载均衡器后面，它可能与所显示的副本不同。',
      answeredBy: '响应此列表请求的控制节点（respondingNodeId）。在负载均衡器后面，每次刷新都可能由不同的副本响应。',
      badges: {
        leader: '领导者：此副本持有维护租约。它负责按保留期清理、将没有心跳的副本标记为离线，以及其他集群级维护。',
        leaderEpoch: '领导者：此副本持有维护租约（纪元 {{epoch}}）。它负责按保留期清理、将没有心跳的副本标记为离线，以及其他集群级维护。',
        stale: '心跳超时：超过 {{seconds}} 秒没有心跳，而副本本应每 5 秒发送一次。副本可能过载、网络中断或已停止；领导者会在 30 秒后将其标记为离线。'
      },
      actions: {
        grafana: '在新标签页中打开 Grafana 的 Garrison 概览仪表板，并按控制节点 {{node}} 筛选。'
      }
    },
    audit: {
      createdUtc: '事件发生的时间，按你的本地时区显示。',
      eventType: '这是哪一类安全或配置事件。',
      principalName: '执行者：用户、访问密钥，或代表智能体执行的运行。',
      resource: '涉及的记录类型和操作，例如 Agent / Read。',
      reason: '事件发生的原因，或访问被拒绝的原因。',
      sourceIp: '请求来源的网络地址。',
      principalType: '执行者是用户、访问密钥还是运行令牌。',
      principalId: '执行操作的用户、访问密钥或运行的标识符。',
      resourceType: '涉及的记录类型，例如 Agent 或 Secret。',
      resourceId: '涉及的记录的标识符。',
      operation: '尝试执行的操作，例如 Read 或 Execute。',
      method: '请求的 HTTP 方法。',
      path: '引发该事件的请求路径。',
      authResult: '检查调用方身份的结果。',
      authorizationResult: '检查调用方权限的结果。',
      bypassReason: '跳过授权的原因，例如系统管理员。',
      statusCode: '返回给调用方的 HTTP 状态码。',
      requestId: '请求标识符。可用它搜索请求历史或服务器日志。'
    },
    manifestApplies: {
      createdUtc: '应用或试运行清单的时间。',
      principalName: '应用者。',
      dryRun: '“是”表示仅做了验证，没有写入任何内容。',
      counts: '各文档创建、更新、保持不变或失败的记录数量。'
    },
    conversations: {
      title: '第一条消息的第一行，用作对话的名称。点击该行可打开各轮。',
      agentName: '对话所针对的智能体。每一轮都发送给这个智能体。',
      state: '有未完成的一轮时为“处理中”，在其结束前新的消息会被拒绝。可以发送下一条消息时为“空闲”。',
      turnCount: '对话已进行的轮数（运行数），包括失败的轮次。',
      affinityNodeName: '保存对话工作区和 Harness 会话的工作节点。下一轮会优先使用该节点，以便恢复会话。',
      fallbackCount: '无法恢复 Harness 会话、改为以先前各轮记录开始全新会话的轮数。',
      lastFallbackReason: '最近一次回退的那一轮无法恢复会话的原因，例如亲和节点未就绪。',
      harnessType: '运行每一轮的 Harness，来自第一轮的部署。',
      callerName: '谁发起了对话：用户、访问密钥或另一个智能体的运行。',
      contextId: '对话通过 A2A 发起时客户端提供的 A2A 上下文 ID。通过 REST 或 MCP 发起的对话此处为空。',
      sessionId: '下一轮将恢复的 Harness 会话。在某一轮报告会话之前为空。',
      lastActivityUtc: '最近一轮发送或结束的时间。将鼠标悬停在值上可查看确切时间。',
      createdUtc: '第一轮开始此对话的时间。将鼠标悬停在值上可查看确切时间。',
      id: '对话标识符。调用智能体时将其作为 conversationId 传入，即可发送下一轮。',
      fallbackLast: '以记录开始全新会话的轮数。最近一次的原因：{{reason}}。',
      states: {
        busy: '该对话的某一轮仍在排队或运行中。请等待其结束或将其取消，再发送下一条消息。',
        idle: '没有正在进行的一轮。下一条消息会继续这个对话。'
      },
      actions: {
        continue: '打开“调用”并选中此对话，下一条消息将作为它的下一轮发送。',
        runs: '打开按此对话各轮筛选的运行列表，可使用所有运行列和筛选条件。'
      }
    }
  },
  views: {
    approvalDetail: {
      openRun: '打开发出询问的运行，查看此工具调用前后的对话记录。',
      openAgent: '打开该智能体的页面，查看它的各个部署以及最近的运行。',
      openDeployment: '打开已筛选到此部署的“部署”标签页，在那里编辑其审批规则。',
      backToInbox: '返回审批收件箱，在那里可以查看所有仍待处理的审批。',
      viewJson: '以 JSON 格式显示完整的审批记录，与 API 返回的内容完全一致。',
      request: 'Harness 请求执行的操作：一行摘要和完整的工具输入，机密已脱敏。',
      rules: '匹配的部署规则、此调用建议的规则，以及根据决定记住的规则。',
      copyRule: '复制建议的规则，例如以便将其粘贴到部署的审批规则列表中。'
    },
    home: {
      observabilityState: {
        reachable: '服务器在最近 30 秒内通过内部 URL 访问到了 {{service}}。',
        unreachable: '服务器无法通过内部 URL 访问 {{service}}。请检查该服务是否在运行，以及内部 URL 设置是否指向它。',
        checking: '正在询问服务器 {{service}} 是否可访问。',
        unknown: '服务器没有报告 {{service}} 是否可访问。状态检查失败，或者此服务器尚不支持该检查。'
      },
      observabilityVersion: '{{service}} 在服务器健康检查中报告的版本。',
      kpisGrafana: '在新标签页中打开 Grafana 里的 Garrison 概览仪表板，查看这些数字随时间的变化。',
      grafanaDashboards: 'Grafana 中的 Garrison 文件夹为每个部分提供一个仪表板。每个链接都会在新标签页中打开对应的仪表板。',
      grafanaSections: {
        overview: '整体健康状况：在线的副本和工作节点、运行与请求速率、错误、成本和最近的问题。',
        http: '按路由划分的 REST 流量：请求速率、延迟百分位、错误、负载大小、认证失败和进行中的请求。',
        runs: '运行生命周期：按结果统计的创建和完成数量、各阶段耗时、取消、结构化输出校验和修复。',
        agents: '各智能体的性能：调用次数、运行时间和排队时间百分位、首个令牌时间、流式输出时间、结果和防护触发。',
        models: '按模型和智能体统计的令牌用量与成本：输入、输出、缓存和推理令牌、成本以及输出吞吐量。',
        workers: '工作节点：租约、每个节点的运行、完成报告、心跳、空闲槽位以及对控制平面的调用。',
        kubernetes: '每次运行一个 Pod 的执行器：创建和删除的 Job、Pod 启动延迟、按原因统计的 Pod 失败以及孤立 Job 清理。',
        protocols: 'MCP、A2A 与流式传输：工具调用及耗时、会话、A2A 方法与任务状态、SSE 流、WebSocket 和委派。',
        scheduler: '调度：按智能体和运行框架统计的队列深度、认领结果与延迟、租约长轮询、被阻塞的运行和过期租约。',
        database: '数据库：按操作和表统计的语句延迟、错误、使用中的连接、写锁等待和保留清理。',
        controlPlane: '控制平面副本：状态、领导者变更、背板流量与延迟、心跳以及后台服务的迭代。',
        security: '按方案和原因统计的认证失败、授权拒绝、速率限制、签发的令牌、密钥解密以及 Codex 令牌刷新。',
        integrations: '按服务统计的出站调用：MCP 服务器测试、可观测性探测、MCP 代理、Kubernetes API 以及工作节点对控制平面的调用。',
        logs: '按组件和租户统计的日志量、错误与警告、最近的错误行以及追踪链接。'
      },
      observabilityDocs: '在新标签页中打开遥测指南：如何采集 Garrison 指标并连接 Grafana、Prometheus、Tempo 或 Loki。',
      observability: '指向此环境报告为已配置的指标、仪表板和追踪工具的链接。未配置的服务不会显示。',
      kpis: {
        agents: '此租户中定义的智能体。点击可打开智能体列表。',
        deployments: '所有智能体的部署。每个部署都是智能体的一种运行方式。点击可打开它们。',
        activeRuns: '当前在工作节点上已租用或正在运行的运行。点击可查看。',
        queued: '正在等待工作节点的运行。数字持续增长说明你需要更多节点或容量。',
        succeeded: '过去 24 小时内成功完成的运行。点击可列出它们。',
        failed: '过去 24 小时内失败的运行。点击可列出它们并查看原因。',
        nodes: '可以接收运行的工作节点数与已注册节点总数。点击可管理它们。',
        controlNodes: '处于就绪状态的控制平面副本数，以及已注册副本的总数（离线行会在列表中保留 24 小时）。领导者是 {{leader}}。点击可打开机群 > 控制平面。',
        controlNodesNoLeader: '处于就绪状态的控制平面副本数，以及已注册副本的总数（离线行会在列表中保留 24 小时）。目前没有副本持有领导者租约，因此集群维护已暂停。点击可打开机群 > 控制平面。'
      },
      openFailure: '打开此失败的运行，查看其对话记录、错误和 stderr。',
      openControlPlane: '打开机群 > 控制平面，查看每个副本的状态、领导者、版本、心跳和活动。',
      openWorkers: '打开机群 > 工作节点，查看每个工作节点的容量、Harness 和心跳，并可封锁或排空它。',
      cta: {
        invoke: '从浏览器向任意智能体发送消息。',
        addAgent: '前往智能体页面创建新的智能体身份。',
        applyManifest: '以 YAML 形式应用配置，例如一个示例智能体。',
        inspectRuns: '使用筛选条件和遥测数据浏览所有运行。',
        nodes: '查看哪些工作节点已就绪，以及它们能运行什么。',
        apiExplorer: '针对此服务器实时试用任意 API 调用。',
        analytics: '查看运行速度、Token、成本和结果随时间的变化。'
      },
      services: {
        loki: '在新标签页中打开 Loki，搜索 Garrison 日志。',
        grafana: '在新标签页中打开 Garrison 指标的 Grafana 仪表板。',
        prometheus: '在新标签页中打开抓取 Garrison 指标的 Prometheus 服务器。',
        tempo: '在新标签页中打开 Tempo 浏览链路追踪。'
      },
      serviceGeneric: '在新标签页中打开此捆绑服务。'
    },
    runDetail: {
      openApproval: '打开此审批的详情，查看完整的工具输入、匹配的规则和决定。',
      reviewApprovals: '显示此运行的审批，你可以在其中允许或拒绝待处理的工具调用。',
      approvalActions: '允许或拒绝待处理的工具调用，或打开审批查看所有字段。',
      viewTrace: '在新标签页中用 Grafana Explore (Tempo) 打开此运行的追踪。它显示服务器和工作节点上的编译、领取和 Harness 跨度。',
      viewLogs: '在新标签页中用 Grafana Explore (Loki) 打开服务器和工作节点上与此运行相关的日志行，范围限于此运行的时间段。',
      traceId: '编译此运行时所在追踪的 W3C 追踪 ID。可在 Tempo 中搜索，或使用“查看追踪”。在开始记录追踪 ID 之前创建的运行为空。',
      eventCode: '以你的语言显示 Garrison 在此写入的消息类型。旁边的文本是服务器或工作节点发出的原始消息。',
      openTemplate: '打开模板 {{name}}。此运行使用了第 {{version}} 版；“版本”标签页会显示该内容及其与当前版本的差异。',
      templatesUsed: '编译此运行时使用的提示词模板的确切版本。点击某一项可打开该模板并比较版本。',
      live: '事件正随着 Harness 的产生从服务器实时流式传输。',
      viewJson: '以 JSON 形式显示完整的运行记录，包括所有遥测字段。',
      deployment: '为此运行选中的部署，按名称指定或按流量权重选择。',
      model: 'Harness 上报的实际使用模型，可能与部署所请求的模型不同。',
      tokens: '整个运行的输入和输出 Token。下方的遥测面板中有完整明细。',
      caller: '启动运行的一方：用户、访问密钥或另一个智能体的运行。',
      parent: '当智能体调用另一个智能体时，委派给此运行的那个运行。',
      openParent: '打开委派此工作的父运行。',
      attempt: '这是第几次尝试，以及部署允许的最大尝试次数。',
      outputSchema: '最终输出是否符合智能体的输出 JSON Schema。如果不符合且 Harness 可以恢复其会话，Garrison 会在同一会话中发送一次修复提示。记录中的警告事件会列出验证错误。',
      created: '请求运行的时间。',
      started: 'Harness 进程在工作节点上启动的时间。',
      completed: '运行达到最终状态的时间。',
      exitCode: 'Harness 进程的退出码。是否成功通常依据最终事件判断，而不是此退出码。',
      tabs: {
        approvals: '此运行请求权限的工具调用、每个调用的决定方式，以及针对待处理调用的“允许”和“拒绝”。',
        transcript: 'Harness 产生的每个事件：助手文本、思考、工具调用及结果，以及用量。',
        result: '最终答案以及所有结构化输出。',
        input: '调用方发送的内容、参数，以及所用提示词模板的确切版本。',
        stderr: 'Harness 标准错误输出的最后一部分，机密已被清除。运行失败时请查看这里。',
        children: '此运行通过调用其他智能体启动的运行。'
      },
      eventFilter: '只显示一种类型的事件，例如工具调用或错误。',
      openChild: '打开此子运行，它是在此运行调用另一个智能体时启动的。',
      eventCodes: {
        ApprovalRequested: 'Harness 在工具调用前发出询问，该调用正在等待人员处理。请在“审批”标签页中决定。',
        ApprovalDecided: '一个权限请求已由规则、部署默认设置、人员或超时决定。文本中注明了具体方式。',
        RunGuardTriggered: '运行防护停止了此运行。消息说明是哪种防护触发以及它检测到了什么；运行以该防护的结果失败结束，并保留部分输出。',
        ConversationFallback: '这一轮无法恢复对话的 Harness 会话，因此以先前各轮的记录开始了全新会话。消息中说明了原因。',
        ConversationStateLost: '节点领取了这一轮，但对话的目录已不存在，因此这一轮被放回队列，以回退方式运行。'
      },
      conversation: '此运行所属的对话及其轮次。点击可打开该对话。',
      openConversation: '打开对话，查看所有轮次并发送下一轮。',
      conversationSession: '这一轮是恢复了对话的 Harness 会话，还是根据记录开始了全新会话，以及原因。',
      resumeSessionId: '这一轮所恢复的 Harness 会话，由上一轮留下。',
      affinityNode: '保存对话目录的节点。在所示时间之前，其他节点不会领取这一轮，除非该节点不再就绪。'
    },
    agentDetail: {
      name: '调用方调用此智能体时使用的名称。',
      viewJson: '以 JSON 形式显示完整的智能体记录。',
      invoke: '打开“调用”页面并选中此智能体。除非你指定部署，否则会按权重选择部署。',
      grafana: '在新标签页中打开按此智能体筛选的 Grafana 智能体仪表板：调用次数、运行时间百分位、首个令牌时间、流式输出时间、令牌、成本和防护触发。',
      id: '用于 API 调用的智能体标识符。',
      tabs: {
        deployments: '此智能体的运行方式，包括各自的权重以及每个部署获得的流量份额。',
        runs: '此智能体最近的运行。',
        card: '其他智能体读取以发现此智能体的 A2A 智能体卡片。'
      },
      addDeployment: '前往部署页面为此智能体创建部署。没有部署它就无法运行。',
      manageDeployments: '打开“部署”标签页以编辑权重、模型和绑定。',
      openRun: '打开此运行的对话记录和遥测数据。',
      columns: {
        name: '部署名称。调用方可以显式指定它，以绕过按权重的选择。',
        harness: '为此部署启动 CLI 的 Harness 配置文件。',
        model: '此部署要求 Harness 使用的模型。',
        weight: '在部署上设置的原始流量权重。',
        traffic: '此部署获得的调用份额：其权重除以所有已启用部署的权重之和。',
        active: '只有已启用的部署才会接收按权重分配的流量。'
      },
      conversations: '打开按此智能体筛选的对话列表。'
    },
    queue: {
      queued: '正在等待节点的运行。点击可列出它们。',
      leased: '已被节点认领但尚未开始的运行。点击可列出它们。',
      running: '正在执行的运行。点击可列出它们。',
      agent: '等待中的工作所属的智能体。',
      harness: '这些运行所需的 Harness。只有声明支持它的节点才能接收这些运行。'
    },
    invoke: {
      stream: {
        tabs: {
          preview: '在回答流式输出时实时查看，以 Markdown 格式显示，并包含推理过程和工具调用。运行进行中时默认选中。',
          response: '运行的最终结果：结果文本（格式化或原始）、结构化输出、结果、错误、遥测数据和链接。'
        },
        live: '运行正在进行。输出通过实时事件流到达时，此视图会随之更新。',
        finished: '运行已结束，不会再有输出。最终结果在“响应”选项卡中。',
        elapsed: '自你点击“发送”以来的时间，在浏览器中测量。运行结束时停止计时。',
        firstToken: '从“发送”到首个流式输出（文本或推理）的时间，在浏览器中测量，因此包括排队和 Harness 启动时间。运行页面显示工作节点测量的值。',
        tokensPerSecond: '流式输出期间每秒的输出 Token 数，根据 Harness 报告的用量计算。运行结束后显示服务器测量的速率。',
        codexNote: 'Codex 只在每条消息完整后才输出（codex exec --json），因此不会逐个 Token 流式输出。它工作期间已用时间会持续计时。',
        showResponse: '切换到“响应”选项卡，查看最终结果、结构化输出和遥测数据。',
        reasoning: '模型在回答之前或之间产生的思考文本。默认折叠，点击即可展开。',
        jump: '滚动到最新输出，并在新输出到达时继续跟随。',
        tool: {
          running: '智能体调用了工具 {{name}}，正在等待其结果。',
          ok: '工具 {{name}} 已返回结果，没有错误。',
          failed: '工具 {{name}} 返回了错误。智能体可能会重试，或在没有它的情况下继续。'
        }
      },
      applySample: '前往清单页面，那里的示例清单会创建一个可以立即试用的智能体。',
      agent: '要调用的智能体。只列出已启用的智能体。',
      deployment: '保持“任意启用的部署（按权重）”可让 Garrison 按流量权重选择，或选择某个部署直接测试它。',
      parameter: '{{name}} 的按运行取值。该部署允许调用方覆盖它；留空则使用默认值。',
      message: '你希望智能体做什么。它会作为运行输入发送，并由任务模板包装。',
      send: '用这条消息启动一个运行，并在这里流式显示其对话记录。',
      openRun: '打开完整的运行页面，查看结果、遥测数据和 stderr。',
      stopOnLeave: '开启后，当你离开此页面、关闭标签页或发送新消息时，Garrison 会取消正在进行的运行，避免为没人阅读的输出付费。关闭后运行会继续，并保留在运行页面上。此选择保存在当前浏览器中。',
      cancel: '立即停止此运行。工作节点会在几秒内结束 Harness 进程，已保留到目前为止的输出。',
      cancelling: '已请求取消。工作节点正在停止 Harness；运行报告已取消后，这里会显示最终状态。',
      sendReplaces: '先取消正在进行的运行，再用这条消息开始新的运行。若要让当前运行继续，请关闭“离开时停止运行”。',
      sendKeeps: '用这条消息开始新的运行。由于“离开时停止运行”已关闭，正在进行的运行会继续；可在运行页面找到它。',
      timeLimit: '此运行的可选截止时间（秒），此部署允许调用方设置。留空则使用部署默认值。超过限制时运行会超时。',
      timePreset: '将此运行的时间限制设为 {{value}}。',
      timePresetClear: '清除时间限制，让运行使用部署默认值。',
      conversation: {
        mode: '运行一次；开始一个新对话，其后续各轮会恢复此 Harness 会话；或者发送现有对话的下一轮。',
        pick: '要继续的对话。只列出此智能体的对话，最新的排在前面。',
        deploymentPinned: '对话始终使用第一轮的部署，因此继续对话时部署是固定的。',
        open: '打开此运行所属的对话，查看所有轮次并发送下一轮。'
      }
    },
    manifests: {
      planned: '应用此文档会执行的操作：创建记录、更新记录或保持不变。试运行只做验证，不会更改任何内容。',
      changes: { after: '清单要设置的值。过长的值会在 200 个字符处截断。', before: '当前存储的值。过长的值会在 200 个字符处截断。', field: '清单要更改的此记录的设置，例如 model 或 parameters.model。' },
      results: '应用操作对清单中每个文档的处理结果。',
      kind: '文档所描述的记录类型，例如 Agent 或 Deployment。',
      name: '文档元数据中的记录名称。',
      result: '文档是创建、更新了记录，还是保持记录不变，或是失败。',
      message: '服务器返回的详细信息，例如验证错误。',
      tabs: {
        apply: '粘贴或上传清单，通过试运行进行验证，然后应用它。',
        export: '将此租户的配置下载为清单。永远不会包含机密值。',
        history: '过去的每次应用和试运行，以及每个文档的结果。'
      },
      upload: '从你的计算机将 YAML 或 JSON 清单文件加载到编辑器中。',
      loadSample: '用示例清单替换编辑器内容：一个运行在模拟 Harness 上的 echo 智能体。',
      document: '一个或多个以 --- 分隔的 YAML 或 JSON 文档。记录之间通过名称相互引用。',
      dryRun: '验证每个文档并显示将会发生的更改，不写入任何内容。',
      apply: '验证并写入每个文档。任何一个文档失败，都不会写入任何内容。',
      export: '生成一个可以重建此租户配置的清单。',
      download: '将导出的清单保存为 YAML 文件。',
      confirmApply: '立即将清单写入此租户。'
    },
    templateEditor: {
      cloneName: '副本名称。建议使用小写字母、数字、连字符和斜杠；builtin/ 前缀为保留前缀。',
      cloneConfirm: '以此名称创建副本并在编辑器中打开。',
      clone: '创建此模板的可编辑副本。创建前可以为副本命名。',
      reset: '将此内置模板恢复为 Garrison 自带的内容。',
      delete: '删除此模板及其所有版本。只要有部署绑定它，服务器就会拒绝；确认对话框会列出这些部署。',
      create: '创建模板及其第一个版本。',
      save: '将内容保存为新版本。跟随最新版本的部署会在新的运行中使用它。',
      content: '模板文本。可以使用 {{variables}}、条件、循环和包含；预览会随输入实时更新。',
      changeNote: '随版本保存的简短说明，解释改了什么以及为什么改。',
      tabs: {
        preview: '使用示例上下文渲染模板，准确查看 Harness 会收到什么。',
        versions: '所有已保存的版本，支持对比差异和恢复。'
      },
      sampleContext: '代替真实运行数据的 JSON。编辑它可以查看模板如何响应。',
      columns: {
        version: '版本号。数字越大越新。',
        note: '随版本保存的变更说明。',
        author: '保存此模板版本的人。',
        saved: '版本的保存时间。'
      },
      diff: '将此版本与编辑器中的当前内容进行比较。',
      restore: '将此版本重新设为当前版本。当前内容会保留在历史记录中。'
    },
    serverInfo: {
      rest: 'REST API 调用和 SDK 使用的基础地址。',
      mcp: 'MCP 客户端连接的地址。每个作为工具公开的智能体都会出现在那里。',
      a2a: '此租户的 A2A 网关基础地址。每个智能体在其下都有自己的卡片。',
      openapi: '描述所有 REST 操作的 OpenAPI 文档。',
      version: 'Garrison 服务器的版本。',
      dashboardVersion: '此控制台的版本。',
      node: '响应此页面服务器信息请求的控制平面副本（控制节点）。有多个副本时，重新加载后可能由另一个副本响应。',
      nodeLink: '打开机群 > 控制平面，将此副本与其他副本放在一起查看，包括状态、心跳以及它是否为领导者。',
      database: '服务器使用的数据库引擎。',
      health: '服务器健康检查的结果。',
      replicas: '集群预期的控制平面副本数量。',
      routes: '服务器注册的 API 操作数量。',
      serverTime: '服务器时钟。与你的时钟相差过大可能导致签名请求失败。',
      principalName: '你当前登录所用的身份。',
      principalType: '你是以用户身份登录还是使用访问密钥登录。',
      role: '你的最高访问级别。',
      tenant: '你的会话所属的租户。',
      expires: '你的会话结束、需要重新登录的时间。',
      rawJson: '显示服务器信息的原始响应。'
    },
    requests: {
      grafana: '在新标签页中打开 Grafana 的 HTTP 仪表板：基于 Prometheus 指标的请求速率、延迟和错误随时间的变化。',
      kpis: {
        total: '服务器在所选时间范围和筛选条件下保留在历史记录中的请求。',
        success: '返回 2xx 或 3xx 状态的请求。',
        failure: '返回 4xx 或 5xx 状态的请求。',
        avgDuration: '服务器响应的平均耗时。'
      },
      columns: {
        time: '请求到达的时间。',
        method: '请求的 HTTP 方法。',
        path: '被调用的路径。将鼠标悬停在值上可查看完整内容。',
        status: '服务器返回的 HTTP 状态。',
        duration: '服务器响应所用的时间。',
        principal: '发出请求的一方：用户、访问密钥或运行令牌。'
      },
      viewDetails: '打开请求，查看请求头、请求体和耗时。',
      viewJson: '打开请求记录，包括其原始 JSON。',
      deleteOne: '从历史记录中移除此请求。',
      bulkDeleteAll: '删除所有符合当前筛选条件的请求，而不仅是本页的请求。'
    },
    explorer: {
      operations: '选择一个按领域分组的 API 操作。下方的表单会根据其参数自动调整。',
      pathParam: '路径参数 {{name}}（{{type}}）。它会被代入 URL 中。{{description}}',
      queryParam: '查询参数 {{name}}（{{type}}）。填写后会附加到 URL 上。{{description}}',
      copyUrl: '复制完全解析后的请求 URL。',
      headerName: '请求头的名称。Authorization 会根据你的会话自动添加。',
      headerValue: '为此请求头发送的值。',
      removeHeader: '从请求中移除此请求头。',
      addHeader: '再添加一个请求头。',
      body: '用于创建或修改记录的操作的 JSON 请求体。',
      execute: '立即使用你的会话将请求发送到服务器。破坏性方法会先请你确认。',
      stop: '中止请求，或停止读取流式响应。',
      snippets: {
        curl: '以 curl 命令表示的相同请求，可在终端中使用。',
        fetch: '以 JavaScript fetch 代码表示的相同请求。',
        csharp: '以 C# HttpClient 代码表示的相同请求。'
      },
      clearHistory: '清除此浏览器中保存的所有最近请求。',
      loadHistory: '将此请求重新加载到表单中。',
      deleteHistory: '从最近请求列表中移除此条目。',
      confirmExecute: '即使此请求可能修改或删除数据，仍然发送它。'
    },
    settings: {
      settingPath: '设置路径：{{path}}。在设置文件和设置 REST API 中使用此名称。',
      viewJson: '显示原始的设置响应。',
      restart: '重启此控制平面副本，使需要重启的设置生效。',
      save: '保存所有已更改的设置。实时设置会立即生效；其他设置需等待重启。',
      groupGeneric: '{{group}} 组中的设置。',
      fieldGeneric: '服务器设置 {{path}}。',
      applyLive: '保存后立即生效。',
      applyRestart: '服务器重启后生效。',
      source: {
        File: '当前在设置文件中设置。在这里保存会更新该文件。',
        Environment: '由环境变量设置，其优先级高于在这里保存的任何值。',
        ConfigMap: '由 Kubernetes ConfigMap 管理。请改为在你的清单中修改。',
        Database: '作为集群设置存储在数据库中，由所有副本共享。'
      },
      sourceGeneric: '当前值的来源。',
      testDatabase: '在保存之前，先尝试使用上面的数据库设置进行连接。',
      groups: {
        Observability: 'Grafana、Prometheus、Loki 和 Tempo 的地址。浏览器 URL 用于首页卡片和 Grafana 链接；服务器使用内部 URL 检查可访问性。为空表示未配置。',
        Runtime: '控制平面如何限制运行：运行的最长时间、部署遵循的运行防护默认值，以及排队的运行可以等待合适工作节点多久。',
        Rest: 'REST API 的监听方式：主机、端口、TLS 和公开地址。',
        Mcp: 'MCP 服务器的监听方式，以及工具调用可以等待多久。',
        Database: 'Garrison 使用哪个数据库以及如何连接。',
        Logging: '日志的输出位置和详细程度。',
        Auth: '令牌签名、有效期和登录速率限制。',
        Security: '加密主密钥和初始引导账户。',
        RequestHistory: '是否捕获 API 请求，以及每个请求体保留多少内容。',
        Telemetry: '指标和链路追踪导出。',
        Archive: '保留策略删除运行和事件之前，将其归档到的位置。',
        Cluster: '预期的控制平面副本数量。',
        Scheduling: '工作节点的租约时长和心跳超时。',
        Runs: '运行的默认值，以及运行和事件的保留时长。',
        Audit: '审计记录的保留时长。'
      },
      fields: {
        Runtime: {
          MaxRunSeconds: '任何运行可以持续的最长时间（秒）。超过此值的部署超时、每次运行的时间限制和配置文件默认值都会被降到此值。',
          RepetitionGuard: '对于重复防护留空的部署，是否停止回答退化为重复的运行（结果为检测到重复）。',
          MaxAssistantChars: '对于限制留空的部署，运行在助手文本达到多少字符后停止（结果为超出输出限制）。0 表示不限制。',
          NoProgressSeconds: '对于限制留空的部署，运行在没有文本、思考或工具活动多少秒后停止（结果为无进展）。0 表示关闭。',
          ConversationAffinityWaitMs: '对话的一轮等待保存其 Harness 会话的节点的时长，超时后由其他节点领取并根据记录开始全新会话。若该节点未就绪，其他节点会立即领取。0 表示从不等待。',
          ConversationTranscriptTurns: '回退到全新 Harness 会话的对话轮次最多接收的先前轮数，保留最新的轮次。',
          ConversationTranscriptChars: '回退的一轮所接收的每条先前消息和回答的最大字符数，超出部分会被截断并标记。'
        },
        Scheduling: {
          PauseGraceMs: '主机休眠或虚拟机暂停后，领导者会等待一个心跳窗口再加上这些毫秒，然后才将节点标记为丢失或让其运行失败。默认值为 5000。'
        }
      }
    },
    runGuard: {
      openDeployments: '前往部署页面，修改部署的运行防护：重复防护、最大助手字符数和无进展超时。',
      openSettings: '前往设置页面，修改没有自身运行防护的部署所遵循的集群默认值（运行时）。'
    },
    conversationDetail: {
      viewJson: '以 JSON 显示完整的对话记录。',
      openInvoke: '打开“调用”并选中此对话，以完整的流式视图发送下一轮。',
      delete: '删除此对话。它的各轮会作为普通运行保留在“运行”页面，但对话将无法再继续。',
      deleteBusy: '仍有未完成的一轮，因此在该运行结束或被取消之前，服务器会拒绝删除此对话。',
      agent: '此对话的智能体。点击可打开该智能体。',
      openAgent: '打开此智能体的页面，查看其部署和最近的运行。',
      deployment: '每一轮都在此部署上运行，即第一轮被路由到的部署。',
      activeRun: '仍在排队或运行中的一轮。在其结束之前，下一条消息会被拒绝。',
      openRun: '打开此运行的页面，查看完整记录、结果和遥测数据。',
      turns: '对话的所有轮次，按时间从早到晚排列。每一轮都是一次运行。',
      columns: {
        turn: '该轮在对话中的位置，从 1 开始。',
        run: '执行这一轮的运行。点击可打开其记录。',
        status: '该轮运行所处的生命周期阶段：排队、运行中或某个结束状态。',
        outcome: '该轮运行结束的原因，比状态更详细。',
        session: '该轮是恢复了上一轮的 Harness 会话，还是以记录开始了全新会话（以及原因）。',
        input: '这一轮所发送消息的开头。悬停可查看更多内容。',
        result: '回答的开头；运行失败时为错误信息。悬停可查看更多内容。',
        node: '运行这一轮的工作节点。',
        created: '这一轮的发送时间。将鼠标悬停在值上可查看确切时间。'
      },
      session: {
        first: '第一轮：它开始后续各轮将恢复的 Harness 会话。',
        resumed: '这一轮在保存对话目录的节点上恢复了 Harness 会话 {{session}}，因此智能体保留了完整的上下文。',
        fallback: '这一轮无法恢复会话，因此以先前各轮的记录开始了全新的 Harness 会话。',
        pending: '这一轮正在等待节点，因此尚不知道它会恢复会话还是回退。'
      },
      continueTitle: '将下一条消息作为此对话的下一轮发送。它使用相同的智能体和部署运行。',
      message: '发给智能体的下一条消息。它会结合先前各轮的上下文继续对话。',
      send: '将此消息作为下一轮发送。这一轮会出现在上方列表中，并持续刷新直到结束。',
      sendBusy: '上一轮仍未完成。在其结束之前服务器会拒绝新的一轮，请等待或先将其取消。'
    }
  },
  analytics: {
    grafana: '在新标签页中打开 Grafana 的 Runs 仪表板，时间范围与本页相同。',
    filters: {
      ttft: '勾选后，首 Token 时间图表会去掉运行等待委派智能体的时间，从而公平比较会委派的智能体和直接回答的智能体。',
      range: '所有图表和汇总的时间范围：最近一小时、一天、一周、30 天，或自定义的开始和结束时间。',
      from: '自定义范围的开始时间，按你的本地时区。',
      to: '自定义范围的结束时间，按你的本地时区。',
      agentId: '只统计此智能体的运行。部署列表会缩小为该智能体的部署。',
      harnessType: '只统计由此 Harness 执行的运行。',
      deploymentId: '只统计此部署的运行，例如用于比较同一智能体的两个模型。',
      model: '只统计 Harness 上报使用此模型的运行。列表显示所选范围内出现过的模型。',
      groupBy: '将每个图表按智能体、Harness、模型或 Harness 与模型组合拆分为多个系列，便于比较。'
    },
    cards: {
      delegationWait: '运行等待其委派子运行的平均时间。如果范围内没有运行进行委派，则为不适用。',
      ttftExcludingDelegation: '不含等待委派智能体时间的平均首 Token 时间。备注显示第 95 百分位数。',
      runs: '在此范围内请求且符合筛选条件的运行。',
      successRate: '成功运行占已结束运行（成功、失败、已取消和已超时）的比例。',
      ttft: '产生了输出的运行的平均首个 Token 时间。备注中显示第 95 百分位数。',
      execution: 'Harness 的平均执行时间。备注中显示第 95 百分位数，它反映了较慢的运行。',
      queue: '运行等待工作节点的平均时间。',
      tokens: '此范围内所有运行的输入 Token 与输出 Token 之和。',
      throughput: '流式输出期间每秒的平均输出 Token 数。',
      cost: '上报的总成本（美元）。',
      toolCalls: '此范围内运行发起的工具调用总数。'
    },
    charts: {
      outcomes: '每个时间区间内运行的结束情况。将鼠标悬停在柱形上可查看数量。',
      ttft: '运行产生首个 Token 所用的时间：平均值、中位数和第 95 百分位数。',
      duration: '模型流式输出的时长，以及 Harness 运行的总时长。',
      queue: '运行在被节点租用之前等待的时长。',
      tokens: '每个区间消耗的 Token，按类型拆分。',
      throughput: '输出生成速度，以每秒 Token 数计。',
      cost: '每个区间上报的花费。',
      toolCalls: '每个区间发起的工具调用。',
      usageTokens: '输入与输出 Token 随时间的变化，每个 Harness 与模型组合为一个堆叠段。将鼠标悬停在柱形上可查看拆分。',
      usageCost: '上报成本随时间的变化，每个 Harness 与模型组合为一个堆叠段。将鼠标悬停在柱形上可查看拆分。'
    },
    metrics: {
      delegationWaitMsAvg: '运行等待其委派子运行的平均时间。点击可隐藏或显示此折线。',
      timeToFirstTokenExcludingDelegationMsP95: '不含委派等待的首 Token 时间第 95 百分位数。点击可隐藏或显示此折线。',
      timeToFirstTokenExcludingDelegationMsP50: '不含委派等待的首 Token 时间中位数。点击可隐藏或显示此折线。',
      timeToFirstTokenExcludingDelegationMsAvg: '不含委派等待的平均首 Token 时间。点击可隐藏或显示此折线。',
      runs: '此区间内请求的运行。',
      succeeded: '成功完成的运行。点击可隐藏或显示此系列。',
      failed: '失败的运行。点击可隐藏或显示此系列。',
      cancelled: '被取消的运行。点击可隐藏或显示此系列。',
      timedOut: '达到截止时间的运行。点击可隐藏或显示此系列。',
      inputTokens: '发送给模型的输入 Token。点击可隐藏或显示此系列。',
      outputTokens: '模型生成的输出 Token。点击可隐藏或显示此系列。',
      cachedTokens: '由提示词缓存提供的输入 Token。点击可隐藏或显示此系列。',
      reasoningTokens: '推理 Token（需 Harness 上报）。点击可隐藏或显示此系列。',
      totalTokens: '每个区间内运行的输入 Token 与输出 Token 之和。',
      costUsd: '上报的成本（美元）。',
      toolCalls: '每个区间内运行发起的工具调用。点击可隐藏或显示此系列。',
      timeToFirstTokenMsAvg: '此区间内首个 Token 时间的平均值。点击可隐藏或显示此折线。',
      timeToFirstTokenMsP50: '首个 Token 时间的中位数：一半的运行比它更快。点击可隐藏或显示此折线。',
      timeToFirstTokenMsP95: '首个 Token 时间的第 95 百分位数：每 20 个运行中只有 1 个更慢。点击可隐藏或显示此折线。',
      streamingMsAvg: '平均流式输出时间，从模型第一次输出到最后一次输出。点击可隐藏或显示此折线。',
      executionMsAvg: 'Harness 的平均执行时间，从进程启动到退出。点击可隐藏或显示此折线。',
      executionMsP95: '执行时间的第 95 百分位数。点击可隐藏或显示此折线。',
      queueMsAvg: '从进入队列到被租用的平均时间。',
      outputTokensPerSecondAvg: '流式输出期间每秒的平均输出 Token 数。'
    },
    groupSeries: {
      none: '{{name}}：{{metric}}。',
      agent: '智能体 {{name}} 的运行：{{metric}}。点击可隐藏或显示此系列。',
      harness: '在 {{name}} Harness 上的运行：{{metric}}。点击可隐藏或显示此系列。',
      model: '由模型 {{name}} 提供服务的运行：{{metric}}。点击可隐藏或显示此系列。',
      harnessModel: '在 {{name}}（Harness / 模型）上的运行：{{metric}}。点击可隐藏或显示此系列。'
    },
    otherSeries: '最繁忙的几组之外的所有分组之和。点击可隐藏或显示它。',
    dataTable: '以表格形式显示此图表背后的数据，每个时间区间一行。',
    bucketStart: '时间区间的开始时间。每行对应一个区间。',
    usage: '按 Harness 和模型拆分的用量随时间变化，不受上方分组设置的影响，并附有整个范围的合计。',
    breakdown: '所选范围内每个 Harness 与模型组合的合计。用它查看是哪个模型带来了你的 Token 用量和成本。',
    breakdownColumns: {
      harness: '执行这些运行的 Harness。',
      model: 'Harness 上报所使用的模型。“未知模型”表示 Harness 没有上报模型。',
      runs: '此范围内在该 Harness 和模型上的运行。',
      inputTokens: '这些运行发送给模型的输入 Token。',
      outputTokens: '模型在这些运行中生成的输出 Token。',
      cachedTokens: '这些运行中由提示词缓存提供的输入 Token。',
      reasoningTokens: '推理 Token，适用于单独上报它们的 Harness。',
      costUsd: '这些运行上报的总成本（美元）。',
      timeToFirstTokenMsAvg: '平均首个 Token 时间，按每个时间区间内的运行数加权。'
    }
  },
  export: {
    menu: '下载 {{name}}：以 CSV 或 JSON 格式下载数据，或将图表下载为 PNG 或 SVG 图像，包含标题、图例、筛选条件和时间范围。',
    csv: '以 CSV 格式下载此视图背后的确切数据：每个区间或每条记录一行，时间戳为 ISO 8601 UTC，数字使用普通的点号小数格式。',
    png: '将图表下载为两倍屏幕分辨率的 PNG 图像，包含标题、图例、当前筛选条件和时间范围。',
    svg: '将图表下载为可缩放的 SVG 图像，包含标题、图例、当前筛选条件和时间范围。',
    json: '以 JSON 格式下载数据，将系列、区间、筛选条件和时间范围放在一个文档中。'
  }
};

const explainers = {
  approvals: {
    title: '审批的工作原理',
    p1: '启用了审批的部署会让其 Harness 在工具调用前询问 Garrison：Claude Code 通过其权限提示工具询问，Codex app-server 运行则针对命令和文件更改询问。',
    p2: '每个请求都会根据部署的规则进行检查。拒绝优先于询问，询问优先于允许；没有匹配项时，采用部署默认设置。允许和拒绝会立即答复；询问会将请求放到这里，运行随之等待。',
    p3: '可附带可选原因来允许或拒绝待处理的请求。“记住为规则”会向部署添加一条规则，下次类似的调用将自动决定。无人决定的请求会按部署的超时决定过期。'
  },
  diagram: {
    label: '示意图：调用方按名称调用智能体，Garrison 按权重选择该智能体的一个部署，再由该部署的绑定决定运行如何执行。',
    caller: { title: '调用方', body: 'REST、MCP、A2A 或其他智能体', tip: '任何调用智能体的一方：REST API、MCP 客户端、A2A 智能体，或另一个智能体的运行。调用方只知道智能体的名称。' },
    agent: { title: '智能体', body: '名称、描述、公开方式、委派、输出 Schema', tip: '可寻址的身份。调用方按名称调用它；它说明智能体是什么以及如何公开，而不是如何运行。' },
    deploymentA: { title: '部署 A，权重 300', body: 'Claude Code，sonnet', tip: '运行此智能体的一种方式。权重 300 对比 100，它会获得未指定部署的调用中的 75%。' },
    deploymentB: { title: '部署 B，权重 100', body: 'Mux，本地模型', tip: '运行同一智能体的另一种方式。调用方也可以显式指定它，以绕过按权重的选择。' },
    binds: { title: '每个部署绑定', body: 'Harness 配置文件、提示词、MCP 服务器、机密、工作区、节点池、限制', tip: '将请求转化为具体进程所需的一切：使用哪个 CLI、哪些提示词、哪些工具和凭据，以及可以在哪里运行。' },
    run: { title: '运行', body: '某个部署的一次执行', tip: '每次调用都会创建一个运行，它由所选部署编译而成，并在工作节点上执行。' }
  },
  agents: {
    title: '智能体与部署',
    p1: '智能体是调用方所使用的身份。它包含名称、描述、公开方式（A2A 卡片、MCP 工具）、是否可以调用其他智能体，以及其回答必须符合的输出 Schema。智能体本身不会运行任何东西。',
    p2: '部署是智能体的运行方式：使用哪个 Harness 配置文件和模型、哪些提示词模板、哪些 MCP 服务器和机密（通过别名）、什么工作区、哪个节点池，以及适用哪些限制和按运行参数。一个智能体可以有多个部署，每个部署都有一个流量权重。',
    p3: '有人调用智能体时，除非调用方指定了某个部署，否则 Garrison 会按权重从其已启用的部署中随机选择一个。这样你就可以让 Claude Code 版本和 Mux 版本并行运行，或者逐步把流量迁移到新模型。'
  },
  deployments: {
    title: '什么是部署',
    p1: '部署让智能体变得可以运行。它只属于一个智能体，并绑定一个 Harness 配置文件（启动哪个 CLI）、一个模型、每个角色的提示词模板、以别名引用的 MCP 服务器和机密、可选的工作区和制品存储、基于节点池或标签的调度放置，以及超时和并发等限制。',
    p2: '拥有多个已启用部署的智能体会按权重分配流量：权重 300 和 100 意味着每四次调用中有三次发往前者。未启用的部署不接收按权重分配的流量，但仍可被显式指定，这便于在为新配置分配权重之前先进行测试。',
    p3: '在部署上使用“编译预览”，即可查看运行将获得的确切命令行、文件和环境变量，而无需启动运行。'
  },
  agentDetail: {
    title: '此智能体如何运行',
    p1: '通过名称访问此智能体。下面的部署是它可以运行的具体方式。每个已启用的部署获得的流量份额等于其权重除以所有已启用部署的总权重；指定了部署的调用方会跳过按权重的选择。'
  },
  harnessProfiles: {
    title: 'Harness 配置文件与部署',
    p1: 'Harness 配置文件是某个命令行智能体的启动配方：可执行文件、参数模板、环境变量、要写入的文件、提示词和系统提示词的传递方式、它读取的 MCP 配置格式，以及如何将其输出解析为事件。',
    p2: '配置文件是共享的构建模块。部署选择一个配置文件，然后添加具体内容：模型、提示词、机密，以及仅适用于它的参数或环境变量覆盖。许多部署可以使用同一个配置文件，因此对配置文件的修复会同时作用于所有这些部署。',
    p3: '内置配置文件为只读。要修改，请先克隆一份。'
  },
  promptTemplates: {
    title: '提示词模板及部署如何使用它们',
    p1: 'Garrison 发送给 Harness 的每一段文本都是模板：系统提示词、包装调用方消息的外层文本、委派说明、工具描述以及生成的配置文件。模板使用 {{input.message}} 和 {{deployment.model}} 等变量，每次保存都会创建一个新版本。',
    p2: '部署将模板绑定到提示词角色（System、Task、DelegatedTask 等）。绑定要么跟随最新版本，要么固定某个版本，因此你可以编辑模板，而在你决定之前不会影响生产部署。每个运行都会记录它所使用的确切版本。'
  },
  mcpServers: {
    title: 'MCP 服务器与绑定',
    p1: '这里列出的 MCP 服务器是工具提供方：包括地址（stdio 服务器则为命令）、它所需的请求头或环境变量，以及必须存在的工具。注册服务器并不会自动将其提供给任何智能体。',
    p2: '部署绑定其智能体应使用的服务器，每个服务器都有一个别名。编译时，Garrison 会将它们写入 Harness 的 MCP 配置，并解析请求头中的机密引用；工作节点会在启动前检查必需的工具。当智能体可以委派时，Garrison 自己的 MCP 服务器会被自动添加。'
  },
  secrets: {
    title: '机密与别名',
    p1: '机密是经过加密的值，例如 API 密钥或令牌。该值只能写入：保存后你可以替换或轮换它，但任何人都无法通过控制台或 API 读取它。',
    p2: '部署以别名绑定机密。Harness 配置文件中的环境变量和文件随后引用 {{secret.alias}}，因此同一个配置文件可以在不同部署中使用不同的密钥。值只在编译运行时才被解密，通过 TLS 发送给工作节点，并会从日志中清除。'
  },
  workspaces: {
    title: '工作区',
    p1: '工作区模板描述每个运行开始时所在的目录：空目录、全新的 Git 克隆（私有仓库可选配凭据机密），或一组预置文件。保留策略决定运行结束后目录是删除还是保留。',
    p2: '一个部署可以绑定零个或一个工作区模板。每个运行都有自己的副本，因此运行之间永远看不到彼此的文件。'
  },
  modelPrices: {"title": "模型价格", "p1": "在执行器未报告费用时，使用操作员配置的美元费率进行估算。已报告费用（包括零）优先。", "p2": "不使用停用的价格。编辑或删除价格不会改变已保存的运行费用。"},
  usageQuotas: {"title": "使用配额", "p1": "租户、代理或部署的UTC每日运行数、令牌数、已知费用上限及当前并发上限。", "p2": "留空表示无限制，零表示禁止使用。每日计数在UTC午夜重置；并发计数为当前活跃运行数。 默认关闭。明确启用后才会在达到限制时拒绝运行，并降低支持的执行器预算。关闭时仅记录使用量，不影响执行。"},
  artifactStores: {
    title: '制品存储',
    p1: '制品存储是在运行的工作区删除后保存运行所产生文件的地方。一个部署可以绑定一个存储，运行结束时工作节点会将匹配的文件上传到那里。'
  },
  manifests: {
    title: '清单及其创建的记录',
    p1: '清单是以 YAML 或 JSON 文档编写的租户配置：机密（默认不含值）、提示词模板、Harness 配置文件、MCP 服务器、工作区模板、智能体和部署。文档之间通过名称相互引用，因此同一个清单可以用于任何租户。',
    p2: '应用清单会创建或更新普通记录，也就是你在其他标签页中看到的那些记录。应用两次不会产生任何变化。试运行会显示将要发生的更改而不写入任何内容，“导出”则生成一个可以重建此租户的清单。'
  },
  nodes: {
    title: '节点与节点池',
    p1: '节点是一个工作进程（通常是一个 Pod），它从控制平面拉取运行、启动 Harness，并将其事件流式传回。节点会自行注册、上报找到的 Harness 并发送心跳；你不需要在这里创建它们。',
    p2: '节点可以属于某个节点池并带有标签。部署使用节点池和标签选择器来决定其运行可以在哪里执行。封锁节点可停止新的工作，维护前请先排空节点。'
  },
  controlNodes: {
    title: '控制节点与工作节点',
    p1: '控制节点是 Garrison 服务器的一个副本。控制节点提供 REST API、MCP 服务器和 A2A 网关，验证调用方身份，将部署编译为运行，并调度这些运行。任何副本都能响应任何请求，因此负载均衡器可以在它们之间分配流量。',
    p2: '其中一个控制节点是领导者。它在数据库中持有一个租约，负责整个集群的维护：按保留期清理、将没有心跳的副本标记为离线，以及删除旧行。如果领导者停止，另一个副本会在几秒内接管租约。',
    p3: '工作节点（位于“工作节点”标签页）负责另一半工作：它们从控制平面拉取已租用的运行并执行 Harness。控制节点从不运行 Harness，工作节点也从不访问数据库。每个副本都会自行注册并每 5 秒发送一次心跳，因此此标签页是只读的。'
  },
  nodePools: {
    title: '节点池与节点',
    p1: '节点池是具名的工作节点分组，例如 GPU 机器或为某个客户保留的节点。节点在注册时加入节点池。节点池可以限定给特定租户使用。',
    p2: '指定了节点池的部署只在该节点池的节点上运行。未指定节点池的部署可以在任何符合条件的节点上运行。'
  },
  tenants: {
    title: '租户',
    p1: '租户是此服务器上相互隔离的组织。用户、访问密钥、智能体、机密和运行都属于某一个租户，租户之间互不可见。节点池和工作节点是共享的，除非某个节点池被保留给特定租户。'
  },
  users: {
    title: '用户与访问密钥',
    p1: '用户是使用电子邮件和密码登录的人员。访问密钥是自动化程序的登录方式。每个访问密钥都属于一个用户，其权限永远不会超过该用户。',
    p2: '两者都不会仅因存在就获得访问权限。访问权限来自用户上的管理员标志以及角色分配。'
  },
  credentials: {
    title: '访问密钥与用户',
    p1: '访问密钥是供脚本、SDK 和服务使用的访问密钥 ID 与私密密钥对。它属于某个用户。其有效权限是它自身角色分配所授予的权限与其所有者可执行操作的交集。',
    p2: '私密密钥只在创建或轮换密钥时显示一次。请定期轮换密钥，并删除长时间未使用的密钥。'
  },
  roles: {
    title: '角色、权限与分配',
    p1: '权限是一条单独的规则：允许或拒绝对某些资源类型（例如 Agent 或 Run）执行某些操作（例如 Read 或 Execute）。角色是具名的权限集合。拒绝始终优先于允许。',
    p2: '在分配角色之前，任何人的权限都不会改变。下一个标签页中的分配会将角色授予用户或访问密钥，范围可以是整个租户或单条记录。'
  },
  assignments: {
    title: '分配',
    p1: '一个分配将一个角色授予一个用户或访问密钥。租户范围将角色应用于所涵盖类型的所有记录；资源范围将其应用于单条记录，例如 CI 作业可以调用的那个智能体。',
    p2: '在用户或访问密钥上使用“有效权限”，可查看其所有分配合并后的结果。'
  },
  runs: {
    title: '运行与队列',
    p1: '运行是某个部署的一次调用。它会进入队列、被工作节点租用、执行，最后以结果、对话记录、最终答案以及遥测数据（例如首个 Token 时间、Token 数和成本）结束。',
    p2: '“队列”标签页显示同样这些运行在等待时的状态：已排队的运行需要具有正确 Harness 和调度放置条件的节点，已租用的运行已被认领，运行中的运行正在执行。长时间停留在队列中的运行说明容量不足，或者调度放置规则没有匹配任何节点。'
  },
  queue: {
    title: '队列',
    p1: '这里是尚未结束的运行的实时视图：等待节点、已租用或运行中，按智能体和 Harness 分组。它与“运行”标签页的数据相同，经过汇总以显示调度压力。',
    p2: '某个 Harness 的排队数不断增长，通常意味着没有就绪节点声明支持该 Harness、匹配的节点已满，或者部署要求的节点池或标签没有任何节点具备。'
  },
  invoke: {
    title: '调用时会发生什么',
    p1: '你按名称调用智能体。除非你选择了某个部署，否则 Garrison 会按权重从该智能体的已启用部署中选择一个，根据该部署允许的范围验证所有按运行参数，然后将运行加入队列。工作节点执行时，对话记录会在这里实时流式显示。'
  },
  audit: {
    title: '审计与请求历史',
    p1: '审计记录是安全和配置事件：登录、被拒绝的请求、机密和角色变更、清单应用以及节点状态变化。它们会按设置中的保留期限保存。',
    p2: '上一个标签页中的请求历史是原始的 HTTP 流量。用审计来回答“谁改了什么”，用请求历史来调试客户端实际发送了什么。'
  },
  requests: {
    title: '请求历史',
    p1: '此服务器捕获的每个 API 请求，包括方法、路径、状态、耗时、请求头和请求体（按配置的大小截断）。可用于调试集成和 SDK 调用。点击图表中的柱形可将表格缩小到该时间段。'
  },
  analytics: {
    title: '这些图表衡量什么',
    p1: '首个 Token 时间是从 Harness 进程启动到模型第一次输出，因此包含 CLI 的启动时间。流式输出时间是从模型第一次输出到最后一次输出，执行时间是从进程启动到退出。排队时间是运行等待工作节点的时长。这些数据由工作节点和服务器的时钟测量。',
    p2: 'Token 数和成本来自各 Harness 的上报。缓存 Token 是由提供商提示词缓存提供的输入 Token，推理 Token 仅对单独上报它们的 Harness 显示。每秒输出 Token 数等于输出 Token 数除以流式输出时间。',
    p3: '平均值会忽略无法测量该值的运行。百分位数反映的是长尾：p95 表示每二十个运行中只有一个更慢。按智能体或 Harness 分组，可以并排比较它们。'
  },
  conversations: {
    title: '对话与轮次',
    p1: '对话是与一个智能体进行的一系列运行。第一轮开始一个 Harness 会话；后续每一轮都在同一个工作节点上恢复该会话，因此智能体在消息之间保留其文件、工具和上下文。',
    p2: '同一时间只运行一轮：上一轮未完成时，新的消息会被拒绝。每一轮都使用第一轮的部署。',
    p3: '当某一轮无法恢复会话时（节点已不在或长时间被占用、文件已被删除、或 Harness 不支持恢复），它会回退到一个以先前各轮记录开始的全新会话。“回退次数”列统计这些轮次，轮次列表会说明原因。'
  }
};

export { tips, explainers };

tips.views.settings.groups.Leases = "可选协调设置；所有副本须使用相同配置并重启。默认使用 Database。";
tips.views.settings.fields.Leases = {"Provider": "可选协调设置；所有副本须使用相同配置并重启。默认使用 Database。", "ClutchEndpoint": "通过密钥或环境变量提供 Clutch 访问密钥；端点不得包含凭据。", "ClutchAccessKey": "通过密钥或环境变量提供 Clutch 访问密钥；端点不得包含凭据。", "KeyPrefix": "可选协调设置；所有副本须使用相同配置并重启。默认使用 Database。", "RequestTimeoutMs": "可选协调设置；所有副本须使用相同配置并重启。默认使用 Database。", "SweepIntervalMs": "可选协调设置；所有副本须使用相同配置并重启。默认使用 Database。", "MaxLeaseMs": "可选协调设置；所有副本须使用相同配置并重启。默认使用 Database。", "MaxHoldMs": "可选协调设置；所有副本须使用相同配置并重启。默认使用 Database。"};

tips.enums.harnessType.ProviderApi = "通过 PolyPrompt 运行可选的直接 API 循环。须配置端点和模型；CLI 部署保持可用。";

// Pipelines (P12.9).
tips.nav.hubs.approvals = '所有等待人员处理的事项：智能体请求执行的工具调用，以及需要审核的流水线阶段，并附带每项决定的历史。';
tips.nav.approvalsBadgeCombined = '等待人员处理：{{approvals}} 个工具调用审批和 {{reviews}} 个流水线阶段审核。打开“审批”进行决定。';
Object.assign(tips.nav.tabs, {
  approvals: '智能体请求执行、正在等待人员允许或拒绝的工具调用，以及由规则、默认值、人员或超时作出的所有历史决定。',
  pipelineReviews: '已完成并等待人员处理的流水线阶段：批准、请求修改（阶段会根据你的反馈重新运行）或驳回。',
  pipelines: '智能体链：每个阶段运行一个智能体，通过提示词模板将输出交给下一阶段，并可等待审核。',
  pipelineRuns: '流水线的每次执行及其状态和结果。打开一项可查看阶段时间线、阶段运行和审核。'
});
tips.filters.pipelineId = '仅显示某条流水线的记录。选择“全部”可移除筛选。';
tips.filters.pipelineRunId = '仅显示某个流水线运行的审核。粘贴形如 plr_... 的 ID；停止输入后列表会更新。';
Object.assign(tips.enums, {
  pipelineRunStatus: {
    Running: '某个阶段正在运行、启动中或即将启动。',
    AwaitingReview: '某个阶段已完成，正在等待人员批准、请求修改或驳回。',
    Cancelling: '已请求取消；正在停止当前阶段运行。',
    Succeeded: '所有阶段均已完成，所有审核关卡均已批准。',
    Failed: '某个阶段在用完尝试次数后失败、无法启动，或被审核人驳回。重试会从该阶段继续。',
    Cancelled: '有人取消了此流水线运行。重试会从停止的阶段继续。',
    TimedOut: '流水线运行超过了时间限制（包括等待审核的时间）。'
  },
  pipelineRunOutcome: {
    None: '此流水线运行尚未完成，因此还没有结果。',
    Succeeded: '所有阶段均已成功，所有审核均已批准。',
    StageFailed: '某个阶段每次尝试都失败了，且未设置失败时继续。',
    StageStartFailed: '某个阶段无法启动，例如其智能体或部署已不存在，或其提示词无法编译。',
    ReviewRejected: '审核人驳回了某个阶段，流水线运行因此结束。',
    ReviewExpired: '某个审核已超时，且其超时操作为“驳回”。',
    Cancelled: '有人取消了此流水线运行或其中某个阶段运行。',
    TimedOut: '流水线运行超过了其时间限制，因此被停止。',
    InternalError: '服务器在推进流水线时遇到意外错误。请检查服务器日志。'
  },
  pipelineStageStatus: {
    Pending: '此阶段尚未启动；之前的阶段仍在运行。',
    Running: '阶段运行已排队或正在运行。尝试失败后会开始新的执行，直到用完尝试次数。',
    AwaitingReview: '此阶段已完成，正在等待人员审核其输出。',
    Succeeded: '此阶段已完成；如需审核，也已获批准。',
    Failed: '此阶段每次尝试都失败、无法启动，或被驳回。',
    Cancelled: '由于流水线运行被取消或超时，此阶段已停止。'
  },
  pipelineReviewStatus: {
    Pending: '正在等待人员批准、请求修改或驳回。',
    Approved: '已批准：流水线已进入下一阶段，并附带说明（如有）。',
    ChangesRequested: '已请求修改：该阶段已根据反馈重新运行。',
    Rejected: '已驳回：流水线运行在此阶段失败。',
    Expired: '无人及时决定，因此由该阶段的超时操作作出决定。',
    Cancelled: '在任何人作出决定之前，流水线运行已停止。'
  },
  pipelineReviewDecision: {
    Approve: '接受阶段输出并继续下一阶段。可选的说明会交给下一阶段。',
    RequestChanges: '根据你的反馈重新运行同一阶段。受该阶段最大修订次数限制。',
    Reject: '在此停止流水线运行。其结果为“审核被驳回”并失败。'
  },
  pipelineReviewSource: {
    User: '由人员对此审核作出了决定。',
    Timeout: '审核已超时，由该阶段的超时操作作出决定。',
    Cancelled: '审核待处理期间，流水线运行被取消或超时。'
  }
});
Object.assign(tips.enums.auditEventType, {
  PipelineReviewDecided: '人员或超时对某个流水线阶段审核作出了批准、驳回或请求修改的决定。',
  PipelineRunCancelled: '有人取消了流水线运行、其待处理审核及当前阶段运行。'
});
Object.assign(tips.resources.runs, {
  pipelineRunId: '此运行所属的流水线运行，并注明阶段位置和执行次数。不属于流水线的运行此处为空。',
  pipelineStage: '在流水线中的阶段位置，以及此运行是该阶段的第几次执行（重试和修订会增加执行次数）。'
});
tips.resources.pipelines = {
  add: '创建流水线：按顺序排列的阶段列表，每个阶段运行一个智能体，并将输出交给下一阶段。',
  name: '在此租户中唯一的流水线名称，供 API、MCP 工具、SDK 和清单使用。仅限小写字母、数字和连字符。',
  stages: '按运行顺序排列的阶段。每个阶段运行一个智能体；其输出通过提示词模板交给下一阶段。',
  reviewGates: '有多少个阶段需要等待人员审核其输出后，流水线才会继续。',
  maxDurationSeconds: '整个流水线运行允许的最长时间（秒），包括等待审核的时间。0 表示不限制；超过后运行将超时。',
  version: '每次保存更改都会递增。流水线运行会记录启动时的版本，并保留该版本的阶段。',
  stageHeading: '流水线中的一个阶段，按显示的顺序运行。使用箭头移动它，使用垃圾桶图标移除它。',
  moveUp: '将此阶段前移一位。阶段按显示的顺序运行。',
  moveDown: '将此阶段后移一位。阶段按显示的顺序运行。',
  removeStage: '从流水线中移除此阶段。流水线至少需要一个阶段。',
  addStage: '在流水线末尾添加一个阶段。它会收到上一阶段的输出。',
  stagesItems: {
    name: '此阶段的名称，在流水线内唯一。显示在时间线、审核和交接提示词中。',
    agentId: '此阶段运行的智能体。启动流水线需要拥有执行每个阶段智能体的权限。',
    deploymentId: '阶段智能体的固定部署。留空则像普通调用一样，按权重从智能体的活动部署中选择一个。',
    handoffTemplateId: '任务提示词模板，用之前的输出、审核说明和修订反馈包装此阶段的任务。留空则使用部署的 PipelineStage 绑定或内置模板。',
    handoffTemplateVersion: '即使交接模板之后有更改，也使用此版本。留空则始终使用当前版本。',
    outputCharLimit: '传给此阶段的每个之前阶段输出的最大字符数。更长的输出会被截断并标记为已截断。',
    maxAttempts: '阶段运行失败或超时时最多运行几次，之后该阶段计为失败。',
    continueOnFailure: '当此阶段每次尝试都失败时，仍继续下一阶段；下一阶段会在交接内容中看到该失败。',
    requiresReview: '阶段完成后，等待人员在“审批 > 阶段审核”中批准、请求修改或驳回。',
    reviewTimeoutSeconds: '审核在超时操作作出决定前可以等待多久。0 表示一直等到人员决定。',
    reviewTimeoutAction: '审核超时时的处理方式：批准并继续，或驳回并使流水线运行失败。',
    maxRevisions: '审核人最多可以对此阶段请求修改几次。用完后只能批准或驳回。',
    description: '供人员阅读的自由文本说明，介绍此阶段的作用。不会发送给智能体。',
    parameters: '此阶段运行的运行参数覆盖，例如模型或格式。仅在部署允许调用方覆盖时可用。'
  },
  actions: {
    start: '使用输入文本启动此流水线，并在流水线运行页面跟踪其阶段。',
    preview: '根据示例输入和示例阶段输出渲染每个阶段的提示词，不会启动任何运行。',
    runs: '在“流水线运行”标签页中显示此流水线的运行。'
  }
};
tips.resources.pipelineRuns = {
  id: '流水线运行标识符（plr_...）。可用于 API、MCP 工具和 SDK。',
  pipelineName: '此运行所执行的流水线。流水线运行会保留启动时版本的阶段。',
  pipelineVersion: '此运行启动时的流水线版本。之后对流水线的编辑不会改变它。',
  status: '流水线运行当前所处的状态：运行中、等待审核、取消中或已完成。',
  outcome: '流水线运行结束的原因：成功、某阶段失败或无法启动、审核被驳回或过期、已取消或已超时。',
  progress: '流水线运行当前所处的阶段，以及阶段总数。',
  callerName: '启动此流水线运行的用户或访问密钥。',
  errorMessage: '流水线运行失败或超时时，说明出了什么问题。',
  priority: '分配给每个阶段运行的队列优先级。数值越高越先调度。',
  deadlineUtc: '根据流水线的时间限制，流水线运行将超时的时间。没有限制时为空。',
  completedUtc: '流水线运行完成的时间，未完成时为空。',
  createdUtc: '流水线运行启动的时间。将鼠标悬停在值上可查看确切时间。',
  actions: {
    cancel: '取消流水线运行：其当前阶段运行将被取消，待处理的审核将被关闭。',
    retry: '从停止的阶段继续失败、超时或已取消的流水线运行，并开始该阶段的一次新执行。',
    stageRuns: '在“运行”标签页中显示此流水线运行所有阶段的运行。',
    finalRun: '打开最后一个阶段的运行，其结果就是流水线的结果。'
  }
};
tips.resources.pipelineReviews = {
  createdUtc: '阶段完成并请求审核的时间。将鼠标悬停在值上可查看确切时间。',
  pipelineName: '其阶段正在等待审核的流水线。',
  stageName: '要审核的阶段，并注明其位置以及产生该输出的是第几次执行。',
  positionExecution: '在流水线中的阶段位置，以及此审核针对该阶段的第几次执行。修订会增加执行次数。',
  status: '待处理的审核正在等待人员处理；其他状态表示审核的结束方式。',
  decision: '审核决定后显示：批准、请求修改或驳回。',
  decisionSource: '由谁决定：人员、阶段的审核超时，或流水线运行停止。',
  comment: '交给下一阶段的说明（批准）、阶段重新运行所依据的反馈（请求修改），或原因（驳回）。',
  decidedBy: '对此审核作出决定的人员。',
  expiresUtc: '审核超时并由阶段的超时操作作出决定的时间。一直等到人员决定时为空。',
  pipelineRunId: '此审核所属的流水线运行。点击某行可打开其阶段时间线。',
  runId: '正在接受审核的阶段运行。决定前请打开它查看结果。',
  decidedUtc: '审核作出决定的时间，未决定时为空。',
  id: '审核标识符（prv_...）。可通过 API、MCP 工具和 SDK 使用它来决定审核。',
  filters: { decisionSource: '仅显示以某种方式决定的审核：由人员、由审核超时，或由流水线运行停止。' },
  actions: {
    approve: '批准阶段输出并让流水线继续，可附带给下一阶段的说明。',
    requestChanges: '根据你的反馈重新运行此阶段。每次请求都会消耗该阶段的一次修订。',
    reject: '驳回阶段输出。流水线运行将以“审核被驳回”的结果失败。',
    openStageRun: '打开正在接受审核的阶段运行，查看其记录和结果。'
  }
};
tips.pipelineReviews = {
  revisionsLeft: '在只剩批准和驳回之前，此阶段还可以请求修改的次数。',
  decide: {
    decision: '选择如何处理阶段输出。提交后流水线运行会立即继续。',
    Approve: '接受阶段输出；流水线继续下一阶段，如果是最后一个阶段则成功完成。',
    RequestChanges: '附带反馈将阶段退回。它会重新运行，然后再次提交审核。',
    Reject: '拒绝接受阶段输出。流水线运行将停止并失败。',
    commentApprove: '可选说明，下一阶段会与此阶段的输出一起收到。',
    commentRequestChanges: '必填反馈。阶段会据此重新运行，请说明需要修改什么。',
    commentReject: '可选原因，会随决定一起保存并写入审计日志。',
    submitApprove: '立即批准此阶段。该决定为最终决定，之后无法更改。',
    submitRequestChanges: '立即发送反馈。阶段会重新运行，其下一次输出将再次提交审核。',
    submitReject: '立即驳回此阶段。流水线运行将失败；此操作无法撤销，但可以重试。'
  }
};
tips.pipelineStart = {
  input: '流水线的任务。第一个阶段处理它，之后的每个阶段都会将其视为原始任务，并与之前的输出一起查看。',
  submit: '使用此输入启动流水线运行，并打开其阶段时间线。'
};
tips.pipelinePreview = {
  input: '用于渲染每个阶段提示词的示例调用方输入。不会运行任何内容。',
  sampleOutput: '阶段 {{stage}} 的模拟输出，在预览中交给其后的阶段。',
  render: '使用这些示例渲染每个阶段的提示词，与阶段运行实际收到的内容一致。机密会被遮蔽。',
  stage: '此阶段将收到的提示词，根据其交接模板和上述示例渲染而成。',
  rendered: '此阶段的提示词已成功渲染，没有错误。',
  failed: '此阶段的提示词无法渲染；消息会说明原因，例如缺少智能体或部署。'
};
Object.assign(tips.views.runDetail, {
  pipelineRun: '此运行是某个流水线运行的一个阶段。ID 后的文字注明阶段位置和执行次数。',
  openPipelineRun: '打开此运行所属的流水线运行，查看其阶段时间线和审核。'
});
tips.views.pipelineRunDetail = {
  viewJson: '以 JSON 格式显示完整的流水线运行，包括其阶段、阶段运行和审核。',
  delete: '删除此已完成的流水线运行及其审核。其阶段运行会保留在“运行”页面。',
  live: '一旦阶段或审核发生变化，更新会通过实时连接立即送达。',
  polling: '实时连接不可用，因此页面每隔几秒重新读取一次流水线运行。',
  pipeline: '此运行所执行的流水线及其启动时的版本。点击可在“智能体 > 流水线”中找到它。',
  openPipeline: '打开“智能体 > 流水线”，并筛选到此流水线。',
  openRun: '打开此阶段运行，查看其记录、结果和遥测。',
  finalRun: '最后一个阶段的运行。其结果就是流水线运行的结果。',
  started: '第一个阶段运行的创建时间。',
  input: '启动流水线运行时使用的输入。每个阶段都会将其视为原始任务。',
  reviewTitle: '某个阶段已完成，正在等待你的决定。请先在阶段运行中查看其输出，再作决定。',
  stages: '按运行顺序列出的每个阶段，包括状态、执行、尝试、修订、阶段运行和审核。',
  current: '流水线运行当前所处的阶段。',
  reviewGate: '此阶段需要等待人员审核其输出后，流水线才会继续。',
  agent: '此阶段运行的智能体，以流水线运行启动时的记录为准。',
  counts: '执行次数统计该阶段的每次运行；尝试次数统计自上次审核以来的运行；修订次数统计请求修改的次数。',
  reviewItem: '对此阶段某一次执行的审核及其决定方式。',
  columns: {
    execution: '此运行是该阶段的第几次执行。失败后的重试和审核后的修订都会增加执行次数。',
    run: '阶段运行。点击可打开其记录和结果。',
    status: '此阶段运行当前的状态，例如运行中或已完成。',
    outcome: '此阶段运行结束的原因，例如成功、失败或超时。',
    error: '阶段运行失败时的错误消息，未失败时为空。',
    created: '此阶段运行的创建时间，可悬停查看确切时间。'
  }
};
tips.views.settings.fields.Runtime.PipelineSweepIntervalMs = '领导者推进错过完成信号的流水线运行、重试受阻的阶段启动，以及应用审核超时和流水线时间限制的频率，单位为毫秒。';
tips.views.settings.fields.Runtime.PipelineMaxStages = '一个流水线定义最多可以拥有的阶段数。保存阶段数更多的流水线会被拒绝。';
tips.views.settings.fields.Runs = Object.assign(tips.views.settings.fields.Runs || {}, {
  DelegationChildQueueDepth: '整个集群中，父运行正在等待的已排队委派运行的最大数量。超过此数量后，开始等待另一个委派运行的运行会立即以 DelegationCapacityExhausted 失败。',
  DelegationRetryAfterSeconds: '等待的委派因 DelegationCapacityExhausted 被拒绝时，Retry-After 中建议的秒数。'
});
Object.assign(explainers, {
  pipelines: {
    title: '流水线和阶段',
    p1: '流水线将多个智能体串联起来。每个阶段运行一个智能体（可选使用固定部署），并通过提示词模板将其输出（文本、结构化输出和产物引用）交给下一阶段。',
    p2: '阶段可以重试失败的运行、在失败后继续，以及等待审核。审核显示在“审批 > 阶段审核”中；请求修改会使该阶段根据反馈重新运行。',
    p3: '编辑流水线会创建新版本。已启动的流水线运行会保留其启动时的阶段。'
  },
  pipelineRuns: {
    title: '流水线运行',
    p1: '流水线运行按顺序执行某个流水线版本的各个阶段。每次阶段执行都是一个普通运行，可从阶段时间线链接打开。',
    p2: '取消会停止当前阶段运行并关闭待处理的审核。重试会从停止的阶段继续失败、超时或已取消的流水线运行。'
  },
  pipelineReviews: {
    title: '阶段审核',
    p1: '需要审核的阶段完成后会在此等待。批准会继续下一阶段，请求修改会根据你的反馈重新运行该阶段，驳回会使流水线运行失败。',
    p2: '没有超时设置的审核会一直等待人员决定。设置了超时时，时间到后由该阶段的超时操作作出决定。'
  }
});
