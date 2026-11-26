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
    serverInUse: 'Server in uso:',
    useDifferentServer: 'Usa un altro server',
    useDefaultServer: 'Usa il server predefinito',
    tenantId: 'ID tenant',
    email: 'Email',
    password: 'Password',
    accessKey: 'Chiave di accesso',
    secretKey: 'Chiave segreta',
    submit: 'Accedi',
    connecting: 'Accesso in corso...',
    restoring: 'Ripristino della sessione...',
    errorGeneric: 'Impossibile accedere. Controlla le tue credenziali e che il server sia raggiungibile.',
    footerHint: 'Credenziali predefinite: admin@garrison / password nel tenant default.'
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
      selected_one: '{{formattedCount}} selezionato',
      selected_other: '{{formattedCount}} selezionati',
      selected_many: '{{formattedCount}} selezionati',
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
        inputSchema: 'JSON Schema di input',
        outputSchema: 'JSON Schema di output',
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
      grafanaSections: { overview: 'Panoramica', http: 'API HTTP', runs: 'Esecuzioni', agents: 'Agenti', models: 'Modelli e token', workers: 'Nodi worker', kubernetes: 'Esecutore Kubernetes', protocols: 'Protocolli', scheduler: 'Scheduler e coda', database: 'Database', controlPlane: 'Piano di controllo', security: 'Sicurezza e autenticazione', integrations: 'Integrazioni', logs: 'Log e tracce', autonomy: 'Autonomia' },
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
      serverInUse: 'Server in uso',
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
it.enums.harnessType.OpenCode = "opencode";
it.enums.harnessType.Pi = "pi";
it.enums.outputParser.OpenCodeJsonl = "opencode JSONL";
it.enums.outputParser.PiJsonl = "pi JSONL";
it.enums.mcpConfigFormat.OpenCodeJson = "opencode JSON";
it.enums.mcpConfigFormat.PiJson = "pi JSON";

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
})(it, {
 "nav": {
  "items": {
   "capabilities": {
    "label": "Capacità",
    "tip": "Il catalogo delle capacità: agenti, strumenti MCP e strumenti integrati degli harness che gli agenti orchestratori possono trovare e usare, con indicazioni su costi e latenza."
   }
  }
 },
 "enums": {
  "capabilityKind": {
   "Agent": "Agente",
   "McpTool": "Strumento MCP",
   "HarnessBuiltIn": "Strumento integrato dell'harness"
  },
  "capabilityOrigin": {
   "Derived": "Derivata",
   "Manual": "Manuale"
  },
  "capabilityHintStatus": {
   "Unknown": "Sconosciuto",
   "Known": "Noto"
  },
  "runBlockedReason": {
   "NoToolWorker": "Nessun worker con lo strumento"
  },
  "resourceType": {
   "ConversationFileSpace": "Spazio file della conversazione",
   "Capability": "Capacità"
  }
 },
 "errorCodes": {
  "InvalidJsonSchema": "Uno schema non è un JSON Schema valido. Correggi lo schema di input o di output e salva di nuovo.",
  "NameConflict": "Un'altra capacità manuale usa già questo nome. Scegline uno diverso.",
  "CapabilityDerived": "Questa capacità deriva dalla sua origine e la segue, quindi non si può modificare né eliminare qui. Modifica invece l'origine.",
  "InvalidTags": "Usa al massimo 32 tag, ciascuno da 1 a 64 caratteri.",
  "TooManyRequirements": "Usa al massimo 16 requisiti di etichetta del nodo."
 },
 "common": {
  "fieldCodes": {
   "InvalidJsonSchema": "Non è un JSON Schema valido.",
   "InvalidTags": "Usa al massimo 32 tag, ciascuno da 1 a 64 caratteri.",
   "TooManyRequirements": "Usa al massimo 16 requisiti di etichetta del nodo."
  },
  "serverText": {
   "capabilityDerivedEdit": "La capacità {{name}} deriva dalla sua origine e la segue. Modifica invece l'origine.",
   "capabilityDerivedDelete": "La capacità {{name}} deriva dalla sua origine e scompare insieme a essa, quindi non si può eliminare direttamente.",
   "capabilityShared": "La capacità {{name}} è condivisa da tutti i tenant e proviene da un profilo harness predefinito, quindi non si può modificare.",
   "capabilityNameConflict": "Esiste già una capacità manuale chiamata {{name}}.",
   "capabilitySecretsDenied": "Non hai l'autorizzazione per usare i segreti che il server MCP {{server}} invia, quindi i suoi strumenti non sono stati elencati.",
   "capabilityNoStdioWorker": "Nessun worker pronto ha attivato la diagnostica MCP stdio (GARRISON_WORKER_MCP_TESTS_ENABLED), quindi non è stato possibile elencare gli strumenti del server stdio.",
   "capabilityRefreshFailed": "Aggiornamento non riuscito il {{when}}: {{error}}",
   "capabilityMissingTools": "Mancano strumenti richiesti: {{tools}}.",
   "capabilityProbeShadowed": "I worker verificano {{name}} come {{probe}}, già definito da un altro profilo harness. La definizione di questo profilo non viene verificata."
  }
 },
 "components": {
  "blocked": {
   "reasons": {
    "NoToolWorker": "L'agente di questa esecuzione usa {{tools}} e nessun worker pronto in grado di eseguire {{harness}} lo segnala. Installa lo strumento sull'host di un worker in modo che la sua sonda segnali l'etichetta del nodo garrison.io/tool-{name}=true, oppure aggiungi quell'etichetta a mano a un worker."
   }
  },
  "revisions": {
   "columns": {
    "capabilities": "Capacità"
   }
  },
  "capabilities": {
   "noSource": "Voce manuale",
   "shared": "Condivisa",
   "hintsLine": "Mediana {{median}}, p90 {{p90}}, {{cost}} per esecuzione",
   "hintsLineNoCost": "Mediana {{median}}, p90 {{p90}}, nessun costo registrato",
   "hintsTitle": "Indicazioni su costi e latenza",
   "noCost": "Nessun costo registrato",
   "windowDays_one": "{{count}} giorno",
   "windowDays_other": "{{count}} giorni",
   "refreshWarning": "L'ultimo aggiornamento dell'origine di questa voce non è riuscito.",
   "requirementsTitle": "Etichette del nodo richieste da un'esecuzione",
   "noRequirements": "Nessuna. Le esecuzioni che usano questa capacità possono andare a qualsiasi worker.",
   "noSchema": "Nessuno schema",
   "fields": {
    "kind": "Tipo",
    "origin": "Origine",
    "source": "Fonte",
    "lastRefreshedUtc": "Ultimo aggiornamento",
    "tags": "Tag",
    "id": "Identificativo",
    "summary": "Riepilogo",
    "hintStatus": "Stato",
    "sampleSize": "Esecuzioni riepilogate",
    "medianDurationMs": "Durata mediana",
    "p90DurationMs": "Durata p90",
    "meanCostUsd": "Costo medio",
    "windowDays": "Finestra",
    "computedUtc": "Calcolato",
    "inputSchema": "Schema di input",
    "outputSchema": "Schema di output"
   },
   "refreshTitle": "Aggiorna il catalogo delle capacità",
   "refreshHint": "Garrison ricava di nuovo le voci degli agenti e degli strumenti integrati degli harness, elenca gli strumenti di ogni server MCP (i server stdio tramite un worker con la diagnostica stdio attiva) e ricalcola le indicazioni degli agenti. Per elencare un server gli vengono inviati i segreti nominati dai suoi modelli, quindi ti serve l'autorizzazione a usarli.",
   "refreshServer": "Server MCP da elencare",
   "refreshAll": "Tutti i server MCP attivi",
   "refreshRun": "Aggiorna adesso",
   "refreshing": "Aggiornamento in corso...",
   "refreshDone": "Il catalogo delle capacità è aggiornato.",
   "refreshPartial_one": "Il catalogo è stato aggiornato, ma non è stato possibile elencare {{count}} server MCP.",
   "refreshPartial_other": "Il catalogo è stato aggiornato, ma non è stato possibile elencare {{count}} server MCP.",
   "refresh": {
    "agents": "Voci di agenti modificate",
    "harnessBuiltIns": "Voci di strumenti integrati modificate",
    "hints": "Indicazioni ricalcolate",
    "servers": "Server MCP elencati",
    "tools": "Voci di strumenti scritte",
    "removed": "Voci di strumenti rimosse",
    "failed": "Server non riusciti",
    "noServers": "Non è stato elencato alcun server MCP.",
    "failedBadge": "Non riuscito",
    "listedBadge": "Elencato",
    "columns": {
     "server": "Server MCP",
     "status": "Esito",
     "tools": "Strumenti",
     "removed": "Rimosse",
     "warned": "Mantenute con un avviso",
     "error": "Errore"
    }
   },
   "errors": {
    "nameLength": "Usa da 1 a {{max}} caratteri.",
    "summaryLength": "Usa al massimo {{max}} caratteri.",
    "tags": "Usa al massimo {{max}} tag, ciascuno da 1 a {{length}} caratteri.",
    "requirementCount": "Usa al massimo {{max}} requisiti di etichetta del nodo.",
    "requirement": "Ogni requisito richiede una chiave di etichetta del nodo da 1 a {{max}} caratteri.",
    "toolNeedsServer": "Scegli il server MCP a cui appartiene lo strumento.",
    "probeCount": "Un profilo harness ha al massimo {{max}} sonde di strumenti.",
    "probeName": "Il nome dello strumento ha da 1 a 63 lettere minuscole, cifre, punti e trattini, e inizia con una lettera o una cifra.",
    "probeDuplicate": "Un'altra sonda di questo profilo si chiama {{name}}.",
    "probeExecutable": "L'eseguibile è un semplice nome di file che si trova nel PATH (lettere, cifre, punti, trattini bassi, segni più e trattini), senza cartella.",
    "probeArgument": "Non scegliere alcun argomento oppure scegline uno tra {{allowed}}.",
    "probeDescription": "Usa al massimo {{max}} caratteri."
   },
   "draftTitle": "Capacità",
   "draftSave": "Salva la bozza",
   "draftSaved": "Capacità salvate nella revisione in bozza {{number}}.",
   "draftEdit": "Modifica le capacità della revisione in bozza {{number}}. Il resto della bozza rimane invariato.",
   "draftNew": "Non c'è nessuna bozza aperta. Salvando si avvia una nuova bozza dalla revisione pubblicata {{number}} con queste capacità.",
   "draftPlacementHint": "Uno strumento integrato dell'harness indicato qui aggiunge la sua etichetta del nodo alle esecuzioni di questo agente, che quindi vanno solo ai worker che hanno segnalato lo strumento.",
   "draftEmpty": "Questa revisione non usa alcuna capacità.",
   "notInCatalog": "Non presente nel catalogo",
   "removeName": "Rimuovi {{name}}",
   "chooseName": "Scegli una capacità",
   "nameOption": "{{name}} ({{kinds}})",
   "addName": "Aggiungi capacità",
   "newDraftButton": "Scegli le capacità in una nuova bozza",
   "editDraft": "Capacità"
  }
 },
 "resources": {
  "capabilities": {
   "title": "Capacità",
   "subtitle": "Agenti, strumenti MCP e strumenti integrati degli harness che gli agenti orchestratori possono trovare e usare, con indicazioni su costi e latenza.",
   "add": "Aggiungi capacità",
   "create": "Crea capacità",
   "edit": "Modifica capacità",
   "view": "Dettagli della capacità",
   "deleteTitle": "Elimina capacità",
   "emptyTitle": "Ancora nessuna capacità",
   "emptyBody": "Pubblica una revisione di un agente, registra un server MCP o aggiungi una sonda di strumento a un profilo harness, poi aggiorna. Puoi anche aggiungere una voce manuale.",
   "columns": {
    "name": "Nome",
    "kind": "Tipo",
    "origin": "Origine",
    "summary": "Riepilogo",
    "source": "Fonte",
    "hints": "Indicazioni",
    "tags": "Tag",
    "lastRefreshedUtc": "Ultimo aggiornamento",
    "id": "Identificativo",
    "createdUtc": "Creata"
   },
   "fields": {
    "name": "Nome",
    "kind": "Tipo",
    "summary": "Riepilogo",
    "sourceAgentId": "Agente che rappresenta",
    "sourceMcpServerId": "Server MCP a cui appartiene",
    "sourceToolName": "Nome dello strumento su quel server",
    "tags": "Tag",
    "requirements": "Etichette del nodo richieste da un'esecuzione",
    "inputSchema": "Schema di input",
    "outputSchema": "Schema di output"
   },
   "hints": {
    "kind": "Le voci manuali possono essere di qualsiasi tipo, per esempio un servizio di conversione che gli agenti raggiungono tramite una skill.",
    "requirements": "Un'esecuzione di un agente che usa questa capacità va solo ai worker che hanno tutte queste etichette del nodo.",
    "sourceMcpServerId": "Facoltativo. Un token di esecuzione vede una voce che nomina un server solo quando la sua distribuzione collega quel server.",
    "inputSchema": "Un JSON Schema, per esempio {\"type\": \"object\"}. Lascialo vuoto se la capacità accetta testo libero."
   },
   "tagFilter": "Filtra per tag",
   "refresh": "Aggiorna",
   "warningBadge": "Aggiornamento non riuscito",
   "warnings_one": "{{count}} voce ha mantenuto il suo ultimo contenuto valido perché l'ultimo aggiornamento della sua origine non è riuscito. Aprila per vedere il motivo.",
   "warnings_other": "{{count}} voci hanno mantenuto il loro ultimo contenuto valido perché l'ultimo aggiornamento della loro origine non è riuscito. Aprine una per vedere il motivo.",
   "noSourceOption": "Nessuno",
   "requirementKey": "Etichetta del nodo",
   "requirementValue": "Valore"
  },
  "harnessProfiles": {
   "fields": {
    "toolProbes": "Sonde degli strumenti",
    "probeName": "Nome dello strumento",
    "probeExecutable": "Eseguibile",
    "probeArgument": "Argomento",
    "probeDescription": "Descrizione"
   },
   "columns": {
    "toolProbes": "Sonde degli strumenti"
   },
   "hints": {
    "toolProbes": "Strumenti che questo harness può usare quando l'host del worker li ha. I worker eseguono ogni sonda prima di registrarsi e segnalano gli strumenti che rispondono come etichette del nodo garrison.io/tool-{name}=true."
   },
   "addToolProbe": "Aggiungi sonda di strumento",
   "probeNoArgument": "Nessun argomento"
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
})(it, {
 "enums": {
  "fanOutGroupStatus": {
   "Running": "In esecuzione",
   "Joined": "Riunito",
   "TimedOut": "Tempo scaduto",
   "BudgetExceeded": "Budget superato",
   "Cancelled": "Annullato"
  },
  "fanOutJoinPolicy": {
   "All": "Tutti",
   "Any": "Uno qualsiasi",
   "Quorum": "Quorum"
  },
  "resourceType": {
   "FanOutGroup": "Gruppo di fan-out"
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "Gruppo di fan-out"
  }
 },
 "components": {
  "fanOut": {
   "group": "Gruppo di fan-out",
   "groupTitle": "Gruppo di fan-out {{id}}",
   "otherChildren": "Altre esecuzioni figlie",
   "detailsUnavailable": "Non è stato possibile caricare i dettagli del gruppo, quindi sono elencate solo le sue esecuzioni membro.",
   "policy": "Regola di riunione",
   "quorumPolicy": "{{policy}}: {{quorum}} su {{total}}",
   "progress": "Avanzamento",
   "progressValue": "{{finished}} su {{total}} terminati, {{succeeded}} riusciti",
   "cost": "Costo",
   "tokens": "Token",
   "usedOf": "{{used}} su {{limit}}",
   "noLimit": "{{used}} (senza limite)",
   "deadline": "Scadenza",
   "noDeadline": "Nessuna",
   "started": "Avviato",
   "completed": "Terminato",
   "pending": "Ancora in esecuzione: {{labels}}",
   "failed": "Senza successo: {{labels}}",
   "live": "In tempo reale",
   "polling": "Aggiornamento periodico",
   "cancel": "Annulla gruppo",
   "cancelTitle": "Annulla gruppo di fan-out",
   "confirmCancel": "Annullare il gruppo di fan-out {{id}}? I membri ancora in esecuzione vengono annullati e l'esecuzione padre vede il gruppo come annullato.",
   "cancelledToast": "Il gruppo di fan-out {{id}} è stato annullato.",
   "columns": {
    "label": "Etichetta",
    "agent": "Agente",
    "status": "Stato",
    "costUsd": "Costo",
    "tokens": "Token",
    "run": "Esecuzione"
   }
  }
 },
 "common": {
  "serverText": {
   "fanOutParentEnded": "L'esecuzione padre è terminata o è stata annullata.",
   "fanOutCostExceeded": "I membri hanno speso {{cost}} USD, oltre il budget di {{budget}} USD.",
   "fanOutTokensExceeded": "I membri hanno usato {{tokens}} token, oltre il budget di {{budget}}.",
   "fanOutTimedOut": "Il tempo limite del gruppo di {{seconds}} secondi è scaduto con {{running}} membri ancora in esecuzione.",
   "fanOutAnySucceeded": "Un membro è riuscito.",
   "fanOutNoneSucceeded": "Tutti i membri sono terminati e nessuno è riuscito.",
   "fanOutQuorumMet": "{{succeeded}} membri sono riusciti, raggiungendo il quorum di {{quorum}}.",
   "fanOutQuorumUnreachable": "Troppi membri non sono riusciti per raggiungere il quorum di {{quorum}}.",
   "fanOutAllFinished": "Tutti i membri sono terminati.",
   "fanOutCancelledByTool": "Annullato dall'esecuzione padre con garrison_cancel_fan_out.",
   "fanOutCancelledBy": "Annullato da {{who}}."
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
})(it, {
 "nav": {
  "items": {
   "apps": {
    "label": "Applicazioni",
    "tip": "Applicazioni agentiche: gruppi di agenti dietro un'unica interfaccia di chat per gli utenti finali, con grafo delle chiamate, delega, revisioni e URL condivisibile."
   }
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "Utenti del tenant",
   "AppUsers": "Utenti dell'applicazione",
   "Anonymous": "Anonimo"
  },
  "resourceType": {
   "AgenticApp": "Applicazione agentica"
  }
 },
 "errorCodes": {
  "AppSlugTaken": "Un'altra applicazione usa già questo slug URL. Gli slug sono unici in tutto il cluster, quindi scegline un altro.",
  "NoPublishedRevision": "Non c'è nessuna revisione pubblicata da usare. Pubblicane prima una.",
  "AgentInUse": "Questo agente è membro di un'applicazione agentica. Rimuovilo prima dall'applicazione."
 },
 "common": {
  "fieldCodes": {
   "InvalidName": "Usa da 1 a 64 lettere minuscole, cifre e trattini, iniziando e finendo con una lettera o una cifra.",
   "InvalidSlug": "Usa da 2 a 63 lettere minuscole, cifre e trattini, iniziando con una lettera o una cifra.",
   "UnknownAgent": "In questo tenant non esiste questo agente.",
   "DuplicateMember": "Ogni agente può essere membro una sola volta.",
   "EntryNotMember": "L'agente di ingresso deve essere uno dei membri.",
   "EdgeNotMember": "Entrambe le estremità di una chiamata devono essere membri dell'applicazione.",
   "SelfEdge": "Un membro non può chiamare se stesso.",
   "AppGraphCycle": "Le chiamate tra i membri formano un ciclo. Rimuovi una delle chiamate nel ciclo.",
   "UnreachableMember": "Ogni membro deve essere raggiungibile dall'agente di ingresso tramite chiamate.",
   "UnreachableMemberNamed": "L'agente di ingresso non può raggiungere questi membri tramite chiamate: {{names}}. Aggiungi una chiamata verso ciascuno o rimuovili.",
   "UnknownEnvironment": "Questo ambiente non esiste nel tenant.",
   "InvalidEntryDeployment": "Scegli una distribuzione dell'agente di ingresso in questo ambiente.",
   "DuplicateEnvironment": "Indica ogni ambiente una sola volta.",
   "InvalidColor": "Usa un colore nel formato #RRGGBB, ad esempio #1F6FEB.",
   "UnknownAsset": "In questo tenant non esiste questo asset dell'agente.",
   "Required": "Questo campo è obbligatorio.",
   "TooMany": "Qui ci sono troppi elementi."
  },
  "serverText": {
   "appNameConflict": "Esiste già un'applicazione chiamata {{name}}.",
   "appSlugTaken": "Lo slug URL {{slug}} è già in uso. Gli slug sono unici in tutto il cluster, quindi scegline un altro.",
   "appNoPublishedRevision": "L'applicazione {{name}} non ha revisioni pubblicate da promuovere.",
   "appMemberNotPublished": "Il membro {{name}} non ha revisioni pubblicate da fissare. Pubblicane prima una.",
   "appRevisionPublished": "La revisione {{number}} dell'applicazione {{name}} è già pubblicata.",
   "appNoTargetDeployments": "Il membro {{member}} non ha distribuzioni nell'ambiente {{environment}}. Creane prima una lì. Non è stato promosso nulla.",
   "agentInApps": "L'agente {{agent}} è membro di {{apps}}. Rimuovilo prima dall'applicazione."
  }
 },
 "components": {
  "form": {
   "pickColor": "Scegli un colore per {{field}}"
  },
  "apps": {
   "graph": {
    "empty": "Aggiungi membri per vedere il grafo dell'applicazione.",
    "summary": "Grafo dell'applicazione con {{members}} membri e {{edges}} chiamate",
    "edgeFanOut": "{{caller}} chiama {{callee}}, anche più volte in parallelo",
    "edgeSingle": "{{caller}} chiama {{callee}}, una chiamata alla volta",
    "entryNode": "{{name}}, l'agente di ingresso",
    "unreachableNode": "{{name}}, che l'agente di ingresso non può raggiungere",
    "entry": "agente di ingresso",
    "unreachable": "non raggiungibile",
    "legendFanOut": "Chiamate in parallelo consentite",
    "legendSingle": "Una chiamata alla volta"
   },
   "share": {
    "noSlug": "Dai all'applicazione un nome o uno slug URL per ottenere il suo link.",
    "open": "Apri",
    "copy": "Copia l'URL dell'applicazione",
    "inactive": "L'applicazione è inattiva, quindi il link non funziona finché non la riattivi.",
    "signIn": {
     "TenantUsers": "Qualsiasi utente attivo di questo tenant può accedere.",
     "AppUsers": "Possono accedere solo gli utenti con il ruolo AppUser su questa applicazione.",
     "Anonymous": "Chiunque abbia il link può usare l'applicazione senza accedere. Anche gli utenti che hanno eseguito l'accesso possono usarla.",
     "AnonymousDisabled": "È scelto Anonimo ma non è attivato, quindi nessuno entra senza accedere e possono accedere solo gli utenti del tenant con accesso."
    }
   },
   "delegation": {
    "title": "Delega dal grafo dell'applicazione",
    "intro": "Le chiamate dell'applicazione sono la sua regola di delega. Ogni membro deve consentire esattamente i membri che chiama, con una profondità massima che copra la catena più lunga sotto di esso. I membri la cui revisione pubblicata dice altro sono disallineati.",
    "apply": "Scrivi bozze",
    "applying": "Scrittura delle bozze...",
    "applied": "Scritte {{drafts}} revisioni in bozza; {{skipped}} membri saltati.",
    "appliedSummary": "Scritte {{drafts}} revisioni in bozza, nessuna pubblicata. {{skipped}} membri sono stati saltati. Controlla e pubblica le bozze nella scheda Revisioni di ogni agente.",
    "drifting_one": "La delega pubblicata di {{count}} membro è diversa dal grafo.",
    "drifting_other": "La delega pubblicata di {{count}} membri è diversa dal grafo.",
    "inSync": "La delega pubblicata di ogni membro corrisponde al grafo.",
    "empty": "Questa applicazione non ha membri.",
    "notPublished": "Non pubblicata",
    "drift": "Disallineata",
    "inSyncBadge": "Allineata",
    "draftConflict": "Conflitto di bozza",
    "draft": "Bozza {{number}}",
    "review": "Le bozze non sono ancora in uso. Apri ogni agente, controlla la bozza nella scheda Revisioni e pubblicala.",
    "columns": {
     "member": "Membro",
     "desiredMode": "Modalità del grafo",
     "desiredAllowList": "Elenco consentiti del grafo",
     "desiredMaxDepth": "Profondità del grafo",
     "publishedMode": "Modalità pubblicata",
     "publishedAllowList": "Elenco consentiti pubblicato",
     "publishedMaxDepth": "Profondità pubblicata",
     "status": "Stato"
    }
   },
   "revisions": {
    "title": "Revisioni dell'applicazione",
    "intro": "Una revisione dell'applicazione fissa l'ultima revisione pubblicata di ogni membro e copia le chiamate tra loro. Pubblicala, poi promuovila per portare tutti i membri insieme all'ambiente successivo.",
    "changeNote": "Nota di modifica",
    "changeNotePlaceholder": "Cosa è cambiato dall'ultima revisione",
    "take": "Crea revisione",
    "taking": "Creazione...",
    "taken": "Creata la revisione {{number}} dell'applicazione.",
    "published": "Pubblicata la revisione {{number}} dell'applicazione.",
    "empty": "Ancora nessuna revisione dell'applicazione. Creane una quando ogni membro ha una revisione pubblicata.",
    "promote": "Promuovi",
    "publish": "Pubblica",
    "publishTitle": "Pubblica la revisione {{number}} dell'applicazione",
    "publishConfirm": "Pubblicare la revisione {{number}} di {{name}}? Una revisione pubblicata non può cambiare e diventa quella usata per impostazione predefinita dalle promozioni.",
    "pin": "{{name}}, revisione {{number}}",
    "columns": {
     "number": "Revisione",
     "state": "Stato",
     "members": "Membri fissati",
     "edges": "Chiamate",
     "author": "Autore",
     "changeNote": "Nota di modifica",
     "publishedUtc": "Pubblicata",
     "actions": "Azioni"
    }
   },
   "promote": {
    "title": "Promuovi l'applicazione",
    "intro": "La revisione fissata di ogni membro va a tutte le distribuzioni di quel membro nell'ambiente di destinazione, in un solo passaggio. Se un membro non ha distribuzioni lì, non si sposta nulla.",
    "revision": "Revisione dell'applicazione",
    "latestRevision": "Ultima pubblicata",
    "promoted": "Applicazione promossa a {{target}}: {{deployments}} distribuzioni aggiornate.",
    "denied": "Non puoi promuovere a {{target}}. Per promuovere serve Eseguire su Promozione per l'ambiente di destinazione."
   }
  }
 },
 "resources": {
  "apps": {
   "title": "Applicazioni",
   "subtitle": "Gruppi di agenti dietro un'unica interfaccia di chat per gli utenti finali. L'agente di ingresso parla con le persone e chiama gli altri membri lungo le chiamate dell'applicazione.",
   "add": "Aggiungi applicazione",
   "create": "Crea applicazione",
   "edit": "Modifica applicazione",
   "view": "Dettagli dell'applicazione",
   "deleteTitle": "Elimina applicazione",
   "emptyTitle": "Ancora nessuna applicazione",
   "emptyBody": "Crea un'applicazione con agenti che hai già: scegli i membri, l'agente di ingresso che parla con le persone e chi chiama chi.",
   "columns": {
    "name": "Nome",
    "url": "URL dell'applicazione",
    "entryAgentId": "Agente di ingresso",
    "members": "Membri",
    "liveEnvironment": "Ambiente in uso",
    "authMode": "Accesso",
    "active": "Stato",
    "description": "Descrizione",
    "id": "ID",
    "lastUpdateUtc": "Aggiornata",
    "createdUtc": "Creata"
   },
   "fields": {
    "name": "Nome",
    "slug": "Slug URL",
    "description": "Descrizione",
    "active": "Attiva",
    "members": "Membri",
    "membersItems": {
     "agentId": "Agente",
     "role": "Ruolo"
    },
    "entryAgentId": "Agente di ingresso",
    "edges": "Chiamate tra membri",
    "edgesItems": {
     "callerAgentId": "Chiamante",
     "calleeAgentId": "Chiamato",
     "fanOutAllowed": "Chiamate in parallelo consentite"
    },
    "graph": "Grafo",
    "environments": "Distribuzione di ingresso per ambiente",
    "environmentsItems": {
     "environment": "Ambiente",
     "deploymentId": "Distribuzione di ingresso"
    },
    "liveEnvironment": "Ambiente in uso",
    "authMode": "Chi può usare l'applicazione",
    "anonymousEnabled": "Consenti l'uso anonimo",
    "showOperatorDetail": "Mostra chiamate a strumenti e ragionamento agli utenti finali",
    "share": "Link condivisibile",
    "displayName": "Nome visualizzato",
    "logoAssetId": "Logo",
    "primaryColor": "Colore principale",
    "accentColor": "Colore di risalto",
    "welcomeText": "Testo di benvenuto"
   },
   "hints": {
    "slug": "L'applicazione si trova in /apps/{slug}/. Lascia vuoto per usare il nome. Gli slug sono unici in tutto il cluster.",
    "members": "Gli agenti dell'applicazione. Il ruolo è una breve nota su cosa fa ciascuno.",
    "entryAgentId": "Il membro che parla con gli utenti finali. Ogni altro membro deve essere raggiungibile da esso.",
    "edges": "Chi può chiamare chi. Le chiamate non devono formare un ciclo e diventano la regola di delega di ogni membro.",
    "environments": "La distribuzione dell'agente di ingresso che l'applicazione usa in ogni ambiente. Se manca, l'applicazione usa lì la prima distribuzione attiva dell'agente di ingresso, in ordine di nome.",
    "liveEnvironment": "L'ambiente con cui parla l'interfaccia dell'applicazione.",
    "anonymousEnabled": "Necessario per l'accesso Anonimo. Le sessioni anonime sono brevi e hanno un limite di frequenza.",
    "showOperatorDetail": "Gli utenti finali vedono sempre risposte, risultati ed errori. Attivalo per mostrare anche chiamate a strumenti, ragionamento e avanzamento.",
    "logoAssetId": "La prima immagine nella versione corrente dell'asset.",
    "welcomeText": "Mostrato agli utenti finali prima che inviino il primo messaggio."
   },
   "steps": {
    "general": "Applicazione",
    "members": "Membri e chiamate",
    "environments": "Ambienti",
    "access": "Accesso e link",
    "branding": "Aspetto e marchio"
   },
   "actions": {
    "delegation": "Delega",
    "revisions": "Revisioni e promozione"
   },
   "errors": {
    "nameTaken": "Un'altra applicazione di questo tenant usa già questo nome."
   },
   "addMember": "Aggiungi membro",
   "addEdge": "Aggiungi chiamata",
   "addEnvironment": "Aggiungi ambiente",
   "chooseAgent": "Scegli un agente",
   "chooseEntry": "Scegli un membro",
   "rolePlaceholder": "Cosa fa questo membro",
   "noEntryDeployment": "Prima distribuzione attiva",
   "noLogo": "Nessun logo",
   "displayNamePlaceholder": "Mostrato nell'intestazione dell'applicazione"
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
})(it, {
 "nav": {
  "items": {
   "studio": {
    "label": "Studio",
    "tip": "Studio degli agenti: progetta agenti e app in bozze con l'architetto di agenti, provali nell'area di prova e chiedi che una bozza venga applicata."
   }
  }
 },
 "enums": {
  "resourceType": {
   "StudioDraft": "Bozza dello studio"
  },
  "approvalKind": {
   "DraftApply": "Applicazione della bozza"
  },
  "studioDraftStatus": {
   "Open": "Aperta",
   "PendingApproval": "In attesa di approvazione",
   "Applied": "Applicata",
   "Discarded": "Scartata"
  },
  "studioDraftOperation": {
   "Upsert": "Crea o aggiorna",
   "Delete": "Elimina"
  },
  "studioDiffChange": {
   "Create": "Crea",
   "Update": "Aggiorna",
   "Delete": "Elimina",
   "Unchanged": "Invariato",
   "Failed": "Non riuscito"
  }
 },
 "errorCodes": {
  "DraftVersionConflict": "La bozza è cambiata da quando l'hai letta. Rileggila e riprova.",
  "DraftNotOpen": "La bozza non è aperta, quindi non può cambiare. Solo una bozza aperta accetta modifiche.",
  "DraftStale": "La configurazione attiva è cambiata dopo che la bozza è partita da essa. Aggiorna gli elementi obsoleti e richiedi di nuovo l'applicazione.",
  "DraftInvalid": "La bozza contiene documenti che non superano la convalida. Correggi prima gli elementi contrassegnati come Non riuscito.",
  "DraftEmpty": "La bozza non contiene elementi, quindi non c'è nulla da applicare.",
  "ApproverLacksPermission": "Non puoi consentire questa bozza: servono Create su Manifest e Delete su ogni tipo che la bozza elimina.",
  "AgentNotLive": "Questo agente è nuovo in questa bozza. Applica la bozza prima di provare l'agente nell'area di prova.",
  "NotAnArchitectDeployment": "Solo le distribuzioni di architetto accettano un prompt di architetto: distribuzioni di agent-architect o con accesso alle bozze.",
  "InvalidArchitectPrompt": "Quel prompt non può essere un prompt di architetto. Scegli un modello System di questo tenant.",
  "PromptTemplateInUse": "Questo modello di prompt è collegato a distribuzioni. Passale prima a un altro modello.",
  "ReservedEnvironment": "L'ambiente bozza è riservato all'area di prova.",
  "NoDeploymentInEnvironment": "L'agente non ha distribuzioni in quell'ambiente."
 },
 "views": {
  "studio": {
   "title": "Studio",
   "subtitle": "Progetta agenti e app in bozze. Nella configurazione attiva non cambia nulla finché una persona non approva l'applicazione di una bozza.",
   "newDraft": "Nuova bozza",
   "refresh": "Aggiorna",
   "search": "Cerca nei titoli",
   "scopeLabel": "Bozze di chi",
   "scopes": {
    "mine": "Mie",
    "all": "Tutte"
   },
   "statusLabel": "Stato",
   "columns": {
    "title": "Titolo",
    "status": "Stato",
    "owner": "Proprietario",
    "targetApp": "App di destinazione",
    "items": "Elementi",
    "version": "Versione",
    "updated": "Aggiornata"
   },
   "open": "Apri",
   "discard": "Scarta",
   "discardTitle": "Scarta bozza",
   "discardMessage": "Scartare {{title}}? Una bozza scartata non può più cambiare né essere applicata.",
   "discardPendingMessage": "Scartare {{title}}? La sua approvazione di applicazione viene annullata e la bozza non può più cambiare né essere applicata.",
   "discarded": "{{title}} scartata.",
   "emptyTitle": "Nessuna bozza",
   "emptyBody": "Inizia una bozza, vuota o da un'app esistente, e progettala con l'architetto di agenti.",
   "emptyFiltered": "Nessuna bozza corrisponde a questi filtri.",
   "untitled": "Bozza senza titolo"
  },
  "studioDraft": {
   "title": "Bozza dello studio",
   "notFoundTitle": "Bozza non trovata",
   "notFoundBody": "La bozza non esiste, oppure non hai il permesso di leggerla.",
   "back": "Tutte le bozze",
   "version": "Versione {{version}}",
   "live": "In diretta",
   "polling": "Interrogazione",
   "architect": "Architetto",
   "tabsLabel": "Area di lavoro della bozza",
   "tabs": {
    "architect": "Architetto",
    "items": "Elementi",
    "graph": "Grafo",
    "apply": "Confronta e applica",
    "playground": "Area di prova",
    "preview": "Anteprima di compilazione",
    "prompts": "Prompt dell'architetto"
   },
   "notOpen": {
    "PendingApproval": "Questa bozza attende una decisione sulla sua applicazione, quindi non può cambiare. Rifiuta l'approvazione o scarta la bozza per modificarla di nuovo.",
    "Applied": "Questa bozza è stata applicata alla configurazione attiva e non può più cambiare. Inizia una nuova bozza per altre modifiche.",
    "Discarded": "Questa bozza è stata scartata e non può più cambiare.",
    "other": "Questa bozza non può cambiare in questo momento."
   },
   "liveNotice": "La bozza è passata alla versione {{version}} ({{status}}).",
   "liveChanged": "Modificati: {{items}}.",
   "removedTag": "rimosso",
   "dismissNotice": "Chiudi"
  }
 },
 "components": {
  "studio": {
   "newDraft": {
    "title": "Nuova bozza",
    "intro": "Una bozza contiene i documenti manifest che modificate tu e l'architetto di agenti. Inizia vuota o da un'app esistente con tutto ciò a cui fa riferimento.",
    "titleField": "Titolo",
    "titlePlaceholder": "App di ricerca con uno scrittore",
    "fromApp": "Parti da un'app",
    "emptyDraft": "Bozza vuota",
    "fromAppHint": "L'app, i suoi membri, le loro distribuzioni, i prompt e gli asset diventano elementi. Ognuno ricorda la versione attiva da cui è partito, così lo studio nota le modifiche successive.",
    "create": "Crea bozza",
    "creating": "Creazione...",
    "created": "Bozza {{title}} avviata."
   },
   "architect": {
    "title": "Nuovo architetto",
    "intro": "L'architetto di agenti progetta agenti e app nelle tue bozze. Assegnagli una distribuzione: un profilo harness, un modello e il prompt con cui lavora. Modifica solo le tue bozze e non le applica mai.",
    "name": "Nome della distribuzione",
    "harnessProfile": "Profilo harness",
    "chooseProfile": "Scegli un profilo harness",
    "model": "Modello",
    "modelHint": "Lascia vuoto per usare il modello predefinito del profilo harness.",
    "prompt": "Prompt dell'architetto",
    "defaultPrompt": "{{name}} (predefinito)",
    "preview": "Anteprima del prompt",
    "previewEmpty": "Scegli un prompt per vederlo renderizzato.",
    "cloneLink": "Clona questo prompt per modificarlo",
    "noAgent": "Questo tenant non ha un agente chiamato {{name}}, quindi non è possibile creare un architetto. Rivolgiti a un amministratore.",
    "create": "Crea architetto",
    "creating": "Creazione...",
    "created": "Architetto {{name}} creato."
   },
   "chat": {
    "title": "Architetto",
    "architect": "Distribuzione dell'architetto",
    "chooseArchitect": "Scegli un architetto",
    "newArchitect": "Nuovo architetto",
    "noArchitect": "Non esiste ancora una distribuzione di architetto. Creane una per progettare con l'architetto di agenti.",
    "openConversation": "Apri conversazione",
    "newConversation": "Nuova conversazione",
    "you": "Tu",
    "architectSays": "Architetto",
    "openRun": "Esecuzione",
    "thinking": "Al lavoro...",
    "empty": "Di' all'architetto cosa costruire. Il primo messaggio gli indica in quale bozza lavorare.",
    "pickFirst": "Scegli o crea un architetto per iniziare.",
    "message": "Messaggio",
    "placeholder": "Progetta un'app di ricerca: un pianificatore che distribuisce il lavoro a due ricercatori e uno scrittore.",
    "firstHint": "Avvia una conversazione con questo architetto su questa bozza.",
    "continueHint": "Continua la conversazione. Ctrl+Enter o Cmd+Enter invia.",
    "send": "Invia"
   },
   "items": {
    "title": "Elementi",
    "titleCount": "Elementi ({{total}})",
    "add": "Aggiungi elemento",
    "addConfirm": "Apri editor",
    "columns": {
     "kind": "Tipo",
     "name": "Nome",
     "operation": "Operazione",
     "stale": "Obsoleto",
     "updated": "Aggiornato"
    },
    "stale": "Obsoleto",
    "empty": "Ancora nessun elemento. Aggiungine uno o chiedi all'architetto.",
    "remove": "Rimuovi",
    "removeTitle": "Rimuovi elemento",
    "removeMessage": "Rimuovere {{item}} dalla bozza? La configurazione attiva non cambia.",
    "removed": "{{item}} rimosso.",
    "saved": "{{item}} salvato. La bozza è alla versione {{version}}.",
    "editorTitle": "Modifica {{item}}",
    "newEditorTitle": "Nuovo elemento {{item}}",
    "document": "Documento manifest",
    "versionHint": "Il salvataggio invia la versione {{version}}, quella che hai letto. Se nel frattempo la bozza è cambiata, il salvataggio viene rifiutato e il tuo testo resta qui.",
    "unsaved": "Modifiche non salvate",
    "errors": {
     "name": "Usa lettere, cifre, punti, barre e trattini, iniziando con una lettera o una cifra.",
     "exists": "La bozza contiene già {{kind}}/{{name}}.",
     "deleteKind": "Si possono eliminare solo elementi Agent, Deployment, Pipeline e AgenticApp, non {{kind}}."
    },
    "conflict": {
     "title": "La bozza è cambiata mentre la modificavi: la versione {{from}} ora è {{to}}.",
     "added": "Aggiunti: {{items}}",
     "updated": "Modificati: {{items}}",
     "removed": "Rimossi: {{items}}",
     "status": "Il suo stato ora è {{status}}.",
     "layout": "È cambiato solo il layout del suo grafo.",
     "mine": "Anche l'elemento che stai modificando è cambiato. Confronta il tuo testo con la nuova versione prima di salvare di nuovo.",
     "retry": "Il tuo testo è ancora nell'editor. Salva di nuovo per applicarlo alla nuova versione.",
     "dismiss": "Chiudi"
    }
   },
   "graph": {
    "title": "Grafo",
    "empty": "La bozza non contiene ancora app o agenti da disegnare.",
    "depth": "profondità {{depth}}",
    "entryAgent": "Agente di ingresso: {{name}}",
    "deleted": "Eliminato",
    "inDraft": "Nella bozza",
    "loose": "Agenti senza app",
    "capabilities": "Capacità: {{list}}",
    "legend": "Ogni chiamata riporta la profondità di delega che richiede. Una linea continua consente chiamate parallele, una tratteggiata una chiamata alla volta. Le capacità compaiono sotto il nome di un agente."
   },
   "diff": {
    "title": "Confronta e applica",
    "refresh": "Aggiorna confronto",
    "validate": "Convalida",
    "validating": "Convalida in corso...",
    "requestApply": "Richiedi applicazione",
    "requesting": "Richiesta in corso...",
    "requested": "Applicazione richiesta. Decide una persona autorizzata ad applicare manifest.",
    "valid": "Valida: {{create}} da creare, {{update}} da aggiornare, {{delete}} da eliminare, {{unchanged}} invariati.",
    "invalid": "Non valida: {{failed}} non riusciti e {{stale}} obsoleti. Previsti: {{create}} da creare, {{update}} da aggiornare, {{delete}} da eliminare, {{unchanged}} invariati.",
    "validOk": "La bozza è valida.",
    "validFailed": "La bozza non è valida. Vedi gli elementi contrassegnati come Non riuscito od Obsoleto.",
    "empty": "La bozza non contiene elementi da confrontare.",
    "columns": {
     "item": "Elemento",
     "change": "Modifica",
     "details": "Dettagli"
    },
    "none": "(nessuno)",
    "approval": "Approvazione di applicazione",
    "allow": "Consenti",
    "deny": "Rifiuta",
    "allowed": "Consentita. La bozza è in fase di applicazione.",
    "denied": "Rifiutata. La bozza è di nuovo aperta.",
    "reason": "Motivo",
    "reasonPlaceholder": "Facoltativo, conservato con la decisione",
    "waiting": "In attesa di una persona autorizzata a decidere le approvazioni e ad applicare manifest.",
    "applied": "Applicata come applicazione di manifest {{id}}."
   },
   "playground": {
    "title": "Area di prova",
    "intro": "Ogni turno salva il documento dell'agente nella bozza come sua revisione bozza e lo esegue su una distribuzione temporanea dell'area di prova. Non viene pubblicato nulla e la configurazione attiva non cambia.",
    "agent": "Agente",
    "defaultAgent": "Agente di ingresso ({{name}})",
    "defaultAgentShort": "Agente di ingresso",
    "input": "Input",
    "answer": "Risposta",
    "placeholder": "Cosa deve fare l'agente?",
    "firstHint": "Avvia una conversazione nell'area di prova.",
    "continueHint": "Continua la conversazione nell'area di prova.",
    "send": "Esegui turno",
    "turn": "Turno {{number}}, {{agent}}",
    "openRun": "Dettaglio esecuzione",
    "conversation": "Conversazione",
    "export": "Scarica trascrizione",
    "reset": "Nuova conversazione",
    "empty": "Ancora nessun turno.",
    "exportDraft": "Bozza",
    "exportTurn": "Turno",
    "exportRun": "Esecuzione"
   },
   "preview": {
    "title": "Anteprima di compilazione",
    "intro": "Guarda con cosa partirebbe un'esecuzione prima di distribuire: la riga di comando, dove vengono collocati gli asset e il montaggio dello spazio file. I valori segreti vengono oscurati.",
    "deployment": "Distribuzione",
    "chooseDeployment": "Scegli una distribuzione",
    "revision": "Revisione dell'agente",
    "deploymentRevision": "La revisione propria della distribuzione",
    "revisionOption": "Revisione {{number}} ({{state}})",
    "environment": "Ambiente",
    "deploymentEnvironment": "L'ambiente della distribuzione",
    "input": "Input di esempio",
    "compiled": "{{deployment}} compilata con {{revision}}.",
    "assets": "Asset collocati ({{total}})",
    "noAssets": "La revisione non colloca alcun asset.",
    "columns": {
     "path": "Percorso",
     "asset": "Asset",
     "kind": "Tipo",
     "version": "Versione",
     "size": "Dimensione"
    },
    "fileSpace": "Spazio file",
    "fileSpaceMount": "Montato su {{path}} con {{files}} file al momento (al massimo {{maxFiles}} file fino a {{maxBytes}} ciascuno).",
    "noFileSpace": "Nessuno spazio file è montato, perché l'esecuzione non farebbe parte di una conversazione.",
    "redacted": "Il server oscura i valori segreti nella riga di comando, nell'ambiente e nei file."
   },
   "prompts": {
    "title": "Prompt dell'architetto",
    "templatesLink": "Apri in Modelli di prompt",
    "forArchitect": "Prompt che l'architetto di agenti può usare. Selezionane uno per {{architect}}.",
    "noArchitect": "Prompt che l'architetto di agenti può usare. Scegli un architetto nella scheda Architetto per assegnargliene uno.",
    "nextTurn": "Una nuova selezione o una modifica salvata ha effetto dal turno successivo dell'architetto.",
    "current": "{{architect}} usa {{name}} e ne segue la versione attuale ({{version}}).",
    "currentPinned": "{{architect}} usa {{name}}, fissato alla versione {{version}}.",
    "inUse": "{{name}} non può essere eliminato finché lo usano delle distribuzioni: {{deployments}}. Seleziona prima un altro prompt per loro.",
    "empty": "Nessun prompt di architetto.",
    "columns": {
     "name": "Nome",
     "description": "Descrizione",
     "version": "Versione",
     "usedBy": "Usato da"
    },
    "default": "Predefinito",
    "selectedBadge": "Selezionato",
    "usedBy": "Architetti: {{total}}",
    "select": "Seleziona",
    "selected": "{{architect}} usa {{name}} dal suo prossimo turno.",
    "saved": "{{name}} salvato come nuova versione.",
    "editorTitle": "Modifica {{name}} (versione {{version}})",
    "name": "Nome",
    "description": "Descrizione",
    "body": "Corpo del prompt",
    "preview": "Anteprima renderizzata",
    "deleteMessage": "Eliminare {{name}}? Distribuzioni di architetto che lo usano: {{total}}. Un prompt in uso non può essere eliminato."
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
})(it, {
 "components": {
  "studio": {
   "canvas": {
    "title": "Area di disegno",
    "appPicker": "Applicazione",
    "flowLabel": "Area di disegno dell'app {{app}}",
    "noApp": "La bozza non contiene ancora un'app. Chiedine una all'architetto, oppure inizia una bozza da un'app esistente.",
    "calls": "Chiamate ({{total}})",
    "noCalls": "Ancora nessuna chiamata. Trascina dal bordo destro di un agente a un altro agente, oppure premi C su un agente e Invio sull'altro.",
    "addLoose": "Aggiungi all'app",
    "remove": "Rimuovi dall'app",
    "removeTitle": "Rimuovi agente dall'app",
    "removeMessage": "Rimuovere {{name}} da {{app}}? Vengono rimosse anche le sue chiamate. L'agente resta, e la configurazione attiva non cambia finché la bozza non viene applicata.",
    "operationFailed": "{{operation}}: operazione rifiutata.",
    "operations": {
     "AddMember": "Aggiunta di un agente",
     "RemoveMember": "Rimozione di un agente",
     "Connect": "Collegamento",
     "Disconnect": "Scollegamento",
     "SetEntry": "Impostazione dell'agente di ingresso",
     "MoveNode": "Spostamento di un agente"
    },
    "toolbar": {
     "label": "Azioni dell'area di disegno",
     "addAgent": "Aggiungi agente",
     "addPlaceholder": "Nome dell'agente",
     "role": "Ruolo",
     "rolePlaceholder": "Ruolo (facoltativo)",
     "add": "Aggiungi",
     "connect": "Collega da",
     "setEntry": "Rendi agente di ingresso",
     "remove": "Rimuovi",
     "disconnect": "Scollega",
     "fit": "Adatta la vista"
    },
    "connectBar": {
     "message": "Collegamento da {{name}}. Scegli l'agente che chiama: fai clic su di esso, premi Invio su di esso o sceglilo qui.",
     "to": "Chiama",
     "fanOut": "Chiamate in parallelo",
     "confirm": "Collega"
    },
    "keys": {
     "title": "Scorciatoie da tastiera",
     "tab": "Tab scorre gli agenti in ordine di lettura, a partire dall'agente di ingresso.",
     "select": "Invio o Spazio seleziona l'agente con il focus e ne apre le proprietà.",
     "connect": "C su un agente avvia una chiamata da esso; C o Invio su un altro agente la completa.",
     "entry": "E rende l'agente con il focus l'agente di ingresso.",
     "remove": "Canc rimuove dall'app l'agente con il focus, dopo una conferma.",
     "move": "I tasti freccia spostano l'agente selezionato; tieni premuto Maiusc per passi più ampi. La posizione viene salvata dopo una breve pausa.",
     "add": "N porta al campo Aggiungi agente.",
     "calls": "Nell'elenco delle chiamate, Invio seleziona una chiamata, Canc la scollega e F attiva o disattiva le chiamate in parallelo.",
     "escape": "Esc annulla una chiamata che hai iniziato."
    },
    "node": {
     "entry": "Ingresso",
     "unreachable": "Non raggiungibile",
     "connecting": "Chiamata da qui"
    },
    "a11y": {
     "node": "Premi Invio o Spazio per selezionare questo agente, poi i tasti freccia per spostarlo. Premi C per collegarlo, E per renderlo l'agente di ingresso o Canc per rimuoverlo.",
     "edge": "Una chiamata tra due agenti. Selezionala nell'elenco delle chiamate sotto l'area di disegno.",
     "handle": "Punto di collegamento",
     "moved": "Agente spostato {{direction}}. Nuova posizione: {{x}}, {{y}}.",
     "directions": {
      "up": "in alto",
      "down": "in basso",
      "left": "a sinistra",
      "right": "a destra"
     }
    },
    "announce": {
     "added": "{{name}} aggiunto a {{app}}.",
     "connectStart": "Collegamento da {{name}}. Spostati sull'agente che chiama e premi Invio, oppure premi Esc per annullare.",
     "connectCancelled": "Collegamento annullato.",
     "connected": "Ora {{from}} chiama {{to}}.",
     "disconnected": "{{from}} non chiama più {{to}}.",
     "fanOutOn": "Ora {{from}} può chiamare {{to}} in parallelo.",
     "fanOutOff": "Ora {{from}} chiama {{to}} una chiamata alla volta.",
     "entry": "Ora {{name}} è l'agente di ingresso di {{app}}.",
     "removed": "{{name}} rimosso da {{app}}.",
     "selfEdge": "Un agente non può chiamare se stesso. Scegli un altro agente."
    },
    "summary": {
     "noApp": "Non c'è nessuna app da descrivere.",
     "agents_one": "L'app {{app}} ha {{count}} agente.",
     "agents_other": "L'app {{app}} ha {{count}} agenti.",
     "callCount_one": "Tra loro c'è {{count}} chiamata.",
     "callCount_other": "Tra loro ci sono {{count}} chiamate.",
     "entry": "L'agente di ingresso è {{name}}.",
     "noEntry": "Nessun agente di ingresso impostato.",
     "callParallel": "{{from}} chiama {{to}}, chiamate in parallelo consentite, profondità di delega {{depth}}.",
     "callSingle": "{{from}} chiama {{to}}, una chiamata alla volta, profondità di delega {{depth}}."
    },
    "conflict": {
     "mine": "Anche {{item}} è cambiato. La tua modifica è ancora nel pannello; confrontala con la nuova versione prima di salvare di nuovo.",
     "kept": "La tua modifica di {{item}} è ancora nel pannello. Salva di nuovo per applicarla alla nuova versione.",
     "operation": "{{operation}}: operazione non applicata. Riprova sulla nuova versione, oppure lascia perdere.",
     "retry": "Riprova"
    },
    "panel": {
     "label": "Proprietà",
     "tabsLabel": "Proprietà di {{name}}",
     "properties": "Agente",
     "runtime": "Esecuzione",
     "save": "Salva nella bozza",
     "reset": "Annulla modifiche",
     "saved": "{{item}} salvato. Confronta e applica mostra la modifica.",
     "check": "Controllo del server su questo elemento: {{message}}",
     "unparsable": "Lo YAML dell'elemento non si analizza, quindi il pannello non può modificarlo. Correggilo prima nella scheda Elementi. ({{message}})"
    },
    "agent": {
     "title": "Agente {{name}}",
     "isEntry": "Questo è l'agente di ingresso dell'app: parla con le persone che usano l'app.",
     "notHeld": "La bozza non contiene ancora il documento di {{name}}. Portalo nella bozza per modificarlo qui; la configurazione attiva non cambia.",
     "deleted": "La bozza elimina {{name}}. Ripristinalo nella scheda Elementi per modificarlo.",
     "bring": "Porta nella bozza",
     "description": "Descrizione",
     "inputSchema": "Schema di input",
     "outputSchema": "Schema di output",
     "schemaHint": "Un JSON Schema scritto in JSON. Lascia vuoto per testo semplice.",
     "assets": "Asset",
     "noAssets": "La prossima revisione non fissa alcun asset.",
     "assetsKept": "Il documento non nomina asset, quindi l'agente mantiene quelli che ha.",
     "assetName": "Nome dell'asset",
     "assetVersion": "Versione",
     "latest": "Più recente",
     "removeAsset": "Rimuovi l'asset {{name}}",
     "addAsset": "Aggiungi asset",
     "capabilities": "Capacità",
     "capabilitiesHint": "Separa i nomi con virgole. Un elenco vuoto li cancella.",
     "capabilitiesKept": "Separa i nomi con virgole. Se lasci vuoto, l'agente mantiene le capacità che ha.",
     "systemPrompt": "Prompt di sistema",
     "noDeployments": "La bozza non contiene distribuzioni di questo agente, quindi qui non è impostato alcun prompt di sistema.",
     "promptLine": "{{environment}}: {{deployment}} usa {{prompt}}",
     "builtInPrompt": "il prompt predefinito integrato",
     "showRuntime": "Modifica nella scheda Esecuzione",
     "errors": {
      "json": "Questo non è JSON valido.",
      "object": "Uno schema è un oggetto JSON, ad esempio {\"type\": \"object\"}.",
      "version": "Usa un numero intero, oppure lascia vuoto per la versione più recente."
     }
    },
    "edge": {
     "title": "Chiamata da {{from}} a {{to}}",
     "from": "Chiamante",
     "to": "Chiamato",
     "depth": "Profondità di delega",
     "depthHint": "Ricavata dal grafo: uno più la catena di chiamate più lunga sotto {{to}}. Cambia quando cambiano le chiamate sottostanti.",
     "fanOut": "Chiamate in parallelo (fan-out)",
     "fanOutOn": "{{from}} può avviare più chiamate a {{to}} contemporaneamente.",
     "fanOutOff": "{{from}} chiama {{to}} una chiamata alla volta."
    },
    "app": {
     "title": "Applicazione {{name}}",
     "hint": "Seleziona un agente o una chiamata nell'area di disegno per modificarli. Se non è selezionato nulla, questo pannello modifica l'app.",
     "entry": "Agente di ingresso",
     "noEntry": "Nessun agente di ingresso",
     "noMembers": "Aggiungi prima un agente; il primo diventa l'agente di ingresso.",
     "notHeld": "La bozza non contiene ancora il documento di {{name}}. Portalo nella bozza per modificarne qui l'accesso e l'aspetto.",
     "deleted": "La bozza elimina {{name}}. Ripristinala nella scheda Elementi per modificarla.",
     "bring": "Porta nella bozza",
     "description": "Descrizione",
     "authMode": "Accesso",
     "authDefault": "Predefinito del server",
     "anonymous": "Consenti l'uso anonimo",
     "branding": "Aspetto",
     "brandingFields": {
      "displayName": "Nome visualizzato",
      "logo": "Asset del logo",
      "primaryColor": "Colore principale",
      "accentColor": "Colore di accento",
      "welcomeText": "Testo di benvenuto"
     },
     "errors": {
      "color": "Usa un colore esadecimale, ad esempio #1F6FEB."
     }
    },
    "runtime": {
     "title": "Esecuzione di {{name}}",
     "none": "La bozza non contiene distribuzioni di {{name}}. Portane una attiva qui sotto, oppure chiedila all'architetto.",
     "deployment": "Ambiente e distribuzione",
     "option": "{{environment}}: {{name}}",
     "scope": "Le modifiche cambiano solo {{name}} in {{environment}} (profilo harness {{profile}}). Gli altri ambienti mantengono i propri valori.",
     "fields": {
      "model": "Modello",
      "effort": "Livello di impegno",
      "timeoutSeconds": "Tempo massimo (secondi)",
      "maxTurns": "Numero massimo di turni",
      "maxBudgetUsd": "Budget massimo (USD)",
      "systemTemplate": "Modello del prompt di sistema",
      "systemVersion": "Versione fissata",
      "approvalsEnabled": "Chiedi l'approvazione delle chiamate a strumenti",
      "approvalDefaultAction": "Quando nessuna regola corrisponde"
     },
     "hints": {
      "timeoutSeconds": "Secondi interi, 1 o più. Se vuoto si usa il limite del profilo harness.",
      "maxTurns": "Numero intero, 1 o più. Se vuoto decide l'harness.",
      "maxBudgetUsd": "0 o più, ad esempio 2.50. Se vuoto non c'è budget."
     },
     "builtIn": "Predefinito integrato",
     "approvals": "Approvazioni",
     "noRules": "Nessuna regola. Ogni chiamata a strumento riceve l'azione predefinita.",
     "rule": {
      "action": "Azione",
      "pattern": "Pattern dello strumento",
      "inputPattern": "Pattern sull'input",
      "inputPlaceholder": "Pattern sull'input (facoltativo)",
      "remove": "Rimuovi la regola {{number}}",
      "add": "Aggiungi regola"
     },
     "live": "Distribuzioni attive non presenti nella bozza",
     "noLive": "Ogni distribuzione attiva di questo agente è già nella bozza, oppure non ne ha.",
     "bring": "Porta nella bozza",
     "exportMissing": "L'esportazione di {{name}} è tornata senza il suo documento.",
     "errors": {
      "integer": "Usa un numero intero pari o superiore a 1.",
      "number": "Usa un numero pari o superiore a 0.",
      "pattern": "Una regola richiede un pattern dello strumento.",
      "version": "Usa un numero intero e indica un modello da fissare."
     }
    }
   }
  }
 },
 "common": {
  "fieldCodes": {
   "NotAMember": "Quell'agente non è membro dell'app.",
   "SelfEdge": "Un agente non può chiamare se stesso.",
   "NoSuchEdge": "L'app non ha questa chiamata.",
   "AppDeleted": "La bozza elimina questa app. Ripristinala prima.",
   "InvalidDocument": "Il documento non si analizza come un unico documento manifest.",
   "DocumentMismatch": "Il tipo o il nome del documento non corrisponde all'elemento."
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
})(it, {
 "common": {
  "productName": "Garrison Agent Studio",
  "productLine": "Agent Studio",
  "states": {
   "studioHint": "Oppure apri lo Studio degli agenti e descrivi ciò che ti serve: l'architetto di agenti lo prepara perché tu lo riveda.",
   "openStudio": "Apri lo Studio degli agenti"
  }
 },
 "nav": {
  "items": {
   "studio": {
    "label": "Studio degli agenti"
   },
   "serverInfo": {
    "label": "Informazioni",
    "tip": "Prodotto, versioni, link, endpoint e la tua identità"
   }
  }
 },
 "wizard": {
  "steps": {
   "studio": "Studio degli agenti"
  },
  "welcomeItemStudio": "Dare all'architetto di agenti un harness e un modello, così progetta con te agenti e app nello Studio degli agenti (facoltativo).",
  "studioBody": "L'architetto di agenti progetta con te agenti e app nello Studio degli agenti. Scegli il profilo harness e il modello con cui viene eseguito e il prompt dell'architetto che lo guida. La sua distribuzione può modificare solo le tue bozze dello studio. Puoi saltare questo passaggio e creare un architetto in seguito dallo studio.",
  "createArchitect": "Crea l'architetto",
  "architectCreated": "Architetto di agenti {{name}} creato.",
  "architectReady": "L'architetto di agenti {{name}} è pronto. Dopo la configurazione, apri lo Studio degli agenti e inizia una bozza con lui.",
  "continue": "Continua"
 },
 "views": {
  "home": {
   "getStartedBody": "La configurazione guidata aggiunge una credenziale, dà all'architetto di agenti un harness e un modello, applica un agente di esempio ed esegue un test. Oppure apri lo Studio degli agenti e descrivi l'app che vuoi.",
   "openStudio": "Apri lo Studio degli agenti"
  },
  "studio": {
   "title": "Studio degli agenti"
  },
  "studioDraft": {
   "tabs": {
    "release": "Rilascio"
   }
  },
  "serverInfo": {
   "title": "Informazioni",
   "subtitle": "Versioni, link, endpoint e l'identità con cui hai effettuato l'accesso.",
   "positioning": "Crea, distribuisci ed esegui app agentiche con gli harness di agenti che usi già.",
   "versions": "Versione del server {{server}}, versione della dashboard {{dashboard}}",
   "docs": "Documentazione",
   "studioDocs": "Guida allo Studio degli agenti",
   "website": "Sito web",
   "source": "Codice sorgente"
  }
 },
 "resources": {
  "apps": {
   "actions": {
    "environments": "Ambienti"
   }
  }
 },
 "components": {
  "apps": {
   "release": {
    "title": "Ambienti e promozione",
    "intro": "Le distribuzioni di ogni membro per ambiente, con la revisione che ciascuna fissa e le sostituzioni dell'ambiente. Confronta due ambienti prima di promuovere e ripristina una promozione dalla cronologia.",
    "live": "Attiva in {{environment}}",
    "environments": "Ambienti",
    "source": "Confronta",
    "target": "con",
    "member": "Membro",
    "entry": "Ingresso",
    "noDeployment": "Nessuna distribuzione",
    "secretOverride": "{{name}} (segreto)",
    "difference": "Da {{source}} a {{target}}",
    "differenceNone": "Differenza",
    "diff": {
     "Same": "Uguale",
     "Missing": "Nessuna distribuzione in {{target}}",
     "revisions": "Le revisioni sono diverse",
     "overrides": "Le sostituzioni sono diverse",
     "both": "Revisioni e sostituzioni sono diverse"
    },
    "promote": "Promuovi da {{source}} a {{target}}",
    "promoteNothing": "Promuovi",
    "missing": "Nessuna distribuzione in {{target}}: {{names}}. Promuovere ora fallirebbe senza spostare nulla; aggiungi prima una distribuzione lì.",
    "history": "Cronologia delle promozioni",
    "historyEmpty": "Questa app non è ancora stata promossa."
   }
  },
  "studio": {
   "release": {
    "title": "Rilascio",
    "app": "Applicazione",
    "noAppsTitle": "Questa bozza non crea nessuna app",
    "noAppsBody": "Aggiungi un'app alla bozza, nella scheda Grafo o chiedendolo all'architetto, per promuoverla da qui una volta applicata.",
    "notLiveTitle": "{{name}} non è ancora attiva",
    "notLiveBody": "Applica prima la bozza. L'applicazione pubblica i suoi agenti e li distribuisce in dev; poi puoi promuovere l'app da qui."
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
})(it, {
 "nav": {
  "items": {
   "architects": {
    "label": "Architetti",
    "tip": "Architetti di agenti: distribuzioni riutilizzabili dell'architetto di agenti che progettano con te agenti e applicazioni in qualsiasi bozza dello studio."
   }
  }
 },
 "resources": {
  "architects": {
   "title": "Architetti",
   "subtitle": "Gli architetti di agenti di questo tenant. Ognuno è una distribuzione di agent-architect con il proprio profilo harness, modello e prompt, e qualsiasi bozza dello studio può usarlo.",
   "add": "Aggiungi architetto",
   "create": "Crea architetto",
   "edit": "Modifica architetto",
   "view": "Dettagli dell'architetto",
   "deleteTitle": "Elimina architetto",
   "emptyTitle": "Ancora nessun architetto",
   "emptyBody": "Crea un architetto per progettare con te agenti e applicazioni in Agent Studio. Scegli il profilo harness e il modello su cui viene eseguito, e il prompt con cui lavora.",
   "columns": {
    "name": "Nome",
    "harnessProfileId": "Profilo harness",
    "model": "Modello",
    "architectPromptTemplateId": "Prompt dell'architetto",
    "active": "Stato",
    "description": "Descrizione",
    "id": "ID",
    "lastUpdateUtc": "Aggiornato",
    "createdUtc": "Creato"
   },
   "fields": {
    "name": "Nome",
    "description": "Descrizione",
    "harnessProfileId": "Profilo harness",
    "model": "Modello",
    "architectPromptTemplateId": "Prompt dell'architetto",
    "architectPromptVersion": "Versione del prompt fissata",
    "active": "Attivo"
   },
   "hints": {
    "model": "Lascia vuoto per usare il modello predefinito del profilo harness.",
    "architectPromptVersion": "Lascia vuoto per usare sempre la versione corrente del prompt."
   },
   "actions": {
    "prompts": "Prompt dell'architetto",
    "deployment": "Impostazioni della distribuzione"
   },
   "errors": {
    "nameTaken": "Un'altra distribuzione di questo tenant usa già questo nome.",
    "version": "Inserisci un numero intero a partire da 1, oppure lascia vuoto."
   },
   "promptPinned": "{{name}} (versione {{version}})",
   "defaultModel": "Predefinito del profilo",
   "defaultBadge": "Predefinito",
   "promptsTitle": "Prompt dell'architetto per {{name}}"
  }
 },
 "components": {
  "studio": {
   "chat": {
    "manageArchitects": "Gestisci architetti"
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
})(it, {
 "components": {
  "confirm": {
   "typeToConfirm": "Digita '{{word}}' nella casella qui sotto per confermare."
  }
 },
 "views": {
  "agentDetail": {
   "deleted": "Agente {{name}} eliminato."
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
})(it, {
 "components": {
  "studio": {
   "architect": {
    "credential": "Credenziale",
    "noCredential": "Nessuna",
    "credentialOption": "{{name}} ({{kind}})"
   },
   "chat": {
    "notCredentialedTitle": "L'architetto non è riuscito ad accedere al suo fornitore di modelli",
    "notCredentialedBody": "Autenticazione non riuscita per {{architect}}. Controlla la credenziale della connessione salvata; l’errore di esecuzione riportato sotto spiega la causa.",
    "noCredentialTitle": "Questo architetto non ha una credenziale",
    "noCredentialBody": "{{architect}} viene eseguito su {{profile}}, che ha bisogno di un segreto per accedere. Senza, i suoi turni falliscono con Not logged in. Scegli una credenziale nella pagina Architetti.",
    "fixCredential": "Correggi la credenziale dell'architetto",
    "openSecrets": "Apri segreti"
   }
  }
 },
 "resources": {
  "architects": {
   "columns": {
    "credentialSecretId": "Credenziale"
   },
   "fields": {
    "credentialSecretId": "Credenziale"
   },
   "noCredential": "Nessuna"
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
})(it, {
 "components": {
  "dependencyHint": {
   "refresh": "Aggiorna elenco"
  },
  "architectHints": {
   "harness": "I profili integrati (Claude Code, Codex e altri) sono pronti all'uso.",
   "harnessLink": "Apri Configurazione > Profili harness",
   "credentialNotNeeded": "{{profile}} non ha bisogno di credenziali.",
   "credentialLink": "Apri Configurazione > Segreti",
   "prompt": "Una modifica vale dal turno successivo dell'architetto.",
   "promptLink": "Apri Configurazione > Modelli di prompt",
   "credentialNoProfile": "Il segreto con cui accede l'harness.",
   "credentialChosen": "Il segreto con cui accede {{profile}}.",
   "credentialPick": "{{profile}} accede con un segreto di tipo {{kinds}}. Scegline uno, altrimenti ogni turno fallisce con Not logged in.",
   "credentialAdd": "{{profile}} accede con un segreto di tipo {{kinds}} e questo tenant non ne ha ancora. Aggiungine uno in Configurazione > Segreti, poi sceglilo qui. Senza, ogni turno fallisce con Not logged in."
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
})(it, {
 "components": {
  "studio": {
   "architect": {
    "intro": "L'architetto di agenti progetta agenti e applicazioni nelle tue bozze. Dagli un profilo harness, il segreto con cui accede, un modello e il prompt con cui lavora. Modifica solo le tue bozze e non le applica mai."
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
})(it, {
 "wizard": {
  "studioBody": "L'architetto di agenti progetta con te agenti e applicazioni in Agent Studio. Scegli il profilo harness e il modello su cui viene eseguito, la credenziale con cui accede (se adatto all'harness, viene scelto il segreto salvato nel passaggio precedente) e il prompt dell'architetto che lo guida. La sua distribuzione può modificare solo le tue bozze dello studio. Puoi saltare questo passaggio e creare un architetto più tardi in Agenti > Architetti."
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
})(it, {
 "components": {
  "secretGuide": {
   "title": "Come ottenere il valore per {{kind}}",
   "AnthropicApiKey": {
    "s1": "Accedi alla Anthropic Console e apri Settings > API keys:",
    "s2": "Scegli Create Key, dalle un nome come garrison e copia la chiave. Inizia con sk-ant-api ed è mostrata una sola volta.",
    "s3": "Incollala in Valore. Claude Code, opencode, pi, Mux e l'harness API del fornitore la ricevono come ANTHROPIC_API_KEY."
   },
   "ClaudeCodeOAuthToken": {
    "s1": "Su qualsiasi computer, installa Claude Code se non c'è ancora:",
    "s2": "Esegui questo comando e accedi, nella finestra del browser che si apre, con l'account Claude il cui abbonamento Pro o Max devono usare gli agenti:",
    "s3": "Copia il token mostrato. Inizia con sk-ant-oat e dura un anno; imposta Scadenza a quella data così Garrison mostra quando scade.",
    "s4": "Incollalo in Valore. Claude Code lo riceve come CLAUDE_CODE_OAUTH_TOKEN.",
    "note": "Un token di abbonamento usa il piano di una persona, e usarlo per servire altre persone può violare i termini di Anthropic. Usa una chiave API Anthropic per tutto ciò che è condiviso."
   },
   "OpenAiApiKey": {
    "s1": "Accedi alla OpenAI Platform e apri API keys:",
    "s2": "Scegli Create new secret key, seleziona il progetto la cui fatturazione paga le esecuzioni e copia la chiave. Inizia con sk- ed è mostrata una sola volta.",
    "s3": "Incollala in Valore. Codex, opencode, pi, Mux e l'harness API del fornitore la ricevono come OPENAI_API_KEY."
   },
   "CodexAuthJson": {
    "s1": "Installa la CLI di Codex se non c'è ancora:",
    "s2": "Accedi con il tuo account ChatGPT in una nuova directory Codex vuota, così questo accesso appartiene solo a Garrison:",
    "s3": "Valida il file nello stesso terminale. Continua solo se compare Valid JSON:",
    "copy": "Su macOS, copia il file direttamente negli appunti con il comando seguente, quindi incollalo in Valore. Su altri sistemi, apri auth.json in un editor di testo e copia tutto il file. Non copiare l’output del terminale con righe spezzate o il prompt.",
    "s4": "Dopo aver salvato correttamente il segreto, elimina la cartella e non usare questo accesso altrove. Da questo momento Garrison lo rinnova:",
    "note": "Due copie dello stesso accesso condividono un token di aggiornamento, e quella che aggiorna per seconda rompe l'altra. Usare un piano ChatGPT personale per servire altre persone può violare i termini di OpenAI; una chiave API OpenAI è più semplice per le distribuzioni condivise."
   },
   "GeminiApiKey": {
    "s1": "Apri Google AI Studio e accedi con l'account Google che deve pagare:",
    "s2": "Scegli Create API key, seleziona o crea un progetto Google Cloud e copia la chiave. Inizia con AIza.",
    "s3": "Incollala in Valore. Gemini CLI e pi la ricevono come GEMINI_API_KEY, opencode come GOOGLE_GENERATIVE_AI_API_KEY."
   },
   "GenericEnv": {
    "s1": "Incolla un singolo valore: un token, una password o un URL che un harness o uno strumento legge da una variabile d'ambiente.",
    "s2": "Associa il segreto a una distribuzione con un alias, poi aggiungi una sostituzione d'ambiente che lo usa, per esempio:",
    "s3": "La variabile deve essere nell'elenco delle credenziali consentite del profilo harness, altrimenti la distribuzione viene rifiutata."
   },
   "GenericFile": {
    "s1": "Incolla l'intero file, a capo compresi: un JSON di account di servizio, un certificato o un file di configurazione.",
    "s2": "Associa il segreto a una distribuzione con un alias e aggiungi una sostituzione di file il cui contenuto è il segreto, per esempio:"
   },
   "BearerToken": {
    "s1": "Incolla solo il token, senza la parola Bearer.",
    "s2": "Gli agenti remoti lo usano come segreto di credenziale, e i modelli di spazio di lavoro lo usano per clonare un repository privato (come password dell'utente x-access-token). Un server MCP può inviarlo in un'intestazione scritta come {{secret.<alias>}}."
   },
   "BasicAuth": {
    "s1": "Incolla nome utente e password in questa forma:",
    "s2": "Associa il segreto a una distribuzione con un alias e usalo in un modello come {{secret.<alias>}}."
   },
   "GitCredential": {
    "s1": "Per GitHub, crea un token di accesso personale granulare con accesso in lettura a Contents sui repository da clonare:",
    "s2": "Incolla solo il token; Garrison lo invia come password dell'utente x-access-token. Per GitLab, Bitbucket o un altro host, incolla invece username:token.",
    "s3": "Scegli questo segreto come credenziale Git del modello di spazio di lavoro che clona il repository."
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
})(it, {
 "components": {
  "studio": {
   "chat": {
    "wait": {
     "worker": "In attesa di un worker che avvii questo turno...",
     "phrases": {
      "p1": "Leggo la tua bozza...",
      "p2": "Ci sto ragionando...",
      "p3": "Abbozzo gli agenti...",
      "p4": "Decido chi chiama chi...",
      "p5": "Controllo le convenzioni di Garrison...",
      "p6": "Scelgo le capacità giuste...",
      "p7": "Scrivo i manifest...",
      "p8": "Valuto alcune soluzioni...",
      "p9": "Preparo le distribuzioni...",
      "p10": "Rivedo i prompt...",
      "p11": "Disegno il grafo dell'applicazione...",
      "p12": "Cerco una forma più semplice...",
      "p13": "Ricontrollo i dettagli...",
      "p14": "Metto insieme i pezzi...",
      "p15": "Quasi fatto...",
      "p16": "Ci sto ancora lavorando..."
     }
    },
    "thinkingSummary": "Ragionamento",
    "metrics": {
     "model": "Modello",
     "timeToFirstTokenMs": "TTFT",
     "streamingMs": "Streaming",
     "totalMs": "Totale",
     "inputTokens": "Input",
     "outputTokens": "Output",
     "cachedTokens": "In cache",
     "reasoningTokens": "Ragionamento",
     "outputTokensPerSecond": "Token/s",
     "toolCallCount": "Strumenti",
     "costUsd": "Costo"
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
})(it, {
 "components": {
  "studio": {
   "chat": {
    "metrics": {
     "title": "Dettagli del turno"
    },
    "tool": {
     "running": "in corso",
     "ok": "fatto",
     "failed": "non riuscito",
     "input": "Argomenti",
     "output": "Risultato",
     "none": "Nessuno",
     "waiting": "In attesa del risultato..."
    },
    "refs": {
     "apr": "Apri approvazione",
     "run": "Apri esecuzione",
     "cnv": "Apri conversazione",
     "agt": "Apri agente",
     "sdr": "Apri bozza",
     "plr": "Apri esecuzione pipeline",
     "tpl": "Apri modello di prompt"
    },
    "keysHint": "Invio invia. Ctrl+Invio o Maiusc+Invio aggiunge una nuova riga.",
    "disclaimer": "L'IA può sbagliare. Controlla tutte le risposte.",
    "continueHint": "Continua la conversazione."
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
})(it, {
 "nav": {
  "items": {
   "agentWizard": {
    "label": "Procedura guidata agenti",
    "tip": "Un percorso guidato dalla descrizione di ciò che ti serve fino ad agenti approvati in esecuzione in dev: accesso al modello, progettazione con l'architetto di agenti, verifica, approvazione e una prima conversazione."
   }
  }
 },
 "resources": {
  "agents": {
   "wizard": "Procedura guidata agenti"
  }
 },
 "common": {
  "states": {
   "studioHint": "Oppure apri la procedura guidata agenti e descrivi ciò che ti serve: ti accompagna nella creazione, approvazione e prova degli agenti.",
   "openStudio": "Apri la procedura guidata agenti"
  }
 },
 "views": {
  "home": {
   "openStudio": "Apri la procedura guidata agenti"
  },
  "studioDraft": {
   "back": "Torna alla procedura guidata"
  },
  "agentWizard": {
   "title": "Procedura guidata agenti",
   "subtitle": "Descrivi ciò che ti serve. La procedura guidata ti porta da lì ad agenti approvati in esecuzione in dev.",
   "subtitleDraft": "In costruzione: {{title}}",
   "advanced": "Avanzate",
   "stepsLabel": "Passaggi della procedura guidata",
   "back": "Indietro",
   "working": "Elaborazione...",
   "steps": {
    "goal": "Obiettivo",
    "access": "Accesso al modello",
    "design": "Progettazione",
    "review": "Verifica",
    "approve": "Approvazione",
    "test": "Prova"
   },
   "goal": {
    "title": "Cosa devono fare i tuoi agenti?",
    "intro": "Dai un nome al progetto e descrivi il lavoro con parole semplici. L'architetto di agenti lo legge e progetta un agente o un team di agenti.",
    "name": "Nome del progetto",
    "namePlaceholder": "Assistente di ricerca",
    "nameHint": "Un nome breve che riconoscerai in seguito. Non potrai cambiarlo dopo questo passaggio.",
    "goal": "Cosa devono fare gli agenti",
    "goalPlaceholder": "Cercare un argomento sul web, riassumere i risultati con le fonti e scrivere un breve report.",
    "goalHint": "Indica chi lo usa, cosa entra e cosa deve uscire. L'architetto chiede tutto ciò che deve sapere.",
    "next": "Inizia",
    "resume": "Oppure continua una delle tue bozze",
    "allDrafts": "Tutte le bozze"
   },
   "access": {
    "title": "Accesso al modello",
    "intro": "Scegli l'harness su cui girano i tuoi agenti e la credenziale con cui accede. L'architetto di agenti usa lo stesso harness e la stessa credenziale mentre progetta con te.",
    "harness": "Profilo harness",
    "harnessHint": "La CLI che esegue gli agenti, per esempio Claude Code o Codex.",
    "model": "Modello",
    "modelHint": "Facoltativo. Lascia vuoto per usare il modello predefinito dell'harness.",
    "credential": "Credenziale",
    "noCredentialNeeded": "{{profile}} non richiede una credenziale.",
    "credentialIntro": "{{profile}} accede con un segreto di tipo {{kinds}}. Scegline uno salvato oppure aggiungine uno ora.",
    "noFittingSecret": "Non hai ancora un segreto salvato di tipo {{kinds}}. Aggiungine uno qui sotto; i passaggi per ottenere il valore sono indicati accanto.",
    "addSecret": "Aggiungi una credenziale",
    "saveSecret": "Salva la credenziale",
    "architectDescription": "Architetto di agenti configurato dalla procedura guidata agenti.",
    "next": "Continua alla progettazione"
   },
   "design": {
    "title": "Progetta con l'architetto",
    "intro": "Chatta con l'architetto di agenti. Chiede ciò che deve sapere e crea gli agenti nella tua bozza mentre parlate. Il pannello a destra mostra il contenuto della bozza.",
    "contents": "Nella bozza",
    "empty": "Ancora niente. L'architetto aggiunge qui gli agenti man mano che li progetta.",
    "agents": "Agenti",
    "firstMessage": "Voglio creare questo: {{goal}}\n\nGli agenti gireranno sul profilo harness {{profile}} con il segreto della credenziale {{secret}}. Chiedimi tutto ciò che ti serve sapere, poi progetta gli agenti in questa bozza.",
    "chatTitle": "Chat con {{architect}}",
    "next": "Continua alla verifica"
   },
   "review": {
    "title": "Verifica",
    "intro": "La procedura guidata controlla ogni elemento della bozza rispetto alla configurazione attiva. Ciò che fallirebbe torna all'architetto per la correzione.",
    "status": {
     "PendingApproval": "Questa bozza è in attesa di approvazione. Continua al passaggio successivo.",
     "Applied": "Questa bozza è applicata. Continua al passaggio successivo.",
     "Discarded": "Questa bozza è stata scartata. Iniziane una nuova dal primo passaggio."
    },
    "kind": "Tipo",
    "name": "Nome",
    "change": "Modifica",
    "note": "Nota",
    "problems_one": "{{count}} elemento non verrebbe applicato.",
    "problems_other": "{{count}} elementi non verrebbero applicati.",
    "askFix": "Chiedi all'architetto di correggere",
    "valid": "Tutto nella bozza è a posto. Continua per approvarla.",
    "validate": "Controlla di nuovo",
    "fixMessage": "La bozza non è ancora valida. Correggi questi problemi:\n{{problems}}",
    "next": "Continua all'approvazione"
   },
   "approve": {
    "title": "Approva",
    "intro": "L'approvazione applica la bozza e rende attivi gli agenti. Poi la procedura guidata dà a ogni agente una distribuzione dev, così puoi provarlo subito.",
    "reason": "Approvato nella procedura guidata agenti.",
    "summary": "La bozza contiene {{total}} elementi, tra cui {{agents}} agenti. Gireranno su {{profile}} con la credenziale {{secret}}.",
    "will1": "Tutti gli elementi della bozza vengono creati o aggiornati insieme. Se uno fallisce, non cambia nulla.",
    "will2": "Ogni agente riceve una distribuzione dev sull'harness scelto, con la credenziale associata.",
    "will3": "Se non hai il permesso di approvare, la richiesta attende qualcuno che ce l'ha, e questa pagina prosegue quando decide.",
    "approve": "Approva e pubblica",
    "waiting": "In attesa della decisione di qualcuno con diritti di approvazione. Questa pagina prosegue da sola quando decide.",
    "openApproval": "Apri l'approvazione",
    "retry": "Riprova",
    "done": "Approvato e pubblicato. Ogni agente ha una distribuzione dev pronta all'uso.",
    "agent": "Agente IA",
    "deployment": "Distribuzione dev",
    "what": "Cosa ha fatto la procedura guidata",
    "actions": {
     "create": "Distribuzione creata",
     "bind": "Credenziale associata",
     "ready": "Già pronto"
    },
    "next": "Continua alla prova"
   },
   "test": {
    "title": "Prova",
    "intro": "Parla con il tuo nuovo agente in dev. Quando ti soddisfa, aprilo per promuoverlo o condividerlo.",
    "talkingTo": "Conversazione con {{name}}.",
    "empty": "Invia un messaggio per iniziare una conversazione.",
    "message": "Messaggio",
    "next": "Prossimi passi",
    "openAgent": "Apri {{name}}",
    "openApp": "Apri l'app {{name}}",
    "openInvoke": "Apri in Invoke",
    "another": "Creane altri"
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
})(it, {
 "views": {
  "agentWizard": {
   "test": {
    "openApp": "Apri la chat di {{name}}"
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
})(it, {
 "resources": {
  "apps": {
   "fields": {
    "backgroundColor": "Sfondo della pagina",
    "headerColor": "Colore dell'intestazione",
    "agentBubbleColor": "Colore dei messaggi dell'agente",
    "fontFamily": "Carattere",
    "faviconAssetId": "Icona della scheda"
   },
   "hints": {
    "displayName": "Mostrato nell'intestazione della chat e sui messaggi dell'agente. Qualsiasi carattere, fino a 128. Il nome sopra è solo l'identificativo.",
    "faviconAssetId": "Una risorsa immagine. Lascia vuoto per usare il logo.",
    "primaryColor": "Pulsanti e i tuoi messaggi.",
    "accentColor": "Evidenziazioni, contorni di focus e la conversazione selezionata.",
    "backgroundColor": "La pagina dietro la conversazione.",
    "headerColor": "La barra in alto con nome e logo.",
    "agentBubbleColor": "I messaggi dell'agente. Il colore del testo è scelto per il contrasto."
   },
   "faviconFromLogo": "Come il logo",
   "defaultColor": "Predefinito {{color}}"
  }
 },
 "enums": {
  "appFont": {
   "System": "Di sistema",
   "Sans": "Senza grazie",
   "Serif": "Con grazie",
   "Rounded": "Arrotondato",
   "Mono": "A spaziatura fissa"
  }
 },
 "components": {
  "form": {
   "defaultColor": "Predefinito"
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
})(it, {
 "resources": {
  "apps": {
   "fields": {
    "conversationListColor": "Colore della lista conversazioni",
    "composerColor": "Colore dell'area di scrittura",
    "filesColor": "Colore della lista file"
   },
   "hints": {
    "conversationListColor": "La lista delle conversazioni sul lato.",
    "composerColor": "L'area sotto la conversazione dove scrivi.",
    "filesColor": "La lista dei file scritti dall'agente."
   }
  }
 }
});

// Wizard draft picker and credential-optional Mux endpoints.
Object.assign(it.views.agentWizard.goal, {
  "updated": "Aggiornato il {{date}}",
  "continue": "Riprendi"
});
Object.assign(it.views.agentWizard.access, {
  "muxEndpoint": "URL endpoint Mux",
  "muxAdapter": "Adattatore dell’endpoint",
  "muxOptionalCredential": "Credenziale (facoltativa)",
  "muxHint": "Mux può usare un endpoint senza una chiave API del provider. Inserisci un URL raggiungibile dal worker. Scegli una credenziale solo se l’endpoint richiede autenticazione.",
  "needEndpoint": "Inserisci un URL endpoint Mux valido con HTTP o HTTPS."
});
Object.assign(it.views.agentWizard.design, {
  "firstMessageMux": "Voglio creare questo: {{goal}}\n\nUsa Mux con endpoint {{endpoint}}, adattatore {{adapter}} e modello {{model}}. Una chiave API serve solo se l’endpoint richiede autenticazione. Fammi le domande necessarie, poi progetta gli agenti in questa bozza."
});
Object.assign(it.views.agentWizard.approve.actions, {"configure": "Endpoint configurato"});

// Harness-specific wizard configuration.
Object.assign(it.views.agentWizard.access, {
  "muxEndpoint": "Nome endpoint Mux",
  "muxHint": "Inserisci il nome dell’endpoint configurato in Mux sui worker di esecuzione, ad esempio local. Mux fornisce URL, adattatore, modello e autenticazione.",
  "needEndpoint": "Inserisci un nome endpoint Mux configurato, non un URL.",
  "providerModelHint": "Usa l’identificatore del modello della CLI, di solito provider/model. L’autenticazione dipende dal provider; la credenziale salvata è facoltativa.",
  "optionalCredentialIntro": "{{profile}} supporta segreti salvati di tipo {{kinds}}. Scegline uno se il provider lo richiede, oppure continua senza una credenziale salvata.",
  "providerEndpoint": "URL endpoint API del provider",
  "providerEndpointHint": "Questo harness chiama direttamente un’API HTTP compatibile con OpenAI. Inserisci URL di base e modello.",
  "providerAnonymous": "L’endpoint del provider non richiede autenticazione",
  "needProviderEndpoint": "Inserisci un URL HTTP o HTTPS valido senza credenziali, parametri di query o frammento."
});
Object.assign(it.views.agentWizard.design, {
  "firstMessageMux": "Voglio creare questo: {{goal}}\n\nUsa l’endpoint Mux configurato chiamato {{endpoint}}. Modello e autenticazione provengono da Mux. Fammi le domande necessarie, poi progetta gli agenti in questa bozza."
});
Object.assign(it.views.agentWizard.access, {"intro": "Scegli l’harness e le sue impostazioni di connessione. L’architetto degli agenti usa la stessa configurazione durante la progettazione."});

// Typed inference protocol and authentication editor.
Object.assign(it, {
  "inference": {
    "modelHint": "Scegli un modello disponibile su questo endpoint.",
    "title": "Endpoint di inferenza",
    "protocol": "Protocollo API",
    "baseUrl": "URL di base",
    "authentication": "Tipo di autenticazione",
    "name": "Nome intestazione / parametro",
    "location": "Posizione della credenziale",
    "header": "Intestazione",
    "query": "Stringa di query",
    "secret": "Segreto della credenziale",
    "addValue": "Aggiungi valore della credenziale",
    "username": "Segreto del nome utente",
    "password": "Segreto della password",
    "hint": "Scegli protocollo e autenticazione separatamente. Ollama Cloud usa autenticazione bearer; Ollama locale di solito non ne richiede. I valori vengono salvati come segreti cifrati.",
    "invalid": "Inserisci un URL valido e seleziona tutti i nomi e segreti richiesti.",
    "value": "Valore della credenziale",
    "auth": {
      "None": "Nessuna",
      "BearerToken": "Token bearer",
      "ApiKey": "Chiave API",
      "Headers": "Valori delle intestazioni",
      "QueryString": "Parametri di query",
      "Basic": "Autenticazione di base"
    }
  }
});

// Shared runtime connections and the configuration navigation split.
it.runtime = {
  "title": "Harness ed endpoint",
  "connections": "Connessioni salvate",
  "templates": "Modelli harness avanzati",
  "connection": "Connessione",
  "architect": "Architetto",
  "choose": "Scegli un architetto o una connessione",
  "harness": "Modello harness",
  "chooseHarness": "Scegli un modello harness",
  "manage": "Gestisci harness ed endpoint",
  "configureFirst": "Configura prima una connessione salvata.",
  "sharedHint": "Configura qui una sola volta. Architetti e deployment usano questa connessione; le modifiche valgono dalla prossima esecuzione.",
  "reuseHint": "Usa un architetto esistente o crea un architetto da una connessione salvata. Non occorre reinserire credenziali o dettagli endpoint.",
  "importExport": "Importa / Esporta"
};
it.nav.hubs.configuration = {"label": "Risorse degli agenti", "tip": "Connessioni per agenti e architetti."};
it.nav.hubs.platformConfiguration = {"label": "Configurazione della piattaforma", "tip": "Credenziali, archiviazione, prezzi, quote e notifiche."};
it.nav.items.harnessProfiles.label = "Harness ed endpoint";
it.views.agentWizard.access.intro = "Usa un architetto esistente o crea un architetto da una connessione salvata. Non occorre reinserire credenziali o dettagli endpoint.";

it.resources.harnessProfiles.title = it.runtime.title;
it.resources.harnessProfiles.subtitle = it.runtime.sharedHint;
it.components.architectHints.harness = it.runtime.sharedHint;
it.components.architectHints.harnessLink = it.runtime.manage;

Object.assign(it.runtime, {"add": "Aggiungi connessione", "create": "Crea connessione", "edit": "Modifica connessione", "view": "Dettagli connessione"});

it.explainers.harnessProfiles.p2 = it.runtime.sharedHint;
it.explainers.secrets.p2 = it.runtime.sharedHint;

// One connection registry; configuration sections use a menu.
Object.assign(it.runtime, {"title": "Connessioni", "sharedHint": "Harness ed endpoint API riutilizzabili. Configura una volta, poi seleziona la connessione per gli agenti.", "harness": "Tipo di connessione", "chooseHarness": "Scegli un harness o tipo di API", "customHarness": "Harness personalizzato", "advancedLaunch": "Impostazioni di avvio avanzate", "advancedArchitect": "Opzioni architetto (facoltative)", "pickConnection": "Scegli una connessione. Modello, endpoint e credenziali sono già configurati."});
it.nav.hubs.connections = {"label": "Connessioni", "tip": "Harness ed endpoint API riutilizzabili. Configura una volta, poi seleziona la connessione per gli agenti."};
it.nav.hubs.configuration = {"label": "Configurazione", "tip": "Gestisci prompt, risorse, server strumenti, credenziali, archiviazione e criteri."};
it.nav.items.harnessProfiles.label = "Connessioni";
it.resources.harnessProfiles.title = "Connessioni";
it.components.studio.architect.harnessProfile = it.runtime.connection;

Object.assign(it.runtime, {"emptyTitle": "Nessuna connessione ancora", "apiType": "API HTTP (Ollama / compatibile OpenAI)"});

it.nav.items.manifests.label = it.runtime.importExport;

it.runtime.manage = "Gestisci connessioni";
it.components.architectHints.harnessLink = it.runtime.manage;
it.explainers.secrets.p2 = "Le connessioni usano questi segreti per autenticarsi. Aggiorna il valore qui senza riconfigurare ogni architetto o deployment.";

it.runtime.launchDefaults = "Questa connessione usa la configurazione di avvio esistente. Modificala nelle impostazioni avanzate se necessario.";

// One horizontal workspace navigation level; the wizard selects connections only.
it.nav.hubs.operations = {"label": "Operazioni", "tip": "Gestisci risultati archiviati, prezzi dei modelli, limiti di utilizzo e notifiche."};
it.nav.hubs.configuration.tip = "Prompt, risorse, strumenti, credenziali e spazi di lavoro per gli agenti.";
it.nav.hubs.manifests = { label: it.runtime.importExport, tip: it.tips.nav.tabs.manifests };
it.runtime.choose = "Seleziona una connessione";
it.runtime.reuseHint = "Scegli la connessione per progettare ed eseguire gli agenti. La procedura prepara automaticamente l’assistente di progettazione.";
it.views.agentWizard.access.intro = it.runtime.reuseHint;

it.views.manifests.title = it.runtime.importExport;

it.views.agentWizard.design.intro = "Rispondi alle domande dell’architetto per progettare il tuo agente.";

it.views.studio.deleteMultiple = "Elimina più bozze";
it.views.studio.deleteMultipleMessage = "Eliminare definitivamente le {{count}} bozze selezionate? Le approvazioni in sospeso saranno annullate. Gli agenti e le distribuzioni pubblicati non saranno modificati.";

it.views.studio.discard = it.common.actions.delete;
it.views.studio.discardTitle = "Elimina bozza";
it.views.studio.discardMessage = "Eliminare definitivamente {{title}}? Gli agenti e le distribuzioni pubblicati non saranno modificati.";
it.views.studio.discardPendingMessage = "Eliminare definitivamente {{title}}? La sua approvazione in sospeso sarà annullata. Gli agenti e le distribuzioni pubblicati non saranno modificati.";
it.views.studio.discarded = "{{title}} eliminato.";

it.components.studio.chat.resize = "Ridimensiona chat";
it.components.studio.chat.resizeHint = "Trascina per ridimensionare. Usa le frecce su o giù per regolare l’altezza oppure Home per ripristinarla.";

// Secret reveal (Admin on Secret, audited as SecretRevealed).
it.components.secretReveal = { title: "Mostra il valore del segreto", warning: "La visualizzazione mostra il valore memorizzato in chiaro. Ogni visualizzazione viene registrata nel registro di audit con il tuo nome. Chiudi questa finestra quando hai finito; il valore non viene conservato.", value: "Valore", reveal: "Mostra", hide: "Nascondi" };
it.tips.secretReveal = { reveal: "Decifra e mostra il valore memorizzato. Il server scrive un record di audit SecretRevealed.", hide: "Nascondi di nuovo il valore. Mostrarlo ancora scrive un altro record di audit.", close: "Chiudi la finestra e scarta il valore mostrato.", value: "Il valore decifrato, esattamente come è memorizzato. Trattalo come una password.", copy: "Copia il valore negli appunti." };
it.resources.secrets.actions.reveal = "Mostra";
it.tips.resources.secrets.actions.reveal = "Mostra il valore memorizzato in chiaro. Richiede Admin su Secret (SecretManager o TenantAdmin) e viene registrato nel registro di audit.";
it.tips.resources.secrets.revealNoValue = "Questo segreto non ha ancora un valore memorizzato. Usa prima Imposta valore.";
it.enums.auditEventType.SecretRevealed = "Segreto mostrato";
it.tips.enums.auditEventType.SecretRevealed = "Qualcuno con Admin su Secret ha letto il valore decifrato di un segreto.";
it.resources.secrets.subtitle = "Credenziali cifrate per harness e integrazioni. I gestori dei segreti possono mostrare i valori; ogni visualizzazione è sottoposta ad audit.";
it.tips.nav.tabs.secrets = "Chiavi API e token cifrati. I deployment li associano tramite alias; solo i gestori dei segreti possono mostrare i valori, e ogni visualizzazione è sottoposta ad audit.";
it.tips.resources.secrets.add = "Memorizza una nuova credenziale, come una chiave API o un token, cifrata a riposo. I deployment la referenziano tramite alias; dopo il salvataggio, solo chi ha Admin su Secret può mostrarla.";
it.tips.resources.secrets.value = "Il valore del segreto. Viene cifrato al salvataggio. Chi ha Admin su Secret può mostrarlo, e ogni visualizzazione è sottoposta ad audit.";
it.explainers.secrets.p1 = "Un segreto è un valore cifrato, come una chiave API o un token. Dopo il salvataggio puoi sostituirlo o ruotarlo. Rileggerlo è consentito solo a chi ha Admin su Secret (i ruoli SecretManager e TenantAdmin), e ogni visualizzazione viene registrata nel registro di audit.";

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
})(it, {
 "nav": {
  "hubs": {
   "autonomy": {
    "label": "Autonomia",
    "tip": "Agenti che continuano a lavorare da soli: i custodi si svegliano secondo una pianificazione e si occupano di un incarico permanente."
   }
  },
  "items": {
   "keepers": {
    "label": "Custodi",
    "tip": "Agenti che si svegliano secondo una pianificazione per occuparsi di un incarico permanente"
   }
  }
 },
 "enums": {
  "runKind": {
   "Keeper": "Ciclo del custode"
  },
  "resourceType": {
   "Mandate": "Custode (mandato)"
  },
  "mandateStatus": {
   "Draft": "Bozza",
   "Active": "Attivo",
   "Paused": "In pausa",
   "Frozen": "Congelato",
   "CapReached": "Budget raggiunto",
   "Retired": "Ritirato"
  },
  "mandateRevisionState": {
   "Draft": "Bozza",
   "Published": "Pubblicata"
  },
  "mandateRevisionSource": {
   "Human": "Persona",
   "Board": "Consiglio",
   "Executive": "Direzione",
   "Architect": "Architetto degli agenti"
  },
  "wakeMode": {
   "Fixed": "Intervallo fisso",
   "Backoff": "Dilata se calmo"
  },
  "wakeSource": {
   "Timer": "Pianificazione",
   "Manual": "Svegliato a mano",
   "Message": "Messaggio",
   "EscalationAnswer": "Escalation risolta",
   "Webhook": "Webhook",
   "Report": "Rapporto"
  },
  "tickOutcome": {
   "Quiet": "Calmo",
   "Acted": "Intervenuto",
   "Attention": "Richiede attenzione",
   "Escalated": "Escalato",
   "Failed": "Non riuscito",
   "Skipped": "Saltato",
   "Unreported": "Non riportato"
  }
 },
 "errorCodes": {
  "MandateActive": "Un ciclo di questo custode è in corso. Attendi che finisca, metti in pausa il custode oppure eliminalo comunque, il che annulla l'esecuzione del ciclo.",
  "MandateNotActive": "Solo un custode attivo può essere svegliato o messo in pausa.",
  "MandateNotPaused": "Solo un custode in pausa può essere ripreso.",
  "RemoteAgentUnsupported": "I custodi vengono eseguiti su distribuzioni ospitate, quindi un agente remoto non può essere un custode.",
  "DeploymentInactive": "Questa distribuzione è inattiva. Scegli una distribuzione attiva.",
  "DeploymentAgentMismatch": "Questa distribuzione appartiene a un altro agente. Scegli una delle distribuzioni di questo agente.",
  "RevisionMismatch": "Questa revisione appartiene a un altro custode."
 },
 "resources": {
  "runs": {
   "columns": {
    "mandateId": "Custode"
   }
  },
  "keepers": {
   "title": "Custodi",
   "subtitle": "Agenti che si svegliano secondo una pianificazione per occuparsi di un incarico permanente e riferiscono ogni volta che cosa hanno trovato.",
   "add": "Aggiungi custode",
   "create": "Crea custode",
   "edit": "Modifica custode",
   "view": "Dettagli del custode",
   "deleteTitle": "Elimina custode",
   "emptyTitle": "Ancora nessun custode",
   "emptyBody": "Crea un custode perché un agente controlli qualcosa con regolarità, come una coda, una dashboard o una casella di posta, e agisca o chieda aiuto quando serve.",
   "columns": {
    "name": "Nome",
    "status": "Stato",
    "agent": "Agente",
    "deployment": "Distribuzione",
    "nextWakeUtc": "Prossimo risveglio",
    "currentIntervalSeconds": "Intervallo",
    "lastTick": "Ultimo ciclo",
    "tickCount": "Cicli",
    "currentRevisionNumber": "Revisione",
    "runAs": "Eseguito come",
    "description": "Descrizione",
    "id": "ID",
    "createdUtc": "Creato"
   },
   "fields": {
    "name": "Nome",
    "description": "Descrizione",
    "agentId": "Agente",
    "deploymentId": "Distribuzione",
    "objective": "Obiettivo",
    "healthyDefinition": "Come appare uno stato sano",
    "autonomy": "Che cosa può fare da solo",
    "escalationPolicy": "Quando chiedere aiuto",
    "direction": "Indirizzo attuale",
    "signals": "Segnali da osservare",
    "signalsItems": {
     "name": "Segnale",
     "description": "Che cosa significa"
    },
    "wakeMode": "Modalità di risveglio",
    "minIntervalSeconds": "Intervallo minimo (secondi)",
    "maxIntervalSeconds": "Intervallo massimo (secondi)",
    "backoffFactor": "Fattore di dilatazione",
    "jitterPercent": "Jitter (percentuale)",
    "budgetPerTickUsd": "Budget per ciclo (USD)",
    "budgetPerDayUsd": "Budget al giorno (USD)",
    "maxTokensPerTick": "Massimo di token per ciclo",
    "changeNote": "Nota di modifica"
   },
   "hints": {
    "name": "Lettere minuscole, cifre e trattini.",
    "agentId": "Un agente ospitato. L'agente non può cambiare dopo la creazione del custode.",
    "deploymentId": "La distribuzione attiva su cui viene eseguito ogni ciclo.",
    "objective": "L'incarico permanente, in parole semplici. Il custode lo legge a ogni ciclo.",
    "minIntervalSeconds": "Da {{min}} a {{max}} secondi. L'impostazione del cluster Autonomy.MinIntervalSeconds può alzarlo.",
    "maxIntervalSeconds": "Da {{min}} a {{max}} secondi. La dilatazione smette di crescere qui.",
    "backoffFactor": "Da {{min}} a {{max}}. Dopo ogni ciclo calmo l'intervallo viene moltiplicato per questo valore.",
    "jitterPercent": "Da {{min}} a {{max}}. Se vuoto usa il valore predefinito del cluster.",
    "budgetPerTickUsd": "Vuoto significa nessun limite.",
    "budgetPerDayUsd": "Vuoto significa nessun limite.",
    "maxTokensPerTick": "Token di input più token di output. Vuoto significa nessun limite.",
    "changeNote": "Perché questa revisione modifica il custode. Mostrata nell'elenco delle revisioni."
   },
   "sections": {
    "mandate": "Mandato",
    "schedule": "Pianificazione dei risvegli",
    "budgets": "Budget"
   },
   "sectionHints": {
    "mandate": "Il salvataggio pubblica questi campi come revisione 1 e avvia la pianificazione dei risvegli. Le modifiche successive passano da Nuova revisione nella pagina del custode.",
    "budgets": "Salvati ora e applicati in una versione futura."
   },
   "errors": {
    "name": "Usa da 1 a 64 lettere minuscole, cifre e trattini, iniziando e finendo con una lettera o una cifra.",
    "nameTaken": "Un altro custode usa già questo nome.",
    "text": "Limitato a {{max}} caratteri.",
    "agentRequired": "Scegli l'agente che si occupa di questo mandato.",
    "deploymentRequired": "Scegli la distribuzione su cui vengono eseguiti i suoi cicli.",
    "objective": "Descrivi l'incarico permanente.",
    "signalsMax": "Una revisione ha al massimo {{max}} segnali.",
    "signalName": "I nomi dei segnali hanno da 1 a {{max}} caratteri.",
    "signalUnique": "Ogni segnale ha bisogno di un nome diverso.",
    "signalsInvalid": "Correggi i segnali contrassegnati qui sotto.",
    "interval": "Inserisci secondi interi da {{min}} a {{max}}.",
    "maxBelowMin": "L'intervallo massimo non può essere più breve del minimo.",
    "backoffFactor": "Inserisci un numero da {{min}} a {{max}}.",
    "jitterPercent": "Inserisci un numero intero da {{min}} a {{max}}.",
    "budget": "Inserisci un importo da {{min}} a {{max}}.",
    "maxTokens": "Inserisci un numero intero da {{min}} a {{max}}."
   },
   "actions": {
    "pause": "Metti in pausa",
    "resume": "Riprendi",
    "wake": "Sveglia ora",
    "runs": "Vedi esecuzioni"
   },
   "toasts": {
    "pause": "{{name}} messo in pausa.",
    "resume": "{{name}} ripreso. Si sveglia ora.",
    "wake": "{{name}} si sveglia ora."
   },
   "units": {
    "seconds_one": "{{count}} secondo",
    "seconds_other": "{{count}} secondi",
    "minutes_one": "{{count}} min",
    "minutes_other": "{{count}} min",
    "hours_one": "{{count}} ora",
    "hours_other": "{{count}} ore",
    "days_one": "{{count}} giorno",
    "days_other": "{{count}} giorni"
   },
   "ticking": "Ciclo in corso",
   "neverTicked": "Non ancora svegliato",
   "addSignal": "Aggiungi segnale",
   "signalNamePlaceholder": "lunghezza della coda",
   "editNotice": "Eseguito come {{name}}. Salvando, diventi il principal con cui vengono eseguiti i suoi cicli. Per cambiare l'obiettivo o la pianificazione, apri il custode e usa Nuova revisione."
  }
 },
 "components": {
  "keeperRevision": {
   "title": "Nuova revisione di {{name}}",
   "intro": "Questa diventa la revisione {{number}}. Pubblicandola diventa subito quella corrente: la dilatazione si azzera e il custode si sveglia ora.",
   "draft": "Salva come bozza",
   "publish": "Pubblica",
   "drafted": "Revisione {{number}} salvata come bozza.",
   "published": "Revisione {{number}} pubblicata."
  }
 },
 "views": {
  "runDetail": {
   "keeper": "Custode"
  },
  "home": {
   "autonomy": {
    "title": "Autonomia",
    "open": "Apri i custodi",
    "empty": "Ancora nessun custode. Un custode si sveglia secondo una pianificazione per occuparsi di un incarico permanente.",
    "active": "attivi",
    "paused": "in pausa",
    "ticking": "in ciclo ora",
    "nextWake": "Prossimo risveglio:",
    "allQuiet": "Nessun custode richiede attenzione.",
    "attention_one": "{{count}} custode richiede attenzione",
    "attention_other": "{{count}} custodi richiedono attenzione"
   }
  },
  "keeperDetail": {
   "title": "Custode",
   "heading": "Custode {{name}}",
   "notFoundTitle": "Custode non trovato",
   "notFoundBody": "Potrebbe essere stato eliminato oppure appartenere a un altro tenant.",
   "live": "In diretta",
   "polling": "Aggiornamento",
   "newRevision": "Nuova revisione",
   "noWake": "Non pianificato",
   "quietStreak": "Cicli calmi di fila",
   "activeRun": "Ciclo in corso",
   "revisionTitle": "Revisione corrente",
   "revisionHeading": "Revisione corrente ({{number}})",
   "noRevision": "Nessuna revisione è ancora pubblicata. Usa Nuova revisione per scriverne una e pubblicarla.",
   "clusterDefault": "Predefinito del cluster",
   "noLimit": "Nessun limite",
   "ticks": "Cicli",
   "outcomeFilter": "Esito",
   "allOutcomes": "Tutti gli esiti",
   "noTicksTitle": "Ancora nessun ciclo",
   "noTicksActive": "Il primo ciclo parte al prossimo risveglio. Usa Sveglia ora per avviarne uno subito.",
   "noTicksBody": "I cicli compaiono qui quando il custode è attivo e si sveglia.",
   "chartTitle": "Intervallo dopo ogni ciclo",
   "chartHelp": "Minuti al prossimo risveglio, come impostati al termine di ogni ciclo. I cicli calmi lo allungano in modalità Backoff.",
   "chartSeries": "Intervallo (minuti)",
   "columns": {
    "started": "Avviato",
    "source": "Svegliato da",
    "outcome": "Esito",
    "run": "Esecuzione",
    "interval": "Intervallo successivo",
    "cost": "Costo",
    "summary": "Riepilogo",
    "number": "Numero",
    "state": "Stato",
    "revisionSource": "Origine",
    "author": "Autore",
    "changeNote": "Nota di modifica",
    "created": "Creata"
   },
   "requested": "ha chiesto {{interval}}",
   "revisions": "Revisioni",
   "noRevisions": "Ancora nessuna revisione.",
   "current": "Corrente",
   "diff": "Confronta",
   "diffTitle": "Revisione {{number}} a confronto con la precedente",
   "diffFirst": "Questa è la prima revisione, quindi tutto ciò che contiene è nuovo.",
   "revisionLabel": "Revisione {{number}}",
   "nothing": "Niente",
   "confirmDelete": "Eliminare il custode {{name}} con le sue revisioni e la cronologia dei cicli? Le sue esecuzioni passate restano.",
   "confirmForceDelete": "Un ciclo di {{name}} è in corso. Eliminare comunque il custode e annullare l'esecuzione di quel ciclo?",
   "forceDelete": "Elimina e annulla il ciclo",
   "changeNote": "Nota di modifica: {{note}}"
  }
 },
 "tips": {
  "nav": {
   "hubs": {
    "autonomy": "Agenti che lavorano da soli tra una richiesta e l'altra. I custodi si svegliano secondo una pianificazione, controllano un incarico permanente e agiscono o chiedono aiuto."
   },
   "tabs": {
    "keepers": "Custodi: agenti che si svegliano secondo una pianificazione per occuparsi di un incarico permanente, con i loro cicli e le loro revisioni."
   }
  },
  "enums": {
   "runKind": {
    "Keeper": "Avviata dal risveglio di un custode. L'esecuzione è un ciclo di quel custode e rimanda a lui."
   },
   "resourceType": {
    "Mandate": "Custodi (mandati): gli incarichi permanenti di cui gli agenti si occupano secondo una pianificazione di risvegli, con le loro revisioni e i loro cicli."
   },
   "mandateStatus": {
    "Draft": "Creato senza una revisione pubblicata, quindi non si sveglia ancora. Pubblica una revisione per avviarlo.",
    "Active": "Si sveglia secondo la sua pianificazione. Ogni risveglio avvia un ciclo, un'esecuzione della sua distribuzione.",
    "Paused": "Non si sveglia finché qualcuno non lo riprende. Riprendendolo si sveglia subito con l'intervallo azzerato.",
    "Frozen": "Fermato da un amministratore o da una policy. Non si sveglia finché non viene scongelato.",
    "CapReached": "Il suo budget giornaliero è esaurito. Si risveglia all'inizio del prossimo giorno UTC.",
    "Retired": "Non più in uso. Conserva la sua cronologia e non si sveglia mai."
   },
   "mandateRevisionState": {
    "Draft": "Salvata ma non in uso. Pubblicala per renderla la revisione corrente del custode.",
    "Published": "È stata o è in uso. Le revisioni pubblicate non cambiano mai; scrivi invece una nuova revisione."
   },
   "mandateRevisionSource": {
    "Human": "Scritta da una persona nella dashboard, tramite l'API o in un manifesto.",
    "Board": "Impostata da un consiglio di agenti che supervisiona questo custode.",
    "Executive": "Impostata da un agente dirigente che guida questo custode.",
    "Architect": "Scritta dall'architetto degli agenti a partire da una bozza dello studio."
   },
   "wakeMode": {
    "Fixed": "Si sveglia a ogni intervallo minimo, qualunque cosa abbia trovato l'ultimo ciclo.",
    "Backoff": "Attende più a lungo dopo ogni ciclo calmo, fino all'intervallo massimo, e torna al minimo non appena succede qualcosa."
   },
   "wakeSource": {
    "Timer": "La pianificazione dei risvegli è scaduta, quindi il custode si è svegliato da solo.",
    "Manual": "Qualcuno ha usato Sveglia ora o ha ripreso il custode.",
    "Message": "È arrivato un messaggio per il custode.",
    "EscalationAnswer": "Qualcuno ha risposto a una domanda che il custode aveva escalato.",
    "Webhook": "Un altro sistema ha chiamato il webhook del custode.",
    "Report": "Il rapporto di un altro agente ha chiesto a questo custode di dare un'occhiata."
   },
   "tickOutcome": {
    "Quiet": "Tutto era in buono stato e non c'era niente da fare. In modalità Backoff il prossimo risveglio arriva più tardi.",
    "Acted": "Il custode ha cambiato qualcosa per mantenere sano l'incarico.",
    "Attention": "Il custode ha trovato qualcosa che una persona dovrebbe guardare.",
    "Escalated": "Il custode ha chiesto una decisione a una persona o a un altro agente.",
    "Failed": "L'esecuzione del ciclo è fallita, è scaduta o è stata annullata.",
    "Skipped": "Un risveglio è arrivato mentre il ciclo precedente era ancora in corso, quindi è stato saltato e il successivo attende la sua fine.",
    "Unreported": "L'esecuzione è terminata senza riportare un esito, quindi il custode potrebbe aver bisogno di un obiettivo più chiaro."
   }
  },
  "resources": {
   "runs": {
    "mandateId": "Il custode che ha avviato questa esecuzione come uno dei suoi cicli, se presente. Fai clic per aprire il custode.",
    "openKeeper": "Apri il custode di cui questa esecuzione è un ciclo."
   },
   "keepers": {
    "add": "Crea un custode: scegli un agente ospitato e una distribuzione, descrivi l'incarico permanente e imposta ogni quanto si sveglia.",
    "name": "Un nome univoco in questo tenant, usato negli URL, nei manifesti e nell'API.",
    "status": "Indica se il custode si sveglia secondo la sua pianificazione (Attivo) oppure è in attesa, in pausa, congelato o ritirato.",
    "agent": "L'agente ospitato che si occupa di questo mandato. Ogni ciclo esegue questo agente.",
    "deployment": "La distribuzione su cui viene eseguito ogni ciclo, che definisce harness, modello e strumenti.",
    "nextWakeUtc": "Quando parte il prossimo ciclo. Passa il puntatore per vedere l'ora esatta.",
    "currentIntervalSeconds": "L'attesa dopo l'ultimo ciclo. In modalità Backoff cresce dopo i cicli calmi.",
    "lastTick": "Quando il custode si è svegliato l'ultima volta e che cosa ha riportato quel ciclo.",
    "tickCount": "Quanti cicli ha eseguito il custode in totale.",
    "currentRevisionNumber": "La revisione pubblicata che il custode segue ora.",
    "runAs": "L'utente o la credenziale con i cui permessi viene eseguito ogni ciclo: chi ha salvato per ultimo il custode.",
    "description": "Note per le persone. Il custode non le legge; legge l'obiettivo.",
    "id": "L'identificatore del custode, usato nell'API e nei record di esecuzione.",
    "createdUtc": "Quando il custode è stato creato.",
    "agentId": "L'agente ospitato che si occupa di questo mandato. Gli agenti remoti non possono essere custodi. Fisso dopo la creazione.",
    "deploymentId": "La distribuzione attiva di quell'agente su cui viene eseguito ogni ciclo.",
    "objective": "L'incarico permanente in parole semplici, come mantenere la coda del supporto sotto i 20 ticket aperti. Il custode lo legge a ogni ciclo.",
    "healthyDefinition": "Come appare uno stato buono, così il custode distingue un ciclo calmo da uno che richiede di agire.",
    "autonomy": "Che cosa il custode può cambiare da solo senza chiedere a nessuno.",
    "escalationPolicy": "Quando il custode deve fermarsi e chiedere una decisione a una persona o a un altro agente.",
    "direction": "Indicazioni a breve termine che possono cambiare spesso, come un'attenzione particolare per questa settimana.",
    "signals": "Misurazioni con nome che il custode deve controllare a ogni ciclo, con il significato di ciascuna.",
    "signalsItems": {
     "name": "Un nome breve per la misurazione, univoco all'interno della revisione.",
     "description": "Che cosa significa la misurazione e quali valori sono preoccupanti."
    },
    "wakeMode": "Fisso si sveglia ogni volta all'intervallo minimo. Backoff attende più a lungo dopo i cicli calmi.",
    "minIntervalSeconds": "L'attesa più breve tra risvegli pianificati, in secondi.",
    "maxIntervalSeconds": "L'attesa più lunga tra risvegli pianificati in modalità Backoff, in secondi.",
    "backoffFactor": "Di quanto cresce l'attesa dopo ogni ciclo calmo in modalità Backoff. 2 la raddoppia.",
    "jitterPercent": "Un ritardo casuale fino a questa percentuale dell'intervallo, così molti custodi non si svegliano nello stesso istante.",
    "budgetPerTickUsd": "Il massimo che un ciclo può costare in dollari statunitensi.",
    "budgetPerDayUsd": "Il massimo che i cicli di questo custode possono costare per giorno UTC in dollari statunitensi.",
    "maxTokensPerTick": "Il massimo di token di input e output che un ciclo può usare.",
    "changeNote": "Una breve nota sul perché questa revisione modifica il custode, conservata con la revisione.",
    "sections": {
     "mandate": "Di che cosa si occupa il custode e quanto può fare da solo.",
     "schedule": "Ogni quanto si sveglia il custode e come cambia l'attesa dopo i cicli calmi.",
     "budgets": "Limiti a ciò che i cicli del custode possono costare e consumare."
    },
    "actions": {
     "pause": "Smetti di svegliare questo custode. Un ciclo in corso termina; non ne parte un altro finché non lo riprendi.",
     "resume": "Riprendi a svegliare questo custode. Si sveglia subito con l'intervallo riportato al minimo.",
     "wake": "Avvia un ciclo ora invece di attendere la pianificazione. Se un ciclo è in corso, il nuovo parte dopo.",
     "runs": "Apri la pagina Esecuzioni filtrata sui cicli di questo custode."
    },
    "ticking": "Un ciclo di questo custode è in corso ora."
   }
  },
  "keeperRevision": {
   "done": "Chiudi questa finestra. La revisione è stata salvata con i valori modificati elencati sopra.",
   "draft": "Salva questa revisione come bozza senza usarla. Pubblicala più tardi dall'elenco delle revisioni.",
   "publish": "Salva questa revisione e rendila corrente ora. La dilatazione si azzera e il custode si sveglia subito."
  },
  "views": {
   "runDetail": {
    "keeper": "Il custode che ha avviato questa esecuzione come uno dei suoi cicli.",
    "openKeeper": "Apri il custode, con i suoi cicli e le sue revisioni."
   },
   "home": {
    "autonomy": {
     "title": "I custodi di questo tenant e quelli il cui ultimo ciclo richiede una persona.",
     "open": "Apri la pagina Custodi per creare, mettere in pausa, svegliare o modificare i custodi.",
     "active": "Custodi che si svegliano secondo la loro pianificazione.",
     "paused": "Custodi che non si svegliano finché qualcuno non li riprende.",
     "ticking": "Custodi con un ciclo in corso in questo momento.",
     "nextWake": "Il prossimo risveglio pianificato più vicino tra i custodi attivi.",
     "attention": "Custodi il cui ultimo ciclo richiede attenzione, è stato escalato, è fallito o non ha riportato nulla, e custodi fermati da un budget o da un congelamento.",
     "openKeeper": "Apri la pagina di questo custode per vedere i suoi cicli."
    }
   },
   "keeperDetail": {
    "openRun": "Apri la pagina di dettaglio di questa esecuzione: trascrizione, chiamate agli strumenti e risultato.",
    "live": "Gli aggiornamenti arrivano quando i cicli iniziano e finiscono, tramite la connessione in diretta.",
    "polling": "La connessione in diretta non è disponibile, quindi la pagina rilegge il custode ogni pochi secondi.",
    "viewJson": "Mostra il record del custode con la sua revisione corrente in JSON.",
    "newRevision": "Scrivi una nuova revisione di obiettivo, pianificazione o budget, partendo da quella corrente.",
    "delete": "Elimina questo custode con le sue revisioni e la cronologia dei cicli. Le sue esecuzioni passate restano.",
    "forceDelete": "Elimina il custode e annulla l'esecuzione del ciclo in corso.",
    "openAgent": "Apri l'agente che questo custode esegue.",
    "quietStreak": "Quanti cicli di fila non hanno trovato nulla da fare. In modalità Backoff ognuno allunga l'attesa.",
    "activeRun": "L'esecuzione del ciclo in corso, se ce n'è uno.",
    "revisionTitle": "La revisione pubblicata che il custode segue a ogni ciclo.",
    "ticks": "Ogni risveglio di questo custode, dal più recente: che cosa lo ha svegliato, che cosa ha trovato e l'attesa che ha impostato.",
    "outcomeFilter": "Mostra solo i cicli con questo esito.",
    "outcomeCounts": "Quanti cicli di questa pagina hanno avuto ciascun esito.",
    "chart": "L'attesa dopo ogni ciclo di questa pagina, il più vecchio a sinistra. Cresce dopo i cicli calmi in modalità Backoff e si azzera quando succede qualcosa.",
    "columns": {
     "started": "Quando è iniziato il ciclo. Passa il puntatore per vedere l'ora esatta.",
     "source": "Che cosa ha svegliato il custode per questo ciclo.",
     "outcome": "Che cosa ha riportato il ciclo: calmo, intervenuto, richiede attenzione, escalato o non riuscito.",
     "run": "L'esecuzione che ha svolto il ciclo.",
     "interval": "L'attesa fino al prossimo risveglio, come impostata al termine di questo ciclo.",
     "cost": "Quanto è costata l'esecuzione del ciclo, in base al listino prezzi del modello.",
     "summary": "Che cosa il custode ha detto di aver trovato o fatto, oppure l'errore che ha fermato il ciclo.",
     "number": "Il numero della revisione. Quella corrente è contrassegnata.",
     "state": "Le revisioni in bozza sono salvate ma non in uso; quelle pubblicate sono state o sono in uso.",
     "revisionSource": "Chi ha scritto la revisione: una persona, l'architetto degli agenti o un agente supervisore.",
     "author": "L'utente o la credenziale che ha salvato la revisione.",
     "changeNote": "Perché la revisione ha modificato il custode.",
     "created": "Quando la revisione è stata salvata."
    },
    "requested": "Il custode ha chiesto questa attesa; il server la mantiene entro l'intervallo minimo e massimo.",
    "revisions": "Ogni revisione di questo custode, dalla più recente. Confrontane una con la precedente o pubblica una bozza.",
    "current": "La revisione che il custode segue ora.",
    "diff": "Mostra che cosa ha cambiato questa revisione rispetto alla precedente."
   }
  }
 },
 "explainers": {
  "keepers": {
   "title": "Custodi",
   "p1": "Un custode è un agente con un incarico permanente, il suo mandato. Si sveglia secondo una pianificazione, controlla come stanno le cose, agisce entro ciò che può fare da solo e riporta ogni volta un breve esito. Ogni risveglio è un ciclo, e ogni ciclo è un'esecuzione della distribuzione del custode.",
   "p2": "In modalità Backoff un ciclo calmo sposta più in là il prossimo risveglio, fino all'intervallo massimo, e qualsiasi altro esito lo riporta al minimo. Viene eseguito un solo ciclo alla volta: un risveglio che arriva durante un ciclo ne attende la fine.",
   "p3": "Le modifiche a obiettivo, pianificazione o budget sono revisioni. Pubblicare una revisione la rende subito corrente e sveglia il custode, e ogni revisione resta nella cronologia per essere confrontata."
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
})(it, {
 "nav": {
  "hubs": {
   "autonomy": {
    "tip": "Agenti che lavorano da soli: i custodi si svegliano secondo una pianificazione per occuparsi di un compito permanente, e le escalation sono le domande che fanno alle persone."
   }
  },
  "items": {
   "escalations": {
    "label": "Escalation",
    "tip": "Domande che gli agenti hanno posto a una persona, a un ruolo o a un altro agente, e le risposte"
   }
  },
  "escalationsOpen_one": "{{count}} escalation attende una risposta",
  "escalationsOpen_other": "{{count}} escalation attendono una risposta"
 },
 "enums": {
  "resourceType": {
   "Escalation": "Escalation"
  },
  "notificationEvent": {
   "EscalationRaised": "Escalation aperta",
   "EscalationExpired": "Escalation scaduta"
  },
  "escalationStatus": {
   "Open": "Aperta",
   "Answered": "Risposta",
   "Expired": "Scaduta",
   "Cancelled": "Annullata",
   "Withdrawn": "Ritirata"
  },
  "escalationSeverity": {
   "Info": "Info",
   "Warning": "Avviso",
   "Urgent": "Urgente"
  },
  "escalationMode": {
   "NonBlocking": "Non bloccante",
   "Blocking": "Bloccante"
  },
  "escalationTargetKind": {
   "User": "Utente",
   "Role": "Ruolo",
   "Agent": "Agente",
   "Manager": "Responsabile"
  },
  "escalationTimeoutAction": {
   "UseDefaultAnswer": "Usa la risposta predefinita",
   "Cancel": "Annulla",
   "EscalateUp": "Scala più in alto"
  },
  "escalationResolutionSource": {
   "User": "Una persona",
   "Agent": "Un agente",
   "Timeout": "Scadenza",
   "Raiser": "L'esecuzione di origine",
   "System": "Garrison"
  }
 },
 "components": {
  "escalations": {
   "passedUp": "Scalata più in alto",
   "answerTitle": "Rispondi a {{agent}}",
   "submit": "Invia risposta",
   "expires": "Scade {{when}}, poi: {{action}}",
   "question": "Domanda",
   "context": "Contesto",
   "choice": "Scegli un'opzione",
   "default": "Predefinita",
   "defaultAnswer": "Risposta predefinita: {{answer}}",
   "explain": "Spiegazione (facoltativa)",
   "text": "Risposta",
   "textPlaceholder": "Scrivi la risposta. L'agente la legge come dati, non come istruzioni.",
   "errors": {
    "choice": "Scegli una delle opzioni.",
    "unknownChoice": "Questa escalation non offre quell'opzione.",
    "text": "Scrivi una risposta.",
    "textMax": "La risposta è limitata a {{max}} caratteri."
   },
   "toasts": {
    "answered": "Risposta inviata a {{agent}}.",
    "passedUp": "Questa escalation è passata a un'altra. Rispondi a quella.",
    "notOpen": "Qualcun altro ha risposto prima, oppure è scaduta.",
    "forbidden": "Per rispondere serve Update su Escalation."
   }
  }
 },
 "resources": {
  "escalations": {
   "title": "Escalation",
   "subtitle": "Domande che gli agenti hanno posto a una persona, a un ruolo o a un altro agente. Quelle aperte attendono una risposta; quelle bloccanti sospendono la loro esecuzione fino ad allora.",
   "add": "Aggiungi escalation",
   "create": "Crea escalation",
   "edit": "Modifica escalation",
   "view": "Dettagli escalation",
   "deleteTitle": "Elimina escalation",
   "emptyTitle": "Nessuna escalation",
   "emptyBody": "Un'escalation compare quando un agente chiede a una persona, a un ruolo o a un altro agente di decidere qualcosa con garrison_escalate.",
   "columns": {
    "createdUtc": "Aperta",
    "severity": "Gravità",
    "status": "Stato",
    "question": "Domanda",
    "agent": "Agente",
    "target": "Destinatario",
    "expiresUtc": "Scade",
    "answer": "Risposta",
    "mode": "Modalità",
    "mandate": "Custode",
    "resolvedBy": "Risposta da",
    "resolutionSource": "Risolta da",
    "resolvedUtc": "Risolta",
    "raisingRunId": "Esecuzione di origine",
    "id": "ID"
   },
   "filters": {
    "targetKind": "Destinatario"
   },
   "fields": {
    "status": "Stato",
    "severity": "Gravità",
    "mode": "Modalità",
    "target": "Destinatario",
    "agent": "Aperta da",
    "raisingRunId": "Esecuzione di origine",
    "mandate": "Custode",
    "mandateTickId": "Ciclo del custode",
    "routedRunId": "Esecuzione che risponde",
    "parentEscalationId": "Scalata da",
    "escalatedToId": "Scalata a",
    "timeoutAction": "Alla scadenza",
    "expiresUtc": "Scade",
    "createdUtc": "Aperta",
    "leaseEpoch": "Epoca del lease",
    "context": "Contesto",
    "options": "Opzioni",
    "answerChoice": "Scelta",
    "answerText": "Risposta",
    "resolvedBy": "Risposta da",
    "resolutionSource": "Risolta da",
    "resolvedUtc": "Risolta"
   },
   "actions": {
    "answer": "Rispondi",
    "openEscalatedTo": "Apri l'escalation a cui è passata",
    "openRun": "Apri l'esecuzione di origine",
    "openKeeper": "Apri il custode",
    "cancel": "Annulla escalation"
   },
   "cancelTitle": "Annullare questa escalation?",
   "cancelMessage": "{{agent}} non riceverà risposta. L'escalation resta come Annullata.",
   "cancelBlocking": "{{agent}} sta aspettando questa risposta. Annullare l'escalation annulla anche quell'esecuzione.",
   "toasts": {
    "cancelled": "Escalation annullata."
   }
  },
  "keepers": {
   "fields": {
    "escalationTargetKind": "Scala a",
    "escalationTargetId": "Destinatario dell'escalation"
   },
   "noEscalationTarget": "La persona che ha salvato la revisione",
   "escalationTargetPlaceholder": "ID o nome dell'utente, del ruolo o dell'agente",
   "errors": {
    "escalationTargetId": "Indica l'utente, il ruolo o l'agente a cui scalare."
   }
  },
  "notifications": {
   "fields": {
    "escalationMinimumSeverity": "Gravità minima delle escalation"
   },
   "anySeverity": "Qualsiasi gravità"
  }
 },
 "views": {
  "escalationDetail": {
   "title": "Escalation",
   "titleWithAgent": "Escalation di {{agent}}",
   "notFoundTitle": "Escalation non trovata",
   "notFoundBody": "Non esiste in questo tenant, oppure è stata eliminata insieme al suo tenant.",
   "back": "Torna alle escalation",
   "open": "Questa escalation attende una risposta.",
   "openBlocking": "L'esecuzione di origine è sospesa finché questa escalation non riceve risposta.",
   "expires": "Scade {{when}}, poi: {{action}}.",
   "passedUp": "Nessuno ha risposto in tempo, quindi questa escalation è passata a un'altra. Rispondi alla nuova:",
   "question": "Domanda",
   "chosen": "Scelta",
   "answer": "Risposta"
  },
  "home": {
   "escalations": {
    "title_one": "{{count}} escalation attende una risposta",
    "title_other": "{{count}} escalation attendono una risposta",
    "open": "Apri le escalation",
    "more_one": "E altre {{count}}.",
    "more_other": "E altre {{count}}."
   }
  }
 },
 "tips": {
  "nav": {
   "escalationsBadge_one": "{{count}} escalation attende una risposta. Apri Autonomia, poi Escalation.",
   "escalationsBadge_other": "{{count}} escalation attendono una risposta. Apri Autonomia, poi Escalation.",
   "tabs": {
    "escalations": "Escalation: domande che gli agenti hanno posto a una persona, a un ruolo o a un altro agente, prima quelle aperte, con Rispondi e Annulla."
   }
  },
  "enums": {
   "resourceType": {
    "Escalation": "Domande che le esecuzioni pongono a una persona, a un ruolo o a un altro agente, e le risposte."
   },
   "notificationEvent": {
    "EscalationRaised": "Un agente ha aperto un'escalation. Gli endpoint possono saltare quelle sotto una gravità minima.",
    "EscalationExpired": "Un'escalation è scaduta prima che qualcuno rispondesse."
   },
   "escalationStatus": {
    "Open": "Attende una risposta. Un'escalation bloccante sospende la sua esecuzione fino ad allora.",
    "Answered": "Qualcuno ha risposto; l'esecuzione o il custode di origine ha ricevuto la risposta.",
    "Expired": "Nessuno ha risposto prima della scadenza ed è stata applicata l'azione di scadenza.",
    "Cancelled": "Una persona l'ha annullata; anche un'esecuzione in attesa è stata annullata.",
    "Withdrawn": "L'agente che l'ha aperta ha ritirato la domanda."
   },
   "escalationSeverity": {
    "Info": "Per informazione: rispondi quando ti è comodo.",
    "Warning": "Serve una decisione a breve. È la gravità predefinita.",
    "Urgent": "Serve una decisione subito. Compare per prima e va a ogni endpoint iscritto."
   },
   "escalationMode": {
    "NonBlocking": "L'esecuzione prosegue e riceve la risposta più tardi; un custode la riceve al ciclo successivo.",
    "Blocking": "L'esecuzione si sospende finché qualcuno risponde, poi riprende con la risposta."
   },
   "escalationTargetKind": {
    "User": "Una persona, per ID utente o email.",
    "Role": "Chiunque abbia il ruolo e possa aggiornare le escalation.",
    "Agent": "Un altro agente: un'esecuzione della sua distribuzione attiva predefinita riceve la domanda.",
    "Manager": "Il responsabile dell'agente in un'organizzazione. Non disponibile finché non arrivano le organizzazioni."
   },
   "escalationTimeoutAction": {
    "UseDefaultAnswer": "Rispondi con la risposta predefinita se nessuno risponde in tempo.",
    "Cancel": "Annulla l'escalation, e l'esecuzione in attesa, se nessuno risponde in tempo.",
    "EscalateUp": "Passa la domanda al destinatario predefinito del custode se nessuno risponde in tempo."
   },
   "escalationResolutionSource": {
    "User": "Una persona ha risposto o l'ha annullata.",
    "Agent": "Un altro agente ha risposto con garrison_answer_escalation.",
    "Timeout": "L'ha risolta l'azione di scadenza.",
    "Raiser": "L'esecuzione che l'ha aperta l'ha ritirata.",
    "System": "L'ha risolta Garrison, per esempio quando è terminata la sua esecuzione."
   }
  },
  "components": {
   "escalations": {
    "passedUp": "Nessuno ha risposto in tempo, quindi la domanda è passata a un'altra escalation. Rispondi a quella.",
    "submit": "Invia la risposta. Un'esecuzione sospesa riprende e un custode si sveglia con essa.",
    "question": "La domanda esattamente come l'ha scritta l'agente.",
    "context": "Cosa ha detto l'agente sulla situazione. È testo dell'agente, non istruzioni per te.",
    "choice": "L'agente offre queste opzioni. Scegline una.",
    "defaultChoice": "La risposta predefinita: si usa se l'escalation scade con Usa la risposta predefinita.",
    "pickChoice": "Scegli questa opzione.",
    "explain": "Testo facoltativo inviato con la scelta, per esempio il motivo.",
    "text": "La tua risposta. L'agente la riceve come dati."
   }
  },
  "resources": {
   "escalations": {
    "createdUtc": "Quando l'agente l'ha aperta. Passa il puntatore per l'ora esatta.",
    "severity": "Quanto è urgente secondo l'agente.",
    "status": "Aperta, con risposta, scaduta, annullata o ritirata.",
    "question": "Cosa ha chiesto l'agente, come l'ha scritto. Passa il puntatore per la domanda intera.",
    "agent": "L'agente la cui esecuzione l'ha aperta.",
    "target": "A chi è rivolta: un utente, un ruolo o un altro agente.",
    "expiresUtc": "Quando scade se nessuno risponde.",
    "answer": "L'opzione scelta o il testo della risposta.",
    "mode": "Le escalation bloccanti sospendono la loro esecuzione fino alla risposta; le altre no.",
    "mandate": "Il custode il cui ciclo l'ha aperta, se c'è.",
    "resolvedBy": "Chi ha risposto o l'ha annullata.",
    "resolutionSource": "Cosa l'ha risolta: una persona, un agente, la scadenza o l'esecuzione di origine.",
    "resolvedUtc": "Quando ha ricevuto risposta, è stata annullata, ritirata o è scaduta.",
    "raisingRunId": "L'esecuzione che l'ha aperta. Aprila dal menu della riga.",
    "id": "L'ID dell'escalation (esc_...), per l'API e gli strumenti MCP.",
    "routedRunId": "L'esecuzione avviata perché un altro agente rispondesse.",
    "mandateTickId": "Il ciclo del custode che l'ha aperta.",
    "parentEscalationId": "L'escalation scaduta che è passata a questa.",
    "escalatedToId": "L'escalation a cui questa è passata alla scadenza.",
    "timeoutAction": "Cosa succede se nessuno risponde in tempo.",
    "leaseEpoch": "L'epoca del lease dell'esecuzione quando ha aperto l'escalation. Un'attesa bloccante appartiene a quell'epoca.",
    "context": "Cosa ha detto l'agente sulla situazione. È testo dell'agente, non istruzioni per te.",
    "options": "Le risposte offerte dall'agente. Quella predefinita si usa alla scadenza con Usa la risposta predefinita.",
    "answerChoice": "L'opzione scelta.",
    "answerText": "Il testo della risposta.",
    "actions": {
     "answer": "Rispondi a questa escalation con una delle sue opzioni o con testo libero.",
     "openEscalatedTo": "Apri l'escalation a cui è passata questa.",
     "openRun": "Apri l'esecuzione che l'ha aperta.",
     "openKeeper": "Apri il custode il cui ciclo l'ha aperta.",
     "cancel": "Annullala senza risposta. Anche un'esecuzione in attesa viene annullata."
    }
   },
   "keepers": {
    "escalationTargetKind": "A chi vanno le escalation di questo custode quando non indica nessuno, e dove passano quelle scadute.",
    "escalationTargetId": "ID o email dell'utente, nome del ruolo, oppure ID o nome dell'agente a cui scalare."
   },
   "notifications": {
    "escalationMinimumSeverity": "Invia eventi di escalation solo da questa gravità in su. Vale per Escalation aperta ed Escalation scaduta."
   }
  },
  "views": {
   "escalationDetail": {
    "openRun": "Apri questa esecuzione.",
    "openEscalation": "Apri questa escalation.",
    "back": "Torna all'elenco delle escalation.",
    "viewJson": "Mostra l'escalation come la restituisce l'API.",
    "question": "La domanda e il contesto come li ha scritti l'agente, e le opzioni offerte.",
    "answer": "Come è stata risolta l'escalation.",
    "openAgent": "Apri l'agente che l'ha aperta.",
    "openKeeper": "Apri il custode il cui ciclo l'ha aperta."
   },
   "home": {
    "escalations": {
     "title": "Escalation in attesa di risposta, le più urgenti per prime.",
     "open": "Apri l'elenco delle escalation."
    }
   }
  },
  "filters": {
   "severity": "Mostra solo le escalation di questa gravità. Scegli Tutte per togliere il filtro.",
   "targetKind": "Mostra solo le escalation rivolte a utenti, ruoli o agenti. Scegli Tutte per togliere il filtro."
  }
 },
 "explainers": {
  "escalations": {
   "title": "Escalation",
   "p1": "Un'escalation è una domanda che un agente pone quando non deve decidere da solo. Va a un utente, a chiunque abbia un ruolo o a un altro agente, con scelte, risposta predefinita, gravità e scadenza facoltative.",
   "p2": "La maggior parte delle escalation non blocca: l'esecuzione prosegue e un custode trova la risposta al ciclo successivo. Un'escalation bloccante sospende la sua esecuzione, che riprende con la risposta appena qualcuno risponde.",
   "p3": "Se nessuno risponde in tempo, si applica l'azione di scadenza: usare la risposta predefinita, annullare o passare la domanda al destinatario predefinito del custode. Le risposte arrivano all'agente come dati e non ne ampliano i permessi."
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
})(it, {
 "nav": {
  "items": {
   "freezes": {
    "label": "Blocchi",
    "tip": "Freni su agenti, distribuzioni, custodi e applicazioni, e l'interruttore di emergenza dell'autonomia"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Freeze": "Blocco"
  },
  "auditEventType": {
   "FreezeApplied": "Blocco applicato",
   "FreezeLifted": "Blocco rimosso",
   "KillSwitchChanged": "Interruttore di emergenza modificato"
  },
  "notificationEvent": {
   "FreezeApplied": "Blocco applicato",
   "MandateCapReached": "Limite di spesa del custode raggiunto"
  },
  "freezeTargetKind": {
   "Agent": "Agente",
   "Deployment": "Distribuzione",
   "Mandate": "Custode",
   "App": "Applicazione",
   "OrgUnit": "Unità organizzativa",
   "Organization": "Organizzazione",
   "TenantAutonomy": "Interruttore di emergenza"
  }
 },
 "errorCodes": {
  "Frozen": "È bloccato: le nuove esecuzioni vengono rifiutate finché il blocco non viene rimosso.",
  "AlreadyFrozen": "È già bloccato. Rimuovi prima quel blocco oppure lascialo com'è.",
  "FreezeLifted": "Qualcuno ha già rimosso questo blocco.",
  "KillSwitch": "L'interruttore di emergenza dell'autonomia è attivo, quindi le esecuzioni dei custodi vengono rifiutate.",
  "MandateBudgetExceeded": "Questo custode ha esaurito il budget per questo tick o per oggi.",
  "OrganizationsUnavailable": "I blocchi delle organizzazioni arriveranno con le organizzazioni. Blocca invece un agente, una distribuzione, un custode o un'applicazione."
 },
 "freezes": {
  "killSwitchTarget": "L'interruttore di emergenza dell'autonomia",
  "freezeTitle": "Bloccare?",
  "freezeMessage": "Bloccare {{target}}? Le nuove esecuzioni vengono rifiutate finché il blocco non viene rimosso, e i custodi interessati smettono di risvegliarsi.",
  "freezePickMessage": "Scegli cosa bloccare. Le nuove esecuzioni vengono rifiutate finché il blocco non viene rimosso, e i custodi interessati smettono di risvegliarsi.",
  "pickTarget": "Scegli...",
  "reasonPlaceholder": "Perché? Chi vede il blocco leggerà questo testo.",
  "liftTitle": "Rimuovere questo blocco?",
  "liftMessage": "Rimuovere il blocco su {{target}}? Le nuove esecuzioni vengono di nuovo accettate.",
  "liftKeeperMessage": "Rimuovere il blocco su {{target}}? Il custode torna attivo e il suo prossimo risveglio viene distribuito su un breve intervallo.",
  "bannerOwn": "Bloccato: le nuove esecuzioni vengono rifiutate finché il blocco non viene rimosso.",
  "bannerTarget": "{{target}} è bloccato: le sue nuove esecuzioni vengono rifiutate.",
  "bannerKillSwitch": "L'interruttore di emergenza dell'autonomia è attivo: in questo tenant non parte nessun tick dei custodi.",
  "bannerBy": "Bloccato da {{who}} {{when}}.",
  "bannerReason": "Motivo: {{reason}}",
  "openTarget": "Apri",
  "status": {
   "active": "Attivo",
   "lifted": "Rimosso"
  },
  "fields": {
   "targetKind": "Cosa bloccare",
   "target": "Destinazione",
   "reason": "Motivo (facoltativo)",
   "liftReason": "Motivo della rimozione (facoltativo)",
   "cancelActiveRuns": "Annulla anche le esecuzioni già attive"
  },
  "actions": {
   "freeze": "Blocca",
   "freezeAny": "Blocca qualcosa",
   "lift": "Rimuovi blocco",
   "openTarget": "Apri ciò che blocca"
  },
  "errors": {
   "reasonMax": "Il motivo può contenere al massimo {{max}} caratteri.",
   "target": "Scegli cosa bloccare."
  },
  "toasts": {
   "frozen": "{{target}} è bloccato.",
   "frozenCancelled_one": "{{target}} è bloccato ed è stata annullata {{count}} esecuzione attiva.",
   "frozenCancelled_other": "{{target}} è bloccato e sono state annullate {{count}} esecuzioni attive.",
   "lifted": "Il blocco su {{target}} è stato rimosso."
  },
  "killSwitch": {
   "title": "Interruttore di emergenza dell'autonomia",
   "on": "Attivo",
   "off": "Disattivo",
   "turnOn": "Attiva",
   "turnOff": "Disattiva",
   "help": "Finché l'interruttore è attivo non parte nessun tick dei custodi e le esecuzioni dei custodi vengono rifiutate. Le invocazioni di persone e credenziali API continuano a funzionare.",
   "changedBy": "Attivato da {{who}} {{when}}.",
   "onTitle": "Attivare l'interruttore di emergenza?",
   "onMessage": "Tutti i custodi di questo tenant smettono di risvegliarsi e le loro esecuzioni vengono rifiutate finché l'interruttore non viene disattivato. I tick già in corso terminano.",
   "offTitle": "Disattivare l'interruttore di emergenza?",
   "offMessage": "I custodi tornano a risvegliarsi, con i prossimi risvegli distribuiti su un breve intervallo.",
   "toasts": {
    "on": "L'interruttore di emergenza è attivo. Non parte nessun tick dei custodi.",
    "off": "L'interruttore di emergenza è disattivo. I custodi tornano a risvegliarsi."
   }
  }
 },
 "resources": {
  "freezes": {
   "title": "Blocchi",
   "subtitle": "Freni che rifiutano le nuove esecuzioni di un agente, di una distribuzione, di un custode o di un'applicazione finché qualcuno non li rimuove. Qui compare anche l'interruttore di emergenza.",
   "add": "Aggiungi blocco",
   "create": "Crea blocco",
   "edit": "Modifica blocco",
   "view": "Dettagli del blocco",
   "deleteTitle": "Elimina blocco",
   "emptyTitle": "Nessun blocco",
   "emptyBody": "Non c'è niente di bloccato. Blocca un agente, una distribuzione, un custode o un'applicazione dalla sua pagina oppure con Blocca qualcosa.",
   "columns": {
    "createdUtc": "Bloccato il",
    "status": "Stato",
    "targetKind": "Tipo",
    "target": "Destinazione",
    "reason": "Motivo",
    "createdBy": "Bloccato da",
    "cancelledRunCount": "Esecuzioni annullate",
    "liftedUtc": "Rimosso il",
    "liftedBy": "Rimosso da",
    "liftReason": "Motivo della rimozione",
    "targetId": "ID della destinazione",
    "id": "ID"
   }
  }
 },
 "views": {
  "home": {
   "autonomy": {
    "freezes_one": "{{count}} blocco attivo",
    "freezes_other": "{{count}} blocchi attivi"
   }
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "freezes": "Blocchi: freni su agenti, distribuzioni, custodi e applicazioni, prima quelli attivi, con Blocca e Rimuovi."
   }
  },
  "enums": {
   "resourceType": {
    "Freeze": "Blocchi che fermano le nuove esecuzioni di un agente, di una distribuzione, di un custode o di un'applicazione, e l'interruttore di emergenza dell'autonomia."
   },
   "auditEventType": {
    "FreezeApplied": "Qualcuno ha bloccato un agente, una distribuzione, un custode o un'applicazione.",
    "FreezeLifted": "Qualcuno ha rimosso un blocco.",
    "KillSwitchChanged": "Qualcuno ha attivato o disattivato l'interruttore di emergenza dell'autonomia."
   },
   "notificationEvent": {
    "FreezeApplied": "Qualcuno ha bloccato un agente, una distribuzione, un custode o un'applicazione, oppure ha attivato l'interruttore di emergenza.",
    "MandateCapReached": "Un custode ha raggiunto il limite di spesa giornaliero e non si risveglia fino al prossimo giorno UTC."
   },
   "freezeTargetKind": {
    "Agent": "Tutte le distribuzioni dell'agente: le nuove esecuzioni vengono rifiutate e i suoi custodi smettono di risvegliarsi.",
    "Deployment": "Una distribuzione: le nuove esecuzioni vengono rifiutate e i custodi che vi girano smettono di risvegliarsi.",
    "Mandate": "Un custode: smette di risvegliarsi finché il blocco non viene rimosso.",
    "App": "Un'applicazione: le nuove conversazioni e i nuovi messaggi della sua chat vengono rifiutati.",
    "OrgUnit": "Un'unità organizzativa. Non disponibile finché non arrivano le organizzazioni.",
    "Organization": "Un'intera organizzazione. Non disponibile finché non arrivano le organizzazioni.",
    "TenantAutonomy": "L'interruttore di emergenza: in tutto il tenant non parte nessun tick dei custodi."
   }
  },
  "freezes": {
   "denied": "Non puoi farlo. Serve {{operation}} su Blocco.",
   "openTarget": "Apri la pagina di ciò che questo blocco ferma.",
   "status": {
    "active": "In vigore: le nuove esecuzioni nel suo ambito vengono rifiutate.",
    "lifted": "Qualcuno l'ha rimosso; le esecuzioni vengono di nuovo accettate."
   },
   "actions": {
    "freeze": "Blocca: le nuove esecuzioni vengono rifiutate e i custodi interessati smettono di risvegliarsi finché il blocco non viene rimosso. Prima confermi.",
    "freezeAny": "Scegli un agente, una distribuzione, un custode o un'applicazione e bloccalo. Prima confermi.",
    "lift": "Rimuovi il blocco così le nuove esecuzioni vengono di nuovo accettate. Prima confermi."
   },
   "fields": {
    "targetKind": "Blocca un agente (tutte le sue distribuzioni), una distribuzione, un custode o un'applicazione.",
    "target": "Il record da bloccare.",
    "reason": "Facoltativo. Compare nel banner del blocco e nel registro di audit.",
    "liftReason": "Facoltativo. Registrato con il blocco e nel registro di audit.",
    "cancelActiveRuns": "Annulla anche le esecuzioni dell'ambito già in coda o in corso. Senza questa opzione terminano."
   },
   "filters": {
    "active": "Mostra solo i blocchi attivi o solo quelli rimossi. Scegli Tutti per vederli entrambi.",
    "targetKind": "Mostra solo i blocchi di questo tipo. Scegli Tutti per togliere il filtro."
   },
   "killSwitch": {
    "title": "Un interruttore che ferma tutti i custodi di questo tenant. Le invocazioni normali continuano a funzionare.",
    "on": "Attivo: non parte nessun tick dei custodi e le loro esecuzioni vengono rifiutate.",
    "off": "Disattivo: i custodi si risvegliano secondo la loro pianificazione.",
    "turnOn": "Ferma tutti i custodi di questo tenant. Prima confermi.",
    "turnOff": "Lascia che i custodi tornino a risvegliarsi. Prima confermi."
   }
  },
  "resources": {
   "freezes": {
    "createdUtc": "Quando è stato bloccato. Passa sopra con il mouse per l'ora esatta.",
    "status": "Attivo finché il blocco è in vigore; poi Rimosso.",
    "targetKind": "Il tipo di record bloccato.",
    "target": "L'agente, la distribuzione, il custode o l'applicazione bloccati.",
    "reason": "Perché è stato bloccato. Passa sopra con il mouse per il testo completo.",
    "createdBy": "Chi l'ha bloccato.",
    "cancelledRunCount": "Quante esecuzioni attive ha annullato il blocco, se richiesto.",
    "liftedUtc": "Quando il blocco è stato rimosso.",
    "liftedBy": "Chi l'ha rimosso.",
    "liftReason": "Perché è stato rimosso.",
    "targetId": "L'ID del record bloccato.",
    "id": "L'ID del blocco (mfz_...), per l'API e gli strumenti MCP."
   }
  },
  "views": {
   "home": {
    "autonomy": {
     "freezes": "Apri l'elenco dei blocchi attivi."
    }
   }
  },
  "filters": {
   "active": "Mostra solo i record attivi o solo quelli inattivi. Scegli Tutti per vederli entrambi."
  }
 },
 "explainers": {
  "freezes": {
   "title": "Blocchi",
   "p1": "Un blocco è un freno. Finché è attivo, Garrison rifiuta le nuove esecuzioni dell'agente, della distribuzione, del custode o dell'applicazione bloccati con 409 Frozen, e i custodi interessati smettono di risvegliarsi. Le esecuzioni già attive terminano, a meno che il blocco non le annulli.",
   "p2": "Blocca dalla pagina di un agente, di una distribuzione, di un custode o di un'applicazione, oppure qui con Blocca qualcosa. Rimuovendo un blocco le esecuzioni vengono di nuovo accettate; un custode bloccato torna attivo e il suo prossimo risveglio viene distribuito su un breve intervallo.",
   "p3": "L'interruttore di emergenza dell'autonomia, nelle Impostazioni e nella pagina iniziale, ferma in una volta tutti i tick dei custodi del tenant. Qui compare come blocco di tipo Interruttore di emergenza."
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
})(it, {
 "nav": {
  "items": {
   "memory": {
    "label": "Memoria",
    "tip": "Ciò che agenti e persone hanno salvato, per ambito, con chi ha scritto ogni voce e quando"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Memory": "Memoria"
  },
  "memoryScopeKind": {
   "Agent": "Agente",
   "App": "Applicazione",
   "OrgUnit": "Unità organizzativa",
   "Organization": "Organizzazione"
  }
 },
 "errorCodes": {
  "MemoryVersionConflict": "Questa voce di memoria è cambiata da quando l'hai caricata. Ricaricala e decidi di nuovo.",
  "MemoryDisabled": "La memoria degli agenti è disattivata su questo server, quindi il testo delle voci non si può leggere e le voci non si possono eliminare."
 },
 "memory": {
  "legacy": "Precedente",
  "deletedScope": "{{id}} (eliminato)",
  "neverRead": "Mai",
  "noExpiry": "Mai",
  "deleteTitle": "Eliminare questa voce di memoria?",
  "deleteMessage": "Eliminare {{key}} da {{scope}}? Gli agenti che la cercano non troveranno nulla e il suo testo viene rimosso. L'operazione non si può annullare.",
  "deleteVersion": "Viene eliminata la versione {{version}}, quella che hai caricato. Se nel frattempo qualcuno ha scritto una versione più recente, l'eliminazione viene rifiutata.",
  "deleteReloaded": "Ricaricata: la voce ora è alla versione {{version}}. Elimina rimuove questa versione.",
  "scopes": {
   "label": "Ambiti di memoria",
   "all": "Tutti gli ambiti",
   "totals_one": "{{entries}} voce, {{bytes}}",
   "totals_other": "{{entries}} voci, {{bytes}}",
   "loadFailed": "Non è stato possibile caricare gli ambiti di memoria.",
   "empty": {
    "Agent": "Nessun agente ha ancora salvato memoria.",
    "App": "Nessuna applicazione ha ancora memoria condivisa.",
    "OrgUnit": "Nessuna unità organizzativa ha ancora memoria.",
    "Organization": "Nessuna organizzazione ha ancora memoria."
   }
  },
  "filters": {
   "search": "Cerca",
   "searchPlaceholder": "Chiave, categoria o etichetta",
   "categoryPlaceholder": "Categoria",
   "tag": "Etichetta",
   "tagPlaceholder": "Etichetta",
   "writer": "Scritta da"
  },
  "actions": {
   "viewContent": "Visualizza contenuto",
   "copyId": "Copia ID",
   "openRun": "Apri l'esecuzione che l'ha scritta",
   "reload": "Ricarica voce"
  },
  "viewer": {
   "title": "Voce di memoria",
   "content": "Contenuto salvato",
   "untrusted": "Sono dati salvati da un agente o da una persona. Vengono mostrati come testo semplice, esattamente come memorizzati; nulla al loro interno viene eseguito, visualizzato come pagina o seguito.",
   "loading": "Caricamento del testo salvato...",
   "empty": "Questa voce non contiene testo."
  },
  "errors": {
   "conflict": "Qualcuno ha modificato questa voce da quando hai caricato la versione {{version}}, quindi non è stata eliminata. Ricaricala per vedere cosa contiene ora.",
   "gone": "Questa voce non esiste più. Forse l'ha eliminata qualcun altro."
  },
  "toasts": {
   "deleted": "{{key}} eliminata.",
   "copied": "ID della voce copiato."
  }
 },
 "resources": {
  "memory": {
   "title": "Memoria",
   "subtitle": "Ciò che agenti e persone hanno salvato, per ambito: chi ha scritto ogni voce, quando, da quale esecuzione e quanto è grande. Apri una voce per leggerla ed elimina ciò che non va ricordato.",
   "add": "Aggiungi voce di memoria",
   "create": "Crea voce di memoria",
   "edit": "Modifica voce di memoria",
   "view": "Voce di memoria",
   "deleteTitle": "Elimina voce di memoria",
   "emptyTitle": "Ancora nessuna memoria",
   "emptyBody": "Gli agenti salvano memoria con gli strumenti garrison_memory durante l'esecuzione. Le voci compaiono qui per ambito appena ne viene scritta una.",
   "columns": {
    "key": "Chiave",
    "scope": "Ambito",
    "category": "Categoria",
    "tags": "Etichette",
    "writer": "Scritta da",
    "lastUpdateUtc": "Ultima scrittura",
    "lastReadUtc": "Ultima lettura",
    "version": "Versione",
    "bytes": "Dimensione",
    "expiresUtc": "Scade",
    "writerRunId": "Esecuzione autrice",
    "createdUtc": "Creata",
    "sha256": "Hash SHA-256",
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
})(it, {
 "nav": {
  "items": {
   "reports": {
    "label": "Rapporti",
    "tip": "Rapporti di stato, incidenti, decisioni e passaggi di consegne presentati da agenti e persone, con salute e metriche"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Report": "Rapporto"
  },
  "notificationEvent": {
   "ReportUnhealthy": "Presentato un rapporto critico"
  },
  "reportKind": {
   "Status": "Stato",
   "Incident": "Incidente",
   "Decision": "Decisione",
   "Handoff": "Passaggio di consegne",
   "Brief": "Sintesi"
  },
  "reportHealth": {
   "Healthy": "Sano",
   "Degraded": "Degradato",
   "Unhealthy": "Critico",
   "Unknown": "Sconosciuta"
  },
  "reportAudience": {
   "Manager": "Responsabile",
   "Chain": "Catena gerarchica",
   "Board": "Consiglio"
  },
  "reportIssueSeverity": {
   "Low": "Bassa",
   "Medium": "Media",
   "High": "Alta"
  }
 },
 "reports": {
  "untrusted": "Questo rapporto è stato scritto da un agente o da una persona. Titolo, testo, metriche, problemi e decisioni sono mostrati come testo semplice, esattamente come sono stati presentati; nulla viene eseguito, interpretato o seguito.",
  "period": "Dal {{from}} al {{to}}",
  "periodFrom": "Dal {{from}}",
  "periodTo": "Fino al {{to}}",
  "filters": {
   "author": "Autore",
   "app": "Applicazione",
   "from": "Presentato dopo",
   "to": "Presentato prima"
  },
  "actions": {
   "file": "Presenta rapporto",
   "copyId": "Copia ID",
   "openRun": "Apri esecuzione",
   "openKeeper": "Apri custode",
   "openAuthor": "Apri autore"
  },
  "toasts": {
   "filed": "{{title}} presentato.",
   "copied": "ID del rapporto copiato."
  },
  "file": {
   "title": "Presenta un rapporto",
   "intro": "Annota come stanno le cose. Chiunque possa leggere i rapporti lo vedrà qui, e un rapporto critico avvisa gli endpoint iscritti a questo evento. Un rapporto presentato non si può più modificare.",
   "noAgent": "Nessun agente (a mio nome)",
   "fields": {
    "title": "Titolo",
    "kind": "Tipo",
    "health": "Salute",
    "audience": "Destinatari",
    "agent": "Presenta per l'agente",
    "body": "Testo"
   },
   "errors": {
    "title": "Dai al rapporto un titolo da 1 a {{max}} caratteri.",
    "body": "Il testo può contenere al massimo {{max}} byte."
   }
  },
  "chart": {
   "metric": "Metrica",
   "title": "{{metric}} nel tempo",
   "help_one": "{{count}} valore riportato da {{agent}}, dal più vecchio al più recente.",
   "help_other": "{{count}} valori riportati da {{agent}}, dal più vecchio al più recente.",
   "noMetrics": "Questo rapporto non contiene metriche, quindi non c'è nulla da rappresentare.",
   "noAuthor": "Nessun agente ha scritto questo rapporto, quindi non c'è una cronologia dell'autore da rappresentare.",
   "empty": "Ancora nessun valore per questa metrica.",
   "failed": "Impossibile caricare la cronologia della metrica."
  }
 },
 "views": {
  "reportDetail": {
   "title": "Rapporto",
   "notFoundTitle": "Rapporto non trovato",
   "notFoundBody": "Non esiste in questo tenant, oppure è stato eliminato insieme al suo tenant.",
   "back": "Torna ai rapporti",
   "body": "Testo",
   "metrics": "Metriche",
   "chart": "Cronologia della metrica",
   "issues": "Problemi",
   "decisions": "Decisioni",
   "noBody": "Questo rapporto non ha testo.",
   "noMetrics": "Questo rapporto non ha metriche.",
   "noIssues": "Nessun problema segnalato.",
   "noDecisions": "Nessuna decisione registrata.",
   "columns": {
    "name": "Nome",
    "value": "Valore",
    "unit": "Unità"
   },
   "fields": {
    "health": "Salute",
    "kind": "Tipo",
    "audience": "Destinatari",
    "author": "Autore",
    "period": "Periodo",
    "createdUtc": "Presentato",
    "filedBy": "Presentato da",
    "runId": "Esecuzione",
    "mandateId": "Custode",
    "mandateTickId": "Ciclo del custode",
    "app": "Applicazione",
    "orgUnitId": "Unità organizzativa"
   }
  }
 },
 "resources": {
  "reports": {
   "title": "Rapporti",
   "subtitle": "Ciò che agenti e persone hanno riferito verso l'alto: come stanno le cose, incidenti, decisioni e passaggi di consegne, con salute e metriche. Aprine uno per leggerlo e seguire una metrica nel tempo.",
   "add": "Presenta rapporto",
   "create": "Presenta rapporto",
   "edit": "Rapporto",
   "view": "Dettagli del rapporto",
   "deleteTitle": "Elimina rapporto",
   "emptyTitle": "Ancora nessun rapporto",
   "emptyBody": "Gli agenti presentano rapporti con lo strumento garrison_file_report durante le esecuzioni, e le persone li presentano qui o tramite l'API. Compaiono qui appena ne viene presentato uno.",
   "columns": {
    "createdUtc": "Presentato",
    "title": "Titolo",
    "author": "Autore",
    "kind": "Tipo",
    "health": "Salute",
    "app": "Applicazione",
    "period": "Periodo",
    "issues": "Problemi",
    "audience": "Destinatari",
    "filedBy": "Presentato da",
    "runId": "Esecuzione",
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
})(it, {
 "nav": {
  "items": {
   "messages": {
    "label": "Messaggi",
    "tip": "Posta tra agenti e da persone, con i messaggi che le protezioni anti-ciclo hanno rifiutato e il motivo"
   },
   "messageThreads": {
    "label": "Conversazione di messaggi",
    "tip": "Tutti i messaggi di una conversazione, dal più vecchio"
   }
  }
 },
 "enums": {
  "resourceType": {
   "AgentMessage": "Messaggio di agente"
  },
  "runKind": {
   "Message": "Messaggio urgente"
  },
  "messageStatus": {
   "Queued": "In coda",
   "Delivered": "Consegnato",
   "Acknowledged": "Confermato",
   "Expired": "Scaduto",
   "Rejected": "Rifiutato"
  },
  "messageUrgency": {
   "Normal": "Normale",
   "Urgent": "Urgente"
  },
  "messageRejection": {
   "HopLimit": "Limite di passaggi",
   "LineRate": "Frequenza della linea",
   "ThreadBudget": "Budget della conversazione",
   "NoLine": "Nessuna linea",
   "Frozen": "Destinatario congelato"
  }
 },
 "messages": {
  "untrusted": "Agenti e persone hanno scritto questi messaggi. Oggetti, corpi e dettagli dei rifiuti sono mostrati come testo semplice, esattamente come inviati; nulla viene eseguito, visualizzato come markup o seguito.",
  "views": {
   "label": "Quali messaggi",
   "all": "Tutti i messaggi",
   "rejected": "Rifiutati",
   "rejectedNote": "Messaggi che le protezioni anti-ciclo hanno rifiutato all'invio, con il motivo. Un messaggio rifiutato non è mai stato consegnato."
  },
  "filters": {
   "reason": "Motivo",
   "sender": "Mittente",
   "recipient": "Destinatario",
   "from": "Inviato dopo",
   "to": "Inviato prima"
  },
  "actions": {
   "send": "Invia messaggio",
   "openThread": "Apri conversazione",
   "copyId": "Copia ID",
   "openSender": "Apri mittente",
   "openRecipient": "Apri destinatario",
   "openDeliveredRun": "Apri esecuzione ricevente",
   "openEscalation": "Apri escalation"
  },
  "toasts": {
   "sent": "Inviato a {{recipient}}.",
   "copied": "ID del messaggio copiato."
  },
  "send": {
   "title": "Invia un messaggio",
   "intro": "Scrivi a un agente. Il messaggio attende nella sua casella finché un'esecuzione non lo legge; un messaggio urgente sveglia subito l'agente.",
   "replyIntro": "Rispondi in questa conversazione. La risposta va all'agente che ha inviato il messaggio.",
   "pickRecipient": "Scegli un agente",
   "ttlPlaceholder": "Predefinito del server",
   "sending": "Invio in corso...",
   "rejected": "Le protezioni anti-ciclo hanno rifiutato questo messaggio.",
   "rejectedStored": "Il messaggio rifiutato resta nell'elenco dei rifiutati.",
   "fields": {
    "recipient": "A",
    "subject": "Oggetto",
    "body": "Corpo",
    "urgency": "Urgenza",
    "ttlSeconds": "Scade dopo (secondi)"
   },
   "errors": {
    "recipient": "Scegli l'agente a cui inviare il messaggio.",
    "subject": "Dai al messaggio un oggetto da 1 a {{max}} caratteri.",
    "body": "Il corpo contiene al massimo {{max}} byte.",
    "ttlSeconds": "Inserisci un numero intero di secondi da {{min}} a {{max}}, oppure lascia vuoto."
   }
  }
 },
 "views": {
  "messageThread": {
   "title": "Conversazione di messaggi",
   "notFoundTitle": "Conversazione non trovata",
   "notFoundBody": "Non esiste in questo tenant, oppure è stata rimossa con il suo tenant.",
   "back": "Torna ai messaggi",
   "count_one": "{{count}} messaggio",
   "count_other": "{{count}} messaggi",
   "rejectedCount_one": "{{count}} rifiutato",
   "rejectedCount_other": "{{count}} rifiutati",
   "emptyTitle": "Nessun messaggio in questa conversazione",
   "emptyBody": "La conversazione esiste ma non contiene messaggi che puoi leggere.",
   "listLabel": "Messaggi di questa conversazione, dal più vecchio",
   "noBody": "Questo messaggio non ha corpo.",
   "noDetail": "Nessun altro dettaglio.",
   "woke": "Ha svegliato il destinatario",
   "artifacts": "Artefatti allegati",
   "reply": "Rispondi",
   "replyPrefix": "R: ",
   "fields": {
    "sender": "Da",
    "recipient": "A",
    "createdUtc": "Inviato",
    "hopCount": "Passaggi",
    "deliveredRunId": "Consegnato all'esecuzione",
    "deliveredUtc": "Consegnato",
    "acknowledgedUtc": "Confermato",
    "expiresUtc": "Scade",
    "wokeRecipient": "Risveglio",
    "escalationId": "Escalation",
    "id": "ID del messaggio"
   }
  },
  "agentDetail": {
   "inbox": {
    "tab": "Posta in arrivo",
    "status": "Stato",
    "openAll": "Apri in Messaggi",
    "none": "Ancora nessun messaggio per questo agente.",
    "noneWithStatus": "Nessun messaggio per questo agente con questo stato.",
    "more": "Sono mostrati i {{shown}} più recenti su {{total}}. Apri Messaggi per vederli tutti."
   }
  },
  "home": {
   "autonomy": {
    "rejected_one": "{{count}} messaggio rifiutato dalle protezioni anti-ciclo nelle ultime 24 ore",
    "rejected_other": "{{count}} messaggi rifiutati dalle protezioni anti-ciclo nelle ultime 24 ore",
    "noneRejected": "Nessun messaggio rifiutato dalle protezioni anti-ciclo nelle ultime 24 ore"
   }
  }
 },
 "resources": {
  "messages": {
   "title": "Messaggi",
   "subtitle": "Posta tra agenti e da persone, dal più recente, con i messaggi che le protezioni anti-ciclo hanno rifiutato. Aprine uno per leggere tutta la conversazione.",
   "add": "Invia messaggio",
   "create": "Invia messaggio",
   "edit": "Messaggio",
   "view": "Dettagli del messaggio",
   "deleteTitle": "Elimina messaggio",
   "emptyTitle": "Ancora nessun messaggio",
   "emptyBody": "Gli agenti inviano messaggi con lo strumento garrison_send_message durante l'esecuzione, e le persone li inviano qui o tramite l'API. Compaiono qui appena ne viene inviato uno.",
   "columns": {
    "createdUtc": "Inviato",
    "urgency": "Urgenza",
    "status": "Stato",
    "subject": "Oggetto",
    "sender": "Da",
    "recipient": "A",
    "reason": "Rifiuto",
    "hopCount": "Passaggi",
    "deliveredRunId": "Consegnato all'esecuzione",
    "expiresUtc": "Scade",
    "escalationId": "Escalation",
    "threadId": "Conversazione",
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
})(it, {
 "nav": {
  "items": {
   "organizations": {
    "label": "Organizzazioni",
    "tip": "Alberi di unità con capi, membri, linee tra pari e budget, pubblicati come revisioni"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Organization": "Organizzazione"
  },
  "organizationStatus": {
   "Draft": "Bozza",
   "Active": "Attiva",
   "Frozen": "Congelata",
   "Retired": "Ritirata"
  },
  "budgetPeriod": {
   "Day": "Giorno",
   "Month": "Mese"
  },
  "orgRevisionState": {
   "Draft": "Bozza",
   "Published": "Pubblicata",
   "Superseded": "Sostituita"
  }
 },
 "organizations": {
  "notPublished": "Non pubblicata",
  "actions": {
   "open": "Apri organizzazione",
   "copyId": "Copia ID"
  },
  "toasts": {
   "copied": "ID dell'organizzazione copiato.",
   "unitAdded": "Unità {{name}} aggiunta all'albero di lavoro.",
   "unitSaved": "Unità {{name}} salvata.",
   "unitRemoved": "Unità {{name}} rimossa dall'albero di lavoro.",
   "published": "La revisione {{number}} è in vigore.",
   "drafted": "Revisione {{number}} salvata come bozza.",
   "rolledBack": "Ripristinata la revisione {{number}}. La revisione {{live}} è in vigore.",
   "retired": "{{name}} ritirata.",
   "reactivated": "{{name}} riattivata."
  },
  "errors": {
   "OneRoot": "Un'organizzazione ha esattamente un'unità radice, quella senza unità superiore.",
   "ParentNotFound": "L'unità superiore non fa parte di questa organizzazione.",
   "Cycle": "Un'unità non può trovarsi sotto sé stessa o sotto una delle sue unità.",
   "UnitNameTaken": "Un'altra unità di questa organizzazione ha già questo nome.",
   "LeadsTwoUnits": "Questo agente guida già un'altra unità. Un agente guida al massimo un'unità per organizzazione.",
   "PositionTaken": "Questo agente occupa già una posizione nell'organizzazione. Un agente è capo o membro di una sola unità.",
   "PeerNotFound": "Una linea tra pari punta a un'unità che non fa parte di questa organizzazione.",
   "BudgetPeriodTaken": "Un'unità ha un solo budget per periodo.",
   "BudgetInvalid": "Un budget deve essere un importo positivo in dollari statunitensi.",
   "BudgetExceedsParent": "Il budget di un'unità non può superare quello dell'unità superiore.",
   "TooManyUnits": "L'organizzazione ha già il numero massimo di unità consentito dal server.",
   "TooManyMembers": "L'unità ha già il numero massimo di membri consentito dal server.",
   "TooManyPeerLines": "L'unità ha già il numero massimo di linee tra pari consentito dal server.",
   "UnitHasChildren": "Rimuovi o sposta prima le unità sotto questa.",
   "OrganizationRetired": "L'organizzazione è ritirata. Riattivala prima di modificarla.",
   "AgentInactive": "L'agente non esiste o non è attivo.",
   "MandateMismatch": "Il custode appartiene a un altro agente. Scegli un custode dell'agente in questa posizione.",
   "RevisionMismatch": "Quella revisione appartiene a un'altra organizzazione.",
   "RevisionPublished": "Quella revisione è già stata pubblicata.",
   "RevisionNeverPublished": "Si può ripristinare solo una revisione che è stata in vigore almeno una volta.",
   "AlreadyLive": "Quella revisione è già in vigore.",
   "NothingToRollBack": "Non c'è una revisione precedente in vigore a cui tornare.",
   "StatusNotSettable": "Un'organizzazione può essere ritirata o riattivata dopo il ritiro. Gli altri stati dipendono dalla pubblicazione e dai congelamenti.",
   "NameConflict": "Un'altra organizzazione usa già questo nome."
  },
  "spend": {
   "noBudget": "{{period}}: {{spent}} spesi, nessun budget",
   "of": "{{period}}: {{spent}} su {{amount}} ({{percent}})",
   "exhausted": "Budget esaurito"
  },
  "chart": {
   "lead": "Capo",
   "noLead": "Nessun capo",
   "members": "Membri ({{count}})",
   "peers": "Linee tra pari",
   "app": "Applicazione",
   "collapse": "Comprimi le unità sotto {{name}}",
   "expand": "Espandi le unità sotto {{name}}",
   "addChild": "Aggiungi unità sotto"
  },
  "unit": {
   "addTitle": "Aggiungi un'unità",
   "editTitle": "Modifica l'unità {{name}}",
   "add": "Aggiungi unità",
   "saving": "Salvataggio...",
   "intro": "Le modifiche vanno nell'albero di lavoro. Nulla entra in vigore finché non pubblichi una revisione. I nomi contengono al massimo {{max}} caratteri.",
   "namePlaceholder": "fatturazione",
   "titlePlaceholder": "Responsabile fatturazione",
   "noParent": "Nessuna (l'unità radice)",
   "noLead": "Ancora nessun capo",
   "noMandate": "Nessun custode",
   "noApp": "Nessuna applicazione",
   "noPeers": "Aggiungi prima un'altra unità per tracciare una linea tra pari verso di essa.",
   "noBudget": "Nessun budget",
   "addMember": "Aggiungi membro",
   "sections": {
    "lead": "Capo",
    "members": "Membri e linee tra pari",
    "budgets": "Budget"
   },
   "fields": {
    "name": "Nome",
    "parentUnitId": "Riporta a",
    "description": "Descrizione",
    "leadAgentId": "Agente capo",
    "leadTitle": "Titolo del capo",
    "leadMandateId": "Custode del capo",
    "appId": "Applicazione",
    "members": "Membri",
    "memberAgent": "Agente",
    "memberTitle": "Titolo",
    "memberMandate": "Custode",
    "peerUnitIds": "Linee tra pari",
    "budgetDay": "Budget giornaliero (USD)",
    "budgetMonth": "Budget mensile (USD)"
   },
   "errors": {
    "name": "Dai all'unità un nome da 1 a {{max}} caratteri.",
    "description": "La descrizione contiene al massimo {{max}} caratteri.",
    "title": "Un titolo contiene al massimo {{max}} caratteri.",
    "memberAgent": "Scegli un agente per ogni membro oppure rimuovi la riga vuota.",
    "duplicateAgent": "Un agente può occupare una sola posizione nell'unità.",
    "budget": "Inserisci un importo maggiore di zero, oppure lascia vuoto per nessun budget."
   }
  },
  "form": {
   "errors": {
    "name": "Dai all'organizzazione un nome da 1 a {{max}} caratteri.",
    "text": "Questo campo contiene al massimo {{max}} caratteri."
   }
  },
  "diff": {
   "none": "Nessuna differenza. I due alberi sono uguali.",
   "empty": "(nessuno)",
   "between": "Da {{before}} a {{after}}.",
   "added": "Unità aggiunte ({{count}})",
   "removed": "Unità rimosse ({{count}})",
   "changed": "Unità modificate ({{count}})",
   "field": "Campo",
   "fields": {
    "name": "Nome",
    "description": "Descrizione",
    "parent": "Riporta a",
    "lead": "Capo",
    "leadTitle": "Titolo del capo",
    "leadMandate": "Custode del capo",
    "app": "Applicazione",
    "members": "Membri",
    "peers": "Linee tra pari",
    "budgets": "Budget"
   },
   "title": "Revisione {{number}} confrontata con l'organizzazione in vigore",
   "pendingTitle": "Modifiche non pubblicate",
   "nothingLive": "ancora nulla in vigore",
   "working": "l'albero di lavoro"
  },
  "revisions": {
   "label": "Revisione {{number}}",
   "rollbackOf": "(copia della revisione {{number}})"
  },
  "rollback": {
   "note": "Ripristinata la revisione {{number}} dalla dashboard."
  }
 },
 "views": {
  "organizationDetail": {
   "title": "Organizzazione",
   "heading": "Organizzazione {{name}}",
   "notFoundTitle": "Organizzazione non trovata",
   "notFoundBody": "Non esiste in questo tenant oppure è stata eliminata.",
   "live": "Aggiornamenti in tempo reale",
   "editDetails": "Modifica dettagli",
   "reactivate": "Riattiva",
   "retire": "Ritira",
   "publish": "Pubblica modifiche",
   "retiredBanner": "Questa organizzazione è ritirata. La sua catena gerarchica, le linee e i budget non si applicano più, e nulla al suo interno può cambiare finché non la riattivi.",
   "pending": "L'albero di lavoro ha modifiche non pubblicate: {{added}} aggiunte, {{changed}} modificate, {{removed}} rimosse.",
   "neverPublished": "Non c'è ancora nulla in vigore. Pubblica una revisione per mettere al lavoro questa organizzazione.",
   "reviewPending": "Esamina modifiche",
   "units": "Unità",
   "lastUpdate": "Ultima modifica",
   "tabs": {
    "chart": "Organigramma",
    "budgets": "Budget e spesa",
    "revisions": "Revisioni ({{count}})"
   },
   "chartView": "Quale albero",
   "viewWorking": "Albero di lavoro",
   "viewLive": "In vigore",
   "addUnit": "Aggiungi unità",
   "addRoot": "Aggiungi l'unità radice",
   "workingNote": "L'albero di lavoro è quello che modifichi. Pubblica una revisione per metterlo in vigore.",
   "liveNote": "La revisione in vigore: la catena gerarchica, le linee e i budget seguono questo albero.",
   "noUnitsTitle": "Ancora nessuna unità",
   "noUnitsBody": "Aggiungi l'unità radice, guidata dall'agente al vertice, poi aggiungi le unità sotto di essa.",
   "budgetsNote": "Ogni budget limita quanto l'unità e tutte le unità sotto di essa possono spendere in un giorno o in un mese UTC. La spesa conta il costo noto delle esecuzioni terminate con la revisione in vigore.",
   "noBudgetsTitle": "Nessun budget",
   "noBudgetsBody": "Modifica un'unità per assegnarle un budget giornaliero o mensile.",
   "noSpend": "Nessuna spesa registrata",
   "columns": {
    "unit": "Unità",
    "day": "Giorno",
    "month": "Mese",
    "spend": "Spesa",
    "number": "Revisione",
    "state": "Stato",
    "note": "Nota",
    "author": "Autore",
    "created": "Creata",
    "published": "Pubblicata"
   },
   "noRevisionsTitle": "Ancora nessuna revisione",
   "noRevisionsBody": "Pubblica le modifiche per salvare un'istantanea dell'albero di lavoro come revisione.",
   "current": "In vigore",
   "compare": "Confronta con quella in vigore",
   "publishRevision": "Pubblica",
   "rollback": "Ripristina",
   "publishTitle": "Pubblica modifiche",
   "publishIntro": "La pubblicazione salva un'istantanea dell'albero di lavoro come nuova revisione e la mette in vigore, con la revisione attuale di ogni custode che vi compare. Salva come bozza conserva l'istantanea senza metterla in vigore.",
   "saveDraft": "Salva come bozza",
   "publishNow": "Pubblica",
   "note": "Nota",
   "diffNote": "Nota: {{note}}",
   "removeUnitTitle": "Rimuovi unità",
   "confirmRemoveUnit": "Rimuovere l'unità {{name}} dall'albero di lavoro? Vengono rimosse anche le linee tra pari che puntano a essa. L'organizzazione in vigore non cambia finché non pubblichi.",
   "rollbackTitle": "Ripristina",
   "confirmRollback": "Rimettere in vigore la revisione {{number}} al posto della revisione {{live}}? L'albero di lavoro e i custodi che vi compaiono tornano a quella revisione, e il ripristino viene registrato come nuova revisione.",
   "retireTitle": "Ritira organizzazione",
   "confirmRetire": "Ritirare {{name}}? La sua catena gerarchica, le linee e i budget smettono di applicarsi, e non può cambiare finché non la riattivi.",
   "confirmDelete": "Eliminare {{name}} con le sue {{units}} unità e {{revisions}} revisioni? Viene eliminata anche la memoria salvata per le sue unità e per l'organizzazione. L'operazione non si può annullare."
  }
 },
 "resources": {
  "organizations": {
   "title": "Organizzazioni",
   "subtitle": "Alberi di unità, ciascuna guidata da un agente, con membri, linee tra pari e budget. Aprine una per modificarne l'organigramma e pubblicarla.",
   "add": "Crea organizzazione",
   "create": "Crea organizzazione",
   "edit": "Modifica organizzazione",
   "view": "Dettagli dell'organizzazione",
   "deleteTitle": "Elimina organizzazione",
   "emptyTitle": "Ancora nessuna organizzazione",
   "emptyBody": "Crea un'organizzazione, aggiungi un'unità radice guidata dall'agente al vertice, aggiungi le unità sotto di essa e pubblica.",
   "columns": {
    "name": "Nome",
    "status": "Stato",
    "currentRevisionNumber": "Revisione in vigore",
    "description": "Descrizione",
    "createdUtc": "Creata",
    "mission": "Missione",
    "id": "ID"
   },
   "fields": {
    "name": "Nome",
    "description": "Descrizione",
    "mission": "Missione"
   },
   "hints": {
    "name": "Da 1 a {{max}} caratteri, univoco nel tenant.",
    "description": "Facoltativa, al massimo {{max}} caratteri.",
    "mission": "A cosa serve l'organizzazione, in parole semplici. Facoltativa, al massimo {{max}} caratteri."
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
})(it, {
 "common": {
  "fieldCodes": {
   "OneRoot": "L'organizzazione ha già un'unità radice. Scegli un'unità superiore per questa unità.",
   "UnitNameTaken": "L'organizzazione ha già un'unità con questo nome.",
   "UnitNotFound": "L'organizzazione non ha nessuna unità con questo nome.",
   "UnitHasChildren": "Rimuovi prima le unità sotto questa.",
   "NoSuchPeerLine": "Queste due unità non hanno una linea tra pari.",
   "OrganizationDeleted": "La bozza elimina questa organizzazione. Ripristinala prima.",
   "PeerNotFound": "Un'unità non può avere una linea tra pari con sé stessa."
  }
 },
 "components": {
  "studio": {
   "canvas": {
    "view": {
     "label": "Cosa mostra l'area di disegno",
     "apps": "Applicazioni",
     "organizations": "Organizzazioni"
    },
    "operations": {
     "AddUnit": "Aggiunta di un'unità",
     "RemoveUnit": "Rimozione di un'unità",
     "AddUnitMember": "Aggiunta di un membro",
     "RemoveUnitMember": "Rimozione di un membro",
     "ConnectUnits": "Aggiunta di una linea tra pari",
     "DisconnectUnits": "Rimozione di una linea tra pari"
    },
    "org": {
     "none": "La bozza non contiene ancora un'organizzazione. Scrivi qui sopra un nome di organizzazione e un nome di unità per iniziarne una; la sua prima unità è la radice.",
     "flowLabel": "Organizzazione {{organization}}",
     "picker": "Organizzazione",
     "units": "Unità",
     "root": "Unità radice",
     "peers": "Linee tra pari",
     "orgTitle": "Organizzazione {{name}}",
     "orgHint": "Seleziona un'unità per modificarne i membri e le linee tra pari. Le unità stanno dentro l'unità a cui riportano.",
     "deleted": "La bozza elimina questa organizzazione. Le sue unità non possono cambiare finché non viene ripristinata.",
     "unitTitle": "Unità {{name}}",
     "reportsTo": "Riporta a",
     "lead": "Capo",
     "members": "Membri ({{count}})",
     "noMembers": "Nessun membro oltre al capo.",
     "memberAgent": "Agente",
     "memberTitle": "Titolo (facoltativo)",
     "addMember": "Aggiungi membro",
     "removeMember": "Rimuovi",
     "noPeers": "Nessuna linea tra pari.",
     "disconnect": "Scollega",
     "addChild": "Aggiungi unità sotto",
     "startPeer": "Inizia linea tra pari",
     "removeUnit": "Rimuovi unità",
     "peerTitle": "Linea tra pari {{from}} e {{to}}",
     "peerHint": "{{from}} e {{to}} possono scambiarsi messaggi direttamente, senza passare da un responsabile comune.",
     "peerList": "Linee tra pari ({{total}})",
     "noPeerLines": "Ancora nessuna linea tra pari. Seleziona un'unità e iniziane una, oppure trascina dal punto destro di un'unità a un'altra unità.",
     "removeTitle": "Rimuovi unità",
     "removeMessage": "Rimuovere l'unità {{name}} dall'organizzazione {{organization}} in questa bozza? Vengono rimosse anche le linee tra pari che la nominano. Un'unità con unità sotto non può essere rimossa.",
     "toolbar": {
      "label": "Strumenti dell'organizzazione",
      "addUnit": "Aggiungi unità",
      "unitPlaceholder": "Nome dell'unità",
      "parent": "Riporta a",
      "noParent": "Nessuna unità superiore (radice)",
      "under": "Sotto {{name}}",
      "lead": "Agente capo",
      "leadPlaceholder": "Agente capo (facoltativo)",
      "leadTitle": "Titolo del capo (facoltativo)",
      "organization": "Organizzazione",
      "add": "Aggiungi"
     },
     "connectBar": {
      "message": "Tracciamento di una linea tra pari da {{name}}."
     },
     "keys": {
      "tab": "Tab scorre le unità, ogni unità prima delle unità sotto di essa.",
      "select": "Invio o Spazio seleziona l'unità con il focus e ne apre le proprietà.",
      "peer": "C su un'unità avvia una linea tra pari da essa; C o Invio su un'altra unità la completa.",
      "remove": "Canc rimuove l'unità con il focus, dopo una conferma.",
      "add": "N porta al campo Aggiungi unità.",
      "peers": "Nell'elenco delle linee tra pari, Invio seleziona una linea e Canc la rimuove.",
      "escape": "Esc annulla una linea tra pari che hai iniziato."
     },
     "node": {
      "root": "Radice",
      "reportsTo": "riporta a {{name}}",
      "lead": "Capo: {{name}}",
      "noLead": "Nessun capo",
      "members": "membri {{list}}"
     },
     "summary": {
      "none": "Non c'è nessuna organizzazione da descrivere.",
      "units_one": "L'organizzazione {{organization}} ha {{count}} unità.",
      "units_other": "L'organizzazione {{organization}} ha {{count}} unità.",
      "root": "L'unità radice è {{name}}.",
      "peerCount_one": "C'è {{count}} linea tra pari.",
      "peerCount_other": "Ci sono {{count}} linee tra pari.",
      "unitRoot": "{{name}} è l'unità radice e {{lead}}.",
      "unitChild": "{{name}} riporta a {{parent}} e {{lead}}.",
      "ledBy": "è guidata da {{name}}",
      "noLead": "non ha un capo",
      "peer": "{{from}} e {{to}} hanno una linea tra pari."
     },
     "a11y": {
      "unit": "Premi Invio o Spazio per selezionare questa unità. Premi C per iniziare una linea tra pari, oppure Canc per rimuovere l'unità.",
      "peer": "Una linea tra pari tra due unità.",
      "handle": "Trascina su un'altra unità per tracciare una linea tra pari"
     },
     "announce": {
      "added": "Unità {{name}} aggiunta a {{organization}}.",
      "peerStart": "Tracciamento di una linea tra pari da {{name}}. Spostati sull'altra unità e premi Invio, oppure premi Esc per annullare.",
      "connected": "Ora {{from}} e {{to}} hanno una linea tra pari.",
      "disconnected": "{{from}} e {{to}} non hanno più una linea tra pari.",
      "memberAdded": "{{name}} aggiunto all'unità {{unit}}.",
      "memberRemoved": "{{name}} rimosso dall'unità {{unit}}.",
      "removed": "Unità {{name}} rimossa da {{organization}}."
     }
    }
   }
  }
 }
});
