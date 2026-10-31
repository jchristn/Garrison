// German catalog for the Garrison app UI. Mirrors en.js key for key.

const de = {
  common: {
    loading: 'Wird geladen',
    close: 'Schließen',
    cancel: 'Abbrechen',
    retry: 'Erneut versuchen',
    defaultTitle: 'Garrison-App'
  },
  app: {
    notFoundTitle: 'App nicht gefunden',
    notFoundBody: 'Unter dieser Adresse gibt es keine App. Prüfen Sie den Link, den Sie erhalten haben.',
    noSlugTitle: 'Keine App ausgewählt',
    noSlugBody: 'Öffnen Sie den Link zu einer bestimmten App. App-Links sehen so aus: /apps/your-app/.',
    loadErrorTitle: 'Die App konnte nicht geladen werden',
    loadErrorBody: 'Der Server hat nicht geantwortet. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    skipToChat: 'Zur Unterhaltung springen'
  },
  signIn: {
    title: 'Bei {{name}} anmelden',
    email: 'E-Mail',
    password: 'Passwort',
    submit: 'Anmelden',
    submitting: 'Anmeldung läuft',
    anonymous: 'Ohne Anmeldung fortfahren',
    anonymousNote: 'Unterhaltungen ohne Anmeldung bleiben nur in diesem Browser-Tab erhalten.',
    or: 'oder',
    poweredBy: 'Erstellt mit Garrison Agent Studio',
    sessionEnded: 'Ihre Sitzung ist abgelaufen. Melden Sie sich erneut an, um fortzufahren.'
  },
  header: {
    conversations: 'Unterhaltungen',
    files: 'Dateien',
    signOut: 'Abmelden',
    signedInAs: 'Angemeldet als {{name}}',
    guest: 'Gast',
    themeLight: 'Zum hellen Design wechseln',
    themeDark: 'Zum dunklen Design wechseln',
    language: 'Sprache',
    logoAlt: 'Logo von {{name}}'
  },
  conversations: {
    title: 'Unterhaltungen',
    new: 'Neue Unterhaltung',
    empty: 'Noch keine Unterhaltungen. Senden Sie eine Nachricht, um eine zu beginnen.',
    untitled: 'Unterhaltung vom {{date}}',
    messages: 'Nachrichten: {{count}}',
    working: 'In Arbeit',
    loadError: 'Ihre Unterhaltungen konnten nicht geladen werden.'
  },
  chat: {
    welcomeDefault: 'Stellen Sie eine Frage, um loszulegen.',
    composerLabel: 'Nachricht',
    composerPlaceholder: 'Nachricht schreiben',
    composerHint: 'Mit Enter senden. Umschalt und Enter beginnen eine neue Zeile.',
    send: 'Senden',
    sending: 'Wird gesendet',
    you: 'Sie',
    waiting: 'Der Agent arbeitet daran',
    approval: 'Wartet darauf, dass ein Operator einen Schritt freigibt',
    reconnecting: 'Die Verbindung wurde unterbrochen. Verbindung wird wiederhergestellt',
    failed: 'Diese Antwort wurde nicht abgeschlossen.',
    details: 'Aktivität des Agenten',
    loadError: 'Diese Unterhaltung konnte nicht geladen werden.',
    missing: 'Diese Unterhaltung wurde nicht gefunden. Sie gehört eventuell zu einer anderen Sitzung.',
    busyComposer: 'Der Agent antwortet noch. Sie können Ihre nächste Nachricht senden, sobald er fertig ist.',
    dismiss: 'Ausblenden'
  },
  statuses: {
    Pending: 'Wartet auf Start',
    Queued: 'Wartet auf Start',
    Leased: 'Startet',
    Running: 'In Arbeit',
    Cancelling: 'Wird gestoppt',
    Succeeded: 'Fertig',
    Failed: 'Fehlgeschlagen',
    Cancelled: 'Abgebrochen',
    TimedOut: 'Zeitüberschreitung',
    Rejected: 'Nicht erlaubt',
    Suspended: 'Pausiert'
  },
  detailTypes: {
    Thinking: 'Überlegung',
    ToolCall: 'Werkzeugaufruf',
    ToolResult: 'Werkzeugergebnis',
    Progress: 'Fortschritt',
    Warning: 'Warnung'
  },
  activity: {
    title: 'Agentenaktivität ({{count}})',
    thinking: 'Überlegung',
    thinkingNow: 'Denkt nach',
    ask: 'Fragt {{agent}}',
    askMany: 'Fragt {{agents}} gleichzeitig',
    askSeveral: 'Fragt mehrere Agenten gleichzeitig',
    gather: 'Sammelt die Antworten',
    check: 'Prüft einen anderen Agenten',
    tool: 'Verwendet {{tool}}',
    running: 'Läuft',
    done: 'Fertig',
    failed: 'Fehlgeschlagen',
    sent: 'Gesendet',
    returned: 'Zurückgegeben',
    nothing: 'Nichts',
    waiting: 'Wartet auf die Antwort'
  },
  copy: {
    copy: 'Kopieren',
    copied: 'Kopiert',
    failed: 'Der Browser hat das Kopieren nicht erlaubt',
    message: 'Ihre Nachricht kopieren',
    answer: 'Antwort kopieren'
  },
  telemetry: {
    title: 'So lief diese Antwort',
    model: 'Modell',
    ttft: 'Zeit bis zum ersten Token',
    streaming: 'Streaming-Zeit',
    tools: 'Zeit in Werkzeugen',
    delegation: 'Warten auf andere Agenten',
    approval: 'Warten auf Freigabe',
    queue: 'Warten auf einen Worker',
    execution: 'Laufzeit',
    total: 'Gesamtzeit',
    inputTokens: 'Eingabe-Tokens',
    outputTokens: 'Ausgabe-Tokens',
    cachedTokens: 'Zwischengespeicherte Tokens',
    reasoningTokens: 'Reasoning-Tokens',
    rate: 'Ausgabegeschwindigkeit',
    rateValue: '{{value}} Tokens/s',
    toolCalls: 'Werkzeugaufrufe',
    cost: 'Kosten'
  },
  files: {
    title: 'Dateien',
    empty: 'Der Agent hat in dieser Unterhaltung noch keine Dateien geschrieben.',
    noConversation: 'Dateien, die der Agent schreibt, erscheinen hier, sobald eine Unterhaltung beginnt.',
    summary: 'Dateien: {{count}} ({{size}})',
    download: 'Herunterladen',
    versions: 'Versionen',
    versionsTitle: 'Versionen von {{path}}',
    version: 'Version {{number}}',
    current: 'Aktuell',
    updated: 'Aktualisiert {{when}}',
    size: 'Größe',
    newBadge: 'Neu',
    downloadFailed: 'Der Download konnte nicht starten. Versuchen Sie es erneut.',
    loadError: 'Die Dateien konnten nicht geladen werden.',
    versionsError: 'Die Versionen konnten nicht geladen werden.',
    close: 'Dateien schließen'
  },
  errors: {
    InvalidCredentials: 'E-Mail-Adresse oder Passwort ist nicht korrekt.',
    AppSignInRequired: 'Melden Sie sich an, um diese App zu nutzen.',
    AnonymousDisabled: 'Die anonyme Nutzung dieser App ist deaktiviert. Melden Sie sich stattdessen an.',
    AppAccessDenied: 'Dieses Konto hat keinen Zugriff auf diese App. Bitten Sie den Besitzer der App um Zugriff.',
    AppSessionRequired: 'Ihre Sitzung ist abgelaufen. Melden Sie sich erneut an, um fortzufahren.',
    ConversationBusy: 'Der Agent beantwortet noch die vorherige Nachricht. Warten Sie, bis er fertig ist, und senden Sie dann erneut.',
    AppRateLimited: 'Sie senden Nachrichten zu schnell. Warten Sie eine Minute und versuchen Sie es dann erneut.',
    AppNotDeployed: 'Diese App ist noch nicht bereit. Versuchen Sie es später noch einmal.',
    NetworkError: 'Der Server ist nicht erreichbar. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    generic: 'Etwas ist schiefgelaufen (HTTP {{status}}). Versuchen Sie es erneut.'
  },
  tips: {
    email: 'Die E-Mail-Adresse Ihres Kontos für diese App.',
    password: 'Das Passwort Ihres Kontos. Es wird nur an diesen Server gesendet, um Ihre Sitzung zu starten.',
    submit: 'Prüft E-Mail-Adresse und Passwort und öffnet die App.',
    anonymous: 'Nutzen Sie die App als Gast. Ihre Unterhaltungen bleiben nur so lange erhalten wie dieser Browser-Tab.',
    language: 'Wählen Sie die Sprache der App. Ihre Auswahl wird in diesem Browser gespeichert.',
    themeLight: 'Helle Farben verwenden. Die Auswahl wird in diesem Browser gespeichert und hat Vorrang vor der Systemeinstellung.',
    themeDark: 'Dunkle Farben verwenden. Die Auswahl wird in diesem Browser gespeichert und hat Vorrang vor der Systemeinstellung.',
    signOut: 'Beendet Ihre Sitzung auf diesem Gerät und kehrt zur Anmeldung zurück.',
    conversationsToggle: 'Blendet die Liste Ihrer Unterhaltungen ein oder aus.',
    filesToggle: 'Blendet die Dateien ein oder aus, die der Agent in dieser Unterhaltung geschrieben hat.',
    newConversation: 'Beginnt eine neue Unterhaltung. Ihre früheren Unterhaltungen bleiben in der Liste.',
    conversation: 'Öffnet diese Unterhaltung, damit Sie dort weitermachen können, wo Sie aufgehört haben.',
    composer: 'Schreiben Sie Ihre Nachricht an den Agenten. Enter sendet sie, Umschalt und Enter beginnen eine neue Zeile.',
    send: 'Sendet Ihre Nachricht an den Agenten. Die Antwort erscheint darunter, während sie entsteht.',
    dismiss: 'Blendet diesen Hinweis aus.',
    retry: 'Lädt die App noch einmal.',
    download: 'Speichert die aktuelle Version dieser Datei auf Ihrem Gerät.',
    versions: 'Zeigt alle Versionen dieser Datei, damit Sie eine ältere herunterladen können.',
    downloadVersion: 'Speichert diese Version der Datei auf Ihrem Gerät.',
    closeDialog: 'Schließt diesen Dialog und kehrt zur Unterhaltung zurück.',
    closeFiles: 'Blendet den Dateibereich aus und kehrt zur Unterhaltung zurück.',
    details: 'Zeigt die Schritte, die der Agent beim Antworten ausgeführt hat: Werkzeugaufrufe, Fortschritt und Warnungen.',
    answerLink: 'Öffnet einen Link aus der Antwort in einem neuen Tab: {{href}}',
    tableHeader: 'Spalte einer Tabelle in der Antwort: {{text}}',
    poweredBy: 'Öffnet usegarrison.ai in einem neuen Tab: mehr über Garrison Agent Studio, die Plattform, auf der diese App läuft.',
    skipToChat: 'Springt über Kopfzeile und Unterhaltungsliste hinweg direkt zum Nachrichtenfeld.',
    activityRunning: 'Dieser Schritt läuft noch; das Ergebnis erscheint hier, sobald es zurückkommt.',
    activityDone: 'Dieser Schritt ist abgeschlossen. Öffnen Sie ihn, um Gesendetes und Ergebnis zu sehen.',
    activityFailed: 'Dieser Schritt ist fehlgeschlagen. Öffnen Sie ihn, um Gesendetes und den Fehler zu sehen.',
    activityStep: 'Zeigt, was der Agent in diesem Schritt gesendet hat und was zurückkam.'
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
})(de, {
  "conversations": {
    "filter": "Nach Namen filtern",
    "sort": "Unterhaltungen sortieren",
    "noMatch": "Keine Unterhaltung passt zum Filter.",
    "renameLabel": "Neuer Name",
    "save": "Speichern",
    "cancel": "Abbrechen",
    "rename": "{{title}} umbenennen",
    "delete": "{{title}} löschen",
    "confirmDelete": "„{{title}}“ löschen? Das lässt sich nicht rückgängig machen.",
    "deleteConfirm": "Löschen",
    "sorts": {
      "recent": "Neueste zuerst",
      "oldest": "Älteste zuerst",
      "nameAsc": "Name A bis Z",
      "nameDesc": "Name Z bis A"
    }
  },
  "files": {
    "sort": "Dateien sortieren",
    "sorts": {
      "newest": "Neueste zuerst",
      "oldest": "Älteste zuerst",
      "largest": "Größte zuerst",
      "smallest": "Kleinste zuerst",
      "nameAsc": "Name A bis Z",
      "nameDesc": "Name Z bis A"
    }
  },
  "layout": {
    "resizeConversations": "Breite der Unterhaltungsliste ändern",
    "resizeFiles": "Breite der Dateiliste ändern"
  },
  "tips": {
    "conversationFilter": "Zeigt nur Unterhaltungen, deren Name diesen Text enthält.",
    "conversationSort": "Wählt die Reihenfolge der Unterhaltungen: nach Aktivität oder Name.",
    "conversationRenameInput": "Neuen Namen eingeben, mit Enter speichern oder mit Escape abbrechen.",
    "conversationRenameSave": "Speichert den neuen Namen dieser Unterhaltung.",
    "conversationRenameCancel": "Behält den bisherigen Namen dieser Unterhaltung.",
    "conversationRename": "Gibt dieser Unterhaltung einen neuen Namen.",
    "conversationDelete": "Löscht diese Unterhaltung nach einer Bestätigung.",
    "conversationDeleteBusy": "Sie können diese Unterhaltung löschen, sobald der Agent fertig geantwortet hat.",
    "conversationDeleteConfirm": "Löscht die Unterhaltung endgültig, mitsamt ihren Dateien.",
    "conversationDeleteCancel": "Behält die Unterhaltung und schließt diese Frage.",
    "fileSort": "Wählt die Reihenfolge der Dateien: nach Alter, Größe oder Name.",
    "resizeConversations": "Ziehen oder Pfeiltasten verwenden, um die Unterhaltungsliste breiter oder schmaler zu machen.",
    "resizeFiles": "Ziehen oder Pfeiltasten verwenden, um die Dateiliste breiter oder schmaler zu machen."
  }
});

export default de;
