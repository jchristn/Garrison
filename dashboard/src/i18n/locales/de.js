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
    tenantId: 'Mandanten-ID',
    email: 'E-Mail',
    password: 'Passwort',
    accessKey: 'Zugangsschlüssel',
    secretKey: 'Geheimer Schlüssel',
    submit: 'Anmelden',
    connecting: 'Anmeldung läuft...',
    restoring: 'Ihre Sitzung wird wiederhergestellt...',
    errorGeneric: 'Anmeldung nicht möglich. Prüfen Sie die Server-URL und Ihre Zugangsdaten.',
    footerHint: 'Standard für lokale Entwicklung: admin@garrison im Mandanten default.'
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
      selected_one: '{{count}} ausgewählt',
      selected_other: '{{count}} ausgewählt',
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
        inputSchemaJson: 'JSON-Schema der Eingabe',
        outputSchemaJson: 'JSON-Schema der Ausgabe',
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
      grafanaSections: { overview: 'Übersicht', http: 'HTTP-API', runs: 'Läufe', agents: 'Agenten', models: 'Modelle und Tokens', workers: 'Worker', kubernetes: 'Kubernetes-Executor', protocols: 'Protokolle', scheduler: 'Scheduler und Warteschlange', database: 'Datenbank', controlPlane: 'Steuerungsebene', security: 'Sicherheit und Authentifizierung', integrations: 'Integrationen', logs: 'Logs und Traces' },
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
