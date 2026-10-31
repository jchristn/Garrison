// Japanese catalog for the Garrison app UI. Mirrors en.js key for key.

const ja = {
  common: {
    loading: '読み込み中',
    close: '閉じる',
    cancel: 'キャンセル',
    retry: 'もう一度試す',
    defaultTitle: 'Garrison アプリ'
  },
  app: {
    notFoundTitle: 'アプリが見つかりません',
    notFoundBody: 'このアドレスにはアプリがありません。受け取ったリンクを確認してください。',
    noSlugTitle: 'アプリが選択されていません',
    noSlugBody: '特定のアプリへのリンクを開いてください。アプリのリンクは /apps/your-app/ のような形式です。',
    loadErrorTitle: 'アプリを読み込めませんでした',
    loadErrorBody: 'サーバーから応答がありません。接続を確認して、もう一度お試しください。',
    skipToChat: '会話へ移動'
  },
  signIn: {
    title: '{{name}} にサインイン',
    email: 'メールアドレス',
    password: 'パスワード',
    submit: 'サインイン',
    submitting: 'サインインしています',
    anonymous: 'サインインせずに続ける',
    anonymousNote: 'サインインせずに始めた会話は、このブラウザーのタブにだけ残ります。',
    or: 'または',
    poweredBy: 'Garrison Agent Studio で構築',
    sessionEnded: 'セッションが終了しました。続けるにはもう一度サインインしてください。'
  },
  header: {
    conversations: '会話',
    files: 'ファイル',
    signOut: 'サインアウト',
    signedInAs: '{{name}} としてサインイン中',
    guest: 'ゲスト',
    themeLight: 'ライトテーマに切り替える',
    themeDark: 'ダークテーマに切り替える',
    language: '言語',
    logoAlt: '{{name}} のロゴ'
  },
  conversations: {
    title: '会話',
    new: '新しい会話',
    empty: 'まだ会話はありません。メッセージを送ると会話が始まります。',
    untitled: '{{date}} の会話',
    messages: 'メッセージ: {{count}} 件',
    working: '処理中',
    loadError: '会話を読み込めませんでした。'
  },
  chat: {
    welcomeDefault: '質問を入力して始めましょう。',
    composerLabel: 'メッセージ',
    composerPlaceholder: 'メッセージを入力',
    composerHint: 'Enter で送信、Shift と Enter で改行します。',
    send: '送信',
    sending: '送信中',
    you: 'あなた',
    waiting: 'エージェントが対応しています',
    approval: 'オペレーターによる手順の承認を待っています',
    reconnecting: '接続が切れました。再接続しています',
    failed: 'この応答は完了しませんでした。',
    details: 'エージェントのアクティビティ',
    loadError: 'この会話を読み込めませんでした。',
    missing: 'その会話は見つかりませんでした。別のセッションのものかもしれません。',
    busyComposer: 'エージェントがまだ回答中です。終わったら次のメッセージを送信できます。',
    dismiss: '閉じる'
  },
  statuses: {
    Pending: '開始待ち',
    Queued: '開始待ち',
    Leased: '開始中',
    Running: '処理中',
    Cancelling: '停止中',
    Succeeded: '完了',
    Failed: '失敗',
    Cancelled: 'キャンセル済み',
    TimedOut: 'タイムアウト',
    Rejected: '許可されていません',
    Suspended: '一時停止中'
  },
  detailTypes: {
    Thinking: '思考',
    ToolCall: 'ツール呼び出し',
    ToolResult: 'ツールの結果',
    Progress: '進行状況',
    Warning: '警告'
  },
  activity: {
    title: 'エージェントの動作 ({{count}})',
    thinking: '思考',
    thinkingNow: '考えています',
    ask: '{{agent}} に依頼中',
    askMany: '{{agents}} に同時に依頼中',
    askSeveral: '複数のエージェントに同時に依頼中',
    gather: '回答をまとめています',
    check: '別のエージェントの状況を確認中',
    tool: '{{tool}} を使用中',
    running: '実行中',
    done: '完了',
    failed: '失敗',
    sent: '送信内容',
    returned: '返された内容',
    nothing: 'なし',
    waiting: '応答を待っています'
  },
  copy: {
    copy: 'コピー',
    copied: 'コピーしました',
    failed: 'ブラウザーがコピーを許可しませんでした',
    message: '自分のメッセージをコピー',
    answer: '回答をコピー'
  },
  telemetry: {
    title: 'この回答の実行内容',
    model: 'モデル',
    ttft: '最初のトークンまでの時間',
    streaming: 'ストリーミング時間',
    tools: 'ツールにかかった時間',
    delegation: '他のエージェントの待ち時間',
    approval: '承認の待ち時間',
    queue: 'ワーカーの待ち時間',
    execution: '実行時間',
    total: '合計時間',
    inputTokens: '入力トークン',
    outputTokens: '出力トークン',
    cachedTokens: 'キャッシュ済みトークン',
    reasoningTokens: '推論トークン',
    rate: '出力速度',
    rateValue: '{{value}} トークン/秒',
    toolCalls: 'ツール呼び出し',
    cost: 'コスト'
  },
  files: {
    title: 'ファイル',
    empty: 'この会話では、エージェントはまだファイルを書き込んでいません。',
    noConversation: '会話が始まると、エージェントが書き込んだファイルがここに表示されます。',
    summary: 'ファイル: {{count}} 件 ({{size}})',
    download: 'ダウンロード',
    versions: 'バージョン',
    versionsTitle: '{{path}} のバージョン',
    version: 'バージョン {{number}}',
    current: '最新',
    updated: '更新: {{when}}',
    size: 'サイズ',
    newBadge: '新規',
    downloadFailed: 'ダウンロードを開始できませんでした。もう一度お試しください。',
    loadError: 'ファイルを読み込めませんでした。',
    versionsError: 'バージョンを読み込めませんでした。',
    close: 'ファイルを閉じる'
  },
  errors: {
    InvalidCredentials: 'メールアドレスまたはパスワードが正しくありません。',
    AppSignInRequired: 'このアプリを使うにはサインインしてください。',
    AnonymousDisabled: 'このアプリは匿名では利用できません。サインインしてください。',
    AppAccessDenied: 'このアカウントにはこのアプリへのアクセス権がありません。アプリの所有者にアクセスを依頼してください。',
    AppSessionRequired: 'セッションが終了しました。続けるにはもう一度サインインしてください。',
    ConversationBusy: 'エージェントはまだ前のメッセージに回答中です。終わるのを待ってから、もう一度送信してください。',
    AppRateLimited: 'メッセージの送信が速すぎます。1 分ほど待ってから、もう一度お試しください。',
    AppNotDeployed: 'このアプリはまだ準備ができていません。しばらくしてからもう一度お試しください。',
    NetworkError: 'サーバーに接続できませんでした。接続を確認して、もう一度お試しください。',
    generic: '問題が発生しました (HTTP {{status}})。もう一度お試しください。'
  },
  tips: {
    email: 'このアプリで使うアカウントのメールアドレスを入力します。',
    password: 'アカウントのパスワードです。セッションを開始するためにこのサーバーにだけ送信されます。',
    submit: 'メールアドレスとパスワードを確認して、アプリを開きます。',
    anonymous: 'ゲストとしてアプリを使います。会話はこのブラウザーのタブを開いている間だけ残ります。',
    language: 'アプリの表示言語を選びます。選んだ言語はこのブラウザーに保存されます。',
    themeLight: '明るい配色を使います。この設定はブラウザーに保存され、システムの設定より優先されます。',
    themeDark: '暗い配色を使います。この設定はブラウザーに保存され、システムの設定より優先されます。',
    signOut: 'このデバイスでのセッションを終了し、サインイン画面に戻ります。',
    conversationsToggle: 'あなたの会話の一覧を表示したり、非表示にしたりします。',
    filesToggle: 'この会話でエージェントが書き込んだファイルの一覧を表示したり、非表示にしたりします。',
    newConversation: '新しい会話を始めます。これまでの会話は一覧にそのまま残ります。',
    conversation: 'この会話を開いて、前回やり取りを止めたところから続きを再開します。',
    composer: 'エージェントへのメッセージを入力します。Enter で送信、Shift と Enter で改行します。',
    send: 'メッセージをエージェントに送ります。回答は書かれると同時に下に表示されます。',
    dismiss: 'このお知らせを画面から消して、表示しないようにします。',
    retry: 'アプリをもう一度最初から読み込み直して、表示を試みます。',
    download: 'このファイルの最新バージョンをお使いのデバイスに保存します。',
    versions: 'このファイルのすべてのバージョンを表示し、以前のものをダウンロードできます。',
    downloadVersion: 'このバージョンのファイルをお使いのデバイスに保存します。',
    closeDialog: 'このダイアログを閉じて、元の会話の画面にそのまま戻ります。',
    closeFiles: 'ファイルのパネルを閉じて、元の会話の画面にそのまま戻ります。',
    details: 'エージェントが回答中に行った手順 (ツール呼び出し、進行状況、警告) を表示します。',
    answerLink: '回答内のリンクを新しいタブで開きます: {{href}}',
    tableHeader: '回答に含まれる表の列見出しです: {{text}}',
    poweredBy: 'usegarrison.ai を新しいタブで開き、このアプリが動いているプラットフォーム Garrison Agent Studio について確認します。',
    skipToChat: 'ヘッダーと会話一覧を飛ばして、メッセージの入力欄へ直接移動します。',
    activityRunning: 'このステップはまだ実行中です。結果が返ってくると、ここにすぐ表示されます。',
    activityDone: 'このステップは完了しました。開くと送信内容と返された内容を確認できます。',
    activityFailed: 'このステップは失敗しました。開くと送信内容と返されたエラーを確認できます。',
    activityStep: 'このステップでエージェントが送った内容と返ってきた内容を表示します。'
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
})(ja, {
  "conversations": {
    "filter": "名前で絞り込む",
    "sort": "会話の並べ替え",
    "noMatch": "条件に合う会話はありません。",
    "renameLabel": "新しい名前",
    "save": "保存",
    "cancel": "キャンセル",
    "rename": "{{title}} の名前を変更",
    "delete": "{{title}} を削除",
    "confirmDelete": "「{{title}}」を削除しますか? 元に戻せません。",
    "deleteConfirm": "削除",
    "sorts": {
      "recent": "新しい順",
      "oldest": "古い順",
      "nameAsc": "名前 (昇順)",
      "nameDesc": "名前 (降順)"
    }
  },
  "files": {
    "sort": "ファイルの並べ替え",
    "sorts": {
      "newest": "新しい順",
      "oldest": "古い順",
      "largest": "大きい順",
      "smallest": "小さい順",
      "nameAsc": "名前 (昇順)",
      "nameDesc": "名前 (降順)"
    }
  },
  "layout": {
    "resizeConversations": "会話一覧の幅を変更",
    "resizeFiles": "ファイル一覧の幅を変更"
  },
  "tips": {
    "conversationFilter": "名前にこの文字を含む会話だけを、一覧に絞り込んで表示します。",
    "conversationSort": "会話の並び順を選びます。活動の新しさか名前で並べます。",
    "conversationRenameInput": "新しい名前を入力し、Enter で保存、Escape でキャンセルします。",
    "conversationRenameSave": "入力した新しい名前をこの会話に保存して一覧に表示します。",
    "conversationRenameCancel": "名前を変えずに、この会話の今の名前のままにします。",
    "conversationRename": "この会話に新しい名前を付けて、あとで見つけやすくします。",
    "conversationDelete": "確認を求めてから、この会話を一覧から完全に削除します。",
    "conversationDeleteBusy": "エージェントの回答が終わると、この会話を削除できます。",
    "conversationDeleteConfirm": "この会話を、書かれたファイルごと完全に削除します。",
    "conversationDeleteCancel": "会話を削除せずにそのまま残し、この確認を閉じます。",
    "fileSort": "ファイルの並び順を選びます。新しさ、サイズ、名前で並べます。",
    "resizeConversations": "ドラッグするか矢印キーで、会話一覧の幅を広げたり狭めたりします。",
    "resizeFiles": "ドラッグするか矢印キーで、ファイル一覧の幅を広げたり狭めたりします。"
  }
});

export default ja;
