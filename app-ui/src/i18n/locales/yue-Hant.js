// Cantonese (Traditional, Hong Kong) catalog for the Garrison app UI. Mirrors en.js key for key.

const yueHant = {
  common: {
    loading: '載入緊',
    close: '關閉',
    cancel: '取消',
    retry: '再試一次',
    defaultTitle: 'Garrison 應用程式'
  },
  app: {
    notFoundTitle: '搵唔到應用程式',
    notFoundBody: '呢個網址冇任何應用程式。請檢查吓你收到嘅連結。',
    noSlugTitle: '未揀應用程式',
    noSlugBody: '請打開某個應用程式嘅連結。應用程式連結大概係噉樣：/apps/your-app/。',
    loadErrorTitle: '載入唔到應用程式',
    loadErrorBody: '伺服器冇回應。請檢查吓網絡連線，然後再試一次。',
    skipToChat: '跳去對話'
  },
  signIn: {
    title: '登入 {{name}}',
    email: '電郵',
    password: '密碼',
    submit: '登入',
    submitting: '登入緊',
    anonymous: '唔登入，直接繼續',
    anonymousNote: '唔登入開始嘅對話，只會留喺呢個瀏覽器分頁度。',
    or: '或者',
    poweredBy: '用 Garrison Agent Studio 建立',
    sessionEnded: '你嘅工作階段已經完咗。請再登入一次先可以繼續。'
  },
  header: {
    conversations: '對話',
    files: '檔案',
    signOut: '登出',
    signedInAs: '已登入：{{name}}',
    guest: '訪客',
    themeLight: '轉做淺色主題',
    themeDark: '轉做深色主題',
    language: '語言',
    logoAlt: '{{name}} 標誌'
  },
  conversations: {
    title: '對話',
    new: '新對話',
    empty: '仲未有對話。傳一個訊息就可以開始。',
    untitled: '{{date}} 嘅對話',
    messages: '訊息：{{count}} 個',
    working: '處理緊',
    loadError: '載入唔到你嘅對話。'
  },
  chat: {
    welcomeDefault: '問個問題就可以開始。',
    composerLabel: '訊息',
    composerPlaceholder: '輸入訊息',
    composerHint: '撳 Enter 傳送，撳 Shift 加 Enter 轉行。',
    send: '傳送',
    sending: '傳送緊',
    you: '你',
    waiting: '代理程式處理緊',
    approval: '等緊操作員批准某個步驟',
    reconnecting: '連線斷咗，重新連線緊',
    failed: '呢次回覆冇完成到。',
    details: '代理程式活動',
    loadError: '載入唔到呢段對話。',
    missing: '搵唔到呢段對話，可能屬於另一個工作階段。',
    busyComposer: '代理程式仲回覆緊。等佢完咗，你就可以傳下一個訊息。',
    dismiss: '關閉'
  },
  statuses: {
    Pending: '等緊開始',
    Queued: '等緊開始',
    Leased: '啟動緊',
    Running: '處理緊',
    Cancelling: '停緊',
    Succeeded: '完成咗',
    Failed: '失敗',
    Cancelled: '取消咗',
    TimedOut: '逾時',
    Rejected: '唔准',
    Suspended: '暫停咗'
  },
  detailTypes: {
    Thinking: '思考',
    ToolCall: '工具調用',
    ToolResult: '工具結果',
    Progress: '進度',
    Warning: '警告'
  },
  activity: {
    title: '代理活動 ({{count}})',
    thinking: '思考',
    thinkingNow: '諗緊',
    ask: '問緊 {{agent}}',
    askMany: '同時問緊 {{agents}}',
    askSeveral: '同時問緊幾個代理',
    gather: '執緊啲答案',
    check: '睇緊另一個代理',
    tool: '用緊 {{tool}}',
    running: '進行中',
    done: '完成',
    failed: '失敗',
    sent: '傳送咗',
    returned: '返嚟嘅',
    nothing: '冇',
    waiting: '等緊答覆'
  },
  copy: {
    copy: '複製',
    copied: '複製咗',
    failed: '瀏覽器唔俾複製',
    message: '複製你嘅訊息',
    answer: '複製答案'
  },
  telemetry: {
    title: '呢個答案點樣運行',
    model: '模型',
    ttft: '第一個權杖嘅時間',
    streaming: '串流時間',
    tools: '用喺工具嘅時間',
    delegation: '等其他代理',
    approval: '等批准',
    queue: '等工作節點',
    execution: '運行時間',
    total: '總時間',
    inputTokens: '輸入權杖',
    outputTokens: '輸出權杖',
    cachedTokens: '快取權杖',
    reasoningTokens: '推理權杖',
    rate: '輸出速度',
    rateValue: '每秒 {{value}} 個權杖',
    toolCalls: '工具調用',
    cost: '費用'
  },
  files: {
    title: '檔案',
    empty: '代理程式喺呢段對話入面仲未寫過任何檔案。',
    noConversation: '對話開始之後，代理程式寫嘅檔案會喺呢度出現。',
    summary: '檔案：{{count}} 個（{{size}}）',
    download: '下載',
    versions: '版本',
    versionsTitle: '{{path}} 嘅版本',
    version: '版本 {{number}}',
    current: '而家嘅版本',
    updated: '更新於 {{when}}',
    size: '大小',
    newBadge: '新',
    downloadFailed: '開始唔到下載，請再試一次。',
    loadError: '載入唔到檔案。',
    versionsError: '載入唔到版本。',
    close: '關閉檔案'
  },
  errors: {
    InvalidCredentials: '電郵或者密碼唔啱。',
    AppSignInRequired: '請登入先可以用呢個應用程式。',
    AnonymousDisabled: '呢個應用程式已經停用咗匿名使用，請登入。',
    AppAccessDenied: '呢個帳戶冇權用呢個應用程式。請搵應用程式擁有人申請權限。',
    AppSessionRequired: '你嘅工作階段已經完咗。請再登入一次先可以繼續。',
    ConversationBusy: '代理程式仲回覆緊上一個訊息。請等佢完咗先再傳。',
    AppRateLimited: '你傳訊息傳得太快喇。請等一分鐘再試。',
    AppNotDeployed: '呢個應用程式仲未準備好，請遲啲再試。',
    NetworkError: '連唔到伺服器。請檢查吓網絡連線，然後再試一次。',
    generic: '出咗問題（HTTP {{status}}），請再試一次。'
  },
  tips: {
    email: '喺度填寫你喺呢個應用程式註冊帳戶嗰陣用嘅電郵地址。',
    password: '你個帳戶嘅密碼。佢只會傳去呢部伺服器，用嚟開始你嘅工作階段。',
    submit: '核對你填嘅電郵同密碼，驗證冇問題之後就會打開呢個應用程式。',
    anonymous: '用訪客身份使用應用程式。你嘅對話只會喺呢個瀏覽器分頁開住嘅時候保留。',
    language: '揀應用程式嘅顯示語言。你揀咗嘅語言會儲存喺呢個瀏覽器度。',
    themeLight: '用淺色配色。你嘅選擇會儲存喺呢個瀏覽器度，而且會蓋過系統設定。',
    themeDark: '用深色配色。你嘅選擇會儲存喺呢個瀏覽器度，而且會蓋過系統設定。',
    signOut: '結束你喺呢部裝置上面嘅工作階段，然後返去登入畫面。',
    conversationsToggle: '顯示或者隱藏你嘅對話清單，方便喺唔同對話之間轉換。',
    filesToggle: '顯示或者隱藏代理程式喺呢段對話入面寫咗嘅檔案清單。',
    newConversation: '開始一段全新嘅對話。你之前嘅對話會繼續留喺清單度。',
    conversation: '打開呢段對話，由你上次停低嘅地方繼續同代理程式傾落去。',
    composer: '喺度輸入你想傳俾代理程式嘅訊息。撳 Enter 傳送，撳 Shift 加 Enter 轉行。',
    send: '將你嘅訊息傳俾代理程式。回覆會一路寫一路喺下面出現。',
    dismiss: '收埋呢個提示訊息，之後佢就唔會再喺而家呢個頁面出現。',
    retry: '重新載入成個應用程式，再試一次打開頁面同顯示內容。',
    download: '將呢個檔案而家最新嘅版本下載，然後儲存落你用緊嘅裝置度。',
    versions: '睇晒呢個檔案儲存過嘅所有版本，你仲可以揀一個舊啲嘅版本下載。',
    downloadVersion: '將呢個檔案嘅呢一個舊版本下載，然後儲存落你用緊嘅裝置度。',
    closeDialog: '關閉呢個對話框，然後返去你啱啱做緊嗰段對話嘅畫面。',
    closeFiles: '收埋右邊嘅檔案面板，然後返去你啱啱做緊嗰段對話嘅畫面。',
    details: '顯示代理程式回覆嗰陣做過嘅步驟，包括工具調用、進度同警告。',
    answerLink: '喺新分頁打開回覆入面嘅呢條連結，網址係：{{href}}',
    tableHeader: '呢個係回覆入面某個表格嘅欄位標題，內容係：{{text}}',
    poweredBy: '喺新分頁打開 usegarrison.ai，睇吓運行呢個應用程式嘅平台 Garrison Agent Studio 係乜。',
    skipToChat: '跳過頁首同對話清單，直接將焦點移去下面嘅訊息輸入框度。',
    activityRunning: '呢一步仲做緊，等到結果一返嚟就會即刻喺呢度顯示出嚟。',
    activityDone: '呢一步已經完成咗。打開佢就可以睇到傳送咗乜嘢同返嚟咗乜嘢。',
    activityFailed: '呢一步失敗咗。打開佢就可以睇到傳送咗乜嘢同埋返嚟嘅錯誤訊息。',
    activityStep: '顯示代理喺呢一步入面傳送咗乜嘢內容，同埋返嚟咗乜嘢內容。'
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
})(yueHant, {
  "conversations": {
    "filter": "按名稱篩選",
    "sort": "對話排序",
    "noMatch": "冇對話符合篩選條件。",
    "renameLabel": "新名稱",
    "save": "儲存",
    "cancel": "取消",
    "rename": "改 {{title}} 個名",
    "delete": "刪除 {{title}}",
    "confirmDelete": "刪除「{{title}}」？刪咗就救唔返。",
    "deleteConfirm": "刪除",
    "sorts": {
      "recent": "最近嘅排先",
      "oldest": "最早嘅排先",
      "nameAsc": "名稱 A 至 Z",
      "nameDesc": "名稱 Z 至 A"
    }
  },
  "files": {
    "sort": "檔案排序",
    "sorts": {
      "newest": "最新嘅排先",
      "oldest": "最舊嘅排先",
      "largest": "最大嘅排先",
      "smallest": "最細嘅排先",
      "nameAsc": "名稱 A 至 Z",
      "nameDesc": "名稱 Z 至 A"
    }
  },
  "layout": {
    "resizeConversations": "調較對話清單闊度",
    "resizeFiles": "調較檔案清單闊度"
  },
  "tips": {
    "conversationFilter": "淨係顯示名稱入面有呢段文字嘅對話，其他對話會暫時收埋。",
    "conversationSort": "揀對話清單點樣排：按最近活動嘅時間或者按名稱嚟排。",
    "conversationRenameInput": "輸入新名稱，撳 Enter 儲存，撳 Escape 就取消修改。",
    "conversationRenameSave": "儲存呢個對話嘅新名稱，並即刻喺左邊嘅對話清單入面顯示。",
    "conversationRenameCancel": "保留呢個對話而家個名，唔做任何修改，閂埋個編輯框。",
    "conversationRename": "幫呢個對話改過個新名，方便之後喺對話清單入面搵返佢。",
    "conversationDelete": "確認咗先會刪除呢個對話，撳咗都唔會即刻刪除任何嘢。",
    "conversationDeleteBusy": "等代理答完之後，就可以刪除呢個對話喇，請等多一陣。",
    "conversationDeleteConfirm": "永久刪除呢個對話同埋佢所有檔案，刪咗之後就救唔返。",
    "conversationDeleteCancel": "保留呢個對話，唔刪除任何嘢，並且閂埋呢個確認提示。",
    "fileSort": "揀檔案清單點樣排：按修改時間、檔案大細或者名稱嚟排。",
    "resizeConversations": "拖動呢條分隔線或者用方向鍵，令左邊嘅對話清單變闊或者變窄。",
    "resizeFiles": "拖動呢條分隔線或者用方向鍵，令右邊嘅檔案清單變闊或者變窄。"
  }
});

export default yueHant;
