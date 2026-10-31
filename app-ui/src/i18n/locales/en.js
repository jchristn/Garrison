// English source catalog for the Garrison app UI. Every other locale mirrors these keys.
// tips.* are tooltips: they say what a control does and how to use it, never just the label again.

const en = {
  common: {
    loading: 'Loading',
    close: 'Close',
    cancel: 'Cancel',
    retry: 'Try again',
    defaultTitle: 'Garrison app'
  },
  app: {
    notFoundTitle: 'App not found',
    notFoundBody: 'There is no app at this address. Check the link you were given.',
    noSlugTitle: 'No app selected',
    noSlugBody: 'Open the link to a specific app. App links look like /apps/your-app/.',
    loadErrorTitle: 'The app could not be loaded',
    loadErrorBody: 'The server did not answer. Check your connection and try again.',
    skipToChat: 'Skip to the conversation'
  },
  signIn: {
    title: 'Sign in to {{name}}',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in',
    anonymous: 'Continue without signing in',
    anonymousNote: 'Conversations you start without signing in stay in this browser tab.',
    or: 'or',
    poweredBy: 'Built with Garrison Agent Studio',
    sessionEnded: 'Your session ended. Sign in again to continue.'
  },
  header: {
    conversations: 'Conversations',
    files: 'Files',
    signOut: 'Sign out',
    signedInAs: 'Signed in as {{name}}',
    guest: 'Guest',
    themeLight: 'Switch to the light theme',
    themeDark: 'Switch to the dark theme',
    language: 'Language',
    logoAlt: '{{name}} logo'
  },
  conversations: {
    title: 'Conversations',
    new: 'New conversation',
    empty: 'No conversations yet. Send a message to start one.',
    untitled: 'Conversation from {{date}}',
    messages: 'Messages: {{count}}',
    working: 'Working',
    loadError: 'Your conversations could not be loaded.'
  },
  chat: {
    welcomeDefault: 'Ask a question to get started.',
    composerLabel: 'Message',
    composerPlaceholder: 'Write a message',
    composerHint: 'Enter sends the message. Shift and Enter start a new line.',
    send: 'Send',
    sending: 'Sending',
    you: 'You',
    waiting: 'The agent is working on it',
    approval: 'Waiting for an operator to approve a step',
    reconnecting: 'The connection dropped. Reconnecting',
    failed: 'This turn did not finish.',
    details: 'Agent activity',
    loadError: 'This conversation could not be loaded.',
    missing: 'That conversation was not found. It may belong to another session.',
    busyComposer: 'The agent is still answering. You can send your next message when it finishes.',
    dismiss: 'Dismiss'
  },
  statuses: {
    Pending: 'Waiting to start',
    Queued: 'Waiting to start',
    Leased: 'Starting',
    Running: 'Working',
    Cancelling: 'Stopping',
    Succeeded: 'Done',
    Failed: 'Failed',
    Cancelled: 'Cancelled',
    TimedOut: 'Timed out',
    Rejected: 'Not allowed',
    Suspended: 'Paused'
  },
  detailTypes: {
    Thinking: 'Thinking',
    ToolCall: 'Tool call',
    ToolResult: 'Tool result',
    Progress: 'Progress',
    Warning: 'Warning'
  },
  activity: {
    title: 'Agent activity ({{count}})',
    thinking: 'Thinking',
    thinkingNow: 'Thinking',
    ask: 'Asking {{agent}}',
    askMany: 'Asking {{agents}} at once',
    askSeveral: 'Asking several agents at once',
    gather: 'Collecting the answers',
    check: 'Checking on another agent',
    tool: 'Using {{tool}}',
    running: 'Running',
    done: 'Done',
    failed: 'Failed',
    sent: 'Sent',
    returned: 'Returned',
    nothing: 'Nothing',
    waiting: 'Waiting for the answer'
  },
  copy: {
    copy: 'Copy',
    copied: 'Copied',
    failed: 'The browser did not allow copying',
    message: 'Copy your message',
    answer: 'Copy the answer'
  },
  telemetry: {
    title: 'How this answer ran',
    model: 'Model',
    ttft: 'Time to first token',
    streaming: 'Streaming time',
    tools: 'Time in tools',
    delegation: 'Waiting for other agents',
    approval: 'Waiting for approval',
    queue: 'Waiting for a worker',
    execution: 'Run time',
    total: 'Total time',
    inputTokens: 'Input tokens',
    outputTokens: 'Output tokens',
    cachedTokens: 'Cached tokens',
    reasoningTokens: 'Reasoning tokens',
    rate: 'Output speed',
    rateValue: '{{value}} tokens/s',
    toolCalls: 'Tool calls',
    cost: 'Cost'
  },
  files: {
    title: 'Files',
    empty: 'The agent has not written any files in this conversation yet.',
    noConversation: 'Files the agent writes show up here once a conversation starts.',
    summary: 'Files: {{count}} ({{size}})',
    download: 'Download',
    versions: 'Versions',
    versionsTitle: 'Versions of {{path}}',
    version: 'Version {{number}}',
    current: 'Current',
    updated: 'Updated {{when}}',
    size: 'Size',
    newBadge: 'New',
    downloadFailed: 'The download could not start. Try again.',
    loadError: 'The files could not be loaded.',
    versionsError: 'The versions could not be loaded.',
    close: 'Close files'
  },
  errors: {
    InvalidCredentials: 'The email or password is not correct.',
    AppSignInRequired: 'Sign in to use this app.',
    AnonymousDisabled: 'Anonymous use of this app is turned off. Sign in instead.',
    AppAccessDenied: 'This account does not have access to this app. Ask the app owner for access.',
    AppSessionRequired: 'Your session ended. Sign in again to continue.',
    ConversationBusy: 'The agent is still answering the previous message. Wait for it to finish, then send again.',
    AppRateLimited: 'You are sending messages too quickly. Wait a minute, then try again.',
    AppNotDeployed: 'This app is not ready yet. Try again later.',
    NetworkError: 'The server could not be reached. Check your connection and try again.',
    generic: 'Something went wrong (HTTP {{status}}). Try again.'
  },
  tips: {
    email: 'The email address of your account for this app.',
    password: 'The password of your account. It is sent only to this server to start your session.',
    submit: 'Check your email and password and open the app.',
    anonymous: 'Use the app as a guest. Your conversations last only as long as this browser tab session.',
    language: 'Choose the language of the app. Your choice is saved in this browser.',
    themeLight: 'Use light colors. Your choice is saved in this browser and overrides the system setting.',
    themeDark: 'Use dark colors. Your choice is saved in this browser and overrides the system setting.',
    signOut: 'End your session on this device and return to the sign-in screen.',
    conversationsToggle: 'Show or hide your list of conversations.',
    filesToggle: 'Show or hide the files the agent wrote in this conversation.',
    newConversation: 'Start a fresh conversation. Your earlier conversations stay in the list.',
    conversation: 'Open this conversation and continue where you left off.',
    composer: 'Type your message to the agent. Enter sends it; Shift and Enter start a new line.',
    send: 'Send your message to the agent. The answer appears below as it is written.',
    dismiss: 'Hide this error message. You can still send again.',
    retry: 'Ask the server for the app again and reload this page.',
    download: 'Save the current version of this file to your device.',
    versions: 'See every version of this file and download an earlier one.',
    downloadVersion: 'Save this version of the file to your device.',
    closeDialog: 'Close this dialog and return to the conversation.',
    closeFiles: 'Hide the files panel and return to the conversation.',
    details: 'Show the steps the agent took while answering: tool calls, progress, and warnings.',
    answerLink: 'Opens a link from the answer in a new tab: {{href}}',
    tableHeader: 'Column of a table in the answer: {{text}}',
    poweredBy: 'Open usegarrison.ai in a new tab to learn about Garrison Agent Studio, the platform this app runs on.',
    skipToChat: 'Jump past the header and conversation list to the message box.',
    activityRunning: 'This step is still running; the result appears here when it comes back.',
    activityDone: 'This step finished. Open it to see what was sent and what came back.',
    activityFailed: 'This step failed. Open it to see what was sent and the error that came back.',
    activityStep: 'Show what the agent sent in this step and what came back.'
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
})(en, {
  "conversations": {
    "filter": "Filter by name",
    "sort": "Sort conversations",
    "noMatch": "No conversation matches the filter.",
    "renameLabel": "New name",
    "save": "Save",
    "cancel": "Cancel",
    "rename": "Rename {{title}}",
    "delete": "Delete {{title}}",
    "confirmDelete": "Delete \"{{title}}\"? This cannot be undone.",
    "deleteConfirm": "Delete",
    "sorts": {
      "recent": "Recent first",
      "oldest": "Oldest first",
      "nameAsc": "Name A to Z",
      "nameDesc": "Name Z to A"
    }
  },
  "files": {
    "sort": "Sort files",
    "sorts": {
      "newest": "Newest first",
      "oldest": "Oldest first",
      "largest": "Largest first",
      "smallest": "Smallest first",
      "nameAsc": "Name A to Z",
      "nameDesc": "Name Z to A"
    }
  },
  "layout": {
    "resizeConversations": "Resize the conversation list",
    "resizeFiles": "Resize the file list"
  },
  "tips": {
    "conversationFilter": "Show only the conversations whose name contains this text.",
    "conversationSort": "Choose the order of the conversations: by activity or by name.",
    "conversationRenameInput": "Type the new name and press Enter to save it, or Escape to cancel.",
    "conversationRenameSave": "Save the new name of this conversation.",
    "conversationRenameCancel": "Keep the current name of this conversation.",
    "conversationRename": "Give this conversation a new name.",
    "conversationDelete": "Delete this conversation after you confirm.",
    "conversationDeleteBusy": "You can delete this conversation once the agent finishes answering.",
    "conversationDeleteConfirm": "Delete the conversation for good. Its files go with it.",
    "conversationDeleteCancel": "Keep the conversation and close this question.",
    "fileSort": "Choose the order of the files: by age, by size, or by name.",
    "resizeConversations": "Drag, or use the arrow keys, to make the conversation list wider or narrower.",
    "resizeFiles": "Drag, or use the arrow keys, to make the file list wider or narrower."
  }
});

export default en;
