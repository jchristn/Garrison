// Italian catalog for the Garrison dashboard. Mirrors every key in en.js.

import { tips, explainers } from './it.tips.js';

const rp = (title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody) => ({ title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody });

const it = {
  processSecurity: { trustedOnly: "Esecutore Process: solo per attività attendibili. Le esecuzioni condividono utente, file system e rete del worker, con accesso alle altre esecuzioni e alle credenziali del worker. Usare KubernetesJob per input non attendibili." },
  common: {
    eventCodes: { ApprovalRequested: 'Approvazione richiesta', ApprovalDecided: 'Approvazione decisa', StructuredOutputInvalid: 'Output strutturato non valido', RunBlocked: 'Esecuzione bloccata', EventsDropped: 'Eventi scartati', HarnessExited: 'Harness terminato', McpPreflightWarning: 'Avviso della verifica preliminare MCP', McpPreflightPassed: 'Verifica preliminare MCP superata', RepairAttemptStarted: 'Riparazione dell\'output avviata', WorkspacePrepared: 'Area di lavoro preparata', RunGuardTriggered: 'Una protezione ha fermato l\'esecuzione', ConversationFallback: 'Conversazione ricostruita', ConversationResumed: 'Conversazione ripresa', ConversationStateLost: 'Stato della conversazione perso' },
    fieldCodes: { ExpiryInPast: 'Scegli un momento nel futuro.', ParameterInvalid: 'Questo valore non è valido per questo parametro.', ParameterNotAllowed: 'Questa distribuzione non consente ai chiamanti di sovrascrivere questo parametro.', SettingsFileReadOnly: 'Il file delle impostazioni è di sola lettura, quindi questa modifica non si può salvare.', OverriddenByEnvironment: 'Una variabile d\'ambiente imposta questo valore, quindi qui non si può cambiare.', PathRequired: 'Serve il percorso dell\'impostazione.', UnknownSetting: 'Questo server non ha questa impostazione.', TooLong: 'Questo valore è troppo lungo.', NotAllowedValue: 'Scegli uno dei valori consentiti.', NotABoolean: 'Scegli vero o falso.', NotAnInteger: 'Inserisci un numero intero.', OutOfRange: 'Il valore è fuori dall\'intervallo consentito.' },
    serverText: {
      approvalWaitingExpires: 'In attesa che una persona approvi {{subject}}; l\'approvazione {{id}} scade il {{expires}}.',
      approvalWaiting: 'In attesa che una persona approvi {{subject}}; approvazione {{id}}.',
      notApplied: 'Non applicato perché un altro documento non ha superato la convalida.',
      wouldBeUnchanged: 'Già aggiornato; non cambierebbe nulla.',
      wouldBeUpdated: 'Verrebbe aggiornato.',
      wouldBeCreated: 'Verrebbe creato.',
      inUse: '{{what}} è ancora collegato a queste distribuzioni: {{deployments}}. Rimuovi prima i collegamenti.',
      noActiveDeployment: 'L\'agente {{agent}} non ha distribuzioni attive con peso maggiore di zero. Aggiungi una distribuzione o aumenta un peso, poi riprova.',
      toolCallDenied: 'Chiamata allo strumento negata: {{id}}',
      threadStarted: 'Thread avviato.',
      runStartedModel: 'Esecuzione avviata ({{model}}).',
      runStarted: 'Esecuzione avviata.',
      sessionInitializedModel: 'Sessione inizializzata ({{model}}).',
      sessionInitialized: 'Sessione inizializzata.',
      harnessFailed: 'L\'harness ha segnalato un errore.',
      exitedNoResult: 'L\'harness è terminato con codice {{code}} senza un risultato finale.',
      harnessExited: 'L\'harness è terminato: {{status}} ({{outcome}}).',
      harnessExitedCode: 'L\'harness è terminato con codice {{code}}: {{status}} ({{outcome}}).',
      mcpPreflight: 'Verifica preliminare MCP superata. Server verificati: {{count}}.',
      repairAttempt: 'Tentativo {{attempt}} di riparazione dell\'output strutturato: ripresa della sessione dell\'harness in {{path}}.',
      workspacePrepared: 'Area di lavoro preparata in {{path}}.',
      guardRepetitionUnit: 'Protezione dalle ripetizioni: gli ultimi {{window}} caratteri del testo dell\'assistente sono l\'unità di {{size}} caratteri "{{unit}}" ripetuta {{count}} volte.',
      guardDegenerate: 'Protezione dalle ripetizioni: gli ultimi {{window}} caratteri del testo dell\'assistente non contengono lettere né cifre (solo spazi, punteggiatura o simboli) e terminano con "{{tail}}".',
      guardNoProgress: 'L\'esecuzione non è avanzata per {{seconds}} secondi (nessun testo dell\'assistente, ragionamento, chiamata a strumento o risultato di strumento, e nessuna chiamata a strumento aperta); il suo limite noProgressSeconds è {{limit}}.',
      guardOutputLimit: 'Il testo dell\'assistente ha superato il limite maxAssistantChars dell\'esecuzione, pari a {{limit}} caratteri.',
      valueClamped: 'Il valore {{given}} di {{field}} è fuori dall\'intervallo consentito da {{minimum}} a {{maximum}}; è stato salvato {{stored}}.'
    },
    appName: 'Garrison',
    language: { label: 'Lingua' },
    theme: { switchToLight: 'Passa al tema chiaro', switchToDark: 'Passa al tema scuro' },
    actions: {
      apply: 'Applica',
      back: 'Indietro',
      cancel: 'Annulla',
      clear: 'Cancella',
      clone: 'Clona',
      close: 'Chiudi',
      confirm: 'Conferma',
      copied: 'Copiato',
      copy: 'Copia',
      delete: 'Elimina',
      duplicate: 'Duplica',
      edit: 'Modifica',
      hide: 'Nascondi valore',
      logout: 'Esci',
      next: 'Avanti',
      openGithub: 'Apri il repository di Garrison su GitHub',
      remove: 'Rimuovi',
      retry: 'Riprova',
      reveal: 'Mostra valore',
      save: 'Salva',
      view: 'Visualizza',
      viewDetails: 'Visualizza dettagli',
      viewJson: 'Visualizza JSON'
    },
    boolean: { yes: 'Sì', no: 'No' },
    confirm: {
      deleteNamed: 'Eliminare "{{name}}"? Questa operazione non può essere annullata.',
      bulkDelete: 'Eliminare {{count}} record selezionati? Questa operazione non può essere annullata.'
    },
    errors: {
      listItem: 'Elemento {{index}}: {{message}}',
      chooseOne: 'Scegli almeno un\'opzione.',
      fixFields: 'Alcuni campi richiedono attenzione. Controlla i valori evidenziati.',
      invalidEmail: 'Inserisci un indirizzo email valido.',
      invalidJson: 'Questo non è un JSON valido.',
      loadFailed: 'Impossibile caricare i dati.',
      requestId: 'Richiesta {{id}}.',
      required: 'Questo campo è obbligatorio.',
      requiredPermission: 'Richiede {{permission}} su {{resource}}.'
    },
    generic: {
      deletedName: '{{name}} (eliminato)',
      actions: 'Azioni',
      active: 'Attivo',
      all: 'Tutti',
      any: 'Qualsiasi',
      builtIn: 'Predefinito',
      custom: 'Personalizzato',
      inactive: 'Inattivo',
      loading: 'Caricamento...',
      never: 'Mai',
      none: 'Nessuno',
      notAvailable: 'n/d',
      saving: 'Salvataggio...'
    },
    relativeTime: { now: 'adesso' },
    states: {
      forbiddenTitle: 'Non hai accesso a questa pagina',
      forbiddenBody: 'Chiedi a un amministratore un ruolo che conceda l\'accesso, oppure scegli un\'altra pagina.',
      unavailableTitle: 'Non ancora disponibile su questo server',
      unavailableBody: 'Il server non espone gli endpoint {{resource}}. Aggiorna il server o consulta Esplora API per vedere cosa supporta.'
    },
    toasts: {
      bulkDeleted: '{{count}} record eliminati ({{failed}} non riusciti).',
      cloned: 'Clonato.',
      created: 'Creato.',
      deleted: 'Eliminato.',
      saved: 'Salvato.'
    },
    units: { msShort: 'ms', sShort: 's', mShort: 'min', tokPerSec: 'tok/s' }
  },
  errorCodes: {
    ApprovalNotPending: 'Questa approvazione è già stata decisa, quindi non può essere decisa di nuovo.',
    MessageIdConflict: 'Questo ID di messaggio A2A è già stato usato con un contenuto diverso. Invia il messaggio con un nuovo ID.',
    IdempotencyKeyConflict: 'Questa chiave di idempotenza è già stata usata per un\'altra richiesta. Usa una chiave nuova.',
    DeploymentDeleted: 'La distribuzione di questa esecuzione è stata eliminata, quindi l\'esecuzione non può essere ripetuta. Invoca di nuovo l\'agente.',
    AgentDeleted: 'L\'agente di questa esecuzione è stato eliminato, quindi l\'esecuzione non può essere ripetuta.',
    NoActiveDeployment: 'Questo agente non ha distribuzioni attive con peso maggiore di zero. Aggiungi una distribuzione o aumenta un peso.',
    TenantNotFound: 'Questo tenant non esiste. Controlla l\'ID del tenant.',
    NetworkError: 'Impossibile raggiungere il server. Controlla l\'URL del server e che il server sia in esecuzione.',
    AuthenticationRequired: 'La sessione è scaduta. Accedi di nuovo.',
    InvalidCredentials: 'Tenant, email, password o chiavi non corretti.',
    RateLimited: 'Troppi tentativi di accesso. Attendi un minuto e riprova.',
    AuthorizationDenied: 'Non hai l\'autorizzazione per questa azione.',
    NotFound: 'Record non trovato.',
    RouteNotFound: 'Questo server non supporta quell\'endpoint.',
    ValidationFailed: 'Alcuni valori non sono validi.',
    InvalidBody: 'Il corpo della richiesta non è valido.',
    InvalidJson: 'Il corpo della richiesta non è un JSON valido.',
    Conflict: 'Questo è in conflitto con un record esistente.',
    BuiltInImmutable: 'I record predefiniti non possono essere modificati. Clonalo per personalizzarlo.',
    Protected: 'Questo record è protetto e non può essere eliminato.',
    StaleLease: 'Il lease dell\'esecuzione non è più detenuto da quel nodo.',
    InternalError: 'Il server ha riscontrato un errore interno. Controlla i log del server con l\'ID della richiesta.',
    Http400: 'La richiesta è stata rifiutata perché non valida.',
    Http403: 'Non hai l\'autorizzazione per questa azione.',
    Http404: 'Non trovato.',
    Http409: 'Conflitto con lo stato attuale.',
    Http500: 'Il server ha riscontrato un errore interno.',
    Http503: 'Il server non è disponibile.',
    ConversationBusy: 'Questa conversazione sta ancora elaborando il turno precedente. Attendi che quell\'esecuzione finisca, o annullala, e poi riprova.',
    ConversationAgentMismatch: 'Questa conversazione appartiene a un altro agente. Invia il turno a quell\'agente o avvia una nuova conversazione.',
    ConversationDeploymentMismatch: 'Ogni turno di una conversazione viene eseguito sulla distribuzione del suo primo turno. Lascia vuota la distribuzione o avvia una nuova conversazione.',
    ConversationDeploymentUnavailable: 'La distribuzione di questa conversazione è stata eliminata, quindi la conversazione non può continuare. Avvia una nuova conversazione.'
  },
  enums: {
    approvalStatus: {
      Pending: 'In sospeso',
      Approved: 'Approvata',
      Denied: 'Negata',
      Expired: 'Scaduta',
      Cancelled: 'Annullata'
    },
    approvalDecision: {
      Allow: 'Consenti',
      Deny: 'Nega'
    },
    approvalSource: {
      DurableResume: "Approvazione conservata",
      Rule: 'Regola',
      Default: 'Predefinito della distribuzione',
      User: 'Persona',
      Timeout: 'Tempo scaduto',
      Cancelled: 'Esecuzione fermata'
    },
    approvalRuleAction: {
      Allow: 'Consenti',
      Deny: 'Nega',
      Ask: 'Chiedi a una persona'
    },
    approvalKind: {
      Tool: 'Chiamata a strumento',
      Command: 'Comando',
      FileChange: 'Modifica di file'
    },
    principalType: { Administrator: 'Amministratore di sistema', User: 'Utente', Credential: 'Chiave di accesso', Run: 'Token di esecuzione' },
    runBlockedReason: { NoReadyWorker: 'Nessun nodo worker pronto', NoCapableWorker: 'Nessun nodo worker compatibile', NoMatchingPool: 'Nessun pool di nodi corrispondente' },
    promptDelivery: { Stdin: 'Input standard', Argument: 'Argomento della riga di comando', File: 'File su disco', CodexAppServer: 'Server applicativo di Codex (JSON-RPC)' },
    systemPromptDelivery: {
      File: 'File su disco',
      Argument: 'Argomento della riga di comando',
      Environment: 'Variabile d\'ambiente',
      PrependToPrompt: 'Anteposto al prompt',
      None: 'Non inviato'
    },
    mcpConfigFormat: {
      None: 'Nessuna configurazione MCP',
      ClaudeJson: 'Claude Code JSON',
      CodexToml: 'Codex TOML',
      MuxJson: 'Mux JSON',
      GeminiSettings: 'Impostazioni Gemini CLI'
    },
    outputParser: {
      ClaudeStreamJson: 'JSON in streaming di Claude Code',
      CodexJsonl: 'Codex JSONL',
      CodexAppServer: 'JSON-RPC del server applicativo di Codex',
      MuxJsonl: 'Mux JSONL',
      GeminiStreamJson: 'JSON in streaming di Gemini CLI',
      GenericJsonl: 'JSONL generico',
      PlainText: 'Testo semplice'
    },
    resultSource: { ParserFinalEvent: 'Evento finale del parser', LastMessageFile: 'File dell\'ultimo messaggio', Stdout: 'Stdout' },
    successPolicy: { FinalEvent: 'Evento finale', ExitCode: 'Codice di uscita', FinalEventAndExitCode: 'Evento finale e codice di uscita' },
    fileBaseDirectory: { Config: 'Cartella di configurazione', Workspace: 'Area di lavoro', Home: 'Cartella home' },
    artifactStoreKind: { Database: 'Database', Filesystem: 'File system', S3: 'S3' },
    agentInputMode: { Text: 'Testo', Structured: 'JSON strutturato' },
    argumentOverrideOperation: { Append: 'Aggiungi in fondo', Prepend: 'Aggiungi in testa', Remove: 'Rimuovi', Replace: 'Sostituisci' },
    runOverrideValidation: { Any: 'Qualsiasi valore', Enum: 'Uno di un elenco', Regex: 'Espressione regolare', IntegerRange: 'Intervallo di interi' },
    credentialAuthMode: {
      DirectHeader: 'Intestazioni dirette',
      SignedRequest: 'Richieste firmate',
      SessionExchange: 'Scambio con token di sessione',
      Hybrid: 'Qualsiasi metodo'
    },
    operationType: {
      All: 'Tutte le operazioni',
      Create: 'Creare',
      Read: 'Leggere',
      Write: 'Scrivere',
      Update: 'Aggiornare',
      Delete: 'Eliminare',
      Execute: 'Eseguire',
      Admin: 'Amministrare'
    },
    usageQuotaScope: {"Tenant": "Tenant", "Agent": "Agente", "Deployment": "Distribuzione"},
    resourceType: {
      All: 'Tutte le risorse',
      Account: 'Account utente',
      Tenant: 'Tenant',
      Admin: 'Amministrazione',
      User: 'Utente',
      Credential: 'Chiave di accesso',
      Session: 'Sessione',
      Role: 'Ruolo',
      Permission: 'Autorizzazione',
      Assignment: 'Assegnazione',
      Audit: 'Registro di audit',
      RequestHistory: 'Cronologia delle richieste',
      Settings: 'Impostazioni',
      HarnessProfile: 'Profilo harness',
      PromptTemplate: 'Modello di prompt',
      Agent: 'Agente',
      Deployment: 'Distribuzione',
      McpServer: 'Server MCP',
      Secret: 'Segreto',
      Workspace: 'Area di lavoro',
      ArtifactStore: 'Archivio di artefatti',
      ModelPrice: "prezzo del modello",
      UsageQuota: "quota di utilizzo",
      Run: 'Esecuzione',
      Node: 'Nodo',
      NodePool: 'Pool di nodi',
      Manifest: 'Manifest',
      Conversation: 'Conversazione',
      Approval: 'Approvazione',
      Artifact: 'Artefatto'
    },
    runStatus: {
      Pending: 'In sospeso',
      Queued: 'In coda',
      Leased: 'Assegnata',
      Running: 'In esecuzione',
      Cancelling: 'Annullamento in corso',
      Succeeded: 'Riuscita',
      Failed: 'Non riuscita',
      Cancelled: 'Annullata',
      TimedOut: 'Scaduta',
      Rejected: 'Rifiutata'
    },
    runOutcome: {
      None: 'Nessuno',
      Succeeded: 'Riuscita',
      HarnessFailed: 'Errore dell\'harness',
      NotInstalled: 'Harness non installato',
      NotCredentialed: 'Credenziali mancanti',
      McpPreflightFailed: 'Verifica preliminare MCP non riuscita',
      NodeLost: 'Nodo perso',
      OutputLimitExceeded: 'Limite di output superato',
      SchemaValidationFailed: 'Schema di output non valido',
      TimedOut: 'Tempo scaduto',
      Cancelled: 'Annullata',
      StaleLease: 'Lease obsoleto',
      CompileFailed: 'Compilazione non riuscita',
      WorkspaceFailed: 'Errore dell\'area di lavoro',
      Rejected: 'Rifiutata',
      InternalError: 'Errore interno',
      NoCapableWorker: 'Nessun nodo worker compatibile',
      RepetitionDetected: 'Ripetizione rilevata',
      NoProgress: 'Nessun avanzamento',
      PodFailed: 'Pod di esecuzione non riuscito',
      ConversationStateLost: 'Stato della conversazione perso'
    },
    runEventType: {
      Lifecycle: 'Ciclo di vita',
      AssistantText: 'Assistente',
      Thinking: 'Ragionamento',
      ToolCall: 'Chiamata a strumento',
      ToolResult: 'Risultato strumento',
      Usage: 'Utilizzo',
      Progress: 'Avanzamento',
      Warning: 'Avviso',
      Error: 'Errore',
      Stdout: 'Stdout',
      Stderr: 'Stderr',
      Result: 'Risultato'
    },
    nodeStatus: { Ready: 'Pronto', Draining: 'In svuotamento', Cordoned: 'Isolato', Lost: 'Perso', Offline: 'Offline' },
    controlNodeStatus: { Starting: 'In avvio', Ready: 'Pronto', Draining: 'In svuotamento', Offline: 'Offline' },
    backplane: { Local: 'Locale (una replica)', Polling: 'Polling del database', PostgresNotify: 'Notifiche PostgreSQL' },
    harnessType: { ClaudeCode: 'Claude Code', Codex: 'Codex', Mux: 'Mux', GeminiCli: 'Gemini CLI', Generic: 'Generico' },
    agentKind: { Hosted: 'Ospitato', Remote: 'Remoto' },
    delegationMode: { None: 'Nessuna delega', AllowList: 'Elenco consentiti', Any: 'Qualsiasi agente' },
    secretStatus: { Ok: 'Valido', NeedsReauthentication: 'Nuovo accesso necessario' },
    secretKind: {
      AnthropicApiKey: 'Chiave API Anthropic',
      ClaudeCodeOAuthToken: 'Token OAuth di Claude Code',
      OpenAiApiKey: 'Chiave API OpenAI',
      CodexAuthJson: 'auth.json di Codex',
      GeminiApiKey: 'Chiave API Gemini',
      GenericEnv: 'Valore di ambiente',
      GenericFile: 'Contenuto del file',
      BearerToken: 'Token bearer',
      BasicAuth: 'Autenticazione di base',
      GitCredential: 'Credenziali Git'
    },
    workspaceKind: { Empty: 'Vuota', GitRepository: 'Repository Git', Seeded: 'File iniziali', PersistentVolume: 'Volume persistente' },
    runExecutor: { Process: 'Processo', KubernetesJob: 'Job Kubernetes' },
    workspaceRetention: { Delete: 'Elimina', Keep: 'Conserva', KeepOnFailure: 'Conserva in caso di errore' },
    promptTemplateKind: { System: 'Sistema', Task: 'Attività', Fragment: 'Frammento', ToolDescription: 'Descrizione strumento', ConfigFile: 'File di configurazione', Other: 'Altro' },
    permissionType: { Permit: 'Consenti', Deny: 'Nega' },
    resourceScope: { Tenant: 'Tenant', Resource: 'Risorsa' },
    resourceBindingKind: { McpServer: 'Server MCP', Secret: 'Segreto' },
    mcpTransport: { Http: 'HTTP', Stdio: 'stdio' },
    remoteProtocol: { A2A: 'A2A', Mcp: 'MCP' },
    manifestApplyResult: { Created: 'Creato', Updated: 'Aggiornato', Unchanged: 'Invariato', Failed: 'Non riuscito', Validated: 'Convalidato' },
    auditEventType: {
      ApprovalDecided: 'Approvazione decisa',
      AuthSuccess: 'Accesso riuscito',
      AuthFailure: 'Accesso non riuscito',
      SessionIssued: 'Sessione emessa',
      SessionRevoked: 'Sessione revocata',
      CredentialCreated: 'Chiave di accesso creata',
      CredentialRotated: 'Chiave di accesso ruotata',
      CredentialUsed: 'Chiave di accesso usata',
      AuthorizationDenied: 'Autorizzazione negata',
      AuthorizationBypass: 'Autorizzazione aggirata',
      RoleChanged: 'Ruolo modificato',
      PermissionChanged: 'Autorizzazione modificata',
      AssignmentChanged: 'Assegnazione modificata',
      ConfigurationChanged: 'Configurazione modificata',
      SecretChanged: 'Segreto modificato',
      SettingsChanged: 'Impostazioni modificate',
      RestartRequested: 'Riavvio richiesto',
      ManifestApplied: 'Manifest applicato',
      NodeRegistered: 'Nodo registrato',
      NodeStatusChanged: 'Stato del nodo modificato',
      RunCancelled: 'Esecuzione annullata',
      ConversationDeleted: 'Conversazione eliminata'
    },
    conversationFallbackReason: {
      AffinityNodeLost: 'Nodo di affinità non pronto',
      AffinityWaitExpired: 'Attesa di affinità scaduta',
      WorkspaceLost: 'Area di lavoro persa',
      SessionMissing: 'Nessuna sessione da riprendere',
      HarnessChanged: 'Profilo harness cambiato',
      ResumeUnsupported: 'Ripresa non supportata',
      ExecutorWithoutState: 'Esecutore senza stato'
    }
  },
  nav: {
    approvalsPending_one: '{{count}} approvazione in attesa',
    approvalsPending_other: '{{count}} approvazioni in attesa',
    approvalsPending_many: '{{count}} approvazioni in attesa',
    primary: 'Navigazione principale',
    sections: {
      operate: 'Operatività',
      platform: 'Piattaforma',
      administration: 'Amministrazione'
    },
    hubs: {
      approvals: {
        label: 'Approvazioni',
        tip: 'Chiamate a strumenti in attesa di una persona, e ogni decisione'
      },
      home: { label: 'Home', tip: 'Stato della flotta e delle esecuzioni a colpo d\'occhio' },
      invoke: { label: 'Invoca', tip: 'Prova un agente in modo interattivo' },
      runs: { label: 'Esecuzioni', tip: 'Esecuzioni e coda di pianificazione' },
      analytics: { label: 'Analisi', tip: 'Velocità delle esecuzioni, token, costi ed esiti nel tempo' },
      agents: { label: 'Agenti', tip: 'Agenti e distribuzioni che li eseguono' },
      configuration: { label: 'Configurazione', tip: 'Profili harness, modelli di prompt, server MCP, segreti, aree di lavoro, archivi di artefatti e manifest' },
      fleet: { label: 'Flotta', tip: 'Piano di controllo, nodi worker e pool di nodi' },
      access: { label: 'Accesso', tip: 'Tenant, utenti, chiavi di accesso, ruoli e assegnazioni' },
      monitoring: { label: 'Monitoraggio', tip: 'Cronologia delle richieste, audit ed Esplora API' },
      system: { label: 'Sistema', tip: 'Impostazioni e informazioni del server' }
    },
    items: {
      approvals: {
        label: 'Approvazioni',
        tip: 'Consenti o nega le chiamate a strumenti richieste dagli agenti'
      },
      home: { label: 'Home', tip: 'Stato della flotta e delle esecuzioni a colpo d\'occhio' },
      invoke: { label: 'Invoca', tip: 'Prova un agente in modo interattivo' },
      runs: { label: 'Esecuzioni', tip: 'Trova, esamina, annulla e riprova le esecuzioni' },
      queue: { label: 'Coda', tip: 'Pressione di pianificazione per agente e harness' },
      analytics: { label: 'Analisi', tip: 'Velocità delle esecuzioni, token, costi ed esiti nel tempo' },
      nodes: { label: 'Nodi worker', tip: 'Nodi worker e relative capacità harness' },
      controlNodes: { label: 'Piano di controllo', tip: 'Repliche del server che servono l\'API e pianificano le esecuzioni' },
      nodePools: { label: 'Pool di nodi', tip: 'Raggruppa i nodi e dedicali ai tenant' },
      agents: { label: 'Agenti', tip: 'Agenti esposti tramite REST, MCP e A2A' },
      deployments: { label: 'Distribuzioni', tip: 'Collega gli agenti a harness, prompt e risorse' },
      harnessProfiles: { label: 'Profili harness', tip: 'Come ogni harness viene eseguito senza interfaccia' },
      promptTemplates: { label: 'Modelli di prompt', tip: 'Ogni prompt inviato da Garrison, con versioni' },
      mcpServers: { label: 'Server MCP', tip: 'Strumenti disponibili per gli agenti' },
      secrets: { label: 'Segreti', tip: 'Credenziali di harness e integrazioni' },
      workspaces: { label: 'Aree di lavoro', tip: 'Come vengono preparate le aree di lavoro delle esecuzioni' },
      artifactStores: { label: 'Archivi di artefatti', tip: 'Dove vengono archiviati gli artefatti delle esecuzioni' },
      modelPrices: { label: "Prezzi dei modelli", tip: "Tariffe in USD configurate dall’operatore per stimare il costo quando l’harness non lo comunica. Il costo comunicato, anche zero, ha precedenza." },
      usageQuotas: { label: "Quote di utilizzo", tip: "Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione." },
      manifests: { label: 'Manifest', tip: 'Applica ed esporta la configurazione come codice' },
      requests: { label: 'Cronologia richieste', tip: 'Esamina il traffico HTTP e gli errori' },
      audit: { label: 'Audit', tip: 'Eventi di sicurezza e di configurazione' },
      explorer: { label: 'Esplora API', tip: 'Esegui chiamate API dal vivo' },
      tenants: { label: 'Tenant', tip: 'Gestisci i tenant' },
      users: { label: 'Utenti', tip: 'Gestisci gli utenti' },
      credentials: { label: 'Chiavi di accesso', tip: 'Chiavi di accesso per l\'automazione' },
      roles: { label: 'Ruoli', tip: 'Ruoli e autorizzazioni' },
      assignments: { label: 'Assegnazioni', tip: 'Concedi ruoli a utenti e chiavi di accesso' },
      settings: { label: 'Impostazioni', tip: 'Modifica le impostazioni del server e del cluster' },
      serverInfo: { label: 'Info server', tip: 'Endpoint, versione e la tua identità' },
      conversations: {
        label: 'Conversazioni',
        tip: 'Scambi a più turni con un agente'
      }
    },
    setup: 'Configurazione guidata',
    setupTip: 'Configura una chiave di accesso, applica un agente di esempio e provalo',
    tour: 'Tour guidato',
    tourTip: 'Ripeti il tour guidato',
    version: 'Versione {{version}}',
    collapseSidebar: 'Mostra/nascondi navigazione',
    skipToContent: 'Vai al contenuto'
  },
  login: {
    title: 'Garrison',
    subtitle: 'Accedi al piano di controllo degli agenti',
    tabs: { password: 'Email e password', accessKey: 'Chiave di accesso' },
    serverUrl: 'URL del server',
    tenantId: 'ID tenant',
    email: 'Email',
    password: 'Password',
    accessKey: 'Chiave di accesso',
    secretKey: 'Chiave segreta',
    submit: 'Accedi',
    connecting: 'Accesso in corso...',
    restoring: 'Ripristino della sessione...',
    errorGeneric: 'Impossibile accedere. Controlla l\'URL del server e le tue credenziali.',
    footerHint: 'Predefinito per lo sviluppo locale: admin@garrison nel tenant default.'
  },
  topbar: {
    server: 'Server',
    tenant: 'Tenant',
    switchTenant: 'Cambia tenant',
    copyServer: 'Copia URL del server',
    live: 'Dal vivo',
    polling: 'Polling',
    liveOn: 'Aggiornamenti in tempo reale tramite WebSocket',
    liveOff: 'Aggiornamenti in tempo reale non disponibili; le pagine si aggiornano tramite polling',
    health: { healthy: 'Integro', unhealthy: 'Non raggiungibile', unknown: 'Verifica in corso' }
  },
  roles: {
    systemAdmin: 'Amministratore di sistema',
    tenantAdmin: 'Amministratore del tenant',
    user: 'Utente',
    credential: 'Chiave di accesso',
    run: 'Token di esecuzione'
  },
  components: {
    fieldWarnings: { title_one: 'Salvato con {{count}} valore modificato', title_other: 'Salvato con {{count}} valori modificati', body: 'Il server ha accettato la richiesta, ma ha salvato questi valori in modo diverso da come sono stati inviati.', dismiss: 'Chiudi', codes: { ValueClamped: 'Valore limitato all\'intervallo consentito' } },
    approvals: {
      awaiting: 'In attesa di approvazione',
      decideTitle: 'Decidi {{tool}}',
      decision: 'Decisione',
      reason: 'Motivo',
      reasonPlaceholder: 'Facoltativo. Lo vedono l\'agente e il log di audit.',
      remember: 'Memorizza come regola per questa distribuzione',
      rulePattern: 'Pattern della regola',
      rememberHint: 'Aggiunge alla distribuzione una regola con l\'azione {{action}}, così le chiamate corrispondenti vengono decise senza chiedere. Serve anche l\'autorizzazione ad aggiornare la distribuzione.',
      submitAllow: 'Consenti',
      submitDeny: 'Nega',
      timeoutThen: 'poi {{decision}}',
      toasts: {
        allowed: '{{tool}} consentito.',
        denied: '{{tool}} negato.',
        allowedRemembered: '{{tool}} consentito e regola {{pattern}} aggiunta.',
        deniedRemembered: '{{tool}} negato e regola {{pattern}} aggiunta.',
        notPending: 'Questa approvazione è già stata decisa da un\'altra persona o dal suo timeout. L\'elenco ora mostra il risultato.',
        forbidden: 'Puoi leggere le approvazioni ma non deciderle. Chiedi a un amministratore l\'autorizzazione Approval Update.',
        forbiddenRemember: 'Per memorizzare una regola serve anche l\'autorizzazione ad aggiornare la distribuzione. Decidi senza memorizzare, oppure chiedi Deployment Update.'
      }
    },
    approvalCheck: {
      title: 'Prova una chiamata a strumento',
      saveFirst: 'Salva prima la distribuzione. La prova controlla le regole memorizzate dal server.',
      hint: 'Controlla le regole salvate, quindi salva le modifiche prima di provarle. Non viene registrato nulla.',
      toolName: 'Strumento',
      inputs: {
        command: 'Comando',
        url: 'URL',
        query: 'Query di ricerca',
        file_path: 'Percorso del file',
        notebook_path: 'Percorso del notebook',
        pattern: 'Pattern di ricerca'
      },
      run: 'Controlla',
      checking: 'Controllo in corso...',
      byRule: '{{action}} da questa regola:',
      byDefault: '{{action}} dal predefinito della distribuzione, perché nessuna regola corrisponde.',
      suggestedRule: 'Regola suggerita:',
      disabled: 'Le approvazioni sono disattivate per questa distribuzione, quindi le sue esecuzioni non chiedono mai. Attivale e salva per applicare queste regole.'
    },
    blocked: {
      title: 'In attesa di un worker',
      body: 'Questa esecuzione è in coda, ma al momento nessun worker può prenderla.',
      reasons: {
        NoReadyWorker: 'Nessun nodo worker è pronto. Avvia un worker o registrane uno nuovo e controlla nella pagina Flotta i nodi persi, offline, in svuotamento o isolati.',
        NoCapableWorker: 'Ci sono worker pronti, ma nessuno segnala come disponibile l\'harness {{harness}}. Avvia o registra un worker con quell\'harness installato, oppure controlla le sue credenziali e i risultati delle verifiche nella pagina Flotta.',
        NoMatchingPool: 'Un worker pronto può eseguire {{harness}}, ma nessuno corrisponde al pool di nodi o ai selettori di nodo di questa distribuzione. Controlla il posizionamento della distribuzione o aggiungi un worker a quel pool.'
      },
      failNote: 'Quando l\'impostazione del cluster Runtime.FailBlockedAfterSeconds è maggiore di 0, un\'esecuzione che resta bloccata così a lungo fallisce con l\'esito «Nessun nodo worker compatibile».',
      openFleet: 'Apri la flotta',
      openAgent: 'Apri le distribuzioni dell\'agente',
      homeBanner_one: '{{count}} esecuzione in coda non può partire: nessun worker pronto può eseguirla.',
      homeBanner_many: '{{count}} esecuzioni in coda non possono partire: nessun worker pronto può eseguirle.',
      homeBanner_other: '{{count}} esecuzioni in coda non possono partire: nessun worker pronto può eseguirle.',
      showRuns: 'Mostra le esecuzioni in coda',
      queueColumn: 'Bloccate',
      queueCount_one: '{{count}} bloccata',
      queueCount_many: '{{count}} bloccate',
      queueCount_other: '{{count}} bloccate'
    },
    autoRefresh: {
      label: 'Aggiornamento automatico',
      none: 'Disattivato',
      seconds_one: 'Ogni {{count}} secondo',
      seconds_other: 'Ogni {{count}} secondi',
      seconds_many: 'Ogni {{count}} secondi'
    },
    chart: {
      success: 'Riuscite',
      failure: 'Non riuscite',
      total: 'Totale',
      avgDuration: 'Durata media',
      noData: 'Nessuna attività in questo intervallo.',
      range: 'Intervallo di tempo',
      ranges: { hour: 'Ultima ora', day: 'Ultimo giorno', week: 'Ultima settimana', month: 'Ultimo mese', custom: 'Personalizzato' }
    },
    compilePreview: {
      title: 'Anteprima di compilazione',
      input: 'Input di esempio',
      compile: 'Compila',
      compiling: 'Compilazione...',
      commandLine: 'Riga di comando',
      stdin: 'Input standard',
      environment: 'Ambiente',
      files_one: '{{count}} file',
      files_other: '{{count}} file',
      files_many: '{{count}} file'
    },
    confirm: { title: 'Conferma', message: 'Vuoi davvero continuare?' },
    diff: { before: 'Prima', after: 'Dopo' },
    explainer: { about: 'Informazioni su {{topic}}', dismiss: 'Nascondi questa spiegazione' },
    export: { label: 'Esporta', csv: 'CSV (dati)', png: 'Immagine PNG', svg: 'Immagine SVG', json: 'JSON (dati)', failed: 'Esportazione non riuscita. {{message}}', tableTitle: 'tabella {{table}}' },
    filters: {
      allTenants: 'Tutti i tenant',
      clear: 'Cancella filtri',
      from: 'Da',
      to: 'A',
      method: 'Metodo',
      path: 'Il percorso contiene',
      pathPlaceholder: 'ad esempio /v1.0/api/tenants',
      searchName: 'Cerca per nome',
      status: 'Codice di stato',
      statusPlaceholder: 'ad esempio 404',
      tenant: 'Tenant'
    },
    form: {
      addItem: 'Aggiungi elemento',
      addRow: 'Aggiungi riga',
      key: 'Chiave',
      value: 'Valore',
      moveUp: 'Sposta su',
      moveDown: 'Sposta giù',
      noItems: 'Ancora nessun elemento.',
      onePerLine: 'Un valore per riga',
      steps: 'Passaggi del modulo'
    },
    mcpTest: {
      title: 'Test di connessione MCP',
      testing: 'Connessione ed elenco degli strumenti...',
      ok: 'Connesso',
      failed: 'Non riuscito',
      tools_one: '{{count}} strumento',
      tools_other: '{{count}} strumenti',
      tools_many: '{{count}} strumenti'
    },
    permissions: {
      title: 'Autorizzazioni effettive',
      none: 'Nessuna concessione. Questo principal può usare solo eventuali regole di bypass.',
      source: 'Ruolo',
      type: 'Tipo',
      resources: 'Tipi di risorsa',
      operations: 'Operazioni',
      scope: 'Ambito'
    },
    requestDetails: {
      title: 'Dettagli della richiesta',
      metadata: 'Metadati',
      requestHeaders: 'Header della richiesta',
      requestBody: 'Corpo della richiesta',
      responseHeaders: 'Header della risposta',
      responseBody: 'Corpo della risposta',
      rawJson: 'JSON grezzo',
      truncated: 'Troncato (originale di {{bytes}} byte)',
      empty: 'Nessun contenuto.',
      fields: {
        id: 'ID richiesta',
        method: 'Metodo',
        path: 'Percorso',
        url: 'URL',
        status: 'Stato',
        duration: 'Durata',
        createdUtc: 'Creata',
        completedUtc: 'Completata',
        sourceIp: 'IP di origine',
        principal: 'Principal',
        tenant: 'Tenant',
        user: 'Utente'
      }
    },
    secretOnce: {
      title: 'Copia ora questo segreto',
      warning: 'Il segreto viene mostrato solo questa volta. Conservalo in un luogo sicuro prima di chiudere.',
      accessKey: 'Chiave di accesso',
      secretKey: 'Chiave segreta',
      done: 'L\'ho salvato'
    },
    table: {
      bulkActions: 'Azioni di gruppo',
      bulkDelete: 'Elimina selezionati',
      clearSelection: 'Cancella selezione',
      empty: 'Nessun record da visualizzare.',
      first: 'Prima pagina',
      jump: 'Vai alla pagina',
      last: 'Ultima pagina',
      loading: 'Caricamento dei record...',
      next: 'Pagina successiva',
      noMatches: 'Nessun record corrisponde ai filtri attuali.',
      pageOf: 'Pagina {{page}} di {{total}}',
      pageSize: 'Per pagina',
      pinned: 'Sempre visibile',
      prev: 'Pagina precedente',
      records_one: 'record',
      records_other: 'record',
      records_many: 'record',
      refresh: 'Aggiorna',
      selectAll: 'Seleziona tutte le righe di questa pagina',
      selectColumns: 'Seleziona colonne',
      selected_one: '{{count}} selezionato',
      selected_other: '{{count}} selezionati',
      selected_many: '{{count}} selezionati',
      selectRow: 'Seleziona riga',
      showing: 'Visualizzati da {{from}} a {{to}}',
      sortBy: 'Ordina per {{column}}',
      sortPageOnly: 'Ordina solo la pagina corrente'
    }
  },
  resources: {
    approvals: {
      ...rp('Approvazioni', 'Chiamate a strumenti richieste dagli agenti, decise da una regola della distribuzione, dal predefinito della distribuzione, da una persona o da un timeout. Quelle in sospeso aspettano te.', 'Aggiungi approvazione', 'Crea approvazione', 'Modifica approvazione', 'Dettagli dell\'approvazione', 'Elimina approvazione', 'Ancora nessuna approvazione', 'Le approvazioni compaiono quando una distribuzione con le approvazioni attive chiede prima di una chiamata a strumento.'),
      columns: {
        createdUtc: 'Richiesta il',
        agentName: 'Agente',
        toolName: 'Strumento',
        summary: 'Richiesta',
        status: 'Stato',
        decision: 'Decisione',
        decisionSource: 'Origine',
        decidedBy: 'Decisa da',
        expiresUtc: 'Scadenza',
        kind: 'Tipo',
        harnessType: 'Harness',
        runId: 'Esecuzione',
        waitMs: 'Attesa',
        reason: 'Motivo',
        decidedUtc: 'Decisa il',
        id: 'ID'
      },
      fields: {
        status: 'Stato',
        decision: 'Decisione',
        decisionSource: 'Origine della decisione',
        decidedBy: 'Decisa da',
        toolName: 'Strumento',
        kind: 'Tipo',
        harnessType: 'Harness',
        agentName: 'Agente',
        runId: 'Esecuzione',
        rootRunId: 'Esecuzione radice',
        deploymentId: 'Distribuzione',
        leaseEpoch: 'Epoca del lease',
        requestedUtc: 'Richiesta il',
        expiresUtc: 'Scadenza',
        decidedUtc: 'Decisa il',
        waitMs: 'Tempo di attesa',
        timeoutDecision: 'Decisione allo scadere del timeout',
        toolCallId: 'ID della chiamata a strumento',
        reason: 'Motivo',
        summary: 'Riepilogo',
        inputPreview: 'Input (oscurato)',
        rulePattern: 'Regola corrispondente',
        ruleId: 'ID della regola',
        suggestedRule: 'Regola suggerita',
        rememberedRuleId: 'ID della regola memorizzata'
      },
      filters: {
        runId: 'ID dell\'esecuzione',
        runIdPlaceholder: 'ID dell\'esecuzione (run_...)'
      },
      actions: {
        allow: 'Consenti',
        deny: 'Nega',
        openRun: 'Apri esecuzione'
      }
    },
    tenants: {
      ...rp('Tenant', 'Spazi isolati, ciascuno con i propri utenti, agenti, segreti ed esecuzioni.', 'Aggiungi tenant', 'Crea tenant', 'Modifica tenant', 'Dettagli del tenant', 'Elimina tenant', 'Ancora nessun tenant', 'Crea un tenant per isolare un team o un cliente.'),
      columns: { name: 'Nome', id: 'ID', description: 'Descrizione', active: 'Attivo', createdUtc: 'Creato' },
      fields: { name: 'Nome', description: 'Descrizione', active: 'Attivo' }
    },
    users: {
      ...rp('Utenti', 'Persone che accedono a questo tenant con email e password.', 'Aggiungi utente', 'Crea utente', 'Modifica utente', 'Dettagli dell\'utente', 'Elimina utente', 'Ancora nessun utente', 'Aggiungi un utente per consentire a una persona di accedere a questo tenant.'),
      columns: { email: 'Email', name: 'Nome', id: 'ID', role: 'Ruolo', active: 'Attivo', createdUtc: 'Creato' },
      fields: { email: 'Email', password: 'Password', firstName: 'Nome', lastName: 'Cognome', isTenantAdmin: 'Amministratore del tenant', isAdmin: 'Amministratore di sistema', active: 'Attivo' },
      hints: { isAdmin: 'Gli amministratori di sistema possono gestire ogni tenant e aggirare ogni autorizzazione.', password: 'Lascia vuoto in modifica per mantenere la password attuale.' },
      actions: { permissions: 'Autorizzazioni effettive' }
    },
    credentials: {
      ...rp('Chiavi di accesso', 'Chiavi di accesso usate da automazioni, SDK e integrazioni. I segreti vengono mostrati una sola volta.', 'Aggiungi chiave di accesso', 'Crea chiave di accesso', 'Modifica chiave di accesso', 'Dettagli della chiave di accesso', 'Elimina chiave di accesso', 'Ancora nessuna chiave di accesso', 'Crea una chiave di accesso per consentire a uno script o a un servizio di chiamare Garrison.'),
      columns: { name: 'Nome', accessKey: 'Chiave di accesso', secretKeyLast4: 'Segreto', userId: 'Proprietario', lastUsedUtc: 'Ultimo utilizzo', expiresUtc: 'Scadenza', active: 'Attiva', id: 'ID' },
      fields: { name: 'Nome', userId: 'Proprietario', authMode: 'Modalità di autenticazione', expiresUtc: 'Scadenza', active: 'Attiva' },
      hints: { userId: 'Una chiave di accesso non può mai superare le autorizzazioni del suo proprietario.' },
      actions: { rotate: 'Ruota segreto' }
    },
    roles: {
      ...rp('Ruoli', 'I ruoli raggruppano le autorizzazioni. I ruoli predefiniti sono di sola lettura; clonane uno per personalizzarlo.', 'Aggiungi ruolo', 'Crea ruolo', 'Modifica ruolo', 'Dettagli del ruolo', 'Elimina ruolo', 'Ancora nessun ruolo', 'Crea un ruolo personalizzato o clona un ruolo predefinito.'),
      columns: { name: 'Nome', description: 'Descrizione', isBuiltIn: 'Tipo', active: 'Attivo', id: 'ID', createdUtc: 'Creato' },
      fields: { name: 'Nome', description: 'Descrizione', active: 'Attivo' }
    },
    permissions: {
      ...rp('Autorizzazioni', 'Consenti o nega operazioni sui tipi di risorsa. Il diniego prevale sempre.', 'Aggiungi autorizzazione', 'Crea autorizzazione', 'Modifica autorizzazione', 'Dettagli dell\'autorizzazione', 'Elimina autorizzazione', 'Ancora nessuna autorizzazione', 'Crea un\'autorizzazione e associala a un ruolo.'),
      columns: { name: 'Nome', permissionType: 'Tipo', resourceTypes: 'Tipi di risorsa', operationTypes: 'Operazioni', isBuiltIn: 'Origine', id: 'ID' },
      fields: { name: 'Nome', permissionType: 'Tipo', resourceTypes: 'Tipi di risorsa', operationTypes: 'Operazioni', active: 'Attiva' }
    },
    userAssignments: {
      ...rp('Assegnazioni utente', 'Concedi ruoli agli utenti con ambito tenant o risorsa.', 'Aggiungi assegnazione utente', 'Crea assegnazione utente', 'Modifica assegnazione utente', 'Dettagli dell\'assegnazione utente', 'Elimina assegnazione utente', 'Ancora nessuna assegnazione utente', 'Assegna un ruolo a un utente.'),
      columns: { userId: 'Utente', roleName: 'Ruolo', resourceScope: 'Ambito', resourceId: 'Risorsa', active: 'Attiva', createdUtc: 'Creata', id: 'ID' },
      fields: { userId: 'Utente', roleId: 'Ruolo', resourceScope: 'Ambito', resourceId: 'ID risorsa', inheritsToChildren: 'Si applica alle risorse del tenant', active: 'Attiva' }
    },
    credentialAssignments: {
      ...rp('Assegnazioni chiave di accesso', 'Concedi ruoli alle chiavi di accesso. Mantieni le chiavi più limitate dei loro proprietari.', 'Aggiungi assegnazione chiave', 'Crea assegnazione chiave', 'Modifica assegnazione chiave', 'Dettagli dell\'assegnazione chiave', 'Elimina assegnazione chiave', 'Ancora nessuna assegnazione chiave di accesso', 'Assegna un ruolo a una chiave di accesso.'),
      columns: { credentialId: 'Chiave di accesso', roleName: 'Ruolo', resourceScope: 'Ambito', resourceId: 'Risorsa', active: 'Attiva', createdUtc: 'Creata', id: 'ID' },
      fields: { credentialId: 'Chiave di accesso', roleId: 'Ruolo', resourceScope: 'Ambito', resourceId: 'ID risorsa', inheritsToChildren: 'Si applica alle risorse del tenant', active: 'Attiva' }
    },
    harnessProfiles: {
      ...rp('Profili harness', 'Descrivono esattamente come un harness viene eseguito senza interfaccia: eseguibile, argomenti, ambiente, file e analisi dell\'output.', 'Aggiungi profilo harness', 'Crea profilo harness', 'Modifica profilo harness', 'Dettagli del profilo harness', 'Elimina profilo harness', 'Ancora nessun profilo harness', 'Clona un profilo predefinito per personalizzare l\'avvio di un harness.'),
      steps: { basics: 'Dati di base', invocation: 'Invocazione', output: 'Output', limits: 'Limiti' },
      columns: { name: 'Nome', harnessType: 'Harness', executable: 'Eseguibile', outputParser: 'Parser', isBuiltIn: 'Origine', id: 'ID', createdUtc: 'Creato' },
      fields: {
        name: 'Nome',
        description: 'Descrizione',
        harnessType: 'Tipo di harness',
        executable: 'Eseguibile',
        probeArguments: 'Argomenti per la verifica della versione',
        active: 'Attivo',
        arguments: 'Argomenti',
        argTemplate: 'Modello',
        argCondition: 'Condizione',
        argRepeatOver: 'Ripeti su',
        promptDelivery: 'Consegna del prompt',
        promptArgumentTemplate: 'Argomento o nome file del prompt',
        systemPromptDelivery: 'Consegna del prompt di sistema',
        systemPromptTarget: 'Destinazione del prompt di sistema',
        mcpConfigFormat: 'Formato della configurazione MCP',
        mcpConfigFileName: 'Nome file della configurazione MCP',
        environment: 'Ambiente',
        envName: 'Nome',
        envValue: 'Modello del valore',
        isSecret: 'Segreto',
        files: 'File',
        fileBase: 'Directory di base',
        filePath: 'Percorso',
        fileContent: 'Modello del contenuto',
        fileMode: 'Modalità',
        credentialEnvironmentAllowlist: 'Variabili di credenziali consentite',
        outputParser: 'Parser dell\'output',
        genericTextField: 'Percorso del campo di testo',
        genericFinalField: 'Percorso del campo del risultato finale',
        genericSuccessField: 'Percorso del campo di successo',
        genericSuccessValue: 'Valore di successo',
        resultSource: 'Origine del risultato',
        resultFileName: 'Nome file del risultato',
        successPolicy: 'Criterio di successo',
        successExitCodes: 'Codici di uscita di successo',
        defaultTimeoutSeconds: 'Timeout predefinito (secondi)',
        killGraceSeconds: 'Tolleranza prima della terminazione forzata (secondi)',
        maxOutputBytes: 'Output massimo (byte)',
        stderrTailBytes: 'Coda di Stderr (byte)',
        isolateHome: 'Isola HOME per ogni esecuzione',
        supportsResume: 'Supporta la ripresa della sessione'
      },
      hints: {
        arguments: 'Ogni modello produce un argomento. Una condizione che produce un valore vuoto o false salta l\'argomento.',
        executable: 'Nome del comando nel PATH del worker, oppure un percorso assoluto.',
        environment: 'Fai riferimento ai segreti collegati con {{secret.alias}}. L\'ambiente del processo parte vuoto, a eccezione dell\'elenco consentiti.',
        successPolicy: 'Per impostazione predefinita Garrison determina il successo dall\'evento finale del parser, non dal codice di uscita.'
      },
      errors: { reservedPrefix: 'Il prefisso builtin/ è riservato.' }
    },
    promptTemplates: {
      deleteBound_many: '"{{name}}" è collegato a {{count}} distribuzioni, quindi il server rifiuterà l\'eliminazione. Rimuovi prima i collegamenti da queste distribuzioni:',
      deleteBound_other: '"{{name}}" è collegato a {{count}} distribuzioni, quindi il server rifiuterà l\'eliminazione. Rimuovi prima i collegamenti da queste distribuzioni:',
      deleteBound_one: '"{{name}}" è collegato a {{count}} distribuzione, quindi il server rifiuterà l\'eliminazione. Rimuovi prima il collegamento da questa distribuzione:',
      deleteUnbound: 'Eliminare "{{name}}" e tutte le sue versioni? Nessuna distribuzione lo collega. Questa operazione non può essere annullata.',
      ...rp('Modelli di prompt', 'Ogni prompt e file di configurazione generato da Garrison. Ogni salvataggio crea una versione.', 'Aggiungi modello', 'Crea modello', 'Modifica modello', 'Dettagli del modello', 'Elimina modello', 'Ancora nessun modello di prompt', 'Crea un modello o clona uno predefinito.'),
      add: 'Nuovo modello',
      columns: { name: 'Nome', kind: 'Tipo', currentVersion: 'Versione', description: 'Descrizione', isBuiltIn: 'Origine', id: 'ID', lastUpdateUtc: 'Aggiornato' },
      fields: { name: 'Nome', kind: 'Tipo', description: 'Descrizione' }
    },
    mcpServers: {
      ...rp('Server MCP', 'Server MCP che gli agenti possono usare. Header e ambiente possono fare riferimento a segreti.', 'Aggiungi server MCP', 'Crea server MCP', 'Modifica server MCP', 'Dettagli del server MCP', 'Elimina server MCP', 'Ancora nessun server MCP', 'Registra un server MCP per consentire alle distribuzioni di collegarlo.'),
      columns: { name: 'Nome', transport: 'Trasporto', endpoint: 'Endpoint', required: 'Obbligatorio', active: 'Attivo', id: 'ID', createdUtc: 'Creato' },
      fields: {
        name: 'Nome',
        transport: 'Trasporto',
        description: 'Descrizione',
        url: 'URL di base',
        path: 'Percorso MCP',
        headers: 'Header',
        headerName: 'Nome',
        headerValue: 'Modello del valore',
        command: 'Comando',
        arguments: 'Argomenti',
        environment: 'Ambiente',
        requiredTools: 'Strumenti obbligatori',
        toolTimeoutSeconds: 'Timeout degli strumenti (secondi)',
        required: 'Fai fallire l\'esecuzione se non raggiungibile',
        active: 'Attivo'
      },
      hints: { requiredTools: 'La verifica preliminare fa fallire l\'esecuzione prima dell\'avvio se manca uno strumento elencato.' },
      actions: { test: 'Prova connessione' }
    },
    secrets: {
      errors: { expiryPast: 'Scegli una scadenza nel futuro, oppure lascia vuoto perché il segreto non scada mai.' },
      ...rp('Segreti', 'Credenziali cifrate per harness e integrazioni. I valori sono di sola scrittura.', 'Aggiungi segreto', 'Crea segreto', 'Modifica segreto', 'Dettagli del segreto', 'Elimina segreto', 'Ancora nessun segreto', 'Aggiungi la chiave API o il token di cui hanno bisogno i tuoi agenti, ad esempio una chiave API Anthropic.'),
      notSet: 'Non impostato',
      neverRefreshed: 'Non ancora',
      reauth: { title: 'Per questo accesso serve un nuovo login', since: 'Dal {{time}}', action: 'Le esecuzioni che usano questo segreto falliscono finché non ne sostituisci il valore. Accedi di nuovo con codex login usando un CODEX_HOME separato, poi salva il nuovo auth.json con «Imposta valore», oppure passa il deployment a un segreto con chiave API OpenAI. Non continuare a usare lo stesso accesso su un altro computer: le due copie condividono un unico token di aggiornamento.' },
      columns: { status: 'Stato', accessTokenExpiresUtc: 'Scadenza del token di accesso', name: 'Nome', kind: 'Tipo', valueLast4: 'Valore', rotatedUtc: 'Ultima modifica', expiresUtc: 'Scadenza', active: 'Attivo', id: 'ID' },
      fields: { refreshedUtc: 'Ultimo rinnovo da Garrison', accessTokenExpiresUtc: 'Scadenza del token di accesso', name: 'Nome', kind: 'Tipo', description: 'Descrizione', value: 'Valore', newValue: 'Nuovo valore', expiresUtc: 'Scadenza', active: 'Attivo' },
      hints: { expiresUtc: 'Deve essere nel futuro. Lascia vuoto per un segreto che non scade.', kind: 'I token di abbonamento su server condivisi possono violare i termini del provider. Per le distribuzioni condivise preferisci le chiavi API.' },
      actions: { setValue: 'Imposta valore', rotate: 'Ruota' }
    },
    workspaces: {
      ...rp('Aree di lavoro', 'Come viene preparata l\'area di lavoro di un\'esecuzione: vuota, clonata da Git o popolata con file.', 'Aggiungi modello di area di lavoro', 'Crea modello di area di lavoro', 'Modifica modello di area di lavoro', 'Dettagli del modello di area di lavoro', 'Elimina modello di area di lavoro', 'Ancora nessun\'area di lavoro', 'Crea un modello di area di lavoro per far partire le distribuzioni da un repository o da file.'),
      columns: { name: 'Nome', kind: 'Tipo', gitUrl: 'Repository', retention: 'Conservazione', active: 'Attivo', id: 'ID', createdUtc: 'Creato' },
      fields: { name: 'Nome', kind: 'Tipo', description: 'Descrizione', gitUrl: 'URL del repository', gitRef: 'Branch, tag o commit', gitDepth: 'Profondità del clone', gitCredentialSecretId: 'Credenziali Git', persistentVolumeClaim: 'Nome del PersistentVolumeClaim', files: 'File', filePath: 'Percorso', fileContent: 'Contenuto', retention: 'Conservazione', active: 'Attivo' },
      hints: { persistentVolumeClaim: 'Un claim esistente nello spazio dei nomi di esecuzione. Solo i deployment con l\'esecutore Job Kubernetes possono usare questo workspace; il suo contenuto resta tra un\'esecuzione e l\'altra.' },
      errors: { claimName: 'Usa lettere minuscole, cifre, trattini e punti, iniziando e finendo con una lettera o una cifra.' }
    },
    modelPrices: {
      ...{"title": "Prezzi dei modelli", "subtitle": "Tariffe in USD configurate dall’operatore per stimare il costo quando l’harness non lo comunica. Il costo comunicato, anche zero, ha precedenza.", "add": "Aggiungi prezzo del modello", "create": "Crea prezzo del modello", "edit": "Modifica prezzo del modello", "view": "Dettagli del prezzo del modello", "deleteTitle": "Elimina prezzo del modello", "emptyTitle": "Nessun prezzo del modello", "emptyBody": "Aggiungi un prezzo per un harness e un modello servito esatti. Nessuna tariffa dei fornitori è preimpostata."},
      columns: {"name": "Nome", "active": "Attivo", "id": "ID", "createdUtc": "Creato", "model": "Modello servito", "harnessType": "Harness", "inputUsdPerMillion": "Input USD / milione di token", "outputUsdPerMillion": "Output USD / milione di token"},
      fields: {"name": "Nome", "description": "Descrizione", "active": "Attivo", "model": "Modello servito", "harnessType": "Harness", "inputUsdPerMillion": "Input USD / milione di token", "outputUsdPerMillion": "Output USD / milione di token", "cachedInputUsdPerMillion": "Input in cache USD / milione di token", "reasoningUsdPerMillion": "Ragionamento USD / milione di token", "inputIncludesCachedTokens": "L’input include token in cache", "outputIncludesReasoningTokens": "L’output include token di ragionamento"},
      hints: {"cachedInputUsdPerMillion": "Lascia vuoto per usare la tariffa di input o output corrispondente. Zero significa gratuito.", "reasoningUsdPerMillion": "Lascia vuoto per usare la tariffa di input o output corrispondente. Zero significa gratuito.", "inputIncludesCachedTokens": "Attiva se l’input include token in cache. Disattiva per Claude Code, che comunica separatamente le letture della cache.", "outputIncludesReasoningTokens": "Attiva se l’output include token di ragionamento. I subtotali inclusi vengono sottratti prima di applicare la tariffa separata."},
      errors: {"rate": "Inserisci una tariffa finita tra 0 e 1.000.000.000. Zero è valido.", "model": "Inserisci il nome esatto del modello, da 1 a 256 caratteri senza caratteri di controllo."}
    },
    usageQuotas: {"title": "Quote di utilizzo", "subtitle": "Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "add": "Aggiungi quota di utilizzo", "create": "Crea quota di utilizzo", "edit": "Modifica quota di utilizzo", "view": "Dettagli della quota di utilizzo", "deleteTitle": "Elimina quota di utilizzo", "emptyTitle": "Nessuna quota di utilizzo", "emptyBody": "Aggiungi una quota per tenant, agente o distribuzione. I limiti vuoti sono illimitati.", "columns": {"name": "Nome", "active": "Attivo", "id": "ID", "createdUtc": "Creato", "scope": "Ambito", "resourceId": "Risorsa di destinazione", "dailyRunLimit": "Esecuzioni per giorno UTC", "dailyTokenLimit": "Token per giorno UTC", "dailyCostUsdLimit": "USD noti per giorno UTC", "maxConcurrentRuns": "Massimo di esecuzioni attive", "enforcementEnabled": "Applicare i limiti"}, "fields": {"name": "Nome", "description": "Descrizione", "active": "Attivo", "scope": "Ambito", "resourceId": "Risorsa di destinazione", "dailyRunLimit": "Esecuzioni per giorno UTC", "dailyTokenLimit": "Token per giorno UTC", "dailyCostUsdLimit": "USD noti per giorno UTC", "maxConcurrentRuns": "Massimo di esecuzioni attive", "enforcementEnabled": "Applicare i limiti"}, "hints": {"dailyRunLimit": "Lascia vuoto per uso illimitato. Zero impedisce l’uso. I contatori giornalieri si azzerano a mezzanotte UTC; la concorrenza conta esecuzioni attive. I limiti si applicano solo se la loro applicazione è attivata.", "dailyTokenLimit": "Lascia vuoto per uso illimitato. Zero impedisce l’uso. I contatori giornalieri si azzerano a mezzanotte UTC; la concorrenza conta esecuzioni attive. I limiti si applicano solo se la loro applicazione è attivata.", "dailyCostUsdLimit": "Lascia vuoto per uso illimitato. Zero impedisce l’uso. I contatori giornalieri si azzerano a mezzanotte UTC; la concorrenza conta esecuzioni attive. I limiti si applicano solo se la loro applicazione è attivata.", "maxConcurrentRuns": "Lascia vuoto per uso illimitato. Zero impedisce l’uso. I contatori giornalieri si azzerano a mezzanotte UTC; la concorrenza conta esecuzioni attive. I limiti si applicano solo se la loro applicazione è attivata.", "resourceId": "Aggiungi una quota per tenant, agente o distribuzione. I limiti vuoti sono illimitati.", "enforcementEnabled": "Disattivato per impostazione predefinita. Attivare per rifiutare esecuzioni ai limiti configurati e ridurre i budget supportati. Altrimenti viene solo monitorato l’utilizzo."}, "errors": {"limit": "Inserisci un limite non negativo nell’intervallo del campo. I conteggi devono essere interi."}, "incomplete": "La contabilizzazione dei costi è incompleta: {{count}} esecuzioni completate non hanno costi dichiarati o stimati. I limiti si applicano solo se attivati; il solo costo mancante non blocca l’ammissione.", "actions": {"usage": "Utilizzo giornaliero"}, "usage": {"windowStartUtc": "Inizio finestra (UTC)", "windowEndUtc": "Azzeramento giornaliero (UTC)", "runsUsed": "Esecuzioni ammesse", "tokensUsed": "Token completati", "costUsd": "Costo noto (USD)", "unknownCostRuns": "Esecuzioni senza costo", "activeRuns": "Esecuzioni attive"}},
    artifactStores: {
      ...rp('Archivi di artefatti', 'Dove vengono conservati i file prodotti dalle esecuzioni.', 'Aggiungi archivio di artefatti', 'Crea archivio di artefatti', 'Modifica archivio di artefatti', 'Dettagli dell\'archivio di artefatti', 'Elimina archivio di artefatti', 'Ancora nessun archivio di artefatti', 'Crea un archivio di artefatti per conservare gli output delle esecuzioni.'),
      columns: { name: 'Nome', kind: 'Tipo', description: 'Descrizione', active: 'Attivo', id: 'ID', createdUtc: 'Creato' },
      fields: { name: 'Nome', kind: 'Tipo', description: 'Descrizione', active: 'Attivo' }
    },
    agents: {
      deleteWithDeployments_many: 'Eliminare "{{name}}" e le sue {{count}} distribuzioni? Anche le distribuzioni qui sotto vengono eliminate. Questa operazione non può essere annullata.',
      deleteWithDeployments_other: 'Eliminare "{{name}}" e le sue {{count}} distribuzioni? Anche le distribuzioni qui sotto vengono eliminate. Questa operazione non può essere annullata.',
      deleteWithDeployments_one: 'Eliminare "{{name}}" e la sua {{count}} distribuzione? Anche la distribuzione qui sotto viene eliminata. Questa operazione non può essere annullata.',
      deleteNoDeployments: 'Eliminare "{{name}}"? Non ha distribuzioni. Questa operazione non può essere annullata.',
      ...rp('Agenti', 'Capacità con nome esposte tramite REST, MCP e A2A. Le distribuzioni decidono come vengono eseguite.', 'Aggiungi agente', 'Crea agente', 'Modifica agente', 'Dettagli dell\'agente', 'Elimina agente', 'Ancora nessun agente', 'Aggiungi un agente oppure applica il manifest di esempio da Configurazione > Manifest.'),
      sections: { identity: 'Identità', exposure: 'Esposizione', io: 'Input e output', delegation: 'Delega' },
      columns: { name: 'Nome', displayName: 'Nome visualizzato', kind: 'Tipo', exposure: 'Esposizione', delegationMode: 'Delega', tags: 'Tag', active: 'Attivo', id: 'ID', createdUtc: 'Creato' },
      fields: {
        name: 'Nome',
        displayName: 'Nome visualizzato',
        description: 'Descrizione',
        kind: 'Tipo',
        agentVersion: 'Versione',
        tags: 'Tag',
        remoteProtocol: 'Protocollo remoto',
        remoteEndpointUrl: 'URL dell\'endpoint remoto',
        exposeA2A: 'Esponi tramite A2A',
        exposeMcpTool: 'Esponi come strumento MCP dedicato',
        mcpToolName: 'Nome dello strumento MCP',
        skills: 'Competenze A2A',
        skillId: 'ID competenza',
        skillName: 'Nome',
        skillDescription: 'Descrizione',
        inputMode: 'Modalità di input',
        inputSchemaJson: 'JSON Schema di input',
        outputSchemaJson: 'JSON Schema di output',
        delegationMode: 'Delega',
        delegationAllowList: 'Agenti che può chiamare',
        delegationMaxDepth: 'Profondità massima',
        delegationAllowRecursion: 'Consenti ricorsione',
        active: 'Attivo'
      },
      hints: { name: 'Lettere minuscole, cifre e trattini. Usato negli URL e nelle card A2A.' },
      errors: { dnsName: 'Usa lettere minuscole, cifre e trattini, iniziando e terminando con una lettera o una cifra.' }
    },
    deployments: {
      approvalsOn_one: 'Attive, {{count}} regola',
      approvalsOn_other: 'Attive, {{count}} regole',
      approvalsOn_many: 'Attive, {{count}} regole',
      approvalsOff: 'Disattivate',
      promptRoles: { Repair: 'Riparazione dell\'output strutturato', DelegatedTask: 'Involucro dell\'attività per esecuzioni delegate', Task: 'Involucro dell\'attività', System: 'Prompt di sistema', ConversationFallback: 'Ricostruzione della conversazione (trascrizione)' },
      ...rp('Distribuzioni', 'Collega un agente a un profilo harness, prompt, segreti, server MCP, posizionamento e limiti.', 'Aggiungi distribuzione', 'Crea distribuzione', 'Modifica distribuzione', 'Dettagli della distribuzione', 'Elimina distribuzione', 'Ancora nessuna distribuzione', 'Crea una distribuzione per rendere eseguibile un agente.'),
      steps: { approvals: 'Approvazioni', basics: 'Dati di base', harness: 'Harness', prompts: 'Prompt', resources: 'Risorse', overrides: 'Sostituzioni', placement: 'Posizionamento e limiti' },
      columns: { approvalsEnabled: 'Approvazioni', name: 'Nome', agentId: 'Agente', harnessProfileId: 'Profilo harness', model: 'Modello', executor: 'Esecutore', weight: 'Peso', configVersion: 'Versione config.', active: 'Attiva', id: 'ID', createdUtc: 'Creata' },
      fields: {
        approvalsEnabled: 'Chiedi prima delle chiamate a strumenti (approvazioni)',
        approvalDefaultAction: 'Quando nessuna regola corrisponde',
        approvalTimeoutSeconds: 'Timeout di approvazione (secondi)',
        approvalTimeoutDecision: 'Decisione quando nessuno risponde',
        approvalRules: 'Regole di approvazione',
        ruleAction: 'Azione',
        rulePattern: 'Regola',
        ruleInputPattern: 'Pattern sull\'input',
        ruleDescription: 'Descrizione',
        approvalTest: 'Prova una chiamata a strumento',
        name: 'Nome',
        agentId: 'Agente',
        description: 'Descrizione',
        weight: 'Peso del traffico',
        active: 'Attiva',
        harnessProfileId: 'Profilo harness',
        model: 'Modello',
        fallbackModel: 'Modello di riserva',
        effort: 'Livello di impegno',
        maxTurns: 'Numero massimo di turni',
        maxBudgetUsd: 'Budget massimo (USD)',
        parameters: 'Parametri',
        paramName: 'Nome',
        paramValue: 'Valore',
        promptBindings: 'Collegamenti dei prompt',
        promptRole: 'Ruolo',
        template: 'Modello',
        pinnedVersion: 'Versione fissata',
        resourceBindings: 'Collegamenti delle risorse',
        bindingKind: 'Tipo',
        alias: 'Alias',
        resource: 'Risorsa',
        workspaceTemplateId: 'Modello di area di lavoro',
        artifactStoreId: 'Archivio di artefatti',
        argumentOverrides: 'Sostituzioni degli argomenti',
        operation: 'Operazione',
        match: 'Corrispondenza',
        argTemplate: 'Modello',
        condition: 'Condizione',
        environmentOverrides: 'Sostituzioni dell\'ambiente',
        envName: 'Nome',
        envValue: 'Modello del valore',
        isSecret: 'Segreto',
        fileOverrides: 'Sostituzioni dei file',
        allowedRunOverrides: 'Sostituzioni per esecuzione impostabili dai chiamanti',
        validation: 'Convalida',
        pattern: 'Pattern o valori',
        nodePoolId: 'Pool di nodi',
        nodeSelector: 'Selettore di nodi',
        maxConcurrentRuns: 'Numero massimo di esecuzioni simultanee',
        timeoutSeconds: 'Timeout (secondi)',
        maxAttempts: 'Numero massimo di tentativi',
        repetitionGuard: 'Protezione dalle ripetizioni',
        maxAssistantChars: 'Massimo di caratteri dell\'assistente',
        noProgressSeconds: 'Limite senza avanzamento (secondi)',
        executor: 'Esecutore',
        podCpuRequest: 'Richiesta CPU',
        podCpuLimit: 'Limite CPU',
        podMemoryRequest: 'Richiesta memoria',
        podMemoryLimit: 'Limite memoria',
        podEphemeralStorageRequest: 'Richiesta di archiviazione effimera',
        podEphemeralStorageLimit: 'Limite di archiviazione effimera'
      },
      hints: {
        approvalsEnabled: 'Funziona con i profili Claude Code e con i profili che usano l\'app-server di Codex. Gli altri harness non hanno un hook di approvazione, quindi il server rifiuta questa impostazione per loro.',
        approvalDefaultAction: 'Chiedi a una persona attende nella casella Approvazioni finché qualcuno decide o il timeout scade.',
        approvalTimeoutSeconds: 'Da 10 a 3.600 secondi. Se vuoto, usa 300.',
        approvalRules: 'Nega prevale su Chiedi, e Chiedi prevale su Consenti. Esempi: Bash(npm test), Bash(npm run *), Edit(src/**), WebFetch(domain:example.com), mcp__github__*.',
        secretsKinds: 'Il profilo harness {{profile}} richiede un segreto qualsiasi di tipo {{kinds}}. Collegane uno con un alias a scelta.',
        secretsAliases: 'Il profilo harness {{profile}} legge i segreti collegati con questi alias: {{aliases}}.',
        secretsNone: 'Il profilo harness {{profile}} non legge alcun segreto, quindi non serve collegarne.',
        promptBindings: 'Associa i ruoli dei prompt (System, Task, DelegatedTask e qualsiasi ruolo usato dal profilo harness) ai modelli. Lascia vuota la versione per seguire la più recente.',
        resourceBindings: 'Gli alias diventano variabili di modello, ad esempio {{secret.anthropic}}.',
        weight: 'Le richieste senza una distribuzione esplicita vengono ripartite tra le distribuzioni attive in base al peso.',
        maxConcurrentRuns: '0 significa illimitato.',
        timeoutCap: 'L\'impostazione del cluster {{setting}} limita ogni esecuzione a {{value}} secondi.',
        zeroUnlimited: '0 significa illimitato.',
        zeroOff: '0 disattiva la protezione.',
        guardDefault: 'Vuoto usa il valore del cluster, {{value}}, da {{setting}}.',
        guardDefaultUnknown: 'Vuoto usa l\'impostazione del cluster {{setting}}.',
        guardOwn: 'Impostato su questa distribuzione. Il valore del cluster ({{setting}}) è {{value}}.',
        guardOwnUnknown: 'Impostato su questa distribuzione al posto dell\'impostazione del cluster {{setting}}.',
        guardFollowing: 'Segue il valore del cluster, {{value}}, da {{setting}}.',
        executorInherit: 'Vuoto usa il valore predefinito del pool di nodi: {{executor}}.',
        executorSet: 'Processo esegue l\'harness dentro il worker; Job Kubernetes lo esegue in un pod dedicato.',
        podCpuRequest: 'Le risorse del pod valgono solo per le esecuzioni Job Kubernetes. Usa quantità Kubernetes come 500m, 2, 512Mi o 4Gi; vuoto usa il valore predefinito del worker.'
      },
      actions: { addRule: 'Aggiungi regola', compilePreview: 'Anteprima di compilazione', test: 'Invocazione di prova', useClusterDefault: 'Usa il valore del cluster' },
      sections: {
        guards: 'Protezioni dell\'esecuzione',
        execution: 'Esecutore e risorse del pod'
      },
      placeholders: {
        ruleInputPattern: 'Espressione regolare facoltativa sul JSON dell\'input',
        clusterDefault: 'Valore del cluster ({{value}})',
        clusterDefaultUnknown: 'Valore del cluster'
      },
      executorInherit: 'Predefinito del pool di nodi',
      executorInheritShort: 'Predefinito del pool',
      errors: { rulePatternRequired: 'Inserisci un pattern di regola.', rulePatternOneLine: 'Un pattern di regola deve stare su una sola riga.', rulePatternTooLong: 'Un pattern di regola può avere al massimo 1.000 caratteri.', tooManyRules: 'Una distribuzione può avere al massimo 500 regole di approvazione.', approvalTimeout: 'Inserisci un numero intero di secondi da 10 a 3.600.', quantity: 'Usa una quantità Kubernetes come 500m, 2, 512Mi o 4Gi.' },
      guardStates: {
        on: 'attiva',
        off: 'disattiva'
      }
    },
    nodePools: {
      ...rp('Pool di nodi', 'Raggruppa i nodi worker per etichetta e, facoltativamente, dedicali a specifici tenant.', 'Aggiungi pool di nodi', 'Crea pool di nodi', 'Modifica pool di nodi', 'Dettagli del pool di nodi', 'Elimina pool di nodi', 'Ancora nessun pool di nodi', 'Crea un pool di nodi per dedicare capacità.'),
      allTenants: 'Tutti i tenant',
      columns: { name: 'Nome', description: 'Descrizione', tenants: 'Tenant', defaultExecutor: 'Esecutore predefinito', active: 'Attivo', id: 'ID', createdUtc: 'Creato' },
      fields: { name: 'Nome', description: 'Descrizione', defaultExecutor: 'Esecutore predefinito', tenants: 'ID dei tenant consentiti', active: 'Attivo' },
      hints: { tenants: 'Lascia vuoto per consentire tutti i tenant.' }
    },
    runs: {
      ...rp('Esecuzioni', 'Ogni invocazione di agente con stato, nodo, durata ed esito.', 'Aggiungi esecuzione', 'Crea esecuzione', 'Modifica esecuzione', 'Dettagli dell\'esecuzione', 'Elimina esecuzione', 'Ancora nessuna esecuzione', 'Invoca un agente per avviare un\'esecuzione.'),
      columns: {
        approvalWaitMs: 'Attesa di approvazione',
        delegationWaitMs: 'Attesa di delega',
        timeToFirstTokenExcludingDelegationMs: 'TTFT senza delega',
        id: 'Esecuzione',
        agentName: 'Agente',
        status: 'Stato',
        outcome: 'Esito',
        harnessType: 'Harness',
        leaseNodeName: 'Nodo',
        timeToFirstTokenMs: 'TTFT',
        streamingMs: 'Streaming',
        executionMs: 'Durata',
        queueMs: 'Tempo in coda',
        totalMs: 'Tempo totale',
        inputTokens: 'Token di input',
        outputTokens: 'Token di output',
        cachedTokens: 'Token in cache',
        reasoningTokens: 'Token di ragionamento',
        outputTokensPerSecond: 'Token/s',
        costUsd: 'Costo',
        toolCallCount: 'Chiamate a strumenti',
        depth: 'Profondità',
        createdUtc: 'Creata',
        conversationId: 'Conversazione'
      },
      actions: { cancel: 'Annulla esecuzione', retry: 'Riprova esecuzione' },
      toasts: { cancelRequested: 'Annullamento richiesto.', retried: 'Nuovo tentativo avviato.' },
      turn: 'turno {{turn}}'
    },
    nodes: {
      ...rp('Nodi', 'Nodi worker che prendono in lease ed eseguono le esecuzioni. Isola o svuota un nodo prima della manutenzione.', 'Aggiungi nodo', 'Crea nodo', 'Modifica nodo', 'Dettagli del nodo', 'Elimina nodo', 'Ancora nessun nodo', 'I nodi worker si registrano automaticamente all\'avvio. Distribuisci lo StatefulSet dei worker oppure avvia Garrison.Worker in locale.'),
      columns: { name: 'Nome', status: 'Stato', capacity: 'Esecuzioni', harnesses: 'Harness', executors: 'Esecutori', containerized: 'In container', labels: 'Etichette', nodeVersion: 'Versione', lastHeartbeatUtc: 'Ultimo heartbeat', id: 'ID' },
      fields: { address: 'Indirizzo', maxConcurrentRuns: 'Capacità', childReserveSlots: 'Riserva per le figlie', maxResidentWaiters: 'Massimo di esecuzioni in attesa', activeRuns: 'Esecuzioni attive', capabilities: 'Capacità harness', detectedVersion: 'Versione', available: 'Disponibile', detail: 'Dettaglio' },
      actions: { cordon: 'Isola', uncordon: 'Annulla isolamento', drain: 'Svuota', runs: 'Visualizza esecuzioni', grafana: 'Apri in Grafana' },
      toasts: { cordoned: 'Nodo isolato.', uncordoned: 'Isolamento del nodo annullato.', draining: 'Svuotamento del nodo in corso.' }
    },
    controlNodes: {
      ...rp('Piano di controllo', 'Repliche del server che servono l\'API, MCP e A2A e pianificano le esecuzioni. Ognuna si registra da sola e invia un heartbeat ogni 5 secondi.', 'Aggiungi nodo di controllo', 'Crea nodo di controllo', 'Modifica nodo di controllo', 'Dettagli del nodo di controllo', 'Elimina nodo di controllo', 'Nessun nodo di controllo segnalato', 'I nodi di controllo compaiono quando si avvia una replica del server. I server più vecchi di questa console non li segnalano.'),
      columns: { name: 'Nome', status: 'Stato', version: 'Versione', schemaVersion: 'Versione schema', backplane: 'Bus di eventi', uptime: 'Tempo di attività', lastHeartbeatUtc: 'Ultimo heartbeat', activeRequests: 'Richieste', openStreams: 'Stream', heldLongPolls: 'Long poll', address: 'Indirizzo', hostname: 'Nome host', startedUtc: 'Avviato', id: 'ID' },
      fields: { name: 'Nome', id: 'ID nodo', hostname: 'Nome host', address: 'Indirizzo', isLeader: 'Leader', leaderEpoch: 'Epoca del leader', version: 'Versione', schemaVersion: 'Versione dello schema', backplane: 'Bus di eventi', startedUtc: 'Avviato', uptime: 'Tempo di attività', lastHeartbeatUtc: 'Ultimo heartbeat', activeRequests: 'Richieste attive', openStreams: 'Stream aperti', heldLongPolls: 'Long poll in attesa', respondingNodeId: 'Risposto da' },
      leader: 'Leader',
      stale: 'Silente',
      answeredBy: 'Quale replica ha risposto: {{node}}',
      answeredByLeader: 'Quale replica ha risposto: {{node}} (il leader)',
      actions: { grafana: 'Apri in Grafana' }
    },
    audit: {
      ...rp('Audit', 'Eventi di autenticazione, autorizzazione e configurazione di questo tenant.', 'Aggiungi voce di audit', 'Crea voce di audit', 'Modifica voce di audit', 'Dettagli della voce di audit', 'Elimina voce di audit', 'Ancora nessuna voce di audit', 'Gli eventi di sicurezza compaiono qui man mano che persone e agenti usano Garrison.'),
      emptyTitle: 'Ancora nessuna voce di audit',
      columns: { createdUtc: 'Ora', eventType: 'Evento', principalName: 'Principal', resource: 'Risorsa', reason: 'Motivo', sourceIp: 'IP di origine', id: 'ID' },
      fields: {
        eventType: 'Evento',
        principalType: 'Tipo di principal',
        principalName: 'Principal',
        principalId: 'ID principal',
        resourceType: 'Tipo di risorsa',
        resourceId: 'ID risorsa',
        operation: 'Operazione',
        method: 'Metodo',
        path: 'Percorso',
        authResult: 'Esito dell\'autenticazione',
        authorizationResult: 'Esito dell\'autorizzazione',
        reason: 'Motivo',
        bypassReason: 'Motivo del bypass',
        statusCode: 'Codice di stato',
        sourceIp: 'IP di origine',
        requestId: 'ID richiesta',
        createdUtc: 'Ora'
      }
    },
    manifestApplies: {
      ...rp('Cronologia delle applicazioni', 'Ogni applicazione e simulazione di manifest, con i risultati per documento.', 'Aggiungi applicazione', 'Crea applicazione', 'Modifica applicazione', 'Dettagli dell\'applicazione', 'Elimina applicazione', 'Ancora nessuna applicazione', 'Le applicazioni compaiono qui dopo che applichi o simuli un manifest.'),
      columns: { createdUtc: 'Ora', principalName: 'Applicato da', dryRun: 'Simulazione', counts: 'Risultati' }
    },
    conversations: {
      title: 'Conversazioni',
      subtitle: 'Scambi a più turni con un agente. Ogni turno è un\'esecuzione che riprende la sessione dell\'harness del turno precedente.',
      add: 'Aggiungi conversazione',
      create: 'Crea conversazione',
      edit: 'Modifica conversazione',
      view: 'Dettagli della conversazione',
      deleteTitle: 'Elimina conversazione',
      emptyTitle: 'Ancora nessuna conversazione',
      emptyBody: 'Avviane una dalla pagina Invoca con «Avvia una nuova conversazione», oppure invia un messaggio A2A: ogni contesto A2A è una conversazione.',
      untitled: 'Conversazione senza titolo',
      columns: {
        title: 'Titolo',
        agentName: 'Agente',
        state: 'Stato',
        turnCount: 'Turni',
        affinityNodeName: 'Nodo di affinità',
        fallbackCount: 'Ricostruzioni',
        lastFallbackReason: 'Ultima ricostruzione',
        harnessType: 'Harness',
        callerName: 'Avviata da',
        contextId: 'ID contesto',
        sessionId: 'ID sessione',
        lastActivityUtc: 'Ultima attività',
        createdUtc: 'Creata',
        id: 'ID'
      },
      states: {
        busy: 'In lavorazione',
        idle: 'In attesa'
      },
      actions: {
        continue: 'Continua',
        runs: 'Vedi i turni come esecuzioni'
      }
    }
  },
  views: {
    approvalDetail: {
      title: 'Approvazione',
      titleWithTool: 'Approvazione per {{tool}}',
      backToInbox: 'Tutte le approvazioni',
      pending: 'In attesa che una persona consenta o neghi questa chiamata a strumento.',
      pendingExpires: 'In attesa di una persona. Se nessuno decide, scade {{when}} con la decisione {{decision}}.',
      request: 'Richiesta',
      rules: 'Regole',
      noRule: 'Nessuna regola corrispondente',
      noInput: 'Non è stato registrato alcun input.',
      notFoundTitle: 'Approvazione non trovata',
      notFoundBody: 'Potrebbe appartenere a un altro tenant, oppure l\'ID è errato.'
    },
    home: {
      observabilityState: { reachable: 'Raggiungibile', unreachable: 'Non raggiungibile', checking: 'Verifica in corso', unknown: 'Stato sconosciuto' },
      observabilityVersion: 'Versione {{version}}',
      observabilityOpen: 'Apri {{service}}',
      kpisGrafana: 'Apri la panoramica in Grafana',
      grafanaDashboards: 'Dashboard Grafana',
      grafanaSections: { overview: 'Panoramica', http: 'API HTTP', runs: 'Esecuzioni', agents: 'Agenti', models: 'Modelli e token', workers: 'Nodi worker', kubernetes: 'Esecutore Kubernetes', protocols: 'Protocolli', scheduler: 'Scheduler e coda', database: 'Database', controlPlane: 'Piano di controllo', security: 'Sicurezza e autenticazione', integrations: 'Integrazioni', logs: 'Log e tracce' },
      observabilitySetup: 'Configura l\'osservabilità',
      observabilityNone: 'Per questa installazione non è configurato alcun servizio di osservabilità (Grafana, Prometheus, Tempo o Loki).',
      observability: 'Osservabilità',
      title: 'Home',
      subtitle: 'Cosa stanno facendo in questo momento i tuoi agenti e i nodi worker.',
      lastLoaded: 'Aggiornato {{time}}',
      partial: 'Alcuni pannelli non sono stati caricati. I valori mostrati sono parziali.',
      getStartedTitle: 'Ancora nessun agente in questo tenant',
      getStartedBody: 'La configurazione guidata aggiunge una chiave di accesso, applica un agente di esempio ed esegue un test.',
      runSetup: 'Avvia configurazione',
      kpis: {
        agents: 'Agenti',
        deployments: 'Distribuzioni',
        activeRuns: 'Esecuzioni attive',
        queued: 'In coda',
        succeeded: 'Riuscite',
        failed: 'Non riuscite',
        nodes: 'Nodi pronti',
        controlNodes: 'Piano di controllo pronto',
        nodesNote: 'Pronti / totali',
        last24h: 'Ultime 24 ore'
      },
      requestActivity: 'Attività delle richieste API',
      nodesTitle: 'Nodi',
      noNodesTitle: 'Nessun nodo worker registrato',
      noNodesBody: 'Avvia Garrison.Worker o scala lo StatefulSet dei worker. I nodi si registrano automaticamente.',
      nodeLoad: '{{active}} di {{max}} esecuzioni',
      controlPlaneSection: 'Piano di controllo',
      workersSection: 'Nodi worker',
      openControlPlane: 'Vedi tutti',
      openWorkers: 'Vedi tutti',
      noControlNodes: 'Nessun nodo di controllo si è ancora registrato.',
      controlNodesUnavailable: 'I nodi di controllo non sono disponibili: il server è più vecchio di questa console oppure non puoi leggere i nodi.',
      recentFailures: 'Errori recenti',
      noFailures: 'Nessuna esecuzione non riuscita di recente.',
      cta: {
        title: 'Attività comuni',
        invoke: 'Invoca un agente',
        addAgent: 'Aggiungi un agente',
        applyManifest: 'Applica un manifest',
        inspectRuns: 'Esamina le esecuzioni',
        nodes: 'Controlla i nodi worker',
        apiExplorer: 'Apri Esplora API',
        analytics: 'Visualizza le analisi delle esecuzioni'
      },
      externalServices: 'Servizi esterni',
      externalServicesNote: 'Strumenti di osservabilità inclusi. Cambia le credenziali predefinite prima di condividere questa distribuzione.',
      externalServicesNone: 'Nessun servizio esterno configurato per questa distribuzione.',
      credentials: 'Credenziali predefinite',
      services: { loki: 'Loki', grafana: 'Grafana', prometheus: 'Prometheus', tempo: 'Tempo' }
    },
    markdown: {
      showRaw: 'Mostra testo grezzo',
      showRendered: 'Mostra formattato'
    },
    invoke: {
      stream: {
        tabsLabel: 'Viste della risposta',
        cardLabel: 'Output dell\'esecuzione',
        preview: 'Anteprima',
        response: 'Risposta',
        starting: 'Avvio dell\'esecuzione...',
        live: 'In diretta',
        finished: 'Terminata',
        elapsed: 'Trascorso',
        firstToken: 'Primo token',
        tokensPerSecond: 'Velocità',
        finishedHint: 'Esecuzione terminata.',
        showResponse: 'Vedi la risposta',
        reasoning: 'Ragionamento',
        waiting: 'In attesa dell\'output...',
        waitingCodex: 'In attesa dell\'output. Codex invia la risposta tutta insieme alla fine.',
        codexNote: 'Codex non trasmette in streaming: la risposta compare qui tutta insieme quando l\'esecuzione termina.',
        noText: 'L\'esecuzione non ha trasmesso testo. La scheda Risposta contiene il risultato.',
        jump: 'Vai al più recente',
        tool: {
          running: 'in corso',
          ok: 'riuscito',
          failed: 'non riuscito'
        }
      },
      noDeployment: 'Questo agente non ha distribuzioni attive con peso maggiore di zero, quindi un\'invocazione verrebbe rifiutata. Aggiungi una distribuzione nella scheda Distribuzioni o aumenta un peso.',
      title: 'Invoca',
      subtitle: 'Invia un messaggio a un agente e segui la trascrizione in streaming.',
      request: 'Richiesta',
      agent: 'Agente',
      deployment: 'Distribuzione',
      weighted: 'Qualsiasi distribuzione attiva (ponderata)',
      default: 'Predefinito della distribuzione',
      message: 'Messaggio',
      messagePlaceholder: 'Cosa deve fare l\'agente?',
      shortcut: 'Premi Ctrl+Invio o Cmd+Invio per inviare.',
      send: 'Invia',
      sending: 'Invio in corso...',
      openRun: 'Apri esecuzione',
      idleTitle: 'Ancora nessuna esecuzione',
      idleBody: 'Invia un messaggio per avviare un\'esecuzione. La trascrizione compare qui man mano che arriva.',
      noAgentsTitle: 'Nessun agente da invocare',
      noAgentsBody: 'Crea un agente e una distribuzione, oppure applica il manifest di esempio.',
      applySample: 'Vai ai manifest',
      stopOnLeave: 'Ferma l\'esecuzione quando esco',
      cancel: 'Annulla esecuzione',
      cancelling: 'Annullamento...',
      timeLimit: 'Limite di tempo',
      timeLimitPlaceholder: 'Valore della distribuzione',
      timeLimitClear: 'Usa il valore predefinito',
      timeLimitRange: 'Consentito: da {{min}} a {{max}}.',
      timeLimitAny: 'Secondi che l\'esecuzione può durare prima di andare in timeout.',
      timeLimitCap: 'Il cluster ferma ogni esecuzione dopo {{max}}.',
      timeLimitErrors: {
        notInteger: 'Inserisci un numero intero di secondi.',
        range: 'Inserisci un limite di tempo da {{min}} a {{max}}.',
        aboveCap: 'Il cluster consente al massimo {{max}} per esecuzione.'
      },
      timeUnits: {
        seconds: '{{value}} s',
        minutes: '{{value}} min',
        hours: '{{value}} h',
        secondsWord: 'secondi'
      },
      conversation: {
        mode: 'Conversazione',
        modes: {
          none: 'Esecuzione singola (nessuna conversazione)',
          start: 'Avvia una nuova conversazione',
          continue: 'Continua una conversazione'
        },
        pick: 'Conversazione da continuare',
        choose: 'Scegli una conversazione',
        option: '{{title}} (turni: {{turns}})',
        pinned: 'Ogni turno viene eseguito sulla distribuzione del primo turno della conversazione, quindi qui non si può scegliere la distribuzione.',
        busy: 'Questa conversazione sta ancora elaborando il turno precedente. Un nuovo messaggio viene rifiutato finché quell\'esecuzione non finisce.',
        open: 'Apri conversazione (turno {{turn}})'
      }
    },
    runDetail: {
      awaitingApproval_one: 'Questa esecuzione attende che una persona approvi {{count}} chiamata a strumento.',
      awaitingApproval_other: 'Questa esecuzione attende che una persona approvi {{count}} chiamate a strumenti.',
      awaitingApproval_many: 'Questa esecuzione attende che una persona approvi {{count}} chiamate a strumenti.',
      reviewApprovals: 'Esamina',
      approvals_one: 'Approvazioni ({{count}})',
      approvals_other: 'Approvazioni ({{count}})',
      approvals_many: 'Approvazioni ({{count}})',
      noApprovals: 'Questa esecuzione non ha chiesto alcuna approvazione.',
      openApproval: 'Apri approvazione',
      viewTrace: 'Visualizza traccia',
      viewLogs: 'Visualizza log',
      traceId: 'ID traccia',
      deploymentDeleted: 'La distribuzione usata da questa esecuzione è stata eliminata, quindi non può essere ripetuta. Invoca di nuovo l\'agente {{agent}}.',
      templatesUsed: 'Modelli usati',
      agentDeleted: 'L\'agente {{agent}} non esiste più, quindi questa esecuzione non può essere ripetuta. Record, trascrizione e telemetria restano disponibili qui.',
      title: 'Esecuzione',
      titleWithAgent: 'Esecuzione di {{agent}}',
      deployment: 'Distribuzione',
      model: 'Modello servito',
      tokensLabel: 'Token',
      tokens: '{{input}} in ingresso, {{output}} in uscita',
      estimated: 'stimato',
      caller: 'Chiamante',
      parent: 'Esecuzione padre',
      attempt: 'Tentativo',
      outputSchema: 'Schema di output',
      outputSchemaStates: {
        valid: 'Valido',
        validAfterRepair: 'Valido dopo una correzione',
        invalid: 'Non valido',
        invalidAfterRepair: 'Non valido dopo una correzione'
      },
      started: 'Avviata',
      completed: 'Completata',
      exitCode: 'Codice di uscita',
      transcript: 'Trascrizione',
      result: 'Risultato',
      input: 'Input',
      stderr: 'Stderr',
      children_one: 'Esecuzioni figlie ({{count}})',
      children_other: 'Esecuzioni figlie ({{count}})',
      children_many: 'Esecuzioni figlie ({{count}})',
      eventFilter: 'Mostra',
      eventCount_one: '{{count}} evento',
      eventCount_other: '{{count}} eventi',
      eventCount_many: '{{count}} eventi',
      noEvents: 'Ancora nessun evento. Gli eventi compaiono man mano che l\'harness li produce.',
      failed: 'Non riuscita',
      noResult: 'L\'esecuzione non ha prodotto alcun testo di risultato.',
      pending: 'Il risultato compare al termine dell\'esecuzione.',
      structuredOutput: 'Output strutturato',
      templateVersions: 'Versioni dei modelli di prompt usate',
      noStderr: 'Nessun output Stderr acquisito.',
      noChildren: 'Questa esecuzione non ha delegato ad altri agenti.',
      confirmCancel: 'Annullare questa esecuzione? Il processo dell\'harness viene arrestato sul suo nodo.',
      notFoundTitle: 'Esecuzione non trovata',
      notFoundBody: 'Potrebbe essere stata eliminata oppure appartiene a un altro tenant.',
      telemetry: {
        approvalNote: 'Questa esecuzione ha passato {{wait}} in attesa delle decisioni di approvazione. Il tempo di esecuzione include quest\'attesa.',
        delegationNote: 'Questa esecuzione ha atteso {{wait}} le esecuzioni delegate. Il tempo al primo token è {{ttft}} con questa attesa e {{excluding}} senza; il secondo valore è quello da confrontare con gli agenti che non delegano.',
        title: 'Telemetria',
        phases: 'Tempo di esecuzione per fase',
        phase: { delegation: 'Attesa delle esecuzioni delegate', queue: 'Coda', startup: 'Dall\'avvio al primo token', streaming: 'Streaming', tail: 'Dopo l\'ultimo token' },
        fields: {
          approvalWaitMs: 'Attesa di approvazione',
          delegationWaitMs: 'Attesa di delega',
          timeToFirstTokenExcludingDelegationMs: 'Tempo al primo token senza delega',
          timeToFirstTokenMs: 'Tempo al primo token',
          streamingMs: 'Tempo di streaming',
          executionMs: 'Tempo di esecuzione',
          queueMs: 'Tempo in coda',
          totalMs: 'Tempo totale',
          outputTokensPerSecond: 'Token di output al secondo',
          inputTokens: 'Token di input',
          outputTokens: 'Token di output',
          cachedTokens: 'Token in cache',
          reasoningTokens: 'Token di ragionamento',
          toolCallCount: 'Chiamate a strumenti',
          costUsd: 'Costo',
          firstTokenUtc: 'Primo token alle',
          lastTokenUtc: 'Ultimo token alle'
        }
      },
      conversation: 'Conversazione',
      conversationSession: 'Sessione',
      resumeSessionId: 'Sessione ripresa',
      affinityNode: 'Nodo di affinità',
      affinityUntil: 'fino a {{time}}'
    },
    queue: {
      title: 'Coda',
      subtitle: 'Lavoro in attesa di un nodo, assegnato e in esecuzione, per agente e harness.',
      queued: 'In coda',
      leased: 'Assegnate',
      running: 'In esecuzione',
      emptyTitle: 'Niente in attesa',
      emptyBody: 'Le esecuzioni compaiono qui mentre attendono un nodo worker.'
    },
    agentDetail: {
      invoke: 'Invoca',
      grafana: 'Apri in Grafana',
      noActiveDeployment: 'Questo agente non ha distribuzioni attive, quindi le invocazioni verranno rifiutate.',
      deployments_one: 'Distribuzioni ({{count}})',
      deployments_other: 'Distribuzioni ({{count}})',
      deployments_many: 'Distribuzioni ({{count}})',
      recentRuns: 'Esecuzioni recenti',
      card: 'Card A2A',
      traffic: 'Quota di traffico',
      noDeploymentsTitle: 'Nessuna distribuzione',
      noDeploymentsBody: 'Crea una distribuzione per collegare questo agente a un harness.',
      noRuns: 'Questo agente non è ancora stato eseguito.',
      selectionNote: 'Ogni invocazione senza una distribuzione esplicita va a una distribuzione attiva, scelta a caso in proporzione al suo peso.',
      manageDeployments: 'Gestisci distribuzioni',
      conversations: 'Conversazioni'
    },
    templateEditor: {
      cloneToEdit: 'Clona per modificare',
      builtInReadOnly: 'I modelli predefiniti sono di sola lettura, quindi tutti i campi sono bloccati. Clonalo per ottenere una copia modificabile.',
      renameHint: 'Puoi rinominare questo modello. Le distribuzioni mantengono i collegamenti perché usano il suo ID, ma i modelli che lo includono per nome vanno aggiornati a mano.',
      cloneDialog: { taken: 'Esiste già un modello chiamato {{name}}. Scegli un altro nome.', reserved: 'I nomi che iniziano con builtin/ sono riservati ai modelli predefiniti.', hint: 'Puoi rinominare la copia più tardi nella sua pagina.', name: 'Nome della copia', body: 'La copia parte dal contenuto attuale come versione 1 e si può modificare, rinominare ed eliminare.', title: 'Clona {{name}}' },
      newTitle: 'Nuovo modello di prompt',
      subtitle: 'Scrivi il modello, visualizzane l\'anteprima con un contesto di esempio e salva.',
      builtInNote: 'I modelli predefiniti sono di sola lettura. Clonali per personalizzarli, oppure ripristinali per recuperare il contenuto originale.',
      content: 'Contenuto',
      changeNote: 'Nota di modifica',
      syntaxHint: 'Sintassi: {{variable}}, {{value | default: "x"}}, {{#if x}}...{{else}}...{{/if}}, {{#each list}}...{{/each}}, {{> template-name}}.',
      variables: 'Variabili usate',
      noVariables: 'Nessuna variabile referenziata.',
      preview: 'Anteprima dal vivo',
      sampleContext: 'Contesto di esempio (JSON)',
      rendered: 'Risultato',
      previewEmpty: 'Il testo generato compare qui.',
      missing: 'Variabili mancanti: {{list}}',
      versions_one: 'Versioni ({{count}})',
      versions_other: 'Versioni ({{count}})',
      versions_many: 'Versioni ({{count}})',
      noVersions: 'Ancora nessuna versione salvata.',
      version: 'Versione',
      note: 'Nota',
      author: 'Autore',
      diff: 'Differenze',
      restore: 'Ripristina',
      diffTitle: 'Versione {{version}} a confronto con l\'editor',
      current: 'Editor',
      reset: 'Ripristina predefinito',
      savedVersion: 'Nuova versione salvata.',
      restored: 'Versione {{version}} ripristinata.',
      resetDone: 'Ripristinato il contenuto originale.',
      confirm: {
        restoreTitle: 'Ripristina versione',
        restoreMessage: 'Ripristinare la versione {{version}}? Il contenuto attuale resta nella cronologia.',
        resetTitle: 'Ripristina modello',
        resetMessage: 'Ripristinare "{{name}}" al contenuto originale?',
        deleteTitle: 'Elimina modello',
        deleteMessage: 'Eliminare "{{name}}"? Le distribuzioni che lo collegano non verranno più compilate.'
      }
    },
    manifests: {
      warnings_one: '{{count}} avviso',
      warnings_other: '{{count}} avvisi',
      planned: 'Esito previsto: {{result}}',
      changes: { count_many: 'Cambiano {{count}} campi.', count_other: 'Cambiano {{count}} campi.', count_one: 'Cambia {{count}} campo.', empty: '(vuoto)', after: 'Dopo', before: 'Prima', field: 'Campo' },
      title: 'Manifest',
      subtitle: 'Applica la configurazione come codice. Le simulazioni convalidano senza scrivere.',
      applyTab: 'Applica',
      exportTab: 'Esporta',
      historyTab: 'Cronologia',
      upload: 'Carica file',
      loadSample: 'Carica esempio',
      document: 'Manifest (YAML o JSON, più documenti)',
      dryRun: 'Simulazione',
      apply: 'Applica',
      validated: 'Convalida completata.',
      applied: 'Manifest applicato.',
      results: 'Risultati',
      dryRunResults: 'Risultati della simulazione',
      kind: 'Tipo',
      name: 'Nome',
      result: 'Risultato',
      message: 'Messaggio',
      confirmTitle: 'Applica manifest',
      confirmMessage: 'Applicare ogni documento di questo manifest al tenant corrente?',
      exportHelp: 'Esporta la configurazione di questo tenant. I valori dei segreti non vengono mai esportati.',
      export: 'Esporta',
      download: 'Scarica',
      counts: '{{created}} creati, {{updated}} aggiornati, {{unchanged}} invariati, {{failed}} non riusciti'
    },
    requests: {
      grafana: 'Dashboard HTTP in Grafana',
      title: 'Cronologia richieste',
      subtitle: 'Traffico API acquisito. Approfondisci qualsiasi richiesta e gestisci la conservazione.',
      kpis: { total: 'Richieste conservate', success: 'Riuscite', failure: 'Errori', avgDuration: 'Durata media' },
      columns: { time: 'Ora', method: 'Metodo', path: 'Percorso', status: 'Stato', duration: 'Durata', principal: 'Principal' },
      bulkDeleteTitle: 'Elimina cronologia richieste',
      bulkDeleteMessage: 'Eliminare tutte le {{count}} richieste che corrispondono ai filtri attuali?',
      bulkDeleteAll: 'Elimina tutte le corrispondenze',
      deleteOneTitle: 'Elimina richiesta',
      deleteOneMessage: 'Eliminare la richiesta {{id}}?',
      deleted: 'Eliminata.',
      emptyTitle: 'Nessuna cronologia delle richieste',
      emptyBodyNoTraffic: 'Non è ancora stato conservato alcun traffico API.',
      emptyBodyNoMatch: 'Nessuna richiesta corrisponde ai filtri attuali.'
    },
    explorer: {
      title: 'Esplora API',
      subtitle: 'Esegui chiamate dal vivo su questo server, guidate dal suo documento OpenAPI.',
      operations: 'Operazioni',
      selectOperation: 'Seleziona un\'operazione per costruire una richiesta.',
      selectOperationOption: 'Scegli un\'operazione...',
      pathParams: 'Parametri di percorso',
      queryParams: 'Parametri di query',
      headers: 'Header',
      addHeader: 'Aggiungi header',
      headerName: 'Nome dell\'header',
      headerValue: 'Valore dell\'header {{name}}',
      removeHeader: 'Rimuovi l\'header {{name}}',
      body: 'Corpo della richiesta',
      resolvedUrl: 'URL risolto',
      copyUrl: 'Copia URL',
      execute: 'Esegui',
      executing: 'Esecuzione in corso...',
      stop: 'Interrompi',
      streaming: 'Streaming',
      response: 'Risposta',
      responseHeaders: 'Header della risposta',
      responseBody: 'Corpo della risposta',
      snippets: 'Snippet di codice',
      history: 'Richieste recenti',
      historyEmpty: 'Nessuna richiesta recente.',
      loadHistory: 'Carica',
      deleteHistory: 'Elimina',
      clearHistory: 'Cancella cronologia',
      required: 'obbligatorio',
      confirmTitle: 'Esegui operazione distruttiva',
      confirmMessage: 'Questa richiesta {{method}} può modificare o eliminare dati. Continuare?',
      noSpecTitle: 'Documento OpenAPI non disponibile',
      noSpecBody: 'Questo server non ha restituito un documento /openapi.json utilizzabile, quindi Esplora API non può elencare le operazioni.'
    },
    settings: {
      errors: { allowed: 'Scegli uno di questi valori: {{values}}.', boolean: 'Scegli vero o falso.', max: 'Inserisci {{max}} o meno.', min: 'Inserisci {{min}} o più.', range: 'Inserisci un valore da {{min}} a {{max}}.', integer: 'Inserisci un numero intero.', number: 'Inserisci un numero.' },
      notSaved: 'Non è stato salvato nulla. Correggi le impostazioni evidenziate e salva di nuovo.',
      title: 'Impostazioni',
      subtitle: 'Impostazioni del server dal file di impostazioni e impostazioni del cluster memorizzate nel database.',
      readOnly: 'Stai visualizzando le impostazioni in sola lettura. Solo gli amministratori di sistema possono modificarle.',
      restartBanner: 'Alcune modifiche salvate hanno effetto dopo un riavvio.',
      restarting: 'Il server si sta riavviando. Questa pagina si riconnette automaticamente.',
      restarted: 'Il server è di nuovo online.',
      restartTimeout: 'Il server non è tornato disponibile entro tre minuti. Controlla lo stato del pod.',
      restart: 'Riavvia server',
      restartConfirmTitle: 'Riavvia server',
      restartConfirmMessage: 'Riavviare ora questo nodo del piano di controllo? Le richieste in corso vengono completate e la console si riconnette.',
      savedLive: 'Impostazioni salvate e applicate.',
      savedRestart: 'Impostazioni salvate. Riavvia il server per applicare tutte le modifiche.',
      live: 'Immediata',
      restartRequired: 'Riavvio necessario',
      secretSet: 'Impostato (inserisci un nuovo valore per sostituirlo)',
      secretNotSet: 'Non impostato',
      invalidNumber: 'Inserisci un numero.',
      range: 'Intervallo consentito da {{min}} a {{max}}',
      testDatabase: 'Prova connessione al database',
      testing: 'Verifica in corso...',
      dbOk: 'Connessione riuscita',
      dbFailed: 'Connessione non riuscita',
      unavailableTitle: 'Impostazioni non disponibili',
      unavailableBody: 'Questo server non ha restituito le sue impostazioni.',
      sources: { File: 'File di impostazioni', Environment: 'Ambiente', ConfigMap: 'ConfigMap', Database: 'Cluster' },
      lockedBy: {
        Environment: 'Impostato da una variabile di ambiente. Prevale il valore dell\'ambiente.',
        ConfigMap: 'Gestito da una ConfigMap di Kubernetes. Modificalo nei tuoi manifest.',
        other: 'Questa impostazione non può essere modificata qui.'
      },
      groups: { Codex: 'Codex', Archive: 'Archivio', General: 'Generale', Rest: 'REST', Mcp: 'MCP', Database: 'Database', Logging: 'Logging', Auth: 'Autenticazione', Security: 'Sicurezza', RequestHistory: 'Cronologia richieste', Telemetry: 'Telemetria', Cluster: 'Cluster', Scheduling: 'Pianificazione', Runs: 'Esecuzioni', Audit: 'Audit', Runtime: 'Motore di esecuzione', Observability: 'Osservabilità' },
      fields: {
        Observability: {
          GrafanaUrl: 'URL di Grafana',
          PrometheusUrl: 'URL di Prometheus',
          LokiUrl: 'URL di Loki',
          TempoUrl: 'URL di Tempo',
          GrafanaInternalUrl: 'URL interno di Grafana',
          PrometheusInternalUrl: 'URL interno di Prometheus',
          LokiInternalUrl: 'URL interno di Loki',
          TempoInternalUrl: 'URL interno di Tempo'
        },
        Rest: {
          ExternalBaseUrl: 'URL REST esterno',
          PublicBaseUrl: 'URL REST interno per le esecuzioni',
          Ssl: 'TLS per REST',
          Port: 'Porta REST',
          Hostname: 'Nome host di ascolto REST'
        },
        Mcp: {
          InternalPort: 'Porta MCP interna',
          SessionIdleTimeoutSeconds: 'Inattività delle sessioni MCP (secondi)',
          MaxToolWaitSeconds: 'Attesa massima degli strumenti MCP (secondi)',
          PublicUrl: 'URL MCP interno per le esecuzioni',
          Path: 'Percorso MCP',
          Port: 'Porta MCP',
          Hostname: 'Nome host di ascolto MCP',
          Enable: 'Server MCP attivo'
        },
        Database: {
          MinPoolSize: 'Connessioni minime nel pool',
          ConnectionTimeoutSeconds: 'Attesa di una connessione (secondi)',
          CommandTimeoutSeconds: 'Timeout dei comandi (secondi)',
          ConnectionIdleLifetimeSeconds: 'Durata delle connessioni inattive (secondi)',
          MaxPoolSize: 'Dimensione del pool di connessioni',
          Schema: 'Schema del database',
          Password: 'Password del database',
          Username: 'Utente del database',
          DatabaseName: 'Nome del database',
          Port: 'Porta del database',
          Host: 'Host del database',
          Filename: 'File Sqlite',
          Type: 'Provider del database'
        },
        Logging: {
          MinimumSeverity: 'Gravità minima dei log',
          LogFilename: 'Nome del file di log',
          LogDirectory: 'Cartella dei log',
          FileLogging: 'Registra in un file',
          ConsoleLogging: 'Registra nella console'
        },
        Auth: {
          RateLimitPerMinute: 'Tentativi di accesso al minuto',
          PasswordHashIterations: 'Iterazioni dell\'hash delle password',
          SignedRequestSkewSeconds: 'Scarto di orologio ammesso per le richieste firmate (secondi)',
          AdminApiKey: 'Chiave API dell\'amministratore',
          TokenLifetimeMinutes: 'Durata della sessione (minuti)',
          SigningKey: 'Chiave di firma dei token',
          Issuer: 'Emittente dei token'
        },
        Security: {
          NodeSecretKey: 'Chiave segreta dei nodi worker',
          NodeAccessKey: 'Chiave di accesso dei nodi worker',
          DefaultSecretKey: 'Chiave segreta predefinita',
          DefaultAccessKey: 'Chiave di accesso predefinita',
          AdminPassword: 'Password dell\'amministratore iniziale',
          AdminEmail: 'Email dell\'amministratore iniziale',
          MasterKey: 'Chiave master per la cifratura dei segreti'
        },
        RequestHistory: {
          CaptureNodeProtocol: 'Acquisire le richieste riuscite del protocollo dei worker',
          MaxResponseBodyBytes: 'Corpo della risposta registrato al massimo (byte)',
          MaxRequestBodyBytes: 'Corpo della richiesta registrato al massimo (byte)',
          RetentionDays: 'Conservazione della cronologia delle richieste (giorni)',
          Enabled: 'Registra la cronologia delle richieste'
        },
        Telemetry: {
          OtlpEndpoint: 'Endpoint OTLP',
          OtlpEnable: 'Esportazione OTLP attiva',
          PrometheusPort: 'Porta Prometheus',
          PrometheusEnable: 'Endpoint Prometheus attivo',
          ServiceName: 'Nome del servizio di telemetria',
          Enabled: 'Telemetria attiva'
        },
        Archive: {
          Directory: 'Directory di archivio'
        },
        Cluster: {
          Backplane: 'Backplane degli eventi',
          BackplanePollMs: 'Intervallo di polling del backplane (ms)',
          ExpectedReplicas: 'Repliche previste del piano di controllo'
        },
        Scheduling: {
          EventPollMs: 'Intervallo di polling degli eventi (ms)',
          InvocationWaitPollMs: 'Rilettura di riserva durante l\'attesa delle invocazioni (ms)',
          NodeHeartbeatTimeoutMs: 'Timeout dell\'heartbeat dei nodi (ms)',
          LeaseWaitMs: 'Attesa di long polling dei lease (ms)',
          LeaseDurationMs: 'Durata del lease delle esecuzioni (ms)',
          PauseGraceMs: 'Margine dopo una pausa dell\'host (ms)'
        },
        Runs: {
          EventRetentionDays: 'Conservazione degli eventi di esecuzione (giorni)',
          RetentionDays: 'Conservazione delle esecuzioni (giorni)',
          MaxDelegationDepth: 'Profondità massima di delega',
          DelegationChildQueueDepth: 'Massimo di esecuzioni figlie in coda con padre in attesa',
          DelegationRetryAfterSeconds: 'Nuovo tentativo per capacità di delega esaurita (secondi)',
          DefaultTimeoutSeconds: 'Timeout predefinito delle esecuzioni (secondi)'
        },
        Codex: {
          RefreshBeforeExpirySeconds: 'Rinnova gli accessi Codex prima della scadenza (secondi)',
          RefreshCheckIntervalSeconds: 'Intervallo del controllo in background (secondi)',
          RefreshTimeoutSeconds: 'Tempo massimo per il rinnovo (secondi)',
          TokenEndpoint: 'Endpoint dei token OAuth',
          ClientId: 'ID client OAuth'
        },
        Runtime: {
          FailBlockedAfterSeconds: 'Fai fallire le esecuzioni bloccate dopo (secondi)',
          MaxRunSeconds: 'Durata massima di un\'esecuzione (secondi)',
          RepetitionGuard: 'Protezione dalle ripetizioni predefinita',
          MaxAssistantChars: 'Massimo di caratteri dell\'assistente predefinito',
          NoProgressSeconds: 'Limite senza avanzamento predefinito (secondi)',
          ConversationAffinityWaitMs: 'Attesa di affinità delle conversazioni (ms)',
          ConversationTranscriptTurns: 'Turni nella trascrizione di ricostruzione',
          ConversationTranscriptChars: 'Caratteri per messaggio nella trascrizione di ricostruzione'
        },
        Audit: {
          RetentionDays: 'Conservazione dell\'audit (giorni)'
        }
      }
    },
    analytics: {
      grafana: 'Dashboard delle esecuzioni in Grafana',
      deletedAgent: 'Agente eliminato ({{id}})',
      deletedDeployment: 'Distribuzione eliminata ({{id}})',
      title: 'Analisi',
      subtitle: 'Quanto sono veloci, costose e affidabili le tue esecuzioni nel tempo.',
      loading: 'Caricamento delle analisi...',
      filters: { ttft: 'Escludi l\'attesa di delega dal TTFT', range: 'Intervallo', from: 'Da', to: 'A', agentId: 'Agente', harnessType: 'Harness', deploymentId: 'Distribuzione', model: 'Modello', groupBy: 'Raggruppa per' },
      allAgents: 'Tutti gli agenti',
      allHarnesses: 'Tutti gli harness',
      allDeployments: 'Tutte le distribuzioni',
      allModels: 'Tutti i modelli',
      unknownModel: 'Modello sconosciuto',
      groupBy: { none: 'Nessun raggruppamento', agent: 'Agente', harness: 'Harness', model: 'Modello', harnessModel: 'Harness e modello' },
      export: { window: 'Intervallo di tempo: da {{from}} a {{to}}' },
      usage: { title: 'Utilizzo per harness e modello', help: 'Token e costi nel tempo per ogni combinazione di harness e modello nell\'intervallo, più una tabella di dettaglio.' },
      breakdown: {
        title: 'Dettaglio harness per modello',
        columns: { harness: 'Harness', model: 'Modello', runs: 'Esecuzioni', inputTokens: 'Token di input', outputTokens: 'Token di output', cachedTokens: 'Token in cache', reasoningTokens: 'Token di ragionamento', costUsd: 'Costo', timeToFirstTokenMsAvg: 'TTFT medio' }
      },
      rangeError: {
        incomplete: 'Scegli sia un\'ora di inizio sia un\'ora di fine per l\'intervallo personalizzato.',
        reversed: 'L\'inizio dell\'intervallo personalizzato deve precedere la fine.'
      },
      truncated: 'Questo intervallo contiene più esecuzioni di quante il server ne aggreghi in una sola richiesta, quindi i numeri ne coprono solo una parte. Restringi l\'intervallo o aggiungi filtri per avere cifre esatte.',
      unavailableTitle: 'Le analisi non sono ancora disponibili su questo server',
      unavailableBody: 'Questo server non espone l\'endpoint delle analisi delle esecuzioni. Aggiorna il server per vedere i grafici qui.',
      emptyTitle: 'Nessuna esecuzione in questo intervallo',
      emptyBody: 'Nulla corrisponde all\'intervallo e ai filtri. Amplia l\'intervallo, rimuovi un filtro o invoca un agente.',
      noDataInChart: 'Nessun dato per questo grafico nell\'intervallo selezionato.',
      cards: {
        delegationWait: 'Attesa media di delega',
        ttftExcludingDelegation: 'TTFT medio senza delega',
        runs: 'Esecuzioni',
        runsNote: '{{succeeded}} riuscite, {{failed}} non riuscite',
        successRate: 'Tasso di successo',
        ttft: 'Tempo medio al primo token',
        execution: 'Tempo medio di esecuzione',
        queue: 'Tempo medio in coda',
        tokens: 'Token',
        tokensNote: '{{input}} in ingresso, {{output}} in uscita',
        throughput: 'Velocità media di output',
        cost: 'Costo',
        toolCalls: 'Chiamate a strumenti',
        p95: 'p95 {{value}}'
      },
      charts: {
        outcomes: { title: 'Esiti delle esecuzioni', help: 'Esecuzioni per intervallo, in base a come sono terminate.' },
        ttft: { helpExcluding: 'Dall\'avvio dell\'harness al primo output del modello, senza il tempo di attesa delle esecuzioni delegate.', title: 'Tempo al primo token', help: 'Dall\'avvio dell\'harness al primo output del modello. Include l\'avvio della CLI.' },
        duration: { title: 'Tempo di streaming e di esecuzione', help: 'Lo streaming va dal primo all\'ultimo output del modello; l\'esecuzione va dall\'avvio all\'uscita del processo.' },
        queue: { title: 'Tempo in coda', help: 'Tempo dall\'ingresso in coda all\'assegnazione in lease a un nodo worker.' },
        tokens: { title: 'Token', help: 'Token di input, output, in cache e di ragionamento per intervallo.' },
        throughput: { title: 'Token di output al secondo', help: 'Token di output divisi per il tempo di streaming, in media per intervallo.' },
        cost: { title: 'Costo', help: 'Costo riportato in dollari USA per intervallo.' },
        toolCalls: { title: 'Chiamate a strumenti', help: 'Eventi di chiamata a strumenti per intervallo.' },
        usageTokens: { title: 'Token per harness e modello', help: 'Token di input più output per intervallo, impilati per harness e modello.' },
        usageCost: { title: 'Costo per harness e modello', help: 'Costo riportato per intervallo, impilato per harness e modello.' }
      },
      groupedTitle: '{{chart}}: {{metric}}',
      metrics: {
        delegationWaitMsAvg: 'Attesa di delega (media)',
        timeToFirstTokenExcludingDelegationMsP95: 'Senza delega (p95)',
        timeToFirstTokenExcludingDelegationMsP50: 'Senza delega (p50)',
        timeToFirstTokenExcludingDelegationMsAvg: 'Senza delega (media)',
        runs: 'Esecuzioni',
        succeeded: 'Riuscite',
        failed: 'Non riuscite',
        cancelled: 'Annullate',
        timedOut: 'Scadute',
        inputTokens: 'Input',
        outputTokens: 'Output',
        cachedTokens: 'In cache',
        reasoningTokens: 'Ragionamento',
        totalTokens: 'Token di input più output',
        costUsd: 'Costo',
        toolCalls: 'Chiamate a strumenti',
        timeToFirstTokenMsAvg: 'Media',
        timeToFirstTokenMsP50: 'Mediana (p50)',
        timeToFirstTokenMsP95: 'p95',
        streamingMsAvg: 'Streaming (media)',
        executionMsAvg: 'Esecuzione (media)',
        executionMsP95: 'Esecuzione (p95)',
        queueMsAvg: 'Tempo medio in coda',
        outputTokensPerSecondAvg: 'Token medi al secondo'
      },
      other: 'Altro',
      hiddenGroups_one: '{{count}} gruppo meno attivo non è mostrato.',
      hiddenGroups_other: '{{count}} gruppi meno attivi non sono mostrati.',
      hiddenGroups_many: '{{count}} gruppi meno attivi non sono mostrati.',
      legend: 'Serie in {{chart}}',
      dataTable: 'Tabella dei dati',
      bucketStart: 'Inizio intervallo'
    },
    serverInfo: {
      title: 'Info server',
      subtitle: 'Endpoint, versioni e l\'identità con cui hai effettuato l\'accesso.',
      endpoints: 'Endpoint',
      rest: 'API REST',
      mcp: 'MCP',
      a2a: 'A2A',
      openapi: 'OpenAPI',
      server: 'Server',
      version: 'Versione del server',
      dashboardVersion: 'Versione della dashboard',
      node: 'Nodo di controllo',
      database: 'Database',
      health: 'Integrità',
      replicas: 'Repliche previste',
      routes: 'Operazioni registrate',
      serverTime: 'Ora del server',
      principal: 'Accesso effettuato come',
      principalName: 'Principal',
      principalType: 'Tipo di principal',
      role: 'Ruolo',
      tenant: 'Tenant',
      expires: 'Scadenza della sessione',
      features: 'Flag delle funzionalità'
    },
    runGuard: {
      titles: {
        RepetitionDetected: 'Fermata: il modello si stava ripetendo',
        NoProgress: 'Fermata: l\'esecuzione aveva smesso di avanzare',
        OutputLimitExceeded: 'Fermata: la risposta ha raggiunto il limite di dimensione'
      },
      bodies: {
        RepetitionDetected: 'La protezione dalle ripetizioni ha visto lo stesso testo breve scritto più e più volte (o solo spazi e punteggiatura), quindi Garrison ha fermato l\'esecuzione invece di lasciarla proseguire fino alla scadenza.',
        NoProgress: 'Per più tempo del limite senza avanzamento non sono arrivati testo, ragionamento né attività degli strumenti, quindi Garrison ha fermato l\'esecuzione.',
        OutputLimitExceeded: 'La risposta ha superato il numero massimo di caratteri dell\'assistente consentito per esecuzione, quindi Garrison ha fermato l\'esecuzione.'
      },
      detected: 'Cosa è stato rilevato: {{reason}}',
      partialKept: 'L\'output scritto prima dell\'arresto ({{chars}} caratteri) viene conservato come risultato dell\'esecuzione.',
      noPartial: 'L\'esecuzione non ha scritto alcun output prima dell\'arresto.',
      tune: 'Per cambiare quando succede, modifica la distribuzione {{deployment}}: il suo passaggio Posizionamento e limiti contiene Protezione dalle ripetizioni, Massimo di caratteri dell\'assistente e Limite senza avanzamento. Se li lasci vuoti, seguono i valori del cluster in Impostazioni (Motore di esecuzione).',
      tuneAny: 'Per cambiare quando succede, modifica la distribuzione: il suo passaggio Posizionamento e limiti contiene Protezione dalle ripetizioni, Massimo di caratteri dell\'assistente e Limite senza avanzamento. Se li lasci vuoti, seguono i valori del cluster in Impostazioni (Motore di esecuzione).',
      openDeployments: 'Apri le distribuzioni',
      openSettings: 'Apri le impostazioni'
    },
    conversationDetail: {
      title: 'Conversazione',
      notFoundTitle: 'Conversazione non trovata',
      notFoundBody: 'Potrebbe essere stata eliminata o appartenere a un altro tenant. I suoi turni restano nella pagina Esecuzioni.',
      deployment: 'Distribuzione',
      activeRun: 'Turno non concluso',
      turns: 'Turni',
      turnsCount: 'Turni ({{count}})',
      noTurns: 'Questa conversazione non ha ancora turni.',
      pending: 'In attesa del risultato',
      columns: {
        turn: 'Turno',
        run: 'Esecuzione',
        status: 'Stato',
        outcome: 'Esito',
        session: 'Sessione',
        input: 'Messaggio',
        result: 'Risposta',
        node: 'Nodo',
        created: 'Creato'
      },
      session: {
        first: 'Nuova sessione',
        resumed: 'Ripresa',
        fallback: 'Sessione da zero',
        pending: 'Non ancora assegnato'
      },
      continueTitle: 'Continua la conversazione',
      message: 'Messaggio successivo',
      messagePlaceholder: 'Fai una domanda di approfondimento o dai l\'istruzione successiva...',
      busyNotice: 'Il turno precedente è ancora in corso. Potrai inviare il messaggio successivo quando sarà finito.',
      send: 'Invia turno',
      turnStarted: 'Turno {{turn}} avviato.',
      openInvoke: 'Continua in Invoca',
      confirmDelete: 'Eliminare la conversazione «{{title}}»? I suoi turni restano nella pagina Esecuzioni come esecuzioni normali, ma nessun nuovo turno potrà continuarla.'
    }
  },
  wizard: {
    title: 'Configura Garrison',
    stepOf: 'Passaggio {{step}} di {{total}}',
    steps: { welcome: 'Benvenuto', secret: 'Credenziali', manifest: 'Agente di esempio', invoke: 'Esecuzione di prova' },
    welcomeBody: 'Questo tenant non ha ancora agenti. In pochi passaggi potrai:',
    welcomeItem1: 'Memorizzare le credenziali di un harness, ad esempio una chiave API Anthropic o OpenAI (facoltativo).',
    welcomeItem2: 'Applicare un agente di esempio che usa l\'harness fittizio predefinito, quindi funziona senza credenziali.',
    welcomeItem3: 'Eseguirlo e seguirne la trascrizione.',
    start: 'Inizia',
    skip: 'Salta configurazione',
    skipStep: 'Salta questo passaggio',
    secretBody: 'Aggiungi le credenziali di cui avranno bisogno i tuoi agenti reali. Puoi saltare questo passaggio e aggiungere i segreti in seguito.',
    saveSecret: 'Salva e continua',
    secretSaved: 'Segreto salvato.',
    manifestBody: 'Questo manifest crea un agente echo e una distribuzione che usa l\'harness fittizio.',
    invokeBody: 'Invia un messaggio all\'agente echo. Verrai portato all\'esecuzione mentre è in corso.',
    invoke: 'Eseguilo',
    noAgent: 'Agente di esempio non trovato. Applica prima il manifest.'
  },
  tour: {
    title: 'Tour guidato',
    skip: 'Salta tour',
    done: 'Fine',
    steps: {
      sidebar: { title: 'Navigazione', body: 'Le pagine sono raggruppate in hub. Ogni hub ha delle schede nella parte superiore della pagina e ogni scheda ha il proprio link.' },
      topbar: { title: 'Contesto', body: 'Server, tenant, la tua identità, l\'integrità e lo stato in tempo reale sono sempre visibili qui.' },
      kpis: { title: 'A colpo d\'occhio', body: 'Ogni scheda riassume una risorsa. Fai clic su una scheda per aprire l\'elenco filtrato.' },
      invoke: { title: 'Invoca', body: 'Prova qualsiasi agente in modo interattivo e segui la trascrizione in streaming.' },
      configure: { title: 'Configurazione', body: 'Profili harness, modelli di prompt, server MCP e segreti controllano esattamente cosa viene eseguito. Agenti e distribuzioni hanno un hub dedicato.' },
      observe: { title: 'Monitoraggio', body: 'Cronologia delle richieste, audit ed Esplora API ti aiutano a verificare ed eseguire il debug.' }
    }
  },
  tips,
  explainers
};


// Executor capability negotiation (P11.18).
Object.assign(it.resources.deployments.fields, {"capIsolation": "Isolamento minimo", "capColdStartClass": "Classe di avvio", "capEgressControl": "Richiedi controllo del traffico in uscita", "capFilesystemSnapshot": "Richiedi snapshot del file system", "capSessionContinuation": "Richiedi continuazione della sessione", "capCrossNodeRestore": "Richiedi ripristino su un altro nodo"});
Object.assign(it.tips.resources.deployments, {"capIsolation": "Le esecuzioni attendono un worker con queste capacità. Scegli KubernetesJob per l’isolamento in container. Le capacità non disponibili mantengono le esecuzioni in coda.", "capColdStartClass": "Le esecuzioni attendono un worker con queste capacità. Scegli KubernetesJob per l’isolamento in container. Le capacità non disponibili mantengono le esecuzioni in coda.", "capEgressControl": "Le esecuzioni attendono un worker con queste capacità. Scegli KubernetesJob per l’isolamento in container. Le capacità non disponibili mantengono le esecuzioni in coda.", "capFilesystemSnapshot": "Le esecuzioni attendono un worker con queste capacità. Scegli KubernetesJob per l’isolamento in container. Le capacità non disponibili mantengono le esecuzioni in coda.", "capSessionContinuation": "Le esecuzioni attendono un worker con queste capacità. Scegli KubernetesJob per l’isolamento in container. Le capacità non disponibili mantengono le esecuzioni in coda.", "capCrossNodeRestore": "Le esecuzioni attendono un worker con queste capacità. Scegli KubernetesJob per l’isolamento in container. Le capacità non disponibili mantengono le esecuzioni in coda."});
it.resources.deployments.hints.capabilities = "Le esecuzioni attendono un worker con queste capacità. Scegli KubernetesJob per l’isolamento in container. Le capacità non disponibili mantengono le esecuzioni in coda.";
it.resources.nodes.columns.executorCapabilities = "Capacità di esecuzione";
it.tips.resources.nodes.executorCapabilities = "Le esecuzioni attendono un worker con queste capacità. Scegli KubernetesJob per l’isolamento in container. Le capacità non disponibili mantengono le esecuzioni in coda.";
it.enums.executorIsolation = {"Process": "Processo", "Container": "Contenitore", "SandboxedRuntime": "Ambiente isolato"};
it.enums.executorColdStart = {"Immediate": "Immediato", "Cold": "A freddo", "Warm": "Pronto"};
// Artifact collection and browsing (P12.8).
it.nav.items.artifacts = { label: "File", tip: "File raccolti dalle esecuzioni." };
it.resources.artifacts = { ...it.resources.artifactStores, title: "File", subtitle: "File raccolti dalle esecuzioni.", view: "File", deleteTitle: "File", emptyTitle: "File", emptyBody: "Configura un archivio e pattern espliciti nel deployment per raccogliere file.", columns: {"name": "Nome", "runId": "Esecuzione", "artifactStoreId": "Archivio", "mediaType": "Tipo di contenuto", "sizeBytes": "Byte", "sha256": "Impronta SHA-256", "createdUtc": "Creato", "id": "ID", "leaseEpoch": "Epoca del lease", "repairAttempt": "Tentativo di riparazione"}, fields: {"name": "Nome", "runId": "Esecuzione", "artifactStoreId": "Archivio", "mediaType": "Tipo di contenuto", "sizeBytes": "Byte", "sha256": "Impronta SHA-256", "createdUtc": "Creato", "id": "ID", "leaseEpoch": "Epoca del lease", "repairAttempt": "Tentativo di riparazione"}, actions: { download: "Scarica" } };
it.tips.resources.artifacts = { ...{"name": "File raccolti dalle esecuzioni. Nome", "runId": "File raccolti dalle esecuzioni. Esecuzione", "artifactStoreId": "File raccolti dalle esecuzioni. Archivio", "mediaType": "File raccolti dalle esecuzioni. Tipo di contenuto", "sizeBytes": "File raccolti dalle esecuzioni. Byte", "sha256": "File raccolti dalle esecuzioni. SHA-256", "createdUtc": "File raccolti dalle esecuzioni. Creato", "id": "File raccolti dalle esecuzioni. ID", "leaseEpoch": "File raccolti dalle esecuzioni. Epoca del lease", "repairAttempt": "File raccolti dalle esecuzioni. Tentativo di riparazione"}, actions: { download: "Scarica questo file tramite un collegamento temporaneo." }, filters: { runId: "Esecuzione", storeId: "Archivio" } };
Object.assign(it.resources.artifactStores.fields, {"pathPrefix": "Prefisso percorso", "bucket": "Contenitore S3", "endpoint": "Endpoint", "region": "Regione", "secretId": "Credenziale", "forcePathStyle": "Richieste con percorso"});
Object.assign(it.tips.resources.artifactStores, {"pathPrefix": "Endpoint S3 opzionale; vuoto usa AWS. Memorizza le credenziali in un segreto GenericEnv come JSON con accessKey, secretKey e sessionToken opzionale. Senza segreto usa le credenziali del server.", "bucket": "Endpoint S3 opzionale; vuoto usa AWS. Memorizza le credenziali in un segreto GenericEnv come JSON con accessKey, secretKey e sessionToken opzionale. Senza segreto usa le credenziali del server.", "endpoint": "Endpoint S3 opzionale; vuoto usa AWS. Memorizza le credenziali in un segreto GenericEnv come JSON con accessKey, secretKey e sessionToken opzionale. Senza segreto usa le credenziali del server.", "region": "Endpoint S3 opzionale; vuoto usa AWS. Memorizza le credenziali in un segreto GenericEnv come JSON con accessKey, secretKey e sessionToken opzionale. Senza segreto usa le credenziali del server.", "secretId": "Endpoint S3 opzionale; vuoto usa AWS. Memorizza le credenziali in un segreto GenericEnv come JSON con accessKey, secretKey e sessionToken opzionale. Senza segreto usa le credenziali del server.", "forcePathStyle": "Endpoint S3 opzionale; vuoto usa AWS. Memorizza le credenziali in un segreto GenericEnv come JSON con accessKey, secretKey e sessionToken opzionale. Senza segreto usa le credenziali del server."});
it.resources.deployments.fields.artifactGlobs = "Pattern di raccolta";
it.tips.resources.deployments.artifactGlobs = "Raccogli solo file relativi corrispondenti, ad esempio reports/**/*.json. Una lista vuota disabilita la raccolta.";
it.resources.deployments.hints.artifactGlobs = "Raccogli solo file relativi corrispondenti, ad esempio reports/**/*.json. Una lista vuota disabilita la raccolta.";
Object.assign(it.common.eventCodes, { ArtifactCollectionWarning: "Avviso di raccolta", ArtifactsCollected: "File raccolti" });
it.tips.nav.tabs.artifacts = it.nav.items.artifacts.tip + " " + it.tips.resources.artifacts.actions.download;
Object.assign(it.components.mcpTest, {"worker": "Nodo worker", "chooseWorker": "Seleziona un worker pronto. Il comando configurato elenca gli strumenti; nessuno strumento viene eseguito.", "runTest": "Avvia test"});
export default it;

it.views.settings.groups.Leases = "Lease di coordinamento";
it.views.settings.fields.Leases = {"Provider": "Fornitore", "ClutchEndpoint": "Endpoint Clutch", "ClutchAccessKey": "Chiave di accesso Clutch", "KeyPrefix": "Prefisso delle chiavi", "RequestTimeoutMs": "Timeout richiesta (ms)", "SweepIntervalMs": "Intervallo di controllo (ms)", "MaxLeaseMs": "Lease massimo (ms)", "MaxHoldMs": "Durata massima (ms)"};

it.enums.harnessType.ProviderApi = "API del fornitore";
it.enums.outputParser.ProviderApiJsonl = "JSONL API del fornitore";

// Pipeline (P12.9): definizioni (Agenti > Pipeline), esecuzioni di pipeline (Esecuzioni > Esecuzioni di pipeline) e
// revisioni delle fasi (Approvazioni > Revisioni delle fasi).
it.nav.hubs.approvals.tip = 'Chiamate a strumenti e fasi di pipeline in attesa di una persona, e ogni decisione';
Object.assign(it.nav, { approvalsPending_one: '{{count}} elemento in attesa di una persona', approvalsPending_other: '{{count}} elementi in attesa di una persona', approvalsPending_many: '{{count}} elementi in attesa di una persona' });
Object.assign(it.nav.items, {
  pipelines: { label: 'Pipeline di agenti', tip: 'Fasi ordinate di agenti con punti di revisione facoltativi' },
  pipelineRuns: { label: 'Esecuzioni di pipeline', tip: 'Esecuzioni delle pipeline, fase per fase' },
  pipelineReviews: { label: 'Revisioni delle fasi', tip: 'Fasi di pipeline in attesa della revisione di una persona' }
});
Object.assign(it.errorCodes, {
  RevisionLimitReached: 'Questa fase ha già usato tutte le sue rielaborazioni, quindi non si possono più richiedere modifiche. Approvala o rifiutala.',
  ReviewNotPending: 'Questa revisione è già stata decisa, da qualcun altro o dal suo timeout, quindi non può essere decisa di nuovo.',
  PipelineInUse: 'Questa pipeline ha esecuzioni non ancora concluse. Attendi che finiscano, o annullale, e poi elimina la pipeline.',
  PipelineRunActive: 'Si possono eliminare solo le esecuzioni di pipeline concluse. Annulla prima questa esecuzione di pipeline.',
  PipelineRunFinished: 'Questa esecuzione di pipeline è già conclusa, quindi non può essere annullata.',
  PipelineRunNotRetryable: 'Si possono riprovare solo le esecuzioni di pipeline non riuscite, scadute o annullate.',
  PipelineRunChanged: 'Questa esecuzione di pipeline è cambiata durante l\'elaborazione della richiesta. Ricaricala e riprova.',
  PipelineInactive: 'Questa pipeline non è attiva. Attivala prima di avviarla.',
  PipelineEmpty: 'Una pipeline richiede almeno una fase.',
  PipelineStageRun: 'Questa esecuzione è una fase di un\'esecuzione di pipeline, quindi non può essere riprovata da sola. Riprova invece l\'esecuzione di pipeline.',
  ReferencedByPipeline: 'Una fase di pipeline usa questo agente. Rimuovi l\'agente da ogni pipeline prima di eliminarlo.'
});
it.enums.pipelineRunStatus = { Running: 'In esecuzione', AwaitingReview: 'In attesa di revisione', Cancelling: 'Annullamento in corso', Succeeded: 'Riuscita', Failed: 'Non riuscita', Cancelled: 'Annullata', TimedOut: 'Scaduta' };
it.enums.pipelineRunOutcome = { None: 'Nessuno', Succeeded: 'Riuscita', StageFailed: 'Fase non riuscita', StageStartFailed: 'Impossibile avviare la fase', ReviewRejected: 'Revisione rifiutata', ReviewExpired: 'Revisione scaduta', Cancelled: 'Annullata', TimedOut: 'Tempo scaduto', InternalError: 'Errore interno' };
it.enums.pipelineStageStatus = { Pending: 'In sospeso', Running: 'In esecuzione', AwaitingReview: 'In attesa di revisione', Succeeded: 'Riuscita', Failed: 'Non riuscita', Cancelled: 'Annullata' };
it.enums.pipelineReviewStatus = { Pending: 'In sospeso', Approved: 'Approvata', ChangesRequested: 'Modifiche richieste', Rejected: 'Rifiutata', Expired: 'Scaduta', Cancelled: 'Annullata' };
it.enums.pipelineReviewDecision = { Approve: 'Approva', RequestChanges: 'Richiedi modifiche', Reject: 'Rifiuta' };
it.enums.pipelineReviewSource = { User: 'Persona', Timeout: 'Tempo scaduto', Cancelled: 'Esecuzione di pipeline fermata' };
Object.assign(it.enums.resourceType, { Pipeline: 'Pipeline di agenti', PipelineRun: 'Esecuzione di pipeline' });
Object.assign(it.enums.auditEventType, { PipelineReviewDecided: 'Revisione di fase decisa', PipelineRunCancelled: 'Esecuzione di pipeline annullata' });
it.resources.deployments.promptRoles.PipelineStage = 'Fase di pipeline (passaggio di consegne)';
Object.assign(it.resources.runs.columns, { pipelineRunId: 'Esecuzione di pipeline' });
it.resources.runs.pipelineStage = 'fase {{position}}, iterazione {{execution}}';
it.resources.pipelines = {
  ...rp('Pipeline di agenti', 'Fasi ordinate di agenti: ogni fase esegue un agente e passa il suo output alla successiva, con punti di revisione facoltativi.', 'Aggiungi pipeline', 'Crea pipeline', 'Modifica pipeline', 'Dettagli della pipeline', 'Elimina pipeline', 'Ancora nessuna pipeline', 'Crea una pipeline per concatenare agenti: ogni fase riceve l\'output della fase precedente.'),
  columns: { name: 'Nome', stages: 'Fasi', reviewGates: 'Punti di revisione', maxDurationSeconds: 'Limite di tempo', version: 'Versione', active: 'Attiva', description: 'Descrizione', id: 'ID', lastUpdateUtc: 'Aggiornata', createdUtc: 'Creata' },
  fields: {
    name: 'Nome',
    description: 'Descrizione',
    maxDurationSeconds: 'Limite di tempo (secondi)',
    active: 'Attiva',
    stages: 'Fasi',
    stageName: 'Nome della fase',
    agentId: 'Agente',
    deploymentId: 'Distribuzione',
    handoffTemplateId: 'Modello di passaggio di consegne',
    handoffTemplateVersion: 'Versione fissata del modello',
    outputCharLimit: 'Limite di caratteri passati',
    maxAttempts: 'Numero massimo di tentativi',
    continueOnFailure: 'Continua in caso di errore',
    requiresReview: 'Richiede revisione',
    reviewTimeoutSeconds: 'Timeout della revisione (secondi)',
    reviewTimeoutAction: 'Alla scadenza della revisione',
    maxRevisions: 'Numero massimo di rielaborazioni',
    stageDescription: 'Descrizione della fase',
    parameters: 'Parametri di esecuzione'
  },
  hints: {
    maxDurationSeconds: 'Da {{min}} a {{max}}. 0 significa nessun limite. Il limite copre l\'intera esecuzione di pipeline, compreso il tempo di attesa delle revisioni.',
    stages: 'Le fasi vengono eseguite in questo ordine. Ogni fase parte quando la precedente riesce (o fallisce con Continua in caso di errore) e, se richiede una revisione, dopo che una persona l\'ha approvata.',
    noDeployments: 'Questo agente non ha ancora distribuzioni. Lascia vuota la distribuzione o aggiungine una in Distribuzioni.',
    handoffTemplateVersion: 'Vuoto usa la versione attuale del modello.',
    outputCharLimit: 'Da {{min}} a {{max}}. Predefinito {{default}}.',
    maxAttempts: 'Da {{min}} a {{max}}. Predefinito {{default}}.',
    reviewTimeoutSeconds: 'Da {{min}} a {{max}}. 0 attende senza limiti.',
    maxRevisions: 'Da {{min}} a {{max}}. Predefinito {{default}}.',
    parameters: 'Solo con una distribuzione, e solo i parametri che quella distribuzione consente di sostituire.'
  },
  errors: {
    dnsName: 'Usa da 1 a 64 lettere minuscole, cifre e trattini, iniziando e terminando con una lettera o una cifra.',
    range: 'Inserisci un numero intero da {{min}} a {{max}}.',
    noStages: 'Aggiungi almeno una fase.',
    tooManyStages: 'Una pipeline ha al massimo {{max}} fasi.',
    stageNameLong: 'I nomi delle fasi hanno un limite di 128 caratteri.',
    stageNameDuplicate: 'Un\'altra fase si chiama già {{name}}.',
    version: 'Inserisci un numero di versione pari o superiore a 1, oppure lascia vuoto.',
    parametersNeedDeployment: 'I parametri di esecuzione richiedono una distribuzione, perché vengono verificati rispetto alle sostituzioni che essa consente.',
    parametersUnique: 'Ogni nome di parametro può comparire una sola volta.',
    stageInvalid: 'questa fase contiene errori.'
  },
  actions: { start: 'Avvia', preview: 'Anteprima dei prompt', runs: 'Visualizza esecuzioni di pipeline' },
  stageHeading: 'Fase {{position}}: {{name}}',
  stageCount: '{{count}} su un massimo di {{max}}',
  stageSummary: '{{count}} fasi: {{chain}}',
  addStage: 'Aggiungi fase',
  removeStage: 'Rimuovi fase',
  noStages: 'Ancora nessuna fase.',
  chooseAgent: 'Scegli un agente',
  anyDeployment: 'Qualsiasi distribuzione attiva (ponderata)',
  defaultHandoff: 'Associazione della distribuzione o modello integrato',
  parameterName: 'Parametro',
  parameterValue: 'Valore',
  noLimit: 'Nessun limite',
  versionNotice: 'Versione {{version}}. Il salvataggio crea una nuova versione; le esecuzioni di pipeline già avviate mantengono le fasi con cui sono partite.'
};
it.resources.pipelineRuns = {
  ...rp('Esecuzioni di pipeline', 'Ogni esecuzione di una pipeline. Aprine una per seguirne le fasi, decidere le revisioni, oppure annullarla e riprovarla.', 'Aggiungi esecuzione di pipeline', 'Crea esecuzione di pipeline', 'Modifica esecuzione di pipeline', 'Dettagli dell\'esecuzione di pipeline', 'Elimina esecuzione di pipeline', 'Ancora nessuna esecuzione di pipeline', 'Avvia una pipeline da Agenti > Pipeline di agenti per vederne qui le esecuzioni.'),
  columns: { id: 'ID', pipelineName: 'Pipeline di agenti', status: 'Stato', outcome: 'Esito', progress: 'Fase', callerName: 'Avviata da', errorMessage: 'Errore', priority: 'Priorità', deadlineUtc: 'Scadenza', completedUtc: 'Completata', createdUtc: 'Creata' },
  actions: { cancel: 'Annulla', retry: 'Riprova', stageRuns: 'Visualizza esecuzioni delle fasi', finalRun: 'Apri esecuzione finale' },
  toasts: { cancelRequested: 'Annullamento richiesto per l\'esecuzione di pipeline e la sua fase corrente.', retried: 'L\'esecuzione di pipeline riprende dalla fase in cui si era fermata.' },
  progressValue: '{{position}} di {{count}}',
  versionShort: '(versione {{version}})'
};
it.resources.pipelineReviews = {
  ...rp('Revisioni delle fasi', 'Fasi di pipeline che attendono che una persona le approvi, richieda modifiche o le rifiuti.', 'Aggiungi revisione di fase', 'Crea revisione di fase', 'Modifica revisione di fase', 'Dettagli della revisione di fase', 'Elimina revisione di fase', 'Ancora nessuna revisione delle fasi', 'Le fasi che richiedono una revisione compaiono qui quando terminano.'),
  columns: { createdUtc: 'Richiesta il', pipelineName: 'Pipeline di agenti', stageName: 'Fase', status: 'Stato', decision: 'Decisione', decisionSource: 'Decisa da', comment: 'Commento', decidedBy: 'Revisore', expiresUtc: 'Scadenza', pipelineRunId: 'Esecuzione di pipeline', runId: 'Esecuzione della fase', decidedUtc: 'Decisa il', id: 'ID' },
  filters: { pipelineRunId: 'ID dell\'esecuzione di pipeline', pipelineRunIdPlaceholder: 'ID dell\'esecuzione di pipeline (plr_...)' },
  actions: { approve: 'Approva', requestChanges: 'Richiedi modifiche', reject: 'Rifiuta', openStageRun: 'Apri esecuzione della fase' },
  noTimeout: 'Attende senza limiti'
};
it.components.pipelineReviews = {
  decideTitle: 'Revisione della fase {{stage}} di {{pipeline}}',
  decision: 'Decisione',
  positionExecution: 'fase {{position}}, iterazione {{execution}}',
  revisionsLeft: 'Rielaborazioni rimaste',
  revisionsLeftValue: '{{left}} di {{max}}',
  noRevisionsLeft: 'Questa fase ha usato tutte le {{max}} rielaborazioni. Il server rifiuterà Richiedi modifiche; approvala o rifiutala.',
  timeoutThen: 'poi {{decision}}',
  commentApprove: 'Note per la fase successiva',
  commentApprovePlaceholder: 'Facoltativo. La fase successiva riceve queste note insieme all\'output.',
  commentRequestChanges: 'Cosa deve cambiare',
  commentRequestChangesPlaceholder: 'Obbligatorio. La fase viene eseguita di nuovo con questo riscontro.',
  commentReject: 'Motivo',
  commentRejectPlaceholder: 'Facoltativo. Registrato con la decisione; l\'esecuzione di pipeline fallisce.',
  commentRequired: 'Descrivi cosa deve cambiare. La fase viene eseguita di nuovo con questo riscontro.',
  commentTooLong: 'I commenti hanno un limite di {{max}} caratteri.',
  submit: { Approve: 'Approva fase', RequestChanges: 'Richiedi modifiche', Reject: 'Rifiuta fase' },
  toasts: {
    Approve: 'Fase {{stage}} di {{pipeline}} approvata.',
    RequestChanges: 'Modifiche richieste alla fase {{stage}} di {{pipeline}}; viene eseguita di nuovo con il tuo riscontro.',
    Reject: 'Fase {{stage}} di {{pipeline}} rifiutata; l\'esecuzione di pipeline fallisce.',
    notPending: 'Questa revisione è già stata decisa, da qualcun altro o dal suo timeout. L\'elenco ora mostra lo stato attuale.',
    revisionLimit: 'Questa fase ha già usato tutte le sue rielaborazioni (massimo {{max}}), quindi non si possono più richiedere modifiche. Approvala o rifiutala.'
  }
};
it.components.pipelineStart = {
  title: 'Avvia {{name}}',
  intro_one: 'L\'input va all\'unica fase della pipeline.',
  intro_other: 'L\'input va alla prima di {{count}} fasi; ogni fase lo vede anche come attività originale.',
  intro_many: 'L\'input va alla prima di {{count}} fasi; ogni fase lo vede anche come attività originale.',
  input: 'Input',
  inputPlaceholder: 'Su cosa deve lavorare la pipeline?',
  shortcut: 'Premi Ctrl+Invio o Cmd+Invio per avviare.',
  submit: 'Avvia pipeline',
  starting: 'Avvio...',
  started: '{{name}} avviata.'
};
it.components.pipelinePreview = {
  title: 'Anteprima dei prompt di {{name}}',
  input: 'Input di esempio',
  sampleInput: 'Riassumi i problemi aperti e proponi una correzione per il più urgente.',
  sampleOutput: 'Output di esempio di {{stage}}.',
  outputOf: 'Output di esempio della fase {{position}} ({{stage}})',
  render: 'Genera i prompt',
  rendering: 'Generazione...',
  stageHeading: 'Fase {{position}}: {{stage}} ({{agent}})',
  deployment: 'Distribuzione: {{deployment}}',
  rendered: 'Generato',
  failed: 'Non riuscito'
};
it.views.pipelineRunDetail = {
  title: 'Esecuzione di pipeline',
  heading: 'Esecuzione della pipeline {{pipeline}}',
  notFoundTitle: 'Esecuzione di pipeline non trovata',
  notFoundBody: 'Potrebbe essere stata eliminata oppure appartiene a un altro tenant.',
  live: 'In tempo reale',
  polling: 'Aggiornamento periodico',
  finalRun: 'Esecuzione finale',
  started: 'Avviata',
  input: 'Input',
  reviewTitle: 'In attesa della tua revisione',
  reviewBody: 'La fase {{position}} ({{stage}}) ha concluso l\'iterazione {{execution}} e attende una revisione. Leggi il suo output nell\'esecuzione della fase:',
  reviewExpires: 'Se nessuno decide entro {{time}}, la revisione viene decisa automaticamente: {{decision}}.',
  reviewNoTimeout: 'La revisione attende finché una persona non decide, a meno che il limite di tempo della pipeline non termini prima l\'esecuzione.',
  stages: 'Fasi',
  stagesCount_one: '{{count}} fase',
  stagesCount_other: '{{count}} fasi',
  stagesCount_many: '{{count}} fasi',
  noStages: 'Questa esecuzione di pipeline non ha fasi.',
  current: 'Corrente',
  reviewGate: 'Punto di revisione',
  agent: 'Agente {{agent}}',
  counts: 'Iterazioni {{executions}}, tentativi {{attempts}} di {{maxAttempts}}, rielaborazioni {{revisions}} di {{maxRevisions}}',
  startedAt: 'avviata',
  blocked: 'In attesa di avvio: {{reason}}.',
  nextAttempt: 'Prossimo tentativo alle {{time}}.',
  reviewItem: 'Revisione dell\'iterazione {{execution}}',
  columns: { execution: 'Iterazione', run: 'Esecuzione della fase', status: 'Stato', outcome: 'Esito', error: 'Errore', created: 'Creata' },
  confirmCancelTitle: 'Annulla esecuzione di pipeline',
  confirmCancel: 'Annullare questa esecuzione della pipeline {{pipeline}}? L\'esecuzione della fase corrente viene annullata e una revisione in sospeso viene chiusa. Puoi riprovarla in seguito.',
  confirmDelete: 'Eliminare questa esecuzione della pipeline {{pipeline}} e le sue revisioni? Le esecuzioni delle sue fasi restano nella pagina Esecuzioni.'
};
Object.assign(it.views.runDetail, { pipelineRun: 'Esecuzione di pipeline' });
it.views.settings.fields.Runtime.PipelineSweepIntervalMs = 'Intervallo di controllo delle pipeline (ms)';
it.views.settings.fields.Runtime.PipelineMaxStages = 'Numero massimo di fasi per pipeline';

// Deployment trust level (P11.14).
it.enums.trustLevel = { Trusted: "Attendibile", Untrusted: "Non attendibile" };
it.enums.runBlockedReason.NoIsolatingWorker = "Nessun worker con isolamento";
it.components.blocked.reasons.NoIsolatingWorker = "Questa esecuzione non è attendibile e richiede l'isolamento in container, ma nessun worker pronto in grado di eseguire {{harness}} lo offre. Aggiungi un worker con l'esecutore Job Kubernetes, in un cluster in cui possa creare Job.";
it.tips.enums.runBlockedReason.NoIsolatingWorker = "Bloccata: questa esecuzione non attendibile richiede l'isolamento in container e nessun worker pronto con il suo harness lo offre. Attende in coda finché non si registra un worker con l'esecutore Job Kubernetes.";
it.tips.enums.trustLevel = { Trusted: "L'input arriva solo da chiamanti attendibili. Le esecuzioni possono usare l'esecutore Process, che non è isolato dalle altre esecuzioni né dal worker.", Untrusted: "L'input può arrivare da fonti non attendibili. Le esecuzioni vanno solo a un esecutore con isolamento in container o superiore e attendono in coda finché non ce n'è uno disponibile." };
Object.assign(it.common.fieldCodes, { TenantRequiresUntrusted: "Questo tenant richiede che ogni distribuzione sia non attendibile.", UntrustedNeedsIsolation: "Una distribuzione non attendibile non può usare l'esecutore Process. Scegli Job Kubernetes o lascia vuoto l'esecutore." });
it.resources.deployments.fields.trustLevel = "Livello di attendibilità";
it.resources.deployments.columns.trustLevel = "Livello di attendibilità";
it.resources.deployments.hints.trustLevel = "Scegli Non attendibile quando i chiamanti o i contenuti possono non essere attendibili. Queste esecuzioni richiedono l'isolamento in container: un esecutore vuoto significa allora Job Kubernetes, e le esecuzioni attendono finché un worker non può isolarle.";
it.tips.resources.deployments.trustLevel = "Attendibile consente l'esecutore Process, che non è isolato. Non attendibile viene eseguito solo su un esecutore con isolamento in container o superiore.";
it.tips.resources.deployments.trustFlagged = "Questo tenant richiede distribuzioni non attendibili. Questa distribuzione era attendibile prima che la regola fosse attivata: continua a funzionare come configurata, ma va impostata su Non attendibile al prossimo salvataggio.";
it.resources.deployments.trust = { tenantRequiresUntrusted: "Questo tenant richiede distribuzioni non attendibili. Imposta il livello di attendibilità su Non attendibile per salvare questa distribuzione.", untrustedProcess: "Le distribuzioni non attendibili non possono usare l'esecutore Process. Scegli Job Kubernetes o lascia vuoto l'esecutore.", flagged: "Attendibile, la regola richiede Non attendibile" };
it.resources.tenants.fields.requireUntrustedDeployments = "Richiedi distribuzioni non attendibili";
it.resources.tenants.columns.requireUntrustedDeployments = "Richiede Non attendibile";
it.resources.tenants.hints = { ...(it.resources.tenants.hints || {}), requireUntrustedDeployments: "Creare o salvare una distribuzione attendibile viene rifiutato. Le distribuzioni attendibili esistenti continuano a funzionare e restano segnalate finché non vengono salvate come non attendibili." };
it.tips.resources.tenants.requireUntrustedDeployments = "Se attivo, ogni distribuzione di questo tenant deve essere non attendibile, così le sue esecuzioni vanno solo a esecutori isolati.";
it.views.runDetail.trustLevel = "Livello di attendibilità";
it.tips.views.runDetail.trustLevel = "Il livello di attendibilità della distribuzione quando questa esecuzione è entrata in coda. Le esecuzioni non attendibili vanno solo a un esecutore con isolamento in container o superiore.";

// Deployment effect policy (P12.29).
it.enums.effectPolicy = { AtMostOnce: "Al massimo una volta", AtLeastOnce: "Almeno una volta", Journaled: "Registrata" };
it.tips.enums.effectPolicy = { AtMostOnce: "Se il worker viene perso dopo l'avvio dell'esecuzione, l'esecuzione fallisce con Nodo perso e non viene mai riavviata. Nessun effetto esterno avviene due volte. Il valore predefinito.", AtLeastOnce: "Se il worker viene perso dopo l'avvio dell'esecuzione, l'esecuzione torna in coda finché restano tentativi. Gli effetti già prodotti dal tentativo perso (un push, un messaggio) possono ripetersi.", Journaled: "Rimette in coda solo quando ogni effetto è passato dal registro degli effetti. Il registro non esiste ancora, quindi si comporta come Al massimo una volta." };
Object.assign(it.common.fieldCodes, { EffectPolicyConflict: "Il criterio degli effetti non concorda con il valore deprecato retryOnNodeLoss. Invia solo il criterio degli effetti." });
it.resources.deployments.fields.effectPolicy = "Criterio degli effetti";
it.resources.deployments.columns.effectPolicy = "Criterio degli effetti";
it.resources.deployments.hints.effectPolicy = "Al massimo una volta (predefinito) fa fallire con Nodo perso un'esecuzione avviata il cui worker viene perso. Almeno una volta la rimette in coda finché restano tentativi e può ripetere effetti. Registrata si comporta come Al massimo una volta finché il registro degli effetti non esiste. Un'esecuzione mai avviata torna sempre in coda.";
it.tips.resources.deployments.effectPolicy = "Cosa succede a un'esecuzione avviata quando il suo worker viene perso: fallisce (Al massimo una volta), torna in coda (Almeno una volta) oppure Registrata, che per ora si comporta come Al massimo una volta.";
it.views.runDetail.effectPolicy = "Criterio degli effetti";
it.tips.views.runDetail.effectPolicy = "Il criterio degli effetti del deployment quando questa esecuzione è entrata in coda. Decide cosa succede se il worker dell'esecuzione viene perso; le modifiche successive al deployment non la riguardano.";
it.views.settings.fields.Scheduling.QueueWakeFanout = "Polling risvegliati per replica";
it.views.settings.fields.Scheduling.RemoteWakeDelayMs = "Attesa dei risvegli remoti (ms)";
it.views.settings.fields.Auth.CacheSeconds = "Durata della cache di autenticazione (secondi)";

// Deployment egress allowlists (P11.15).
it.resources.deployments.fields.egressRules = "Elenco di uscita consentito";
it.resources.deployments.fields.egressCidr = "Blocco CIDR";
it.resources.deployments.fields.egressPort = "Porta di destinazione";
it.resources.deployments.fields.egressProtocol = "Protocollo";
it.resources.deployments.columns.egressRules = "Uscita";
it.resources.deployments.hints.egressRules = "Lascia vuoto per usare l'uscita predefinita del cluster per le esecuzioni (HTTPS verso qualsiasi destinazione). Con delle regole, i pod di esecuzione raggiungono solo il DNS, la porta MCP di Garrison e questi blocchi, e le esecuzioni richiedono un worker Kubernetes che le applichi. Inserisci blocchi CIDR, non nomi host; risolvi tu i nomi in indirizzi. Una porta vuota consente tutte le porte. Al massimo 64 regole.";
it.resources.deployments.egress = {"add": "Aggiungi regola di uscita", "allPorts": "Tutte le porte", "default": "Predefinita", "count_one": "Elenco consentito, {{count}} regola", "count_other": "Elenco consentito, {{count}} regole", "note_one": "Questa distribuzione ha {{count}} regola di uscita. Le sue esecuzioni girano solo su worker Kubernetes con gli elenchi di uscita attivi, in un pod la cui NetworkPolicy consente solo il DNS, la porta MCP di Garrison e la regola. Se nessun worker di questo tipo è pronto, le esecuzioni attendono in coda (Nessun worker con isolamento); non girano mai senza l'elenco consentito.", "note_other": "Questa distribuzione ha {{count}} regole di uscita. Le sue esecuzioni girano solo su worker Kubernetes con gli elenchi di uscita attivi, in un pod la cui NetworkPolicy consente solo il DNS, la porta MCP di Garrison e le regole. Se nessun worker di questo tipo è pronto, le esecuzioni attendono in coda (Nessun worker con isolamento); non girano mai senza l'elenco consentito.", "errors": {"cidrRequired": "Inserisci un blocco CIDR, ad esempio 203.0.113.0/24.", "cidrFormat": "Usa la notazione CIDR con la lunghezza del prefisso, ad esempio 198.51.100.7/32. I nomi host non sono accettati.", "cidrAddress": "L'indirizzo non è un indirizzo IPv4 o IPv6 valido.", "cidrPrefix": "La lunghezza del prefisso è fuori intervallo (da 0 a 32 per IPv4, da 0 a 128 per IPv6).", "cidrMapped": "Gli indirizzi IPv6 mappati su IPv4 non sono consentiti; inserisci invece il blocco IPv4.", "cidrHostBits": "L'indirizzo ha bit impostati dopo il prefisso; usa l'indirizzo di rete del blocco."}};
Object.assign(it.common.fieldCodes, {"InvalidCidr": "Blocco CIDR non valido.", "PortOutOfRange": "La porta deve essere compresa tra 1 e 65535, oppure vuota per tutte le porte.", "InvalidProtocol": "Protocollo sconosciuto; usa TCP o UDP.", "TooManyEgressRules": "Una distribuzione può avere al massimo 64 regole di uscita.", "EgressRulesNeedKubernetesJob": "Le regole di uscita sono applicate solo alle esecuzioni Job Kubernetes. Scegli Job Kubernetes o lascia vuoto l'esecutore.", "EgressRulesNeedColdStart": "Le regole di uscita richiedono un avvio a freddo, perché i pod preriscaldati girano già con l'uscita predefinita. Svuota la classe di avvio o scegli A freddo."});
it.components.blocked.reasons.NoIsolatingWorkerEgress = "La distribuzione di questa esecuzione ha un elenco di uscita consentito che solo un worker Kubernetes con gli elenchi di uscita attivi può applicare, e nessun worker pronto in grado di eseguire {{harness}} lo offre. L'esecuzione attende in coda e non gira mai senza l'elenco. Attiva gli elenchi di uscita su un worker Job Kubernetes, in un cluster il cui plugin di rete applica NetworkPolicy.";
it.tips.enums.runBlockedReason.NoIsolatingWorker = "Bloccata: questa esecuzione richiede un worker isolante (isolamento in container per un'esecuzione non attendibile, o controllo dell'uscita per una distribuzione con elenco di uscita consentito), e nessun worker pronto con il suo harness lo offre. Attende in coda finché non si registra un worker Job Kubernetes adatto.";
it.tips.resources.deployments.egressRules = "Destinazioni che i pod di esecuzione di questa distribuzione possono raggiungere, come blocchi CIDR con porta e protocollo facoltativi. Vuoto usa l'uscita predefinita.";
it.tips.resources.deployments.egressRulesItems = {"cidr": "Blocco di destinazione in notazione CIDR, IPv4 o IPv6, ad esempio 203.0.113.0/24. Risolvi tu i nomi host in indirizzi.", "port": "Porta di destinazione da 1 a 65535. Lascia vuoto per consentire tutte le porte del blocco.", "protocol": "TCP per la maggior parte dei servizi, oppure UDP."};
it.tips.resources.deployments.egressDefault = "Nessun elenco di uscita consentito: i pod di esecuzione usano l'uscita predefinita del cluster.";

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
})(it, {
 "nav": {
  "items": {
   "triggers": {
    "label": "Attivatori",
    "tip": "Pianificazioni cron e webhook firmati che avviano esecuzioni"
   },
   "notifications": {
    "label": "Notifiche",
    "tip": "Webhook firmati su esecuzioni, pipeline e approvazioni"
   }
  }
 },
 "enums": {
  "triggerType": {
   "Cron": "Pianificazione cron",
   "Webhook": "Webhook firmato"
  },
  "triggerTargetType": {
   "Agent": "Esecuzione di agente",
   "Pipeline": "Esecuzione di pipeline"
  },
  "triggerFireSource": {
   "Cron": "Pianificazione",
   "Webhook": "Consegna webhook",
   "Manual": "Attivato a mano"
  },
  "triggerFireOutcome": {
   "Started": "Avviato",
   "Failed": "Non riuscito",
   "Skipped": "Saltato"
  },
  "notificationEvent": {
   "RunSucceeded": "Esecuzione riuscita",
   "RunFailed": "Esecuzione non riuscita",
   "RunCancelled": "Esecuzione annullata",
   "RunTimedOut": "Esecuzione scaduta",
   "PipelineCompleted": "Pipeline completata",
   "PipelineFailed": "Pipeline non riuscita",
   "ApprovalRequested": "Approvazione richiesta",
   "Test": "Notifica di prova"
  },
  "notificationDeliveryStatus": {
   "Pending": "In attesa",
   "Delivering": "In consegna",
   "Succeeded": "Consegnata",
   "Failed": "Abbandonata"
  },
  "runKind": {
   "Invoke": "Invocazione",
   "Delegated": "Delegata",
   "Test": "Esecuzione di prova",
   "Retry": "Nuovo tentativo",
   "Pipeline": "Fase di pipeline",
   "Trigger": "Avviata da un attivatore"
  },
  "resourceType": {
   "Trigger": "Attivatore",
   "NotificationEndpoint": "Endpoint di notifica"
  },
  "auditEventType": {
   "SigningSecretRotated": "Segreto di firma rinnovato"
  }
 },
 "errorCodes": {
  "ReferencedByTrigger": "Un attivatore usa questo record. Modifica o elimina prima quell'attivatore.",
  "ReferencedByNotificationEndpoint": "Un endpoint di notifica filtra su questo record. Modifica o elimina prima quell'endpoint.",
  "NotAWebhookTrigger": "Solo gli attivatori webhook hanno un segreto di firma.",
  "TriggerInactive": "Questo attivatore è inattivo.",
  "InvalidSignature": "La firma del webhook manca, è malformata, troppo vecchia o non corrisponde.",
  "PayloadTooLarge": "Il contenuto supera quanto accetta il server."
 },
 "common": {
  "fieldCodes": {
   "InvalidUrl": "Inserisci un URL HTTP o HTTPS assoluto, senza nome utente né password.",
   "DestinationBlocked": "Il server rifiuta questa destinazione: gli indirizzi di loopback, privati, link-local e dei metadati sono bloccati a meno che un operatore consenta destinazioni private.",
   "EventsRequired": "Scegli almeno un evento.",
   "InvalidEvent": "Uno degli eventi non è supportato.",
   "InvalidCron": "L'espressione cron non è valida. Usa cinque campi: minuto, ora, giorno del mese, mese e giorno della settimana.",
   "InvalidTimeZone": "Fuso orario sconosciuto. Usa un nome IANA come UTC o Europe/Rome.",
   "TypeImmutable": "Il tipo di un attivatore non può cambiare. Creane uno nuovo.",
   "TargetMismatch": "Questo campo non appartiene alla destinazione scelta.",
   "PayloadTooLarge": "Il contenuto supera quanto accetta il server."
  }
 },
 "resources": {
  "runs": {
   "columns": {
    "triggerId": "Attivatore",
    "kind": "Tipo di esecuzione"
   }
  },
  "triggers": {
   "title": "Attivatori",
   "subtitle": "Pianificazioni cron e webhook firmati che avviano un'esecuzione di agente o di pipeline.",
   "add": "Aggiungi attivatore",
   "create": "Crea attivatore",
   "edit": "Modifica attivatore",
   "view": "Dettagli dell'attivatore",
   "deleteTitle": "Elimina attivatore",
   "emptyTitle": "Ancora nessun attivatore",
   "emptyBody": "Crea un attivatore per eseguire un agente secondo una pianificazione o quando un altro sistema invia un webhook.",
   "columns": {
    "name": "Nome",
    "type": "Tipo",
    "target": "Avvia",
    "schedule": "Pianificazione",
    "active": "Attivo",
    "lastFire": "Ultima attivazione",
    "nextFireUtc": "Prossima attivazione",
    "fireCount": "Attivazioni",
    "runAs": "Viene eseguito come",
    "signingSecretLast4": "Il segreto termina con",
    "description": "Descrizione",
    "id": "ID",
    "createdUtc": "Creato"
   },
   "fields": {
    "name": "Nome",
    "type": "Tipo",
    "description": "Descrizione",
    "targetType": "Avvia",
    "agentId": "Agente",
    "deploymentId": "Distribuzione",
    "pipelineId": "Pipeline di agenti",
    "inputTemplateId": "Modello di input",
    "priority": "Priorità",
    "cronExpression": "Espressione cron",
    "timeZone": "Fuso orario",
    "active": "Attivo",
    "webhook": "URL del webhook"
   },
   "hints": {
    "type": "Il tipo non può cambiare dopo la creazione dell'attivatore.",
    "inputTemplateId": "Un modello Task che produce l'input dell'esecuzione dalle variabili trigger.* e webhook.*. Vuoto usa il modello integrato trigger-input.",
    "priority": "Da {{min}} a {{max}}. Le più alte vengono eseguite prima.",
    "cronExpression": "Cinque campi: minuto, ora, giorno del mese, mese, giorno della settimana. Esempio: 0 9 * * 1-5 viene eseguito alle 09:00 nei giorni feriali.",
    "timeZone": "Nome IANA come UTC o Europe/Rome. I cambi dell'ora legale sono gestiti automaticamente.",
    "webhookNew": "L'URL del webhook e il segreto di firma compaiono dopo il salvataggio. Il segreto viene mostrato una sola volta."
   },
   "errors": {
    "name": "Usa da 1 a 64 lettere minuscole, cifre e trattini, iniziando e terminando con una lettera o una cifra.",
    "description": "Le descrizioni sono limitate a {{max}} caratteri.",
    "agentRequired": "Scegli l'agente eseguito da questo attivatore.",
    "pipelineRequired": "Scegli la pipeline avviata da questo attivatore.",
    "cron": "Inserisci cinque campi (minuto ora giorno mese giorno-della-settimana) o una macro come @daily.",
    "priority": "Inserisci un numero intero da {{min}} a {{max}}."
   },
   "actions": {
    "fire": "Attiva ora",
    "fires": "Cronologia attivazioni",
    "runs": "Vedi esecuzioni",
    "rotateSecret": "Rinnova segreto"
   },
   "fires": {
    "firedUtc": "Attivato",
    "source": "Origine",
    "outcome": "Esito",
    "started": "Esecuzione avviata",
    "deliveryId": "ID consegna",
    "error": "Errore",
    "runId": "Esecuzione",
    "pipelineRunId": "Esecuzione di pipeline"
   },
   "confirmRotateTitle": "Rinnova segreto di firma",
   "confirmRotate": "Sostituire il segreto di firma di {{name}}? Il segreto precedente smette subito di funzionare, quindi i mittenti devono passare al nuovo.",
   "anyDeployment": "Qualsiasi distribuzione attiva (ponderata)",
   "builtinTemplate": "Modello integrato trigger-input",
   "webhookSchedule": "Quando arriva un webhook firmato",
   "neverFired": "Non ancora attivato",
   "runAsNotice": "Viene eseguito come {{name}}. Salvando le modifiche, questo attivatore verrà eseguito come te.",
   "secretEnding": "Il segreto attuale termina con {{last4}}."
  },
  "notifications": {
   "title": "Notifiche",
   "subtitle": "Endpoint webhook che ricevono notifiche firmate quando esecuzioni e pipeline terminano o le approvazioni restano in attesa.",
   "add": "Aggiungi endpoint",
   "create": "Crea endpoint di notifica",
   "edit": "Modifica endpoint di notifica",
   "view": "Dettagli dell'endpoint di notifica",
   "deleteTitle": "Elimina endpoint di notifica",
   "emptyTitle": "Ancora nessun endpoint di notifica",
   "emptyBody": "Aggiungi un endpoint per ricevere un POST HTTP firmato quando un'esecuzione fallisce, una pipeline termina o un'approvazione è in attesa.",
   "columns": {
    "name": "Nome",
    "url": "URL",
    "events": "Eventi",
    "filters": "Filtri",
    "active": "Attivo",
    "signingSecretLast4": "Il segreto termina con",
    "includeResultText": "Testo del risultato",
    "description": "Descrizione",
    "id": "ID",
    "createdUtc": "Creato",
    "agent": "Agente",
    "deployment": "Distribuzione"
   },
   "fields": {
    "name": "Nome",
    "description": "Descrizione",
    "url": "URL",
    "events": "Eventi",
    "agentId": "Solo questo agente",
    "deploymentId": "Solo questa distribuzione",
    "includeResultText": "Includi il testo del risultato",
    "resultTextMaxChars": "Limite del testo del risultato (caratteri)",
    "active": "Attivo"
   },
   "hints": {
    "url": "Un URL HTTP o HTTPS. Gli indirizzi di loopback, privati e dei metadati sono rifiutati a meno che un operatore consenta destinazioni private, e i reindirizzamenti non vengono seguiti.",
    "events": "Gli eventi delle pipeline non vengono inviati finché è impostato un filtro di agente o di distribuzione.",
    "agentId": "Vuoto invia gli eventi di tutti gli agenti.",
    "deploymentId": "Vuoto invia gli eventi di tutte le distribuzioni.",
    "includeResultText": "Disattivato per impostazione predefinita: le notifiche contengono identificatori, stato e orari, ma nessun output dell'esecuzione.",
    "resultTextMaxChars": "Da {{min}} a {{max}}. Predefinito {{default}}."
   },
   "errors": {
    "name": "Usa da 1 a 64 lettere minuscole, cifre e trattini, iniziando e terminando con una lettera o una cifra.",
    "url": "Inserisci un URL HTTP o HTTPS assoluto, senza nome utente né password.",
    "events": "Scegli almeno un evento.",
    "resultTextMaxChars": "Inserisci un numero intero da {{min}} a {{max}}."
   },
   "actions": {
    "test": "Invia prova",
    "deliveries": "Registro consegne",
    "rotateSecret": "Rinnova segreto"
   },
   "deliveries": {
    "createdUtc": "In coda dal",
    "event": "Evento",
    "status": "Stato",
    "attempts": "Tentativi",
    "lastStatusCode": "Stato HTTP",
    "lastError": "Ultimo errore",
    "lastAttemptUtc": "Ultimo tentativo",
    "nextAttemptUtc": "Prossimo tentativo",
    "deliveredUtc": "Consegnata",
    "payload": "Contenuto",
    "id": "ID consegna"
   },
   "confirmRotateTitle": "Rinnova segreto di firma",
   "confirmRotate": "Sostituire il segreto di firma di {{name}}? Da ora le notifiche sono firmate con il nuovo segreto, compresi i nuovi tentativi già in coda.",
   "anyAgent": "Tutti gli agenti",
   "anyDeployment": "Tutte le distribuzioni",
   "noFilter": "Tutto",
   "eventCount_one": "{{count}} evento",
   "eventCount_other": "{{count}} eventi",
   "resultTextUpTo_one": "Fino a {{count}} carattere",
   "resultTextUpTo_other": "Fino a {{count}} caratteri",
   "secretNotice": "Le notifiche sono firmate con un segreto che termina con {{last4}}, impostato il {{time}}. Rinnovalo per ottenerne uno nuovo."
  }
 },
 "components": {
  "signingSecret": {
   "title": "Segreto di firma",
   "warning": "Copia ora questo segreto. Garrison lo conserva cifrato e non lo mostrerà più; rinnovalo se va perso.",
   "secret": "Segreto",
   "url": "URL del webhook",
   "done": "L'ho salvato",
   "scheme": "Firma ogni richiesta con l'intestazione {{header}}: {{format}}. Invia {{delivery}} perché le consegne ripetute contino una volta sola."
  },
  "triggerFire": {
   "title": "Attiva {{name}}",
   "intro": "Avvia ora questo attivatore. Il contenuto è facoltativo; il modello di input lo vede come webhook.body.",
   "body": "Contenuto",
   "contentType": "Tipo di contenuto",
   "submit": "Attiva",
   "firing": "Attivazione..."
  },
  "triggerFires": {
   "title": "Cronologia attivazioni",
   "count_one": "{{shown}} di {{count}} attivazione",
   "count_other": "{{shown}} di {{count}} attivazioni",
   "empty": "Questo attivatore non è ancora stato attivato.",
   "scheduled": "per {{time}}"
  },
  "notificationDeliveries": {
   "title": "Registro consegne",
   "count_one": "{{shown}} di {{count}} consegna",
   "count_other": "{{shown}} di {{count}} consegne",
   "empty": "A questo endpoint non è ancora stato inviato nulla.",
   "detail": "Consegna selezionata"
  },
  "notificationTest": {
   "title": "Notifica di prova",
   "sending": "Invio di una notifica di prova...",
   "succeeded": "L'endpoint ha accettato la notifica di prova.",
   "failed": "La notifica di prova non è riuscita e non verrà ritentata. Vedi l'errore qui sotto.",
   "pending": "Il primo tentativo non è riuscito; Garrison riproverà. Vedi l'errore qui sotto."
  }
 },
 "views": {
  "runDetail": {
   "trigger": "Attivatore"
  },
  "settings": {
   "groups": {
    "Triggers": "Attivatori",
    "Notifications": "Notifiche"
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Corpo massimo del webhook (byte)",
     "WebhookToleranceSeconds": "Tolleranza sul timestamp del webhook (secondi)",
     "CronMaxLatenessSeconds": "Limite di recupero cron (secondi)",
     "FireRetentionDays": "Conservazione della cronologia attivazioni (giorni)"
    },
    "Notifications": {
     "AllowPrivateDestinations": "Consenti destinazioni private",
     "MaxAttempts": "Tentativi di consegna",
     "InitialBackoffSeconds": "Attesa prima del primo nuovo tentativo (secondi)",
     "MaxBackoffSeconds": "Attesa massima tra i tentativi (secondi)",
     "TimeoutSeconds": "Timeout di consegna (secondi)",
     "DispatchIntervalMs": "Intervallo di invio (ms)",
     "SweepOverlapSeconds": "Sovrapposizione della scansione eventi (secondi)",
     "DeliveryRetentionDays": "Conservazione del registro consegne (giorni)"
    }
   }
  }
 }
});
Object.assign(it.common.fieldCodes, {"SecretUseDenied": "Non hai il permesso di usare questo segreto. Chiedi il ruolo SecretUser o SecretManager su di esso.", "GrantCeiling": "Puoi concedere solo i permessi che hai tu stesso.", "ReservedRoleName": "È il nome di un ruolo integrato. Scegli un altro nome."});
it.components.mcpTest.noWorkers = "Nessun worker pronto offre diagnostica stdio. I worker la eseguono solo quando un operatore imposta GARRISON_WORKER_MCP_TESTS_ENABLED=true su di loro, perché il comando gira sull'host del worker, fuori dall'isolamento delle esecuzioni.";

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
})(it, {
 "components": {
  "transcriptExport": {
   "label": "Esporta trascrizione",
   "exporting": "Esportazione...",
   "markdown": "Documento Markdown (.md)",
   "json": "JSON (.json)",
   "includeThinking": "Includi il ragionamento",
   "failed": "Esportazione della trascrizione non riuscita: {{message}}"
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "Input strutturato",
    "modeLabel": "Editor dell'input",
    "modeForm": "Modulo",
    "modeJson": "JSON grezzo",
    "required": "obbligatorio",
    "choose": "Seleziona un valore",
    "addItem": "Aggiungi elemento",
    "removeItem": "Rimuovi elemento",
    "jsonLabel": "JSON di input",
    "jsonPlaceholder": "Valore JSON",
    "unsupported": "Questo schema di input non ha proprietà con cui creare un modulo. Inserisci il documento JSON che l'agente si aspetta.",
    "invalidRaw": "Il JSON non è valido. Correggilo prima di passare al modulo.",
    "errors": {
     "required": "Questo campo è obbligatorio.",
     "number": "Inserisci un numero.",
     "integer": "Inserisci un numero intero.",
     "json": "Inserisci un JSON valido."
    }
   }
  },
  "manifests": {
   "bundle": {
    "scope": "Ambito dell'esportazione",
    "scopeAll": "Tutte le risorse",
    "scopeSelected": "Risorse selezionate",
    "kinds": "Tipi",
    "resources": "Risorse",
    "resourcesHint": "Un Tipo/nome per riga o separati da virgole, ad esempio Agent/triage.",
    "invalidSelectors": "Non è un Tipo/nome con un tipo noto: {{entries}}",
    "followReferences": "Includi ciò a cui fanno riferimento",
    "includeBuiltIn": "Includi gli elementi predefiniti referenziati",
    "exporting": "Esportazione...",
    "noSecrets": "Questo pacchetto non richiede segreti.",
    "requiredSecrets": "Crea questi segreti nel tenant di destinazione prima di applicare. I valori dei segreti non vengono mai esportati.",
    "requiredArtifactStores": "Crea questi archivi di artefatti nel tenant di destinazione prima di applicare."
   }
  }
 }
});

// Durable continuation and remote execution.
it.enums.runStatus.Suspended = "Sospesa";
it.resources.deployments.fields.suspensionEnabled = "Sospendi in attesa dell’approvazione";
it.resources.harnessProfiles.fields.sessionFormat = "Formato della sessione harness";
it.enums.auditEventType.QueueFull = "Coda piena";
it.enums.runExecutor.RemoteA2A = "A2A remoto";
it.enums.runExecutor.RemoteMcp = "MCP remoto";
it.tips.resources.deployments.suspensionEnabled = "Abilita checkpoint persistenti durante l’attesa. Richiede Process, home isolata, harness compatibile con ripresa e archivio artefatti.";
it.tips.resources.harnessProfiles.sessionFormat = "Formato della sessione con versione per checkpoint portabili. Modificarlo se un aggiornamento dell’harness cambia la compatibilità.";
it.tips.enums.runStatus.Suspended = "L’esecuzione ha un checkpoint persistente e durante l’attesa non occupa un lease o uno slot del worker.";
it.tips.enums.runExecutor.RemoteA2A = "Esegue un agente A2A registrato e autenticato con scadenza e annullamento.";
it.tips.enums.runExecutor.RemoteMcp = "Richiama lo strumento MCP remoto selezionato con ingresso JSON convalidato.";
it.tips.enums.auditEventType.QueueFull = "Ammissione rifiutata perché è stato raggiunto un limite della coda per cluster, tenant o agente.";

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
})(it, {
 "enums": {
  "agentRevisionState": {
   "Draft": "Bozza",
   "Published": "Pubblicata"
  },
  "promotionKind": {
   "Promote": "Promozione",
   "Rollback": "Ripristino"
  },
  "promotionOutcome": {
   "Applied": "Applicata",
   "RolledBack": "Ripristinata"
  },
  "revisionChangeType": {
   "Changed": "Modificato",
   "Added": "Aggiunto",
   "Removed": "Rimosso"
  },
  "resourceType": {
   "AgentRevision": "Revisione dell'agente",
   "Promotion": "Promozione"
  }
 },
 "errorCodes": {
  "PromotionOrderViolation": "La destinazione non è l'ambiente successivo all'origine. Attiva Consenti di saltare ambienti per promuovere fuori ordine.",
  "NoNextEnvironment": "L'origine è l'ultimo ambiente, quindi non c'è nulla verso cui promuovere.",
  "NoTargetDeployments": "Questo agente non ha distribuzioni nell'ambiente di destinazione. Creane prima una lì.",
  "NoSourceRevision": "Non c'è alcuna revisione da promuovere: l'agente non ha distribuzioni nell'ambiente di origine o non ha revisioni pubblicate. Scegli una revisione in modo esplicito.",
  "AmbiguousSourceRevision": "Le distribuzioni nell'ambiente di origine eseguono revisioni diverse. Scegli la revisione da promuovere.",
  "RevisionNotPublished": "Quella revisione è una bozza. Pubblicala prima di promuoverla.",
  "PromotionConflict": "Una distribuzione è cambiata mentre veniva applicata la promozione. Non è stato modificato nulla; ricarica e riprova.",
  "NotAPromotion": "Si possono ripristinare solo le promozioni, non i ripristini.",
  "AlreadyRolledBack": "Questa promozione è già stata ripristinata.",
  "RevisionUnchanged": "La bozza è uguale all'ultima revisione pubblicata. Modificala prima di pubblicarla oppure scartala.",
  "RevisionPublished": "Questa revisione è già pubblicata e non può cambiare.",
  "EnvironmentInUse": "Un ambiente rimosso ha ancora distribuzioni. Spostale o eliminale prima."
 },
 "views": {
  "agentDetail": {
   "revisions": "Revisioni",
   "draftNotice": "Questo agente ha modifiche in bozza non pubblicate. Le distribuzioni continuano a eseguire revisioni pubblicate finché la bozza non viene pubblicata.",
   "reviewDraft": "Esamina la bozza"
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "number": "Revisione",
    "state": "Stato",
    "author": "Autore",
    "changeNote": "Nota sulle modifiche",
    "publishedUtc": "Pubblicata",
    "actions": "Azioni"
   },
   "number": "Revisione {{number}}",
   "option": "Revisione {{number}} ({{state}})",
   "latest": "Ultima",
   "empty": "Questo agente non ha ancora revisioni.",
   "compareTitle": "Confronta revisioni",
   "from": "Da",
   "to": "A",
   "pickTwo": "Seleziona due revisioni diverse da confrontare.",
   "identical": "Le revisioni {{from}} e {{to}} hanno lo stesso contenuto.",
   "diffSummary": "Campi modificati tra la revisione {{from}} e la revisione {{to}}: {{changed}}.",
   "diffColumns": {
    "field": "Campo",
    "change": "Modifica",
    "before": "Prima",
    "after": "Dopo"
   },
   "emptyValue": "(vuoto)",
   "compare": "Confronta",
   "publish": "Pubblica",
   "discard": "Scarta la bozza",
   "publishTitle": "Pubblica la revisione {{number}}",
   "publishBody": "La pubblicazione rende la revisione {{number}} l'ultima revisione pubblicata. Le distribuzioni che seguono l'ultima revisione la eseguono dalla prossima esecuzione; quelle fissate mantengono la loro revisione.",
   "changeNote": "Nota sulle modifiche",
   "changeNotePlaceholder": "Cosa è cambiato e perché (facoltativo)",
   "publishing": "Pubblicazione...",
   "published": "Revisione {{number}} pubblicata.",
   "discardTitle": "Scarta la revisione in bozza {{number}}",
   "discardMessage": "Scartare la bozza? Le sue modifiche andranno perse. Le revisioni pubblicate e le distribuzioni non sono interessate.",
   "discarded": "La bozza è stata scartata."
  },
  "promote": {
   "title": "Promuovi una revisione",
   "intro": "Fissa ogni distribuzione dell'agente nell'ambiente di destinazione sulla revisione eseguita nell'ambiente di origine. Ogni promozione viene registrata e può essere ripristinata.",
   "agent": "Agente",
   "revision": "Revisione da promuovere",
   "revisionFromSource": "La revisione eseguita nell'ambiente di origine",
   "source": "Ambiente di origine",
   "target": "Ambiente di destinazione",
   "targetNext": "Ambiente successivo ({{name}})",
   "allowSkip": "Consenti di saltare ambienti",
   "skipWarning": "{{target}} non è l'ambiente immediatamente successivo a {{source}}.",
   "note": "Nota",
   "notePlaceholder": "Motivo di questa promozione (facoltativo)",
   "submit": "Promuovi",
   "promoting": "Promozione in corso...",
   "promoted": "Promossa in {{target}}. Distribuzioni aggiornate: {{deployments}}.",
   "errors": {
    "noNext": "Non esiste alcun ambiente dopo l'ambiente di origine.",
    "sameEnvironment": "Scegli un ambiente di destinazione diverso dall'origine.",
    "needsSkip": "Questa destinazione salta un ambiente. Attiva Consenti di saltare ambienti per promuovere fuori ordine."
   }
  },
  "promotions": {
   "title": "Cronologia delle promozioni",
   "agentFilter": "Agente",
   "allAgents": "Tutti gli agenti",
   "empty": "Ancora nessuna promozione o ripristino.",
   "columns": {
    "createdUtc": "Quando",
    "kind": "Tipo",
    "outcome": "Esito",
    "agent": "Agente",
    "revision": "Revisione",
    "environments": "Ambienti",
    "deployments": "Distribuzioni",
    "actor": "Da",
    "note": "Nota",
    "actions": "Azioni"
   },
   "path": "da {{source}} a {{target}}",
   "pinChange": "(da {{from}} a {{to}})",
   "skipped": "Ambienti saltati",
   "rollback": "Ripristina",
   "rollbackTitle": "Ripristina la promozione",
   "rollbackMessage": "Ripristinare le revisioni fissate che avevano prima le distribuzioni modificate da questa promozione da {{source}} a {{target}}? Distribuzioni interessate: {{deployments}}.",
   "rollbackNote": "Nota sul ripristino",
   "rolledBack": "Ripristinata. Le revisioni fissate precedenti sono state ristabilite."
  }
 },
 "resources": {
  "deployments": {
   "columns": {
    "environment": "Ambiente",
    "agentRevisionId": "Revisione fissata"
   },
   "fields": {
    "environment": "Ambiente",
    "agentRevisionId": "Revisione fissata"
   },
   "hints": {
    "environment": "La promozione sposta le revisioni tra gli ambienti nell'ordine del tenant.",
    "agentRevisionId": "Vuoto segue l'ultima revisione pubblicata dell'agente. Fissare una revisione mantiene questa distribuzione su di essa finché tu o una promozione non la cambiate."
   },
   "followLatest": "Segui l'ultima pubblicata",
   "latest": "Ultima",
   "selectAgentFirst": "Seleziona prima un agente.",
   "noPublished": "Questo agente non ha ancora revisioni pubblicate.",
   "actions": {
    "promote": "Promuovi",
    "promotions": "Cronologia delle promozioni"
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
})(it, {
 "nav": {
  "items": {
   "agentAssets": {
    "label": "Asset degli agenti",
    "tip": "Prompt di sistema, competenze, file di riferimento e modelli di documento con versioni, fissati dalle revisioni degli agenti."
   }
  }
 },
 "enums": {
  "agentAssetKind": {
   "SystemPrompt": "Prompt di sistema",
   "Skill": "Competenza",
   "ReferenceFile": "File di riferimento",
   "DocumentTemplate": "Modello di documento"
  },
  "runOutcome": {
   "AssetIntegrityFailed": "Integrità dell'asset non verificata"
  },
  "resourceType": {
   "AgentAsset": "Asset dell'agente"
  }
 },
 "errorCodes": {
  "AssetInUse": "Alcune revisioni degli agenti fissano ancora questo asset. Rimuovilo da quelle revisioni prima di eliminarlo.",
  "AssetKindImmutable": "Il tipo di un asset non può cambiare dopo la creazione. Crea invece un nuovo asset.",
  "AssetStoreImmutable": "L'archivio artefatti di un asset non può cambiare dopo la creazione. Crea invece un nuovo asset.",
  "AssetTemplateRequired": "Gli asset di tipo prompt di sistema richiedono un modello di prompt, e gli altri tipi non possono averne uno.",
  "AssetFileTooLarge": "Un file supera la dimensione consentita dall'impostazione Assets.MaxFileBytes.",
  "AssetVersionTooLarge": "I file nel complesso superano la dimensione consentita dall'impostazione Assets.MaxVersionBytes.",
  "AssetTooManyFiles": "Questo caricamento contiene più file di quanti ne consenta l'impostazione Assets.MaxFilesPerVersion.",
  "AssetHasNoFiles": "Gli asset di tipo prompt di sistema non hanno file. Modifica invece il loro modello di prompt."
 },
 "common": {
  "fieldCodes": {
   "InvalidAssetPath": "Usa un percorso relativo con barre normali e senza segmenti \".\" o \"..\", di al massimo 512 caratteri.",
   "MacroFormatRefused": "I file Office con macro vengono rifiutati (Assets.AllowMacroFormats). Salva il file come .docx o .dotx.",
   "AssetHasNoFiles": "Gli asset di tipo prompt di sistema non hanno file. Modifica invece il loro modello di prompt.",
   "AssetTemplateRequired": "Scegli un modello di prompt per un asset di tipo prompt di sistema."
  },
  "serverText": {
   "assetInUse": "L'asset {{asset}} è fissato dalle revisioni di questi agenti: {{agents}}. Rimuovilo prima da quelle revisioni.",
   "assetFileTooLarge": "Il file {{path}} è di {{size}} byte; il limite è {{limit}} byte (Assets.MaxFileBytes).",
   "assetVersionTooLarge": "Questa versione supera {{limit}} byte (Assets.MaxVersionBytes).",
   "assetTooManyFiles": "Una versione contiene al massimo {{limit}} file (Assets.MaxFilesPerVersion); questo caricamento ne ha {{count}}.",
   "assetHasNoFiles": "Gli asset di tipo prompt di sistema non hanno file. Modifica invece il loro modello di prompt."
  }
 },
 "resources": {
  "agentAssets": {
   "title": "Asset degli agenti",
   "subtitle": "Prompt di sistema, competenze, file di riferimento e modelli di documento con versioni, fissati dalle revisioni degli agenti.",
   "add": "Aggiungi asset",
   "create": "Crea asset",
   "edit": "Modifica asset",
   "view": "Dettagli dell'asset",
   "deleteTitle": "Elimina asset",
   "emptyTitle": "Ancora nessun asset",
   "emptyBody": "Crea un asset, carica i suoi file come versione e fissalo su una revisione dell'agente.",
   "columns": {
    "name": "Nome",
    "kind": "Tipo",
    "currentVersion": "Versione corrente",
    "description": "Descrizione",
    "tags": "Tag",
    "artifactStoreId": "Archivio",
    "id": "ID dell'asset",
    "createdUtc": "Creato"
   },
   "fields": {
    "name": "Nome",
    "kind": "Tipo",
    "promptTemplateId": "Modello di prompt",
    "artifactStoreId": "Archivio artefatti",
    "description": "Descrizione",
    "tags": "Tag"
   },
   "hints": {
    "kind": "Non modificabile dopo la creazione. Un asset di tipo prompt di sistema prende il testo da un modello di prompt; gli altri tipi contengono file caricati.",
    "promptTemplateId": "Il modello di prompt il cui testo questo asset fornisce come prompt di sistema dell'agente.",
    "artifactStoreId": "Dove vengono conservati i file caricati. Non modificabile dopo la creazione. Lascia vuoto per conservarli nel database di Garrison."
   },
   "errors": {
    "templateRequired": "Scegli il modello di prompt usato da questo asset di tipo prompt di sistema."
   },
   "version": "versione {{number}}",
   "noVersion": "Nessuna versione",
   "databaseStore": "Database di Garrison",
   "actions": {
    "versions": "Versioni"
   }
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "assetPins": "Asset fissati"
   }
  },
  "assets": {
   "versionsTitle": "Versioni di {{name}}",
   "current": "Corrente",
   "noVersions": "Questo asset non ha ancora versioni. Carica i suoi file qui sotto.",
   "systemPromptNotice": "Gli asset di tipo prompt di sistema non hanno file. Il loro testo proviene dal modello di prompt, quindi modifica il modello per cambiarlo.",
   "showFiles": "File",
   "filesTitle": "File della versione {{number}}",
   "noFiles": "Questa versione non ha file.",
   "preview": "Anteprima",
   "download": "Scarica",
   "previewTitle": "{{path}} (versione {{number}})",
   "emptyFile": "Questo file è vuoto.",
   "versionColumns": {
    "number": "Versione",
    "author": "Autore",
    "changeNote": "Nota sulle modifiche",
    "totalBytes": "Dimensione totale",
    "createdUtc": "Creata",
    "actions": "Azioni"
   },
   "fileColumns": {
    "path": "Percorso",
    "mediaType": "Tipo di media",
    "sizeBytes": "Dimensione",
    "sha256": "Digest SHA-256",
    "actions": "Azioni"
   },
   "uploadTitle": "Carica una nuova versione",
   "uploadHint": "Scegli uno o più file. Ogni caricamento è una versione completa: i file esclusi non vengono ripresi dalla versione corrente.",
   "files": "File",
   "uploadColumns": {
    "path": "Percorso nell'asset",
    "mediaType": "Tipo di media",
    "size": "Dimensione",
    "actions": "Rimuovi"
   },
   "mediaTypeGuessed": "Dall'estensione del file",
   "removeFile": "Rimuovi questo file dal caricamento",
   "changeNote": "Nota sulle modifiche",
   "changeNotePlaceholder": "Cosa è cambiato in questa versione",
   "upload": "Carica versione",
   "uploading": "Caricamento in corso...",
   "uploadCreated": "Creata la versione {{number}}.",
   "uploadUnchanged": "I file sono uguali a quelli della versione corrente {{number}}, quindi non è stata creata una nuova versione.",
   "limitSetting": "Il limite è definito dall'impostazione del server {{setting}}.",
   "duplicatePath": "Un altro file in questo caricamento ha lo stesso percorso.",
   "pinVersion": "{{name}} versione {{version}}",
   "pinCurrent": "{{name}} (corrente)",
   "pinsTitle": "Asset fissati",
   "pinsSave": "Salva bozza",
   "pinsSaved": "Asset fissati salvati sulla revisione in bozza {{number}}.",
   "pinsDraft": "Modifica gli asset fissati della revisione in bozza {{number}}. Il resto della bozza rimane invariato.",
   "pinsNewDraft": "Non c'è alcuna bozza aperta. Il salvataggio avvia una nuova bozza dalla revisione pubblicata {{number}} con questi asset fissati.",
   "pinsEmpty": "Nessun asset fissato.",
   "pinAsset": "Asset da fissare",
   "pinVersionLabel": "Versione",
   "chooseAsset": "Scegli un asset",
   "assetOption": "{{name}} (tipo: {{kind}})",
   "followCurrent": "Versione corrente",
   "removePin": "Rimuovi questo asset fissato",
   "addPin": "Aggiungi asset",
   "editPins": "Asset fissati",
   "pinsNewDraftButton": "Fissa asset in una nuova bozza"
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
})(it, {
 "views": {
  "conversationDetail": {
   "tabsLabel": "Sezioni della conversazione",
   "tabs": {
    "turns": "Turni",
    "files": "File condivisi"
   }
  },
  "runDetail": {
   "fileSpace": "Spazio file",
   "openFiles": "Apri i file"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "fileSpaceMountPath": "Cartella dello spazio file"
   },
   "hints": {
    "fileSpaceMountPath": "Cartella nell'area di lavoro dell'esecuzione che riceve i file condivisi della conversazione all'avvio; le modifiche al suo interno vengono riscritte alla fine. Valore predefinito: files."
   }
  }
 },
 "errorCodes": {
  "InvalidFilePath": "Usa un percorso relativo con barre normali e senza segmenti \".\" o \"..\".",
  "FileTooLarge": "Il file supera la dimensione consentita dall'impostazione FileSpaces.MaxFileBytes.",
  "FileSpaceFull": "Lo spazio file supererebbe l'impostazione FileSpaces.MaxTotalBytes.",
  "TooManyFiles": "Lo spazio file contiene già tutti i file consentiti dall'impostazione FileSpaces.MaxFiles.",
  "StaleFileUpload": "L'esecuzione non detiene più il suo lease, quindi le sue modifiche ai file non sono state scritte."
 },
 "common": {
  "fieldCodes": {
   "InvalidFilePath": "Usa un percorso relativo con barre normali e senza segmenti \".\" o \"..\"."
  },
  "serverText": {
   "fileSpaceFileTooLarge": "Il file {{path}} occupa {{size}} byte; il limite è {{limit}} byte (FileSpaces.MaxFileBytes).",
   "fileSpaceFull": "Lo spazio file conterrebbe più di {{limit}} byte (FileSpaces.MaxTotalBytes).",
   "fileSpaceTooManyFiles": "Lo spazio file contiene già {{count}} file (FileSpaces.MaxFiles).",
   "fileNotFound": "Il file {{path}} non è stato trovato."
  }
 },
 "components": {
  "files": {
   "title": "File condivisi",
   "summary": "File condivisi: {{count}} ({{size}})",
   "live": "In tempo reale",
   "polling": "Aggiornamento periodico",
   "includeDeleted": "Mostra i file eliminati",
   "refresh": "Aggiorna",
   "spaceId": "Spazio file {{id}}",
   "emptyTitle": "Ancora nessun file",
   "emptyBody": "Qui compaiono i file che i turni scrivono nella cartella condivisa o che carichi qui sotto.",
   "emptyBodyDeleted": "Nella cartella condivisa di questa conversazione non è stato scritto nulla, nemmeno un file eliminato in seguito.",
   "columns": {
    "path": "Percorso",
    "currentVersion": "Versione",
    "sizeBytes": "Dimensione",
    "mediaType": "Tipo di media",
    "lastUpdateUtc": "Aggiornato",
    "actions": "Azioni"
   },
   "deleted": "Eliminato",
   "version": "versione {{number}}",
   "versions": "Versioni",
   "download": "Scarica",
   "deleteLabel": "Elimina {{path}}",
   "deletedToast": "{{path}} è stato eliminato. Le sue versioni restano disponibili.",
   "deleteTitle": "Elimina il file",
   "confirmDelete": "Eliminare {{path}} dai file condivisi? I turni successivi non lo vedranno più. Le sue versioni restano disponibili e si possono ancora scaricare.",
   "versionsTitle": "Versioni di {{path}}",
   "noVersions": "Questo file non ha versioni.",
   "current": "Corrente",
   "versionColumns": {
    "number": "Versione",
    "sizeBytes": "Dimensione",
    "mediaType": "Tipo di media",
    "sha256": "Digest SHA-256",
    "writtenBy": "Scritto da",
    "createdUtc": "Scritto",
    "actions": "Azioni"
   },
   "preview": "Anteprima",
   "previewTitle": "{{path}} (versione {{number}})",
   "emptyFile": "Questa versione è vuota.",
   "uploadTitle": "Carica file",
   "uploadHint": "Scegli uno o più file e controlla i loro percorsi. Un percorso che corrisponde a un file dell'elenco ne aggiunge una nuova versione. Se un turno ha modificato quel file dopo il caricamento dell'elenco, il tuo caricamento viene salvato accanto con un nome di conflitto invece di sostituirlo.",
   "uploadCreated": "{{path}} aggiunto come versione {{version}}.",
   "uploadReplaced": "{{path}} salvato come versione {{version}}.",
   "uploadConflict": "{{requested}} è cambiato dopo il caricamento dell'elenco, quindi il tuo caricamento è stato salvato come {{path}}. Confronta i due file ed elimina quello che non ti serve.",
   "chooseFiles": "File da caricare",
   "uploadColumns": {
    "path": "Percorso nella cartella condivisa",
    "replaces": "Sostituisce",
    "size": "Dimensione",
    "actions": "Rimuovi"
   },
   "replacesVersion": "Versione {{version}}",
   "newFile": "Nuovo file",
   "removeFile": "Rimuovi questo file dal caricamento",
   "upload": "Carica",
   "uploading": "Caricamento in corso...",
   "limitSetting": "Il limite è definito dall'impostazione del server {{setting}}."
  }
 }
});
