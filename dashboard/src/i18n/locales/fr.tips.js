// French tooltip (tips.*) and relationship explainer (explainers.*) text. Merged into fr.js. Mirrors en.tips.js key for key.

const TELEMETRY = {
  approvalWaitMs: 'Attente d\'approbation : temps total que cette exécution a passé à attendre des approbations d\'autorisation décidées par une personne ou un délai d\'expiration. Les appels décidés immédiatement par une règle ou la valeur par défaut du déploiement n\'ajoutent rien. Mesuré par le serveur ; n/d si l\'exécution n\'a jamais attendu.',
  delegationWaitMs: 'Attente de délégation : combien de temps cette exécution a attendu les exécutions enfants lancées via Garrison (les autres agents à qui elle a délégué), d\'après les horodatages du serveur de ces exécutions. Zéro ou n/d si l\'exécution n\'a rien délégué.',
  timeToFirstTokenExcludingDelegationMs: 'Délai avant le premier jeton hors délégation : le délai avant le premier jeton moins le temps que l\'exécution a passé à attendre les exécutions déléguées avant sa première sortie. Utilisez-le pour comparer les agents qui délèguent à ceux qui ne délèguent pas. Mesuré avec les horodatages du serveur ; jamais négatif.',
  timeToFirstTokenMs: 'Délai avant le premier jeton : du démarrage du processus de harness par le worker jusqu\'à la première sortie du modèle (texte ou réflexion). Il inclut le démarrage du harness, donc une CLI lente à démarrer apparaît ici. Mesuré sur le worker avec une horloge monotone.',
  streamingMs: 'Durée de streaming : de la première à la dernière sortie du modèle. C\'est le temps pendant lequel le modèle a réellement produit du contenu. Mesuré sur le worker avec une horloge monotone.',
  executionMs: 'Durée d\'exécution : du démarrage à la fin du processus de harness, telle que mesurée par le worker. Les serveurs plus anciens qui ne la signalent pas se rabattent sur les horodatages de début et de fin.',
  queueMs: 'Temps en file d\'attente : durée pendant laquelle l\'exécution a attendu entre sa mise en file et sa prise en bail par un nœud worker. Des valeurs élevées signifient que tous les nœuds éligibles étaient occupés ou qu\'aucun ne correspondait aux règles de placement. Mesuré par le serveur.',
  totalMs: 'Durée totale : de la mise en file à la fin, soit le temps en file d\'attente, plus l\'exécution, plus la remontée du résultat. Mesuré par le serveur.',
  outputTokensPerSecond: 'Jetons de sortie par seconde : jetons de sortie divisés par la durée de streaming. Affiché uniquement si le streaming a duré au moins 100 ms, car des fenêtres plus courtes donnent des débits sans signification.',
  inputTokens: 'Jetons d\'entrée signalés par le harness pour toute l\'exécution, y compris le prompt système, les résultats d\'outils et l\'historique de conversation sur l\'ensemble des tours.',
  outputTokens: 'Jetons de sortie générés par le modèle sur tous les tours de l\'exécution, tels que signalés par l\'analyseur du harness.',
  cachedTokens: 'Jetons d\'entrée servis depuis le cache de prompts du fournisseur. Les jetons en cache sont généralement facturés à un tarif inférieur : une part élevée ici réduit le coût.',
  reasoningTokens: 'Jetons de raisonnement ou de réflexion, lorsque le harness les signale séparément (par exemple la sortie de raisonnement de Codex). Zéro lorsque le harness ne les distingue pas.',
  toolCallCount: 'Nombre d\'événements d\'appel d\'outil dans l\'exécution : outils MCP, outils intégrés du harness et appels à d\'autres agents Garrison. Compté par le worker à partir du flux d\'événements.',
  costUsd: 'Coût en dollars américains tel que signalé par le harness. Marqué comme estimé lorsque Garrison l\'a calculé à partir du nombre de jetons au lieu de le recevoir du harness.',
  firstTokenUtc: 'Heure réelle (UTC, affichée dans votre fuseau horaire) du premier événement de sortie du modèle dans l\'exécution.',
  lastTokenUtc: 'Heure réelle (UTC, affichée dans votre fuseau horaire) du dernier événement de sortie du modèle dans l\'exécution.'
};

const FILE_ITEMS = {
  baseDirectory: 'Répertoire par rapport auquel le chemin est relatif : le répertoire de configuration de l\'exécution, l\'espace de travail ou le répertoire HOME de l\'exécution.',
  pathTemplate: 'Chemin relatif du fichier à écrire avant le lancement. Les modèles sont autorisés, par exemple settings/{{run.id}}.json.',
  contentTemplate: 'Modèle rendu dans le contenu du fichier. Il peut référencer des variables et des secrets liés avec {{secret.alias}}.',
  condition: 'Expression de modèle ; lorsqu\'elle produit une valeur vide ou false, le fichier n\'est pas écrit.',
  mode: 'Mode de fichier Unix en octal, par exemple 0600 pour les fichiers contenant des identifiants.',
  isSecret: 'Traiter le contenu rendu comme secret : il n\'est jamais journalisé et il est masqué dans les aperçus de compilation.'
};

const tips = {
  approvals: {
    awaiting_one: 'Le harness a demandé l\'accord avant un appel d\'outil et attend une personne. Ouvrez l\'onglet Approbations pour l\'autoriser ou le refuser ({{count}} en attente).',
    awaiting_other: 'Le harness a demandé l\'accord avant des appels d\'outil et attend une personne. Ouvrez l\'onglet Approbations pour les autoriser ou les refuser ({{count}} en attente).',
    awaiting_many: 'Le harness a demandé l\'accord avant des appels d\'outil et attend une personne. Ouvrez l\'onglet Approbations pour les autoriser ou les refuser ({{count}} en attente).',
    decide: {
      decision: 'Choisissez si le harness peut effectuer cet appel d\'outil. L\'exécution reprend dès que vous validez.',
      allow: 'Laisser le harness effectuer cet appel d\'outil. L\'exécution continue avec lui.',
      deny: 'Refuser cet appel d\'outil. Le harness reçoit le message de refus et continue sans lui.',
      reason: 'Note facultative enregistrée avec la décision et écrite dans le journal d\'audit. En cas de refus, elle est transmise à l\'agent.',
      remember: 'Ajouter aussi une règle au déploiement de cette approbation, pour que le même type d\'appel soit décidé automatiquement la prochaine fois.',
      rulePattern: 'La règle à ajouter, dans la syntaxe des règles Claude Code. Elle part de la règle suggérée ; élargissez-la ou restreignez-la avant d\'enregistrer.',
      submitAllow: 'Autoriser l\'appel d\'outil maintenant. La décision est définitive et ne peut plus être modifiée ensuite.',
      submitDeny: 'Refuser l\'appel d\'outil maintenant. La décision est définitive et ne peut plus être modifiée ensuite.'
    }
  },
  approvalCheck: {
    toolName: 'Nom de l\'outil tel que le harness le signale, par exemple Bash, Edit, WebFetch ou un outil MCP comme mcp__github__create_issue.',
    inputs: {
      command: 'La commande shell à tester, par exemple npm run build && npm test. Chaque sous-commande doit être autorisée.',
      url: 'L\'URL que l\'outil récupérerait. Les règles WebFetch portent sur son domaine.',
      query: 'La requête de recherche que l\'outil enverrait.',
      file_path: 'Chemin du fichier que l\'outil lirait ou modifierait, relatif à l\'espace de travail ou absolu.',
      notebook_path: 'Chemin du notebook que l\'outil modifierait.',
      pattern: 'Le motif glob ou de recherche que l\'outil utiliserait.'
    },
    run: 'Évaluer les règles enregistrées du déploiement pour cet appel d\'outil et afficher le résultat. Rien n\'est consigné et aucune exécution n\'est affectée.',
    suggestedRule: 'La règle que « mémoriser » ajouterait pour cet appel. Copiez-la dans les règles ci-dessus pour couvrir des appels similaires.'
  },
  ids: { deleted: 'Cet enregistrement a été supprimé. ID {{id}}. Le bouton de copie copie l\'ID.', named: 'ID {{id}}. Le bouton de copie copie l\'ID pour l\'API, les SDK ou une demande d\'assistance.' },
  markdown: {
    column: 'Colonne {{name}} d\'un tableau de la sortie de l\'agent. Les tableaux larges défilent horizontalement dans leur cadre.',
    showRaw: 'Affiche le texte exact renvoyé par l\'agent, sans mise en forme Markdown, pour l\'examiner ou le copier.',
    showRendered: 'Affiche à nouveau le texte mis en forme en Markdown, avec tableaux, listes, blocs de code et liens.',
    copy: 'Copie dans le presse-papiers le texte brut du résultat, syntaxe Markdown comprise.',
    link: 'Ouvre {{href}} dans un nouvel onglet. Le lien provient de la sortie de l\'agent, vérifiez donc l\'adresse avant de lui faire confiance.'
  },
  common: {
    fields: {
      name: 'Nom unique de cet enregistrement au sein du locataire. Les autres enregistrements et les manifestes y font référence par ce nom.',
      description: 'Note libre destinée aux personnes. Elle explique à quoi sert cet enregistrement et n\'est pas utilisée à l\'exécution.',
      active: 'Les enregistrements inactifs sont conservés mais ignorés. Désactivez cette option pour suspendre un élément sans le supprimer.',
      id: 'Identifiant généré par le système, avec un préfixe de type. Utilisez-le dans les appels API et les scripts ; il ne change jamais.',
      createdUtc: 'Date de création de cet enregistrement. Survolez la valeur pour voir la date et l\'heure exactes.',
      lastUpdateUtc: 'Date de la dernière modification de cet enregistrement.',
      isBuiltIn: 'Les enregistrements intégrés sont fournis avec Garrison et sont en lecture seule. Les enregistrements personnalisés ont été créés dans ce locataire et sont modifiables.',
      expiresUtc: 'Passé ce moment, l\'enregistrement cesse de fonctionner. Laissez vide pour aucune expiration.'
    }
  },
  explainer: {
    reopen: 'Afficher à nouveau l\'explication de {{topic}} : ce que gère cette page et son lien avec le reste de Garrison.',
    dismiss: 'Masquer cette explication. Un petit bouton « À propos » reste à sa place pour la rouvrir à tout moment.'
  },
  nav: {
    approvalsBadge_one: '{{count}} appel d\'outil attend qu\'une personne l\'autorise ou le refuse. Ouvrez Approbations pour décider.',
    approvalsBadge_other: '{{count}} appels d\'outil attendent qu\'une personne les autorise ou les refuse. Ouvrez Approbations pour décider.',
    approvalsBadge_many: '{{count}} appels d\'outil attendent qu\'une personne les autorise ou les refuse. Ouvrez Approbations pour décider.',
    hubs: {
      approvals: 'La boîte de réception des approbations : les appels d\'outil demandés par les agents qui attendent une personne, et l\'historique de chaque décision par règle, valeur par défaut, personne ou délai d\'expiration.',
      home: 'Commencez ici : nombres en direct d\'agents, d\'exécutions et de nœuds worker, trafic API, échecs récents et raccourcis vers les tâches courantes.',
      invoke: 'Envoyer un message à un agent depuis le navigateur et suivre la transcription en direct, sans écrire de code.',
      runs: 'Chaque invocation d\'agent, avec sa transcription, son résultat et sa télémétrie, ainsi que la file d\'attente du travail en attente d\'un nœud.',
      analytics: 'Graphiques de vitesse d\'exécution, de consommation de jetons, de coût, de résultats et d\'appels d\'outils dans le temps, filtrables par agent, harness et déploiement.',
      agents: 'Les agents que les appelants invoquent par leur nom, et les déploiements qui déterminent comment chacun s\'exécute réellement.',
      configuration: 'Les briques utilisées par les déploiements : profils de harness, modèles de prompt, serveurs MCP, secrets, espaces de travail, stockages d\'artefacts et manifestes.',
      fleet: 'Les réplicas du plan de contrôle qui servent l\'API et planifient les exécutions, les nœuds worker qui les traitent et les pools de nœuds qui regroupent les workers pour le placement.',
      access: 'Qui peut se connecter et ce qu\'il peut faire : locataires, utilisateurs, clés d\'accès, rôles et attributions de rôles.',
      monitoring: 'Enquêter sur ce qui s\'est passé : requêtes API capturées, piste d\'audit de sécurité et Explorateur d\'API en direct.',
      system: 'Paramètres du serveur, ainsi que les points de terminaison, les versions et l\'identité du serveur auquel vous êtes connecté.'
    },
    tabs: {
      runs: 'Rechercher, filtrer et inspecter les exécutions une par une. Ouvrez-en une pour lire sa transcription, son résultat et sa télémétrie, ou pour l\'annuler et la relancer.',
      queue: 'Exécutions en attente d\'un nœud, sous bail ou en cours, regroupées par agent et par harness.',
      agents: 'Agents nommés que les appelants invoquent via REST, MCP ou A2A. Un agent est l\'identité ; ses déploiements déterminent comment il s\'exécute.',
      deployments: 'Comment chaque agent s\'exécute : profil de harness, modèle, prompts, serveurs MCP, secrets, espace de travail, placement, limites et poids de trafic.',
      harnessProfiles: 'Recettes pour lancer un harness CLI sans interface : exécutable, arguments, environnement, fichiers et analyse de la sortie.',
      promptTemplates: 'Chaque prompt et chaque fichier de configuration généré que Garrison envoie à un harness, versionnés avec un aperçu en direct.',
      mcpServers: 'Serveurs d\'outils utilisables par les agents. Enregistrez-les ici, puis liez-les aux déploiements.',
      secrets: 'Clés API et jetons chiffrés. Les déploiements les lient par alias ; les valeurs ne sont plus jamais affichées.',
      workspaces: 'Modèles du répertoire dans lequel une exécution travaille : vide, cloné depuis Git ou prérempli avec des fichiers.',
      artifactStores: 'Destinations des fichiers produits par les exécutions que vous souhaitez conserver après la fin de l\'exécution.',
      modelPrices: "Tarifs en USD configurés par un opérateur pour estimer le coût lorsque le harness ne le fournit pas. Le coût déclaré, même nul, est prioritaire.",
      usageQuotas: "Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.",
      manifests: 'Appliquer ou exporter toute la configuration du locataire en YAML pour la versionner dans un gestionnaire de versions.',
      nodes: 'Machines ou pods worker qui récupèrent les exécutions et lancent les harness. Isolez-les, drainez-les ou inspectez-les ici.',
      controlNodes: 'Réplicas du serveur (nœuds de contrôle) qui servent REST, MCP et A2A et planifient les exécutions. L\'un d\'eux est le leader et assure la maintenance du cluster. Statut, version et activité en lecture seule.',
      nodePools: 'Groupes nommés de nœuds, éventuellement réservés à certains locataires. Les déploiements peuvent exiger un pool.',
      tenants: 'Organisations isolées sur ce serveur, chacune avec ses propres utilisateurs, agents, secrets et exécutions.',
      users: 'Personnes qui se connectent avec une adresse e-mail et un mot de passe. Chaque utilisateur peut posséder des clés d\'accès.',
      credentials: 'Clés d\'accès pour les scripts, les SDK et les services. Chaque clé appartient à un utilisateur et agit avec les autorisations de cet utilisateur, ou moins.',
      roles: 'Ensembles nommés d\'autorisations, ainsi que les autorisations elles-mêmes. Attribuez des rôles pour accorder un accès.',
      assignments: 'Attributions qui relient un rôle à un utilisateur ou à une clé d\'accès, pour tout le locataire ou pour une seule ressource.',
      requests: 'Requêtes API capturées par ce serveur, avec en-têtes, corps, durées et statut, pour déboguer les intégrations.',
      audit: 'Événements de sécurité et de configuration : connexions, refus, modifications de secrets, applications de manifestes et modifications de nœuds.',
      explorer: 'Choisir n\'importe quelle opération API dans le document OpenAPI du serveur, renseigner les paramètres et l\'exécuter en direct.',
      settings: 'Paramètres du serveur et du cluster, avec leur source et l\'indication qu\'une modification s\'applique à chaud ou nécessite un redémarrage.',
      serverInfo: 'Adresses REST, MCP et A2A, versions du serveur et du tableau de bord, et identité avec laquelle vous êtes connecté.',
      conversations: 'Conversations en plusieurs tours avec les agents : chaque tour est une exécution qui reprend la session du tour précédent. Ouvrez-en une pour lire ses tours et envoyer le message suivant.'
    },
    subtabs: {
      roles: 'Les rôles regroupent des autorisations sous un même nom, comme Operator ou Invoker. Attribuez un rôle pour accorder toutes ses autorisations.',
      permissions: 'Règles individuelles qui autorisent ou refusent des opérations sur des types de ressources. Les rôles en sont composés ; le refus l\'emporte toujours.',
      userAssignments: 'Attribuer des rôles aux personnes qui se connectent avec une adresse e-mail et un mot de passe.',
      credentialAssignments: 'Attribuer des rôles aux clés d\'accès utilisées par l\'automatisation. Donnez aux clés moins de droits qu\'à leurs propriétaires.'
    },
    setup: 'Ouvrir l\'assistant de configuration : enregistrer les identifiants d\'un harness, appliquer un agent d\'exemple et l\'exécuter une fois pour vérifier que tout fonctionne.',
    tour: 'Rejouer la courte visite guidée qui présente la navigation, le contexte et l\'emplacement de la configuration.',
    skipToContent: 'Passer la navigation et aller directement au contenu principal de cette page. Surtout utile aux utilisateurs du clavier.'
  },
  topbar: {
    toggleSidebar: 'Réduire ou déployer la barre latérale de navigation. Sur les petits écrans, la navigation s\'ouvre en superposition.',
    server: 'Le serveur Garrison avec lequel cette console communique : {{url}}. Le point indique si son contrôle de santé réussit.',
    health: {
      healthy: 'Le serveur a répondu à son contrôle de santé au cours des 30 dernières secondes.',
      unhealthy: 'Le serveur n\'a pas répondu à son contrôle de santé. Les requêtes de cette page échoueront probablement.',
      unknown: 'En attente du premier résultat du contrôle de santé du serveur.'
    },
    copyServer: 'Copier l\'URL du serveur, par exemple pour configurer un SDK ou une commande curl.',
    switchTenant: 'Les administrateurs système peuvent consulter n\'importe quel locataire. Chaque page affiche les données du locataire sélectionné.',
    tenant: 'Vous travaillez dans le locataire {{tenant}}. Chaque enregistrement et chaque exécution affichés lui appartiennent.',
    principal: 'Vous êtes connecté en tant que {{name}}. Vos actions sont enregistrées sous cette identité.',
    role: 'Votre niveau d\'accès le plus élevé dans ce locataire. Il détermine les pages et les actions disponibles.',
    liveOn: 'Connecté au serveur via WebSocket : les changements d\'exécutions et de nœuds apparaissent en temps réel.',
    liveOff: 'Pas de connexion en direct. Les pages se rafraîchissent selon leurs propres minuteries, les changements peuvent donc mettre quelques secondes à apparaître.',
    github: 'Ouvrir le dépôt source de Garrison sur GitHub dans un nouvel onglet, pour la documentation et les tickets.',
    themeLight: 'Passer au thème de couleurs clair. Le choix est mémorisé dans ce navigateur.',
    themeDark: 'Passer au thème de couleurs sombre. Le choix est mémorisé dans ce navigateur.',
    logout: 'Se déconnecter et révoquer cette session de navigateur. Vous devrez vous reconnecter.',
    language: 'Changer la langue d\'affichage. Les dates et les nombres suivent aussi la langue, et le choix est mémorisé.'
  },
  login: {
    passwordTab: 'Se connecter en tant que personne avec un locataire, une adresse e-mail et un mot de passe.',
    keyTab: 'Se connecter avec une clé d\'accès et une clé secrète, la même paire que celle utilisée par les scripts et les SDK.',
    serverUrl: 'Adresse de base de l\'API REST de Garrison, par exemple le serveur redirigé par port sur 127.0.0.1:8700.',
    tenantId: 'Le locataire auquel appartient votre compte. Le locataire local par défaut s\'appelle default.',
    email: 'L\'adresse e-mail de votre compte utilisateur dans ce locataire.',
    password: 'Le mot de passe de votre compte. Il est envoyé une seule fois pour obtenir un jeton de session et n\'est jamais stocké par l\'application du navigateur.',
    accessKey: 'La partie publique d\'une clé d\'accès, qui commence par access_. Créez des clés dans « Accès > Clés d\'accès ».',
    secretKey: 'La partie privée de la clé d\'accès. Elle a été affichée une seule fois lors de la création ou du renouvellement de la clé.',
    submit: 'Vérifier les identifiants auprès du serveur et ouvrir la console de votre locataire.'
  },
  table: {
    selectAll: 'Sélectionner ou désélectionner toutes les lignes de cette page, par exemple pour les supprimer ensemble.',
    selectRow: 'Sélectionner cette ligne pour une action groupée, comme la suppression.',
    sortServer: '{{tip}} Cliquez pour trier toute la liste selon cette colonne ; cliquez à nouveau pour inverser l\'ordre.',
    sortPageOnly: '{{tip}} Cliquez pour trier uniquement les lignes de cette page ; le serveur ne peut pas trier selon cette colonne.',
    clearSelection: 'Désélectionner toutes les lignes sélectionnées sans rien modifier.',
    pageSize: 'Nombre de lignes à charger par page. Les pages plus grandes sont plus longues à charger. Le choix est mémorisé pour chaque tableau.',
    first: 'Aller à la première page de résultats.',
    prev: 'Revenir d\'une page de résultats.',
    jump: 'Saisissez un numéro de page entre 1 et {{total}} et appuyez sur Entrée pour y aller directement.',
    next: 'Avancer d\'une page de résultats.',
    last: 'Aller à la dernière page de résultats.',
    refresh: 'Recharger cette liste depuis le serveur maintenant, en conservant la page, les filtres et le tri.',
    autoRefresh: 'Recharger ces données automatiquement à intervalles réguliers. Désactivé, l\'affichage reste figé pendant votre lecture.',
    selectColumns: 'Choisir les colonnes affichées par le tableau. Votre choix est mémorisé pour chaque tableau dans ce navigateur.',
    columnPinned: '{{column}} est toujours affiché, car les lignes ne peuvent pas être identifiées sans cette colonne.',
    columnToggle: 'Afficher ou masquer la colonne {{column}}. {{tip}}',
    actionsFor: 'Ouvrir les actions pour {{name}} : afficher, modifier, dupliquer, voir le JSON, supprimer et actions propres à l\'enregistrement.',
    actionsMenu: 'Ouvrir les actions disponibles pour cette ligne.',
    actionsColumn: 'Actions par ligne. Cliquez sur les trois points pour afficher, modifier, dupliquer, inspecter le JSON ou supprimer.',
    search: 'Saisissez une partie d\'un nom pour filtrer la liste. La recherche s\'exécute sur le serveur dès que vous arrêtez de taper.',
    clearFilters: 'Effacer le texte de recherche et tous les filtres, puis afficher à nouveau la liste complète.',
    bulkDelete: 'Supprimer toutes les lignes sélectionnées. Une confirmation vous sera d\'abord demandée.'
  },
  filters: {
    decisionSource: 'Afficher uniquement les approbations décidées d\'une certaine façon : par une règle, la valeur par défaut du déploiement, une personne, un délai d\'expiration ou une exécution arrêtée.',
    runId: 'Afficher uniquement les approbations d\'une exécution. Collez un ID d\'exécution comme run_... ; la liste se met à jour quand vous arrêtez de taper.',
    status: 'Afficher uniquement les enregistrements dans cet état. Choisissez « Tous » pour retirer le filtre.',
    harnessType: 'Afficher uniquement les enregistrements d\'un harness, comme Claude Code ou Codex.',
    kind: 'Afficher uniquement les enregistrements d\'un type. Choisissez « Tous » pour retirer le filtre.',
    eventType: 'Afficher uniquement les événements d\'audit d\'un type, comme les connexions échouées ou les modifications de secrets.',
    fromUtc: 'Afficher uniquement les enregistrements créés à partir de ce moment (dans votre fuseau horaire local).',
    toUtc: 'Afficher uniquement les enregistrements créés avant ce moment (dans votre fuseau horaire local).',
    method: 'Afficher uniquement les requêtes qui ont utilisé cette méthode HTTP.',
    statusCode: 'Afficher uniquement les requêtes qui ont renvoyé ce code de statut HTTP, par exemple 404 ou 500.',
    pathContains: 'Afficher uniquement les requêtes dont le chemin contient ce texte, par exemple /agents.',
    tenantId: 'Afficher uniquement les requêtes effectuées dans ce locataire. Laissez vide pour tous les locataires.',
    apply: 'Lancer la recherche avec les valeurs de filtre ci-dessus.',
    clear: 'Vider tous les filtres ci-dessus et relancer la recherche.',
    agentId: 'Afficher uniquement les enregistrements d\'un agent. Choisissez Tous pour retirer le filtre.'
  },
  form: {
    option: 'Inclure {{option}} dans {{field}}. Les options cochées sont enregistrées ; les options non cochées sont exclues.',
    reveal: 'Afficher la valeur saisie en clair pour la vérifier avant d\'enregistrer.',
    hide: 'Masquer à nouveau la valeur pour que les personnes qui regardent votre écran ne puissent pas la lire.',
    key: 'Clé de cette entrée de {{field}}. Les clés doivent être uniques dans la liste.',
    value: 'Valeur de cette entrée de {{field}}. Les modèles et les références de secrets sont autorisés lorsque c\'est indiqué.',
    removeRow: 'Retirer cette entrée de la liste. Rien n\'est enregistré tant que vous n\'avez pas cliqué sur « Enregistrer ».',
    addRow: 'Ajouter une entrée clé et valeur vide à {{field}}.',
    moveUp: 'Remonter cet élément d\'un rang. L\'ordre compte ici, par exemple pour les listes d\'arguments.',
    moveDown: 'Descendre cet élément d\'un rang. L\'ordre compte ici, par exemple pour les listes d\'arguments.',
    removeItem: 'Retirer cet élément de la liste. Rien n\'est enregistré tant que vous n\'avez pas cliqué sur « Enregistrer ».',
    addItem: 'Ajouter un nouvel élément vide à {{field}} et renseigner ses champs.'
  },
  actions: {
    openDetail: 'Ouvrir la page de détail complète de cet enregistrement.',
    view: 'Ouvrir cet enregistrement en lecture seule pour voir tous les champs sans risque de le modifier.',
    edit: 'Ouvrir cet enregistrement dans un formulaire pour le modifier. Les modifications s\'appliquent lorsque vous cliquez sur « Enregistrer ».',
    duplicate: 'Créer un nouvel enregistrement prérempli avec les valeurs de celui-ci et un nom en -copy. Rien n\'est créé tant que vous n\'enregistrez pas.',
    viewJson: 'Afficher le JSON brut exactement tel que l\'API le renvoie, pour le débogage ou pour le copier dans des scripts.',
    delete: 'Supprimer définitivement cet enregistrement. Une confirmation vous sera demandée, et l\'opération est irréversible.',
    add: 'Créer un nouvel enregistrement de ce type dans un formulaire.',
    switchToEdit: 'Passer de cette vue en lecture seule à un formulaire modifiable.',
    retryLoad: 'Réessayer de charger ces données depuis le serveur.'
  },
  modal: {
    close: 'Fermer cette fenêtre. Rien ne change sur le serveur.',
    dismiss: 'Fermer cette fenêtre sans enregistrer. Vous pouvez aussi appuyer sur Échap.',
    cancelForm: 'Fermer le formulaire et abandonner les modifications non enregistrées.',
    back: 'Revenir à l\'étape précédente du formulaire. Les valeurs saisies sont conservées.',
    next: 'Passer à l\'étape suivante du formulaire. Rien n\'est enregistré tant que vous n\'avez pas cliqué sur « Enregistrer ».',
    saveEdit: 'Enregistrer vos modifications de cet enregistrement. Le serveur les valide et signale tout champ à corriger.',
    saveCreate: 'Créer l\'enregistrement avec ces valeurs. Le serveur les valide et signale tout champ à corriger.',
    saveValue: 'Envoyer la valeur au serveur. Elle est chiffrée dès réception et n\'est plus jamais affichée.'
  },
  confirm: {
    delete: 'Oui, supprimer définitivement cet enregistrement.',
    bulkDelete: 'Oui, supprimer définitivement tous les enregistrements sélectionnés.',
    cancel: 'Revenir en arrière sans rien faire.',
    danger: 'Effectuer cette action destructive. Elle est irréversible.',
    confirm: 'Effectuer l\'action décrite ci-dessus.'
  },
  copy: {
    id: 'Copier l\'ID de l\'enregistrement dans le presse-papiers, pour la REST API, les SDK ou les filtres.',
    value: 'Copier cette valeur dans le presse-papiers.',
    block: 'Copier tout le bloc dans le presse-papiers, prêt à être collé dans un terminal ou un fichier.',
    done: 'Copié dans le presse-papiers.'
  },
  chart: {
    ranges: {
      hour: 'Afficher les 60 dernières minutes, par intervalles d\'une minute.',
      day: 'Afficher les dernières 24 heures. Les intervalles sont dimensionnés pour que le graphique reste lisible.',
      week: 'Afficher les 7 derniers jours. Les intervalles sont dimensionnés pour que le graphique reste lisible.',
      month: 'Afficher les 30 derniers jours. Les intervalles sont dimensionnés pour que le graphique reste lisible.',
      custom: 'Choisir vos propres heures de début et de fin. Les plages très longues sont refusées par le serveur.'
    },
    refresh: 'Recharger maintenant les données du graphique depuis le serveur.',
    tenant: 'Afficher l\'activité des requêtes pour un locataire ou pour tous les locataires du serveur.',
  },
  badges: {
    approvalsOn_one: 'Approbations activées : le harness demande avant les appels d\'outil, et {{count}} règle en décide certains automatiquement.',
    approvalsOn_other: 'Approbations activées : le harness demande avant les appels d\'outil, et {{count}} règles en décident certains automatiquement.',
    approvalsOn_many: 'Approbations activées : le harness demande avant les appels d\'outil, et {{count}} règles en décident certains automatiquement.',
    approvalsOff: 'Approbations désactivées : le harness effectue les appels d\'outil selon ses propres paramètres d\'autorisation, sans demander.',
    active: 'Actif : cet enregistrement est en service.',
    inactive: 'Inactif : cet enregistrement est conservé mais ignoré jusqu\'à sa réactivation.',
    builtIn: 'Intégré : fourni avec Garrison et en lecture seule. Clonez-le pour créer une version modifiable.',
    custom: 'Personnalisé : créé dans ce locataire, il peut donc être modifié et supprimé.',
    systemAdmin: 'Administrateur système : peut gérer tous les locataires et contourne les contrôles d\'autorisation.',
    tenantAdmin: 'Administrateur du locataire : peut tout gérer au sein de ce locataire.',
    user: 'Utilisateur standard : ses accès proviennent uniquement des attributions de rôles.',
    role: 'Cette attribution accorde le rôle {{role}} et toutes les autorisations qu\'il contient.',
    deploymentActive: 'Actif : ce déploiement reçoit sa part du trafic de l\'agent.',
    deploymentInactive: 'Inactif : ce déploiement ne reçoit aucun trafic, mais peut toujours être désigné explicitement lors d\'une invocation.'
  },
  permissions: {
    source: 'Le rôle dont provient cet accord. Corrigez l\'accès en modifiant ce rôle ou l\'attribution qui l\'accorde.',
    type: '« Autoriser » accorde les opérations ; « Refuser » les bloque même si un autre rôle les autorise.',
    resources: 'Les types d\'enregistrements couverts par cet accord, comme Agent ou Run.',
    operations: 'Ce qui peut être fait sur ces enregistrements, comme Read, Create ou Execute.',
    scope: 'La portée « Locataire » couvre tous les enregistrements du type ; la portée « Ressource » couvre un enregistrement précis.'
  },
  compilePreview: {
    input: 'Un exemple de message d\'appelant utilisé pour la compilation. Il devient {{input.message}} dans le modèle de tâche.',
    compile: 'Compiler ce déploiement exactement comme le ferait une exécution, sans en lancer une, et afficher la ligne de commande, les fichiers et l\'environnement.'
  },
  secretOnce: {
    accessKey: 'La clé d\'accès publique. Elle identifie la clé d\'accès et peut être stockée sans risque dans la configuration.',
    secretKey: 'La clé secrète. Elle n\'est affichée que cette fois : copiez-la maintenant dans votre gestionnaire de mots de passe ou votre coffre de secrets.',
    done: 'Fermer cette fenêtre. La clé secrète ne pourra plus être récupérée, seulement renouvelée.'
  },
  wizard: {
    skip: 'Fermer l\'assistant et ne plus le proposer pour ce locataire. Vous pouvez le rouvrir depuis la barre latérale.',
    back: 'Revenir à l\'étape précédente de l\'assistant.',
    start: 'Commencer la configuration : ajouter des identifiants, appliquer un agent d\'exemple et le tester.',
    saveSecret: 'Enregistrer les identifiants chiffrés dans ce locataire et passer à l\'étape suivante.',
    skipStep: 'Continuer sans ajouter d\'identifiants. L\'agent d\'exemple n\'en a pas besoin.',
    apply: 'Créer l\'agent et le déploiement d\'exemple à partir du manifeste affiché ci-dessus.',
    invoke: 'Lancer une exécution de l\'agent d\'exemple avec votre message et ouvrir sa page de détail.',
    secretName: 'Nom du secret enregistré. Les déploiements y font référence par ce nom lorsqu\'ils le lient.',
    manifest: 'Le manifeste d\'exemple en YAML. Vous pouvez le modifier avant de l\'appliquer, par exemple pour renommer l\'agent.',
    message: 'Le message à envoyer à l\'agent d\'exemple. Le harness factice le renvoie tel quel.'
  },
  tour: {
    skip: 'Terminer la visite maintenant. Vous pouvez la rejouer depuis la barre latérale.',
    back: 'Afficher l\'étape précédente de la visite.',
    next: 'Passer à l\'étape suivante de la visite.',
    done: 'Terminer la visite. Vous pouvez la rejouer depuis la barre latérale.'
  },
  telemetry: {
    ...TELEMETRY,
    panel: 'Durée de chaque phase de cette exécution et ce qu\'elle a consommé. Les durées proviennent des horloges du worker et du serveur décrites pour chaque champ.',
    phases: 'Où l\'exécution a passé son temps, de gauche à droite : attente dans la file, démarrage du harness jusqu\'au premier jeton, sortie en streaming et reste de l\'exécution.',
    phase: {
      delegation: 'Temps avant la première sortie du modèle pendant lequel l\'exécution attendait les exécutions enfants déléguées. Ce n\'est pas le démarrage du harness.',
      queue: 'Attente dans la file qu\'un nœud worker prenne l\'exécution en bail.',
      startup: 'Du démarrage du processus à la première sortie du modèle, y compris le démarrage du harness et la première requête au modèle.',
      streaming: 'De la première à la dernière sortie du modèle.',
      tail: 'Exécution après la dernière sortie du modèle : appels d\'outils, traitement du résultat et fin du processus.'
    }
  },
  blocked: {
    panel: 'Pourquoi cette exécution attend encore et ce qu\'il faut changer pour qu\'un worker puisse la prendre.',
    openFleet: 'Ouvre la page Flotte pour voir quels nœuds worker sont prêts, quels harness chacun signale et le détail de leurs sondes.',
    openAgent: 'Ouvre l\'agent de cette exécution pour vérifier ses déploiements, dont le pool de nœuds et les sélecteurs de nœuds de chacun.',
    homeBanner: 'Exécutions en file d\'attente qu\'aucun worker prêt ne peut exécuter pour l\'instant. Elles attendent qu\'un worker compatible apparaisse, ou échouent une fois le délai Runtime.FailBlockedAfterSeconds défini et écoulé.',
    showRuns: 'Ouvre la page Exécutions filtrée sur les exécutions en file d\'attente. Les exécutions bloquées portent un badge d\'avertissement qui en explique la raison.',
    queueColumn: 'Exécutions en file d\'attente de ce groupe qu\'aucun worker prêt ne peut exécuter pour l\'instant. Survolez le badge pour connaître la raison et la marche à suivre.'
  },
  enums: {
    approvalStatus: {
      Pending: 'En attente qu\'une personne l\'autorise ou la refuse. D\'ici là, le harness reste bloqué sur cet appel.',
      Approved: 'L\'appel d\'outil a été autorisé, par une règle, la valeur par défaut du déploiement, une personne ou un délai d\'expiration.',
      Denied: 'L\'appel d\'outil a été refusé. Le harness a reçu le message de refus et a continué sans lui.',
      Expired: 'Personne n\'a décidé à temps ; la décision d\'expiration du déploiement a donc été appliquée.',
      Cancelled: 'L\'exécution s\'est arrêtée pendant que l\'approbation était en attente ; elle a donc été close sans décision.'
    },
    approvalDecision: {
      Allow: 'Autoriser : le harness a été autorisé à effectuer l\'appel d\'outil.',
      Deny: 'Refuser : le harness a reçu un refus avec son motif.'
    },
    approvalSource: {
      Rule: 'Décidée immédiatement par une règle du déploiement. La règle correspondante est affichée à côté.',
      Default: 'Aucune règle ne correspondait ; l\'action par défaut du déploiement a donc décidé.',
      User: 'Une personne a décidé dans le tableau de bord, via l\'API ou via MCP.',
      Timeout: 'Personne n\'a décidé avant l\'expiration ; la décision d\'expiration du déploiement s\'est donc appliquée.',
      Cancelled: 'L\'exécution s\'est arrêtée pendant que cette approbation était en attente.'
    },
    approvalRuleAction: {
      Allow: 'Autoriser : les appels d\'outil correspondants s\'exécutent sans demander à personne.',
      Deny: 'Refuser : les appels d\'outil correspondants sont refusés sans demander à personne. Refuser l\'emporte sur toute autre règle.',
      Ask: 'Demander à une personne : les appels d\'outil correspondants attendent une décision dans la boîte de réception Approbations.'
    },
    approvalKind: {
      Tool: 'Une demande d\'autorisation de Claude Code pour n\'importe quel outil, y compris les outils MCP.',
      Command: 'Une commande shell qu\'une exécution de l\'app-server Codex veut lancer. Les règles l\'évaluent comme Bash.',
      FileChange: 'Une modification de fichier qu\'une exécution de l\'app-server Codex veut effectuer. Les règles l\'évaluent comme Edit.'
    },
    runBlockedReason: {
      NoReadyWorker: 'Bloquée : aucun nœud worker n\'est prêt, donc rien ne peut prendre cette exécution. Démarrez un worker ou enregistrez-en un nouveau, puis vérifiez sur la page Flotte les nœuds perdus, hors ligne, en drainage ou isolés.',
      NoCapableWorker: 'Bloquée : des nœuds worker sont prêts, mais aucun ne signale le harness de cette exécution comme disponible. Démarrez ou enregistrez un worker sur lequel le harness est installé, ou vérifiez ses identifiants et les résultats de ses sondes sur la page Flotte.',
      NoMatchingPool: 'Bloquée : un worker prêt peut exécuter ce harness, mais aucun ne correspond au pool de nœuds du déploiement, à la restriction de locataire du pool ou à ses sélecteurs de nœuds. Vérifiez le placement du déploiement ou ajoutez un worker à ce pool.'
    },
    runStatus: {
      Pending: 'En attente : l\'exécution a été acceptée et est préparée avant d\'entrer dans la file.',
      Queued: 'En file d\'attente : attend qu\'un nœud worker avec un harness et un placement compatibles la prenne en bail.',
      Leased: 'Sous bail : un nœud worker a réclamé l\'exécution et prépare l\'espace de travail.',
      Running: 'En cours : le processus de harness s\'exécute sur un nœud worker.',
      Cancelling: 'Annulation en cours : un arrêt a été demandé et le worker arrête le harness.',
      Succeeded: 'Réussie : le harness s\'est terminé et a produit un résultat valide.',
      Failed: 'Échouée : l\'exécution s\'est terminée par une erreur. La colonne « Résultat » en indique la raison.',
      Cancelled: 'Annulée : quelqu\'un a arrêté l\'exécution avant sa fin.',
      TimedOut: 'Délai dépassé : l\'exécution a atteint son échéance et a été arrêtée.',
      Rejected: 'Rejetée : l\'exécution n\'a pas pu démarrer, par exemple parce qu\'aucun déploiement n\'était actif.'
    },
    runOutcome: {
      None: 'L\'exécution n\'est pas terminée, il n\'y a donc pas encore de résultat.',
      Succeeded: 'Le harness s\'est terminé et son résultat a passé la validation.',
      HarnessFailed: 'Le harness a signalé un échec ou s\'est arrêté sans résultat exploitable. Consultez stderr et la transcription.',
      NotInstalled: 'L\'exécutable du harness est introuvable sur le nœud worker.',
      NotCredentialed: 'Le harness n\'avait aucun identifiant utilisable. Liez un secret au déploiement.',
      McpPreflightFailed: 'Un serveur ou un outil MCP requis était injoignable lors de la vérification préalable du worker avant le lancement.',
      NodeLost: 'Le nœud worker a cessé d\'envoyer des signaux de vie alors qu\'il détenait l\'exécution.',
      OutputLimitExceeded: 'L\'exécution a produit trop de sortie : sa réponse a dépassé le nombre maximal de caractères de l\'assistant du déploiement (une garde), ou le harness a écrit plus que ce que le profil de harness autorise. La sortie obtenue est conservée.',
      SchemaValidationFailed: 'Le résultat ne correspondait pas au JSON Schema de sortie de l\'agent : après une tentative de correction, ou immédiatement si le harness ne peut pas reprendre sa session.',
      TimedOut: 'L\'exécution a atteint son échéance.',
      Cancelled: 'L\'exécution a été annulée sur demande.',
      StaleLease: 'Le worker a répondu après avoir perdu son bail, son résultat a donc été ignoré.',
      CompileFailed: 'Le déploiement n\'a pas pu être compilé, par exemple à cause d\'une variable de modèle manquante.',
      WorkspaceFailed: 'L\'espace de travail n\'a pas pu être préparé, par exemple parce qu\'un clonage Git a échoué.',
      Rejected: 'La requête a été rejetée avant qu\'une exécution puisse démarrer.',
      InternalError: 'Garrison a rencontré une erreur interne. Les journaux du serveur contiennent les détails.',
      NoCapableWorker: 'L\'exécution a attendu dans la file d\'attente plus longtemps que ne le permet le paramètre de cluster Runtime.FailBlockedAfterSeconds, et aucun nœud worker prêt ne pouvait l\'exécuter : elle a donc échoué.',
      RepetitionDetected: 'Une garde a arrêté l\'exécution, car sa réponse a dégénéré en un même texte court répété encore et encore, ou en espaces et ponctuation seulement. La sortie obtenue est conservée. Réglez-la avec la Garde de répétition du déploiement.',
      NoProgress: 'Une garde a arrêté l\'exécution, car aucun texte, raisonnement ni activité d\'outil n\'est arrivé pendant plus longtemps que le délai sans progression du déploiement. La sortie obtenue est conservée.',
      PodFailed: 'Le pod d\'exécution a échoué hors du harness : il n\'a pas pu être planifié, son image n\'a pas pu être téléchargée, il a manqué de mémoire, il a été évincé ou il s\'est arrêté sans rendre compte. Le message d\'erreur en donne la cause.',
      ConversationStateLost: 'Le nœud qui devait reprendre ce tour de conversation n\'avait plus les répertoires de la conversation. Garrison remet un tel tour une fois en file d\'attente pour le reconstruire ; ce résultat ne reste que si ce n\'était pas possible.'
    },
    controlNodeStatus: {
      Starting: 'Démarrage : le réplica s\'initialise et ne traite pas encore de trafic.',
      Ready: 'Prêt : le réplica envoie des signaux de vie et traite les requêtes REST, MCP et A2A.',
      Draining: 'Drainage en cours : l\'arrêt a commencé. La sonde de disponibilité répond 503, et ses flux et long polling se terminent.',
      Offline: 'Hors ligne : le réplica s\'est arrêté proprement, ou il est resté muet 30 secondes et le leader l\'a marqué. Les lignes hors ligne sont supprimées après 24 heures.'
    },
    backplane: {
      Local: 'Local : les événements restent dans ce processus. Convient à un seul réplica ; les autres réplicas ne les voient pas.',
      Polling: 'Interrogation de la base de données : les réplicas partagent les événements en direct en interrogeant la base. Fonctionne avec toute base de données, avec un léger délai.',
      PostgresNotify: 'Notifications PostgreSQL : les réplicas partagent les événements en direct via LISTEN et NOTIFY de PostgreSQL, avec très peu de délai.'
    },
    nodeStatus: {
      Ready: 'Prêt : envoie des signaux de vie et accepte de nouvelles exécutions.',
      Draining: 'Drainage en cours : termine ses exécutions en cours et n\'en accepte aucune nouvelle.',
      Cordoned: 'Isolé : n\'accepte aucune nouvelle exécution ; les exécutions en cours se poursuivent normalement.',
      Lost: 'Perdu : n\'envoie plus de signaux de vie. Ses exécutions sont remises en file ou marquées en échec.',
      Offline: 'Hors ligne : arrêté proprement, ne détient aucune exécution.'
    },
    usageQuotaScope: {"Tenant": "Locataire. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "Agent": "Agent IA. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "Deployment": "Déploiement. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement."},
    harnessType: {
      ClaudeCode: 'CLI Claude Code d\'Anthropic, exécutée sans interface avec une sortie stream-JSON.',
      Codex: 'CLI Codex d\'OpenAI, exécutée avec exec et une sortie JSONL.',
      Mux: 'CLI Mux avec sortie JSONL ; fonctionne avec des points de terminaison de modèles locaux et hébergés.',
      GeminiCli: 'Gemini CLI de Google avec une sortie stream-JSON.',
      Generic: 'Tout autre agent en ligne de commande, entièrement décrit par le profil de harness.'
    },
    agentKind: {
      Hosted: 'Hébergé : Garrison exécute lui-même cet agent via ses déploiements sur les nœuds worker.',
      Remote: 'Distant : l\'agent s\'exécute ailleurs et Garrison transmet les appels à son point de terminaison A2A ou MCP.'
    },
    secretStatus: {
      Ok: 'L\'identifiant est utilisable, à la connaissance de Garrison. Définir une nouvelle valeur ramène toujours le secret à cet état.',
      NeedsReauthentication: 'OpenAI a définitivement refusé la connexion ChatGPT enregistrée, par exemple parce que son jeton d\'actualisation avait déjà servi. Les exécutions qui utilisent ce secret échouent tant que vous ne remplacez pas sa valeur par une nouvelle connexion.'
    },
    secretKind: {
      AnthropicApiKey: 'Une clé API Anthropic, injectée en tant que ANTHROPIC_API_KEY par le profil Claude Code.',
      ClaudeCodeOAuthToken: 'Un jeton d\'abonnement Claude Code. Vérifiez les conditions du fournisseur avant de l\'utiliser sur des serveurs partagés.',
      OpenAiApiKey: 'Une clé API OpenAI pour Codex ou d\'autres harness s\'appuyant sur OpenAI.',
      CodexAuthJson: 'Le contenu d\'un fichier auth.json de Codex, écrit dans le HOME de l\'exécution.',
      GeminiApiKey: 'Une clé API Google Gemini pour la Gemini CLI.',
      GenericEnv: 'Toute valeur destinée à une variable d\'environnement.',
      GenericFile: 'Toute valeur destinée à être écrite dans un fichier.',
      BearerToken: 'Un jeton bearer, généralement utilisé dans l\'en-tête Authorization d\'un serveur MCP.',
      BasicAuth: 'Une paire nom d\'utilisateur et mot de passe pour l\'authentification basique.',
      GitCredential: 'Un jeton ou un mot de passe utilisé pour cloner des dépôts Git privés pour les espaces de travail.'
    },
    workspaceKind: {
      Empty: 'Chaque exécution démarre dans un nouveau répertoire vide.',
      GitRepository: 'Chaque exécution démarre avec un nouveau clone d\'un dépôt Git.',
      Seeded: 'Chaque exécution démarre avec les fichiers listés dans le modèle.',
      PersistentVolume: 'Chaque exécution monte un PersistentVolumeClaim existant comme espace de travail, les fichiers sont donc conservés entre les exécutions. Nécessite l\'exécuteur Job Kubernetes.'
    },
    runExecutor: {
      Process: 'Le harness s\'exécute comme sous-processus du worker, dans son conteneur, avec ses propres répertoires de travail, home et configuration.',
      KubernetesJob: 'Le worker lance un Job Kubernetes par exécution : le harness tourne dans son propre pod, sans identifiants Kubernetes ni Garrison, avec un système de fichiers racine en lecture seule et les limites de ressources du déploiement.'
    },
    promptTemplateKind: {
      System: 'Un prompt système : les instructions permanentes qui configurent l\'agent.',
      Task: 'Un prompt de tâche : enveloppe le message de l\'appelant dans ce que reçoit le harness.',
      Fragment: 'Un élément réutilisable inclus par d\'autres modèles avec {{> name}}.',
      ToolDescription: 'Texte qui décrit un agent en tant qu\'outil MCP ou compétence A2A.',
      ConfigFile: 'Le contenu d\'un fichier de configuration généré, comme une configuration MCP.',
      Other: 'Tout autre texte rendu par un profil de harness.'
    },
    mcpTransport: {
      Http: 'Garrison et le harness joignent le serveur en HTTP streamable à une URL.',
      Stdio: 'Le harness démarre le serveur en tant que processus local et communique avec lui via stdin et stdout.'
    },
    permissionType: {
      Permit: 'Autoriser : accorde les opérations listées.',
      Deny: 'Refuser : bloque les opérations listées, même si une autre autorisation les permet.'
    },
    artifactStoreKind: {
      Database: 'Les artefacts sont stockés dans la base de données Garrison. Simple, mais plutôt adapté aux petits fichiers.',
      Filesystem: 'Les artefacts sont écrits dans un répertoire accessible au serveur.',
      S3: 'Les artefacts sont envoyés dans un bucket compatible S3.'
    },
    manifestApplyResult: {
      Created: 'Ce document a créé un nouvel enregistrement.',
      Updated: 'Ce document a modifié un enregistrement existant.',
      Unchanged: 'L\'enregistrement correspondait déjà à ce document, rien n\'a donc changé.',
      Failed: 'Ce document n\'a pas passé la validation. Rien dans le manifeste n\'a été écrit.',
      Validated: 'Simulation : ce document est valide et serait appliqué.'
    },
    auditEventType: {
      ApprovalDecided: 'Une personne a autorisé ou refusé un appel d\'outil en attente. L\'enregistrement indique l\'outil, l\'exécution et le motif.',
      AuthSuccess: 'Quelqu\'un s\'est connecté ou a authentifié une requête avec succès.',
      AuthFailure: 'Une tentative de connexion ou d\'authentification a échoué. Des échecs répétés peuvent indiquer que quelqu\'un essaie de deviner.',
      SessionIssued: 'Un jeton de session a été émis.',
      SessionRevoked: 'Un jeton de session a été révoqué, par exemple lors d\'une déconnexion.',
      CredentialCreated: 'Une nouvelle clé d\'accès a été créée.',
      CredentialRotated: 'Le secret d\'une clé d\'accès a été remplacé.',
      CredentialUsed: 'Une clé d\'accès a été utilisée pour s\'authentifier.',
      AuthorizationDenied: 'Une requête a été refusée, car l\'appelant n\'avait pas l\'autorisation.',
      AuthorizationBypass: 'Une requête a contourné l\'autorisation via une règle de contournement, par exemple pour un administrateur système.',
      RoleChanged: 'Un rôle a été créé, modifié ou supprimé.',
      PermissionChanged: 'Une autorisation a été créée, modifiée ou supprimée.',
      AssignmentChanged: 'Une attribution de rôle a été créée, modifiée ou supprimée.',
      ConfigurationChanged: 'Un agent, un déploiement, un profil, un modèle ou un autre enregistrement de configuration a été modifié.',
      SecretChanged: 'Un secret a été créé, modifié, renouvelé ou supprimé.',
      SettingsChanged: 'Les paramètres du serveur ont été modifiés.',
      RestartRequested: 'Quelqu\'un a demandé le redémarrage du serveur.',
      ManifestApplied: 'Un manifeste a été appliqué au locataire.',
      NodeRegistered: 'Un nœud worker s\'est enregistré auprès du plan de contrôle.',
      NodeStatusChanged: 'Un nœud worker a été isolé, drainé, perdu ou est revenu.',
      RunCancelled: 'Une exécution a été annulée par un utilisateur, une clé d\'accès ou son exécution parente.',
      ConversationDeleted: 'Quelqu\'un a supprimé une conversation. Ses tours sont conservés comme des exécutions ordinaires.'
    },
    conversationFallbackReason: {
      AffinityNodeLost: 'Le nœud qui détient la conversation n\'était plus prêt (perdu, en drainage, isolé ou supprimé) : un autre nœud a pris le tour.',
      AffinityWaitExpired: 'Le nœud qui détient la conversation est resté prêt mais n\'a pas pris le tour dans le délai Runtime.ConversationAffinityWaitMs : un autre nœud l\'a pris.',
      WorkspaceLost: 'Le nœud a pris le tour, mais l\'espace de travail et le répertoire personnel de la conversation n\'y étaient plus.',
      SessionMissing: 'Il existe des tours précédents, mais aucun n\'a signalé de session de harness à reprendre, par exemple parce qu\'ils ont tous échoué tôt.',
      HarnessChanged: 'Le profil de harness du déploiement a changé depuis l\'enregistrement de la session : le nouveau profil ne peut pas la reprendre.',
      ResumeUnsupported: 'Le profil de harness du déploiement ne permet pas de reprendre une session : chaque tour suivant part de la transcription.',
      ExecutorWithoutState: 'Le tour s\'exécute comme Kubernetes Job, qui démarre chaque fois avec un répertoire personnel vide : chaque tour suivant part de la transcription.'
    }
  },
  resources: {
    approvals: {
      createdUtc: 'Quand le harness a demandé. Survolez la valeur pour voir l\'heure exacte.',
      agentName: 'L\'agent dont l\'exécution a demandé cet appel d\'outil.',
      toolName: 'L\'outil que le harness veut utiliser, par exemple Bash, Edit, WebFetch ou un outil MCP.',
      summary: 'Une ligne sur l\'appel : la commande, l\'URL, les chemins ou la requête, avec les secrets masqués.',
      status: 'En attente jusqu\'à la décision, puis Approuvée, Refusée, Expirée (délai dépassé) ou Annulée (l\'exécution s\'est arrêtée).',
      decision: 'Autoriser ou Refuser une fois décidée ; vide tant que l\'approbation est en attente.',
      decisionSource: 'Ce qui a décidé : une règle, la valeur par défaut du déploiement, une personne, un délai d\'expiration ou une exécution arrêtée.',
      decidedBy: 'La personne ou la clé d\'accès qui a décidé, lorsqu\'une personne a décidé.',
      expiresUtc: 'Quand une approbation en attente expire et que la décision d\'expiration du déploiement s\'applique.',
      kind: 'Appel d\'outil (Claude Code), Commande ou Modification de fichier (app-server Codex).',
      harnessType: 'Le harness qui a demandé : Claude Code ou Codex.',
      runId: 'L\'exécution qui a demandé. Ouvrez-la pour voir la transcription autour de l\'appel.',
      rootRunId: 'L\'exécution de premier niveau de l\'arbre de délégation, lorsque l\'exécution qui a demandé était déléguée.',
      deploymentId: 'Le déploiement dont les règles ont évalué cet appel. Les règles mémorisées y sont ajoutées.',
      leaseEpoch: 'Époque du bail de la tentative d\'exécution qui a demandé, pour qu\'une décision n\'atteigne jamais une tentative ultérieure.',
      requestedUtc: 'Quand le harness a demandé l\'autorisation.',
      decidedUtc: 'Quand la décision a été prise.',
      waitMs: 'Combien de temps l\'appel a attendu entre la demande et la décision.',
      timeoutDecision: 'Ce qui se passe si personne ne décide avant l\'expiration de l\'approbation, selon les paramètres du déploiement.',
      toolCallId: 'L\'ID propre au harness pour cet appel d\'outil, pour le retrouver dans la transcription.',
      reason: 'La note rédigée par la personne qui a décidé, le cas échéant.',
      inputPreview: 'L\'entrée d\'outil envoyée par le harness, en JSON, avec les secrets et les valeurs ressemblant à des jetons masqués.',
      rulePattern: 'La règle du déploiement qui correspondait à cet appel, lorsqu\'une règle l\'a décidé ou a demandé une personne.',
      ruleId: 'ID de la règle du déploiement correspondante.',
      suggestedRule: 'Une règle qui correspondrait à cet appel. Mémoriser comme règle la préremplit.',
      rememberedRuleId: 'ID de la règle ajoutée au déploiement lorsque cette approbation a été décidée avec mémorisation.',
      id: 'Identifiant de l\'approbation (apr_...) pour l\'API et les outils MCP.',
      actions: {
        allow: 'Autoriser cet appel d\'outil en attente, avec un motif facultatif et la possibilité de le mémoriser comme règle.',
        deny: 'Refuser cet appel d\'outil en attente, avec un motif facultatif et la possibilité de le mémoriser comme règle.',
        openRun: 'Ouvrir l\'exécution qui a demandé, pour lire sa transcription autour de cet appel d\'outil.'
      }
    },
    tenants: {
      add: 'Créer un nouveau locataire : un espace isolé avec ses propres utilisateurs, agents, secrets et exécutions.',
      name: 'Nom d\'affichage du locataire. Les personnes choisissent le locataire par son ID lors de la connexion.',
      description: 'À qui ou à quoi sert ce locataire, par exemple une équipe ou un client.',
      active: 'Les locataires inactifs ne peuvent ni se connecter ni exécuter d\'agents. Leurs données sont conservées.'
    },
    users: {
      add: 'Créer une personne qui se connecte avec une adresse e-mail et un mot de passe. Donnez-lui ensuite des accès avec une attribution de rôle.',
      email: 'L\'adresse avec laquelle la personne se connecte. Unique au sein du locataire.',
      name: 'Prénom et nom, affichés dans les enregistrements d\'audit et les listes.',
      role: 'Niveau d\'administration du compte. Les utilisateurs ordinaires obtiennent leurs accès via des attributions de rôles.',
      password: 'Mot de passe de connexion. Lors d\'une modification, laissez vide pour conserver le mot de passe actuel.',
      firstName: 'Prénom, affiché dans les listes et les enregistrements d\'audit.',
      lastName: 'Nom de famille, affiché dans les listes et les enregistrements d\'audit.',
      isTenantAdmin: 'Les administrateurs du locataire peuvent tout gérer au sein de ce locataire, y compris les utilisateurs et les secrets.',
      isAdmin: 'Les administrateurs système gèrent tous les locataires et contournent l\'autorisation. À accorder avec parcimonie.',
      active: 'Les utilisateurs inactifs ne peuvent pas se connecter, et leurs clés d\'accès cessent de fonctionner.',
      actions: { permissions: 'Afficher toutes les autorisations effectives de cet utilisateur après combinaison de tous les rôles et attributions.' }
    },
    credentials: {
      add: 'Créer une clé d\'accès pour un script, un SDK ou un service. Le secret est affiché une seule fois après l\'enregistrement.',
      name: 'À quoi sert cette clé, par exemple ci-pipeline. Cela aide à la retrouver avant un renouvellement ou une suppression.',
      accessKey: 'La partie publique de la clé, envoyée avec chaque requête. Peut être stockée sans risque dans la configuration.',
      secretKeyLast4: 'Les quatre derniers caractères du secret, pour reconnaître une clé sans la voir.',
      userId: 'L\'utilisateur propriétaire de cette clé. Une clé ne peut jamais faire plus que son propriétaire.',
      lastUsedUtc: 'Dernière fois que la clé a authentifié une requête. Des dates anciennes signalent des clés inutilisées que vous pouvez supprimer.',
      authMode: 'Comment la clé peut s\'authentifier : envoyée directement, signée à chaque requête, échangée contre une session, ou n\'importe lequel de ces modes (Hybrid).',
      expiresUtc: 'Passé ce moment, la clé cesse de fonctionner. Laissez vide pour une clé sans expiration.',
      active: 'Les clés inactives sont refusées mais conservées, pour pouvoir les réactiver.',
      actions: {
        rotate: 'Remplacer le secret par un nouveau. L\'ancien secret cesse immédiatement de fonctionner ; le nouveau est affiché une seule fois.',
        permissions: 'Afficher toutes les autorisations effectives de cette clé après combinaison de son propriétaire, de ses rôles et de ses attributions.'
      }
    },
    roles: {
      add: 'Créer un rôle personnalisé, puis lui ajouter des autorisations et l\'attribuer à des utilisateurs ou à des clés.',
      name: 'Nom affiché lors de l\'attribution du rôle, par exemple Release Operator.',
      description: 'À quoi sert le rôle et à qui l\'attribuer.',
      active: 'Les rôles inactifs n\'accordent rien, même là où ils sont attribués.',
      actions: { clone: 'Créer une copie modifiable de ce rôle intégré, que vous pouvez ajuster.' }
    },
    permissions: {
      add: 'Créer une règle qui autorise ou refuse des opérations sur des types de ressources.',
      name: 'Nom court de la règle, affiché lors de la composition des rôles.',
      permissionType: '« Autoriser » accorde les opérations ci-dessous. « Refuser » les bloque et l\'emporte toujours sur « Autoriser ».',
      resourceTypes: 'Les types d\'enregistrements couverts par la règle. All couvre tous les types.',
      operationTypes: 'Les opérations couvertes par la règle, comme Read, Create ou Execute (invoquer).',
      active: 'Les autorisations inactives n\'ont aucun effet.'
    },
    userAssignments: {
      add: 'Attribuer un rôle à un utilisateur, pour tout le locataire ou pour un enregistrement précis.',
      userId: 'La personne qui reçoit le rôle.',
      roleName: 'Le rôle accordé. La personne obtient toutes ses autorisations.',
      roleId: 'Le rôle à accorder. La personne obtient toutes ses autorisations.',
      resourceScope: '« Locataire » applique le rôle à tous les enregistrements. « Ressource » le limite à l\'enregistrement indiqué ci-dessous.',
      resourceId: 'Identifiant de l\'enregistrement unique auquel le rôle s\'applique, par exemple un ID d\'agent.',
      inheritsToChildren: 'Appliquer le rôle à tous les enregistrements du locataire, y compris ceux créés plus tard.',
      active: 'Les attributions inactives n\'accordent rien mais sont conservées.'
    },
    credentialAssignments: {
      add: 'Attribuer un rôle à une clé d\'accès, pour tout le locataire ou pour un enregistrement précis.',
      credentialId: 'La clé d\'accès qui reçoit le rôle. Elle ne peut toujours pas dépasser les droits de son propriétaire.',
      roleName: 'Le rôle accordé à la clé.',
      roleId: 'Le rôle à accorder. Choisissez le rôle le plus restreint qui permet à l\'automatisation de faire son travail.',
      resourceScope: '« Locataire » applique le rôle à tous les enregistrements. « Ressource » le limite à l\'enregistrement indiqué ci-dessous.',
      resourceId: 'Identifiant de l\'enregistrement unique auquel le rôle s\'applique, par exemple le seul agent qu\'un job de CI peut invoquer.',
      inheritsToChildren: 'Appliquer le rôle à tous les enregistrements du locataire, y compris ceux créés plus tard.',
      active: 'Les attributions inactives n\'accordent rien mais sont conservées.'
    },
    harnessProfiles: {
      add: 'Décrire une nouvelle façon de lancer un agent CLI sans interface. Cloner un profil intégré est généralement plus simple.',
      name: 'Nom du profil. Les déploiements choisissent un profil par ce nom. Le préfixe builtin/ est réservé.',
      harnessType: 'Le harness que lance ce profil. Les workers annoncent les types qu\'ils peuvent exécuter, ce qui guide le placement.',
      executable: 'Commande à exécuter sur le worker, trouvée dans le PATH ou donnée sous forme de chemin absolu, par exemple claude.',
      outputParser: 'Comment la sortie du harness est transformée en événements de transcription et en résultat final.',
      description: 'Ce que ce profil a de particulier, par exemple les options qu\'il ajoute.',
      probeArguments: 'Arguments d\'une vérification de version qui ne consomme aucun jeton, comme --version. Les workers l\'exécutent au démarrage.',
      active: 'Les profils inactifs ne peuvent pas être utilisés par les nouvelles exécutions.',
      arguments: 'Arguments de ligne de commande ordonnés. Chacun est un modèle, peut être ignoré selon une condition et peut être répété sur une liste.',
      argumentsItems: {
        template: 'Texte d\'un argument, par exemple --model ou {{deployment.model}}.',
        condition: 'Expression de modèle ; lorsqu\'elle produit une valeur vide ou false, cet argument est ignoré.',
        repeatOver: 'Nom d\'une variable de type liste ; l\'argument est émis une fois par élément.'
      },
      promptDelivery: 'Comment le prompt de tâche parvient au harness : sur l\'entrée standard, en argument ou dans un fichier.',
      promptArgumentTemplate: 'L\'argument ou le nom de fichier utilisé lorsque le prompt n\'est pas envoyé sur l\'entrée standard.',
      systemPromptDelivery: 'Comment le prompt système parvient au harness : un fichier, un argument, une variable d\'environnement, ajouté en tête de la tâche, ou pas du tout.',
      systemPromptTarget: 'L\'option, la variable ou le nom de fichier qui transporte le prompt système.',
      mcpConfigFormat: 'Le format de configuration MCP que lit ce harness. Garrison y écrit les serveurs MCP liés à l\'exécution.',
      mcpConfigFileName: 'Nom du fichier de configuration MCP généré, dans le répertoire de configuration de l\'exécution.',
      environment: 'Variables d\'environnement du processus. Les valeurs sont des modèles ; {{secret.alias}} insère un secret lié.',
      environmentItems: {
        name: 'Nom de la variable, par exemple ANTHROPIC_API_KEY.',
        valueTemplate: 'Modèle de la valeur. Utilisez {{secret.alias}} pour les identifiants.',
        condition: 'Expression de modèle ; lorsqu\'elle produit une valeur vide ou false, la variable n\'est pas définie.',
        isSecret: 'Traiter la valeur comme secrète : jamais journalisée et masquée dans les aperçus.'
      },
      files: 'Fichiers écrits avant le lancement, comme des fichiers de paramètres ou auth.json.',
      filesItems: FILE_ITEMS,
      credentialEnvironmentAllowlist: 'Noms des variables d\'environnement qui peuvent être alimentées par des secrets pour ce harness. Toute autre variable est refusée.',
      genericTextField: 'Chemin JSON vers le texte de l\'assistant dans chaque ligne de sortie, pour l\'analyseur Generic JSONL.',
      genericFinalField: 'Chemin JSON vers le texte du résultat final, pour l\'analyseur Generic JSONL.',
      genericSuccessField: 'Chemin JSON qui indique si l\'exécution a réussi, pour l\'analyseur Generic JSONL.',
      genericSuccessValue: 'La valeur au chemin de réussite qui signifie que l\'exécution a réussi, par exemple true.',
      resultSource: 'D\'où provient la réponse finale : l\'événement final de l\'analyseur, un fichier de dernier message ou toute la sortie standard.',
      resultFileName: 'Nom du fichier dans lequel le harness écrit son dernier message, lorsque la source du résultat est un fichier.',
      successPolicy: 'Comment la réussite est déterminée : par l\'événement final de l\'analyseur, par le code de sortie, ou par les deux.',
      successExitCodes: 'Codes de sortie considérés comme une réussite lorsque la politique utilise les codes de sortie. Un par ligne.',
      defaultTimeoutSeconds: 'Échéance de l\'exécution en secondes lorsque le déploiement n\'en définit pas. Entre 5 et 86400.',
      killGraceSeconds: 'Secondes entre la demande d\'arrêt du processus et la destruction de son arbre de processus. Entre 0 et 60.',
      maxOutputBytes: 'Quantité maximale de sortie standard qu\'une exécution peut produire avant d\'échouer avec le résultat « Limite de sortie dépassée ».',
      stderrTailBytes: 'Quantité de la fin de la sortie d\'erreur standard à conserver pour la page de détail de l\'exécution.',
      isolateHome: 'Donner à chaque exécution son propre répertoire HOME pour que les paramètres et caches du harness ne fuient jamais d\'une exécution à l\'autre.',
      supportsResume: 'Indique si ce harness peut reprendre une session antérieure. Utilisé par les conversations.',
      steps: {
        basics: 'Nom, type de harness, exécutable et sonde de version.',
        invocation: 'Arguments, transmission du prompt, configuration MCP, environnement et fichiers.',
        output: 'Comment la sortie est analysée et comment la réussite est déterminée.',
        limits: 'Délais d\'expiration, limites de sortie et isolation du HOME.'
      },
      actions: { clone: 'Créer une copie modifiable de ce profil dans votre locataire, nommée avec le suffixe -custom.' }
    },
    promptTemplates: {
      actions: { clone: 'Copier ce modèle sous un nouveau nom de votre choix, puis ouvrir la copie dans l\'éditeur.' },
      add: 'Rédiger un nouveau modèle de prompt dans l\'éditeur avec aperçu en direct. Chaque enregistrement crée une version.',
      name: 'Nom du modèle, unique dans le locataire. Les déploiements lient les modèles par ID, donc le renommer conserve leurs liaisons ; les inclusions y font référence par son nom.',
      kind: 'L\'usage du modèle : prompt système, enveloppe de tâche, fragment, description d\'outil ou fichier de configuration.',
      currentVersion: 'La version enregistrée la plus récente. Les déploiements épinglent une version ou suivent la plus récente.',
      description: 'Ce que fait le modèle et où il est utilisé.'
    },
    mcpServers: {
      add: 'Enregistrer un serveur MCP pour que les déploiements puissent le lier et que leurs agents puissent utiliser ses outils.',
      name: 'Nom du serveur. Les déploiements le lient par ce nom et lui donnent un alias.',
      transport: 'Les serveurs HTTP sont joints à une URL ; les serveurs stdio sont démarrés par le harness en tant que processus local.',
      endpoint: 'Où joindre le serveur : son URL et son chemin, ou la commande pour un serveur stdio.',
      required: 'Si activé, une exécution échoue avant le lancement lorsque ce serveur ou ses outils requis sont injoignables.',
      description: 'Les outils proposés par ce serveur et les agents qui doivent l\'utiliser.',
      url: 'URL de base du serveur telle que les nœuds worker peuvent la joindre, sans le chemin MCP.',
      path: 'Chemin du point de terminaison MCP sur ce serveur, généralement /mcp.',
      headers: 'En-têtes HTTP envoyés au serveur, comme Authorization. Les valeurs peuvent utiliser {{secret.alias}}.',
      headersItems: {
        name: 'Nom de l\'en-tête, par exemple Authorization.',
        valueTemplate: 'Modèle de la valeur de l\'en-tête, par exemple Bearer {{secret.github}}.'
      },
      command: 'Exécutable qui démarre le serveur stdio sur le worker.',
      arguments: 'Arguments de la commande du serveur stdio, un par ligne.',
      environment: 'Variables d\'environnement du processus du serveur stdio. Les valeurs peuvent utiliser {{secret.alias}}.',
      environmentItems: {
        name: 'Nom de la variable pour le processus du serveur.',
        valueTemplate: 'Modèle de la valeur. Utilisez {{secret.alias}} pour les identifiants.'
      },
      requiredTools: 'Outils qui doivent exister sur ce serveur. Le worker vérifie avant le lancement et fait échouer l\'exécution s\'il en manque un.',
      toolTimeoutSeconds: 'Durée maximale d\'un appel d\'outil avant que le harness ne l\'abandonne.',
      active: 'Les serveurs inactifs sont exclus des nouvelles exécutions, même lorsqu\'un déploiement les lie.',
      actions: { test: 'Se connecter maintenant au serveur et lister ses outils, pour vérifier l\'adresse et les identifiants.' }
    },
    secrets: {
      status: 'Indique si l\'identifiant enregistré fonctionne encore. Garrison signale une connexion Codex comme à renouveler lorsqu\'elle ne peut plus être actualisée.',
      accessTokenExpiresUtc: 'Date d\'expiration du jeton d\'accès d\'une connexion ChatGPT Codex enregistrée. Garrison le renouvelle avant et réécrit les nouveaux jetons dans le secret.',
      refreshedUtc: 'Date à laquelle Garrison a lui-même renouvelé cette connexion Codex pour la dernière fois. Les exécutions ne reçoivent qu\'une copie sans le jeton d\'actualisation.',
      statusMessage: 'Pourquoi la connexion est inutilisable, selon le fournisseur.',
      statusUtc: 'Date à laquelle Garrison a constaté que la connexion ne peut plus être renouvelée.',
      add: 'Enregistrer un nouveau secret, comme une clé API ou un jeton, chiffré au repos. Les déploiements y font référence par alias ; la valeur n\'est plus jamais affichée après l\'enregistrement.',
      name: 'Nom du secret. Les déploiements choisissent le secret par ce nom et lui donnent un alias.',
      kind: 'Le type d\'identifiants que contient ce secret. Les profils intégrés utilisent ce type pour savoir quelle variable ou quel fichier remplir.',
      valueLast4: 'Les quatre derniers caractères de la valeur stockée, pour distinguer les secrets sans les révéler.',
      rotatedUtc: 'Date à laquelle la valeur a été définie ou renouvelée pour la dernière fois.',
      expiresUtc: 'Expiration indicative. Renouvelez la valeur avant cette date.',
      description: 'D\'où vient la valeur et quels agents en ont besoin.',
      value: 'La valeur du secret. Elle est chiffrée à l\'enregistrement et ne peut jamais être relue, seulement remplacée.',
      newValue: 'La valeur de remplacement. Elle s\'applique à toutes les exécutions compilées après l\'enregistrement.',
      active: 'Les secrets inactifs ne sont pas injectés dans les exécutions.',
      saveValue: 'Chiffrer et enregistrer la nouvelle valeur. L\'ancienne valeur est supprimée et ne peut pas être récupérée.',
      actions: {
        setValue: 'Remplacer la valeur stockée par une nouvelle valeur que vous saisissez. L\'ancienne valeur ne peut pas être récupérée.',
        rotate: 'Mettre en place une nouvelle valeur et enregistrer l\'heure du renouvellement, par exemple après l\'émission d\'une nouvelle clé par le fournisseur.'
      }
    },
    workspaces: {
      add: 'Définir comment le répertoire de travail d\'une exécution est préparé : vide, cloné depuis Git ou prérempli avec des fichiers.',
      name: 'Nom du modèle. Les déploiements choisissent un modèle d\'espace de travail par ce nom.',
      kind: '« Vide » démarre sans rien, « Dépôt Git » clone un dépôt, « Fichiers préchargés » écrit les fichiers listés ci-dessous.',
      gitUrl: 'Dépôt à cloner pour chaque exécution. Les dépôts privés nécessitent un secret de type « Identifiants Git ».',
      retention: 'Ce qui arrive au répertoire après l\'exécution : le supprimer, le conserver ou le conserver uniquement en cas d\'échec.',
      description: 'Ce que contient l\'espace de travail et quels agents l\'utilisent.',
      gitRef: 'Branche, tag ou commit à extraire. Laissez vide pour la branche par défaut.',
      gitDepth: 'Nombre de commits à récupérer. 1 est le plus rapide ; 0 récupère tout l\'historique.',
      gitCredentialSecretId: 'Secret contenant le jeton ou le mot de passe utilisé pour cloner un dépôt privé.',
      persistentVolumeClaim: 'Nom du PersistentVolumeClaim monté sur le chemin de l\'espace de travail. Il doit déjà exister dans l\'espace de noms d\'exécution ; Garrison ne le crée ni ne le supprime jamais.',
      files: 'Fichiers écrits dans l\'espace de travail avant le démarrage de l\'exécution.',
      filesItems: {
        path: 'Chemin du fichier relatif à la racine de l\'espace de travail.',
        content: 'Contenu texte du fichier.'
      },
      active: 'Les modèles inactifs ne peuvent pas être utilisés par les nouvelles exécutions.'
    },
    modelPrices: {"add": "Ajoutez un prix pour un harness et un modèle servi précis. Aucun tarif fournisseur n’est préchargé.", "name": "Nom de configuration unique pour ce prix dans le locataire.", "description": "Notes de l’opérateur sur la source et la date d’effet de ces tarifs.", "active": "Les prix inactifs ne sont pas utilisés. Modifier ou supprimer un prix ne change pas les coûts enregistrés des exécutions.", "model": "Saisissez le nom exact du modèle, de 1 à 256 caractères sans caractères de contrôle.", "harnessType": "Harness dont le comptage des jetons et le nom exact du modèle correspondent à ces tarifs.", "inputUsdPerMillion": "Entrée USD / million de jetons. Saisissez un tarif fini entre 0 et 1 000 000 000. Zéro est valide.", "outputUsdPerMillion": "Sortie USD / million de jetons. Saisissez un tarif fini entre 0 et 1 000 000 000. Zéro est valide.", "cachedInputUsdPerMillion": "Laissez vide pour utiliser le tarif d’entrée ou de sortie correspondant. Zéro signifie gratuit.", "reasoningUsdPerMillion": "Laissez vide pour utiliser le tarif d’entrée ou de sortie correspondant. Zéro signifie gratuit.", "inputIncludesCachedTokens": "Activez si l’entrée inclut les jetons en cache. Désactivez pour Claude Code, qui déclare séparément les lectures du cache.", "outputIncludesReasoningTokens": "Activez si la sortie inclut les jetons de raisonnement. Les sous-totaux inclus sont déduits avant l’application de leur tarif distinct."},
    usageQuotas: {"add": "Ajoutez un quota pour un locataire, agent ou déploiement. Les limites vides sont illimitées.", "name": "Nom. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "description": "Description. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "active": "Actif. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "scope": "Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "resourceId": "Ajoutez un quota pour un locataire, agent ou déploiement. Les limites vides sont illimitées.", "dailyRunLimit": "Exécutions par jour UTC. Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives.", "dailyTokenLimit": "Jetons par jour UTC. Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives.", "dailyCostUsdLimit": "USD connus par jour UTC. Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives.", "maxConcurrentRuns": "Maximum d’exécutions actives. Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives.", "actions": {"usage": "Usage quotidien. Exécutions par jour UTC. Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives."}, "usage": {"windowStartUtc": "Début de période (UTC). Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "windowEndUtc": "Réinitialisation quotidienne (UTC). Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "runsUsed": "Exécutions admises. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "tokensUsed": "Jetons terminés. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "costUsd": "Coût connu (USD). Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "unknownCostRuns": "Exécutions sans coût. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "activeRuns": "Exécutions actives. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement."}},
    artifactStores: {
      add: 'Créer une destination pour les fichiers produits par les exécutions, afin qu\'ils survivent à l\'espace de travail de l\'exécution.',
      name: 'Nom du stockage. Les déploiements choisissent un stockage d\'artefacts par ce nom.',
      kind: 'Où les fichiers sont conservés : la base de données Garrison, un répertoire du système de fichiers ou un bucket S3.',
      description: 'Ce qui est stocké ici et combien de temps le conserver.',
      active: 'Les stockages inactifs ne reçoivent aucun nouvel artefact.'
    },
    agents: {
      add: 'Créer une nouvelle identité d\'agent. Elle ne fait rien tant que vous ne lui avez pas ajouté au moins un déploiement.',
      name: 'Nom compatible DNS que les appelants utilisent pour invoquer l\'agent via REST, MCP et A2A. Lettres minuscules, chiffres et tirets.',
      displayName: 'Nom convivial affiché dans la console et dans la carte d\'agent A2A.',
      kind: 'Les agents hébergés s\'exécutent ici via des déploiements. Les agents distants s\'exécutent ailleurs et sont appelés via leur point de terminaison.',
      exposure: 'Les protocoles qui annoncent l\'agent : A2A lui donne une carte d\'agent ; MCP en fait un outil pour les clients MCP.',
      delegationMode: 'Les autres agents que les exécutions de cet agent peuvent invoquer : aucun, une liste d\'autorisation ou n\'importe quel agent.',
      tags: 'Libellés pour retrouver et regrouper les agents. Ils n\'ont aucun effet sur l\'exécution de l\'agent.',
      description: 'Ce que fait l\'agent, en termes simples. Ce texte est montré aux appelants et dans la carte A2A : rédigez-le pour eux.',
      agentVersion: 'Chaîne de version annoncée dans la carte A2A. Modifiez-la lorsque le comportement de l\'agent change.',
      remoteProtocol: 'Comment Garrison appelle l\'agent distant : A2A ou MCP.',
      remoteEndpointUrl: 'Adresse du point de terminaison A2A ou MCP de l\'agent distant.',
      exposeA2A: 'Publier une carte d\'agent A2A pour que d\'autres agents A2A puissent découvrir et appeler cet agent.',
      exposeMcpTool: 'Proposer cet agent comme outil à part entière sur le serveur MCP de Garrison, pour que les clients MCP puissent l\'appeler directement.',
      mcpToolName: 'Nom d\'outil vu par les clients MCP. Laissez vide pour utiliser le nom de l\'agent.',
      skills: 'Compétences A2A listées dans la carte d\'agent. Elles décrivent ce que les appelants peuvent demander.',
      skillsItems: {
        skillId: 'Identifiant stable de la compétence dans la carte A2A.',
        name: 'Nom court de la compétence, affiché aux appelants A2A.',
        description: 'Ce que fait la compétence, rédigé pour l\'agent appelant.'
      },
      inputMode: 'Text accepte un message simple. Structured exige une entrée conforme au JSON Schema d\'entrée.',
      inputSchemaJson: 'JSON Schema auquel l\'entrée doit se conformer lorsque le mode d\'entrée est Structured.',
      outputSchemaJson: 'JSON Schema auquel le résultat doit se conformer. Garrison valide la sortie et réessaie une fois avec un prompt de correction.',
      delegationAllowList: 'Les agents que cet agent peut appeler lorsque la délégation utilise une liste d\'autorisation.',
      delegationMaxDepth: 'Nombre de niveaux d\'appels d\'agent à agent autorisés sous cet agent. Entre 0 et 10.',
      delegationAllowRecursion: 'Permettre au même agent d\'apparaître deux fois dans une même chaîne d\'appels. Désactivé, cela empêche les boucles.',
      active: 'Les agents inactifs ne peuvent pas être invoqués.',
      sections: {
        identity: 'Qui est l\'agent : son nom, sa description, son type et sa version.',
        exposure: 'Les protocoles qui annoncent l\'agent et les compétences qu\'il liste.',
        io: 'L\'entrée que l\'agent accepte et la sortie qu\'il doit renvoyer.',
        delegation: 'Si cet agent peut appeler d\'autres agents, et jusqu\'à quelle profondeur.'
      }
    },
    deployments: {
      approvalsEnabled: 'Faire demander le harness avant les appels d\'outil. Les règles ci-dessous décident la plupart des appels ; les autres attendent une personne dans la boîte de réception Approbations. Profils Claude Code et app-server Codex uniquement.',
      approvalDefaultAction: 'Ce qui se passe quand aucune règle ne correspond à un appel d\'outil : l\'autoriser, le refuser ou demander à une personne.',
      approvalTimeoutSeconds: 'Combien de temps un appel attend une personne avant que la décision d\'expiration s\'applique, de 10 à 3 600 secondes.',
      approvalTimeoutDecision: 'La décision appliquée quand personne ne répond à temps. Refuser est le choix sûr.',
      approvalRules: 'Règles ordonnées dans la syntaxe Claude Code. Refuser l\'emporte sur Demander et Demander sur Autoriser ; pour une même action, la première correspondance est signalée.',
      approvalRulesItems: {
        action: 'Ce que reçoit un appel correspondant : Autoriser, Refuser ou Demander à une personne.',
        pattern: 'Règle Claude Code, par exemple Bash(npm test), Bash(npm run *), Edit(src/**), Read, WebFetch(domain:example.com) ou mcp__github__*.',
        inputPattern: 'Expression régulière .NET facultative à laquelle le JSON d\'entrée de l\'outil doit aussi correspondre, pour un contrôle plus fin que le motif.',
        description: 'Pourquoi cette règle existe, à l\'intention des personnes qui la maintiennent.'
      },
      approvalTest: 'Tester un appel d\'outil avec les règles enregistrées du déploiement et voir s\'il serait autorisé, refusé ou soumis à une personne.',
      add: 'Créer un déploiement : la manière concrète dont un agent s\'exécute, avec un profil de harness, un modèle, des prompts et des ressources.',
      name: 'Nom du déploiement, unique dans le locataire, par exemple reviewer-claude.',
      agentId: 'L\'agent que ce déploiement exécute. L\'invocation de cet agent peut choisir ce déploiement.',
      harnessProfileId: 'Le profil de harness qui lance la CLI, par exemple builtin/claude-code.',
      model: 'Nom du modèle transmis au harness, par exemple sonnet ou gpt-5. Disponible dans les modèles sous deployment.model.',
      weight: 'Poids de trafic parmi les déploiements actifs de l\'agent. Un déploiement de poids 300 reçoit trois fois plus d\'appels qu\'un déploiement de poids 100.',
      configVersion: 'Augmente à chaque modification. Chaque exécution enregistre la version à partir de laquelle elle a été compilée.',
      description: 'En quoi ce déploiement diffère des autres déploiements de l\'agent, par exemple un modèle moins cher.',
      active: 'Les déploiements inactifs ne reçoivent pas de trafic pondéré, mais les appelants peuvent toujours les désigner explicitement.',
      fallbackModel: 'Modèle à utiliser lorsque le modèle principal est surchargé, si le harness le prend en charge.',
      effort: 'Indication d\'effort de raisonnement transmise aux harness qui la prennent en charge, comme low, medium ou high.',
      maxTurns: 'Nombre maximal de tours d\'agent qu\'une exécution peut effectuer avant que le harness ne l\'arrête.',
      maxBudgetUsd: 'Plafond de dépense par exécution en dollars américains, pour les harness qui en appliquent un.',
      parameters: 'Valeurs nommées que les modèles peuvent lire sous deployment.parameters.name.',
      parametersItems: {
        name: 'Nom du paramètre, référencé sous deployment.parameters.name.',
        value: 'Valeur par défaut. Les appelants ne peuvent la remplacer que si elle figure dans les remplacements par exécution autorisés.'
      },
      promptBindings: 'Le modèle de prompt qui remplit chaque rôle (System, Task, DelegatedTask, etc.).',
      promptBindingsItems: {
        role: 'Le rôle de prompt rempli par cette liaison, comme System ou Task.',
        templateId: 'Le modèle utilisé pour ce rôle.',
        pinnedVersion: 'Version à épingler. Laissez vide pour toujours utiliser la version la plus récente.'
      },
      resourceBindings: 'Serveurs MCP et secrets utilisés par ce déploiement, chacun sous un alias pour les modèles.',
      resourceBindingsItems: {
        kind: 'Indique si cette liaison est un serveur MCP ou un secret.',
        alias: 'Nom court utilisé par les modèles, par exemple anthropic dans {{secret.anthropic}}.',
        resourceId: 'Le serveur MCP ou le secret lié.'
      },
      workspaceTemplateId: 'Comment le répertoire de travail de chaque exécution est préparé. Vide signifie un nouveau répertoire vide.',
      artifactStoreId: 'Où sont envoyés les fichiers produits par les exécutions une fois celles-ci terminées.',
      argumentOverrides: 'Modifications des arguments du profil de harness pour ce déploiement uniquement : ajouter à la fin, ajouter au début, remplacer ou retirer.',
      argumentOverridesItems: {
        operation: 'Action à effectuer : ajouter à la fin, ajouter au début, remplacer un argument correspondant ou le retirer.',
        match: 'L\'argument existant à remplacer ou à retirer.',
        template: 'Le texte du nouvel argument. Les modèles sont autorisés.',
        condition: 'Expression de modèle ; lorsqu\'elle produit une valeur vide ou false, le remplacement est ignoré.'
      },
      environmentOverrides: 'Variables d\'environnement ajoutées ou remplacées pour ce déploiement uniquement.',
      environmentOverridesItems: {
        name: 'Nom de la variable à ajouter ou à remplacer.',
        valueTemplate: 'Modèle de la valeur. Utilisez {{secret.alias}} pour les secrets liés.',
        isSecret: 'Traiter la valeur comme secrète : jamais journalisée et masquée dans les aperçus.'
      },
      fileOverrides: 'Fichiers ajoutés ou remplacés pour ce déploiement uniquement.',
      fileOverridesItems: FILE_ITEMS,
      allowedRunOverrides: 'Paramètres que les appelants peuvent modifier à chaque exécution, avec validation. Tout le reste reste fixe.',
      allowedRunOverridesItems: {
        name: 'Paramètre que les appelants peuvent définir à chaque exécution, comme model ou tone.',
        validation: 'Comment la valeur de l\'appelant est vérifiée : n\'importe quelle valeur, une liste de valeurs, une expression régulière ou une plage numérique.',
        pattern: 'Valeurs autorisées séparées par des virgules, une expression régulière, ou min,max pour une plage numérique.'
      },
      nodePoolId: 'S\'exécuter uniquement sur les nœuds de ce pool. Laissez vide pour autoriser tout nœud éligible.',
      nodeSelector: 'Étiquettes de nœud qui doivent correspondre exactement, par exemple gpu=true.',
      nodeSelectorItems: {
        key: 'Nom de l\'étiquette que le nœud doit avoir.',
        value: 'Valeur de l\'étiquette que le nœud doit avoir.'
      },
      maxConcurrentRuns: 'Nombre maximal d\'exécutions simultanées de ce déploiement sur l\'ensemble des nœuds. 0 signifie aucune limite.',
      timeoutSeconds: 'Échéance de l\'exécution en secondes. Vide utilise la valeur du profil de harness. Le paramètre du cluster Runtime.MaxRunSeconds borne toute exécution, y compris les durées maximales par exécution.',
      maxAttempts: 'Nombre total de tentatives autorisées pour une exécution. Entre 1 et 10.',
      retryOnNodeLoss: 'Remettre l\'exécution en file d\'attente lorsque son nœud disparaît, au lieu de la faire échouer.',
      steps: {
        approvals: 'Quels appels d\'outil le harness peut effectuer, lesquels sont interdits et lesquels attendent une personne.',
        basics: 'Nom, agent et poids de trafic.',
        harness: 'Profil de harness, modèle, limites et paramètres.',
        prompts: 'Le modèle qui remplit chaque rôle de prompt.',
        resources: 'Serveurs MCP, secrets, espace de travail et stockage d\'artefacts.',
        overrides: 'Modifications propres au déploiement pour les arguments, l\'environnement et les fichiers, et ce que les appelants peuvent remplacer.',
        placement: 'Où les exécutions peuvent avoir lieu et combien simultanément.'
      },
      actions: {
        compilePreview: 'Compiler ce déploiement avec un message d\'exemple et voir la ligne de commande, les fichiers et l\'environnement exacts qu\'obtiendrait une exécution.',
        test: 'Ouvrir « Invoquer » avec ce déploiement présélectionné pour lui envoyer un vrai message.'
      },
      repetitionGuard: 'Arrêter une exécution quand sa réponse dégénère en un même texte court répété encore et encore, ou en espaces et ponctuation seulement (résultat Répétition détectée). Non défini, il suit la valeur du cluster ; cochez ou décochez la case pour le fixer sur ce déploiement.',
      maxAssistantChars: 'Nombre maximal de caractères de texte de l\'assistant qu\'une exécution peut écrire avant que Garrison ne l\'arrête (résultat Limite de sortie dépassée). 0 signifie illimité ; vide utilise la valeur du cluster.',
      noProgressSeconds: 'Arrêter une exécution quand aucun texte, raisonnement, appel d\'outil ni résultat d\'outil n\'arrive pendant ce nombre de secondes alors qu\'aucun appel d\'outil n\'est en cours (résultat Aucune progression). 0 la désactive ; vide utilise la valeur du cluster.',
      executor: 'Comment les exécutions s\'exécutent : Processus (dans le worker) ou Job Kubernetes (un pod par exécution, isolation plus forte). Vide suit l\'exécuteur par défaut du pool de nœuds, sinon Processus.',
      podCpuRequest: 'CPU demandé par le pod d\'exécution, par exemple 250m. Vide utilise la valeur par défaut du worker.',
      podCpuLimit: 'CPU maximal utilisable par le pod d\'exécution, par exemple 2. Vide utilise la valeur par défaut du worker.',
      podMemoryRequest: 'Mémoire demandée par le pod d\'exécution, par exemple 512Mi. Vide utilise la valeur par défaut du worker.',
      podMemoryLimit: 'Mémoire maximale utilisable par le pod d\'exécution, par exemple 4Gi. Une exécution au-delà est arrêtée avec le résultat Échec du pod d\'exécution.',
      podEphemeralStorageRequest: 'Disque local demandé par le pod d\'exécution pour son espace de travail, son home et ses fichiers temporaires, par exemple 1Gi.',
      podEphemeralStorageLimit: 'Disque local maximal utilisable par le pod d\'exécution, par exemple 10Gi. Un pod au-delà est évincé et l\'exécution échoue.',
      useClusterDefault: 'Effacer le réglage propre à ce déploiement pour que la garde de répétition suive de nouveau la valeur du cluster.',
      sections: {
        guards: 'Les gardes d\'exécution arrêtent tôt les exécutions qui s\'emballent, sur tous les harness. Chacune laissée vide suit sa valeur du cluster dans Paramètres (Moteur d\'exécution).',
        execution: 'Choisissez où s\'exécutent les exécutions et, pour les exécutions Job Kubernetes, le CPU, la mémoire et le disque du pod.'
      }
    },
    nodePools: {
      add: 'Créer un pool pour regrouper des nœuds et éventuellement les réserver à certains locataires.',
      name: 'Nom du pool. Les nœuds rejoignent un pool lors de leur enregistrement, et les déploiements peuvent en exiger un.',
      description: 'Le matériel ou l\'usage que représente ce pool.',
      tenants: 'Locataires autorisés à utiliser le pool. Vide signifie tous les locataires.',
      defaultExecutor: 'Exécuteur des exécutions des déploiements de ce pool qui n\'en choisissent pas. Vide signifie Processus.',
      active: 'Les pools inactifs n\'acceptent aucune nouvelle exécution.'
    },
    runs: {
      ...TELEMETRY,
      id: 'Identifiant de l\'exécution. Cliquez sur la ligne pour ouvrir la transcription, le résultat et la télémétrie.',
      agentName: 'L\'agent invoqué. Une exécution appartient toujours à un déploiement de cet agent.',
      status: 'L\'étape du cycle de vie de l\'exécution : en file d\'attente, sous bail, en cours ou l\'un des états terminés.',
      outcome: 'Pourquoi l\'exécution s\'est terminée, plus en détail que le statut, par exemple « Identifiants manquants ».',
      harnessType: 'Le harness qui a traité l\'exécution, issu du profil du déploiement.',
      leaseNodeName: 'Le nœud worker qui l\'a exécutée. Vide tant que l\'exécution est en file d\'attente.',
      depth: 'Profondeur de cette exécution dans la chaîne d\'appels d\'agent à agent. 0 correspond à une exécution lancée directement par un appelant.',
      createdUtc: 'Moment où l\'exécution a été demandée. Survolez la valeur pour voir l\'heure exacte.',
      actions: {
        cancel: 'Arrêter cette exécution. Le worker termine le processus de harness et l\'exécution se termine avec le statut « Annulée ».',
        retry: 'Lancer une nouvelle exécution avec la même entrée et le même déploiement. L\'exécution d\'origine est conservée.'
      },
      conversationId: 'La conversation dont cette exécution est un tour, avec son numéro de tour. Vide pour les exécutions hors conversation.',
      conversationTurn: 'Position de cette exécution dans sa conversation ; le tour qui l\'a démarrée porte le numéro 1.'
    },
    nodes: {
      name: 'Nom du nœud, généralement le nom du pod Kubernetes du worker.',
      status: 'Indique si le nœud accepte de nouvelles exécutions. Isolez ou drainez un nœud avant une maintenance.',
      capacity: 'Exécutions détenues actuellement par le nœud, sur le maximum qu\'il accepte simultanément.',
      harnesses: 'Harness que le nœud a trouvés installés et fonctionnels lors de leur sondage au démarrage.',
      executors: 'Exécuteurs proposés par le nœud. Job Kubernetes n\'apparaît que si le worker tourne dans un cluster avec le droit de créer des Jobs.',
      labels: 'Étiquettes clé et valeur annoncées par le nœud. Les sélecteurs de nœuds des déploiements sont comparés à celles-ci.',
      nodeVersion: 'Version du logiciel worker sur le nœud.',
      lastHeartbeatUtc: 'Dernier signal de vie reçu du nœud. Les nœuds qui cessent d\'envoyer des signaux de vie passent au statut « Perdu ».',
      address: 'Adresse indicative signalée par le nœud.',
      maxConcurrentRuns: 'Nombre maximal d\'exécutions que ce nœud accepte simultanément.',
      activeRuns: 'Exécutions détenues par le nœud en ce moment.',
      capabilities: 'Ce que chaque sonde de harness a trouvé : type, version détectée et disponibilité.',
      labelsItems: { key: 'Nom de l\'étiquette, comparé par les sélecteurs de nœuds des déploiements.', value: 'Valeur de l\'étiquette, comparée exactement par les sélecteurs de nœuds des déploiements.' },
      capabilitiesItems: {
        harnessType: 'Harness vérifié par la sonde.',
        detectedVersion: 'Chaîne de version signalée par le harness.',
        available: 'Indique si le harness peut s\'exécuter sur ce nœud.',
        detail: 'Sortie de la sonde, utile lorsqu\'un harness est indisponible.'
      },
      actions: {
        grafana: 'Ouvrir le tableau de bord Workers dans Grafana dans un nouvel onglet, filtré sur le nœud {{node}}.',
        cordon: 'Cesser d\'envoyer de nouvelles exécutions à ce nœud. Les exécutions déjà présentes se terminent normalement.',
        uncordon: 'Autoriser à nouveau ce nœud à accepter de nouvelles exécutions.',
        drain: 'Bloquer les nouvelles exécutions et laisser les exécutions en cours se terminer, puis le nœud devient inactif. À utiliser avant de l\'arrêter.',
        runs: 'Ouvrir la liste « Exécutions » filtrée sur celles exécutées par ce nœud.'
      }
    },
    controlNodes: {
      name: 'Nom du réplica : l\'ID de nœud avec lequel le serveur tourne (GARRISON_NODE_ID, le nom du pod dans Kubernetes).',
      status: 'Cycle de vie du réplica : Démarrage, Prêt, Drainage en cours ou Hors ligne. Seuls les réplicas prêts traitent du trafic.',
      version: 'Version du serveur Garrison exécutée par ce réplica. Des versions différentes ne sont attendues que pendant une mise à jour progressive.',
      schemaVersion: 'Version du schéma de base de données trouvée par le réplica au démarrage. Tous les réplicas devraient indiquer le même numéro.',
      backplane: 'Comment ce réplica partage les événements en direct (flux des exécutions, mises à jour WebSocket) avec les autres réplicas.',
      uptime: 'Depuis combien de temps le processus du réplica tourne, à partir de son démarrage. Survolez pour voir l\'heure exacte de démarrage.',
      lastHeartbeatUtc: 'Quand le réplica a envoyé son dernier signal de vie. Les réplicas en envoient un toutes les 5 secondes ; au-delà de 15 secondes, la valeur est mise en évidence comme muette.',
      activeRequests: 'Requêtes HTTP que le réplica traitait lors de son dernier signal de vie.',
      openStreams: 'Flux d\'événements envoyés par le serveur et connexions WebSocket ouverts sur le réplica lors de son dernier signal de vie.',
      heldLongPolls: 'Requêtes long polling de bail des workers que le réplica tenait lors de son dernier signal de vie. Les workers inactifs y attendent de nouvelles exécutions.',
      address: 'Adresse IP et port REST du réplica, tels qu\'il les a signalés.',
      hostname: 'Nom d\'hôte de la machine ou du pod sur lequel tourne le réplica.',
      startedUtc: 'Quand le processus du réplica a démarré, dans votre fuseau horaire.',
      id: 'ID de nœud du réplica. Il correspond à respondingNodeId dans les réponses de l\'API et au libellé node des métriques.',
      isLeader: 'Indique si ce réplica détient le bail de leader pour la maintenance. Un seul réplica est leader à la fois.',
      leaderEpoch: 'Époque de fencing du bail de leader. Elle augmente chaque fois que la direction passe à un autre réplica.',
      respondingNodeId: 'Le réplica qui a répondu à cette lecture. Derrière un répartiteur de charge, il peut différer du réplica affiché.',
      answeredBy: 'Le nœud de contrôle qui a répondu à la requête de cette liste (respondingNodeId). Derrière un répartiteur de charge, chaque actualisation peut être servie par un autre réplica.',
      badges: {
        leader: 'Leader : ce réplica détient le bail de maintenance. Il assure le nettoyage selon la rétention, marque hors ligne les réplicas muets et effectue le reste de la maintenance du cluster.',
        leaderEpoch: 'Leader : ce réplica détient le bail de maintenance (époque {{epoch}}). Il assure le nettoyage selon la rétention, marque hors ligne les réplicas muets et effectue le reste de la maintenance du cluster.',
        stale: 'Muet : aucun signal de vie depuis plus de {{seconds}} secondes, alors que les réplicas en envoient un toutes les 5 secondes. Le réplica est peut-être surchargé, isolé du réseau ou arrêté ; le leader le marque hors ligne au bout de 30 secondes.'
      },
      actions: {
        grafana: 'Ouvrir le tableau de bord de vue d\'ensemble Garrison dans Grafana dans un nouvel onglet, filtré sur le nœud de contrôle {{node}}.'
      }
    },
    audit: {
      createdUtc: 'Moment où l\'événement s\'est produit, dans votre fuseau horaire local.',
      eventType: 'Le type d\'événement de sécurité ou de configuration.',
      principalName: 'Qui l\'a fait : un utilisateur, une clé d\'accès ou une exécution agissant pour un agent.',
      resource: 'Le type d\'enregistrement et l\'opération concernés, par exemple Agent / Read.',
      reason: 'Pourquoi l\'événement s\'est produit ou pourquoi l\'accès a été refusé.',
      sourceIp: 'Adresse réseau d\'où provient la requête.',
      principalType: 'Indique si l\'acteur était un utilisateur, une clé d\'accès ou un jeton d\'exécution.',
      principalId: 'Identifiant de l\'utilisateur, de la clé d\'accès ou de l\'exécution qui a agi.',
      resourceType: 'Type d\'enregistrement concerné, comme Agent ou Secret.',
      resourceId: 'Identifiant de l\'enregistrement concerné.',
      operation: 'Opération tentée, comme Read ou Execute.',
      method: 'Méthode HTTP de la requête.',
      path: 'Chemin de la requête à l\'origine de l\'événement.',
      authResult: 'Résultat de la vérification de l\'identité de l\'appelant.',
      authorizationResult: 'Résultat de la vérification de ce que l\'appelant peut faire.',
      bypassReason: 'Pourquoi l\'autorisation a été contournée, par exemple pour un administrateur système.',
      statusCode: 'Statut HTTP renvoyé à l\'appelant.',
      requestId: 'Identifiant de la requête. Utilisez-le pour rechercher dans « Historique des requêtes » ou dans les journaux du serveur.'
    },
    manifestApplies: {
      createdUtc: 'Moment où le manifeste a été appliqué ou simulé.',
      principalName: 'Qui l\'a appliqué.',
      dryRun: '« Oui » signifie qu\'il a seulement été validé et que rien n\'a été écrit.',
      counts: 'Nombre d\'enregistrements créés, mis à jour, inchangés ou en échec par les documents.'
    },
    conversations: {
      title: 'La première ligne du premier message, qui donne son nom à la conversation. Cliquez sur la ligne pour ouvrir ses tours.',
      agentName: 'L\'agent avec lequel la conversation a lieu. Chaque tour est envoyé à cet agent.',
      state: 'En cours tant qu\'un tour n\'est pas terminé ; un nouveau message est refusé jusque-là. Inactive quand le message suivant peut être envoyé.',
      turnCount: 'Le nombre de tours (exécutions) de la conversation, y compris ceux qui ont échoué.',
      affinityNodeName: 'Le nœud worker qui détient l\'espace de travail et la session de harness de la conversation. Le tour suivant privilégie ce nœud pour pouvoir reprendre.',
      fallbackCount: 'Le nombre de tours qui n\'ont pas pu reprendre la session de harness et ont démarré une nouvelle session avec la transcription des tours précédents.',
      lastFallbackReason: 'Pourquoi le tour reconstruit le plus récent n\'a pas pu reprendre la session, par exemple parce que le nœud d\'affinité n\'était pas prêt.',
      harnessType: 'Le harness qui exécute chaque tour, repris du déploiement du premier tour.',
      callerName: 'Qui a démarré la conversation : un utilisateur, une clé d\'accès ou l\'exécution d\'un autre agent.',
      contextId: 'L\'ID de contexte A2A fourni par le client, quand la conversation est arrivée par A2A. Vide pour les conversations démarrées par REST ou MCP.',
      sessionId: 'La session de harness que reprend le tour suivant. Vide tant qu\'aucun tour n\'en a signalé une.',
      lastActivityUtc: 'Quand le dernier tour a été envoyé ou s\'est terminé. Survolez la valeur pour l\'heure exacte.',
      createdUtc: 'Quand le premier tour a démarré la conversation. Survolez la valeur pour l\'heure exacte.',
      id: 'Identifiant de la conversation. Transmettez-le comme conversationId lors de l\'appel de l\'agent pour envoyer le tour suivant.',
      fallbackLast: 'Tours qui ont démarré une nouvelle session à partir de la transcription. Motif le plus récent : {{reason}}.',
      states: {
        busy: 'Un tour de cette conversation est encore en file d\'attente ou en cours. Attendez sa fin, ou annulez-le, avant d\'envoyer le message suivant.',
        idle: 'Aucun tour n\'est en cours. Le message suivant poursuit la conversation.'
      },
      actions: {
        continue: 'Ouvrir Invoquer avec cette conversation sélectionnée, pour que le message suivant soit envoyé comme son prochain tour.',
        runs: 'Ouvrir la liste des exécutions filtrée sur les tours de cette conversation, avec toutes les colonnes et filtres des exécutions.'
      }
    }
  },
  views: {
    approvalDetail: {
      openRun: 'Ouvrir l\'exécution qui a demandé, pour lire sa transcription autour de cet appel d\'outil.',
      openAgent: 'Ouvrir la page de l\'agent avec ses déploiements et ses exécutions récentes.',
      openDeployment: 'Ouvrir l\'onglet Déploiements filtré sur ce déploiement, où ses règles d\'approbation se modifient.',
      backToInbox: 'Revenir à la boîte de réception des approbations avec toutes les approbations en attente.',
      viewJson: 'Afficher l\'enregistrement complet de l\'approbation en JSON, exactement tel que l\'API le renvoie.',
      request: 'Ce que le harness a demandé de faire : le résumé d\'une ligne et l\'entrée complète de l\'outil avec les secrets masqués.',
      rules: 'La règle du déploiement qui correspondait, la règle que suggère cet appel et la règle mémorisée lors de la décision.',
      copyRule: 'Copier la règle suggérée, par exemple pour la coller dans les règles d\'approbation du déploiement.'
    },
    home: {
      observabilityState: {
        reachable: 'Le serveur a joint {{service}} à son URL interne au cours des 30 dernières secondes.',
        unreachable: 'Le serveur n\'a pas pu joindre {{service}} à son URL interne. Vérifiez que le service fonctionne et que le paramètre d\'URL interne pointe vers lui.',
        checking: 'Le serveur est interrogé pour savoir si {{service}} est accessible.',
        unknown: 'Le serveur n\'a pas indiqué si {{service}} est accessible. La vérification a échoué ou ce serveur ne la prend pas encore en charge.'
      },
      observabilityVersion: 'Version que {{service}} a indiquée lors de la vérification d\'état du serveur.',
      kpisGrafana: 'Ouvrir le tableau de bord de vue d\'ensemble de Garrison dans Grafana dans un nouvel onglet pour suivre ces chiffres dans le temps.',
      grafanaDashboards: 'Le dossier Garrison de Grafana contient un tableau de bord par section. Chaque lien ouvre ce tableau de bord dans un nouvel onglet.',
      grafanaSections: {
        overview: 'L\'état en un coup d\'œil : réplicas et workers actifs, débits d\'exécutions et de requêtes, erreurs, coût et problèmes récents.',
        http: 'Trafic REST par route : débit des requêtes, percentiles de latence, erreurs, tailles des charges utiles, échecs d\'authentification et requêtes en cours.',
        runs: 'Cycle de vie des exécutions : créées et terminées par résultat, durée de chaque étape, annulations, validation des sorties structurées et réparations.',
        agents: 'Performances par agent : invocations, percentiles de durée et d\'attente en file, délai avant le premier jeton, durée de streaming, résultats et déclenchements de garde-fous.',
        models: 'Consommation de jetons et coût par modèle et par agent : jetons d\'entrée, de sortie, en cache et de raisonnement, coût et débit de sortie.',
        workers: 'Nœuds workers : baux, exécutions par nœud, comptes rendus de fin, battements de cœur, emplacements libres et appels au plan de contrôle.',
        kubernetes: 'Exécuteur à un pod par exécution : Jobs créés et supprimés, latence de démarrage des pods, échecs de pod par cause et nettoyage des orphelins.',
        protocols: 'MCP, A2A et streaming : appels d\'outils et leur durée, sessions, méthodes A2A et états des tâches, flux SSE, WebSockets et délégation.',
        scheduler: 'Planification : profondeur de file par agent et harnais, résultats et latence des réservations, attentes longues des baux, exécutions bloquées et baux expirés.',
        database: 'Base de données : latence des requêtes par opération et table, erreurs, connexions utilisées, attentes du verrou d\'écriture et rétention.',
        controlPlane: 'Réplicas du plan de contrôle : statut, changements de leader, trafic et retard du backplane, battements de cœur et itérations des services d\'arrière-plan.',
        security: 'Échecs d\'authentification par schéma et motif, refus d\'autorisation, limitation de débit, jetons émis, déchiffrement des secrets et renouvellements de jetons Codex.',
        integrations: 'Appels sortants par service : tests de serveurs MCP, sondes d\'observabilité, proxy MCP, API Kubernetes et plan de contrôle vu des workers.',
        logs: 'Volume de journaux, erreurs et avertissements par composant et locataire, lignes d\'erreur récentes et liens vers les traces.'
      },
      observabilityDocs: 'Ouvrir le guide de télémétrie dans un nouvel onglet : comment collecter les métriques de Garrison et connecter Grafana, Prometheus, Tempo ou Loki.',
      observability: 'Liens vers les outils de métriques, de tableaux de bord et de traces que cette installation déclare configurés. Les services non configurés ne sont pas affichés.',
      kpis: {
        agents: 'Agents définis dans ce locataire. Cliquez pour ouvrir la liste des agents.',
        deployments: 'Déploiements de tous les agents. Chacun est une manière dont un agent peut s\'exécuter. Cliquez pour les ouvrir.',
        activeRuns: 'Exécutions sous bail ou en cours sur un worker en ce moment. Cliquez pour les voir.',
        queued: 'Exécutions en attente d\'un nœud worker. Un nombre qui ne cesse d\'augmenter signifie qu\'il vous faut plus de nœuds ou de capacité.',
        succeeded: 'Exécutions terminées avec succès au cours des dernières 24 heures. Cliquez pour les lister.',
        failed: 'Exécutions en échec au cours des dernières 24 heures. Cliquez pour les lister et lire la cause.',
        nodes: 'Nœuds worker prêts à prendre des exécutions, sur l\'ensemble des nœuds enregistrés. Cliquez pour les gérer.',
        controlNodes: 'Réplicas du plan de contrôle prêts, sur l\'ensemble des réplicas enregistrés (les lignes hors ligne restent listées 24 heures). Le leader est {{leader}}. Cliquez pour ouvrir Flotte > Plan de contrôle.',
        controlNodesNoLeader: 'Réplicas du plan de contrôle prêts, sur l\'ensemble des réplicas enregistrés (les lignes hors ligne restent listées 24 heures). Aucun réplica ne détient le bail de leader pour le moment, donc la maintenance du cluster est en pause. Cliquez pour ouvrir Flotte > Plan de contrôle.'
      },
      openFailure: 'Ouvrir cette exécution en échec pour lire sa transcription, son erreur et sa sortie stderr.',
      openControlPlane: 'Ouvrir Flotte > Plan de contrôle pour voir chaque réplica avec son statut, le leader, sa version, son signal de vie et son activité.',
      openWorkers: 'Ouvrir Flotte > Nœuds worker pour voir chaque worker avec sa capacité, ses harness et son signal de vie, et pour l\'isoler ou le drainer.',
      cta: {
        invoke: 'Envoyer un message à n\'importe quel agent depuis le navigateur.',
        addAgent: 'Aller dans « Agents » pour créer une nouvelle identité d\'agent.',
        applyManifest: 'Appliquer une configuration en YAML, par exemple un agent d\'exemple.',
        inspectRuns: 'Parcourir toutes les exécutions avec filtres et télémétrie.',
        nodes: 'Voir quels nœuds worker sont prêts et ce qu\'ils peuvent exécuter.',
        apiExplorer: 'Essayer n\'importe quel appel API en direct sur ce serveur.',
        analytics: 'Voir la vitesse d\'exécution, les jetons, le coût et les résultats dans le temps.'
      },
      services: {
        loki: 'Ouvrir Loki dans un nouvel onglet pour rechercher dans les journaux de Garrison.',
        grafana: 'Ouvrir les tableaux de bord Grafana des métriques Garrison dans un nouvel onglet.',
        prometheus: 'Ouvrir le serveur Prometheus qui collecte les métriques Garrison dans un nouvel onglet.',
        tempo: 'Ouvrir Tempo pour parcourir les traces dans un nouvel onglet.'
      },
      serviceGeneric: 'Ouvrir ce service fourni dans un nouvel onglet.'
    },
    runDetail: {
      openApproval: 'Ouvrir cette approbation avec l\'entrée complète de l\'outil, la règle et la décision.',
      reviewApprovals: 'Afficher les approbations de cette exécution, où vous pouvez autoriser ou refuser les appels d\'outil en attente.',
      approvalActions: 'Autoriser ou refuser un appel d\'outil en attente, ou ouvrir l\'approbation pour voir tous les champs.',
      viewTrace: 'Ouvrir la trace de cette exécution dans Grafana Explore (Tempo) dans un nouvel onglet. Elle montre les spans de compilation, de prise en charge et du harness sur le serveur et le nœud worker.',
      viewLogs: 'Ouvrir les lignes de journal du serveur et du worker concernant cette exécution dans Grafana Explore (Loki) dans un nouvel onglet, sur la période de l\'exécution.',
      traceId: 'ID de trace W3C de la trace dans laquelle cette exécution a été compilée. Cherchez-le dans Tempo ou utilisez Voir la trace. Vide pour les exécutions créées avant l\'enregistrement des ID de trace.',
      eventCode: 'Le type de message que Garrison a écrit ici, dans votre langue. Le texte à côté est le message d\'origine du serveur ou du worker.',
      openTemplate: 'Ouvrir le modèle {{name}}. Cette exécution a utilisé la version {{version}} ; l\'onglet Versions montre ce contenu et l\'écart avec la version actuelle.',
      templatesUsed: 'Les versions exactes des modèles de prompt avec lesquelles cette exécution a été compilée. Cliquez sur l\'une d\'elles pour ouvrir le modèle et comparer les versions.',
      live: 'Les événements arrivent en direct du serveur au fur et à mesure que le harness les produit.',
      viewJson: 'Afficher l\'enregistrement complet de l\'exécution en JSON, y compris tous les champs de télémétrie.',
      deployment: 'Le déploiement sélectionné pour cette exécution, par son nom ou par poids de trafic.',
      model: 'Le modèle que le harness indique avoir réellement utilisé, qui peut différer du modèle demandé par le déploiement.',
      tokens: 'Jetons d\'entrée et de sortie pour toute l\'exécution. Le panneau de télémétrie ci-dessous donne le détail complet.',
      caller: 'Qui a lancé l\'exécution : un utilisateur, une clé d\'accès ou l\'exécution d\'un autre agent.',
      parent: 'L\'exécution qui a délégué à celle-ci, lorsqu\'un agent en a appelé un autre.',
      openParent: 'Ouvrir l\'exécution parente qui a délégué ce travail.',
      attempt: 'Numéro de cette tentative, sur le maximum autorisé par le déploiement.',
      outputSchema: 'Indique si la sortie finale correspondait au JSON Schema de sortie de l\'agent. Sinon, et si le harness peut reprendre sa session, Garrison envoie une invite de correction dans la même session. Les événements d\'avertissement de la transcription listent les erreurs de validation.',
      created: 'Moment où l\'exécution a été demandée.',
      started: 'Moment où le processus de harness a démarré sur le worker.',
      completed: 'Moment où l\'exécution a atteint son état final.',
      exitCode: 'Code de sortie du processus de harness. La réussite est généralement déterminée par l\'événement final, pas par ce code.',
      tabs: {
        approvals: 'Appels d\'outil pour lesquels cette exécution a demandé l\'autorisation, la manière dont chacun a été décidé, et Autoriser et Refuser pour ceux en attente.',
        transcript: 'Tous les événements produits par le harness : texte de l\'assistant, réflexion, appels et résultats d\'outils, et consommation.',
        result: 'La réponse finale et toute sortie structurée.',
        input: 'Ce que l\'appelant a envoyé, les paramètres et les versions exactes des modèles de prompt utilisées.',
        stderr: 'La dernière partie de la sortie d\'erreur standard du harness, secrets nettoyés. Consultez-la lorsqu\'une exécution échoue.',
        children: 'Exécutions lancées par cette exécution en appelant d\'autres agents.'
      },
      eventFilter: 'Afficher un seul type d\'événement, comme les appels d\'outils ou les erreurs.',
      openChild: 'Ouvrir cette exécution enfant, lancée lorsque cette exécution a appelé un autre agent.',
      eventCodes: {
        ApprovalRequested: 'Le harness a demandé l\'accord avant un appel d\'outil et l\'appel attend une personne. Décidez-en dans l\'onglet Approbations.',
        ApprovalDecided: 'Une demande d\'autorisation a été décidée par une règle, la valeur par défaut du déploiement, une personne ou un délai d\'expiration. Le texte précise lequel.',
        RunGuardTriggered: 'Une garde a arrêté cette exécution. Le message indique quelle garde s\'est déclenchée et ce qu\'elle a vu ; l\'exécution se termine en Échouée avec le résultat de cette garde et conserve sa sortie partielle.',
        ConversationFallback: 'Ce tour n\'a pas pu reprendre la session de harness de la conversation : il a démarré une nouvelle session avec la transcription des tours précédents. Le message indique pourquoi.',
        ConversationStateLost: 'Le nœud a pris ce tour mais les répertoires de la conversation avaient disparu : le tour a été remis en file d\'attente pour s\'exécuter en mode reconstruit.'
      },
      conversation: 'La conversation dont cette exécution est un tour, et son numéro de tour. Cliquez pour ouvrir la conversation.',
      openConversation: 'Ouvrir la conversation avec tous ses tours et un champ pour envoyer le suivant.',
      conversationSession: 'Si ce tour a repris la session de harness de la conversation ou en a démarré une nouvelle à partir de la transcription, et pourquoi.',
      resumeSessionId: 'La session de harness que ce tour a reprise, laissée par le tour précédent.',
      affinityNode: 'Le nœud qui détient les répertoires de la conversation. Les autres nœuds laissent le tour jusqu\'à l\'heure indiquée, sauf si ce nœud cesse d\'être prêt.'
    },
    agentDetail: {
      name: 'Le nom que les appelants utilisent pour invoquer cet agent.',
      viewJson: 'Afficher l\'enregistrement complet de l\'agent en JSON.',
      invoke: 'Ouvrir « Invoquer » avec cet agent sélectionné. Un déploiement est choisi selon le poids, sauf si vous en choisissez un.',
      grafana: 'Ouvrir dans un nouvel onglet le tableau de bord Agents de Grafana filtré sur cet agent : invocations, percentiles de durée, délai avant le premier jeton, durée de streaming, jetons, coût et déclenchements de garde-fous.',
      id: 'Identifiant de l\'agent pour les appels API.',
      tabs: {
        deployments: 'Les manières dont cet agent s\'exécute, avec leurs poids et la part de trafic que reçoit chacune.',
        runs: 'Les exécutions les plus récentes de cet agent.',
        card: 'La carte d\'agent A2A que lisent les autres agents pour découvrir cet agent.'
      },
      addDeployment: 'Aller dans « Déploiements » pour en créer un pour cet agent. Sans déploiement, il ne peut pas s\'exécuter.',
      manageDeployments: 'Ouvrir l\'onglet « Déploiements » pour modifier les poids, les modèles et les liaisons.',
      openRun: 'Ouvrir la transcription et la télémétrie de cette exécution.',
      columns: {
        name: 'Nom du déploiement. Les appelants peuvent le désigner explicitement pour contourner le choix pondéré.',
        harness: 'Le profil de harness qui lance la CLI pour ce déploiement.',
        model: 'Le modèle que ce déploiement demande au harness d\'utiliser.',
        weight: 'Le poids de trafic brut défini sur le déploiement.',
        traffic: 'Part des invocations reçue par ce déploiement : son poids divisé par la somme des poids actifs.',
        active: 'Seuls les déploiements actifs reçoivent du trafic pondéré.'
      },
      conversations: 'Ouvrir la liste des conversations filtrée sur cet agent.'
    },
    queue: {
      queued: 'Exécutions en attente d\'un nœud. Cliquez pour les lister.',
      leased: 'Exécutions réclamées par un nœud mais pas encore démarrées. Cliquez pour les lister.',
      running: 'Exécutions en cours. Cliquez pour les lister.',
      agent: 'L\'agent auquel appartient le travail en attente.',
      harness: 'Le harness dont ces exécutions ont besoin. Seuls les nœuds qui l\'annoncent peuvent les prendre.'
    },
    invoke: {
      stream: {
        tabs: {
          preview: 'Suivez la réponse pendant sa diffusion, mise en forme en Markdown, avec le raisonnement et les appels d\'outils. Sélectionné pendant qu\'une exécution est en cours.',
          response: 'Le résultat final de l\'exécution : texte du résultat (mis en forme ou brut), sortie structurée, résultat, erreurs, télémétrie et liens.'
        },
        live: 'L\'exécution est en cours. Cette vue se met à jour à mesure que la sortie arrive par le flux d\'événements en direct.',
        finished: 'L\'exécution est terminée et aucune autre sortie n\'arrivera. L\'onglet Réponse contient le résultat final.',
        elapsed: 'Temps écoulé depuis votre clic sur Envoyer, mesuré dans votre navigateur. Il s\'arrête à la fin de l\'exécution.',
        firstToken: 'Temps entre Envoyer et la première sortie diffusée (texte ou raisonnement), mesuré dans votre navigateur, file d\'attente et démarrage du harness compris. La page de l\'exécution affiche la valeur mesurée par le nœud worker.',
        tokensPerSecond: 'Jetons de sortie par seconde pendant la diffusion, d\'après l\'utilisation signalée par le harness. Une fois l\'exécution terminée, affiche le débit mesuré par le serveur.',
        codexNote: 'Codex n\'imprime chaque message qu\'une fois complet (codex exec --json), donc rien n\'est diffusé jeton par jeton. Le temps écoulé continue de défiler pendant qu\'il travaille.',
        showResponse: 'Passe à l\'onglet Réponse pour le résultat final, la sortie structurée et la télémétrie.',
        reasoning: 'Texte de réflexion produit par le modèle avant ou entre ses réponses. Replié par défaut ; cliquez pour le déplier.',
        jump: 'Fait défiler jusqu\'à la sortie la plus récente et suit à nouveau le flux à mesure qu\'il arrive.',
        tool: {
          running: 'L\'agent a appelé l\'outil {{name}} et attend son résultat.',
          ok: 'L\'outil {{name}} a renvoyé un résultat sans erreur.',
          failed: 'L\'outil {{name}} a renvoyé une erreur. L\'agent peut réessayer ou continuer sans lui.'
        }
      },
      applySample: 'Aller dans « Manifestes », où le manifeste d\'exemple crée un agent que vous pouvez essayer tout de suite.',
      agent: 'L\'agent à appeler. Seuls les agents actifs sont listés.',
      deployment: 'Laissez « N\'importe quel déploiement actif (pondéré) » pour que Garrison choisisse selon le poids de trafic, ou choisissez un déploiement pour le tester directement.',
      parameter: 'Valeur de {{name}} pour cette exécution. Le déploiement autorise les appelants à la remplacer ; laissez vide pour la valeur par défaut.',
      message: 'Ce que vous voulez que l\'agent fasse. Le message est envoyé comme entrée de l\'exécution et enveloppé par le modèle de tâche.',
      send: 'Lancer une exécution avec ce message et diffuser sa transcription ici.',
      openRun: 'Ouvrir la page complète de l\'exécution avec le résultat, la télémétrie et stderr.',
      stopOnLeave: 'Activé, Garrison annule l\'exécution en cours quand vous quittez cette page, fermez l\'onglet ou envoyez un nouveau message, pour que personne ne paie une sortie que personne ne lit. Désactivez-le pour laisser les exécutions continuer ; elles restent sur la page Exécutions. Mémorisé dans ce navigateur.',
      cancel: 'Arrêter cette exécution maintenant. Le nœud worker termine le processus du harness en quelques secondes et la sortie obtenue est conservée.',
      cancelling: 'Annulation demandée. Le nœud worker arrête le harness ; l\'affichage passe à l\'état final quand l\'exécution indique Annulée.',
      sendReplaces: 'Annuler l\'exécution en cours, puis en lancer une nouvelle avec ce message. Désactivez « Arrêter l\'exécution quand je pars » pour laisser l\'exécution actuelle continuer.',
      sendKeeps: 'Lancer une nouvelle exécution avec ce message. L\'exécution en cours continue, car « Arrêter l\'exécution quand je pars » est désactivé ; vous la trouverez sur la page Exécutions.',
      timeLimit: 'Échéance facultative de cette exécution, en secondes, que ce déploiement permet de fixer. Laissez vide pour la valeur du déploiement. L\'exécution expire quand elle dépasse la limite.',
      timePreset: 'Fixer la durée maximale de cette exécution à {{value}}.',
      timePresetClear: 'Effacer la durée maximale pour que l\'exécution utilise la valeur du déploiement.',
      conversation: {
        mode: 'Exécuter une seule fois, démarrer une nouvelle conversation dont les tours suivants reprennent cette session de harness, ou envoyer le tour suivant d\'une conversation existante.',
        pick: 'La conversation à poursuivre. Seules les conversations de cet agent sont listées, les plus récentes en premier.',
        deploymentPinned: 'Une conversation reste sur le déploiement de son premier tour : le déploiement est donc fixé quand vous en poursuivez une.',
        open: 'Ouvrir la conversation à laquelle appartient cette exécution, avec tous ses tours et un champ pour envoyer le suivant.'
      }
    },
    manifests: {
      planned: 'Ce que ferait l\'application de ce document : créer l\'enregistrement, le mettre à jour ou le laisser inchangé. Une simulation valide sans rien modifier.',
      changes: { after: 'La valeur que le manifeste définit. Les valeurs longues sont coupées à 200 caractères.', before: 'La valeur enregistrée actuellement. Les valeurs longues sont coupées à 200 caractères.', field: 'Le paramètre de cet enregistrement que le manifeste modifie, par exemple model ou parameters.model.' },
      results: 'Ce que l\'application a fait de chaque document du manifeste.',
      kind: 'Le type d\'enregistrement décrit par le document, comme Agent ou Deployment.',
      name: 'Le nom de l\'enregistrement issu des métadonnées du document.',
      result: 'Indique si le document a créé, mis à jour ou laissé inchangé un enregistrement, ou s\'il a échoué.',
      message: 'Détails fournis par le serveur, comme une erreur de validation.',
      tabs: {
        apply: 'Coller ou téléverser un manifeste, le valider par une simulation et l\'appliquer.',
        export: 'Télécharger la configuration de ce locataire sous forme de manifeste. Les valeurs des secrets ne sont jamais incluses.',
        history: 'Toutes les applications et simulations passées, avec les résultats par document.'
      },
      upload: 'Charger dans l\'éditeur un fichier de manifeste YAML ou JSON depuis votre ordinateur.',
      loadSample: 'Remplacer le contenu de l\'éditeur par le manifeste d\'exemple : un agent echo sur le harness factice.',
      document: 'Un ou plusieurs documents YAML ou JSON séparés par ---. Les enregistrements se référencent les uns les autres par leur nom.',
      dryRun: 'Valider chaque document et montrer ce qui changerait, sans rien écrire.',
      apply: 'Valider et écrire chaque document. Si un document échoue, rien n\'est écrit.',
      export: 'Générer un manifeste qui recrée la configuration de ce locataire.',
      download: 'Enregistrer le manifeste exporté dans un fichier YAML.',
      confirmApply: 'Écrire maintenant le manifeste dans ce locataire.'
    },
    templateEditor: {
      cloneName: 'Nom de la copie. Les minuscules, chiffres, tirets et barres obliques conviennent bien ; le préfixe builtin/ est réservé.',
      cloneConfirm: 'Créer la copie sous ce nom et l\'ouvrir dans l\'éditeur.',
      clone: 'Créer une copie modifiable de ce modèle. Vous choisissez le nom de la copie avant sa création.',
      reset: 'Rétablir ce modèle intégré au contenu fourni avec Garrison.',
      delete: 'Supprimer ce modèle et ses versions. Le serveur refuse tant qu\'un déploiement le lie ; la confirmation les énumère.',
      create: 'Créer le modèle et sa première version.',
      save: 'Enregistrer le contenu comme nouvelle version. Les déploiements qui suivent la version la plus récente l\'utilisent pour les nouvelles exécutions.',
      content: 'Le texte du modèle. Utilisez des {{variables}}, des conditions, des boucles et des inclusions ; l\'aperçu se met à jour pendant la saisie.',
      changeNote: 'Une courte note enregistrée avec la version, qui explique ce qui a changé et pourquoi.',
      tabs: {
        preview: 'Rendre le modèle avec le contexte d\'exemple pour voir exactement ce que recevrait un harness.',
        versions: 'Toutes les versions enregistrées, avec comparaison et restauration.'
      },
      sampleContext: 'JSON remplaçant les données d\'une vraie exécution. Modifiez-le pour voir comment réagit le modèle.',
      columns: {
        version: 'Numéro de version. Plus il est élevé, plus la version est récente.',
        note: 'La note de modification enregistrée avec la version.',
        author: 'Qui a enregistré cette version du modèle.',
        saved: 'Moment où la version a été enregistrée.'
      },
      diff: 'Comparer cette version avec le contenu actuel de l\'éditeur.',
      restore: 'Rendre cette version à nouveau courante. Le contenu actuel reste dans l\'historique.'
    },
    serverInfo: {
      rest: 'Adresse de base pour les appels à l\'API REST et les SDK.',
      mcp: 'Adresse à laquelle se connectent les clients MCP. Chaque agent exposé comme outil y apparaît.',
      a2a: 'Adresse de base de la passerelle A2A pour ce locataire. Chaque agent a sa propre carte sous cette adresse.',
      openapi: 'Le document OpenAPI qui décrit chaque opération REST.',
      version: 'Version du serveur Garrison.',
      dashboardVersion: 'Version de cette console.',
      node: 'Le réplica du plan de contrôle (nœud de contrôle) qui a répondu à la requête d\'infos serveur de cette page. Avec plusieurs réplicas, un rechargement peut être servi par un autre.',
      nodeLink: 'Ouvrir Flotte > Plan de contrôle pour voir ce réplica à côté des autres, avec son statut, son signal de vie et s\'il est le leader.',
      database: 'Moteur de base de données utilisé par le serveur.',
      health: 'Résultat du contrôle de santé du serveur.',
      replicas: 'Nombre de réplicas du plan de contrôle attendus par le cluster.',
      routes: 'Nombre d\'opérations API enregistrées par le serveur.',
      serverTime: 'L\'horloge du serveur. Un écart important avec votre horloge peut faire échouer les requêtes signées.',
      principalName: 'L\'identité avec laquelle vous êtes connecté.',
      principalType: 'Indique si vous êtes connecté en tant qu\'utilisateur ou avec une clé d\'accès.',
      role: 'Votre niveau d\'accès le plus élevé.',
      tenant: 'Le locataire auquel appartient votre session.',
      expires: 'Moment où votre session se termine et où vous devrez vous reconnecter.',
      rawJson: 'Afficher la réponse brute des informations du serveur.'
    },
    requests: {
      grafana: 'Ouvrir le tableau de bord HTTP dans Grafana dans un nouvel onglet : débit des requêtes, latence et erreurs dans le temps, d\'après les métriques Prometheus.',
      kpis: {
        total: 'Requêtes conservées par le serveur dans son historique pour la plage et les filtres sélectionnés.',
        success: 'Requêtes qui ont renvoyé un statut 2xx ou 3xx.',
        failure: 'Requêtes qui ont renvoyé un statut 4xx ou 5xx.',
        avgDuration: 'Temps de réponse moyen du serveur.'
      },
      columns: {
        time: 'Moment d\'arrivée de la requête.',
        method: 'Méthode HTTP de la requête.',
        path: 'Chemin appelé. Survolez une valeur pour la voir en entier.',
        status: 'Statut HTTP renvoyé par le serveur.',
        duration: 'Temps de réponse du serveur.',
        principal: 'Qui a effectué la requête : un utilisateur, une clé d\'accès ou un jeton d\'exécution.'
      },
      viewDetails: 'Ouvrir la requête avec ses en-têtes, ses corps et ses durées.',
      viewJson: 'Ouvrir l\'enregistrement de la requête, y compris son JSON brut.',
      deleteOne: 'Retirer cette requête de l\'historique.',
      bulkDeleteAll: 'Supprimer toutes les requêtes correspondant aux filtres actuels, pas seulement celles de cette page.'
    },
    explorer: {
      operations: 'Choisir une opération API (les opérations sont regroupées par domaine). Le formulaire ci-dessous s\'adapte à ses paramètres.',
      pathParam: 'Paramètre de chemin {{name}} ({{type}}). Il est substitué dans l\'URL. {{description}}',
      queryParam: 'Paramètre de requête {{name}} ({{type}}). Il est ajouté à l\'URL lorsqu\'il est renseigné. {{description}}',
      copyUrl: 'Copier l\'URL de requête entièrement résolue.',
      headerName: 'Nom d\'un en-tête de requête. Authorization est ajouté automatiquement à partir de votre session.',
      headerValue: 'Valeur envoyée pour cet en-tête.',
      removeHeader: 'Retirer cet en-tête de la requête.',
      addHeader: 'Ajouter un autre en-tête de requête.',
      body: 'Corps de requête JSON pour les opérations qui créent ou modifient des enregistrements.',
      execute: 'Envoyer maintenant la requête au serveur avec votre session. Les méthodes destructives demandent une confirmation.',
      stop: 'Interrompre la requête ou arrêter la lecture d\'une réponse en streaming.',
      snippets: {
        curl: 'La même requête sous forme de commande curl pour un terminal.',
        fetch: 'La même requête sous forme de code JavaScript fetch.',
        csharp: 'La même requête sous forme de code C# HttpClient.'
      },
      clearHistory: 'Oublier toutes les requêtes récentes stockées dans ce navigateur.',
      loadHistory: 'Recharger cette requête dans le formulaire.',
      deleteHistory: 'Retirer cette entrée de la liste des requêtes récentes.',
      confirmExecute: 'Envoyer cette requête même si elle peut modifier ou supprimer des données.'
    },
    settings: {
      settingPath: 'Chemin du paramètre : {{path}}. Utilisez ce nom dans le fichier de paramètres et dans la REST API des paramètres.',
      viewJson: 'Afficher la réponse brute des paramètres.',
      restart: 'Redémarrer ce réplica du plan de contrôle pour que les paramètres nécessitant un redémarrage prennent effet.',
      save: 'Enregistrer tous les paramètres modifiés. Les paramètres à chaud s\'appliquent immédiatement ; les autres attendent un redémarrage.',
      groupGeneric: 'Paramètres du groupe {{group}}.',
      fieldGeneric: 'Paramètre du serveur {{path}}.',
      applyLive: 'S\'applique immédiatement à l\'enregistrement.',
      applyRestart: 'Prend effet après le redémarrage du serveur.',
      source: {
        File: 'Actuellement défini dans le fichier de paramètres. Enregistrer ici le met à jour.',
        Environment: 'Défini par une variable d\'environnement, qui l\'emporte sur toute valeur enregistrée ici.',
        ConfigMap: 'Géré par une ConfigMap Kubernetes. Modifiez-le plutôt dans vos manifestes.',
        Database: 'Stocké comme paramètre de cluster dans la base de données, partagé par tous les réplicas.'
      },
      sourceGeneric: 'Provenance de la valeur actuelle.',
      testDatabase: 'Tester la connexion avec les paramètres de base de données ci-dessus avant de les enregistrer.',
      groups: {
        Observability: 'Où se trouvent Grafana, Prometheus, Loki et Tempo. Les URL du navigateur alimentent les cartes de l\'accueil et les liens vers Grafana ; le serveur vérifie l\'accessibilité avec les URL internes. Vide signifie non configuré.',
        Runtime: 'Comment le plan de contrôle borne les exécutions : leur durée maximale, les valeurs de garde que suivent les déploiements et combien de temps une exécution en file peut attendre un nœud worker capable.',
        Rest: 'Comment l\'API REST écoute : hôte, port, TLS et adresse publique.',
        Mcp: 'Comment le serveur MCP écoute et combien de temps les appels d\'outils peuvent attendre.',
        Database: 'La base de données utilisée par Garrison et comment s\'y connecter.',
        Logging: 'Où vont les journaux et quel est leur niveau de détail.',
        Auth: 'Signature des jetons, durées de vie et limites de débit des connexions.',
        Security: 'Clé maîtresse de chiffrement et comptes d\'amorçage.',
        RequestHistory: 'Indique si les requêtes API sont capturées et quelle part de chaque corps est conservée.',
        Telemetry: 'Export des métriques et des traces.',
        Archive: 'Où les exécutions et les événements sont archivés avant que la rétention ne les supprime.',
        Cluster: 'Nombre de réplicas du plan de contrôle attendus.',
        Scheduling: 'Durées des baux et délais d\'expiration des signaux de vie pour les nœuds worker.',
        Runs: 'Valeurs par défaut des exécutions et durée de conservation des exécutions et des événements.',
        Audit: 'Durée de conservation des enregistrements d\'audit.'
      },
      fields: {
        Runtime: {
          MaxRunSeconds: 'Durée maximale de toute exécution, en secondes. Les délais des déploiements, les durées maximales par exécution et les valeurs de profil supérieurs y sont ramenés.',
          RepetitionGuard: 'Indique si les déploiements qui laissent la Garde de répétition vide arrêtent les exécutions dont la réponse dégénère en répétition (résultat Répétition détectée).',
          MaxAssistantChars: 'Caractères de texte de l\'assistant après lesquels une exécution s\'arrête (résultat Limite de sortie dépassée), pour les déploiements qui laissent la limite vide. 0 signifie illimité.',
          NoProgressSeconds: 'Secondes sans texte, raisonnement ni activité d\'outil après lesquelles une exécution s\'arrête (résultat Aucune progression), pour les déploiements qui laissent la limite vide. 0 la désactive.',
          ConversationAffinityWaitMs: 'Durée pendant laquelle un tour de conversation attend le nœud qui détient sa session de harness avant qu\'un autre nœud le prenne et démarre une nouvelle session à partir de la transcription. Si ce nœud n\'est pas prêt, les autres le prennent aussitôt. 0 n\'attend jamais.',
          ConversationTranscriptTurns: 'Nombre maximal de tours précédents transmis à un tour de conversation reconstruit dans une nouvelle session de harness. Les tours les plus récents sont gardés.',
          ConversationTranscriptChars: 'Nombre maximal de caractères de chaque message et réponse précédents transmis à un tour reconstruit. Les textes plus longs sont coupés et marqués comme tronqués.'
        },
        Scheduling: {
          PauseGraceMs: 'Après une mise en veille de l\'hôte ou une pause de la VM, le leader attend une fenêtre de signaux de vie plus ce nombre de millisecondes avant de marquer des nœuds comme Perdu ou de faire échouer leurs exécutions. Par défaut 5000.'
        }
      }
    },
    runGuard: {
      openDeployments: 'Aller aux Déploiements pour changer les gardes d\'un déploiement : Garde de répétition, Nombre maximal de caractères de l\'assistant et Délai sans progression.',
      openSettings: 'Aller aux Paramètres pour changer les valeurs du cluster (Moteur d\'exécution) que suivent les déploiements sans gardes propres.'
    },
    conversationDetail: {
      viewJson: 'Afficher l\'enregistrement complet de la conversation en JSON.',
      openInvoke: 'Ouvrir Invoquer avec cette conversation sélectionnée, pour envoyer le tour suivant avec la vue de streaming complète.',
      delete: 'Supprimer cette conversation. Ses tours restent sur la page Exécutions comme des exécutions ordinaires, mais la conversation ne peut plus être poursuivie.',
      deleteBusy: 'Un tour est encore inachevé : le serveur refuse de supprimer la conversation tant que cette exécution n\'est pas terminée ou annulée.',
      agent: 'L\'agent de cette conversation. Cliquez pour ouvrir l\'agent.',
      openAgent: 'Ouvrir la page de cet agent avec ses déploiements et ses exécutions récentes.',
      deployment: 'Chaque tour s\'exécute sur ce déploiement : celui vers lequel le premier tour a été dirigé.',
      activeRun: 'Le tour encore en file d\'attente ou en cours. Le message suivant est refusé jusqu\'à sa fin.',
      openRun: 'Ouvrir la page de cette exécution avec sa transcription complète, son résultat et sa télémétrie.',
      turns: 'Tous les tours de la conversation, du plus ancien au plus récent. Chaque tour est une exécution.',
      columns: {
        turn: 'Position du tour dans la conversation, à partir de 1.',
        run: 'L\'exécution qui a traité ce tour. Cliquez pour ouvrir sa transcription.',
        status: 'Où en est l\'exécution du tour dans son cycle de vie : en file d\'attente, en cours ou dans l\'un des états finaux.',
        outcome: 'Pourquoi l\'exécution du tour s\'est terminée, plus précisément que le statut.',
        session: 'Si le tour a repris la session de harness du tour précédent ou démarré une nouvelle session avec la transcription (et pourquoi).',
        input: 'Le début du message envoyé pour ce tour. Survolez pour en voir davantage.',
        result: 'Le début de la réponse, ou l\'erreur si l\'exécution a échoué. Survolez pour en voir davantage.',
        node: 'Le nœud worker qui a exécuté le tour.',
        created: 'Quand le tour a été envoyé. Survolez la valeur pour l\'heure exacte.'
      },
      session: {
        first: 'Le premier tour : il démarre la session de harness que reprennent les tours suivants.',
        resumed: 'Ce tour a repris la session de harness {{session}} sur le nœud qui détient les répertoires de la conversation : l\'agent a donc gardé tout son contexte.',
        fallback: 'Ce tour n\'a pas pu reprendre la session, il a donc démarré une nouvelle session de harness avec la transcription des tours précédents.',
        pending: 'Le tour attend un nœud : on ne sait pas encore s\'il reprendra la session ou sera reconstruit.'
      },
      continueTitle: 'Envoyer le message suivant comme prochain tour de cette conversation. Il s\'exécute avec le même agent et le même déploiement.',
      message: 'Le message suivant pour l\'agent. Il poursuit la conversation avec le contexte des tours précédents.',
      send: 'Envoyer ce message comme prochain tour. Le tour apparaît dans la liste ci-dessus et se met à jour jusqu\'à sa fin.',
      sendBusy: 'Le tour précédent n\'est pas encore terminé. Le serveur refuse un nouveau tour jusque-là : attendez ou annulez-le d\'abord.'
    }
  },
  analytics: {
    grafana: 'Ouvrir le tableau de bord Runs dans Grafana dans un nouvel onglet, sur la même période que cette page.',
    filters: {
      ttft: 'Si la case est cochée, le graphique du délai avant le premier jeton omet le temps passé à attendre les agents délégués, pour comparer équitablement les agents qui délèguent à ceux qui répondent directement.',
      range: 'Fenêtre de temps de tous les graphiques et totaux : la dernière heure, le dernier jour, la dernière semaine, les 30 derniers jours, ou un début et une fin personnalisés.',
      from: 'Début de la plage personnalisée, dans votre fuseau horaire local.',
      to: 'Fin de la plage personnalisée, dans votre fuseau horaire local.',
      agentId: 'Compter uniquement les exécutions de cet agent. La liste des déploiements se limite alors aux siens.',
      harnessType: 'Compter uniquement les exécutions effectuées par ce harness.',
      deploymentId: 'Compter uniquement les exécutions de ce déploiement, par exemple pour comparer deux modèles d\'un même agent.',
      model: 'Compter uniquement les exécutions dont le harness a signalé ce modèle servi. La liste montre les modèles observés dans la plage sélectionnée.',
      groupBy: 'Diviser chaque graphique en une série par agent, harness, modèle ou paire harness et modèle, pour pouvoir les comparer.'
    },
    cards: {
      delegationWait: 'Temps moyen d\'attente des exécutions enfants déléguées. n/d si aucune exécution de la période n\'a délégué.',
      ttftExcludingDelegation: 'Délai moyen avant le premier jeton sans le temps d\'attente des agents délégués. La note indique le 95e centile.',
      runs: 'Exécutions demandées dans la plage qui correspondent aux filtres.',
      successRate: 'Part des exécutions réussies parmi les exécutions terminées (réussies, en échec, annulées et en dépassement de délai).',
      ttft: 'Délai moyen avant le premier jeton pour les exécutions ayant produit une sortie. La note indique le 95e centile.',
      execution: 'Durée moyenne d\'exécution du harness. La note indique le 95e centile, qui reflète vos exécutions lentes.',
      queue: 'Temps moyen d\'attente des exécutions avant d\'obtenir un nœud worker.',
      tokens: 'Jetons d\'entrée et de sortie pour toutes les exécutions de la plage.',
      throughput: 'Moyenne des jetons de sortie par seconde pendant le streaming.',
      cost: 'Coût total signalé en dollars américains.',
      toolCalls: 'Nombre total d\'appels d\'outils effectués par les exécutions de la plage.'
    },
    charts: {
      outcomes: 'Comment se sont terminées les exécutions dans chaque intervalle. Survolez une barre pour voir les nombres.',
      ttft: 'Délai avant le premier jeton des exécutions : moyenne, médiane et 95e centile.',
      duration: 'Durée du streaming du modèle et durée totale d\'exécution du harness.',
      queue: 'Temps d\'attente des exécutions avant qu\'un nœud ne les prenne en bail.',
      tokens: 'Jetons consommés par intervalle, répartis par type.',
      throughput: 'Vitesse de génération de la sortie en jetons par seconde.',
      cost: 'Dépense signalée par intervalle.',
      toolCalls: 'Appels d\'outils effectués par intervalle.',
      usageTokens: 'Jetons d\'entrée et de sortie dans le temps, avec un segment empilé par paire harness et modèle. Survolez une barre pour voir la répartition.',
      usageCost: 'Coût signalé dans le temps, avec un segment empilé par paire harness et modèle. Survolez une barre pour voir la répartition.'
    },
    metrics: {
      delegationWaitMsAvg: 'Temps moyen d\'attente des exécutions enfants déléguées. Cliquez pour masquer ou afficher cette courbe.',
      timeToFirstTokenExcludingDelegationMsP95: '95e centile du délai avant le premier jeton sans l\'attente des exécutions déléguées. Cliquez pour masquer ou afficher cette courbe.',
      timeToFirstTokenExcludingDelegationMsP50: 'Délai médian avant le premier jeton sans l\'attente des exécutions déléguées. Cliquez pour masquer ou afficher cette courbe.',
      timeToFirstTokenExcludingDelegationMsAvg: 'Délai moyen avant le premier jeton sans l\'attente des exécutions déléguées. Cliquez pour masquer ou afficher cette courbe.',
      runs: 'Exécutions demandées dans l\'intervalle.',
      succeeded: 'Exécutions terminées avec succès. Cliquez pour masquer ou afficher cette série.',
      failed: 'Exécutions en échec. Cliquez pour masquer ou afficher cette série.',
      cancelled: 'Exécutions annulées. Cliquez pour masquer ou afficher cette série.',
      timedOut: 'Exécutions ayant atteint leur échéance. Cliquez pour masquer ou afficher cette série.',
      inputTokens: 'Jetons d\'entrée envoyés au modèle. Cliquez pour masquer ou afficher cette série.',
      outputTokens: 'Jetons de sortie générés par le modèle. Cliquez pour masquer ou afficher cette série.',
      cachedTokens: 'Jetons d\'entrée servis depuis le cache de prompts. Cliquez pour masquer ou afficher cette série.',
      reasoningTokens: 'Jetons de raisonnement, lorsque le harness les signale. Cliquez pour masquer ou afficher cette série.',
      totalTokens: 'Jetons d\'entrée et de sortie des exécutions de chaque intervalle.',
      costUsd: 'Coût signalé en dollars américains.',
      toolCalls: 'Appels d\'outils effectués par les exécutions de chaque intervalle. Cliquez pour masquer ou afficher cette série.',
      timeToFirstTokenMsAvg: 'Délai moyen avant le premier jeton dans l\'intervalle. Cliquez pour masquer ou afficher cette courbe.',
      timeToFirstTokenMsP50: 'Délai médian avant le premier jeton : la moitié des exécutions ont été plus rapides. Cliquez pour masquer ou afficher cette courbe.',
      timeToFirstTokenMsP95: '95e centile du délai avant le premier jeton : seule 1 exécution sur 20 a été plus lente. Cliquez pour masquer ou afficher cette courbe.',
      streamingMsAvg: 'Durée moyenne de streaming, de la première à la dernière sortie du modèle. Cliquez pour masquer ou afficher cette courbe.',
      executionMsAvg: 'Durée moyenne d\'exécution du harness, du démarrage à la fin du processus. Cliquez pour masquer ou afficher cette courbe.',
      executionMsP95: '95e centile de la durée d\'exécution. Cliquez pour masquer ou afficher cette courbe.',
      queueMsAvg: 'Temps moyen entre la mise en file et la prise en bail.',
      outputTokensPerSecondAvg: 'Moyenne des jetons de sortie par seconde pendant le streaming.'
    },
    groupSeries: {
      none: '{{name}} : {{metric}}.',
      agent: 'Exécutions de l\'agent {{name}} : {{metric}}. Cliquez pour masquer ou afficher cette série.',
      harness: 'Exécutions sur le harness {{name}} : {{metric}}. Cliquez pour masquer ou afficher cette série.',
      model: 'Exécutions servies par le modèle {{name}} : {{metric}}. Cliquez pour masquer ou afficher cette série.',
      harnessModel: 'Exécutions sur {{name}} (harness / modèle) : {{metric}}. Cliquez pour masquer ou afficher cette série.'
    },
    otherSeries: 'Tous les groupes en dehors des plus actifs, additionnés. Cliquez pour masquer ou afficher cette série.',
    dataTable: 'Afficher les chiffres de ce graphique sous forme de tableau, une ligne par intervalle de temps.',
    bucketStart: 'Début de l\'intervalle de temps. Chaque ligne couvre un intervalle.',
    usage: 'Consommation dans le temps répartie par harness et par modèle, indépendamment du regroupement choisi ci-dessus, avec les totaux pour toute la plage.',
    breakdown: 'Totaux de la plage sélectionnée par paire harness et modèle. Utilisez-les pour voir quel modèle pèse le plus dans votre consommation de jetons et votre coût.',
    breakdownColumns: {
      harness: 'Le harness qui a effectué ces exécutions.',
      model: 'Le modèle que le harness a déclaré servir. « Modèle inconnu » signifie que le harness n\'en a signalé aucun.',
      runs: 'Exécutions sur ce harness et ce modèle dans la plage.',
      inputTokens: 'Jetons d\'entrée envoyés au modèle pour ces exécutions.',
      outputTokens: 'Jetons de sortie générés par le modèle pour ces exécutions.',
      cachedTokens: 'Jetons d\'entrée servis depuis le cache de prompts pour ces exécutions.',
      reasoningTokens: 'Jetons de raisonnement, pour les harness qui les signalent séparément.',
      costUsd: 'Coût total signalé en dollars américains pour ces exécutions.',
      timeToFirstTokenMsAvg: 'Délai moyen avant le premier jeton, pondéré par le nombre d\'exécutions de chaque intervalle de temps.'
    }
  },
  export: {
    menu: 'Télécharger {{name}} : les données en CSV ou JSON, ou le graphique en image PNG ou SVG avec son titre, sa légende, ses filtres et sa plage de temps.',
    csv: 'Télécharger en CSV les données exactes de cette vue : une ligne par intervalle ou par enregistrement, horodatages ISO 8601 en UTC et nombres simples avec point décimal.',
    png: 'Télécharger le graphique en image PNG à deux fois la résolution de l\'écran, avec titre, légende, filtres actifs et plage de temps.',
    svg: 'Télécharger le graphique en image SVG vectorielle, avec titre, légende, filtres actifs et plage de temps.',
    json: 'Télécharger les données en JSON, avec les séries, les intervalles, les filtres et la plage de temps dans un seul document.'
  }
};

const explainers = {
  approvals: {
    title: 'Fonctionnement des approbations',
    p1: 'Un déploiement dont les approbations sont activées fait demander à son harness l\'accord de Garrison avant les appels d\'outil : Claude Code via son outil de demande d\'autorisation, et les exécutions de l\'app-server Codex pour les commandes et les modifications de fichiers.',
    p2: 'Chaque demande est vérifiée par rapport aux règles du déploiement. Refuser l\'emporte sur Demander, et Demander sur Autoriser ; si rien ne correspond, la valeur par défaut du déploiement s\'applique. Autoriser et Refuser répondent immédiatement ; Demander place la demande ici et l\'exécution attend.',
    p3: 'Autorisez ou refusez une demande en attente avec un motif facultatif. Mémoriser comme règle ajoute une règle au déploiement, pour que le prochain appel similaire soit décidé automatiquement. Les demandes que personne ne décide expirent avec la décision d\'expiration du déploiement.'
  },
  diagram: {
    label: 'Schéma : un appelant invoque un agent par son nom, Garrison choisit l\'un des déploiements de l\'agent selon son poids, et les liaisons de ce déploiement déterminent comment l\'exécution se déroule.',
    caller: { title: 'Appelant', body: 'REST, MCP, A2A ou un autre agent', tip: 'Tout ce qui invoque un agent : l\'API REST, un client MCP, un agent A2A ou l\'exécution d\'un autre agent. Les appelants ne connaissent que le nom de l\'agent.' },
    agent: { title: 'Agent', body: 'Nom, description, exposition, délégation, schéma de sortie', tip: 'L\'identité adressable. Les appelants l\'invoquent par son nom ; elle décrit ce qu\'est l\'agent et comment il est exposé, pas comment il s\'exécute.' },
    deploymentA: { title: 'Déploiement A, poids 300', body: 'Claude Code, sonnet', tip: 'Une manière d\'exécuter l\'agent. Avec un poids de 300 contre 100, il reçoit 75 % des invocations qui ne désignent pas de déploiement.' },
    deploymentB: { title: 'Déploiement B, poids 100', body: 'Mux, modèle local', tip: 'Une autre manière d\'exécuter le même agent. Les appelants peuvent aussi le désigner explicitement pour contourner le choix pondéré.' },
    binds: { title: 'Chaque déploiement lie', body: 'Profil de harness, prompts, serveurs MCP, secrets, espace de travail, pool de nœuds, limites', tip: 'Tout ce qui transforme une requête en processus concret : quelle CLI, quels prompts, quels outils et identifiants, et où elle peut s\'exécuter.' },
    run: { title: 'Exécution', body: 'Une exécution d\'un déploiement', tip: 'Chaque invocation crée une exécution, compilée à partir du déploiement choisi et exécutée sur un nœud worker.' }
  },
  agents: {
    title: 'Agents et déploiements',
    p1: 'Un agent est l\'identité qu\'utilisent les appelants. Il a un nom, une description, un mode d\'exposition (carte A2A, outil MCP), l\'indication qu\'il peut ou non appeler d\'autres agents, et le schéma de sortie auquel ses réponses doivent se conformer. À lui seul, un agent n\'exécute rien.',
    p2: 'Un déploiement définit comment l\'agent s\'exécute : quel profil de harness et quel modèle, quels modèles de prompt, quels serveurs MCP et secrets (par alias), quel espace de travail, quel pool de nœuds, et quelles limites et quels paramètres par exécution s\'appliquent. Un agent peut avoir plusieurs déploiements, chacun avec un poids de trafic.',
    p3: 'Lorsque quelqu\'un invoque l\'agent, Garrison choisit au hasard l\'un de ses déploiements actifs selon leur poids, sauf si l\'appelant a désigné un déploiement précis. C\'est ainsi que vous faites tourner côte à côte une variante Claude Code et une variante Mux, ou que vous basculez progressivement le trafic vers un nouveau modèle.'
  },
  deployments: {
    title: 'Qu\'est-ce qu\'un déploiement',
    p1: 'Un déploiement rend un agent exécutable. Il appartient à un seul agent et lie un profil de harness (quelle CLI lancer), un modèle, des modèles de prompt pour chaque rôle, des serveurs MCP et des secrets sous des alias, un espace de travail et un stockage d\'artefacts facultatifs, un placement sur des pools de nœuds ou des étiquettes, et des limites comme le délai d\'expiration et la concurrence.',
    p2: 'Un agent doté de plusieurs déploiements actifs répartit son trafic selon leurs poids : des poids de 300 et 100 envoient trois appels sur quatre au premier. Les déploiements inactifs ne reçoivent pas de trafic pondéré mais peuvent toujours être désignés explicitement, ce qui est pratique pour tester une nouvelle configuration avant de lui donner du poids.',
    p3: 'Utilisez « Aperçu de la compilation » sur un déploiement pour voir la ligne de commande, les fichiers et l\'environnement exacts que recevrait une exécution, sans en lancer une.'
  },
  agentDetail: {
    title: 'Comment cet agent s\'exécute',
    p1: 'Cet agent est joignable par son nom. Les déploiements ci-dessous sont les manières concrètes dont il peut s\'exécuter. Chaque déploiement actif reçoit une part du trafic égale à son poids divisé par le poids total des déploiements actifs ; les appelants qui désignent un déploiement contournent le choix pondéré.'
  },
  harnessProfiles: {
    title: 'Profils de harness et déploiements',
    p1: 'Un profil de harness est une recette de lancement pour un agent en ligne de commande : l\'exécutable, les modèles d\'arguments, les variables d\'environnement, les fichiers à écrire, la manière de transmettre le prompt et le prompt système, le format de configuration MCP qu\'il lit et la manière dont sa sortie est analysée en événements.',
    p2: 'Les profils sont des briques partagées. Un déploiement choisit un profil puis ajoute ses spécificités : le modèle, les prompts, les secrets et tout remplacement d\'arguments ou d\'environnement qui ne s\'applique qu\'à lui. Plusieurs déploiements peuvent utiliser le même profil : une correction du profil les atteint donc tous.',
    p3: 'Les profils intégrés sont en lecture seule. Clonez-en un pour le modifier.'
  },
  promptTemplates: {
    title: 'Modèles de prompt et leur utilisation par les déploiements',
    p1: 'Chaque texte que Garrison envoie à un harness est un modèle : prompts système, enveloppe autour du message de l\'appelant, instructions de délégation, descriptions d\'outils et fichiers de configuration générés. Les modèles utilisent des variables comme {{input.message}} et {{deployment.model}}, et chaque enregistrement crée une nouvelle version.',
    p2: 'Les déploiements lient des modèles à des rôles de prompt (System, Task, DelegatedTask, etc.). Une liaison suit la version la plus récente ou en épingle une, ce qui vous permet de modifier un modèle sans changer un déploiement de production tant que vous ne l\'avez pas décidé. Chaque exécution enregistre les versions exactes utilisées.'
  },
  mcpServers: {
    title: 'Serveurs MCP et liaisons',
    p1: 'Un serveur MCP listé ici est un fournisseur d\'outils : une adresse (ou une commande pour les serveurs stdio), les en-têtes ou l\'environnement dont il a besoin, et les outils qui doivent être présents. L\'enregistrement d\'un serveur ne le donne encore à aucun agent.',
    p2: 'Un déploiement lie les serveurs que son agent doit utiliser, chacun sous un alias. À la compilation, Garrison les écrit dans la configuration MCP du harness en résolvant les références de secrets dans les en-têtes, et le worker vérifie les outils requis avant le lancement. Le serveur MCP de Garrison lui-même est ajouté automatiquement lorsque l\'agent peut déléguer.'
  },
  secrets: {
    title: 'Secrets et alias',
    p1: 'Un secret est une valeur chiffrée, comme une clé API ou un jeton. La valeur est en écriture seule : après l\'enregistrement, vous pouvez la remplacer ou la renouveler, mais personne ne peut la relire via la console ou l\'API.',
    p2: 'Les déploiements lient les secrets sous un alias. Les variables d\'environnement et les fichiers du profil de harness font ensuite référence à {{secret.alias}}, si bien que le même profil fonctionne avec des clés différentes selon les déploiements. Les valeurs ne sont déchiffrées que pendant la compilation d\'une exécution, envoyées au worker via TLS et effacées des journaux.'
  },
  workspaces: {
    title: 'Espaces de travail',
    p1: 'Un modèle d\'espace de travail décrit le répertoire dans lequel démarre chaque exécution : vide, un nouveau clone Git (avec un secret d\'identifiants Git facultatif pour les dépôts privés) ou un ensemble de fichiers préchargés. La conservation détermine si le répertoire est supprimé ou conservé après l\'exécution.',
    p2: 'Un déploiement peut lier zéro ou un modèle d\'espace de travail. Chaque exécution reçoit sa propre copie, les exécutions ne voient donc jamais les fichiers des autres.'
  },
  modelPrices: {"title": "Prix des modèles", "p1": "Tarifs en USD configurés par un opérateur pour estimer le coût lorsque le harness ne le fournit pas. Le coût déclaré, même nul, est prioritaire.", "p2": "Les prix inactifs ne sont pas utilisés. Modifier ou supprimer un prix ne change pas les coûts enregistrés des exécutions."},
  usageQuotas: {"title": "Quotas d’utilisation", "p1": "Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "p2": "Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives."},
  artifactStores: {
    title: 'Stockages d\'artefacts',
    p1: 'Un stockage d\'artefacts est l\'endroit où sont conservés les fichiers produits par les exécutions une fois l\'espace de travail de l\'exécution disparu. Un déploiement peut lier un stockage, et le worker y envoie les fichiers correspondants à la fin de l\'exécution.'
  },
  manifests: {
    title: 'Les manifestes et les enregistrements qu\'ils créent',
    p1: 'Un manifeste est la configuration du locataire écrite sous forme de documents YAML ou JSON : secrets (sans valeurs par défaut), modèles de prompt, profils de harness, serveurs MCP, modèles d\'espace de travail, agents et déploiements. Les documents se référencent les uns les autres par leur nom : un même manifeste fonctionne donc dans n\'importe quel locataire.',
    p2: 'L\'application d\'un manifeste crée ou met à jour des enregistrements ordinaires, ceux-là mêmes que vous voyez dans les autres onglets. L\'appliquer deux fois ne change rien. Une simulation montre ce qui changerait sans rien écrire, et « Exporter » produit un manifeste qui recrée ce locataire.'
  },
  nodes: {
    title: 'Nœuds et pools de nœuds',
    p1: 'Un nœud est un processus worker, généralement un pod, qui récupère les exécutions auprès du plan de contrôle, lance les harness et renvoie leurs événements en streaming. Les nœuds s\'enregistrent eux-mêmes, signalent les harness qu\'ils ont trouvés et envoient des signaux de vie ; vous ne les créez pas ici.',
    p2: 'Un nœud peut appartenir à un pool de nœuds et porter des étiquettes. Les déploiements utilisent les pools et les sélecteurs d\'étiquettes pour décider où leurs exécutions peuvent avoir lieu. Isolez un nœud pour arrêter le nouveau travail, ou drainez-le avant une maintenance.'
  },
  controlNodes: {
    title: 'Nœuds de contrôle et nœuds worker',
    p1: 'Un nœud de contrôle est un réplica du serveur Garrison. Les nœuds de contrôle servent l\'API REST, le serveur MCP et la passerelle A2A, authentifient les appelants, compilent les déploiements en exécutions et planifient ces exécutions. N\'importe quel réplica peut répondre à n\'importe quelle requête, donc un répartiteur de charge peut répartir le trafic entre eux.',
    p2: 'Un des nœuds de contrôle est le leader. Il détient un bail dans la base de données et assure la maintenance de tout le cluster : nettoyage selon la rétention, passage hors ligne des réplicas muets et suppression des anciennes lignes. Si le leader s\'arrête, un autre réplica reprend le bail en quelques secondes.',
    p3: 'Les nœuds worker, dans l\'onglet Nœuds worker, font l\'autre moitié du travail : ils récupèrent auprès du plan de contrôle les exécutions prises à bail et lancent les harness. Les nœuds de contrôle ne lancent jamais de harness, et les workers ne touchent jamais à la base de données. Chaque réplica s\'enregistre lui-même et envoie un signal de vie toutes les 5 secondes, donc cet onglet est en lecture seule.'
  },
  nodePools: {
    title: 'Pools de nœuds et nœuds',
    p1: 'Un pool de nœuds est un groupe nommé de nœuds worker, par exemple des machines GPU ou des nœuds réservés à un client. Les nœuds rejoignent un pool lors de leur enregistrement. Un pool peut être limité à certains locataires.',
    p2: 'Les déploiements qui désignent un pool ne s\'exécutent que sur ses nœuds. Les déploiements sans pool peuvent s\'exécuter sur n\'importe quel nœud éligible.'
  },
  tenants: {
    title: 'Locataires',
    p1: 'Un locataire est une organisation isolée sur ce serveur. Les utilisateurs, clés d\'accès, agents, secrets et exécutions appartiennent tous à un seul locataire, et rien n\'est visible d\'un locataire à l\'autre. Les pools de nœuds et les nœuds worker sont partagés, sauf si un pool est réservé à certains locataires.'
  },
  users: {
    title: 'Utilisateurs et clés d\'accès',
    p1: 'Un utilisateur est une personne qui se connecte avec une adresse e-mail et un mot de passe. Une clé d\'accès est le moyen de connexion de l\'automatisation. Chaque clé d\'accès appartient à un utilisateur et ne peut jamais faire plus que cet utilisateur.',
    p2: 'Aucun des deux n\'obtient d\'accès du simple fait d\'exister. L\'accès provient des indicateurs d\'administrateur de l\'utilisateur et des attributions de rôles.'
  },
  credentials: {
    title: 'Clés d\'accès et utilisateurs',
    p1: 'Une clé d\'accès est une paire clé d\'accès et clé secrète destinée aux scripts, aux SDK et aux services. Elle appartient à un utilisateur. Ses autorisations effectives sont l\'intersection de ce qu\'accordent ses propres attributions de rôles et de ce que son propriétaire peut faire.',
    p2: 'La clé secrète n\'est affichée qu\'une seule fois, lors de la création ou du renouvellement de la clé. Renouvelez les clés régulièrement et supprimez celles qui n\'ont pas servi depuis longtemps.'
  },
  roles: {
    title: 'Rôles, autorisations et attributions',
    p1: 'Une autorisation est une règle unique : autoriser ou refuser certaines opérations (comme Read ou Execute) sur certains types de ressources (comme Agent ou Run). Un rôle est un ensemble nommé d\'autorisations. Le refus l\'emporte toujours sur l\'autorisation.',
    p2: 'Rien ne change pour personne tant qu\'un rôle n\'est pas attribué. Les attributions, dans l\'onglet suivant, relient un rôle à un utilisateur ou à une clé d\'accès, pour tout le locataire ou pour un seul enregistrement.'
  },
  assignments: {
    title: 'Attributions',
    p1: 'Une attribution accorde un rôle à un utilisateur ou à une clé d\'accès. La portée « Locataire » applique le rôle à tous les enregistrements des types couverts ; la portée « Ressource » l\'applique à un seul enregistrement, comme le seul agent qu\'un job de CI peut invoquer.',
    p2: 'Utilisez « Autorisations effectives » sur un utilisateur ou une clé d\'accès pour voir le résultat combiné de toutes ses attributions.'
  },
  runs: {
    title: 'Exécutions et file d\'attente',
    p1: 'Une exécution est une invocation d\'un déploiement. Elle est mise en file d\'attente, prise en bail par un nœud worker, exécutée, puis terminée avec un résultat, une transcription, une réponse et une télémétrie comme le délai avant le premier jeton, les jetons et le coût.',
    p2: 'L\'onglet « File d\'attente » montre ces mêmes exécutions pendant leur attente : les exécutions en file ont besoin d\'un nœud doté du bon harness et du bon placement, les exécutions sous bail ont été réclamées, et les exécutions en cours s\'exécutent. Des exécutions qui restent longtemps en file signalent une capacité insuffisante ou des règles de placement auxquelles aucun nœud ne correspond.'
  },
  queue: {
    title: 'La file d\'attente',
    p1: 'Voici la vue en direct des exécutions non terminées : en attente d\'un nœud, sous bail ou en cours, regroupées par agent et par harness. Ce sont les mêmes données que l\'onglet « Exécutions », résumées pour montrer la pression sur l\'ordonnancement.',
    p2: 'Un nombre croissant d\'exécutions en file pour un harness signifie généralement qu\'aucun nœud prêt n\'annonce ce harness, que les nœuds correspondants sont pleins, ou que le déploiement exige un pool ou des étiquettes qu\'aucun nœud ne possède.'
  },
  invoke: {
    title: 'Ce qui se passe lors d\'une invocation',
    p1: 'Vous appelez l\'agent par son nom. Sauf si vous choisissez un déploiement, Garrison choisit l\'un des déploiements actifs de l\'agent selon son poids, valide les éventuels paramètres par exécution par rapport à ce que ce déploiement autorise, puis met une exécution en file d\'attente. La transcription s\'affiche ici en direct pendant que le worker l\'exécute.'
  },
  audit: {
    title: 'Audit et historique des requêtes',
    p1: 'Les enregistrements d\'audit sont des événements de sécurité et de configuration : connexions, requêtes refusées, modifications de secrets et de rôles, applications de manifestes et changements de statut des nœuds. Ils sont conservés pendant la durée de conservation définie dans les paramètres.',
    p2: 'L\'onglet précédent, « Historique des requêtes », contient le trafic HTTP brut. Utilisez l\'audit pour savoir qui a modifié quoi, et l\'historique des requêtes pour déboguer ce qu\'un client a réellement envoyé.'
  },
  requests: {
    title: 'Historique des requêtes',
    p1: 'Toutes les requêtes API capturées par ce serveur, avec méthode, chemin, statut, durées, en-têtes et corps (tronqués à la taille configurée). Utilisez-le pour déboguer les intégrations et les appels SDK. Cliquez sur une barre du graphique pour limiter le tableau à cette période.'
  },
  analytics: {
    title: 'Ce que mesurent ces graphiques',
    p1: 'Le délai avant le premier jeton va du démarrage du processus de harness à la première sortie du modèle : il inclut donc le démarrage de la CLI. La durée de streaming va de la première à la dernière sortie du modèle, et la durée d\'exécution du démarrage à la fin du processus. Le temps en file d\'attente est la durée pendant laquelle une exécution a attendu un nœud worker. Ces valeurs sont mesurées avec les horloges du worker et du serveur.',
    p2: 'Le nombre de jetons et le coût proviennent de ce que signale chaque harness. Les jetons en cache sont des jetons d\'entrée servis depuis le cache de prompts du fournisseur, et les jetons de raisonnement n\'apparaissent que pour les harness qui les signalent séparément. Les jetons de sortie par seconde correspondent aux jetons de sortie divisés par la durée de streaming.',
    p3: 'Les moyennes ignorent les exécutions pour lesquelles une valeur n\'a pas pu être mesurée. Les centiles montrent la traîne : p95 signifie qu\'une seule exécution sur vingt a été plus lente. Regroupez par agent ou par harness pour les comparer côte à côte.'
  },
  conversations: {
    title: 'Conversations et tours',
    p1: 'Une conversation est une suite d\'exécutions avec un agent. Le premier tour démarre une session de harness ; chaque tour suivant reprend cette session sur le même nœud worker, si bien que l\'agent garde ses fichiers, ses outils et son contexte d\'un message à l\'autre.',
    p2: 'Un seul tour s\'exécute à la fois : un nouveau message est refusé tant que le tour précédent n\'est pas terminé. Chaque tour reste sur le déploiement du premier tour.',
    p3: 'Quand un tour ne peut pas reprendre (le nœud a disparu ou reste occupé trop longtemps, les fichiers ont été supprimés, ou le harness ne sait pas reprendre), il est reconstruit dans une nouvelle session qui reçoit la transcription des tours précédents. La colonne Reconstructions compte ces tours et la liste des tours en indique la raison.'
  }
};

export { tips, explainers };
