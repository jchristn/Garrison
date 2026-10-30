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
    footerHint: 'Valeur par défaut en développement local : admin@garrison dans le locataire default.'
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
      selected_one: '{{count}} sélectionné',
      selected_other: '{{count}} sélectionnés',
      selected_many: '{{count}} sélectionnés',
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
        inputSchemaJson: 'JSON Schema d\'entrée',
        outputSchemaJson: 'JSON Schema de sortie',
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
      grafanaSections: { overview: 'Vue d\'ensemble', http: 'API HTTP', runs: 'Exécutions', agents: 'Agents', models: 'Modèles et jetons', workers: 'Nœuds worker', kubernetes: 'Exécuteur Kubernetes', protocols: 'Protocoles', scheduler: 'Planificateur et file', database: 'Base de données', controlPlane: 'Plan de contrôle', security: 'Sécurité et authentification', integrations: 'Intégrations', logs: 'Journaux et traces' },
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
    "inputSchemaJson": "Schéma d'entrée",
    "outputSchemaJson": "Schéma de sortie"
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
    "inputSchemaJson": "Schéma d'entrée",
    "outputSchemaJson": "Schéma de sortie"
   },
   "hints": {
    "kind": "Les entrées manuelles peuvent être de n'importe quel type, par exemple un service de conversion que les agents atteignent via une ressource Skill.",
    "requirements": "Une exécution d'un agent qui utilise cette capacité ne va qu'aux workers qui portent chacune de ces étiquettes de nœud.",
    "sourceMcpServerId": "Facultatif. Un jeton d'exécution ne voit une entrée qui nomme un serveur que si son déploiement lie ce serveur.",
    "inputSchemaJson": "Un JSON Schema, par exemple {\"type\": \"object\"}. Laissez vide si la capacité accepte du texte libre."
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
    "notCredentialedBody": "Son harness n'a pas d'identifiants valides (Claude Code l'indique par Not logged in). Donnez à {{architect}} un secret d'identifiants sur la page Architectes, ou vérifiez la valeur du secret.",
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
    "s3": "Affichez le fichier de connexion et collez-le en entier dans Valeur :",
    "s4": "Supprimez ce dossier et n'utilisez cette connexion nulle part ailleurs. Garrison la renouvelle désormais :",
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
