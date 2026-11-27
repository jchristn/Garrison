// German catalog for the Garrison dashboard. Mirrors every key in en.js.

import { tips, explainers } from './de.tips.js';

const rp = (title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody) => ({ title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody });

const de = {
  processSecurity: { trustedOnly: "Process-Ausführung: nur für vertrauenswürdige Aufgaben. Läufe teilen Benutzer, Dateisystem und Netzwerk des Workers und können auf andere Läufe und Worker-Zugangsdaten zugreifen. Für nicht vertrauenswürdige Eingaben KubernetesJob verwenden." },
  common: {
    eventCodes: { ApprovalRequested: 'Freigabe angefordert', ApprovalDecided: 'Freigabe entschieden', StructuredOutputInvalid: 'Strukturierte Ausgabe ungültig', RunBlocked: 'Lauf blockiert', EventsDropped: 'Ereignisse verworfen', HarnessExited: 'Harness beendet', McpPreflightWarning: 'Warnung der MCP-Vorabprüfung', McpPreflightPassed: 'MCP-Vorabprüfung bestanden', RepairAttemptStarted: 'Reparatur der Ausgabe gestartet', WorkspacePrepared: 'Arbeitsbereich vorbereitet', RunGuardTriggered: 'Laufwächter hat den Lauf gestoppt', ConversationFallback: 'Konversation neu aufgebaut', ConversationResumed: 'Konversation fortgesetzt', ConversationStateLost: 'Konversationszustand verloren' },
    fieldCodes: { ExpiryInPast: 'Wählen Sie einen Zeitpunkt in der Zukunft.', ParameterInvalid: 'Dieser Wert ist für diesen Parameter ungültig.', ParameterNotAllowed: 'Diese Bereitstellung erlaubt Aufrufern nicht, diesen Parameter zu überschreiben.', SettingsFileReadOnly: 'Die Einstellungsdatei ist schreibgeschützt, daher kann diese Änderung nicht gespeichert werden.', OverriddenByEnvironment: 'Eine Umgebungsvariable setzt diesen Wert, daher kann er hier nicht geändert werden.', PathRequired: 'Ein Einstellungspfad ist erforderlich.', UnknownSetting: 'Diese Einstellung gibt es auf diesem Server nicht.', TooLong: 'Dieser Wert ist zu lang.', NotAllowedValue: 'Wählen Sie einen der zulässigen Werte.', NotABoolean: 'Wählen Sie wahr oder falsch.', NotAnInteger: 'Geben Sie eine ganze Zahl ein.', OutOfRange: 'Der Wert liegt außerhalb des zulässigen Bereichs.' },
    serverText: {
      approvalWaitingExpires: 'Wartet auf die Freigabe von {{subject}} durch eine Person; Freigabe {{id}} läuft um {{expires}} ab.',
      approvalWaiting: 'Wartet auf die Freigabe von {{subject}} durch eine Person; Freigabe {{id}}.',
      notApplied: 'Nicht angewendet, weil ein anderes Dokument die Prüfung nicht bestanden hat.',
      wouldBeUnchanged: 'Bereits aktuell; nichts würde sich ändern.',
      wouldBeUpdated: 'Würde aktualisiert.',
      wouldBeCreated: 'Würde erstellt.',
      inUse: '{{what}} ist noch an diese Bereitstellungen gebunden: {{deployments}}. Entfernen Sie zuerst die Bindungen.',
      noActiveDeployment: 'Der Agent {{agent}} hat keine aktive Bereitstellung mit einer Gewichtung über null. Fügen Sie eine Bereitstellung hinzu oder erhöhen Sie eine Gewichtung und versuchen Sie es erneut.',
      toolCallDenied: 'Toolaufruf abgelehnt: {{id}}',
      threadStarted: 'Thread gestartet.',
      runStartedModel: 'Lauf gestartet ({{model}}).',
      runStarted: 'Lauf gestartet.',
      sessionInitializedModel: 'Sitzung initialisiert ({{model}}).',
      sessionInitialized: 'Sitzung initialisiert.',
      harnessFailed: 'Die Harness hat einen Fehler gemeldet.',
      exitedNoResult: 'Harness mit Code {{code}} ohne Endergebnis beendet.',
      harnessExited: 'Harness beendet: {{status}} ({{outcome}}).',
      harnessExitedCode: 'Harness beendet mit Code {{code}}: {{status}} ({{outcome}}).',
      mcpPreflight: 'MCP-Vorabprüfung bestanden. Geprüfte Server: {{count}}.',
      repairAttempt: 'Reparaturversuch {{attempt}} für strukturierte Ausgabe: Die Harness-Sitzung wird in {{path}} fortgesetzt.',
      workspacePrepared: 'Arbeitsbereich vorbereitet unter {{path}}.',
      guardRepetitionUnit: 'Wiederholungswächter: Die letzten {{window}} Zeichen des Assistententexts bestehen aus der {{size}} Zeichen langen Einheit „{{unit}}“, {{count}}-mal wiederholt.',
      guardDegenerate: 'Wiederholungswächter: Die letzten {{window}} Zeichen des Assistententexts enthalten keine Buchstaben oder Ziffern (nur Leerraum, Satzzeichen oder Symbole) und enden mit „{{tail}}“.',
      guardNoProgress: 'Der Lauf hat {{seconds}} Sekunden lang keinen Fortschritt gemacht (kein Assistententext, kein Denken, kein Toolaufruf oder Toolergebnis und kein offener Toolaufruf); sein Limit noProgressSeconds ist {{limit}}.',
      guardOutputLimit: 'Der Assistententext hat das Limit maxAssistantChars des Laufs von {{limit}} Zeichen überschritten.',
      valueClamped: 'Der Wert {{given}} für {{field}} liegt außerhalb des zulässigen Bereichs {{minimum}} bis {{maximum}}; gespeichert wurde {{stored}}.'
    },
    appName: 'Garrison',
    language: { label: 'Sprache' },
    theme: { switchToLight: 'Zum hellen Design wechseln', switchToDark: 'Zum dunklen Design wechseln' },
    actions: {
      apply: 'Anwenden',
      back: 'Zurück',
      cancel: 'Abbrechen',
      clear: 'Leeren',
      clone: 'Klonen',
      close: 'Schließen',
      confirm: 'Bestätigen',
      copied: 'Kopiert',
      copy: 'Kopieren',
      delete: 'Löschen',
      duplicate: 'Duplizieren',
      edit: 'Bearbeiten',
      hide: 'Wert ausblenden',
      logout: 'Abmelden',
      next: 'Weiter',
      openGithub: 'Garrison-Repository auf GitHub öffnen',
      remove: 'Entfernen',
      retry: 'Erneut versuchen',
      reveal: 'Wert anzeigen',
      save: 'Speichern',
      view: 'Anzeigen',
      viewDetails: 'Details anzeigen',
      viewJson: 'JSON anzeigen'
    },
    boolean: { yes: 'Ja', no: 'Nein' },
    confirm: {
      deleteNamed: '"{{name}}" löschen? Dies kann nicht rückgängig gemacht werden.',
      bulkDelete: '{{count}} ausgewählte Datensätze löschen? Dies kann nicht rückgängig gemacht werden.'
    },
    errors: {
      listItem: 'Eintrag {{index}}: {{message}}',
      chooseOne: 'Wählen Sie mindestens eine Option.',
      fixFields: 'Einige Felder müssen korrigiert werden. Prüfen Sie die markierten Werte.',
      invalidEmail: 'Geben Sie eine gültige E-Mail-Adresse ein.',
      invalidJson: 'Dies ist kein gültiges JSON.',
      loadFailed: 'Daten konnten nicht geladen werden.',
      requestId: 'Anfrage {{id}}.',
      required: 'Dieses Feld ist erforderlich.',
      requiredPermission: 'Erfordert {{permission}} für {{resource}}.'
    },
    generic: {
      deletedName: '{{name}} (gelöscht)',
      actions: 'Aktionen',
      active: 'Aktiv',
      all: 'Alle',
      any: 'Beliebig',
      builtIn: 'Integriert',
      custom: 'Benutzerdefiniert',
      inactive: 'Inaktiv',
      loading: 'Wird geladen...',
      never: 'Nie',
      none: 'Keine',
      notAvailable: 'k. A.',
      saving: 'Wird gespeichert...'
    },
    relativeTime: { now: 'gerade eben' },
    states: {
      forbiddenTitle: 'Sie haben keinen Zugriff auf diese Seite',
      forbiddenBody: 'Bitten Sie eine Administratorin oder einen Administrator um eine passende Rolle, oder wählen Sie eine andere Seite.',
      unavailableTitle: 'Auf diesem Server noch nicht verfügbar',
      unavailableBody: 'Der Server stellt die Endpunkte für {{resource}} nicht bereit. Aktualisieren Sie den Server oder prüfen Sie im API-Explorer, was unterstützt wird.'
    },
    toasts: {
      bulkDeleted: '{{count}} Datensätze gelöscht ({{failed}} fehlgeschlagen).',
      cloned: 'Geklont.',
      created: 'Erstellt.',
      deleted: 'Gelöscht.',
      saved: 'Gespeichert.'
    },
    units: { msShort: 'ms', sShort: 's', mShort: 'Min.', tokPerSec: 'Tok./s' }
  },
  errorCodes: {
    ApprovalNotPending: 'Diese Freigabe wurde bereits entschieden und kann nicht erneut entschieden werden.',
    MessageIdConflict: 'Diese A2A-Nachrichten-ID wurde bereits mit anderem Inhalt verwendet. Senden Sie die Nachricht mit einer neuen ID.',
    IdempotencyKeyConflict: 'Dieser Idempotenzschlüssel wurde bereits für eine andere Anfrage verwendet. Verwenden Sie einen neuen Schlüssel.',
    DeploymentDeleted: 'Die Bereitstellung dieses Laufs wurde gelöscht, daher kann der Lauf nicht wiederholt werden. Rufen Sie den Agenten stattdessen erneut auf.',
    AgentDeleted: 'Der Agent dieses Laufs wurde gelöscht, daher kann der Lauf nicht wiederholt werden.',
    NoActiveDeployment: 'Dieser Agent hat keine aktive Bereitstellung mit einer Gewichtung über null. Fügen Sie eine Bereitstellung hinzu oder erhöhen Sie eine Gewichtung.',
    TenantNotFound: 'Dieser Mandant existiert nicht. Prüfen Sie die Mandanten-ID.',
    NetworkError: 'Der Server ist nicht erreichbar. Prüfen Sie die Server-URL und ob der Server läuft.',
    AuthenticationRequired: 'Ihre Sitzung ist abgelaufen. Melden Sie sich erneut an.',
    InvalidCredentials: 'Mandant, E-Mail, Passwort oder Schlüssel sind falsch.',
    RateLimited: 'Zu viele Anmeldeversuche. Warten Sie eine Minute und versuchen Sie es erneut.',
    AuthorizationDenied: 'Sie haben keine Berechtigung für diese Aktion.',
    NotFound: 'Der Datensatz wurde nicht gefunden.',
    RouteNotFound: 'Dieser Server unterstützt diesen Endpunkt nicht.',
    ValidationFailed: 'Einige Werte sind ungültig.',
    InvalidBody: 'Der Anfragetext ist ungültig.',
    InvalidJson: 'Der Anfragetext ist kein gültiges JSON.',
    Conflict: 'Dies steht im Konflikt mit einem vorhandenen Datensatz.',
    BuiltInImmutable: 'Integrierte Datensätze können nicht geändert werden. Klonen Sie sie zum Anpassen.',
    Protected: 'Dieser Datensatz ist geschützt und kann nicht gelöscht werden.',
    StaleLease: 'Die Lease des Laufs wird von diesem Knoten nicht mehr gehalten.',
    InternalError: 'Interner Serverfehler. Prüfen Sie die Serverprotokolle mit der Anfrage-ID.',
    Http400: 'Die Anfrage wurde als ungültig abgelehnt.',
    Http403: 'Sie haben keine Berechtigung für diese Aktion.',
    Http404: 'Nicht gefunden.',
    Http409: 'Konflikt mit dem aktuellen Zustand.',
    Http500: 'Interner Serverfehler.',
    Http503: 'Der Server ist nicht verfügbar.',
    ConversationBusy: 'Diese Konversation arbeitet noch an ihrer vorherigen Runde. Warten Sie, bis dieser Lauf endet, oder brechen Sie ihn ab, und versuchen Sie es dann erneut.',
    ConversationAgentMismatch: 'Diese Konversation gehört zu einem anderen Agenten. Senden Sie die Runde an diesen Agenten oder beginnen Sie eine neue Konversation.',
    ConversationDeploymentMismatch: 'Jede Runde einer Konversation läuft auf der Bereitstellung ihrer ersten Runde. Lassen Sie die Bereitstellung leer oder beginnen Sie eine neue Konversation.',
    ConversationDeploymentUnavailable: 'Die Bereitstellung dieser Konversation wurde gelöscht, daher kann die Konversation nicht weitergehen. Beginnen Sie eine neue Konversation.'
  },
  enums: {
    approvalStatus: {
      Pending: 'Ausstehend',
      Approved: 'Erlaubt',
      Denied: 'Verweigert',
      Expired: 'Abgelaufen',
      Cancelled: 'Abgebrochen'
    },
    approvalDecision: {
      Allow: 'Erlauben',
      Deny: 'Verweigern'
    },
    approvalSource: {
      DurableResume: "Übernommene Genehmigung",
      Rule: 'Regel',
      Default: 'Standard der Bereitstellung',
      User: 'Durch eine Person',
      Timeout: 'Zeitüberschreitung',
      Cancelled: 'Lauf gestoppt'
    },
    approvalRuleAction: {
      Allow: 'Erlauben',
      Deny: 'Verweigern',
      Ask: 'Person fragen'
    },
    approvalKind: {
      Tool: 'Werkzeugaufruf',
      Command: 'Befehl',
      FileChange: 'Dateiänderung'
    },
    principalType: { Administrator: 'Systemadministrator', User: 'Benutzer', Credential: 'Zugriffsschlüssel', Run: 'Lauf-Token' },
    runBlockedReason: { NoReadyWorker: 'Kein bereiter Worker', NoCapableWorker: 'Kein passender Worker', NoMatchingPool: 'Kein passender Pool' },
    promptDelivery: { Stdin: 'Standardeingabe', Argument: 'Befehlszeilenargument', File: 'Datei', CodexAppServer: 'Codex-App-Server (JSON-RPC)' },
    systemPromptDelivery: {
      File: 'Datei',
      Argument: 'Befehlszeilenargument',
      Environment: 'Umgebungsvariable',
      PrependToPrompt: 'Dem Prompt vorangestellt',
      None: 'Nicht übergeben'
    },
    mcpConfigFormat: {
      None: 'Keine MCP-Konfiguration',
      ClaudeJson: 'Claude Code JSON',
      CodexToml: 'Codex TOML',
      MuxJson: 'Mux JSON',
      GeminiSettings: 'Gemini CLI-Einstellungen'
    },
    outputParser: {
      ClaudeStreamJson: 'Claude Code Stream-JSON',
      CodexJsonl: 'Codex JSONL',
      CodexAppServer: 'Codex-App-Server-JSON-RPC',
      MuxJsonl: 'Mux JSONL',
      GeminiStreamJson: 'Gemini CLI Stream-JSON',
      GenericJsonl: 'Generisches JSONL',
      PlainText: 'Klartext'
    },
    resultSource: { ParserFinalEvent: 'Letztes Parser-Ereignis', LastMessageFile: 'Datei mit letzter Nachricht', Stdout: 'Stdout' },
    successPolicy: { FinalEvent: 'Abschlussereignis', ExitCode: 'Exit-Code', FinalEventAndExitCode: 'Abschlussereignis und Exit-Code' },
    fileBaseDirectory: { Config: 'Konfigurationsverzeichnis', Workspace: 'Arbeitsbereich', Home: 'Home-Verzeichnis' },
    artifactStoreKind: { Database: 'Datenbank', Filesystem: 'Dateisystem', S3: 'S3' },
    agentInputMode: { Text: 'Freitext', Structured: 'Strukturiertes JSON' },
    argumentOverrideOperation: { Append: 'Anhängen', Prepend: 'Voranstellen', Remove: 'Entfernen', Replace: 'Ersetzen' },
    runOverrideValidation: { Any: 'Beliebiger Wert', Enum: 'Wert aus einer Liste', Regex: 'Regulärer Ausdruck', IntegerRange: 'Ganzzahlbereich' },
    credentialAuthMode: { DirectHeader: 'Direkte Header', SignedRequest: 'Signierte Anfragen', SessionExchange: 'Sitzungstoken-Austausch', Hybrid: 'Beliebige Methode' },
    operationType: {
      All: 'Alle Operationen',
      Create: 'Erstellen',
      Read: 'Lesen',
      Write: 'Schreiben',
      Update: 'Aktualisieren',
      Delete: 'Löschen',
      Execute: 'Ausführen',
      Admin: 'Verwalten'
    },
    usageQuotaScope: {"Tenant": "Mandant", "Agent": "Agent", "Deployment": "Bereitstellung"},
    resourceType: {
      All: 'Alle Ressourcen',
      Account: 'Konto',
      Tenant: 'Mandant',
      Admin: 'Systemverwaltung',
      User: 'Benutzer',
      Credential: 'Zugriffsschlüssel',
      Session: 'Sitzung',
      Role: 'Rolle',
      Permission: 'Berechtigung',
      Assignment: 'Zuweisung',
      Audit: 'Audit-Protokoll',
      RequestHistory: 'Anfrageverlauf',
      Settings: 'Einstellungen',
      HarnessProfile: 'Harness-Profil',
      PromptTemplate: 'Prompt-Vorlage',
      Agent: 'Agent',
      Deployment: 'Bereitstellung',
      McpServer: 'MCP-Server',
      Secret: 'Geheimnis',
      Workspace: 'Arbeitsbereich',
      ArtifactStore: 'Artefaktspeicher',
      ModelPrice: "Modellpreis",
      UsageQuota: "Nutzungskontingent",
      Run: 'Lauf',
      Node: 'Knoten',
      NodePool: 'Knotenpool',
      Manifest: 'Manifest',
      Conversation: 'Unterhaltung',
      Approval: 'Freigabe',
      Artifact: 'Artefakt'
    },
    runStatus: {
      Pending: 'Ausstehend',
      Queued: 'In Warteschlange',
      Leased: 'Zugewiesen',
      Running: 'Läuft',
      Cancelling: 'Wird abgebrochen',
      Succeeded: 'Erfolgreich',
      Failed: 'Fehlgeschlagen',
      Cancelled: 'Abgebrochen',
      TimedOut: 'Zeitüberschreitung',
      Rejected: 'Abgelehnt'
    },
    runOutcome: {
      None: 'Keines',
      Succeeded: 'Erfolgreich',
      HarnessFailed: 'Harness fehlgeschlagen',
      NotInstalled: 'Harness nicht installiert',
      NotCredentialed: 'Zugangsdaten fehlen',
      McpPreflightFailed: 'MCP-Vorabprüfung fehlgeschlagen',
      NodeLost: 'Knoten verloren',
      OutputLimitExceeded: 'Ausgabelimit überschritten',
      SchemaValidationFailed: 'Ausgabeschema ungültig',
      TimedOut: 'Zeitüberschreitung',
      Cancelled: 'Abgebrochen',
      StaleLease: 'Veraltete Lease',
      CompileFailed: 'Kompilierung fehlgeschlagen',
      WorkspaceFailed: 'Arbeitsbereich fehlgeschlagen',
      Rejected: 'Abgelehnt',
      InternalError: 'Interner Fehler',
      NoCapableWorker: 'Kein passender Worker',
      RepetitionDetected: 'Wiederholung erkannt',
      NoProgress: 'Kein Fortschritt',
      PodFailed: 'Lauf-Pod fehlgeschlagen',
      ConversationStateLost: 'Konversationszustand verloren'
    },
    runEventType: {
      Lifecycle: 'Lebenszyklus',
      AssistantText: 'Assistent',
      Thinking: 'Überlegung',
      ToolCall: 'Werkzeugaufruf',
      ToolResult: 'Werkzeugergebnis',
      Usage: 'Verbrauch',
      Progress: 'Fortschritt',
      Warning: 'Warnung',
      Error: 'Fehler',
      Stdout: 'Stdout',
      Stderr: 'Stderr',
      Result: 'Ergebnis'
    },
    nodeStatus: { Ready: 'Bereit', Draining: 'Wird geleert', Cordoned: 'Gesperrt', Lost: 'Verloren', Offline: 'Offline' },
    controlNodeStatus: { Starting: 'Startet', Ready: 'Bereit', Draining: 'Wird geleert', Offline: 'Offline' },
    backplane: { Local: 'Lokal (ein Replikat)', Polling: 'Datenbankabfrage', PostgresNotify: 'PostgreSQL-Benachrichtigungen' },
    harnessType: { ClaudeCode: 'Claude Code', Codex: 'Codex', Mux: 'Mux', GeminiCli: 'Gemini CLI', Generic: 'Generisch' },
    agentKind: { Hosted: 'Gehostet', Remote: 'Entfernt' },
    delegationMode: { None: 'Keine Delegation', AllowList: 'Zulassungsliste', Any: 'Beliebiger Agent' },
    secretStatus: { Ok: 'In Ordnung', NeedsReauthentication: 'Erneute Anmeldung nötig' },
    secretKind: {
      AnthropicApiKey: 'Anthropic-API-Schlüssel',
      ClaudeCodeOAuthToken: 'Claude-Code-OAuth-Token',
      OpenAiApiKey: 'OpenAI-API-Schlüssel',
      CodexAuthJson: 'Codex auth.json',
      GeminiApiKey: 'Gemini-API-Schlüssel',
      GenericEnv: 'Umgebungswert',
      GenericFile: 'Dateiinhalt',
      BearerToken: 'Bearer-Token',
      BasicAuth: 'Basisauthentifizierung',
      GitCredential: 'Git-Zugangsdaten'
    },
    workspaceKind: { Empty: 'Leer', GitRepository: 'Git-Repository', Seeded: 'Vorbefüllte Dateien', PersistentVolume: 'Persistentes Volume' },
    runExecutor: { Process: 'Prozess', KubernetesJob: 'Kubernetes-Job' },
    workspaceRetention: { Delete: 'Löschen', Keep: 'Behalten', KeepOnFailure: 'Bei Fehler behalten' },
    promptTemplateKind: { System: 'System', Task: 'Aufgabe', Fragment: 'Fragment', ToolDescription: 'Werkzeugbeschreibung', ConfigFile: 'Konfigurationsdatei', Other: 'Sonstiges' },
    permissionType: { Permit: 'Erlauben', Deny: 'Verweigern' },
    resourceScope: { Tenant: 'Mandant', Resource: 'Ressource' },
    resourceBindingKind: { McpServer: 'MCP-Server', Secret: 'Geheimnis' },
    mcpTransport: { Http: 'HTTP', Stdio: 'stdio' },
    remoteProtocol: { A2A: 'A2A', Mcp: 'MCP' },
    manifestApplyResult: { Created: 'Erstellt', Updated: 'Aktualisiert', Unchanged: 'Unverändert', Failed: 'Fehlgeschlagen', Validated: 'Validiert' },
    auditEventType: {
      ApprovalDecided: 'Freigabe entschieden',
      AuthSuccess: 'Anmeldung erfolgreich',
      AuthFailure: 'Anmeldung fehlgeschlagen',
      SessionIssued: 'Sitzung ausgestellt',
      SessionRevoked: 'Sitzung widerrufen',
      CredentialCreated: 'Zugangsdaten erstellt',
      CredentialRotated: 'Zugangsdaten rotiert',
      CredentialUsed: 'Zugangsdaten verwendet',
      AuthorizationDenied: 'Autorisierung verweigert',
      AuthorizationBypass: 'Autorisierung umgangen',
      RoleChanged: 'Rolle geändert',
      PermissionChanged: 'Berechtigung geändert',
      AssignmentChanged: 'Zuweisung geändert',
      ConfigurationChanged: 'Konfiguration geändert',
      SecretChanged: 'Geheimnis geändert',
      SettingsChanged: 'Einstellungen geändert',
      RestartRequested: 'Neustart angefordert',
      ManifestApplied: 'Manifest angewendet',
      NodeRegistered: 'Knoten registriert',
      NodeStatusChanged: 'Knotenstatus geändert',
      RunCancelled: 'Lauf abgebrochen',
      ConversationDeleted: 'Konversation gelöscht'
    },
    conversationFallbackReason: {
      AffinityNodeLost: 'Affinitätsknoten nicht bereit',
      AffinityWaitExpired: 'Affinitätswartezeit abgelaufen',
      WorkspaceLost: 'Arbeitsbereich verloren',
      SessionMissing: 'Keine Sitzung zum Fortsetzen',
      HarnessChanged: 'Harness-Profil geändert',
      ResumeUnsupported: 'Fortsetzen nicht unterstützt',
      ExecutorWithoutState: 'Executor ohne Zustand'
    }
  },
  nav: {
    approvalsPending_one: '{{count}} Freigabe wartet',
    approvalsPending_other: '{{count}} Freigaben warten',
    primary: 'Hauptnavigation',
    sections: {
      operate: 'Betrieb',
      platform: 'Plattform',
      administration: 'Verwaltung'
    },
    hubs: {
      approvals: {
        label: 'Freigaben',
        tip: 'Werkzeugaufrufe, die auf eine Person warten, und alle Entscheidungen'
      },
      home: { label: 'Startseite', tip: 'Zustand von Flotte und Läufen auf einen Blick' },
      invoke: { label: 'Aufrufen', tip: 'Einen Agenten interaktiv ausprobieren' },
      runs: { label: 'Läufe', tip: 'Läufe und die Warteschlange' },
      analytics: { label: 'Analysen', tip: 'Geschwindigkeit, Token, Kosten und Ergebnisse von Läufen im Zeitverlauf' },
      agents: { label: 'Agenten', tip: 'Agenten und die Bereitstellungen, die sie ausführen' },
      configuration: { label: 'Konfiguration', tip: 'Harness-Profile, Prompt-Vorlagen, MCP-Server, Geheimnisse, Arbeitsbereiche, Artefaktspeicher und Manifeste' },
      fleet: { label: 'Flotte', tip: 'Steuerungsebene, Worker-Knoten und Knotenpools' },
      access: { label: 'Zugriff', tip: 'Mandanten, Benutzer, Zugangsschlüssel, Rollen und Zuweisungen' },
      monitoring: { label: 'Überwachung', tip: 'Anfrageverlauf, Audit und API-Explorer' },
      system: { label: 'System', tip: 'Servereinstellungen und Serverinfo' }
    },
    items: {
      approvals: {
        label: 'Freigaben',
        tip: 'Werkzeugaufrufe von Agenten erlauben oder verweigern'
      },
      home: { label: 'Startseite', tip: 'Zustand von Flotte und Läufen auf einen Blick' },
      invoke: { label: 'Aufrufen', tip: 'Einen Agenten interaktiv ausprobieren' },
      runs: { label: 'Läufe', tip: 'Läufe finden, prüfen, abbrechen und wiederholen' },
      queue: { label: 'Warteschlange', tip: 'Planungsdruck nach Agent und Harness' },
      analytics: { label: 'Analysen', tip: 'Geschwindigkeit, Token, Kosten und Ergebnisse von Läufen im Zeitverlauf' },
      nodes: { label: 'Worker-Knoten', tip: 'Worker-Knoten und ihre Harness-Fähigkeiten' },
      controlNodes: { label: 'Steuerungsebene', tip: 'Server-Replikate, die die API bereitstellen und Läufe planen' },
      nodePools: { label: 'Knotenpools', tip: 'Knoten gruppieren und Mandanten zuordnen' },
      agents: { label: 'Agenten', tip: 'Über REST, MCP und A2A bereitgestellte Agenten' },
      deployments: { label: 'Bereitstellungen', tip: 'Agenten an Harnesses, Prompts und Ressourcen binden' },
      harnessProfiles: { label: 'Harness-Profile', tip: 'Wie jede Harness ohne Oberfläche ausgeführt wird' },
      promptTemplates: { label: 'Prompt-Vorlagen', tip: 'Jeder Prompt, den Garrison sendet, versioniert' },
      mcpServers: { label: 'MCP-Server', tip: 'Für Agenten verfügbare Werkzeuge' },
      secrets: { label: 'Geheimnisse', tip: 'Zugangsdaten für Harnesses und Integrationen' },
      workspaces: { label: 'Arbeitsbereiche', tip: 'Wie Arbeitsbereiche für Läufe vorbereitet werden' },
      artifactStores: { label: 'Artefaktspeicher', tip: 'Wo Artefakte von Läufen gespeichert werden' },
      modelPrices: { label: "Modellpreise", tip: "Vom Betreiber konfigurierte USD-Tarife zur Kostenschätzung, wenn der Harness keine Kosten meldet. Gemeldete Kosten, auch null, haben Vorrang." },
      usageQuotas: { label: "Nutzungskontingente", tip: "Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung." },
      manifests: { label: 'Manifeste', tip: 'Konfiguration als Code anwenden und exportieren' },
      requests: { label: 'Anfrageverlauf', tip: 'HTTP-Verkehr und Fehler untersuchen' },
      audit: { label: 'Audit', tip: 'Sicherheits- und Konfigurationsereignisse' },
      explorer: { label: 'API-Explorer', tip: 'Live-API-Aufrufe ausführen' },
      tenants: { label: 'Mandanten', tip: 'Mandanten verwalten' },
      users: { label: 'Benutzer', tip: 'Benutzer verwalten' },
      credentials: { label: 'Zugangsschlüssel', tip: 'Schlüssel für Automatisierung' },
      roles: { label: 'Rollen', tip: 'Rollen und Berechtigungen' },
      assignments: { label: 'Zuweisungen', tip: 'Rollen an Benutzer und Schlüssel vergeben' },
      settings: { label: 'Einstellungen', tip: 'Server- und Clustereinstellungen bearbeiten' },
      serverInfo: { label: 'Serverinfo', tip: 'Endpunkte, Version und Ihre Identität' },
      conversations: {
        label: 'Konversationen',
        tip: 'Mehrrundige Gespräche mit einem Agenten'
      }
    },
    setup: 'Einrichtungsassistent',
    setupTip: 'Zugangsdaten hinterlegen, Beispielagenten anwenden und testen',
    tour: 'Geführte Tour',
    tourTip: 'Geführte Tour erneut abspielen',
    version: 'Version {{version}}',
    collapseSidebar: 'Navigation umschalten',
    skipToContent: 'Zum Inhalt springen'
  },
  login: {
    title: 'Garrison',
    subtitle: 'Bei der Agenten-Steuerungsebene anmelden',
    tabs: { password: 'E-Mail und Passwort', accessKey: 'Zugangsschlüssel' },
    serverUrl: 'Server-URL',
    serverInUse: 'Verwendeter Server:',
    useDifferentServer: 'Anderen Server verwenden',
    useDefaultServer: 'Standardserver verwenden',
    tenantId: 'Mandanten-ID',
    email: 'E-Mail',
    password: 'Passwort',
    accessKey: 'Zugangsschlüssel',
    secretKey: 'Geheimer Schlüssel',
    submit: 'Anmelden',
    connecting: 'Anmeldung läuft...',
    restoring: 'Ihre Sitzung wird wiederhergestellt...',
    errorGeneric: 'Anmeldung nicht möglich. Prüfen Sie Ihre Zugangsdaten und ob der Server erreichbar ist.',
    footerHint: 'Standard-Anmeldedaten: admin@garrison / password im Mandanten default.'
  },
  topbar: {
    server: 'Server',
    tenant: 'Mandant',
    switchTenant: 'Mandant wechseln',
    copyServer: 'Server-URL kopieren',
    live: 'Live',
    polling: 'Abfrage',
    liveOn: 'Live-Aktualisierungen über WebSocket aktiv',
    liveOff: 'Live-Aktualisierungen nicht verfügbar; Seiten aktualisieren per Abfrage',
    health: { healthy: 'Gesund', unhealthy: 'Nicht erreichbar', unknown: 'Wird geprüft' }
  },
  roles: {
    systemAdmin: 'Systemadministration',
    tenantAdmin: 'Mandantenadministration',
    user: 'Benutzer',
    credential: 'Zugangsschlüssel',
    run: 'Lauf-Token'
  },
  components: {
    fieldWarnings: { title_one: 'Gespeichert mit {{count}} angepasstem Wert', title_other: 'Gespeichert mit {{count}} angepassten Werten', body: 'Der Server hat die Anfrage angenommen, diese Werte aber anders gespeichert als gesendet.', dismiss: 'Ausblenden', codes: { ValueClamped: 'Wert auf den zulässigen Bereich begrenzt' } },
    approvals: {
      awaiting: 'Wartet auf Freigabe',
      decideTitle: '{{tool}} entscheiden',
      decision: 'Entscheidung',
      reason: 'Begründung',
      reasonPlaceholder: 'Optional. Der Agent und das Audit-Protokoll sehen sie.',
      remember: 'Als Regel für diese Bereitstellung merken',
      rulePattern: 'Regelmuster',
      rememberHint: 'Fügt der Bereitstellung eine Regel mit der Aktion {{action}} hinzu, sodass passende Aufrufe ohne Nachfrage entschieden werden. Dafür ist auch die Berechtigung zum Aktualisieren der Bereitstellung nötig.',
      submitAllow: 'Erlauben',
      submitDeny: 'Verweigern',
      timeoutThen: 'dann {{decision}}',
      toasts: {
        allowed: '{{tool}} erlaubt.',
        denied: '{{tool}} verweigert.',
        allowedRemembered: '{{tool}} erlaubt und die Regel {{pattern}} hinzugefügt.',
        deniedRemembered: '{{tool}} verweigert und die Regel {{pattern}} hinzugefügt.',
        notPending: 'Diese Freigabe wurde bereits von einer anderen Person oder durch ihr Zeitlimit entschieden. Die Liste zeigt jetzt das Ergebnis.',
        forbidden: 'Sie dürfen Freigaben lesen, aber nicht entscheiden. Bitten Sie eine Administratorin oder einen Administrator um die Berechtigung Approval Update.',
        forbiddenRemember: 'Das Merken einer Regel erfordert auch die Berechtigung zum Aktualisieren der Bereitstellung. Entscheiden Sie ohne Merken, oder fordern Sie Deployment Update an.'
      }
    },
    approvalCheck: {
      title: 'Werkzeugaufruf testen',
      saveFirst: 'Speichern Sie zuerst die Bereitstellung. Der Test prüft die Regeln, die der Server gespeichert hat.',
      hint: 'Prüft die gespeicherten Regeln, speichern Sie Ihre Änderungen also vor dem Testen. Es wird nichts aufgezeichnet.',
      toolName: 'Werkzeug',
      inputs: {
        command: 'Befehl',
        url: 'URL',
        query: 'Suchanfrage',
        file_path: 'Dateipfad',
        notebook_path: 'Notebook-Pfad',
        pattern: 'Muster'
      },
      run: 'Prüfen',
      checking: 'Wird geprüft...',
      byRule: '{{action}} durch diese Regel:',
      byDefault: '{{action}} durch den Standard der Bereitstellung, da keine Regel zutraf.',
      suggestedRule: 'Vorgeschlagene Regel:',
      disabled: 'Freigaben sind für diese Bereitstellung deaktiviert, daher fragen ihre Läufe nie nach. Aktivieren Sie sie und speichern Sie, um diese Regeln anzuwenden.'
    },
    blocked: {
      title: 'Wartet auf einen Worker',
      body: 'Dieser Lauf ist in der Warteschlange, aber gerade kann kein Worker ihn übernehmen.',
      reasons: {
        NoReadyWorker: 'Kein Worker-Knoten ist bereit. Starten Sie einen Worker oder registrieren Sie einen neuen und prüfen Sie auf der Seite Flotte, welche Knoten verloren, offline, im Leeren oder gesperrt sind.',
        NoCapableWorker: 'Worker sind bereit, aber keiner meldet den Harness {{harness}} als verfügbar. Starten oder registrieren Sie einen Worker mit diesem Harness, oder prüfen Sie dessen Anmeldedaten und Prüfergebnisse auf der Seite Flotte.',
        NoMatchingPool: 'Ein bereiter Worker kann {{harness}} ausführen, aber keiner passt zum Knotenpool oder zu den Knotenselektoren dieser Bereitstellung. Prüfen Sie die Platzierung der Bereitstellung oder fügen Sie dem Pool einen Worker hinzu.'
      },
      failNote: 'Ist die Clustereinstellung Runtime.FailBlockedAfterSeconds größer als 0, schlägt ein Lauf, der so lange blockiert bleibt, mit dem Ergebnis „Kein passender Worker“ fehl.',
      openFleet: 'Flotte öffnen',
      openAgent: 'Bereitstellungen des Agenten öffnen',
      homeBanner_one: '{{count}} wartender Lauf kann nicht starten: Kein bereiter Worker kann ihn ausführen.',
      homeBanner_other: '{{count}} wartende Läufe können nicht starten: Kein bereiter Worker kann sie ausführen.',
      showRuns: 'Wartende Läufe anzeigen',
      queueColumn: 'Blockiert',
      queueCount_one: '{{count}} blockiert',
      queueCount_other: '{{count}} blockiert'
    },
    autoRefresh: {
      label: 'Automatisch aktualisieren',
      none: 'Aus',
      seconds_one: 'Jede Sekunde',
      seconds_other: 'Alle {{count}} Sekunden'
    },
    chart: {
      success: 'Erfolgreich',
      failure: 'Fehlgeschlagen',
      total: 'Gesamt',
      avgDuration: 'Mittlere Dauer',
      noData: 'Keine Aktivität in diesem Zeitraum.',
      range: 'Zeitraum',
      ranges: { hour: 'Letzte Stunde', day: 'Letzter Tag', week: 'Letzte Woche', month: 'Letzter Monat', custom: 'Benutzerdefiniert' }
    },
    compilePreview: {
      title: 'Kompilierungsvorschau',
      input: 'Beispieleingabe',
      compile: 'Kompilieren',
      compiling: 'Wird kompiliert...',
      commandLine: 'Befehlszeile',
      stdin: 'Standardeingabe',
      environment: 'Umgebung',
      files_one: '{{count}} Datei',
      files_other: '{{count}} Dateien'
    },
    confirm: { title: 'Bitte bestätigen', message: 'Möchten Sie wirklich fortfahren?' },
    diff: { before: 'Vorher', after: 'Nachher' },
    explainer: { about: 'Über {{topic}}', dismiss: 'Diese Erklärung ausblenden' },
    export: { label: 'Exportieren', csv: 'CSV (Daten)', png: 'PNG-Bild', svg: 'SVG-Bild', json: 'JSON (Daten)', failed: 'Export fehlgeschlagen. {{message}}', tableTitle: 'Tabelle {{table}}' },
    filters: {
      allTenants: 'Alle Mandanten',
      clear: 'Filter zurücksetzen',
      from: 'Von',
      to: 'Bis',
      method: 'Methode',
      path: 'Pfad enthält',
      pathPlaceholder: 'zum Beispiel /v1.0/api/tenants',
      searchName: 'Nach Namen suchen',
      status: 'Statuscode',
      statusPlaceholder: 'zum Beispiel 404',
      tenant: 'Mandant'
    },
    form: {
      addItem: 'Eintrag hinzufügen',
      addRow: 'Zeile hinzufügen',
      key: 'Schlüssel',
      value: 'Wert',
      moveUp: 'Nach oben',
      moveDown: 'Nach unten',
      noItems: 'Noch keine Einträge.',
      onePerLine: 'Ein Wert pro Zeile',
      steps: 'Formularschritte'
    },
    mcpTest: {
      title: 'MCP-Verbindungstest',
      testing: 'Verbindung wird hergestellt und Werkzeuge werden aufgelistet...',
      ok: 'Verbunden',
      failed: 'Fehlgeschlagen',
      tools_one: '{{count}} Werkzeug',
      tools_other: '{{count}} Werkzeuge'
    },
    permissions: {
      title: 'Effektive Berechtigungen',
      none: 'Keine Berechtigungen. Dieser Prinzipal kann nur Umgehungsregeln nutzen, sofern vorhanden.',
      source: 'Rolle',
      type: 'Typ',
      resources: 'Ressourcentypen',
      operations: 'Operationen',
      scope: 'Geltungsbereich'
    },
    requestDetails: {
      title: 'Anfragedetails',
      metadata: 'Metadaten',
      requestHeaders: 'Anfrage-Header',
      requestBody: 'Anfragetext',
      responseHeaders: 'Antwort-Header',
      responseBody: 'Antworttext',
      rawJson: 'Rohes JSON',
      truncated: 'Gekürzt ({{bytes}} Bytes im Original)',
      empty: 'Kein Inhalt.',
      fields: {
        id: 'Anfrage-ID',
        method: 'Methode',
        path: 'Pfad',
        url: 'URL',
        status: 'Status',
        duration: 'Dauer',
        createdUtc: 'Erstellt',
        completedUtc: 'Abgeschlossen',
        sourceIp: 'Quell-IP',
        principal: 'Prinzipal',
        tenant: 'Mandant',
        user: 'Benutzer'
      }
    },
    secretOnce: {
      title: 'Kopieren Sie dieses Geheimnis jetzt',
      warning: 'Das Geheimnis wird nur dieses eine Mal angezeigt. Speichern Sie es sicher, bevor Sie schließen.',
      accessKey: 'Zugangsschlüssel',
      secretKey: 'Geheimer Schlüssel',
      done: 'Gespeichert'
    },
    table: {
      bulkActions: 'Sammelaktionen',
      bulkDelete: 'Auswahl löschen',
      clearSelection: 'Auswahl aufheben',
      empty: 'Keine Datensätze vorhanden.',
      first: 'Erste Seite',
      jump: 'Zu Seite springen',
      last: 'Letzte Seite',
      loading: 'Datensätze werden geladen...',
      next: 'Nächste Seite',
      noMatches: 'Keine Datensätze entsprechen den aktuellen Filtern.',
      pageOf: 'Seite {{page}} von {{total}}',
      pageSize: 'Pro Seite',
      pinned: 'Immer sichtbar',
      prev: 'Vorherige Seite',
      records_one: 'Datensatz',
      records_other: 'Datensätze',
      refresh: 'Aktualisieren',
      selectAll: 'Alle Zeilen dieser Seite auswählen',
      selectColumns: 'Spalten auswählen',
      selected_one: '{{formattedCount}} ausgewählt',
      selected_other: '{{formattedCount}} ausgewählt',
      selectRow: 'Zeile auswählen',
      showing: '{{from}} bis {{to}} werden angezeigt',
      sortBy: 'Nach {{column}} sortieren',
      sortPageOnly: 'Sortiert nur die aktuelle Seite'
    }
  },
  resources: {
    approvals: {
      ...rp('Freigaben', 'Werkzeugaufrufe, die Agenten ausführen wollten, entschieden durch eine Regel der Bereitstellung, den Standard der Bereitstellung, eine Person oder eine Zeitüberschreitung. Ausstehende warten auf Sie.', 'Freigabe hinzufügen', 'Freigabe erstellen', 'Freigabe bearbeiten', 'Freigabedetails', 'Freigabe löschen', 'Noch keine Freigaben', 'Freigaben erscheinen, wenn eine Bereitstellung mit aktivierten Freigaben vor einem Werkzeugaufruf nachfragt.'),
      columns: {
        createdUtc: 'Angefordert',
        agentName: 'Agent',
        toolName: 'Werkzeug',
        summary: 'Anfrage',
        status: 'Status',
        decision: 'Entscheidung',
        decisionSource: 'Quelle',
        decidedBy: 'Entschieden von',
        expiresUtc: 'Läuft ab',
        kind: 'Art',
        harnessType: 'Harness',
        runId: 'Lauf',
        waitMs: 'Wartezeit',
        reason: 'Begründung',
        decidedUtc: 'Entschieden',
        id: 'ID'
      },
      fields: {
        status: 'Status',
        decision: 'Entscheidung',
        decisionSource: 'Entscheidungsquelle',
        decidedBy: 'Entschieden von',
        toolName: 'Werkzeug',
        kind: 'Art',
        harnessType: 'Harness',
        agentName: 'Agent',
        runId: 'Lauf',
        rootRunId: 'Stammlauf',
        deploymentId: 'Bereitstellung',
        leaseEpoch: 'Lease-Epoche',
        requestedUtc: 'Angefordert',
        expiresUtc: 'Läuft ab',
        decidedUtc: 'Entschieden',
        waitMs: 'Wartezeit',
        timeoutDecision: 'Entscheidung bei Zeitüberschreitung',
        toolCallId: 'Werkzeugaufruf-ID',
        reason: 'Begründung',
        summary: 'Zusammenfassung',
        inputPreview: 'Eingabe (geschwärzt)',
        rulePattern: 'Zutreffende Regel',
        ruleId: 'Regel-ID',
        suggestedRule: 'Vorgeschlagene Regel',
        rememberedRuleId: 'ID der gemerkten Regel'
      },
      filters: {
        runId: 'Lauf-ID',
        runIdPlaceholder: 'Lauf-ID (run_...)'
      },
      actions: {
        allow: 'Erlauben',
        deny: 'Verweigern',
        openRun: 'Lauf öffnen'
      }
    },
    tenants: {
      ...rp('Mandanten', 'Isolierte Bereiche mit eigenen Benutzern, Agenten, Geheimnissen und Läufen.', 'Mandant hinzufügen', 'Mandant erstellen', 'Mandant bearbeiten', 'Mandantendetails', 'Mandant löschen', 'Noch keine Mandanten', 'Erstellen Sie einen Mandanten, um ein Team oder eine Kundschaft zu isolieren.'),
      columns: { name: 'Name', id: 'ID', description: 'Beschreibung', active: 'Aktiv', createdUtc: 'Erstellt' },
      fields: { name: 'Name', description: 'Beschreibung', active: 'Aktiv' }
    },
    users: {
      ...rp('Benutzer', 'Personen, die sich mit E-Mail und Passwort bei diesem Mandanten anmelden.', 'Benutzer hinzufügen', 'Benutzer erstellen', 'Benutzer bearbeiten', 'Benutzerdetails', 'Benutzer löschen', 'Noch keine Benutzer', 'Fügen Sie einen Benutzer hinzu, damit sich eine Person anmelden kann.'),
      columns: { email: 'E-Mail', name: 'Name', id: 'ID', role: 'Rolle', active: 'Aktiv', createdUtc: 'Erstellt' },
      fields: { email: 'E-Mail', password: 'Passwort', firstName: 'Vorname', lastName: 'Nachname', isTenantAdmin: 'Mandantenadministration', isAdmin: 'Systemadministration', active: 'Aktiv' },
      hints: { isAdmin: 'Systemadministration kann alle Mandanten verwalten und umgeht jede Autorisierung.', password: 'Beim Bearbeiten leer lassen, um das aktuelle Passwort zu behalten.' },
      actions: { permissions: 'Effektive Berechtigungen' }
    },
    credentials: {
      ...rp('Zugangsschlüssel', 'Schlüssel für Automatisierung, SDKs und Integrationen. Geheimnisse werden einmal angezeigt.', 'Schlüssel hinzufügen', 'Schlüssel erstellen', 'Schlüssel bearbeiten', 'Schlüsseldetails', 'Schlüssel löschen', 'Noch keine Zugangsschlüssel', 'Erstellen Sie einen Schlüssel, damit ein Skript oder Dienst Garrison aufrufen kann.'),
      columns: { name: 'Name', accessKey: 'Zugangsschlüssel', secretKeyLast4: 'Geheimnis', userId: 'Eigentümer', lastUsedUtc: 'Zuletzt verwendet', expiresUtc: 'Läuft ab', active: 'Aktiv', id: 'ID' },
      fields: { name: 'Name', userId: 'Eigentümer', authMode: 'Authentifizierungsmodus', expiresUtc: 'Läuft ab', active: 'Aktiv' },
      hints: { userId: 'Ein Schlüssel kann nie mehr Berechtigungen haben als sein Eigentümer.' },
      actions: { rotate: 'Geheimnis rotieren' }
    },
    roles: {
      ...rp('Rollen', 'Rollen bündeln Berechtigungen. Integrierte Rollen sind schreibgeschützt; klonen Sie eine zum Anpassen.', 'Rolle hinzufügen', 'Rolle erstellen', 'Rolle bearbeiten', 'Rollendetails', 'Rolle löschen', 'Noch keine Rollen', 'Erstellen Sie eine eigene Rolle oder klonen Sie eine integrierte.'),
      columns: { name: 'Name', description: 'Beschreibung', isBuiltIn: 'Typ', active: 'Aktiv', id: 'ID', createdUtc: 'Erstellt' },
      fields: { name: 'Name', description: 'Beschreibung', active: 'Aktiv' }
    },
    permissions: {
      ...rp('Berechtigungen', 'Operationen auf Ressourcentypen erlauben oder verweigern. Verweigern gewinnt immer.', 'Berechtigung hinzufügen', 'Berechtigung erstellen', 'Berechtigung bearbeiten', 'Berechtigungsdetails', 'Berechtigung löschen', 'Noch keine Berechtigungen', 'Erstellen Sie eine Berechtigung und ordnen Sie sie einer Rolle zu.'),
      columns: { name: 'Name', permissionType: 'Typ', resourceTypes: 'Ressourcentypen', operationTypes: 'Operationen', isBuiltIn: 'Herkunft', id: 'ID' },
      fields: { name: 'Name', permissionType: 'Typ', resourceTypes: 'Ressourcentypen', operationTypes: 'Operationen', active: 'Aktiv' }
    },
    userAssignments: {
      ...rp('Benutzerzuweisungen', 'Rollen an Benutzer auf Mandanten- oder Ressourcenebene vergeben.', 'Zuweisung hinzufügen', 'Zuweisung erstellen', 'Zuweisung bearbeiten', 'Zuweisungsdetails', 'Zuweisung löschen', 'Noch keine Benutzerzuweisungen', 'Weisen Sie einem Benutzer eine Rolle zu.'),
      columns: { userId: 'Benutzer', roleName: 'Rolle', resourceScope: 'Geltungsbereich', resourceId: 'Ressource', active: 'Aktiv', createdUtc: 'Erstellt', id: 'ID' },
      fields: { userId: 'Benutzer', roleId: 'Rolle', resourceScope: 'Geltungsbereich', resourceId: 'Ressourcen-ID', inheritsToChildren: 'Gilt für Ressourcen im Mandanten', active: 'Aktiv' }
    },
    credentialAssignments: {
      ...rp('Schlüsselzuweisungen', 'Rollen an Zugangsschlüssel vergeben. Halten Sie Schlüssel enger als ihre Eigentümer.', 'Zuweisung hinzufügen', 'Zuweisung erstellen', 'Zuweisung bearbeiten', 'Zuweisungsdetails', 'Zuweisung löschen', 'Noch keine Schlüsselzuweisungen', 'Weisen Sie einem Schlüssel eine Rolle zu.'),
      columns: { credentialId: 'Schlüssel', roleName: 'Rolle', resourceScope: 'Geltungsbereich', resourceId: 'Ressource', active: 'Aktiv', createdUtc: 'Erstellt', id: 'ID' },
      fields: { credentialId: 'Schlüssel', roleId: 'Rolle', resourceScope: 'Geltungsbereich', resourceId: 'Ressourcen-ID', inheritsToChildren: 'Gilt für Ressourcen im Mandanten', active: 'Aktiv' }
    },
    harnessProfiles: {
      ...rp('Harness-Profile', 'Beschreibt genau, wie eine Harness ohne Oberfläche läuft: Programm, Argumente, Umgebung, Dateien und Ausgabeauswertung.', 'Profil hinzufügen', 'Profil erstellen', 'Profil bearbeiten', 'Profildetails', 'Profil löschen', 'Noch keine Harness-Profile', 'Klonen Sie ein integriertes Profil, um den Start einer Harness anzupassen.'),
      steps: { basics: 'Grundlagen', invocation: 'Aufruf', output: 'Ausgabe', limits: 'Grenzen' },
      columns: { name: 'Name', harnessType: 'Harness', executable: 'Programm', outputParser: 'Parser', isBuiltIn: 'Herkunft', id: 'ID', createdUtc: 'Erstellt' },
      fields: {
        name: 'Name',
        description: 'Beschreibung',
        harnessType: 'Harness-Typ',
        executable: 'Programm',
        probeArguments: 'Argumente der Versionsprüfung',
        active: 'Aktiv',
        arguments: 'Argumente',
        argTemplate: 'Vorlage',
        argCondition: 'Bedingung',
        argRepeatOver: 'Wiederholen über',
        promptDelivery: 'Prompt-Übergabe',
        promptArgumentTemplate: 'Prompt-Argument oder Dateiname',
        systemPromptDelivery: 'System-Prompt-Übergabe',
        systemPromptTarget: 'System-Prompt-Ziel',
        mcpConfigFormat: 'MCP-Konfigurationsformat',
        mcpConfigFileName: 'Name der MCP-Konfigurationsdatei',
        environment: 'Umgebung',
        envName: 'Name',
        envValue: 'Wertvorlage',
        isSecret: 'Geheim',
        files: 'Dateien',
        fileBase: 'Basisverzeichnis',
        filePath: 'Pfad',
        fileContent: 'Inhaltsvorlage',
        fileMode: 'Modus',
        credentialEnvironmentAllowlist: 'Zulässige Zugangsdaten-Variablen',
        outputParser: 'Ausgabeparser',
        genericTextField: 'Pfad des Textfelds',
        genericFinalField: 'Pfad des Endergebnisses',
        genericSuccessField: 'Pfad des Erfolgsfelds',
        genericSuccessValue: 'Erfolgswert',
        resultSource: 'Ergebnisquelle',
        resultFileName: 'Name der Ergebnisdatei',
        successPolicy: 'Erfolgsregel',
        successExitCodes: 'Erfolgreiche Exit-Codes',
        defaultTimeoutSeconds: 'Standard-Zeitlimit (Sekunden)',
        killGraceSeconds: 'Kulanzzeit vor Beenden (Sekunden)',
        maxOutputBytes: 'Maximale Ausgabe (Bytes)',
        stderrTailBytes: 'Stderr-Ende (Bytes)',
        isolateHome: 'HOME pro Lauf isolieren',
        supportsResume: 'Unterstützt Fortsetzen von Sitzungen'
      },
      hints: {
        arguments: 'Jede Vorlage ergibt ein Argument. Ergibt die Bedingung leer oder false, wird das Argument ausgelassen.',
        executable: 'Befehlsname im PATH des Workers oder ein absoluter Pfad.',
        environment: 'Gebundene Geheimnisse mit {{secret.alias}} referenzieren. Die Prozessumgebung beginnt leer bis auf die Zulassungsliste.',
        successPolicy: 'Garrison entscheidet standardmäßig anhand des letzten Parser-Ereignisses, nicht anhand des Exit-Codes.'
      },
      errors: { reservedPrefix: 'Das Präfix builtin/ ist reserviert.' }
    },
    promptTemplates: {
      deleteBound_other: '"{{name}}" ist an {{count}} Bereitstellungen gebunden, daher lehnt der Server das Löschen ab. Entfernen Sie zuerst die Bindungen aus diesen Bereitstellungen:',
      deleteBound_one: '"{{name}}" ist an {{count}} Bereitstellung gebunden, daher lehnt der Server das Löschen ab. Entfernen Sie zuerst die Bindung aus dieser Bereitstellung:',
      deleteUnbound: '"{{name}}" mit allen Versionen löschen? Keine Bereitstellung bindet die Vorlage. Dies kann nicht rückgängig gemacht werden.',
      ...rp('Prompt-Vorlagen', 'Jeder Prompt und jede Konfigurationsdatei, die Garrison erzeugt. Jedes Speichern erstellt eine Version.', 'Neue Vorlage', 'Vorlage erstellen', 'Vorlage bearbeiten', 'Vorlagendetails', 'Vorlage löschen', 'Noch keine Prompt-Vorlagen', 'Erstellen Sie eine Vorlage oder klonen Sie eine integrierte.'),
      columns: { name: 'Name', kind: 'Art', currentVersion: 'Version', description: 'Beschreibung', isBuiltIn: 'Herkunft', id: 'ID', lastUpdateUtc: 'Aktualisiert' },
      fields: { name: 'Name', kind: 'Art', description: 'Beschreibung' }
    },
    mcpServers: {
      ...rp('MCP-Server', 'MCP-Server, die Agenten nutzen können. Header und Umgebung dürfen Geheimnisse referenzieren.', 'MCP-Server hinzufügen', 'MCP-Server erstellen', 'MCP-Server bearbeiten', 'MCP-Serverdetails', 'MCP-Server löschen', 'Noch keine MCP-Server', 'Registrieren Sie einen MCP-Server, damit Bereitstellungen ihn binden können.'),
      columns: { name: 'Name', transport: 'Transport', endpoint: 'Endpunkt', required: 'Erforderlich', active: 'Aktiv', id: 'ID', createdUtc: 'Erstellt' },
      fields: {
        name: 'Name',
        transport: 'Transport',
        description: 'Beschreibung',
        url: 'Basis-URL',
        path: 'MCP-Pfad',
        headers: 'Header',
        headerName: 'Name',
        headerValue: 'Wertvorlage',
        command: 'Befehl',
        arguments: 'Argumente',
        environment: 'Umgebung',
        requiredTools: 'Erforderliche Werkzeuge',
        toolTimeoutSeconds: 'Werkzeug-Zeitlimit (Sekunden)',
        required: 'Lauf bei Nichterreichbarkeit abbrechen',
        active: 'Aktiv'
      },
      hints: { requiredTools: 'Die Vorabprüfung bricht den Lauf vor dem Start ab, wenn ein aufgeführtes Werkzeug fehlt.' },
      actions: { test: 'Verbindung testen' }
    },
    secrets: {
      errors: { expiryPast: 'Wählen Sie ein Ablaufdatum in der Zukunft oder lassen Sie das Feld leer, damit das Geheimnis nie abläuft.' },
      ...rp('Geheimnisse', 'Verschlüsselte Zugangsdaten für Harnesses und Integrationen. Werte sind nur schreibbar.', 'Geheimnis hinzufügen', 'Geheimnis erstellen', 'Geheimnis bearbeiten', 'Geheimnisdetails', 'Geheimnis löschen', 'Noch keine Geheimnisse', 'Fügen Sie den API-Schlüssel oder das Token hinzu, das Ihre Agenten benötigen, etwa einen Anthropic-API-Schlüssel.'),
      notSet: 'Nicht gesetzt',
      neverRefreshed: 'Noch nicht',
      reauth: { title: 'Für diese Anmeldung ist eine erneute Anmeldung nötig', since: 'Seit {{time}}', action: 'Läufe, die dieses Geheimnis verwenden, schlagen fehl, bis Sie seinen Wert ersetzen. Melden Sie sich mit codex login und einem eigenen CODEX_HOME erneut an und speichern Sie die neue auth.json mit „Wert setzen“, oder stellen Sie das Deployment auf ein Geheimnis mit OpenAI-API-Schlüssel um. Verwenden Sie dieselbe Anmeldung nicht weiter auf einem anderen Rechner: Beide Kopien teilen sich ein Refresh-Token.' },
      columns: { status: 'Zustand', accessTokenExpiresUtc: 'Zugriffstoken läuft ab', name: 'Name', kind: 'Art', valueLast4: 'Wert', rotatedUtc: 'Zuletzt geändert', expiresUtc: 'Läuft ab', active: 'Aktiv', id: 'ID' },
      fields: { refreshedUtc: 'Zuletzt von Garrison erneuert', accessTokenExpiresUtc: 'Zugriffstoken läuft ab', name: 'Name', kind: 'Art', description: 'Beschreibung', value: 'Wert', newValue: 'Neuer Wert', expiresUtc: 'Läuft ab', active: 'Aktiv' },
      hints: { expiresUtc: 'Muss in der Zukunft liegen. Leer lassen für ein Geheimnis ohne Ablauf.', kind: 'Abonnement-Token auf gemeinsam genutzten Servern können gegen Anbieterbedingungen verstoßen. Bevorzugen Sie API-Schlüssel.' },
      actions: { setValue: 'Wert setzen', rotate: 'Rotieren' }
    },
    workspaces: {
      ...rp('Arbeitsbereiche', 'Wie ein Arbeitsbereich für einen Lauf vorbereitet wird: leer, aus Git geklont oder mit Dateien befüllt.', 'Vorlage hinzufügen', 'Vorlage erstellen', 'Vorlage bearbeiten', 'Vorlagendetails', 'Vorlage löschen', 'Noch keine Arbeitsbereiche', 'Erstellen Sie eine Vorlage, damit Bereitstellungen mit einem Repository oder Dateien starten.'),
      columns: { name: 'Name', kind: 'Art', gitUrl: 'Repository', retention: 'Aufbewahrung', active: 'Aktiv', id: 'ID', createdUtc: 'Erstellt' },
      fields: { name: 'Name', kind: 'Art', description: 'Beschreibung', gitUrl: 'Repository-URL', gitRef: 'Branch, Tag oder Commit', gitDepth: 'Klontiefe', gitCredentialSecretId: 'Git-Zugangsdaten', persistentVolumeClaim: 'Name des PersistentVolumeClaim', files: 'Dateien', filePath: 'Pfad', fileContent: 'Inhalt', retention: 'Aufbewahrung', active: 'Aktiv' },
      hints: { persistentVolumeClaim: 'Ein vorhandener Claim im Lauf-Namespace. Nur Bereitstellungen mit dem Executor Kubernetes-Job können diesen Arbeitsbereich nutzen; sein Inhalt bleibt zwischen Läufen erhalten.' },
      errors: { claimName: 'Verwenden Sie Kleinbuchstaben, Ziffern, Bindestriche und Punkte, beginnend und endend mit einem Buchstaben oder einer Ziffer.' }
    },
    modelPrices: {
      ...{"title": "Modellpreise", "subtitle": "Vom Betreiber konfigurierte USD-Tarife zur Kostenschätzung, wenn der Harness keine Kosten meldet. Gemeldete Kosten, auch null, haben Vorrang.", "add": "Modellpreis hinzufügen", "create": "Modellpreis erstellen", "edit": "Modellpreis bearbeiten", "view": "Modellpreisdetails", "deleteTitle": "Modellpreis löschen", "emptyTitle": "Noch keine Modellpreise", "emptyBody": "Fügen Sie einen Preis für einen genauen Harness und Modellnamen hinzu. Anbieterpreise sind nicht vorgegeben."},
      columns: {"name": "Name", "active": "Aktiv", "id": "ID", "createdUtc": "Erstellt", "model": "Verwendetes Modell", "harnessType": "Harness", "inputUsdPerMillion": "Eingabe USD / Million Token", "outputUsdPerMillion": "Ausgabe USD / Million Token"},
      fields: {"name": "Name", "description": "Beschreibung", "active": "Aktiv", "model": "Verwendetes Modell", "harnessType": "Harness", "inputUsdPerMillion": "Eingabe USD / Million Token", "outputUsdPerMillion": "Ausgabe USD / Million Token", "cachedInputUsdPerMillion": "Cache-Eingabe USD / Million Token", "reasoningUsdPerMillion": "Denkprozess USD / Million Token", "inputIncludesCachedTokens": "Eingabe enthält Cache-Token", "outputIncludesReasoningTokens": "Ausgabe enthält Denkprozess-Token"},
      hints: {"cachedInputUsdPerMillion": "Leer lassen, um den entsprechenden Eingabe- oder Ausgabetarif zu verwenden. Null bedeutet kostenlos.", "reasoningUsdPerMillion": "Leer lassen, um den entsprechenden Eingabe- oder Ausgabetarif zu verwenden. Null bedeutet kostenlos.", "inputIncludesCachedTokens": "Aktivieren, wenn Cache-Token in der Eingabe enthalten sind. Für Claude Code deaktivieren, da Cache-Lesezugriffe separat gemeldet werden.", "outputIncludesReasoningTokens": "Aktivieren, wenn Denkprozess-Token in der Ausgabe enthalten sind. Enthaltene Teilmengen werden vor Anwendung ihres eigenen Tarifs abgezogen."},
      errors: {"rate": "Geben Sie einen endlichen Tarif zwischen 0 und 1.000.000.000 ein. Null ist gültig.", "model": "Geben Sie einen genauen Modellnamen mit 1 bis 256 Zeichen ohne Steuerzeichen ein."}
    },
    usageQuotas: {"title": "Nutzungskontingente", "subtitle": "Tägliche UTC-Limits für Läufe, Token, bekannte Kosten und aktuelle Parallelität eines Mandanten, Agenten oder einer Bereitstellung.", "add": "Nutzungskontingent hinzufügen", "create": "Nutzungskontingent erstellen", "edit": "Nutzungskontingent bearbeiten", "view": "Kontingentdetails", "deleteTitle": "Nutzungskontingent löschen", "emptyTitle": "Noch keine Nutzungskontingente", "emptyBody": "Fügen Sie ein Kontingent für einen Mandanten, Agenten oder eine Bereitstellung hinzu. Leere Limits sind unbegrenzt.", "columns": {"name": "Name", "active": "Aktiv", "id": "ID", "createdUtc": "Erstellt", "scope": "Geltungsbereich", "resourceId": "Zielressource", "dailyRunLimit": "Läufe pro UTC-Tag", "dailyTokenLimit": "Token pro UTC-Tag", "dailyCostUsdLimit": "Bekannte USD pro UTC-Tag", "maxConcurrentRuns": "Maximale aktive Läufe", "enforcementEnabled": "Grenzen durchsetzen"}, "fields": {"name": "Name", "description": "Beschreibung", "active": "Aktiv", "scope": "Geltungsbereich", "resourceId": "Zielressource", "dailyRunLimit": "Läufe pro UTC-Tag", "dailyTokenLimit": "Token pro UTC-Tag", "dailyCostUsdLimit": "Bekannte USD pro UTC-Tag", "maxConcurrentRuns": "Maximale aktive Läufe", "enforcementEnabled": "Grenzen durchsetzen"}, "hints": {"dailyRunLimit": "Leer lassen für unbegrenzte Nutzung. Null verbietet Nutzung. Tageszähler werden um Mitternacht UTC zurückgesetzt; Parallelität zählt aktuell aktive Läufe. Grenzen gelten nur bei aktivierter Durchsetzung.", "dailyTokenLimit": "Leer lassen für unbegrenzte Nutzung. Null verbietet Nutzung. Tageszähler werden um Mitternacht UTC zurückgesetzt; Parallelität zählt aktuell aktive Läufe. Grenzen gelten nur bei aktivierter Durchsetzung.", "dailyCostUsdLimit": "Leer lassen für unbegrenzte Nutzung. Null verbietet Nutzung. Tageszähler werden um Mitternacht UTC zurückgesetzt; Parallelität zählt aktuell aktive Läufe. Grenzen gelten nur bei aktivierter Durchsetzung.", "maxConcurrentRuns": "Leer lassen für unbegrenzte Nutzung. Null verbietet Nutzung. Tageszähler werden um Mitternacht UTC zurückgesetzt; Parallelität zählt aktuell aktive Läufe. Grenzen gelten nur bei aktivierter Durchsetzung.", "resourceId": "Fügen Sie ein Kontingent für einen Mandanten, Agenten oder eine Bereitstellung hinzu. Leere Limits sind unbegrenzt.", "enforcementEnabled": "Standardmäßig aus. Explizit aktivieren, um Läufe bei erreichten Grenzen abzulehnen und unterstützte Harness-Budgets zu senken. Ohne Aktivierung wird nur die Nutzung erfasst."}, "errors": {"limit": "Geben Sie ein nicht negatives Limit im Feldbereich ein. Zähler müssen ganze Zahlen sein."}, "incomplete": "Die Kostenabrechnung ist unvollständig: {{count}} abgeschlossene Läufe haben keine gemeldeten oder geschätzten Kosten. Grenzen gelten nur bei aktivierter Durchsetzung; fehlende Kosten allein blockieren keine Aufnahme.", "actions": {"usage": "Tägliche Nutzung"}, "usage": {"windowStartUtc": "Fensterbeginn (UTC)", "windowEndUtc": "Tägliche Rücksetzung (UTC)", "runsUsed": "Zugelassene Läufe", "tokensUsed": "Abgeschlossene Token", "costUsd": "Bekannte Kosten (USD)", "unknownCostRuns": "Läufe ohne Kosten", "activeRuns": "Aktive Läufe"}},
    artifactStores: {
      ...rp('Artefaktspeicher', 'Wo Dateien aus Läufen aufbewahrt werden.', 'Speicher hinzufügen', 'Speicher erstellen', 'Speicher bearbeiten', 'Speicherdetails', 'Speicher löschen', 'Noch keine Artefaktspeicher', 'Erstellen Sie einen Artefaktspeicher für Ergebnisse von Läufen.'),
      columns: { name: 'Name', kind: 'Art', description: 'Beschreibung', active: 'Aktiv', id: 'ID', createdUtc: 'Erstellt' },
      fields: { name: 'Name', kind: 'Art', description: 'Beschreibung', active: 'Aktiv' }
    },
    agents: {
      deleteWithDeployments_other: '"{{name}}" und seine {{count}} Bereitstellungen löschen? Die Bereitstellungen unten werden ebenfalls gelöscht. Dies kann nicht rückgängig gemacht werden.',
      deleteWithDeployments_one: '"{{name}}" und seine {{count}} Bereitstellung löschen? Die Bereitstellung unten wird ebenfalls gelöscht. Dies kann nicht rückgängig gemacht werden.',
      deleteNoDeployments: '"{{name}}" löschen? Der Agent hat keine Bereitstellungen. Dies kann nicht rückgängig gemacht werden.',
      ...rp('Agenten', 'Benannte Fähigkeiten über REST, MCP und A2A. Bereitstellungen bestimmen, wie sie laufen.', 'Agent hinzufügen', 'Agent erstellen', 'Agent bearbeiten', 'Agentendetails', 'Agent löschen', 'Noch keine Agenten', 'Fügen Sie einen Agenten hinzu oder wenden Sie das Beispielmanifest unter Konfiguration > Manifeste an.'),
      sections: { identity: 'Identität', exposure: 'Bereitstellung nach außen', io: 'Ein- und Ausgabe', delegation: 'Delegation' },
      columns: { name: 'Name', displayName: 'Anzeigename', kind: 'Art', exposure: 'Erreichbarkeit', delegationMode: 'Delegation', tags: 'Schlagwörter', active: 'Aktiv', id: 'ID', createdUtc: 'Erstellt' },
      fields: {
        name: 'Name',
        displayName: 'Anzeigename',
        description: 'Beschreibung',
        kind: 'Art',
        agentVersion: 'Version',
        tags: 'Schlagwörter',
        remoteProtocol: 'Entferntes Protokoll',
        remoteEndpointUrl: 'URL des entfernten Endpunkts',
        exposeA2A: 'Über A2A bereitstellen',
        exposeMcpTool: 'Als eigenes MCP-Werkzeug bereitstellen',
        mcpToolName: 'Name des MCP-Werkzeugs',
        skills: 'A2A-Fähigkeiten',
        skillId: 'Fähigkeits-ID',
        skillName: 'Name',
        skillDescription: 'Beschreibung',
        inputMode: 'Eingabemodus',
        inputSchema: 'JSON-Schema der Eingabe',
        outputSchema: 'JSON-Schema der Ausgabe',
        delegationMode: 'Delegation',
        delegationAllowList: 'Aufrufbare Agenten',
        delegationMaxDepth: 'Maximale Tiefe',
        delegationAllowRecursion: 'Rekursion erlauben',
        active: 'Aktiv'
      },
      hints: { name: 'Kleinbuchstaben, Ziffern und Bindestriche. Wird in URLs und A2A-Karten verwendet.' },
      errors: { dnsName: 'Verwenden Sie Kleinbuchstaben, Ziffern und Bindestriche; Anfang und Ende müssen Buchstabe oder Ziffer sein.' }
    },
    deployments: {
      approvalsOn_one: 'An, {{count}} Regel',
      approvalsOn_other: 'An, {{count}} Regeln',
      approvalsOff: 'Aus',
      promptRoles: { Repair: 'Reparatur strukturierter Ausgabe', DelegatedTask: 'Aufgabenhülle für delegierte Läufe', Task: 'Aufgabenhülle', System: 'Systemprompt', ConversationFallback: 'Konversations-Neuaufbau (Verlauf)' },
      ...rp('Bereitstellungen', 'Bindet einen Agenten an Harness-Profil, Prompts, Geheimnisse, MCP-Server, Platzierung und Grenzen.', 'Bereitstellung hinzufügen', 'Bereitstellung erstellen', 'Bereitstellung bearbeiten', 'Bereitstellungsdetails', 'Bereitstellung löschen', 'Noch keine Bereitstellungen', 'Erstellen Sie eine Bereitstellung, um einen Agenten ausführbar zu machen.'),
      steps: { approvals: 'Freigaben', basics: 'Grundlagen', harness: 'Harness', prompts: 'Prompts', resources: 'Ressourcen', overrides: 'Überschreibungen', placement: 'Platzierung und Grenzen' },
      columns: { approvalsEnabled: 'Freigaben', name: 'Name', agentId: 'Agent', harnessProfileId: 'Harness-Profil', model: 'Modell', executor: 'Executor', weight: 'Gewichtung', configVersion: 'Konfigurationsversion', active: 'Aktiv', id: 'ID', createdUtc: 'Erstellt' },
      fields: {
        approvalsEnabled: 'Vor Werkzeugaufrufen fragen (Freigaben)',
        approvalDefaultAction: 'Wenn keine Regel zutrifft',
        approvalTimeoutSeconds: 'Zeitlimit für Freigaben (Sekunden)',
        approvalTimeoutDecision: 'Entscheidung, wenn niemand antwortet',
        approvalRules: 'Freigaberegeln',
        ruleAction: 'Aktion',
        rulePattern: 'Regel',
        ruleInputPattern: 'Eingabemuster',
        ruleDescription: 'Beschreibung',
        approvalTest: 'Werkzeugaufruf testen',
        name: 'Name',
        agentId: 'Agent',
        description: 'Beschreibung',
        weight: 'Verkehrsgewichtung',
        active: 'Aktiv',
        harnessProfileId: 'Harness-Profil',
        model: 'Modell',
        fallbackModel: 'Ersatzmodell',
        effort: 'Aufwand',
        maxTurns: 'Maximale Runden',
        maxBudgetUsd: 'Maximales Budget (USD)',
        parameters: 'Parameter',
        paramName: 'Name',
        paramValue: 'Wert',
        promptBindings: 'Prompt-Bindungen',
        promptRole: 'Rolle',
        template: 'Vorlage',
        pinnedVersion: 'Fixierte Version',
        resourceBindings: 'Ressourcenbindungen',
        bindingKind: 'Art',
        alias: 'Alias',
        resource: 'Ressource',
        workspaceTemplateId: 'Arbeitsbereichsvorlage',
        artifactStoreId: 'Artefaktspeicher',
        argumentOverrides: 'Argumentüberschreibungen',
        operation: 'Operation',
        match: 'Treffer',
        argTemplate: 'Vorlage',
        condition: 'Bedingung',
        environmentOverrides: 'Umgebungsüberschreibungen',
        envName: 'Name',
        envValue: 'Wertvorlage',
        isSecret: 'Geheim',
        fileOverrides: 'Dateiüberschreibungen',
        allowedRunOverrides: 'Überschreibungen, die Aufrufende pro Lauf setzen dürfen',
        validation: 'Prüfung',
        pattern: 'Muster oder Werte',
        nodePoolId: 'Knotenpool',
        nodeSelector: 'Knotenauswahl',
        maxConcurrentRuns: 'Maximal gleichzeitige Läufe',
        timeoutSeconds: 'Zeitlimit (Sekunden)',
        maxAttempts: 'Maximale Versuche',
        repetitionGuard: 'Wiederholungswächter',
        maxAssistantChars: 'Maximale Assistentenzeichen',
        noProgressSeconds: 'Zeitlimit ohne Fortschritt (Sekunden)',
        executor: 'Executor',
        podCpuRequest: 'CPU-Anforderung',
        podCpuLimit: 'CPU-Limit',
        podMemoryRequest: 'Speicheranforderung',
        podMemoryLimit: 'Speicherlimit',
        podEphemeralStorageRequest: 'Anforderung an flüchtigen Speicher',
        podEphemeralStorageLimit: 'Limit für flüchtigen Speicher'
      },
      hints: {
        approvalsEnabled: 'Funktioniert mit Claude Code-Profilen und Profilen, die den Codex app-server verwenden. Andere Harnesses haben keinen Freigabe-Hook, daher lehnt der Server diese Einstellung für sie ab.',
        approvalDefaultAction: 'Person fragen wartet unter Freigaben, bis jemand entscheidet oder das Zeitlimit abläuft.',
        approvalTimeoutSeconds: 'Von 10 bis 3.600 Sekunden. Leer bedeutet 300.',
        approvalRules: 'Verweigern geht vor Fragen, und Fragen geht vor Erlauben. Beispiele: Bash(npm test), Bash(npm run *), Edit(src/**), WebFetch(domain:example.com), mcp__github__*.',
        secretsKinds: 'Das Harness-Profil {{profile}} braucht ein beliebiges Geheimnis der Art {{kinds}}. Binden Sie eines unter einem beliebigen Alias.',
        secretsAliases: 'Das Harness-Profil {{profile}} liest Geheimnisse, die unter diesen Aliasen gebunden sind: {{aliases}}.',
        secretsNone: 'Das Harness-Profil {{profile}} liest kein Geheimnis, daher ist keine Geheimnisbindung nötig.',
        promptBindings: 'Ordnen Sie Prompt-Rollen (System, Task, DelegatedTask und weitere vom Profil verwendete Rollen) Vorlagen zu. Ohne Version wird immer die neueste verwendet.',
        resourceBindings: 'Aliase werden zu Vorlagenvariablen, zum Beispiel {{secret.anthropic}}.',
        weight: 'Anfragen ohne explizite Bereitstellung werden nach Gewichtung auf aktive Bereitstellungen verteilt.',
        maxConcurrentRuns: '0 bedeutet unbegrenzt.',
        timeoutCap: 'Jeder Lauf ist durch die Clustereinstellung {{setting}} auf {{value}} Sekunden begrenzt.',
        zeroUnlimited: '0 bedeutet unbegrenzt.',
        zeroOff: '0 schaltet den Wächter aus.',
        guardDefault: 'Leer verwendet den Cluster-Standard {{value}} aus {{setting}}.',
        guardDefaultUnknown: 'Leer verwendet die Clustereinstellung {{setting}}.',
        guardOwn: 'Für diese Bereitstellung festgelegt. Der Cluster-Standard ({{setting}}) ist {{value}}.',
        guardOwnUnknown: 'Für diese Bereitstellung festgelegt statt über die Clustereinstellung {{setting}}.',
        guardFollowing: 'Folgt dem Cluster-Standard {{value}} aus {{setting}}.',
        executorInherit: 'Leer verwendet den Standard des Knotenpools: {{executor}}.',
        executorSet: 'Prozess führt den Harness im Worker aus; Kubernetes-Job führt ihn in einem eigenen Pod aus.',
        podCpuRequest: 'Pod-Ressourcen gelten nur für Kubernetes-Job-Läufe. Verwenden Sie Kubernetes-Mengen wie 500m, 2, 512Mi oder 4Gi; leer verwendet den Worker-Standard.'
      },
      actions: { addRule: 'Regel hinzufügen', compilePreview: 'Kompilierungsvorschau', test: 'Testaufruf', useClusterDefault: 'Cluster-Standard verwenden' },
      sections: {
        guards: 'Laufwächter',
        execution: 'Executor und Pod-Ressourcen'
      },
      placeholders: {
        ruleInputPattern: 'Optionaler regulärer Ausdruck über das Eingabe-JSON',
        clusterDefault: 'Cluster-Standard ({{value}})',
        clusterDefaultUnknown: 'Cluster-Standard'
      },
      executorInherit: 'Standard des Knotenpools',
      executorInheritShort: 'Pool-Standard',
      errors: { rulePatternRequired: 'Geben Sie ein Regelmuster ein.', rulePatternOneLine: 'Ein Regelmuster muss in eine Zeile passen.', rulePatternTooLong: 'Ein Regelmuster darf höchstens 1.000 Zeichen lang sein.', tooManyRules: 'Eine Bereitstellung darf höchstens 500 Freigaberegeln haben.', approvalTimeout: 'Geben Sie eine ganze Zahl von Sekunden zwischen 10 und 3.600 ein.', quantity: 'Verwenden Sie eine Kubernetes-Menge wie 500m, 2, 512Mi oder 4Gi.' },
      guardStates: {
        on: 'an',
        off: 'aus'
      }
    },
    nodePools: {
      ...rp('Knotenpools', 'Worker-Knoten nach Labels gruppieren und optional Mandanten zuordnen.', 'Pool hinzufügen', 'Pool erstellen', 'Pool bearbeiten', 'Pooldetails', 'Pool löschen', 'Noch keine Knotenpools', 'Erstellen Sie einen Knotenpool, um Kapazität zuzuordnen.'),
      allTenants: 'Alle Mandanten',
      columns: { name: 'Name', description: 'Beschreibung', tenants: 'Mandanten', defaultExecutor: 'Standard-Executor', active: 'Aktiv', id: 'ID', createdUtc: 'Erstellt' },
      fields: { name: 'Name', description: 'Beschreibung', defaultExecutor: 'Standard-Executor', tenants: 'Zugelassene Mandanten-IDs', active: 'Aktiv' },
      hints: { tenants: 'Leer lassen, um alle Mandanten zuzulassen.' }
    },
    runs: {
      ...rp('Läufe', 'Jeder Agentenaufruf mit Status, Knoten, Dauer und Ergebnis.', 'Lauf hinzufügen', 'Lauf erstellen', 'Lauf bearbeiten', 'Laufdetails', 'Lauf löschen', 'Noch keine Läufe', 'Rufen Sie einen Agenten auf, um einen Lauf zu starten.'),
      columns: {
        approvalWaitMs: 'Freigabe-Wartezeit',
        delegationWaitMs: 'Delegationswartezeit',
        timeToFirstTokenExcludingDelegationMs: 'TTFT ohne Delegation',
        id: 'Lauf',
        agentName: 'Agent',
        status: 'Status',
        outcome: 'Ergebnis',
        harnessType: 'Harness',
        leaseNodeName: 'Knoten',
        timeToFirstTokenMs: 'TTFT',
        streamingMs: 'Streaming',
        executionMs: 'Dauer',
        queueMs: 'Wartezeit',
        totalMs: 'Gesamtzeit',
        inputTokens: 'Eingabe-Token',
        outputTokens: 'Ausgabe-Token',
        cachedTokens: 'Cache-Token',
        reasoningTokens: 'Reasoning-Token',
        outputTokensPerSecond: 'Token/s',
        costUsd: 'Kosten',
        toolCallCount: 'Werkzeugaufrufe',
        depth: 'Tiefe',
        createdUtc: 'Erstellt',
        conversationId: 'Konversation'
      },
      actions: { cancel: 'Lauf abbrechen', retry: 'Lauf wiederholen' },
      toasts: { cancelRequested: 'Abbruch angefordert.', retried: 'Wiederholung gestartet.' },
      turn: 'Runde {{turn}}'
    },
    nodes: {
      ...rp('Knoten', 'Worker-Knoten, die Läufe übernehmen und ausführen. Sperren oder leeren Sie einen Knoten vor Wartungsarbeiten.', 'Knoten hinzufügen', 'Knoten erstellen', 'Knoten bearbeiten', 'Knotendetails', 'Knoten löschen', 'Noch keine Knoten', 'Worker-Knoten registrieren sich beim Start selbst. Stellen Sie das Worker-StatefulSet bereit oder starten Sie Garrison.Worker lokal.'),
      columns: { name: 'Name', status: 'Status', capacity: 'Läufe', harnesses: 'Harnesses', executors: 'Executors', containerized: 'Containerisiert', labels: 'Labels', nodeVersion: 'Version', lastHeartbeatUtc: 'Letzter Heartbeat', id: 'ID' },
      fields: { address: 'Adresse', maxConcurrentRuns: 'Kapazität', childReserveSlots: 'Kind-Reserve', maxResidentWaiters: 'Höchstzahl wartender Läufe', activeRuns: 'Aktive Läufe', capabilities: 'Fähigkeiten', detectedVersion: 'Version', available: 'Verfügbar', detail: 'Detail' },
      actions: { cordon: 'Sperren', uncordon: 'Entsperren', drain: 'Leeren', runs: 'Läufe anzeigen', grafana: 'In Grafana öffnen' },
      toasts: { cordoned: 'Knoten gesperrt.', uncordoned: 'Knoten entsperrt.', draining: 'Knoten wird geleert.' }
    },
    controlNodes: {
      ...rp('Steuerungsebene', 'Server-Replikate, die die API, MCP und A2A bereitstellen und Läufe planen. Jedes registriert sich selbst und sendet alle 5 Sekunden einen Heartbeat.', 'Steuerungsknoten hinzufügen', 'Steuerungsknoten erstellen', 'Steuerungsknoten bearbeiten', 'Details zum Steuerungsknoten', 'Steuerungsknoten löschen', 'Keine Steuerungsknoten gemeldet', 'Steuerungsknoten erscheinen, sobald ein Server-Replikat startet. Server, die älter als diese Konsole sind, melden sie nicht.'),
      columns: { name: 'Name', status: 'Status', version: 'Version', schemaVersion: 'Schemaversion', backplane: 'Ereignis-Backplane', uptime: 'Laufzeit', lastHeartbeatUtc: 'Letzter Heartbeat', activeRequests: 'Anfragen', openStreams: 'Datenströme', heldLongPolls: 'Long-Polls', address: 'Adresse', hostname: 'Hostname', startedUtc: 'Gestartet', id: 'ID' },
      fields: { name: 'Name', id: 'Knoten-ID', hostname: 'Hostname', address: 'Adresse', isLeader: 'Leader', leaderEpoch: 'Leader-Epoche', version: 'Version', schemaVersion: 'Schemaversion', backplane: 'Ereignis-Backplane', startedUtc: 'Gestartet', uptime: 'Laufzeit', lastHeartbeatUtc: 'Letzter Heartbeat', activeRequests: 'Aktive Anfragen', openStreams: 'Offene Datenströme', heldLongPolls: 'Gehaltene Long-Polls', respondingNodeId: 'Beantwortet von' },
      leader: 'Leader',
      stale: 'Veraltet',
      answeredBy: 'Welches Replikat geantwortet hat: {{node}}',
      answeredByLeader: 'Welches Replikat geantwortet hat: {{node}} (der Leader)',
      actions: { grafana: 'In Grafana öffnen' }
    },
    audit: {
      ...rp('Audit', 'Authentifizierungs-, Autorisierungs- und Konfigurationsereignisse dieses Mandanten.', 'Eintrag hinzufügen', 'Eintrag erstellen', 'Eintrag bearbeiten', 'Auditdetails', 'Eintrag löschen', 'Noch keine Auditeinträge', 'Sicherheitsereignisse erscheinen hier, sobald Personen und Agenten Garrison nutzen.'),
      columns: { createdUtc: 'Zeit', eventType: 'Ereignis', principalName: 'Prinzipal', resource: 'Ressource', reason: 'Grund', sourceIp: 'Quell-IP', id: 'ID' },
      fields: {
        eventType: 'Ereignis',
        principalType: 'Prinzipaltyp',
        principalName: 'Prinzipal',
        principalId: 'Prinzipal-ID',
        resourceType: 'Ressourcentyp',
        resourceId: 'Ressourcen-ID',
        operation: 'Operation',
        method: 'Methode',
        path: 'Pfad',
        authResult: 'Authentifizierungsergebnis',
        authorizationResult: 'Autorisierungsergebnis',
        reason: 'Grund',
        bypassReason: 'Grund der Umgehung',
        statusCode: 'Statuscode',
        sourceIp: 'Quell-IP',
        requestId: 'Anfrage-ID',
        createdUtc: 'Zeit'
      }
    },
    manifestApplies: {
      ...rp('Anwendungsverlauf', 'Jede Manifest-Anwendung und jeder Probelauf mit Ergebnissen pro Dokument.', 'Eintrag hinzufügen', 'Eintrag erstellen', 'Eintrag bearbeiten', 'Anwendungsdetails', 'Eintrag löschen', 'Noch keine Anwendungen', 'Anwendungen erscheinen hier, nachdem Sie ein Manifest anwenden oder testen.'),
      columns: { createdUtc: 'Zeit', principalName: 'Angewendet von', dryRun: 'Probelauf', counts: 'Ergebnisse' }
    },
    conversations: {
      title: 'Konversationen',
      subtitle: 'Mehrrundige Gespräche mit einem Agenten. Jede Runde ist ein Lauf, der die Harness-Sitzung der vorherigen Runde fortsetzt.',
      add: 'Konversation hinzufügen',
      create: 'Konversation erstellen',
      edit: 'Konversation bearbeiten',
      view: 'Konversationsdetails',
      deleteTitle: 'Konversation löschen',
      emptyTitle: 'Noch keine Konversationen',
      emptyBody: 'Beginnen Sie eine auf der Seite Aufrufen mit „Neue Konversation beginnen“ oder senden Sie eine A2A-Nachricht: Jeder A2A-Kontext ist eine Konversation.',
      untitled: 'Konversation ohne Titel',
      columns: {
        title: 'Titel',
        agentName: 'Agent',
        state: 'Zustand',
        turnCount: 'Runden',
        affinityNodeName: 'Affinitätsknoten',
        fallbackCount: 'Neuaufbauten',
        lastFallbackReason: 'Letzter Neuaufbau',
        harnessType: 'Harness',
        callerName: 'Begonnen von',
        contextId: 'Kontext-ID',
        sessionId: 'Sitzungs-ID',
        lastActivityUtc: 'Letzte Aktivität',
        createdUtc: 'Erstellt',
        id: 'ID'
      },
      states: {
        busy: 'Arbeitet',
        idle: 'Bereit'
      },
      actions: {
        continue: 'Fortsetzen',
        runs: 'Runden als Läufe anzeigen'
      }
    }
  },
  views: {
    approvalDetail: {
      title: 'Freigabe',
      titleWithTool: 'Freigabe für {{tool}}',
      backToInbox: 'Alle Freigaben',
      pending: 'Wartet darauf, dass eine Person diesen Werkzeugaufruf erlaubt oder verweigert.',
      pendingExpires: 'Wartet auf eine Person. Wenn niemand entscheidet, läuft sie {{when}} mit der Entscheidung {{decision}} ab.',
      request: 'Anfrage',
      rules: 'Regeln',
      noRule: 'Keine Regel hat zugetroffen',
      noInput: 'Es wurde keine Eingabe aufgezeichnet.',
      notFoundTitle: 'Freigabe nicht gefunden',
      notFoundBody: 'Sie gehört möglicherweise zu einem anderen Mandanten, oder die ID ist falsch.'
    },
    home: {
      observabilityState: { reachable: 'Erreichbar', unreachable: 'Nicht erreichbar', checking: 'Wird geprüft', unknown: 'Status unbekannt' },
      observabilityVersion: 'Version {{version}}',
      observabilityOpen: '{{service}} öffnen',
      kpisGrafana: 'Übersicht in Grafana öffnen',
      grafanaDashboards: 'Grafana-Dashboards',
      grafanaSections: { overview: 'Übersicht', http: 'HTTP-API', runs: 'Läufe', agents: 'Agenten', models: 'Modelle und Tokens', workers: 'Worker', kubernetes: 'Kubernetes-Executor', protocols: 'Protokolle', scheduler: 'Scheduler und Warteschlange', database: 'Datenbank', controlPlane: 'Steuerungsebene', security: 'Sicherheit und Authentifizierung', integrations: 'Integrationen', logs: 'Logs und Traces', autonomy: 'Autonomie' },
      observabilitySetup: 'Beobachtbarkeit einrichten',
      observabilityNone: 'Für diese Installation sind keine Beobachtbarkeitsdienste (Grafana, Prometheus, Tempo oder Loki) konfiguriert.',
      observability: 'Beobachtbarkeit',
      title: 'Startseite',
      subtitle: 'Was Ihre Agenten und Worker-Knoten gerade tun.',
      lastLoaded: 'Aktualisiert {{time}}',
      partial: 'Einige Bereiche konnten nicht geladen werden. Die Werte sind unvollständig.',
      getStartedTitle: 'Dieser Mandant hat noch keine Agenten',
      getStartedBody: 'Der Einrichtungsassistent hinterlegt Zugangsdaten, wendet einen Beispielagenten an und startet einen Test.',
      runSetup: 'Einrichtung starten',
      kpis: {
        agents: 'Agenten',
        deployments: 'Bereitstellungen',
        activeRuns: 'Aktive Läufe',
        queued: 'In Warteschlange',
        succeeded: 'Erfolgreich',
        failed: 'Fehlgeschlagen',
        nodes: 'Bereite Knoten',
        controlNodes: 'Steuerungsebene bereit',
        nodesNote: 'Bereit / gesamt',
        last24h: 'Letzte 24 Stunden'
      },
      requestActivity: 'API-Anfrageaktivität',
      nodesTitle: 'Knoten',
      noNodesTitle: 'Keine Worker-Knoten registriert',
      noNodesBody: 'Starten Sie Garrison.Worker oder skalieren Sie das Worker-StatefulSet. Knoten registrieren sich selbst.',
      nodeLoad: '{{active}} von {{max}} Läufen',
      controlPlaneSection: 'Steuerungsebene',
      workersSection: 'Worker-Knoten',
      openControlPlane: 'Alle anzeigen',
      openWorkers: 'Alle anzeigen',
      noControlNodes: 'Es hat sich noch kein Steuerungsknoten registriert.',
      controlNodesUnavailable: 'Steuerungsknoten sind nicht verfügbar: Der Server ist älter als diese Konsole, oder Sie dürfen Knoten nicht lesen.',
      recentFailures: 'Aktuelle Fehler',
      noFailures: 'In letzter Zeit keine fehlgeschlagenen Läufe.',
      cta: {
        title: 'Häufige Aufgaben',
        invoke: 'Agenten aufrufen',
        addAgent: 'Agent hinzufügen',
        applyManifest: 'Manifest anwenden',
        inspectRuns: 'Läufe untersuchen',
        nodes: 'Worker-Knoten prüfen',
        apiExplorer: 'API-Explorer öffnen',
        analytics: 'Laufanalysen anzeigen'
      },
      externalServices: 'Externe Dienste',
      externalServicesNote: 'Mitgelieferte Beobachtungswerkzeuge. Ändern Sie die Standardzugangsdaten, bevor Sie diese Umgebung teilen.',
      externalServicesNone: 'Für diese Umgebung sind keine externen Dienste konfiguriert.',
      credentials: 'Standardzugangsdaten',
      services: { loki: 'Loki', grafana: 'Grafana', prometheus: 'Prometheus', tempo: 'Tempo' }
    },
    markdown: {
      showRaw: 'Rohtext anzeigen',
      showRendered: 'Formatiert anzeigen'
    },
    invoke: {
      stream: {
        tabsLabel: 'Antwortansichten',
        cardLabel: 'Ausgabe des Laufs',
        preview: 'Vorschau',
        response: 'Antwort',
        starting: 'Lauf wird gestartet...',
        live: 'Live',
        finished: 'Beendet',
        elapsed: 'Verstrichen',
        firstToken: 'Erstes Token',
        tokensPerSecond: 'Tempo',
        finishedHint: 'Lauf beendet.',
        showResponse: 'Zur Antwort',
        reasoning: 'Gedankengang',
        waiting: 'Warte auf Ausgabe...',
        waitingCodex: 'Warte auf Ausgabe. Codex sendet seine Antwort am Ende in einem Stück.',
        codexNote: 'Codex streamt nicht: Die Antwort erscheint hier in einem Stück, wenn der Lauf endet.',
        noText: 'Der Lauf hat keinen gestreamten Text erzeugt. Das Ergebnis steht im Tab Antwort.',
        jump: 'Zum Neuesten',
        tool: {
          running: 'läuft',
          ok: 'erfolgreich',
          failed: 'fehlgeschlagen'
        }
      },
      noDeployment: 'Dieser Agent hat keine aktive Bereitstellung mit einer Gewichtung über null, daher würde ein Aufruf abgelehnt. Fügen Sie im Tab Bereitstellungen eine hinzu oder erhöhen Sie eine Gewichtung.',
      title: 'Aufrufen',
      subtitle: 'Senden Sie einem Agenten eine Nachricht und verfolgen Sie das Protokoll live.',
      request: 'Anfrage',
      agent: 'Agent',
      deployment: 'Bereitstellung',
      weighted: 'Beliebige aktive Bereitstellung (gewichtet)',
      default: 'Standard der Bereitstellung',
      message: 'Nachricht',
      messagePlaceholder: 'Was soll der Agent tun?',
      shortcut: 'Mit Strg+Eingabe oder Cmd+Eingabe senden.',
      send: 'Senden',
      sending: 'Wird gesendet...',
      openRun: 'Lauf öffnen',
      idleTitle: 'Noch kein Lauf',
      idleBody: 'Senden Sie eine Nachricht, um einen Lauf zu starten. Das Protokoll erscheint hier live.',
      noAgentsTitle: 'Keine aufrufbaren Agenten',
      noAgentsBody: 'Erstellen Sie einen Agenten und eine Bereitstellung oder wenden Sie das Beispielmanifest an.',
      applySample: 'Zu den Manifesten',
      stopOnLeave: 'Lauf beim Verlassen stoppen',
      cancel: 'Lauf abbrechen',
      cancelling: 'Wird abgebrochen...',
      timeLimit: 'Zeitlimit',
      timeLimitPlaceholder: 'Standard der Bereitstellung',
      timeLimitClear: 'Standard verwenden',
      timeLimitRange: 'Erlaubt: {{min}} bis {{max}}.',
      timeLimitAny: 'Sekunden, die der Lauf dauern darf, bevor er wegen Zeitüberschreitung endet.',
      timeLimitCap: 'Der Cluster stoppt jeden Lauf nach {{max}}.',
      timeLimitErrors: {
        notInteger: 'Gib eine ganze Zahl von Sekunden ein.',
        range: 'Gib ein Zeitlimit von {{min}} bis {{max}} ein.',
        aboveCap: 'Der Cluster erlaubt höchstens {{max}} pro Lauf.'
      },
      timeUnits: {
        seconds: '{{value}} s',
        minutes: '{{value}} min',
        hours: '{{value}} h',
        secondsWord: 'Sekunden'
      },
      conversation: {
        mode: 'Konversation',
        modes: {
          none: 'Einzelner Lauf (keine Konversation)',
          start: 'Neue Konversation beginnen',
          continue: 'Konversation fortsetzen'
        },
        pick: 'Fortzusetzende Konversation',
        choose: 'Konversation auswählen',
        option: '{{title}} (Runden: {{turns}})',
        pinned: 'Jede Runde läuft auf der Bereitstellung der ersten Runde der Konversation, daher lässt sich die Bereitstellung hier nicht wählen.',
        busy: 'Diese Konversation arbeitet noch an ihrer vorherigen Runde. Eine neue Nachricht wird abgelehnt, bis dieser Lauf endet.',
        open: 'Konversation öffnen (Runde {{turn}})'
      }
    },
    runDetail: {
      awaitingApproval_one: 'Dieser Lauf wartet darauf, dass eine Person {{count}} Werkzeugaufruf freigibt.',
      awaitingApproval_other: 'Dieser Lauf wartet darauf, dass eine Person {{count}} Werkzeugaufrufe freigibt.',
      reviewApprovals: 'Prüfen',
      approvals_one: 'Freigaben ({{count}})',
      approvals_other: 'Freigaben ({{count}})',
      noApprovals: 'Dieser Lauf hat keine Freigaben angefordert.',
      openApproval: 'Freigabe öffnen',
      viewTrace: 'Trace anzeigen',
      viewLogs: 'Logs anzeigen',
      traceId: 'Trace-ID',
      deploymentDeleted: 'Die Bereitstellung dieses Laufs wurde gelöscht, daher kann er nicht wiederholt werden. Rufen Sie stattdessen den Agenten {{agent}} erneut auf.',
      templatesUsed: 'Verwendete Vorlagen',
      agentDeleted: 'Der Agent {{agent}} existiert nicht mehr, daher kann dieser Lauf nicht wiederholt werden. Datensatz, Transkript und Telemetrie bleiben hier verfügbar.',
      title: 'Lauf',
      titleWithAgent: 'Lauf von {{agent}}',
      deployment: 'Bereitstellung',
      model: 'Verwendetes Modell',
      tokensLabel: 'Token',
      tokens: '{{input}} ein, {{output}} aus',
      estimated: 'geschätzt',
      caller: 'Aufrufer',
      parent: 'Übergeordneter Lauf',
      attempt: 'Versuch',
      outputSchema: 'Ausgabeschema',
      outputSchemaStates: {
        valid: 'Gültig',
        validAfterRepair: 'Gültig nach einer Reparatur',
        invalid: 'Ungültig',
        invalidAfterRepair: 'Ungültig nach einer Reparatur'
      },
      started: 'Gestartet',
      completed: 'Abgeschlossen',
      exitCode: 'Exit-Code',
      transcript: 'Protokoll',
      result: 'Ergebnis',
      input: 'Eingabe',
      stderr: 'Stderr',
      children_one: 'Unterläufe ({{count}})',
      children_other: 'Unterläufe ({{count}})',
      eventFilter: 'Anzeigen',
      eventCount_one: '{{count}} Ereignis',
      eventCount_other: '{{count}} Ereignisse',
      noEvents: 'Noch keine Ereignisse. Sie erscheinen, sobald die Harness sie erzeugt.',
      failed: 'Fehlgeschlagen',
      noResult: 'Der Lauf hat keinen Ergebnistext erzeugt.',
      pending: 'Das Ergebnis erscheint, wenn der Lauf beendet ist.',
      structuredOutput: 'Strukturierte Ausgabe',
      templateVersions: 'Verwendete Versionen der Prompt-Vorlagen',
      noStderr: 'Es wurde keine Stderr-Ausgabe erfasst.',
      noChildren: 'Dieser Lauf hat keine anderen Agenten aufgerufen.',
      confirmCancel: 'Diesen Lauf abbrechen? Der Harness-Prozess wird auf seinem Knoten beendet.',
      notFoundTitle: 'Lauf nicht gefunden',
      notFoundBody: 'Er wurde möglicherweise gelöscht oder gehört zu einem anderen Mandanten.',
      telemetry: {
        approvalNote: 'Dieser Lauf hat {{wait}} auf Freigabeentscheidungen gewartet. Die Ausführungszeit enthält diese Wartezeit.',
        delegationNote: 'Dieser Lauf hat {{wait}} auf delegierte Läufe gewartet. Die Zeit bis zum ersten Token beträgt {{ttft}} mit dieser Wartezeit und {{excluding}} ohne sie; der zweite Wert ist mit Agenten vergleichbar, die nicht delegieren.',
        title: 'Telemetrie',
        phases: 'Laufzeit nach Phase',
        phase: { delegation: 'Warten auf delegierte Läufe', queue: 'Warteschlange', startup: 'Start bis zum ersten Token', streaming: 'Streaming', tail: 'Nach dem letzten Token' },
        fields: {
          approvalWaitMs: 'Freigabe-Wartezeit',
          delegationWaitMs: 'Delegationswartezeit',
          timeToFirstTokenExcludingDelegationMs: 'Zeit bis zum ersten Token ohne Delegation',
          timeToFirstTokenMs: 'Zeit bis zum ersten Token',
          streamingMs: 'Streaming-Zeit',
          executionMs: 'Ausführungszeit',
          queueMs: 'Wartezeit',
          totalMs: 'Gesamtzeit',
          outputTokensPerSecond: 'Ausgabe-Token pro Sekunde',
          inputTokens: 'Eingabe-Token',
          outputTokens: 'Ausgabe-Token',
          cachedTokens: 'Cache-Token',
          reasoningTokens: 'Reasoning-Token',
          toolCallCount: 'Werkzeugaufrufe',
          costUsd: 'Kosten',
          firstTokenUtc: 'Erstes Token um',
          lastTokenUtc: 'Letztes Token um'
        }
      },
      conversation: 'Konversation',
      conversationSession: 'Sitzung',
      resumeSessionId: 'Fortgesetzte Sitzung',
      affinityNode: 'Affinitätsknoten',
      affinityUntil: 'bis {{time}}'
    },
    queue: {
      title: 'Warteschlange',
      subtitle: 'Wartende, zugewiesene und laufende Arbeit nach Agent und Harness.',
      queued: 'In Warteschlange',
      leased: 'Zugewiesen',
      running: 'Läuft',
      emptyTitle: 'Nichts wartet',
      emptyBody: 'Läufe erscheinen hier, solange sie auf einen Worker-Knoten warten.'
    },
    agentDetail: {
      invoke: 'Aufrufen',
      grafana: 'In Grafana öffnen',
      noActiveDeployment: 'Dieser Agent hat keine aktive Bereitstellung; Aufrufe werden abgelehnt.',
      deployments_one: 'Bereitstellungen ({{count}})',
      deployments_other: 'Bereitstellungen ({{count}})',
      recentRuns: 'Aktuelle Läufe',
      card: 'A2A-Karte',
      traffic: 'Verkehrsanteil',
      noDeploymentsTitle: 'Keine Bereitstellungen',
      noDeploymentsBody: 'Erstellen Sie eine Bereitstellung, um diesen Agenten an eine Harness zu binden.',
      noRuns: 'Dieser Agent wurde noch nicht ausgeführt.',
      selectionNote: 'Jeder Aufruf ohne explizite Bereitstellung geht an eine aktive Bereitstellung, die zufällig im Verhältnis zu ihrer Gewichtung gewählt wird.',
      manageDeployments: 'Bereitstellungen verwalten',
      conversations: 'Konversationen'
    },
    templateEditor: {
      cloneToEdit: 'Zum Bearbeiten klonen',
      builtInReadOnly: 'Integrierte Vorlagen sind schreibgeschützt, daher sind alle Felder hier gesperrt. Klonen Sie die Vorlage, um eine bearbeitbare Kopie zu erhalten.',
      renameHint: 'Sie können diese Vorlage umbenennen. Bereitstellungen behalten ihre Bindungen, weil sie auf die ID verweisen; Vorlagen, die diese per Name einbinden, müssen Sie von Hand anpassen.',
      cloneDialog: { taken: 'Eine Vorlage namens {{name}} existiert bereits. Wählen Sie einen anderen Namen.', reserved: 'Namen mit dem Präfix builtin/ sind integrierten Vorlagen vorbehalten.', hint: 'Sie können die Kopie später auf ihrer Seite umbenennen.', name: 'Name der Kopie', body: 'Die Kopie beginnt mit dem aktuellen Inhalt als Version 1 und kann bearbeitet, umbenannt und gelöscht werden.', title: '{{name}} klonen' },
      newTitle: 'Neue Prompt-Vorlage',
      subtitle: 'Vorlage schreiben, mit Beispielkontext prüfen und speichern.',
      builtInNote: 'Integrierte Vorlagen sind schreibgeschützt. Klonen zum Anpassen oder zurücksetzen, um den Auslieferungsstand herzustellen.',
      content: 'Inhalt',
      changeNote: 'Änderungsnotiz',
      syntaxHint: 'Syntax: {{variable}}, {{wert | default: "x"}}, {{#if x}}...{{else}}...{{/if}}, {{#each liste}}...{{/each}}, {{> vorlagenname}}.',
      variables: 'Verwendete Variablen',
      noVariables: 'Keine Variablen referenziert.',
      preview: 'Live-Vorschau',
      sampleContext: 'Beispielkontext (JSON)',
      rendered: 'Ergebnis',
      previewEmpty: 'Der erzeugte Text erscheint hier.',
      missing: 'Fehlende Variablen: {{list}}',
      versions_one: 'Versionen ({{count}})',
      versions_other: 'Versionen ({{count}})',
      noVersions: 'Noch keine gespeicherten Versionen.',
      version: 'Version',
      note: 'Notiz',
      author: 'Autor',
      diff: 'Vergleich',
      restore: 'Wiederherstellen',
      diffTitle: 'Version {{version}} im Vergleich zum Editor',
      current: 'Editor',
      reset: 'Auf Standard zurücksetzen',
      savedVersion: 'Neue Version gespeichert.',
      restored: 'Version {{version}} wiederhergestellt.',
      resetDone: 'Auf den Auslieferungsstand zurückgesetzt.',
      confirm: {
        restoreTitle: 'Version wiederherstellen',
        restoreMessage: 'Version {{version}} wiederherstellen? Der aktuelle Inhalt bleibt im Verlauf erhalten.',
        resetTitle: 'Vorlage zurücksetzen',
        resetMessage: '"{{name}}" auf den Auslieferungsstand zurücksetzen?',
        deleteTitle: 'Vorlage löschen',
        deleteMessage: '"{{name}}" löschen? Bereitstellungen, die sie binden, lassen sich dann nicht mehr kompilieren.'
      }
    },
    manifests: {
      warnings_one: '{{count}} Warnung',
      warnings_other: '{{count}} Warnungen',
      planned: 'Würde: {{result}}',
      changes: { count_other: '{{count}} Felder ändern sich.', count_one: '{{count}} Feld ändert sich.', empty: '(leer)', after: 'Nachher', before: 'Vorher', field: 'Feld' },
      title: 'Manifeste',
      subtitle: 'Konfiguration als Code anwenden. Probeläufe prüfen, ohne zu schreiben.',
      applyTab: 'Anwenden',
      exportTab: 'Exportieren',
      historyTab: 'Verlauf',
      upload: 'Datei hochladen',
      loadSample: 'Beispiel laden',
      document: 'Manifest (YAML oder JSON, mehrere Dokumente)',
      dryRun: 'Probelauf',
      apply: 'Anwenden',
      validated: 'Prüfung abgeschlossen.',
      applied: 'Manifest angewendet.',
      results: 'Ergebnisse',
      dryRunResults: 'Ergebnisse des Probelaufs',
      kind: 'Art',
      name: 'Name',
      result: 'Ergebnis',
      message: 'Meldung',
      confirmTitle: 'Manifest anwenden',
      confirmMessage: 'Jedes Dokument dieses Manifests auf den aktuellen Mandanten anwenden?',
      exportHelp: 'Konfiguration dieses Mandanten exportieren. Geheime Werte werden nie exportiert.',
      export: 'Exportieren',
      download: 'Herunterladen',
      counts: '{{created}} erstellt, {{updated}} aktualisiert, {{unchanged}} unverändert, {{failed}} fehlgeschlagen'
    },
    requests: {
      grafana: 'HTTP-Dashboard in Grafana',
      title: 'Anfrageverlauf',
      subtitle: 'Erfasster API-Verkehr. Jede Anfrage im Detail prüfen und Aufbewahrung verwalten.',
      kpis: { total: 'Gespeicherte Anfragen', success: 'Erfolgreich', failure: 'Fehler', avgDuration: 'Mittlere Dauer' },
      columns: { time: 'Zeit', method: 'Methode', path: 'Pfad', status: 'Status', duration: 'Dauer', principal: 'Prinzipal' },
      bulkDeleteTitle: 'Anfrageverlauf löschen',
      bulkDeleteMessage: 'Alle {{count}} Anfragen löschen, die den aktuellen Filtern entsprechen?',
      bulkDeleteAll: 'Alle Treffer löschen',
      deleteOneTitle: 'Anfrage löschen',
      deleteOneMessage: 'Anfrage {{id}} löschen?',
      deleted: 'Gelöscht.',
      emptyTitle: 'Kein Anfrageverlauf',
      emptyBodyNoTraffic: 'Es wurde noch kein API-Verkehr gespeichert.',
      emptyBodyNoMatch: 'Keine Anfragen entsprechen den aktuellen Filtern.'
    },
    explorer: {
      title: 'API-Explorer',
      subtitle: 'Live-Aufrufe gegen diesen Server ausführen, gesteuert durch sein OpenAPI-Dokument.',
      operations: 'Operationen',
      selectOperation: 'Wählen Sie eine Operation, um eine Anfrage zu erstellen.',
      selectOperationOption: 'Operation auswählen...',
      pathParams: 'Pfadparameter',
      queryParams: 'Abfrageparameter',
      headers: 'Header',
      addHeader: 'Header hinzufügen',
      headerName: 'Header-Name',
      headerValue: 'Wert des Headers {{name}}',
      removeHeader: 'Header {{name}} entfernen',
      body: 'Anfragetext',
      resolvedUrl: 'Aufgelöste URL',
      copyUrl: 'URL kopieren',
      execute: 'Ausführen',
      executing: 'Wird ausgeführt...',
      stop: 'Stoppen',
      streaming: 'Streaming',
      response: 'Antwort',
      responseHeaders: 'Antwort-Header',
      responseBody: 'Antworttext',
      snippets: 'Codebeispiele',
      history: 'Letzte Anfragen',
      historyEmpty: 'Keine letzten Anfragen.',
      loadHistory: 'Laden',
      deleteHistory: 'Löschen',
      clearHistory: 'Verlauf leeren',
      required: 'erforderlich',
      confirmTitle: 'Destruktive Operation ausführen',
      confirmMessage: 'Diese {{method}}-Anfrage kann Daten ändern oder löschen. Fortfahren?',
      noSpecTitle: 'OpenAPI-Dokument nicht verfügbar',
      noSpecBody: 'Dieser Server hat kein verwendbares /openapi.json geliefert, daher kann der Explorer keine Operationen anzeigen.'
    },
    settings: {
      errors: { allowed: 'Wählen Sie einen dieser Werte: {{values}}.', boolean: 'Wählen Sie wahr oder falsch.', max: 'Geben Sie {{max}} oder weniger ein.', min: 'Geben Sie {{min}} oder mehr ein.', range: 'Geben Sie einen Wert von {{min}} bis {{max}} ein.', integer: 'Geben Sie eine ganze Zahl ein.', number: 'Geben Sie eine Zahl ein.' },
      notSaved: 'Es wurde nichts gespeichert. Korrigieren Sie die markierten Einstellungen und speichern Sie erneut.',
      title: 'Einstellungen',
      subtitle: 'Servereinstellungen aus der Einstellungsdatei und in der Datenbank gespeicherte Clustereinstellungen.',
      readOnly: 'Sie sehen die Einstellungen schreibgeschützt. Nur Systemadministration kann sie ändern.',
      restartBanner: 'Einige gespeicherte Änderungen werden erst nach einem Neustart wirksam.',
      restarting: 'Der Server startet neu. Diese Seite verbindet sich automatisch wieder.',
      restarted: 'Der Server ist wieder erreichbar.',
      restartTimeout: 'Der Server war nach drei Minuten nicht wieder erreichbar. Prüfen Sie den Pod-Status.',
      restart: 'Server neu starten',
      restartConfirmTitle: 'Server neu starten',
      restartConfirmMessage: 'Diesen Knoten der Steuerungsebene jetzt neu starten? Laufende Anfragen werden abgeschlossen und die Konsole verbindet sich neu.',
      savedLive: 'Einstellungen gespeichert und angewendet.',
      savedRestart: 'Einstellungen gespeichert. Starten Sie den Server neu, um alle Änderungen anzuwenden.',
      live: 'Sofort wirksam',
      restartRequired: 'Neustart erforderlich',
      secretSet: 'Gesetzt (neuen Wert eingeben zum Ersetzen)',
      secretNotSet: 'Nicht gesetzt',
      invalidNumber: 'Geben Sie eine Zahl ein.',
      range: 'Zulässiger Bereich {{min}} bis {{max}}',
      testDatabase: 'Datenbankverbindung testen',
      testing: 'Wird getestet...',
      dbOk: 'Verbindung erfolgreich',
      dbFailed: 'Verbindung fehlgeschlagen',
      unavailableTitle: 'Einstellungen nicht verfügbar',
      unavailableBody: 'Dieser Server hat seine Einstellungen nicht geliefert.',
      sources: { File: 'Einstellungsdatei', Environment: 'Umgebung', ConfigMap: 'ConfigMap', Database: 'Cluster' },
      lockedBy: {
        Environment: 'Durch eine Umgebungsvariable gesetzt. Der Umgebungswert hat Vorrang.',
        ConfigMap: 'Von einer Kubernetes-ConfigMap verwaltet. Ändern Sie den Wert in Ihren Manifesten.',
        other: 'Diese Einstellung kann hier nicht bearbeitet werden.'
      },
      groups: { Codex: 'Codex', Archive: 'Archiv', General: 'Allgemein', Rest: 'REST', Mcp: 'MCP', Database: 'Datenbank', Logging: 'Protokollierung', Auth: 'Authentifizierung', Security: 'Sicherheit', RequestHistory: 'Anfrageverlauf', Telemetry: 'Telemetrie', Cluster: 'Cluster', Scheduling: 'Planung', Runs: 'Läufe', Audit: 'Audit', Runtime: 'Laufzeit', Observability: 'Beobachtbarkeit' },
      fields: {
        Observability: {
          GrafanaUrl: 'Grafana-URL',
          PrometheusUrl: 'Prometheus-URL',
          LokiUrl: 'Loki-URL',
          TempoUrl: 'Tempo-URL',
          GrafanaInternalUrl: 'Interne Grafana-URL',
          PrometheusInternalUrl: 'Interne Prometheus-URL',
          LokiInternalUrl: 'Interne Loki-URL',
          TempoInternalUrl: 'Interne Tempo-URL'
        },
        Rest: {
          ExternalBaseUrl: 'Externe REST-URL',
          PublicBaseUrl: 'Interne REST-URL für Läufe',
          Ssl: 'REST-TLS',
          Port: 'REST-Port',
          Hostname: 'REST-Bindungshostname'
        },
        Mcp: {
          InternalPort: 'Interner MCP-Port',
          SessionIdleTimeoutSeconds: 'Leerlaufzeit von MCP-Sitzungen (Sekunden)',
          MaxToolWaitSeconds: 'Maximale Wartezeit für MCP-Tools (Sekunden)',
          PublicUrl: 'Interne MCP-URL für Läufe',
          Path: 'MCP-Pfad',
          Port: 'MCP-Port',
          Hostname: 'MCP-Bindungshostname',
          Enable: 'MCP-Server aktiviert'
        },
        Database: {
          MinPoolSize: 'Mindestanzahl gepoolter Verbindungen',
          ConnectionTimeoutSeconds: 'Wartezeit auf eine Verbindung (Sekunden)',
          CommandTimeoutSeconds: 'Befehls-Timeout (Sekunden)',
          ConnectionIdleLifetimeSeconds: 'Lebensdauer ungenutzter Verbindungen (Sekunden)',
          MaxPoolSize: 'Größe des Verbindungspools',
          Schema: 'Datenbankschema',
          Password: 'Datenbankpasswort',
          Username: 'Datenbankbenutzer',
          DatabaseName: 'Datenbankname',
          Port: 'Datenbankport',
          Host: 'Datenbankhost',
          Filename: 'Sqlite-Datei',
          Type: 'Datenbankanbieter'
        },
        Logging: {
          MinimumSeverity: 'Minimaler Protokollschweregrad',
          LogFilename: 'Name der Protokolldatei',
          LogDirectory: 'Protokollverzeichnis',
          FileLogging: 'In eine Datei protokollieren',
          ConsoleLogging: 'In die Konsole protokollieren'
        },
        Auth: {
          RateLimitPerMinute: 'Anmeldeversuche pro Minute',
          PasswordHashIterations: 'Iterationen für Passwort-Hashes',
          SignedRequestSkewSeconds: 'Zulässige Uhrabweichung signierter Anfragen (Sekunden)',
          AdminApiKey: 'Administrator-API-Schlüssel',
          TokenLifetimeMinutes: 'Sitzungsdauer (Minuten)',
          SigningKey: 'Token-Signaturschlüssel',
          Issuer: 'Token-Aussteller'
        },
        Security: {
          NodeSecretKey: 'Geheimschlüssel der Worker-Knoten',
          NodeAccessKey: 'Zugriffsschlüssel der Worker-Knoten',
          DefaultSecretKey: 'Standard-Geheimschlüssel',
          DefaultAccessKey: 'Standard-Zugriffsschlüssel',
          AdminPassword: 'Passwort des ersten Administrators',
          AdminEmail: 'E-Mail des ersten Administrators',
          MasterKey: 'Hauptschlüssel für die Verschlüsselung von Geheimnissen'
        },
        RequestHistory: {
          CaptureNodeProtocol: 'Erfolgreiche Worker-Protokollanfragen erfassen',
          MaxResponseBodyBytes: 'Maximal aufgezeichneter Antworttext (Bytes)',
          MaxRequestBodyBytes: 'Maximal aufgezeichneter Anfragetext (Bytes)',
          RetentionDays: 'Aufbewahrung des Anfrageverlaufs (Tage)',
          Enabled: 'Anfrageverlauf aufzeichnen'
        },
        Telemetry: {
          OtlpEndpoint: 'OTLP-Endpunkt',
          OtlpEnable: 'OTLP-Export aktiviert',
          PrometheusPort: 'Prometheus-Port',
          PrometheusEnable: 'Prometheus-Endpunkt aktiviert',
          ServiceName: 'Telemetrie-Dienstname',
          Enabled: 'Telemetrie aktiviert'
        },
        Archive: {
          Directory: 'Archivverzeichnis'
        },
        Cluster: {
          Backplane: 'Ereignis-Backplane',
          BackplanePollMs: 'Abfrageintervall der Backplane (ms)',
          ExpectedReplicas: 'Erwartete Replikate der Steuerungsebene'
        },
        Scheduling: {
          EventPollMs: 'Abfrageintervall für Ereignisse (ms)',
          InvocationWaitPollMs: 'Ersatz-Neulesen beim Warten auf Aufrufe (ms)',
          NodeHeartbeatTimeoutMs: 'Heartbeat-Zeitlimit für Knoten (ms)',
          LeaseWaitMs: 'Long-Poll-Wartezeit für Zuteilungen (ms)',
          LeaseDurationMs: 'Dauer der Laufzuteilung (ms)',
          PauseGraceMs: 'Kulanz nach einer Host-Pause (ms)'
        },
        Runs: {
          EventRetentionDays: 'Aufbewahrung von Laufereignissen (Tage)',
          RetentionDays: 'Aufbewahrung von Läufen (Tage)',
          MaxDelegationDepth: 'Maximale Delegationstiefe',
          DelegationChildQueueDepth: 'Höchstzahl eingereihter Kind-Läufe wartender Läufe',
          DelegationRetryAfterSeconds: 'Wiederholungshinweis bei erschöpfter Delegationskapazität (Sekunden)',
          DefaultTimeoutSeconds: 'Standard-Zeitlimit für Läufe (Sekunden)'
        },
        Codex: {
          RefreshBeforeExpirySeconds: 'Codex-Anmeldungen vor Ablauf erneuern (Sekunden)',
          RefreshCheckIntervalSeconds: 'Intervall der Hintergrundprüfung (Sekunden)',
          RefreshTimeoutSeconds: 'Zeitlimit für die Erneuerung (Sekunden)',
          TokenEndpoint: 'OAuth-Token-Endpunkt',
          ClientId: 'OAuth-Client-ID'
        },
        Runtime: {
          FailBlockedAfterSeconds: 'Blockierte Läufe abbrechen nach (Sekunden)',
          MaxRunSeconds: 'Maximale Laufzeit (Sekunden)',
          RepetitionGuard: 'Wiederholungswächter standardmäßig',
          MaxAssistantChars: 'Standard für maximale Assistentenzeichen',
          NoProgressSeconds: 'Standard-Zeitlimit ohne Fortschritt (Sekunden)',
          ConversationAffinityWaitMs: 'Affinitätswartezeit für Konversationen (ms)',
          ConversationTranscriptTurns: 'Runden im Ersatzverlauf',
          ConversationTranscriptChars: 'Zeichen pro Nachricht im Ersatzverlauf'
        },
        Audit: {
          RetentionDays: 'Aufbewahrung des Audits (Tage)'
        }
      }
    },
    analytics: {
      grafana: 'Läufe-Dashboard in Grafana',
      deletedAgent: 'Gelöschter Agent ({{id}})',
      deletedDeployment: 'Gelöschte Bereitstellung ({{id}})',
      title: 'Analysen',
      subtitle: 'Wie schnell, wie teuer und wie zuverlässig Ihre Läufe im Zeitverlauf sind.',
      loading: 'Analysen werden geladen...',
      filters: { ttft: 'Delegationswartezeit aus TTFT herausrechnen', range: 'Zeitraum', from: 'Von', to: 'Bis', agentId: 'Agent', harnessType: 'Harness', deploymentId: 'Bereitstellung', model: 'Modell', groupBy: 'Gruppieren nach' },
      allAgents: 'Alle Agenten',
      allHarnesses: 'Alle Harnesses',
      allDeployments: 'Alle Bereitstellungen',
      allModels: 'Alle Modelle',
      unknownModel: 'Unbekanntes Modell',
      groupBy: { none: 'Keine Gruppierung', agent: 'Agent', harness: 'Harness', model: 'Modell', harnessModel: 'Harness und Modell' },
      export: { window: 'Zeitraum: {{from}} bis {{to}}' },
      usage: {
        title: 'Verbrauch nach Harness und Modell',
        help: 'Token und Kosten im Zeitverlauf für jede Kombination aus Harness und Modell im Zeitraum, dazu eine Aufschlüsselungstabelle.'
      },
      breakdown: {
        title: 'Aufschlüsselung nach Harness und Modell',
        columns: {
          harness: 'Harness',
          model: 'Modell',
          runs: 'Läufe',
          inputTokens: 'Eingabe-Token',
          outputTokens: 'Ausgabe-Token',
          cachedTokens: 'Cache-Token',
          reasoningTokens: 'Reasoning-Token',
          costUsd: 'Kosten',
          timeToFirstTokenMsAvg: 'Mittlere TTFT'
        }
      },
      rangeError: {
        incomplete: 'Wählen Sie für den benutzerdefinierten Zeitraum sowohl eine Start- als auch eine Endzeit.',
        reversed: 'Der Beginn des benutzerdefinierten Zeitraums muss vor seinem Ende liegen.'
      },
      truncated: 'Dieser Zeitraum enthält mehr Läufe, als der Server in einer Anfrage aggregiert. Die Zahlen decken daher nur einen Teil ab. Grenzen Sie den Zeitraum ein oder setzen Sie Filter, um genaue Werte zu erhalten.',
      unavailableTitle: 'Analysen sind auf diesem Server noch nicht verfügbar',
      unavailableBody: 'Dieser Server stellt den Endpunkt für Laufanalysen nicht bereit. Aktualisieren Sie den Server, um hier Diagramme zu sehen.',
      emptyTitle: 'Keine Läufe in diesem Zeitraum',
      emptyBody: 'Nichts entspricht dem Zeitraum und den Filtern. Erweitern Sie den Zeitraum, entfernen Sie einen Filter oder rufen Sie einen Agenten auf.',
      noDataInChart: 'Keine Daten für dieses Diagramm im gewählten Zeitraum.',
      cards: {
        delegationWait: 'Mittlere Delegationswartezeit',
        ttftExcludingDelegation: 'Mittlere TTFT ohne Delegation',
        runs: 'Läufe',
        runsNote: '{{succeeded}} erfolgreich, {{failed}} fehlgeschlagen',
        successRate: 'Erfolgsquote',
        ttft: 'Mittlere Zeit bis zum ersten Token',
        execution: 'Mittlere Ausführungszeit',
        queue: 'Mittlere Wartezeit',
        tokens: 'Token',
        tokensNote: '{{input}} ein, {{output}} aus',
        throughput: 'Mittlere Ausgabegeschwindigkeit',
        cost: 'Kosten',
        toolCalls: 'Werkzeugaufrufe',
        p95: 'p95 {{value}}'
      },
      charts: {
        outcomes: { title: 'Ergebnisse der Läufe', help: 'Läufe pro Intervall, nach Art ihres Endes.' },
        ttft: { helpExcluding: 'Vom Harness-Start bis zur ersten Modellausgabe, ohne die Wartezeit auf delegierte Läufe.', title: 'Zeit bis zum ersten Token', help: 'Vom Harness-Start bis zur ersten Modellausgabe. Enthält den CLI-Start.' },
        duration: { title: 'Streaming- und Ausführungszeit', help: 'Streaming reicht von der ersten bis zur letzten Modellausgabe, Ausführung vom Prozessstart bis zum Prozessende.' },
        queue: { title: 'Wartezeit', help: 'Zeit von der Einreihung bis zur Zuweisung an einen Worker-Knoten.' },
        tokens: { title: 'Token', help: 'Eingabe-, Ausgabe-, Cache- und Reasoning-Token pro Intervall.' },
        throughput: { title: 'Ausgabe-Token pro Sekunde', help: 'Ausgabe-Token geteilt durch die Streaming-Zeit, gemittelt pro Intervall.' },
        cost: { title: 'Kosten', help: 'Gemeldete Kosten in US-Dollar pro Intervall.' },
        toolCalls: { title: 'Werkzeugaufrufe', help: 'Werkzeugaufruf-Ereignisse pro Intervall.' },
        usageTokens: { title: 'Token nach Harness und Modell', help: 'Eingabe- plus Ausgabe-Token pro Intervall, gestapelt nach Harness und Modell.' },
        usageCost: { title: 'Kosten nach Harness und Modell', help: 'Gemeldete Kosten pro Intervall, gestapelt nach Harness und Modell.' }
      },
      groupedTitle: '{{chart}}: {{metric}}',
      metrics: {
        delegationWaitMsAvg: 'Delegationswartezeit (Mittel)',
        timeToFirstTokenExcludingDelegationMsP95: 'Ohne Delegation (p95)',
        timeToFirstTokenExcludingDelegationMsP50: 'Ohne Delegation (p50)',
        timeToFirstTokenExcludingDelegationMsAvg: 'Ohne Delegation (Mittel)',
        runs: 'Läufe',
        succeeded: 'Erfolgreich',
        failed: 'Fehlgeschlagen',
        cancelled: 'Abgebrochen',
        timedOut: 'Zeitüberschreitung',
        inputTokens: 'Eingabe',
        outputTokens: 'Ausgabe',
        cachedTokens: 'Cache',
        reasoningTokens: 'Reasoning',
        totalTokens: 'Eingabe- plus Ausgabe-Token',
        costUsd: 'Kosten',
        toolCalls: 'Werkzeugaufrufe',
        timeToFirstTokenMsAvg: 'Mittelwert',
        timeToFirstTokenMsP50: 'Median (p50)',
        timeToFirstTokenMsP95: 'p95',
        streamingMsAvg: 'Streaming (Mittel)',
        executionMsAvg: 'Ausführung (Mittel)',
        executionMsP95: 'Ausführung (p95)',
        queueMsAvg: 'Mittlere Wartezeit',
        outputTokensPerSecondAvg: 'Mittlere Token pro Sekunde'
      },
      other: 'Sonstige',
      hiddenGroups_one: '{{count}} weniger aktive Gruppe wird nicht angezeigt.',
      hiddenGroups_other: '{{count}} weniger aktive Gruppen werden nicht angezeigt.',
      legend: 'Reihen in {{chart}}',
      dataTable: 'Datentabelle',
      bucketStart: 'Intervallbeginn'
    },
    serverInfo: {
      serverInUse: 'Verwendeter Server',
      title: 'Serverinfo',
      subtitle: 'Endpunkte, Versionen und die Identität, mit der Sie angemeldet sind.',
      endpoints: 'Endpunkte',
      rest: 'REST-API',
      mcp: 'MCP',
      a2a: 'A2A',
      openapi: 'OpenAPI',
      server: 'Server',
      version: 'Serverversion',
      dashboardVersion: 'Dashboard-Version',
      node: 'Steuerungsknoten',
      database: 'Datenbank',
      health: 'Zustand',
      replicas: 'Erwartete Replikate',
      routes: 'Registrierte Operationen',
      serverTime: 'Serverzeit',
      principal: 'Angemeldet als',
      principalName: 'Prinzipal',
      principalType: 'Prinzipaltyp',
      role: 'Rolle',
      tenant: 'Mandant',
      expires: 'Sitzung läuft ab',
      features: 'Funktionsschalter'
    },
    runGuard: {
      titles: {
        RepetitionDetected: 'Gestoppt: Das Modell hat sich wiederholt',
        NoProgress: 'Gestoppt: Der Lauf kam nicht mehr voran',
        OutputLimitExceeded: 'Gestoppt: Die Antwort hat ihre Größengrenze erreicht'
      },
      bodies: {
        RepetitionDetected: 'Der Wiederholungswächter hat immer wieder denselben kurzen Text gesehen (oder nur Leerraum und Satzzeichen), deshalb hat Garrison den Lauf gestoppt, statt ihn bis zu seiner Frist laufen zu lassen.',
        NoProgress: 'Länger als das Zeitlimit ohne Fortschritt kam kein Text, kein Denken und keine Toolaktivität, deshalb hat Garrison den Lauf gestoppt.',
        OutputLimitExceeded: 'Die Antwort hat die erlaubte Höchstzahl an Assistentenzeichen pro Lauf überschritten, deshalb hat Garrison den Lauf gestoppt.'
      },
      detected: 'Erkannt wurde: {{reason}}',
      partialKept: 'Die bis zum Stopp geschriebene Ausgabe ({{chars}} Zeichen) bleibt als Ergebnis des Laufs erhalten.',
      noPartial: 'Der Lauf hat vor dem Stopp keine Ausgabe geschrieben.',
      tune: 'Um das zu ändern, bearbeite die Bereitstellung {{deployment}}: Im Schritt „Platzierung und Grenzen“ findest du Wiederholungswächter, Maximale Assistentenzeichen und Zeitlimit ohne Fortschritt. Leer gelassen gelten die Cluster-Standards unter Einstellungen (Laufzeit).',
      tuneAny: 'Um das zu ändern, bearbeite die Bereitstellung: Im Schritt „Platzierung und Grenzen“ findest du Wiederholungswächter, Maximale Assistentenzeichen und Zeitlimit ohne Fortschritt. Leer gelassen gelten die Cluster-Standards unter Einstellungen (Laufzeit).',
      openDeployments: 'Bereitstellungen öffnen',
      openSettings: 'Einstellungen öffnen'
    },
    conversationDetail: {
      title: 'Konversation',
      notFoundTitle: 'Konversation nicht gefunden',
      notFoundBody: 'Sie wurde vielleicht gelöscht oder gehört zu einem anderen Mandanten. Ihre Runden bleiben auf der Seite Läufe.',
      deployment: 'Bereitstellung',
      activeRun: 'Offene Runde',
      turns: 'Runden',
      turnsCount: 'Runden ({{count}})',
      noTurns: 'Diese Konversation hat noch keine Runden.',
      pending: 'Wartet auf das Ergebnis',
      columns: {
        turn: 'Runde',
        run: 'Lauf',
        status: 'Status',
        outcome: 'Ergebnis',
        session: 'Sitzung',
        input: 'Eingabe',
        result: 'Antwort',
        node: 'Knoten',
        created: 'Erstellt'
      },
      session: {
        first: 'Neue Sitzung',
        resumed: 'Fortgesetzt',
        fallback: 'Frische Sitzung',
        pending: 'Noch nicht platziert'
      },
      continueTitle: 'Konversation fortsetzen',
      message: 'Nächste Nachricht',
      messagePlaceholder: 'Stellen Sie eine Folgefrage oder geben Sie die nächste Anweisung...',
      busyNotice: 'Die vorherige Runde arbeitet noch. Sie können die nächste Nachricht senden, sobald sie fertig ist.',
      send: 'Runde senden',
      turnStarted: 'Runde {{turn}} gestartet.',
      openInvoke: 'In Aufrufen fortsetzen',
      confirmDelete: 'Die Konversation „{{title}}“ löschen? Ihre Runden bleiben als gewöhnliche Läufe auf der Seite Läufe, aber keine neue Runde kann sie fortsetzen.'
    }
  },
  wizard: {
    title: 'Garrison einrichten',
    stepOf: 'Schritt {{step}} von {{total}}',
    steps: { welcome: 'Willkommen', secret: 'Zugangsdaten', manifest: 'Beispielagent', invoke: 'Testlauf' },
    welcomeBody: 'Dieser Mandant hat noch keine Agenten. In wenigen Schritten werden Sie:',
    welcomeItem1: 'Zugangsdaten für eine Harness hinterlegen, etwa einen Anthropic- oder OpenAI-API-Schlüssel (optional).',
    welcomeItem2: 'Einen Beispielagenten mit der integrierten Test-Harness anwenden, der ohne Zugangsdaten funktioniert.',
    welcomeItem3: 'Ihn ausführen und das Protokoll verfolgen.',
    start: 'Starten',
    skip: 'Einrichtung überspringen',
    skipStep: 'Schritt überspringen',
    secretBody: 'Hinterlegen Sie Zugangsdaten, die Ihre echten Agenten benötigen. Sie können dies überspringen und später nachholen.',
    saveSecret: 'Speichern und weiter',
    secretSaved: 'Geheimnis gespeichert.',
    manifestBody: 'Dieses Manifest erstellt einen Echo-Agenten und eine Bereitstellung mit der Test-Harness.',
    invokeBody: 'Senden Sie dem Echo-Agenten eine Nachricht. Sie werden zum laufenden Lauf weitergeleitet.',
    invoke: 'Ausführen',
    noAgent: 'Der Beispielagent wurde nicht gefunden. Wenden Sie zuerst das Manifest an.'
  },
  tour: {
    title: 'Geführte Tour',
    skip: 'Tour überspringen',
    done: 'Fertig',
    steps: {
      sidebar: { title: 'Navigation', body: 'Die Seiten sind in Bereiche gruppiert. Jeder Bereich hat oben Registerkarten, und jede Registerkarte hat einen eigenen Link.' },
      topbar: { title: 'Kontext', body: 'Server, Mandant, Ihre Identität, Zustand und Live-Status sind hier immer sichtbar.' },
      kpis: { title: 'Auf einen Blick', body: 'Jede Karte fasst eine Ressource zusammen. Ein Klick öffnet die gefilterte Liste.' },
      invoke: { title: 'Aufrufen', body: 'Probieren Sie jeden Agenten interaktiv aus und verfolgen Sie das Protokoll live.' },
      configure: { title: 'Konfiguration', body: 'Harness-Profile, Prompt-Vorlagen, MCP-Server und Geheimnisse bestimmen genau, was ausgeführt wird. Agenten und Bereitstellungen haben einen eigenen Bereich.' },
      observe: { title: 'Überwachung', body: 'Anfrageverlauf, Audit und API-Explorer helfen beim Prüfen und bei der Fehlersuche.' }
    }
  },
  tips,
  explainers
};


// Executor capability negotiation (P11.18).
Object.assign(de.resources.deployments.fields, {"capIsolation": "Minimale Isolation", "capColdStartClass": "Startklasse", "capEgressControl": "Ausgehenden Verkehr kontrollieren", "capFilesystemSnapshot": "Dateisystem-Snapshots erforderlich", "capSessionContinuation": "Sitzungsfortsetzung erforderlich", "capCrossNodeRestore": "Wiederherstellung auf anderem Knoten erforderlich"});
Object.assign(de.tips.resources.deployments, {"capIsolation": "Läufe warten auf einen Worker mit diesen Fähigkeiten. Wählen Sie KubernetesJob für Container-Isolation. Nicht verfügbare Fähigkeiten halten Läufe in der Warteschlange.", "capColdStartClass": "Läufe warten auf einen Worker mit diesen Fähigkeiten. Wählen Sie KubernetesJob für Container-Isolation. Nicht verfügbare Fähigkeiten halten Läufe in der Warteschlange.", "capEgressControl": "Läufe warten auf einen Worker mit diesen Fähigkeiten. Wählen Sie KubernetesJob für Container-Isolation. Nicht verfügbare Fähigkeiten halten Läufe in der Warteschlange.", "capFilesystemSnapshot": "Läufe warten auf einen Worker mit diesen Fähigkeiten. Wählen Sie KubernetesJob für Container-Isolation. Nicht verfügbare Fähigkeiten halten Läufe in der Warteschlange.", "capSessionContinuation": "Läufe warten auf einen Worker mit diesen Fähigkeiten. Wählen Sie KubernetesJob für Container-Isolation. Nicht verfügbare Fähigkeiten halten Läufe in der Warteschlange.", "capCrossNodeRestore": "Läufe warten auf einen Worker mit diesen Fähigkeiten. Wählen Sie KubernetesJob für Container-Isolation. Nicht verfügbare Fähigkeiten halten Läufe in der Warteschlange."});
de.resources.deployments.hints.capabilities = "Läufe warten auf einen Worker mit diesen Fähigkeiten. Wählen Sie KubernetesJob für Container-Isolation. Nicht verfügbare Fähigkeiten halten Läufe in der Warteschlange.";
de.resources.nodes.columns.executorCapabilities = "Ausführungsfähigkeiten";
de.tips.resources.nodes.executorCapabilities = "Läufe warten auf einen Worker mit diesen Fähigkeiten. Wählen Sie KubernetesJob für Container-Isolation. Nicht verfügbare Fähigkeiten halten Läufe in der Warteschlange.";
de.enums.executorIsolation = {"Process": "Prozess", "Container": "Container-Isolation", "SandboxedRuntime": "Isolierte Laufzeit"};
de.enums.executorColdStart = {"Immediate": "Sofort", "Cold": "Kalt", "Warm": "Vorbereitet"};
// Artifact collection and browsing (P12.8).
de.nav.items.artifacts = { label: "Dateien", tip: "Aus Ausführungen gesammelte Dateien." };
de.resources.artifacts = { ...de.resources.artifactStores, title: "Dateien", subtitle: "Aus Ausführungen gesammelte Dateien.", view: "Dateien", deleteTitle: "Dateien", emptyTitle: "Dateien", emptyBody: "Konfigurieren Sie einen Speicher und ausdrückliche Dateimuster für das Deployment.", columns: {"name": "Dateiname", "runId": "Ausführung", "artifactStoreId": "Speicher", "mediaType": "Medientyp", "sizeBytes": "Byteanzahl", "sha256": "SHA-256-Prüfsumme", "createdUtc": "Erstellt", "id": "ID", "leaseEpoch": "Lease-Epoche", "repairAttempt": "Reparaturversuch"}, fields: {"name": "Dateiname", "runId": "Ausführung", "artifactStoreId": "Speicher", "mediaType": "Medientyp", "sizeBytes": "Byteanzahl", "sha256": "SHA-256-Prüfsumme", "createdUtc": "Erstellt", "id": "ID", "leaseEpoch": "Lease-Epoche", "repairAttempt": "Reparaturversuch"}, actions: { download: "Herunterladen" } };
de.tips.resources.artifacts = { ...{"name": "Aus Ausführungen gesammelte Dateien: Name", "runId": "Aus Ausführungen gesammelte Dateien: Run", "artifactStoreId": "Aus Ausführungen gesammelte Dateien: Store", "mediaType": "Aus Ausführungen gesammelte Dateien: Media type", "sizeBytes": "Aus Ausführungen gesammelte Dateien: Bytes", "sha256": "Aus Ausführungen gesammelte Dateien: SHA-256", "createdUtc": "Aus Ausführungen gesammelte Dateien: Created", "id": "Aus Ausführungen gesammelte Dateien: ID", "leaseEpoch": "Aus Ausführungen gesammelte Dateien: Lease epoch", "repairAttempt": "Aus Ausführungen gesammelte Dateien: Repair attempt"}, actions: { download: "Diese Datei über einen temporären Link herunterladen." }, filters: { runId: "Ausführung", storeId: "Speicher" } };
Object.assign(de.resources.artifactStores.fields, {"pathPrefix": "Pfadpräfix", "bucket": "Speicher-Bucket", "endpoint": "Endpunkt", "region": "AWS-Region", "secretId": "Zugangsdaten", "forcePathStyle": "Pfadbasierte Anfragen"});
Object.assign(de.tips.resources.artifactStores, {"pathPrefix": "Optional S3 endpoint; empty uses AWS. Store credentials in a GenericEnv secret as JSON with accessKey, secretKey and optional sessionTokde. Empty credential uses the server credential chain.", "bucket": "Optional S3 endpoint; empty uses AWS. Store credentials in a GenericEnv secret as JSON with accessKey, secretKey and optional sessionTokde. Empty credential uses the server credential chain.", "endpoint": "Optional S3 endpoint; empty uses AWS. Store credentials in a GenericEnv secret as JSON with accessKey, secretKey and optional sessionTokde. Empty credential uses the server credential chain.", "region": "Optional S3 endpoint; empty uses AWS. Store credentials in a GenericEnv secret as JSON with accessKey, secretKey and optional sessionTokde. Empty credential uses the server credential chain.", "secretId": "Optional S3 endpoint; empty uses AWS. Store credentials in a GenericEnv secret as JSON with accessKey, secretKey and optional sessionTokde. Empty credential uses the server credential chain.", "forcePathStyle": "Optional S3 endpoint; empty uses AWS. Store credentials in a GenericEnv secret as JSON with accessKey, secretKey and optional sessionTokde. Empty credential uses the server credential chain."});
de.resources.deployments.fields.artifactGlobs = "Sammelmuster";
de.tips.resources.deployments.artifactGlobs = "Nur passende relative Arbeitsdateien sammeln, zum Beispiel reports/**/*.json. Leer deaktiviert die Sammlung.";
de.resources.deployments.hints.artifactGlobs = "Nur passende relative Arbeitsdateien sammeln, zum Beispiel reports/**/*.json. Leer deaktiviert die Sammlung.";
Object.assign(de.common.eventCodes, { ArtifactCollectionWarning: "Warnung beim Sammeln von Dateien", ArtifactsCollected: "Dateien gesammelt" });
de.tips.nav.tabs.artifacts = de.nav.items.artifacts.tip + " " + de.tips.resources.artifacts.actions.download;
Object.assign(de.components.mcpTest, {"worker": "Worker-Knoten", "chooseWorker": "Wählen Sie einen bereiten Worker. Der konfigurierte Befehl listet dort Werkzeuge auf; es werden keine Werkzeuge ausgeführt.", "runTest": "Test starten"});
export default de;

de.views.settings.groups.Leases = "Koordinierungsleases";
de.views.settings.fields.Leases = {"Provider": "Anbieter", "ClutchEndpoint": "Clutch-Endpunkt", "ClutchAccessKey": "Clutch-Zugriffsschlüssel", "KeyPrefix": "Schlüsselpräfix", "RequestTimeoutMs": "Anfragezeitlimit (ms)", "SweepIntervalMs": "Prüfintervall (ms)", "MaxLeaseMs": "Maximale Lease (ms)", "MaxHoldMs": "Maximale Haltezeit (ms)"};

de.enums.harnessType.ProviderApi = "Anbieter-API";
de.enums.outputParser.ProviderApiJsonl = "Anbieter-API-JSONL";
de.enums.harnessType.OpenCode = "opencode";
de.enums.harnessType.Pi = "pi";
de.enums.outputParser.OpenCodeJsonl = "opencode JSONL";
de.enums.outputParser.PiJsonl = "pi JSONL";
de.enums.mcpConfigFormat.OpenCodeJson = "opencode JSON";
de.enums.mcpConfigFormat.PiJson = "pi JSON";

// Pipelines (P12.9): Definitionen (Agenten > Pipelines), Pipeline-Läufe (Läufe > Pipeline-Läufe) und Stufenprüfungen
// (Freigaben > Stufenprüfungen).
de.nav.hubs.approvals.tip = 'Werkzeugaufrufe und Pipeline-Stufen, die auf eine Person warten, und alle Entscheidungen';
Object.assign(de.nav, { approvalsPending_one: '{{count}} Eintrag wartet auf eine Person', approvalsPending_other: '{{count}} Einträge warten auf eine Person' });
Object.assign(de.nav.items, {
  pipelines: { label: 'Pipelines', tip: 'Geordnete Agentenstufen mit optionalen Prüfschritten' },
  pipelineRuns: { label: 'Pipeline-Läufe', tip: 'Ausführungen von Pipelines, Stufe für Stufe' },
  pipelineReviews: { label: 'Stufenprüfungen', tip: 'Pipeline-Stufen, die auf die Prüfung durch eine Person warten' }
});
Object.assign(de.errorCodes, {
  RevisionLimitReached: 'Diese Stufe hat bereits alle Überarbeitungen verbraucht, daher können keine Änderungen mehr angefordert werden. Genehmigen oder lehnen Sie sie stattdessen ab.',
  ReviewNotPending: 'Diese Prüfung wurde bereits von einer anderen Person oder durch ihr Zeitlimit entschieden und kann nicht erneut entschieden werden.',
  PipelineInUse: 'Diese Pipeline hat nicht abgeschlossene Pipeline-Läufe. Warten Sie, bis sie enden, oder brechen Sie sie ab, und löschen Sie die Pipeline dann.',
  PipelineRunActive: 'Nur abgeschlossene Pipeline-Läufe können gelöscht werden. Brechen Sie diesen Pipeline-Lauf zuerst ab.',
  PipelineRunFinished: 'Dieser Pipeline-Lauf ist bereits beendet und kann nicht abgebrochen werden.',
  PipelineRunNotRetryable: 'Nur fehlgeschlagene, abgebrochene oder wegen Zeitüberschreitung beendete Pipeline-Läufe können wiederholt werden.',
  PipelineRunChanged: 'Dieser Pipeline-Lauf hat sich während der Verarbeitung der Anfrage geändert. Laden Sie ihn neu und versuchen Sie es erneut.',
  PipelineInactive: 'Diese Pipeline ist inaktiv. Aktivieren Sie sie, bevor Sie sie starten.',
  PipelineEmpty: 'Eine Pipeline braucht mindestens eine Stufe.',
  PipelineStageRun: 'Dieser Lauf ist eine Stufe eines Pipeline-Laufs und kann nicht einzeln wiederholt werden. Wiederholen Sie stattdessen den Pipeline-Lauf.',
  ReferencedByPipeline: 'Eine Pipeline-Stufe verwendet diesen Agenten. Entfernen Sie den Agenten aus allen Pipelines, bevor Sie ihn löschen.'
});
de.enums.pipelineRunStatus = { Running: 'Läuft', AwaitingReview: 'Wartet auf Prüfung', Cancelling: 'Wird abgebrochen', Succeeded: 'Erfolgreich', Failed: 'Fehlgeschlagen', Cancelled: 'Abgebrochen', TimedOut: 'Zeitüberschreitung' };
de.enums.pipelineRunOutcome = { None: 'Keines', Succeeded: 'Erfolgreich', StageFailed: 'Stufe fehlgeschlagen', StageStartFailed: 'Stufe konnte nicht starten', ReviewRejected: 'Prüfung abgelehnt', ReviewExpired: 'Prüfung abgelaufen', Cancelled: 'Abgebrochen', TimedOut: 'Zeitüberschreitung', InternalError: 'Interner Fehler' };
de.enums.pipelineStageStatus = { Pending: 'Ausstehend', Running: 'Läuft', AwaitingReview: 'Wartet auf Prüfung', Succeeded: 'Erfolgreich', Failed: 'Fehlgeschlagen', Cancelled: 'Abgebrochen' };
de.enums.pipelineReviewStatus = { Pending: 'Ausstehend', Approved: 'Genehmigt', ChangesRequested: 'Änderungen angefordert', Rejected: 'Abgelehnt', Expired: 'Abgelaufen', Cancelled: 'Abgebrochen' };
de.enums.pipelineReviewDecision = { Approve: 'Genehmigen', RequestChanges: 'Änderungen anfordern', Reject: 'Ablehnen' };
de.enums.pipelineReviewSource = { User: 'Durch eine Person', Timeout: 'Zeitüberschreitung', Cancelled: 'Pipeline-Lauf gestoppt' };
Object.assign(de.enums.resourceType, { Pipeline: 'Pipeline', PipelineRun: 'Pipeline-Lauf' });
Object.assign(de.enums.auditEventType, { PipelineReviewDecided: 'Stufenprüfung entschieden', PipelineRunCancelled: 'Pipeline-Lauf abgebrochen' });
de.resources.deployments.promptRoles.PipelineStage = 'Pipeline-Stufe (Übergabe)';
Object.assign(de.resources.runs.columns, { pipelineRunId: 'Pipeline-Lauf' });
de.resources.runs.pipelineStage = 'Stufe {{position}}, Ausführung {{execution}}';
de.resources.pipelines = {
  ...rp('Pipelines', 'Geordnete Agentenstufen: Jede Stufe führt einen Agenten aus und übergibt seine Ausgabe an die nächste, mit optionalen Prüfschritten.', 'Pipeline hinzufügen', 'Pipeline erstellen', 'Pipeline bearbeiten', 'Pipeline-Details', 'Pipeline löschen', 'Noch keine Pipelines', 'Erstellen Sie eine Pipeline, um Agenten zu verketten: Jede Stufe erhält die Ausgabe der vorherigen Stufe.'),
  columns: { name: 'Name', stages: 'Stufen', reviewGates: 'Prüfschritte', maxDurationSeconds: 'Zeitlimit', version: 'Version', active: 'Aktiv', description: 'Beschreibung', id: 'ID', lastUpdateUtc: 'Aktualisiert', createdUtc: 'Erstellt' },
  fields: {
    name: 'Name',
    description: 'Beschreibung',
    maxDurationSeconds: 'Zeitlimit (Sekunden)',
    active: 'Aktiv',
    stages: 'Stufen',
    stageName: 'Name der Stufe',
    agentId: 'Agent',
    deploymentId: 'Bereitstellung',
    handoffTemplateId: 'Übergabevorlage',
    handoffTemplateVersion: 'Festgelegte Vorlagenversion',
    outputCharLimit: 'Zeichenlimit der Übergabe',
    maxAttempts: 'Maximale Versuche',
    continueOnFailure: 'Bei Fehler fortfahren',
    requiresReview: 'Prüfung erforderlich',
    reviewTimeoutSeconds: 'Zeitlimit der Prüfung (Sekunden)',
    reviewTimeoutAction: 'Bei Zeitüberschreitung der Prüfung',
    maxRevisions: 'Maximale Überarbeitungen',
    stageDescription: 'Beschreibung der Stufe',
    parameters: 'Laufparameter'
  },
  hints: {
    maxDurationSeconds: 'Von {{min}} bis {{max}}. 0 bedeutet kein Limit. Das Limit gilt für den gesamten Pipeline-Lauf, einschließlich der Wartezeit auf Prüfungen.',
    stages: 'Die Stufen laufen in dieser Reihenfolge. Jede Stufe startet, wenn die vorherige erfolgreich ist (oder mit „Bei Fehler fortfahren“ fehlschlägt) und, falls sie eine Prüfung erfordert, nachdem eine Person sie genehmigt hat.',
    noDeployments: 'Dieser Agent hat noch keine Bereitstellungen. Lassen Sie die Bereitstellung leer oder fügen Sie unter Bereitstellungen eine hinzu.',
    handoffTemplateVersion: 'Leer verwendet die aktuelle Version der Vorlage.',
    outputCharLimit: 'Von {{min}} bis {{max}}. Standard {{default}}.',
    maxAttempts: 'Von {{min}} bis {{max}}. Standard {{default}}.',
    reviewTimeoutSeconds: 'Von {{min}} bis {{max}}. 0 wartet unbegrenzt.',
    maxRevisions: 'Von {{min}} bis {{max}}. Standard {{default}}.',
    parameters: 'Nur mit einer Bereitstellung, und nur Parameter, die diese Bereitstellung Aufrufenden zum Überschreiben freigibt.'
  },
  errors: {
    dnsName: 'Verwenden Sie 1 bis 64 Kleinbuchstaben, Ziffern und Bindestriche, beginnend und endend mit einem Buchstaben oder einer Ziffer.',
    range: 'Geben Sie eine ganze Zahl von {{min}} bis {{max}} ein.',
    noStages: 'Fügen Sie mindestens eine Stufe hinzu.',
    tooManyStages: 'Eine Pipeline hat höchstens {{max}} Stufen.',
    stageNameLong: 'Namen von Stufen sind auf 128 Zeichen begrenzt.',
    stageNameDuplicate: 'Eine andere Stufe heißt bereits {{name}}.',
    version: 'Geben Sie eine Versionsnummer ab 1 ein oder lassen Sie das Feld leer.',
    parametersNeedDeployment: 'Laufparameter brauchen eine Bereitstellung, weil sie gegen die erlaubten Überschreibungen dieser Bereitstellung geprüft werden.',
    parametersUnique: 'Jeder Parametername darf nur einmal vorkommen.',
    stageInvalid: 'diese Stufe enthält Fehler.'
  },
  actions: { start: 'Starten', preview: 'Prompts in der Vorschau', runs: 'Pipeline-Läufe anzeigen' },
  stageHeading: 'Stufe {{position}}: {{name}}',
  stageCount: '{{count}} von höchstens {{max}}',
  stageSummary: '{{count}} Stufen: {{chain}}',
  addStage: 'Stufe hinzufügen',
  removeStage: 'Stufe entfernen',
  noStages: 'Noch keine Stufen.',
  chooseAgent: 'Agenten auswählen',
  anyDeployment: 'Beliebige aktive Bereitstellung (gewichtet)',
  defaultHandoff: 'Bindung der Bereitstellung oder integriert',
  parameterName: 'Parametername',
  parameterValue: 'Wert',
  noLimit: 'Kein Limit',
  versionNotice: 'Version {{version}}. Speichern erzeugt eine neue Version; bereits gestartete Pipeline-Läufe behalten ihre ursprünglichen Stufen.'
};
de.resources.pipelineRuns = {
  ...rp('Pipeline-Läufe', 'Jede Ausführung einer Pipeline. Öffnen Sie einen Lauf, um seine Stufen zu verfolgen, Prüfungen zu entscheiden oder ihn abzubrechen und zu wiederholen.', 'Pipeline-Lauf hinzufügen', 'Pipeline-Lauf erstellen', 'Pipeline-Lauf bearbeiten', 'Details des Pipeline-Laufs', 'Pipeline-Lauf löschen', 'Noch keine Pipeline-Läufe', 'Starten Sie eine Pipeline unter Agenten > Pipelines, um ihre Läufe hier zu sehen.'),
  columns: { id: 'ID', pipelineName: 'Pipeline', status: 'Status', outcome: 'Ergebnis', progress: 'Stufe', callerName: 'Gestartet von', errorMessage: 'Fehler', priority: 'Priorität', deadlineUtc: 'Frist', completedUtc: 'Abgeschlossen', createdUtc: 'Erstellt' },
  actions: { cancel: 'Abbrechen', retry: 'Wiederholen', stageRuns: 'Stufenläufe anzeigen', finalRun: 'Letzten Lauf öffnen' },
  toasts: { cancelRequested: 'Abbruch für den Pipeline-Lauf und seine aktuelle Stufe angefordert.', retried: 'Der Pipeline-Lauf wird an der Stufe fortgesetzt, an der er angehalten hat.' },
  progressValue: '{{position}} von {{count}}',
  versionShort: '(Version {{version}})'
};
de.resources.pipelineReviews = {
  ...rp('Stufenprüfungen', 'Pipeline-Stufen, die darauf warten, dass eine Person sie genehmigt, Änderungen anfordert oder sie ablehnt.', 'Stufenprüfung hinzufügen', 'Stufenprüfung erstellen', 'Stufenprüfung bearbeiten', 'Details der Stufenprüfung', 'Stufenprüfung löschen', 'Noch keine Stufenprüfungen', 'Stufen, die eine Prüfung erfordern, erscheinen hier, sobald sie fertig sind.'),
  columns: { createdUtc: 'Angefordert', pipelineName: 'Pipeline', stageName: 'Stufe', status: 'Status', decision: 'Entscheidung', decisionSource: 'Entschieden durch', comment: 'Kommentar', decidedBy: 'Prüfende Person', expiresUtc: 'Läuft ab', pipelineRunId: 'Pipeline-Lauf', runId: 'Stufenlauf', decidedUtc: 'Entschieden', id: 'ID' },
  filters: { pipelineRunId: 'Pipeline-Lauf-ID', pipelineRunIdPlaceholder: 'Pipeline-Lauf-ID (plr_...)' },
  actions: { approve: 'Genehmigen', requestChanges: 'Änderungen anfordern', reject: 'Ablehnen', openStageRun: 'Stufenlauf öffnen' },
  noTimeout: 'Wartet unbegrenzt'
};
de.components.pipelineReviews = {
  decideTitle: 'Stufe {{stage}} von {{pipeline}} prüfen',
  decision: 'Entscheidung',
  positionExecution: 'Stufe {{position}}, Ausführung {{execution}}',
  revisionsLeft: 'Verbleibende Überarbeitungen',
  revisionsLeftValue: '{{left}} von {{max}}',
  noRevisionsLeft: 'Diese Stufe hat alle {{max}} Überarbeitungen verbraucht. Der Server lehnt „Änderungen anfordern“ ab; genehmigen oder lehnen Sie sie stattdessen ab.',
  timeoutThen: 'dann {{decision}}',
  commentApprove: 'Hinweise für die nächste Stufe',
  commentApprovePlaceholder: 'Optional. Die nächste Stufe erhält diese Hinweise zusammen mit der Ausgabe.',
  commentRequestChanges: 'Was soll sich ändern',
  commentRequestChangesPlaceholder: 'Erforderlich. Die Stufe läuft mit dieser Rückmeldung erneut.',
  commentReject: 'Begründung',
  commentRejectPlaceholder: 'Optional. Wird mit der Entscheidung gespeichert; der Pipeline-Lauf schlägt fehl.',
  commentRequired: 'Beschreiben Sie, was sich ändern soll. Die Stufe läuft mit dieser Rückmeldung erneut.',
  commentTooLong: 'Kommentare sind auf {{max}} Zeichen begrenzt.',
  submit: { Approve: 'Stufe genehmigen', RequestChanges: 'Änderungen anfordern', Reject: 'Stufe ablehnen' },
  toasts: {
    Approve: 'Stufe {{stage}} von {{pipeline}} genehmigt.',
    RequestChanges: 'Änderungen an Stufe {{stage}} von {{pipeline}} angefordert; sie läuft mit Ihrer Rückmeldung erneut.',
    Reject: 'Stufe {{stage}} von {{pipeline}} abgelehnt; der Pipeline-Lauf schlägt fehl.',
    notPending: 'Diese Prüfung wurde bereits von einer anderen Person oder durch ihr Zeitlimit entschieden. Die Liste zeigt jetzt den aktuellen Stand.',
    revisionLimit: 'Diese Stufe hat bereits alle Überarbeitungen verbraucht (höchstens {{max}}), daher können keine Änderungen mehr angefordert werden. Genehmigen oder lehnen Sie sie stattdessen ab.'
  }
};
de.components.pipelineStart = {
  title: '{{name}} starten',
  intro_one: 'Die Eingabe geht an die einzige Stufe der Pipeline.',
  intro_other: 'Die Eingabe geht an die erste von {{count}} Stufen; jede Stufe sieht sie außerdem als ursprüngliche Aufgabe.',
  input: 'Eingabe',
  inputPlaceholder: 'Woran soll die Pipeline arbeiten?',
  shortcut: 'Mit Strg+Eingabe oder Cmd+Eingabe starten.',
  submit: 'Pipeline starten',
  starting: 'Wird gestartet...',
  started: '{{name}} gestartet.'
};
de.components.pipelinePreview = {
  title: 'Prompts von {{name}} in der Vorschau',
  input: 'Beispieleingabe',
  sampleInput: 'Fasse die offenen Issues zusammen und schlage eine Lösung für das dringendste vor.',
  sampleOutput: 'Beispielausgabe von {{stage}}.',
  outputOf: 'Beispielausgabe von Stufe {{position}} ({{stage}})',
  render: 'Prompts rendern',
  rendering: 'Wird gerendert...',
  stageHeading: 'Stufe {{position}}: {{stage}} ({{agent}})',
  deployment: 'Bereitstellung: {{deployment}}',
  rendered: 'Gerendert',
  failed: 'Fehlgeschlagen'
};
de.views.pipelineRunDetail = {
  title: 'Pipeline-Lauf',
  heading: 'Pipeline-Lauf von {{pipeline}}',
  notFoundTitle: 'Pipeline-Lauf nicht gefunden',
  notFoundBody: 'Er wurde möglicherweise gelöscht oder gehört zu einem anderen Mandanten.',
  live: 'Live',
  polling: 'Abfrage',
  finalRun: 'Letzter Lauf',
  started: 'Gestartet',
  input: 'Eingabe',
  reviewTitle: 'Wartet auf Ihre Prüfung',
  reviewBody: 'Stufe {{position}} ({{stage}}) hat Ausführung {{execution}} beendet und wartet auf eine Prüfung. Lesen Sie ihre Ausgabe im Stufenlauf:',
  reviewExpires: 'Entscheidet bis {{time}} niemand, wird die Prüfung automatisch entschieden: {{decision}}.',
  reviewNoTimeout: 'Die Prüfung wartet, bis eine Person entscheidet, sofern das Zeitlimit der Pipeline den Lauf nicht vorher beendet.',
  stages: 'Stufen',
  stagesCount_one: '{{count}} Stufe',
  stagesCount_other: '{{count}} Stufen',
  noStages: 'Dieser Pipeline-Lauf hat keine Stufen.',
  current: 'Aktuell',
  reviewGate: 'Prüfschritt',
  agent: 'Agent: {{agent}}',
  counts: 'Ausführungen {{executions}}, Versuche {{attempts}} von {{maxAttempts}}, Überarbeitungen {{revisions}} von {{maxRevisions}}',
  startedAt: 'gestartet',
  blocked: 'Wartet auf den Start: {{reason}}.',
  nextAttempt: 'Nächster Versuch um {{time}}.',
  reviewItem: 'Prüfung von Ausführung {{execution}}',
  columns: { execution: 'Ausführung', run: 'Stufenlauf', status: 'Status', outcome: 'Ergebnis', error: 'Fehler', created: 'Erstellt' },
  confirmCancelTitle: 'Pipeline-Lauf abbrechen',
  confirmCancel: 'Diesen Pipeline-Lauf von {{pipeline}} abbrechen? Sein aktueller Stufenlauf wird abgebrochen und eine offene Prüfung geschlossen. Sie können ihn später wiederholen.',
  confirmDelete: 'Diesen Pipeline-Lauf von {{pipeline}} samt seinen Prüfungen löschen? Seine Stufenläufe bleiben auf der Seite Läufe.'
};
Object.assign(de.views.runDetail, { pipelineRun: 'Pipeline-Lauf' });
de.views.settings.fields.Runtime.PipelineSweepIntervalMs = 'Prüfintervall für Pipelines (ms)';
de.views.settings.fields.Runtime.PipelineMaxStages = 'Maximale Stufen pro Pipeline';

// Deployment trust level (P11.14).
de.enums.trustLevel = { Trusted: "Vertrauenswürdig", Untrusted: "Nicht vertrauenswürdig" };
de.enums.runBlockedReason.NoIsolatingWorker = "Kein isolierender Worker";
de.components.blocked.reasons.NoIsolatingWorker = "Dieser Lauf ist nicht vertrauenswürdig und braucht Container-Isolation, aber kein bereiter Worker, der {{harness}} ausführen kann, bietet sie. Fügen Sie einen Worker mit der Kubernetes-Job-Ausführung in einem Cluster hinzu, in dem er Jobs anlegen darf.";
de.tips.enums.runBlockedReason.NoIsolatingWorker = "Blockiert: Dieser nicht vertrauenswürdige Lauf braucht Container-Isolation, und kein bereiter Worker mit seinem Harness bietet sie. Er wartet in der Warteschlange, bis sich ein Worker mit der Kubernetes-Job-Ausführung anmeldet.";
de.tips.enums.trustLevel = { Trusted: "Eingaben kommen nur von vertrauenswürdigen Aufrufern. Läufe dürfen die Process-Ausführung nutzen, die nicht von anderen Läufen oder dem Worker isoliert ist.", Untrusted: "Eingaben können aus nicht vertrauenswürdigen Quellen stammen. Läufe gehen nur an eine Ausführung mit Container-Isolation oder stärker und warten in der Warteschlange, bis eine verfügbar ist." };
Object.assign(de.common.fieldCodes, { TenantRequiresUntrusted: "Dieser Mandant verlangt, dass jede Bereitstellung nicht vertrauenswürdig ist.", UntrustedNeedsIsolation: "Eine nicht vertrauenswürdige Bereitstellung kann die Process-Ausführung nicht nutzen. Wählen Sie Kubernetes-Job oder lassen Sie die Ausführung leer." });
de.resources.deployments.fields.trustLevel = "Vertrauensstufe";
de.resources.deployments.columns.trustLevel = "Vertrauensstufe";
de.resources.deployments.hints.trustLevel = "Wählen Sie Nicht vertrauenswürdig, wenn Aufrufer oder Inhalte nicht vertrauenswürdig sein können. Solche Läufe brauchen Container-Isolation: Eine leere Ausführung bedeutet dann Kubernetes-Job, und Läufe warten, bis ein Worker sie isolieren kann.";
de.tips.resources.deployments.trustLevel = "Vertrauenswürdig erlaubt die Process-Ausführung, die nicht isoliert ist. Nicht vertrauenswürdig läuft nur auf einer Ausführung mit Container-Isolation oder stärker.";
de.tips.resources.deployments.trustFlagged = "Dieser Mandant verlangt nicht vertrauenswürdige Bereitstellungen. Diese Bereitstellung war vorher vertrauenswürdig: Sie läuft wie konfiguriert weiter, muss aber beim nächsten Speichern auf Nicht vertrauenswürdig gesetzt werden.";
de.resources.deployments.trust = { tenantRequiresUntrusted: "Dieser Mandant verlangt nicht vertrauenswürdige Bereitstellungen. Setzen Sie die Vertrauensstufe auf Nicht vertrauenswürdig, um diese Bereitstellung zu speichern.", untrustedProcess: "Nicht vertrauenswürdige Bereitstellungen können die Process-Ausführung nicht nutzen. Wählen Sie Kubernetes-Job oder lassen Sie die Ausführung leer.", flagged: "Vertrauenswürdig, Richtlinie verlangt Nicht vertrauenswürdig" };
de.resources.tenants.fields.requireUntrustedDeployments = "Nicht vertrauenswürdige Bereitstellungen verlangen";
de.resources.tenants.columns.requireUntrustedDeployments = "Verlangt Nicht vertrauenswürdig";
de.resources.tenants.hints = { ...(de.resources.tenants.hints || {}), requireUntrustedDeployments: "Das Anlegen oder Speichern einer vertrauenswürdigen Bereitstellung wird abgelehnt. Bestehende vertrauenswürdige Bereitstellungen laufen weiter und werden markiert, bis sie als nicht vertrauenswürdig gespeichert werden." };
de.tips.resources.tenants.requireUntrustedDeployments = "Wenn aktiv, muss jede Bereitstellung dieses Mandanten nicht vertrauenswürdig sein, damit ihre Läufe nur an isolierte Ausführungen gehen.";
de.views.runDetail.trustLevel = "Vertrauensstufe";
de.tips.views.runDetail.trustLevel = "Die Vertrauensstufe der Bereitstellung, als dieser Lauf eingereiht wurde. Nicht vertrauenswürdige Läufe gehen nur an eine Ausführung mit Container-Isolation oder stärker.";

// Deployment effect policy (P12.29).
de.enums.effectPolicy = { AtMostOnce: "Höchstens einmal", AtLeastOnce: "Mindestens einmal", Journaled: "Protokolliert" };
de.tips.enums.effectPolicy = { AtMostOnce: "Geht der Worker verloren, nachdem der Lauf gestartet ist, schlägt der Lauf mit Knoten verloren fehl und wird nie erneut gestartet. Keine externe Wirkung geschieht zweimal. Der Standard.", AtLeastOnce: "Geht der Worker verloren, nachdem der Lauf gestartet ist, kehrt der Lauf in die Warteschlange zurück, solange Versuche übrig sind. Wirkungen des verlorenen Versuchs (ein Push, eine Nachricht) können erneut geschehen.", Journaled: "Reiht nur neu ein, wenn jede Wirkung über das Wirkungsprotokoll lief. Das Protokoll gibt es noch nicht, daher verhält sich dies wie Höchstens einmal." };
Object.assign(de.common.fieldCodes, { EffectPolicyConflict: "Die Wirkungsrichtlinie widerspricht dem veralteten Wert retryOnNodeLoss. Senden Sie nur die Wirkungsrichtlinie." });
de.resources.deployments.fields.effectPolicy = "Wirkungsrichtlinie";
de.resources.deployments.columns.effectPolicy = "Wirkungsrichtlinie";
de.resources.deployments.hints.effectPolicy = "Höchstens einmal (Standard) lässt einen gestarteten Lauf, dessen Worker verloren geht, mit Knoten verloren fehlschlagen. Mindestens einmal reiht ihn neu ein, solange Versuche übrig sind, und kann Wirkungen wiederholen. Protokolliert verhält sich wie Höchstens einmal, bis das Wirkungsprotokoll existiert. Ein nie gestarteter Lauf wird immer neu eingereiht.";
de.tips.resources.deployments.effectPolicy = "Was mit einem gestarteten Lauf geschieht, wenn sein Worker verloren geht: fehlschlagen (Höchstens einmal), neu einreihen (Mindestens einmal) oder Protokolliert, das sich vorerst wie Höchstens einmal verhält.";
de.views.runDetail.effectPolicy = "Wirkungsrichtlinie";
de.tips.views.runDetail.effectPolicy = "Die Wirkungsrichtlinie der Bereitstellung, als dieser Lauf eingereiht wurde. Sie entscheidet, was passiert, wenn der Worker des Laufs verloren geht; spätere Änderungen an der Bereitstellung betreffen diesen Lauf nicht.";
de.views.settings.fields.Scheduling.QueueWakeFanout = "Geweckte Long Polls pro Replik";
de.views.settings.fields.Scheduling.RemoteWakeDelayMs = "Zurückhalten entfernter Weckrufe (ms)";
de.views.settings.fields.Auth.CacheSeconds = "Lebensdauer des Authentifizierungscaches (Sekunden)";

// Deployment egress allowlists (P11.15).
de.resources.deployments.fields.egressRules = "Egress-Zulassungsliste";
de.resources.deployments.fields.egressCidr = "CIDR-Block";
de.resources.deployments.fields.egressPort = "Zielport";
de.resources.deployments.fields.egressProtocol = "Protokoll";
de.resources.deployments.columns.egressRules = "Ausgehend";
de.resources.deployments.hints.egressRules = "Leer lassen, um den Standard-Egress des Clusters für Läufe zu nutzen (HTTPS zu beliebigen Zielen). Mit Regeln erreichen Lauf-Pods nur DNS, den Garrison-MCP-Port und diese Blöcke, und Läufe brauchen einen Kubernetes-Worker, der sie durchsetzt. Geben Sie CIDR-Blöcke ein, keine Hostnamen; lösen Sie Namen selbst in Adressen auf. Ein leerer Port erlaubt jeden Port. Höchstens 64 Regeln.";
de.resources.deployments.egress = {"add": "Egress-Regel hinzufügen", "allPorts": "Alle Ports", "default": "Standard", "count_one": "Zulassungsliste, {{count}} Regel", "count_other": "Zulassungsliste, {{count}} Regeln", "note_one": "Diese Bereitstellung hat {{count}} Egress-Regel. Ihre Läufe laufen nur auf Kubernetes-Workern mit aktivierten Egress-Zulassungslisten, in einem Pod, dessen NetworkPolicy nur DNS, den Garrison-MCP-Port und die Regel erlaubt. Ist kein solcher Worker bereit, warten Läufe in der Warteschlange (Kein isolierender Worker); sie laufen nie ohne die Zulassungsliste.", "note_other": "Diese Bereitstellung hat {{count}} Egress-Regeln. Ihre Läufe laufen nur auf Kubernetes-Workern mit aktivierten Egress-Zulassungslisten, in einem Pod, dessen NetworkPolicy nur DNS, den Garrison-MCP-Port und die Regeln erlaubt. Ist kein solcher Worker bereit, warten Läufe in der Warteschlange (Kein isolierender Worker); sie laufen nie ohne die Zulassungsliste.", "errors": {"cidrRequired": "Geben Sie einen CIDR-Block ein, zum Beispiel 203.0.113.0/24.", "cidrFormat": "Verwenden Sie CIDR-Notation mit Präfixlänge, zum Beispiel 198.51.100.7/32. Hostnamen werden nicht akzeptiert.", "cidrAddress": "Die Adresse ist keine gültige IPv4- oder IPv6-Adresse.", "cidrPrefix": "Die Präfixlänge liegt außerhalb des Bereichs (0 bis 32 für IPv4, 0 bis 128 für IPv6).", "cidrMapped": "IPv4-gemappte IPv6-Adressen sind nicht erlaubt; geben Sie stattdessen den IPv4-Block ein.", "cidrHostBits": "Die Adresse hat nach dem Präfix gesetzte Bits; verwenden Sie die Netzwerkadresse des Blocks."}};
Object.assign(de.common.fieldCodes, {"InvalidCidr": "Ungültiger CIDR-Block.", "PortOutOfRange": "Der Port muss zwischen 1 und 65535 liegen oder für alle Ports leer sein.", "InvalidProtocol": "Unbekanntes Protokoll; verwenden Sie TCP oder UDP.", "TooManyEgressRules": "Eine Bereitstellung kann höchstens 64 Egress-Regeln haben.", "EgressRulesNeedKubernetesJob": "Egress-Regeln werden nur für Kubernetes-Job-Läufe durchgesetzt. Wählen Sie Kubernetes-Job oder lassen Sie die Ausführung leer.", "EgressRulesNeedColdStart": "Egress-Regeln brauchen einen Kaltstart, weil warme Pods bereits mit dem Standard-Egress laufen. Leeren Sie die Startklasse oder wählen Sie Kalt."});
de.components.blocked.reasons.NoIsolatingWorkerEgress = "Die Bereitstellung dieses Laufs hat eine Egress-Zulassungsliste, die nur ein Kubernetes-Worker mit aktivierten Egress-Zulassungslisten durchsetzen kann, und kein bereiter Worker, der {{harness}} ausführen kann, bietet das an. Der Lauf wartet in der Warteschlange und läuft nie ohne die Zulassungsliste. Aktivieren Sie Egress-Zulassungslisten für einen Kubernetes-Job-Worker in einem Cluster, dessen Netzwerk-Plugin NetworkPolicy durchsetzt.";
de.tips.enums.runBlockedReason.NoIsolatingWorker = "Blockiert: Dieser Lauf braucht einen isolierenden Worker (Container-Isolation für einen nicht vertrauenswürdigen Lauf oder Egress-Kontrolle für eine Bereitstellung mit Egress-Zulassungsliste), und kein bereiter Worker mit seinem Harness bietet das an. Er wartet in der Warteschlange, bis sich ein passender Kubernetes-Job-Worker registriert.";
de.tips.resources.deployments.egressRules = "Ziele, die Lauf-Pods dieser Bereitstellung erreichen dürfen, als CIDR-Blöcke mit optionalem Port und Protokoll. Leer nutzt den Standard-Egress für Läufe.";
de.tips.resources.deployments.egressRulesItems = {"cidr": "Zielblock in CIDR-Notation, IPv4 oder IPv6, zum Beispiel 203.0.113.0/24. Lösen Sie Hostnamen selbst in Adressen auf.", "port": "Zielport von 1 bis 65535. Leer lassen, um jeden Port des Blocks zu erlauben.", "protocol": "TCP für die meisten Dienste oder UDP."};
de.tips.resources.deployments.egressDefault = "Keine Egress-Zulassungsliste: Lauf-Pods nutzen den Standard-Egress des Clusters.";

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
})(de, {
 "nav": {
  "items": {
   "triggers": {
    "label": "Auslöser",
    "tip": "Cron-Zeitpläne und signierte Webhooks, die Läufe starten"
   },
   "notifications": {
    "label": "Benachrichtigungen",
    "tip": "Signierte Webhooks zu Läufen, Pipelines und Freigaben"
   }
  }
 },
 "enums": {
  "triggerType": {
   "Cron": "Cron-Zeitplan",
   "Webhook": "Signierter Webhook"
  },
  "triggerTargetType": {
   "Agent": "Agentenlauf",
   "Pipeline": "Pipeline-Lauf"
  },
  "triggerFireSource": {
   "Cron": "Zeitplan",
   "Webhook": "Webhook-Zustellung",
   "Manual": "Von Hand ausgelöst"
  },
  "triggerFireOutcome": {
   "Started": "Gestartet",
   "Failed": "Fehlgeschlagen",
   "Skipped": "Übersprungen"
  },
  "notificationEvent": {
   "RunSucceeded": "Lauf erfolgreich",
   "RunFailed": "Lauf fehlgeschlagen",
   "RunCancelled": "Lauf abgebrochen",
   "RunTimedOut": "Lauf-Zeitüberschreitung",
   "PipelineCompleted": "Pipeline abgeschlossen",
   "PipelineFailed": "Pipeline fehlgeschlagen",
   "ApprovalRequested": "Freigabe angefordert",
   "Test": "Testbenachrichtigung"
  },
  "notificationDeliveryStatus": {
   "Pending": "Wartend",
   "Delivering": "Wird zugestellt",
   "Succeeded": "Zugestellt",
   "Failed": "Aufgegeben"
  },
  "runKind": {
   "Invoke": "Aufruf",
   "Delegated": "Delegiert",
   "Test": "Testlauf",
   "Retry": "Wiederholung",
   "Pipeline": "Pipeline-Stufe",
   "Trigger": "Von einem Auslöser gestartet"
  },
  "resourceType": {
   "Trigger": "Auslöser",
   "NotificationEndpoint": "Benachrichtigungsendpunkt"
  },
  "auditEventType": {
   "SigningSecretRotated": "Signaturgeheimnis erneuert"
  }
 },
 "errorCodes": {
  "ReferencedByTrigger": "Ein Auslöser verwendet diesen Datensatz. Ändern oder löschen Sie zuerst diesen Auslöser.",
  "ReferencedByNotificationEndpoint": "Ein Benachrichtigungsendpunkt filtert nach diesem Datensatz. Ändern oder löschen Sie zuerst diesen Endpunkt.",
  "NotAWebhookTrigger": "Nur Webhook-Auslöser haben ein Signaturgeheimnis.",
  "TriggerInactive": "Dieser Auslöser ist inaktiv.",
  "InvalidSignature": "Die Webhook-Signatur fehlt, ist fehlerhaft, zu alt oder passt nicht.",
  "PayloadTooLarge": "Die Nutzlast ist größer, als der Server annimmt."
 },
 "common": {
  "fieldCodes": {
   "InvalidUrl": "Geben Sie eine absolute HTTP- oder HTTPS-URL ohne Benutzernamen und Passwort ein.",
   "DestinationBlocked": "Der Server lehnt dieses Ziel ab: Loopback-, private, Link-Local- und Metadatenadressen sind gesperrt, solange ein Betreiber private Ziele nicht erlaubt.",
   "EventsRequired": "Wählen Sie mindestens ein Ereignis.",
   "InvalidEvent": "Eines der Ereignisse wird nicht unterstützt.",
   "InvalidCron": "Der Cron-Ausdruck ist ungültig. Verwenden Sie fünf Felder: Minute, Stunde, Tag des Monats, Monat und Wochentag.",
   "InvalidTimeZone": "Unbekannte Zeitzone. Verwenden Sie einen IANA-Namen wie UTC oder Europe/Berlin.",
   "TypeImmutable": "Der Typ eines Auslösers kann sich nicht ändern. Legen Sie stattdessen einen neuen Auslöser an.",
   "TargetMismatch": "Dieses Feld gehört nicht zum gewählten Ziel.",
   "PayloadTooLarge": "Die Nutzlast ist größer, als der Server annimmt."
  }
 },
 "resources": {
  "runs": {
   "columns": {
    "triggerId": "Auslöser",
    "kind": "Laufart"
   }
  },
  "triggers": {
   "title": "Auslöser",
   "subtitle": "Cron-Zeitpläne und signierte Webhooks, die einen Agentenlauf oder einen Pipeline-Lauf starten.",
   "add": "Auslöser hinzufügen",
   "create": "Auslöser anlegen",
   "edit": "Auslöser bearbeiten",
   "view": "Auslöserdetails",
   "deleteTitle": "Auslöser löschen",
   "emptyTitle": "Noch keine Auslöser",
   "emptyBody": "Legen Sie einen Auslöser an, um einen Agenten nach Zeitplan oder auf einen Webhook eines anderen Systems hin auszuführen.",
   "columns": {
    "name": "Name",
    "type": "Typ",
    "target": "Startet",
    "schedule": "Zeitplan",
    "active": "Aktiv",
    "lastFire": "Letzte Auslösung",
    "nextFireUtc": "Nächste Auslösung",
    "fireCount": "Auslösungen",
    "runAs": "Läuft als",
    "signingSecretLast4": "Geheimnis endet auf",
    "description": "Beschreibung",
    "id": "ID",
    "createdUtc": "Erstellt"
   },
   "fields": {
    "name": "Name",
    "type": "Typ",
    "description": "Beschreibung",
    "targetType": "Startet",
    "agentId": "Agent",
    "deploymentId": "Bereitstellung",
    "pipelineId": "Pipeline",
    "inputTemplateId": "Eingabevorlage",
    "priority": "Priorität",
    "cronExpression": "Cron-Ausdruck",
    "timeZone": "Zeitzone",
    "active": "Aktiv",
    "webhook": "Webhook-URL"
   },
   "hints": {
    "type": "Der Typ lässt sich nach dem Anlegen nicht mehr ändern.",
    "inputTemplateId": "Eine Task-Vorlage, die die Laufeingabe aus den Variablen trigger.* und webhook.* erzeugt. Leer verwendet die eingebaute Vorlage trigger-input.",
    "priority": "Von {{min}} bis {{max}}. Höhere Werte laufen zuerst.",
    "cronExpression": "Fünf Felder: Minute, Stunde, Tag des Monats, Monat, Wochentag. Beispiel: 0 9 * * 1-5 läuft werktags um 09:00.",
    "timeZone": "IANA-Name wie UTC oder Europe/Berlin. Sommerzeitwechsel werden berücksichtigt.",
    "webhookNew": "Webhook-URL und Signaturgeheimnis erscheinen nach dem Speichern. Das Geheimnis wird einmal angezeigt."
   },
   "errors": {
    "name": "Verwenden Sie 1 bis 64 Kleinbuchstaben, Ziffern und Bindestriche, beginnend und endend mit einem Buchstaben oder einer Ziffer.",
    "description": "Beschreibungen sind auf {{max}} Zeichen begrenzt.",
    "agentRequired": "Wählen Sie den Agenten, den dieser Auslöser ausführt.",
    "pipelineRequired": "Wählen Sie die Pipeline, die dieser Auslöser startet.",
    "cron": "Geben Sie fünf Felder (Minute Stunde Tag Monat Wochentag) oder ein Makro wie @daily ein.",
    "priority": "Geben Sie eine ganze Zahl von {{min}} bis {{max}} ein."
   },
   "actions": {
    "fire": "Jetzt auslösen",
    "fires": "Auslöseverlauf",
    "runs": "Läufe anzeigen",
    "rotateSecret": "Geheimnis erneuern"
   },
   "fires": {
    "firedUtc": "Ausgelöst",
    "source": "Quelle",
    "outcome": "Ergebnis",
    "started": "Gestarteter Lauf",
    "deliveryId": "Zustellungs-ID",
    "error": "Fehler",
    "runId": "Lauf",
    "pipelineRunId": "Pipeline-Lauf"
   },
   "confirmRotateTitle": "Signaturgeheimnis erneuern",
   "confirmRotate": "Das Signaturgeheimnis von {{name}} ersetzen? Das alte Geheimnis ist sofort ungültig, Absender müssen auf das neue umstellen.",
   "anyDeployment": "Beliebige aktive Bereitstellung (gewichtet)",
   "builtinTemplate": "Eingebaute Vorlage trigger-input",
   "webhookSchedule": "Wenn ein signierter Webhook eintrifft",
   "neverFired": "Noch nicht ausgelöst",
   "runAsNotice": "Läuft als {{name}}. Wenn Sie Änderungen speichern, läuft dieser Auslöser künftig als Sie.",
   "secretEnding": "Das aktuelle Geheimnis endet auf {{last4}}."
  },
  "notifications": {
   "title": "Benachrichtigungen",
   "subtitle": "Webhook-Endpunkte, die signierte Benachrichtigungen erhalten, wenn Läufe und Pipelines enden oder Freigaben warten.",
   "add": "Endpunkt hinzufügen",
   "create": "Benachrichtigungsendpunkt anlegen",
   "edit": "Benachrichtigungsendpunkt bearbeiten",
   "view": "Details des Benachrichtigungsendpunkts",
   "deleteTitle": "Benachrichtigungsendpunkt löschen",
   "emptyTitle": "Noch keine Benachrichtigungsendpunkte",
   "emptyBody": "Fügen Sie einen Endpunkt hinzu, der einen signierten HTTP-POST erhält, wenn ein Lauf scheitert, eine Pipeline endet oder eine Freigabe wartet.",
   "columns": {
    "name": "Name",
    "url": "URL",
    "events": "Ereignisse",
    "filters": "Filter",
    "active": "Aktiv",
    "signingSecretLast4": "Geheimnis endet auf",
    "includeResultText": "Ergebnistext",
    "description": "Beschreibung",
    "id": "ID",
    "createdUtc": "Erstellt",
    "agent": "Agent",
    "deployment": "Bereitstellung"
   },
   "fields": {
    "name": "Name",
    "description": "Beschreibung",
    "url": "URL",
    "events": "Ereignisse",
    "agentId": "Nur dieser Agent",
    "deploymentId": "Nur diese Bereitstellung",
    "includeResultText": "Ergebnistext mitsenden",
    "resultTextMaxChars": "Grenze für Ergebnistext (Zeichen)",
    "active": "Aktiv"
   },
   "hints": {
    "url": "Eine HTTP- oder HTTPS-URL. Loopback-, private und Metadatenadressen werden abgelehnt, solange ein Betreiber private Ziele nicht erlaubt, und Weiterleitungen werden nicht verfolgt.",
    "events": "Pipeline-Ereignisse werden nicht gesendet, solange ein Agenten- oder Bereitstellungsfilter gesetzt ist.",
    "agentId": "Leer sendet Ereignisse aller Agenten.",
    "deploymentId": "Leer sendet Ereignisse aller Bereitstellungen.",
    "includeResultText": "Standardmäßig aus: Benachrichtigungen enthalten Kennungen, Status und Zeitstempel, aber keine Laufausgabe.",
    "resultTextMaxChars": "Von {{min}} bis {{max}}. Standard {{default}}."
   },
   "errors": {
    "name": "Verwenden Sie 1 bis 64 Kleinbuchstaben, Ziffern und Bindestriche, beginnend und endend mit einem Buchstaben oder einer Ziffer.",
    "url": "Geben Sie eine absolute HTTP- oder HTTPS-URL ohne Benutzernamen und Passwort ein.",
    "events": "Wählen Sie mindestens ein Ereignis.",
    "resultTextMaxChars": "Geben Sie eine ganze Zahl von {{min}} bis {{max}} ein."
   },
   "actions": {
    "test": "Test senden",
    "deliveries": "Zustellprotokoll",
    "rotateSecret": "Geheimnis erneuern"
   },
   "deliveries": {
    "createdUtc": "Eingereiht",
    "event": "Ereignis",
    "status": "Status",
    "attempts": "Versuche",
    "lastStatusCode": "HTTP-Status",
    "lastError": "Letzter Fehler",
    "lastAttemptUtc": "Letzter Versuch",
    "nextAttemptUtc": "Nächster Versuch",
    "deliveredUtc": "Zugestellt",
    "payload": "Nutzlast",
    "id": "Zustellungs-ID"
   },
   "confirmRotateTitle": "Signaturgeheimnis erneuern",
   "confirmRotate": "Das Signaturgeheimnis von {{name}} ersetzen? Benachrichtigungen werden ab jetzt mit dem neuen Geheimnis signiert, auch bereits eingereihte Wiederholungen.",
   "anyAgent": "Alle Agenten",
   "anyDeployment": "Alle Bereitstellungen",
   "noFilter": "Alles",
   "eventCount_one": "{{count}} Ereignis",
   "eventCount_other": "{{count}} Ereignisse",
   "resultTextUpTo_one": "Bis zu {{count}} Zeichen",
   "resultTextUpTo_other": "Bis zu {{count}} Zeichen",
   "secretNotice": "Benachrichtigungen werden mit einem Geheimnis signiert, das auf {{last4}} endet, gesetzt am {{time}}. Erneuern Sie es, um ein neues zu erhalten."
  }
 },
 "components": {
  "signingSecret": {
   "title": "Signaturgeheimnis",
   "warning": "Kopieren Sie dieses Geheimnis jetzt. Garrison speichert es verschlüsselt und zeigt es nie wieder an; erneuern Sie es, falls es verloren geht.",
   "secret": "Geheimnis",
   "url": "Webhook-URL",
   "done": "Gespeichert",
   "scheme": "Signieren Sie jede Anfrage mit dem Header {{header}}: {{format}}. Senden Sie {{delivery}}, damit wiederholte Zustellungen nur einmal zählen."
  },
  "triggerFire": {
   "title": "{{name}} auslösen",
   "intro": "Diesen Auslöser jetzt starten. Eine Nutzlast ist optional; die Eingabevorlage sieht sie als webhook.body.",
   "body": "Nutzlast",
   "contentType": "Inhaltstyp der Nutzlast",
   "submit": "Auslösen",
   "firing": "Wird ausgelöst..."
  },
  "triggerFires": {
   "title": "Auslöseverlauf",
   "count_one": "{{shown}} von {{count}} Auslösung",
   "count_other": "{{shown}} von {{count}} Auslösungen",
   "empty": "Dieser Auslöser wurde noch nicht ausgelöst.",
   "scheduled": "für {{time}}"
  },
  "notificationDeliveries": {
   "title": "Zustellprotokoll",
   "count_one": "{{shown}} von {{count}} Zustellung",
   "count_other": "{{shown}} von {{count}} Zustellungen",
   "empty": "An diesen Endpunkt wurde noch nichts gesendet.",
   "detail": "Ausgewählte Zustellung"
  },
  "notificationTest": {
   "title": "Testbenachrichtigung",
   "sending": "Testbenachrichtigung wird gesendet...",
   "succeeded": "Der Endpunkt hat die Testbenachrichtigung angenommen.",
   "failed": "Die Testbenachrichtigung ist fehlgeschlagen und wird nicht wiederholt. Siehe Fehler unten.",
   "pending": "Der erste Versuch ist fehlgeschlagen; Garrison versucht es erneut. Siehe Fehler unten."
  }
 },
 "views": {
  "runDetail": {
   "trigger": "Auslöser"
  },
  "settings": {
   "groups": {
    "Triggers": "Auslöser",
    "Notifications": "Benachrichtigungen"
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Größter Webhook-Inhalt (Bytes)",
     "WebhookToleranceSeconds": "Toleranz für Webhook-Zeitstempel (Sekunden)",
     "CronMaxLatenessSeconds": "Grenze für Cron-Nachholung (Sekunden)",
     "FireRetentionDays": "Aufbewahrung des Auslöseverlaufs (Tage)"
    },
    "Notifications": {
     "AllowPrivateDestinations": "Private Ziele erlauben",
     "MaxAttempts": "Zustellversuche",
     "InitialBackoffSeconds": "Erste Wartezeit vor Wiederholung (Sekunden)",
     "MaxBackoffSeconds": "Längste Wartezeit vor Wiederholung (Sekunden)",
     "TimeoutSeconds": "Zeitlimit pro Zustellung (Sekunden)",
     "DispatchIntervalMs": "Versandintervall (ms)",
     "SweepOverlapSeconds": "Überlappung der Ereignissuche (Sekunden)",
     "DeliveryRetentionDays": "Aufbewahrung des Zustellprotokolls (Tage)"
    }
   }
  }
 }
});
Object.assign(de.common.fieldCodes, {"SecretUseDenied": "Sie dürfen dieses Geheimnis nicht verwenden. Bitten Sie um die Rolle SecretUser oder SecretManager dafür.", "GrantCeiling": "Sie können nur Berechtigungen vergeben, die Sie selbst haben.", "ReservedRoleName": "Das ist der Name einer integrierten Rolle. Wählen Sie einen anderen Namen."});
de.components.mcpTest.noWorkers = "Kein bereiter Worker bietet stdio-Diagnosen an. Worker führen sie nur aus, wenn ein Betreiber GARRISON_WORKER_MCP_TESTS_ENABLED=true für sie setzt, denn der Befehl läuft auf dem Worker-Host außerhalb der Laufisolation.";

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
})(de, {
 "components": {
  "transcriptExport": {
   "label": "Verlauf exportieren",
   "exporting": "Wird exportiert...",
   "markdown": "Markdown-Dokument (.md)",
   "json": "JSON (.json)",
   "includeThinking": "Denkschritte einbeziehen",
   "failed": "Export des Verlaufs fehlgeschlagen: {{message}}"
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "Strukturierte Eingabe",
    "modeLabel": "Eingabe-Editor",
    "modeForm": "Formular",
    "modeJson": "Rohes JSON",
    "required": "Pflichtfeld",
    "choose": "Wert auswählen",
    "addItem": "Eintrag hinzufügen",
    "removeItem": "Eintrag entfernen",
    "jsonLabel": "Eingabe-JSON",
    "jsonPlaceholder": "JSON-Wert",
    "unsupported": "Dieses Eingabeschema hat keine Eigenschaften, aus denen sich ein Formular bauen lässt. Geben Sie das JSON-Dokument ein, das der Agent erwartet.",
    "invalidRaw": "Das JSON ist ungültig. Korrigieren Sie es, bevor Sie zum Formular wechseln.",
    "errors": {
     "required": "Dieses Feld ist erforderlich.",
     "number": "Geben Sie eine Zahl ein.",
     "integer": "Geben Sie eine ganze Zahl ein.",
     "json": "Geben Sie gültiges JSON ein."
    }
   }
  },
  "manifests": {
   "bundle": {
    "scope": "Exportumfang",
    "scopeAll": "Alle Ressourcen",
    "scopeSelected": "Ausgewählte Ressourcen",
    "kinds": "Arten",
    "resources": "Ressourcen",
    "resourcesHint": "Ein Kind/Name pro Zeile oder durch Kommas getrennt, zum Beispiel Agent/triage.",
    "invalidSelectors": "Kein Kind/Name mit bekannter Art: {{entries}}",
    "followReferences": "Referenzierte Ressourcen einbeziehen",
    "includeBuiltIn": "Referenzierte integrierte Ressourcen einbeziehen",
    "exporting": "Wird exportiert...",
    "noSecrets": "Dieses Paket benötigt keine Geheimnisse.",
    "requiredSecrets": "Legen Sie diese Geheimnisse im Ziel-Mandanten an, bevor Sie anwenden. Geheimniswerte werden nie exportiert.",
    "requiredArtifactStores": "Legen Sie diese Artefaktspeicher im Ziel-Mandanten an, bevor Sie anwenden."
   }
  }
 }
});

// Durable continuation and remote execution.
de.enums.runStatus.Suspended = "Angehalten";
de.resources.deployments.fields.suspensionEnabled = "Während der Freigabe aussetzen";
de.resources.harnessProfiles.fields.sessionFormat = "Harness-Sitzungsformat";
de.enums.auditEventType.QueueFull = "Warteschlange voll";
de.enums.runExecutor.RemoteA2A = "Entferntes A2A";
de.enums.runExecutor.RemoteMcp = "Entferntes MCP";
de.tips.resources.deployments.suspensionEnabled = "Aktiviert dauerhafte Sicherungspunkte beim Warten. Benötigt Process, isoliertes Home, kompatible Sitzungsfortsetzung und einen Artefaktspeicher.";
de.tips.resources.harnessProfiles.sessionFormat = "Versioniertes Sitzungsformat für portable Sicherungspunkte. Bei inkompatiblen Harness-Upgrades ändern.";
de.tips.enums.runStatus.Suspended = "Der Lauf hat einen dauerhaften Sitzungssicherungspunkt und belegt beim Warten weder Worker-Lease noch Ausführungsplatz.";
de.tips.enums.runExecutor.RemoteA2A = "Führt einen authentifizierten registrierten A2A-Agenten mit Frist und Abbruch aus.";
de.tips.enums.runExecutor.RemoteMcp = "Ruft das ausgewählte registrierte MCP-Werkzeug mit geprüftem JSON-Eingang auf.";
de.tips.enums.auditEventType.QueueFull = "Die Aufnahme wurde abgelehnt, weil eine Warteschlangengrenze für Cluster, Mandant oder Agent erreicht ist.";

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
})(de, {
 "enums": {
  "agentRevisionState": {
   "Draft": "Entwurf",
   "Published": "Veröffentlicht"
  },
  "promotionKind": {
   "Promote": "Hochstufung",
   "Rollback": "Zurücksetzung"
  },
  "promotionOutcome": {
   "Applied": "Angewendet",
   "RolledBack": "Zurückgesetzt"
  },
  "revisionChangeType": {
   "Changed": "Geändert",
   "Added": "Hinzugefügt",
   "Removed": "Entfernt"
  },
  "resourceType": {
   "AgentRevision": "Agentenrevision",
   "Promotion": "Hochstufung"
  }
 },
 "errorCodes": {
  "PromotionOrderViolation": "Das Ziel ist nicht die nächste Umgebung nach der Quelle. Aktivieren Sie Umgebungen überspringen, um außer der Reihe hochzustufen.",
  "NoNextEnvironment": "Die Quelle ist die letzte Umgebung, daher gibt es kein Ziel für die Hochstufung.",
  "NoTargetDeployments": "Dieser Agent hat keine Bereitstellung in der Zielumgebung. Legen Sie dort zuerst eine an.",
  "NoSourceRevision": "Es gibt keine Revision zum Hochstufen: Der Agent hat keine Bereitstellung in der Quellumgebung oder keine veröffentlichte Revision. Wählen Sie eine Revision ausdrücklich.",
  "AmbiguousSourceRevision": "Bereitstellungen in der Quellumgebung führen unterschiedliche Revisionen aus. Wählen Sie die Revision, die hochgestuft werden soll.",
  "RevisionNotPublished": "Diese Revision ist ein Entwurf. Veröffentlichen Sie sie vor der Hochstufung.",
  "PromotionConflict": "Eine Bereitstellung hat sich während der Hochstufung geändert. Nichts wurde geändert; laden Sie neu und versuchen Sie es erneut.",
  "NotAPromotion": "Nur Hochstufungen können zurückgesetzt werden, keine Zurücksetzungen.",
  "AlreadyRolledBack": "Diese Hochstufung wurde bereits zurückgesetzt.",
  "RevisionUnchanged": "Der Entwurf entspricht der neuesten veröffentlichten Revision. Ändern Sie ihn vor dem Veröffentlichen oder verwerfen Sie ihn.",
  "RevisionPublished": "Diese Revision ist bereits veröffentlicht und kann sich nicht mehr ändern.",
  "EnvironmentInUse": "Eine entfernte Umgebung hat noch Bereitstellungen. Verschieben oder löschen Sie diese Bereitstellungen zuerst."
 },
 "views": {
  "agentDetail": {
   "revisions": "Revisionen",
   "draftNotice": "Dieser Agent hat Entwurfsänderungen, die nicht veröffentlicht sind. Bereitstellungen führen weiter veröffentlichte Revisionen aus, bis der Entwurf veröffentlicht wird.",
   "reviewDraft": "Entwurf prüfen"
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "number": "Revisionsnr.",
    "state": "Zustand",
    "author": "Autor",
    "changeNote": "Änderungsnotiz",
    "publishedUtc": "Veröffentlicht",
    "actions": "Aktionen"
   },
   "number": "Revision Nr. {{number}}",
   "option": "Revision Nr. {{number}} ({{state}})",
   "latest": "Neueste",
   "empty": "Dieser Agent hat noch keine Revisionen.",
   "compareTitle": "Revisionen vergleichen",
   "from": "Von",
   "to": "Nach",
   "pickTwo": "Wählen Sie zwei verschiedene Revisionen zum Vergleichen.",
   "identical": "Die Revisionen {{from}} und {{to}} haben denselben Inhalt.",
   "diffSummary": "Geänderte Felder zwischen Revision {{from}} und Revision {{to}}: {{changed}}.",
   "diffColumns": {
    "field": "Feld",
    "change": "Änderung",
    "before": "Vorher",
    "after": "Nachher"
   },
   "emptyValue": "(leer)",
   "compare": "Vergleichen",
   "publish": "Veröffentlichen",
   "discard": "Entwurf verwerfen",
   "publishTitle": "Revision {{number}} veröffentlichen",
   "publishBody": "Durch das Veröffentlichen wird Revision {{number}} zur neuesten veröffentlichten Revision. Bereitstellungen, die der neuesten Revision folgen, führen sie ab dem nächsten Lauf aus; fixierte Bereitstellungen behalten ihre Revision.",
   "changeNote": "Änderungsnotiz",
   "changeNotePlaceholder": "Was sich geändert hat und warum (optional)",
   "publishing": "Wird veröffentlicht...",
   "published": "Revision {{number}} veröffentlicht.",
   "discardTitle": "Entwurfsrevision {{number}} verwerfen",
   "discardMessage": "Den Entwurf verwerfen? Seine Änderungen gehen verloren. Veröffentlichte Revisionen und Bereitstellungen sind nicht betroffen.",
   "discarded": "Der Entwurf wurde verworfen."
  },
  "promote": {
   "title": "Revision hochstufen",
   "intro": "Fixiert jede Bereitstellung des Agenten in der Zielumgebung auf die Revision, die in der Quellumgebung läuft. Jede Hochstufung wird protokolliert und kann zurückgesetzt werden.",
   "agent": "Agent",
   "revision": "Hochzustufende Revision",
   "revisionFromSource": "Die Revision, die in der Quellumgebung läuft",
   "source": "Von Umgebung",
   "target": "Nach Umgebung",
   "targetNext": "Nächste Umgebung ({{name}})",
   "allowSkip": "Umgebungen überspringen erlauben",
   "skipWarning": "{{target}} ist nicht die Umgebung direkt nach {{source}}.",
   "note": "Notiz",
   "notePlaceholder": "Grund für diese Hochstufung (optional)",
   "submit": "Hochstufen",
   "promoting": "Wird hochgestuft...",
   "promoted": "Nach {{target}} hochgestuft. Aktualisierte Bereitstellungen: {{deployments}}.",
   "errors": {
    "noNext": "Nach der Quellumgebung gibt es keine weitere Umgebung.",
    "sameEnvironment": "Wählen Sie eine andere Zielumgebung als die Quelle.",
    "needsSkip": "Dieses Ziel überspringt eine Umgebung. Aktivieren Sie Umgebungen überspringen erlauben, um außer der Reihe hochzustufen."
   }
  },
  "promotions": {
   "title": "Hochstufungsverlauf",
   "agentFilter": "Agent",
   "allAgents": "Alle Agenten",
   "empty": "Noch keine Hochstufungen oder Zurücksetzungen.",
   "columns": {
    "createdUtc": "Zeitpunkt",
    "kind": "Art",
    "outcome": "Ergebnis",
    "agent": "Agent",
    "revision": "Revisionsnr.",
    "environments": "Umgebungen",
    "deployments": "Bereitstellungen",
    "actor": "Durch",
    "note": "Notiz",
    "actions": "Aktionen"
   },
   "path": "{{source}} nach {{target}}",
   "pinChange": "({{from}} zu {{to}})",
   "skipped": "Umgebungen übersprungen",
   "rollback": "Zurücksetzen",
   "rollbackTitle": "Hochstufung zurücksetzen",
   "rollbackMessage": "Die Revisionsfixierungen wiederherstellen, die die von dieser Hochstufung von {{source}} nach {{target}} geänderten Bereitstellungen vorher hatten? Betroffene Bereitstellungen: {{deployments}}.",
   "rollbackNote": "Notiz zur Zurücksetzung",
   "rolledBack": "Zurückgesetzt. Die vorherigen Revisionsfixierungen sind wiederhergestellt."
  }
 },
 "resources": {
  "deployments": {
   "columns": {
    "environment": "Umgebung",
    "agentRevisionId": "Fixierte Revision"
   },
   "fields": {
    "environment": "Umgebung",
    "agentRevisionId": "Revisionsfixierung"
   },
   "hints": {
    "environment": "Hochstufungen bewegen Revisionen in der Reihenfolge des Mandanten durch die Umgebungen.",
    "agentRevisionId": "Leer folgt der neuesten veröffentlichten Revision des Agenten. Eine Fixierung hält diese Bereitstellung auf einer Revision, bis Sie oder eine Hochstufung sie ändern."
   },
   "followLatest": "Neuester Veröffentlichung folgen",
   "latest": "Neueste",
   "selectAgentFirst": "Wählen Sie zuerst einen Agenten.",
   "noPublished": "Dieser Agent hat noch keine veröffentlichte Revision.",
   "actions": {
    "promote": "Hochstufen",
    "promotions": "Hochstufungsverlauf"
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
})(de, {
 "nav": {
  "items": {
   "agentAssets": {
    "label": "Ressourcen",
    "tip": "Versionierte Systemprompts, Fähigkeiten, Referenzdateien und Dokumentvorlagen, die Agent-Revisionen fixieren."
   }
  }
 },
 "enums": {
  "agentAssetKind": {
   "SystemPrompt": "Systemprompt",
   "Skill": "Fähigkeit",
   "ReferenceFile": "Referenzdatei",
   "DocumentTemplate": "Dokumentvorlage"
  },
  "runOutcome": {
   "AssetIntegrityFailed": "Integritätsprüfung der Ressource fehlgeschlagen"
  },
  "resourceType": {
   "AgentAsset": "Agent-Ressource"
  }
 },
 "errorCodes": {
  "AssetInUse": "Agent-Revisionen fixieren diese Ressource noch. Entfernen Sie sie aus diesen Revisionen, bevor Sie sie löschen.",
  "AssetKindImmutable": "Die Art einer Ressource kann nach dem Erstellen nicht geändert werden. Erstellen Sie stattdessen eine neue Ressource.",
  "AssetStoreImmutable": "Der Artefaktspeicher einer Ressource kann nach dem Erstellen nicht geändert werden. Erstellen Sie stattdessen eine neue Ressource.",
  "AssetTemplateRequired": "Systemprompt-Ressourcen benötigen eine Prompt-Vorlage, andere Arten dürfen keine haben.",
  "AssetFileTooLarge": "Eine Datei ist größer, als die Einstellung Assets.MaxFileBytes erlaubt.",
  "AssetVersionTooLarge": "Die Dateien sind zusammen größer, als die Einstellung Assets.MaxVersionBytes erlaubt.",
  "AssetTooManyFiles": "Dieser Upload enthält mehr Dateien, als die Einstellung Assets.MaxFilesPerVersion erlaubt.",
  "AssetHasNoFiles": "Systemprompt-Ressourcen haben keine Dateien. Bearbeiten Sie stattdessen ihre Prompt-Vorlage."
 },
 "common": {
  "fieldCodes": {
   "InvalidAssetPath": "Verwenden Sie einen relativen Pfad mit Schrägstrichen, ohne Segmente \".\" oder \"..\", höchstens 512 Zeichen.",
   "MacroFormatRefused": "Office-Dateien mit Makros werden abgelehnt (Assets.AllowMacroFormats). Speichern Sie die Datei als .docx oder .dotx.",
   "AssetHasNoFiles": "Systemprompt-Ressourcen haben keine Dateien. Bearbeiten Sie stattdessen ihre Prompt-Vorlage.",
   "AssetTemplateRequired": "Wählen Sie eine Prompt-Vorlage für eine Systemprompt-Ressource."
  },
  "serverText": {
   "assetInUse": "Ressource {{asset}} ist in Revisionen dieser Agents fixiert: {{agents}}. Entfernen Sie sie zuerst aus diesen Revisionen.",
   "assetFileTooLarge": "Datei {{path}} hat {{size}} Bytes; das Limit liegt bei {{limit}} Bytes (Assets.MaxFileBytes).",
   "assetVersionTooLarge": "Diese Version ist größer als {{limit}} Bytes (Assets.MaxVersionBytes).",
   "assetTooManyFiles": "Eine Version enthält höchstens {{limit}} Dateien (Assets.MaxFilesPerVersion); dieser Upload hat {{count}}.",
   "assetHasNoFiles": "Systemprompt-Ressourcen haben keine Dateien. Bearbeiten Sie stattdessen ihre Prompt-Vorlage."
  }
 },
 "resources": {
  "agentAssets": {
   "title": "Ressourcen",
   "subtitle": "Versionierte Systemprompts, Fähigkeiten, Referenzdateien und Dokumentvorlagen, die Agent-Revisionen fixieren.",
   "add": "Ressource hinzufügen",
   "create": "Ressource erstellen",
   "edit": "Ressource bearbeiten",
   "view": "Ressourcendetails",
   "deleteTitle": "Ressource löschen",
   "emptyTitle": "Noch keine Ressourcen",
   "emptyBody": "Erstellen Sie eine Ressource, laden Sie ihre Dateien als Version hoch und fixieren Sie sie in einer Agent-Revision.",
   "columns": {
    "name": "Name",
    "kind": "Art",
    "currentVersion": "Aktuelle Version",
    "description": "Beschreibung",
    "tags": "Schlagwörter",
    "artifactStoreId": "Speicher",
    "id": "ID-Kennung",
    "createdUtc": "Erstellt"
   },
   "fields": {
    "name": "Name",
    "kind": "Art",
    "promptTemplateId": "Prompt-Vorlage",
    "artifactStoreId": "Artefaktspeicher",
    "description": "Beschreibung",
    "tags": "Schlagwörter"
   },
   "hints": {
    "kind": "Nach dem Erstellen unveränderlich. Eine Systemprompt-Ressource bezieht ihren Text aus einer Prompt-Vorlage; die anderen Arten enthalten hochgeladene Dateien.",
    "promptTemplateId": "Die Prompt-Vorlage, deren Text diese Ressource als Systemprompt des Agents liefert.",
    "artifactStoreId": "Wo die hochgeladenen Dateien gespeichert werden. Nach dem Erstellen unveränderlich. Leer lassen, um sie in der Garrison-Datenbank zu speichern."
   },
   "errors": {
    "templateRequired": "Wählen Sie die Prompt-Vorlage, die diese Systemprompt-Ressource verwendet."
   },
   "version": "Vers. {{number}}",
   "noVersion": "Keine Versionen",
   "databaseStore": "Garrison-Datenbank",
   "actions": {
    "versions": "Versionen"
   }
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "assetPins": "Ressourcen"
   }
  },
  "assets": {
   "versionsTitle": "Versionen von {{name}}",
   "current": "Aktuell",
   "noVersions": "Diese Ressource hat noch keine Versionen. Laden Sie unten ihre Dateien hoch.",
   "systemPromptNotice": "Systemprompt-Ressourcen haben keine Dateien. Ihr Text stammt aus ihrer Prompt-Vorlage; bearbeiten Sie die Vorlage, um ihn zu ändern.",
   "showFiles": "Dateien",
   "filesTitle": "Dateien der Version {{number}}",
   "noFiles": "Diese Version hat keine Dateien.",
   "preview": "Vorschau",
   "download": "Herunterladen",
   "previewTitle": "{{path}} (Version {{number}})",
   "emptyFile": "Diese Datei ist leer.",
   "versionColumns": {
    "number": "Version",
    "author": "Autor",
    "changeNote": "Änderungsnotiz",
    "totalBytes": "Gesamtgröße",
    "createdUtc": "Erstellt",
    "actions": "Aktionen"
   },
   "fileColumns": {
    "path": "Pfad",
    "mediaType": "Medientyp",
    "sizeBytes": "Größe",
    "sha256": "SHA-256-Prüfsumme",
    "actions": "Aktionen"
   },
   "uploadTitle": "Neue Version hochladen",
   "uploadHint": "Wählen Sie eine oder mehrere Dateien. Jeder Upload ist eine vollständige Version: Weggelassene Dateien werden nicht aus der aktuellen Version übernommen.",
   "files": "Dateien",
   "uploadColumns": {
    "path": "Pfad in der Ressource",
    "mediaType": "Medientyp",
    "size": "Größe",
    "actions": "Entfernen"
   },
   "mediaTypeGuessed": "Aus der Dateiendung",
   "removeFile": "Diese Datei aus dem Upload entfernen",
   "changeNote": "Änderungsnotiz",
   "changeNotePlaceholder": "Was sich in dieser Version geändert hat",
   "upload": "Version hochladen",
   "uploading": "Wird hochgeladen...",
   "uploadCreated": "Version {{number}} erstellt.",
   "uploadUnchanged": "Die Dateien entsprechen der aktuellen Version {{number}}, daher wurde keine neue Version erstellt.",
   "limitSetting": "Das Limit wird durch die Servereinstellung {{setting}} festgelegt.",
   "duplicatePath": "Eine andere Datei in diesem Upload hat denselben Pfad.",
   "pinVersion": "{{name}} Vers. {{version}}",
   "pinCurrent": "{{name}} (aktuell)",
   "pinsTitle": "Ressourcen-Fixierungen",
   "pinsSave": "Entwurf speichern",
   "pinsSaved": "Ressourcen-Fixierungen im Revisionsentwurf {{number}} gespeichert.",
   "pinsDraft": "Ändert die Ressourcen-Fixierungen des Revisionsentwurfs {{number}}. Alles andere im Entwurf bleibt unverändert.",
   "pinsNewDraft": "Es gibt keinen offenen Entwurf. Beim Speichern wird ein neuer Entwurf aus der veröffentlichten Revision {{number}} mit diesen Ressourcen-Fixierungen angelegt.",
   "pinsEmpty": "Keine Ressourcen fixiert.",
   "pinAsset": "Ressource",
   "pinVersionLabel": "Version",
   "chooseAsset": "Ressource auswählen",
   "assetOption": "{{name}} (Art: {{kind}})",
   "followCurrent": "Aktuelle Version",
   "removePin": "Diese Ressourcen-Fixierung entfernen",
   "addPin": "Ressource hinzufügen",
   "editPins": "Ressourcen",
   "pinsNewDraftButton": "Ressourcen in neuem Entwurf fixieren"
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
})(de, {
 "views": {
  "conversationDetail": {
   "tabsLabel": "Bereiche der Konversation",
   "tabs": {
    "turns": "Runden",
    "files": "Dateien"
   }
  },
  "runDetail": {
   "fileSpace": "Dateibereich",
   "openFiles": "Dateien öffnen"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "fileSpaceMountPath": "Ordner für den Dateibereich"
   },
   "hints": {
    "fileSpaceMountPath": "Ordner im Arbeitsverzeichnis des Laufs, der beim Start die gemeinsamen Dateien der Konversation erhält; Änderungen darin werden am Ende zurückgeschrieben. Standard files."
   }
  }
 },
 "errorCodes": {
  "InvalidFilePath": "Verwenden Sie einen relativen Pfad mit Schrägstrichen, ohne Segmente \".\" oder \"..\".",
  "FileTooLarge": "Die Datei ist größer, als die Einstellung FileSpaces.MaxFileBytes erlaubt.",
  "FileSpaceFull": "Der Dateibereich würde die Einstellung FileSpaces.MaxTotalBytes überschreiten.",
  "TooManyFiles": "Der Dateibereich enthält bereits so viele Dateien, wie die Einstellung FileSpaces.MaxFiles erlaubt.",
  "StaleFileUpload": "Der Lauf hält seine Zuteilung nicht mehr, daher wurden seine Dateiänderungen nicht geschrieben."
 },
 "common": {
  "fieldCodes": {
   "InvalidFilePath": "Verwenden Sie einen relativen Pfad mit Schrägstrichen, ohne Segmente \".\" oder \"..\"."
  },
  "serverText": {
   "fileSpaceFileTooLarge": "Die Datei {{path}} hat {{size}} Byte; das Limit liegt bei {{limit}} Byte (FileSpaces.MaxFileBytes).",
   "fileSpaceFull": "Der Dateibereich würde mehr als {{limit}} Byte enthalten (FileSpaces.MaxTotalBytes).",
   "fileSpaceTooManyFiles": "Der Dateibereich enthält bereits {{count}} Dateien (FileSpaces.MaxFiles).",
   "fileNotFound": "Die Datei {{path}} wurde nicht gefunden."
  }
 },
 "components": {
  "files": {
   "title": "Dateien",
   "summary": "Gemeinsame Dateien: {{count}} ({{size}})",
   "live": "Live",
   "polling": "Abfrage",
   "includeDeleted": "Gelöschte Dateien anzeigen",
   "refresh": "Aktualisieren",
   "spaceId": "Dateibereich {{id}}",
   "emptyTitle": "Noch keine Dateien",
   "emptyBody": "Dateien, die Runden in den gemeinsamen Ordner schreiben oder die Sie unten hochladen, erscheinen hier.",
   "emptyBodyDeleted": "In den gemeinsamen Ordner dieser Konversation wurde noch nichts geschrieben, auch keine später gelöschte Datei.",
   "columns": {
    "path": "Pfad",
    "currentVersion": "Version",
    "sizeBytes": "Größe",
    "mediaType": "Medientyp",
    "lastUpdateUtc": "Geändert",
    "actions": "Aktionen"
   },
   "deleted": "Gelöscht",
   "version": "Vers. {{number}}",
   "versions": "Versionen",
   "download": "Herunterladen",
   "deleteLabel": "{{path}} löschen",
   "deletedToast": "{{path}} wurde gelöscht. Die Versionen bleiben erhalten.",
   "deleteTitle": "Datei löschen",
   "confirmDelete": "{{path}} aus den gemeinsamen Dateien löschen? Spätere Runden sehen die Datei nicht mehr. Ihre Versionen bleiben erhalten und können weiter heruntergeladen werden.",
   "versionsTitle": "Versionen von {{path}}",
   "noVersions": "Diese Datei hat keine Versionen.",
   "current": "Aktuell",
   "versionColumns": {
    "number": "Version",
    "sizeBytes": "Größe",
    "mediaType": "Medientyp",
    "sha256": "SHA-256-Prüfsumme",
    "writtenBy": "Geschrieben von",
    "createdUtc": "Geschrieben",
    "actions": "Aktionen"
   },
   "preview": "Vorschau",
   "previewTitle": "{{path}} (Version {{number}})",
   "emptyFile": "Diese Version ist leer.",
   "uploadTitle": "Dateien hochladen",
   "uploadHint": "Wählen Sie eine oder mehrere Dateien und prüfen Sie ihre Pfade. Ein Pfad, der zu einer aufgeführten Datei passt, legt eine neue Version davon an. Hat eine Runde diese Datei nach dem Laden der Liste geändert, wird Ihr Upload unter einem Konfliktnamen daneben abgelegt, statt sie zu ersetzen.",
   "uploadCreated": "{{path}} als Version {{version}} hinzugefügt.",
   "uploadReplaced": "{{path}} als Version {{version}} gespeichert.",
   "uploadConflict": "{{requested}} wurde nach dem Laden der Liste geändert, daher wurde Ihr Upload als {{path}} abgelegt. Vergleichen Sie die beiden Dateien und löschen Sie die, die Sie nicht brauchen.",
   "chooseFiles": "Hochzuladende Dateien",
   "uploadColumns": {
    "path": "Pfad im gemeinsamen Ordner",
    "replaces": "Ersetzt",
    "size": "Größe",
    "actions": "Entfernen"
   },
   "replacesVersion": "Version {{version}}",
   "newFile": "Neue Datei",
   "removeFile": "Diese Datei aus dem Upload entfernen",
   "upload": "Hochladen",
   "uploading": "Wird hochgeladen...",
   "limitSetting": "Das Limit wird durch die Servereinstellung {{setting}} festgelegt."
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
})(de, {
 "nav": {
  "items": {
   "capabilities": {
    "label": "Fähigkeiten",
    "tip": "Der Fähigkeitenkatalog: Agents, MCP-Tools und integrierte Harness-Tools, die orchestrierende Agents finden und nutzen können, mit Hinweisen zu Kosten und Latenz."
   }
  }
 },
 "enums": {
  "capabilityKind": {
   "Agent": "Agent",
   "McpTool": "MCP-Tool",
   "HarnessBuiltIn": "Integriertes Harness-Tool"
  },
  "capabilityOrigin": {
   "Derived": "Abgeleitet",
   "Manual": "Manuell"
  },
  "capabilityHintStatus": {
   "Unknown": "Unbekannt",
   "Known": "Bekannt"
  },
  "runBlockedReason": {
   "NoToolWorker": "Kein Worker mit dem Tool"
  },
  "resourceType": {
   "ConversationFileSpace": "Dateibereich der Konversation",
   "Capability": "Fähigkeit"
  }
 },
 "errorCodes": {
  "InvalidJsonSchema": "Ein Schema ist kein gültiges JSON Schema. Korrigieren Sie das Eingabe- oder Ausgabeschema und speichern Sie erneut.",
  "NameConflict": "Eine andere manuelle Fähigkeit verwendet diesen Namen bereits. Wählen Sie einen anderen Namen.",
  "CapabilityDerived": "Diese Fähigkeit ist von ihrer Quelle abgeleitet und folgt ihr, daher kann sie hier weder bearbeitet noch gelöscht werden. Ändern Sie stattdessen die Quelle.",
  "InvalidTags": "Verwenden Sie höchstens 32 Schlagwörter mit je 1 bis 64 Zeichen.",
  "TooManyRequirements": "Verwenden Sie höchstens 16 Knotenlabel-Anforderungen."
 },
 "common": {
  "fieldCodes": {
   "InvalidJsonSchema": "Das ist kein gültiges JSON Schema.",
   "InvalidTags": "Verwenden Sie höchstens 32 Schlagwörter mit je 1 bis 64 Zeichen.",
   "TooManyRequirements": "Verwenden Sie höchstens 16 Knotenlabel-Anforderungen."
  },
  "serverText": {
   "capabilityDerivedEdit": "Die Fähigkeit {{name}} ist von ihrer Quelle abgeleitet und folgt ihr. Ändern Sie stattdessen die Quelle.",
   "capabilityDerivedDelete": "Die Fähigkeit {{name}} ist von ihrer Quelle abgeleitet und verschwindet mit ihr, daher kann sie nicht direkt gelöscht werden.",
   "capabilityShared": "Die Fähigkeit {{name}} gilt für alle Mandanten und stammt aus einem integrierten Harness-Profil, daher kann sie nicht geändert werden.",
   "capabilityNameConflict": "Eine manuelle Fähigkeit namens {{name}} existiert bereits.",
   "capabilitySecretsDenied": "Sie dürfen die Geheimnisse nicht verwenden, die der MCP-Server {{server}} sendet, daher wurden seine Tools nicht aufgelistet.",
   "capabilityNoStdioWorker": "Kein bereiter Worker hat die stdio-MCP-Diagnose aktiviert (GARRISON_WORKER_MCP_TESTS_ENABLED), daher konnten die Tools des stdio-Servers nicht aufgelistet werden.",
   "capabilityRefreshFailed": "Aktualisierung am {{when}} fehlgeschlagen: {{error}}",
   "capabilityMissingTools": "Erforderliche Tools fehlen: {{tools}}.",
   "capabilityProbeShadowed": "Worker prüfen {{name}} als {{probe}}, das ein anderes Harness-Profil zuerst definiert hat. Die Definition in diesem Profil wird nicht geprüft."
  }
 },
 "components": {
  "blocked": {
   "reasons": {
    "NoToolWorker": "Der Agent dieses Laufs verwendet {{tools}}, und kein bereiter Worker, der {{harness}} ausführen kann, meldet es. Installieren Sie das Tool auf einem Worker-Host, damit dessen Prüfung das Knotenlabel garrison.io/tool-{name}=true meldet, oder setzen Sie dieses Label von Hand an einem Worker."
   }
  },
  "revisions": {
   "columns": {
    "capabilities": "Fähigkeiten"
   }
  },
  "capabilities": {
   "noSource": "Manueller Eintrag",
   "shared": "Gemeinsam",
   "hintsLine": "Median {{median}}, p90 {{p90}}, {{cost}} pro Lauf",
   "hintsLineNoCost": "Median {{median}}, p90 {{p90}}, keine Kosten erfasst",
   "hintsTitle": "Hinweise zu Kosten und Latenz",
   "noCost": "Keine Kosten erfasst",
   "windowDays_one": "{{count}} Tag",
   "windowDays_other": "{{count}} Tage",
   "refreshWarning": "Die letzte Aktualisierung der Quelle dieses Eintrags ist fehlgeschlagen.",
   "requirementsTitle": "Knotenlabels, die ein Lauf benötigt",
   "noRequirements": "Keine. Läufe mit dieser Fähigkeit können auf jedem Worker laufen.",
   "noSchema": "Kein Schema",
   "fields": {
    "kind": "Art",
    "origin": "Herkunft",
    "source": "Quelle",
    "lastRefreshedUtc": "Zuletzt aktualisiert",
    "tags": "Schlagwörter",
    "id": "ID",
    "summary": "Zusammenfassung",
    "hintStatus": "Status",
    "sampleSize": "Ausgewertete Läufe",
    "medianDurationMs": "Mediane Dauer",
    "p90DurationMs": "p90-Dauer",
    "meanCostUsd": "Mittlere Kosten",
    "windowDays": "Zeitfenster",
    "computedUtc": "Berechnet",
    "inputSchema": "Eingabeschema",
    "outputSchema": "Ausgabeschema"
   },
   "refreshTitle": "Fähigkeitenkatalog aktualisieren",
   "refreshHint": "Garrison leitet die Einträge für Agents und integrierte Harness-Tools neu ab, listet die Tools jedes MCP-Servers auf (stdio-Server über einen Worker mit aktivierter stdio-Diagnose) und berechnet die Agent-Hinweise neu. Beim Auflisten erhält ein Server die Geheimnisse, die seine Vorlagen nennen, daher brauchen Sie die Berechtigung, sie zu verwenden.",
   "refreshServer": "Aufzulistende MCP-Server",
   "refreshAll": "Alle aktiven MCP-Server",
   "refreshRun": "Jetzt aktualisieren",
   "refreshing": "Wird aktualisiert...",
   "refreshDone": "Der Fähigkeitenkatalog ist auf dem neuesten Stand.",
   "refreshPartial_one": "Der Katalog wurde aktualisiert, aber {{count}} MCP-Server konnte nicht aufgelistet werden.",
   "refreshPartial_other": "Der Katalog wurde aktualisiert, aber {{count}} MCP-Server konnten nicht aufgelistet werden.",
   "refresh": {
    "agents": "Geänderte Agent-Einträge",
    "harnessBuiltIns": "Geänderte integrierte Einträge",
    "hints": "Neu berechnete Hinweise",
    "servers": "Aufgelistete MCP-Server",
    "tools": "Geschriebene Tool-Einträge",
    "removed": "Entfernte Tool-Einträge",
    "failed": "Fehlgeschlagene Server",
    "noServers": "Es wurde kein MCP-Server aufgelistet.",
    "failedBadge": "Fehlgeschlagen",
    "listedBadge": "Aufgelistet",
    "columns": {
     "server": "MCP-Server",
     "status": "Ergebnis",
     "tools": "Tool-Einträge",
     "removed": "Entfernt",
     "warned": "Mit Warnung behalten",
     "error": "Fehler"
    }
   },
   "errors": {
    "nameLength": "Verwenden Sie 1 bis {{max}} Zeichen.",
    "summaryLength": "Verwenden Sie höchstens {{max}} Zeichen.",
    "tags": "Verwenden Sie höchstens {{max}} Schlagwörter mit je 1 bis {{length}} Zeichen.",
    "requirementCount": "Verwenden Sie höchstens {{max}} Knotenlabel-Anforderungen.",
    "requirement": "Jede Anforderung braucht einen Knotenlabel-Schlüssel mit 1 bis {{max}} Zeichen.",
    "toolNeedsServer": "Wählen Sie den MCP-Server, zu dem das Tool gehört.",
    "probeCount": "Ein Harness-Profil hat höchstens {{max}} Tool-Prüfungen.",
    "probeName": "Der Tool-Name besteht aus 1 bis 63 Kleinbuchstaben, Ziffern, Punkten und Bindestrichen und beginnt mit einem Buchstaben oder einer Ziffer.",
    "probeDuplicate": "Eine andere Prüfung in diesem Profil heißt bereits {{name}}.",
    "probeExecutable": "Das Programm ist ein reiner Dateiname, der über den PATH gefunden wird (Buchstaben, Ziffern, Punkte, Unterstriche, Pluszeichen und Bindestriche), ohne Ordner.",
    "probeArgument": "Wählen Sie kein Argument oder eines von {{allowed}}.",
    "probeDescription": "Verwenden Sie höchstens {{max}} Zeichen."
   },
   "draftTitle": "Fähigkeiten",
   "draftSave": "Entwurf speichern",
   "draftSaved": "Die Fähigkeiten wurden in der Entwurfsrevision {{number}} gespeichert.",
   "draftEdit": "Ändert die Fähigkeiten der Entwurfsrevision {{number}}. Alles andere im Entwurf bleibt unverändert.",
   "draftNew": "Es gibt keinen offenen Entwurf. Beim Speichern entsteht aus der veröffentlichten Revision {{number}} ein neuer Entwurf mit diesen Fähigkeiten.",
   "draftPlacementHint": "Ein hier genanntes integriertes Harness-Tool fügt den Läufen dieses Agents sein Knotenlabel hinzu, sodass sie nur an Worker gehen, die das Tool gemeldet haben.",
   "draftEmpty": "Diese Revision verwendet keine Fähigkeiten.",
   "notInCatalog": "Nicht im Katalog",
   "removeName": "{{name}} entfernen",
   "chooseName": "Fähigkeit auswählen",
   "nameOption": "{{name}} ({{kinds}})",
   "addName": "Fähigkeit hinzufügen",
   "newDraftButton": "Fähigkeiten in einem neuen Entwurf wählen",
   "editDraft": "Fähigkeiten"
  }
 },
 "resources": {
  "capabilities": {
   "title": "Fähigkeiten",
   "subtitle": "Agents, MCP-Tools und integrierte Harness-Tools, die orchestrierende Agents finden und nutzen können, mit Hinweisen zu Kosten und Latenz.",
   "add": "Fähigkeit hinzufügen",
   "create": "Fähigkeit erstellen",
   "edit": "Fähigkeit bearbeiten",
   "view": "Details der Fähigkeit",
   "deleteTitle": "Fähigkeit löschen",
   "emptyTitle": "Noch keine Fähigkeiten",
   "emptyBody": "Veröffentlichen Sie eine Agent-Revision, registrieren Sie einen MCP-Server oder fügen Sie einem Harness-Profil eine Tool-Prüfung hinzu, und aktualisieren Sie dann. Sie können auch einen manuellen Eintrag anlegen.",
   "columns": {
    "name": "Name",
    "kind": "Art",
    "origin": "Herkunft",
    "summary": "Zusammenfassung",
    "source": "Quelle",
    "hints": "Hinweise",
    "tags": "Schlagwörter",
    "lastRefreshedUtc": "Zuletzt aktualisiert",
    "id": "ID",
    "createdUtc": "Erstellt"
   },
   "fields": {
    "name": "Name",
    "kind": "Art",
    "summary": "Zusammenfassung",
    "sourceAgentId": "Agent, für den sie steht",
    "sourceMcpServerId": "MCP-Server, zu dem sie gehört",
    "sourceToolName": "Tool-Name auf diesem Server",
    "tags": "Schlagwörter",
    "requirements": "Knotenlabels, die ein Lauf benötigt",
    "inputSchema": "Eingabeschema",
    "outputSchema": "Ausgabeschema"
   },
   "hints": {
    "kind": "Manuelle Einträge können jede Art haben, zum Beispiel ein Konvertierungsdienst, den Agents über eine Skill-Ressource erreichen.",
    "requirements": "Ein Lauf eines Agents, der diese Fähigkeit nutzt, geht nur an Worker, die jedes dieser Knotenlabels haben.",
    "sourceMcpServerId": "Optional. Ein Lauf-Token sieht einen Eintrag, der einen Server nennt, nur dann, wenn seine Bereitstellung diesen Server bindet.",
    "inputSchema": "Ein JSON Schema, zum Beispiel {\"type\": \"object\"}. Leer lassen, wenn die Fähigkeit freien Text annimmt."
   },
   "tagFilter": "Schlagwort",
   "refresh": "Aktualisieren",
   "warningBadge": "Aktualisierung fehlgeschlagen",
   "warnings_one": "{{count}} Eintrag hat seinen letzten gültigen Inhalt behalten, weil die letzte Aktualisierung seiner Quelle fehlgeschlagen ist. Öffnen Sie ihn, um den Grund zu sehen.",
   "warnings_other": "{{count}} Einträge haben ihren letzten gültigen Inhalt behalten, weil die letzte Aktualisierung ihrer Quelle fehlgeschlagen ist. Öffnen Sie einen davon, um den Grund zu sehen.",
   "noSourceOption": "Keine",
   "requirementKey": "Knotenlabel",
   "requirementValue": "Wert"
  },
  "harnessProfiles": {
   "fields": {
    "toolProbes": "Tool-Prüfungen",
    "probeName": "Tool-Name",
    "probeExecutable": "Programm",
    "probeArgument": "Aufrufargument",
    "probeDescription": "Beschreibung"
   },
   "columns": {
    "toolProbes": "Tool-Prüfungen"
   },
   "hints": {
    "toolProbes": "Tools, die diese Harness nutzen kann, wenn der Worker-Host sie hat. Worker führen jede Prüfung vor der Registrierung aus und melden die Tools, die antworten, als Knotenlabels garrison.io/tool-{name}=true."
   },
   "addToolProbe": "Tool-Prüfung hinzufügen",
   "probeNoArgument": "Kein Argument"
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
})(de, {
 "enums": {
  "fanOutGroupStatus": {
   "Running": "Läuft",
   "Joined": "Zusammengeführt",
   "TimedOut": "Zeit überschritten",
   "BudgetExceeded": "Budget überschritten",
   "Cancelled": "Abgebrochen"
  },
  "fanOutJoinPolicy": {
   "All": "Alle",
   "Any": "Beliebiges",
   "Quorum": "Quorum"
  },
  "resourceType": {
   "FanOutGroup": "Fan-out-Gruppe"
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "Fan-out-Gruppe"
  }
 },
 "components": {
  "fanOut": {
   "group": "Fan-out-Gruppe",
   "groupTitle": "Fan-out-Gruppe {{id}}",
   "otherChildren": "Weitere Unterläufe",
   "detailsUnavailable": "Die Details der Gruppe konnten nicht geladen werden, daher sind nur ihre Mitgliedsläufe aufgeführt.",
   "policy": "Zusammenführungsregel",
   "quorumPolicy": "{{policy}}: {{quorum}} von {{total}}",
   "progress": "Fortschritt",
   "progressValue": "{{finished}} von {{total}} beendet, {{succeeded}} erfolgreich",
   "cost": "Kosten",
   "tokens": "Token",
   "usedOf": "{{used}} von {{limit}}",
   "noLimit": "{{used}} (ohne Limit)",
   "deadline": "Frist",
   "noDeadline": "Keine",
   "started": "Gestartet",
   "completed": "Beendet",
   "pending": "Läuft noch: {{labels}}",
   "failed": "Nicht erfolgreich: {{labels}}",
   "live": "Live",
   "polling": "Abfrage",
   "cancel": "Gruppe abbrechen",
   "cancelTitle": "Fan-out-Gruppe abbrechen",
   "confirmCancel": "Fan-out-Gruppe {{id}} abbrechen? Noch laufende Mitglieder werden abgebrochen, und der übergeordnete Lauf sieht die Gruppe als abgebrochen.",
   "cancelledToast": "Fan-out-Gruppe {{id}} wurde abgebrochen.",
   "columns": {
    "label": "Bezeichnung",
    "agent": "Agent",
    "status": "Status",
    "costUsd": "Kosten",
    "tokens": "Token",
    "run": "Lauf"
   }
  }
 },
 "common": {
  "serverText": {
   "fanOutParentEnded": "Der übergeordnete Lauf ist beendet oder wurde abgebrochen.",
   "fanOutCostExceeded": "Die Mitglieder haben {{cost}} USD ausgegeben, mehr als das Budget von {{budget}} USD.",
   "fanOutTokensExceeded": "Die Mitglieder haben {{tokens}} Token verbraucht, mehr als das Budget von {{budget}}.",
   "fanOutTimedOut": "Das Zeitlimit der Gruppe von {{seconds}} Sekunden ist abgelaufen, während noch {{running}} Mitglieder liefen.",
   "fanOutAnySucceeded": "Ein Mitglied war erfolgreich.",
   "fanOutNoneSucceeded": "Alle Mitglieder sind beendet, keines war erfolgreich.",
   "fanOutQuorumMet": "{{succeeded}} Mitglieder waren erfolgreich, damit ist das Quorum von {{quorum}} erreicht.",
   "fanOutQuorumUnreachable": "Zu viele Mitglieder sind gescheitert, um das Quorum von {{quorum}} noch zu erreichen.",
   "fanOutAllFinished": "Alle Mitglieder sind beendet.",
   "fanOutCancelledByTool": "Vom übergeordneten Lauf mit garrison_cancel_fan_out abgebrochen.",
   "fanOutCancelledBy": "Abgebrochen von {{who}}."
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
})(de, {
 "nav": {
  "items": {
   "apps": {
    "label": "Apps",
    "tip": "Agentische Apps: Gruppen von Agenten hinter einer Chat-Oberfläche für Endbenutzer, mit Aufrufgraph, Delegation, Revisionen und teilbarer URL."
   }
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "Benutzer des Mandanten",
   "AppUsers": "App-Benutzer",
   "Anonymous": "Anonym"
  },
  "resourceType": {
   "AgenticApp": "Agentische App"
  }
 },
 "errorCodes": {
  "AppSlugTaken": "Eine andere App verwendet diesen URL-Slug bereits. Slugs sind im gesamten Cluster eindeutig, wählen Sie daher einen anderen.",
  "NoPublishedRevision": "Es gibt keine veröffentlichte Revision, die verwendet werden kann. Veröffentlichen Sie zuerst eine.",
  "AgentInUse": "Dieser Agent ist Mitglied einer agentischen App. Entfernen Sie ihn zuerst aus der App."
 },
 "common": {
  "fieldCodes": {
   "InvalidName": "Verwenden Sie 1 bis 64 Kleinbuchstaben, Ziffern und Bindestriche, beginnend und endend mit einem Buchstaben oder einer Ziffer.",
   "InvalidSlug": "Verwenden Sie 2 bis 63 Kleinbuchstaben, Ziffern und Bindestriche, beginnend mit einem Buchstaben oder einer Ziffer.",
   "UnknownAgent": "Diesen Agenten gibt es in diesem Mandanten nicht.",
   "DuplicateMember": "Jeder Agent kann nur einmal Mitglied sein.",
   "EntryNotMember": "Der Einstiegsagent muss eines der Mitglieder sein.",
   "EdgeNotMember": "Beide Enden eines Aufrufs müssen Mitglieder der App sein.",
   "SelfEdge": "Ein Mitglied kann sich nicht selbst aufrufen.",
   "AppGraphCycle": "Die Aufrufe zwischen den Mitgliedern bilden einen Zyklus. Entfernen Sie einen der Aufrufe in der Schleife.",
   "UnreachableMember": "Jedes Mitglied muss vom Einstiegsagenten über Aufrufe erreichbar sein.",
   "UnreachableMemberNamed": "Der Einstiegsagent kann diese Mitglieder nicht über Aufrufe erreichen: {{names}}. Fügen Sie jeweils einen Aufruf hinzu oder entfernen Sie sie.",
   "UnknownEnvironment": "Diese Umgebung gibt es im Mandanten nicht.",
   "InvalidEntryDeployment": "Wählen Sie eine Bereitstellung des Einstiegsagenten in dieser Umgebung.",
   "DuplicateEnvironment": "Führen Sie jede Umgebung nur einmal auf.",
   "InvalidColor": "Verwenden Sie eine Farbe im Format #RRGGBB, zum Beispiel #1F6FEB.",
   "UnknownAsset": "Diese Agent-Ressource gibt es in diesem Mandanten nicht.",
   "Required": "Dieses Feld ist erforderlich.",
   "TooMany": "Hier sind zu viele Einträge."
  },
  "serverText": {
   "appNameConflict": "Eine App namens {{name}} existiert bereits.",
   "appSlugTaken": "Der URL-Slug {{slug}} ist vergeben. Slugs sind im gesamten Cluster eindeutig, wählen Sie daher einen anderen.",
   "appNoPublishedRevision": "Die App {{name}} hat keine veröffentlichte Revision zum Hochstufen.",
   "appMemberNotPublished": "Das Mitglied {{name}} hat keine veröffentlichte Revision zum Fixieren. Veröffentlichen Sie zuerst eine.",
   "appRevisionPublished": "Revision {{number}} der App {{name}} ist bereits veröffentlicht.",
   "appNoTargetDeployments": "Das Mitglied {{member}} hat keine Bereitstellung in der Umgebung {{environment}}. Erstellen Sie dort zuerst eine. Es wurde nichts hochgestuft.",
   "agentInApps": "Der Agent {{agent}} ist Mitglied von {{apps}}. Entfernen Sie ihn zuerst aus der App."
  }
 },
 "components": {
  "form": {
   "pickColor": "Farbe für {{field}} auswählen"
  },
  "apps": {
   "graph": {
    "empty": "Fügen Sie Mitglieder hinzu, um den Graphen der App zu sehen.",
    "summary": "App-Graph mit {{members}} Mitgliedern und {{edges}} Aufrufen",
    "edgeFanOut": "{{caller}} ruft {{callee}} auf, auch mehrfach gleichzeitig",
    "edgeSingle": "{{caller}} ruft {{callee}} auf, jeweils ein Aufruf",
    "entryNode": "{{name}}, der Einstiegsagent",
    "unreachableNode": "{{name}}, den der Einstiegsagent nicht erreichen kann",
    "entry": "Einstiegsagent",
    "unreachable": "nicht erreichbar",
    "legendFanOut": "Parallele Aufrufe erlaubt",
    "legendSingle": "Jeweils ein Aufruf"
   },
   "share": {
    "noSlug": "Geben Sie der App einen Namen oder einen URL-Slug, um ihren Link zu erhalten.",
    "open": "Öffnen",
    "copy": "App-URL kopieren",
    "inactive": "Die App ist inaktiv, daher funktioniert der Link erst, wenn Sie sie wieder aktivieren.",
    "signIn": {
     "TenantUsers": "Jeder aktive Benutzer dieses Mandanten kann sich anmelden.",
     "AppUsers": "Nur Benutzer mit der Rolle AppUser für diese App können sich anmelden.",
     "Anonymous": "Jeder mit dem Link kann die App ohne Anmeldung nutzen. Angemeldete Benutzer funktionieren weiterhin.",
     "AnonymousDisabled": "Anonym ist gewählt, aber nicht aktiviert. Niemand kommt ohne Anmeldung hinein, und nur Benutzer des Mandanten mit Zugriff können sich anmelden."
    }
   },
   "delegation": {
    "title": "Delegation aus dem App-Graphen",
    "intro": "Die Aufrufe der App sind ihre Delegationsrichtlinie. Jedes Mitglied sollte genau die Mitglieder erlauben, die es aufruft, mit einer maximalen Tiefe, die die längste Kette darunter abdeckt. Mitglieder, deren veröffentlichte Revision etwas anderes vorgibt, weichen ab.",
    "apply": "Entwürfe schreiben",
    "applying": "Entwürfe werden geschrieben...",
    "applied": "{{drafts}} Entwurfsrevisionen geschrieben; {{skipped}} Mitglieder übersprungen.",
    "appliedSummary": "{{drafts}} Entwurfsrevisionen geschrieben, nichts veröffentlicht. {{skipped}} Mitglieder wurden übersprungen. Prüfen und veröffentlichen Sie die Entwürfe auf dem Tab Revisionen jedes Agenten.",
    "drifting_one": "Die veröffentlichte Delegation von {{count}} Mitglied weicht vom Graphen ab.",
    "drifting_other": "Die veröffentlichte Delegation von {{count}} Mitgliedern weicht vom Graphen ab.",
    "inSync": "Die veröffentlichte Delegation jedes Mitglieds entspricht dem Graphen.",
    "empty": "Diese App hat keine Mitglieder.",
    "notPublished": "Nicht veröffentlicht",
    "drift": "Abweichung",
    "inSyncBadge": "Synchron",
    "draftConflict": "Entwurfskonflikt",
    "draft": "Entwurf {{number}}",
    "review": "Die Entwürfe sind noch nicht live. Öffnen Sie jeden Agenten, prüfen Sie den Entwurf auf seinem Tab Revisionen und veröffentlichen Sie ihn.",
    "columns": {
     "member": "Mitglied",
     "desiredMode": "Modus laut Graph",
     "desiredAllowList": "Zulassungsliste laut Graph",
     "desiredMaxDepth": "Tiefe laut Graph",
     "publishedMode": "Veröffentlichter Modus",
     "publishedAllowList": "Veröffentlichte Zulassungsliste",
     "publishedMaxDepth": "Veröffentlichte Tiefe",
     "status": "Status"
    }
   },
   "revisions": {
    "title": "App-Revisionen",
    "intro": "Eine App-Revision fixiert die neueste veröffentlichte Revision jedes Mitglieds und kopiert die Aufrufe zwischen ihnen. Veröffentlichen Sie sie und stufen Sie sie dann hoch, um alle Mitglieder gemeinsam in die nächste Umgebung zu bringen.",
    "changeNote": "Änderungsnotiz",
    "changeNotePlaceholder": "Was sich seit der letzten Revision geändert hat",
    "take": "Revision erstellen",
    "taking": "Wird erstellt...",
    "taken": "App-Revision {{number}} erstellt.",
    "published": "App-Revision {{number}} veröffentlicht.",
    "empty": "Noch keine App-Revisionen. Erstellen Sie eine, sobald jedes Mitglied eine veröffentlichte Revision hat.",
    "promote": "Hochstufen",
    "publish": "Veröffentlichen",
    "publishTitle": "App-Revision {{number}} veröffentlichen",
    "publishConfirm": "Revision {{number}} von {{name}} veröffentlichen? Eine veröffentlichte Revision kann sich nicht mehr ändern und wird standardmäßig für Hochstufungen verwendet.",
    "pin": "{{name}}, Revision {{number}}",
    "columns": {
     "number": "Revision",
     "state": "Zustand",
     "members": "Fixierte Mitglieder",
     "edges": "Aufrufe",
     "author": "Autor",
     "changeNote": "Änderungsnotiz",
     "publishedUtc": "Veröffentlicht",
     "actions": "Aktionen"
    }
   },
   "promote": {
    "title": "App hochstufen",
    "intro": "Die fixierte Revision jedes Mitglieds geht in einem Schritt an jede Bereitstellung dieses Mitglieds in der Zielumgebung. Hat ein Mitglied dort keine Bereitstellung, wird nichts übernommen.",
    "revision": "App-Revision",
    "latestRevision": "Neueste veröffentlichte",
    "promoted": "Die App wurde nach {{target}} hochgestuft: {{deployments}} Bereitstellungen aktualisiert.",
    "denied": "Sie dürfen nicht nach {{target}} hochstufen. Das Hochstufen erfordert Ausführen auf Hochstufung für die Zielumgebung."
   }
  }
 },
 "resources": {
  "apps": {
   "title": "Apps",
   "subtitle": "Gruppen von Agenten hinter einer Chat-Oberfläche für Endbenutzer. Der Einstiegsagent spricht mit Menschen und ruft die anderen Mitglieder entlang der Aufrufe der App auf.",
   "add": "App hinzufügen",
   "create": "App erstellen",
   "edit": "App bearbeiten",
   "view": "App-Details",
   "deleteTitle": "App löschen",
   "emptyTitle": "Noch keine Apps",
   "emptyBody": "Erstellen Sie eine App aus vorhandenen Agenten: Wählen Sie die Mitglieder, den Einstiegsagenten, der mit Menschen spricht, und wer wen aufruft.",
   "columns": {
    "name": "Name",
    "url": "App-URL",
    "entryAgentId": "Einstiegsagent",
    "members": "Mitglieder",
    "liveEnvironment": "Live-Umgebung",
    "authMode": "Anmeldung",
    "active": "Status",
    "description": "Beschreibung",
    "id": "ID",
    "lastUpdateUtc": "Aktualisiert",
    "createdUtc": "Erstellt"
   },
   "fields": {
    "name": "Name",
    "slug": "URL-Slug",
    "description": "Beschreibung",
    "active": "Aktiv",
    "members": "Mitglieder",
    "membersItems": {
     "agentId": "Agent",
     "role": "Rolle"
    },
    "entryAgentId": "Einstiegsagent",
    "edges": "Aufrufe zwischen Mitgliedern",
    "edgesItems": {
     "callerAgentId": "Aufrufer",
     "calleeAgentId": "Aufgerufener",
     "fanOutAllowed": "Parallele Aufrufe erlaubt"
    },
    "graph": "Graph",
    "environments": "Einstiegsbereitstellung pro Umgebung",
    "environmentsItems": {
     "environment": "Umgebung",
     "deploymentId": "Einstiegsbereitstellung"
    },
    "liveEnvironment": "Live-Umgebung",
    "authMode": "Wer die App nutzen darf",
    "anonymousEnabled": "Anonyme Nutzung erlauben",
    "showOperatorDetail": "Werkzeugaufrufe und Denkprozess für Endbenutzer anzeigen",
    "share": "Teilbarer Link",
    "displayName": "Anzeigename",
    "logoAssetId": "Logo",
    "primaryColor": "Primärfarbe",
    "accentColor": "Akzentfarbe",
    "welcomeText": "Begrüßungstext"
   },
   "hints": {
    "slug": "Die App liegt unter /apps/{slug}/. Leer lassen, um den Namen zu verwenden. Slugs sind im gesamten Cluster eindeutig.",
    "members": "Die Agenten in der App. Die Rolle ist eine kurze Notiz dazu, was jeder tut.",
    "entryAgentId": "Das Mitglied, das mit Endbenutzern spricht. Jedes andere Mitglied muss von ihm aus erreichbar sein.",
    "edges": "Wer wen aufrufen darf. Die Aufrufe dürfen keine Schleife bilden und werden zur Delegationsrichtlinie jedes Mitglieds.",
    "environments": "Die Bereitstellung des Einstiegsagenten, die die App in jeder Umgebung verwendet. Ohne Angabe verwendet die App dort die erste aktive Bereitstellung des Einstiegsagenten in Namensreihenfolge.",
    "liveEnvironment": "Die Umgebung, mit der die App-Oberfläche spricht.",
    "anonymousEnabled": "Erforderlich für die anonyme Anmeldung. Anonyme Sitzungen sind kurz und ratenbegrenzt.",
    "showOperatorDetail": "Endbenutzer sehen immer Antworten, Ergebnisse und Fehler. Aktivieren Sie dies, um auch Werkzeugaufrufe, Denkprozess und Fortschritt anzuzeigen.",
    "logoAssetId": "Das erste Bild in der aktuellen Version der Ressource.",
    "welcomeText": "Wird Endbenutzern angezeigt, bevor sie ihre erste Nachricht senden."
   },
   "steps": {
    "general": "App",
    "members": "Mitglieder und Aufrufe",
    "environments": "Umgebungen",
    "access": "Anmeldung und Link",
    "branding": "Erscheinungsbild"
   },
   "actions": {
    "delegation": "Delegation",
    "revisions": "Revisionen und Hochstufung"
   },
   "errors": {
    "nameTaken": "Eine andere App in diesem Mandanten verwendet diesen Namen bereits."
   },
   "addMember": "Mitglied hinzufügen",
   "addEdge": "Aufruf hinzufügen",
   "addEnvironment": "Umgebung hinzufügen",
   "chooseAgent": "Agenten wählen",
   "chooseEntry": "Mitglied wählen",
   "rolePlaceholder": "Was dieses Mitglied tut",
   "noEntryDeployment": "Erste aktive Bereitstellung",
   "noLogo": "Kein Logo",
   "displayNamePlaceholder": "Wird in der Kopfzeile der App angezeigt"
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
})(de, {
 "nav": {
  "items": {
   "studio": {
    "label": "Studio",
    "tip": "Agenten-Studio: Entwerfen Sie Agenten und Apps in Entwürfen mit dem Agenten-Architekten, testen Sie sie im Testbereich und beantragen Sie das Anwenden eines Entwurfs."
   }
  }
 },
 "enums": {
  "resourceType": {
   "StudioDraft": "Studio-Entwurf"
  },
  "approvalKind": {
   "DraftApply": "Entwurf anwenden"
  },
  "studioDraftStatus": {
   "Open": "Offen",
   "PendingApproval": "Freigabe ausstehend",
   "Applied": "Angewendet",
   "Discarded": "Verworfen"
  },
  "studioDraftOperation": {
   "Upsert": "Erstellen oder aktualisieren",
   "Delete": "Löschen"
  },
  "studioDiffChange": {
   "Create": "Erstellen",
   "Update": "Aktualisieren",
   "Delete": "Löschen",
   "Unchanged": "Unverändert",
   "Failed": "Fehlgeschlagen"
  }
 },
 "errorCodes": {
  "DraftVersionConflict": "Der Entwurf hat sich geändert, seit Sie ihn gelesen haben. Lesen Sie ihn erneut und versuchen Sie es noch einmal.",
  "DraftNotOpen": "Der Entwurf ist nicht offen und kann daher nicht geändert werden. Nur ein offener Entwurf nimmt Änderungen an.",
  "DraftStale": "Die Live-Konfiguration hat sich geändert, nachdem der Entwurf darauf aufgebaut wurde. Bringen Sie die veralteten Elemente auf den neuen Stand und beantragen Sie das Anwenden erneut.",
  "DraftInvalid": "Der Entwurf enthält Dokumente, die die Validierung nicht bestehen. Korrigieren Sie zuerst die als fehlgeschlagen markierten Elemente.",
  "DraftEmpty": "Der Entwurf enthält keine Elemente, es gibt also nichts anzuwenden.",
  "ApproverLacksPermission": "Sie dürfen diesen Entwurf nicht zulassen: Dafür sind Create auf Manifest und Delete auf jeder Art nötig, die der Entwurf löscht.",
  "AgentNotLive": "Dieser Agent ist neu in diesem Entwurf. Wenden Sie den Entwurf an, bevor Sie den Agenten im Testbereich ausprobieren.",
  "NotAnArchitectDeployment": "Nur Architekten-Bereitstellungen erhalten einen Architekten-Prompt: Bereitstellungen von agent-architect oder mit Entwurfszugriff.",
  "InvalidArchitectPrompt": "Dieser Prompt kann kein Architekten-Prompt sein. Wählen Sie eine System-Vorlage dieses Mandanten.",
  "PromptTemplateInUse": "Diese Prompt-Vorlage ist an Bereitstellungen gebunden. Stellen Sie diese zuerst auf eine andere Vorlage um.",
  "ReservedEnvironment": "Die Entwurfsumgebung ist für den Testbereich reserviert.",
  "NoDeploymentInEnvironment": "Der Agent hat in dieser Umgebung keine Bereitstellung."
 },
 "views": {
  "studio": {
   "title": "Studio",
   "subtitle": "Entwerfen Sie Agenten und Apps in Entwürfen. An der Live-Konfiguration ändert sich nichts, bis eine Person das Anwenden eines Entwurfs freigibt.",
   "newDraft": "Neuer Entwurf",
   "refresh": "Aktualisieren",
   "search": "Titel durchsuchen",
   "scopeLabel": "Wessen Entwürfe",
   "scopes": {
    "mine": "Meine",
    "all": "Alle"
   },
   "statusLabel": "Status",
   "columns": {
    "title": "Titel",
    "status": "Status",
    "owner": "Besitzer",
    "targetApp": "Ziel-App",
    "items": "Elemente",
    "version": "Version",
    "updated": "Aktualisiert"
   },
   "open": "Öffnen",
   "discard": "Verwerfen",
   "discardTitle": "Entwurf verwerfen",
   "discardMessage": "{{title}} verwerfen? Ein verworfener Entwurf kann nicht mehr geändert oder angewendet werden.",
   "discardPendingMessage": "{{title}} verwerfen? Die Freigabe zum Anwenden wird abgebrochen, und der Entwurf kann nicht mehr geändert oder angewendet werden.",
   "discarded": "{{title}} verworfen.",
   "emptyTitle": "Keine Entwürfe",
   "emptyBody": "Beginnen Sie einen Entwurf, leer oder aus einer bestehenden App, und gestalten Sie ihn mit dem Agenten-Architekten.",
   "emptyFiltered": "Keine Entwürfe entsprechen diesen Filtern.",
   "untitled": "Unbenannter Entwurf"
  },
  "studioDraft": {
   "title": "Studio-Entwurf",
   "notFoundTitle": "Entwurf nicht gefunden",
   "notFoundBody": "Der Entwurf existiert nicht, oder Sie dürfen ihn nicht lesen.",
   "back": "Alle Entwürfe",
   "version": "Version {{version}}",
   "live": "Live",
   "polling": "Abfrage",
   "architect": "Architekt",
   "tabsLabel": "Entwurfsarbeitsbereich",
   "tabs": {
    "architect": "Architekt",
    "items": "Elemente",
    "graph": "Graph",
    "apply": "Vergleichen und anwenden",
    "playground": "Testbereich",
    "preview": "Kompiliervorschau",
    "prompts": "Architekten-Prompt"
   },
   "notOpen": {
    "PendingApproval": "Dieser Entwurf wartet auf eine Entscheidung über das Anwenden und kann daher nicht geändert werden. Lehnen Sie die Freigabe ab oder verwerfen Sie den Entwurf, um ihn wieder zu ändern.",
    "Applied": "Dieser Entwurf wurde auf die Live-Konfiguration angewendet und kann nicht mehr geändert werden. Beginnen Sie für weitere Änderungen einen neuen Entwurf.",
    "Discarded": "Dieser Entwurf wurde verworfen und kann nicht mehr geändert werden.",
    "other": "Dieser Entwurf kann gerade nicht geändert werden."
   },
   "liveNotice": "Der Entwurf ist jetzt bei Version {{version}} ({{status}}).",
   "liveChanged": "Geändert: {{items}}.",
   "removedTag": "entfernt",
   "dismissNotice": "Ausblenden"
  }
 },
 "components": {
  "studio": {
   "newDraft": {
    "title": "Neuer Entwurf",
    "intro": "Ein Entwurf enthält die Manifest-Dokumente, die Sie und der Agenten-Architekt bearbeiten. Beginnen Sie leer oder mit einer bestehenden App samt allem, worauf sie verweist.",
    "titleField": "Titel",
    "titlePlaceholder": "Recherche-App mit einem Autor",
    "fromApp": "Von App ausgehen",
    "emptyDraft": "Leerer Entwurf",
    "fromAppHint": "Die App, ihre Mitglieder, deren Bereitstellungen, Prompts und Assets werden zu Elementen. Jedes merkt sich die Live-Version, von der es ausging, damit das Studio spätere Änderungen bemerkt.",
    "create": "Entwurf erstellen",
    "creating": "Wird erstellt...",
    "created": "Entwurf {{title}} begonnen."
   },
   "architect": {
    "title": "Neuer Architekt",
    "intro": "Der Agenten-Architekt entwirft Agenten und Apps in Ihren Entwürfen. Geben Sie ihm eine Bereitstellung: ein Harness-Profil, ein Modell und den Prompt, mit dem er arbeitet. Er bearbeitet nur Ihre Entwürfe und wendet sie nie an.",
    "name": "Name der Bereitstellung",
    "harnessProfile": "Harness-Profil",
    "chooseProfile": "Harness-Profil wählen",
    "model": "Modell",
    "modelHint": "Leer lassen, um das Standardmodell des Harness-Profils zu verwenden.",
    "prompt": "Architekten-Prompt",
    "defaultPrompt": "{{name}} (Standard)",
    "preview": "Prompt-Vorschau",
    "previewEmpty": "Wählen Sie einen Prompt, um ihn gerendert zu sehen.",
    "cloneLink": "Diesen Prompt klonen, um ihn zu ändern",
    "noAgent": "Dieser Mandant hat keinen Agenten namens {{name}}, daher kann kein Architekt erstellt werden. Wenden Sie sich an einen Administrator.",
    "create": "Architekt erstellen",
    "creating": "Wird erstellt...",
    "created": "Architekt {{name}} erstellt."
   },
   "chat": {
    "title": "Architekt",
    "architect": "Architekten-Bereitstellung",
    "chooseArchitect": "Architekten wählen",
    "newArchitect": "Neuer Architekt",
    "noArchitect": "Es gibt noch keine Architekten-Bereitstellung. Erstellen Sie eine, um mit dem Agenten-Architekten zu entwerfen.",
    "openConversation": "Konversation öffnen",
    "newConversation": "Neue Konversation",
    "you": "Sie",
    "architectSays": "Architekt",
    "openRun": "Lauf",
    "thinking": "Arbeitet...",
    "empty": "Sagen Sie dem Architekten, was er bauen soll. Die erste Nachricht teilt ihm mit, in welchem Entwurf er arbeitet.",
    "pickFirst": "Wählen oder erstellen Sie einen Architekten, um zu beginnen.",
    "message": "Nachricht",
    "placeholder": "Entwirf eine Recherche-App: ein Planer, der an zwei Rechercheure und einen Autor verteilt.",
    "firstHint": "Beginnt eine Konversation mit diesem Architekten über diesen Entwurf.",
    "continueHint": "Setzt die Konversation fort. Ctrl+Enter oder Cmd+Enter sendet.",
    "send": "Senden"
   },
   "items": {
    "title": "Elemente",
    "titleCount": "Elemente ({{total}})",
    "add": "Element hinzufügen",
    "addConfirm": "Editor öffnen",
    "columns": {
     "kind": "Art",
     "name": "Name",
     "operation": "Vorgang",
     "stale": "Veraltet",
     "updated": "Aktualisiert"
    },
    "stale": "Veraltet",
    "empty": "Noch keine Elemente. Fügen Sie eines hinzu oder fragen Sie den Architekten.",
    "remove": "Entfernen",
    "removeTitle": "Element entfernen",
    "removeMessage": "{{item}} aus dem Entwurf entfernen? Die Live-Konfiguration ändert sich nicht.",
    "removed": "{{item}} entfernt.",
    "saved": "{{item}} gespeichert. Der Entwurf ist bei Version {{version}}.",
    "editorTitle": "{{item}} bearbeiten",
    "newEditorTitle": "Neues Element {{item}}",
    "document": "Manifest-Dokument",
    "versionHint": "Beim Speichern wird Version {{version}} gesendet, die Sie gelesen haben. Hat sich der Entwurf seitdem geändert, wird das Speichern abgelehnt und Ihr Text bleibt hier.",
    "unsaved": "Ungespeicherte Änderungen",
    "errors": {
     "name": "Verwenden Sie Buchstaben, Ziffern, Punkte, Schrägstriche und Bindestriche, beginnend mit einem Buchstaben oder einer Ziffer.",
     "exists": "Der Entwurf enthält bereits {{kind}}/{{name}}.",
     "deleteKind": "Nur Elemente vom Typ Agent, Deployment, Pipeline und AgenticApp können gelöscht werden, nicht {{kind}}."
    },
    "conflict": {
     "title": "Der Entwurf hat sich während Ihrer Bearbeitung geändert: Aus Version {{from}} ist jetzt {{to}} geworden.",
     "added": "Hinzugefügt: {{items}}",
     "updated": "Bearbeitet: {{items}}",
     "removed": "Entfernt: {{items}}",
     "status": "Sein Status ist jetzt {{status}}.",
     "layout": "Nur das Graph-Layout hat sich geändert.",
     "mine": "Das Element, das Sie bearbeiten, hat sich ebenfalls geändert. Vergleichen Sie Ihren Text mit der neuen Version, bevor Sie erneut speichern.",
     "retry": "Ihr Text ist noch im Editor. Speichern Sie erneut, um ihn auf die neue Version anzuwenden.",
     "dismiss": "Ausblenden"
    }
   },
   "graph": {
    "title": "Graph",
    "empty": "Der Entwurf enthält noch keine Apps oder Agenten zum Zeichnen.",
    "depth": "Tiefe {{depth}}",
    "entryAgent": "Einstiegsagent: {{name}}",
    "deleted": "Gelöscht",
    "inDraft": "Im Entwurf",
    "loose": "Agenten ohne App",
    "capabilities": "Fähigkeiten: {{list}}",
    "legend": "Jeder Aufruf ist mit der benötigten Delegationstiefe beschriftet. Eine durchgezogene Linie erlaubt parallele Aufrufe, eine gestrichelte nur einen Aufruf zur Zeit. Fähigkeiten stehen unter dem Namen eines Agenten."
   },
   "diff": {
    "title": "Vergleichen und anwenden",
    "refresh": "Vergleich aktualisieren",
    "validate": "Validieren",
    "validating": "Wird validiert...",
    "requestApply": "Anwenden beantragen",
    "requesting": "Wird beantragt...",
    "requested": "Anwenden beantragt. Eine Person, die Manifeste anwenden darf, entscheidet darüber.",
    "valid": "Gültig: {{create}} zu erstellen, {{update}} zu aktualisieren, {{delete}} zu löschen, {{unchanged}} unverändert.",
    "invalid": "Ungültig: {{failed}} fehlgeschlagen und {{stale}} veraltet. Geplant: {{create}} zu erstellen, {{update}} zu aktualisieren, {{delete}} zu löschen, {{unchanged}} unverändert.",
    "validOk": "Der Entwurf ist gültig.",
    "validFailed": "Der Entwurf ist ungültig. Siehe die als fehlgeschlagen oder veraltet markierten Elemente.",
    "empty": "Der Entwurf enthält keine Elemente zum Vergleichen.",
    "columns": {
     "item": "Element",
     "change": "Änderung",
     "details": "Details"
    },
    "none": "(keine)",
    "approval": "Freigabe zum Anwenden",
    "allow": "Zulassen",
    "deny": "Ablehnen",
    "allowed": "Zugelassen. Der Entwurf wird angewendet.",
    "denied": "Abgelehnt. Der Entwurf ist wieder offen.",
    "reason": "Begründung",
    "reasonPlaceholder": "Optional, wird mit der Entscheidung gespeichert",
    "waiting": "Wartet auf eine Person, die Freigaben entscheiden und Manifeste anwenden darf.",
    "applied": "Als Manifest-Anwendung {{id}} angewendet."
   },
   "playground": {
    "title": "Testbereich",
    "intro": "Jede Runde speichert das Dokument des Agenten aus dem Entwurf als seine Entwurfsrevision und führt es auf einer temporären Testbereich-Bereitstellung aus. Nichts wird veröffentlicht, und die Live-Konfiguration ändert sich nicht.",
    "agent": "Agent",
    "defaultAgent": "Einstiegsagent ({{name}})",
    "defaultAgentShort": "Einstiegsagent",
    "input": "Eingabe",
    "answer": "Antwort",
    "placeholder": "Was soll der Agent tun?",
    "firstHint": "Beginnt eine Konversation im Testbereich.",
    "continueHint": "Setzt die Konversation im Testbereich fort.",
    "send": "Runde ausführen",
    "turn": "Runde {{number}}, {{agent}}",
    "openRun": "Laufdetails",
    "conversation": "Konversation",
    "export": "Protokoll herunterladen",
    "reset": "Neue Konversation",
    "empty": "Noch keine Runden.",
    "exportDraft": "Entwurf",
    "exportTurn": "Runde",
    "exportRun": "Lauf"
   },
   "preview": {
    "title": "Kompiliervorschau",
    "intro": "Sehen Sie vor der Bereitstellung, womit ein Lauf starten würde: die Befehlszeile, wo Assets abgelegt werden, und das Einhängen des Dateibereichs. Geheime Werte werden geschwärzt.",
    "deployment": "Bereitstellung",
    "chooseDeployment": "Bereitstellung wählen",
    "revision": "Agentenrevision",
    "deploymentRevision": "Die eigene Revision der Bereitstellung",
    "revisionOption": "Revision {{number}} ({{state}})",
    "environment": "Umgebung",
    "deploymentEnvironment": "Die Umgebung der Bereitstellung",
    "input": "Beispieleingabe",
    "compiled": "{{deployment}} mit {{revision}} kompiliert.",
    "assets": "Abgelegte Assets ({{total}})",
    "noAssets": "Die Revision legt keine Assets ab.",
    "columns": {
     "path": "Pfad",
     "asset": "Asset",
     "kind": "Art",
     "version": "Version",
     "size": "Größe"
    },
    "fileSpace": "Dateibereich",
    "fileSpaceMount": "Eingehängt unter {{path}} mit derzeit {{files}} Dateien (höchstens {{maxFiles}} Dateien mit je bis zu {{maxBytes}}).",
    "noFileSpace": "Es ist kein Dateibereich eingehängt, weil der Lauf nicht Teil einer Konversation wäre.",
    "redacted": "Der Server schwärzt geheime Werte in der Befehlszeile, der Umgebung und den Dateien."
   },
   "prompts": {
    "title": "Architekten-Prompt",
    "templatesLink": "In Prompt-Vorlagen öffnen",
    "forArchitect": "Prompts, die der Agenten-Architekt verwenden kann. Wählen Sie einen für {{architect}}.",
    "noArchitect": "Prompts, die der Agenten-Architekt verwenden kann. Wählen Sie auf dem Tab Architekt einen Architekten, um ihm einen zuzuweisen.",
    "nextTurn": "Eine neue Auswahl oder eine gespeicherte Änderung wirkt ab der nächsten Runde des Architekten.",
    "current": "{{architect}} verwendet {{name}} und folgt dessen aktueller Version ({{version}}).",
    "currentPinned": "{{architect}} verwendet {{name}}, festgelegt auf Version {{version}}.",
    "inUse": "{{name}} kann nicht gelöscht werden, solange Bereitstellungen ihn verwenden: {{deployments}}. Wählen Sie für diese zuerst einen anderen Prompt.",
    "empty": "Keine Architekten-Prompts.",
    "columns": {
     "name": "Name",
     "description": "Beschreibung",
     "version": "Version",
     "usedBy": "Verwendet von"
    },
    "default": "Standard",
    "selectedBadge": "Ausgewählt",
    "usedBy": "Architekten: {{total}}",
    "select": "Auswählen",
    "selected": "{{architect}} verwendet {{name}} ab der nächsten Runde.",
    "saved": "{{name}} als neue Version gespeichert.",
    "editorTitle": "{{name}} bearbeiten (Version {{version}})",
    "name": "Name",
    "description": "Beschreibung",
    "body": "Prompt-Text",
    "preview": "Gerenderte Vorschau",
    "deleteMessage": "{{name}} löschen? Architekten-Bereitstellungen, die ihn verwenden: {{total}}. Ein verwendeter Prompt kann nicht gelöscht werden."
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
})(de, {
 "components": {
  "studio": {
   "canvas": {
    "title": "Zeichenfläche",
    "appPicker": "App",
    "flowLabel": "Zeichenfläche der App {{app}}",
    "noApp": "Der Entwurf enthält noch keine App. Bitten Sie den Architekten um eine, oder beginnen Sie einen Entwurf von einer bestehenden App aus.",
    "calls": "Aufrufe ({{total}})",
    "noCalls": "Noch keine Aufrufe. Ziehen Sie vom rechten Rand eines Agenten zu einem anderen Agenten, oder drücken Sie C auf einem Agenten und die Eingabetaste auf dem anderen.",
    "addLoose": "Zur App hinzufügen",
    "remove": "Aus der App entfernen",
    "removeTitle": "Agent aus der App entfernen",
    "removeMessage": "{{name}} aus {{app}} entfernen? Seine Aufrufe werden mit entfernt. Der Agent selbst bleibt bestehen, und die Live-Konfiguration ändert sich erst, wenn der Entwurf angewendet wird.",
    "operationFailed": "{{operation}} wurde abgelehnt.",
    "operations": {
     "AddMember": "Hinzufügen eines Agenten",
     "RemoveMember": "Entfernen eines Agenten",
     "Connect": "Verbinden",
     "Disconnect": "Trennen",
     "SetEntry": "Festlegen des Einstiegsagenten",
     "MoveNode": "Verschieben eines Agenten"
    },
    "toolbar": {
     "label": "Aktionen der Zeichenfläche",
     "addAgent": "Agent hinzufügen",
     "addPlaceholder": "Name des Agenten",
     "role": "Rolle",
     "rolePlaceholder": "Rolle (optional)",
     "add": "Hinzufügen",
     "connect": "Verbinden von",
     "setEntry": "Zum Einstiegsagenten machen",
     "remove": "Entfernen",
     "disconnect": "Trennen",
     "fit": "Ansicht einpassen"
    },
    "connectBar": {
     "message": "Verbindung von {{name}} aus. Wählen Sie den Agenten, den er aufruft: Klicken Sie ihn an, drücken Sie die Eingabetaste auf ihm, oder wählen Sie ihn hier.",
     "to": "Ruft auf",
     "fanOut": "Parallele Aufrufe",
     "confirm": "Verbinden"
    },
    "keys": {
     "title": "Tastenkürzel",
     "tab": "Tab wechselt in Lesereihenfolge durch die Agenten, beginnend beim Einstiegsagenten.",
     "select": "Eingabetaste oder Leertaste wählt den fokussierten Agenten aus und öffnet seine Eigenschaften.",
     "connect": "C auf einem Agenten beginnt einen Aufruf von ihm aus; C oder die Eingabetaste auf einem anderen Agenten schließt ihn ab.",
     "entry": "E macht den fokussierten Agenten zum Einstiegsagenten.",
     "remove": "Entf entfernt den fokussierten Agenten nach einer Bestätigung aus der App.",
     "move": "Die Pfeiltasten verschieben einen ausgewählten Agenten; halten Sie Umschalt für größere Schritte. Die Position wird nach einer kurzen Pause gespeichert.",
     "add": "N springt zum Feld Agent hinzufügen.",
     "calls": "In der Liste der Aufrufe wählt die Eingabetaste einen Aufruf aus, Entf trennt ihn, und F schaltet parallele Aufrufe ein oder aus.",
     "escape": "Escape bricht einen begonnenen Aufruf ab."
    },
    "node": {
     "entry": "Einstieg",
     "unreachable": "Nicht erreichbar",
     "connecting": "Aufruf von hier"
    },
    "a11y": {
     "node": "Drücken Sie die Eingabetaste oder die Leertaste, um diesen Agenten auszuwählen, und dann die Pfeiltasten, um ihn zu verschieben. Drücken Sie C, um ihn zu verbinden, E, um ihn zum Einstiegsagenten zu machen, oder Entf, um ihn zu entfernen.",
     "edge": "Ein Aufruf zwischen zwei Agenten. Wählen Sie ihn in der Liste der Aufrufe unter der Zeichenfläche aus.",
     "handle": "Verbindungspunkt",
     "moved": "Agent nach {{direction}} verschoben. Neue Position: {{x}}, {{y}}.",
     "directions": {
      "up": "oben",
      "down": "unten",
      "left": "links",
      "right": "rechts"
     }
    },
    "announce": {
     "added": "{{name}} zu {{app}} hinzugefügt.",
     "connectStart": "Verbindung von {{name}} aus. Gehen Sie zu dem Agenten, den er aufruft, und drücken Sie die Eingabetaste, oder drücken Sie Escape zum Abbrechen.",
     "connectCancelled": "Verbindung abgebrochen.",
     "connected": "{{from}} ruft jetzt {{to}} auf.",
     "disconnected": "{{from}} ruft {{to}} nicht mehr auf.",
     "fanOutOn": "{{from}} darf {{to}} jetzt parallel aufrufen.",
     "fanOutOff": "{{from}} ruft {{to}} jetzt einzeln nacheinander auf.",
     "entry": "{{name}} ist jetzt der Einstiegsagent von {{app}}.",
     "removed": "{{name}} aus {{app}} entfernt.",
     "selfEdge": "Ein Agent kann sich nicht selbst aufrufen. Wählen Sie einen anderen Agenten."
    },
    "summary": {
     "noApp": "Es gibt keine App zu beschreiben.",
     "agents_one": "Die App {{app}} hat {{count}} Agent.",
     "agents_other": "Die App {{app}} hat {{count}} Agenten.",
     "callCount_one": "Zwischen ihnen gibt es {{count}} Aufruf.",
     "callCount_other": "Zwischen ihnen gibt es {{count}} Aufrufe.",
     "entry": "Der Einstiegsagent ist {{name}}.",
     "noEntry": "Es ist kein Einstiegsagent festgelegt.",
     "callParallel": "{{from}} ruft {{to}} auf, parallele Aufrufe erlaubt, Delegationstiefe {{depth}}.",
     "callSingle": "{{from}} ruft {{to}} auf, ein Aufruf zur Zeit, Delegationstiefe {{depth}}."
    },
    "conflict": {
     "mine": "{{item}} hat sich ebenfalls geändert. Ihre Bearbeitung ist noch im Bereich; vergleichen Sie sie mit der neuen Version, bevor Sie erneut speichern.",
     "kept": "Ihre Bearbeitung von {{item}} ist noch im Bereich. Speichern Sie erneut, um sie auf die neue Version anzuwenden.",
     "operation": "{{operation}} wurde nicht angewendet. Versuchen Sie es auf der neuen Version erneut, oder lassen Sie es.",
     "retry": "Erneut versuchen"
    },
    "panel": {
     "label": "Eigenschaften",
     "tabsLabel": "Eigenschaften von {{name}}",
     "properties": "Agent",
     "runtime": "Laufzeit",
     "save": "Im Entwurf speichern",
     "reset": "Änderungen verwerfen",
     "saved": "{{item}} gespeichert. Vergleichen und anwenden zeigt die Änderung.",
     "check": "Prüfung dieses Elements durch den Server: {{message}}",
     "unparsable": "Das YAML des Elements lässt sich nicht einlesen, daher kann der Bereich es nicht ändern. Korrigieren Sie es zuerst auf dem Tab Elemente. ({{message}})"
    },
    "agent": {
     "title": "Agent: {{name}}",
     "isEntry": "Dies ist der Einstiegsagent der App: Er spricht mit den Personen, die die App nutzen.",
     "notHeld": "Der Entwurf enthält das Dokument von {{name}} noch nicht. Holen Sie es in den Entwurf, um es hier zu bearbeiten; die Live-Konfiguration ändert sich nicht.",
     "deleted": "Der Entwurf löscht {{name}}. Stellen Sie es auf dem Tab Elemente wieder her, um es zu bearbeiten.",
     "bring": "In den Entwurf holen",
     "description": "Beschreibung",
     "inputSchema": "Eingabeschema",
     "outputSchema": "Ausgabeschema",
     "schemaHint": "JSON Schema als JSON. Leer lassen für reinen Text.",
     "assets": "Agenten-Assets",
     "noAssets": "Die nächste Revision legt keine Assets fest.",
     "assetsKept": "Das Dokument nennt keine Assets, daher behält der Agent seine bisherigen.",
     "assetName": "Name des Assets",
     "assetVersion": "Version",
     "latest": "Neueste",
     "removeAsset": "Asset {{name}} entfernen",
     "addAsset": "Asset hinzufügen",
     "capabilities": "Fähigkeiten",
     "capabilitiesHint": "Trennen Sie Namen durch Kommas. Eine leere Liste entfernt alle.",
     "capabilitiesKept": "Trennen Sie Namen durch Kommas. Bleibt das Feld leer, behält der Agent seine bisherigen Fähigkeiten.",
     "systemPrompt": "System-Prompt",
     "noDeployments": "Der Entwurf enthält keine Bereitstellung dieses Agenten, daher wird hier kein System-Prompt festgelegt.",
     "promptLine": "{{environment}}: {{deployment}} verwendet {{prompt}}",
     "builtInPrompt": "den integrierten Standard",
     "showRuntime": "Auf dem Tab Laufzeit bearbeiten",
     "errors": {
      "json": "Das ist kein gültiges JSON.",
      "object": "Ein Schema ist ein JSON-Objekt, zum Beispiel {\"type\": \"object\"}.",
      "version": "Verwenden Sie eine ganze Zahl, oder lassen Sie das Feld für die neueste Version leer."
     }
    },
    "edge": {
     "title": "Aufruf von {{from}} an {{to}}",
     "from": "Aufrufer",
     "to": "Aufgerufener",
     "depth": "Delegationstiefe",
     "depthHint": "Aus dem Graphen abgeleitet: eins plus die längste Kette von Aufrufen unterhalb von {{to}}. Sie ändert sich, wenn sich Aufrufe darunter ändern.",
     "fanOut": "Parallele Aufrufe (Fan-out)",
     "fanOutOn": "{{from}} darf mehrere Aufrufe an {{to}} gleichzeitig starten.",
     "fanOutOff": "{{from}} ruft {{to}} einzeln nacheinander auf."
    },
    "app": {
     "title": "App: {{name}}",
     "hint": "Wählen Sie einen Agenten oder einen Aufruf auf der Zeichenfläche aus, um ihn zu bearbeiten. Ist nichts ausgewählt, bearbeitet dieser Bereich die App.",
     "entry": "Einstiegsagent",
     "noEntry": "Kein Einstiegsagent",
     "noMembers": "Fügen Sie zuerst einen Agenten hinzu; der erste wird zum Einstiegsagenten.",
     "notHeld": "Der Entwurf enthält das Dokument von {{name}} noch nicht. Holen Sie es in den Entwurf, um Anmeldung und Erscheinungsbild hier zu bearbeiten.",
     "deleted": "Der Entwurf löscht {{name}}. Stellen Sie es auf dem Tab Elemente wieder her, um es zu bearbeiten.",
     "bring": "In den Entwurf holen",
     "description": "Beschreibung",
     "authMode": "Anmeldung",
     "authDefault": "Standard des Servers",
     "anonymous": "Anonyme Nutzung erlauben",
     "branding": "Erscheinungsbild",
     "brandingFields": {
      "displayName": "Anzeigename",
      "logo": "Logo-Asset",
      "primaryColor": "Hauptfarbe",
      "accentColor": "Akzentfarbe",
      "welcomeText": "Begrüßungstext"
     },
     "errors": {
      "color": "Verwenden Sie eine Hex-Farbe wie #1F6FEB."
     }
    },
    "runtime": {
     "title": "Laufzeit von {{name}}",
     "none": "Der Entwurf enthält keine Bereitstellung von {{name}}. Holen Sie unten eine Live-Bereitstellung herein, oder bitten Sie den Architekten um eine.",
     "deployment": "Umgebung und Bereitstellung",
     "option": "{{environment}}: {{name}}",
     "scope": "Änderungen betreffen nur {{name}} in {{environment}} (Harness-Profil {{profile}}). Andere Umgebungen behalten ihre eigenen Werte.",
     "fields": {
      "model": "Modell",
      "effort": "Aufwand",
      "timeoutSeconds": "Zeitlimit (Sekunden)",
      "maxTurns": "Höchstzahl an Runden",
      "maxBudgetUsd": "Kostenrahmen (USD)",
      "systemTemplate": "Prompt-Vorlage für den System-Prompt",
      "systemVersion": "Festgelegte Version",
      "approvalsEnabled": "Freigabe für Werkzeugaufrufe einholen",
      "approvalDefaultAction": "Wenn keine Regel passt"
     },
     "hints": {
      "timeoutSeconds": "Ganze Sekunden, mindestens 1. Leer verwendet das Limit des Harness-Profils.",
      "maxTurns": "Ganze Zahl, mindestens 1. Leer bedeutet, der Harness entscheidet.",
      "maxBudgetUsd": "0 oder mehr, zum Beispiel 2.50. Leer bedeutet kein Budget."
     },
     "builtIn": "Integrierter Standard",
     "approvals": "Freigaben",
     "noRules": "Keine Regeln. Jeder Werkzeugaufruf erhält die Standardaktion.",
     "rule": {
      "action": "Aktion",
      "pattern": "Werkzeugmuster",
      "inputPattern": "Eingabemuster",
      "inputPlaceholder": "Eingabemuster (optional)",
      "remove": "Regel {{number}} entfernen",
      "add": "Regel hinzufügen"
     },
     "live": "Live-Bereitstellungen, die nicht im Entwurf sind",
     "noLive": "Jede Live-Bereitstellung dieses Agenten ist bereits im Entwurf, oder er hat keine.",
     "bring": "In den Entwurf holen",
     "exportMissing": "Der Export von {{name}} kam ohne sein Dokument zurück.",
     "errors": {
      "integer": "Verwenden Sie eine ganze Zahl ab 1.",
      "number": "Verwenden Sie eine Zahl ab 0.",
      "pattern": "Eine Regel braucht ein Werkzeugmuster.",
      "version": "Verwenden Sie eine ganze Zahl, und nennen Sie eine Vorlage, die festgelegt werden soll."
     }
    }
   }
  }
 },
 "common": {
  "fieldCodes": {
   "NotAMember": "Dieser Agent ist kein Mitglied der App.",
   "SelfEdge": "Ein Agent kann sich nicht selbst aufrufen.",
   "NoSuchEdge": "Die App hat keinen solchen Aufruf.",
   "AppDeleted": "Der Entwurf löscht diese App. Stellen Sie sie zuerst wieder her.",
   "InvalidDocument": "Das Dokument lässt sich nicht als ein einzelnes Manifest-Dokument einlesen.",
   "DocumentMismatch": "Art oder Name des Dokuments passen nicht zum Element."
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
})(de, {
 "common": {
  "productName": "Garrison Agent Studio",
  "productLine": "Agent Studio",
  "states": {
   "studioHint": "Oder öffnen Sie das Agenten-Studio und beschreiben Sie, was Sie brauchen: Der Agenten-Architekt entwirft es, und Sie prüfen es.",
   "openStudio": "Agenten-Studio öffnen"
  }
 },
 "nav": {
  "items": {
   "studio": {
    "label": "Agenten-Studio"
   },
   "serverInfo": {
    "label": "Info",
    "tip": "Produkt, Versionen, Links, Endpunkte und Ihre Identität"
   }
  }
 },
 "wizard": {
  "steps": {
   "studio": "Agenten-Studio"
  },
  "welcomeItemStudio": "Dem Agenten-Architekten einen Harness und ein Modell geben, damit er im Agenten-Studio mit Ihnen Agenten und Apps entwirft (optional).",
  "studioBody": "Der Agenten-Architekt entwirft im Agenten-Studio mit Ihnen Agenten und Apps. Wählen Sie das Harness-Profil und das Modell, mit denen er läuft, und den Architekten-Prompt, der ihn anleitet. Seine Bereitstellung darf nur Ihre Studio-Entwürfe bearbeiten. Sie können diesen Schritt überspringen und später im Studio einen Architekten erstellen.",
  "createArchitect": "Architekten erstellen",
  "architectCreated": "Agenten-Architekt {{name}} erstellt.",
  "architectReady": "Der Agenten-Architekt {{name}} ist bereit. Öffnen Sie nach der Einrichtung das Agenten-Studio und beginnen Sie mit ihm einen Entwurf.",
  "continue": "Weiter"
 },
 "views": {
  "home": {
   "getStartedBody": "Der Einrichtungsassistent fügt Zugangsdaten hinzu, gibt dem Agenten-Architekten einen Harness und ein Modell, wendet einen Beispielagenten an und führt einen Test aus. Oder öffnen Sie das Agenten-Studio und beschreiben Sie die gewünschte App.",
   "openStudio": "Agenten-Studio öffnen"
  },
  "studio": {
   "title": "Agenten-Studio"
  },
  "studioDraft": {
   "tabs": {
    "release": "Auslieferung"
   }
  },
  "serverInfo": {
   "title": "Info",
   "subtitle": "Versionen, Links, Endpunkte und die Identität, mit der Sie angemeldet sind.",
   "positioning": "Agentische Apps mit den Agent-Harnesses bauen, bereitstellen und betreiben, die Sie bereits nutzen.",
   "versions": "Serverversion {{server}}, Dashboard-Version {{dashboard}}",
   "docs": "Dokumentation",
   "studioDocs": "Leitfaden zum Agenten-Studio",
   "website": "Webseite",
   "source": "Quellcode"
  }
 },
 "resources": {
  "apps": {
   "actions": {
    "environments": "Umgebungen"
   }
  }
 },
 "components": {
  "apps": {
   "release": {
    "title": "Umgebungen und Hochstufung",
    "intro": "Die Bereitstellungen jedes Mitglieds pro Umgebung, mit der Revision, die jede festlegt, und ihren Umgebungsüberschreibungen. Vergleichen Sie zwei Umgebungen vor dem Hochstufen, und setzen Sie eine Hochstufung aus dem Verlauf zurück.",
    "live": "Live-Umgebung: {{environment}}",
    "environments": "Umgebungen",
    "source": "Vergleichen",
    "target": "mit",
    "member": "Mitglied",
    "entry": "Einstieg",
    "noDeployment": "Keine Bereitstellung",
    "secretOverride": "{{name}} (geheim)",
    "difference": "{{source}} nach {{target}}",
    "differenceNone": "Unterschied",
    "diff": {
     "Same": "Gleich",
     "Missing": "Keine Bereitstellung in {{target}}",
     "revisions": "Revisionen unterscheiden sich",
     "overrides": "Überschreibungen unterscheiden sich",
     "both": "Revisionen und Überschreibungen unterscheiden sich"
    },
    "promote": "{{source}} nach {{target}} hochstufen",
    "promoteNothing": "Hochstufen",
    "missing": "Keine Bereitstellung in {{target}}: {{names}}. Ein Hochstufen würde jetzt fehlschlagen und nichts verschieben; erstellen Sie dort zuerst eine Bereitstellung.",
    "history": "Hochstufungsverlauf",
    "historyEmpty": "Diese App wurde noch nicht hochgestuft."
   }
  },
  "studio": {
   "release": {
    "title": "Auslieferung",
    "app": "App",
    "noAppsTitle": "Dieser Entwurf baut keine App",
    "noAppsBody": "Fügen Sie dem Entwurf eine App hinzu, im Tab Graph oder über den Architekten, um sie nach dem Anwenden hier hochzustufen.",
    "notLiveTitle": "{{name}} ist noch nicht live",
    "notLiveBody": "Wenden Sie zuerst den Entwurf an. Das veröffentlicht seine Agenten und stellt sie in dev bereit; danach können Sie die App hier hochstufen."
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
})(de, {
 "nav": {
  "items": {
   "architects": {
    "label": "Architekten",
    "tip": "Agenten-Architekten: wiederverwendbare Bereitstellungen des Agenten-Architekten, die in jedem Studio-Entwurf mit Ihnen Agenten und Apps entwerfen."
   }
  }
 },
 "resources": {
  "architects": {
   "title": "Architekten",
   "subtitle": "Die Agenten-Architekten in diesem Mandanten. Jeder ist eine Bereitstellung von agent-architect mit eigenem Harness-Profil, Modell und Prompt, und jeder Studio-Entwurf kann ihn verwenden.",
   "add": "Architekt hinzufügen",
   "create": "Architekt erstellen",
   "edit": "Architekt bearbeiten",
   "view": "Architekt-Details",
   "deleteTitle": "Architekt löschen",
   "emptyTitle": "Noch keine Architekten",
   "emptyBody": "Erstellen Sie einen Architekten, der im Agenten-Studio mit Ihnen Agenten und Apps entwirft. Wählen Sie das Harness-Profil und das Modell, auf denen er läuft, und den Prompt, mit dem er arbeitet.",
   "columns": {
    "name": "Name",
    "harnessProfileId": "Harness-Profil",
    "model": "Modell",
    "architectPromptTemplateId": "Architekten-Prompt",
    "active": "Status",
    "description": "Beschreibung",
    "id": "ID",
    "lastUpdateUtc": "Aktualisiert",
    "createdUtc": "Erstellt"
   },
   "fields": {
    "name": "Name",
    "description": "Beschreibung",
    "harnessProfileId": "Harness-Profil",
    "model": "Modell",
    "architectPromptTemplateId": "Architekten-Prompt",
    "architectPromptVersion": "Festgelegte Prompt-Version",
    "active": "Aktiv"
   },
   "hints": {
    "model": "Leer lassen, um das Standardmodell des Harness-Profils zu verwenden.",
    "architectPromptVersion": "Leer lassen, um immer die aktuelle Version des Prompts zu verwenden."
   },
   "actions": {
    "prompts": "Architekten-Prompts",
    "deployment": "Bereitstellungseinstellungen"
   },
   "errors": {
    "nameTaken": "Eine andere Bereitstellung in diesem Mandanten verwendet diesen Namen bereits.",
    "version": "Geben Sie eine ganze Zahl ab 1 ein oder lassen Sie das Feld leer."
   },
   "promptPinned": "{{name}} (Version {{version}})",
   "defaultModel": "Profilstandard",
   "defaultBadge": "Standard",
   "promptsTitle": "Architekten-Prompts für {{name}}"
  }
 },
 "components": {
  "studio": {
   "chat": {
    "manageArchitects": "Architekten verwalten"
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
})(de, {
 "components": {
  "confirm": {
   "typeToConfirm": "Bitte geben Sie '{{word}}' in das Feld unten ein, um zu bestätigen."
  }
 },
 "views": {
  "agentDetail": {
   "deleted": "Agent {{name}} gelöscht."
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
})(de, {
 "components": {
  "studio": {
   "architect": {
    "credential": "Zugangsdaten",
    "noCredential": "Keine",
    "credentialOption": "{{name}} ({{kind}})"
   },
   "chat": {
    "notCredentialedTitle": "Der Architekt konnte sich nicht bei seinem Modellanbieter anmelden",
    "notCredentialedBody": "Die Authentifizierung für {{architect}} ist fehlgeschlagen. Prüfen Sie die Zugangsdaten der gespeicherten Verbindung; der Ausführungsfehler unten erklärt die Ursache.",
    "noCredentialTitle": "Dieser Architekt hat keine Zugangsdaten",
    "noCredentialBody": "{{architect}} läuft auf {{profile}}, das zum Anmelden ein Geheimnis braucht. Ohne eines scheitern seine Züge mit Not logged in. Wählen Sie auf der Seite Architekten Zugangsdaten für ihn.",
    "fixCredential": "Zugangsdaten des Architekten korrigieren",
    "openSecrets": "Geheimnisse öffnen"
   }
  }
 },
 "resources": {
  "architects": {
   "columns": {
    "credentialSecretId": "Zugangsdaten"
   },
   "fields": {
    "credentialSecretId": "Zugangsdaten"
   },
   "noCredential": "Keine"
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
})(de, {
 "components": {
  "dependencyHint": {
   "refresh": "Liste aktualisieren"
  },
  "architectHints": {
   "harness": "Die integrierten Profile (Claude Code, Codex und andere) sind sofort nutzbar.",
   "harnessLink": "Konfiguration > Harness-Profile öffnen",
   "credentialNotNeeded": "{{profile}} braucht keine Zugangsdaten.",
   "credentialLink": "Konfiguration > Geheimnisse öffnen",
   "prompt": "Eine Änderung gilt ab dem nächsten Zug des Architekten.",
   "promptLink": "Konfiguration > Prompt-Vorlagen öffnen",
   "credentialNoProfile": "Das Geheimnis, mit dem sich das Harness anmeldet.",
   "credentialChosen": "Das Geheimnis, mit dem sich {{profile}} anmeldet.",
   "credentialPick": "{{profile}} meldet sich mit einem Geheimnis der Art {{kinds}} an. Wählen Sie eines, sonst scheitert jeder Zug mit Not logged in.",
   "credentialAdd": "{{profile}} meldet sich mit einem Geheimnis der Art {{kinds}} an, und dieser Mandant hat noch keines. Fügen Sie unter Konfiguration > Geheimnisse eines hinzu und wählen Sie es dann hier. Ohne es scheitert jeder Zug mit Not logged in."
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
})(de, {
 "components": {
  "studio": {
   "architect": {
    "intro": "Der Agenten-Architekt entwirft Agenten und Apps in Ihren Entwürfen. Geben Sie ihm ein Harness-Profil, das Geheimnis, mit dem er sich anmeldet, ein Modell und den Prompt, mit dem er arbeitet. Er bearbeitet nur Ihre Entwürfe und wendet sie nie an."
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
})(de, {
 "wizard": {
  "studioBody": "Der Agenten-Architekt entwirft mit Ihnen Agenten und Apps im Agenten-Studio. Wählen Sie das Harness-Profil und das Modell, auf denen er läuft, die Zugangsdaten, mit denen er sich anmeldet (das im vorigen Schritt gespeicherte Geheimnis wird gewählt, wenn es zum Harness passt), und den Architekten-Prompt, der ihn leitet. Seine Bereitstellung darf nur Ihre Studio-Entwürfe bearbeiten. Sie können diesen Schritt überspringen und später unter Agenten > Architekten einen Architekten erstellen."
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
})(de, {
 "components": {
  "secretGuide": {
   "title": "So erhalten Sie den Wert für {{kind}}",
   "AnthropicApiKey": {
    "s1": "Melden Sie sich in der Anthropic Console an und öffnen Sie Settings > API keys:",
    "s2": "Wählen Sie Create Key, geben Sie einen Namen wie garrison ein und kopieren Sie den Schlüssel. Er beginnt mit sk-ant-api und wird nur einmal angezeigt.",
    "s3": "Fügen Sie ihn in Wert ein. Claude Code, opencode, pi, Mux und das Provider-API-Harness erhalten ihn als ANTHROPIC_API_KEY."
   },
   "ClaudeCodeOAuthToken": {
    "s1": "Installieren Sie Claude Code auf einem beliebigen Rechner, falls noch nicht vorhanden:",
    "s2": "Führen Sie diesen Befehl aus und melden Sie sich im sich öffnenden Browserfenster mit dem Claude-Konto an, dessen Pro- oder Max-Abonnement die Agenten nutzen sollen:",
    "s3": "Kopieren Sie das ausgegebene Token. Es beginnt mit sk-ant-oat und gilt ein Jahr; setzen Sie Läuft ab auf dieses Datum, damit Garrison anzeigt, wann es abläuft.",
    "s4": "Fügen Sie es in Wert ein. Claude Code erhält es als CLAUDE_CODE_OAUTH_TOKEN.",
    "note": "Ein Abonnement-Token nutzt den Tarif einer Person, und damit andere Menschen zu bedienen kann gegen die Bedingungen von Anthropic verstoßen. Verwenden Sie für alles Gemeinsame einen Anthropic-API-Schlüssel."
   },
   "OpenAiApiKey": {
    "s1": "Melden Sie sich bei der OpenAI Platform an und öffnen Sie API keys:",
    "s2": "Wählen Sie Create new secret key, wählen Sie das Projekt, dessen Abrechnung die Läufe bezahlt, und kopieren Sie den Schlüssel. Er beginnt mit sk- und wird nur einmal angezeigt.",
    "s3": "Fügen Sie ihn in Wert ein. Codex, opencode, pi, Mux und das Provider-API-Harness erhalten ihn als OPENAI_API_KEY."
   },
   "CodexAuthJson": {
    "s1": "Installieren Sie die Codex CLI, falls noch nicht vorhanden:",
    "s2": "Melden Sie sich mit Ihrem ChatGPT-Konto in einem neuen, leeren Codex-Verzeichnis an, damit diese Anmeldung nur Garrison gehört:",
    "s3": "Prüfen Sie die Datei im selben Terminal. Fahren Sie nur fort, wenn Valid JSON erscheint:",
    "copy": "Unter macOS kopieren Sie die Datei mit dem folgenden Befehl direkt in die Zwischenablage und fügen sie in Wert ein. Öffnen Sie auf anderen Systemen auth.json in einem Texteditor und kopieren Sie die gesamte Datei. Kopieren Sie keine umgebrochene Terminalausgabe oder Eingabeaufforderung.",
    "s4": "Löschen Sie nach dem erfolgreichen Speichern des Geheimnisses diesen Ordner und verwenden Sie diese Anmeldung nirgendwo sonst. Garrison übernimmt ab jetzt die Erneuerung:",
    "note": "Zwei Kopien einer Anmeldung teilen ein Refresh-Token, und wer zuerst erneuert, macht die andere ungültig. Einen persönlichen ChatGPT-Tarif für andere zu nutzen kann gegen die Bedingungen von OpenAI verstoßen; für gemeinsame Bereitstellungen ist ein OpenAI-API-Schlüssel einfacher."
   },
   "GeminiApiKey": {
    "s1": "Öffnen Sie Google AI Studio und melden Sie sich mit dem Google-Konto an, das zahlen soll:",
    "s2": "Wählen Sie Create API key, wählen oder erstellen Sie ein Google-Cloud-Projekt und kopieren Sie den Schlüssel. Er beginnt mit AIza.",
    "s3": "Fügen Sie ihn in Wert ein. Gemini CLI und pi erhalten ihn als GEMINI_API_KEY, opencode als GOOGLE_GENERATIVE_AI_API_KEY."
   },
   "GenericEnv": {
    "s1": "Fügen Sie einen einzelnen Wert ein: ein Token, ein Passwort oder eine URL, die ein Harness oder Werkzeug aus einer Umgebungsvariable liest.",
    "s2": "Binden Sie das Geheimnis unter einem Alias an eine Bereitstellung und fügen Sie eine Umgebungsüberschreibung hinzu, die es verwendet, zum Beispiel:",
    "s3": "Die Variable muss in der Zugangsdaten-Positivliste des Harness-Profils stehen, sonst wird die Bereitstellung abgelehnt."
   },
   "GenericFile": {
    "s1": "Fügen Sie die ganze Datei mit Zeilenumbrüchen ein: ein Dienstkonto-JSON, ein Zertifikat oder eine Konfigurationsdatei.",
    "s2": "Binden Sie das Geheimnis unter einem Alias an eine Bereitstellung und fügen Sie eine Dateiüberschreibung hinzu, deren Inhalt das Geheimnis ist, zum Beispiel:"
   },
   "BearerToken": {
    "s1": "Fügen Sie nur das Token ein, ohne das Wort Bearer.",
    "s2": "Remote-Agenten verwenden es als ihr Zugangsdaten-Geheimnis, und Arbeitsbereich-Vorlagen klonen damit ein privates Repository (als Passwort für den Benutzer x-access-token). Ein MCP-Server kann es in einem Header als {{secret.<alias>}} senden."
   },
   "BasicAuth": {
    "s1": "Fügen Sie Benutzername und Passwort in dieser Form ein:",
    "s2": "Binden Sie das Geheimnis unter einem Alias an eine Bereitstellung und verwenden Sie es in einer Vorlage als {{secret.<alias>}}."
   },
   "GitCredential": {
    "s1": "Erstellen Sie für GitHub ein fein abgestuftes persönliches Zugriffstoken mit Lesezugriff auf Contents für die zu klonenden Repositorys:",
    "s2": "Fügen Sie nur das Token ein; Garrison sendet es als Passwort für den Benutzer x-access-token. Für GitLab, Bitbucket oder einen anderen Host fügen Sie stattdessen username:token ein.",
    "s3": "Wählen Sie dieses Geheimnis als Git-Zugangsdaten der Arbeitsbereich-Vorlage, die das Repository klont."
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
})(de, {
 "components": {
  "studio": {
   "chat": {
    "wait": {
     "worker": "Warten auf einen Worker, der diesen Zug startet...",
     "phrases": {
      "p1": "Ihr Entwurf wird gelesen...",
      "p2": "Wird durchdacht...",
      "p3": "Die Agenten werden skizziert...",
      "p4": "Wer wen aufruft, wird geklärt...",
      "p5": "Die Konventionen von Garrison werden geprüft...",
      "p6": "Die passenden Fähigkeiten werden gewählt...",
      "p7": "Die Manifeste werden entworfen...",
      "p8": "Mehrere Entwürfe werden abgewogen...",
      "p9": "Die Bereitstellungen werden vorbereitet...",
      "p10": "Die Prompts werden geprüft...",
      "p11": "Der Graph der App wird erstellt...",
      "p12": "Eine einfachere Form wird gesucht...",
      "p13": "Die Details werden noch einmal geprüft...",
      "p14": "Die Teile werden zusammengesetzt...",
      "p15": "Fast geschafft...",
      "p16": "Wird noch bearbeitet..."
     }
    },
    "thinkingSummary": "Überlegungen",
    "metrics": {
     "model": "Modell",
     "timeToFirstTokenMs": "TTFT",
     "streamingMs": "Streaming",
     "totalMs": "Gesamt",
     "inputTokens": "Ein",
     "outputTokens": "Aus",
     "cachedTokens": "Zwischengesp.",
     "reasoningTokens": "Reasoning",
     "outputTokensPerSecond": "Token/s",
     "toolCallCount": "Werkzeuge",
     "costUsd": "Kosten"
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
})(de, {
 "components": {
  "studio": {
   "chat": {
    "metrics": {
     "title": "Details zum Zug"
    },
    "tool": {
     "running": "läuft",
     "ok": "fertig",
     "failed": "fehlgeschlagen",
     "input": "Argumente",
     "output": "Ergebnis",
     "none": "Keine",
     "waiting": "Warten auf das Ergebnis..."
    },
    "refs": {
     "apr": "Genehmigung öffnen",
     "run": "Lauf öffnen",
     "cnv": "Unterhaltung öffnen",
     "agt": "Agent öffnen",
     "sdr": "Entwurf öffnen",
     "plr": "Pipeline-Lauf öffnen",
     "tpl": "Prompt-Vorlage öffnen"
    },
    "keysHint": "Enter sendet. Strg+Enter oder Umschalt+Enter fügt eine neue Zeile ein.",
    "disclaimer": "KI kann Fehler machen. Prüfen Sie alle Antworten.",
    "continueHint": "Setzt die Unterhaltung fort."
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
})(de, {
 "nav": {
  "items": {
   "agentWizard": {
    "label": "Agenten-Assistent",
    "tip": "Ein geführter Weg von der Beschreibung Ihres Bedarfs zu freigegebenen Agenten, die in Dev laufen: Modellzugriff, Entwurf mit dem Agenten-Architekten, Prüfung, Freigabe und ein erstes Gespräch."
   }
  }
 },
 "resources": {
  "agents": {
   "wizard": "Agenten-Assistent"
  }
 },
 "common": {
  "states": {
   "studioHint": "Oder öffnen Sie den Agenten-Assistenten und beschreiben Sie, was Sie brauchen: Er führt Sie durch Aufbau, Freigabe und Test der Agenten.",
   "openStudio": "Agenten-Assistenten öffnen"
  }
 },
 "views": {
  "home": {
   "openStudio": "Agenten-Assistenten öffnen"
  },
  "studioDraft": {
   "back": "Zurück zum Assistenten"
  },
  "agentWizard": {
   "title": "Agenten-Assistent",
   "subtitle": "Beschreiben Sie, was Sie brauchen. Der Assistent bringt Sie von dort zu freigegebenen Agenten, die in Dev laufen.",
   "subtitleDraft": "Aufbau: {{title}}",
   "advanced": "Erweitert",
   "stepsLabel": "Schritte des Assistenten",
   "back": "Zurück",
   "working": "Wird bearbeitet...",
   "steps": {
    "goal": "Ziel",
    "access": "Modellzugriff",
    "design": "Entwurf",
    "review": "Prüfung",
    "approve": "Freigabe",
    "test": "Ausprobieren"
   },
   "goal": {
    "title": "Was sollen Ihre Agenten tun?",
    "intro": "Geben Sie dem Projekt einen Namen und beschreiben Sie die Aufgabe in einfachen Worten. Der Agenten-Architekt liest das und entwirft dafür einen Agenten oder ein Team von Agenten.",
    "name": "Projektname",
    "namePlaceholder": "Recherche-Assistent",
    "nameHint": "Ein kurzer Name, den Sie später wiedererkennen. Nach diesem Schritt können Sie ihn nicht mehr ändern.",
    "goal": "Was die Agenten tun sollen",
    "goalPlaceholder": "Ein Thema im Web recherchieren, die Ergebnisse mit Quellen zusammenfassen und einen kurzen Bericht schreiben.",
    "goalHint": "Sagen Sie, wer es nutzt, was hineingeht und was herauskommen soll. Der Architekt fragt nach allem, was er wissen muss.",
    "next": "Starten",
    "resume": "Oder einen Ihrer Entwürfe fortsetzen",
    "allDrafts": "Alle Entwürfe"
   },
   "access": {
    "title": "Modellzugriff",
    "intro": "Wählen Sie den Harness, auf dem Ihre Agenten laufen, und die Zugangsdaten, mit denen er sich anmeldet. Der Agenten-Architekt nutzt denselben Harness und dieselben Zugangsdaten, während er mit Ihnen entwirft.",
    "harness": "Harness-Profil",
    "harnessHint": "Das CLI, das die Agenten ausführt, zum Beispiel Claude Code oder Codex.",
    "model": "Modell",
    "modelHint": "Optional. Leer lassen, um das Standardmodell des Harness zu verwenden.",
    "credential": "Zugangsdaten",
    "noCredentialNeeded": "{{profile}} braucht keine Zugangsdaten.",
    "credentialIntro": "{{profile}} meldet sich mit einem Geheimnis der Art {{kinds}} an. Wählen Sie ein gespeichertes aus oder fügen Sie jetzt eines hinzu.",
    "noFittingSecret": "Sie haben noch kein gespeichertes Geheimnis der Art {{kinds}}. Fügen Sie unten eines hinzu; dort steht auch, wie Sie den Wert erhalten.",
    "addSecret": "Zugangsdaten hinzufügen",
    "saveSecret": "Zugangsdaten speichern",
    "architectDescription": "Vom Agenten-Assistenten eingerichteter Agenten-Architekt.",
    "next": "Weiter zum Entwurf"
   },
   "design": {
    "title": "Mit dem Architekten entwerfen",
    "intro": "Chatten Sie mit dem Agenten-Architekten. Er fragt, was er wissen muss, und baut die Agenten im Gespräch in Ihren Entwurf ein. Der Bereich rechts zeigt, was der Entwurf enthält.",
    "contents": "Im Entwurf",
    "empty": "Noch nichts. Der Architekt fügt hier Agenten hinzu, sobald er sie entwirft.",
    "agents": "KI-Agenten",
    "firstMessage": "Ich möchte Folgendes bauen: {{goal}}\n\nDie Agenten laufen auf dem Harness-Profil {{profile}} mit dem Zugangsdaten-Geheimnis {{secret}}. Fragen Sie mich alles, was Sie wissen müssen, und entwerfen Sie dann die Agenten in diesem Entwurf.",
    "chatTitle": "Chat mit {{architect}}",
    "next": "Weiter zur Prüfung"
   },
   "review": {
    "title": "Prüfung",
    "intro": "Der Assistent prüft jedes Element im Entwurf gegen Ihre aktuelle Konfiguration. Was fehlschlagen würde, geht zur Korrektur an den Architekten zurück.",
    "status": {
     "PendingApproval": "Dieser Entwurf wartet auf Freigabe. Fahren Sie mit dem nächsten Schritt fort.",
     "Applied": "Dieser Entwurf ist angewendet. Fahren Sie mit dem nächsten Schritt fort.",
     "Discarded": "Dieser Entwurf wurde verworfen. Beginnen Sie im ersten Schritt einen neuen."
    },
    "kind": "Art",
    "name": "Bezeichnung",
    "change": "Änderung",
    "note": "Hinweis",
    "problems_one": "{{count}} Element ließe sich nicht anwenden.",
    "problems_other": "{{count}} Elemente ließen sich nicht anwenden.",
    "askFix": "Den Architekten um Korrektur bitten",
    "valid": "Alles im Entwurf ist in Ordnung. Fahren Sie mit der Freigabe fort.",
    "validate": "Erneut prüfen",
    "fixMessage": "Der Entwurf ist noch nicht gültig. Bitte beheben Sie diese Probleme:\n{{problems}}",
    "next": "Weiter zur Freigabe"
   },
   "approve": {
    "title": "Freigeben",
    "intro": "Die Freigabe wendet den Entwurf an und schaltet die Agenten live. Danach gibt der Assistent jedem Agenten eine Dev-Bereitstellung, damit Sie ihn sofort ausprobieren können.",
    "reason": "Im Agenten-Assistenten freigegeben.",
    "summary": "Der Entwurf enthält {{total}} Elemente, darunter {{agents}} Agenten. Sie laufen auf {{profile}} mit den Zugangsdaten {{secret}}.",
    "will1": "Alle Elemente im Entwurf werden gemeinsam erstellt oder aktualisiert. Schlägt eines fehl, wird nichts geändert.",
    "will2": "Jeder Agent erhält eine Dev-Bereitstellung auf dem gewählten Harness, mit gebundenen Zugangsdaten.",
    "will3": "Wenn Sie nicht freigeben dürfen, wartet die Anfrage auf jemanden, der es darf, und diese Seite macht weiter, sobald entschieden ist.",
    "approve": "Freigeben und veröffentlichen",
    "waiting": "Warten auf eine Entscheidung von jemandem mit Freigaberechten. Diese Seite macht danach von selbst weiter.",
    "openApproval": "Freigabe öffnen",
    "retry": "Erneut versuchen",
    "done": "Freigegeben und veröffentlicht. Jeder Agent hat eine startbereite Dev-Bereitstellung.",
    "agent": "KI-Agent",
    "deployment": "Dev-Bereitstellung",
    "what": "Was der Assistent getan hat",
    "actions": {
     "create": "Bereitstellung erstellt",
     "bind": "Zugangsdaten gebunden",
     "ready": "Bereits bereit"
    },
    "next": "Weiter zum Ausprobieren"
   },
   "test": {
    "title": "Ausprobieren",
    "intro": "Sprechen Sie mit Ihrem neuen Agenten in Dev. Wenn Sie zufrieden sind, öffnen Sie ihn, um ihn hochzustufen oder zu teilen.",
    "talkingTo": "Gespräch mit {{name}}.",
    "empty": "Senden Sie eine Nachricht, um ein Gespräch zu beginnen.",
    "message": "Nachricht",
    "next": "Wie es weitergeht",
    "openAgent": "{{name}} öffnen",
    "openApp": "App {{name}} öffnen",
    "openInvoke": "In Invoke öffnen",
    "another": "Weitere bauen"
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
})(de, {
 "views": {
  "agentWizard": {
   "test": {
    "openApp": "Chat von {{name}} öffnen"
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
})(de, {
 "resources": {
  "apps": {
   "fields": {
    "backgroundColor": "Seitenhintergrund",
    "headerColor": "Kopfzeilenfarbe",
    "agentBubbleColor": "Farbe der Agentennachrichten",
    "fontFamily": "Schriftart",
    "faviconAssetId": "Tab-Symbol"
   },
   "hints": {
    "displayName": "Erscheint in der Kopfzeile des Chats und an den Nachrichten des Agenten. Beliebige Zeichen, bis 128. Der Name oben ist nur die Kennung.",
    "faviconAssetId": "Ein Bild-Asset. Leer lassen, um das Logo zu verwenden.",
    "primaryColor": "Schaltflächen und Ihre eigenen Nachrichten.",
    "accentColor": "Hervorhebungen, Fokusrahmen und die gewählte Unterhaltung.",
    "backgroundColor": "Die Seite hinter der Unterhaltung.",
    "headerColor": "Die Leiste oben mit Name und Logo.",
    "agentBubbleColor": "Die Nachrichten des Agenten. Die Textfarbe wird für guten Kontrast gewählt."
   },
   "faviconFromLogo": "Wie das Logo",
   "defaultColor": "Standard {{color}}"
  }
 },
 "enums": {
  "appFont": {
   "System": "Systemschrift",
   "Sans": "Serifenlos",
   "Serif": "Mit Serifen",
   "Rounded": "Abgerundet",
   "Mono": "Festbreite"
  }
 },
 "components": {
  "form": {
   "defaultColor": "Standard"
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
})(de, {
 "resources": {
  "apps": {
   "fields": {
    "conversationListColor": "Farbe der Unterhaltungsliste",
    "composerColor": "Farbe des Eingabebereichs",
    "filesColor": "Farbe der Dateiliste"
   },
   "hints": {
    "conversationListColor": "Die Liste der Unterhaltungen an der Seite.",
    "composerColor": "Der Bereich unter der Unterhaltung, in dem Sie schreiben.",
    "filesColor": "Die Liste der Dateien, die der Agent geschrieben hat."
   }
  }
 }
});

// Wizard draft picker and credential-optional Mux endpoints.
Object.assign(de.views.agentWizard.goal, {
  "updated": "Aktualisiert am {{date}}",
  "continue": "Fortsetzen"
});
Object.assign(de.views.agentWizard.access, {
  "muxEndpoint": "Mux-Endpunkt-URL",
  "muxAdapter": "Endpunktadapter",
  "muxOptionalCredential": "Zugangsdaten (optional)",
  "muxHint": "Mux kann einen Endpunkt ohne API-Schlüssel eines Anbieters verwenden. Gib eine Endpunkt-URL ein, die der Worker erreichen kann. Wähle Zugangsdaten nur, wenn der Endpunkt eine Authentifizierung erfordert.",
  "needEndpoint": "Gib eine gültige Mux-Endpunkt-URL mit HTTP oder HTTPS ein."
});
Object.assign(de.views.agentWizard.design, {
  "firstMessageMux": "Ich möchte Folgendes erstellen: {{goal}}\n\nVerwende Mux mit Endpunkt {{endpoint}}, Adapter {{adapter}} und Modell {{model}}. Ein API-Schlüssel ist nur erforderlich, wenn der Endpunkt eine Authentifizierung erfordert. Stelle mir die nötigen Fragen und entwirf dann die Agenten in diesem Entwurf."
});
Object.assign(de.views.agentWizard.approve.actions, {"configure": "Endpunkt konfiguriert"});

// Harness-specific wizard configuration.
Object.assign(de.views.agentWizard.access, {
  "muxEndpoint": "Mux-Endpunktname",
  "muxHint": "Gib den in Mux auf den Ausführungs-Workern konfigurierten Endpunktnamen ein, etwa local. Mux liefert URL, Adapter, Modell und Authentifizierung.",
  "needEndpoint": "Gib einen konfigurierten Mux-Endpunktnamen ein, keine URL.",
  "providerModelHint": "Verwende die CLI-Modellkennung, meist provider/model. Die Authentifizierung hängt vom Anbieter ab; gespeicherte Zugangsdaten sind optional.",
  "optionalCredentialIntro": "{{profile}} unterstützt gespeicherte Secrets vom Typ {{kinds}}. Wähle eines, wenn dein Anbieter es benötigt, oder fahre ohne gespeicherte Zugangsdaten fort.",
  "providerEndpoint": "URL des Anbieter-API-Endpunkts",
  "providerEndpointHint": "Dieser Harness ruft eine OpenAI-kompatible HTTP-API direkt auf. Gib Basis-URL und Modell ein.",
  "providerAnonymous": "Der Anbieterendpunkt benötigt keine Authentifizierung",
  "needProviderEndpoint": "Gib eine gültige HTTP- oder HTTPS-Anbieter-URL ohne Zugangsdaten, Abfrageparameter oder Fragment ein."
});
Object.assign(de.views.agentWizard.design, {
  "firstMessageMux": "Ich möchte Folgendes erstellen: {{goal}}\n\nVerwende den konfigurierten Mux-Endpunkt {{endpoint}}. Modell und Authentifizierung kommen von Mux. Stelle mir die nötigen Fragen und entwirf die Agenten in diesem Entwurf."
});
Object.assign(de.views.agentWizard.access, {"intro": "Wähle den Harness und seine Verbindungseinstellungen. Der Agentenarchitekt verwendet beim Entwerfen dieselbe Konfiguration."});

// Typed inference protocol and authentication editor.
Object.assign(de, {
  "inference": {
    "modelHint": "Wähle ein Modell, das dieser Endpunkt bereitstellt.",
    "title": "Inferenzendpunkt",
    "protocol": "API-Protokoll",
    "baseUrl": "Basis-URL",
    "authentication": "Authentifizierungstyp",
    "name": "Header- / Abfrageparametername",
    "location": "Platzierung der Zugangsdaten",
    "header": "Headerfeld",
    "query": "Abfragezeichenfolge",
    "secret": "Zugangsdaten-Secret",
    "addValue": "Zugangsdatenwert hinzufügen",
    "username": "Benutzernamen-Secret",
    "password": "Passwort-Secret",
    "hint": "Wähle Protokoll und Authentifizierung getrennt. Ollama Cloud verwendet Bearer-Authentifizierung; lokales Ollama benötigt meist keine. Werte werden als verschlüsselte Secrets gespeichert.",
    "invalid": "Gib eine gültige Endpunkt-URL ein und wähle alle erforderlichen Namen und Secrets.",
    "value": "Zugangsdatenwert",
    "auth": {
      "None": "Keine",
      "BearerToken": "Bearer-Token",
      "ApiKey": "API-Schlüssel",
      "Headers": "Headerwerte",
      "QueryString": "Abfrageparameter",
      "Basic": "Basic-Authentifizierung"
    }
  }
});

// Shared runtime connections and the configuration navigation split.
de.runtime = {
  "title": "Harnesses und Endpunkte",
  "connections": "Gespeicherte Verbindungen",
  "templates": "Erweiterte Harness-Vorlagen",
  "connection": "Verbindung",
  "architect": "Architekt",
  "choose": "Architekt oder Verbindung auswählen",
  "harness": "Harness-Vorlage",
  "chooseHarness": "Harness-Vorlage auswählen",
  "manage": "Harnesses und Endpunkte verwalten",
  "configureFirst": "Zuerst eine Verbindung konfigurieren.",
  "sharedHint": "Einmal hier konfigurieren. Architekten und Deployments verweisen auf diese Verbindung; Änderungen gelten beim nächsten Lauf für alle Nutzer.",
  "reuseHint": "Einen bestehenden Architekten verwenden oder mit einer gespeicherten Verbindung erstellen. Zugangsdaten und Endpunktdetails müssen nicht erneut eingegeben werden.",
  "importExport": "Importieren / Exportieren"
};
de.nav.hubs.configuration = {"label": "Agentenressourcen", "tip": "Verbindungseinstellungen für Agenten und Architekten."};
de.nav.hubs.platformConfiguration = {"label": "Plattformkonfiguration", "tip": "Zugangsdaten, Speicher, Preise, Kontingente und Benachrichtigungen."};
de.nav.items.harnessProfiles.label = "Harnesses und Endpunkte";
de.views.agentWizard.access.intro = "Einen bestehenden Architekten verwenden oder mit einer gespeicherten Verbindung erstellen. Zugangsdaten und Endpunktdetails müssen nicht erneut eingegeben werden.";

de.resources.harnessProfiles.title = de.runtime.title;
de.resources.harnessProfiles.subtitle = de.runtime.sharedHint;
de.components.architectHints.harness = de.runtime.sharedHint;
de.components.architectHints.harnessLink = de.runtime.manage;

Object.assign(de.runtime, {"add": "Verbindung hinzufügen", "create": "Verbindung erstellen", "edit": "Verbindung bearbeiten", "view": "Verbindungsdetails"});

de.explainers.harnessProfiles.p2 = de.runtime.sharedHint;
de.explainers.secrets.p2 = de.runtime.sharedHint;

// One connection registry; configuration sections use a menu.
Object.assign(de.runtime, {"title": "Verbindungen", "sharedHint": "Wiederverwendbare Harnesses und API-Endpunkte. Einmal konfigurieren, dann überall auswählen.", "harness": "Verbindungstyp", "chooseHarness": "Harness oder API-Typ auswählen", "customHarness": "Benutzerdefinierter Harness", "advancedLaunch": "Erweiterte Starteinstellungen", "advancedArchitect": "Architektenoptionen (optional)", "pickConnection": "Wähle eine Verbindung. Modell, Endpunkt und Zugangsdaten sind bereits konfiguriert."});
de.nav.hubs.connections = {"label": "Verbindungen", "tip": "Wiederverwendbare Harnesses und API-Endpunkte. Einmal konfigurieren, dann überall auswählen."};
de.nav.hubs.configuration = {"label": "Konfiguration", "tip": "Verwalte Prompts, Assets, Toolserver, Zugangsdaten, Speicher und Richtlinien."};
de.nav.items.harnessProfiles.label = "Verbindungen";
de.resources.harnessProfiles.title = "Verbindungen";
de.components.studio.architect.harnessProfile = de.runtime.connection;

Object.assign(de.runtime, {"emptyTitle": "Noch keine Verbindungen", "apiType": "HTTP-API (Ollama / OpenAI-kompatibel)"});

de.nav.items.manifests.label = de.runtime.importExport;

de.runtime.manage = "Verbindungen verwalten";
de.components.architectHints.harnessLink = de.runtime.manage;
de.explainers.secrets.p2 = "Verbindungen verweisen zur Authentifizierung auf diese Geheimnisse. Aktualisiere den Wert hier, ohne jeden Architekten oder jedes Deployment neu zu konfigurieren.";

de.runtime.launchDefaults = "Diese Verbindung verwendet ihre vorhandene Startkonfiguration. Bei Bedarf unter Erweiterte Starteinstellungen bearbeiten.";

// One horizontal workspace navigation level; the wizard selects connections only.
de.nav.hubs.operations = {"label": "Betrieb", "tip": "Verwalte gespeicherte Ergebnisse, Modellpreise, Nutzungslimits und Benachrichtigungen."};
de.nav.hubs.configuration.tip = "Prompts, Assets, Werkzeuge, Zugangsdaten und Arbeitsbereiche für deine Agenten.";
de.nav.hubs.manifests = { label: de.runtime.importExport, tip: de.tips.nav.tabs.manifests };
de.runtime.choose = "Verbindung auswählen";
de.runtime.reuseHint = "Wähle die Verbindung zum Entwerfen und Ausführen deiner Agenten. Der Assistent richtet seinen Entwurfshelfer automatisch ein.";
de.views.agentWizard.access.intro = de.runtime.reuseHint;

de.views.manifests.title = de.runtime.importExport;

de.views.agentWizard.design.intro = "Beantworten Sie die Fragen des Architekten, um Ihren Agenten zu entwerfen.";

de.views.studio.deleteMultiple = "Mehrere löschen";
de.views.studio.deleteMultipleMessage = "Die {{count}} ausgewählten Entwürfe dauerhaft löschen? Ausstehende Genehmigungen werden abgebrochen. Veröffentlichte Agenten und Bereitstellungen bleiben erhalten.";

de.views.studio.discard = de.common.actions.delete;
de.views.studio.discardTitle = "Entwurf löschen";
de.views.studio.discardMessage = "{{title}} dauerhaft löschen? Veröffentlichte Agenten und Bereitstellungen bleiben erhalten.";
de.views.studio.discardPendingMessage = "{{title}} dauerhaft löschen? Die ausstehende Genehmigung wird abgebrochen. Veröffentlichte Agenten und Bereitstellungen bleiben erhalten.";
de.views.studio.discarded = "{{title}} gelöscht.";

de.components.studio.chat.resize = "Chatgröße ändern";
de.components.studio.chat.resizeHint = "Ziehen Sie, um die Chatgröße zu ändern. Pfeil nach oben oder unten ändert die Höhe, Pos1 setzt sie zurück.";

// Secret reveal (Admin on Secret, audited as SecretRevealed).
de.components.secretReveal = { title: "Geheimniswert anzeigen", warning: "Beim Anzeigen erscheint der gespeicherte Wert im Klartext. Jede Anzeige wird mit Ihrem Namen im Audit-Protokoll festgehalten. Schließen Sie den Dialog, wenn Sie fertig sind; der Wert wird nicht aufbewahrt.", value: "Wert", reveal: "Anzeigen", hide: "Ausblenden" };
de.tips.secretReveal = { reveal: "Den gespeicherten Wert entschlüsseln und anzeigen. Der Server schreibt einen SecretRevealed-Audit-Eintrag.", hide: "Den Wert wieder ausblenden. Erneutes Anzeigen schreibt einen weiteren Audit-Eintrag.", close: "Den Dialog schließen und den angezeigten Wert verwerfen.", value: "Der entschlüsselte Wert, genau wie gespeichert. Behandeln Sie ihn wie ein Passwort.", copy: "Den Wert in die Zwischenablage kopieren." };
de.resources.secrets.actions.reveal = "Anzeigen";
de.tips.resources.secrets.actions.reveal = "Den gespeicherten Wert im Klartext anzeigen. Erfordert Admin auf Secret (SecretManager oder TenantAdmin) und wird im Audit-Protokoll festgehalten.";
de.tips.resources.secrets.revealNoValue = "Dieses Geheimnis hat noch keinen gespeicherten Wert. Verwenden Sie zuerst Wert setzen.";
de.enums.auditEventType.SecretRevealed = "Geheimnis angezeigt";
de.tips.enums.auditEventType.SecretRevealed = "Jemand mit Admin auf Secret hat den entschlüsselten Wert eines Geheimnisses gelesen.";
de.resources.secrets.subtitle = "Verschlüsselte Zugangsdaten für Harnesses und Integrationen. Geheimnisverwalter können Werte anzeigen; jede Anzeige wird protokolliert.";
de.tips.nav.tabs.secrets = "Verschlüsselte API-Schlüssel und Token. Bereitstellungen binden sie über einen Alias; nur Geheimnisverwalter können Werte anzeigen, und jede Anzeige wird protokolliert.";
de.tips.resources.secrets.add = "Neue Zugangsdaten wie einen API-Schlüssel oder ein Token verschlüsselt speichern. Bereitstellungen referenzieren sie über einen Alias; nach dem Speichern können nur Personen mit Admin auf Secret den Wert anzeigen.";
de.tips.resources.secrets.value = "Der geheime Wert. Er wird beim Speichern verschlüsselt. Personen mit Admin auf Secret können ihn anzeigen, und jede Anzeige wird protokolliert.";
de.explainers.secrets.p1 = "Ein Geheimnis ist ein verschlüsselter Wert wie ein API-Schlüssel oder ein Token. Nach dem Speichern können Sie ihn ersetzen oder rotieren. Auslesen dürfen nur Personen mit Admin auf Secret (die Rollen SecretManager und TenantAdmin), und jede Anzeige wird im Audit-Protokoll festgehalten.";

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
})(de, {
 "nav": {
  "hubs": {
   "autonomy": {
    "label": "Autonomie",
    "tip": "Agenten, die selbstständig weiterarbeiten: Wächter wachen nach Zeitplan auf und kümmern sich um einen Dauerauftrag."
   }
  },
  "items": {
   "keepers": {
    "label": "Wächter",
    "tip": "Agenten, die nach Zeitplan aufwachen und sich um einen Dauerauftrag kümmern"
   }
  }
 },
 "enums": {
  "runKind": {
   "Keeper": "Wächter-Zyklus"
  },
  "resourceType": {
   "Mandate": "Wächter (Auftrag)"
  },
  "mandateStatus": {
   "Draft": "Entwurf",
   "Active": "Aktiv",
   "Paused": "Pausiert",
   "Frozen": "Eingefroren",
   "CapReached": "Budget erreicht",
   "Retired": "Außer Dienst"
  },
  "mandateRevisionState": {
   "Draft": "Entwurf",
   "Published": "Veröffentlicht"
  },
  "mandateRevisionSource": {
   "Human": "Mensch",
   "Board": "Gremium",
   "Executive": "Leitung",
   "Architect": "Agent-Architekt"
  },
  "wakeMode": {
   "Fixed": "Festes Intervall",
   "Backoff": "Bei Ruhe verlängern"
  },
  "wakeSource": {
   "Timer": "Zeitplan",
   "Manual": "Von Hand geweckt",
   "Message": "Nachricht",
   "EscalationAnswer": "Eskalation beantwortet",
   "Webhook": "Webhook",
   "Report": "Bericht"
  },
  "tickOutcome": {
   "Quiet": "Ruhig",
   "Acted": "Gehandelt",
   "Attention": "Braucht Aufmerksamkeit",
   "Escalated": "Eskaliert",
   "Failed": "Fehlgeschlagen",
   "Skipped": "Übersprungen",
   "Unreported": "Nicht gemeldet"
  }
 },
 "errorCodes": {
  "MandateActive": "Ein Zyklus dieses Wächters läuft gerade. Warten Sie, bis er fertig ist, pausieren Sie den Wächter oder löschen Sie ihn trotzdem, wodurch der Lauf des Zyklus abgebrochen wird.",
  "MandateNotActive": "Nur ein aktiver Wächter kann geweckt oder pausiert werden.",
  "MandateNotPaused": "Nur ein pausierter Wächter kann fortgesetzt werden.",
  "RemoteAgentUnsupported": "Wächter laufen auf gehosteten Bereitstellungen, daher kann ein Remote-Agent kein Wächter sein.",
  "DeploymentInactive": "Diese Bereitstellung ist inaktiv. Wählen Sie eine aktive Bereitstellung.",
  "DeploymentAgentMismatch": "Diese Bereitstellung gehört zu einem anderen Agenten. Wählen Sie eine Bereitstellung dieses Agenten.",
  "RevisionMismatch": "Diese Revision gehört zu einem anderen Wächter."
 },
 "resources": {
  "runs": {
   "columns": {
    "mandateId": "Wächter"
   }
  },
  "keepers": {
   "title": "Wächter",
   "subtitle": "Agenten, die nach Zeitplan aufwachen, sich um einen Dauerauftrag kümmern und jedes Mal melden, was sie gefunden haben.",
   "add": "Wächter hinzufügen",
   "create": "Wächter erstellen",
   "edit": "Wächter bearbeiten",
   "view": "Wächter-Details",
   "deleteTitle": "Wächter löschen",
   "emptyTitle": "Noch keine Wächter",
   "emptyBody": "Erstellen Sie einen Wächter, damit ein Agent regelmäßig etwas prüft, etwa eine Warteschlange, ein Dashboard oder einen Posteingang, und handelt oder um Hilfe bittet, wenn nötig.",
   "columns": {
    "name": "Name",
    "status": "Status",
    "agent": "Agent",
    "deployment": "Bereitstellung",
    "nextWakeUtc": "Nächstes Aufwachen",
    "currentIntervalSeconds": "Intervall",
    "lastTick": "Letzter Zyklus",
    "tickCount": "Zyklen",
    "currentRevisionNumber": "Revision",
    "runAs": "Läuft als",
    "description": "Beschreibung",
    "id": "ID",
    "createdUtc": "Erstellt"
   },
   "fields": {
    "name": "Name",
    "description": "Beschreibung",
    "agentId": "Agent",
    "deploymentId": "Bereitstellung",
    "objective": "Ziel",
    "healthyDefinition": "Woran man Gesundheit erkennt",
    "autonomy": "Was er selbstständig tun darf",
    "escalationPolicy": "Wann er um Hilfe bitten soll",
    "direction": "Aktuelle Richtung",
    "signals": "Zu beobachtende Signale",
    "signalsItems": {
     "name": "Signal",
     "description": "Bedeutung"
    },
    "wakeMode": "Aufwachmodus",
    "minIntervalSeconds": "Mindestintervall (Sekunden)",
    "maxIntervalSeconds": "Höchstintervall (Sekunden)",
    "backoffFactor": "Verlängerungsfaktor",
    "jitterPercent": "Jitter (Prozent)",
    "budgetPerTickUsd": "Budget pro Zyklus (USD)",
    "budgetPerDayUsd": "Budget pro Tag (USD)",
    "maxTokensPerTick": "Höchstzahl Token pro Zyklus",
    "changeNote": "Änderungsnotiz"
   },
   "hints": {
    "name": "Kleinbuchstaben, Ziffern und Bindestriche.",
    "agentId": "Ein gehosteter Agent. Der Agent lässt sich nach dem Erstellen des Wächters nicht mehr ändern.",
    "deploymentId": "Die aktive Bereitstellung, auf der jeder Zyklus läuft.",
    "objective": "Der Dauerauftrag in einfachen Worten. Der Wächter liest ihn bei jedem Zyklus.",
    "minIntervalSeconds": "Von {{min}} bis {{max}} Sekunden. Die Cluster-Einstellung Autonomy.MinIntervalSeconds kann den Wert anheben.",
    "maxIntervalSeconds": "Von {{min}} bis {{max}} Sekunden. Hier hört die Verlängerung auf zu wachsen.",
    "backoffFactor": "Von {{min}} bis {{max}}. Nach jedem ruhigen Zyklus wird das Intervall mit diesem Faktor multipliziert.",
    "jitterPercent": "Von {{min}} bis {{max}}. Leer verwendet den Cluster-Standard.",
    "budgetPerTickUsd": "Leer bedeutet kein Limit.",
    "budgetPerDayUsd": "Leer bedeutet kein Limit.",
    "maxTokensPerTick": "Eingabe- plus Ausgabe-Token. Leer bedeutet kein Limit.",
    "changeNote": "Warum diese Revision den Wächter ändert. Wird in der Revisionsliste angezeigt."
   },
   "sections": {
    "mandate": "Auftrag",
    "schedule": "Aufwachplan",
    "budgets": "Budgetgrenzen"
   },
   "sectionHints": {
    "mandate": "Beim Speichern werden diese Felder als Revision 1 veröffentlicht und der Aufwachplan startet. Spätere Änderungen laufen über Neue Revision auf der Seite des Wächters.",
    "budgets": "Wird jetzt gespeichert und in einer späteren Version durchgesetzt."
   },
   "errors": {
    "name": "Verwenden Sie 1 bis 64 Kleinbuchstaben, Ziffern und Bindestriche, mit einem Buchstaben oder einer Ziffer am Anfang und Ende.",
    "nameTaken": "Ein anderer Wächter verwendet diesen Namen bereits.",
    "text": "Auf {{max}} Zeichen begrenzt.",
    "agentRequired": "Wählen Sie den Agenten, der diesen Auftrag übernimmt.",
    "deploymentRequired": "Wählen Sie die Bereitstellung, auf der seine Zyklen laufen.",
    "objective": "Beschreiben Sie den Dauerauftrag.",
    "signalsMax": "Eine Revision hat höchstens {{max}} Signale.",
    "signalName": "Signalnamen haben 1 bis {{max}} Zeichen.",
    "signalUnique": "Jedes Signal braucht einen eigenen Namen.",
    "signalsInvalid": "Korrigieren Sie die unten markierten Signale.",
    "interval": "Geben Sie ganze Sekunden von {{min}} bis {{max}} ein.",
    "maxBelowMin": "Das Höchstintervall darf nicht kürzer als das Mindestintervall sein.",
    "backoffFactor": "Geben Sie eine Zahl von {{min}} bis {{max}} ein.",
    "jitterPercent": "Geben Sie eine ganze Zahl von {{min}} bis {{max}} ein.",
    "budget": "Geben Sie einen Betrag von {{min}} bis {{max}} ein.",
    "maxTokens": "Geben Sie eine ganze Zahl von {{min}} bis {{max}} ein."
   },
   "actions": {
    "pause": "Pausieren",
    "resume": "Fortsetzen",
    "wake": "Jetzt wecken",
    "runs": "Läufe anzeigen"
   },
   "toasts": {
    "pause": "{{name}} pausiert.",
    "resume": "{{name}} fortgesetzt. Er wacht jetzt auf.",
    "wake": "{{name}} wacht jetzt auf."
   },
   "units": {
    "seconds_one": "{{count}} Sekunde",
    "seconds_other": "{{count}} Sekunden",
    "minutes_one": "{{count}} min",
    "minutes_other": "{{count}} min",
    "hours_one": "{{count}} Stunde",
    "hours_other": "{{count}} Stunden",
    "days_one": "{{count}} Tag",
    "days_other": "{{count}} Tage"
   },
   "ticking": "Zyklus läuft",
   "neverTicked": "Noch nicht geweckt",
   "addSignal": "Signal hinzufügen",
   "signalNamePlaceholder": "Warteschlangenlänge",
   "editNotice": "Läuft als {{name}}. Beim Speichern werden Sie zum Principal, als der seine Zyklen laufen. Um Ziel oder Zeitplan zu ändern, öffnen Sie den Wächter und verwenden Sie Neue Revision."
  }
 },
 "components": {
  "keeperRevision": {
   "title": "Neue Revision von {{name}}",
   "intro": "Dies wird Revision {{number}}. Mit dem Veröffentlichen wird sie sofort aktuell: Die Verlängerung wird zurückgesetzt und der Wächter wacht jetzt auf.",
   "draft": "Als Entwurf speichern",
   "publish": "Veröffentlichen",
   "drafted": "Revision {{number}} als Entwurf gespeichert.",
   "published": "Revision {{number}} veröffentlicht."
  }
 },
 "views": {
  "runDetail": {
   "keeper": "Wächter"
  },
  "home": {
   "autonomy": {
    "title": "Autonomie",
    "open": "Wächter öffnen",
    "empty": "Noch keine Wächter. Ein Wächter wacht nach Zeitplan auf und kümmert sich um einen Dauerauftrag.",
    "active": "aktiv",
    "paused": "pausiert",
    "ticking": "läuft gerade",
    "nextWake": "Nächstes Aufwachen:",
    "allQuiet": "Kein Wächter braucht Aufmerksamkeit.",
    "attention_one": "{{count}} Wächter braucht Aufmerksamkeit",
    "attention_other": "{{count}} Wächter brauchen Aufmerksamkeit"
   }
  },
  "keeperDetail": {
   "title": "Wächter",
   "heading": "Wächter {{name}}",
   "notFoundTitle": "Wächter nicht gefunden",
   "notFoundBody": "Er wurde möglicherweise gelöscht oder gehört zu einem anderen Mandanten.",
   "live": "Live",
   "polling": "Aktualisierung",
   "newRevision": "Neue Revision",
   "noWake": "Nicht geplant",
   "quietStreak": "Ruhige Zyklen in Folge",
   "activeRun": "Laufender Zyklus",
   "revisionTitle": "Aktuelle Revision",
   "revisionHeading": "Aktuelle Revision ({{number}})",
   "noRevision": "Noch keine Revision veröffentlicht. Verwenden Sie Neue Revision, um eine zu schreiben und zu veröffentlichen.",
   "clusterDefault": "Cluster-Standard",
   "noLimit": "Kein Limit",
   "ticks": "Zyklen",
   "outcomeFilter": "Ergebnis",
   "allOutcomes": "Alle Ergebnisse",
   "noTicksTitle": "Noch keine Zyklen",
   "noTicksActive": "Der erste Zyklus beginnt beim nächsten Aufwachen. Mit Jetzt wecken starten Sie sofort einen.",
   "noTicksBody": "Zyklen erscheinen hier, sobald der Wächter aktiv ist und aufwacht.",
   "chartTitle": "Intervall nach jedem Zyklus",
   "chartHelp": "Minuten bis zum nächsten Aufwachen, so wie beim Ende jedes Zyklus festgelegt. Ruhige Zyklen verlängern es im Modus Backoff.",
   "chartSeries": "Intervall (Minuten)",
   "columns": {
    "started": "Gestartet",
    "source": "Geweckt durch",
    "outcome": "Ergebnis",
    "run": "Lauf",
    "interval": "Nächstes Intervall",
    "cost": "Kosten",
    "summary": "Zusammenfassung",
    "number": "Nummer",
    "state": "Zustand",
    "revisionSource": "Quelle",
    "author": "Autor",
    "changeNote": "Änderungsnotiz",
    "created": "Erstellt"
   },
   "requested": "{{interval}} angefordert",
   "revisions": "Revisionen",
   "noRevisions": "Noch keine Revisionen.",
   "current": "Aktuell",
   "diff": "Vergleichen",
   "diffTitle": "Revision {{number}} im Vergleich zur vorherigen",
   "diffFirst": "Dies ist die erste Revision, daher ist alles darin neu.",
   "revisionLabel": "Revision {{number}}",
   "nothing": "Nichts",
   "confirmDelete": "Wächter {{name}} mit seinen Revisionen und seinem Zyklusverlauf löschen? Seine bisherigen Läufe bleiben erhalten.",
   "confirmForceDelete": "Ein Zyklus von {{name}} läuft gerade. Den Wächter trotzdem löschen und den Lauf dieses Zyklus abbrechen?",
   "forceDelete": "Löschen und Zyklus abbrechen",
   "changeNote": "Änderungsnotiz: {{note}}"
  }
 },
 "tips": {
  "nav": {
   "hubs": {
    "autonomy": "Agenten, die zwischen Anfragen selbstständig arbeiten. Wächter wachen nach Zeitplan auf, prüfen einen Dauerauftrag und handeln oder bitten um Hilfe."
   },
   "tabs": {
    "keepers": "Wächter: Agenten, die nach Zeitplan aufwachen und sich um einen Dauerauftrag kümmern, mit ihren Zyklen und Revisionen."
   }
  },
  "enums": {
   "runKind": {
    "Keeper": "Vom Aufwachen eines Wächters gestartet. Der Lauf ist ein Zyklus dieses Wächters und verweist auf ihn zurück."
   },
   "resourceType": {
    "Mandate": "Wächter (Aufträge): die Daueraufträge, um die sich Agenten nach einem Aufwachplan kümmern, mit ihren Revisionen und Zyklen."
   },
   "mandateStatus": {
    "Draft": "Ohne veröffentlichte Revision erstellt und wacht daher noch nicht auf. Veröffentlichen Sie eine Revision, um ihn zu starten.",
    "Active": "Wacht nach seinem Zeitplan auf. Jedes Aufwachen startet einen Zyklus, einen Lauf seiner Bereitstellung.",
    "Paused": "Wacht nicht auf, bis ihn jemand fortsetzt. Beim Fortsetzen wacht er sofort mit zurückgesetztem Intervall auf.",
    "Frozen": "Von einem Administrator oder einer Richtlinie gestoppt. Er wacht erst wieder auf, wenn er aufgetaut wird.",
    "CapReached": "Sein Tagesbudget ist aufgebraucht. Er wacht wieder auf, sobald der nächste UTC-Tag beginnt.",
    "Retired": "Nicht mehr in Gebrauch. Er behält seinen Verlauf und wacht nie wieder auf."
   },
   "mandateRevisionState": {
    "Draft": "Gespeichert, aber nicht in Gebrauch. Veröffentlichen Sie sie, um sie zur aktuellen Revision des Wächters zu machen.",
    "Published": "War oder ist in Gebrauch. Veröffentlichte Revisionen ändern sich nie; schreiben Sie stattdessen eine neue Revision."
   },
   "mandateRevisionSource": {
    "Human": "Von einer Person im Dashboard, über die API oder in einem Manifest geschrieben.",
    "Board": "Von einem Gremium aus Agenten festgelegt, das diesen Wächter beaufsichtigt.",
    "Executive": "Von einem leitenden Agenten festgelegt, der diesen Wächter steuert.",
    "Architect": "Vom Agent-Architekten aus einem Studio-Entwurf geschrieben."
   },
   "wakeMode": {
    "Fixed": "Wacht alle Mindestintervalle auf, unabhängig davon, was der letzte Zyklus gefunden hat.",
    "Backoff": "Wartet nach jedem ruhigen Zyklus länger, bis zum Höchstintervall, und kehrt zum Minimum zurück, sobald etwas passiert."
   },
   "wakeSource": {
    "Timer": "Der Aufwachplan war fällig, also ist der Wächter von selbst aufgewacht.",
    "Manual": "Jemand hat Jetzt wecken verwendet oder den Wächter fortgesetzt.",
    "Message": "Für den Wächter ist eine Nachricht eingetroffen.",
    "EscalationAnswer": "Jemand hat eine vom Wächter eskalierte Frage beantwortet.",
    "Webhook": "Ein anderes System hat den Webhook des Wächters aufgerufen.",
    "Report": "Der Bericht eines anderen Agenten hat diesen Wächter um einen Blick gebeten."
   },
   "tickOutcome": {
    "Quiet": "Alles war in Ordnung und nichts musste getan werden. Im Modus Backoff kommt das nächste Aufwachen später.",
    "Acted": "Der Wächter hat etwas geändert, um den Auftrag in Ordnung zu halten.",
    "Attention": "Der Wächter hat etwas gefunden, das sich eine Person ansehen sollte.",
    "Escalated": "Der Wächter hat eine Person oder einen anderen Agenten um eine Entscheidung gebeten.",
    "Failed": "Der Lauf des Zyklus ist fehlgeschlagen, hat das Zeitlimit überschritten oder wurde abgebrochen.",
    "Skipped": "Ein Aufwachen kam, während der vorherige Zyklus noch lief, deshalb wurde es übersprungen und das nächste wartet auf ihn.",
    "Unreported": "Der Lauf endete ohne Ergebnismeldung, daher braucht der Wächter möglicherweise ein klareres Ziel."
   }
  },
  "resources": {
   "runs": {
    "mandateId": "Der Wächter, der diesen Lauf als einen seiner Zyklen gestartet hat, falls vorhanden. Klicken Sie darauf, um den Wächter zu öffnen.",
    "openKeeper": "Den Wächter öffnen, dessen Zyklus dieser Lauf ist."
   },
   "keepers": {
    "add": "Einen Wächter erstellen: Wählen Sie einen gehosteten Agenten und eine Bereitstellung, beschreiben Sie den Dauerauftrag und legen Sie fest, wie oft er aufwacht.",
    "name": "Ein eindeutiger Name in diesem Mandanten, verwendet in URLs, Manifesten und der API.",
    "status": "Ob der Wächter nach seinem Zeitplan aufwacht (Aktiv) oder wartet, pausiert, eingefroren oder außer Dienst ist.",
    "agent": "Der gehostete Agent, der diesen Auftrag übernimmt. Jeder Zyklus führt diesen Agenten aus.",
    "deployment": "Die Bereitstellung, auf der jeder Zyklus läuft und die Harness, Modell und Werkzeuge festlegt.",
    "nextWakeUtc": "Wann der nächste Zyklus beginnt. Zeigen Sie mit der Maus darauf für die genaue Zeit.",
    "currentIntervalSeconds": "Die Wartezeit nach dem letzten Zyklus. Im Modus Backoff wächst sie nach ruhigen Zyklen.",
    "lastTick": "Wann der Wächter zuletzt aufgewacht ist und was dieser Zyklus gemeldet hat.",
    "tickCount": "Wie viele Zyklen der Wächter insgesamt ausgeführt hat.",
    "currentRevisionNumber": "Die veröffentlichte Revision, der der Wächter jetzt folgt.",
    "runAs": "Der Benutzer oder die Anmeldedaten, mit deren Berechtigungen jeder Zyklus läuft: wer den Wächter zuletzt gespeichert hat.",
    "description": "Notizen für Menschen. Der Wächter liest dies nicht, er liest das Ziel.",
    "id": "Die Kennung des Wächters, verwendet in der API und in Laufdatensätzen.",
    "createdUtc": "Wann der Wächter erstellt wurde.",
    "agentId": "Der gehostete Agent, der diesen Auftrag übernimmt. Remote-Agenten können keine Wächter sein. Nach dem Erstellen nicht mehr änderbar.",
    "deploymentId": "Die aktive Bereitstellung dieses Agenten, auf der jeder Zyklus läuft.",
    "objective": "Der Dauerauftrag in einfachen Worten, zum Beispiel: Halte die Support-Warteschlange unter 20 offenen Tickets. Der Wächter liest ihn bei jedem Zyklus.",
    "healthyDefinition": "Wie ein guter Zustand aussieht, damit der Wächter einen ruhigen Zyklus von einem unterscheiden kann, der Handeln erfordert.",
    "autonomy": "Was der Wächter selbstständig ändern darf, ohne jemanden zu fragen.",
    "escalationPolicy": "Wann der Wächter anhalten und eine Person oder einen anderen Agenten um eine Entscheidung bitten soll.",
    "direction": "Kurzfristige Hinweise, die sich oft ändern können, etwa ein Schwerpunkt für diese Woche.",
    "signals": "Benannte Messwerte, die der Wächter bei jedem Zyklus prüfen soll, mit ihrer jeweiligen Bedeutung.",
    "signalsItems": {
     "name": "Ein kurzer Name für den Messwert, eindeutig innerhalb der Revision.",
     "description": "Was der Messwert bedeutet und welche Werte besorgniserregend sind."
    },
    "wakeMode": "Fest wacht jedes Mal im Mindestintervall auf. Backoff wartet nach ruhigen Zyklen länger.",
    "minIntervalSeconds": "Die kürzeste Wartezeit zwischen geplanten Aufwachvorgängen, in Sekunden.",
    "maxIntervalSeconds": "Die längste Wartezeit zwischen geplanten Aufwachvorgängen im Modus Backoff, in Sekunden.",
    "backoffFactor": "Um wie viel die Wartezeit nach jedem ruhigen Zyklus im Modus Backoff wächst. 2 verdoppelt sie.",
    "jitterPercent": "Eine zufällige Verzögerung von bis zu diesem Prozentsatz des Intervalls, damit viele Wächter nicht im selben Moment aufwachen.",
    "budgetPerTickUsd": "Das Maximum, das ein Zyklus in US-Dollar kosten darf.",
    "budgetPerDayUsd": "Das Maximum, das die Zyklen dieses Wächters pro UTC-Tag in US-Dollar kosten dürfen.",
    "maxTokensPerTick": "Die höchste Zahl an Eingabe- und Ausgabe-Token, die ein Zyklus verbrauchen darf.",
    "changeNote": "Eine kurze Notiz, warum diese Revision den Wächter ändert, aufbewahrt bei der Revision.",
    "sections": {
     "mandate": "Wofür der Wächter zuständig ist und wie viel er selbstständig tun darf.",
     "schedule": "Wie oft der Wächter aufwacht und wie sich die Wartezeit nach ruhigen Zyklen ändert.",
     "budgets": "Grenzen dafür, was die Zyklen des Wächters kosten und verbrauchen dürfen."
    },
    "actions": {
     "pause": "Diesen Wächter nicht mehr wecken. Ein laufender Zyklus wird beendet; bis zum Fortsetzen startet kein neuer.",
     "resume": "Diesen Wächter wieder wecken. Er wacht sofort auf, sein Intervall wird auf das Minimum zurückgesetzt.",
     "wake": "Jetzt einen Zyklus starten, statt auf den Zeitplan zu warten. Läuft bereits ein Zyklus, startet der neue danach.",
     "runs": "Die Seite Läufe, gefiltert auf die Zyklen dieses Wächters, öffnen."
    },
    "ticking": "Ein Zyklus dieses Wächters läuft gerade."
   }
  },
  "keeperRevision": {
   "done": "Diesen Dialog schließen. Die Revision wurde mit den oben aufgeführten angepassten Werten gespeichert.",
   "draft": "Diese Revision als Entwurf speichern, ohne sie zu verwenden. Veröffentlichen Sie sie später in der Revisionsliste.",
   "publish": "Diese Revision speichern und sofort aktuell machen. Die Verlängerung wird zurückgesetzt und der Wächter wacht sofort auf."
  },
  "views": {
   "runDetail": {
    "keeper": "Der Wächter, der diesen Lauf als einen seiner Zyklen gestartet hat.",
    "openKeeper": "Den Wächter mit seinen Zyklen und Revisionen öffnen."
   },
   "home": {
    "autonomy": {
     "title": "Wächter in diesem Mandanten und diejenigen, deren letzter Zyklus eine Person braucht.",
     "open": "Die Seite Wächter öffnen, um Wächter zu erstellen, zu pausieren, zu wecken oder zu bearbeiten.",
     "active": "Wächter, die nach ihrem Zeitplan aufwachen.",
     "paused": "Wächter, die nicht aufwachen, bis sie jemand fortsetzt.",
     "ticking": "Wächter, bei denen gerade ein Zyklus läuft.",
     "nextWake": "Das früheste geplante Aufwachen unter den aktiven Wächtern.",
     "attention": "Wächter, deren letzter Zyklus Aufmerksamkeit braucht, eskaliert, fehlgeschlagen oder nicht gemeldet wurde, sowie Wächter, die durch ein Budget oder Einfrieren gestoppt wurden.",
     "openKeeper": "Die Seite dieses Wächters öffnen, um seine Zyklen zu sehen."
    }
   },
   "keeperDetail": {
    "openRun": "Die Detailseite dieses Laufs öffnen: sein Transkript, Werkzeugaufrufe und Ergebnis.",
    "live": "Aktualisierungen kommen über die Live-Verbindung, wenn Zyklen starten und enden.",
    "polling": "Die Live-Verbindung ist nicht verfügbar, daher liest die Seite den Wächter alle paar Sekunden neu ein.",
    "viewJson": "Den Wächter-Datensatz mit seiner aktuellen Revision als JSON anzeigen.",
    "newRevision": "Eine neue Revision von Ziel, Zeitplan oder Budgets schreiben, ausgehend von der aktuellen.",
    "delete": "Diesen Wächter mit seinen Revisionen und seinem Zyklusverlauf löschen. Seine bisherigen Läufe bleiben erhalten.",
    "forceDelete": "Den Wächter löschen und den Lauf des laufenden Zyklus abbrechen.",
    "openAgent": "Den Agenten öffnen, den dieser Wächter ausführt.",
    "quietStreak": "Wie viele Zyklen in Folge nichts zu tun fanden. Im Modus Backoff verlängert jeder die Wartezeit.",
    "activeRun": "Der Lauf des laufenden Zyklus, falls einer läuft.",
    "revisionTitle": "Die veröffentlichte Revision, der der Wächter bei jedem Zyklus folgt.",
    "ticks": "Jedes Aufwachen dieses Wächters, neueste zuerst: was ihn geweckt hat, was er gefunden hat und welche Wartezeit er festgelegt hat.",
    "outcomeFilter": "Nur Zyklen mit diesem Ergebnis anzeigen.",
    "outcomeCounts": "Wie viele Zyklen auf dieser Seite jedes Ergebnis hatten.",
    "chart": "Die Wartezeit nach jedem Zyklus auf dieser Seite, älteste links. Sie wächst nach ruhigen Zyklen im Modus Backoff und wird zurückgesetzt, wenn etwas passiert.",
    "columns": {
     "started": "Wann der Zyklus gestartet wurde. Zeigen Sie mit der Maus darauf für die genaue Zeit.",
     "source": "Was den Wächter für diesen Zyklus geweckt hat.",
     "outcome": "Was der Zyklus gemeldet hat: ruhig, gehandelt, braucht Aufmerksamkeit, eskaliert oder fehlgeschlagen.",
     "run": "Der Lauf, der den Zyklus ausgeführt hat.",
     "interval": "Die Wartezeit bis zum nächsten Aufwachen, so wie beim Ende dieses Zyklus festgelegt.",
     "cost": "Was der Lauf des Zyklus gekostet hat, laut Modellpreisliste.",
     "summary": "Was der Wächter gefunden oder getan hat, oder der Fehler, der den Zyklus gestoppt hat.",
     "number": "Die Revisionsnummer. Die aktuelle ist markiert.",
     "state": "Entwurfsrevisionen sind gespeichert, aber nicht in Gebrauch; veröffentlichte waren oder sind in Gebrauch.",
     "revisionSource": "Wer die Revision geschrieben hat: eine Person, der Agent-Architekt oder ein beaufsichtigender Agent.",
     "author": "Der Benutzer oder die Anmeldedaten, die die Revision gespeichert haben.",
     "changeNote": "Warum die Revision den Wächter geändert hat.",
     "created": "Wann die Revision gespeichert wurde."
    },
    "requested": "Der Wächter hat diese Wartezeit angefordert; der Server hält sie innerhalb von Mindest- und Höchstintervall.",
    "revisions": "Jede Revision dieses Wächters, neueste zuerst. Vergleichen Sie eine mit der vorherigen oder veröffentlichen Sie einen Entwurf.",
    "current": "Die Revision, der der Wächter jetzt folgt.",
    "diff": "Zeigen, was diese Revision gegenüber der vorherigen geändert hat."
   }
  }
 },
 "explainers": {
  "keepers": {
   "title": "Wächter",
   "p1": "Ein Wächter ist ein Agent mit einem Dauerauftrag, seinem Auftrag. Er wacht nach Zeitplan auf, prüft den Stand der Dinge, handelt im Rahmen dessen, was er selbstständig tun darf, und meldet jedes Mal ein kurzes Ergebnis. Jedes Aufwachen ist ein Zyklus, und jeder Zyklus ist ein Lauf der Bereitstellung des Wächters.",
   "p2": "Im Modus Backoff verschiebt ein ruhiger Zyklus das nächste Aufwachen nach hinten, bis zum Höchstintervall, und alles andere bringt es auf das Minimum zurück. Es läuft immer nur ein Zyklus: Ein Aufwachen, das während eines Zyklus eintrifft, wartet auf dessen Ende.",
   "p3": "Änderungen an Ziel, Zeitplan oder Budgets sind Revisionen. Das Veröffentlichen einer Revision macht sie sofort aktuell und weckt den Wächter, und jede Revision bleibt zum Vergleichen im Verlauf."
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
})(de, {
 "nav": {
  "hubs": {
   "autonomy": {
    "tip": "Agenten, die selbstständig weiterarbeiten: Wächter wachen nach Zeitplan auf und kümmern sich um eine dauerhafte Aufgabe, und Eskalationen sind die Fragen, die sie Menschen stellen."
   }
  },
  "items": {
   "escalations": {
    "label": "Eskalationen",
    "tip": "Fragen, die Agenten einer Person, einer Rolle oder einem anderen Agenten gestellt haben, und die Antworten"
   }
  },
  "escalationsOpen_one": "{{count}} Eskalation wartet auf eine Antwort",
  "escalationsOpen_other": "{{count}} Eskalationen warten auf eine Antwort"
 },
 "enums": {
  "resourceType": {
   "Escalation": "Eskalation"
  },
  "notificationEvent": {
   "EscalationRaised": "Eskalation gestellt",
   "EscalationExpired": "Eskalation abgelaufen"
  },
  "escalationStatus": {
   "Open": "Offen",
   "Answered": "Beantwortet",
   "Expired": "Abgelaufen",
   "Cancelled": "Abgebrochen",
   "Withdrawn": "Zurückgezogen"
  },
  "escalationSeverity": {
   "Info": "Info",
   "Warning": "Warnung",
   "Urgent": "Dringend"
  },
  "escalationMode": {
   "NonBlocking": "Nicht blockierend",
   "Blocking": "Blockierend"
  },
  "escalationTargetKind": {
   "User": "Benutzer",
   "Role": "Rolle",
   "Agent": "Agent",
   "Manager": "Vorgesetzter"
  },
  "escalationTimeoutAction": {
   "UseDefaultAnswer": "Standardantwort verwenden",
   "Cancel": "Abbrechen",
   "EscalateUp": "Weiter eskalieren"
  },
  "escalationResolutionSource": {
   "User": "Eine Person",
   "Agent": "Ein Agent",
   "Timeout": "Zeitüberschreitung",
   "Raiser": "Der auslösende Lauf",
   "System": "Garrison"
  }
 },
 "components": {
  "escalations": {
   "passedUp": "Weiter eskaliert",
   "answerTitle": "{{agent}} antworten",
   "submit": "Antwort senden",
   "expires": "Läuft {{when}} ab, dann: {{action}}",
   "question": "Frage",
   "context": "Kontext",
   "choice": "Option wählen",
   "default": "Standard",
   "defaultAnswer": "Standardantwort: {{answer}}",
   "explain": "Erläuterung (optional)",
   "text": "Antwort",
   "textPlaceholder": "Schreiben Sie Ihre Antwort. Der Agent liest sie als Daten, nicht als Anweisungen.",
   "errors": {
    "choice": "Wählen Sie eine der Optionen.",
    "unknownChoice": "Diese Option bietet die Eskalation nicht an.",
    "text": "Schreiben Sie eine Antwort.",
    "textMax": "Die Antwort ist auf {{max}} Zeichen begrenzt."
   },
   "toasts": {
    "answered": "Antwort an {{agent}} gesendet.",
    "passedUp": "Diese Eskalation wurde an eine andere weitergegeben. Beantworten Sie stattdessen diese.",
    "notOpen": "Jemand anderes hat zuerst geantwortet, oder sie ist abgelaufen.",
    "forbidden": "Zum Antworten benötigen Sie Update auf Escalation."
   }
  }
 },
 "resources": {
  "escalations": {
   "title": "Eskalationen",
   "subtitle": "Fragen, die Agenten einer Person, einer Rolle oder einem anderen Agenten gestellt haben. Offene warten auf eine Antwort; blockierende halten ihren Lauf bis dahin an.",
   "add": "Eskalation hinzufügen",
   "create": "Eskalation erstellen",
   "edit": "Eskalation bearbeiten",
   "view": "Eskalationsdetails",
   "deleteTitle": "Eskalation löschen",
   "emptyTitle": "Keine Eskalationen",
   "emptyBody": "Eine Eskalation erscheint, wenn ein Agent mit garrison_escalate eine Person, eine Rolle oder einen anderen Agenten um eine Entscheidung bittet.",
   "columns": {
    "createdUtc": "Gestellt",
    "severity": "Schweregrad",
    "status": "Status",
    "question": "Frage",
    "agent": "Agent",
    "target": "Adressiert an",
    "expiresUtc": "Läuft ab",
    "answer": "Antwort",
    "mode": "Modus",
    "mandate": "Wächter",
    "resolvedBy": "Beantwortet von",
    "resolutionSource": "Erledigt durch",
    "resolvedUtc": "Erledigt",
    "raisingRunId": "Auslösender Lauf",
    "id": "ID"
   },
   "filters": {
    "targetKind": "Adressiert an"
   },
   "fields": {
    "status": "Status",
    "severity": "Schweregrad",
    "mode": "Modus",
    "target": "Adressiert an",
    "agent": "Gestellt von",
    "raisingRunId": "Auslösender Lauf",
    "mandate": "Wächter",
    "mandateTickId": "Wächter-Tick",
    "routedRunId": "Antwortender Lauf",
    "parentEscalationId": "Eskaliert von",
    "escalatedToId": "Eskaliert an",
    "timeoutAction": "Bei Ablauf",
    "expiresUtc": "Läuft ab",
    "createdUtc": "Gestellt",
    "leaseEpoch": "Lease-Epoche",
    "context": "Kontext",
    "options": "Optionen",
    "answerChoice": "Auswahl",
    "answerText": "Antwort",
    "resolvedBy": "Beantwortet von",
    "resolutionSource": "Erledigt durch",
    "resolvedUtc": "Erledigt"
   },
   "actions": {
    "answer": "Antworten",
    "openEscalatedTo": "Weitergegebene Eskalation öffnen",
    "openRun": "Auslösenden Lauf öffnen",
    "openKeeper": "Wächter öffnen",
    "cancel": "Eskalation abbrechen"
   },
   "cancelTitle": "Diese Eskalation abbrechen?",
   "cancelMessage": "{{agent}} erhält keine Antwort. Die Eskalation bleibt als Abgebrochen erhalten.",
   "cancelBlocking": "{{agent}} wartet auf diese Antwort. Wenn Sie die Eskalation abbrechen, wird auch dieser Lauf abgebrochen.",
   "toasts": {
    "cancelled": "Eskalation abgebrochen."
   }
  },
  "keepers": {
   "fields": {
    "escalationTargetKind": "Eskalieren an",
    "escalationTargetId": "Eskalationsziel"
   },
   "noEscalationTarget": "Die Person, die die Revision gespeichert hat",
   "escalationTargetPlaceholder": "ID oder Name des Benutzers, der Rolle oder des Agenten",
   "errors": {
    "escalationTargetId": "Nennen Sie den Benutzer, die Rolle oder den Agenten, an den eskaliert wird."
   }
  },
  "notifications": {
   "fields": {
    "escalationMinimumSeverity": "Mindestschweregrad für Eskalationen"
   },
   "anySeverity": "Jeder Schweregrad"
  }
 },
 "views": {
  "escalationDetail": {
   "title": "Eskalation",
   "titleWithAgent": "Eskalation von {{agent}}",
   "notFoundTitle": "Eskalation nicht gefunden",
   "notFoundBody": "Sie existiert in diesem Mandanten nicht oder wurde mit ihrem Mandanten gelöscht.",
   "back": "Zurück zu den Eskalationen",
   "open": "Diese Eskalation wartet auf eine Antwort.",
   "openBlocking": "Der auslösende Lauf ist angehalten, bis diese Eskalation beantwortet ist.",
   "expires": "Sie läuft {{when}} ab, dann: {{action}}.",
   "passedUp": "Niemand hat rechtzeitig geantwortet, daher wurde diese Eskalation weitergegeben. Beantworten Sie die neue:",
   "question": "Frage",
   "chosen": "Gewählt",
   "answer": "Antwort"
  },
  "home": {
   "escalations": {
    "title_one": "{{count}} Eskalation wartet auf eine Antwort",
    "title_other": "{{count}} Eskalationen warten auf eine Antwort",
    "open": "Eskalationen öffnen",
    "more_one": "Und {{count}} weitere.",
    "more_other": "Und {{count}} weitere."
   }
  }
 },
 "tips": {
  "nav": {
   "escalationsBadge_one": "{{count}} Eskalation wartet auf eine Antwort. Öffnen Sie Autonomie und dann Eskalationen.",
   "escalationsBadge_other": "{{count}} Eskalationen warten auf eine Antwort. Öffnen Sie Autonomie und dann Eskalationen.",
   "tabs": {
    "escalations": "Eskalationen: Fragen, die Agenten einer Person, einer Rolle oder einem anderen Agenten gestellt haben, offene zuerst, mit Antworten und Abbrechen."
   }
  },
  "enums": {
   "resourceType": {
    "Escalation": "Fragen, die Läufe einer Person, einer Rolle oder einem anderen Agenten stellen, und ihre Antworten."
   },
   "notificationEvent": {
    "EscalationRaised": "Ein Agent hat eine Eskalation gestellt. Endpunkte können solche unter einem Mindestschweregrad auslassen.",
    "EscalationExpired": "Eine Eskalation ist abgelaufen, bevor jemand geantwortet hat."
   },
   "escalationStatus": {
    "Open": "Wartet auf eine Antwort. Eine blockierende Eskalation hält ihren Lauf bis dahin an.",
    "Answered": "Jemand hat geantwortet; der auslösende Lauf oder Wächter hat die Antwort erhalten.",
    "Expired": "Niemand hat vor dem Ablauf geantwortet, und die Ablaufaktion wurde ausgeführt.",
    "Cancelled": "Eine Person hat sie abgebrochen; ein darauf wartender Lauf wurde ebenfalls abgebrochen.",
    "Withdrawn": "Der Agent, der sie gestellt hat, hat die Frage zurückgezogen."
   },
   "escalationSeverity": {
    "Info": "Zur Information: antworten, wenn es passt.",
    "Warning": "Braucht bald eine Entscheidung. Das ist der Standardschweregrad.",
    "Urgent": "Braucht sofort eine Entscheidung. Steht zuerst und geht an jeden abonnierten Endpunkt."
   },
   "escalationMode": {
    "NonBlocking": "Der Lauf arbeitet weiter und holt die Antwort später ab; ein Wächter erhält sie im nächsten Tick.",
    "Blocking": "Der Lauf wird angehalten, bis jemand antwortet, und setzt dann mit der Antwort fort."
   },
   "escalationTargetKind": {
    "User": "Eine Person, per Benutzer-ID oder E-Mail.",
    "Role": "Jeder mit dieser Rolle, der Eskalationen aktualisieren darf.",
    "Agent": "Ein anderer Agent: Ein Lauf seiner aktiven Standardbereitstellung erhält die Frage.",
    "Manager": "Der Vorgesetzte des Agenten in einer Organisation. Erst mit Organisationen verfügbar."
   },
   "escalationTimeoutAction": {
    "UseDefaultAnswer": "Mit der Standardantwort antworten, wenn niemand rechtzeitig antwortet.",
    "Cancel": "Die Eskalation und einen darauf wartenden Lauf abbrechen, wenn niemand rechtzeitig antwortet.",
    "EscalateUp": "Die Frage an das Standardziel des Wächters weitergeben, wenn niemand rechtzeitig antwortet."
   },
   "escalationResolutionSource": {
    "User": "Eine Person hat geantwortet oder abgebrochen.",
    "Agent": "Ein anderer Agent hat mit garrison_answer_escalation geantwortet.",
    "Timeout": "Die Ablaufaktion hat sie erledigt.",
    "Raiser": "Der Lauf, der sie gestellt hat, hat sie zurückgezogen.",
    "System": "Garrison hat sie erledigt, zum Beispiel als ihr Lauf endete."
   }
  },
  "components": {
   "escalations": {
    "passedUp": "Niemand hat rechtzeitig geantwortet, daher ging die Frage an eine andere Eskalation. Beantworten Sie diese.",
    "submit": "Antwort senden. Ein angehaltener Lauf setzt fort, und ein Wächter wacht damit auf.",
    "question": "Die Frage genau so, wie der Agent sie geschrieben hat.",
    "context": "Was der Agent zur Lage gesagt hat. Es ist Text des Agenten, keine Anweisung an Sie.",
    "choice": "Der Agent bietet diese Optionen an. Wählen Sie eine.",
    "defaultChoice": "Die Standardantwort: Sie gilt, wenn die Eskalation mit Standardantwort verwenden abläuft.",
    "pickChoice": "Diese Option wählen.",
    "explain": "Optionaler Text zu Ihrer Wahl, zum Beispiel warum Sie so entschieden haben.",
    "text": "Ihre Antwort. Der Agent erhält sie als Daten."
   }
  },
  "resources": {
   "escalations": {
    "createdUtc": "Wann der Agent sie gestellt hat. Für die genaue Zeit darauf zeigen.",
    "severity": "Wie dringend der Agent sie einstuft.",
    "status": "Offen, beantwortet, abgelaufen, abgebrochen oder zurückgezogen.",
    "question": "Was der Agent gefragt hat, wie er es geschrieben hat. Für die ganze Frage darauf zeigen.",
    "agent": "Der Agent, dessen Lauf sie gestellt hat.",
    "target": "An wen sie gerichtet ist: einen Benutzer, eine Rolle oder einen anderen Agenten.",
    "expiresUtc": "Wann sie abläuft, wenn niemand antwortet.",
    "answer": "Die gewählte Option oder der Antworttext.",
    "mode": "Blockierende Eskalationen halten ihren Lauf bis zur Antwort an; nicht blockierende nicht.",
    "mandate": "Der Wächter, dessen Tick sie gestellt hat, falls vorhanden.",
    "resolvedBy": "Wer geantwortet oder abgebrochen hat.",
    "resolutionSource": "Was sie erledigt hat: eine Person, ein Agent, der Ablauf oder der auslösende Lauf.",
    "resolvedUtc": "Wann sie beantwortet, abgebrochen, zurückgezogen wurde oder abgelaufen ist.",
    "raisingRunId": "Der Lauf, der sie gestellt hat. Über das Zeilenmenü öffnen.",
    "id": "Die Eskalations-ID (esc_...), für die API und die MCP-Tools.",
    "routedRunId": "Der Lauf, der gestartet wurde, damit ein anderer Agent antworten kann.",
    "mandateTickId": "Der Wächter-Tick, der sie gestellt hat.",
    "parentEscalationId": "Die Eskalation, die abgelaufen ist und an diese weitergegeben wurde.",
    "escalatedToId": "Die Eskalation, an die diese bei Ablauf weitergegeben wurde.",
    "timeoutAction": "Was passiert, wenn niemand rechtzeitig antwortet.",
    "leaseEpoch": "Die Lease-Epoche des Laufs beim Stellen der Eskalation. Ein blockierendes Warten gehört zu dieser Epoche.",
    "context": "Was der Agent zur Lage gesagt hat. Es ist Text des Agenten, keine Anweisung an Sie.",
    "options": "Die Antworten, die der Agent anbietet. Die Standardantwort gilt bei Ablauf mit Standardantwort verwenden.",
    "answerChoice": "Die gewählte Option.",
    "answerText": "Der Text der Antwort.",
    "actions": {
     "answer": "Diese Eskalation mit einer ihrer Optionen oder freiem Text beantworten.",
     "openEscalatedTo": "Die Eskalation öffnen, an die diese weitergegeben wurde.",
     "openRun": "Den Lauf öffnen, der sie gestellt hat.",
     "openKeeper": "Den Wächter öffnen, dessen Tick sie gestellt hat.",
     "cancel": "Ohne Antwort abbrechen. Ein darauf wartender Lauf wird ebenfalls abgebrochen."
    }
   },
   "keepers": {
    "escalationTargetKind": "An wen die Eskalationen dieses Wächters gehen, wenn er niemanden nennt, und wohin abgelaufene weitergegeben werden.",
    "escalationTargetId": "Benutzer-ID oder E-Mail, Rollenname oder Agenten-ID bzw. -Name, an den eskaliert wird."
   },
   "notifications": {
    "escalationMinimumSeverity": "Eskalationsereignisse nur ab diesem Schweregrad senden. Gilt für Eskalation gestellt und Eskalation abgelaufen."
   }
  },
  "views": {
   "escalationDetail": {
    "openRun": "Diesen Lauf öffnen.",
    "openEscalation": "Diese Eskalation öffnen.",
    "back": "Zurück zur Liste der Eskalationen.",
    "viewJson": "Die Eskalation so anzeigen, wie die API sie liefert.",
    "question": "Frage und Kontext, wie der Agent sie geschrieben hat, und die angebotenen Optionen.",
    "answer": "Wie die Eskalation erledigt wurde.",
    "openAgent": "Den Agenten öffnen, der sie gestellt hat.",
    "openKeeper": "Den Wächter öffnen, dessen Tick sie gestellt hat."
   },
   "home": {
    "escalations": {
     "title": "Eskalationen, die auf eine Antwort warten, die dringendsten zuerst.",
     "open": "Die Eskalationsliste öffnen."
    }
   }
  },
  "filters": {
   "severity": "Nur Eskalationen dieses Schweregrads anzeigen. Wählen Sie Alle, um den Filter zu entfernen.",
   "targetKind": "Nur Eskalationen an Benutzer, Rollen oder Agenten anzeigen. Wählen Sie Alle, um den Filter zu entfernen."
  }
 },
 "explainers": {
  "escalations": {
   "title": "Eskalationen",
   "p1": "Eine Eskalation ist eine Frage, die ein Agent stellt, wenn er nicht allein entscheiden soll. Sie geht an einen Benutzer, an alle mit einer Rolle oder an einen anderen Agenten, optional mit Auswahlmöglichkeiten, Standardantwort, Schweregrad und Zeitlimit.",
   "p2": "Die meisten Eskalationen blockieren nicht: Der Lauf arbeitet weiter, und ein Wächter findet die Antwort im nächsten Tick. Eine blockierende Eskalation hält ihren Lauf an, der mit der Antwort fortsetzt, sobald jemand antwortet.",
   "p3": "Antwortet niemand rechtzeitig, läuft die Ablaufaktion: Standardantwort verwenden, abbrechen oder die Frage an das Standardziel des Wächters weitergeben. Antworten erreichen den Agenten als Daten und können seine Berechtigungen nicht erweitern."
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
})(de, {
 "nav": {
  "items": {
   "freezes": {
    "label": "Sperren",
    "tip": "Bremsen für Agenten, Bereitstellungen, Wächter und Apps sowie der Autonomie-Notschalter"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Freeze": "Sperre"
  },
  "auditEventType": {
   "FreezeApplied": "Sperre gesetzt",
   "FreezeLifted": "Sperre aufgehoben",
   "KillSwitchChanged": "Notschalter geändert",
   "BoardDirectionGiven": "Gremiumsvorgabe erteilt"
  },
  "notificationEvent": {
   "FreezeApplied": "Sperre gesetzt",
   "MandateCapReached": "Ausgabengrenze des Wächters erreicht"
  },
  "freezeTargetKind": {
   "Agent": "Agent",
   "Deployment": "Bereitstellung",
   "Mandate": "Wächter",
   "App": "Anwendung",
   "OrgUnit": "Organisationseinheit",
   "Organization": "Organisation",
   "TenantAutonomy": "Notschalter"
  }
 },
 "errorCodes": {
  "Frozen": "Dies ist gesperrt: Neue Läufe werden abgelehnt, bis die Sperre aufgehoben ist.",
  "AlreadyFrozen": "Dies ist bereits gesperrt. Heben Sie diese Sperre zuerst auf oder lassen Sie sie bestehen.",
  "FreezeLifted": "Jemand hat diese Sperre bereits aufgehoben.",
  "KillSwitch": "Der Autonomie-Notschalter ist eingeschaltet, daher werden Wächter-Läufe abgelehnt.",
  "MandateBudgetExceeded": "Dieser Wächter hat sein Budget für diesen Tick oder für heute aufgebraucht.",
  "OrganizationsUnavailable": "Sperren für Organisationen kommen mit den Organisationen. Sperren Sie stattdessen einen Agenten, eine Bereitstellung, einen Wächter oder eine Anwendung."
 },
 "freezes": {
  "killSwitchTarget": "Der Autonomie-Notschalter",
  "freezeTitle": "Sperren?",
  "freezeMessage": "{{target}} sperren? Neue Läufe werden abgelehnt, bis die Sperre aufgehoben ist, und betroffene Wächter wachen nicht mehr auf.",
  "freezePickMessage": "Wählen Sie, was gesperrt werden soll. Neue Läufe werden abgelehnt, bis die Sperre aufgehoben ist, und betroffene Wächter wachen nicht mehr auf.",
  "pickTarget": "Auswählen...",
  "reasonPlaceholder": "Warum? Wer die Sperre sieht, liest diesen Text.",
  "liftTitle": "Diese Sperre aufheben?",
  "liftMessage": "Die Sperre von {{target}} aufheben? Neue Läufe werden wieder angenommen.",
  "liftKeeperMessage": "Die Sperre von {{target}} aufheben? Der Wächter wird wieder aktiv, und sein nächstes Aufwachen wird über ein kurzes Zeitfenster verteilt.",
  "bannerOwn": "Gesperrt: Neue Läufe werden abgelehnt, bis die Sperre aufgehoben ist.",
  "bannerTarget": "{{target}} ist gesperrt: Neue Läufe davon werden abgelehnt.",
  "bannerKillSwitch": "Der Autonomie-Notschalter ist eingeschaltet: In diesem Mandanten starten keine Wächter-Ticks.",
  "bannerBy": "Gesperrt von {{who}} {{when}}.",
  "bannerReason": "Grund: {{reason}}",
  "openTarget": "Öffnen",
  "status": {
   "active": "Aktiv",
   "lifted": "Aufgehoben"
  },
  "fields": {
   "targetKind": "Was gesperrt wird",
   "target": "Ziel",
   "reason": "Grund (optional)",
   "liftReason": "Grund für die Aufhebung (optional)",
   "cancelActiveRuns": "Auch bereits aktive Läufe abbrechen"
  },
  "actions": {
   "freeze": "Sperren",
   "freezeAny": "Etwas sperren",
   "lift": "Sperre aufheben",
   "openTarget": "Gesperrtes Element öffnen"
  },
  "errors": {
   "reasonMax": "Der Grund darf höchstens {{max}} Zeichen lang sein.",
   "target": "Wählen Sie, was gesperrt werden soll."
  },
  "toasts": {
   "frozen": "{{target}} ist gesperrt.",
   "frozenCancelled_one": "{{target}} ist gesperrt, und {{count}} aktiver Lauf wurde abgebrochen.",
   "frozenCancelled_other": "{{target}} ist gesperrt, und {{count}} aktive Läufe wurden abgebrochen.",
   "lifted": "Die Sperre von {{target}} ist aufgehoben."
  },
  "killSwitch": {
   "title": "Autonomie-Notschalter",
   "on": "Ein",
   "off": "Aus",
   "turnOn": "Einschalten",
   "turnOff": "Ausschalten",
   "help": "Solange der Notschalter eingeschaltet ist, starten keine Wächter-Ticks, und Wächter-Läufe werden abgelehnt. Aufrufe durch Personen und API-Zugangsdaten funktionieren weiter.",
   "changedBy": "Eingeschaltet von {{who}} {{when}}.",
   "onTitle": "Notschalter einschalten?",
   "onMessage": "Alle Wächter in diesem Mandanten wachen nicht mehr auf, und Wächter-Läufe werden abgelehnt, bis der Schalter ausgeschaltet wird. Laufende Ticks werden beendet.",
   "offTitle": "Notschalter ausschalten?",
   "offMessage": "Die Wächter wachen wieder auf; ihr nächstes Aufwachen wird über ein kurzes Zeitfenster verteilt.",
   "toasts": {
    "on": "Der Notschalter ist eingeschaltet. Es starten keine Wächter-Ticks.",
    "off": "Der Notschalter ist ausgeschaltet. Die Wächter wachen wieder auf."
   }
  }
 },
 "resources": {
  "freezes": {
   "title": "Sperren",
   "subtitle": "Bremsen, die neue Läufe eines Agenten, einer Bereitstellung, eines Wächters oder einer Anwendung ablehnen, bis jemand sie aufhebt. Auch der Notschalter erscheint hier.",
   "add": "Sperre hinzufügen",
   "create": "Sperre erstellen",
   "edit": "Sperre bearbeiten",
   "view": "Details der Sperre",
   "deleteTitle": "Sperre löschen",
   "emptyTitle": "Keine Sperren",
   "emptyBody": "Nichts ist gesperrt. Sperren Sie einen Agenten, eine Bereitstellung, einen Wächter oder eine Anwendung auf deren Seite oder mit Etwas sperren.",
   "columns": {
    "createdUtc": "Gesperrt",
    "status": "Status",
    "targetKind": "Art",
    "target": "Ziel",
    "reason": "Grund",
    "createdBy": "Gesperrt von",
    "cancelledRunCount": "Abgebrochene Läufe",
    "liftedUtc": "Aufgehoben",
    "liftedBy": "Aufgehoben von",
    "liftReason": "Grund für die Aufhebung",
    "targetId": "Ziel-ID",
    "id": "ID"
   }
  }
 },
 "views": {
  "home": {
   "autonomy": {
    "freezes_one": "{{count}} Sperre ist aktiv",
    "freezes_other": "{{count}} Sperren sind aktiv"
   }
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "freezes": "Sperren: Bremsen für Agenten, Bereitstellungen, Wächter und Apps, aktive zuerst, mit Sperren und Aufheben."
   }
  },
  "enums": {
   "resourceType": {
    "Freeze": "Sperren, die neue Läufe eines Agenten, einer Bereitstellung, eines Wächters oder einer Anwendung stoppen, sowie der Autonomie-Notschalter."
   },
   "auditEventType": {
    "FreezeApplied": "Jemand hat einen Agenten, eine Bereitstellung, einen Wächter oder eine Anwendung gesperrt.",
    "FreezeLifted": "Jemand hat eine Sperre aufgehoben.",
    "KillSwitchChanged": "Jemand hat den Autonomie-Notschalter ein- oder ausgeschaltet.",
    "BoardDirectionGiven": "Jemand hat dem CEO-Keeper vom Gremium aus eine Vorgabe gegeben."
   },
   "notificationEvent": {
    "FreezeApplied": "Jemand hat einen Agenten, eine Bereitstellung, einen Wächter oder eine Anwendung gesperrt oder den Notschalter eingeschaltet.",
    "MandateCapReached": "Ein Wächter hat seine tägliche Ausgabengrenze erreicht und wacht bis zum nächsten UTC-Tag nicht mehr auf."
   },
   "freezeTargetKind": {
    "Agent": "Alle Bereitstellungen des Agenten: Neue Läufe werden abgelehnt, und seine Wächter wachen nicht mehr auf.",
    "Deployment": "Eine Bereitstellung: Neue Läufe werden abgelehnt, und Wächter, die darauf laufen, wachen nicht mehr auf.",
    "Mandate": "Ein Wächter: Er wacht nicht mehr auf, bis die Sperre aufgehoben ist.",
    "App": "Eine Anwendung: Neue Unterhaltungen und Nachrichten in ihrem Chat werden abgelehnt.",
    "OrgUnit": "Eine Organisationseinheit. Erst verfügbar, wenn es Organisationen gibt.",
    "Organization": "Eine ganze Organisation. Erst verfügbar, wenn es Organisationen gibt.",
    "TenantAutonomy": "Der Notschalter: Im ganzen Mandanten starten keine Wächter-Ticks."
   }
  },
  "freezes": {
   "denied": "Sie dürfen das nicht. Dafür ist {{operation}} auf Sperre nötig.",
   "openTarget": "Die Seite dessen öffnen, was diese Sperre stoppt.",
   "status": {
    "active": "In Kraft: Neue Läufe im Geltungsbereich werden abgelehnt.",
    "lifted": "Jemand hat sie aufgehoben; Läufe werden wieder angenommen."
   },
   "actions": {
    "freeze": "Sperren: Neue Läufe werden abgelehnt, und betroffene Wächter wachen nicht mehr auf, bis die Sperre aufgehoben ist. Sie bestätigen zuerst.",
    "freezeAny": "Einen Agenten, eine Bereitstellung, einen Wächter oder eine Anwendung auswählen und sperren. Sie bestätigen zuerst.",
    "lift": "Die Sperre aufheben, damit neue Läufe wieder angenommen werden. Sie bestätigen zuerst."
   },
   "fields": {
    "targetKind": "Einen Agenten (mit allen Bereitstellungen), eine Bereitstellung, einen Wächter oder eine Anwendung sperren.",
    "target": "Der zu sperrende Datensatz.",
    "reason": "Optional. Erscheint im Sperrhinweis und im Auditprotokoll.",
    "liftReason": "Optional. Wird mit der Sperre und im Auditprotokoll gespeichert.",
    "cancelActiveRuns": "Auch die bereits wartenden oder laufenden Läufe im Geltungsbereich abbrechen. Ohne diese Option laufen sie zu Ende."
   },
   "filters": {
    "active": "Nur aktive oder nur aufgehobene Sperren anzeigen. Wählen Sie Alle, um beide anzuzeigen.",
    "targetKind": "Nur Sperren dieser Art anzeigen. Wählen Sie Alle, um den Filter zu entfernen."
   },
   "killSwitch": {
    "title": "Ein Schalter, der alle Wächter in diesem Mandanten anhält. Normale Aufrufe funktionieren weiter.",
    "on": "Ein: Es starten keine Wächter-Ticks, und Wächter-Läufe werden abgelehnt.",
    "off": "Aus: Wächter wachen nach ihrem Zeitplan auf.",
    "turnOn": "Alle Wächter in diesem Mandanten anhalten. Sie bestätigen zuerst.",
    "turnOff": "Wächter wieder aufwachen lassen. Sie bestätigen zuerst."
   }
  },
  "resources": {
   "freezes": {
    "createdUtc": "Wann gesperrt wurde. Für die genaue Zeit mit der Maus darüberfahren.",
    "status": "Aktiv, solange die Sperre gilt; danach Aufgehoben.",
    "targetKind": "Welche Art von Datensatz gesperrt ist.",
    "target": "Der gesperrte Agent, die Bereitstellung, der Wächter oder die Anwendung.",
    "reason": "Warum gesperrt wurde. Für den vollen Text mit der Maus darüberfahren.",
    "createdBy": "Wer gesperrt hat.",
    "cancelledRunCount": "Wie viele aktive Läufe die Sperre abgebrochen hat, wenn das gewünscht war.",
    "liftedUtc": "Wann die Sperre aufgehoben wurde.",
    "liftedBy": "Wer sie aufgehoben hat.",
    "liftReason": "Warum sie aufgehoben wurde.",
    "targetId": "Die ID des gesperrten Datensatzes.",
    "id": "Die ID der Sperre (mfz_...), für die API und die MCP-Werkzeuge."
   }
  },
  "views": {
   "home": {
    "autonomy": {
     "freezes": "Die Liste der aktiven Sperren öffnen."
    }
   }
  },
  "filters": {
   "active": "Nur aktive oder nur inaktive Datensätze anzeigen. Wählen Sie Alle, um beide anzuzeigen."
  }
 },
 "explainers": {
  "freezes": {
   "title": "Sperren",
   "p1": "Eine Sperre ist eine Bremse. Solange sie aktiv ist, lehnt Garrison neue Läufe des gesperrten Agenten, der gesperrten Bereitstellung, des gesperrten Wächters oder der gesperrten Anwendung mit 409 Frozen ab, und betroffene Wächter wachen nicht mehr auf. Bereits aktive Läufe laufen zu Ende, außer die Sperre bricht sie ebenfalls ab.",
   "p2": "Sperren Sie auf der Seite eines Agenten, einer Bereitstellung, eines Wächters oder einer Anwendung oder hier mit Etwas sperren. Nach dem Aufheben werden Läufe wieder angenommen; ein gesperrter Wächter wird aktiv, und sein nächstes Aufwachen wird über ein kurzes Zeitfenster verteilt.",
   "p3": "Der Autonomie-Notschalter in den Einstellungen und auf der Startseite hält alle Wächter-Ticks im Mandanten auf einmal an. Er erscheint hier als Sperre der Art Notschalter."
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
})(de, {
 "nav": {
  "items": {
   "memory": {
    "label": "Gedächtnis",
    "tip": "Was Agenten und Personen gespeichert haben, nach Bereich, mit Verfasser und Zeitpunkt jedes Eintrags"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Memory": "Gedächtnis"
  },
  "memoryScopeKind": {
   "Agent": "Agent",
   "App": "Anwendung",
   "OrgUnit": "Organisationseinheit",
   "Organization": "Organisation"
  }
 },
 "errorCodes": {
  "MemoryVersionConflict": "Dieser Gedächtniseintrag hat sich seit dem Laden geändert. Laden Sie ihn neu und entscheiden Sie erneut.",
  "MemoryDisabled": "Das Agentengedächtnis ist auf diesem Server ausgeschaltet. Eintragstexte lassen sich nicht lesen und Einträge nicht löschen."
 },
 "memory": {
  "legacy": "Altbestand",
  "deletedScope": "{{id}} (gelöscht)",
  "neverRead": "Nie",
  "noExpiry": "Nie",
  "deleteTitle": "Diesen Gedächtniseintrag löschen?",
  "deleteMessage": "{{key}} aus {{scope}} löschen? Agenten, die danach suchen, finden nichts mehr, und der Text wird entfernt. Das lässt sich nicht rückgängig machen.",
  "deleteVersion": "Gelöscht wird Version {{version}}, die Sie geladen haben. Hat seitdem jemand eine neuere Version geschrieben, wird das Löschen abgelehnt.",
  "deleteReloaded": "Neu geladen: Der Eintrag ist jetzt bei Version {{version}}. Löschen entfernt diese Version.",
  "scopes": {
   "label": "Gedächtnisbereiche",
   "all": "Alle Bereiche",
   "totals_one": "{{entries}} Eintrag, {{bytes}}",
   "totals_other": "{{entries}} Einträge, {{bytes}}",
   "loadFailed": "Die Gedächtnisbereiche konnten nicht geladen werden.",
   "empty": {
    "Agent": "Noch kein Agent hat etwas gespeichert.",
    "App": "Noch keine Anwendung hat ein gemeinsames Gedächtnis.",
    "OrgUnit": "Noch keine Organisationseinheit hat ein Gedächtnis.",
    "Organization": "Noch keine Organisation hat ein Gedächtnis."
   }
  },
  "filters": {
   "search": "Suche",
   "searchPlaceholder": "Schlüssel, Kategorie oder Schlagwort",
   "categoryPlaceholder": "Kategorie",
   "tag": "Schlagwort",
   "tagPlaceholder": "Schlagwort",
   "writer": "Geschrieben von"
  },
  "actions": {
   "viewContent": "Inhalt anzeigen",
   "copyId": "ID kopieren",
   "openRun": "Schreibende Ausführung öffnen",
   "reload": "Eintrag neu laden"
  },
  "viewer": {
   "title": "Gedächtniseintrag",
   "content": "Gespeicherter Inhalt",
   "untrusted": "Dies sind Daten, die ein Agent oder eine Person gespeichert hat. Sie werden als reiner Text genau so angezeigt, wie sie gespeichert sind; nichts darin wird ausgeführt, gerendert oder befolgt.",
   "loading": "Der gespeicherte Text wird geladen...",
   "empty": "Dieser Eintrag enthält keinen Text."
  },
  "errors": {
   "conflict": "Jemand hat diesen Eintrag geändert, seit Sie Version {{version}} geladen haben, daher wurde er nicht gelöscht. Laden Sie ihn neu, um den aktuellen Inhalt zu sehen.",
   "gone": "Dieser Eintrag existiert nicht mehr. Möglicherweise hat ihn jemand anderes gelöscht."
  },
  "toasts": {
   "deleted": "{{key}} gelöscht.",
   "copied": "Die Eintrags-ID wurde kopiert."
  }
 },
 "resources": {
  "memory": {
   "title": "Gedächtnis",
   "subtitle": "Was Agenten und Personen gespeichert haben, nach Bereich: wer jeden Eintrag geschrieben hat, wann, aus welcher Ausführung und wie groß er ist. Öffnen Sie einen Eintrag, um ihn zu lesen, und löschen Sie, was nicht behalten werden soll.",
   "add": "Gedächtniseintrag hinzufügen",
   "create": "Gedächtniseintrag anlegen",
   "edit": "Gedächtniseintrag bearbeiten",
   "view": "Gedächtniseintrag",
   "deleteTitle": "Gedächtniseintrag löschen",
   "emptyTitle": "Noch kein Gedächtnis",
   "emptyBody": "Agenten speichern während ihrer Ausführung mit den garrison_memory-Werkzeugen. Sobald ein Eintrag geschrieben ist, erscheint er hier nach Bereich.",
   "columns": {
    "key": "Schlüssel",
    "scope": "Bereich",
    "category": "Kategorie",
    "tags": "Schlagwörter",
    "writer": "Geschrieben von",
    "lastUpdateUtc": "Zuletzt geschrieben",
    "lastReadUtc": "Zuletzt gelesen",
    "version": "Version",
    "bytes": "Größe",
    "expiresUtc": "Läuft ab",
    "writerRunId": "Schreibende Ausführung",
    "createdUtc": "Erstellt",
    "sha256": "SHA-256-Prüfsumme",
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
})(de, {
 "nav": {
  "items": {
   "reports": {
    "label": "Berichte",
    "tip": "Statusberichte, Vorfälle, Entscheidungen und Übergaben, die Agenten und Personen eingereicht haben, mit Zustand und Kennzahlen"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Report": "Bericht"
  },
  "notificationEvent": {
   "ReportUnhealthy": "Gestörter Bericht eingereicht"
  },
  "reportKind": {
   "Status": "Status",
   "Incident": "Vorfall",
   "Decision": "Entscheidung",
   "Handoff": "Übergabe",
   "Brief": "Kurzbericht"
  },
  "reportHealth": {
   "Healthy": "Gesund",
   "Degraded": "Beeinträchtigt",
   "Unhealthy": "Gestört",
   "Unknown": "Unbekannt"
  },
  "reportAudience": {
   "Manager": "Vorgesetzte",
   "Chain": "Führungskette",
   "Board": "Vorstand"
  },
  "reportIssueSeverity": {
   "Low": "Niedrig",
   "Medium": "Mittel",
   "High": "Hoch"
  }
 },
 "reports": {
  "untrusted": "Ein Agent oder eine Person hat diesen Bericht geschrieben. Titel, Inhalt, Kennzahlen, Probleme und Entscheidungen werden genau so als reiner Text angezeigt, wie sie eingereicht wurden; nichts davon wird ausgeführt, gerendert oder befolgt.",
  "period": "{{from}} bis {{to}}",
  "periodFrom": "Ab {{from}}",
  "periodTo": "Bis {{to}}",
  "filters": {
   "author": "Autor",
   "app": "App",
   "from": "Eingereicht nach",
   "to": "Eingereicht vor"
  },
  "actions": {
   "file": "Bericht einreichen",
   "copyId": "ID kopieren",
   "openRun": "Lauf öffnen",
   "openKeeper": "Wächter öffnen",
   "openAuthor": "Autor öffnen"
  },
  "toasts": {
   "filed": "{{title}} eingereicht.",
   "copied": "Berichts-ID kopiert."
  },
  "file": {
   "title": "Bericht einreichen",
   "intro": "Halten Sie fest, wie es steht. Alle, die Berichte lesen dürfen, sehen ihn hier, und ein gestörter Bericht benachrichtigt die Endpunkte, die solche Berichte abonniert haben. Ein eingereichter Bericht lässt sich nicht mehr ändern.",
   "noAgent": "Kein Agent (in meinem Namen)",
   "fields": {
    "title": "Titel",
    "kind": "Art",
    "health": "Zustand",
    "audience": "Zielgruppe",
    "agent": "Für Agent einreichen",
    "body": "Inhalt"
   },
   "errors": {
    "title": "Geben Sie dem Bericht einen Titel mit 1 bis {{max}} Zeichen.",
    "body": "Der Inhalt darf höchstens {{max}} Byte umfassen."
   }
  },
  "chart": {
   "metric": "Kennzahl",
   "title": "{{metric}} im Zeitverlauf",
   "help_one": "{{count}} Wert, den {{agent}} gemeldet hat, ältester zuerst.",
   "help_other": "{{count}} Werte, die {{agent}} gemeldet hat, älteste zuerst.",
   "noMetrics": "Dieser Bericht enthält keine Kennzahlen, daher gibt es nichts darzustellen.",
   "noAuthor": "Kein Agent hat diesen Bericht geschrieben, daher gibt es keinen Verlauf eines Autors.",
   "empty": "Für diese Kennzahl gibt es noch keine Werte.",
   "failed": "Der Verlauf der Kennzahl konnte nicht geladen werden."
  }
 },
 "views": {
  "reportDetail": {
   "title": "Bericht",
   "notFoundTitle": "Bericht nicht gefunden",
   "notFoundBody": "Er existiert in diesem Mandanten nicht oder wurde mit seinem Mandanten entfernt.",
   "back": "Zurück zu den Berichten",
   "body": "Inhalt",
   "metrics": "Kennzahlen",
   "chart": "Verlauf der Kennzahl",
   "issues": "Probleme",
   "decisions": "Entscheidungen",
   "noBody": "Dieser Bericht hat keinen Inhalt.",
   "noMetrics": "Dieser Bericht hat keine Kennzahlen.",
   "noIssues": "Keine Probleme gemeldet.",
   "noDecisions": "Keine Entscheidungen festgehalten.",
   "columns": {
    "name": "Name",
    "value": "Wert",
    "unit": "Einheit"
   },
   "fields": {
    "health": "Zustand",
    "kind": "Art",
    "audience": "Zielgruppe",
    "author": "Autor",
    "period": "Zeitraum",
    "createdUtc": "Eingereicht",
    "filedBy": "Eingereicht von",
    "runId": "Lauf",
    "mandateId": "Wächter",
    "mandateTickId": "Wächter-Tick",
    "app": "App",
    "orgUnitId": "Organisationseinheit"
   }
  }
 },
 "resources": {
  "reports": {
   "title": "Berichte",
   "subtitle": "Was Agenten und Personen nach oben gemeldet haben: wie es steht, Vorfälle, Entscheidungen und Übergaben, mit Zustand und Kennzahlen. Öffnen Sie einen Bericht, um ihn zu lesen und eine Kennzahl im Zeitverlauf darzustellen.",
   "add": "Bericht einreichen",
   "create": "Bericht einreichen",
   "edit": "Bericht",
   "view": "Berichtsdetails",
   "deleteTitle": "Bericht löschen",
   "emptyTitle": "Noch keine Berichte",
   "emptyBody": "Agenten reichen Berichte während ihrer Läufe mit dem Tool garrison_file_report ein, Personen hier oder über die API. Sie erscheinen hier, sobald einer eingereicht ist.",
   "columns": {
    "createdUtc": "Eingereicht",
    "title": "Titel",
    "author": "Autor",
    "kind": "Art",
    "health": "Zustand",
    "app": "App",
    "period": "Zeitraum",
    "issues": "Probleme",
    "audience": "Zielgruppe",
    "filedBy": "Eingereicht von",
    "runId": "Lauf",
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
})(de, {
 "nav": {
  "items": {
   "messages": {
    "label": "Nachrichten",
    "tip": "Post zwischen Agenten und von Personen, mit den Nachrichten, die Schleifenschutz-Regeln abgewiesen haben, und dem Grund"
   },
   "messageThreads": {
    "label": "Nachrichtenverlauf",
    "tip": "Alle Nachrichten eines Verlaufs, älteste zuerst"
   }
  }
 },
 "enums": {
  "resourceType": {
   "AgentMessage": "Agentennachricht"
  },
  "runKind": {
   "Message": "Dringende Nachricht"
  },
  "messageStatus": {
   "Queued": "Wartend",
   "Delivered": "Zugestellt",
   "Acknowledged": "Bestätigt",
   "Expired": "Abgelaufen",
   "Rejected": "Abgewiesen"
  },
  "messageUrgency": {
   "Normal": "Normal",
   "Urgent": "Dringend"
  },
  "messageRejection": {
   "HopLimit": "Weiterleitungsgrenze",
   "LineRate": "Senderate",
   "ThreadBudget": "Verlaufsbudget",
   "NoLine": "Keine Verbindung",
   "Frozen": "Empfänger eingefroren"
  }
 },
 "messages": {
  "untrusted": "Agenten und Personen haben diese Nachrichten geschrieben. Betreff, Text und Ablehnungsdetails werden als reiner Text genau so angezeigt, wie sie gesendet wurden; nichts davon wird ausgeführt, gerendert oder befolgt.",
  "views": {
   "label": "Welche Nachrichten",
   "all": "Alle Nachrichten",
   "rejected": "Abgewiesen",
   "rejectedNote": "Nachrichten, die der Schleifenschutz beim Senden abgewiesen hat, mit dem Grund. Eine abgewiesene Nachricht wurde nie zugestellt."
  },
  "filters": {
   "reason": "Grund",
   "sender": "Absender",
   "recipient": "Empfänger",
   "from": "Gesendet nach",
   "to": "Gesendet vor"
  },
  "actions": {
   "send": "Nachricht senden",
   "openThread": "Verlauf öffnen",
   "copyId": "ID kopieren",
   "openSender": "Absender öffnen",
   "openRecipient": "Empfänger öffnen",
   "openDeliveredRun": "Empfangenden Lauf öffnen",
   "openEscalation": "Eskalation öffnen"
  },
  "toasts": {
   "sent": "An {{recipient}} gesendet.",
   "copied": "Nachrichten-ID kopiert."
  },
  "send": {
   "title": "Nachricht senden",
   "intro": "Schreiben Sie einem Agenten. Die Nachricht wartet in seinem Posteingang, bis ein Lauf sie liest; eine dringende Nachricht weckt den Agenten sofort.",
   "replyIntro": "Antworten Sie in diesem Verlauf. Die Antwort geht an den Agenten, der die Nachricht gesendet hat.",
   "pickRecipient": "Agenten auswählen",
   "ttlPlaceholder": "Standard des Servers",
   "sending": "Wird gesendet...",
   "rejected": "Der Schleifenschutz hat diese Nachricht abgewiesen.",
   "rejectedStored": "Die abgewiesene Nachricht bleibt in der Liste Abgewiesen erhalten.",
   "fields": {
    "recipient": "An",
    "subject": "Betreff",
    "body": "Text",
    "urgency": "Dringlichkeit",
    "ttlSeconds": "Läuft ab nach (Sekunden)"
   },
   "errors": {
    "recipient": "Wählen Sie den Agenten, an den die Nachricht geht.",
    "subject": "Geben Sie der Nachricht einen Betreff mit 1 bis {{max}} Zeichen.",
    "body": "Der Text darf höchstens {{max}} Byte enthalten.",
    "ttlSeconds": "Geben Sie eine ganze Zahl von {{min}} bis {{max}} Sekunden ein oder lassen Sie das Feld leer."
   }
  }
 },
 "views": {
  "messageThread": {
   "title": "Nachrichtenverlauf",
   "notFoundTitle": "Verlauf nicht gefunden",
   "notFoundBody": "Er existiert in diesem Mandanten nicht oder wurde mit seinem Mandanten entfernt.",
   "back": "Zurück zu den Nachrichten",
   "count_one": "{{count}} Nachricht",
   "count_other": "{{count}} Nachrichten",
   "rejectedCount_one": "{{count}} abgewiesen",
   "rejectedCount_other": "{{count}} abgewiesen",
   "emptyTitle": "Keine Nachrichten in diesem Verlauf",
   "emptyBody": "Der Verlauf existiert, enthält aber keine Nachrichten, die Sie lesen dürfen.",
   "listLabel": "Nachrichten in diesem Verlauf, älteste zuerst",
   "noBody": "Diese Nachricht hat keinen Text.",
   "noDetail": "Keine weiteren Angaben.",
   "woke": "Hat den Empfänger geweckt",
   "artifacts": "Angehängte Artefakte",
   "reply": "Antworten",
   "replyPrefix": "AW: ",
   "fields": {
    "sender": "Von",
    "recipient": "An",
    "createdUtc": "Gesendet",
    "hopCount": "Weiterleitungen",
    "deliveredRunId": "Zugestellt an Lauf",
    "deliveredUtc": "Zugestellt",
    "acknowledgedUtc": "Bestätigt",
    "expiresUtc": "Läuft ab",
    "wokeRecipient": "Wecken",
    "escalationId": "Eskalation",
    "id": "Nachrichten-ID"
   }
  },
  "agentDetail": {
   "inbox": {
    "tab": "Posteingang",
    "status": "Status",
    "openAll": "In Nachrichten öffnen",
    "none": "Noch keine Nachrichten für diesen Agenten.",
    "noneWithStatus": "Keine Nachrichten für diesen Agenten mit diesem Status.",
    "more": "Die neuesten {{shown}} von {{total}} werden angezeigt. Öffnen Sie Nachrichten, um alle zu sehen."
   }
  },
  "home": {
   "autonomy": {
    "rejected_one": "{{count}} Nachricht in den letzten 24 Stunden vom Schleifenschutz abgewiesen",
    "rejected_other": "{{count}} Nachrichten in den letzten 24 Stunden vom Schleifenschutz abgewiesen",
    "noneRejected": "Keine Nachrichten in den letzten 24 Stunden vom Schleifenschutz abgewiesen"
   }
  }
 },
 "resources": {
  "messages": {
   "title": "Nachrichten",
   "subtitle": "Post zwischen Agenten und von Personen, neueste zuerst, mit den Nachrichten, die der Schleifenschutz abgewiesen hat. Öffnen Sie eine, um den ganzen Verlauf zu lesen.",
   "add": "Nachricht senden",
   "create": "Nachricht senden",
   "edit": "Nachricht",
   "view": "Nachrichtendetails",
   "deleteTitle": "Nachricht löschen",
   "emptyTitle": "Noch keine Nachrichten",
   "emptyBody": "Agenten senden Nachrichten während ihrer Läufe mit dem Werkzeug garrison_send_message, Personen hier oder über die API. Sie erscheinen hier, sobald eine gesendet wurde.",
   "columns": {
    "createdUtc": "Gesendet",
    "urgency": "Dringlichkeit",
    "status": "Status",
    "subject": "Betreff",
    "sender": "Von",
    "recipient": "An",
    "reason": "Ablehnung",
    "hopCount": "Weiterleitungen",
    "deliveredRunId": "Zugestellt an Lauf",
    "expiresUtc": "Läuft ab",
    "escalationId": "Eskalation",
    "threadId": "Verlauf",
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
})(de, {
 "nav": {
  "items": {
   "organizations": {
    "label": "Organisationen",
    "tip": "Bäume aus Einheiten mit Leitungen, Mitgliedern, Querverbindungen und Budgets, als Revisionen veröffentlicht"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Organization": "Organisation"
  },
  "organizationStatus": {
   "Draft": "Entwurf",
   "Active": "Aktiv",
   "Frozen": "Eingefroren",
   "Retired": "Außer Dienst"
  },
  "budgetPeriod": {
   "Day": "Tag",
   "Month": "Monat"
  },
  "orgRevisionState": {
   "Draft": "Entwurf",
   "Published": "Veröffentlicht",
   "Superseded": "Abgelöst"
  }
 },
 "organizations": {
  "notPublished": "Nicht veröffentlicht",
  "actions": {
   "open": "Organisation öffnen",
   "copyId": "ID kopieren"
  },
  "toasts": {
   "copied": "Die Organisations-ID wurde kopiert.",
   "unitAdded": "Einheit {{name}} wurde zum Arbeitsbaum hinzugefügt.",
   "unitSaved": "Einheit {{name}} wurde gespeichert.",
   "unitRemoved": "Einheit {{name}} wurde aus dem Arbeitsbaum entfernt.",
   "published": "Revision {{number}} ist live.",
   "drafted": "Revision {{number}} wurde als Entwurf gespeichert.",
   "rolledBack": "Auf Revision {{number}} zurückgesetzt. Revision {{live}} ist live.",
   "retired": "{{name}} wurde außer Dienst gestellt.",
   "reactivated": "{{name}} wurde wieder in Dienst gestellt."
  },
  "errors": {
   "OneRoot": "Eine Organisation hat genau eine Stammeinheit, nämlich die ohne übergeordnete Einheit.",
   "ParentNotFound": "Die übergeordnete Einheit gehört nicht zu dieser Organisation.",
   "Cycle": "Eine Einheit kann nicht unter sich selbst oder unter einer ihrer eigenen Einheiten stehen.",
   "UnitNameTaken": "Eine andere Einheit dieser Organisation trägt bereits diesen Namen.",
   "LeadsTwoUnits": "Dieser Agent leitet bereits eine andere Einheit. Ein Agent leitet höchstens eine Einheit pro Organisation.",
   "PositionTaken": "Dieser Agent hat bereits eine Position in der Organisation. Ein Agent ist Leitung oder Mitglied nur einer Einheit.",
   "PeerNotFound": "Eine Querverbindung zeigt auf eine Einheit, die nicht zu dieser Organisation gehört.",
   "BudgetPeriodTaken": "Eine Einheit hat ein Budget pro Zeitraum.",
   "BudgetInvalid": "Ein Budget muss ein positiver Betrag in US-Dollar sein.",
   "BudgetExceedsParent": "Das Budget einer Einheit kann nicht größer sein als das Budget der Einheit darüber.",
   "TooManyUnits": "Die Organisation hat bereits so viele Einheiten, wie der Server erlaubt.",
   "TooManyMembers": "Die Einheit hat bereits so viele Mitglieder, wie der Server erlaubt.",
   "TooManyPeerLines": "Die Einheit hat bereits so viele Querverbindungen, wie der Server erlaubt.",
   "UnitHasChildren": "Entfernen oder verschieben Sie zuerst die Einheiten unter dieser.",
   "OrganizationRetired": "Die Organisation ist außer Dienst. Stellen Sie sie wieder in Dienst, bevor Sie sie ändern.",
   "AgentInactive": "Der Agent existiert nicht oder ist nicht aktiv.",
   "MandateMismatch": "Der Wächter gehört zu einem anderen Agenten. Wählen Sie einen Wächter des Agenten auf dieser Position.",
   "RevisionMismatch": "Diese Revision gehört zu einer anderen Organisation.",
   "RevisionPublished": "Diese Revision wurde bereits veröffentlicht.",
   "RevisionNeverPublished": "Zurücksetzen ist nur auf Revisionen möglich, die einmal live waren.",
   "AlreadyLive": "Diese Revision ist bereits live.",
   "NothingToRollBack": "Es gibt keine frühere Live-Revision, zu der Sie zurückkehren können.",
   "StatusNotSettable": "Eine Organisation kann außer Dienst gestellt oder wieder in Dienst gestellt werden. Die anderen Status setzen Veröffentlichungen und Sperren.",
   "NameConflict": "Eine andere Organisation verwendet diesen Namen bereits."
  },
  "spend": {
   "noBudget": "{{period}}: {{spent}} ausgegeben, kein Budget",
   "of": "{{period}}: {{spent}} von {{amount}} ({{percent}})",
   "exhausted": "Budget aufgebraucht"
  },
  "chart": {
   "lead": "Leitung",
   "noLead": "Keine Leitung",
   "members": "Mitglieder ({{count}})",
   "peers": "Querverbindungen",
   "app": "App",
   "collapse": "Einheiten unter {{name}} einklappen",
   "expand": "Einheiten unter {{name}} ausklappen",
   "addChild": "Einheit darunter hinzufügen"
  },
  "unit": {
   "addTitle": "Einheit hinzufügen",
   "editTitle": "Einheit {{name}} bearbeiten",
   "add": "Einheit hinzufügen",
   "saving": "Wird gespeichert...",
   "intro": "Änderungen gehen in den Arbeitsbaum. Nichts wird live, bis Sie eine Revision veröffentlichen. Namen haben höchstens {{max}} Zeichen.",
   "namePlaceholder": "abrechnung",
   "titlePlaceholder": "Leitung Abrechnung",
   "noParent": "Keine (die Stammeinheit)",
   "noLead": "Noch keine Leitung",
   "noMandate": "Kein Wächter",
   "noApp": "Keine App",
   "noPeers": "Fügen Sie zuerst eine weitere Einheit hinzu, um eine Querverbindung zu ihr zu ziehen.",
   "noBudget": "Kein Budget",
   "addMember": "Mitglied hinzufügen",
   "sections": {
    "lead": "Leitung",
    "members": "Mitglieder und Querverbindungen",
    "budgets": "Budgetgrenzen"
   },
   "fields": {
    "name": "Name",
    "parentUnitId": "Untersteht",
    "description": "Beschreibung",
    "leadAgentId": "Leitender Agent",
    "leadTitle": "Titel der Leitung",
    "leadMandateId": "Wächter der Leitung",
    "appId": "App",
    "members": "Mitglieder",
    "memberAgent": "Agent",
    "memberTitle": "Titel",
    "memberMandate": "Wächter",
    "peerUnitIds": "Querverbindungen",
    "budgetDay": "Tagesbudget (USD)",
    "budgetMonth": "Monatsbudget (USD)"
   },
   "errors": {
    "name": "Geben Sie der Einheit einen Namen mit 1 bis {{max}} Zeichen.",
    "description": "Die Beschreibung hat höchstens {{max}} Zeichen.",
    "title": "Ein Titel hat höchstens {{max}} Zeichen.",
    "memberAgent": "Wählen Sie für jedes Mitglied einen Agenten, oder entfernen Sie die leere Zeile.",
    "duplicateAgent": "Ein Agent kann in der Einheit nur eine Position haben.",
    "budget": "Geben Sie einen Betrag über null ein, oder lassen Sie das Feld für kein Budget leer."
   }
  },
  "form": {
   "errors": {
    "name": "Geben Sie der Organisation einen Namen mit 1 bis {{max}} Zeichen.",
    "text": "Dieses Feld hat höchstens {{max}} Zeichen."
   }
  },
  "diff": {
   "none": "Keine Unterschiede. Die beiden Bäume sind gleich.",
   "empty": "(keine)",
   "between": "Von {{before}} zu {{after}}.",
   "added": "Hinzugefügte Einheiten ({{count}})",
   "removed": "Entfernte Einheiten ({{count}})",
   "changed": "Geänderte Einheiten ({{count}})",
   "field": "Feld",
   "fields": {
    "name": "Name",
    "description": "Beschreibung",
    "parent": "Untersteht",
    "lead": "Leitung",
    "leadTitle": "Titel der Leitung",
    "leadMandate": "Wächter der Leitung",
    "app": "App",
    "members": "Mitglieder",
    "peers": "Querverbindungen",
    "budgets": "Budgetgrenzen"
   },
   "title": "Revision {{number}} im Vergleich zur Live-Organisation",
   "pendingTitle": "Unveröffentlichte Änderungen",
   "nothingLive": "noch nichts live",
   "working": "dem Arbeitsbaum"
  },
  "revisions": {
   "label": "Revision {{number}}",
   "rollbackOf": "(Kopie von Revision {{number}})"
  },
  "rollback": {
   "note": "Im Dashboard auf Revision {{number}} zurückgesetzt."
  }
 },
 "views": {
  "organizationDetail": {
   "title": "Organisation",
   "heading": "Organisation {{name}}",
   "notFoundTitle": "Organisation nicht gefunden",
   "notFoundBody": "Sie existiert in diesem Mandanten nicht, oder sie wurde gelöscht.",
   "live": "Live-Aktualisierungen",
   "editDetails": "Details bearbeiten",
   "reactivate": "Wieder in Dienst stellen",
   "retire": "Außer Dienst stellen",
   "publish": "Änderungen veröffentlichen",
   "retiredBanner": "Diese Organisation ist außer Dienst. Ihre Weisungskette, Verbindungen und Budgets gelten nicht mehr, und nichts in ihr kann sich ändern, bis Sie sie wieder in Dienst stellen.",
   "pending": "Der Arbeitsbaum hat unveröffentlichte Änderungen: {{added}} hinzugefügt, {{changed}} geändert, {{removed}} entfernt.",
   "neverPublished": "Noch ist nichts live. Veröffentlichen Sie eine Revision, um diese Organisation arbeiten zu lassen.",
   "reviewPending": "Änderungen prüfen",
   "units": "Einheiten",
   "lastUpdate": "Zuletzt geändert",
   "tabs": {
    "chart": "Organigramm",
    "budgets": "Budgets und Ausgaben",
    "revisions": "Revisionen ({{count}})"
   },
   "chartView": "Welcher Baum",
   "viewWorking": "Arbeitsbaum",
   "viewLive": "Live-Stand",
   "addUnit": "Einheit hinzufügen",
   "addRoot": "Stammeinheit hinzufügen",
   "workingNote": "Den Arbeitsbaum bearbeiten Sie. Veröffentlichen Sie eine Revision, um ihn live zu schalten.",
   "liveNote": "Die Live-Revision: Weisungskette, Verbindungen und Budgets folgen diesem Baum.",
   "noUnitsTitle": "Noch keine Einheiten",
   "noUnitsBody": "Fügen Sie die Stammeinheit hinzu, geleitet vom Agenten an der Spitze, und dann Einheiten darunter.",
   "budgetsNote": "Jedes Budget begrenzt, was die Einheit und alle Einheiten darunter an einem UTC-Tag oder in einem UTC-Monat ausgeben dürfen. Als Ausgaben zählen die bekannten Kosten abgeschlossener Läufe unter der Live-Revision.",
   "noBudgetsTitle": "Keine Budgets",
   "noBudgetsBody": "Bearbeiten Sie eine Einheit, um ihr ein Tages- oder Monatsbudget zu geben.",
   "noSpend": "Keine Ausgaben erfasst",
   "columns": {
    "unit": "Einheit",
    "day": "Tag",
    "month": "Monat",
    "spend": "Ausgaben",
    "number": "Revisionsnummer",
    "state": "Zustand",
    "note": "Notiz",
    "author": "Autor",
    "created": "Erstellt",
    "published": "Veröffentlicht"
   },
   "noRevisionsTitle": "Noch keine Revisionen",
   "noRevisionsBody": "Veröffentlichen Sie Änderungen, um den Arbeitsbaum als Revision festzuhalten.",
   "current": "Aktuell live",
   "compare": "Mit Live-Stand vergleichen",
   "publishRevision": "Veröffentlichen",
   "rollback": "Zurücksetzen",
   "publishTitle": "Änderungen veröffentlichen",
   "publishIntro": "Beim Veröffentlichen wird der Arbeitsbaum als neue Revision festgehalten und live geschaltet, mit der aktuellen Revision jedes darin genannten Wächters. Als Entwurf speichern behält den Stand, ohne ihn live zu schalten.",
   "saveDraft": "Als Entwurf speichern",
   "publishNow": "Veröffentlichen",
   "note": "Notiz",
   "diffNote": "Notiz: {{note}}",
   "removeUnitTitle": "Einheit entfernen",
   "confirmRemoveUnit": "Einheit {{name}} aus dem Arbeitsbaum entfernen? Querverbindungen, die auf sie zeigen, werden ebenfalls entfernt. Die Live-Organisation ändert sich erst, wenn Sie veröffentlichen.",
   "rollbackTitle": "Zurücksetzen",
   "confirmRollback": "Revision {{number}} anstelle von Revision {{live}} wieder live schalten? Der Arbeitsbaum und die darin genannten Wächter kehren zu dieser Revision zurück, und das Zurücksetzen wird als neue Revision festgehalten.",
   "retireTitle": "Organisation außer Dienst stellen",
   "confirmRetire": "{{name}} außer Dienst stellen? Weisungskette, Verbindungen und Budgets gelten dann nicht mehr, und die Organisation kann sich nicht ändern, bis Sie sie wieder in Dienst stellen.",
   "confirmDelete": "{{name}} mit {{units}} Einheiten und {{revisions}} Revisionen löschen? Das für ihre Einheiten und für die Organisation gespeicherte Gedächtnis wird ebenfalls gelöscht. Dies kann nicht rückgängig gemacht werden."
  }
 },
 "resources": {
  "organizations": {
   "title": "Organisationen",
   "subtitle": "Bäume aus Einheiten, jede von einem Agenten geleitet, mit Mitgliedern, Querverbindungen und Budgets. Öffnen Sie eine, um ihr Organigramm zu bearbeiten und zu veröffentlichen.",
   "add": "Organisation erstellen",
   "create": "Organisation erstellen",
   "edit": "Organisation bearbeiten",
   "view": "Organisationsdetails",
   "deleteTitle": "Organisation löschen",
   "emptyTitle": "Noch keine Organisationen",
   "emptyBody": "Erstellen Sie eine Organisation, fügen Sie eine Stammeinheit hinzu, die der Agent an der Spitze leitet, dann Einheiten darunter, und veröffentlichen Sie.",
   "columns": {
    "name": "Name",
    "status": "Status",
    "currentRevisionNumber": "Live-Revision",
    "description": "Beschreibung",
    "createdUtc": "Erstellt",
    "mission": "Zweck",
    "id": "ID"
   },
   "fields": {
    "name": "Name",
    "description": "Beschreibung",
    "mission": "Zweck"
   },
   "hints": {
    "name": "1 bis {{max}} Zeichen, eindeutig im Mandanten.",
    "description": "Optional, höchstens {{max}} Zeichen.",
    "mission": "Wofür die Organisation da ist, in einfachen Worten. Optional, höchstens {{max}} Zeichen."
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
})(de, {
 "common": {
  "fieldCodes": {
   "OneRoot": "Die Organisation hat bereits eine Stammeinheit. Wählen Sie eine übergeordnete Einheit für diese Einheit.",
   "UnitNameTaken": "Die Organisation hat bereits eine Einheit mit diesem Namen.",
   "UnitNotFound": "Die Organisation hat keine Einheit mit diesem Namen.",
   "UnitHasChildren": "Entfernen Sie zuerst die Einheiten unter dieser.",
   "NoSuchPeerLine": "Diese beiden Einheiten haben keine Querverbindung.",
   "OrganizationDeleted": "Der Entwurf löscht diese Organisation. Stellen Sie sie zuerst wieder her.",
   "PeerNotFound": "Eine Einheit kann keine Querverbindung zu sich selbst haben."
  }
 },
 "components": {
  "studio": {
   "canvas": {
    "view": {
     "label": "Was die Zeichenfläche zeigt",
     "apps": "Apps",
     "organizations": "Organisationen"
    },
    "operations": {
     "AddUnit": "Hinzufügen einer Einheit",
     "RemoveUnit": "Entfernen einer Einheit",
     "AddUnitMember": "Hinzufügen eines Mitglieds",
     "RemoveUnitMember": "Entfernen eines Mitglieds",
     "ConnectUnits": "Hinzufügen einer Querverbindung",
     "DisconnectUnits": "Entfernen einer Querverbindung"
    },
    "org": {
     "none": "Der Entwurf enthält noch keine Organisation. Geben Sie oben einen Organisationsnamen und einen Einheitennamen ein, um eine zu beginnen; ihre erste Einheit ist die Stammeinheit.",
     "flowLabel": "Organisation {{organization}}",
     "picker": "Organisation",
     "units": "Einheiten",
     "root": "Stammeinheit",
     "peers": "Querverbindungen",
     "orgTitle": "Organisation {{name}}",
     "orgHint": "Wählen Sie eine Einheit, um ihre Mitglieder und Querverbindungen zu bearbeiten. Einheiten liegen innerhalb der Einheit, der sie unterstehen.",
     "deleted": "Der Entwurf löscht diese Organisation. Ihre Einheiten können sich erst ändern, wenn sie wiederhergestellt ist.",
     "unitTitle": "Einheit {{name}}",
     "reportsTo": "Untersteht",
     "lead": "Leitung",
     "members": "Mitglieder ({{count}})",
     "noMembers": "Keine Mitglieder außer der Leitung.",
     "memberAgent": "Agent",
     "memberTitle": "Titel (optional)",
     "addMember": "Mitglied hinzufügen",
     "removeMember": "Entfernen",
     "noPeers": "Keine Querverbindungen.",
     "disconnect": "Trennen",
     "addChild": "Einheit darunter hinzufügen",
     "startPeer": "Querverbindung beginnen",
     "removeUnit": "Einheit entfernen",
     "peerTitle": "Querverbindung {{from}} und {{to}}",
     "peerHint": "{{from}} und {{to}} dürfen einander direkt Nachrichten senden, ohne Umweg über eine gemeinsame Führungskraft.",
     "peerList": "Querverbindungen ({{total}})",
     "noPeerLines": "Noch keine Querverbindungen. Wählen Sie eine Einheit und beginnen Sie eine, oder ziehen Sie vom rechten Punkt einer Einheit zu einer anderen Einheit.",
     "removeTitle": "Einheit entfernen",
     "removeMessage": "Einheit {{name}} in diesem Entwurf aus der Organisation {{organization}} entfernen? Querverbindungen, die sie nennen, werden mit entfernt. Eine Einheit mit Einheiten darunter kann nicht entfernt werden.",
     "toolbar": {
      "label": "Organisationswerkzeuge",
      "addUnit": "Einheit hinzufügen",
      "unitPlaceholder": "Name der Einheit",
      "parent": "Untersteht",
      "noParent": "Keine übergeordnete Einheit (Stammeinheit)",
      "under": "Unter {{name}}",
      "lead": "Leitender Agent",
      "leadPlaceholder": "Leitender Agent (optional)",
      "leadTitle": "Titel der Leitung (optional)",
      "organization": "Organisation",
      "add": "Hinzufügen"
     },
     "connectBar": {
      "message": "Querverbindung von {{name}} aus."
     },
     "keys": {
      "tab": "Tab wechselt durch die Einheiten, jede Einheit vor den Einheiten darunter.",
      "select": "Eingabetaste oder Leertaste wählt die fokussierte Einheit aus und öffnet ihre Eigenschaften.",
      "peer": "C auf einer Einheit beginnt eine Querverbindung von ihr aus; C oder die Eingabetaste auf einer anderen Einheit schließt sie ab.",
      "remove": "Entf entfernt die fokussierte Einheit nach einer Bestätigung.",
      "add": "N springt zum Feld Einheit hinzufügen.",
      "peers": "In der Liste der Querverbindungen wählt die Eingabetaste eine Verbindung aus, und Entf entfernt sie.",
      "escape": "Escape bricht eine begonnene Querverbindung ab."
     },
     "node": {
      "root": "Stamm",
      "reportsTo": "untersteht {{name}}",
      "lead": "Leitung: {{name}}",
      "noLead": "Keine Leitung",
      "members": "Mitglieder {{list}}"
     },
     "summary": {
      "none": "Es gibt keine Organisation zu beschreiben.",
      "units_one": "Die Organisation {{organization}} hat {{count}} Einheit.",
      "units_other": "Die Organisation {{organization}} hat {{count}} Einheiten.",
      "root": "Die Stammeinheit ist {{name}}.",
      "peerCount_one": "Es gibt {{count}} Querverbindung.",
      "peerCount_other": "Es gibt {{count}} Querverbindungen.",
      "unitRoot": "{{name}} ist die Stammeinheit und {{lead}}.",
      "unitChild": "{{name}} untersteht {{parent}} und {{lead}}.",
      "ledBy": "wird von {{name}} geleitet",
      "noLead": "hat keine Leitung",
      "peer": "{{from}} und {{to}} haben eine Querverbindung."
     },
     "a11y": {
      "unit": "Drücken Sie die Eingabetaste oder die Leertaste, um diese Einheit auszuwählen. Drücken Sie C, um eine Querverbindung zu beginnen, oder Entf, um die Einheit zu entfernen.",
      "peer": "Eine Querverbindung zwischen zwei Einheiten.",
      "handle": "Zu einer anderen Einheit ziehen, um eine Querverbindung zu zeichnen"
     },
     "announce": {
      "added": "Einheit {{name}} zu {{organization}} hinzugefügt.",
      "peerStart": "Querverbindung von {{name}} aus. Gehen Sie zur anderen Einheit und drücken Sie die Eingabetaste, oder drücken Sie Escape zum Abbrechen.",
      "connected": "{{from}} und {{to}} haben jetzt eine Querverbindung.",
      "disconnected": "{{from}} und {{to}} haben keine Querverbindung mehr.",
      "memberAdded": "{{name}} zur Einheit {{unit}} hinzugefügt.",
      "memberRemoved": "{{name}} aus der Einheit {{unit}} entfernt.",
      "removed": "Einheit {{name}} aus {{organization}} entfernt."
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
})(de, {
 "nav": {
  "items": {
   "changeRules": {
    "label": "Änderungsregeln",
    "tip": "Routineänderungen, die leitende Agenten in ihren Teilbäumen ohne Rückfrage vornehmen dürfen"
   }
  }
 },
 "enums": {
  "resourceType": {
   "ChangeRule": "Änderungsregel"
  },
  "notificationEvent": {
   "OrgProposalApplied": "Organisationsvorschlag angewendet"
  },
  "managementAccess": {
   "None": "Keiner",
   "Drafts": "Studio-Entwürfe",
   "OrgSubtree": "Leitung über den eigenen Teilbaum"
  },
  "changeClass": {
   "PromptRetune": "Prompt nachjustieren",
   "WakeTuning": "Aufwachplan anpassen",
   "MandateTextEdit": "Wächtertext bearbeiten",
   "AddWorker": "Mitglied hinzufügen",
   "RemoveWorker": "Mitglied entfernen",
   "ModelChange": "Modellwechsel",
   "DeploymentWeight": "Gewichtung der Bereitstellung"
  }
 },
 "errorCodes": {
  "RulesArePeopleOnly": "Nur Menschen schreiben Änderungsregeln. Ein Agent kann keine anlegen, ändern oder löschen.",
  "ProposalNotPending": "Über diesen Vorschlag wird nicht mehr entschieden. Öffnen Sie ihn erneut, um seinen Stand zu sehen.",
  "ApproverIsAgent": "Ein Agent kann nicht über einen Vorschlag entscheiden. Das muss ein Mensch tun."
 },
 "changeRules": {
  "actions": {
   "openOrganization": "Organisation öffnen",
   "copyId": "ID kopieren"
  },
  "toasts": {
   "copied": "Die ID der Änderungsregel wurde kopiert."
  },
  "status": {
   "Active": "In Kraft",
   "Inactive": "Ausgeschaltet",
   "Expired": "Abgelaufen"
  },
  "limit": {
   "text": "{{class}}, {{name}}: {{range}}",
   "between": "{{min}} bis {{max}}",
   "atMost": "höchstens {{max}}",
   "atLeast": "mindestens {{min}}",
   "any": "ohne Grenze"
  },
  "limitNames": {
   "count": "Änderungen pro Vorschlag",
   "minIntervalSeconds": "Kürzestes Aufwachintervall (Sekunden)",
   "maxIntervalSeconds": "Längstes Aufwachintervall (Sekunden)",
   "backoffFactor": "Backoff-Faktor",
   "jitterPercent": "Jitter (Prozent)",
   "weight": "Verkehrsgewichtung"
  },
  "errors": {
   "UnknownLimit": "Diese Klasse hat keine Grenze mit diesem Namen. Wählen Sie eine aus der Liste.",
   "ClassNotInRule": "Eine Grenze muss zu einer Klasse gehören, die die Regel aufführt. Fügen Sie die Klasse hinzu oder ändern Sie die Grenze.",
   "UnitNotFound": "Diese Einheit ist nicht im aktuellen Organigramm dieser Organisation.",
   "Duplicate": "Jede Klasse und jede Grenze darf nur einmal vorkommen.",
   "BoundRequired": "Geben Sie für die Grenze ein Minimum, ein Maximum oder beides an.",
   "MinimumAboveMaximum": "Das Minimum ist größer als das Maximum.",
   "NegativeBound": "Grenzen sind null oder größer.",
   "ExpiryInPast": "Wählen Sie ein Ablaufdatum in der Zukunft, oder lassen Sie das Feld leer, damit die Regel nie abläuft.",
   "OrganizationNotFound": "Diese Organisation gibt es in diesem Mandanten nicht.",
   "OrganizationNotSettable": "Eine Regel bleibt bei ihrer Organisation. Legen Sie für eine andere Organisation eine neue Regel an.",
   "TooMany": "Eine Regel enthält höchstens {{max}} Grenzen."
  },
  "form": {
   "errors": {
    "name": "Geben Sie der Regel einen Namen mit 1 bis {{max}} Zeichen.",
    "description": "Die Beschreibung umfasst höchstens {{max}} Zeichen.",
    "organization": "Wählen Sie die Organisation, für die die Regel gilt.",
    "unit": "Wählen Sie eine Einheit dieser Organisation.",
    "classes": "Wählen Sie mindestens eine Änderungsklasse."
   }
  }
 },
 "orgProposals": {
  "title": "Vorschläge",
  "note": "Leitende Agenten schlagen Änderungen an den Einheiten vor, die sie leiten. Ein Vorschlag wird sofort angewendet, wenn Änderungsregeln jede Änderung darin abdecken. Alles andere wartet hier auf einen Menschen.",
  "rulesLink": "Änderungsregeln",
  "views": {
   "label": "Welche Vorschläge",
   "all": "Alle",
   "needsApproval": "Freigabe nötig",
   "needsApprovalCount": "Freigabe nötig ({{count}})",
   "applied": "Angewendet"
  },
  "emptyTitle": "Hier gibt es keine Vorschläge",
  "emptyBody": "Wenn ein leitender Agent eine Änderung an den Einheiten unter ihm vorschlägt, erscheint der Vorschlag hier.",
  "columns": {
   "title": "Vorschlag",
   "unit": "Einheit",
   "agent": "Leitender Agent",
   "decision": "Entscheidung",
   "updated": "Zuletzt geändert"
  },
  "decision": {
   "rule": "Per Regel angewendet",
   "approved": "Genehmigt",
   "needsApproval": "Freigabe nötig",
   "denied": "Abgelehnt",
   "lapsed": "Verfallen",
   "drafting": "Im Entwurf"
  },
  "byRules": "Regeln: {{names}}",
  "byPerson": "Von {{name}}",
  "decide": "Prüfen und entscheiden",
  "toasts": {
   "approved": "{{title}} genehmigt. Der Vorschlag ist jetzt aktiv.",
   "denied": "{{title}} abgelehnt. Der Vorschlag ging an den leitenden Agenten zurück."
  },
  "review": {
   "open": "Prüfen",
   "title": "Vorschlag: {{title}}",
   "run": "Vorgeschlagen in Lauf",
   "approve": "Genehmigen",
   "deny": "Ablehnen",
   "appliedByRule": "Sofort angewendet, weil Änderungsregeln jede Änderung abgedeckt haben. Regeln: {{names}}.",
   "approvedBy": "Genehmigt von {{name}}.",
   "deniedBy": "Abgelehnt von {{name}}.",
   "reasonGiven": "Begründung: {{reason}}",
   "revision": "Als Revision {{number}} der Organisation erfasst. Setzen Sie diese Revision zurück, um den Vorschlag rückgängig zu machen.",
   "appliedNoDiff": "Dieser Vorschlag ist angewendet, seine Änderungen sind also Teil der aktuellen Konfiguration. Vergleichen Sie die Revision, als die er erfasst wurde, um sie zu sehen.",
   "covered": "Änderungsregeln decken jede Änderung unten ab, daher wird dieser Vorschlag ohne einen Menschen angewendet.",
   "notCovered": "Mindestens eine Änderung unten ist durch keine Änderungsregel abgedeckt, daher entscheidet ein Mensch.",
   "refusals": "Harte Grenzen verweigern diese Änderungen. Keine Regel und keine Freigabe kann sie aufheben:",
   "noChanges": "Der Vorschlag enthält keine Änderungen.",
   "columns": {
    "item": "Änderung",
    "change": "Art",
    "rule": "Abgedeckt durch"
   },
   "coveredBy": "Regel {{name}}",
   "reason": "Begründung",
   "reasonPlaceholder": "Optional. Der leitende Agent sieht sie."
  }
 },
 "views": {
  "organizationDetail": {
   "tabs": {
    "proposals": "Vorschläge ({{count}})"
   },
   "appliedProposal": "Angewendeter Vorschlag"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "managementAccess": "Verwaltungszugriff"
   },
   "hints": {
    "managementAccess": "Die meisten Agenten brauchen Keiner. Mit Studio-Entwürfe dürfen Läufe Studio-Änderungen für die Person entwerfen, die sie gestartet hat. Mit Leitung über den eigenen Teilbaum darf der Agent, der eine Organisationseinheit leitet, Änderungen an den Einheiten darunter vorschlagen."
   }
  },
  "changeRules": {
   "title": "Änderungsregeln",
   "subtitle": "Routineänderungen, die leitende Agenten in ihren Teilbäumen vornehmen dürfen, ohne auf einen Menschen zu warten. Was keine Regel abdeckt, braucht weiterhin eine Freigabe.",
   "add": "Regel hinzufügen",
   "create": "Änderungsregel hinzufügen",
   "edit": "Änderungsregel bearbeiten",
   "view": "Änderungsregel",
   "deleteTitle": "Änderungsregel löschen",
   "emptyTitle": "Noch keine Änderungsregeln",
   "emptyBody": "Fügen Sie eine Regel hinzu, damit leitende Agenten Routineänderungen wie das Anpassen des Aufwachplans ohne Freigabe anwenden können.",
   "noLimits": "Keine Grenzen",
   "noExpiry": "Nie",
   "chooseOrganization": "Organisation wählen",
   "chooseUnit": "Einheit wählen",
   "addLimit": "Grenze hinzufügen",
   "filters": {
    "activeOnly": "Zustand",
    "inForce": "Nur in Kraft"
   },
   "columns": {
    "name": "Bezeichnung",
    "status": "Zustand",
    "organization": "Organisation",
    "unit": "Gilt für",
    "classes": "Klassen",
    "limits": "Grenzen",
    "expiresUtc": "Läuft ab",
    "createdByName": "Erstellt von",
    "description": "Beschreibung",
    "createdUtc": "Erstellt",
    "id": "ID"
   },
   "fields": {
    "organizationId": "Organisation",
    "unitId": "Einheit (mit den Einheiten darunter)",
    "name": "Bezeichnung",
    "description": "Beschreibung",
    "classes": "Änderungsklassen",
    "limits": "Grenzen",
    "limitClass": "Klasse",
    "limitName": "Grenze",
    "minimum": "Mindestwert",
    "maximum": "Höchstwert",
    "active": "In Kraft",
    "expiresUtc": "Läuft ab"
   },
   "hints": {
    "organizationId": "Pflichtfeld. Eine Regel bleibt bei ihrer Organisation.",
    "unitId": "Pflichtfeld. Die Regel deckt Änderungen an dieser Einheit und an jeder Einheit darunter ab.",
    "name": "1 bis {{max}} Zeichen.",
    "description": "Optional, höchstens {{max}} Zeichen.",
    "classes": "Pflichtfeld. Ein Vorschlag wird nur dann per Regel angewendet, wenn jede Änderung darin zu einer Klasse gehört, die eine Regel erlaubt.",
    "limits": "Optional, höchstens {{max}}. Änderungen pro Vorschlag begrenzt, wie viele Änderungen einer Klasse ein Vorschlag enthalten darf; die übrigen Grenzen beschränken die neuen Werte.",
    "expiresUtc": "Optional. Ab diesem Zeitpunkt gilt die Regel nicht mehr."
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
})(de, {
 "nav": {
  "items": {
   "evaluations": {
    "label": "Eval-Sets",
    "tip": "Versionierte Sätze von Testfällen, die Agenten vor dem Ausrollen bewerten"
   },
   "evalRuns": {
    "label": "Eval-Läufe",
    "tip": "Läufe eines Eval-Sets gegen eine Bereitstellung oder eine Agentenrevision"
   },
   "shadowTrials": {
    "label": "Schattentests",
    "tip": "Eine Kandidaten-Bereitstellung spielt echte Eingaben nach, ohne zu handeln"
   },
   "canaryReleases": {
    "label": "Canary-Freigaben",
    "tip": "Eine Kandidaten-Bereitstellung übernimmt schrittweise einen wachsenden Anteil des Datenverkehrs"
   }
  }
 },
 "enums": {
  "resourceType": {
   "EvalSet": "Eval-Set",
   "EvalRun": "Eval-Lauf",
   "ShadowTrial": "Schattentest",
   "CanaryRelease": "Canary-Freigabe"
  },
  "notificationEvent": {
   "CanaryRolledBack": "Canary-Freigabe zurückgesetzt"
  },
  "runKind": {
   "Eval": "Eval-Testfall",
   "Shadow": "Schattenkopie"
  },
  "evalSetState": {
   "Draft": "Entwurf",
   "Approved": "Genehmigt"
  },
  "evalSetOrigin": {
   "Human": "Von einer Person geschrieben",
   "Evaluator": "Von einem Agenten geschrieben",
   "Playground": "Aus dem Testbereich"
  },
  "evalScorer": {
   "ExactMatch": "Exakte Übereinstimmung",
   "Contains": "Enthält",
   "JsonSchemaValid": "Gültiges JSON Schema",
   "Judge": "Richter-Agent"
  },
  "evalRunStatus": {
   "Pending": "Ausstehend",
   "Running": "Läuft",
   "Completed": "Abgeschlossen",
   "Failed": "Fehlgeschlagen",
   "Cancelled": "Abgebrochen"
  },
  "evalRunTarget": {
   "AgentRevision": "Agentenrevision",
   "Deployment": "Bereitstellung"
  },
  "evalRunInputMode": {
   "Cases": "Die Testfälle des Sets",
   "RecentInputs": "Letzte Eingaben"
  },
  "shadowTrialStatus": {
   "Running": "Läuft",
   "Completed": "Abgeschlossen",
   "Stopped": "Gestoppt",
   "Failed": "Fehlgeschlagen"
  },
  "canaryStatus": {
   "Running": "Läuft",
   "Promoted": "Hochgestuft",
   "RolledBack": "Zurückgesetzt",
   "Aborted": "Abgebrochen"
  }
 },
 "errorCodes": {
  "EvalSetExists": "Es gibt bereits ein Eval-Set mit diesem Namen. Öffnen und bearbeiten Sie es, um seine nächste Version zu erstellen.",
  "AlreadyApproved": "Diese Version ist bereits genehmigt.",
  "EvalSetEmpty": "Dieses Eval-Set hat noch keine Testfälle. Fügen Sie zuerst einen Testfall hinzu.",
  "EvalSetImmutable": "Diese Version ist genehmigt und bleibt unverändert. Bearbeiten Sie sie, um die nächste Version zu öffnen, oder löschen Sie stattdessen eine Entwurfsversion.",
  "ApprovalIsPeopleOnly": "Nur eine Person kann ein Eval-Set genehmigen. Ein Agent kann das Set, das ihn bewertet, nicht genehmigen.",
  "EvalRunFinished": "Dieser Eval-Lauf ist bereits beendet.",
  "ShadowTrialAlreadyRunning": "Dieser Kandidat begleitet diese Bereitstellung bereits in einem anderen Schattentest.",
  "ShadowTrialNotRunning": "Dieser Schattentest läuft nicht mehr.",
  "CanaryAlreadyRunning": "Eine dieser Bereitstellungen ist bereits Teil einer laufenden Canary-Freigabe.",
  "CanaryNotRunning": "Diese Canary-Freigabe läuft nicht mehr.",
  "EvalGateFailed": "Die Hochstufung braucht einen bestandenen Eval-Lauf dieser Revision gegen das genehmigte Eval-Set der Umgebung, und es gibt noch keinen.",
  "PeopleOnly": "Das können nur Personen und API-Zugangsdaten. Ein Lauf-Token kann es nicht."
 },
 "evals": {
  "versionShort": "v{{version}}",
  "setVersion": "{{name}} v{{version}}",
  "percent": "{{value}}%",
  "progress": "{{completed}} von {{total}} Testfällen, {{passed}} bestanden",
  "noJudge": "Kein Richter",
  "noSet": "Keines",
  "untilStopped": "Bis zum Stoppen",
  "verdict": {
   "passed": "Bestanden",
   "failed": "Unter dem Schwellenwert",
   "none": "Kein Urteil"
  },
  "outcome": {
   "passed": "Bestanden",
   "failed": "Nicht bestanden",
   "errored": "Fehler"
  },
  "target": {
   "deployment": "Bereitstellung {{name}}",
   "revision": "Agent {{agent}}, Revision {{revision}}"
  },
  "actions": {
   "runSet": "Set ausführen",
   "openSet": "Set öffnen",
   "cancelRun": "Lauf abbrechen",
   "stopTrial": "Test stoppen",
   "abortCanary": "Freigabe abbrechen",
   "copyId": "ID kopieren"
  },
  "toasts": {
   "copied": "Die ID wurde kopiert.",
   "approved": "{{name}} v{{version}} genehmigt. Es kann jetzt Hochstufungen absichern.",
   "caseSaved": "Der Testfall wurde gespeichert.",
   "caseSavedNextVersion": "Der Testfall wurde in Version {{version}} gespeichert, einem neuen Entwurf.",
   "caseSavedTo": "Der Testfall wurde in {{name}} gespeichert.",
   "caseRemoved": "Der Testfall wurde entfernt.",
   "caseRemovedNextVersion": "Der Testfall wurde aus Version {{version}} entfernt, einem neuen Entwurf.",
   "setSavedNextVersion": "Als Version {{version}} gespeichert, ein neuer Entwurf.",
   "runStarted": "Ein Eval-Lauf von {{name}} wurde gestartet.",
   "runCancelled": "Der Eval-Lauf wurde abgebrochen.",
   "trialStopped": "Der Schattentest wurde gestoppt.",
   "canaryAborted": "Die Canary-Freigabe wurde abgebrochen. Die ursprünglichen Gewichtungen gelten wieder."
  },
  "reason": {
   "label": "Grund",
   "placeholder": "Optional. Er wird beim Datensatz und im Audit-Protokoll gespeichert."
  },
  "form": {
   "errors": {
    "name": "Geben Sie dem Set einen Namen mit 1 bis {{max}} Zeichen.",
    "description": "Die Beschreibung umfasst höchstens {{max}} Zeichen.",
    "judgeAgent": "Der Name des Richter-Agenten umfasst höchstens {{max}} Zeichen.",
    "tags": "Jedes Schlagwort umfasst höchstens {{max}} Zeichen."
   }
  },
  "set": {
   "nextVersion": "Diese Version ist genehmigt, daher erstellt das Speichern Version {{version}} als Entwurf. Diese Version bleibt unverändert."
  },
  "case": {
   "addTitle": "Testfall zu {{name}} hinzufügen",
   "editTitle": "Testfall {{number}} bearbeiten",
   "save": "Testfall speichern",
   "nextVersion": "Diese Version ist genehmigt, daher geht die Änderung in Version {{version}}, einen neuen Entwurf. Diese Version bleibt unverändert.",
   "fromRun": "Aus Lauf {{id}} gespeichert.",
   "fields": {
    "name": "Name",
    "inputText": "Eingabe",
    "expectedText": "Erwartete Ausgabe",
    "hidden": "Vor den bewerteten Agenten verborgen",
    "checks": "Prüfungen"
   },
   "placeholders": {
    "name": "Optional, zum Beispiel Erstattung über dem Limit",
    "inputText": "Die Nachricht, die der Agent erhält",
    "expectedText": "Was eine gute Antwort sagt"
   },
   "hints": {
    "name": "Optional, höchstens {{max}} Zeichen.",
    "inputText": "Erforderlich. Der Testfall sendet dies als Eingabe an den Agenten.",
    "expectedText": "Optional. Prüfungen mit exakter Übereinstimmung und Enthält vergleichen damit, wenn sie keinen eigenen Text haben; der Richter liest sie als Referenzantwort.",
    "hidden": "Die eigenen Läufe eines Agenten sehen bei einem verborgenen Testfall nur die Punktzahl, nie Eingabe oder erwartete Ausgabe, damit er die Antworten nicht lernen kann."
   },
   "checks": {
    "scorer": "Bewerter",
    "weight": "Gewichtung",
    "add": "Prüfung hinzufügen",
    "remove": "Prüfung {{number}} entfernen",
    "none": "Keine Prüfungen. Der Testfall wird per exakter Übereinstimmung mit der erwarteten Ausgabe bewertet oder, wenn es keine erwartete Ausgabe gibt, vom Richter-Agenten."
   },
   "scorerHints": {
    "ExactMatch": "Besteht, wenn die Ausgabe dem Text entspricht, umgebende Leerzeichen nicht mitgezählt.",
    "Contains": "Besteht, wenn die Ausgabe den Text enthält.",
    "JsonSchemaValid": "Besteht, wenn die Ausgabe JSON ist, das dem Schema entspricht.",
    "Judge": "Der Richter-Agent des Sets bewertet die Ausgabe anhand der Bewertungskriterien und der erwarteten Ausgabe."
   },
   "argumentLabels": {
    "ExactMatch": "Exakter Text",
    "Contains": "Gesuchter Text",
    "JsonSchemaValid": "JSON Schema",
    "Judge": "Bewertungskriterien"
   },
   "argumentPlaceholders": {
    "ExactMatch": "Leer verwendet die erwartete Ausgabe",
    "Contains": "Leer verwendet die erwartete Ausgabe",
    "JsonSchemaValid": "{\"type\": \"object\", \"required\": [\"answer\"]}",
    "Judge": "Optional. Was eine gute Antwort leisten muss"
   },
   "errors": {
    "input": "Ein Testfall braucht einen Eingabetext.",
    "name": "Der Name umfasst höchstens {{max}} Zeichen.",
    "weight": "Eine Gewichtung liegt zwischen 0 und {{max}}.",
    "schema": "Geben Sie hier ein JSON-Schema-Objekt ein.",
    "argument": "Geben Sie den Text an oder füllen Sie die erwartete Ausgabe des Testfalls aus."
   }
  },
  "run": {
   "title": "Eval-Set ausführen",
   "titleFor": "{{name}} v{{version}} ausführen",
   "intro": "Jeder Testfall läuft als eigener Eval-Lauf. Läufe gegen eine Agentenrevision nutzen eine temporäre Bereitstellung und lassen den Live-Datenverkehr unberührt.",
   "start": "Lauf starten",
   "starting": "Wird gestartet...",
   "setOption": "{{name}} v{{version}}",
   "chooseDeployment": "Bereitstellung wählen",
   "chooseAgent": "Agent wählen",
   "fields": {
    "setId": "Eval-Set",
    "targetType": "Bewerten",
    "deploymentId": "Bereitstellung",
    "agentId": "Agent",
    "agentRevisionId": "Revision",
    "inputMode": "Eingaben",
    "recentInputCount": "Nachzuspielende letzte Eingaben",
    "thresholdPercent": "Bestehensschwelle (Prozent)",
    "budgetUsd": "Kostenrahmen (USD)"
   },
   "hints": {
    "setId": "Von jedem Set wird die neueste Version aufgeführt.",
    "targetType": "Eine Bereitstellung so, wie sie jetzt läuft, oder eine Agentenrevision wie der Entwurf, den der Studio-Testbereich ausführt.",
    "agentId": "Erforderlich. Ohne Revision läuft die Entwurfsrevision des Agenten oder seine neueste veröffentlichte.",
    "agentRevisionId": "Optional. Eine Agentenrevisions-ID; leer führt die Entwurfsrevision aus.",
    "inputMode": "Die Testfälle des Sets oder die letzten erfolgreichen Eingaben der Bereitstellung, bewertet vom Richter-Agenten.",
    "recentInputCount": "1 bis {{max}}.",
    "thresholdPercent": "Optional, 0 bis 100. Der Lauf besteht, wenn seine gewichtete Punktzahl diesen Wert erreicht.",
    "budgetUsd": "Optional. Wenn Testfall- und Richterläufe so viel ausgegeben haben, werden die übrigen Testfälle übersprungen und der Lauf schlägt fehl."
   },
   "errors": {
    "set": "Wählen Sie das auszuführende Eval-Set.",
    "deployment": "Wählen Sie die zu bewertende Bereitstellung.",
    "agent": "Wählen Sie den zu bewertenden Agenten.",
    "threshold": "Ein Schwellenwert liegt zwischen 0 und 100 Prozent.",
    "budget": "Ein Kostenrahmen liegt zwischen 0 und {{max}} USD.",
    "recentInputs": "Spielen Sie 1 bis {{max}} letzte Eingaben nach."
   }
  },
  "save": {
   "open": "Als Eval-Testfall speichern",
   "title": "Als Eval-Testfall speichern",
   "intro": "Die Eingabe der Runde und die Antwort des Agenten werden zu einem Testfall. Passen Sie die erwartete Ausgabe so an, dass sie beschreibt, was eine gute Antwort ist, nicht nur, was diese gesagt hat.",
   "set": "Eval-Set",
   "newSet": "Neues Eval-Set...",
   "newSetName": "Name des neuen Sets",
   "newSetHint": "Das neue Set beginnt als Entwurf mit der Herkunft Aus dem Testbereich.",
   "submit": "Testfall speichern",
   "done": "Fertig",
   "openSet": "Set öffnen",
   "runSet": "Set ausführen",
   "entryAgent": "den Einstiegsagenten",
   "saved": "Der Testfall wurde in {{name}} v{{version}} gespeichert.",
   "runHint": "Set ausführen bewertet die Entwurfsrevision von {{agent}}, also die Revision, die dieser Testbereich ausgeführt hat.",
   "errors": {
    "set": "Wählen Sie ein Eval-Set oder erstellen Sie ein neues."
   }
  },
  "setDetail": {
   "title": "Eval-Set",
   "back": "Alle Eval-Sets",
   "notFoundTitle": "Eval-Set nicht gefunden",
   "notFoundBody": "Vielleicht war es ein Entwurf, den jemand gelöscht hat. Genehmigte Versionen bleiben immer erhalten.",
   "approve": "Genehmigen",
   "approveTitle": "{{name}} v{{version}} genehmigen",
   "approveMessage": "Eine genehmigte Version bleibt genau so erhalten und kann Hochstufungen und Canary-Freigaben absichern. Spätere Änderungen erstellen die nächste Version als Entwurf.",
   "approvedNote": "Diese Version ist genehmigt und bleibt unverändert. Wenn Sie das Set oder einen Testfall bearbeiten, entsteht Version {{version}} als Entwurf.",
   "approvedByAt": "{{name}}, {{when}}",
   "needsJudge": "Einige Testfälle werden vom Richter-Agenten bewertet, aber dieses Set hat keinen. Bearbeiten Sie das Set und wählen Sie einen Richter-Agenten, bevor Sie es ausführen.",
   "editTitle": "{{name}} bearbeiten",
   "deleteTitle": "Entwurfsversion löschen",
   "deleteMessage": "{{name}} v{{version}} löschen? Genehmigte Versionen sind nicht betroffen.",
   "cases": "Testfälle ({{count}})",
   "addCase": "Testfall hinzufügen",
   "noCases": "Noch keine Testfälle. Fügen Sie hier einen hinzu oder speichern Sie eine Runde aus dem Studio-Testbereich.",
   "noExpected": "Keine",
   "hidden": "Verborgen",
   "removeCaseTitle": "Testfall {{number}} entfernen",
   "removeCaseMessage": "Diesen Testfall aus dem Entwurf entfernen?",
   "removeCaseApproved": "Diese Version ist genehmigt, daher wird der Testfall aus Version {{version}} entfernt, einem neuen Entwurf. Diese Version behält ihn.",
   "versions": "Versionen",
   "thisVersion": "v{{version}} (diese)",
   "runs": "Letzte Eval-Läufe",
   "allRuns": "Alle Läufe dieser Version",
   "noRuns": "Diese Version wurde noch nicht ausgeführt.",
   "fields": {
    "state": "Zustand",
    "origin": "Herkunft",
    "judgeAgent": "Richter-Agent",
    "tags": "Schlagwörter",
    "authoredBy": "Geschrieben von",
    "approvedBy": "Genehmigt von",
    "previousVersion": "Vorherige Version",
    "lastUpdateUtc": "Zuletzt geändert",
    "description": "Beschreibung"
   },
   "columns": {
    "order": "#",
    "name": "Name",
    "input": "Eingabe",
    "expected": "Erwartete Ausgabe",
    "scorers": "Bewertet durch",
    "hidden": "Verborgen",
    "source": "Aus Lauf"
   },
   "versionColumns": {
    "version": "Version",
    "state": "Zustand",
    "caseCount": "Testfälle",
    "approvedBy": "Genehmigt von",
    "lastUpdateUtc": "Zuletzt geändert"
   },
   "runColumns": {
    "run": "Eval-Lauf",
    "status": "Status",
    "verdict": "Urteil",
    "score": "Punktzahl",
    "target": "Bewertet",
    "createdUtc": "Gestartet"
   }
  },
  "runDetail": {
   "title": "Eval-Lauf",
   "back": "Alle Eval-Läufe",
   "notFoundTitle": "Eval-Lauf nicht gefunden",
   "notFoundBody": "Prüfen Sie die ID oder öffnen Sie den Lauf über sein Eval-Set.",
   "live": "Echtzeit",
   "polling": "Abfrage",
   "failure": "Der Lauf ist fehlgeschlagen: {{reason}}",
   "progressLabel": "Abgeschlossene Testfälle",
   "kpi": {
    "score": "Punktzahl",
    "threshold": "Schwellenwert {{threshold}}",
    "noThreshold": "Kein Schwellenwert",
    "passed": "Bestandene Testfälle",
    "errored": "Testfälle mit Fehler",
    "cost": "Kosten",
    "budget": "Kostenrahmen {{budget}}",
    "noBudget": "Kein Kostenrahmen"
   },
   "fields": {
    "target": "Bewertet",
    "targetType": "Ziel",
    "inputMode": "Eingaben",
    "startedBy": "Gestartet von",
    "createdUtc": "Gestartet",
    "completedUtc": "Beendet",
    "studioDraftId": "Studio-Entwurf"
   },
   "recentInputs": "{{count}} letzte Eingaben",
   "results": "Testfallergebnisse ({{count}})",
   "failingOnly": "Nur nicht bestandene ({{count}})",
   "noFailing": "Alle Testfälle haben bestanden.",
   "noResults": "Dieser Lauf hat keine Testfallergebnisse aufgezeichnet.",
   "waiting": "Warten, bis der erste Testfall abgeschlossen ist.",
   "caseNumber": "Testfall {{number}}",
   "recentInput": "Letzte Eingabe {{number}}",
   "checksPassed": "{{passed}} von {{total}} bestanden",
   "open": "Öffnen",
   "columns": {
    "order": "#",
    "case": "Testfall",
    "outcome": "Ergebnis",
    "score": "Punktzahl",
    "checks": "Prüfungen",
    "output": "Ausgabe"
   },
   "resultTitle": "Testfall {{number}}",
   "resultTitleNamed": "Testfall {{number}}: {{name}}",
   "scoreIs": "Punktzahl {{score}}",
   "openCaseRun": "Testfall-Lauf öffnen",
   "openSourceRun": "Quell-Lauf öffnen",
   "hiddenCase": "Dieser Testfall ist vor den bewerteten Agenten verborgen.",
   "input": "Eingabe",
   "diff": "Erwartete Ausgabe im Vergleich zur Ausgabe",
   "expected": "Erwartet",
   "output": "Ausgabe",
   "noOutput": "Keine Ausgabe.",
   "checks": "Prüfungen",
   "noChecks": "Es wurden keine Prüfungen bewertet.",
   "checkColumns": {
    "scorer": "Bewerter",
    "weight": "Gewichtung",
    "score": "Punktzahl",
    "outcome": "Ergebnis",
    "note": "Hinweis des Bewerters",
    "judgeRun": "Richterlauf"
   },
   "cancelTitle": "Eval-Lauf abbrechen",
   "cancelMessage": "Diesen Lauf von {{name}} abbrechen? Nicht abgeschlossene Testfälle werden mit abgebrochen."
  },
  "shadow": {
   "errors": {
    "name": "Der Name umfasst höchstens {{max}} Zeichen.",
    "source": "Wählen Sie die Bereitstellung, deren Läufe kopiert werden.",
    "candidate": "Wählen Sie die Kandidaten-Bereitstellung.",
    "same": "Der Kandidat muss eine andere Bereitstellung als die Quelle sein.",
    "sample": "Wählen Sie eine Stichprobe von 1 bis 100 Prozent der Läufe.",
    "ends": "Wählen Sie ein Ende in der Zukunft oder lassen Sie das Feld leer, damit der Test bis zum Stoppen läuft."
   }
  },
  "shadowDetail": {
   "title": "Schattentest",
   "back": "Alle Schattentests",
   "notFoundTitle": "Schattentest nicht gefunden",
   "notFoundBody": "Prüfen Sie die ID oder öffnen Sie den Test aus der Liste.",
   "note": "Schattenläufe spielen die Eingaben der Quelle auf dem Kandidaten nach. Sie können keine Werkzeuge mit Nebenwirkungen nutzen, keine Nachrichten senden, kein Gedächtnis schreiben und keine Berichte einreichen, und die Läufe der Quelle sind nicht betroffen.",
   "stopReason": "Gestoppt: {{reason}}",
   "stopTitle": "Schattentest stoppen",
   "stopMessage": "{{name}} stoppen? Es werden keine weiteren Läufe kopiert; die bisherigen Zählungen bleiben erhalten.",
   "kpi": {
    "compared": "Verglichen",
    "agreed": "Übereinstimmend",
    "diverged": "Abweichend",
    "failures": "Fehler des Kandidaten",
    "agreement": "Übereinstimmung"
   },
   "comparison": {
    "text": "Normalisierter Text",
    "set": "Mit einem Eval-Set",
    "judge": "Durch den Richter-Agenten"
   },
   "fields": {
    "source": "Quelle",
    "candidate": "Kandidat",
    "samplePercent": "Stichprobe",
    "comparison": "Verglichen durch",
    "endsUtc": "Endet",
    "createdBy": "Gestartet von",
    "createdUtc": "Gestartet",
    "completedUtc": "Beendet"
   }
  },
  "canary": {
   "stepOf": "Schritt {{number}} von {{total}} bei {{percent}}%",
   "gateText": "{{name}} mit {{score}} oder mehr",
   "noGate": "Keine Eval-Schranke",
   "errors": {
    "agent": "Wählen Sie den Agenten, dessen Datenverkehr verlagert wird.",
    "candidate": "Wählen Sie die Kandidaten-Bereitstellung.",
    "baseline": "Wählen Sie die Basis-Bereitstellung.",
    "same": "Kandidat und Basis müssen verschiedene Bereitstellungen sein.",
    "steps": "Geben Sie mindestens einen Schritt an. Der letzte Schritt ist 100 Prozent.",
    "tooMany": "Eine Freigabe hat höchstens {{max}} Schritte.",
    "increasing": "Der Prozentwert jedes Schritts liegt zwischen 1 und 100 und über dem des vorherigen Schritts.",
    "lastStep": "Der letzte Schritt muss 100 Prozent sein.",
    "errorRate": "Die Fehlerquoten-Obergrenze liegt zwischen 0 und 100 Prozent.",
    "gate": "Eine Eval-Schranke braucht sowohl ein Eval-Set als auch eine Mindestpunktzahl, oder keines von beiden.",
    "score": "Die Mindestpunktzahl liegt zwischen 0 und 100 Prozent."
   }
  },
  "canaryDetail": {
   "title": "Canary-Freigabe",
   "heading": "Canary-Freigabe von {{agent}}",
   "back": "Alle Canary-Freigaben",
   "notFoundTitle": "Canary-Freigabe nicht gefunden",
   "notFoundBody": "Prüfen Sie die ID oder öffnen Sie die Freigabe aus der Liste.",
   "rolledBack": "Zurückgesetzt: {{reason}} Die ursprünglichen Gewichtungen gelten wieder.",
   "aborted": "Abgebrochen: {{reason}} Die ursprünglichen Gewichtungen gelten wieder.",
   "promoted": "Hochgestuft. {{candidate}} übernimmt den gesamten Datenverkehr.",
   "noReason": "kein Grund angegeben.",
   "withWeight": "{{name}} (Gewichtung {{weight}} vor der Freigabe)",
   "gate": "Letzte Eval-Punktzahl von {{score}} oder mehr",
   "steps": "Schritte",
   "columns": {
    "step": "Schritt",
    "weightPercent": "Datenverkehr des Kandidaten",
    "minimumRuns": "Mindestanzahl Läufe",
    "minimumMinutes": "Mindestdauer in Minuten",
    "state": "Zustand"
   },
   "stepStates": {
    "done": "Erledigt",
    "current": "Aktuell",
    "stopped": "Hier gestoppt",
    "pending": "Wartet"
   },
   "abortTitle": "Canary-Freigabe abbrechen",
   "abortMessage": "Die Freigabe abbrechen? Beide Bereitstellungen kehren zu den Gewichtungen zurück, die sie vor dem Start hatten.",
   "fields": {
    "agent": "Agent",
    "candidate": "Kandidat",
    "baseline": "Basis",
    "maxErrorRatePercent": "Fehlerquoten-Obergrenze",
    "gate": "Eval-Schranke",
    "stepStartedUtc": "Aktueller Schritt gestartet",
    "createdBy": "Gestartet von",
    "completedUtc": "Beendet"
   }
  },
  "fieldCodes": {
   "InputRequired": "Ein Testfall braucht einen Eingabetext.",
   "UnknownScorer": "Verwenden Sie Exakte Übereinstimmung, Enthält, Gültiges JSON Schema oder Richter-Agent.",
   "ArgumentRequired": "Geben Sie den Text an oder füllen Sie die erwartete Ausgabe des Testfalls aus.",
   "InvalidJsonSchema": "Dies ist kein gültiges JSON Schema.",
   "TooManyCases": "Das Set enthält bereits die maximale Anzahl an Testfällen.",
   "EvaluatorIsForAgents": "Die Herkunft Von einem Agenten geschrieben gilt für Sets, die ein Agent erstellt hat. Wählen Sie Von einer Person geschrieben oder Aus dem Testbereich.",
   "SetRequired": "Wählen Sie das auszuführende Eval-Set.",
   "TargetRequired": "Wählen Sie, was bewertet werden soll.",
   "RecentInputsNeedDeployment": "Letzte Eingaben spielen die Läufe einer Bereitstellung nach. Bewerten Sie eine Bereitstellung.",
   "NoRecentInputs": "Die Bereitstellung hat noch keine erfolgreichen Läufe zum Nachspielen.",
   "EvalSetEmpty": "Diese Version hat keine Testfälle.",
   "JudgeAgentRequired": "Einige Testfälle brauchen den Richter-Agenten, aber das Set hat keinen. Bearbeiten Sie das Set und wählen Sie einen.",
   "DeploymentNotFound": "Diese Bereitstellung existiert in diesem Mandanten nicht.",
   "SameDeployment": "Wählen Sie zwei verschiedene Bereitstellungen.",
   "DifferentAgent": "Beide Bereitstellungen müssen zum selben Agenten gehören.",
   "DeploymentInactive": "Diese Bereitstellung ist inaktiv. Aktivieren Sie sie zuerst.",
   "AgentMismatch": "Der Agent muss der Agent der Quell-Bereitstellung sein.",
   "EndsInPast": "Wählen Sie ein Ende in der Zukunft oder lassen Sie das Feld leer.",
   "EvalSetNotFound": "Dieses Eval-Set existiert in diesem Mandanten nicht.",
   "AgentNotFound": "Dieser Agent existiert in diesem Mandanten nicht.",
   "EvalGateIncomplete": "Eine Eval-Schranke braucht sowohl ein Eval-Set als auch eine Mindestpunktzahl, oder keines von beiden.",
   "NotIncreasing": "Der Prozentwert jedes Schritts muss über dem des vorherigen Schritts liegen.",
   "LastStepNotFull": "Der letzte Schritt muss 100 Prozent sein."
  }
 },
 "resources": {
  "evalSets": {
   "title": "Eval-Sets",
   "subtitle": "Versionierte Testfälle, die einen Agenten bewerten. Genehmigen Sie eine Version, damit sie Hochstufungen und Canary-Freigaben absichern kann.",
   "add": "Eval-Set hinzufügen",
   "create": "Eval-Set hinzufügen",
   "edit": "Eval-Set bearbeiten",
   "view": "Eval-Set",
   "deleteTitle": "Entwurfsversion löschen",
   "emptyTitle": "Noch keine Eval-Sets",
   "emptyBody": "Fügen Sie hier ein Set mit seinen Testfällen hinzu oder speichern Sie eine Runde aus dem Studio-Testbereich als ersten Testfall.",
   "filters": {
    "latestOnly": "Versionen",
    "newestOnly": "Nur neueste Version",
    "allVersions": "Alle Versionen"
   },
   "columns": {
    "name": "Name",
    "version": "Version",
    "state": "Zustand",
    "origin": "Herkunft",
    "caseCount": "Testfälle",
    "judgeAgent": "Richter-Agent",
    "tags": "Schlagwörter",
    "authoredByName": "Geschrieben von",
    "approvedByName": "Genehmigt von",
    "description": "Beschreibung",
    "lastUpdateUtc": "Zuletzt geändert",
    "id": "ID"
   },
   "fields": {
    "name": "Name",
    "description": "Beschreibung",
    "origin": "Herkunft",
    "judgeAgent": "Richter-Agent",
    "tags": "Schlagwörter"
   },
   "hints": {
    "name": "1 bis {{max}} Zeichen. Der Name bleibt über alle Versionen gleich.",
    "description": "Optional, höchstens {{max}} Zeichen.",
    "origin": "Aus dem Testbereich kennzeichnet Sets, die aus Runden im Testbereich entstanden sind.",
    "judgeAgent": "Der Agent, der Richter-Prüfungen, Testfälle ohne erwartete Ausgabe und letzte Eingaben bewertet.",
    "tags": "Optional, eines pro Zeile, je höchstens {{max}} Zeichen."
   }
  },
  "evalRuns": {
   "title": "Eval-Läufe",
   "subtitle": "Jeder Lauf einer Eval-Set-Version gegen eine Bereitstellung oder eine Agentenrevision, mit seiner Punktzahl im Vergleich zum Schwellenwert.",
   "add": "Set ausführen",
   "create": "Eval-Set ausführen",
   "edit": "Eval-Lauf",
   "view": "Eval-Lauf",
   "deleteTitle": "Eval-Lauf löschen",
   "emptyTitle": "Noch keine Eval-Läufe",
   "emptyBody": "Führen Sie ein Eval-Set aus, um eine Bereitstellung oder eine Entwurfsrevision vor dem Ausrollen zu bewerten.",
   "columns": {
    "setName": "Eval-Set",
    "status": "Status",
    "verdict": "Urteil",
    "score": "Punktzahl",
    "threshold": "Schwellenwert",
    "progress": "Fortschritt",
    "target": "Bewertet",
    "inputMode": "Eingaben",
    "costUsd": "Kosten",
    "startedByName": "Gestartet von",
    "createdUtc": "Gestartet",
    "id": "ID"
   }
  },
  "shadowTrials": {
   "title": "Schattentests",
   "subtitle": "Eine Kandidaten-Bereitstellung spielt einen Anteil der Eingaben einer Live-Bereitstellung nach, ohne zu handeln, und die Ausgaben werden verglichen.",
   "add": "Schattentest starten",
   "create": "Schattentest starten",
   "edit": "Schattentest",
   "view": "Schattentest",
   "deleteTitle": "Schattentest löschen",
   "emptyTitle": "Noch keine Schattentests",
   "emptyBody": "Starten Sie einen Test, um zu sehen, wie eine Kandidaten-Bereitstellung auf echte Eingaben antwortet, bevor sie Datenverkehr übernimmt.",
   "columns": {
    "name": "Name",
    "status": "Status",
    "source": "Quelle",
    "candidate": "Kandidat",
    "samplePercent": "Stichprobe",
    "comparedCount": "Verglichen",
    "agreedCount": "Übereinstimmend",
    "divergedCount": "Abweichend",
    "candidateFailureCount": "Fehler",
    "agreement": "Übereinstimmung",
    "endsUtc": "Endet",
    "createdUtc": "Gestartet",
    "id": "ID"
   },
   "fields": {
    "name": "Name",
    "sourceDeploymentId": "Quell-Bereitstellung",
    "candidateDeploymentId": "Kandidaten-Bereitstellung",
    "samplePercent": "Stichprobe (Prozent)",
    "endsUtc": "Endet",
    "comparisonEvalSetId": "Mit Eval-Set vergleichen",
    "useJudge": "Mit dem Richter-Agenten vergleichen"
   },
   "hints": {
    "name": "Optional, höchstens {{max}} Zeichen.",
    "sourceDeploymentId": "Erforderlich. Ihre erfolgreichen Läufe werden kopiert; sie selbst ist nicht betroffen.",
    "candidateDeploymentId": "Erforderlich. Eine andere Bereitstellung desselben Agenten.",
    "samplePercent": "1 bis 100, Standard 10. Der Anteil der Läufe der Quelle, der kopiert wird.",
    "endsUtc": "Optional. Leer läuft, bis jemand den Test stoppt.",
    "comparisonEvalSetId": "Optional. Ohne Set werden die Ausgaben als normalisierter Text verglichen.",
    "useJudge": "Den Richter-Agenten fragen, ob die beiden Ausgaben übereinstimmen."
   }
  },
  "canaryReleases": {
   "title": "Canary-Freigaben",
   "subtitle": "Eine Kandidaten-Bereitstellung übernimmt schrittweise einen wachsenden Anteil des Datenverkehrs eines Agenten und wird von selbst zurückgesetzt, wenn sie sich fehlerhaft verhält.",
   "add": "Canary-Freigabe starten",
   "create": "Canary-Freigabe starten",
   "edit": "Canary-Freigabe",
   "view": "Canary-Freigabe",
   "deleteTitle": "Canary-Freigabe löschen",
   "emptyTitle": "Noch keine Canary-Freigaben",
   "emptyBody": "Starten Sie eine Freigabe, um Datenverkehr Schritt für Schritt auf eine neue Bereitstellung zu verlagern.",
   "addStep": "Schritt hinzufügen",
   "columns": {
    "agent": "Agent",
    "status": "Status",
    "candidate": "Kandidat",
    "baseline": "Basis",
    "step": "Schritt",
    "maxErrorRatePercent": "Fehlerobergrenze",
    "gate": "Eval-Schranke",
    "rollbackReason": "Grund der Zurücksetzung",
    "createdUtc": "Gestartet",
    "id": "ID"
   },
   "fields": {
    "agentId": "Agent",
    "baselineDeploymentId": "Basis-Bereitstellung",
    "candidateDeploymentId": "Kandidaten-Bereitstellung",
    "steps": "Schritte",
    "weightPercent": "Datenverkehr des Kandidaten (Prozent)",
    "minimumRuns": "Mindestanzahl Läufe",
    "minimumMinutes": "Mindestdauer in Minuten",
    "maxErrorRatePercent": "Fehlerquoten-Obergrenze (Prozent)",
    "evalSetId": "Set der Eval-Schranke",
    "minEvalScorePercent": "Mindest-Eval-Punktzahl (Prozent)"
   },
   "hints": {
    "agentId": "Erforderlich. Beide Bereitstellungen gehören zu ihm.",
    "baselineDeploymentId": "Erforderlich. Sie behält den restlichen Datenverkehr.",
    "candidateDeploymentId": "Erforderlich. Die Bereitstellung, die freigegeben wird.",
    "steps": "1 bis {{max}} Schritte. Jeder Prozentwert liegt über dem vorherigen, und der letzte ist 100.",
    "maxErrorRatePercent": "0 bis 100, Standard 5. Schlagen in einem Schritt mehr Kandidatenläufe fehl, wird die Freigabe zurückgesetzt.",
    "evalSetId": "Optional. Ein Schritt geht nur weiter, wenn der letzte Eval-Lauf dieses Sets die Mindestpunktzahl erreicht.",
    "minEvalScorePercent": "Erforderlich mit einem Set der Eval-Schranke, 0 bis 100."
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
})(de, {
 "nav": {
  "items": {
   "board": {
    "label": "Gremium",
    "tip": "Eine Organisation auf einen Blick: Zustand, offene Punkte, Vorschläge, Ausgaben, Bremsen und der CEO"
   }
  }
 },
 "enums": {
  "notificationEvent": {
   "BoardBrief": "Kurzbericht für das Gremium eingereicht"
  }
 },
 "errorCodes": {
  "BoardCeoMissing": "Diese Organisation hat keinen CEO: Die Stammeinheit braucht eine Leitung mit einem Wächter in der Live-Revision.",
  "BoardCeoUnavailable": "Der Wächter des CEO hat keine Bereitstellung, es gibt also niemanden, mit dem Sie sprechen können. Geben Sie dem Wächter zuerst eine Bereitstellung."
 },
 "views": {
  "organizationDetail": {
   "openBoard": "Gremium"
  }
 },
 "board": {
  "title": "Gremium",
  "subtitle": "Beaufsichtigen Sie eine Organisation von Wächtern: was eine Entscheidung braucht, was es kostet, und die Bremsen.",
  "heading": "Gremium von {{name}}",
  "generated": "Aktualisiert",
  "refresh": "Aktualisieren",
  "openOrganization": "Organisation öffnen",
  "killSwitchOn": "Der Notschalter ist aktiv: Kein Wächter in diesem Mandanten wacht auf, bis er wieder ausgeschaltet wird.",
  "notFoundTitle": "Gremium nicht verfügbar",
  "notFoundBody": "Die Organisation existiert nicht, oder Sie dürfen sie nicht lesen.",
  "picker": {
   "title": "Organisation auswählen",
   "select": "Organisation",
   "choose": "Wählen Sie eine Organisation",
   "open": "Gremium öffnen",
   "emptyTitle": "Noch keine Organisationen",
   "emptyBody": "Erstellen Sie zuerst eine Organisation von Wächtern. Ihr Gremium erscheint dann hier.",
   "organizations": "Zu den Organisationen"
  },
  "chart": {
   "title": "Organigramm und Zustand",
   "empty": "Die Organisation hat noch keine Einheiten. Fügen Sie auf der Organisationsseite Einheiten hinzu und veröffentlichen Sie eine Revision.",
   "health": "Zustand der Einheit",
   "frozen": "Gesperrt",
   "overBudget": "Budget überschritten",
   "columns": {
    "unit": "Einheit",
    "health": "Zustand",
    "escalations": "Offene Eskalationen",
    "brakes": "Bremsen",
    "lastReport": "Letzter Bericht"
   }
  },
  "attention": {
   "title": "Braucht Aufmerksamkeit",
   "empty": "Im Moment braucht nichts das Gremium.",
   "none": "Keine.",
   "escalations_one": "{{count}} offene Eskalation",
   "escalations_other": "{{count}} offene Eskalationen",
   "reports_one": "{{count}} gestörter Bericht",
   "reports_other": "{{count}} gestörte Berichte",
   "caps_one": "{{count}} Einheit am Budgetlimit",
   "caps_other": "{{count}} Einheiten am Budgetlimit",
   "raisedBy": "Gestellt von {{name}}",
   "filedBy": "Eingereicht von {{name}}"
  },
  "proposals": {
   "title": "Vorschläge",
   "empty": "Kein Vorschlag wartet auf eine Entscheidung.",
   "by": "{{agent}} aus {{unit}}",
   "showChanges": "Änderungen anzeigen",
   "hideChanges": "Änderungen ausblenden"
  },
  "evidence": {
   "title": "Belege",
   "empty": "Noch stützen keine Eval-Läufe, Schattentests oder Canary-Freigaben diesen Vorschlag.",
   "since": "Seit der letzten Änderung des Vorschlags am {{when}}.",
   "evalRuns": "Eval-Läufe",
   "shadowTrials": "Schattentests",
   "canaryReleases": "Canary-Freigaben",
   "evalSet": "{{name}} v{{version}}",
   "evalScore": "Bewertung {{score}} gegenüber {{threshold}}, {{done}} von {{total}} Testfällen",
   "stale": "Vor der letzten Änderung",
   "shadow": "Schattentest {{name}}",
   "shadowCounts": "{{agreed}} von {{compared}} übereinstimmend, {{diverged}} abweichend, {{failures}} Fehler des Kandidaten",
   "canary": "Canary-Freigabe von {{name}}",
   "canaryStep": "Schritt {{step}} von {{total}}",
   "rollback": "Zurückgesetzt: {{reason}}"
  },
  "spend": {
   "title": "Ausgaben im Vergleich zum Budget",
   "empty": "Keine Einheit hat im aktuellen Zeitfenster ein Budget oder Ausgaben."
  },
  "brief": {
   "title": "Neuester Kurzbericht",
   "ceo": "CEO: {{name}}, Leitung von {{unit}}.",
   "cadence_one": "Kurzberichte jede Stunde.",
   "cadence_other": "Kurzberichte alle {{count}} Stunden.",
   "noCadence": "Für den Wächter des CEO ist kein Rhythmus für Kurzberichte festgelegt.",
   "empty": "Der CEO hat noch keinen Kurzbericht eingereicht."
  },
  "ceo": {
   "missing": "Die Stammeinheit hat keine Leitung, daher hat die Organisation keinen CEO.",
   "noMandate": "Der CEO hat keinen Wächter in der Live-Revision.",
   "noDeployment": "Der Wächter des CEO hat keine Bereitstellung, mit der Sie sprechen können."
  },
  "brakes": {
   "title": "Bremsen",
   "active_one": "{{count}} aktive Sperre",
   "active_other": "{{count}} aktive Sperren",
   "none": "Nichts ist gesperrt.",
   "frozenBy": "Gesperrt von {{name}}",
   "lift": "Aufheben",
   "freezeOrg": "Organisation sperren",
   "unit": "Einheit",
   "pickUnit": "Wählen Sie eine Einheit",
   "freezeUnit": "Einheit sperren",
   "rollback": "Organigramm zurücksetzen",
   "rollbackTitle": "Das Organigramm zurücksetzen",
   "rollbackMessage": "Die Organisation auf die Revision zurücksetzen, die vor Revision {{number}} live war? Befehlskette, Budgets und Nachrichtenwege folgen ihr sofort.",
   "rollbackNote": "Vom Gremium zurückgesetzt",
   "rolledBack": "Zurückgesetzt. Revision {{number}} ist live."
  },
  "direction": {
   "title": "Anweisung an den CEO",
   "note": "Der Text wird zu einer neuen veröffentlichten Revision des Wächters des CEO, und sein nächster Zyklus liest ihn als Anweisung des Gremiums.",
   "text": "Anweisung",
   "placeholder": "Zum Beispiel: Erstattungen über 500 $ bis zum Ende der Prüfung einer Person vorlegen.",
   "count": "{{count}} von {{max}} Zeichen",
   "changeNote": "Änderungsnotiz",
   "changeNotePlaceholder": "Warum das Gremium diese Anweisung gibt (optional)",
   "submit": "Anweisung senden",
   "given": "Anweisung als Revision {{number}} von {{name}} veröffentlicht.",
   "errors": {
    "required": "Schreiben Sie die Anweisung an den CEO.",
    "tooLong": "Verwenden Sie höchstens {{max}} Zeichen."
   }
  },
  "ceoChat": {
   "title": "Mit dem CEO sprechen",
   "note": "Nachrichten starten eine Unterhaltung mit der Bereitstellung des CEO, gekennzeichnet als Nachrichten des Gremiums.",
   "talkingTo": "Sie sprechen als Gremium mit {{name}}.",
   "conversation": "Unterhaltung",
   "newConversation": "Neue Unterhaltung",
   "new": "Neu",
   "transcript": "Unterhaltung mit dem CEO",
   "empty": "Noch keine Nachrichten. Fragen Sie den CEO, wie es der Organisation geht.",
   "message": "Nachricht",
   "tooLong": "Verwenden Sie höchstens {{max}} Zeichen."
  }
 },
 "wizard": {
  "steps": {
   "keeper": "Erster Wächter"
  },
  "welcomeItemKeeper": "Ihren ersten Wächter erstellen: einen Agenten, der nach Zeitplan aufwacht und auf ein Ziel hinarbeitet.",
  "keeper": {
   "body": "Ein Wächter gibt dem Beispielagenten ein Ziel und weckt ihn nach Zeitplan auf, mit längeren Pausen, solange sich nichts ändert. Er nutzt die Test-Harness und kostet daher nichts. Auf der Seite Wächter können Sie ihn pausieren oder löschen.",
   "objectiveDefault": "Ab und zu nachsehen und melden, dass alles ruhig ist.",
   "description": "Vom Einrichtungsassistenten erstellt.",
   "create": "Wächter erstellen",
   "created": "Wächter {{name}} erstellt. Er wacht nach seinem Zeitplan auf.",
   "ready": "Wächter {{name}} ist bereit. Weiter zum Testlauf."
  }
 },
 "tour": {
  "steps": {
   "autonomy": {
    "title": "Autonomie",
    "body": "Wächter sind Agenten, die nach Zeitplan aufwachen und auf ein Ziel hinarbeiten. Eskalationen, Sperren, der Notschalter, Gedächtnis, Berichte und Nachrichten halten sie unter Kontrolle."
   },
   "board": {
    "title": "Das Gremium",
    "body": "Organisationen fassen Wächter unter einem CEO zusammen. Der Reiter Gremium zeigt Zustand, offene Entscheidungen, Ausgaben und Bremsen einer Organisation und lässt Sie den CEO anweisen und mit ihm sprechen."
   }
  }
 },
 "explainers": {
  "board": {
   "title": "Das Gremium",
   "p1": "Das Gremium ist die Person oder Gruppe über der Stammeinheit einer Organisation. Diese Seite bündelt, was sie braucht: den Zustand jeder Einheit aus ihrem neuesten Bericht, offene Eskalationen, gestörte Berichte, Einheiten am Budgetlimit und Vorschläge, die mit ihren Belegen aus Eval-Läufen, Schattentests und Canary-Freigaben auf eine Entscheidung warten.",
   "p2": "Die Bremsen sperren eine Einheit oder die ganze Organisation, setzen das Organigramm zurück oder halten mit dem Notschalter jeden Wächter an. Eine Anweisung wird zu einer neuen Revision des Wächters des CEO, und Mit dem CEO sprechen öffnet eine gewöhnliche Unterhaltung mit der Bereitstellung des CEO."
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "board": "Gremium: Zustand, offene Punkte, Vorschläge, Ausgaben, Kurzbericht und Bremsen einer Organisation auf einer Seite."
   }
  },
  "enums": {
   "notificationEvent": {
    "BoardBrief": "Der CEO einer Organisation hat einen Kurzbericht für das Gremium eingereicht."
   }
  },
  "views": {
   "organizationDetail": {
    "openBoard": "Das Gremium dieser Organisation öffnen: Zustand, offene Punkte, Vorschläge, Ausgaben, Bremsen und der CEO."
   }
  },
  "wizard": {
   "keeper": {
    "name": "Name des Wächters: Buchstaben, Ziffern, Punkte, Bindestriche und Unterstriche.",
    "objective": "Worauf der Wächter hinarbeitet. Jeder Zyklus liest es.",
    "create": "Den Wächter auf der Test-Harness-Bereitstellung des Beispielagenten erstellen und zum Testlauf wechseln.",
    "skip": "Ohne Wächter fortfahren. Sie können auf der Seite Wächter einen hinzufügen."
   }
  },
  "board": {
   "refresh": "Das Gremium neu laden. Es wird auch aktualisiert, wenn sich die Organisation ändert.",
   "openOrganization": "Die Organisationsseite öffnen, um Einheiten, Budgets und Revisionen zu bearbeiten.",
   "openEscalation": "Die Eskalation öffnen, um sie zu beantworten.",
   "openReport": "Den Bericht mit seinen Kennzahlen, Problemen und Entscheidungen öffnen.",
   "openKeeper": "Den Wächter des CEO mit seinen Zyklen und Revisionen öffnen.",
   "picker": {
    "select": "Die Organisation, deren Gremium geöffnet werden soll.",
    "open": "Das Gremium dieser Organisation öffnen.",
    "organizations": "Die Organisationsseite öffnen, um eine zu erstellen."
   },
   "chart": {
    "title": "Das Live-Organigramm: jede Einheit mit ihrer Leitung, ihren Mitgliedern, dem Zustand aus ihrem neuesten Bericht und ihren Ausgaben.",
    "frozen": "Eine aktive Sperre gilt für diese Einheit oder die ganze Organisation.",
    "overBudget": "Der Teilbaum der Einheit hat im aktuellen Zeitfenster ein ganzes Budget ausgegeben.",
    "columns": {
     "unit": "Die Einheit in der Live-Revision.",
     "health": "Zustand aus dem neuesten in der Einheit eingereichten Bericht. Unbekannt, wenn es keinen gibt.",
     "escalations": "Offene Eskalationen, die Agenten der Einheit gestellt haben.",
     "brakes": "Ob eine Sperre für die Einheit gilt und ob sie ein Budget überschreitet.",
     "lastReport": "Wann der neueste Bericht eingereicht wurde. Öffnet den Bericht."
    }
   },
   "attention": {
    "title": "Was auf das Gremium wartet: offene Eskalationen, beeinträchtigte oder gestörte Berichte der letzten 7 Tage und Einheiten am Budgetlimit."
   },
   "proposals": {
    "title": "Änderungen, die die Leitung der Organisation vorgeschlagen hat und die keine Änderungsregel abdeckte, warten auf eine Person.",
    "toggle": "Die Änderungen des Vorschlags und die jeweils geltende Regel ein- oder ausblenden, vom Server gelesen."
   },
   "evidence": {
    "title": "Eval-Läufe, Schattentests und Canary-Freigaben der vorgeschlagenen Agenten seit der letzten Änderung des Vorschlags.",
    "openEvalRun": "Den Eval-Lauf mit seinen Testfallergebnissen öffnen.",
    "openShadowTrial": "Den Schattentest mit seinen Vergleichen öffnen.",
    "openCanary": "Die Canary-Freigabe mit ihren Schritten öffnen.",
    "stale": "Dieser Eval-Lauf begann vor der letzten Änderung des Vorschlags und prüft daher möglicherweise nicht die aktuellen Änderungen."
   },
   "spend": {
    "title": "Die Ausgaben jeder Einheit im aktuellen Tages- und Monatsfenster im Vergleich zu ihren Budgets."
   },
   "brief": {
    "title": "Der neueste Kurzbericht des CEO für das Gremium und wie oft der Wächter des CEO einen anfordert."
   },
   "brakes": {
    "title": "Arbeit schnell anhalten: eine Einheit oder die Organisation sperren, das Organigramm zurücksetzen oder den Notschalter einschalten.",
    "lift": "Diese Sperre aufheben. Arbeit in ihrem Bereich kann wieder beginnen.",
    "freezeOrg": "Jeden Agenten und Wächter dieser Organisation sperren, bis die Sperre aufgehoben wird. Fragt nach einer Bestätigung.",
    "orgFrozen": "Die Organisation ist bereits gesperrt. Heben Sie zuerst diese Sperre auf.",
    "unit": "Die zu sperrende Einheit, mit allem, was darunter liegt.",
    "freezeUnit": "Die gewählte Einheit und ihren Teilbaum sperren. Fragt nach einer Bestätigung.",
    "rollback": "Zur Revision zurückkehren, die vor der aktuellen live war. Fragt nach einer Bestätigung.",
    "rollbackNone": "Es gibt keine frühere Live-Revision, zu der Sie zurückkehren können."
   },
   "direction": {
    "title": "Den CEO anweisen. Der Text wird als neue Revision des Wächters des CEO mit der Quelle Gremium veröffentlicht.",
    "text": "1 bis 4000 Zeichen. Der nächste Zyklus des CEO liest ihn als Anweisung des Gremiums.",
    "changeNote": "Optional, höchstens 2000 Zeichen. Wird mit der Revision gespeichert.",
    "submit": "Die Anweisung als neue Revision des Wächters des CEO veröffentlichen."
   },
   "ceoChat": {
    "title": "Eine Unterhaltung mit der Bereitstellung des CEO. Jede Nachricht ist ein Lauf, den Sie wie jeden anderen öffnen können.",
    "conversation": "Eine frühere Unterhaltung des Gremiums fortsetzen oder eine neue beginnen.",
    "new": "Eine neue Unterhaltung mit dem CEO beginnen.",
    "message": "Was Sie dem CEO sagen möchten. Enter sendet, Umschalt+Enter fügt eine Zeile hinzu.",
    "send": "Die Nachricht senden. Die Antwort erscheint fortlaufend darunter."
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
})(de, {
 "nav": {
  "items": {
   "performance": {
    "label": "Leistung",
    "tip": "Wie die Einheiten und Agenten einer Organisation arbeiten, mit den Prüfungen, die Agenten nicht bewerten können"
   }
  }
 },
 "enums": {
  "triggerTargetType": {
   "EvalSet": "Geplante Prüfung"
  },
  "notificationEvent": {
   "OrgBudgetFrozen": "Einheit wegen Budget gesperrt"
  },
  "auditEventType": {
   "OrgBudgetFrozen": "Einheit wegen Budget gesperrt",
   "UnitCascadeCancelled": "Alles in einer Einheit abgebrochen"
  },
  "rollbackActiveTicks": {
   "Finish": "Zu Ende laufen lassen",
   "Cancel": "Abbrechen"
  }
 },
 "errorCodes": {
  "OrganizationNotLive": "Die Organisation hat noch keine Live-Revision. Veröffentlichen Sie zuerst eine Revision."
 },
 "resources": {
  "organizations": {
   "fields": {
    "budgetFreezeMarginPercent": "Budget-Sperrspanne (%)"
   },
   "hints": {
    "budgetFreezeMarginPercent": "Von {{min}} bis {{max}}, Standard {{default}}. Eine Einheit, deren Ausgaben ihr Budget um so viel übersteigen, wird gesperrt, bis jemand die Sperre aufhebt. 0 sperrt beim Budget."
   }
  },
  "triggers": {
   "fields": {
    "evalSetId": "Eval-Set",
    "evalJudgeAgentId": "Bewertender Agent",
    "evalRecentInputCount": "Letzte Eingaben"
   },
   "hints": {
    "evalSetId": "Das Set, das die Prüfung ausführt. Die Ergebnisse sehen Führungskräfte auf der Leistungsseite.",
    "checkDeployment": "Pflichtfeld. Die Prüfung spielt die letzten Eingaben dieser Bereitstellung gegen das Set ab.",
    "evalRecentInputCount": "Von {{min}} bis {{max}}, Standard {{default}}. Wie viele der neuesten Eingaben der Bereitstellung jede Prüfung abspielt."
   },
   "errors": {
    "evalSetRequired": "Wählen Sie das Eval-Set, das diese Prüfung ausführt.",
    "deploymentRequired": "Wählen Sie die Bereitstellung, die diese Prüfung bewertet.",
    "evalRecentInputCount": "Geben Sie eine ganze Zahl von {{min}} bis {{max}} ein."
   },
   "setJudge": "Der bewertende Agent des Eval-Sets",
   "checkNotice": "Eine geplante Prüfung läuft als die Person, die sie gespeichert hat. Agenten können Prüfungen weder anlegen noch ändern oder bewerten."
  }
 },
 "organizations": {
  "form": {
   "errors": {
    "margin": "Geben Sie eine ganze Zahl von {{min}} bis {{max}} ein."
   }
  }
 },
 "views": {
  "organizationDetail": {
   "openPerformance": "Leistung",
   "freezeMargin": "Gesperrt bei {{percent}} % über Budget"
  }
 },
 "rollbackTicks": {
  "legend": "Laufende Wächter-Zyklen"
 },
 "cascadeCancel": {
  "action": "Alles in dieser Einheit abbrechen",
  "title": "Alles in {{name}} abbrechen",
  "message": "Jeden wartenden und laufenden Lauf, Wächter-Zyklus, jede offene Eskalation und jede wartende Nachricht der Agenten in {{name}} und allen Einheiten darunter abbrechen? Die Einheit wird dabei nicht gesperrt, neue Arbeit kann also wieder beginnen.",
  "reason": "Grund",
  "reasonPlaceholder": "Warum alles anhält (optional)",
  "keep": "Weiterlaufen lassen",
  "confirm": "Alles abbrechen",
  "working": "Wird abgebrochen...",
  "done": "Alles in {{name}} wurde abgebrochen.",
  "resultIntro": "Alles in {{name}} ist angehalten:",
  "notFrozen": "Die Einheit ist nicht gesperrt. Sperren Sie sie, damit keine neue Arbeit beginnt.",
  "freeze": "Einheit sperren",
  "counts": {
   "runsCancelled": "Abgebrochene Läufe",
   "ticksCancelled": "Abgebrochene Wächter-Zyklen",
   "escalationsWithdrawn": "Zurückgezogene Eskalationen",
   "messagesExpired": "Abgelaufene Nachrichten"
  }
 },
 "performance": {
  "title": "Leistung",
  "subtitle": "Wie jede Einheit und jeder Agent einer Organisation gearbeitet hat: Ergebnisse, Kosten, Latenz, Eskalationen und Eval-Werte.",
  "heading": "Leistung von {{name}}",
  "range": "Von {{from}} bis {{to}}",
  "notFoundTitle": "Leistung nicht verfügbar",
  "notFoundBody": "Die Organisation existiert nicht, oder Sie dürfen sie nicht lesen.",
  "unit": "Einheit",
  "allUnits": "Alle Einheiten",
  "lead": "Leitung",
  "sample": "Lauf {{n}}",
  "outcomes": "{{succeeded}} erfolgreich, {{failed}} fehlgeschlagen, {{cancelled}} abgebrochen",
  "evalScore_one": "{{score}} aus {{count}} Eval-Lauf",
  "evalScore_other": "{{score}} aus {{count}} Eval-Läufen",
  "picker": {
   "title": "Organisation wählen",
   "emptyTitle": "Noch keine Organisationen",
   "emptyBody": "Legen Sie zuerst eine Organisation aus Wächtern an. Ihre Leistung erscheint hier."
  },
  "window": {
   "label": "Zeitraum",
   "24h": "24 Stunden",
   "7d": "7 Tage",
   "30d": "30 Tage",
   "custom": "Eigener",
   "from": "Von",
   "to": "Bis",
   "apply": "Anwenden",
   "errors": {
    "from": "Wählen Sie den ersten Tag.",
    "to": "Wählen Sie den letzten Tag.",
    "order": "Der letzte Tag darf nicht vor dem ersten liegen.",
    "span": "Ein Zeitraum umfasst höchstens {{max}} Tage."
   }
  },
  "chart": {
   "title": "Erfolgsquote und Kosten nach Einheit",
   "successRate": "Erfolgsquote",
   "cost": "Kosten",
   "noRuns": "Keine beendeten Läufe",
   "rateLabel": "Erfolgsquote von {{unit}}: {{value}}",
   "costLabel": "Kosten von {{unit}}: {{value}}"
  },
  "columns": {
   "unit": "Einheit",
   "agent": "Agent",
   "runs": "Läufe",
   "outcomes": "Ergebnisse",
   "successRate": "Erfolgsquote",
   "costUsd": "Kosten",
   "latency": "Latenz p50 / p95 / p99",
   "escalations": "Eskalationen",
   "loopGuardRejections": "Abweisungen des Schleifenschutzes",
   "evalScore": "Eval-Wert",
   "samples": "Beispielläufe"
  },
  "units": {
   "title": "Einheiten",
   "empty": "Keine Einheit steht für diesen Zeitraum im Live-Organigramm."
  },
  "agents": {
   "title": "Agenten",
   "empty": "Kein Agent steht im Live-Organigramm."
  },
  "checks": {
   "title": "Geplante Prüfungen",
   "note": "Prüfungen sind geplante Eval-Läufe gegen die letzten Eingaben einer Bereitstellung. Menschen legen sie an; Agenten können sie weder bewerten noch ändern.",
   "new": "Neue Prüfung",
   "empty": "Keine geplante Prüfung zielt auf die Bereitstellungen dieser Organisation.",
   "never": "Noch nicht gelaufen",
   "passed": "Bestanden",
   "failed": "Unter dem Schwellenwert",
   "columns": {
    "check": "Prüfung",
    "evalSet": "Eval-Set",
    "deployment": "Bereitstellung",
    "schedule": "Zeitplan",
    "lastRun": "Letzter Lauf",
    "lastScore": "Letzter Wert",
    "nextFire": "Nächster Lauf"
   }
  }
 },
 "tour": {
  "steps": {
   "performance": {
    "title": "Leistung",
    "body": "Der Tab Leistung zeigt, wie jede Einheit und jeder Agent einer Organisation in einem Zeitraum gearbeitet hat, und die geplanten Prüfungen, die sie bewerten, ohne dass Agenten sich selbst bewerten."
   }
  }
 },
 "explainers": {
  "performance": {
   "title": "Leistung",
   "p1": "Jede Zeile einer Einheit umfasst die Einheit und alles darunter: im Zeitraum angelegte Läufe, wie sie endeten, die Erfolgsquote (erfolgreich geteilt durch erfolgreich plus fehlgeschlagen), Kosten, Latenzperzentile, ausgelöste Eskalationen, Abweisungen des Schleifenschutzes und den mittleren Wert der Eval-Läufe gegen die Bereitstellungen der Einheit. Eval-, Schatten- und Playground-Läufe zählen nicht.",
   "p2": "Geplante Prüfungen sind EvalSet-Trigger: Nach ihrem Zeitplan führen sie ein freigegebenes Eval-Set gegen die letzten Eingaben einer Bereitstellung aus. Nur Menschen legen sie an, damit kein Agent seine eigene Arbeit bewertet."
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "performance": "Leistung: Ergebnisse, Kosten, Latenz, Eskalationen und Eval-Werte nach Einheit und Agent, mit den geplanten Prüfungen."
   }
  },
  "enums": {
   "triggerTargetType": {
    "EvalSet": "Jede Auslösung startet einen Eval-Lauf des Sets gegen die letzten Eingaben der Bereitstellung. Nur Menschen können solche Trigger anlegen."
   },
   "notificationEvent": {
    "OrgBudgetFrozen": "Die Ausgaben einer Einheit haben ihr Budget um die Spanne der Organisation überschritten, und der Budgetwächter hat sie gesperrt."
   },
   "auditEventType": {
    "OrgBudgetFrozen": "Der Budgetwächter hat eine Einheit gesperrt, deren Ausgaben ihr Budget um die Spanne der Organisation überschritten haben.",
    "UnitCascadeCancelled": "Jemand hat jeden Lauf, Wächter-Zyklus, jede Eskalation und jede wartende Nachricht im Teilbaum einer Einheit abgebrochen."
   },
   "rollbackActiveTicks": {
    "Finish": "Bereits laufende Zyklen werden beendet, ihre Wächter bleiben aber auf den wiederhergestellten Revisionen.",
    "Cancel": "Läufe laufender Zyklen werden abgebrochen, bevor das Organigramm wiederhergestellt wird."
   }
  },
  "resources": {
   "organizations": {
    "budgetFreezeMarginPercent": "Wie weit eine Einheit ihr Budget überschreiten darf, bevor der Budgetwächter sie sperrt, in Prozent: 0 bis 100, Standard 10."
   },
   "triggers": {
    "evalSetId": "Das Eval-Set, das die Prüfung bei jeder Auslösung ausführt.",
    "evalJudgeAgentId": "Der Agent, der die Antworten bewertet. Leer verwendet den bewertenden Agenten des Eval-Sets.",
    "evalRecentInputCount": "Wie viele der neuesten Eingaben der Bereitstellung jeder Eval-Lauf abspielt, 1 bis 50."
   }
  },
  "views": {
   "organizationDetail": {
    "openPerformance": "Die Leistung dieser Organisation nach Einheit und Agent öffnen, mit ihren geplanten Prüfungen."
   }
  },
  "rollbackTicks": {
   "legend": "Was mit Wächter-Zyklen geschieht, die beim Zurücksetzen des Organigramms laufen."
  },
  "board": {
   "brakes": {
    "pickUnitFirst": "Wählen Sie zuerst eine Einheit."
   }
  },
  "cascadeCancel": {
   "action": "Alle Arbeit in dieser Einheit und darunter anhalten: Läufe, Wächter-Zyklen, Eskalationen und wartende Nachrichten. Fragt nach einer Bestätigung.",
   "confirm": "Jetzt alles im Teilbaum der Einheit abbrechen. Das lässt sich nicht rückgängig machen.",
   "reason": "Optional, höchstens 1024 Zeichen. Wird im Audit-Protokoll und bei zurückgezogenen Eskalationen gespeichert.",
   "freeze": "Die Einheit sperren, damit keine neue Arbeit beginnt, bis die Sperre aufgehoben wird.",
   "counts": {
    "runsCancelled": "Wartende und laufende Läufe von Agenten im Teilbaum, die abgebrochen wurden.",
    "ticksCancelled": "Laufende Wächter-Zyklen, die abgebrochen wurden.",
    "escalationsWithdrawn": "Offene Eskalationen von Agenten im Teilbaum, die zurückgezogen wurden.",
    "messagesExpired": "Wartende Nachrichten an Agenten im Teilbaum, die abgelaufen sind."
   }
  },
  "performance": {
   "refresh": "Die Leistung für den gewählten Zeitraum erneut lesen.",
   "unit": "Eine Einheit mit allem darunter zeigen, oder alle Einheiten.",
   "lead": "Dieser Agent leitet seine Einheit.",
   "openAgent": "Den Agenten öffnen.",
   "openRun": "Diesen Beispiellauf öffnen.",
   "picker": {
    "open": "Die Leistung dieser Organisation öffnen."
   },
   "window": {
    "24h": "Die letzten 24 Stunden.",
    "7d": "Die letzten 7 Tage.",
    "30d": "Die letzten 30 Tage.",
    "custom": "Ersten und letzten Tag wählen, höchstens 90 Tage auseinander.",
    "from": "Der erste Tag des Zeitraums (UTC).",
    "to": "Der letzte Tag des Zeitraums (UTC), eingeschlossen.",
    "apply": "Die Leistung für diese Tage lesen."
   },
   "chart": {
    "title": "Erfolgsquote und Kosten des Teilbaums jeder Einheit im Zeitraum.",
    "successRate": "Erfolgreiche Läufe geteilt durch erfolgreiche plus fehlgeschlagene Läufe.",
    "cost": "Ausgaben des Teilbaums der Einheit, skaliert auf die teuerste Einheit."
   },
   "columns": {
    "unit": "Die Einheit. Ihre Zeile umfasst alles darunter.",
    "agent": "Der Agent und die Einheit, in der er sitzt.",
    "runs": "Im Zeitraum angelegte Läufe, ohne Eval-, Schatten- und Playground-Läufe.",
    "outcomes": "Erfolgreiche, fehlgeschlagene und abgebrochene Läufe.",
    "successRate": "Erfolgreich geteilt durch erfolgreich plus fehlgeschlagen. Leer, wenn kein Lauf beendet wurde.",
    "costUsd": "Ausgaben dieser Läufe in US-Dollar.",
    "latency": "Median, 95. und 99. Perzentil der Laufzeit beendeter Läufe.",
    "escalations": "Ausgelöste Eskalationen, mit dem Anteil der Läufe, die eine ausgelöst haben.",
    "loopGuardRejections": "Nachrichten und Weckrufe, die der Schleifenschutz abgewiesen hat.",
    "evalScore": "Mittlerer Wert abgeschlossener Eval-Läufe gegen diese Bereitstellungen, geplante Prüfungen eingeschlossen.",
    "samples": "Bis zu fünf Läufe zum Ansehen: zuerst die neuesten fehlgeschlagenen, dann die neuesten erfolgreichen."
   },
   "units": {
    "title": "Jede Einheit mit den Werten ihres ganzen Teilbaums."
   },
   "agents": {
    "title": "Jeder Agent im Live-Organigramm mit seinen eigenen Werten."
   },
   "checks": {
    "title": "Geplante Eval-Läufe gegen die Bereitstellungen der Organisation, von Menschen eingerichtet.",
    "new": "Den Trigger-Editor mit einer geplanten Prüfung als Ziel öffnen.",
    "openSet": "Das Eval-Set öffnen.",
    "openRun": "Den letzten Eval-Lauf mit seinen Fallergebnissen öffnen.",
    "passed": "Der letzte Lauf hat den Schwellenwert des Sets erreicht.",
    "failed": "Der letzte Lauf blieb unter dem Schwellenwert des Sets.",
    "columns": {
     "check": "Der Trigger, der die Prüfung plant, und ob er aktiv ist.",
     "evalSet": "Das Eval-Set, das die Prüfung ausführt.",
     "deployment": "Die Bereitstellung, deren letzte Eingaben die Prüfung abspielt.",
     "schedule": "Der Cron-Ausdruck des Triggers.",
     "lastRun": "Wann der letzte Eval-Lauf begann, und sein Status. Öffnet den Lauf.",
     "lastScore": "Der Wert des letzten Eval-Laufs, 0 bis 100 Prozent.",
     "nextFire": "Wann die Prüfung das nächste Mal läuft."
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
})(de, {
 "common": {
  "tabs": {
   "scrollBack": "Frühere Tabs zeigen",
   "scrollForward": "Weitere Tabs zeigen"
  }
 },
 "evals": {
  "run": {
   "placeholders": {
    "thresholdPercent": "Keine",
    "budgetUsd": "Keine"
   },
   "hints": {
    "thresholdPercent": "Optional, 0 bis 100. Der Lauf besteht, wenn seine gewichtete Punktzahl ihn erreicht. Leer lassen für keinen Schwellenwert und kein Ergebnis bestanden oder nicht bestanden.",
    "budgetUsd": "Optional. Wenn Fall- und Richterläufe so viel ausgeben, werden die restlichen Fälle übersprungen und der Lauf schlägt fehl. Leer lassen für kein Budget."
   }
  }
 },
 "tips": {
  "permissions": {
   "denied": "Sie dürfen dies nicht tun. Dafür ist {{operation}} auf {{resource}} nötig."
  },
  "views": {
   "escalationDetail": {
    "openKeeperNamed": "Den Keeper öffnen, dessen Tick sie ausgelöst hat. Seine ID ist {{id}}."
   }
  },
  "tabs": {
   "scrollBack": "Die Tableiste zurückscrollen, zu den Tabs vor dem ersten sichtbaren.",
   "scrollForward": "Die Tableiste zu den Tabs scrollen, die hinter ihrem Rand verborgen sind."
  },
  "enums": {
   "wakeSource": {
    "Manual": "Eine Person hat den Keeper geweckt: Jetzt wecken, Fortsetzen, eine Revision veröffentlichen oder Anweisungen geben."
   }
  }
 }
});
