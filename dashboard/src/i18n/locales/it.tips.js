// Italian tooltip (tips.*) and relationship explainer (explainers.*) text. Merged into it.js. Mirrors en.tips.js key for key.

const TELEMETRY = {
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
    hubs: {
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
      artifactStores: 'Destinazioni per i file prodotti dalle esecuzioni che vuoi conservare dopo la loro fine.',
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
      serverInfo: 'Indirizzi REST, MCP e A2A, versioni di server e dashboard e l\'identità con cui hai effettuato l\'accesso.'
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
    serverUrl: 'Indirizzo base della REST API di Garrison, per esempio il server con port-forward su 127.0.0.1:8700.',
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
    clear: 'Svuota tutti i filtri qui sopra e ripeti la ricerca.'
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
      PodFailed: 'Il pod di esecuzione non è riuscito fuori dall\'harness: non è stato pianificato, la sua immagine non è stata scaricata, ha esaurito la memoria, è stato espulso o è terminato senza riferire. Il messaggio di errore indica la causa.'
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
      RunCancelled: 'Un\'esecuzione è stata annullata da un utente, da una chiave di accesso o dalla sua esecuzione padre.'
    }
  },
  resources: {
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
      inputSchemaJson: 'JSON Schema a cui deve essere conforme l\'input quando la modalità di input è «Structured».',
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
      retryOnNodeLoss: 'Rimetti l\'esecuzione in coda quando il suo nodo scompare, invece di farla fallire.',
      steps: {
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
      }
    },
    nodes: {
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
      principalName: 'Chi lo ha applicato.',
      dryRun: '«Sì» indica che è stato solo convalidato e non è stato scritto nulla.',
      counts: 'Quanti documenti hanno creato, aggiornato, lasciato invariati o fatto fallire record.'
    }
  },
  views: {
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
        transcript: 'Ogni evento prodotto dall\'harness: testo dell\'assistente, ragionamento, chiamate a strumenti e risultati, e utilizzo.',
        result: 'La risposta finale ed eventuale output strutturato.',
        input: 'Cosa ha inviato il chiamante, i parametri e le versioni esatte dei modelli di prompt usati.',
        stderr: 'L\'ultima parte dello standard error dell\'harness, con i segreti rimossi. Guarda qui quando un\'esecuzione fallisce.',
        children: 'Esecuzioni avviate da questa esecuzione chiamando altri agenti.'
      },
      eventFilter: 'Mostra solo un tipo di evento, come chiamate a strumenti o errori.',
      openChild: 'Apri questa esecuzione figlia, avviata quando questa esecuzione ha chiamato un altro agente.',
      eventCodes: {
        RunGuardTriggered: 'Una protezione ha fermato questa esecuzione. Il messaggio dice quale protezione è scattata e cosa ha visto; l\'esecuzione termina come Non riuscita con l\'esito di quella protezione e conserva l\'output parziale.'
      }
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
      }
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
      timePresetClear: 'Togli il limite di tempo così l\'esecuzione usa il valore della distribuzione.'
    },
    manifests: {
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
          NoProgressSeconds: 'Secondi senza testo, ragionamento o attività degli strumenti dopo i quali un\'esecuzione si ferma (esito Nessun avanzamento), per le distribuzioni che lasciano vuoto il limite. 0 lo disattiva.'
        },
        Scheduling: {
          PauseGraceMs: 'Dopo una sospensione dell\'host o una pausa della VM, il leader attende una finestra di heartbeat più questi millisecondi prima di segnare i nodi come Perso o di far fallire le loro esecuzioni. Predefinito 5000.'
        }
      }
    },
    runGuard: {
      openDeployments: 'Vai a Distribuzioni per cambiare le protezioni di una distribuzione: Protezione dalle ripetizioni, Massimo di caratteri dell\'assistente e Limite senza avanzamento.',
      openSettings: 'Vai a Impostazioni per cambiare i valori del cluster (Motore di esecuzione) seguiti dalle distribuzioni senza protezioni proprie.'
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
  }
};

export { tips, explainers };
