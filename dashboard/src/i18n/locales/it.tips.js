// Italian tooltip (tips.*) and relationship explainer (explainers.*) text. Merged into it.js. Mirrors en.tips.js key for key.

const TELEMETRY = {
  approvalWaitMs: 'Attesa di approvazione: tempo totale che questa esecuzione ha passato in attesa di approvazioni di autorizzazione decise da una persona o da un timeout. Le chiamate decise subito da una regola o dal predefinito della distribuzione non aggiungono nulla. Misurato dal server; n/d quando l\'esecuzione non ha mai atteso.',
  delegationWaitMs: 'Attesa di delega: quanto questa esecuzione ha atteso le esecuzioni figlie avviate tramite Garrison (altri agenti a cui ha delegato), in base ai timestamp del server di quelle esecuzioni. Zero o n/d se l\'esecuzione non ha delegato nulla.',
  timeToFirstTokenExcludingDelegationMs: 'Tempo al primo token senza delega: il tempo al primo token meno il tempo che l\'esecuzione ha passato ad attendere le esecuzioni delegate prima del suo primo output. Usalo per confrontare gli agenti che delegano con quelli che non lo fanno. Misurato con i timestamp del server; mai negativo.',
  timeToFirstTokenMs: 'Tempo al primo token: dal momento in cui il worker avvia il processo dell\'harness fino a quando il modello produce il primo output (testo o ragionamento). Include l\'avvio dell\'harness, quindi una CLI lenta ad avviarsi si nota qui. Misurato sul worker con un orologio monotono.',
  streamingMs: 'Tempo di streaming: dal primo all\'ultimo output del modello. Indica per quanto tempo il modello ha effettivamente prodotto output. Misurato sul worker con un orologio monotono.',
  executionMs: 'Tempo di esecuzione: dall\'avvio del processo dell\'harness alla sua uscita, misurato dal worker. I server meno recenti che non lo riportano usano i timestamp di avvio e completamento.',
  queueMs: 'Tempo in coda: quanto l\'esecuzione ha atteso tra l\'accodamento e il lease da parte di un nodo worker. Valori alti indicano che ogni nodo idoneo era occupato o che nessuno corrispondeva alle regole di posizionamento. Misurato dal server.',
  totalMs: 'Tempo totale: dall\'accodamento al completamento, cioè tempo in coda più esecuzione più invio del risultato. Misurato dal server.',
  outputTokensPerSecond: 'Token di output al secondo: token di output divisi per il tempo di streaming. Mostrato solo se lo streaming è durato almeno 100 ms, perché finestre più brevi danno valori privi di significato.',
  inputTokens: 'Token di input riportati dall\'harness per l\'intera esecuzione, inclusi prompt di sistema, risultati degli strumenti e cronologia della conversazione su tutti i turni.',
  outputTokens: 'Token di output generati dal modello in tutti i turni dell\'esecuzione, come riportati dal parser dell\'harness.',
  cachedTokens: 'Token di input serviti dalla cache dei prompt del provider. I token in cache di solito costano meno, quindi una quota alta qui contiene i costi.',
  reasoningTokens: 'Token di ragionamento, quando l\'harness li riporta separatamente (per esempio l\'output di ragionamento di Codex). Zero quando l\'harness non li distingue.',
  toolCallCount: 'Numero di eventi di chiamata a strumenti nell\'esecuzione: strumenti MCP, strumenti predefiniti dell\'harness e chiamate ad altri agenti Garrison. Contati dal worker dal flusso di eventi.',
  costUsd: 'Costo in dollari USA come riportato dall\'harness. Indicato come stimato quando Garrison lo ha calcolato dal numero di token invece di riceverlo dall\'harness.',
  firstTokenUtc: 'Ora effettiva (UTC, mostrata nel tuo fuso orario) del primo evento di output del modello nell\'esecuzione.',
  lastTokenUtc: 'Ora effettiva (UTC, mostrata nel tuo fuso orario) dell\'ultimo evento di output del modello nell\'esecuzione.'
};

const FILE_ITEMS = {
  baseDirectory: 'La directory rispetto a cui il percorso è relativo: la directory di configurazione dell\'esecuzione, l\'area di lavoro o la directory HOME dell\'esecuzione.',
  pathTemplate: 'Percorso relativo del file da scrivere prima dell\'avvio. Sono ammesse variabili di modello, per esempio settings/{{run.id}}.json.',
  contentTemplate: 'Modello renderizzato nel contenuto del file. Può fare riferimento a variabili e a segreti associati con {{secret.alias}}.',
  condition: 'Espressione di modello; se il risultato è vuoto o false il file non viene scritto.',
  mode: 'Permessi Unix del file in ottale, per esempio 0600 per i file che contengono credenziali.',
  isSecret: 'Tratta il contenuto renderizzato come segreto: non viene mai registrato nei log ed è oscurato nelle anteprime di compilazione.'
};

const tips = {
  fieldWarnings: { dismiss: 'Nasconde questo avviso. Il record è già salvato con i valori elencati qui.' },
  approvals: {
    awaiting_one: 'L\'harness ha chiesto prima di una chiamata a strumento e attende una persona. Apri la scheda Approvazioni per consentirla o negarla ({{count}} in attesa).',
    awaiting_other: 'L\'harness ha chiesto prima di alcune chiamate a strumenti e attende una persona. Apri la scheda Approvazioni per consentirle o negarle ({{count}} in attesa).',
    awaiting_many: 'L\'harness ha chiesto prima di alcune chiamate a strumenti e attende una persona. Apri la scheda Approvazioni per consentirle o negarle ({{count}} in attesa).',
    decide: {
      decision: 'Scegli se l\'harness può effettuare questa chiamata a strumento. L\'esecuzione prosegue appena invii.',
      allow: 'Lascia che l\'harness effettui questa chiamata a strumento. L\'esecuzione prosegue con essa.',
      deny: 'Rifiuta questa chiamata a strumento. L\'harness riceve il messaggio di rifiuto e prosegue senza di essa.',
      reason: 'Nota facoltativa salvata con la decisione e scritta nel log di audit. In caso di rifiuto viene inoltrata all\'agente.',
      remember: 'Aggiunge anche una regola alla distribuzione di questa approvazione, così lo stesso tipo di chiamata viene deciso automaticamente la prossima volta.',
      rulePattern: 'La regola da aggiungere, nella sintassi delle regole di Claude Code. Parte dalla regola suggerita; allargala o restringila prima di salvare.',
      submitAllow: 'Consenti ora la chiamata a strumento. La decisione è definitiva e non si può cambiare in seguito.',
      submitDeny: 'Nega ora la chiamata a strumento. La decisione è definitiva e non si può cambiare in seguito.'
    }
  },
  approvalCheck: {
    toolName: 'Nome dello strumento come lo riporta l\'harness, per esempio Bash, Edit, WebFetch o uno strumento MCP come mcp__github__create_issue.',
    inputs: {
      command: 'Il comando shell da provare, per esempio npm run build && npm test. Ogni sottocomando deve essere consentito.',
      url: 'L\'URL che lo strumento recupererebbe. Le regole WebFetch confrontano il suo dominio.',
      query: 'La query di ricerca che lo strumento invierebbe.',
      file_path: 'Percorso del file che lo strumento leggerebbe o modificherebbe, relativo all\'area di lavoro o assoluto.',
      notebook_path: 'Percorso del notebook che lo strumento modificherebbe.',
      pattern: 'Il pattern glob o di ricerca che lo strumento userebbe.'
    },
    run: 'Valuta le regole salvate della distribuzione per questa chiamata a strumento e mostra il risultato. Non viene registrato nulla e nessuna esecuzione è interessata.',
    suggestedRule: 'La regola che «memorizza» aggiungerebbe per questa chiamata. Copiala nelle regole qui sopra per coprire chiamate simili.'
  },
  ids: { deleted: 'Questo record è stato eliminato. ID {{id}}. Il pulsante di copia copia l\'ID.', named: 'ID {{id}}. Il pulsante di copia copia l\'ID per l\'API, gli SDK o una richiesta di assistenza.' },
  markdown: {
    column: 'Colonna {{name}} di una tabella nell\'output dell\'agente. Le tabelle larghe scorrono in orizzontale nella loro cornice.',
    showRaw: 'Mostra il testo esatto restituito dall\'agente, senza formattazione Markdown, per esaminarlo o copiarlo.',
    showRendered: 'Mostra di nuovo il testo formattato in Markdown, con tabelle, elenchi, blocchi di codice e link.',
    copy: 'Copia negli appunti il testo grezzo del risultato, sintassi Markdown inclusa.',
    link: 'Apre {{href}} in una nuova scheda. Il link proviene dall\'output dell\'agente, quindi controlla l\'indirizzo prima di fidarti.'
  },
  common: {
    fields: {
      name: 'Nome univoco di questo record all\'interno del tenant. Altri record e manifest lo richiamano con questo nome.',
      description: 'Nota libera per le persone. Spiega a cosa serve questo record e non viene usata durante l\'esecuzione.',
      active: 'I record inattivi vengono conservati ma ignorati. Disattiva questa opzione per sospendere qualcosa senza eliminarlo.',
      id: 'Identificatore generato dal sistema con un prefisso di tipo. Usalo nelle chiamate API e negli script; non cambia mai.',
      createdUtc: 'Quando è stato creato questo record. Passa il mouse sul valore per vedere data e ora esatte.',
      lastUpdateUtc: 'Quando questo record è stato modificato l\'ultima volta.',
      isBuiltIn: 'I record predefiniti sono forniti con Garrison e sono di sola lettura. I record personalizzati sono stati creati in questo tenant e si possono modificare.',
      expiresUtc: 'Dopo questo momento il record smette di funzionare. Lascia vuoto per nessuna scadenza.'
    }
  },
  explainer: {
    reopen: 'Mostra di nuovo la spiegazione di {{topic}}: cosa gestisce questa pagina e come si collega al resto di Garrison.',
    dismiss: 'Nascondi questa spiegazione. Al suo posto resta un piccolo pulsante «Informazioni su» per riaprirla in qualsiasi momento.'
  },
  nav: {
    approvalsBadge_one: '{{count}} chiamata a strumento attende che una persona la consenta o la neghi. Apri Approvazioni per decidere.',
    approvalsBadge_other: '{{count}} chiamate a strumenti attendono che una persona le consenta o le neghi. Apri Approvazioni per decidere.',
    approvalsBadge_many: '{{count}} chiamate a strumenti attendono che una persona le consenta o le neghi. Apri Approvazioni per decidere.',
    hubs: {
      approvals: 'La casella delle approvazioni: chiamate a strumenti richieste dagli agenti che attendono una persona, e lo storico di ogni decisione per regola, predefinito, persona o timeout.',
      home: 'Inizia da qui: conteggi in tempo reale di agenti, esecuzioni e nodi worker, traffico API, errori recenti e scorciatoie per le attività comuni.',
      invoke: 'Invia un messaggio a un agente dal browser e segui la trascrizione in streaming, senza scrivere codice.',
      runs: 'Ogni invocazione di agente, con trascrizione, esito e telemetria, più la coda del lavoro in attesa di un nodo.',
      analytics: 'Grafici di velocità delle esecuzioni, uso dei token, costi, esiti e chiamate a strumenti nel tempo, filtrabili per agente, harness e distribuzione.',
      agents: 'Gli agenti che i chiamanti invocano per nome e le distribuzioni che decidono come viene effettivamente eseguito ciascuno.',
      configuration: 'I componenti usati dalle distribuzioni: profili harness, modelli di prompt, server MCP, segreti, aree di lavoro, archivi di artefatti e manifest.',
      fleet: 'Le repliche del piano di controllo che servono l\'API e pianificano le esecuzioni, i nodi worker che le eseguono e i pool di nodi che raggruppano i worker per il posizionamento.',
      access: 'Chi può accedere e cosa può fare: tenant, utenti, chiavi di accesso, ruoli e assegnazioni di ruoli.',
      monitoring: 'Indaga su cosa è successo: richieste API registrate, traccia di audit di sicurezza e lo strumento interattivo Esplora API.',
      system: 'Impostazioni del server ed endpoint, versioni e identità del server a cui sei connesso.'
    },
    tabs: {
      runs: 'Cerca, filtra e ispeziona le singole esecuzioni. Aprine una per leggere trascrizione, risultato e telemetria, oppure per annullarla e riprovarla.',
      queue: 'Esecuzioni in attesa di un nodo, assegnate o in esecuzione in questo momento, raggruppate per agente e harness.',
      agents: 'Agenti con nome che i chiamanti invocano tramite REST, MCP o A2A. L\'agente è l\'identità; le sue distribuzioni decidono come viene eseguito.',
      deployments: 'Come viene eseguito ogni agente: profilo harness, modello, prompt, server MCP, segreti, area di lavoro, posizionamento, limiti e peso del traffico.',
      harnessProfiles: 'Ricette per avviare un harness CLI in modalità headless: eseguibile, argomenti, ambiente, file e parsing dell\'output.',
      promptTemplates: 'Ogni prompt e file di configurazione generato che Garrison invia a un harness, con versioni e anteprima in tempo reale.',
      mcpServers: 'Server di strumenti che gli agenti possono usare. Registrali qui, poi associali alle distribuzioni.',
      secrets: 'Chiavi API e token cifrati. Le distribuzioni li associano tramite alias; i valori non vengono mai più mostrati.',
      workspaces: 'Modelli per la directory in cui lavora un\'esecuzione: vuota, clonata da Git o popolata con file.',
      agentAssets: 'Prompt di sistema, competenze, file di riferimento e modelli di documento con versioni, fissati dalle revisioni degli agenti, con caricamento e cronologia.',
      artifactStores: 'Destinazioni per i file prodotti dalle esecuzioni che vuoi conservare dopo la loro fine.',
      modelPrices: "Tariffe in USD configurate dall’operatore per stimare il costo quando l’harness non lo comunica. Il costo comunicato, anche zero, ha precedenza.",
      usageQuotas: "Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.",
      manifests: 'Applica o esporta l\'intera configurazione del tenant come YAML, così può stare nel controllo del codice sorgente.',
      nodes: 'Macchine o pod worker che prelevano le esecuzioni ed eseguono gli harness. Qui puoi isolarli, svuotarli o ispezionarli.',
      controlNodes: 'Repliche del server (nodi di controllo) che servono REST, MCP e A2A e pianificano le esecuzioni. Una di esse è il leader e si occupa della manutenzione del cluster. Stato, versione e attività in sola lettura.',
      nodePools: 'Gruppi di nodi con nome, eventualmente riservati a tenant specifici. Le distribuzioni possono richiedere un pool.',
      tenants: 'Organizzazioni isolate su questo server, ciascuna con i propri utenti, agenti, segreti ed esecuzioni.',
      users: 'Persone che accedono con email e password. Ogni utente può possedere chiavi di accesso.',
      credentials: 'Chiavi di accesso per script, SDK e servizi. Ogni chiave appartiene a un utente e agisce con le autorizzazioni di quell\'utente o con meno.',
      roles: 'Insiemi di autorizzazioni con un nome, più le autorizzazioni stesse. Assegna ruoli per concedere l\'accesso.',
      assignments: 'Concessioni che collegano un ruolo a un utente o a una chiave di accesso, per l\'intero tenant o per una singola risorsa.',
      requests: 'Richieste API registrate da questo server, con header, corpo, tempi e stato, per il debug delle integrazioni.',
      audit: 'Eventi di sicurezza e configurazione: accessi, rifiuti, modifiche ai segreti, applicazioni di manifest e modifiche ai nodi.',
      explorer: 'Scegli qualsiasi operazione API dal documento OpenAPI del server, compila i parametri ed eseguila dal vivo.',
      settings: 'Impostazioni del server e del cluster, con la loro origine e l\'indicazione se una modifica si applica subito o richiede un riavvio.',
      serverInfo: 'Indirizzi REST, MCP e A2A, versioni di server e dashboard e l\'identità con cui hai effettuato l\'accesso.',
      conversations: 'Conversazioni a più turni con gli agenti: ogni turno è un\'esecuzione che riprende la sessione del turno precedente. Aprine una per leggerne i turni e inviare il messaggio successivo.'
    },
    subtabs: {
      roles: 'I ruoli raggruppano autorizzazioni sotto un unico nome, come Operator o Invoker. Assegna un ruolo per concedere a qualcuno tutte le sue autorizzazioni.',
      permissions: 'Regole singole che consentono o negano operazioni su tipi di risorsa. I ruoli sono composti da queste; il rifiuto prevale sempre.',
      userAssignments: 'Concedi ruoli alle persone che accedono con email e password.',
      credentialAssignments: 'Concedi ruoli alle chiavi di accesso usate dall\'automazione. Mantieni le chiavi più limitate dei loro proprietari.'
    },
    setup: 'Apri la «Configurazione guidata»: salva una credenziale dell\'harness, applica un agente di esempio ed eseguilo una volta per verificare che tutto funzioni.',
    tour: 'Rivedi il breve tour guidato che mostra la navigazione, il contesto e dove si trova la configurazione.',
    skipToContent: 'Salta la navigazione e vai direttamente al contenuto principale della pagina. Utile soprattutto per chi usa la tastiera.'
  },
  topbar: {
    toggleSidebar: 'Comprimi o espandi la barra laterale di navigazione. Sugli schermi piccoli apre la navigazione in sovrimpressione.',
    server: 'Il server Garrison con cui comunica questa console: {{url}}. Il punto indica se il suo controllo di integrità ha esito positivo.',
    health: {
      healthy: 'Il server ha risposto al controllo di integrità negli ultimi 30 secondi.',
      unhealthy: 'Il server non ha risposto al controllo di integrità. Le richieste da questa pagina probabilmente non andranno a buon fine.',
      unknown: 'In attesa del primo risultato del controllo di integrità dal server.'
    },
    copyServer: 'Copia l\'URL del server, per esempio per configurare un SDK o un comando curl.',
    switchTenant: 'Gli amministratori di sistema possono vedere qualsiasi tenant. Ogni pagina mostra i dati del tenant selezionato.',
    tenant: 'Stai lavorando nel tenant {{tenant}}. Ogni record ed esecuzione che vedi appartiene a questo tenant.',
    principal: 'Hai effettuato l\'accesso come {{name}}. Le azioni che compi vengono registrate con questa identità.',
    role: 'Il tuo livello di accesso più alto in questo tenant. Determina quali pagine e azioni sono disponibili.',
    liveOn: 'Connesso al server tramite WebSocket, quindi le modifiche a esecuzioni e nodi compaiono in tempo reale.',
    liveOff: 'Nessuna connessione in tempo reale. Le pagine si aggiornano con propri timer, quindi le modifiche possono impiegare qualche secondo a comparire.',
    github: 'Apri il repository sorgente di Garrison su GitHub in una nuova scheda, per documentazione e issue.',
    themeLight: 'Passa al tema chiaro. La scelta viene ricordata in questo browser.',
    themeDark: 'Passa al tema scuro. La scelta viene ricordata in questo browser.',
    logout: 'Esci e revoca questa sessione del browser. Dovrai accedere di nuovo.',
    language: 'Cambia la lingua di visualizzazione. Anche date e numeri seguono la lingua, e la scelta viene ricordata.'
  },
  login: {
    passwordTab: 'Accedi come persona con tenant, email e password.',
    keyTab: 'Accedi con una chiave di accesso e una chiave segreta, la stessa coppia usata da script e SDK.',
    serverUrl: 'Indirizzo base di un altro server Garrison, per esempio 127.0.0.1:9700. Il browser lo raggiunge solo se la dashboard ne consente l\'origine (GARRISON_CSP_CONNECT_SRC).',
    useDifferentServer: 'Accedi a un server diverso da quello con cui è stata distribuita questa console. La sua origine deve essere consentita in GARRISON_CSP_CONNECT_SRC.',
    useDefaultServer: 'Nascondi il campo URL del server e accedi al server con cui è stata distribuita questa console.',
    serverInUse: 'Il server Garrison a cui accede questa console: GARRISON_API_URL se impostato, altrimenti l\'origine di questa pagina, che fa da proxy per l\'API.',
    tenantId: 'Il tenant a cui appartiene il tuo account. Il tenant predefinito locale si chiama default.',
    email: 'L\'indirizzo email del tuo account utente in questo tenant.',
    password: 'La password del tuo account. Viene inviata una sola volta per ottenere un token di sessione e non viene mai salvata dall\'app nel browser.',
    accessKey: 'La parte pubblica di una chiave di accesso, che inizia con access_. Crea le chiavi in Accesso > Chiavi di accesso.',
    secretKey: 'La parte privata della chiave di accesso. È stata mostrata una sola volta quando la chiave è stata creata o ruotata.',
    submit: 'Verifica le credenziali con il server e apri la console per il tuo tenant.'
  },
  table: {
    selectAll: 'Seleziona o deseleziona tutte le righe di questa pagina, per esempio per eliminarle insieme.',
    selectRow: 'Seleziona questa riga per un\'azione di massa come l\'eliminazione.',
    sortServer: '{{tip}} Fai clic per ordinare l\'intero elenco in base a questa colonna; fai di nuovo clic per invertire l\'ordine.',
    sortPageOnly: '{{tip}} Fai clic per ordinare solo le righe di questa pagina; il server non può ordinare in base a questa colonna.',
    clearSelection: 'Deseleziona tutte le righe selezionate senza modificare nulla.',
    pageSize: 'Quante righe caricare per pagina. Le pagine più grandi richiedono più tempo per il caricamento. La scelta viene ricordata per ogni tabella.',
    first: 'Vai alla prima pagina dei risultati.',
    prev: 'Torna indietro di una pagina dei risultati.',
    jump: 'Digita un numero di pagina tra 1 e {{total}} e premi Invio per andarci direttamente.',
    next: 'Vai avanti di una pagina dei risultati.',
    last: 'Vai all\'ultima pagina dei risultati.',
    refresh: 'Ricarica ora questo elenco dal server, mantenendo pagina, filtri e ordinamento.',
    autoRefresh: 'Ricarica questi dati automaticamente a intervalli. Se disattivato, i dati restano fermi mentre leggi.',
    selectColumns: 'Scegli quali colonne mostra la tabella. La scelta viene ricordata per ogni tabella in questo browser.',
    columnPinned: '{{column}} è sempre visibile perché senza di essa le righe non si possono identificare.',
    columnToggle: 'Mostra o nascondi la colonna {{column}}. {{tip}}',
    actionsFor: 'Apri le azioni per {{name}}: visualizza, modifica, duplica, visualizza JSON, elimina e azioni specifiche del record.',
    actionsMenu: 'Apri le azioni disponibili per questa riga.',
    actionsColumn: 'Azioni per riga. Fai clic sui tre puntini per visualizzare, modificare, duplicare, ispezionare il JSON o eliminare.',
    search: 'Digita parte di un nome per restringere l\'elenco. La ricerca viene eseguita sul server quando smetti di digitare.',
    clearFilters: 'Rimuovi il testo di ricerca e tutti i filtri e mostra di nuovo l\'elenco completo.',
    bulkDelete: 'Elimina tutte le righe selezionate. Ti verrà chiesta prima una conferma.'
  },
  filters: {
    decisionSource: 'Mostra solo le approvazioni decise in un certo modo: da una regola, dal predefinito della distribuzione, da una persona, da un timeout o da un\'esecuzione fermata.',
    runId: 'Mostra solo le approvazioni di un\'esecuzione. Incolla un ID di esecuzione come run_...; l\'elenco si aggiorna quando smetti di digitare.',
    status: 'Mostra solo i record in questo stato. Scegli Tutti per rimuovere il filtro.',
    harnessType: 'Mostra solo i record di un harness, come Claude Code o Codex.',
    kind: 'Mostra solo i record di un tipo. Scegli Tutti per rimuovere il filtro.',
    eventType: 'Mostra solo gli eventi di audit di un tipo, come accessi non riusciti o modifiche ai segreti.',
    fromUtc: 'Mostra solo i record creati a partire da questo momento (nel tuo fuso orario locale).',
    toUtc: 'Mostra solo i record creati prima di questo momento (nel tuo fuso orario locale).',
    method: 'Mostra solo le richieste che hanno usato questo metodo HTTP.',
    statusCode: 'Mostra solo le richieste che hanno restituito questo codice di stato HTTP, per esempio 404 o 500.',
    pathContains: 'Mostra solo le richieste il cui percorso contiene questo testo, per esempio /agents.',
    tenantId: 'Mostra solo le richieste effettuate in questo tenant. Lascia vuoto per tutti i tenant.',
    apply: 'Esegui la ricerca con i valori dei filtri qui sopra.',
    clear: 'Svuota tutti i filtri qui sopra e ripeti la ricerca.',
    agentId: 'Mostra solo i record di un agente. Scegli Tutti per rimuovere il filtro.'
  },
  form: {
    option: 'Includi {{option}} in {{field}}. Le opzioni selezionate vengono salvate; quelle non selezionate vengono escluse.',
    reveal: 'Mostra il valore digitato in chiaro per controllarlo prima di salvare.',
    hide: 'Maschera di nuovo il valore così chi guarda il tuo schermo non può leggerlo.',
    key: 'Chiave di questa voce di {{field}}. Le chiavi devono essere univoche nell\'elenco.',
    value: 'Valore di questa voce di {{field}}. Variabili di modello e riferimenti a segreti sono ammessi dove indicato.',
    removeRow: 'Rimuovi questa voce dall\'elenco. Nulla viene salvato finché non fai clic su Salva.',
    addRow: 'Aggiungi una voce chiave e valore vuota a {{field}}.',
    moveUp: 'Sposta questo elemento di una posizione prima. Qui l\'ordine conta, per esempio negli elenchi di argomenti.',
    moveDown: 'Sposta questo elemento di una posizione dopo. Qui l\'ordine conta, per esempio negli elenchi di argomenti.',
    removeItem: 'Rimuovi questo elemento dall\'elenco. Nulla viene salvato finché non fai clic su Salva.',
    addItem: 'Aggiungi un nuovo elemento vuoto a {{field}} e compilane i campi.'
  },
  actions: {
    openDetail: 'Apri la pagina di dettaglio completa di questo record.',
    view: 'Apri questo record in sola lettura per vedere ogni campo senza rischio di modificarlo.',
    edit: 'Apri questo record in un modulo per modificarlo. Le modifiche si applicano quando fai clic su Salva.',
    duplicate: 'Crea un nuovo record precompilato con i valori di questo e un nome con suffisso -copy. Nulla viene creato finché non salvi.',
    viewJson: 'Mostra il JSON grezzo esattamente come lo restituisce l\'API, per il debug o per copiarlo negli script.',
    delete: 'Elimina definitivamente questo record. Ti verrà chiesta una conferma e l\'operazione non si può annullare.',
    add: 'Crea un nuovo record di questo tipo in un modulo.',
    switchToEdit: 'Passa da questa vista di sola lettura a un modulo modificabile.',
    retryLoad: 'Prova di nuovo a caricare questi dati dal server.'
  },
  modal: {
    close: 'Chiudi questa finestra. Sul server non cambia nulla.',
    dismiss: 'Chiudi questa finestra senza salvare. Puoi anche premere Esc.',
    cancelForm: 'Chiudi il modulo e scarta le modifiche non salvate.',
    back: 'Torna al passaggio precedente del modulo. I valori inseriti vengono mantenuti.',
    next: 'Vai al passaggio successivo del modulo. Nulla viene salvato finché non fai clic su Salva.',
    saveEdit: 'Salva le modifiche a questo record. Il server le convalida e segnala ogni campo che richiede attenzione.',
    saveCreate: 'Crea il record con questi valori. Il server li convalida e segnala ogni campo che richiede attenzione.',
    saveValue: 'Invia il valore al server. Viene cifrato all\'arrivo e non viene mai più mostrato.'
  },
  confirm: {
    delete: 'Sì, elimina definitivamente questo record.',
    bulkDelete: 'Sì, elimina definitivamente tutti i record selezionati.',
    cancel: 'Torna indietro senza fare nulla.',
    danger: 'Esegui questa azione distruttiva. Non si può annullare.',
    confirm: 'Esegui l\'azione descritta qui sopra.'
  },
  copy: {
    id: 'Copia l\'ID del record negli appunti, da usare con la REST API, gli SDK o i filtri.',
    value: 'Copia questo valore negli appunti.',
    block: 'Copia l\'intero blocco negli appunti, pronto da incollare in un terminale o in un file.',
    done: 'Copiato negli appunti.'
  },
  chart: {
    ranges: {
      hour: 'Mostra gli ultimi 60 minuti, in intervalli di un minuto.',
      day: 'Mostra le ultime 24 ore. Gli intervalli sono dimensionati per mantenere il grafico leggibile.',
      week: 'Mostra gli ultimi 7 giorni. Gli intervalli sono dimensionati per mantenere il grafico leggibile.',
      month: 'Mostra gli ultimi 30 giorni. Gli intervalli sono dimensionati per mantenere il grafico leggibile.',
      custom: 'Scegli tu l\'ora di inizio e di fine. Il server rifiuta gli intervalli molto lunghi.'
    },
    refresh: 'Ricarica ora i dati del grafico dal server.',
    tenant: 'Mostra l\'attività delle richieste per un tenant o per tutti i tenant del server.'
  },
  badges: {
    approvalsOn_one: 'Approvazioni attive: l\'harness chiede prima delle chiamate a strumenti, e {{count}} regola ne decide alcune automaticamente.',
    approvalsOn_other: 'Approvazioni attive: l\'harness chiede prima delle chiamate a strumenti, e {{count}} regole ne decidono alcune automaticamente.',
    approvalsOn_many: 'Approvazioni attive: l\'harness chiede prima delle chiamate a strumenti, e {{count}} regole ne decidono alcune automaticamente.',
    approvalsOff: 'Approvazioni disattivate: l\'harness effettua le chiamate a strumenti secondo le proprie impostazioni di autorizzazione, senza chiedere.',
    active: 'Attivo: questo record è in uso.',
    inactive: 'Inattivo: questo record viene conservato ma ignorato finché non viene riattivato.',
    builtIn: 'Predefinito: fornito con Garrison e di sola lettura. Clonalo per creare una versione modificabile.',
    custom: 'Personalizzato: creato in questo tenant, quindi si può modificare ed eliminare.',
    systemAdmin: 'Amministratore di sistema: può gestire tutti i tenant e salta i controlli di autorizzazione.',
    tenantAdmin: 'Amministratore del tenant: può gestire tutto all\'interno di questo tenant.',
    user: 'Utente normale: l\'accesso deriva solo dalle assegnazioni di ruoli.',
    role: 'Questa assegnazione concede il ruolo {{role}} e ogni autorizzazione che contiene.',
    deploymentActive: 'Attiva: questa distribuzione riceve la sua quota del traffico dell\'agente.',
    deploymentInactive: 'Inattiva: questa distribuzione non riceve traffico, ma può comunque essere indicata esplicitamente durante l\'invocazione.'
  },
  permissions: {
    source: 'Il ruolo da cui proviene questa concessione. Correggi l\'accesso modificando quel ruolo o l\'assegnazione che lo concede.',
    type: '«Consenti» concede le operazioni; «Nega» le blocca anche quando un altro ruolo le consente.',
    resources: 'I tipi di record coperti da questa concessione, come Agent o Run.',
    operations: 'Cosa si può fare su quei record, come Read, Create o Execute.',
    scope: 'L\'ambito «Tenant» copre ogni record del tipo; l\'ambito «Risorsa» copre un singolo record specifico.'
  },
  compilePreview: {
    input: 'Un messaggio di esempio del chiamante con cui compilare. Diventa {{input.message}} nel modello di prompt Attività.',
    compile: 'Compila questa distribuzione esattamente come farebbe un\'esecuzione, senza avviarne una, e mostra riga di comando, file e ambiente.'
  },
  secretOnce: {
    accessKey: 'La chiave di accesso pubblica. Identifica la chiave di accesso e si può salvare in sicurezza nella configurazione.',
    secretKey: 'La chiave segreta. Viene mostrata solo questa volta; copiala ora nel tuo password manager o archivio di segreti.',
    done: 'Chiudi questa finestra. La chiave segreta non si potrà recuperare in seguito, solo ruotare.'
  },
  wizard: {
    skip: 'Chiudi la procedura guidata e non riproporla per questo tenant. Puoi riaprirla dalla barra laterale.',
    back: 'Torna al passaggio precedente della procedura guidata.',
    start: 'Inizia la configurazione: aggiungi una credenziale, applica un agente di esempio e provalo.',
    saveSecret: 'Salva la credenziale cifrata in questo tenant e passa al passaggio successivo.',
    skipStep: 'Continua senza aggiungere una credenziale. L\'agente di esempio non ne ha bisogno.',
    apply: 'Crea l\'agente e la distribuzione di esempio dal manifest mostrato sopra.',
    invoke: 'Avvia un\'esecuzione dell\'agente di esempio con il tuo messaggio e apri la sua pagina di dettaglio.',
    secretName: 'Nome della credenziale salvata. Le distribuzioni la richiamano con questo nome quando la associano.',
    manifest: 'Il manifest di esempio in YAML. Puoi modificarlo prima di applicarlo, per esempio per rinominare l\'agente.',
    message: 'Il messaggio da inviare all\'agente di esempio. L\'harness fittizio lo rimanda indietro.'
  },
  tour: {
    skip: 'Termina ora il tour. Puoi rivederlo dalla barra laterale.',
    back: 'Mostra la tappa precedente del tour.',
    next: 'Passa alla tappa successiva del tour.',
    done: 'Concludi il tour. Puoi rivederlo dalla barra laterale.'
  },
  telemetry: {
    ...TELEMETRY,
    panel: 'Quanto è durata ogni fase di questa esecuzione e cosa ha consumato. Le durate provengono dagli orologi del worker e del server descritti in ogni campo.',
    phases: 'Dove l\'esecuzione ha speso il suo tempo, da sinistra a destra: attesa in coda, avvio dell\'harness fino al primo token, output in streaming e il resto dell\'esecuzione.',
    phase: {
      delegation: 'Tempo prima del primo output del modello in cui l\'esecuzione ha atteso le esecuzioni figlie delegate. Non è l\'avvio dell\'harness.',
      queue: 'In attesa in coda che un nodo worker prenda in lease l\'esecuzione.',
      startup: 'Dall\'avvio del processo al primo output del modello, inclusi l\'avvio dell\'harness e la prima richiesta al modello.',
      streaming: 'Dal primo all\'ultimo output del modello.',
      tail: 'Esecuzione dopo l\'ultimo output del modello: chiamate a strumenti, gestione del risultato e uscita del processo.'
    }
  },
  blocked: {
    panel: 'Perché questa esecuzione è ancora in coda e cosa cambiare perché un worker possa prenderla.',
    openFleet: 'Apre la pagina Flotta per vedere quali nodi worker sono pronti, quali harness segnala ciascuno e i dettagli delle verifiche.',
    openAgent: 'Apre l\'agente di questa esecuzione per controllare le sue distribuzioni, compresi pool di nodi e selettori di nodo di ognuna.',
    homeBanner: 'Esecuzioni in coda che al momento nessun worker pronto può eseguire. Restano in coda finché non compare un worker compatibile, oppure falliscono quando Runtime.FailBlockedAfterSeconds è impostato e scade.',
    showRuns: 'Apre la pagina Esecuzioni filtrata sulle esecuzioni in coda. Quelle bloccate hanno un badge di avviso che ne spiega il motivo.',
    queueColumn: 'Esecuzioni in coda di questo gruppo che al momento nessun worker pronto può eseguire. Passa sul badge per vedere motivo e rimedio.'
  },
  enums: {
    approvalStatus: {
      Pending: 'In attesa che una persona la consenta o la neghi. Fino ad allora l\'harness resta bloccato su questa chiamata.',
      Approved: 'La chiamata a strumento è stata consentita, da una regola, dal predefinito della distribuzione, da una persona o da un timeout.',
      Denied: 'La chiamata a strumento è stata rifiutata. L\'harness ha ricevuto il messaggio di rifiuto ed è proseguito senza di essa.',
      Expired: 'Nessuno ha deciso in tempo, quindi è stata applicata la decisione di timeout della distribuzione.',
      Cancelled: 'L\'esecuzione si è fermata mentre l\'approvazione era in sospeso, quindi è stata chiusa senza decisione.'
    },
    approvalDecision: {
      Allow: 'Consenti: l\'harness è stato autorizzato a effettuare la chiamata a strumento.',
      Deny: 'Nega: l\'harness è stato respinto e ha ricevuto il motivo.'
    },
    approvalSource: {
      DurableResume: "Un’approvazione umana monouso conservata dal checkpoint precedente. Si applica solo alla richiesta dello strumento ripresa corrispondente.",
      Rule: 'Decisa subito da una regola della distribuzione. La regola corrispondente è mostrata accanto.',
      Default: 'Nessuna regola corrispondeva, quindi ha deciso l\'azione predefinita della distribuzione.',
      User: 'Una persona ha deciso nella dashboard, tramite API o tramite MCP.',
      Timeout: 'Nessuno ha deciso prima della scadenza, quindi si è applicata la decisione di timeout della distribuzione.',
      Cancelled: 'L\'esecuzione si è fermata mentre questa approvazione era in attesa.'
    },
    approvalRuleAction: {
      Allow: 'Consenti: le chiamate a strumenti corrispondenti procedono senza chiedere a nessuno.',
      Deny: 'Nega: le chiamate a strumenti corrispondenti vengono rifiutate senza chiedere a nessuno. Nega prevale su ogni altra regola.',
      Ask: 'Chiedi a una persona: le chiamate a strumenti corrispondenti attendono una decisione nella casella Approvazioni.'
    },
    approvalKind: {
      Tool: 'Una richiesta di autorizzazione di Claude Code per qualsiasi strumento, compresi gli strumenti MCP.',
      Command: 'Un comando shell che un\'esecuzione con l\'app-server di Codex vuole eseguire. Le regole lo valutano come Bash.',
      FileChange: 'Una modifica di file che un\'esecuzione con l\'app-server di Codex vuole applicare. Le regole la valutano come Edit.'
    },
    runBlockedReason: {
      NoReadyWorker: 'Bloccata: nessun nodo worker è pronto, quindi nessuno può prendere questa esecuzione. Avvia un worker o registrane uno nuovo, poi controlla nella pagina Flotta i nodi persi, offline, in svuotamento o isolati.',
      NoCapableWorker: 'Bloccata: ci sono nodi worker pronti, ma nessuno segnala come disponibile l\'harness di questa esecuzione. Avvia o registra un worker con l\'harness installato, oppure controlla le sue credenziali e i risultati delle verifiche nella pagina Flotta.',
      NoMatchingPool: 'Bloccata: un worker pronto può eseguire questo harness, ma nessuno corrisponde al pool di nodi della distribuzione, alla restrizione di tenant del pool o ai selettori di nodo. Controlla il posizionamento della distribuzione o aggiungi un worker a quel pool.'
    },
    runStatus: {
      Pending: 'In sospeso: l\'esecuzione è stata accettata e viene preparata prima di entrare in coda.',
      Queued: 'In coda: in attesa che un nodo worker con harness e posizionamento corrispondenti la prenda in lease.',
      Leased: 'Assegnata: un nodo worker ha preso in carico l\'esecuzione e sta preparando l\'area di lavoro.',
      Running: 'In esecuzione: il processo dell\'harness è in esecuzione su un nodo worker.',
      Cancelling: 'Annullamento in corso: è stato richiesto l\'arresto e il worker sta chiudendo l\'harness.',
      Succeeded: 'Riuscita: l\'harness ha terminato e prodotto un risultato valido.',
      Failed: 'Non riuscita: l\'esecuzione è terminata con un errore. La colonna dell\'esito ne indica il motivo.',
      Cancelled: 'Annullata: qualcuno ha fermato l\'esecuzione prima che terminasse.',
      TimedOut: 'Scaduta: l\'esecuzione ha raggiunto la scadenza ed è stata fermata.',
      Rejected: 'Rifiutata: l\'esecuzione non è potuta partire, per esempio perché nessuna distribuzione era attiva.'
    },
    runOutcome: {
      None: 'L\'esecuzione non è terminata, quindi non c\'è ancora un esito.',
      Succeeded: 'L\'harness ha terminato e il suo risultato ha superato la convalida.',
      HarnessFailed: 'L\'harness ha segnalato un errore o è uscito senza un risultato utilizzabile. Controlla stderr e la trascrizione.',
      NotInstalled: 'L\'eseguibile dell\'harness non è stato trovato sul nodo worker.',
      NotCredentialed: 'L\'harness non aveva credenziali utilizzabili. Associa un segreto alla distribuzione.',
      McpPreflightFailed: 'Un server MCP o uno strumento richiesto non era raggiungibile durante il controllo del worker prima dell\'avvio.',
      NodeLost: 'Il nodo worker ha smesso di inviare heartbeat mentre deteneva l\'esecuzione.',
      OutputLimitExceeded: 'L\'esecuzione ha prodotto troppo output: la sua risposta ha superato il massimo di caratteri dell\'assistente della distribuzione (una protezione), oppure l\'harness ha scritto più di quanto consente il profilo harness. L\'output ottenuto viene conservato.',
      SchemaValidationFailed: 'Il risultato non corrispondeva al JSON Schema di output dell\'agente: dopo un tentativo di correzione, o subito se l\'harness non può riprendere la sessione.',
      TimedOut: 'L\'esecuzione ha raggiunto la scadenza.',
      Cancelled: 'L\'esecuzione è stata annullata su richiesta.',
      StaleLease: 'Il worker ha risposto dopo aver perso il lease, quindi il suo risultato è stato ignorato.',
      CompileFailed: 'Non è stato possibile compilare la distribuzione, per esempio per una variabile di modello mancante.',
      WorkspaceFailed: 'Non è stato possibile preparare l\'area di lavoro, per esempio perché un clone Git non è riuscito.',
      Rejected: 'La richiesta è stata rifiutata prima che un\'esecuzione potesse partire.',
      InternalError: 'Garrison ha riscontrato un errore interno. I log del server contengono i dettagli.',
      NoCapableWorker: 'L\'esecuzione è rimasta in coda più a lungo di quanto consente l\'impostazione del cluster Runtime.FailBlockedAfterSeconds e nessun nodo worker pronto poteva eseguirla, quindi è fallita.',
      RepetitionDetected: 'Una protezione ha fermato l\'esecuzione perché la sua risposta è degenerata nello stesso testo breve ripetuto più e più volte, o solo in spazi e punteggiatura. L\'output ottenuto viene conservato. Regolala con la Protezione dalle ripetizioni della distribuzione.',
      NoProgress: 'Una protezione ha fermato l\'esecuzione perché per più tempo del limite senza avanzamento della distribuzione non sono arrivati testo, ragionamento né attività degli strumenti. L\'output ottenuto viene conservato.',
      PodFailed: 'Il pod di esecuzione non è riuscito fuori dall\'harness: non è stato pianificato, la sua immagine non è stata scaricata, ha esaurito la memoria, è stato espulso o è terminato senza riferire. Il messaggio di errore indica la causa.',
      ConversationStateLost: 'Il nodo che doveva riprendere questo turno di conversazione non aveva più le cartelle della conversazione. Garrison rimette in coda un turno del genere una volta per ricostruirlo; questo esito resta solo quando non è stato possibile.'
    },
    controlNodeStatus: {
      Starting: 'In avvio: la replica si sta inizializzando e non gestisce ancora traffico.',
      Ready: 'Pronto: la replica invia heartbeat e gestisce le richieste REST, MCP e A2A.',
      Draining: 'In svuotamento: lo spegnimento è iniziato. Il controllo di prontezza risponde 503 e i suoi stream e long poll stanno terminando.',
      Offline: 'Offline: la replica si è arrestata correttamente, oppure è rimasta silente per 30 secondi ed è stata contrassegnata dal leader. Le righe offline vengono rimosse dopo 24 ore.'
    },
    backplane: {
      Local: 'Locale: gli eventi restano dentro questo processo. Va bene con una sola replica; le altre repliche non li vedono.',
      Polling: 'Polling del database: le repliche condividono gli eventi in tempo reale interrogando il database. Funziona con qualsiasi database, con un breve ritardo.',
      PostgresNotify: 'Notifiche PostgreSQL: le repliche condividono gli eventi in tempo reale tramite LISTEN e NOTIFY di PostgreSQL, con un ritardo minimo.'
    },
    nodeStatus: {
      Ready: 'Pronto: invia heartbeat e accetta nuove esecuzioni.',
      Draining: 'In svuotamento: completa le esecuzioni correnti e non ne accetta di nuove.',
      Cordoned: 'Isolato: non accetta nuove esecuzioni; quelle correnti proseguono normalmente.',
      Lost: 'Perso: ha mancato i suoi heartbeat. Le sue esecuzioni vengono rimesse in coda o fatte fallire.',
      Offline: 'Offline: si è arrestato correttamente e non detiene esecuzioni.'
    },
    usageQuotaScope: {"Tenant": "Tenant. Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "Agent": "Agente. Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "Deployment": "Distribuzione. Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione."},
    harnessType: {
      ClaudeCode: 'CLI Claude Code di Anthropic, eseguita in modalità headless con output stream-JSON.',
      Codex: 'CLI Codex di OpenAI, eseguita con exec e output JSONL.',
      Mux: 'CLI Mux con output JSONL; funziona con endpoint di modelli locali e ospitati.',
      GeminiCli: 'Gemini CLI di Google con output stream-JSON.',
      Generic: 'Qualsiasi altro agente da riga di comando, descritto interamente dal profilo harness.'
    },
    agentKind: {
      Hosted: 'Ospitato: Garrison esegue direttamente questo agente tramite le sue distribuzioni sui nodi worker.',
      Remote: 'Remoto: l\'agente viene eseguito altrove e Garrison inoltra le chiamate al suo endpoint A2A o MCP.'
    },
    secretStatus: {
      Ok: 'La credenziale è utilizzabile, per quanto ne sa Garrison. Impostare un nuovo valore riporta sempre il segreto a questo stato.',
      NeedsReauthentication: 'OpenAI ha rifiutato definitivamente l\'accesso ChatGPT salvato, per esempio perché il suo token di aggiornamento era già stato usato. Le esecuzioni che usano questo segreto falliscono finché non ne sostituisci il valore con un nuovo accesso.'
    },
    secretKind: {
      AnthropicApiKey: 'Una chiave API Anthropic, iniettata come ANTHROPIC_API_KEY dal profilo Claude Code.',
      ClaudeCodeOAuthToken: 'Un token di abbonamento Claude Code. Verifica i termini del provider prima di usarlo su server condivisi.',
      OpenAiApiKey: 'Una chiave API OpenAI per Codex o altri harness basati su OpenAI.',
      CodexAuthJson: 'Il contenuto di un file auth.json di Codex, scritto nella HOME dell\'esecuzione.',
      GeminiApiKey: 'Una chiave API Google Gemini per Gemini CLI.',
      GenericEnv: 'Qualsiasi valore destinato a una variabile d\'ambiente.',
      GenericFile: 'Qualsiasi valore destinato a essere scritto in un file.',
      BearerToken: 'Un token bearer, usato di solito nell\'header Authorization di un server MCP.',
      BasicAuth: 'Una coppia di nome utente e password per l\'autenticazione di base.',
      GitCredential: 'Un token o una password usati per clonare repository Git privati per le aree di lavoro.'
    },
    workspaceKind: {
      Empty: 'Ogni esecuzione parte in una nuova directory vuota.',
      GitRepository: 'Ogni esecuzione parte con un clone nuovo di un repository Git.',
      Seeded: 'Ogni esecuzione parte con i file elencati nel modello.',
      PersistentVolume: 'Ogni esecuzione monta un PersistentVolumeClaim esistente come workspace, quindi i file restano tra un\'esecuzione e l\'altra. Richiede l\'esecutore Job Kubernetes.'
    },
    runExecutor: {
      Process: 'L\'harness viene eseguito come sottoprocesso del worker, nel suo container, con directory di lavoro, home e configurazione proprie.',
      KubernetesJob: 'Il worker avvia un Job Kubernetes per ogni esecuzione: l\'harness gira in un pod dedicato senza credenziali Kubernetes o Garrison, con file system radice in sola lettura e i limiti di risorse del deployment.'
    },
    promptTemplateKind: {
      System: 'Un prompt di sistema: le istruzioni permanenti che configurano l\'agente.',
      Task: 'Un prompt di attività: racchiude il messaggio del chiamante in ciò che riceve l\'harness.',
      Fragment: 'Un frammento riutilizzabile incluso da altri modelli con {{> name}}.',
      ToolDescription: 'Testo che descrive un agente come strumento MCP o competenza A2A.',
      ConfigFile: 'Il contenuto di un file di configurazione generato, come una configurazione MCP.',
      Other: 'Qualsiasi altro testo renderizzato da un profilo harness.'
    },
    mcpTransport: {
      Http: 'Garrison e l\'harness raggiungono il server tramite HTTP in streaming a un URL.',
      Stdio: 'L\'harness avvia il server come processo locale e comunica con esso tramite stdin e stdout.'
    },
    permissionType: {
      Permit: 'Consenti: consente le operazioni elencate.',
      Deny: 'Nega: blocca le operazioni elencate, anche quando un\'altra autorizzazione le consente.'
    },
    artifactStoreKind: {
      Database: 'Gli artefatti sono salvati nel database di Garrison. Semplice, ma ideale per file piccoli.',
      Filesystem: 'Gli artefatti vengono scritti in una directory raggiungibile dal server.',
      S3: 'Gli artefatti vengono caricati in un bucket compatibile con S3.'
    },
    manifestApplyResult: {
      Created: 'Questo documento ha creato un nuovo record.',
      Updated: 'Questo documento ha modificato un record esistente.',
      Unchanged: 'Il record corrispondeva già a questo documento, quindi non è cambiato nulla.',
      Failed: 'Questo documento non ha superato la convalida. Nulla del manifest è stato scritto.',
      Validated: 'Simulazione: questo documento è valido e verrebbe applicato.'
    },
    auditEventType: {
      ApprovalDecided: 'Una persona ha consentito o negato una chiamata a strumento in sospeso. Il record indica lo strumento, l\'esecuzione e il motivo.',
      AuthSuccess: 'Qualcuno ha effettuato l\'accesso o autenticato una richiesta con successo.',
      AuthFailure: 'Un tentativo di accesso o di autenticazione non è riuscito. Errori ripetuti possono indicare che qualcuno sta tentando di indovinare.',
      SessionIssued: 'È stato emesso un token di sessione.',
      SessionRevoked: 'Un token di sessione è stato revocato, per esempio con la disconnessione.',
      CredentialCreated: 'È stata creata una nuova chiave di accesso.',
      CredentialRotated: 'Il segreto di una chiave di accesso è stato sostituito.',
      CredentialUsed: 'Una chiave di accesso è stata usata per l\'autenticazione.',
      AuthorizationDenied: 'Una richiesta è stata rifiutata perché il chiamante non aveva l\'autorizzazione.',
      AuthorizationBypass: 'Una richiesta ha saltato l\'autorizzazione tramite una regola di bypass, come per un amministratore di sistema.',
      RoleChanged: 'Un ruolo è stato creato, modificato o eliminato.',
      PermissionChanged: 'Un\'autorizzazione è stata creata, modificata o eliminata.',
      AssignmentChanged: 'Un\'assegnazione di ruolo è stata creata, modificata o eliminata.',
      ConfigurationChanged: 'È cambiato un agente, una distribuzione, un profilo, un modello o un altro record di configurazione.',
      SecretChanged: 'Un segreto è stato creato, modificato, ruotato o eliminato.',
      SettingsChanged: 'Le impostazioni del server sono state modificate.',
      RestartRequested: 'Qualcuno ha chiesto il riavvio del server.',
      ManifestApplied: 'Un manifest è stato applicato al tenant.',
      NodeRegistered: 'Un nodo worker si è registrato presso il piano di controllo.',
      NodeStatusChanged: 'Un nodo worker è stato isolato, svuotato, perso o è tornato disponibile.',
      RunCancelled: 'Un\'esecuzione è stata annullata da un utente, da una chiave di accesso o dalla sua esecuzione padre.',
      ConversationDeleted: 'Qualcuno ha eliminato una conversazione. I suoi turni restano come esecuzioni normali.'
    },
    conversationFallbackReason: {
      AffinityNodeLost: 'Il nodo che conserva la conversazione non era più pronto (perso, in svuotamento, isolato o eliminato), quindi un altro nodo ha preso il turno.',
      AffinityWaitExpired: 'Il nodo che conserva la conversazione è rimasto pronto ma non ha preso il turno entro Runtime.ConversationAffinityWaitMs, quindi l\'ha preso un altro nodo.',
      WorkspaceLost: 'Il nodo ha preso il turno, ma lì non c\'erano più l\'area di lavoro e la cartella home della conversazione.',
      SessionMissing: 'Esistono turni precedenti, ma nessuno ha segnalato una sessione dell\'harness da riprendere, per esempio perché sono falliti tutti presto.',
      HarnessChanged: 'Il profilo harness della distribuzione è cambiato da quando la sessione è stata registrata, quindi il nuovo profilo non può riprenderla.',
      ResumeUnsupported: 'Il profilo harness della distribuzione non supporta la ripresa di una sessione, quindi ogni turno successivo parte dalla trascrizione.',
      ExecutorWithoutState: 'Il turno viene eseguito come Kubernetes Job, che parte ogni volta con una cartella home vuota, quindi ogni turno successivo parte dalla trascrizione.'
    }
  },
  resources: {
    approvals: {
      createdUtc: 'Quando l\'harness ha chiesto. Passa il mouse sul valore per l\'ora esatta.',
      agentName: 'L\'agente la cui esecuzione ha richiesto questa chiamata a strumento.',
      toolName: 'Lo strumento che l\'harness vuole usare, per esempio Bash, Edit, WebFetch o uno strumento MCP.',
      summary: 'Una riga sulla chiamata: il comando, URL, percorsi o query, con i segreti oscurati.',
      status: 'In sospeso finché non viene decisa, poi Approvata, Negata, Scaduta (timeout) o Annullata (l\'esecuzione si è fermata).',
      decision: 'Consenti o Nega una volta decisa; vuoto finché l\'approvazione è in sospeso.',
      decisionSource: 'Cosa l\'ha decisa: una regola, il predefinito della distribuzione, una persona, un timeout o un\'esecuzione fermata.',
      decidedBy: 'La persona o la chiave di accesso che ha deciso, quando ha deciso una persona.',
      expiresUtc: 'Quando un\'approvazione in sospeso va in timeout e si applica la decisione di timeout della distribuzione.',
      kind: 'Chiamata a strumento (Claude Code), Comando o Modifica di file (app-server di Codex).',
      harnessType: 'L\'harness che ha chiesto: Claude Code o Codex.',
      runId: 'L\'esecuzione che ha chiesto. Aprila per vedere la trascrizione attorno alla chiamata.',
      rootRunId: 'L\'esecuzione di primo livello dell\'albero di delega, quando l\'esecuzione che ha chiesto era delegata.',
      deploymentId: 'La distribuzione le cui regole hanno valutato questa chiamata. Le regole memorizzate vengono aggiunte a essa.',
      leaseEpoch: 'Epoca del lease del tentativo di esecuzione che ha chiesto, così una decisione non raggiunge mai un tentativo successivo.',
      requestedUtc: 'Quando l\'harness ha chiesto l\'autorizzazione.',
      decidedUtc: 'Quando è stata presa la decisione.',
      waitMs: 'Quanto la chiamata ha atteso dalla richiesta alla decisione.',
      timeoutDecision: 'Cosa succede se nessuno decide prima che l\'approvazione scada, secondo le impostazioni della distribuzione.',
      toolCallId: 'L\'ID che l\'harness assegna a questa chiamata a strumento, per ritrovarla nella trascrizione.',
      reason: 'La nota scritta dalla persona che ha deciso, se presente.',
      inputPreview: 'L\'input dello strumento inviato dall\'harness, come JSON, con segreti e valori simili a token oscurati.',
      rulePattern: 'La regola della distribuzione che corrisponde a questa chiamata, quando una regola l\'ha decisa o ha chiesto a una persona.',
      ruleId: 'ID della regola della distribuzione corrispondente.',
      suggestedRule: 'Una regola che corrisponderebbe a questa chiamata. «Memorizza come regola» la precompila.',
      rememberedRuleId: 'ID della regola aggiunta alla distribuzione quando questa approvazione è stata decisa con l\'opzione di memorizzazione.',
      id: 'Identificatore dell\'approvazione (apr_...) per l\'API e gli strumenti MCP.',
      actions: {
        allow: 'Consenti questa chiamata a strumento in sospeso, con un motivo facoltativo e l\'opzione di memorizzarla come regola.',
        deny: 'Nega questa chiamata a strumento in sospeso, con un motivo facoltativo e l\'opzione di memorizzarla come regola.',
        openRun: 'Apri l\'esecuzione che ha chiesto, per leggerne la trascrizione attorno a questa chiamata a strumento.'
      }
    },
    tenants: {
      add: 'Crea un nuovo tenant: uno spazio isolato con i propri utenti, agenti, segreti ed esecuzioni.',
      name: 'Nome visualizzato del tenant. Le persone scelgono il tenant tramite il suo ID quando accedono.',
      description: 'A chi o a cosa serve questo tenant, per esempio un team o un cliente.',
      active: 'I tenant inattivi non possono accedere né eseguire agenti. I loro dati vengono conservati.'
    },
    users: {
      add: 'Crea una persona che accede con email e password. Poi concedile l\'accesso con un\'assegnazione di ruolo.',
      email: 'L\'indirizzo con cui la persona accede. Univoco all\'interno del tenant.',
      name: 'Nome e cognome, mostrati nei record di audit e negli elenchi.',
      role: 'Livello di amministrazione dell\'account. Gli utenti normali ottengono l\'accesso tramite assegnazioni di ruoli.',
      password: 'Password di accesso. In modifica, lascia vuoto per mantenere la password attuale.',
      firstName: 'Nome, mostrato negli elenchi e nei record di audit.',
      lastName: 'Cognome, mostrato negli elenchi e nei record di audit.',
      isTenantAdmin: 'Gli amministratori del tenant possono gestire tutto all\'interno di questo tenant, inclusi utenti e segreti.',
      isAdmin: 'Gli amministratori di sistema gestiscono tutti i tenant e saltano l\'autorizzazione. Concedi questo livello con parsimonia.',
      active: 'Gli utenti inattivi non possono accedere e le loro chiavi di accesso smettono di funzionare.',
      actions: { permissions: 'Mostra tutte le autorizzazioni che questo utente ottiene combinando tutti i ruoli e le assegnazioni.' }
    },
    credentials: {
      add: 'Crea una chiave di accesso per uno script, un SDK o un servizio. Il segreto viene mostrato una sola volta dopo il salvataggio.',
      name: 'A cosa serve questa chiave, per esempio ci-pipeline. Ti aiuta a trovarla prima di ruotarla o eliminarla.',
      accessKey: 'La parte pubblica della chiave, inviata con ogni richiesta. Si può salvare in sicurezza nella configurazione.',
      secretKeyLast4: 'Gli ultimi quattro caratteri del segreto, per riconoscere una chiave senza vederla.',
      userId: 'L\'utente proprietario di questa chiave. Una chiave non può mai fare più del suo proprietario.',
      lastUsedUtc: 'Quando la chiave ha autenticato l\'ultima richiesta. Date vecchie indicano chiavi inutilizzate che puoi eliminare.',
      authMode: 'Come può autenticarsi la chiave: inviata direttamente, firmata per ogni richiesta, scambiata con una sessione o in uno qualsiasi di questi modi (Hybrid).',
      expiresUtc: 'Dopo questo momento la chiave smette di funzionare. Lascia vuoto per una chiave senza scadenza.',
      active: 'Le chiavi inattive vengono rifiutate ma conservate, così puoi riattivarle.',
      actions: {
        rotate: 'Sostituisci il segreto con uno nuovo. Il vecchio segreto smette subito di funzionare; quello nuovo viene mostrato una sola volta.',
        permissions: 'Mostra tutte le autorizzazioni che questa chiave ottiene combinando proprietario, ruoli e assegnazioni.'
      }
    },
    roles: {
      add: 'Crea un ruolo personalizzato, poi aggiungigli autorizzazioni e assegnalo a utenti o chiavi.',
      name: 'Nome che le persone vedono quando assegnano il ruolo, per esempio Release Operator.',
      description: 'A cosa serve il ruolo e a chi dovrebbe essere assegnato.',
      active: 'I ruoli inattivi non concedono nulla, nemmeno dove sono assegnati.',
      actions: { clone: 'Crea una copia modificabile di questo ruolo predefinito da adattare.' }
    },
    permissions: {
      add: 'Crea una regola che consente o nega operazioni su tipi di risorsa.',
      name: 'Nome breve della regola, mostrato quando componi i ruoli.',
      permissionType: '«Consenti» permette le operazioni sottostanti. «Nega» le blocca e prevale sempre su «Consenti».',
      resourceTypes: 'Quali tipi di record copre la regola. «All» copre ogni tipo.',
      operationTypes: 'Quali operazioni copre la regola, come Read, Create o Execute (invocazione).',
      active: 'Le autorizzazioni inattive non hanno effetto.'
    },
    userAssignments: {
      add: 'Assegna un ruolo a un utente, per l\'intero tenant o per un singolo record.',
      userId: 'La persona che riceve il ruolo.',
      roleName: 'Il ruolo concesso. La persona ottiene ogni autorizzazione che contiene.',
      roleId: 'Il ruolo da concedere. La persona ottiene ogni autorizzazione che contiene.',
      resourceScope: '«Tenant» applica il ruolo a ogni record. «Risorsa» lo limita al singolo record indicato sotto.',
      resourceId: 'Identificatore del singolo record a cui si applica il ruolo, per esempio l\'ID di un agente.',
      inheritsToChildren: 'Applica il ruolo a ogni record del tenant, compresi quelli creati in seguito.',
      active: 'Le assegnazioni inattive non concedono nulla ma vengono conservate.'
    },
    credentialAssignments: {
      add: 'Assegna un ruolo a una chiave di accesso, per l\'intero tenant o per un singolo record.',
      credentialId: 'La chiave di accesso che riceve il ruolo. Non può comunque superare il suo proprietario.',
      roleName: 'Il ruolo concesso alla chiave.',
      roleId: 'Il ruolo da concedere. Scegli il ruolo più limitato che permette all\'automazione di svolgere il suo compito.',
      resourceScope: '«Tenant» applica il ruolo a ogni record. «Risorsa» lo limita al singolo record indicato sotto.',
      resourceId: 'Identificatore del singolo record a cui si applica il ruolo, per esempio l\'unico agente che un job di CI può invocare.',
      inheritsToChildren: 'Applica il ruolo a ogni record del tenant, compresi quelli creati in seguito.',
      active: 'Le assegnazioni inattive non concedono nulla ma vengono conservate.'
    },
    harnessProfiles: {
      add: 'Descrivi un nuovo modo per avviare un agente CLI in modalità headless. Di solito è più semplice clonare un profilo predefinito.',
      name: 'Nome del profilo. Le distribuzioni scelgono un profilo con questo nome. Il prefisso builtin/ è riservato.',
      harnessType: 'Quale harness avvia questo profilo. I worker dichiarano i tipi che possono eseguire, e questo guida il posizionamento.',
      executable: 'Comando da eseguire sul worker, trovato nel PATH o indicato con un percorso assoluto, per esempio claude.',
      outputParser: 'Come l\'output dell\'harness viene trasformato in eventi della trascrizione e in un risultato finale.',
      description: 'Cosa ha di particolare questo profilo, per esempio quali flag aggiunge.',
      probeArguments: 'Argomenti per un controllo di versione che non consuma token, come --version. I worker lo eseguono all\'avvio.',
      active: 'I profili inattivi non possono essere usati dalle nuove esecuzioni.',
      arguments: 'Argomenti della riga di comando in ordine. Ognuno è un modello, può essere saltato da una condizione e può ripetersi su un elenco.',
      argumentsItems: {
        template: 'Testo di un argomento, per esempio --model o {{deployment.model}}.',
        condition: 'Espressione di modello; se il risultato è vuoto o false questo argomento viene saltato.',
        repeatOver: 'Nome di una variabile elenco; l\'argomento viene emesso una volta per ogni elemento.'
      },
      promptDelivery: 'Come il prompt dell\'attività arriva all\'harness: sullo standard input, come argomento o in un file.',
      promptArgumentTemplate: 'L\'argomento o il nome del file usato quando il prompt non viene inviato sullo standard input.',
      systemPromptDelivery: 'Come il prompt di sistema arriva all\'harness: un file, un argomento, una variabile d\'ambiente, anteposto al prompt dell\'attività o per niente.',
      systemPromptTarget: 'Il flag, la variabile o il nome del file che trasporta il prompt di sistema.',
      mcpConfigFormat: 'Quale formato di configurazione MCP legge questo harness. Garrison vi scrive i server MCP associati all\'esecuzione.',
      mcpConfigFileName: 'Nome del file della configurazione MCP generata, all\'interno della directory di configurazione dell\'esecuzione.',
      environment: 'Variabili d\'ambiente per il processo. I valori sono modelli; {{secret.alias}} inserisce un segreto associato.',
      environmentItems: {
        name: 'Nome della variabile, per esempio ANTHROPIC_API_KEY.',
        valueTemplate: 'Modello del valore. Usa {{secret.alias}} per le credenziali.',
        condition: 'Espressione di modello; se il risultato è vuoto o false la variabile non viene impostata.',
        isSecret: 'Tratta il valore come segreto: mai registrato nei log e oscurato nelle anteprime.'
      },
      files: 'File scritti prima dell\'avvio, come file di impostazioni o auth.json.',
      filesItems: FILE_ITEMS,
      credentialEnvironmentAllowlist: 'Nomi delle variabili d\'ambiente che possono essere valorizzate dai segreti per questo harness. Tutto il resto viene rifiutato.',
      genericTextField: 'Percorso JSON del testo dell\'assistente in ogni riga di output, per il parser Generic JSONL.',
      genericFinalField: 'Percorso JSON del testo del risultato finale, per il parser Generic JSONL.',
      genericSuccessField: 'Percorso JSON che indica se l\'esecuzione è riuscita, per il parser Generic JSONL.',
      genericSuccessValue: 'Il valore nel percorso di successo che indica un\'esecuzione riuscita, per esempio true.',
      resultSource: 'Da dove proviene la risposta finale: l\'evento finale del parser, un file con l\'ultimo messaggio o tutto lo standard output.',
      resultFileName: 'Nome del file in cui l\'harness scrive il suo ultimo messaggio, quando l\'origine del risultato è un file.',
      successPolicy: 'Come si decide il successo: dall\'evento finale del parser, dal codice di uscita o da entrambi.',
      successExitCodes: 'Codici di uscita considerati di successo quando il criterio usa i codici di uscita. Uno per riga.',
      defaultTimeoutSeconds: 'Scadenza dell\'esecuzione in secondi quando la distribuzione non ne imposta una. Tra 5 e 86400.',
      killGraceSeconds: 'Secondi tra la richiesta di arresto al processo e la terminazione forzata del suo albero di processi. Tra 0 e 60.',
      maxOutputBytes: 'Quantità massima di standard output che un\'esecuzione può produrre prima di fallire con «Limite di output superato».',
      stderrTailBytes: 'Quanta parte finale dello standard error conservare per la pagina di dettaglio dell\'esecuzione.',
      isolateHome: 'Assegna a ogni esecuzione una propria directory HOME, così impostazioni e cache dell\'harness non passano mai da un\'esecuzione all\'altra.',
      supportsResume: 'Indica se questo harness può riprendere una sessione precedente. Usato dalle conversazioni.',
      steps: {
        basics: 'Nome, tipo di harness, eseguibile e controllo di versione.',
        invocation: 'Argomenti, consegna del prompt, configurazione MCP, ambiente e file.',
        output: 'Come viene analizzato l\'output e come si decide il successo.',
        limits: 'Timeout, limiti di output e isolamento della HOME.'
      },
      actions: { clone: 'Crea una copia modificabile di questo profilo nel tuo tenant, con il suffisso -custom nel nome.' }
    },
    promptTemplates: {
      actions: { clone: 'Copia questo modello con un nuovo nome a tua scelta e apri la copia nell\'editor.' },
      add: 'Scrivi un nuovo modello di prompt nell\'editor con anteprima in tempo reale. Ogni salvataggio diventa una versione.',
      name: 'Nome del modello, univoco nel tenant. Le distribuzioni collegano i modelli tramite ID, quindi rinominarlo mantiene i collegamenti; le inclusioni lo richiamano per nome.',
      kind: 'A cosa serve il modello: prompt di sistema, wrapper dell\'attività, frammento, descrizione di strumento o file di configurazione.',
      currentVersion: 'La versione salvata più recente. Le distribuzioni fissano una versione oppure seguono la più recente.',
      description: 'Cosa fa il modello e dove viene usato.'
    },
    mcpServers: {
      add: 'Registra un server MCP così le distribuzioni possono associarlo e i loro agenti possono usarne gli strumenti.',
      name: 'Nome del server. Le distribuzioni lo associano con questo nome e gli assegnano un alias.',
      transport: 'I server HTTP si raggiungono a un URL; i server stdio vengono avviati dall\'harness come processo locale.',
      endpoint: 'Dove si raggiunge il server: URL e percorso, oppure il comando per un server stdio.',
      required: 'Se attivo, un\'esecuzione fallisce prima dell\'avvio se questo server o i suoi strumenti richiesti non sono raggiungibili.',
      description: 'Quali strumenti offre questo server e quali agenti dovrebbero usarlo.',
      url: 'URL base del server come lo raggiungono i nodi worker, senza il percorso MCP.',
      path: 'Percorso dell\'endpoint MCP su quel server, di solito /mcp.',
      headers: 'Header HTTP inviati al server, come Authorization. I valori possono usare {{secret.alias}}.',
      headersItems: {
        name: 'Nome dell\'header, per esempio Authorization.',
        valueTemplate: 'Modello del valore dell\'header, per esempio Bearer {{secret.github}}.'
      },
      command: 'Eseguibile che avvia il server stdio sul worker.',
      arguments: 'Argomenti per il comando del server stdio, uno per riga.',
      environment: 'Variabili d\'ambiente per il processo del server stdio. I valori possono usare {{secret.alias}}.',
      environmentItems: {
        name: 'Nome della variabile per il processo del server.',
        valueTemplate: 'Modello del valore. Usa {{secret.alias}} per le credenziali.'
      },
      requiredTools: 'Strumenti che devono esistere su questo server. Il worker li verifica prima dell\'avvio e fa fallire l\'esecuzione se ne manca uno.',
      toolTimeoutSeconds: 'Quanto può durare una singola chiamata a uno strumento prima che l\'harness vi rinunci.',
      active: 'I server inattivi vengono esclusi dalle nuove esecuzioni anche se una distribuzione li associa.',
      actions: { test: 'Connettiti ora al server ed elencane gli strumenti, per verificare indirizzo e credenziali.' }
    },
    secrets: {
      status: 'Indica se la credenziale salvata funziona ancora. Garrison segnala che un accesso Codex richiede un nuovo login quando non è più possibile rinnovarlo.',
      accessTokenExpiresUtc: 'Quando scade il token di accesso di un accesso ChatGPT di Codex salvato. Garrison lo rinnova prima e riscrive i nuovi token nel segreto.',
      refreshedUtc: 'Quando Garrison ha rinnovato per l\'ultima volta questo accesso Codex. Le esecuzioni ricevono sempre e solo una copia senza il token di aggiornamento.',
      statusMessage: 'Perché l\'accesso non può essere usato, secondo il fornitore.',
      statusUtc: 'Quando Garrison ha rilevato che l\'accesso non può più essere rinnovato.',
      add: 'Salva una nuova credenziale, come una chiave API o un token, cifrata a riposo. Le distribuzioni la richiamano tramite alias; dopo il salvataggio il valore non viene mai più mostrato.',
      name: 'Nome del segreto. Le distribuzioni scelgono il segreto con questo nome e gli assegnano un alias.',
      kind: 'Che tipo di credenziale è. I profili predefiniti usano il tipo per sapere quale variabile o file valorizzare.',
      valueLast4: 'Gli ultimi quattro caratteri del valore salvato, per distinguere i segreti senza rivelarli.',
      rotatedUtc: 'Quando il valore è stato impostato o ruotato l\'ultima volta.',
      expiresUtc: 'Scadenza indicativa. Ruota il valore prima di questa data.',
      description: 'Da dove proviene il valore e quali agenti ne hanno bisogno.',
      value: 'Il valore segreto. Viene cifrato al salvataggio e non si può mai rileggere, solo sostituire.',
      newValue: 'Il valore sostitutivo. Ha effetto su ogni esecuzione compilata dopo il salvataggio.',
      active: 'I segreti inattivi non vengono iniettati nelle esecuzioni.',
      saveValue: 'Cifra e salva il nuovo valore. Il vecchio valore viene scartato e non si può recuperare.',
      actions: {
        setValue: 'Sostituisci il valore salvato con uno nuovo che digiti. Il vecchio valore non si può recuperare.',
        rotate: 'Inserisci un nuovo valore e registra l\'ora della rotazione, per esempio dopo che il provider ha emesso una nuova chiave.'
      }
    },
    workspaces: {
      add: 'Definisci come viene preparata la directory di lavoro di un\'esecuzione: vuota, clonata da Git o popolata con file.',
      name: 'Nome del modello. Le distribuzioni scelgono un modello di area di lavoro con questo nome.',
      kind: '«Vuota» parte senza nulla, «Repository Git» clona un repository, «File iniziali» scrive i file elencati sotto.',
      gitUrl: 'Repository da clonare per ogni esecuzione. I repository privati richiedono un segreto con credenziali Git.',
      retention: 'Cosa succede alla directory dopo l\'esecuzione: eliminarla, conservarla o conservarla solo se l\'esecuzione non è riuscita.',
      description: 'Cosa contiene l\'area di lavoro e quali agenti la usano.',
      gitRef: 'Branch, tag o commit da estrarre. Lascia vuoto per il branch predefinito.',
      gitDepth: 'Quanti commit scaricare. 1 è il più veloce; 0 scarica l\'intera cronologia.',
      gitCredentialSecretId: 'Segreto che contiene il token o la password usati per clonare un repository privato.',
      persistentVolumeClaim: 'Nome del PersistentVolumeClaim montato nel percorso del workspace. Deve già esistere nello spazio dei nomi di esecuzione; Garrison non lo crea né lo elimina mai.',
      files: 'File scritti nell\'area di lavoro prima dell\'avvio dell\'esecuzione.',
      filesItems: {
        path: 'Percorso del file relativo alla radice dell\'area di lavoro.',
        content: 'Contenuto testuale del file.'
      },
      active: 'I modelli inattivi non possono essere usati dalle nuove esecuzioni.'
    },
    modelPrices: {"add": "Aggiungi un prezzo per un harness e un modello servito esatti. Nessuna tariffa dei fornitori è preimpostata.", "name": "Nome di configurazione univoco per questo prezzo nel tenant.", "description": "Note dell’operatore sulla fonte e sulla data di validità delle tariffe.", "active": "I prezzi inattivi non vengono usati. Modificare o eliminare un prezzo non cambia i costi salvati delle esecuzioni.", "model": "Inserisci il nome esatto del modello, da 1 a 256 caratteri senza caratteri di controllo.", "harnessType": "Harness la cui contabilizzazione dei token e il nome esatto del modello corrispondono a queste tariffe.", "inputUsdPerMillion": "Input USD / milione di token. Inserisci una tariffa finita tra 0 e 1.000.000.000. Zero è valido.", "outputUsdPerMillion": "Output USD / milione di token. Inserisci una tariffa finita tra 0 e 1.000.000.000. Zero è valido.", "cachedInputUsdPerMillion": "Lascia vuoto per usare la tariffa di input o output corrispondente. Zero significa gratuito.", "reasoningUsdPerMillion": "Lascia vuoto per usare la tariffa di input o output corrispondente. Zero significa gratuito.", "inputIncludesCachedTokens": "Attiva se l’input include token in cache. Disattiva per Claude Code, che comunica separatamente le letture della cache.", "outputIncludesReasoningTokens": "Attiva se l’output include token di ragionamento. I subtotali inclusi vengono sottratti prima di applicare la tariffa separata."},
    usageQuotas: {"add": "Aggiungi una quota per tenant, agente o distribuzione. I limiti vuoti sono illimitati.", "name": "Nome. Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "description": "Descrizione. Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "active": "Attivo. Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "scope": "Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "resourceId": "Aggiungi una quota per tenant, agente o distribuzione. I limiti vuoti sono illimitati.", "dailyRunLimit": "Esecuzioni per giorno UTC. Lascia vuoto per uso illimitato. Zero impedisce l’uso. I contatori giornalieri si azzerano a mezzanotte UTC; la concorrenza conta esecuzioni attive.", "dailyTokenLimit": "Token per giorno UTC. Lascia vuoto per uso illimitato. Zero impedisce l’uso. I contatori giornalieri si azzerano a mezzanotte UTC; la concorrenza conta esecuzioni attive.", "dailyCostUsdLimit": "USD noti per giorno UTC. Lascia vuoto per uso illimitato. Zero impedisce l’uso. I contatori giornalieri si azzerano a mezzanotte UTC; la concorrenza conta esecuzioni attive.", "maxConcurrentRuns": "Massimo di esecuzioni attive. Lascia vuoto per uso illimitato. Zero impedisce l’uso. I contatori giornalieri si azzerano a mezzanotte UTC; la concorrenza conta esecuzioni attive.", "actions": {"usage": "Utilizzo giornaliero. Esecuzioni per giorno UTC. Lascia vuoto per uso illimitato. Zero impedisce l’uso. I contatori giornalieri si azzerano a mezzanotte UTC; la concorrenza conta esecuzioni attive."}, "usage": {"windowStartUtc": "Inizio finestra (UTC). Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "windowEndUtc": "Azzeramento giornaliero (UTC). Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "runsUsed": "Esecuzioni ammesse. Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "tokensUsed": "Token completati. Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "costUsd": "Costo noto (USD). Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "unknownCostRuns": "Esecuzioni senza costo. Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "activeRuns": "Esecuzioni attive. Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione."}, "enforcementEnabled": "Disattivato per impostazione predefinita. Attivare per rifiutare esecuzioni ai limiti configurati e ridurre i budget supportati. Altrimenti viene solo monitorato l’utilizzo."},
    artifactStores: {
      add: 'Crea una destinazione per i file prodotti dalle esecuzioni, così sopravvivono all\'area di lavoro dell\'esecuzione.',
      name: 'Nome dell\'archivio. Le distribuzioni scelgono un archivio di artefatti con questo nome.',
      kind: 'Dove vengono conservati i file: il database di Garrison, una directory del filesystem o un bucket S3.',
      description: 'Cosa viene archiviato qui e per quanto tempo va conservato.',
      active: 'Gli archivi inattivi non ricevono nuovi artefatti.'
    },
    agents: {
      add: 'Crea una nuova identità di agente. Non fa nulla finché non aggiungi almeno una distribuzione.',
      name: 'Nome compatibile con DNS usato dai chiamanti per invocare l\'agente tramite REST, MCP e A2A. Lettere minuscole, cifre e trattini.',
      displayName: 'Nome descrittivo mostrato nella console e nella card A2A.',
      kind: 'Gli agenti ospitati vengono eseguiti qui tramite le distribuzioni. Gli agenti remoti vengono eseguiti altrove e si chiamano tramite il loro endpoint.',
      exposure: 'Quali protocolli pubblicizzano l\'agente: A2A gli fornisce una card A2A; MCP lo rende uno strumento per i client MCP.',
      delegationMode: 'Quali altri agenti possono invocare le esecuzioni di questo agente: nessuno, quelli di un elenco consentito o qualsiasi agente.',
      tags: 'Etichette per trovare e raggruppare gli agenti. Non influiscono sull\'esecuzione dell\'agente.',
      description: 'Cosa fa l\'agente, in parole semplici. Viene mostrato ai chiamanti e nella card A2A, quindi scrivilo per loro.',
      agentVersion: 'Stringa di versione pubblicata nella card A2A. Cambiala quando cambia il comportamento dell\'agente.',
      remoteProtocol: 'Come Garrison chiama l\'agente remoto: A2A o MCP.',
      remoteEndpointUrl: 'Indirizzo dell\'endpoint A2A o MCP dell\'agente remoto.',
      exposeA2A: 'Pubblica una card A2A così altri agenti A2A possono scoprire e chiamare questo agente.',
      exposeMcpTool: 'Offri questo agente come strumento a sé sul server MCP di Garrison, così i client MCP possono chiamarlo direttamente.',
      mcpToolName: 'Nome dello strumento visto dai client MCP. Lascia vuoto per usare il nome dell\'agente.',
      skills: 'Competenze A2A elencate nella card A2A. Descrivono cosa possono chiedere i chiamanti.',
      skillsItems: {
        skillId: 'Identificatore stabile della competenza nella card A2A.',
        name: 'Nome breve della competenza mostrato ai chiamanti A2A.',
        description: 'Cosa fa la competenza, scritto per l\'agente chiamante.'
      },
      inputMode: '«Text» accetta un messaggio semplice. «Structured» richiede un input conforme al JSON Schema di input.',
      inputSchemaJson: "JSON Schema dell'input dell'agente. Se impostato, ogni input di invocazione deve essere un documento JSON conforme, e Invoca mostra un modulo generato da esso.",
      outputSchemaJson: 'JSON Schema a cui deve essere conforme il risultato. Garrison convalida l\'output e riprova una volta con un prompt di correzione.',
      delegationAllowList: 'Gli agenti che questo agente può chiamare quando la delega usa un elenco consentito.',
      delegationMaxDepth: 'Quanti livelli di chiamate da agente ad agente possono seguire sotto questo agente. Tra 0 e 10.',
      delegationAllowRecursion: 'Consenti allo stesso agente di comparire due volte in una catena di chiamate. Se disattivato, evita i cicli.',
      active: 'Gli agenti inattivi non possono essere invocati.',
      sections: {
        identity: 'Chi è l\'agente: nome, descrizione, tipo e versione.',
        exposure: 'Quali protocolli pubblicizzano l\'agente e quali competenze elenca.',
        io: 'Quale input accetta l\'agente e quale output deve restituire.',
        delegation: 'Se questo agente può chiamare altri agenti, e fino a quale profondità.'
      }
    },
    deployments: {
      approvalsEnabled: 'Fa chiedere all\'harness prima delle chiamate a strumenti. Le regole qui sotto decidono la maggior parte delle chiamate; le altre attendono una persona nella casella Approvazioni. Solo profili Claude Code e app-server di Codex.',
      approvalDefaultAction: 'Cosa succede quando nessuna regola corrisponde a una chiamata a strumento: consentirla, negarla o chiedere a una persona.',
      approvalTimeoutSeconds: 'Quanto una chiamata attende una persona prima che si applichi la decisione di timeout, da 10 a 3.600 secondi.',
      approvalTimeoutDecision: 'La decisione applicata quando nessuno risponde in tempo. Nega è la scelta sicura.',
      approvalRules: 'Regole ordinate nella sintassi di Claude Code. Nega prevale su Chiedi e Chiedi prevale su Consenti; all\'interno di una stessa azione viene riportata la prima corrispondenza.',
      approvalRulesItems: {
        action: 'Cosa ottiene una chiamata corrispondente: Consenti, Nega o Chiedi a una persona.',
        pattern: 'Regola di Claude Code, per esempio Bash(npm test), Bash(npm run *), Edit(src/**), Read, WebFetch(domain:example.com) o mcp__github__*.',
        inputPattern: 'Espressione regolare .NET facoltativa a cui deve corrispondere anche il JSON dell\'input dello strumento, per un controllo più fine del pattern.',
        description: 'Perché esiste questa regola, per le persone che la mantengono.'
      },
      approvalTest: 'Prova una chiamata a strumento con le regole salvate della distribuzione e scopri se verrebbe consentita, negata o inviata a una persona.',
      add: 'Crea una distribuzione: il modo concreto in cui viene eseguito un agente, con profilo harness, modello, prompt e risorse.',
      name: 'Nome della distribuzione, univoco nel tenant, per esempio reviewer-claude.',
      agentId: 'L\'agente eseguito da questa distribuzione. Invocando quell\'agente può essere scelta questa distribuzione.',
      harnessProfileId: 'Il profilo harness che avvia la CLI, per esempio builtin/claude-code.',
      model: 'Nome del modello passato all\'harness, per esempio sonnet o gpt-5. Disponibile nei modelli di prompt come deployment.model.',
      weight: 'Peso del traffico tra le distribuzioni attive dell\'agente. Una distribuzione con peso 300 riceve il triplo delle chiamate di una con 100.',
      configVersion: 'Aumenta a ogni modifica. Ogni esecuzione registra la versione da cui è stata compilata.',
      description: 'In cosa questa distribuzione differisce dalle altre dell\'agente, per esempio un modello più economico.',
      active: 'Le distribuzioni inattive non ricevono traffico ponderato, ma i chiamanti possono comunque indicarle esplicitamente.',
      fallbackModel: 'Modello da usare quando il modello principale è sovraccarico, se l\'harness lo supporta.',
      effort: 'Indicazione sull\'impegno di ragionamento passata agli harness che la supportano, come low, medium o high.',
      maxTurns: 'Numero massimo di turni dell\'agente in un\'esecuzione prima che l\'harness la fermi.',
      maxBudgetUsd: 'Tetto di spesa per esecuzione in dollari USA, per gli harness che ne applicano uno.',
      parameters: 'Valori con nome che i modelli di prompt possono leggere come deployment.parameters.name.',
      parametersItems: {
        name: 'Nome del parametro, richiamato come deployment.parameters.name.',
        value: 'Valore predefinito. I chiamanti possono sovrascriverlo solo se è elencato tra le sostituzioni per esecuzione.'
      },
      promptBindings: 'Quale modello di prompt riempie ciascun ruolo (System, Task, DelegatedTask e così via).',
      promptBindingsItems: {
        role: 'Il ruolo di prompt che questa associazione riempie, come System o Task.',
        templateId: 'Il modello usato per quel ruolo.',
        pinnedVersion: 'Versione da fissare. Lascia vuoto per usare sempre la versione più recente.'
      },
      resourceBindings: 'Server MCP e segreti usati da questa distribuzione, ciascuno con un alias per i modelli.',
      resourceBindingsItems: {
        kind: 'Se questa associazione riguarda un server MCP o un segreto.',
        alias: 'Nome breve usato dai modelli, per esempio anthropic in {{secret.anthropic}}.',
        resourceId: 'Il server MCP o il segreto da associare.'
      },
      workspaceTemplateId: 'Come viene preparata la directory di lavoro di ogni esecuzione. Vuoto indica una nuova directory vuota.',
      artifactStoreId: 'Dove vengono caricati i file prodotti dalle esecuzioni dopo la loro fine.',
      argumentOverrides: 'Modifiche agli argomenti del profilo harness solo per questa distribuzione: aggiungi in coda, aggiungi in testa, sostituisci o rimuovi.',
      argumentOverridesItems: {
        operation: 'Cosa fare: aggiungere in coda, aggiungere in testa, sostituire un argomento corrispondente o rimuoverlo.',
        match: 'L\'argomento esistente da sostituire o rimuovere.',
        template: 'Il testo del nuovo argomento. Sono ammesse variabili di modello.',
        condition: 'Espressione di modello; se il risultato è vuoto o false la sostituzione viene saltata.'
      },
      environmentOverrides: 'Variabili d\'ambiente aggiunte o sostituite solo per questa distribuzione.',
      environmentOverridesItems: {
        name: 'Nome della variabile da aggiungere o sostituire.',
        valueTemplate: 'Modello del valore. Usa {{secret.alias}} per i segreti associati.',
        isSecret: 'Tratta il valore come segreto: mai registrato nei log e oscurato nelle anteprime.'
      },
      fileOverrides: 'File aggiunti o sostituiti solo per questa distribuzione.',
      fileOverridesItems: FILE_ITEMS,
      allowedRunOverrides: 'Parametri che i chiamanti possono modificare per ogni esecuzione, con convalida. Tutto il resto resta fisso.',
      allowedRunOverridesItems: {
        name: 'Parametro che i chiamanti possono impostare per ogni esecuzione, come model o tone.',
        validation: 'Come viene verificato il valore del chiamante: qualsiasi valore, un elenco di valori, un\'espressione regolare o un intervallo numerico.',
        pattern: 'Valori consentiti separati da virgole, un\'espressione regolare o min,max per un intervallo numerico.'
      },
      nodePoolId: 'Esegui solo sui nodi di questo pool. Lascia vuoto per consentire qualsiasi nodo idoneo.',
      nodeSelector: 'Etichette del nodo che devono corrispondere esattamente, per esempio gpu=true.',
      nodeSelectorItems: {
        key: 'Nome dell\'etichetta che il nodo deve avere.',
        value: 'Valore dell\'etichetta che il nodo deve avere.'
      },
      maxConcurrentRuns: 'Numero massimo di esecuzioni contemporanee di questa distribuzione su tutti i nodi. 0 significa nessun limite.',
      timeoutSeconds: 'Scadenza dell\'esecuzione in secondi. Vuoto usa il valore del profilo harness. L\'impostazione del cluster Runtime.MaxRunSeconds limita ogni esecuzione, compresi i limiti per esecuzione.',
      maxAttempts: 'Quante volte in totale si può tentare un\'esecuzione. Tra 1 e 10.',
      steps: {
        approvals: 'Quali chiamate a strumenti l\'harness può effettuare, quali no e quali attendono una persona.',
        basics: 'Nome, agente e peso del traffico.',
        harness: 'Profilo harness, modello, limiti e parametri.',
        prompts: 'Quale modello riempie ciascun ruolo di prompt.',
        resources: 'Server MCP, segreti, area di lavoro e archivio di artefatti.',
        overrides: 'Modifiche per distribuzione ad argomenti, ambiente e file, e cosa possono sovrascrivere i chiamanti.',
        placement: 'Dove possono essere eseguite le esecuzioni e quante contemporaneamente.'
      },
      actions: {
        compilePreview: 'Compila questa distribuzione con un messaggio di esempio e vedi esattamente riga di comando, file e ambiente che riceverebbe un\'esecuzione.',
        test: 'Apri Invoca con questa distribuzione preselezionata per inviarle un messaggio reale.'
      },
      repetitionGuard: 'Ferma un\'esecuzione quando la sua risposta degenera nello stesso testo breve ripetuto più e più volte, o solo in spazi e punteggiatura (esito Ripetizione rilevata). Se non impostato segue il valore del cluster; seleziona o deseleziona la casella per impostarlo su questa distribuzione.',
      maxAssistantChars: 'Massimo di caratteri di testo dell\'assistente che un\'esecuzione può scrivere prima che Garrison la fermi (esito Limite di output superato). 0 significa illimitato; vuoto usa il valore del cluster.',
      noProgressSeconds: 'Ferma un\'esecuzione quando per questi secondi non arrivano testo, ragionamento, chiamate a strumenti né risultati di strumenti mentre nessuna chiamata a strumento è in corso (esito Nessun avanzamento). 0 lo disattiva; vuoto usa il valore del cluster.',
      executor: 'Come vengono eseguite le esecuzioni: Processo (nel worker) o Job Kubernetes (un pod per esecuzione, isolamento più forte). Vuoto segue l\'esecutore predefinito del pool di nodi, altrimenti Processo.',
      podCpuRequest: 'CPU richiesta dal pod di esecuzione, per esempio 250m. Vuoto usa il valore predefinito del worker.',
      podCpuLimit: 'CPU massima utilizzabile dal pod di esecuzione, per esempio 2. Vuoto usa il valore predefinito del worker.',
      podMemoryRequest: 'Memoria richiesta dal pod di esecuzione, per esempio 512Mi. Vuoto usa il valore predefinito del worker.',
      podMemoryLimit: 'Memoria massima utilizzabile dal pod di esecuzione, per esempio 4Gi. Un\'esecuzione oltre il limite viene fermata con l\'esito Pod di esecuzione non riuscito.',
      podEphemeralStorageRequest: 'Disco locale richiesto dal pod di esecuzione per workspace, home e file temporanei, per esempio 1Gi.',
      podEphemeralStorageLimit: 'Disco locale massimo utilizzabile dal pod di esecuzione, per esempio 10Gi. Un pod oltre il limite viene espulso e l\'esecuzione non riesce.',
      useClusterDefault: 'Cancella l\'impostazione propria di questa distribuzione così la protezione dalle ripetizioni torna a seguire il valore del cluster.',
      sections: {
        guards: 'Le protezioni dell\'esecuzione fermano presto le esecuzioni fuori controllo, su ogni harness. Ognuna lasciata vuota segue il suo valore del cluster in Impostazioni (Motore di esecuzione).',
        execution: 'Scegli dove vengono eseguite le esecuzioni e, per quelle Job Kubernetes, CPU, memoria e disco del pod.'
      }
    },
    nodePools: {
      add: 'Crea un pool per raggruppare nodi ed eventualmente riservarli a determinati tenant.',
      name: 'Nome del pool. I nodi entrano in un pool quando si registrano e le distribuzioni possono richiederne uno.',
      description: 'Quale hardware o scopo rappresenta questo pool.',
      tenants: 'Tenant autorizzati a usare il pool. Vuoto indica tutti i tenant.',
      defaultExecutor: 'Esecutore per le esecuzioni dei deployment di questo pool che non ne scelgono uno. Vuoto significa Processo.',
      active: 'I pool inattivi non accettano nuove esecuzioni.'
    },
    runs: {
      ...TELEMETRY,
      id: 'Identificatore dell\'esecuzione. Fai clic sulla riga per aprire trascrizione, risultato e telemetria.',
      agentName: 'L\'agente invocato. Un\'esecuzione appartiene sempre a una distribuzione di quell\'agente.',
      status: 'A che punto del ciclo di vita si trova l\'esecuzione: in coda, assegnata, in esecuzione o in uno degli stati finali.',
      outcome: 'Perché l\'esecuzione è terminata, con più dettaglio dello stato, per esempio «Credenziali mancanti».',
      harnessType: 'L\'harness che ha eseguito l\'esecuzione, preso dal profilo della distribuzione.',
      leaseNodeName: 'Il nodo worker che l\'ha eseguita. Vuoto finché l\'esecuzione è ancora in coda.',
      depth: 'A quanti livelli di chiamate da agente ad agente si trova questa esecuzione. 0 indica un\'esecuzione avviata direttamente da un chiamante.',
      createdUtc: 'Quando è stata richiesta l\'esecuzione. Passa il mouse sul valore per l\'ora esatta.',
      actions: {
        cancel: 'Ferma questa esecuzione. Il worker termina il processo dell\'harness e l\'esecuzione finisce come «Annullata».',
        retry: 'Avvia una nuova esecuzione con lo stesso input e la stessa distribuzione. L\'esecuzione originale viene conservata.'
      },
      conversationId: 'La conversazione di cui questa esecuzione è un turno, con il numero del turno. Vuoto per le esecuzioni fuori da una conversazione.',
      conversationTurn: 'Posizione di questa esecuzione nella sua conversazione; il turno che l\'ha avviata è il numero 1.'
    },
    nodes: {
      containerized: 'Indica se il worker viene eseguito in un container o in un pod, come ha comunicato alla registrazione. Le esecuzioni Codex su un worker in container usano per impostazione predefinita la sandbox danger-full-access, perché il container è il confine di isolamento.',
      name: 'Nome del nodo, di solito il nome del pod Kubernetes del worker.',
      status: 'Se il nodo accetta nuove esecuzioni. Isola o svuota un nodo prima della manutenzione.',
      capacity: 'Esecuzioni detenute ora dal nodo rispetto al massimo che accetta contemporaneamente.',
      harnesses: 'Harness che il nodo ha trovato installati e funzionanti durante il controllo all\'avvio.',
      executors: 'Esecutori offerti dal nodo. Job Kubernetes compare solo quando il worker gira in un cluster con il permesso di creare Job.',
      labels: 'Etichette chiave e valore pubblicate dal nodo. I selettori di nodo delle distribuzioni vengono confrontati con queste.',
      nodeVersion: 'Versione del software worker sul nodo.',
      lastHeartbeatUtc: 'Quando il nodo si è fatto sentire l\'ultima volta. I nodi che smettono di farlo vengono contrassegnati come persi.',
      address: 'Indirizzo indicativo riportato dal nodo.',
      maxConcurrentRuns: 'Numero massimo di esecuzioni che questo nodo accetta contemporaneamente.',
      childReserveSlots: 'Posti extra per le esecuzioni delegate attese dal loro padre: se ne apre uno per ogni esecuzione di questo nodo che attende una figlia, fino a questo numero.',
      maxResidentWaiters: 'Numero massimo di esecuzioni di questo nodo che possono attendere un\'esecuzione delegata contemporaneamente. 0 indica la sua capacità. Una delega oltre questo limite fallisce con DelegationCapacityExhausted.',
      activeRuns: 'Esecuzioni detenute dal nodo in questo momento.',
      capabilities: 'Cosa ha trovato ogni controllo degli harness: tipo, versione rilevata e se è utilizzabile.',
      labelsItems: { key: 'Nome dell\'etichetta, confrontato dai selettori di nodo delle distribuzioni.', value: 'Valore dell\'etichetta, confrontato esattamente dai selettori di nodo delle distribuzioni.' },
      capabilitiesItems: {
        harnessType: 'Harness verificato dal controllo.',
        detectedVersion: 'Stringa di versione riportata dall\'harness.',
        available: 'Se l\'harness può essere eseguito su questo nodo.',
        detail: 'Output del controllo, utile quando un harness non è disponibile.'
      },
      actions: {
        grafana: 'Apri in una nuova scheda la dashboard Workers in Grafana, filtrata sul nodo {{node}}.',
        cordon: 'Smetti di inviare nuove esecuzioni a questo nodo. Quelle già presenti terminano normalmente.',
        uncordon: 'Consenti di nuovo a questo nodo di accettare nuove esecuzioni.',
        drain: 'Blocca le nuove esecuzioni e lascia terminare quelle correnti, poi il nodo resta inattivo. Usalo prima di spegnerlo.',
        runs: 'Apri l\'elenco Esecuzioni filtrato sulle esecuzioni eseguite da questo nodo.'
      }
    },
    controlNodes: {
      name: 'Nome della replica: l\'ID nodo con cui gira il server (GARRISON_NODE_ID, il nome del pod in Kubernetes).',
      status: 'Ciclo di vita della replica: In avvio, Pronto, In svuotamento oppure Offline. Solo le repliche pronte gestiscono traffico.',
      version: 'Versione del server Garrison eseguita da questa replica. Versioni diverse sono previste solo durante un aggiornamento graduale.',
      schemaVersion: 'Versione dello schema del database trovata dalla replica all\'avvio. Tutte le repliche dovrebbero riportare lo stesso numero.',
      backplane: 'Come questa replica condivide gli eventi in tempo reale (stream delle esecuzioni, aggiornamenti WebSocket) con le altre repliche.',
      uptime: 'Da quanto tempo è in esecuzione il processo della replica, contato dal suo avvio. Passa il puntatore per vedere l\'avvio esatto.',
      lastHeartbeatUtc: 'Quando la replica ha inviato l\'ultimo heartbeat. Le repliche ne inviano uno ogni 5 secondi; oltre 15 secondi il valore viene evidenziato come silente.',
      activeRequests: 'Richieste HTTP che la replica stava gestendo al suo ultimo heartbeat.',
      openStreams: 'Stream di eventi inviati dal server e connessioni WebSocket aperti sulla replica al suo ultimo heartbeat.',
      heldLongPolls: 'Long poll di lease dei worker che la replica teneva al suo ultimo heartbeat. I worker inattivi aspettano lì nuove esecuzioni.',
      address: 'Indirizzo IP e porta REST della replica, come li ha segnalati.',
      hostname: 'Nome host della macchina o del pod su cui gira la replica.',
      startedUtc: 'Quando è partito il processo della replica, nel tuo fuso orario locale.',
      id: 'ID nodo della replica. Corrisponde a respondingNodeId nelle risposte dell\'API e all\'etichetta node nelle metriche.',
      isLeader: 'Indica se questa replica detiene il lease di leader per la manutenzione. Una sola replica è leader alla volta.',
      leaderEpoch: 'Epoca di fencing del lease di leader. Aumenta ogni volta che la leadership passa a un\'altra replica.',
      respondingNodeId: 'La replica che ha risposto a questa singola lettura. Dietro un bilanciatore di carico può essere diversa da quella mostrata.',
      answeredBy: 'Il nodo di controllo che ha risposto alla richiesta di questo elenco (respondingNodeId). Dietro un bilanciatore di carico, ogni aggiornamento può ricevere risposta da una replica diversa.',
      badges: {
        leader: 'Leader: questa replica detiene il lease di manutenzione. Esegue la pulizia in base alla conservazione, contrassegna come offline le repliche silenti e svolge il resto della manutenzione del cluster.',
        leaderEpoch: 'Leader: questa replica detiene il lease di manutenzione (epoca {{epoch}}). Esegue la pulizia in base alla conservazione, contrassegna come offline le repliche silenti e svolge il resto della manutenzione del cluster.',
        stale: 'Silente: nessun heartbeat da più di {{seconds}} secondi, anche se le repliche ne inviano uno ogni 5 secondi. La replica può essere sovraccarica, isolata o non più attiva; il leader la contrassegna come offline dopo 30 secondi.'
      },
      actions: {
        grafana: 'Apri la dashboard di panoramica di Garrison in Grafana in una nuova scheda, filtrata sul nodo di controllo {{node}}.'
      }
    },
    audit: {
      createdUtc: 'Quando si è verificato l\'evento, nel tuo fuso orario locale.',
      eventType: 'Che tipo di evento di sicurezza o configurazione era.',
      principalName: 'Chi lo ha compiuto: un utente, una chiave di accesso o un\'esecuzione che agisce per un agente.',
      resource: 'Il tipo di record e l\'operazione coinvolti, per esempio Agent / Read.',
      reason: 'Perché si è verificato l\'evento o perché l\'accesso è stato negato.',
      sourceIp: 'Indirizzo di rete da cui proviene la richiesta.',
      principalType: 'Se l\'autore era un utente, una chiave di accesso o un token di esecuzione.',
      principalId: 'Identificatore dell\'utente, della chiave di accesso o dell\'esecuzione che ha agito.',
      resourceType: 'Tipo di record coinvolto, come Agent o Secret.',
      resourceId: 'Identificatore del record coinvolto.',
      operation: 'Operazione tentata, come Read o Execute.',
      method: 'Metodo HTTP della richiesta.',
      path: 'Percorso della richiesta che ha causato l\'evento.',
      authResult: 'Esito della verifica dell\'identità del chiamante.',
      authorizationResult: 'Esito della verifica di cosa può fare il chiamante.',
      bypassReason: 'Perché l\'autorizzazione è stata saltata, per esempio per un amministratore di sistema.',
      statusCode: 'Stato HTTP restituito al chiamante.',
      requestId: 'Identificatore della richiesta. Usalo per cercare nella Cronologia richieste o nei log del server.'
    },
    manifestApplies: {
      createdUtc: 'Quando il manifest è stato applicato o simulato.',
      principalName: 'L\'utente o la chiave di accesso che ha applicato il manifest.',
      dryRun: '«Sì» indica che è stato solo convalidato e non è stato scritto nulla.',
      counts: 'Quanti documenti hanno creato, aggiornato, lasciato invariati o fatto fallire record.'
    },
    conversations: {
      title: 'La prima riga del primo messaggio, che dà il nome alla conversazione. Fai clic sulla riga per aprirne i turni.',
      agentName: 'L\'agente con cui si svolge la conversazione. Ogni turno va a questo agente.',
      state: 'In lavorazione finché un turno non è concluso; fino ad allora un nuovo messaggio viene rifiutato. In attesa quando si può inviare il messaggio successivo.',
      turnCount: 'Quanti turni (esecuzioni) ha avuto la conversazione, compresi quelli falliti.',
      affinityNodeName: 'Il nodo worker che conserva l\'area di lavoro e la sessione dell\'harness della conversazione. Il turno successivo preferisce questo nodo per poter riprendere.',
      fallbackCount: 'Quanti turni non hanno potuto riprendere la sessione dell\'harness e ne hanno avviata una nuova con la trascrizione dei turni precedenti.',
      lastFallbackReason: 'Perché il turno ricostruito più recente non ha potuto riprendere la sessione, per esempio perché il nodo di affinità non era pronto.',
      harnessType: 'L\'harness che esegue ogni turno, preso dalla distribuzione del primo turno.',
      callerName: 'Chi ha avviato la conversazione: un utente, una chiave di accesso o l\'esecuzione di un altro agente.',
      contextId: 'L\'ID di contesto A2A fornito dal client, quando la conversazione è arrivata tramite A2A. Vuoto per le conversazioni avviate tramite REST o MCP.',
      sessionId: 'La sessione dell\'harness che il turno successivo riprende. Vuoto finché un turno non ne segnala una.',
      lastActivityUtc: 'Quando l\'ultimo turno è stato inviato o è terminato. Passa il puntatore sul valore per l\'ora esatta.',
      createdUtc: 'Quando il primo turno ha avviato la conversazione. Passa il puntatore sul valore per l\'ora esatta.',
      id: 'Identificatore della conversazione. Passalo come conversationId quando invochi l\'agente per inviare il turno successivo.',
      fallbackLast: 'Turni che hanno avviato una nuova sessione dalla trascrizione. Motivo più recente: {{reason}}.',
      states: {
        busy: 'Un turno di questa conversazione è ancora in coda o in esecuzione. Attendi che finisca, o annullalo, prima di inviare il messaggio successivo.',
        idle: 'Nessun turno è in corso. Il messaggio successivo continua la conversazione.'
      },
      actions: {
        continue: 'Apri Invoca con questa conversazione selezionata, così il messaggio successivo viene inviato come suo turno successivo.',
        runs: 'Apri l\'elenco Esecuzioni filtrato sui turni di questa conversazione, con tutte le colonne e i filtri delle esecuzioni.'
      }
    }
  },
  views: {
    approvalDetail: {
      openRun: 'Apri l\'esecuzione che ha chiesto, per leggerne la trascrizione attorno a questa chiamata a strumento.',
      openAgent: 'Apri la pagina dell\'agente con le sue distribuzioni e le esecuzioni recenti.',
      openDeployment: 'Apri la scheda Distribuzioni filtrata su questa distribuzione, dove si modificano le sue regole di approvazione.',
      backToInbox: 'Torna alla casella delle approvazioni con tutte le approvazioni in sospeso.',
      viewJson: 'Mostra il record completo dell\'approvazione come JSON, esattamente come lo restituisce l\'API.',
      request: 'Cosa ha chiesto di fare l\'harness: il riepilogo di una riga e l\'input completo dello strumento con i segreti oscurati.',
      rules: 'La regola della distribuzione che ha corrisposto, la regola suggerita da questa chiamata e la regola memorizzata dalla decisione.',
      copyRule: 'Copia la regola suggerita, per esempio per incollarla nelle regole di approvazione della distribuzione.'
    },
    home: {
      observabilityState: {
        reachable: 'Il server ha raggiunto {{service}} al suo URL interno negli ultimi 30 secondi.',
        unreachable: 'Il server non è riuscito a raggiungere {{service}} al suo URL interno. Controlla che il servizio sia attivo e che l\'impostazione dell\'URL interno punti a esso.',
        checking: 'Sto chiedendo al server se {{service}} è raggiungibile.',
        unknown: 'Il server non ha indicato se {{service}} è raggiungibile. Il controllo non è riuscito oppure questo server non lo supporta ancora.'
      },
      observabilityVersion: 'Versione che {{service}} ha indicato al controllo di stato del server.',
      kpisGrafana: 'Apri in una nuova scheda la dashboard di panoramica di Garrison in Grafana per vedere questi numeri nel tempo.',
      grafanaDashboards: 'La cartella Garrison in Grafana contiene una dashboard per sezione. Ogni link apre la dashboard in una nuova scheda.',
      grafanaSections: {
        overview: 'Stato a colpo d\'occhio: repliche e worker attivi, frequenza di esecuzioni e richieste, errori, costo e problemi recenti.',
        http: 'Traffico REST per route: frequenza delle richieste, percentili di latenza, errori, dimensioni dei payload, errori di autenticazione e richieste in corso.',
        runs: 'Ciclo di vita delle esecuzioni: create e terminate per esito, durata delle fasi, annullamenti, validazione dell\'output strutturato e riparazioni.',
        agents: 'Prestazioni per agente: invocazioni, percentili di durata e di attesa in coda, tempo al primo token, tempo di streaming, esiti e interventi delle protezioni.',
        models: 'Uso di token e costo per modello e agente: token di input, output, in cache e di ragionamento, costo e throughput di output.',
        workers: 'Nodi worker: lease, esecuzioni per nodo, report di completamento, heartbeat, slot liberi e chiamate al piano di controllo.',
        kubernetes: 'Esecutore con un pod per esecuzione: Job creati ed eliminati, latenza di avvio dei pod, errori dei pod per causa e pulizia degli orfani.',
        protocols: 'MCP, A2A e streaming: chiamate agli strumenti e durata, sessioni, metodi A2A e stati delle attività, stream SSE, WebSocket e delega.',
        scheduler: 'Pianificazione: profondità della coda per agente e harness, esiti e latenza delle acquisizioni, long poll dei lease, esecuzioni bloccate e lease scaduti.',
        database: 'Database: latenza delle istruzioni per operazione e tabella, errori, connessioni in uso, attese del lock di scrittura e conservazione.',
        controlPlane: 'Repliche del piano di controllo: stato, cambi di leader, traffico e ritardo del backplane, heartbeat e iterazioni dei servizi in background.',
        security: 'Errori di autenticazione per schema e motivo, dinieghi di autorizzazione, limitazione della frequenza, token emessi, decifratura dei segreti e rinnovi dei token Codex.',
        integrations: 'Chiamate in uscita per servizio: test dei server MCP, controlli di osservabilità, proxy MCP, API Kubernetes e piano di controllo dal lato dei worker.',
        logs: 'Volume dei log, errori e avvisi per componente e tenant, righe di errore recenti e link alle tracce.'
      },
      observabilityDocs: 'Apri la guida alla telemetria in una nuova scheda: come raccogliere le metriche di Garrison e collegare Grafana, Prometheus, Tempo o Loki.',
      observability: 'Collegamenti agli strumenti di metriche, dashboard e tracciamento che questa installazione dichiara configurati. I servizi non configurati non vengono mostrati.',
      kpis: {
        agents: 'Agenti definiti in questo tenant. Fai clic per aprire l\'elenco Agenti.',
        deployments: 'Distribuzioni di tutti gli agenti. Ognuna è un modo in cui un agente può essere eseguito. Fai clic per aprirle.',
        activeRuns: 'Esecuzioni assegnate o in esecuzione su un worker in questo momento. Fai clic per vederle.',
        queued: 'Esecuzioni in attesa di un nodo worker. Un numero che continua a crescere indica che servono più nodi o più capacità.',
        succeeded: 'Esecuzioni completate con successo nelle ultime 24 ore. Fai clic per elencarle.',
        failed: 'Esecuzioni non riuscite nelle ultime 24 ore. Fai clic per elencarle e leggerne il motivo.',
        nodes: 'Nodi worker pronti a ricevere esecuzioni, sul totale dei nodi registrati. Fai clic per gestirli.',
        controlNodes: 'Repliche del piano di controllo pronte, sul totale delle repliche registrate (le righe offline restano in elenco per 24 ore). Il leader è {{leader}}. Fai clic per aprire Flotta > Piano di controllo.',
        controlNodesNoLeader: 'Repliche del piano di controllo pronte, sul totale delle repliche registrate (le righe offline restano in elenco per 24 ore). Al momento nessuna replica detiene il lease di leader, quindi la manutenzione del cluster è in pausa. Fai clic per aprire Flotta > Piano di controllo.'
      },
      openFailure: 'Apri questa esecuzione non riuscita per leggerne trascrizione, errore e stderr.',
      openControlPlane: 'Apri Flotta > Piano di controllo per vedere ogni replica con stato, leader, versione, heartbeat e attività.',
      openWorkers: 'Apri Flotta > Nodi worker per vedere ogni worker con capacità, harness e heartbeat, e per isolarlo o svuotarlo.',
      cta: {
        invoke: 'Invia un messaggio a qualsiasi agente dal browser.',
        addAgent: 'Vai ad Agenti per creare una nuova identità di agente.',
        applyManifest: 'Applica la configurazione come YAML, per esempio un agente di esempio.',
        inspectRuns: 'Sfoglia tutte le esecuzioni con filtri e telemetria.',
        nodes: 'Vedi quali nodi worker sono pronti e cosa possono eseguire.',
        apiExplorer: 'Prova dal vivo qualsiasi chiamata API su questo server.',
        analytics: 'Vedi velocità delle esecuzioni, token, costi ed esiti nel tempo.'
      },
      services: {
        loki: 'Apri Loki in una nuova scheda per cercare nei log di Garrison.',
        grafana: 'Apri in una nuova scheda le dashboard Grafana con le metriche di Garrison.',
        prometheus: 'Apri in una nuova scheda il server Prometheus che raccoglie le metriche di Garrison.',
        tempo: 'Apri Tempo in una nuova scheda per sfogliare le tracce.'
      },
      serviceGeneric: 'Apri questo servizio incluso in una nuova scheda.'
    },
    runDetail: {
      openApproval: 'Apri questa approvazione con l\'input completo dello strumento, la regola e la decisione.',
      reviewApprovals: 'Mostra le approvazioni di questa esecuzione, dove puoi consentire o negare le chiamate a strumenti in sospeso.',
      approvalActions: 'Consenti o nega una chiamata a strumento in sospeso, oppure apri l\'approvazione per vedere tutti i campi.',
      viewTrace: 'Apri in una nuova scheda la traccia di questa esecuzione in Grafana Explore (Tempo). Mostra gli span di compilazione, acquisizione e harness sul server e sul nodo worker.',
      viewLogs: 'Apri in una nuova scheda le righe di log del server e del worker su questa esecuzione in Grafana Explore (Loki), limitate all\'intervallo dell\'esecuzione.',
      traceId: 'ID traccia W3C della traccia in cui è stata compilata questa esecuzione. Cercalo in Tempo oppure usa Visualizza traccia. Vuoto per le esecuzioni create prima che gli ID traccia venissero registrati.',
      eventCode: 'Che tipo di messaggio ha scritto qui Garrison, nella tua lingua. Il testo accanto è il messaggio originale del server o del worker.',
      openTemplate: 'Apri il modello {{name}}. Questa esecuzione ha usato la versione {{version}}; la scheda Versioni mostra quel contenuto e la differenza con quello attuale.',
      templatesUsed: 'Le versioni esatte dei modelli di prompt con cui è stata compilata questa esecuzione. Fai clic su una per aprire il modello e confrontare le versioni.',
      live: 'Gli eventi arrivano in streaming dal server man mano che l\'harness li produce.',
      viewJson: 'Mostra il record completo dell\'esecuzione come JSON, con tutti i campi di telemetria.',
      deployment: 'La distribuzione scelta per questa esecuzione, per nome o in base al peso del traffico.',
      model: 'Il modello che l\'harness ha dichiarato di aver effettivamente usato, che può differire da quello richiesto dalla distribuzione.',
      tokens: 'Token di input e di output per l\'intera esecuzione. Il pannello di telemetria qui sotto contiene il dettaglio completo.',
      caller: 'Chi ha avviato l\'esecuzione: un utente, una chiave di accesso o l\'esecuzione di un altro agente.',
      parent: 'L\'esecuzione che ha delegato a questa, quando un agente ha chiamato un altro agente.',
      openParent: 'Apri l\'esecuzione padre che ha delegato questo lavoro.',
      attempt: 'Di quale tentativo si tratta, rispetto al massimo consentito dalla distribuzione.',
      outputSchema: 'Indica se l\'output finale corrispondeva al JSON Schema di output dell\'agente. In caso contrario, se l\'harness può riprendere la sessione, Garrison invia un prompt di correzione nella stessa sessione. Gli eventi di avviso della trascrizione elencano gli errori di convalida.',
      created: 'Quando è stata richiesta l\'esecuzione.',
      started: 'Quando il processo dell\'harness è stato avviato sul worker.',
      completed: 'Quando l\'esecuzione ha raggiunto lo stato finale.',
      exitCode: 'Codice di uscita del processo dell\'harness. Il successo di solito si valuta dall\'evento finale, non da questo codice.',
      tabs: {
        approvals: 'Chiamate a strumenti per cui questa esecuzione ha chiesto autorizzazione, come è stata decisa ciascuna, e Consenti e Nega per quelle in sospeso.',
        transcript: 'Ogni evento prodotto dall\'harness: testo dell\'assistente, ragionamento, chiamate a strumenti e risultati, e utilizzo.',
        result: 'La risposta finale ed eventuale output strutturato.',
        input: 'Cosa ha inviato il chiamante, i parametri e le versioni esatte dei modelli di prompt usati.',
        stderr: 'L\'ultima parte dello standard error dell\'harness, con i segreti rimossi. Guarda qui quando un\'esecuzione fallisce.',
        children: 'Esecuzioni avviate da questa esecuzione chiamando altri agenti.'
      },
      eventFilter: 'Mostra solo un tipo di evento, come chiamate a strumenti o errori.',
      openChild: 'Apri questa esecuzione figlia, avviata quando questa esecuzione ha chiamato un altro agente.',
      eventCodes: {
        ApprovalRequested: 'L\'harness ha chiesto prima di una chiamata a strumento e la chiamata attende una persona. Decidila nella scheda Approvazioni.',
        ApprovalDecided: 'Una richiesta di autorizzazione è stata decisa da una regola, dal predefinito della distribuzione, da una persona o da un timeout. Il testo indica quale.',
        RunGuardTriggered: 'Una protezione ha fermato questa esecuzione. Il messaggio dice quale protezione è scattata e cosa ha visto; l\'esecuzione termina come Non riuscita con l\'esito di quella protezione e conserva l\'output parziale.',
        ConversationFallback: 'Questo turno non ha potuto riprendere la sessione dell\'harness della conversazione, quindi ne ha avviata una nuova con la trascrizione dei turni precedenti. Il messaggio indica il motivo.',
        ConversationStateLost: 'Il nodo ha preso questo turno ma le cartelle della conversazione mancavano, quindi il turno è tornato in coda per essere eseguito come ricostruzione.'
      },
      conversation: 'La conversazione di cui questa esecuzione è un turno, e il numero del turno. Fai clic per aprire la conversazione.',
      openConversation: 'Apri la conversazione con tutti i turni e una casella per inviare il successivo.',
      conversationSession: 'Se questo turno ha ripreso la sessione dell\'harness della conversazione o ne ha avviata una nuova dalla trascrizione, e perché.',
      resumeSessionId: 'La sessione dell\'harness ripresa da questo turno, lasciata dal turno precedente.',
      affinityNode: 'Il nodo che conserva le cartelle della conversazione. Gli altri nodi lasciano il turno fino all\'ora indicata, a meno che questo nodo non sia più pronto.'
    },
    agentDetail: {
      name: 'Il nome che i chiamanti usano per invocare questo agente.',
      viewJson: 'Mostra il record completo dell\'agente come JSON.',
      invoke: 'Apri Invoca con questo agente selezionato. La distribuzione viene scelta in base al peso, a meno che tu non ne indichi una.',
      grafana: 'Apri in una nuova scheda la dashboard Agenti di Grafana filtrata su questo agente: invocazioni, percentili di durata, tempo al primo token, tempo di streaming, token, costo e interventi delle protezioni.',
      id: 'Identificatore dell\'agente per le chiamate API.',
      tabs: {
        deployments: 'I modi in cui viene eseguito questo agente, con i loro pesi e la quota di traffico che riceve ciascuno.',
        runs: 'Le esecuzioni più recenti di questo agente.',
        card: 'La card A2A che gli altri agenti leggono per scoprire questo agente.'
      },
      addDeployment: 'Vai a Distribuzioni per crearne una per questo agente. Senza distribuzione non può essere eseguito.',
      manageDeployments: 'Apri la scheda Distribuzioni per modificare pesi, modelli e associazioni.',
      openRun: 'Apri trascrizione e telemetria di questa esecuzione.',
      columns: {
        name: 'Nome della distribuzione. I chiamanti possono indicarlo esplicitamente per evitare la scelta ponderata.',
        harness: 'Il profilo harness che avvia la CLI per questa distribuzione.',
        model: 'Il modello che questa distribuzione chiede all\'harness di usare.',
        weight: 'Il peso del traffico grezzo impostato sulla distribuzione.',
        traffic: 'Quota di invocazioni ricevuta da questa distribuzione: il suo peso diviso per la somma dei pesi attivi.',
        active: 'Solo le distribuzioni attive ricevono traffico ponderato.'
      },
      conversations: 'Apri l\'elenco Conversazioni filtrato su questo agente.'
    },
    queue: {
      queued: 'Esecuzioni in attesa di un nodo. Fai clic per elencarle.',
      leased: 'Esecuzioni prese in carico da un nodo ma non ancora avviate. Fai clic per elencarle.',
      running: 'Esecuzioni in corso ora. Fai clic per elencarle.',
      agent: 'L\'agente a cui appartiene il lavoro in attesa.',
      harness: 'L\'harness di cui hanno bisogno quelle esecuzioni. Solo i nodi che lo dichiarano possono prenderle.'
    },
    invoke: {
      stream: {
        tabs: {
          preview: 'Segui la risposta mentre arriva in streaming, formattata in Markdown, con ragionamento e chiamate agli strumenti. Selezionata mentre un\'esecuzione è in corso.',
          response: 'Il risultato finale dell\'esecuzione: testo del risultato (formattato o grezzo), output strutturato, esito, errori, telemetria e link.'
        },
        live: 'L\'esecuzione è in corso. Questa vista si aggiorna man mano che l\'output arriva dal flusso di eventi in diretta.',
        finished: 'L\'esecuzione è terminata e non arriverà altro output. La scheda Risposta contiene il risultato finale.',
        elapsed: 'Tempo da quando hai fatto clic su Invia, misurato nel browser. Si ferma quando l\'esecuzione termina.',
        firstToken: 'Tempo da Invia al primo output in streaming (testo o ragionamento), misurato nel browser, quindi include coda e avvio dell\'harness. La pagina dell\'esecuzione mostra il valore misurato dal nodo worker.',
        tokensPerSecond: 'Token di output al secondo durante lo streaming, in base all\'utilizzo riportato dall\'harness. Al termine dell\'esecuzione mostra la velocità misurata dal server.',
        codexNote: 'Codex stampa ogni messaggio solo quando è completo (codex exec --json), quindi nulla arriva token per token. Il tempo trascorso continua a scorrere mentre lavora.',
        showResponse: 'Passa alla scheda Risposta per il risultato finale, l\'output strutturato e la telemetria.',
        reasoning: 'Testo di ragionamento prodotto dal modello prima o tra le risposte. Compresso per impostazione predefinita; fai clic per espanderlo.',
        jump: 'Scorri all\'output più recente e torna a seguire il flusso man mano che arriva.',
        tool: {
          running: 'L\'agente ha chiamato lo strumento {{name}} e attende il risultato.',
          ok: 'Lo strumento {{name}} ha restituito un risultato senza errori.',
          failed: 'Lo strumento {{name}} ha restituito un errore. L\'agente può riprovare o continuare senza.'
        }
      },
      applySample: 'Vai a Manifest, dove il manifest di esempio crea un agente da provare subito.',
      agent: 'L\'agente da chiamare. Sono elencati solo gli agenti attivi.',
      deployment: 'Lascia «Qualsiasi distribuzione attiva (ponderata)» per far scegliere a Garrison in base al peso del traffico, oppure scegli una distribuzione per provarla direttamente.',
      parameter: 'Valore per esecuzione di {{name}}. La distribuzione consente ai chiamanti di sovrascriverlo; lascia vuoto per il valore predefinito.',
      message: 'Cosa vuoi che faccia l\'agente. Viene inviato come input dell\'esecuzione e racchiuso dal modello di prompt Attività.',
      send: 'Avvia un\'esecuzione con questo messaggio e mostra qui la sua trascrizione in streaming.',
      openRun: 'Apri la pagina completa dell\'esecuzione con risultato, telemetria e stderr.',
      stopOnLeave: 'Se attivo, Garrison annulla l\'esecuzione in corso quando lasci questa pagina, chiudi la scheda o invii un nuovo messaggio, così nessuno paga per un output che nessuno legge. Disattivalo per lasciar proseguire le esecuzioni; restano nella pagina Esecuzioni. Viene ricordato in questo browser.',
      cancel: 'Ferma subito questa esecuzione. Il nodo worker termina il processo dell\'harness in pochi secondi e l\'output ottenuto viene conservato.',
      cancelling: 'Annullamento richiesto. Il nodo worker sta fermando l\'harness; passa allo stato finale quando l\'esecuzione segnala Annullata.',
      sendReplaces: 'Annulla l\'esecuzione in corso, poi avviane una nuova con questo messaggio. Disattiva "Ferma l\'esecuzione quando esco" per lasciare proseguire l\'esecuzione attuale.',
      sendKeeps: 'Avvia una nuova esecuzione con questo messaggio. L\'esecuzione in corso prosegue perché "Ferma l\'esecuzione quando esco" è disattivato; la trovi nella pagina Esecuzioni.',
      timeLimit: 'Scadenza facoltativa di questa esecuzione, in secondi, che questa distribuzione consente di impostare. Lascia vuoto per il valore della distribuzione. L\'esecuzione va in timeout quando supera il limite.',
      timePreset: 'Imposta il limite di tempo di questa esecuzione a {{value}}.',
      timePresetClear: 'Togli il limite di tempo così l\'esecuzione usa il valore della distribuzione.',
      conversation: {
        mode: 'Esegui una sola volta, avvia una nuova conversazione i cui turni successivi riprendono questa sessione dell\'harness, oppure invia il turno successivo di una conversazione esistente.',
        pick: 'La conversazione da continuare. Sono elencate solo le conversazioni di questo agente, dalle più recenti.',
        deploymentPinned: 'Una conversazione resta sulla distribuzione del suo primo turno, quindi la distribuzione è fissa mentre la continui.',
        open: 'Apri la conversazione a cui appartiene questa esecuzione, con tutti i turni e una casella per inviare il successivo.'
      }
    },
    manifests: {
      warnings: 'Valori di questo documento accettati ma salvati in modo diverso, ad esempio un numero fuori intervallo che è stato limitato. L\'elenco sotto la riga indica ogni campo.',
      planned: 'Cosa farebbe l\'applicazione di questo documento: creare il record, aggiornarlo o lasciarlo invariato. Una simulazione convalida senza cambiare nulla.',
      changes: { after: 'Il valore che il manifest imposta. I valori lunghi vengono troncati a 200 caratteri.', before: 'Il valore salvato ora. I valori lunghi vengono troncati a 200 caratteri.', field: 'L\'impostazione di questo record che il manifest modifica, per esempio model o parameters.model.' },
      results: 'Cosa ha fatto l\'applicazione con ciascun documento del manifest.',
      kind: 'Il tipo di record descritto dal documento, come Agent o Deployment.',
      name: 'Il nome del record preso dai metadati del documento.',
      result: 'Se il documento ha creato, aggiornato o lasciato invariato un record, oppure se non è riuscito.',
      message: 'Dettagli dal server, come un errore di convalida.',
      tabs: {
        apply: 'Incolla o carica un manifest, convalidalo con una simulazione e applicalo.',
        export: 'Scarica la configurazione di questo tenant come manifest. I valori dei segreti non sono mai inclusi.',
        history: 'Ogni applicazione e simulazione passata, con i risultati per documento.'
      },
      upload: 'Carica nell\'editor un file manifest YAML o JSON dal tuo computer.',
      loadSample: 'Sostituisci il contenuto dell\'editor con il manifest di esempio: un agente echo sull\'harness fittizio.',
      document: 'Uno o più documenti YAML o JSON separati da ---. I record si richiamano tra loro per nome.',
      dryRun: 'Convalida ogni documento e mostra cosa cambierebbe, senza scrivere nulla.',
      apply: 'Convalida e scrivi ogni documento. Se un documento non è valido, non viene scritto nulla.',
      export: 'Genera un manifest che ricrea la configurazione di questo tenant.',
      download: 'Salva il manifest esportato come file YAML.',
      confirmApply: 'Scrivi ora il manifest in questo tenant.'
    },
    templateEditor: {
      cloneName: 'Nome della copia. Vanno bene lettere minuscole, cifre, trattini e barre; il prefisso builtin/ è riservato.',
      cloneConfirm: 'Crea la copia con questo nome e aprila nell\'editor.',
      clone: 'Crea una copia modificabile di questo modello. Scegli il nome della copia prima che venga creata.',
      reset: 'Ripristina questo modello predefinito al contenuto fornito con Garrison.',
      delete: 'Elimina questo modello e le sue versioni. Il server rifiuta finché una distribuzione lo collega; la conferma le elenca.',
      create: 'Crea il modello e la sua prima versione.',
      save: 'Salva il contenuto come nuova versione. Le distribuzioni che seguono la versione più recente la adottano per le nuove esecuzioni.',
      content: 'Il testo del modello. Usa {{variables}}, condizioni, cicli e inclusioni; l\'anteprima si aggiorna mentre digiti.',
      changeNote: 'Una breve nota salvata con la versione, che spiega cosa è cambiato e perché.',
      tabs: {
        preview: 'Renderizza il modello con il contesto di esempio per vedere esattamente cosa riceverebbe un harness.',
        versions: 'Ogni versione salvata, con confronto e ripristino.'
      },
      sampleContext: 'JSON che sostituisce i dati di un\'esecuzione reale. Modificalo per vedere come reagisce il modello.',
      columns: {
        version: 'Numero di versione. Più alto significa più recente.',
        note: 'La nota di modifica salvata con la versione.',
        author: 'Chi ha salvato questa versione del modello.',
        saved: 'Quando è stata salvata la versione.'
      },
      diff: 'Confronta questa versione con il contenuto attuale dell\'editor.',
      restore: 'Rendi di nuovo corrente questa versione. Il contenuto attuale resta nella cronologia.'
    },
    serverInfo: {
      serverInUse: 'L\'indirizzo a cui questa console invia le chiamate API. È GARRISON_API_URL se impostato, altrimenti l\'origine della dashboard.',
      rest: 'Indirizzo base per le chiamate alla REST API e per gli SDK.',
      mcp: 'Indirizzo a cui si connettono i client MCP. Ogni agente esposto come strumento compare lì.',
      a2a: 'Indirizzo base del gateway A2A per questo tenant. Ogni agente ha la propria card sotto questo indirizzo.',
      openapi: 'Il documento OpenAPI che descrive ogni operazione REST.',
      version: 'Versione del server Garrison.',
      dashboardVersion: 'Versione di questa console.',
      node: 'La replica del piano di controllo (nodo di controllo) che ha risposto alla richiesta di info server di questa pagina. Con più repliche, ricaricando può rispondere un\'altra.',
      nodeLink: 'Apri Flotta > Piano di controllo per vedere questa replica accanto alle altre, con stato, heartbeat e se è il leader.',
      database: 'Motore di database usato dal server.',
      health: 'Risultato del controllo di integrità del server.',
      replicas: 'Quante repliche del piano di controllo prevede il cluster.',
      routes: 'Quante operazioni API ha registrato il server.',
      serverTime: 'L\'orologio del server. Grandi differenze rispetto al tuo orologio possono invalidare le richieste firmate.',
      principalName: 'L\'identità con cui hai effettuato l\'accesso.',
      principalType: 'Se hai effettuato l\'accesso come utente o con una chiave di accesso.',
      role: 'Il tuo livello di accesso più alto.',
      tenant: 'Il tenant a cui appartiene la tua sessione.',
      expires: 'Quando termina la tua sessione e dovrai accedere di nuovo.',
      rawJson: 'Mostra la risposta grezza con le informazioni sul server.'
    },
    requests: {
      grafana: 'Apri in una nuova scheda la dashboard HTTP in Grafana: frequenza delle richieste, latenza ed errori nel tempo dalle metriche di Prometheus.',
      kpis: {
        total: 'Richieste conservate dal server nella cronologia per l\'intervallo e i filtri selezionati.',
        success: 'Richieste che hanno restituito uno stato 2xx o 3xx.',
        failure: 'Richieste che hanno restituito uno stato 4xx o 5xx.',
        avgDuration: 'Tempo medio impiegato dal server per rispondere.'
      },
      columns: {
        time: 'Quando è arrivata la richiesta.',
        method: 'Metodo HTTP della richiesta.',
        path: 'Percorso chiamato. Passa il mouse su un valore per vederlo per intero.',
        status: 'Stato HTTP restituito dal server.',
        duration: 'Quanto ha impiegato il server per rispondere.',
        principal: 'Chi ha effettuato la richiesta: un utente, una chiave di accesso o un token di esecuzione.'
      },
      viewDetails: 'Apri la richiesta con header, corpo e tempi.',
      viewJson: 'Apri il record della richiesta, incluso il suo JSON grezzo.',
      deleteOne: 'Rimuovi questa richiesta dalla cronologia.',
      bulkDeleteAll: 'Elimina tutte le richieste che corrispondono ai filtri attuali, non solo quelle di questa pagina.'
    },
    explorer: {
      operations: 'Scegli un\'operazione API, raggruppata per area. Il modulo sottostante si adatta ai suoi parametri.',
      pathParam: 'Parametro di percorso {{name}} ({{type}}). Viene sostituito nell\'URL. {{description}}',
      queryParam: 'Parametro di query {{name}} ({{type}}). Viene aggiunto all\'URL se compilato. {{description}}',
      copyUrl: 'Copia l\'URL della richiesta completamente risolto.',
      headerName: 'Nome di un header della richiesta. Authorization viene aggiunto automaticamente dalla tua sessione.',
      headerValue: 'Valore inviato per questo header.',
      removeHeader: 'Rimuovi questo header dalla richiesta.',
      addHeader: 'Aggiungi un altro header alla richiesta.',
      body: 'Corpo JSON della richiesta per le operazioni che creano o modificano record.',
      execute: 'Invia ora la richiesta al server con la tua sessione. I metodi distruttivi chiedono conferma.',
      stop: 'Interrompi la richiesta o smetti di leggere una risposta in streaming.',
      snippets: {
        curl: 'La stessa richiesta come comando curl per il terminale.',
        fetch: 'La stessa richiesta come codice JavaScript fetch.',
        csharp: 'La stessa richiesta come codice C# HttpClient.'
      },
      clearHistory: 'Dimentica tutte le richieste recenti salvate in questo browser.',
      loadHistory: 'Ricarica questa richiesta nel modulo.',
      deleteHistory: 'Rimuovi questa voce dall\'elenco delle richieste recenti.',
      confirmExecute: 'Invia questa richiesta anche se potrebbe modificare o eliminare dati.'
    },
    settings: {
      settingPath: 'Percorso dell\'impostazione: {{path}}. Usa questo nome nel file delle impostazioni e nella REST API delle impostazioni.',
      viewJson: 'Mostra la risposta grezza delle impostazioni.',
      restart: 'Riavvia questa replica del piano di controllo perché abbiano effetto le impostazioni che richiedono un riavvio.',
      save: 'Salva ogni impostazione modificata. Le impostazioni dinamiche si applicano subito; le altre attendono un riavvio.',
      groupGeneric: 'Impostazioni del gruppo {{group}}.',
      fieldGeneric: 'Impostazione del server {{path}}.',
      applyLive: 'Si applica subito al salvataggio.',
      applyRestart: 'Ha effetto dopo il riavvio del server.',
      source: {
        File: 'Attualmente impostato nel file delle impostazioni. Salvando qui lo aggiorni.',
        Environment: 'Impostato da una variabile d\'ambiente, che prevale su qualsiasi valore salvato qui.',
        ConfigMap: 'Gestito da una ConfigMap di Kubernetes. Modificalo invece nei tuoi manifest.',
        Database: 'Salvato come impostazione di cluster nel database, condivisa da tutte le repliche.'
      },
      sourceGeneric: 'Da dove proviene il valore attuale.',
      testDatabase: 'Prova a connetterti con le impostazioni del database qui sopra prima di salvarle.',
      groups: {
        Observability: 'Dove si trovano Grafana, Prometheus, Loki e Tempo. Gli URL del browser alimentano le schede della Home e i collegamenti a Grafana; il server verifica la raggiungibilità con gli URL interni. Vuoto significa non configurato.',
        Runtime: 'Come il piano di controllo limita le esecuzioni: la durata massima, i valori delle protezioni seguiti dalle distribuzioni e quanto un\'esecuzione in coda può attendere un nodo worker adatto.',
        Rest: 'Come resta in ascolto la REST API: host, porta, TLS e indirizzo pubblico.',
        Mcp: 'Come resta in ascolto il server MCP e quanto possono attendere le chiamate agli strumenti.',
        Database: 'Quale database usa Garrison e come connettersi.',
        Logging: 'Dove vanno i log e quanto sono dettagliati.',
        Auth: 'Firma dei token, durate e limiti di frequenza degli accessi.',
        Security: 'Chiave master di cifratura e account di bootstrap.',
        RequestHistory: 'Se le richieste API vengono registrate e quanta parte di ogni corpo viene conservata.',
        Telemetry: 'Esportazione di metriche e tracce.',
        Archive: 'Dove vengono archiviate esecuzioni ed eventi prima che la conservazione li elimini.',
        Cluster: 'Quante repliche del piano di controllo sono previste.',
        Scheduling: 'Durata dei lease e timeout degli heartbeat per i nodi worker.',
        Runs: 'Valori predefiniti delle esecuzioni e per quanto tempo vengono conservati esecuzioni ed eventi.',
        Audit: 'Per quanto tempo vengono conservati i record di audit.'
      },
      fields: {
        Runtime: {
          MaxRunSeconds: 'La durata massima di qualsiasi esecuzione, in secondi. Timeout delle distribuzioni, limiti per esecuzione e valori dei profili superiori vengono ridotti a questo valore.',
          RepetitionGuard: 'Se le distribuzioni che lasciano vuota la Protezione dalle ripetizioni fermano le esecuzioni la cui risposta degenera in ripetizioni (esito Ripetizione rilevata).',
          MaxAssistantChars: 'Caratteri di testo dell\'assistente dopo i quali un\'esecuzione si ferma (esito Limite di output superato), per le distribuzioni che lasciano vuoto il limite. 0 è illimitato.',
          NoProgressSeconds: 'Secondi senza testo, ragionamento o attività degli strumenti dopo i quali un\'esecuzione si ferma (esito Nessun avanzamento), per le distribuzioni che lasciano vuoto il limite. 0 lo disattiva.',
          ConversationAffinityWaitMs: 'Quanto un turno di conversazione attende il nodo che conserva la sua sessione dell\'harness prima che un altro nodo lo prenda e avvii una nuova sessione dalla trascrizione. Se quel nodo non è pronto, gli altri lo prendono subito. 0 non attende mai.',
          ConversationTranscriptTurns: 'Numero massimo di turni precedenti passati a un turno di conversazione ricostruito in una nuova sessione dell\'harness. Si tengono i più recenti.',
          ConversationTranscriptChars: 'Numero massimo di caratteri di ogni messaggio e risposta precedenti passati a un turno ricostruito. I testi più lunghi vengono tagliati e segnalati come troncati.'
        },
        Scheduling: {
          PauseGraceMs: 'Dopo una sospensione dell\'host o una pausa della VM, il leader attende una finestra di heartbeat più questi millisecondi prima di segnare i nodi come Perso o di far fallire le loro esecuzioni. Predefinito 5000.'
        }
      }
    },
    runGuard: {
      openDeployments: 'Vai a Distribuzioni per cambiare le protezioni di una distribuzione: Protezione dalle ripetizioni, Massimo di caratteri dell\'assistente e Limite senza avanzamento.',
      openSettings: 'Vai a Impostazioni per cambiare i valori del cluster (Motore di esecuzione) seguiti dalle distribuzioni senza protezioni proprie.'
    },
    conversationDetail: {
      viewJson: 'Mostra il record completo della conversazione in formato JSON.',
      openInvoke: 'Apri Invoca con questa conversazione selezionata, per inviare il turno successivo con la vista in streaming completa.',
      delete: 'Elimina questa conversazione. I suoi turni restano nella pagina Esecuzioni come esecuzioni normali, ma la conversazione non si può più continuare.',
      deleteBusy: 'Un turno non è ancora concluso, quindi il server rifiuta di eliminare la conversazione finché quell\'esecuzione non termina o viene annullata.',
      agent: 'L\'agente di questa conversazione. Fai clic per aprire l\'agente.',
      openAgent: 'Apri la pagina di questo agente con le distribuzioni e le esecuzioni recenti.',
      deployment: 'Ogni turno viene eseguito su questa distribuzione: quella a cui è stato indirizzato il primo turno.',
      activeRun: 'Il turno ancora in coda o in esecuzione. Il messaggio successivo viene rifiutato finché non finisce.',
      openRun: 'Apri la pagina di questa esecuzione con la trascrizione completa, il risultato e la telemetria.',
      turns: 'Tutti i turni della conversazione, dal più vecchio. Ogni turno è un\'esecuzione.',
      columns: {
        turn: 'Posizione del turno nella conversazione, a partire da 1.',
        run: 'L\'esecuzione che ha elaborato questo turno. Fai clic per aprirne la trascrizione.',
        status: 'A che punto del ciclo di vita è l\'esecuzione del turno: in coda, in esecuzione o in uno degli stati finali.',
        outcome: 'Perché l\'esecuzione del turno è terminata, con più dettaglio dello stato.',
        session: 'Se il turno ha ripreso la sessione dell\'harness del turno precedente o ne ha avviata una nuova con la trascrizione (e perché).',
        input: 'L\'inizio del messaggio inviato in questo turno. Passa il puntatore per vederne di più.',
        result: 'L\'inizio della risposta, o l\'errore se l\'esecuzione è fallita. Passa il puntatore per vederne di più.',
        node: 'Il nodo worker che ha eseguito il turno.',
        created: 'Quando è stato inviato il turno. Passa il puntatore sul valore per l\'ora esatta.'
      },
      session: {
        first: 'Il primo turno: avvia la sessione dell\'harness che i turni successivi riprendono.',
        resumed: 'Questo turno ha ripreso la sessione dell\'harness {{session}} sul nodo che conserva le cartelle della conversazione, quindi l\'agente ha mantenuto tutto il suo contesto.',
        fallback: 'Questo turno non ha potuto riprendere la sessione, quindi ha avviato una nuova sessione dell\'harness con la trascrizione dei turni precedenti.',
        pending: 'Il turno attende un nodo, quindi non si sa ancora se riprenderà la sessione o verrà ricostruito.'
      },
      continueTitle: 'Invia il messaggio successivo come turno successivo di questa conversazione. Usa lo stesso agente e la stessa distribuzione.',
      message: 'Il messaggio successivo per l\'agente. Continua la conversazione con il contesto dei turni precedenti.',
      send: 'Invia questo messaggio come turno successivo. Il turno compare nell\'elenco sopra e si aggiorna finché non termina.',
      sendBusy: 'Il turno precedente non è ancora concluso. Il server rifiuta un nuovo turno fino ad allora, quindi attendi o annullalo prima.'
    }
  },
  analytics: {
    grafana: 'Apri in una nuova scheda la dashboard Runs in Grafana con lo stesso intervallo di tempo di questa pagina.',
    filters: {
      ttft: 'Se selezionato, il grafico del tempo al primo token esclude il tempo passato ad attendere gli agenti delegati, così gli agenti che delegano si confrontano equamente con quelli che rispondono direttamente.',
      range: 'Finestra temporale di tutti i grafici e totali: l\'ultima ora, giorno, settimana o 30 giorni, oppure un inizio e una fine personalizzati.',
      from: 'Inizio dell\'intervallo personalizzato, nel tuo fuso orario locale.',
      to: 'Fine dell\'intervallo personalizzato, nel tuo fuso orario locale.',
      agentId: 'Conta solo le esecuzioni di questo agente. L\'elenco delle distribuzioni si restringe alle sue.',
      harnessType: 'Conta solo le esecuzioni eseguite da questo harness.',
      deploymentId: 'Conta solo le esecuzioni di questa distribuzione, per esempio per confrontare due modelli dello stesso agente.',
      model: 'Conta solo le esecuzioni il cui harness ha riportato questo modello servito. L\'elenco mostra i modelli visti nell\'intervallo selezionato.',
      groupBy: 'Dividi ogni grafico in una serie per agente, harness, modello o coppia harness e modello, così puoi confrontarli.'
    },
    cards: {
      delegationWait: 'Tempo medio in cui le esecuzioni hanno atteso le esecuzioni figlie delegate. n/d se nessuna esecuzione dell\'intervallo ha delegato.',
      ttftExcludingDelegation: 'Tempo medio al primo token senza l\'attesa degli agenti delegati. La nota mostra il 95° percentile.',
      runs: 'Esecuzioni richieste nell\'intervallo che corrispondono ai filtri.',
      successRate: 'Esecuzioni riuscite come quota delle esecuzioni terminate (riuscite, non riuscite, annullate e scadute).',
      ttft: 'Tempo medio al primo token nelle esecuzioni che hanno prodotto output. La nota mostra il 95° percentile.',
      execution: 'Tempo medio di esecuzione dell\'harness. La nota mostra il 95° percentile, che riflette le esecuzioni lente.',
      queue: 'Tempo medio di attesa delle esecuzioni per un nodo worker.',
      tokens: 'Token di input più token di output di tutte le esecuzioni nell\'intervallo.',
      throughput: 'Media dei token di output al secondo durante lo streaming.',
      cost: 'Costo totale riportato in dollari USA.',
      toolCalls: 'Totale delle chiamate a strumenti effettuate dalle esecuzioni nell\'intervallo.'
    },
    charts: {
      outcomes: 'Come sono terminate le esecuzioni in ogni intervallo di tempo. Passa il mouse su una barra per vedere i conteggi.',
      ttft: 'Quanto hanno impiegato le esecuzioni a produrre il primo token: media, mediana e 95° percentile.',
      duration: 'Per quanto tempo il modello ha prodotto output in streaming e quanto è durato in totale l\'harness.',
      queue: 'Quanto hanno atteso le esecuzioni prima che un nodo le prendesse in lease.',
      tokens: 'Token consumati per intervallo, suddivisi per tipo.',
      throughput: 'Velocità di generazione dell\'output in token al secondo.',
      cost: 'Spesa riportata per intervallo.',
      toolCalls: 'Chiamate a strumenti effettuate per intervallo.',
      usageTokens: 'Token di input più output nel tempo, un segmento impilato per ogni coppia harness e modello. Passa il mouse su una barra per la suddivisione.',
      usageCost: 'Costo riportato nel tempo, un segmento impilato per ogni coppia harness e modello. Passa il mouse su una barra per la suddivisione.'
    },
    metrics: {
      delegationWaitMsAvg: 'Tempo medio di attesa delle esecuzioni figlie delegate. Fai clic per nascondere o mostrare questa linea.',
      timeToFirstTokenExcludingDelegationMsP95: '95° percentile del tempo al primo token senza l\'attesa delle esecuzioni delegate. Fai clic per nascondere o mostrare questa linea.',
      timeToFirstTokenExcludingDelegationMsP50: 'Mediana del tempo al primo token senza l\'attesa delle esecuzioni delegate. Fai clic per nascondere o mostrare questa linea.',
      timeToFirstTokenExcludingDelegationMsAvg: 'Tempo medio al primo token senza l\'attesa delle esecuzioni delegate. Fai clic per nascondere o mostrare questa linea.',
      runs: 'Esecuzioni richieste nell\'intervallo.',
      succeeded: 'Esecuzioni terminate con successo. Fai clic per nascondere o mostrare questa serie.',
      failed: 'Esecuzioni non riuscite. Fai clic per nascondere o mostrare questa serie.',
      cancelled: 'Esecuzioni annullate. Fai clic per nascondere o mostrare questa serie.',
      timedOut: 'Esecuzioni che hanno raggiunto la scadenza. Fai clic per nascondere o mostrare questa serie.',
      inputTokens: 'Token di input inviati al modello. Fai clic per nascondere o mostrare questa serie.',
      outputTokens: 'Token di output generati dal modello. Fai clic per nascondere o mostrare questa serie.',
      cachedTokens: 'Token di input serviti dalla cache dei prompt. Fai clic per nascondere o mostrare questa serie.',
      reasoningTokens: 'Token di ragionamento, dove l\'harness li riporta. Fai clic per nascondere o mostrare questa serie.',
      totalTokens: 'Token di input più token di output per le esecuzioni di ogni intervallo.',
      costUsd: 'Costo riportato in dollari USA.',
      toolCalls: 'Chiamate a strumenti effettuate dalle esecuzioni di ogni intervallo. Fai clic per nascondere o mostrare questa serie.',
      timeToFirstTokenMsAvg: 'Tempo medio al primo token nell\'intervallo. Fai clic per nascondere o mostrare questa linea.',
      timeToFirstTokenMsP50: 'Tempo mediano al primo token: metà delle esecuzioni è stata più veloce. Fai clic per nascondere o mostrare questa linea.',
      timeToFirstTokenMsP95: '95° percentile del tempo al primo token: solo 1 esecuzione su 20 è stata più lenta. Fai clic per nascondere o mostrare questa linea.',
      streamingMsAvg: 'Tempo medio di streaming, dal primo all\'ultimo output del modello. Fai clic per nascondere o mostrare questa linea.',
      executionMsAvg: 'Tempo medio di esecuzione dell\'harness, dall\'avvio all\'uscita del processo. Fai clic per nascondere o mostrare questa linea.',
      executionMsP95: '95° percentile del tempo di esecuzione. Fai clic per nascondere o mostrare questa linea.',
      queueMsAvg: 'Tempo medio dall\'accodamento al lease.',
      outputTokensPerSecondAvg: 'Media dei token di output al secondo durante lo streaming.'
    },
    groupSeries: {
      none: '{{name}}: {{metric}}.',
      agent: 'Esecuzioni dell\'agente {{name}}: {{metric}}. Fai clic per nascondere o mostrare questa serie.',
      harness: 'Esecuzioni sull\'harness {{name}}: {{metric}}. Fai clic per nascondere o mostrare questa serie.',
      model: 'Esecuzioni servite dal modello {{name}}: {{metric}}. Fai clic per nascondere o mostrare questa serie.',
      harnessModel: 'Esecuzioni su {{name}} (harness / modello): {{metric}}. Fai clic per nascondere o mostrare questa serie.'
    },
    otherSeries: 'Tutti i gruppi esclusi i più attivi, sommati insieme. Fai clic per nasconderli o mostrarli.',
    dataTable: 'Mostra i numeri alla base di questo grafico come tabella, una riga per intervallo di tempo.',
    bucketStart: 'Inizio dell\'intervallo di tempo. Ogni riga copre un intervallo.',
    usage: 'Utilizzo nel tempo suddiviso per harness e modello, indipendentemente dal raggruppamento impostato sopra, con i totali per l\'intero periodo.',
    breakdown: 'Totali per il periodo selezionato per ogni coppia harness e modello. Usalo per vedere quale modello determina il tuo uso di token e i costi.',
    breakdownColumns: {
      harness: 'L\'harness che ha eseguito queste esecuzioni.',
      model: 'Il modello che l\'harness ha dichiarato di servire. «Modello sconosciuto» indica che l\'harness non ne ha riportato uno.',
      runs: 'Esecuzioni su questo harness e modello nel periodo.',
      inputTokens: 'Token di input inviati al modello in queste esecuzioni.',
      outputTokens: 'Token di output generati dal modello in queste esecuzioni.',
      cachedTokens: 'Token di input serviti dalla cache dei prompt in queste esecuzioni.',
      reasoningTokens: 'Token di ragionamento, per gli harness che li riportano separatamente.',
      costUsd: 'Costo totale riportato in dollari USA per queste esecuzioni.',
      timeToFirstTokenMsAvg: 'Tempo medio al primo token, ponderato per il numero di esecuzioni in ogni intervallo di tempo.'
    }
  },
  export: {
    menu: 'Scarica {{name}}: i dati come CSV o JSON, oppure il grafico come immagine PNG o SVG con titolo, legenda, filtri e intervallo di tempo.',
    csv: 'Scarica come CSV esattamente i dati alla base di questa vista: una riga per intervallo o record, timestamp UTC ISO 8601 e numeri semplici con il punto come separatore decimale.',
    png: 'Scarica il grafico come immagine PNG al doppio della risoluzione dello schermo, con titolo, legenda, filtri attivi e intervallo di tempo.',
    svg: 'Scarica il grafico come immagine SVG scalabile, con titolo, legenda, filtri attivi e intervallo di tempo.',
    json: 'Scarica i dati come JSON, con serie, intervalli, filtri e periodo in un unico documento.'
  }
};

const explainers = {
  approvals: {
    title: 'Come funzionano le approvazioni',
    p1: 'Una distribuzione con le approvazioni attive fa chiedere al suo harness il permesso a Garrison prima delle chiamate a strumenti: Claude Code tramite il suo strumento di richiesta di autorizzazione, e le esecuzioni con l\'app-server di Codex per comandi e modifiche di file.',
    p2: 'Ogni richiesta viene confrontata con le regole della distribuzione. Nega prevale su Chiedi, e Chiedi prevale su Consenti; quando nulla corrisponde, si applica il predefinito della distribuzione. Consenti e Nega rispondono subito; Chiedi mette la richiesta qui e l\'esecuzione attende.',
    p3: 'Consenti o nega una richiesta in sospeso con un motivo facoltativo. «Memorizza come regola» aggiunge una regola alla distribuzione, così la prossima chiamata simile viene decisa automaticamente. Le richieste che nessuno decide scadono con la decisione di timeout della distribuzione.'
  },
  diagram: {
    label: 'Diagramma: un chiamante invoca un agente per nome, Garrison sceglie una delle distribuzioni dell\'agente in base al peso e le associazioni di quella distribuzione decidono come viene eseguita l\'esecuzione.',
    caller: { title: 'Chiamante', body: 'REST, MCP, A2A o un altro agente', tip: 'Qualsiasi cosa invochi un agente: la REST API, un client MCP, un agente A2A o l\'esecuzione di un altro agente. I chiamanti conoscono solo il nome dell\'agente.' },
    agent: { title: 'Agente', body: 'Nome, descrizione, esposizione, delega, schema di output', tip: 'L\'identità indirizzabile. I chiamanti la invocano per nome; descrive cos\'è l\'agente e come è esposto, non come viene eseguito.' },
    deploymentA: { title: 'Distribuzione A, peso 300', body: 'Claude Code, sonnet', tip: 'Un modo di eseguire l\'agente. Con peso 300 contro 100 riceve il 75% delle invocazioni che non indicano una distribuzione.' },
    deploymentB: { title: 'Distribuzione B, peso 100', body: 'Mux, modello locale', tip: 'Un altro modo di eseguire lo stesso agente. I chiamanti possono anche indicarla esplicitamente per evitare la scelta ponderata.' },
    binds: { title: 'Ogni distribuzione associa', body: 'Profilo harness, prompt, server MCP, segreti, area di lavoro, pool di nodi, limiti', tip: 'Tutto ciò che trasforma una richiesta in un processo concreto: quale CLI, quali prompt, quali strumenti e credenziali, e dove può essere eseguita.' },
    run: { title: 'Esecuzione', body: 'Un\'esecuzione di una distribuzione', tip: 'Ogni invocazione crea un\'esecuzione, compilata dalla distribuzione scelta ed eseguita su un nodo worker.' }
  },
  agents: {
    title: 'Agenti e distribuzioni',
    p1: 'Un agente è l\'identità usata dai chiamanti. Ha un nome, una descrizione, un modo di esposizione (card A2A, strumento MCP), l\'indicazione se può chiamare altri agenti e lo schema di output a cui devono conformarsi le sue risposte. Da solo un agente non esegue nulla.',
    p2: 'Una distribuzione è il modo in cui viene eseguito l\'agente: quale profilo harness e modello, quali modelli di prompt, quali server MCP e segreti (tramite alias), quale area di lavoro, quale pool di nodi e quali limiti e parametri per esecuzione si applicano. Un agente può avere più distribuzioni, ciascuna con un peso del traffico.',
    p3: 'Quando qualcuno invoca l\'agente, Garrison sceglie a caso una delle sue distribuzioni attive in base al peso, a meno che il chiamante non abbia indicato una distribuzione specifica. Così puoi eseguire affiancate una variante Claude Code e una Mux, o spostare gradualmente il traffico su un nuovo modello.'
  },
  deployments: {
    title: 'Cos\'è una distribuzione',
    p1: 'Una distribuzione rende eseguibile un agente. Appartiene esattamente a un agente e associa un profilo harness (quale CLI avviare), un modello, modelli di prompt per ogni ruolo, server MCP e segreti con alias, un\'area di lavoro e un archivio di artefatti facoltativi, il posizionamento su pool di nodi o etichette e limiti come timeout e concorrenza.',
    p2: 'Un agente con più distribuzioni attive divide il traffico in base al peso: pesi 300 e 100 inviano alla prima tre chiamate su quattro. Le distribuzioni inattive non ricevono traffico ponderato ma possono comunque essere indicate esplicitamente, il che è utile per provare una nuova configurazione prima di assegnarle un peso.',
    p3: 'Usa l\'anteprima di compilazione su una distribuzione per vedere esattamente riga di comando, file e ambiente che riceverebbe un\'esecuzione, senza avviarne una.'
  },
  agentDetail: {
    title: 'Come viene eseguito questo agente',
    p1: 'Questo agente si raggiunge con il suo nome. Le distribuzioni qui sotto sono i modi concreti in cui può essere eseguito. Ogni distribuzione attiva riceve una quota di traffico pari al suo peso diviso per il peso totale delle distribuzioni attive; i chiamanti che indicano una distribuzione saltano la scelta ponderata.'
  },
  harnessProfiles: {
    title: 'Profili harness e distribuzioni',
    p1: 'Un profilo harness è una ricetta di avvio per un agente da riga di comando: l\'eseguibile, i modelli degli argomenti, le variabili d\'ambiente, i file da scrivere, come vengono consegnati il prompt e il prompt di sistema, quale formato di configurazione MCP legge e come il suo output viene analizzato in eventi.',
    p2: 'I profili sono componenti condivisi. Una distribuzione sceglie un profilo e poi aggiunge i dettagli specifici: modello, prompt, segreti ed eventuali sostituzioni di argomenti o ambiente che valgono solo per essa. Molte distribuzioni possono usare lo stesso profilo, quindi una correzione al profilo le raggiunge tutte.',
    p3: 'I profili predefiniti sono di sola lettura. Clonane uno per modificarlo.'
  },
  promptTemplates: {
    title: 'Modelli di prompt e come li usano le distribuzioni',
    p1: 'Ogni testo che Garrison invia a un harness è un modello di prompt: prompt di sistema, il wrapper attorno al messaggio del chiamante, istruzioni di delega, descrizioni di strumenti e file di configurazione generati. I modelli usano variabili come {{input.message}} e {{deployment.model}}, e ogni salvataggio crea una nuova versione.',
    p2: 'Le distribuzioni associano i modelli ai ruoli di prompt (System, Task, DelegatedTask e altri). Un\'associazione segue la versione più recente oppure ne fissa una, così puoi modificare un modello senza cambiare una distribuzione di produzione finché non lo decidi tu. Ogni esecuzione registra le versioni esatte che ha usato.'
  },
  mcpServers: {
    title: 'Server MCP e associazioni',
    p1: 'Un server MCP elencato qui è un fornitore di strumenti: un indirizzo (o un comando per i server stdio), gli header o l\'ambiente di cui ha bisogno e gli strumenti che devono essere presenti. Registrare un server non lo assegna ancora a nessun agente.',
    p2: 'Una distribuzione associa i server che il suo agente deve usare, ciascuno con un alias. In fase di compilazione Garrison li scrive nella configurazione MCP dell\'harness, risolvendo i riferimenti ai segreti negli header, e il worker verifica gli strumenti richiesti prima dell\'avvio. Il server MCP di Garrison viene aggiunto automaticamente quando l\'agente può delegare.'
  },
  secrets: {
    title: 'Segreti e alias',
    p1: 'Un segreto è un valore cifrato come una chiave API o un token. Il valore è di sola scrittura: dopo il salvataggio puoi sostituirlo o ruotarlo, ma nessuno può rileggerlo tramite la console o l\'API.',
    p2: 'Le distribuzioni associano i segreti con un alias. Le variabili d\'ambiente e i file del profilo harness fanno poi riferimento a {{secret.alias}}, così lo stesso profilo funziona con chiavi diverse in distribuzioni diverse. I valori vengono decifrati solo durante la compilazione di un\'esecuzione, inviati al worker tramite TLS e rimossi dai log.'
  },
  workspaces: {
    title: 'Aree di lavoro',
    p1: 'Un modello di area di lavoro descrive la directory in cui parte ogni esecuzione: vuota, un clone Git nuovo (con un segreto di credenziali facoltativo per i repository privati) o un insieme di file predefiniti. La conservazione decide se la directory viene eliminata o mantenuta dopo l\'esecuzione.',
    p2: 'Una distribuzione può associare nessuno o un modello di area di lavoro. Ogni esecuzione riceve la propria copia, quindi le esecuzioni non vedono mai i file delle altre.'
  },
  modelPrices: {"title": "Prezzi dei modelli", "p1": "Tariffe in USD configurate dall’operatore per stimare il costo quando l’harness non lo comunica. Il costo comunicato, anche zero, ha precedenza.", "p2": "I prezzi inattivi non vengono usati. Modificare o eliminare un prezzo non cambia i costi salvati delle esecuzioni."},
  usageQuotas: {"title": "Quote di utilizzo", "p1": "Limiti giornalieri UTC per esecuzioni, token, costo noto e concorrenza attuale di tenant, agente o distribuzione.", "p2": "Lascia vuoto per uso illimitato. Zero impedisce l’uso. I contatori giornalieri si azzerano a mezzanotte UTC; la concorrenza conta esecuzioni attive. Disattivato per impostazione predefinita. Attivare per rifiutare esecuzioni ai limiti configurati e ridurre i budget supportati. Altrimenti viene solo monitorato l’utilizzo."},
  artifactStores: {
    title: 'Archivi di artefatti',
    p1: 'Un archivio di artefatti è il luogo in cui vengono conservati i file prodotti dalle esecuzioni dopo che l\'area di lavoro dell\'esecuzione non esiste più. Una distribuzione può associare un archivio, e il worker vi carica i file corrispondenti al termine dell\'esecuzione.'
  },
  manifests: {
    title: 'I manifest e i record che creano',
    p1: 'Un manifest è la configurazione del tenant scritta come documenti YAML o JSON: segreti (senza valori per impostazione predefinita), modelli di prompt, profili harness, server MCP, modelli di area di lavoro, agenti e distribuzioni. I documenti si richiamano tra loro per nome, quindi un manifest funziona in qualsiasi tenant.',
    p2: 'Applicare un manifest crea o aggiorna normali record, gli stessi che vedi nelle altre schede. Applicarlo due volte non cambia nulla. Una simulazione mostra cosa cambierebbe senza scrivere, ed «Esporta» produce un manifest che ricrea questo tenant.'
  },
  nodes: {
    title: 'Nodi e pool di nodi',
    p1: 'Un nodo è un processo worker, di solito un pod, che preleva le esecuzioni dal piano di controllo, avvia gli harness e ne rimanda indietro gli eventi in streaming. I nodi si registrano da soli, riportano quali harness hanno trovato e inviano heartbeat; non li crei qui.',
    p2: 'Un nodo può appartenere a un pool di nodi e avere etichette. Le distribuzioni usano pool e selettori di etichette per decidere dove possono essere eseguite le loro esecuzioni. Isola un nodo per bloccare il nuovo lavoro, o svuotalo prima della manutenzione.'
  },
  controlNodes: {
    title: 'Nodi di controllo e nodi worker',
    p1: 'Un nodo di controllo è una replica del server Garrison. I nodi di controllo servono l\'API REST, il server MCP e il gateway A2A, autenticano i chiamanti, compilano le distribuzioni in esecuzioni e pianificano quelle esecuzioni. Qualsiasi replica può rispondere a qualsiasi richiesta, quindi un bilanciatore di carico può distribuire il traffico tra di esse.',
    p2: 'Uno dei nodi di controllo è il leader. Detiene un lease nel database e si occupa della manutenzione dell\'intero cluster: pulizia in base alla conservazione, passaggio offline delle repliche silenti e rimozione delle righe vecchie. Se il leader si ferma, un\'altra replica prende il lease in pochi secondi.',
    p3: 'I nodi worker, nella scheda Nodi worker, fanno l\'altra metà: prelevano dal piano di controllo le esecuzioni in lease ed eseguono gli harness. I nodi di controllo non eseguono mai un harness e i worker non toccano mai il database. Ogni replica si registra da sola e invia un heartbeat ogni 5 secondi, per questo questa scheda è in sola lettura.'
  },
  nodePools: {
    title: 'Pool di nodi e nodi',
    p1: 'Un pool di nodi è un gruppo con nome di nodi worker, per esempio macchine con GPU o nodi riservati a un cliente. I nodi entrano in un pool quando si registrano. Un pool può essere limitato a determinati tenant.',
    p2: 'Le distribuzioni che indicano un pool vengono eseguite solo sui suoi nodi. Le distribuzioni senza pool possono essere eseguite su qualsiasi nodo idoneo.'
  },
  tenants: {
    title: 'Tenant',
    p1: 'Un tenant è un\'organizzazione isolata su questo server. Utenti, chiavi di accesso, agenti, segreti ed esecuzioni appartengono tutti a un solo tenant, e nulla è visibile tra tenant diversi. Pool di nodi e nodi worker sono condivisi, a meno che un pool non sia riservato a tenant specifici.'
  },
  users: {
    title: 'Utenti e chiavi di accesso',
    p1: 'Un utente è una persona che accede con email e password. Una chiave di accesso è il modo in cui accede l\'automazione. Ogni chiave di accesso appartiene a un utente e non può mai fare più di quanto può fare quell\'utente.',
    p2: 'Nessuno dei due ottiene accesso solo perché esiste. L\'accesso deriva dai flag di amministratore dell\'utente e dalle assegnazioni di ruoli.'
  },
  credentials: {
    title: 'Chiavi di accesso e utenti',
    p1: 'Una chiave di accesso è una coppia formata da chiave di accesso pubblica e chiave segreta, per script, SDK e servizi. Appartiene a un utente. Le sue autorizzazioni effettive sono l\'intersezione tra ciò che concedono le sue assegnazioni di ruoli e ciò che può fare il suo proprietario.',
    p2: 'La chiave segreta viene mostrata una sola volta, quando la chiave viene creata o ruotata. Ruota le chiavi regolarmente ed elimina quelle che non vengono usate da molto tempo.'
  },
  roles: {
    title: 'Ruoli, autorizzazioni e assegnazioni',
    p1: 'Un\'autorizzazione è una singola regola: consente o nega determinate operazioni (come Read o Execute) su determinati tipi di risorsa (come Agent o Run). Un ruolo è un insieme di autorizzazioni con un nome. Il rifiuto prevale sempre sul consenso.',
    p2: 'Non cambia nulla per nessuno finché un ruolo non viene assegnato. Le assegnazioni, nella scheda successiva, collegano un ruolo a un utente o a una chiave di accesso, per l\'intero tenant o per un singolo record.'
  },
  assignments: {
    title: 'Assegnazioni',
    p1: 'Un\'assegnazione concede un ruolo a un utente o a una chiave di accesso. L\'ambito tenant applica il ruolo a ogni record dei tipi coperti; l\'ambito risorsa lo applica a un singolo record, come l\'unico agente che un job di CI può invocare.',
    p2: 'Usa «Autorizzazioni effettive» su un utente o una chiave di accesso per vedere il risultato combinato di tutte le sue assegnazioni.'
  },
  runs: {
    title: 'Esecuzioni e coda',
    p1: 'Un\'esecuzione è una singola invocazione di una distribuzione. Viene accodata, presa in lease da un nodo worker, eseguita e conclusa con un esito, una trascrizione, un risultato e dati di telemetria come tempo al primo token, token e costo.',
    p2: 'La scheda Coda mostra le stesse esecuzioni mentre attendono: quelle in coda hanno bisogno di un nodo con l\'harness e il posizionamento giusti, quelle assegnate sono state prese in carico e quelle in esecuzione sono in corso. Esecuzioni che restano a lungo in coda indicano capacità insufficiente o regole di posizionamento che nessun nodo soddisfa.'
  },
  queue: {
    title: 'La coda',
    p1: 'Questa è la vista in tempo reale delle esecuzioni non ancora terminate: in attesa di un nodo, assegnate o in esecuzione, raggruppate per agente e harness. Sono gli stessi dati della scheda Esecuzioni, riassunti per mostrare il carico di pianificazione.',
    p2: 'Un numero crescente di esecuzioni in coda per un harness di solito significa che nessun nodo pronto dichiara quell\'harness, che i nodi corrispondenti sono pieni o che la distribuzione richiede un pool o etichette che nessun nodo possiede.'
  },
  invoke: {
    title: 'Cosa succede quando invochi',
    p1: 'Chiami l\'agente per nome. A meno che tu non scelga una distribuzione, Garrison sceglie una delle distribuzioni attive dell\'agente in base al peso, convalida gli eventuali parametri per esecuzione rispetto a ciò che quella distribuzione consente e accoda un\'esecuzione. La trascrizione arriva qui in streaming mentre il worker la esegue.'
  },
  audit: {
    title: 'Audit e cronologia delle richieste',
    p1: 'I record di audit sono eventi di sicurezza e configurazione: accessi, richieste negate, modifiche a segreti e ruoli, applicazioni di manifest e cambi di stato dei nodi. Vengono conservati per il periodo indicato nelle impostazioni.',
    p2: 'La Cronologia richieste, nella scheda precedente, è il traffico HTTP grezzo. Usa l\'audit per sapere chi ha cambiato cosa e la cronologia delle richieste per capire cosa ha effettivamente inviato un client.'
  },
  requests: {
    title: 'Cronologia delle richieste',
    p1: 'Ogni richiesta API registrata da questo server, con metodo, percorso, stato, tempi, header e corpo (troncati alla dimensione configurata). Usala per il debug delle integrazioni e delle chiamate SDK. Fai clic su una barra del grafico per restringere la tabella a quel periodo.'
  },
  analytics: {
    title: 'Cosa misurano questi grafici',
    p1: 'Il tempo al primo token va dall\'avvio del processo dell\'harness al primo output del modello, quindi include l\'avvio della CLI. Il tempo di streaming va dal primo all\'ultimo output del modello, e il tempo di esecuzione dall\'avvio all\'uscita del processo. Il tempo in coda è quanto un\'esecuzione ha atteso un nodo worker. Sono misurati con gli orologi del worker e del server.',
    p2: 'Conteggi dei token e costi provengono da ciò che riporta ogni harness. I token in cache sono token di input serviti dalla cache dei prompt del provider, e i token di ragionamento compaiono solo per gli harness che li riportano separatamente. I token di output al secondo sono i token di output divisi per il tempo di streaming.',
    p3: 'Le medie ignorano le esecuzioni in cui un valore non è stato misurabile. I percentili mostrano la coda della distribuzione: p95 significa che solo un\'esecuzione su venti è stata più lenta. Raggruppa per agente o harness per confrontarli fianco a fianco.'
  },
  conversations: {
    title: 'Conversazioni e turni',
    p1: 'Una conversazione è una serie di esecuzioni con un agente. Il primo turno avvia una sessione dell\'harness; ogni turno successivo riprende quella sessione sullo stesso nodo worker, così l\'agente mantiene file, strumenti e contesto tra un messaggio e l\'altro.',
    p2: 'Viene eseguito un solo turno alla volta: un nuovo messaggio viene rifiutato finché il turno precedente non è concluso. Ogni turno resta sulla distribuzione del primo turno.',
    p3: 'Quando un turno non può riprendere (il nodo non c\'è più o resta occupato troppo a lungo, i file sono stati rimossi o l\'harness non sa riprendere), viene ricostruito in una nuova sessione che riceve la trascrizione dei turni precedenti. La colonna Ricostruzioni conta questi turni e l\'elenco dei turni ne indica il motivo.'
  }
};

export { tips, explainers };

tips.views.settings.groups.Leases = "Coordinamento facoltativo: configurare tutte le repliche allo stesso modo e riavviare. Database è il valore predefinito.";
tips.views.settings.fields.Leases = {"Provider": "Coordinamento facoltativo: configurare tutte le repliche allo stesso modo e riavviare. Database è il valore predefinito.", "ClutchEndpoint": "Fornire la chiave Clutch tramite un segreto o variabile di ambiente; evitare credenziali nell’endpoint.", "ClutchAccessKey": "Fornire la chiave Clutch tramite un segreto o variabile di ambiente; evitare credenziali nell’endpoint.", "KeyPrefix": "Coordinamento facoltativo: configurare tutte le repliche allo stesso modo e riavviare. Database è il valore predefinito.", "RequestTimeoutMs": "Coordinamento facoltativo: configurare tutte le repliche allo stesso modo e riavviare. Database è il valore predefinito.", "SweepIntervalMs": "Coordinamento facoltativo: configurare tutte le repliche allo stesso modo e riavviare. Database è il valore predefinito.", "MaxLeaseMs": "Coordinamento facoltativo: configurare tutte le repliche allo stesso modo e riavviare. Database è il valore predefinito.", "MaxHoldMs": "Coordinamento facoltativo: configurare tutte le repliche allo stesso modo e riavviare. Database è il valore predefinito."};

tips.enums.harnessType.ProviderApi = "Ciclo API facoltativo tramite PolyPrompt. Richiede endpoint e modello; i deployment CLI restano disponibili.";
tips.enums.harnessType.OpenCode = "CLI opencode, eseguita senza interfaccia con opencode run ed eventi JSON. Funziona con Anthropic, OpenAI, Google e altri fornitori di modelli.";
tips.enums.harnessType.Pi = "Agente di programmazione pi, eseguito con --mode json. Funziona con Anthropic, OpenAI, Google e altri fornitori di modelli.";

// Pipeline (P12.9).
tips.nav.hubs.approvals = 'Tutto ciò che attende una persona: chiamate a strumenti richieste dagli agenti e fasi di pipeline che richiedono una revisione, con la cronologia di ogni decisione.';
tips.nav.approvalsBadgeCombined = 'In attesa di una persona: {{approvals}} approvazioni di chiamate a strumenti e {{reviews}} revisioni di fasi di pipeline. Apri Approvazioni per deciderle.';
Object.assign(tips.nav.tabs, {
  approvals: 'Chiamate a strumenti richieste dagli agenti che attendono che una persona le consenta o le neghi, e ogni decisione passata presa da regola, predefinito, persona o timeout.',
  pipelineReviews: 'Fasi di pipeline concluse che attendono una persona: approvale, richiedi modifiche (la fase viene eseguita di nuovo con il tuo riscontro) o rifiutale.',
  pipelines: 'Catene di agenti: ogni fase esegue un agente, passa il suo output alla fase successiva tramite un modello di prompt e può attendere una revisione.',
  pipelineRuns: 'Ogni esecuzione di una pipeline con stato ed esito. Aprine una per la sequenza delle fasi, le esecuzioni delle fasi e le revisioni.'
});
tips.filters.pipelineId = 'Mostra solo i record di una pipeline. Scegli Tutte per rimuovere il filtro.';
tips.filters.pipelineRunId = 'Mostra solo le revisioni di un\'esecuzione di pipeline. Incolla un ID come plr_...; l\'elenco si aggiorna quando smetti di digitare.';
Object.assign(tips.enums, {
  pipelineRunStatus: {
    Running: 'Una fase è in esecuzione, in avvio o sta per avviarsi.',
    AwaitingReview: 'Una fase è conclusa e attende che una persona la approvi, richieda modifiche o la rifiuti.',
    Cancelling: 'È stato richiesto l\'annullamento; l\'esecuzione della fase corrente è in fase di arresto.',
    Succeeded: 'Ogni fase è conclusa e ogni punto di revisione è stato approvato.',
    Failed: 'Una fase non è riuscita dopo i suoi tentativi, non è partita o un revisore l\'ha rifiutata. Riprova riprende da quella fase.',
    Cancelled: 'Qualcuno ha annullato l\'esecuzione di pipeline. Riprova riprende dalla fase in cui si era fermata.',
    TimedOut: 'La pipeline è durata più del suo limite di tempo, compreso il tempo di attesa delle revisioni.'
  },
  pipelineRunOutcome: {
    None: 'L\'esecuzione di pipeline non è ancora conclusa.',
    Succeeded: 'Ogni fase è riuscita e ogni revisione è stata approvata.',
    StageFailed: 'Una fase non è riuscita in nessun tentativo e non è impostata per continuare in caso di errore.',
    StageStartFailed: 'Una fase non è potuta partire, per esempio perché il suo agente o la sua distribuzione non esistono più o il suo prompt non è stato compilato.',
    ReviewRejected: 'Un revisore ha rifiutato una fase, e questo termina l\'esecuzione di pipeline.',
    ReviewExpired: 'Una revisione è scaduta e la sua azione alla scadenza era Rifiuta.',
    Cancelled: 'Qualcuno ha annullato l\'esecuzione di pipeline o una delle esecuzioni delle sue fasi.',
    TimedOut: 'La pipeline ha superato il suo limite di tempo.',
    InternalError: 'Il server ha incontrato un errore imprevisto mentre faceva avanzare la pipeline. Controlla i log del server.'
  },
  pipelineStageStatus: {
    Pending: 'La fase non è ancora partita; le fasi precedenti sono ancora in corso.',
    Running: 'L\'esecuzione della fase è in coda o in corso. Un tentativo non riuscito avvia una nuova iterazione finché i tentativi non si esauriscono.',
    AwaitingReview: 'La fase è conclusa e attende che una persona ne riveda l\'output.',
    Succeeded: 'La fase è conclusa e, se richiede una revisione, è stata approvata.',
    Failed: 'La fase non è riuscita in nessun tentativo, non è potuta partire oppure è stata rifiutata.',
    Cancelled: 'La fase si è fermata perché l\'esecuzione di pipeline è stata annullata o è scaduta.'
  },
  pipelineReviewStatus: {
    Pending: 'In attesa che una persona approvi, richieda modifiche o rifiuti.',
    Approved: 'Approvata: la pipeline è passata alla fase successiva, con le eventuali note.',
    ChangesRequested: 'Modifiche richieste: la fase è stata eseguita di nuovo con il riscontro.',
    Rejected: 'Rifiutata: l\'esecuzione di pipeline è fallita in questa fase.',
    Expired: 'Nessuno ha deciso in tempo, quindi ha deciso l\'azione alla scadenza della fase.',
    Cancelled: 'L\'esecuzione di pipeline si è fermata prima che qualcuno decidesse.'
  },
  pipelineReviewDecision: {
    Approve: 'Accetta l\'output della fase e continua con la fase successiva. Le note facoltative vanno alla fase successiva.',
    RequestChanges: 'Esegui di nuovo la stessa fase con il tuo riscontro. Limitato dal numero massimo di rielaborazioni della fase.',
    Reject: 'Ferma qui l\'esecuzione di pipeline. Fallisce con l\'esito Revisione rifiutata.'
  },
  pipelineReviewSource: {
    User: 'Una persona ha deciso la revisione.',
    Timeout: 'La revisione è scaduta e l\'azione alla scadenza della fase l\'ha decisa.',
    Cancelled: 'L\'esecuzione di pipeline è stata annullata o è scaduta mentre la revisione era in sospeso.'
  }
});
Object.assign(tips.enums.auditEventType, {
  PipelineReviewDecided: 'Una persona o un timeout ha approvato, rifiutato o richiesto modifiche a una revisione di fase di pipeline.',
  PipelineRunCancelled: 'Qualcuno ha annullato un\'esecuzione di pipeline, la sua revisione in sospeso e l\'esecuzione della fase corrente.'
});
Object.assign(tips.resources.runs, {
  pipelineRunId: 'L\'esecuzione di pipeline di cui questa esecuzione è una fase, con posizione della fase e iterazione. Vuoto per le esecuzioni fuori dalle pipeline.',
  pipelineStage: 'Posizione della fase nella pipeline e quale iterazione di quella fase è questa esecuzione (nuovi tentativi e rielaborazioni aggiungono iterazioni).'
});
tips.resources.pipelines = {
  add: 'Crea una pipeline: un elenco ordinato di fasi, ognuna delle quali esegue un agente e passa il suo output alla successiva.',
  name: 'Nome univoco della pipeline in questo tenant, usato da API, strumenti MCP, SDK e manifest. Lettere minuscole, cifre e trattini.',
  stages: 'Le fasi in ordine di esecuzione. Ogni fase esegue un agente; il suo output passa alla fase successiva tramite un modello di prompt.',
  reviewGates: 'Quante fasi attendono che una persona ne riveda l\'output prima che la pipeline continui.',
  maxDurationSeconds: 'Durata massima dell\'intera esecuzione di pipeline, in secondi, comprese le attese di revisione. 0 significa nessun limite; oltre, l\'esecuzione scade.',
  version: 'Aumenta a ogni modifica salvata. Le esecuzioni di pipeline registrano la versione con cui sono partite e ne mantengono le fasi.',
  stageHeading: 'Una fase della pipeline, eseguita nell\'ordine mostrato. Usa le frecce per spostarla e il cestino per rimuoverla.',
  moveUp: 'Sposta questa fase di un posto prima. Le fasi vengono eseguite nell\'ordine mostrato.',
  moveDown: 'Sposta questa fase di un posto dopo. Le fasi vengono eseguite nell\'ordine mostrato.',
  removeStage: 'Rimuovi questa fase dalla pipeline. Una pipeline richiede almeno una fase.',
  addStage: 'Aggiungi una fase alla fine della pipeline. Riceve l\'output della fase precedente.',
  stagesItems: {
    name: 'Nome di questa fase, univoco nella pipeline. Compare nella sequenza, nelle revisioni e nei prompt di passaggio di consegne.',
    agentId: 'L\'agente eseguito da questa fase. Per avviare la pipeline serve l\'autorizzazione a eseguire ogni agente delle fasi.',
    deploymentId: 'Una distribuzione fissa dell\'agente della fase. Se vuoto, sceglie una delle distribuzioni attive dell\'agente in base al peso, come una normale invocazione.',
    handoffTemplateId: 'Modello di prompt dell\'attività che racchiude l\'attività di questa fase con gli output precedenti, le note di revisione e il riscontro delle rielaborazioni. Se vuoto, usa l\'associazione PipelineStage della distribuzione o il modello integrato.',
    handoffTemplateVersion: 'Usa questa versione del modello di passaggio di consegne anche dopo che cambia. Se vuoto, usa sempre la versione attuale.',
    outputCharLimit: 'Numero massimo di caratteri dell\'output di ogni fase precedente passati a questa fase. Gli output più lunghi vengono tagliati e segnati come troncati.',
    maxAttempts: 'Quante volte la fase viene eseguita quando la sua esecuzione fallisce o scade, prima che la fase risulti non riuscita.',
    continueOnFailure: 'Quando la fase non riesce in nessun tentativo, continua comunque con la fase successiva; quella fase vede l\'errore nel passaggio di consegne.',
    requiresReview: 'Dopo la conclusione della fase, attendi che una persona la approvi, richieda modifiche o la rifiuti in Approvazioni > Revisioni delle fasi.',
    reviewTimeoutSeconds: 'Quanto può attendere la revisione prima che decida l\'azione alla scadenza. 0 attende finché una persona non decide.',
    reviewTimeoutAction: 'Cosa succede quando la revisione scade: approvare e continuare, oppure rifiutare e far fallire l\'esecuzione di pipeline.',
    maxRevisions: 'Quante volte un revisore può richiedere modifiche a questa fase. Dopo restano solo Approva e Rifiuta.',
    description: 'Nota libera su cosa fa questa fase, per le persone. Non viene inviata all\'agente.',
    parameters: 'Sostituzioni dei parametri di esecuzione per le esecuzioni di questa fase, come modello o formato. Consentite solo con una distribuzione che permette di sostituirli.'
  },
  actions: {
    start: 'Avvia questa pipeline con un testo di input e segui le sue fasi nella pagina dell\'esecuzione di pipeline.',
    preview: 'Genera il prompt di ogni fase da un input di esempio e da output di esempio delle fasi, senza avviare alcuna esecuzione.',
    runs: 'Mostra le esecuzioni di questa pipeline nella scheda Esecuzioni di pipeline.'
  }
};
tips.resources.pipelineRuns = {
  id: 'Identificativo dell\'esecuzione di pipeline (plr_...). Usalo con API, strumenti MCP e SDK.',
  pipelineName: 'La pipeline eseguita da questa esecuzione. Le esecuzioni di pipeline mantengono le fasi della versione con cui sono partite.',
  pipelineVersion: 'La versione della pipeline con cui è partita questa esecuzione. Le modifiche successive alla pipeline non la cambiano.',
  status: 'A che punto è l\'esecuzione di pipeline: in esecuzione, in attesa di revisione, in annullamento o conclusa.',
  outcome: 'Perché l\'esecuzione di pipeline si è conclusa: riuscita, fase non riuscita o non avviata, revisione rifiutata o scaduta, annullata o scaduta.',
  progress: 'La fase a cui si trova l\'esecuzione di pipeline, sul totale delle sue fasi.',
  callerName: 'L\'utente o la chiave di accesso che ha avviato l\'esecuzione di pipeline.',
  errorMessage: 'Cosa è andato storto, quando l\'esecuzione di pipeline è fallita o scaduta.',
  priority: 'Priorità in coda assegnata a ogni esecuzione delle fasi. I numeri più alti vengono pianificati prima.',
  deadlineUtc: 'Quando scade l\'esecuzione di pipeline, in base al limite di tempo della pipeline. Vuoto quando non c\'è limite.',
  completedUtc: 'Quando si è conclusa l\'esecuzione di pipeline.',
  createdUtc: 'Quando è stata avviata l\'esecuzione di pipeline. Passa il mouse sul valore per l\'ora esatta.',
  actions: {
    cancel: 'Annulla l\'esecuzione di pipeline: l\'esecuzione della fase corrente viene annullata e una revisione in sospeso viene chiusa.',
    retry: 'Riprendi un\'esecuzione di pipeline non riuscita, scaduta o annullata dalla fase in cui si era fermata, con una nuova iterazione di quella fase.',
    stageRuns: 'Mostra nella scheda Esecuzioni le esecuzioni di ogni fase di questa esecuzione di pipeline.',
    finalRun: 'Apri l\'esecuzione dell\'ultima fase, il cui risultato è il risultato della pipeline.'
  }
};
tips.resources.pipelineReviews = {
  createdUtc: 'Quando la fase si è conclusa ed è stata richiesta la revisione. Passa il mouse sul valore per l\'ora esatta.',
  pipelineName: 'La pipeline la cui fase attende la revisione.',
  stageName: 'La fase da rivedere, con la sua posizione e l\'iterazione della fase che ha prodotto l\'output.',
  positionExecution: 'Posizione della fase nella pipeline e iterazione della fase coperta da questa revisione. Le rielaborazioni aggiungono iterazioni.',
  status: 'Le revisioni in sospeso attendono una persona; le altre mostrano come si è conclusa la revisione.',
  decision: 'Approva, Richiedi modifiche o Rifiuta, una volta decisa la revisione.',
  decisionSource: 'Chi ha deciso: una persona, il timeout di revisione della fase o l\'arresto dell\'esecuzione di pipeline.',
  comment: 'Note passate alla fase successiva (approvazione), riscontro con cui la fase è stata rieseguita (richiesta di modifiche) o motivo (rifiuto).',
  decidedBy: 'La persona che ha deciso la revisione.',
  expiresUtc: 'Quando la revisione scade e decide l\'azione alla scadenza della fase. Vuoto quando attende finché una persona non decide.',
  pipelineRunId: 'L\'esecuzione di pipeline a cui appartiene questa revisione. Fai clic su una riga per aprire la sequenza delle sue fasi.',
  runId: 'L\'esecuzione della fase il cui output è in revisione. Aprila per leggere il risultato prima di decidere.',
  decidedUtc: 'Quando è stata decisa la revisione.',
  id: 'Identificativo della revisione (prv_...). Usalo con API, strumenti MCP e SDK per decidere la revisione.',
  filters: { decisionSource: 'Mostra solo le revisioni decise in un certo modo: da una persona, dal timeout di revisione o dall\'arresto dell\'esecuzione di pipeline.' },
  actions: {
    approve: 'Approva l\'output della fase e lascia continuare la pipeline, facoltativamente con note per la fase successiva.',
    requestChanges: 'Esegui di nuovo la fase con il tuo riscontro. Ogni richiesta consuma una delle rielaborazioni della fase.',
    reject: 'Rifiuta l\'output della fase. L\'esecuzione di pipeline fallisce con l\'esito Revisione rifiutata.',
    openStageRun: 'Apri l\'esecuzione della fase in revisione per leggerne trascrizione e risultato.'
  }
};
tips.pipelineReviews = {
  revisionsLeft: 'Quante altre volte si possono richiedere modifiche per questa fase prima che restino solo Approva e Rifiuta.',
  decide: {
    decision: 'Scegli cosa succede all\'output della fase. L\'esecuzione di pipeline prosegue appena invii.',
    Approve: 'Accetta l\'output della fase; la pipeline continua con la fase successiva, o riesce dopo l\'ultima.',
    RequestChanges: 'Rimanda indietro la fase con un riscontro. Viene eseguita di nuovo e torna in revisione.',
    Reject: 'Rifiuta l\'output della fase. L\'esecuzione di pipeline si ferma e fallisce.',
    commentApprove: 'Note facoltative che la fase successiva riceve insieme all\'output di questa fase.',
    commentRequestChanges: 'Riscontro obbligatorio. La fase viene rieseguita con questo testo, quindi indica cosa cambiare.',
    commentReject: 'Motivo facoltativo, salvato con la decisione e nel log di audit.',
    submitApprove: 'Approva ora la fase. La decisione è definitiva e non può essere cambiata in seguito.',
    submitRequestChanges: 'Invia ora il riscontro. La fase viene rieseguita; il suo prossimo output torna in revisione.',
    submitReject: 'Rifiuta ora la fase. L\'esecuzione di pipeline fallisce; non si può annullare, ma si può riprovare.'
  }
};
tips.pipelineStart = {
  input: 'L\'attività per la pipeline. La prima fase ci lavora, e ogni fase successiva la vede come attività originale accanto agli output precedenti.',
  submit: 'Avvia un\'esecuzione di pipeline con questo input e apri la sequenza delle sue fasi.'
};
tips.pipelinePreview = {
  input: 'Input di esempio del chiamante usato per generare il prompt di ogni fase. Non viene eseguito nulla.',
  sampleOutput: 'Output simulato della fase {{stage}}, passato alla fase successiva nell\'anteprima.',
  render: 'Genera il prompt di ogni fase con questi esempi, come lo riceverebbero le esecuzioni delle fasi. I segreti vengono oscurati.',
  stage: 'Il prompt che questa fase riceverebbe, generato dal suo modello di passaggio di consegne con gli esempi qui sopra.',
  rendered: 'Il prompt della fase è stato generato senza errori.',
  failed: 'Il prompt della fase non è stato generato; il messaggio spiega perché, per esempio un agente o una distribuzione mancante.'
};
Object.assign(tips.views.runDetail, {
  pipelineRun: 'Questa esecuzione è una fase di un\'esecuzione di pipeline. Il testo dopo l\'ID indica posizione della fase e iterazione.',
  openPipelineRun: 'Apri l\'esecuzione di pipeline a cui appartiene questa esecuzione, con la sequenza delle fasi e le revisioni.'
});
tips.views.pipelineRunDetail = {
  viewJson: 'Mostra come JSON l\'intera esecuzione di pipeline con fasi, esecuzioni delle fasi e revisioni.',
  delete: 'Elimina questa esecuzione di pipeline conclusa e le sue revisioni. Le esecuzioni delle sue fasi restano nella pagina Esecuzioni.',
  live: 'Gli aggiornamenti arrivano tramite la connessione in tempo reale appena cambia una fase o una revisione.',
  polling: 'La connessione in tempo reale non è disponibile, quindi la pagina rilegge l\'esecuzione di pipeline ogni pochi secondi.',
  pipeline: 'La pipeline eseguita, con la versione con cui è partita. Fai clic per trovarla in Agenti > Pipeline di agenti.',
  openPipeline: 'Apri Agenti > Pipeline di agenti filtrato su questa pipeline.',
  openRun: 'Apri questa esecuzione della fase con trascrizione, risultato e telemetria.',
  finalRun: 'L\'esecuzione dell\'ultima fase. Il suo risultato è il risultato dell\'esecuzione di pipeline.',
  started: 'Quando è stata creata l\'esecuzione della prima fase.',
  input: 'L\'input con cui è stata avviata l\'esecuzione di pipeline. Ogni fase lo vede come attività originale.',
  reviewTitle: 'Una fase è conclusa e attende la tua decisione. Leggi il suo output nell\'esecuzione della fase, poi decidi.',
  stages: 'Ogni fase in ordine di esecuzione con stato, iterazioni, tentativi, rielaborazioni, esecuzioni delle fasi e revisioni.',
  current: 'La fase a cui si trova ora l\'esecuzione di pipeline.',
  reviewGate: 'Questa fase attende che una persona ne riveda l\'output prima che la pipeline continui.',
  agent: 'L\'agente eseguito da questa fase, come registrato all\'avvio dell\'esecuzione di pipeline.',
  counts: 'Le iterazioni contano ogni esecuzione della fase; i tentativi contano le esecuzioni dall\'ultima revisione; le rielaborazioni contano le modifiche richieste.',
  reviewItem: 'Una revisione di un\'iterazione di questa fase e come è stata decisa.',
  columns: {
    execution: 'Quale iterazione della fase è questa esecuzione. I nuovi tentativi dopo un errore e le rielaborazioni dopo una revisione aggiungono iterazioni.',
    run: 'L\'esecuzione della fase. Fai clic per aprire trascrizione e risultato.',
    status: 'Stato attuale dell\'esecuzione di questa fase.',
    outcome: 'Perché si è conclusa l\'esecuzione della fase.',
    error: 'Messaggio di errore dell\'esecuzione della fase, quando non è riuscita.',
    created: 'Quando è stata creata l\'esecuzione della fase.'
  }
};
tips.views.settings.fields.Runtime.PipelineSweepIntervalMs = 'Ogni quanto il leader fa avanzare le esecuzioni di pipeline che hanno perso un segnale di completamento, ritenta gli avvii di fase bloccati e applica i timeout di revisione e i limiti di tempo delle pipeline, in millisecondi.';
tips.views.settings.fields.Runtime.PipelineMaxStages = 'Numero massimo di fasi che una definizione di pipeline può avere. Il salvataggio di una pipeline con più fasi viene rifiutato.';
tips.views.settings.fields.Runs = Object.assign(tips.views.settings.fields.Runs || {}, {
  DelegationChildQueueDepth: 'Numero massimo di esecuzioni delegate in coda attese dal loro padre, in tutto il cluster. Un\'esecuzione che inizia ad attendere un\'altra esecuzione delegata oltre questo limite fallisce subito con DelegationCapacityExhausted.',
  DelegationRetryAfterSeconds: 'Secondi suggeriti in Retry-After quando una delega in attesa viene rifiutata con DelegationCapacityExhausted.'
});
Object.assign(explainers, {
  pipelines: {
    title: 'Pipeline e fasi',
    p1: 'Una pipeline concatena agenti. Ogni fase esegue un agente, facoltativamente su una distribuzione fissa, e passa il suo output (testo, output strutturato e riferimenti ad artefatti) alla fase successiva tramite un modello di prompt.',
    p2: 'Una fase può ritentare le esecuzioni non riuscite, continuare dopo un errore e attendere una revisione. Le revisioni compaiono in Approvazioni > Revisioni delle fasi; richiedere modifiche esegue di nuovo la fase con il riscontro.',
    p3: 'Modificare una pipeline crea una nuova versione. Le esecuzioni di pipeline già avviate mantengono le fasi con cui sono partite.'
  },
  pipelineRuns: {
    title: 'Esecuzioni di pipeline',
    p1: 'Un\'esecuzione di pipeline esegue in ordine le fasi di una versione della pipeline. Ogni iterazione di fase è una normale esecuzione, collegata dalla sequenza delle fasi.',
    p2: 'Annulla ferma l\'esecuzione della fase corrente e chiude una revisione in sospeso. Riprova riprende un\'esecuzione di pipeline non riuscita, scaduta o annullata dalla fase in cui si era fermata.'
  },
  pipelineReviews: {
    title: 'Revisioni delle fasi',
    p1: 'Una fase che richiede una revisione attende qui quando termina. Approva continua con la fase successiva, Richiedi modifiche esegue di nuovo la fase con il tuo riscontro e Rifiuta fa fallire l\'esecuzione di pipeline.',
    p2: 'Le revisioni senza timeout attendono finché una persona non decide. Con un timeout, decide l\'azione alla scadenza della fase quando il tempo finisce.'
  }
});
tips.views.settings.fields.Scheduling = Object.assign(tips.views.settings.fields.Scheduling || {}, {
  QueueWakeFanout: "Quante richieste di lease in attesa ogni replica risveglia per un’esecuzione appena accodata, tra quelle il cui worker potrebbe prenderla. Una richiesta che non può prenderla la passa alla successiva. 0 risveglia ogni richiesta compatibile su ogni replica, come prima. Predefinito 1.",
  RemoteWakeDelayMs: "Quanto attendono le altre repliche prima di risvegliare una propria richiesta di lease per un’esecuzione la cui replica ne ha già risvegliata una, in millisecondi. L’attesa finisce prima se l’esecuzione viene presa o se quella replica non ha più richieste in grado di prenderla. 0 risveglia subito una richiesta su ogni replica. Predefinito 250."
});
tips.views.settings.fields.Auth = Object.assign(tips.views.settings.fields.Auth || {}, {
  CacheSeconds: "Per quanto tempo ogni replica conserva le sessioni, i tenant, gli utenti e le credenziali che legge per autenticare le richieste, in secondi. Revocare un token o modificare utenti, credenziali, ruoli o tenant tramite l’API ha effetto subito su ogni replica; questo è il tempo massimo per cui una modifica fatta in altro modo può passare inosservata. 0 disattiva la cache. Predefinito 5."
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
   "triggers": "Avvia esecuzioni senza un chiamante: pianificazioni cron valutate in un fuso orario e URL di webhook che accettano richieste firmate HMAC da altri sistemi.",
   "notifications": "Avvisa altri sistemi: Garrison invia in POST una notifica JSON firmata quando un'esecuzione o una pipeline termina o un'approvazione attende una persona."
  }
 },
 "filters": {
  "type": "Mostra solo attivatori cron o solo attivatori webhook. Scegli Tutti per vederli entrambi.",
  "outcome": "Mostra solo le attivazioni che hanno avviato un'esecuzione, non sono riuscite o sono state saltate.",
  "deliveryStatus": "Mostra solo le consegne in uno stato: in attesa, in invio, consegnate o abbandonate."
 },
 "enums": {
  "triggerType": {
   "Cron": "Si attiva con una pianificazione cron a cinque campi che il leader del piano di controllo valuta nel fuso dell'attivatore.",
   "Webhook": "Si attiva quando al suo URL arriva una richiesta firmata con il segreto dell'attivatore."
  },
  "triggerTargetType": {
   "Agent": "Ogni attivazione mette in coda un'esecuzione dell'agente, su una distribuzione fissa o in base al peso del traffico.",
   "Pipeline": "Ogni attivazione avvia un'esecuzione della pipeline con tutte le fasi."
  },
  "triggerFireSource": {
   "Cron": "La pianificazione cron è scaduta e il leader ha attivato.",
   "Webhook": "È arrivata una consegna webhook firmata correttamente.",
   "Manual": "Una persona o una credenziale ha usato l'azione Attiva ora."
  },
  "triggerFireOutcome": {
   "Started": "L'attivazione ha creato un'esecuzione o un'esecuzione di pipeline; segui il collegamento per vederla.",
   "Failed": "Non è partito nulla: il modello non è riuscito, l'identità di esecuzione ha perso l'accesso o la destinazione mancava.",
   "Skipped": "L'occorrenza è stata persa più a lungo del limite di recupero cron e non è stata attivata."
  },
  "notificationEvent": {
   "RunSucceeded": "Inviato quando un'esecuzione termina con successo.",
   "RunFailed": "Inviato quando un'esecuzione non riesce o viene rifiutata.",
   "RunCancelled": "Inviato quando un'esecuzione viene annullata prima della fine.",
   "RunTimedOut": "Inviato quando un'esecuzione supera la scadenza e viene fermata.",
   "PipelineCompleted": "Inviato quando tutte le fasi di un'esecuzione di pipeline sono riuscite.",
   "PipelineFailed": "Inviato quando un'esecuzione di pipeline non riesce, scade o viene annullata.",
   "ApprovalRequested": "Inviato quando un'approvazione di strumento o una revisione di fase attende una persona.",
   "Test": "Inviato solo dall'azione Invia prova, per verificare che l'endpoint funzioni."
  },
  "notificationDeliveryStatus": {
   "Pending": "Attende il prossimo tentativo; i tentativi falliti vengono ripetuti con attese crescenti.",
   "Delivering": "Una replica del piano di controllo la sta inviando ora.",
   "Succeeded": "L'endpoint ha risposto con uno stato 2xx e la notifica è conclusa.",
   "Failed": "Garrison ha rinunciato: i tentativi sono esauriti o l'endpoint ha risposto con uno stato che non viene ritentato."
  },
  "runKind": {
   "Invoke": "Avviata da un chiamante tramite REST, MCP, A2A o la dashboard.",
   "Delegated": "Avviata da un altro agente tramite la delega di Garrison.",
   "Test": "Un'esecuzione di prova di una distribuzione dalla dashboard o dall'API.",
   "Retry": "Un nuovo tentativo di un'esecuzione precedente che qualcuno ha ripetuto.",
   "Pipeline": "Un'esecuzione di fase di un'esecuzione di pipeline.",
   "Trigger": "Avviata da una pianificazione cron, un webhook firmato o un'attivazione manuale."
  },
  "auditEventType": {
   "SigningSecretRotated": "Qualcuno ha sostituito il segreto di firma di un attivatore o di un endpoint di notifica; quello vecchio non funziona più."
  }
 },
 "resources": {
  "runs": {
   "triggerId": "L'attivatore che ha avviato questa esecuzione. Fai clic per aprire la sua cronologia attivazioni.",
   "kind": "Come è stata avviata l'esecuzione: da un chiamante, da un altro agente, come prova, nuovo tentativo, fase di pipeline o da un attivatore.",
   "openTrigger": "Apri la cronologia attivazioni dell'attivatore che ha avviato questa esecuzione."
  },
  "triggers": {
   "add": "Crea una pianificazione cron o un webhook firmato che avvia un agente o una pipeline senza che nessuno lo invochi.",
   "type": "Cron si attiva secondo una pianificazione; Webhook quando un altro sistema invia una richiesta firmata. Non modificabile in seguito.",
   "target": "Cosa avvia ogni attivazione: un'esecuzione di un agente o di una pipeline.",
   "schedule": "L'espressione cron con il suo fuso orario, oppure l'indicazione che l'attivatore attende consegne webhook.",
   "lastFire": "Quando l'attivatore si è attivato l'ultima volta e se quell'attivazione ha avviato un'esecuzione.",
   "nextFireUtc": "Quando un attivatore cron attivo si attiverà di nuovo. Gli attivatori webhook e inattivi non ne hanno.",
   "fireCount": "Quante volte si è attivato, comprese le attivazioni non riuscite e saltate.",
   "runAs": "L'utente o la credenziale per cui agiscono le esecuzioni. Ogni attivazione verifica che possa ancora eseguire la destinazione.",
   "signingSecretLast4": "Gli ultimi quattro caratteri del segreto di firma, per capire quale segreto usa un mittente.",
   "targetType": "Se ogni attivazione esegue un agente o avvia una pipeline completa.",
   "agentId": "L'agente eseguito a ogni attivazione. Serve il permesso di eseguirlo.",
   "deploymentId": "Fissa le esecuzioni su una distribuzione dell'agente, oppure lascia vuoto per scegliere in base al peso.",
   "pipelineId": "La pipeline avviata a ogni attivazione. Serve il permesso di avviarla e di eseguire i suoi agenti di fase.",
   "inputTemplateId": "Il modello di prompt che trasforma l'attivazione (ora, contenuto, ID consegna) nell'input dell'esecuzione.",
   "priority": "Priorità in coda delle esecuzioni avviate, da -100 a 100. Le più alte vengono assegnate prima.",
   "cronExpression": "Quando l'attivatore si attiva, come espressione cron a cinque campi o macro come @hourly.",
   "timeZone": "Il fuso IANA in cui viene letta l'espressione cron, ad esempio Europe/Rome.",
   "webhook": "Invia qui richieste POST firmate. Quelle con firma mancante, scaduta o errata vengono rifiutate con 401.",
   "actions": {
    "fire": "Attiva una volta ora, con un contenuto di prova facoltativo, e guarda l'esecuzione avviata.",
    "fires": "Guarda quando e perché si è attivato e quale esecuzione ha avviato ogni attivazione.",
    "runs": "Apri l'elenco delle esecuzioni filtrato su quelle avviate da questo attivatore.",
    "rotateSecret": "Crea un nuovo segreto di firma del webhook. Il precedente smette subito di funzionare."
   },
   "fires": {
    "firedUtc": "Quando è stata elaborata l'attivazione. Le attivazioni cron mostrano anche l'occorrenza a cui si riferiscono.",
    "source": "Perché si è attivato: la pianificazione, una consegna webhook o una persona.",
    "outcome": "Se l'attivazione ha avviato un'esecuzione, non è riuscita o è stata saltata.",
    "started": "L'esecuzione o l'esecuzione di pipeline creata da questa attivazione. Fai clic per aprirla.",
    "deliveryId": "L'intestazione X-Garrison-Delivery della richiesta; le ripetizioni con lo stesso valore attivano una volta.",
    "error": "Perché l'attivazione non ha avviato nulla, con un codice di errore stabile.",
    "runId": "L'esecuzione creata da questa attivazione. Fai clic per aprirla.",
    "pipelineRunId": "L'esecuzione di pipeline avviata da questa attivazione. Fai clic per aprirla."
   }
  },
  "notifications": {
   "add": "Registra un URL che riceve un POST HTTP firmato quando in questo tenant si verificano gli eventi scelti.",
   "url": "Dove Garrison invia le notifiche. Gli indirizzi privati e dei metadati sono rifiutati e i reindirizzamenti non vengono seguiti.",
   "events": "Gli eventi ricevuti da questo endpoint. Passa il mouse sul valore per vederli tutti.",
   "filters": "Filtri di agente o distribuzione che limitano quali eventi di esecuzione e approvazione vengono inviati.",
   "signingSecretLast4": "Gli ultimi quattro caratteri del segreto di firma, per far capire ai destinatari quale segreto firma.",
   "includeResultText": "Se le notifiche di esecuzione includono il testo del risultato, tagliato al limite configurato.",
   "agentId": "Invia solo gli eventi delle esecuzioni di questo agente. Gli eventi delle pipeline si fermano finché è impostato un filtro.",
   "deploymentId": "Invia solo gli eventi delle esecuzioni di questa distribuzione. Gli eventi delle pipeline si fermano finché è impostato un filtro.",
   "resultTextMaxChars": "Testo del risultato più lungo incluso in una notifica, in caratteri.",
   "actions": {
    "test": "Invia ora una notifica di prova e mostra se l'endpoint l'ha accettata.",
    "deliveries": "Guarda tutte le notifiche inviate a questo endpoint con tentativi, stato HTTP ed errori.",
    "rotateSecret": "Crea un nuovo segreto di firma. Anche i nuovi tentativi già in coda vengono firmati con esso."
   },
   "deliveries": {
    "createdUtc": "Quando l'evento è stato messo in coda per questo endpoint. Fai clic per vedere i dettagli.",
    "event": "Quale evento segnala questa notifica.",
    "status": "Se la notifica è in attesa, in invio, consegnata o abbandonata.",
    "attempts": "Tentativi fatti finora e il massimo previsto.",
    "lastStatusCode": "Stato HTTP restituito dall'endpoint all'ultimo tentativo; vuoto se non è arrivata risposta.",
    "lastError": "Cosa è andato storto all'ultimo tentativo, ad esempio un timeout o una destinazione rifiutata.",
    "lastAttemptUtc": "Quando si è tentato l'ultima volta di inviare questa notifica.",
    "nextAttemptUtc": "Quando è previsto il prossimo tentativo; vuoto quando la consegna è conclusa.",
    "deliveredUtc": "Quando l'endpoint ha accettato la notifica.",
    "payload": "Il corpo JSON esatto inviato a ogni tentativo. Non contiene mai segreti.",
    "id": "Identificatore di consegna, inviato anche come X-Garrison-Delivery per permettere ai destinatari di ignorare le ripetizioni."
   }
  }
 },
 "views": {
  "runDetail": {
   "trigger": "L'attivatore che ha avviato questa esecuzione e come è stata avviata.",
   "openTrigger": "Apri la cronologia attivazioni di questo attivatore in Agenti > Attivatori."
  },
  "pipelineRunDetail": {
   "trigger": "L'attivatore che ha avviato questa esecuzione di pipeline. Le sue esecuzioni di fase portano lo stesso attivatore."
  },
  "settings": {
   "groups": {
    "Triggers": "Limiti per i webhook degli attivatori, recupero cron dopo un fermo e conservazione della cronologia attivazioni.",
    "Notifications": "Consegna delle notifiche in uscita: protezione SSRF, nuovi tentativi e attese, timeout e conservazione del registro consegne."
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Corpo massimo di una richiesta webhook in byte. Le consegne più grandi ricevono 413 prima della verifica della firma.",
     "WebhookToleranceSeconds": "Differenza massima tra il timestamp della firma e l'orologio del server. Le consegne più vecchie sono rifiutate, così una richiesta intercettata non può essere ripetuta.",
     "CronMaxLatenessSeconds": "Le occorrenze cron perse diventano un'unica attivazione, a meno che l'ultima sia più vecchia di questi secondi; allora viene registrata come Saltata. 0 attiva sempre una volta.",
     "FireRetentionDays": "Giorni di conservazione della cronologia attivazioni."
    },
    "Notifications": {
     "AllowPrivateDestinations": "Consenti URL di notifica su reti di loopback e private. Disattivato per impostazione predefinita per prevenire la falsificazione di richieste lato server; gli indirizzi link-local e dei metadati restano bloccati.",
     "MaxAttempts": "Numero massimo di tentativi di consegna di una notifica prima di abbandonarla.",
     "InitialBackoffSeconds": "Attesa prima del secondo tentativo; ogni attesa successiva raddoppia fino all'attesa massima.",
     "MaxBackoffSeconds": "L'attesa più lunga tra due tentativi di una notifica.",
     "TimeoutSeconds": "Secondi concessi a un tentativo di consegna, connessione compresa.",
     "DispatchIntervalMs": "Ogni quanto ogni replica del piano di controllo cerca notifiche da inviare, in millisecondi.",
     "SweepOverlapSeconds": "Secondi di cronologia già esaminata che il leader rilegge a ogni passaggio per non perdere eventi tardivi.",
     "DeliveryRetentionDays": "Giorni in cui le consegne concluse restano nel registro."
    }
   }
  }
 },
 "signingSecret": {
  "done": "Chiudi questa finestra. Il segreto non può essere mostrato di nuovo, quindi copialo prima.",
  "secret": "Il segreto di firma. Mittenti e destinatari lo usano per calcolare la firma HMAC-SHA256.",
  "copy": "Copia il segreto di firma negli appunti per salvarlo nell'altro sistema.",
  "url": "L'URL a cui altri sistemi inviano in POST consegne webhook firmate.",
  "copyUrl": "Copia l'URL del webhook negli appunti."
 },
 "triggerFire": {
  "submit": "Attiva una volta ora con questo contenuto. L'esecuzione parte con l'identità di esecuzione dell'attivatore.",
  "body": "Testo facoltativo. Il modello di input lo vede come webhook.body, e come webhook.json se è JSON.",
  "contentType": "Tipo di media del contenuto, ad esempio application/json. Vuoto per testo semplice.",
  "openRun": "Apri l'esecuzione avviata da questa attivazione.",
  "openPipelineRun": "Apri l'esecuzione di pipeline avviata da questa attivazione."
 },
 "triggerFires": {
  "refresh": "Ricarica le attivazioni più recenti di questo attivatore."
 },
 "notificationDeliveries": {
  "refresh": "Ricarica le consegne più recenti di questo endpoint.",
  "open": "Mostra contenuto, tentativi e ultimo errore di questa consegna sotto l'elenco.",
  "detail": "Tutti i campi della consegna selezionata, compreso il corpo JSON inviato."
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
  "title": "Attivatori",
  "p1": "Un attivatore avvia un'esecuzione di agente o di pipeline senza che nessuno la invochi: secondo una pianificazione cron o quando un altro sistema invia un webhook firmato con il segreto dell'attivatore.",
  "p2": "L'input dell'esecuzione viene da un modello di prompt che può usare l'ora dell'attivazione e il contenuto del webhook. Le esecuzioni agiscono come l'utente o la credenziale che ha salvato l'attivatore per ultimo, e ogni attivazione verifica che possa ancora eseguire la destinazione.",
  "p3": "Se per un po' nessuna replica ha potuto attivare una pianificazione, le occorrenze perse diventano un'unica attivazione. Le consegne webhook che ripetono un valore X-Garrison-Delivery attivano una volta."
 },
 "notifications": {
  "title": "Notifiche",
  "p1": "Un endpoint di notifica riceve un POST JSON firmato quando si verifica un evento sottoscritto: un'esecuzione o una pipeline che termina, o un'approvazione che attende una persona.",
  "p2": "Le consegne vengono messe in coda in modo durevole e ritentate con attese crescenti. Ogni tentativo porta lo stesso ID consegna, così i destinatari possono ignorare le ripetizioni.",
  "p3": "Le notifiche non includono mai segreti né l'input dell'esecuzione, e l'output solo se lo consenti. Gli indirizzi di reti private sono rifiutati a meno che un operatore li consenta."
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
   "menu": "Scarica questa trascrizione come file: input, testo dell'assistente, chiamate agli strumenti, approvazioni, errori, consumo e costo, con i segreti oscurati.",
   "markdown": "Scarica una trascrizione Markdown leggibile, adatta da condividere o allegare a un ticket.",
   "json": "Scarica la trascrizione come documento JSON tipizzato (garrison.transcript/v1) per script e altri strumenti.",
   "includeThinking": "Includi anche gli eventi di ragionamento del modello. Sono esclusi per impostazione predefinita perché lunghi e interni."
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "Questo agente ha uno schema di input, quindi il suo input è un documento JSON. Compila il modulo o passa al JSON grezzo.",
    "modeForm": "Modifica l'input con un modulo generato dallo schema di input dell'agente.",
    "modeJson": "Modifica l'input come testo JSON grezzo. I valori vengono mantenuti quando torni al modulo.",
    "field": "Valore di {{name}}, come descritto dallo schema di input dell'agente.",
    "fieldWithDescription": "{{name}}: {{description}}",
    "addItem": "Aggiungi un altro elemento a questo elenco.",
    "removeItem": "Rimuovi questo elemento dall'elenco.",
    "jsonLabel": "Il documento JSON inviato come input dell'esecuzione. Deve rispettare lo schema di input dell'agente."
   }
  },
  "manifests": {
   "bundle": {
    "scopeAll": "Esporta tutte le risorse di questo tenant. Gli elementi predefiniti sono esclusi a meno che tu non li includa.",
    "scopeSelected": "Esporta solo i tipi e le risorse scelti, facoltativamente con ciò da cui dipendono.",
    "kinds": "Esporta tutte le risorse dei tipi selezionati.",
    "kind": "Esporta tutte le risorse {{kind}} di questo tenant.",
    "resources": "Risorse specifiche da esportare, scritte come Tipo/nome, ad esempio Agent/triage o Pipeline/release.",
    "followReferences": "Esporta anche ciò da cui dipende la selezione: distribuzioni, profili harness, modelli di prompt, aree di lavoro, server MCP, trigger ed endpoint di notifica. I segreti sono elencati come requisiti, mai esportati.",
    "includeBuiltIn": "Aggiungi i modelli di prompt e i profili harness predefiniti a cui il pacchetto fa riferimento. L'applicazione non li modifica; verifica solo che esistano."
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
   "Draft": "Una revisione non pubblicata. Per ogni agente è aperta una sola bozza; nessuna distribuzione la esegue finché non viene pubblicata.",
   "Published": "Una revisione congelata. La eseguono le distribuzioni che seguono l'ultima revisione o che fissano questa."
  },
  "promotionKind": {
   "Promote": "Ha fissato le distribuzioni di un ambiente su una revisione presa dall'ambiente precedente.",
   "Rollback": "Ha ristabilito le revisioni fissate che una promozione aveva sostituito, esattamente come prima."
  },
  "promotionOutcome": {
   "Applied": "Le revisioni fissate da questo record sono ancora in vigore.",
   "RolledBack": "Un ripristino successivo ha ristabilito le revisioni fissate che questa promozione aveva sostituito."
  },
  "revisionChangeType": {
   "Changed": "Il campo ha un valore diverso nella revisione più recente.",
   "Added": "Il campo o l'elemento dell'elenco esiste solo nella revisione più recente.",
   "Removed": "Il campo o l'elemento dell'elenco esiste solo nella revisione più vecchia."
  }
 },
 "filters": {
  "environment": "Mostra solo le distribuzioni di un ambiente, come dev, staging o prod. Si applica alla pagina caricata."
 },
 "resources": {
  "deployments": {
   "environment": "L'ambiente a cui appartiene questa distribuzione. Le promozioni spostano una revisione da un ambiente al successivo nell'ordine del tenant.",
   "agentRevisionId": "La revisione dell'agente eseguita da questa distribuzione. Ultima segue ogni nuova revisione pubblicata; una revisione fissata resta finché non viene cambiata o promossa.",
   "environmentBadge": "Questa distribuzione viene eseguita nell'ambiente {{environment}}.",
   "followsLatest": "Non fissata: questa distribuzione esegue l'ultima revisione pubblicata dell'agente.",
   "pinnedRevision": "Fissata: questa distribuzione esegue {{revision}} finché la revisione fissata non cambia.",
   "actions": {
    "promote": "Promuovi la revisione dell'agente da un ambiente al successivo, aggiornando la revisione fissata di ogni distribuzione lì.",
    "promotions": "Visualizza promozioni e ripristini passati e ripristina una promozione per ristabilire le revisioni fissate precedenti."
   }
  }
 },
 "views": {
  "agentDetail": {
   "reviewDraft": "Apri la scheda Revisioni per confrontare la bozza con l'ultima revisione pubblicata e pubblicarla o scartarla.",
   "tabs": {
    "revisions": "Ogni revisione salvata di questo agente: confrontane due qualsiasi, pubblica la bozza o scartala."
   },
   "columns": {
    "environment": "L'ambiente a cui appartiene la distribuzione, usato dalle promozioni.",
    "revision": "La revisione eseguita dalla distribuzione: Ultima segue ogni pubblicazione, un numero indica una revisione fissata."
   }
  }
 },
 "revisions": {
  "columns": {
   "number": "Numero di revisione. I numeri crescono a ogni revisione salvata di questo agente.",
   "state": "Le bozze possono ancora cambiare; le revisioni pubblicate sono congelate.",
   "author": "Chi ha salvato questa revisione: l'utente o la chiave di accesso che l'ha creata o sostituita per ultimo.",
   "changeNote": "Cosa è cambiato e perché, come annotato alla pubblicazione.",
   "publishedUtc": "Quando la revisione è stata pubblicata. Vuoto per la bozza.",
   "actions": "Confronta, pubblica o scarta una revisione."
  },
  "latest": "L'ultima revisione pubblicata. Le distribuzioni senza revisione fissata eseguono questa.",
  "compare": "Mostra cosa è cambiato tra questa revisione e la revisione pubblicata precedente.",
  "publish": "Pubblica questa bozza perché diventi l'ultima revisione pubblicata.",
  "discard": "Elimina questa bozza. Le revisioni pubblicate non sono interessate.",
  "discardConfirm": "Elimina definitivamente la bozza. L'operazione non si può annullare.",
  "from": "Il lato più vecchio del confronto: valori mostrati come Prima.",
  "to": "Il lato più recente del confronto: valori mostrati come Dopo.",
  "publishSubmit": "Pubblica ora la bozza. Le distribuzioni che seguono l'ultima revisione la eseguono dalla prossima esecuzione.",
  "changeNote": "Nota facoltativa salvata con la revisione pubblicata e mostrata nell'elenco delle revisioni. Fino a 2000 caratteri.",
  "diffColumns": {
   "field": "Il campo della revisione che differisce, come description o promptPins.",
   "change": "Se il campo è stato modificato, aggiunto o rimosso.",
   "before": "Il valore nella revisione più vecchia.",
   "after": "Il valore nella revisione più recente."
  }
 },
 "promote": {
  "agent": "L'agente la cui revisione viene promossa. Le sue distribuzioni nell'ambiente di destinazione vengono aggiornate.",
  "revision": "Lascia la revisione di origine per promuovere ciò che esegue l'ambiente di origine, oppure scegli una revisione pubblicata.",
  "source": "L'ambiente da cui proviene la revisione.",
  "target": "L'ambiente da aggiornare. Per impostazione predefinita, quello successivo all'origine nell'ordine del tenant.",
  "allowSkip": "Necessario quando la destinazione non è l'ambiente successivo. Gli ambienti saltati vengono registrati con la promozione.",
  "note": "Nota facoltativa salvata con il record della promozione. Fino a 2000 caratteri.",
  "submit": "Applica ora la promozione. Ogni distribuzione dell'agente nell'ambiente di destinazione riceve la nuova revisione fissata."
 },
 "promotions": {
  "agentFilter": "Mostra solo promozioni e ripristini di un agente.",
  "refresh": "Ricarica dal server la cronologia delle promozioni.",
  "columns": {
   "createdUtc": "Quando è stata applicata la promozione o il ripristino.",
   "kind": "Promozione, oppure ripristino di una promozione precedente.",
   "outcome": "Se le revisioni fissate sono ancora in vigore o sono state ripristinate in seguito.",
   "agent": "L'agente le cui distribuzioni sono state aggiornate.",
   "revision": "La revisione che è stata promossa.",
   "environments": "Ambiente di origine e di destinazione della promozione.",
   "deployments": "Ogni distribuzione aggiornata, con la revisione fissata prima e dopo.",
   "actor": "Chi ha applicato la promozione o il ripristino.",
   "note": "La nota indicata alla creazione del record.",
   "actions": "Ripristina una promozione applicata."
  },
  "skipped": "Questa promozione ha saltato almeno un ambiente, cosa che ha richiesto Consenti di saltare ambienti.",
  "rollback": "Ristabilisci le revisioni fissate che queste distribuzioni avevano prima di questa promozione.",
  "rollbackConfirm": "Applica ora il ripristino. Viene registrato nella cronologia delle promozioni.",
  "rollbackNote": "Nota facoltativa salvata con il record del ripristino. Fino a 2000 caratteri."
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
   "SystemPrompt": "Il prompt di sistema dell'agente, fornito da un modello di prompt. Non ha file caricati.",
   "Skill": "Una cartella di competenze caricata dall'harness, posizionata dove il profilo dell'harness colloca le competenze.",
   "ReferenceFile": "Un file che l'agente può leggere durante un'esecuzione, posizionato nell'area di lavoro dell'esecuzione.",
   "DocumentTemplate": "Un modello di documento, ad esempio un file .docx o .dotx, che l'agente compila durante un'esecuzione."
  },
  "runOutcome": {
   "AssetIntegrityFailed": "Un file di un asset non ha superato il controllo SHA-256 o non è stato possibile scaricarlo prima dell'avvio, quindi l'harness non è mai partito."
  }
 },
 "resources": {
  "agentAssets": {
   "add": "Crea un nuovo asset. Poi carica i suoi file come versione e fissalo su una revisione dell'agente.",
   "name": "Nome univoco dell'asset in questo tenant. Revisioni e manifest possono fare riferimento all'asset con questo nome.",
   "kind": "Prompt di sistema, competenza, file di riferimento o modello di documento. Non modificabile dopo la creazione dell'asset.",
   "currentVersion": "La versione più recente. Gli asset fissati che seguono la versione corrente la usano dalla prossima esecuzione.",
   "description": "Cosa contiene l'asset e quali agenti lo usano, in parole semplici.",
   "tags": "Etichette per trovare e raggruppare gli asset. Non hanno effetto sulle esecuzioni.",
   "artifactStoreId": "Dove sono archiviati i file dell'asset. Database di Garrison significa che sono conservati nel database del piano di controllo.",
   "promptTemplateId": "Il modello di prompt che fornisce il testo di un asset di tipo prompt di sistema. Obbligatorio solo per i prompt di sistema.",
   "databaseStore": "I file sono archiviati nel database di Garrison, non in un archivio artefatti esterno.",
   "kindFilter": "Mostra solo gli asset di un tipo: prompt di sistema, competenze, file di riferimento o modelli di documento.",
   "actions": {
    "versions": "Apri la cronologia delle versioni: sfoglia i file, visualizza l'anteprima dei file di testo, scaricali e carica una nuova versione."
   }
  }
 },
 "revisions": {
  "columns": {
   "assetPins": "Asset fissati da questa revisione, ciascuno a una versione fissa o che segue la versione corrente dell'asset."
  }
 },
 "assets": {
  "files": "Scegli uno o più file dal tuo computer. Vengono letti nel browser e caricati insieme come un'unica versione.",
  "path": "Dove va il file all'interno dell'asset, come percorso relativo con barre normali, ad esempio docs/guide.md.",
  "uploadColumns": {
   "path": "Il percorso di ciascun file all'interno dell'asset. Modificalo prima del caricamento se necessario.",
   "mediaType": "Il tipo di media indicato dal browser. Se è vuoto, il server lo deduce dall'estensione.",
   "size": "Dimensione del file letta dal tuo computer.",
   "actions": "Escludi un file da questo caricamento prima di inviarlo."
  },
  "removeFile": "Escludi questo file dal caricamento. Non viene inviato nulla finché non carichi.",
  "changeNote": "Nota facoltativa salvata con la nuova versione e mostrata nella cronologia delle versioni. Fino a 2000 caratteri.",
  "upload": "Carica i file scelti come un'unica nuova versione. Se i file sono identici, viene restituita la versione corrente.",
  "current": "Questa è la versione corrente dell'asset, usata dagli asset fissati che seguono la versione corrente.",
  "showFiles": "Mostra i file di questa versione con dimensioni, digest, anteprime e download.",
  "versionColumns": {
   "number": "Numero di versione. Ogni caricamento con file diversi aggiunge il numero successivo.",
   "author": "Chi ha caricato questa versione.",
   "changeNote": "La nota fornita al caricamento di questa versione.",
   "totalBytes": "Dimensione complessiva di tutti i file di questa versione.",
   "createdUtc": "Quando è stata caricata questa versione.",
   "actions": "Mostra i file di una versione."
  },
  "fileColumns": {
   "path": "Percorso del file all'interno dell'asset, cioè dove viene posizionato per un'esecuzione.",
   "mediaType": "Tipo di media archiviato con il file.",
   "sizeBytes": "Dimensione del file in questa versione.",
   "sha256": "Inizio del digest SHA-256 del file. I worker lo verificano prima dell'avvio di un'esecuzione.",
   "actions": "Visualizza l'anteprima dei file di testo o scarica qualsiasi file."
  },
  "sha256Full": "Digest SHA-256 completo di questo file: {{sha}}",
  "preview": "Mostra questo file di testo in sola lettura sotto l'elenco dei file. Qui non è possibile modificare nulla.",
  "download": "Scarica questo file di questa versione sul tuo computer.",
  "pinsSave": "Salva questi asset fissati nella bozza. Pubblica poi la bozza perché le distribuzioni li usino.",
  "pinAsset": "L'asset da fissare su questa revisione. Ogni asset può essere fissato una sola volta.",
  "pinVersion": "Fissa una versione specifica, oppure scegli Versione corrente per usare la versione più recente dell'asset al momento dell'esecuzione.",
  "removePin": "Rimuovi questo asset da quelli fissati nella revisione.",
  "addPin": "Aggiungi un altro asset a quelli fissati nella revisione.",
  "editPins": "Aggiungi, rimuovi o modifica gli asset fissati di questa revisione in bozza.",
  "pinsNewDraft": "Avvia una nuova bozza dall'ultima revisione pubblicata e scegli i suoi asset fissati.",
  "pinnedVersion": "Questo asset è fissato a una versione specifica, quindi le esecuzioni continuano a usarla dopo nuovi caricamenti.",
  "pinnedCurrent": "Questo asset segue la sua versione corrente, quindi le esecuzioni usano il caricamento più recente."
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
    "turns": "I turni di questa conversazione, dal più vecchio, e la casella per inviare il successivo.",
    "files": "La cartella condivisa che ogni turno e ogni agente delegato di questa conversazione legge e scrive, con cronologia delle versioni e download."
   }
  },
  "runDetail": {
   "fileSpace": "Lo spazio file condiviso che questa esecuzione copia nella sua area di lavoro all'avvio e riscrive alla fine. Lo condividono le esecuzioni di una conversazione, di un'esecuzione di pipeline o di un albero di deleghe.",
   "openFiles": "Apri la scheda File condivisi della conversazione di questa esecuzione per sfogliare, scaricare o caricare i file condivisi."
  }
 },
 "resources": {
  "deployments": {
   "fileSpaceMountPath": "Cartella nell'area di lavoro dell'esecuzione in cui viene sincronizzato lo spazio file condiviso, per esempio files. Relativa, con barre normali, al massimo 128 caratteri."
  }
 },
 "files": {
  "summary": "Quanti file correnti contiene la cartella condivisa e la loro dimensione totale. I file eliminati non sono contati.",
  "live": "L'elenco si aggiorna appena un turno, un agente delegato o una persona modifica un file.",
  "polling": "La connessione in tempo reale non è disponibile, quindi l'elenco si ricarica ogni {{seconds}} secondi finché questa scheda è aperta.",
  "includeDeleted": "Elenca anche i file eliminati. Le loro versioni restano disponibili e si possono ancora scaricare.",
  "refresh": "Ricarica subito l'elenco dei file dal server.",
  "columns": {
   "path": "Percorso del file nella cartella condivisa. Le esecuzioni lo trovano nella cartella dello spazio file del deployment.",
   "currentVersion": "La versione più recente. Ogni scrittura di un turno, di un agente o di un caricamento ne aggiunge una.",
   "sizeBytes": "Dimensione della versione corrente del file.",
   "mediaType": "Tipo di media salvato con la versione corrente.",
   "lastUpdateUtc": "Quando il file è cambiato l'ultima volta.",
   "actions": "Mostra la cronologia delle versioni, scarica la versione corrente o elimina il file."
  },
  "deleted": "Questo file è stato eliminato. I turni successivi non lo vedono più, ma le sue versioni restano disponibili.",
  "versions": "Apri la cronologia delle versioni di questo file, con download e anteprima del testo per ogni versione.",
  "download": "Scarica la versione corrente di questo file tramite un link di breve durata.",
  "delete": "Elimina questo file dalla cartella condivisa. Le sue versioni restano disponibili.",
  "confirmDelete": "Elimina subito il file. I turni successivi non lo vedranno più.",
  "versionColumns": {
   "number": "Numero di versione. Ogni scrittura aggiunge il numero successivo.",
   "sizeBytes": "Dimensione del file in questa versione.",
   "mediaType": "Tipo di media salvato con questa versione.",
   "sha256": "Inizio del digest SHA-256 di questa versione. I worker lo verificano quando sincronizzano il file.",
   "writtenBy": "L'agente la cui esecuzione ha scritto questa versione, o la persona che l'ha caricata.",
   "createdUtc": "Quando è stata scritta questa versione.",
   "actions": "Visualizza in anteprima le versioni di testo o scarica qualsiasi versione."
  },
  "current": "Questa è la versione che vedono i turni successivi.",
  "sha256Full": "Digest SHA-256 completo di questa versione: {{sha}}",
  "openRun": "Apri l'esecuzione che ha scritto questa versione.",
  "preview": "Mostra questa versione in sola lettura sotto l'elenco. Qui non si può modificare nulla.",
  "downloadVersion": "Scarica questa versione del file sul tuo computer.",
  "chooseFiles": "Scegli uno o più file dal tuo computer. Vengono letti nel browser e caricati uno alla volta.",
  "uploadColumns": {
   "path": "Dove va ogni file nella cartella condivisa. Modificalo prima del caricamento, se serve.",
   "replaces": "La versione dell'elenco che questo caricamento sostituisce, oppure Nuovo file. Un file cambiato nel frattempo viene salvato con un nome di conflitto.",
   "size": "Dimensione del file come letta dal tuo computer.",
   "actions": "Togli un file da questo caricamento prima di inviarlo."
  },
  "path": "Percorso nella cartella condivisa, relativo e con barre normali, per esempio notes/sources.md.",
  "removeFile": "Togli questo file dal caricamento. Non viene inviato nulla finché non carichi.",
  "upload": "Invia ogni file scelto alla cartella condivisa, uno alla volta, con la versione che sostituisce."
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
   "capabilities": "Il catalogo delle capacità: agenti, strumenti MCP e strumenti integrati degli harness con le loro origini, le indicazioni su costi e latenza e un comando per aggiornarlo."
  }
 },
 "filters": {
  "tag": "Mostra solo le capacità con esattamente questo tag. L'elenco si aggiorna quando smetti di digitare.",
  "origin": "Mostra solo le voci derivate, che seguono la loro origine, oppure solo quelle manuali, scritte da persone."
 },
 "enums": {
  "capabilityKind": {
   "Agent": "Un altro agente Garrison, descritto in base alla sua ultima revisione pubblicata. Un agente orchestratore può delegargli del lavoro.",
   "McpTool": "Uno strumento di un server MCP registrato in questo tenant, descritto in base all'elenco degli strumenti del server.",
   "HarnessBuiltIn": "Un programma che l'harness può eseguire sull'host del suo worker, come pandoc o LibreOffice, rilevato da una sonda di strumento su un profilo harness."
  },
  "capabilityOrigin": {
   "Derived": "Garrison mantiene questa voce allineata alla sua origine. Non si può modificare né eliminare qui; modifica invece l'origine.",
   "Manual": "Questa voce l'ha scritta una persona. Si può modificare ed eliminare qui."
  },
  "capabilityHintStatus": {
   "Unknown": "Nella finestra delle indicazioni sono terminate troppo poche esecuzioni per dire qualcosa, quindi non viene mostrato alcun valore. Gli strumenti MCP e gli strumenti integrati hanno sempre indicazioni Sconosciuto.",
   "Known": "Nella finestra delle indicazioni sono terminate abbastanza esecuzioni, quindi i valori di durata e costo si basano su esecuzioni reali."
  },
  "runBlockedReason": {
   "NoToolWorker": "Bloccata: l'agente di questa esecuzione usa uno strumento integrato dell'harness, come pandoc, e nessun worker pronto in grado di eseguirla segnala lo strumento. Resta in coda finché non si registra un worker del genere."
  }
 },
 "resources": {
  "capabilities": {
   "add": "Scrivi una voce manuale per qualcosa che Garrison non può ricavare, per esempio un servizio di conversione che gli agenti raggiungono tramite una skill.",
   "name": "Nome con cui gli agenti trovano la capacità. Gli agenti prendono il nome dell'agente, gli strumenti MCP la forma server/tool, gli strumenti integrati il nome dello strumento.",
   "kind": "Agente, strumento MCP o strumento integrato dell'harness. Le voci manuali possono usare qualsiasi tipo.",
   "origin": "Le voci derivate seguono la loro origine e non si possono modificare qui; quelle manuali sono scritte da persone.",
   "summary": "Che cosa fa la capacità e quando usarla, così come la leggono gli agenti. Fino a 4000 caratteri.",
   "source": "Da dove proviene la voce: l'agente, il server MCP e lo strumento, oppure il profilo harness e l'etichetta del nodo richiesta da un'esecuzione.",
   "hints": "Durata mediana e al 90° percentile e costo medio delle esecuzioni terminate di recente, oppure Sconosciuto quando ne sono terminate troppo poche.",
   "tags": "Etichette per filtrare il catalogo. Anche gli agenti possono filtrare per tag.",
   "lastRefreshedUtc": "Quando Garrison ha aggiornato l'ultima volta una voce derivata dalla sua origine. Vuoto per le voci manuali.",
   "sourceAgentId": "Facoltativo. L'agente Garrison che questa voce manuale rappresenta.",
   "sourceMcpServerId": "Facoltativo. Il server MCP il cui strumento è rappresentato da questa voce manuale.",
   "sourceToolName": "Il nome dello strumento sul server MCP scelto.",
   "requirements": "Etichette del nodo, come garrison.io/tool-pandoc=true, che un worker deve segnalare prima di prendere un'esecuzione che usa questa capacità.",
   "inputSchemaJson": "JSON Schema di ciò che la capacità accetta. Al salvataggio Garrison verifica che sia un JSON Schema valido.",
   "outputSchemaJson": "JSON Schema di ciò che la capacità restituisce. Al salvataggio Garrison verifica che sia un JSON Schema valido.",
   "kindFilter": "Mostra solo agenti, solo strumenti MCP o solo strumenti integrati degli harness. Scegli Tutti per vedere l'intero catalogo.",
   "originFilter": "Mostra solo le voci derivate, che seguono la loro origine, oppure solo quelle manuali, scritte da persone.",
   "tagFilter": "Mostra solo le capacità con esattamente questo tag. L'elenco si aggiorna quando smetti di digitare.",
   "refresh": "Aggiorna subito le voci derivate: agenti, strumenti integrati degli harness, strumenti dei server MCP e indicazioni degli agenti. Mostra che cosa è cambiato e quali server non hanno risposto.",
   "warnings": "Le voci la cui origine non è stata aggiornata mantengono il loro ultimo contenuto valido e mostrano il motivo nei dettagli.",
   "warningBadge": "L'ultimo aggiornamento dell'origine di questa voce non è riuscito, quindi mostra il suo ultimo contenuto valido. Motivo: {{warning}}"
  },
  "harnessProfiles": {
   "toolProbes": "Strumenti che questo harness può usare quando l'host del worker li ha, come pandoc. Ognuno diventa uno strumento integrato dell'harness nel catalogo delle capacità.",
   "toolProbesItems": {
    "name": "Nome dello strumento nel catalogo e nell'etichetta del nodo garrison.io/tool-{name}: lettere minuscole, cifre, punti e trattini.",
    "executable": "Semplice nome di file che il worker cerca nel suo PATH, per esempio soffice. Non è ammessa alcuna cartella.",
    "argument": "L'unico argomento che la sonda passa, come --version. Sono ammessi solo i flag di versione e di aiuto, oppure nessuno.",
    "description": "Che cosa fa lo strumento, mostrato nel catalogo delle capacità. Fino a 1024 caratteri."
   }
  }
 },
 "revisions": {
  "columns": {
   "capabilities": "Le capacità usate da questa revisione, per nome. Gli strumenti integrati degli harness tra queste limitano le sue esecuzioni ai worker che segnalano lo strumento."
  }
 },
 "capabilities": {
  "sourceAgent": "Apri l'agente {{name}}, che questa voce descrive in base alla sua ultima revisione pubblicata.",
  "sourceMcpServer": "Apri il server MCP {{name}} nella scheda Server MCP. Il suo elenco di strumenti è l'origine di questa voce.",
  "sourceTool": "Il nome dello strumento sul server MCP: {{tool}}.",
  "sourceProfile": "Apri il profilo harness {{name}}, la cui sonda di strumento è l'origine di questa voce.",
  "nodeLabel": "Un'esecuzione che usa questa capacità va solo a un worker che segnala l'etichetta del nodo {{label}}.",
  "noSource": "Una voce manuale che non nomina alcun agente né server MCP. La vede ogni esecuzione che può leggere il catalogo.",
  "hintsUnknown": "Nella finestra delle indicazioni sono terminate troppo poche esecuzioni per dire qualcosa, quindi non viene mostrato alcun valore. Non significa mai zero.",
  "hintsKnown_one": "Riepilogo di {{count}} esecuzione terminata negli ultimi {{days}} giorni.",
  "hintsKnown_other": "Riepilogo di {{count}} esecuzioni terminate negli ultimi {{days}} giorni.",
  "refreshWarning": "Garrison non è riuscito ad aggiornare questa voce dalla sua origine, quindi la voce mantiene il suo ultimo contenuto valido finché il prossimo aggiornamento non riesce.",
  "lockedBanner": "Perché questa voce non si può modificare né eliminare qui, e dove modificarla invece.",
  "lockedShared": "Condivisa da tutti i tenant: questa voce proviene da una sonda di strumento su un profilo harness predefinito, quindi non si può modificare né eliminare. Clona il profilo per cambiarne le sonde.",
  "locked": {
   "Agent": "Derivata dall'ultima revisione pubblicata dell'agente, quindi non si può modificare né eliminare qui. Pubblica una nuova revisione per cambiarla; disattivando l'agente la voce viene rimossa.",
   "McpTool": "Derivata dall'elenco degli strumenti del server MCP, quindi non si può modificare né eliminare qui. Modifica il server o i suoi strumenti, poi aggiorna.",
   "HarnessBuiltIn": "Derivata da una sonda di strumento su un profilo harness, quindi non si può modificare né eliminare qui. Modifica invece le sonde di strumento del profilo."
  },
  "shared": "Tutti i tenant vedono questa voce. Proviene da una sonda di strumento su un profilo harness predefinito.",
  "hintsTitle": "Durata e costo delle esecuzioni terminate di recente di questo agente. Gli strumenti MCP e gli strumenti integrati non hanno indicazioni.",
  "requirementsTitle": "Etichette del nodo che un worker deve segnalare prima di prendere un'esecuzione il cui agente usa questa capacità.",
  "fields": {
   "kind": "Agente, strumento MCP o strumento integrato dell'harness.",
   "origin": "Le voci derivate seguono la loro origine; quelle manuali sono scritte da persone.",
   "source": "L'agente, il server MCP e lo strumento, oppure il profilo harness da cui proviene questa voce.",
   "lastRefreshedUtc": "Quando Garrison ha aggiornato l'ultima volta questa voce dalla sua origine. Vuoto per le voci manuali.",
   "tags": "Etichette per filtrare il catalogo.",
   "id": "Identificativo della voce del catalogo, che inizia con cap_.",
   "summary": "Che cosa fa la capacità e quando usarla, così come la leggono gli agenti.",
   "hintStatus": "Noto quando nella finestra sono terminate abbastanza esecuzioni; altrimenti Sconosciuto, e in quel caso non viene mostrato alcun valore.",
   "sampleSize": "Quante esecuzioni terminate riassumono le indicazioni, a partire dalle più recenti.",
   "medianDurationMs": "Tempo mediano dall'avvio al completamento delle esecuzioni riepilogate.",
   "p90DurationMs": "Nove esecuzioni riepilogate su dieci sono terminate entro questo tempo.",
   "meanCostUsd": "Costo medio in dollari statunitensi delle esecuzioni riepilogate che hanno registrato un costo.",
   "windowDays": "Quanti giorni indietro considerano le indicazioni (l'impostazione Capabilities.HintWindowDays).",
   "computedUtc": "Quando le indicazioni sono state calcolate l'ultima volta dal ciclo di manutenzione o da un aggiornamento.",
   "inputSchemaJson": "JSON Schema di ciò che la capacità accetta, oppure nessuno per il testo libero.",
   "outputSchemaJson": "JSON Schema di ciò che la capacità restituisce, oppure nessuno."
  },
  "refreshServer": "Elenca gli strumenti di tutti i server MCP attivi o di un solo server. I server stdio vengono elencati tramite un worker.",
  "refreshRun": "Avvia subito l'aggiornamento. Può richiedere un po' di tempo se i server MCP rispondono lentamente.",
  "refresh": {
   "agents": "Voci di agenti create, aggiornate o rimosse da questo aggiornamento.",
   "harnessBuiltIns": "Voci di strumenti integrati degli harness create, aggiornate o rimosse, in tutti gli ambiti.",
   "hints": "Voci di agenti le cui indicazioni su costi e latenza sono state ricalcolate.",
   "servers": "Quanti server MCP questo aggiornamento ha provato a elencare.",
   "tools": "Voci di strumenti scritte dai server che hanno risposto.",
   "removed": "Voci di strumenti rimosse perché il loro server non elenca più lo strumento.",
   "failed": "Server i cui strumenti non è stato possibile elencare. Le loro voci mantengono l'ultimo contenuto valido.",
   "failedBadge": "Non è stato possibile elencare gli strumenti di questo server. Le sue voci mantengono l'ultimo contenuto valido con un avviso.",
   "listedBadge": "Il server ha risposto e le sue voci di strumenti sono aggiornate.",
   "columns": {
    "server": "Il server MCP di cui sono stati elencati gli strumenti.",
    "status": "Se è stato possibile elencare gli strumenti del server.",
    "tools": "Voci di strumenti scritte per questo server.",
    "removed": "Voci di strumenti rimosse perché il server non le elenca più.",
    "warned": "Voci che hanno mantenuto l'ultimo contenuto valido e ora hanno un avviso di aggiornamento.",
    "error": "Perché l'elenco non è riuscito, se non è riuscito."
   }
  },
  "draftSave": "Salva queste capacità nella bozza. Poi pubblica la bozza perché le distribuzioni le usino.",
  "notInCatalog": "Al momento nessuna voce del catalogo ha questo nome. L'esecuzione parte comunque, ma l'agente non può trovare questa capacità.",
  "removeName": "Rimuovi questa capacità dalla revisione.",
  "chooseName": "Scegli una capacità dal catalogo in base al nome. I nomi usati da più tipi compaiono una sola volta.",
  "addName": "Aggiungi la capacità scelta alla revisione.",
  "newDraft": "Avvia una nuova bozza dall'ultima revisione pubblicata e scegli le capacità che usa.",
  "editDraft": "Aggiungi o rimuovi le capacità usate da questa revisione in bozza.",
  "revisionName": "Questa revisione usa la capacità {{name}}. Gli agenti la trovano nel catalogo con questo nome."
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
   "Running": "Il gruppo attende i suoi membri. Termina quando la regola di riunione è soddisfatta, la scadenza passa, il budget si esaurisce o qualcuno lo annulla.",
   "Joined": "La regola di riunione è soddisfatta, oppure tutti i membri sono terminati, quindi l'esecuzione padre può usarne i risultati.",
   "TimedOut": "La scadenza è passata prima che la regola di riunione fosse soddisfatta. I membri ancora in esecuzione sono stati annullati.",
   "BudgetExceeded": "Il costo o i token dei membri hanno superato il budget del gruppo. I membri ancora in esecuzione sono stati annullati.",
   "Cancelled": "Qualcuno ha annullato il gruppo, oppure la sua esecuzione padre è terminata o è stata annullata. I membri ancora in esecuzione sono stati annullati."
  },
  "fanOutJoinPolicy": {
   "All": "Il gruppo si riunisce quando ogni membro è terminato, riuscito o no.",
   "Any": "Il gruppo si riunisce non appena un membro riesce. Gli altri vengono annullati, a meno che la chiamata non abbia chiesto di lasciarli in esecuzione.",
   "Quorum": "Il gruppo si riunisce quando riesce il numero indicato di membri, oppure non appena ne falliscono così tanti che non è più possibile."
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "Il gruppo di fan-out a cui appartiene questa esecuzione. L'esecuzione padre lo ha avviato insieme ad altri membri e ne riunisce i risultati.",
   "openFanOutGroup": "Aprire l'albero delle esecuzioni dell'esecuzione padre su questo gruppo di fan-out per vedere gli altri membri, la regola e il budget."
  }
 },
 "fanOut": {
  "group": "Esecuzioni figlie che questa esecuzione ha avviato insieme con garrison_fan_out, riunite sotto una regola, un budget e una scadenza.",
  "otherChildren": "Esecuzioni figlie a cui questa esecuzione ha delegato una alla volta, fuori da qualsiasi gruppo di fan-out.",
  "reason": "Perché il gruppo è terminato, come lo ha registrato il server.",
  "policy": "Quando il gruppo è considerato concluso: Tutti attende ogni membro, Uno qualsiasi un successo, Quorum il numero di successi indicato.",
  "progress": "Membri terminati, membri riusciti e numero di membri del gruppo.",
  "cost": "Costo registrato finora dai membri, rispetto al costo massimo del gruppo quando è impostato.",
  "costValue": "Costo totale registrato di tutti i membri. I membri il cui modello non ha un prezzo non aggiungono nulla.",
  "tokens": "Token di input e di output usati finora dai membri, rispetto al massimo del gruppo quando è impostato.",
  "tokensValue": "Token di input più token di output di tutti i membri insieme.",
  "budgetBar": "{{percent}}% del budget usato. Il gruppo termina come Budget superato quando il consumo lo oltrepassa.",
  "deadline": "Quando scade il tempo del gruppo. I membri ancora in esecuzione in quel momento vengono annullati.",
  "started": "Quando l'esecuzione padre ha avviato questo gruppo.",
  "completed": "Quando il gruppo è terminato e ha smesso di attendere i membri.",
  "pending": "Etichette dei membri non ancora terminati.",
  "failed": "Etichette dei membri terminati senza successo.",
  "live": "Gli aggiornamenti arrivano dalla connessione in tempo reale appena cambia lo stato di un membro o il consumo del gruppo.",
  "polling": "La connessione in tempo reale non è disponibile, quindi il gruppo viene ricaricato ogni {{seconds}} secondi.",
  "cancel": "Annullare subito questo gruppo. I membri ancora in esecuzione vengono annullati e l'esecuzione padre riceve i risultati raccolti finora.",
  "confirmCancel": "Annullare il gruppo e ogni membro ancora in esecuzione. Non si può annullare.",
  "openMember": "Aprire l'esecuzione del membro {{label}} per vederne trascrizione, risultato e telemetria.",
  "columns": {
   "label": "Il nome che l'esecuzione padre ha dato a questo membro all'avvio del gruppo.",
   "agent": "L'agente eseguito da questo membro, scelto dall'esecuzione padre.",
   "status": "A che punto è l'esecuzione del membro e come è terminata.",
   "costUsd": "Costo registrato dell'esecuzione di questo membro.",
   "tokens": "Token di input e di output usati dall'esecuzione di questo membro.",
   "run": "L'esecuzione del membro. Aprila per la trascrizione e il risultato."
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
   "apps": "Applicazioni agentiche: gruppi di agenti dietro un'unica interfaccia di chat per gli utenti finali, con grafo delle chiamate, delega, revisioni, promozione e link."
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "Qualsiasi utente attivo di questo tenant può accedere all'applicazione con email e password.",
   "AppUsers": "Possono accedere solo gli utenti del tenant con il ruolo predefinito AppUser su questa applicazione. Assegnalo con ambito di risorsa sull'applicazione.",
   "Anonymous": "Chiunque abbia il link può usare l'applicazione senza accedere, ma solo se è attivato anche l'uso anonimo."
  }
 },
 "form": {
  "pickColor": "Scegli {{field}} da un selettore di colore invece di digitare il valore #RRGGBB."
 },
 "resources": {
  "apps": {
   "add": "Crea un'applicazione con agenti che hai già: membri, un agente di ingresso, le chiamate tra loro e il modo in cui le persone accedono.",
   "name": "Nome dell'applicazione in questo tenant: lettere minuscole, cifre e trattini. I manifest e l'API la indicano con questo nome.",
   "slug": "Il nome nell'URL, quindi l'applicazione si trova in /apps/{slug}/. Unico in tutto il cluster. Vuoto significa il nome.",
   "description": "A cosa serve l'applicazione. Gli utenti finali la vedono nella pagina di accesso dell'applicazione.",
   "active": "Le applicazioni inattive conservano le impostazioni, ma il loro link e le loro sessioni smettono di funzionare.",
   "url": "L'indirizzo dell'applicazione per gli utenti finali. Copialo per condividerlo o aprilo per vedere ciò che vedono gli utenti finali.",
   "entryAgentId": "Il membro che parla con gli utenti finali e avvia ogni conversazione. Gli altri membri si raggiungono da esso.",
   "members": "Gli agenti dell'applicazione, ciascuno con una nota facoltativa sul ruolo. Un agente che appartiene a un'applicazione non può essere eliminato.",
   "membersItems": {
    "agentId": "Un agente di questo tenant da includere nell'applicazione. Ogni agente può essere membro una volta.",
    "role": "Una breve nota su cosa fa questo membro nell'applicazione, fino a 256 caratteri."
   },
   "edges": "Quale membro può chiamare quale. Insieme formano il grafo dell'applicazione e diventano la regola di delega di ogni membro.",
   "edgesItems": {
    "callerAgentId": "Il membro che effettua la chiamata.",
    "calleeAgentId": "Il membro chiamato. Deve essere un membro diverso dal chiamante.",
    "fanOutAllowed": "Consente al chiamante di avviare più esecuzioni di questo membro in parallelo con garrison_fan_out."
   },
   "graph": "I membri e le chiamate come immagine, in sola lettura. L'agente di ingresso è a sinistra; i membri che non può raggiungere hanno il bordo rosso.",
   "environments": "Per ogni ambiente, la distribuzione dell'agente di ingresso che l'applicazione usa lì. La promozione le mantiene allineate.",
   "environmentsItems": {
    "environment": "Un ambiente di questo tenant, come dev, staging o prod.",
    "deploymentId": "Una distribuzione dell'agente di ingresso in questo ambiente. Sono elencate solo quelle distribuzioni."
   },
   "liveEnvironment": "L'ambiente usato ora dall'interfaccia di chat dell'applicazione. Cambialo per spostare gli utenti finali su un altro ambiente.",
   "authMode": "Utenti del tenant, utenti con il ruolo AppUser su questa applicazione oppure chiunque abbia il link (con l'uso anonimo attivato).",
   "anonymousEnabled": "Attiva le sessioni anonime. L'accesso anonimo funziona solo se questa opzione è attiva e la modalità è Anonimo.",
   "showOperatorDetail": "Mostra agli utenti finali le chiamate a strumenti, il ragionamento e l'avanzamento di ogni turno, non solo la risposta.",
   "share": "Il link da dare agli utenti finali, con chi può accedere secondo l'impostazione di accesso scelta sopra.",
   "displayName": "Il nome mostrato nell'intestazione e nella pagina di accesso dell'applicazione. Vuoto significa il nome dell'applicazione.",
   "logoAssetId": "Un asset dell'agente la cui versione corrente contiene l'immagine del logo. Caricane uno in Configurazione, Asset degli agenti.",
   "primaryColor": "Colore principale dell'interfaccia dell'applicazione, come #RRGGBB. Vuoto mantiene il colore predefinito.",
   "accentColor": "Secondo colore dell'interfaccia dell'applicazione per i risalti, come #RRGGBB. Vuoto mantiene il colore predefinito.",
   "welcomeText": "Testo che gli utenti finali vedono prima del primo messaggio, fino a 4000 caratteri.",
   "id": "L'identificatore dell'applicazione. L'API e i manifest lo accettano così come il nome.",
   "lastUpdateUtc": "Quando sono cambiate l'ultima volta le impostazioni dell'applicazione.",
   "createdUtc": "Quando è stata creata l'applicazione.",
   "membersCell": "Membri dell'applicazione: {{names}}.",
   "activeBadge": "L'applicazione è attiva: il suo link funziona per le persone ammesse dalla sua impostazione di accesso.",
   "inactiveBadge": "L'applicazione è inattiva: le impostazioni sono conservate, ma il link e le sessioni non funzionano.",
   "steps": {
    "general": "Il nome dell'applicazione, lo slug URL, la descrizione e se è attiva.",
    "members": "Gli agenti dell'applicazione, l'agente di ingresso e le chiamate tra loro, con un'immagine del grafo.",
    "environments": "La distribuzione di ingresso che l'applicazione usa in ogni ambiente e l'ambiente in cui è in esecuzione ora.",
    "access": "Chi può accedere, se gli utenti finali vedono le chiamate a strumenti e il link da condividere.",
    "branding": "Nome visualizzato, logo, colori e testo di benvenuto che vedono gli utenti finali."
   },
   "actions": {
    "delegation": "Confronta la delega pubblicata di ogni membro con quella richiesta dal grafo e scrive bozze che correggono il disallineamento.",
    "revisions": "Elenca le revisioni dell'applicazione, ne crea una nuova, la pubblica e promuove l'applicazione all'ambiente successivo."
   }
  }
 },
 "apps": {
  "denied": "Per questo ti serve l'autorizzazione {{operation}} su {{resource}}. Chiedi a un amministratore un ruolo che la conceda.",
  "graph": "Immagine in sola lettura dell'applicazione: i membri, le chiamate tra loro e quali può raggiungere l'agente di ingresso.",
  "url": "L'indirizzo dell'applicazione. {{who}}",
  "open": "Apre l'applicazione in una nuova scheda del browser, come la vedono gli utenti finali. {{who}}",
  "copyUrl": "Copia l'indirizzo dell'applicazione per condividerlo. {{who}}",
  "signIn": {
   "TenantUsers": "Qualsiasi utente attivo di questo tenant può accedere.",
   "AppUsers": "Possono accedere solo gli utenti con il ruolo AppUser su questa applicazione.",
   "Anonymous": "Chiunque abbia il link può usarla senza accedere.",
   "AnonymousDisabled": "È scelto Anonimo ma non è attivato, quindi entrano solo gli utenti che hanno eseguito l'accesso e hanno i permessi."
  },
  "delegation": {
   "apply": "Scrive la delega del grafo in una revisione in bozza di ogni membro disallineato. Non viene pubblicato nulla e le bozze manuali non vengono toccate.",
   "applyNothing": "La delega pubblicata di ogni membro corrisponde già al grafo, quindi non c'è nulla da scrivere.",
   "openAgent": "Apri l'agente {{name}} per controllare e pubblicare la sua revisione in bozza.",
   "drift": "La delega pubblicata del membro è diversa da quella richiesta dal grafo. Scrivi le bozze per correggerla, poi pubblicale.",
   "inSync": "La delega pubblicata del membro corrisponde al grafo.",
   "draftConflict": "La bozza aperta del membro cambia già la delega in un altro modo, quindi non è stata toccata. Pubblica o scarta prima quella bozza.",
   "skipped": "Questo membro è stato saltato: {{reason}}.",
   "draft": "La delega del grafo si trova nella revisione in bozza {{number}} di questo membro. Pubblicala per renderla effettiva.",
   "columns": {
    "member": "L'agente membro. Aprilo per controllare le sue revisioni.",
    "desiredMode": "La modalità di delega richiesta dal grafo: Elenco consentiti quando il membro chiama altri, Nessuna delega quando non chiama nessuno.",
    "desiredAllowList": "I membri che questo membro chiama nel grafo.",
    "desiredMaxDepth": "La catena di chiamate più lunga sotto questo membro nel grafo.",
    "publishedMode": "La modalità di delega nell'ultima revisione pubblicata del membro.",
    "publishedAllowList": "L'elenco consentiti nell'ultima revisione pubblicata del membro.",
    "publishedMaxDepth": "La profondità massima nell'ultima revisione pubblicata del membro.",
    "status": "Se il membro è disallineato dal grafo, e la bozza scritta o il motivo per cui è stato saltato."
   }
  },
  "revisions": {
   "promote": "Promuovi una revisione pubblicata dell'applicazione: tutti i membri passano insieme all'ambiente successivo, oppure non si sposta nulla.",
   "promoteNothing": "Pubblica prima una revisione dell'applicazione. Si possono promuovere solo le revisioni pubblicate.",
   "changeNote": "Una nota su cosa è cambiato, salvata con la revisione. Fino a 2000 caratteri.",
   "take": "Crea una revisione in bozza dell'applicazione che fissa l'ultima revisione pubblicata di ogni membro e copia le chiamate.",
   "latest": "L'ultima revisione pubblicata dell'applicazione, usata dalle promozioni a meno che tu non ne scelga un'altra.",
   "pin": "Questa revisione fissa la revisione {{number}} di {{name}}.",
   "publishedBy": "Pubblicata da {{name}} il {{when}}.",
   "publish": "Pubblica questa revisione in bozza dell'applicazione. Dopo non può più cambiare e può essere promossa.",
   "publishConfirm": "Pubblica la revisione ora. Dopo non si può più modificare.",
   "columns": {
    "number": "Il numero di revisione, che parte da 1 per questa applicazione.",
    "state": "Bozza finché non viene pubblicata. Si possono promuovere solo le revisioni pubblicate.",
    "members": "Le revisioni dei membri fissate da questa revisione dell'applicazione.",
    "edges": "Quante chiamate tra membri ha copiato la revisione.",
    "author": "Chi ha creato la revisione.",
    "changeNote": "La nota scritta quando è stata creata la revisione.",
    "publishedUtc": "Quando è stata pubblicata la revisione e da chi.",
    "actions": "Pubblica una revisione in bozza."
   }
  },
  "promote": {
   "submit": "Promuovi ora. Le distribuzioni di ogni membro nell'ambiente di destinazione ricevono le revisioni fissate, oppure non cambia nulla.",
   "revision": "La revisione pubblicata dell'applicazione da promuovere. Si usa l'ultima a meno che tu non ne scelga un'altra.",
   "source": "L'ambiente da cui promuovere, di solito quello in cui l'applicazione è in esecuzione ora.",
   "target": "L'ambiente verso cui promuovere. Per impostazione predefinita, quello successivo all'origine."
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
   "studio": "Lo studio degli agenti: bozze di agenti e app che progetti con l'architetto di agenti, provi nell'area di prova e fai applicare da una persona."
  }
 },
 "enums": {
  "approvalKind": {
   "DraftApply": "Una richiesta di applicare una bozza dello studio alla configurazione attiva. Consentirla applica ogni documento della bozza in un'unica applicazione di manifest."
  },
  "studioDraftStatus": {
   "Open": "Tu e l'architetto di agenti potete modificare la bozza, convalidarla, provarla nell'area di prova e inviarla per l'approvazione.",
   "PendingApproval": "La bozza attende una decisione sulla sua approvazione di applicazione ed è bloccata fino ad allora. Un rifiuto la riapre.",
   "Applied": "La bozza è stata applicata alla configurazione attiva in un'unica applicazione di manifest. Non può più cambiare.",
   "Discarded": "La bozza è stata scartata. Non può più cambiare e un'approvazione di applicazione in sospeso è stata annullata."
  },
  "studioDraftOperation": {
   "Upsert": "L'applicazione della bozza crea la risorsa, o la aggiorna se esiste già.",
   "Delete": "L'applicazione della bozza elimina la risorsa. Solo agenti, distribuzioni, pipeline e app possono essere eliminati così."
  },
  "studioDiffChange": {
   "Create": "La risorsa non esiste ancora, quindi l'applicazione della bozza la crea.",
   "Update": "La risorsa esiste ed è diversa, quindi l'applicazione della bozza aggiorna i campi elencati.",
   "Delete": "La bozza elimina questa risorsa quando viene applicata.",
   "Unchanged": "Il documento corrisponde alla configurazione attiva, quindi applicarlo non cambia nulla.",
   "Failed": "Il documento non supera la convalida. I dettagli spiegano perché; correggilo prima di richiedere l'applicazione."
  }
 },
 "views": {
  "studio": {
   "newDraft": "Inizia una bozza, vuota o da un'app esistente, e apri la sua area di lavoro.",
   "refresh": "Rileggi l'elenco delle bozze dal server.",
   "search": "Trova le bozze il cui titolo contiene questo testo. La ricerca la fa il server.",
   "scope": "Mostra solo le tue bozze, o tutte le bozze del tenant che puoi leggere.",
   "scopes": {
    "mine": "Mostra solo le bozze che hai iniziato tu o che un architetto ha iniziato per te.",
    "all": "Mostra tutte le bozze del tenant che puoi leggere, chiunque le abbia iniziate."
   },
   "statusChip": "Mostra le bozze con stato {{status}}. Se non scegli uno stato, compaiono tutti.",
   "columns": {
    "title": "Il titolo della bozza. Aprila per vedere la sua area di lavoro con architetto, elementi, grafo e applicazione.",
    "status": "Le bozze aperte possono cambiare; quelle in attesa aspettano una decisione; quelle applicate e scartate sono definitive.",
    "owner": "La persona che ha iniziato la bozza. Un architetto lavora solo sulle bozze della persona che parla con lui.",
    "targetApp": "L'app che la bozza progetta. Le operazioni sul grafo e l'area di prova la usano per impostazione predefinita.",
    "items": "Quanti documenti manifest contiene la bozza, uno per risorsa.",
    "version": "Aumenta di uno a ogni modifica della bozza. Ogni modifica indica la versione che ha letto.",
    "updated": "Quando la bozza è cambiata l'ultima volta."
   },
   "openDraft": "Apri l'area di lavoro della bozza: chat con l'architetto, elementi, grafo, confronto e applicazione, area di prova e anteprima.",
   "discard": "Scarta la bozza dopo una conferma. Non potrà più cambiare né essere applicata.",
   "discardPending": "Scarta la bozza dopo una conferma. La sua approvazione di applicazione in sospeso viene annullata."
  },
  "studioDraft": {
   "version": "Ogni modifica aumenta la versione. Le modifiche inviano la versione letta, così nessuno sovrascrive il lavoro di un altro.",
   "live": "Connesso al canale in diretta della bozza, quindi le modifiche degli altri e dell'architetto compaiono subito.",
   "polling": "Il canale in diretta non è disponibile, quindi la pagina rilegge la bozza ogni pochi secondi.",
   "back": "Torna all'elenco delle bozze dello studio.",
   "viewJson": "Mostra la bozza come l'ha restituita il server, con ogni elemento e il layout della tela.",
   "architect": "La distribuzione di architetto con cui parla questa area di lavoro. Sceglila nella scheda Architetto.",
   "dismissNotice": "Nascondi questo avviso sull'ultima modifica della bozza.",
   "tabs": {
    "architect": "Parla con l'architetto di agenti, che modifica questa bozza per te.",
    "items": "I documenti manifest della bozza, con un editor per ciascuno.",
    "graph": "Un'immagine in sola lettura delle app, chiamate, profondità di delega e capacità della bozza.",
    "apply": "Confronta la bozza con la configurazione attiva, convalidala e chiedi che venga applicata.",
    "playground": "Esegui gli agenti della bozza per più turni prima di pubblicare qualsiasi cosa.",
    "preview": "Compila una distribuzione per vederne la riga di comando, gli asset collocati e il montaggio dello spazio file.",
    "prompts": "Scegli e modifica il prompt con cui lavora l'architetto di agenti."
   }
  }
 },
 "studio": {
  "notOpen": "Questa bozza è {{status}}, e solo una bozza aperta può cambiare.",
  "newDraft": {
   "titleField": "Un nome breve per la bozza, mostrato nell'elenco e all'architetto. Se vuoto, si usa un titolo predefinito.",
   "fromApp": "Parti da un'app esistente con tutto ciò a cui fa riferimento, o inizia con una bozza vuota.",
   "create": "Crea la bozza e apri la sua area di lavoro. La configurazione attiva non cambia."
  },
  "architect": {
   "name": "Nome della nuova distribuzione di architetto in questo tenant, per esempio architect.",
   "harnessProfileId": "L'harness su cui gira l'architetto, per esempio Claude Code. Serve un worker in grado di eseguirlo.",
   "model": "Il modello che l'harness usa per l'architetto. Se vuoto, si usa il predefinito del profilo harness.",
   "promptId": "Il prompt System con cui lavora l'architetto. Prima i prompt integrati, poi i loro cloni.",
   "preview": "Il prompt scelto renderizzato con valori di esempio, come lo riceverebbe l'architetto.",
   "cloneLink": "Apri questo prompt nella schermata Modelli di prompt, dove puoi clonarlo e modificare il clone.",
   "create": "Crea la distribuzione di agent-architect con accesso alle bozze e il prompt scelto.",
   "noAgent": "Non è possibile creare un architetto perché questo tenant non ha l'agente agent-architect."
  },
  "chat": {
   "title": "Una conversazione con l'architetto di agenti su questa bozza. Lui modifica la bozza; tu ne approvi l'applicazione.",
   "architect": "La distribuzione di architetto con cui parlare. Sceglierne un'altra avvia una nuova conversazione.",
   "newArchitect": "Crea una distribuzione di architetto: profilo harness, modello e prompt dell'architetto.",
   "openConversation": "Apri questa conversazione in una pagina dedicata, con ogni turno come esecuzione.",
   "newConversation": "Dimentica questa conversazione in questo browser e iniziane una nuova con il prossimo messaggio.",
   "you": "Ciò che hai inviato all'architetto in questo turno.",
   "architectSays": "La risposta dell'architetto in questo turno. Le modifiche apportate alla bozza compaiono nelle altre schede.",
   "openRun": "Apri l'esecuzione di questo turno, con la trascrizione e gli strumenti chiamati.",
   "message": "Cosa vuoi che l'architetto progetti o cambi. L'ID della bozza viene inviato con il primo messaggio.",
   "send": "Invia il messaggio all'architetto. La risposta compare qui alla fine del turno.",
   "sendBusy": "L'architetto sta ancora lavorando all'ultimo messaggio. Attendi che finisca.",
   "sendNoArchitect": "Scegli o crea una distribuzione di architetto prima di inviare un messaggio."
  },
  "items": {
   "title": "I documenti manifest della bozza, uno per risorsa, identificati da tipo e nome.",
   "add": "Aggiungi un nuovo documento alla bozza. Viene salvato quando lo salvi nell'editor.",
   "addConfirm": "Apri l'editor con un documento iniziale di questo tipo e nome.",
   "kind": "Il tipo di manifest del documento, per esempio Agent o Deployment.",
   "name": "Il nome della risorsa, che deve corrispondere al nome nel documento.",
   "operation": "Crea o aggiorna la risorsa all'applicazione, oppure eliminala.",
   "stale": "Indica se la configurazione attiva è cambiata dopo che la bozza è partita da questo documento.",
   "updated": "Quando questo elemento è cambiato l'ultima volta nella bozza.",
   "staleBadge": "La configurazione attiva è cambiata dopo che la bozza è partita da questo documento. Aggiornalo prima di applicare.",
   "editItem": "Apri questo documento nell'editor per modificarlo e salvarlo.",
   "viewItem": "Apri questo documento nell'editor per leggerlo. La bozza non può cambiare in questo momento.",
   "remove": "Rimuovi questo documento dalla bozza dopo una conferma. La configurazione attiva non cambia.",
   "editor": "Il documento come YAML di manifest. Il salvataggio invia la versione che hai letto.",
   "document": "YAML di manifest semplice. Tipo e nome devono corrispondere a quelli dell'elemento.",
   "save": "Salva il documento nella bozza alla versione che hai letto.",
   "closeEditor": "Chiudi l'editor. Il testo non salvato va perso.",
   "dismissConflict": "Nascondi questo avviso sulla modifica che ha rifiutato il tuo salvataggio."
  },
  "graph": {
   "title": "Immagine in sola lettura delle app della bozza: membri, chiamate, profondità di delega e capacità.",
   "app": "Un'app che la bozza contiene o a cui fa riferimento, disegnata a partire dal suo agente di ingresso.",
   "deletedApp": "L'applicazione della bozza elimina questa app.",
   "draftedApp": "La bozza contiene il documento di questa app, quindi il suo grafo mostra la versione della bozza.",
   "deletedAgent": "L'applicazione della bozza elimina questo agente.",
   "loose": "Agenti della bozza che non appartengono a nessuna delle sue app.",
   "legend": "Come leggere il grafo: etichette, stili di linea e le capacità sotto ogni agente."
  },
  "diff": {
   "title": "Ogni documento confrontato con la configurazione attiva, la convalida e la richiesta di applicare la bozza.",
   "refresh": "Confronta di nuovo ogni documento con la configurazione attiva.",
   "validate": "Esegui una simulazione di manifest della bozza. Non cambia nulla; i risultati compaiono per elemento.",
   "requestApply": "Convalida la bozza e crea un'approvazione per applicarla. La bozza resta bloccata finché non si decide.",
   "columns": {
    "item": "Il tipo e il nome del documento.",
    "change": "Cosa farebbe a questa risorsa l'applicazione della bozza.",
    "details": "I campi che cambiano, o il motivo per cui il documento non supera la convalida."
   },
   "approval": "L'approvazione che decide se questa bozza viene applicata.",
   "openApproval": "Apri l'approvazione con il riepilogo completo e il confronto.",
   "reason": "Perché consenti o rifiuti la bozza. Viene registrato con la decisione.",
   "allow": "Consenti l'approvazione: la bozza viene convalidata di nuovo e applicata in un'unica applicazione di manifest.",
   "deny": "Rifiuta l'approvazione: non viene applicato nulla e la bozza è di nuovo aperta."
  },
  "playground": {
   "title": "Prova gli agenti della bozza per più turni prima di pubblicare qualsiasi cosa.",
   "agent": "L'agente da eseguire. Il predefinito è l'agente di ingresso dell'app di destinazione della bozza.",
   "input": "Cosa deve fare l'agente in questo turno.",
   "send": "Salva il documento dell'agente come sua revisione bozza ed eseguilo nell'area di prova.",
   "sendBusy": "L'ultimo turno è ancora in esecuzione. Attendi che finisca.",
   "openRun": "Apri l'esecuzione, con il suo albero di esecuzione, i gruppi di fan-out e i file della conversazione.",
   "conversation": "Apri la conversazione dell'area di prova, con ogni turno come esecuzione.",
   "export": "Scarica i turni dell'area di prova come file Markdown.",
   "reset": "Inizia una nuova conversazione nell'area di prova con il prossimo turno."
  },
  "preview": {
   "title": "Compila una distribuzione con un input di esempio prima di distribuire. I valori segreti vengono oscurati.",
   "deploymentId": "La distribuzione da compilare per l'anteprima.",
   "agentRevisionId": "Una revisione dell'agente da compilare al posto di quella della distribuzione, per esempio una revisione bozza.",
   "environment": "Compila la distribuzione dell'agente in questo ambiente invece di quello scelto.",
   "input": "L'input di esempio con cui viene renderizzato il prompt compilato.",
   "compile": "Compila la distribuzione e mostra riga di comando, asset e spazio file.",
   "compileNoDeployment": "Scegli prima una distribuzione da compilare.",
   "commandLine": "Il comando che il worker avvierebbe, con le virgolette della shell per la visualizzazione.",
   "assets": "Dove verrebbero scritti gli asset della revisione prima dell'avvio dell'harness.",
   "columns": {
    "path": "Dove viene collocato il file, rispetto alle directory dell'esecuzione.",
    "asset": "L'asset dell'agente da cui proviene il file.",
    "kind": "A cosa serve l'asset, per esempio una skill o un file di riferimento.",
    "version": "La versione dell'asset fissata dalla revisione.",
    "size": "La dimensione del file collocato."
   },
   "fileSpace": "Lo spazio file condiviso della conversazione e dove l'esecuzione lo vedrebbe."
  },
  "prompts": {
   "title": "I prompt con cui l'architetto di agenti può lavorare, e quale usa ciascun architetto.",
   "templatesLink": "Apri la schermata Modelli di prompt filtrata sui prompt di architetto.",
   "columns": {
    "name": "Il nome del modello di prompt. Quelli integrati iniziano con builtin/.",
    "description": "Una breve nota su cosa il prompt fa fare in modo diverso all'architetto.",
    "version": "La versione attuale del prompt. Ogni salvataggio aggiunge uno.",
    "usedBy": "Quante distribuzioni di architetto usano questo prompt. Passa il mouse per vederne i nomi."
   },
   "defaultBadge": "Le nuove distribuzioni di architetto usano questo prompt, a meno che non se ne scelga un altro.",
   "selectedBadge": "Il prompt che {{architect}} usa ora.",
   "select": "Rendi questo il prompt dell'architetto corrente. Ha effetto dal prossimo turno dell'architetto.",
   "alreadySelected": "L'architetto corrente usa già questo prompt.",
   "selectNoArchitect": "Scegli prima un architetto nella scheda Architetto; la selezione si applica a quella distribuzione.",
   "clone": "Copia questo prompt in un nuovo modello che puoi modificare.",
   "edit": "Modifica nome, descrizione e corpo. Ogni salvataggio è una nuova versione.",
   "delete": "Elimina questo prompt dopo una conferma. Un prompt usato da una distribuzione non può essere eliminato.",
   "builtInLocked": "I prompt integrati non possono essere modificati né eliminati. Clona questo prompt e modifica il clone.",
   "editor": "Modifica il prompt e guardane l'anteprima. Gli architetti che ne seguono la versione attuale usano un salvataggio dal loro prossimo turno.",
   "closeEditor": "Chiudi l'editor. Il testo non salvato va perso.",
   "name": "Il nome del modello in questo tenant. Deve restare univoco.",
   "description": "Una breve nota su cosa questo prompt fa fare all'architetto.",
   "body": "Il testo del prompt, con variabili di modello e inclusioni di frammenti come builtin/agent-architect-design.",
   "preview": "Il corpo renderizzato con valori di esempio, come lo riceverebbe l'architetto.",
   "save": "Salva la modifica come nuova versione del prompt."
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
    "graph": "Modifica l'app della bozza in un'area di disegno: agenti, chiamate, agente di ingresso, proprietà ed esecuzione per ambiente."
   }
  }
 },
 "studio": {
  "graph": {
   "title": "L'app della bozza come area di disegno modificabile, con i suoi agenti, le chiamate e la profondità di delega."
  },
  "canvas": {
   "title": "L'app della bozza come grafo modificabile. Ogni modifica viene salvata subito nella bozza; nulla diventa attivo finché la bozza non viene applicata.",
   "appPicker": "L'app mostrata nell'area di disegno, quando la bozza ne contiene più di una.",
   "node": "Un agente dell'app. Trascinalo per spostarlo, trascina dal suo bordo destro per collegarlo, oppure dagli il focus e usa le scorciatoie da tastiera.",
   "nodeReadOnly": "Un agente dell'app. La bozza non può cambiare in questo momento, quindi l'area di disegno è di sola lettura.",
   "addAgent": "Digita il nome di un agente o scegline uno tra gli agenti del tenant e quelli della bozza, poi premi Invio.",
   "role": "Una nota facoltativa su cosa fa questo agente nell'app, conservata con la sua appartenenza.",
   "add": "Rendi l'agente membro di {{app}}. Il primo membro diventa l'agente di ingresso.",
   "connect": "Avvia una chiamata da {{name}}, poi scegli l'agente che chiama.",
   "needAgent": "Seleziona prima un agente nell'area di disegno.",
   "needCall": "Seleziona prima una chiamata: fai clic su di essa nell'area di disegno o sceglila nell'elenco delle chiamate.",
   "alreadyEntry": "{{name}} è già l'agente di ingresso.",
   "setEntry": "Rendi l'agente selezionato quello che parla con le persone che usano l'app.",
   "remove": "Togli dall'app l'agente selezionato con le sue chiamate, dopo una conferma.",
   "disconnect": "Elimina la chiamata selezionata. I due agenti restano nell'app.",
   "fit": "Zoom e spostamento della vista in modo che ogni agente dell'app sia visibile.",
   "connectTo": "L'agente che il chiamante può chiamare.",
   "fanOut": "Attivo: il chiamante può avviare più chiamate a questo agente contemporaneamente (fan-out). Disattivo: una chiamata alla volta.",
   "connectConfirm": "Consenti a {{from}} di chiamare {{to}} e salva la chiamata nella bozza.",
   "connectNoTarget": "Nell'app non c'è ancora un altro agente da chiamare.",
   "connectCancel": "Interrompi il collegamento senza aggiungere una chiamata.",
   "keys": "Mostra i tasti che funzionano nell'area di disegno.",
   "calls": "Ogni chiamata dell'app descritta a parole. Questi pulsanti servono a selezionare e modificare le chiamate da tastiera.",
   "call": "Seleziona questa chiamata. Canc la scollega, F attiva o disattiva le chiamate in parallelo.",
   "callReadOnly": "Seleziona questa chiamata per vederne le proprietà. La bozza non può cambiare in questo momento.",
   "addLoose": "Rendi {{name}} membro di {{app}}, così che possa essere collegato.",
   "retry": "Invia di nuovo la modifica rifiutata, sulla versione della bozza appena letta.",
   "dismissError": "Nascondi questo messaggio sulla modifica rifiutata.",
   "panel": {
    "properties": "Il documento dell'agente: descrizione, schemi, asset e capacità.",
    "runtime": "Le distribuzioni dell'agente in ogni ambiente: modello, limiti, prompt e approvazioni.",
    "save": "Scrivi questi campi nell'elemento della bozza alla versione che hai letto. Nulla diventa attivo.",
    "reset": "Torna ai valori che la bozza contiene ora.",
    "nothingToSave": "Non è ancora cambiato nulla, quindi non c'è niente da salvare.",
    "nothingToReset": "Non è ancora cambiato nulla, quindi non c'è niente da annullare."
   },
   "agent": {
    "title": "Campi del documento dell'agente in questa bozza. Il salvataggio riscrive il suo elemento Agent.",
    "bring": "Copia il documento attivo dell'agente (o uno nuovo) nella bozza per poterlo modificare.",
    "description": "Cosa fa l'agente, mostrato alle persone e agli agenti che lo chiamano.",
    "inputSchema": "Un JSON Schema a cui l'input dell'agente deve corrispondere. Vuoto significa input in testo semplice.",
    "outputSchema": "Un JSON Schema che l'output strutturato dell'agente segue. Vuoto significa nessun output strutturato.",
    "assets": "Asset dell'agente (skill, riferimenti, modelli) che la prossima revisione fissa, per nome e versione facoltativa.",
    "assetName": "Il nome dell'asset dell'agente in questo tenant.",
    "assetVersion": "Una versione da fissare. Vuoto segue la versione più recente dell'asset.",
    "removeAsset": "Togli questo asset fissato dalla prossima revisione dell'agente al salvataggio.",
    "addAsset": "Fissa un altro asset alla prossima revisione dell'agente.",
    "capabilities": "Capacità usate dall'agente, come gli strumenti host che un worker deve avere (pandoc, git).",
    "systemPrompt": "Il prompt di sistema si imposta per distribuzione, così ogni ambiente può usare il proprio.",
    "showRuntime": "Apri le distribuzioni dell'agente, dove si modificano il prompt di sistema e la sua versione."
   },
   "edge": {
    "title": "La chiamata selezionata: chi chiama chi, il fan-out e la profondità di delega che richiede.",
    "from": "L'agente che effettua questa chiamata.",
    "to": "L'agente raggiunto da questa chiamata.",
    "depth": "Quanti livelli di delega servono al chiamante per questa chiamata, ricavati dal grafo."
   },
   "app": {
    "title": "Campi del documento dell'app in questa bozza. Il salvataggio riscrive il suo elemento AgenticApp.",
    "entry": "Il membro che parla con le persone che usano l'app. La modifica viene salvata subito.",
    "bring": "Copia il documento attivo dell'app nella bozza per modificarne l'accesso e l'aspetto.",
    "description": "A cosa serve l'app, mostrato nell'elenco delle app della console.",
    "authMode": "Chi può accedere all'app: utenti del tenant, utenti dell'app o chiunque (anonimo).",
    "anonymous": "Consenti di usare l'app senza accedere, quando la modalità di accesso lo permette.",
    "branding": "L'aspetto della pagina di chat dell'app per le persone che la usano.",
    "brandingFields": {
     "displayName": "Il nome nell'intestazione dell'app. Se vuoto si usa il nome dell'app.",
     "logo": "Un asset dell'agente la cui prima immagine diventa il logo dell'app.",
     "primaryColor": "Il colore principale della pagina dell'app, come valore esadecimale.",
     "accentColor": "Il secondo colore della pagina dell'app, come valore esadecimale.",
     "welcomeText": "La prima cosa che le persone leggono quando aprono l'app."
    }
   },
   "runtime": {
    "title": "Le distribuzioni dell'agente in questa bozza, un ambiente alla volta.",
    "deployment": "Scegli la distribuzione dell'ambiente da modificare. Il salvataggio cambia solo l'elemento di quella distribuzione.",
    "live": "Distribuzioni di questo agente che ora sono in uso ma non sono nella bozza. Portane una nella bozza per modificarla.",
    "bring": "Copia il documento attivo di {{name}} nella bozza come nuovo elemento.",
    "approvals": "Se le chiamate a strumenti delle esecuzioni di questa distribuzione attendono una persona, e le regole che decidono prima.",
    "fields": {
     "model": "Il modello usato dall'harness, ad esempio sonnet. Se vuoto si usa il modello predefinito del profilo harness.",
     "effort": "Il livello di impegno di ragionamento che l'harness trasmette, ad esempio high. Se vuoto decide l'harness.",
     "timeoutSeconds": "Quanto può durare un'esecuzione prima di essere fermata, in secondi.",
     "maxTurns": "Quanti turni del modello può fare un'esecuzione prima di fermarsi.",
     "maxBudgetUsd": "Quanto può costare un'esecuzione in dollari USA prima che l'harness la fermi.",
     "systemTemplate": "Il modello di prompt usato come prompt di sistema, per nome. Se vuoto si usa il prompt predefinito integrato.",
     "systemVersion": "Una versione di quel modello da fissare. Se vuoto segue la versione più recente.",
     "approvalsEnabled": "Attivo: le chiamate a strumenti che nessuna regola consente attendono una persona in Approvazioni.",
     "approvalDefaultAction": "Cosa succede a una chiamata a strumento che nessuna regola copre: consentirla, negarla o chiedere a una persona."
    },
    "rule": {
     "action": "Cosa fa questa regola con una chiamata a strumento corrispondente.",
     "pattern": "Le chiamate a strumenti a cui corrisponde la regola, ad esempio Bash(git *).",
     "inputPattern": "Un pattern facoltativo a cui deve corrispondere anche l'input della chiamata a strumento.",
     "remove": "Elimina questa regola al salvataggio.",
     "add": "Aggiungi una regola; le regole vengono controllate in ordine e decide la prima che corrisponde."
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
  "brand": "Garrison Agent Studio: crea, distribuisci ed esegui app agentiche con gli harness di agenti che usi già.",
  "tabs": {
   "serverInfo": "Informazioni su Garrison Agent Studio: le versioni del server e della dashboard, i link alla documentazione e al sito web, gli indirizzi REST, MCP e A2A e l'identità con cui hai effettuato l'accesso."
  }
 },
 "common": {
  "openStudio": "Apri lo Studio degli agenti, dove l'architetto di agenti prepara con te agenti e app. Nulla diventa attivo finché una persona non approva la bozza."
 },
 "wizard": {
  "start": "Inizia la configurazione: aggiungi una credenziale, prepara l'architetto di agenti, applica un agente di esempio e provalo.",
  "skipStudio": "Continua senza architetto. Potrai crearne uno in seguito nello Studio degli agenti con Nuovo architetto.",
  "createArchitect": "Crea una distribuzione di agent-architect con queste scelte e passa al passaggio successivo. Le sue esecuzioni possono modificare solo le tue bozze dello studio.",
  "continue": "L'architetto esiste già. Passa al passaggio successivo della configurazione."
 },
 "views": {
  "home": {
   "openStudio": "Apri lo Studio degli agenti e descrivi l'app che vuoi; l'architetto di agenti la prepara e una persona la approva prima che diventi attiva."
  },
  "studioDraft": {
   "tabs": {
    "release": "Le app di questa bozza, una volta applicata: le loro distribuzioni per ambiente, la promozione da dev a staging e prod e il ripristino dalla cronologia."
   }
  },
  "serverInfo": {
   "product": "Il prodotto a cui appartiene questa console: lo Studio degli agenti crea app agentiche sopra il runtime di Garrison.",
   "docs": "Apri la documentazione di Garrison in una nuova scheda: architettura, configurazione, harness, lo studio, le app e la sicurezza.",
   "studioDocs": "Apri la guida allo Studio degli agenti in una nuova scheda: bozze, l'architetto di agenti, l'applicazione di una bozza e la promozione.",
   "website": "Apri usegarrison.ai in una nuova scheda per la presentazione del prodotto, gli screenshot e le guide.",
   "source": "Apri il repository Garrison su GitHub in una nuova scheda: codice sorgente, segnalazioni e versioni."
  }
 },
 "resources": {
  "apps": {
   "actions": {
    "environments": "Vedi le distribuzioni dell'app per ambiente con le revisioni fissate e le sostituzioni, promuovila all'ambiente successivo e ripristina una promozione."
   }
  }
 },
 "apps": {
  "release": {
   "live": "L'ambiente la cui distribuzione di ingresso è usata dall'URL dell'app: {{environment}}. Cambialo nel passaggio Ambienti dell'app.",
   "environments": "Le distribuzioni di ogni membro in ogni ambiente: la revisione che ciascuna fissa (Ultima quando segue l'ultima revisione pubblicata) e le sostituzioni dell'ambiente.",
   "source": "L'ambiente da cui parte il confronto, di solito quello in cui hai provato. Anche Promuovi parte da qui.",
   "target": "L'ambiente con cui confrontare e verso cui promuovere. Lascia l'ambiente successivo per seguire l'ordine di promozione.",
   "promote": "Apri la finestra di promozione da {{source}} a {{target}}: la revisione fissata di ogni membro passa alle sue distribuzioni in {{target}} in un'unica transazione.",
   "noNext": "Non c'è nessun ambiente dopo {{source}}, quindi non c'è nulla verso cui promuovere.",
   "denied": "Per questo ti serve l'autorizzazione Eseguire su Promozione per {{environment}}. Chiedi a un amministratore il ruolo Releaser.",
   "noDeployment": "Questo membro non ha distribuzioni in {{environment}}. Una promozione a {{environment}} fallisce finché non ne ha una.",
   "overrides": "Sostituzioni dell'ambiente di questa distribuzione: variabili impostate per le sue esecuzioni. I valori segreti non vengono mai mostrati.",
   "entry": "L'agente di ingresso: chi usa l'app parla prima con questo membro.",
   "history": "Ogni promozione e ripristino di questa app, dal più recente. Una promozione applicata si può ripristinare una volta, e così tornano le revisioni fissate che aveva sostituito.",
   "refresh": "Rileggi le distribuzioni e la cronologia delle promozioni di questa app.",
   "columns": {
    "member": "Gli agenti membri dell'app, per primo l'agente di ingresso.",
    "environment": "Distribuzioni di ogni membro in {{environment}}, con la revisione fissata e le sostituzioni dell'ambiente.",
    "difference": "Se le revisioni fissate e le sostituzioni di ogni membro coincidono tra i due ambienti confrontati."
   },
   "diff": {
    "Same": "Le revisioni fissate e le sostituzioni di {{source}} e {{target}} coincidono.",
    "Differs": "Le revisioni fissate o le sostituzioni sono diverse tra {{source}} e {{target}}. La promozione sposta le revisioni fissate; ogni distribuzione mantiene le proprie sostituzioni.",
    "Missing": "Questo membro non ha distribuzioni in {{target}}. Promuovere da {{source}} fallirebbe senza spostare nulla."
   }
  }
 },
 "studio": {
  "release": {
   "title": "Le app di questa bozza, lette dalla configurazione attiva: distribuzioni per ambiente, promozione e ripristino.",
   "app": "Scegli quale app della bozza mostrare quando la bozza ne crea più di una."
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
   "architects": "Architetti di agenti riutilizzabili in qualsiasi bozza dello studio: creali, modificali ed eliminali, e scegli il profilo harness, il modello e il prompt di ciascuno."
  }
 },
 "resources": {
  "architects": {
   "add": "Crea un architetto di agenti: una distribuzione di agent-architect che modifica solo le tue bozze dello studio e non le applica mai.",
   "harnessProfileId": "Il profilo harness su cui viene eseguito l'architetto, che stabilisce la CLI di agente usata (Claude Code, Codex e così via).",
   "model": "Il modello che l'architetto chiede all'harness. Vuoto usa il modello predefinito del profilo harness.",
   "architectPromptTemplateId": "Il modello System che dice all'architetto come lavorare. I prompt integrati vengono per primi; clonane uno per modificarlo.",
   "architectPromptVersion": "Fissa l'architetto a una versione del suo prompt. Vuoto segue la versione corrente, quindi una modifica salvata vale dal suo turno successivo.",
   "defaultModel": "Nessun modello impostato, quindi l'architetto usa il modello predefinito del profilo harness.",
   "defaultBadge": "Questo architetto usa il prompt predefinito integrato, builtin/agent-architect.",
   "activeBadge": "Attivo: le bozze possono avviare nuove conversazioni con questo architetto.",
   "inactiveBadge": "Inattivo: l'architetto non accetta nuovi turni e le bozze non lo propongono finché non lo riattivi.",
   "actions": {
    "prompts": "Gestisci i prompt dell'architetto: scegli quello usato da questo architetto e clona, modifica, reimposta o elimina i prompt.",
    "deployment": "Apri la distribuzione dietro questo architetto per cambiarne limiti, esecutore, regole di uscita e altre impostazioni."
   }
  }
 },
 "studio": {
  "chat": {
   "manageArchitects": "Apri Agenti > Architetti per creare, modificare o eliminare gli architetti che ogni bozza può usare."
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
  "typeToConfirm": "Digita {{word}} esattamente come mostrato per attivare il pulsante Elimina. Così un clic accidentale non cancella qualcosa che non si può recuperare.",
  "typeFirst": "Digita prima {{word}} nella casella. Il pulsante resta disattivato finché la parola non corrisponde."
 },
 "resources": {
  "agents": {
   "protected": "{{name}} è un agente integrato protetto che Garrison crea in ogni tenant, quindi non può essere modificato né eliminato."
  }
 },
 "views": {
  "agentDetail": {
   "delete": "Elimina questo agente con le sue distribuzioni e la cronologia delle revisioni. Confermi digitando delete; un trigger, una pipeline, un'applicazione o un endpoint di notifica che lo usa impedisce l'eliminazione."
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
   "credentialSecretId": "Il segreto con cui accede l'harness dell'architetto: una chiave API Anthropic o un token OAuth di Claude Code per Claude Code, una chiave API OpenAI o un accesso ChatGPT per Codex, e così via. Garrison lo associa alla distribuzione dell'architetto."
  },
  "chat": {
   "fixCredential": "Apri Agenti > Architetti filtrato su questo architetto, poi modificalo e scegli il suo segreto di credenziale.",
   "openSecrets": "Apri Configurazione > Segreti per aggiungere la chiave API o il token, o per controllare il valore di quello usato dall'architetto."
  }
 },
 "resources": {
  "architects": {
   "credentialSecretId": "Il segreto con cui accede l'harness dell'architetto: una chiave API Anthropic o un token OAuth di Claude Code per Claude Code, una chiave API OpenAI o un accesso ChatGPT per Codex, e così via. Garrison lo associa alla distribuzione dell'architetto.",
   "credentialCell": "Il segreto con cui accede l'harness di questo architetto ({{kind}}).",
   "noCredential": "Nessun segreto di credenziale associato, quindi gli harness che ne hanno bisogno (Claude Code, Codex, Gemini CLI) falliscono con Not logged in. Modifica l'architetto per sceglierne uno."
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
  "refresh": "Rileggi questo elenco, ad esempio dopo aver aggiunto un record in un'altra pagina.",
  "open": "Apre {{page}} in una nuova scheda, così questo modulo conserva ciò che hai scritto. Torna qui quando hai finito; l'elenco si aggiorna."
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
})(tips, {
 "secretGuide": {
  "title": "I passaggi per creare o trovare questo tipo di credenziale presso il fornitore, e come Garrison la passa all'harness.",
  "link": "Apre {{url}} in una nuova scheda."
 }
});
