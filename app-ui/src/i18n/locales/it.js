// Italian catalog for the Garrison app UI. Mirrors en.js key for key.

const it = {
  common: {
    loading: 'Caricamento',
    close: 'Chiudi',
    cancel: 'Annulla',
    retry: 'Riprova',
    defaultTitle: 'App Garrison'
  },
  app: {
    notFoundTitle: 'App non trovata',
    notFoundBody: "A questo indirizzo non c'è nessuna app. Controlla il link che hai ricevuto.",
    noSlugTitle: 'Nessuna app selezionata',
    noSlugBody: "Apri il link di un'app specifica. I link delle app hanno questo formato: /apps/your-app/.",
    loadErrorTitle: "Non è stato possibile caricare l'app",
    loadErrorBody: 'Il server non ha risposto. Controlla la connessione e riprova.',
    skipToChat: 'Vai alla conversazione'
  },
  signIn: {
    title: 'Accedi a {{name}}',
    email: 'Email',
    password: 'Password',
    submit: 'Accedi',
    submitting: 'Accesso in corso',
    anonymous: 'Continua senza accedere',
    anonymousNote: 'Le conversazioni avviate senza accedere restano solo in questa scheda del browser.',
    or: 'oppure',
    sessionEnded: 'La sessione è scaduta. Accedi di nuovo per continuare.'
  },
  header: {
    conversations: 'Conversazioni',
    files: 'File',
    signOut: 'Esci',
    signedInAs: 'Accesso effettuato come {{name}}',
    guest: 'Ospite',
    themeLight: 'Passa al tema chiaro',
    themeDark: 'Passa al tema scuro',
    language: 'Lingua',
    logoAlt: 'Logo di {{name}}'
  },
  conversations: {
    title: 'Conversazioni',
    new: 'Nuova conversazione',
    empty: 'Ancora nessuna conversazione. Invia un messaggio per iniziarne una.',
    untitled: 'Conversazione del {{date}}',
    messages: 'Messaggi: {{count}}',
    working: 'In corso',
    loadError: 'Non è stato possibile caricare le tue conversazioni.'
  },
  chat: {
    welcomeDefault: 'Fai una domanda per iniziare.',
    composerLabel: 'Messaggio',
    composerPlaceholder: 'Scrivi un messaggio',
    composerHint: 'Invio manda il messaggio. Maiusc e Invio vanno a capo.',
    send: 'Invia',
    sending: 'Invio in corso',
    you: 'Tu',
    waiting: "L'agente ci sta lavorando",
    approval: 'In attesa che un operatore approvi un passaggio',
    reconnecting: 'La connessione si è interrotta. Riconnessione in corso',
    failed: 'Questa risposta non è stata completata.',
    details: "Attività dell'agente",
    loadError: 'Non è stato possibile caricare questa conversazione.',
    missing: "Conversazione non trovata. Potrebbe appartenere a un'altra sessione.",
    busyComposer: "L'agente sta ancora rispondendo. Potrai inviare il prossimo messaggio quando avrà finito.",
    dismiss: 'Chiudi avviso'
  },
  statuses: {
    Pending: 'In attesa di avvio',
    Queued: 'In attesa di avvio',
    Leased: 'Avvio',
    Running: 'In corso',
    Cancelling: 'Arresto in corso',
    Succeeded: 'Completato',
    Failed: 'Non riuscito',
    Cancelled: 'Annullato',
    TimedOut: 'Tempo scaduto',
    Rejected: 'Non consentito',
    Suspended: 'In pausa'
  },
  detailTypes: {
    Thinking: 'Ragionamento',
    ToolCall: 'Chiamata a strumento',
    ToolResult: 'Risultato dello strumento',
    Progress: 'Avanzamento',
    Warning: 'Avviso'
  },
  files: {
    title: 'File',
    empty: "L'agente non ha ancora scritto file in questa conversazione.",
    noConversation: "I file scritti dall'agente compariranno qui quando inizia una conversazione.",
    summary: 'File: {{count}} ({{size}})',
    download: 'Scarica',
    versions: 'Versioni',
    versionsTitle: 'Versioni di {{path}}',
    version: 'Versione {{number}}',
    current: 'Attuale',
    updated: 'Aggiornato {{when}}',
    size: 'Dimensione',
    newBadge: 'Nuovo',
    downloadFailed: 'Non è stato possibile avviare il download. Riprova.',
    loadError: 'Non è stato possibile caricare i file.',
    versionsError: 'Non è stato possibile caricare le versioni.',
    close: 'Chiudi i file'
  },
  errors: {
    InvalidCredentials: "L'email o la password non sono corrette.",
    AppSignInRequired: 'Accedi per usare questa app.',
    AnonymousDisabled: "L'uso anonimo di questa app è disattivato. Accedi per continuare.",
    AppAccessDenied: "Questo account non ha accesso all'app. Chiedi l'accesso al proprietario dell'app.",
    AppSessionRequired: 'La sessione è scaduta. Accedi di nuovo per continuare.',
    ConversationBusy: "L'agente sta ancora rispondendo al messaggio precedente. Attendi che finisca, poi invia di nuovo.",
    AppRateLimited: 'Stai inviando messaggi troppo velocemente. Attendi un minuto e riprova.',
    AppNotDeployed: 'Questa app non è ancora pronta. Riprova più tardi.',
    NetworkError: 'Impossibile raggiungere il server. Controlla la connessione e riprova.',
    generic: 'Si è verificato un problema (HTTP {{status}}). Riprova.'
  },
  tips: {
    email: "L'indirizzo email del tuo account per questa app.",
    password: 'La password del tuo account. Viene inviata solo a questo server per avviare la sessione.',
    submit: "Verifica email e password e apre l'app.",
    anonymous: "Usa l'app come ospite. Le conversazioni durano solo quanto questa scheda del browser.",
    language: "Scegli la lingua dell'app. La scelta viene salvata in questo browser.",
    themeLight: 'Usa colori chiari. La scelta viene salvata in questo browser e ha la precedenza sulle impostazioni di sistema.',
    themeDark: 'Usa colori scuri. La scelta viene salvata in questo browser e ha la precedenza sulle impostazioni di sistema.',
    signOut: 'Chiude la sessione su questo dispositivo e torna alla schermata di accesso.',
    conversationsToggle: 'Mostra o nasconde la lista delle tue conversazioni.',
    filesToggle: "Mostra o nasconde i file scritti dall'agente in questa conversazione.",
    newConversation: 'Avvia una nuova conversazione. Quelle precedenti restano nella lista.',
    conversation: 'Apre questa conversazione per riprendere da dove avevi lasciato.',
    composer: "Scrivi il tuo messaggio per l'agente. Invio lo manda; Maiusc e Invio vanno a capo.",
    send: "Invia il messaggio all'agente. La risposta compare qui sotto mentre viene scritta.",
    dismiss: 'Nasconde questo messaggio dalla schermata.',
    retry: "Carica di nuovo l'app da capo.",
    download: 'Salva la versione attuale di questo file sul tuo dispositivo.',
    versions: 'Mostra tutte le versioni di questo file per scaricarne una precedente.',
    downloadVersion: 'Salva questa versione del file sul tuo dispositivo.',
    closeDialog: 'Chiude questa finestra e torna alla conversazione.',
    closeFiles: 'Nasconde il pannello dei file e torna alla conversazione.',
    details: "Mostra i passaggi seguiti dall'agente per rispondere: chiamate a strumenti, avanzamento e avvisi.",
    answerLink: 'Apre un link della risposta in una nuova scheda: {{href}}',
    tableHeader: 'Colonna di una tabella nella risposta: {{text}}',
    skipToChat: "Salta l'intestazione e la lista delle conversazioni e passa alla casella del messaggio."
  }
};

export default it;
