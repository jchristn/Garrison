// German tooltip (tips.*) and relationship explainer (explainers.*) text. Merged into de.js.
// Mirrors en.tips.js key for key. Tooltips erklären, was ein Element ist und wie es verwendet wird (D-030).

const TELEMETRY = {
  approvalWaitMs: 'Freigabe-Wartezeit: Gesamtzeit, die dieser Lauf auf Berechtigungsfreigaben gewartet hat, die eine Person oder eine Zeitüberschreitung entschieden hat. Aufrufe, die sofort durch eine Regel oder den Standard der Bereitstellung entschieden wurden, zählen nicht. Vom Server gemessen; n/a, wenn der Lauf nie gewartet hat.',
  delegationWaitMs: 'Delegationswartezeit: wie lange dieser Lauf auf Kindläufe gewartet hat, die er über Garrison gestartet hat (andere Agenten, an die er delegiert hat), gemessen an den Server-Zeitstempeln dieser Kindläufe. Null oder k. A., wenn der Lauf nichts delegiert hat.',
  timeToFirstTokenExcludingDelegationMs: 'Zeit bis zum ersten Token ohne Delegation: die Zeit bis zum ersten Token abzüglich der Zeit, die der Lauf vor seiner ersten Ausgabe auf delegierte Läufe gewartet hat. Damit vergleichen Sie delegierende Agenten fair mit Agenten, die nicht delegieren. Gemessen mit Server-Zeitstempeln; nie negativ.',
  timeToFirstTokenMs: 'Zeit bis zum ersten Token: vom Start des Harness-Prozesses durch den Worker bis zur ersten Ausgabe des Modells (Text oder Überlegung). Der Start der Harness ist enthalten, ein langsamer CLI-Start zeigt sich also hier. Gemessen auf dem Worker mit einer monotonen Uhr.',
  streamingMs: 'Streaming-Zeit: von der ersten bis zur letzten Modellausgabe. So lange hat das Modell tatsächlich Ausgabe erzeugt. Gemessen auf dem Worker mit einer monotonen Uhr.',
  executionMs: 'Ausführungszeit: vom Start bis zum Ende des Harness-Prozesses, gemessen vom Worker. Ältere Server, die diesen Wert nicht melden, verwenden ersatzweise die Zeitstempel für Start und Abschluss.',
  queueMs: 'Wartezeit: wie lange der Lauf zwischen dem Einreihen in die Warteschlange und der Zuweisung an einen Worker-Knoten gewartet hat. Hohe Werte bedeuten, dass alle geeigneten Knoten ausgelastet waren oder keiner den Platzierungsregeln entsprach. Gemessen vom Server.',
  totalMs: 'Gesamtzeit: von der Einreihung bis zum Abschluss, also Wartezeit plus Ausführung plus Übermittlung des Ergebnisses. Gemessen vom Server.',
  outputTokensPerSecond: 'Ausgabe-Token pro Sekunde: Ausgabe-Token geteilt durch die Streaming-Zeit. Wird nur angezeigt, wenn das Streaming mindestens 100 ms gedauert hat, weil kürzere Zeitfenster keine aussagekräftigen Raten ergeben.',
  inputTokens: 'Eingabe-Token, die die Harness für den gesamten Lauf gemeldet hat, einschließlich System-Prompt, Werkzeugergebnissen und Gesprächsverlauf über alle Runden.',
  outputTokens: 'Ausgabe-Token, die das Modell über alle Runden des Laufs erzeugt hat, wie vom Parser der Harness gemeldet.',
  cachedTokens: 'Eingabe-Token, die aus dem Prompt-Cache des Anbieters bedient wurden. Cache-Token werden meist günstiger abgerechnet, ein hoher Anteil senkt also die Kosten.',
  reasoningTokens: 'Reasoning- oder Überlegungs-Token, sofern die Harness sie getrennt meldet (zum Beispiel die Reasoning-Ausgabe von Codex). Null, wenn die Harness sie nicht gesondert ausweist.',
  toolCallCount: 'Anzahl der Werkzeugaufruf-Ereignisse im Lauf: MCP-Werkzeuge, integrierte Werkzeuge der Harness und Aufrufe anderer Garrison-Agenten. Vom Worker aus dem Ereignisstrom gezählt.',
  costUsd: 'Kosten in US-Dollar, wie von der Harness gemeldet. Als geschätzt markiert, wenn Garrison sie aus den Token-Zahlen berechnet hat, statt dass die Harness sie gemeldet hat.',
  firstTokenUtc: 'Uhrzeit (UTC, in Ihrer Zeitzone angezeigt) des ersten Modellausgabe-Ereignisses im Lauf.',
  lastTokenUtc: 'Uhrzeit (UTC, in Ihrer Zeitzone angezeigt) des letzten Modellausgabe-Ereignisses im Lauf.'
};

const FILE_ITEMS = {
  baseDirectory: 'Verzeichnis, auf das sich der Pfad bezieht: das Konfigurationsverzeichnis des Laufs, der Arbeitsbereich oder das HOME-Verzeichnis des Laufs.',
  pathTemplate: 'Relativer Pfad der Datei, die vor dem Start geschrieben wird. Vorlagen sind erlaubt, zum Beispiel settings/{{run.id}}.json.',
  contentTemplate: 'Vorlage, die als Dateiinhalt gerendert wird. Sie darf Variablen und gebundene Geheimnisse mit {{secret.alias}} referenzieren.',
  condition: 'Vorlagenausdruck; ergibt er leer oder false, wird die Datei nicht geschrieben.',
  mode: 'Unix-Dateimodus in Oktalschreibweise, zum Beispiel 0600 für Dateien mit Zugangsdaten.',
  isSecret: 'Den gerenderten Inhalt als geheim behandeln: Er wird nie protokolliert und in Kompilierungsvorschauen geschwärzt.'
};

const tips = {
  fieldWarnings: { dismiss: 'Diesen Hinweis ausblenden. Der Datensatz ist bereits mit den hier aufgeführten Werten gespeichert.' },
  approvals: {
    awaiting_one: 'Die Harness hat vor einem Werkzeugaufruf nachgefragt und wartet auf eine Person. Öffnen Sie den Tab Freigaben, um ihn zu erlauben oder zu verweigern ({{count}} wartet).',
    awaiting_other: 'Die Harness hat vor Werkzeugaufrufen nachgefragt und wartet auf eine Person. Öffnen Sie den Tab Freigaben, um sie zu erlauben oder zu verweigern ({{count}} warten).',
    decide: {
      decision: 'Wählen Sie, ob die Harness diesen Werkzeugaufruf ausführen darf. Der Lauf geht weiter, sobald Sie absenden.',
      allow: 'Die Harness darf diesen Werkzeugaufruf ausführen. Der Lauf geht damit weiter.',
      deny: 'Diesen Werkzeugaufruf ablehnen. Die Harness erhält die Ablehnungsmeldung und macht ohne ihn weiter.',
      reason: 'Optionale Notiz, die mit der Entscheidung gespeichert und ins Audit-Protokoll geschrieben wird. Bei einer Ablehnung wird sie an den Agenten weitergegeben.',
      remember: 'Zusätzlich eine Regel zur Bereitstellung dieser Freigabe hinzufügen, damit gleichartige Aufrufe beim nächsten Mal automatisch entschieden werden.',
      rulePattern: 'Die hinzuzufügende Regel in Claude Code-Regelsyntax. Sie beginnt als vorgeschlagene Regel; erweitern oder verengen Sie sie vor dem Speichern.',
      submitAllow: 'Den Werkzeugaufruf jetzt erlauben. Die Entscheidung ist endgültig und kann danach nicht geändert werden.',
      submitDeny: 'Den Werkzeugaufruf jetzt verweigern. Die Entscheidung ist endgültig und kann danach nicht geändert werden.'
    }
  },
  approvalCheck: {
    toolName: 'Werkzeugname, wie die Harness ihn meldet, etwa Bash, Edit, WebFetch oder ein MCP-Werkzeug wie mcp__github__create_issue.',
    inputs: {
      command: 'Der zu testende Shell-Befehl, zum Beispiel npm run build && npm test. Jeder Teilbefehl muss erlaubt sein.',
      url: 'Die URL, die das Werkzeug abrufen würde. WebFetch-Regeln prüfen ihre Domain.',
      query: 'Die Suchanfrage, die das Werkzeug senden würde.',
      file_path: 'Pfad der Datei, die das Werkzeug lesen oder ändern würde, relativ zum Arbeitsbereich oder absolut.',
      notebook_path: 'Pfad des Notebooks, das das Werkzeug ändern würde.',
      pattern: 'Das Glob- oder Suchmuster, das das Werkzeug verwenden würde.'
    },
    run: 'Die gespeicherten Regeln der Bereitstellung für diesen Werkzeugaufruf auswerten und das Ergebnis anzeigen. Es wird nichts aufgezeichnet und kein Lauf beeinflusst.',
    suggestedRule: 'Die Regel, die "Merken" für diesen Aufruf hinzufügen würde. Kopieren Sie sie in die Regeln oben, um ähnliche Aufrufe abzudecken.'
  },
  ids: { deleted: 'Dieser Datensatz wurde gelöscht. ID {{id}}. Die Kopierschaltfläche kopiert die ID.', named: 'ID {{id}}. Mit der Kopierschaltfläche kopieren Sie die ID für die API, SDKs oder eine Supportanfrage.' },
  markdown: {
    column: 'Spalte {{name}} einer Tabelle aus der Ausgabe des Agenten. Breite Tabellen scrollen seitlich in ihrem Rahmen.',
    showRaw: 'Zeigt den exakten Text, den der Agent zurückgegeben hat, ohne Markdown-Formatierung, zum Prüfen oder Kopieren.',
    showRendered: 'Zeigt den Text wieder als Markdown formatiert, mit Tabellen, Listen, Codeblöcken und Links.',
    copy: 'Kopiert den rohen Ergebnistext einschließlich Markdown-Syntax in die Zwischenablage.',
    link: 'Öffnet {{href}} in einem neuen Tab. Der Link stammt aus der Ausgabe des Agenten, prüfen Sie die Adresse also, bevor Sie ihr vertrauen.'
  },
  common: {
    fields: {
      name: 'Eindeutiger Name dieses Datensatzes innerhalb des Mandanten. Andere Datensätze und Manifeste verweisen über diesen Namen darauf.',
      description: 'Freitextnotiz für Menschen. Sie erklärt, wofür dieser Datensatz gedacht ist, und wird zur Laufzeit nicht verwendet.',
      active: 'Inaktive Datensätze bleiben erhalten, werden aber ignoriert. Schalten Sie dies aus, um etwas zu pausieren, ohne es zu löschen.',
      id: 'Vom System erzeugte Kennung mit Typpräfix. Verwenden Sie sie in API-Aufrufen und Skripten; sie ändert sich nie.',
      createdUtc: 'Wann dieser Datensatz erstellt wurde. Fahren Sie mit der Maus über den Wert, um Datum und Uhrzeit genau zu sehen.',
      lastUpdateUtc: 'Wann dieser Datensatz zuletzt geändert wurde.',
      isBuiltIn: 'Integrierte Datensätze werden mit Garrison ausgeliefert und sind schreibgeschützt. Benutzerdefinierte Datensätze wurden in diesem Mandanten erstellt und können bearbeitet werden.',
      expiresUtc: 'Nach diesem Zeitpunkt funktioniert der Datensatz nicht mehr. Leer lassen für keinen Ablauf.'
    }
  },
  explainer: {
    reopen: 'Die Erklärung zu {{topic}} erneut anzeigen: was diese Seite verwaltet und wie sie mit dem Rest von Garrison zusammenhängt.',
    dismiss: 'Diese Erklärung ausblenden. An ihrer Stelle bleibt eine kleine Schaltfläche "Über", mit der Sie sie jederzeit wieder einblenden können.'
  },
  nav: {
    approvalsBadge_one: '{{count}} Werkzeugaufruf wartet darauf, dass eine Person ihn erlaubt oder verweigert. Öffnen Sie Freigaben, um zu entscheiden.',
    approvalsBadge_other: '{{count}} Werkzeugaufrufe warten darauf, dass eine Person sie erlaubt oder verweigert. Öffnen Sie Freigaben, um zu entscheiden.',
    hubs: {
      approvals: 'Die Freigaben: Werkzeugaufrufe von Agenten, die auf eine Person warten, und der Verlauf aller Entscheidungen durch Regel, Standard, Person oder Zeitüberschreitung.',
      home: 'Ihr Ausgangspunkt: aktuelle Zahlen zu Agenten, Läufen und Worker-Knoten, API-Verkehr, aktuelle Fehler und Verknüpfungen zu häufigen Aufgaben.',
      invoke: 'Senden Sie einem Agenten aus dem Browser eine Nachricht und verfolgen Sie das Protokoll live, ohne Code zu schreiben.',
      runs: 'Jeder Agentenaufruf mit Protokoll, Ergebnis und Telemetrie, dazu die Warteschlange der Arbeit, die auf einen Knoten wartet.',
      analytics: 'Diagramme zu Geschwindigkeit, Token-Verbrauch, Kosten, Ergebnissen und Werkzeugaufrufen von Läufen im Zeitverlauf, filterbar nach Agent, Harness und Bereitstellung.',
      agents: 'Die Agenten, die Aufrufende über ihren Namen ansprechen, und die Bereitstellungen, die bestimmen, wie jeder davon tatsächlich läuft.',
      configuration: 'Die Bausteine, die Bereitstellungen verwenden: Harness-Profile, Prompt-Vorlagen, MCP-Server, Geheimnisse, Arbeitsbereiche, Artefaktspeicher und Manifeste.',
      fleet: 'Die Replikate der Steuerungsebene, die die API bereitstellen und Läufe planen, die Worker-Knoten, die Läufe ausführen, und die Knotenpools, die Worker für die Platzierung gruppieren.',
      access: 'Wer sich anmelden kann und was erlaubt ist: Mandanten, Benutzer, Zugangsschlüssel, Rollen und Rollenzuweisungen.',
      monitoring: 'Untersuchen, was passiert ist: erfasste API-Anfragen, das Sicherheits-Audit und ein Live-API-Explorer.',
      system: 'Servereinstellungen sowie Endpunkte, Versionen und Identität des Servers, mit dem Sie verbunden sind.'
    },
    tabs: {
      runs: 'Einzelne Läufe suchen, filtern und prüfen. Öffnen Sie einen Lauf, um Protokoll, Ergebnis und Telemetrie zu lesen, oder brechen Sie ihn ab und wiederholen Sie ihn.',
      queue: 'Läufe, die gerade auf einen Knoten warten, zugewiesen sind oder laufen, gruppiert nach Agent und Harness.',
      agents: 'Benannte Agenten, die Aufrufende über REST, MCP oder A2A ansprechen. Der Agent ist die Identität; seine Bereitstellungen bestimmen, wie er läuft.',
      deployments: 'Wie jeder Agent läuft: Harness-Profil, Modell, Prompts, MCP-Server, Geheimnisse, Arbeitsbereich, Platzierung, Grenzen und Verkehrsgewichtung.',
      harnessProfiles: 'Rezepte, um eine CLI-Harness ohne Oberfläche zu starten: Programm, Argumente, Umgebung, Dateien und Ausgabeauswertung.',
      promptTemplates: 'Jeder Prompt und jede erzeugte Konfigurationsdatei, die Garrison an eine Harness sendet, versioniert und mit Live-Vorschau.',
      mcpServers: 'Werkzeugserver, die Agenten nutzen können. Registrieren Sie sie hier und binden Sie sie dann an Bereitstellungen.',
      secrets: 'Verschlüsselte API-Schlüssel und Token. Bereitstellungen binden sie über einen Alias; die Werte werden nie wieder angezeigt.',
      workspaces: 'Vorlagen für das Verzeichnis, in dem ein Lauf arbeitet: leer, aus Git geklont oder mit Dateien befüllt.',
      agentAssets: 'Versionierte Systemprompts, Fähigkeiten, Referenzdateien und Dokumentvorlagen, die Agentenrevisionen fixieren, mit Hochladen und Verlauf.',
      artifactStores: 'Ziele für Dateien, die Läufe erzeugen und die Sie nach dem Ende des Laufs behalten möchten.',
      modelPrices: "Vom Betreiber konfigurierte USD-Tarife zur Kostenschätzung, wenn der Harness keine Kosten meldet. Gemeldete Kosten, auch null, haben Vorrang.",
      usageQuotas: "Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.",
      manifests: 'Die gesamte Konfiguration des Mandanten als YAML anwenden oder exportieren, damit sie in der Versionsverwaltung liegen kann.',
      nodes: 'Worker-Maschinen oder Pods, die Läufe abholen und Harnesses ausführen. Hier können Sie sie sperren, leeren oder prüfen.',
      controlNodes: 'Server-Replikate (Steuerungsknoten), die REST, MCP und A2A bereitstellen und Läufe planen. Eines davon ist der Leader und übernimmt die Cluster-Wartung. Status, Version und Aktivität, nur lesend.',
      nodePools: 'Benannte Gruppen von Knoten, optional für bestimmte Mandanten reserviert. Bereitstellungen können einen Pool voraussetzen.',
      tenants: 'Isolierte Organisationen auf diesem Server, jede mit eigenen Benutzern, Agenten, Geheimnissen und Läufen.',
      users: 'Personen, die sich mit E-Mail und Passwort anmelden. Jeder Benutzer kann Zugangsschlüssel besitzen.',
      credentials: 'Zugangsschlüssel für Skripte, SDKs und Dienste. Jeder Schlüssel gehört einem Benutzer und handelt mit dessen Berechtigungen oder weniger.',
      roles: 'Benannte Bündel von Berechtigungen sowie die Berechtigungen selbst. Weisen Sie Rollen zu, um Zugriff zu gewähren.',
      assignments: 'Zuweisungen, die eine Rolle mit einem Benutzer oder Zugangsschlüssel verbinden, für den ganzen Mandanten oder eine einzelne Ressource.',
      requests: 'Von diesem Server erfasste API-Anfragen mit Headern, Inhalten, Zeiten und Status, zur Fehlersuche bei Integrationen.',
      audit: 'Sicherheits- und Konfigurationsereignisse: Anmeldungen, Ablehnungen, Änderungen an Geheimnissen, Manifest-Anwendungen und Änderungen an Knoten.',
      explorer: 'Wählen Sie eine beliebige API-Operation aus dem OpenAPI-Dokument des Servers, füllen Sie die Parameter aus und führen Sie sie live aus.',
      settings: 'Server- und Clustereinstellungen mit ihrer Quelle und der Angabe, ob eine Änderung sofort wirkt oder einen Neustart erfordert.',
      serverInfo: 'REST-, MCP- und A2A-Adressen, Server- und Dashboard-Versionen sowie die Identität, mit der Sie angemeldet sind.',
      conversations: 'Mehrrundige Konversationen mit Agenten: Jede Runde ist ein Lauf, der die Sitzung der vorherigen Runde fortsetzt. Öffnen Sie eine, um ihre Runden zu lesen und die nächste Nachricht zu senden.'
    },
    subtabs: {
      roles: 'Rollen fassen Berechtigungen unter einem Namen zusammen, etwa Operator oder Invoker. Weisen Sie eine Rolle zu, um alle ihre Berechtigungen zu vergeben.',
      permissions: 'Einzelne Regeln, die Operationen auf Ressourcentypen erlauben oder verweigern. Rollen bestehen daraus; Verweigern gewinnt immer.',
      userAssignments: 'Rollen an Personen vergeben, die sich mit E-Mail und Passwort anmelden.',
      credentialAssignments: 'Rollen an Zugangsschlüssel vergeben, die von Automatisierung verwendet werden. Halten Sie Schlüssel enger als ihre Eigentümer.'
    },
    setup: 'Den Einrichtungsassistenten öffnen: Zugangsdaten für eine Harness hinterlegen, einen Beispielagenten anwenden und ihn einmal ausführen, um zu prüfen, dass alles funktioniert.',
    tour: 'Die kurze geführte Tour erneut abspielen, die Navigation, Kontext und den Ort der Konfiguration zeigt.',
    skipToContent: 'Die Navigation überspringen und direkt zum Hauptinhalt dieser Seite springen. Vor allem für Tastaturnutzung hilfreich.'
  },
  topbar: {
    toggleSidebar: 'Die Navigationsleiste ein- oder ausklappen. Auf kleinen Bildschirmen öffnet sich die Navigation als Überlagerung.',
    server: 'Der Garrison-Server, mit dem diese Konsole spricht: {{url}}. Der Punkt zeigt, ob seine Zustandsprüfung erfolgreich ist.',
    health: {
      healthy: 'Der Server hat in den letzten 30 Sekunden auf seine Zustandsprüfung geantwortet.',
      unhealthy: 'Der Server hat nicht auf seine Zustandsprüfung geantwortet. Anfragen von dieser Seite schlagen wahrscheinlich fehl.',
      unknown: 'Warten auf das erste Ergebnis der Zustandsprüfung des Servers.'
    },
    copyServer: 'Die Server-URL kopieren, zum Beispiel um ein SDK oder einen curl-Befehl zu konfigurieren.',
    switchTenant: 'Systemadministration kann jeden Mandanten ansehen. Jede Seite zeigt die Daten des ausgewählten Mandanten.',
    tenant: 'Sie arbeiten im Mandanten {{tenant}}. Alle Datensätze und Läufe, die Sie sehen, gehören dazu.',
    principal: 'Sie sind als {{name}} angemeldet. Ihre Aktionen werden unter dieser Identität protokolliert.',
    role: 'Ihre höchste Zugriffsstufe in diesem Mandanten. Sie bestimmt, welche Seiten und Aktionen verfügbar sind.',
    liveOn: 'Über WebSocket mit dem Server verbunden, Änderungen an Läufen und Knoten erscheinen also sofort.',
    liveOff: 'Keine Live-Verbindung. Die Seiten aktualisieren sich stattdessen mit eigenen Timern, Änderungen können daher einige Sekunden brauchen.',
    github: 'Das Garrison-Quellcode-Repository auf GitHub in einem neuen Tab öffnen, für Dokumentation und Issues.',
    themeLight: 'Zum hellen Farbschema wechseln. Die Auswahl wird in diesem Browser gespeichert.',
    themeDark: 'Zum dunklen Farbschema wechseln. Die Auswahl wird in diesem Browser gespeichert.',
    logout: 'Abmelden und diese Browsersitzung widerrufen. Sie müssen sich danach erneut anmelden.',
    language: 'Die Anzeigesprache ändern. Datums- und Zahlenformate folgen der Sprache, und die Auswahl wird gespeichert.'
  },
  login: {
    passwordTab: 'Als Person mit Mandant, E-Mail und Passwort anmelden.',
    keyTab: 'Mit Zugangsschlüssel und geheimem Schlüssel anmelden, demselben Paar, das Skripte und SDKs verwenden.',
    serverUrl: 'Basisadresse eines anderen Garrison-Servers, zum Beispiel 127.0.0.1:9700. Der Browser erreicht ihn nur, wenn das Dashboard seinen Ursprung erlaubt (GARRISON_CSP_CONNECT_SRC).',
    useDifferentServer: 'Bei einem anderen Server anmelden als dem, mit dem diese Konsole bereitgestellt wurde. Sein Ursprung muss in GARRISON_CSP_CONNECT_SRC erlaubt sein.',
    useDefaultServer: 'Das Feld Server-URL ausblenden und beim Server anmelden, mit dem diese Konsole bereitgestellt wurde.',
    serverInUse: 'Der Garrison-Server, bei dem sich diese Konsole anmeldet: GARRISON_API_URL, wenn gesetzt, sonst der Ursprung dieser Seite, der die API weiterleitet.',
    tenantId: 'Der Mandant, zu dem Ihr Konto gehört. Der lokale Standardmandant heißt default.',
    email: 'Die E-Mail-Adresse Ihres Benutzerkontos in diesem Mandanten.',
    password: 'Ihr Kontopasswort. Es wird einmal gesendet, um ein Sitzungstoken zu erhalten, und von der Browser-Anwendung nie gespeichert.',
    accessKey: 'Der öffentliche Teil eines Zugangsschlüssels, beginnend mit access_. Schlüssel erstellen Sie unter Zugriff, Zugangsschlüssel.',
    secretKey: 'Der private Teil des Zugangsschlüssels. Er wurde einmal angezeigt, als der Schlüssel erstellt oder rotiert wurde.',
    submit: 'Die Zugangsdaten beim Server prüfen und die Konsole für Ihren Mandanten öffnen.'
  },
  table: {
    selectAll: 'Alle Zeilen dieser Seite auswählen oder abwählen, zum Beispiel um sie gemeinsam zu löschen.',
    selectRow: 'Diese Zeile für eine Sammelaktion wie Löschen auswählen.',
    sortServer: '{{tip}} Klicken, um die gesamte Liste nach dieser Spalte zu sortieren; erneut klicken kehrt die Reihenfolge um.',
    sortPageOnly: '{{tip}} Klicken, um nur die Zeilen dieser Seite zu sortieren; der Server kann nicht nach dieser Spalte sortieren.',
    clearSelection: 'Alle ausgewählten Zeilen abwählen, ohne etwas zu ändern.',
    pageSize: 'Wie viele Zeilen pro Seite geladen werden. Größere Seiten laden länger. Die Auswahl wird pro Tabelle gespeichert.',
    first: 'Zur ersten Ergebnisseite wechseln.',
    prev: 'Eine Ergebnisseite zurückgehen.',
    jump: 'Geben Sie eine Seitenzahl zwischen 1 und {{total}} ein und drücken Sie die Eingabetaste, um direkt dorthin zu springen.',
    next: 'Eine Ergebnisseite weitergehen.',
    last: 'Zur letzten Ergebnisseite wechseln.',
    refresh: 'Diese Liste jetzt neu vom Server laden; Seite, Filter und Sortierung bleiben erhalten.',
    autoRefresh: 'Diese Daten automatisch per Timer neu laden. Aus hält die Ansicht still, während Sie lesen.',
    selectColumns: 'Auswählen, welche Spalten die Tabelle zeigt. Ihre Auswahl wird pro Tabelle in diesem Browser gespeichert.',
    columnPinned: '{{column}} wird immer angezeigt, weil Zeilen ohne diese Spalte nicht zu identifizieren sind.',
    columnToggle: 'Die Spalte {{column}} ein- oder ausblenden. {{tip}}',
    actionsFor: 'Die Aktionen für {{name}} öffnen: anzeigen, bearbeiten, duplizieren, JSON anzeigen, löschen und datensatzspezifische Aktionen.',
    actionsMenu: 'Die für diese Zeile verfügbaren Aktionen öffnen.',
    actionsColumn: 'Aktionen pro Zeile. Klicken Sie auf die drei Punkte, um anzuzeigen, zu bearbeiten, zu duplizieren, das JSON zu prüfen oder zu löschen.',
    search: 'Geben Sie einen Teil eines Namens ein, um die Liste einzugrenzen. Die Suche läuft auf dem Server, sobald Sie aufhören zu tippen.',
    clearFilters: 'Suchtext und alle Filter entfernen und wieder die vollständige Liste anzeigen.',
    bulkDelete: 'Alle ausgewählten Zeilen löschen. Sie werden zuerst um Bestätigung gebeten.'
  },
  filters: {
    decisionSource: 'Nur Freigaben anzeigen, die auf eine bestimmte Weise entschieden wurden: durch eine Regel, den Standard der Bereitstellung, eine Person, eine Zeitüberschreitung oder einen gestoppten Lauf.',
    runId: 'Nur die Freigaben eines Laufs anzeigen. Fügen Sie eine Lauf-ID wie run_... ein; die Liste wird aktualisiert, wenn Sie aufhören zu tippen.',
    status: 'Nur Datensätze in diesem Zustand anzeigen. Wählen Sie Alle, um den Filter zu entfernen.',
    harnessType: 'Nur Datensätze für eine Harness anzeigen, etwa Claude Code oder Codex.',
    kind: 'Nur Datensätze einer Art anzeigen. Wählen Sie Alle, um den Filter zu entfernen.',
    eventType: 'Nur Audit-Ereignisse eines Typs anzeigen, etwa fehlgeschlagene Anmeldungen oder Änderungen an Geheimnissen.',
    fromUtc: 'Nur Datensätze anzeigen, die zu oder nach diesem Zeitpunkt erstellt wurden (Ihre lokale Zeitzone).',
    toUtc: 'Nur Datensätze anzeigen, die vor diesem Zeitpunkt erstellt wurden (Ihre lokale Zeitzone).',
    method: 'Nur Anfragen mit dieser HTTP-Methode anzeigen.',
    statusCode: 'Nur Anfragen anzeigen, die diesen HTTP-Statuscode zurückgegeben haben, zum Beispiel 404 oder 500.',
    pathContains: 'Nur Anfragen anzeigen, deren Pfad diesen Text enthält, zum Beispiel /agents.',
    tenantId: 'Nur Anfragen in diesem Mandanten anzeigen. Leer lassen für alle Mandanten.',
    apply: 'Die Suche mit den obigen Filterwerten ausführen.',
    clear: 'Alle obigen Filter leeren und erneut suchen.',
    agentId: 'Nur Datensätze eines Agenten anzeigen. Wählen Sie Alle, um den Filter zu entfernen.'
  },
  form: {
    option: '{{option}} in {{field}} aufnehmen. Ausgewählte Optionen werden gespeichert, nicht ausgewählte weggelassen.',
    reveal: 'Den eingegebenen Wert im Klartext anzeigen, damit Sie ihn vor dem Speichern prüfen können.',
    hide: 'Den Wert wieder maskieren, damit Personen, die auf Ihren Bildschirm schauen, ihn nicht lesen können.',
    key: 'Schlüssel für diesen Eintrag von {{field}}. Schlüssel müssen innerhalb der Liste eindeutig sein.',
    value: 'Wert für diesen Eintrag von {{field}}. Vorlagen und Verweise auf Geheimnisse sind erlaubt, wo angegeben.',
    removeRow: 'Diesen Eintrag aus der Liste entfernen. Gespeichert wird erst, wenn Sie auf Speichern klicken.',
    addRow: 'Einen leeren Eintrag aus Schlüssel und Wert zu {{field}} hinzufügen.',
    moveUp: 'Dieses Element eine Position nach vorn verschieben. Die Reihenfolge ist hier wichtig, zum Beispiel bei Argumentlisten.',
    moveDown: 'Dieses Element eine Position nach hinten verschieben. Die Reihenfolge ist hier wichtig, zum Beispiel bei Argumentlisten.',
    removeItem: 'Dieses Element aus der Liste entfernen. Gespeichert wird erst, wenn Sie auf Speichern klicken.',
    addItem: 'Ein neues, leeres Element zu {{field}} hinzufügen und seine Felder ausfüllen.'
  },
  actions: {
    openDetail: 'Die vollständige Detailseite dieses Datensatzes öffnen.',
    view: 'Diesen Datensatz schreibgeschützt öffnen, um alle Felder ohne Risiko einer Änderung zu sehen.',
    edit: 'Diesen Datensatz in einem Formular öffnen, um ihn zu ändern. Änderungen werden beim Klick auf Speichern übernommen.',
    duplicate: 'Einen neuen Datensatz beginnen, vorbefüllt mit den Werten dieses Datensatzes und einem Namen mit -copy. Erstellt wird erst beim Speichern.',
    viewJson: 'Das rohe JSON genau so anzeigen, wie die API es liefert, zur Fehlersuche oder zum Kopieren in Skripte.',
    delete: 'Diesen Datensatz dauerhaft löschen. Sie werden um Bestätigung gebeten, und es kann nicht rückgängig gemacht werden.',
    add: 'Einen neuen Datensatz dieses Typs in einem Formular erstellen.',
    switchToEdit: 'Diese schreibgeschützte Ansicht in ein bearbeitbares Formular umschalten.',
    retryLoad: 'Erneut versuchen, diese Daten vom Server zu laden.'
  },
  modal: {
    close: 'Dieses Fenster schließen. Auf dem Server ändert sich nichts.',
    dismiss: 'Dieses Fenster ohne Speichern schließen. Sie können auch Escape drücken.',
    cancelForm: 'Das Formular schließen und nicht gespeicherte Änderungen verwerfen.',
    back: 'Zum vorherigen Schritt des Formulars wechseln. Ihre Eingaben bleiben erhalten.',
    next: 'Zum nächsten Schritt des Formulars wechseln. Gespeichert wird erst, wenn Sie auf Speichern klicken.',
    saveEdit: 'Ihre Änderungen an diesem Datensatz speichern. Der Server prüft sie und meldet jedes Feld, das korrigiert werden muss.',
    saveCreate: 'Den Datensatz mit diesen Werten erstellen. Der Server prüft sie und meldet jedes Feld, das korrigiert werden muss.',
    saveValue: 'Den Wert an den Server senden. Er wird beim Eintreffen verschlüsselt und nie wieder angezeigt.'
  },
  confirm: {
    delete: 'Ja, diesen Datensatz dauerhaft löschen.',
    bulkDelete: 'Ja, alle ausgewählten Datensätze dauerhaft löschen.',
    cancel: 'Zurückgehen, ohne etwas zu tun.',
    danger: 'Diese destruktive Aktion ausführen. Sie kann nicht rückgängig gemacht werden.',
    confirm: 'Die oben beschriebene Aktion ausführen.'
  },
  copy: {
    id: 'Die Datensatz-ID in die Zwischenablage kopieren, etwa für die REST API, SDKs oder Filter.',
    value: 'Diesen Wert in die Zwischenablage kopieren.',
    block: 'Den gesamten Block in die Zwischenablage kopieren, bereit zum Einfügen in ein Terminal oder eine Datei.',
    done: 'In die Zwischenablage kopiert.'
  },
  chart: {
    ranges: {
      hour: 'Die letzten 60 Minuten anzeigen, in Intervallen von einer Minute.',
      day: 'Die letzten 24 Stunden anzeigen. Die Intervalle sind so bemessen, dass das Diagramm lesbar bleibt.',
      week: 'Die letzten 7 Tage anzeigen. Die Intervalle sind so bemessen, dass das Diagramm lesbar bleibt.',
      month: 'Die letzten 30 Tage anzeigen. Die Intervalle sind so bemessen, dass das Diagramm lesbar bleibt.',
      custom: 'Eigene Start- und Endzeit wählen. Sehr lange Zeiträume lehnt der Server ab.'
    },
    refresh: 'Die Diagrammdaten jetzt neu vom Server laden.',
    tenant: 'Anfrageaktivität für einen Mandanten oder für alle Mandanten des Servers anzeigen.'
  },
  badges: {
    approvalsOn_one: 'Freigaben sind aktiviert: Die Harness fragt vor Werkzeugaufrufen nach, und {{count}} Regel entscheidet einige davon automatisch.',
    approvalsOn_other: 'Freigaben sind aktiviert: Die Harness fragt vor Werkzeugaufrufen nach, und {{count}} Regeln entscheiden einige davon automatisch.',
    approvalsOff: 'Freigaben sind deaktiviert: Die Harness führt Werkzeugaufrufe nach ihren eigenen Berechtigungseinstellungen ohne Nachfrage aus.',
    active: 'Aktiv: Dieser Datensatz wird verwendet.',
    inactive: 'Inaktiv: Dieser Datensatz bleibt erhalten, wird aber ignoriert, bis er wieder eingeschaltet wird.',
    builtIn: 'Integriert: mit Garrison ausgeliefert und schreibgeschützt. Klonen Sie ihn, um eine bearbeitbare Version zu erstellen.',
    custom: 'Benutzerdefiniert: in diesem Mandanten erstellt, daher bearbeitbar und löschbar.',
    systemAdmin: 'Systemadministration: kann alle Mandanten verwalten und umgeht Autorisierungsprüfungen.',
    tenantAdmin: 'Mandantenadministration: kann alles innerhalb dieses Mandanten verwalten.',
    user: 'Normaler Benutzer: Zugriff ergibt sich nur aus Rollenzuweisungen.',
    role: 'Diese Zuweisung vergibt die Rolle {{role}} mit allen ihren Berechtigungen.',
    deploymentActive: 'Aktiv: Diese Bereitstellung erhält ihren Anteil am Verkehr des Agenten.',
    deploymentInactive: 'Inaktiv: Diese Bereitstellung erhält keinen Verkehr, kann beim Aufruf aber weiterhin explizit benannt werden.'
  },
  permissions: {
    source: 'Die Rolle, aus der diese Berechtigung stammt. Ändern Sie den Zugriff über diese Rolle oder die Zuweisung, die sie vergibt.',
    type: 'Erlauben gewährt die Operationen; Verweigern blockiert sie, selbst wenn eine andere Rolle sie erlaubt.',
    resources: 'Die Arten von Datensätzen, die diese Berechtigung abdeckt, etwa Agent oder Run.',
    operations: 'Was mit diesen Datensätzen getan werden darf, etwa Read, Create oder Execute.',
    scope: 'Der Geltungsbereich Mandant umfasst alle Datensätze des Typs; der Geltungsbereich Ressource umfasst einen bestimmten Datensatz.'
  },
  compilePreview: {
    input: 'Eine Beispielnachricht eines Aufrufers zum Kompilieren. Sie wird in der Aufgabenvorlage zu {{input.message}}.',
    compile: 'Diese Bereitstellung genau wie bei einem Lauf kompilieren, ohne einen zu starten, und Befehlszeile, Dateien und Umgebung anzeigen.'
  },
  secretOnce: {
    accessKey: 'Der öffentliche Zugangsschlüssel. Er identifiziert die Zugangsdaten und kann bedenkenlos in der Konfiguration gespeichert werden.',
    secretKey: 'Der geheime Schlüssel. Er wird nur dieses eine Mal angezeigt; kopieren Sie ihn jetzt in Ihren Passwortmanager oder Geheimnisspeicher.',
    done: 'Dieses Fenster schließen. Der geheime Schlüssel kann später nicht abgerufen, nur rotiert werden.'
  },
  wizard: {
    skip: 'Den Assistenten schließen und für diesen Mandanten nicht mehr anbieten. Sie können ihn über die Seitenleiste wieder öffnen.',
    back: 'Zum vorherigen Schritt des Assistenten zurückgehen.',
    start: 'Einrichtung beginnen: Zugangsdaten hinzufügen, einen Beispielagenten anwenden und ihn testen.',
    saveSecret: 'Die Zugangsdaten verschlüsselt in diesem Mandanten speichern und zum nächsten Schritt wechseln.',
    skipStep: 'Ohne Zugangsdaten fortfahren. Der Beispielagent benötigt keine.',
    apply: 'Den Beispielagenten und die Bereitstellung aus dem oben gezeigten Manifest erstellen.',
    invoke: 'Einen Lauf des Beispielagenten mit Ihrer Nachricht starten und seine Detailseite öffnen.',
    secretName: 'Name der gespeicherten Zugangsdaten. Bereitstellungen verweisen beim Binden über diesen Namen darauf.',
    manifest: 'Das Beispielmanifest in YAML. Sie können es vor dem Anwenden bearbeiten, zum Beispiel um den Agenten umzubenennen.',
    message: 'Die Nachricht an den Beispielagenten. Die Test-Harness gibt sie unverändert zurück.'
  },
  tour: {
    skip: 'Die Tour jetzt beenden. Sie können sie über die Seitenleiste erneut abspielen.',
    back: 'Die vorherige Station der Tour anzeigen.',
    next: 'Zur nächsten Station der Tour wechseln.',
    done: 'Die Tour abschließen. Sie können sie über die Seitenleiste erneut abspielen.'
  },
  telemetry: {
    ...TELEMETRY,
    panel: 'Wie lange jede Phase dieses Laufs gedauert hat und was sie verbraucht hat. Die Dauern stammen von den Uhren von Worker und Server, wie bei jedem Feld beschrieben.',
    phases: 'Wo der Lauf seine Zeit verbracht hat, von links nach rechts: Warten in der Warteschlange, Harness-Start bis zum ersten Token, Streaming der Ausgabe und der Rest der Ausführung.',
    phase: {
      delegation: 'Zeit vor der ersten Modellausgabe, in der der Lauf auf delegierte Kindläufe gewartet hat. Das ist kein Harness-Start.',
      queue: 'Warten in der Warteschlange, bis ein Worker-Knoten den Lauf übernimmt.',
      startup: 'Vom Prozessstart bis zur ersten Modellausgabe, einschließlich Harness-Start und erster Modellanfrage.',
      streaming: 'Von der ersten bis zur letzten Modellausgabe.',
      tail: 'Ausführung nach der letzten Modellausgabe: Werkzeugaufrufe, Ergebnisverarbeitung und Prozessende.'
    }
  },
  blocked: {
    panel: 'Warum dieser Lauf noch wartet und was Sie ändern müssen, damit ein Worker ihn übernehmen kann.',
    openFleet: 'Öffnet die Seite Flotte: welche Worker-Knoten bereit sind, welche Harnesses jeder meldet und deren Prüfdetails.',
    openAgent: 'Öffnet den Agenten dieses Laufs, um seine Bereitstellungen samt Knotenpool und Knotenselektoren zu prüfen.',
    homeBanner: 'Wartende Läufe, die gerade kein bereiter Worker ausführen kann. Sie warten, bis ein passender Worker erscheint, oder schlagen fehl, sobald Runtime.FailBlockedAfterSeconds gesetzt ist und abläuft.',
    showRuns: 'Öffnet die Seite Läufe, gefiltert auf wartende Läufe. Blockierte Läufe tragen ein Warnabzeichen mit dem Grund.',
    queueColumn: 'Wartende Läufe dieser Gruppe, die gerade kein bereiter Worker ausführen kann. Zeigen Sie auf das Abzeichen für Grund und Abhilfe.'
  },
  enums: {
    approvalStatus: {
      Pending: 'Wartet darauf, dass eine Person ihn erlaubt oder verweigert. Bis dahin ist die Harness bei diesem Aufruf blockiert.',
      Approved: 'Der Werkzeugaufruf wurde erlaubt, durch eine Regel, den Standard der Bereitstellung, eine Person oder eine Zeitüberschreitung.',
      Denied: 'Der Werkzeugaufruf wurde abgelehnt. Die Harness hat die Ablehnungsmeldung erhalten und ohne ihn weitergemacht.',
      Expired: 'Niemand hat rechtzeitig entschieden, daher wurde die Zeitlimit-Entscheidung der Bereitstellung angewendet.',
      Cancelled: 'Der Lauf wurde gestoppt, während die Freigabe ausstand, daher wurde sie ohne Entscheidung geschlossen.'
    },
    approvalDecision: {
      Allow: 'Erlauben: Die Harness durfte den Werkzeugaufruf ausführen.',
      Deny: 'Verweigern: Die Harness wurde abgewiesen und hat den Grund erfahren.'
    },
    approvalSource: {
      DurableResume: "Eine einmalige menschliche Genehmigung aus dem vorherigen dauerhaften Prüfpunkt. Sie gilt nur für die passende fortgesetzte Werkzeuganfrage.",
      Rule: 'Sofort durch eine Regel der Bereitstellung entschieden. Die zutreffende Regel wird daneben angezeigt.',
      Default: 'Keine Regel traf zu, daher hat die Standardaktion der Bereitstellung entschieden.',
      User: 'Eine Person hat im Dashboard, über die API oder über MCP entschieden.',
      Timeout: 'Niemand hat vor dem Ablauf entschieden, daher galt die Zeitlimit-Entscheidung der Bereitstellung.',
      Cancelled: 'Der Lauf wurde gestoppt, während diese Freigabe wartete.'
    },
    approvalRuleAction: {
      Allow: 'Erlauben: Passende Werkzeugaufrufe werden ohne Nachfrage ausgeführt.',
      Deny: 'Verweigern: Passende Werkzeugaufrufe werden ohne Nachfrage abgelehnt. Verweigern geht vor jeder anderen Regel.',
      Ask: 'Person fragen: Passende Werkzeugaufrufe warten unter Freigaben auf eine Entscheidung.'
    },
    approvalKind: {
      Tool: 'Eine Claude Code-Berechtigungsabfrage für ein beliebiges Werkzeug, einschließlich MCP-Werkzeugen.',
      Command: 'Ein Shell-Befehl, den ein Lauf mit Codex app-server ausführen möchte. Regeln werten ihn als Bash aus.',
      FileChange: 'Eine Dateiänderung, die ein Lauf mit Codex app-server vornehmen möchte. Regeln werten sie als Edit aus.'
    },
    runBlockedReason: {
      NoReadyWorker: 'Blockiert: Kein Worker-Knoten ist bereit, daher kann niemand diesen Lauf übernehmen. Starten Sie einen Worker oder registrieren Sie einen neuen und prüfen Sie auf der Seite Flotte, welche Knoten verloren, offline, im Leeren oder gesperrt sind.',
      NoCapableWorker: 'Blockiert: Worker-Knoten sind bereit, aber keiner meldet den Harness dieses Laufs als verfügbar. Starten oder registrieren Sie einen Worker mit installiertem Harness, oder prüfen Sie dessen Anmeldedaten und Prüfergebnisse auf der Seite Flotte.',
      NoMatchingPool: 'Blockiert: Ein bereiter Worker kann diesen Harness ausführen, aber keiner passt zum Knotenpool der Bereitstellung, zur Mandantenbindung des Pools oder zu den Knotenselektoren. Prüfen Sie die Platzierung der Bereitstellung oder fügen Sie dem Pool einen Worker hinzu.'
    },
    runStatus: {
      Pending: 'Ausstehend: Der Lauf wurde angenommen und wird vorbereitet, bevor er in die Warteschlange kommt.',
      Queued: 'In Warteschlange: wartet auf einen Worker-Knoten mit passender Harness und Platzierung, der ihn übernimmt.',
      Leased: 'Zugewiesen: Ein Worker-Knoten hat den Lauf übernommen und bereitet den Arbeitsbereich vor.',
      Running: 'Läuft: Der Harness-Prozess wird auf einem Worker-Knoten ausgeführt.',
      Cancelling: 'Wird abgebrochen: Ein Stopp wurde angefordert, und der Worker fährt die Harness herunter.',
      Succeeded: 'Erfolgreich: Die Harness wurde beendet und hat ein gültiges Ergebnis geliefert.',
      Failed: 'Fehlgeschlagen: Der Lauf endete mit einem Fehler. Die Spalte Ergebnis nennt den Grund.',
      Cancelled: 'Abgebrochen: Jemand hat den Lauf vor seinem Ende gestoppt.',
      TimedOut: 'Zeitüberschreitung: Der Lauf hat seine Frist erreicht und wurde gestoppt.',
      Rejected: 'Abgelehnt: Der Lauf konnte nicht starten, zum Beispiel weil keine Bereitstellung aktiv war.'
    },
    runOutcome: {
      None: 'Der Lauf ist noch nicht beendet, daher gibt es noch kein Ergebnis.',
      Succeeded: 'Die Harness wurde beendet, und ihr Ergebnis hat die Prüfung bestanden.',
      HarnessFailed: 'Die Harness hat einen Fehler gemeldet oder wurde ohne verwendbares Ergebnis beendet. Prüfen Sie Stderr und das Protokoll.',
      NotInstalled: 'Das Programm der Harness wurde auf dem Worker-Knoten nicht gefunden.',
      NotCredentialed: 'Die Harness hatte keine verwendbaren Zugangsdaten. Binden Sie ein Geheimnis an die Bereitstellung.',
      McpPreflightFailed: 'Ein erforderlicher MCP-Server oder ein erforderliches Werkzeug war bei der Prüfung des Workers vor dem Start nicht erreichbar.',
      NodeLost: 'Der Worker-Knoten hat keine Heartbeats mehr gesendet, während er den Lauf hielt.',
      OutputLimitExceeded: 'Der Lauf hat zu viel Ausgabe erzeugt: Seine Antwort hat die maximalen Assistentenzeichen der Bereitstellung überschritten (ein Laufwächter), oder der Harness hat mehr geschrieben, als das Harness-Profil erlaubt. Die bisherige Ausgabe bleibt erhalten.',
      SchemaValidationFailed: 'Das Ergebnis entsprach nicht dem JSON-Schema der Ausgabe des Agenten: nach einem Reparaturversuch oder sofort, wenn die Harness ihre Sitzung nicht fortsetzen kann.',
      TimedOut: 'Der Lauf hat seine Frist erreicht.',
      Cancelled: 'Der Lauf wurde auf Anforderung abgebrochen.',
      StaleLease: 'Der Worker hat sich gemeldet, nachdem er seine Lease verloren hatte, daher wurde sein Ergebnis ignoriert.',
      CompileFailed: 'Die Bereitstellung konnte nicht kompiliert werden, zum Beispiel wegen einer fehlenden Vorlagenvariable.',
      WorkspaceFailed: 'Der Arbeitsbereich konnte nicht vorbereitet werden, zum Beispiel weil ein Git-Klon fehlgeschlagen ist.',
      Rejected: 'Die Anfrage wurde abgelehnt, bevor ein Lauf starten konnte.',
      InternalError: 'In Garrison ist ein interner Fehler aufgetreten. Details stehen in den Serverprotokollen.',
      NoCapableWorker: 'Der Lauf wartete länger in der Warteschlange, als die Clustereinstellung Runtime.FailBlockedAfterSeconds erlaubt, und kein bereiter Worker konnte ihn ausführen. Deshalb ist er fehlgeschlagen.',
      RepetitionDetected: 'Ein Laufwächter hat den Lauf gestoppt, weil seine Antwort in immer denselben kurzen Text oder nur Leerraum und Satzzeichen abgeglitten ist. Die bisherige Ausgabe bleibt erhalten. Einstellbar mit dem Wiederholungswächter der Bereitstellung.',
      NoProgress: 'Ein Laufwächter hat den Lauf gestoppt, weil länger als das Zeitlimit ohne Fortschritt der Bereitstellung kein Text, kein Denken und keine Toolaktivität kam. Die bisherige Ausgabe bleibt erhalten.',
      PodFailed: 'Der Lauf-Pod ist außerhalb des Harness fehlgeschlagen: Er konnte nicht eingeplant werden, sein Image ließ sich nicht laden, der Speicher reichte nicht, er wurde verdrängt oder er endete ohne Rückmeldung. Die Fehlermeldung nennt die Ursache.',
      ConversationStateLost: 'Der Knoten, der diese Konversationsrunde fortsetzen sollte, hatte die Verzeichnisse der Konversation nicht mehr. Garrison stellt eine solche Runde einmal zum Neuaufbau zurück in die Warteschlange; dieses Ergebnis bleibt nur, wenn das nicht möglich war.'
    },
    controlNodeStatus: {
      Starting: 'Startet: Das Replikat wird initialisiert und bedient noch keinen Verkehr.',
      Ready: 'Bereit: Das Replikat sendet Heartbeats und bedient REST-, MCP- und A2A-Anfragen.',
      Draining: 'Wird geleert: Das Herunterfahren hat begonnen. Die Bereitschaftsprüfung antwortet mit 503, und Datenströme und Long-Polls werden beendet.',
      Offline: 'Offline: Das Replikat wurde sauber beendet oder war 30 Sekunden still und wurde vom Leader markiert. Offline-Zeilen werden nach 24 Stunden entfernt.'
    },
    backplane: {
      Local: 'Lokal: Ereignisse bleiben in diesem Prozess. Passt für ein einzelnes Replikat; andere Replikate sehen sie nicht.',
      Polling: 'Datenbankabfrage: Replikate teilen Live-Ereignisse, indem sie die Datenbank abfragen. Funktioniert mit jeder Datenbank, mit kurzer Verzögerung.',
      PostgresNotify: 'PostgreSQL-Benachrichtigungen: Replikate teilen Live-Ereignisse über PostgreSQL LISTEN und NOTIFY, mit geringer Verzögerung.'
    },
    nodeStatus: {
      Ready: 'Bereit: sendet Heartbeats und nimmt neue Läufe an.',
      Draining: 'Wird geleert: beendet seine aktuellen Läufe und nimmt keine neuen an.',
      Cordoned: 'Gesperrt: nimmt keine neuen Läufe an; aktuelle Läufe laufen normal weiter.',
      Lost: 'Verloren: hat seine Heartbeats verpasst. Seine Läufe werden neu eingereiht oder schlagen fehl.',
      Offline: 'Offline: wurde ordnungsgemäß heruntergefahren und hält keine Läufe.'
    },
    usageQuotaScope: {"Tenant": "Mandant. Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "Agent": "Agent. Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "Deployment": "Bereitstellung. Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung."},
    harnessType: {
      ClaudeCode: 'Anthropic Claude Code CLI, ohne Oberfläche mit Stream-JSON-Ausgabe ausgeführt.',
      Codex: 'OpenAI Codex CLI, mit exec und JSONL-Ausgabe ausgeführt.',
      Mux: 'Mux CLI mit JSONL-Ausgabe; funktioniert mit lokalen und gehosteten Modellendpunkten.',
      GeminiCli: 'Google Gemini CLI mit Stream-JSON-Ausgabe.',
      Generic: 'Jeder andere Kommandozeilen-Agent, vollständig durch das Harness-Profil beschrieben.'
    },
    agentKind: {
      Hosted: 'Gehostet: Garrison führt diesen Agenten selbst über seine Bereitstellungen auf Worker-Knoten aus.',
      Remote: 'Entfernt: Der Agent läuft anderswo, und Garrison leitet Aufrufe an seinen A2A- oder MCP-Endpunkt weiter.'
    },
    secretStatus: {
      Ok: 'Die Anmeldedaten sind nach Kenntnis von Garrison verwendbar. Ein neuer Wert setzt ein Geheimnis immer in diesen Zustand zurück.',
      NeedsReauthentication: 'OpenAI hat die gespeicherte ChatGPT-Anmeldung endgültig abgelehnt, zum Beispiel weil ihr Refresh-Token schon verwendet wurde. Läufe mit diesem Geheimnis schlagen fehl, bis Sie den Wert durch eine neue Anmeldung ersetzen.'
    },
    secretKind: {
      AnthropicApiKey: 'Ein Anthropic-API-Schlüssel, den das Claude-Code-Profil als ANTHROPIC_API_KEY einsetzt.',
      ClaudeCodeOAuthToken: 'Ein Claude-Code-Abonnement-Token. Prüfen Sie die Anbieterbedingungen, bevor Sie es auf gemeinsam genutzten Servern verwenden.',
      OpenAiApiKey: 'Ein OpenAI-API-Schlüssel für Codex oder andere auf OpenAI basierende Harnesses.',
      CodexAuthJson: 'Der Inhalt einer Codex-Datei auth.json, die in das HOME des Laufs geschrieben wird.',
      GeminiApiKey: 'Ein Google-Gemini-API-Schlüssel für die Gemini CLI.',
      GenericEnv: 'Ein beliebiger Wert für eine Umgebungsvariable.',
      GenericFile: 'Ein beliebiger Wert, der in eine Datei geschrieben werden soll.',
      BearerToken: 'Ein Bearer-Token, typischerweise im Authorization-Header eines MCP-Servers verwendet.',
      BasicAuth: 'Ein Paar aus Benutzername und Passwort für die Basisauthentifizierung.',
      GitCredential: 'Ein Token oder Passwort zum Klonen privater Git-Repositorys für Arbeitsbereiche.'
    },
    workspaceKind: {
      Empty: 'Jeder Lauf beginnt in einem neuen, leeren Verzeichnis.',
      GitRepository: 'Jeder Lauf beginnt mit einem frischen Klon eines Git-Repositorys.',
      Seeded: 'Jeder Lauf beginnt mit den in der Vorlage aufgeführten Dateien.',
      PersistentVolume: 'Jeder Lauf bindet einen vorhandenen PersistentVolumeClaim als Arbeitsbereich ein, sodass Dateien zwischen Läufen erhalten bleiben. Erfordert den Executor Kubernetes-Job.'
    },
    runExecutor: {
      Process: 'Der Harness läuft als Unterprozess des Workers in dessen Container, mit eigenen Arbeits-, Home- und Konfigurationsverzeichnissen.',
      KubernetesJob: 'Der Worker startet pro Lauf einen Kubernetes-Job: Der Harness läuft in einem eigenen Pod ohne Kubernetes- oder Garrison-Zugangsdaten, mit schreibgeschütztem Root-Dateisystem und den Ressourcenlimits der Bereitstellung.'
    },
    promptTemplateKind: {
      System: 'Ein System-Prompt: die dauerhaften Anweisungen, die den Agenten einrichten.',
      Task: 'Ein Aufgaben-Prompt: verpackt die Nachricht des Aufrufers in das, was die Harness erhält.',
      Fragment: 'Ein wiederverwendbarer Baustein, den andere Vorlagen mit {{> name}} einbinden.',
      ToolDescription: 'Text, der einen Agenten als MCP-Werkzeug oder A2A-Fähigkeit beschreibt.',
      ConfigFile: 'Der Inhalt einer erzeugten Konfigurationsdatei, etwa einer MCP-Konfiguration.',
      Other: 'Jeder andere Text, den ein Harness-Profil rendert.'
    },
    mcpTransport: {
      Http: 'Garrison und die Harness erreichen den Server über streambares HTTP unter einer URL.',
      Stdio: 'Die Harness startet den Server als lokalen Prozess und kommuniziert über stdin und stdout mit ihm.'
    },
    permissionType: {
      Permit: 'Erlauben: gestattet die aufgeführten Operationen.',
      Deny: 'Verweigern: blockiert die aufgeführten Operationen, selbst wenn eine andere Berechtigung sie erlaubt.'
    },
    artifactStoreKind: {
      Database: 'Artefakte werden in der Garrison-Datenbank gespeichert. Einfach, aber am besten für kleine Dateien.',
      Filesystem: 'Artefakte werden in ein Verzeichnis geschrieben, das der Server erreichen kann.',
      S3: 'Artefakte werden in einen S3-kompatiblen Bucket hochgeladen.'
    },
    manifestApplyResult: {
      Created: 'Dieses Dokument hat einen neuen Datensatz erstellt.',
      Updated: 'Dieses Dokument hat einen vorhandenen Datensatz geändert.',
      Unchanged: 'Der Datensatz entsprach bereits diesem Dokument, daher wurde nichts geändert.',
      Failed: 'Dieses Dokument hat die Prüfung nicht bestanden. Aus dem Manifest wurde nichts geschrieben.',
      Validated: 'Probelauf: Dieses Dokument ist gültig und würde angewendet.'
    },
    auditEventType: {
      ApprovalDecided: 'Eine Person hat einen ausstehenden Werkzeugaufruf erlaubt oder verweigert. Der Eintrag nennt Werkzeug, Lauf und Begründung.',
      AuthSuccess: 'Jemand hat sich angemeldet oder eine Anfrage erfolgreich authentifiziert.',
      AuthFailure: 'Ein Anmelde- oder Authentifizierungsversuch ist fehlgeschlagen. Wiederholte Fehlschläge können bedeuten, dass jemand rät.',
      SessionIssued: 'Ein Sitzungstoken wurde ausgestellt.',
      SessionRevoked: 'Ein Sitzungstoken wurde widerrufen, zum Beispiel durch Abmelden.',
      CredentialCreated: 'Ein neuer Zugangsschlüssel wurde erstellt.',
      CredentialRotated: 'Das Geheimnis eines Zugangsschlüssels wurde ersetzt.',
      CredentialUsed: 'Ein Zugangsschlüssel wurde zur Authentifizierung verwendet.',
      AuthorizationDenied: 'Eine Anfrage wurde abgelehnt, weil dem Aufrufer die Berechtigung fehlte.',
      AuthorizationBypass: 'Eine Anfrage hat die Autorisierung über eine Umgehungsregel übersprungen, etwa als Systemadministration.',
      RoleChanged: 'Eine Rolle wurde erstellt, geändert oder gelöscht.',
      PermissionChanged: 'Eine Berechtigung wurde erstellt, geändert oder gelöscht.',
      AssignmentChanged: 'Eine Rollenzuweisung wurde erstellt, geändert oder gelöscht.',
      ConfigurationChanged: 'Ein Agent, eine Bereitstellung, ein Profil, eine Vorlage oder ein anderer Konfigurationsdatensatz wurde geändert.',
      SecretChanged: 'Ein Geheimnis wurde erstellt, geändert, rotiert oder gelöscht.',
      SettingsChanged: 'Servereinstellungen wurden geändert.',
      RestartRequested: 'Jemand hat einen Neustart des Servers angefordert.',
      ManifestApplied: 'Ein Manifest wurde auf den Mandanten angewendet.',
      NodeRegistered: 'Ein Worker-Knoten hat sich bei der Steuerungsebene registriert.',
      NodeStatusChanged: 'Ein Worker-Knoten wurde gesperrt, geleert, verloren oder ist zurückgekehrt.',
      RunCancelled: 'Ein Lauf wurde von einem Benutzer, einem Zugangsschlüssel oder seinem übergeordneten Lauf abgebrochen.',
      ConversationDeleted: 'Jemand hat eine Konversation gelöscht. Ihre Runden bleiben als gewöhnliche Läufe erhalten.'
    },
    conversationFallbackReason: {
      AffinityNodeLost: 'Der Knoten mit der Konversation war nicht mehr bereit (verloren, im Drain, abgeriegelt oder gelöscht), daher hat ein anderer Knoten die Runde übernommen.',
      AffinityWaitExpired: 'Der Knoten mit der Konversation blieb bereit, hat die Runde aber nicht innerhalb von Runtime.ConversationAffinityWaitMs übernommen, daher hat ein anderer Knoten sie genommen.',
      WorkspaceLost: 'Der Knoten hat die Runde übernommen, aber Arbeitsbereich und Home-Verzeichnis der Konversation fehlten dort.',
      SessionMissing: 'Es gibt frühere Runden, aber keine hat eine Harness-Sitzung zum Fortsetzen gemeldet, zum Beispiel weil alle früh fehlschlugen.',
      HarnessChanged: 'Das Harness-Profil der Bereitstellung hat sich seit dem Aufzeichnen der Sitzung geändert, daher kann das neue Profil sie nicht fortsetzen.',
      ResumeUnsupported: 'Das Harness-Profil der Bereitstellung unterstützt das Fortsetzen einer Sitzung nicht, daher beginnt jede spätere Runde mit dem Verlauf.',
      ExecutorWithoutState: 'Die Runde läuft als Kubernetes Job, der jedes Mal mit leerem Home-Verzeichnis startet, daher beginnt jede spätere Runde mit dem Verlauf.'
    }
  },
  resources: {
    approvals: {
      createdUtc: 'Wann die Harness nachgefragt hat. Bewegen Sie den Mauszeiger über den Wert, um die genaue Zeit zu sehen.',
      agentName: 'Der Agent, dessen Lauf diesen Werkzeugaufruf angefordert hat.',
      toolName: 'Das Werkzeug, das die Harness verwenden möchte, etwa Bash, Edit, WebFetch oder ein MCP-Werkzeug.',
      summary: 'Eine Zeile zum Aufruf: Befehl, URL, Pfade oder Suchanfrage, mit geschwärzten Geheimnissen.',
      status: 'Ausstehend bis zur Entscheidung, dann Erlaubt, Verweigert, Abgelaufen (Zeitüberschreitung) oder Abgebrochen (der Lauf wurde gestoppt).',
      decision: 'Erlauben oder Verweigern nach der Entscheidung; leer, solange die Freigabe aussteht.',
      decisionSource: 'Was entschieden hat: eine Regel, der Standard der Bereitstellung, eine Person, eine Zeitüberschreitung oder ein gestoppter Lauf.',
      decidedBy: 'Die Person oder der Zugangsschlüssel, die entschieden hat, wenn eine Person entschieden hat.',
      expiresUtc: 'Wann eine ausstehende Freigabe abläuft und die Zeitlimit-Entscheidung der Bereitstellung greift.',
      kind: 'Werkzeugaufruf (Claude Code), Befehl oder Dateiänderung (Codex app-server).',
      harnessType: 'Die Harness, die nachgefragt hat: Claude Code oder Codex.',
      runId: 'Der Lauf, der nachgefragt hat. Öffnen Sie ihn, um das Transkript rund um den Aufruf zu sehen.',
      rootRunId: 'Der oberste Lauf des Delegationsbaums, wenn der nachfragende Lauf delegiert wurde.',
      deploymentId: 'Die Bereitstellung, deren Regeln diesen Aufruf ausgewertet haben. Gemerkte Regeln werden ihr hinzugefügt.',
      leaseEpoch: 'Lease-Epoche des nachfragenden Laufversuchs, damit eine Entscheidung nie einen späteren Versuch erreicht.',
      requestedUtc: 'Wann die Harness um Berechtigung gebeten hat.',
      decidedUtc: 'Wann die Entscheidung getroffen wurde.',
      waitMs: 'Wie lange der Aufruf von der Anfrage bis zur Entscheidung gewartet hat.',
      timeoutDecision: 'Was passiert, wenn niemand vor Ablauf der Freigabe entscheidet, laut den Einstellungen der Bereitstellung.',
      toolCallId: 'Die eigene ID der Harness für diesen Werkzeugaufruf, um ihn im Transkript zuzuordnen.',
      reason: 'Die Notiz der entscheidenden Person, falls vorhanden.',
      inputPreview: 'Die Werkzeugeingabe, die die Harness gesendet hat, als JSON, mit geschwärzten Geheimnissen und tokenartigen Werten.',
      rulePattern: 'Die Regel der Bereitstellung, die diesen Aufruf getroffen hat, wenn eine Regel entschieden oder eine Person angefragt hat.',
      ruleId: 'ID der zutreffenden Regel der Bereitstellung.',
      suggestedRule: 'Eine Regel, die diesen Aufruf treffen würde. Als Regel merken füllt sie vorab aus.',
      rememberedRuleId: 'ID der Regel, die der Bereitstellung hinzugefügt wurde, als diese Freigabe mit Merken entschieden wurde.',
      id: 'Freigabe-Kennung (apr_...) für die API und die MCP-Werkzeuge.',
      actions: {
        allow: 'Diesen ausstehenden Werkzeugaufruf erlauben, mit optionaler Begründung und der Möglichkeit, ihn als Regel zu merken.',
        deny: 'Diesen ausstehenden Werkzeugaufruf verweigern, mit optionaler Begründung und der Möglichkeit, ihn als Regel zu merken.',
        openRun: 'Den nachfragenden Lauf öffnen, um sein Transkript rund um diesen Werkzeugaufruf zu lesen.'
      }
    },
    tenants: {
      add: 'Einen neuen Mandanten erstellen: einen isolierten Bereich mit eigenen Benutzern, Agenten, Geheimnissen und Läufen.',
      name: 'Anzeigename des Mandanten. Bei der Anmeldung wählen Personen den Mandanten über seine ID.',
      description: 'Für wen oder was dieser Mandant gedacht ist, zum Beispiel ein Team oder eine Kundschaft.',
      active: 'In inaktiven Mandanten kann sich niemand anmelden, und es laufen keine Agenten. Ihre Daten bleiben erhalten.'
    },
    users: {
      add: 'Eine Person anlegen, die sich mit E-Mail und Passwort anmeldet. Vergeben Sie anschließend Zugriff über eine Rollenzuweisung.',
      email: 'Die Adresse, mit der sich die Person anmeldet. Innerhalb des Mandanten eindeutig.',
      name: 'Vor- und Nachname, angezeigt in Auditeinträgen und Listen.',
      role: 'Administrationsstufe des Kontos. Normale Benutzer erhalten Zugriff über Rollenzuweisungen.',
      password: 'Anmeldepasswort. Beim Bearbeiten leer lassen, um das aktuelle Passwort zu behalten.',
      firstName: 'Vorname, angezeigt in Listen und Auditeinträgen.',
      lastName: 'Nachname, angezeigt in Listen und Auditeinträgen.',
      isTenantAdmin: 'Mandantenadministration kann alles innerhalb dieses Mandanten verwalten, einschließlich Benutzern und Geheimnissen.',
      isAdmin: 'Systemadministration verwaltet alle Mandanten und umgeht die Autorisierung. Vergeben Sie dies sparsam.',
      active: 'Inaktive Benutzer können sich nicht anmelden, und ihre Zugangsschlüssel funktionieren nicht mehr.',
      actions: { permissions: 'Alle Berechtigungen anzeigen, die dieser Benutzer nach Kombination aller Rollen und Zuweisungen erhält.' }
    },
    credentials: {
      add: 'Einen Zugangsschlüssel für ein Skript, ein SDK oder einen Dienst erstellen. Das Geheimnis wird nach dem Speichern einmal angezeigt.',
      name: 'Wofür dieser Schlüssel gedacht ist, zum Beispiel ci-pipeline. Hilft, ihn vor dem Rotieren oder Löschen zu finden.',
      accessKey: 'Der öffentliche Teil des Schlüssels, der mit jeder Anfrage gesendet wird. Kann bedenkenlos in der Konfiguration gespeichert werden.',
      secretKeyLast4: 'Die letzten vier Zeichen des Geheimnisses, damit Sie einen Schlüssel zuordnen können, ohne ihn zu sehen.',
      userId: 'Der Benutzer, dem dieser Schlüssel gehört. Ein Schlüssel kann nie mehr als sein Eigentümer.',
      lastUsedUtc: 'Wann der Schlüssel zuletzt eine Anfrage authentifiziert hat. Alte Daten deuten auf ungenutzte Schlüssel hin, die Sie löschen können.',
      authMode: 'Wie sich der Schlüssel authentifizieren darf: direkt gesendet, pro Anfrage signiert, gegen eine Sitzung getauscht oder auf jede dieser Arten (Hybrid).',
      expiresUtc: 'Nach diesem Zeitpunkt funktioniert der Schlüssel nicht mehr. Leer lassen für einen Schlüssel ohne Ablauf.',
      active: 'Inaktive Schlüssel werden abgelehnt, bleiben aber erhalten, sodass Sie sie wieder einschalten können.',
      actions: {
        rotate: 'Das Geheimnis durch ein neues ersetzen. Das alte Geheimnis funktioniert sofort nicht mehr; das neue wird einmal angezeigt.',
        permissions: 'Alle Berechtigungen anzeigen, die dieser Schlüssel nach Kombination von Eigentümer, Rollen und Zuweisungen erhält.'
      }
    },
    roles: {
      add: 'Eine eigene Rolle erstellen, ihr dann Berechtigungen hinzufügen und sie Benutzern oder Schlüsseln zuweisen.',
      name: 'Name, den Personen beim Zuweisen der Rolle sehen, zum Beispiel Release Operator.',
      description: 'Wofür die Rolle gedacht ist und wer sie erhalten sollte.',
      active: 'Inaktive Rollen gewähren nichts, auch wenn sie zugewiesen sind.',
      actions: { clone: 'Eine bearbeitbare Kopie dieser integrierten Rolle erstellen, die Sie anpassen können.' }
    },
    permissions: {
      add: 'Eine Regel erstellen, die Operationen auf Ressourcentypen erlaubt oder verweigert.',
      name: 'Kurzer Name der Regel, angezeigt beim Zusammenstellen von Rollen.',
      permissionType: 'Erlauben gestattet die unten stehenden Operationen. Verweigern blockiert sie und gewinnt immer gegenüber einer Erlaubnis.',
      resourceTypes: 'Welche Arten von Datensätzen die Regel abdeckt. Alle umfasst jeden Typ.',
      operationTypes: 'Welche Operationen die Regel abdeckt, etwa Read, Create oder Execute (Aufruf).',
      active: 'Inaktive Berechtigungen haben keine Wirkung.'
    },
    userAssignments: {
      add: 'Einem Benutzer eine Rolle vergeben, für den ganzen Mandanten oder für einen bestimmten Datensatz.',
      userId: 'Die Person, die die Rolle erhält.',
      roleName: 'Die vergebene Rolle. Die Person erhält alle ihre Berechtigungen.',
      roleId: 'Die zu vergebende Rolle. Die Person erhält alle ihre Berechtigungen.',
      resourceScope: 'Mandant wendet die Rolle auf jeden Datensatz an. Ressource beschränkt sie auf den unten genannten Datensatz.',
      resourceId: 'Kennung des einzelnen Datensatzes, für den die Rolle gilt, zum Beispiel eine Agenten-ID.',
      inheritsToChildren: 'Die Rolle auf jeden Datensatz im Mandanten anwenden, auch auf später erstellte.',
      active: 'Inaktive Zuweisungen gewähren nichts, bleiben aber erhalten.'
    },
    credentialAssignments: {
      add: 'Einem Zugangsschlüssel eine Rolle vergeben, für den ganzen Mandanten oder für einen bestimmten Datensatz.',
      credentialId: 'Der Zugangsschlüssel, der die Rolle erhält. Er kann trotzdem nie mehr als sein Eigentümer.',
      roleName: 'Die an den Schlüssel vergebene Rolle.',
      roleId: 'Die zu vergebende Rolle. Wählen Sie die engste Rolle, mit der die Automatisierung ihre Aufgabe erledigen kann.',
      resourceScope: 'Mandant wendet die Rolle auf jeden Datensatz an. Ressource beschränkt sie auf den unten genannten Datensatz.',
      resourceId: 'Kennung des einzelnen Datensatzes, für den die Rolle gilt, zum Beispiel der eine Agent, den ein CI-Job aufrufen darf.',
      inheritsToChildren: 'Die Rolle auf jeden Datensatz im Mandanten anwenden, auch auf später erstellte.',
      active: 'Inaktive Zuweisungen gewähren nichts, bleiben aber erhalten.'
    },
    harnessProfiles: {
      add: 'Eine neue Art beschreiben, einen CLI-Agenten ohne Oberfläche zu starten. Ein integriertes Profil zu klonen ist meist einfacher.',
      name: 'Profilname. Bereitstellungen wählen ein Profil über diesen Namen. Das Präfix builtin/ ist reserviert.',
      harnessType: 'Welche Harness dieses Profil startet. Worker melden die Typen, die sie ausführen können, und das steuert die Platzierung.',
      executable: 'Befehl, der auf dem Worker ausgeführt wird, über PATH gefunden oder als absoluter Pfad angegeben, zum Beispiel claude.',
      outputParser: 'Wie die Ausgabe der Harness in Protokollereignisse und ein Endergebnis umgewandelt wird.',
      description: 'Was an diesem Profil besonders ist, zum Beispiel welche Flags es hinzufügt.',
      probeArguments: 'Argumente für eine Versionsprüfung, die keine Token verbraucht, etwa --version. Worker führen sie beim Start aus.',
      active: 'Inaktive Profile können von neuen Läufen nicht verwendet werden.',
      arguments: 'Geordnete Befehlszeilenargumente. Jedes ist eine Vorlage, kann durch eine Bedingung ausgelassen und über eine Liste wiederholt werden.',
      argumentsItems: {
        template: 'Text eines Arguments, zum Beispiel --model oder {{deployment.model}}.',
        condition: 'Vorlagenausdruck; ergibt er leer oder false, wird dieses Argument ausgelassen.',
        repeatOver: 'Name einer Listenvariable; das Argument wird einmal pro Element ausgegeben.'
      },
      promptDelivery: 'Wie der Aufgaben-Prompt die Harness erreicht: über die Standardeingabe, als Argument oder in einer Datei.',
      promptArgumentTemplate: 'Das Argument oder der Dateiname, der verwendet wird, wenn der Prompt nicht über die Standardeingabe gesendet wird.',
      systemPromptDelivery: 'Wie der System-Prompt die Harness erreicht: als Datei, als Argument, als Umgebungsvariable, der Aufgabe vorangestellt oder gar nicht.',
      systemPromptTarget: 'Das Flag, die Variable oder der Dateiname, der den System-Prompt trägt.',
      mcpConfigFormat: 'Welches MCP-Konfigurationsformat diese Harness liest. Garrison schreibt die gebundenen MCP-Server des Laufs in diesem Format.',
      mcpConfigFileName: 'Dateiname der erzeugten MCP-Konfiguration im Konfigurationsverzeichnis des Laufs.',
      environment: 'Umgebungsvariablen für den Prozess. Werte sind Vorlagen; {{secret.alias}} setzt ein gebundenes Geheimnis ein.',
      environmentItems: {
        name: 'Variablenname, zum Beispiel ANTHROPIC_API_KEY.',
        valueTemplate: 'Vorlage für den Wert. Verwenden Sie {{secret.alias}} für Zugangsdaten.',
        condition: 'Vorlagenausdruck; ergibt er leer oder false, wird die Variable nicht gesetzt.',
        isSecret: 'Den Wert als geheim behandeln: nie protokolliert und in Vorschauen geschwärzt.'
      },
      files: 'Dateien, die vor dem Start geschrieben werden, etwa Einstellungsdateien oder auth.json.',
      filesItems: FILE_ITEMS,
      credentialEnvironmentAllowlist: 'Namen von Umgebungsvariablen, die für diese Harness aus Geheimnissen befüllt werden dürfen. Alles andere wird abgelehnt.',
      genericTextField: 'JSON-Pfad zum Assistententext in jeder Ausgabezeile, für den generischen JSONL-Parser.',
      genericFinalField: 'JSON-Pfad zum Text des Endergebnisses, für den generischen JSONL-Parser.',
      genericSuccessField: 'JSON-Pfad, der angibt, ob der Lauf erfolgreich war, für den generischen JSONL-Parser.',
      genericSuccessValue: 'Der Wert am Erfolgspfad, der einen erfolgreichen Lauf bedeutet, zum Beispiel true.',
      resultSource: 'Woher die endgültige Antwort stammt: aus dem letzten Ereignis des Parsers, aus einer Datei mit der letzten Nachricht oder aus der gesamten Standardausgabe.',
      resultFileName: 'Name der Datei, in die die Harness ihre letzte Nachricht schreibt, wenn die Ergebnisquelle eine Datei ist.',
      successPolicy: 'Wie über Erfolg entschieden wird: anhand des letzten Parser-Ereignisses, anhand des Exit-Codes oder anhand beider.',
      successExitCodes: 'Exit-Codes, die als Erfolg gelten, wenn die Regel Exit-Codes verwendet. Einer pro Zeile.',
      defaultTimeoutSeconds: 'Frist eines Laufs in Sekunden, wenn die Bereitstellung keine festlegt. Zwischen 5 und 86400.',
      killGraceSeconds: 'Sekunden zwischen der Aufforderung an den Prozess, sich zu beenden, und dem Beenden seines Prozessbaums. Zwischen 0 und 60.',
      maxOutputBytes: 'Höchstmenge an Standardausgabe, die ein Lauf erzeugen darf, bevor er mit Ausgabelimit überschritten fehlschlägt.',
      stderrTailBytes: 'Wie viel vom Ende der Standardfehlerausgabe für die Detailseite des Laufs aufbewahrt wird.',
      isolateHome: 'Jedem Lauf ein eigenes HOME-Verzeichnis geben, damit Einstellungen und Caches der Harness nie zwischen Läufen durchsickern.',
      supportsResume: 'Ob diese Harness eine frühere Sitzung fortsetzen kann. Wird von Konversationen verwendet.',
      steps: {
        basics: 'Name, Harness-Typ, Programm und die Versionsprüfung.',
        invocation: 'Argumente, Prompt-Übergabe, MCP-Konfiguration, Umgebung und Dateien.',
        output: 'Wie die Ausgabe ausgewertet und über Erfolg entschieden wird.',
        limits: 'Zeitlimits, Ausgabegrenzen und HOME-Isolierung.'
      },
      actions: { clone: 'Eine bearbeitbare Kopie dieses Profils in Ihrem Mandanten erstellen, benannt mit dem Suffix -custom.' }
    },
    promptTemplates: {
      actions: { clone: 'Diese Vorlage unter einem selbst gewählten Namen kopieren und die Kopie im Editor öffnen.' },
      add: 'Eine neue Prompt-Vorlage im Editor mit Live-Vorschau schreiben. Jedes Speichern wird zu einer Version.',
      name: 'Name der Vorlage, eindeutig im Mandanten. Bereitstellungen binden Vorlagen über die ID, daher bleiben ihre Bindungen beim Umbenennen erhalten; Includes verweisen über den Namen.',
      kind: 'Wofür die Vorlage verwendet wird: System-Prompt, Aufgabenrahmen, Fragment, Werkzeugbeschreibung oder Konfigurationsdatei.',
      currentVersion: 'Die neueste gespeicherte Version. Bereitstellungen fixieren entweder eine Version oder folgen der neuesten.',
      description: 'Was die Vorlage tut und wo sie verwendet wird.'
    },
    mcpServers: {
      add: 'Einen MCP-Server registrieren, damit Bereitstellungen ihn binden und ihre Agenten seine Werkzeuge nutzen können.',
      name: 'Servername. Bereitstellungen binden ihn über diesen Namen und vergeben einen Alias.',
      transport: 'HTTP-Server werden über eine URL erreicht; stdio-Server startet die Harness als lokalen Prozess.',
      endpoint: 'Wo der Server erreicht wird: seine URL und sein Pfad oder der Befehl für einen stdio-Server.',
      required: 'Wenn eingeschaltet, schlägt ein Lauf vor dem Start fehl, falls dieser Server oder seine erforderlichen Werkzeuge nicht erreichbar sind.',
      description: 'Welche Werkzeuge dieser Server anbietet und welche Agenten ihn nutzen sollen.',
      url: 'Basis-URL des Servers, wie die Worker-Knoten ihn erreichen, ohne den MCP-Pfad.',
      path: 'Pfad des MCP-Endpunkts auf diesem Server, meist /mcp.',
      headers: 'HTTP-Header, die an den Server gesendet werden, etwa Authorization. Werte dürfen {{secret.alias}} verwenden.',
      headersItems: {
        name: 'Header-Name, zum Beispiel Authorization.',
        valueTemplate: 'Vorlage für den Header-Wert, zum Beispiel Bearer {{secret.github}}.'
      },
      command: 'Programm, das den stdio-Server auf dem Worker startet.',
      arguments: 'Argumente für den Befehl des stdio-Servers, eines pro Zeile.',
      environment: 'Umgebungsvariablen für den Prozess des stdio-Servers. Werte dürfen {{secret.alias}} verwenden.',
      environmentItems: {
        name: 'Variablenname für den Serverprozess.',
        valueTemplate: 'Wertvorlage. Verwenden Sie {{secret.alias}} für Zugangsdaten.'
      },
      requiredTools: 'Werkzeuge, die auf diesem Server vorhanden sein müssen. Der Worker prüft vor dem Start und lässt den Lauf fehlschlagen, wenn eines fehlt.',
      toolTimeoutSeconds: 'Wie lange ein einzelner Werkzeugaufruf dauern darf, bevor die Harness ihn aufgibt.',
      active: 'Inaktive Server werden bei neuen Läufen ausgelassen, auch wenn eine Bereitstellung sie bindet.',
      actions: { test: 'Jetzt eine Verbindung zum Server herstellen und seine Werkzeuge auflisten, um Adresse und Zugangsdaten zu prüfen.' }
    },
    secrets: {
      status: 'Ob die gespeicherten Anmeldedaten noch funktionieren. Garrison markiert eine Codex-Anmeldung, die sich nicht mehr erneuern lässt, mit „Erneute Anmeldung nötig“.',
      accessTokenExpiresUtc: 'Wann das Zugriffstoken einer gespeicherten Codex-ChatGPT-Anmeldung abläuft. Garrison erneuert es vorher und schreibt die neuen Token in das Geheimnis zurück.',
      refreshedUtc: 'Wann Garrison diese Codex-Anmeldung zuletzt selbst erneuert hat. Läufe erhalten immer nur eine Kopie ohne Refresh-Token.',
      statusMessage: 'Warum die Anmeldung nicht verwendet werden kann, wie vom Anbieter gemeldet.',
      statusUtc: 'Wann Garrison festgestellt hat, dass sich die Anmeldung nicht mehr erneuern lässt.',
      add: 'Neue Zugangsdaten wie einen API-Schlüssel oder ein Token verschlüsselt speichern. Bereitstellungen referenzieren sie über einen Alias; der Wert wird nach dem Speichern nie wieder angezeigt.',
      name: 'Name des Geheimnisses. Bereitstellungen wählen das Geheimnis über diesen Namen und vergeben einen Alias.',
      kind: 'Um welche Art von Zugangsdaten es sich handelt. Integrierte Profile erkennen an der Art, welche Variable oder Datei sie befüllen.',
      valueLast4: 'Die letzten vier Zeichen des gespeicherten Werts, damit Sie Geheimnisse unterscheiden können, ohne sie offenzulegen.',
      rotatedUtc: 'Wann der Wert zuletzt gesetzt oder rotiert wurde.',
      expiresUtc: 'Informativer Ablauf. Rotieren Sie den Wert vor diesem Datum.',
      description: 'Woher der Wert stammt und welche Agenten ihn benötigen.',
      value: 'Der geheime Wert. Er wird beim Speichern verschlüsselt und kann nie wieder gelesen, nur ersetzt werden.',
      newValue: 'Der Ersatzwert. Er gilt für jeden Lauf, der nach dem Speichern kompiliert wird.',
      active: 'Inaktive Geheimnisse werden nicht in Läufe eingesetzt.',
      saveValue: 'Den neuen Wert verschlüsseln und speichern. Der alte Wert wird verworfen und kann nicht wiederhergestellt werden.',
      actions: {
        setValue: 'Den gespeicherten Wert durch einen neuen ersetzen, den Sie eingeben. Der alte Wert kann nicht wiederhergestellt werden.',
        rotate: 'Einen neuen Wert einsetzen und den Zeitpunkt der Rotation festhalten, zum Beispiel nachdem der Anbieter einen neuen Schlüssel ausgestellt hat.'
      }
    },
    workspaces: {
      add: 'Festlegen, wie das Arbeitsverzeichnis eines Laufs vorbereitet wird: leer, aus Git geklont oder mit Dateien befüllt.',
      name: 'Vorlagenname. Bereitstellungen wählen eine Arbeitsbereichsvorlage über diesen Namen.',
      kind: 'Leer beginnt ohne Inhalt, Git-Repository klont ein Repository, Vorbefüllte Dateien schreibt die unten aufgeführten Dateien.',
      gitUrl: 'Repository, das für jeden Lauf geklont wird. Private Repositorys benötigen ein Geheimnis mit Git-Zugangsdaten.',
      retention: 'Was nach dem Lauf mit dem Verzeichnis geschieht: löschen, behalten oder nur behalten, wenn der Lauf fehlgeschlagen ist.',
      description: 'Was der Arbeitsbereich enthält und welche Agenten ihn verwenden.',
      gitRef: 'Branch, Tag oder Commit zum Auschecken. Leer lassen für den Standard-Branch.',
      gitDepth: 'Wie viele Commits abgerufen werden. 1 ist am schnellsten; 0 ruft den gesamten Verlauf ab.',
      gitCredentialSecretId: 'Geheimnis mit dem Token oder Passwort zum Klonen eines privaten Repositorys.',
      persistentVolumeClaim: 'Name des PersistentVolumeClaim, der am Arbeitsbereichspfad eingebunden wird. Er muss im Lauf-Namespace bereits existieren; Garrison erstellt oder löscht ihn nie.',
      files: 'Dateien, die vor dem Start des Laufs in den Arbeitsbereich geschrieben werden.',
      filesItems: {
        path: 'Pfad der Datei relativ zum Stammverzeichnis des Arbeitsbereichs.',
        content: 'Textinhalt der Datei.'
      },
      active: 'Inaktive Vorlagen können von neuen Läufen nicht verwendet werden.'
    },
    modelPrices: {"add": "Fügen Sie einen Preis für einen genauen Harness und Modellnamen hinzu. Anbieterpreise sind nicht vorgegeben.", "name": "Ein eindeutiger Konfigurationsname für diesen Preiseintrag im Mandanten.", "description": "Hinweise des Betreibers zur Quelle und zum Gültigkeitsdatum dieser Tarife.", "active": "Inaktive Preise werden nicht verwendet. Gespeicherte Laufkosten ändern sich durch Bearbeiten oder Löschen der Preise nicht.", "model": "Geben Sie einen genauen Modellnamen mit 1 bis 256 Zeichen ohne Steuerzeichen ein.", "harnessType": "Der Harness, dessen Token-Zählung und genauer Modellname zu diesen Tarifen gehören.", "inputUsdPerMillion": "Eingabe USD / Million Token. Geben Sie einen endlichen Tarif zwischen 0 und 1.000.000.000 ein. Null ist gültig.", "outputUsdPerMillion": "Ausgabe USD / Million Token. Geben Sie einen endlichen Tarif zwischen 0 und 1.000.000.000 ein. Null ist gültig.", "cachedInputUsdPerMillion": "Leer lassen, um den entsprechenden Eingabe- oder Ausgabetarif zu verwenden. Null bedeutet kostenlos.", "reasoningUsdPerMillion": "Leer lassen, um den entsprechenden Eingabe- oder Ausgabetarif zu verwenden. Null bedeutet kostenlos.", "inputIncludesCachedTokens": "Aktivieren, wenn Cache-Token in der Eingabe enthalten sind. Für Claude Code deaktivieren, da Cache-Lesezugriffe separat gemeldet werden.", "outputIncludesReasoningTokens": "Aktivieren, wenn Denkprozess-Token in der Ausgabe enthalten sind. Enthaltene Teilmengen werden vor Anwendung ihres eigenen Tarifs abgezogen."},
    usageQuotas: {"add": "Fügen Sie ein Kontingent für einen Mandanten, Agenten oder eine Bereitstellung hinzu. Leere Limits sind unbegrenzt.", "name": "Name. Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "description": "Beschreibung. Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "active": "Aktiv. Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "scope": "Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "resourceId": "Fügen Sie ein Kontingent für einen Mandanten, Agenten oder eine Bereitstellung hinzu. Leere Limits sind unbegrenzt.", "dailyRunLimit": "Läufe pro UTC-Tag. Leer lassen für unbegrenzte Nutzung. Null verbietet Nutzung. Tageszähler werden um Mitternacht UTC zurückgesetzt; Parallelität zählt aktuell aktive Läufe.", "dailyTokenLimit": "Token pro UTC-Tag. Leer lassen für unbegrenzte Nutzung. Null verbietet Nutzung. Tageszähler werden um Mitternacht UTC zurückgesetzt; Parallelität zählt aktuell aktive Läufe.", "dailyCostUsdLimit": "Bekannte USD pro UTC-Tag. Leer lassen für unbegrenzte Nutzung. Null verbietet Nutzung. Tageszähler werden um Mitternacht UTC zurückgesetzt; Parallelität zählt aktuell aktive Läufe.", "maxConcurrentRuns": "Maximale aktive Läufe. Leer lassen für unbegrenzte Nutzung. Null verbietet Nutzung. Tageszähler werden um Mitternacht UTC zurückgesetzt; Parallelität zählt aktuell aktive Läufe.", "actions": {"usage": "Tägliche Nutzung. Läufe pro UTC-Tag. Leer lassen für unbegrenzte Nutzung. Null verbietet Nutzung. Tageszähler werden um Mitternacht UTC zurückgesetzt; Parallelität zählt aktuell aktive Läufe."}, "usage": {"windowStartUtc": "Fensterbeginn (UTC). Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "windowEndUtc": "Tägliche Rücksetzung (UTC). Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "runsUsed": "Zugelassene Läufe. Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "tokensUsed": "Abgeschlossene Token. Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "costUsd": "Bekannte Kosten (USD). Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "unknownCostRuns": "Läufe ohne Kosten. Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "activeRuns": "Aktive Läufe. Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung."}, "enforcementEnabled": "Standardmäßig aus. Explizit aktivieren, um Läufe bei erreichten Grenzen abzulehnen und unterstützte Harness-Budgets zu senken. Ohne Aktivierung wird nur die Nutzung erfasst."},
    artifactStores: {
      add: 'Ein Ziel für Dateien erstellen, die Läufe erzeugen, damit sie den Arbeitsbereich des Laufs überdauern.',
      name: 'Speichername. Bereitstellungen wählen einen Artefaktspeicher über diesen Namen.',
      kind: 'Wo Dateien aufbewahrt werden: in der Garrison-Datenbank, in einem Dateisystemverzeichnis oder in einem S3-Bucket.',
      description: 'Was hier gespeichert wird und wie lange es aufbewahrt werden soll.',
      active: 'Inaktive Speicher erhalten keine neuen Artefakte.'
    },
    agents: {
      add: 'Eine neue Agentenidentität erstellen. Sie bewirkt nichts, bis Sie mindestens eine Bereitstellung dafür hinzufügen.',
      name: 'DNS-tauglicher Name, mit dem Aufrufende den Agenten über REST, MCP und A2A aufrufen. Kleinbuchstaben, Ziffern und Bindestriche.',
      displayName: 'Freundlicher Name, angezeigt in der Konsole und auf der A2A-Agentenkarte.',
      kind: 'Gehostete Agenten laufen hier über Bereitstellungen. Entfernte Agenten laufen anderswo und werden über ihren Endpunkt aufgerufen.',
      exposure: 'Welche Protokolle den Agenten anbieten: A2A gibt ihm eine Agentenkarte; MCP macht ihn zu einem Werkzeug für MCP-Clients.',
      delegationMode: 'Welche anderen Agenten die Läufe dieses Agenten aufrufen dürfen: keine, eine Zulassungsliste oder beliebige Agenten.',
      tags: 'Schlagwörter zum Finden und Gruppieren von Agenten. Sie haben keinen Einfluss darauf, wie der Agent läuft.',
      description: 'Was der Agent tut, in einfachen Worten. Die Beschreibung wird Aufrufenden und auf der A2A-Karte angezeigt, schreiben Sie sie also für diese.',
      agentVersion: 'Versionsangabe auf der A2A-Karte. Ändern Sie sie, wenn sich das Verhalten des Agenten ändert.',
      remoteProtocol: 'Wie Garrison den entfernten Agenten aufruft: A2A oder MCP.',
      remoteEndpointUrl: 'Adresse des A2A- oder MCP-Endpunkts des entfernten Agenten.',
      exposeA2A: 'Eine A2A-Agentenkarte veröffentlichen, damit andere A2A-Agenten diesen Agenten finden und aufrufen können.',
      exposeMcpTool: 'Diesen Agenten als eigenes Werkzeug auf dem MCP-Server von Garrison anbieten, damit MCP-Clients ihn direkt aufrufen können.',
      mcpToolName: 'Werkzeugname, den MCP-Clients sehen. Leer lassen, um den Agentennamen zu verwenden.',
      skills: 'A2A-Fähigkeiten auf der Agentenkarte. Sie beschreiben, was Aufrufende anfragen können.',
      skillsItems: {
        skillId: 'Stabile Kennung der Fähigkeit auf der A2A-Karte.',
        name: 'Kurzer Name der Fähigkeit, angezeigt für A2A-Aufrufende.',
        description: 'Was die Fähigkeit tut, geschrieben für den aufrufenden Agenten.'
      },
      inputMode: 'Text akzeptiert eine einfache Nachricht. Strukturiert verlangt eine Eingabe, die dem JSON-Schema der Eingabe entspricht.',
      inputSchemaJson: "JSON-Schema für die Eingabe des Agenten. Wenn gesetzt, muss jede Eingabe eines Aufrufs ein passendes JSON-Dokument sein, und Aufrufen zeigt ein daraus erzeugtes Formular.",
      outputSchemaJson: 'JSON-Schema, dem das Ergebnis entsprechen muss. Garrison prüft die Ausgabe und versucht es einmal mit einem Reparatur-Prompt erneut.',
      delegationAllowList: 'Die Agenten, die dieser Agent aufrufen darf, wenn die Delegation eine Zulassungsliste verwendet.',
      delegationMaxDepth: 'Wie viele Ebenen von Agent-zu-Agent-Aufrufen unterhalb dieses Agenten folgen dürfen. Zwischen 0 und 10.',
      delegationAllowRecursion: 'Erlauben, dass derselbe Agent zweimal in einer Aufrufkette vorkommt. Aus verhindert Schleifen.',
      active: 'Inaktive Agenten können nicht aufgerufen werden.',
      sections: {
        identity: 'Wer der Agent ist: Name, Beschreibung, Art und Version.',
        exposure: 'Welche Protokolle den Agenten anbieten und welche Fähigkeiten er aufführt.',
        io: 'Welche Eingabe der Agent akzeptiert und welche Ausgabe er liefern muss.',
        delegation: 'Ob dieser Agent andere Agenten aufrufen darf, und wie tief.'
      }
    },
    deployments: {
      approvalsEnabled: 'Die Harness fragt vor Werkzeugaufrufen nach. Die Regeln unten entscheiden die meisten Aufrufe; der Rest wartet unter Freigaben auf eine Person. Nur für Claude Code- und Codex app-server-Profile.',
      approvalDefaultAction: 'Was passiert, wenn keine Regel auf einen Werkzeugaufruf zutrifft: erlauben, verweigern oder eine Person fragen.',
      approvalTimeoutSeconds: 'Wie lange ein Aufruf auf eine Person wartet, bevor die Zeitlimit-Entscheidung greift, von 10 bis 3.600 Sekunden.',
      approvalTimeoutDecision: 'Die Entscheidung, die gilt, wenn niemand rechtzeitig antwortet. Verweigern ist die sichere Wahl.',
      approvalRules: 'Geordnete Regeln in Claude Code-Syntax. Verweigern geht vor Fragen und Fragen vor Erlauben; innerhalb einer Aktion wird der erste Treffer gemeldet.',
      approvalRulesItems: {
        action: 'Was ein passender Aufruf erhält: Erlauben, Verweigern oder Person fragen.',
        pattern: 'Claude Code-Regel, zum Beispiel Bash(npm test), Bash(npm run *), Edit(src/**), Read, WebFetch(domain:example.com) oder mcp__github__*.',
        inputPattern: 'Optionaler regulärer .NET-Ausdruck, auf den das Eingabe-JSON des Werkzeugs zusätzlich passen muss, für feinere Steuerung als das Muster.',
        description: 'Warum diese Regel existiert, für die Personen, die sie pflegen.'
      },
      approvalTest: 'Einen Werkzeugaufruf gegen die gespeicherten Regeln der Bereitstellung testen und sehen, ob er erlaubt, verweigert oder an eine Person geschickt würde.',
      add: 'Eine Bereitstellung erstellen: die konkrete Art, wie ein Agent läuft, mit Harness-Profil, Modell, Prompts und Ressourcen.',
      name: 'Name der Bereitstellung, eindeutig im Mandanten, zum Beispiel reviewer-claude.',
      agentId: 'Der Agent, den diese Bereitstellung ausführt. Ein Aufruf dieses Agenten kann diese Bereitstellung wählen.',
      harnessProfileId: 'Das Harness-Profil, das die CLI startet, zum Beispiel builtin/claude-code.',
      model: 'Modellname, der an die Harness übergeben wird, zum Beispiel sonnet oder gpt-5. In Vorlagen als deployment.model verfügbar.',
      weight: 'Verkehrsgewichtung unter den aktiven Bereitstellungen des Agenten. Eine Bereitstellung mit Gewichtung 300 erhält dreimal so viele Aufrufe wie eine mit 100.',
      configVersion: 'Erhöht sich bei jeder Änderung. Jeder Lauf hält fest, aus welcher Version er kompiliert wurde.',
      description: 'Worin sich diese Bereitstellung von den anderen des Agenten unterscheidet, zum Beispiel ein günstigeres Modell.',
      active: 'Inaktive Bereitstellungen erhalten keinen gewichteten Verkehr, Aufrufende können sie aber weiterhin explizit benennen.',
      fallbackModel: 'Modell, das verwendet wird, wenn das Hauptmodell überlastet ist, sofern die Harness dies unterstützt.',
      effort: 'Hinweis zum Reasoning-Aufwand für Harnesses, die ihn unterstützen, etwa low, medium oder high.',
      maxTurns: 'Höchstzahl an Agentenrunden, die ein Lauf nehmen darf, bevor die Harness ihn stoppt.',
      maxBudgetUsd: 'Ausgabenobergrenze pro Lauf in US-Dollar, für Harnesses, die eine durchsetzen.',
      parameters: 'Benannte Werte, die Vorlagen als deployment.parameters.name lesen können.',
      parametersItems: {
        name: 'Parametername, referenziert als deployment.parameters.name.',
        value: 'Standardwert. Aufrufende dürfen ihn nur überschreiben, wenn er unter den Überschreibungen pro Lauf aufgeführt ist.'
      },
      promptBindings: 'Welche Prompt-Vorlage jede Rolle füllt (System, Task, DelegatedTask und so weiter).',
      promptBindingsItems: {
        role: 'Die Prompt-Rolle, die diese Bindung füllt, etwa System oder Task.',
        templateId: 'Die für diese Rolle verwendete Vorlage.',
        pinnedVersion: 'Zu fixierende Version. Leer lassen, um immer die neueste Version zu verwenden.'
      },
      resourceBindings: 'MCP-Server und Geheimnisse, die diese Bereitstellung verwendet, jeweils unter einem Alias für Vorlagen.',
      resourceBindingsItems: {
        kind: 'Ob diese Bindung ein MCP-Server oder ein Geheimnis ist.',
        alias: 'Kurzname, den Vorlagen verwenden, zum Beispiel anthropic in {{secret.anthropic}}.',
        resourceId: 'Der MCP-Server oder das Geheimnis, das gebunden wird.'
      },
      workspaceTemplateId: 'Wie das Arbeitsverzeichnis jedes Laufs vorbereitet wird. Leer bedeutet ein frisches, leeres Verzeichnis.',
      artifactStoreId: 'Wohin von Läufen erzeugte Dateien nach ihrem Ende hochgeladen werden.',
      argumentOverrides: 'Änderungen an den Argumenten des Harness-Profils nur für diese Bereitstellung: anhängen, voranstellen, ersetzen oder entfernen.',
      argumentOverridesItems: {
        operation: 'Was getan werden soll: anhängen, voranstellen, ein passendes Argument ersetzen oder es entfernen.',
        match: 'Das vorhandene Argument, das ersetzt oder entfernt werden soll.',
        template: 'Der neue Argumenttext. Vorlagen sind erlaubt.',
        condition: 'Vorlagenausdruck; ergibt er leer oder false, wird die Überschreibung ausgelassen.'
      },
      environmentOverrides: 'Umgebungsvariablen, die nur für diese Bereitstellung hinzugefügt oder ersetzt werden.',
      environmentOverridesItems: {
        name: 'Name der Variable, die hinzugefügt oder ersetzt wird.',
        valueTemplate: 'Wertvorlage. Verwenden Sie {{secret.alias}} für gebundene Geheimnisse.',
        isSecret: 'Den Wert als geheim behandeln: nie protokolliert und in Vorschauen geschwärzt.'
      },
      fileOverrides: 'Dateien, die nur für diese Bereitstellung hinzugefügt oder ersetzt werden.',
      fileOverridesItems: FILE_ITEMS,
      allowedRunOverrides: 'Parameter, die Aufrufende pro Lauf mit Prüfung ändern dürfen. Alles andere bleibt fest.',
      allowedRunOverridesItems: {
        name: 'Parameter, den Aufrufende pro Lauf setzen dürfen, etwa model oder tone.',
        validation: 'Wie der Wert des Aufrufers geprüft wird: beliebig, eine Werteliste, ein regulärer Ausdruck oder ein Zahlenbereich.',
        pattern: 'Durch Kommas getrennte zulässige Werte, ein regulärer Ausdruck oder min,max für einen Zahlenbereich.'
      },
      nodePoolId: 'Nur auf Knoten in diesem Pool ausführen. Leer lassen, um jeden geeigneten Knoten zuzulassen.',
      nodeSelector: 'Knoten-Labels, die exakt übereinstimmen müssen, zum Beispiel gpu=true.',
      nodeSelectorItems: {
        key: 'Label-Name, den der Knoten haben muss.',
        value: 'Label-Wert, den der Knoten haben muss.'
      },
      maxConcurrentRuns: 'Höchstzahl gleichzeitiger Läufe dieser Bereitstellung über alle Knoten. 0 bedeutet unbegrenzt.',
      timeoutSeconds: 'Frist des Laufs in Sekunden. Leer verwendet den Standard des Harness-Profils. Die Clustereinstellung Runtime.MaxRunSeconds begrenzt jeden Lauf, auch Zeitlimits pro Lauf.',
      maxAttempts: 'Wie oft ein Lauf insgesamt versucht werden darf. Zwischen 1 und 10.',
      steps: {
        approvals: 'Welche Werkzeugaufrufe die Harness ausführen darf, welche nicht und welche auf eine Person warten.',
        basics: 'Name, Agent und Verkehrsgewichtung.',
        harness: 'Harness-Profil, Modell, Grenzen und Parameter.',
        prompts: 'Welche Vorlage jede Prompt-Rolle füllt.',
        resources: 'MCP-Server, Geheimnisse, Arbeitsbereich und Artefaktspeicher.',
        overrides: 'Änderungen pro Bereitstellung an Argumenten, Umgebung und Dateien sowie das, was Aufrufende überschreiben dürfen.',
        placement: 'Wo Läufe ausgeführt werden dürfen und wie viele gleichzeitig.'
      },
      actions: {
        compilePreview: 'Diese Bereitstellung mit einer Beispielnachricht kompilieren und genau die Befehlszeile, Dateien und Umgebung sehen, die ein Lauf erhalten würde.',
        test: 'Aufrufen mit dieser vorausgewählten Bereitstellung öffnen, um ihr eine echte Nachricht zu senden.'
      },
      repetitionGuard: 'Einen Lauf stoppen, wenn seine Antwort in immer denselben kurzen Text oder nur Leerraum und Satzzeichen abgleitet (Ergebnis „Wiederholung erkannt“). Nicht gesetzt folgt dem Cluster-Standard; setze oder entferne das Häkchen, um es für diese Bereitstellung festzulegen.',
      maxAssistantChars: 'Höchstzahl an Zeichen Assistententext pro Lauf, bevor Garrison ihn stoppt (Ergebnis „Ausgabelimit überschritten“). 0 bedeutet unbegrenzt; leer verwendet den Cluster-Standard.',
      noProgressSeconds: 'Einen Lauf stoppen, wenn so viele Sekunden lang kein Text, kein Denken, kein Toolaufruf und kein Toolergebnis kommt, während kein Toolaufruf läuft (Ergebnis „Kein Fortschritt“). 0 schaltet es aus; leer verwendet den Cluster-Standard.',
      executor: 'Wie Läufe ausgeführt werden: Prozess (im Worker) oder Kubernetes-Job (ein Pod pro Lauf, stärkere Isolation). Leer folgt dem Standard-Executor des Knotenpools, sonst Prozess.',
      podCpuRequest: 'CPU, die der Lauf-Pod anfordert, zum Beispiel 250m. Leer verwendet den Worker-Standard.',
      podCpuLimit: 'Höchstens nutzbare CPU des Lauf-Pods, zum Beispiel 2. Leer verwendet den Worker-Standard.',
      podMemoryRequest: 'Speicher, den der Lauf-Pod anfordert, zum Beispiel 512Mi. Leer verwendet den Worker-Standard.',
      podMemoryLimit: 'Höchstens nutzbarer Speicher des Lauf-Pods, zum Beispiel 4Gi. Ein Lauf darüber wird mit dem Ergebnis „Lauf-Pod fehlgeschlagen“ gestoppt.',
      podEphemeralStorageRequest: 'Lokaler Datenträger, den der Lauf-Pod für Arbeitsbereich, Home und temporäre Dateien anfordert, zum Beispiel 1Gi.',
      podEphemeralStorageLimit: 'Höchstens nutzbarer lokaler Datenträger des Lauf-Pods, zum Beispiel 10Gi. Ein Pod darüber wird verdrängt und der Lauf schlägt fehl.',
      useClusterDefault: 'Die eigene Einstellung dieser Bereitstellung entfernen, damit der Wiederholungswächter wieder dem Cluster-Standard folgt.',
      sections: {
        guards: 'Laufwächter stoppen außer Kontrolle geratene Läufe frühzeitig, bei jedem Harness. Leer gelassen folgt jeder dem Cluster-Standard unter Einstellungen (Laufzeit).',
        execution: 'Wählen Sie, wo Läufe ausgeführt werden, und für Kubernetes-Job-Läufe CPU, Speicher und Datenträger des Lauf-Pods.'
      }
    },
    nodePools: {
      add: 'Einen Pool erstellen, um Knoten zu gruppieren und optional für bestimmte Mandanten zu reservieren.',
      name: 'Poolname. Knoten treten einem Pool bei ihrer Registrierung bei, und Bereitstellungen können einen Pool voraussetzen.',
      description: 'Welche Hardware oder welchen Zweck dieser Pool darstellt.',
      tenants: 'Mandanten, die den Pool nutzen dürfen. Leer bedeutet alle Mandanten.',
      defaultExecutor: 'Executor für Läufe von Bereitstellungen in diesem Pool, die keinen eigenen wählen. Leer bedeutet Prozess.',
      active: 'Inaktive Pools nehmen keine neuen Läufe an.'
    },
    runs: {
      ...TELEMETRY,
      id: 'Kennung des Laufs. Klicken Sie auf die Zeile, um Protokoll, Ergebnis und Telemetrie zu öffnen.',
      agentName: 'Der aufgerufene Agent. Ein Lauf gehört immer zu genau einer Bereitstellung dieses Agenten.',
      status: 'Wo sich der Lauf in seinem Lebenszyklus befindet: in Warteschlange, zugewiesen, laufend oder in einem der Endzustände.',
      outcome: 'Warum der Lauf endete, ausführlicher als der Status, zum Beispiel Zugangsdaten fehlen.',
      harnessType: 'Die Harness, die den Lauf ausgeführt hat, aus dem Profil der Bereitstellung.',
      leaseNodeName: 'Der Worker-Knoten, der ihn ausgeführt hat. Leer, solange der Lauf noch in der Warteschlange ist.',
      depth: 'Wie viele Agent-zu-Agent-Aufrufe tief dieser Lauf liegt. 0 ist ein direkt von einem Aufrufer gestarteter Lauf.',
      createdUtc: 'Wann der Lauf angefordert wurde. Fahren Sie mit der Maus über den Wert, um die genaue Zeit zu sehen.',
      actions: {
        cancel: 'Diesen Lauf stoppen. Der Worker beendet den Harness-Prozess, und der Lauf endet als Abgebrochen.',
        retry: 'Einen neuen Lauf mit derselben Eingabe und Bereitstellung starten. Der ursprüngliche Lauf bleibt erhalten.'
      },
      conversationId: 'Die Konversation, zu der dieser Lauf als Runde gehört, mit der Rundennummer. Leer bei Läufen außerhalb einer Konversation.',
      conversationTurn: 'Position dieses Laufs in seiner Konversation, beginnend mit 1 für die Runde, die sie gestartet hat.'
    },
    nodes: {
      containerized: 'Ob der Worker in einem Container oder Pod läuft, wie er es bei der Registrierung gemeldet hat. Codex-Läufe auf einem containerisierten Worker verwenden standardmäßig die Sandbox danger-full-access, weil der Container die Isolationsgrenze ist.',
      name: 'Knotenname, meist der Kubernetes-Pod-Name des Workers.',
      status: 'Ob der Knoten neue Läufe annimmt. Sperren oder leeren Sie einen Knoten vor Wartungsarbeiten.',
      capacity: 'Läufe, die der Knoten gerade hält, im Verhältnis zur Höchstzahl, die er gleichzeitig annimmt.',
      harnesses: 'Harnesses, die der Knoten bei der Prüfung beim Start installiert und funktionsfähig vorgefunden hat.',
      executors: 'Executors, die der Knoten anbietet. Kubernetes-Job erscheint nur, wenn der Worker in einem Cluster läuft und Jobs erstellen darf.',
      labels: 'Labels aus Schlüssel und Wert, die der Knoten meldet. Knotenauswahlen von Bereitstellungen werden damit abgeglichen.',
      nodeVersion: 'Version der Worker-Software auf dem Knoten.',
      lastHeartbeatUtc: 'Wann sich der Knoten zuletzt gemeldet hat. Knoten, die sich nicht mehr melden, werden als verloren markiert.',
      address: 'Informative Adresse, die der Knoten gemeldet hat.',
      maxConcurrentRuns: 'Höchstzahl an Läufen, die dieser Knoten gleichzeitig annimmt.',
      childReserveSlots: 'Zusätzliche Plätze für delegierte Läufe, auf die ihr Elternlauf wartet: Für jeden Lauf auf diesem Knoten, der auf ein Kind wartet, öffnet sich einer, bis zu dieser Zahl.',
      maxResidentWaiters: 'Höchstzahl an Läufen auf diesem Knoten, die gleichzeitig auf einen delegierten Lauf warten dürfen. 0 bedeutet seine Kapazität. Eine Delegation darüber hinaus schlägt mit DelegationCapacityExhausted fehl.',
      activeRuns: 'Läufe, die der Knoten gerade hält.',
      capabilities: 'Was jede Harness-Prüfung ergeben hat: Typ, erkannte Version und ob sie nutzbar ist.',
      labelsItems: { key: 'Label-Name, abgeglichen von Knotenauswahlen der Bereitstellungen.', value: 'Label-Wert, von Knotenauswahlen der Bereitstellungen exakt abgeglichen.' },
      capabilitiesItems: {
        harnessType: 'Die geprüfte Harness.',
        detectedVersion: 'Versionsangabe, die die Harness gemeldet hat.',
        available: 'Ob die Harness auf diesem Knoten laufen kann.',
        detail: 'Ausgabe der Prüfung, hilfreich, wenn eine Harness nicht verfügbar ist.'
      },
      actions: {
        grafana: 'Das Dashboard „Workers“ in Grafana in einem neuen Tab öffnen, gefiltert auf den Knoten {{node}}.',
        cordon: 'Keine neuen Läufe mehr an diesen Knoten senden. Bereits laufende Läufe enden normal.',
        uncordon: 'Diesen Knoten wieder neue Läufe annehmen lassen.',
        drain: 'Neue Läufe stoppen und aktuelle zu Ende laufen lassen, danach ist der Knoten untätig. Vor dem Herunterfahren verwenden.',
        runs: 'Die Liste der Läufe öffnen, gefiltert auf die von diesem Knoten ausgeführten Läufe.'
      }
    },
    controlNodes: {
      name: 'Name des Replikats: die Knoten-ID, mit der der Server läuft (GARRISON_NODE_ID, in Kubernetes der Pod-Name).',
      status: 'Lebenszyklus des Replikats: Startet, Bereit, Wird geleert oder Offline. Nur bereite Replikate bedienen Verkehr.',
      version: 'Version des Garrison-Servers auf diesem Replikat. Unterschiedliche Versionen sind nur während eines Rolling Updates zu erwarten.',
      schemaVersion: 'Version des Datenbankschemas, die das Replikat beim Start vorgefunden hat. Alle Replikate sollten dieselbe Zahl melden.',
      backplane: 'Wie dieses Replikat Live-Ereignisse (Lauf-Datenströme, WebSocket-Aktualisierungen) mit den anderen Replikaten teilt.',
      uptime: 'Wie lange der Prozess des Replikats schon läuft, gezählt ab seiner Startzeit. Zeigen Sie darauf, um den genauen Start zu sehen.',
      lastHeartbeatUtc: 'Wann das Replikat zuletzt einen Heartbeat gesendet hat. Replikate senden alle 5 Sekunden einen; alles über 15 Sekunden wird als veraltet hervorgehoben.',
      activeRequests: 'HTTP-Anfragen, die das Replikat beim letzten Heartbeat bearbeitet hat.',
      openStreams: 'Server-Sent-Event-Datenströme und WebSocket-Verbindungen, die beim letzten Heartbeat auf dem Replikat offen waren.',
      heldLongPolls: 'Long-Polls von Worker-Leases, die das Replikat beim letzten Heartbeat gehalten hat. Untätige Worker warten dort auf neue Läufe.',
      address: 'IP-Adresse und REST-Port des Replikats, wie es sie gemeldet hat.',
      hostname: 'Hostname der Maschine oder des Pods, auf dem das Replikat läuft.',
      startedUtc: 'Wann der Prozess des Replikats gestartet ist, in Ihrer lokalen Zeitzone.',
      id: 'Knoten-ID des Replikats. Sie entspricht respondingNodeId in API-Antworten und dem Label node in Metriken.',
      isLeader: 'Ob dieses Replikat die Leader-Lease für die Wartung hält. Es führt immer nur ein Replikat.',
      leaderEpoch: 'Fencing-Epoche der Leader-Lease. Sie steigt jedes Mal, wenn die Führung zu einem anderen Replikat wechselt.',
      respondingNodeId: 'Das Replikat, das diesen einzelnen Lesezugriff beantwortet hat. Hinter einem Load Balancer kann es ein anderes sein als das angezeigte.',
      answeredBy: 'Der Steuerungsknoten, der die Anfrage für diese Liste beantwortet hat (respondingNodeId). Hinter einem Load Balancer kann jede Aktualisierung von einem anderen Replikat beantwortet werden.',
      badges: {
        leader: 'Leader: Dieses Replikat hält die Wartungs-Lease. Es bereinigt nach Aufbewahrungsfristen, markiert stille Replikate als Offline und erledigt weitere clusterweite Wartung.',
        leaderEpoch: 'Leader: Dieses Replikat hält die Wartungs-Lease (Epoche {{epoch}}). Es bereinigt nach Aufbewahrungsfristen, markiert stille Replikate als Offline und erledigt weitere clusterweite Wartung.',
        stale: 'Veraltet: seit mehr als {{seconds}} Sekunden kein Heartbeat, obwohl Replikate alle 5 Sekunden einen senden. Das Replikat ist vielleicht überlastet, abgeschnitten oder weg; der Leader markiert es nach 30 Sekunden als Offline.'
      },
      actions: {
        grafana: 'Das Garrison-Übersichtsdashboard in Grafana in einem neuen Tab öffnen, gefiltert auf den Steuerungsknoten {{node}}.'
      }
    },
    audit: {
      createdUtc: 'Wann das Ereignis stattfand, in Ihrer lokalen Zeitzone.',
      eventType: 'Welche Art von Sicherheits- oder Konfigurationsereignis dies war.',
      principalName: 'Wer es ausgelöst hat: ein Benutzer, ein Zugangsschlüssel oder ein Lauf, der für einen Agenten handelt.',
      resource: 'Die Art des Datensatzes und die beteiligte Operation, zum Beispiel Agent / Read.',
      reason: 'Warum das Ereignis eingetreten ist oder warum der Zugriff verweigert wurde.',
      sourceIp: 'Netzwerkadresse, von der die Anfrage kam.',
      principalType: 'Ob der Handelnde ein Benutzer, ein Zugangsschlüssel oder ein Lauf-Token war.',
      principalId: 'Kennung des handelnden Benutzers, Zugangsschlüssels oder Laufs.',
      resourceType: 'Art des beteiligten Datensatzes, etwa Agent oder Secret.',
      resourceId: 'Kennung des beteiligten Datensatzes.',
      operation: 'Versuchte Operation, etwa Read oder Execute.',
      method: 'HTTP-Methode der Anfrage.',
      path: 'Pfad der Anfrage, die das Ereignis ausgelöst hat.',
      authResult: 'Ergebnis der Prüfung, wer der Aufrufer ist.',
      authorizationResult: 'Ergebnis der Prüfung, was der Aufrufer tun darf.',
      bypassReason: 'Warum die Autorisierung übersprungen wurde, zum Beispiel Systemadministration.',
      statusCode: 'An den Aufrufer zurückgegebener HTTP-Status.',
      requestId: 'Anfrage-ID. Suchen Sie damit im Anfrageverlauf oder in den Serverprotokollen.'
    },
    manifestApplies: {
      createdUtc: 'Wann das Manifest angewendet oder im Probelauf getestet wurde.',
      principalName: 'Der Benutzer oder Zugangsschlüssel, der das Manifest angewendet hat.',
      dryRun: 'Ja bedeutet, dass nur geprüft und nichts geschrieben wurde.',
      counts: 'Wie viele Dokumente Datensätze erstellt, aktualisiert, unverändert gelassen haben oder fehlgeschlagen sind.'
    },
    conversations: {
      title: 'Die erste Zeile der ersten Nachricht, die der Konversation ihren Namen gibt. Klicken Sie auf die Zeile, um die Runden zu öffnen.',
      agentName: 'Der Agent, mit dem die Konversation geführt wird. Jede Runde geht an diesen Agenten.',
      state: 'Arbeitet, solange eine Runde offen ist; eine neue Nachricht wird bis zu ihrem Ende abgelehnt. Bereit, wenn die nächste Nachricht gesendet werden kann.',
      turnCount: 'Wie viele Runden (Läufe) die Konversation hatte, einschließlich fehlgeschlagener.',
      affinityNodeName: 'Der Worker-Knoten mit dem Arbeitsbereich und der Harness-Sitzung der Konversation. Die nächste Runde bevorzugt diesen Knoten, um fortsetzen zu können.',
      fallbackCount: 'Wie viele Runden die Harness-Sitzung nicht fortsetzen konnten und eine frische Sitzung mit dem Verlauf der früheren Runden begonnen haben.',
      lastFallbackReason: 'Warum die letzte neu aufgebaute Runde die Sitzung nicht fortsetzen konnte, zum Beispiel weil der Affinitätsknoten nicht bereit war.',
      harnessType: 'Die Harness, die jede Runde ausführt, aus der Bereitstellung der ersten Runde.',
      callerName: 'Wer die Konversation begonnen hat: ein Benutzer, ein Zugriffsschlüssel oder der Lauf eines anderen Agenten.',
      contextId: 'Die A2A-Kontext-ID des Clients, wenn die Konversation über A2A kam. Leer bei Konversationen, die über REST oder MCP begonnen wurden.',
      sessionId: 'Die Harness-Sitzung, die die nächste Runde fortsetzt. Leer, bis eine Runde eine meldet.',
      lastActivityUtc: 'Wann die letzte Runde gesendet wurde oder endete. Für die genaue Zeit auf den Wert zeigen.',
      createdUtc: 'Wann die erste Runde die Konversation begonnen hat. Für die genaue Zeit auf den Wert zeigen.',
      id: 'Kennung der Konversation. Übergeben Sie sie beim Aufruf des Agenten als conversationId, um die nächste Runde zu senden.',
      fallbackLast: 'Runden, die eine frische Sitzung aus dem Verlauf begonnen haben. Letzter Grund: {{reason}}.',
      states: {
        busy: 'Eine Runde dieser Konversation wartet noch oder läuft. Warten Sie, bis sie endet, oder brechen Sie sie ab, bevor Sie die nächste Nachricht senden.',
        idle: 'Keine Runde läuft. Die nächste Nachricht setzt die Konversation fort.'
      },
      actions: {
        continue: 'Aufrufen mit dieser Konversation öffnen, damit die nächste Nachricht als ihre nächste Runde gesendet wird.',
        runs: 'Die Liste Läufe gefiltert auf die Runden dieser Konversation öffnen, mit allen Laufspalten und Filtern.'
      }
    }
  },
  views: {
    approvalDetail: {
      openRun: 'Den nachfragenden Lauf öffnen, um sein Transkript rund um diesen Werkzeugaufruf zu lesen.',
      openAgent: 'Die Agentenseite mit ihren Bereitstellungen und letzten Läufen öffnen.',
      openDeployment: 'Den Tab Bereitstellungen gefiltert auf diese Bereitstellung öffnen, wo ihre Freigaberegeln bearbeitet werden.',
      backToInbox: 'Zurück zu den Freigaben mit allen ausstehenden Freigaben.',
      viewJson: 'Den vollständigen Freigabe-Datensatz als JSON anzeigen, genau so, wie die API ihn liefert.',
      request: 'Was die Harness tun wollte: die einzeilige Zusammenfassung und die vollständige Werkzeugeingabe mit geschwärzten Geheimnissen.',
      rules: 'Die zutreffende Regel der Bereitstellung, die von diesem Aufruf vorgeschlagene Regel und die aus der Entscheidung gemerkte Regel.',
      copyRule: 'Die vorgeschlagene Regel kopieren, etwa um sie in die Freigaberegeln der Bereitstellung einzufügen.'
    },
    home: {
      observabilityState: {
        reachable: 'Der Server hat {{service}} in den letzten 30 Sekunden über die interne URL erreicht.',
        unreachable: 'Der Server konnte {{service}} über die interne URL nicht erreichen. Prüfen Sie, ob der Dienst läuft und die Einstellung für die interne URL auf ihn zeigt.',
        checking: 'Der Server wird gefragt, ob {{service}} erreichbar ist.',
        unknown: 'Der Server hat nicht gemeldet, ob {{service}} erreichbar ist. Die Statusprüfung ist fehlgeschlagen oder dieser Server unterstützt sie noch nicht.'
      },
      observabilityVersion: 'Version, die {{service}} bei der Integritätsprüfung des Servers gemeldet hat.',
      kpisGrafana: 'Das Garrison-Übersichts-Dashboard in Grafana in einem neuen Tab öffnen, um diese Zahlen im Zeitverlauf zu sehen.',
      grafanaDashboards: 'Der Garrison-Ordner in Grafana enthält ein Dashboard pro Bereich. Jeder Link öffnet das Dashboard in einem neuen Tab.',
      grafanaSections: {
        overview: 'Zustand auf einen Blick: aktive Replikate und Worker, Lauf- und Anfrageraten, Fehler, Kosten und aktuelle Probleme.',
        http: 'REST-Verkehr nach Route: Anfragerate, Latenz-Perzentile, Fehler, Nutzlastgrößen, Authentifizierungsfehler und laufende Anfragen.',
        runs: 'Lebenszyklus der Läufe: erstellte und beendete Läufe nach Ergebnis, Phasendauern, Abbrüche, Validierung strukturierter Ausgaben und Reparaturen.',
        agents: 'Leistung pro Agent: Aufrufe, Perzentile von Laufzeit und Wartezeit, Zeit bis zum ersten Token, Streaming-Zeit, Ergebnisse und Schutzauslösungen.',
        models: 'Tokenverbrauch und Kosten nach Modell und Agent: Eingabe-, Ausgabe-, Cache- und Reasoning-Tokens, Kosten und Ausgabedurchsatz.',
        workers: 'Worker-Knoten: Leases, Läufe pro Knoten, Abschlussmeldungen, Heartbeats, freie Slots und Aufrufe an die Steuerungsebene.',
        kubernetes: 'Executor mit einem Pod pro Lauf: erstellte und gelöschte Jobs, Pod-Startlatenz, Pod-Fehler nach Ursache und Bereinigung verwaister Jobs.',
        protocols: 'MCP, A2A und Streaming: Tool-Aufrufe und Dauern, Sitzungen, A2A-Methoden und Aufgabenzustände, SSE-Streams, WebSockets und Delegation.',
        scheduler: 'Planung: Warteschlangentiefe nach Agent und Harness, Claim-Ergebnisse und Latenz, Lease-Long-Polls, blockierte Läufe und abgelaufene Leases.',
        database: 'Datenbank: Anweisungslatenz nach Operation und Tabelle, Fehler, genutzte Verbindungen, Wartezeiten auf Schreibsperren und Aufbewahrung.',
        controlPlane: 'Replikate der Steuerungsebene: Status, Leader-Wechsel, Backplane-Verkehr und Verzögerung, Heartbeats und Durchläufe der Hintergrunddienste.',
        security: 'Authentifizierungsfehler nach Schema und Grund, Autorisierungsablehnungen, Ratenbegrenzung, ausgestellte Tokens, Entschlüsselung von Geheimnissen und Codex-Token-Aktualisierungen.',
        integrations: 'Ausgehende Aufrufe nach Dienst: MCP-Servertests, Observability-Prüfungen, der MCP-Proxy, die Kubernetes-API und die Steuerungsebene aus Sicht der Worker.',
        logs: 'Logvolumen, Fehler und Warnungen nach Komponente und Mandant, aktuelle Fehlerzeilen und Links zu Traces.'
      },
      observabilityDocs: 'Die Telemetrie-Anleitung in einem neuen Tab öffnen: wie Sie Garrison-Metriken abrufen und Grafana, Prometheus, Tempo oder Loki anbinden.',
      observability: 'Links zu den Metrik-, Dashboard- und Tracing-Werkzeugen, die diese Installation als konfiguriert meldet. Nicht konfigurierte Dienste werden nicht angezeigt.',
      kpis: {
        agents: 'In diesem Mandanten definierte Agenten. Klicken Sie, um die Liste der Agenten zu öffnen.',
        deployments: 'Bereitstellungen über alle Agenten. Jede ist eine Art, wie ein Agent laufen kann. Klicken Sie, um sie zu öffnen.',
        activeRuns: 'Läufe, die gerade einem Worker zugewiesen sind oder darauf laufen. Klicken Sie, um sie zu sehen.',
        queued: 'Läufe, die auf einen Worker-Knoten warten. Eine stetig wachsende Zahl bedeutet, dass Sie mehr Knoten oder Kapazität benötigen.',
        succeeded: 'Läufe, die in den letzten 24 Stunden erfolgreich beendet wurden. Klicken Sie, um sie aufzulisten.',
        failed: 'Läufe, die in den letzten 24 Stunden fehlgeschlagen sind. Klicken Sie, um sie aufzulisten und die Gründe zu lesen.',
        nodes: 'Worker-Knoten, die bereit sind, Läufe anzunehmen, im Verhältnis zu allen registrierten Knoten. Klicken Sie, um sie zu verwalten.',
        controlNodes: 'Replikate der Steuerungsebene im Status Bereit, im Verhältnis zu allen registrierten (Offline-Zeilen bleiben 24 Stunden in der Liste). Der Leader ist {{leader}}. Klicken Sie, um Flotte > Steuerungsebene zu öffnen.',
        controlNodesNoLeader: 'Replikate der Steuerungsebene im Status Bereit, im Verhältnis zu allen registrierten (Offline-Zeilen bleiben 24 Stunden in der Liste). Gerade hält kein Replikat die Leader-Lease, daher ruht die Cluster-Wartung. Klicken Sie, um Flotte > Steuerungsebene zu öffnen.'
      },
      openFailure: 'Diesen fehlgeschlagenen Lauf öffnen, um Protokoll, Fehler und Stderr zu lesen.',
      openControlPlane: 'Flotte > Steuerungsebene öffnen, um jedes Replikat mit Status, Leader, Version, Heartbeat und Aktivität zu sehen.',
      openWorkers: 'Flotte > Worker-Knoten öffnen, um jeden Worker mit Kapazität, Harnesses und Heartbeat zu sehen und ihn zu sperren oder zu leeren.',
      cta: {
        invoke: 'Einem beliebigen Agenten aus dem Browser eine Nachricht senden.',
        addAgent: 'Zu den Agenten wechseln, um eine neue Agentenidentität zu erstellen.',
        applyManifest: 'Konfiguration als YAML anwenden, zum Beispiel einen Beispielagenten.',
        inspectRuns: 'Alle Läufe mit Filtern und Telemetrie durchsuchen.',
        nodes: 'Sehen, welche Worker-Knoten bereit sind und was sie ausführen können.',
        apiExplorer: 'Einen beliebigen API-Aufruf live gegen diesen Server ausprobieren.',
        analytics: 'Geschwindigkeit, Token, Kosten und Ergebnisse von Läufen im Zeitverlauf ansehen.'
      },
      services: {
        loki: 'Loki in einem neuen Tab öffnen, um Garrison-Protokolle zu durchsuchen.',
        grafana: 'Grafana-Dashboards für Garrison-Metriken in einem neuen Tab öffnen.',
        prometheus: 'Den Prometheus-Server, der Garrison-Metriken abfragt, in einem neuen Tab öffnen.',
        tempo: 'Tempo in einem neuen Tab öffnen, um Traces zu durchsuchen.'
      },
      serviceGeneric: 'Diesen mitgelieferten Dienst in einem neuen Tab öffnen.'
    },
    runDetail: {
      openApproval: 'Diese Freigabe mit vollständiger Werkzeugeingabe, Regel und Entscheidung öffnen.',
      reviewApprovals: 'Die Freigaben dieses Laufs anzeigen, wo Sie die ausstehenden Werkzeugaufrufe erlauben oder verweigern können.',
      approvalActions: 'Einen ausstehenden Werkzeugaufruf erlauben oder verweigern, oder die Freigabe mit allen Feldern öffnen.',
      viewTrace: 'Den Trace dieses Laufs in Grafana Explore (Tempo) in einem neuen Tab öffnen. Er zeigt die Spans für Kompilieren, Übernehmen und Harness auf Server und Worker-Knoten.',
      viewLogs: 'Die Server- und Worker-Logzeilen zu diesem Lauf in Grafana Explore (Loki) in einem neuen Tab öffnen, begrenzt auf den Zeitraum des Laufs.',
      traceId: 'W3C-Trace-ID des Traces, in dem dieser Lauf kompiliert wurde. Suchen Sie sie in Tempo oder nutzen Sie „Trace anzeigen“. Leer bei Läufen, die vor der Erfassung von Trace-IDs erstellt wurden.',
      eventCode: 'Welche Art Meldung Garrison hier geschrieben hat, in Ihrer Sprache. Der Text daneben ist die Originalmeldung von Server oder Worker.',
      openTemplate: 'Vorlage {{name}} öffnen. Dieser Lauf verwendete Version {{version}}; der Tab Versionen zeigt diesen Inhalt und den Unterschied zur aktuellen Version.',
      templatesUsed: 'Die genauen Versionen der Prompt-Vorlagen, mit denen dieser Lauf kompiliert wurde. Klicken Sie eine an, um die Vorlage zu öffnen und Versionen zu vergleichen.',
      live: 'Ereignisse werden live vom Server gestreamt, sobald die Harness sie erzeugt.',
      viewJson: 'Den vollständigen Laufdatensatz als JSON anzeigen, einschließlich aller Telemetriefelder.',
      deployment: 'Die Bereitstellung, die für diesen Lauf gewählt wurde, per Name oder nach Verkehrsgewichtung.',
      model: 'Das Modell, das die Harness nach eigener Meldung tatsächlich verwendet hat. Es kann vom angeforderten Modell der Bereitstellung abweichen.',
      tokens: 'Eingabe- und Ausgabe-Token für den gesamten Lauf. Das Telemetrie-Panel unten enthält die vollständige Aufschlüsselung.',
      caller: 'Wer den Lauf gestartet hat: ein Benutzer, ein Zugangsschlüssel oder der Lauf eines anderen Agenten.',
      parent: 'Der Lauf, der an diesen delegiert hat, wenn ein Agent einen anderen Agenten aufgerufen hat.',
      openParent: 'Den übergeordneten Lauf öffnen, der diese Arbeit delegiert hat.',
      attempt: 'Der wievielte Versuch dies ist, gemessen an der Höchstzahl, die die Bereitstellung erlaubt.',
      outputSchema: 'Ob die endgültige Ausgabe dem JSON-Schema der Ausgabe des Agenten entsprach. Wenn nicht und die Harness ihre Sitzung fortsetzen kann, sendet Garrison einen Reparatur-Prompt in derselben Sitzung. Die Warnereignisse im Verlauf listen die Validierungsfehler auf.',
      created: 'Wann der Lauf angefordert wurde.',
      started: 'Wann der Harness-Prozess auf dem Worker gestartet wurde.',
      completed: 'Wann der Lauf seinen Endzustand erreicht hat.',
      exitCode: 'Exit-Code des Harness-Prozesses. Über Erfolg wird meist anhand des letzten Ereignisses entschieden, nicht anhand dieses Codes.',
      tabs: {
        approvals: 'Werkzeugaufrufe, für die dieser Lauf um Berechtigung gebeten hat, wie jeder entschieden wurde, sowie Erlauben und Verweigern für ausstehende.',
        transcript: 'Jedes Ereignis, das die Harness erzeugt hat: Assistententext, Überlegungen, Werkzeugaufrufe und -ergebnisse sowie Verbrauch.',
        result: 'Die endgültige Antwort und gegebenenfalls strukturierte Ausgabe.',
        input: 'Was der Aufrufer gesendet hat, die Parameter und die genauen verwendeten Versionen der Prompt-Vorlagen.',
        stderr: 'Der letzte Teil der Standardfehlerausgabe der Harness, mit entfernten Geheimnissen. Schauen Sie hier nach, wenn ein Lauf fehlschlägt.',
        children: 'Läufe, die dieser Lauf durch Aufrufe anderer Agenten gestartet hat.'
      },
      eventFilter: 'Nur eine Art von Ereignis anzeigen, etwa Werkzeugaufrufe oder Fehler.',
      openChild: 'Diesen Unterlauf öffnen, der gestartet wurde, als dieser Lauf einen anderen Agenten aufgerufen hat.',
      eventCodes: {
        ApprovalRequested: 'Die Harness hat vor einem Werkzeugaufruf nachgefragt, und der Aufruf wartet auf eine Person. Entscheiden Sie ihn im Tab Freigaben.',
        ApprovalDecided: 'Eine Berechtigungsanfrage wurde durch eine Regel, den Standard der Bereitstellung, eine Person oder eine Zeitüberschreitung entschieden. Der Text nennt die Quelle.',
        RunGuardTriggered: 'Ein Laufwächter hat diesen Lauf gestoppt. Die Meldung sagt, welcher Wächter ausgelöst hat und was er gesehen hat; der Lauf endet als Fehlgeschlagen mit dem Ergebnis dieses Wächters und behält seine Teilausgabe.',
        ConversationFallback: 'Diese Runde konnte die Harness-Sitzung der Konversation nicht fortsetzen und hat eine frische Sitzung mit dem Verlauf der früheren Runden begonnen. Die Meldung nennt den Grund.',
        ConversationStateLost: 'Der Knoten hat diese Runde übernommen, aber die Verzeichnisse der Konversation fehlten, daher kam die Runde zurück in die Warteschlange, um neu aufgebaut zu laufen.'
      },
      conversation: 'Die Konversation, zu der dieser Lauf als Runde gehört, und die Rundennummer. Klicken, um die Konversation zu öffnen.',
      openConversation: 'Die Konversation mit allen Runden und einem Feld für die nächste öffnen.',
      conversationSession: 'Ob diese Runde die Harness-Sitzung der Konversation fortgesetzt oder eine frische aus dem Verlauf begonnen hat, und warum.',
      resumeSessionId: 'Die Harness-Sitzung, die diese Runde fortgesetzt hat, hinterlassen von der vorherigen Runde.',
      affinityNode: 'Der Knoten mit den Verzeichnissen der Konversation. Andere Knoten lassen die Runde bis zur angezeigten Zeit liegen, außer dieser Knoten ist nicht mehr bereit.'
    },
    agentDetail: {
      name: 'Der Name, mit dem Aufrufende diesen Agenten aufrufen.',
      viewJson: 'Den vollständigen Agentendatensatz als JSON anzeigen.',
      invoke: 'Aufrufen mit diesem ausgewählten Agenten öffnen. Eine Bereitstellung wird nach Gewichtung gewählt, sofern Sie keine auswählen.',
      grafana: 'Das Agenten-Dashboard in Grafana in einem neuen Tab öffnen, gefiltert auf diesen Agenten: Aufrufe, Laufzeit-Perzentile, Zeit bis zum ersten Token, Streaming-Zeit, Tokens, Kosten und Schutzauslösungen.',
      id: 'Kennung des Agenten für API-Aufrufe.',
      tabs: {
        deployments: 'Die Arten, wie dieser Agent läuft, mit ihren Gewichtungen und dem Verkehrsanteil, den jede erhält.',
        runs: 'Die neuesten Läufe dieses Agenten.',
        card: 'Die A2A-Agentenkarte, die andere Agenten lesen, um diesen Agenten zu finden.'
      },
      addDeployment: 'Zu den Bereitstellungen wechseln, um eine für diesen Agenten zu erstellen. Ohne Bereitstellung kann er nicht laufen.',
      manageDeployments: 'Die Registerkarte Bereitstellungen öffnen, um Gewichtungen, Modelle und Bindungen zu bearbeiten.',
      openRun: 'Protokoll und Telemetrie dieses Laufs öffnen.',
      columns: {
        name: 'Name der Bereitstellung. Aufrufende können sie explizit benennen, um die gewichtete Auswahl zu umgehen.',
        harness: 'Das Harness-Profil, das die CLI für diese Bereitstellung startet.',
        model: 'Das Modell, das diese Bereitstellung von der Harness anfordert.',
        weight: 'Die in der Bereitstellung gesetzte Verkehrsgewichtung.',
        traffic: 'Anteil der Aufrufe, den diese Bereitstellung erhält: ihre Gewichtung geteilt durch die Summe der aktiven Gewichtungen.',
        active: 'Nur aktive Bereitstellungen erhalten gewichteten Verkehr.'
      },
      conversations: 'Die Liste Konversationen gefiltert auf diesen Agenten öffnen.'
    },
    queue: {
      queued: 'Läufe, die auf einen Knoten warten. Klicken Sie, um sie aufzulisten.',
      leased: 'Läufe, die ein Knoten übernommen, aber noch nicht gestartet hat. Klicken Sie, um sie aufzulisten.',
      running: 'Gerade ausgeführte Läufe. Klicken Sie, um sie aufzulisten.',
      agent: 'Der Agent, zu dem die wartende Arbeit gehört.',
      harness: 'Die Harness, die diese Läufe benötigen. Nur Knoten, die sie melden, können sie übernehmen.'
    },
    invoke: {
      stream: {
        tabs: {
          preview: 'Verfolgen Sie die Antwort während des Streamings, als Markdown formatiert, mit Gedankengang und Toolaufrufen. Ausgewählt, solange ein Lauf aktiv ist.',
          response: 'Das Endergebnis des Laufs: Ergebnistext (formatiert oder roh), strukturierte Ausgabe, Ergebnis, Fehler, Telemetrie und Links.'
        },
        live: 'Der Lauf ist aktiv. Diese Ansicht aktualisiert sich, sobald Ausgabe über den Live-Ereignisstream eintrifft.',
        finished: 'Der Lauf ist beendet, es kommt keine weitere Ausgabe. Das Endergebnis steht im Tab Antwort.',
        elapsed: 'Zeit seit dem Klick auf Senden, gemessen in Ihrem Browser. Sie stoppt, wenn der Lauf endet.',
        firstToken: 'Zeit von Senden bis zur ersten gestreamten Ausgabe (Text oder Gedankengang), gemessen im Browser, also einschließlich Warteschlange und Harness-Start. Die Laufseite zeigt den vom Worker gemessenen Wert.',
        tokensPerSecond: 'Ausgabetokens pro Sekunde während des Streamings, aus der vom Harness gemeldeten Nutzung. Nach dem Lauf wird die vom Server gemessene Rate gezeigt.',
        codexNote: 'Codex gibt jede Nachricht erst aus, wenn sie vollständig ist (codex exec --json), daher wird nichts Token für Token gestreamt. Die verstrichene Zeit läuft weiter, während Codex arbeitet.',
        showResponse: 'Wechselt zum Tab Antwort mit Endergebnis, strukturierter Ausgabe und Telemetrie.',
        reasoning: 'Denktext, den das Modell vor oder zwischen Antworten erzeugt hat. Standardmäßig eingeklappt; klicken Sie zum Aufklappen.',
        jump: 'Springt zur neuesten Ausgabe und folgt dem Stream wieder, während er eintrifft.',
        tool: {
          running: 'Der Agent hat das Tool {{name}} aufgerufen und wartet auf dessen Ergebnis.',
          ok: 'Das Tool {{name}} hat ein Ergebnis ohne Fehler geliefert.',
          failed: 'Das Tool {{name}} hat einen Fehler gemeldet. Der Agent kann es erneut versuchen oder ohne es weitermachen.'
        }
      },
      applySample: 'Zu den Manifesten wechseln, wo das Beispielmanifest einen Agenten erstellt, den Sie sofort ausprobieren können.',
      agent: 'Der aufzurufende Agent. Nur aktive Agenten werden aufgeführt.',
      deployment: 'Auf Beliebig lassen, damit Garrison nach Verkehrsgewichtung wählt, oder eine Bereitstellung wählen, um sie direkt zu testen.',
      parameter: 'Wert pro Lauf für {{name}}. Die Bereitstellung erlaubt Aufrufenden, ihn zu überschreiben; leer lassen für den Standard.',
      message: 'Was der Agent tun soll. Die Nachricht wird als Eingabe des Laufs gesendet und von der Aufgabenvorlage eingerahmt.',
      send: 'Einen Lauf mit dieser Nachricht starten und sein Protokoll hier streamen.',
      openRun: 'Die vollständige Laufseite mit Ergebnis, Telemetrie und Stderr öffnen.',
      stopOnLeave: 'Wenn aktiviert, bricht Garrison den laufenden Lauf ab, sobald du diese Seite verlässt, den Tab schließt oder eine neue Nachricht sendest, damit niemand für ungelesene Ausgabe zahlt. Deaktiviere es, um Läufe weiterlaufen zu lassen; sie bleiben auf der Seite Läufe. Wird in diesem Browser gespeichert.',
      cancel: 'Diesen Lauf jetzt stoppen. Der Worker beendet den Harness-Prozess innerhalb weniger Sekunden, die bisherige Ausgabe bleibt erhalten.',
      cancelling: 'Abbruch angefordert. Der Worker stoppt den Harness; die Anzeige wechselt zum Endstatus, sobald der Lauf „Abgebrochen“ meldet.',
      sendReplaces: 'Den laufenden Lauf abbrechen und dann einen neuen Lauf mit dieser Nachricht starten. Deaktiviere „Lauf beim Verlassen stoppen“, um den aktuellen Lauf weiterlaufen zu lassen.',
      sendKeeps: 'Einen neuen Lauf mit dieser Nachricht starten. Der laufende Lauf geht weiter, weil „Lauf beim Verlassen stoppen“ deaktiviert ist; du findest ihn auf der Seite Läufe.',
      timeLimit: 'Optionale Frist für diesen Lauf in Sekunden, die diese Bereitstellung Aufrufern erlaubt. Leer lassen für den Standard der Bereitstellung. Der Lauf endet wegen Zeitüberschreitung, wenn er das Limit überschreitet.',
      timePreset: 'Das Zeitlimit für diesen Lauf auf {{value}} setzen.',
      timePresetClear: 'Das Zeitlimit entfernen, damit der Lauf den Standard der Bereitstellung verwendet.',
      conversation: {
        mode: 'Einmal ausführen, eine neue Konversation beginnen, deren spätere Runden diese Harness-Sitzung fortsetzen, oder die nächste Runde einer bestehenden Konversation senden.',
        pick: 'Die fortzusetzende Konversation. Nur Konversationen dieses Agenten sind aufgeführt, die neuesten zuerst.',
        deploymentPinned: 'Eine Konversation bleibt auf der Bereitstellung ihrer ersten Runde, daher ist die Bereitstellung beim Fortsetzen festgelegt.',
        open: 'Die Konversation dieses Laufs öffnen, mit allen Runden und einem Feld für die nächste.'
      }
    },
    manifests: {
      warnings: 'Werte in diesem Dokument, die angenommen, aber anders gespeichert wurden, zum Beispiel eine Zahl außerhalb ihres Bereichs, die begrenzt wurde. Die Liste unter der Zeile nennt jedes Feld.',
      planned: 'Was das Anwenden dieses Dokuments bewirken würde: den Datensatz erstellen, aktualisieren oder unverändert lassen. Eine Simulation prüft nur und ändert nichts.',
      changes: { after: 'Der Wert, den das Manifest setzt. Lange Werte werden nach 200 Zeichen abgeschnitten.', before: 'Der aktuell gespeicherte Wert. Lange Werte werden nach 200 Zeichen abgeschnitten.', field: 'Die Einstellung dieses Datensatzes, die das Manifest ändert, zum Beispiel model oder parameters.model.' },
      results: 'Was die Anwendung mit jedem Dokument im Manifest getan hat.',
      kind: 'Die Art des Datensatzes, den das Dokument beschreibt, etwa Agent oder Deployment.',
      name: 'Der Name des Datensatzes aus den Metadaten des Dokuments.',
      result: 'Ob das Dokument einen Datensatz erstellt, aktualisiert oder unverändert gelassen hat oder fehlgeschlagen ist.',
      message: 'Details vom Server, etwa ein Prüfungsfehler.',
      tabs: {
        apply: 'Ein Manifest einfügen oder hochladen, mit einem Probelauf prüfen und anwenden.',
        export: 'Die Konfiguration dieses Mandanten als Manifest herunterladen. Geheime Werte sind nie enthalten.',
        history: 'Jede frühere Anwendung und jeder Probelauf mit Ergebnissen pro Dokument.'
      },
      upload: 'Eine YAML- oder JSON-Manifestdatei von Ihrem Computer in den Editor laden.',
      loadSample: 'Den Editorinhalt durch das Beispielmanifest ersetzen: einen Echo-Agenten mit der Test-Harness.',
      document: 'Ein oder mehrere YAML- oder JSON-Dokumente, getrennt durch ---. Datensätze verweisen über ihre Namen aufeinander.',
      dryRun: 'Jedes Dokument prüfen und zeigen, was sich ändern würde, ohne etwas zu schreiben.',
      apply: 'Jedes Dokument prüfen und schreiben. Schlägt ein Dokument fehl, wird nichts geschrieben.',
      export: 'Ein Manifest erzeugen, das die Konfiguration dieses Mandanten nachbildet.',
      download: 'Das exportierte Manifest als YAML-Datei speichern.',
      confirmApply: 'Das Manifest jetzt in diesen Mandanten schreiben.'
    },
    templateEditor: {
      cloneName: 'Name der Kopie. Kleinbuchstaben, Ziffern, Bindestriche und Schrägstriche eignen sich gut; das Präfix builtin/ ist reserviert.',
      cloneConfirm: 'Die Kopie mit diesem Namen erstellen und im Editor öffnen.',
      clone: 'Eine bearbeitbare Kopie dieser Vorlage anlegen. Sie wählen den Namen der Kopie, bevor sie erstellt wird.',
      reset: 'Diese integrierte Vorlage auf den Inhalt zurücksetzen, mit dem Garrison ausgeliefert wird.',
      delete: 'Diese Vorlage mit allen Versionen löschen. Der Server lehnt ab, solange eine Bereitstellung sie bindet; die Bestätigung listet diese auf.',
      create: 'Die Vorlage und ihre erste Version erstellen.',
      save: 'Den Inhalt als neue Version speichern. Bereitstellungen, die der neuesten Version folgen, übernehmen sie für neue Läufe.',
      content: 'Der Vorlagentext. Verwenden Sie {{variables}}, Bedingungen, Schleifen und Einbindungen; die Vorschau aktualisiert sich beim Tippen.',
      changeNote: 'Eine kurze Notiz, die mit der Version gespeichert wird und erklärt, was sich geändert hat und warum.',
      tabs: {
        preview: 'Die Vorlage mit dem Beispielkontext rendern, um genau zu sehen, was eine Harness erhalten würde.',
        versions: 'Jede gespeicherte Version, mit Vergleich und Wiederherstellung.'
      },
      sampleContext: 'JSON als Ersatz für die Daten eines echten Laufs. Bearbeiten Sie es, um zu sehen, wie die Vorlage reagiert.',
      columns: {
        version: 'Versionsnummer. Höher ist neuer.',
        note: 'Die mit der Version gespeicherte Änderungsnotiz.',
        author: 'Wer diese Version der Vorlage gespeichert hat.',
        saved: 'Wann die Version gespeichert wurde.'
      },
      diff: 'Diese Version mit dem aktuellen Inhalt des Editors vergleichen.',
      restore: 'Diese Version wieder zur aktuellen machen. Der aktuelle Inhalt bleibt im Verlauf erhalten.'
    },
    serverInfo: {
      serverInUse: 'Die Adresse, an die diese Konsole API-Aufrufe sendet. Das ist GARRISON_API_URL, wenn gesetzt, sonst der Ursprung des Dashboards.',
      rest: 'Basisadresse für REST-API-Aufrufe und SDKs.',
      mcp: 'Adresse, mit der sich MCP-Clients verbinden. Jeder als Werkzeug bereitgestellte Agent erscheint dort.',
      a2a: 'Basisadresse des A2A-Gateways für diesen Mandanten. Jeder Agent hat darunter seine eigene Karte.',
      openapi: 'Das OpenAPI-Dokument, das jede REST-Operation beschreibt.',
      version: 'Version des Garrison-Servers.',
      dashboardVersion: 'Version dieser Konsole.',
      node: 'Das Replikat der Steuerungsebene (Steuerungsknoten), das die Serverinfo-Anfrage dieser Seite beantwortet hat. Bei mehreren Replikaten kann nach dem Neuladen ein anderes antworten.',
      nodeLink: 'Flotte > Steuerungsebene öffnen, um dieses Replikat neben den anderen zu sehen, mit Status, Heartbeat und ob es der Leader ist.',
      database: 'Datenbank-Engine, die der Server verwendet.',
      health: 'Ergebnis der Zustandsprüfung des Servers.',
      replicas: 'Wie viele Replikate der Steuerungsebene der Cluster erwartet.',
      routes: 'Wie viele API-Operationen der Server registriert hat.',
      serverTime: 'Die Serveruhr. Große Abweichungen von Ihrer Uhr können signierte Anfragen scheitern lassen.',
      principalName: 'Die Identität, mit der Sie angemeldet sind.',
      principalType: 'Ob Sie sich als Benutzer oder mit einem Zugangsschlüssel angemeldet haben.',
      role: 'Ihre höchste Zugriffsstufe.',
      tenant: 'Der Mandant, zu dem Ihre Sitzung gehört.',
      expires: 'Wann Ihre Sitzung endet und Sie sich erneut anmelden müssen.',
      rawJson: 'Die rohe Antwort der Serverinfo anzeigen.'
    },
    requests: {
      grafana: 'Das HTTP-Dashboard in Grafana in einem neuen Tab öffnen: Anfrageraten, Latenz und Fehler im Zeitverlauf aus den Prometheus-Metriken.',
      kpis: {
        total: 'Anfragen, die der Server für den gewählten Zeitraum und die Filter in seinem Verlauf aufbewahrt hat.',
        success: 'Anfragen, die einen 2xx- oder 3xx-Status zurückgegeben haben.',
        failure: 'Anfragen, die einen 4xx- oder 5xx-Status zurückgegeben haben.',
        avgDuration: 'Durchschnittliche Antwortzeit des Servers.'
      },
      columns: {
        time: 'Wann die Anfrage eingetroffen ist.',
        method: 'HTTP-Methode der Anfrage.',
        path: 'Aufgerufener Pfad. Fahren Sie mit der Maus über einen Wert, um ihn vollständig zu sehen.',
        status: 'Vom Server zurückgegebener HTTP-Status.',
        duration: 'Wie lange der Server für die Antwort gebraucht hat.',
        principal: 'Wer die Anfrage gestellt hat: ein Benutzer, ein Zugangsschlüssel oder ein Lauf-Token.'
      },
      viewDetails: 'Die Anfrage mit Headern, Inhalten und Zeiten öffnen.',
      viewJson: 'Den Anfragedatensatz einschließlich seines rohen JSON öffnen.',
      deleteOne: 'Diese Anfrage aus dem Verlauf entfernen.',
      bulkDeleteAll: 'Alle Anfragen löschen, die den aktuellen Filtern entsprechen, nicht nur diese Seite.'
    },
    explorer: {
      operations: 'Eine API-Operation auswählen, gruppiert nach Bereich. Das Formular darunter passt sich ihren Parametern an.',
      pathParam: 'Pfadparameter {{name}} ({{type}}). Er wird in die URL eingesetzt. {{description}}',
      queryParam: 'Abfrageparameter {{name}} ({{type}}). Er wird an die URL angehängt, wenn er ausgefüllt ist. {{description}}',
      copyUrl: 'Die vollständig aufgelöste Anfrage-URL kopieren.',
      headerName: 'Name eines Anfrage-Headers. Authorization wird automatisch aus Ihrer Sitzung ergänzt.',
      headerValue: 'Für diesen Header gesendeter Wert.',
      removeHeader: 'Diesen Header aus der Anfrage entfernen.',
      addHeader: 'Einen weiteren Anfrage-Header hinzufügen.',
      body: 'JSON-Anfragetext für Operationen, die Datensätze erstellen oder ändern.',
      execute: 'Die Anfrage jetzt mit Ihrer Sitzung an den Server senden. Destruktive Methoden fragen nach einer Bestätigung.',
      stop: 'Die Anfrage abbrechen oder das Lesen einer Streaming-Antwort beenden.',
      snippets: {
        curl: 'Dieselbe Anfrage als curl-Befehl für ein Terminal.',
        fetch: 'Dieselbe Anfrage als JavaScript-fetch-Code.',
        csharp: 'Dieselbe Anfrage als C#-HttpClient-Code.'
      },
      clearHistory: 'Alle in diesem Browser gespeicherten letzten Anfragen vergessen.',
      loadHistory: 'Diese Anfrage zurück in das Formular laden.',
      deleteHistory: 'Diesen Eintrag aus der Liste der letzten Anfragen entfernen.',
      confirmExecute: 'Diese Anfrage senden, obwohl sie Daten ändern oder löschen kann.'
    },
    settings: {
      settingPath: 'Einstellungspfad: {{path}}. Verwenden Sie diesen Namen in der Einstellungsdatei und in der REST API für Einstellungen.',
      viewJson: 'Die rohe Antwort der Einstellungen anzeigen.',
      restart: 'Dieses Replikat der Steuerungsebene neu starten, damit Einstellungen wirksam werden, die einen Neustart erfordern.',
      save: 'Alle geänderten Einstellungen speichern. Sofort wirksame Einstellungen gelten unmittelbar; andere warten auf einen Neustart.',
      groupGeneric: 'Einstellungen in der Gruppe {{group}}.',
      fieldGeneric: 'Servereinstellung {{path}}.',
      applyLive: 'Wird beim Speichern sofort wirksam.',
      applyRestart: 'Wird nach einem Neustart des Servers wirksam.',
      source: {
        File: 'Derzeit in der Einstellungsdatei gesetzt. Speichern hier aktualisiert sie.',
        Environment: 'Durch eine Umgebungsvariable gesetzt, die Vorrang vor jedem hier gespeicherten Wert hat.',
        ConfigMap: 'Von einer Kubernetes-ConfigMap verwaltet. Ändern Sie den Wert stattdessen in Ihren Manifesten.',
        Database: 'Als Clustereinstellung in der Datenbank gespeichert, gemeinsam genutzt von allen Replikaten.'
      },
      sourceGeneric: 'Woher der aktuelle Wert stammt.',
      testDatabase: 'Vor dem Speichern versuchen, mit den obigen Datenbankeinstellungen eine Verbindung herzustellen.',
      groups: {
        Observability: 'Wo Grafana, Prometheus, Loki und Tempo erreichbar sind. Browser-URLs speisen die Karten auf der Startseite und die Grafana-Links; interne URLs prüft der Server auf Erreichbarkeit. Leer bedeutet nicht konfiguriert.',
        Runtime: 'Wie die Steuerungsebene Läufe begrenzt: die längste Laufzeit, die Laufwächter-Standards für Bereitstellungen und wie lange ein wartender Lauf auf einen passenden Worker warten darf.',
        Rest: 'Wie die REST-API lauscht: Host, Port, TLS und öffentliche Adresse.',
        Mcp: 'Wie der MCP-Server lauscht und wie lange Werkzeugaufrufe warten dürfen.',
        Database: 'Welche Datenbank Garrison verwendet und wie die Verbindung hergestellt wird.',
        Logging: 'Wohin Protokolle geschrieben werden und wie ausführlich sie sind.',
        Auth: 'Token-Signierung, Gültigkeitsdauern und Ratenbegrenzung für Anmeldungen.',
        Security: 'Hauptschlüssel für die Verschlüsselung und Bootstrap-Konten.',
        RequestHistory: 'Ob API-Anfragen erfasst werden und wie viel von jedem Inhalt aufbewahrt wird.',
        Telemetry: 'Export von Metriken und Tracing.',
        Archive: 'Wohin Läufe und Ereignisse archiviert werden, bevor die Aufbewahrung sie löscht.',
        Cluster: 'Wie viele Replikate der Steuerungsebene erwartet werden.',
        Scheduling: 'Lease-Dauern und Heartbeat-Zeitlimits für Worker-Knoten.',
        Runs: 'Standardwerte für Läufe und wie lange Läufe und Ereignisse aufbewahrt werden.',
        Audit: 'Wie lange Auditeinträge aufbewahrt werden.'
      },
      fields: {
        Runtime: {
          MaxRunSeconds: 'Die längste Dauer eines Laufs in Sekunden. Zeitlimits der Bereitstellungen, Zeitlimits pro Lauf und Profilstandards darüber werden darauf gesenkt.',
          RepetitionGuard: 'Ob Bereitstellungen ohne eigenen Wiederholungswächter Läufe stoppen, deren Antwort in Wiederholung abgleitet (Ergebnis „Wiederholung erkannt“).',
          MaxAssistantChars: 'Zeichen Assistententext, nach denen ein Lauf stoppt (Ergebnis „Ausgabelimit überschritten“), für Bereitstellungen ohne eigenes Limit. 0 ist unbegrenzt.',
          NoProgressSeconds: 'Sekunden ohne Text, Denken oder Toolaktivität, nach denen ein Lauf stoppt (Ergebnis „Kein Fortschritt“), für Bereitstellungen ohne eigenes Limit. 0 schaltet es aus.',
          ConversationAffinityWaitMs: 'Wie lange eine Konversationsrunde auf den Knoten mit ihrer Harness-Sitzung wartet, bevor ein anderer Knoten sie übernimmt und eine frische Sitzung aus dem Verlauf beginnt. Ist dieser Knoten nicht bereit, übernehmen andere sofort. 0 wartet nie.',
          ConversationTranscriptTurns: 'Höchstzahl früherer Runden, die eine neu aufgebaute Konversationsrunde als Verlauf erhält. Die neuesten Runden bleiben erhalten.',
          ConversationTranscriptChars: 'Höchstzahl der Zeichen jeder früheren Nachricht und Antwort im Verlauf einer neu aufgebauten Runde. Längere werden gekürzt und als gekürzt markiert.'
        },
        Scheduling: {
          PauseGraceMs: 'Nach einem Ruhezustand des Hosts oder einer VM-Pause wartet der Leader ein Heartbeat-Fenster plus so viele Millisekunden, bevor er Knoten als Verloren markiert oder ihre Läufe fehlschlagen lässt. Standard 5000.'
        }
      }
    },
    runGuard: {
      openDeployments: 'Zu den Bereitstellungen wechseln, um die Laufwächter einer Bereitstellung zu ändern: Wiederholungswächter, Maximale Assistentenzeichen und Zeitlimit ohne Fortschritt.',
      openSettings: 'Zu den Einstellungen wechseln, um die Cluster-Standards (Laufzeit) zu ändern, denen Bereitstellungen ohne eigene Laufwächter folgen.'
    },
    conversationDetail: {
      viewJson: 'Den vollständigen Konversationsdatensatz als JSON anzeigen.',
      openInvoke: 'Aufrufen mit dieser Konversation öffnen, um die nächste Runde mit der vollständigen Streaming-Ansicht zu senden.',
      delete: 'Diese Konversation löschen. Ihre Runden bleiben als gewöhnliche Läufe auf der Seite Läufe, aber die Konversation lässt sich nicht mehr fortsetzen.',
      deleteBusy: 'Eine Runde ist noch offen, daher verweigert der Server das Löschen, bis dieser Lauf endet oder abgebrochen wird.',
      agent: 'Der Agent dieser Konversation. Klicken, um den Agenten zu öffnen.',
      openAgent: 'Die Seite dieses Agenten mit Bereitstellungen und letzten Läufen öffnen.',
      deployment: 'Jede Runde läuft auf dieser Bereitstellung: der, an die die erste Runde geleitet wurde.',
      activeRun: 'Die Runde, die noch wartet oder läuft. Die nächste Nachricht wird abgelehnt, bis sie endet.',
      openRun: 'Die Seite dieses Laufs mit vollständigem Verlauf, Ergebnis und Telemetrie öffnen.',
      turns: 'Alle Runden der Konversation, die älteste zuerst. Jede Runde ist ein Lauf.',
      columns: {
        turn: 'Position der Runde in der Konversation, beginnend mit 1.',
        run: 'Der Lauf, der diese Runde ausgeführt hat. Klicken, um sein Protokoll zu öffnen.',
        status: 'Wo der Lauf der Runde in seinem Lebenszyklus steht: wartend, laufend oder in einem der Endzustände.',
        outcome: 'Warum der Lauf der Runde endete, genauer als der Status.',
        session: 'Ob die Runde die Harness-Sitzung der vorherigen Runde fortgesetzt oder eine frische Sitzung mit dem Verlauf begonnen hat (und warum).',
        input: 'Der Anfang der Nachricht dieser Runde. Für mehr Text darauf zeigen.',
        result: 'Der Anfang der Antwort oder der Fehler, wenn der Lauf fehlschlug. Für mehr Text darauf zeigen.',
        node: 'Der Worker-Knoten, der die Runde ausgeführt hat.',
        created: 'Wann die Runde gesendet wurde. Für die genaue Zeit auf den Wert zeigen.'
      },
      session: {
        first: 'Die erste Runde: Sie beginnt die Harness-Sitzung, die spätere Runden fortsetzen.',
        resumed: 'Diese Runde hat die Harness-Sitzung {{session}} auf dem Knoten mit den Verzeichnissen der Konversation fortgesetzt, sodass der Agent seinen vollen Kontext behielt.',
        fallback: 'Diese Runde konnte die Sitzung nicht fortsetzen und hat deshalb eine frische Harness-Sitzung mit dem Verlauf der früheren Runden begonnen.',
        pending: 'Die Runde wartet auf einen Knoten, daher ist noch offen, ob sie die Sitzung fortsetzt oder neu aufbaut.'
      },
      continueTitle: 'Die nächste Nachricht als nächste Runde dieser Konversation senden. Sie läuft mit demselben Agenten und derselben Bereitstellung.',
      message: 'Die nächste Nachricht an den Agenten. Sie setzt die Konversation mit dem Kontext der früheren Runden fort.',
      send: 'Diese Nachricht als nächste Runde senden. Die Runde erscheint in der Liste oben und wird aktualisiert, bis sie endet.',
      sendBusy: 'Die vorherige Runde ist noch offen. Der Server lehnt eine neue Runde bis zu ihrem Ende ab; warten Sie also oder brechen Sie sie zuerst ab.'
    }
  },
  analytics: {
    grafana: 'Das Dashboard „Runs“ in Grafana in einem neuen Tab öffnen, für denselben Zeitraum wie diese Seite.',
    filters: {
      ttft: 'Wenn aktiviert, lässt das Diagramm zur Zeit bis zum ersten Token die Wartezeit auf delegierte Agenten weg, damit delegierende Agenten fair mit direkt antwortenden verglichen werden.',
      range: 'Zeitfenster für alle Diagramme und Summen: die letzte Stunde, der letzte Tag, die letzte Woche, die letzten 30 Tage oder ein eigener Start und ein eigenes Ende.',
      from: 'Beginn des benutzerdefinierten Zeitraums, in Ihrer lokalen Zeitzone.',
      to: 'Ende des benutzerdefinierten Zeitraums, in Ihrer lokalen Zeitzone.',
      agentId: 'Nur Läufe dieses Agenten zählen. Die Liste der Bereitstellungen beschränkt sich dann auf seine Bereitstellungen.',
      harnessType: 'Nur Läufe zählen, die von dieser Harness ausgeführt wurden.',
      deploymentId: 'Nur Läufe dieser Bereitstellung zählen, zum Beispiel um zwei Modelle eines Agenten zu vergleichen.',
      model: 'Nur Läufe zählen, deren Harness dieses bediente Modell gemeldet hat. Die Liste zeigt die im gewählten Zeitraum gesehenen Modelle.',
      groupBy: 'Jedes Diagramm in eine Reihe pro Agent, Harness, Modell oder Paar aus Harness und Modell aufteilen, damit Sie sie vergleichen können.'
    },
    cards: {
      delegationWait: 'Mittlere Zeit, die Läufe auf delegierte Kindläufe gewartet haben. k. A., wenn im Zeitraum kein Lauf delegiert hat.',
      ttftExcludingDelegation: 'Mittlere Zeit bis zum ersten Token ohne die Wartezeit auf delegierte Agenten. Die Notiz zeigt das 95. Perzentil.',
      runs: 'Im Zeitraum angeforderte Läufe, die den Filtern entsprechen.',
      successRate: 'Erfolgreiche Läufe als Anteil der beendeten Läufe (erfolgreich, fehlgeschlagen, abgebrochen und mit Zeitüberschreitung).',
      ttft: 'Mittlere Zeit bis zum ersten Token über alle Läufe mit Ausgabe. Die Notiz zeigt das 95. Perzentil.',
      execution: 'Mittlere Ausführungszeit der Harness. Die Notiz zeigt das 95. Perzentil, das Ihre langsamen Läufe widerspiegelt.',
      queue: 'Mittlere Zeit, die Läufe auf einen Worker-Knoten gewartet haben.',
      tokens: 'Eingabe- plus Ausgabe-Token über alle Läufe im Zeitraum.',
      throughput: 'Mittlere Ausgabe-Token pro Sekunde während des Streamings.',
      cost: 'Gesamte gemeldete Kosten in US-Dollar.',
      toolCalls: 'Gesamtzahl der Werkzeugaufrufe der Läufe im Zeitraum.'
    },
    charts: {
      outcomes: 'Wie Läufe in jedem Zeitintervall geendet haben. Fahren Sie mit der Maus über einen Balken, um die Anzahlen zu sehen.',
      ttft: 'Wie lange Läufe bis zu ihrem ersten Token gebraucht haben: Mittelwert, Median und 95. Perzentil.',
      duration: 'Wie lange das Modell gestreamt hat und wie lange die Harness insgesamt lief.',
      queue: 'Wie lange Läufe gewartet haben, bevor ein Knoten sie übernommen hat.',
      tokens: 'Verbrauchte Token pro Intervall, aufgeteilt nach Art.',
      throughput: 'Geschwindigkeit der Ausgabeerzeugung in Token pro Sekunde.',
      cost: 'Gemeldete Ausgaben pro Intervall.',
      toolCalls: 'Werkzeugaufrufe pro Intervall.',
      usageTokens: 'Eingabe- plus Ausgabe-Token im Zeitverlauf, ein gestapeltes Segment pro Paar aus Harness und Modell. Fahren Sie mit der Maus über einen Balken für die Aufteilung.',
      usageCost: 'Gemeldete Kosten im Zeitverlauf, ein gestapeltes Segment pro Paar aus Harness und Modell. Fahren Sie mit der Maus über einen Balken für die Aufteilung.'
    },
    metrics: {
      delegationWaitMsAvg: 'Mittlere Wartezeit der Läufe auf delegierte Kindläufe. Klicken, um die Linie aus- oder einzublenden.',
      timeToFirstTokenExcludingDelegationMsP95: '95. Perzentil der Zeit bis zum ersten Token ohne Wartezeit auf delegierte Läufe. Klicken, um die Linie aus- oder einzublenden.',
      timeToFirstTokenExcludingDelegationMsP50: 'Median der Zeit bis zum ersten Token ohne Wartezeit auf delegierte Läufe. Klicken, um die Linie aus- oder einzublenden.',
      timeToFirstTokenExcludingDelegationMsAvg: 'Mittlere Zeit bis zum ersten Token ohne Wartezeit auf delegierte Läufe. Klicken, um die Linie aus- oder einzublenden.',
      runs: 'Im Intervall angeforderte Läufe.',
      succeeded: 'Erfolgreich beendete Läufe. Klicken Sie, um diese Reihe aus- oder einzublenden.',
      failed: 'Fehlgeschlagene Läufe. Klicken Sie, um diese Reihe aus- oder einzublenden.',
      cancelled: 'Abgebrochene Läufe. Klicken Sie, um diese Reihe aus- oder einzublenden.',
      timedOut: 'Läufe, die ihre Frist erreicht haben. Klicken Sie, um diese Reihe aus- oder einzublenden.',
      inputTokens: 'An das Modell gesendete Eingabe-Token. Klicken Sie, um diese Reihe aus- oder einzublenden.',
      outputTokens: 'Vom Modell erzeugte Ausgabe-Token. Klicken Sie, um diese Reihe aus- oder einzublenden.',
      cachedTokens: 'Aus dem Prompt-Cache bediente Eingabe-Token. Klicken Sie, um diese Reihe aus- oder einzublenden.',
      reasoningTokens: 'Reasoning-Token, sofern die Harness sie meldet. Klicken Sie, um diese Reihe aus- oder einzublenden.',
      totalTokens: 'Eingabe-Token plus Ausgabe-Token der Läufe in jedem Intervall.',
      costUsd: 'Gemeldete Kosten in US-Dollar.',
      toolCalls: 'Werkzeugaufrufe der Läufe in jedem Intervall. Klicken Sie, um diese Reihe aus- oder einzublenden.',
      timeToFirstTokenMsAvg: 'Mittlere Zeit bis zum ersten Token im Intervall. Klicken Sie, um diese Linie aus- oder einzublenden.',
      timeToFirstTokenMsP50: 'Median der Zeit bis zum ersten Token: Die Hälfte der Läufe war schneller. Klicken Sie, um diese Linie aus- oder einzublenden.',
      timeToFirstTokenMsP95: '95. Perzentil der Zeit bis zum ersten Token: Nur 1 von 20 Läufen war langsamer. Klicken Sie, um diese Linie aus- oder einzublenden.',
      streamingMsAvg: 'Mittlere Streaming-Zeit, von der ersten bis zur letzten Modellausgabe. Klicken Sie, um diese Linie aus- oder einzublenden.',
      executionMsAvg: 'Mittlere Ausführungszeit der Harness, vom Prozessstart bis zum Ende. Klicken Sie, um diese Linie aus- oder einzublenden.',
      executionMsP95: '95. Perzentil der Ausführungszeit. Klicken Sie, um diese Linie aus- oder einzublenden.',
      queueMsAvg: 'Mittlere Zeit von der Einreihung bis zur Zuweisung.',
      outputTokensPerSecondAvg: 'Mittlere Ausgabe-Token pro Sekunde während des Streamings.'
    },
    groupSeries: {
      none: '{{name}}: {{metric}}.',
      agent: 'Läufe des Agenten {{name}}: {{metric}}. Klicken Sie, um diese Reihe aus- oder einzublenden.',
      harness: 'Läufe auf der Harness {{name}}: {{metric}}. Klicken Sie, um diese Reihe aus- oder einzublenden.',
      model: 'Vom Modell {{name}} bediente Läufe: {{metric}}. Klicken Sie, um diese Reihe aus- oder einzublenden.',
      harnessModel: 'Läufe auf {{name}} (Harness / Modell): {{metric}}. Klicken Sie, um diese Reihe aus- oder einzublenden.'
    },
    otherSeries: 'Alle Gruppen außerhalb der aktivsten, zusammengezählt. Klicken Sie, um sie aus- oder einzublenden.',
    dataTable: 'Die Zahlen hinter diesem Diagramm als Tabelle anzeigen, eine Zeile pro Zeitintervall.',
    bucketStart: 'Beginn des Zeitintervalls. Jede Zeile deckt ein Intervall ab.',
    usage: 'Verbrauch im Zeitverlauf, aufgeteilt nach Harness und Modell, unabhängig von der Gruppierung oben, mit Summen für den gesamten Zeitraum.',
    breakdown: 'Summen für den gewählten Zeitraum pro Paar aus Harness und Modell. Daran sehen Sie, welches Modell Ihren Token-Verbrauch und Ihre Kosten bestimmt.',
    breakdownColumns: {
      harness: 'Die Harness, die diese Läufe ausgeführt hat.',
      model: 'Das Modell, das die Harness als bedient gemeldet hat. Unbekannt bedeutet, dass die Harness keines gemeldet hat.',
      runs: 'Läufe auf dieser Harness mit diesem Modell im Zeitraum.',
      inputTokens: 'An das Modell gesendete Eingabe-Token über diese Läufe.',
      outputTokens: 'Vom Modell erzeugte Ausgabe-Token über diese Läufe.',
      cachedTokens: 'Aus dem Prompt-Cache bediente Eingabe-Token über diese Läufe.',
      reasoningTokens: 'Reasoning-Token, für Harnesses, die sie getrennt melden.',
      costUsd: 'Gesamte gemeldete Kosten in US-Dollar für diese Läufe.',
      timeToFirstTokenMsAvg: 'Mittlere Zeit bis zum ersten Token, gewichtet nach der Anzahl der Läufe in jedem Zeitintervall.'
    }
  },
  export: {
    menu: '{{name}} herunterladen: die Daten als CSV oder JSON oder das Diagramm als PNG- oder SVG-Bild mit Titel, Legende, Filtern und Zeitraum.',
    csv: 'Genau die Daten hinter dieser Ansicht als CSV herunterladen: eine Zeile pro Intervall oder Datensatz, Zeitstempel in ISO 8601 UTC und einfache Zahlen mit Dezimalpunkt.',
    png: 'Das Diagramm als PNG-Bild in doppelter Bildschirmauflösung herunterladen, mit Titel, Legende, aktiven Filtern und Zeitraum.',
    svg: 'Das Diagramm als skalierbares SVG-Bild herunterladen, mit Titel, Legende, aktiven Filtern und Zeitraum.',
    json: 'Die Daten als JSON herunterladen, mit Reihen, Intervallen, Filtern und Zeitraum in einem Dokument.'
  }
};

const explainers = {
  approvals: {
    title: 'So funktionieren Freigaben',
    p1: 'Eine Bereitstellung mit aktivierten Freigaben lässt ihre Harness vor Werkzeugaufrufen bei Garrison nachfragen: Claude Code über sein Werkzeug für Berechtigungsabfragen, Läufe mit Codex app-server bei Befehlen und Dateiänderungen.',
    p2: 'Jede Anfrage wird gegen die Regeln der Bereitstellung geprüft. Verweigern geht vor Fragen, und Fragen geht vor Erlauben; trifft nichts zu, gilt der Standard der Bereitstellung. Erlauben und Verweigern antworten sofort; Fragen legt die Anfrage hier ab, und der Lauf wartet.',
    p3: 'Erlauben oder verweigern Sie eine ausstehende Anfrage mit optionaler Begründung. Als Regel merken fügt der Bereitstellung eine Regel hinzu, sodass der nächste ähnliche Aufruf automatisch entschieden wird. Anfragen, die niemand entscheidet, laufen mit der Zeitlimit-Entscheidung der Bereitstellung ab.'
  },
  diagram: {
    label: 'Diagramm: Ein Aufrufer ruft einen Agenten über seinen Namen auf, Garrison wählt nach Gewichtung eine der Bereitstellungen des Agenten, und die Bindungen dieser Bereitstellung bestimmen, wie der Lauf ausgeführt wird.',
    caller: { title: 'Aufrufer', body: 'REST, MCP, A2A oder ein anderer Agent', tip: 'Alles, was einen Agenten aufruft: die REST-API, ein MCP-Client, ein A2A-Agent oder der Lauf eines anderen Agenten. Aufrufende kennen nur den Agentennamen.' },
    agent: { title: 'Agent', body: 'Name, Beschreibung, Bereitstellung nach außen, Delegation, Ausgabeschema', tip: 'Die adressierbare Identität. Aufrufende rufen sie über den Namen auf; sie beschreibt, was der Agent ist und wie er angeboten wird, nicht wie er läuft.' },
    deploymentA: { title: 'Bereitstellung A, Gewichtung 300', body: 'Claude Code, sonnet', tip: 'Eine Art, den Agenten auszuführen. Mit Gewichtung 300 gegenüber 100 erhält sie 75 % der Aufrufe, die keine Bereitstellung benennen.' },
    deploymentB: { title: 'Bereitstellung B, Gewichtung 100', body: 'Mux, lokales Modell', tip: 'Eine weitere Art, denselben Agenten auszuführen. Aufrufende können sie auch explizit benennen, um die gewichtete Auswahl zu umgehen.' },
    binds: { title: 'Jede Bereitstellung bindet', body: 'Harness-Profil, Prompts, MCP-Server, Geheimnisse, Arbeitsbereich, Knotenpool, Grenzen', tip: 'Alles, was aus einer Anfrage einen konkreten Prozess macht: welche CLI, welche Prompts, welche Werkzeuge und Zugangsdaten und wo er laufen darf.' },
    run: { title: 'Lauf', body: 'Eine Ausführung einer Bereitstellung', tip: 'Jeder Aufruf erzeugt einen Lauf, kompiliert aus der gewählten Bereitstellung und ausgeführt auf einem Worker-Knoten.' }
  },
  agents: {
    title: 'Agenten und Bereitstellungen',
    p1: 'Ein Agent ist die Identität, die Aufrufende verwenden. Er hat einen Namen, eine Beschreibung, eine Art der Bereitstellung nach außen (A2A-Karte, MCP-Werkzeug), eine Angabe, ob er andere Agenten aufrufen darf, und das Ausgabeschema, dem seine Antworten entsprechen müssen. Für sich allein führt ein Agent nichts aus.',
    p2: 'Eine Bereitstellung legt fest, wie der Agent läuft: welches Harness-Profil und Modell, welche Prompt-Vorlagen, welche MCP-Server und Geheimnisse (über Aliase), welcher Arbeitsbereich, welcher Knotenpool und welche Grenzen und Parameter pro Lauf gelten. Ein Agent kann mehrere Bereitstellungen haben, jede mit einer Verkehrsgewichtung.',
    p3: 'Wenn jemand den Agenten aufruft, wählt Garrison zufällig nach Gewichtung eine seiner aktiven Bereitstellungen, sofern der Aufrufer keine bestimmte Bereitstellung benannt hat. So betreiben Sie eine Claude-Code- und eine Mux-Variante nebeneinander oder verlagern Verkehr schrittweise auf ein neues Modell.'
  },
  deployments: {
    title: 'Was eine Bereitstellung ist',
    p1: 'Eine Bereitstellung macht aus einem Agenten etwas Ausführbares. Sie gehört zu genau einem Agenten und bindet ein Harness-Profil (welche CLI gestartet wird), ein Modell, Prompt-Vorlagen für jede Rolle, MCP-Server und Geheimnisse unter Aliasen, optional einen Arbeitsbereich und einen Artefaktspeicher, die Platzierung auf Knotenpools oder Labels sowie Grenzen wie Zeitlimit und Parallelität.',
    p2: 'Ein Agent mit mehreren aktiven Bereitstellungen verteilt seinen Verkehr nach Gewichtung: Gewichtungen von 300 und 100 schicken drei von vier Aufrufen an die erste. Inaktive Bereitstellungen erhalten keinen gewichteten Verkehr, können aber weiterhin explizit benannt werden. Das ist praktisch, um eine neue Konfiguration zu testen, bevor sie Gewichtung erhält.',
    p3: 'Verwenden Sie die Kompilierungsvorschau einer Bereitstellung, um genau die Befehlszeile, Dateien und Umgebung zu sehen, die ein Lauf erhalten würde, ohne einen zu starten.'
  },
  agentDetail: {
    title: 'Wie dieser Agent läuft',
    p1: 'Dieser Agent wird über seinen Namen erreicht. Die Bereitstellungen unten sind die konkreten Arten, wie er laufen kann. Jede aktive Bereitstellung erhält einen Verkehrsanteil, der ihrer Gewichtung geteilt durch die Gesamtgewichtung der aktiven Bereitstellungen entspricht; Aufrufende, die eine Bereitstellung benennen, überspringen die gewichtete Auswahl.'
  },
  harnessProfiles: {
    title: 'Harness-Profile und Bereitstellungen',
    p1: 'Ein Harness-Profil ist ein Startrezept für einen Kommandozeilen-Agenten: das Programm, die Argumentvorlagen, Umgebungsvariablen, zu schreibende Dateien, wie Prompt und System-Prompt übergeben werden, welches MCP-Konfigurationsformat gelesen wird und wie die Ausgabe in Ereignisse umgewandelt wird.',
    p2: 'Profile sind gemeinsam genutzte Bausteine. Eine Bereitstellung wählt ein Profil und ergänzt dann die Einzelheiten: Modell, Prompts, Geheimnisse und Überschreibungen von Argumenten oder Umgebung, die nur für sie gelten. Viele Bereitstellungen können dasselbe Profil verwenden, eine Korrektur am Profil erreicht also alle.',
    p3: 'Integrierte Profile sind schreibgeschützt. Klonen Sie eines, um es zu ändern.'
  },
  promptTemplates: {
    title: 'Prompt-Vorlagen und wie Bereitstellungen sie verwenden',
    p1: 'Jeder Text, den Garrison an eine Harness sendet, ist eine Vorlage: System-Prompts, der Rahmen um die Nachricht des Aufrufers, Delegationsanweisungen, Werkzeugbeschreibungen und erzeugte Konfigurationsdateien. Vorlagen verwenden Variablen wie {{input.message}} und {{deployment.model}}, und jedes Speichern erzeugt eine neue Version.',
    p2: 'Bereitstellungen binden Vorlagen an Prompt-Rollen (System, Task, DelegatedTask und weitere). Eine Bindung folgt entweder der neuesten Version oder fixiert eine, sodass Sie eine Vorlage bearbeiten können, ohne eine produktive Bereitstellung zu ändern, bis Sie es wollen. Jeder Lauf hält die genauen Versionen fest, die er verwendet hat.'
  },
  mcpServers: {
    title: 'MCP-Server und Bindungen',
    p1: 'Ein hier aufgeführter MCP-Server ist ein Werkzeuganbieter: eine Adresse (oder ein Befehl bei stdio-Servern), benötigte Header oder Umgebung und die Werkzeuge, die vorhanden sein müssen. Die Registrierung eines Servers stellt ihn noch keinem Agenten zur Verfügung.',
    p2: 'Eine Bereitstellung bindet die Server, die ihr Agent nutzen soll, jeweils unter einem Alias. Beim Kompilieren schreibt Garrison sie in die MCP-Konfiguration der Harness und löst dabei Verweise auf Geheimnisse in Headern auf, und der Worker prüft erforderliche Werkzeuge vor dem Start. Der eigene MCP-Server von Garrison wird automatisch hinzugefügt, wenn der Agent delegieren darf.'
  },
  secrets: {
    title: 'Geheimnisse und Aliase',
    p1: 'Ein Geheimnis ist ein verschlüsselter Wert wie ein API-Schlüssel oder ein Token. Der Wert ist nur schreibbar: Nach dem Speichern können Sie ihn ersetzen oder rotieren, aber niemand kann ihn über die Konsole oder die API wieder auslesen.',
    p2: 'Bereitstellungen binden Geheimnisse unter einem Alias. Umgebungsvariablen und Dateien des Harness-Profils verweisen dann auf {{secret.alias}}, sodass dasselbe Profil in verschiedenen Bereitstellungen mit verschiedenen Schlüsseln funktioniert. Werte werden nur beim Kompilieren eines Laufs entschlüsselt, per TLS an den Worker gesendet und aus Protokollen entfernt.'
  },
  workspaces: {
    title: 'Arbeitsbereiche',
    p1: 'Eine Arbeitsbereichsvorlage beschreibt das Verzeichnis, in dem jeder Lauf beginnt: leer, ein frischer Git-Klon (optional mit einem Geheimnis für Zugangsdaten zu privaten Repositorys) oder eine Menge vorbefüllter Dateien. Die Aufbewahrung entscheidet, ob das Verzeichnis nach dem Lauf gelöscht oder behalten wird.',
    p2: 'Eine Bereitstellung kann keine oder eine Arbeitsbereichsvorlage binden. Jeder Lauf erhält eine eigene Kopie, Läufe sehen also nie die Dateien anderer Läufe.'
  },
  modelPrices: {"title": "Modellpreise", "p1": "Vom Betreiber konfigurierte USD-Tarife zur Kostenschätzung, wenn der Harness keine Kosten meldet. Gemeldete Kosten, auch null, haben Vorrang.", "p2": "Inaktive Preise werden nicht verwendet. Gespeicherte Laufkosten ändern sich durch Bearbeiten oder Löschen der Preise nicht."},
  usageQuotas: {"title": "Nutzungskontingente", "p1": "Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "p2": "Leer lassen für unbegrenzte Nutzung. Null verbietet Nutzung. Tageszähler werden um Mitternacht UTC zurückgesetzt; Parallelität zählt aktuell aktive Läufe. Standardmäßig aus. Explizit aktivieren, um Läufe bei erreichten Grenzen abzulehnen und unterstützte Harness-Budgets zu senken. Ohne Aktivierung wird nur die Nutzung erfasst."},
  artifactStores: {
    title: 'Artefaktspeicher',
    p1: 'In einem Artefaktspeicher werden von Läufen erzeugte Dateien aufbewahrt, nachdem der Arbeitsbereich des Laufs entfernt wurde. Eine Bereitstellung kann einen Speicher binden, und der Worker lädt passende Dateien dorthin hoch, wenn der Lauf endet.'
  },
  manifests: {
    title: 'Manifeste und die Datensätze, die sie erstellen',
    p1: 'Ein Manifest ist die Konfiguration des Mandanten, geschrieben als YAML- oder JSON-Dokumente: Geheimnisse (standardmäßig ohne Werte), Prompt-Vorlagen, Harness-Profile, MCP-Server, Arbeitsbereichsvorlagen, Agenten und Bereitstellungen. Dokumente verweisen über Namen aufeinander, ein Manifest funktioniert also in jedem Mandanten.',
    p2: 'Das Anwenden eines Manifests erstellt oder aktualisiert gewöhnliche Datensätze, dieselben, die Sie auf den anderen Registerkarten sehen. Zweimaliges Anwenden ändert nichts. Ein Probelauf zeigt, was sich ändern würde, ohne zu schreiben, und Exportieren erzeugt ein Manifest, das diesen Mandanten nachbildet.'
  },
  nodes: {
    title: 'Knoten und Knotenpools',
    p1: 'Ein Knoten ist ein Worker-Prozess, meist ein Pod, der Läufe von der Steuerungsebene abholt, Harnesses startet und ihre Ereignisse zurückstreamt. Knoten registrieren sich selbst, melden, welche Harnesses sie gefunden haben, und senden Heartbeats; Sie erstellen sie nicht hier.',
    p2: 'Ein Knoten kann zu einem Knotenpool gehören und Labels tragen. Bereitstellungen verwenden Pools und Label-Auswahlen, um festzulegen, wo ihre Läufe ausgeführt werden dürfen. Sperren Sie einen Knoten, um neue Arbeit zu stoppen, oder leeren Sie ihn vor Wartungsarbeiten.'
  },
  controlNodes: {
    title: 'Steuerungsknoten und Worker-Knoten',
    p1: 'Ein Steuerungsknoten ist ein Replikat des Garrison-Servers. Steuerungsknoten stellen die REST-API, den MCP-Server und das A2A-Gateway bereit, authentifizieren Aufrufer, kompilieren Bereitstellungen zu Läufen und planen diese Läufe. Jedes Replikat kann jede Anfrage beantworten, daher kann ein Load Balancer den Verkehr auf sie verteilen.',
    p2: 'Ein Steuerungsknoten ist der Leader. Er hält eine Lease in der Datenbank und übernimmt die clusterweite Wartung: Bereinigung nach Aufbewahrungsfristen, Markieren stiller Replikate als Offline und Entfernen alter Zeilen. Fällt der Leader aus, übernimmt ein anderes Replikat die Lease innerhalb weniger Sekunden.',
    p3: 'Worker-Knoten auf der Registerkarte Worker-Knoten erledigen die andere Hälfte: Sie holen geleaste Läufe von der Steuerungsebene ab und führen die Harnesses aus. Steuerungsknoten führen nie eine Harness aus, und Worker greifen nie auf die Datenbank zu. Jedes Replikat registriert sich selbst und sendet alle 5 Sekunden einen Heartbeat, daher ist diese Registerkarte nur lesend.'
  },
  nodePools: {
    title: 'Knotenpools und Knoten',
    p1: 'Ein Knotenpool ist eine benannte Gruppe von Worker-Knoten, zum Beispiel GPU-Maschinen oder Knoten, die für eine Kundschaft reserviert sind. Knoten treten einem Pool bei ihrer Registrierung bei. Ein Pool kann auf bestimmte Mandanten beschränkt werden.',
    p2: 'Bereitstellungen, die einen Pool benennen, laufen nur auf dessen Knoten. Bereitstellungen ohne Pool können auf jedem geeigneten Knoten laufen.'
  },
  tenants: {
    title: 'Mandanten',
    p1: 'Ein Mandant ist eine isolierte Organisation auf diesem Server. Benutzer, Zugangsschlüssel, Agenten, Geheimnisse und Läufe gehören jeweils zu einem Mandanten, und nichts ist mandantenübergreifend sichtbar. Knotenpools und Worker-Knoten werden gemeinsam genutzt, sofern ein Pool nicht für bestimmte Mandanten reserviert ist.'
  },
  users: {
    title: 'Benutzer und Zugangsschlüssel',
    p1: 'Ein Benutzer ist eine Person, die sich mit E-Mail und Passwort anmeldet. Ein Zugangsschlüssel ist die Art, wie sich Automatisierung anmeldet. Jeder Zugangsschlüssel gehört einem Benutzer und kann nie mehr als dieser Benutzer.',
    p2: 'Keiner von beiden erhält Zugriff allein dadurch, dass er existiert. Zugriff ergibt sich aus den Administrationsmarkierungen am Benutzer und aus Rollenzuweisungen.'
  },
  credentials: {
    title: 'Zugangsschlüssel und Benutzer',
    p1: 'Ein Zugangsschlüssel ist ein Paar aus Zugangsschlüssel und geheimem Schlüssel für Skripte, SDKs und Dienste. Er gehört einem Benutzer. Seine effektiven Berechtigungen sind die Schnittmenge aus dem, was seine eigenen Rollenzuweisungen gewähren, und dem, was sein Eigentümer darf.',
    p2: 'Der geheime Schlüssel wird einmal angezeigt, wenn der Schlüssel erstellt oder rotiert wird. Rotieren Sie Schlüssel regelmäßig und löschen Sie solche, die lange nicht verwendet wurden.'
  },
  roles: {
    title: 'Rollen, Berechtigungen und Zuweisungen',
    p1: 'Eine Berechtigung ist eine einzelne Regel: bestimmte Operationen (etwa Read oder Execute) auf bestimmten Ressourcentypen (etwa Agent oder Run) erlauben oder verweigern. Eine Rolle ist ein benanntes Bündel von Berechtigungen. Verweigern gewinnt immer gegenüber Erlauben.',
    p2: 'Für niemanden ändert sich etwas, bis eine Rolle zugewiesen wird. Zuweisungen auf der nächsten Registerkarte verbinden eine Rolle mit einem Benutzer oder Zugangsschlüssel, für den ganzen Mandanten oder für einen Datensatz.'
  },
  assignments: {
    title: 'Zuweisungen',
    p1: 'Eine Zuweisung vergibt eine Rolle an einen Benutzer oder Zugangsschlüssel. Der Geltungsbereich Mandant wendet die Rolle auf jeden Datensatz der abgedeckten Typen an; der Geltungsbereich Ressource wendet sie auf einen einzelnen Datensatz an, etwa den einen Agenten, den ein CI-Job aufrufen darf.',
    p2: 'Verwenden Sie Effektive Berechtigungen bei einem Benutzer oder Zugangsschlüssel, um das kombinierte Ergebnis aller Zuweisungen zu sehen.'
  },
  runs: {
    title: 'Läufe und die Warteschlange',
    p1: 'Ein Lauf ist ein Aufruf einer Bereitstellung. Er wird eingereiht, von einem Worker-Knoten übernommen, ausgeführt und mit einem Ergebnis, einem Protokoll, einer Antwort und Telemetrie wie Zeit bis zum ersten Token, Token und Kosten abgeschlossen.',
    p2: 'Die Registerkarte Warteschlange zeigt dieselben Läufe, während sie warten: Eingereihte Läufe brauchen einen Knoten mit passender Harness und Platzierung, zugewiesene Läufe wurden übernommen, und laufende Läufe werden ausgeführt. Läufe, die lange in der Warteschlange stehen, deuten auf zu wenig Kapazität oder auf Platzierungsregeln hin, die kein Knoten erfüllt.'
  },
  queue: {
    title: 'Die Warteschlange',
    p1: 'Dies ist die Live-Ansicht der Läufe, die noch nicht beendet sind: wartend auf einen Knoten, zugewiesen oder laufend, gruppiert nach Agent und Harness. Es sind dieselben Daten wie auf der Registerkarte Läufe, zusammengefasst, um den Planungsdruck zu zeigen.',
    p2: 'Eine wachsende Zahl eingereihter Läufe für eine Harness bedeutet meist, dass kein bereiter Knoten diese Harness meldet, die passenden Knoten ausgelastet sind oder die Bereitstellung einen Pool oder Labels verlangt, die kein Knoten hat.'
  },
  invoke: {
    title: 'Was beim Aufrufen passiert',
    p1: 'Sie rufen den Agenten über seinen Namen auf. Sofern Sie keine Bereitstellung wählen, wählt Garrison nach Gewichtung eine der aktiven Bereitstellungen des Agenten, prüft etwaige Parameter pro Lauf gegen das, was diese Bereitstellung erlaubt, und reiht einen Lauf ein. Das Protokoll wird hier gestreamt, während der Worker ihn ausführt.'
  },
  audit: {
    title: 'Audit und Anfrageverlauf',
    p1: 'Auditeinträge sind Sicherheits- und Konfigurationsereignisse: Anmeldungen, abgelehnte Anfragen, Änderungen an Geheimnissen und Rollen, Manifest-Anwendungen und Statusänderungen von Knoten. Sie werden für die in den Einstellungen festgelegte Aufbewahrungsdauer gespeichert.',
    p2: 'Der Anfrageverlauf auf der vorherigen Registerkarte ist der rohe HTTP-Verkehr. Verwenden Sie das Audit, um zu klären, wer was geändert hat, und den Anfrageverlauf, um zu untersuchen, was ein Client tatsächlich gesendet hat.'
  },
  requests: {
    title: 'Anfrageverlauf',
    p1: 'Jede von diesem Server erfasste API-Anfrage mit Methode, Pfad, Status, Zeiten, Headern und Inhalten (gekürzt auf die konfigurierte Größe). Verwenden Sie ihn zur Fehlersuche bei Integrationen und SDK-Aufrufen. Klicken Sie auf einen Balken im Diagramm, um die Tabelle auf diesen Zeitraum einzugrenzen.'
  },
  analytics: {
    title: 'Was diese Diagramme messen',
    p1: 'Die Zeit bis zum ersten Token reicht vom Start des Harness-Prozesses bis zur ersten Modellausgabe und enthält damit den CLI-Start. Die Streaming-Zeit reicht von der ersten bis zur letzten Modellausgabe, die Ausführungszeit vom Prozessstart bis zum Prozessende. Die Wartezeit gibt an, wie lange ein Lauf auf einen Worker-Knoten gewartet hat. Gemessen wird mit den Uhren von Worker und Server.',
    p2: 'Token-Zahlen und Kosten stammen aus den Meldungen der jeweiligen Harness. Cache-Token sind Eingabe-Token, die aus dem Prompt-Cache des Anbieters bedient wurden, und Reasoning-Token erscheinen nur bei Harnesses, die sie getrennt melden. Ausgabe-Token pro Sekunde sind Ausgabe-Token geteilt durch die Streaming-Zeit.',
    p3: 'Mittelwerte lassen Läufe außer Acht, bei denen ein Wert nicht gemessen werden konnte. Perzentile zeigen die langsamen Ausreißer: p95 bedeutet, dass nur einer von zwanzig Läufen langsamer war. Gruppieren Sie nach Agent oder Harness, um sie direkt zu vergleichen.'
  },
  conversations: {
    title: 'Konversationen und Runden',
    p1: 'Eine Konversation ist eine Folge von Läufen mit einem Agenten. Die erste Runde beginnt eine Harness-Sitzung; jede spätere Runde setzt diese Sitzung auf demselben Worker-Knoten fort, sodass der Agent Dateien, Tools und Kontext zwischen den Nachrichten behält.',
    p2: 'Es läuft immer nur eine Runde: Eine neue Nachricht wird abgelehnt, solange die vorherige Runde offen ist. Jede Runde bleibt auf der Bereitstellung der ersten Runde.',
    p3: 'Kann eine Runde nicht fortsetzen (der Knoten ist weg oder zu lange belegt, die Dateien wurden entfernt oder die Harness kann nicht fortsetzen), beginnt sie eine frische Sitzung mit dem Verlauf der früheren Runden. Die Spalte Neuaufbauten zählt diese Runden, und die Rundenliste nennt den Grund.'
  }
};

export { tips, explainers };

tips.views.settings.groups.Leases = "Optionale Koordinierung: alle Replikate gleich konfigurieren und neu starten. Standard ist Database.";
tips.views.settings.fields.Leases = {"Provider": "Optionale Koordinierung: alle Replikate gleich konfigurieren und neu starten. Standard ist Database.", "ClutchEndpoint": "Clutch-Zugriffsschlüssel als Geheimnis oder Umgebungsvariable bereitstellen; keine Zugangsdaten im Endpunkt.", "ClutchAccessKey": "Clutch-Zugriffsschlüssel als Geheimnis oder Umgebungsvariable bereitstellen; keine Zugangsdaten im Endpunkt.", "KeyPrefix": "Optionale Koordinierung: alle Replikate gleich konfigurieren und neu starten. Standard ist Database.", "RequestTimeoutMs": "Optionale Koordinierung: alle Replikate gleich konfigurieren und neu starten. Standard ist Database.", "SweepIntervalMs": "Optionale Koordinierung: alle Replikate gleich konfigurieren und neu starten. Standard ist Database.", "MaxLeaseMs": "Optionale Koordinierung: alle Replikate gleich konfigurieren und neu starten. Standard ist Database.", "MaxHoldMs": "Optionale Koordinierung: alle Replikate gleich konfigurieren und neu starten. Standard ist Database."};

tips.enums.harnessType.ProviderApi = "Optionale API-Schleife über PolyPrompt. Endpunkt und Modell erforderlich; CLI-Bereitstellungen bleiben verfügbar.";
tips.enums.harnessType.OpenCode = "opencode-CLI, headless mit opencode run und JSON-Ereignissen ausgeführt. Funktioniert mit Anthropic, OpenAI, Google und weiteren Modellanbietern.";
tips.enums.harnessType.Pi = "pi-Coding-Agent, ausgeführt mit --mode json. Funktioniert mit Anthropic, OpenAI, Google und weiteren Modellanbietern.";

// Pipelines (P12.9).
tips.nav.hubs.approvals = 'Alles, was auf eine Person wartet: Werkzeugaufrufe, die Agenten ausführen möchten, und Pipeline-Stufen, die eine Prüfung erfordern, samt dem Verlauf aller Entscheidungen.';
tips.nav.approvalsBadgeCombined = 'Wartet auf eine Person: {{approvals}} Freigaben für Werkzeugaufrufe und {{reviews}} Prüfungen von Pipeline-Stufen. Öffnen Sie Freigaben, um zu entscheiden.';
Object.assign(tips.nav.tabs, {
  approvals: 'Werkzeugaufrufe von Agenten, die darauf warten, dass eine Person sie erlaubt oder verweigert, und alle früheren Entscheidungen durch Regel, Standard, Person oder Zeitüberschreitung.',
  pipelineReviews: 'Fertige Pipeline-Stufen, die auf eine Person warten: genehmigen, Änderungen anfordern (die Stufe läuft mit Ihrer Rückmeldung erneut) oder ablehnen.',
  pipelines: 'Ketten von Agenten: Jede Stufe führt einen Agenten aus, übergibt seine Ausgabe über eine Prompt-Vorlage an die nächste Stufe und kann auf eine Prüfung warten.',
  pipelineRuns: 'Jede Ausführung einer Pipeline mit Status und Ergebnis. Öffnen Sie einen Lauf für den Stufenverlauf, seine Stufenläufe und seine Prüfungen.'
});
tips.filters.pipelineId = 'Nur Einträge einer Pipeline anzeigen. Wählen Sie Alle, um den Filter zu entfernen.';
tips.filters.pipelineRunId = 'Nur die Prüfungen eines Pipeline-Laufs anzeigen. Fügen Sie eine ID wie plr_... ein; die Liste aktualisiert sich, wenn Sie aufhören zu tippen.';
Object.assign(tips.enums, {
  pipelineRunStatus: {
    Running: 'Eine Stufe läuft, startet gerade oder steht kurz vor dem Start.',
    AwaitingReview: 'Eine Stufe ist fertig und wartet darauf, dass eine Person sie genehmigt, Änderungen anfordert oder sie ablehnt.',
    Cancelling: 'Ein Abbruch wurde angefordert; der aktuelle Stufenlauf wird gestoppt.',
    Succeeded: 'Alle Stufen sind fertig und alle Prüfschritte wurden genehmigt.',
    Failed: 'Eine Stufe ist nach allen Versuchen fehlgeschlagen, konnte nicht starten oder wurde bei der Prüfung abgelehnt. Wiederholen setzt an dieser Stufe fort.',
    Cancelled: 'Jemand hat den Pipeline-Lauf abgebrochen. Wiederholen setzt an der Stufe fort, an der er angehalten hat.',
    TimedOut: 'Die Pipeline lief länger als ihr Zeitlimit, einschließlich der Wartezeit auf Prüfungen.'
  },
  pipelineRunOutcome: {
    None: 'Der Pipeline-Lauf ist noch nicht beendet.',
    Succeeded: 'Alle Stufen waren erfolgreich und alle Prüfungen wurden genehmigt.',
    StageFailed: 'Eine Stufe ist bei jedem Versuch fehlgeschlagen und fährt bei Fehlern nicht fort.',
    StageStartFailed: 'Eine Stufe konnte nicht starten, etwa weil ihr Agent oder ihre Bereitstellung fehlt oder ihr Prompt nicht kompiliert wurde.',
    ReviewRejected: 'Eine prüfende Person hat eine Stufe abgelehnt, was den Pipeline-Lauf beendet.',
    ReviewExpired: 'Eine Prüfung ist abgelaufen und ihre Aktion bei Zeitüberschreitung war Ablehnen.',
    Cancelled: 'Jemand hat den Pipeline-Lauf oder einen seiner Stufenläufe abgebrochen.',
    TimedOut: 'Die Pipeline lief über ihr Zeitlimit hinaus.',
    InternalError: 'Beim Fortschalten der Pipeline trat auf dem Server ein unerwarteter Fehler auf. Prüfen Sie die Serverprotokolle.'
  },
  pipelineStageStatus: {
    Pending: 'Die Stufe hat noch nicht begonnen; frühere Stufen laufen noch.',
    Running: 'Der Stufenlauf ist eingereiht oder läuft. Ein fehlgeschlagener Versuch startet eine neue Ausführung, bis die Versuche aufgebraucht sind.',
    AwaitingReview: 'Die Stufe ist fertig und wartet darauf, dass eine Person ihre Ausgabe prüft.',
    Succeeded: 'Die Stufe ist fertig und wurde, falls eine Prüfung nötig war, genehmigt.',
    Failed: 'Die Stufe ist bei jedem Versuch fehlgeschlagen, konnte nicht starten oder wurde abgelehnt.',
    Cancelled: 'Die Stufe wurde gestoppt, weil der Pipeline-Lauf abgebrochen wurde oder sein Zeitlimit überschritten hat.'
  },
  pipelineReviewStatus: {
    Pending: 'Wartet darauf, dass eine Person genehmigt, Änderungen anfordert oder ablehnt.',
    Approved: 'Genehmigt: Die Pipeline ging zur nächsten Stufe über, gegebenenfalls mit den Hinweisen.',
    ChangesRequested: 'Änderungen angefordert: Die Stufe lief mit der Rückmeldung erneut.',
    Rejected: 'Abgelehnt: Der Pipeline-Lauf ist an dieser Stufe fehlgeschlagen.',
    Expired: 'Niemand hat rechtzeitig entschieden, daher hat die Aktion bei Zeitüberschreitung der Stufe entschieden.',
    Cancelled: 'Der Pipeline-Lauf wurde gestoppt, bevor jemand entschieden hat.'
  },
  pipelineReviewDecision: {
    Approve: 'Die Ausgabe der Stufe annehmen und mit der nächsten Stufe fortfahren. Optionale Hinweise gehen an die nächste Stufe.',
    RequestChanges: 'Dieselbe Stufe mit Ihrer Rückmeldung erneut ausführen. Begrenzt durch die maximalen Überarbeitungen der Stufe.',
    Reject: 'Den Pipeline-Lauf hier beenden. Er schlägt mit dem Ergebnis „Prüfung abgelehnt“ fehl.'
  },
  pipelineReviewSource: {
    User: 'Eine Person hat die Prüfung entschieden.',
    Timeout: 'Die Prüfung ist abgelaufen und die Aktion bei Zeitüberschreitung der Stufe hat entschieden.',
    Cancelled: 'Der Pipeline-Lauf wurde abgebrochen oder hat sein Zeitlimit überschritten, während die Prüfung offen war.'
  }
});
Object.assign(tips.enums.auditEventType, {
  PipelineReviewDecided: 'Eine Person oder eine Zeitüberschreitung hat eine Stufenprüfung genehmigt, abgelehnt oder Änderungen angefordert.',
  PipelineRunCancelled: 'Jemand hat einen Pipeline-Lauf, seine offene Prüfung und seinen aktuellen Stufenlauf abgebrochen.'
});
Object.assign(tips.resources.runs, {
  pipelineRunId: 'Der Pipeline-Lauf, zu dem dieser Lauf als Stufe gehört, mit Stufenposition und Ausführung. Leer bei Läufen außerhalb von Pipelines.',
  pipelineStage: 'Position der Stufe in der Pipeline und welche Ausführung dieser Stufe dieser Lauf ist (Wiederholungen und Überarbeitungen erzeugen weitere Ausführungen).'
});
tips.resources.pipelines = {
  add: 'Eine Pipeline erstellen: eine geordnete Liste von Stufen, die jeweils einen Agenten ausführen und dessen Ausgabe an die nächste übergeben.',
  name: 'Eindeutiger Pipeline-Name in diesem Mandanten, verwendet von API, MCP-Werkzeugen, SDKs und Manifesten. Kleinbuchstaben, Ziffern und Bindestriche.',
  stages: 'Die Stufen in Ausführungsreihenfolge. Jede Stufe führt einen Agenten aus; seine Ausgabe geht über eine Prompt-Vorlage an die nächste Stufe.',
  reviewGates: 'Wie viele Stufen darauf warten, dass eine Person ihre Ausgabe prüft, bevor die Pipeline weiterläuft.',
  maxDurationSeconds: 'Maximale Dauer des gesamten Pipeline-Laufs in Sekunden, einschließlich Wartezeit auf Prüfungen. 0 bedeutet kein Limit; danach endet der Lauf mit Zeitüberschreitung.',
  version: 'Steigt mit jeder gespeicherten Änderung. Pipeline-Läufe speichern die Version, mit der sie gestartet sind, und behalten deren Stufen.',
  stageHeading: 'Eine Stufe der Pipeline, ausgeführt in der angezeigten Reihenfolge. Mit den Pfeilen verschieben, mit dem Papierkorb entfernen.',
  moveUp: 'Diese Stufe eine Position nach vorn verschieben. Die Stufen laufen in der angezeigten Reihenfolge.',
  moveDown: 'Diese Stufe eine Position nach hinten verschieben. Die Stufen laufen in der angezeigten Reihenfolge.',
  removeStage: 'Diese Stufe aus der Pipeline entfernen. Eine Pipeline braucht mindestens eine Stufe.',
  addStage: 'Eine Stufe am Ende der Pipeline hinzufügen. Sie erhält die Ausgabe der vorherigen Stufe.',
  stagesItems: {
    name: 'Name dieser Stufe, eindeutig innerhalb der Pipeline. Erscheint im Stufenverlauf, in Prüfungen und in Übergabe-Prompts.',
    agentId: 'Der Agent, den diese Stufe ausführt. Zum Starten der Pipeline ist die Berechtigung nötig, jeden Stufenagenten auszuführen.',
    deploymentId: 'Eine feste Bereitstellung des Stufenagenten. Leer wählt eine der aktiven Bereitstellungen des Agenten nach Gewichtung, wie bei einem normalen Aufruf.',
    handoffTemplateId: 'Aufgaben-Prompt-Vorlage, die die Aufgabe dieser Stufe mit früheren Ausgaben, Prüfhinweisen und Überarbeitungswünschen umhüllt. Leer verwendet die PipelineStage-Bindung der Bereitstellung oder die integrierte Vorlage.',
    handoffTemplateVersion: 'Diese Version der Übergabevorlage auch nach Änderungen verwenden. Leer verwendet immer die aktuelle Version.',
    outputCharLimit: 'Höchstzahl an Zeichen jeder früheren Stufenausgabe, die an diese Stufe übergeben werden. Längere Ausgaben werden gekürzt und als gekürzt markiert.',
    maxAttempts: 'Wie oft die Stufe läuft, wenn ihr Lauf fehlschlägt oder das Zeitlimit überschreitet, bevor die Stufe als fehlgeschlagen gilt.',
    continueOnFailure: 'Schlägt die Stufe bei jedem Versuch fehl, trotzdem mit der nächsten Stufe fortfahren; diese sieht den Fehler in der Übergabe.',
    requiresReview: 'Nach Abschluss der Stufe darauf warten, dass eine Person sie unter Freigaben > Stufenprüfungen genehmigt, Änderungen anfordert oder ablehnt.',
    reviewTimeoutSeconds: 'Wie lange die Prüfung warten darf, bevor die Aktion bei Zeitüberschreitung entscheidet. 0 wartet, bis eine Person entscheidet.',
    reviewTimeoutAction: 'Was bei Zeitüberschreitung der Prüfung passiert: genehmigen und fortfahren oder ablehnen und den Pipeline-Lauf fehlschlagen lassen.',
    maxRevisions: 'Wie oft eine prüfende Person Änderungen an dieser Stufe anfordern darf. Danach bleiben nur Genehmigen und Ablehnen.',
    description: 'Freitextnotiz für Menschen darüber, was diese Stufe tut. Sie wird nicht an den Agenten gesendet.',
    parameters: 'Überschreibungen von Laufparametern für die Läufe dieser Stufe, etwa Modell oder Format. Nur erlaubt mit einer Bereitstellung, die solche Überschreibungen zulässt.'
  },
  actions: {
    start: 'Diese Pipeline mit einem Eingabetext starten und ihre Stufen auf der Seite des Pipeline-Laufs verfolgen.',
    preview: 'Alle Stufen-Prompts aus Beispieleingabe und Beispielausgaben der Stufen rendern, ohne einen Lauf zu starten.',
    runs: 'Die Läufe dieser Pipeline auf der Registerkarte Pipeline-Läufe anzeigen.'
  }
};
tips.resources.pipelineRuns = {
  id: 'Kennung des Pipeline-Laufs (plr_...). Verwenden Sie sie mit der API, MCP-Werkzeugen und SDKs.',
  pipelineName: 'Die Pipeline, die dieser Lauf ausführt. Pipeline-Läufe behalten die Stufen der Version, mit der sie gestartet sind.',
  pipelineVersion: 'Die Pipeline-Version, mit der dieser Lauf gestartet ist. Spätere Änderungen an der Pipeline ändern sie nicht.',
  status: 'Wo der Pipeline-Lauf gerade steht: läuft, wartet auf eine Prüfung, wird abgebrochen oder ist beendet.',
  outcome: 'Warum der Pipeline-Lauf endete: erfolgreich, eine Stufe schlug fehl oder konnte nicht starten, eine Prüfung wurde abgelehnt oder lief ab, abgebrochen oder Zeitüberschreitung.',
  progress: 'Die Stufe, an der der Pipeline-Lauf steht, von allen seinen Stufen.',
  callerName: 'Der Benutzer oder Zugangsschlüssel, der den Pipeline-Lauf gestartet hat.',
  errorMessage: 'Was schiefging, wenn der Pipeline-Lauf fehlgeschlagen ist oder sein Zeitlimit überschritten hat.',
  priority: 'Priorität in der Warteschlange für jeden Stufenlauf. Höhere Zahlen werden zuerst eingeplant.',
  deadlineUtc: 'Wann der Pipeline-Lauf wegen des Zeitlimits der Pipeline abbricht. Leer, wenn es kein Limit gibt.',
  completedUtc: 'Wann der Pipeline-Lauf beendet wurde.',
  createdUtc: 'Wann der Pipeline-Lauf gestartet wurde. Fahren Sie über den Wert für die genaue Zeit.',
  actions: {
    cancel: 'Den Pipeline-Lauf abbrechen: Sein aktueller Stufenlauf wird abgebrochen und eine offene Prüfung geschlossen.',
    retry: 'Einen fehlgeschlagenen, abgebrochenen oder abgelaufenen Pipeline-Lauf an der Stufe fortsetzen, an der er angehalten hat, mit einer neuen Ausführung dieser Stufe.',
    stageRuns: 'Die Läufe aller Stufen dieses Pipeline-Laufs auf der Registerkarte Läufe anzeigen.',
    finalRun: 'Den Lauf der letzten Stufe öffnen, dessen Ergebnis das Ergebnis der Pipeline ist.'
  }
};
tips.resources.pipelineReviews = {
  createdUtc: 'Wann die Stufe fertig war und die Prüfung angefordert wurde. Fahren Sie über den Wert für die genaue Zeit.',
  pipelineName: 'Die Pipeline, deren Stufe auf die Prüfung wartet.',
  stageName: 'Die zu prüfende Stufe, mit ihrer Position und der Ausführung, die die Ausgabe erzeugt hat.',
  positionExecution: 'Position der Stufe in der Pipeline und welche Ausführung der Stufe diese Prüfung betrifft. Überarbeitungen erzeugen weitere Ausführungen.',
  status: 'Offene Prüfungen warten auf eine Person; die übrigen zeigen, wie die Prüfung endete.',
  decision: 'Genehmigen, Änderungen anfordern oder Ablehnen, sobald die Prüfung entschieden ist.',
  decisionSource: 'Wer entschieden hat: eine Person, das Prüfzeitlimit der Stufe oder das Stoppen des Pipeline-Laufs.',
  comment: 'Hinweise an die nächste Stufe (Genehmigen), Rückmeldung für die erneute Ausführung (Änderungen anfordern) oder die Begründung (Ablehnen).',
  decidedBy: 'Die Person, die die Prüfung entschieden hat.',
  expiresUtc: 'Wann die Prüfung abläuft und die Aktion bei Zeitüberschreitung der Stufe entscheidet. Leer, wenn sie wartet, bis eine Person entscheidet.',
  pipelineRunId: 'Der Pipeline-Lauf, zu dem diese Prüfung gehört. Klicken Sie auf eine Zeile, um seinen Stufenverlauf zu öffnen.',
  runId: 'Der Stufenlauf, dessen Ausgabe geprüft wird. Öffnen Sie ihn, um das Ergebnis vor der Entscheidung zu lesen.',
  decidedUtc: 'Wann die Prüfung entschieden wurde.',
  id: 'Kennung der Prüfung (prv_...). Verwenden Sie sie mit der API, MCP-Werkzeugen und SDKs, um die Prüfung zu entscheiden.',
  filters: { decisionSource: 'Nur auf eine Art entschiedene Prüfungen anzeigen: durch eine Person, durch das Prüfzeitlimit oder durch das Stoppen des Pipeline-Laufs.' },
  actions: {
    approve: 'Die Ausgabe der Stufe genehmigen und die Pipeline fortfahren lassen, optional mit Hinweisen für die nächste Stufe.',
    requestChanges: 'Die Stufe mit Ihrer Rückmeldung erneut ausführen. Jede Anforderung verbraucht eine der Überarbeitungen der Stufe.',
    reject: 'Die Ausgabe der Stufe ablehnen. Der Pipeline-Lauf schlägt mit dem Ergebnis „Prüfung abgelehnt“ fehl.',
    openStageRun: 'Den zu prüfenden Stufenlauf öffnen, um Protokoll und Ergebnis zu lesen.'
  }
};
tips.pipelineReviews = {
  revisionsLeft: 'Wie oft für diese Stufe noch Änderungen angefordert werden können, bevor nur Genehmigen und Ablehnen bleiben.',
  decide: {
    decision: 'Wählen Sie, was mit der Ausgabe der Stufe geschieht. Der Pipeline-Lauf geht weiter, sobald Sie absenden.',
    Approve: 'Die Ausgabe der Stufe annehmen; die Pipeline fährt mit der nächsten Stufe fort oder ist nach der letzten erfolgreich.',
    RequestChanges: 'Die Stufe mit einer Rückmeldung zurückschicken. Sie läuft erneut und kommt wieder zur Prüfung.',
    Reject: 'Die Ausgabe der Stufe verwerfen. Der Pipeline-Lauf stoppt und schlägt fehl.',
    commentApprove: 'Optionale Hinweise, die die nächste Stufe zusammen mit der Ausgabe dieser Stufe erhält.',
    commentRequestChanges: 'Erforderliche Rückmeldung. Die Stufe läuft damit erneut, also beschreiben Sie, was sich ändern soll.',
    commentReject: 'Optionale Begründung, gespeichert mit der Entscheidung und im Audit-Protokoll.',
    submitApprove: 'Die Stufe jetzt genehmigen. Die Entscheidung ist endgültig und kann danach nicht geändert werden.',
    submitRequestChanges: 'Die Rückmeldung jetzt senden. Die Stufe läuft erneut; ihre nächste Ausgabe kommt wieder zur Prüfung.',
    submitReject: 'Die Stufe jetzt ablehnen. Der Pipeline-Lauf schlägt fehl; das lässt sich nicht rückgängig machen, der Lauf kann aber wiederholt werden.'
  }
};
tips.pipelineStart = {
  input: 'Die Aufgabe für die Pipeline. Die erste Stufe bearbeitet sie, und jede spätere Stufe sieht sie als ursprüngliche Aufgabe neben den früheren Ausgaben.',
  submit: 'Einen Pipeline-Lauf mit dieser Eingabe starten und seinen Stufenverlauf öffnen.'
};
tips.pipelinePreview = {
  input: 'Beispielhafte Eingabe, mit der jeder Stufen-Prompt gerendert wird. Es wird nichts ausgeführt.',
  sampleOutput: 'Angenommene Ausgabe von Stufe {{stage}}, die in der Vorschau an die nachfolgende Stufe übergeben wird.',
  render: 'Jeden Stufen-Prompt mit diesen Beispielen rendern, so wie die Stufenläufe ihn erhalten würden. Geheimnisse werden geschwärzt.',
  stage: 'Der Prompt, den diese Stufe erhalten würde, gerendert aus ihrer Übergabevorlage mit den Beispielen oben.',
  rendered: 'Der Stufen-Prompt wurde ohne Fehler gerendert.',
  failed: 'Der Stufen-Prompt konnte nicht gerendert werden; die Meldung nennt den Grund, etwa einen fehlenden Agenten oder eine fehlende Bereitstellung.'
};
Object.assign(tips.views.runDetail, {
  pipelineRun: 'Dieser Lauf ist eine Stufe eines Pipeline-Laufs. Der Text nach der ID nennt Stufenposition und Ausführung.',
  openPipelineRun: 'Den Pipeline-Lauf öffnen, zu dem dieser Lauf gehört, mit Stufenverlauf und Prüfungen.'
});
tips.views.pipelineRunDetail = {
  viewJson: 'Den vollständigen Pipeline-Lauf mit Stufen, Stufenläufen und Prüfungen als JSON anzeigen.',
  delete: 'Diesen beendeten Pipeline-Lauf samt Prüfungen löschen. Seine Stufenläufe bleiben auf der Seite Läufe.',
  live: 'Aktualisierungen kommen über die Live-Verbindung, sobald sich eine Stufe oder Prüfung ändert.',
  polling: 'Die Live-Verbindung ist nicht verfügbar, daher liest die Seite den Pipeline-Lauf alle paar Sekunden neu.',
  pipeline: 'Die Pipeline, die dieser Lauf ausführt, mit der Version beim Start. Klicken Sie, um sie unter Agenten > Pipelines zu finden.',
  openPipeline: 'Agenten > Pipelines gefiltert auf diese Pipeline öffnen.',
  openRun: 'Diesen Stufenlauf mit Protokoll, Ergebnis und Telemetrie öffnen.',
  finalRun: 'Der Lauf der letzten Stufe. Sein Ergebnis ist das Ergebnis des Pipeline-Laufs.',
  started: 'Wann der erste Stufenlauf erstellt wurde.',
  input: 'Die Eingabe, mit der der Pipeline-Lauf gestartet wurde. Jede Stufe sieht sie als ursprüngliche Aufgabe.',
  reviewTitle: 'Eine Stufe ist fertig und wartet auf Ihre Entscheidung. Lesen Sie ihre Ausgabe im Stufenlauf und entscheiden Sie dann.',
  stages: 'Alle Stufen in Ausführungsreihenfolge mit Status, Ausführungen, Versuchen, Überarbeitungen, Stufenläufen und Prüfungen.',
  current: 'Die Stufe, an der der Pipeline-Lauf gerade steht.',
  reviewGate: 'Diese Stufe wartet darauf, dass eine Person ihre Ausgabe prüft, bevor die Pipeline weiterläuft.',
  agent: 'Der Agent, den diese Stufe ausführt, wie beim Start des Pipeline-Laufs festgehalten.',
  counts: 'Ausführungen zählen jeden Lauf der Stufe; Versuche zählen Läufe seit der letzten Prüfung; Überarbeitungen zählen angeforderte Änderungen.',
  reviewItem: 'Eine Prüfung einer Ausführung dieser Stufe und wie sie entschieden wurde.',
  columns: {
    execution: 'Welche Ausführung der Stufe dieser Lauf ist. Wiederholungen nach Fehlern und Überarbeitungen nach Prüfungen erzeugen weitere Ausführungen.',
    run: 'Der Stufenlauf. Klicken Sie, um Protokoll und Ergebnis zu öffnen.',
    status: 'Aktueller Status des Stufenlaufs in diesem Pipeline-Lauf.',
    outcome: 'Warum der Stufenlauf beendet wurde.',
    error: 'Fehlermeldung des Stufenlaufs, falls er fehlgeschlagen ist.',
    created: 'Wann der Stufenlauf erstellt wurde.'
  }
};
tips.views.settings.fields.Runtime.PipelineSweepIntervalMs = 'Wie oft der Leader Pipeline-Läufe weiterschaltet, die ein Abschlusssignal verpasst haben, blockierte Stufenstarts wiederholt und Prüfzeitlimits sowie Zeitlimits von Pipelines anwendet, in Millisekunden.';
tips.views.settings.fields.Runtime.PipelineMaxStages = 'Höchstzahl an Stufen, die eine Pipeline-Definition haben darf. Das Speichern einer Pipeline mit mehr Stufen wird abgelehnt.';
tips.views.settings.fields.Runs = Object.assign(tips.views.settings.fields.Runs || {}, {
  DelegationChildQueueDepth: 'Höchstzahl delegierter Läufe in der Warteschlange, auf die ihr Elternlauf wartet, im ganzen Cluster. Ein Lauf, der darüber hinaus auf einen weiteren delegierten Lauf warten will, schlägt sofort mit DelegationCapacityExhausted fehl.',
  DelegationRetryAfterSeconds: 'Sekunden, die in Retry-After vorgeschlagen werden, wenn eine wartende Delegation mit DelegationCapacityExhausted abgelehnt wird.'
});
Object.assign(explainers, {
  pipelines: {
    title: 'Pipelines und Stufen',
    p1: 'Eine Pipeline verkettet Agenten. Jede Stufe führt einen Agenten aus, optional auf einer festen Bereitstellung, und übergibt seine Ausgabe (Text, strukturierte Ausgabe und Artefaktverweise) über eine Prompt-Vorlage an die nächste Stufe.',
    p2: 'Eine Stufe kann fehlgeschlagene Läufe wiederholen, nach einem Fehler weitermachen und auf eine Prüfung warten. Prüfungen erscheinen unter Freigaben > Stufenprüfungen; Änderungen anzufordern führt die Stufe mit der Rückmeldung erneut aus.',
    p3: 'Das Bearbeiten einer Pipeline erzeugt eine neue Version. Bereits gestartete Pipeline-Läufe behalten ihre ursprünglichen Stufen.'
  },
  pipelineRuns: {
    title: 'Pipeline-Läufe',
    p1: 'Ein Pipeline-Lauf führt die Stufen einer Pipeline-Version der Reihe nach aus. Jede Ausführung einer Stufe ist ein gewöhnlicher Lauf, verlinkt im Stufenverlauf.',
    p2: 'Abbrechen stoppt den aktuellen Stufenlauf und schließt eine offene Prüfung. Wiederholen setzt einen fehlgeschlagenen, abgebrochenen oder abgelaufenen Pipeline-Lauf an der Stufe fort, an der er angehalten hat.'
  },
  pipelineReviews: {
    title: 'Stufenprüfungen',
    p1: 'Eine Stufe, die eine Prüfung erfordert, wartet nach Abschluss hier. Genehmigen fährt mit der nächsten Stufe fort, Änderungen anfordern führt die Stufe mit Ihrer Rückmeldung erneut aus, und Ablehnen lässt den Pipeline-Lauf fehlschlagen.',
    p2: 'Prüfungen ohne Zeitlimit warten, bis eine Person entscheidet. Mit Zeitlimit entscheidet die Aktion bei Zeitüberschreitung der Stufe, wenn die Zeit abläuft.'
  }
});
tips.views.settings.fields.Scheduling = Object.assign(tips.views.settings.fields.Scheduling || {}, {
  QueueWakeFanout: "Wie viele wartende Lease-Anfragen von Workern jede Replik für einen neu eingereihten Lauf weckt, unter denen, deren Worker ihn übernehmen könnte. Eine Anfrage, die den Lauf nicht übernehmen kann, gibt ihn an die nächste weiter. 0 weckt wie bisher jede passende Anfrage auf jeder Replik. Standard 1.",
  RemoteWakeDelayMs: "Wie lange andere Repliken warten, bevor sie eine eigene Lease-Anfrage für einen Lauf wecken, für den dessen Replik bereits eine geweckt hat, in Millisekunden. Die Wartezeit endet früher, wenn der Lauf übernommen wird oder diese Replik keine passende Anfrage mehr hat. 0 weckt sofort eine Anfrage auf jeder Replik. Standard 250."
});
tips.views.settings.fields.Auth = Object.assign(tips.views.settings.fields.Auth || {}, {
  CacheSeconds: "Wie lange jede Replik die Sitzungen, Mandanten, Benutzer und Anmeldedaten behält, die sie zur Authentifizierung liest, in Sekunden. Das Widerrufen eines Tokens oder Änderungen an Benutzern, Anmeldedaten, Rollen oder Mandanten über die API wirken sofort auf jeder Replik; dies ist die längste Zeit, die eine anders vorgenommene Änderung unbemerkt bleiben kann. 0 schaltet den Cache aus. Standard 5."
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
   "triggers": "Läufe ohne Aufrufer starten: Cron-Zeitpläne in einer Zeitzone und Webhook-URLs, die HMAC-signierte Anfragen anderer Systeme annehmen.",
   "notifications": "Andere Systeme informieren: Garrison sendet eine signierte JSON-Benachrichtigung, wenn ein Lauf oder eine Pipeline endet oder eine Freigabe auf eine Person wartet."
  }
 },
 "filters": {
  "type": "Nur Cron-Auslöser oder nur Webhook-Auslöser anzeigen. Alle zeigt beide.",
  "outcome": "Nur Auslösungen anzeigen, die einen Lauf gestartet haben, fehlgeschlagen sind oder übersprungen wurden.",
  "deliveryStatus": "Nur Zustellungen in einem Zustand anzeigen: wartend, im Versand, zugestellt oder aufgegeben."
 },
 "enums": {
  "triggerType": {
   "Cron": "Löst nach einem fünfteiligen Cron-Zeitplan aus, den der Leader der Steuerungsebene in der Zeitzone des Auslösers auswertet.",
   "Webhook": "Löst aus, wenn an seiner Webhook-URL eine mit seinem Geheimnis signierte Anfrage eintrifft."
  },
  "triggerTargetType": {
   "Agent": "Jede Auslösung reiht einen Lauf des Agenten ein, auf fester Bereitstellung oder nach Gewichtung.",
   "Pipeline": "Jede Auslösung startet einen Lauf der Pipeline mit allen Stufen."
  },
  "triggerFireSource": {
   "Cron": "Der Cron-Zeitplan war fällig und der Leader hat ausgelöst.",
   "Webhook": "Eine korrekt signierte Webhook-Zustellung ist eingetroffen.",
   "Manual": "Eine Person oder ein Zugang hat Jetzt auslösen verwendet."
  },
  "triggerFireOutcome": {
   "Started": "Die Auslösung hat einen Lauf oder Pipeline-Lauf erzeugt; folgen Sie dem Link.",
   "Failed": "Nichts gestartet: Die Vorlage schlug fehl, der ausführende Prinzipal verlor den Zugriff oder das Ziel fehlte.",
   "Skipped": "Der Termin wurde länger als die Cron-Nachholgrenze verpasst und nicht ausgelöst."
  },
  "notificationEvent": {
   "RunSucceeded": "Wird gesendet, wenn ein Lauf mit Status Erfolgreich endet.",
   "RunFailed": "Wird gesendet, wenn ein Lauf fehlschlägt oder abgelehnt wird.",
   "RunCancelled": "Wird gesendet, wenn ein Lauf vor dem Ende abgebrochen wird.",
   "RunTimedOut": "Wird gesendet, wenn ein Lauf seine Frist überschreitet und gestoppt wird.",
   "PipelineCompleted": "Wird gesendet, wenn alle Stufen eines Pipeline-Laufs erfolgreich waren.",
   "PipelineFailed": "Wird gesendet, wenn ein Pipeline-Lauf scheitert, die Zeit überschreitet oder abgebrochen wird.",
   "ApprovalRequested": "Wird gesendet, wenn eine Werkzeugfreigabe oder eine Stufenprüfung auf eine Person wartet.",
   "Test": "Wird nur von der Aktion Test senden verschickt, um den Endpunkt zu prüfen."
  },
  "notificationDeliveryStatus": {
   "Pending": "Wartet auf den nächsten Versuch; Fehlversuche werden mit wachsenden Abständen wiederholt.",
   "Delivering": "Ein Replikat der Steuerungsebene sendet sie gerade.",
   "Succeeded": "Der Endpunkt hat mit einem 2xx-Status geantwortet; die Benachrichtigung ist erledigt.",
   "Failed": "Garrison hat aufgegeben: Die Versuche sind aufgebraucht oder der Endpunkt antwortete mit einem Status, der nicht wiederholt wird."
  },
  "runKind": {
   "Invoke": "Von einem Aufrufer über REST, MCP, A2A oder das Dashboard gestartet.",
   "Delegated": "Von einem anderen Agenten über Garrison-Delegation gestartet.",
   "Test": "Ein Testlauf einer Bereitstellung aus Dashboard oder API.",
   "Retry": "Ein neuer Versuch eines früheren Laufs, den jemand wiederholt hat.",
   "Pipeline": "Eine Stufenausführung eines Pipeline-Laufs.",
   "Trigger": "Durch einen Cron-Zeitplan, einen signierten Webhook oder eine manuelle Auslösung gestartet."
  },
  "auditEventType": {
   "SigningSecretRotated": "Jemand hat das Signaturgeheimnis eines Auslösers oder Benachrichtigungsendpunkts ersetzt; das alte ist ungültig."
  }
 },
 "resources": {
  "runs": {
   "triggerId": "Der Auslöser, der diesen Lauf gestartet hat. Klicken öffnet seinen Auslöseverlauf.",
   "kind": "Wie der Lauf gestartet wurde: durch einen Aufrufer, einen anderen Agenten, als Test, Wiederholung, Pipeline-Stufe oder durch einen Auslöser.",
   "openTrigger": "Den Auslöseverlauf des Auslösers öffnen, der diesen Lauf gestartet hat."
  },
  "triggers": {
   "add": "Einen Cron-Zeitplan oder signierten Webhook anlegen, der einen Agenten oder eine Pipeline ohne Aufrufer startet.",
   "type": "Cron löst nach Zeitplan aus, Webhook bei einer signierten Anfrage eines anderen Systems. Später nicht änderbar.",
   "target": "Was jede Auslösung startet: einen Lauf eines Agenten oder einer Pipeline.",
   "schedule": "Der Cron-Ausdruck mit Zeitzone oder der Hinweis, dass der Auslöser auf Webhook-Zustellungen wartet.",
   "lastFire": "Wann der Auslöser zuletzt ausgelöst hat und ob dabei ein Lauf startete.",
   "nextFireUtc": "Wann ein aktiver Cron-Auslöser als Nächstes auslöst. Webhook- und inaktive Auslöser haben keinen Termin.",
   "fireCount": "Wie oft dieser Auslöser ausgelöst hat, einschließlich fehlgeschlagener und übersprungener Auslösungen.",
   "runAs": "Der Benutzer oder Zugang, als der die gestarteten Läufe handeln. Jede Auslösung prüft, ob er das Ziel noch ausführen darf.",
   "signingSecretLast4": "Die letzten vier Zeichen des Signaturgeheimnisses, damit Sie erkennen, welches ein Absender verwendet.",
   "targetType": "Ob jede Auslösung einen Agenten ausführt oder eine ganze Pipeline startet.",
   "agentId": "Der Agent, den jede Auslösung ausführt. Sie brauchen die Berechtigung, ihn auszuführen.",
   "deploymentId": "Läufe auf eine Bereitstellung des Agenten festlegen oder leer lassen, um nach Gewichtung zu wählen.",
   "pipelineId": "Die Pipeline, die jede Auslösung startet. Sie brauchen die Berechtigung, sie und ihre Stufenagenten auszuführen.",
   "inputTemplateId": "Die Prompt-Vorlage, die aus der Auslösung (Zeit, Nutzlast, Zustellungs-ID) die Laufeingabe macht.",
   "priority": "Warteschlangenpriorität der gestarteten Läufe, von -100 bis 100. Höhere werden zuerst vergeben.",
   "cronExpression": "Wann der Auslöser auslöst, als fünfteiliger Cron-Ausdruck oder Makro wie @hourly.",
   "timeZone": "Die IANA-Zeitzone, in der der Cron-Ausdruck gelesen wird, zum Beispiel Europe/Berlin.",
   "webhook": "Signierte POST-Anfragen hierher senden. Anfragen mit fehlender, veralteter oder falscher Signatur werden mit 401 abgelehnt.",
   "actions": {
    "fire": "Diesen Auslöser jetzt einmal auslösen, optional mit Testnutzlast, und den gestarteten Lauf sehen.",
    "fires": "Sehen, wann und warum dieser Auslöser ausgelöst hat und welchen Lauf jede Auslösung startete.",
    "runs": "Die Laufliste gefiltert auf die von diesem Auslöser gestarteten Läufe öffnen.",
    "rotateSecret": "Ein neues Webhook-Signaturgeheimnis erzeugen. Das alte ist sofort ungültig."
   },
   "fires": {
    "firedUtc": "Wann die Auslösung verarbeitet wurde. Cron-Auslösungen zeigen auch ihren Termin.",
    "source": "Warum ausgelöst wurde: Zeitplan, Webhook-Zustellung oder eine Person.",
    "outcome": "Ob die Auslösung einen Lauf startete, fehlschlug oder übersprungen wurde.",
    "started": "Der Lauf oder Pipeline-Lauf dieser Auslösung. Klicken öffnet ihn.",
    "deliveryId": "Der Header X-Garrison-Delivery der Webhook-Anfrage; Wiederholungen mit gleichem Wert lösen einmal aus.",
    "error": "Warum die Auslösung nichts gestartet hat, mit stabilem Fehlercode.",
    "runId": "Der Lauf dieser Auslösung. Klicken öffnet den Lauf.",
    "pipelineRunId": "Der Pipeline-Lauf dieser Auslösung. Klicken öffnet ihn."
   }
  },
  "notifications": {
   "add": "Eine URL registrieren, die einen signierten HTTP-POST erhält, wenn gewählte Ereignisse in diesem Mandanten eintreten.",
   "url": "Wohin Garrison Benachrichtigungen sendet. Private und Metadatenadressen werden abgelehnt, Weiterleitungen nicht verfolgt.",
   "events": "Die Ereignisse, die dieser Endpunkt erhält. Fahren Sie über den Wert, um alle zu sehen.",
   "filters": "Agenten- oder Bereitstellungsfilter, die einschränken, welche Lauf- und Freigabeereignisse gesendet werden.",
   "signingSecretLast4": "Die letzten vier Zeichen des Signaturgeheimnisses, damit Empfänger erkennen, welches Geheimnis signiert.",
   "includeResultText": "Ob Laufbenachrichtigungen den Ergebnistext enthalten, gekürzt auf die eingestellte Grenze.",
   "agentId": "Nur Ereignisse zu Läufen dieses Agenten senden. Pipeline-Ereignisse entfallen, solange ein Filter gesetzt ist.",
   "deploymentId": "Nur Ereignisse zu Läufen dieser Bereitstellung senden. Pipeline-Ereignisse entfallen, solange ein Filter gesetzt ist.",
   "resultTextMaxChars": "Längster Ergebnistext in einer Benachrichtigung, in Zeichen.",
   "actions": {
    "test": "Jetzt eine Testbenachrichtigung senden und zeigen, ob der Endpunkt sie angenommen hat.",
    "deliveries": "Alle an diesen Endpunkt gesendeten Benachrichtigungen mit Versuchen, HTTP-Status und Fehlern sehen.",
    "rotateSecret": "Ein neues Signaturgeheimnis erzeugen. Bereits eingereihte Wiederholungen werden damit signiert."
   },
   "deliveries": {
    "createdUtc": "Wann das Ereignis für diesen Endpunkt eingereiht wurde. Klicken zeigt die Details.",
    "event": "Welches Ereignis diese Benachrichtigung meldet.",
    "status": "Ob die Benachrichtigung wartet, gesendet wird, zugestellt oder aufgegeben ist.",
    "attempts": "Bisherige Versuche und die Höchstzahl an Versuchen.",
    "lastStatusCode": "HTTP-Status der letzten Antwort des Endpunkts; leer, wenn keine Antwort kam.",
    "lastError": "Was beim letzten Versuch schiefging, etwa eine Zeitüberschreitung oder ein abgelehntes Ziel.",
    "lastAttemptUtc": "Wann zuletzt versucht wurde, diese Benachrichtigung zu senden.",
    "nextAttemptUtc": "Wann die nächste Wiederholung fällig ist; leer, sobald die Zustellung beendet ist.",
    "deliveredUtc": "Wann der Endpunkt die Benachrichtigung angenommen hat.",
    "payload": "Der genaue JSON-Inhalt, der bei jedem Versuch gesendet wird. Er enthält nie Geheimnisse.",
    "id": "Zustellungskennung, auch als X-Garrison-Delivery gesendet, damit Empfänger Wiederholungen ignorieren können."
   }
  }
 },
 "views": {
  "runDetail": {
   "trigger": "Der Auslöser, der diesen Lauf gestartet hat, und wie der Lauf gestartet wurde.",
   "openTrigger": "Den Auslöseverlauf dieses Auslösers unter Agenten > Auslöser öffnen."
  },
  "pipelineRunDetail": {
   "trigger": "Der Auslöser, der diesen Pipeline-Lauf gestartet hat. Seine Stufenläufe tragen denselben Auslöser."
  },
  "settings": {
   "groups": {
    "Triggers": "Grenzen für Webhooks von Auslösern, das Nachholen von Cron-Terminen nach Ausfällen und die Aufbewahrung des Auslöseverlaufs.",
    "Notifications": "Zustellung ausgehender Benachrichtigungen: SSRF-Schutz, Wiederholungen, Zeitlimits und Aufbewahrung des Zustellprotokolls."
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Größter Inhalt einer Webhook-Anfrage in Bytes. Größere Zustellungen erhalten 413, bevor die Signatur geprüft wird.",
     "WebhookToleranceSeconds": "Größte Abweichung zwischen Signaturzeitstempel und Serveruhr. Ältere Zustellungen werden abgelehnt, sodass mitgeschnittene Anfragen nicht wiederholt werden können.",
     "CronMaxLatenessSeconds": "Verpasste Cron-Termine werden zu einer Auslösung zusammengefasst, außer der letzte ist älter als so viele Sekunden; dann wird er als Übersprungen erfasst. 0 löst immer einmal aus.",
     "FireRetentionDays": "Tage, die der Auslöseverlauf aufbewahrt wird."
    },
    "Notifications": {
     "AllowPrivateDestinations": "Benachrichtigungs-URLs in Loopback- und privaten Netzen erlauben. Standardmäßig aus, um Server-Side Request Forgery zu verhindern; Link-Local- und Metadatenadressen bleiben gesperrt.",
     "MaxAttempts": "Höchstzahl an Zustellversuchen je Benachrichtigung, bevor sie als aufgegeben gilt.",
     "InitialBackoffSeconds": "Wartezeit vor dem zweiten Versuch; jede weitere verdoppelt sich bis zur längsten Wartezeit.",
     "MaxBackoffSeconds": "Die längste Wartezeit zwischen zwei Versuchen einer Benachrichtigung.",
     "TimeoutSeconds": "Sekunden, die ein Zustellversuch samt Verbindungsaufbau dauern darf.",
     "DispatchIntervalMs": "Wie oft jedes Replikat der Steuerungsebene nach fälligen Benachrichtigungen sucht, in Millisekunden.",
     "SweepOverlapSeconds": "Sekunden bereits durchsuchter Historie, die der Leader bei jedem Durchlauf erneut liest, damit späte Ereignisse nicht verloren gehen.",
     "DeliveryRetentionDays": "Tage, die abgeschlossene Zustellungen im Protokoll bleiben."
    }
   }
  }
 },
 "signingSecret": {
  "done": "Dieses Fenster schließen. Das Geheimnis kann nicht erneut angezeigt werden, kopieren Sie es vorher.",
  "secret": "Das Signaturgeheimnis. Absender und Empfänger berechnen damit die HMAC-SHA256-Signatur.",
  "copy": "Das Signaturgeheimnis in die Zwischenablage kopieren, um es im anderen System zu hinterlegen.",
  "url": "Die URL, an die andere Systeme signierte Webhook-Zustellungen senden.",
  "copyUrl": "Die Webhook-URL in die Zwischenablage kopieren."
 },
 "triggerFire": {
  "submit": "Den Auslöser jetzt einmal mit dieser Nutzlast auslösen. Der Lauf startet als der ausführende Prinzipal des Auslösers.",
  "body": "Optionaler Nutzlasttext. Die Eingabevorlage sieht ihn als webhook.body und als webhook.json, wenn er JSON ist.",
  "contentType": "Medientyp der Nutzlast, etwa application/json. Leer für reinen Text.",
  "openRun": "Den Lauf öffnen, den diese Auslösung gestartet hat.",
  "openPipelineRun": "Den Pipeline-Lauf öffnen, den diese Auslösung gestartet hat."
 },
 "triggerFires": {
  "refresh": "Die neuesten Auslösungen dieses Auslösers erneut laden."
 },
 "notificationDeliveries": {
  "refresh": "Die neuesten Zustellungen dieses Endpunkts erneut laden.",
  "open": "Nutzlast, Versuche und letzten Fehler dieser Zustellung unter der Liste anzeigen.",
  "detail": "Alle Felder der gewählten Zustellung, einschließlich des gesendeten JSON-Inhalts."
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
  "title": "Auslöser",
  "p1": "Ein Auslöser startet einen Agentenlauf oder Pipeline-Lauf ohne Aufrufer: nach Cron-Zeitplan oder wenn ein anderes System einen mit seinem Geheimnis signierten Webhook sendet.",
  "p2": "Die Laufeingabe stammt aus einer Prompt-Vorlage, die Auslösezeit und Webhook-Nutzlast verwenden kann. Läufe handeln als der Benutzer oder Zugang, der den Auslöser zuletzt gespeichert hat, und jede Auslösung prüft, ob dieser das Ziel noch ausführen darf.",
  "p3": "Konnte eine Weile kein Replikat einen Zeitplan auslösen, werden die verpassten Termine zu einer Auslösung. Webhook-Zustellungen mit wiederholtem X-Garrison-Delivery-Wert lösen einmal aus."
 },
 "notifications": {
  "title": "Benachrichtigungen",
  "p1": "Ein Benachrichtigungsendpunkt erhält einen signierten JSON-POST, wenn ein abonniertes Ereignis eintritt: ein Lauf oder eine Pipeline endet oder eine Freigabe wartet auf eine Person.",
  "p2": "Zustellungen werden dauerhaft eingereiht und mit wachsenden Abständen wiederholt. Jeder Versuch trägt dieselbe Zustellungs-ID, damit Empfänger Wiederholungen ignorieren können.",
  "p3": "Benachrichtigungen enthalten nie Geheimnisse oder Laufeingaben und Laufausgaben nur, wenn Sie es erlauben. Private Netzadressen werden abgelehnt, solange ein Betreiber sie nicht erlaubt."
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
   "menu": "Diesen Verlauf als Datei herunterladen: Eingabe, Assistententext, Werkzeugaufrufe, Freigaben, Fehler, Verbrauch und Kosten, mit geschwärzten Geheimnissen.",
   "markdown": "Einen lesbaren Markdown-Verlauf herunterladen, geeignet zum Teilen oder Anhängen an ein Ticket.",
   "json": "Den Verlauf als typisiertes JSON-Dokument (garrison.transcript/v1) für Skripte und andere Werkzeuge herunterladen.",
   "includeThinking": "Auch die Denkschritte des Modells einbeziehen. Sie fehlen standardmäßig, weil sie lang und intern sind."
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "Dieser Agent hat ein Eingabeschema, daher ist seine Eingabe ein JSON-Dokument. Füllen Sie das Formular aus oder wechseln Sie zu rohem JSON.",
    "modeForm": "Die Eingabe mit einem Formular bearbeiten, das aus dem Eingabeschema des Agenten erzeugt wird.",
    "modeJson": "Die Eingabe als rohen JSON-Text bearbeiten. Die Werte bleiben erhalten, wenn Sie zum Formular zurückwechseln.",
    "field": "Wert für {{name}}, wie im Eingabeschema des Agenten beschrieben.",
    "fieldWithDescription": "{{name}}: {{description}}",
    "addItem": "Dieser Liste einen weiteren Eintrag hinzufügen.",
    "removeItem": "Diesen Eintrag aus der Liste entfernen.",
    "jsonLabel": "Das JSON-Dokument, das als Eingabe des Laufs gesendet wird. Es muss dem Eingabeschema des Agenten entsprechen."
   }
  },
  "manifests": {
   "bundle": {
    "scopeAll": "Jede Ressource dieses Mandanten exportieren. Integrierte Ressourcen fehlen, außer Sie beziehen sie ein.",
    "scopeSelected": "Nur die gewählten Arten und Ressourcen exportieren, wahlweise mit allem, wovon sie abhängen.",
    "kinds": "Jede Ressource der markierten Arten exportieren.",
    "kind": "Jede Ressource der Art {{kind}} in diesem Mandanten exportieren.",
    "resources": "Einzelne zu exportierende Ressourcen im Format Kind/Name, zum Beispiel Agent/triage oder Pipeline/release.",
    "followReferences": "Auch exportieren, wovon die Auswahl abhängt: Bereitstellungen, Harness-Profile, Prompt-Vorlagen, Arbeitsbereiche, MCP-Server, Auslöser und Benachrichtigungsendpunkte. Geheimnisse werden als Voraussetzung aufgeführt, nie exportiert.",
    "includeBuiltIn": "Die integrierten Prompt-Vorlagen und Harness-Profile hinzufügen, auf die das Paket verweist. Beim Anwenden bleiben sie unverändert; es wird nur geprüft, dass sie existieren."
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
   "Draft": "Eine unveröffentlichte Revision. Pro Agent ist nur ein Entwurf offen; keine Bereitstellung führt ihn aus, bevor er veröffentlicht ist.",
   "Published": "Eine eingefrorene Revision. Bereitstellungen, die der neuesten Revision folgen oder diese fixieren, führen sie aus."
  },
  "promotionKind": {
   "Promote": "Hat die Bereitstellungen einer Umgebung auf eine Revision aus der vorherigen Umgebung fixiert.",
   "Rollback": "Hat die von einer Hochstufung ersetzten Revisionsfixierungen genau wie zuvor wiederhergestellt."
  },
  "promotionOutcome": {
   "Applied": "Die von diesem Eintrag gesetzten Fixierungen sind noch aktiv.",
   "RolledBack": "Eine spätere Zurücksetzung hat die von dieser Hochstufung ersetzten Fixierungen wiederhergestellt."
  },
  "revisionChangeType": {
   "Changed": "Das Feld hat in der neueren Revision einen anderen Wert.",
   "Added": "Das Feld oder der Listeneintrag existiert nur in der neueren Revision.",
   "Removed": "Das Feld oder der Listeneintrag existiert nur in der älteren Revision."
  }
 },
 "filters": {
  "environment": "Nur Bereitstellungen einer Umgebung anzeigen, etwa dev, staging oder prod. Gilt für die geladene Seite."
 },
 "resources": {
  "deployments": {
   "environment": "Die Umgebung, zu der diese Bereitstellung gehört. Hochstufungen bewegen eine Revision in der Reihenfolge des Mandanten von einer Umgebung zur nächsten.",
   "agentRevisionId": "Die Agentenrevision, die diese Bereitstellung ausführt. Neueste folgt jeder neu veröffentlichten Revision; eine fixierte Revision bleibt, bis sie geändert oder hochgestuft wird.",
   "environmentBadge": "Diese Bereitstellung läuft in der Umgebung {{environment}}.",
   "followsLatest": "Nicht fixiert: Diese Bereitstellung führt die neueste veröffentlichte Revision des Agenten aus.",
   "pinnedRevision": "Fixiert: Diese Bereitstellung führt {{revision}} aus, bis sich die Fixierung ändert.",
   "actions": {
    "promote": "Die Revision des Agenten von einer Umgebung in die nächste hochstufen und die Fixierungen aller dortigen Bereitstellungen aktualisieren.",
    "promotions": "Frühere Hochstufungen und Zurücksetzungen ansehen und eine Hochstufung zurücksetzen, um die vorherigen Fixierungen wiederherzustellen."
   }
  }
 },
 "views": {
  "agentDetail": {
   "reviewDraft": "Den Reiter Revisionen öffnen, um den Entwurf mit der neuesten veröffentlichten Revision zu vergleichen und ihn zu veröffentlichen oder zu verwerfen.",
   "tabs": {
    "revisions": "Jede gespeicherte Revision dieses Agenten: zwei beliebige vergleichen, den Entwurf veröffentlichen oder verwerfen."
   },
   "columns": {
    "environment": "Die Umgebung, zu der die Bereitstellung gehört; wird von Hochstufungen verwendet.",
    "revision": "Die Revision, die die Bereitstellung ausführt: Neueste folgt jeder Veröffentlichung, eine Nummer ist eine Fixierung."
   }
  }
 },
 "revisions": {
  "columns": {
   "number": "Revisionsnummer. Die Nummern steigen mit jeder gespeicherten Revision dieses Agenten.",
   "state": "Entwürfe können sich noch ändern; veröffentlichte Revisionen sind eingefroren.",
   "author": "Wer diese Revision gespeichert hat: der Benutzer oder Zugangsschlüssel, der sie angelegt oder zuletzt ersetzt hat.",
   "changeNote": "Was sich geändert hat und warum, wie beim Veröffentlichen notiert.",
   "publishedUtc": "Wann die Revision veröffentlicht wurde. Leer beim Entwurf.",
   "actions": "Eine Revision vergleichen, veröffentlichen oder verwerfen."
  },
  "latest": "Die neueste veröffentlichte Revision. Bereitstellungen ohne Fixierung führen diese aus.",
  "compare": "Zeigen, was sich zwischen dieser Revision und der veröffentlichten Revision davor geändert hat.",
  "publish": "Diesen Entwurf veröffentlichen, damit er die neueste veröffentlichte Revision wird.",
  "discard": "Diesen Entwurf löschen. Veröffentlichte Revisionen sind nicht betroffen.",
  "discardConfirm": "Den Entwurf endgültig löschen. Das lässt sich nicht rückgängig machen.",
  "from": "Die ältere Seite des Vergleichs: Werte werden als Vorher gezeigt.",
  "to": "Die neuere Seite des Vergleichs: Werte werden als Nachher gezeigt.",
  "publishSubmit": "Den Entwurf jetzt veröffentlichen. Bereitstellungen, die der neuesten Revision folgen, führen ihn ab dem nächsten Lauf aus.",
  "changeNote": "Optionale Notiz, die mit der veröffentlichten Revision gespeichert und in der Revisionsliste gezeigt wird. Bis zu 2000 Zeichen.",
  "diffColumns": {
   "field": "Das abweichende Revisionsfeld, etwa description oder promptPins.",
   "change": "Ob das Feld geändert, hinzugefügt oder entfernt wurde.",
   "before": "Der Wert in der älteren Revision.",
   "after": "Der Wert in der neueren Revision."
  }
 },
 "promote": {
  "agent": "Der Agent, dessen Revision hochgestuft wird. Seine Bereitstellungen in der Zielumgebung werden aktualisiert.",
  "revision": "Auf der Quellrevision lassen, um das hochzustufen, was die Quellumgebung ausführt, oder eine veröffentlichte Revision wählen.",
  "source": "Die Umgebung, aus der die Revision stammt.",
  "target": "Die zu aktualisierende Umgebung. Standard ist die Umgebung nach der Quelle in der Reihenfolge des Mandanten.",
  "allowSkip": "Erforderlich, wenn das Ziel nicht die nächste Umgebung ist. Übersprungene Umgebungen werden mit der Hochstufung protokolliert.",
  "note": "Optionale Notiz, die mit dem Hochstufungseintrag gespeichert wird. Bis zu 2000 Zeichen.",
  "submit": "Die Hochstufung jetzt anwenden. Jede Bereitstellung des Agenten in der Zielumgebung erhält die neue Fixierung."
 },
 "promotions": {
  "agentFilter": "Nur Hochstufungen und Zurücksetzungen eines Agenten anzeigen.",
  "refresh": "Den Hochstufungsverlauf neu vom Server laden.",
  "columns": {
   "createdUtc": "Wann die Hochstufung oder Zurücksetzung angewendet wurde.",
   "kind": "Hochstufung oder Zurücksetzung einer früheren Hochstufung.",
   "outcome": "Ob die Fixierungen noch gelten oder später zurückgesetzt wurden.",
   "agent": "Der Agent, dessen Bereitstellungen aktualisiert wurden.",
   "revision": "Die Revision, die hochgestuft wurde.",
   "environments": "Quell- und Zielumgebung der Hochstufung.",
   "deployments": "Jede aktualisierte Bereitstellung mit ihrer Fixierung vorher und nachher.",
   "actor": "Wer die Hochstufung oder Zurücksetzung angewendet hat.",
   "note": "Die beim Anlegen des Eintrags angegebene Notiz.",
   "actions": "Eine angewendete Hochstufung zurücksetzen."
  },
  "skipped": "Diese Hochstufung hat mindestens eine Umgebung übersprungen, was Umgebungen überspringen erforderte.",
  "rollback": "Die Revisionsfixierungen wiederherstellen, die diese Bereitstellungen vor dieser Hochstufung hatten.",
  "rollbackConfirm": "Die Zurücksetzung jetzt anwenden. Sie wird im Hochstufungsverlauf protokolliert.",
  "rollbackNote": "Optionale Notiz, die mit dem Zurücksetzungseintrag gespeichert wird. Bis zu 2000 Zeichen."
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
   "SystemPrompt": "Der Systemprompt des Agents, geliefert von einer Prompt-Vorlage. Er hat keine hochgeladenen Dateien.",
   "Skill": "Ein Fähigkeitsordner, den der Harness lädt, abgelegt dort, wo das Harness-Profil Fähigkeiten erwartet.",
   "ReferenceFile": "Eine Datei, die der Agent während einer Ausführung lesen kann, abgelegt im Arbeitsbereich der Ausführung.",
   "DocumentTemplate": "Eine Dokumentvorlage, etwa eine .docx- oder .dotx-Datei, die der Agent während einer Ausführung ausfüllt."
  },
  "runOutcome": {
   "AssetIntegrityFailed": "Eine Ressourcendatei hat die SHA-256-Prüfung nicht bestanden oder konnte vor dem Start nicht heruntergeladen werden, daher wurde der Harness nie gestartet."
  }
 },
 "resources": {
  "agentAssets": {
   "add": "Erstellen Sie eine neue Ressource. Laden Sie danach ihre Dateien als Version hoch und fixieren Sie sie in einer Agent-Revision.",
   "name": "Eindeutiger Name der Ressource in diesem Mandanten. Revisionen und Manifeste können über diesen Namen auf die Ressource verweisen.",
   "kind": "Systemprompt, Fähigkeit, Referenzdatei oder Dokumentvorlage. Nach dem Erstellen der Ressource unveränderlich.",
   "currentVersion": "Die neueste Version. Fixierungen, die der aktuellen Version folgen, verwenden sie ab der nächsten Ausführung.",
   "description": "Was die Ressource enthält und welche Agents sie verwenden, in einfachen Worten.",
   "tags": "Schlagwörter zum Finden und Gruppieren von Ressourcen. Sie haben keine Wirkung auf Ausführungen.",
   "artifactStoreId": "Wo die Dateien der Ressource gespeichert werden. Garrison-Datenbank bedeutet, dass sie in der Datenbank der Steuerungsebene liegen.",
   "promptTemplateId": "Die Prompt-Vorlage, die den Text einer Systemprompt-Ressource liefert. Nur für Systemprompts erforderlich.",
   "databaseStore": "Die Dateien werden in der Garrison-Datenbank gespeichert, nicht in einem externen Artefaktspeicher.",
   "kindFilter": "Nur Ressourcen einer Art anzeigen: Systemprompts, Fähigkeiten, Referenzdateien oder Dokumentvorlagen.",
   "actions": {
    "versions": "Öffnen Sie den Versionsverlauf: Dateien durchsuchen, Textdateien in der Vorschau ansehen, herunterladen und eine neue Version hochladen."
   }
  }
 },
 "revisions": {
  "columns": {
   "assetPins": "Ressourcen, die diese Revision fixiert, jeweils auf eine feste Version oder der aktuellen Version der Ressource folgend."
  }
 },
 "assets": {
  "files": "Wählen Sie eine oder mehrere Dateien von Ihrem Computer. Sie werden im Browser gelesen und zusammen als eine Version hochgeladen.",
  "path": "Wo die Datei innerhalb der Ressource liegt, als relativer Pfad mit Schrägstrichen, zum Beispiel docs/guide.md.",
  "uploadColumns": {
   "path": "Der Pfad jeder Datei innerhalb der Ressource. Bearbeiten Sie ihn bei Bedarf vor dem Hochladen.",
   "mediaType": "Der vom Browser gemeldete Medientyp. Ist er leer, ermittelt der Server ihn aus der Dateiendung.",
   "size": "Größe der Datei, wie sie von Ihrem Computer gelesen wurde.",
   "actions": "Nehmen Sie eine Datei vor dem Senden aus diesem Upload heraus."
  },
  "removeFile": "Nehmen Sie diese Datei aus dem Upload heraus. Erst beim Hochladen wird etwas gesendet.",
  "changeNote": "Optionale Notiz, die mit der neuen Version gespeichert und im Versionsverlauf angezeigt wird. Bis zu 2000 Zeichen.",
  "upload": "Laden Sie die gewählten Dateien als eine neue Version hoch. Bei identischen Dateien wird stattdessen die aktuelle Version zurückgegeben.",
  "current": "Dies ist die aktuelle Version der Ressource, die von Fixierungen verwendet wird, die der aktuellen Version folgen.",
  "showFiles": "Zeigen Sie die Dateien dieser Version mit Größen, Prüfsummen, Vorschauen und Downloads an.",
  "versionColumns": {
   "number": "Versionsnummer. Jeder Upload mit anderen Dateien erhält die nächste Nummer.",
   "author": "Wer diese Version hochgeladen hat.",
   "changeNote": "Die beim Hochladen dieser Version angegebene Notiz.",
   "totalBytes": "Gesamtgröße aller Dateien in dieser Version.",
   "createdUtc": "Wann diese Version hochgeladen wurde.",
   "actions": "Zeigen Sie die Dateien einer Version an."
  },
  "fileColumns": {
   "path": "Pfad der Datei innerhalb der Ressource; dort wird sie für eine Ausführung abgelegt.",
   "mediaType": "Mit der Datei gespeicherter Medientyp.",
   "sizeBytes": "Größe der Datei in dieser Version.",
   "sha256": "Anfang der SHA-256-Prüfsumme der Datei. Worker prüfen sie vor dem Start einer Ausführung.",
   "actions": "Zeigen Sie Textdateien direkt in der Vorschau an oder laden Sie beliebige Dateien herunter."
  },
  "sha256Full": "Vollständige SHA-256-Prüfsumme dieser Datei: {{sha}}",
  "preview": "Zeigen Sie diese Textdatei schreibgeschützt unter der Dateiliste an. Hier kann nichts bearbeitet werden.",
  "download": "Laden Sie diese Datei dieser Version auf Ihren Computer herunter.",
  "pinsSave": "Speichern Sie diese Ressourcen-Fixierungen im Entwurf. Veröffentlichen Sie den Entwurf danach, damit Bereitstellungen sie verwenden.",
  "pinAsset": "Die Ressource, die in dieser Revision fixiert werden soll. Jede Ressource kann einmal fixiert werden.",
  "pinVersion": "Fixieren Sie eine feste Version oder wählen Sie Aktuelle Version, um zur Laufzeit die neueste Version der Ressource zu verwenden.",
  "removePin": "Entfernen Sie diese Ressource aus den Fixierungen der Revision.",
  "addPin": "Fügen Sie den Fixierungen der Revision eine weitere Ressource hinzu.",
  "editPins": "Fügen Sie Ressourcen-Fixierungen dieses Revisionsentwurfs hinzu, entfernen oder ändern Sie sie.",
  "pinsNewDraft": "Legen Sie einen neuen Entwurf aus der zuletzt veröffentlichten Revision an und wählen Sie seine Ressourcen-Fixierungen.",
  "pinnedVersion": "Diese Ressource ist auf eine feste Version fixiert, daher verwenden Ausführungen sie auch nach neuen Uploads weiter.",
  "pinnedCurrent": "Diese Ressource folgt ihrer aktuellen Version, daher verwenden Ausführungen den neuesten Upload."
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
    "turns": "Die Runden dieser Konversation, die älteste zuerst, und das Feld zum Senden der nächsten.",
    "files": "Der gemeinsame Ordner, den jede Runde und jeder delegierte Agent dieser Konversation liest und schreibt, mit Versionsverlauf und Downloads."
   }
  },
  "runDetail": {
   "fileSpace": "Der gemeinsame Dateibereich, den dieser Lauf beim Start in sein Arbeitsverzeichnis kopiert und am Ende zurückschreibt. Alle Läufe einer Konversation, eines Pipeline-Laufs oder eines Delegationsbaums teilen ihn.",
   "openFiles": "Den Tab Dateien der Konversation dieses Laufs öffnen, um die gemeinsamen Dateien anzusehen, herunterzuladen oder hochzuladen."
  }
 },
 "resources": {
  "deployments": {
   "fileSpaceMountPath": "Ordner im Arbeitsverzeichnis des Laufs, in den der gemeinsame Dateibereich synchronisiert wird, zum Beispiel files. Relativ, mit Schrägstrichen, höchstens 128 Zeichen."
  }
 },
 "files": {
  "summary": "Wie viele aktuelle Dateien der gemeinsame Ordner enthält und ihre Gesamtgröße. Gelöschte Dateien zählen nicht.",
  "live": "Die Liste aktualisiert sich, sobald eine Runde, ein delegierter Agent oder eine Person eine Datei ändert.",
  "polling": "Die Live-Verbindung ist nicht verfügbar, daher wird die Liste alle {{seconds}} Sekunden neu geladen, solange dieser Tab offen ist.",
  "includeDeleted": "Auch gelöschte Dateien auflisten. Ihre Versionen bleiben erhalten und können weiter heruntergeladen werden.",
  "refresh": "Die Dateiliste jetzt erneut vom Server laden.",
  "columns": {
   "path": "Pfad der Datei im gemeinsamen Ordner. Läufe finden sie im Ordner für den Dateibereich des Deployments.",
   "currentVersion": "Die neueste Version. Jeder Schreibvorgang durch eine Runde, einen Agenten oder einen Upload fügt eine hinzu.",
   "sizeBytes": "Größe der aktuellen Version der Datei.",
   "mediaType": "Mit der aktuellen Version gespeicherter Medientyp.",
   "lastUpdateUtc": "Wann sich die Datei zuletzt geändert hat.",
   "actions": "Versionsverlauf anzeigen, die aktuelle Version herunterladen oder die Datei löschen."
  },
  "deleted": "Diese Datei wurde gelöscht. Spätere Runden sehen sie nicht mehr, ihre Versionen bleiben aber erhalten.",
  "versions": "Den Versionsverlauf dieser Datei öffnen, mit Download und Textvorschau für jede Version.",
  "download": "Die aktuelle Version dieser Datei über einen kurzlebigen Link herunterladen.",
  "delete": "Diese Datei aus dem gemeinsamen Ordner löschen. Ihre Versionen bleiben erhalten.",
  "confirmDelete": "Die Datei jetzt löschen. Spätere Runden sehen sie nicht mehr.",
  "versionColumns": {
   "number": "Versionsnummer. Jeder Schreibvorgang fügt die nächste Nummer hinzu.",
   "sizeBytes": "Größe der Datei in dieser Version.",
   "mediaType": "Mit dieser Version gespeicherter Medientyp.",
   "sha256": "Anfang der SHA-256-Prüfsumme dieser Version. Worker prüfen sie beim Synchronisieren der Datei.",
   "writtenBy": "Der Agent, dessen Lauf diese Version geschrieben hat, oder die Person, die sie hochgeladen hat.",
   "createdUtc": "Wann diese Version geschrieben wurde.",
   "actions": "Textversionen direkt in der Vorschau ansehen oder jede Version herunterladen."
  },
  "current": "Diese Version sehen spätere Runden.",
  "sha256Full": "Vollständige SHA-256-Prüfsumme dieser Version: {{sha}}",
  "openRun": "Den Lauf öffnen, der diese Version geschrieben hat.",
  "preview": "Diese Version schreibgeschützt unter der Liste anzeigen. Hier lässt sich nichts bearbeiten.",
  "downloadVersion": "Diese Version der Datei auf Ihren Computer herunterladen.",
  "chooseFiles": "Eine oder mehrere Dateien von Ihrem Computer wählen. Sie werden im Browser gelesen und nacheinander hochgeladen.",
  "uploadColumns": {
   "path": "Wohin jede Datei im gemeinsamen Ordner kommt. Bei Bedarf vor dem Hochladen anpassen.",
   "replaces": "Die aufgeführte Version, die dieser Upload ersetzt, oder Neue Datei. Eine inzwischen geänderte Datei wird unter einem Konfliktnamen abgelegt.",
   "size": "Größe der Datei, wie sie von Ihrem Computer gelesen wurde.",
   "actions": "Eine Datei vor dem Senden aus diesem Upload nehmen."
  },
  "path": "Pfad im gemeinsamen Ordner, relativ mit Schrägstrichen, zum Beispiel notes/sources.md.",
  "removeFile": "Diese Datei aus dem Upload nehmen. Gesendet wird erst beim Hochladen.",
  "upload": "Jede gewählte Datei nacheinander in den gemeinsamen Ordner senden, zusammen mit der Version, die sie ersetzt."
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
   "capabilities": "Der Fähigkeitenkatalog: Agents, MCP-Tools und integrierte Harness-Tools mit Quellen, Hinweisen zu Kosten und Latenz sowie einer Aktualisierung."
  }
 },
 "filters": {
  "tag": "Nur Fähigkeiten mit genau diesem Schlagwort anzeigen. Die Liste aktualisiert sich, sobald Sie aufhören zu tippen.",
  "origin": "Nur abgeleitete Einträge anzeigen, die ihrer Quelle folgen, oder nur manuelle Einträge, die Personen geschrieben haben."
 },
 "enums": {
  "capabilityKind": {
   "Agent": "Ein anderer Garrison-Agent, beschrieben anhand seiner neuesten veröffentlichten Revision. Ein orchestrierender Agent kann an ihn delegieren.",
   "McpTool": "Ein Tool eines in diesem Mandanten registrierten MCP-Servers, beschrieben anhand der Tool-Liste des Servers.",
   "HarnessBuiltIn": "Ein Programm, das die Harness auf ihrem Worker-Host ausführen kann, etwa pandoc oder LibreOffice. Gefunden wird es über eine Tool-Prüfung in einem Harness-Profil."
  },
  "capabilityOrigin": {
   "Derived": "Garrison hält diesen Eintrag mit seiner Quelle synchron. Er kann hier weder bearbeitet noch gelöscht werden; ändern Sie stattdessen die Quelle.",
   "Manual": "Eine Person hat diesen Eintrag geschrieben. Er kann hier bearbeitet und gelöscht werden."
  },
  "capabilityHintStatus": {
   "Unknown": "Im Hinweiszeitfenster sind zu wenige Läufe abgeschlossen, um etwas auszusagen, daher werden keine Werte angezeigt. MCP-Tools und integrierte Tools haben immer unbekannte Hinweise.",
   "Known": "Im Hinweiszeitfenster sind genug Läufe abgeschlossen, daher beruhen die Werte für Dauer und Kosten auf echten Läufen."
  },
  "runBlockedReason": {
   "NoToolWorker": "Blockiert: Der Agent dieses Laufs nutzt ein integriertes Harness-Tool wie pandoc, und kein bereiter Worker, der ihn ausführen kann, meldet das Tool. Der Lauf wartet in der Warteschlange, bis sich ein solcher Worker registriert."
  }
 },
 "resources": {
  "capabilities": {
   "add": "Einen manuellen Eintrag für etwas schreiben, das Garrison nicht ableiten kann, zum Beispiel einen Konvertierungsdienst, den Agents über eine Skill-Ressource erreichen.",
   "name": "Name, unter dem Agents die Fähigkeit finden. Agent-Einträge heißen wie der Agent, MCP-Tools server/tool, integrierte Tools wie das Tool.",
   "kind": "Agent, MCP-Tool oder integriertes Harness-Tool. Manuelle Einträge dürfen jede Art verwenden.",
   "origin": "Abgeleitete Einträge folgen ihrer Quelle und können hier nicht geändert werden; manuelle Einträge stammen von Personen.",
   "summary": "Was die Fähigkeit tut und wann man sie nutzt, so wie Agents es lesen. Bis zu 4000 Zeichen.",
   "source": "Woher der Eintrag stammt: vom Agent, vom MCP-Server und Tool oder vom Harness-Profil samt dem Knotenlabel, das ein Lauf benötigt.",
   "hints": "Median und 90. Perzentil der Laufdauer sowie mittlere Kosten aus kürzlich abgeschlossenen Läufen, oder Unbekannt, wenn zu wenige Läufe abgeschlossen sind.",
   "tags": "Schlagwörter zum Filtern des Katalogs. Auch Agents können nach Schlagwort filtern.",
   "lastRefreshedUtc": "Wann Garrison einen abgeleiteten Eintrag zuletzt aus seiner Quelle aktualisiert hat. Bei manuellen Einträgen leer.",
   "sourceAgentId": "Optional. Der Garrison-Agent, für den dieser manuelle Eintrag steht.",
   "sourceMcpServerId": "Optional. Der MCP-Server, für dessen Tool dieser manuelle Eintrag steht.",
   "sourceToolName": "Der Name des Tools auf dem gewählten MCP-Server.",
   "requirements": "Knotenlabels wie garrison.io/tool-pandoc=true, die ein Worker melden muss, bevor er einen Lauf mit dieser Fähigkeit übernimmt.",
   "inputSchemaJson": "JSON Schema dessen, was die Fähigkeit annimmt. Garrison prüft beim Speichern, ob es ein gültiges JSON Schema ist.",
   "outputSchemaJson": "JSON Schema dessen, was die Fähigkeit zurückgibt. Garrison prüft beim Speichern, ob es ein gültiges JSON Schema ist.",
   "kindFilter": "Nur Agents, nur MCP-Tools oder nur integrierte Harness-Tools anzeigen. Wählen Sie Alle, um den ganzen Katalog zu sehen.",
   "originFilter": "Nur abgeleitete Einträge anzeigen, die ihrer Quelle folgen, oder nur manuelle Einträge, die Personen geschrieben haben.",
   "tagFilter": "Nur Fähigkeiten mit genau diesem Schlagwort anzeigen. Die Liste aktualisiert sich, sobald Sie aufhören zu tippen.",
   "refresh": "Abgeleitete Einträge jetzt aktualisieren: Agents, integrierte Harness-Tools, Tools der MCP-Server und Agent-Hinweise. Zeigt, was sich geändert hat und welche Server fehlgeschlagen sind.",
   "warnings": "Einträge, deren Quelle nicht aktualisiert werden konnte, behalten ihren letzten gültigen Inhalt und nennen den Grund in ihren Details.",
   "warningBadge": "Die letzte Aktualisierung der Quelle dieses Eintrags ist fehlgeschlagen, daher zeigt er seinen letzten gültigen Inhalt. Grund: {{warning}}"
  },
  "harnessProfiles": {
   "toolProbes": "Tools, die diese Harness nutzen kann, wenn der Worker-Host sie hat, etwa pandoc. Jedes wird im Fähigkeitenkatalog zu einem integrierten Harness-Tool.",
   "toolProbesItems": {
    "name": "Tool-Name im Katalog und im Knotenlabel garrison.io/tool-{name}: Kleinbuchstaben, Ziffern, Punkte und Bindestriche.",
    "executable": "Reiner Dateiname, den der Worker im PATH sucht, zum Beispiel soffice. Ein Ordner ist nicht erlaubt.",
    "argument": "Das eine Argument, das die Prüfung übergibt, etwa --version. Erlaubt sind nur Versions- und Hilfe-Flags oder gar keins.",
    "description": "Was das Tool tut, angezeigt im Fähigkeitenkatalog. Bis zu 1024 Zeichen."
   }
  }
 },
 "revisions": {
  "columns": {
   "capabilities": "Die Fähigkeiten, die diese Revision nutzt, nach Name. Integrierte Harness-Tools darunter beschränken ihre Läufe auf Worker, die das Tool melden."
  }
 },
 "capabilities": {
  "sourceAgent": "Agent {{name}} öffnen, den dieser Eintrag anhand seiner neuesten veröffentlichten Revision beschreibt.",
  "sourceMcpServer": "MCP-Server {{name}} im Tab MCP-Server öffnen. Seine Tool-Liste ist die Quelle dieses Eintrags.",
  "sourceTool": "Der Name des Tools auf dem MCP-Server: {{tool}}.",
  "sourceProfile": "Harness-Profil {{name}} öffnen, dessen Tool-Prüfung die Quelle dieses Eintrags ist.",
  "nodeLabel": "Ein Lauf mit dieser Fähigkeit geht nur an einen Worker, der das Knotenlabel {{label}} meldet.",
  "noSource": "Ein manueller Eintrag, der keinen Agent und keinen MCP-Server nennt. Jeder Lauf, der den Katalog lesen darf, sieht ihn.",
  "hintsUnknown": "Im Hinweiszeitfenster sind zu wenige Läufe abgeschlossen, um etwas auszusagen, daher werden keine Werte angezeigt. Das bedeutet nie null.",
  "hintsKnown_one": "Ausgewertet aus {{count}} abgeschlossenen Lauf der letzten {{days}} Tage.",
  "hintsKnown_other": "Ausgewertet aus {{count}} abgeschlossenen Läufen der letzten {{days}} Tage.",
  "refreshWarning": "Garrison konnte diesen Eintrag nicht aus seiner Quelle aktualisieren, daher behält er seinen letzten gültigen Inhalt, bis die nächste Aktualisierung gelingt.",
  "lockedBanner": "Warum dieser Eintrag hier nicht bearbeitet oder gelöscht werden kann und wo Sie ihn stattdessen ändern.",
  "lockedShared": "Gilt für alle Mandanten: Dieser Eintrag stammt aus einer Tool-Prüfung in einem integrierten Harness-Profil und kann daher weder bearbeitet noch gelöscht werden. Klonen Sie das Profil, um seine Prüfungen zu ändern.",
  "locked": {
   "Agent": "Abgeleitet von der neuesten veröffentlichten Revision des Agents, daher hier weder bearbeitbar noch löschbar. Veröffentlichen Sie eine neue Revision, um ihn zu ändern; wird der Agent deaktiviert, verschwindet der Eintrag.",
   "McpTool": "Abgeleitet von der Tool-Liste des MCP-Servers, daher hier weder bearbeitbar noch löschbar. Ändern Sie den Server oder seine Tools und aktualisieren Sie dann.",
   "HarnessBuiltIn": "Abgeleitet von einer Tool-Prüfung in einem Harness-Profil, daher hier weder bearbeitbar noch löschbar. Ändern Sie stattdessen die Tool-Prüfungen des Profils."
  },
  "shared": "Alle Mandanten sehen diesen Eintrag. Er stammt aus einer Tool-Prüfung in einem integrierten Harness-Profil.",
  "hintsTitle": "Dauer und Kosten der kürzlich abgeschlossenen Läufe dieses Agents. MCP-Tools und integrierte Tools haben keine Hinweise.",
  "requirementsTitle": "Knotenlabels, die ein Worker melden muss, bevor er einen Lauf übernimmt, dessen Agent diese Fähigkeit nutzt.",
  "fields": {
   "kind": "Agent, MCP-Tool oder integriertes Harness-Tool.",
   "origin": "Abgeleitete Einträge folgen ihrer Quelle; manuelle Einträge stammen von Personen.",
   "source": "Der Agent, der MCP-Server samt Tool oder das Harness-Profil, aus dem dieser Eintrag stammt.",
   "lastRefreshedUtc": "Wann Garrison diesen Eintrag zuletzt aus seiner Quelle aktualisiert hat. Bei manuellen Einträgen leer.",
   "tags": "Schlagwörter zum Filtern des Katalogs.",
   "id": "Kennung des Katalogeintrags, beginnend mit cap_.",
   "summary": "Was die Fähigkeit tut und wann man sie nutzt, so wie Agents es lesen.",
   "hintStatus": "Bekannt, wenn im Zeitfenster genug Läufe abgeschlossen sind; sonst Unbekannt, und dann wird kein Wert angezeigt.",
   "sampleSize": "Wie viele abgeschlossene Läufe die Hinweise auswerten, die neuesten zuerst.",
   "medianDurationMs": "Mediane Zeit vom Start bis zum Abschluss der ausgewerteten Läufe.",
   "p90DurationMs": "Neun von zehn der ausgewerteten Läufe waren innerhalb dieser Zeit fertig.",
   "meanCostUsd": "Mittlere Kosten in US-Dollar der ausgewerteten Läufe, die Kosten erfasst haben.",
   "windowDays": "Wie viele Tage die Hinweise zurückblicken (Einstellung Capabilities.HintWindowDays).",
   "computedUtc": "Wann die Hinweise zuletzt von der Wartungsschleife oder einer Aktualisierung berechnet wurden.",
   "inputSchemaJson": "JSON Schema dessen, was die Fähigkeit annimmt, oder keins bei freiem Text.",
   "outputSchemaJson": "JSON Schema dessen, was die Fähigkeit zurückgibt, oder keins."
  },
  "refreshServer": "Die Tools aller aktiven MCP-Server auflisten oder nur die eines Servers. stdio-Server werden über einen Worker aufgelistet.",
  "refreshRun": "Die Aktualisierung jetzt starten. Das kann dauern, wenn MCP-Server langsam antworten.",
  "refresh": {
   "agents": "Agent-Einträge, die diese Aktualisierung erstellt, aktualisiert oder entfernt hat.",
   "harnessBuiltIns": "Einträge für integrierte Harness-Tools, die erstellt, aktualisiert oder entfernt wurden, über alle Bereiche hinweg.",
   "hints": "Agent-Einträge, deren Hinweise zu Kosten und Latenz neu berechnet wurden.",
   "servers": "Wie viele MCP-Server diese Aktualisierung aufzulisten versucht hat.",
   "tools": "Tool-Einträge, die aus den antwortenden Servern geschrieben wurden.",
   "removed": "Tool-Einträge, die entfernt wurden, weil ihr Server das Tool nicht mehr auflistet.",
   "failed": "Server, deren Tools nicht aufgelistet werden konnten. Ihre Einträge behalten ihren letzten gültigen Inhalt.",
   "failedBadge": "Die Tools dieses Servers konnten nicht aufgelistet werden. Seine Einträge behalten ihren letzten gültigen Inhalt mit einer Warnung.",
   "listedBadge": "Der Server hat geantwortet, und seine Tool-Einträge sind aktuell.",
   "columns": {
    "server": "Der MCP-Server, dessen Tools aufgelistet wurden.",
    "status": "Ob die Tools des Servers aufgelistet werden konnten.",
    "tools": "Für diesen Server geschriebene Tool-Einträge.",
    "removed": "Tool-Einträge, die entfernt wurden, weil der Server sie nicht mehr auflistet.",
    "warned": "Einträge, die ihren letzten gültigen Inhalt behalten haben und jetzt eine Aktualisierungswarnung tragen.",
    "error": "Warum das Auflisten fehlgeschlagen ist, falls es fehlschlug."
   }
  },
  "draftSave": "Diese Fähigkeiten im Entwurf speichern. Veröffentlichen Sie den Entwurf danach, damit Bereitstellungen sie nutzen.",
  "notInCatalog": "Derzeit hat kein Katalogeintrag diesen Namen. Der Lauf startet trotzdem, aber der Agent kann diese Fähigkeit nicht finden.",
  "removeName": "Diese Fähigkeit aus der Revision entfernen.",
  "chooseName": "Eine Fähigkeit aus dem Katalog nach Name auswählen. Namen, die mehrere Arten verwenden, erscheinen nur einmal.",
  "addName": "Die gewählte Fähigkeit zur Revision hinzufügen.",
  "newDraft": "Einen neuen Entwurf aus der neuesten veröffentlichten Revision starten und die Fähigkeiten wählen, die er nutzt.",
  "editDraft": "Fähigkeiten hinzufügen oder entfernen, die diese Entwurfsrevision nutzt.",
  "revisionName": "Diese Revision nutzt die Fähigkeit {{name}}. Agents finden sie im Katalog unter diesem Namen."
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
   "Running": "Die Gruppe wartet auf ihre Mitglieder. Sie endet, wenn die Zusammenführungsregel erfüllt ist, die Frist abläuft, das Budget aufgebraucht ist oder jemand sie abbricht.",
   "Joined": "Die Zusammenführungsregel ist erfüllt oder alle Mitglieder sind beendet, daher kann der übergeordnete Lauf die Ergebnisse nutzen.",
   "TimedOut": "Die Frist ist abgelaufen, bevor die Zusammenführungsregel erfüllt war. Noch laufende Mitglieder wurden abgebrochen.",
   "BudgetExceeded": "Kosten oder Token der Mitglieder haben das Budget der Gruppe überschritten. Noch laufende Mitglieder wurden abgebrochen.",
   "Cancelled": "Jemand hat die Gruppe abgebrochen, oder ihr übergeordneter Lauf ist beendet oder wurde abgebrochen. Noch laufende Mitglieder wurden abgebrochen."
  },
  "fanOutJoinPolicy": {
   "All": "Die Gruppe wird zusammengeführt, wenn jedes Mitglied beendet ist, ob erfolgreich oder nicht.",
   "Any": "Die Gruppe wird zusammengeführt, sobald ein Mitglied erfolgreich ist. Die übrigen werden abgebrochen, sofern der Aufruf sie nicht weiterlaufen lässt.",
   "Quorum": "Die Gruppe wird zusammengeführt, sobald die angegebene Zahl von Mitgliedern erfolgreich ist oder so viele gescheitert sind, dass das nicht mehr möglich ist."
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "Die Fan-out-Gruppe, zu der dieser Lauf gehört. Der übergeordnete Lauf hat sie zusammen mit weiteren Mitgliedern gestartet und führt deren Ergebnisse zusammen.",
   "openFanOutGroup": "Den Laufbaum des übergeordneten Laufs bei dieser Fan-out-Gruppe öffnen, um die anderen Mitglieder, die Regel und das Budget zu sehen."
  }
 },
 "fanOut": {
  "group": "Unterläufe, die dieser Lauf gemeinsam mit garrison_fan_out gestartet hat, zusammengeführt unter einer Regel, einem Budget und einer Frist.",
  "otherChildren": "Unterläufe, an die dieser Lauf einzeln delegiert hat, außerhalb jeder Fan-out-Gruppe.",
  "reason": "Warum die Gruppe geendet hat, wie der Server es aufgezeichnet hat.",
  "policy": "Wann die Gruppe als fertig gilt: Alle wartet auf jedes Mitglied, Beliebiges auf einen Erfolg, Quorum auf die angegebene Zahl von Erfolgen.",
  "progress": "Beendete Mitglieder, erfolgreiche Mitglieder und die Zahl der Mitglieder in der Gruppe.",
  "cost": "Bisher erfasste Kosten der Mitglieder, gemessen an den Höchstkosten der Gruppe, falls festgelegt.",
  "costValue": "Gesamte erfasste Kosten aller Mitglieder. Mitglieder, deren Modell keinen Preis hat, zählen nicht mit.",
  "tokens": "Bisher verbrauchte Eingabe- und Ausgabetoken der Mitglieder, gemessen am Höchstwert der Gruppe, falls festgelegt.",
  "tokensValue": "Eingabe- plus Ausgabetoken aller Mitglieder zusammen.",
  "budgetBar": "{{percent}} % des Budgets verbraucht. Die Gruppe endet mit Budget überschritten, sobald der Verbrauch darüber liegt.",
  "deadline": "Wann die Gruppe das Zeitlimit erreicht. Dann noch laufende Mitglieder werden abgebrochen.",
  "started": "Wann der übergeordnete Lauf diese Gruppe gestartet hat.",
  "completed": "Wann die Gruppe geendet und aufgehört hat, auf Mitglieder zu warten.",
  "pending": "Bezeichnungen der Mitglieder, die noch nicht beendet sind.",
  "failed": "Bezeichnungen der Mitglieder, die ohne Erfolg beendet wurden.",
  "live": "Aktualisierungen kommen über die Live-Verbindung, sobald sich der Status eines Mitglieds oder der Verbrauch der Gruppe ändert.",
  "polling": "Die Live-Verbindung ist nicht verfügbar, daher wird die Gruppe alle {{seconds}} Sekunden neu geladen.",
  "cancel": "Diese Gruppe jetzt abbrechen. Noch laufende Mitglieder werden abgebrochen, und der übergeordnete Lauf erhält die bisher gesammelten Ergebnisse.",
  "confirmCancel": "Die Gruppe und jedes noch laufende Mitglied abbrechen. Das lässt sich nicht rückgängig machen.",
  "openMember": "Den Lauf des Mitglieds {{label}} öffnen, um Transkript, Ergebnis und Telemetrie zu sehen.",
  "columns": {
   "label": "Der Name, den der übergeordnete Lauf diesem Mitglied beim Start der Gruppe gegeben hat.",
   "agent": "Der Agent, den dieses Mitglied ausführt, vom übergeordneten Lauf gewählt.",
   "status": "Wo der Lauf des Mitglieds gerade steht und wie er geendet hat.",
   "costUsd": "Erfasste Kosten des Laufs dieses Mitglieds.",
   "tokens": "Eingabe- und Ausgabetoken, die der Lauf dieses Mitglieds verbraucht hat.",
   "run": "Der Lauf des Mitglieds. Öffnen Sie ihn für Transkript und Ergebnis."
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
   "apps": "Agentische Apps: Gruppen von Agenten hinter einer Chat-Oberfläche für Endbenutzer, mit Aufrufgraph, Delegation, Revisionen, Hochstufung und Link."
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "Jeder aktive Benutzer dieses Mandanten kann sich mit E-Mail und Passwort bei der App anmelden.",
   "AppUsers": "Nur Benutzer des Mandanten mit der integrierten Rolle AppUser für diese App können sich anmelden. Weisen Sie sie mit Ressourcen-Geltungsbereich auf der App zu.",
   "Anonymous": "Jeder mit dem Link kann die App ohne Anmeldung nutzen, aber nur, wenn auch die anonyme Nutzung aktiviert ist."
  }
 },
 "form": {
  "pickColor": "Wählen Sie {{field}} mit einer Farbauswahl, statt den #RRGGBB-Wert einzutippen."
 },
 "resources": {
  "apps": {
   "add": "Erstellen Sie eine App aus vorhandenen Agenten: Mitglieder, ein Einstiegsagent, die Aufrufe zwischen ihnen und wie sich Menschen anmelden.",
   "name": "Name der App in diesem Mandanten: Kleinbuchstaben, Ziffern und Bindestriche. Manifeste und die API verweisen über diesen Namen auf sie.",
   "slug": "Der Name in der URL, die App liegt also unter /apps/{slug}/. Im gesamten Cluster eindeutig. Leer bedeutet den Namen.",
   "description": "Wofür die App gedacht ist. Endbenutzer sehen dies auf der Anmeldeseite der App.",
   "active": "Inaktive Apps behalten ihre Einstellungen, aber ihr Link und ihre Sitzungen funktionieren nicht mehr.",
   "url": "Die Adresse der App für Endbenutzer. Kopieren Sie sie zum Teilen oder öffnen Sie sie, um zu sehen, was Endbenutzer sehen.",
   "entryAgentId": "Das Mitglied, das mit Endbenutzern spricht und jede Konversation beginnt. Die anderen Mitglieder werden von ihm aus erreicht.",
   "members": "Die Agenten in der App, jeweils mit optionaler Rollennotiz. Ein Agent, der zu einer App gehört, kann nicht gelöscht werden.",
   "membersItems": {
    "agentId": "Ein Agent dieses Mandanten, der in die App aufgenommen wird. Jeder Agent kann einmal Mitglied sein.",
    "role": "Eine kurze Notiz dazu, was dieses Mitglied in der App tut, bis zu 256 Zeichen."
   },
   "edges": "Welches Mitglied welches aufrufen darf. Zusammen bilden sie den Graphen der App und werden zur Delegationsrichtlinie jedes Mitglieds.",
   "edgesItems": {
    "callerAgentId": "Das Mitglied, das den Aufruf ausführt.",
    "calleeAgentId": "Das aufgerufene Mitglied. Es muss ein anderes Mitglied als der Aufrufer sein.",
    "fanOutAllowed": "Erlaubt dem Aufrufer, mit garrison_fan_out mehrere Läufe dieses Mitglieds gleichzeitig zu starten."
   },
   "graph": "Die Mitglieder und Aufrufe als Bild, schreibgeschützt. Der Einstiegsagent steht links; Mitglieder, die er nicht erreichen kann, sind rot umrandet.",
   "environments": "Für jede Umgebung die Bereitstellung des Einstiegsagenten, die die App dort verwendet. Die Hochstufung hält diese synchron.",
   "environmentsItems": {
    "environment": "Eine Umgebung dieses Mandanten, etwa dev, staging oder prod.",
    "deploymentId": "Eine Bereitstellung des Einstiegsagenten in dieser Umgebung. Nur diese Bereitstellungen werden aufgeführt."
   },
   "liveEnvironment": "Die Umgebung, die die Chat-Oberfläche der App jetzt verwendet. Ändern Sie sie, um Endbenutzer auf eine andere Umgebung umzustellen.",
   "authMode": "Benutzer des Mandanten, Benutzer mit der Rolle AppUser für diese App oder jeder mit dem Link (bei aktivierter anonymer Nutzung).",
   "anonymousEnabled": "Aktiviert anonyme Sitzungen. Die anonyme Anmeldung funktioniert nur, wenn dies aktiviert ist und der Modus Anonym lautet.",
   "showOperatorDetail": "Zeigt Endbenutzern die Werkzeugaufrufe, den Denkprozess und den Fortschritt jeder Runde, nicht nur die Antwort.",
   "share": "Der Link für Endbenutzer, zusammen mit der Angabe, wer sich laut der oben gewählten Anmeldeeinstellung anmelden kann.",
   "displayName": "Der Name in der Kopfzeile und auf der Anmeldeseite der App. Leer bedeutet den Namen der App.",
   "logoAssetId": "Eine Agent-Ressource, deren aktuelle Version das Logobild enthält. Laden Sie eine unter Konfiguration, Ressourcen hoch.",
   "primaryColor": "Hauptfarbe der App-Oberfläche als #RRGGBB. Leer behält die Standardfarbe.",
   "accentColor": "Zweite Farbe der App-Oberfläche für Hervorhebungen als #RRGGBB. Leer behält die Standardfarbe.",
   "welcomeText": "Text, den Endbenutzer vor ihrer ersten Nachricht sehen, bis zu 4000 Zeichen.",
   "id": "Die Kennung der App. Die API und Manifeste akzeptieren sie ebenso wie den Namen.",
   "lastUpdateUtc": "Wann sich die Einstellungen der App zuletzt geändert haben.",
   "createdUtc": "Wann die App erstellt wurde.",
   "membersCell": "Mitglieder der App: {{names}}.",
   "activeBadge": "Die App ist aktiv: Ihr Link funktioniert für die Personen, die ihre Anmeldeeinstellung zulässt.",
   "inactiveBadge": "Die App ist inaktiv: Ihre Einstellungen bleiben erhalten, aber ihr Link und ihre Sitzungen funktionieren nicht.",
   "steps": {
    "general": "Name, URL-Slug und Beschreibung der App und ob sie aktiv ist.",
    "members": "Die Agenten in der App, der Einstiegsagent und die Aufrufe zwischen ihnen, mit einem Bild des Graphen.",
    "environments": "Die Einstiegsbereitstellung, die die App in jeder Umgebung verwendet, und die Umgebung, auf der die App jetzt läuft.",
    "access": "Wer sich anmelden darf, ob Endbenutzer Werkzeugaufrufe sehen, und der Link zum Teilen.",
    "branding": "Anzeigename, Logo, Farben und Begrüßungstext, die Endbenutzer sehen."
   },
   "actions": {
    "delegation": "Vergleicht die veröffentlichte Delegation jedes Mitglieds mit den Vorgaben des Graphen und schreibt Entwürfe, die die Abweichung beheben.",
    "revisions": "Listet die Revisionen der App auf, erstellt eine neue, veröffentlicht sie und stuft die App in die nächste Umgebung hoch."
   }
  }
 },
 "apps": {
  "denied": "Dafür benötigen Sie die Berechtigung {{operation}} auf {{resource}}. Bitten Sie einen Administrator um eine Rolle, die sie gewährt.",
  "graph": "Schreibgeschütztes Bild der App: Mitglieder, die Aufrufe zwischen ihnen und welche der Einstiegsagent erreichen kann.",
  "url": "Die Adresse der App. {{who}}",
  "open": "Öffnet die App in einem neuen Browser-Tab, so wie Endbenutzer sie sehen. {{who}}",
  "copyUrl": "Kopiert die Adresse der App zum Teilen. {{who}}",
  "signIn": {
   "TenantUsers": "Jeder aktive Benutzer dieses Mandanten kann sich anmelden.",
   "AppUsers": "Nur Benutzer mit der Rolle AppUser für diese App können sich anmelden.",
   "Anonymous": "Jeder mit dem Link kann sie ohne Anmeldung nutzen.",
   "AnonymousDisabled": "Anonym ist gewählt, aber nicht aktiviert, daher kommen nur angemeldete Benutzer mit Zugriff hinein."
  },
  "delegation": {
   "apply": "Schreibt die Delegation des Graphen in eine Entwurfsrevision jedes abweichenden Mitglieds. Nichts wird veröffentlicht, und manuelle Entwürfe bleiben unberührt.",
   "applyNothing": "Die veröffentlichte Delegation jedes Mitglieds entspricht bereits dem Graphen, daher gibt es nichts zu schreiben.",
   "openAgent": "Öffnen Sie den Agenten {{name}}, um seine Entwurfsrevision zu prüfen und zu veröffentlichen.",
   "drift": "Die veröffentlichte Delegation des Mitglieds weicht von den Vorgaben des Graphen ab. Schreiben Sie Entwürfe zur Behebung und veröffentlichen Sie sie dann.",
   "inSync": "Die veröffentlichte Delegation des Mitglieds entspricht dem Graphen.",
   "draftConflict": "Der offene Entwurf des Mitglieds ändert die Delegation bereits anders, daher blieb er unberührt. Veröffentlichen oder verwerfen Sie diesen Entwurf zuerst.",
   "skipped": "Dieses Mitglied wurde übersprungen: {{reason}}.",
   "draft": "Die Delegation des Graphen steht in Entwurfsrevision {{number}} dieses Mitglieds. Veröffentlichen Sie sie, damit sie live wird.",
   "columns": {
    "member": "Der Mitgliedsagent. Öffnen Sie ihn, um seine Revisionen zu prüfen.",
    "desiredMode": "Der Delegationsmodus laut Graph: Zulassungsliste, wenn das Mitglied andere aufruft, Keine Delegation, wenn es niemanden aufruft.",
    "desiredAllowList": "Die Mitglieder, die dieses Mitglied im Graphen aufruft.",
    "desiredMaxDepth": "Die längste Aufrufkette unterhalb dieses Mitglieds im Graphen.",
    "publishedMode": "Der Delegationsmodus in der neuesten veröffentlichten Revision des Mitglieds.",
    "publishedAllowList": "Die Zulassungsliste in der neuesten veröffentlichten Revision des Mitglieds.",
    "publishedMaxDepth": "Die maximale Tiefe in der neuesten veröffentlichten Revision des Mitglieds.",
    "status": "Ob das Mitglied vom Graphen abweicht, und der geschriebene Entwurf oder der Grund, warum es übersprungen wurde."
   }
  },
  "revisions": {
   "promote": "Stuft eine veröffentlichte App-Revision hoch: Alle Mitglieder wechseln gemeinsam in die nächste Umgebung, oder nichts ändert sich.",
   "promoteNothing": "Veröffentlichen Sie zuerst eine App-Revision. Nur veröffentlichte Revisionen können hochgestuft werden.",
   "changeNote": "Eine Notiz zu den Änderungen, die mit der Revision gespeichert wird. Bis zu 2000 Zeichen.",
   "take": "Erstellt eine App-Revision als Entwurf, die die neueste veröffentlichte Revision jedes Mitglieds fixiert und die Aufrufe kopiert.",
   "latest": "Die neueste veröffentlichte Revision der App, die Hochstufungen verwenden, sofern Sie keine andere wählen.",
   "pin": "Diese Revision fixiert Revision {{number}} von {{name}}.",
   "publishedBy": "Veröffentlicht von {{name}} am {{when}}.",
   "publish": "Veröffentlicht diese App-Revision im Entwurf. Danach kann sie sich nicht mehr ändern und kann hochgestuft werden.",
   "publishConfirm": "Veröffentlicht die Revision jetzt. Danach kann sie nicht mehr bearbeitet werden.",
   "columns": {
    "number": "Die Revisionsnummer, für diese App ab 1 hochgezählt.",
    "state": "Entwurf bis zur Veröffentlichung. Nur veröffentlichte Revisionen können hochgestuft werden.",
    "members": "Die Mitgliedsrevisionen, die diese App-Revision fixiert.",
    "edges": "Wie viele Aufrufe zwischen Mitgliedern die Revision kopiert hat.",
    "author": "Wer die Revision erstellt hat.",
    "changeNote": "Die Notiz, die beim Erstellen der Revision geschrieben wurde.",
    "publishedUtc": "Wann und von wem die Revision veröffentlicht wurde.",
    "actions": "Eine Entwurfsrevision veröffentlichen."
   }
  },
  "promote": {
   "submit": "Jetzt hochstufen. Die Bereitstellungen jedes Mitglieds in der Zielumgebung erhalten die fixierten Revisionen, oder nichts ändert sich.",
   "revision": "Die veröffentlichte App-Revision, die hochgestuft wird. Die neueste wird verwendet, sofern Sie keine andere wählen.",
   "source": "Die Umgebung, aus der hochgestuft wird, meist die, auf der die App jetzt läuft.",
   "target": "Die Umgebung, in die hochgestuft wird. Standardmäßig die nach der Quelle."
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
   "studio": "Das Agenten-Studio: Entwürfe von Agenten und Apps, die Sie mit dem Agenten-Architekten gestalten, im Testbereich ausprobieren und von einer Person anwenden lassen."
  }
 },
 "enums": {
  "approvalKind": {
   "DraftApply": "Ein Antrag, einen Studio-Entwurf auf die Live-Konfiguration anzuwenden. Wird er zugelassen, werden alle Dokumente des Entwurfs in einer Manifest-Anwendung angewendet."
  },
  "studioDraftStatus": {
   "Open": "Sie und der Agenten-Architekt können den Entwurf bearbeiten, validieren, im Testbereich ausprobieren und zur Freigabe senden.",
   "PendingApproval": "Der Entwurf wartet auf die Entscheidung über seine Freigabe und ist bis dahin eingefroren. Eine Ablehnung öffnet ihn wieder.",
   "Applied": "Der Entwurf wurde in einer Manifest-Anwendung auf die Live-Konfiguration angewendet. Er kann nicht mehr geändert werden.",
   "Discarded": "Der Entwurf wurde verworfen. Er kann nicht mehr geändert werden, und eine ausstehende Freigabe wurde abgebrochen."
  },
  "studioDraftOperation": {
   "Upsert": "Das Anwenden des Entwurfs erstellt die Ressource oder aktualisiert sie, wenn sie bereits existiert.",
   "Delete": "Das Anwenden des Entwurfs löscht die Ressource. Nur Agenten, Bereitstellungen, Pipelines und Apps können so gelöscht werden."
  },
  "studioDiffChange": {
   "Create": "Die Ressource existiert noch nicht, daher erstellt das Anwenden des Entwurfs sie.",
   "Update": "Die Ressource existiert und weicht ab, daher aktualisiert das Anwenden des Entwurfs die aufgeführten Felder.",
   "Delete": "Der Entwurf löscht diese Ressource, wenn er angewendet wird.",
   "Unchanged": "Das Dokument entspricht der Live-Konfiguration, daher ändert das Anwenden nichts.",
   "Failed": "Das Dokument besteht die Validierung nicht. Die Details nennen den Grund; korrigieren Sie es, bevor Sie das Anwenden beantragen."
  }
 },
 "views": {
  "studio": {
   "newDraft": "Beginnen Sie einen Entwurf, leer oder aus einer bestehenden App, und öffnen Sie seinen Arbeitsbereich.",
   "refresh": "Die Liste der Entwürfe erneut vom Server lesen.",
   "search": "Entwürfe finden, deren Titel diesen Text enthält. Der Server führt die Suche aus.",
   "scope": "Nur Ihre eigenen Entwürfe zeigen oder alle Entwürfe des Mandanten, die Sie lesen dürfen.",
   "scopes": {
    "mine": "Nur die Entwürfe zeigen, die Sie begonnen haben oder die ein Architekt für Sie begonnen hat.",
    "all": "Alle Entwürfe im Mandanten zeigen, die Sie lesen dürfen, egal wer sie begonnen hat."
   },
   "statusChip": "Entwürfe mit dem Status {{status}} zeigen. Ist kein Status gewählt, erscheinen alle.",
   "columns": {
    "title": "Der Titel des Entwurfs. Öffnen Sie ihn, um seinen Arbeitsbereich mit Architekt, Elementen, Graph und Anwenden zu sehen.",
    "status": "Offene Entwürfe können sich ändern; ausstehende warten auf eine Entscheidung; angewendete und verworfene sind endgültig.",
    "owner": "Die Person, die den Entwurf begonnen hat. Ein Architekt arbeitet nur an den Entwürfen der Person, die mit ihm spricht.",
    "targetApp": "Die App, die der Entwurf gestaltet. Graph-Vorgänge und der Testbereich verwenden sie standardmäßig.",
    "items": "Wie viele Manifest-Dokumente der Entwurf enthält, eines pro Ressource.",
    "version": "Steigt bei jeder Änderung am Entwurf um eins. Jede Bearbeitung nennt die Version, die sie gelesen hat.",
    "updated": "Wann sich der Entwurf zuletzt geändert hat."
   },
   "openDraft": "Den Arbeitsbereich des Entwurfs öffnen: Architekten-Chat, Elemente, Graph, Vergleich und Anwenden, Testbereich und Vorschau.",
   "discard": "Den Entwurf nach einer Bestätigung verwerfen. Er kann danach nicht mehr geändert oder angewendet werden.",
   "discardPending": "Den Entwurf nach einer Bestätigung verwerfen. Seine ausstehende Freigabe wird abgebrochen."
  },
  "studioDraft": {
   "version": "Jede Änderung erhöht die Version. Bearbeitungen senden die gelesene Version, damit niemand die Änderung eines anderen überschreibt.",
   "live": "Mit dem Live-Kanal des Entwurfs verbunden, daher erscheinen Änderungen anderer und des Architekten sofort.",
   "polling": "Der Live-Kanal ist nicht verfügbar, daher liest die Seite den Entwurf alle paar Sekunden neu.",
   "back": "Zurück zur Liste der Studio-Entwürfe.",
   "viewJson": "Den Entwurf so zeigen, wie der Server ihn geliefert hat, mit allen Elementen und dem Canvas-Layout.",
   "architect": "Die Architekten-Bereitstellung, mit der dieser Arbeitsbereich spricht. Wählen Sie sie auf dem Tab Architekt.",
   "dismissNotice": "Diesen Hinweis zur letzten Änderung am Entwurf ausblenden.",
   "tabs": {
    "architect": "Mit dem Agenten-Architekten sprechen, der diesen Entwurf für Sie bearbeitet.",
    "items": "Die Manifest-Dokumente im Entwurf, mit einem Editor für jedes.",
    "graph": "Eine schreibgeschützte Darstellung der Apps, Aufrufe, Delegationstiefe und Fähigkeiten des Entwurfs.",
    "apply": "Den Entwurf mit der Live-Konfiguration vergleichen, validieren und das Anwenden beantragen.",
    "playground": "Die Agenten des Entwurfs über mehrere Runden ausführen, bevor etwas veröffentlicht wird.",
    "preview": "Eine Bereitstellung kompilieren, um Befehlszeile, abgelegte Assets und Dateibereich zu sehen.",
    "prompts": "Den Prompt wählen und bearbeiten, mit dem der Agenten-Architekt arbeitet."
   }
  }
 },
 "studio": {
  "notOpen": "Dieser Entwurf ist {{status}}, und nur ein offener Entwurf kann geändert werden.",
  "newDraft": {
   "titleField": "Ein kurzer Name für den Entwurf, angezeigt in der Liste und dem Architekten. Leer ergibt einen Standardtitel.",
   "fromApp": "Mit einer bestehenden App samt allem, worauf sie verweist, beginnen oder mit einem leeren Entwurf.",
   "create": "Den Entwurf erstellen und seinen Arbeitsbereich öffnen. Die Live-Konfiguration ändert sich nicht."
  },
  "architect": {
   "name": "Name der neuen Architekten-Bereitstellung in diesem Mandanten, zum Beispiel architect.",
   "harnessProfileId": "Der Harness, auf dem der Architekt läuft, zum Beispiel Claude Code. Er braucht einen Worker, der ihn ausführen kann.",
   "model": "Das Modell, das der Harness für den Architekten verwendet. Leer verwendet den Standard des Harness-Profils.",
   "promptId": "Der System-Prompt, mit dem der Architekt arbeitet. Integrierte kommen zuerst, ihre Klone danach.",
   "preview": "Der gewählte Prompt, mit Beispielwerten gerendert, so wie der Architekt ihn erhalten würde.",
   "cloneLink": "Diesen Prompt im Bereich Prompt-Vorlagen öffnen, wo Sie ihn klonen und den Klon bearbeiten können.",
   "create": "Die Bereitstellung von agent-architect mit Entwurfszugriff und dem gewählten Prompt erstellen.",
   "noAgent": "Es kann kein Architekt erstellt werden, weil dieser Mandant keinen Agenten agent-architect hat."
  },
  "chat": {
   "title": "Eine Konversation mit dem Agenten-Architekten über diesen Entwurf. Er bearbeitet den Entwurf; Sie geben das Anwenden frei.",
   "architect": "Die Architekten-Bereitstellung, mit der Sie sprechen. Die Wahl einer anderen beginnt eine neue Konversation.",
   "newArchitect": "Eine Architekten-Bereitstellung erstellen: Harness-Profil, Modell und Architekten-Prompt.",
   "openConversation": "Diese Konversation auf einer eigenen Seite öffnen, mit jeder Runde als Lauf.",
   "newConversation": "Diese Konversation in diesem Browser vergessen und mit der nächsten Nachricht eine neue beginnen.",
   "you": "Was Sie in dieser Runde an den Architekten gesendet haben.",
   "architectSays": "Die Antwort des Architekten in dieser Runde. Seine Änderungen am Entwurf erscheinen in den anderen Tabs.",
   "openRun": "Den Lauf dieser Runde öffnen, mit Protokoll und den aufgerufenen Tools.",
   "message": "Was der Architekt entwerfen oder ändern soll. Die ID des Entwurfs wird mit der ersten Nachricht gesendet.",
   "send": "Die Nachricht an den Architekten senden. Die Antwort erscheint hier, wenn die Runde endet.",
   "sendBusy": "Der Architekt arbeitet noch an der letzten Nachricht. Warten Sie, bis er fertig ist.",
   "sendNoArchitect": "Wählen oder erstellen Sie eine Architekten-Bereitstellung, bevor Sie eine Nachricht senden."
  },
  "items": {
   "title": "Die Manifest-Dokumente im Entwurf, eines pro Ressource, nach Art und Name geordnet.",
   "add": "Ein neues Dokument zum Entwurf hinzufügen. Es wird gespeichert, wenn Sie es im Editor speichern.",
   "addConfirm": "Den Editor mit einem Ausgangsdokument dieser Art und dieses Namens öffnen.",
   "kind": "Die Manifest-Art des Dokuments, zum Beispiel Agent oder Deployment.",
   "name": "Der Ressourcenname, der mit dem Namen im Dokument übereinstimmen muss.",
   "operation": "Die Ressource beim Anwenden erstellen oder aktualisieren, oder sie löschen.",
   "stale": "Ob sich die Live-Konfiguration geändert hat, nachdem der Entwurf auf diesem Dokument aufgebaut wurde.",
   "updated": "Wann sich dieses Element im Entwurf zuletzt geändert hat.",
   "staleBadge": "Die Live-Konfiguration hat sich geändert, nachdem der Entwurf von diesem Dokument ausging. Bringen Sie es vor dem Anwenden auf den neuen Stand.",
   "editItem": "Dieses Dokument im Editor öffnen, um es zu ändern und zu speichern.",
   "viewItem": "Dieses Dokument im Editor öffnen, um es zu lesen. Der Entwurf kann gerade nicht geändert werden.",
   "remove": "Dieses Dokument nach einer Bestätigung aus dem Entwurf entfernen. Die Live-Konfiguration ändert sich nicht.",
   "editor": "Das Dokument als Manifest-YAML. Beim Speichern wird die gelesene Version gesendet.",
   "document": "Reines Manifest-YAML. Art und Name müssen mit denen des Elements übereinstimmen.",
   "save": "Das Dokument in der gelesenen Version im Entwurf speichern.",
   "closeEditor": "Den Editor schließen. Ungespeicherter Text geht verloren.",
   "dismissConflict": "Diesen Hinweis zu der Änderung ausblenden, die Ihr Speichern abgelehnt hat."
  },
  "graph": {
   "title": "Schreibgeschützte Darstellung der Apps des Entwurfs: Mitglieder, Aufrufe, Delegationstiefe und Fähigkeiten.",
   "app": "Eine App, die der Entwurf enthält oder auf die er verweist, ausgehend von ihrem Einstiegsagenten gezeichnet.",
   "deletedApp": "Das Anwenden des Entwurfs löscht diese App.",
   "draftedApp": "Der Entwurf enthält das Dokument dieser App, daher zeigt ihr Graph die Version des Entwurfs.",
   "deletedAgent": "Das Anwenden des Entwurfs löscht diesen Agenten.",
   "loose": "Agenten im Entwurf, die zu keiner seiner Apps gehören.",
   "legend": "So lesen Sie den Graph: Beschriftungen, Linienarten und die Fähigkeiten unter jedem Agenten."
  },
  "diff": {
   "title": "Jedes Dokument im Vergleich zur Live-Konfiguration, die Validierung und der Antrag, den Entwurf anzuwenden.",
   "refresh": "Jedes Dokument erneut mit der Live-Konfiguration vergleichen.",
   "validate": "Einen Manifest-Probelauf des Entwurfs ausführen. Nichts ändert sich; die Ergebnisse erscheinen pro Element.",
   "requestApply": "Den Entwurf validieren und eine Freigabe zum Anwenden erstellen. Der Entwurf ist bis zur Entscheidung eingefroren.",
   "columns": {
    "item": "Art und Name des Dokuments.",
    "change": "Was das Anwenden des Entwurfs mit dieser Ressource tun würde.",
    "details": "Die Felder, die sich ändern, oder der Grund, warum das Dokument die Validierung nicht besteht."
   },
   "approval": "Die Freigabe, die entscheidet, ob dieser Entwurf angewendet wird.",
   "openApproval": "Die Freigabe mit ihrer vollständigen Zusammenfassung und dem Vergleich öffnen.",
   "reason": "Warum Sie den Entwurf zulassen oder ablehnen. Die Begründung wird mit der Entscheidung gespeichert.",
   "allow": "Die Freigabe zulassen: Der Entwurf wird erneut validiert und in einer Manifest-Anwendung angewendet.",
   "deny": "Die Freigabe ablehnen: Nichts wird angewendet, und der Entwurf ist wieder offen."
  },
  "playground": {
   "title": "Die Agenten des Entwurfs über mehrere Runden ausprobieren, bevor etwas veröffentlicht wird.",
   "agent": "Der auszuführende Agent. Standard ist der Einstiegsagent der Ziel-App des Entwurfs.",
   "input": "Was der Agent in dieser Runde tun soll.",
   "send": "Das Dokument des Agenten als seine Entwurfsrevision speichern und im Testbereich ausführen.",
   "sendBusy": "Die letzte Runde läuft noch. Warten Sie, bis sie fertig ist.",
   "openRun": "Den Lauf öffnen, mit Laufbaum, Fan-out-Gruppen und den Dateien der Konversation.",
   "conversation": "Die Konversation im Testbereich öffnen, mit jeder Runde als Lauf.",
   "export": "Die Runden aus dem Testbereich als Markdown-Datei herunterladen.",
   "reset": "Mit der nächsten Runde eine neue Konversation im Testbereich beginnen."
  },
  "preview": {
   "title": "Eine Bereitstellung vor dem Bereitstellen mit Beispieleingabe kompilieren. Geheime Werte werden geschwärzt.",
   "deploymentId": "Die Bereitstellung, die kompiliert werden soll.",
   "agentRevisionId": "Eine Agentenrevision, die statt der eigenen Revision der Bereitstellung kompiliert wird, zum Beispiel eine Entwurfsrevision.",
   "environment": "Die Bereitstellung des Agenten in dieser Umgebung statt in der gewählten kompilieren.",
   "input": "Die Beispieleingabe, mit der der kompilierte Prompt gerendert wird.",
   "compile": "Die Bereitstellung kompilieren und Befehlszeile, Assets und Dateibereich zeigen.",
   "compileNoDeployment": "Wählen Sie zuerst eine Bereitstellung zum Kompilieren.",
   "commandLine": "Der Befehl, den der Worker starten würde, für die Anzeige in Shell-Quoting.",
   "assets": "Wohin die Assets der Revision geschrieben würden, bevor der Harness startet.",
   "columns": {
    "path": "Wo die Datei abgelegt wird, relativ zu den Verzeichnissen des Laufs.",
    "asset": "Das Agenten-Asset, aus dem die Datei stammt.",
    "kind": "Wofür das Asset verwendet wird, zum Beispiel ein Skill oder eine Referenzdatei.",
    "version": "Die Asset-Version, die die Revision festlegt.",
    "size": "Die Größe der abgelegten Datei."
   },
   "fileSpace": "Der gemeinsame Dateibereich der Konversation und wo der Lauf ihn sehen würde."
  },
  "prompts": {
   "title": "Die Prompts, mit denen der Agenten-Architekt arbeiten kann, und welchen jeder Architekt verwendet.",
   "templatesLink": "Den Bereich Prompt-Vorlagen gefiltert auf Architekten-Prompts öffnen.",
   "columns": {
    "name": "Der Name der Prompt-Vorlage. Integrierte beginnen mit builtin/.",
    "description": "Eine kurze Notiz dazu, was der Prompt beim Architekten anders macht.",
    "version": "Die aktuelle Version des Prompts. Jedes Speichern erhöht sie um eins.",
    "usedBy": "Wie viele Architekten-Bereitstellungen diesen Prompt verwenden. Für ihre Namen mit der Maus darüberfahren."
   },
   "defaultBadge": "Neue Architekten-Bereitstellungen verwenden diesen Prompt, sofern kein anderer gewählt wird.",
   "selectedBadge": "Der Prompt, den {{architect}} jetzt verwendet.",
   "select": "Diesen Prompt dem aktuellen Architekten zuweisen. Er wirkt ab der nächsten Runde des Architekten.",
   "alreadySelected": "Der aktuelle Architekt verwendet diesen Prompt bereits.",
   "selectNoArchitect": "Wählen Sie zuerst auf dem Tab Architekt einen Architekten; die Auswahl gilt für diese Bereitstellung.",
   "clone": "Diesen Prompt in eine neue, bearbeitbare Vorlage kopieren.",
   "edit": "Name, Beschreibung und Text bearbeiten. Jedes Speichern ergibt eine neue Version.",
   "delete": "Diesen Prompt nach einer Bestätigung löschen. Ein Prompt, den eine Bereitstellung verwendet, kann nicht gelöscht werden.",
   "builtInLocked": "Integrierte Prompts können nicht bearbeitet oder gelöscht werden. Klonen Sie diesen Prompt und ändern Sie den Klon.",
   "editor": "Den Prompt bearbeiten und eine Vorschau sehen. Architekten, die seiner aktuellen Version folgen, verwenden eine Speicherung ab ihrer nächsten Runde.",
   "closeEditor": "Den Editor schließen. Ungespeicherter Text geht verloren.",
   "name": "Der Name der Vorlage in diesem Mandanten. Er muss eindeutig bleiben.",
   "description": "Eine kurze Notiz dazu, was dieser Prompt den Architekten tun lässt.",
   "body": "Der Prompt-Text, mit Vorlagenvariablen und eingebundenen Fragmenten wie builtin/agent-architect-design.",
   "preview": "Der Text mit Beispielwerten gerendert, so wie der Architekt ihn erhalten würde.",
   "save": "Die Änderung als neue Version des Prompts speichern."
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
    "graph": "Die App des Entwurfs auf einer Zeichenfläche bearbeiten: Agenten, Aufrufe, den Einstiegsagenten, Eigenschaften und die Laufzeit je Umgebung."
   }
  }
 },
 "studio": {
  "graph": {
   "title": "Die App des Entwurfs als bearbeitbare Zeichenfläche, mit ihren Agenten, Aufrufen und der Delegationstiefe."
  },
  "canvas": {
   "title": "Die App des Entwurfs als bearbeitbarer Graph. Jede Änderung wird sofort im Entwurf gespeichert; live geht erst etwas, wenn der Entwurf angewendet wird.",
   "appPicker": "Die App, die die Zeichenfläche zeigt, wenn der Entwurf mehr als eine enthält.",
   "node": "Ein Agent der App. Ziehen Sie ihn, um ihn zu verschieben, ziehen Sie von seinem rechten Rand, um ihn zu verbinden, oder fokussieren Sie ihn und verwenden Sie die Tastenkürzel.",
   "nodeReadOnly": "Ein Agent der App. Der Entwurf kann gerade nicht geändert werden, daher ist die Zeichenfläche schreibgeschützt.",
   "addAgent": "Geben Sie den Namen eines Agenten ein oder wählen Sie einen aus den Agenten des Mandanten und des Entwurfs, und drücken Sie dann die Eingabetaste.",
   "role": "Eine optionale Notiz dazu, was dieser Agent in der App tut, gespeichert mit seiner Mitgliedschaft.",
   "add": "Den Agenten zum Mitglied von {{app}} machen. Das erste Mitglied wird zum Einstiegsagenten.",
   "connect": "Einen Aufruf von {{name}} aus beginnen und dann den Agenten wählen, den er aufruft.",
   "needAgent": "Wählen Sie zuerst einen Agenten auf der Zeichenfläche aus.",
   "needCall": "Wählen Sie zuerst einen Aufruf aus: Klicken Sie ihn auf der Zeichenfläche an oder wählen Sie ihn in der Liste der Aufrufe.",
   "alreadyEntry": "{{name}} ist bereits der Einstiegsagent.",
   "setEntry": "Den ausgewählten Agenten zu dem machen, der mit den Personen spricht, die die App nutzen.",
   "remove": "Den ausgewählten Agenten nach einer Bestätigung samt seinen Aufrufen aus der App nehmen.",
   "disconnect": "Den ausgewählten Aufruf löschen. Die beiden Agenten bleiben in der App.",
   "fit": "Zoomen und verschieben, sodass jeder Agent der App sichtbar ist.",
   "connectTo": "Der Agent, den der Aufrufer aufrufen darf.",
   "fanOut": "Ein: Der Aufrufer darf mehrere Aufrufe an diesen Agenten gleichzeitig starten (Fan-out). Aus: ein Aufruf zur Zeit.",
   "connectConfirm": "{{from}} erlauben, {{to}} aufzurufen, und den Aufruf im Entwurf speichern.",
   "connectNoTarget": "Es gibt in der App noch keinen anderen Agenten, der aufgerufen werden kann.",
   "connectCancel": "Das Verbinden beenden, ohne einen Aufruf hinzuzufügen.",
   "keys": "Die Tasten anzeigen, die auf der Zeichenfläche funktionieren.",
   "calls": "Jeder Aufruf der App in Worten. Mit diesen Schaltflächen wählen und ändern Sie Aufrufe per Tastatur.",
   "call": "Diesen Aufruf auswählen. Entf trennt ihn, F schaltet parallele Aufrufe ein oder aus.",
   "callReadOnly": "Diesen Aufruf auswählen, um seine Eigenschaften zu sehen. Der Entwurf kann gerade nicht geändert werden.",
   "addLoose": "{{name}} zum Mitglied von {{app}} machen, damit er verbunden werden kann.",
   "retry": "Die abgelehnte Änderung erneut senden, auf der gerade gelesenen Version des Entwurfs.",
   "dismissError": "Diese Meldung über die abgelehnte Änderung ausblenden.",
   "panel": {
    "properties": "Das eigene Dokument des Agenten: Beschreibung, Schemas, Assets und Fähigkeiten.",
    "runtime": "Die Bereitstellungen des Agenten in jeder Umgebung: Modell, Limits, Prompt und Freigaben.",
    "save": "Diese Felder in das Element des Entwurfs schreiben, auf der Version, die Sie gelesen haben. Nichts geht live.",
    "reset": "Zu den Werten zurückkehren, die der Entwurf jetzt enthält.",
    "nothingToSave": "Noch nichts geändert, daher gibt es nichts zu speichern.",
    "nothingToReset": "Noch nichts geändert, daher gibt es nichts zu verwerfen."
   },
   "agent": {
    "title": "Felder des Agenten-Dokuments in diesem Entwurf. Beim Speichern wird sein Agent-Element neu geschrieben.",
    "bring": "Das Live-Dokument des Agenten (oder ein neues) in den Entwurf kopieren, damit Sie es bearbeiten können.",
    "description": "Was der Agent tut, angezeigt für Personen und für Agenten, die ihn aufrufen.",
    "inputSchema": "Ein JSON Schema, dem die Eingabe des Agenten entsprechen muss. Leer bedeutet reine Texteingabe.",
    "outputSchema": "Ein JSON Schema, dem die strukturierte Ausgabe des Agenten folgt. Leer bedeutet keine strukturierte Ausgabe.",
    "assets": "Agenten-Assets (Skills, Referenzen, Vorlagen), die die nächste Revision festlegt, nach Name und optionaler Version.",
    "assetName": "Der Name des Agenten-Assets in diesem Mandanten.",
    "assetVersion": "Eine festzulegende Version. Leer folgt der neuesten Version des Assets.",
    "removeAsset": "Diese Festlegung beim Speichern aus der nächsten Revision des Agenten entfernen.",
    "addAsset": "Ein weiteres Agenten-Asset für die nächste Revision des Agenten festlegen.",
    "capabilities": "Fähigkeiten, die der Agent nutzt, etwa Host-Werkzeuge, die ein Worker haben muss (pandoc, git).",
    "systemPrompt": "Der System-Prompt wird je Bereitstellung festgelegt, damit jede Umgebung ihren eigenen verwenden kann.",
    "showRuntime": "Die Bereitstellungen des Agenten öffnen, wo der System-Prompt und seine Version bearbeitet werden."
   },
   "edge": {
    "title": "Der ausgewählte Aufruf: wer wen aufruft, Fan-out und die Delegationstiefe, die er braucht.",
    "from": "Der Agent, der diesen Aufruf macht.",
    "to": "Der Agent, den dieser Aufruf erreicht.",
    "depth": "Wie viele Delegationsebenen der Aufrufer für diesen Aufruf braucht, aus dem Graphen ermittelt."
   },
   "app": {
    "title": "Felder des App-Dokuments in diesem Entwurf. Beim Speichern wird sein AgenticApp-Element neu geschrieben.",
    "entry": "Das Mitglied, das mit den Personen spricht, die die App nutzen. Eine Änderung wird sofort gespeichert.",
    "bring": "Das Live-Dokument der App in den Entwurf kopieren, damit Sie Anmeldung und Erscheinungsbild bearbeiten können.",
    "description": "Wofür die App da ist, angezeigt in der App-Liste der Konsole.",
    "authMode": "Wer sich bei der App anmelden darf: Mandantenbenutzer, App-Benutzer oder alle (anonym).",
    "anonymous": "Personen die App ohne Anmeldung nutzen lassen, wenn der Anmeldemodus das zulässt.",
    "branding": "Wie die Chat-Seite der App für die Personen aussieht, die sie nutzen.",
    "brandingFields": {
     "displayName": "Der Name in der Kopfzeile der App. Leer verwendet den Namen der App.",
     "logo": "Ein Agenten-Asset, dessen erstes Bild zum Logo der App wird.",
     "primaryColor": "Die Hauptfarbe der App-Seite, als Hex-Wert.",
     "accentColor": "Die zweite Farbe der App-Seite, als Hex-Wert.",
     "welcomeText": "Das Erste, was Personen lesen, wenn sie die App öffnen."
    }
   },
   "runtime": {
    "title": "Die Bereitstellungen des Agenten in diesem Entwurf, eine Umgebung nach der anderen.",
    "deployment": "Die Bereitstellung der Umgebung wählen, die Sie bearbeiten möchten. Beim Speichern ändert sich nur das Element dieser Bereitstellung.",
    "live": "Bereitstellungen dieses Agenten, die jetzt laufen, aber nicht im Entwurf sind. Holen Sie eine herein, um sie zu ändern.",
    "bring": "Das Live-Dokument von {{name}} als neues Element in den Entwurf kopieren.",
    "approvals": "Ob Werkzeugaufrufe der Läufe dieser Bereitstellung auf eine Person warten, und die Regeln, die zuerst entscheiden.",
    "fields": {
     "model": "Das Modell, das der Harness verwendet, zum Beispiel sonnet. Leer verwendet den Standard des Harness-Profils.",
     "effort": "Der Denkaufwand, den der Harness weitergibt, zum Beispiel high. Leer überlässt es dem Harness.",
     "timeoutSeconds": "Wie lange ein Lauf dauern darf, bevor er gestoppt wird, in Sekunden.",
     "maxTurns": "Wie viele Modellrunden ein Lauf haben darf, bevor er stoppt.",
     "maxBudgetUsd": "Wie viel ein Lauf in US-Dollar kosten darf, bevor der Harness ihn stoppt.",
     "systemTemplate": "Die Prompt-Vorlage, die als System-Prompt dient, nach Name. Leer verwendet den integrierten Standard.",
     "systemVersion": "Eine festzulegende Version dieser Vorlage. Leer folgt ihrer neuesten Version.",
     "approvalsEnabled": "Ein: Werkzeugaufrufe, die keine Regel erlaubt, warten in Freigaben auf eine Person.",
     "approvalDefaultAction": "Was mit einem Werkzeugaufruf passiert, auf den keine Regel passt: zulassen, ablehnen oder eine Person fragen."
    },
    "rule": {
     "action": "Was diese Regel mit einem passenden Werkzeugaufruf macht.",
     "pattern": "Auf welche Werkzeugaufrufe die Regel passt, zum Beispiel Bash(git *).",
     "inputPattern": "Ein optionales Muster, dem die Eingabe des Werkzeugaufrufs zusätzlich entsprechen muss.",
     "remove": "Diese Regel beim Speichern löschen.",
     "add": "Eine Regel hinzufügen; Regeln werden der Reihe nach geprüft, und die erste passende entscheidet."
    }
   }
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
})(tips, {
 "nav": {
  "brand": "Garrison Agent Studio: agentische Apps mit den Agent-Harnesses bauen, bereitstellen und betreiben, die Sie bereits nutzen.",
  "tabs": {
   "serverInfo": "Über Garrison Agent Studio: Server- und Dashboard-Version, Links zur Dokumentation und zur Webseite, die REST-, MCP- und A2A-Adressen und die Identität, mit der Sie angemeldet sind."
  }
 },
 "common": {
  "openStudio": "Das Agenten-Studio öffnen, wo der Agenten-Architekt mit Ihnen Agenten und Apps entwirft. Nichts geht live, bevor eine Person den Entwurf genehmigt."
 },
 "wizard": {
  "start": "Einrichtung beginnen: Zugangsdaten hinzufügen, den Agenten-Architekten einrichten, einen Beispielagenten anwenden und testen.",
  "skipStudio": "Ohne Architekten fortfahren. Sie können später im Agenten-Studio mit Neuer Architekt einen erstellen.",
  "createArchitect": "Eine Bereitstellung von agent-architect mit dieser Auswahl erstellen und zum nächsten Schritt gehen. Ihre Läufe dürfen nur Ihre Studio-Entwürfe bearbeiten.",
  "continue": "Der Architekt existiert bereits. Weiter zum nächsten Schritt der Einrichtung."
 },
 "views": {
  "home": {
   "openStudio": "Das Agenten-Studio öffnen und die gewünschte App beschreiben; der Agenten-Architekt entwirft sie, und eine Person genehmigt sie, bevor sie live geht."
  },
  "studioDraft": {
   "tabs": {
    "release": "Die Apps dieses Entwurfs nach dem Anwenden: ihre Bereitstellungen pro Umgebung, Hochstufung von dev nach staging und prod und Zurücksetzen aus dem Verlauf."
   }
  },
  "serverInfo": {
   "product": "Das Produkt, zu dem diese Konsole gehört: Das Agenten-Studio baut agentische Apps auf der Garrison-Laufzeit.",
   "docs": "Die Garrison-Dokumentation in einem neuen Tab öffnen: Architektur, Konfiguration, Harnesses, das Studio, Apps und Sicherheit.",
   "studioDocs": "Den Leitfaden zum Agenten-Studio in einem neuen Tab öffnen: Entwürfe, der Agenten-Architekt, das Anwenden eines Entwurfs und die Hochstufung.",
   "website": "usegarrison.ai in einem neuen Tab öffnen: Produktüberblick, Screenshots und Anleitungen.",
   "source": "Das Garrison-Repository auf GitHub in einem neuen Tab öffnen: Quellcode, Issues und Releases."
  }
 },
 "resources": {
  "apps": {
   "actions": {
    "environments": "Die Bereitstellungen der App pro Umgebung mit festgelegten Revisionen und Überschreibungen ansehen, sie in die nächste Umgebung hochstufen und eine Hochstufung zurücksetzen."
   }
  }
 },
 "apps": {
  "release": {
   "live": "Die Umgebung, deren Einstiegsbereitstellung die App-URL nutzt: {{environment}}. Ändern Sie sie im Schritt Umgebungen der App.",
   "environments": "Die Bereitstellungen jedes Mitglieds in jeder Umgebung: die festgelegte Revision (Neueste, wenn sie der neuesten veröffentlichten folgt) und die Umgebungsüberschreibungen.",
   "source": "Die Umgebung, von der aus verglichen wird, meist die, in der Sie getestet haben. Dort beginnt auch das Hochstufen.",
   "target": "Die Umgebung, mit der verglichen und in die hochgestuft wird. Lassen Sie die nächste Umgebung stehen, um der Reihenfolge zu folgen.",
   "promote": "Den Hochstufungsdialog für {{source}} nach {{target}} öffnen: Die festgelegte Revision jedes Mitglieds geht in einer Transaktion an seine Bereitstellungen in {{target}}.",
   "noNext": "Nach {{source}} gibt es keine Umgebung, also nichts, wohin hochgestuft werden kann.",
   "denied": "Dafür brauchen Sie die Berechtigung Ausführen auf Hochstufung für {{environment}}. Bitten Sie einen Administrator um die Rolle Releaser.",
   "noDeployment": "Dieses Mitglied hat keine Bereitstellung in {{environment}}. Ein Hochstufen nach {{environment}} schlägt fehl, bis es eine hat.",
   "overrides": "Umgebungsüberschreibungen dieser Bereitstellung: Variablen für ihre Läufe. Geheime Werte werden nie angezeigt.",
   "entry": "Der Einstiegsagent: Wer die App nutzt, spricht zuerst mit diesem Mitglied.",
   "history": "Jede Hochstufung und jedes Zurücksetzen dieser App, die neuesten zuerst. Eine angewendete Hochstufung lässt sich einmal zurücksetzen; das stellt die ersetzten Festlegungen wieder her.",
   "refresh": "Die Bereitstellungen und den Hochstufungsverlauf dieser App erneut lesen.",
   "columns": {
    "member": "Die Mitgliedsagenten der App, der Einstiegsagent zuerst.",
    "environment": "Bereitstellungen jedes Mitglieds in {{environment}}, mit festgelegter Revision und Umgebungsüberschreibungen.",
    "difference": "Ob Festlegungen und Überschreibungen jedes Mitglieds zwischen den beiden verglichenen Umgebungen übereinstimmen."
   },
   "diff": {
    "Same": "Festgelegte Revisionen und Überschreibungen in {{source}} und {{target}} stimmen überein.",
    "Differs": "Festgelegte Revisionen oder Überschreibungen unterscheiden sich zwischen {{source}} und {{target}}. Hochstufen verschiebt die Festlegungen; jede Bereitstellung behält ihre Überschreibungen.",
    "Missing": "Dieses Mitglied hat keine Bereitstellung in {{target}}. Ein Hochstufen aus {{source}} würde fehlschlagen und nichts verschieben."
   }
  }
 },
 "studio": {
  "release": {
   "title": "Die Apps dieses Entwurfs aus der Live-Konfiguration: Bereitstellungen pro Umgebung, Hochstufen und Zurücksetzen.",
   "app": "Wählen Sie, welche App des Entwurfs angezeigt wird, wenn er mehr als eine baut."
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
})(tips, {
 "nav": {
  "tabs": {
   "architects": "Agenten-Architekten, die Sie in jedem Studio-Entwurf wiederverwenden können: erstellen, bearbeiten und löschen Sie sie, und wählen Sie Harness-Profil, Modell und Prompt für jeden."
  }
 },
 "resources": {
  "architects": {
   "add": "Einen Agenten-Architekten erstellen: eine Bereitstellung von agent-architect, die nur Ihre Studio-Entwürfe bearbeitet und sie nie anwendet.",
   "harnessProfileId": "Das Harness-Profil, auf dem der Architekt läuft. Es bestimmt die Agenten-CLI, die er verwendet (Claude Code, Codex usw.).",
   "model": "Das Modell, das der Architekt beim Harness anfordert. Leer verwendet das Standardmodell des Harness-Profils.",
   "architectPromptTemplateId": "Die System-Vorlage, die dem Architekten sagt, wie er arbeitet. Die integrierten Prompts stehen zuerst; klonen Sie einen, um ihn zu ändern.",
   "architectPromptVersion": "Den Architekten auf eine Version seines Prompts festlegen. Leer folgt der aktuellen Version, sodass eine gespeicherte Änderung ab seinem nächsten Zug gilt.",
   "defaultModel": "Es ist kein Modell gesetzt, daher verwendet der Architekt das Standardmodell des Harness-Profils.",
   "defaultBadge": "Dieser Architekt verwendet den integrierten Standard-Prompt builtin/agent-architect.",
   "activeBadge": "Aktiv: Entwürfe können neue Unterhaltungen mit diesem Architekten beginnen.",
   "inactiveBadge": "Inaktiv: Der Architekt nimmt keine neuen Züge an, und Entwürfe bieten ihn nicht an, bis Sie ihn wieder aktivieren.",
   "actions": {
    "prompts": "Die Architekten-Prompts verwalten: den Prompt dieses Architekten wählen sowie Prompts klonen, bearbeiten, zurücksetzen oder löschen.",
    "deployment": "Die Bereitstellung hinter diesem Architekten öffnen, um Limits, Executor, Egress-Regeln und weitere Einstellungen zu ändern."
   }
  }
 },
 "studio": {
  "chat": {
   "manageArchitects": "Agenten > Architekten öffnen, um die Architekten zu erstellen, zu bearbeiten oder zu löschen, die jeder Entwurf verwenden kann."
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
})(tips, {
 "confirm": {
  "typeToConfirm": "Geben Sie {{word}} genau so ein, um die Schaltfläche Löschen zu aktivieren. So löscht ein versehentlicher Klick nichts, was sich nicht wiederherstellen lässt.",
  "typeFirst": "Geben Sie zuerst {{word}} in das Feld ein. Die Schaltfläche bleibt aus, bis das Wort übereinstimmt."
 },
 "resources": {
  "agents": {
   "protected": "{{name}} ist ein geschützter integrierter Agent, den Garrison in jedem Mandanten anlegt; er kann nicht geändert oder gelöscht werden."
  }
 },
 "views": {
  "agentDetail": {
   "delete": "Diesen Agenten mit seinen Bereitstellungen und seinem Revisionsverlauf löschen. Sie bestätigen durch Eingabe von delete; ein Trigger, eine Pipeline, eine App oder ein Benachrichtigungsendpunkt, der ihn verwendet, verhindert das Löschen."
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
})(tips, {
 "studio": {
  "architect": {
   "credentialSecretId": "Das Geheimnis, mit dem sich das Harness des Architekten anmeldet: ein Anthropic-API-Schlüssel oder ein Claude-Code-OAuth-Token für Claude Code, ein OpenAI-API-Schlüssel oder eine ChatGPT-Anmeldung für Codex usw. Garrison bindet es an die Bereitstellung des Architekten."
  },
  "chat": {
   "fixCredential": "Agenten > Architekten gefiltert auf diesen Architekten öffnen, ihn dann bearbeiten und sein Zugangsdaten-Geheimnis wählen.",
   "openSecrets": "Konfiguration > Geheimnisse öffnen, um den API-Schlüssel oder das Token hinzuzufügen oder den Wert des verwendeten zu prüfen."
  }
 },
 "resources": {
  "architects": {
   "credentialSecretId": "Das Geheimnis, mit dem sich das Harness des Architekten anmeldet: ein Anthropic-API-Schlüssel oder ein Claude-Code-OAuth-Token für Claude Code, ein OpenAI-API-Schlüssel oder eine ChatGPT-Anmeldung für Codex usw. Garrison bindet es an die Bereitstellung des Architekten.",
   "credentialCell": "Das Geheimnis, mit dem sich das Harness dieses Architekten anmeldet ({{kind}}).",
   "noCredential": "Kein Zugangsdaten-Geheimnis gebunden, daher scheitern Harnesses, die eines brauchen (Claude Code, Codex, Gemini CLI), mit Not logged in. Bearbeiten Sie den Architekten, um eines zu wählen."
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
})(tips, {
 "dependencyHint": {
  "refresh": "Diese Liste erneut lesen, zum Beispiel nachdem Sie auf einer anderen Seite einen Eintrag angelegt haben.",
  "open": "Öffnet {{page}} in einem neuen Tab, damit dieses Formular Ihre Eingaben behält. Kommen Sie danach hierher zurück; die Liste wird aktualisiert."
 }
});
