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
    tenantId: 'ID du locataire',
    email: 'E-mail',
    password: 'Mot de passe',
    accessKey: 'Clé d\'accès',
    secretKey: 'Clé secrète',
    submit: 'Se connecter',
    connecting: 'Connexion...',
    restoring: 'Restauration de votre session...',
    errorGeneric: 'Connexion impossible. Vérifiez l\'URL du serveur et vos identifiants.',
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
