// French catalog for the Garrison dashboard. Mirrors every key in en.js.

import { tips, explainers } from './fr.tips.js';

const rp = (title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody) => ({ title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody });

const fr = {
  processSecurity: { trustedOnly: "Exécuteur Process : réservé aux tâches de confiance. Les exécutions partagent le compte, le système de fichiers et le réseau du worker, avec accès aux autres exécutions et aux identifiants du worker. Utilisez KubernetesJob pour les entrées non fiables." },
  common: {
    eventCodes: { ApprovalRequested: 'Approbation demandée', ApprovalDecided: 'Approbation décidée', StructuredOutputInvalid: 'Sortie structurée non valide', RunBlocked: 'Exécution bloquée', EventsDropped: 'Événements abandonnés', HarnessExited: 'Harness arrêté', McpPreflightWarning: 'Avertissement de vérification préalable MCP', McpPreflightPassed: 'Vérification préalable MCP réussie', RepairAttemptStarted: 'Réparation de la sortie lancée', WorkspacePrepared: 'Espace de travail préparé', RunGuardTriggered: 'Une garde a arrêté l\'exécution', ConversationFallback: 'Conversation reconstruite', ConversationResumed: 'Conversation reprise', ConversationStateLost: 'État de la conversation perdu' },
    fieldCodes: { ExpiryInPast: 'Choisissez un moment dans le futur.', ParameterInvalid: 'Cette valeur n\'est pas valide pour ce paramètre.', ParameterNotAllowed: 'Ce déploiement ne permet pas aux appelants de remplacer ce paramètre.', SettingsFileReadOnly: 'Le fichier de paramètres est en lecture seule ; cette modification ne peut donc pas être enregistrée.', OverriddenByEnvironment: 'Une variable d\'environnement définit cette valeur ; elle ne peut donc pas être modifiée ici.', PathRequired: 'Un chemin de paramètre est requis.', UnknownSetting: 'Ce serveur ne connaît pas ce paramètre.', TooLong: 'Cette valeur est trop longue.', NotAllowedValue: 'Choisissez l\'une des valeurs autorisées.', NotABoolean: 'Choisissez vrai ou faux.', NotAnInteger: 'Saisissez un nombre entier.', OutOfRange: 'La valeur est hors de la plage autorisée.' },
    serverText: {
      approvalWaitingExpires: 'En attente qu\'une personne approuve {{subject}} ; l\'approbation {{id}} expire le {{expires}}.',
      approvalWaiting: 'En attente qu\'une personne approuve {{subject}} ; approbation {{id}}.',
      notApplied: 'Non appliqué, car un autre document n\'a pas passé la validation.',
      wouldBeUnchanged: 'Déjà à jour ; rien ne changerait.',
      wouldBeUpdated: 'Serait mis à jour.',
      wouldBeCreated: 'Serait créé.',
      inUse: '{{what}} est encore lié à ces déploiements : {{deployments}}. Retirez d\'abord les liaisons.',
      noActiveDeployment: 'L\'agent {{agent}} n\'a aucun déploiement actif avec un poids supérieur à zéro. Ajoutez un déploiement ou augmentez un poids, puis réessayez.',
      toolCallDenied: 'Appel d\'outil refusé : {{id}}',
      threadStarted: 'Fil démarré.',
      runStartedModel: 'Exécution démarrée ({{model}}).',
      runStarted: 'Exécution démarrée.',
      sessionInitializedModel: 'Session initialisée ({{model}}).',
      sessionInitialized: 'Session initialisée.',
      harnessFailed: 'Le harness a signalé un échec.',
      exitedNoResult: 'Le harness s\'est arrêté avec le code {{code}} sans résultat final.',
      harnessExited: 'Le harness s\'est arrêté : {{status}} ({{outcome}}).',
      harnessExitedCode: 'Le harness s\'est arrêté avec le code {{code}} : {{status}} ({{outcome}}).',
      mcpPreflight: 'Vérification préalable MCP réussie. Serveurs vérifiés : {{count}}.',
      repairAttempt: 'Tentative {{attempt}} de réparation de la sortie structurée : reprise de la session du harness dans {{path}}.',
      workspacePrepared: 'Espace de travail préparé dans {{path}}.',
      guardRepetitionUnit: 'Garde de répétition : les {{window}} derniers caractères du texte de l\'assistant sont l\'unité de {{size}} caractères « {{unit}} » répétée {{count}} fois.',
      guardDegenerate: 'Garde de répétition : les {{window}} derniers caractères du texte de l\'assistant ne contiennent ni lettre ni chiffre (seulement des espaces, de la ponctuation ou des symboles) et se terminent par « {{tail}} ».',
      guardNoProgress: 'L\'exécution n\'a pas progressé pendant {{seconds}} secondes (aucun texte de l\'assistant, raisonnement, appel d\'outil ni résultat d\'outil, et aucun appel d\'outil ouvert) ; sa limite noProgressSeconds est {{limit}}.',
      guardOutputLimit: 'Le texte de l\'assistant a dépassé la limite maxAssistantChars de l\'exécution, soit {{limit}} caractères.',
      valueClamped: 'La valeur {{given}} de {{field}} est hors de la plage autorisée de {{minimum}} à {{maximum}} ; {{stored}} a été enregistré.'
    },
    appName: 'Garrison',
    language: { label: 'Langue' },
    theme: { switchToLight: 'Passer au thème clair', switchToDark: 'Passer au thème sombre' },
    actions: {
      apply: 'Appliquer',
      back: 'Retour',
      cancel: 'Annuler',
      clear: 'Effacer',
      clone: 'Cloner',
      close: 'Fermer',
      confirm: 'Confirmer',
      copied: 'Copié',
      copy: 'Copier',
      delete: 'Supprimer',
      duplicate: 'Dupliquer',
      edit: 'Modifier',
      hide: 'Masquer la valeur',
      logout: 'Se déconnecter',
      next: 'Suivant',
      openGithub: 'Ouvrir le dépôt Garrison sur GitHub',
      remove: 'Retirer',
      retry: 'Réessayer',
      reveal: 'Afficher la valeur',
      save: 'Enregistrer',
      view: 'Voir',
      viewDetails: 'Voir les détails',
      viewJson: 'Voir le JSON'
    },
    boolean: { yes: 'Oui', no: 'Non' },
    confirm: {
      deleteNamed: 'Supprimer « {{name}} » ? Cette action est irréversible.',
      bulkDelete: 'Supprimer les {{count}} enregistrements sélectionnés ? Cette action est irréversible.'
    },
    errors: {
      listItem: 'Élément {{index}} : {{message}}',
      chooseOne: 'Choisissez au moins une option.',
      fixFields: 'Certains champs nécessitent votre attention. Vérifiez les valeurs mises en évidence.',
      invalidEmail: 'Saisissez une adresse e-mail valide.',
      invalidJson: 'Ce JSON n\'est pas valide.',
      loadFailed: 'Échec du chargement des données.',
      requestId: 'Requête {{id}}.',
      required: 'Ce champ est obligatoire.',
      requiredPermission: 'Nécessite {{permission}} sur {{resource}}.'
    },
    generic: {
      deletedName: '{{name}} (supprimé)',
      actions: 'Actions',
      active: 'Actif',
      all: 'Tous',
      any: 'N\'importe lequel',
      builtIn: 'Intégré',
      custom: 'Personnalisé',
      inactive: 'Inactif',
      loading: 'Chargement...',
      never: 'Jamais',
      none: 'Aucun',
      notAvailable: 'n/d',
      saving: 'Enregistrement...'
    },
    relativeTime: { now: 'à l\'instant' },
    states: {
      forbiddenTitle: 'Vous n\'avez pas accès à cette page',
      forbiddenBody: 'Demandez à un administrateur un rôle qui donne accès, ou choisissez une autre page.',
      unavailableTitle: 'Pas encore disponible sur ce serveur',
      unavailableBody: 'Le serveur n\'expose pas les points de terminaison {{resource}}. Mettez le serveur à niveau ou consultez l\'Explorateur d\'API pour voir ce qu\'il prend en charge.'
    },
    toasts: {
      bulkDeleted: '{{count}} enregistrements supprimés ({{failed}} en échec).',
      cloned: 'Cloné.',
      created: 'Créé.',
      deleted: 'Supprimé.',
      saved: 'Enregistré.'
    },
    units: { msShort: 'ms', sShort: 's', mShort: 'min', tokPerSec: 'jetons/s' }
  },
  errorCodes: {
    ApprovalNotPending: 'Cette approbation a déjà été décidée ; elle ne peut donc pas l\'être à nouveau.',
    MessageIdConflict: 'Cet ID de message A2A a déjà servi avec un autre contenu. Envoyez le message avec un nouvel ID.',
    IdempotencyKeyConflict: 'Cette clé d\'idempotence a déjà servi pour une autre requête. Utilisez une nouvelle clé.',
    DeploymentDeleted: 'Le déploiement de cette exécution a été supprimé ; l\'exécution ne peut donc pas être relancée. Invoquez plutôt l\'agent à nouveau.',
    AgentDeleted: 'L\'agent de cette exécution a été supprimé ; l\'exécution ne peut donc pas être relancée.',
    NoActiveDeployment: 'Cet agent n\'a aucun déploiement actif avec un poids supérieur à zéro. Ajoutez un déploiement ou augmentez un poids.',
    TenantNotFound: 'Ce locataire n\'existe pas. Vérifiez l\'ID du locataire.',
    NetworkError: 'Impossible de joindre le serveur. Vérifiez l\'URL du serveur et que celui-ci est en cours d\'exécution.',
    AuthenticationRequired: 'Votre session a expiré. Reconnectez-vous.',
    InvalidCredentials: 'Le locataire, l\'e-mail, le mot de passe ou les clés sont incorrects.',
    RateLimited: 'Trop de tentatives de connexion. Patientez une minute puis réessayez.',
    AuthorizationDenied: 'Vous n\'avez pas l\'autorisation d\'effectuer cette action.',
    NotFound: 'L\'enregistrement est introuvable.',
    RouteNotFound: 'Ce serveur ne prend pas en charge ce point de terminaison.',
    ValidationFailed: 'Certaines valeurs ne sont pas valides.',
    InvalidBody: 'Le corps de la requête n\'est pas valide.',
    InvalidJson: 'Le corps de la requête n\'est pas un JSON valide.',
    Conflict: 'Ceci entre en conflit avec un enregistrement existant.',
    BuiltInImmutable: 'Les enregistrements intégrés ne peuvent pas être modifiés. Clonez celui-ci pour le personnaliser.',
    Protected: 'Cet enregistrement est protégé et ne peut pas être supprimé.',
    StaleLease: 'Le bail de l\'exécution n\'est plus détenu par ce nœud.',
    InternalError: 'Le serveur a rencontré une erreur interne. Consultez les journaux du serveur avec l\'ID de requête.',
    Http400: 'La requête a été rejetée comme non valide.',
    Http403: 'Vous n\'avez pas l\'autorisation d\'effectuer cette action.',
    Http404: 'Introuvable.',
    Http409: 'Conflit avec l\'état actuel.',
    Http500: 'Le serveur a rencontré une erreur interne.',
    Http503: 'Le serveur est indisponible.',
    ConversationBusy: 'Cette conversation traite encore son tour précédent. Attendez la fin de cette exécution, ou annulez-la, puis réessayez.',
    ConversationAgentMismatch: 'Cette conversation appartient à un autre agent. Envoyez le tour à cet agent ou démarrez une nouvelle conversation.',
    ConversationDeploymentMismatch: 'Chaque tour d\'une conversation s\'exécute sur le déploiement de son premier tour. Laissez le déploiement vide ou démarrez une nouvelle conversation.',
    ConversationDeploymentUnavailable: 'Le déploiement de cette conversation a été supprimé, la conversation ne peut donc pas continuer. Démarrez une nouvelle conversation.'
  },
  enums: {
    approvalStatus: {
      Pending: 'En attente',
      Approved: 'Approuvée',
      Denied: 'Refusée',
      Expired: 'Expirée',
      Cancelled: 'Annulée'
    },
    approvalDecision: {
      Allow: 'Autoriser',
      Deny: 'Refuser'
    },
    approvalSource: {
      DurableResume: "Approbation conservée",
      Rule: 'Règle',
      Default: 'Valeur par défaut du déploiement',
      User: 'Personne',
      Timeout: 'Délai dépassé',
      Cancelled: 'Exécution arrêtée'
    },
    approvalRuleAction: {
      Allow: 'Autoriser',
      Deny: 'Refuser',
      Ask: 'Demander à une personne'
    },
    approvalKind: {
      Tool: 'Appel d\'outil',
      Command: 'Commande',
      FileChange: 'Modification de fichier'
    },
    principalType: { Administrator: 'Administrateur système', User: 'Utilisateur', Credential: 'Clé d\'accès', Run: 'Jeton d\'exécution' },
    runBlockedReason: { NoReadyWorker: 'Aucun nœud worker prêt', NoCapableWorker: 'Aucun nœud worker compatible', NoMatchingPool: 'Aucun pool de nœuds correspondant' },
    promptDelivery: { Stdin: 'Entrée standard', Argument: 'Argument de ligne de commande', File: 'Fichier', CodexAppServer: 'Serveur d\'application Codex (JSON-RPC)' },
    systemPromptDelivery: {
      File: 'Fichier',
      Argument: 'Argument de ligne de commande',
      Environment: 'Variable d\'environnement',
      PrependToPrompt: 'Ajouté avant le prompt',
      None: 'Non transmis'
    },
    mcpConfigFormat: {
      None: 'Aucune configuration MCP',
      ClaudeJson: 'Claude Code JSON',
      CodexToml: 'Codex TOML',
      MuxJson: 'Mux JSON',
      GeminiSettings: 'Paramètres Gemini CLI'
    },
    outputParser: {
      ClaudeStreamJson: 'JSON en flux de Claude Code',
      CodexJsonl: 'Codex JSONL',
      CodexAppServer: 'JSON-RPC du serveur d\'application Codex',
      MuxJsonl: 'Mux JSONL',
      GeminiStreamJson: 'JSON en flux de Gemini CLI',
      GenericJsonl: 'JSONL générique',
      PlainText: 'Texte brut'
    },
    resultSource: { ParserFinalEvent: 'Dernier événement de l\'analyseur', LastMessageFile: 'Fichier du dernier message', Stdout: 'Stdout' },
    successPolicy: { FinalEvent: 'Événement final', ExitCode: 'Code de sortie', FinalEventAndExitCode: 'Événement final et code de sortie' },
    fileBaseDirectory: { Config: 'Répertoire de configuration', Workspace: 'Espace de travail', Home: 'Répertoire personnel' },
    artifactStoreKind: { Database: 'Base de données', Filesystem: 'Système de fichiers', S3: 'S3' },
    agentInputMode: { Text: 'Texte libre', Structured: 'JSON structuré' },
    argumentOverrideOperation: { Append: 'Ajouter à la fin', Prepend: 'Ajouter au début', Remove: 'Retirer', Replace: 'Remplacer' },
    runOverrideValidation: { Any: 'N\'importe quelle valeur', Enum: 'Valeur d\'une liste', Regex: 'Expression régulière', IntegerRange: 'Plage d\'entiers' },
    credentialAuthMode: {
      DirectHeader: 'En-têtes directs',
      SignedRequest: 'Requêtes signées',
      SessionExchange: 'Échange contre un jeton de session',
      Hybrid: 'N\'importe quelle méthode'
    },
    operationType: {
      All: 'Toutes les opérations',
      Create: 'Créer',
      Read: 'Lire',
      Write: 'Écrire',
      Update: 'Mettre à jour',
      Delete: 'Supprimer',
      Execute: 'Exécuter',
      Admin: 'Administrer'
    },
    usageQuotaScope: {"Tenant": "Locataire", "Agent": "Agent IA", "Deployment": "Déploiement"},
    resourceType: {
      All: 'Toutes les ressources',
      Account: 'Compte',
      Tenant: 'Locataire',
      Admin: 'Administration système',
      User: 'Utilisateur',
      Credential: 'Clé d\'accès',
      Session: 'Session de connexion',
      Role: 'Rôle',
      Permission: 'Autorisation',
      Assignment: 'Attribution',
      Audit: 'Journal d\'audit',
      RequestHistory: 'Historique des requêtes',
      Settings: 'Paramètres',
      HarnessProfile: 'Profil de harness',
      PromptTemplate: 'Modèle de prompt',
      Agent: 'Agent IA',
      Deployment: 'Déploiement',
      McpServer: 'Serveur MCP',
      Secret: 'Secret stocké',
      Workspace: 'Espace de travail',
      ArtifactStore: 'Stockage d\'artefacts',
      ModelPrice: "prix de modèle",
      UsageQuota: "quota d’utilisation",
      Run: 'Exécution',
      Node: 'Nœud',
      NodePool: 'Pool de nœuds',
      Manifest: 'Manifeste',
      Conversation: 'Conversation IA',
      Approval: 'Approbation',
      Artifact: 'Artefact'
    },
    runStatus: {
      Pending: 'En attente',
      Queued: 'En file d\'attente',
      Leased: 'Sous bail',
      Running: 'En cours',
      Cancelling: 'Annulation en cours',
      Succeeded: 'Réussie',
      Failed: 'Échouée',
      Cancelled: 'Annulée',
      TimedOut: 'Délai dépassé',
      Rejected: 'Rejetée'
    },
    runOutcome: {
      None: 'Aucun',
      Succeeded: 'Réussite',
      HarnessFailed: 'Échec du harness',
      NotInstalled: 'Harness non installé',
      NotCredentialed: 'Identifiants manquants',
      McpPreflightFailed: 'Échec de la vérification préalable MCP',
      NodeLost: 'Nœud perdu',
      OutputLimitExceeded: 'Limite de sortie dépassée',
      SchemaValidationFailed: 'Schéma de sortie non valide',
      TimedOut: 'Délai dépassé',
      Cancelled: 'Annulée',
      StaleLease: 'Bail périmé',
      CompileFailed: 'Échec de la compilation',
      WorkspaceFailed: 'Échec de l\'espace de travail',
      Rejected: 'Rejetée',
      InternalError: 'Erreur interne',
      NoCapableWorker: 'Aucun nœud worker compatible',
      RepetitionDetected: 'Répétition détectée',
      NoProgress: 'Aucune progression',
      PodFailed: 'Échec du pod d\'exécution',
      ConversationStateLost: 'État de la conversation perdu'
    },
    runEventType: {
      Lifecycle: 'Cycle de vie',
      AssistantText: 'Assistant',
      Thinking: 'Réflexion',
      ToolCall: 'Appel d\'outil',
      ToolResult: 'Résultat d\'outil',
      Usage: 'Consommation',
      Progress: 'Progression',
      Warning: 'Avertissement',
      Error: 'Erreur',
      Stdout: 'Stdout',
      Stderr: 'Stderr',
      Result: 'Résultat'
    },
    nodeStatus: { Ready: 'Prêt', Draining: 'Drainage en cours', Cordoned: 'Isolé', Lost: 'Perdu', Offline: 'Hors ligne' },
    controlNodeStatus: { Starting: 'Démarrage', Ready: 'Prêt', Draining: 'Drainage en cours', Offline: 'Hors ligne' },
    backplane: { Local: 'Local (un seul réplica)', Polling: 'Interrogation de la base de données', PostgresNotify: 'Notifications PostgreSQL' },
    harnessType: { ClaudeCode: 'Claude Code', Codex: 'Codex', Mux: 'Mux', GeminiCli: 'Gemini CLI', Generic: 'Générique' },
    agentKind: { Hosted: 'Hébergé', Remote: 'Distant' },
    delegationMode: { None: 'Aucune délégation', AllowList: 'Liste d\'autorisation', Any: 'N\'importe quel agent' },
    secretStatus: { Ok: 'Valide', NeedsReauthentication: 'Reconnexion requise' },
    secretKind: {
      AnthropicApiKey: 'Clé API Anthropic',
      ClaudeCodeOAuthToken: 'Jeton OAuth Claude Code',
      OpenAiApiKey: 'Clé API OpenAI',
      CodexAuthJson: 'auth.json de Codex',
      GeminiApiKey: 'Clé API Gemini',
      GenericEnv: 'Valeur d\'environnement',
      GenericFile: 'Contenu de fichier',
      BearerToken: 'Jeton Bearer',
      BasicAuth: 'Authentification basique',
      GitCredential: 'Identifiants Git'
    },
    workspaceKind: { Empty: 'Vide', GitRepository: 'Dépôt Git', Seeded: 'Fichiers préchargés', PersistentVolume: 'Volume persistant' },
    runExecutor: { Process: 'Processus', KubernetesJob: 'Job Kubernetes' },
    workspaceRetention: { Delete: 'Supprimer', Keep: 'Conserver', KeepOnFailure: 'Conserver en cas d\'échec' },
    promptTemplateKind: { System: 'Système', Task: 'Tâche', Fragment: 'Fragment', ToolDescription: 'Description d\'outil', ConfigFile: 'Fichier de configuration', Other: 'Autre' },
    permissionType: { Permit: 'Autoriser', Deny: 'Refuser' },
    resourceScope: { Tenant: 'Locataire', Resource: 'Ressource' },
    resourceBindingKind: { McpServer: 'Serveur MCP', Secret: 'Secret' },
    mcpTransport: { Http: 'HTTP', Stdio: 'stdio' },
    remoteProtocol: { A2A: 'A2A', Mcp: 'MCP' },
    manifestApplyResult: { Created: 'Créé', Updated: 'Mis à jour', Unchanged: 'Inchangé', Failed: 'Échec', Validated: 'Validé' },
    auditEventType: {
      ApprovalDecided: 'Approbation décidée',
      AuthSuccess: 'Connexion réussie',
      AuthFailure: 'Échec de connexion',
      SessionIssued: 'Session émise',
      SessionRevoked: 'Session révoquée',
      CredentialCreated: 'Clé d\'accès créée',
      CredentialRotated: 'Clé d\'accès renouvelée',
      CredentialUsed: 'Clé d\'accès utilisée',
      AuthorizationDenied: 'Autorisation refusée',
      AuthorizationBypass: 'Contournement de l\'autorisation',
      RoleChanged: 'Rôle modifié',
      PermissionChanged: 'Autorisation modifiée',
      AssignmentChanged: 'Attribution modifiée',
      ConfigurationChanged: 'Configuration modifiée',
      SecretChanged: 'Secret modifié',
      SettingsChanged: 'Paramètres modifiés',
      RestartRequested: 'Redémarrage demandé',
      ManifestApplied: 'Manifeste appliqué',
      NodeRegistered: 'Nœud enregistré',
      NodeStatusChanged: 'Statut du nœud modifié',
      RunCancelled: 'Exécution annulée',
      ConversationDeleted: 'Conversation supprimée'
    },
    conversationFallbackReason: {
      AffinityNodeLost: 'Nœud d\'affinité non prêt',
      AffinityWaitExpired: 'Attente d\'affinité expirée',
      WorkspaceLost: 'Espace de travail perdu',
      SessionMissing: 'Aucune session à reprendre',
      HarnessChanged: 'Profil de harness modifié',
      ResumeUnsupported: 'Reprise non prise en charge',
      ExecutorWithoutState: 'Exécuteur sans état'
    }
  },
  nav: {
    approvalsPending_one: '{{count}} approbation en attente',
    approvalsPending_other: '{{count}} approbations en attente',
    approvalsPending_many: '{{count}} approbations en attente',
    primary: 'Navigation principale',
    sections: {
      operate: 'Exploitation',
      platform: 'Plateforme',
      administration: 'Administration'
    },
    hubs: {
      approvals: {
        label: 'Approbations',
        tip: 'Appels d\'outil en attente d\'une personne, et toutes les décisions'
      },
      home: { label: 'Accueil', tip: 'Santé de la flotte et des exécutions en un coup d\'œil' },
      invoke: { label: 'Invoquer', tip: 'Essayer un agent de manière interactive' },
      runs: { label: 'Exécutions', tip: 'Exécutions et file d\'attente de planification' },
      analytics: { label: 'Analyses', tip: 'Vitesse des exécutions, jetons, coût et résultats au fil du temps' },
      agents: { label: 'Agents', tip: 'Agents et déploiements qui les exécutent' },
      configuration: { label: 'Configuration', tip: 'Profils de harness, modèles de prompt, serveurs MCP, secrets, espaces de travail, stockages d\'artefacts et manifestes' },
      fleet: { label: 'Flotte', tip: 'Plan de contrôle, nœuds worker et pools de nœuds' },
      access: { label: 'Accès', tip: 'Locataires, utilisateurs, clés d\'accès, rôles et attributions' },
      monitoring: { label: 'Supervision', tip: 'Historique des requêtes, audit et Explorateur d\'API' },
      system: { label: 'Système', tip: 'Paramètres et informations du serveur' }
    },
    items: {
      approvals: {
        label: 'Approbations',
        tip: 'Autoriser ou refuser les appels d\'outil demandés par les agents'
      },
      home: { label: 'Accueil', tip: 'Santé de la flotte et des exécutions en un coup d\'œil' },
      invoke: { label: 'Invoquer', tip: 'Essayer un agent de manière interactive' },
      runs: { label: 'Exécutions', tip: 'Rechercher, inspecter, annuler et relancer des exécutions' },
      queue: { label: 'File d\'attente', tip: 'Pression de planification par agent et par harness' },
      analytics: { label: 'Analyses', tip: 'Vitesse des exécutions, jetons, coût et résultats au fil du temps' },
      nodes: { label: 'Nœuds worker', tip: 'Nœuds worker et leurs capacités de harness' },
      controlNodes: { label: 'Plan de contrôle', tip: 'Réplicas du serveur qui servent l\'API et planifient les exécutions' },
      nodePools: { label: 'Pools de nœuds', tip: 'Regrouper les nœuds et les réserver à des locataires' },
      agents: { label: 'Agents', tip: 'Agents exposés via REST, MCP et A2A' },
      deployments: { label: 'Déploiements', tip: 'Lier les agents aux harness, prompts et ressources' },
      harnessProfiles: { label: 'Profils de harness', tip: 'Comment chaque harness s\'exécute sans interface' },
      promptTemplates: { label: 'Modèles de prompt', tip: 'Chaque prompt envoyé par Garrison, versionné' },
      mcpServers: { label: 'Serveurs MCP', tip: 'Outils mis à disposition des agents' },
      secrets: { label: 'Secrets', tip: 'Identifiants des harness et des intégrations' },
      workspaces: { label: 'Espaces de travail', tip: 'Comment les espaces de travail des exécutions sont préparés' },
      artifactStores: { label: 'Stockages d\'artefacts', tip: 'Où sont conservés les artefacts des exécutions' },
      modelPrices: { label: "Prix des modèles", tip: "Tarifs en USD configurés par un opérateur pour estimer le coût lorsque le harness ne le fournit pas. Le coût déclaré, même nul, est prioritaire." },
      usageQuotas: { label: "Quotas d’utilisation", tip: "Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement." },
      manifests: { label: 'Manifestes', tip: 'Appliquer et exporter la configuration sous forme de code' },
      requests: { label: 'Historique des requêtes', tip: 'Inspecter le trafic HTTP et les échecs' },
      audit: { label: 'Audit', tip: 'Événements de sécurité et de configuration' },
      explorer: { label: 'Explorateur d\'API', tip: 'Exécuter des appels API en direct' },
      tenants: { label: 'Locataires', tip: 'Gérer les locataires' },
      users: { label: 'Utilisateurs', tip: 'Gérer les utilisateurs' },
      credentials: { label: 'Clés d\'accès', tip: 'Clés d\'accès pour l\'automatisation' },
      roles: { label: 'Rôles', tip: 'Rôles et autorisations' },
      assignments: { label: 'Attributions', tip: 'Attribuer des rôles aux utilisateurs et aux clés d\'accès' },
      settings: { label: 'Paramètres', tip: 'Modifier les paramètres du serveur et du cluster' },
      serverInfo: { label: 'Infos serveur', tip: 'Points de terminaison, version et votre identité' },
      conversations: {
        label: 'Conversations',
        tip: 'Échanges en plusieurs tours avec un agent'
      }
    },
    setup: 'Assistant de configuration',
    setupTip: 'Configurer une clé d\'accès, appliquer un agent d\'exemple et le tester',
    tour: 'Visite guidée',
    tourTip: 'Relancer la visite guidée',
    version: 'Version {{version}}',
    collapseSidebar: 'Afficher ou masquer la navigation',
    skipToContent: 'Aller au contenu'
  },
  login: {
    title: 'Garrison',
    subtitle: 'Connectez-vous au plan de contrôle des agents',
    tabs: { password: 'E-mail et mot de passe', accessKey: 'Clé d\'accès' },
    serverUrl: 'URL du serveur',
    serverInUse: 'Serveur utilisé :',
    useDifferentServer: 'Utiliser un autre serveur',
    useDefaultServer: 'Utiliser le serveur par défaut',
    tenantId: 'ID du locataire',
    email: 'E-mail',
    password: 'Mot de passe',
    accessKey: 'Clé d\'accès',
    secretKey: 'Clé secrète',
    submit: 'Se connecter',
    connecting: 'Connexion...',
    restoring: 'Restauration de votre session...',
    errorGeneric: 'Connexion impossible. Vérifiez vos identifiants et que le serveur est joignable.',
    footerHint: 'Identifiants par défaut : admin@garrison / password dans le locataire default.'
  },
  topbar: {
    server: 'Serveur',
    tenant: 'Locataire',
    switchTenant: 'Changer de locataire',
    copyServer: 'Copier l\'URL du serveur',
    live: 'En direct',
    polling: 'Interrogation',
    liveOn: 'Réception des mises à jour en direct via WebSocket',
    liveOff: 'Mises à jour en direct indisponibles ; les pages s\'actualisent par interrogation périodique',
    health: { healthy: 'Opérationnel', unhealthy: 'Injoignable', unknown: 'Vérification' }
  },
  roles: {
    systemAdmin: 'Administrateur système',
    tenantAdmin: 'Administrateur du locataire',
    user: 'Utilisateur',
    credential: 'Clé d\'accès',
    run: 'Jeton d\'exécution'
  },
  components: {
    fieldWarnings: { title_one: 'Enregistré avec {{count}} valeur ajustée', title_other: 'Enregistré avec {{count}} valeurs ajustées', body: 'Le serveur a accepté la requête, mais n\'a pas enregistré ces valeurs telles qu\'envoyées.', dismiss: 'Masquer', codes: { ValueClamped: 'Valeur ramenée dans la plage autorisée' } },
    approvals: {
      awaiting: 'En attente d\'approbation',
      decideTitle: 'Décider pour {{tool}}',
      decision: 'Décision',
      reason: 'Motif',
      reasonPlaceholder: 'Facultatif. L\'agent et le journal d\'audit le voient.',
      remember: 'Mémoriser comme règle pour ce déploiement',
      rulePattern: 'Motif de règle',
      rememberHint: 'Ajoute au déploiement une règle avec l\'action {{action}}, pour que les appels correspondants soient décidés sans demander. Cela nécessite aussi l\'autorisation de mettre à jour le déploiement.',
      submitAllow: 'Autoriser',
      submitDeny: 'Refuser',
      timeoutThen: 'puis {{decision}}',
      toasts: {
        allowed: '{{tool}} autorisé.',
        denied: '{{tool}} refusé.',
        allowedRemembered: '{{tool}} autorisé et règle {{pattern}} ajoutée.',
        deniedRemembered: '{{tool}} refusé et règle {{pattern}} ajoutée.',
        notPending: 'Cette approbation a déjà été décidée par quelqu\'un d\'autre ou par son délai d\'expiration. La liste affiche maintenant le résultat.',
        forbidden: 'Vous pouvez consulter les approbations, mais pas les décider. Demandez à un administrateur l\'autorisation Approval Update.',
        forbiddenRemember: 'Mémoriser une règle nécessite aussi l\'autorisation de mettre à jour le déploiement. Décidez sans mémoriser, ou demandez Deployment Update.'
      }
    },
    approvalCheck: {
      title: 'Tester un appel d\'outil',
      saveFirst: 'Enregistrez d\'abord le déploiement. Le test vérifie les règles enregistrées sur le serveur.',
      hint: 'Vérifie les règles enregistrées ; enregistrez donc vos modifications avant de les tester. Rien n\'est consigné.',
      toolName: 'Outil',
      inputs: {
        command: 'Commande',
        url: 'URL',
        query: 'Requête de recherche',
        file_path: 'Chemin du fichier',
        notebook_path: 'Chemin du notebook',
        pattern: 'Motif'
      },
      run: 'Vérifier',
      checking: 'Vérification...',
      byRule: '{{action}} par cette règle :',
      byDefault: '{{action}} par la valeur par défaut du déploiement, car aucune règle ne correspond.',
      suggestedRule: 'Règle suggérée :',
      disabled: 'Les approbations sont désactivées pour ce déploiement ; ses exécutions ne demandent donc jamais. Activez-les et enregistrez pour appliquer ces règles.'
    },
    blocked: {
      title: 'En attente d\'un worker',
      body: 'Cette exécution est dans la file d\'attente, mais aucun worker ne peut la prendre pour l\'instant.',
      reasons: {
        NoReadyWorker: 'Aucun nœud worker n\'est prêt. Démarrez un worker ou enregistrez-en un nouveau, et vérifiez sur la page Flotte les nœuds perdus, hors ligne, en drainage ou isolés.',
        NoCapableWorker: 'Des workers sont prêts, mais aucun ne signale le harness {{harness}} comme disponible. Démarrez ou enregistrez un worker sur lequel ce harness est installé, ou vérifiez ses identifiants et les résultats de ses sondes sur la page Flotte.',
        NoMatchingPool: 'Un worker prêt peut exécuter {{harness}}, mais aucun ne correspond au pool de nœuds ni aux sélecteurs de nœuds de ce déploiement. Vérifiez le placement du déploiement ou ajoutez un worker à ce pool.'
      },
      failNote: 'Lorsque le paramètre de cluster Runtime.FailBlockedAfterSeconds est supérieur à 0, une exécution qui reste bloquée aussi longtemps échoue avec le résultat « Aucun nœud worker compatible ».',
      openFleet: 'Ouvrir la flotte',
      openAgent: 'Ouvrir les déploiements de l\'agent',
      homeBanner_one: '{{count}} exécution en file d\'attente ne peut pas démarrer : aucun worker prêt ne peut l\'exécuter.',
      homeBanner_many: '{{count}} exécutions en file d\'attente ne peuvent pas démarrer : aucun worker prêt ne peut les exécuter.',
      homeBanner_other: '{{count}} exécutions en file d\'attente ne peuvent pas démarrer : aucun worker prêt ne peut les exécuter.',
      showRuns: 'Voir les exécutions en file d\'attente',
      queueColumn: 'Bloquées',
      queueCount_one: '{{count}} bloquée',
      queueCount_many: '{{count}} bloquées',
      queueCount_other: '{{count}} bloquées'
    },
    autoRefresh: {
      label: 'Actualisation automatique',
      none: 'Désactivée',
      seconds_one: 'Toutes les {{count}} seconde',
      seconds_other: 'Toutes les {{count}} secondes',
      seconds_many: 'Toutes les {{count}} secondes'
    },
    chart: {
      success: 'Réussite',
      failure: 'Échec',
      total: 'Total',
      avgDuration: 'Durée moyenne',
      noData: 'Aucune activité sur cette période.',
      range: 'Période',
      ranges: { hour: 'Dernière heure', day: 'Dernier jour', week: 'Dernière semaine', month: 'Dernier mois', custom: 'Personnalisée' }
    },
    compilePreview: {
      title: 'Aperçu de la compilation',
      input: 'Entrée d\'exemple',
      compile: 'Compiler',
      compiling: 'Compilation...',
      commandLine: 'Ligne de commande',
      stdin: 'Entrée standard',
      environment: 'Environnement',
      files_one: '{{count}} fichier',
      files_other: '{{count}} fichiers',
      files_many: '{{count}} fichiers'
    },
    confirm: { title: 'Veuillez confirmer', message: 'Voulez-vous vraiment continuer ?' },
    diff: { before: 'Avant', after: 'Après' },
    explainer: { about: 'À propos : {{topic}}', dismiss: 'Masquer cette explication' },
    export: { label: 'Exporter', csv: 'CSV (données)', png: 'Image PNG', svg: 'Image SVG', json: 'JSON (données)', failed: 'Échec de l\'export. {{message}}', tableTitle: 'tableau {{table}}' },
    filters: {
      allTenants: 'Tous les locataires',
      clear: 'Effacer les filtres',
      from: 'Du',
      to: 'Au',
      method: 'Méthode',
      path: 'Le chemin contient',
      pathPlaceholder: 'par exemple /v1.0/api/tenants',
      searchName: 'Rechercher par nom',
      status: 'Code de statut',
      statusPlaceholder: 'par exemple 404',
      tenant: 'Locataire'
    },
    form: {
      addItem: 'Ajouter un élément',
      addRow: 'Ajouter une ligne',
      key: 'Clé',
      value: 'Valeur',
      moveUp: 'Monter',
      moveDown: 'Descendre',
      noItems: 'Aucun élément pour l\'instant.',
      onePerLine: 'Une valeur par ligne',
      steps: 'Étapes du formulaire'
    },
    mcpTest: {
      title: 'Test de connexion MCP',
      testing: 'Connexion et liste des outils...',
      ok: 'Connecté',
      failed: 'Échec',
      tools_one: '{{count}} outil',
      tools_other: '{{count}} outils',
      tools_many: '{{count}} outils'
    },
    permissions: {
      title: 'Autorisations effectives',
      none: 'Aucun droit accordé. Ce principal ne peut utiliser que les règles de contournement, s\'il y en a.',
      source: 'Rôle',
      type: 'Type',
      resources: 'Types de ressources',
      operations: 'Opérations',
      scope: 'Portée'
    },
    requestDetails: {
      title: 'Détails de la requête',
      metadata: 'Métadonnées',
      requestHeaders: 'En-têtes de la requête',
      requestBody: 'Corps de la requête',
      responseHeaders: 'En-têtes de la réponse',
      responseBody: 'Corps de la réponse',
      rawJson: 'JSON brut',
      truncated: 'Tronqué ({{bytes}} octets à l\'origine)',
      empty: 'Aucun contenu.',
      fields: {
        id: 'ID de requête',
        method: 'Méthode',
        path: 'Chemin',
        url: 'URL',
        status: 'Statut',
        duration: 'Durée',
        createdUtc: 'Créée le',
        completedUtc: 'Terminée le',
        sourceIp: 'IP source',
        principal: 'Principal',
        tenant: 'Locataire',
        user: 'Utilisateur'
      }
    },
    secretOnce: {
      title: 'Copiez ce secret maintenant',
      warning: 'C\'est la seule fois que ce secret est affiché. Conservez-le en lieu sûr avant de fermer.',
      accessKey: 'Clé d\'accès',
      secretKey: 'Clé secrète',
      done: 'Je l\'ai enregistré'
    },
    table: {
      bulkActions: 'Actions groupées',
      bulkDelete: 'Supprimer la sélection',
      clearSelection: 'Effacer la sélection',
      empty: 'Aucun enregistrement à afficher.',
      first: 'Première page',
      jump: 'Aller à la page',
      last: 'Dernière page',
      loading: 'Chargement des enregistrements...',
      next: 'Page suivante',
      noMatches: 'Aucun enregistrement ne correspond aux filtres actuels.',
      pageOf: 'Page {{page}} sur {{total}}',
      pageSize: 'Par page',
      pinned: 'Toujours affichée',
      prev: 'Page précédente',
      records_one: 'enregistrement',
      records_other: 'enregistrements',
      records_many: 'enregistrements',
      refresh: 'Actualiser',
      selectAll: 'Sélectionner toutes les lignes de cette page',
      selectColumns: 'Choisir les colonnes',
      selected_one: '{{formattedCount}} sélectionné',
      selected_other: '{{formattedCount}} sélectionnés',
      selected_many: '{{formattedCount}} sélectionnés',
      selectRow: 'Sélectionner la ligne',
      showing: 'Affichage de {{from}} à {{to}}',
      sortBy: 'Trier par {{column}}',
      sortPageOnly: 'Trie uniquement la page actuelle'
    }
  },
  resources: {
    approvals: {
      ...rp('Approbations', 'Appels d\'outil demandés par les agents, décidés par une règle du déploiement, la valeur par défaut du déploiement, une personne ou un délai d\'expiration. Ceux en attente attendent votre décision.', 'Ajouter une approbation', 'Créer une approbation', 'Modifier l\'approbation', 'Détails de l\'approbation', 'Supprimer l\'approbation', 'Aucune approbation pour l\'instant', 'Les approbations apparaissent lorsqu\'un déploiement dont les approbations sont activées demande l\'accord avant un appel d\'outil.'),
      columns: {
        createdUtc: 'Demandée',
        agentName: 'Agent',
        toolName: 'Outil',
        summary: 'Requête',
        status: 'État',
        decision: 'Décision',
        decisionSource: 'Origine',
        decidedBy: 'Décidée par',
        expiresUtc: 'Expiration',
        kind: 'Type',
        harnessType: 'Harness',
        runId: 'Exécution',
        waitMs: 'Attente',
        reason: 'Motif',
        decidedUtc: 'Décidée',
        id: 'ID'
      },
      fields: {
        status: 'État',
        decision: 'Décision',
        decisionSource: 'Origine de la décision',
        decidedBy: 'Décidée par',
        toolName: 'Outil',
        kind: 'Type',
        harnessType: 'Harness',
        agentName: 'Agent',
        runId: 'Exécution',
        rootRunId: 'Exécution racine',
        deploymentId: 'Déploiement',
        leaseEpoch: 'Époque du bail',
        requestedUtc: 'Demandée',
        expiresUtc: 'Expiration',
        decidedUtc: 'Décidée',
        waitMs: 'Durée d\'attente',
        timeoutDecision: 'Décision à l\'expiration du délai',
        toolCallId: 'ID de l\'appel d\'outil',
        reason: 'Motif',
        summary: 'Résumé',
        inputPreview: 'Entrée (masquée)',
        rulePattern: 'Règle correspondante',
        ruleId: 'ID de la règle',
        suggestedRule: 'Règle suggérée',
        rememberedRuleId: 'ID de la règle mémorisée'
      },
      filters: {
        runId: 'ID d\'exécution',
        runIdPlaceholder: 'ID d\'exécution (run_...)'
      },
      actions: {
        allow: 'Autoriser',
        deny: 'Refuser',
        openRun: 'Ouvrir l\'exécution'
      }
    },
    tenants: {
      ...rp('Locataires', 'Espaces isolés, chacun avec ses propres utilisateurs, agents, secrets et exécutions.', 'Ajouter un locataire', 'Créer un locataire', 'Modifier le locataire', 'Détails du locataire', 'Supprimer le locataire', 'Aucun locataire pour l\'instant', 'Créez un locataire pour isoler une équipe ou un client.'),
      columns: { name: 'Nom', id: 'ID', description: 'Description', active: 'Actif', createdUtc: 'Créé le' },
      fields: { name: 'Nom', description: 'Description', active: 'Actif' }
    },
    users: {
      ...rp('Utilisateurs', 'Personnes qui se connectent à ce locataire avec un e-mail et un mot de passe.', 'Ajouter un utilisateur', 'Créer un utilisateur', 'Modifier l\'utilisateur', 'Détails de l\'utilisateur', 'Supprimer l\'utilisateur', 'Aucun utilisateur pour l\'instant', 'Ajoutez un utilisateur pour qu\'une personne puisse se connecter à ce locataire.'),
      columns: { email: 'E-mail', name: 'Nom', id: 'ID', role: 'Rôle', active: 'Actif', createdUtc: 'Créé le' },
      fields: { email: 'E-mail', password: 'Mot de passe', firstName: 'Prénom', lastName: 'Nom', isTenantAdmin: 'Administrateur du locataire', isAdmin: 'Administrateur système', active: 'Actif' },
      hints: { isAdmin: 'Les administrateurs système peuvent gérer tous les locataires et contournent toutes les autorisations.', password: 'Laissez vide lors de la modification pour conserver le mot de passe actuel.' },
      actions: { permissions: 'Autorisations effectives' }
    },
    credentials: {
      ...rp('Clés d\'accès', 'Clés d\'accès utilisées par l\'automatisation, les SDK et les intégrations. Les secrets ne sont affichés qu\'une fois.', 'Ajouter une clé d\'accès', 'Créer une clé d\'accès', 'Modifier la clé d\'accès', 'Détails de la clé d\'accès', 'Supprimer la clé d\'accès', 'Aucune clé d\'accès pour l\'instant', 'Créez une clé d\'accès pour qu\'un script ou un service puisse appeler Garrison.'),
      columns: { name: 'Nom', accessKey: 'Clé d\'accès', secretKeyLast4: 'Secret', userId: 'Propriétaire', lastUsedUtc: 'Dernière utilisation', expiresUtc: 'Expiration', active: 'Active', id: 'ID' },
      fields: { name: 'Nom', userId: 'Propriétaire', authMode: 'Mode d\'authentification', expiresUtc: 'Expiration', active: 'Active' },
      hints: { userId: 'Une clé d\'accès ne peut jamais dépasser les autorisations de son propriétaire.' },
      actions: { rotate: 'Renouveler le secret' }
    },
    roles: {
      ...rp('Rôles', 'Les rôles regroupent des autorisations. Les rôles intégrés sont en lecture seule ; clonez-en un pour le personnaliser.', 'Ajouter un rôle', 'Créer un rôle', 'Modifier le rôle', 'Détails du rôle', 'Supprimer le rôle', 'Aucun rôle pour l\'instant', 'Créez un rôle personnalisé ou clonez un rôle intégré.'),
      columns: { name: 'Nom', description: 'Description', isBuiltIn: 'Type', active: 'Actif', id: 'ID', createdUtc: 'Créé le' },
      fields: { name: 'Nom', description: 'Description', active: 'Actif' }
    },
    permissions: {
      ...rp('Autorisations', 'Autorisez ou refusez des opérations sur des types de ressources. Le refus l\'emporte toujours.', 'Ajouter une autorisation', 'Créer une autorisation', 'Modifier l\'autorisation', 'Détails de l\'autorisation', 'Supprimer l\'autorisation', 'Aucune autorisation pour l\'instant', 'Créez une autorisation et associez-la à un rôle.'),
      columns: { name: 'Nom', permissionType: 'Type', resourceTypes: 'Types de ressources', operationTypes: 'Opérations', isBuiltIn: 'Origine', id: 'ID' },
      fields: { name: 'Nom', permissionType: 'Type', resourceTypes: 'Types de ressources', operationTypes: 'Opérations', active: 'Active' }
    },
    userAssignments: {
      ...rp('Attributions aux utilisateurs', 'Attribuez des rôles aux utilisateurs au niveau du locataire ou d\'une ressource.', 'Ajouter une attribution', 'Créer une attribution', 'Modifier l\'attribution', 'Détails de l\'attribution', 'Supprimer l\'attribution', 'Aucune attribution aux utilisateurs pour l\'instant', 'Attribuez un rôle à un utilisateur.'),
      columns: { userId: 'Utilisateur', roleName: 'Rôle', resourceScope: 'Portée', resourceId: 'Ressource', active: 'Active', createdUtc: 'Créée le', id: 'ID' },
      fields: { userId: 'Utilisateur', roleId: 'Rôle', resourceScope: 'Portée', resourceId: 'ID de ressource', inheritsToChildren: 'S\'applique aux ressources du locataire', active: 'Active' }
    },
    credentialAssignments: {
      ...rp('Attributions aux clés d\'accès', 'Attribuez des rôles aux clés d\'accès. Accordez aux clés moins de droits qu\'à leurs propriétaires.', 'Ajouter une attribution', 'Créer une attribution', 'Modifier l\'attribution', 'Détails de l\'attribution', 'Supprimer l\'attribution', 'Aucune attribution aux clés d\'accès pour l\'instant', 'Attribuez un rôle à une clé d\'accès.'),
      columns: { credentialId: 'Clé d\'accès', roleName: 'Rôle', resourceScope: 'Portée', resourceId: 'Ressource', active: 'Active', createdUtc: 'Créée le', id: 'ID' },
      fields: { credentialId: 'Clé d\'accès', roleId: 'Rôle', resourceScope: 'Portée', resourceId: 'ID de ressource', inheritsToChildren: 'S\'applique aux ressources du locataire', active: 'Active' }
    },
    harnessProfiles: {
      ...rp('Profils de harness', 'Décrivez précisément comment un harness s\'exécute sans interface : exécutable, arguments, environnement, fichiers et analyse de la sortie.', 'Ajouter un profil de harness', 'Créer un profil de harness', 'Modifier le profil de harness', 'Détails du profil de harness', 'Supprimer le profil de harness', 'Aucun profil de harness pour l\'instant', 'Clonez un profil intégré pour personnaliser le lancement d\'un harness.'),
      steps: { basics: 'Général', invocation: 'Invocation', output: 'Sortie', limits: 'Limites' },
      columns: { name: 'Nom', harnessType: 'Harness', executable: 'Exécutable', outputParser: 'Analyseur', isBuiltIn: 'Origine', id: 'ID', createdUtc: 'Créé le' },
      fields: {
        name: 'Nom',
        description: 'Description',
        harnessType: 'Type de harness',
        executable: 'Exécutable',
        probeArguments: 'Arguments de détection de version',
        active: 'Actif',
        arguments: 'Arguments',
        argTemplate: 'Modèle',
        argCondition: 'Condition',
        argRepeatOver: 'Répéter pour chaque',
        promptDelivery: 'Transmission du prompt',
        promptArgumentTemplate: 'Argument ou nom de fichier du prompt',
        systemPromptDelivery: 'Transmission du prompt système',
        systemPromptTarget: 'Cible du prompt système',
        mcpConfigFormat: 'Format de configuration MCP',
        mcpConfigFileName: 'Nom du fichier de configuration MCP',
        environment: 'Environnement',
        envName: 'Nom',
        envValue: 'Modèle de valeur',
        isSecret: 'Secret',
        files: 'Fichiers',
        fileBase: 'Répertoire de base',
        filePath: 'Chemin',
        fileContent: 'Modèle de contenu',
        fileMode: 'Mode',
        credentialEnvironmentAllowlist: 'Variables d\'identifiants autorisées',
        outputParser: 'Analyseur de sortie',
        genericTextField: 'Chemin du champ texte',
        genericFinalField: 'Chemin du champ de résultat final',
        genericSuccessField: 'Chemin du champ de réussite',
        genericSuccessValue: 'Valeur de réussite',
        resultSource: 'Source du résultat',
        resultFileName: 'Nom du fichier de résultat',
        successPolicy: 'Règle de réussite',
        successExitCodes: 'Codes de sortie de réussite',
        defaultTimeoutSeconds: 'Délai d\'expiration par défaut (secondes)',
        killGraceSeconds: 'Délai de grâce avant arrêt forcé (secondes)',
        maxOutputBytes: 'Sortie maximale (octets)',
        stderrTailBytes: 'Fin de Stderr conservée (octets)',
        isolateHome: 'Isoler HOME pour chaque exécution',
        supportsResume: 'Prend en charge la reprise de session'
      },
      hints: {
        arguments: 'Chaque modèle produit un argument. Si la condition produit une valeur vide ou false, l\'argument est ignoré.',
        executable: 'Nom de commande présent dans le PATH du worker, ou chemin absolu.',
        environment: 'Référencez les secrets liés avec {{secret.alias}}. L\'environnement du processus démarre vide, à l\'exception de la liste d\'autorisation.',
        successPolicy: 'Par défaut, Garrison détermine la réussite à partir du dernier événement de l\'analyseur, et non du code de sortie.'
      },
      errors: { reservedPrefix: 'Le préfixe builtin/ est réservé.' }
    },
    promptTemplates: {
      deleteBound_many: '« {{name}} » est lié à {{count}} déploiements ; le serveur refusera donc de le supprimer. Retirez d\'abord les liaisons de ces déploiements :',
      deleteBound_other: '« {{name}} » est lié à {{count}} déploiements ; le serveur refusera donc de le supprimer. Retirez d\'abord les liaisons de ces déploiements :',
      deleteBound_one: '« {{name}} » est lié à {{count}} déploiement ; le serveur refusera donc de le supprimer. Retirez d\'abord la liaison de ce déploiement :',
      deleteUnbound: 'Supprimer « {{name}} » et toutes ses versions ? Aucun déploiement ne le lie. Cette action est irréversible.',
      ...rp('Modèles de prompt', 'Chaque prompt et fichier de configuration générés par Garrison. Chaque enregistrement crée une version.', 'Ajouter un modèle', 'Créer un modèle', 'Modifier le modèle', 'Détails du modèle', 'Supprimer le modèle', 'Aucun modèle de prompt pour l\'instant', 'Créez un modèle ou clonez un modèle intégré.'),
      add: 'Nouveau modèle',
      columns: { name: 'Nom', kind: 'Type', currentVersion: 'Version', description: 'Description', isBuiltIn: 'Origine', id: 'ID', lastUpdateUtc: 'Mis à jour le' },
      fields: { name: 'Nom', kind: 'Type', description: 'Description' }
    },
    mcpServers: {
      ...rp('Serveurs MCP', 'Serveurs MCP utilisables par les agents. Les en-têtes et l\'environnement peuvent référencer des secrets.', 'Ajouter un serveur MCP', 'Créer un serveur MCP', 'Modifier le serveur MCP', 'Détails du serveur MCP', 'Supprimer le serveur MCP', 'Aucun serveur MCP pour l\'instant', 'Enregistrez un serveur MCP pour que les déploiements puissent le lier.'),
      columns: { name: 'Nom', transport: 'Transport', endpoint: 'Point de terminaison', required: 'Obligatoire', active: 'Actif', id: 'ID', createdUtc: 'Créé le' },
      fields: {
        name: 'Nom',
        transport: 'Transport',
        description: 'Description',
        url: 'URL de base',
        path: 'Chemin MCP',
        headers: 'En-têtes',
        headerName: 'Nom',
        headerValue: 'Modèle de valeur',
        command: 'Commande',
        arguments: 'Arguments',
        environment: 'Environnement',
        requiredTools: 'Outils requis',
        toolTimeoutSeconds: 'Délai d\'expiration des outils (secondes)',
        required: 'Faire échouer l\'exécution s\'il est injoignable',
        active: 'Actif'
      },
      hints: { requiredTools: 'La vérification préalable fait échouer l\'exécution avant son lancement si un outil listé est absent.' },
      actions: { test: 'Tester la connexion' }
    },
    secrets: {
      errors: { expiryPast: 'Choisissez une expiration dans le futur, ou laissez le champ vide pour que le secret n\'expire jamais.' },
      ...rp('Secrets', 'Identifiants chiffrés pour les harness et les intégrations. Les valeurs sont en écriture seule.', 'Ajouter un secret', 'Créer un secret', 'Modifier le secret', 'Détails du secret', 'Supprimer le secret', 'Aucun secret pour l\'instant', 'Ajoutez la clé API ou le jeton dont vos agents ont besoin, par exemple une clé API Anthropic.'),
      notSet: 'Non défini',
      neverRefreshed: 'Pas encore',
      reauth: { title: 'Cette connexion doit être renouvelée', since: 'Depuis {{time}}', action: 'Les exécutions qui utilisent ce secret échouent tant que vous n\'avez pas remplacé sa valeur. Reconnectez-vous avec codex login en utilisant un CODEX_HOME distinct, puis enregistrez le nouveau auth.json avec « Définir la valeur », ou passez le déploiement à un secret de clé d\'API OpenAI. Ne continuez pas à utiliser la même connexion sur une autre machine : les deux copies partagent un même jeton d\'actualisation.' },
      columns: { status: 'État', accessTokenExpiresUtc: 'Expiration du jeton d\'accès', name: 'Nom', kind: 'Type', valueLast4: 'Valeur', rotatedUtc: 'Dernière modification', expiresUtc: 'Expiration', active: 'Actif', id: 'ID' },
      fields: { refreshedUtc: 'Dernier renouvellement par Garrison', accessTokenExpiresUtc: 'Expiration du jeton d\'accès', name: 'Nom', kind: 'Type', description: 'Description', value: 'Valeur', newValue: 'Nouvelle valeur', expiresUtc: 'Expiration', active: 'Actif' },
      hints: { expiresUtc: 'Doit être dans le futur. Laissez vide pour un secret sans expiration.', kind: 'Les jetons d\'abonnement utilisés sur des serveurs partagés peuvent enfreindre les conditions du fournisseur. Privilégiez les clés API pour les déploiements partagés.' },
      actions: { setValue: 'Définir la valeur', rotate: 'Renouveler' }
    },
    workspaces: {
      ...rp('Espaces de travail', 'Comment l\'espace de travail d\'une exécution est préparé : vide, cloné depuis Git ou prérempli de fichiers.', 'Ajouter un modèle d\'espace de travail', 'Créer un modèle d\'espace de travail', 'Modifier le modèle d\'espace de travail', 'Détails du modèle d\'espace de travail', 'Supprimer le modèle d\'espace de travail', 'Aucun espace de travail pour l\'instant', 'Créez un modèle d\'espace de travail pour que les déploiements partent d\'un dépôt ou de fichiers.'),
      columns: { name: 'Nom', kind: 'Type', gitUrl: 'Dépôt', retention: 'Conservation', active: 'Actif', id: 'ID', createdUtc: 'Créé le' },
      fields: { name: 'Nom', kind: 'Type', description: 'Description', gitUrl: 'URL du dépôt', gitRef: 'Branche, tag ou commit', gitDepth: 'Profondeur du clonage', gitCredentialSecretId: 'Identifiants Git', persistentVolumeClaim: 'Nom du PersistentVolumeClaim', files: 'Fichiers', filePath: 'Chemin', fileContent: 'Contenu', retention: 'Conservation', active: 'Actif' },
      hints: { persistentVolumeClaim: 'Un claim existant dans l\'espace de noms d\'exécution. Seuls les déploiements avec l\'exécuteur Job Kubernetes peuvent utiliser cet espace de travail ; son contenu est conservé d\'une exécution à l\'autre.' },
      errors: { claimName: 'Utilisez des minuscules, des chiffres, des tirets et des points, en commençant et en finissant par une lettre ou un chiffre.' }
    },
    modelPrices: {
      ...{"title": "Prix des modèles", "subtitle": "Tarifs en USD configurés par un opérateur pour estimer le coût lorsque le harness ne le fournit pas. Le coût déclaré, même nul, est prioritaire.", "add": "Ajouter un prix de modèle", "create": "Créer un prix de modèle", "edit": "Modifier le prix du modèle", "view": "Détails du prix du modèle", "deleteTitle": "Supprimer le prix du modèle", "emptyTitle": "Aucun prix de modèle", "emptyBody": "Ajoutez un prix pour un harness et un modèle servi précis. Aucun tarif fournisseur n’est préchargé."},
      columns: {"name": "Nom", "active": "Actif", "id": "ID", "createdUtc": "Créé le", "model": "Modèle servi", "harnessType": "Harness", "inputUsdPerMillion": "Entrée USD / million de jetons", "outputUsdPerMillion": "Sortie USD / million de jetons"},
      fields: {"name": "Nom", "description": "Description", "active": "Actif", "model": "Modèle servi", "harnessType": "Harness", "inputUsdPerMillion": "Entrée USD / million de jetons", "outputUsdPerMillion": "Sortie USD / million de jetons", "cachedInputUsdPerMillion": "Entrée en cache USD / million de jetons", "reasoningUsdPerMillion": "Raisonnement USD / million de jetons", "inputIncludesCachedTokens": "L’entrée inclut les jetons en cache", "outputIncludesReasoningTokens": "La sortie inclut les jetons de raisonnement"},
      hints: {"cachedInputUsdPerMillion": "Laissez vide pour utiliser le tarif d’entrée ou de sortie correspondant. Zéro signifie gratuit.", "reasoningUsdPerMillion": "Laissez vide pour utiliser le tarif d’entrée ou de sortie correspondant. Zéro signifie gratuit.", "inputIncludesCachedTokens": "Activez si l’entrée inclut les jetons en cache. Désactivez pour Claude Code, qui déclare séparément les lectures du cache.", "outputIncludesReasoningTokens": "Activez si la sortie inclut les jetons de raisonnement. Les sous-totaux inclus sont déduits avant l’application de leur tarif distinct."},
      errors: {"rate": "Saisissez un tarif fini entre 0 et 1 000 000 000. Zéro est valide.", "model": "Saisissez le nom exact du modèle, de 1 à 256 caractères sans caractères de contrôle."}
    },
    usageQuotas: {"title": "Quotas d’utilisation", "subtitle": "Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "add": "Ajouter un quota d’utilisation", "create": "Créer un quota d’utilisation", "edit": "Modifier un quota d’utilisation", "view": "Détails du quota d’utilisation", "deleteTitle": "Supprimer un quota d’utilisation", "emptyTitle": "Aucun quota d’utilisation", "emptyBody": "Ajoutez un quota pour un locataire, agent ou déploiement. Les limites vides sont illimitées.", "columns": {"name": "Nom", "active": "Actif", "id": "ID", "createdUtc": "Créé le", "scope": "Portée", "resourceId": "Ressource cible", "dailyRunLimit": "Exécutions par jour UTC", "dailyTokenLimit": "Jetons par jour UTC", "dailyCostUsdLimit": "USD connus par jour UTC", "maxConcurrentRuns": "Maximum d’exécutions actives", "enforcementEnabled": "Appliquer les limites"}, "fields": {"name": "Nom", "description": "Description", "active": "Actif", "scope": "Portée", "resourceId": "Ressource cible", "dailyRunLimit": "Exécutions par jour UTC", "dailyTokenLimit": "Jetons par jour UTC", "dailyCostUsdLimit": "USD connus par jour UTC", "maxConcurrentRuns": "Maximum d’exécutions actives", "enforcementEnabled": "Appliquer les limites"}, "hints": {"dailyRunLimit": "Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives. Les limites ne s’appliquent que si leur application est activée.", "dailyTokenLimit": "Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives. Les limites ne s’appliquent que si leur application est activée.", "dailyCostUsdLimit": "Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives. Les limites ne s’appliquent que si leur application est activée.", "maxConcurrentRuns": "Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives. Les limites ne s’appliquent que si leur application est activée.", "resourceId": "Ajoutez un quota pour un locataire, agent ou déploiement. Les limites vides sont illimitées.", "enforcementEnabled": "Désactivé par défaut. Activez pour refuser les exécutions aux limites configurées et réduire les budgets compatibles. Sinon, seul le suivi est effectué."}, "errors": {"limit": "Saisissez une limite positive ou nulle dans la plage du champ. Les nombres doivent être entiers."}, "incomplete": "Le suivi des coûts est incomplet : {{count}} exécutions terminées n’ont aucun coût déclaré ou estimé. Les limites ne s’appliquent que si leur application est activée ; un coût manquant seul ne bloque pas l’admission.", "actions": {"usage": "Usage quotidien"}, "usage": {"windowStartUtc": "Début de période (UTC)", "windowEndUtc": "Réinitialisation quotidienne (UTC)", "runsUsed": "Exécutions admises", "tokensUsed": "Jetons terminés", "costUsd": "Coût connu (USD)", "unknownCostRuns": "Exécutions sans coût", "activeRuns": "Exécutions actives"}},
    artifactStores: {
      ...rp('Stockages d\'artefacts', 'Où sont conservés les fichiers produits par les exécutions.', 'Ajouter un stockage d\'artefacts', 'Créer un stockage d\'artefacts', 'Modifier le stockage d\'artefacts', 'Détails du stockage d\'artefacts', 'Supprimer le stockage d\'artefacts', 'Aucun stockage d\'artefacts pour l\'instant', 'Créez un stockage d\'artefacts pour conserver les sorties des exécutions.'),
      columns: { name: 'Nom', kind: 'Type', description: 'Description', active: 'Actif', id: 'ID', createdUtc: 'Créé le' },
      fields: { name: 'Nom', kind: 'Type', description: 'Description', active: 'Actif' }
    },
    agents: {
      deleteWithDeployments_many: 'Supprimer « {{name}} » et ses {{count}} déploiements ? Les déploiements ci-dessous sont supprimés aussi. Cette action est irréversible.',
      deleteWithDeployments_other: 'Supprimer « {{name}} » et ses {{count}} déploiements ? Les déploiements ci-dessous sont supprimés aussi. Cette action est irréversible.',
      deleteWithDeployments_one: 'Supprimer « {{name}} » et son {{count}} déploiement ? Le déploiement ci-dessous est supprimé aussi. Cette action est irréversible.',
      deleteNoDeployments: 'Supprimer « {{name}} » ? Il n\'a aucun déploiement. Cette action est irréversible.',
      ...rp('Agents', 'Capacités nommées exposées via REST, MCP et A2A. Les déploiements déterminent leur mode d\'exécution.', 'Ajouter un agent', 'Créer un agent', 'Modifier l\'agent', 'Détails de l\'agent', 'Supprimer l\'agent', 'Aucun agent pour l\'instant', 'Ajoutez un agent ou appliquez le manifeste d\'exemple depuis Configuration > Manifestes.'),
      sections: { identity: 'Identité', exposure: 'Exposition', io: 'Entrée et sortie', delegation: 'Délégation' },
      columns: { name: 'Nom', displayName: 'Nom d\'affichage', kind: 'Type', exposure: 'Exposition', delegationMode: 'Délégation', tags: 'Tags', active: 'Actif', id: 'ID', createdUtc: 'Créé le' },
      fields: {
        name: 'Nom',
        displayName: 'Nom d\'affichage',
        description: 'Description',
        kind: 'Type',
        agentVersion: 'Version',
        tags: 'Tags',
        remoteProtocol: 'Protocole distant',
        remoteEndpointUrl: 'URL du point de terminaison distant',
        exposeA2A: 'Exposer via A2A',
        exposeMcpTool: 'Exposer comme outil MCP dédié',
        mcpToolName: 'Nom de l\'outil MCP',
        skills: 'Compétences A2A',
        skillId: 'ID de compétence',
        skillName: 'Nom',
        skillDescription: 'Description',
        inputMode: 'Mode d\'entrée',
        inputSchema: 'JSON Schema d\'entrée',
        outputSchema: 'JSON Schema de sortie',
        delegationMode: 'Délégation',
        delegationAllowList: 'Agents qu\'il peut appeler',
        delegationMaxDepth: 'Profondeur maximale',
        delegationAllowRecursion: 'Autoriser la récursion',
        active: 'Actif'
      },
      hints: { name: 'Lettres minuscules, chiffres et traits d\'union. Utilisé dans les URL et les cartes A2A.' },
      errors: { dnsName: 'Utilisez des lettres minuscules, des chiffres et des traits d\'union, en commençant et en terminant par une lettre ou un chiffre.' }
    },
    deployments: {
      approvalsOn_one: 'Activées, {{count}} règle',
      approvalsOn_other: 'Activées, {{count}} règles',
      approvalsOn_many: 'Activées, {{count}} règles',
      approvalsOff: 'Désactivées',
      promptRoles: { Repair: 'Réparation de sortie structurée', DelegatedTask: 'Enveloppe de tâche pour les exécutions déléguées', Task: 'Enveloppe de tâche', System: 'Prompt système', ConversationFallback: 'Reconstruction de conversation (transcription)' },
      ...rp('Déploiements', 'Liez un agent à un profil de harness, des prompts, des secrets, des serveurs MCP, un placement et des limites.', 'Ajouter un déploiement', 'Créer un déploiement', 'Modifier le déploiement', 'Détails du déploiement', 'Supprimer le déploiement', 'Aucun déploiement pour l\'instant', 'Créez un déploiement pour rendre un agent exécutable.'),
      steps: { approvals: 'Approbations', basics: 'Général', harness: 'Harness', prompts: 'Prompts', resources: 'Ressources', overrides: 'Remplacements', placement: 'Placement et limites' },
      columns: { approvalsEnabled: 'Approbations', name: 'Nom', agentId: 'Agent', harnessProfileId: 'Profil de harness', model: 'Modèle', executor: 'Exécuteur', weight: 'Poids', configVersion: 'Version de configuration', active: 'Actif', id: 'ID', createdUtc: 'Créé le' },
      fields: {
        approvalsEnabled: 'Demander avant les appels d\'outil (approbations)',
        approvalDefaultAction: 'Si aucune règle ne correspond',
        approvalTimeoutSeconds: 'Délai d\'approbation (secondes)',
        approvalTimeoutDecision: 'Décision si personne ne répond',
        approvalRules: 'Règles d\'approbation',
        ruleAction: 'Action de la règle',
        rulePattern: 'Règle',
        ruleInputPattern: 'Motif d\'entrée',
        ruleDescription: 'Description',
        approvalTest: 'Tester un appel d\'outil',
        name: 'Nom',
        agentId: 'Agent',
        description: 'Description',
        weight: 'Poids du trafic',
        active: 'Actif',
        harnessProfileId: 'Profil de harness',
        model: 'Modèle',
        fallbackModel: 'Modèle de repli',
        effort: 'Effort',
        maxTurns: 'Nombre maximal de tours',
        maxBudgetUsd: 'Budget maximal (USD)',
        parameters: 'Paramètres',
        paramName: 'Nom',
        paramValue: 'Valeur',
        promptBindings: 'Liaisons de prompts',
        promptRole: 'Rôle',
        template: 'Modèle',
        pinnedVersion: 'Version épinglée',
        resourceBindings: 'Liaisons de ressources',
        bindingKind: 'Type',
        alias: 'Alias',
        resource: 'Ressource',
        workspaceTemplateId: 'Modèle d\'espace de travail',
        artifactStoreId: 'Stockage d\'artefacts',
        argumentOverrides: 'Remplacements d\'arguments',
        operation: 'Opération',
        match: 'Correspondance',
        argTemplate: 'Modèle',
        condition: 'Condition',
        environmentOverrides: 'Remplacements d\'environnement',
        envName: 'Nom',
        envValue: 'Modèle de valeur',
        isSecret: 'Secret',
        fileOverrides: 'Remplacements de fichiers',
        allowedRunOverrides: 'Remplacements par exécution autorisés pour les appelants',
        validation: 'Validation',
        pattern: 'Motif ou valeurs',
        nodePoolId: 'Pool de nœuds',
        nodeSelector: 'Sélecteur de nœuds',
        maxConcurrentRuns: 'Nombre maximal d\'exécutions simultanées',
        timeoutSeconds: 'Délai d\'expiration (secondes)',
        maxAttempts: 'Nombre maximal de tentatives',
        repetitionGuard: 'Garde de répétition',
        maxAssistantChars: 'Nombre maximal de caractères de l\'assistant',
        noProgressSeconds: 'Délai sans progression (secondes)',
        executor: 'Exécuteur',
        podCpuRequest: 'Demande de CPU',
        podCpuLimit: 'Limite de CPU',
        podMemoryRequest: 'Demande de mémoire',
        podMemoryLimit: 'Limite de mémoire',
        podEphemeralStorageRequest: 'Demande de stockage éphémère',
        podEphemeralStorageLimit: 'Limite de stockage éphémère'
      },
      hints: {
        approvalsEnabled: 'Fonctionne avec les profils Claude Code et les profils qui utilisent l\'app-server Codex. Les autres harness n\'ont pas de point d\'accroche d\'approbation ; le serveur refuse donc ce paramètre pour eux.',
        approvalDefaultAction: 'Demander à une personne attend dans la boîte de réception Approbations jusqu\'à ce que quelqu\'un décide ou que le délai expire.',
        approvalTimeoutSeconds: 'De 10 à 3 600 secondes. Vide : 300 secondes.',
        approvalRules: 'Refuser l\'emporte sur Demander, et Demander sur Autoriser. Exemples : Bash(npm test), Bash(npm run *), Edit(src/**), WebFetch(domain:example.com), mcp__github__*.',
        secretsKinds: 'Le profil de harness {{profile}} a besoin d\'un secret de type {{kinds}}. Liez-en un sous n\'importe quel alias.',
        secretsAliases: 'Le profil de harness {{profile}} lit les secrets liés sous ces alias : {{aliases}}.',
        secretsNone: 'Le profil de harness {{profile}} ne lit aucun secret ; aucune liaison de secret n\'est donc nécessaire.',
        promptBindings: 'Associez les rôles de prompt (System, Task, DelegatedTask et tout rôle utilisé par le profil de harness) à des modèles. Laissez la version vide pour suivre la plus récente.',
        resourceBindings: 'Les alias deviennent des variables de modèle, par exemple {{secret.anthropic}}.',
        weight: 'Les requêtes sans déploiement explicite sont réparties entre les déploiements actifs selon leur poids.',
        maxConcurrentRuns: '0 signifie illimité.',
        timeoutCap: 'Le paramètre du cluster {{setting}} limite chaque exécution à {{value}} secondes.',
        zeroUnlimited: '0 signifie illimité.',
        zeroOff: '0 désactive la garde.',
        guardDefault: 'Vide utilise la valeur du cluster, {{value}}, de {{setting}}.',
        guardDefaultUnknown: 'Vide utilise le paramètre du cluster {{setting}}.',
        guardOwn: 'Défini sur ce déploiement. La valeur du cluster ({{setting}}) est {{value}}.',
        guardOwnUnknown: 'Défini sur ce déploiement au lieu du paramètre du cluster {{setting}}.',
        guardFollowing: 'Suit la valeur du cluster, {{value}}, de {{setting}}.',
        executorInherit: 'Vide utilise la valeur par défaut du pool de nœuds : {{executor}}.',
        executorSet: 'Processus exécute le harness dans le worker ; Job Kubernetes l\'exécute dans son propre pod.',
        podCpuRequest: 'Les ressources du pod ne s\'appliquent qu\'aux exécutions Job Kubernetes. Utilisez des quantités Kubernetes comme 500m, 2, 512Mi ou 4Gi ; vide utilise la valeur par défaut du worker.'
      },
      actions: { addRule: 'Ajouter une règle', compilePreview: 'Aperçu de la compilation', test: 'Tester l\'invocation', useClusterDefault: 'Utiliser la valeur du cluster' },
      sections: {
        guards: 'Gardes d\'exécution',
        execution: 'Exécuteur et ressources du pod'
      },
      placeholders: {
        ruleInputPattern: 'Expression régulière facultative sur le JSON d\'entrée',
        clusterDefault: 'Valeur du cluster ({{value}})',
        clusterDefaultUnknown: 'Valeur du cluster'
      },
      executorInherit: 'Valeur par défaut du pool de nœuds',
      executorInheritShort: 'Défaut du pool',
      errors: { rulePatternRequired: 'Saisissez un motif de règle.', rulePatternOneLine: 'Un motif de règle doit tenir sur une seule ligne.', rulePatternTooLong: 'Un motif de règle peut comporter au maximum 1 000 caractères.', tooManyRules: 'Un déploiement peut avoir au maximum 500 règles d\'approbation.', approvalTimeout: 'Saisissez un nombre entier de secondes entre 10 et 3 600.', quantity: 'Utilisez une quantité Kubernetes comme 500m, 2, 512Mi ou 4Gi.' },
      guardStates: {
        on: 'activée',
        off: 'désactivée'
      }
    },
    nodePools: {
      ...rp('Pools de nœuds', 'Regroupez les nœuds worker par étiquette et réservez-les éventuellement à des locataires.', 'Ajouter un pool de nœuds', 'Créer un pool de nœuds', 'Modifier le pool de nœuds', 'Détails du pool de nœuds', 'Supprimer le pool de nœuds', 'Aucun pool de nœuds pour l\'instant', 'Créez un pool de nœuds pour réserver de la capacité.'),
      allTenants: 'Tous les locataires',
      columns: { name: 'Nom', description: 'Description', tenants: 'Locataires', defaultExecutor: 'Exécuteur par défaut', active: 'Actif', id: 'ID', createdUtc: 'Créé le' },
      fields: { name: 'Nom', description: 'Description', defaultExecutor: 'Exécuteur par défaut', tenants: 'ID des locataires autorisés', active: 'Actif' },
      hints: { tenants: 'Laissez vide pour autoriser tous les locataires.' }
    },
    runs: {
      ...rp('Exécutions', 'Chaque invocation d\'agent avec son statut, son nœud, sa durée et son résultat.', 'Ajouter une exécution', 'Créer une exécution', 'Modifier l\'exécution', 'Détails de l\'exécution', 'Supprimer l\'exécution', 'Aucune exécution pour l\'instant', 'Invoquez un agent pour lancer une exécution.'),
      columns: {
        approvalWaitMs: 'Attente d\'approbation',
        delegationWaitMs: 'Attente de délégation',
        timeToFirstTokenExcludingDelegationMs: 'TTFT hors délégation',
        id: 'Exécution',
        agentName: 'Agent',
        status: 'Statut',
        outcome: 'Résultat',
        harnessType: 'Harness',
        leaseNodeName: 'Nœud',
        timeToFirstTokenMs: 'TTFT',
        streamingMs: 'Streaming',
        executionMs: 'Durée',
        queueMs: 'Temps en file d\'attente',
        totalMs: 'Temps total',
        inputTokens: 'Jetons d\'entrée',
        outputTokens: 'Jetons de sortie',
        cachedTokens: 'Jetons en cache',
        reasoningTokens: 'Jetons de raisonnement',
        outputTokensPerSecond: 'Jetons/s',
        costUsd: 'Coût',
        toolCallCount: 'Appels d\'outils',
        depth: 'Profondeur',
        createdUtc: 'Créée le',
        conversationId: 'Conversation'
      },
      actions: { cancel: 'Annuler l\'exécution', retry: 'Relancer l\'exécution' },
      toasts: { cancelRequested: 'Annulation demandée.', retried: 'Nouvelle tentative lancée.' },
      turn: 'tour {{turn}}'
    },
    nodes: {
      ...rp('Nœuds', 'Nœuds worker qui prennent à bail et exécutent les exécutions. Isolez ou drainez un nœud avant une maintenance.', 'Ajouter un nœud', 'Créer un nœud', 'Modifier le nœud', 'Détails du nœud', 'Supprimer le nœud', 'Aucun nœud pour l\'instant', 'Les nœuds worker s\'enregistrent eux-mêmes au démarrage. Déployez le StatefulSet worker ou lancez Garrison.Worker en local.'),
      columns: { name: 'Nom', status: 'Statut', capacity: 'Exécutions', harnesses: 'Harness', executors: 'Exécuteurs', containerized: 'Conteneurisé', labels: 'Étiquettes', nodeVersion: 'Version', lastHeartbeatUtc: 'Dernier signal de vie', id: 'ID' },
      fields: { address: 'Adresse', maxConcurrentRuns: 'Capacité', childReserveSlots: 'Réserve pour les enfants', maxResidentWaiters: 'Exécutions en attente au maximum', activeRuns: 'Exécutions actives', capabilities: 'Capacités', detectedVersion: 'Version', available: 'Disponible', detail: 'Détail' },
      actions: { cordon: 'Isoler', uncordon: 'Réintégrer', drain: 'Drainer', runs: 'Voir les exécutions', grafana: 'Ouvrir dans Grafana' },
      toasts: { cordoned: 'Nœud isolé.', uncordoned: 'Nœud réintégré.', draining: 'Drainage du nœud en cours.' }
    },
    controlNodes: {
      ...rp('Plan de contrôle', 'Réplicas du serveur qui servent l\'API, MCP et A2A et planifient les exécutions. Chacun s\'enregistre lui-même et envoie un signal de vie toutes les 5 secondes.', 'Ajouter un nœud de contrôle', 'Créer un nœud de contrôle', 'Modifier le nœud de contrôle', 'Détails du nœud de contrôle', 'Supprimer le nœud de contrôle', 'Aucun nœud de contrôle signalé', 'Les nœuds de contrôle apparaissent quand un réplica du serveur démarre. Les serveurs plus anciens que cette console ne les signalent pas.'),
      columns: { name: 'Nom', status: 'Statut', version: 'Version', schemaVersion: 'Schéma', backplane: 'Bus d\'événements', uptime: 'Disponibilité', lastHeartbeatUtc: 'Dernier signal de vie', activeRequests: 'Requêtes', openStreams: 'Flux', heldLongPolls: 'Long polling', address: 'Adresse', hostname: 'Nom d\'hôte', startedUtc: 'Démarré', id: 'ID' },
      fields: { name: 'Nom', id: 'ID du nœud', hostname: 'Nom d\'hôte', address: 'Adresse', isLeader: 'Leader', leaderEpoch: 'Époque du leader', version: 'Version', schemaVersion: 'Version du schéma', backplane: 'Bus d\'événements', startedUtc: 'Démarré', uptime: 'Disponibilité', lastHeartbeatUtc: 'Dernier signal de vie', activeRequests: 'Requêtes actives', openStreams: 'Flux ouverts', heldLongPolls: 'Long polling en attente', respondingNodeId: 'Réponse de' },
      leader: 'Leader',
      stale: 'Muet',
      answeredBy: 'Réplica qui a répondu : {{node}}',
      answeredByLeader: 'Réplica qui a répondu : {{node}} (le leader)',
      actions: { grafana: 'Ouvrir dans Grafana' }
    },
    audit: {
      ...rp('Audit', 'Événements d\'authentification, d\'autorisation et de configuration de ce locataire.', 'Ajouter un enregistrement d\'audit', 'Créer un enregistrement d\'audit', 'Modifier l\'enregistrement d\'audit', 'Détails de l\'enregistrement d\'audit', 'Supprimer l\'enregistrement d\'audit', 'Aucun enregistrement d\'audit pour l\'instant', 'Les événements de sécurité apparaissent ici à mesure que les personnes et les agents utilisent Garrison.'),
      emptyTitle: 'Aucun enregistrement d\'audit pour l\'instant',
      columns: { createdUtc: 'Heure', eventType: 'Événement', principalName: 'Principal', resource: 'Ressource', reason: 'Motif', sourceIp: 'IP source', id: 'ID' },
      fields: {
        eventType: 'Événement',
        principalType: 'Type de principal',
        principalName: 'Principal',
        principalId: 'ID du principal',
        resourceType: 'Type de ressource',
        resourceId: 'ID de ressource',
        operation: 'Opération',
        method: 'Méthode',
        path: 'Chemin',
        authResult: 'Résultat de l\'authentification',
        authorizationResult: 'Résultat de l\'autorisation',
        reason: 'Motif',
        bypassReason: 'Motif du contournement',
        statusCode: 'Code de statut',
        sourceIp: 'IP source',
        requestId: 'ID de requête',
        createdUtc: 'Heure'
      }
    },
    manifestApplies: {
      ...rp('Historique des applications', 'Chaque application et simulation de manifeste, avec les résultats par document.', 'Ajouter une application', 'Créer une application', 'Modifier l\'application', 'Détails de l\'application', 'Supprimer l\'application', 'Aucune application pour l\'instant', 'Les applications apparaissent ici après que vous avez appliqué ou simulé un manifeste.'),
      columns: { createdUtc: 'Heure', principalName: 'Appliqué par', dryRun: 'Simulation', counts: 'Résultats' }
    },
    conversations: {
      title: 'Conversations',
      subtitle: 'Échanges en plusieurs tours avec un agent. Chaque tour est une exécution qui reprend la session de harness du tour précédent.',
      add: 'Ajouter une conversation',
      create: 'Créer une conversation',
      edit: 'Modifier la conversation',
      view: 'Détails de la conversation',
      deleteTitle: 'Supprimer la conversation',
      emptyTitle: 'Aucune conversation pour l\'instant',
      emptyBody: 'Démarrez-en une sur la page Invoquer avec « Démarrer une nouvelle conversation », ou envoyez un message A2A : chaque contexte A2A est une conversation.',
      untitled: 'Conversation sans titre',
      columns: {
        title: 'Titre',
        agentName: 'Agent',
        state: 'État',
        turnCount: 'Tours',
        affinityNodeName: 'Nœud d\'affinité',
        fallbackCount: 'Reconstructions',
        lastFallbackReason: 'Dernière reconstruction',
        harnessType: 'Harness',
        callerName: 'Démarrée par',
        contextId: 'ID de contexte',
        sessionId: 'ID de session',
        lastActivityUtc: 'Dernière activité',
        createdUtc: 'Créée',
        id: 'ID'
      },
      states: {
        busy: 'En cours',
        idle: 'Inactive'
      },
      actions: {
        continue: 'Continuer',
        runs: 'Voir les tours comme exécutions'
      }
    }
  },
  views: {
    approvalDetail: {
      title: 'Approbation',
      titleWithTool: 'Approbation pour {{tool}}',
      backToInbox: 'Toutes les approbations',
      pending: 'En attente qu\'une personne autorise ou refuse cet appel d\'outil.',
      pendingExpires: 'En attente d\'une personne. Si personne ne décide, elle expire {{when}} avec la décision {{decision}}.',
      request: 'Requête',
      rules: 'Règles',
      noRule: 'Aucune règle ne correspond',
      noInput: 'Aucune entrée n\'a été enregistrée.',
      notFoundTitle: 'Approbation introuvable',
      notFoundBody: 'Elle appartient peut-être à un autre locataire, ou l\'ID est incorrect.'
    },
    home: {
      observabilityState: { reachable: 'Accessible', unreachable: 'Inaccessible', checking: 'Vérification', unknown: 'Statut inconnu' },
      observabilityVersion: 'Version {{version}}',
      observabilityOpen: 'Ouvrir {{service}}',
      kpisGrafana: 'Ouvrir la vue d\'ensemble dans Grafana',
      grafanaDashboards: 'Tableaux de bord Grafana',
      grafanaSections: { overview: 'Vue d\'ensemble', http: 'API HTTP', runs: 'Exécutions', agents: 'Agents', models: 'Modèles et jetons', workers: 'Nœuds worker', kubernetes: 'Exécuteur Kubernetes', protocols: 'Protocoles', scheduler: 'Planificateur et file', database: 'Base de données', controlPlane: 'Plan de contrôle', security: 'Sécurité et authentification', integrations: 'Intégrations', logs: 'Journaux et traces', autonomy: 'Autonomie' },
      observabilitySetup: 'Configurer l\'observabilité',
      observabilityNone: 'Aucun service d\'observabilité (Grafana, Prometheus, Tempo ou Loki) n\'est configuré pour cette installation.',
      observability: 'Observabilité',
      title: 'Accueil',
      subtitle: 'Ce que font vos agents et vos nœuds worker en ce moment.',
      lastLoaded: 'Mis à jour {{time}}',
      partial: 'Certains panneaux n\'ont pas pu être chargés. Les valeurs affichées sont partielles.',
      getStartedTitle: 'Aucun agent dans ce locataire pour l\'instant',
      getStartedBody: 'L\'assistant de configuration ajoute une clé d\'accès, applique un agent d\'exemple et lance un test.',
      runSetup: 'Lancer la configuration',
      kpis: {
        agents: 'Agents',
        deployments: 'Déploiements',
        activeRuns: 'Exécutions actives',
        queued: 'En file d\'attente',
        succeeded: 'Réussies',
        failed: 'Échouées',
        nodes: 'Nœuds prêts',
        controlNodes: 'Plan de contrôle prêt',
        nodesNote: 'Prêts / total',
        last24h: 'Dernières 24 heures'
      },
      requestActivity: 'Activité des requêtes API',
      nodesTitle: 'Nœuds',
      noNodesTitle: 'Aucun nœud worker enregistré',
      noNodesBody: 'Démarrez Garrison.Worker ou augmentez le nombre de réplicas du StatefulSet worker. Les nœuds s\'enregistrent eux-mêmes.',
      nodeLoad: '{{active}} exécutions sur {{max}}',
      controlPlaneSection: 'Plan de contrôle',
      workersSection: 'Nœuds worker',
      openControlPlane: 'Tout voir',
      openWorkers: 'Tout voir',
      noControlNodes: 'Aucun nœud de contrôle ne s\'est encore enregistré.',
      controlNodesUnavailable: 'Les nœuds de contrôle ne sont pas disponibles : le serveur est plus ancien que cette console, ou vous n\'avez pas le droit de lire les nœuds.',
      recentFailures: 'Échecs récents',
      noFailures: 'Aucune exécution échouée récemment.',
      cta: {
        title: 'Tâches courantes',
        invoke: 'Invoquer un agent',
        addAgent: 'Ajouter un agent',
        applyManifest: 'Appliquer un manifeste',
        inspectRuns: 'Inspecter les exécutions',
        nodes: 'Vérifier les nœuds worker',
        apiExplorer: 'Ouvrir l\'Explorateur d\'API',
        analytics: 'Voir les analyses des exécutions'
      },
      externalServices: 'Services externes',
      externalServicesNote: 'Outils d\'observabilité fournis. Changez les identifiants par défaut avant de partager ce déploiement.',
      externalServicesNone: 'Aucun service externe n\'est configuré pour ce déploiement.',
      credentials: 'Identifiants par défaut',
      services: { loki: 'Loki', grafana: 'Grafana', prometheus: 'Prometheus', tempo: 'Tempo' }
    },
    markdown: {
      showRaw: 'Afficher le texte brut',
      showRendered: 'Afficher la mise en forme'
    },
    invoke: {
      stream: {
        tabsLabel: 'Vues de la réponse',
        cardLabel: 'Sortie de l\'exécution',
        preview: 'Aperçu',
        response: 'Réponse',
        starting: 'Démarrage de l\'exécution...',
        live: 'En direct',
        finished: 'Terminée',
        elapsed: 'Écoulé',
        firstToken: 'Premier jeton',
        tokensPerSecond: 'Débit',
        finishedHint: 'Exécution terminée.',
        showResponse: 'Voir la réponse',
        reasoning: 'Raisonnement',
        waiting: 'En attente de sortie...',
        waitingCodex: 'En attente de sortie. Codex envoie sa réponse d\'un seul bloc à la fin.',
        codexNote: 'Codex ne diffuse pas en continu : sa réponse apparaît ici d\'un seul bloc à la fin de l\'exécution.',
        noText: 'L\'exécution n\'a diffusé aucun texte. L\'onglet Réponse contient le résultat.',
        jump: 'Aller au plus récent',
        tool: {
          running: 'en cours',
          ok: 'réussi',
          failed: 'échoué'
        }
      },
      noDeployment: 'Cet agent n\'a aucun déploiement actif avec un poids supérieur à zéro ; un appel serait donc refusé. Ajoutez un déploiement dans l\'onglet Déploiements ou augmentez un poids.',
      title: 'Invoquer',
      subtitle: 'Envoyez un message à un agent et suivez la transcription en direct.',
      request: 'Requête',
      agent: 'Agent',
      deployment: 'Déploiement',
      weighted: 'N\'importe quel déploiement actif (pondéré)',
      default: 'Valeur par défaut du déploiement',
      message: 'Message',
      messagePlaceholder: 'Que doit faire l\'agent ?',
      shortcut: 'Appuyez sur Ctrl+Entrée ou Cmd+Entrée pour envoyer.',
      send: 'Envoyer',
      sending: 'Envoi...',
      openRun: 'Ouvrir l\'exécution',
      idleTitle: 'Aucune exécution pour l\'instant',
      idleBody: 'Envoyez un message pour lancer une exécution. La transcription s\'affiche ici au fil du flux.',
      noAgentsTitle: 'Aucun agent à invoquer',
      noAgentsBody: 'Créez un agent et un déploiement, ou appliquez le manifeste d\'exemple.',
      applySample: 'Aller aux manifestes',
      stopOnLeave: 'Arrêter l\'exécution quand je pars',
      cancel: 'Annuler l\'exécution',
      cancelling: 'Annulation...',
      timeLimit: 'Durée maximale',
      timeLimitPlaceholder: 'Valeur du déploiement',
      timeLimitClear: 'Utiliser la valeur par défaut',
      timeLimitRange: 'Autorisé : de {{min}} à {{max}}.',
      timeLimitAny: 'Secondes dont l\'exécution dispose avant d\'expirer.',
      timeLimitCap: 'Le cluster arrête toute exécution après {{max}}.',
      timeLimitErrors: {
        notInteger: 'Saisissez un nombre entier de secondes.',
        range: 'Saisissez une durée maximale de {{min}} à {{max}}.',
        aboveCap: 'Le cluster autorise au plus {{max}} par exécution.'
      },
      timeUnits: {
        seconds: '{{value}} s',
        minutes: '{{value}} min',
        hours: '{{value}} h',
        secondsWord: 'secondes'
      },
      conversation: {
        mode: 'Mode de conversation',
        modes: {
          none: 'Exécution unique (sans conversation)',
          start: 'Démarrer une nouvelle conversation',
          continue: 'Poursuivre une conversation'
        },
        pick: 'Conversation à poursuivre',
        choose: 'Choisissez une conversation',
        option: '{{title}} (tours : {{turns}})',
        pinned: 'Chaque tour s\'exécute sur le déploiement du premier tour de la conversation, le déploiement ne peut donc pas être choisi ici.',
        busy: 'Cette conversation traite encore son tour précédent. Un nouveau message est refusé tant que cette exécution n\'est pas terminée.',
        open: 'Ouvrir la conversation (tour {{turn}})'
      }
    },
    runDetail: {
      awaitingApproval_one: 'Cette exécution attend qu\'une personne approuve {{count}} appel d\'outil.',
      awaitingApproval_other: 'Cette exécution attend qu\'une personne approuve {{count}} appels d\'outil.',
      awaitingApproval_many: 'Cette exécution attend qu\'une personne approuve {{count}} appels d\'outil.',
      reviewApprovals: 'Examiner',
      approvals_one: 'Approbations ({{count}})',
      approvals_other: 'Approbations ({{count}})',
      approvals_many: 'Approbations ({{count}})',
      noApprovals: 'Cette exécution n\'a demandé aucune approbation.',
      openApproval: 'Ouvrir l\'approbation',
      viewTrace: 'Voir la trace',
      viewLogs: 'Voir les journaux',
      traceId: 'ID de trace',
      deploymentDeleted: 'Le déploiement utilisé par cette exécution a été supprimé ; elle ne peut donc pas être relancée. Invoquez à nouveau l\'agent {{agent}}.',
      templatesUsed: 'Modèles utilisés',
      agentDeleted: 'L\'agent {{agent}} n\'existe plus ; cette exécution ne peut donc pas être relancée. Son enregistrement, sa transcription et sa télémétrie restent disponibles ici.',
      title: 'Exécution',
      titleWithAgent: 'Exécution de {{agent}}',
      deployment: 'Déploiement',
      model: 'Modèle servi',
      tokensLabel: 'Jetons',
      tokens: '{{input}} en entrée, {{output}} en sortie',
      estimated: 'estimé',
      caller: 'Appelant',
      parent: 'Exécution parente',
      attempt: 'Tentative',
      outputSchema: 'Schéma de sortie',
      outputSchemaStates: {
        valid: 'Valide',
        validAfterRepair: 'Valide après une correction',
        invalid: 'Non valide',
        invalidAfterRepair: 'Non valide après une correction'
      },
      started: 'Démarrée le',
      completed: 'Terminée le',
      exitCode: 'Code de sortie',
      transcript: 'Transcription',
      result: 'Résultat',
      input: 'Entrée',
      stderr: 'Stderr',
      children_one: 'Exécutions enfants ({{count}})',
      children_other: 'Exécutions enfants ({{count}})',
      children_many: 'Exécutions enfants ({{count}})',
      eventFilter: 'Afficher',
      eventCount_one: '{{count}} événement',
      eventCount_other: '{{count}} événements',
      eventCount_many: '{{count}} événements',
      noEvents: 'Aucun événement pour l\'instant. Les événements apparaissent à mesure que le harness les produit.',
      failed: 'Échec',
      noResult: 'L\'exécution n\'a produit aucun texte de résultat.',
      pending: 'Le résultat apparaît lorsque l\'exécution se termine.',
      structuredOutput: 'Sortie structurée',
      templateVersions: 'Versions des modèles de prompt utilisées',
      noStderr: 'Aucune sortie Stderr n\'a été capturée.',
      noChildren: 'Cette exécution n\'a délégué à aucun autre agent.',
      confirmCancel: 'Annuler cette exécution ? Le processus du harness est arrêté sur son nœud.',
      notFoundTitle: 'Exécution introuvable',
      notFoundBody: 'Elle a peut-être été supprimée, ou elle appartient à un autre locataire.',
      telemetry: {
        approvalNote: 'Cette exécution a passé {{wait}} à attendre des décisions d\'approbation. La durée d\'exécution inclut cette attente.',
        delegationNote: 'Cette exécution a attendu {{wait}} des exécutions déléguées. Le délai avant le premier jeton est de {{ttft}} avec cette attente et de {{excluding}} sans elle ; c\'est ce second chiffre qui se compare aux agents qui ne délèguent pas.',
        title: 'Télémétrie',
        phases: 'Durée de l\'exécution par phase',
        phase: { delegation: 'Attente des exécutions déléguées', queue: 'File d\'attente', startup: 'Démarrage jusqu\'au premier jeton', streaming: 'Streaming', tail: 'Après le dernier jeton' },
        fields: {
          approvalWaitMs: 'Attente d\'approbation',
          delegationWaitMs: 'Attente de délégation',
          timeToFirstTokenExcludingDelegationMs: 'Délai avant le premier jeton hors délégation',
          timeToFirstTokenMs: 'Délai avant le premier jeton',
          streamingMs: 'Durée du streaming',
          executionMs: 'Durée d\'exécution',
          queueMs: 'Temps en file d\'attente',
          totalMs: 'Temps total',
          outputTokensPerSecond: 'Jetons de sortie par seconde',
          inputTokens: 'Jetons d\'entrée',
          outputTokens: 'Jetons de sortie',
          cachedTokens: 'Jetons en cache',
          reasoningTokens: 'Jetons de raisonnement',
          toolCallCount: 'Appels d\'outils',
          costUsd: 'Coût',
          firstTokenUtc: 'Premier jeton à',
          lastTokenUtc: 'Dernier jeton à'
        }
      },
      conversation: 'Conversation liée',
      conversationSession: 'Session de harness',
      resumeSessionId: 'Session reprise',
      affinityNode: 'Nœud d\'affinité',
      affinityUntil: 'jusqu\'à {{time}}'
    },
    queue: {
      title: 'File d\'attente',
      subtitle: 'Travail en attente d\'un nœud, sous bail et en cours, par agent et par harness.',
      queued: 'En file d\'attente',
      leased: 'Sous bail',
      running: 'En cours',
      emptyTitle: 'Rien en attente',
      emptyBody: 'Les exécutions apparaissent ici pendant qu\'elles attendent un nœud worker.'
    },
    agentDetail: {
      invoke: 'Invoquer',
      grafana: 'Ouvrir dans Grafana',
      noActiveDeployment: 'Cet agent n\'a aucun déploiement actif : les invocations seront donc rejetées.',
      deployments_one: 'Déploiements ({{count}})',
      deployments_other: 'Déploiements ({{count}})',
      deployments_many: 'Déploiements ({{count}})',
      recentRuns: 'Exécutions récentes',
      card: 'Carte A2A',
      traffic: 'Répartition du trafic',
      noDeploymentsTitle: 'Aucun déploiement',
      noDeploymentsBody: 'Créez un déploiement pour lier cet agent à un harness.',
      noRuns: 'Cet agent n\'a encore jamais été exécuté.',
      selectionNote: 'Chaque invocation sans déploiement explicite est envoyée à un déploiement actif, choisi au hasard proportionnellement à son poids.',
      manageDeployments: 'Gérer les déploiements',
      conversations: 'Ses conversations'
    },
    templateEditor: {
      cloneToEdit: 'Cloner pour modifier',
      builtInReadOnly: 'Les modèles intégrés sont en lecture seule ; tous les champs sont donc verrouillés. Clonez-le pour obtenir une copie modifiable.',
      renameHint: 'Vous pouvez renommer ce modèle. Les déploiements gardent leurs liaisons, car ils utilisent son ID, mais les modèles qui l\'incluent par son nom doivent être mis à jour à la main.',
      cloneDialog: { taken: 'Un modèle nommé {{name}} existe déjà. Choisissez un autre nom.', reserved: 'Les noms commençant par builtin/ sont réservés aux modèles intégrés.', hint: 'Vous pourrez renommer la copie plus tard sur sa page.', name: 'Nom de la copie', body: 'La copie démarre avec le contenu actuel comme version 1 et peut être modifiée, renommée et supprimée.', title: 'Cloner {{name}}' },
      newTitle: 'Nouveau modèle de prompt',
      subtitle: 'Rédigez le modèle, prévisualisez-le avec un contexte d\'exemple, puis enregistrez.',
      builtInNote: 'Les modèles intégrés sont en lecture seule. Clonez-les pour les personnaliser, ou réinitialisez-les pour restaurer le contenu d\'origine.',
      content: 'Contenu',
      changeNote: 'Note de modification',
      syntaxHint: 'Syntaxe : {{variable}}, {{value | default: "x"}}, {{#if x}}...{{else}}...{{/if}}, {{#each list}}...{{/each}}, {{> template-name}}.',
      variables: 'Variables utilisées',
      noVariables: 'Aucune variable référencée.',
      preview: 'Aperçu en direct',
      sampleContext: 'Contexte d\'exemple (JSON)',
      rendered: 'Rendu',
      previewEmpty: 'Le texte rendu apparaît ici.',
      missing: 'Variables manquantes : {{list}}',
      versions_one: 'Versions ({{count}})',
      versions_other: 'Versions ({{count}})',
      versions_many: 'Versions ({{count}})',
      noVersions: 'Aucune version enregistrée pour l\'instant.',
      version: 'Version',
      note: 'Note',
      author: 'Auteur',
      diff: 'Différences',
      restore: 'Restaurer',
      diffTitle: 'Version {{version}} comparée à l\'éditeur',
      current: 'Éditeur',
      reset: 'Rétablir la valeur par défaut',
      savedVersion: 'Nouvelle version enregistrée.',
      restored: 'Version {{version}} restaurée.',
      resetDone: 'Contenu d\'origine rétabli.',
      confirm: {
        restoreTitle: 'Restaurer la version',
        restoreMessage: 'Restaurer la version {{version}} ? Le contenu actuel est conservé dans l\'historique.',
        resetTitle: 'Réinitialiser le modèle',
        resetMessage: 'Rétablir le contenu d\'origine de « {{name}} » ?',
        deleteTitle: 'Supprimer le modèle',
        deleteMessage: 'Supprimer « {{name}} » ? La compilation des déploiements qui le lient échouera.'
      }
    },
    manifests: {
      warnings_one: '{{count}} avertissement',
      warnings_other: '{{count}} avertissements',
      planned: 'Résultat prévu : {{result}}',
      changes: { count_many: '{{count}} champs changent.', count_other: '{{count}} champs changent.', count_one: '{{count}} champ change.', empty: '(vide)', after: 'Après', before: 'Avant', field: 'Champ' },
      title: 'Manifestes',
      subtitle: 'Appliquez la configuration sous forme de code. Les simulations valident sans rien écrire.',
      applyTab: 'Appliquer',
      exportTab: 'Exporter',
      historyTab: 'Historique',
      upload: 'Téléverser un fichier',
      loadSample: 'Charger un exemple',
      document: 'Manifeste (YAML ou JSON, plusieurs documents)',
      dryRun: 'Simulation',
      apply: 'Appliquer',
      validated: 'Validation terminée.',
      applied: 'Manifeste appliqué.',
      results: 'Résultats',
      dryRunResults: 'Résultats de la simulation',
      kind: 'Type',
      name: 'Nom',
      result: 'Résultat',
      message: 'Message',
      confirmTitle: 'Appliquer le manifeste',
      confirmMessage: 'Appliquer tous les documents de ce manifeste au locataire actuel ?',
      exportHelp: 'Exportez la configuration de ce locataire. Les valeurs des secrets ne sont jamais exportées.',
      export: 'Exporter',
      download: 'Télécharger',
      counts: '{{created}} créés, {{updated}} mis à jour, {{unchanged}} inchangés, {{failed}} en échec'
    },
    requests: {
      grafana: 'Tableau de bord HTTP dans Grafana',
      title: 'Historique des requêtes',
      subtitle: 'Trafic API capturé. Examinez le détail de chaque requête et gérez la conservation.',
      kpis: { total: 'Requêtes conservées', success: 'Réussies', failure: 'Échecs', avgDuration: 'Durée moyenne' },
      columns: { time: 'Heure', method: 'Méthode', path: 'Chemin', status: 'Statut', duration: 'Durée', principal: 'Principal' },
      bulkDeleteTitle: 'Supprimer l\'historique des requêtes',
      bulkDeleteMessage: 'Supprimer les {{count}} requêtes correspondant aux filtres actuels ?',
      bulkDeleteAll: 'Tout supprimer',
      deleteOneTitle: 'Supprimer la requête',
      deleteOneMessage: 'Supprimer la requête {{id}} ?',
      deleted: 'Supprimé.',
      emptyTitle: 'Aucun historique de requêtes',
      emptyBodyNoTraffic: 'Aucun trafic API n\'a encore été conservé.',
      emptyBodyNoMatch: 'Aucune requête ne correspond aux filtres actuels.'
    },
    explorer: {
      title: 'Explorateur d\'API',
      subtitle: 'Exécutez des appels en direct sur ce serveur, à partir de son document OpenAPI.',
      operations: 'Opérations',
      selectOperation: 'Sélectionnez une opération pour construire une requête.',
      selectOperationOption: 'Choisissez une opération...',
      pathParams: 'Paramètres de chemin',
      queryParams: 'Paramètres de requête',
      headers: 'En-têtes',
      addHeader: 'Ajouter un en-tête',
      headerName: 'Nom de l\'en-tête',
      headerValue: 'Valeur de l\'en-tête {{name}}',
      removeHeader: 'Retirer l\'en-tête {{name}}',
      body: 'Corps de la requête',
      resolvedUrl: 'URL résolue',
      copyUrl: 'Copier l\'URL',
      execute: 'Exécuter',
      executing: 'Exécution...',
      stop: 'Arrêter',
      streaming: 'Streaming',
      response: 'Réponse',
      responseHeaders: 'En-têtes de la réponse',
      responseBody: 'Corps de la réponse',
      snippets: 'Extraits de code',
      history: 'Requêtes récentes',
      historyEmpty: 'Aucune requête récente.',
      loadHistory: 'Charger',
      deleteHistory: 'Supprimer',
      clearHistory: 'Effacer l\'historique',
      required: 'obligatoire',
      confirmTitle: 'Exécuter une opération destructrice',
      confirmMessage: 'Cette requête {{method}} peut modifier ou supprimer des données. Continuer ?',
      noSpecTitle: 'Document OpenAPI indisponible',
      noSpecBody: 'Ce serveur n\'a pas renvoyé de document /openapi.json exploitable : l\'explorateur ne peut donc pas lister les opérations.'
    },
    settings: {
      errors: { allowed: 'Choisissez l\'une de ces valeurs : {{values}}.', boolean: 'Choisissez vrai ou faux.', max: 'Saisissez {{max}} ou moins.', min: 'Saisissez {{min}} ou plus.', range: 'Saisissez une valeur de {{min}} à {{max}}.', integer: 'Saisissez un nombre entier.', number: 'Saisissez un nombre.' },
      notSaved: 'Rien n\'a été enregistré. Corrigez les paramètres signalés puis enregistrez à nouveau.',
      title: 'Paramètres',
      subtitle: 'Paramètres du serveur issus du fichier de paramètres et paramètres du cluster stockés dans la base de données.',
      readOnly: 'Vous consultez les paramètres en lecture seule. Seuls les administrateurs système peuvent les modifier.',
      restartBanner: 'Certaines modifications enregistrées prennent effet après un redémarrage.',
      restarting: 'Le serveur redémarre. Cette page se reconnecte automatiquement.',
      restarted: 'Le serveur est de nouveau en ligne.',
      restartTimeout: 'Le serveur n\'est pas revenu dans les trois minutes. Vérifiez l\'état du pod.',
      restart: 'Redémarrer le serveur',
      restartConfirmTitle: 'Redémarrer le serveur',
      restartConfirmMessage: 'Redémarrer ce nœud du plan de contrôle maintenant ? Les requêtes en cours sont drainées et la console se reconnecte.',
      savedLive: 'Paramètres enregistrés et appliqués.',
      savedRestart: 'Paramètres enregistrés. Redémarrez le serveur pour appliquer toutes les modifications.',
      live: 'Immédiat',
      restartRequired: 'Redémarrage requis',
      secretSet: 'Défini (saisissez une nouvelle valeur pour le remplacer)',
      secretNotSet: 'Non défini',
      invalidNumber: 'Saisissez un nombre.',
      range: 'Plage autorisée : de {{min}} à {{max}}',
      testDatabase: 'Tester la connexion à la base de données',
      testing: 'Test en cours...',
      dbOk: 'Connexion réussie',
      dbFailed: 'Échec de la connexion',
      unavailableTitle: 'Paramètres indisponibles',
      unavailableBody: 'Ce serveur n\'a pas renvoyé ses paramètres.',
      sources: { File: 'Fichier de paramètres', Environment: 'Environnement', ConfigMap: 'ConfigMap', Database: 'Cluster' },
      lockedBy: {
        Environment: 'Défini par une variable d\'environnement. La valeur de l\'environnement l\'emporte.',
        ConfigMap: 'Géré par une ConfigMap Kubernetes. Modifiez-le dans vos manifestes.',
        other: 'Ce paramètre ne peut pas être modifié ici.'
      },
      groups: { Codex: 'Codex', Archive: 'Archivage', General: 'Général', Rest: 'REST', Mcp: 'MCP', Database: 'Base de données', Logging: 'Journalisation', Auth: 'Authentification', Security: 'Sécurité', RequestHistory: 'Historique des requêtes', Telemetry: 'Télémétrie', Cluster: 'Cluster', Scheduling: 'Planification', Runs: 'Exécutions', Audit: 'Audit', Runtime: 'Moteur d\'exécution', Observability: 'Observabilité' },
      fields: {
        Observability: {
          GrafanaUrl: 'URL de Grafana',
          PrometheusUrl: 'URL de Prometheus',
          LokiUrl: 'URL de Loki',
          TempoUrl: 'URL de Tempo',
          GrafanaInternalUrl: 'URL interne de Grafana',
          PrometheusInternalUrl: 'URL interne de Prometheus',
          LokiInternalUrl: 'URL interne de Loki',
          TempoInternalUrl: 'URL interne de Tempo'
        },
        Rest: {
          ExternalBaseUrl: 'URL REST externe',
          PublicBaseUrl: 'URL REST interne pour les exécutions',
          Ssl: 'TLS pour REST',
          Port: 'Port REST',
          Hostname: 'Nom d\'hôte d\'écoute REST'
        },
        Mcp: {
          InternalPort: 'Port MCP interne',
          SessionIdleTimeoutSeconds: 'Délai d\'inactivité des sessions MCP (secondes)',
          MaxToolWaitSeconds: 'Attente maximale des outils MCP (secondes)',
          PublicUrl: 'URL MCP interne pour les exécutions',
          Path: 'Chemin MCP',
          Port: 'Port MCP',
          Hostname: 'Nom d\'hôte d\'écoute MCP',
          Enable: 'Serveur MCP activé'
        },
        Database: {
          MinPoolSize: 'Connexions minimales du pool',
          ConnectionTimeoutSeconds: 'Attente d\'une connexion (secondes)',
          CommandTimeoutSeconds: 'Délai maximal des commandes (secondes)',
          ConnectionIdleLifetimeSeconds: 'Durée de vie des connexions inactives (secondes)',
          MaxPoolSize: 'Taille du pool de connexions',
          Schema: 'Schéma de la base de données',
          Password: 'Mot de passe de la base de données',
          Username: 'Utilisateur de la base de données',
          DatabaseName: 'Nom de la base de données',
          Port: 'Port de la base de données',
          Host: 'Hôte de la base de données',
          Filename: 'Fichier Sqlite',
          Type: 'Fournisseur de base de données'
        },
        Logging: {
          MinimumSeverity: 'Gravité minimale journalisée',
          LogFilename: 'Nom du fichier journal',
          LogDirectory: 'Répertoire des journaux',
          FileLogging: 'Journaliser dans un fichier',
          ConsoleLogging: 'Journaliser dans la console'
        },
        Auth: {
          RateLimitPerMinute: 'Tentatives de connexion par minute',
          PasswordHashIterations: 'Itérations du hachage des mots de passe',
          SignedRequestSkewSeconds: 'Décalage d\'horloge toléré pour les requêtes signées (secondes)',
          AdminApiKey: 'Clé d\'API administrateur',
          TokenLifetimeMinutes: 'Durée de session (minutes)',
          SigningKey: 'Clé de signature des jetons',
          Issuer: 'Émetteur des jetons'
        },
        Security: {
          NodeSecretKey: 'Clé secrète des nœuds worker',
          NodeAccessKey: 'Clé d\'accès des nœuds worker',
          DefaultSecretKey: 'Clé secrète par défaut',
          DefaultAccessKey: 'Clé d\'accès par défaut',
          AdminPassword: 'Mot de passe de l\'administrateur initial',
          AdminEmail: 'E-mail de l\'administrateur initial',
          MasterKey: 'Clé maîtresse de chiffrement des secrets'
        },
        RequestHistory: {
          CaptureNodeProtocol: 'Capturer les requêtes réussies du protocole des workers',
          MaxResponseBodyBytes: 'Corps de réponse enregistré au maximum (octets)',
          MaxRequestBodyBytes: 'Corps de requête enregistré au maximum (octets)',
          RetentionDays: 'Conservation de l\'historique des requêtes (jours)',
          Enabled: 'Enregistrer l\'historique des requêtes'
        },
        Telemetry: {
          OtlpEndpoint: 'Point de terminaison OTLP',
          OtlpEnable: 'Export OTLP activé',
          PrometheusPort: 'Port Prometheus',
          PrometheusEnable: 'Point de terminaison Prometheus activé',
          ServiceName: 'Nom du service de télémétrie',
          Enabled: 'Télémétrie activée'
        },
        Archive: {
          Directory: 'Répertoire d\'archive'
        },
        Cluster: {
          Backplane: 'Backplane d\'événements',
          BackplanePollMs: 'Intervalle d\'interrogation du backplane (ms)',
          ExpectedReplicas: 'Réplicas attendus du plan de contrôle'
        },
        Scheduling: {
          EventPollMs: 'Intervalle d\'interrogation des événements (ms)',
          InvocationWaitPollMs: 'Relecture de secours pendant l\'attente d\'invocation (ms)',
          NodeHeartbeatTimeoutMs: 'Délai de pulsation des nœuds (ms)',
          LeaseWaitMs: 'Attente de long polling des baux (ms)',
          LeaseDurationMs: 'Durée du bail d\'exécution (ms)',
          PauseGraceMs: 'Marge après une pause de l\'hôte (ms)'
        },
        Runs: {
          EventRetentionDays: 'Conservation des événements d\'exécution (jours)',
          RetentionDays: 'Conservation des exécutions (jours)',
          MaxDelegationDepth: 'Profondeur maximale de délégation',
          DelegationChildQueueDepth: 'Maximum d\'exécutions enfants en file pour des parents en attente',
          DelegationRetryAfterSeconds: 'Délai avant nouvel essai si la capacité de délégation est épuisée (secondes)',
          DefaultTimeoutSeconds: 'Délai d\'exécution par défaut (secondes)'
        },
        Codex: {
          RefreshBeforeExpirySeconds: 'Renouveler les connexions Codex avant expiration (secondes)',
          RefreshCheckIntervalSeconds: 'Intervalle de la vérification en arrière-plan (secondes)',
          RefreshTimeoutSeconds: 'Délai maximal de renouvellement (secondes)',
          TokenEndpoint: 'Point de terminaison des jetons OAuth',
          ClientId: 'Identifiant client OAuth'
        },
        Runtime: {
          FailBlockedAfterSeconds: 'Faire échouer les exécutions bloquées après (secondes)',
          MaxRunSeconds: 'Durée maximale d\'une exécution (secondes)',
          RepetitionGuard: 'Garde de répétition par défaut',
          MaxAssistantChars: 'Nombre maximal de caractères de l\'assistant par défaut',
          NoProgressSeconds: 'Délai sans progression par défaut (secondes)',
          ConversationAffinityWaitMs: 'Attente d\'affinité des conversations (ms)',
          ConversationTranscriptTurns: 'Tours dans la transcription de reconstruction',
          ConversationTranscriptChars: 'Caractères par message dans la transcription de reconstruction'
        },
        Audit: {
          RetentionDays: 'Conservation de l\'audit (jours)'
        }
      }
    },
    analytics: {
      grafana: 'Tableau de bord des exécutions dans Grafana',
      deletedAgent: 'Agent supprimé ({{id}})',
      deletedDeployment: 'Déploiement supprimé ({{id}})',
      title: 'Analyses',
      subtitle: 'Rapidité, coût et fiabilité de vos exécutions au fil du temps.',
      loading: 'Chargement des analyses...',
      filters: { ttft: 'Exclure l\'attente de délégation du TTFT', range: 'Période', from: 'Du', to: 'Au', agentId: 'Agent', harnessType: 'Harness', deploymentId: 'Déploiement', model: 'Modèle', groupBy: 'Regrouper par' },
      allAgents: 'Tous les agents',
      allHarnesses: 'Tous les harness',
      allDeployments: 'Tous les déploiements',
      allModels: 'Tous les modèles',
      unknownModel: 'Modèle inconnu',
      groupBy: { none: 'Aucun regroupement', agent: 'Agent', harness: 'Harness', model: 'Modèle', harnessModel: 'Harness et modèle' },
      export: { window: 'Période : du {{from}} au {{to}}' },
      usage: { title: 'Consommation par harness et par modèle', help: 'Jetons et coût au fil du temps pour chaque combinaison de harness et de modèle sur la période, avec un tableau de répartition.' },
      breakdown: {
        title: 'Répartition par harness et par modèle',
        columns: { harness: 'Harness', model: 'Modèle', runs: 'Exécutions', inputTokens: 'Jetons d\'entrée', outputTokens: 'Jetons de sortie', cachedTokens: 'Jetons en cache', reasoningTokens: 'Jetons de raisonnement', costUsd: 'Coût', timeToFirstTokenMsAvg: 'TTFT moyen' }
      },
      rangeError: {
        incomplete: 'Choisissez une heure de début et une heure de fin pour la période personnalisée.',
        reversed: 'Le début de la période personnalisée doit précéder sa fin.'
      },
      truncated: 'Cette période contient plus d\'exécutions que le serveur n\'en agrège en une requête : les chiffres n\'en couvrent donc qu\'une partie. Réduisez la période ou ajoutez des filtres pour obtenir des valeurs exactes.',
      unavailableTitle: 'Les analyses ne sont pas encore disponibles sur ce serveur',
      unavailableBody: 'Ce serveur n\'expose pas le point de terminaison d\'analyse des exécutions. Mettez le serveur à niveau pour afficher les graphiques ici.',
      emptyTitle: 'Aucune exécution sur cette période',
      emptyBody: 'Rien ne correspond à la période et aux filtres. Élargissez la période, retirez un filtre ou invoquez un agent.',
      noDataInChart: 'Aucune donnée pour ce graphique sur la période sélectionnée.',
      cards: {
        delegationWait: 'Attente moyenne de délégation',
        ttftExcludingDelegation: 'TTFT moyen hors délégation',
        runs: 'Exécutions',
        runsNote: '{{succeeded}} réussies, {{failed}} échouées',
        successRate: 'Taux de réussite',
        ttft: 'Délai moyen avant le premier jeton',
        execution: 'Durée d\'exécution moyenne',
        queue: 'Temps moyen en file d\'attente',
        tokens: 'Jetons',
        tokensNote: '{{input}} en entrée, {{output}} en sortie',
        throughput: 'Vitesse de sortie moyenne',
        cost: 'Coût',
        toolCalls: 'Appels d\'outils',
        p95: 'p95 {{value}}'
      },
      charts: {
        outcomes: { title: 'Résultats des exécutions', help: 'Exécutions par intervalle, selon leur issue.' },
        ttft: { helpExcluding: 'Du démarrage du harness à la première sortie du modèle, sans le temps d\'attente des exécutions déléguées.', title: 'Délai avant le premier jeton', help: 'Du démarrage du harness à la première sortie du modèle. Inclut le démarrage de la CLI.' },
        duration: { title: 'Durée de streaming et d\'exécution', help: 'Le streaming va de la première à la dernière sortie du modèle ; l\'exécution va du démarrage du processus à sa fin.' },
        queue: { title: 'Temps en file d\'attente', help: 'Temps écoulé entre la mise en file d\'attente et la prise à bail par un nœud worker.' },
        tokens: { title: 'Jetons', help: 'Jetons d\'entrée, de sortie, en cache et de raisonnement par intervalle.' },
        throughput: { title: 'Jetons de sortie par seconde', help: 'Jetons de sortie divisés par la durée du streaming, moyenne par intervalle.' },
        cost: { title: 'Coût', help: 'Coût déclaré en dollars américains par intervalle.' },
        toolCalls: { title: 'Appels d\'outils', help: 'Événements d\'appel d\'outil par intervalle.' },
        usageTokens: { title: 'Jetons par harness et par modèle', help: 'Jetons d\'entrée et de sortie par intervalle, empilés par harness et par modèle.' },
        usageCost: { title: 'Coût par harness et par modèle', help: 'Coût déclaré par intervalle, empilé par harness et par modèle.' }
      },
      groupedTitle: '{{chart}} : {{metric}}',
      metrics: {
        delegationWaitMsAvg: 'Attente de délégation (moyenne)',
        timeToFirstTokenExcludingDelegationMsP95: 'Hors délégation (p95)',
        timeToFirstTokenExcludingDelegationMsP50: 'Hors délégation (p50)',
        timeToFirstTokenExcludingDelegationMsAvg: 'Hors délégation (moyenne)',
        runs: 'Exécutions',
        succeeded: 'Réussies',
        failed: 'Échouées',
        cancelled: 'Annulées',
        timedOut: 'Délai dépassé',
        inputTokens: 'Entrée',
        outputTokens: 'Sortie',
        cachedTokens: 'En cache',
        reasoningTokens: 'Raisonnement',
        totalTokens: 'Jetons d\'entrée et de sortie',
        costUsd: 'Coût',
        toolCalls: 'Appels d\'outils',
        timeToFirstTokenMsAvg: 'Moyenne',
        timeToFirstTokenMsP50: 'Médiane (p50)',
        timeToFirstTokenMsP95: 'p95',
        streamingMsAvg: 'Streaming (moyenne)',
        executionMsAvg: 'Exécution (moyenne)',
        executionMsP95: 'Exécution (p95)',
        queueMsAvg: 'Temps moyen en file d\'attente',
        outputTokensPerSecondAvg: 'Jetons par seconde (moyenne)'
      },
      other: 'Autres',
      hiddenGroups_one: '{{count}} groupe moins actif n\'est pas affiché.',
      hiddenGroups_other: '{{count}} groupes moins actifs ne sont pas affichés.',
      hiddenGroups_many: '{{count}} groupes moins actifs ne sont pas affichés.',
      legend: 'Séries de {{chart}}',
      dataTable: 'Tableau de données',
      bucketStart: 'Début de l\'intervalle'
    },
    serverInfo: {
      serverInUse: 'Serveur utilisé',
      title: 'Infos serveur',
      subtitle: 'Points de terminaison, versions et identité avec laquelle vous êtes connecté.',
      endpoints: 'Points de terminaison',
      rest: 'API REST',
      mcp: 'MCP',
      a2a: 'A2A',
      openapi: 'OpenAPI',
      server: 'Serveur',
      version: 'Version du serveur',
      dashboardVersion: 'Version du tableau de bord',
      node: 'Nœud de contrôle',
      database: 'Base de données',
      health: 'Santé',
      replicas: 'Réplicas attendus',
      routes: 'Opérations enregistrées',
      serverTime: 'Heure du serveur',
      principal: 'Connecté en tant que',
      principalName: 'Principal',
      principalType: 'Type de principal',
      role: 'Rôle',
      tenant: 'Locataire',
      expires: 'Expiration de la session',
      features: 'Indicateurs de fonctionnalités'
    },
    runGuard: {
      titles: {
        RepetitionDetected: 'Arrêtée : le modèle se répétait',
        NoProgress: 'Arrêtée : l\'exécution ne progressait plus',
        OutputLimitExceeded: 'Arrêtée : la réponse a atteint sa taille maximale'
      },
      bodies: {
        RepetitionDetected: 'La garde de répétition a vu le même texte court écrit encore et encore (ou seulement des espaces et de la ponctuation) ; Garrison a donc arrêté l\'exécution au lieu de la laisser tourner jusqu\'à son échéance.',
        NoProgress: 'Aucun texte, raisonnement ni activité d\'outil n\'est arrivé pendant plus longtemps que le délai sans progression ; Garrison a donc arrêté l\'exécution.',
        OutputLimitExceeded: 'La réponse a dépassé le nombre maximal de caractères de l\'assistant autorisé par exécution ; Garrison a donc arrêté l\'exécution.'
      },
      detected: 'Ce qui a été détecté : {{reason}}',
      partialKept: 'La sortie écrite avant l\'arrêt ({{chars}} caractères) est conservée comme résultat de l\'exécution.',
      noPartial: 'L\'exécution n\'a rien écrit avant d\'être arrêtée.',
      tune: 'Pour changer quand cela se produit, modifiez le déploiement {{deployment}} : son étape Placement et limites contient Garde de répétition, Nombre maximal de caractères de l\'assistant et Délai sans progression. Laissés vides, ils suivent les valeurs du cluster dans Paramètres (Moteur d\'exécution).',
      tuneAny: 'Pour changer quand cela se produit, modifiez le déploiement : son étape Placement et limites contient Garde de répétition, Nombre maximal de caractères de l\'assistant et Délai sans progression. Laissés vides, ils suivent les valeurs du cluster dans Paramètres (Moteur d\'exécution).',
      openDeployments: 'Ouvrir les déploiements',
      openSettings: 'Ouvrir les paramètres'
    },
    conversationDetail: {
      title: 'Conversation',
      notFoundTitle: 'Conversation introuvable',
      notFoundBody: 'Elle a peut-être été supprimée, ou elle appartient à un autre locataire. Ses tours restent sur la page Exécutions.',
      deployment: 'Déploiement',
      activeRun: 'Tour inachevé',
      turns: 'Tours',
      turnsCount: 'Tours ({{count}})',
      noTurns: 'Cette conversation n\'a encore aucun tour.',
      pending: 'En attente du résultat',
      columns: {
        turn: 'Tour',
        run: 'Exécution',
        status: 'Statut',
        outcome: 'Résultat',
        session: 'Session de harness',
        input: 'Entrée',
        result: 'Réponse',
        node: 'Nœud',
        created: 'Créé'
      },
      session: {
        first: 'Nouvelle session',
        resumed: 'Reprise',
        fallback: 'Session repartie de zéro',
        pending: 'Pas encore placé'
      },
      continueTitle: 'Poursuivre la conversation',
      message: 'Message suivant',
      messagePlaceholder: 'Posez une question de suivi ou donnez l\'instruction suivante...',
      busyNotice: 'Le tour précédent est encore en cours. Vous pourrez envoyer le message suivant quand il sera terminé.',
      send: 'Envoyer le tour',
      turnStarted: 'Tour {{turn}} démarré.',
      openInvoke: 'Continuer dans Invoquer',
      confirmDelete: 'Supprimer la conversation « {{title}} » ? Ses tours restent sur la page Exécutions comme des exécutions ordinaires, mais aucun nouveau tour ne pourra la poursuivre.'
    }
  },
  wizard: {
    title: 'Configurer Garrison',
    stepOf: 'Étape {{step}} sur {{total}}',
    steps: { welcome: 'Bienvenue', secret: 'Identifiants', manifest: 'Agent d\'exemple', invoke: 'Exécution de test' },
    welcomeBody: 'Ce locataire n\'a pas encore d\'agent. En quelques étapes, vous allez :',
    welcomeItem1: 'Stocker les identifiants d\'un harness, par exemple une clé API Anthropic ou OpenAI (facultatif).',
    welcomeItem2: 'Appliquer un agent d\'exemple qui utilise le harness factice intégré, pour qu\'il fonctionne sans identifiants.',
    welcomeItem3: 'L\'exécuter et suivre la transcription.',
    start: 'Commencer',
    skip: 'Ignorer la configuration',
    skipStep: 'Ignorer cette étape',
    secretBody: 'Ajoutez les identifiants dont vos vrais agents auront besoin. Vous pouvez ignorer cette étape et ajouter des secrets plus tard.',
    saveSecret: 'Enregistrer et continuer',
    secretSaved: 'Secret enregistré.',
    manifestBody: 'Ce manifeste crée un agent echo et un déploiement qui utilise le harness factice.',
    invokeBody: 'Envoyez un message à l\'agent echo. Vous serez redirigé vers l\'exécution pendant son déroulement.',
    invoke: 'Lancer',
    noAgent: 'L\'agent d\'exemple est introuvable. Appliquez d\'abord le manifeste.'
  },
  tour: {
    title: 'Visite guidée',
    skip: 'Passer la visite',
    done: 'Terminé',
    steps: {
      sidebar: { title: 'Navigation', body: 'Les pages sont regroupées en hubs. Chaque hub présente des onglets en haut de la page, et chaque onglet possède son propre lien.' },
      topbar: { title: 'Contexte', body: 'Le serveur, le locataire, votre identité, la santé et l\'état des mises à jour en direct sont toujours visibles ici.' },
      kpis: { title: 'En un coup d\'œil', body: 'Chaque carte résume une ressource. Cliquez sur une carte pour ouvrir la liste filtrée.' },
      invoke: { title: 'Invoquer', body: 'Essayez n\'importe quel agent de manière interactive et suivez sa transcription en direct.' },
      configure: { title: 'Configuration', body: 'Les profils de harness, modèles de prompt, serveurs MCP et secrets déterminent précisément ce qui s\'exécute. Les agents et les déploiements ont leur propre hub.' },
      observe: { title: 'Supervision', body: 'L\'historique des requêtes, l\'audit et l\'Explorateur d\'API vous aident à vérifier et à déboguer.' }
    }
  },
  tips,
  explainers
};


// Executor capability negotiation (P11.18).
Object.assign(fr.resources.deployments.fields, {"capIsolation": "Isolation minimale", "capColdStartClass": "Classe de démarrage", "capEgressControl": "Exiger le contrôle des sorties", "capFilesystemSnapshot": "Exiger les instantanés du système de fichiers", "capSessionContinuation": "Exiger la continuité de session", "capCrossNodeRestore": "Exiger la restauration sur un autre nœud"});
Object.assign(fr.tips.resources.deployments, {"capIsolation": "Les exécutions attendent un worker avec ces capacités. Choisissez KubernetesJob pour l’isolation par conteneur. Les capacités indisponibles maintiennent les exécutions en attente.", "capColdStartClass": "Les exécutions attendent un worker avec ces capacités. Choisissez KubernetesJob pour l’isolation par conteneur. Les capacités indisponibles maintiennent les exécutions en attente.", "capEgressControl": "Les exécutions attendent un worker avec ces capacités. Choisissez KubernetesJob pour l’isolation par conteneur. Les capacités indisponibles maintiennent les exécutions en attente.", "capFilesystemSnapshot": "Les exécutions attendent un worker avec ces capacités. Choisissez KubernetesJob pour l’isolation par conteneur. Les capacités indisponibles maintiennent les exécutions en attente.", "capSessionContinuation": "Les exécutions attendent un worker avec ces capacités. Choisissez KubernetesJob pour l’isolation par conteneur. Les capacités indisponibles maintiennent les exécutions en attente.", "capCrossNodeRestore": "Les exécutions attendent un worker avec ces capacités. Choisissez KubernetesJob pour l’isolation par conteneur. Les capacités indisponibles maintiennent les exécutions en attente."});
fr.resources.deployments.hints.capabilities = "Les exécutions attendent un worker avec ces capacités. Choisissez KubernetesJob pour l’isolation par conteneur. Les capacités indisponibles maintiennent les exécutions en attente.";
fr.resources.nodes.columns.executorCapabilities = "Capacités d’exécution";
fr.tips.resources.nodes.executorCapabilities = "Les exécutions attendent un worker avec ces capacités. Choisissez KubernetesJob pour l’isolation par conteneur. Les capacités indisponibles maintiennent les exécutions en attente.";
fr.enums.executorIsolation = {"Process": "Processus", "Container": "Conteneur", "SandboxedRuntime": "Environnement isolé"};
fr.enums.executorColdStart = {"Immediate": "Immédiat", "Cold": "À froid", "Warm": "Préparé"};
// Artifact collection and browsing (P12.8).
fr.nav.items.artifacts = { label: "Fichiers", tip: "Fichiers collectés après les exécutions." };
fr.resources.artifacts = { ...fr.resources.artifactStores, title: "Fichiers", subtitle: "Fichiers collectés après les exécutions.", view: "Fichiers", deleteTitle: "Fichiers", emptyTitle: "Fichiers", emptyBody: "Configurez un stockage et des motifs explicites dans le déploiement pour collecter des fichiers.", columns: {"name": "Nom", "runId": "Exécution", "artifactStoreId": "Stockage", "mediaType": "Type de contenu", "sizeBytes": "Octets", "sha256": "Empreinte SHA-256", "createdUtc": "Créé", "id": "ID", "leaseEpoch": "Époque du bail", "repairAttempt": "Tentative de réparation"}, fields: {"name": "Nom", "runId": "Exécution", "artifactStoreId": "Stockage", "mediaType": "Type de contenu", "sizeBytes": "Octets", "sha256": "Empreinte SHA-256", "createdUtc": "Créé", "id": "ID", "leaseEpoch": "Époque du bail", "repairAttempt": "Tentative de réparation"}, actions: { download: "Télécharger" } };
fr.tips.resources.artifacts = { ...{"name": "Fichiers collectés après les exécutions. Nom", "runId": "Fichiers collectés après les exécutions. Exécution", "artifactStoreId": "Fichiers collectés après les exécutions. Stockage", "mediaType": "Fichiers collectés après les exécutions. Type de contenu", "sizeBytes": "Fichiers collectés après les exécutions. Octets", "sha256": "Fichiers collectés après les exécutions. SHA-256", "createdUtc": "Fichiers collectés après les exécutions. Créé", "id": "Fichiers collectés après les exécutions. ID", "leaseEpoch": "Fichiers collectés après les exécutions. Époque du bail", "repairAttempt": "Fichiers collectés après les exécutions. Tentative de réparation"}, actions: { download: "Téléchargez ce fichier avec un lien temporaire." }, filters: { runId: "Exécution", storeId: "Stockage" } };
Object.assign(fr.resources.artifactStores.fields, {"pathPrefix": "Préfixe du chemin", "bucket": "Compartiment S3", "endpoint": "Point de terminaison", "region": "Région", "secretId": "Identifiant secret", "forcePathStyle": "Requêtes par chemin"});
Object.assign(fr.tips.resources.artifactStores, {"pathPrefix": "Endpoint S3 facultatif ; vide utilise AWS. Stockez les identifiants dans un secret GenericEnv au format JSON avec accessKey, secretKey et sessionToken facultatif. Sans secret, utilise les identifiants du serveur.", "bucket": "Endpoint S3 facultatif ; vide utilise AWS. Stockez les identifiants dans un secret GenericEnv au format JSON avec accessKey, secretKey et sessionToken facultatif. Sans secret, utilise les identifiants du serveur.", "endpoint": "Endpoint S3 facultatif ; vide utilise AWS. Stockez les identifiants dans un secret GenericEnv au format JSON avec accessKey, secretKey et sessionToken facultatif. Sans secret, utilise les identifiants du serveur.", "region": "Endpoint S3 facultatif ; vide utilise AWS. Stockez les identifiants dans un secret GenericEnv au format JSON avec accessKey, secretKey et sessionToken facultatif. Sans secret, utilise les identifiants du serveur.", "secretId": "Endpoint S3 facultatif ; vide utilise AWS. Stockez les identifiants dans un secret GenericEnv au format JSON avec accessKey, secretKey et sessionToken facultatif. Sans secret, utilise les identifiants du serveur.", "forcePathStyle": "Endpoint S3 facultatif ; vide utilise AWS. Stockez les identifiants dans un secret GenericEnv au format JSON avec accessKey, secretKey et sessionToken facultatif. Sans secret, utilise les identifiants du serveur."});
fr.resources.deployments.fields.artifactGlobs = "Motifs de collecte";
fr.tips.resources.deployments.artifactGlobs = "Collectez uniquement les fichiers relatifs correspondants, par exemple reports/**/*.json. Une liste vide désactive la collecte.";
fr.resources.deployments.hints.artifactGlobs = "Collectez uniquement les fichiers relatifs correspondants, par exemple reports/**/*.json. Une liste vide désactive la collecte.";
Object.assign(fr.common.eventCodes, { ArtifactCollectionWarning: "Avertissement de collecte", ArtifactsCollected: "Fichiers collectés" });
fr.tips.nav.tabs.artifacts = fr.nav.items.artifacts.tip + " " + fr.tips.resources.artifacts.actions.download;
Object.assign(fr.components.mcpTest, {"worker": "Nœud worker", "chooseWorker": "Sélectionnez un worker prêt. La commande configurée y liste les outils ; aucun outil n’est exécuté.", "runTest": "Lancer le test"});
export default fr;

fr.views.settings.groups.Leases = "Baux de coordination";
fr.views.settings.fields.Leases = {"Provider": "Fournisseur", "ClutchEndpoint": "Point de connexion Clutch", "ClutchAccessKey": "Clé d’accès Clutch", "KeyPrefix": "Préfixe des clés", "RequestTimeoutMs": "Délai de requête (ms)", "SweepIntervalMs": "Intervalle de contrôle (ms)", "MaxLeaseMs": "Bail maximal (ms)", "MaxHoldMs": "Maintien maximal (ms)"};

fr.enums.harnessType.ProviderApi = "API du fournisseur";
fr.enums.outputParser.ProviderApiJsonl = "JSONL API du fournisseur";
fr.enums.harnessType.OpenCode = "opencode";
fr.enums.harnessType.Pi = "pi";
fr.enums.outputParser.OpenCodeJsonl = "opencode JSONL";
fr.enums.outputParser.PiJsonl = "pi JSONL";
fr.enums.mcpConfigFormat.OpenCodeJson = "opencode JSON";
fr.enums.mcpConfigFormat.PiJson = "pi JSON";

// Pipelines (P12.9) : définitions (Agents > Pipelines), exécutions de pipeline (Exécutions > Exécutions de pipeline)
// et revues d'étape (Approbations > Revues d'étape).
fr.nav.hubs.approvals.tip = "Appels d'outil et étapes de pipeline en attente d'une personne, et toutes les décisions";
Object.assign(fr.nav, { approvalsPending_one: "{{count}} élément en attente d'une personne", approvalsPending_many: "{{count}} éléments en attente d'une personne", approvalsPending_other: "{{count}} éléments en attente d'une personne" });
Object.assign(fr.nav.items, {
  pipelines: { label: "Pipelines d'agents", tip: "Étapes d'agents ordonnées avec des points de revue facultatifs" },
  pipelineRuns: { label: "Exécutions de pipeline", tip: "Exécutions des pipelines, étape par étape" },
  pipelineReviews: { label: "Revues d'étape", tip: "Étapes de pipeline qui attendent la revue d'une personne" }
});
Object.assign(fr.errorCodes, {
  RevisionLimitReached: "Cette étape a déjà utilisé toutes ses révisions : il n'est plus possible de demander des modifications. Approuvez-la ou rejetez-la.",
  ReviewNotPending: "Cette revue a déjà été décidée, par quelqu'un d'autre ou par son délai d'expiration, et ne peut plus l'être à nouveau.",
  PipelineInUse: "Ce pipeline a des exécutions non terminées. Attendez qu'elles se terminent, ou annulez-les, puis supprimez le pipeline.",
  PipelineRunActive: "Seules les exécutions de pipeline terminées peuvent être supprimées. Annulez d'abord cette exécution de pipeline.",
  PipelineRunFinished: "Cette exécution de pipeline est déjà terminée et ne peut donc pas être annulée.",
  PipelineRunNotRetryable: "Seules les exécutions de pipeline échouées, expirées ou annulées peuvent être relancées.",
  PipelineRunChanged: "Cette exécution de pipeline a changé pendant le traitement de la requête. Rechargez-la et réessayez.",
  PipelineInactive: "Ce pipeline est inactif. Activez-le avant de le démarrer.",
  PipelineEmpty: "Un pipeline doit comporter au moins une étape.",
  PipelineStageRun: "Cette exécution est une étape d'une exécution de pipeline : elle ne peut pas être relancée seule. Relancez plutôt l'exécution de pipeline.",
  ReferencedByPipeline: "Une étape de pipeline utilise cet agent. Retirez l'agent de tous les pipelines avant de le supprimer."
});
fr.enums.pipelineRunStatus = { Running: "En cours", AwaitingReview: "En attente de revue", Cancelling: "Annulation en cours", Succeeded: "Réussie", Failed: "Échouée", Cancelled: "Annulée", TimedOut: "Expirée" };
fr.enums.pipelineRunOutcome = { None: "Aucun", Succeeded: "Réussite", StageFailed: "Échec d'une étape", StageStartFailed: "Étape impossible à démarrer", ReviewRejected: "Revue rejetée", ReviewExpired: "Revue expirée", Cancelled: "Annulée", TimedOut: "Délai dépassé", InternalError: "Erreur interne" };
fr.enums.pipelineStageStatus = { Pending: "En attente", Running: "En cours", AwaitingReview: "En attente de revue", Succeeded: "Réussie", Failed: "Échouée", Cancelled: "Annulée" };
fr.enums.pipelineReviewStatus = { Pending: "En attente", Approved: "Approuvée", ChangesRequested: "Modifications demandées", Rejected: "Rejetée", Expired: "Expirée", Cancelled: "Annulée" };
fr.enums.pipelineReviewDecision = { Approve: "Approuver", RequestChanges: "Demander des modifications", Reject: "Rejeter" };
fr.enums.pipelineReviewSource = { User: "Personne", Timeout: "Délai d'expiration", Cancelled: "Exécution de pipeline arrêtée" };
Object.assign(fr.enums.resourceType, { Pipeline: "Pipeline d'agents", PipelineRun: "Exécution de pipeline" });
Object.assign(fr.enums.auditEventType, { PipelineReviewDecided: "Revue d'étape décidée", PipelineRunCancelled: "Exécution de pipeline annulée" });
fr.resources.deployments.promptRoles.PipelineStage = "Étape de pipeline (transmission)";
Object.assign(fr.resources.runs.columns, { pipelineRunId: "Exécution de pipeline" });
fr.resources.runs.pipelineStage = "étape {{position}}, exécution {{execution}}";
fr.resources.pipelines = {
  ...rp("Pipelines d'agents", "Étapes d'agents ordonnées : chaque étape exécute un agent et transmet sa sortie à la suivante, avec des points de revue facultatifs.", "Ajouter un pipeline", "Créer un pipeline", "Modifier le pipeline", "Détails du pipeline", "Supprimer le pipeline", "Aucun pipeline pour l'instant", "Créez un pipeline pour enchaîner des agents : chaque étape reçoit la sortie de l'étape précédente."),
  columns: { name: "Nom", stages: "Étapes", reviewGates: "Points de revue", maxDurationSeconds: "Durée maximale", version: "Version", active: "Active", description: "Description", id: "ID", lastUpdateUtc: "Mis à jour", createdUtc: "Créé" },
  fields: {
    name: "Nom",
    description: "Description",
    maxDurationSeconds: "Durée maximale (secondes)",
    active: "Active",
    stages: "Étapes",
    stageName: "Nom de l'étape",
    agentId: "Agent",
    deploymentId: "Déploiement",
    handoffTemplateId: "Modèle de transmission",
    handoffTemplateVersion: "Version de modèle épinglée",
    outputCharLimit: "Limite de caractères transmis",
    maxAttempts: "Nombre maximal de tentatives",
    continueOnFailure: "Continuer en cas d'échec",
    requiresReview: "Revue requise",
    reviewTimeoutSeconds: "Délai de revue (secondes)",
    reviewTimeoutAction: "À l'expiration de la revue",
    maxRevisions: "Nombre maximal de révisions",
    stageDescription: "Description de l'étape",
    parameters: "Paramètres d'exécution"
  },
  hints: {
    maxDurationSeconds: "De {{min}} à {{max}}. 0 signifie aucune limite. La limite couvre toute l'exécution du pipeline, y compris le temps d'attente des revues.",
    stages: "Les étapes s'exécutent dans cet ordre. Chaque étape démarre quand la précédente réussit (ou échoue avec Continuer en cas d'échec) et, si elle exige une revue, après qu'une personne l'a approuvée.",
    noDeployments: "Cet agent n'a pas encore de déploiement. Laissez le déploiement vide ou ajoutez-en un dans Déploiements.",
    handoffTemplateVersion: "Vide : utilise la version actuelle du modèle.",
    outputCharLimit: "De {{min}} à {{max}}. Par défaut {{default}}.",
    maxAttempts: "De {{min}} à {{max}}. Par défaut {{default}}.",
    reviewTimeoutSeconds: "De {{min}} à {{max}}. 0 attend indéfiniment.",
    maxRevisions: "De {{min}} à {{max}}. Par défaut {{default}}.",
    parameters: "Uniquement avec un déploiement, et seulement pour les paramètres que ce déploiement permet de remplacer."
  },
  errors: {
    dnsName: "Utilisez de 1 à 64 lettres minuscules, chiffres et tirets, en commençant et en terminant par une lettre ou un chiffre.",
    range: "Saisissez un nombre entier de {{min}} à {{max}}.",
    noStages: "Ajoutez au moins une étape.",
    tooManyStages: "Un pipeline comporte au plus {{max}} étapes.",
    stageNameLong: "Les noms d'étape sont limités à 128 caractères.",
    stageNameDuplicate: "Une autre étape s'appelle déjà {{name}}.",
    version: "Saisissez un numéro de version supérieur ou égal à 1, ou laissez vide.",
    parametersNeedDeployment: "Les paramètres d'exécution exigent un déploiement, car ils sont vérifiés par rapport aux remplacements qu'il autorise.",
    parametersUnique: "Chaque nom de paramètre ne peut apparaître qu'une fois.",
    stageInvalid: "cette étape contient des erreurs."
  },
  actions: { start: "Démarrer", preview: "Aperçu des prompts", runs: "Voir les exécutions de pipeline" },
  stageHeading: "Étape {{position}} : {{name}}",
  stageCount: "{{count}} sur {{max}} au plus",
  stageSummary: "{{count}} étapes : {{chain}}",
  addStage: "Ajouter une étape",
  removeStage: "Supprimer l'étape",
  noStages: "Aucune étape pour l'instant.",
  chooseAgent: "Choisissez un agent",
  anyDeployment: "Tout déploiement actif (pondéré)",
  defaultHandoff: "Liaison du déploiement ou modèle intégré",
  parameterName: "Paramètre",
  parameterValue: "Valeur",
  noLimit: "Aucune limite",
  versionNotice: "Version {{version}}. L'enregistrement crée une nouvelle version ; les exécutions de pipeline déjà démarrées gardent leurs étapes d'origine."
};
fr.resources.pipelineRuns = {
  ...rp("Exécutions de pipeline", "Chaque exécution d'un pipeline. Ouvrez-en une pour suivre ses étapes, décider ses revues, ou l'annuler et la relancer.", "Ajouter une exécution de pipeline", "Créer une exécution de pipeline", "Modifier l'exécution de pipeline", "Détails de l'exécution de pipeline", "Supprimer l'exécution de pipeline", "Aucune exécution de pipeline pour l'instant", "Démarrez un pipeline depuis Agents > Pipelines pour voir ses exécutions ici."),
  columns: { id: "ID", pipelineName: "Pipeline d'agents", status: "État", outcome: "Résultat", progress: "Étape", callerName: "Démarrée par", errorMessage: "Erreur", priority: "Priorité", deadlineUtc: "Échéance", completedUtc: "Terminée", createdUtc: "Créée" },
  actions: { cancel: "Annuler", retry: "Relancer", stageRuns: "Voir les exécutions d'étape", finalRun: "Ouvrir l'exécution finale" },
  toasts: { cancelRequested: "Annulation demandée pour l'exécution de pipeline et son étape en cours.", retried: "L'exécution de pipeline reprend à l'étape où elle s'est arrêtée." },
  progressValue: "{{position}} sur {{count}}",
  versionShort: "(version n° {{version}})"
};
fr.resources.pipelineReviews = {
  ...rp("Revues d'étape", "Étapes de pipeline qui attendent qu'une personne les approuve, demande des modifications ou les rejette.", "Ajouter une revue d'étape", "Créer une revue d'étape", "Modifier la revue d'étape", "Détails de la revue d'étape", "Supprimer la revue d'étape", "Aucune revue d'étape pour l'instant", "Les étapes qui exigent une revue apparaissent ici une fois terminées."),
  columns: { createdUtc: "Demandée", pipelineName: "Pipeline d'agents", stageName: "Étape", status: "État", decision: "Décision", decisionSource: "Décidée par", comment: "Commentaire", decidedBy: "Relecteur", expiresUtc: "Expiration", pipelineRunId: "Exécution de pipeline", runId: "Exécution d'étape", decidedUtc: "Décidée", id: "ID" },
  filters: { pipelineRunId: "ID de l'exécution de pipeline", pipelineRunIdPlaceholder: "ID de l'exécution de pipeline (plr_...)" },
  actions: { approve: "Approuver", requestChanges: "Demander des modifications", reject: "Rejeter", openStageRun: "Ouvrir l'exécution d'étape" },
  noTimeout: "Attend indéfiniment"
};
fr.components.pipelineReviews = {
  decideTitle: "Revue de l'étape {{stage}} de {{pipeline}}",
  decision: "Décision",
  positionExecution: "étape {{position}}, exécution {{execution}}",
  revisionsLeft: "Révisions restantes",
  revisionsLeftValue: "{{left}} sur {{max}}",
  noRevisionsLeft: "Cette étape a utilisé ses {{max}} révisions. Le serveur refusera Demander des modifications ; approuvez-la ou rejetez-la.",
  timeoutThen: "puis {{decision}}",
  commentApprove: "Notes pour l'étape suivante",
  commentApprovePlaceholder: "Facultatif. L'étape suivante reçoit ces notes avec la sortie.",
  commentRequestChanges: "Ce qui doit changer",
  commentRequestChangesPlaceholder: "Obligatoire. L'étape s'exécute à nouveau avec ce retour.",
  commentReject: "Motif",
  commentRejectPlaceholder: "Facultatif. Enregistré avec la décision ; l'exécution de pipeline échoue.",
  commentRequired: "Décrivez ce qui doit changer. L'étape s'exécute à nouveau avec ce retour.",
  commentTooLong: "Les commentaires sont limités à {{max}} caractères.",
  submit: { Approve: "Approuver l'étape", RequestChanges: "Demander des modifications", Reject: "Rejeter l'étape" },
  toasts: {
    Approve: "Étape {{stage}} de {{pipeline}} approuvée.",
    RequestChanges: "Modifications demandées pour l'étape {{stage}} de {{pipeline}} ; elle s'exécute à nouveau avec votre retour.",
    Reject: "Étape {{stage}} de {{pipeline}} rejetée ; l'exécution de pipeline échoue.",
    notPending: "Cette revue a déjà été décidée, par quelqu'un d'autre ou par son délai d'expiration. La liste affiche maintenant l'état actuel.",
    revisionLimit: "Cette étape a déjà utilisé toutes ses révisions (maximum {{max}}) : il n'est plus possible de demander des modifications. Approuvez-la ou rejetez-la."
  }
};
fr.components.pipelineStart = {
  title: "Démarrer {{name}}",
  intro_one: "L'entrée est transmise à l'unique étape du pipeline.",
  intro_many: "L'entrée est transmise à la première des {{count}} étapes ; chaque étape la voit aussi comme tâche d'origine.",
  intro_other: "L'entrée est transmise à la première des {{count}} étapes ; chaque étape la voit aussi comme tâche d'origine.",
  input: "Entrée",
  inputPlaceholder: "Sur quoi le pipeline doit-il travailler ?",
  shortcut: "Appuyez sur Ctrl+Entrée ou Cmd+Entrée pour démarrer.",
  submit: "Démarrer le pipeline",
  starting: "Démarrage...",
  started: "{{name}} démarré."
};
fr.components.pipelinePreview = {
  title: "Aperçu des prompts de {{name}}",
  input: "Entrée d'exemple",
  sampleInput: "Résume les tickets ouverts et propose un correctif pour le plus urgent.",
  sampleOutput: "Sortie d'exemple de {{stage}}.",
  outputOf: "Sortie d'exemple de l'étape {{position}} ({{stage}})",
  render: "Générer les prompts",
  rendering: "Génération...",
  stageHeading: "Étape {{position}} : {{stage}} ({{agent}})",
  deployment: "Déploiement : {{deployment}}",
  rendered: "Généré",
  failed: "Échec"
};
fr.views.pipelineRunDetail = {
  title: "Exécution de pipeline",
  heading: "Exécution de pipeline de {{pipeline}}",
  notFoundTitle: "Exécution de pipeline introuvable",
  notFoundBody: "Elle a peut-être été supprimée, ou elle appartient à un autre locataire.",
  live: "En direct",
  polling: "Actualisation",
  finalRun: "Exécution finale",
  started: "Démarrée",
  input: "Entrée",
  reviewTitle: "En attente de votre revue",
  reviewBody: "L'étape {{position}} ({{stage}}) a terminé l'exécution {{execution}} et attend une revue. Lisez sa sortie dans l'exécution d'étape :",
  reviewExpires: "Si personne ne décide avant {{time}}, la revue est décidée automatiquement : {{decision}}.",
  reviewNoTimeout: "La revue attend qu'une personne décide, sauf si la durée maximale du pipeline met fin à l'exécution avant.",
  stages: "Étapes",
  stagesCount_one: "{{count}} étape",
  stagesCount_many: "{{count}} étapes",
  stagesCount_other: "{{count}} étapes",
  noStages: "Cette exécution de pipeline n'a aucune étape.",
  current: "En cours",
  reviewGate: "Point de revue",
  agent: "Agent : {{agent}}",
  counts: "Exécutions {{executions}}, tentatives {{attempts}} sur {{maxAttempts}}, révisions {{revisions}} sur {{maxRevisions}}",
  startedAt: "démarrée",
  blocked: "En attente de démarrage : {{reason}}.",
  nextAttempt: "Prochaine tentative à {{time}}.",
  reviewItem: "Revue de l'exécution {{execution}}",
  columns: { execution: "Exécution", run: "Exécution d'étape", status: "État", outcome: "Résultat", error: "Erreur", created: "Créée" },
  confirmCancelTitle: "Annuler l'exécution de pipeline",
  confirmCancel: "Annuler cette exécution de pipeline de {{pipeline}} ? Son exécution d'étape en cours est annulée et une revue en attente est fermée. Vous pourrez la relancer plus tard.",
  confirmDelete: "Supprimer cette exécution de pipeline de {{pipeline}} et ses revues ? Ses exécutions d'étape restent sur la page Exécutions."
};
Object.assign(fr.views.runDetail, { pipelineRun: "Exécution de pipeline" });
fr.views.settings.fields.Runtime.PipelineSweepIntervalMs = "Intervalle de balayage des pipelines (ms)";
fr.views.settings.fields.Runtime.PipelineMaxStages = "Nombre maximal d'étapes par pipeline";

// Deployment trust level (P11.14).
fr.enums.trustLevel = { Trusted: "De confiance", Untrusted: "Non fiable" };
fr.enums.runBlockedReason.NoIsolatingWorker = "Aucun worker isolant";
fr.components.blocked.reasons.NoIsolatingWorker = "Cette exécution est non fiable et exige une isolation par conteneur, mais aucun worker prêt capable d'exécuter {{harness}} ne la propose. Ajoutez un worker avec l'exécuteur Job Kubernetes, dans un cluster où il peut créer des Jobs.";
fr.tips.enums.runBlockedReason.NoIsolatingWorker = "Bloquée : cette exécution non fiable exige une isolation par conteneur, et aucun worker prêt avec son harness ne la propose. Elle attend dans la file jusqu'à ce qu'un worker avec l'exécuteur Job Kubernetes s'enregistre.";
fr.tips.enums.trustLevel = { Trusted: "Les entrées viennent uniquement d'appelants de confiance. Les exécutions peuvent utiliser l'exécuteur Process, qui n'est pas isolé des autres exécutions ni du worker.", Untrusted: "Les entrées peuvent venir de sources non fiables. Les exécutions ne vont qu'à un exécuteur avec une isolation par conteneur ou plus forte, et attendent dans la file qu'il y en ait un." };
Object.assign(fr.common.fieldCodes, { TenantRequiresUntrusted: "Ce locataire exige que chaque déploiement soit non fiable.", UntrustedNeedsIsolation: "Un déploiement non fiable ne peut pas utiliser l'exécuteur Process. Choisissez Job Kubernetes ou laissez l'exécuteur vide." });
fr.resources.deployments.fields.trustLevel = "Niveau de confiance";
fr.resources.deployments.columns.trustLevel = "Niveau de confiance";
fr.resources.deployments.hints.trustLevel = "Choisissez Non fiable quand les appelants ou le contenu peuvent être non fiables. Ces exécutions exigent une isolation par conteneur : un exécuteur vide signifie alors Job Kubernetes, et les exécutions attendent qu'un worker puisse les isoler.";
fr.tips.resources.deployments.trustLevel = "De confiance autorise l'exécuteur Process, qui n'est pas isolé. Non fiable ne s'exécute que sur un exécuteur avec une isolation par conteneur ou plus forte.";
fr.tips.resources.deployments.trustFlagged = "Ce locataire exige des déploiements non fiables. Ce déploiement était de confiance avant l'activation de la règle : il continue de fonctionner tel quel, mais doit passer à Non fiable lors du prochain enregistrement.";
fr.resources.deployments.trust = { tenantRequiresUntrusted: "Ce locataire exige des déploiements non fiables. Passez le niveau de confiance à Non fiable pour enregistrer ce déploiement.", untrustedProcess: "Les déploiements non fiables ne peuvent pas utiliser l'exécuteur Process. Choisissez Job Kubernetes ou laissez l'exécuteur vide.", flagged: "De confiance, la règle exige Non fiable" };
fr.resources.tenants.fields.requireUntrustedDeployments = "Exiger des déploiements non fiables";
fr.resources.tenants.columns.requireUntrustedDeployments = "Exige Non fiable";
fr.resources.tenants.hints = { ...(fr.resources.tenants.hints || {}), requireUntrustedDeployments: "La création ou l'enregistrement d'un déploiement de confiance est refusé. Les déploiements de confiance existants continuent de fonctionner et restent signalés jusqu'à leur enregistrement comme non fiables." };
fr.tips.resources.tenants.requireUntrustedDeployments = "Si activé, chaque déploiement de ce locataire doit être non fiable, afin que ses exécutions n'aillent qu'à des exécuteurs isolés.";
fr.views.runDetail.trustLevel = "Niveau de confiance";
fr.tips.views.runDetail.trustLevel = "Le niveau de confiance du déploiement au moment où cette exécution est entrée dans la file. Les exécutions non fiables ne vont qu'à un exécuteur avec une isolation par conteneur ou plus forte.";

// Deployment effect policy (P12.29).
fr.enums.effectPolicy = { AtMostOnce: "Au plus une fois", AtLeastOnce: "Au moins une fois", Journaled: "Journalisée" };
fr.tips.enums.effectPolicy = { AtMostOnce: "Si le worker est perdu après le démarrage de l'exécution, celle-ci échoue avec Nœud perdu et n'est jamais relancée. Aucun effet externe ne se produit deux fois. La valeur par défaut.", AtLeastOnce: "Si le worker est perdu après le démarrage de l'exécution, celle-ci revient dans la file tant qu'il reste des tentatives. Les effets déjà produits par la tentative perdue (un push, un message) peuvent se reproduire.", Journaled: "Remet en file uniquement si chaque effet est passé par le journal des effets. Ce journal n'existe pas encore, donc cette politique se comporte comme Au plus une fois." };
Object.assign(fr.common.fieldCodes, { EffectPolicyConflict: "La politique d'effets contredit la valeur obsolète retryOnNodeLoss. Envoyez seulement la politique d'effets." });
fr.resources.deployments.fields.effectPolicy = "Politique d'effets";
fr.resources.deployments.columns.effectPolicy = "Politique d'effets";
fr.resources.deployments.hints.effectPolicy = "Au plus une fois (par défaut) fait échouer avec Nœud perdu une exécution démarrée dont le worker est perdu. Au moins une fois la remet en file tant qu'il reste des tentatives et peut répéter des effets. Journalisée se comporte comme Au plus une fois tant que le journal des effets n'existe pas. Une exécution jamais démarrée est toujours remise en file.";
fr.tips.resources.deployments.effectPolicy = "Ce qui arrive à une exécution démarrée quand son worker est perdu : échec (Au plus une fois), remise en file (Au moins une fois) ou Journalisée, qui se comporte pour l'instant comme Au plus une fois.";
fr.views.runDetail.effectPolicy = "Politique d'effets";
fr.tips.views.runDetail.effectPolicy = "La politique d'effets du déploiement au moment où cette exécution a été mise en file. Elle décide de ce qui arrive si le worker de l'exécution est perdu ; les modifications ultérieures du déploiement ne la concernent pas.";
fr.views.settings.fields.Scheduling.QueueWakeFanout = "Sondages réveillés par réplique";
fr.views.settings.fields.Scheduling.RemoteWakeDelayMs = "Retenue des réveils distants (ms)";
fr.views.settings.fields.Auth.CacheSeconds = "Durée du cache d’authentification (secondes)";

// Deployment egress allowlists (P11.15).
fr.resources.deployments.fields.egressRules = "Liste de sortie autorisée";
fr.resources.deployments.fields.egressCidr = "Bloc CIDR";
fr.resources.deployments.fields.egressPort = "Port de destination";
fr.resources.deployments.fields.egressProtocol = "Protocole";
fr.resources.deployments.columns.egressRules = "Sortie";
fr.resources.deployments.hints.egressRules = "Laissez vide pour utiliser la sortie par défaut du cluster pour les exécutions (HTTPS vers n'importe quelle destination). Avec des règles, les pods d'exécution n'atteignent que le DNS, le port MCP de Garrison et ces blocs, et les exécutions ont besoin d'un worker Kubernetes qui les applique. Saisissez des blocs CIDR, pas des noms d'hôte ; résolvez vous-même les noms en adresses. Un port vide autorise tous les ports. 64 règles au maximum.";
fr.resources.deployments.egress = {"add": "Ajouter une règle de sortie", "allPorts": "Tous les ports", "default": "Par défaut", "count_one": "Liste autorisée, {{count}} règle", "count_other": "Liste autorisée, {{count}} règles", "note_one": "Ce déploiement a {{count}} règle de sortie. Ses exécutions ne tournent que sur des workers Kubernetes dont les listes de sortie sont activées, dans un pod dont la NetworkPolicy n'autorise que le DNS, le port MCP de Garrison et la règle. Si aucun worker de ce type n'est prêt, les exécutions attendent dans la file (Aucun worker isolant) ; elles ne tournent jamais sans la liste autorisée.", "note_other": "Ce déploiement a {{count}} règles de sortie. Ses exécutions ne tournent que sur des workers Kubernetes dont les listes de sortie sont activées, dans un pod dont la NetworkPolicy n'autorise que le DNS, le port MCP de Garrison et les règles. Si aucun worker de ce type n'est prêt, les exécutions attendent dans la file (Aucun worker isolant) ; elles ne tournent jamais sans la liste autorisée.", "errors": {"cidrRequired": "Saisissez un bloc CIDR, par exemple 203.0.113.0/24.", "cidrFormat": "Utilisez la notation CIDR avec une longueur de préfixe, par exemple 198.51.100.7/32. Les noms d'hôte ne sont pas acceptés.", "cidrAddress": "L'adresse n'est pas une adresse IPv4 ou IPv6 valide.", "cidrPrefix": "La longueur de préfixe est hors limites (0 à 32 pour IPv4, 0 à 128 pour IPv6).", "cidrMapped": "Les adresses IPv6 mappées IPv4 ne sont pas autorisées ; saisissez plutôt le bloc IPv4.", "cidrHostBits": "L'adresse a des bits définis après le préfixe ; utilisez l'adresse réseau du bloc."}};
Object.assign(fr.common.fieldCodes, {"InvalidCidr": "Bloc CIDR non valide.", "PortOutOfRange": "Le port doit être compris entre 1 et 65535, ou vide pour tous les ports.", "InvalidProtocol": "Protocole inconnu ; utilisez TCP ou UDP.", "TooManyEgressRules": "Un déploiement peut avoir au plus 64 règles de sortie.", "EgressRulesNeedKubernetesJob": "Les règles de sortie ne sont appliquées qu'aux exécutions Job Kubernetes. Choisissez Job Kubernetes ou laissez l'exécuteur vide.", "EgressRulesNeedColdStart": "Les règles de sortie demandent un démarrage à froid, car les pods préchauffés tournent déjà avec la sortie par défaut. Videz la classe de démarrage ou choisissez À froid."});
fr.components.blocked.reasons.NoIsolatingWorkerEgress = "Le déploiement de cette exécution a une liste de sortie autorisée que seul un worker Kubernetes dont les listes de sortie sont activées peut appliquer, et aucun worker prêt capable d'exécuter {{harness}} ne le propose. L'exécution attend dans la file et ne tourne jamais sans la liste. Activez les listes de sortie sur un worker Job Kubernetes, dans un cluster dont le plugin réseau applique NetworkPolicy.";
fr.tips.enums.runBlockedReason.NoIsolatingWorker = "Bloquée : cette exécution a besoin d'un worker isolant (isolation par conteneur pour une exécution non fiable, ou contrôle de sortie pour un déploiement avec liste de sortie autorisée), et aucun worker prêt avec son harness ne le propose. Elle attend dans la file jusqu'à l'inscription d'un worker Job Kubernetes adapté.";
fr.tips.resources.deployments.egressRules = "Destinations que les pods d'exécution de ce déploiement peuvent atteindre, sous forme de blocs CIDR avec port et protocole facultatifs. Vide utilise la sortie par défaut.";
fr.tips.resources.deployments.egressRulesItems = {"cidr": "Bloc de destination en notation CIDR, IPv4 ou IPv6, par exemple 203.0.113.0/24. Résolvez vous-même les noms d'hôte en adresses.", "port": "Port de destination de 1 à 65535. Laissez vide pour autoriser tous les ports du bloc.", "protocol": "TCP pour la plupart des services, ou UDP."};
fr.tips.resources.deployments.egressDefault = "Aucune liste de sortie autorisée : les pods d'exécution utilisent la sortie par défaut du cluster.";

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
})(fr, {
 "nav": {
  "items": {
   "triggers": {
    "label": "Déclencheurs",
    "tip": "Planifications cron et webhooks signés qui lancent des exécutions"
   },
   "notifications": {
    "label": "Notifications sortantes",
    "tip": "Webhooks signés sur les exécutions, pipelines et approbations"
   }
  }
 },
 "enums": {
  "triggerType": {
   "Cron": "Planification cron",
   "Webhook": "Webhook signé"
  },
  "triggerTargetType": {
   "Agent": "Exécution d'agent",
   "Pipeline": "Exécution de pipeline"
  },
  "triggerFireSource": {
   "Cron": "Planification",
   "Webhook": "Livraison de webhook",
   "Manual": "Déclenché à la main"
  },
  "triggerFireOutcome": {
   "Started": "Lancé",
   "Failed": "Échoué",
   "Skipped": "Ignoré"
  },
  "notificationEvent": {
   "RunSucceeded": "Exécution réussie",
   "RunFailed": "Exécution échouée",
   "RunCancelled": "Exécution annulée",
   "RunTimedOut": "Exécution hors délai",
   "PipelineCompleted": "Pipeline terminé",
   "PipelineFailed": "Pipeline échoué",
   "ApprovalRequested": "Approbation demandée",
   "Test": "Notification d'essai"
  },
  "notificationDeliveryStatus": {
   "Pending": "En attente",
   "Delivering": "En cours de livraison",
   "Succeeded": "Livrée",
   "Failed": "Abandonnée"
  },
  "runKind": {
   "Invoke": "Appel",
   "Delegated": "Déléguée",
   "Test": "Exécution d'essai",
   "Retry": "Nouvelle tentative",
   "Pipeline": "Étape de pipeline",
   "Trigger": "Lancée par un déclencheur"
  },
  "resourceType": {
   "Trigger": "Déclencheur",
   "NotificationEndpoint": "Point de terminaison de notification"
  },
  "auditEventType": {
   "SigningSecretRotated": "Secret de signature renouvelé"
  }
 },
 "errorCodes": {
  "ReferencedByTrigger": "Un déclencheur utilise cet enregistrement. Modifiez ou supprimez d'abord ce déclencheur.",
  "ReferencedByNotificationEndpoint": "Un point de terminaison de notification filtre sur cet enregistrement. Modifiez ou supprimez-le d'abord.",
  "NotAWebhookTrigger": "Seuls les déclencheurs webhook ont un secret de signature.",
  "TriggerInactive": "Ce déclencheur est inactif.",
  "InvalidSignature": "La signature du webhook est absente, mal formée, trop ancienne ou ne correspond pas.",
  "PayloadTooLarge": "La charge utile dépasse ce que le serveur accepte."
 },
 "common": {
  "fieldCodes": {
   "InvalidUrl": "Saisissez une URL HTTP ou HTTPS absolue, sans nom d'utilisateur ni mot de passe.",
   "DestinationBlocked": "Le serveur refuse cette destination : les adresses de bouclage, privées, de lien local et de métadonnées sont bloquées sauf si un opérateur autorise les destinations privées.",
   "EventsRequired": "Choisissez au moins un événement.",
   "InvalidEvent": "L'un des événements n'est pas pris en charge.",
   "InvalidCron": "L'expression cron n'est pas valide. Utilisez cinq champs : minute, heure, jour du mois, mois et jour de la semaine.",
   "InvalidTimeZone": "Fuseau horaire inconnu. Utilisez un nom IANA comme UTC ou Europe/Paris.",
   "TypeImmutable": "Le type d'un déclencheur ne peut pas changer. Créez plutôt un nouveau déclencheur.",
   "TargetMismatch": "Ce champ n'appartient pas à la cible choisie.",
   "PayloadTooLarge": "La charge utile dépasse ce que le serveur accepte."
  }
 },
 "resources": {
  "runs": {
   "columns": {
    "triggerId": "Déclencheur",
    "kind": "Type d'exécution"
   }
  },
  "triggers": {
   "title": "Déclencheurs",
   "subtitle": "Planifications cron et webhooks signés qui lancent une exécution d'agent ou de pipeline.",
   "add": "Ajouter un déclencheur",
   "create": "Créer un déclencheur",
   "edit": "Modifier le déclencheur",
   "view": "Détails du déclencheur",
   "deleteTitle": "Supprimer le déclencheur",
   "emptyTitle": "Aucun déclencheur pour le moment",
   "emptyBody": "Créez un déclencheur pour exécuter un agent selon une planification ou quand un autre système envoie un webhook.",
   "columns": {
    "name": "Nom",
    "type": "Type",
    "target": "Lance",
    "schedule": "Planification",
    "active": "Actif",
    "lastFire": "Dernier déclenchement",
    "nextFireUtc": "Prochain déclenchement",
    "fireCount": "Déclenchements",
    "runAs": "S'exécute en tant que",
    "signingSecretLast4": "Fin du secret",
    "description": "Description",
    "id": "ID",
    "createdUtc": "Créé"
   },
   "fields": {
    "name": "Nom",
    "type": "Type",
    "description": "Description",
    "targetType": "Lance",
    "agentId": "Agent",
    "deploymentId": "Déploiement",
    "pipelineId": "Pipeline d'agents",
    "inputTemplateId": "Modèle d'entrée",
    "priority": "Priorité",
    "cronExpression": "Expression cron",
    "timeZone": "Fuseau horaire",
    "active": "Actif",
    "webhook": "URL du webhook"
   },
   "hints": {
    "type": "Le type ne peut plus changer une fois le déclencheur créé.",
    "inputTemplateId": "Un modèle Task qui produit l'entrée de l'exécution à partir des variables trigger.* et webhook.*. Vide utilise le modèle intégré trigger-input.",
    "priority": "De {{min}} à {{max}}. Les plus élevées passent en premier.",
    "cronExpression": "Cinq champs : minute, heure, jour du mois, mois, jour de la semaine. Exemple : 0 9 * * 1-5 s'exécute à 09:00 en semaine.",
    "timeZone": "Nom IANA comme UTC ou Europe/Paris. Les changements d'heure sont pris en compte.",
    "webhookNew": "L'URL du webhook et le secret de signature apparaissent après l'enregistrement. Le secret est affiché une seule fois."
   },
   "errors": {
    "name": "Utilisez de 1 à 64 lettres minuscules, chiffres et tirets, en commençant et finissant par une lettre ou un chiffre.",
    "description": "Les descriptions sont limitées à {{max}} caractères.",
    "agentRequired": "Choisissez l'agent exécuté par ce déclencheur.",
    "pipelineRequired": "Choisissez le pipeline lancé par ce déclencheur.",
    "cron": "Saisissez cinq champs (minute heure jour mois jour-de-semaine) ou une macro comme @daily.",
    "priority": "Saisissez un nombre entier de {{min}} à {{max}}."
   },
   "actions": {
    "fire": "Déclencher maintenant",
    "fires": "Historique des déclenchements",
    "runs": "Voir les exécutions",
    "rotateSecret": "Renouveler le secret"
   },
   "fires": {
    "firedUtc": "Déclenché",
    "source": "Origine",
    "outcome": "Résultat",
    "started": "Exécution lancée",
    "deliveryId": "ID de livraison",
    "error": "Erreur",
    "runId": "Exécution",
    "pipelineRunId": "Exécution de pipeline"
   },
   "confirmRotateTitle": "Renouveler le secret de signature",
   "confirmRotate": "Remplacer le secret de signature de {{name}} ? L'ancien secret cesse de fonctionner immédiatement, les expéditeurs doivent passer au nouveau.",
   "anyDeployment": "Tout déploiement actif (pondéré)",
   "builtinTemplate": "Modèle intégré trigger-input",
   "webhookSchedule": "À l'arrivée d'un webhook signé",
   "neverFired": "Pas encore déclenché",
   "runAsNotice": "S'exécute en tant que {{name}}. Si vous enregistrez des modifications, ce déclencheur s'exécutera en votre nom.",
   "secretEnding": "Le secret actuel se termine par {{last4}}."
  },
  "notifications": {
   "title": "Notifications sortantes",
   "subtitle": "Points de terminaison webhook qui reçoivent des notifications signées quand des exécutions et pipelines se terminent ou que des approbations attendent.",
   "add": "Ajouter un point de terminaison",
   "create": "Créer un point de terminaison de notification",
   "edit": "Modifier le point de terminaison de notification",
   "view": "Détails du point de terminaison de notification",
   "deleteTitle": "Supprimer le point de terminaison de notification",
   "emptyTitle": "Aucun point de terminaison de notification",
   "emptyBody": "Ajoutez un point de terminaison pour recevoir un POST HTTP signé quand une exécution échoue, qu'un pipeline se termine ou qu'une approbation attend.",
   "columns": {
    "name": "Nom",
    "url": "URL",
    "events": "Événements",
    "filters": "Filtres",
    "active": "Actif",
    "signingSecretLast4": "Fin du secret",
    "includeResultText": "Texte du résultat",
    "description": "Description",
    "id": "ID",
    "createdUtc": "Créé",
    "agent": "Agent",
    "deployment": "Déploiement"
   },
   "fields": {
    "name": "Nom",
    "description": "Description",
    "url": "URL",
    "events": "Événements",
    "agentId": "Uniquement cet agent",
    "deploymentId": "Uniquement ce déploiement",
    "includeResultText": "Inclure le texte du résultat",
    "resultTextMaxChars": "Limite du texte du résultat (caractères)",
    "active": "Actif"
   },
   "hints": {
    "url": "Une URL HTTP ou HTTPS. Les adresses de bouclage, privées et de métadonnées sont refusées sauf si un opérateur autorise les destinations privées, et les redirections ne sont pas suivies.",
    "events": "Les événements de pipeline ne sont pas envoyés tant qu'un filtre d'agent ou de déploiement est défini.",
    "agentId": "Vide envoie les événements de tous les agents.",
    "deploymentId": "Vide envoie les événements de tous les déploiements.",
    "includeResultText": "Désactivé par défaut : les notifications portent des identifiants, l'état et des horodatages, mais aucune sortie d'exécution.",
    "resultTextMaxChars": "De {{min}} à {{max}}. Par défaut {{default}}."
   },
   "errors": {
    "name": "Utilisez de 1 à 64 lettres minuscules, chiffres et tirets, en commençant et finissant par une lettre ou un chiffre.",
    "url": "Saisissez une URL HTTP ou HTTPS absolue, sans nom d'utilisateur ni mot de passe.",
    "events": "Choisissez au moins un événement.",
    "resultTextMaxChars": "Saisissez un nombre entier de {{min}} à {{max}}."
   },
   "actions": {
    "test": "Envoyer un essai",
    "deliveries": "Journal des livraisons",
    "rotateSecret": "Renouveler le secret"
   },
   "deliveries": {
    "createdUtc": "Mise en file",
    "event": "Événement",
    "status": "État",
    "attempts": "Tentatives",
    "lastStatusCode": "Statut HTTP",
    "lastError": "Dernière erreur",
    "lastAttemptUtc": "Dernière tentative",
    "nextAttemptUtc": "Prochaine tentative",
    "deliveredUtc": "Livrée",
    "payload": "Charge utile",
    "id": "ID de livraison"
   },
   "confirmRotateTitle": "Renouveler le secret de signature",
   "confirmRotate": "Remplacer le secret de signature de {{name}} ? Les notifications seront désormais signées avec le nouveau secret, y compris les nouvelles tentatives déjà en file.",
   "anyAgent": "Tous les agents",
   "anyDeployment": "Tous les déploiements",
   "noFilter": "Tout",
   "eventCount_one": "{{count}} événement",
   "eventCount_other": "{{count}} événements",
   "resultTextUpTo_one": "Jusqu'à {{count}} caractère",
   "resultTextUpTo_other": "Jusqu'à {{count}} caractères",
   "secretNotice": "Les notifications sont signées avec un secret se terminant par {{last4}}, défini le {{time}}. Renouvelez-le pour en obtenir un nouveau."
  }
 },
 "components": {
  "signingSecret": {
   "title": "Secret de signature",
   "warning": "Copiez ce secret maintenant. Garrison le stocke chiffré et ne l'affichera plus ; renouvelez-le s'il est perdu.",
   "secret": "Valeur secrète",
   "url": "URL du webhook",
   "done": "Je l'ai enregistré",
   "scheme": "Signez chaque requête avec l'en-tête {{header}} : {{format}}. Envoyez {{delivery}} pour que les livraisons répétées ne comptent qu'une fois."
  },
  "triggerFire": {
   "title": "Déclencher {{name}}",
   "intro": "Lancez ce déclencheur maintenant. La charge utile est facultative ; le modèle d'entrée la voit comme webhook.body.",
   "body": "Charge utile",
   "contentType": "Type de contenu de la charge utile",
   "submit": "Déclencher",
   "firing": "Déclenchement..."
  },
  "triggerFires": {
   "title": "Historique des déclenchements",
   "count_one": "{{shown}} sur {{count}} déclenchement",
   "count_other": "{{shown}} sur {{count}} déclenchements",
   "empty": "Ce déclencheur n'a pas encore été déclenché.",
   "scheduled": "pour {{time}}"
  },
  "notificationDeliveries": {
   "title": "Journal des livraisons",
   "count_one": "{{shown}} sur {{count}} livraison",
   "count_other": "{{shown}} sur {{count}} livraisons",
   "empty": "Rien n'a encore été envoyé à ce point de terminaison.",
   "detail": "Livraison sélectionnée"
  },
  "notificationTest": {
   "title": "Notification d'essai",
   "sending": "Envoi d'une notification d'essai...",
   "succeeded": "Le point de terminaison a accepté la notification d'essai.",
   "failed": "La notification d'essai a échoué et ne sera pas renvoyée. Voir l'erreur ci-dessous.",
   "pending": "La première tentative a échoué ; Garrison va réessayer. Voir l'erreur ci-dessous."
  }
 },
 "views": {
  "runDetail": {
   "trigger": "Déclencheur"
  },
  "settings": {
   "groups": {
    "Triggers": "Déclencheurs",
    "Notifications": "Notifications sortantes"
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Corps de webhook maximal (octets)",
     "WebhookToleranceSeconds": "Tolérance d'horodatage des webhooks (secondes)",
     "CronMaxLatenessSeconds": "Limite de rattrapage cron (secondes)",
     "FireRetentionDays": "Conservation de l'historique des déclenchements (jours)"
    },
    "Notifications": {
     "AllowPrivateDestinations": "Autoriser les destinations privées",
     "MaxAttempts": "Tentatives de livraison",
     "InitialBackoffSeconds": "Délai avant la première relance (secondes)",
     "MaxBackoffSeconds": "Délai maximal entre relances (secondes)",
     "TimeoutSeconds": "Délai de livraison (secondes)",
     "DispatchIntervalMs": "Intervalle d'envoi (ms)",
     "SweepOverlapSeconds": "Chevauchement du balayage des événements (secondes)",
     "DeliveryRetentionDays": "Conservation du journal des livraisons (jours)"
    }
   }
  }
 }
});
Object.assign(fr.common.fieldCodes, {"SecretUseDenied": "Vous n'avez pas le droit d'utiliser ce secret. Demandez le rôle SecretUser ou SecretManager sur ce secret.", "GrantCeiling": "Vous ne pouvez accorder que les permissions que vous avez vous-même.", "ReservedRoleName": "C'est le nom d'un rôle intégré. Choisissez un autre nom."});
fr.components.mcpTest.noWorkers = "Aucun worker prêt ne propose de diagnostic stdio. Les workers ne les exécutent que si un opérateur définit GARRISON_WORKER_MCP_TESTS_ENABLED=true sur eux, car la commande s'exécute sur l'hôte du worker, hors de l'isolation des exécutions.";

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
})(fr, {
 "components": {
  "transcriptExport": {
   "label": "Exporter la transcription",
   "exporting": "Exportation...",
   "markdown": "Document Markdown (.md)",
   "json": "JSON (.json)",
   "includeThinking": "Inclure le raisonnement",
   "failed": "Échec de l'exportation de la transcription : {{message}}"
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "Entrée structurée",
    "modeLabel": "Éditeur d'entrée",
    "modeForm": "Formulaire",
    "modeJson": "JSON brut",
    "required": "obligatoire",
    "choose": "Choisir une valeur",
    "addItem": "Ajouter un élément",
    "removeItem": "Retirer l'élément",
    "jsonLabel": "JSON d'entrée",
    "jsonPlaceholder": "Valeur JSON",
    "unsupported": "Ce schéma d'entrée n'a pas de propriétés permettant de créer un formulaire. Saisissez le document JSON attendu par l'agent.",
    "invalidRaw": "Le JSON n'est pas valide. Corrigez-le avant de passer au formulaire.",
    "errors": {
     "required": "Ce champ est obligatoire.",
     "number": "Saisissez un nombre.",
     "integer": "Saisissez un nombre entier.",
     "json": "Saisissez un JSON valide."
    }
   }
  },
  "manifests": {
   "bundle": {
    "scope": "Portée de l'exportation",
    "scopeAll": "Toutes les ressources",
    "scopeSelected": "Ressources choisies",
    "kinds": "Types",
    "resources": "Ressources",
    "resourcesHint": "Un Type/nom par ligne ou séparés par des virgules, par exemple Agent/triage.",
    "invalidSelectors": "Pas un Type/nom d'un type connu : {{entries}}",
    "followReferences": "Inclure ce qu'elles référencent",
    "includeBuiltIn": "Inclure les éléments intégrés référencés",
    "exporting": "Exportation...",
    "noSecrets": "Ce paquet n'a besoin d'aucun secret.",
    "requiredSecrets": "Créez ces secrets dans le locataire cible avant d'appliquer. Les valeurs des secrets ne sont jamais exportées.",
    "requiredArtifactStores": "Créez ces magasins d'artefacts dans le locataire cible avant d'appliquer."
   }
  }
 }
});

// Durable continuation and remote execution.
fr.enums.runStatus.Suspended = "Suspendue";
fr.resources.deployments.fields.suspensionEnabled = "Suspendre pendant l’approbation";
fr.resources.harnessProfiles.fields.sessionFormat = "Format de session du harnais";
fr.enums.auditEventType.QueueFull = "File d’attente pleine";
fr.enums.runExecutor.RemoteA2A = "A2A distant";
fr.enums.runExecutor.RemoteMcp = "MCP distant";
fr.tips.resources.deployments.suspensionEnabled = "Active les points de reprise durables pendant l’attente. Nécessite Process, un dossier personnel isolé, un harnais compatible et un stockage d’artefacts.";
fr.tips.resources.harnessProfiles.sessionFormat = "Format de session versionné pour les points de reprise portables. À modifier si une mise à jour du harnais change la compatibilité.";
fr.tips.enums.runStatus.Suspended = "L’exécution dispose d’un point de reprise durable et ne conserve ni bail ni place de travail pendant l’attente.";
fr.tips.enums.runExecutor.RemoteA2A = "Exécute un agent A2A enregistré et authentifié avec échéance et annulation.";
fr.tips.enums.runExecutor.RemoteMcp = "Appelle l’outil MCP distant sélectionné avec une entrée JSON validée.";
fr.tips.enums.auditEventType.QueueFull = "L’admission est refusée car une limite de file du cluster, du locataire ou de l’agent est atteinte.";

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
})(fr, {
 "enums": {
  "agentRevisionState": {
   "Draft": "Brouillon",
   "Published": "Publiée"
  },
  "promotionKind": {
   "Promote": "Promotion de révision",
   "Rollback": "Annulation"
  },
  "promotionOutcome": {
   "Applied": "Appliquée",
   "RolledBack": "Annulée"
  },
  "revisionChangeType": {
   "Changed": "Modifié",
   "Added": "Ajouté",
   "Removed": "Supprimé"
  },
  "resourceType": {
   "AgentRevision": "Révision d'agent",
   "Promotion": "Promotion d'environnement"
  }
 },
 "errorCodes": {
  "PromotionOrderViolation": "La cible n'est pas l'environnement qui suit la source. Activez Autoriser le saut d'environnements pour promouvoir hors de l'ordre.",
  "NoNextEnvironment": "La source est le dernier environnement : il n'y a rien vers quoi promouvoir.",
  "NoTargetDeployments": "Cet agent n'a aucun déploiement dans l'environnement cible. Créez-en un d'abord.",
  "NoSourceRevision": "Aucune révision à promouvoir : l'agent n'a pas de déploiement dans l'environnement source ou aucune révision publiée. Choisissez une révision explicitement.",
  "AmbiguousSourceRevision": "Les déploiements de l'environnement source exécutent des révisions différentes. Choisissez la révision à promouvoir.",
  "RevisionNotPublished": "Cette révision est un brouillon. Publiez-la avant de la promouvoir.",
  "PromotionConflict": "Un déploiement a changé pendant l'application de la promotion. Rien n'a été modifié ; rechargez et réessayez.",
  "NotAPromotion": "Seules les promotions peuvent être annulées, pas les annulations.",
  "AlreadyRolledBack": "Cette promotion a déjà été annulée.",
  "RevisionUnchanged": "Le brouillon est identique à la dernière révision publiée. Modifiez-le avant de le publier, ou supprimez-le.",
  "RevisionPublished": "Cette révision est déjà publiée et ne peut plus changer.",
  "EnvironmentInUse": "Un environnement que vous avez retiré a encore des déploiements. Déplacez ou supprimez d'abord ces déploiements."
 },
 "views": {
  "agentDetail": {
   "revisions": "Révisions",
   "draftNotice": "Cet agent a des modifications en brouillon non publiées. Les déploiements continuent d'exécuter les révisions publiées jusqu'à la publication du brouillon.",
   "reviewDraft": "Examiner le brouillon"
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "number": "Révision",
    "state": "État",
    "author": "Auteur",
    "changeNote": "Note de modification",
    "publishedUtc": "Publiée",
    "actions": "Actions"
   },
   "number": "Révision {{number}}",
   "option": "Révision {{number}} ({{state}})",
   "latest": "Dernière",
   "empty": "Cet agent n'a encore aucune révision.",
   "compareTitle": "Comparer des révisions",
   "from": "De",
   "to": "Vers",
   "pickTwo": "Sélectionnez deux révisions différentes à comparer.",
   "identical": "Les révisions {{from}} et {{to}} ont le même contenu.",
   "diffSummary": "Champs modifiés entre la révision {{from}} et la révision {{to}} : {{changed}}.",
   "diffColumns": {
    "field": "Champ",
    "change": "Changement",
    "before": "Avant",
    "after": "Après"
   },
   "emptyValue": "(vide)",
   "compare": "Comparer",
   "publish": "Publier",
   "discard": "Supprimer le brouillon",
   "publishTitle": "Publier la révision {{number}}",
   "publishBody": "La publication fait de la révision {{number}} la dernière révision publiée. Les déploiements qui suivent la dernière révision l'exécutent dès leur prochaine exécution ; les déploiements épinglés gardent leur révision.",
   "changeNote": "Note de modification",
   "changeNotePlaceholder": "Ce qui a changé et pourquoi (facultatif)",
   "publishing": "Publication...",
   "published": "Révision {{number}} publiée.",
   "discardTitle": "Supprimer la révision brouillon {{number}}",
   "discardMessage": "Supprimer le brouillon ? Ses modifications sont perdues. Les révisions publiées et les déploiements ne sont pas concernés.",
   "discarded": "Le brouillon a été supprimé."
  },
  "promote": {
   "title": "Promouvoir une révision",
   "intro": "Épingle chaque déploiement de l'agent dans l'environnement cible sur la révision exécutée dans l'environnement source. Chaque promotion est enregistrée et peut être annulée.",
   "agent": "Agent",
   "revision": "Révision à promouvoir",
   "revisionFromSource": "La révision exécutée dans l'environnement source",
   "source": "Environnement source",
   "target": "Environnement cible",
   "targetNext": "Environnement suivant ({{name}})",
   "allowSkip": "Autoriser le saut d'environnements",
   "skipWarning": "{{target}} n'est pas l'environnement qui suit directement {{source}}.",
   "note": "Note",
   "notePlaceholder": "Raison de cette promotion (facultatif)",
   "submit": "Promouvoir",
   "promoting": "Promotion en cours...",
   "promoted": "Promue vers {{target}}. Déploiements mis à jour : {{deployments}}.",
   "errors": {
    "noNext": "Il n'y a aucun environnement après l'environnement source.",
    "sameEnvironment": "Choisissez un environnement cible différent de la source.",
    "needsSkip": "Cette cible saute un environnement. Activez Autoriser le saut d'environnements pour promouvoir hors de l'ordre."
   }
  },
  "promotions": {
   "title": "Historique des promotions",
   "agentFilter": "Agent",
   "allAgents": "Tous les agents",
   "empty": "Aucune promotion ni annulation pour l'instant.",
   "columns": {
    "createdUtc": "Quand",
    "kind": "Type",
    "outcome": "Résultat",
    "agent": "Agent",
    "revision": "Révision",
    "environments": "Environnements",
    "deployments": "Déploiements",
    "actor": "Par",
    "note": "Note",
    "actions": "Actions"
   },
   "path": "{{source}} vers {{target}}",
   "pinChange": "({{from}} vers {{to}})",
   "skipped": "Environnements sautés",
   "rollback": "Annuler",
   "rollbackTitle": "Annuler la promotion",
   "rollbackMessage": "Rétablir les épinglages de révision qu'avaient les déploiements modifiés par cette promotion de {{source}} vers {{target}} ? Déploiements concernés : {{deployments}}.",
   "rollbackNote": "Note d'annulation",
   "rolledBack": "Annulée. Les épinglages de révision précédents sont rétablis."
  }
 },
 "resources": {
  "deployments": {
   "columns": {
    "environment": "Environnement",
    "agentRevisionId": "Révision épinglée"
   },
   "fields": {
    "environment": "Environnement",
    "agentRevisionId": "Épinglage de révision"
   },
   "hints": {
    "environment": "La promotion fait passer les révisions d'un environnement à l'autre dans l'ordre du locataire.",
    "agentRevisionId": "Vide suit la dernière révision publiée de l'agent. Un épinglage garde ce déploiement sur une révision jusqu'à ce que vous ou une promotion le changiez."
   },
   "followLatest": "Suivre la dernière publiée",
   "latest": "Dernière",
   "selectAgentFirst": "Sélectionnez d'abord un agent.",
   "noPublished": "Cet agent n'a encore aucune révision publiée.",
   "actions": {
    "promote": "Promouvoir",
    "promotions": "Historique des promotions"
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
})(fr, {
 "nav": {
  "items": {
   "agentAssets": {
    "label": "Ressources",
    "tip": "Prompts système, skills, fichiers de référence et modèles de document versionnés, épinglés par les révisions d'agent."
   }
  }
 },
 "enums": {
  "agentAssetKind": {
   "SystemPrompt": "Prompt système",
   "Skill": "Skill (compétence)",
   "ReferenceFile": "Fichier de référence",
   "DocumentTemplate": "Modèle de document"
  },
  "runOutcome": {
   "AssetIntegrityFailed": "Échec de l'intégrité d'une ressource"
  },
  "resourceType": {
   "AgentAsset": "Ressource d'agent"
  }
 },
 "errorCodes": {
  "AssetInUse": "Des révisions d'agent épinglent encore cette ressource. Retirez-la de ces révisions avant de la supprimer.",
  "AssetKindImmutable": "Le type d'une ressource ne peut pas changer après sa création. Créez plutôt une nouvelle ressource.",
  "AssetStoreImmutable": "Le stockage d'artefacts d'une ressource ne peut pas changer après sa création. Créez plutôt une nouvelle ressource.",
  "AssetTemplateRequired": "Les ressources de prompt système nécessitent un modèle de prompt, et les autres types ne peuvent pas en avoir.",
  "AssetFileTooLarge": "Un fichier dépasse la taille autorisée par le paramètre Assets.MaxFileBytes.",
  "AssetVersionTooLarge": "L'ensemble des fichiers dépasse la taille autorisée par le paramètre Assets.MaxVersionBytes.",
  "AssetTooManyFiles": "Cet envoi contient plus de fichiers que le paramètre Assets.MaxFilesPerVersion ne l'autorise.",
  "AssetHasNoFiles": "Les ressources de prompt système n'ont pas de fichiers. Modifiez plutôt leur modèle de prompt."
 },
 "common": {
  "fieldCodes": {
   "InvalidAssetPath": "Utilisez un chemin relatif avec des barres obliques, sans segment \".\" ni \"..\", de 512 caractères au maximum.",
   "MacroFormatRefused": "Les fichiers Office avec macros sont refusés (Assets.AllowMacroFormats). Enregistrez le fichier au format .docx ou .dotx.",
   "AssetHasNoFiles": "Les ressources de prompt système n'ont pas de fichiers. Modifiez plutôt leur modèle de prompt.",
   "AssetTemplateRequired": "Choisissez un modèle de prompt pour une ressource de prompt système."
  },
  "serverText": {
   "assetInUse": "La ressource {{asset}} est épinglée par des révisions de ces agents : {{agents}}. Retirez-la d'abord de ces révisions.",
   "assetFileTooLarge": "Le fichier {{path}} fait {{size}} octets ; la limite est de {{limit}} octets (Assets.MaxFileBytes).",
   "assetVersionTooLarge": "Cette version dépasse {{limit}} octets (Assets.MaxVersionBytes).",
   "assetTooManyFiles": "Une version contient au plus {{limit}} fichiers (Assets.MaxFilesPerVersion) ; cet envoi en contient {{count}}.",
   "assetHasNoFiles": "Les ressources de prompt système n'ont pas de fichiers. Modifiez plutôt leur modèle de prompt."
  }
 },
 "resources": {
  "agentAssets": {
   "title": "Ressources",
   "subtitle": "Prompts système, skills, fichiers de référence et modèles de document versionnés, épinglés par les révisions d'agent.",
   "add": "Ajouter une ressource",
   "create": "Créer une ressource",
   "edit": "Modifier la ressource",
   "view": "Détails de la ressource",
   "deleteTitle": "Supprimer la ressource",
   "emptyTitle": "Aucune ressource pour l'instant",
   "emptyBody": "Créez une ressource, envoyez ses fichiers comme une version, puis épinglez-la sur une révision d'agent.",
   "columns": {
    "name": "Nom",
    "kind": "Type",
    "currentVersion": "Version actuelle",
    "description": "Description",
    "tags": "Tags",
    "artifactStoreId": "Stockage",
    "id": "ID de ressource",
    "createdUtc": "Créée"
   },
   "fields": {
    "name": "Nom",
    "kind": "Type",
    "promptTemplateId": "Modèle de prompt",
    "artifactStoreId": "Stockage d'artefacts",
    "description": "Description",
    "tags": "Tags"
   },
   "hints": {
    "kind": "Fixé après la création. Une ressource de prompt système tire son texte d'un modèle de prompt ; les autres types contiennent des fichiers envoyés.",
    "promptTemplateId": "Le modèle de prompt dont le texte sert de prompt système à l'agent.",
    "artifactStoreId": "Emplacement des fichiers envoyés. Fixé après la création. Laissez vide pour les conserver dans la base de données Garrison."
   },
   "errors": {
    "templateRequired": "Choisissez le modèle de prompt utilisé par cette ressource de prompt système."
   },
   "version": "version {{number}}",
   "noVersion": "Aucune version",
   "databaseStore": "Base de données Garrison",
   "actions": {
    "versions": "Versions de la ressource"
   }
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "assetPins": "Ressources"
   }
  },
  "assets": {
   "versionsTitle": "Versions de {{name}}",
   "current": "Actuelle",
   "noVersions": "Cette ressource n'a encore aucune version. Envoyez ses fichiers ci-dessous.",
   "systemPromptNotice": "Les ressources de prompt système n'ont pas de fichiers. Leur texte provient de leur modèle de prompt : modifiez ce modèle pour le changer.",
   "showFiles": "Fichiers",
   "filesTitle": "Fichiers de la version {{number}}",
   "noFiles": "Cette version n'a aucun fichier.",
   "preview": "Aperçu",
   "download": "Télécharger",
   "previewTitle": "{{path}} (version n° {{number}})",
   "emptyFile": "Ce fichier est vide.",
   "versionColumns": {
    "number": "Version",
    "author": "Auteur",
    "changeNote": "Note de modification",
    "totalBytes": "Taille totale",
    "createdUtc": "Créée",
    "actions": "Actions"
   },
   "fileColumns": {
    "path": "Chemin",
    "mediaType": "Type de média",
    "sizeBytes": "Taille",
    "sha256": "Empreinte SHA-256",
    "actions": "Actions"
   },
   "uploadTitle": "Envoyer une nouvelle version",
   "uploadHint": "Choisissez un ou plusieurs fichiers. Chaque envoi est une version complète : les fichiers omis ne sont pas repris de la version actuelle.",
   "files": "Fichiers",
   "uploadColumns": {
    "path": "Chemin dans la ressource",
    "mediaType": "Type de média",
    "size": "Taille",
    "actions": "Retirer"
   },
   "mediaTypeGuessed": "D'après l'extension du fichier",
   "removeFile": "Retirer ce fichier de l'envoi",
   "changeNote": "Note de modification",
   "changeNotePlaceholder": "Ce qui a changé dans cette version",
   "upload": "Envoyer la version",
   "uploading": "Envoi en cours...",
   "uploadCreated": "Version {{number}} créée.",
   "uploadUnchanged": "Les fichiers sont identiques à la version actuelle {{number}} : aucune nouvelle version n'a été créée.",
   "limitSetting": "La limite est définie par le paramètre serveur {{setting}}.",
   "duplicatePath": "Un autre fichier de cet envoi a le même chemin.",
   "pinVersion": "{{name}} version {{version}}",
   "pinCurrent": "{{name}} (actuelle)",
   "pinsTitle": "Épinglages de ressources",
   "pinsSave": "Enregistrer le brouillon",
   "pinsSaved": "Épinglages de ressources enregistrés sur la révision brouillon {{number}}.",
   "pinsDraft": "Modifie les épinglages de ressources de la révision brouillon {{number}}. Le reste du brouillon ne change pas.",
   "pinsNewDraft": "Aucun brouillon ouvert. L'enregistrement crée un nouveau brouillon à partir de la révision publiée {{number}} avec ces épinglages de ressources.",
   "pinsEmpty": "Aucune ressource épinglée.",
   "pinAsset": "Ressource",
   "pinVersionLabel": "Version",
   "chooseAsset": "Choisir une ressource",
   "assetOption": "{{name}} (type : {{kind}})",
   "followCurrent": "Version actuelle",
   "removePin": "Retirer cet épinglage de ressource",
   "addPin": "Ajouter une ressource",
   "editPins": "Ressources",
   "pinsNewDraftButton": "Épingler des ressources dans un nouveau brouillon"
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
})(fr, {
 "views": {
  "conversationDetail": {
   "tabsLabel": "Sections de la conversation",
   "tabs": {
    "turns": "Tours",
    "files": "Fichiers"
   }
  },
  "runDetail": {
   "fileSpace": "Espace de fichiers",
   "openFiles": "Ouvrir les fichiers"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "fileSpaceMountPath": "Dossier de l'espace de fichiers"
   },
   "hints": {
    "fileSpaceMountPath": "Dossier de l'espace de travail de l'exécution qui reçoit les fichiers partagés de la conversation au démarrage ; ses modifications sont réécrites à la fin. Valeur par défaut : files."
   }
  }
 },
 "errorCodes": {
  "InvalidFilePath": "Utilisez un chemin relatif avec des barres obliques, sans segment \".\" ni \"..\".",
  "FileTooLarge": "Le fichier dépasse la taille autorisée par le paramètre FileSpaces.MaxFileBytes.",
  "FileSpaceFull": "L'espace de fichiers dépasserait le paramètre FileSpaces.MaxTotalBytes.",
  "TooManyFiles": "L'espace de fichiers contient déjà autant de fichiers que le paramètre FileSpaces.MaxFiles le permet.",
  "StaleFileUpload": "L'exécution ne détient plus son bail, ses modifications de fichiers n'ont donc pas été écrites."
 },
 "common": {
  "fieldCodes": {
   "InvalidFilePath": "Utilisez un chemin relatif avec des barres obliques, sans segment \".\" ni \"..\"."
  },
  "serverText": {
   "fileSpaceFileTooLarge": "Le fichier {{path}} fait {{size}} octets ; la limite est de {{limit}} octets (FileSpaces.MaxFileBytes).",
   "fileSpaceFull": "L'espace de fichiers contiendrait plus de {{limit}} octets (FileSpaces.MaxTotalBytes).",
   "fileSpaceTooManyFiles": "L'espace de fichiers contient déjà {{count}} fichiers (FileSpaces.MaxFiles).",
   "fileNotFound": "Le fichier {{path}} est introuvable."
  }
 },
 "components": {
  "files": {
   "title": "Fichiers",
   "summary": "Fichiers partagés : {{count}} ({{size}})",
   "live": "En direct",
   "polling": "Interrogation",
   "includeDeleted": "Afficher les fichiers supprimés",
   "refresh": "Actualiser",
   "spaceId": "Espace de fichiers {{id}}",
   "emptyTitle": "Aucun fichier pour l'instant",
   "emptyBody": "Les fichiers que les tours écrivent dans le dossier partagé, ou que vous envoyez ci-dessous, apparaissent ici.",
   "emptyBodyDeleted": "Rien n'a encore été écrit dans le dossier partagé de cette conversation, pas même un fichier supprimé ensuite.",
   "columns": {
    "path": "Chemin",
    "currentVersion": "Version",
    "sizeBytes": "Taille",
    "mediaType": "Type de média",
    "lastUpdateUtc": "Modifié",
    "actions": "Actions"
   },
   "deleted": "Supprimé",
   "version": "version {{number}}",
   "versions": "Historique des versions",
   "download": "Télécharger",
   "deleteLabel": "Supprimer {{path}}",
   "deletedToast": "{{path}} a été supprimé. Ses versions sont conservées.",
   "deleteTitle": "Supprimer le fichier",
   "confirmDelete": "Supprimer {{path}} des fichiers partagés ? Les tours suivants ne le verront plus. Ses versions sont conservées et restent téléchargeables.",
   "versionsTitle": "Versions de {{path}}",
   "noVersions": "Ce fichier n'a aucune version.",
   "current": "Actuelle",
   "versionColumns": {
    "number": "Version",
    "sizeBytes": "Taille",
    "mediaType": "Type de média",
    "sha256": "Empreinte SHA-256",
    "writtenBy": "Écrit par",
    "createdUtc": "Écrit",
    "actions": "Actions"
   },
   "preview": "Aperçu",
   "previewTitle": "{{path}} (version n° {{number}})",
   "emptyFile": "Cette version est vide.",
   "uploadTitle": "Envoyer des fichiers",
   "uploadHint": "Choisissez un ou plusieurs fichiers et vérifiez leurs chemins. Un chemin qui correspond à un fichier de la liste en ajoute une nouvelle version. Si un tour a modifié ce fichier après le chargement de la liste, votre envoi est conservé à côté sous un nom de conflit au lieu de le remplacer.",
   "uploadCreated": "{{path}} ajouté en version {{version}}.",
   "uploadReplaced": "{{path}} enregistré en version {{version}}.",
   "uploadConflict": "{{requested}} a changé après le chargement de la liste, votre envoi a donc été conservé sous {{path}}. Comparez les deux fichiers et supprimez celui dont vous n'avez pas besoin.",
   "chooseFiles": "Fichiers à envoyer",
   "uploadColumns": {
    "path": "Chemin dans le dossier partagé",
    "replaces": "Remplace",
    "size": "Taille",
    "actions": "Retirer"
   },
   "replacesVersion": "Version {{version}}",
   "newFile": "Nouveau fichier",
   "removeFile": "Retirer ce fichier de l'envoi",
   "upload": "Envoyer",
   "uploading": "Envoi en cours...",
   "limitSetting": "La limite est définie par le paramètre serveur {{setting}}."
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
})(fr, {
 "nav": {
  "items": {
   "capabilities": {
    "label": "Capacités",
    "tip": "Le catalogue des capacités : agents, outils MCP et outils intégrés aux harness que les agents orchestrateurs peuvent trouver et utiliser, avec des indications de coût et de latence."
   }
  }
 },
 "enums": {
  "capabilityKind": {
   "Agent": "Agent",
   "McpTool": "Outil MCP",
   "HarnessBuiltIn": "Outil intégré au harness"
  },
  "capabilityOrigin": {
   "Derived": "Dérivée",
   "Manual": "Manuelle"
  },
  "capabilityHintStatus": {
   "Unknown": "Inconnu",
   "Known": "Connu"
  },
  "runBlockedReason": {
   "NoToolWorker": "Aucun worker ne dispose de l'outil"
  },
  "resourceType": {
   "ConversationFileSpace": "Espace de fichiers de conversation",
   "Capability": "Capacité"
  }
 },
 "errorCodes": {
  "InvalidJsonSchema": "Un schéma n'est pas un JSON Schema valide. Corrigez le schéma d'entrée ou de sortie, puis enregistrez à nouveau.",
  "NameConflict": "Une autre capacité manuelle utilise déjà ce nom. Choisissez-en un autre.",
  "CapabilityDerived": "Cette capacité est dérivée de sa source et la suit : elle ne peut donc être ni modifiée ni supprimée ici. Modifiez plutôt la source.",
  "InvalidTags": "Utilisez au plus 32 tags, de 1 à 64 caractères chacun.",
  "TooManyRequirements": "Utilisez au plus 16 exigences d'étiquette de nœud."
 },
 "common": {
  "fieldCodes": {
   "InvalidJsonSchema": "Ce n'est pas un JSON Schema valide.",
   "InvalidTags": "Utilisez au plus 32 tags, de 1 à 64 caractères chacun.",
   "TooManyRequirements": "Utilisez au plus 16 exigences d'étiquette de nœud."
  },
  "serverText": {
   "capabilityDerivedEdit": "La capacité {{name}} est dérivée de sa source et la suit. Modifiez plutôt la source.",
   "capabilityDerivedDelete": "La capacité {{name}} est dérivée de sa source et disparaît avec elle : elle ne peut donc pas être supprimée directement.",
   "capabilityShared": "La capacité {{name}} est partagée par tous les locataires et provient d'un profil de harness intégré : elle ne peut donc pas être modifiée.",
   "capabilityNameConflict": "Une capacité manuelle nommée {{name}} existe déjà.",
   "capabilitySecretsDenied": "Vous n'êtes pas autorisé à utiliser les secrets qu'envoie le serveur MCP {{server}}, ses outils n'ont donc pas été listés.",
   "capabilityNoStdioWorker": "Aucun worker prêt n'a activé les diagnostics MCP stdio (GARRISON_WORKER_MCP_TESTS_ENABLED) : les outils du serveur stdio n'ont donc pas pu être listés.",
   "capabilityRefreshFailed": "Échec de l'actualisation le {{when}} : {{error}}",
   "capabilityMissingTools": "Outils requis manquants : {{tools}}.",
   "capabilityProbeShadowed": "Les workers sondent {{name}} en tant que {{probe}}, déjà défini par un autre profil de harness. La définition de ce profil n'est pas sondée."
  }
 },
 "components": {
  "blocked": {
   "reasons": {
    "NoToolWorker": "L'agent de cette exécution utilise {{tools}}, et aucun worker prêt capable d'exécuter {{harness}} ne le signale. Installez l'outil sur l'hôte d'un worker pour que sa sonde signale l'étiquette de nœud garrison.io/tool-{name}=true, ou ajoutez cette étiquette à un worker à la main."
   }
  },
  "revisions": {
   "columns": {
    "capabilities": "Capacités"
   }
  },
  "capabilities": {
   "noSource": "Entrée manuelle",
   "shared": "Partagée",
   "hintsLine": "Médiane {{median}}, p90 {{p90}}, {{cost}} par exécution",
   "hintsLineNoCost": "Médiane {{median}}, p90 {{p90}}, aucun coût enregistré",
   "hintsTitle": "Indications de coût et de latence",
   "noCost": "Aucun coût enregistré",
   "windowDays_one": "{{count}} jour",
   "windowDays_other": "{{count}} jours",
   "refreshWarning": "La dernière actualisation de la source de cette entrée a échoué.",
   "requirementsTitle": "Étiquettes de nœud requises pour une exécution",
   "noRequirements": "Aucune. Les exécutions qui utilisent cette capacité peuvent aller sur n'importe quel worker.",
   "noSchema": "Aucun schéma",
   "fields": {
    "kind": "Type",
    "origin": "Origine",
    "source": "Provenance",
    "lastRefreshedUtc": "Dernière actualisation",
    "tags": "Tags",
    "id": "ID",
    "summary": "Résumé",
    "hintStatus": "Statut",
    "sampleSize": "Exécutions prises en compte",
    "medianDurationMs": "Durée médiane",
    "p90DurationMs": "Durée p90",
    "meanCostUsd": "Coût moyen",
    "windowDays": "Fenêtre",
    "computedUtc": "Calculé le",
    "inputSchema": "Schéma d'entrée",
    "outputSchema": "Schéma de sortie"
   },
   "refreshTitle": "Actualiser le catalogue des capacités",
   "refreshHint": "Garrison dérive à nouveau les entrées des agents et des outils intégrés aux harness, liste les outils de chaque serveur MCP (les serveurs stdio via un worker dont les diagnostics stdio sont activés) et recalcule les indications des agents. Lister un serveur lui envoie les secrets que nomment ses modèles : vous devez donc avoir le droit de les utiliser.",
   "refreshServer": "Serveurs MCP à lister",
   "refreshAll": "Tous les serveurs MCP actifs",
   "refreshRun": "Actualiser maintenant",
   "refreshing": "Actualisation...",
   "refreshDone": "Le catalogue des capacités est à jour.",
   "refreshPartial_one": "Le catalogue a été actualisé, mais {{count}} serveur MCP n'a pas pu être listé.",
   "refreshPartial_other": "Le catalogue a été actualisé, mais {{count}} serveurs MCP n'ont pas pu être listés.",
   "refresh": {
    "agents": "Entrées d'agent modifiées",
    "harnessBuiltIns": "Entrées intégrées modifiées",
    "hints": "Indications recalculées",
    "servers": "Serveurs MCP listés",
    "tools": "Entrées d'outil écrites",
    "removed": "Entrées d'outil supprimées",
    "failed": "Serveurs en échec",
    "noServers": "Aucun serveur MCP n'a été listé.",
    "failedBadge": "Échec",
    "listedBadge": "Listé",
    "columns": {
     "server": "Serveur MCP",
     "status": "Résultat",
     "tools": "Outils",
     "removed": "Supprimés",
     "warned": "Conservés avec un avertissement",
     "error": "Erreur"
    }
   },
   "errors": {
    "nameLength": "Utilisez de 1 à {{max}} caractères.",
    "summaryLength": "Utilisez au plus {{max}} caractères.",
    "tags": "Utilisez au plus {{max}} tags, de 1 à {{length}} caractères chacun.",
    "requirementCount": "Utilisez au plus {{max}} exigences d'étiquette de nœud.",
    "requirement": "Chaque exigence nécessite une clé d'étiquette de nœud de 1 à {{max}} caractères.",
    "toolNeedsServer": "Choisissez le serveur MCP auquel appartient l'outil.",
    "probeCount": "Un profil de harness compte au plus {{max}} sondes d'outil.",
    "probeName": "Le nom de l'outil comporte de 1 à 63 lettres minuscules, chiffres, points et traits d'union, et commence par une lettre ou un chiffre.",
    "probeDuplicate": "Une autre sonde de ce profil s'appelle déjà {{name}}.",
    "probeExecutable": "L'exécutable est un simple nom de fichier trouvé dans le PATH (lettres, chiffres, points, traits de soulignement, signes plus et traits d'union), sans dossier.",
    "probeArgument": "Choisissez aucun argument ou l'un de ceux-ci : {{allowed}}.",
    "probeDescription": "Utilisez au plus {{max}} caractères."
   },
   "draftTitle": "Capacités",
   "draftSave": "Enregistrer le brouillon",
   "draftSaved": "Capacités enregistrées dans la révision brouillon {{number}}.",
   "draftEdit": "Modifie les capacités de la révision brouillon {{number}}. Le reste du brouillon ne change pas.",
   "draftNew": "Aucun brouillon n'est ouvert. L'enregistrement crée un nouveau brouillon à partir de la révision publiée {{number}} avec ces capacités.",
   "draftPlacementHint": "Un outil intégré au harness nommé ici ajoute son étiquette de nœud aux exécutions de cet agent : elles ne vont alors qu'aux workers qui ont signalé l'outil.",
   "draftEmpty": "Cette révision n'utilise aucune capacité.",
   "notInCatalog": "Absente du catalogue",
   "removeName": "Retirer {{name}}",
   "chooseName": "Choisir une capacité",
   "nameOption": "{{name}} ({{kinds}})",
   "addName": "Ajouter la capacité",
   "newDraftButton": "Choisir les capacités dans un nouveau brouillon",
   "editDraft": "Capacités"
  }
 },
 "resources": {
  "capabilities": {
   "title": "Capacités",
   "subtitle": "Agents, outils MCP et outils intégrés aux harness que les agents orchestrateurs peuvent trouver et utiliser, avec des indications de coût et de latence.",
   "add": "Ajouter une capacité",
   "create": "Créer une capacité",
   "edit": "Modifier la capacité",
   "view": "Détails de la capacité",
   "deleteTitle": "Supprimer la capacité",
   "emptyTitle": "Aucune capacité pour l'instant",
   "emptyBody": "Publiez une révision d'agent, enregistrez un serveur MCP ou ajoutez une sonde d'outil à un profil de harness, puis actualisez. Vous pouvez aussi ajouter une entrée manuelle.",
   "columns": {
    "name": "Nom",
    "kind": "Type",
    "origin": "Origine",
    "summary": "Résumé",
    "source": "Provenance",
    "hints": "Indications",
    "tags": "Tags",
    "lastRefreshedUtc": "Dernière actualisation",
    "id": "ID",
    "createdUtc": "Créée le"
   },
   "fields": {
    "name": "Nom",
    "kind": "Type",
    "summary": "Résumé",
    "sourceAgentId": "Agent qu'elle représente",
    "sourceMcpServerId": "Serveur MCP auquel elle appartient",
    "sourceToolName": "Nom de l'outil sur ce serveur",
    "tags": "Tags",
    "requirements": "Étiquettes de nœud requises pour une exécution",
    "inputSchema": "Schéma d'entrée",
    "outputSchema": "Schéma de sortie"
   },
   "hints": {
    "kind": "Les entrées manuelles peuvent être de n'importe quel type, par exemple un service de conversion que les agents atteignent via une ressource Skill.",
    "requirements": "Une exécution d'un agent qui utilise cette capacité ne va qu'aux workers qui portent chacune de ces étiquettes de nœud.",
    "sourceMcpServerId": "Facultatif. Un jeton d'exécution ne voit une entrée qui nomme un serveur que si son déploiement lie ce serveur.",
    "inputSchema": "Un JSON Schema, par exemple {\"type\": \"object\"}. Laissez vide si la capacité accepte du texte libre."
   },
   "tagFilter": "Filtrer par tag",
   "refresh": "Actualiser",
   "warningBadge": "Échec de l'actualisation",
   "warnings_one": "{{count}} entrée a conservé son dernier contenu valide, car la dernière actualisation de sa source a échoué. Ouvrez-la pour en voir la raison.",
   "warnings_other": "{{count}} entrées ont conservé leur dernier contenu valide, car la dernière actualisation de leur source a échoué. Ouvrez-en une pour en voir la raison.",
   "noSourceOption": "Aucune",
   "requirementKey": "Étiquette de nœud",
   "requirementValue": "Valeur"
  },
  "harnessProfiles": {
   "fields": {
    "toolProbes": "Sondes d'outil",
    "probeName": "Nom de l'outil",
    "probeExecutable": "Exécutable",
    "probeArgument": "Argument passé",
    "probeDescription": "Description"
   },
   "columns": {
    "toolProbes": "Sondes d'outil"
   },
   "hints": {
    "toolProbes": "Outils que ce harness peut utiliser lorsque l'hôte du worker en dispose. Les workers lancent chaque sonde avant de s'enregistrer et signalent les outils qui répondent sous forme d'étiquettes de nœud garrison.io/tool-{name}=true."
   },
   "addToolProbe": "Ajouter une sonde d'outil",
   "probeNoArgument": "Aucun argument"
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
})(fr, {
 "enums": {
  "fanOutGroupStatus": {
   "Running": "En cours",
   "Joined": "Rassemblé",
   "TimedOut": "Délai dépassé",
   "BudgetExceeded": "Budget dépassé",
   "Cancelled": "Annulé"
  },
  "fanOutJoinPolicy": {
   "All": "Tous",
   "Any": "N'importe lequel",
   "Quorum": "Quorum"
  },
  "resourceType": {
   "FanOutGroup": "Groupe de fan-out"
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "Groupe de fan-out"
  }
 },
 "components": {
  "fanOut": {
   "group": "Groupe de fan-out",
   "groupTitle": "Groupe de fan-out {{id}}",
   "otherChildren": "Autres exécutions enfants",
   "detailsUnavailable": "Les détails du groupe n'ont pas pu être chargés ; seules ses exécutions membres sont listées.",
   "policy": "Règle de rassemblement",
   "quorumPolicy": "{{policy}} : {{quorum}} sur {{total}}",
   "progress": "Avancement",
   "progressValue": "{{finished}} sur {{total}} terminés, {{succeeded}} réussis",
   "cost": "Coût",
   "tokens": "Jetons",
   "usedOf": "{{used}} sur {{limit}}",
   "noLimit": "{{used}} (sans limite)",
   "deadline": "Échéance",
   "noDeadline": "Aucune",
   "started": "Démarré",
   "completed": "Terminé",
   "pending": "Encore en cours : {{labels}}",
   "failed": "Sans succès : {{labels}}",
   "live": "En direct",
   "polling": "Interrogation",
   "cancel": "Annuler le groupe",
   "cancelTitle": "Annuler le groupe de fan-out",
   "confirmCancel": "Annuler le groupe de fan-out {{id}} ? Les membres encore en cours sont annulés, et l'exécution parente voit le groupe comme annulé.",
   "cancelledToast": "Le groupe de fan-out {{id}} a été annulé.",
   "columns": {
    "label": "Libellé",
    "agent": "Agent",
    "status": "État",
    "costUsd": "Coût",
    "tokens": "Jetons",
    "run": "Exécution"
   }
  }
 },
 "common": {
  "serverText": {
   "fanOutParentEnded": "L'exécution parente s'est terminée ou a été annulée.",
   "fanOutCostExceeded": "Les membres ont dépensé {{cost}} USD, au-delà du budget de {{budget}} USD.",
   "fanOutTokensExceeded": "Les membres ont utilisé {{tokens}} jetons, au-delà du budget de {{budget}}.",
   "fanOutTimedOut": "Le délai du groupe de {{seconds}} secondes est écoulé alors que {{running}} membres étaient encore en cours.",
   "fanOutAnySucceeded": "Un membre a réussi.",
   "fanOutNoneSucceeded": "Tous les membres sont terminés et aucun n'a réussi.",
   "fanOutQuorumMet": "{{succeeded}} membres ont réussi, le quorum de {{quorum}} est atteint.",
   "fanOutQuorumUnreachable": "Trop de membres ont échoué pour atteindre le quorum de {{quorum}}.",
   "fanOutAllFinished": "Tous les membres sont terminés.",
   "fanOutCancelledByTool": "Annulé par l'exécution parente avec garrison_cancel_fan_out.",
   "fanOutCancelledBy": "Annulé par {{who}}."
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
})(fr, {
 "nav": {
  "items": {
   "apps": {
    "label": "Applications",
    "tip": "Applications agentiques : groupes d'agents derrière une seule interface de chat pour les utilisateurs finaux, avec leur graphe d'appels, leur délégation, leurs révisions et leur URL partageable."
   }
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "Utilisateurs du locataire",
   "AppUsers": "Utilisateurs de l'application",
   "Anonymous": "Anonyme"
  },
  "resourceType": {
   "AgenticApp": "Application agentique"
  }
 },
 "errorCodes": {
  "AppSlugTaken": "Une autre application utilise déjà ce slug d'URL. Les slugs sont uniques dans tout le cluster, choisissez-en donc un autre.",
  "NoPublishedRevision": "Aucune révision publiée n'est disponible. Publiez-en une d'abord.",
  "AgentInUse": "Cet agent est membre d'une application agentique. Retirez-le d'abord de l'application."
 },
 "common": {
  "fieldCodes": {
   "InvalidName": "Utilisez de 1 à 64 lettres minuscules, chiffres et traits d'union, en commençant et en terminant par une lettre ou un chiffre.",
   "InvalidSlug": "Utilisez de 2 à 63 lettres minuscules, chiffres et traits d'union, en commençant par une lettre ou un chiffre.",
   "UnknownAgent": "Cet agent n'existe pas dans ce locataire.",
   "DuplicateMember": "Chaque agent ne peut être membre qu'une seule fois.",
   "EntryNotMember": "L'agent d'entrée doit faire partie des membres.",
   "EdgeNotMember": "Les deux extrémités d'un appel doivent être membres de l'application.",
   "SelfEdge": "Un membre ne peut pas s'appeler lui-même.",
   "AppGraphCycle": "Les appels entre les membres forment un cycle. Retirez l'un des appels de la boucle.",
   "UnreachableMember": "Chaque membre doit être joignable depuis l'agent d'entrée par des appels.",
   "UnreachableMemberNamed": "L'agent d'entrée ne peut pas joindre ces membres par des appels : {{names}}. Ajoutez un appel vers chacun d'eux ou retirez-les.",
   "UnknownEnvironment": "Cet environnement n'existe pas dans le locataire.",
   "InvalidEntryDeployment": "Choisissez un déploiement de l'agent d'entrée dans cet environnement.",
   "DuplicateEnvironment": "Indiquez chaque environnement une seule fois.",
   "InvalidColor": "Utilisez une couleur au format #RRGGBB, par exemple #1F6FEB.",
   "UnknownAsset": "Cette ressource d'agent n'existe pas dans ce locataire.",
   "Required": "Ce champ est obligatoire.",
   "TooMany": "Il y a trop d'éléments ici."
  },
  "serverText": {
   "appNameConflict": "Une application nommée {{name}} existe déjà.",
   "appSlugTaken": "Le slug d'URL {{slug}} est déjà pris. Les slugs sont uniques dans tout le cluster, choisissez-en donc un autre.",
   "appNoPublishedRevision": "L'application {{name}} n'a aucune révision publiée à promouvoir.",
   "appMemberNotPublished": "Le membre {{name}} n'a aucune révision publiée à épingler. Publiez-en une d'abord.",
   "appRevisionPublished": "La révision {{number}} de l'application {{name}} est déjà publiée.",
   "appNoTargetDeployments": "Le membre {{member}} n'a aucun déploiement dans l'environnement {{environment}}. Créez-en un d'abord. Rien n'a été promu.",
   "agentInApps": "L'agent {{agent}} est membre de {{apps}}. Retirez-le d'abord de l'application."
  }
 },
 "components": {
  "form": {
   "pickColor": "Choisir une couleur pour {{field}}"
  },
  "apps": {
   "graph": {
    "empty": "Ajoutez des membres pour voir le graphe de l'application.",
    "summary": "Graphe de l'application avec {{members}} membres et {{edges}} appels",
    "edgeFanOut": "{{caller}} appelle {{callee}}, y compris plusieurs fois à la fois",
    "edgeSingle": "{{caller}} appelle {{callee}}, un appel à la fois",
    "entryNode": "{{name}}, l'agent d'entrée",
    "unreachableNode": "{{name}}, que l'agent d'entrée ne peut pas joindre",
    "entry": "agent d'entrée",
    "unreachable": "injoignable",
    "legendFanOut": "Appels en parallèle autorisés",
    "legendSingle": "Un appel à la fois"
   },
   "share": {
    "noSlug": "Donnez un nom ou un slug d'URL à l'application pour obtenir son lien.",
    "open": "Ouvrir",
    "copy": "Copier l'URL de l'application",
    "inactive": "L'application est inactive : le lien ne fonctionne pas tant que vous ne la réactivez pas.",
    "signIn": {
     "TenantUsers": "Tout utilisateur actif de ce locataire peut se connecter.",
     "AppUsers": "Seuls les utilisateurs qui ont le rôle AppUser sur cette application peuvent se connecter.",
     "Anonymous": "Toute personne disposant du lien peut utiliser l'application sans se connecter. Les utilisateurs connectés fonctionnent toujours.",
     "AnonymousDisabled": "Anonyme est choisi mais pas activé : personne n'entre sans se connecter, et seuls les utilisateurs du locataire ayant accès peuvent se connecter."
    }
   },
   "delegation": {
    "title": "Délégation issue du graphe de l'application",
    "intro": "Les appels de l'application constituent sa politique de délégation. Chaque membre doit autoriser exactement les membres qu'il appelle, avec une profondeur maximale qui couvre la plus longue chaîne en dessous de lui. Les membres dont la révision publiée indique autre chose sont en écart.",
    "apply": "Écrire les brouillons",
    "applying": "Écriture des brouillons...",
    "applied": "{{drafts}} révisions brouillon écrites ; {{skipped}} membres ignorés.",
    "appliedSummary": "{{drafts}} révisions brouillon écrites, rien n'a été publié. {{skipped}} membres ont été ignorés. Vérifiez et publiez les brouillons dans l'onglet Révisions de chaque agent.",
    "drifting_one": "La délégation publiée de {{count}} membre diffère du graphe.",
    "drifting_other": "La délégation publiée de {{count}} membres diffère du graphe.",
    "inSync": "La délégation publiée de chaque membre correspond au graphe.",
    "empty": "Cette application n'a aucun membre.",
    "notPublished": "Non publiée",
    "drift": "Écart",
    "inSyncBadge": "Synchronisé",
    "draftConflict": "Conflit de brouillon",
    "draft": "Brouillon {{number}}",
    "review": "Les brouillons ne sont pas encore actifs. Ouvrez chaque agent, vérifiez le brouillon dans son onglet Révisions et publiez-le.",
    "columns": {
     "member": "Membre",
     "desiredMode": "Mode du graphe",
     "desiredAllowList": "Liste d'autorisation du graphe",
     "desiredMaxDepth": "Profondeur du graphe",
     "publishedMode": "Mode publié",
     "publishedAllowList": "Liste d'autorisation publiée",
     "publishedMaxDepth": "Profondeur publiée",
     "status": "Statut"
    }
   },
   "revisions": {
    "title": "Révisions de l'application",
    "intro": "Une révision d'application épingle la dernière révision publiée de chaque membre et copie les appels entre eux. Publiez-la, puis promouvez-la pour faire passer tous les membres ensemble à l'environnement suivant.",
    "changeNote": "Note de modification",
    "changeNotePlaceholder": "Ce qui a changé depuis la dernière révision",
    "take": "Créer une révision",
    "taking": "Création...",
    "taken": "Révision d'application {{number}} créée.",
    "published": "Révision d'application {{number}} publiée.",
    "empty": "Aucune révision d'application pour l'instant. Créez-en une lorsque chaque membre a une révision publiée.",
    "promote": "Promouvoir",
    "publish": "Publier",
    "publishTitle": "Publier la révision d'application {{number}}",
    "publishConfirm": "Publier la révision {{number}} de {{name}} ? Une révision publiée ne peut plus changer et devient celle utilisée par défaut pour les promotions.",
    "pin": "{{name}}, révision {{number}}",
    "columns": {
     "number": "Révision",
     "state": "État",
     "members": "Membres épinglés",
     "edges": "Appels",
     "author": "Auteur",
     "changeNote": "Note de modification",
     "publishedUtc": "Publiée",
     "actions": "Actions"
    }
   },
   "promote": {
    "title": "Promouvoir l'application",
    "intro": "La révision épinglée de chaque membre est appliquée en une seule étape à chaque déploiement de ce membre dans l'environnement cible. Si un membre n'y a aucun déploiement, rien ne bouge.",
    "revision": "Révision d'application",
    "latestRevision": "Dernière publiée",
    "promoted": "Application promue vers {{target}} : {{deployments}} déploiements mis à jour.",
    "denied": "Vous ne pouvez pas promouvoir vers {{target}}. La promotion nécessite Exécuter sur Promotion d'environnement pour l'environnement cible."
   }
  }
 },
 "resources": {
  "apps": {
   "title": "Applications",
   "subtitle": "Groupes d'agents derrière une seule interface de chat pour les utilisateurs finaux. L'agent d'entrée parle aux personnes et appelle les autres membres selon les appels de l'application.",
   "add": "Ajouter une application",
   "create": "Créer une application",
   "edit": "Modifier l'application",
   "view": "Détails de l'application",
   "deleteTitle": "Supprimer l'application",
   "emptyTitle": "Aucune application pour l'instant",
   "emptyBody": "Créez une application à partir d'agents existants : choisissez les membres, l'agent d'entrée qui parle aux personnes, et qui appelle qui.",
   "columns": {
    "name": "Nom",
    "url": "URL de l'application",
    "entryAgentId": "Agent d'entrée",
    "members": "Membres",
    "liveEnvironment": "Environnement actif",
    "authMode": "Connexion",
    "active": "Statut",
    "description": "Description",
    "id": "ID",
    "lastUpdateUtc": "Mise à jour",
    "createdUtc": "Création"
   },
   "fields": {
    "name": "Nom",
    "slug": "Slug d'URL",
    "description": "Description",
    "active": "Active",
    "members": "Membres",
    "membersItems": {
     "agentId": "Agent",
     "role": "Rôle"
    },
    "entryAgentId": "Agent d'entrée",
    "edges": "Appels entre membres",
    "edgesItems": {
     "callerAgentId": "Appelant",
     "calleeAgentId": "Appelé",
     "fanOutAllowed": "Appels en parallèle autorisés"
    },
    "graph": "Graphe",
    "environments": "Déploiement d'entrée par environnement",
    "environmentsItems": {
     "environment": "Environnement",
     "deploymentId": "Déploiement d'entrée"
    },
    "liveEnvironment": "Environnement actif",
    "authMode": "Qui peut utiliser l'application",
    "anonymousEnabled": "Autoriser l'utilisation anonyme",
    "showOperatorDetail": "Montrer les appels d'outil et le raisonnement aux utilisateurs finaux",
    "share": "Lien partageable",
    "displayName": "Nom affiché",
    "logoAssetId": "Logo",
    "primaryColor": "Couleur principale",
    "accentColor": "Couleur d'accent",
    "welcomeText": "Texte d'accueil"
   },
   "hints": {
    "slug": "L'application se trouve à /apps/{slug}/. Laissez vide pour utiliser le nom. Les slugs sont uniques dans tout le cluster.",
    "members": "Les agents de l'application. Le rôle est une courte note sur ce que fait chacun.",
    "entryAgentId": "Le membre qui parle aux utilisateurs finaux. Tous les autres membres doivent être joignables depuis lui.",
    "edges": "Qui peut appeler qui. Les appels ne doivent pas former de boucle, et ils deviennent la politique de délégation de chaque membre.",
    "environments": "Le déploiement de l'agent d'entrée que l'application utilise dans chaque environnement. Sans indication, l'application y utilise le premier déploiement actif de l'agent d'entrée, par ordre de nom.",
    "liveEnvironment": "L'environnement avec lequel l'interface de l'application communique.",
    "anonymousEnabled": "Nécessaire pour la connexion anonyme. Les sessions anonymes sont courtes et limitées en débit.",
    "showOperatorDetail": "Les utilisateurs finaux voient toujours les réponses, les résultats et les erreurs. Activez cette option pour montrer aussi les appels d'outil, le raisonnement et la progression.",
    "logoAssetId": "La première image de la version actuelle de la ressource.",
    "welcomeText": "Affiché aux utilisateurs finaux avant leur premier message."
   },
   "steps": {
    "general": "Application",
    "members": "Membres et appels",
    "environments": "Environnements",
    "access": "Connexion et lien",
    "branding": "Habillage"
   },
   "actions": {
    "delegation": "Délégation",
    "revisions": "Révisions et promotion"
   },
   "errors": {
    "nameTaken": "Une autre application de ce locataire utilise déjà ce nom."
   },
   "addMember": "Ajouter un membre",
   "addEdge": "Ajouter un appel",
   "addEnvironment": "Ajouter un environnement",
   "chooseAgent": "Choisir un agent",
   "chooseEntry": "Choisir un membre",
   "rolePlaceholder": "Ce que fait ce membre",
   "noEntryDeployment": "Premier déploiement actif",
   "noLogo": "Aucun logo",
   "displayNamePlaceholder": "Affiché dans l'en-tête de l'application"
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
})(fr, {
 "nav": {
  "items": {
   "studio": {
    "label": "Atelier",
    "tip": "Atelier d'agents : concevez des agents et des applications dans des brouillons avec l'architecte d'agents, essayez-les dans le bac à sable et demandez l'application d'un brouillon."
   }
  }
 },
 "enums": {
  "resourceType": {
   "StudioDraft": "Brouillon d'atelier"
  },
  "approvalKind": {
   "DraftApply": "Application de brouillon"
  },
  "studioDraftStatus": {
   "Open": "Ouvert",
   "PendingApproval": "En attente d'approbation",
   "Applied": "Appliqué",
   "Discarded": "Abandonné"
  },
  "studioDraftOperation": {
   "Upsert": "Créer ou mettre à jour",
   "Delete": "Supprimer"
  },
  "studioDiffChange": {
   "Create": "Créer",
   "Update": "Mettre à jour",
   "Delete": "Supprimer",
   "Unchanged": "Inchangé",
   "Failed": "En échec"
  }
 },
 "errorCodes": {
  "DraftVersionConflict": "Le brouillon a changé depuis votre lecture. Relisez-le et réessayez.",
  "DraftNotOpen": "Le brouillon n'est pas ouvert et ne peut donc pas changer. Seul un brouillon ouvert accepte des modifications.",
  "DraftStale": "La configuration active a changé après la création du brouillon à partir d'elle. Mettez à jour les éléments obsolètes et redemandez l'application.",
  "DraftInvalid": "Le brouillon contient des documents qui ne sont pas valides. Corrigez d'abord les éléments marqués En échec.",
  "DraftEmpty": "Le brouillon ne contient aucun élément, il n'y a donc rien à appliquer.",
  "ApproverLacksPermission": "Vous ne pouvez pas autoriser ce brouillon : il faut Create sur Manifest et Delete sur chaque type que le brouillon supprime.",
  "AgentNotLive": "Cet agent est nouveau dans ce brouillon. Appliquez le brouillon avant d'essayer l'agent dans le bac à sable.",
  "NotAnArchitectDeployment": "Seuls les déploiements d'architecte acceptent un prompt d'architecte : les déploiements de agent-architect ou avec accès aux brouillons.",
  "InvalidArchitectPrompt": "Ce prompt ne peut pas servir de prompt d'architecte. Choisissez un modèle System de ce locataire.",
  "PromptTemplateInUse": "Ce modèle de prompt est lié à des déploiements. Basculez-les d'abord vers un autre modèle.",
  "ReservedEnvironment": "L'environnement de brouillon est réservé au bac à sable.",
  "NoDeploymentInEnvironment": "L'agent n'a aucun déploiement dans cet environnement."
 },
 "views": {
  "studio": {
   "title": "Atelier",
   "subtitle": "Concevez des agents et des applications dans des brouillons. Rien ne change dans la configuration active tant qu'une personne n'a pas approuvé l'application d'un brouillon.",
   "newDraft": "Nouveau brouillon",
   "refresh": "Actualiser",
   "search": "Rechercher dans les titres",
   "scopeLabel": "Brouillons de qui",
   "scopes": {
    "mine": "Les miens",
    "all": "Tous"
   },
   "statusLabel": "Statut",
   "columns": {
    "title": "Titre",
    "status": "Statut",
    "owner": "Propriétaire",
    "targetApp": "Application cible",
    "items": "Éléments",
    "version": "Version",
    "updated": "Mis à jour"
   },
   "open": "Ouvrir",
   "discard": "Abandonner",
   "discardTitle": "Abandonner le brouillon",
   "discardMessage": "Abandonner {{title}} ? Un brouillon abandonné ne peut plus changer ni être appliqué.",
   "discardPendingMessage": "Abandonner {{title}} ? Son approbation d'application est annulée, et le brouillon ne peut plus changer ni être appliqué.",
   "discarded": "{{title}} abandonné.",
   "emptyTitle": "Aucun brouillon",
   "emptyBody": "Commencez un brouillon, vide ou à partir d'une application existante, et concevez-le avec l'architecte d'agents.",
   "emptyFiltered": "Aucun brouillon ne correspond à ces filtres.",
   "untitled": "Brouillon sans titre"
  },
  "studioDraft": {
   "title": "Brouillon d'atelier",
   "notFoundTitle": "Brouillon introuvable",
   "notFoundBody": "Le brouillon n'existe pas, ou vous n'avez pas le droit de le lire.",
   "back": "Tous les brouillons",
   "version": "Version {{version}}",
   "live": "En direct",
   "polling": "Interrogation",
   "architect": "Architecte",
   "tabsLabel": "Espace de travail du brouillon",
   "tabs": {
    "architect": "Architecte",
    "items": "Éléments",
    "graph": "Graphe",
    "apply": "Comparer et appliquer",
    "playground": "Bac à sable",
    "preview": "Aperçu de compilation",
    "prompts": "Prompt d'architecte"
   },
   "notOpen": {
    "PendingApproval": "Ce brouillon attend une décision sur son application et ne peut donc pas changer. Refusez l'approbation ou abandonnez le brouillon pour le modifier à nouveau.",
    "Applied": "Ce brouillon a été appliqué à la configuration active et ne peut plus changer. Commencez un nouveau brouillon pour d'autres modifications.",
    "Discarded": "Ce brouillon a été abandonné et ne peut plus changer.",
    "other": "Ce brouillon ne peut pas changer pour le moment."
   },
   "liveNotice": "Le brouillon est passé à la version {{version}} ({{status}}).",
   "liveChanged": "Modifié : {{items}}.",
   "removedTag": "retiré",
   "dismissNotice": "Masquer"
  }
 },
 "components": {
  "studio": {
   "newDraft": {
    "title": "Nouveau brouillon",
    "intro": "Un brouillon contient les documents de manifeste que vous et l'architecte d'agents modifiez. Commencez vide, ou à partir d'une application existante avec tout ce qu'elle référence.",
    "titleField": "Titre",
    "titlePlaceholder": "Application de recherche avec un rédacteur",
    "fromApp": "Partir d'une application",
    "emptyDraft": "Brouillon vide",
    "fromAppHint": "L'application, ses membres, leurs déploiements, prompts et assets deviennent des éléments. Chacun retient la version active dont il est parti, afin que l'atelier remarque les changements ultérieurs.",
    "create": "Créer le brouillon",
    "creating": "Création...",
    "created": "Brouillon {{title}} commencé."
   },
   "architect": {
    "title": "Nouvel architecte",
    "intro": "L'architecte d'agents conçoit des agents et des applications dans vos brouillons. Donnez-lui un déploiement : un profil de harness, un modèle et le prompt avec lequel il travaille. Il ne modifie que vos brouillons et ne les applique jamais.",
    "name": "Nom du déploiement",
    "harnessProfile": "Profil de harness",
    "chooseProfile": "Choisir un profil de harness",
    "model": "Modèle",
    "modelHint": "Laissez vide pour utiliser le modèle par défaut du profil de harness.",
    "prompt": "Prompt d'architecte",
    "defaultPrompt": "{{name}} (par défaut)",
    "preview": "Aperçu du prompt",
    "previewEmpty": "Choisissez un prompt pour voir son rendu.",
    "cloneLink": "Cloner ce prompt pour le modifier",
    "noAgent": "Ce locataire n'a aucun agent nommé {{name}}, aucun architecte ne peut donc être créé. Contactez un administrateur.",
    "create": "Créer l'architecte",
    "creating": "Création...",
    "created": "Architecte {{name}} créé."
   },
   "chat": {
    "title": "Architecte",
    "architect": "Déploiement d'architecte",
    "chooseArchitect": "Choisir un architecte",
    "newArchitect": "Nouvel architecte",
    "noArchitect": "Il n'existe encore aucun déploiement d'architecte. Créez-en un pour concevoir avec l'architecte d'agents.",
    "openConversation": "Ouvrir la conversation",
    "newConversation": "Nouvelle conversation",
    "you": "Vous",
    "architectSays": "Architecte",
    "openRun": "Exécution",
    "thinking": "En cours...",
    "empty": "Dites à l'architecte quoi construire. Le premier message lui indique dans quel brouillon travailler.",
    "pickFirst": "Choisissez ou créez un architecte pour commencer.",
    "message": "Message",
    "placeholder": "Conçois une application de recherche : un planificateur qui répartit le travail entre deux chercheurs et un rédacteur.",
    "firstHint": "Démarre une conversation avec cet architecte au sujet de ce brouillon.",
    "continueHint": "Poursuit la conversation. Ctrl+Enter ou Cmd+Enter envoie.",
    "send": "Envoyer"
   },
   "items": {
    "title": "Éléments",
    "titleCount": "Éléments ({{total}})",
    "add": "Ajouter un élément",
    "addConfirm": "Ouvrir l'éditeur",
    "columns": {
     "kind": "Type",
     "name": "Nom",
     "operation": "Opération",
     "stale": "Obsolète",
     "updated": "Mis à jour"
    },
    "stale": "Obsolète",
    "empty": "Aucun élément pour l'instant. Ajoutez-en un ou demandez à l'architecte.",
    "remove": "Retirer",
    "removeTitle": "Retirer l'élément",
    "removeMessage": "Retirer {{item}} du brouillon ? La configuration active ne change pas.",
    "removed": "{{item}} retiré.",
    "saved": "{{item}} enregistré. Le brouillon est à la version {{version}}.",
    "editorTitle": "Modifier {{item}}",
    "newEditorTitle": "Nouvel élément {{item}}",
    "document": "Document de manifeste",
    "versionHint": "L'enregistrement envoie la version {{version}}, celle que vous avez lue. Si le brouillon a changé depuis, l'enregistrement est refusé et votre texte reste ici.",
    "unsaved": "Modifications non enregistrées",
    "errors": {
     "name": "Utilisez des lettres, des chiffres, des points, des barres obliques et des traits d'union, en commençant par une lettre ou un chiffre.",
     "exists": "Le brouillon contient déjà {{kind}}/{{name}}.",
     "deleteKind": "Seuls les éléments Agent, Deployment, Pipeline et AgenticApp peuvent être supprimés, pas {{kind}}."
    },
    "conflict": {
     "title": "Le brouillon a changé pendant votre modification : la version {{from}} est maintenant {{to}}.",
     "added": "Ajoutés : {{items}}",
     "updated": "Modifiés : {{items}}",
     "removed": "Retirés : {{items}}",
     "status": "Son statut est maintenant {{status}}.",
     "layout": "Seule la disposition de son graphe a changé.",
     "mine": "L'élément que vous modifiez a changé aussi. Comparez votre texte avec la nouvelle version avant d'enregistrer à nouveau.",
     "retry": "Votre texte est toujours dans l'éditeur. Enregistrez à nouveau pour l'appliquer à la nouvelle version.",
     "dismiss": "Masquer"
    }
   },
   "graph": {
    "title": "Graphe",
    "empty": "Le brouillon ne contient encore aucune application ni aucun agent à dessiner.",
    "depth": "profondeur {{depth}}",
    "entryAgent": "Agent d'entrée : {{name}}",
    "deleted": "Supprimé",
    "inDraft": "Dans le brouillon",
    "loose": "Agents hors application",
    "capabilities": "Capacités : {{list}}",
    "legend": "Chaque appel indique la profondeur de délégation dont il a besoin. Une ligne pleine autorise les appels parallèles, une ligne pointillée un appel à la fois. Les capacités apparaissent sous le nom d'un agent."
   },
   "diff": {
    "title": "Comparer et appliquer",
    "refresh": "Actualiser la comparaison",
    "validate": "Valider",
    "validating": "Validation...",
    "requestApply": "Demander l'application",
    "requesting": "Demande en cours...",
    "requested": "Application demandée. Une personne autorisée à appliquer des manifestes en décidera.",
    "valid": "Valide : {{create}} à créer, {{update}} à mettre à jour, {{delete}} à supprimer, {{unchanged}} inchangés.",
    "invalid": "Non valide : {{failed}} en échec et {{stale}} obsolètes. Prévu : {{create}} à créer, {{update}} à mettre à jour, {{delete}} à supprimer, {{unchanged}} inchangés.",
    "validOk": "Le brouillon est valide.",
    "validFailed": "Le brouillon n'est pas valide. Voyez les éléments marqués En échec ou Obsolète.",
    "empty": "Le brouillon ne contient aucun élément à comparer.",
    "columns": {
     "item": "Élément",
     "change": "Changement",
     "details": "Détails"
    },
    "none": "(aucun)",
    "approval": "Approbation d'application",
    "allow": "Autoriser",
    "deny": "Refuser",
    "allowed": "Autorisé. Le brouillon est en cours d'application.",
    "denied": "Refusé. Le brouillon est de nouveau ouvert.",
    "reason": "Motif",
    "reasonPlaceholder": "Facultatif, conservé avec la décision",
    "waiting": "En attente d'une personne autorisée à décider des approbations et à appliquer des manifestes.",
    "applied": "Appliqué en tant qu'application de manifeste {{id}}."
   },
   "playground": {
    "title": "Bac à sable",
    "intro": "Chaque tour enregistre le document de l'agent dans le brouillon comme sa révision de brouillon et l'exécute sur un déploiement temporaire du bac à sable. Rien n'est publié, et la configuration active ne change pas.",
    "agent": "Agent",
    "defaultAgent": "Agent d'entrée ({{name}})",
    "defaultAgentShort": "Agent d'entrée",
    "input": "Entrée",
    "answer": "Réponse",
    "placeholder": "Que doit faire l'agent ?",
    "firstHint": "Démarre une conversation dans le bac à sable.",
    "continueHint": "Poursuit la conversation dans le bac à sable.",
    "send": "Lancer le tour",
    "turn": "Tour {{number}}, {{agent}}",
    "openRun": "Détail de l'exécution",
    "conversation": "Conversation",
    "export": "Télécharger la transcription",
    "reset": "Nouvelle conversation",
    "empty": "Aucun tour pour l'instant.",
    "exportDraft": "Brouillon",
    "exportTurn": "Tour",
    "exportRun": "Exécution"
   },
   "preview": {
    "title": "Aperçu de compilation",
    "intro": "Voyez avec quoi une exécution démarrerait avant de déployer : la ligne de commande, l'emplacement des assets et le montage de l'espace de fichiers. Les valeurs secrètes sont masquées.",
    "deployment": "Déploiement",
    "chooseDeployment": "Choisir un déploiement",
    "revision": "Révision de l'agent",
    "deploymentRevision": "La révision propre au déploiement",
    "revisionOption": "Révision {{number}} ({{state}})",
    "environment": "Environnement",
    "deploymentEnvironment": "L'environnement du déploiement",
    "input": "Entrée d'exemple",
    "compiled": "{{deployment}} compilé avec {{revision}}.",
    "assets": "Assets placés ({{total}})",
    "noAssets": "La révision ne place aucun asset.",
    "columns": {
     "path": "Chemin",
     "asset": "Asset",
     "kind": "Type",
     "version": "Version",
     "size": "Taille"
    },
    "fileSpace": "Espace de fichiers",
    "fileSpaceMount": "Monté sur {{path}} avec {{files}} fichiers actuellement (au plus {{maxFiles}} fichiers de {{maxBytes}} maximum chacun).",
    "noFileSpace": "Aucun espace de fichiers n'est monté, car l'exécution ne ferait pas partie d'une conversation.",
    "redacted": "Le serveur masque les valeurs secrètes dans la ligne de commande, l'environnement et les fichiers."
   },
   "prompts": {
    "title": "Prompt d'architecte",
    "templatesLink": "Ouvrir dans Modèles de prompt",
    "forArchitect": "Prompts utilisables par l'architecte d'agents. Sélectionnez-en un pour {{architect}}.",
    "noArchitect": "Prompts utilisables par l'architecte d'agents. Choisissez un architecte dans l'onglet Architecte pour lui en attribuer un.",
    "nextTurn": "Une nouvelle sélection ou une modification enregistrée prend effet au prochain tour de l'architecte.",
    "current": "{{architect}} utilise {{name}} et suit sa version actuelle ({{version}}).",
    "currentPinned": "{{architect}} utilise {{name}}, épinglé à la version {{version}}.",
    "inUse": "{{name}} ne peut pas être supprimé tant que des déploiements l'utilisent : {{deployments}}. Sélectionnez d'abord un autre prompt pour eux.",
    "empty": "Aucun prompt d'architecte.",
    "columns": {
     "name": "Nom",
     "description": "Description",
     "version": "Version",
     "usedBy": "Utilisé par"
    },
    "default": "Par défaut",
    "selectedBadge": "Sélectionné",
    "usedBy": "Architectes : {{total}}",
    "select": "Sélectionner",
    "selected": "{{architect}} utilise {{name}} à partir de son prochain tour.",
    "saved": "{{name}} enregistré comme nouvelle version.",
    "editorTitle": "Modifier {{name}} (version {{version}})",
    "name": "Nom",
    "description": "Description",
    "body": "Corps du prompt",
    "preview": "Aperçu du rendu",
    "deleteMessage": "Supprimer {{name}} ? Déploiements d'architecte qui l'utilisent : {{total}}. Un prompt utilisé ne peut pas être supprimé."
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
})(fr, {
 "components": {
  "studio": {
   "canvas": {
    "title": "Canevas",
    "appPicker": "Application",
    "flowLabel": "Canevas de l'application {{app}}",
    "noApp": "Le brouillon ne contient encore aucune application. Demandez-en une à l'architecte, ou commencez un brouillon à partir d'une application existante.",
    "calls": "Appels ({{total}})",
    "noCalls": "Aucun appel pour l'instant. Faites glisser depuis le bord droit d'un agent vers un autre agent, ou appuyez sur C sur un agent puis sur Entrée sur l'autre.",
    "addLoose": "Ajouter à l'application",
    "remove": "Retirer de l'application",
    "removeTitle": "Retirer l'agent de l'application",
    "removeMessage": "Retirer {{name}} de {{app}} ? Ses appels partent aussi. L'agent lui-même reste, et la configuration active ne change pas tant que le brouillon n'est pas appliqué.",
    "operationFailed": "{{operation}} a été refusé.",
    "operations": {
     "AddMember": "Ajout d'un agent",
     "RemoveMember": "Retrait d'un agent",
     "Connect": "Connexion",
     "Disconnect": "Déconnexion",
     "SetEntry": "Choix de l'agent d'entrée",
     "MoveNode": "Déplacement d'un agent"
    },
    "toolbar": {
     "label": "Actions du canevas",
     "addAgent": "Ajouter un agent",
     "addPlaceholder": "Nom de l'agent",
     "role": "Rôle",
     "rolePlaceholder": "Rôle (facultatif)",
     "add": "Ajouter",
     "connect": "Connecter depuis",
     "setEntry": "Définir comme agent d'entrée",
     "remove": "Retirer",
     "disconnect": "Déconnecter",
     "fit": "Ajuster la vue"
    },
    "connectBar": {
     "message": "Connexion depuis {{name}}. Choisissez l'agent qu'il appelle : cliquez dessus, appuyez sur Entrée dessus, ou choisissez-le ici.",
     "to": "Appelle",
     "fanOut": "Appels en parallèle",
     "confirm": "Connecter"
    },
    "keys": {
     "title": "Raccourcis clavier",
     "tab": "Tab parcourt les agents dans l'ordre de lecture, en commençant par l'agent d'entrée.",
     "select": "Entrée ou Espace sélectionne l'agent qui a le focus et ouvre ses propriétés.",
     "connect": "C sur un agent commence un appel depuis celui-ci ; C ou Entrée sur un autre agent le termine.",
     "entry": "E fait de l'agent qui a le focus l'agent d'entrée.",
     "remove": "Suppr retire de l'application l'agent qui a le focus, après confirmation.",
     "move": "Les touches fléchées déplacent l'agent sélectionné ; maintenez Maj pour des pas plus grands. La position est enregistrée après une courte pause.",
     "add": "N mène au champ Ajouter un agent.",
     "calls": "Dans la liste des appels, Entrée sélectionne un appel, Suppr le déconnecte et F active ou désactive les appels en parallèle.",
     "escape": "Échap annule un appel que vous avez commencé."
    },
    "node": {
     "entry": "Entrée",
     "unreachable": "Injoignable",
     "connecting": "Appel depuis cet agent"
    },
    "a11y": {
     "node": "Appuyez sur Entrée ou Espace pour sélectionner cet agent, puis sur les touches fléchées pour le déplacer. Appuyez sur C pour le connecter, sur E pour en faire l'agent d'entrée, ou sur Suppr pour le retirer.",
     "edge": "Un appel entre deux agents. Sélectionnez-le dans la liste des appels sous le canevas.",
     "handle": "Point de connexion",
     "moved": "Agent déplacé vers {{direction}}. Nouvelle position : {{x}}, {{y}}.",
     "directions": {
      "up": "le haut",
      "down": "le bas",
      "left": "la gauche",
      "right": "la droite"
     }
    },
    "announce": {
     "added": "{{name}} ajouté à {{app}}.",
     "connectStart": "Connexion depuis {{name}}. Allez sur l'agent qu'il appelle et appuyez sur Entrée, ou appuyez sur Échap pour annuler.",
     "connectCancelled": "Connexion annulée.",
     "connected": "{{from}} appelle maintenant {{to}}.",
     "disconnected": "{{from}} n'appelle plus {{to}}.",
     "fanOutOn": "{{from}} peut maintenant appeler {{to}} en parallèle.",
     "fanOutOff": "{{from}} appelle maintenant {{to}} un appel à la fois.",
     "entry": "{{name}} est maintenant l'agent d'entrée de {{app}}.",
     "removed": "{{name}} retiré de {{app}}.",
     "selfEdge": "Un agent ne peut pas s'appeler lui-même. Choisissez un autre agent."
    },
    "summary": {
     "noApp": "Il n'y a aucune application à décrire.",
     "agents_one": "L'application {{app}} a {{count}} agent.",
     "agents_other": "L'application {{app}} a {{count}} agents.",
     "callCount_one": "Il y a {{count}} appel entre eux.",
     "callCount_other": "Il y a {{count}} appels entre eux.",
     "entry": "L'agent d'entrée est {{name}}.",
     "noEntry": "Aucun agent d'entrée n'est défini.",
     "callParallel": "{{from}} appelle {{to}}, appels en parallèle autorisés, profondeur de délégation {{depth}}.",
     "callSingle": "{{from}} appelle {{to}}, un appel à la fois, profondeur de délégation {{depth}}."
    },
    "conflict": {
     "mine": "{{item}} a changé aussi. Votre modification est toujours dans le panneau ; comparez-la avec la nouvelle version avant d'enregistrer à nouveau.",
     "kept": "Votre modification de {{item}} est toujours dans le panneau. Enregistrez à nouveau pour l'appliquer à la nouvelle version.",
     "operation": "{{operation}} n'a pas été appliqué. Réessayez sur la nouvelle version, ou laissez tomber.",
     "retry": "Réessayer"
    },
    "panel": {
     "label": "Propriétés",
     "tabsLabel": "Propriétés de {{name}}",
     "properties": "Agent",
     "runtime": "Exécution",
     "save": "Enregistrer dans le brouillon",
     "reset": "Annuler les modifications",
     "saved": "{{item}} enregistré. Comparer et appliquer montre la modification.",
     "check": "Vérification de cet élément par le serveur : {{message}}",
     "unparsable": "Le YAML de l'élément ne s'analyse pas, le panneau ne peut donc pas le modifier. Corrigez-le d'abord dans l'onglet Éléments. ({{message}})"
    },
    "agent": {
     "title": "L'agent {{name}}",
     "isEntry": "C'est l'agent d'entrée de l'application : il parle aux personnes qui utilisent l'application.",
     "notHeld": "Le brouillon ne contient pas encore le document de {{name}}. Importez-le pour le modifier ici ; la configuration active ne change pas.",
     "deleted": "Le brouillon supprime {{name}}. Rétablissez-le dans l'onglet Éléments pour le modifier.",
     "bring": "Importer dans le brouillon",
     "description": "Description",
     "inputSchema": "Schéma d'entrée",
     "outputSchema": "Schéma de sortie",
     "schemaHint": "Un JSON Schema écrit en JSON. Laissez vide pour du texte brut.",
     "assets": "Assets d'agent",
     "noAssets": "La prochaine révision n'épingle aucun asset.",
     "assetsKept": "Le document ne nomme aucun asset, l'agent garde donc ceux qu'il a.",
     "assetName": "Nom de l'asset",
     "assetVersion": "Version",
     "latest": "Dernière",
     "removeAsset": "Retirer l'asset {{name}}",
     "addAsset": "Ajouter un asset",
     "capabilities": "Capacités",
     "capabilitiesHint": "Séparez les noms par des virgules. Une liste vide les efface.",
     "capabilitiesKept": "Séparez les noms par des virgules. Si vous laissez vide, l'agent garde les capacités qu'il a.",
     "systemPrompt": "Prompt système",
     "noDeployments": "Le brouillon ne contient aucun déploiement de cet agent, aucun prompt système n'est donc défini ici.",
     "promptLine": "{{environment}} : {{deployment}} utilise {{prompt}}",
     "builtInPrompt": "le prompt par défaut intégré",
     "showRuntime": "Modifier dans l'onglet Exécution",
     "errors": {
      "json": "Ce n'est pas du JSON valide.",
      "object": "Un schéma est un objet JSON, par exemple {\"type\": \"object\"}.",
      "version": "Utilisez un nombre entier, ou laissez vide pour la dernière version."
     }
    },
    "edge": {
     "title": "Appel de {{from}} vers {{to}}",
     "from": "Appelant",
     "to": "Appelé",
     "depth": "Profondeur de délégation",
     "depthHint": "Calculée à partir du graphe : un, plus la plus longue chaîne d'appels sous {{to}}. Elle change quand les appels en dessous changent.",
     "fanOut": "Appels en parallèle (fan-out)",
     "fanOutOn": "{{from}} peut lancer plusieurs appels à {{to}} en même temps.",
     "fanOutOff": "{{from}} appelle {{to}} un appel à la fois."
    },
    "app": {
     "title": "Application {{name}}",
     "hint": "Sélectionnez un agent ou un appel sur le canevas pour le modifier. Quand rien n'est sélectionné, ce panneau modifie l'application.",
     "entry": "Agent d'entrée",
     "noEntry": "Aucun agent d'entrée",
     "noMembers": "Ajoutez d'abord un agent ; le premier devient l'agent d'entrée.",
     "notHeld": "Le brouillon ne contient pas encore le document de {{name}}. Importez-le pour modifier ici sa connexion et son apparence.",
     "deleted": "Le brouillon supprime {{name}}. Rétablissez-le dans l'onglet Éléments pour le modifier.",
     "bring": "Importer dans le brouillon",
     "description": "Description",
     "authMode": "Connexion",
     "authDefault": "Valeur par défaut du serveur",
     "anonymous": "Autoriser l'utilisation anonyme",
     "branding": "Apparence",
     "brandingFields": {
      "displayName": "Nom affiché",
      "logo": "Asset du logo",
      "primaryColor": "Couleur principale",
      "accentColor": "Couleur d'accent",
      "welcomeText": "Texte d'accueil"
     },
     "errors": {
      "color": "Utilisez une couleur hexadécimale, par exemple #1F6FEB."
     }
    },
    "runtime": {
     "title": "Exécution de {{name}}",
     "none": "Le brouillon ne contient aucun déploiement de {{name}}. Importez-en un actif ci-dessous, ou demandez-en un à l'architecte.",
     "deployment": "Environnement et déploiement",
     "option": "{{environment}} : {{name}}",
     "scope": "Les modifications ne changent que {{name}} dans {{environment}} (profil de harness {{profile}}). Les autres environnements gardent leurs propres valeurs.",
     "fields": {
      "model": "Modèle",
      "effort": "Effort",
      "timeoutSeconds": "Délai maximal (secondes)",
      "maxTurns": "Nombre maximal de tours",
      "maxBudgetUsd": "Budget maximal (USD)",
      "systemTemplate": "Modèle de prompt système",
      "systemVersion": "Version épinglée",
      "approvalsEnabled": "Demander une approbation pour les appels d'outil",
      "approvalDefaultAction": "Si aucune règle ne correspond"
     },
     "hints": {
      "timeoutSeconds": "Secondes entières, 1 ou plus. Vide : le délai du profil de harness s'applique.",
      "maxTurns": "Nombre entier, 1 ou plus. Vide : le harness décide.",
      "maxBudgetUsd": "0 ou plus, par exemple 2.50. Vide : aucun budget."
     },
     "builtIn": "Valeur par défaut intégrée",
     "approvals": "Approbations",
     "noRules": "Aucune règle. Chaque appel d'outil reçoit l'action par défaut.",
     "rule": {
      "action": "Action de la règle",
      "pattern": "Motif d'outil",
      "inputPattern": "Motif d'entrée",
      "inputPlaceholder": "Motif d'entrée (facultatif)",
      "remove": "Retirer la règle {{number}}",
      "add": "Ajouter une règle"
     },
     "live": "Déploiements actifs absents du brouillon",
     "noLive": "Chaque déploiement actif de cet agent est déjà dans le brouillon, ou il n'en a aucun.",
     "bring": "Importer dans le brouillon",
     "exportMissing": "L'export de {{name}} est revenu sans son document.",
     "errors": {
      "integer": "Utilisez un nombre entier égal ou supérieur à 1.",
      "number": "Utilisez un nombre égal ou supérieur à 0.",
      "pattern": "Une règle a besoin d'un motif d'outil.",
      "version": "Utilisez un nombre entier, et nommez un modèle à épingler."
     }
    }
   }
  }
 },
 "common": {
  "fieldCodes": {
   "NotAMember": "Cet agent n'est pas membre de l'application.",
   "SelfEdge": "Un agent ne peut pas s'appeler lui-même.",
   "NoSuchEdge": "L'application n'a pas cet appel.",
   "AppDeleted": "Le brouillon supprime cette application. Rétablissez-la d'abord.",
   "InvalidDocument": "Le document ne s'analyse pas comme un seul document de manifeste.",
   "DocumentMismatch": "Le type ou le nom du document ne correspond pas à l'élément."
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
})(fr, {
 "common": {
  "productName": "Garrison Agent Studio",
  "productLine": "Agent Studio",
  "states": {
   "studioHint": "Ou ouvrez l'Atelier d'agents et décrivez ce qu'il vous faut : l'architecte d'agents le rédige pour que vous le relisiez.",
   "openStudio": "Ouvrir l'Atelier d'agents"
  }
 },
 "nav": {
  "items": {
   "studio": {
    "label": "Atelier d'agents"
   },
   "serverInfo": {
    "label": "À propos",
    "tip": "Produit, versions, liens, points de terminaison et votre identité"
   }
  }
 },
 "wizard": {
  "steps": {
   "studio": "Atelier d'agents"
  },
  "welcomeItemStudio": "Donner à l'architecte d'agents un harness et un modèle, pour qu'il conçoive avec vous des agents et des applications dans l'Atelier d'agents (facultatif).",
  "studioBody": "L'architecte d'agents conçoit avec vous des agents et des applications dans l'Atelier d'agents. Choisissez le profil de harness et le modèle avec lesquels il s'exécute, et le prompt d'architecte qui le guide. Son déploiement ne peut modifier que vos brouillons de l'atelier. Vous pouvez ignorer cette étape et créer un architecte plus tard depuis l'atelier.",
  "createArchitect": "Créer l'architecte",
  "architectCreated": "Architecte d'agents {{name}} créé.",
  "architectReady": "L'architecte d'agents {{name}} est prêt. Après la configuration, ouvrez l'Atelier d'agents et commencez un brouillon avec lui.",
  "continue": "Continuer"
 },
 "views": {
  "home": {
   "getStartedBody": "L'assistant de configuration ajoute un identifiant, donne à l'architecte d'agents un harness et un modèle, applique un agent d'exemple et lance un test. Ou ouvrez l'Atelier d'agents et décrivez l'application que vous voulez.",
   "openStudio": "Ouvrir l'Atelier d'agents"
  },
  "studio": {
   "title": "Atelier d'agents"
  },
  "studioDraft": {
   "tabs": {
    "release": "Mise en production"
   }
  },
  "serverInfo": {
   "title": "À propos",
   "subtitle": "Versions, liens, points de terminaison et l'identité avec laquelle vous êtes connecté.",
   "positioning": "Créez, déployez et exécutez des applications agentiques avec les harnesses d'agents que vous utilisez déjà.",
   "versions": "Version du serveur {{server}}, version du tableau de bord {{dashboard}}",
   "docs": "Documentation",
   "studioDocs": "Guide de l'Atelier d'agents",
   "website": "Site web",
   "source": "Code source"
  }
 },
 "resources": {
  "apps": {
   "actions": {
    "environments": "Environnements"
   }
  }
 },
 "components": {
  "apps": {
   "release": {
    "title": "Environnements et promotion",
    "intro": "Les déploiements de chaque membre par environnement, avec la révision que chacun épingle et ses remplacements d'environnement. Comparez deux environnements avant de promouvoir, et annulez une promotion depuis l'historique.",
    "live": "En service dans {{environment}}",
    "environments": "Environnements",
    "source": "Comparer",
    "target": "avec",
    "member": "Membre",
    "entry": "Entrée",
    "noDeployment": "Aucun déploiement",
    "secretOverride": "{{name}} (valeur secrète)",
    "difference": "De {{source}} vers {{target}}",
    "differenceNone": "Différence",
    "diff": {
     "Same": "Identique",
     "Missing": "Aucun déploiement dans {{target}}",
     "revisions": "Les révisions diffèrent",
     "overrides": "Les remplacements diffèrent",
     "both": "Les révisions et les remplacements diffèrent"
    },
    "promote": "Promouvoir {{source}} vers {{target}}",
    "promoteNothing": "Promouvoir",
    "missing": "Aucun déploiement dans {{target}} : {{names}}. Une promotion échouerait maintenant sans rien déplacer ; ajoutez d'abord un déploiement à cet endroit.",
    "history": "Historique des promotions",
    "historyEmpty": "Cette application n'a pas encore été promue."
   }
  },
  "studio": {
   "release": {
    "title": "Mise en production",
    "app": "Application",
    "noAppsTitle": "Ce brouillon ne crée aucune application",
    "noAppsBody": "Ajoutez une application au brouillon, dans l'onglet Graphe ou en le demandant à l'architecte, pour la promouvoir d'ici une fois appliquée.",
    "notLiveTitle": "{{name}} n'est pas encore en service",
    "notLiveBody": "Appliquez d'abord le brouillon. L'application publie ses agents et les déploie dans dev ; vous pourrez ensuite promouvoir l'application d'ici."
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
})(fr, {
 "nav": {
  "items": {
   "architects": {
    "label": "Architectes",
    "tip": "Architectes d'agents : des déploiements réutilisables de l'architecte d'agents qui conçoivent avec vous des agents et des applications dans n'importe quel brouillon du studio."
   }
  }
 },
 "resources": {
  "architects": {
   "title": "Architectes",
   "subtitle": "Les architectes d'agents de ce locataire. Chacun est un déploiement de agent-architect avec son propre profil de harness, son modèle et son prompt, et n'importe quel brouillon du studio peut l'utiliser.",
   "add": "Ajouter un architecte",
   "create": "Créer l'architecte",
   "edit": "Modifier l'architecte",
   "view": "Détails de l'architecte",
   "deleteTitle": "Supprimer l'architecte",
   "emptyTitle": "Aucun architecte pour l'instant",
   "emptyBody": "Créez un architecte pour concevoir avec vous des agents et des applications dans Agent Studio. Choisissez le profil de harness et le modèle sur lesquels il s'exécute, et le prompt avec lequel il travaille.",
   "columns": {
    "name": "Nom",
    "harnessProfileId": "Profil de harness",
    "model": "Modèle",
    "architectPromptTemplateId": "Prompt d'architecte",
    "active": "Statut",
    "description": "Description",
    "id": "ID",
    "lastUpdateUtc": "Mise à jour",
    "createdUtc": "Création"
   },
   "fields": {
    "name": "Nom",
    "description": "Description",
    "harnessProfileId": "Profil de harness",
    "model": "Modèle",
    "architectPromptTemplateId": "Prompt d'architecte",
    "architectPromptVersion": "Version de prompt épinglée",
    "active": "Actif"
   },
   "hints": {
    "model": "Laissez vide pour utiliser le modèle par défaut du profil de harness.",
    "architectPromptVersion": "Laissez vide pour toujours utiliser la version actuelle du prompt."
   },
   "actions": {
    "prompts": "Prompts d'architecte",
    "deployment": "Paramètres du déploiement"
   },
   "errors": {
    "nameTaken": "Un autre déploiement de ce locataire utilise déjà ce nom.",
    "version": "Saisissez un nombre entier à partir de 1, ou laissez vide."
   },
   "promptPinned": "{{name}} (épinglé à la version {{version}})",
   "defaultModel": "Valeur du profil",
   "defaultBadge": "Par défaut",
   "promptsTitle": "Prompts d'architecte pour {{name}}"
  }
 },
 "components": {
  "studio": {
   "chat": {
    "manageArchitects": "Gérer les architectes"
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
})(fr, {
 "components": {
  "confirm": {
   "typeToConfirm": "Veuillez saisir '{{word}}' dans le champ ci-dessous pour confirmer."
  }
 },
 "views": {
  "agentDetail": {
   "deleted": "Agent {{name}} supprimé."
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
})(fr, {
 "components": {
  "studio": {
   "architect": {
    "credential": "Identifiants",
    "noCredential": "Aucun",
    "credentialOption": "{{name}} ({{kind}})"
   },
   "chat": {
    "notCredentialedTitle": "L'architecte n'a pas pu se connecter à son fournisseur de modèles",
    "notCredentialedBody": "L’authentification de {{architect}} a échoué. Vérifiez les identifiants de sa connexion enregistrée ; l’erreur d’exécution ci-dessous en explique la cause.",
    "noCredentialTitle": "Cet architecte n'a pas d'identifiants",
    "noCredentialBody": "{{architect}} s'exécute sur {{profile}}, qui a besoin d'un secret pour se connecter. Sans lui, ses tours échouent avec Not logged in. Choisissez des identifiants sur la page Architectes.",
    "fixCredential": "Corriger les identifiants de l'architecte",
    "openSecrets": "Ouvrir les secrets"
   }
  }
 },
 "resources": {
  "architects": {
   "columns": {
    "credentialSecretId": "Identifiants"
   },
   "fields": {
    "credentialSecretId": "Identifiants"
   },
   "noCredential": "Aucun"
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
})(fr, {
 "components": {
  "dependencyHint": {
   "refresh": "Actualiser la liste"
  },
  "architectHints": {
   "harness": "Les profils intégrés (Claude Code, Codex et autres) sont prêts à l'emploi.",
   "harnessLink": "Ouvrir Configuration > Profils de harness",
   "credentialNotNeeded": "{{profile}} n'a pas besoin d'identifiants.",
   "credentialLink": "Ouvrir Configuration > Secrets",
   "prompt": "Un changement s'applique au prochain tour de l'architecte.",
   "promptLink": "Ouvrir Configuration > Modèles de prompt",
   "credentialNoProfile": "Le secret avec lequel le harness se connecte.",
   "credentialChosen": "Le secret avec lequel {{profile}} se connecte.",
   "credentialPick": "{{profile}} se connecte avec un secret de type {{kinds}}. Choisissez-en un, sinon chaque tour échoue avec Not logged in.",
   "credentialAdd": "{{profile}} se connecte avec un secret de type {{kinds}}, et ce locataire n'en a encore aucun. Ajoutez-en un dans Configuration > Secrets, puis choisissez-le ici. Sans lui, chaque tour échoue avec Not logged in."
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
})(fr, {
 "components": {
  "studio": {
   "architect": {
    "intro": "L'architecte d'agents conçoit des agents et des applications dans vos brouillons. Donnez-lui un profil de harness, le secret avec lequel il se connecte, un modèle et le prompt avec lequel il travaille. Il ne modifie que vos brouillons et ne les applique jamais."
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
})(fr, {
 "wizard": {
  "studioBody": "L'architecte d'agents conçoit avec vous des agents et des applications dans Agent Studio. Choisissez le profil de harness et le modèle sur lesquels il s'exécute, les identifiants avec lesquels il se connecte (le secret enregistré à l'étape précédente est choisi s'il convient au harness) et le prompt d'architecte qui le guide. Son déploiement ne peut modifier que vos brouillons du studio. Vous pouvez passer cette étape et créer un architecte plus tard dans Agents > Architectes."
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
})(fr, {
 "components": {
  "secretGuide": {
   "title": "Comment obtenir la valeur pour {{kind}}",
   "AnthropicApiKey": {
    "s1": "Connectez-vous à l'Anthropic Console et ouvrez Settings > API keys :",
    "s2": "Choisissez Create Key, donnez-lui un nom comme garrison et copiez la clé. Elle commence par sk-ant-api et n'est affichée qu'une fois.",
    "s3": "Collez-la dans Valeur. Claude Code, opencode, pi, Mux et le harness d'API fournisseur la reçoivent sous ANTHROPIC_API_KEY."
   },
   "ClaudeCodeOAuthToken": {
    "s1": "Sur n'importe quel ordinateur, installez Claude Code s'il n'y est pas encore :",
    "s2": "Lancez cette commande et connectez-vous, dans la fenêtre du navigateur qui s'ouvre, avec le compte Claude dont l'abonnement Pro ou Max doit servir aux agents :",
    "s3": "Copiez le jeton affiché. Il commence par sk-ant-oat et dure un an ; réglez Expiration sur cette date pour que Garrison indique quand il échoit.",
    "s4": "Collez-le dans Valeur. Claude Code le reçoit sous CLAUDE_CODE_OAUTH_TOKEN.",
    "note": "Un jeton d'abonnement puise dans le forfait d'une personne, et l'utiliser pour servir d'autres personnes peut enfreindre les conditions d'Anthropic. Utilisez une clé d'API Anthropic pour tout ce qui est partagé."
   },
   "OpenAiApiKey": {
    "s1": "Connectez-vous à l'OpenAI Platform et ouvrez API keys :",
    "s2": "Choisissez Create new secret key, sélectionnez le projet dont la facturation paie les exécutions et copiez la clé. Elle commence par sk- et n'est affichée qu'une fois.",
    "s3": "Collez-la dans Valeur. Codex, opencode, pi, Mux et le harness d'API fournisseur la reçoivent sous OPENAI_API_KEY."
   },
   "CodexAuthJson": {
    "s1": "Installez la CLI Codex si elle n'y est pas encore :",
    "s2": "Connectez-vous avec votre compte ChatGPT dans un nouveau répertoire Codex vide, pour que cette connexion n'appartienne qu'à Garrison :",
    "s3": "Validez le fichier dans le même terminal. Continuez uniquement si Valid JSON apparaît :",
    "copy": "Sur macOS, copiez le fichier directement dans le presse-papiers avec la commande ci-dessous, puis collez-le dans Valeur. Sur les autres systèmes, ouvrez auth.json dans un éditeur de texte et copiez tout le fichier. Ne copiez pas la sortie du terminal avec ses retours à la ligne ni son invite.",
    "s4": "Une fois le secret enregistré, supprimez ce dossier et ne réutilisez pas cette connexion ailleurs. Garrison se charge désormais de la renouveler :",
    "note": "Deux copies d'une connexion partagent un jeton de rafraîchissement, et celle qui rafraîchit en second casse l'autre. Utiliser un forfait ChatGPT personnel pour servir d'autres personnes peut enfreindre les conditions d'OpenAI ; une clé d'API OpenAI est plus simple pour les déploiements partagés."
   },
   "GeminiApiKey": {
    "s1": "Ouvrez Google AI Studio et connectez-vous avec le compte Google qui doit payer :",
    "s2": "Choisissez Create API key, sélectionnez ou créez un projet Google Cloud et copiez la clé. Elle commence par AIza.",
    "s3": "Collez-la dans Valeur. Gemini CLI et pi la reçoivent sous GEMINI_API_KEY, et opencode sous GOOGLE_GENERATIVE_AI_API_KEY."
   },
   "GenericEnv": {
    "s1": "Collez une seule valeur : un jeton, un mot de passe ou une URL qu'un harness ou un outil lit dans une variable d'environnement.",
    "s2": "Liez le secret à un déploiement sous un alias, puis ajoutez une surcharge d'environnement qui l'utilise, par exemple :",
    "s3": "La variable doit figurer dans la liste d'identifiants autorisés du profil de harness, sinon le déploiement est refusé."
   },
   "GenericFile": {
    "s1": "Collez le fichier entier, sauts de ligne compris : un JSON de compte de service, un certificat ou un fichier de configuration.",
    "s2": "Liez le secret à un déploiement sous un alias et ajoutez une surcharge de fichier dont le contenu est le secret, par exemple :"
   },
   "BearerToken": {
    "s1": "Collez uniquement le jeton, sans le mot Bearer.",
    "s2": "Les agents distants l'utilisent comme secret d'identifiants, et les modèles d'espace de travail s'en servent pour cloner un dépôt privé (comme mot de passe de l'utilisateur x-access-token). Un serveur MCP peut l'envoyer dans un en-tête écrit {{secret.<alias>}}."
   },
   "BasicAuth": {
    "s1": "Collez le nom d'utilisateur et le mot de passe sous cette forme :",
    "s2": "Liez le secret à un déploiement sous un alias et utilisez-le dans un modèle sous la forme {{secret.<alias>}}."
   },
   "GitCredential": {
    "s1": "Pour GitHub, créez un jeton d'accès personnel à granularité fine avec un accès en lecture à Contents sur les dépôts à cloner :",
    "s2": "Collez le jeton seul ; Garrison l'envoie comme mot de passe de l'utilisateur x-access-token. Pour GitLab, Bitbucket ou un autre hôte, collez plutôt username:token.",
    "s3": "Choisissez ce secret comme identifiants Git du modèle d'espace de travail qui clone le dépôt."
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
})(fr, {
 "components": {
  "studio": {
   "chat": {
    "wait": {
     "worker": "En attente d'un worker pour lancer ce tour...",
     "phrases": {
      "p1": "Lecture de votre brouillon...",
      "p2": "Réflexion en cours...",
      "p3": "Esquisse des agents...",
      "p4": "Qui appelle qui ? On y travaille...",
      "p5": "Vérification des conventions de Garrison...",
      "p6": "Choix des bonnes capacités...",
      "p7": "Rédaction des manifestes...",
      "p8": "Comparaison de plusieurs conceptions...",
      "p9": "Préparation des déploiements...",
      "p10": "Relecture des prompts...",
      "p11": "Tracé du graphe de l'application...",
      "p12": "Recherche d'une forme plus simple...",
      "p13": "Vérification des détails...",
      "p14": "Assemblage des pièces...",
      "p15": "Presque fini...",
      "p16": "Toujours en cours..."
     }
    },
    "thinkingSummary": "Réflexion",
    "metrics": {
     "model": "Modèle",
     "timeToFirstTokenMs": "TTFT",
     "streamingMs": "Streaming",
     "totalMs": "Total",
     "inputTokens": "Entrée",
     "outputTokens": "Sortie",
     "cachedTokens": "En cache",
     "reasoningTokens": "Raisonnement",
     "outputTokensPerSecond": "Jetons/s",
     "toolCallCount": "Outils",
     "costUsd": "Coût"
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
})(fr, {
 "components": {
  "studio": {
   "chat": {
    "metrics": {
     "title": "Détails du tour"
    },
    "tool": {
     "running": "en cours",
     "ok": "terminé",
     "failed": "échec",
     "input": "Arguments",
     "output": "Résultat",
     "none": "Aucun",
     "waiting": "En attente du résultat..."
    },
    "refs": {
     "apr": "Ouvrir l'approbation",
     "run": "Ouvrir l'exécution",
     "cnv": "Ouvrir la conversation",
     "agt": "Ouvrir l'agent",
     "sdr": "Ouvrir le brouillon",
     "plr": "Ouvrir l'exécution de pipeline",
     "tpl": "Ouvrir le modèle de prompt"
    },
    "keysHint": "Entrée envoie. Ctrl+Entrée ou Maj+Entrée ajoute une nouvelle ligne.",
    "disclaimer": "L'IA peut se tromper. Vérifiez toutes les réponses.",
    "continueHint": "Poursuit la conversation."
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
})(fr, {
 "nav": {
  "items": {
   "agentWizard": {
    "label": "Assistant d'agents",
    "tip": "Un parcours guidé, de la description de votre besoin jusqu'à des agents approuvés qui tournent en dev : accès au modèle, conception avec l'architecte d'agents, vérification, approbation et une première conversation."
   }
  }
 },
 "resources": {
  "agents": {
   "wizard": "Assistant d'agents"
  }
 },
 "common": {
  "states": {
   "studioHint": "Ou ouvrez l'assistant d'agents et décrivez votre besoin : il vous guide pour créer, approuver et essayer les agents.",
   "openStudio": "Ouvrir l'assistant d'agents"
  }
 },
 "views": {
  "home": {
   "openStudio": "Ouvrir l'assistant d'agents"
  },
  "studioDraft": {
   "back": "Retour à l'assistant"
  },
  "agentWizard": {
   "title": "Assistant d'agents",
   "subtitle": "Décrivez votre besoin. L'assistant vous mène ensuite jusqu'à des agents approuvés qui tournent en dev.",
   "subtitleDraft": "Création : {{title}}",
   "advanced": "Avancé",
   "stepsLabel": "Étapes de l'assistant",
   "back": "Retour",
   "working": "Traitement...",
   "steps": {
    "goal": "Objectif",
    "access": "Accès au modèle",
    "design": "Conception",
    "review": "Vérification",
    "approve": "Approbation",
    "test": "Essai"
   },
   "goal": {
    "title": "Que doivent faire vos agents ?",
    "intro": "Nommez le projet et décrivez la tâche avec des mots simples. L'architecte d'agents lit ce texte et conçoit un agent ou une équipe d'agents pour cela.",
    "name": "Nom du projet",
    "namePlaceholder": "Assistant de recherche",
    "nameHint": "Un nom court que vous reconnaîtrez plus tard. Vous ne pourrez plus le changer après cette étape.",
    "goal": "Ce que doivent faire les agents",
    "goalPlaceholder": "Rechercher un sujet sur le web, résumer les résultats avec leurs sources et rédiger un court rapport.",
    "goalHint": "Indiquez qui l'utilise, ce qui entre et ce qui doit sortir. L'architecte pose des questions sur tout ce qu'il doit savoir.",
    "next": "Commencer",
    "resume": "Ou reprenez l'un de vos brouillons",
    "allDrafts": "Tous les brouillons"
   },
   "access": {
    "title": "Accès au modèle",
    "intro": "Choisissez le harness sur lequel tournent vos agents et les identifiants avec lesquels il se connecte. L'architecte d'agents utilise le même harness et les mêmes identifiants pendant la conception avec vous.",
    "harness": "Profil de harness",
    "harnessHint": "La CLI qui exécute les agents, par exemple Claude Code ou Codex.",
    "model": "Modèle",
    "modelHint": "Facultatif. Laissez vide pour utiliser le modèle par défaut du harness.",
    "credential": "Identifiants",
    "noCredentialNeeded": "{{profile}} n'a pas besoin d'identifiants.",
    "credentialIntro": "{{profile}} se connecte avec une valeur secrète de type {{kinds}}. Choisissez-en une déjà enregistrée ou ajoutez-en une maintenant.",
    "noFittingSecret": "Vous n'avez encore aucune valeur secrète de type {{kinds}}. Ajoutez-en une ci-dessous ; la marche à suivre pour obtenir la valeur s'affiche avec.",
    "addSecret": "Ajouter des identifiants",
    "saveSecret": "Enregistrer les identifiants",
    "architectDescription": "Architecte d'agents configuré par l'assistant d'agents.",
    "next": "Passer à la conception"
   },
   "design": {
    "title": "Concevoir avec l'architecte",
    "intro": "Discutez avec l'architecte d'agents. Il pose les questions nécessaires et crée les agents dans votre brouillon au fil de la conversation. Le panneau de droite montre le contenu du brouillon.",
    "contents": "Dans le brouillon",
    "empty": "Rien pour l'instant. L'architecte ajoute ici les agents à mesure qu'il les conçoit.",
    "agents": "Liste des agents",
    "firstMessage": "Je veux construire ceci : {{goal}}\n\nLes agents tourneront sur le profil de harness {{profile}} avec la valeur secrète d'identifiants {{secret}}. Pose-moi toutes les questions nécessaires, puis conçois les agents dans ce brouillon.",
    "chatTitle": "Discussion avec {{architect}}",
    "next": "Passer à la vérification"
   },
   "review": {
    "title": "Vérification",
    "intro": "L'assistant vérifie chaque élément du brouillon par rapport à votre configuration active. Ce qui échouerait retourne à l'architecte pour correction.",
    "status": {
     "PendingApproval": "Ce brouillon attend une approbation. Passez à l'étape suivante.",
     "Applied": "Ce brouillon est appliqué. Passez à l'étape suivante.",
     "Discarded": "Ce brouillon a été abandonné. Commencez-en un nouveau à la première étape."
    },
    "kind": "Type",
    "name": "Nom",
    "change": "Modification",
    "note": "Remarque",
    "problems_one": "{{count}} élément ne pourrait pas être appliqué.",
    "problems_other": "{{count}} éléments ne pourraient pas être appliqués.",
    "askFix": "Demander à l'architecte de corriger",
    "valid": "Tout le brouillon est valide. Passez à l'approbation.",
    "validate": "Vérifier à nouveau",
    "fixMessage": "Le brouillon n'est pas encore valide. Corrige ces problèmes :\n{{problems}}",
    "next": "Passer à l'approbation"
   },
   "approve": {
    "title": "Approuver",
    "intro": "L'approbation applique le brouillon et met les agents en service. L'assistant donne ensuite à chaque agent un déploiement de dev pour que vous puissiez l'essayer tout de suite.",
    "reason": "Approuvé dans l'assistant d'agents.",
    "summary": "Le brouillon contient {{total}} éléments, dont {{agents}} agents. Ils tourneront sur {{profile}} avec les identifiants {{secret}}.",
    "will1": "Tous les éléments du brouillon sont créés ou mis à jour ensemble. Si l'un d'eux échoue, rien n'est modifié.",
    "will2": "Chaque agent reçoit un déploiement de dev sur le harness choisi, avec les identifiants liés.",
    "will3": "Si vous n'avez pas le droit d'approuver, la demande attend quelqu'un qui l'a, et cette page continue lorsqu'il décide.",
    "approve": "Approuver et publier",
    "waiting": "En attente de la décision d'une personne habilitée à approuver. Cette page continuera d'elle-même ensuite.",
    "openApproval": "Ouvrir l'approbation",
    "retry": "Réessayer",
    "done": "Approuvé et publié. Chaque agent a un déploiement de dev prêt à tourner.",
    "agent": "Agent IA",
    "deployment": "Déploiement de dev",
    "what": "Ce qu'a fait l'assistant",
    "actions": {
     "create": "Déploiement créé",
     "bind": "Identifiants liés",
     "ready": "Déjà prêt"
    },
    "next": "Passer à l'essai"
   },
   "test": {
    "title": "Essai",
    "intro": "Parlez à votre nouvel agent en dev. Quand il vous convient, ouvrez-le pour le promouvoir ou le partager.",
    "talkingTo": "Conversation avec {{name}}.",
    "empty": "Envoyez un message pour commencer une conversation.",
    "message": "Message à envoyer",
    "next": "Et ensuite",
    "openAgent": "Ouvrir {{name}}",
    "openApp": "Ouvrir l'application {{name}}",
    "openInvoke": "Ouvrir dans Invoke",
    "another": "En créer d'autres"
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
})(fr, {
 "views": {
  "agentWizard": {
   "test": {
    "openApp": "Ouvrir le chat de {{name}}"
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
})(fr, {
 "resources": {
  "apps": {
   "fields": {
    "backgroundColor": "Fond de page",
    "headerColor": "Couleur de l'en-tête",
    "agentBubbleColor": "Couleur des messages de l'agent",
    "fontFamily": "Police",
    "faviconAssetId": "Icône de l'onglet"
   },
   "hints": {
    "displayName": "Affiché dans l'en-tête du chat et sur les messages de l'agent. Tous les caractères, jusqu'à 128. Le nom ci-dessus n'est que l'identifiant.",
    "faviconAssetId": "Une ressource image. Laissez vide pour utiliser le logo.",
    "primaryColor": "Boutons et vos propres messages.",
    "accentColor": "Mises en évidence, contours de focus et conversation sélectionnée.",
    "backgroundColor": "La page derrière la conversation.",
    "headerColor": "La barre du haut avec le nom et le logo.",
    "agentBubbleColor": "Les messages de l'agent. La couleur du texte est choisie pour le contraste."
   },
   "faviconFromLogo": "Identique au logo",
   "defaultColor": "Par défaut {{color}}"
  }
 },
 "enums": {
  "appFont": {
   "System": "Système",
   "Sans": "Sans empattement",
   "Serif": "Avec empattement",
   "Rounded": "Arrondie",
   "Mono": "À chasse fixe"
  }
 },
 "components": {
  "form": {
   "defaultColor": "Par défaut"
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
})(fr, {
 "resources": {
  "apps": {
   "fields": {
    "conversationListColor": "Couleur de la liste des conversations",
    "composerColor": "Couleur de la zone de saisie",
    "filesColor": "Couleur de la liste des fichiers"
   },
   "hints": {
    "conversationListColor": "La liste des conversations sur le côté.",
    "composerColor": "La zone sous la conversation où vous écrivez.",
    "filesColor": "La liste des fichiers écrits par l'agent."
   }
  }
 }
});

// Wizard draft picker and credential-optional Mux endpoints.
Object.assign(fr.views.agentWizard.goal, {
  "updated": "Mis à jour le {{date}}",
  "continue": "Reprendre"
});
Object.assign(fr.views.agentWizard.access, {
  "muxEndpoint": "URL du point de terminaison Mux",
  "muxAdapter": "Adaptateur du point de terminaison",
  "muxOptionalCredential": "Identifiant (facultatif)",
  "muxHint": "Mux peut utiliser un point de terminaison sans clé API de fournisseur. Saisissez une URL accessible par le worker. Choisissez un identifiant uniquement si le point de terminaison exige une authentification.",
  "needEndpoint": "Saisissez une URL de point de terminaison Mux valide avec HTTP ou HTTPS."
});
Object.assign(fr.views.agentWizard.design, {
  "firstMessageMux": "Je souhaite créer ceci : {{goal}}\n\nUtilise Mux avec le point de terminaison {{endpoint}}, l’adaptateur {{adapter}} et le modèle {{model}}. Une clé API est nécessaire uniquement si le point de terminaison exige une authentification. Pose-moi les questions nécessaires, puis conçois les agents dans ce brouillon."
});
Object.assign(fr.views.agentWizard.approve.actions, {"configure": "Point de terminaison configuré"});

// Harness-specific wizard configuration.
Object.assign(fr.views.agentWizard.access, {
  "muxEndpoint": "Nom du point de terminaison Mux",
  "muxHint": "Saisissez le nom configuré dans Mux sur les workers d’exécution, par exemple local. Mux fournit son URL, son adaptateur, son modèle et son authentification.",
  "needEndpoint": "Saisissez un nom de point de terminaison Mux configuré, pas une URL.",
  "providerModelHint": "Utilisez l’identifiant de modèle de la CLI, généralement provider/model. L’authentification dépend du fournisseur ; un identifiant enregistré est facultatif.",
  "optionalCredentialIntro": "{{profile}} accepte les secrets enregistrés de type {{kinds}}. Choisissez-en un si votre fournisseur l’exige, ou continuez sans identifiant enregistré.",
  "providerEndpoint": "URL de l’API du fournisseur",
  "providerEndpointHint": "Ce harness appelle directement une API HTTP compatible avec OpenAI. Saisissez son URL de base et son modèle.",
  "providerAnonymous": "Le point de terminaison du fournisseur ne nécessite pas d’authentification",
  "needProviderEndpoint": "Saisissez une URL HTTP ou HTTPS valide sans identifiants, paramètres de requête ni fragment."
});
Object.assign(fr.views.agentWizard.design, {
  "firstMessageMux": "Je souhaite créer ceci : {{goal}}\n\nUtilise le point de terminaison Mux configuré nommé {{endpoint}}. Son modèle et son authentification viennent de Mux. Pose-moi les questions nécessaires, puis conçois les agents dans ce brouillon."
});
Object.assign(fr.views.agentWizard.access, {"intro": "Choisissez le harness et ses paramètres de connexion. L’architecte d’agents utilise la même configuration pendant la conception."});

// Typed inference protocol and authentication editor.
Object.assign(fr, {
  "inference": {
    "modelHint": "Choisissez un modèle proposé par ce point de terminaison.",
    "title": "Point de terminaison d’inférence",
    "protocol": "Protocole API",
    "baseUrl": "URL de base",
    "authentication": "Type d’authentification",
    "name": "Nom d’en-tête / paramètre",
    "location": "Emplacement de l’identifiant",
    "header": "En-tête",
    "query": "Chaîne de requête",
    "secret": "Secret d’authentification",
    "addValue": "Ajouter une valeur d’identifiant",
    "username": "Secret du nom d’utilisateur",
    "password": "Secret du mot de passe",
    "hint": "Choisissez séparément le protocole et l’authentification. Ollama Cloud utilise un jeton porteur ; Ollama local n’en demande généralement pas. Les valeurs sont enregistrées comme secrets chiffrés.",
    "invalid": "Saisissez une URL valide et choisissez tous les noms et secrets requis.",
    "value": "Valeur d’identifiant",
    "auth": {
      "None": "Aucune",
      "BearerToken": "Jeton porteur",
      "ApiKey": "Clé API",
      "Headers": "Valeurs d’en-tête",
      "QueryString": "Paramètres de requête",
      "Basic": "Authentification basique"
    }
  }
});

// Shared runtime connections and the configuration navigation split.
fr.runtime = {
  "title": "Harnesses et points de terminaison",
  "connections": "Connexions enregistrées",
  "templates": "Modèles de harness avancés",
  "connection": "Connexion",
  "architect": "Architecte",
  "choose": "Choisir un architecte ou une connexion",
  "harness": "Modèle de harness",
  "chooseHarness": "Choisir un modèle de harness",
  "manage": "Gérer les harnesses et les connexions",
  "configureFirst": "Configurez une connexion enregistrée au préalable.",
  "sharedHint": "Configurez ici une seule fois. Les architectes et déploiements utilisent cette connexion ; les modifications prennent effet à leur prochaine exécution.",
  "reuseHint": "Utilisez un architecte existant ou une connexion enregistrée pour en créer un. Aucune nouvelle saisie des identifiants ni de la connexion.",
  "importExport": "Importer / Exporter"
};
fr.nav.hubs.configuration = {"label": "Ressources des agents", "tip": "Connexions des agents et architectes."};
fr.nav.hubs.platformConfiguration = {"label": "Configuration de la plateforme", "tip": "Identifiants, stockage, tarifs, quotas et notifications."};
fr.nav.items.harnessProfiles.label = "Harnesses et points de terminaison";
fr.views.agentWizard.access.intro = "Utilisez un architecte existant ou une connexion enregistrée pour en créer un. Aucune nouvelle saisie des identifiants ni de la connexion.";

fr.resources.harnessProfiles.title = fr.runtime.title;
fr.resources.harnessProfiles.subtitle = fr.runtime.sharedHint;
fr.components.architectHints.harness = fr.runtime.sharedHint;
fr.components.architectHints.harnessLink = fr.runtime.manage;

Object.assign(fr.runtime, {"add": "Ajouter une connexion", "create": "Créer une connexion", "edit": "Modifier la connexion", "view": "Détails de connexion"});

fr.explainers.harnessProfiles.p2 = fr.runtime.sharedHint;
fr.explainers.secrets.p2 = fr.runtime.sharedHint;

// One connection registry; configuration sections use a menu.
Object.assign(fr.runtime, {"title": "Connexions", "sharedHint": "Harnesses et points de terminaison réutilisables. Configurez une fois, puis sélectionnez une connexion pour vos agents.", "harness": "Type de connexion", "chooseHarness": "Choisir un harness ou type d’API", "customHarness": "Harness personnalisé", "advancedLaunch": "Paramètres de lancement avancés", "advancedArchitect": "Options de l’architecte (facultatif)", "pickConnection": "Choisissez une connexion. Son modèle, son adresse et ses identifiants sont déjà configurés."});
fr.nav.hubs.connections = {"label": "Connexions", "tip": "Harnesses et points de terminaison réutilisables. Configurez une fois, puis sélectionnez une connexion pour vos agents."};
fr.nav.hubs.configuration = {"label": "Configuration", "tip": "Gérer les prompts, ressources, serveurs d’outils, identifiants, stockage et règles."};
fr.nav.items.harnessProfiles.label = "Connexions";
fr.resources.harnessProfiles.title = "Connexions";
fr.components.studio.architect.harnessProfile = fr.runtime.connection;

Object.assign(fr.runtime, {"emptyTitle": "Aucune connexion pour le moment", "apiType": "API HTTP (Ollama / compatible OpenAI)"});

fr.nav.items.manifests.label = fr.runtime.importExport;

fr.runtime.manage = "Gérer les connexions";
fr.components.architectHints.harnessLink = fr.runtime.manage;
fr.explainers.secrets.p2 = "Les connexions utilisent ces secrets pour l’authentification. Modifiez une valeur ici sans reconfigurer chaque architecte ou déploiement.";

fr.runtime.launchDefaults = "Cette connexion utilise sa configuration de lancement existante. Modifiez-la si nécessaire dans les paramètres avancés.";

// One horizontal workspace navigation level; the wizard selects connections only.
fr.nav.hubs.operations = {"label": "Exploitation", "tip": "Gérer les résultats stockés, les tarifs des modèles, les limites et les notifications."};
fr.nav.hubs.configuration.tip = "Prompts, ressources, outils, identifiants et espaces de travail pour vos agents.";
fr.nav.hubs.manifests = { label: fr.runtime.importExport, tip: fr.tips.nav.tabs.manifests };
fr.runtime.choose = "Sélectionner une connexion";
fr.runtime.reuseHint = "Choisissez la connexion pour concevoir et exécuter vos agents. L’assistant prépare automatiquement l’agent de conception.";
fr.views.agentWizard.access.intro = fr.runtime.reuseHint;

fr.views.manifests.title = fr.runtime.importExport;

fr.views.agentWizard.design.intro = "Répondez aux questions de l’architecte pour concevoir votre agent.";

fr.views.studio.deleteMultiple = "Supprimer plusieurs";
fr.views.studio.deleteMultipleMessage = "Supprimer définitivement les {{count}} brouillons sélectionnés ? Les approbations en attente seront annulées. Les agents et déploiements publiés ne seront pas affectés.";

fr.views.studio.discard = fr.common.actions.delete;
fr.views.studio.discardTitle = "Supprimer le brouillon";
fr.views.studio.discardMessage = "Supprimer définitivement {{title}} ? Les agents et déploiements publiés ne seront pas affectés.";
fr.views.studio.discardPendingMessage = "Supprimer définitivement {{title}} ? Son approbation en attente sera annulée. Les agents et déploiements publiés ne seront pas affectés.";
fr.views.studio.discarded = "{{title}} supprimé.";

fr.components.studio.chat.resize = "Redimensionner le chat";
fr.components.studio.chat.resizeHint = "Faites glisser pour redimensionner. Utilisez les flèches haut ou bas pour régler la hauteur, ou Début pour la réinitialiser.";

// Secret reveal (Admin on Secret, audited as SecretRevealed).
fr.components.secretReveal = { title: "Afficher la valeur du secret", warning: "L’affichage montre la valeur stockée en clair. Chaque affichage est consigné dans le journal d’audit à votre nom. Fermez cette fenêtre une fois terminé ; la valeur n’est pas conservée.", value: "Valeur", reveal: "Afficher", hide: "Masquer" };
fr.tips.secretReveal = { reveal: "Déchiffrer et afficher la valeur stockée. Le serveur écrit un enregistrement d’audit SecretRevealed.", hide: "Masquer à nouveau la valeur. L’afficher encore écrit un autre enregistrement d’audit.", close: "Fermer la fenêtre et oublier la valeur affichée.", value: "La valeur déchiffrée, telle qu’elle est stockée. Traitez-la comme un mot de passe.", copy: "Copier la valeur dans le presse-papiers." };
fr.resources.secrets.actions.reveal = "Afficher";
fr.tips.resources.secrets.actions.reveal = "Afficher la valeur stockée en clair. Nécessite Admin sur Secret (SecretManager ou TenantAdmin) et est consigné dans le journal d’audit.";
fr.tips.resources.secrets.revealNoValue = "Ce secret n’a pas encore de valeur stockée. Utilisez d’abord Définir la valeur.";
fr.enums.auditEventType.SecretRevealed = "Secret affiché";
fr.tips.enums.auditEventType.SecretRevealed = "Une personne disposant d’Admin sur Secret a lu la valeur déchiffrée d’un secret.";
fr.resources.secrets.subtitle = "Identifiants chiffrés pour les harnesses et les intégrations. Les gestionnaires de secrets peuvent afficher les valeurs ; chaque affichage est audité.";
fr.tips.nav.tabs.secrets = "Clés d’API et jetons chiffrés. Les déploiements les lient par alias ; seuls les gestionnaires de secrets peuvent afficher les valeurs, et chaque affichage est audité.";
fr.tips.resources.secrets.add = "Enregistrer un nouvel identifiant, comme une clé d’API ou un jeton, chiffré au repos. Les déploiements le référencent par alias ; après l’enregistrement, seules les personnes disposant d’Admin sur Secret peuvent l’afficher.";
fr.tips.resources.secrets.value = "La valeur du secret. Elle est chiffrée à l’enregistrement. Les personnes disposant d’Admin sur Secret peuvent l’afficher, et chaque affichage est audité.";
fr.explainers.secrets.p1 = "Un secret est une valeur chiffrée, comme une clé d’API ou un jeton. Après l’enregistrement, vous pouvez la remplacer ou la faire tourner. Sa relecture est réservée aux personnes disposant d’Admin sur Secret (les rôles SecretManager et TenantAdmin), et chaque affichage est consigné dans le journal d’audit.";

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
})(fr, {
 "nav": {
  "hubs": {
   "autonomy": {
    "label": "Autonomie",
    "tip": "Des agents qui continuent à travailler seuls : les gardiens se réveillent selon un calendrier et veillent sur une mission permanente."
   }
  },
  "items": {
   "keepers": {
    "label": "Gardiens",
    "tip": "Des agents qui se réveillent selon un calendrier pour veiller sur une mission permanente"
   }
  }
 },
 "enums": {
  "runKind": {
   "Keeper": "Cycle de gardien"
  },
  "resourceType": {
   "Mandate": "Gardien (mandat)"
  },
  "mandateStatus": {
   "Draft": "Brouillon",
   "Active": "Active",
   "Paused": "En pause",
   "Frozen": "Gelé",
   "CapReached": "Budget atteint",
   "Retired": "Retiré"
  },
  "mandateRevisionState": {
   "Draft": "Brouillon",
   "Published": "Publiée"
  },
  "mandateRevisionSource": {
   "Human": "Personne",
   "Board": "Comité",
   "Executive": "Direction",
   "Architect": "Architecte d'agents"
  },
  "wakeMode": {
   "Fixed": "Intervalle fixe",
   "Backoff": "Espacer si calme"
  },
  "wakeSource": {
   "Timer": "Calendrier",
   "Manual": "Réveillé à la main",
   "Message": "Message",
   "EscalationAnswer": "Escalade traitée",
   "Webhook": "Webhook",
   "Report": "Rapport"
  },
  "tickOutcome": {
   "Quiet": "Calme",
   "Acted": "Intervenu",
   "Attention": "Demande attention",
   "Escalated": "Escaladé",
   "Failed": "Échoué",
   "Skipped": "Ignoré",
   "Unreported": "Non rapporté"
  }
 },
 "errorCodes": {
  "MandateActive": "Un cycle de ce gardien est en cours. Attendez qu'il se termine, mettez le gardien en pause ou supprimez-le quand même, ce qui annule l'exécution du cycle.",
  "MandateNotActive": "Seul un gardien actif peut être réveillé ou mis en pause.",
  "MandateNotPaused": "Seul un gardien en pause peut être repris.",
  "RemoteAgentUnsupported": "Les gardiens s'exécutent sur des déploiements hébergés, donc un agent distant ne peut pas être un gardien.",
  "DeploymentInactive": "Ce déploiement est inactif. Choisissez un déploiement actif.",
  "DeploymentAgentMismatch": "Ce déploiement appartient à un autre agent. Choisissez l'un des déploiements de cet agent.",
  "RevisionMismatch": "Cette révision appartient à un autre gardien."
 },
 "resources": {
  "runs": {
   "columns": {
    "mandateId": "Gardien"
   }
  },
  "keepers": {
   "title": "Gardiens",
   "subtitle": "Des agents qui se réveillent selon un calendrier pour veiller sur une mission permanente et rapportent à chaque fois ce qu'ils ont trouvé.",
   "add": "Ajouter un gardien",
   "create": "Créer un gardien",
   "edit": "Modifier le gardien",
   "view": "Détails du gardien",
   "deleteTitle": "Supprimer le gardien",
   "emptyTitle": "Aucun gardien pour l'instant",
   "emptyBody": "Créez un gardien pour qu'un agent vérifie régulièrement quelque chose, comme une file d'attente, un tableau de bord ou une boîte de réception, et agisse ou demande de l'aide au besoin.",
   "columns": {
    "name": "Nom",
    "status": "Statut",
    "agent": "Agent",
    "deployment": "Déploiement",
    "nextWakeUtc": "Prochain réveil",
    "currentIntervalSeconds": "Intervalle",
    "lastTick": "Dernier cycle",
    "tickCount": "Cycles",
    "currentRevisionNumber": "Révision",
    "runAs": "S'exécute en tant que",
    "description": "Description",
    "id": "ID",
    "createdUtc": "Créé"
   },
   "fields": {
    "name": "Nom",
    "description": "Description",
    "agentId": "Agent",
    "deploymentId": "Déploiement",
    "objective": "Objectif",
    "healthyDefinition": "À quoi ressemble un bon état",
    "autonomy": "Ce qu'il peut faire seul",
    "escalationPolicy": "Quand demander de l'aide",
    "direction": "Orientation actuelle",
    "signals": "Signaux à surveiller",
    "signalsItems": {
     "name": "Signal",
     "description": "Ce que cela signifie"
    },
    "wakeMode": "Mode de réveil",
    "minIntervalSeconds": "Intervalle minimal (secondes)",
    "maxIntervalSeconds": "Intervalle maximal (secondes)",
    "backoffFactor": "Facteur d'espacement",
    "jitterPercent": "Jitter (pourcentage)",
    "budgetPerTickUsd": "Budget par cycle (USD)",
    "budgetPerDayUsd": "Budget par jour (USD)",
    "maxTokensPerTick": "Maximum de jetons par cycle",
    "changeNote": "Note de modification"
   },
   "hints": {
    "name": "Lettres minuscules, chiffres et traits d'union.",
    "agentId": "Un agent hébergé. L'agent ne peut plus être changé après la création du gardien.",
    "deploymentId": "Le déploiement actif sur lequel s'exécute chaque cycle.",
    "objective": "La mission permanente, en termes simples. Le gardien la lit à chaque cycle.",
    "minIntervalSeconds": "De {{min}} à {{max}} secondes. Le paramètre de cluster Autonomy.MinIntervalSeconds peut l'augmenter.",
    "maxIntervalSeconds": "De {{min}} à {{max}} secondes. L'espacement cesse de croître ici.",
    "backoffFactor": "De {{min}} à {{max}}. Après chaque cycle calme, l'intervalle est multiplié par cette valeur.",
    "jitterPercent": "De {{min}} à {{max}}. Vide, la valeur par défaut du cluster s'applique.",
    "budgetPerTickUsd": "Vide signifie aucune limite.",
    "budgetPerDayUsd": "Vide signifie aucune limite.",
    "maxTokensPerTick": "Jetons d'entrée plus jetons de sortie. Vide signifie aucune limite.",
    "changeNote": "Pourquoi cette révision modifie le gardien. Affiché dans la liste des révisions."
   },
   "sections": {
    "mandate": "Mandat",
    "schedule": "Calendrier de réveil",
    "budgets": "Plafonds de coût"
   },
   "sectionHints": {
    "mandate": "L'enregistrement publie ces champs comme révision 1 et démarre le calendrier de réveil. Les modifications ultérieures passent par Nouvelle révision sur la page du gardien.",
    "budgets": "Enregistrés dès maintenant et appliqués dans une version ultérieure."
   },
   "errors": {
    "name": "Utilisez de 1 à 64 lettres minuscules, chiffres et traits d'union, en commençant et en finissant par une lettre ou un chiffre.",
    "nameTaken": "Un autre gardien utilise déjà ce nom.",
    "text": "Limité à {{max}} caractères.",
    "agentRequired": "Choisissez l'agent qui assure ce mandat.",
    "deploymentRequired": "Choisissez le déploiement sur lequel s'exécutent ses cycles.",
    "objective": "Décrivez la mission permanente.",
    "signalsMax": "Une révision compte au plus {{max}} signaux.",
    "signalName": "Les noms de signaux comptent de 1 à {{max}} caractères.",
    "signalUnique": "Chaque signal doit avoir un nom différent.",
    "signalsInvalid": "Corrigez les signaux signalés ci-dessous.",
    "interval": "Saisissez un nombre entier de secondes de {{min}} à {{max}}.",
    "maxBelowMin": "L'intervalle maximal ne peut pas être plus court que l'intervalle minimal.",
    "backoffFactor": "Saisissez un nombre de {{min}} à {{max}}.",
    "jitterPercent": "Saisissez un nombre entier de {{min}} à {{max}}.",
    "budget": "Saisissez un montant de {{min}} à {{max}}.",
    "maxTokens": "Saisissez un nombre entier de {{min}} à {{max}}."
   },
   "actions": {
    "pause": "Mettre en pause",
    "resume": "Reprendre",
    "wake": "Réveiller maintenant",
    "runs": "Voir les exécutions"
   },
   "toasts": {
    "pause": "{{name}} mis en pause.",
    "resume": "{{name}} repris. Il se réveille maintenant.",
    "wake": "{{name}} se réveille maintenant."
   },
   "units": {
    "seconds_one": "{{count}} seconde",
    "seconds_other": "{{count}} secondes",
    "minutes_one": "{{count}} min",
    "minutes_other": "{{count}} min",
    "hours_one": "{{count}} heure",
    "hours_other": "{{count}} heures",
    "days_one": "{{count}} jour",
    "days_other": "{{count}} jours"
   },
   "ticking": "Cycle en cours",
   "neverTicked": "Pas encore réveillé",
   "addSignal": "Ajouter un signal",
   "signalNamePlaceholder": "taille de la file",
   "editNotice": "S'exécute en tant que {{name}}. L'enregistrement fait de vous le principal sous lequel s'exécutent ses cycles. Pour changer l'objectif ou le calendrier, ouvrez le gardien et utilisez Nouvelle révision."
  }
 },
 "components": {
  "keeperRevision": {
   "title": "Nouvelle révision de {{name}}",
   "intro": "Ce sera la révision {{number}}. La publier la rend courante immédiatement : l'espacement est réinitialisé et le gardien se réveille maintenant.",
   "draft": "Enregistrer comme brouillon",
   "publish": "Publier",
   "drafted": "Révision {{number}} enregistrée comme brouillon.",
   "published": "Révision {{number}} publiée."
  }
 },
 "views": {
  "runDetail": {
   "keeper": "Gardien"
  },
  "home": {
   "autonomy": {
    "title": "Autonomie",
    "open": "Ouvrir les gardiens",
    "empty": "Aucun gardien pour l'instant. Un gardien se réveille selon un calendrier pour veiller sur une mission permanente.",
    "active": "actifs",
    "paused": "en pause",
    "ticking": "en cycle maintenant",
    "nextWake": "Prochain réveil :",
    "allQuiet": "Aucun gardien ne demande d'attention.",
    "attention_one": "{{count}} gardien demande de l'attention",
    "attention_other": "{{count}} gardiens demandent de l'attention"
   }
  },
  "keeperDetail": {
   "title": "Gardien",
   "heading": "Gardien {{name}}",
   "notFoundTitle": "Gardien introuvable",
   "notFoundBody": "Il a peut-être été supprimé, ou il appartient à un autre locataire.",
   "live": "En direct",
   "polling": "Actualisation",
   "newRevision": "Nouvelle révision",
   "noWake": "Non planifié",
   "quietStreak": "Cycles calmes d'affilée",
   "activeRun": "Cycle en cours",
   "revisionTitle": "Révision courante",
   "revisionHeading": "Révision courante ({{number}})",
   "noRevision": "Aucune révision n'est encore publiée. Utilisez Nouvelle révision pour en rédiger une et la publier.",
   "clusterDefault": "Valeur par défaut du cluster",
   "noLimit": "Aucune limite",
   "ticks": "Cycles",
   "outcomeFilter": "Résultat",
   "allOutcomes": "Tous les résultats",
   "noTicksTitle": "Aucun cycle pour l'instant",
   "noTicksActive": "Le premier cycle démarre au prochain réveil. Utilisez Réveiller maintenant pour en lancer un tout de suite.",
   "noTicksBody": "Les cycles apparaissent ici dès que le gardien est actif et se réveille.",
   "chartTitle": "Intervalle après chaque cycle",
   "chartHelp": "Minutes jusqu'au prochain réveil, telles que fixées à la fin de chaque cycle. Les cycles calmes l'allongent en mode Backoff.",
   "chartSeries": "Intervalle (minutes)",
   "columns": {
    "started": "Début",
    "source": "Réveillé par",
    "outcome": "Résultat",
    "run": "Exécution",
    "interval": "Intervalle suivant",
    "cost": "Coût",
    "summary": "Résumé",
    "number": "Numéro",
    "state": "État",
    "revisionSource": "Source",
    "author": "Auteur",
    "changeNote": "Note de modification",
    "created": "Créée"
   },
   "requested": "a demandé {{interval}}",
   "revisions": "Révisions",
   "noRevisions": "Aucune révision pour l'instant.",
   "current": "Courante",
   "diff": "Comparer",
   "diffTitle": "Révision {{number}} comparée à la précédente",
   "diffFirst": "Il s'agit de la première révision, donc tout ce qu'elle contient est nouveau.",
   "revisionLabel": "Révision {{number}}",
   "nothing": "Rien",
   "confirmDelete": "Supprimer le gardien {{name}} avec ses révisions et son historique de cycles ? Ses exécutions passées sont conservées.",
   "confirmForceDelete": "Un cycle de {{name}} est en cours. Supprimer quand même le gardien et annuler l'exécution de ce cycle ?",
   "forceDelete": "Supprimer et annuler le cycle",
   "changeNote": "Note de modification : {{note}}"
  }
 },
 "tips": {
  "nav": {
   "hubs": {
    "autonomy": "Des agents qui travaillent seuls entre les demandes. Les gardiens se réveillent selon un calendrier, vérifient une mission permanente et agissent ou demandent de l'aide."
   },
   "tabs": {
    "keepers": "Gardiens : des agents qui se réveillent selon un calendrier pour veiller sur une mission permanente, avec leurs cycles et leurs révisions."
   }
  },
  "enums": {
   "runKind": {
    "Keeper": "Lancée par le réveil d'un gardien. L'exécution est un cycle de ce gardien et renvoie vers lui."
   },
   "resourceType": {
    "Mandate": "Gardiens (mandats) : les missions permanentes dont les agents s'occupent selon un calendrier de réveil, avec leurs révisions et leurs cycles."
   },
   "mandateStatus": {
    "Draft": "Créé sans révision publiée, il ne se réveille donc pas encore. Publiez une révision pour le démarrer.",
    "Active": "Se réveille selon son calendrier. Chaque réveil lance un cycle, une exécution de son déploiement.",
    "Paused": "Ne se réveille pas tant que personne ne le reprend. La reprise le réveille aussitôt avec l'intervalle réinitialisé.",
    "Frozen": "Arrêté par un administrateur ou une politique. Il ne se réveille pas tant qu'il n'est pas dégelé.",
    "CapReached": "Son budget quotidien est épuisé. Il se réveille de nouveau au début du prochain jour UTC.",
    "Retired": "N'est plus utilisé. Il conserve son historique et ne se réveille jamais."
   },
   "mandateRevisionState": {
    "Draft": "Enregistrée mais non utilisée. Publiez-la pour en faire la révision courante du gardien.",
    "Published": "A été ou est utilisée. Les révisions publiées ne changent jamais ; rédigez plutôt une nouvelle révision."
   },
   "mandateRevisionSource": {
    "Human": "Rédigée par une personne dans le tableau de bord, l'API ou un manifeste.",
    "Board": "Définie par un comité d'agents qui supervise ce gardien.",
    "Executive": "Définie par un agent de direction qui pilote ce gardien.",
    "Architect": "Rédigée par l'architecte d'agents à partir d'un brouillon du studio."
   },
   "wakeMode": {
    "Fixed": "Se réveille à chaque intervalle minimal, quoi qu'ait trouvé le dernier cycle.",
    "Backoff": "Attend plus longtemps après chaque cycle calme, jusqu'à l'intervalle maximal, et revient au minimum dès qu'il se passe quelque chose."
   },
   "wakeSource": {
    "Timer": "Le calendrier de réveil est arrivé à échéance, le gardien s'est donc réveillé de lui-même.",
    "Manual": "Quelqu'un a utilisé Réveiller maintenant ou a repris le gardien.",
    "Message": "Un message est arrivé pour le gardien.",
    "EscalationAnswer": "Quelqu'un a répondu à une question escaladée par le gardien.",
    "Webhook": "Un autre système a appelé le webhook du gardien.",
    "Report": "Le rapport d'un autre agent a demandé à ce gardien d'y jeter un œil."
   },
   "tickOutcome": {
    "Quiet": "Tout allait bien et rien n'était à faire. En mode Backoff, le prochain réveil arrive plus tard.",
    "Acted": "Le gardien a modifié quelque chose pour maintenir la mission en bon état.",
    "Attention": "Le gardien a trouvé quelque chose qu'une personne devrait examiner.",
    "Escalated": "Le gardien a demandé une décision à une personne ou à un autre agent.",
    "Failed": "L'exécution du cycle a échoué, a expiré ou a été annulée.",
    "Skipped": "Un réveil est arrivé alors que le cycle précédent tournait encore, il a donc été ignoré et le suivant attend la fin de celui-ci.",
    "Unreported": "L'exécution s'est terminée sans rapporter de résultat, le gardien a donc peut-être besoin d'un objectif plus clair."
   }
  },
  "resources": {
   "runs": {
    "mandateId": "Le gardien qui a lancé cette exécution comme l'un de ses cycles, le cas échéant. Cliquez pour ouvrir le gardien.",
    "openKeeper": "Ouvrir le gardien dont cette exécution est un cycle."
   },
   "keepers": {
    "add": "Créer un gardien : choisissez un agent hébergé et un déploiement, décrivez la mission permanente et définissez la fréquence de réveil.",
    "name": "Un nom unique dans ce locataire, utilisé dans les URL, les manifestes et l'API.",
    "status": "Indique si le gardien se réveille selon son calendrier (Actif) ou s'il est en attente, en pause, gelé ou retiré.",
    "agent": "L'agent hébergé qui assure ce mandat. Chaque cycle exécute cet agent.",
    "deployment": "Le déploiement sur lequel s'exécute chaque cycle, qui détermine le harnais, le modèle et les outils.",
    "nextWakeUtc": "Quand démarre le prochain cycle. Survolez pour voir l'heure exacte.",
    "currentIntervalSeconds": "L'attente après le dernier cycle. En mode Backoff, elle augmente après les cycles calmes.",
    "lastTick": "Quand le gardien s'est réveillé pour la dernière fois et ce qu'a rapporté ce cycle.",
    "tickCount": "Le nombre total de cycles exécutés par le gardien.",
    "currentRevisionNumber": "La révision publiée que le gardien suit actuellement.",
    "runAs": "L'utilisateur ou l'identifiant dont les permissions s'appliquent à chaque cycle : la dernière personne à avoir enregistré le gardien.",
    "description": "Notes pour les personnes. Le gardien ne la lit pas ; il lit l'objectif.",
    "id": "L'identifiant du gardien, utilisé dans l'API et dans les enregistrements d'exécution.",
    "createdUtc": "Quand le gardien a été créé.",
    "agentId": "L'agent hébergé qui assure ce mandat. Les agents distants ne peuvent pas être des gardiens. Fixé après la création.",
    "deploymentId": "Le déploiement actif de cet agent sur lequel s'exécute chaque cycle.",
    "objective": "La mission permanente en termes simples, par exemple garder la file du support sous 20 tickets ouverts. Le gardien la lit à chaque cycle.",
    "healthyDefinition": "À quoi ressemble un bon état, pour que le gardien distingue un cycle calme d'un cycle qui exige d'agir.",
    "autonomy": "Ce que le gardien peut modifier seul sans demander à personne.",
    "escalationPolicy": "Quand le gardien doit s'arrêter et demander une décision à une personne ou à un autre agent.",
    "direction": "Des consignes à court terme qui peuvent changer souvent, comme une priorité pour cette semaine.",
    "signals": "Des mesures nommées que le gardien doit vérifier à chaque cycle, avec la signification de chacune.",
    "signalsItems": {
     "name": "Un nom court pour la mesure, unique au sein de la révision.",
     "description": "Ce que signifie la mesure et quelles valeurs sont préoccupantes."
    },
    "wakeMode": "Fixe se réveille à chaque fois à l'intervalle minimal. Backoff attend plus longtemps après les cycles calmes.",
    "minIntervalSeconds": "L'attente la plus courte entre deux réveils planifiés, en secondes.",
    "maxIntervalSeconds": "L'attente la plus longue entre deux réveils planifiés en mode Backoff, en secondes.",
    "backoffFactor": "De combien l'attente augmente après chaque cycle calme en mode Backoff. 2 la double.",
    "jitterPercent": "Un délai aléatoire pouvant aller jusqu'à ce pourcentage de l'intervalle, pour que de nombreux gardiens ne se réveillent pas au même instant.",
    "budgetPerTickUsd": "Le maximum qu'un cycle peut coûter, en dollars américains.",
    "budgetPerDayUsd": "Le maximum que les cycles de ce gardien peuvent coûter par jour UTC, en dollars américains.",
    "maxTokensPerTick": "Le maximum de jetons d'entrée et de sortie qu'un cycle peut utiliser.",
    "changeNote": "Une courte note expliquant pourquoi cette révision modifie le gardien, conservée avec la révision.",
    "sections": {
     "mandate": "Ce dont le gardien s'occupe et ce qu'il peut faire seul.",
     "schedule": "À quelle fréquence le gardien se réveille et comment l'attente évolue après les cycles calmes.",
     "budgets": "Les limites de ce que les cycles du gardien peuvent coûter et consommer."
    },
    "actions": {
     "pause": "Cesser de réveiller ce gardien. Un cycle en cours se termine ; aucun nouveau ne démarre avant la reprise.",
     "resume": "Recommencer à réveiller ce gardien. Il se réveille aussitôt, son intervalle étant ramené au minimum.",
     "wake": "Lancer un cycle maintenant au lieu d'attendre le calendrier. Si un cycle est en cours, le nouveau démarre après lui.",
     "runs": "Ouvrir la page Exécutions filtrée sur les cycles de ce gardien."
    },
    "ticking": "Un cycle de ce gardien est en cours."
   }
  },
  "keeperRevision": {
   "done": "Fermer cette boîte de dialogue. La révision a été enregistrée avec les valeurs ajustées listées ci-dessus.",
   "draft": "Enregistrer cette révision comme brouillon sans l'utiliser. Publiez-la plus tard depuis la liste des révisions.",
   "publish": "Enregistrer cette révision et la rendre courante maintenant. L'espacement est réinitialisé et le gardien se réveille aussitôt."
  },
  "views": {
   "runDetail": {
    "keeper": "Le gardien qui a lancé cette exécution comme l'un de ses cycles.",
    "openKeeper": "Ouvrir le gardien, avec ses cycles et ses révisions."
   },
   "home": {
    "autonomy": {
     "title": "Les gardiens de ce locataire et ceux dont le dernier cycle demande une personne.",
     "open": "Ouvrir la page Gardiens pour créer, mettre en pause, réveiller ou modifier des gardiens.",
     "active": "Gardiens qui se réveillent selon leur calendrier.",
     "paused": "Gardiens qui ne se réveillent pas tant que personne ne les reprend.",
     "ticking": "Gardiens dont un cycle est en cours en ce moment.",
     "nextWake": "Le réveil planifié le plus proche parmi les gardiens actifs.",
     "attention": "Gardiens dont le dernier cycle demande de l'attention, a escaladé, a échoué ou n'a pas rapporté, et gardiens arrêtés par un budget ou un gel.",
     "openKeeper": "Ouvrir la page de ce gardien pour voir ses cycles."
    }
   },
   "keeperDetail": {
    "openRun": "Ouvrir la page de détail de cette exécution : sa transcription, ses appels d'outils et son résultat.",
    "live": "Les mises à jour arrivent au démarrage et à la fin des cycles, via la connexion en direct.",
    "polling": "La connexion en direct est indisponible, la page relit donc le gardien toutes les quelques secondes.",
    "viewJson": "Afficher l'enregistrement du gardien avec sa révision courante au format JSON.",
    "newRevision": "Rédiger une nouvelle révision de l'objectif, du calendrier ou des budgets, à partir de la révision courante.",
    "delete": "Supprimer ce gardien avec ses révisions et son historique de cycles. Ses exécutions passées sont conservées.",
    "forceDelete": "Supprimer le gardien et annuler l'exécution du cycle en cours.",
    "openAgent": "Ouvrir l'agent que ce gardien exécute.",
    "quietStreak": "Combien de cycles d'affilée n'ont rien trouvé à faire. En mode Backoff, chacun allonge l'attente.",
    "activeRun": "L'exécution du cycle en cours, s'il y en a un.",
    "revisionTitle": "La révision publiée que le gardien suit à chaque cycle.",
    "ticks": "Chaque réveil de ce gardien, du plus récent au plus ancien : ce qui l'a réveillé, ce qu'il a trouvé et l'attente qu'il a fixée.",
    "outcomeFilter": "Afficher uniquement les cycles ayant ce résultat.",
    "outcomeCounts": "Combien de cycles de cette page ont eu chaque résultat.",
    "chart": "L'attente après chaque cycle de cette page, le plus ancien à gauche. Elle augmente après les cycles calmes en mode Backoff et se réinitialise quand il se passe quelque chose.",
    "columns": {
     "started": "Quand le cycle a démarré. Survolez pour voir l'heure exacte.",
     "source": "Ce qui a réveillé le gardien pour ce cycle.",
     "outcome": "Ce que le cycle a rapporté : calme, intervenu, demande attention, escaladé ou échoué.",
     "run": "L'exécution qui a réalisé le cycle.",
     "interval": "L'attente jusqu'au prochain réveil, telle que fixée à la fin de ce cycle.",
     "cost": "Ce qu'a coûté l'exécution du cycle, d'après la grille tarifaire du modèle.",
     "summary": "Ce que le gardien a dit avoir trouvé ou fait, ou l'erreur qui a arrêté le cycle.",
     "number": "Le numéro de révision. La révision courante est marquée.",
     "state": "Les révisions en brouillon sont enregistrées mais non utilisées ; les publiées ont été ou sont utilisées.",
     "revisionSource": "Qui a rédigé la révision : une personne, l'architecte d'agents ou un agent de supervision.",
     "author": "L'utilisateur ou l'identifiant qui a enregistré la révision.",
     "changeNote": "Pourquoi la révision a modifié le gardien.",
     "created": "Quand la révision a été enregistrée."
    },
    "requested": "Le gardien a demandé cette attente ; le serveur la maintient entre l'intervalle minimal et l'intervalle maximal.",
    "revisions": "Toutes les révisions de ce gardien, de la plus récente à la plus ancienne. Comparez-en une avec la précédente ou publiez un brouillon.",
    "current": "La révision que le gardien suit actuellement.",
    "diff": "Afficher ce que cette révision a modifié par rapport à la précédente."
   }
  }
 },
 "explainers": {
  "keepers": {
   "title": "Gardiens",
   "p1": "Un gardien est un agent qui a une mission permanente, son mandat. Il se réveille selon un calendrier, vérifie où en sont les choses, agit dans les limites de ce qu'il peut faire seul et rapporte un bref résultat à chaque fois. Chaque réveil est un cycle, et chaque cycle est une exécution du déploiement du gardien.",
   "p2": "En mode Backoff, un cycle calme repousse le prochain réveil, jusqu'à l'intervalle maximal, et tout autre résultat le ramène au minimum. Un seul cycle s'exécute à la fois : un réveil qui arrive pendant un cycle attend la fin de celui-ci.",
   "p3": "Les changements d'objectif, de calendrier ou de budgets sont des révisions. Publier une révision la rend courante immédiatement et réveille le gardien, et chaque révision reste dans l'historique pour être comparée."
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
})(fr, {
 "nav": {
  "hubs": {
   "autonomy": {
    "tip": "Des agents qui continuent seuls : les gardiens se réveillent selon un calendrier pour s'occuper d'une mission permanente, et les escalades sont les questions qu'ils posent aux personnes."
   }
  },
  "items": {
   "escalations": {
    "label": "Escalades",
    "tip": "Questions que des agents ont posées à une personne, un rôle ou un autre agent, et leurs réponses"
   }
  },
  "escalationsOpen_one": "{{count}} escalade attend une réponse",
  "escalationsOpen_other": "{{count}} escalades attendent une réponse"
 },
 "enums": {
  "resourceType": {
   "Escalation": "Escalade"
  },
  "notificationEvent": {
   "EscalationRaised": "Escalade créée",
   "EscalationExpired": "Escalade expirée"
  },
  "escalationStatus": {
   "Open": "Ouverte",
   "Answered": "Répondue",
   "Expired": "Expirée",
   "Cancelled": "Annulée",
   "Withdrawn": "Retirée"
  },
  "escalationSeverity": {
   "Info": "Info",
   "Warning": "Avertissement",
   "Urgent": "Urgente"
  },
  "escalationMode": {
   "NonBlocking": "Non bloquante",
   "Blocking": "Bloquante"
  },
  "escalationTargetKind": {
   "User": "Utilisateur",
   "Role": "Rôle",
   "Agent": "Agent",
   "Manager": "Responsable"
  },
  "escalationTimeoutAction": {
   "UseDefaultAnswer": "Utiliser la réponse par défaut",
   "Cancel": "Annuler",
   "EscalateUp": "Escalader plus haut"
  },
  "escalationResolutionSource": {
   "User": "Une personne",
   "Agent": "Un agent",
   "Timeout": "Expiration",
   "Raiser": "L'exécution d'origine",
   "System": "Garrison"
  }
 },
 "components": {
  "escalations": {
   "passedUp": "Escaladée plus haut",
   "answerTitle": "Répondre à {{agent}}",
   "submit": "Envoyer la réponse",
   "expires": "Expire {{when}}, puis : {{action}}",
   "question": "Question",
   "context": "Contexte",
   "choice": "Choisissez une option",
   "default": "Par défaut",
   "defaultAnswer": "Réponse par défaut : {{answer}}",
   "explain": "Explication (facultative)",
   "text": "Réponse",
   "textPlaceholder": "Écrivez votre réponse. L'agent la lit comme des données, pas comme des instructions.",
   "errors": {
    "choice": "Choisissez l'une des options.",
    "unknownChoice": "Cette escalade ne propose pas cette option.",
    "text": "Écrivez une réponse.",
    "textMax": "La réponse est limitée à {{max}} caractères."
   },
   "toasts": {
    "answered": "Réponse envoyée à {{agent}}.",
    "passedUp": "Cette escalade a été transmise à une autre. Répondez plutôt à celle-ci.",
    "notOpen": "Quelqu'un a répondu avant vous, ou elle a expiré.",
    "forbidden": "Il vous faut Update sur Escalation pour répondre."
   }
  }
 },
 "resources": {
  "escalations": {
   "title": "Escalades",
   "subtitle": "Questions que des agents ont posées à une personne, un rôle ou un autre agent. Les ouvertes attendent une réponse ; les bloquantes suspendent leur exécution jusque-là.",
   "add": "Ajouter une escalade",
   "create": "Créer une escalade",
   "edit": "Modifier l'escalade",
   "view": "Détails de l'escalade",
   "deleteTitle": "Supprimer l'escalade",
   "emptyTitle": "Aucune escalade",
   "emptyBody": "Une escalade apparaît quand un agent demande à une personne, un rôle ou un autre agent de trancher avec garrison_escalate.",
   "columns": {
    "createdUtc": "Créée",
    "severity": "Gravité",
    "status": "Statut",
    "question": "Question",
    "agent": "Agent",
    "target": "Adressée à",
    "expiresUtc": "Expire",
    "answer": "Réponse",
    "mode": "Mode",
    "mandate": "Gardien",
    "resolvedBy": "Répondue par",
    "resolutionSource": "Résolue par",
    "resolvedUtc": "Résolue",
    "raisingRunId": "Exécution d'origine",
    "id": "ID"
   },
   "filters": {
    "targetKind": "Adressée à"
   },
   "fields": {
    "status": "Statut",
    "severity": "Gravité",
    "mode": "Mode",
    "target": "Adressée à",
    "agent": "Créée par",
    "raisingRunId": "Exécution d'origine",
    "mandate": "Gardien",
    "mandateTickId": "Cycle du gardien",
    "routedRunId": "Exécution qui répond",
    "parentEscalationId": "Escaladée depuis",
    "escalatedToId": "Escaladée vers",
    "timeoutAction": "À l'expiration",
    "expiresUtc": "Expire",
    "createdUtc": "Créée",
    "leaseEpoch": "Époque du bail",
    "context": "Contexte",
    "options": "Options",
    "answerChoice": "Choix",
    "answerText": "Réponse",
    "resolvedBy": "Répondue par",
    "resolutionSource": "Résolue par",
    "resolvedUtc": "Résolue"
   },
   "actions": {
    "answer": "Répondre",
    "openEscalatedTo": "Ouvrir l'escalade vers laquelle elle est partie",
    "openRun": "Ouvrir l'exécution d'origine",
    "openKeeper": "Ouvrir le gardien",
    "cancel": "Annuler l'escalade"
   },
   "cancelTitle": "Annuler cette escalade ?",
   "cancelMessage": "{{agent}} ne recevra pas de réponse. L'escalade est conservée comme Annulée.",
   "cancelBlocking": "{{agent}} attend cette réponse. Annuler l'escalade annule aussi cette exécution.",
   "toasts": {
    "cancelled": "Escalade annulée."
   }
  },
  "keepers": {
   "fields": {
    "escalationTargetKind": "Escalader vers",
    "escalationTargetId": "Cible de l'escalade"
   },
   "noEscalationTarget": "La personne qui a enregistré la révision",
   "escalationTargetPlaceholder": "ID ou nom de l'utilisateur, du rôle ou de l'agent",
   "errors": {
    "escalationTargetId": "Indiquez l'utilisateur, le rôle ou l'agent vers qui escalader."
   }
  },
  "notifications": {
   "fields": {
    "escalationMinimumSeverity": "Gravité minimale des escalades"
   },
   "anySeverity": "Toute gravité"
  }
 },
 "views": {
  "escalationDetail": {
   "title": "Escalade",
   "titleWithAgent": "Escalade de {{agent}}",
   "notFoundTitle": "Escalade introuvable",
   "notFoundBody": "Elle n'existe pas dans ce locataire, ou elle a été supprimée avec son locataire.",
   "back": "Retour aux escalades",
   "open": "Cette escalade attend une réponse.",
   "openBlocking": "L'exécution d'origine est suspendue jusqu'à la réponse à cette escalade.",
   "expires": "Elle expire {{when}}, puis : {{action}}.",
   "passedUp": "Personne n'a répondu à temps, cette escalade a donc été transmise. Répondez à la nouvelle :",
   "question": "Question",
   "chosen": "Choisie",
   "answer": "Réponse"
  },
  "home": {
   "escalations": {
    "title_one": "{{count}} escalade attend une réponse",
    "title_other": "{{count}} escalades attendent une réponse",
    "open": "Ouvrir les escalades",
    "more_one": "Et {{count}} autre.",
    "more_other": "Et {{count}} autres."
   }
  }
 },
 "tips": {
  "nav": {
   "escalationsBadge_one": "{{count}} escalade attend une réponse. Ouvrez Autonomie, puis Escalades.",
   "escalationsBadge_other": "{{count}} escalades attendent une réponse. Ouvrez Autonomie, puis Escalades.",
   "tabs": {
    "escalations": "Escalades : questions que des agents ont posées à une personne, un rôle ou un autre agent, les ouvertes d'abord, avec Répondre et Annuler."
   }
  },
  "enums": {
   "resourceType": {
    "Escalation": "Questions que les exécutions posent à une personne, un rôle ou un autre agent, et leurs réponses."
   },
   "notificationEvent": {
    "EscalationRaised": "Un agent a créé une escalade. Les points de terminaison peuvent ignorer celles sous une gravité minimale.",
    "EscalationExpired": "Une escalade a expiré avant que quiconque réponde."
   },
   "escalationStatus": {
    "Open": "Attend une réponse. Une escalade bloquante suspend son exécution jusque-là.",
    "Answered": "Quelqu'un a répondu ; l'exécution ou le gardien d'origine a reçu la réponse.",
    "Expired": "Personne n'a répondu avant l'expiration, et l'action d'expiration s'est appliquée.",
    "Cancelled": "Une personne l'a annulée ; une exécution qui l'attendait a aussi été annulée.",
    "Withdrawn": "L'agent qui l'a créée a retiré la question."
   },
   "escalationSeverity": {
    "Info": "Pour information : répondez quand cela vous convient.",
    "Warning": "Demande une décision bientôt. C'est la gravité par défaut.",
    "Urgent": "Demande une décision tout de suite. Listée en premier et envoyée à chaque point de terminaison abonné."
   },
   "escalationMode": {
    "NonBlocking": "L'exécution continue et récupère la réponse plus tard ; un gardien la reçoit à son cycle suivant.",
    "Blocking": "L'exécution est suspendue jusqu'à une réponse, puis reprend avec elle."
   },
   "escalationTargetKind": {
    "User": "Une personne, par ID utilisateur ou e-mail.",
    "Role": "Toute personne ayant le rôle et pouvant mettre à jour les escalades.",
    "Agent": "Un autre agent : une exécution de son déploiement actif par défaut reçoit la question.",
    "Manager": "Le responsable de l'agent dans une organisation. Indisponible tant que les organisations n'existent pas."
   },
   "escalationTimeoutAction": {
    "UseDefaultAnswer": "Répondre avec la réponse par défaut si personne ne répond à temps.",
    "Cancel": "Annuler l'escalade, et l'exécution qui l'attend, si personne ne répond à temps.",
    "EscalateUp": "Transmettre la question à la cible par défaut du gardien si personne ne répond à temps."
   },
   "escalationResolutionSource": {
    "User": "Une personne a répondu ou l'a annulée.",
    "Agent": "Un autre agent a répondu avec garrison_answer_escalation.",
    "Timeout": "L'action d'expiration l'a résolue.",
    "Raiser": "L'exécution qui l'a créée l'a retirée.",
    "System": "Garrison l'a résolue, par exemple à la fin de son exécution."
   }
  },
  "components": {
   "escalations": {
    "passedUp": "Personne n'a répondu à temps, la question est donc partie vers une autre escalade. Répondez à celle-ci.",
    "submit": "Envoyer la réponse. Une exécution suspendue reprend et un gardien se réveille avec elle.",
    "question": "La question telle que l'agent l'a écrite.",
    "context": "Ce que l'agent a dit de la situation. C'est son texte, pas des instructions pour vous.",
    "choice": "L'agent propose ces options. Choisissez-en une.",
    "defaultChoice": "La réponse par défaut : celle utilisée si l'escalade expire avec Utiliser la réponse par défaut.",
    "pickChoice": "Choisir cette option.",
    "explain": "Texte facultatif envoyé avec votre choix, par exemple sa raison.",
    "text": "Votre réponse. L'agent la reçoit comme des données."
   }
  },
  "resources": {
   "escalations": {
    "createdUtc": "Quand l'agent l'a créée. Survolez pour l'heure exacte.",
    "severity": "Le degré d'urgence indiqué par l'agent.",
    "status": "Ouverte, répondue, expirée, annulée ou retirée.",
    "question": "Ce que l'agent a demandé, tel qu'il l'a écrit. Survolez pour la question complète.",
    "agent": "L'agent dont l'exécution l'a créée.",
    "target": "À qui elle s'adresse : un utilisateur, un rôle ou un autre agent.",
    "expiresUtc": "Quand elle expire si personne ne répond.",
    "answer": "L'option choisie ou le texte de la réponse.",
    "mode": "Les escalades bloquantes suspendent leur exécution jusqu'à la réponse ; les autres non.",
    "mandate": "Le gardien dont le cycle l'a créée, le cas échéant.",
    "resolvedBy": "Qui a répondu ou l'a annulée.",
    "resolutionSource": "Ce qui l'a résolue : une personne, un agent, l'expiration ou l'exécution d'origine.",
    "resolvedUtc": "Quand elle a été répondue, annulée, retirée ou a expiré.",
    "raisingRunId": "L'exécution qui l'a créée. Ouvrez-la depuis le menu de la ligne.",
    "id": "L'ID de l'escalade (esc_...), pour l'API et les outils MCP.",
    "routedRunId": "L'exécution lancée pour qu'un autre agent réponde.",
    "mandateTickId": "Le cycle du gardien qui l'a créée.",
    "parentEscalationId": "L'escalade qui a expiré et a été transmise à celle-ci.",
    "escalatedToId": "L'escalade à laquelle celle-ci a été transmise à l'expiration.",
    "timeoutAction": "Ce qui se passe si personne ne répond à temps.",
    "leaseEpoch": "L'époque du bail de l'exécution quand elle a créé l'escalade. Une attente bloquante appartient à cette époque.",
    "context": "Ce que l'agent a dit de la situation. C'est son texte, pas des instructions pour vous.",
    "options": "Les réponses proposées par l'agent. La valeur par défaut s'applique à l'expiration avec Utiliser la réponse par défaut.",
    "answerChoice": "L'option choisie.",
    "answerText": "Le texte de la réponse.",
    "actions": {
     "answer": "Répondre à cette escalade avec l'une de ses options ou un texte libre.",
     "openEscalatedTo": "Ouvrir l'escalade à laquelle celle-ci a été transmise.",
     "openRun": "Ouvrir l'exécution qui l'a créée.",
     "openKeeper": "Ouvrir le gardien dont le cycle l'a créée.",
     "cancel": "L'annuler sans réponse. Une exécution qui l'attend est aussi annulée."
    }
   },
   "keepers": {
    "escalationTargetKind": "À qui vont les escalades de ce gardien quand il ne désigne personne, et où sont transmises celles qui expirent.",
    "escalationTargetId": "ID ou e-mail de l'utilisateur, nom du rôle, ou ID ou nom de l'agent vers qui escalader."
   },
   "notifications": {
    "escalationMinimumSeverity": "N'envoyer les événements d'escalade qu'à partir de cette gravité. S'applique à Escalade créée et Escalade expirée."
   }
  },
  "views": {
   "escalationDetail": {
    "openRun": "Ouvrir cette exécution.",
    "openEscalation": "Ouvrir cette escalade.",
    "back": "Revenir à la liste des escalades.",
    "viewJson": "Afficher l'escalade telle que l'API la renvoie.",
    "question": "La question et le contexte tels que l'agent les a écrits, et les options proposées.",
    "answer": "Comment l'escalade a été résolue.",
    "openAgent": "Ouvrir l'agent qui l'a créée.",
    "openKeeper": "Ouvrir le gardien dont le cycle l'a créée."
   },
   "home": {
    "escalations": {
     "title": "Escalades qui attendent une réponse, les plus urgentes d'abord.",
     "open": "Ouvrir la liste des escalades."
    }
   }
  },
  "filters": {
   "severity": "N'afficher que les escalades de cette gravité. Choisissez Toutes pour retirer le filtre.",
   "targetKind": "N'afficher que les escalades adressées à des utilisateurs, des rôles ou des agents. Choisissez Toutes pour retirer le filtre."
  }
 },
 "explainers": {
  "escalations": {
   "title": "Escalades",
   "p1": "Une escalade est une question qu'un agent pose quand il ne doit pas décider seul. Elle va à un utilisateur, à tous les détenteurs d'un rôle ou à un autre agent, avec en option des choix, une réponse par défaut, une gravité et un délai.",
   "p2": "La plupart des escalades ne bloquent pas : l'exécution continue, et un gardien trouve la réponse à son cycle suivant. Une escalade bloquante suspend son exécution, qui reprend avec la réponse dès que quelqu'un répond.",
   "p3": "Si personne ne répond à temps, l'action d'expiration s'applique : utiliser la réponse par défaut, annuler, ou transmettre la question à la cible par défaut du gardien. Les réponses parviennent à l'agent comme des données et n'élargissent pas ses permissions."
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
})(fr, {
 "nav": {
  "items": {
   "freezes": {
    "label": "Gels",
    "tip": "Freins sur les agents, déploiements, gardiens et applications, et l'arrêt d'urgence de l'autonomie"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Freeze": "Gel"
  },
  "auditEventType": {
   "FreezeApplied": "Gel appliqué",
   "FreezeLifted": "Gel levé",
   "KillSwitchChanged": "Arrêt d'urgence modifié",
   "BoardDirectionGiven": "Orientation du comité donnée"
  },
  "notificationEvent": {
   "FreezeApplied": "Gel appliqué",
   "MandateCapReached": "Plafond de dépenses du gardien atteint"
  },
  "freezeTargetKind": {
   "Agent": "Agent IA",
   "Deployment": "Déploiement",
   "Mandate": "Gardien",
   "App": "Application",
   "OrgUnit": "Unité organisationnelle",
   "Organization": "Organisation",
   "TenantAutonomy": "Arrêt d'urgence"
  }
 },
 "errorCodes": {
  "Frozen": "Cet élément est gelé : les nouvelles exécutions sont refusées jusqu'à la levée du gel.",
  "AlreadyFrozen": "Cet élément est déjà gelé. Levez d'abord ce gel ou laissez-le en place.",
  "FreezeLifted": "Quelqu'un a déjà levé ce gel.",
  "KillSwitch": "L'arrêt d'urgence de l'autonomie est activé, donc les exécutions des gardiens sont refusées.",
  "MandateBudgetExceeded": "Ce gardien a dépensé son budget pour ce tick ou pour aujourd'hui.",
  "OrganizationsUnavailable": "Les gels d'organisation arriveront avec les organisations. Gelez plutôt un agent, un déploiement, un gardien ou une application."
 },
 "freezes": {
  "killSwitchTarget": "L'arrêt d'urgence de l'autonomie",
  "freezeTitle": "Geler ?",
  "freezeMessage": "Geler {{target}} ? Les nouvelles exécutions sont refusées jusqu'à la levée du gel, et les gardiens concernés cessent de se réveiller.",
  "freezePickMessage": "Choisissez ce qu'il faut geler. Les nouvelles exécutions sont refusées jusqu'à la levée du gel, et les gardiens concernés cessent de se réveiller.",
  "pickTarget": "Choisir...",
  "reasonPlaceholder": "Pourquoi ? Les personnes qui voient le gel liront ce texte.",
  "liftTitle": "Lever ce gel ?",
  "liftMessage": "Lever le gel de {{target}} ? Les nouvelles exécutions sont de nouveau acceptées.",
  "liftKeeperMessage": "Lever le gel de {{target}} ? Le gardien redevient actif et son prochain réveil est réparti sur une courte période.",
  "bannerOwn": "Gelé : les nouvelles exécutions sont refusées jusqu'à la levée du gel.",
  "bannerTarget": "{{target}} est gelé : ses nouvelles exécutions sont refusées.",
  "bannerKillSwitch": "L'arrêt d'urgence de l'autonomie est activé : aucun tick de gardien ne démarre dans ce locataire.",
  "bannerBy": "Gelé par {{who}} {{when}}.",
  "bannerReason": "Motif : {{reason}}",
  "openTarget": "Ouvrir",
  "status": {
   "active": "Actif",
   "lifted": "Levé"
  },
  "fields": {
   "targetKind": "Ce qu'il faut geler",
   "target": "Cible",
   "reason": "Motif (facultatif)",
   "liftReason": "Motif de la levée (facultatif)",
   "cancelActiveRuns": "Annuler aussi les exécutions déjà actives"
  },
  "actions": {
   "freeze": "Geler",
   "freezeAny": "Geler un élément",
   "lift": "Lever le gel",
   "openTarget": "Ouvrir l'élément gelé"
  },
  "errors": {
   "reasonMax": "Le motif est limité à {{max}} caractères.",
   "target": "Choisissez ce qu'il faut geler."
  },
  "toasts": {
   "frozen": "{{target}} est gelé.",
   "frozenCancelled_one": "{{target}} est gelé et {{count}} exécution active a été annulée.",
   "frozenCancelled_other": "{{target}} est gelé et {{count}} exécutions actives ont été annulées.",
   "lifted": "Le gel de {{target}} est levé."
  },
  "killSwitch": {
   "title": "Arrêt d'urgence de l'autonomie",
   "on": "Activé",
   "off": "Désactivé",
   "turnOn": "Activer",
   "turnOff": "Désactiver",
   "help": "Tant que l'arrêt d'urgence est activé, aucun tick de gardien ne démarre et les exécutions des gardiens sont refusées. Les invocations par des personnes et des identifiants d'API continuent de fonctionner.",
   "changedBy": "Activé par {{who}} {{when}}.",
   "onTitle": "Activer l'arrêt d'urgence ?",
   "onMessage": "Tous les gardiens de ce locataire cessent de se réveiller et leurs exécutions sont refusées jusqu'à la désactivation. Les ticks en cours se terminent.",
   "offTitle": "Désactiver l'arrêt d'urgence ?",
   "offMessage": "Les gardiens se réveillent de nouveau, avec leurs prochains réveils répartis sur une courte période.",
   "toasts": {
    "on": "L'arrêt d'urgence est activé. Aucun tick de gardien ne démarre.",
    "off": "L'arrêt d'urgence est désactivé. Les gardiens se réveillent de nouveau."
   }
  }
 },
 "resources": {
  "freezes": {
   "title": "Gels",
   "subtitle": "Freins qui refusent les nouvelles exécutions d'un agent, d'un déploiement, d'un gardien ou d'une application jusqu'à leur levée. L'arrêt d'urgence apparaît aussi ici.",
   "add": "Ajouter un gel",
   "create": "Créer un gel",
   "edit": "Modifier le gel",
   "view": "Détails du gel",
   "deleteTitle": "Supprimer le gel",
   "emptyTitle": "Aucun gel",
   "emptyBody": "Rien n'est gelé. Gelez un agent, un déploiement, un gardien ou une application depuis sa page ou avec Geler un élément.",
   "columns": {
    "createdUtc": "Gelé le",
    "status": "Statut",
    "targetKind": "Type",
    "target": "Cible",
    "reason": "Motif",
    "createdBy": "Gelé par",
    "cancelledRunCount": "Exécutions annulées",
    "liftedUtc": "Levé le",
    "liftedBy": "Levé par",
    "liftReason": "Motif de la levée",
    "targetId": "ID de la cible",
    "id": "ID"
   }
  }
 },
 "views": {
  "home": {
   "autonomy": {
    "freezes_one": "{{count}} gel actif",
    "freezes_other": "{{count}} gels actifs"
   }
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "freezes": "Gels : freins sur les agents, déploiements, gardiens et applications, les actifs en premier, avec Geler et Lever."
   }
  },
  "enums": {
   "resourceType": {
    "Freeze": "Gels qui arrêtent les nouvelles exécutions d'un agent, d'un déploiement, d'un gardien ou d'une application, et l'arrêt d'urgence de l'autonomie."
   },
   "auditEventType": {
    "FreezeApplied": "Quelqu'un a gelé un agent, un déploiement, un gardien ou une application.",
    "FreezeLifted": "Quelqu'un a levé un gel.",
    "KillSwitchChanged": "Quelqu'un a activé ou désactivé l'arrêt d'urgence de l'autonomie.",
    "BoardDirectionGiven": "Quelqu'un a donné une orientation au gardien CEO depuis le comité."
   },
   "notificationEvent": {
    "FreezeApplied": "Quelqu'un a gelé un agent, un déploiement, un gardien ou une application, ou a activé l'arrêt d'urgence.",
    "MandateCapReached": "Un gardien a atteint son plafond de dépenses quotidien et ne se réveille plus jusqu'au prochain jour UTC."
   },
   "freezeTargetKind": {
    "Agent": "Tous les déploiements de l'agent : les nouvelles exécutions sont refusées et ses gardiens cessent de se réveiller.",
    "Deployment": "Un déploiement : les nouvelles exécutions sont refusées et les gardiens qui s'y exécutent cessent de se réveiller.",
    "Mandate": "Un gardien : il cesse de se réveiller jusqu'à la levée du gel.",
    "App": "Une application : les nouvelles conversations et les nouveaux messages de son chat sont refusés.",
    "OrgUnit": "Une unité organisationnelle. Indisponible tant que les organisations n'existent pas.",
    "Organization": "Une organisation entière. Indisponible tant que les organisations n'existent pas.",
    "TenantAutonomy": "L'arrêt d'urgence : aucun tick de gardien ne démarre dans tout le locataire."
   }
  },
  "freezes": {
   "denied": "Vous n'y êtes pas autorisé. Il faut {{operation}} sur Gel.",
   "openTarget": "Ouvrir la page de l'élément que ce gel arrête.",
   "status": {
    "active": "En vigueur : les nouvelles exécutions dans son périmètre sont refusées.",
    "lifted": "Quelqu'un l'a levé ; les exécutions sont de nouveau acceptées."
   },
   "actions": {
    "freeze": "Geler : les nouvelles exécutions sont refusées et les gardiens concernés cessent de se réveiller jusqu'à la levée. Vous confirmez d'abord.",
    "freezeAny": "Choisir un agent, un déploiement, un gardien ou une application et le geler. Vous confirmez d'abord.",
    "lift": "Lever le gel pour accepter de nouveau les exécutions. Vous confirmez d'abord."
   },
   "fields": {
    "targetKind": "Geler un agent (tous ses déploiements), un déploiement, un gardien ou une application.",
    "target": "L'enregistrement à geler.",
    "reason": "Facultatif. Affiché sur le bandeau de gel et dans le journal d'audit.",
    "liftReason": "Facultatif. Enregistré avec le gel et dans le journal d'audit.",
    "cancelActiveRuns": "Annuler aussi les exécutions du périmètre déjà en file d'attente ou en cours. Sinon, elles se terminent."
   },
   "filters": {
    "active": "Afficher seulement les gels actifs ou seulement les gels levés. Choisissez Tous pour afficher les deux.",
    "targetKind": "Afficher seulement les gels de ce type. Choisissez Tous pour retirer le filtre."
   },
   "killSwitch": {
    "title": "Un interrupteur qui arrête tous les gardiens de ce locataire. Les invocations ordinaires continuent de fonctionner.",
    "on": "Activé : aucun tick de gardien ne démarre et les exécutions des gardiens sont refusées.",
    "off": "Désactivé : les gardiens se réveillent selon leur planification.",
    "turnOn": "Arrêter tous les gardiens de ce locataire. Vous confirmez d'abord.",
    "turnOff": "Laisser les gardiens se réveiller de nouveau. Vous confirmez d'abord."
   }
  },
  "resources": {
   "freezes": {
    "createdUtc": "Quand le gel a été appliqué. Survolez pour l'heure exacte.",
    "status": "Actif tant que le gel est en vigueur ; Levé ensuite.",
    "targetKind": "Le type d'enregistrement gelé.",
    "target": "L'agent, le déploiement, le gardien ou l'application gelé.",
    "reason": "Pourquoi il a été gelé. Survolez pour le texte complet.",
    "createdBy": "Qui l'a gelé.",
    "cancelledRunCount": "Combien d'exécutions actives le gel a annulées, si cela a été demandé.",
    "liftedUtc": "Quand le gel a été levé.",
    "liftedBy": "Qui l'a levé.",
    "liftReason": "Pourquoi il a été levé.",
    "targetId": "L'ID de l'enregistrement gelé.",
    "id": "L'ID du gel (mfz_...), pour l'API et les outils MCP."
   }
  },
  "views": {
   "home": {
    "autonomy": {
     "freezes": "Ouvrir la liste des gels actifs."
    }
   }
  },
  "filters": {
   "active": "Afficher seulement les enregistrements actifs ou seulement les inactifs. Choisissez Tous pour afficher les deux."
  }
 },
 "explainers": {
  "freezes": {
   "title": "Gels",
   "p1": "Un gel est un frein. Tant qu'il est actif, Garrison refuse les nouvelles exécutions de l'agent, du déploiement, du gardien ou de l'application gelé avec 409 Frozen, et les gardiens concernés cessent de se réveiller. Les exécutions déjà actives se terminent, sauf si le gel les annule aussi.",
   "p2": "Gelez depuis la page d'un agent, d'un déploiement, d'un gardien ou d'une application, ou ici avec Geler un élément. Lever un gel accepte de nouveau les exécutions ; un gardien gelé redevient actif et son prochain réveil est réparti sur une courte période.",
   "p3": "L'arrêt d'urgence de l'autonomie, dans les Paramètres et sur la page d'accueil, arrête en une fois tous les ticks de gardiens du locataire. Il apparaît ici comme un gel de type Arrêt d'urgence."
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
})(fr, {
 "nav": {
  "items": {
   "memory": {
    "label": "Mémoire",
    "tip": "Ce que les agents IA et les personnes ont enregistré, par portée, avec l'auteur et la date de chaque entrée"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Memory": "Mémoire"
  },
  "memoryScopeKind": {
   "Agent": "Agent IA",
   "App": "Application",
   "OrgUnit": "Unité organisationnelle",
   "Organization": "Organisation"
  }
 },
 "errorCodes": {
  "MemoryVersionConflict": "Cette entrée de mémoire a changé depuis son chargement. Rechargez-la et décidez à nouveau.",
  "MemoryDisabled": "La mémoire des agents IA est désactivée sur ce serveur : le texte des entrées ne peut pas être lu et les entrées ne peuvent pas être supprimées."
 },
 "memory": {
  "legacy": "Héritée",
  "deletedScope": "{{id}} (supprimé)",
  "neverRead": "Jamais",
  "noExpiry": "Jamais",
  "deleteTitle": "Supprimer cette entrée de mémoire ?",
  "deleteMessage": "Supprimer {{key}} de {{scope}} ? Les agents IA qui la cherchent ne trouveront plus rien, et son texte est effacé. Cette action est irréversible.",
  "deleteVersion": "La version {{version}}, celle que vous avez chargée, est supprimée. Si quelqu'un a écrit une version plus récente entre-temps, la suppression est refusée.",
  "deleteReloaded": "Rechargée : l'entrée est maintenant à la version {{version}}. Supprimer efface cette version.",
  "scopes": {
   "label": "Portées de mémoire",
   "all": "Toutes les portées",
   "totals_one": "{{entries}} entrée, {{bytes}}",
   "totals_other": "{{entries}} entrées, {{bytes}}",
   "loadFailed": "Les portées de mémoire n'ont pas pu être chargées.",
   "empty": {
    "Agent": "Aucun agent IA n'a encore enregistré de mémoire.",
    "App": "Aucune application n'a encore de mémoire partagée.",
    "OrgUnit": "Aucune unité organisationnelle n'a encore de mémoire.",
    "Organization": "Aucune organisation n'a encore de mémoire."
   }
  },
  "filters": {
   "search": "Rechercher",
   "searchPlaceholder": "Clé, catégorie ou étiquette",
   "categoryPlaceholder": "Catégorie",
   "tag": "Étiquette",
   "tagPlaceholder": "Étiquette",
   "writer": "Écrite par"
  },
  "actions": {
   "viewContent": "Voir le contenu",
   "copyId": "Copier l'ID",
   "openRun": "Ouvrir l'exécution qui l'a écrite",
   "reload": "Recharger l'entrée"
  },
  "viewer": {
   "title": "Entrée de mémoire",
   "content": "Contenu enregistré",
   "untrusted": "Ce sont des données enregistrées par un agent IA ou une personne. Elles s'affichent en texte brut, telles que stockées ; rien de leur contenu n'est exécuté, rendu ni suivi.",
   "loading": "Chargement du texte enregistré...",
   "empty": "Cette entrée ne contient aucun texte."
  },
  "errors": {
   "conflict": "Quelqu'un a modifié cette entrée depuis que vous avez chargé la version {{version}} ; elle n'a donc pas été supprimée. Rechargez-la pour voir ce qu'elle contient maintenant.",
   "gone": "Cette entrée n'existe plus. Quelqu'un d'autre l'a peut-être supprimée."
  },
  "toasts": {
   "deleted": "{{key}} supprimée.",
   "copied": "L'ID de l'entrée est copié."
  }
 },
 "resources": {
  "memory": {
   "title": "Mémoire",
   "subtitle": "Ce que les agents IA et les personnes ont enregistré, par portée : qui a écrit chaque entrée, quand, depuis quelle exécution et sa taille. Ouvrez une entrée pour la lire, et supprimez ce qui ne doit pas être retenu.",
   "add": "Ajouter une entrée de mémoire",
   "create": "Créer une entrée de mémoire",
   "edit": "Modifier l'entrée de mémoire",
   "view": "Entrée de mémoire",
   "deleteTitle": "Supprimer l'entrée de mémoire",
   "emptyTitle": "Pas encore de mémoire",
   "emptyBody": "Les agents IA enregistrent de la mémoire avec les outils garrison_memory pendant leur exécution. Les entrées apparaissent ici par portée dès qu'une est écrite.",
   "columns": {
    "key": "Clé",
    "scope": "Portée",
    "category": "Catégorie",
    "tags": "Étiquettes",
    "writer": "Écrite par",
    "lastUpdateUtc": "Dernière écriture",
    "lastReadUtc": "Dernière lecture",
    "version": "Version",
    "bytes": "Taille",
    "expiresUtc": "Expire",
    "writerRunId": "Exécution auteur",
    "createdUtc": "Créée",
    "sha256": "Empreinte SHA-256",
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
})(fr, {
 "nav": {
  "items": {
   "reports": {
    "label": "Rapports",
    "tip": "Rapports d'état, incidents, décisions et passations déposés par des agents et des personnes, avec leur santé et leurs indicateurs"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Report": "Rapport"
  },
  "notificationEvent": {
   "ReportUnhealthy": "Rapport défaillant déposé"
  },
  "reportKind": {
   "Status": "Point d'étape",
   "Incident": "Incident",
   "Decision": "Décision",
   "Handoff": "Passation",
   "Brief": "Synthèse"
  },
  "reportHealth": {
   "Healthy": "Sain",
   "Degraded": "Dégradé",
   "Unhealthy": "Défaillant",
   "Unknown": "Inconnue"
  },
  "reportAudience": {
   "Manager": "Responsable",
   "Chain": "Chaîne hiérarchique",
   "Board": "Conseil"
  },
  "reportIssueSeverity": {
   "Low": "Faible",
   "Medium": "Moyenne",
   "High": "Élevée"
  }
 },
 "reports": {
  "untrusted": "Un agent ou une personne a rédigé ce rapport. Son titre, son contenu, ses indicateurs, ses problèmes et ses décisions s'affichent en texte brut, exactement tels qu'ils ont été déposés ; rien n'y est exécuté, interprété ni suivi.",
  "period": "Du {{from}} au {{to}}",
  "periodFrom": "À partir du {{from}}",
  "periodTo": "Jusqu'au {{to}}",
  "filters": {
   "author": "Auteur",
   "app": "Application",
   "from": "Déposé après",
   "to": "Déposé avant"
  },
  "actions": {
   "file": "Déposer un rapport",
   "copyId": "Copier l'ID",
   "openRun": "Ouvrir l'exécution",
   "openKeeper": "Ouvrir le gardien",
   "openAuthor": "Ouvrir l'auteur"
  },
  "toasts": {
   "filed": "{{title}} déposé.",
   "copied": "ID du rapport copié."
  },
  "file": {
   "title": "Déposer un rapport",
   "intro": "Consignez où en sont les choses. Toutes les personnes autorisées à lire les rapports le verront ici, et un rapport défaillant prévient les endpoints abonnés à cet événement. Un rapport déposé ne peut plus être modifié.",
   "noAgent": "Aucun agent (en mon nom)",
   "fields": {
    "title": "Titre",
    "kind": "Genre",
    "health": "Santé",
    "audience": "Destinataires",
    "agent": "Déposer pour l'agent",
    "body": "Contenu"
   },
   "errors": {
    "title": "Donnez au rapport un titre de 1 à {{max}} caractères.",
    "body": "Le contenu ne peut pas dépasser {{max}} octets."
   }
  },
  "chart": {
   "metric": "Indicateur",
   "title": "{{metric}} dans le temps",
   "help_one": "{{count}} valeur signalée par {{agent}}, de la plus ancienne à la plus récente.",
   "help_other": "{{count}} valeurs signalées par {{agent}}, de la plus ancienne à la plus récente.",
   "noMetrics": "Ce rapport ne contient aucun indicateur, il n'y a donc rien à tracer.",
   "noAuthor": "Aucun agent n'a rédigé ce rapport, il n'y a donc pas d'historique d'auteur à tracer.",
   "empty": "Aucune valeur pour cet indicateur pour l'instant.",
   "failed": "Impossible de charger l'historique de l'indicateur."
  }
 },
 "views": {
  "reportDetail": {
   "title": "Rapport",
   "notFoundTitle": "Rapport introuvable",
   "notFoundBody": "Il n'existe pas dans ce locataire, ou il a été supprimé avec son locataire.",
   "back": "Retour aux rapports",
   "body": "Contenu",
   "metrics": "Indicateurs",
   "chart": "Historique de l'indicateur",
   "issues": "Problèmes",
   "decisions": "Décisions",
   "noBody": "Ce rapport n'a pas de contenu.",
   "noMetrics": "Ce rapport n'a pas d'indicateurs.",
   "noIssues": "Aucun problème signalé.",
   "noDecisions": "Aucune décision consignée.",
   "columns": {
    "name": "Nom",
    "value": "Valeur",
    "unit": "Unité"
   },
   "fields": {
    "health": "Santé",
    "kind": "Genre",
    "audience": "Destinataires",
    "author": "Auteur",
    "period": "Période",
    "createdUtc": "Déposé",
    "filedBy": "Déposé par",
    "runId": "Exécution",
    "mandateId": "Gardien",
    "mandateTickId": "Cycle du gardien",
    "app": "Application",
    "orgUnitId": "Unité organisationnelle"
   }
  }
 },
 "resources": {
  "reports": {
   "title": "Rapports",
   "subtitle": "Ce que les agents et les personnes ont fait remonter : où en sont les choses, incidents, décisions et passations, avec leur santé et leurs indicateurs. Ouvrez-en un pour le lire et suivre un indicateur dans le temps.",
   "add": "Déposer un rapport",
   "create": "Déposer un rapport",
   "edit": "Rapport",
   "view": "Détails du rapport",
   "deleteTitle": "Supprimer le rapport",
   "emptyTitle": "Aucun rapport pour l'instant",
   "emptyBody": "Les agents déposent des rapports avec l'outil garrison_file_report pendant leurs exécutions, et les personnes les déposent ici ou via l'API. Ils apparaissent ici dès que l'un d'eux est déposé.",
   "columns": {
    "createdUtc": "Déposé",
    "title": "Titre",
    "author": "Auteur",
    "kind": "Genre",
    "health": "Santé",
    "app": "Application",
    "period": "Période",
    "issues": "Problèmes",
    "audience": "Destinataires",
    "filedBy": "Déposé par",
    "runId": "Exécution",
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
})(fr, {
 "nav": {
  "items": {
   "messages": {
    "label": "Messages",
    "tip": "Courrier entre agents et venant de personnes, avec les messages refusés par les garde-fous anti-boucle et la raison"
   },
   "messageThreads": {
    "label": "Fil de messages",
    "tip": "Tous les messages d'un fil, du plus ancien au plus récent"
   }
  }
 },
 "enums": {
  "resourceType": {
   "AgentMessage": "Message d'agent"
  },
  "runKind": {
   "Message": "Message urgent"
  },
  "messageStatus": {
   "Queued": "En attente",
   "Delivered": "Remis",
   "Acknowledged": "Accusé",
   "Expired": "Expiré",
   "Rejected": "Refusé"
  },
  "messageUrgency": {
   "Normal": "Normale",
   "Urgent": "Urgente"
  },
  "messageRejection": {
   "HopLimit": "Limite de sauts",
   "LineRate": "Débit de la ligne",
   "ThreadBudget": "Budget du fil",
   "NoLine": "Aucune ligne",
   "Frozen": "Destinataire gelé"
  }
 },
 "messages": {
  "untrusted": "Des agents et des personnes ont écrit ces messages. Les objets, les corps et les détails de refus sont affichés en texte brut, tels qu'envoyés ; rien n'y est exécuté, rendu ni suivi.",
  "views": {
   "label": "Quels messages",
   "all": "Tous les messages",
   "rejected": "Refusés",
   "rejectedNote": "Messages que les garde-fous anti-boucle ont refusés à l'envoi, avec la raison. Un message refusé n'a jamais été remis."
  },
  "filters": {
   "reason": "Raison",
   "sender": "Expéditeur",
   "recipient": "Destinataire",
   "from": "Envoyé après",
   "to": "Envoyé avant"
  },
  "actions": {
   "send": "Envoyer un message",
   "openThread": "Ouvrir le fil",
   "copyId": "Copier l'ID",
   "openSender": "Ouvrir l'expéditeur",
   "openRecipient": "Ouvrir le destinataire",
   "openDeliveredRun": "Ouvrir l'exécution destinataire",
   "openEscalation": "Ouvrir l'escalade"
  },
  "toasts": {
   "sent": "Envoyé à {{recipient}}.",
   "copied": "ID du message copié."
  },
  "send": {
   "title": "Envoyer un message",
   "intro": "Écrivez à un agent. Le message attend dans sa boîte de réception jusqu'à ce qu'une exécution le lise ; un message urgent réveille l'agent tout de suite.",
   "replyIntro": "Répondez dans ce fil. La réponse va à l'agent qui a envoyé le message.",
   "pickRecipient": "Choisir un agent",
   "ttlPlaceholder": "Valeur par défaut du serveur",
   "sending": "Envoi...",
   "rejected": "Les garde-fous anti-boucle ont refusé ce message.",
   "rejectedStored": "Le message refusé est conservé dans la liste des refusés.",
   "fields": {
    "recipient": "À",
    "subject": "Objet",
    "body": "Corps",
    "urgency": "Urgence",
    "ttlSeconds": "Expire après (secondes)"
   },
   "errors": {
    "recipient": "Choisissez l'agent à qui envoyer le message.",
    "subject": "Donnez au message un objet de 1 à {{max}} caractères.",
    "body": "Le corps contient au plus {{max}} octets.",
    "ttlSeconds": "Saisissez un nombre entier de secondes de {{min}} à {{max}}, ou laissez le champ vide."
   }
  }
 },
 "views": {
  "messageThread": {
   "title": "Fil de messages",
   "notFoundTitle": "Fil introuvable",
   "notFoundBody": "Il n'existe pas dans ce locataire, ou il a été supprimé avec son locataire.",
   "back": "Retour aux messages",
   "count_one": "{{count}} message",
   "count_other": "{{count}} messages",
   "rejectedCount_one": "{{count}} refusé",
   "rejectedCount_other": "{{count}} refusés",
   "emptyTitle": "Aucun message dans ce fil",
   "emptyBody": "Le fil existe mais ne contient aucun message que vous pouvez lire.",
   "listLabel": "Messages de ce fil, du plus ancien au plus récent",
   "noBody": "Ce message n'a pas de corps.",
   "noDetail": "Aucun détail supplémentaire.",
   "woke": "A réveillé le destinataire",
   "artifacts": "Artefacts joints",
   "reply": "Répondre",
   "replyPrefix": "RE : ",
   "fields": {
    "sender": "De",
    "recipient": "À",
    "createdUtc": "Envoyé",
    "hopCount": "Sauts",
    "deliveredRunId": "Remis à l'exécution",
    "deliveredUtc": "Remis",
    "acknowledgedUtc": "Accusé",
    "expiresUtc": "Expire",
    "wokeRecipient": "Réveil",
    "escalationId": "Escalade",
    "id": "ID du message"
   }
  },
  "agentDetail": {
   "inbox": {
    "tab": "Boîte de réception",
    "status": "Statut",
    "openAll": "Ouvrir dans Messages",
    "none": "Aucun message pour cet agent pour l'instant.",
    "noneWithStatus": "Aucun message pour cet agent avec ce statut.",
    "more": "Affichage des {{shown}} plus récents sur {{total}}. Ouvrez Messages pour tous les voir."
   }
  },
  "home": {
   "autonomy": {
    "rejected_one": "{{count}} message refusé par les garde-fous anti-boucle au cours des dernières 24 heures",
    "rejected_other": "{{count}} messages refusés par les garde-fous anti-boucle au cours des dernières 24 heures",
    "noneRejected": "Aucun message refusé par les garde-fous anti-boucle au cours des dernières 24 heures"
   }
  }
 },
 "resources": {
  "messages": {
   "title": "Messages",
   "subtitle": "Courrier entre agents et venant de personnes, du plus récent au plus ancien, avec les messages refusés par les garde-fous anti-boucle. Ouvrez-en un pour lire tout son fil.",
   "add": "Envoyer un message",
   "create": "Envoyer un message",
   "edit": "Message",
   "view": "Détails du message",
   "deleteTitle": "Supprimer le message",
   "emptyTitle": "Aucun message pour l'instant",
   "emptyBody": "Les agents envoient des messages avec l'outil garrison_send_message pendant leur exécution, et les personnes les envoient ici ou par l'API. Ils apparaissent ici dès qu'un message est envoyé.",
   "columns": {
    "createdUtc": "Envoyé",
    "urgency": "Urgence",
    "status": "Statut",
    "subject": "Objet",
    "sender": "De",
    "recipient": "À",
    "reason": "Refus",
    "hopCount": "Sauts",
    "deliveredRunId": "Remis à l'exécution",
    "expiresUtc": "Expire",
    "escalationId": "Escalade",
    "threadId": "Fil",
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
})(fr, {
 "nav": {
  "items": {
   "organizations": {
    "label": "Organisations",
    "tip": "Arbres d'unités avec responsables, membres, lignes transversales et budgets, publiés sous forme de révisions"
   }
  }
 },
 "enums": {
  "resourceType": {
   "Organization": "Organisation"
  },
  "organizationStatus": {
   "Draft": "Brouillon",
   "Active": "Active",
   "Frozen": "Gelée",
   "Retired": "Retirée"
  },
  "budgetPeriod": {
   "Day": "Jour",
   "Month": "Mois"
  },
  "orgRevisionState": {
   "Draft": "Brouillon",
   "Published": "Publiée",
   "Superseded": "Remplacée"
  }
 },
 "organizations": {
  "notPublished": "Non publiée",
  "actions": {
   "open": "Ouvrir l'organisation",
   "copyId": "Copier l'ID"
  },
  "toasts": {
   "copied": "ID de l'organisation copié.",
   "unitAdded": "Unité {{name}} ajoutée à l'arbre de travail.",
   "unitSaved": "Unité {{name}} enregistrée.",
   "unitRemoved": "Unité {{name}} retirée de l'arbre de travail.",
   "published": "La révision {{number}} est en service.",
   "drafted": "Révision {{number}} enregistrée comme brouillon.",
   "rolledBack": "Retour à la révision {{number}}. La révision {{live}} est en service.",
   "retired": "Organisation {{name}} retirée.",
   "reactivated": "Organisation {{name}} rétablie."
  },
  "errors": {
   "OneRoot": "Une organisation a exactement une unité racine, celle qui n'a pas de parent.",
   "ParentNotFound": "L'unité parente ne fait pas partie de cette organisation.",
   "Cycle": "Une unité ne peut pas se trouver sous elle-même ni sous l'une de ses propres unités.",
   "UnitNameTaken": "Une autre unité de cette organisation porte déjà ce nom.",
   "LeadsTwoUnits": "Cet agent dirige déjà une autre unité. Un agent dirige au plus une unité par organisation.",
   "PositionTaken": "Cet agent occupe déjà un poste dans l'organisation. Un agent est responsable ou membre d'une seule unité.",
   "PeerNotFound": "Une ligne transversale pointe vers une unité qui ne fait pas partie de cette organisation.",
   "BudgetPeriodTaken": "Une unité a un budget par période.",
   "BudgetInvalid": "Un budget doit être un montant positif en dollars américains.",
   "BudgetExceedsParent": "Le budget d'une unité ne peut pas dépasser celui de l'unité au-dessus.",
   "TooManyUnits": "L'organisation a déjà autant d'unités que le serveur l'autorise.",
   "TooManyMembers": "L'unité a déjà autant de membres que le serveur l'autorise.",
   "TooManyPeerLines": "L'unité a déjà autant de lignes transversales que le serveur l'autorise.",
   "UnitHasChildren": "Retirez ou déplacez d'abord les unités situées sous celle-ci.",
   "OrganizationRetired": "L'organisation est retirée. Rétablissez-la avant de la modifier.",
   "AgentInactive": "L'agent n'existe pas ou n'est pas actif.",
   "MandateMismatch": "Le gardien appartient à un autre agent. Choisissez un gardien de l'agent occupant ce poste.",
   "RevisionMismatch": "Cette révision appartient à une autre organisation.",
   "RevisionPublished": "Cette révision a déjà été publiée.",
   "RevisionNeverPublished": "On ne peut revenir qu'à une révision qui a déjà été en service.",
   "AlreadyLive": "Cette révision est déjà en service.",
   "NothingToRollBack": "Il n'existe aucune révision antérieure en service à laquelle revenir.",
   "StatusNotSettable": "Une organisation peut être retirée, ou rétablie après son retrait. La publication et les gels définissent les autres statuts.",
   "NameConflict": "Une autre organisation utilise déjà ce nom."
  },
  "spend": {
   "noBudget": "{{period}} : {{spent}} dépensés, aucun budget",
   "of": "{{period}} : {{spent}} sur {{amount}} ({{percent}})",
   "exhausted": "Budget épuisé"
  },
  "chart": {
   "lead": "Responsable",
   "noLead": "Aucun responsable",
   "members": "Membres ({{count}})",
   "peers": "Lignes transversales",
   "app": "Application",
   "collapse": "Replier les unités sous {{name}}",
   "expand": "Déplier les unités sous {{name}}",
   "addChild": "Ajouter une unité en dessous"
  },
  "unit": {
   "addTitle": "Ajouter une unité",
   "editTitle": "Modifier l'unité {{name}}",
   "add": "Ajouter l'unité",
   "saving": "Enregistrement...",
   "intro": "Les modifications vont dans l'arbre de travail. Rien n'entre en service tant que vous ne publiez pas une révision. Les noms comptent au plus {{max}} caractères.",
   "namePlaceholder": "facturation",
   "titlePlaceholder": "Responsable de la facturation",
   "noParent": "Aucune (l'unité racine)",
   "noLead": "Pas encore de responsable",
   "noMandate": "Aucun gardien",
   "noApp": "Aucune application",
   "noPeers": "Ajoutez d'abord une autre unité pour tracer une ligne transversale vers elle.",
   "noBudget": "Aucun budget",
   "addMember": "Ajouter un membre",
   "sections": {
    "lead": "Responsable",
    "members": "Membres et lignes transversales",
    "budgets": "Plafonds budgétaires"
   },
   "fields": {
    "name": "Nom",
    "parentUnitId": "Rattachée à",
    "description": "Description",
    "leadAgentId": "Agent responsable",
    "leadTitle": "Titre du responsable",
    "leadMandateId": "Gardien du responsable",
    "appId": "Application",
    "members": "Membres",
    "memberAgent": "Agent",
    "memberTitle": "Titre",
    "memberMandate": "Gardien",
    "peerUnitIds": "Lignes transversales",
    "budgetDay": "Budget quotidien (USD)",
    "budgetMonth": "Budget mensuel (USD)"
   },
   "errors": {
    "name": "Donnez à l'unité un nom de 1 à {{max}} caractères.",
    "description": "La description compte au plus {{max}} caractères.",
    "title": "Un titre compte au plus {{max}} caractères.",
    "memberAgent": "Choisissez un agent pour chaque membre, ou supprimez la ligne vide.",
    "duplicateAgent": "Un agent ne peut occuper qu'un seul poste dans l'unité.",
    "budget": "Saisissez un montant supérieur à zéro, ou laissez le champ vide pour ne fixer aucun budget."
   }
  },
  "form": {
   "errors": {
    "name": "Donnez à l'organisation un nom de 1 à {{max}} caractères.",
    "text": "Ce champ compte au plus {{max}} caractères."
   }
  },
  "diff": {
   "none": "Aucune différence. Les deux arbres sont identiques.",
   "empty": "(aucun)",
   "between": "De {{before}} à {{after}}.",
   "added": "Unités ajoutées ({{count}})",
   "removed": "Unités retirées ({{count}})",
   "changed": "Unités modifiées ({{count}})",
   "field": "Champ",
   "fields": {
    "name": "Nom",
    "description": "Description",
    "parent": "Rattachée à",
    "lead": "Responsable",
    "leadTitle": "Titre du responsable",
    "leadMandate": "Gardien du responsable",
    "app": "Application",
    "members": "Membres",
    "peers": "Lignes transversales",
    "budgets": "Plafonds budgétaires"
   },
   "title": "Révision {{number}} comparée à l'organisation en service",
   "pendingTitle": "Modifications non publiées",
   "nothingLive": "rien en service pour l'instant",
   "working": "l'arbre de travail"
  },
  "revisions": {
   "label": "Révision {{number}}",
   "rollbackOf": "(copie de la révision {{number}})"
  },
  "rollback": {
   "note": "Retour à la révision {{number}} depuis le tableau de bord."
  }
 },
 "views": {
  "organizationDetail": {
   "title": "Organisation",
   "heading": "Organisation {{name}}",
   "notFoundTitle": "Organisation introuvable",
   "notFoundBody": "Elle n'existe pas dans ce locataire, ou elle a été supprimée.",
   "live": "Mises à jour en direct",
   "editDetails": "Modifier les détails",
   "reactivate": "Rétablir",
   "retire": "Retirer",
   "publish": "Publier les modifications",
   "retiredBanner": "Cette organisation est retirée. Sa chaîne hiérarchique, ses lignes et ses budgets ne s'appliquent plus, et rien ne peut y changer tant que vous ne la rétablissez pas.",
   "pending": "L'arbre de travail contient des modifications non publiées : {{added}} ajoutées, {{changed}} modifiées, {{removed}} retirées.",
   "neverPublished": "Rien n'est encore en service. Publiez une révision pour mettre cette organisation au travail.",
   "reviewPending": "Examiner les modifications",
   "units": "Unités",
   "lastUpdate": "Dernière modification",
   "tabs": {
    "chart": "Organigramme",
    "budgets": "Budgets et dépenses",
    "revisions": "Révisions ({{count}})"
   },
   "chartView": "Quel arbre",
   "viewWorking": "Arbre de travail",
   "viewLive": "En service",
   "addUnit": "Ajouter une unité",
   "addRoot": "Ajouter l'unité racine",
   "workingNote": "L'arbre de travail est celui que vous modifiez. Publiez une révision pour le mettre en service.",
   "liveNote": "La révision en service : la chaîne hiérarchique, les lignes et les budgets suivent cet arbre.",
   "noUnitsTitle": "Aucune unité pour l'instant",
   "noUnitsBody": "Ajoutez l'unité racine, dirigée par l'agent au sommet, puis ajoutez des unités en dessous.",
   "budgetsNote": "Chaque budget plafonne ce que l'unité et toutes les unités en dessous peuvent dépenser sur un jour ou un mois UTC. Les dépenses comptent le coût connu des exécutions terminées sous la révision en service.",
   "noBudgetsTitle": "Aucun budget",
   "noBudgetsBody": "Modifiez une unité pour lui donner un budget quotidien ou mensuel.",
   "noSpend": "Aucune dépense enregistrée",
   "columns": {
    "unit": "Unité",
    "day": "Jour",
    "month": "Mois",
    "spend": "Dépenses",
    "number": "Révision",
    "state": "État",
    "note": "Note",
    "author": "Auteur",
    "created": "Créée",
    "published": "Publiée"
   },
   "noRevisionsTitle": "Aucune révision pour l'instant",
   "noRevisionsBody": "Publiez des modifications pour figer l'arbre de travail dans une révision.",
   "current": "En service",
   "compare": "Comparer avec la version en service",
   "publishRevision": "Publier",
   "rollback": "Revenir",
   "publishTitle": "Publier les modifications",
   "publishIntro": "La publication fige l'arbre de travail dans une nouvelle révision et la met en service, avec la révision actuelle de chaque gardien qu'il mentionne. Enregistrer comme brouillon conserve l'instantané sans le mettre en service.",
   "saveDraft": "Enregistrer comme brouillon",
   "publishNow": "Publier",
   "note": "Note",
   "diffNote": "Note : {{note}}",
   "removeUnitTitle": "Retirer l'unité",
   "confirmRemoveUnit": "Retirer l'unité {{name}} de l'arbre de travail ? Les lignes transversales qui pointent vers elle disparaissent aussi. L'organisation en service ne change pas tant que vous ne publiez pas.",
   "rollbackTitle": "Revenir à une révision",
   "confirmRollback": "Remettre la révision {{number}} en service à la place de la révision {{live}} ? L'arbre de travail et les gardiens qu'il mentionne reviennent à cette révision, et ce retour est enregistré comme une nouvelle révision.",
   "retireTitle": "Retirer l'organisation",
   "confirmRetire": "Retirer {{name}} ? Sa chaîne hiérarchique, ses lignes et ses budgets cessent de s'appliquer, et elle ne peut plus changer tant que vous ne la rétablissez pas.",
   "confirmDelete": "Supprimer {{name}} avec ses {{units}} unités et ses {{revisions}} révisions ? La mémoire enregistrée pour ses unités et pour l'organisation est supprimée aussi. Cette action est irréversible."
  }
 },
 "resources": {
  "organizations": {
   "title": "Organisations",
   "subtitle": "Arbres d'unités, chacune dirigée par un agent, avec membres, lignes transversales et budgets. Ouvrez-en une pour modifier son organigramme et le publier.",
   "add": "Créer une organisation",
   "create": "Créer une organisation",
   "edit": "Modifier l'organisation",
   "view": "Détails de l'organisation",
   "deleteTitle": "Supprimer l'organisation",
   "emptyTitle": "Aucune organisation pour l'instant",
   "emptyBody": "Créez une organisation, ajoutez une unité racine dirigée par l'agent au sommet, ajoutez des unités en dessous, puis publiez.",
   "columns": {
    "name": "Nom",
    "status": "Statut",
    "currentRevisionNumber": "Révision en service",
    "description": "Description",
    "createdUtc": "Créée",
    "mission": "Mission",
    "id": "ID"
   },
   "fields": {
    "name": "Nom",
    "description": "Description",
    "mission": "Mission"
   },
   "hints": {
    "name": "1 à {{max}} caractères, unique dans le locataire.",
    "description": "Facultatif, au plus {{max}} caractères.",
    "mission": "La raison d'être de l'organisation, en termes simples. Facultatif, au plus {{max}} caractères."
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
})(fr, {
 "common": {
  "fieldCodes": {
   "OneRoot": "L'organisation a déjà une unité racine. Choisissez une unité parente pour cette unité.",
   "UnitNameTaken": "L'organisation a déjà une unité portant ce nom.",
   "UnitNotFound": "L'organisation n'a aucune unité portant ce nom.",
   "UnitHasChildren": "Retirez d'abord les unités situées sous celle-ci.",
   "NoSuchPeerLine": "Ces deux unités n'ont pas de ligne transversale.",
   "OrganizationDeleted": "Le brouillon supprime cette organisation. Rétablissez-la d'abord.",
   "PeerNotFound": "Une unité ne peut pas avoir de ligne transversale vers elle-même."
  }
 },
 "components": {
  "studio": {
   "canvas": {
    "view": {
     "label": "Ce que montre le canevas",
     "apps": "Applications",
     "organizations": "Organisations"
    },
    "operations": {
     "AddUnit": "Ajout d'une unité",
     "RemoveUnit": "Retrait d'une unité",
     "AddUnitMember": "Ajout d'un membre",
     "RemoveUnitMember": "Retrait d'un membre",
     "ConnectUnits": "Ajout d'une ligne transversale",
     "DisconnectUnits": "Retrait d'une ligne transversale"
    },
    "org": {
     "none": "Le brouillon ne contient encore aucune organisation. Saisissez un nom d'organisation et un nom d'unité ci-dessus pour en commencer une ; sa première unité est la racine.",
     "flowLabel": "Organisation {{organization}}",
     "picker": "Organisation",
     "units": "Unités",
     "root": "Unité racine",
     "peers": "Lignes transversales",
     "orgTitle": "Organisation {{name}}",
     "orgHint": "Sélectionnez une unité pour modifier ses membres et ses lignes transversales. Les unités se trouvent à l'intérieur de l'unité à laquelle elles sont rattachées.",
     "deleted": "Le brouillon supprime cette organisation. Ses unités ne peuvent pas changer tant qu'elle n'est pas rétablie.",
     "unitTitle": "Unité {{name}}",
     "reportsTo": "Rattachée à",
     "lead": "Responsable",
     "members": "Membres ({{count}})",
     "noMembers": "Aucun membre en dehors du responsable.",
     "memberAgent": "Agent",
     "memberTitle": "Titre (facultatif)",
     "addMember": "Ajouter un membre",
     "removeMember": "Retirer",
     "noPeers": "Aucune ligne transversale.",
     "disconnect": "Déconnecter",
     "addChild": "Ajouter une unité en dessous",
     "startPeer": "Commencer une ligne transversale",
     "removeUnit": "Retirer l'unité",
     "peerTitle": "Ligne transversale {{from}} et {{to}}",
     "peerHint": "{{from}} et {{to}} peuvent s'envoyer des messages directement, sans passer par un responsable commun.",
     "peerList": "Lignes transversales ({{total}})",
     "noPeerLines": "Aucune ligne transversale pour l'instant. Sélectionnez une unité et commencez-en une, ou faites glisser depuis la poignée droite d'une unité vers une autre unité.",
     "removeTitle": "Retirer l'unité",
     "removeMessage": "Retirer l'unité {{name}} de l'organisation {{organization}} dans ce brouillon ? Les lignes transversales qui la mentionnent partent aussi. Une unité ayant des unités en dessous ne peut pas être retirée.",
     "toolbar": {
      "label": "Outils d'organisation",
      "addUnit": "Ajouter une unité",
      "unitPlaceholder": "Nom de l'unité",
      "parent": "Rattachée à",
      "noParent": "Aucun parent (racine)",
      "under": "Sous {{name}}",
      "lead": "Agent responsable",
      "leadPlaceholder": "Agent responsable (facultatif)",
      "leadTitle": "Titre du responsable (facultatif)",
      "organization": "Organisation",
      "add": "Ajouter"
     },
     "connectBar": {
      "message": "Tracé d'une ligne transversale depuis {{name}}."
     },
     "keys": {
      "tab": "Tab parcourt les unités, chaque unité avant les unités situées en dessous.",
      "select": "Entrée ou Espace sélectionne l'unité qui a le focus et ouvre ses propriétés.",
      "peer": "C sur une unité commence une ligne transversale depuis celle-ci ; C ou Entrée sur une autre unité la termine.",
      "remove": "Suppr retire l'unité qui a le focus, après confirmation.",
      "add": "N mène au champ Ajouter une unité.",
      "peers": "Dans la liste des lignes transversales, Entrée sélectionne une ligne et Suppr la retire.",
      "escape": "Échap annule une ligne transversale que vous avez commencée."
     },
     "node": {
      "root": "Racine",
      "reportsTo": "rattachée à {{name}}",
      "lead": "Responsable : {{name}}",
      "noLead": "Aucun responsable",
      "members": "membres {{list}}"
     },
     "summary": {
      "none": "Il n'y a aucune organisation à décrire.",
      "units_one": "L'organisation {{organization}} a {{count}} unité.",
      "units_other": "L'organisation {{organization}} a {{count}} unités.",
      "root": "L'unité racine est {{name}}.",
      "peerCount_one": "Il y a {{count}} ligne transversale.",
      "peerCount_other": "Il y a {{count}} lignes transversales.",
      "unitRoot": "{{name}} est l'unité racine et {{lead}}.",
      "unitChild": "{{name}} est rattachée à {{parent}} et {{lead}}.",
      "ledBy": "est dirigée par {{name}}",
      "noLead": "n'a pas de responsable",
      "peer": "{{from}} et {{to}} ont une ligne transversale."
     },
     "a11y": {
      "unit": "Appuyez sur Entrée ou Espace pour sélectionner cette unité. Appuyez sur C pour commencer une ligne transversale, ou sur Suppr pour retirer l'unité.",
      "peer": "Une ligne transversale entre deux unités.",
      "handle": "Faites glisser vers une autre unité pour tracer une ligne transversale"
     },
     "announce": {
      "added": "Unité {{name}} ajoutée à {{organization}}.",
      "peerStart": "Tracé d'une ligne transversale depuis {{name}}. Allez sur l'autre unité et appuyez sur Entrée, ou appuyez sur Échap pour annuler.",
      "connected": "{{from}} et {{to}} ont maintenant une ligne transversale.",
      "disconnected": "{{from}} et {{to}} n'ont plus de ligne transversale.",
      "memberAdded": "{{name}} ajouté à l'unité {{unit}}.",
      "memberRemoved": "{{name}} retiré de l'unité {{unit}}.",
      "removed": "Unité {{name}} retirée de {{organization}}."
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
})(fr, {
 "nav": {
  "items": {
   "changeRules": {
    "label": "Règles de changement",
    "tip": "Changements courants que les agents de direction peuvent faire dans leur sous-arbre sans demander"
   }
  }
 },
 "enums": {
  "resourceType": {
   "ChangeRule": "Règle de changement"
  },
  "notificationEvent": {
   "OrgProposalApplied": "Proposition d'organisation appliquée"
  },
  "managementAccess": {
   "None": "Aucun",
   "Drafts": "Brouillons Studio",
   "OrgSubtree": "Direction de son sous-arbre"
  },
  "changeClass": {
   "PromptRetune": "Réglage des prompts",
   "WakeTuning": "Réglage du réveil",
   "MandateTextEdit": "Modification du texte d'un gardien",
   "AddWorker": "Ajout d'un membre",
   "RemoveWorker": "Retrait d'un membre",
   "ModelChange": "Changement de modèle",
   "DeploymentWeight": "Poids du déploiement"
  }
 },
 "errorCodes": {
  "RulesArePeopleOnly": "Seules des personnes écrivent les règles de changement. Un agent ne peut ni en créer, ni en modifier, ni en supprimer.",
  "ProposalNotPending": "Cette proposition n'attend plus de décision. Rouvrez-la pour voir où elle en est.",
  "ApproverIsAgent": "Un agent ne peut pas décider d'une proposition. Une personne doit le faire."
 },
 "changeRules": {
  "actions": {
   "openOrganization": "Ouvrir l'organisation",
   "copyId": "Copier l'ID"
  },
  "toasts": {
   "copied": "ID de la règle de changement copié."
  },
  "status": {
   "Active": "En vigueur",
   "Inactive": "Désactivée",
   "Expired": "Expirée"
  },
  "limit": {
   "text": "{{class}}, {{name}} : {{range}}",
   "between": "de {{min}} à {{max}}",
   "atMost": "au plus {{max}}",
   "atLeast": "au moins {{min}}",
   "any": "sans borne"
  },
  "limitNames": {
   "count": "Changements par proposition",
   "minIntervalSeconds": "Intervalle de réveil le plus court (secondes)",
   "maxIntervalSeconds": "Intervalle de réveil le plus long (secondes)",
   "backoffFactor": "Facteur d'espacement",
   "jitterPercent": "Jitter (pourcentage)",
   "weight": "Poids du trafic"
  },
  "errors": {
   "UnknownLimit": "Cette classe n'a pas de limite de ce nom. Choisissez-en une dans la liste.",
   "ClassNotInRule": "Une limite doit porter sur une classe que la règle cite. Ajoutez la classe ou modifiez la limite.",
   "UnitNotFound": "Cette unité ne figure pas dans l'organigramme actuel de cette organisation.",
   "Duplicate": "Chaque classe et chaque limite ne peuvent apparaître qu'une fois.",
   "BoundRequired": "Donnez à la limite un minimum, un maximum, ou les deux.",
   "MinimumAboveMaximum": "Le minimum est supérieur au maximum.",
   "NegativeBound": "Les limites valent zéro ou plus.",
   "ExpiryInPast": "Choisissez une expiration dans le futur, ou laissez le champ vide pour que la règle n'expire jamais.",
   "OrganizationNotFound": "Cette organisation n'existe pas dans ce tenant.",
   "OrganizationNotSettable": "Une règle reste attachée à son organisation. Créez une nouvelle règle pour une autre organisation.",
   "TooMany": "Une règle contient au plus {{max}} limites."
  },
  "form": {
   "errors": {
    "name": "Donnez à la règle un nom de 1 à {{max}} caractères.",
    "description": "La description contient au plus {{max}} caractères.",
    "organization": "Choisissez l'organisation à laquelle s'applique la règle.",
    "unit": "Choisissez une unité de cette organisation.",
    "classes": "Choisissez au moins une classe de changement."
   }
  }
 },
 "orgProposals": {
  "title": "Propositions",
  "note": "Les agents de direction proposent des changements aux unités qu'ils dirigent. Une proposition s'applique aussitôt quand des règles de changement couvrent chacun de ses changements. Tout le reste attend ici une personne.",
  "rulesLink": "Règles de changement",
  "views": {
   "label": "Quelles propositions",
   "all": "Toutes",
   "needsApproval": "En attente d'approbation",
   "needsApprovalCount": "En attente d'approbation ({{count}})",
   "applied": "Appliquées"
  },
  "emptyTitle": "Aucune proposition ici",
  "emptyBody": "Quand un agent de direction propose un changement aux unités placées sous lui, la proposition apparaît ici.",
  "columns": {
   "title": "Proposition",
   "unit": "Unité",
   "agent": "Agent de direction",
   "decision": "Décision",
   "updated": "Dernière modification"
  },
  "decision": {
   "rule": "Appliquée par règle",
   "approved": "Approuvée",
   "needsApproval": "En attente d'approbation",
   "denied": "Refusée",
   "lapsed": "Caduque",
   "drafting": "En cours de rédaction"
  },
  "byRules": "Règles : {{names}}",
  "byPerson": "Par {{name}}",
  "decide": "Examiner et décider",
  "toasts": {
   "approved": "{{title}} approuvée. Elle est active maintenant.",
   "denied": "{{title}} refusée. Elle est retournée à l'agent de direction."
  },
  "review": {
   "open": "Examiner",
   "title": "Proposition : {{title}}",
   "run": "Proposée dans l'exécution",
   "approve": "Approuver",
   "deny": "Refuser",
   "appliedByRule": "Appliquée aussitôt, car des règles de changement couvraient chaque changement. Règles : {{names}}.",
   "approvedBy": "Approuvée par {{name}}.",
   "deniedBy": "Refusée par {{name}}.",
   "reasonGiven": "Motif : {{reason}}",
   "revision": "Enregistrée comme révision {{number}} de l'organisation. Annulez cette révision pour revenir en arrière.",
   "appliedNoDiff": "Cette proposition est appliquée : ses changements font partie de la configuration actuelle. Comparez la révision sous laquelle elle a été enregistrée pour les voir.",
   "covered": "Des règles de changement couvrent chaque changement ci-dessous : cette proposition s'applique donc sans intervention d'une personne.",
   "notCovered": "Au moins un changement ci-dessous n'est couvert par aucune règle de changement : une personne décide donc.",
   "refusals": "Des limites strictes refusent ces changements. Aucune règle ni approbation ne peut les lever :",
   "noChanges": "La proposition ne contient aucun changement.",
   "columns": {
    "item": "Changement",
    "change": "Type",
    "rule": "Couvert par"
   },
   "coveredBy": "Règle {{name}}",
   "reason": "Motif",
   "reasonPlaceholder": "Facultatif. L'agent de direction le verra."
  }
 },
 "views": {
  "organizationDetail": {
   "tabs": {
    "proposals": "Propositions ({{count}})"
   },
   "appliedProposal": "Proposition appliquée"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "managementAccess": "Accès de gestion"
   },
   "hints": {
    "managementAccess": "La plupart des agents ont besoin de Aucun. Brouillons Studio permet aux exécutions de préparer des changements Studio pour la personne qui les a lancées. Direction de son sous-arbre permet à l'agent qui dirige une unité organisationnelle de proposer des changements aux unités placées sous elle."
   }
  },
  "changeRules": {
   "title": "Règles de changement",
   "subtitle": "Changements courants que les agents de direction peuvent faire dans leur sous-arbre sans attendre une personne. Ce qu'aucune règle ne couvre demande toujours une approbation.",
   "add": "Ajouter une règle",
   "create": "Ajouter une règle de changement",
   "edit": "Modifier la règle de changement",
   "view": "Règle de changement",
   "deleteTitle": "Supprimer la règle de changement",
   "emptyTitle": "Aucune règle de changement pour l'instant",
   "emptyBody": "Ajoutez une règle pour que les agents de direction appliquent des changements courants, comme le réglage du réveil, sans attendre d'approbation.",
   "noLimits": "Aucune limite",
   "noExpiry": "Jamais",
   "chooseOrganization": "Choisir une organisation",
   "chooseUnit": "Choisir une unité",
   "addLimit": "Ajouter une limite",
   "filters": {
    "activeOnly": "Statut",
    "inForce": "En vigueur uniquement"
   },
   "columns": {
    "name": "Nom",
    "status": "Statut",
    "organization": "Organisation",
    "unit": "Couvre",
    "classes": "Classes autorisées",
    "limits": "Limites",
    "expiresUtc": "Expire le",
    "createdByName": "Créée par",
    "description": "Descriptif",
    "createdUtc": "Créée le",
    "id": "ID"
   },
   "fields": {
    "organizationId": "Organisation",
    "unitId": "Unité (avec les unités placées sous elle)",
    "name": "Nom",
    "description": "Descriptif",
    "classes": "Classes de changement",
    "limits": "Limites",
    "limitClass": "Classe",
    "limitName": "Limite",
    "minimum": "Valeur minimale",
    "maximum": "Valeur maximale",
    "active": "En vigueur",
    "expiresUtc": "Expire le"
   },
   "hints": {
    "organizationId": "Obligatoire. Une règle reste attachée à son organisation.",
    "unitId": "Obligatoire. La règle couvre les changements de cette unité et de chaque unité placée sous elle.",
    "name": "De 1 à {{max}} caractères.",
    "description": "Facultatif, au plus {{max}} caractères.",
    "classes": "Obligatoire. Une proposition s'applique par règle seulement si chacun de ses changements appartient à une classe qu'une règle autorise.",
    "limits": "Facultatif, au plus {{max}}. Changements par proposition plafonne le nombre de changements d'une classe qu'une proposition peut contenir ; les autres limites encadrent les nouvelles valeurs.",
    "expiresUtc": "Facultatif. La règle cesse de s'appliquer à ce moment."
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
})(fr, {
 "nav": {
  "items": {
   "evaluations": {
    "label": "Jeux d'évaluation",
    "tip": "Ensembles versionnés de cas qui notent les agents avant leur mise en service"
   },
   "evalRuns": {
    "label": "Exécutions d'évaluation",
    "tip": "Exécutions d'un jeu d'évaluation sur un déploiement ou une révision d'agent"
   },
   "shadowTrials": {
    "label": "Essais fantômes",
    "tip": "Un déploiement candidat rejoue des entrées réelles sans agir"
   },
   "canaryReleases": {
    "label": "Diffusions canari",
    "tip": "Un déploiement candidat reçoit par étapes une part croissante du trafic"
   }
  }
 },
 "enums": {
  "resourceType": {
   "EvalSet": "Jeu d'évaluation",
   "EvalRun": "Exécution d'évaluation",
   "ShadowTrial": "Essai fantôme",
   "CanaryRelease": "Diffusion canari"
  },
  "notificationEvent": {
   "CanaryRolledBack": "Diffusion canari revenue en arrière"
  },
  "runKind": {
   "Eval": "Cas d'évaluation",
   "Shadow": "Copie fantôme"
  },
  "evalSetState": {
   "Draft": "Brouillon",
   "Approved": "Approuvé"
  },
  "evalSetOrigin": {
   "Human": "Écrit par une personne",
   "Evaluator": "Écrit par un agent",
   "Playground": "Issu du bac à sable"
  },
  "evalScorer": {
   "ExactMatch": "Correspondance exacte",
   "Contains": "Contient",
   "JsonSchemaValid": "JSON Schema valide",
   "Judge": "Agent juge"
  },
  "evalRunStatus": {
   "Pending": "En attente",
   "Running": "En cours",
   "Completed": "Terminée",
   "Failed": "Échouée",
   "Cancelled": "Annulée"
  },
  "evalRunTarget": {
   "AgentRevision": "Révision d'agent",
   "Deployment": "Déploiement"
  },
  "evalRunInputMode": {
   "Cases": "Les cas du jeu",
   "RecentInputs": "Entrées récentes"
  },
  "shadowTrialStatus": {
   "Running": "En cours",
   "Completed": "Terminé",
   "Stopped": "Arrêté",
   "Failed": "Échoué"
  },
  "canaryStatus": {
   "Running": "En cours",
   "Promoted": "Promue",
   "RolledBack": "Revenue en arrière",
   "Aborted": "Interrompue"
  }
 },
 "errorCodes": {
  "EvalSetExists": "Un jeu d'évaluation porte déjà ce nom. Ouvrez-le et modifiez-le pour créer sa version suivante.",
  "AlreadyApproved": "Cette version est déjà approuvée.",
  "EvalSetEmpty": "Ce jeu d'évaluation n'a encore aucun cas. Ajoutez d'abord un cas.",
  "EvalSetImmutable": "Cette version est approuvée et reste telle quelle. Modifiez-la pour ouvrir la version suivante, ou supprimez plutôt une version brouillon.",
  "ApprovalIsPeopleOnly": "Seule une personne peut approuver un jeu d'évaluation. Un agent ne peut pas approuver le jeu qui le note.",
  "EvalRunFinished": "Cette exécution d'évaluation est déjà terminée.",
  "ShadowTrialAlreadyRunning": "Ce candidat suit déjà ce déploiement dans un autre essai.",
  "ShadowTrialNotRunning": "Cet essai fantôme n'est plus en cours.",
  "CanaryAlreadyRunning": "L'un de ces déploiements fait déjà partie d'une diffusion canari en cours.",
  "CanaryNotRunning": "Cette diffusion canari n'est plus en cours.",
  "EvalGateFailed": "La promotion exige une exécution d'évaluation réussie de cette révision avec le jeu d'évaluation approuvé de l'environnement, et il n'y en a pas encore.",
  "PeopleOnly": "Seules les personnes et les identifiants d'API peuvent faire cela. Un jeton d'exécution ne le peut pas."
 },
 "evals": {
  "versionShort": "v{{version}}",
  "setVersion": "{{name}} v{{version}}",
  "percent": "{{value}}%",
  "progress": "{{completed}} cas sur {{total}}, {{passed}} réussis",
  "noJudge": "Aucun juge",
  "noSet": "Aucun",
  "untilStopped": "Jusqu'à l'arrêt",
  "verdict": {
   "passed": "Réussie",
   "failed": "Sous le seuil",
   "none": "Aucun verdict"
  },
  "outcome": {
   "passed": "Réussi",
   "failed": "Échoué",
   "errored": "En erreur"
  },
  "target": {
   "deployment": "Déploiement {{name}}",
   "revision": "Agent {{agent}}, révision {{revision}}"
  },
  "actions": {
   "runSet": "Exécuter le jeu",
   "openSet": "Ouvrir le jeu",
   "cancelRun": "Annuler l'exécution",
   "stopTrial": "Arrêter l'essai",
   "abortCanary": "Interrompre la diffusion",
   "copyId": "Copier l'ID"
  },
  "toasts": {
   "copied": "ID copié.",
   "approved": "{{name}} v{{version}} approuvé. Il peut désormais conditionner les promotions.",
   "caseSaved": "Cas enregistré.",
   "caseSavedNextVersion": "Cas enregistré dans la version {{version}}, un nouveau brouillon.",
   "caseSavedTo": "Cas enregistré dans {{name}}.",
   "caseRemoved": "Cas retiré.",
   "caseRemovedNextVersion": "Cas retiré de la version {{version}}, un nouveau brouillon.",
   "setSavedNextVersion": "Enregistré comme version {{version}}, un nouveau brouillon.",
   "runStarted": "Exécution d'évaluation de {{name}} lancée.",
   "runCancelled": "Exécution d'évaluation annulée.",
   "trialStopped": "Essai fantôme arrêté.",
   "canaryAborted": "Diffusion canari interrompue. Les poids initiaux sont rétablis."
  },
  "reason": {
   "label": "Motif",
   "placeholder": "Facultatif. Il est conservé avec l'enregistrement et dans le journal d'audit."
  },
  "form": {
   "errors": {
    "name": "Donnez au jeu un nom de 1 à {{max}} caractères.",
    "description": "La description compte au plus {{max}} caractères.",
    "judgeAgent": "Le nom de l'agent juge compte au plus {{max}} caractères.",
    "tags": "Chaque étiquette compte au plus {{max}} caractères."
   }
  },
  "set": {
   "nextVersion": "Cette version est approuvée : l'enregistrement crée donc la version {{version}} en brouillon. Cette version reste telle quelle."
  },
  "case": {
   "addTitle": "Ajouter un cas à {{name}}",
   "editTitle": "Modifier le cas {{number}}",
   "save": "Enregistrer le cas",
   "nextVersion": "Cette version est approuvée : la modification va donc dans la version {{version}}, un nouveau brouillon. Cette version reste telle quelle.",
   "fromRun": "Enregistré depuis l'exécution {{id}}.",
   "fields": {
    "name": "Nom",
    "inputText": "Entrée",
    "expectedText": "Sortie attendue",
    "hidden": "Masqué aux agents notés",
    "checks": "Contrôles"
   },
   "placeholders": {
    "name": "Facultatif, par exemple remboursement au-delà de la limite",
    "inputText": "Le message que reçoit l'agent",
    "expectedText": "Ce que dit une bonne réponse"
   },
   "hints": {
    "name": "Facultatif, au plus {{max}} caractères.",
    "inputText": "Obligatoire. Le cas envoie ce texte à l'agent comme entrée.",
    "expectedText": "Facultatif. Les contrôles Correspondance exacte et Contient s'y comparent quand ils n'ont pas de texte propre ; le juge la lit comme réponse de référence.",
    "hidden": "Les exécutions d'un agent ne voient que la note d'un cas masqué, jamais son entrée ni sa sortie attendue, pour qu'il ne puisse pas apprendre les réponses."
   },
   "checks": {
    "scorer": "Notation",
    "weight": "Poids",
    "add": "Ajouter un contrôle",
    "remove": "Retirer le contrôle {{number}}",
    "none": "Aucun contrôle. Le cas est noté par correspondance exacte avec la sortie attendue, ou par l'agent juge s'il n'y a pas de sortie attendue."
   },
   "scorerHints": {
    "ExactMatch": "Réussit quand la sortie est égale au texte, sans tenir compte des espaces autour.",
    "Contains": "Réussit quand la sortie contient le texte.",
    "JsonSchemaValid": "Réussit quand la sortie est du JSON conforme au schéma.",
    "Judge": "L'agent juge du jeu note la sortie selon la grille et la sortie attendue."
   },
   "argumentLabels": {
    "ExactMatch": "Texte exact",
    "Contains": "Texte à trouver",
    "JsonSchemaValid": "JSON Schema",
    "Judge": "Grille d'évaluation"
   },
   "argumentPlaceholders": {
    "ExactMatch": "Vide : utilise la sortie attendue",
    "Contains": "Vide : utilise la sortie attendue",
    "JsonSchemaValid": "{\"type\": \"object\", \"required\": [\"answer\"]}",
    "Judge": "Facultatif. Ce qu'une bonne réponse doit faire"
   },
   "errors": {
    "input": "Un cas a besoin d'un texte d'entrée.",
    "name": "Le nom compte au plus {{max}} caractères.",
    "weight": "Un poids va de 0 à {{max}}.",
    "schema": "Saisissez ici un objet JSON Schema.",
    "argument": "Indiquez le texte ou remplissez la sortie attendue du cas."
   }
  },
  "run": {
   "title": "Exécuter un jeu d'évaluation",
   "titleFor": "Exécuter {{name}} v{{version}}",
   "intro": "Chaque cas s'exécute comme sa propre exécution d'évaluation. Les exécutions sur une révision d'agent utilisent un déploiement temporaire et laissent le trafic réel intact.",
   "start": "Lancer l'exécution",
   "starting": "Lancement...",
   "setOption": "{{name}} v{{version}}",
   "chooseDeployment": "Choisir un déploiement",
   "chooseAgent": "Choisir un agent",
   "fields": {
    "setId": "Jeu d'évaluation",
    "targetType": "Évaluer",
    "deploymentId": "Déploiement",
    "agentId": "Agent",
    "agentRevisionId": "Révision",
    "inputMode": "Entrées",
    "recentInputCount": "Entrées récentes à rejouer",
    "thresholdPercent": "Seuil de réussite (pourcentage)",
    "budgetUsd": "Budget (USD)"
   },
   "hints": {
    "setId": "La version la plus récente de chaque jeu est proposée.",
    "targetType": "Un déploiement tel qu'il fonctionne aujourd'hui, ou une révision d'agent comme le brouillon qu'exécute le bac à sable de l'atelier.",
    "agentId": "Obligatoire. Sans révision, c'est la révision brouillon de l'agent qui s'exécute, ou sa dernière révision publiée.",
    "agentRevisionId": "Facultatif. Un ID de révision d'agent ; vide exécute la révision brouillon.",
    "inputMode": "Les cas du jeu, ou les dernières entrées réussies du déploiement notées par l'agent juge.",
    "recentInputCount": "De 1 à {{max}}.",
    "thresholdPercent": "Facultatif, de 0 à 100. L'exécution réussit quand sa note pondérée l'atteint.",
    "budgetUsd": "Facultatif. Quand les exécutions des cas et du juge ont dépensé ce montant, les cas restants sont ignorés et l'exécution échoue."
   },
   "errors": {
    "set": "Choisissez le jeu d'évaluation à exécuter.",
    "deployment": "Choisissez le déploiement à évaluer.",
    "agent": "Choisissez l'agent à évaluer.",
    "threshold": "Un seuil va de 0 à 100 pour cent.",
    "budget": "Un budget va de 0 à {{max}} USD.",
    "recentInputs": "Rejouez de 1 à {{max}} entrées récentes."
   }
  },
  "save": {
   "open": "Enregistrer comme cas d'évaluation",
   "title": "Enregistrer comme cas d'évaluation",
   "intro": "L'entrée du tour et la réponse de l'agent deviennent un cas. Modifiez la sortie attendue pour qu'elle décrive une bonne réponse, et pas seulement ce que celle-ci a dit.",
   "set": "Jeu d'évaluation",
   "newSet": "Nouveau jeu d'évaluation...",
   "newSetName": "Nom du nouveau jeu",
   "newSetHint": "Le nouveau jeu commence en brouillon avec l'origine Issu du bac à sable.",
   "submit": "Enregistrer le cas",
   "done": "Terminé",
   "openSet": "Ouvrir le jeu",
   "runSet": "Exécuter le jeu",
   "entryAgent": "l'agent d'entrée",
   "saved": "Cas enregistré dans {{name}} v{{version}}.",
   "runHint": "Exécuter le jeu évalue la révision brouillon de {{agent}}, celle que ce bac à sable a exécutée.",
   "errors": {
    "set": "Choisissez un jeu d'évaluation ou créez-en un nouveau."
   }
  },
  "setDetail": {
   "title": "Jeu d'évaluation",
   "back": "Tous les jeux d'évaluation",
   "notFoundTitle": "Jeu d'évaluation introuvable",
   "notFoundBody": "C'était peut-être un brouillon que quelqu'un a supprimé. Les versions approuvées sont toujours conservées.",
   "approve": "Approuver",
   "approveTitle": "Approuver {{name}} v{{version}}",
   "approveMessage": "Une version approuvée est conservée exactement telle quelle et peut conditionner les promotions et les diffusions canari. Les modifications ultérieures créent la version suivante en brouillon.",
   "approvedNote": "Cette version est approuvée et reste telle quelle. Modifier le jeu ou un cas crée la version {{version}} en brouillon.",
   "approvedByAt": "{{name}}, {{when}}",
   "needsJudge": "Certains cas sont notés par l'agent juge, mais ce jeu n'en a pas. Modifiez le jeu et choisissez un agent juge avant de l'exécuter.",
   "editTitle": "Modifier {{name}}",
   "deleteTitle": "Supprimer la version brouillon",
   "deleteMessage": "Supprimer {{name}} v{{version}} ? Les versions approuvées ne sont pas concernées.",
   "cases": "Cas ({{count}})",
   "addCase": "Ajouter un cas",
   "noCases": "Aucun cas pour l'instant. Ajoutez-en un ici, ou enregistrez un tour depuis le bac à sable de l'atelier.",
   "noExpected": "Aucune",
   "hidden": "Masqué",
   "removeCaseTitle": "Retirer le cas {{number}}",
   "removeCaseMessage": "Retirer ce cas du brouillon ?",
   "removeCaseApproved": "Cette version est approuvée : le cas est donc retiré de la version {{version}}, un nouveau brouillon. Cette version le conserve.",
   "versions": "Versions",
   "thisVersion": "v{{version}} (celle-ci)",
   "runs": "Exécutions d'évaluation récentes",
   "allRuns": "Toutes les exécutions de cette version",
   "noRuns": "Cette version n'a pas encore été exécutée.",
   "fields": {
    "state": "État",
    "origin": "Origine",
    "judgeAgent": "Agent juge",
    "tags": "Étiquettes",
    "authoredBy": "Écrit par",
    "approvedBy": "Approuvé par",
    "previousVersion": "Version précédente",
    "lastUpdateUtc": "Dernière modification",
    "description": "Description"
   },
   "columns": {
    "order": "#",
    "name": "Nom",
    "input": "Entrée",
    "expected": "Sortie attendue",
    "scorers": "Noté par",
    "hidden": "Masqué",
    "source": "Depuis l'exécution"
   },
   "versionColumns": {
    "version": "Version",
    "state": "État",
    "caseCount": "Cas",
    "approvedBy": "Approuvé par",
    "lastUpdateUtc": "Dernière modification"
   },
   "runColumns": {
    "run": "Exécution d'évaluation",
    "status": "Statut",
    "verdict": "Verdict",
    "score": "Note",
    "target": "Évalué",
    "createdUtc": "Lancée"
   }
  },
  "runDetail": {
   "title": "Exécution d'évaluation",
   "back": "Toutes les exécutions d'évaluation",
   "notFoundTitle": "Exécution d'évaluation introuvable",
   "notFoundBody": "Vérifiez l'ID, ou ouvrez l'exécution depuis son jeu d'évaluation.",
   "live": "En direct",
   "polling": "Interrogation",
   "failure": "L'exécution a échoué : {{reason}}",
   "progressLabel": "Cas terminés",
   "kpi": {
    "score": "Note",
    "threshold": "Seuil {{threshold}}",
    "noThreshold": "Aucun seuil",
    "passed": "Cas réussis",
    "errored": "Cas en erreur",
    "cost": "Coût",
    "budget": "Budget {{budget}}",
    "noBudget": "Aucun budget"
   },
   "fields": {
    "target": "Évalué",
    "targetType": "Cible",
    "inputMode": "Entrées",
    "startedBy": "Lancée par",
    "createdUtc": "Lancée",
    "completedUtc": "Terminée",
    "studioDraftId": "Brouillon d'atelier"
   },
   "recentInputs": "{{count}} entrées récentes",
   "results": "Résultats des cas ({{count}})",
   "failingOnly": "Échecs uniquement ({{count}})",
   "noFailing": "Tous les cas ont réussi.",
   "noResults": "Cette exécution n'a enregistré aucun résultat de cas.",
   "waiting": "En attente de la fin du premier cas.",
   "caseNumber": "Cas {{number}}",
   "recentInput": "Entrée récente {{number}}",
   "checksPassed": "{{passed}} sur {{total}} réussis",
   "open": "Ouvrir",
   "columns": {
    "order": "#",
    "case": "Cas",
    "outcome": "Résultat",
    "score": "Note",
    "checks": "Contrôles",
    "output": "Sortie"
   },
   "resultTitle": "Cas {{number}}",
   "resultTitleNamed": "Cas {{number}} : {{name}}",
   "scoreIs": "Note {{score}}",
   "openCaseRun": "Ouvrir l'exécution du cas",
   "openSourceRun": "Ouvrir l'exécution source",
   "hiddenCase": "Ce cas est masqué aux agents notés.",
   "input": "Entrée",
   "diff": "Sortie attendue comparée à la sortie",
   "expected": "Attendu",
   "output": "Sortie",
   "noOutput": "Aucune sortie.",
   "checks": "Contrôles",
   "noChecks": "Aucun contrôle n'a été noté.",
   "checkColumns": {
    "scorer": "Notation",
    "weight": "Poids",
    "score": "Note",
    "outcome": "Résultat",
    "note": "Remarque de la notation",
    "judgeRun": "Exécution du juge"
   },
   "cancelTitle": "Annuler l'exécution d'évaluation",
   "cancelMessage": "Annuler cette exécution de {{name}} ? Les cas non terminés sont annulés avec elle."
  },
  "shadow": {
   "errors": {
    "name": "Le nom compte au plus {{max}} caractères.",
    "source": "Choisissez le déploiement dont les exécutions sont copiées.",
    "candidate": "Choisissez le déploiement candidat.",
    "same": "Le candidat doit être un déploiement différent de la source.",
    "sample": "Échantillonnez de 1 à 100 pour cent des exécutions.",
    "ends": "Choisissez une fin dans le futur, ou laissez vide pour continuer jusqu'à l'arrêt."
   }
  },
  "shadowDetail": {
   "title": "Essai fantôme",
   "back": "Tous les essais fantômes",
   "notFoundTitle": "Essai fantôme introuvable",
   "notFoundBody": "Vérifiez l'ID, ou ouvrez l'essai depuis la liste.",
   "note": "Les exécutions fantômes rejouent les entrées de la source sur le candidat. Elles ne peuvent pas utiliser d'outils à effet, envoyer de messages, écrire en mémoire ni déposer de rapports, et les exécutions de la source ne sont pas touchées.",
   "stopReason": "Arrêté : {{reason}}",
   "stopTitle": "Arrêter l'essai fantôme",
   "stopMessage": "Arrêter {{name}} ? Plus aucune exécution n'est copiée ; les décomptes actuels sont conservés.",
   "kpi": {
    "compared": "Comparées",
    "agreed": "Concordantes",
    "diverged": "Divergentes",
    "failures": "Échecs du candidat",
    "agreement": "Concordance"
   },
   "comparison": {
    "text": "Texte normalisé",
    "set": "Avec un jeu d'évaluation",
    "judge": "Par l'agent juge"
   },
   "fields": {
    "source": "Source",
    "candidate": "Candidat",
    "samplePercent": "Échantillon",
    "comparison": "Comparé par",
    "endsUtc": "Fin",
    "createdBy": "Lancé par",
    "createdUtc": "Lancé",
    "completedUtc": "Terminé"
   }
  },
  "canary": {
   "stepOf": "Étape {{number}} sur {{total}} à {{percent}}%",
   "gateText": "{{name}} à {{score}} ou plus",
   "noGate": "Aucune condition d'évaluation",
   "errors": {
    "agent": "Choisissez l'agent dont le trafic est déplacé.",
    "candidate": "Choisissez le déploiement candidat.",
    "baseline": "Choisissez le déploiement de référence.",
    "same": "Le candidat et la référence doivent être des déploiements différents.",
    "steps": "Indiquez au moins une étape. La dernière étape est à 100 pour cent.",
    "tooMany": "Une diffusion compte au plus {{max}} étapes.",
    "increasing": "Le pourcentage de chaque étape va de 1 à 100 et dépasse celui de l'étape précédente.",
    "lastStep": "La dernière étape doit être à 100 pour cent.",
    "errorRate": "Le plafond du taux d'erreur va de 0 à 100 pour cent.",
    "gate": "Une condition d'évaluation exige à la fois un jeu d'évaluation et une note minimale, ou aucun des deux.",
    "score": "La note minimale va de 0 à 100 pour cent."
   }
  },
  "canaryDetail": {
   "title": "Diffusion canari",
   "heading": "Diffusion canari de {{agent}}",
   "back": "Toutes les diffusions canari",
   "notFoundTitle": "Diffusion canari introuvable",
   "notFoundBody": "Vérifiez l'ID, ou ouvrez la diffusion depuis la liste.",
   "rolledBack": "Retour en arrière : {{reason}} Les poids initiaux sont rétablis.",
   "aborted": "Interrompue : {{reason}} Les poids initiaux sont rétablis.",
   "promoted": "Promue. {{candidate}} reçoit tout le trafic.",
   "noReason": "aucun motif indiqué.",
   "withWeight": "{{name}} (poids {{weight}} avant la diffusion)",
   "gate": "Dernière note d'évaluation de {{score}} ou plus",
   "steps": "Étapes",
   "columns": {
    "step": "Étape",
    "weightPercent": "Trafic du candidat",
    "minimumRuns": "Exécutions minimales",
    "minimumMinutes": "Minutes minimales",
    "state": "État"
   },
   "stepStates": {
    "done": "Terminée",
    "current": "En cours",
    "stopped": "Arrêtée ici",
    "pending": "En attente"
   },
   "abortTitle": "Interrompre la diffusion canari",
   "abortMessage": "Interrompre la diffusion ? Les deux déploiements reprennent les poids qu'ils avaient avant son lancement.",
   "fields": {
    "agent": "Agent",
    "candidate": "Candidat",
    "baseline": "Référence",
    "maxErrorRatePercent": "Plafond du taux d'erreur",
    "gate": "Condition d'évaluation",
    "stepStartedUtc": "Début de l'étape en cours",
    "createdBy": "Lancée par",
    "completedUtc": "Terminée"
   }
  },
  "fieldCodes": {
   "InputRequired": "Un cas a besoin d'un texte d'entrée.",
   "UnknownScorer": "Utilisez Correspondance exacte, Contient, JSON Schema valide ou Agent juge.",
   "ArgumentRequired": "Indiquez le texte ou remplissez la sortie attendue du cas.",
   "InvalidJsonSchema": "Ce n'est pas un JSON Schema valide.",
   "TooManyCases": "Le jeu contient déjà le nombre maximal de cas autorisé.",
   "EvaluatorIsForAgents": "L'origine Écrit par un agent est réservée aux jeux créés par un agent. Choisissez Écrit par une personne ou Issu du bac à sable.",
   "SetRequired": "Choisissez le jeu d'évaluation à exécuter.",
   "TargetRequired": "Choisissez ce qu'il faut évaluer.",
   "RecentInputsNeedDeployment": "Les entrées récentes rejouent les exécutions d'un déploiement. Évaluez un déploiement.",
   "NoRecentInputs": "Le déploiement n'a pas encore d'exécution réussie à rejouer.",
   "EvalSetEmpty": "Cette version n'a aucun cas.",
   "JudgeAgentRequired": "Certains cas ont besoin de l'agent juge, mais le jeu n'en a pas. Modifiez le jeu et choisissez-en un.",
   "DeploymentNotFound": "Ce déploiement n'existe pas dans ce locataire.",
   "SameDeployment": "Choisissez deux déploiements différents.",
   "DifferentAgent": "Les deux déploiements doivent appartenir au même agent.",
   "DeploymentInactive": "Ce déploiement est inactif. Activez-le d'abord.",
   "AgentMismatch": "L'agent doit être celui du déploiement source.",
   "EndsInPast": "Choisissez une fin dans le futur, ou laissez vide.",
   "EvalSetNotFound": "Ce jeu d'évaluation n'existe pas dans ce locataire.",
   "AgentNotFound": "Cet agent n'existe pas dans ce locataire.",
   "EvalGateIncomplete": "Une condition d'évaluation exige à la fois un jeu d'évaluation et une note minimale, ou aucun des deux.",
   "NotIncreasing": "Le pourcentage de chaque étape doit dépasser celui de l'étape précédente.",
   "LastStepNotFull": "La dernière étape doit être à 100 pour cent."
  }
 },
 "resources": {
  "evalSets": {
   "title": "Jeux d'évaluation",
   "subtitle": "Des cas versionnés qui notent un agent. Approuvez une version pour qu'elle puisse conditionner les promotions et les diffusions canari.",
   "add": "Ajouter un jeu d'évaluation",
   "create": "Ajouter un jeu d'évaluation",
   "edit": "Modifier le jeu d'évaluation",
   "view": "Jeu d'évaluation",
   "deleteTitle": "Supprimer la version brouillon",
   "emptyTitle": "Aucun jeu d'évaluation pour l'instant",
   "emptyBody": "Ajoutez ici un jeu et ses cas, ou enregistrez un tour du bac à sable de l'atelier comme premier cas.",
   "filters": {
    "latestOnly": "Versions",
    "newestOnly": "Version la plus récente uniquement",
    "allVersions": "Toutes les versions"
   },
   "columns": {
    "name": "Nom",
    "version": "Version",
    "state": "État",
    "origin": "Origine",
    "caseCount": "Cas",
    "judgeAgent": "Agent juge",
    "tags": "Étiquettes",
    "authoredByName": "Écrit par",
    "approvedByName": "Approuvé par",
    "description": "Description",
    "lastUpdateUtc": "Dernière modification",
    "id": "ID"
   },
   "fields": {
    "name": "Nom",
    "description": "Description",
    "origin": "Origine",
    "judgeAgent": "Agent juge",
    "tags": "Étiquettes"
   },
   "hints": {
    "name": "De 1 à {{max}} caractères. Le nom reste le même d'une version à l'autre.",
    "description": "Facultatif, au plus {{max}} caractères.",
    "origin": "Issu du bac à sable signale les jeux nés de tours du bac à sable.",
    "judgeAgent": "L'agent qui note les contrôles Agent juge, les cas sans sortie attendue et les entrées récentes.",
    "tags": "Facultatif, une par ligne, au plus {{max}} caractères chacune."
   }
  },
  "evalRuns": {
   "title": "Exécutions d'évaluation",
   "subtitle": "Chaque exécution d'une version de jeu d'évaluation sur un déploiement ou une révision d'agent, avec sa note par rapport au seuil.",
   "add": "Exécuter le jeu",
   "create": "Exécuter un jeu d'évaluation",
   "edit": "Exécution d'évaluation",
   "view": "Exécution d'évaluation",
   "deleteTitle": "Supprimer l'exécution d'évaluation",
   "emptyTitle": "Aucune exécution d'évaluation pour l'instant",
   "emptyBody": "Exécutez un jeu d'évaluation pour noter un déploiement ou une révision brouillon avant sa mise en service.",
   "columns": {
    "setName": "Jeu d'évaluation",
    "status": "Statut",
    "verdict": "Verdict",
    "score": "Note",
    "threshold": "Seuil",
    "progress": "Progression",
    "target": "Évalué",
    "inputMode": "Entrées",
    "costUsd": "Coût",
    "startedByName": "Lancée par",
    "createdUtc": "Lancée",
    "id": "ID"
   }
  },
  "shadowTrials": {
   "title": "Essais fantômes",
   "subtitle": "Un déploiement candidat rejoue une part des entrées d'un déploiement en production sans agir, et les sorties sont comparées.",
   "add": "Lancer un essai fantôme",
   "create": "Lancer un essai fantôme",
   "edit": "Essai fantôme",
   "view": "Essai fantôme",
   "deleteTitle": "Supprimer l'essai fantôme",
   "emptyTitle": "Aucun essai fantôme pour l'instant",
   "emptyBody": "Lancez un essai pour voir comment un déploiement candidat répond à des entrées réelles avant de recevoir du trafic.",
   "columns": {
    "name": "Nom",
    "status": "Statut",
    "source": "Source",
    "candidate": "Candidat",
    "samplePercent": "Échantillon",
    "comparedCount": "Comparées",
    "agreedCount": "Concordantes",
    "divergedCount": "Divergentes",
    "candidateFailureCount": "Échecs",
    "agreement": "Concordance",
    "endsUtc": "Fin",
    "createdUtc": "Lancé",
    "id": "ID"
   },
   "fields": {
    "name": "Nom",
    "sourceDeploymentId": "Déploiement source",
    "candidateDeploymentId": "Déploiement candidat",
    "samplePercent": "Échantillon (pourcentage)",
    "endsUtc": "Fin",
    "comparisonEvalSetId": "Comparer avec un jeu d'évaluation",
    "useJudge": "Comparer avec l'agent juge"
   },
   "hints": {
    "name": "Facultatif, au plus {{max}} caractères.",
    "sourceDeploymentId": "Obligatoire. Ses exécutions réussies sont copiées ; il n'est pas touché.",
    "candidateDeploymentId": "Obligatoire. Un autre déploiement du même agent.",
    "samplePercent": "De 1 à 100, 10 par défaut. La part des exécutions de la source qui est copiée.",
    "endsUtc": "Facultatif. Vide : l'essai continue jusqu'à ce que quelqu'un l'arrête.",
    "comparisonEvalSetId": "Facultatif. Sans jeu, les sorties sont comparées comme texte normalisé.",
    "useJudge": "Demander à l'agent juge si les deux sorties concordent."
   }
  },
  "canaryReleases": {
   "title": "Diffusions canari",
   "subtitle": "Un déploiement candidat reçoit par étapes une part croissante du trafic d'un agent et revient en arrière de lui-même s'il se comporte mal.",
   "add": "Lancer une diffusion canari",
   "create": "Lancer une diffusion canari",
   "edit": "Diffusion canari",
   "view": "Diffusion canari",
   "deleteTitle": "Supprimer la diffusion canari",
   "emptyTitle": "Aucune diffusion canari pour l'instant",
   "emptyBody": "Lancez une diffusion pour déplacer le trafic vers un nouveau déploiement, une étape à la fois.",
   "addStep": "Ajouter une étape",
   "columns": {
    "agent": "Agent",
    "status": "Statut",
    "candidate": "Candidat",
    "baseline": "Référence",
    "step": "Étape",
    "maxErrorRatePercent": "Plafond d'erreurs",
    "gate": "Condition d'évaluation",
    "rollbackReason": "Motif du retour en arrière",
    "createdUtc": "Lancée",
    "id": "ID"
   },
   "fields": {
    "agentId": "Agent",
    "baselineDeploymentId": "Déploiement de référence",
    "candidateDeploymentId": "Déploiement candidat",
    "steps": "Étapes",
    "weightPercent": "Trafic du candidat (pourcentage)",
    "minimumRuns": "Exécutions minimales",
    "minimumMinutes": "Minutes minimales",
    "maxErrorRatePercent": "Plafond du taux d'erreur (pourcentage)",
    "evalSetId": "Jeu de la condition d'évaluation",
    "minEvalScorePercent": "Note d'évaluation minimale (pourcentage)"
   },
   "hints": {
    "agentId": "Obligatoire. Les deux déploiements lui appartiennent.",
    "baselineDeploymentId": "Obligatoire. Il garde le reste du trafic.",
    "candidateDeploymentId": "Obligatoire. Le déploiement en cours de diffusion.",
    "steps": "De 1 à {{max}} étapes. Chaque pourcentage dépasse le précédent, et le dernier vaut 100.",
    "maxErrorRatePercent": "De 0 à 100, 5 par défaut. Au-delà de cette part d'exécutions candidates échouées dans une étape, la diffusion revient en arrière.",
    "evalSetId": "Facultatif. Une étape n'avance que si la dernière exécution d'évaluation de ce jeu atteint la note minimale.",
    "minEvalScorePercent": "Obligatoire avec un jeu de condition d'évaluation, de 0 à 100."
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
})(fr, {
 "nav": {
  "items": {
   "board": {
    "label": "Comité",
    "tip": "Une organisation d'un coup d'œil : santé, points d'attention, propositions, dépenses, freins et le CEO"
   }
  }
 },
 "enums": {
  "notificationEvent": {
   "BoardBrief": "Synthèse déposée pour le comité"
  }
 },
 "errorCodes": {
  "BoardCeoMissing": "Cette organisation n'a pas de CEO : l'unité racine a besoin d'un responsable doté d'un gardien dans la révision en service.",
  "BoardCeoUnavailable": "Le gardien du CEO n'a pas de déploiement, il n'y a donc personne à qui parler. Donnez d'abord un déploiement au gardien."
 },
 "views": {
  "organizationDetail": {
   "openBoard": "Comité"
  }
 },
 "board": {
  "title": "Comité",
  "subtitle": "Supervisez une organisation de gardiens : ce qui demande une décision, ce que cela coûte, et les freins.",
  "heading": "Comité de {{name}}",
  "generated": "Mis à jour",
  "refresh": "Actualiser",
  "openOrganization": "Ouvrir l'organisation",
  "killSwitchOn": "L'arrêt d'urgence est activé : aucun gardien de ce locataire ne se réveille tant qu'il n'est pas désactivé.",
  "notFoundTitle": "Comité indisponible",
  "notFoundBody": "L'organisation n'existe pas, ou vous ne pouvez pas la lire.",
  "picker": {
   "title": "Choisir une organisation",
   "select": "Organisation",
   "choose": "Choisissez une organisation",
   "open": "Ouvrir le comité",
   "emptyTitle": "Aucune organisation pour l'instant",
   "emptyBody": "Créez d'abord une organisation de gardiens. Son comité apparaîtra ici.",
   "organizations": "Aller aux organisations"
  },
  "chart": {
   "title": "Organigramme et santé",
   "empty": "L'organisation n'a pas encore d'unités. Ajoutez des unités et publiez une révision sur la page de l'organisation.",
   "health": "Santé de l'unité",
   "frozen": "Gelée",
   "overBudget": "Budget dépassé",
   "columns": {
    "unit": "Unité",
    "health": "Santé",
    "escalations": "Escalades ouvertes",
    "brakes": "Freins",
    "lastReport": "Dernier rapport"
   }
  },
  "attention": {
   "title": "Demande votre attention",
   "empty": "Rien ne requiert le comité pour le moment.",
   "none": "Aucun.",
   "escalations_one": "{{count}} escalade ouverte",
   "escalations_other": "{{count}} escalades ouvertes",
   "reports_one": "{{count}} rapport défaillant",
   "reports_other": "{{count}} rapports défaillants",
   "caps_one": "{{count}} unité au plafond de budget",
   "caps_other": "{{count}} unités au plafond de budget",
   "raisedBy": "Créée par {{name}}",
   "filedBy": "Déposé par {{name}}"
  },
  "proposals": {
   "title": "Propositions",
   "empty": "Aucune proposition n'attend de décision.",
   "by": "{{agent}} dans {{unit}}",
   "showChanges": "Afficher les changements",
   "hideChanges": "Masquer les changements"
  },
  "evidence": {
   "title": "Éléments probants",
   "empty": "Aucune exécution d'évaluation, aucun essai fantôme ni aucune diffusion canari n'étaye encore cette proposition.",
   "since": "Depuis la dernière modification de la proposition, le {{when}}.",
   "evalRuns": "Exécutions d'évaluation",
   "shadowTrials": "Essais fantômes",
   "canaryReleases": "Diffusions canari",
   "evalSet": "{{name}} v{{version}}",
   "evalScore": "Score {{score}} pour un seuil de {{threshold}}, {{done}} cas sur {{total}}",
   "stale": "Avant la dernière modification",
   "shadow": "Essai fantôme {{name}}",
   "shadowCounts": "{{agreed}} sur {{compared}} concordants, {{diverged}} divergents, {{failures}} échecs du candidat",
   "canary": "Diffusion canari de {{name}}",
   "canaryStep": "Étape {{step}} sur {{total}}",
   "rollback": "Revenue en arrière : {{reason}}"
  },
  "spend": {
   "title": "Dépenses par rapport au budget",
   "empty": "Aucune unité n'a de budget ni de dépenses dans la fenêtre actuelle."
  },
  "brief": {
   "title": "Dernière synthèse",
   "ceo": "CEO : {{name}}, responsable de {{unit}}.",
   "cadence_one": "Une synthèse toutes les heures.",
   "cadence_other": "Une synthèse toutes les {{count}} heures.",
   "noCadence": "Aucune fréquence de synthèse n'est définie sur le gardien du CEO.",
   "empty": "Le CEO n'a pas encore déposé de synthèse."
  },
  "ceo": {
   "missing": "L'unité racine n'a pas de responsable, l'organisation n'a donc pas de CEO.",
   "noMandate": "Le CEO n'a pas de gardien dans la révision en service.",
   "noDeployment": "Le gardien du CEO n'a pas de déploiement auquel parler."
  },
  "brakes": {
   "title": "Freins",
   "active_one": "{{count}} gel actif",
   "active_other": "{{count}} gels actifs",
   "none": "Rien n'est gelé.",
   "frozenBy": "Gelé par {{name}}",
   "lift": "Lever",
   "freezeOrg": "Geler l'organisation",
   "unit": "Unité",
   "pickUnit": "Choisissez une unité",
   "freezeUnit": "Geler l'unité",
   "rollback": "Rétablir l'organigramme",
   "rollbackTitle": "Rétablir l'organigramme précédent",
   "rollbackMessage": "Ramener l'organisation à la révision qui était en service avant la révision {{number}} ? La chaîne de commandement, les budgets et les lignes de messages la suivent aussitôt.",
   "rollbackNote": "Rétabli depuis le comité",
   "rolledBack": "Rétabli. La révision {{number}} est en service."
  },
  "direction": {
   "title": "Consignes pour le CEO",
   "note": "Le texte devient une nouvelle révision publiée du gardien du CEO, et son prochain cycle le lit comme l'instruction du comité.",
   "text": "Consignes",
   "placeholder": "Par exemple : soumettre à une personne les remboursements de plus de 500 $ jusqu'à la fin de l'audit.",
   "count": "{{count}} caractères sur {{max}}",
   "changeNote": "Note de modification",
   "changeNotePlaceholder": "Pourquoi le comité donne ces consignes (facultatif)",
   "submit": "Envoyer les consignes",
   "given": "Consignes publiées comme révision {{number}} de {{name}}.",
   "errors": {
    "required": "Rédigez les consignes pour le CEO.",
    "tooLong": "Utilisez au plus {{max}} caractères."
   }
  },
  "ceoChat": {
   "title": "Parler au CEO",
   "note": "Les messages ouvrent une conversation avec le déploiement du CEO, présentée comme venant du comité.",
   "talkingTo": "Vous parlez à {{name}} au nom du comité.",
   "conversation": "Conversation IA",
   "newConversation": "Nouvelle conversation",
   "new": "Nouvelle",
   "transcript": "Conversation avec le CEO",
   "empty": "Aucun message pour l'instant. Demandez au CEO comment va l'organisation.",
   "message": "Message au CEO",
   "tooLong": "Utilisez au plus {{max}} caractères."
  }
 },
 "wizard": {
  "steps": {
   "keeper": "Premier gardien"
  },
  "welcomeItemKeeper": "Créer votre premier gardien : un agent qui se réveille selon un calendrier et travaille vers un objectif.",
  "keeper": {
   "body": "Un gardien donne un objectif à l'agent d'exemple et le réveille selon un calendrier, en espaçant les réveils tant que rien ne change. Il utilise le harness factice, il ne coûte donc rien. Vous pouvez le mettre en pause ou le supprimer sur la page Gardiens.",
   "objectiveDefault": "Faire le point de temps en temps et signaler que tout est calme.",
   "description": "Créé par l'assistant de configuration.",
   "create": "Créer le gardien",
   "created": "Gardien {{name}} créé. Il se réveille selon son calendrier.",
   "ready": "Le gardien {{name}} est prêt. Passez à l'exécution de test."
  }
 },
 "tour": {
  "steps": {
   "autonomy": {
    "title": "Autonomie",
    "body": "Les gardiens sont des agents qui se réveillent selon un calendrier et travaillent vers un objectif. Les escalades, les gels, l'arrêt d'urgence, la mémoire, les rapports et les messages les gardent sous contrôle."
   },
   "board": {
    "title": "Le comité",
    "body": "Les organisations regroupent des gardiens sous un CEO. L'onglet Comité montre la santé d'une organisation, ce qui demande une décision, les dépenses et les freins, et vous permet de donner des consignes au CEO et de lui parler."
   }
  }
 },
 "explainers": {
  "board": {
   "title": "Le comité",
   "p1": "Le comité est la personne ou le groupe placé au-dessus de l'unité racine d'une organisation. Cette page rassemble ce dont il a besoin : la santé de chaque unité d'après son dernier rapport, les escalades ouvertes, les rapports défaillants, les unités au plafond de budget, et les propositions en attente de décision avec leurs éléments probants issus des évaluations, des essais fantômes et des diffusions canari.",
   "p2": "Les freins gèlent une unité ou toute l'organisation, rétablissent l'organigramme précédent, ou arrêtent tous les gardiens avec l'arrêt d'urgence. Les consignes deviennent une nouvelle révision du gardien du CEO, et Parler au CEO ouvre une conversation ordinaire avec le déploiement du CEO."
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "board": "Comité : la santé, les points d'attention, les propositions, les dépenses, la synthèse et les freins d'une organisation sur une seule page."
   }
  },
  "enums": {
   "notificationEvent": {
    "BoardBrief": "Le CEO d'une organisation a déposé une synthèse pour le comité."
   }
  },
  "views": {
   "organizationDetail": {
    "openBoard": "Ouvrir le comité de cette organisation : santé, points d'attention, propositions, dépenses, freins et le CEO."
   }
  },
  "wizard": {
   "keeper": {
    "name": "Nom du gardien : lettres, chiffres, points, tirets et traits de soulignement.",
    "objective": "Ce vers quoi le gardien travaille. Chaque cycle le lit.",
    "create": "Créer le gardien sur le déploiement à harness factice de l'agent d'exemple et passer à l'exécution de test.",
    "skip": "Continuer sans gardien. Vous pourrez en ajouter un sur la page Gardiens."
   }
  },
  "board": {
   "refresh": "Relire le comité. Il s'actualise aussi quand l'organisation change.",
   "openOrganization": "Ouvrir la page de l'organisation pour modifier les unités, les budgets et les révisions.",
   "openEscalation": "Ouvrir l'escalade pour y répondre.",
   "openReport": "Ouvrir le rapport avec ses métriques, ses problèmes et ses décisions.",
   "openKeeper": "Ouvrir le gardien du CEO avec ses cycles et ses révisions.",
   "picker": {
    "select": "L'organisation dont ouvrir le comité.",
    "open": "Ouvrir le comité de cette organisation.",
    "organizations": "Ouvrir la page des organisations pour en créer une."
   },
   "chart": {
    "title": "L'organigramme en service : chaque unité avec son responsable, ses membres, sa santé d'après son dernier rapport, et ses dépenses.",
    "frozen": "Un gel actif couvre cette unité ou toute l'organisation.",
    "overBudget": "Le sous-arbre de l'unité a dépensé un budget entier dans la fenêtre actuelle.",
    "columns": {
     "unit": "L'unité dans la révision en service.",
     "health": "Santé d'après le dernier rapport déposé dans l'unité. Inconnue s'il n'y en a aucun.",
     "escalations": "Escalades ouvertes créées par les agents de l'unité.",
     "brakes": "Si un gel couvre l'unité et si elle dépasse un budget.",
     "lastReport": "Date du dernier rapport déposé. Ouvre le rapport."
    }
   },
   "attention": {
    "title": "Ce qui attend le comité : escalades ouvertes, rapports dégradés ou défaillants des 7 derniers jours, et unités au plafond de budget."
   },
   "proposals": {
    "title": "Changements proposés par la direction de l'organisation qu'aucune règle de changement ne couvrait, en attente d'une personne.",
    "toggle": "Afficher ou masquer les changements de la proposition et la règle qui couvre chacun, lus depuis le serveur."
   },
   "evidence": {
    "title": "Exécutions d'évaluation, essais fantômes et diffusions canari des agents proposés depuis la dernière modification de la proposition.",
    "openEvalRun": "Ouvrir l'exécution d'évaluation avec les résultats de ses cas.",
    "openShadowTrial": "Ouvrir l'essai fantôme avec ses comparaisons.",
    "openCanary": "Ouvrir la diffusion canari avec ses étapes.",
    "stale": "Cette exécution d'évaluation a commencé avant la dernière modification de la proposition, elle ne teste donc peut-être pas les changements actuels."
   },
   "spend": {
    "title": "Les dépenses de chaque unité dans les fenêtres actuelles du jour et du mois, comparées à ses budgets."
   },
   "brief": {
    "title": "La dernière synthèse déposée par le CEO pour le comité, et la fréquence à laquelle le gardien du CEO en demande une."
   },
   "brakes": {
    "title": "Arrêter le travail vite : geler une unité ou l'organisation, rétablir l'organigramme précédent, ou activer l'arrêt d'urgence.",
    "lift": "Lever ce gel. Le travail dans son périmètre peut reprendre.",
    "freezeOrg": "Geler tous les agents et gardiens de cette organisation jusqu'à la levée du gel. Demande une confirmation.",
    "orgFrozen": "L'organisation est déjà gelée. Levez d'abord ce gel.",
    "unit": "L'unité à geler, avec tout ce qui se trouve en dessous.",
    "freezeUnit": "Geler l'unité choisie et son sous-arbre. Demande une confirmation.",
    "rollback": "Revenir à la révision qui était en service avant l'actuelle. Demande une confirmation.",
    "rollbackNone": "Il n'existe aucune révision antérieure en service à laquelle revenir."
   },
   "direction": {
    "title": "Donner des consignes au CEO. Le texte est publié comme nouvelle révision du gardien du CEO avec la source Comité.",
    "text": "De 1 à 4000 caractères. Le prochain cycle du CEO le lit comme l'instruction du comité.",
    "changeNote": "Facultatif, au plus 2000 caractères. Enregistré avec la révision.",
    "submit": "Publier les consignes comme nouvelle révision du gardien du CEO."
   },
   "ceoChat": {
    "title": "Une conversation avec le déploiement du CEO. Chaque message est une exécution que vous pouvez ouvrir comme les autres.",
    "conversation": "Reprendre une conversation passée du comité ou en commencer une nouvelle.",
    "new": "Commencer une nouvelle conversation avec le CEO.",
    "message": "Ce que vous voulez dire au CEO. Entrée envoie ; Maj+Entrée ajoute une ligne.",
    "send": "Envoyer le message. La réponse s'affiche en continu ci-dessous."
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
})(fr, {
 "nav": {
  "items": {
   "performance": {
    "label": "Performances",
    "tip": "Comment travaillent les unités et les agents d'une organisation, avec les contrôles que les agents ne peuvent pas noter"
   }
  }
 },
 "enums": {
  "triggerTargetType": {
   "EvalSet": "Contrôle planifié"
  },
  "notificationEvent": {
   "OrgBudgetFrozen": "Unité gelée pour dépassement de budget"
  },
  "auditEventType": {
   "OrgBudgetFrozen": "Unité gelée pour dépassement de budget",
   "UnitCascadeCancelled": "Tout annulé dans une unité"
  },
  "rollbackActiveTicks": {
   "Finish": "Les laisser finir",
   "Cancel": "Les annuler"
  }
 },
 "errorCodes": {
  "OrganizationNotLive": "L'organisation n'a pas encore de révision en service. Publiez d'abord une révision."
 },
 "resources": {
  "organizations": {
   "fields": {
    "budgetFreezeMarginPercent": "Marge de gel sur budget (%)"
   },
   "hints": {
    "budgetFreezeMarginPercent": "De {{min}} à {{max}}, {{default}} par défaut. Une unité dont les dépenses dépassent son budget de cette marge est gelée jusqu'à ce qu'une personne lève le gel. 0 gèle dès le budget atteint."
   }
  },
  "triggers": {
   "fields": {
    "evalSetId": "Jeu d'évaluation",
    "evalJudgeAgentId": "Agent évaluateur",
    "evalRecentInputCount": "Entrées récentes"
   },
   "hints": {
    "evalSetId": "Le jeu que le contrôle exécute. Les responsables voient les résultats sur la page des performances.",
    "checkDeployment": "Obligatoire. Le contrôle rejoue les entrées récentes de ce déploiement contre le jeu.",
    "evalRecentInputCount": "De {{min}} à {{max}}, {{default}} par défaut. Combien des dernières entrées du déploiement chaque contrôle rejoue."
   },
   "errors": {
    "evalSetRequired": "Choisissez le jeu d'évaluation que ce contrôle exécute.",
    "deploymentRequired": "Choisissez le déploiement que ce contrôle note.",
    "evalRecentInputCount": "Saisissez un nombre entier de {{min}} à {{max}}."
   },
   "setJudge": "L'agent évaluateur du jeu",
   "checkNotice": "Un contrôle planifié s'exécute au nom de la personne qui l'a enregistré. Les agents ne peuvent ni créer, ni modifier, ni noter les contrôles."
  }
 },
 "organizations": {
  "form": {
   "errors": {
    "margin": "Saisissez un nombre entier de {{min}} à {{max}}."
   }
  }
 },
 "views": {
  "organizationDetail": {
   "openPerformance": "Performances",
   "freezeMargin": "Gel à {{percent}} % au-dessus du budget"
  }
 },
 "rollbackTicks": {
  "legend": "Cycles de gardien en cours"
 },
 "cascadeCancel": {
  "action": "Tout annuler dans cette unité",
  "title": "Tout annuler dans {{name}}",
  "message": "Annuler chaque exécution en file ou en cours, cycle de gardien, escalade ouverte et message en file des agents de {{name}} et de toutes les unités en dessous ? L'unité n'est pas gelée, du travail nouveau peut donc reprendre.",
  "reason": "Motif",
  "reasonPlaceholder": "Pourquoi tout s'arrête (facultatif)",
  "keep": "Continuer",
  "confirm": "Tout annuler",
  "working": "Annulation...",
  "done": "Tout a été annulé dans {{name}}.",
  "resultIntro": "Tout s'est arrêté dans {{name}} :",
  "notFrozen": "L'unité n'est pas gelée. Gelez-la pour empêcher du travail nouveau de commencer.",
  "freeze": "Geler l'unité",
  "counts": {
   "runsCancelled": "Exécutions annulées",
   "ticksCancelled": "Cycles de gardien annulés",
   "escalationsWithdrawn": "Escalades retirées",
   "messagesExpired": "Messages expirés"
  }
 },
 "performance": {
  "title": "Performances",
  "subtitle": "Comment chaque unité et chaque agent d'une organisation ont travaillé : résultats, coût, latence, escalades et scores d'évaluation.",
  "heading": "Performances de {{name}}",
  "range": "Du {{from}} au {{to}}",
  "notFoundTitle": "Performances indisponibles",
  "notFoundBody": "L'organisation n'existe pas, ou vous ne pouvez pas la lire.",
  "unit": "Unité",
  "allUnits": "Toutes les unités",
  "lead": "Responsable",
  "sample": "Exécution {{n}}",
  "outcomes": "{{succeeded}} réussies, {{failed}} échouées, {{cancelled}} annulées",
  "evalScore_one": "{{score}} sur {{count}} exécution d'évaluation",
  "evalScore_other": "{{score}} sur {{count}} exécutions d'évaluation",
  "picker": {
   "title": "Choisir une organisation",
   "emptyTitle": "Aucune organisation pour l'instant",
   "emptyBody": "Créez d'abord une organisation de gardiens. Ses performances apparaissent ici."
  },
  "window": {
   "label": "Période",
   "24h": "24 heures",
   "7d": "7 jours",
   "30d": "30 jours",
   "custom": "Personnalisée",
   "from": "Du",
   "to": "Au",
   "apply": "Appliquer",
   "errors": {
    "from": "Choisissez le premier jour.",
    "to": "Choisissez le dernier jour.",
    "order": "Le dernier jour ne peut pas précéder le premier.",
    "span": "Une période couvre au plus {{max}} jours."
   }
  },
  "chart": {
   "title": "Taux de réussite et coût par unité",
   "successRate": "Taux de réussite",
   "cost": "Coût",
   "noRuns": "Aucune exécution terminée",
   "rateLabel": "Taux de réussite de {{unit}} : {{value}}",
   "costLabel": "Coût de {{unit}} : {{value}}"
  },
  "columns": {
   "unit": "Unité",
   "agent": "Agent",
   "runs": "Exécutions",
   "outcomes": "Résultats",
   "successRate": "Taux de réussite",
   "costUsd": "Coût",
   "latency": "Latence p50 / p95 / p99",
   "escalations": "Escalades",
   "loopGuardRejections": "Refus de la protection anti-boucle",
   "evalScore": "Score d'évaluation",
   "samples": "Exécutions d'exemple"
  },
  "units": {
   "title": "Unités",
   "empty": "Aucune unité ne figure dans l'organigramme en service pour cette période."
  },
  "agents": {
   "title": "Agents",
   "empty": "Aucun agent ne figure dans l'organigramme en service."
  },
  "checks": {
   "title": "Contrôles planifiés",
   "note": "Les contrôles sont des exécutions d'évaluation planifiées sur les entrées récentes d'un déploiement. Des personnes les créent ; les agents ne peuvent ni les noter ni les modifier.",
   "new": "Nouveau contrôle",
   "empty": "Aucun contrôle planifié ne vise les déploiements de cette organisation.",
   "never": "Pas encore exécuté",
   "passed": "Réussi",
   "failed": "Sous le seuil",
   "columns": {
    "check": "Contrôle",
    "evalSet": "Jeu d'évaluation",
    "deployment": "Déploiement",
    "schedule": "Planification",
    "lastRun": "Dernière exécution",
    "lastScore": "Dernier score",
    "nextFire": "Prochaine exécution"
   }
  }
 },
 "tour": {
  "steps": {
   "performance": {
    "title": "Performances",
    "body": "L'onglet Performances montre comment chaque unité et chaque agent d'une organisation ont travaillé sur une période, et les contrôles planifiés qui les notent sans laisser les agents se noter eux-mêmes."
   }
  }
 },
 "explainers": {
  "performance": {
   "title": "Performances",
   "p1": "Chaque ligne d'unité couvre l'unité et tout ce qui se trouve en dessous : les exécutions créées sur la période, leur issue, le taux de réussite (réussies sur réussies plus échouées), le coût, les percentiles de latence, les escalades ouvertes, les refus de la protection anti-boucle et le score moyen des exécutions d'évaluation sur les déploiements de l'unité. Les exécutions d'évaluation, fantômes et de bac à sable ne comptent pas.",
   "p2": "Les contrôles planifiés sont des déclencheurs EvalSet : selon leur planification, ils exécutent un jeu d'évaluation approuvé sur les entrées récentes d'un déploiement. Seules des personnes les créent, si bien qu'un agent ne peut pas noter son propre travail."
  }
 },
 "tips": {
  "nav": {
   "tabs": {
    "performance": "Performances : résultats, coût, latence, escalades et scores d'évaluation par unité et par agent, avec les contrôles planifiés."
   }
  },
  "enums": {
   "triggerTargetType": {
    "EvalSet": "Chaque déclenchement lance une exécution d'évaluation du jeu sur les entrées récentes du déploiement. Seules des personnes peuvent en créer."
   },
   "notificationEvent": {
    "OrgBudgetFrozen": "Les dépenses d'une unité ont dépassé son budget de la marge de l'organisation, et le garde-budget l'a gelée."
   },
   "auditEventType": {
    "OrgBudgetFrozen": "Le garde-budget a gelé une unité dont les dépenses ont dépassé son budget de la marge de l'organisation.",
    "UnitCascadeCancelled": "Quelqu'un a annulé chaque exécution, cycle de gardien, escalade et message en file du sous-arbre d'une unité."
   },
   "rollbackActiveTicks": {
    "Finish": "Les cycles déjà en cours se terminent, mais leurs gardiens restent sur les révisions restaurées.",
    "Cancel": "Les exécutions des cycles en cours sont annulées avant la restauration de l'organigramme."
   }
  },
  "resources": {
   "organizations": {
    "budgetFreezeMarginPercent": "De combien une unité peut dépasser un budget avant que le garde-budget ne la gèle, en pourcentage : de 0 à 100, 10 par défaut."
   },
   "triggers": {
    "evalSetId": "Le jeu d'évaluation que le contrôle exécute à chaque déclenchement.",
    "evalJudgeAgentId": "L'agent qui note les réponses. Vide utilise l'évaluateur du jeu.",
    "evalRecentInputCount": "Combien des dernières entrées du déploiement chaque exécution d'évaluation rejoue, de 1 à 50."
   }
  },
  "views": {
   "organizationDetail": {
    "openPerformance": "Ouvrir les performances de cette organisation par unité et par agent, avec ses contrôles planifiés."
   }
  },
  "rollbackTicks": {
   "legend": "Ce qui arrive aux cycles de gardien en cours quand l'organigramme est rétabli."
  },
  "board": {
   "brakes": {
    "pickUnitFirst": "Choisissez d'abord une unité."
   }
  },
  "cascadeCancel": {
   "action": "Arrêter tout le travail de cette unité et des unités en dessous : exécutions, cycles de gardien, escalades et messages en file. Demande une confirmation.",
   "confirm": "Tout annuler maintenant dans le sous-arbre de l'unité. Impossible à défaire.",
   "reason": "Facultatif, au plus 1024 caractères. Enregistré dans le journal d'audit et sur les escalades retirées.",
   "freeze": "Geler l'unité pour qu'aucun travail nouveau ne commence avant la levée du gel.",
   "counts": {
    "runsCancelled": "Exécutions en file et en cours d'agents du sous-arbre qui ont été annulées.",
    "ticksCancelled": "Cycles de gardien en cours qui ont été annulés.",
    "escalationsWithdrawn": "Escalades ouvertes par des agents du sous-arbre qui ont été retirées.",
    "messagesExpired": "Messages en file pour des agents du sous-arbre qui ont expiré."
   }
  },
  "performance": {
   "refresh": "Relire les performances de la période choisie.",
   "unit": "Afficher une unité avec tout ce qui se trouve en dessous, ou toutes les unités.",
   "lead": "Cet agent dirige son unité.",
   "openAgent": "Ouvrir l'agent.",
   "openRun": "Ouvrir cette exécution d'exemple.",
   "picker": {
    "open": "Ouvrir les performances de cette organisation."
   },
   "window": {
    "24h": "Les dernières 24 heures.",
    "7d": "Les 7 derniers jours.",
    "30d": "Les 30 derniers jours.",
    "custom": "Choisir le premier et le dernier jour, à 90 jours d'écart au plus.",
    "from": "Le premier jour de la période (UTC).",
    "to": "Le dernier jour de la période (UTC), inclus.",
    "apply": "Lire les performances de ces jours."
   },
   "chart": {
    "title": "Taux de réussite et coût du sous-arbre de chaque unité sur la période.",
    "successRate": "Exécutions réussies sur réussies plus échouées.",
    "cost": "Dépenses du sous-arbre de l'unité, à l'échelle de l'unité la plus coûteuse."
   },
   "columns": {
    "unit": "L'unité. Sa ligne couvre tout ce qui se trouve en dessous.",
    "agent": "L'agent et l'unité où il se trouve.",
    "runs": "Exécutions créées sur la période, sans les exécutions d'évaluation, fantômes et de bac à sable.",
    "outcomes": "Exécutions réussies, échouées et annulées.",
    "successRate": "Réussies sur réussies plus échouées. Vide si aucune exécution ne s'est terminée.",
    "costUsd": "Dépenses de ces exécutions en dollars américains.",
    "latency": "Médiane et 95e et 99e centiles de la durée des exécutions terminées.",
    "escalations": "Escalades ouvertes, avec la part des exécutions qui en ont ouvert une.",
    "loopGuardRejections": "Envois de messages et réveils refusés par la protection anti-boucle.",
    "evalScore": "Score moyen des exécutions d'évaluation terminées sur ces déploiements, contrôles planifiés compris.",
    "samples": "Jusqu'à cinq exécutions à examiner : d'abord les échecs les plus récents, puis les réussites les plus récentes."
   },
   "units": {
    "title": "Chaque unité avec les mesures de tout son sous-arbre."
   },
   "agents": {
    "title": "Chaque agent de l'organigramme en service avec ses propres mesures."
   },
   "checks": {
    "title": "Exécutions d'évaluation planifiées sur les déploiements de l'organisation, mises en place par des personnes.",
    "new": "Ouvrir l'éditeur de déclencheurs avec un contrôle planifié comme cible.",
    "openSet": "Ouvrir le jeu d'évaluation.",
    "openRun": "Ouvrir la dernière exécution d'évaluation avec les résultats de ses cas.",
    "passed": "La dernière exécution a atteint le seuil du jeu.",
    "failed": "La dernière exécution est restée sous le seuil du jeu.",
    "columns": {
     "check": "Le déclencheur qui planifie le contrôle, et s'il est actif.",
     "evalSet": "Le jeu d'évaluation que le contrôle exécute.",
     "deployment": "Le déploiement dont le contrôle rejoue les entrées récentes.",
     "schedule": "L'expression cron du déclencheur.",
     "lastRun": "Quand la dernière exécution d'évaluation a commencé, et son statut. Ouvre l'exécution.",
     "lastScore": "Le score de la dernière exécution d'évaluation, de 0 à 100 pour cent.",
     "nextFire": "Quand le contrôle s'exécute la prochaine fois."
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
})(fr, {
 "common": {
  "tabs": {
   "scrollBack": "Afficher les onglets précédents",
   "scrollForward": "Afficher plus d'onglets"
  }
 },
 "evals": {
  "run": {
   "placeholders": {
    "thresholdPercent": "Aucun",
    "budgetUsd": "Aucun"
   },
   "hints": {
    "thresholdPercent": "Facultatif, de 0 à 100. L'exécution réussit quand son score pondéré l'atteint. Laissez vide pour n'avoir ni seuil ni verdict de réussite ou d'échec.",
    "budgetUsd": "Facultatif. Quand les exécutions des cas et du juge dépensent ce montant, les cas restants sont ignorés et l'exécution échoue. Laissez vide pour n'avoir aucun budget."
   }
  }
 },
 "tips": {
  "permissions": {
   "denied": "Vous n'êtes pas autorisé à faire cela. Il faut l'opération {{operation}} sur {{resource}}."
  },
  "views": {
   "escalationDetail": {
    "openKeeperNamed": "Ouvrir le keeper dont le tick l'a soulevée. Son ID est {{id}}."
   }
  },
  "tabs": {
   "scrollBack": "Faire défiler la barre d'onglets vers les onglets masqués avant le premier affiché.",
   "scrollForward": "Faire défiler la barre d'onglets vers les onglets masqués au-delà de son bord."
  },
  "enums": {
   "wakeSource": {
    "Manual": "Une personne a réveillé le keeper : Réveiller maintenant, reprise, publication d'une révision ou consignes données."
   }
  }
 }
});

// AA12.8 follow-ups: keeper and escalation audit event labels, the board's earlier unhealthy report count, the
// RevisionUnchanged refusal of keeper publish and board direction, typed field errors (InvalidType, InvalidValue),
// and the harness profile MCP tool name prefix.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(fr, {
 "enums": {
  "auditEventType": {
   "MandatePaused": "Keeper mis en pause",
   "MandateResumed": "Keeper repris",
   "MandateWoken": "Keeper réveillé",
   "MandateDeleted": "Keeper supprimé",
   "EscalationAnswered": "Escalade répondue",
   "EscalationCancelled": "Escalade annulée"
  }
 },
 "board": {
  "attention": {
   "earlier_one": "et {{count}} plus ancien",
   "earlier_other": "et {{count}} plus anciens"
  },
  "direction": {
   "unchanged": "{{name}} a déjà ces consignes dans sa révision actuelle. Rien n'a été publié et le CEO ne s'est pas réveillé."
  }
 },
 "errorCodes": {
  "RevisionUnchanged": "Rien n'a changé : le brouillon est identique à la dernière révision publiée, il n'a donc pas été publié. Modifiez-le avant de le publier, ou supprimez-le."
 },
 "components": {
  "keeperRevision": {
   "unchanged": "Révision {{number}} enregistrée comme brouillon, mais non publiée : elle dit la même chose que la révision actuelle."
  }
 },
 "common": {
  "fieldCodes": {
   "InvalidType": "Cette valeur n'a pas le bon type.",
   "InvalidTypeOf": "Saisissez {{type}}.",
   "InvalidValue": "Cette valeur n'est pas autorisée.",
   "InvalidValueOneOf": "Choisissez parmi : {{values}}.",
   "InvalidValueRange": "Saisissez une valeur de {{min}} à {{max}}.",
   "fieldMessage": "{{field}} : {{message}}"
  },
  "fieldTypes": {
   "text": "du texte",
   "trueFalse": "true ou false",
   "wholeNumber": "un nombre entier",
   "number": "un nombre",
   "map": "un objet de noms et de valeurs",
   "list": "une liste",
   "object": "un objet",
   "dateTime": "une date et heure comme 2026-12-31T00:00:00Z",
   "duration": "une durée comme 00:05:00"
  }
 },
 "resources": {
  "harnessProfiles": {
   "fields": {
    "mcpToolNamePrefix": "Préfixe des noms d'outils MCP"
   },
   "hints": {
    "mcpToolNamePrefix": "Facultatif. Lettres, chiffres, _ - . : et {server}, jusqu'à 128 caractères."
   },
   "errors": {
    "toolPrefixTooLong": "Utilisez au plus {{max}} caractères.",
    "toolPrefixInvalid": "Utilisez uniquement des lettres, des chiffres, _ - . : et {server}."
   }
  }
 },
 "tips": {
  "enums": {
   "auditEventType": {
    "MandatePaused": "Quelqu'un a mis un keeper en pause : il ne se réveille plus jusqu'à sa reprise.",
    "MandateResumed": "Quelqu'un a repris un keeper en pause, qui se réveille maintenant.",
    "MandateWoken": "Quelqu'un a utilisé Réveiller maintenant sur un keeper.",
    "MandateDeleted": "Quelqu'un a supprimé un keeper avec ses révisions et ses ticks.",
    "EscalationAnswered": "Quelqu'un a répondu à une escalade ouverte.",
    "EscalationCancelled": "Quelqu'un a annulé une escalade ouverte."
   }
  },
  "board": {
   "attention": {
    "earlier_one": "Cet auteur a déposé {{count}} rapport dégradé ou en mauvais état plus ancien ces 7 derniers jours. Ouvre tous ses rapports.",
    "earlier_other": "Cet auteur a déposé {{count}} rapports dégradés ou en mauvais état plus anciens ces 7 derniers jours. Ouvre tous ses rapports."
   }
  },
  "keeperRevision": {
   "unchanged": "Cette révision dit la même chose que l'actuelle ; la publier ne changerait rien. Modifiez d'abord quelque chose."
  },
  "resources": {
   "harnessProfiles": {
    "mcpToolNamePrefix": "Ce que le harness place devant le nom d'un outil MCP quand il le présente au modèle. Utilisez {server} pour le nom du serveur, par exemple mcp__{server}__ ou {server}. (point). Laissez vide quand le modèle voit les noms simples."
   }
  }
 }
});

// Navigation (AA13): Organizations and Evaluations are their own hubs, split out of Autonomy.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(fr, {
 "nav": {
  "hubs": {
   "autonomy": {
    "tip": "Des agents qui continuent à travailler seuls : les gardiens se réveillent selon un calendrier, s’écrivent, déposent des rapports, se souviennent et demandent de l’aide aux personnes quand ils sont bloqués. Les gels les arrêtent."
   },
   "organizations": {
    "label": "Organisations",
    "tip": "Des agents organisés en organigramme d’unités avec responsables et budgets, avec le conseil, la performance par unité et les règles de changement qui permettent aux dirigeants d’appliquer des propositions."
   },
   "evaluations": {
    "label": "Évaluations",
    "tip": "Des vérifications avant qu’un changement n’atteigne la production : jeux d’évaluation et leurs exécutions, essais fantômes à côté de l’agent en service et déploiements canary qui déplacent le trafic par étapes."
   }
  }
 },
 "tips": {
  "nav": {
   "hubs": {
    "autonomy": "Des agents qui continuent à travailler seuls : les gardiens se réveillent selon un calendrier, s’écrivent, déposent des rapports, se souviennent et demandent de l’aide aux personnes quand ils sont bloqués. Les gels les arrêtent.",
    "organizations": "Des agents organisés en organigramme d’unités avec responsables et budgets, avec le conseil, la performance par unité et les règles de changement qui permettent aux dirigeants d’appliquer des propositions.",
    "evaluations": "Des vérifications avant qu’un changement n’atteigne la production : jeux d’évaluation et leurs exécutions, essais fantômes à côté de l’agent en service et déploiements canary qui déplacent le trafic par étapes."
   }
  }
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
})(fr, {
 "components": {
  "table": {
   "columns": "Colonnes"
  }
 }
});

// Activity trail (LP2): the Trail tab of Run detail, its sequence, graph, and list views, the step drawer, and Open trail links.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(fr, {
 "trail": {
  "tab": "Parcours",
  "loading": "Chargement du parcours...",
  "notFound": "Le parcours de cette exécution est introuvable. L'exécution a peut-être été supprimée.",
  "refresh": "Actualiser",
  "exportJson": "Exporter en JSON",
  "openTrail": "Ouvrir le parcours",
  "openStep": "Détails",
  "openStepNamed": "Détails de {{step}}",
  "callerLane": "Demandeur",
  "focusRun": "l'exécution ouverte",
  "runOfKind": "Exécution : {{kind}}",
  "redactedTitle": "{{kind}} (masqué)",
  "redactedNote": "Certaines étapes sont masquées, car vous ne pouvez pas lire leurs enregistrements. Elles n'affichent que leur nature et leur heure.",
  "idleGap": "{{duration}} d'inactivité",
  "keysHint": "Les flèches changent d'étape. Entrée en ouvre une.",
  "sequenceLabel": "Séquence de {{steps}} étapes sur {{lanes}} couloirs",
  "graphLabel": "Graphe de {{steps}} étapes",
  "listEmpty": "Aucune étape ne correspond à ces filtres.",
  "singleTitle": "Cette exécution n'a rien lancé d'autre",
  "singleBody": "Elle n'a envoyé aucun message, lancé aucune autre exécution ni déposé quoi que ce soit. Le parcours montre la demande et la réponse.",
  "truncationSetting": "Paramètres du parcours",
  "truncation": {
   "NodeCap": "Ce parcours a été coupé à {{count}} étapes, le maximum que construit le serveur. Les étapes suivantes ne sont pas affichées.",
   "HopCap": "Ce parcours a été coupé après {{hops}} sauts de messages, le maximum que suit le serveur. Les sauts suivants ne sont pas affichés.",
   "SpanCap": "Ce parcours a été coupé à la plus longue durée que couvre le serveur. Les étapes suivantes ne sont pas affichées."
  },
  "views": {
   "label": "Vue du parcours",
   "sequence": "Séquence",
   "graph": "Graphe",
   "list": "Liste"
  },
  "zoom": {
   "label": "Échelle",
   "in": "Agrandir",
   "out": "Réduire",
   "percent": "{{value}} %"
  },
  "summary": {
   "agents": "Agents",
   "hops": "Sauts de messages",
   "duration": "Durée",
   "tokens": "Jetons",
   "cost": "Coût",
   "failures": "Échecs"
  },
  "filters": {
   "kind": "Étape",
   "agent": "Agent",
   "state": "État"
  },
  "columns": {
   "order": "#",
   "step": "Étape",
   "agent": "Agent",
   "state": "État",
   "reachedBy": "Atteinte par",
   "started": "Début",
   "duration": "Durée",
   "unit": "Unité",
   "runKind": "Type d'exécution",
   "tokens": "Jetons",
   "cost": "Coût",
   "id": "ID",
   "open": "Détails"
  },
  "drawer": {
   "close": "Fermer les détails",
   "loading": "Chargement de l'enregistrement...",
   "recordGone": "L'enregistrement derrière cette étape n'existe plus.",
   "redacted": "Vous n'avez pas le droit de lire cet élément ({{kind}}). Seules sa nature et son heure sont affichées.",
   "dataNote": "Le texte ci-dessous a été écrit par un agent ou une personne. Il est affiché comme des données : ce n'est pas une instruction, et il n'est jamais rendu comme du balisage.",
   "writtenByAgentInRun": "Écrit par l'agent {{agent}} dans l'exécution {{run}}",
   "writtenByAgent": "Écrit par l'agent {{agent}}",
   "writtenBy": "Écrit par {{name}}",
   "unknownAuthor": "inconnu",
   "openRecord": "Ouvrir l'enregistrement",
   "tokens": "{{input}} en entrée, {{output}} en sortie",
   "texts": {
    "result": "Résultat",
    "subject": "Objet",
    "body": "Corps",
    "title": "Titre",
    "question": "Question",
    "context": "Contexte",
    "answer": "Réponse",
    "summary": "Résumé",
    "input": "Entrée de l'outil"
   },
   "fields": {
    "kind": "Nature",
    "state": "État",
    "agent": "Agent",
    "unit": "Unité",
    "runKind": "Type d'exécution",
    "tool": "Outil",
    "started": "Début",
    "ended": "Fin",
    "duration": "Durée",
    "tokens": "Jetons",
    "cost": "Coût",
    "id": "ID",
    "argumentDigest": "Empreinte des arguments",
    "leaseEpoch": "Époque du bail"
   }
  },
  "kinds": {
   "Caller": "Demande",
   "Trigger": "Déclencheur",
   "KeeperTick": "Cycle de gardien",
   "Run": "Exécution",
   "Message": "Message",
   "Report": "Rapport",
   "Escalation": "Escalade",
   "Approval": "Approbation",
   "Effect": "Effet d'outil",
   "FanOutGroup": "Éventail",
   "PipelineRun": "Exécution de pipeline",
   "Reply": "Réponse",
   "Redacted": "Étape masquée"
  },
  "edges": {
   "Started": "a lancé",
   "Spawned": "a créé",
   "FannedOut": "a déployé",
   "Retried": "a réessayé",
   "Sent": "a envoyé",
   "Woke": "a réveillé",
   "Filed": "a déposé",
   "Raised": "a escaladé",
   "Routed": "a transmis",
   "Answered": "a répondu",
   "Requested": "a demandé",
   "Decided": "a décidé",
   "Performed": "a effectué",
   "Replied": "a renvoyé"
  },
  "states": {
   "Pending": "En attente",
   "Queued": "En file",
   "Leased": "Attribuée",
   "Running": "En cours",
   "Cancelling": "Annulation en cours",
   "Suspended": "Suspendue",
   "Open": "Ouverte",
   "Authorized": "Autorisée",
   "Dispatched": "Expédiée",
   "Succeeded": "Réussie",
   "Completed": "Terminée",
   "Delivered": "Remis",
   "Acknowledged": "Accusé",
   "Answered": "Répondue",
   "Filed": "Déposé",
   "Approved": "Approuvée",
   "Joined": "Regroupée",
   "Failed": "Échouée",
   "TimedOut": "Délai dépassé",
   "Rejected": "Rejetée",
   "Denied": "Refusée",
   "Expired": "Expirée",
   "BudgetExceeded": "Budget dépassé",
   "Unknown": "Inconnu",
   "Cancelled": "Annulée",
   "Withdrawn": "Retirée"
  }
 }
});

// The organization designer (LP3.2 to LP3.10): the Design tab, people palette, unit panel tabs, live checks, undo, chart overlays, and templates.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(fr, {
 "components": {
  "orgDesigner": {
   "tabs": {
    "design": "Conception",
    "people": "Personnes",
    "keepers": "Gardiens",
    "budget": "Budget",
    "rules": "Règles",
    "label": "Unité {{name}}"
   },
   "note": "Les modifications sont enregistrées tout de suite dans l'arbre de travail. Rien n'est mis en service avant que vous publiiez une révision depuis l'en-tête de la page.",
   "empty": "Aucune unité pour l'instant. Ajoutez l'unité racine avec Ajouter une unité, ou commencez une nouvelle organisation à partir d'un modèle.",
   "narrow": "Le canevas demande un écran plus large, les unités sont donc listées ci-dessous. Chaque modification est toujours enregistrée dans l'arbre de travail.",
   "failed": "{{change}} n'a pas abouti.",
   "operations": {
    "AddUnit": "Ajout de l'unité",
    "RemoveUnit": "Retrait de l'unité",
    "MoveUnit": "Déplacement de l'unité",
    "SetLead": "Changement de responsable",
    "AddUnitMember": "Ajout du membre",
    "RemoveUnitMember": "Retrait du membre",
    "ConnectUnits": "Ajout de la ligne transversale",
    "DisconnectUnits": "Retrait de la ligne transversale",
    "SetBudget": "Enregistrement du budget",
    "AttachMandate": "Rattachement du gardien",
    "DetachMandate": "Détachement du gardien"
   },
   "minimap": "Mini-carte de l'organisation",
   "node": {
    "problems_one": "{{count}} problème",
    "problems_other": "{{count}} problèmes"
   },
   "announce": {
    "leadSet": "{{name}} est maintenant responsable de {{unit}}."
   },
   "keys": {
    "undo": "Ctrl+Z annule la dernière modification, et Ctrl+Maj+Z ou Ctrl+Y la rétablit (Cmd sur Mac).",
    "place": "Quand un agent est choisi dans Personnes, Entrée sur une unité l'ajoute comme membre et L en fait le responsable."
   },
   "history": {
    "label": "Annuler et rétablir",
    "undo": "Annuler",
    "redo": "Rétablir",
    "undone": "Annulé : {{change}}.",
    "redone": "Rétabli : {{change}}.",
    "methods": {
     "addUnit": "ajouter une unité",
     "removeUnit": "retirer une unité",
     "moveUnit": "déplacer une unité",
     "setLead": "changer de responsable",
     "addMember": "ajouter un membre",
     "removeMember": "retirer un membre",
     "connectUnits": "ajouter une ligne transversale",
     "disconnectUnits": "retirer une ligne transversale",
     "setBudget": "modifier le budget",
     "attachMandate": "rattacher un gardien",
     "detachMandate": "détacher un gardien"
    }
   },
   "palette": {
    "title": "Personnes",
    "search": "Rechercher des agents",
    "hint": "Faites glisser un agent sur une unité pour l'ajouter comme membre, ou sur la ligne du responsable pour qu'il la dirige. Vous pouvez aussi le choisir puis indiquer où il va.",
    "none": "Ce locataire n'a pas encore d'agents.",
    "noMatch": "Aucun agent ne correspond à la recherche.",
    "inUnit": "dans {{unit}}",
    "newAgent": "Nouvel agent",
    "newAgentTitle": "Nouvel agent pour {{unit}}",
    "placing": "Placer {{name}} :",
    "unit": "Unité",
    "as": "En tant que",
    "asMember": "Membre",
    "asLead": "Responsable",
    "place": "Placer"
   },
   "structure": {
    "lead": "Responsable",
    "title": "Titre du responsable",
    "setLead": "Définir le responsable",
    "parent": "Rend compte à",
    "move": "Déplacer"
   },
   "keepers": {
    "hint": "Un gardien est une tâche permanente qu'un agent accomplit selon un calendrier de réveil. Chaque poste de l'unité peut en porter un.",
    "noPeople": "Ajoutez d'abord un responsable ou un membre. Les gardiens se rattachent aux personnes d'une unité.",
    "lead": "Responsable",
    "member": "Membre",
    "none": "Aucun gardien rattaché.",
    "nextWake": "Prochain réveil {{when}}",
    "notScheduled": "Non planifié",
    "every": "toutes les {{interval}}",
    "schedule": "Modifier le calendrier",
    "detach": "Détacher",
    "pick": "Gardien à rattacher",
    "attach": "Rattacher",
    "create": "Nouveau gardien",
    "createTitle": "Nouveau gardien pour {{name}}"
   },
   "budget": {
    "hint": "Un budget plafonne ce que l'unité et tout ce qui se trouve en dessous peuvent dépenser. Les dépenses portent sur la fenêtre en cours de la révision active.",
    "amount": "Budget (USD)",
    "clear": "Effacer",
    "noSpend": "Aucune dépense enregistrée dans cette fenêtre.",
    "cap": "Au plus {{amount}}, le budget {{period}} de {{unit}}.",
    "noCap": "Aucune unité au-dessus ne fixe de budget {{period}}.",
    "capLeft": "Il reste {{left}} à {{unit}} dans cette fenêtre."
   },
   "rules": {
    "hint": "Les règles de changement permettent aux propositions courantes d'un dirigeant dans ce sous-arbre de s'appliquer sans intervention humaine. Seules des personnes les écrivent.",
    "add": "Ajouter une règle",
    "none": "Aucune règle de changement ne couvre cette unité.",
    "here": "Définie sur cette unité.",
    "above": "Définie sur {{unit}}, au-dessus de cette unité.",
    "by": "Écrite par {{name}}.",
    "runToken": "Les agents ne peuvent pas écrire de règles de changement : un jeton d'exécution voit donc cette liste en lecture seule."
   },
   "problems": {
    "title_one": "Vérifications : {{count}} problème",
    "title_other": "Vérifications : {{count}} problèmes",
    "checking": "Vérification de l'organisation...",
    "none": "Aucun problème trouvé.",
    "failed": "Les vérifications n'ont pas pu s'exécuter : {{reason}}",
    "show": "Afficher {{unit}}",
    "UnitWithoutLead": "{{unit}} n'a pas de responsable.",
    "AgentInTwoUnits": "{{agent}} figure dans plusieurs unités, dont {{unit}}.",
    "PeerLineToMissingUnit": "{{unit}} a une ligne transversale vers une unité qui ne fait pas partie de l'organisation.",
    "BudgetOverParent": "Le budget de {{unit}} dépasse celui d'une unité située au-dessus.",
    "KeeperDeploymentMissing": "Le gardien {{mandate}} de {{agent}} dans {{unit}} n'a pas de déploiement actif.",
    "UnitDetachedFromRoot": "{{unit}} n'a pas de chemin vers l'unité racine."
   },
   "overlay": {
    "range": "Période d'activité",
    "days_one": "{{count}} jour",
    "days_other": "{{count}} jours",
    "spend": "{{period}} : {{spent}} sur {{amount}}",
    "spendOnly": "{{period}} : {{spent}} dépensés",
    "activity_one": "{{runs}} exécutions, {{escalations}} escalades, {{cost}} sur le dernier jour",
    "activity_other": "{{runs}} exécutions, {{escalations}} escalades, {{cost}} sur les {{count}} derniers jours",
    "pick": "Sélectionnez une unité pour voir ses exécutions récentes.",
    "noReport": "Aucun rapport déposé pour l'instant.",
    "noActivity": "Aucune activité sur cette période.",
    "runs": "Exécutions récentes",
    "noRuns": "Aucune exécution sur cette période.",
    "openTrail": "Ouvrir le parcours"
   },
   "chartLayout": {
    "label": "Présentation de l'organigramme",
    "tree": "Arbre",
    "canvas": "Canevas"
   },
   "templates": {
    "title": "Nouvelle organisation à partir d'un modèle",
    "open": "Nouvelle à partir d'un modèle",
    "intro": "Partez de zéro ou appliquez l'une des organisations d'exemple. Les exemples tournent sur le harness factice, ils n'ont donc besoin d'aucun identifiant.",
    "apply": "Appliquer le modèle",
    "create": "Créer l'organisation",
    "preview": "Voir ce qu'il crée",
    "previewHint": "Vérifiez ce qu'il crée avant de l'appliquer. Le manifeste s'exécute alors à blanc et liste ce qui serait créé ou modifié.",
    "contents_one": "Ce modèle contient {{count}} ressource",
    "contents_other": "Ce modèle contient {{count}} ressources",
    "ticks": "Les gardiens de ce modèle commencent à se réveiller quelques secondes après l'application.",
    "blank": {
     "name": "Vide",
     "body": "Une organisation vide. Vous ajoutez l'unité racine dans l'onglet Conception."
    },
    "gerbil": {
     "name": "Gerbil",
     "body": "Un gardien dans une unité. Il surveille une page d'état et demande à une personne quand la page reste en panne."
    },
    "siteReliability": {
     "name": "Fiabilité du site",
     "body": "Un responsable et trois gardiens qui veillent sur un site public, avec des lignes transversales, des budgets et un conservateur de mémoire."
    }
   }
  }
 }
});

// LP4.1 to LP4.4: the Learn page, its seven concept diagrams, the glossary, and the Explainer link to them.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(fr, {
 "nav": {
  "learn": "Apprendre",
  "hubs": {
   "learn": {
    "label": "Apprendre",
    "tip": "Des schémas, des visites et un glossaire qui montrent comment Garrison s'articule"
   }
  },
  "items": {
   "learn": {
    "label": "Apprendre",
    "tip": "Des schémas, des visites et un glossaire qui montrent comment Garrison s'articule"
   }
  }
 },
 "learn": {
  "title": "Apprendre",
  "subtitle": "Comment les pièces de Garrison s'articulent, un schéma à la fois. Chaque bloc ouvre sa page, et le livre dans son coin ouvre son guide.",
  "toc": "Sur cette page",
  "startTourNamed": "Visite : {{tour}}",
  "showList": "Afficher en liste",
  "showDiagram": "Afficher en schéma",
  "openPage": "{{name}}. Ouvre {{page}}.",
  "openDoc": "En savoir plus sur {{name}} dans {{doc}}",
  "glossaryTitle": "Glossaire",
  "glossaryIntro": "Ce sont les mots de la documentation. Quand le tableau de bord dit autre chose, l'entrée le précise.",
  "list": {
   "parts": "Éléments",
   "connections": "Liens",
   "connection": "{{from}} {{arrow}} {{to}}",
   "connectionLabelled": "{{from}} {{arrow}} {{to}} : {{label}}",
   "doc": "Guide : {{doc}}"
  },
  "tours": {
   "firstLook": "Premier aperçu",
   "runAnAgent": "Exécuter un agent",
   "followARequest": "Suivre une requête",
   "buildATeam": "Monter une équipe",
   "keepItSafe": "Garder le contrôle",
   "watchAnOrganization": "Surveiller une organisation"
  },
  "diagrams": {
   "runtime": {
    "title": "Le moteur d'exécution",
    "summary": "Un locataire contient des agents et les déploiements qui les exécutent. Un déploiement relie un agent à un profil de harness, un modèle, ses prompts et un pool de nœuds. Chaque requête devient une exécution, et un nœud worker de ce pool la récupère puis lance le harness. Les workers ne touchent jamais la base de données : tout ce dont ils ont besoin arrive avec le bail.",
    "desc": "Un locataire contient des clés d'accès, des agents, des profils de harness, des déploiements et des exécutions. Les pools de nœuds et les nœuds worker forment une flotte que les locataires partagent.",
    "groups": {
     "tenant": "Locataire",
     "fleet": "Flotte partagée"
    },
    "boxes": {
     "credential": {
      "title": "Clé d'accès",
      "body": "Une clé qui appartient à un utilisateur. Les appelants et les nœuds worker s'identifient avec."
     },
     "agent": {
      "title": "Agent IA",
      "body": "Ce que l'on invoque par REST, MCP ou A2A. Il conserve des révisions immuables."
     },
     "harnessProfile": {
      "title": "Profil de harness",
      "body": "Comment une CLI ou une API de harness tourne sans interface. Le tableau de bord parle de connexion."
     },
     "deployment": {
      "title": "Déploiement",
      "body": "Relie un agent à un profil de harness, un modèle, des prompts et un pool de nœuds."
     },
     "nodePool": {
      "title": "Pool de nœuds",
      "body": "Un groupe de nœuds worker, réservable à certains locataires."
     },
     "run": {
      "title": "Exécution",
      "body": "Une exécution d'un agent sur un déploiement, avec ses événements et son résultat."
     },
     "node": {
      "title": "Nœud worker",
      "body": "Récupère les exécutions qu'il peut servir et lance le harness de chacune."
     }
    },
    "arrows": {
     "invokes": "invoque",
     "runsOn": "tourne sur",
     "usedBy": "utilisé par",
     "targets": "cible",
     "creates": "crée",
     "groups": "regroupe",
     "leases": "prend à bail"
    }
   },
   "request": {
    "title": "La vie d'une requête",
    "summary": "Toutes les façons de lancer un agent aboutissent au même endroit. REST, MCP et A2A partagent un invocateur, qui choisit un déploiement et n'admet l'exécution que si aucun gel, budget d'unité ou plafond de file ne s'y oppose. Un worker réclame l'exécution en attente, reçoit la spécification compilée et lance le harness. La sortie revient sous forme d'événements, et l'appelant obtient le résultat.",
    "desc": "Une requête va de l'appelant, par REST, MCP ou A2A, jusqu'à l'admission puis la file. Un worker la prend à bail et lance le harness, et la sortie revient sous forme d'événements et d'une réponse.",
    "groups": {
     "controlPlane": "Plan de contrôle",
     "worker": "Sur un nœud worker"
    },
    "boxes": {
     "caller": {
      "title": "Appelant",
      "body": "Une personne, un SDK, un client MCP ou un agent A2A."
     },
     "surface": {
      "title": "REST, MCP ou A2A",
      "body": "Les trois passent par le même invocateur, qui vérifie Execute sur l'agent."
     },
     "admission": {
      "title": "Admission de l'exécution",
      "body": "Choisit un déploiement, puis vérifie les gels, les budgets d'unité et les plafonds de file. Une exécution refusée n'est jamais créée."
     },
     "queued": {
      "title": "En file d'attente",
      "body": "Attend un worker qui a le bon harness, le bon pool de nœuds et les bons libellés."
     },
     "lease": {
      "title": "Bail",
      "body": "Le worker fait du long polling, réclame l'exécution par compare-and-set et reçoit la spécification compilée."
     },
     "harness": {
      "title": "Harness",
      "body": "La CLI ou l'API du fournisseur, lancée avec les arguments, fichiers et serveurs MCP de la spécification."
     },
     "events": {
      "title": "Événements",
      "body": "Sortie analysée par lots : texte, appels d'outils, consommation et résultat."
     },
     "reply": {
      "title": "Réponse",
      "body": "Une invocation qui attend renvoie l'exécution. Les flux reçoivent l'événement final."
     }
    },
    "arrows": {
     "sends": "requête",
     "admitted": "admise",
     "leased": "prise à bail",
     "starts": "lance",
     "returns": "résultat"
    }
   },
   "autonomy": {
    "title": "Les briques de l'autonomie",
    "summary": "Un gardien est un agent qui a une mission permanente, écrite sous forme de mandat. Garrison le réveille selon un calendrier, et chaque réveil est un cycle : une exécution ordinaire qui se termine quand le gardien rapporte ce qu'il a trouvé. En chemin, il peut retenir des choses pour les cycles suivants, déposer des rapports pour son responsable et escalader une question qu'il ne devrait pas trancher seul. La réponse le réveille à nouveau.",
    "desc": "Un gardien détient un mandat dont le calendrier de réveil lance des cycles. Chaque cycle lance une exécution du gardien, qui écrit en mémoire, dépose des rapports et ouvre des escalades. Une escalade qui reçoit sa réponse réveille de nouveau le gardien.",
    "boxes": {
     "keeper": {
      "title": "Gardien",
      "body": "Un agent avec une mission permanente. L'API appelle cet enregistrement mandate."
     },
     "mandate": {
      "title": "Mandat",
      "body": "Des révisions publiées : l'objectif, à quoi ressemble un état sain, l'autonomie et la politique d'escalade."
     },
     "schedule": {
      "title": "Calendrier de réveil",
      "body": "Un intervalle minimal et maximal avec ralentissement progressif. Le leader réclame chaque réveil dû une seule fois."
     },
     "tick": {
      "title": "Cycle",
      "body": "Un réveil, avec sa source et un résultat : Calme, Intervenu, Demande attention ou Escaladé."
     },
     "run": {
      "title": "Exécution du gardien",
      "body": "Une exécution de type Keeper sur le déploiement du mandat. Elle se termine par le compte rendu du cycle."
     },
     "memory": {
      "title": "Mémoire",
      "body": "Les entrées marquées recall reviennent dans l'entrée du cycle suivant."
     },
     "report": {
      "title": "Rapport",
      "body": "Déposé vers le haut. Le cycle suivant du responsable le lit dans sa synthèse."
     },
     "escalation": {
      "title": "Escalade",
      "body": "Une question pour une personne, un rôle ou un autre agent."
     }
    },
    "arrows": {
     "holds": "détient",
     "sets": "fixe",
     "comesDue": "arrive à échéance",
     "starts": "lance",
     "writes": "écrit",
     "files": "dépose",
     "raises": "ouvre",
     "answerWakes": "la réponse le réveille"
    }
   },
   "teams": {
    "title": "Équipes",
    "summary": "Les agents s'écrivent par des boîtes aux lettres. Un message est du courrier, pas un appel : l'expéditeur continue, et le destinataire le lit à sa prochaine exécution, ou tout de suite si le message est urgent. Chaque envoi passe d'abord par les garde-fous anti-boucle, et un message refusé est conservé avec son motif, pour voir qui a essayé de joindre qui.",
    "desc": "Un message franchit les garde-fous anti-boucle jusqu'à la boîte du destinataire, ou il est enregistré comme Rejeté. Le courrier normal attend la prochaine exécution du destinataire, le courrier urgent le réveille.",
    "boxes": {
     "sender": {
      "title": "Expéditeur",
      "body": "L'exécution d'un agent, ou une personne. Les agents n'écrivent que le long d'une ligne."
     },
     "guards": {
      "title": "Garde-fous anti-boucle",
      "body": "Dans l'ordre : destinataire gelé, aucune ligne, limite de sauts, budget du fil, débit de la ligne."
     },
     "mailbox": {
      "title": "Boîte aux lettres",
      "body": "Les messages en attente du destinataire, du plus ancien au plus récent."
     },
     "normal": {
      "title": "Distribution normale",
      "body": "Attend le prochain cycle du gardien, ou une exécution qui lit la boîte de réception."
     },
     "rejected": {
      "title": "Rejeté",
      "body": "Conservé avec son motif et jamais distribué."
     },
     "urgent": {
      "title": "Réveil urgent",
      "body": "Avance le prochain réveil du gardien, ou lance une exécution Message s'il n'y a pas de gardien."
     },
     "recipient": {
      "title": "Exécution du destinataire",
      "body": "Une exécution emporte tout ce qui est arrivé : dix messages coûtent un cycle."
     }
    },
    "arrows": {
     "sends": "envoie",
     "passes": "passe",
     "refused": "refusé",
     "normal": "normale",
     "urgent": "urgente",
     "nextRun": "exécution suivante",
     "wakes": "réveille aussitôt"
    }
   },
   "organization": {
    "title": "Une organisation",
    "summary": "Une organisation donne une forme à un groupe d'agents : un arbre d'unités, chacune avec un responsable, des membres, des lignes transversales facultatives et des budgets. Le responsable de l'unité racine est le CEO, et au-dessus siège le comité, les personnes qui dirigent l'organisation. Les modifications vont dans un arbre de travail que rien ne lit. Publier une révision la met en service, et dès lors messages, rapports, mémoire, escalades, gels et budgets interrogent tous la même chaîne de commandement.",
    "desc": "Le comité supervise l'unité racine, dont le responsable est le CEO. Les unités en dessous y sont rattachées par des lignes hiérarchiques, et les lignes transversales relient des unités entre elles. L'arbre de travail entre en service à la publication d'une révision, et la chaîne de commandement ne lit que la révision en service.",
    "groups": {
     "live": "Révision en service"
    },
    "boxes": {
     "board": {
      "title": "Comité",
      "body": "Les personnes qui dirigent l'organisation, au-dessus du CEO."
     },
     "root": {
      "title": "Unité racine",
      "body": "Son responsable est le CEO. Son budget plafonne tout l'arbre."
     },
     "unitA": {
      "title": "Unité",
      "body": "Un responsable, jusqu'à 200 membres, un budget par jour et un par mois."
     },
     "unitB": {
      "title": "Unité voisine",
      "body": "Une ligne transversale relie tous les agents de deux unités, dans les deux sens."
     },
     "working": {
      "title": "Arbre de travail",
      "body": "Là où les personnes modifient les unités. Rien ne le lit à l'exécution."
     },
     "revision": {
      "title": "Révision publiée",
      "body": "Un instantané qui ne change jamais. Une annulation publie une copie d'une révision antérieure."
     },
     "chain": {
      "title": "Chaîne de commandement",
      "body": "Responsables, chaînes, sous-arbres et lignes, uniquement d'après les révisions en service."
     }
    },
    "arrows": {
     "oversees": "supervise",
     "reportsA": "ligne hiérarchique",
     "peer": "ligne transversale",
     "publish": "publier",
     "readBy": "lue par"
    }
   },
   "selfRevision": {
    "title": "Auto-révision",
    "summary": "Un dirigeant est le responsable d'une unité qui peut proposer des changements aux unités en dessous. Il écrit un brouillon d'atelier ordinaire, et ExecutiveDraftValidator le soumet à des limites strictes que rien ne lève : rien sur lui-même, rien au-dessus ni en dehors de son sous-arbre, aucun secret, aucune hausse de budget et aucun accès de gestion. Un brouillon que les règles de changement écrites par des personnes couvrent entièrement s'applique aussitôt. Tout le reste attend une personne. Chaque application publie une révision de l'organisation et enregistre un brouillon d'annulation, si bien qu'une seule annulation la défait.",
    "desc": "Un dirigeant écrit un brouillon. Les limites strictes le refusent ou le transmettent aux règles de changement, qu'une barrière d'évaluation peut retenir. Un brouillon couvert s'applique, le reste attend une personne qui voit les résultats des essais fantômes et des diffusions canari. Chaque application publie une révision de l'organisation avec un brouillon d'annulation, et une annulation la restaure.",
    "boxes": {
     "executive": {
      "title": "Dirigeant",
      "body": "Le responsable d'une unité dont le déploiement peut rédiger des changements sous son unité."
     },
     "draft": {
      "title": "Brouillon",
      "body": "Un brouillon d'atelier ordinaire. Les personnes le suivent comme une proposition."
     },
     "limits": {
      "title": "Limites strictes",
      "body": "Vérifiées au diff, à la demande et juste avant l'application. Aucune règle ni approbation ne les lève."
     },
     "refused": {
      "title": "Refusé",
      "body": "La demande échoue avec DraftInvalid, et rien ne change."
     },
     "eval": {
      "title": "Barrière d'évaluation",
      "body": "Le dirigeant lance un jeu d'évaluation sur son propre brouillon. Une règle avec barrière exige un score suffisant."
     },
     "rules": {
      "title": "Règles de changement",
      "body": "Écrites uniquement par des personnes. Chaque changement est classé puis rapproché d'une règle."
     },
     "person": {
      "title": "Une personne décide",
      "body": "Un changement qu'aucune règle ne couvre attend, comme tout brouillon."
     },
     "apply": {
      "title": "Appliquer",
      "body": "Au nom de la personne derrière l'exécution, ou de celle qui l'a autorisé."
     },
     "evidence": {
      "title": "Essais fantômes et canaris",
      "body": "Lancés par des personnes. Leurs résultats figurent sur la proposition, et un canari revient en arrière tout seul."
     },
     "rollback": {
      "title": "Annulation",
      "body": "Restaure une révision antérieure, puis applique les brouillons d'annulation, du plus récent au plus ancien."
     },
     "revision": {
      "title": "Révision de l'organisation",
      "body": "Une par application, qui nomme le brouillon."
     },
     "revert": {
      "title": "Brouillon d'annulation",
      "body": "Les enregistrements modifiés, tels qu'ils étaient avant."
     }
    },
    "arrows": {
     "writes": "écrit",
     "checked": "vérifié",
     "breaks": "enfreint une limite",
     "passes": "passe",
     "gate": "note",
     "notCovered": "non couvert",
     "covered": "entièrement couvert",
     "allows": "autorise",
     "evidence": "résultats",
     "publishes": "publie",
     "saves": "enregistre",
     "restores": "restaure"
    }
   },
   "brakes": {
    "title": "Freins",
    "summary": "Les freins ne comptent pas sur la coopération de l'agent. Les gels, l'arrêt d'urgence, les plafonds de dépense et les budgets d'unité sont vérifiés dans le plan de contrôle à l'admission d'une exécution et avant chaque réveil d'un gardien : une exécution refusée n'est donc jamais créée. Les jetons d'exécution n'ont jamais les permissions de gel, si bien qu'un agent ne peut pas lever un frein sur lui-même. Pour le travail déjà lancé, annulez tout dans une unité, et laissez le gardien du budget geler une unité qui dépasse.",
    "desc": "Les gels, l'arrêt d'urgence, les plafonds de dépense et les budgets d'unité alimentent les vérifications à l'admission et avant les réveils, qui refusent les nouvelles exécutions et sautent des réveils. Pour le travail en cours, Tout annuler arrête le sous-arbre d'une unité, et le gardien du budget gèle une unité qui dépasse.",
    "groups": {
     "newWork": "Arrête le nouveau travail",
     "inFlight": "Arrête le travail en cours"
    },
    "boxes": {
     "freeze": {
      "title": "Gel",
      "body": "Arrête un agent, un déploiement, un gardien, une application, une unité ou une organisation jusqu'à ce qu'une personne le lève."
     },
     "killSwitch": {
      "title": "Arrêt d'urgence",
      "body": "Aucun gardien du locataire ne se réveille. Les invocations ordinaires continuent."
     },
     "spendCap": {
      "title": "Plafond de dépense",
      "body": "Le budget d'un gardien par cycle et par jour. Une journée épuisée le passe en CapReached."
     },
     "unitBudget": {
      "title": "Budget d'unité",
      "body": "Un plafond par jour ou par mois sur tout ce qu'exécute le sous-arbre d'une unité."
     },
     "checks": {
      "title": "Vérifications à l'admission et au réveil",
      "body": "Faites dans le plan de contrôle, jamais par l'agent. Un gel atteint chaque réplique par le backplane."
     },
     "refused": {
      "title": "Exécution refusée",
      "body": "409 Frozen ou BudgetExhausted. Rien n'est créé."
     },
     "skipped": {
      "title": "Réveil sauté",
      "body": "Enregistré comme un cycle ignoré avec son code, et le calendrier avance."
     },
     "cancelAll": {
      "title": "Tout annuler",
      "body": "Annule les exécutions et les cycles du sous-arbre d'une unité, retire ses escalades et fait expirer son courrier. Ne gèle rien."
     },
     "autoFreeze": {
      "title": "Gel automatique",
      "body": "Quand un sous-arbre dépense son budget plus la marge, le gardien gèle l'unité et annule ses exécutions."
     }
    },
    "arrows": {
     "refuses": "nouvelle exécution",
     "skips": "réveil d'un gardien"
    }
   }
  },
  "glossary": {
   "tenant": {
    "term": "Locataire",
    "def": "La frontière autour des agents, exécutions, utilisateurs et réglages d'un client. Une lecture d'un locataire à l'autre répond 404."
   },
   "agent": {
    "term": "Agent IA",
    "def": "Ce que l'on invoque. Sa configuration vit dans des révisions immuables."
   },
   "deployment": {
    "term": "Déploiement",
    "def": "Un agent relié à un profil de harness, un modèle, des prompts et un pool de nœuds. Un agent peut en avoir plusieurs, choisis selon leur poids."
   },
   "harnessProfile": {
    "term": "Profil de harness",
    "def": "Comment une CLI de harness ou une API de fournisseur tourne sans interface : arguments, transmission du prompt et analyseur de sortie. Le tableau de bord les range sous Connexions."
   },
   "nodePool": {
    "term": "Pool de nœuds",
    "def": "Un groupe de nœuds worker qu'un déploiement peut cibler, réservable à certains locataires."
   },
   "node": {
    "term": "Nœud worker",
    "def": "Un processus qui récupère des exécutions et lance des harnesses. Il ne touche jamais la base de données."
   },
   "run": {
    "term": "Exécution",
    "def": "Une exécution d'un agent. Les cycles de gardien, les réveils par message, les cas d'évaluation et les copies fantômes sont des exécutions de leur propre type."
   },
   "runToken": {
    "term": "Jeton d'exécution",
    "def": "L'identifiant que chaque exécution reçoit pour les outils MCP de Garrison. Il n'a jamais les permissions de gel."
   },
   "keeper": {
    "term": "Gardien",
    "def": "Un agent avec une mission permanente que Garrison réveille selon un calendrier. L'API l'appelle mandate."
   },
   "tick": {
    "term": "Cycle",
    "def": "Un réveil d'un gardien : une seule exécution qui se termine en rapportant un résultat et un résumé."
   },
   "message": {
    "term": "Message",
    "def": "Du courrier d'un agent à un autre, ou d'une personne. L'expéditeur n'attend pas de réponse."
   },
   "line": {
    "term": "Ligne",
    "def": "Ce qui permet à un agent d'écrire à un autre : une arête d'application, une ligne hiérarchique, une ligne transversale ou une réponse dans un fil."
   },
   "loopGuards": {
    "term": "Garde-fous anti-boucle",
    "def": "Les vérifications de chaque message : destinataire gelé, aucune ligne, limite de sauts, budget du fil et débit de la ligne."
   },
   "report": {
    "term": "Rapport",
    "def": "La façon dont un agent dit à ceux du dessus comment avance son travail. Un rapport déposé ne change jamais."
   },
   "memory": {
    "term": "Mémoire",
    "def": "Du texte qu'un agent garde d'une exécution à l'autre, dans une portée agent, application, unité organisationnelle ou organisation."
   },
   "escalation": {
    "term": "Escalade",
    "def": "Une question qu'une exécution pose quand elle ne devrait pas décider seule. Une personne, un rôle ou un autre agent y répond."
   },
   "organization": {
    "term": "Organisation",
    "def": "Un arbre d'unités qui donne une forme à un groupe d'agents. Rien n'y prend effet avant qu'une personne publie une révision."
   },
   "unit": {
    "term": "Unité",
    "def": "Un nœud de l'arbre : responsable, membres, lignes transversales et budgets."
   },
   "board": {
    "term": "Comité",
    "def": "Les personnes qui dirigent une organisation. Elles siègent au-dessus de son CEO."
   },
   "chain": {
    "term": "Chaîne de commandement",
    "def": "Qui dirige qui, lu uniquement dans les révisions publiées des organisations en service."
   },
   "executive": {
    "term": "Dirigeant",
    "def": "Le responsable d'une unité qui peut proposer des changements aux unités en dessous, dans des limites strictes."
   },
   "changeRule": {
    "term": "Règle de changement",
    "def": "Un oui permanent d'une personne pour une catégorie étroite de changements d'un dirigeant. Seules des personnes les écrivent."
   },
   "evalSet": {
    "term": "Jeu d'évaluation",
    "def": "Des entrées fixes avec des vérifications. Une exécution d'évaluation note une révision d'agent ou un déploiement avec elles."
   },
   "shadowTrial": {
    "term": "Essai fantôme",
    "def": "Copie un échantillon d'entrées réelles vers un déploiement candidat qui ne peut avoir aucun effet, et compare les réponses."
   },
   "canary": {
    "term": "Diffusion canari",
    "def": "Déplace le trafic vers un déploiement candidat par étapes et revient en arrière quand son taux d'erreur ou son score franchit un seuil."
   },
   "freeze": {
    "term": "Gel",
    "def": "Arrête les nouvelles exécutions d'une cible jusqu'à ce qu'une personne le lève."
   },
   "killSwitch": {
    "term": "Arrêt d'urgence",
    "def": "Un gel de l'autonomie sur tout le locataire. Aucun gardien ne se réveille, et les invocations ordinaires continuent."
   },
   "unitBudget": {
    "term": "Budget d'unité",
    "def": "Un plafond par jour ou par mois sur ce que le sous-arbre d'une unité peut dépenser."
   }
  }
 },
 "components": {
  "explainer": {
   "seeDiagram": "Voir le schéma"
  }
 }
});

// The organization designer's checks (LP3.7): errors and warnings, and every code of the validate route.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(fr, {
 "components": {
  "orgDesigner": {
   "problems": {
    "errors_one": "Erreurs : {{count}}",
    "errors_other": "Erreurs : {{count}}",
    "warnings_one": "Avertissements : {{count}}",
    "warnings_other": "Avertissements : {{count}}",
    "warningsOnly": "Il ne reste que des avertissements : l'arbre de travail peut donc toujours être publié.",
    "OneRoot": "L'organisation a plusieurs unités racines, dont {{unit}}.",
    "Cycle": "{{unit}} se trouve sous elle-même.",
    "UnitNameTaken": "Deux unités s'appellent {{unit}}.",
    "TooManyUnits": "L'organisation a plus d'unités qu'elle ne peut en contenir.",
    "TooManyMembers": "{{unit}} a plus de membres qu'une unité ne peut en avoir.",
    "TooManyPeerLines": "{{unit}} a plus de lignes transversales qu'une unité ne peut en avoir.",
    "BudgetPeriodTaken": "{{unit}} a deux budgets pour la même période.",
    "BudgetInvalid": "Un budget de {{unit}} n'est pas un montant valide.",
    "AgentInactive": "{{agent}} dans {{unit}} n'est pas actif.",
    "MandateMismatch": "Le gardien {{mandate}} dans {{unit}} n'appartient pas à {{agent}}."
   }
  }
 }
});

// LP4.5 to LP4.9: the guided tours (engine, list, sample data offer, Home card, wizard next step); the trail's
// entry surfaces and the Shadowed and Delivered edges (LP1.12, LP1.13); the kill switch also refuses message wakes.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(fr, {
 "tours": {
  "ui": {
   "finding": "Recherche de l'étape suivante...",
   "skippedMissing": "Étape {{step}} passée, car elle n'est pas sur la page pour l'instant.",
   "skippedNoRecord": "Étape {{step}} passée : ce locataire n'a encore rien à montrer ici.",
   "endTitle": "Fin de la visite",
   "endBody": "Vous avez fait le tour de {{tour}}. Vous pouvez la refaire quand vous voulez depuis Apprendre ou depuis Visite guidée dans la barre latérale."
  },
  "hub": {
   "label": "Lancer la visite {{tour}}"
  },
  "picker": {
   "title": "Visites guidées",
   "intro": "Chaque visite parcourt les vraies pages d'une tâche, quelques étapes à la fois. Les visites terminées sont marquées, et vous pouvez refaire n'importe laquelle.",
   "start": "Lancer",
   "replay": "Refaire",
   "finished": "Terminée",
   "learn": "Ouvrir Apprendre",
   "steps_one": "{{count}} étape",
   "steps_other": "{{count}} étapes"
  },
  "sample": {
   "title": "Charger un exemple ?",
   "body": "{{tour}} a besoin d'{{need}}, et ce locataire n'en a pas encore. Vous pouvez charger {{example}} en appliquant son manifeste, ou continuer sans et passer les étapes qui n'ont rien à montrer.",
   "contents_one": "Le chargement applique {{count}} ressource :",
   "contents_other": "Le chargement applique {{count}} ressources :",
   "checking": "Vérification de ce que l'application changerait...",
   "fake": "Tout tourne sur le harnais factice : aucun identifiant n'est nécessaire et cela ne coûte rien. Ses gardiens commencent à se réveiller en quelques secondes.",
   "runsLater": "Les étapes sur l'exécution demandent une exécution. Le premier cycle d'un gardien en crée une quelques secondes après l'application.",
   "load": "Charger l'exemple",
   "loading": "Chargement...",
   "continue": "Continuer sans",
   "loaded": "{{example}} chargé.",
   "needs": {
    "agents": "un agent",
    "runs": "une exécution",
    "keepers": "un gardien",
    "organizations": "une organisation"
   },
   "examples": {
    "gerbil": "l'exemple gerbil",
    "siteReliability": "l'exemple fiabilité du site"
   }
  },
  "homeCard": {
   "title": "Nouveau ici ? Commencez par Apprendre",
   "body": "La page Apprendre montre comment les parties de Garrison s'assemblent, avec de courtes visites des vraies pages.",
   "open": "Ouvrir Apprendre",
   "dismiss": "Masquer"
  },
  "wizard": {
   "nextTitle": "Et ensuite",
   "nextBody": "La page Apprendre explique comment les parties s'assemblent, et la visite Exécuter un agent suit le même chemin dans le tableau de bord.",
   "learn": "Ouvrir Apprendre",
   "tour": "Faire la visite Exécuter un agent"
  },
  "firstLook": {
   "summary": "La barre latérale, la barre du haut, l'accueil et où trouver de l'aide.",
   "steps": {
    "sidebar": {
     "title": "Navigation",
     "body": "Tout est regroupé en espaces sur ce côté. Les pages d'un espace apparaissent en onglets en haut, et chaque onglet a son propre lien."
    },
    "topbar": {
     "title": "Où vous êtes",
     "body": "La barre du haut indique le serveur et le locataire où vous travaillez, avec quel compte vous êtes connecté, et si le serveur va bien et les mises à jour arrivent en direct."
    },
    "kpis": {
     "title": "En un coup d'œil",
     "body": "Ce qui se passe en ce moment : agents, déploiements, exécutions actives ou en échec aujourd'hui, et les nœuds de travail prêts à recevoir du travail. Cliquez sur une carte pour ouvrir la liste correspondante."
    },
    "invoke": {
     "title": "Invoquer",
     "body": "Le moyen le plus rapide d'essayer un agent. Choisissez-en un, envoyez-lui un message et regardez sa réponse arriver."
    },
    "autonomy": {
     "title": "Des agents qui travaillent seuls",
     "body": "Confiez une mission permanente à un agent et il travaille sans qu'on le lui demande. Un gardien le réveille selon un planning et, entre deux réveils, il peut écrire à d'autres agents, déposer des rapports, retenir ce qu'il a appris et vous escalader une question. Un gel arrête tout cela immédiatement."
    },
    "organizations": {
     "title": "Organisations",
     "body": "Répartissez les agents en unités comme une équipe : un responsable, des membres et un budget. Le comité montre comment va chaque unité, et les règles de changement décident quels changements le dirigeant d'une unité peut faire sans vous demander."
    },
    "help": {
     "title": "Aide",
     "body": "L'assistant de configuration relance la première configuration, Visite guidée liste toutes les visites, et Apprendre montre en diagrammes comment tout s'assemble. Le bouton ? d'une page lance sa visite."
    }
   }
  },
  "runAnAgent": {
   "summary": "D'une connexion à un agent, un déploiement, une invocation et l'exécution qui en résulte.",
   "steps": {
    "connections": {
     "title": "Connexions",
     "body": "Une connexion indique à Garrison comment démarrer le moteur d'un agent : quelle CLI ou API lancer, comme Claude Code ou Codex, et avec quels réglages. Configurée une fois, tout déploiement peut l'utiliser."
    },
    "agents": {
     "title": "Agents",
     "body": "Un agent est ce que les appelants demandent par son nom, via REST, MCP ou A2A, et il définit la forme de ses réponses. Il n'exécute rien tant qu'il n'a pas de déploiement."
    },
    "deployments": {
     "title": "Déploiements",
     "body": "Un déploiement est la partie qui s'exécute : une connexion, un modèle, des prompts et des limites pour un agent. Avec deux déploiements, les appels se répartissent selon leur poids, ce qui permet d'essayer un nouveau modèle sur une partie du trafic."
    },
    "invoke": {
     "title": "Invoquer",
     "body": "Choisissez un agent, et un déploiement précis si vous voulez, écrivez un message et appuyez sur Envoyer. La sortie s'affiche à côté du formulaire."
    },
    "run": {
     "title": "L'exécution",
     "body": "Chaque invocation est une exécution. Sa page affiche en haut l'état et l'ID, avec des onglets pour la transcription, le résultat, l'entrée et plus encore."
    },
    "trail": {
     "title": "L'onglet Parcours",
     "body": "Parcours suit la requête à travers chaque agent jusqu'à la réponse. La visite Suivre une requête le présente."
    }
   }
  },
  "followARequest": {
   "summary": "L'onglet Parcours d'une exécution : ses trois vues, les totaux et le détail des étapes.",
   "steps": {
    "views": {
     "title": "Trois vues",
     "body": "Séquence donne à chaque agent un couloir, le temps descendant. Graphe place chaque étape après ce qui l'a causée. Liste montre chaque étape sur une ligne que vous pouvez filtrer."
    },
    "summary": {
     "title": "Les totaux",
     "body": "Combien d'agents ont participé, combien de messages ont circulé entre eux, combien de temps cela a pris, les tokens et le coût, et combien d'étapes ont échoué."
    },
    "steps": {
     "title": "Étapes",
     "body": "Chaque case est une étape : une exécution, un message, un rapport, une escalade, une approbation ou un appel d'outil. Les flèches passent d'une étape à l'autre, et Entrée en ouvre une."
    },
    "drawer": {
     "title": "Détail d'une étape",
     "body": "Le panneau montre l'état, les horaires et le coût d'une étape. Le texte écrit par un agent s'affiche comme des données, avec son auteur, et Ouvrir l'enregistrement mène à l'enregistrement complet."
    },
    "actions": {
     "title": "Actualiser et exporter",
     "body": "Tant qu'une étape tourne encore, le parcours s'actualise à l'intervalle choisi ici. Exporter en JSON télécharge les étapes et leurs liens, sans aucun texte écrit par des agents."
    }
   }
  },
  "buildATeam": {
   "summary": "L'onglet Conception d'une organisation : le canevas, les personnes, les gardiens, les budgets et la publication.",
   "steps": {
    "canvas": {
     "title": "Le canevas",
     "body": "Chaque case est une unité, avec son responsable et ses membres en haut et, à l'intérieur, les unités qui lui rendent compte. Les lignes entre les cases sont des liens entre pairs, qui permettent à deux unités de s'écrire directement."
    },
    "palette": {
     "title": "Personnes",
     "body": "Faites glisser un agent de cette liste sur une unité, ou choisissez-en un puis l'unité et s'il la dirige ou la rejoint."
    },
    "keepers": {
     "title": "Gardiens",
     "body": "Quand une unité est sélectionnée, cet onglet liste qui y a un gardien. Rattachez-en un, créez-en un nouveau ou changez quand il se réveille."
    },
    "budget": {
     "title": "Budget",
     "body": "Donnez à l'unité un plafond par jour ou par mois. Il couvre tout ce qu'exécutent l'unité et chaque unité en dessous."
    },
    "publish": {
     "title": "Publier",
     "body": "Les changements sont enregistrés tout de suite dans l'arbre de travail, mais rien n'entre en vigueur avant que vous publiiez ici. Chaque révision est conservée, vous pouvez donc revenir en arrière."
    }
   }
  },
  "keepItSafe": {
   "summary": "Les freins : l'arrêt d'urgence, les gels, les plafonds de dépense, les règles de changement et les approbations.",
   "steps": {
    "killSwitch": {
     "title": "Arrêt d'urgence",
     "body": "Activé, aucun gardien du locataire ne se réveille, et aucun message ne réveille un agent non plus. Les invocations ordinaires continuent de fonctionner."
    },
    "freezes": {
     "title": "Gels",
     "body": "Un gel refuse les nouvelles exécutions d'un agent, d'un déploiement, d'un gardien ou d'une app jusqu'à ce qu'une personne le lève. Les unités et les organisations entières se gèlent depuis leur comité."
    },
    "spendCaps": {
     "title": "Plafonds de dépense",
     "body": "Un gardien peut avoir un budget par cycle et par jour. Quand le budget du jour est épuisé, il s'arrête jusqu'au jour UTC suivant et vous envoie une escalade urgente."
    },
    "changeRules": {
     "title": "Règles de changement",
     "body": "Les règles approuvent d'avance des changements courants qu'un dirigeant peut faire dans les unités sous lui. Seules des personnes les écrivent, et tout ce qu'aucune règle ne couvre attend une personne."
    },
    "approvals": {
     "title": "Approbations",
     "body": "Quand un déploiement demande avant ses appels d'outils, ceux qui ont besoin d'une personne attendent ici. Autorisez ou refusez chacun, et gardez la réponse comme règle si vous voulez."
    }
   }
  },
  "watchAnOrganization": {
   "summary": "Le comité, les performances, les rapports et les escalades d'une organisation.",
   "steps": {
    "board": {
     "title": "Le comité",
     "body": "Commencez ici pour voir comment va une organisation. Chaque unité affiche son état d'après son dernier rapport, ses escalades ouvertes, les freins en place et son dernier rapport, sur l'organigramme et dans un tableau."
    },
    "attention": {
     "title": "Demande votre attention",
     "body": "Ce qui demande une personne maintenant : escalades ouvertes, rapports en mauvaise santé et unités à leur plafond de budget. Traitez cette liste en premier."
    },
    "performance": {
     "title": "Performances",
     "body": "Comparez les unités sur la période choisie : exécutions, résultats, coût, latence et escalades. Une unité qui escalade souvent ou coûte plus que les autres est celle à examiner."
    },
    "reports": {
     "title": "Rapports",
     "body": "Ce que les exécutions et les personnes ont déposé sur l'état des choses. Un rapport déposé ne peut pas être modifié, et son texte s'affiche comme des données, jamais comme des instructions."
    },
    "escalations": {
     "title": "Escalades",
     "body": "Les questions que des agents ont posées à une personne, un rôle ou un autre agent. Les ouvertes viennent en premier. Répondez ici et l'agent qui a demandé reçoit votre réponse."
    }
   }
  }
 },
 "trail": {
  "entrySurfaces": {
   "Rest": "API REST",
   "Mcp": "MCP",
   "A2a": "A2A",
   "App": "Application",
   "Dashboard": "Tableau de bord",
   "Trigger": "Déclencheur",
   "Keeper": "Gardien",
   "Message": "Message",
   "Escalation": "Escalade",
   "Eval": "Évaluation",
   "Shadow": "Fantôme",
   "Internal": "Interne"
  },
  "columns": {
   "entrySurface": "Arrivée par"
  },
  "drawer": {
   "fields": {
    "entrySurface": "Arrivée par"
   }
  },
  "edges": {
   "Shadowed": "a copié en fantôme",
   "Delivered": "a remis"
  }
 },
 "learn": {
  "diagrams": {
   "brakes": {
    "boxes": {
     "killSwitch": {
      "body": "Aucun gardien du locataire ne se réveille, et aucun message ne réveille un agent. Les invocations ordinaires continuent de fonctionner."
     }
    }
   }
  },
  "glossary": {
   "killSwitch": {
    "def": "Un gel de l'autonomie pour tout le locataire. Aucun gardien ne se réveille et aucun message ne réveille un agent, tandis que les invocations ordinaires continuent de fonctionner."
   }
  }
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
})(fr, {
 "components": {
  "turnActivity": {
   "worker": "En attente d'un nœud de travail",
   "approval": "En attente d'une approbation",
   "tool": "{{tool}} en cours",
   "working": "Travaille sur l'étape suivante",
   "quiet": "Aucune nouvelle sortie depuis {{time}}. L'exécution est toujours à l'état {{status}}."
  }
 }
});

// App appearance (LP8.4): the appearance step, palettes, starter prompts, and the preview.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(fr, {
 "resources": {
  "apps": {
   "steps": {
    "appearance": "Apparence"
   },
   "fields": {
    "appearance": "Apparence",
    "subtitle": "Sous-titre",
    "welcomeTitle": "Titre d'accueil",
    "composerPlaceholder": "Texte indicatif de la zone de message",
    "agentDisplayName": "Nom de l'agent sur les messages",
    "agentAvatarAssetId": "Avatar de l'agent",
    "paletteId": "Palette de couleurs",
    "themeDefault": "Thème par défaut",
    "allowThemeSwitch": "Permettre de passer du clair au sombre",
    "cornerStyle": "Coins",
    "density": "Densité",
    "showFilesPanel": "Afficher la liste des fichiers",
    "showLanguagePicker": "Afficher le choix de la langue",
    "showPoweredBy": "Afficher la mention de la plateforme",
    "starterPrompts": "Questions de départ"
   },
   "hints": {
    "subtitle": "Une ligne courte sous le nom, dans l'en-tête et sur l'écran d'accueil. 200 caractères au plus.",
    "welcomeTitle": "Le titre affiché avant le premier message. Vide, il reprend le nom affiché. 120 caractères au plus.",
    "composerPlaceholder": "Le texte gris de la zone de message vide. 120 caractères au plus.",
    "agentDisplayName": "L'auteur affiché des réponses. Vide, il reprend le nom affiché. 80 caractères au plus.",
    "agentAvatarAssetId": "Une petite image ronde à côté du nom de l'agent sur chaque réponse.",
    "starterPrompts": "Jusqu'à 4 boutons dans une nouvelle conversation. Un clic envoie la question comme premier message.",
    "allowThemeSwitch": "Désactivé, le bouton clair et sombre disparaît et un choix enregistré plus tôt est ignoré."
   },
   "noAvatar": "Pas d'avatar",
   "placeholders": {
    "subtitle": "Par exemple : Les réponses de l'équipe de recherche"
   }
  }
 },
 "enums": {
  "appThemeDefault": {
   "System": "Comme le système",
   "Light": "Clair",
   "Dark": "Sombre"
  },
  "appCornerStyle": {
   "Sharp": "Carrés",
   "Rounded": "Arrondis",
   "Pill": "Pastille"
  },
  "appDensity": {
   "Compact": "Compacte",
   "Comfortable": "Confortable"
  }
 },
 "components": {
  "appAppearance": {
   "sections": {
    "text": "Textes",
    "images": "Visuels",
    "colors": "Couleurs",
    "layout": "Thème et mise en page",
    "show": "Ce que la page affiche",
    "prompts": "Questions de départ",
    "preview": "Aperçu"
   },
   "palettes": {
    "garrison": "Bleu canard Garrison",
    "slate": "Ardoise",
    "ocean": "Océan",
    "forest": "Forêt",
    "sunset": "Coucher de soleil",
    "plum": "Prune",
    "graphite": "Gris graphite",
    "contrast": "Contraste élevé",
    "custom": "Personnalisée",
    "none": "Couleurs intégrées"
   },
   "paletteCurrent": "Palette de couleurs : {{name}}",
   "resetColors": "Revenir aux couleurs intégrées",
   "columns": {
    "role": "Couleur",
    "light": "Clair",
    "dark": "Sombre"
   },
   "derived": "Déduit du clair",
   "sameAsLight": "Identique au clair",
   "builtIn": "Couleur sombre intégrée",
   "contrastWarning": "Contraste du texte {{ratio}}:1, sous le minimum AA de 4,5:1",
   "darkLabel": "{{field}}, thème sombre",
   "image": {
    "upload": "Envoyer une image",
    "uploading": "Envoi en cours...",
    "uploaded": "Envoyée comme ressource {{name}}.",
    "notImage": "Choisissez un fichier image : PNG, JPEG, GIF, WebP, SVG ou ICO.",
    "assetDescription": "{{role}} de l'app {{app}}, envoyé depuis l'éditeur d'apps."
   },
   "prompts": {
    "count": "{{count}} questions sur {{max}}",
    "chars": "{{count}}/{{max}} caractères",
    "label": "Question de départ {{number}}",
    "placeholder": "Par exemple : Résume les nouveautés de la semaine",
    "empty": "Aucune question de départ pour l'instant. La conversation commence avec une zone de message vide.",
    "keys": "Dans la zone d'une question, Alt+Haut et Alt+Bas la déplacent.",
    "add": "Ajouter une question",
    "moveUp": "Monter la question {{number}}",
    "moveDown": "Descendre la question {{number}}",
    "remove": "Retirer la question {{number}}"
   },
   "preview": {
    "appName": "Votre app",
    "welcomeDefault": "Posez une question pour commencer.",
    "light": "Clair",
    "dark": "Sombre",
    "you": "Vous",
    "question": "Qu'est-ce qui a changé cette semaine ?",
    "answer": "Voici un court résumé des changements de la semaine.",
    "placeholder": "Écrivez un message",
    "poweredBy": "Créée avec Garrison Agent Studio",
    "note": "Une esquisse de la page de l'app qui suit vos modifications. Ouvrez le lien de l'app pour voir la vraie page."
   }
  }
 }
});

// Shared tables and states (LP5.5): the default-view empty message, the load error status, and row labels.
(function mergeCatalog(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      mergeCatalog(target[key], value);
    } else {
      target[key] = value;
    }
  }
})(fr, {
 "components": {
  "table": {
   "noneInDefaultView": "Rien dans la vue par défaut. D'autres enregistrements existent en dehors.",
   "showAll": "Tout afficher",
   "errorStatus": "Statut {{status}}."
  }
 },
 "resources": {
  "runs": {
   "emptyAction": "Invoquer un agent"
  }
 },
 "views": {
  "organizationDetail": {
   "revisionLabel": "Révision {{number}}"
  }
 },
 "evals": {
  "setDetail": {
   "caseLabel": "Cas {{order}}"
  }
 }
});
