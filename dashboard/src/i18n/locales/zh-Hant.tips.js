// Traditional Chinese tooltip (tips.*) and relationship explainer (explainers.*) text. Merged into zh-Hant.js. Mirrors en.tips.js key for key.

const TELEMETRY = {
  approvalWaitMs: '核准等候：此執行等候權限核准（由人員或逾時決定）所花費的總時間。由規則或部署預設值立即決定的呼叫不會增加時間。由伺服器測量；執行從未等候時顯示 n/a。',
  delegationWaitMs: '委派等待時間：此執行等待它透過 Garrison 啟動的子執行（即它委派的其他代理程式）的時間，依這些子執行的伺服器時間戳記計算。若執行未委派任何工作，則為零或不適用。',
  timeToFirstTokenExcludingDelegationMs: '第一個 Token 時間（不含委派）：第一個 Token 時間減去執行在第一個輸出前等待委派執行的時間。可用來公平比較會委派與不委派的代理程式。以伺服器時間戳記計算，絕不為負值。',
  timeToFirstTokenMs: '第一個 Token 時間：從工作節點啟動 Harness 程序開始，到模型產生第一個輸出（文字或思考）為止。其中包含 Harness 啟動時間，因此 CLI 啟動緩慢也會反映在這裡。由工作節點以單調時鐘量測。',
  streamingMs: '串流時間：從第一個模型輸出到最後一個輸出之間的時間，也就是模型實際產生輸出的時長。由工作節點以單調時鐘量測。',
  executionMs: '執行時間：由工作節點量測，從 Harness 程序啟動到程序結束的時間。未回報此值的舊版伺服器會改用開始與完成時間戳記計算。',
  queueMs: '排隊時間：執行從進入佇列到被工作節點取得租約之間等待的時間。數值偏高代表所有符合條件的節點都在忙碌，或沒有節點符合排程放置規則。由伺服器量測。',
  totalMs: '總時間：從進入佇列到完成，也就是排隊時間加上執行時間與結果回報時間。由伺服器量測。',
  outputTokensPerSecond: '每秒輸出 Token 數：輸出 Token 數除以串流時間。只有在串流持續至少 100 ms 時才會顯示，因為更短的時間區間算出的速率沒有意義。',
  inputTokens: 'Harness 回報的整個執行輸入 Token 數，包含系統提示、工具結果，以及各回合的對話歷史。',
  outputTokens: '模型在執行的每個回合中產生的輸出 Token 數，由 Harness 剖析器回報。',
  cachedTokens: '由供應商提示快取提供的輸入 Token。快取 Token 通常以較低費率計費，因此這裡占比越高，成本越低。',
  reasoningTokens: '推理或思考 Token，前提是 Harness 會分開回報（例如 Codex 的推理輸出）。若 Harness 沒有分開列出，則為零。',
  toolCallCount: '執行中的工具呼叫事件數：包含 MCP 工具、Harness 內建工具，以及對其他 Garrison 代理程式的呼叫。由工作節點從事件串流中計算。',
  costUsd: 'Harness 回報的成本（美元）。若是 Garrison 根據 Token 數自行計算，而非由 Harness 回報，則會標示為估計值。',
  firstTokenUtc: '執行中第一個模型輸出事件的實際時間（UTC，以你的時區顯示）。',
  lastTokenUtc: '執行中最後一個模型輸出事件的實際時間（UTC，以你的時區顯示）。'
};

const FILE_ITEMS = {
  baseDirectory: '路徑相對於哪個目錄：執行設定目錄、工作區，或執行的 HOME 目錄。',
  pathTemplate: '啟動前要寫入的檔案相對路徑。可以使用範本，例如 settings/{{run.id}}.json。',
  contentTemplate: '要轉譯為檔案內容的範本。可以參照變數，以及透過 {{secret.alias}} 繫結的祕密。',
  condition: '範本運算式；轉譯結果為空或 false 時，不會寫入此檔案。',
  mode: '以八進位表示的 Unix 檔案權限模式，例如存放憑證的檔案使用 0600。',
  isSecret: '將轉譯後的內容視為祕密：永遠不會寫入記錄，並且在編譯預覽中會被遮蔽。'
};

const tips = {
  fieldWarnings: { dismiss: '隱藏此提示。記錄已按此處列出的值儲存。' },
  approvals: {
    awaiting_one: 'Harness 在工具呼叫前提出詢問，正在等候人員處理。請開啟「核准」分頁來允許或拒絕（{{count}} 個等候中）。',
    awaiting_other: 'Harness 在工具呼叫前提出詢問，正在等候人員處理。請開啟「核准」分頁來允許或拒絕（{{count}} 個等候中）。',
    decide: {
      decision: '選擇 Harness 是否可以進行此工具呼叫。你送出後，執行會立即繼續。',
      allow: '讓 Harness 進行此工具呼叫。執行會帶著這個呼叫繼續進行。',
      deny: '拒絕此工具呼叫。Harness 會收到拒絕訊息，並在沒有此呼叫的情況下繼續。',
      reason: '選填的備註，會與決定一起儲存並寫入稽核記錄。拒絕時，此備註會傳給代理程式。',
      remember: '同時在此核准所屬的部署中新增規則，下次相同類型的呼叫就會自動決定。',
      rulePattern: '要新增的規則，使用 Claude Code 規則語法。預設為建議的規則；儲存前可以放寬或縮小範圍。',
      submitAllow: '立即允許此工具呼叫。此決定是最終決定，之後無法再變更。',
      submitDeny: '立即拒絕此工具呼叫。此決定是最終決定，之後無法再變更。'
    }
  },
  approvalCheck: {
    toolName: 'Harness 回報的工具名稱，例如 Bash、Edit、WebFetch，或 mcp__github__create_issue 這類 MCP 工具。',
    inputs: {
      command: '要測試的 Shell 命令，例如 npm run build && npm test。每個子命令都必須被允許。',
      url: '工具將要擷取的 URL。WebFetch 規則會依其網域比對。',
      query: '工具將要送出的搜尋查詢，用來比對與此查詢相關的規則。',
      file_path: '工具將要讀取或變更的檔案路徑，可以是相對於工作區的路徑或絕對路徑。',
      notebook_path: '工具將要變更的筆記本路徑，用來比對與此筆記本相關的規則。',
      pattern: '工具將要使用的 glob 或搜尋模式，用來比對與此模式相關的規則。'
    },
    run: '針對此工具呼叫評估部署已儲存的規則並顯示結果。不會記錄任何內容，也不會影響任何執行。',
    suggestedRule: '「記住」會為此呼叫新增的規則。將它複製到上方的規則中，即可涵蓋類似的呼叫。'
  },
  ids: { deleted: '此記錄已刪除。ID {{id}}。複製按鈕會複製此 ID。', named: 'ID {{id}}。使用複製按鈕複製此 ID，供 API、SDK 或支援要求使用。' },
  markdown: {
    column: '代理程式輸出中表格的 {{name}} 欄。較寬的表格可在其框內橫向捲動。',
    showRaw: '顯示代理程式傳回的原始文字，不套用 Markdown 格式，方便檢查或複製。',
    showRendered: '重新以 Markdown 格式顯示文字，包括表格、清單、程式碼區塊和連結。',
    copy: '將原始結果文字（包括 Markdown 語法）複製到剪貼簿。',
    link: '在新分頁開啟 {{href}}。此連結來自代理程式的輸出，請先核對網址再信任它。'
  },
  common: {
    fields: {
      name: '此紀錄在租用戶內的唯一名稱。其他紀錄與清單會以此名稱參照它。',
      description: '給人看的自由文字備註，說明此紀錄的用途，執行時不會使用。',
      active: '停用的紀錄會保留但被忽略。關閉此選項即可暫停某項目，而不必刪除它。',
      id: '系統產生的識別碼，帶有類型前置字串。可在 API 呼叫與指令碼中使用，永遠不會變更。',
      createdUtc: '此紀錄的建立時間。將滑鼠移到值上可查看確切的日期與時間。',
      lastUpdateUtc: '此紀錄最後一次變更的時間。',
      isBuiltIn: '內建紀錄隨 Garrison 提供，為唯讀。自訂紀錄是在此租用戶中建立的，可以編輯。',
      expiresUtc: '超過此時間後，紀錄將失效。留空表示永不過期。'
    }
  },
  explainer: {
    reopen: '再次顯示 {{topic}} 的說明：此頁面管理什麼，以及它與 Garrison 其他部分的關係。',
    dismiss: '隱藏此說明。原位置會保留一個小型「關於」按鈕，讓你隨時可以重新開啟。'
  },
  nav: {
    approvalsBadge_one: '有 {{count}} 個工具呼叫正在等候人員允許或拒絕。請開啟「核准」來決定。',
    approvalsBadge_other: '有 {{count}} 個工具呼叫正在等候人員允許或拒絕。請開啟「核准」來決定。',
    hubs: {
      approvals: '核准收件匣：代理程式要求進行、正在等候人員處理的工具呼叫，以及由規則、預設值、人員或逾時所做每項決定的歷程。',
      home: '從這裡開始：代理程式、執行與工作節點的即時數量、API 流量、近期失敗，以及常用工作的捷徑。',
      invoke: '直接在瀏覽器中傳送訊息給代理程式，並觀看對話紀錄即時串流，不需要撰寫任何程式碼。',
      runs: '每一次代理程式呼叫的對話紀錄、結果與遙測資料，以及等待節點的工作佇列。',
      analytics: '執行速度、Token 用量、成本、結果與工具呼叫隨時間變化的圖表，可依代理程式、Harness 與部署篩選。',
      agents: '呼叫端以名稱呼叫的代理程式，以及決定每個代理程式實際如何執行的部署。',
      configuration: '部署所使用的構成元件：Harness 設定檔、提示範本、MCP 伺服器、祕密、工作區、成品存放區與清單。',
      fleet: '提供 API 並排程執行的控制平面副本、負責處理執行的工作節點，以及將工作節點分組以進行排程放置的節點池。',
      access: '誰可以登入以及可以做什麼：租用戶、使用者、存取金鑰、角色與角色指派。',
      monitoring: '調查發生了什麼事：擷取的 API 請求、安全性稽核軌跡，以及即時 API 探索器。',
      system: '伺服器設定，以及你目前連線之伺服器的端點、版本與身分。'
    },
    tabs: {
      runs: '搜尋、篩選並檢視個別執行。開啟某個執行即可閱讀其對話紀錄、結果與遙測資料，或取消並重試。',
      queue: '正在等待節點、已取得租約或正在執行的執行，依代理程式與 Harness 分組。',
      agents: '呼叫端透過 REST、MCP 或 A2A 呼叫的具名代理程式。代理程式是身分；它的部署決定它如何執行。',
      deployments: '每個代理程式的執行方式：Harness 設定檔、模型、提示、MCP 伺服器、祕密、工作區、排程放置、限制與流量權重。',
      harnessProfiles: '以無介面模式啟動 CLI Harness 的配方：執行檔、引數、環境變數、檔案與輸出剖析。',
      promptTemplates: 'Garrison 傳送給 Harness 的每一個提示與產生的設定檔，具備版本控管與即時預覽。',
      mcpServers: '代理程式可以使用的工具伺服器。先在這裡註冊，再將它們繫結到部署。',
      secrets: '加密儲存的 API 金鑰與權杖。部署以別名繫結它們；值不會再次顯示。',
      workspaces: '執行所用工作目錄的範本：空白、從 Git 複製，或預先放入檔案。',
      agentAssets: '由代理修訂釘選、具版本的系統提示、技能、參考檔案與文件範本，可在此上傳並查看歷史。',
      artifactStores: '存放執行產生、且你希望在執行結束後保留之檔案的目的地。',
      modelPrices: "在執行器未報告費用時，使用操作員設定的美元費率進行估算。已報告費用（包括零）優先。",
      usageQuotas: "租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。",
      manifests: '以 YAML 套用或匯出整個租用戶的設定，讓它可以納入原始碼控管。',
      nodes: '拉取執行並執行 Harness 的工作機器或 Pod。可在此封鎖、清空或檢視它們。',
      controlNodes: '提供 REST、MCP 與 A2A 並排程執行的伺服器副本（控制節點）。其中一個是領導者，負責叢集維護。以唯讀方式顯示狀態、版本與活動。',
      nodePools: '具名的節點群組，可選擇保留給特定租用戶使用。部署可以要求使用某個節點池。',
      tenants: '此伺服器上彼此隔離的組織，各自擁有自己的使用者、代理程式、祕密與執行。',
      users: '以電子郵件與密碼登入的人員。每位使用者都可以擁有存取金鑰。',
      credentials: '供指令碼、SDK 與服務使用的存取金鑰。每把金鑰屬於一位使用者，並以該使用者的權限或更少的權限運作。',
      roles: '具名的權限組合，以及權限本身。指派角色即可授予存取權。',
      assignments: '將角色連結到使用者或存取金鑰的授權，範圍可以是整個租用戶或單一資源。',
      requests: '此伺服器擷取的 API 請求，包含標頭、本文、時間與狀態，用於偵錯整合。',
      audit: '安全性與設定事件：登入、拒絕、祕密變更、清單套用與節點變更。',
      explorer: '從伺服器的 OpenAPI 文件中挑選任何 API 操作，填入參數並即時執行。',
      settings: '伺服器與叢集設定，包含其來源，以及變更是即時生效還是需要重新啟動。',
      serverInfo: 'REST、MCP 與 A2A 位址、伺服器與儀表板版本，以及你目前登入的身分。',
      conversations: '與代理程式的多輪對話：每一輪都是一次執行，會恢復上一輪的工作階段。開啟一個對話即可閱讀各輪並傳送下一則訊息。'
    },
    subtabs: {
      roles: '角色以一個名稱將權限分組，例如 Operator 或 Invoker。將角色指派給某人，即可授予該角色的所有權限。',
      permissions: '允許或拒絕對資源類型執行操作的個別規則。角色由這些規則組成；拒絕永遠優先。',
      userAssignments: '將角色授予以電子郵件與密碼登入的人員。',
      credentialAssignments: '將角色授予自動化所使用的存取金鑰。金鑰的權限應比其擁有者更窄。'
    },
    setup: '開啟設定精靈：儲存 Harness 憑證、套用範例代理程式，並執行一次以確認一切正常。',
    tour: '重新播放簡短的導覽，介紹導覽列、環境資訊，以及設定所在的位置。',
    skipToContent: '跳過導覽列，直接前往此頁面的主要內容。主要供鍵盤使用者使用。'
  },
  topbar: {
    toggleSidebar: '收合或展開導覽側邊欄。在小螢幕上，會以覆蓋層方式開啟導覽。',
    server: '此主控台所連線的 Garrison 伺服器：{{url}}。圓點顯示其健康檢查是否通過。',
    health: {
      healthy: '伺服器在過去 30 秒內回應了健康檢查。',
      unhealthy: '伺服器沒有回應健康檢查。此頁面發出的請求很可能會失敗。',
      unknown: '正在等待伺服器的第一個健康檢查結果。'
    },
    copyServer: '複製伺服器 URL，例如用來設定 SDK 或 curl 指令。',
    switchTenant: '系統管理員可以檢視任何租用戶。每個頁面都會顯示所選租用戶的資料。',
    tenant: '你目前在租用戶 {{tenant}} 中工作。你看到的每筆紀錄與執行都屬於它。',
    principal: '你目前以 {{name}} 的身分登入。你執行的動作都會以此身分記錄。',
    role: '你在此租用戶中的最高存取層級。它決定了哪些頁面與動作可以使用。',
    liveOn: '已透過 WebSocket 連線到伺服器，因此執行與節點的變更會即時出現。',
    liveOff: '沒有即時連線。頁面會改以各自的計時器重新整理，因此變更可能需要幾秒鐘才會顯示。',
    github: '在新分頁中開啟 GitHub 上的 Garrison 原始碼儲存庫，以查看文件與問題回報。',
    themeLight: '切換為淺色佈景主題。此選擇會記在這個瀏覽器中。',
    themeDark: '切換為深色佈景主題。此選擇會記在這個瀏覽器中。',
    logout: '登出並撤銷此瀏覽器工作階段。你之後需要重新登入。',
    language: '變更顯示語言。日期與數字格式也會跟著語言調整，且此選擇會被記住。'
  },
  login: {
    passwordTab: '以人員身分使用租用戶、電子郵件與密碼登入。',
    keyTab: '使用存取金鑰與祕密金鑰登入，也就是指令碼與 SDK 使用的同一組金鑰。',
    serverUrl: 'Garrison REST API 的基底位址，例如透過連接埠轉送的伺服器 127.0.0.1:8700。',
    tenantId: '你的帳戶所屬的租用戶。本機預設租用戶名為 default。',
    email: '你在此租用戶中的使用者帳戶電子郵件地址。',
    password: '你的帳戶密碼。只會傳送一次以取得工作階段權杖，瀏覽器應用程式不會儲存它。',
    accessKey: '存取金鑰的公開部分，以 access_ 開頭。可在「存取」>「存取金鑰」下建立金鑰。',
    secretKey: '存取金鑰的私密部分。只在建立或輪替金鑰時顯示過一次。',
    submit: '向伺服器驗證憑證，並開啟你租用戶的主控台。'
  },
  table: {
    selectAll: '選取或清除此頁面上的每一列，例如要一起刪除時使用。',
    selectRow: '選取此列以進行批次動作，例如刪除。',
    sortServer: '{{tip}} 按一下即可依此欄排序整份清單；再按一下可反轉順序。',
    sortPageOnly: '{{tip}} 按一下只會排序此頁面上的列；伺服器無法依此欄排序。',
    clearSelection: '取消選取所有已選取的列，不會變更任何內容。',
    pageSize: '每頁要載入的列數。頁面越大，載入時間越長。此選擇會依表格分別記住。',
    first: '前往結果的第一頁。',
    prev: '返回結果的上一頁。',
    jump: '輸入 1 到 {{total}} 之間的頁碼，並按下 Enter 直接跳到該頁。',
    next: '前往結果的下一頁。',
    last: '前往結果的最後一頁。',
    refresh: '立即從伺服器重新載入此清單，並保留你目前的頁碼、篩選條件與排序。',
    autoRefresh: '依計時器自動重新載入此資料。關閉後資料會保持不動，方便你閱讀。',
    selectColumns: '選擇表格要顯示的欄位。你的選擇會依表格記在這個瀏覽器中。',
    columnPinned: '{{column}} 一律顯示，因為沒有它就無法識別各列。',
    columnToggle: '顯示或隱藏 {{column}} 欄。{{tip}}',
    actionsFor: '開啟 {{name}} 的動作：檢視、編輯、建立副本、檢視 JSON、刪除，以及此紀錄專屬的動作。',
    actionsMenu: '開啟此列可用的動作。',
    actionsColumn: '每列的動作。按一下三個點即可檢視、編輯、建立副本、檢查 JSON 或刪除。',
    search: '輸入部分名稱以縮小清單範圍。你停止輸入後，搜尋會在伺服器上執行。',
    clearFilters: '移除搜尋文字與所有篩選條件，並再次顯示完整清單。',
    bulkDelete: '刪除所有已選取的列。系統會先要求你確認。'
  },
  filters: {
    decisionSource: '只顯示以特定方式決定的核准：由規則、部署預設值、人員、逾時或已停止的執行決定。',
    runId: '只顯示單一執行的核准。貼上執行 ID，例如 run_...；停止輸入後清單就會更新。',
    status: '只顯示處於此狀態的紀錄。選擇「全部」即可移除篩選。',
    harnessType: '只顯示某一種 Harness 的紀錄，例如 Claude Code 或 Codex。',
    kind: '只顯示某一種類的紀錄。選擇「全部」即可移除篩選。',
    eventType: '只顯示某一類型的稽核事件，例如登入失敗或祕密變更。',
    fromUtc: '只顯示在此時間當下或之後建立的紀錄（你的本機時區）。',
    toUtc: '只顯示在此時間之前建立的紀錄（你的本機時區）。',
    method: '只顯示使用此 HTTP 方法的請求。',
    statusCode: '只顯示傳回此 HTTP 狀態碼的請求，例如 404 或 500。',
    pathContains: '只顯示路徑包含此文字的請求，例如 /agents。',
    tenantId: '只顯示在此租用戶中發出的請求。留空表示所有租用戶。',
    apply: '以上方的篩選值執行搜尋。',
    clear: '將上方所有篩選條件重設為空白，並再次搜尋。',
    agentId: '只顯示屬於某個代理程式的紀錄。選擇「全部」可移除此篩選。'
  },
  form: {
    option: '在 {{field}} 中包含 {{option}}。已勾選的選項會被儲存；未勾選的則不會包含。',
    reveal: '以純文字顯示輸入的值，讓你在儲存前檢查。',
    hide: '再次遮蔽此值，讓看著你螢幕的人無法讀取。',
    key: '{{field}} 中此項目的鍵。清單中的鍵必須唯一。',
    value: '{{field}} 中此項目的值。在有標示之處可使用範本與祕密參照。',
    removeRow: '從清單中移除此項目。在你按下「儲存」之前，不會儲存任何內容。',
    addRow: '在 {{field}} 中新增一個空白的鍵值項目。',
    moveUp: '將此項目往前移一個位置。這裡的順序很重要，例如引數清單。',
    moveDown: '將此項目往後移一個位置。這裡的順序很重要，例如引數清單。',
    removeItem: '從清單中移除此項目。在你按下「儲存」之前，不會儲存任何內容。',
    addItem: '在 {{field}} 中新增一個空白項目，並填寫其欄位。'
  },
  actions: {
    openDetail: '開啟此紀錄的完整詳細資料頁面。',
    view: '以唯讀方式開啟此紀錄，查看所有欄位而不會有誤改的風險。',
    edit: '在表單中開啟此紀錄以進行變更。按下「儲存」後變更才會生效。',
    duplicate: '以此紀錄的值與帶有 -copy 的名稱預先填入，建立新紀錄。在你儲存之前不會建立任何內容。',
    viewJson: '顯示 API 傳回的原始 JSON，用於偵錯或複製到指令碼中。',
    delete: '永久刪除此紀錄。系統會要求你確認，且無法復原。',
    add: '在表單中建立此類型的新紀錄。',
    switchToEdit: '將此唯讀檢視切換為可編輯的表單。',
    retryLoad: '再次嘗試從伺服器載入此資料。'
  },
  modal: {
    close: '關閉此視窗。伺服器上的任何內容都不會變更。',
    dismiss: '關閉此視窗而不儲存。你也可以按 Escape 鍵。',
    cancelForm: '關閉表單並捨棄尚未儲存的變更。',
    back: '前往表單的上一個步驟。你輸入的值會保留。',
    next: '前往表單的下一個步驟。在你按下「儲存」之前，不會儲存任何內容。',
    saveEdit: '儲存你對此紀錄的變更。伺服器會驗證內容，並回報任何需要注意的欄位。',
    saveCreate: '以這些值建立紀錄。伺服器會驗證內容，並回報任何需要注意的欄位。',
    saveValue: '將此值傳送到伺服器。它在抵達時即被加密，且不會再次顯示。'
  },
  confirm: {
    delete: '是的，永久刪除此紀錄。',
    bulkDelete: '是的，永久刪除所有已選取的紀錄。',
    cancel: '返回，不執行任何動作。',
    danger: '執行此破壞性動作。此動作無法復原。',
    confirm: '執行上方描述的動作。'
  },
  copy: {
    id: '將記錄 ID 複製到剪貼簿，供 REST API、SDK 或篩選器使用。',
    value: '將此值複製到剪貼簿。',
    block: '將整個區塊複製到剪貼簿，可直接貼到終端機或檔案中。',
    done: '已複製到剪貼簿。'
  },
  chart: {
    ranges: {
      hour: '顯示過去 60 分鐘，以每分鐘為一個區間。',
      day: '顯示過去 24 小時。區間大小會自動調整，讓圖表保持易讀。',
      week: '顯示過去 7 天。區間大小會自動調整，讓圖表保持易讀。',
      month: '顯示過去 30 天。區間大小會自動調整，讓圖表保持易讀。',
      custom: '自行選擇開始與結束時間。時間範圍過長會被伺服器拒絕。'
    },
    refresh: '立即從伺服器重新載入圖表資料。',
    tenant: '顯示單一租用戶或伺服器上所有租用戶的請求活動。'
  },
  badges: {
    approvalsOn_one: '核准已開啟：Harness 會在工具呼叫前詢問，並由 {{count}} 條規則自動決定其中一部分。',
    approvalsOn_other: '核准已開啟：Harness 會在工具呼叫前詢問，並由 {{count}} 條規則自動決定其中一部分。',
    approvalsOff: '核准已關閉：Harness 依照自身的權限設定進行工具呼叫，不會詢問。',
    active: '啟用：此紀錄正在使用中。',
    inactive: '停用：此紀錄會保留，但在重新啟用前會被忽略。',
    builtIn: '內建：隨 Garrison 提供且為唯讀。複製它即可建立可編輯的版本。',
    custom: '自訂：在此租用戶中建立，因此可以編輯與刪除。',
    systemAdmin: '系統管理員：可以管理所有租用戶，並略過授權檢查。',
    tenantAdmin: '租用戶管理員：可以管理此租用戶內的一切。',
    user: '一般使用者：存取權僅來自角色指派。',
    role: '此指派授予 {{role}} 角色及其中的所有權限。',
    deploymentActive: '啟用：此部署會接收代理程式流量中屬於它的份額。',
    deploymentInactive: '停用：此部署不會接收流量，但呼叫時仍可明確指定它。'
  },
  permissions: {
    source: '此授權來自的角色。若要修正存取權，請變更該角色或授予它的指派。',
    type: '「允許」授予這些操作；「拒絕」會封鎖這些操作，即使其他角色允許也一樣。',
    resources: '此授權涵蓋的紀錄種類，例如 Agent 或 Run。',
    operations: '可以對這些紀錄執行的動作，例如 Read、Create 或 Execute。',
    scope: '「租用戶」範圍涵蓋該類型的所有紀錄；「資源」範圍只涵蓋某一筆特定紀錄。'
  },
  compilePreview: {
    input: '用於編譯的範例呼叫端訊息。它會成為任務範本中的 {{input.message}}。',
    compile: '以與實際執行完全相同的方式編譯此部署，但不啟動執行，並顯示命令列、檔案與環境變數。'
  },
  secretOnce: {
    accessKey: '公開的存取金鑰。它用來識別此存取金鑰紀錄，可以安全地存放在設定中。',
    secretKey: '祕密金鑰。這是唯一一次顯示；請立即將它複製到你的密碼管理工具或祕密存放區。',
    done: '關閉此視窗。祕密金鑰之後無法再取回，只能輪替。'
  },
  wizard: {
    skip: '關閉精靈，且不再對此租用戶提供。你可以從側邊欄重新開啟它。',
    back: '返回精靈的上一個步驟。',
    start: '開始設定：新增憑證、套用範例代理程式，並進行測試。',
    saveSecret: '將憑證加密儲存在此租用戶中，並前往下一個步驟。',
    skipStep: '不新增憑證並繼續。範例代理程式不需要憑證。',
    apply: '根據上方顯示的清單建立範例代理程式與部署。',
    invoke: '以你的訊息啟動範例代理程式的執行，並開啟其詳細資料頁面。',
    secretName: '所儲存憑證的名稱。部署在繫結它時會以此名稱參照。',
    manifest: 'YAML 格式的範例清單。你可以在套用前編輯它，例如為代理程式重新命名。',
    message: '要傳送給範例代理程式的訊息。模擬 Harness 會原樣回傳它。'
  },
  tour: {
    skip: '立即結束導覽。你可以從側邊欄重新播放。',
    back: '顯示導覽的上一站。',
    next: '前往導覽的下一站。',
    done: '完成導覽。你可以從側邊欄重新播放。'
  },
  telemetry: {
    ...TELEMETRY,
    panel: '此執行的每個階段花了多少時間，以及消耗了什麼。各項時長來自工作節點與伺服器的時鐘，說明見各欄位。',
    phases: '執行的時間花在哪裡，由左至右：在佇列中等待、Harness 啟動到第一個 Token、串流輸出，以及其餘的執行時間。',
    phase: {
      delegation: '在模型第一個輸出之前，執行等待其委派子執行的時間。這不是 Harness 啟動時間。',
      queue: '在佇列中等待工作節點取得此執行的租約。',
      startup: '從程序啟動到第一個模型輸出，包含 Harness 啟動與第一次模型請求。',
      streaming: '從第一個到最後一個模型輸出。',
      tail: '最後一個模型輸出之後的執行：工具呼叫、結果處理與程序結束。'
    }
  },
  blocked: {
    panel: '這個執行為何仍在佇列中，以及需要改什麼才能讓工作節點接手。',
    openFleet: '開啟機群頁面，查看哪些工作節點已就緒、每個節點回報了哪些 Harness，以及探測詳細資料。',
    openAgent: '開啟這個執行的代理程式，檢查它的部署，包括每個部署的節點池與節點選取器。',
    homeBanner: '目前沒有就緒的工作節點能執行的佇列中執行。它們會一直等待，直到出現可執行的工作節點；若設定了 Runtime.FailBlockedAfterSeconds，逾時後會失敗。',
    showRuns: '開啟依佇列狀態篩選的執行頁面。受阻的執行帶有說明原因的警告徽章。',
    queueColumn: '這個群組中目前沒有就緒工作節點能執行的佇列中執行。將游標停在徽章上可查看原因與處理方式。'
  },
  enums: {
    approvalStatus: {
      Pending: '正在等候人員允許或拒絕。在此之前，Harness 會在此呼叫上暫停。',
      Approved: '此工具呼叫已被允許，由規則、部署預設值、人員或逾時決定。',
      Denied: '此工具呼叫已被拒絕。Harness 收到拒絕訊息，並在沒有此呼叫的情況下繼續。',
      Expired: '沒有人在核准到期前及時決定，因此套用了部署的逾時決定。',
      Cancelled: '核准仍在待處理時執行已停止，因此在沒有決定的情況下關閉。'
    },
    approvalDecision: {
      Allow: '允許：Harness 獲准進行此工具呼叫，執行會帶著它繼續。',
      Deny: '拒絕：Harness 的工具呼叫遭到拒絕，並被告知拒絕的原因。'
    },
    approvalSource: {
      DurableResume: "從上一個持久檢查點繼承的一次性人工核准，僅適用於相符的恢復後工具要求。",
      Rule: '由部署上的規則立即決定，不需等候。符合的規則會顯示在旁邊。',
      Default: '此工具呼叫沒有符合任何規則，因此由部署的預設動作決定。',
      User: '由人員在儀表板中、透過 API 或透過 MCP 決定。',
      Timeout: '在核准到期前沒有人做出決定，因此套用了部署的逾時決定。',
      Cancelled: '此核准仍在等候人員處理時，執行已停止，因此沒有做出決定。'
    },
    approvalRuleAction: {
      Allow: '允許：符合此規則的工具呼叫會直接進行，不會詢問任何人。',
      Deny: '拒絕：符合的工具呼叫會直接遭拒，不會詢問任何人。拒絕優先於其他所有規則。',
      Ask: '詢問人員：符合的工具呼叫會在核准收件匣中等候決定。'
    },
    approvalKind: {
      Tool: 'Claude Code 針對任何工具（包括 MCP 工具）提出的權限提示。',
      Command: 'Codex app-server 執行想要執行的 Shell 命令。規則會將它當作 Bash 評估。',
      FileChange: 'Codex app-server 執行想要進行的檔案變更。規則會將它當作 Edit 評估。'
    },
    runBlockedReason: {
      NoReadyWorker: '受阻：沒有任何工作節點處於就緒狀態，因此沒有節點能接手這個執行。請啟動或註冊工作節點，然後在機群頁面檢查遺失、離線、清空中或已封鎖的節點。',
      NoCapableWorker: '受阻：有就緒的工作節點，但沒有節點回報這個執行的 Harness 可用。請啟動或註冊已安裝該 Harness 的工作節點，或在機群頁面檢查它的憑證與探測結果。',
      NoMatchingPool: '受阻：有就緒的工作節點能執行這個 Harness，但沒有節點符合部署的節點池、節點池的租用戶限制或節點選取器。請檢查部署的排程放置，或在該節點池加入工作節點。'
    },
    runStatus: {
      Pending: '待處理：執行已被接受，正在準備中，尚未加入佇列。',
      Queued: '已排入佇列：等待具有相符 Harness 與排程放置條件的工作節點取得租約。',
      Leased: '已租用：某個工作節點已認領此執行，正在準備工作區。',
      Running: '執行中：Harness 程序正在工作節點上執行。',
      Cancelling: '取消中：已要求停止，工作節點正在關閉 Harness。',
      Succeeded: '成功：Harness 已完成並產生有效結果。',
      Failed: '失敗：執行以錯誤結束。結果欄會說明原因。',
      Cancelled: '已取消：有人在執行完成前將其停止。',
      TimedOut: '逾時：執行到達期限而被停止。',
      Rejected: '已拒絕：執行無法啟動，例如因為沒有啟用中的部署。'
    },
    runOutcome: {
      None: '執行尚未結束，因此還沒有結果。',
      Succeeded: 'Harness 已完成，且其結果通過驗證。',
      HarnessFailed: 'Harness 回報失敗，或在沒有可用結果的情況下結束。請檢查 stderr 與對話紀錄。',
      NotInstalled: '在工作節點上找不到 Harness 執行檔。',
      NotCredentialed: 'Harness 沒有可用的憑證。請將祕密繫結到部署。',
      McpPreflightFailed: '工作節點在啟動前檢查時，必要的 MCP 伺服器或工具無法連線。',
      NodeLost: '工作節點在持有此執行期間停止傳送心跳訊號。',
      OutputLimitExceeded: '執行產生的輸出過多：回答超過了部署的最大助理字元數（一種執行防護），或 Harness 寫出的內容超過了 Harness 設定檔允許的量。已保留到目前為止的輸出。',
      SchemaValidationFailed: '結果不符合代理程式的輸出 JSON Schema：經過一次修復嘗試後，或在 Harness 無法恢復工作階段時立即失敗。',
      TimedOut: '執行到達了期限。',
      Cancelled: '執行依要求被取消。',
      StaleLease: '工作節點在失去租約後才回報，因此其結果被忽略。',
      CompileFailed: '無法編譯部署，例如因為缺少範本變數。',
      WorkspaceFailed: '無法準備工作區，例如因為 Git 複製失敗。',
      Rejected: '請求在執行開始前就被拒絕。',
      InternalError: 'Garrison 發生內部錯誤。詳細資訊請參閱伺服器記錄。',
      NoCapableWorker: '這個執行在佇列中等待的時間超過叢集設定 Runtime.FailBlockedAfterSeconds 允許的時長，而且沒有就緒的工作節點能執行它，因此已失敗。',
      RepetitionDetected: '執行防護停止了執行，因為它的回答退化成反覆出現的同一段短文字，或只有空白和標點。已保留到目前為止的輸出。可以用部署的重複防護調整。',
      NoProgress: '執行防護停止了執行，因為超過部署的無進展逾時時間仍沒有文字、思考或工具活動。已保留到目前為止的輸出。',
      PodFailed: '執行 Pod 在 harness 之外失敗：無法排程、無法提取映像、記憶體不足、遭到驅逐，或未回報就結束。錯誤訊息會說明原因。',
      ConversationStateLost: '原本應恢復這一輪對話的節點已不再保存對話的目錄。Garrison 會將這樣的一輪重新排入佇列一次，以回退方式執行；只有無法這樣做時才會保留此結果。'
    },
    controlNodeStatus: {
      Starting: '啟動中：副本正在初始化，尚未處理流量。',
      Ready: '就緒：副本正在傳送心跳訊號，並處理 REST、MCP 與 A2A 要求。',
      Draining: '清空中：已開始關閉。就緒檢查回應 503，其串流與長輪詢正在結束。',
      Offline: '離線：副本已正常停止，或 30 秒沒有心跳訊號而被領導者標記。離線列會在 24 小時後移除。'
    },
    backplane: {
      Local: '本機：事件只留在此處理程序內。適合單一副本；其他副本看不到這些事件。',
      Polling: '資料庫輪詢：副本透過輪詢資料庫共用即時事件。適用於任何資料庫，會有短暫延遲。',
      PostgresNotify: 'PostgreSQL 通知：副本透過 PostgreSQL 的 LISTEN 與 NOTIFY 共用即時事件，延遲很小。'
    },
    nodeStatus: {
      Ready: '就緒：正在傳送心跳訊號並接受新的執行。',
      Draining: '清空中：正在完成目前的執行，不接受新的執行。',
      Cordoned: '已封鎖：不接受新的執行；目前的執行會正常繼續。',
      Lost: '遺失：錯過了心跳訊號。它的執行會重新排入佇列或標記為失敗。',
      Offline: '離線：已正常關閉，未持有任何執行。'
    },
    usageQuotaScope: {"Tenant": "租用戶. 租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "Agent": "代理程式. 租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "Deployment": "部署. 租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。"},
    harnessType: {
      ClaudeCode: 'Anthropic Claude Code CLI，以無介面模式執行並使用 stream-JSON 輸出。',
      Codex: 'OpenAI Codex CLI，以 exec 執行並使用 JSONL 輸出。',
      Mux: '使用 JSONL 輸出的 Mux CLI；可搭配本機與託管的模型端點。',
      GeminiCli: '使用 stream-JSON 輸出的 Google Gemini CLI。',
      Generic: '其他任何命令列代理程式，完全由 Harness 設定檔描述。'
    },
    agentKind: {
      Hosted: '託管：Garrison 透過此代理程式在工作節點上的部署自行執行它。',
      Remote: '遠端：代理程式在其他地方執行，Garrison 會將呼叫轉送到它的 A2A 或 MCP 端點。'
    },
    secretStatus: {
      Ok: '就 Garrison 所知，此憑證可以使用。設定新值後，祕密一定會回到此狀態。',
      NeedsReauthentication: 'OpenAI 已永久拒絕所儲存的 ChatGPT 登入，例如其更新權杖已經用過。使用此祕密的執行會一直失敗，直到你以新的登入取代它的值。'
    },
    secretKind: {
      AnthropicApiKey: 'Anthropic API 金鑰，由 Claude Code 設定檔以 ANTHROPIC_API_KEY 注入。',
      ClaudeCodeOAuthToken: 'Claude Code 訂閱權杖。在共用伺服器上使用前，請先確認供應商條款。',
      OpenAiApiKey: '供 Codex 或其他以 OpenAI 為後端之 Harness 使用的 OpenAI API 金鑰。',
      CodexAuthJson: 'Codex auth.json 檔案的內容，會寫入執行的 HOME 目錄。',
      GeminiApiKey: '供 Gemini CLI 使用的 Google Gemini API 金鑰。',
      GenericEnv: '任何要作為環境變數使用的值。',
      GenericFile: '任何要寫入檔案的值。',
      BearerToken: 'Bearer 權杖，通常用於 MCP 伺服器的 Authorization 標頭。',
      BasicAuth: '用於基本驗證的使用者名稱與密碼組合。',
      GitCredential: '為工作區複製私有 Git 儲存庫時使用的權杖或密碼。'
    },
    workspaceKind: {
      Empty: '每次執行都從一個新的空白目錄開始。',
      GitRepository: '每次執行都從 Git 儲存庫的全新複製開始。',
      Seeded: '每次執行都從範本中列出的檔案開始。',
      PersistentVolume: '每次執行都會將既有的 PersistentVolumeClaim 掛載為工作區，因此檔案會在多次執行之間保留。需要 Kubernetes Job 執行器。'
    },
    runExecutor: {
      Process: 'Harness 以 worker 子處理程序的形式在 worker 的容器中執行，擁有獨立的工作、home 與設定目錄。',
      KubernetesJob: 'Worker 為每次執行建立一個 Kubernetes Job：harness 在獨立的 Pod 中執行，沒有 Kubernetes 或 Garrison 憑證，根檔案系統唯讀，並受部署的資源上限限制。'
    },
    promptTemplateKind: {
      System: '系統提示：設定代理程式的常駐指示。',
      Task: '任務提示：將呼叫端的訊息包裝成 Harness 收到的內容。',
      Fragment: '可重複使用的片段，由其他範本以 {{> name}} 引入。',
      ToolDescription: '將代理程式描述為 MCP 工具或 A2A 技能的文字。',
      ConfigFile: '產生的設定檔內容，例如 MCP 設定。',
      Other: 'Harness 設定檔所轉譯的其他任何文字。'
    },
    mcpTransport: {
      Http: 'Garrison 與 Harness 透過 URL 以可串流 HTTP 連線到伺服器。',
      Stdio: 'Harness 以本機程序啟動伺服器，並透過 stdin 與 stdout 與它溝通。'
    },
    permissionType: {
      Permit: '允許：允許列出的操作。',
      Deny: '拒絕：封鎖列出的操作，即使其他權限允許也一樣。'
    },
    artifactStoreKind: {
      Database: '成品儲存在 Garrison 資料庫中。簡單，但最適合小型檔案。',
      Filesystem: '成品會寫入伺服器可存取的目錄。',
      S3: '成品會上傳到相容 S3 的儲存貯體。'
    },
    manifestApplyResult: {
      Created: '此文件建立了一筆新紀錄。',
      Updated: '此文件變更了一筆現有紀錄。',
      Unchanged: '紀錄已與此文件相符，因此沒有任何變更。',
      Failed: '此文件未通過驗證。清單中的任何內容都未寫入。',
      Validated: '試執行：此文件有效，將會被套用。'
    },
    auditEventType: {
      ApprovalDecided: '有人允許或拒絕了待處理的工具呼叫。紀錄中會列出工具、執行與原因。',
      AuthSuccess: '有人成功登入或驗證了請求。',
      AuthFailure: '登入或驗證嘗試失敗。重複失敗可能代表有人在猜測密碼。',
      SessionIssued: '已核發工作階段權杖。',
      SessionRevoked: '工作階段權杖已被撤銷，例如因為登出。',
      CredentialCreated: '已建立新的存取金鑰。',
      CredentialRotated: '存取金鑰的祕密已被替換。',
      CredentialUsed: '已使用存取金鑰進行驗證。',
      AuthorizationDenied: '請求因呼叫端缺少權限而被拒絕。',
      AuthorizationBypass: '請求透過略過規則（例如系統管理員）跳過了授權。',
      RoleChanged: '已建立、變更或刪除角色。',
      PermissionChanged: '已建立、變更或刪除權限。',
      AssignmentChanged: '已建立、變更或刪除角色指派。',
      ConfigurationChanged: '代理程式、部署、設定檔、範本或其他設定紀錄已變更。',
      SecretChanged: '祕密已建立、變更、輪替或刪除。',
      SettingsChanged: '伺服器設定已變更。',
      RestartRequested: '有人要求伺服器重新啟動。',
      ManifestApplied: '已將清單套用到租用戶。',
      NodeRegistered: '工作節點已向控制平面註冊。',
      NodeStatusChanged: '工作節點已被封鎖、清空、遺失或恢復。',
      RunCancelled: '執行已被使用者、存取金鑰或其上層執行取消。',
      ConversationDeleted: '有人刪除了一個對話。它的各輪作為一般執行保留。'
    },
    conversationFallbackReason: {
      AffinityNodeLost: '保存對話的節點已不再就緒（遺失、清空中、已隔離或已刪除），因此由另一個節點領取了這一輪。',
      AffinityWaitExpired: '保存對話的節點保持就緒，但沒有在 Runtime.ConversationAffinityWaitMs 內領取這一輪，因此由另一個節點領取。',
      WorkspaceLost: '節點領取了這一輪，但對話的工作區和主目錄已不在該節點上。',
      SessionMissing: '存在先前的輪次，但沒有一輪回報可恢復的 Harness 工作階段，例如它們都在早期失敗了。',
      HarnessChanged: '自記錄工作階段以來，部署的 Harness 設定檔已變更，新的設定檔無法恢復該工作階段。',
      ResumeUnsupported: '部署的 Harness 設定檔不支援恢復工作階段，因此後續每一輪都從紀錄開始。',
      ExecutorWithoutState: '這一輪以 Kubernetes Job 執行，每次都從空的主目錄開始，因此後續每一輪都從紀錄開始。'
    }
  },
  resources: {
    approvals: {
      createdUtc: 'Harness 提出詢問的時間。將游標停在值上可查看確切時間。',
      agentName: '其執行要求進行此工具呼叫的代理程式，可開啟查看其詳細資料。',
      toolName: 'Harness 想要使用的工具，例如 Bash、Edit、WebFetch 或 MCP 工具。',
      summary: '呼叫的單行摘要：命令、URL、路徑或查詢，祕密已遮蔽。',
      status: '決定前為「待處理」，之後為「已核准」、「已拒絕」、「已過期」（逾時）或「已取消」（執行已停止）。',
      decision: '決定後為「允許」或「拒絕」；核准仍在待處理時為空白。',
      decisionSource: '由什麼決定：規則、部署預設值、人員、逾時或已停止的執行。',
      decidedBy: '由人員決定時，顯示做出此決定的人員或存取金鑰；其他情況為空白。',
      expiresUtc: '待處理的核准會在何時逾時，屆時將套用部署設定的逾時決定。',
      kind: '工具呼叫（Claude Code）、命令或檔案變更（Codex app-server）。',
      harnessType: '提出詢問的 Harness：Claude Code 或 Codex。',
      runId: '提出詢問的執行。開啟它即可查看呼叫前後的對話紀錄。',
      rootRunId: '當提出詢問的執行是被委派的執行時，委派樹最上層的執行。',
      deploymentId: '以其規則評估此呼叫的部署。記住的規則會新增到此部署。',
      leaseEpoch: '提出詢問之執行嘗試的租約世代，確保決定絕不會送達之後的嘗試。',
      requestedUtc: 'Harness 要求權限的時間，將游標停在值上可查看確切時間。',
      decidedUtc: '做出允許或拒絕決定的時間，將游標停在值上可查看確切時間。',
      waitMs: '此工具呼叫從 Harness 提出要求到做出決定之間等候了多久。',
      timeoutDecision: '若在核准到期前沒有人決定會發生什麼，取自部署設定。',
      toolCallId: 'Harness 為此工具呼叫指定的 ID，用於在對話紀錄中找到對應的呼叫。',
      reason: '做出決定的人員所寫的備註（如果有的話），拒絕時也會傳給代理程式。',
      inputPreview: 'Harness 送出的工具輸入，以 JSON 呈現，祕密與類似 Token 的值都已遮蔽。',
      rulePattern: '當規則決定此呼叫或要求詢問人員時，符合此呼叫的部署規則。',
      ruleId: '符合此呼叫的部署規則 ID，可用來在部署的核准規則中找到它。',
      suggestedRule: '會符合此呼叫的規則。「記住為規則」會預先填入此規則。',
      rememberedRuleId: '以「記住為規則」決定此核准時，新增到部署的那條規則的 ID。',
      id: '核准識別碼（apr_...），供 API 與 MCP 工具使用。',
      actions: {
        allow: '允許此待處理的工具呼叫，可附上選填的原因，並可選擇記住為規則。',
        deny: '拒絕此待處理的工具呼叫，可附上選填的原因，並可選擇記住為規則。',
        openRun: '開啟提出詢問的執行，閱讀此工具呼叫前後的對話紀錄。'
      }
    },
    tenants: {
      add: '建立新的租用戶：一個彼此隔離的空間，擁有自己的使用者、代理程式、祕密與執行。',
      name: '租用戶的顯示名稱。使用者登入時是以租用戶 ID 選擇租用戶。',
      description: '此租用戶的服務對象或用途，例如某個團隊或客戶。',
      active: '停用的租用戶無法登入或執行代理程式。其資料會保留。'
    },
    users: {
      add: '建立以電子郵件與密碼登入的人員。之後再透過角色指派授予存取權。',
      email: '此人員登入時使用的電子郵件地址。在租用戶內必須唯一。',
      name: '名字與姓氏，顯示在稽核紀錄與清單中。',
      role: '帳戶的管理員層級。一般使用者透過角色指派取得存取權。',
      password: '登入密碼。編輯時留空即可保留目前的密碼。',
      firstName: '名字，顯示在清單與稽核紀錄中。',
      lastName: '姓氏，顯示在清單與稽核紀錄中。',
      isTenantAdmin: '租用戶管理員可以管理此租用戶內的一切，包括使用者與祕密。',
      isAdmin: '系統管理員可管理所有租用戶並略過授權檢查。請謹慎授予。',
      active: '停用的使用者無法登入，且其存取金鑰會停止運作。',
      actions: { permissions: '顯示此使用者在合併所有角色與指派後最終擁有的每一項權限。' }
    },
    credentials: {
      add: '為指令碼、SDK 或服務建立存取金鑰。儲存後會顯示一次祕密金鑰。',
      name: '此金鑰的用途，例如 ci-pipeline。方便你在輪替或刪除前找到它。',
      accessKey: '金鑰的公開部分，隨每個請求傳送。可以安全地存放在設定中。',
      secretKeyLast4: '祕密金鑰的最後四個字元，讓你不必查看即可比對金鑰。',
      userId: '擁有此金鑰的使用者。金鑰能做的事永遠不會超過其擁有者。',
      lastUsedUtc: '金鑰最後一次驗證請求的時間。日期很舊表示金鑰未被使用，可以刪除。',
      authMode: '金鑰的驗證方式：直接傳送、每個請求簽署、交換為工作階段，或以上任一方式（Hybrid）。',
      expiresUtc: '超過此時間後金鑰將停止運作。留空表示金鑰永不過期。',
      active: '停用的金鑰會被拒絕但仍會保留，因此你可以重新啟用。',
      actions: {
        rotate: '以新的祕密金鑰取代舊的。舊祕密金鑰會立即失效；新的只會顯示一次。',
        permissions: '顯示此金鑰在合併其擁有者、角色與指派後最終擁有的每一項權限。'
      }
    },
    roles: {
      add: '建立自訂角色，然後為它新增權限，並將它指派給使用者或金鑰。',
      name: '指派角色時使用者看到的名稱，例如 Release Operator。',
      description: '此角色的用途，以及應該授予給誰。',
      active: '停用的角色不會授予任何權限，即使已被指派也一樣。',
      actions: { clone: '為此內建角色建立可編輯的複本，供你調整。' }
    },
    permissions: {
      add: '建立允許或拒絕對資源類型執行操作的規則。',
      name: '規則的簡短名稱，在你建立角色時顯示。',
      permissionType: '「允許」會允許下列操作。「拒絕」會封鎖這些操作，且永遠優先於允許。',
      resourceTypes: '此規則涵蓋的紀錄種類。All 涵蓋所有類型。',
      operationTypes: '此規則涵蓋的操作，例如 Read、Create 或 Execute（呼叫）。',
      active: '停用的權限不會產生任何作用。'
    },
    userAssignments: {
      add: '將角色授予使用者，範圍可以是整個租用戶或某一筆特定紀錄。',
      userId: '接收此角色的人員。',
      roleName: '授予的角色。此人員會獲得其中的每一項權限。',
      roleId: '要授予的角色。此人員會獲得其中的每一項權限。',
      resourceScope: '「租用戶」會將角色套用到每一筆紀錄。「資源」則限制在下方指定的那一筆紀錄。',
      resourceId: '角色所套用之單一紀錄的識別碼，例如代理程式 ID。',
      inheritsToChildren: '將角色套用到租用戶中的每一筆紀錄，包括之後建立的紀錄。',
      active: '停用的指派不會授予任何權限，但會保留。'
    },
    credentialAssignments: {
      add: '將角色授予存取金鑰，範圍可以是整個租用戶或某一筆特定紀錄。',
      credentialId: '接收此角色的存取金鑰。它的權限仍然不能超過其擁有者。',
      roleName: '授予此金鑰的角色。',
      roleId: '要授予的角色。請挑選能讓自動化完成工作的最小權限角色。',
      resourceScope: '「租用戶」會將角色套用到每一筆紀錄。「資源」則限制在下方指定的那一筆紀錄。',
      resourceId: '角色所套用之單一紀錄的識別碼，例如 CI 工作可以呼叫的那一個代理程式。',
      inheritsToChildren: '將角色套用到租用戶中的每一筆紀錄，包括之後建立的紀錄。',
      active: '停用的指派不會授予任何權限，但會保留。'
    },
    harnessProfiles: {
      add: '描述以無介面模式啟動 CLI 代理程式的新方式。通常複製內建設定檔會比較容易。',
      name: '設定檔名稱。部署以此名稱選擇設定檔。builtin/ 前置字串為保留字。',
      harnessType: '此設定檔啟動哪一種 Harness。工作節點會公告它們能執行的類型，並據此決定排程放置。',
      executable: '要在工作節點上執行的命令，可在 PATH 中找到或以絕對路徑提供，例如 claude。',
      outputParser: 'Harness 的輸出如何轉換為對話紀錄事件與最終結果。',
      description: '此設定檔的特別之處，例如它加入了哪些旗標。',
      probeArguments: '用於版本檢查且不消耗 Token 的引數，例如 --version。工作節點會在啟動時執行它。',
      active: '停用的設定檔無法供新的執行使用。',
      arguments: '有順序的命令列引數。每個引數都是範本，可依條件略過，也可針對清單重複產生。',
      argumentsItems: {
        template: '單一引數的文字，例如 --model 或 {{deployment.model}}。',
        condition: '範本運算式；轉譯結果為空或 false 時，會略過此引數。',
        repeatOver: '清單變數的名稱；清單中每個元素都會產生一次此引數。'
      },
      promptDelivery: '任務提示如何傳給 Harness：透過標準輸入、作為引數，或寫入檔案。',
      promptArgumentTemplate: '提示不是透過標準輸入傳送時所使用的引數或檔案名稱。',
      systemPromptDelivery: '系統提示如何傳給 Harness：檔案、引數、環境變數、附加在任務前面，或完全不傳送。',
      systemPromptTarget: '承載系統提示的旗標、變數或檔案名稱。',
      mcpConfigFormat: '此 Harness 讀取的 MCP 設定格式。Garrison 會以此格式寫入執行所繫結的 MCP 伺服器。',
      mcpConfigFileName: '產生的 MCP 設定檔名稱，位於執行設定目錄內。',
      environment: '程序的環境變數。值為範本；{{secret.alias}} 會帶入已繫結的祕密。',
      environmentItems: {
        name: '變數名稱，例如 ANTHROPIC_API_KEY。',
        valueTemplate: '值的範本。憑證請使用 {{secret.alias}}。',
        condition: '範本運算式；轉譯結果為空或 false 時，不會設定此變數。',
        isSecret: '將此值視為祕密：永遠不會寫入記錄，並在預覽中被遮蔽。'
      },
      files: '啟動前寫入的檔案，例如設定檔或 auth.json。',
      filesItems: FILE_ITEMS,
      credentialEnvironmentAllowlist: '此 Harness 可從祕密填入的環境變數名稱。其他任何名稱都會被拒絕。',
      genericTextField: '每一行輸出中助理文字的 JSON 路徑，供 Generic JSONL 剖析器使用。',
      genericFinalField: '最終結果文字的 JSON 路徑，供 Generic JSONL 剖析器使用。',
      genericSuccessField: '表示執行是否成功的 JSON 路徑，供 Generic JSONL 剖析器使用。',
      genericSuccessValue: '成功路徑上代表執行成功的值，例如 true。',
      resultSource: '最終答案的來源：剖析器的最終事件、最後訊息檔案，或全部的標準輸出。',
      resultFileName: '當結果來源為檔案時，Harness 寫入最後訊息的檔案名稱。',
      successPolicy: '如何判定成功：依最終剖析器事件、依結束代碼，或兩者皆需。',
      successExitCodes: '當判定方式使用結束代碼時，視為成功的結束代碼。每行一個。',
      defaultTimeoutSeconds: '部署未設定時的執行期限（秒）。介於 5 到 86400 之間。',
      killGraceSeconds: '從要求程序停止到強制終止其程序樹之間的秒數。介於 0 到 60 之間。',
      maxOutputBytes: '一次執行最多可產生的標準輸出量，超過時會以「超出輸出上限」失敗。',
      stderrTailBytes: '要保留多少標準錯誤的結尾內容，供執行詳細資料頁面顯示。',
      isolateHome: '為每次執行提供專屬的 HOME 目錄，讓 Harness 設定與快取永遠不會在執行之間外洩。',
      supportsResume: '此 Harness 是否能繼續先前的工作階段。供對話功能使用。',
      steps: {
        basics: '名稱、Harness 類型、執行檔與版本探測。',
        invocation: '引數、提示傳遞方式、MCP 設定、環境變數與檔案。',
        output: '輸出如何剖析，以及如何判定成功。',
        limits: '逾時、輸出上限與 HOME 隔離。'
      },
      actions: { clone: '在你的租用戶中建立此設定檔的可編輯複本，名稱會加上 -custom 後綴。' }
    },
    promptTemplates: {
      actions: { clone: '以你選擇的新名稱複製此範本，然後在編輯器中開啟副本。' },
      add: '在具備即時預覽的編輯器中撰寫新的提示範本。每次儲存都會成為一個版本。',
      name: '範本名稱，在租用戶內不可重複。部署以 ID 繫結範本，所以重新命名不影響繫結；引入時則以名稱參照。',
      kind: '範本的用途：系統提示、任務包裝、片段、工具描述或設定檔。',
      currentVersion: '最新儲存的版本。部署可以固定某個版本，或跟隨最新版本。',
      description: '此範本的作用以及使用位置。'
    },
    mcpServers: {
      add: '註冊 MCP 伺服器，讓部署可以繫結它，其代理程式也能使用它的工具。',
      name: '伺服器名稱。部署以此名稱繫結它，並為它指定別名。',
      transport: 'HTTP 伺服器透過 URL 連線；stdio 伺服器則由 Harness 以本機程序啟動。',
      endpoint: '連線到伺服器的位置：它的 URL 與路徑，或 stdio 伺服器的命令。',
      required: '開啟時，若此伺服器或其必要工具無法連線，執行會在啟動前失敗。',
      description: '此伺服器提供哪些工具，以及哪些代理程式應該使用它。',
      url: '工作節點可連線之伺服器的基底 URL，不含 MCP 路徑。',
      path: '該伺服器上 MCP 端點的路徑，通常為 /mcp。',
      headers: '傳送給伺服器的 HTTP 標頭，例如 Authorization。值可以使用 {{secret.alias}}。',
      headersItems: {
        name: '標頭名稱，例如 Authorization。',
        valueTemplate: '標頭值範本，例如 Bearer {{secret.github}}。'
      },
      command: '在工作節點上啟動 stdio 伺服器的執行檔。',
      arguments: 'stdio 伺服器命令的引數，每行一個。',
      environment: 'stdio 伺服器程序的環境變數。值可以使用 {{secret.alias}}。',
      environmentItems: {
        name: '伺服器程序的變數名稱。',
        valueTemplate: '值範本。憑證請使用 {{secret.alias}}。'
      },
      requiredTools: '此伺服器上必須存在的工具。工作節點會在啟動前檢查，若缺少任何一個，執行即失敗。',
      toolTimeoutSeconds: '單一工具呼叫在 Harness 放棄之前可以花費的時間。',
      active: '停用的伺服器不會納入新的執行，即使部署已繫結它也一樣。',
      actions: { test: '立即連線到伺服器並列出其工具，以檢查位址與憑證。' }
    },
    secrets: {
      status: '所儲存的憑證是否仍然可用。當 Codex 登入無法再更新時，Garrison 會將其標示為需要重新驗證。',
      accessTokenExpiresUtc: '所儲存 Codex ChatGPT 登入中的存取權杖何時到期。Garrison 會在此之前更新它，並把新權杖寫回祕密。',
      refreshedUtc: 'Garrison 上次自行更新此 Codex 登入的時間。執行只會收到不含更新權杖的副本。',
      statusMessage: '提供者回報的登入無法使用原因。',
      statusUtc: 'Garrison 發現該登入無法再更新的時間。',
      add: '儲存新的憑證，例如 API 金鑰或權杖，並在靜態時加密。部署以別名參照它；儲存後值將不會再次顯示。',
      name: '祕密名稱。部署以此名稱選擇祕密，並為它指定別名。',
      kind: '這是哪一種憑證。內建設定檔會依種類判斷要填入哪個變數或檔案。',
      valueLast4: '所儲存值的最後四個字元，讓你不必揭露即可分辨不同祕密。',
      rotatedUtc: '值最後一次設定或輪替的時間。',
      expiresUtc: '僅供參考的到期時間。請在此日期之前輪替值。',
      description: '值的來源，以及哪些代理程式需要它。',
      value: '祕密的值。儲存時會加密，之後永遠無法讀回，只能取代。',
      newValue: '取代用的值。儲存後編譯的每個執行都會使用它。',
      active: '停用的祕密不會注入到執行中。',
      saveValue: '加密並儲存新值。舊值會被捨棄且無法復原。',
      actions: {
        setValue: '以你輸入的新值取代已儲存的值。舊值無法復原。',
        rotate: '換上新值並記錄輪替時間，例如在供應商核發新金鑰之後。'
      }
    },
    workspaces: {
      add: '定義如何準備執行的工作目錄：空白、從 Git 複製，或預先放入檔案。',
      name: '範本名稱。部署以此名稱選擇工作區範本。',
      kind: '「空白」從空無一物開始，「Git 儲存庫」會複製儲存庫，「預置檔案」會寫入下方列出的檔案。',
      gitUrl: '每次執行要複製的儲存庫。私有儲存庫需要 Git 憑證祕密。',
      retention: '執行結束後目錄如何處理：刪除、保留，或只在執行失敗時保留。',
      description: '工作區包含哪些內容，以及哪些代理程式使用它。',
      gitRef: '要簽出的分支、標籤或提交。留空則使用預設分支。',
      gitDepth: '要擷取多少個提交。1 最快；0 會擷取完整歷史。',
      gitCredentialSecretId: '存放用來複製私有儲存庫之權杖或密碼的祕密。',
      persistentVolumeClaim: '掛載到工作區路徑的 PersistentVolumeClaim 名稱。它必須已存在於執行命名空間中；Garrison 從不建立或刪除它。',
      files: '執行開始前寫入工作區的檔案。',
      filesItems: {
        path: '檔案相對於工作區根目錄的路徑。',
        content: '檔案的文字內容。'
      },
      active: '停用的範本無法供新的執行使用。'
    },
    modelPrices: {"add": "為執行器和實際使用的精確模型名稱新增價格。不預設供應商費率。", "name": "此租戶內該價格設定項目的唯一名稱。", "description": "操作員關於費率來源和生效日期的說明。", "active": "不使用停用的價格。編輯或刪除價格不會改變已儲存的執行費用。", "model": "請輸入1至256個字元且不含控制字元的精確模型名稱。", "harnessType": "這些費率對應的權杖計數方式和精確模型名稱所屬的執行器。", "inputUsdPerMillion": "輸入美元 / 百萬權杖. 請輸入0至1,000,000,000之間的有限費率。零為有效值。", "outputUsdPerMillion": "輸出美元 / 百萬權杖. 請輸入0至1,000,000,000之間的有限費率。零為有效值。", "cachedInputUsdPerMillion": "留空時使用對應的輸入或輸出費率。零表示免費。", "reasoningUsdPerMillion": "留空時使用對應的輸入或輸出費率。零表示免費。", "inputIncludesCachedTokens": "當輸入計數包含快取權杖時啟用。Claude Code單獨報告快取讀取，應停用此項。", "outputIncludesReasoningTokens": "當輸出計數包含推理權杖時啟用。先扣除已包含的子計數，再套用單獨費率。"},
    usageQuotas: {"add": "為租戶、代理或部署新增配額。留空的限制表示無限制。", "name": "名稱. 租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "description": "描述. 租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "active": "啟用. 租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "scope": "租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "resourceId": "為租戶、代理或部署新增配額。留空的限制表示無限制。", "dailyRunLimit": "每UTC日執行數. 留空表示無限制，零表示禁止使用。每日計數在UTC午夜重設；並行計數為目前活躍執行數。", "dailyTokenLimit": "每UTC日權杖數. 留空表示無限制，零表示禁止使用。每日計數在UTC午夜重設；並行計數為目前活躍執行數。", "dailyCostUsdLimit": "每UTC日已知美元. 留空表示無限制，零表示禁止使用。每日計數在UTC午夜重設；並行計數為目前活躍執行數。", "maxConcurrentRuns": "最大活躍執行數. 留空表示無限制，零表示禁止使用。每日計數在UTC午夜重設；並行計數為目前活躍執行數。", "actions": {"usage": "每日使用量. 每UTC日執行數. 留空表示無限制，零表示禁止使用。每日計數在UTC午夜重設；並行計數為目前活躍執行數。"}, "usage": {"windowStartUtc": "視窗開始 (UTC). 租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "windowEndUtc": "每日重設 (UTC). 租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "runsUsed": "已接收執行. 租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "tokensUsed": "已完成權杖數. 租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "costUsd": "已知費用 (USD). 租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "unknownCostRuns": "缺少費用的執行. 租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "activeRuns": "活躍執行. 租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。"}, "enforcementEnabled": "預設關閉。明確啟用後才會在達到限制時拒絕執行，並降低支援的執行器預算。關閉時僅記錄使用量，不影響執行。"},
    artifactStores: {
      add: '為執行產生的檔案建立目的地，讓它們在執行的工作區消失後仍然保留。',
      name: '存放區名稱。部署以此名稱選擇成品存放區。',
      kind: '檔案存放的位置：Garrison 資料庫、檔案系統目錄或 S3 儲存貯體。',
      description: '這裡存放什麼，以及應保留多久。',
      active: '停用的存放區不會接收新的成品。'
    },
    agents: {
      add: '建立新的代理程式身分。在你為它新增至少一個部署之前，它不會做任何事。',
      name: '呼叫端透過 REST、MCP 與 A2A 呼叫代理程式時使用的 DNS 安全名稱。只能使用小寫字母、數字與連字號。',
      displayName: '顯示在主控台與 A2A 代理程式卡片中的易記名稱。',
      kind: '託管代理程式透過部署在這裡執行。遠端代理程式在其他地方執行，並透過其端點呼叫。',
      exposure: '哪些協定會公告此代理程式：A2A 會為它提供代理程式卡片；MCP 會讓它成為 MCP 用戶端的工具。',
      delegationMode: '此代理程式的執行可以呼叫哪些其他代理程式：「不委派」、「允許清單」或「任何代理程式」。',
      tags: '用來尋找與分組代理程式的標記。它們不會影響代理程式的執行方式。',
      description: '以淺白文字說明代理程式的功能。它會顯示給呼叫端並出現在 A2A 卡片中，所以請以他們為對象撰寫。',
      agentVersion: 'A2A 卡片中公告的版本字串。代理程式的行為改變時請更新它。',
      remoteProtocol: 'Garrison 如何呼叫遠端代理程式：A2A 或 MCP。',
      remoteEndpointUrl: '遠端代理程式的 A2A 或 MCP 端點位址。',
      exposeA2A: '發布 A2A 代理程式卡片，讓其他 A2A 代理程式可以探索並呼叫此代理程式。',
      exposeMcpTool: '在 Garrison 的 MCP 伺服器上將此代理程式提供為獨立工具，讓 MCP 用戶端可以直接呼叫它。',
      mcpToolName: 'MCP 用戶端看到的工具名稱。留空則使用代理程式名稱。',
      skills: '列在代理程式卡片中的 A2A 技能。它們描述呼叫端可以要求什麼。',
      skillsItems: {
        skillId: '技能在 A2A 卡片中的穩定識別碼。',
        name: '顯示給 A2A 呼叫端的簡短技能名稱。',
        description: '技能的功能說明，以呼叫端代理程式為對象撰寫。'
      },
      inputMode: 'Text 接受純文字訊息。Structured 要求輸入符合輸入 JSON Schema。',
      inputSchemaJson: "代理程式輸入的 JSON 結構描述。設定後，每次呼叫的輸入都必須是符合它的 JSON 文件，呼叫頁面會顯示依此產生的表單。",
      outputSchemaJson: '結果必須符合的 JSON Schema。Garrison 會驗證輸出，若不符合，會以修復提示重試一次。',
      delegationAllowList: '委派使用允許清單時，此代理程式可以呼叫的代理程式。',
      delegationMaxDepth: '此代理程式之下可以接續多少層代理程式之間的呼叫。介於 0 到 10 之間。',
      delegationAllowRecursion: '允許同一個代理程式在一條呼叫鏈中出現兩次。關閉可防止迴圈。',
      active: '停用的代理程式無法被呼叫。',
      sections: {
        identity: '代理程式是誰：它的名稱、描述、種類與版本。',
        exposure: '哪些協定會公告此代理程式，以及它列出哪些技能。',
        io: '代理程式接受什麼輸入，以及必須傳回什麼輸出。',
        delegation: '此代理程式是否可以呼叫其他代理程式，以及可以呼叫多深。'
      }
    },
    deployments: {
      approvalsEnabled: '讓 Harness 在工具呼叫前先詢問。下方規則會決定大部分呼叫；其餘的會在核准收件匣中等候人員處理。僅適用於 Claude Code 與 Codex app-server 設定檔。',
      approvalDefaultAction: '沒有規則符合某個工具呼叫時會發生什麼：允許、拒絕或詢問人員。',
      approvalTimeoutSeconds: '呼叫等候人員處理多久後套用逾時決定，範圍為 10 至 3,600 秒。',
      approvalTimeoutDecision: '沒有人及時回應時套用的決定。「拒絕」是安全的選擇。',
      approvalRules: '使用 Claude Code 語法的有序規則。「拒絕」優先於「詢問」，「詢問」優先於「允許」；同一動作中會回報第一個符合的規則。',
      approvalRulesItems: {
        action: '符合此規則的工具呼叫會得到什麼結果：允許、拒絕或詢問人員。',
        pattern: 'Claude Code 規則，例如 Bash(npm test)、Bash(npm run *)、Edit(src/**)、Read、WebFetch(domain:example.com) 或 mcp__github__*。',
        inputPattern: '選用的 .NET 規則運算式，工具輸入 JSON 也必須符合，可提供比模式更精細的控制。',
        description: '說明此規則存在的原因，提供給日後維護此規則的人員參考。'
      },
      approvalTest: '以部署已儲存的規則試驗一個工具呼叫，查看它會被允許、拒絕，還是交由人員決定。',
      add: '建立部署：代理程式的具體執行方式，包含 Harness 設定檔、模型、提示與資源。',
      name: '部署名稱，在租用戶內唯一，例如 reviewer-claude。',
      agentId: '此部署所執行的代理程式。呼叫該代理程式時可能會選中此部署。',
      harnessProfileId: '啟動 CLI 的 Harness 設定檔，例如 builtin/claude-code。',
      model: '傳給 Harness 的模型名稱，例如 sonnet 或 gpt-5。範本可透過 deployment.model 取用。',
      weight: '在代理程式各啟用部署之間的流量權重。權重 300 的部署收到的呼叫是權重 100 的三倍。',
      configVersion: '每次變更都會遞增。每個執行都會記錄它是從哪個版本編譯而來。',
      description: '此部署與該代理程式其他部署的差異，例如使用較便宜的模型。',
      active: '停用的部署不會收到加權流量，但呼叫端仍可明確指定它。',
      fallbackModel: '主要模型過載時改用的模型（若 Harness 支援）。',
      effort: '傳給支援此功能之 Harness 的推理強度提示，例如 low、medium 或 high。',
      maxTurns: '在 Harness 停止執行之前，一次執行最多可進行的代理程式回合數。',
      maxBudgetUsd: '每次執行的花費上限（美元），適用於會強制執行上限的 Harness。',
      parameters: '範本可透過 deployment.parameters.name 讀取的具名值。',
      parametersItems: {
        name: '參數名稱，以 deployment.parameters.name 參照。',
        value: '預設值。只有列在「呼叫端可設定的單次執行覆寫」中時，呼叫端才能覆寫它。'
      },
      promptBindings: '每個角色（System、Task、DelegatedTask 等）由哪個提示範本填入。',
      promptBindingsItems: {
        role: '此繫結所填入的提示角色，例如 System 或 Task。',
        templateId: '該角色使用的範本。',
        pinnedVersion: '要固定的版本。留空則一律使用最新版本。'
      },
      resourceBindings: '此部署使用的 MCP 伺服器與祕密，每一個都有供範本使用的別名。',
      resourceBindingsItems: {
        kind: '此繫結是 MCP 伺服器還是祕密。',
        alias: '範本使用的簡短名稱，例如 {{secret.anthropic}} 中的 anthropic。',
        resourceId: '要繫結的 MCP 伺服器或祕密。'
      },
      workspaceTemplateId: '每次執行的工作目錄如何準備。留空表示全新的空白目錄。',
      artifactStoreId: '執行完成後，其產生的檔案要上傳到哪裡。',
      argumentOverrides: '僅針對此部署變更 Harness 設定檔的引數：附加、前置、取代或移除。',
      argumentOverridesItems: {
        operation: '要執行的動作：附加、前置、取代相符的引數，或移除它。',
        match: '要取代或移除的現有引數。',
        template: '新的引數文字。可以使用範本。',
        condition: '範本運算式；轉譯結果為空或 false 時，會略過此覆寫。'
      },
      environmentOverrides: '僅針對此部署新增或取代的環境變數。',
      environmentOverridesItems: {
        name: '要新增或取代的變數名稱。',
        valueTemplate: '值範本。已繫結的祕密請使用 {{secret.alias}}。',
        isSecret: '將此值視為祕密：永遠不會寫入記錄，並在預覽中被遮蔽。'
      },
      fileOverrides: '僅針對此部署新增或取代的檔案。',
      fileOverridesItems: FILE_ITEMS,
      allowedRunOverrides: '呼叫端可以在每次執行時變更的參數，並會經過驗證。其他一切保持固定。',
      allowedRunOverridesItems: {
        name: '呼叫端可以在每次執行時設定的參數，例如 model 或 tone。',
        validation: '如何檢查呼叫端提供的值：不限、值清單、規則運算式，或數值範圍。',
        pattern: '以逗號分隔的允許值、規則運算式，或以 min,max 表示的數值範圍。'
      },
      nodePoolId: '只在此節點池中的節點上執行。留空表示允許任何符合條件的節點。',
      nodeSelector: '必須完全相符的節點標籤，例如 gpu=true。',
      nodeSelectorItems: {
        key: '節點必須具備的標籤名稱。',
        value: '節點必須具備的標籤值。'
      },
      maxConcurrentRuns: '此部署在所有節點上同時進行的執行數上限。0 表示不限制。',
      timeoutSeconds: '執行截止時間（秒）。留空則使用 Harness 設定檔的預設值。叢集設定 Runtime.MaxRunSeconds 會限制每個執行，包括每次執行的時間限制。',
      maxAttempts: '一次執行總共最多可以嘗試幾次。介於 1 到 10 之間。',
      steps: {
        approvals: 'Harness 可以進行哪些工具呼叫、不可以進行哪些，以及哪些要等候人員處理。',
        basics: '名稱、代理程式與流量權重。',
        harness: 'Harness 設定檔、模型、限制與參數。',
        prompts: '每個提示角色由哪個範本填入。',
        resources: 'MCP 伺服器、祕密、工作區與成品存放區。',
        overrides: '針對此部署對引數、環境變數與檔案的變更，以及呼叫端可以覆寫的項目。',
        placement: '執行可以在哪裡進行，以及同時可以進行多少個。'
      },
      actions: {
        compilePreview: '以範例訊息編譯此部署，查看執行會取得的確切命令列、檔案與環境變數。',
        test: '開啟「呼叫」頁面並預先選取此部署，以傳送真實訊息給它。'
      },
      repetitionGuard: '當回答退化成反覆出現的同一段短文字，或只有空白和標點時停止執行（結果為偵測到重複）。未設定時依照叢集預設值；勾選或取消勾選即可為此部署單獨設定。',
      maxAssistantChars: '一次執行在 Garrison 停止它之前最多可以寫出的助理文字字元數（結果為超出輸出上限）。0 表示不限制；留空則使用叢集預設值。',
      noProgressSeconds: '在沒有工具呼叫進行時，若這麼多秒內沒有文字、思考、工具呼叫或工具結果，就停止執行（結果為沒有進展）。0 表示關閉；留空則使用叢集預設值。',
      executor: '執行方式：處理程序（在 worker 內）或 Kubernetes Job（每次執行一個 Pod，隔離更強）。留空則依照節點集區的預設執行器，否則為處理程序。',
      podCpuRequest: '執行 Pod 請求的 CPU，例如 250m。留空則使用 worker 預設值。',
      podCpuLimit: '執行 Pod 最多可用的 CPU，例如 2。留空則使用 worker 預設值。',
      podMemoryRequest: '執行 Pod 請求的記憶體，例如 512Mi。留空則使用 worker 預設值。',
      podMemoryLimit: '執行 Pod 最多可用的記憶體，例如 4Gi。超過的執行會以「執行 Pod 失敗」結果停止。',
      podEphemeralStorageRequest: '執行 Pod 為工作區、home 與暫存檔案請求的本機磁碟，例如 1Gi。',
      podEphemeralStorageLimit: '執行 Pod 最多可用的本機磁碟，例如 10Gi。超過的 Pod 會遭到驅逐，執行即失敗。',
      useClusterDefault: '清除此部署自身的設定，讓重複防護重新依照叢集預設值。',
      sections: {
        guards: '執行防護會在任何 Harness 上及早停止失控的執行。留空的每一項都會依照設定（執行階段）中的叢集預設值。',
        execution: '選擇執行在哪裡進行；若為 Kubernetes Job 執行，還可設定 Pod 的 CPU、記憶體與磁碟。'
      }
    },
    nodePools: {
      add: '建立節點池以將節點分組，並可選擇保留給特定租用戶使用。',
      name: '節點池名稱。節點在註冊時加入節點池，部署可以要求使用某個節點池。',
      description: '此節點池代表的硬體或用途。',
      tenants: '允許使用此節點池的租用戶。留空表示所有租用戶。',
      defaultExecutor: '此集區中未自行選擇執行器的部署，其執行所用的執行器。留空表示處理程序。',
      active: '停用的節點池不接受新的執行。'
    },
    runs: {
      ...TELEMETRY,
      id: '執行識別碼。按一下該列即可開啟對話紀錄、結果與遙測資料。',
      agentName: '被呼叫的代理程式。一個執行一律屬於該代理程式的某一個部署。',
      status: '執行目前處於生命週期的哪個階段：已排入佇列、已租用、執行中，或某個已結束的狀態。',
      outcome: '執行結束的原因，比狀態更詳細，例如「缺少憑證」。',
      harnessType: '執行此工作的 Harness，取自部署的設定檔。',
      leaseNodeName: '執行此工作的工作節點。執行仍在佇列中時為空。',
      depth: '此執行位於代理程式之間呼叫的第幾層。0 表示由呼叫端直接啟動的執行。',
      createdUtc: '要求執行的時間。將滑鼠移到值上可查看確切時間。',
      actions: {
        cancel: '停止此執行。工作節點會終止 Harness 程序，執行將以「已取消」結束。',
        retry: '以相同的輸入與部署啟動新的執行。原本的執行會保留。'
      },
      conversationId: '此執行所屬的對話及其輪次。不屬於任何對話的執行此處為空。',
      conversationTurn: '此執行在對話中的位置，開始對話的那一輪為 1。'
    },
    nodes: {
      containerized: '工作節點是否在容器或 Pod 中執行，取自其註冊時的回報。容器化工作節點上的 Codex 執行預設使用 danger-full-access 沙箱，因為容器本身就是隔離邊界。',
      name: '節點名稱，通常是工作節點的 Kubernetes Pod 名稱。',
      status: '節點是否接受新的執行。維護前請先封鎖或清空節點。',
      capacity: '節點目前持有的執行數，相對於它同時可接受的上限。',
      harnesses: '節點在啟動時探測後發現已安裝且可正常運作的 Harness。',
      executors: '節點提供的執行器。只有當 worker 在叢集中執行且有權建立 Job 時，才會出現 Kubernetes Job。',
      labels: '節點公告的鍵值標籤。部署的節點選擇器會依這些標籤進行比對。',
      nodeVersion: '節點上工作節點軟體的版本。',
      lastHeartbeatUtc: '節點最後一次回報的時間。停止回報的節點會被標記為「遺失」。',
      address: '節點回報的位址，僅供參考。',
      maxConcurrentRuns: '此節點同時可接受的執行數上限。',
      childReserveSlots: '僅供父執行正在等待的委派執行使用的額外槽位：此節點上每有一個執行在等待子執行就開放一個，最多為此數量。',
      maxResidentWaiters: '此節點上可同時等待委派執行的最大執行數。0 表示等於其容量。超出時委派會以 DelegationCapacityExhausted 失敗。',
      activeRuns: '節點目前持有的執行。',
      capabilities: '每次 Harness 探測的結果：類型、偵測到的版本，以及是否可用。',
      labelsItems: { key: '標籤名稱，由部署的節點選擇器比對。', value: '標籤值，由部署的節點選擇器完全比對。' },
      capabilitiesItems: {
        harnessType: '探測檢查的 Harness。',
        detectedVersion: 'Harness 回報的版本字串。',
        available: 'Harness 是否可以在此節點上執行。',
        detail: '探測輸出，在 Harness 無法使用時很有幫助。'
      },
      actions: {
        grafana: '在新分頁中開啟 Grafana 的 Workers 儀表板，並篩選到節點 {{node}}。',
        cordon: '停止將新的執行傳送到此節點。已在其上的執行會正常完成。',
        uncordon: '讓此節點再次接受新的執行。',
        drain: '停止接受新的執行並讓目前的執行完成，之後節點會進入閒置。請在關閉節點前使用。',
        runs: '開啟「執行」清單，並篩選出此節點執行過的執行。'
      }
    },
    controlNodes: {
      name: '副本名稱：伺服器執行時使用的節點 ID（GARRISON_NODE_ID，在 Kubernetes 中為 Pod 名稱）。',
      status: '副本的生命週期：啟動中、就緒、清空中或離線。只有就緒的副本會處理流量。',
      version: '此副本執行的 Garrison 伺服器版本。只有在滾動更新期間才應出現不同版本。',
      schemaVersion: '副本啟動時找到的資料庫結構描述版本。所有副本都應回報相同的數字。',
      backplane: '此副本與其他副本共用即時事件（執行的串流、WebSocket 更新）的方式。',
      uptime: '副本處理程序已運作的時間，從啟動時間算起。將指標停在上面可查看確切的啟動時間。',
      lastHeartbeatUtc: '副本最後一次傳送心跳訊號的時間。副本每 5 秒傳送一次；超過 15 秒的會以心跳逾時醒目標示。',
      activeRequests: '副本在最後一次心跳訊號時正在處理的 HTTP 要求數。',
      openStreams: '副本在最後一次心跳訊號時開啟的伺服器傳送事件串流與 WebSocket 連線數。',
      heldLongPolls: '副本在最後一次心跳訊號時保留的工作節點租約長輪詢數。閒置的工作節點會在這裡等待新的執行。',
      address: '副本回報的 IP 位址與 REST 連接埠。',
      hostname: '副本所在機器或 Pod 的主機名稱。',
      startedUtc: '副本處理程序的啟動時間，以你的本地時區顯示。',
      id: '副本的節點 ID。它與 API 回應中的 respondingNodeId 以及指標中的 node 標籤一致。',
      isLeader: '此副本是否持有維護用的領導者租約。同一時間只有一個副本是領導者。',
      leaderEpoch: '領導者租約的隔離紀元（fencing epoch）。每當領導權轉移到另一個副本時都會增加。',
      respondingNodeId: '回應這次單筆讀取的副本。在負載平衡器後方，它可能與顯示的副本不同。',
      answeredBy: '回應此清單要求的控制節點（respondingNodeId）。在負載平衡器後方，每次重新整理都可能由不同的副本回應。',
      badges: {
        leader: '領導者：此副本持有維護租約。它負責依保留期清理、將沒有心跳訊號的副本標記為離線，以及其他叢集層級的維護。',
        leaderEpoch: '領導者：此副本持有維護租約（紀元 {{epoch}}）。它負責依保留期清理、將沒有心跳訊號的副本標記為離線，以及其他叢集層級的維護。',
        stale: '心跳逾時：超過 {{seconds}} 秒沒有心跳訊號，而副本應每 5 秒傳送一次。副本可能過載、網路中斷或已停止；領導者會在 30 秒後將其標記為離線。'
      },
      actions: {
        grafana: '在新分頁中開啟 Grafana 的 Garrison 概覽儀表板，並依控制節點 {{node}} 篩選。'
      }
    },
    audit: {
      createdUtc: '事件發生的時間，以你的本機時區顯示。',
      eventType: '這是哪一種安全性或設定事件。',
      principalName: '執行者：使用者、存取金鑰，或代表代理程式行動的執行。',
      resource: '涉及的紀錄種類與操作，例如 Agent / Read。',
      reason: '事件發生的原因，或存取被拒絕的原因。',
      sourceIp: '請求來源的網路位址。',
      principalType: '執行者是使用者、存取金鑰，還是執行權杖。',
      principalId: '採取行動之使用者、存取金鑰或執行的識別碼。',
      resourceType: '涉及的紀錄種類，例如 Agent 或 Secret。',
      resourceId: '涉及之紀錄的識別碼。',
      operation: '嘗試執行的操作，例如 Read 或 Execute。',
      method: '請求的 HTTP 方法。',
      path: '引發此事件之請求的路徑。',
      authResult: '確認呼叫端身分的結果。',
      authorizationResult: '確認呼叫端可以做什麼的結果。',
      bypassReason: '略過授權的原因，例如系統管理員。',
      statusCode: '傳回給呼叫端的 HTTP 狀態。',
      requestId: '請求識別碼。可用它在「請求歷程」或伺服器記錄中搜尋。'
    },
    manifestApplies: {
      createdUtc: '清單被套用或試執行的時間。',
      principalName: '套用此資訊清單的使用者或存取金鑰。',
      dryRun: '「是」表示只進行了驗證，沒有寫入任何內容。',
      counts: '各文件處理結果的數量：「已建立」、「已更新」、「未變更」或「失敗」的紀錄各有多少。'
    },
    conversations: {
      title: '第一則訊息的第一行，用作對話的名稱。按一下該列可開啟各輪。',
      agentName: '對話所針對的代理程式。每一輪都傳送給這個代理程式。',
      state: '有未完成的一輪時為「處理中」，在其結束前新的訊息會被拒絕。可以傳送下一則訊息時為「閒置」。',
      turnCount: '對話已進行的輪數（執行數），包括失敗的輪次。',
      affinityNodeName: '保存對話工作區和 Harness 工作階段的工作節點。下一輪會優先使用此節點，以便恢復工作階段。',
      fallbackCount: '無法恢復 Harness 工作階段、改以先前各輪紀錄開始全新工作階段的輪數。',
      lastFallbackReason: '最近一次回退的那一輪無法恢復工作階段的原因，例如親和節點未就緒。',
      harnessType: '執行每一輪的 Harness，來自第一輪的部署。',
      callerName: '誰發起了對話：使用者、存取金鑰或另一個代理程式的執行。',
      contextId: '對話透過 A2A 發起時用戶端提供的 A2A 情境 ID。透過 REST 或 MCP 發起的對話此處為空。',
      sessionId: '下一輪將恢復的 Harness 工作階段。在某一輪回報工作階段之前為空。',
      lastActivityUtc: '最近一輪傳送或結束的時間。將滑鼠停在值上可查看確切時間。',
      createdUtc: '第一輪開始此對話的時間。將滑鼠停在值上可查看確切時間。',
      id: '對話識別碼。呼叫代理程式時將其作為 conversationId 傳入，即可傳送下一輪。',
      fallbackLast: '以紀錄開始全新工作階段的輪數。最近一次的原因：{{reason}}。',
      states: {
        busy: '此對話的某一輪仍在排隊或執行中。請等待其結束或將其取消，再傳送下一則訊息。',
        idle: '沒有正在進行的一輪。下一則訊息會繼續這個對話。'
      },
      actions: {
        continue: '開啟「呼叫」並選取此對話，下一則訊息將作為它的下一輪傳送。',
        runs: '開啟依此對話各輪篩選的執行清單，可使用所有執行欄位和篩選條件。'
      }
    }
  },
  views: {
    approvalDetail: {
      openRun: '開啟提出詢問的執行，閱讀此工具呼叫前後的對話紀錄。',
      openAgent: '開啟此代理程式的頁面，查看它的部署與最近的執行紀錄。',
      openDeployment: '開啟已篩選為此部署的「部署」分頁，可在其中編輯它的核准規則。',
      backToInbox: '返回核准收件匣，在那裡可以看到每一個仍在待處理的核准。',
      viewJson: '以 JSON 顯示完整的核准紀錄，與 API 傳回的內容完全相同。',
      request: 'Harness 要求做什麼：單行摘要，以及已遮蔽祕密的完整工具輸入。',
      rules: '符合的部署規則、此呼叫建議的規則，以及從決定記住的規則。',
      copyRule: '將建議的規則複製到剪貼簿，例如貼到部署的核准規則中使用。'
    },
    home: {
      observabilityState: {
        reachable: '伺服器在最近 30 秒內透過內部 URL 連線到 {{service}}。',
        unreachable: '伺服器無法透過內部 URL 連線到 {{service}}。請確認該服務正在執行，且內部 URL 設定指向它。',
        checking: '正在詢問伺服器 {{service}} 是否可連線。',
        unknown: '伺服器沒有回報 {{service}} 是否可連線。狀態檢查失敗，或此伺服器尚不支援此檢查。'
      },
      observabilityVersion: '{{service}} 在伺服器健康檢查中回報的版本。',
      kpisGrafana: '在新分頁中開啟 Grafana 裡的 Garrison 總覽儀表板，查看這些數字隨時間的變化。',
      grafanaDashboards: 'Grafana 中的 Garrison 資料夾為每個區段提供一個儀表板。每個連結都會在新分頁中開啟對應的儀表板。',
      grafanaSections: {
        overview: '整體健康狀況：上線的副本和工作節點、執行與請求速率、錯誤、成本和近期問題。',
        http: '依路由劃分的 REST 流量：請求速率、延遲百分位數、錯誤、承載大小、驗證失敗和處理中的請求。',
        runs: '執行生命週期：依結果統計的建立和完成數量、各階段耗時、取消、結構化輸出驗證和修復。',
        agents: '各代理程式的效能：叫用次數、執行時間和排隊時間百分位數、第一個權杖時間、串流時間、結果和防護觸發。',
        models: '依模型和代理程式統計的權杖用量與成本：輸入、輸出、快取和推理權杖、成本以及輸出吞吐量。',
        workers: '工作節點：租約、每個節點的執行、完成報告、心跳、空閒槽位以及對控制平面的呼叫。',
        kubernetes: '每次執行一個 Pod 的執行器：建立和刪除的 Job、Pod 啟動延遲、依原因統計的 Pod 失敗以及孤立 Job 清理。',
        protocols: 'MCP、A2A 與串流：工具呼叫及耗時、工作階段、A2A 方法與工作狀態、SSE 串流、WebSocket 和委派。',
        scheduler: '排程：依代理程式和執行框架統計的佇列深度、認領結果與延遲、租約長輪詢、被封鎖的執行和過期租約。',
        database: '資料庫：依作業和資料表統計的陳述式延遲、錯誤、使用中的連線、寫入鎖等待和保留清理。',
        controlPlane: '控制平面副本：狀態、領導者變更、背板流量與延遲、心跳以及背景服務的反覆執行。',
        security: '依機制和原因統計的驗證失敗、授權拒絕、速率限制、核發的權杖、機密解密以及 Codex 權杖更新。',
        integrations: '依服務統計的對外呼叫：MCP 伺服器測試、可觀測性探測、MCP Proxy、Kubernetes API 以及工作節點對控制平面的呼叫。',
        logs: '依元件和租用戶統計的記錄量、錯誤與警告、近期錯誤行以及追蹤連結。'
      },
      observabilityDocs: '在新分頁開啟遙測指南：如何收集 Garrison 指標並連接 Grafana、Prometheus、Tempo 或 Loki。',
      observability: '連到此環境回報為已設定的指標、儀表板與追蹤工具。未設定的服務不會顯示。',
      kpis: {
        agents: '此租用戶中定義的代理程式。按一下即可開啟「代理程式」清單。',
        deployments: '所有代理程式的部署。每一個都是代理程式的一種執行方式。按一下即可開啟。',
        activeRuns: '目前在工作節點上已租用或正在執行的執行。按一下即可查看。',
        queued: '正在等待工作節點的執行。若數字持續增加，表示你需要更多節點或容量。',
        succeeded: '過去 24 小時內成功完成的執行。按一下即可列出。',
        failed: '過去 24 小時內失敗的執行。按一下即可列出並查看原因。',
        nodes: '已就緒可接收執行的工作節點數，相對於所有已註冊節點數。按一下即可管理。',
        controlNodes: '處於就緒狀態的控制平面副本數，以及已註冊副本的總數（離線列會在清單中保留 24 小時）。領導者是 {{leader}}。按一下可開啟機群 > 控制平面。',
        controlNodesNoLeader: '處於就緒狀態的控制平面副本數，以及已註冊副本的總數（離線列會在清單中保留 24 小時）。目前沒有副本持有領導者租約，因此叢集維護已暫停。按一下可開啟機群 > 控制平面。'
      },
      openFailure: '開啟此失敗的執行，閱讀其對話紀錄、錯誤與 stderr。',
      openControlPlane: '開啟機群 > 控制平面，查看每個副本的狀態、領導者、版本、心跳訊號與活動。',
      openWorkers: '開啟機群 > 工作節點，查看每個工作節點的容量、Harness 與心跳訊號，並可封鎖或清空它。',
      cta: {
        invoke: '直接從瀏覽器傳送訊息給任何代理程式。',
        addAgent: '前往「代理程式」以建立新的代理程式身分。',
        applyManifest: '以 YAML 套用設定，例如範例代理程式。',
        inspectRuns: '以篩選條件與遙測資料瀏覽所有執行。',
        nodes: '查看哪些工作節點已就緒，以及它們能執行什麼。',
        apiExplorer: '對此伺服器即時試用任何 API 呼叫。',
        analytics: '查看執行速度、Token、成本與結果隨時間的變化。'
      },
      services: {
        loki: '在新分頁開啟 Loki，搜尋 Garrison 記錄。',
        grafana: '在新分頁中開啟 Garrison 指標的 Grafana 儀表板。',
        prometheus: '在新分頁中開啟收集 Garrison 指標的 Prometheus 伺服器。',
        tempo: '在新分頁中開啟 Tempo 以瀏覽追蹤資料。'
      },
      serviceGeneric: '在新分頁中開啟此隨附的服務。'
    },
    runDetail: {
      openApproval: '開啟此核准的詳細資料頁面，查看完整的工具輸入、規則與決定。',
      reviewApprovals: '顯示此執行的核准，可在其中允許或拒絕待處理的工具呼叫。',
      approvalActions: '允許或拒絕待處理的工具呼叫，或開啟核准查看所有欄位。',
      viewTrace: '在新分頁中以 Grafana Explore (Tempo) 開啟此執行的追蹤。它顯示伺服器與工作節點上的編譯、領取與 Harness 區段。',
      viewLogs: '在新分頁中以 Grafana Explore (Loki) 開啟伺服器與工作節點上關於此執行的日誌行，範圍限於此執行的時間區間。',
      traceId: '編譯此執行時所在追蹤的 W3C 追蹤 ID。可在 Tempo 中搜尋，或使用「檢視追蹤」。在開始記錄追蹤 ID 之前建立的執行為空。',
      eventCode: '以你的語言顯示 Garrison 在此寫入的訊息類型。旁邊的文字是伺服器或工作節點發出的原始訊息。',
      openTemplate: '開啟範本 {{name}}。此執行使用第 {{version}} 版；「版本」分頁會顯示該內容及其與目前版本的差異。',
      templatesUsed: '編譯此執行時使用的提示範本確切版本。按一下其中一個可開啟該範本並比較版本。',
      live: 'Harness 產生事件時，事件會從伺服器即時串流過來。',
      viewJson: '以 JSON 顯示完整的執行紀錄，包含所有遙測欄位。',
      deployment: '此執行所選用的部署，依名稱或流量權重選出。',
      model: 'Harness 回報實際使用的模型，可能與部署所要求的模型不同。',
      tokens: '整個執行的輸入與輸出 Token。下方的遙測面板有完整的明細。',
      caller: '啟動此執行的人：使用者、存取金鑰，或其他代理程式的執行。',
      parent: '當代理程式呼叫另一個代理程式時，委派給此執行的那個執行。',
      openParent: '開啟委派此工作的上層執行。',
      attempt: '這是第幾次嘗試，相對於部署允許的最大嘗試次數。',
      outputSchema: '最終輸出是否符合代理程式的輸出 JSON Schema。若不符合且 Harness 可以恢復其工作階段，Garrison 會在同一工作階段中傳送一次修復提示。記錄中的警告事件會列出驗證錯誤。',
      created: '要求執行的時間。',
      started: 'Harness 程序在工作節點上啟動的時間。',
      completed: '執行到達最終狀態的時間。',
      exitCode: 'Harness 程序的結束代碼。成功與否通常依最終事件判定，而非此代碼。',
      tabs: {
        approvals: '此執行要求權限的工具呼叫、每個呼叫的決定方式，以及待處理項目的「允許」與「拒絕」。',
        transcript: 'Harness 產生的每個事件：助理文字、思考、工具呼叫與結果，以及用量。',
        result: '最終答案以及任何結構化輸出。',
        input: '呼叫端傳送的內容、參數，以及實際使用的提示範本版本。',
        stderr: 'Harness 標準錯誤的最後一部分，祕密已被清除。執行失敗時請查看這裡。',
        children: '此執行透過呼叫其他代理程式所啟動的執行。'
      },
      eventFilter: '只顯示某一類型的事件，例如工具呼叫或錯誤。',
      openChild: '開啟此子執行，它是在此執行呼叫另一個代理程式時啟動的。',
      eventCodes: {
        ApprovalRequested: 'Harness 在工具呼叫前提出詢問，此呼叫正在等候人員處理。請在「核准」分頁中決定。',
        ApprovalDecided: '權限要求已由規則、部署預設值、人員或逾時決定。文字會說明是哪一種。',
        RunGuardTriggered: '執行防護停止了此執行。訊息說明是哪一種防護觸發以及它偵測到什麼；執行以該防護的結果失敗結束，並保留部分輸出。',
        ConversationFallback: '這一輪無法恢復對話的 Harness 工作階段，因此以先前各輪的紀錄開始了全新工作階段。訊息中說明了原因。',
        ConversationStateLost: '節點領取了這一輪，但對話的目錄已不存在，因此這一輪被放回佇列，以回退方式執行。'
      },
      conversation: '此執行所屬的對話及其輪次。按一下可開啟該對話。',
      openConversation: '開啟對話，檢視所有輪次並傳送下一輪。',
      conversationSession: '這一輪是恢復了對話的 Harness 工作階段，還是根據紀錄開始了全新工作階段，以及原因。',
      resumeSessionId: '這一輪所恢復的 Harness 工作階段，由上一輪留下。',
      affinityNode: '保存對話目錄的節點。在所示時間之前，其他節點不會領取這一輪，除非該節點不再就緒。'
    },
    agentDetail: {
      name: '呼叫端用來呼叫此代理程式的名稱。',
      viewJson: '以 JSON 顯示完整的代理程式紀錄。',
      invoke: '開啟「呼叫」頁面並選取此代理程式。除非你自行選擇，否則會依權重挑選部署。',
      grafana: '在新分頁中開啟依此代理程式篩選的 Grafana 代理程式儀表板：叫用次數、執行時間百分位數、第一個權杖時間、串流時間、權杖、成本和防護觸發。',
      id: '用於 API 呼叫的代理程式識別碼。',
      tabs: {
        deployments: '此代理程式的各種執行方式，包含其權重以及各自分得的流量比例。',
        runs: '此代理程式最近的執行。',
        card: '其他代理程式用來探索此代理程式的 A2A 代理程式卡片。'
      },
      addDeployment: '前往「部署」為此代理程式建立部署。沒有部署就無法執行。',
      manageDeployments: '開啟「部署」分頁以編輯權重、模型與繫結。',
      openRun: '開啟此執行的對話紀錄與遙測資料。',
      columns: {
        name: '部署名稱。呼叫端可以明確指定它，以略過加權選擇。',
        harness: '為此部署啟動 CLI 的 Harness 設定檔。',
        model: '此部署要求 Harness 使用的模型。',
        weight: '部署上設定的原始流量權重。',
        traffic: '此部署收到的呼叫比例：其權重除以所有啟用部署的權重總和。',
        active: '只有啟用的部署會收到加權流量。'
      },
      conversations: '開啟依此代理程式篩選的對話清單。'
    },
    queue: {
      queued: '正在等待節點的執行。按一下即可列出。',
      leased: '已被節點認領但尚未開始的執行。按一下即可列出。',
      running: '目前正在執行的執行。按一下即可列出。',
      agent: '這些等待中的工作所屬的代理程式。',
      harness: '這些執行需要的 Harness。只有公告支援它的節點才能接手。'
    },
    invoke: {
      stream: {
        tabs: {
          preview: '在回答串流時即時查看，以 Markdown 格式顯示，並包含推理過程和工具呼叫。執行進行中時預設選取。',
          response: '執行的最終結果：結果文字（格式化或原始）、結構化輸出、結果、錯誤、遙測資料和連結。'
        },
        live: '執行正在進行。輸出透過即時事件串流抵達時，此檢視會隨之更新。',
        finished: '執行已結束，不會再有輸出。最終結果在「回應」分頁中。',
        elapsed: '自你按下「傳送」以來的時間，在瀏覽器中測量。執行結束時停止計時。',
        firstToken: '從「傳送」到首個串流輸出（文字或推理）的時間，在瀏覽器中測量，因此包含排隊和 Harness 啟動時間。執行頁面會顯示工作節點測量的值。',
        tokensPerSecond: '串流期間每秒的輸出 Token 數，依 Harness 回報的用量計算。執行結束後顯示伺服器測量的速率。',
        codexNote: 'Codex 只在每則訊息完整後才輸出（codex exec --json），因此不會逐個 Token 串流。它工作期間經過時間會持續計時。',
        showResponse: '切換到「回應」分頁，查看最終結果、結構化輸出和遙測資料。',
        reasoning: '模型在回答之前或之間產生的思考文字。預設收合，按一下即可展開。',
        jump: '捲動到最新輸出，並在新輸出抵達時繼續跟隨。',
        tool: {
          running: '代理程式呼叫了工具 {{name}}，正在等待其結果。',
          ok: '工具 {{name}} 已傳回結果，沒有錯誤。',
          failed: '工具 {{name}} 傳回了錯誤。代理程式可能會重試，或在沒有它的情況下繼續。'
        }
      },
      applySample: '前往「清單」，範例清單會建立一個可以立即試用的代理程式。',
      agent: '要呼叫的代理程式。只會列出啟用中的代理程式。',
      deployment: '保持「任何啟用中的部署（依權重）」可讓 Garrison 依流量權重挑選，或選擇某個部署以直接測試它。',
      parameter: '{{name}} 的單次執行值。此部署允許呼叫端覆寫它；留空則使用預設值。',
      message: '你希望代理程式做的事。它會作為執行輸入傳送，並由任務範本包裝。',
      send: '以此訊息啟動執行，並在這裡串流顯示其對話紀錄。',
      openRun: '開啟完整的執行頁面，包含結果、遙測資料與 stderr。',
      stopOnLeave: '開啟後，當你離開此頁面、關閉分頁或傳送新訊息時，Garrison 會取消進行中的執行，避免為沒人閱讀的輸出付費。關閉後執行會繼續，並保留在執行頁面上。此選擇會儲存在這個瀏覽器中。',
      cancel: '立即停止此執行。工作節點會在幾秒內結束 Harness 程序，並保留到目前為止的輸出。',
      cancelling: '已要求取消。工作節點正在停止 Harness；執行回報已取消後，這裡會顯示最終狀態。',
      sendReplaces: '先取消進行中的執行，再用這則訊息開始新的執行。若要讓目前的執行繼續，請關閉「離開時停止執行」。',
      sendKeeps: '用這則訊息開始新的執行。由於「離開時停止執行」已關閉，進行中的執行會繼續；可在執行頁面找到它。',
      timeLimit: '此執行的選用截止時間（秒），此部署允許呼叫端設定。留空則使用部署預設值。超過限制時執行會逾時。',
      timePreset: '將此執行的時間限制設為 {{value}}。',
      timePresetClear: '清除時間限制，讓執行使用部署預設值。',
      conversation: {
        mode: '執行一次；開始一個新對話，其後續各輪會恢復此 Harness 工作階段；或傳送現有對話的下一輪。',
        pick: '要繼續的對話。只列出此代理程式的對話，最新的排在前面。',
        deploymentPinned: '對話一律使用第一輪的部署，因此繼續對話時部署是固定的。',
        open: '開啟此執行所屬的對話，檢視所有輪次並傳送下一輪。'
      }
    },
    manifests: {
      warnings: '此文件中已被接受但儲存結果不同的值，例如超出範圍而被限制的數字。列下方的清單列出每個欄位。',
      planned: '套用此文件會執行的動作：建立記錄、更新記錄或保持不變。試執行只做驗證，不會變更任何內容。',
      changes: { after: '清單要設定的值。過長的值會在 200 個字元處截斷。', before: '目前儲存的值。過長的值會在 200 個字元處截斷。', field: '清單要變更的此記錄設定，例如 model 或 parameters.model。' },
      results: '套用作業對清單中每份文件所做的處理。',
      kind: '文件所描述的紀錄種類，例如 Agent 或 Deployment。',
      name: '文件 metadata 中的紀錄名稱。',
      result: '文件是建立、更新紀錄、維持紀錄不變，還是失敗。',
      message: '伺服器提供的詳細資訊，例如驗證錯誤。',
      tabs: {
        apply: '貼上或上傳清單，以試執行驗證，然後套用。',
        export: '將此租用戶的設定下載為清單。永遠不會包含祕密的值。',
        history: '過去每一次的套用與試執行，以及每份文件的結果。'
      },
      upload: '從你的電腦將 YAML 或 JSON 清單檔案載入編輯器。',
      loadSample: '以範例清單取代編輯器內容：一個在模擬 Harness 上執行的 echo 代理程式。',
      document: '一份或多份以 --- 分隔的 YAML 或 JSON 文件。紀錄之間以名稱互相參照。',
      dryRun: '驗證每份文件並顯示將會變更的內容，但不寫入任何東西。',
      apply: '驗證並寫入每份文件。只要有任何文件失敗，就不會寫入任何內容。',
      export: '產生可重建此租用戶設定的清單。',
      download: '將匯出的清單儲存為 YAML 檔案。',
      confirmApply: '立即將清單寫入此租用戶。'
    },
    templateEditor: {
      cloneName: '副本名稱。建議使用小寫字母、數字、連字號和斜線；builtin/ 前置詞為保留用途。',
      cloneConfirm: '以此名稱建立副本並在編輯器中開啟。',
      clone: '建立此範本的可編輯副本。建立前可以先為副本命名。',
      reset: '將此內建範本還原為 Garrison 隨附的內容。',
      delete: '刪除此範本及其所有版本。只要有部署繫結它，伺服器就會拒絕；確認對話方塊會列出這些部署。',
      create: '建立範本及其第一個版本。',
      save: '將內容儲存為新版本。跟隨最新版本的部署會在新的執行中採用它。',
      content: '範本文字。可使用 {{variables}}、條件、迴圈與引入；預覽會隨著你輸入而更新。',
      changeNote: '與版本一起儲存的簡短說明，交代變更了什麼以及原因。',
      tabs: {
        preview: '以範例內容轉譯範本，確切查看 Harness 會收到什麼。',
        versions: '每一個已儲存的版本，可比較差異與還原。'
      },
      sampleContext: '代替真實執行資料的 JSON。編輯它即可查看範本如何反應。',
      columns: {
        version: '版本號碼。數字越大越新。',
        note: '與版本一起儲存的變更說明。',
        author: '儲存此範本版本的人。',
        saved: '版本儲存的時間。'
      },
      diff: '將此版本與編輯器目前的內容進行比較。',
      restore: '讓此版本重新成為目前版本。目前的內容會保留在歷程中。'
    },
    serverInfo: {
      rest: 'REST API 呼叫與 SDK 使用的基底位址。',
      mcp: 'MCP 用戶端連線的位址。每個以工具形式公開的代理程式都會出現在那裡。',
      a2a: '此租用戶的 A2A 閘道基底位址。每個代理程式在其下都有自己的卡片。',
      openapi: '描述每個 REST 操作的 OpenAPI 文件。',
      version: 'Garrison 伺服器的版本。',
      dashboardVersion: '此主控台的版本。',
      node: '回應此頁面伺服器資訊要求的控制平面副本（控制節點）。有多個副本時，重新載入後可能由另一個副本回應。',
      nodeLink: '開啟機群 > 控制平面，將此副本與其他副本並列查看，包括狀態、心跳訊號，以及它是否為領導者。',
      database: '伺服器使用的資料庫引擎。',
      health: '伺服器健康檢查的結果。',
      replicas: '叢集預期的控制平面副本數量。',
      routes: '伺服器註冊的 API 操作數量。',
      serverTime: '伺服器時鐘。若與你的時鐘差距過大，可能導致簽署的請求失敗。',
      principalName: '你目前登入的身分。',
      principalType: '你是以使用者身分登入，還是使用存取金鑰登入。',
      role: '你的最高存取層級。',
      tenant: '你的工作階段所屬的租用戶。',
      expires: '你的工作階段結束、必須重新登入的時間。',
      rawJson: '顯示伺服器資訊的原始回應。'
    },
    requests: {
      grafana: '在新分頁中開啟 Grafana 的 HTTP 儀表板：根據 Prometheus 指標顯示請求速率、延遲與錯誤隨時間的變化。',
      kpis: {
        total: '伺服器在所選範圍與篩選條件下保留於歷程中的請求數。',
        success: '傳回 2xx 或 3xx 狀態的請求。',
        failure: '傳回 4xx 或 5xx 狀態的請求。',
        avgDuration: '伺服器回應的平均時間。'
      },
      columns: {
        time: '請求抵達的時間。',
        method: '請求的 HTTP 方法。',
        path: '被呼叫的路徑。將滑鼠移到值上可查看完整內容。',
        status: '伺服器傳回的 HTTP 狀態。',
        duration: '伺服器回應所花的時間。',
        principal: '發出請求的人：使用者、存取金鑰或執行權杖。'
      },
      viewDetails: '開啟請求，查看標頭、本文與時間資訊。',
      viewJson: '開啟請求紀錄，包含其原始 JSON。',
      deleteOne: '從歷程中移除此請求。',
      bulkDeleteAll: '刪除符合目前篩選條件的所有請求，而不只是此頁面上的請求。'
    },
    explorer: {
      operations: '挑選依領域分組的 API 操作。下方表單會依其參數調整。',
      pathParam: '路徑參數 {{name}}（{{type}}）。它會被代入 URL。{{description}}',
      queryParam: '查詢參數 {{name}}（{{type}}）。填寫後會附加到 URL。{{description}}',
      copyUrl: '複製完整解析後的請求 URL。',
      headerName: '請求標頭的名稱。Authorization 會根據你的工作階段自動加入。',
      headerValue: '此標頭要傳送的值。',
      removeHeader: '從請求中移除此標頭。',
      addHeader: '新增另一個請求標頭。',
      body: '用於建立或變更紀錄之操作的 JSON 請求本文。',
      execute: '立即以你的工作階段將請求傳送到伺服器。破壞性的方法會要求確認。',
      stop: '中止請求，或停止讀取串流回應。',
      snippets: {
        curl: '以 curl 指令表示的相同請求，可在終端機中使用。',
        fetch: '以 JavaScript fetch 程式碼表示的相同請求。',
        csharp: '以 C# HttpClient 程式碼表示的相同請求。'
      },
      clearHistory: '清除此瀏覽器中儲存的所有近期請求。',
      loadHistory: '將此請求重新載入表單。',
      deleteHistory: '從近期請求清單中移除此項目。',
      confirmExecute: '即使此請求可能變更或刪除資料，仍然傳送。'
    },
    settings: {
      settingPath: '設定路徑：{{path}}。在設定檔與設定的 REST API 中請使用這個名稱。',
      viewJson: '顯示設定的原始回應。',
      restart: '重新啟動此控制平面副本，讓需要重新啟動的設定生效。',
      save: '儲存所有已變更的設定。即時設定會立即生效；其他設定需等待重新啟動。',
      groupGeneric: '{{group}} 群組中的設定。',
      fieldGeneric: '伺服器設定 {{path}}。',
      applyLive: '儲存後立即生效。',
      applyRestart: '伺服器重新啟動後生效。',
      source: {
        File: '目前設定於設定檔中。在這裡儲存會更新該檔案。',
        Environment: '由環境變數設定，其優先順序高於在這裡儲存的任何值。',
        ConfigMap: '由 Kubernetes ConfigMap 管理。請改為在你的清單中變更。',
        Database: '以叢集設定的形式儲存在資料庫中，由所有副本共用。'
      },
      sourceGeneric: '目前值的來源。',
      testDatabase: '在儲存之前，先以上方的資料庫設定嘗試連線。',
      groups: {
        Observability: 'Grafana、Prometheus、Loki 與 Tempo 的位置。瀏覽器 URL 用於首頁卡片與 Grafana 連結；伺服器以內部 URL 檢查是否可連線。空白表示未設定。',
        Runtime: '控制平面如何限制執行：執行的最長時間、部署依照的執行防護預設值，以及排隊中的執行可以等待合適工作節點多久。',
        Rest: 'REST API 的接聽方式：主機、連接埠、TLS 與公開位址。',
        Mcp: 'MCP 伺服器的接聽方式，以及工具呼叫可以等待多久。',
        Database: 'Garrison 使用哪個資料庫以及如何連線。',
        Logging: '記錄輸出到哪裡，以及詳細程度。',
        Auth: '權杖簽署、有效期限與登入速率限制。',
        Security: '加密主金鑰與初始帳戶。',
        RequestHistory: '是否擷取 API 請求，以及每個本文要保留多少內容。',
        Telemetry: '指標與追蹤資料匯出。',
        Archive: '保留原則刪除執行和事件之前，將其封存到的位置。',
        Cluster: '預期的控制平面副本數量。',
        Scheduling: '工作節點的租約長度與心跳逾時。',
        Runs: '執行的預設值，以及執行與事件的保留時間。',
        Audit: '稽核紀錄的保留時間。'
      },
      fields: {
        Runtime: {
          MaxRunSeconds: '任何執行可以持續的最長時間（秒）。超過此值的部署逾時、每次執行的時間限制和設定檔預設值都會降到此值。',
          RepetitionGuard: '對於重複防護留空的部署，是否停止回答退化為重複的執行（結果為偵測到重複）。',
          MaxAssistantChars: '對於限制留空的部署，執行在助理文字達到多少字元後停止（結果為超出輸出上限）。0 表示不限制。',
          NoProgressSeconds: '對於限制留空的部署，執行在沒有文字、思考或工具活動多少秒後停止（結果為沒有進展）。0 表示關閉。',
          ConversationAffinityWaitMs: '對話的一輪等待保存其 Harness 工作階段之節點的時長，逾時後由其他節點領取並根據紀錄開始全新工作階段。若該節點未就緒，其他節點會立即領取。0 表示永不等待。',
          ConversationTranscriptTurns: '回退到全新 Harness 工作階段的對話輪次最多接收的先前輪數，保留最新的輪次。',
          ConversationTranscriptChars: '回退的一輪所接收的每則先前訊息和回答的最大字元數，超出部分會被截斷並標示。'
        },
        Scheduling: {
          PauseGraceMs: '主機休眠或虛擬機器暫停後，領導者會等待一個心跳時段再加上這些毫秒，然後才將節點標記為遺失或讓其執行失敗。預設值為 5000。'
        }
      }
    },
    runGuard: {
      openDeployments: '前往部署頁面，變更部署的執行防護：重複防護、最大助理字元數和無進展逾時。',
      openSettings: '前往設定頁面，變更沒有自訂執行防護的部署所依照的叢集預設值（執行階段）。'
    },
    conversationDetail: {
      viewJson: '以 JSON 顯示完整的對話紀錄。',
      openInvoke: '開啟「呼叫」並選取此對話，以完整的串流檢視傳送下一輪。',
      delete: '刪除此對話。它的各輪會作為一般執行保留在「執行」頁面，但對話將無法再繼續。',
      deleteBusy: '仍有未完成的一輪，因此在該執行結束或被取消之前，伺服器會拒絕刪除此對話。',
      agent: '此對話的代理程式。按一下可開啟該代理程式。',
      openAgent: '開啟此代理程式的頁面，檢視其部署和最近的執行。',
      deployment: '每一輪都在此部署上執行，也就是第一輪被路由到的部署。',
      activeRun: '仍在排隊或執行中的一輪。在其結束之前，下一則訊息會被拒絕。',
      openRun: '開啟此執行的頁面，檢視完整紀錄、結果和遙測資料。',
      turns: '對話的所有輪次，依時間由早到晚排列。每一輪都是一次執行。',
      columns: {
        turn: '該輪在對話中的位置，從 1 開始。',
        run: '執行這一輪的執行。按一下可開啟其紀錄。',
        status: '該輪執行所處的生命週期階段：排隊、執行中或某個結束狀態。',
        outcome: '該輪執行結束的原因，比狀態更詳細。',
        session: '該輪是恢復了上一輪的 Harness 工作階段，還是以紀錄開始了全新工作階段（以及原因）。',
        input: '這一輪所傳送訊息的開頭。將滑鼠停在上方可查看更多內容。',
        result: '回答的開頭；執行失敗時為錯誤訊息。將滑鼠停在上方可查看更多內容。',
        node: '執行這一輪的工作節點。',
        created: '這一輪的傳送時間。將滑鼠停在值上可查看確切時間。'
      },
      session: {
        first: '第一輪：它開始後續各輪將恢復的 Harness 工作階段。',
        resumed: '這一輪在保存對話目錄的節點上恢復了 Harness 工作階段 {{session}}，因此代理程式保留了完整的情境。',
        fallback: '這一輪無法恢復工作階段，因此以先前各輪的紀錄開始了全新的 Harness 工作階段。',
        pending: '這一輪正在等待節點，因此尚不知道它會恢復工作階段還是回退。'
      },
      continueTitle: '將下一則訊息作為此對話的下一輪傳送。它使用相同的代理程式和部署執行。',
      message: '給代理程式的下一則訊息。它會結合先前各輪的情境繼續對話。',
      send: '將此訊息作為下一輪傳送。這一輪會出現在上方清單中，並持續重新整理直到結束。',
      sendBusy: '上一輪仍未完成。在其結束之前伺服器會拒絕新的一輪，請等待或先將其取消。'
    }
  },
  analytics: {
    grafana: '在新分頁中開啟 Grafana 的 Runs 儀表板，時間範圍與本頁相同。',
    filters: {
      ttft: '勾選後，第一個 Token 時間圖表會排除等待委派代理程式的時間，讓會委派的代理程式能與直接回答的代理程式公平比較。',
      range: '所有圖表與總計的時間範圍：最近一小時、一天、一週、30 天，或自訂的開始與結束時間。',
      from: '自訂範圍的開始時間，以你的本機時區表示。',
      to: '自訂範圍的結束時間，以你的本機時區表示。',
      agentId: '只計算此代理程式的執行。部署清單會縮小為它的部署。',
      harnessType: '只計算由此 Harness 執行的執行。',
      deploymentId: '只計算此部署的執行，例如用來比較同一代理程式的兩種模型。',
      model: '只計算 Harness 回報使用此模型的執行。清單會顯示所選範圍內出現過的模型。',
      groupBy: '將每張圖表依代理程式、Harness、模型，或 Harness 與模型組合拆分為各自的數列，方便比較。'
    },
    cards: {
      delegationWait: '執行等待其委派子執行的平均時間。若範圍內沒有執行進行委派，則為不適用。',
      ttftExcludingDelegation: '不含等待委派代理程式時間的平均第一個 Token 時間。附註顯示第 95 百分位數。',
      runs: '在此範圍內要求且符合篩選條件的執行。',
      successRate: '成功的執行占已結束執行（成功、失敗、已取消與逾時）的比例。',
      ttft: '有產生輸出之執行的平均第一個 Token 時間。附註顯示第 95 百分位數。',
      execution: 'Harness 的平均執行時間。附註顯示第 95 百分位數，反映你較慢的執行。',
      queue: '執行等待工作節點的平均時間。',
      tokens: '此範圍內所有執行的輸入加輸出 Token。',
      throughput: '串流期間每秒的平均輸出 Token 數。',
      cost: '回報的總成本（美元）。',
      toolCalls: '此範圍內的執行所發出的工具呼叫總數。'
    },
    charts: {
      outcomes: '每個時間區間內執行的結束方式。將滑鼠移到長條上可查看數量。',
      ttft: '執行產生第一個 Token 所花的時間：平均值、中位數與第 95 百分位數。',
      duration: '模型串流了多久，以及 Harness 總共執行了多久。',
      queue: '執行在節點取得租約前等待了多久。',
      tokens: '每個區間消耗的 Token，依種類拆分。',
      throughput: '輸出產生速度，以每秒 Token 數表示。',
      cost: '每個區間回報的花費。',
      toolCalls: '每個區間發出的工具呼叫。',
      usageTokens: '輸入加輸出 Token 隨時間的變化，每個 Harness 與模型組合各為一個堆疊區段。將滑鼠移到長條上可查看拆分。',
      usageCost: '回報成本隨時間的變化，每個 Harness 與模型組合各為一個堆疊區段。將滑鼠移到長條上可查看拆分。'
    },
    metrics: {
      delegationWaitMsAvg: '執行等待其委派子執行的平均時間。按一下可隱藏或顯示此折線。',
      timeToFirstTokenExcludingDelegationMsP95: '不含委派等待的第一個 Token 時間第 95 百分位數。按一下可隱藏或顯示此折線。',
      timeToFirstTokenExcludingDelegationMsP50: '不含委派等待的第一個 Token 時間中位數。按一下可隱藏或顯示此折線。',
      timeToFirstTokenExcludingDelegationMsAvg: '不含委派等待的平均第一個 Token 時間。按一下可隱藏或顯示此折線。',
      runs: '此區間內要求的執行。',
      succeeded: '成功完成的執行。按一下即可隱藏或顯示此數列。',
      failed: '失敗的執行。按一下即可隱藏或顯示此數列。',
      cancelled: '已取消的執行。按一下即可隱藏或顯示此數列。',
      timedOut: '到達期限的執行。按一下即可隱藏或顯示此數列。',
      inputTokens: '傳送給模型的輸入 Token。按一下即可隱藏或顯示此數列。',
      outputTokens: '模型產生的輸出 Token。按一下即可隱藏或顯示此數列。',
      cachedTokens: '由提示快取提供的輸入 Token。按一下即可隱藏或顯示此數列。',
      reasoningTokens: '推理 Token（若 Harness 有回報）。按一下即可隱藏或顯示此數列。',
      totalTokens: '每個區間內執行的輸入 Token 加輸出 Token。',
      costUsd: '回報的成本（美元）。',
      toolCalls: '每個區間內執行發出的工具呼叫。按一下即可隱藏或顯示此數列。',
      timeToFirstTokenMsAvg: '此區間的平均第一個 Token 時間。按一下即可隱藏或顯示此線條。',
      timeToFirstTokenMsP50: '第一個 Token 時間的中位數：一半的執行比它快。按一下即可隱藏或顯示此線條。',
      timeToFirstTokenMsP95: '第一個 Token 時間的第 95 百分位數：每 20 個執行中只有 1 個比它慢。按一下即可隱藏或顯示此線條。',
      streamingMsAvg: '平均串流時間，從第一個到最後一個模型輸出。按一下即可隱藏或顯示此線條。',
      executionMsAvg: 'Harness 的平均執行時間，從程序啟動到結束。按一下即可隱藏或顯示此線條。',
      executionMsP95: '執行時間的第 95 百分位數。按一下即可隱藏或顯示此線條。',
      queueMsAvg: '從排入佇列到取得租約的平均時間。',
      outputTokensPerSecondAvg: '串流期間每秒的平均輸出 Token 數。'
    },
    groupSeries: {
      none: '{{name}}：{{metric}}。',
      agent: '代理程式 {{name}} 的執行：{{metric}}。按一下即可隱藏或顯示此數列。',
      harness: '在 {{name}} Harness 上的執行：{{metric}}。按一下即可隱藏或顯示此數列。',
      model: '由模型 {{name}} 提供服務的執行：{{metric}}。按一下即可隱藏或顯示此數列。',
      harnessModel: '在 {{name}}（Harness / 模型）上的執行：{{metric}}。按一下即可隱藏或顯示此數列。'
    },
    otherSeries: '最繁忙群組以外的所有群組加總。按一下即可隱藏或顯示。',
    dataTable: '以表格顯示此圖表背後的數字，每個時間區間一列。',
    bucketStart: '時間區間的開始。每一列涵蓋一個區間。',
    usage: '依 Harness 與模型拆分的用量隨時間變化，不受上方分組設定影響，並附有整個範圍的總計。',
    breakdown: '所選範圍內每個 Harness 與模型組合的總計。可用來查看哪個模型主導了你的 Token 用量與成本。',
    breakdownColumns: {
      harness: '執行這些執行的 Harness。',
      model: 'Harness 回報提供服務的模型。「未知模型」表示 Harness 沒有回報。',
      runs: '此範圍內在此 Harness 與模型上的執行。',
      inputTokens: '這些執行中傳送給模型的輸入 Token。',
      outputTokens: '這些執行中模型產生的輸出 Token。',
      cachedTokens: '這些執行中由提示快取提供的輸入 Token。',
      reasoningTokens: '推理 Token，適用於會分開回報的 Harness。',
      costUsd: '這些執行回報的總成本（美元）。',
      timeToFirstTokenMsAvg: '平均第一個 Token 時間，依每個時間區間內的執行數加權。'
    }
  },
  export: {
    menu: '下載 {{name}}：以 CSV 或 JSON 下載資料，或將圖表連同標題、圖例、篩選條件與時間範圍下載為 PNG 或 SVG 圖片。',
    csv: '以 CSV 下載此檢視背後的確切資料：每個區間或紀錄一列，時間戳記為 ISO 8601 UTC，數字使用一般的小數點格式。',
    png: '以螢幕兩倍解析度將圖表下載為 PNG 圖片，包含標題、圖例、目前的篩選條件與時間範圍。',
    svg: '將圖表下載為可縮放的 SVG 圖片，包含標題、圖例、目前的篩選條件與時間範圍。',
    json: '以 JSON 下載資料，數列、區間、篩選條件與時間範圍都在同一份文件中。'
  }
};

const explainers = {
  approvals: {
    title: '核准的運作方式',
    p1: '已啟用核准的部署會讓其 Harness 在工具呼叫前詢問 Garrison：Claude Code 透過其權限提示工具詢問，Codex app-server 執行則針對命令與檔案變更詢問。',
    p2: '每個要求都會依部署的規則檢查。「拒絕」優先於「詢問」，「詢問」優先於「允許」；沒有符合的規則時，套用部署預設值。「允許」與「拒絕」會立即回覆；「詢問」會將要求放在這裡，執行則會等候。',
    p3: '可附上選填的原因來允許或拒絕待處理的要求。「記住為規則」會在部署中新增規則，下次類似的呼叫就會自動決定。沒有人決定的要求會在到期時套用部署的逾時決定。'
  },
  diagram: {
    label: '圖示：呼叫端以名稱呼叫代理程式，Garrison 依權重挑選該代理程式的一個部署，再由該部署的繫結決定執行如何進行。',
    caller: { title: '呼叫端', body: 'REST、MCP、A2A 或其他代理程式', tip: '任何呼叫代理程式的對象：REST API、MCP 用戶端、A2A 代理程式，或其他代理程式的執行。呼叫端只知道代理程式名稱。' },
    agent: { title: '代理程式', body: '名稱、描述、公開方式、委派、輸出結構描述', tip: '可定址的身分。呼叫端以名稱呼叫它；它說明代理程式是什麼以及如何公開，而不是如何執行。' },
    deploymentA: { title: '部署 A，權重 300', body: 'Claude Code，sonnet', tip: '執行此代理程式的一種方式。權重 300 對 100 時，它會收到未指定部署之呼叫的 75%。' },
    deploymentB: { title: '部署 B，權重 100', body: 'Mux，本機模型', tip: '執行同一代理程式的另一種方式。呼叫端也可以明確指定它，以略過加權選擇。' },
    binds: { title: '每個部署都會繫結', body: 'Harness 設定檔、提示、MCP 伺服器、祕密、工作區、節點池、限制', tip: '將請求轉為具體程序所需的一切：使用哪個 CLI、哪些提示、哪些工具與憑證，以及可以在哪裡執行。' },
    run: { title: '執行', body: '某個部署的一次執行', tip: '每次呼叫都會建立一個執行，由所選部署編譯而成，並在工作節點上執行。' }
  },
  agents: {
    title: '代理程式與部署',
    p1: '代理程式是呼叫端使用的身分。它具有名稱、描述、公開方式（A2A 卡片、MCP 工具）、是否可以呼叫其他代理程式，以及其答案必須符合的輸出結構描述。代理程式本身並不會執行任何東西。',
    p2: '部署決定代理程式如何執行：使用哪個 Harness 設定檔與模型、哪些提示範本、哪些 MCP 伺服器與祕密（透過別名）、什麼工作區、哪個節點池，以及適用哪些限制與單次執行參數。一個代理程式可以有多個部署，每個部署都有流量權重。',
    p3: '有人呼叫代理程式時，除非呼叫端指定了特定部署，否則 Garrison 會依權重從其啟用中的部署隨機挑選一個。這樣你就能讓 Claude Code 與 Mux 版本並行運作，或逐步將流量移轉到新模型。'
  },
  deployments: {
    title: '什麼是部署',
    p1: '部署讓代理程式變成可執行的東西。它只屬於一個代理程式，並繫結 Harness 設定檔（要啟動哪個 CLI）、模型、各角色的提示範本、以別名繫結的 MCP 伺服器與祕密、選用的工作區與成品存放區、節點池或標籤上的排程放置，以及逾時與並行數等限制。',
    p2: '具有多個啟用部署的代理程式會依權重分配流量：權重 300 與 100 時，每四次呼叫有三次會送到第一個部署。停用的部署不會收到加權流量，但仍可被明確指定，這很適合在給予權重之前先測試新的設定。',
    p3: '對部署使用「編譯預覽」，即可在不啟動執行的情況下，查看執行會取得的確切命令列、檔案與環境變數。'
  },
  agentDetail: {
    title: '此代理程式如何執行',
    p1: '此代理程式透過其名稱存取。下方的部署是它具體的執行方式。每個啟用的部署所分得的流量比例，等於其權重除以所有啟用部署的權重總和；指定部署的呼叫端會略過加權選擇。'
  },
  harnessProfiles: {
    title: 'Harness 設定檔與部署',
    p1: 'Harness 設定檔是某個命令列代理程式的啟動配方：執行檔、引數範本、環境變數、要寫入的檔案、提示與系統提示的傳遞方式、它讀取的 MCP 設定格式，以及如何將其輸出剖析為事件。',
    p2: '設定檔是共用的構成元件。部署挑選一個設定檔，再加上具體內容：模型、提示、祕密，以及只適用於它的引數或環境變數覆寫。許多部署可以使用同一個設定檔，因此修正設定檔就能套用到所有部署。',
    p3: '內建設定檔為唯讀。若要變更，請先複製一份。'
  },
  promptTemplates: {
    title: '提示範本以及部署如何使用它們',
    p1: 'Garrison 傳送給 Harness 的每一段文字都是範本：系統提示、包裝呼叫端訊息的內容、委派指示、工具描述，以及產生的設定檔。範本使用 {{input.message}} 與 {{deployment.model}} 等變數，每次儲存都會建立新版本。',
    p2: '部署將範本繫結到提示角色（System、Task、DelegatedTask 等）。繫結可以跟隨最新版本或固定某個版本，因此你可以編輯範本，而不會在你決定之前變更正式環境的部署。每個執行都會記錄它所使用的確切版本。'
  },
  mcpServers: {
    title: 'MCP 伺服器與繫結',
    p1: '這裡列出的 MCP 伺服器是工具提供者：包含位址（stdio 伺服器則為命令）、它所需的標頭或環境變數，以及必須存在的工具。註冊伺服器並不會立即將它提供給任何代理程式。',
    p2: '部署會繫結其代理程式應使用的伺服器，每一個都有別名。編譯時，Garrison 會將它們寫入 Harness 的 MCP 設定，並解析標頭中的祕密參照，工作節點則會在啟動前檢查必要工具。當代理程式可以委派時，Garrison 自己的 MCP 伺服器會自動加入。'
  },
  secrets: {
    title: '祕密與別名',
    p1: '祕密是加密的值，例如 API 金鑰或權杖。此值只能寫入：儲存後你可以取代或輪替它，但沒有人能透過主控台或 API 讀回它。',
    p2: '部署以別名繫結祕密。Harness 設定檔的環境變數與檔案再參照 {{secret.alias}}，因此同一個設定檔可以在不同部署中搭配不同的金鑰使用。值只在編譯執行時解密，透過 TLS 傳送到工作節點，並從記錄中清除。'
  },
  workspaces: {
    title: '工作區',
    p1: '工作區範本描述每次執行開始時所在的目錄：空白、全新的 Git 複製（私有儲存庫可搭配選用的憑證祕密），或一組預先放入的檔案。保留設定決定執行結束後目錄要刪除還是保留。',
    p2: '一個部署可以繫結零個或一個工作區範本。每次執行都有自己的複本，因此執行之間永遠看不到彼此的檔案。'
  },
  modelPrices: {"title": "模型價格", "p1": "在執行器未報告費用時，使用操作員設定的美元費率進行估算。已報告費用（包括零）優先。", "p2": "不使用停用的價格。編輯或刪除價格不會改變已儲存的執行費用。"},
  usageQuotas: {"title": "使用配額", "p1": "租戶、代理或部署的UTC每日執行數、權杖數、已知費用上限及目前並行上限。", "p2": "留空表示無限制，零表示禁止使用。每日計數在UTC午夜重設；並行計數為目前活躍執行數。 預設關閉。明確啟用後才會在達到限制時拒絕執行，並降低支援的執行器預算。關閉時僅記錄使用量，不影響執行。"},
  artifactStores: {
    title: '成品存放區',
    p1: '成品存放區是在執行的工作區消失後，用來保留執行所產生檔案的地方。一個部署可以繫結一個存放區，執行結束時，工作節點會將符合條件的檔案上傳到那裡。'
  },
  manifests: {
    title: '清單以及它們建立的紀錄',
    p1: '清單是以 YAML 或 JSON 文件撰寫的租用戶設定：祕密（預設不含值）、提示範本、Harness 設定檔、MCP 伺服器、工作區範本、代理程式與部署。文件之間以名稱互相參照，因此同一份清單可以在任何租用戶中使用。',
    p2: '套用清單會建立或更新一般紀錄，也就是你在其他分頁看到的那些紀錄。套用兩次不會造成任何變更。試執行會顯示將會變更的內容而不寫入，「匯出」則會產生可重建此租用戶的清單。'
  },
  nodes: {
    title: '節點與節點池',
    p1: '節點是一個工作程序，通常是一個 Pod，它從控制平面拉取執行、啟動 Harness，並將其事件串流回傳。節點會自行註冊、回報它找到的 Harness，並傳送心跳訊號；你不需要在這裡建立它們。',
    p2: '節點可以屬於某個節點池並帶有標籤。部署使用節點池與標籤選擇器來決定其執行可以在哪裡進行。封鎖節點可停止接收新工作，維護前則應將它清空。'
  },
  controlNodes: {
    title: '控制節點與工作節點',
    p1: '控制節點是 Garrison 伺服器的一個副本。控制節點提供 REST API、MCP 伺服器與 A2A 閘道，驗證呼叫端身分，將部署編譯為執行，並排程這些執行。任何副本都能回應任何要求，因此負載平衡器可以在它們之間分配流量。',
    p2: '其中一個控制節點是領導者。它在資料庫中持有一個租約，負責整個叢集的維護：依保留期清理、將沒有心跳訊號的副本標記為離線，以及移除舊的資料列。如果領導者停止，另一個副本會在幾秒內接手租約。',
    p3: '工作節點（位於「工作節點」分頁）負責另一半的工作：它們從控制平面取得已租用的執行並執行 Harness。控制節點從不執行 Harness，工作節點也從不存取資料庫。每個副本都會自行註冊並每 5 秒傳送一次心跳訊號，因此此分頁為唯讀。'
  },
  nodePools: {
    title: '節點池與節點',
    p1: '節點池是具名的工作節點群組，例如 GPU 機器或保留給某位客戶的節點。節點在註冊時加入節點池。節點池可以限制只供特定租用戶使用。',
    p2: '指定節點池的部署只會在該節點池的節點上執行。未指定節點池的部署可以在任何符合條件的節點上執行。'
  },
  tenants: {
    title: '租用戶',
    p1: '租用戶是此伺服器上一個彼此隔離的組織。使用者、存取金鑰、代理程式、祕密與執行都屬於某一個租用戶，且跨租用戶之間互相看不到。除非節點池保留給特定租用戶，否則節點池與工作節點是共用的。'
  },
  users: {
    title: '使用者與存取金鑰',
    p1: '使用者是以電子郵件與密碼登入的人員。存取金鑰則是自動化用來登入的方式。每把存取金鑰都屬於一位使用者，且能做的事永遠不會超過該使用者。',
    p2: '兩者都不會因為存在就自動獲得存取權。存取權來自使用者上的管理員旗標以及角色指派。'
  },
  credentials: {
    title: '存取金鑰與使用者',
    p1: '存取金鑰是一組存取金鑰與祕密金鑰，供指令碼、SDK 與服務使用。它屬於一位使用者。其有效權限是它自身角色指派所授予的權限與其擁有者可執行之權限的交集。',
    p2: '祕密金鑰只會在建立或輪替金鑰時顯示一次。請定期輪替金鑰，並刪除長時間未使用的金鑰。'
  },
  roles: {
    title: '角色、權限與指派',
    p1: '權限是一條規則：允許或拒絕對特定資源類型（例如 Agent 或 Run）執行特定操作（例如 Read 或 Execute）。角色是具名的權限組合。拒絕永遠優先於允許。',
    p2: '在角色被指派之前，任何人的權限都不會改變。下一個分頁中的指派會將角色連結到使用者或存取金鑰，範圍可以是整個租用戶或單一紀錄。'
  },
  assignments: {
    title: '指派',
    p1: '指派會將一個角色授予一位使用者或一把存取金鑰。「租用戶」範圍會將角色套用到所涵蓋類型的每一筆紀錄；「資源」範圍則只套用到單一紀錄，例如 CI 工作可以呼叫的那一個代理程式。',
    p2: '對使用者或存取金鑰使用「有效權限」，即可查看其所有指派合併後的結果。'
  },
  runs: {
    title: '執行與佇列',
    p1: '執行是某個部署的一次呼叫。它會排入佇列、由工作節點取得租約、執行，並以結果、對話紀錄、輸出內容與遙測資料（例如第一個 Token 時間、Token 數與成本）結束。',
    p2: '「佇列」分頁顯示這些執行在等待期間的狀態：已排入佇列的執行需要具備正確 Harness 與排程放置條件的節點，已租用的執行已被認領，執行中的執行正在進行。長時間停留在佇列中的執行，代表容量不足，或排程放置規則沒有任何節點符合。'
  },
  queue: {
    title: '佇列',
    p1: '這是尚未完成之執行的即時檢視：等待節點、已租用或執行中，依代理程式與 Harness 分組。它與「執行」分頁的資料相同，經過彙總以顯示排程壓力。',
    p2: '某個 Harness 的已排入佇列數量持續增加，通常表示沒有就緒的節點公告支援該 Harness、符合條件的節點已滿，或部署要求的節點池或標籤沒有任何節點具備。'
  },
  invoke: {
    title: '呼叫時會發生什麼事',
    p1: '你以名稱呼叫代理程式。除非你挑選了部署，否則 Garrison 會依權重從代理程式啟用中的部署選擇一個，依該部署的允許範圍驗證所有單次執行參數，並將執行排入佇列。工作節點執行時，對話紀錄會在這裡串流顯示。'
  },
  audit: {
    title: '稽核與請求歷程',
    p1: '稽核紀錄是安全性與設定事件：登入、遭拒絕的請求、祕密與角色變更、清單套用，以及節點狀態變更。它們會依設定中的保留期限保存。',
    p2: '上一個分頁的「請求歷程」是原始的 HTTP 流量。以稽核回答誰變更了什麼，以請求歷程偵錯用戶端實際傳送了什麼。'
  },
  requests: {
    title: '請求歷程',
    p1: '此伺服器擷取的每個 API 請求，包含方法、路徑、狀態、時間、標頭與本文（依設定的大小截斷）。可用來偵錯整合與 SDK 呼叫。按一下圖表中的長條，即可將表格縮小到該時間範圍。'
  },
  analytics: {
    title: '這些圖表量測什麼',
    p1: '第一個 Token 時間是從 Harness 程序啟動到第一個模型輸出的時間，因此包含 CLI 啟動時間。串流時間是從第一個到最後一個模型輸出，執行時間則是從程序啟動到結束。排隊時間是執行等待工作節點的時間。這些都以工作節點與伺服器的時鐘量測。',
    p2: 'Token 數與成本來自各 Harness 的回報。快取 Token 是由供應商提示快取提供的輸入 Token，推理 Token 只會出現在會分開回報的 Harness。每秒輸出 Token 數是輸出 Token 數除以串流時間。',
    p3: '平均值會忽略無法量測數值的執行。百分位數顯示尾端情況：P95 表示每二十個執行中只有一個比它慢。依代理程式或 Harness 分組，即可並排比較。'
  },
  conversations: {
    title: '對話與輪次',
    p1: '對話是與一個代理程式進行的一系列執行。第一輪開始一個 Harness 工作階段；後續每一輪都在同一個工作節點上恢復該工作階段，因此代理程式在訊息之間保留其檔案、工具和情境。',
    p2: '同一時間只執行一輪：上一輪未完成時，新的訊息會被拒絕。每一輪都使用第一輪的部署。',
    p3: '當某一輪無法恢復工作階段時（節點已不在或長時間被占用、檔案已被移除、或 Harness 不支援恢復），它會回退到一個以先前各輪紀錄開始的全新工作階段。「回退次數」欄統計這些輪次，輪次清單會說明原因。'
  }
};

export { tips, explainers };

tips.views.settings.groups.Leases = "選用協調設定；所有副本須使用相同設定並重新啟動。預設使用 Database。";
tips.views.settings.fields.Leases = {"Provider": "選用協調設定；所有副本須使用相同設定並重新啟動。預設使用 Database。", "ClutchEndpoint": "透過密鑰或環境變數提供 Clutch 存取金鑰；端點不得包含憑證。", "ClutchAccessKey": "透過密鑰或環境變數提供 Clutch 存取金鑰；端點不得包含憑證。", "KeyPrefix": "選用協調設定；所有副本須使用相同設定並重新啟動。預設使用 Database。", "RequestTimeoutMs": "選用協調設定；所有副本須使用相同設定並重新啟動。預設使用 Database。", "SweepIntervalMs": "選用協調設定；所有副本須使用相同設定並重新啟動。預設使用 Database。", "MaxLeaseMs": "選用協調設定；所有副本須使用相同設定並重新啟動。預設使用 Database。", "MaxHoldMs": "選用協調設定；所有副本須使用相同設定並重新啟動。預設使用 Database。"};

tips.enums.harnessType.ProviderApi = "透過 PolyPrompt 執行選用的直接 API 循環。須設定端點和模型；CLI 部署維持可用。";
tips.enums.harnessType.OpenCode = "以 opencode run 無介面執行 opencode CLI，輸出 JSON 事件。支援 Anthropic、OpenAI、Google 等模型提供方。";
tips.enums.harnessType.Pi = "以 JSON 模式執行 pi 程式設計代理。支援 Anthropic、OpenAI、Google 等模型提供方。";

// Pipelines (P12.9).
tips.nav.hubs.approvals = '所有等候人員處理的項目：代理程式要求進行的工具呼叫、需要審查的管線階段，以及每項決定的歷程。';
tips.nav.approvalsBadgeCombined = '等候人員處理：{{approvals}} 個工具呼叫核准與 {{reviews}} 個管線階段審查。開啟「核准」即可決定。';
Object.assign(tips.nav.tabs, {
  approvals: '代理程式要求進行、等候人員允許或拒絕的工具呼叫，以及由規則、預設值、人員或逾時所做的每項過往決定。',
  pipelineReviews: '已完成並等候人員處理的管線階段：核准、要求變更（階段會依你的意見重新執行），或拒絕。',
  pipelines: '代理程式的串連：每個階段執行一個代理程式，透過提示範本將輸出交給下一個階段，並可等候審查。',
  pipelineRuns: '管線的每次執行及其狀態與結果。開啟一筆即可查看階段時間軸、階段執行與審查。'
});
tips.filters.pipelineId = '只顯示單一管線的紀錄。選擇「全部」即可移除篩選。';
tips.filters.pipelineRunId = '只顯示單一管線執行的審查。貼上 plr_... 之類的 ID；停止輸入後清單就會更新。';
Object.assign(tips.enums, {
  pipelineRunStatus: {
    Running: '有階段正在執行、啟動中或即將啟動。',
    AwaitingReview: '有階段已完成，正在等候人員核准、要求變更或拒絕。',
    Cancelling: '已要求取消；目前的階段執行正在停止。',
    Succeeded: '每個階段都已完成，且每個審查關卡都已核准。',
    Failed: '有階段在用完嘗試次數後失敗、無法啟動，或遭審查者拒絕。重試會從該階段繼續。',
    Cancelled: '有人取消了管線執行。重試會從停止的階段繼續。',
    TimedOut: '管線執行超過了時間限制，包括等候審查的時間。'
  },
  pipelineRunOutcome: {
    None: '管線執行尚未結束，因此還沒有結果。',
    Succeeded: '每個階段都成功，且每個審查都已核准。',
    StageFailed: '有階段每次嘗試都失敗，且未設定失敗時繼續。',
    StageStartFailed: '有階段無法啟動，例如其代理程式或部署已不存在，或其提示無法編譯。',
    ReviewRejected: '審查者拒絕了某個階段，因而結束管線執行。',
    ReviewExpired: '審查逾時，且其逾時動作為「拒絕」。',
    Cancelled: '有人取消了管線執行或其中一個階段執行。',
    TimedOut: '管線執行超過了其時間限制。',
    InternalError: '伺服器在推進管線時發生未預期的錯誤。請檢查伺服器記錄。'
  },
  pipelineStageStatus: {
    Pending: '此階段尚未開始；較早的階段仍在執行。',
    Running: '階段執行已排入佇列或正在執行。嘗試失敗會開始新的一次執行，直到用完嘗試次數。',
    AwaitingReview: '此階段已完成，正在等候人員審查其輸出。',
    Succeeded: '此階段已完成；若需要審查，也已獲得核准。',
    Failed: '此階段每次嘗試都失敗、無法啟動，或遭到拒絕。',
    Cancelled: '此階段因管線執行被取消或逾時而停止。'
  },
  pipelineReviewStatus: {
    Pending: '正在等候人員核准、要求變更或拒絕。',
    Approved: '已核准：管線已帶著備註（如有）進入下一個階段。',
    ChangesRequested: '已要求變更：此階段已依據意見重新執行。',
    Rejected: '已拒絕：管線執行在此階段失敗。',
    Expired: '無人及時決定，因此由此階段的逾時動作決定。',
    Cancelled: '管線執行在有人決定之前就已停止。'
  },
  pipelineReviewDecision: {
    Approve: '接受階段輸出並繼續下一個階段。選填的備註會交給下一個階段。',
    RequestChanges: '依據你的意見重新執行同一個階段。受此階段的最多修訂次數限制。',
    Reject: '在此停止管線執行。其結果為「審查遭拒絕」並失敗。'
  },
  pipelineReviewSource: {
    User: '由人員決定了此審查。',
    Timeout: '審查逾時，由此階段的逾時動作決定。',
    Cancelled: '審查待處理期間，管線執行被取消或逾時。'
  }
});
Object.assign(tips.enums.auditEventType, {
  PipelineReviewDecided: '人員或逾時核准、拒絕或要求變更了某個管線階段審查。',
  PipelineRunCancelled: '有人取消了管線執行、其待處理的審查，以及其目前的階段執行。'
});
Object.assign(tips.resources.runs, {
  pipelineRunId: '此執行所屬的管線執行，附上階段位置與執行次序。管線以外的執行則為空白。',
  pipelineStage: '在管線中的階段位置，以及此執行是該階段的第幾次執行（重試與修訂都會增加執行次數）。'
});
tips.resources.pipelines = {
  add: '建立管線：依序排列的階段清單，每個階段執行一個代理程式，並將輸出交給下一個階段。',
  name: '此租用戶中唯一的管線名稱，供 API、MCP 工具、SDK 與清單使用。僅限小寫字母、數字與連字號。',
  stages: '依執行順序排列的階段。每個階段執行一個代理程式；其輸出會透過提示範本交給下一個階段。',
  reviewGates: '有多少個階段會等候人員審查其輸出，管線才會繼續。',
  maxDurationSeconds: '整個管線執行可花費的最長時間（秒），包括等候審查。0 表示沒有限制；超過時執行會逾時。',
  version: '每次儲存變更都會遞增。管線執行會記錄開始時的版本並保留其階段。',
  stageHeading: '管線中的一個階段，依顯示順序執行。使用箭頭移動它，使用垃圾桶移除它。',
  moveUp: '將此階段往前移一個位置。階段會依顯示順序執行。',
  moveDown: '將此階段往後移一個位置。階段會依顯示順序執行。',
  removeStage: '從管線移除此階段。管線至少需要一個階段。',
  addStage: '在管線結尾新增階段。它會收到前一個階段的輸出。',
  stagesItems: {
    name: '此階段的名稱，在管線中必須唯一。會顯示在時間軸、審查與交接提示中。',
    agentId: '此階段執行的代理程式。啟動管線需要執行每個階段代理程式的權限。',
    deploymentId: '此階段代理程式的固定部署。留空則像一般呼叫一樣，依權重從代理程式的啟用部署中挑選一個。',
    handoffTemplateId: '任務提示範本，會將此階段的任務與先前的輸出、審查備註及修訂意見包裝在一起。留空則使用部署的 PipelineStage 繫結或內建範本。',
    handoffTemplateVersion: '即使交接範本之後有變更，仍使用此版本。留空則一律使用目前版本。',
    outputCharLimit: '每個先前階段的輸出傳給此階段的最多字元數。較長的輸出會被截斷並標示為已截斷。',
    maxAttempts: '此階段的執行失敗或逾時時最多執行幾次，之後此階段就視為失敗。',
    continueOnFailure: '當此階段每次嘗試都失敗時，仍繼續下一個階段；該階段會在交接中看到這次失敗。',
    requiresReview: '此階段完成後，等候人員在「核准 > 階段審查」下核准、要求變更或拒絕。',
    reviewTimeoutSeconds: '審查在由逾時動作決定之前可等候多久。0 表示等候到人員決定。',
    reviewTimeoutAction: '審查逾時時的處理方式：核准並繼續，或拒絕並使管線執行失敗。',
    maxRevisions: '審查者最多可對此階段要求變更幾次。之後只剩「核准」與「拒絕」。',
    description: '給人員看的此階段用途說明。不會傳送給代理程式。',
    parameters: '此階段執行的執行參數覆寫，例如模型或格式。只有在部署允許呼叫端覆寫時才可使用。'
  },
  actions: {
    start: '以輸入文字啟動此管線，並在管線執行頁面追蹤其階段。',
    preview: '以範例輸入與範例階段輸出轉譯每個階段提示，不會啟動任何執行。',
    runs: '在「管線執行」分頁顯示此管線的執行。'
  }
};
tips.resources.pipelineRuns = {
  id: '管線執行識別碼（plr_...）。可搭配 API、MCP 工具與 SDK 使用。',
  pipelineName: '此執行所執行的管線。管線執行會保留其開始時版本的階段。',
  pipelineVersion: '此執行開始時的管線版本。之後對管線的編輯不會改變它。',
  status: '管線執行目前的狀況：執行中、等候審查、取消中或已結束。',
  outcome: '管線執行結束的原因：成功、階段失敗或無法啟動、審查遭拒絕或過期、已取消或逾時。',
  progress: '管線執行目前所在的階段，以及其階段總數。',
  callerName: '啟動此管線執行的使用者或存取金鑰。',
  errorMessage: '管線執行失敗或逾時時，說明發生了什麼問題。',
  priority: '套用到每個階段執行的佇列優先順序。數字越大越先排程。',
  deadlineUtc: '依管線的時間限制，管線執行逾時的時間。沒有限制時為空白。',
  completedUtc: '管線執行結束的時間。',
  createdUtc: '管線執行啟動的時間。將游標停在值上可查看確切時間。',
  actions: {
    cancel: '取消管線執行：其目前的階段執行會被取消，待處理的審查會被關閉。',
    retry: '從停止的階段繼續失敗、逾時或已取消的管線執行，並為該階段開始新的一次執行。',
    stageRuns: '在「執行」分頁顯示此管線執行每個階段的執行。',
    finalRun: '開啟最後一個階段的執行，其結果即為管線的結果。'
  }
};
tips.resources.pipelineReviews = {
  createdUtc: '階段完成並要求審查的時間。將游標停在值上可查看確切時間。',
  pipelineName: '其階段正在等候審查的管線。',
  stageName: '要審查的階段，附上其位置，以及產生輸出的是該階段的第幾次執行。',
  positionExecution: '在管線中的階段位置，以及此審查涵蓋該階段的第幾次執行。修訂會增加執行次數。',
  status: '待處理的審查正在等候人員；其他狀態則顯示審查的結束方式。',
  decision: '審查決定後，顯示為核准、要求變更或拒絕。',
  decisionSource: '決定者：人員、此階段的審查逾時，或管線執行停止。',
  comment: '傳給下一個階段的備註（核准）、階段重新執行時採用的意見（要求變更），或原因（拒絕）。',
  decidedBy: '決定此審查的人員。',
  expiresUtc: '審查逾時並由此階段逾時動作決定的時間。若等候到人員決定則為空白。',
  pipelineRunId: '此審查所屬的管線執行。按一下資料列即可開啟其階段時間軸。',
  runId: '輸出正在接受審查的階段執行。請先開啟並閱讀結果再做決定。',
  decidedUtc: '審查被決定的時間。',
  id: '審查識別碼（prv_...）。可搭配 API、MCP 工具與 SDK 使用以決定審查。',
  filters: { decisionSource: '只顯示以特定方式決定的審查：由人員、由審查逾時，或由管線執行停止。' },
  actions: {
    approve: '核准階段輸出並讓管線繼續，可選擇附上給下一個階段的備註。',
    requestChanges: '依據你的意見重新執行此階段。每次要求都會用掉此階段的一次修訂。',
    reject: '拒絕階段輸出。管線執行會以「審查遭拒絕」的結果失敗。',
    openStageRun: '開啟接受審查的階段執行，閱讀其對話紀錄與結果。'
  }
};
tips.pipelineReviews = {
  revisionsLeft: '在只剩「核准」與「拒絕」之前，此階段還可以要求變更幾次。',
  decide: {
    decision: '選擇如何處理階段輸出。送出後管線執行會立即繼續。',
    Approve: '接受階段輸出；管線會繼續下一個階段，若為最後一個階段則成功結束。',
    RequestChanges: '附上意見將階段退回。它會重新執行，並再次送來審查。',
    Reject: '拒絕階段輸出。管線執行會停止並失敗。',
    commentApprove: '選填的備註，下一個階段會連同此階段的輸出一起收到。',
    commentRequestChanges: '必填的意見。此階段會依據它重新執行，因此請說明要變更什麼。',
    commentReject: '選填的原因，會與決定一起儲存並記錄在稽核紀錄中。',
    submitApprove: '立即核准此階段。此決定為最終決定，之後無法變更。',
    submitRequestChanges: '立即送出意見。此階段會重新執行，其下一次輸出會再次送來審查。',
    submitReject: '立即拒絕此階段。管線執行會失敗；此操作無法復原，但可以重試。'
  }
};
tips.pipelineStart = {
  input: '交給管線的任務。第一個階段會處理它，之後每個階段都會將其視為原始任務，並與先前的輸出一起參考。',
  submit: '以此輸入啟動管線執行，並開啟其階段時間軸。'
};
tips.pipelinePreview = {
  input: '用來轉譯每個階段提示的範例呼叫端輸入。不會執行任何內容。',
  sampleOutput: '階段 {{stage}} 的假設輸出，在預覽中會交給其後的階段。',
  render: '以這些範例轉譯每個階段提示，呈現階段執行實際會收到的內容。祕密會被遮蔽。',
  stage: '此階段會收到的提示，由其交接範本搭配上方範例轉譯而成。',
  rendered: '此階段提示已成功轉譯，沒有錯誤。',
  failed: '此階段提示無法轉譯；訊息會說明原因，例如缺少代理程式或部署。'
};
Object.assign(tips.views.runDetail, {
  pipelineRun: '此執行是某個管線執行的一個階段。ID 後面的文字標示階段位置與執行次序。',
  openPipelineRun: '開啟此執行所屬的管線執行，查看其階段時間軸與審查。'
});
tips.views.pipelineRunDetail = {
  viewJson: '以 JSON 顯示完整的管線執行，包括其階段、階段執行與審查。',
  delete: '刪除此已結束的管線執行及其審查。其階段執行會保留在「執行」頁面。',
  live: '只要階段或審查有變更，更新就會透過即時連線立即送達。',
  polling: '無法使用即時連線，因此頁面每隔幾秒會重新讀取管線執行。',
  pipeline: '此執行所執行的管線，以及開始時的版本。按一下即可在「代理程式 > 管線」下找到它。',
  openPipeline: '開啟「代理程式 > 管線」，並篩選為此管線。',
  openRun: '開啟此階段執行，查看其對話紀錄、結果與遙測。',
  finalRun: '最後一個階段的執行。其結果即為管線執行的結果。',
  started: '第一個階段執行建立的時間。',
  input: '啟動管線執行時使用的輸入。每個階段都會將其視為原始任務。',
  reviewTitle: '有階段已完成並等候你的決定。請先在階段執行中閱讀其輸出，再做決定。',
  stages: '依執行順序列出每個階段，以及其狀態、執行次數、嘗試、修訂、階段執行與審查。',
  current: '管線執行目前所在的階段。',
  reviewGate: '此階段會等候人員審查其輸出，管線才會繼續。',
  agent: '此階段執行的代理程式，以管線執行開始時的紀錄為準。',
  counts: '執行次數計算此階段的每次執行；嘗試次數計算上次審查後的執行；修訂次數計算要求變更的次數。',
  reviewItem: '此階段某一次執行的審查，以及其決定方式。',
  columns: {
    execution: '此執行是該階段的第幾次執行。失敗後的重試與審查後的修訂都會增加執行次數。',
    run: '階段執行。按一下即可開啟其對話紀錄與結果。',
    status: '此階段執行目前的狀態，例如排隊中、執行中或已完成。',
    outcome: '此階段執行結束的原因。',
    error: '階段執行失敗時的錯誤訊息。',
    created: '此階段執行建立的時間。'
  }
};
tips.views.settings.fields.Runtime.PipelineSweepIntervalMs = '領導者多久執行一次以下工作（毫秒）：推進錯過完成訊號的管線執行、重試受阻的階段啟動，以及套用審查逾時與管線時間限制。';
tips.views.settings.fields.Runtime.PipelineMaxStages = '管線定義最多可有的階段數。儲存階段數超過此值的管線會遭拒絕。';
tips.views.settings.fields.Runs = Object.assign(tips.views.settings.fields.Runs || {}, {
  DelegationChildQueueDepth: '整個叢集中，父執行正在等待的已排隊委派執行的最大數量。超過此數量後，開始等待另一個委派執行的執行會立即以 DelegationCapacityExhausted 失敗。',
  DelegationRetryAfterSeconds: '等待的委派因 DelegationCapacityExhausted 遭拒絕時，Retry-After 中建議的秒數。'
});
Object.assign(explainers, {
  pipelines: {
    title: '管線與階段',
    p1: '管線會串連代理程式。每個階段執行一個代理程式（可選擇使用固定部署），並透過提示範本將其輸出（文字、結構化輸出與成品參照）交給下一個階段。',
    p2: '階段可以重試失敗的執行、在失敗後繼續，以及等候審查。審查會顯示在「核准 > 階段審查」下；要求變更會讓階段依據意見重新執行。',
    p3: '編輯管線會建立新版本。已開始的管線執行會保留開始時的階段。'
  },
  pipelineRuns: {
    title: '管線執行',
    p1: '管線執行會依序執行某個管線版本的各個階段。每次階段執行都是一般的執行，可從階段時間軸連結過去。',
    p2: '「取消」會停止目前的階段執行並關閉待處理的審查。「重試」會從停止的階段繼續失敗、逾時或已取消的管線執行。'
  },
  pipelineReviews: {
    title: '階段審查',
    p1: '需要審查的階段完成後會在這裡等候。「核准」會繼續下一個階段，「要求變更」會依據你的意見重新執行此階段，「拒絕」則會使管線執行失敗。',
    p2: '沒有逾時的審查會等候到人員決定。設有逾時時，時間一到就由此階段的逾時動作決定。'
  }
});
tips.views.settings.fields.Scheduling = Object.assign(tips.views.settings.fields.Scheduling || {}, {
  QueueWakeFanout: "對於新排入佇列的執行，每個副本喚醒的等待中 worker lease 請求數量，只在其 worker 能接手該執行的請求中選擇。無法接手的請求會把執行交給下一個請求。0 表示如同以往，喚醒所有副本上所有相符的請求。預設 1。",
  RemoteWakeDelayMs: "當發起的副本已為某個執行喚醒了自己的一個 lease 請求時，其他副本在喚醒自己的請求之前等待的時間 (毫秒)。執行被接手，或該副本已沒有能接手的請求時，會提前結束。0 表示立即在每個副本上各喚醒一個請求。預設 250。"
});
tips.views.settings.fields.Auth = Object.assign(tips.views.settings.fields.Auth || {}, {
  CacheSeconds: "每個副本保留其為驗證請求而讀取的工作階段、租用戶、使用者與憑證的時間 (秒)。透過 API 撤銷權杖，或變更使用者、憑證、角色或租用戶，會立即在所有副本生效；此值是以其他方式所做的變更可能未被察覺的最長時間。0 表示關閉快取。預設 5。"
});

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
})(tips, {
 "nav": {
  "tabs": {
   "triggers": "不需呼叫端即可啟動執行：在指定時區計算的 cron 排程，以及接受其他系統 HMAC 簽章要求的 Webhook 網址。",
   "notifications": "通知其他系統：執行或管線結束、或核准等待人員處理時，Garrison 會 POST 一則簽章的 JSON 通知。"
  }
 },
 "filters": {
  "type": "只顯示 cron 觸發器或只顯示 Webhook 觸發器。選擇全部可同時顯示。",
  "outcome": "只顯示啟動了執行、失敗或遭略過的觸發。",
  "deliveryStatus": "只顯示處於某種狀態的傳遞：等待中、傳送中、已送達或已放棄。"
 },
 "enums": {
  "triggerType": {
   "Cron": "依五欄位 cron 排程觸發，由控制平面領導者在觸發器的時區中計算。",
   "Webhook": "當以觸發器密鑰簽章的要求抵達其 Webhook 網址時觸發。"
  },
  "triggerTargetType": {
   "Agent": "每次觸發為代理程式排入一次執行，使用固定部署或依流量權重選擇。",
   "Pipeline": "每次觸發啟動一次包含所有階段的管線執行。"
  },
  "triggerFireSource": {
   "Cron": "cron 排程時間到，領導者執行了觸發。",
   "Webhook": "收到一筆簽章正確的 Webhook 傳遞。",
   "Manual": "有人或某個認證使用了「立即觸發」。"
  },
  "triggerFireOutcome": {
   "Started": "這次觸發建立了執行或管線執行；點選連結查看。",
   "Failed": "沒有啟動任何內容：範本失敗、執行身分失去權限，或目標不存在。",
   "Skipped": "錯過該次排程的時間超過 cron 補觸發上限，因此未觸發。"
  },
  "notificationEvent": {
   "RunSucceeded": "執行以成功狀態結束時傳送。",
   "RunFailed": "執行失敗或遭拒絕時傳送。",
   "RunCancelled": "執行在結束前遭取消時傳送。",
   "RunTimedOut": "執行超過期限而遭停止時傳送。",
   "PipelineCompleted": "管線執行的所有階段都成功時傳送。",
   "PipelineFailed": "管線執行失敗、逾時或遭取消時傳送。",
   "ApprovalRequested": "工具呼叫核准或管線階段審查等待人員處理時傳送。",
   "Test": "只由「傳送測試」動作傳送，用來檢查端點是否正常。"
  },
  "notificationDeliveryStatus": {
   "Pending": "等待下一次嘗試；失敗的嘗試會以遞增的間隔重試。",
   "Delivering": "某個控制平面複本正在傳送。",
   "Succeeded": "端點回應 2xx 狀態，通知已完成。",
   "Failed": "Garrison 已停止嘗試：嘗試次數用完，或端點回應了不會重試的狀態。"
  },
  "runKind": {
   "Invoke": "由呼叫端透過 REST、MCP、A2A 或儀表板啟動。",
   "Delegated": "由另一個代理程式透過 Garrison 委派啟動。",
   "Test": "從儀表板或 API 對某個部署進行的測試執行。",
   "Retry": "有人重試先前執行所產生的新嘗試。",
   "Pipeline": "管線執行中的一次階段執行。",
   "Trigger": "由 cron 排程、簽章 Webhook 或觸發器的手動觸發啟動。"
  },
  "auditEventType": {
   "SigningSecretRotated": "有人取代了觸發器或通知端點的簽章密鑰，舊密鑰已失效。"
  }
 },
 "resources": {
  "runs": {
   "triggerId": "啟動此執行的觸發器。點選可開啟該觸發器的觸發紀錄。",
   "kind": "執行的啟動方式：呼叫端、另一個代理程式、測試、重試、管線階段或觸發器。",
   "openTrigger": "開啟啟動此執行之觸發器的觸發紀錄。"
  },
  "triggers": {
   "add": "建立 cron 排程或簽章 Webhook，不需任何人呼叫即可啟動代理程式或管線。",
   "type": "Cron 依排程觸發；Webhook 在其他系統傳送簽章要求時觸發。建立後無法變更。",
   "target": "每次觸發所啟動的內容：代理程式執行或管線執行。",
   "schedule": "cron 運算式及其時區，或表示觸發器在等待 Webhook 傳遞的說明。",
   "lastFire": "觸發器上次觸發的時間，以及那次觸發是否啟動了執行。",
   "nextFireUtc": "啟用中的 cron 觸發器下次觸發的時間。Webhook 觸發器與未啟用的觸發器沒有此項。",
   "fireCount": "此觸發器的觸發次數，包括失敗與略過的觸發。",
   "runAs": "此觸發器所啟動執行使用的使用者或認證身分。每次觸發都會檢查其是否仍可執行目標。",
   "signingSecretLast4": "Webhook 簽章密鑰的最後四個字元，方便辨識傳送端使用的是哪個密鑰。",
   "targetType": "每次觸發是執行一個代理程式，還是啟動整條管線。",
   "agentId": "每次觸發要執行的代理程式。您需要有執行它的權限。",
   "deploymentId": "將執行固定到代理程式的某個部署；留白則依流量權重選擇。",
   "pipelineId": "每次觸發要啟動的管線。您需要有啟動它並執行其階段代理程式的權限。",
   "inputTemplateId": "將觸發（時間、酬載、傳遞 ID）轉換為執行輸入的提示範本。",
   "priority": "此觸發器所啟動執行在佇列中的優先順序，範圍 -100 到 100。數值越大越先分配。",
   "cronExpression": "觸發的時間，使用五欄位 cron 運算式或 @hourly 等巨集。",
   "timeZone": "解讀 cron 運算式所用的 IANA 時區，例如 Asia/Taipei。",
   "webhook": "將簽章的 POST 要求傳送到這裡。簽章遺失、過期或錯誤的要求會以 401 拒絕。",
   "actions": {
    "fire": "立即觸發一次（可附測試酬載），並查看它所啟動的執行。",
    "fires": "查看此觸發器何時、為何觸發，以及每次觸發啟動了哪個執行。",
    "runs": "開啟已篩選為此觸發器所啟動執行的執行清單。",
    "rotateSecret": "產生新的 Webhook 簽章密鑰。舊密鑰會立即失效。"
   },
   "fires": {
    "firedUtc": "處理這次觸發的時間。cron 觸發也會顯示對應的排程時間。",
    "source": "觸發原因：排程、Webhook 傳遞或人員操作。",
    "outcome": "這次觸發是啟動了執行、失敗還是遭略過。",
    "started": "這次觸發建立的執行或管線執行。點選即可開啟。",
    "deliveryId": "Webhook 要求的 X-Garrison-Delivery 標頭；相同值的重複要求只觸發一次。",
    "error": "這次觸發沒有啟動任何內容的原因，附穩定的錯誤代碼。",
    "runId": "這次觸發建立的執行。點選即可開啟。",
    "pipelineRunId": "這次觸發啟動的管線執行。點選即可開啟。"
   }
  },
  "notifications": {
   "add": "註冊一個 URL，在此租用戶發生所選事件時接收簽章的 HTTP POST。",
   "url": "Garrison 傳送通知的位址。私人與中繼資料位址會遭拒，且不跟隨重新導向。",
   "events": "此端點接收的事件。將滑鼠移到值上可查看全部。",
   "filters": "用來限定傳送哪些執行與核准事件的代理程式或部署篩選。",
   "signingSecretLast4": "簽章密鑰的最後四個字元，方便接收端辨識是哪個密鑰簽章。",
   "includeResultText": "執行通知是否包含結果文字，並依設定的上限截斷。",
   "agentId": "只傳送此代理程式執行的事件。設定篩選時不傳送管線事件。",
   "deploymentId": "只傳送此部署執行的事件。設定篩選時不傳送管線事件。",
   "resultTextMaxChars": "通知中包含的結果文字的最大字元數。",
   "actions": {
    "test": "立即傳送測試通知，並顯示端點是否接受。",
    "deliveries": "查看傳送到此端點的所有通知，包含嘗試次數、HTTP 狀態與錯誤。",
    "rotateSecret": "產生新的簽章密鑰。已排入佇列的重試也會以它簽章。"
   },
   "deliveries": {
    "createdUtc": "事件為此端點排入佇列的時間。點選可查看詳細資料。",
    "event": "此通知回報的事件。",
    "status": "通知是等待中、傳送中、已送達還是已放棄。",
    "attempts": "目前已嘗試的次數與最多嘗試次數。",
    "lastStatusCode": "最近一次嘗試時端點回應的 HTTP 狀態；沒有回應時為空白。",
    "lastError": "最近一次嘗試發生的問題，例如逾時或目的地遭拒。",
    "lastAttemptUtc": "最近一次嘗試傳送此通知的時間。",
    "nextAttemptUtc": "下次重試的時間；傳遞結束後為空白。",
    "deliveredUtc": "端點接受此通知的時間。",
    "payload": "每次嘗試傳送的完整 JSON 本文，絕不包含密鑰。",
    "id": "傳遞識別碼，也會以 X-Garrison-Delivery 傳送，方便接收端忽略重複。"
   }
  }
 },
 "views": {
  "runDetail": {
   "trigger": "啟動此執行的觸發器，以及執行的啟動方式。",
   "openTrigger": "在「代理程式 > 觸發器」中開啟此觸發器的觸發紀錄。"
  },
  "pipelineRunDetail": {
   "trigger": "啟動此管線執行的觸發器。其階段執行也記錄同一個觸發器。"
  },
  "settings": {
   "groups": {
    "Triggers": "觸發器 Webhook 的限制、停機後的 cron 補觸發，以及觸發紀錄的保留期間。",
    "Notifications": "外送通知的傳遞：SSRF 防護、重試與等待、逾時，以及傳遞紀錄的保留期間。"
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Webhook 要求本文的最大位元組數。超過的傳遞會在檢查簽章前回應 413。",
     "WebhookToleranceSeconds": "簽章時間戳記與伺服器時鐘的最大差距。過舊的傳遞會遭拒，因此攔截到的要求無法重送。",
     "CronMaxLatenessSeconds": "錯過的 cron 排程會合併為一次觸發；若最近一次早於此秒數，則記為已略過。0 表示一律觸發一次。",
     "FireRetentionDays": "觸發紀錄在刪除前保留的天數。"
    },
    "Notifications": {
     "AllowPrivateDestinations": "允許迴路與私人網路上的通知 URL。為防止伺服器端要求偽造而預設關閉；連結本機與中繼資料位址一律封鎖。",
     "MaxAttempts": "一則通知在放棄前最多的傳遞嘗試次數。",
     "InitialBackoffSeconds": "第二次嘗試前的等待時間；之後每次加倍，直到最長等待時間。",
     "MaxBackoffSeconds": "一則通知兩次嘗試之間的最長等待時間。",
     "TimeoutSeconds": "一次傳遞嘗試（包含連線）允許的秒數。",
     "DispatchIntervalMs": "每個控制平面複本尋找到期通知的間隔，單位為毫秒。",
     "SweepOverlapSeconds": "領導者每次重新讀取的已掃描歷程秒數，避免漏掉延遲寫入的事件。",
     "DeliveryRetentionDays": "已結束的傳遞在紀錄中保留的天數。"
    }
   }
  }
 },
 "signingSecret": {
  "done": "關閉此視窗。密鑰無法再次顯示，請先複製。",
  "secret": "簽章密鑰。傳送端與接收端用它計算 HMAC-SHA256 簽章。",
  "copy": "將簽章密鑰複製到剪貼簿，以便存到另一個系統中。",
  "url": "其他系統 POST 簽章 Webhook 傳遞的網址。",
  "copyUrl": "將 Webhook 網址複製到剪貼簿。"
 },
 "triggerFire": {
  "submit": "立即以此酬載觸發一次。執行會以觸發器的執行身分啟動。",
  "body": "選填的酬載文字。輸入範本以 webhook.body 讀取，若為 JSON 也可透過 webhook.json 讀取。",
  "contentType": "酬載的媒體類型，例如 application/json。純文字請留白。",
  "openRun": "開啟這次觸發所啟動的執行。",
  "openPipelineRun": "開啟這次觸發所啟動的管線執行。"
 },
 "triggerFires": {
  "refresh": "重新載入此觸發器的最新觸發紀錄。"
 },
 "notificationDeliveries": {
  "refresh": "重新載入此端點的最新傳遞。",
  "open": "在清單下方顯示此傳遞的酬載、嘗試次數與最近錯誤。",
  "detail": "所選傳遞的所有欄位，包括已傳送的 JSON 本文。"
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
})(explainers, {
 "triggers": {
  "title": "觸發器",
  "p1": "觸發器不需任何人呼叫即可啟動代理程式執行或管線執行：依 cron 排程，或在其他系統傳送以觸發器密鑰簽章的 Webhook 時。",
  "p2": "執行輸入來自提示範本，可使用觸發時間與 Webhook 酬載。執行會以最後儲存觸發器的使用者或認證身分進行，每次觸發都會檢查其是否仍可執行目標。",
  "p3": "如果一段時間內沒有複本能觸發某個排程，錯過的排程會合併為一次觸發。X-Garrison-Delivery 值重複的 Webhook 傳遞只會觸發一次。"
 },
 "notifications": {
  "title": "通知",
  "p1": "當訂閱的事件發生時（執行或管線結束，或核准等待人員處理），通知端點會收到簽章的 JSON POST。",
  "p2": "傳遞會持久排入佇列，並以遞增的間隔重試。每次嘗試都帶有相同的傳遞 ID，接收端可據此忽略重複。",
  "p3": "通知絕不包含密鑰或執行輸入，只有在您允許時才包含執行輸出。除非維運人員允許，否則私人網路位址會遭拒。"
 }
});

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
})(tips, {
 "components": {
  "transcriptExport": {
   "menu": "將此對話記錄下載為檔案：包括輸入、助理文字、工具呼叫、核准、錯誤、用量與費用，密鑰已隱藏。",
   "markdown": "下載易讀的 Markdown 對話記錄，適合分享或附加到工單。",
   "json": "將對話記錄下載為具型別的 JSON 文件 (garrison.transcript/v1)，供指令碼和其他工具使用。",
   "includeThinking": "一併包含模型的思考事件。由於內容冗長且屬內部資訊，預設不包含。"
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "此代理程式有輸入結構描述，因此其輸入是 JSON 文件。請填寫表單，或切換到原始 JSON。",
    "modeForm": "使用依代理程式輸入結構描述產生的表單編輯輸入。",
    "modeJson": "以原始 JSON 文字編輯輸入。切回表單時會保留這些值。",
    "field": "{{name}} 的值，依代理程式輸入結構描述的說明填寫。",
    "fieldWithDescription": "{{name}}：{{description}}",
    "addItem": "在此清單中新增一個項目。",
    "removeItem": "從清單中移除此項目。",
    "jsonLabel": "作為執行輸入送出的 JSON 文件。必須符合代理程式的輸入結構描述。"
   }
  },
  "manifests": {
   "bundle": {
    "scopeAll": "匯出此租用戶擁有的所有資源。除非選擇包含，否則不含內建資源。",
    "scopeSelected": "只匯出選取的類型與資源，並可選擇包含其相依的資源。",
    "kinds": "匯出勾選類型的所有資源。",
    "kind": "匯出此租用戶中的所有 {{kind}}。",
    "resources": "要匯出的特定資源，寫成 類型/名稱，例如 Agent/triage 或 Pipeline/release。",
    "followReferences": "一併匯出選取內容所相依的資源：部署、harness 設定檔、提示範本、工作區、MCP 伺服器、觸發程序與通知端點。密鑰只列為前提條件，絕不匯出。",
    "includeBuiltIn": "加入套件參照的內建提示範本與 harness 設定檔。套用時不會變更它們，只會檢查它們是否存在。"
   }
  }
 }
});

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
})(tips, {
 "enums": {
  "agentRevisionState": {
   "Draft": "尚未發佈的修訂。每個代理程式只有一個開啟中的草稿；發佈之前沒有任何部署會執行它。",
   "Published": "已凍結的修訂。跟隨最新修訂或釘選此修訂的部署會執行它。"
  },
  "promotionKind": {
   "Promote": "將某個環境的部署釘選到取自前一個環境的修訂。",
   "Rollback": "將推進所取代的修訂釘選完全還原為先前的狀態。"
  },
  "promotionOutcome": {
   "Applied": "此記錄設定的釘選仍然有效。",
   "RolledBack": "之後的復原已還原此次推進所取代的釘選。"
  },
  "revisionChangeType": {
   "Changed": "此欄位在較新的修訂中有不同的值。",
   "Added": "此欄位或清單項目只存在於較新的修訂中。",
   "Removed": "此欄位或清單項目只存在於較舊的修訂中。"
  }
 },
 "filters": {
  "environment": "只顯示某個環境（例如 dev、staging 或 prod）中的部署。套用於已載入的頁面。"
 },
 "resources": {
  "deployments": {
   "environment": "此部署所屬的環境。推進會依租用戶的順序將修訂從一個環境移到下一個環境。",
   "agentRevisionId": "此部署執行的代理程式修訂。「最新」會跟隨每個新發佈的修訂；釘選的修訂會一直保留，直到變更或推進。",
   "environmentBadge": "此部署在 {{environment}} 環境中執行。",
   "followsLatest": "未釘選：此部署執行代理程式最新發佈的修訂。",
   "pinnedRevision": "已釘選：在釘選變更之前，此部署執行 {{revision}}。",
   "actions": {
    "promote": "將代理程式的修訂從一個環境推進到下一個環境，並更新該處每個部署的釘選。",
    "promotions": "檢視過去的推進與復原，並復原某次推進以還原先前的釘選。"
   }
  }
 },
 "views": {
  "agentDetail": {
   "reviewDraft": "開啟「修訂」分頁，將草稿與最新發佈的修訂比較，然後發佈或捨棄它。",
   "tabs": {
    "revisions": "此代理程式已儲存的每個修訂：任意比較兩個修訂，發佈草稿或將其捨棄。"
   },
   "columns": {
    "environment": "部署所屬的環境，供推進使用。",
    "revision": "部署執行的修訂：「最新」跟隨每次發佈，數字表示釘選。"
   }
  }
 },
 "revisions": {
  "columns": {
   "number": "修訂編號。此代理程式每儲存一個修訂，編號就會增加。",
   "state": "草稿仍可變更；已發佈的修訂已凍結。",
   "author": "儲存此修訂的人：建立或最後取代它的使用者或存取金鑰。",
   "changeNote": "發佈修訂時記錄的變更內容與原因。",
   "publishedUtc": "修訂的發佈時間。草稿為空白。",
   "actions": "比較、發佈或捨棄修訂。"
  },
  "latest": "最新發佈的修訂。沒有釘選的部署會執行此修訂。",
  "compare": "顯示此修訂與其前一個已發佈修訂之間的變更。",
  "publish": "發佈此草稿，使其成為最新發佈的修訂。",
  "discard": "刪除此草稿。已發佈的修訂不受影響。",
  "discardConfirm": "永久刪除草稿。此動作無法復原。",
  "from": "比較中較舊的一方：其值顯示為「之前」。",
  "to": "比較中較新的一方：其值顯示為「之後」。",
  "publishSubmit": "立即發佈草稿。跟隨最新修訂的部署會從下一次執行起使用它。",
  "changeNote": "與已發佈修訂一起儲存並顯示在修訂清單中的選填說明。最多 2000 個字元。",
  "diffColumns": {
   "field": "有差異的修訂欄位，例如 description 或 promptPins。",
   "change": "此欄位是被變更、新增還是移除。",
   "before": "較舊修訂中的值。",
   "after": "較新修訂中的值。"
  }
 },
 "promote": {
  "agent": "要推進其修訂的代理程式。它在目標環境中的部署會被更新。",
  "revision": "保留來源修訂即推進來源環境正在執行的修訂，或選擇一個已發佈的修訂。",
  "source": "修訂所來自的環境。",
  "target": "要更新的環境。預設為租用戶順序中來源之後的環境。",
  "allowSkip": "當目標不是下一個環境時必須開啟。略過的環境會與推進一起記錄。",
  "note": "與推進記錄一起儲存的選填備註。最多 2000 個字元。",
  "submit": "立即套用推進。目標環境中此代理程式的每個部署都會取得新的釘選。"
 },
 "promotions": {
  "agentFilter": "只顯示某個代理程式的推進與復原。",
  "refresh": "從伺服器重新載入推進記錄。",
  "columns": {
   "createdUtc": "套用推進或復原的時間。",
   "kind": "推進，或對先前某次推進的復原。",
   "outcome": "釘選是否仍然有效，或之後已被復原。",
   "agent": "其部署被更新的代理程式。",
   "revision": "被推進的修訂。",
   "environments": "推進的來源與目標環境。",
   "deployments": "每個被更新的部署，以及其之前與之後的釘選。",
   "actor": "套用推進或復原的人。",
   "note": "建立記錄時填寫的備註。",
   "actions": "復原已套用的推進。"
  },
  "skipped": "此次推進至少略過了一個環境，因此需要開啟「允許略過環境」。",
  "rollback": "還原這些部署在此次推進之前的修訂釘選。",
  "rollbackConfirm": "立即套用復原。它會記錄在推進記錄中。",
  "rollbackNote": "與復原記錄一起儲存的選填備註。最多 2000 個字元。"
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
})(tips, {
 "enums": {
  "agentAssetKind": {
   "SystemPrompt": "代理程式的系統提示，由提示範本提供。沒有上傳的檔案。",
   "Skill": "Harness 載入的技能資料夾，放在 Harness 設定檔指定的技能位置。",
   "ReferenceFile": "代理程式在執行期間可讀取的檔案，放在執行的工作區中。",
   "DocumentTemplate": "代理程式在執行期間填寫的文件範本，例如 .docx 或 .dotx 檔案。"
  },
  "runOutcome": {
   "AssetIntegrityFailed": "某個資產檔案未通過 SHA-256 檢查，或在啟動前無法下載，因此 Harness 從未啟動。"
  }
 },
 "resources": {
  "agentAssets": {
   "add": "建立新資產。之後將其檔案上傳為一個版本，再釘選到代理程式修訂上。",
   "name": "資產在此租用戶中的唯一名稱。修訂與資訊清單可用此名稱參照資產。",
   "kind": "系統提示、技能、參考檔案或文件範本。資產建立後即固定。",
   "currentVersion": "最新的版本。跟隨目前版本的釘選會從下一次執行起使用它。",
   "description": "以淺白文字說明資產內容與使用它的代理程式。",
   "tags": "用於尋找與分組資產的標籤。對執行沒有影響。",
   "artifactStoreId": "資產檔案的存放位置。Garrison 資料庫表示檔案保存在控制平面資料庫中。",
   "promptTemplateId": "提供系統提示資產文字的提示範本。僅系統提示需要。",
   "databaseStore": "檔案存放在 Garrison 資料庫中，而非外部成品存放區。",
   "kindFilter": "只顯示某一類型的資產：系統提示、技能、參考檔案或文件範本。",
   "actions": {
    "versions": "開啟版本記錄：瀏覽檔案、預覽文字檔、下載檔案，以及上傳新版本。"
   }
  }
 },
 "revisions": {
  "columns": {
   "assetPins": "此修訂釘選的資產，每個都固定在某個版本，或跟隨資產的目前版本。"
  }
 },
 "assets": {
  "files": "從您的電腦選擇一或多個檔案。檔案會在瀏覽器中讀取，並一起上傳為一個版本。",
  "path": "檔案在資產內的位置，使用以正斜線分隔的相對路徑，例如 docs/guide.md。",
  "uploadColumns": {
   "path": "每個檔案在資產內的路徑。如有需要，請在上傳前編輯。",
   "mediaType": "瀏覽器回報的媒體類型。留空時伺服器會依副檔名判斷。",
   "size": "從您電腦讀取的檔案大小。",
   "actions": "在送出前將檔案從此次上傳中移除。"
  },
  "removeFile": "將此檔案從上傳中移除。在您上傳之前不會送出任何內容。",
  "changeNote": "選填的說明，與新版本一起儲存並顯示在版本記錄中。最多 2000 個字元。",
  "upload": "將選擇的檔案上傳為一個新版本。若檔案完全相同，則改為傳回目前版本。",
  "current": "這是資產的目前版本，供跟隨目前版本的釘選使用。",
  "showFiles": "顯示此版本的檔案，以及其大小、摘要、預覽與下載。",
  "versionColumns": {
   "number": "版本編號。每次上傳不同的檔案都會新增下一個編號。",
   "author": "上傳此版本的人。",
   "changeNote": "上傳此版本時提供的說明。",
   "totalBytes": "此版本中所有檔案的合計大小。",
   "createdUtc": "此版本的上傳時間。",
   "actions": "顯示某個版本的檔案。"
  },
  "fileColumns": {
   "path": "檔案在資產內的路徑，也就是執行時放置的位置。",
   "mediaType": "與檔案一起儲存的媒體類型。",
   "sizeBytes": "此版本中該檔案的大小。",
   "sha256": "檔案 SHA-256 摘要的開頭。工作節點會在執行開始前檢查它。",
   "actions": "就地預覽文字檔，或下載任何檔案。"
  },
  "sha256Full": "此檔案完整的 SHA-256 摘要：{{sha}}",
  "preview": "在檔案清單下方以唯讀方式顯示此文字檔。此處無法編輯。",
  "download": "將此版本的此檔案下載到您的電腦。",
  "pinsSave": "將這些資產釘選儲存到草稿。之後請發佈草稿，部署才會使用它們。",
  "pinAsset": "要釘選到此修訂的資產。每個資產只能釘選一次。",
  "pinVersion": "釘選固定版本，或選擇「目前版本」以在執行時使用資產的最新版本。",
  "removePin": "從修訂的釘選中移除此資產。",
  "addPin": "在修訂的釘選中新增另一個資產。",
  "editPins": "新增、移除或變更此草稿修訂的資產釘選。",
  "pinsNewDraft": "以最新發佈的修訂為基礎建立新草稿，並選擇其資產釘選。",
  "pinnedVersion": "此資產釘選在固定版本，因此有新的上傳後，執行仍會繼續使用該版本。",
  "pinnedCurrent": "此資產跟隨其目前版本，因此執行會使用最新的上傳。"
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
})(tips, {
 "views": {
  "conversationDetail": {
   "tabs": {
    "turns": "此對話的各輪 (從最早開始)，以及傳送下一輪的輸入框。",
    "files": "此對話的每一輪和每個受委派的代理程式都會讀寫的共用資料夾，附有版本歷程和下載。"
   }
  },
  "runDetail": {
   "fileSpace": "此執行在開始時複製到工作區、在結束時寫回的共用檔案空間。同一對話、管線執行或委派樹中的執行會共用它。",
   "openFiles": "開啟此執行所屬對話的「檔案」分頁，瀏覽、下載或上傳共用檔案。"
  }
 },
 "resources": {
  "deployments": {
   "fileSpaceMountPath": "執行工作區中同步共用檔案空間的資料夾，例如 files。使用以正斜線分隔的相對路徑，最多 128 個字元。"
  }
 },
 "files": {
  "summary": "共用資料夾中目前檔案的數量及其總大小。已刪除的檔案不計入。",
  "live": "只要某一輪、受委派的代理程式或某個人變更了檔案，清單就會立即更新。",
  "polling": "即時連線無法使用，因此在此分頁開啟期間，清單每 {{seconds}} 秒重新載入一次。",
  "includeDeleted": "同時列出已刪除的檔案。它們的版本會保留，仍可下載。",
  "refresh": "立即從伺服器重新載入檔案清單。",
  "columns": {
   "path": "檔案在共用資料夾中的路徑。執行時可在部署的檔案空間資料夾下找到它。",
   "currentVersion": "最新版本。每一輪、代理程式或上傳每寫入一次就增加一個版本。",
   "sizeBytes": "檔案目前版本的大小。",
   "mediaType": "與目前版本一起儲存的媒體類型。",
   "lastUpdateUtc": "檔案最後一次變更的時間。",
   "actions": "檢視版本歷程、下載目前版本或刪除檔案。"
  },
  "deleted": "此檔案已刪除。之後的各輪看不到它，但其版本會保留。",
  "versions": "開啟此檔案的版本歷程，每個版本都可下載並預覽文字。",
  "download": "透過短時間有效的連結下載此檔案的目前版本。",
  "delete": "從共用資料夾中刪除此檔案。其版本會保留。",
  "confirmDelete": "立即刪除檔案。之後的各輪將看不到它。",
  "versionColumns": {
   "number": "版本號碼。每次寫入都會使用下一個號碼。",
   "sizeBytes": "此版本中檔案的大小。",
   "mediaType": "與此版本一起儲存的媒體類型。",
   "sha256": "此版本 SHA-256 摘要的開頭部分。工作節點同步檔案時會驗證它。",
   "writtenBy": "寫入此版本的執行所屬的代理程式，或上傳它的人。",
   "createdUtc": "此版本的寫入時間。",
   "actions": "就地預覽文字版本，或下載任何版本。"
  },
  "current": "這是之後各輪看到的版本。",
  "sha256Full": "此版本完整的 SHA-256 摘要：{{sha}}",
  "openRun": "開啟寫入此版本的執行。",
  "preview": "在清單下方以唯讀方式顯示此版本。此處無法編輯。",
  "downloadVersion": "將此版本的檔案下載到您的電腦。",
  "chooseFiles": "從您的電腦選擇一個或多個檔案。它們會在瀏覽器中讀取，並逐一上傳。",
  "uploadColumns": {
   "path": "每個檔案在共用資料夾中的位置。如有需要，請在上傳前修改。",
   "replaces": "此上傳取代的清單中版本，或「新檔案」。之後被變更過的檔案會以衝突名稱存放。",
   "size": "從您的電腦讀取的檔案大小。",
   "actions": "在傳送前將檔案從此次上傳中移除。"
  },
  "path": "在共用資料夾中的路徑，使用以正斜線分隔的相對路徑，例如 notes/sources.md。",
  "removeFile": "將此檔案從上傳中移除。在您上傳之前不會傳送任何內容。",
  "upload": "將選擇的每個檔案逐一傳送到共用資料夾，並附上它要取代的版本。"
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
})(tips, {
 "nav": {
  "tabs": {
   "capabilities": "能力目錄：代理程式、MCP 工具與 Harness 內建工具，包含來源、成本與延遲提示，並可重新整理。"
  }
 },
 "filters": {
  "tag": "只顯示帶有此標籤（完全相符）的能力。停止輸入後清單會自動更新。",
  "origin": "只顯示隨來源更新的衍生項目，或只顯示由人員撰寫的手動項目。"
 },
 "enums": {
  "capabilityKind": {
   "Agent": "另一個 Garrison 代理程式，依其最新發佈的修訂描述。負責協調的代理程式可以將工作委派給它。",
   "McpTool": "此租用戶中已註冊之 MCP 伺服器的工具，依該伺服器的工具清單描述。",
   "HarnessBuiltIn": "Harness 可在其工作節點主機上執行的程式，例如 pandoc 或 LibreOffice，由 Harness 設定檔上的工具探測找到。"
  },
  "capabilityOrigin": {
   "Derived": "Garrison 會讓此項目與其來源保持一致。無法在這裡編輯或刪除，請改為變更來源。",
   "Manual": "由人員撰寫的項目，可以在這裡編輯與刪除。"
  },
  "capabilityHintStatus": {
   "Unknown": "提示統計期間內完成的執行太少，無法得出結論，因此不顯示任何數值。MCP 工具與內建工具的提示一律為「未知」。",
   "Known": "提示統計期間內完成的執行數足夠，因此耗時與成本數值都有實際執行作為依據。"
  },
  "runBlockedReason": {
   "NoToolWorker": "受阻：此執行的代理程式使用 Harness 內建工具（例如 pandoc），但沒有任何能執行它的就緒工作節點回報此工具。執行會在佇列中等候，直到有這樣的工作節點註冊為止。"
  }
 },
 "resources": {
  "capabilities": {
   "add": "為 Garrison 無法衍生的東西撰寫手動項目，例如代理程式透過技能使用的轉換服務。",
   "name": "代理程式用來尋找此能力的名稱。代理程式項目以代理程式命名，MCP 工具為 server/tool，內建工具則以工具命名。",
   "kind": "代理程式、MCP 工具或 Harness 內建工具。手動項目可以使用任何類型。",
   "origin": "衍生項目隨來源更新，無法在這裡變更；手動項目由人員撰寫。",
   "summary": "說明此能力的用途與使用時機，代理程式會讀取這段文字。最多 4000 個字元。",
   "source": "項目的來源：代理程式、MCP 伺服器與工具，或 Harness 設定檔以及執行所需的節點標籤。",
   "hints": "根據近期完成的執行計算出的執行耗時中位數、第 90 百分位數與平均成本；完成的執行太少時顯示「未知」。",
   "tags": "用來篩選目錄的標籤。代理程式也可以依標籤篩選。",
   "lastRefreshedUtc": "Garrison 上次從來源重新整理衍生項目的時間。手動項目此欄為空。",
   "sourceAgentId": "選填。此手動項目所代表的 Garrison 代理程式。",
   "sourceMcpServerId": "選填。此手動項目所代表之工具所屬的 MCP 伺服器。",
   "sourceToolName": "該工具在所選 MCP 伺服器上的名稱。",
   "requirements": "工作節點在接下使用此能力的執行前，必須回報的節點標籤，例如 garrison.io/tool-pandoc=true。",
   "inputSchemaJson": "描述此能力接受內容的 JSON Schema。儲存時 Garrison 會檢查它是否為有效的 JSON Schema。",
   "outputSchemaJson": "描述此能力傳回內容的 JSON Schema。儲存時 Garrison 會檢查它是否為有效的 JSON Schema。",
   "kindFilter": "只顯示代理程式、只顯示 MCP 工具，或只顯示 Harness 內建工具。選擇「全部」可查看整個目錄。",
   "originFilter": "只顯示隨來源更新的衍生項目，或只顯示由人員撰寫的手動項目。",
   "tagFilter": "只顯示帶有此標籤（完全相符）的能力。停止輸入後清單會自動更新。",
   "refresh": "立即重新整理衍生項目：代理程式、Harness 內建工具、MCP 伺服器工具與代理程式提示。完成後顯示變更內容與失敗的伺服器。",
   "warnings": "來源無法重新整理的項目會保留最後一次正常的內容，並在詳細資料中顯示原因。",
   "warningBadge": "上次重新整理此項目的來源時失敗，因此顯示的是最後一次正常的內容。原因：{{warning}}"
  },
  "harnessProfiles": {
   "toolProbes": "工作節點主機上有安裝時，此 Harness 可以使用的工具，例如 pandoc。每個工具都會成為能力目錄中的一個 Harness 內建工具。",
   "toolProbesItems": {
    "name": "工具在目錄與節點標籤 garrison.io/tool-{name} 中的名稱：小寫字母、數字、句點與連字號。",
    "executable": "工作節點在其 PATH 上尋找的單純檔案名稱，例如 soffice。不得包含資料夾。",
    "argument": "探測傳入的唯一引數，例如 --version。只允許版本與說明旗標，或不帶引數。",
    "description": "工具的用途，顯示在能力目錄中。最多 1024 個字元。"
   }
  }
 },
 "revisions": {
  "columns": {
   "capabilities": "此修訂依名稱使用的能力。其中的 Harness 內建工具會將其執行限制在回報該工具的工作節點上。"
  }
 },
 "capabilities": {
  "sourceAgent": "開啟代理程式 {{name}}。此項目依它最新發佈的修訂描述。",
  "sourceMcpServer": "在「MCP 伺服器」分頁中開啟 MCP 伺服器 {{name}}。它的工具清單是此項目的來源。",
  "sourceTool": "該工具在 MCP 伺服器上的名稱：{{tool}}。",
  "sourceProfile": "開啟 Harness 設定檔 {{name}}。它的工具探測是此項目的來源。",
  "nodeLabel": "使用此能力的執行只會分派到回報節點標籤 {{label}} 的工作節點。",
  "noSource": "未指名任何代理程式或 MCP 伺服器的手動項目。所有可讀取目錄的執行都看得到它。",
  "hintsUnknown": "提示統計期間內完成的執行太少，無法得出結論，因此不顯示任何數值。這絕不代表零。",
  "hintsKnown_one": "根據過去 {{days}} 天內完成的 {{count}} 次執行彙整。",
  "hintsKnown_other": "根據過去 {{days}} 天內完成的 {{count}} 次執行彙整。",
  "refreshWarning": "Garrison 無法從來源重新整理此項目，因此在下次重新整理成功前，項目會保留最後一次正常的內容。",
  "lockedBanner": "說明為何無法在這裡編輯或刪除此項目，以及應改到哪裡變更。",
  "lockedShared": "由所有租用戶共用：此項目來自內建 Harness 設定檔上的工具探測，因此無法編輯或刪除。若要變更探測，請複製該設定檔。",
  "locked": {
   "Agent": "衍生自代理程式最新發佈的修訂，因此無法在這裡編輯或刪除。請發佈新修訂來變更它；停用代理程式會將它移除。",
   "McpTool": "衍生自 MCP 伺服器的工具清單，因此無法在這裡編輯或刪除。請變更伺服器或其工具，然後重新整理。",
   "HarnessBuiltIn": "衍生自 Harness 設定檔上的工具探測，因此無法在這裡編輯或刪除。請改為變更設定檔的工具探測。"
  },
  "shared": "所有租用戶都看得到此項目。它來自內建 Harness 設定檔上的工具探測。",
  "hintsTitle": "此代理程式近期已完成執行的耗時與成本。MCP 工具與內建工具沒有提示。",
  "requirementsTitle": "工作節點在接下其代理程式使用此能力的執行前，必須回報的節點標籤。",
  "fields": {
   "kind": "代理程式、MCP 工具或 Harness 內建工具。",
   "origin": "衍生項目隨來源更新；手動項目由人員撰寫。",
   "source": "此項目來自的代理程式、MCP 伺服器與工具，或 Harness 設定檔。",
   "lastRefreshedUtc": "Garrison 上次從來源重新整理此項目的時間。手動項目此欄為空。",
   "tags": "用來篩選目錄的標籤。",
   "id": "目錄項目的識別碼，以 cap_ 開頭。",
   "summary": "說明此能力的用途與使用時機，代理程式會讀取這段文字。",
   "hintStatus": "統計期間內完成的執行數足夠時為「已知」，否則為「未知」，此時不顯示任何數值。",
   "sampleSize": "提示彙整了多少次已完成的執行，從最近的開始算。",
   "medianDurationMs": "所彙整執行從開始到完成的時間中位數。",
   "p90DurationMs": "所彙整的執行中，每十次有九次在這段時間內完成。",
   "meanCostUsd": "所彙整且有記錄成本之執行的平均成本（美元）。",
   "windowDays": "提示往回統計的天數（Capabilities.HintWindowDays 設定）。",
   "computedUtc": "維護迴圈或重新整理上次計算提示的時間。",
   "inputSchemaJson": "描述此能力接受內容的 JSON Schema；接受自由文字時則無。",
   "outputSchemaJson": "描述此能力傳回內容的 JSON Schema，或無。"
  },
  "refreshServer": "列出所有啟用中 MCP 伺服器的工具，或只列出單一伺服器的工具。stdio 伺服器會透過工作節點列出。",
  "refreshRun": "立即開始重新整理。MCP 伺服器回應較慢時可能需要一段時間。",
  "refresh": {
   "agents": "此次重新整理建立、更新或移除的代理程式項目。",
   "harnessBuiltIns": "在所有範圍中建立、更新或移除的 Harness 內建工具項目。",
   "hints": "重新計算了成本與延遲提示的代理程式項目。",
   "servers": "此次重新整理嘗試列出的 MCP 伺服器數量。",
   "tools": "從有回應的伺服器寫入的工具項目。",
   "removed": "因伺服器不再列出該工具而移除的工具項目。",
   "failed": "無法列出工具的伺服器。它們的項目會保留最後一次正常的內容。",
   "failedBadge": "無法列出此伺服器的工具。其項目會保留最後一次正常的內容，並附上警告。",
   "listedBadge": "伺服器已回應，其工具項目都是最新的。",
   "columns": {
    "server": "列出工具的 MCP 伺服器。",
    "status": "是否能列出此伺服器的工具。",
    "tools": "為此伺服器寫入的工具項目。",
    "removed": "因伺服器不再列出而移除的工具項目。",
    "warned": "保留最後一次正常內容、現在附有重新整理警告的項目。",
    "error": "列出失敗時的原因。"
   }
  },
  "draftSave": "將這些能力儲存到草稿。之後發佈草稿，部署才會使用它們。",
  "notInCatalog": "目前沒有任何目錄項目使用此名稱。執行仍會開始，但代理程式找不到此能力。",
  "removeName": "從修訂中移除此能力。",
  "chooseName": "依名稱從目錄中挑選能力。多種類型共用的名稱只會列出一次。",
  "addName": "將所選的能力加入修訂。",
  "newDraft": "以最新發佈的修訂為基礎建立新草稿，並選擇它使用的能力。",
  "editDraft": "新增或移除此草稿修訂使用的能力。",
  "revisionName": "此修訂使用能力 {{name}}。代理程式會在目錄中以此名稱找到它。"
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
})(tips, {
 "enums": {
  "fanOutGroupStatus": {
   "Running": "此群組正在等待成員。符合匯合策略、到達截止時間、用完預算或有人取消時，群組就會結束。",
   "Joined": "已符合匯合策略，或所有成員都已結束，因此上層執行可以使用成員的結果。",
   "TimedOut": "在符合匯合策略之前已到截止時間。仍在執行的成員已被取消。",
   "BudgetExceeded": "成員的費用或 Token 數超出了群組的預算。仍在執行的成員已被取消。",
   "Cancelled": "有人取消了此群組，或其上層執行已結束或被取消。仍在執行的成員已被取消。"
  },
  "fanOutJoinPolicy": {
   "All": "每個成員都結束後群組才匯合，不論是否成功。",
   "Any": "只要有一個成員成功，群組就匯合。除非呼叫要求保留，其餘成員會被取消。",
   "Quorum": "指定數量的成員成功後群組匯合；若失敗的成員多到無法達到該數量，也會立即匯合。"
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "此執行所屬的扇出群組。上層執行將它與其他成員一起啟動，並匯合它們的結果。",
   "openFanOutGroup": "在上層執行的執行樹中開啟此扇出群組，查看其他成員、匯合策略和預算。"
  }
 },
 "fanOut": {
  "group": "此執行透過 garrison_fan_out 一起啟動的子執行，依同一策略、預算和截止時間匯合。",
  "otherChildren": "此執行在扇出群組之外逐一委派的子執行。",
  "reason": "此群組結束的原因，依伺服器記錄顯示。",
  "policy": "群組何時算完成：全部等待每個成員，任一等待一次成功，法定數等待指定次數的成功。",
  "progress": "已結束的成員數、成功的成員數，以及群組內的成員總數。",
  "cost": "成員目前記錄的費用；若群組設有最高費用，則與之對照顯示。",
  "costValue": "所有成員記錄的費用總和。模型沒有價格的成員不計入。",
  "tokens": "成員目前使用的輸入和輸出 Token；若群組設有上限，則與之對照顯示。",
  "tokensValue": "所有成員的輸入 Token 與輸出 Token 之和。",
  "budgetBar": "已使用預算的 {{percent}}%。用量超出預算時，群組會以超出預算結束。",
  "deadline": "群組逾時的時間。屆時仍在執行的成員會被取消。",
  "started": "上層執行啟動此群組的時間。",
  "completed": "群組結束並停止等待成員的時間。",
  "pending": "尚未結束的成員的標籤。",
  "failed": "已結束但未成功的成員的標籤。",
  "live": "成員狀態或群組用量一有變化，更新就會透過即時連線送達。",
  "polling": "即時連線無法使用，因此每 {{seconds}} 秒重新載入一次群組。",
  "cancel": "立即取消此群組。仍在執行的成員會被取消，上層執行會收到目前已匯集的結果。",
  "confirmCancel": "取消此群組以及所有仍在執行的成員。此動作無法復原。",
  "openMember": "開啟成員 {{label}} 的執行，查看其紀錄、結果和遙測資料。",
  "columns": {
   "label": "上層執行在啟動群組時為此成員取的名稱。",
   "agent": "此成員執行的代理程式，由上層執行選擇。",
   "status": "成員執行目前的狀態，以及結束時的結果。",
   "costUsd": "此成員執行記錄的費用。",
   "tokens": "此成員執行使用的輸入和輸出 Token。",
   "run": "成員的執行。開啟即可查看紀錄和結果。"
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
})(tips, {
 "nav": {
  "tabs": {
   "apps": "代理式應用程式：在單一終端使用者聊天介面後方的一組代理程式，包含其呼叫圖、委派、修訂、推進與連結。"
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "此租用戶的任何啟用中使用者都可以用電子郵件與密碼登入此應用程式。",
   "AppUsers": "只有在此應用程式上擁有內建 AppUser 角色的租用戶使用者可以登入。請以此應用程式為資源範圍指派此角色。",
   "Anonymous": "任何擁有連結的人都可以不登入就使用此應用程式，但前提是也已開啟匿名使用。"
  }
 },
 "form": {
  "pickColor": "從顏色選擇器選取 {{field}}，不必輸入 #RRGGBB 值。"
 },
 "resources": {
  "apps": {
   "add": "用現有的代理程式建立應用程式：成員、入口代理程式、它們之間的呼叫，以及使用者如何登入。",
   "name": "此應用程式在租用戶中的名稱：小寫字母、數字與連字號。清單與 API 以此名稱參照它。",
   "slug": "URL 名稱，應用程式位於 /apps/{slug}/。在整個叢集中唯一。留空表示使用名稱。",
   "description": "此應用程式的用途。終端使用者會在應用程式的登入頁面看到它。",
   "active": "未啟用的應用程式會保留設定，但其連結與工作階段會停止運作。",
   "url": "應用程式給終端使用者的網址。複製以分享，或開啟以查看終端使用者看到的畫面。",
   "entryAgentId": "與終端使用者對話並開始每段對話的成員。其他成員都從它抵達。",
   "members": "應用程式中的代理程式，每個都可附上角色說明。屬於某個應用程式的代理程式無法刪除。",
   "membersItems": {
    "agentId": "要納入應用程式的此租用戶代理程式。每個代理程式只能成為成員一次。",
    "role": "簡短說明此成員在應用程式中的工作，最多 256 個字元。"
   },
   "edges": "哪個成員可以呼叫哪個成員。這些呼叫共同構成應用程式的圖，並成為每個成員的委派策略。",
   "edgesItems": {
    "callerAgentId": "發出呼叫的成員。",
    "calleeAgentId": "被呼叫的成員。它必須是與呼叫端不同的成員。",
    "fanOutAllowed": "讓呼叫端透過 garrison_fan_out 同時啟動此成員的多個執行。"
   },
   "graph": "以圖片呈現成員與呼叫，唯讀。入口代理程式位於左側；它無法抵達的成員會以紅框標示。",
   "environments": "每個環境中應用程式所使用的入口代理程式部署。推進會讓這些設定保持一致。",
   "environmentsItems": {
    "environment": "此租用戶的環境，例如 dev、staging 或 prod。",
    "deploymentId": "入口代理程式在此環境中的部署。只會列出這些部署。"
   },
   "liveEnvironment": "應用程式聊天介面目前使用的環境。變更它即可將終端使用者切換到另一個環境。",
   "authMode": "租用戶使用者、在此應用程式上擁有 AppUser 角色的使用者，或任何擁有連結的人（需開啟匿名使用）。",
   "anonymousEnabled": "開啟匿名工作階段。只有在此選項開啟且模式為匿名時，匿名登入才有效。",
   "showOperatorDetail": "向終端使用者顯示每一輪的工具呼叫、思考過程與進度，而不只是回答。",
   "share": "要提供給終端使用者的連結，以及依上方所選登入設定可以登入的對象。",
   "displayName": "顯示在應用程式標頭與登入頁面的名稱。留空表示使用應用程式名稱。",
   "logoAssetId": "目前版本包含標誌圖片的代理程式資產。請在「組態」的「代理程式資產」下上傳。",
   "primaryColor": "應用程式介面的主要顏色，格式為 #RRGGBB。留空則保留預設顏色。",
   "accentColor": "應用程式介面用於強調的第二顏色，格式為 #RRGGBB。留空則保留預設顏色。",
   "welcomeText": "終端使用者在傳送第一則訊息前看到的文字，最多 4000 個字元。",
   "id": "應用程式的識別碼。API 與清單接受它，也接受名稱。",
   "lastUpdateUtc": "應用程式設定上次變更的時間。",
   "createdUtc": "應用程式的建立時間。",
   "membersCell": "應用程式的成員：{{names}}。",
   "activeBadge": "此應用程式已啟用：其登入設定允許的人可以使用它的連結。",
   "inactiveBadge": "此應用程式未啟用：設定會保留，但其連結與工作階段無法使用。",
   "steps": {
    "general": "應用程式的名稱、URL 代稱、描述，以及是否啟用。",
    "members": "應用程式中的代理程式、入口代理程式及它們之間的呼叫，並附上圖。",
    "environments": "應用程式在各環境使用的入口部署，以及應用程式目前執行的環境。",
    "access": "誰可以登入、終端使用者是否看到工具呼叫，以及要分享的連結。",
    "branding": "終端使用者看到的顯示名稱、標誌、顏色與歡迎文字。"
   },
   "actions": {
    "delegation": "比較每個成員的已發佈委派與圖的要求，並寫入修正偏移的草稿。",
    "revisions": "列出應用程式的修訂、建立新修訂、發佈它，並將應用程式推進到下一個環境。"
   }
  }
 },
 "apps": {
  "denied": "此操作需要 {{resource}} 的 {{operation}} 權限。請向管理員申請授予此權限的角色。",
  "graph": "應用程式的唯讀圖：成員、它們之間的呼叫，以及入口代理程式可以抵達哪些成員。",
  "url": "應用程式的網址。{{who}}",
  "open": "在新的瀏覽器分頁開啟應用程式，查看終端使用者看到的畫面。{{who}}",
  "copyUrl": "複製應用程式的網址以分享。{{who}}",
  "signIn": {
   "TenantUsers": "此租用戶的任何啟用中使用者都可以登入。",
   "AppUsers": "只有在此應用程式上擁有 AppUser 角色的使用者可以登入。",
   "Anonymous": "任何擁有連結的人都可以不登入就使用。",
   "AnonymousDisabled": "已選擇匿名但尚未開啟，因此只有具備存取權的已登入使用者能進入。"
  },
  "delegation": {
   "apply": "將圖的委派寫入每個偏移成員的草稿修訂。不會發佈任何項目，手動建立的草稿也不受影響。",
   "applyNothing": "每個成員的已發佈委派都已與圖相符，沒有需要寫入的內容。",
   "openAgent": "開啟代理程式 {{name}} 以檢閱並發佈其草稿修訂。",
   "drift": "此成員的已發佈委派與圖的要求不同。請寫入草稿來修正，然後發佈。",
   "inSync": "此成員的已發佈委派與圖相符。",
   "draftConflict": "此成員開啟中的草稿已用其他方式變更委派，因此未予更動。請先發佈或捨棄該草稿。",
   "skipped": "已略過此成員：{{reason}}。",
   "draft": "圖的委派位於此成員的草稿修訂 {{number}} 中。發佈後即會生效。",
   "columns": {
    "member": "成員代理程式。開啟它以檢閱其修訂。",
    "desiredMode": "圖所要求的委派模式：成員呼叫其他成員時為允許清單，不呼叫任何成員時為不委派。",
    "desiredAllowList": "在圖中此成員所呼叫的成員。",
    "desiredMaxDepth": "在圖中此成員下方最長的呼叫鏈。",
    "publishedMode": "成員最新已發佈修訂中的委派模式。",
    "publishedAllowList": "成員最新已發佈修訂中的允許清單。",
    "publishedMaxDepth": "成員最新已發佈修訂中的最大深度。",
    "status": "成員是否偏離圖，以及已寫入的草稿或略過的原因。"
   }
  },
  "revisions": {
   "promote": "推進已發佈的應用程式修訂：所有成員一起移到下一個環境，否則都不移動。",
   "promoteNothing": "請先發佈應用程式修訂。只有已發佈的修訂可以推進。",
   "changeNote": "說明變更內容的備註，會與修訂一起保存。最多 2000 個字元。",
   "take": "建立草稿應用程式修訂，釘選每個成員最新的已發佈修訂並複製呼叫。",
   "latest": "應用程式最新的已發佈修訂，除非你另選，推進時都會使用它。",
   "pin": "此修訂釘選了 {{name}} 的修訂 {{number}}。",
   "publishedBy": "由 {{name}} 於 {{when}} 發佈。",
   "publish": "發佈此草稿應用程式修訂。發佈後即無法變更，且可以推進。",
   "publishConfirm": "立即發佈修訂。發佈後無法再編輯。",
   "columns": {
    "number": "修訂編號，此應用程式從 1 開始遞增。",
    "state": "發佈前為草稿。只有已發佈的修訂可以推進。",
    "members": "此應用程式修訂所釘選的成員修訂。",
    "edges": "此修訂複製了多少個成員之間的呼叫。",
    "author": "建立此修訂的人。",
    "changeNote": "建立修訂時寫下的說明。",
    "publishedUtc": "修訂的發佈時間與發佈者。",
    "actions": "發佈草稿修訂。"
   }
  },
  "promote": {
   "submit": "立即推進。每個成員在目標環境中的部署都會取得釘選的修訂，否則不會有任何變更。",
   "revision": "要推進的已發佈應用程式修訂。除非你另選，否則使用最新的一個。",
   "source": "推進的來源環境，通常是應用程式目前執行的環境。",
   "target": "推進的目標環境。預設為來源之後的環境。"
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
})(tips, {
 "nav": {
  "tabs": {
   "studio": "代理程式工作室：你與代理程式架構師一起設計、在試驗場中試用並請人套用的代理程式和應用程式草稿。"
  }
 },
 "enums": {
  "approvalKind": {
   "DraftApply": "將工作室草稿套用到即時設定的申請。允許後，草稿中的所有文件會作為一次清單套用而套用。"
  },
  "studioDraftStatus": {
   "Open": "你和代理程式架構師可以編輯、驗證此草稿，在試驗場中試用它，並送交核准。",
   "PendingApproval": "草稿正在等待套用核准的決定，在此之前會被凍結。遭拒絕後會重新變為可編輯。",
   "Applied": "草稿已作為一次清單套用而套用到即時設定，無法再變更。",
   "Discarded": "草稿已被捨棄，無法再變更，待處理的套用核准也已取消。"
  },
  "studioDraftOperation": {
   "Upsert": "套用草稿時會建立該資源；如果資源已存在，則會更新它。",
   "Delete": "套用草稿時會刪除該資源。只有代理程式、部署、管線和應用程式可以用這種方式刪除。"
  },
  "studioDiffChange": {
   "Create": "該資源尚不存在，因此套用草稿時會建立它。",
   "Update": "該資源已存在且內容不同，因此套用草稿時會更新所列欄位。",
   "Delete": "套用草稿時會刪除此資源。",
   "Unchanged": "此文件與即時設定一致，因此套用它不會變更任何內容。",
   "Failed": "此文件未通過驗證。詳細資料會說明原因；請在申請套用前修正它。"
  }
 },
 "views": {
  "studio": {
   "newDraft": "從空白或現有應用程式開始一份草稿，並開啟它的工作區。",
   "refresh": "從伺服器重新讀取草稿清單。",
   "search": "尋找標題包含此文字的草稿。搜尋由伺服器執行。",
   "scope": "只顯示你自己的草稿，或顯示租用戶中你可以讀取的所有草稿。",
   "scopes": {
    "mine": "只顯示你開始的草稿，或架構師為你開始的草稿。",
    "all": "顯示租用戶中你可以讀取的所有草稿，不論由誰開始。"
   },
   "statusChip": "顯示狀態為 {{status}} 的草稿。未選擇狀態時，會顯示所有狀態。",
   "columns": {
    "title": "草稿的標題。開啟後可看到包含架構師、項目、關係圖和套用的工作區。",
    "status": "可編輯的草稿可以變更；等待核准的草稿在等待套用決定；已套用和已捨棄的草稿為最終狀態。",
    "owner": "開始此草稿的人。架構師只處理正在與它對話的人的草稿。",
    "targetApp": "草稿所設計的應用程式。關係圖操作和試驗場預設會使用它。",
    "items": "草稿包含的清單文件數量，每個資源一份。",
    "version": "草稿每次變更都會加一。每次編輯都會註明它讀取的版本。",
    "updated": "草稿最後一次變更的時間。"
   },
   "openDraft": "開啟草稿的工作區：架構師聊天、項目、關係圖、差異與套用、試驗場和預覽。",
   "discard": "確認後捨棄草稿。之後它將無法再變更或套用。",
   "discardPending": "確認後捨棄草稿。其待處理的套用核准會被取消。"
  },
  "studioDraft": {
   "version": "每次變更都會提升版本。編輯會傳送它讀取的版本，因此不會有人覆寫他人的變更。",
   "live": "已連線到草稿的即時通道，因此其他人和架構師所做的變更會立即顯示。",
   "polling": "即時通道無法使用，因此頁面每隔幾秒會重新讀取一次草稿。",
   "back": "返回工作室草稿清單。",
   "viewJson": "依伺服器傳回的原樣顯示草稿，包括所有項目和畫布版面配置。",
   "architect": "此工作區對話的架構師部署。請在「架構師」分頁中選擇。",
   "dismissNotice": "隱藏這則關於草稿最新變更的通知。",
   "tabs": {
    "architect": "與代理程式架構師對話，它會替你編輯此草稿。",
    "items": "草稿中的清單文件，每份文件都有對應的編輯器。",
    "graph": "草稿中應用程式、呼叫、委派深度和能力的唯讀圖示。",
    "apply": "將草稿與即時設定比較、驗證草稿，並申請套用。",
    "playground": "在發布任何內容之前，分多輪執行草稿中的代理程式。",
    "preview": "編譯一個部署，查看它的命令列、放置的資產和檔案空間掛接。",
    "prompts": "選擇並編輯代理程式架構師使用的提示。"
   }
  }
 },
 "studio": {
  "notOpen": "此草稿的狀態為 {{status}}，只有可編輯的草稿才能變更。",
  "newDraft": {
   "titleField": "草稿的簡短名稱，會顯示在清單中並告知架構師。留空則使用預設標題。",
   "fromApp": "從現有應用程式及其參照的所有內容開始，或從空白草稿開始。",
   "create": "建立草稿並開啟它的工作區。即時設定不會變更。"
  },
  "architect": {
   "name": "此租用戶中新架構師部署的名稱，例如 architect。",
   "harnessProfileId": "架構師執行所用的 Harness，例如 Claude Code。需要有能執行它的工作節點。",
   "model": "Harness 為架構師使用的模型。留空則使用 Harness 設定檔的預設值。",
   "promptId": "架構師使用的 System 提示。內建提示排在前面，其複本排在後面。",
   "preview": "以範例值轉譯的所選提示，與架構師收到的內容相同。",
   "cloneLink": "在提示範本畫面開啟此提示，你可以在那裡複製它並編輯複本。",
   "create": "建立一個具有草稿存取權並使用所選提示的 agent-architect 部署。",
   "noAgent": "此租用戶沒有 agent-architect 代理程式，因此無法建立架構師。"
  },
  "chat": {
   "title": "與代理程式架構師就此草稿進行的對話。它編輯草稿，由你核准套用。",
   "architect": "要對話的架構師部署。選擇另一個會開始新的對話。",
   "newArchitect": "建立架構師部署：Harness 設定檔、模型和架構師提示。",
   "openConversation": "在獨立頁面中開啟此對話，每一輪都顯示為一次執行。",
   "newConversation": "在此瀏覽器中忘記此對話，並在下一則訊息時開始新的對話。",
   "you": "你在這一輪中傳送給架構師的內容。",
   "architectSays": "架構師對這一輪的回答。它對草稿所做的變更會顯示在其他分頁中。",
   "openRun": "開啟這一輪的執行，包含其對話紀錄和呼叫的工具。",
   "message": "你希望架構師設計或變更的內容。草稿的 ID 會隨第一則訊息一起傳送。",
   "send": "將訊息傳送給架構師。本輪結束後，回答會顯示在這裡。",
   "sendBusy": "架構師仍在處理上一則訊息。請等它完成。",
   "sendNoArchitect": "傳送訊息前，請先選擇或建立一個架構師部署。"
  },
  "items": {
   "title": "草稿中的清單文件，每個資源一份，以種類和名稱作為索引鍵。",
   "add": "在草稿中新增文件。在編輯器中儲存時才會儲存。",
   "addConfirm": "以此種類和名稱的起始文件開啟編輯器。",
   "kind": "文件的清單種類，例如 Agent 或 Deployment。",
   "name": "資源名稱，必須與文件內的名稱相符。",
   "operation": "套用時建立或更新該資源，或是刪除它。",
   "stale": "草稿依據此文件之後，即時設定是否已變更。",
   "updated": "此項目在草稿中最後一次變更的時間。",
   "staleBadge": "草稿從此文件開始之後，即時設定已變更。請在套用前重訂。",
   "editItem": "在編輯器中開啟此文件以變更並儲存。",
   "viewItem": "在編輯器中開啟此文件以閱讀。草稿目前無法變更。",
   "remove": "確認後從草稿中移除此文件。即時設定不會變更。",
   "editor": "以清單 YAML 呈現的文件。儲存時會傳送你讀取的版本。",
   "document": "純清單 YAML。其種類和名稱必須與項目相符。",
   "save": "依你讀取的版本將文件儲存到草稿中。",
   "closeEditor": "關閉編輯器。未儲存的文字將會遺失。",
   "dismissConflict": "隱藏這則關於導致儲存遭拒之變更的通知。"
  },
  "graph": {
   "title": "草稿中應用程式的唯讀圖示：成員、呼叫、委派深度和能力。",
   "app": "草稿包含或參照的應用程式，從其入口代理程式開始繪製。",
   "deletedApp": "套用草稿時會刪除此應用程式。",
   "draftedApp": "草稿包含此應用程式的文件，因此關係圖顯示的是草稿中的版本。",
   "deletedAgent": "套用草稿時會刪除此代理程式。",
   "loose": "草稿中不屬於其任何應用程式的代理程式。",
   "legend": "如何閱讀關係圖：標籤、線條樣式，以及每個代理程式下方的能力。"
  },
  "diff": {
   "title": "每份文件與即時設定的比較、驗證結果，以及套用草稿的申請。",
   "refresh": "再次將所有文件與即時設定比較。",
   "validate": "對草稿執行清單試執行。不會變更任何內容，結果會依項目顯示。",
   "requestApply": "驗證草稿並建立套用它的核准。在做出決定前，草稿會被凍結。",
   "columns": {
    "item": "文件的種類和名稱。",
    "change": "套用草稿會對此資源做什麼。",
    "details": "會變更的欄位，或文件未通過驗證的原因。"
   },
   "approval": "決定是否套用此草稿的核准。",
   "openApproval": "開啟核准，查看完整摘要和差異。",
   "reason": "你允許或拒絕此草稿的原因，會與決定一起記錄。",
   "allow": "允許核准：草稿會再次驗證，並作為一次清單套用而套用。",
   "deny": "拒絕核准：不會套用任何內容，草稿會重新變為可編輯。"
  },
  "playground": {
   "title": "在發布任何內容之前，分多輪試用草稿中的代理程式。",
   "agent": "要執行的代理程式。預設為草稿目標應用程式的入口代理程式。",
   "input": "代理程式在這一輪中應該做什麼。",
   "send": "將代理程式的文件儲存為其草稿修訂版本，並在試驗場中執行。",
   "sendBusy": "上一輪仍在執行。請等它完成。",
   "openRun": "開啟該執行，查看其執行樹、扇出群組和對話中的檔案。",
   "conversation": "開啟試驗場對話，每一輪都顯示為一次執行。",
   "export": "將試驗場的各輪內容下載為 Markdown 檔案。",
   "reset": "從下一輪開始新的試驗場對話。"
  },
  "preview": {
   "title": "在部署之前以範例輸入編譯一個部署。祕密值會被遮蔽。",
   "deploymentId": "要編譯的部署。",
   "agentRevisionId": "取代部署本身修訂版本來編譯的代理程式修訂版本，例如草稿修訂版本。",
   "environment": "改為編譯該代理程式在此環境中的部署，而不是所選的部署。",
   "input": "用來轉譯編譯後提示的範例輸入。",
   "compile": "編譯部署，並顯示命令列、資產和檔案空間。",
   "compileNoDeployment": "請先選擇要編譯的部署。",
   "commandLine": "工作節點將啟動的命令，已依 shell 規則加上引號以便顯示。",
   "assets": "Harness 啟動前，修訂版本的資產會寫入的位置。",
   "columns": {
    "path": "檔案的放置位置，相對於執行的目錄。",
    "asset": "檔案來源的代理程式資產。",
    "kind": "資產的用途，例如技能或參考檔案。",
    "version": "修訂版本所固定的資產版本。",
    "size": "放置的檔案大小。"
   },
   "fileSpace": "對話的共用檔案空間，以及執行會在哪裡看到它。"
  },
  "prompts": {
   "title": "代理程式架構師可以使用的提示，以及每個架構師正在使用哪一個。",
   "templatesLink": "開啟已依架構師提示篩選的提示範本畫面。",
   "columns": {
    "name": "提示範本的名稱。內建範本以 builtin/ 開頭。",
    "description": "簡要說明此提示讓架構師在哪些方面有所不同。",
    "version": "提示的目前版本。每次儲存都會加一。",
    "usedBy": "使用此提示的架構師部署數量。將游標移到上方可查看它們的名稱。"
   },
   "defaultBadge": "除非選擇了其他提示，新的架構師部署都會使用此提示。",
   "selectedBadge": "{{architect}} 目前使用的提示。",
   "select": "將此設為目前架構師的提示。會從架構師的下一輪開始生效。",
   "alreadySelected": "目前的架構師已在使用此提示。",
   "selectNoArchitect": "請先在「架構師」分頁中選擇架構師；所做的選擇會套用到該部署。",
   "clone": "將此提示複製到一個可以編輯的新範本中。",
   "edit": "編輯名稱、說明和內文。每次儲存都會產生新版本。",
   "delete": "確認後刪除此提示。被部署使用的提示無法刪除。",
   "builtInLocked": "內建提示無法編輯或刪除。請複製此提示並修改複本。",
   "editor": "編輯提示並預覽。跟隨目前版本的架構師會從下一輪開始使用儲存的內容。",
   "closeEditor": "關閉編輯器。未儲存的文字將會遺失。",
   "name": "此範本在該租用戶中的名稱，必須保持唯一。",
   "description": "簡短說明此提示讓架構師做什麼。",
   "body": "提示文字，可包含範本變數，以及對片段（例如 builtin/agent-architect-design）的引用。",
   "preview": "以範例值轉譯的內文，與架構師收到的內容相同。",
   "save": "將編輯儲存為提示的新版本。"
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
})(tips, {
 "views": {
  "studioDraft": {
   "tabs": {
    "graph": "在畫布上編輯草稿的應用程式：代理程式、呼叫、入口代理程式、屬性，以及每個環境的執行階段設定。"
   }
  }
 },
 "studio": {
  "graph": {
   "title": "以可編輯畫布呈現的草稿應用程式，包含其代理程式、呼叫和委派深度。"
  },
  "canvas": {
   "title": "以可編輯關係圖呈現的草稿應用程式。每項變更都會立即存入草稿；套用草稿之前，任何內容都不會上線。",
   "appPicker": "草稿包含多個應用程式時，畫布要顯示的應用程式。",
   "node": "應用程式的代理程式。拖曳可移動它，從右側邊緣拖曳可連接它，或將焦點移到它上面並使用鍵盤快速鍵。",
   "nodeReadOnly": "應用程式的代理程式。草稿目前無法變更，因此畫布為唯讀。",
   "addAgent": "輸入代理程式名稱，或從租用戶和草稿的代理程式中選擇一個，然後按 Enter。",
   "role": "選填的說明，描述此代理程式在應用程式中負責的工作，會與其成員資格一起保存。",
   "add": "讓代理程式成為 {{app}} 的成員。第一個成員會成為入口代理程式。",
   "connect": "從 {{name}} 開始一個呼叫，然後選擇它要呼叫的代理程式。",
   "needAgent": "請先在畫布上選取一個代理程式。",
   "needCall": "請先選取一個呼叫：在畫布上按一下它，或在呼叫清單中選擇。",
   "alreadyEntry": "{{name}} 已經是入口代理程式。",
   "setEntry": "讓選取的代理程式負責與使用應用程式的人對話。",
   "remove": "確認後，將選取的代理程式連同其呼叫從應用程式移除。",
   "disconnect": "刪除選取的呼叫。兩個代理程式仍會留在應用程式中。",
   "fit": "縮放和平移畫面，讓應用程式的每個代理程式都可見。",
   "connectTo": "呼叫端可以呼叫的代理程式。",
   "fanOut": "開啟：呼叫端可以同時對此代理程式發起多個呼叫（扇出）。關閉：一次一個呼叫。",
   "connectConfirm": "讓 {{from}} 呼叫 {{to}}，並將此呼叫存入草稿。",
   "connectNoTarget": "應用程式中還沒有其他可呼叫的代理程式。",
   "connectCancel": "停止連接，不新增呼叫。",
   "keys": "顯示在畫布上可用的按鍵。",
   "calls": "以文字列出應用程式的每個呼叫。這些按鈕是用鍵盤選取和變更呼叫的方式。",
   "call": "選取此呼叫。Delete 會中斷連接，F 會開啟或關閉平行呼叫。",
   "callReadOnly": "選取此呼叫以檢視其屬性。草稿目前無法變更。",
   "addLoose": "讓 {{name}} 成為 {{app}} 的成員，以便連接它。",
   "retry": "以剛讀取的草稿版本，再次送出遭拒絕的變更。",
   "dismissError": "隱藏這則關於遭拒絕變更的訊息。",
   "panel": {
    "properties": "代理程式本身的文件：描述、結構描述、資產和能力。",
    "runtime": "代理程式在每個環境中的部署：模型、限制、提示和核准。",
    "save": "以你讀取的版本，將這些欄位寫入草稿項目。不會有任何內容上線。",
    "reset": "回到草稿目前保存的值。",
    "nothingToSave": "尚未有任何變更，因此沒有內容可儲存。",
    "nothingToReset": "尚未有任何變更，因此沒有內容可復原。"
   },
   "agent": {
    "title": "此草稿中代理程式文件的欄位。儲存時會重寫其 Agent 項目。",
    "bring": "將代理程式的即時文件（或新文件）複製到草稿中，以便編輯。",
    "description": "代理程式的用途，會顯示給使用者以及呼叫它的代理程式。",
    "inputSchema": "代理程式輸入必須符合的 JSON Schema。留空表示輸入為純文字。",
    "outputSchema": "代理程式結構化輸出所遵循的 JSON Schema。留空表示沒有結構化輸出。",
    "assets": "下一個修訂要釘選的代理程式資產（技能、參考資料、範本），依名稱及選填的版本指定。",
    "assetName": "此租用戶中代理程式資產的名稱。",
    "assetVersion": "要釘選的版本。留空則跟隨資產的最新版本。",
    "removeAsset": "儲存時，從代理程式的下一個修訂中移除此釘選。",
    "addAsset": "在代理程式的下一個修訂中再釘選一個代理程式資產。",
    "capabilities": "代理程式使用的能力，例如工作節點必須具備的主機工具（pandoc、git）。",
    "systemPrompt": "系統提示是依部署設定的，因此每個環境都可以使用自己的系統提示。",
    "showRuntime": "開啟代理程式的部署，在那裡編輯系統提示及其版本。"
   },
   "edge": {
    "title": "選取的呼叫：誰呼叫誰、扇出，以及它需要的委派深度。",
    "from": "發起此呼叫的代理程式。",
    "to": "此呼叫抵達的代理程式。",
    "depth": "呼叫端進行此呼叫需要多少層委派，由關係圖計算得出。"
   },
   "app": {
    "title": "此草稿中應用程式文件的欄位。儲存時會重寫其 AgenticApp 項目。",
    "entry": "負責與使用應用程式的人對話的成員。變更會立即儲存。",
    "bring": "將應用程式的即時文件複製到草稿中，以便編輯其登入方式和品牌。",
    "description": "應用程式的用途，會顯示在主控台的應用程式清單中。",
    "authMode": "誰可以登入應用程式：租用戶使用者、應用程式使用者，或任何人（匿名）。",
    "anonymous": "在登入模式允許時，讓使用者無須登入即可使用應用程式。",
    "branding": "應用程式的聊天頁面在使用者眼中的外觀。",
    "brandingFields": {
     "displayName": "應用程式標頭中的名稱。留空則使用應用程式的名稱。",
     "logo": "一個代理程式資產，其第一張圖片會成為應用程式的標誌。",
     "primaryColor": "應用程式頁面的主要色彩，以十六進位值表示。",
     "accentColor": "應用程式頁面的第二種色彩，以十六進位值表示。",
     "welcomeText": "使用者開啟應用程式時最先看到的內容。"
    }
   },
   "runtime": {
    "title": "此草稿中代理程式的部署，一次一個環境。",
    "deployment": "選擇要編輯的環境部署。儲存時只會變更該部署的項目。",
    "live": "此代理程式目前正在執行但不在草稿中的部署。將其中一個帶入草稿即可變更。",
    "bring": "將 {{name}} 的即時文件複製到草稿中，作為新項目。",
    "approvals": "此部署的執行在進行工具呼叫時是否要等候人員核准，以及優先決定結果的規則。",
    "fields": {
     "model": "Harness 使用的模型，例如 sonnet。留空則使用 Harness 設定檔的預設值。",
     "effort": "Harness 傳遞的推理投入程度，例如 high。留空則由 Harness 決定。",
     "timeoutSeconds": "執行在被停止前可持續的時間，以秒為單位。",
     "maxTurns": "執行在停止前可使用的模型回合數。",
     "maxBudgetUsd": "執行在被 Harness 停止前可花費的金額，以美元計。",
     "systemTemplate": "用作系統提示的提示範本，以名稱指定。留空則使用內建預設值。",
     "systemVersion": "要釘選的範本版本。留空則跟隨其最新版本。",
     "approvalsEnabled": "開啟：沒有規則允許的工具呼叫會在「核准」中等候人員處理。",
     "approvalDefaultAction": "沒有規則符合的工具呼叫會如何處理：允許、拒絕，或詢問人員。"
    },
    "rule": {
     "action": "此規則對符合的工具呼叫採取的動作。",
     "pattern": "此規則符合哪些工具呼叫，例如 Bash(git *)。",
     "inputPattern": "工具呼叫的輸入也必須符合的選填模式。",
     "remove": "儲存時刪除此規則。",
     "add": "新增規則；規則會依序檢查，第一個符合的規則決定結果。"
    }
   }
  }
 }
});
