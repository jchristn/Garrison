// Simplified Chinese catalog for the Garrison app UI. Mirrors en.js key for key.

const zhHans = {
  common: {
    loading: '正在加载',
    close: '关闭',
    cancel: '取消',
    retry: '重试',
    defaultTitle: 'Garrison 应用'
  },
  app: {
    notFoundTitle: '找不到应用',
    notFoundBody: '这个地址上没有应用。请检查你收到的链接。',
    noSlugTitle: '未选择应用',
    noSlugBody: '请打开某个具体应用的链接。应用链接的格式类似 /apps/your-app/。',
    loadErrorTitle: '无法加载应用',
    loadErrorBody: '服务器没有响应。请检查网络连接后重试。',
    skipToChat: '跳到对话'
  },
  signIn: {
    title: '登录 {{name}}',
    email: '电子邮件',
    password: '密码',
    submit: '登录',
    submitting: '正在登录',
    anonymous: '不登录，直接继续',
    anonymousNote: '未登录时开始的对话只保存在当前浏览器标签页中。',
    or: '或',
    poweredBy: '使用 Garrison Agent Studio 构建',
    sessionEnded: '你的会话已结束。请重新登录后继续。'
  },
  header: {
    conversations: '对话',
    files: '文件',
    signOut: '退出登录',
    signedInAs: '当前登录：{{name}}',
    guest: '访客',
    themeLight: '切换到浅色主题',
    themeDark: '切换到深色主题',
    language: '语言',
    logoAlt: '{{name}} 标志'
  },
  conversations: {
    title: '对话',
    new: '新对话',
    empty: '还没有对话。发送一条消息即可开始。',
    untitled: '{{date}} 的对话',
    messages: '消息：{{count}} 条',
    working: '处理中',
    loadError: '无法加载你的对话。'
  },
  chat: {
    welcomeDefault: '提一个问题，开始吧。',
    composerLabel: '消息',
    composerPlaceholder: '输入消息',
    composerHint: '按 Enter 发送，按 Shift 加 Enter 换行。',
    send: '发送',
    sending: '正在发送',
    you: '你',
    waiting: '智能体正在处理',
    approval: '正在等待操作员批准某个步骤',
    reconnecting: '连接已断开，正在重新连接',
    failed: '这次回复没有完成。',
    details: '智能体活动',
    loadError: '无法加载这个对话。',
    missing: '找不到该对话，它可能属于其他会话。',
    busyComposer: '智能体仍在回复。等它完成后，你就可以发送下一条消息。',
    dismiss: '关闭'
  },
  statuses: {
    Pending: '等待开始',
    Queued: '等待开始',
    Leased: '正在启动',
    Running: '处理中',
    Cancelling: '正在停止',
    Succeeded: '已完成',
    Failed: '失败',
    Cancelled: '已取消',
    TimedOut: '已超时',
    Rejected: '不允许',
    Suspended: '已暂停'
  },
  detailTypes: {
    Thinking: '思考',
    ToolCall: '工具调用',
    ToolResult: '工具结果',
    Progress: '进度',
    Warning: '警告'
  },
  activity: {
    title: '智能体活动 ({{count}})',
    thinking: '思考',
    thinkingNow: '正在思考',
    ask: '正在询问 {{agent}}',
    askMany: '正在同时询问 {{agents}}',
    askSeveral: '正在同时询问多个智能体',
    gather: '正在汇总回答',
    check: '正在查看另一个智能体',
    tool: '正在使用 {{tool}}',
    running: '运行中',
    done: '完成',
    failed: '失败',
    sent: '发送内容',
    returned: '返回内容',
    nothing: '无',
    waiting: '正在等待回答'
  },
  copy: {
    copy: '复制',
    copied: '已复制',
    failed: '浏览器不允许复制',
    message: '复制你的消息',
    answer: '复制回答'
  },
  telemetry: {
    title: '这个回答的运行情况',
    model: '模型',
    ttft: '首个令牌时间',
    streaming: '流式输出时间',
    tools: '工具耗时',
    delegation: '等待其他智能体',
    approval: '等待批准',
    queue: '等待工作节点',
    execution: '运行时间',
    total: '总时间',
    inputTokens: '输入令牌',
    outputTokens: '输出令牌',
    cachedTokens: '缓存令牌',
    reasoningTokens: '推理令牌',
    rate: '输出速度',
    rateValue: '{{value}} 令牌/秒',
    toolCalls: '工具调用',
    cost: '费用'
  },
  files: {
    title: '文件',
    empty: '智能体还没有在这个对话中写入任何文件。',
    noConversation: '对话开始后，智能体写入的文件会显示在这里。',
    summary: '文件：{{count}} 个（{{size}}）',
    download: '下载',
    versions: '版本',
    versionsTitle: '{{path}} 的版本',
    version: '版本 {{number}}',
    current: '当前',
    updated: '更新于 {{when}}',
    size: '大小',
    newBadge: '新',
    downloadFailed: '无法开始下载，请重试。',
    loadError: '无法加载文件。',
    versionsError: '无法加载版本。',
    close: '关闭文件'
  },
  errors: {
    InvalidCredentials: '电子邮件或密码不正确。',
    AppSignInRequired: '请登录后使用此应用。',
    AnonymousDisabled: '此应用已关闭匿名使用，请登录。',
    AppAccessDenied: '此账号无权访问这个应用。请向应用所有者申请访问权限。',
    AppSessionRequired: '你的会话已结束。请重新登录后继续。',
    ConversationBusy: '智能体仍在回复上一条消息。请等它完成后再发送。',
    AppRateLimited: '你发送消息的速度太快了。请等待一分钟后再试。',
    AppNotDeployed: '此应用尚未就绪，请稍后再试。',
    NetworkError: '无法连接到服务器。请检查网络连接后重试。',
    generic: '出现问题（HTTP {{status}}），请重试。'
  },
  tips: {
    email: '在这里填写你在这个应用中注册账号时使用的电子邮件地址。',
    password: '你的账号密码。它只会发送到这台服务器，用于开始你的会话。',
    submit: '核对你填写的电子邮件和密码，验证通过后就会打开这个应用。',
    anonymous: '以访客身份使用应用。你的对话只在当前浏览器标签页打开期间保留。',
    language: '选择应用的显示语言。你的选择会保存在当前浏览器中。',
    themeLight: '使用浅色配色。你的选择会保存在当前浏览器中，并优先于系统设置。',
    themeDark: '使用深色配色。你的选择会保存在当前浏览器中，并优先于系统设置。',
    signOut: '结束你在这台设备上的会话，并返回登录页面重新开始。',
    conversationsToggle: '显示或隐藏左侧的对话列表，方便你在不同的对话之间来回切换。',
    filesToggle: '显示或隐藏智能体在当前这个对话中写入的所有文件的列表。',
    newConversation: '开始一个全新的对话。你之前的对话仍会保留在列表中。',
    conversation: '打开这个对话，从你上次停下来的地方继续和智能体交流。',
    composer: '在这里输入发给智能体的消息。按 Enter 发送，按 Shift 加 Enter 换行。',
    send: '把你的消息发送给智能体。回复会在下方边生成边显示。',
    dismiss: '隐藏这条提示消息，之后它就不会再显示在当前的页面上了。',
    retry: '重新加载整个应用，再试一次打开页面并把内容正常显示出来。',
    download: '把这个文件当前的最新版本下载并保存到你正在使用的设备上。',
    versions: '查看这个文件保存过的所有版本，你也可以从中下载较早的版本。',
    downloadVersion: '把这个文件的这一个历史版本下载并保存到你正在使用的设备上。',
    closeDialog: '关闭这个对话框，然后回到你刚才正在进行的那个对话页面。',
    closeFiles: '隐藏右侧的文件面板，然后回到你刚才正在进行的那个对话页面。',
    details: '显示智能体在回复过程中执行的步骤，包括工具调用、进度和警告。',
    answerLink: '在新标签页中打开回复里的这个链接，地址为：{{href}}',
    tableHeader: '这是回复中某个表格的列标题，内容为：{{text}}',
    poweredBy: '在新标签页中打开 usegarrison.ai，了解运行此应用的平台 Garrison Agent Studio 的更多信息。',
    skipToChat: '跳过页眉和对话列表，直接把焦点移动到下方的消息输入框里。',
    activityRunning: '此步骤仍在运行中，结果一旦返回就会立即显示在这里。',
    activityDone: '此步骤已完成。展开即可查看发送的内容和返回的内容。',
    activityFailed: '此步骤执行失败。展开即可查看发送的内容以及返回的错误信息。',
    activityStep: '显示智能体在这一步骤中发送了什么内容，以及返回了什么内容。'
  }
};

// Conversation list and file list controls, and the pane dividers.
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
  "conversations": {
    "filter": "按名称筛选",
    "sort": "会话排序",
    "noMatch": "没有符合筛选条件的会话。",
    "renameLabel": "新名称",
    "save": "保存",
    "cancel": "取消",
    "rename": "重命名 {{title}}",
    "delete": "删除 {{title}}",
    "confirmDelete": "删除“{{title}}”？此操作无法撤销。",
    "deleteConfirm": "删除",
    "sorts": {
      "recent": "最近的在前",
      "oldest": "最早的在前",
      "nameAsc": "名称 A 到 Z",
      "nameDesc": "名称 Z 到 A"
    }
  },
  "files": {
    "sort": "文件排序",
    "sorts": {
      "newest": "最新的在前",
      "oldest": "最旧的在前",
      "largest": "最大的在前",
      "smallest": "最小的在前",
      "nameAsc": "名称 A 到 Z",
      "nameDesc": "名称 Z 到 A"
    }
  },
  "layout": {
    "resizeConversations": "调整会话列表宽度",
    "resizeFiles": "调整文件列表宽度"
  },
  "tips": {
    "conversationFilter": "只显示名称中包含这段文字的会话，其他会话会暂时隐藏。",
    "conversationSort": "选择会话列表的排列顺序：按最近活动的时间或按名称排列。",
    "conversationRenameInput": "输入新名称，按 Enter 保存，按 Escape 取消修改。",
    "conversationRenameSave": "保存这个会话的新名称，并立即在左侧的会话列表中显示。",
    "conversationRenameCancel": "保留这个会话现在的名称，不做任何修改，关闭编辑框。",
    "conversationRename": "给这个会话起一个新名称，方便以后在会话列表中找到它。",
    "conversationDelete": "确认之后才会删除这个会话，点击后不会立即删除任何内容。",
    "conversationDeleteBusy": "等智能体回答完毕之后，就可以删除这个会话了，请稍候。",
    "conversationDeleteConfirm": "永久删除这个会话以及它的所有文件，删除后无法恢复。",
    "conversationDeleteCancel": "保留这个会话，不删除任何内容，并关闭这个确认提示。",
    "fileSort": "选择文件列表的排列顺序：按修改时间、文件大小或名称排列。",
    "resizeConversations": "拖动这条分隔线或使用方向键，让左侧的会话列表变宽或变窄。",
    "resizeFiles": "拖动这条分隔线或使用方向键，让右侧的文件列表变宽或变窄。"
  }
});

export default zhHans;
