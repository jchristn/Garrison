// Cantonese (Traditional) tooltip (tips.*) and relationship explainer (explainers.*) text. Merged into yue-Hant.js. Mirrors en.tips.js key for key.
// Tooltips say what a control is and how it is used, never just the label again (D-030).

const TELEMETRY = {
  approvalWaitMs: '批核等候：呢個執行等權限批核（由人或者逾時決定）嘅總時間。由規則或者部署預設即刻決定嘅呼叫唔會加時間。由伺服器量度；個執行從來冇等過就顯示 n/a。',
  delegationWaitMs: '委派等候時間：呢個執行等佢經 Garrison 開嘅子執行（即係佢委派咗嘅其他代理程式）等咗幾耐，用嗰啲子執行嘅伺服器時間戳記計。如果執行冇委派過任何嘢，就係零或者不適用。',
  timeToFirstTokenExcludingDelegationMs: '第一個 Token 時間（唔計委派）：第一個 Token 時間減去執行喺第一個輸出之前等委派執行嘅時間。可以用嚟公平噉比較會委派同唔會委派嘅代理程式。用伺服器時間戳記計，永遠唔會係負數。',
  timeToFirstTokenMs: '第一個 Token 時間：由工作節點啟動 Harness 程序開始，計到模型產生第一個輸出（文字或思考）為止。呢個時間包埋 Harness 啟動，所以 CLI 啟動得慢都會喺度反映出嚟。由工作節點用單調時鐘量度。',
  streamingMs: '串流時間：由模型第一個輸出計到最後一個輸出。即係模型實際用咗幾耐嚟產生輸出。由工作節點用單調時鐘量度。',
  executionMs: '執行時間：由 Harness 程序啟動到程序結束，由工作節點量度。舊版伺服器如果冇回報呢個數，就會改用開始同完成嘅時間戳記。',
  queueMs: '排隊時間：執行由入隊到畀工作節點租用之間等咗幾耐。數值高即係所有合資格嘅節點都忙緊，或者冇一個符合排程放置規則。由伺服器量度。',
  totalMs: '總時間：由入隊到完成，即係排隊時間加執行時間再加回報結果嘅時間。由伺服器量度。',
  outputTokensPerSecond: '每秒輸出 Token：輸出 Token 除以串流時間。只會喺串流最少維持咗 100 ms 先顯示，因為時間太短計出嚟嘅速率冇意義。',
  inputTokens: 'Harness 為成個執行回報嘅輸入 Token，包括系統提示、工具結果同埋跨回合嘅對話記錄。',
  outputTokens: '模型喺呢個執行每個回合產生嘅輸出 Token，數字由 Harness 解析器回報。',
  cachedTokens: '由供應商提示快取提供嘅輸入 Token。快取 Token 通常收費較平，所以呢度佔比高可以慳成本。',
  reasoningTokens: '推理或思考 Token，前提係 Harness 有分開回報（例如 Codex 嘅推理輸出）。如果 Harness 冇拆開計，就會係零。',
  toolCallCount: '執行入面工具呼叫事件嘅數量：MCP 工具、Harness 內置工具，同埋對其他 Garrison 代理程式嘅呼叫。由工作節點喺事件串流度計。',
  costUsd: 'Harness 回報嘅成本，以美元計。如果係 Garrison 由 Token 數目計出嚟，而唔係 Harness 回報，就會標示為估算。',
  firstTokenUtc: '執行入面第一個模型輸出事件嘅實際時間（UTC，以你嘅時區顯示）。',
  lastTokenUtc: '執行入面最後一個模型輸出事件嘅實際時間（UTC，以你嘅時區顯示）。'
};

const FILE_ITEMS = {
  baseDirectory: '路徑係相對於邊個目錄：執行設定目錄、工作區，定係執行嘅 HOME 目錄。',
  pathTemplate: '啟動之前要寫入嘅檔案相對路徑。可以用範本，例如 settings/{{run.id}}.json。',
  contentTemplate: '渲染成檔案內容嘅範本。可以引用變數，亦可以用 {{secret.alias}} 引用已綁定嘅機密。',
  condition: '範本表達式；如果渲染出嚟係空白或者 false，就唔會寫入呢個檔案。',
  mode: '八進制嘅 Unix 檔案權限，例如存放憑證嘅檔案用 0600。',
  isSecret: '將渲染出嚟嘅內容當係機密處理：永遠唔會記錄落日誌，喺編譯預覽入面亦會遮蓋。'
};

const tips = {
  approvals: {
    awaiting_one: 'Harness 喺工具呼叫之前問咗一聲，而家等緊有人處理。打開「批核」分頁去允許或者拒絕（{{count}} 個等緊）。',
    awaiting_other: 'Harness 喺工具呼叫之前問咗一聲，而家等緊有人處理。打開「批核」分頁去允許或者拒絕（{{count}} 個等緊）。',
    decide: {
      decision: '揀 Harness 可唔可以做呢個工具呼叫。你一提交，個執行就會即刻繼續。',
      allow: '畀 Harness 做呢個工具呼叫。個執行會連同呢個呼叫繼續落去。',
      deny: '拒絕呢個工具呼叫。Harness 會收到拒絕訊息，然後唔用呢個呼叫繼續落去。',
      reason: '可選嘅備註，會同決定一齊儲存，並寫入審計記錄。拒絕嘅話，備註會傳畀代理程式。',
      remember: '同時喺呢個批核所屬嘅部署加一條規則，咁下次同類嘅呼叫就會自動決定。',
      rulePattern: '要加嘅規則，用 Claude Code 規則語法。一開始係建議規則；儲存之前可以放闊或者收窄。',
      submitAllow: '即刻允許呢個工具呼叫。決定係最終嘅，之後唔可以再改。',
      submitDeny: '即刻拒絕呢個工具呼叫。決定係最終嘅，之後唔可以再改。'
    }
  },
  approvalCheck: {
    toolName: 'Harness 報告嘅工具名稱，例如 Bash、Edit、WebFetch，或者 mcp__github__create_issue 呢類 MCP 工具。',
    inputs: {
      command: '要測試嘅 Shell 指令，例如 npm run build && npm test。每個子指令都一定要允許。',
      url: '工具會擷取嘅 URL。WebFetch 規則會按佢嘅網域比對。',
      query: '工具會傳送嘅搜尋查詢，用嚟比對同呢個查詢有關嘅規則。',
      file_path: '工具會讀取或者更改嘅檔案路徑，可以係相對於工作區嘅路徑或者絕對路徑。',
      notebook_path: '工具會更改嘅筆記本路徑，用嚟比對同呢本筆記本有關嘅規則。',
      pattern: '工具會用嘅 glob 或者搜尋模式，用嚟比對同呢個模式有關嘅規則。'
    },
    run: '用部署已儲存嘅規則評估呢個工具呼叫，再顯示結果。唔會記錄任何嘢，亦唔會影響任何執行。',
    suggestedRule: '「記住」會為呢個呼叫加嘅規則。將佢複製去上面嘅規則，就可以涵蓋類似嘅呼叫。'
  },
  ids: { deleted: '呢條記錄已經刪咗。ID {{id}}。複製掣會複製呢個 ID。', named: 'ID {{id}}。撳複製掣就可以複製呢個 ID，畀 API、SDK 或者支援要求用。' },
  markdown: {
    column: '代理程式輸出入面表格嘅 {{name}} 欄。闊嘅表格可以喺框入面打橫捲動。',
    showRaw: '顯示代理程式傳返嚟嘅原始文字，唔套用 Markdown 格式，方便你檢查或者複製。',
    showRendered: '再用 Markdown 格式顯示文字，包括表格、清單、程式碼區塊同連結。',
    copy: '將原始結果文字（包括 Markdown 語法）複製去剪貼簿。',
    link: '喺新分頁開啟 {{href}}。呢條連結係嚟自代理程式嘅輸出，信佢之前請先核對網址。'
  },
  common: {
    fields: {
      name: '呢筆記錄喺租用戶入面嘅唯一名稱。其他記錄同清單都係用呢個名嚟引用佢。',
      description: '畀人睇嘅自由文字備註，用嚟講明呢筆記錄嘅用途，執行時唔會用到。',
      active: '停用咗嘅記錄會保留，但會被忽略。想暫停某樣嘢又唔想刪除，就熄咗佢。',
      id: '系統產生、帶類型前綴嘅識別碼。喺 API 呼叫同腳本入面用佢；佢永遠唔會變。',
      createdUtc: '呢筆記錄幾時建立。將滑鼠停喺數值上面可以睇到準確日期同時間。',
      lastUpdateUtc: '呢筆記錄最後一次修改嘅時間。',
      isBuiltIn: '內置記錄隨 Garrison 提供，只可以讀取。自訂記錄係喺呢個租用戶度建立，可以編輯。',
      expiresUtc: '過咗呢個時間，記錄就唔再生效。留空即係永不過期。'
    }
  },
  explainer: {
    reopen: '再顯示 {{topic}} 嘅說明：呢頁管理啲乜，同 Garrison 其他部分有咩關係。',
    dismiss: '收埋呢段說明。原位會留低一個細細嘅「關於」按鈕，你隨時可以撳返出嚟。'
  },
  nav: {
    approvalsBadge_one: '有 {{count}} 個工具呼叫等緊有人允許或者拒絕。打開「批核」去決定。',
    approvalsBadge_other: '有 {{count}} 個工具呼叫等緊有人允許或者拒絕。打開「批核」去決定。',
    hubs: {
      approvals: '批核收件匣：代理程式要求做、等緊有人處理嘅工具呼叫，同埋由規則、預設、人手或者逾時做嘅每個決定嘅歷史。',
      home: '由呢度開始：代理程式、執行同工作節點嘅即時數目、API 流量、最近嘅失敗，仲有常用工作嘅捷徑。',
      invoke: '喺瀏覽器直接發訊息畀代理程式，睇住對話記錄串流出嚟，唔使寫任何程式。',
      runs: '每一次代理程式調用、佢嘅對話記錄、結果同遙測數據，仲有等緊節點嘅工作隊列。',
      analytics: '執行速度、Token 用量、成本、結果同工具呼叫隨時間變化嘅圖表，可以按代理程式、Harness 同部署篩選。',
      agents: '呼叫方用名稱調用嘅代理程式，同埋決定每個代理程式實際點樣執行嘅部署。',
      configuration: '部署用到嘅基本組件：Harness 設定檔、提示範本、MCP 伺服器、機密、工作區、成品存放區同清單。',
      fleet: '提供 API 同排程執行嘅控制平面副本、負責執行工作嘅工作節點，同埋將工作節點分組用嚟排程放置嘅節點池。',
      access: '邊個可以登入、可以做啲乜：租用戶、用戶、存取金鑰、角色同角色指派。',
      monitoring: '調查發生過咩事：擷取咗嘅 API 請求、保安審計記錄，同埋即時 API 探索器。',
      system: '伺服器設定，同埋你連接緊嗰部伺服器嘅端點、版本同身份。'
    },
    tabs: {
      runs: '搜尋、篩選同檢查個別執行。打開一個就可以睇佢嘅對話記錄、結果同遙測數據，或者取消同重試。',
      queue: '等緊節點、已被租用或者而家執行緊嘅執行，按代理程式同 Harness 分組。',
      agents: '呼叫方透過 REST、MCP 或 A2A 調用嘅具名代理程式。代理程式係身份；佢嘅部署決定佢點樣執行。',
      deployments: '每個代理程式點樣執行：Harness 設定檔、模型、提示、MCP 伺服器、機密、工作區、排程放置、限制同流量權重。',
      harnessProfiles: '以無介面模式啟動 CLI Harness 嘅配方：執行檔、參數、環境變數、檔案同輸出解析。',
      promptTemplates: 'Garrison 傳畀 Harness 嘅每個提示同產生嘅設定檔，有版本控制同即時預覽。',
      mcpServers: '代理程式可以用嘅工具伺服器。喺度登記，然後綁定到部署。',
      secrets: '加密咗嘅 API 金鑰同權杖。部署用別名綁定佢哋；數值之後唔會再顯示。',
      workspaces: '執行工作目錄嘅範本：空白、由 Git 複製，或者預先放好檔案。',
      artifactStores: '執行產生、你想喺執行完之後保留嘅檔案嘅存放目的地。',
      manifests: '將成個租用戶嘅配置以 YAML 套用或者匯出，咁就可以放入原始碼控制。',
      nodes: '拉取執行並且運行 Harness 嘅工作機器或 Pod。喺度可以封鎖、清空或者檢查佢哋。',
      controlNodes: '提供 REST、MCP 同 A2A，並且排程執行嘅伺服器副本（控制節點）。其中一個係領導者，負責叢集維護。呢度只係顯示狀態、版本同活動，唔可以改。',
      nodePools: '具名嘅節點群組，可以選擇保留畀指定租用戶。部署可以要求用某個節點池。',
      tenants: '呢部伺服器上面互相隔離嘅組織，各自有自己嘅用戶、代理程式、機密同執行。',
      users: '用電郵同密碼登入嘅人。每個用戶都可以擁有存取金鑰。',
      credentials: '畀腳本、SDK 同服務用嘅存取金鑰。每條金鑰屬於一個用戶，權限同嗰個用戶一樣或者更少。',
      roles: '具名嘅權限組合，同埋權限本身。指派角色就可以授予存取權。',
      assignments: '將角色連接到用戶或存取金鑰嘅授權，範圍可以係成個租用戶或者單一資源。',
      requests: '呢部伺服器擷取咗嘅 API 請求，包括標頭、內容、時間同狀態，方便除錯整合。',
      audit: '保安同配置事件：登入、拒絕存取、機密變更、清單套用同節點變更。',
      explorer: '喺伺服器嘅 OpenAPI 文件度揀任何 API 操作，填好參數，即時執行。',
      settings: '伺服器同叢集設定，顯示佢哋嘅來源，同埋改咗之後係即時生效定係要重新啟動。',
      serverInfo: 'REST、MCP 同 A2A 地址、伺服器同控制台版本，同埋你登入緊嘅身份。',
      conversations: '與代理程式嘅多輪對話：每一輪都係一次執行，會恢復上一輪嘅工作階段。打開一個對話就可以閱讀各輪並傳送下一則訊息。'
    },
    subtabs: {
      roles: '角色將權限歸入一個名稱之下，例如 Operator 或 Invoker。指派一個角色畀人，佢就會得到角色入面所有權限。',
      permissions: '允許或拒絕對資源類型進行操作嘅個別規則。角色由呢啲規則組成；拒絕永遠優先。',
      userAssignments: '將角色授予用電郵同密碼登入嘅人。',
      credentialAssignments: '將角色授予自動化用嘅存取金鑰。金鑰嘅權限應該比佢嘅擁有者更窄。'
    },
    setup: '打開設定精靈：儲存一個 Harness 憑證、套用一個範例代理程式，再執行一次確認一切正常。',
    tour: '重播簡短嘅導覽，介紹導覽列、上下文，同埋配置喺邊度。',
    skipToContent: '跳過導覽列，直接去呢頁嘅主要內容。主要方便用鍵盤嘅用戶。'
  },
  topbar: {
    toggleSidebar: '收埋或者展開導覽側欄。喺細螢幕上，佢會以覆蓋層形式打開導覽。',
    server: '呢個控制台連接緊嘅 Garrison 伺服器：{{url}}。圓點顯示佢嘅健康檢查有冇通過。',
    health: {
      healthy: '伺服器喺過去 30 秒內有回應健康檢查。',
      unhealthy: '伺服器冇回應健康檢查。由呢頁發出嘅請求好可能會失敗。',
      unknown: '等緊伺服器第一個健康檢查結果。'
    },
    copyServer: '複製伺服器 URL，例如用嚟設定 SDK 或者 curl 指令。',
    switchTenant: '系統管理員可以睇任何租用戶。每一頁都會顯示所揀租用戶嘅資料。',
    tenant: '你而家喺租用戶 {{tenant}} 度工作。你睇到嘅每筆記錄同每個執行都屬於佢。',
    principal: '你以 {{name}} 嘅身份登入咗。你做嘅操作都會記錄喺呢個身份之下。',
    role: '你喺呢個租用戶嘅最高存取級別。佢決定你可以用邊啲頁面同操作。',
    liveOn: '已經透過 WebSocket 連接到伺服器，所以執行同節點嘅變化會即時出現。',
    liveOff: '冇即時連線。頁面會改為按自己嘅計時器重新整理，所以變更可能要幾秒先會顯示。',
    github: '喺新分頁打開 GitHub 上面嘅 Garrison 原始碼儲存庫，睇文件同問題回報。',
    themeLight: '轉去淺色主題。呢個瀏覽器會記住你嘅選擇。',
    themeDark: '轉去深色主題。呢個瀏覽器會記住你嘅選擇。',
    logout: '登出並撤銷呢個瀏覽器工作階段。之後你要再登入。',
    language: '更改顯示語言。日期同數字格式都會跟住語言改，系統會記住你嘅選擇。'
  },
  login: {
    passwordTab: '以個人身份，用租用戶、電郵同密碼登入。',
    keyTab: '用存取金鑰同密鑰登入，即係腳本同 SDK 用嘅同一對金鑰。',
    serverUrl: 'Garrison REST API 嘅基本地址，例如經過連接埠轉發、喺 127.0.0.1:8700 嘅伺服器。',
    tenantId: '你個帳戶所屬嘅租用戶。本機預設租用戶叫做 default。',
    email: '你喺呢個租用戶嘅用戶帳戶電郵地址。',
    password: '你嘅帳戶密碼。佢只會傳送一次嚟攞工作階段權杖，瀏覽器應用程式永遠唔會儲存佢。',
    accessKey: '存取金鑰嘅公開部分，以 access_ 開頭。喺「存取」>「存取金鑰」度建立金鑰。',
    secretKey: '存取金鑰嘅私密部分。佢只喺建立或輪換金鑰嗰陣顯示過一次。',
    submit: '向伺服器核對憑證，然後打開你租用戶嘅控制台。'
  },
  table: {
    selectAll: '揀選或者清除呢頁每一行，例如想一齊刪除佢哋。',
    selectRow: '揀呢一行嚟做批次操作，例如刪除。',
    sortServer: '{{tip}} 撳一下就會按呢欄排序成個列表；再撳一下就會倒轉次序。',
    sortPageOnly: '{{tip}} 撳一下只會排序呢頁嘅行；伺服器唔可以按呢欄排序。',
    clearSelection: '取消揀選所有已揀嘅行，乜都唔會改。',
    pageSize: '每頁載入幾多行。頁面越大，載入就越耐。每個表格都會記住你嘅選擇。',
    first: '去結果嘅第一頁。',
    prev: '返去結果嘅上一頁。',
    jump: '輸入 1 至 {{total}} 之間嘅頁數，再撳 Enter 直接跳過去。',
    next: '去結果嘅下一頁。',
    last: '去結果嘅最後一頁。',
    refresh: '即刻由伺服器重新載入呢個列表，保留你嘅頁數、篩選同排序。',
    autoRefresh: '按計時器自動重新載入呢啲資料。熄咗就會保持唔郁，方便你閱讀。',
    selectColumns: '揀表格要顯示邊啲欄。呢個瀏覽器會按表格記住你嘅選擇。',
    columnPinned: '{{column}} 會一直顯示，因為冇咗佢就分辨唔到每一行。',
    columnToggle: '顯示或者隱藏 {{column}} 欄。{{tip}}',
    actionsFor: '打開 {{name}} 嘅操作：檢視、編輯、複製一份、檢視 JSON、刪除，同埋呢類記錄專屬嘅操作。',
    actionsMenu: '打開呢一行可以用嘅操作。',
    actionsColumn: '每行嘅操作。撳三點圖示就可以檢視、編輯、複製一份、檢查 JSON 或者刪除。',
    search: '輸入部分名稱嚟收窄列表。你停低唔打字之後，伺服器就會執行搜尋。',
    clearFilters: '清除搜尋文字同所有篩選，再顯示完整列表。',
    bulkDelete: '刪除所有已揀嘅行。系統會先叫你確認。'
  },
  filters: {
    decisionSource: '只顯示用某種方式決定嘅批核：由規則、部署預設、人手、逾時或者已停止嘅執行決定。',
    runId: '只顯示某一個執行嘅批核。貼上執行 ID，例如 run_...；你停低唔打字，清單就會更新。',
    status: '只顯示處於呢個狀態嘅記錄。揀「全部」就會移除篩選。',
    harnessType: '只顯示某一個 Harness 嘅記錄，例如 Claude Code 或 Codex。',
    kind: '只顯示某一種類嘅記錄。揀「全部」就會移除篩選。',
    eventType: '只顯示某一類型嘅審計事件，例如登入失敗或者機密變更。',
    fromUtc: '只顯示喺呢個時間或之後建立嘅記錄（以你本地時區計）。',
    toUtc: '只顯示喺呢個時間之前建立嘅記錄（以你本地時區計）。',
    method: '只顯示用咗呢個 HTTP 方法嘅請求。',
    statusCode: '只顯示返回呢個 HTTP 狀態碼嘅請求，例如 404 或 500。',
    pathContains: '只顯示路徑包含呢段文字嘅請求，例如 /agents。',
    tenantId: '只顯示喺呢個租用戶發出嘅請求。留空就係所有租用戶。',
    apply: '用上面嘅篩選值執行搜尋。',
    clear: '將上面所有篩選重設為空白，再搜尋一次。',
    agentId: '只顯示屬於某個代理程式嘅紀錄。選擇「全部」可移除呢個篩選。'
  },
  form: {
    option: '將 {{option}} 加入 {{field}}。剔咗嘅選項會儲存；冇剔嘅就唔會包括。',
    reveal: '以純文字顯示你輸入嘅數值，方便你儲存之前檢查。',
    hide: '再次遮蓋數值，等睇住你螢幕嘅人睇唔到。',
    key: '{{field}} 呢個項目嘅鍵。列表入面嘅鍵必須唯一。',
    value: '{{field}} 呢個項目嘅值。有註明嘅地方可以用範本同機密引用。',
    removeRow: '將呢個項目由列表移除。撳「儲存」之前乜都唔會儲存。',
    addRow: '喺 {{field}} 加一個空白嘅鍵值項目。',
    moveUp: '將呢個項目向前移一位。呢度次序係有影響嘅，例如參數列表。',
    moveDown: '將呢個項目向後移一位。呢度次序係有影響嘅，例如參數列表。',
    removeItem: '將呢個項目由列表移除。撳「儲存」之前乜都唔會儲存。',
    addItem: '喺 {{field}} 加一個新嘅空白項目，再填好佢嘅欄位。'
  },
  actions: {
    openDetail: '打開呢筆記錄嘅完整詳細資料頁。',
    view: '以唯讀方式打開呢筆記錄，睇晒所有欄位都唔怕改錯嘢。',
    edit: '喺表單入面打開呢筆記錄嚟修改。撳「儲存」先會套用變更。',
    duplicate: '用呢筆記錄嘅數值同一個 -copy 名稱開一筆新記錄。儲存之前唔會建立任何嘢。',
    viewJson: '顯示 API 返回嘅原始 JSON，方便除錯或者複製入腳本。',
    delete: '永久刪除呢筆記錄。系統會叫你確認，而且冇得復原。',
    add: '用表單建立一筆呢個類型嘅新記錄。',
    switchToEdit: '將呢個唯讀檢視轉做可以編輯嘅表單。',
    retryLoad: '再試一次由伺服器載入呢啲資料。'
  },
  modal: {
    close: '關閉呢個視窗。伺服器上面乜都唔會改。',
    dismiss: '唔儲存就關閉呢個視窗。你亦可以撳 Escape。',
    cancelForm: '關閉表單，放棄未儲存嘅變更。',
    back: '返去表單上一步。你輸入咗嘅數值會保留。',
    next: '去表單下一步。撳「儲存」之前乜都唔會儲存。',
    saveEdit: '儲存你對呢筆記錄嘅變更。伺服器會驗證，並且話你知邊個欄位要處理。',
    saveCreate: '用呢啲數值建立記錄。伺服器會驗證，並且話你知邊個欄位要處理。',
    saveValue: '將數值傳送去伺服器。佢一到就會加密，之後唔會再顯示。'
  },
  confirm: {
    delete: '係，永久刪除呢筆記錄。',
    bulkDelete: '係，永久刪除所有已揀嘅記錄。',
    cancel: '乜都唔做，返回。',
    danger: '執行呢個破壞性操作。冇得復原。',
    confirm: '執行上面所講嘅操作。'
  },
  copy: {
    id: '將記錄 ID 複製去剪貼簿，畀 REST API、SDK 或者篩選器用。',
    value: '將呢個數值複製到剪貼簿。',
    block: '將成段內容複製到剪貼簿，可以直接貼入終端機或者檔案。',
    done: '已經複製到剪貼簿。'
  },
  chart: {
    ranges: {
      hour: '顯示過去 60 分鐘，每一分鐘一格。',
      day: '顯示過去 24 小時。每格嘅大小會自動調整，等圖表易睇。',
      week: '顯示過去 7 日。每格嘅大小會自動調整，等圖表易睇。',
      month: '顯示過去 30 日。每格嘅大小會自動調整，等圖表易睇。',
      custom: '自己揀開始同結束時間。範圍太長嘅話伺服器會拒絕。'
    },
    refresh: '即刻由伺服器重新載入圖表資料。',
    tenant: '顯示某一個租用戶，或者伺服器上所有租用戶嘅請求活動。'
  },
  badges: {
    approvalsOn_one: '批核開咗：Harness 會喺工具呼叫之前問，而 {{count}} 條規則會自動決定其中一部分。',
    approvalsOn_other: '批核開咗：Harness 會喺工具呼叫之前問，而 {{count}} 條規則會自動決定其中一部分。',
    approvalsOff: '批核關咗：Harness 會跟自己嘅權限設定做工具呼叫，唔會問任何人。',
    active: '啟用：呢筆記錄使用緊。',
    inactive: '停用：呢筆記錄會保留，但喺重新啟用之前會被忽略。',
    builtIn: '內置：隨 Garrison 提供，只可以讀取。複製一份就可以得到你可以編輯嘅版本。',
    custom: '自訂：喺呢個租用戶度建立，所以可以編輯同刪除。',
    systemAdmin: '系統管理員：可以管理所有租用戶，並且會略過授權檢查。',
    tenantAdmin: '租用戶管理員：可以管理呢個租用戶入面所有嘢。',
    user: '一般用戶：存取權只會嚟自角色指派。',
    role: '呢個指派會授予 {{role}} 角色，同埋角色入面每一項權限。',
    deploymentActive: '啟用：呢個部署會收到佢應得嘅代理程式流量份額。',
    deploymentInactive: '停用：呢個部署唔會收到流量，但調用時仍然可以明確指名用佢。'
  },
  permissions: {
    source: '呢項授權嚟自嘅角色。想修正存取權，就改嗰個角色或者授予佢嘅指派。',
    type: '「允許」會准許呢啲操作；「拒絕」會封鎖佢哋，就算有其他角色允許都一樣。',
    resources: '呢項授權涵蓋嘅記錄類型，例如 Agent 或 Run。',
    operations: '可以對嗰啲記錄做嘅事，例如 Read、Create 或 Execute。',
    scope: '「租用戶」範圍涵蓋呢個類型所有記錄；「資源」範圍只涵蓋一筆指定記錄。'
  },
  compilePreview: {
    input: '用嚟編譯嘅範例呼叫方訊息。佢會變成任務範本入面嘅 {{input.message}}。',
    compile: '完全按照執行嘅方式編譯呢個部署，但唔會真係開始執行，然後顯示指令行、檔案同環境變數。'
  },
  secretOnce: {
    accessKey: '公開存取金鑰。佢用嚟識別呢個憑證，可以安全咁儲存喺配置入面。',
    secretKey: '密鑰。呢度係唯一一次顯示佢；即刻複製去你嘅密碼管理器或者機密儲存庫。',
    done: '關閉呢個視窗。密鑰之後攞唔返，只可以輪換。'
  },
  wizard: {
    skip: '關閉精靈，呢個租用戶以後都唔會再彈出。你可以喺側欄重新打開佢。',
    back: '返去精靈上一步。',
    start: '開始設定：加入憑證、套用範例代理程式，再測試佢。',
    saveSecret: '將憑證加密儲存喺呢個租用戶，然後去下一步。',
    skipStep: '唔加憑證繼續。範例代理程式唔需要憑證。',
    apply: '用上面顯示嘅清單建立範例代理程式同部署。',
    invoke: '用你嘅訊息開始執行範例代理程式，然後打開佢嘅詳細資料頁。',
    secretName: '已儲存憑證嘅名稱。部署綁定佢嗰陣就係用呢個名嚟引用。',
    manifest: 'YAML 格式嘅範例清單。套用之前你可以修改，例如幫代理程式改名。',
    message: '要傳送畀範例代理程式嘅訊息。模擬 Harness 會原樣回傳。'
  },
  tour: {
    skip: '即刻結束導覽。你可以喺側欄重播。',
    back: '顯示導覽上一站。',
    next: '去導覽下一站。',
    done: '完成導覽。你可以喺側欄重播。'
  },
  telemetry: {
    ...TELEMETRY,
    panel: '呢個執行每個階段用咗幾耐、消耗咗啲乜。時長嚟自工作節點同伺服器嘅時鐘，每個欄位都有說明。',
    phases: '執行嘅時間花咗喺邊度，由左至右：喺隊列等候、Harness 啟動到第一個 Token、串流輸出，同埋其餘執行時間。',
    phase: {
      delegation: '喺模型第一個輸出之前，執行等佢委派咗嘅子執行嘅時間。呢段唔係 Harness 啟動時間。',
      queue: '喺隊列等工作節點租用呢個執行。',
      startup: '由程序啟動到模型第一個輸出，包括 Harness 啟動同第一個模型請求。',
      streaming: '由模型第一個輸出到最後一個輸出。',
      tail: '模型最後一個輸出之後嘅執行：工具呼叫、結果處理同程序結束。'
    }
  },
  blocked: {
    panel: '點解呢個執行仲排緊隊，同埋要改啲乜嘢先可以畀工作節點接手。',
    openFleet: '打開機群頁面，睇吓邊啲工作節點就緒、每個節點報咗邊啲 Harness，同埋探測詳情。',
    openAgent: '打開呢個執行嘅代理程式，檢查佢嘅部署，包括每個部署嘅節點池同節點選取器。',
    homeBanner: '而家冇就緒工作節點做到嘅排隊執行。佢哋會一直排隊，等到有工作節點做到為止；如果設定咗 Runtime.FailBlockedAfterSeconds，過咗時間就會失敗。',
    showRuns: '打開篩選咗排隊執行嘅執行頁面。塞住咗嘅執行會有一個警告徽章講明原因。',
    queueColumn: '呢個群組入面而家冇就緒工作節點做到嘅排隊執行。將游標停喺徽章上面就睇到原因同處理方法。'
  },
  enums: {
    approvalStatus: {
      Pending: '等緊有人允許或者拒絕。喺嗰之前，Harness 會卡喺呢個呼叫度。',
      Approved: '呢個工具呼叫已經允許咗，由規則、部署預設、人手或者逾時決定。',
      Denied: '呢個工具呼叫俾人拒絕咗。Harness 收到拒絕訊息，冇用呢個呼叫繼續落去。',
      Expired: '批核到期之前冇人及時決定，所以套用咗部署嘅逾時決定。',
      Cancelled: '批核仲等緊嘅時候個執行停咗，所以冇做決定就直接關閉咗。'
    },
    approvalDecision: {
      Allow: '允許：Harness 獲准做呢個工具呼叫，個執行會連同佢繼續。',
      Deny: '拒絕：Harness 嘅工具呼叫俾人拒絕咗，並且畀人話知點解。'
    },
    approvalSource: {
      Rule: '由部署上面嘅規則即刻決定。符合嘅規則會喺旁邊顯示。',
      Default: '呢個工具呼叫冇符合任何規則，所以由部署嘅預設動作決定。',
      User: '有人喺儀表板、經 API 或者經 MCP 決定咗。',
      Timeout: '批核到期之前都冇人做決定，所以套用咗部署嘅逾時決定。',
      Cancelled: '呢個批核仲等緊嘅時候，個執行停咗，所以冇做到決定。'
    },
    approvalRuleAction: {
      Allow: '允許：符合呢條規則嘅工具呼叫會直接進行，唔使問任何人。',
      Deny: '拒絕：符合嘅工具呼叫會直接俾人拒絕，唔使問任何人。拒絕凌駕其他所有規則。',
      Ask: '問人：符合呢條規則嘅工具呼叫會喺批核收件匣度等人決定。'
    },
    approvalKind: {
      Tool: 'Claude Code 為任何工具（包括 MCP 工具）彈出嘅權限提示。',
      Command: 'Codex app-server 執行想行嘅 Shell 指令。規則會當佢係 Bash 咁評估。',
      FileChange: 'Codex app-server 執行想做嘅檔案變更。規則會當佢係 Edit 咁評估。'
    },
    runBlockedReason: {
      NoReadyWorker: '塞住咗：冇任何工作節點係就緒狀態，所以冇節點可以接呢個執行。請啟動或者註冊一個工作節點，再喺機群頁面睇吓邊啲節點失聯、離線、清空緊或者已封鎖。',
      NoCapableWorker: '塞住咗：有就緒嘅工作節點，但係冇一個話呢個執行嘅 Harness 用得。請啟動或者註冊一個裝咗嗰個 Harness 嘅工作節點，或者喺機群頁面睇吓佢嘅憑證同探測結果。',
      NoMatchingPool: '塞住咗：有就緒嘅工作節點做到呢個 Harness，但係冇一個啱部署嘅節點池、節點池嘅租用戶限制或者節點選取器。請檢查部署嘅排程放置，或者喺嗰個節點池加工作節點。'
    },
    runStatus: {
      Pending: '等候中：執行已經接受咗，入隊之前準備緊。',
      Queued: '排隊中：等緊一個 Harness 同排程放置都符合嘅工作節點嚟租用。',
      Leased: '已租用：有工作節點認領咗呢個執行，準備緊工作區。',
      Running: '執行中：Harness 程序喺工作節點上面運行緊。',
      Cancelling: '取消緊：有人要求停止，工作節點而家關緊 Harness。',
      Succeeded: '成功：Harness 完成咗，並且產生咗有效結果。',
      Failed: '失敗：執行以錯誤結束。結果欄會講原因。',
      Cancelled: '已取消：有人喺執行完成之前停止咗佢。',
      TimedOut: '逾時：執行到咗期限，被停止咗。',
      Rejected: '已拒絕：執行開始唔到，例如因為冇啟用嘅部署。'
    },
    runOutcome: {
      None: '執行未完成，所以未有結果。',
      Succeeded: 'Harness 完成咗，而且結果通過咗驗證。',
      HarnessFailed: 'Harness 回報失敗，或者結束咗但冇可用結果。睇吓 stderr 同對話記錄。',
      NotInstalled: '喺工作節點上面搵唔到 Harness 執行檔。',
      NotCredentialed: 'Harness 冇可用嘅憑證。將一個機密綁定到部署。',
      McpPreflightFailed: '工作節點喺啟動前檢查嗰陣，連唔到一個必需嘅 MCP 伺服器或工具。',
      NodeLost: '工作節點持有呢個執行期間停止咗發送心跳。',
      OutputLimitExceeded: '個執行產生咗太多輸出：回答超過咗部署嘅最大助理字元數（一種執行防護），或者 Harness 寫出嘅內容多過 Harness 設定檔容許嘅量。到而家為止嘅輸出會保留。',
      SchemaValidationFailed: '結果唔符合代理程式嘅輸出 JSON Schema：修復過一次之後，或者 Harness 冇辦法恢復工作階段嗰陣即刻失敗。',
      TimedOut: '執行到咗期限。',
      Cancelled: '執行應要求被取消咗。',
      StaleLease: '工作節點失去租約之後先回報，所以佢嘅結果被忽略咗。',
      CompileFailed: '部署編譯唔到，例如因為缺少範本變數。',
      WorkspaceFailed: '工作區準備唔到，例如因為 Git 複製失敗。',
      Rejected: '請求喺執行開始之前已經被拒絕。',
      InternalError: 'Garrison 遇到內部錯誤。詳情睇伺服器日誌。',
      NoCapableWorker: '呢個執行喺隊列等嘅時間超過咗叢集設定 Runtime.FailBlockedAfterSeconds 准許嘅時長，又冇就緒嘅工作節點做到佢，所以已經失敗。',
      RepetitionDetected: '執行防護停咗個執行，因為佢嘅回答變成不停重複同一段短文字，或者得空白同標點。到而家為止嘅輸出會保留。可以用部署嘅重複防護調整。',
      NoProgress: '執行防護停咗個執行，因為超過部署嘅冇進展逾時時間都冇文字、思考或者工具活動。到而家為止嘅輸出會保留。',
      PodFailed: '執行 Pod 喺 harness 以外失敗咗：可能排程唔到、拉唔到映像、記憶體唔夠、俾人驅逐，或者冇回報就結束咗。錯誤訊息會講明原因。',
      ConversationStateLost: '原本應恢復呢一輪對話嘅節點已唔再保存對話嘅目錄。Garrison 會將這樣嘅一輪重新排入佇列一次，以回退方式執行；只有冇辦法這樣做時才會保留呢個結果。'
    },
    controlNodeStatus: {
      Starting: '啟動緊：副本仲喺度初始化，未開始處理流量。',
      Ready: '就緒：副本發緊心跳，並且處理緊 REST、MCP 同 A2A 請求。',
      Draining: '清空緊：已經開始關閉。就緒檢查會回應 503，佢嘅串流同長輪詢就快結束。',
      Offline: '離線：副本已經正常停咗，或者 30 秒冇心跳而俾領導者標記咗。離線嘅行會喺 24 個鐘之後刪除。'
    },
    backplane: {
      Local: '本機：事件只會留喺呢個程序入面。單一副本冇問題；其他副本睇唔到。',
      Polling: '資料庫輪詢：副本透過輪詢資料庫嚟共用即時事件。任何資料庫都用得，不過會有少少延遲。',
      PostgresNotify: 'PostgreSQL 通知：副本透過 PostgreSQL 嘅 LISTEN 同 NOTIFY 共用即時事件，延遲好少。'
    },
    nodeStatus: {
      Ready: '就緒：發送緊心跳，並且接受新嘅執行。',
      Draining: '清空緊：做緊手頭上嘅執行，唔再接受新嘅。',
      Cordoned: '已封鎖：唔接受新嘅執行；現有執行照常繼續。',
      Lost: '失聯：錯過咗心跳。佢嘅執行會重新入隊或者標為失敗。',
      Offline: '離線：已經正常關閉，冇持有任何執行。'
    },
    harnessType: {
      ClaudeCode: 'Anthropic Claude Code CLI，以無介面模式運行，輸出 stream-JSON。',
      Codex: 'OpenAI Codex CLI，用 exec 運行，輸出 JSONL。',
      Mux: 'Mux CLI，輸出 JSONL；可以用本機同託管嘅模型端點。',
      GeminiCli: 'Google Gemini CLI，輸出 stream-JSON。',
      Generic: '任何其他指令行代理程式，完全由 Harness 設定檔描述。'
    },
    agentKind: {
      Hosted: '託管：Garrison 自己透過工作節點上嘅部署運行呢個代理程式。',
      Remote: '遠端：代理程式喺其他地方運行，Garrison 將呼叫轉發去佢嘅 A2A 或 MCP 端點。'
    },
    secretStatus: {
      Ok: '就 Garrison 所知，呢個憑證用得。設定新數值之後，機密一定會返到呢個狀態。',
      NeedsReauthentication: 'OpenAI 已經永久拒絕咗儲存咗嘅 ChatGPT 登入，例如佢嘅更新權杖已經用過。用緊呢個機密嘅執行會一直失敗，直至你用新嘅登入換咗佢嘅數值。'
    },
    secretKind: {
      AnthropicApiKey: 'Anthropic API 金鑰，由 Claude Code 設定檔以 ANTHROPIC_API_KEY 注入。',
      ClaudeCodeOAuthToken: 'Claude Code 訂閱權杖。喺共用伺服器用之前，請先睇清楚供應商條款。',
      OpenAiApiKey: '畀 Codex 或其他以 OpenAI 為後端嘅 Harness 用嘅 OpenAI API 金鑰。',
      CodexAuthJson: 'Codex auth.json 檔案嘅內容，會寫入執行嘅 HOME 目錄。',
      GeminiApiKey: '畀 Gemini CLI 用嘅 Google Gemini API 金鑰。',
      GenericEnv: '任何打算放入環境變數嘅數值。',
      GenericFile: '任何打算寫入檔案嘅數值。',
      BearerToken: 'Bearer 權杖，通常用喺 MCP 伺服器嘅 Authorization 標頭。',
      BasicAuth: '用嚟做基本驗證嘅用戶名稱同密碼。',
      GitCredential: '工作區用嚟複製私人 Git 儲存庫嘅權杖或密碼。'
    },
    workspaceKind: {
      Empty: '每個執行都喺一個新嘅空白目錄開始。',
      GitRepository: '每個執行都由一個全新複製嘅 Git 儲存庫開始。',
      Seeded: '每個執行開始時都有範本列出嘅檔案。',
      PersistentVolume: '每次執行都會將一個已經存在嘅 PersistentVolumeClaim 掛載做工作區，所以檔案會喺執行之間保留。需要 Kubernetes Job 執行器。'
    },
    runExecutor: {
      Process: 'Harness 以 worker 嘅子程序形式喺 worker 嘅容器入面執行，有自己嘅工作、home 同設定目錄。',
      KubernetesJob: 'Worker 每次執行都會開一個 Kubernetes Job：harness 喺自己嘅 Pod 入面執行，冇 Kubernetes 或者 Garrison 憑證，根檔案系統唯讀，並受部署嘅資源上限限制。'
    },
    promptTemplateKind: {
      System: '系統提示：設定代理程式嘅常設指示。',
      Task: '任務提示：將呼叫方嘅訊息包裝成 Harness 收到嘅內容。',
      Fragment: '可重用嘅片段，其他範本用 {{> name}} 引入。',
      ToolDescription: '將代理程式描述成 MCP 工具或者 A2A 技能嘅文字。',
      ConfigFile: '產生出嚟嘅設定檔內容，例如 MCP 設定。',
      Other: 'Harness 設定檔渲染嘅任何其他文字。'
    },
    mcpTransport: {
      Http: 'Garrison 同 Harness 透過 URL 用可串流 HTTP 連接伺服器。',
      Stdio: 'Harness 以本機程序啟動伺服器，透過 stdin 同 stdout 同佢溝通。'
    },
    permissionType: {
      Permit: '允許：准許列出嘅操作。',
      Deny: '拒絕：封鎖列出嘅操作，就算有其他權限允許都一樣。'
    },
    artifactStoreKind: {
      Database: '成品儲存喺 Garrison 資料庫。簡單，但最適合細檔案。',
      Filesystem: '成品會寫入伺服器存取得到嘅目錄。',
      S3: '成品會上載到兼容 S3 嘅儲存桶。'
    },
    manifestApplyResult: {
      Created: '呢份文件建立咗一筆新記錄。',
      Updated: '呢份文件修改咗一筆現有記錄。',
      Unchanged: '記錄本身已經同呢份文件一致，所以冇改到任何嘢。',
      Failed: '呢份文件驗證失敗。清單入面乜都冇寫入。',
      Validated: '試行：呢份文件有效，會被套用。'
    },
    auditEventType: {
      ApprovalDecided: '有人允許或者拒絕咗一個等候中嘅工具呼叫。記錄會列出工具、執行同原因。',
      AuthSuccess: '有人成功登入，或者成功驗證咗一個請求。',
      AuthFailure: '有一次登入或驗證失敗。重複失敗可能代表有人喺度估密碼。',
      SessionIssued: '發出咗一個工作階段權杖。',
      SessionRevoked: '撤銷咗一個工作階段權杖，例如因為登出。',
      CredentialCreated: '建立咗一條新嘅存取金鑰。',
      CredentialRotated: '一條存取金鑰嘅密鑰被替換咗。',
      CredentialUsed: '有存取金鑰用咗嚟驗證身份。',
      AuthorizationDenied: '有請求因為呼叫方冇權限而被拒絕。',
      AuthorizationBypass: '有請求透過略過規則跳過咗授權，例如系統管理員。',
      RoleChanged: '有角色被建立、修改或者刪除。',
      PermissionChanged: '有權限被建立、修改或者刪除。',
      AssignmentChanged: '有角色指派被建立、修改或者刪除。',
      ConfigurationChanged: '有代理程式、部署、設定檔、範本或其他配置記錄改咗。',
      SecretChanged: '有機密被建立、修改、輪換或者刪除。',
      SettingsChanged: '伺服器設定改咗。',
      RestartRequested: '有人要求伺服器重新啟動。',
      ManifestApplied: '有清單套用咗到租用戶。',
      NodeRegistered: '有工作節點向控制平面登記咗。',
      NodeStatusChanged: '有工作節點被封鎖、清空、失聯或者恢復咗。',
      RunCancelled: '有執行被用戶、存取金鑰或者佢嘅上層執行取消咗。',
      ConversationDeleted: '有人刪除了一個對話。佢嘅各輪作為一般執行保留。'
    },
    conversationFallbackReason: {
      AffinityNodeLost: '保存對話嘅節點已唔再就緒（遺失、清空中、已隔離或已刪除），因此由另一個節點領取了呢一輪。',
      AffinityWaitExpired: '保存對話嘅節點保持就緒，但冇在 Runtime.ConversationAffinityWaitMs 內領取呢一輪，因此由另一個節點領取。',
      WorkspaceLost: '節點領取了呢一輪，但對話嘅工作區和主目錄已不在該節點上。',
      SessionMissing: '存在先前嘅輪次，但冇一輪回報可恢復嘅 Harness 工作階段，例如佢哋都在早期失敗了。',
      HarnessChanged: '自記錄工作階段以來，部署嘅 Harness 設定檔已變更，新嘅設定檔冇辦法恢復該工作階段。',
      ResumeUnsupported: '部署嘅 Harness 設定檔唔支援恢復工作階段，因此後續每一輪都從紀錄開始。',
      ExecutorWithoutState: '呢一輪以 Kubernetes Job 執行，每次都從空嘅主目錄開始，因此後續每一輪都從紀錄開始。'
    }
  },
  resources: {
    approvals: {
      createdUtc: 'Harness 問嘅時間。將滑鼠停喺數值上面就可以睇到確實時間。',
      agentName: '佢嘅執行要求做呢個工具呼叫嘅代理程式，可以打開睇詳情。',
      toolName: 'Harness 想用嘅工具，例如 Bash、Edit、WebFetch 或者 MCP 工具。',
      summary: '呢個呼叫嘅一行摘要：指令、URL、路徑或者查詢，機密已經遮蓋咗。',
      status: '決定之前係「等候中」，之後係「已批准」、「已拒絕」、「已過期」（逾時）或者「已取消」（執行停咗）。',
      decision: '決定咗之後係「允許」或者「拒絕」；批核仲等緊嘅時候係空白。',
      decisionSource: '由咩決定：規則、部署預設、人手、逾時或者已停止嘅執行。',
      decidedBy: '由人決定嘅時候，呢度顯示做決定嘅人或者存取金鑰；其他情況係空白。',
      expiresUtc: '等候中嘅批核幾時會逾時，到時就會套用部署設定嘅逾時決定。',
      kind: '工具呼叫（Claude Code）、指令或者檔案變更（Codex app-server）。',
      harnessType: '提出要求嘅 Harness：Claude Code 或者 Codex。',
      runId: '提出要求嘅執行。打開佢就可以睇呢個呼叫前後嘅對話記錄。',
      rootRunId: '如果提出要求嘅執行係委派出嚟嘅，呢個就係委派樹最頂層嘅執行。',
      deploymentId: '用佢嘅規則評估呢個呼叫嘅部署。記住咗嘅規則會加落佢度。',
      leaseEpoch: '提出要求嗰次執行嘗試嘅租約世代，確保決定唔會送到之後嘅嘗試。',
      requestedUtc: 'Harness 要求權限嘅時間，將滑鼠停喺數值上面就睇到確實時間。',
      decidedUtc: '做決定嘅時間，將滑鼠停喺數值上面就可以睇到確實時間。',
      waitMs: '呢個工具呼叫由 Harness 提出要求到有決定之間等咗幾耐。',
      timeoutDecision: '如果批核到期之前冇人決定會點，呢個值嚟自部署設定。',
      toolCallId: 'Harness 自己畀呢個工具呼叫嘅 ID，用嚟喺對話記錄度搵返對應嘅呼叫。',
      reason: '做決定嘅人寫低嘅備註（如果有），拒絕嘅話亦會傳畀代理程式。',
      inputPreview: 'Harness 傳送嘅工具輸入，以 JSON 顯示，機密同似 Token 嘅數值都遮蓋咗。',
      rulePattern: '當規則決定咗呢個呼叫或者要求問人嘅時候，符合呢個呼叫嘅部署規則。',
      ruleId: '符合呢個呼叫嘅部署規則 ID，可以用嚟喺部署嘅批核規則度搵返佢。',
      suggestedRule: '一條會符合呢個呼叫嘅規則。「記住做規則」會預先填好佢。',
      rememberedRuleId: '用「記住」決定呢個批核嗰陣，加咗落部署嘅規則 ID。',
      id: '批核識別碼（apr_...），畀 API 同 MCP 工具用。',
      actions: {
        allow: '允許呢個等候中嘅工具呼叫，可以附上原因，亦可以揀記住做規則。',
        deny: '拒絕呢個等候中嘅工具呼叫，可以附上原因，亦可以揀記住做規則。',
        openRun: '打開提出要求嘅執行，睇呢個工具呼叫前後嘅對話記錄。'
      }
    },
    tenants: {
      add: '建立新租用戶：一個獨立空間，有自己嘅用戶、代理程式、機密同執行。',
      name: '租用戶嘅顯示名稱。登入嗰陣大家係用租用戶 ID 嚟揀。',
      description: '呢個租用戶係畀邊個或者做咩用，例如某個團隊或客戶。',
      active: '停用咗嘅租用戶唔可以登入或者執行代理程式。佢嘅資料會保留。'
    },
    users: {
      add: '建立一個用電郵同密碼登入嘅人。之後用角色指派畀佢存取權。',
      email: '呢個人登入用嘅地址。喺租用戶入面必須唯一。',
      name: '名同姓，會喺審計記錄同列表顯示。',
      role: '帳戶嘅管理員級別。一般用戶經角色指派獲得存取權。',
      password: '登入密碼。編輯嗰陣留空就會保留現有密碼。',
      firstName: '名，會喺列表同審計記錄顯示。',
      lastName: '姓，會喺列表同審計記錄顯示。',
      isTenantAdmin: '租用戶管理員可以管理呢個租用戶入面所有嘢，包括用戶同機密。',
      isAdmin: '系統管理員管理所有租用戶，並且略過授權。唔好隨便畀。',
      active: '停用咗嘅用戶唔可以登入，佢嘅存取金鑰亦會失效。',
      actions: { permissions: '顯示呢個用戶合併晒所有角色同指派之後最終擁有嘅每一項權限。' }
    },
    credentials: {
      add: '為腳本、SDK 或服務建立存取金鑰。儲存之後密鑰只會顯示一次。',
      name: '呢條金鑰嘅用途，例如 ci-pipeline。方便你輪換或刪除之前搵返佢。',
      accessKey: '金鑰嘅公開部分，每個請求都會一齊傳送。可以安全咁儲存喺配置入面。',
      secretKeyLast4: '密鑰嘅最後四個字元，等你唔使睇到密鑰都可以核對係邊條金鑰。',
      userId: '擁有呢條金鑰嘅用戶。金鑰嘅權限永遠唔會超過佢嘅擁有者。',
      lastUsedUtc: '金鑰最後一次驗證請求嘅時間。日期好舊即係冇用緊，可以刪除。',
      authMode: '金鑰可以點樣驗證：直接傳送、每個請求簽署、換取工作階段，或者以上任何一種（Hybrid）。',
      expiresUtc: '過咗呢個時間金鑰就會失效。留空即係永不過期。',
      active: '停用咗嘅金鑰會被拒絕但會保留，你可以再啟用佢。',
      actions: {
        rotate: '用新密鑰取代舊密鑰。舊密鑰即刻失效；新密鑰只會顯示一次。',
        permissions: '顯示呢條金鑰合併擁有者、角色同指派之後最終擁有嘅每一項權限。'
      }
    },
    roles: {
      add: '建立自訂角色，然後加入權限，再指派畀用戶或者金鑰。',
      name: '指派角色嗰陣大家睇到嘅名稱，例如 Release Operator。',
      description: '呢個角色做咩用，應該畀邊個。',
      active: '停用咗嘅角色乜權限都唔會授予，就算已經指派咗都一樣。',
      actions: { clone: '將呢個內置角色複製一份可以編輯嘅版本，等你自行調整。' }
    },
    permissions: {
      add: '建立一條允許或拒絕對資源類型進行操作嘅規則。',
      name: '規則嘅簡短名稱，喺你組合角色嗰陣顯示。',
      permissionType: '「允許」會准許下面嘅操作。「拒絕」會封鎖佢哋，而且永遠凌駕「允許」。',
      resourceTypes: '規則涵蓋邊啲記錄類型。All 即係涵蓋所有類型。',
      operationTypes: '規則涵蓋邊啲操作，例如 Read、Create 或 Execute（調用）。',
      active: '停用咗嘅權限冇任何效果。'
    },
    userAssignments: {
      add: '畀用戶一個角色，範圍可以係成個租用戶或者某一筆指定記錄。',
      userId: '獲得呢個角色嘅人。',
      roleName: '授予嘅角色。呢個人會得到角色入面每一項權限。',
      roleId: '要授予嘅角色。呢個人會得到角色入面每一項權限。',
      resourceScope: '「租用戶」會將角色套用到所有記錄。「資源」會將範圍限制喺下面指名嗰一筆記錄。',
      resourceId: '角色套用到嗰一筆記錄嘅識別碼，例如某個代理程式 ID。',
      inheritsToChildren: '將角色套用到租用戶入面每一筆記錄，包括之後先建立嘅記錄。',
      active: '停用咗嘅指派唔會授予任何權限，但會保留。'
    },
    credentialAssignments: {
      add: '畀存取金鑰一個角色，範圍可以係成個租用戶或者某一筆指定記錄。',
      credentialId: '獲得呢個角色嘅存取金鑰。佢嘅權限仍然唔可以超過佢嘅擁有者。',
      roleName: '授予呢條金鑰嘅角色。',
      roleId: '要授予嘅角色。揀一個剛好夠自動化完成工作、範圍最窄嘅角色。',
      resourceScope: '「租用戶」會將角色套用到所有記錄。「資源」會將範圍限制喺下面指名嗰一筆記錄。',
      resourceId: '角色套用到嗰一筆記錄嘅識別碼，例如某個 CI 工作可以調用嘅嗰一個代理程式。',
      inheritsToChildren: '將角色套用到租用戶入面每一筆記錄，包括之後先建立嘅記錄。',
      active: '停用咗嘅指派唔會授予任何權限，但會保留。'
    },
    harnessProfiles: {
      add: '描述一種以無介面模式啟動 CLI 代理程式嘅新方法。通常複製一個內置設定檔會易啲。',
      name: '設定檔名稱。部署用呢個名嚟揀設定檔。builtin/ 前綴係保留咗嘅。',
      harnessType: '呢個設定檔啟動邊種 Harness。工作節點會公佈佢哋可以運行嘅類型，排程放置就係根據呢個。',
      executable: '喺工作節點上面運行嘅指令，可以喺 PATH 度搵到或者用絕對路徑，例如 claude。',
      outputParser: 'Harness 嘅輸出點樣變成對話記錄事件同最終結果。',
      description: '呢個設定檔有咩特別，例如佢加咗邊啲旗標。',
      probeArguments: '唔使用 Token 嘅版本檢查參數，例如 --version。工作節點啟動嗰陣會運行佢。',
      active: '停用咗嘅設定檔唔可以畀新嘅執行用。',
      arguments: '有次序嘅指令行參數。每個都係範本，可以因條件而略過，亦可以按列表重複。',
      argumentsItems: {
        template: '單一參數嘅文字，例如 --model 或 {{deployment.model}}。',
        condition: '範本表達式；如果渲染出嚟係空白或者 false，就會略過呢個參數。',
        repeatOver: '列表變數嘅名稱；每個元素都會輸出一次呢個參數。'
      },
      promptDelivery: '任務提示點樣去到 Harness：經標準輸入、作為參數，或者放喺檔案入面。',
      promptArgumentTemplate: '提示唔係經標準輸入傳送時，所用嘅參數或者檔案名稱。',
      systemPromptDelivery: '系統提示點樣去到 Harness：檔案、參數、環境變數、加喺任務前面，或者完全唔傳。',
      systemPromptTarget: '攜帶系統提示嘅旗標、變數或者檔案名稱。',
      mcpConfigFormat: '呢個 Harness 讀邊種 MCP 設定格式。Garrison 會用呢個格式寫入執行綁定咗嘅 MCP 伺服器。',
      mcpConfigFileName: '產生出嚟嘅 MCP 設定檔名稱，位於執行設定目錄入面。',
      environment: '程序嘅環境變數。數值係範本；{{secret.alias}} 會引入已綁定嘅機密。',
      environmentItems: {
        name: '變數名稱，例如 ANTHROPIC_API_KEY。',
        valueTemplate: '數值嘅範本。憑證用 {{secret.alias}}。',
        condition: '範本表達式；如果渲染出嚟係空白或者 false，就唔會設定呢個變數。',
        isSecret: '將數值當係機密處理：永遠唔會記錄落日誌，喺預覽入面會遮蓋。'
      },
      files: '啟動之前寫入嘅檔案，例如設定檔或者 auth.json。',
      filesItems: FILE_ITEMS,
      credentialEnvironmentAllowlist: '呢個 Harness 可以由機密填入嘅環境變數名稱。其他一律拒絕。',
      genericTextField: '每行輸出入面助理文字嘅 JSON 路徑，畀 Generic JSONL 解析器用。',
      genericFinalField: '最終結果文字嘅 JSON 路徑，畀 Generic JSONL 解析器用。',
      genericSuccessField: '表示執行有冇成功嘅 JSON 路徑，畀 Generic JSONL 解析器用。',
      genericSuccessValue: '成功路徑上代表執行成功嘅數值，例如 true。',
      resultSource: '最終答案嚟自邊度：解析器嘅最終事件、最後訊息檔案，或者成個標準輸出。',
      resultFileName: '結果來源係檔案時，Harness 寫入最後訊息嘅檔案名稱。',
      successPolicy: '點樣判斷成功：睇解析器最終事件、睇結束碼，或者兩樣都睇。',
      successExitCodes: '政策用結束碼時算做成功嘅結束碼。每行一個。',
      defaultTimeoutSeconds: '部署冇設定時嘅執行期限（秒）。介乎 5 至 86400。',
      killGraceSeconds: '要求程序停止之後，等幾多秒先強制結束佢成個程序樹。介乎 0 至 60。',
      maxOutputBytes: '執行最多可以產生幾多標準輸出，超過就會以「輸出超出上限」失敗。',
      stderrTailBytes: '保留標準錯誤結尾幾多內容，畀執行詳細資料頁顯示。',
      isolateHome: '畀每個執行一個獨立嘅 HOME 目錄，咁 Harness 設定同快取就永遠唔會喺執行之間洩漏。',
      supportsResume: '呢個 Harness 可唔可以恢復之前嘅工作階段。對話功能會用到。',
      steps: {
        basics: '名稱、Harness 類型、執行檔同版本探測。',
        invocation: '參數、提示傳遞方式、MCP 設定、環境變數同檔案。',
        output: '輸出點樣解析，同埋點樣判斷成功。',
        limits: '逾時、輸出上限同 HOME 隔離。'
      },
      actions: { clone: '喺你嘅租用戶複製一份可以編輯嘅設定檔，名稱會加上 -custom 後綴。' }
    },
    promptTemplates: {
      actions: { clone: '用你揀嘅新名複製呢個範本，然後喺編輯器打開副本。' },
      add: '喺有即時預覽嘅編輯器寫一個新嘅提示範本。每次儲存都會變成一個版本。',
      name: '範本名稱，喺租用戶入面唔可以重複。部署用 ID 綁定範本，所以改名唔會影響綁定；引入就用名稱參照。',
      kind: '範本嘅用途：系統提示、任務包裝、片段、工具描述，或者設定檔。',
      currentVersion: '最新儲存嘅版本。部署可以固定一個版本，或者跟住最新版本。',
      description: '範本做咩，同埋喺邊度用到。'
    },
    mcpServers: {
      add: '登記一個 MCP 伺服器，等部署可以綁定佢，部署嘅代理程式就可以用佢嘅工具。',
      name: '伺服器名稱。部署用呢個名綁定佢，並且畀佢一個別名。',
      transport: 'HTTP 伺服器經 URL 連接；stdio 伺服器由 Harness 以本機程序啟動。',
      endpoint: '點樣連接伺服器：佢嘅 URL 同路徑，或者 stdio 伺服器嘅指令。',
      required: '開咗之後，如果連唔到呢個伺服器或者佢必需嘅工具，執行喺啟動之前就會失敗。',
      description: '呢個伺服器提供咩工具，邊啲代理程式應該用佢。',
      url: '工作節點連接伺服器用嘅基本 URL，唔包括 MCP 路徑。',
      path: '嗰部伺服器上 MCP 端點嘅路徑，通常係 /mcp。',
      headers: '傳送畀伺服器嘅 HTTP 標頭，例如 Authorization。數值可以用 {{secret.alias}}。',
      headersItems: {
        name: '標頭名稱，例如 Authorization。',
        valueTemplate: '標頭數值範本，例如 Bearer {{secret.github}}。'
      },
      command: '喺工作節點上啟動 stdio 伺服器嘅執行檔。',
      arguments: 'stdio 伺服器指令嘅參數，每行一個。',
      environment: 'stdio 伺服器程序嘅環境變數。數值可以用 {{secret.alias}}。',
      environmentItems: {
        name: '伺服器程序嘅變數名稱。',
        valueTemplate: '數值範本。憑證用 {{secret.alias}}。'
      },
      requiredTools: '呢個伺服器上必須有嘅工具。工作節點會喺啟動前檢查，缺少任何一個執行就會失敗。',
      toolTimeoutSeconds: '單一工具呼叫最多可以用幾耐，超過 Harness 就會放棄。',
      active: '停用咗嘅伺服器唔會包括喺新嘅執行入面，就算部署有綁定都一樣。',
      actions: { test: '即刻連接伺服器並列出佢嘅工具，檢查地址同憑證啱唔啱。' }
    },
    secrets: {
      status: '儲存咗嘅憑證仲用唔用得。Codex 登入更新唔到嘅時候，Garrison 會標示佢要重新驗證。',
      accessTokenExpiresUtc: '儲存咗嘅 Codex ChatGPT 登入入面嘅存取權杖幾時到期。Garrison 會喺之前更新佢，再將新權杖寫返入機密。',
      refreshedUtc: 'Garrison 上次自己更新呢個 Codex 登入嘅時間。執行永遠只會收到冇更新權杖嘅副本。',
      statusMessage: '提供者報告嘅登入用唔到原因。',
      statusUtc: 'Garrison 發現個登入再更新唔到嘅時間。',
      add: '儲存新嘅憑證，例如 API 金鑰或權杖，靜態時會加密。部署用別名引用佢；儲存之後數值唔會再顯示。',
      name: '機密名稱。部署用呢個名揀機密，並且畀佢一個別名。',
      kind: '呢個係邊類憑證。內置設定檔靠呢個類型知道要填入邊個變數或者檔案。',
      valueLast4: '已儲存數值嘅最後四個字元，等你唔使顯示出嚟都分得出係邊個機密。',
      rotatedUtc: '數值最後一次設定或輪換嘅時間。',
      expiresUtc: '參考用嘅到期日。喺呢個日期之前輪換數值。',
      description: '數值嚟自邊度，邊啲代理程式需要佢。',
      value: '機密數值。儲存時會加密，之後永遠讀唔返，只可以取代。',
      newValue: '替換嘅數值。儲存之後編譯嘅每個執行都會用新數值。',
      active: '停用咗嘅機密唔會注入執行。',
      saveValue: '加密並儲存新數值。舊數值會被丟棄，冇得恢復。',
      actions: {
        setValue: '用你輸入嘅新數值取代已儲存嘅數值。舊數值冇得恢復。',
        rotate: '換入新數值並記錄輪換時間，例如供應商發咗新金鑰之後。'
      }
    },
    workspaces: {
      add: '定義執行嘅工作目錄點樣準備：空白、由 Git 複製，或者預先放好檔案。',
      name: '範本名稱。部署用呢個名揀工作區範本。',
      kind: '「空白」由空目錄開始，「Git 儲存庫」會複製儲存庫，「預置檔案」會寫入下面列出嘅檔案。',
      gitUrl: '每個執行都要複製嘅儲存庫。私人儲存庫需要 Git 憑證機密。',
      retention: '執行之後目錄點處理：刪除、保留，或者只喺執行失敗時保留。',
      description: '工作區有咩內容，邊啲代理程式會用。',
      gitRef: '要簽出嘅分支、標籤或者 commit。留空就用預設分支。',
      gitDepth: '要攞幾多個 commit。1 最快；0 會攞晒成個歷史。',
      gitCredentialSecretId: '存放複製私人儲存庫所用權杖或密碼嘅機密。',
      persistentVolumeClaim: '掛載喺工作區路徑嘅 PersistentVolumeClaim 名稱。佢一定要已經喺執行命名空間入面存在；Garrison 永遠唔會建立或者刪除佢。',
      files: '執行開始之前寫入工作區嘅檔案。',
      filesItems: {
        path: '檔案相對於工作區根目錄嘅路徑。',
        content: '檔案嘅文字內容。'
      },
      active: '停用咗嘅範本唔可以畀新嘅執行用。'
    },
    artifactStores: {
      add: '為執行產生嘅檔案建立一個目的地，等佢哋喺執行工作區消失之後仲保留到。',
      name: '存放區名稱。部署用呢個名揀成品存放區。',
      kind: '檔案放喺邊度：Garrison 資料庫、檔案系統目錄，或者 S3 儲存桶。',
      description: '呢度存放啲乜，應該保留幾耐。',
      active: '停用咗嘅存放區唔會再收新成品。'
    },
    agents: {
      add: '建立一個新嘅代理程式身份。要為佢加最少一個部署，佢先會做嘢。',
      name: '符合 DNS 規則嘅名稱，呼叫方用佢經 REST、MCP 同 A2A 調用代理程式。只可以用細楷字母、數字同連字號。',
      displayName: '喺控制台同 A2A 代理程式卡顯示嘅易記名稱。',
      kind: '「託管」代理程式喺呢度透過部署運行。「遠端」代理程式喺其他地方運行，經佢嘅端點呼叫。',
      exposure: '邊啲協定會公佈呢個代理程式：A2A 會畀佢一張代理程式卡；MCP 會令佢成為 MCP 用戶端嘅工具。',
      delegationMode: '呢個代理程式嘅執行可以調用邊啲其他代理程式：冇、允許清單入面嘅，或者任何代理程式。',
      tags: '用嚟搵同分組代理程式嘅標籤。佢哋唔會影響代理程式點樣運行。',
      description: '用淺白文字講代理程式做咩。呼叫方同 A2A 卡都會睇到，所以要寫畀佢哋睇。',
      agentVersion: 'A2A 卡入面公佈嘅版本字串。代理程式行為改咗就要改佢。',
      remoteProtocol: 'Garrison 點樣呼叫遠端代理程式：A2A 或 MCP。',
      remoteEndpointUrl: '遠端代理程式 A2A 或 MCP 端點嘅地址。',
      exposeA2A: '發佈 A2A 代理程式卡，等其他 A2A 代理程式可以發現同呼叫呢個代理程式。',
      exposeMcpTool: '喺 Garrison 嘅 MCP 伺服器上將呢個代理程式提供成獨立工具，等 MCP 用戶端可以直接呼叫佢。',
      mcpToolName: 'MCP 用戶端睇到嘅工具名稱。留空就用代理程式名稱。',
      skills: '代理程式卡入面列出嘅 A2A 技能。佢哋描述呼叫方可以要求啲乜。',
      skillsItems: {
        skillId: 'A2A 卡入面技能嘅固定識別碼。',
        name: '顯示畀 A2A 呼叫方睇嘅簡短技能名稱。',
        description: '技能做咩，寫畀呼叫嘅代理程式睇。'
      },
      inputMode: 'Text 接受純文字訊息。Structured 要求輸入符合輸入 JSON Schema。',
      inputSchemaJson: '輸入模式係 Structured 時，輸入必須符合嘅 JSON Schema。',
      outputSchemaJson: '結果必須符合嘅 JSON Schema。Garrison 會驗證輸出，唔啱就用修復提示重試一次。',
      delegationAllowList: '委派用允許清單時，呢個代理程式可以呼叫嘅代理程式。',
      delegationMaxDepth: '喺呢個代理程式之下，代理程式之間嘅呼叫最多可以有幾多層。介乎 0 至 10。',
      delegationAllowRecursion: '容許同一個代理程式喺同一條呼叫鏈出現兩次。熄咗可以防止迴圈。',
      active: '停用咗嘅代理程式唔可以被調用。',
      sections: {
        identity: '代理程式係乜：佢嘅名稱、描述、類型同版本。',
        exposure: '邊啲協定公佈呢個代理程式，佢列出咗咩技能。',
        io: '代理程式接受咩輸入，必須返回咩輸出。',
        delegation: '呢個代理程式可唔可以呼叫其他代理程式，可以去到幾深。'
      }
    },
    deployments: {
      approvalsEnabled: '令 Harness 喺工具呼叫之前先問。下面啲規則會決定大部分呼叫；其餘嘅會喺批核收件匣度等人處理。只適用於 Claude Code 同 Codex app-server 設定檔。',
      approvalDefaultAction: '冇規則符合某個工具呼叫嘅時候會點：允許、拒絕，定係問人。',
      approvalTimeoutSeconds: '一個呼叫等人處理幾耐之後就套用逾時決定，由 10 至 3,600 秒。',
      approvalTimeoutDecision: '冇人及時回應嘅時候套用嘅決定。「拒絕」係安全嘅選擇。',
      approvalRules: '用 Claude Code 語法、有次序嘅規則。「拒絕」凌駕「問人」，「問人」凌駕「允許」；同一個動作入面會報告第一個符合嘅規則。',
      approvalRulesItems: {
        action: '符合呢條規則嘅工具呼叫會得到咩結果：允許、拒絕，或者問人。',
        pattern: 'Claude Code 規則，例如 Bash(npm test)、Bash(npm run *)、Edit(src/**)、Read、WebFetch(domain:example.com) 或者 mcp__github__*。',
        inputPattern: '可選嘅 .NET 正規表達式，工具輸入 JSON 都要符合，可以做到比模式更精細嘅控制。',
        description: '講明點解要有呢條規則，等日後負責維護佢嘅人都睇得明。'
      },
      approvalTest: '用部署已儲存嘅規則試一個工具呼叫，睇下佢會俾允許、拒絕，定係交畀人決定。',
      add: '建立部署：代理程式實際嘅運行方式，包括 Harness 設定檔、模型、提示同資源。',
      name: '部署名稱，喺租用戶入面唯一，例如 reviewer-claude。',
      agentId: '呢個部署運行嘅代理程式。調用嗰個代理程式時可能會揀中呢個部署。',
      harnessProfileId: '啟動 CLI 嘅 Harness 設定檔，例如 builtin/claude-code。',
      model: '傳畀 Harness 嘅模型名稱，例如 sonnet 或 gpt-5。範本可以用 deployment.model 讀取。',
      weight: '喺代理程式啟用中嘅部署之間嘅流量權重。權重 300 嘅部署收到嘅呼叫係權重 100 嘅三倍。',
      configVersion: '每次修改都會遞增。每個執行都會記錄佢係由邊個版本編譯出嚟。',
      description: '呢個部署同代理程式其他部署有咩分別，例如用平啲嘅模型。',
      active: '停用咗嘅部署唔會收到按權重分配嘅流量，但呼叫方仍然可以明確指名用佢。',
      fallbackModel: '主要模型超出負荷時改用嘅模型，前提係 Harness 支援。',
      effort: '傳畀支援嘅 Harness 嘅推理力度提示，例如 low、medium 或 high。',
      maxTurns: '一個執行最多可以有幾多個代理程式回合，超過 Harness 就會停止佢。',
      maxBudgetUsd: '每個執行嘅開支上限（美元），適用於會執行上限嘅 Harness。',
      parameters: '範本可以用 deployment.parameters.name 讀取嘅具名數值。',
      parametersItems: {
        name: '參數名稱，以 deployment.parameters.name 引用。',
        value: '預設值。只有列喺每次執行覆寫入面，呼叫方先可以覆寫佢。'
      },
      promptBindings: '每個角色（System、Task、DelegatedTask 等等）由邊個提示範本填入。',
      promptBindingsItems: {
        role: '呢個綁定填入嘅提示角色，例如 System 或 Task。',
        templateId: '嗰個角色用嘅範本。',
        pinnedVersion: '要固定嘅版本。留空就永遠用最新版本。'
      },
      resourceBindings: '呢個部署用嘅 MCP 伺服器同機密，每個都有一個畀範本用嘅別名。',
      resourceBindingsItems: {
        kind: '呢個綁定係 MCP 伺服器定係機密。',
        alias: '範本用嘅簡短名稱，例如 {{secret.anthropic}} 入面嘅 anthropic。',
        resourceId: '被綁定嘅 MCP 伺服器或機密。'
      },
      workspaceTemplateId: '每個執行嘅工作目錄點樣準備。留空即係一個全新嘅空白目錄。',
      artifactStoreId: '執行完成之後，佢哋產生嘅檔案上載去邊度。',
      argumentOverrides: '只對呢個部署修改 Harness 設定檔嘅參數：加喺後面、加喺前面、取代或者移除。',
      argumentOverridesItems: {
        operation: '要做咩：加喺後面、加喺前面、取代相符嘅參數，或者移除佢。',
        match: '要取代或者移除嘅現有參數。',
        template: '新嘅參數文字。可以用範本。',
        condition: '範本表達式；如果渲染出嚟係空白或者 false，就會略過呢個覆寫。'
      },
      environmentOverrides: '只對呢個部署加入或者取代嘅環境變數。',
      environmentOverridesItems: {
        name: '要加入或者取代嘅變數名稱。',
        valueTemplate: '數值範本。已綁定嘅機密用 {{secret.alias}}。',
        isSecret: '將數值當係機密處理：永遠唔會記錄落日誌，喺預覽入面會遮蓋。'
      },
      fileOverrides: '只對呢個部署加入或者取代嘅檔案。',
      fileOverridesItems: FILE_ITEMS,
      allowedRunOverrides: '呼叫方每次執行可以改、並且會經過驗證嘅參數。其他一律固定。',
      allowedRunOverridesItems: {
        name: '呼叫方每次執行可以設定嘅參數，例如 model 或 tone。',
        validation: '點樣檢查呼叫方嘅數值：任何值、一組數值、正規表達式，或者數字範圍。',
        pattern: '用逗號分隔嘅允許值、正規表達式，或者數字範圍嘅 min,max。'
      },
      nodePoolId: '只喺呢個節點池嘅節點上運行。留空就容許任何合資格嘅節點。',
      nodeSelector: '必須完全符合嘅節點標籤，例如 gpu=true。',
      nodeSelectorItems: {
        key: '節點必須有嘅標籤名稱。',
        value: '節點必須有嘅標籤數值。'
      },
      maxConcurrentRuns: '呢個部署喺所有節點上最多可以同時有幾多個執行。0 即係冇上限。',
      timeoutSeconds: '執行截止時間（秒）。留空就用 Harness 設定檔嘅預設值。叢集設定 Runtime.MaxRunSeconds 會限制每個執行，包括每次執行嘅時間限制。',
      maxAttempts: '一個執行總共最多可以試幾多次。介乎 1 至 10。',
      retryOnNodeLoss: '節點消失時將執行放返入隊列，而唔係當佢失敗。',
      steps: {
        approvals: 'Harness 可以做邊啲工具呼叫、唔可以做邊啲，同埋邊啲要等人處理。',
        basics: '名稱、代理程式同流量權重。',
        harness: 'Harness 設定檔、模型、限制同參數。',
        prompts: '每個提示角色由邊個範本填入。',
        resources: 'MCP 伺服器、機密、工作區同成品存放區。',
        overrides: '每個部署對參數、環境變數同檔案嘅修改，同埋呼叫方可以覆寫啲乜。',
        placement: '執行可以喺邊度運行，同時可以有幾多個。'
      },
      actions: {
        compilePreview: '用範例訊息編譯呢個部署，睇吓一個執行會得到嘅確實指令行、檔案同環境變數。',
        test: '打開「調用」頁並預先揀好呢個部署，傳一個真實訊息畀佢。'
      },
      repetitionGuard: '回答變成不停重複同一段短文字，或者得空白同標點嗰陣停止執行（結果係偵測到重複）。未設定就跟叢集預設值；剔或者唔剔個格就可以為呢個部署單獨設定。',
      maxAssistantChars: '一次執行喺 Garrison 停佢之前最多可以寫幾多個助理文字字元（結果係輸出超出上限）。0 即係唔設上限；留空就用叢集預設值。',
      noProgressSeconds: '冇工具呼叫進行緊嘅時候，如果咁多秒都冇文字、思考、工具呼叫或者工具結果，就停止執行（結果係冇進展）。0 即係熄咗佢；留空就用叢集預設值。',
      executor: '執行方式：程序（喺 worker 入面）或者 Kubernetes Job（每次執行一個 Pod，隔離更強）。留空就跟節點池嘅預設執行器，再唔係就用程序。',
      podCpuRequest: '執行 Pod 請求嘅 CPU，例如 250m。留空就用 worker 預設值。',
      podCpuLimit: '執行 Pod 最多可以用嘅 CPU，例如 2。留空就用 worker 預設值。',
      podMemoryRequest: '執行 Pod 請求嘅記憶體，例如 512Mi。留空就用 worker 預設值。',
      podMemoryLimit: '執行 Pod 最多可以用嘅記憶體，例如 4Gi。超過嘅執行會以「執行 Pod 失敗」結果停止。',
      podEphemeralStorageRequest: '執行 Pod 為工作區、home 同臨時檔案請求嘅本機磁碟，例如 1Gi。',
      podEphemeralStorageLimit: '執行 Pod 最多可以用嘅本機磁碟，例如 10Gi。超過嘅 Pod 會俾人驅逐，執行就會失敗。',
      useClusterDefault: '清除呢個部署自己嘅設定，等重複防護跟返叢集預設值。',
      sections: {
        guards: '執行防護會喺任何 Harness 上面盡早停止失控嘅執行。留空嘅每一項都會跟設定（執行階段）入面嘅叢集預設值。',
        execution: '揀執行喺邊度進行，如果係 Kubernetes Job 執行，就揀 Pod 嘅 CPU、記憶體同磁碟。'
      }
    },
    nodePools: {
      add: '建立節點池嚟將節點分組，亦可以選擇保留畀某啲租用戶。',
      name: '節點池名稱。節點登記時會加入節點池，部署可以要求用某個節點池。',
      description: '呢個節點池代表咩硬件或者用途。',
      tenants: '可以用呢個節點池嘅租用戶。留空即係所有租用戶。',
      defaultExecutor: '呢個池入面冇自己揀執行器嘅部署，佢哋嘅執行會用呢個執行器。留空即係程序。',
      active: '停用咗嘅節點池唔會接受新嘅執行。'
    },
    runs: {
      ...TELEMETRY,
      id: '執行識別碼。撳呢一行就可以打開對話記錄、結果同遙測數據。',
      agentName: '被調用嘅代理程式。每個執行一定屬於嗰個代理程式嘅其中一個部署。',
      status: '執行喺生命週期嘅邊個階段：排隊中、已租用、執行中，或者其中一個已完成狀態。',
      outcome: '執行點解結束，比狀態更詳細，例如「缺少憑證」。',
      harnessType: '執行呢個執行嘅 Harness，取自部署嘅設定檔。',
      leaseNodeName: '運行佢嘅工作節點。執行仲喺隊列時會留空。',
      depth: '呢個執行喺代理程式之間嘅呼叫有幾多層深。0 即係由呼叫方直接開始嘅執行。',
      createdUtc: '要求執行嘅時間。將滑鼠停喺數值上面可以睇準確時間。',
      actions: {
        cancel: '停止呢個執行。工作節點會終止 Harness 程序，執行會以「已取消」結束。',
        retry: '用同樣嘅輸入同部署開始一個新執行。原本嘅執行會保留。'
      },
      conversationId: '呢個執行所屬嘅對話及其輪次。唔屬於任何對話嘅執行此處為空。',
      conversationTurn: '呢個執行在對話中嘅位置，開始對話嘅那一輪為 1。'
    },
    nodes: {
      name: '節點名稱，通常係工作節點嘅 Kubernetes Pod 名稱。',
      status: '節點會唔會接受新嘅執行。維護之前先封鎖或者清空節點。',
      capacity: '節點而家持有嘅執行數目，對比佢同時最多接受嘅數目。',
      harnesses: '節點喺啟動時探測到已安裝而且運作正常嘅 Harness。',
      executors: '節點提供嘅執行器。只有 worker 喺叢集入面執行而且有權建立 Job，先會出現 Kubernetes Job。',
      labels: '節點公佈嘅鍵值標籤。部署嘅節點選擇器會用佢哋嚟比對。',
      nodeVersion: '節點上工作節點軟件嘅版本。',
      lastHeartbeatUtc: '節點最後一次報到嘅時間。停止報到嘅節點會被標為失聯。',
      address: '節點回報嘅地址，只供參考。',
      maxConcurrentRuns: '呢個節點同時最多接受幾多個執行。',
      activeRuns: '節點而家持有嘅執行。',
      capabilities: '每個 Harness 探測嘅結果：類型、偵測到嘅版本，同埋可唔可以用。',
      labelsItems: { key: '標籤名稱，由部署嘅節點選擇器比對。', value: '標籤數值，由部署嘅節點選擇器完全比對。' },
      capabilitiesItems: {
        harnessType: '探測檢查嘅 Harness。',
        detectedVersion: 'Harness 回報嘅版本字串。',
        available: '呢個 Harness 可唔可以喺呢個節點上運行。',
        detail: '探測輸出，Harness 唔可用嗰陣好有用。'
      },
      actions: {
        grafana: '喺新分頁打開 Grafana 嘅 Workers 儀表板，篩選到節點 {{node}}。',
        cordon: '唔再將新嘅執行送去呢個節點。已經喺上面嘅執行會照常完成。',
        uncordon: '畀呢個節點再次接受新嘅執行。',
        drain: '停止新嘅執行，等現有嘅完成，之後節點會變成閒置。關機之前用。',
        runs: '打開「執行」列表，篩選出呢個節點執行過嘅執行。'
      }
    },
    controlNodes: {
      name: '副本名稱：伺服器運行時用嘅節點 ID（GARRISON_NODE_ID，喺 Kubernetes 入面係 Pod 名稱）。',
      status: '副本嘅生命週期：啟動緊、就緒、清空緊或者離線。只有就緒嘅副本會處理流量。',
      version: '呢個副本運行緊嘅 Garrison 伺服器版本。只有喺滾動更新期間先應該會有唔同版本。',
      schemaVersion: '副本啟動時見到嘅資料庫結構版本。所有副本都應該回報同一個數字。',
      backplane: '呢個副本點樣同其他副本共用即時事件（執行嘅串流、WebSocket 更新）。',
      uptime: '副本程序已經運行咗幾耐，由啟動時間開始計。將指標停喺上面可以睇到準確嘅啟動時間。',
      lastHeartbeatUtc: '副本最後一次發心跳嘅時間。副本每 5 秒發一次；超過 15 秒嘅會標示做冇心跳。',
      activeRequests: '副本喺最後一次心跳時處理緊嘅 HTTP 請求數目。',
      openStreams: '副本喺最後一次心跳時開咗嘅伺服器傳送事件串流同 WebSocket 連線數目。',
      heldLongPolls: '副本喺最後一次心跳時保留緊嘅工作節點租約長輪詢數目。閒置嘅工作節點會喺度等新嘅執行。',
      address: '副本回報嘅 IP 位址同 REST 連接埠。',
      hostname: '副本所在部機或者 Pod 嘅主機名稱。',
      startedUtc: '副本程序幾時啟動，用你本地時區顯示。',
      id: '副本嘅節點 ID。佢同 API 回應入面嘅 respondingNodeId，同埋指標入面嘅 node 標籤一樣。',
      isLeader: '呢個副本係咪持有維護用嘅領導者租約。同一時間只會有一個副本做領導者。',
      leaderEpoch: '領導者租約嘅隔離紀元（fencing epoch）。每次領導權轉去另一個副本，佢都會加一。',
      respondingNodeId: '回應呢次單一讀取嘅副本。喺負載平衡器後面，佢可能同顯示緊嘅副本唔同。',
      answeredBy: '回應呢個清單請求嘅控制節點（respondingNodeId）。喺負載平衡器後面，每次重新整理都可能由唔同嘅副本回應。',
      badges: {
        leader: '領導者：呢個副本持有維護租約。佢負責按保留期清理、將冇心跳嘅副本標記做離線，同埋其他成個叢集嘅維護工作。',
        leaderEpoch: '領導者：呢個副本持有維護租約（紀元 {{epoch}}）。佢負責按保留期清理、將冇心跳嘅副本標記做離線，同埋其他成個叢集嘅維護工作。',
        stale: '冇心跳：超過 {{seconds}} 秒都冇收到心跳，但係副本應該每 5 秒發一次。副本可能過載、網絡斷咗或者已經停咗；領導者會喺 30 秒之後將佢標記做離線。'
      },
      actions: {
        grafana: '喺新分頁打開 Grafana 嘅 Garrison 概覽儀表板，篩選控制節點 {{node}}。'
      }
    },
    audit: {
      createdUtc: '事件發生嘅時間，以你本地時區顯示。',
      eventType: '呢個係邊類保安或者配置事件。',
      principalName: '邊個做嘅：用戶、存取金鑰，或者代表代理程式行動嘅執行。',
      resource: '涉及嘅記錄類型同操作，例如 Agent / Read。',
      reason: '事件點解發生，或者點解存取被拒絕。',
      sourceIp: '請求嚟自嘅網絡地址。',
      principalType: '行動者係用戶、存取金鑰定係執行權杖。',
      principalId: '行動嘅用戶、存取金鑰或者執行嘅識別碼。',
      resourceType: '涉及嘅記錄類型，例如 Agent 或 Secret。',
      resourceId: '涉及嘅記錄嘅識別碼。',
      operation: '嘗試進行嘅操作，例如 Read 或 Execute。',
      method: '請求嘅 HTTP 方法。',
      path: '引發呢個事件嘅請求路徑。',
      authResult: '核對呼叫方身份嘅結果。',
      authorizationResult: '核對呼叫方可以做啲乜嘅結果。',
      bypassReason: '點解略過授權，例如係系統管理員。',
      statusCode: '返回畀呼叫方嘅 HTTP 狀態。',
      requestId: '請求識別碼。用佢喺「請求記錄」或者伺服器日誌度搜尋。'
    },
    manifestApplies: {
      createdUtc: '清單套用或者試行嘅時間。',
      principalName: '邊個套用嘅。',
      dryRun: '「係」即係只做咗驗證，乜都冇寫入。',
      counts: '有幾多份文件建立咗、更新咗、冇變，或者失敗咗嘅記錄。'
    },
    conversations: {
      title: '第一則訊息嘅第一行，用作對話嘅名稱。按一下該列可打開各輪。',
      agentName: '對話所針對嘅代理程式。每一輪都傳送畀呢個代理程式。',
      state: '有未完成嘅一輪時係「處理中」，在其結束前新嘅訊息會被拒絕。可以傳送下一則訊息時係「閒置」。',
      turnCount: '對話已進行嘅輪數（執行數），包括失敗嘅輪次。',
      affinityNodeName: '保存對話工作區和 Harness 工作階段嘅工作節點。下一輪會優先使用呢個節點，以便恢復工作階段。',
      fallbackCount: '冇辦法恢復 Harness 工作階段、改以先前各輪紀錄開始全新工作階段嘅輪數。',
      lastFallbackReason: '最近一次回退嘅那一輪冇辦法恢復工作階段嘅原因，例如親和節點未就緒。',
      harnessType: '執行每一輪嘅 Harness，來自第一輪嘅部署。',
      callerName: '誰發起了對話：使用者、存取金鑰或另一個代理程式嘅執行。',
      contextId: '對話透過 A2A 發起時用戶端提供嘅 A2A 情境 ID。透過 REST 或 MCP 發起嘅對話此處為空。',
      sessionId: '下一輪將恢復嘅 Harness 工作階段。在某一輪回報工作階段之前為空。',
      lastActivityUtc: '最近一輪傳送或結束嘅時間。將滑鼠停在值上可睇確切時間。',
      createdUtc: '第一輪開始呢個對話嘅時間。將滑鼠停在值上可睇確切時間。',
      id: '對話識別碼。調用代理程式時將其作為 conversationId 傳入，就可以傳送下一輪。',
      fallbackLast: '以紀錄開始全新工作階段嘅輪數。最近一次嘅原因：{{reason}}。',
      states: {
        busy: '呢個對話嘅某一輪仲喺度排隊或執行中。請等待其結束或將其取消，再傳送下一則訊息。',
        idle: '而家冇進行緊嘅一輪。下一則訊息會繼續呢個對話。'
      },
      actions: {
        continue: '打開「調用」並選取呢個對話，下一則訊息將作為佢嘅下一輪傳送。',
        runs: '打開依呢個對話各輪篩選嘅執行清單，可使用所有執行欄位和篩選條件。'
      }
    }
  },
  views: {
    approvalDetail: {
      openRun: '打開提出要求嘅執行，睇呢個工具呼叫前後嘅對話記錄。',
      openAgent: '打開呢個代理程式嘅頁面，睇佢嘅部署同最近嘅執行記錄。',
      openDeployment: '打開篩選咗呢個部署嘅「部署」分頁，喺度可以編輯佢嘅批核規則。',
      backToInbox: '返去批核收件匣，喺嗰度可以睇到每一個仲等緊嘅批核。',
      viewJson: '以 JSON 顯示完整嘅批核記錄，同 API 傳返嘅內容一模一樣。',
      request: 'Harness 要求做咩：一行摘要，同埋遮蓋咗機密嘅完整工具輸入。',
      rules: '符合嘅部署規則、呢個呼叫建議嘅規則，同埋由決定記住咗嘅規則。',
      copyRule: '將建議規則複製到剪貼簿，例如貼去部署嘅批核規則度用。'
    },
    home: {
      observabilityState: {
        reachable: '伺服器喺過去 30 秒內經內部 URL 連到 {{service}}。',
        unreachable: '伺服器經內部 URL 連唔到 {{service}}。睇下個服務有冇行緊，同埋內部 URL 設定係咪指向佢。',
        checking: '問緊伺服器 {{service}} 連唔連得到。',
        unknown: '伺服器冇報告 {{service}} 連唔連得到。狀態檢查失敗咗，或者呢部伺服器仲未支援。'
      },
      observabilityVersion: '{{service}} 喺伺服器健康檢查度報告嘅版本。',
      kpisGrafana: '喺新分頁打開 Grafana 入面嘅 Garrison 總覽儀表板，睇呢啲數字隨時間點樣變。',
      grafanaDashboards: 'Grafana 入面嘅 Garrison 資料夾每個部分都有一個儀表板。撳每條連結都會喺新分頁打開嗰個儀表板。',
      grafanaSections: {
        overview: '一眼睇晒整體狀況：上線嘅副本同工作節點、執行同請求速率、錯誤、成本同最近嘅問題。',
        http: '按路由分嘅 REST 流量：請求速率、延遲百分位、錯誤、負載大小、驗證失敗同處理緊嘅請求。',
        runs: '執行生命週期：按結果計嘅建立同完成數量、每個階段用嘅時間、取消、結構化輸出驗證同修復。',
        agents: '每個代理程式嘅表現：調用次數、執行時間同排隊時間百分位、第一個權杖時間、串流時間、結果同防護觸發。',
        models: '按模型同代理程式計嘅權杖用量同成本：輸入、輸出、快取同推理權杖、成本同輸出吞吐量。',
        workers: '工作節點：租約、每個節點嘅執行、完成報告、心跳、空閒位同對控制平面嘅呼叫。',
        kubernetes: '每次執行一個 Pod 嘅執行器：建立同刪除嘅 Job、Pod 啟動延遲、按原因計嘅 Pod 失敗同清理孤立 Job。',
        protocols: 'MCP、A2A 同串流：工具呼叫同用時、工作階段、A2A 方法同工作狀態、SSE 串流、WebSocket 同委派。',
        scheduler: '排程：按代理程式同執行框架計嘅佇列深度、認領結果同延遲、租約長輪詢、被阻塞嘅執行同過期租約。',
        database: '資料庫：按操作同資料表計嘅語句延遲、錯誤、用緊嘅連線、寫入鎖等待同保留清理。',
        controlPlane: '控制平面副本：狀態、領導者轉換、背板流量同延遲、心跳同背景服務嘅執行。',
        security: '按方式同原因計嘅驗證失敗、授權拒絕、速率限制、發出嘅權杖、機密解密同 Codex 權杖更新。',
        integrations: '按服務計嘅對外呼叫：MCP 伺服器測試、可觀測性探測、MCP Proxy、Kubernetes API 同工作節點對控制平面嘅呼叫。',
        logs: '按元件同租戶計嘅日誌量、錯誤同警告、最近嘅錯誤行同追蹤連結。'
      },
      observabilityDocs: '喺新分頁打開遙測指南：點樣收集 Garrison 指標，同埋點樣連接 Grafana、Prometheus、Tempo 或者 Loki。',
      observability: '連去呢個環境報告已經設定好嘅指標、儀表板同追蹤工具。未設定嘅服務唔會顯示。',
      kpis: {
        agents: '呢個租用戶定義咗嘅代理程式。撳一下打開「代理程式」列表。',
        deployments: '所有代理程式嘅部署。每個部署都係代理程式嘅一種運行方式。撳一下打開佢哋。',
        activeRuns: '而家喺工作節點上已租用或者執行緊嘅執行。撳一下睇佢哋。',
        queued: '等緊工作節點嘅執行。如果數字一直升，即係你需要更多節點或者容量。',
        succeeded: '過去 24 小時成功完成嘅執行。撳一下列出佢哋。',
        failed: '過去 24 小時失敗嘅執行。撳一下列出佢哋，睇吓原因。',
        nodes: '準備好接收執行嘅工作節點，對比所有已登記嘅節點。撳一下管理佢哋。',
        controlNodes: '就緒嘅控制平面副本數目，同已登記副本嘅總數（離線嘅行會喺清單度留 24 個鐘）。領導者係 {{leader}}。撳一下打開機群 > 控制平面。',
        controlNodesNoLeader: '就緒嘅控制平面副本數目，同已登記副本嘅總數（離線嘅行會喺清單度留 24 個鐘）。而家冇副本持有領導者租約，所以叢集維護暫停咗。撳一下打開機群 > 控制平面。'
      },
      openFailure: '打開呢個失敗嘅執行，睇佢嘅對話記錄、錯誤同 stderr。',
      openControlPlane: '打開機群 > 控制平面，睇每個副本嘅狀態、領導者、版本、心跳同活動。',
      openWorkers: '打開機群 > 工作節點，睇每個工作節點嘅容量、Harness 同心跳，仲可以封鎖或者清空佢。',
      cta: {
        invoke: '喺瀏覽器發訊息畀任何代理程式。',
        addAgent: '去「代理程式」建立一個新嘅代理程式身份。',
        applyManifest: '以 YAML 套用配置，例如一個範例代理程式。',
        inspectRuns: '用篩選同遙測數據瀏覽每一個執行。',
        nodes: '睇吓邊啲工作節點準備好，佢哋可以運行啲乜。',
        apiExplorer: '對住呢部伺服器即時試任何 API 呼叫。',
        analytics: '睇執行速度、Token、成本同結果隨時間嘅變化。'
      },
      services: {
        loki: '喺新分頁打開 Loki，搜尋 Garrison 日誌。',
        grafana: '喺新分頁打開顯示 Garrison 指標嘅 Grafana 儀表板。',
        prometheus: '喺新分頁打開收集 Garrison 指標嘅 Prometheus 伺服器。',
        tempo: '喺新分頁打開 Tempo 瀏覽追蹤記錄。'
      },
      serviceGeneric: '喺新分頁打開呢個隨附嘅服務。'
    },
    runDetail: {
      openApproval: '打開呢個批核嘅詳情頁面，睇佢完整嘅工具輸入、規則同決定。',
      reviewApprovals: '顯示呢個執行嘅批核，喺度可以允許或者拒絕等候中嘅工具呼叫。',
      approvalActions: '允許或者拒絕等候中嘅工具呼叫，或者打開批核睇所有欄位。',
      viewTrace: '喺新分頁用 Grafana Explore (Tempo) 打開呢個執行嘅追蹤。佢會顯示伺服器同工作節點上面嘅編譯、領取同 Harness 區段。',
      viewLogs: '喺新分頁用 Grafana Explore (Loki) 打開伺服器同工作節點關於呢個執行嘅日誌，範圍限於呢個執行嘅時間。',
      traceId: '編譯呢個執行嗰陣所屬追蹤嘅 W3C 追蹤 ID。可以喺 Tempo 搵，或者撳「睇追蹤」。喺開始記錄追蹤 ID 之前建立嘅執行係空嘅。',
      eventCode: '用你嘅語言顯示 Garrison 喺度寫咗咩類型嘅訊息。隔籬嘅文字係伺服器或者工作節點發出嘅原本訊息。',
      openTemplate: '打開範本 {{name}}。呢個執行用咗第 {{version}} 版；「版本」分頁會顯示嗰個內容同埋佢同而家版本嘅分別。',
      templatesUsed: '編譯呢個執行時用咗嘅提示範本確實版本。撳其中一個就可以打開嗰個範本比較版本。',
      live: '事件會喺 Harness 產生嗰陣由伺服器即時串流過嚟。',
      viewJson: '以 JSON 顯示完整嘅執行記錄，包括每個遙測欄位。',
      deployment: '呢個執行揀咗嘅部署，可能係指名揀，亦可能係按流量權重揀。',
      model: 'Harness 回報實際用咗嘅模型，可能同部署要求嘅模型唔同。',
      tokens: '成個執行嘅輸入同輸出 Token。下面嘅遙測面板有完整明細。',
      caller: '邊個開始呢個執行：用戶、存取金鑰，或者另一個代理程式嘅執行。',
      parent: '代理程式呼叫另一個代理程式時，委派畀呢個執行嘅執行。',
      openParent: '打開委派呢項工作嘅上層執行。',
      attempt: '呢個係第幾次嘗試，對比部署容許嘅最多次數。',
      outputSchema: '最終輸出有冇符合代理程式嘅輸出 JSON Schema。如果唔符合而 Harness 可以恢復佢嘅工作階段，Garrison 會喺同一個工作階段發一次修復提示。記錄入面嘅警告事件會列出驗證錯誤。',
      created: '要求執行嘅時間。',
      started: 'Harness 程序喺工作節點上啟動嘅時間。',
      completed: '執行去到最終狀態嘅時間。',
      exitCode: 'Harness 程序嘅結束碼。成功與否通常睇最終事件，而唔係呢個結束碼。',
      tabs: {
        approvals: '呢個執行要求過權限嘅工具呼叫、每個點樣決定，同埋等候中嗰啲嘅「允許」同「拒絕」。',
        transcript: 'Harness 產生嘅每一個事件：助理文字、思考、工具呼叫同結果，同埋用量。',
        result: '最終答案同任何結構化輸出。',
        input: '呼叫方傳送咗啲乜、參數，同埋實際用咗嘅提示範本版本。',
        stderr: 'Harness 標準錯誤嘅最後部分，機密已經清除。執行失敗時睇呢度。',
        children: '呢個執行透過呼叫其他代理程式而開始嘅執行。'
      },
      eventFilter: '只顯示一種事件，例如工具呼叫或者錯誤。',
      openChild: '打開呢個子執行，佢係呢個執行呼叫另一個代理程式時開始嘅。',
      eventCodes: {
        ApprovalRequested: 'Harness 喺工具呼叫之前問咗一聲，呢個呼叫等緊有人處理。喺「批核」分頁度決定佢。',
        ApprovalDecided: '一個權限要求已經由規則、部署預設、人手或者逾時決定咗。文字會講明係邊種。',
        RunGuardTriggered: '執行防護停咗呢個執行。訊息講明係邊個防護觸發同佢見到咩；個執行會以嗰個防護嘅結果失敗結束，並保留部分輸出。',
        ConversationFallback: '呢一輪冇辦法恢復對話嘅 Harness 工作階段，因此以先前各輪嘅紀錄開始了全新工作階段。訊息中說明了原因。',
        ConversationStateLost: '節點領取了呢一輪，但對話嘅目錄已唔存在，因此呢一輪被放回佇列，以回退方式執行。'
      },
      conversation: '呢個執行所屬嘅對話及其輪次。按一下可打開該對話。',
      openConversation: '打開對話，睇所有輪次並傳送下一輪。',
      conversationSession: '呢一輪係恢復了對話嘅 Harness 工作階段，仲係根據紀錄開始了全新工作階段，以及原因。',
      resumeSessionId: '呢一輪所恢復嘅 Harness 工作階段，由上一輪留下。',
      affinityNode: '保存對話目錄嘅節點。在所示時間之前，其他節點唔會領取呢一輪，除非該節點唔再就緒。'
    },
    agentDetail: {
      name: '呼叫方調用呢個代理程式時用嘅名稱。',
      viewJson: '以 JSON 顯示完整嘅代理程式記錄。',
      invoke: '打開「調用」頁並揀好呢個代理程式。除非你自己揀，否則會按權重揀部署。',
      grafana: '喺新分頁打開按呢個代理程式篩選嘅 Grafana 代理程式儀表板：調用次數、執行時間百分位、第一個權杖時間、串流時間、權杖、成本同防護觸發。',
      id: 'API 呼叫用嘅代理程式識別碼。',
      tabs: {
        deployments: '呢個代理程式嘅運行方式，連同佢哋嘅權重同各自收到嘅流量份額。',
        runs: '呢個代理程式最近嘅執行。',
        card: '其他代理程式用嚟發現呢個代理程式嘅 A2A 代理程式卡。'
      },
      addDeployment: '去「部署」為呢個代理程式建立一個。冇部署佢就運行唔到。',
      manageDeployments: '打開「部署」分頁修改權重、模型同綁定。',
      openRun: '打開呢個執行嘅對話記錄同遙測數據。',
      columns: {
        name: '部署名稱。呼叫方可以明確指名佢，略過按權重揀選。',
        harness: '為呢個部署啟動 CLI 嘅 Harness 設定檔。',
        model: '呢個部署要求 Harness 用嘅模型。',
        weight: '部署上設定嘅原始流量權重。',
        traffic: '呢個部署收到嘅調用份額：佢嘅權重除以所有啟用中權重嘅總和。',
        active: '只有啟用中嘅部署先會收到按權重分配嘅流量。'
      },
      conversations: '打開依呢個代理程式篩選嘅對話清單。'
    },
    queue: {
      queued: '等緊節點嘅執行。撳一下列出佢哋。',
      leased: '已經有節點認領但未開始嘅執行。撳一下列出佢哋。',
      running: '而家執行緊嘅執行。撳一下列出佢哋。',
      agent: '等緊嘅工作屬於邊個代理程式。',
      harness: '嗰啲執行需要嘅 Harness。只有公佈支援佢嘅節點先可以接。'
    },
    invoke: {
      stream: {
        tabs: {
          preview: '喺答案串流嘅時候即時睇，用 Markdown 格式顯示，連埋推理過程同工具呼叫。執行緊嘅時候預設揀咗呢個分頁。',
          response: '執行嘅最終結果：結果文字（格式化或者原始）、結構化輸出、結果、錯誤、遙測資料同連結。'
        },
        live: '執行緊。輸出經即時事件串流到嘅時候，呢個檢視會跟住更新。',
        finished: '執行已經完咗，唔會再有輸出。最終結果喺「回應」分頁度。',
        elapsed: '由你撳「傳送」開始計嘅時間，喺瀏覽器度量度。執行完咗就會停。',
        firstToken: '由「傳送」到第一個串流輸出（文字或者推理）嘅時間，喺瀏覽器度量度，所以包埋排隊同 Harness 啟動時間。執行頁面會顯示工作節點量度嘅數值。',
        tokensPerSecond: '串流期間每秒嘅輸出 Token 數，根據 Harness 報告嘅用量計。執行完咗之後會顯示伺服器量度嘅速率。',
        codexNote: 'Codex 要等每段訊息完整先會輸出（codex exec --json），所以唔會逐個 Token 咁串流。佢做嘢期間用咗時間會繼續計。',
        showResponse: '轉去「回應」分頁，睇最終結果、結構化輸出同遙測資料。',
        reasoning: '模型喺回答之前或者之間產生嘅思考文字。預設收埋咗，撳一下就可以展開。',
        jump: '捲去最新輸出，之後有新輸出到嘅時候繼續跟住。',
        tool: {
          running: '代理程式呼叫咗工具 {{name}}，等緊佢嘅結果。',
          ok: '工具 {{name}} 傳返結果，冇錯誤。',
          failed: '工具 {{name}} 傳返錯誤。代理程式可能會再試，或者唔用佢繼續做。'
        }
      },
      applySample: '去「清單」，範例清單會建立一個你即刻可以試嘅代理程式。',
      agent: '要呼叫嘅代理程式。只會列出啟用中嘅代理程式。',
      deployment: '保持「任何啟用中嘅部署（按權重）」就由 Garrison 按流量權重揀，或者揀一個部署直接測試。',
      parameter: '{{name}} 每次執行嘅數值。部署容許呼叫方覆寫佢；留空就用預設值。',
      message: '你想代理程式做嘅事。佢會作為執行輸入傳送，並由任務範本包裝。',
      send: '用呢個訊息開始執行，並喺度串流顯示佢嘅對話記錄。',
      openRun: '打開完整嘅執行頁面，睇結果、遙測數據同 stderr。',
      stopOnLeave: '開咗嘅話，你離開呢頁、閂咗分頁或者傳送新訊息嗰陣，Garrison 會取消進行緊嘅執行，費事為冇人睇嘅輸出畀錢。熄咗嘅話執行會繼續，留喺執行頁面度。呢個選擇會儲存喺呢個瀏覽器。',
      cancel: '即刻停止呢個執行。工作節點會喺幾秒內結束 Harness 程序，到而家為止嘅輸出會保留。',
      cancelling: '已經要求取消。工作節點停緊 Harness；個執行回報已取消之後，呢度會顯示最終狀態。',
      sendReplaces: '先取消進行緊嘅執行，再用呢個訊息開始新嘅執行。想目前個執行繼續，就熄咗「離開時停止執行」。',
      sendKeeps: '用呢個訊息開始新嘅執行。因為「離開時停止執行」熄咗，進行緊嘅執行會繼續；可以喺執行頁面搵返佢。',
      timeLimit: '呢個執行可選嘅截止時間（秒），呢個部署容許呼叫者設定。留空就用部署預設值。超過限制嘅話個執行會逾時。',
      timePreset: '將呢個執行嘅時間限制設做 {{value}}。',
      timePresetClear: '清除時間限制，等個執行用返部署預設值。',
      conversation: {
        mode: '執行一次；開始一個新對話，其後續各輪會恢復呢個 Harness 工作階段；或傳送現有對話嘅下一輪。',
        pick: '要繼續嘅對話。只列出呢個代理程式嘅對話，最新嘅排在前面。',
        deploymentPinned: '對話一律使用第一輪嘅部署，因此繼續對話時部署係固定嘅。',
        open: '打開呢個執行所屬嘅對話，睇所有輪次並傳送下一輪。'
      }
    },
    manifests: {
      planned: '套用呢份文件會做嘅嘢：建立記錄、更新記錄，或者保持唔變。試行只會驗證，唔會改任何嘢。',
      changes: { after: '清單會設定嘅值。太長嘅值會喺 200 個字元度截斷。', before: '而家儲存緊嘅值。太長嘅值會喺 200 個字元度截斷。', field: '清單會改嘅呢條記錄嘅設定，例如 model 或者 parameters.model。' },
      results: '套用對清單入面每份文件做咗啲乜。',
      kind: '文件描述嘅記錄類型，例如 Agent 或 Deployment。',
      name: '文件 metadata 入面嘅記錄名稱。',
      result: '文件係建立咗、更新咗定係冇改到記錄，抑或失敗咗。',
      message: '伺服器提供嘅詳情，例如驗證錯誤。',
      tabs: {
        apply: '貼上或者上載清單，用試行驗證，然後套用。',
        export: '將呢個租用戶嘅配置下載成清單。永遠唔會包括機密數值。',
        history: '以往每次套用同試行，連同每份文件嘅結果。'
      },
      upload: '由你部電腦載入 YAML 或 JSON 清單檔案到編輯器。',
      loadSample: '用範例清單取代編輯器內容：一個用模擬 Harness 嘅回聲代理程式。',
      document: '一份或者多份用 --- 分隔嘅 YAML 或 JSON 文件。記錄之間用名稱互相引用。',
      dryRun: '驗證每份文件並顯示會有咩改變，但乜都唔寫入。',
      apply: '驗證並寫入每份文件。只要有一份失敗，就乜都唔會寫入。',
      export: '產生一份可以重建呢個租用戶配置嘅清單。',
      download: '將匯出嘅清單儲存成 YAML 檔案。',
      confirmApply: '即刻將清單寫入呢個租用戶。'
    },
    templateEditor: {
      cloneName: '副本個名。用細楷字母、數字、連字號同斜線都得；builtin/ 開頭係保留咗嘅。',
      cloneConfirm: '用呢個名建立副本，再喺編輯器打開。',
      clone: '整一份可以編輯嘅範本副本。建立之前可以揀副本個名。',
      reset: '將呢個內置範本還原做 Garrison 原本提供嘅內容。',
      delete: '刪除呢個範本同佢所有版本。只要有部署綁定緊佢，伺服器就會拒絕；確認對話框會列出嗰啲部署。',
      create: '建立範本同佢嘅第一個版本。',
      save: '將內容儲存成新版本。跟住最新版本嘅部署會喺新執行用佢。',
      content: '範本文字。可以用 {{variables}}、條件、迴圈同引入；你打字嗰陣預覽會即時更新。',
      changeNote: '同版本一齊儲存嘅簡短備註，講明改咗啲乜同點解。',
      tabs: {
        preview: '用範例上下文渲染範本，睇吓 Harness 實際會收到啲乜。',
        versions: '每個已儲存嘅版本，可以比較差異同還原。'
      },
      sampleContext: '代替真實執行資料嘅 JSON。修改佢就可以睇範本點樣反應。',
      columns: {
        version: '版本號碼。數字越大越新。',
        note: '同版本一齊儲存嘅變更備註。',
        author: '邊個儲存咗呢個範本版本。',
        saved: '版本儲存嘅時間。'
      },
      diff: '將呢個版本同編輯器而家嘅內容比較。',
      restore: '將呢個版本再設為目前版本。目前內容會保留喺歷史入面。'
    },
    serverInfo: {
      rest: 'REST API 呼叫同 SDK 用嘅基本地址。',
      mcp: 'MCP 用戶端連接嘅地址。每個以工具形式公開嘅代理程式都會喺度出現。',
      a2a: '呢個租用戶 A2A 閘道嘅基本地址。每個代理程式喺佢下面都有自己嘅卡。',
      openapi: '描述每個 REST 操作嘅 OpenAPI 文件。',
      version: 'Garrison 伺服器嘅版本。',
      dashboardVersion: '呢個控制台嘅版本。',
      node: '回應呢版伺服器資訊請求嘅控制平面副本（控制節點）。有幾個副本嘅話，重新載入之後可能由另一個回應。',
      nodeLink: '打開機群 > 控制平面，將呢個副本同其他副本擺埋一齊睇，包括狀態、心跳，同佢係咪領導者。',
      database: '伺服器用嘅資料庫引擎。',
      health: '伺服器健康檢查嘅結果。',
      replicas: '叢集預期有幾多個控制平面副本。',
      routes: '伺服器登記咗幾多個 API 操作。',
      serverTime: '伺服器時鐘。同你部機嘅時鐘相差太大，可能會令簽署請求失效。',
      principalName: '你登入緊嘅身份。',
      principalType: '你係以用戶身份登入，定係用存取金鑰登入。',
      role: '你嘅最高存取級別。',
      tenant: '你嘅工作階段所屬嘅租用戶。',
      expires: '你嘅工作階段幾時結束，到時要再登入。',
      rawJson: '顯示伺服器資訊嘅原始回應。'
    },
    requests: {
      grafana: '喺新分頁打開 Grafana 嘅 HTTP 儀表板：根據 Prometheus 指標顯示請求速率、延遲同錯誤隨時間嘅變化。',
      kpis: {
        total: '伺服器喺所揀範圍同篩選之下保留喺歷史入面嘅請求。',
        success: '返回 2xx 或 3xx 狀態嘅請求。',
        failure: '返回 4xx 或 5xx 狀態嘅請求。',
        avgDuration: '伺服器平均用咗幾耐回應。'
      },
      columns: {
        time: '請求到達嘅時間。',
        method: '請求嘅 HTTP 方法。',
        path: '被呼叫嘅路徑。將滑鼠停喺數值上面可以睇完整內容。',
        status: '伺服器返回嘅 HTTP 狀態。',
        duration: '伺服器用咗幾耐回應。',
        principal: '邊個發出請求：用戶、存取金鑰，或者執行權杖。'
      },
      viewDetails: '打開請求，睇標頭、內容同時間。',
      viewJson: '打開請求記錄，包括佢嘅原始 JSON。',
      deleteOne: '將呢個請求由歷史移除。',
      bulkDeleteAll: '刪除所有符合目前篩選嘅請求，唔只係呢一頁。'
    },
    explorer: {
      operations: '揀一個 API 操作，按範疇分組。下面嘅表單會按佢嘅參數調整。',
      pathParam: '路徑參數 {{name}}（{{type}}）。佢會代入 URL。{{description}}',
      queryParam: '查詢參數 {{name}}（{{type}}）。填咗之後會加喺 URL 後面。{{description}}',
      copyUrl: '複製完全解析好嘅請求 URL。',
      headerName: '請求標頭嘅名稱。Authorization 會由你嘅工作階段自動加入。',
      headerValue: '呢個標頭傳送嘅數值。',
      removeHeader: '由請求移除呢個標頭。',
      addHeader: '加多一個請求標頭。',
      body: '建立或者修改記錄嘅操作所用嘅 JSON 請求內容。',
      execute: '即刻用你嘅工作階段將請求傳去伺服器。破壞性嘅方法會先叫你確認。',
      stop: '中止請求，或者停止讀取串流回應。',
      snippets: {
        curl: '同一個請求嘅 curl 指令版本，畀終端機用。',
        fetch: '同一個請求嘅 JavaScript fetch 程式碼。',
        csharp: '同一個請求嘅 C# HttpClient 程式碼。'
      },
      clearHistory: '清除呢個瀏覽器儲存嘅所有最近請求。',
      loadHistory: '將呢個請求載入返表單。',
      deleteHistory: '將呢個項目由最近請求列表移除。',
      confirmExecute: '就算可能會修改或者刪除資料，都照樣傳送呢個請求。'
    },
    settings: {
      settingPath: '設定路徑：{{path}}。喺設定檔同設定嘅 REST API 入面要用呢個名。',
      viewJson: '顯示設定嘅原始回應。',
      restart: '重新啟動呢個控制平面副本，等需要重新啟動嘅設定生效。',
      save: '儲存每個改咗嘅設定。即時設定會即刻生效；其他要等重新啟動。',
      groupGeneric: '{{group}} 群組入面嘅設定。',
      fieldGeneric: '伺服器設定 {{path}}。',
      applyLive: '儲存之後即刻生效。',
      applyRestart: '伺服器重新啟動之後先生效。',
      source: {
        File: '目前喺設定檔入面設定。喺度儲存會更新設定檔。',
        Environment: '由環境變數設定，會凌駕喺度儲存嘅任何數值。',
        ConfigMap: '由 Kubernetes ConfigMap 管理。請喺你嘅清單入面改。',
        Database: '以叢集設定儲存喺資料庫，所有副本共用。'
      },
      sourceGeneric: '目前數值嚟自邊度。',
      testDatabase: '儲存之前，用上面嘅資料庫設定試吓連接。',
      groups: {
        Observability: 'Grafana、Prometheus、Loki 同 Tempo 喺邊度。瀏覽器 URL 用喺首頁卡片同 Grafana 連結；伺服器用內部 URL 檢查連唔連得到。留空即係未設定。',
        Runtime: '控制平面點樣限制執行：執行最長可以行幾耐、部署跟嘅執行防護預設值，同埋排緊隊嘅執行可以等合適嘅工作節點幾耐。',
        Rest: 'REST API 點樣監聽：主機、連接埠、TLS 同公開地址。',
        Mcp: 'MCP 伺服器點樣監聽，同埋工具呼叫可以等幾耐。',
        Database: 'Garrison 用邊個資料庫，同埋點樣連接。',
        Logging: '日誌去邊度，同埋有幾詳細。',
        Auth: '權杖簽署、有效期同登入速率限制。',
        Security: '加密主金鑰同初始帳戶。',
        RequestHistory: '會唔會擷取 API 請求，同埋每個內容保留幾多。',
        Telemetry: '指標同追蹤匯出。',
        Archive: '保留期刪除執行同事件之前，將佢哋封存嘅位置。',
        Cluster: '預期有幾多個控制平面副本。',
        Scheduling: '工作節點嘅租約長度同心跳逾時。',
        Runs: '執行預設值，同埋執行同事件保留幾耐。',
        Audit: '審計記錄保留幾耐。'
      },
      fields: {
        Runtime: {
          MaxRunSeconds: '任何執行最長可以行幾耐（秒）。超過呢個值嘅部署逾時、每次執行嘅時間限制同設定檔預設值都會降到呢個值。',
          RepetitionGuard: '對於重複防護留空嘅部署，係咪停止回答變成重複嘅執行（結果係偵測到重複）。',
          MaxAssistantChars: '對於限制留空嘅部署，執行嘅助理文字去到幾多個字元就停（結果係輸出超出上限）。0 即係唔設上限。',
          NoProgressSeconds: '對於限制留空嘅部署，執行冇文字、思考或者工具活動幾多秒就停（結果係冇進展）。0 即係熄咗佢。',
          ConversationAffinityWaitMs: '對話嘅一輪等待保存其 Harness 工作階段之節點嘅時長，逾時後由其他節點領取並根據紀錄開始全新工作階段。若該節點未就緒，其他節點會立即領取。0 表示永不等待。',
          ConversationTranscriptTurns: '回退到全新 Harness 工作階段嘅對話輪次最多接收嘅先前輪數，保留最新嘅輪次。',
          ConversationTranscriptChars: '回退嘅一輪所接收嘅每則先前訊息和回答嘅最大字元數，超出部分會被截斷並標示。'
        },
        Scheduling: {
          PauseGraceMs: '主機休眠或者虛擬機暫停之後，領導者會等一個心跳時段再加呢啲毫秒，先至將節點標記做失聯或者令佢哋嘅執行失敗。預設值係 5000。'
        }
      }
    },
    runGuard: {
      openDeployments: '去部署頁面改部署嘅執行防護：重複防護、最大助理字元數同冇進展逾時。',
      openSettings: '去設定頁面改叢集預設值（執行階段），冇自己執行防護嘅部署會跟呢啲值。'
    },
    conversationDetail: {
      viewJson: '以 JSON 顯示完整嘅對話紀錄。',
      openInvoke: '打開「調用」並選取呢個對話，以完整嘅串流睇傳送下一輪。',
      delete: '刪除呢個對話。佢嘅各輪會作為一般執行保留在「執行」頁面，但對話將冇辦法再繼續。',
      deleteBusy: '仲有未完成嘅一輪，因此在該執行結束或被取消之前，伺服器會拒絕刪除呢個對話。',
      agent: '呢個對話嘅代理程式。按一下可打開該代理程式。',
      openAgent: '打開呢個代理程式嘅頁面，睇其部署和最近嘅執行。',
      deployment: '每一輪都在呢個部署上執行，也就係第一輪被路由到嘅部署。',
      activeRun: '仲喺度排隊或執行中嘅一輪。在其結束之前，下一則訊息會被拒絕。',
      openRun: '打開呢個執行嘅頁面，睇完整紀錄、結果和遙測資料。',
      turns: '對話嘅所有輪次，依時間由早到晚排列。每一輪都係一次執行。',
      columns: {
        turn: '該輪在對話中嘅位置，從 1 開始。',
        run: '執行呢一輪嘅執行。按一下可打開其紀錄。',
        status: '該輪執行所處嘅生命週期階段：排隊、執行中或某個結束狀態。',
        outcome: '該輪執行結束嘅原因，比狀態更詳細。',
        session: '該輪係恢復了上一輪嘅 Harness 工作階段，仲係以紀錄開始了全新工作階段（以及原因）。',
        input: '呢一輪所傳送訊息嘅開頭。將滑鼠停在上方可睇更多內容。',
        result: '回答嘅開頭；執行失敗時係錯誤訊息。將滑鼠停在上方可睇更多內容。',
        node: '執行呢一輪嘅工作節點。',
        created: '呢一輪嘅傳送時間。將滑鼠停在值上可睇確切時間。'
      },
      session: {
        first: '第一輪：佢開始後續各輪將恢復嘅 Harness 工作階段。',
        resumed: '呢一輪在保存對話目錄嘅節點上恢復了 Harness 工作階段 {{session}}，所以代理程式保留了完整嘅情境。',
        fallback: '呢一輪冇辦法恢復工作階段，因此以先前各輪嘅紀錄開始了全新嘅 Harness 工作階段。',
        pending: '呢一輪而家等待節點，因此尚唔知佢會恢復工作階段仲係回退。'
      },
      continueTitle: '將下一則訊息作為呢個對話嘅下一輪傳送。佢使用相同嘅代理程式和部署執行。',
      message: '畀代理程式嘅下一則訊息。佢會結合先前各輪嘅情境繼續對話。',
      send: '將呢則訊息作為下一輪傳送。呢一輪會出現在上方清單中，並持續重新整理直到結束。',
      sendBusy: '上一輪仲未完成。在其結束之前伺服器會拒絕新嘅一輪，請等待或先將其取消。'
    }
  },
  analytics: {
    grafana: '喺新分頁打開 Grafana 嘅 Runs 儀表板，時間範圍同呢頁一樣。',
    filters: {
      ttft: '剔咗之後，第一個 Token 時間圖表會唔計執行等委派代理程式嘅時間，咁會委派嘅代理程式就可以同直接回答嘅公平比較。',
      range: '所有圖表同總數嘅時間範圍：最近一個鐘、一日、一個星期、30 日，或者自訂開始同結束時間。',
      from: '自訂範圍嘅開始，以你本地時區計。',
      to: '自訂範圍嘅結束，以你本地時區計。',
      agentId: '只計呢個代理程式嘅執行。部署列表會收窄到佢嘅部署。',
      harnessType: '只計由呢個 Harness 執行嘅執行。',
      deploymentId: '只計呢個部署嘅執行，例如比較同一個代理程式嘅兩個模型。',
      model: '只計 Harness 回報用咗呢個模型嘅執行。列表會顯示所揀範圍入面出現過嘅模型。',
      groupBy: '將每個圖表按代理程式、Harness、模型，或者 Harness 同模型組合拆成獨立系列，方便比較。'
    },
    cards: {
      delegationWait: '執行等佢委派咗嘅子執行嘅平均時間。如果範圍入面冇執行委派過，就係不適用。',
      ttftExcludingDelegation: '唔計等委派代理程式時間嘅平均第一個 Token 時間。附註顯示第 95 百分位數。',
      runs: '範圍內符合篩選嘅已要求執行。',
      successRate: '成功執行佔已完成執行（成功、失敗、已取消同逾時）嘅比例。',
      ttft: '有產生輸出嘅執行嘅平均第一個 Token 時間。備註顯示第 95 百分位數。',
      execution: 'Harness 平均執行時間。備註顯示第 95 百分位數，反映你慢嘅執行。',
      queue: '執行平均等咗工作節點幾耐。',
      tokens: '範圍內所有執行嘅輸入加輸出 Token。',
      throughput: '串流期間平均每秒輸出 Token。',
      cost: '回報嘅總成本，以美元計。',
      toolCalls: '範圍內執行作出嘅工具呼叫總數。'
    },
    charts: {
      outcomes: '每個時間區段入面執行點樣結束。將滑鼠停喺棒形上面可以睇數目。',
      ttft: '執行用咗幾耐先產生第一個 Token：平均數、中位數同第 95 百分位數。',
      duration: '模型串流咗幾耐，同埋 Harness 總共運行咗幾耐。',
      queue: '執行喺節點租用之前等咗幾耐。',
      tokens: '每個區段消耗嘅 Token，按類型拆分。',
      throughput: '輸出產生速度，以每秒 Token 計。',
      cost: '每個區段回報嘅開支。',
      toolCalls: '每個區段作出嘅工具呼叫。',
      usageTokens: '輸入加輸出 Token 隨時間嘅變化，每個 Harness 同模型組合係一段疊加。將滑鼠停喺棒形上面可以睇拆分。',
      usageCost: '回報成本隨時間嘅變化，每個 Harness 同模型組合係一段疊加。將滑鼠停喺棒形上面可以睇拆分。'
    },
    metrics: {
      delegationWaitMsAvg: '執行等佢委派咗嘅子執行嘅平均時間。撳一下就可以隱藏或者顯示呢條線。',
      timeToFirstTokenExcludingDelegationMsP95: '唔計委派等候嘅第一個 Token 時間第 95 百分位數。撳一下就可以隱藏或者顯示呢條線。',
      timeToFirstTokenExcludingDelegationMsP50: '唔計委派等候嘅第一個 Token 時間中位數。撳一下就可以隱藏或者顯示呢條線。',
      timeToFirstTokenExcludingDelegationMsAvg: '唔計委派等候嘅平均第一個 Token 時間。撳一下就可以隱藏或者顯示呢條線。',
      runs: '呢個區段入面要求嘅執行。',
      succeeded: '成功完成嘅執行。撳一下隱藏或者顯示呢個系列。',
      failed: '失敗嘅執行。撳一下隱藏或者顯示呢個系列。',
      cancelled: '被取消嘅執行。撳一下隱藏或者顯示呢個系列。',
      timedOut: '到咗期限嘅執行。撳一下隱藏或者顯示呢個系列。',
      inputTokens: '傳送畀模型嘅輸入 Token。撳一下隱藏或者顯示呢個系列。',
      outputTokens: '模型產生嘅輸出 Token。撳一下隱藏或者顯示呢個系列。',
      cachedTokens: '由提示快取提供嘅輸入 Token。撳一下隱藏或者顯示呢個系列。',
      reasoningTokens: '推理 Token（如果 Harness 有回報）。撳一下隱藏或者顯示呢個系列。',
      totalTokens: '每個區段入面執行嘅輸入 Token 加輸出 Token。',
      costUsd: '回報嘅成本，以美元計。',
      toolCalls: '每個區段入面執行作出嘅工具呼叫。撳一下隱藏或者顯示呢個系列。',
      timeToFirstTokenMsAvg: '區段入面第一個 Token 時間嘅平均值。撳一下隱藏或者顯示呢條線。',
      timeToFirstTokenMsP50: '第一個 Token 時間嘅中位數：有一半執行快過佢。撳一下隱藏或者顯示呢條線。',
      timeToFirstTokenMsP95: '第一個 Token 時間嘅第 95 百分位數：每 20 個執行只有 1 個慢過佢。撳一下隱藏或者顯示呢條線。',
      streamingMsAvg: '平均串流時間，由模型第一個到最後一個輸出。撳一下隱藏或者顯示呢條線。',
      executionMsAvg: 'Harness 平均執行時間，由程序啟動到結束。撳一下隱藏或者顯示呢條線。',
      executionMsP95: '執行時間嘅第 95 百分位數。撳一下隱藏或者顯示呢條線。',
      queueMsAvg: '由入隊到被租用嘅平均時間。',
      outputTokensPerSecondAvg: '串流期間平均每秒輸出 Token。'
    },
    groupSeries: {
      none: '{{name}}：{{metric}}。',
      agent: '代理程式 {{name}} 嘅執行：{{metric}}。撳一下隱藏或者顯示呢個系列。',
      harness: '喺 {{name}} Harness 上嘅執行：{{metric}}。撳一下隱藏或者顯示呢個系列。',
      model: '由模型 {{name}} 提供嘅執行：{{metric}}。撳一下隱藏或者顯示呢個系列。',
      harnessModel: '喺 {{name}}（Harness / 模型）上嘅執行：{{metric}}。撳一下隱藏或者顯示呢個系列。'
    },
    otherSeries: '最繁忙嗰幾組以外嘅所有群組加埋一齊。撳一下隱藏或者顯示佢。',
    dataTable: '以表格顯示呢個圖表背後嘅數字，每個時間區段一行。',
    bucketStart: '時間區段嘅開始。每一行代表一個區段。',
    usage: '按 Harness 同模型拆分嘅用量隨時間變化，唔理上面嘅分組設定，連埋成個範圍嘅總數。',
    breakdown: '所揀範圍內每個 Harness 同模型組合嘅總數。用佢嚟睇邊個模型主導你嘅 Token 用量同成本。',
    breakdownColumns: {
      harness: '運行呢啲執行嘅 Harness。',
      model: 'Harness 回報提供服務嘅模型。「未知模型」即係 Harness 冇回報。',
      runs: '範圍內喺呢個 Harness 同模型上嘅執行。',
      inputTokens: '呢啲執行傳送畀模型嘅輸入 Token。',
      outputTokens: '模型喺呢啲執行產生嘅輸出 Token。',
      cachedTokens: '呢啲執行由提示快取提供嘅輸入 Token。',
      reasoningTokens: '推理 Token，適用於有分開回報嘅 Harness。',
      costUsd: '呢啲執行回報嘅總成本，以美元計。',
      timeToFirstTokenMsAvg: '平均第一個 Token 時間，按每個時間區段嘅執行數目加權。'
    }
  },
  export: {
    menu: '下載 {{name}}：資料可以係 CSV 或 JSON，圖表可以係 PNG 或 SVG 圖片，包括標題、圖例、篩選同時間範圍。',
    csv: '將呢個檢視背後嘅確實資料下載成 CSV：每個區段或記錄一行，用 ISO 8601 UTC 時間戳記，數字用普通小數點格式。',
    png: '將圖表下載成兩倍螢幕解像度嘅 PNG 圖片，包括標題、圖例、使用中嘅篩選同時間範圍。',
    svg: '將圖表下載成可縮放嘅 SVG 圖片，包括標題、圖例、使用中嘅篩選同時間範圍。',
    json: '將資料下載成 JSON，系列、區段、篩選同時間範圍都喺同一份文件入面。'
  }
};

const explainers = {
  approvals: {
    title: '批核點樣運作',
    p1: '開咗批核嘅部署會令佢嘅 Harness 喺工具呼叫之前問 Garrison：Claude Code 經佢嘅權限提示工具問，Codex app-server 執行就會為指令同檔案變更問。',
    p2: '每個要求都會用部署嘅規則檢查。「拒絕」凌駕「問人」，「問人」凌駕「允許」；冇嘢符合嘅話，就用部署預設。「允許」同「拒絕」會即刻回覆；「問人」會將要求放喺呢度，個執行就會等。',
    p3: '你可以附上原因，允許或者拒絕等候中嘅要求。「記住做規則」會喺部署加一條規則，咁下次類似嘅呼叫就會自動決定。冇人決定嘅要求到期時會套用部署嘅逾時決定。'
  },
  diagram: {
    label: '圖表：呼叫方用名稱調用代理程式，Garrison 按權重揀代理程式其中一個部署，再由嗰個部署嘅綁定決定執行點樣進行。',
    caller: { title: '呼叫方', body: 'REST、MCP、A2A，或者另一個代理程式', tip: '任何調用代理程式嘅嘢：REST API、MCP 用戶端、A2A 代理程式，或者另一個代理程式嘅執行。呼叫方只知道代理程式名稱。' },
    agent: { title: '代理程式', body: '名稱、描述、公開方式、委派、輸出結構描述', tip: '可以定址嘅身份。呼叫方用名稱調用佢；佢講明代理程式係乜同點樣公開，而唔係點樣運行。' },
    deploymentA: { title: '部署 A，權重 300', body: 'Claude Code，sonnet', tip: '代理程式嘅其中一種運行方式。權重 300 對 100，冇指名部署嘅調用有 75% 會去佢度。' },
    deploymentB: { title: '部署 B，權重 100', body: 'Mux，本機模型', tip: '同一個代理程式嘅另一種運行方式。呼叫方亦可以明確指名佢，略過按權重揀選。' },
    binds: { title: '每個部署都會綁定', body: 'Harness 設定檔、提示、MCP 伺服器、機密、工作區、節點池、限制', tip: '將請求變成實際程序嘅所有嘢：用邊個 CLI、邊啲提示、邊啲工具同憑證，同埋可以喺邊度運行。' },
    run: { title: '執行', body: '一個部署嘅一次執行', tip: '每次調用都會建立一個執行，由揀中嘅部署編譯，再喺工作節點上執行。' }
  },
  agents: {
    title: '代理程式同部署',
    p1: '代理程式係呼叫方用嘅身份。佢有名稱、描述、公開方式（A2A 卡、MCP 工具）、可唔可以呼叫其他代理程式，同埋佢嘅答案必須符合嘅輸出結構描述。代理程式本身唔會運行任何嘢。',
    p2: '部署係代理程式點樣運行：用邊個 Harness 設定檔同模型、邊啲提示範本、邊啲 MCP 伺服器同機密（用別名）、咩工作區、邊個節點池，同埋套用咩限制同每次執行參數。一個代理程式可以有幾個部署，每個都有流量權重。',
    p3: '有人調用代理程式嗰陣，除非呼叫方指名咗某個部署，否則 Garrison 會按權重隨機揀佢其中一個啟用中嘅部署。咁樣你就可以將 Claude Code 同 Mux 版本並排運行，或者逐步將流量轉去新模型。'
  },
  deployments: {
    title: '部署係乜',
    p1: '部署將代理程式變成可以運行嘅嘢。佢只屬於一個代理程式，並且綁定一個 Harness 設定檔（啟動邊個 CLI）、一個模型、每個角色嘅提示範本、用別名綁定嘅 MCP 伺服器同機密、可選嘅工作區同成品存放區、喺節點池或標籤上嘅排程放置，同埋逾時同並行數等限制。',
    p2: '有幾個啟用中部署嘅代理程式會按權重分配流量：權重 300 同 100，即係每四個呼叫有三個去第一個。停用咗嘅部署唔會收到按權重分配嘅流量，但仍然可以明確指名，咁就好方便喺畀權重之前先測試新配置。',
    p3: '喺部署上用「編譯預覽」，就可以睇到一個執行會收到嘅確實指令行、檔案同環境變數，而唔使真係開始執行。'
  },
  agentDetail: {
    title: '呢個代理程式點樣運行',
    p1: '呢個代理程式靠佢嘅名稱嚟存取。下面嘅部署就係佢實際可以運行嘅方式。每個啟用中部署收到嘅流量份額，等於佢嘅權重除以所有啟用中部署嘅總權重；指名部署嘅呼叫方會略過按權重揀選。'
  },
  harnessProfiles: {
    title: 'Harness 設定檔同部署',
    p1: 'Harness 設定檔係一個指令行代理程式嘅啟動配方：執行檔、參數範本、環境變數、要寫入嘅檔案、提示同系統提示點樣傳遞、佢讀邊種 MCP 設定格式，同埋佢嘅輸出點樣解析成事件。',
    p2: '設定檔係共用嘅基本組件。部署揀一個設定檔，再加上具體細節：模型、提示、機密，同埋只適用於佢嘅參數或環境變數覆寫。好多部署可以用同一個設定檔，所以修正設定檔就會套用到晒全部。',
    p3: '內置設定檔係唯讀嘅。要修改就先複製一份。'
  },
  promptTemplates: {
    title: '提示範本同部署點樣用佢哋',
    p1: 'Garrison 傳畀 Harness 嘅每段文字都係範本：系統提示、包住呼叫方訊息嘅外層、委派指示、工具描述，同埋產生嘅設定檔。範本用 {{input.message}} 同 {{deployment.model}} 呢類變數，每次儲存都會建立新版本。',
    p2: '部署將範本綁定到提示角色（System、Task、DelegatedTask 等等）。綁定可以跟住最新版本，亦可以固定一個版本，所以你可以修改範本而唔影響正式環境嘅部署，直到你決定切換為止。每個執行都會記錄佢實際用咗嘅版本。'
  },
  mcpServers: {
    title: 'MCP 伺服器同綁定',
    p1: '喺度列出嘅 MCP 伺服器係工具提供者：一個地址（stdio 伺服器就係一個指令）、佢需要嘅標頭或環境變數，同埋必須存在嘅工具。登記咗伺服器，唔代表已經畀咗任何代理程式用。',
    p2: '部署會綁定佢嘅代理程式要用嘅伺服器，每個都有一個別名。編譯時 Garrison 會將佢哋寫入 Harness 嘅 MCP 設定，解析標頭入面嘅機密引用，工作節點亦會喺啟動前檢查必需嘅工具。如果代理程式可以委派，Garrison 自己嘅 MCP 伺服器會自動加入。'
  },
  secrets: {
    title: '機密同別名',
    p1: '機密係加密咗嘅數值，例如 API 金鑰或權杖。數值只可以寫入：儲存之後你可以取代或者輪換佢，但冇人可以透過控制台或 API 讀返出嚟。',
    p2: '部署用別名綁定機密。Harness 設定檔嘅環境變數同檔案就會引用 {{secret.alias}}，咁同一個設定檔就可以喺唔同部署用唔同金鑰。數值只會喺編譯執行時解密，經 TLS 傳送去工作節點，並且會由日誌清除。'
  },
  workspaces: {
    title: '工作區',
    p1: '工作區範本描述每個執行開始時嘅目錄：空白、全新嘅 Git 複製（私人儲存庫可以加一個憑證機密），或者一組預先放好嘅檔案。保留設定決定執行之後目錄會刪除定係保留。',
    p2: '部署可以綁定零個或者一個工作區範本。每個執行都有自己嘅副本，所以執行之間永遠睇唔到對方嘅檔案。'
  },
  artifactStores: {
    title: '成品存放區',
    p1: '成品存放區係執行工作區消失之後，保留執行產生嘅檔案嘅地方。部署可以綁定一個存放區，執行完成時工作節點會將符合嘅檔案上載去嗰度。'
  },
  manifests: {
    title: '清單同佢哋建立嘅記錄',
    p1: '清單係以 YAML 或 JSON 文件寫成嘅租用戶配置：機密（預設唔包數值）、提示範本、Harness 設定檔、MCP 伺服器、工作區範本、代理程式同部署。文件之間用名稱互相引用，所以同一份清單喺任何租用戶都用得。',
    p2: '套用清單會建立或者更新普通記錄，即係你喺其他分頁睇到嗰啲。套用兩次唔會改到任何嘢。試行會顯示會有咩改變但唔寫入，而「匯出」會產生一份可以重建呢個租用戶嘅清單。'
  },
  nodes: {
    title: '節點同節點池',
    p1: '節點係一個工作程序，通常係一個 Pod，佢由控制平面拉取執行、啟動 Harness，再將事件串流返嚟。節點會自行登記、回報佢搵到邊啲 Harness，並且發送心跳；你唔使喺度建立佢哋。',
    p2: '節點可以屬於一個節點池，亦可以帶有標籤。部署用節點池同標籤選擇器決定佢哋嘅執行可以喺邊度運行。封鎖節點可以停止新工作，維護之前就清空佢。'
  },
  controlNodes: {
    title: '控制節點同工作節點',
    p1: '控制節點係 Garrison 伺服器嘅一個副本。控制節點提供 REST API、MCP 伺服器同 A2A 閘道，驗證呼叫者身份，將部署編譯成執行，再排程呢啲執行。任何副本都可以回應任何請求，所以負載平衡器可以將流量分俾佢哋。',
    p2: '其中一個控制節點係領導者。佢喺資料庫度持有一個租約，負責成個叢集嘅維護：按保留期清理、將冇心跳嘅副本標記做離線，同埋刪除舊嘅資料行。如果領導者停咗，另一個副本會喺幾秒之內接手個租約。',
    p3: '工作節點（喺「工作節點」分頁）負責另一半：佢哋由控制平面攞已租用嘅執行，再運行 Harness。控制節點從來唔會運行 Harness，工作節點亦都從來唔會掂資料庫。每個副本都會自己登記，每 5 秒發一次心跳，所以呢個分頁係唯讀嘅。'
  },
  nodePools: {
    title: '節點池同節點',
    p1: '節點池係具名嘅工作節點群組，例如 GPU 機器，或者保留畀某個客戶嘅節點。節點登記時會加入節點池。節點池可以限制畀某啲租用戶用。',
    p2: '指名節點池嘅部署只會喺佢嘅節點上運行。冇指定節點池嘅部署可以喺任何合資格嘅節點上運行。'
  },
  tenants: {
    title: '租用戶',
    p1: '租用戶係呢部伺服器上一個互相隔離嘅組織。用戶、存取金鑰、代理程式、機密同執行全部都屬於一個租用戶，租用戶之間乜都睇唔到。節點池同工作節點係共用嘅，除非某個節點池保留咗畀指定租用戶。'
  },
  users: {
    title: '用戶同存取金鑰',
    p1: '用戶係用電郵同密碼登入嘅人。存取金鑰係自動化登入嘅方式。每條存取金鑰都屬於一個用戶，而且永遠唔可以做多過嗰個用戶可以做嘅事。',
    p2: '兩者都唔會因為存在就自動有存取權。存取權嚟自用戶身上嘅管理員旗標，同埋角色指派。'
  },
  credentials: {
    title: '存取金鑰同用戶',
    p1: '存取金鑰係畀腳本、SDK 同服務用嘅一對存取金鑰同密鑰。佢屬於一個用戶。佢實際嘅權限係佢自己嘅角色指派所授予嘅權限，同佢擁有者可以做嘅事兩者重疊嘅部分。',
    p2: '密鑰只會喺建立或輪換金鑰時顯示一次。要定期輪換金鑰，並且刪除好耐冇用過嘅金鑰。'
  },
  roles: {
    title: '角色、權限同指派',
    p1: '權限係單一規則：允許或拒絕對某啲資源類型（例如 Agent 或 Run）進行某啲操作（例如 Read 或 Execute）。角色係具名嘅權限組合。拒絕永遠凌駕允許。',
    p2: '角色未指派之前，對任何人都冇影響。下一個分頁嘅指派會將角色連接到用戶或存取金鑰，範圍可以係成個租用戶或者一筆記錄。'
  },
  assignments: {
    title: '指派',
    p1: '指派會將一個角色授予一個用戶或者存取金鑰。租用戶範圍會將角色套用到涵蓋類型嘅每一筆記錄；資源範圍只會套用到單一筆記錄，例如某個 CI 工作可以調用嘅嗰一個代理程式。',
    p2: '喺用戶或存取金鑰上用「實際權限」，就可以睇到佢所有指派合併之後嘅結果。'
  },
  runs: {
    title: '執行同隊列',
    p1: '執行係一個部署嘅一次調用。佢會入隊、畀工作節點租用、執行，最後以結果、對話記錄、輸出同遙測數據（例如第一個 Token 時間、Token 同成本）完成。',
    p2: '「隊列」分頁顯示同一批仲喺等候嘅執行：已入隊嘅執行需要一個 Harness 同排程放置都啱嘅節點，已租用嘅執行已經被認領，執行中嘅執行正喺度運行。長時間停喺隊列嘅執行，代表容量唔夠，或者排程放置規則冇節點符合。'
  },
  queue: {
    title: '隊列',
    p1: '呢度係未完成執行嘅即時檢視：等緊節點、已租用或者執行中，按代理程式同 Harness 分組。佢同「執行」分頁係同一批資料，只係摘要出嚟顯示排程壓力。',
    p2: '如果某個 Harness 嘅入隊數目不斷上升，通常即係冇一個就緒節點公佈支援嗰個 Harness、符合嘅節點已經滿晒，或者部署要求嘅節點池或標籤冇節點有。'
  },
  invoke: {
    title: '調用時會發生咩事',
    p1: '你用名稱呼叫代理程式。除非你揀咗部署，否則 Garrison 會按權重揀代理程式其中一個啟用中嘅部署，按嗰個部署容許嘅範圍驗證每次執行參數，然後將執行入隊。工作節點執行嗰陣，對話記錄會喺度串流顯示。'
  },
  audit: {
    title: '審計同請求記錄',
    p1: '審計記錄係保安同配置事件：登入、被拒絕嘅請求、機密同角色變更、清單套用，同埋節點狀態變更。佢哋會按設定入面嘅保留期限保存。',
    p2: '上一個分頁嘅「請求記錄」係原始 HTTP 流量。用審計嚟答「邊個改咗啲乜」，用請求記錄嚟除錯用戶端實際傳送咗啲乜。'
  },
  requests: {
    title: '請求記錄',
    p1: '呢部伺服器擷取咗嘅每個 API 請求，包括方法、路徑、狀態、時間、標頭同內容（截短至設定嘅大小）。用佢嚟除錯整合同 SDK 呼叫。撳圖表上嘅棒形，就可以將表格收窄到嗰段時間。'
  },
  analytics: {
    title: '呢啲圖表量度啲乜',
    p1: '第一個 Token 時間由 Harness 程序啟動計到模型第一個輸出，所以包括 CLI 啟動時間。串流時間由模型第一個輸出計到最後一個輸出，執行時間由程序啟動計到結束。排隊時間係執行等工作節點等咗幾耐。呢啲都係用工作節點同伺服器嘅時鐘量度。',
    p2: 'Token 數目同成本嚟自每個 Harness 嘅回報。快取 Token 係由供應商提示快取提供嘅輸入 Token，推理 Token 只會喺有分開回報嘅 Harness 出現。每秒輸出 Token 係輸出 Token 除以串流時間。',
    p3: '平均值唔計量度唔到數值嘅執行。百分位數顯示尾部情況：p95 即係每二十個執行只有一個慢過佢。按代理程式或 Harness 分組，就可以並排比較。'
  },
  conversations: {
    title: '對話與輪次',
    p1: '對話係與一個代理程式進行嘅一系列執行。第一輪開始一個 Harness 工作階段；後續每一輪都在同一個工作節點上恢復該工作階段，所以代理程式在訊息之間保留其檔案、工具和情境。',
    p2: '同一時間只執行一輪：上一輪未完成時，新嘅訊息會被拒絕。每一輪都使用第一輪嘅部署。',
    p3: '當某一輪冇辦法恢復工作階段時（節點已不在或長時間被占用、檔案已被移除、或 Harness 唔支援恢復），佢會回退到一個以先前各輪紀錄開始嘅全新工作階段。「回退次數」欄統計這些輪次，輪次清單會說明原因。'
  }
};

export { tips, explainers };
