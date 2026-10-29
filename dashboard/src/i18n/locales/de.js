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
    "inputSchemaJson": "Eingabeschema",
    "outputSchemaJson": "Ausgabeschema"
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
    "inputSchemaJson": "Eingabeschema",
    "outputSchemaJson": "Ausgabeschema"
   },
   "hints": {
    "kind": "Manuelle Einträge können jede Art haben, zum Beispiel ein Konvertierungsdienst, den Agents über eine Skill-Ressource erreichen.",
    "requirements": "Ein Lauf eines Agents, der diese Fähigkeit nutzt, geht nur an Worker, die jedes dieser Knotenlabels haben.",
    "sourceMcpServerId": "Optional. Ein Lauf-Token sieht einen Eintrag, der einen Server nennt, nur dann, wenn seine Bereitstellung diesen Server bindet.",
    "inputSchemaJson": "Ein JSON Schema, zum Beispiel {\"type\": \"object\"}. Leer lassen, wenn die Fähigkeit freien Text annimmt."
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
    "architectPromptTemplateId": "Die System-Vorlage, mit der der Architekt arbeitet. Eine Änderung gilt ab seinem nächsten Zug.",
    "architectPromptVersion": "Leer lassen, um der aktuellen Version des Prompts zu folgen; gespeicherte Änderungen gelten dann ab dem nächsten Zug."
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
