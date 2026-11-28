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
  fieldWarnings: { dismiss: 'Masque cet avis. L\'enregistrement est déjà sauvegardé avec les valeurs indiquées ici.' },
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
      agentAssets: 'Prompts système, skills, fichiers de référence et modèles de document versionnés qu\'épinglent les révisions d\'agent, avec envoi et historique.',
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
    serverUrl: 'Adresse de base d\'un autre serveur Garrison, par exemple 127.0.0.1:9700. Le navigateur ne peut le joindre que si le tableau de bord autorise son origine (GARRISON_CSP_CONNECT_SRC).',
    useDifferentServer: 'Se connecter à un autre serveur que celui avec lequel cette console a été déployée. Son origine doit être autorisée dans GARRISON_CSP_CONNECT_SRC.',
    useDefaultServer: 'Masquer le champ URL du serveur et se connecter au serveur avec lequel cette console a été déployée.',
    serverInUse: 'Le serveur Garrison auquel cette console se connecte : GARRISON_API_URL s\'il est défini, sinon l\'origine de cette page, qui sert de proxy à l\'API.',
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
      DurableResume: "Une approbation humaine à usage unique conservée depuis le point de contrôle précédent. Elle ne vaut que pour la demande d’outil reprise correspondante.",
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
    usageQuotas: {"add": "Ajoutez un quota pour un locataire, agent ou déploiement. Les limites vides sont illimitées.", "name": "Nom. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "description": "Description. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "active": "Actif. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "scope": "Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "resourceId": "Ajoutez un quota pour un locataire, agent ou déploiement. Les limites vides sont illimitées.", "dailyRunLimit": "Exécutions par jour UTC. Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives.", "dailyTokenLimit": "Jetons par jour UTC. Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives.", "dailyCostUsdLimit": "USD connus par jour UTC. Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives.", "maxConcurrentRuns": "Maximum d’exécutions actives. Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives.", "actions": {"usage": "Usage quotidien. Exécutions par jour UTC. Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives."}, "usage": {"windowStartUtc": "Début de période (UTC). Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "windowEndUtc": "Réinitialisation quotidienne (UTC). Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "runsUsed": "Exécutions admises. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "tokensUsed": "Jetons terminés. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "costUsd": "Coût connu (USD). Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "unknownCostRuns": "Exécutions sans coût. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "activeRuns": "Exécutions actives. Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement."}, "enforcementEnabled": "Désactivé par défaut. Activez pour refuser les exécutions aux limites configurées et réduire les budgets compatibles. Sinon, seul le suivi est effectué."},
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
      inputSchema: "JSON Schema de l'entrée de l'agent. S'il est défini, chaque entrée d'invocation doit être un document JSON conforme, et Invoquer affiche un formulaire généré à partir de lui.",
      outputSchema: 'JSON Schema auquel le résultat doit se conformer. Garrison valide la sortie et réessaie une fois avec un prompt de correction.',
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
      approvalTimeoutDecision: 'La décision appliquée quand personne ne répond à temps. Autoriser (par défaut) approuve l’appel automatiquement après le délai ; Refuser le bloque.',
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
      containerized: 'Indique si le worker s\'exécute dans un conteneur ou un pod, d\'après ce qu\'il a déclaré à l\'enregistrement. Les exécutions Codex sur un worker conteneurisé utilisent par défaut le bac à sable danger-full-access, car le conteneur sert de frontière d\'isolation.',
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
      childReserveSlots: 'Emplacements supplémentaires pour les exécutions déléguées que leur parent attend : un s\'ouvre pour chaque exécution de ce nœud qui attend un enfant, jusqu\'à ce nombre.',
      maxResidentWaiters: 'Nombre maximal d\'exécutions de ce nœud qui peuvent attendre une exécution déléguée en même temps. 0 signifie sa capacité. Une délégation au-delà échoue avec DelegationCapacityExhausted.',
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
      principalName: 'L\'utilisateur ou la clé d\'accès qui a appliqué le manifeste.',
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
        logs: 'Volume de journaux, erreurs et avertissements par composant et locataire, lignes d\'erreur récentes et liens vers les traces.',
        autonomy: 'Gardiens : ticks par résultat et source de réveil, réveils ignorés et en échec, délai de démarrage des ticks et intervalles appliqués par le planificateur.'
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
      warnings: 'Valeurs de ce document acceptées mais enregistrées autrement, par exemple un nombre hors de sa plage qui a été ramené dans les limites. La liste sous la ligne indique chaque champ.',
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
      serverInUse: 'L\'adresse à laquelle cette console envoie les appels d\'API. C\'est GARRISON_API_URL s\'il est défini, sinon l\'origine du tableau de bord.',
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
  usageQuotas: {"title": "Quotas d’utilisation", "p1": "Limites quotidiennes UTC des exécutions, jetons, coûts connus et concurrence actuelle d’un locataire, agent ou déploiement.", "p2": "Laissez vide pour un usage illimité. Zéro interdit l’usage. Les compteurs quotidiens sont réinitialisés à minuit UTC ; la concurrence compte les exécutions actives. Désactivé par défaut. Activez pour refuser les exécutions aux limites configurées et réduire les budgets compatibles. Sinon, seul le suivi est effectué."},
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

tips.views.settings.groups.Leases = "Coordination facultative : configurez les répliques de façon identique puis redémarrez. Database est la valeur par défaut.";
tips.views.settings.fields.Leases = {"Provider": "Coordination facultative : configurez les répliques de façon identique puis redémarrez. Database est la valeur par défaut.", "ClutchEndpoint": "Fournissez la clé Clutch par un secret ou une variable d’environnement ; aucune identité dans le point de connexion.", "ClutchAccessKey": "Fournissez la clé Clutch par un secret ou une variable d’environnement ; aucune identité dans le point de connexion.", "KeyPrefix": "Coordination facultative : configurez les répliques de façon identique puis redémarrez. Database est la valeur par défaut.", "RequestTimeoutMs": "Coordination facultative : configurez les répliques de façon identique puis redémarrez. Database est la valeur par défaut.", "SweepIntervalMs": "Coordination facultative : configurez les répliques de façon identique puis redémarrez. Database est la valeur par défaut.", "MaxLeaseMs": "Coordination facultative : configurez les répliques de façon identique puis redémarrez. Database est la valeur par défaut.", "MaxHoldMs": "Coordination facultative : configurez les répliques de façon identique puis redémarrez. Database est la valeur par défaut."};

tips.enums.harnessType.ProviderApi = "Boucle API facultative via PolyPrompt. Point de connexion et modèle requis ; les déploiements CLI restent disponibles.";
tips.enums.harnessType.OpenCode = "CLI opencode, exécutée sans interface avec opencode run et des événements JSON. Fonctionne avec Anthropic, OpenAI, Google et d'autres fournisseurs de modèles.";
tips.enums.harnessType.Pi = "Agent de programmation pi, exécuté avec --mode json. Fonctionne avec Anthropic, OpenAI, Google et d'autres fournisseurs de modèles.";

// Pipelines (P12.9).
tips.nav.hubs.approvals = "Tout ce qui attend une personne : les appels d'outil demandés par les agents et les étapes de pipeline qui exigent une revue, avec l'historique de chaque décision.";
tips.nav.approvalsBadgeCombined = "En attente d'une personne : {{approvals}} approbations d'appel d'outil et {{reviews}} revues d'étape de pipeline. Ouvrez Approbations pour décider.";
Object.assign(tips.nav.tabs, {
  approvals: "Appels d'outil demandés par les agents qui attendent qu'une personne les autorise ou les refuse, et chaque décision passée par règle, valeur par défaut, personne ou délai d'expiration.",
  pipelineReviews: "Étapes de pipeline terminées qui attendent une personne : approuvez-les, demandez des modifications (l'étape s'exécute à nouveau avec votre retour) ou rejetez-les.",
  pipelines: "Chaînes d'agents : chaque étape exécute un agent, transmet sa sortie à l'étape suivante via un modèle de prompt et peut attendre une revue.",
  pipelineRuns: "Chaque exécution d'un pipeline avec son état et son résultat. Ouvrez-en une pour voir la chronologie des étapes, ses exécutions d'étape et ses revues."
});
tips.filters.pipelineId = "Afficher uniquement les enregistrements d'un pipeline. Choisissez Tous pour retirer le filtre.";
tips.filters.pipelineRunId = "Afficher uniquement les revues d'une exécution de pipeline. Collez un ID tel que plr_... ; la liste se met à jour quand vous arrêtez de taper.";
Object.assign(tips.enums, {
  pipelineRunStatus: {
    Running: "Une étape est en cours, en démarrage ou sur le point de démarrer.",
    AwaitingReview: "Une étape est terminée et attend qu'une personne l'approuve, demande des modifications ou la rejette.",
    Cancelling: "L'annulation a été demandée ; l'exécution d'étape en cours est en train d'être arrêtée.",
    Succeeded: "Toutes les étapes sont terminées et chaque point de revue a été approuvé.",
    Failed: "Une étape a échoué après ses tentatives, n'a pas pu démarrer, ou un relecteur l'a rejetée. Relancer reprend à cette étape.",
    Cancelled: "Quelqu'un a annulé l'exécution de pipeline. Relancer reprend à l'étape où elle s'est arrêtée.",
    TimedOut: "Le pipeline a dépassé sa durée maximale, temps d'attente des revues compris."
  },
  pipelineRunOutcome: {
    None: "L'exécution de pipeline n'est pas encore terminée.",
    Succeeded: "Toutes les étapes ont réussi et chaque revue a été approuvée.",
    StageFailed: "Une étape a échoué à chaque tentative et ne continue pas en cas d'échec.",
    StageStartFailed: "Une étape n'a pas pu démarrer, par exemple parce que son agent ou son déploiement n'existe plus ou que son prompt n'a pas pu être compilé.",
    ReviewRejected: "Un relecteur a rejeté une étape, ce qui met fin à l'exécution de pipeline.",
    ReviewExpired: "Une revue a expiré et son action d'expiration était Rejeter.",
    Cancelled: "Quelqu'un a annulé l'exécution de pipeline ou l'une de ses exécutions d'étape.",
    TimedOut: "Le pipeline a dépassé sa durée maximale.",
    InternalError: "Le serveur a rencontré une erreur inattendue en faisant avancer le pipeline. Consultez les journaux du serveur."
  },
  pipelineStageStatus: {
    Pending: "L'étape n'a pas démarré ; les étapes précédentes sont encore en cours.",
    Running: "L'exécution d'étape est en file d'attente ou en cours. Une tentative échouée lance une nouvelle exécution jusqu'à épuisement des tentatives.",
    AwaitingReview: "L'étape est terminée et attend qu'une personne relise sa sortie.",
    Succeeded: "L'étape est terminée et, si elle exige une revue, a été approuvée.",
    Failed: "L'étape a échoué à chaque tentative, n'a pas pu démarrer ou a été rejetée.",
    Cancelled: "L'étape s'est arrêtée parce que l'exécution de pipeline a été annulée ou a expiré."
  },
  pipelineReviewStatus: {
    Pending: "Attend qu'une personne approuve, demande des modifications ou rejette.",
    Approved: "Approuvée : le pipeline est passé à l'étape suivante, avec les notes éventuelles.",
    ChangesRequested: "Modifications demandées : l'étape s'est exécutée à nouveau avec le retour.",
    Rejected: "Rejetée : l'exécution de pipeline a échoué à cette étape.",
    Expired: "Personne n'a décidé à temps : l'action d'expiration de l'étape a donc tranché.",
    Cancelled: "L'exécution de pipeline s'est arrêtée avant que quelqu'un ne décide."
  },
  pipelineReviewDecision: {
    Approve: "Accepter la sortie de l'étape et passer à l'étape suivante. Les notes facultatives sont transmises à l'étape suivante.",
    RequestChanges: "Exécuter à nouveau la même étape avec votre retour. Limité par le nombre maximal de révisions de l'étape.",
    Reject: "Arrêter l'exécution de pipeline ici. Elle échoue avec le résultat Revue rejetée."
  },
  pipelineReviewSource: {
    User: "Une personne a décidé la revue.",
    Timeout: "La revue a expiré et l'action d'expiration de l'étape l'a décidée.",
    Cancelled: "L'exécution de pipeline a été annulée ou a expiré pendant que la revue était en attente."
  }
});
Object.assign(tips.enums.auditEventType, {
  PipelineReviewDecided: "Une personne ou un délai d'expiration a approuvé, rejeté ou demandé des modifications pour une revue d'étape de pipeline.",
  PipelineRunCancelled: "Quelqu'un a annulé une exécution de pipeline, sa revue en attente et son exécution d'étape en cours."
});
Object.assign(tips.resources.runs, {
  pipelineRunId: "L'exécution de pipeline dont cette exécution est une étape, avec la position de l'étape et le numéro d'exécution. Vide pour les exécutions hors pipeline.",
  pipelineStage: "Position de l'étape dans le pipeline et numéro d'exécution de cette étape (les relances et les révisions ajoutent des exécutions)."
});
tips.resources.pipelines = {
  add: "Créer un pipeline : une liste ordonnée d'étapes, chacune exécutant un agent et transmettant sa sortie à la suivante.",
  name: "Nom de pipeline unique dans ce locataire, utilisé par l'API, les outils MCP, les SDK et les manifestes. Lettres minuscules, chiffres et tirets.",
  stages: "Les étapes dans l'ordre d'exécution. Chaque étape exécute un agent ; sa sortie est transmise à l'étape suivante via un modèle de prompt.",
  reviewGates: "Nombre d'étapes qui attendent qu'une personne relise leur sortie avant que le pipeline continue.",
  maxDurationSeconds: "Durée maximale de toute l'exécution du pipeline, en secondes, attente des revues comprise. 0 signifie aucune limite ; au-delà, l'exécution expire.",
  version: "Augmente à chaque modification enregistrée. Les exécutions de pipeline enregistrent la version de départ et gardent ses étapes.",
  stageHeading: "Une étape du pipeline, exécutée dans l'ordre affiché. Utilisez les flèches pour la déplacer et la corbeille pour la supprimer.",
  moveUp: "Déplacer cette étape d'un rang plus tôt. Les étapes s'exécutent dans l'ordre affiché.",
  moveDown: "Déplacer cette étape d'un rang plus tard. Les étapes s'exécutent dans l'ordre affiché.",
  removeStage: "Retirer cette étape du pipeline. Un pipeline doit comporter au moins une étape.",
  addStage: "Ajouter une étape à la fin du pipeline. Elle reçoit la sortie de l'étape précédente.",
  stagesItems: {
    name: "Nom de cette étape, unique dans le pipeline. Affiché dans la chronologie, les revues et les prompts de transmission.",
    agentId: "L'agent exécuté par cette étape. Démarrer le pipeline exige l'autorisation d'exécuter chaque agent d'étape.",
    deploymentId: "Un déploiement fixe de l'agent de l'étape. Vide : choisit l'un des déploiements actifs de l'agent selon leur poids, comme une invocation ordinaire.",
    handoffTemplateId: "Modèle de prompt de tâche qui enveloppe la tâche de cette étape avec les sorties précédentes, les notes de revue et les retours de révision. Vide : utilise la liaison PipelineStage du déploiement ou le modèle intégré.",
    handoffTemplateVersion: "Utiliser cette version du modèle de transmission même après ses modifications. Vide : utilise toujours la version actuelle.",
    outputCharLimit: "Nombre maximal de caractères de la sortie de chaque étape précédente transmis à cette étape. Les sorties plus longues sont coupées et marquées comme tronquées.",
    maxAttempts: "Combien de fois l'étape s'exécute quand son exécution échoue ou expire, avant que l'étape soit considérée comme échouée.",
    continueOnFailure: "Quand l'étape échoue à chaque tentative, passer quand même à l'étape suivante ; celle-ci voit l'échec dans la transmission.",
    requiresReview: "Une fois l'étape terminée, attendre qu'une personne l'approuve, demande des modifications ou la rejette dans Approbations > Revues d'étape.",
    reviewTimeoutSeconds: "Durée d'attente de la revue avant que l'action d'expiration ne la décide. 0 attend qu'une personne décide.",
    reviewTimeoutAction: "Ce qui se passe à l'expiration de la revue : approuver et continuer, ou rejeter et faire échouer l'exécution de pipeline.",
    maxRevisions: "Combien de fois un relecteur peut demander des modifications pour cette étape. Ensuite, seuls Approuver et Rejeter restent possibles.",
    description: "Note libre sur le rôle de cette étape, destinée aux personnes. Elle n'est pas envoyée à l'agent.",
    parameters: "Remplacements de paramètres d'exécution pour les exécutions de cette étape, comme le modèle ou le format. Autorisés uniquement avec un déploiement qui permet de les remplacer."
  },
  actions: {
    start: "Démarrer ce pipeline avec un texte d'entrée et suivre ses étapes sur la page de l'exécution de pipeline.",
    preview: "Générer chaque prompt d'étape à partir d'une entrée et de sorties d'étape d'exemple, sans lancer aucune exécution.",
    runs: "Afficher les exécutions de ce pipeline dans l'onglet Exécutions de pipeline."
  }
};
tips.resources.pipelineRuns = {
  id: "Identifiant de l'exécution de pipeline (plr_...). Utilisez-le avec l'API, les outils MCP et les SDK.",
  pipelineName: "Le pipeline exécuté. Les exécutions de pipeline gardent les étapes de la version avec laquelle elles ont démarré.",
  pipelineVersion: "La version du pipeline au démarrage de cette exécution. Les modifications ultérieures du pipeline ne la changent pas.",
  status: "Où en est l'exécution de pipeline : en cours, en attente de revue, en cours d'annulation ou terminée.",
  outcome: "Pourquoi l'exécution de pipeline s'est terminée : réussite, échec ou démarrage impossible d'une étape, revue rejetée ou expirée, annulation ou dépassement de délai.",
  progress: "L'étape où en est l'exécution de pipeline, sur l'ensemble de ses étapes.",
  callerName: "L'utilisateur ou la clé d'accès qui a démarré l'exécution de pipeline.",
  errorMessage: "Ce qui s'est mal passé, quand l'exécution de pipeline a échoué ou expiré.",
  priority: "Priorité de file d'attente donnée à chaque exécution d'étape. Les valeurs plus élevées sont planifiées en premier.",
  deadlineUtc: "Moment où l'exécution de pipeline expire, d'après la durée maximale du pipeline. Vide en l'absence de limite.",
  completedUtc: "Moment où l'exécution de pipeline s'est terminée.",
  createdUtc: "Moment où l'exécution de pipeline a démarré. Survolez la valeur pour l'heure exacte.",
  actions: {
    cancel: "Annuler l'exécution de pipeline : son exécution d'étape en cours est annulée et une revue en attente est fermée.",
    retry: "Reprendre une exécution de pipeline échouée, expirée ou annulée à l'étape où elle s'est arrêtée, avec une nouvelle exécution de cette étape.",
    stageRuns: "Afficher les exécutions de chaque étape de cette exécution de pipeline dans l'onglet Exécutions.",
    finalRun: "Ouvrir l'exécution de la dernière étape, dont le résultat est celui du pipeline."
  }
};
tips.resources.pipelineReviews = {
  createdUtc: "Moment où l'étape s'est terminée et où la revue a été demandée. Survolez la valeur pour l'heure exacte.",
  pipelineName: "Le pipeline dont l'étape attend la revue.",
  stageName: "L'étape à relire, avec sa position et l'exécution de l'étape qui a produit la sortie.",
  positionExecution: "Position de l'étape dans le pipeline, et l'exécution de l'étape couverte par cette revue. Les révisions ajoutent des exécutions.",
  status: "Les revues en attente attendent une personne ; les autres indiquent comment la revue s'est terminée.",
  decision: "Approuver, Demander des modifications ou Rejeter, une fois la revue décidée.",
  decisionSource: "Qui a décidé : une personne, le délai de revue de l'étape ou l'arrêt de l'exécution de pipeline.",
  comment: "Notes transmises à l'étape suivante (approbation), retour avec lequel l'étape a été réexécutée (modifications demandées) ou motif (rejet).",
  decidedBy: "La personne qui a décidé la revue.",
  expiresUtc: "Moment où la revue expire et où l'action d'expiration de l'étape la décide. Vide si elle attend qu'une personne décide.",
  pipelineRunId: "L'exécution de pipeline à laquelle appartient cette revue. Cliquez sur une ligne pour ouvrir la chronologie de ses étapes.",
  runId: "L'exécution d'étape dont la sortie est en revue. Ouvrez-la pour lire le résultat avant de décider.",
  decidedUtc: "Moment où la revue a été décidée.",
  id: "Identifiant de la revue (prv_...). Utilisez-le avec l'API, les outils MCP et les SDK pour décider la revue.",
  filters: { decisionSource: "Afficher uniquement les revues décidées d'une certaine façon : par une personne, par le délai de revue ou par l'arrêt de l'exécution de pipeline." },
  actions: {
    approve: "Approuver la sortie de l'étape et laisser le pipeline continuer, avec des notes facultatives pour l'étape suivante.",
    requestChanges: "Exécuter à nouveau l'étape avec votre retour. Chaque demande consomme l'une des révisions de l'étape.",
    reject: "Rejeter la sortie de l'étape. L'exécution de pipeline échoue avec le résultat Revue rejetée.",
    openStageRun: "Ouvrir l'exécution d'étape en revue pour lire sa transcription et son résultat."
  }
};
tips.pipelineReviews = {
  revisionsLeft: "Combien de fois encore des modifications peuvent être demandées pour cette étape avant qu'il ne reste que Approuver et Rejeter.",
  decide: {
    decision: "Choisissez ce qu'il advient de la sortie de l'étape. L'exécution de pipeline continue dès que vous validez.",
    Approve: "Accepter la sortie de l'étape ; le pipeline passe à l'étape suivante, ou réussit après la dernière.",
    RequestChanges: "Renvoyer l'étape avec un retour. Elle s'exécute à nouveau et revient en revue.",
    Reject: "Refuser la sortie de l'étape. L'exécution de pipeline s'arrête et échoue.",
    commentApprove: "Notes facultatives que l'étape suivante reçoit avec la sortie de cette étape.",
    commentRequestChanges: "Retour obligatoire. L'étape s'exécute à nouveau avec ce retour : indiquez ce qu'il faut changer.",
    commentReject: "Motif facultatif, enregistré avec la décision et dans le journal d'audit.",
    submitApprove: "Approuver l'étape maintenant. La décision est définitive et ne peut plus être modifiée.",
    submitRequestChanges: "Envoyer le retour maintenant. L'étape s'exécute à nouveau ; sa prochaine sortie revient en revue.",
    submitReject: "Rejeter l'étape maintenant. L'exécution de pipeline échoue ; c'est irréversible, mais elle peut être relancée."
  }
};
tips.pipelineStart = {
  input: "La tâche du pipeline. La première étape y travaille, et chaque étape suivante la voit comme tâche d'origine à côté des sorties précédentes.",
  submit: "Démarrer une exécution de pipeline avec cette entrée et ouvrir la chronologie de ses étapes."
};
tips.pipelinePreview = {
  input: "Entrée d'appelant d'exemple utilisée pour générer chaque prompt d'étape. Rien n'est exécuté.",
  sampleOutput: "Sortie fictive de l'étape {{stage}}, transmise à l'étape suivante dans l'aperçu.",
  render: "Générer chaque prompt d'étape avec ces exemples, tel que les exécutions d'étape le recevraient. Les secrets sont masqués.",
  stage: "Le prompt que cette étape recevrait, généré depuis son modèle de transmission avec les exemples ci-dessus.",
  rendered: "Le prompt de l'étape a été généré sans erreur.",
  failed: "Le prompt de l'étape n'a pas pu être généré ; le message indique pourquoi, par exemple un agent ou un déploiement manquant."
};
Object.assign(tips.views.runDetail, {
  pipelineRun: "Cette exécution est une étape d'une exécution de pipeline. Le texte après l'ID indique la position de l'étape et le numéro d'exécution.",
  openPipelineRun: "Ouvrir l'exécution de pipeline à laquelle appartient cette exécution, avec la chronologie des étapes et les revues."
});
tips.views.pipelineRunDetail = {
  viewJson: "Afficher l'exécution de pipeline complète avec ses étapes, ses exécutions d'étape et ses revues au format JSON.",
  delete: "Supprimer cette exécution de pipeline terminée et ses revues. Ses exécutions d'étape restent sur la page Exécutions.",
  live: "Les mises à jour arrivent par la connexion en direct dès qu'une étape ou une revue change.",
  polling: "La connexion en direct n'est pas disponible : la page relit l'exécution de pipeline toutes les quelques secondes.",
  pipeline: "Le pipeline exécuté, avec la version de départ. Cliquez pour le retrouver dans Agents > Pipelines.",
  openPipeline: "Ouvrir Agents > Pipelines filtré sur ce pipeline.",
  openRun: "Ouvrir cette exécution d'étape avec sa transcription, son résultat et sa télémétrie.",
  finalRun: "L'exécution de la dernière étape. Son résultat est celui de l'exécution de pipeline.",
  started: "Moment où la première exécution d'étape a été créée.",
  input: "L'entrée avec laquelle l'exécution de pipeline a démarré. Chaque étape la voit comme tâche d'origine.",
  reviewTitle: "Une étape est terminée et attend votre décision. Lisez sa sortie dans l'exécution d'étape, puis décidez.",
  stages: "Chaque étape dans l'ordre d'exécution avec son état, ses exécutions, tentatives, révisions, exécutions d'étape et revues.",
  current: "L'étape où en est actuellement l'exécution de pipeline.",
  reviewGate: "Cette étape attend qu'une personne relise sa sortie avant que le pipeline continue.",
  agent: "L'agent exécuté par cette étape, tel qu'enregistré au démarrage de l'exécution de pipeline.",
  counts: "Les exécutions comptent chaque passage de l'étape ; les tentatives comptent les passages depuis la dernière revue ; les révisions comptent les modifications demandées.",
  reviewItem: "Une revue d'une exécution de cette étape et la façon dont elle a été décidée.",
  columns: {
    execution: "Le numéro d'exécution de l'étape. Les relances après échec et les révisions après revue ajoutent des exécutions.",
    run: "L'exécution d'étape. Cliquez pour ouvrir sa transcription et son résultat.",
    status: "État actuel de l'exécution d'étape (en file, en cours, terminée).",
    outcome: "Pourquoi l'exécution d'étape s'est terminée.",
    error: "Message d'erreur de l'exécution d'étape, en cas d'échec.",
    created: "Moment où l'exécution d'étape a été créée."
  }
};
tips.views.settings.fields.Runtime.PipelineSweepIntervalMs = "Fréquence à laquelle le leader fait avancer les exécutions de pipeline qui ont manqué un signal de fin, relance les démarrages d'étape bloqués et applique les délais de revue et les durées maximales des pipelines, en millisecondes.";
tips.views.settings.fields.Runtime.PipelineMaxStages = "Nombre maximal d'étapes d'une définition de pipeline. L'enregistrement d'un pipeline comportant plus d'étapes est refusé.";
tips.views.settings.fields.Runs = Object.assign(tips.views.settings.fields.Runs || {}, {
  DelegationChildQueueDepth: 'Nombre maximal d\'exécutions déléguées en file d\'attente que leur parent attend, sur tout le cluster. Une exécution qui commence à attendre une autre exécution déléguée au-delà échoue aussitôt avec DelegationCapacityExhausted.',
  DelegationRetryAfterSeconds: 'Secondes proposées dans Retry-After quand une délégation qui attend est refusée avec DelegationCapacityExhausted.'
});
Object.assign(explainers, {
  pipelines: {
    title: "Pipelines et étapes",
    p1: "Un pipeline enchaîne des agents. Chaque étape exécute un agent, éventuellement sur un déploiement fixe, et transmet sa sortie (texte, sortie structurée et références d'artefacts) à l'étape suivante via un modèle de prompt.",
    p2: "Une étape peut relancer les exécutions échouées, continuer malgré un échec et attendre une revue. Les revues apparaissent dans Approbations > Revues d'étape ; demander des modifications exécute à nouveau l'étape avec le retour.",
    p3: "Modifier un pipeline crée une nouvelle version. Les exécutions de pipeline déjà démarrées gardent leurs étapes d'origine."
  },
  pipelineRuns: {
    title: "Exécutions de pipeline",
    p1: "Une exécution de pipeline exécute dans l'ordre les étapes d'une version de pipeline. Chaque exécution d'étape est une exécution ordinaire, accessible depuis la chronologie des étapes.",
    p2: "Annuler arrête l'exécution d'étape en cours et ferme une revue en attente. Relancer reprend une exécution de pipeline échouée, expirée ou annulée à l'étape où elle s'est arrêtée."
  },
  pipelineReviews: {
    title: "Revues d'étape",
    p1: "Une étape qui exige une revue attend ici une fois terminée. Approuver passe à l'étape suivante, Demander des modifications exécute à nouveau l'étape avec votre retour, et Rejeter fait échouer l'exécution de pipeline.",
    p2: "Les revues sans délai attendent qu'une personne décide. Avec un délai, l'action d'expiration de l'étape décide quand le temps est écoulé."
  }
});
tips.views.settings.fields.Scheduling = Object.assign(tips.views.settings.fields.Scheduling || {}, {
  QueueWakeFanout: "Nombre de requêtes de bail en attente que chaque réplique réveille pour une exécution nouvellement mise en file, parmi celles dont le worker pourrait la prendre. Une requête qui ne peut pas la prendre la passe à la suivante. 0 réveille toutes les requêtes compatibles sur toutes les répliques, comme avant. Par défaut 1.",
  RemoteWakeDelayMs: "Durée pendant laquelle les autres répliques attendent avant de réveiller l’une de leurs requêtes de bail pour une exécution dont la réplique en a déjà réveillé une, en millisecondes. L’attente se termine plus tôt si l’exécution est prise ou si cette réplique n’a plus de requête capable de la prendre. 0 réveille immédiatement une requête sur chaque réplique. Par défaut 250."
});
tips.views.settings.fields.Auth = Object.assign(tips.views.settings.fields.Auth || {}, {
  CacheSeconds: "Durée pendant laquelle chaque réplique conserve les sessions, locataires, utilisateurs et identifiants qu’elle lit pour authentifier les requêtes, en secondes. Révoquer un jeton ou modifier des utilisateurs, identifiants, rôles ou locataires via l’API prend effet immédiatement sur toutes les répliques ; c’est la durée maximale pendant laquelle une modification faite autrement peut passer inaperçue. 0 désactive le cache. Par défaut 5."
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
   "triggers": "Lancer des exécutions sans appelant : planifications cron évaluées dans un fuseau horaire et URL de webhook qui acceptent des requêtes signées HMAC d'autres systèmes.",
   "notifications": "Prévenir d'autres systèmes : Garrison envoie en POST une notification JSON signée quand une exécution ou un pipeline se termine ou qu'une approbation attend une personne."
  }
 },
 "filters": {
  "type": "Afficher uniquement les déclencheurs cron ou uniquement les déclencheurs webhook. Tous affiche les deux.",
  "outcome": "Afficher uniquement les déclenchements qui ont lancé une exécution, échoué ou été ignorés.",
  "deliveryStatus": "Afficher uniquement les livraisons dans un état : en attente, en cours, livrées ou abandonnées."
 },
 "enums": {
  "triggerType": {
   "Cron": "Se déclenche selon une planification cron à cinq champs que le leader du plan de contrôle évalue dans le fuseau du déclencheur.",
   "Webhook": "Se déclenche quand une requête signée avec le secret du déclencheur arrive à son URL."
  },
  "triggerTargetType": {
   "Agent": "Chaque déclenchement met en file une exécution de l'agent, sur un déploiement fixe ou selon le poids du trafic.",
   "Pipeline": "Chaque déclenchement lance une exécution du pipeline avec toutes ses étapes."
  },
  "triggerFireSource": {
   "Cron": "La planification cron est arrivée à échéance et le leader a déclenché.",
   "Webhook": "Une livraison de webhook correctement signée est arrivée.",
   "Manual": "Une personne ou un identifiant a utilisé l'action Déclencher maintenant."
  },
  "triggerFireOutcome": {
   "Started": "Le déclenchement a créé une exécution ou une exécution de pipeline ; suivez le lien pour la voir.",
   "Failed": "Rien n'a été lancé : le modèle a échoué, l'identité d'exécution a perdu son accès ou la cible manquait.",
   "Skipped": "L'occurrence a été manquée plus longtemps que la limite de rattrapage cron et n'a pas été déclenchée."
  },
  "notificationEvent": {
   "RunSucceeded": "Envoyé quand une exécution se termine avec succès.",
   "RunFailed": "Envoyé quand une exécution échoue ou est rejetée.",
   "RunCancelled": "Envoyé quand une exécution est annulée avant la fin.",
   "RunTimedOut": "Envoyé quand une exécution dépasse son échéance et est arrêtée.",
   "PipelineCompleted": "Envoyé quand toutes les étapes d'une exécution de pipeline ont réussi.",
   "PipelineFailed": "Envoyé quand une exécution de pipeline échoue, dépasse son délai ou est annulée.",
   "ApprovalRequested": "Envoyé quand une approbation d'outil ou une revue d'étape attend une personne.",
   "Test": "Envoyé uniquement par l'action Envoyer un essai, pour vérifier que le point de terminaison fonctionne."
  },
  "notificationDeliveryStatus": {
   "Pending": "Attend sa prochaine tentative ; les échecs sont relancés avec des délais croissants.",
   "Delivering": "Une réplique du plan de contrôle l'envoie en ce moment.",
   "Succeeded": "Le point de terminaison a répondu avec un statut 2xx ; la notification est terminée.",
   "Failed": "Garrison a abandonné : les tentatives sont épuisées ou le point de terminaison a répondu avec un statut non relancé."
  },
  "runKind": {
   "Invoke": "Lancée par un appelant via REST, MCP, A2A ou le tableau de bord.",
   "Delegated": "Lancée par un autre agent via la délégation Garrison.",
   "Test": "Une exécution d'essai d'un déploiement depuis le tableau de bord ou l'API.",
   "Retry": "Une nouvelle tentative d'une exécution précédente relancée par quelqu'un.",
   "Pipeline": "L'exécution d'une étape d'une exécution de pipeline.",
   "Trigger": "Lancée par une planification cron, un webhook signé ou un déclenchement manuel."
  },
  "auditEventType": {
   "SigningSecretRotated": "Quelqu'un a remplacé le secret de signature d'un déclencheur ou d'un point de terminaison de notification ; l'ancien ne fonctionne plus."
  }
 },
 "resources": {
  "runs": {
   "triggerId": "Le déclencheur qui a lancé cette exécution. Cliquez pour ouvrir son historique de déclenchements.",
   "kind": "Comment l'exécution a été lancée : par un appelant, un autre agent, comme essai, nouvelle tentative, étape de pipeline ou par un déclencheur.",
   "openTrigger": "Ouvrir l'historique du déclencheur qui a lancé cette exécution."
  },
  "triggers": {
   "add": "Créer une planification cron ou un webhook signé qui lance un agent ou un pipeline sans que personne ne l'appelle.",
   "type": "Cron se déclenche selon une planification ; Webhook quand un autre système envoie une requête signée. Non modifiable ensuite.",
   "target": "Ce que lance chaque déclenchement : une exécution d'agent ou de pipeline.",
   "schedule": "L'expression cron et son fuseau horaire, ou l'indication que le déclencheur attend des livraisons de webhook.",
   "lastFire": "Quand le déclencheur s'est déclenché pour la dernière fois et si cela a lancé une exécution.",
   "nextFireUtc": "Quand un déclencheur cron actif se déclenchera ensuite. Les déclencheurs webhook et inactifs n'en ont pas.",
   "fireCount": "Nombre de déclenchements, y compris ceux qui ont échoué ou été ignorés.",
   "runAs": "L'utilisateur ou l'identifiant au nom duquel agissent les exécutions. Chaque déclenchement vérifie qu'il peut encore exécuter la cible.",
   "signingSecretLast4": "Les quatre derniers caractères du secret de signature, pour savoir quel secret un expéditeur utilise.",
   "targetType": "Si chaque déclenchement exécute un agent ou lance un pipeline complet.",
   "agentId": "L'agent exécuté à chaque déclenchement. Vous devez avoir le droit de l'exécuter.",
   "deploymentId": "Fixer les exécutions sur un déploiement de l'agent, ou laisser vide pour choisir selon le poids.",
   "pipelineId": "Le pipeline lancé à chaque déclenchement. Vous devez pouvoir le lancer et exécuter ses agents d'étape.",
   "inputTemplateId": "Le modèle de prompt qui transforme le déclenchement (heure, charge utile, ID de livraison) en entrée d'exécution.",
   "priority": "Priorité en file des exécutions lancées, de -100 à 100. Les plus élevées sont attribuées d'abord.",
   "cronExpression": "Quand le déclencheur se déclenche, sous forme d'expression cron à cinq champs ou de macro comme @hourly.",
   "timeZone": "Le fuseau IANA dans lequel l'expression cron est lue, par exemple Europe/Paris.",
   "webhook": "Envoyez ici des requêtes POST signées. Celles dont la signature manque, a expiré ou est fausse sont refusées avec 401.",
   "actions": {
    "fire": "Déclencher une fois maintenant, avec une charge utile d'essai facultative, et voir l'exécution lancée.",
    "fires": "Voir quand et pourquoi ce déclencheur s'est déclenché et quelle exécution chaque déclenchement a lancée.",
    "runs": "Ouvrir la liste des exécutions filtrée sur celles lancées par ce déclencheur.",
    "rotateSecret": "Créer un nouveau secret de signature du webhook. L'ancien cesse de fonctionner immédiatement."
   },
   "fires": {
    "firedUtc": "Quand le déclenchement a été traité. Les déclenchements cron indiquent aussi leur occurrence.",
    "source": "Pourquoi il a été déclenché : sa planification, une livraison de webhook ou une personne.",
    "outcome": "Si le déclenchement a lancé une exécution, échoué ou été ignoré.",
    "started": "L'exécution ou l'exécution de pipeline créée par ce déclenchement. Cliquez pour l'ouvrir.",
    "deliveryId": "L'en-tête X-Garrison-Delivery de la requête ; les répétitions avec la même valeur déclenchent une fois.",
    "error": "Pourquoi le déclenchement n'a rien lancé, avec un code d'erreur stable.",
    "runId": "L'exécution créée par ce déclenchement. Cliquez pour l'ouvrir.",
    "pipelineRunId": "L'exécution de pipeline lancée par ce déclenchement. Cliquez pour l'ouvrir."
   }
  },
  "notifications": {
   "add": "Enregistrer une URL qui reçoit un POST HTTP signé quand les événements choisis surviennent dans ce locataire.",
   "url": "Où Garrison envoie les notifications. Les adresses privées et de métadonnées sont refusées et les redirections ne sont pas suivies.",
   "events": "Les événements reçus par ce point de terminaison. Survolez la valeur pour les voir tous.",
   "filters": "Filtres d'agent ou de déploiement qui limitent les événements d'exécution et d'approbation envoyés.",
   "signingSecretLast4": "Les quatre derniers caractères du secret de signature, pour que les destinataires sachent quel secret signe.",
   "includeResultText": "Si les notifications d'exécution incluent le texte du résultat, coupé à la limite configurée.",
   "agentId": "N'envoyer que les événements des exécutions de cet agent. Les événements de pipeline s'arrêtent tant qu'un filtre est défini.",
   "deploymentId": "N'envoyer que les événements des exécutions de ce déploiement. Les événements de pipeline s'arrêtent tant qu'un filtre est défini.",
   "resultTextMaxChars": "Texte de résultat le plus long inclus dans une notification, en caractères.",
   "actions": {
    "test": "Envoyer maintenant une notification d'essai et montrer si le point de terminaison l'a acceptée.",
    "deliveries": "Voir toutes les notifications envoyées à ce point de terminaison avec tentatives, statut HTTP et erreurs.",
    "rotateSecret": "Créer un nouveau secret de signature. Les nouvelles tentatives déjà en file sont aussi signées avec."
   },
   "deliveries": {
    "createdUtc": "Quand l'événement a été mis en file pour ce point de terminaison. Cliquez pour voir les détails.",
    "event": "Quel événement cette notification signale.",
    "status": "Si la notification attend, est en cours, livrée ou abandonnée.",
    "attempts": "Tentatives faites jusqu'ici et le maximum prévu.",
    "lastStatusCode": "Statut HTTP renvoyé par le point de terminaison à la dernière tentative ; vide sans réponse.",
    "lastError": "Ce qui a échoué à la dernière tentative, comme un délai dépassé ou une destination refusée.",
    "lastAttemptUtc": "Quand l'envoi de cette notification a été tenté pour la dernière fois.",
    "nextAttemptUtc": "Quand la prochaine tentative est prévue ; vide une fois la livraison terminée.",
    "deliveredUtc": "Quand le point de terminaison a accepté la notification.",
    "payload": "Le corps JSON exact envoyé à chaque tentative. Il ne contient jamais de secrets.",
    "id": "Identifiant de livraison, aussi envoyé dans X-Garrison-Delivery pour que les destinataires ignorent les répétitions."
   }
  }
 },
 "views": {
  "runDetail": {
   "trigger": "Le déclencheur qui a lancé cette exécution, et comment l'exécution a été lancée.",
   "openTrigger": "Ouvrir l'historique de ce déclencheur dans Agents > Déclencheurs."
  },
  "pipelineRunDetail": {
   "trigger": "Le déclencheur qui a lancé cette exécution de pipeline. Ses exécutions d'étape portent le même déclencheur."
  },
  "settings": {
   "groups": {
    "Triggers": "Limites des webhooks de déclencheurs, rattrapage cron après une panne et conservation de l'historique des déclenchements.",
    "Notifications": "Livraison des notifications sortantes : protection SSRF, relances et délais, délais maximaux et conservation du journal des livraisons."
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Corps de requête webhook maximal en octets. Les livraisons plus grosses reçoivent 413 avant la vérification de la signature.",
     "WebhookToleranceSeconds": "Écart maximal entre l'horodatage de la signature et l'horloge du serveur. Les livraisons trop anciennes sont refusées, donc une requête capturée ne peut pas être rejouée.",
     "CronMaxLatenessSeconds": "Les occurrences cron manquées sont regroupées en un déclenchement, sauf si la dernière date de plus de ce nombre de secondes ; elle est alors notée Ignoré. 0 déclenche toujours une fois.",
     "FireRetentionDays": "Jours de conservation de l'historique des déclenchements."
    },
    "Notifications": {
     "AllowPrivateDestinations": "Autoriser les URL de notification sur les réseaux de bouclage et privés. Désactivé par défaut pour empêcher la falsification de requêtes côté serveur ; les adresses de lien local et de métadonnées restent bloquées.",
     "MaxAttempts": "Nombre maximal de tentatives de livraison d'une notification avant de l'abandonner.",
     "InitialBackoffSeconds": "Délai avant la deuxième tentative ; chaque délai suivant double jusqu'au délai maximal.",
     "MaxBackoffSeconds": "Le délai le plus long entre deux tentatives d'une notification.",
     "TimeoutSeconds": "Secondes accordées à une tentative de livraison, connexion comprise.",
     "DispatchIntervalMs": "Fréquence à laquelle chaque réplique du plan de contrôle cherche des notifications à envoyer, en millisecondes.",
     "SweepOverlapSeconds": "Secondes d'historique déjà parcouru que le leader relit à chaque passage pour ne pas manquer d'événements tardifs.",
     "DeliveryRetentionDays": "Jours pendant lesquels les livraisons terminées restent dans le journal."
    }
   }
  }
 },
 "signingSecret": {
  "done": "Fermer cette fenêtre. Le secret ne peut pas être réaffiché, copiez-le d'abord.",
  "secret": "Le secret de signature. Expéditeurs et destinataires calculent avec lui la signature HMAC-SHA256.",
  "copy": "Copier le secret de signature dans le presse-papiers pour l'enregistrer dans l'autre système.",
  "url": "L'URL à laquelle d'autres systèmes envoient en POST des livraisons de webhook signées.",
  "copyUrl": "Copier l'URL du webhook dans le presse-papiers."
 },
 "triggerFire": {
  "submit": "Déclencher une fois maintenant avec cette charge utile. L'exécution démarre avec l'identité d'exécution du déclencheur.",
  "body": "Texte de charge utile facultatif. Le modèle d'entrée le voit comme webhook.body, et comme webhook.json s'il s'agit de JSON.",
  "contentType": "Type de média de la charge utile, comme application/json. Vide pour du texte brut.",
  "openRun": "Ouvrir l'exécution lancée par ce déclenchement.",
  "openPipelineRun": "Ouvrir l'exécution de pipeline lancée par ce déclenchement."
 },
 "triggerFires": {
  "refresh": "Recharger les déclenchements les plus récents de ce déclencheur."
 },
 "notificationDeliveries": {
  "refresh": "Recharger les livraisons les plus récentes de ce point de terminaison.",
  "open": "Afficher la charge utile, les tentatives et la dernière erreur de cette livraison sous la liste.",
  "detail": "Tous les champs de la livraison sélectionnée, y compris le corps JSON envoyé."
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
  "title": "Déclencheurs",
  "p1": "Un déclencheur lance une exécution d'agent ou de pipeline sans que personne ne l'appelle : selon une planification cron ou quand un autre système envoie un webhook signé avec le secret du déclencheur.",
  "p2": "L'entrée de l'exécution provient d'un modèle de prompt qui peut utiliser l'heure du déclenchement et la charge utile du webhook. Les exécutions agissent au nom de l'utilisateur ou de l'identifiant qui a enregistré le déclencheur en dernier, et chaque déclenchement vérifie qu'il peut encore exécuter la cible.",
  "p3": "Si aucune réplique n'a pu déclencher une planification pendant un moment, les occurrences manquées deviennent un seul déclenchement. Les livraisons de webhook qui répètent une valeur X-Garrison-Delivery ne déclenchent qu'une fois."
 },
 "notifications": {
  "title": "Notifications sortantes",
  "p1": "Un point de terminaison de notification reçoit un POST JSON signé quand un événement suivi survient : une exécution ou un pipeline qui se termine, ou une approbation qui attend une personne.",
  "p2": "Les livraisons sont mises en file de façon durable et relancées avec des délais croissants. Chaque tentative porte le même ID de livraison, pour que les destinataires ignorent les répétitions.",
  "p3": "Les notifications n'incluent jamais de secrets ni l'entrée de l'exécution, et la sortie seulement si vous l'autorisez. Les adresses de réseaux privés sont refusées sauf si un opérateur les autorise."
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
   "menu": "Téléchargez cette transcription sous forme de fichier : entrée, texte de l'assistant, appels d'outils, approbations, erreurs, consommation et coût, avec les secrets masqués.",
   "markdown": "Téléchargez une transcription Markdown lisible, à partager ou à joindre à un ticket.",
   "json": "Téléchargez la transcription sous forme de document JSON typé (garrison.transcript/v1) pour les scripts et autres outils.",
   "includeThinking": "Incluez aussi les événements de raisonnement du modèle. Ils sont exclus par défaut car longs et internes."
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "Cet agent a un schéma d'entrée : son entrée est donc un document JSON. Remplissez le formulaire ou passez au JSON brut.",
    "modeForm": "Modifiez l'entrée avec un formulaire généré à partir du schéma d'entrée de l'agent.",
    "modeJson": "Modifiez l'entrée sous forme de texte JSON brut. Les valeurs sont conservées quand vous revenez au formulaire.",
    "field": "Valeur de {{name}}, telle que la décrit le schéma d'entrée de l'agent.",
    "fieldWithDescription": "{{name}} : {{description}}",
    "addItem": "Ajoutez un autre élément à cette liste.",
    "removeItem": "Retirez cet élément de la liste.",
    "jsonLabel": "Le document JSON envoyé comme entrée de l'exécution. Il doit respecter le schéma d'entrée de l'agent."
   }
  },
  "manifests": {
   "bundle": {
    "scopeAll": "Exportez toutes les ressources de ce locataire. Les éléments intégrés sont exclus sauf si vous les incluez.",
    "scopeSelected": "Exportez uniquement les types et ressources choisis, éventuellement avec ce dont ils dépendent.",
    "kinds": "Exportez toutes les ressources des types cochés.",
    "kind": "Exportez toutes les ressources {{kind}} de ce locataire.",
    "resources": "Ressources précises à exporter, écrites sous la forme Type/nom, par exemple Agent/triage ou Pipeline/release.",
    "followReferences": "Exportez aussi ce dont la sélection dépend : déploiements, profils de harness, modèles de prompt, espaces de travail, serveurs MCP, déclencheurs et points de notification. Les secrets sont listés comme prérequis, jamais exportés.",
    "includeBuiltIn": "Ajoutez les modèles de prompt et profils de harness intégrés que le paquet référence. L'application ne les modifie pas ; elle vérifie seulement qu'ils existent."
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
   "Draft": "Une révision non publiée. Un seul brouillon est ouvert par agent ; aucun déploiement ne l'exécute avant sa publication.",
   "Published": "Une révision figée. Les déploiements qui suivent la dernière révision, ou qui épinglent celle-ci, l'exécutent."
  },
  "promotionKind": {
   "Promote": "A épinglé les déploiements d'un environnement sur une révision prise dans l'environnement précédent.",
   "Rollback": "A rétabli les épinglages de révision remplacés par une promotion, exactement comme avant."
  },
  "promotionOutcome": {
   "Applied": "Les épinglages posés par cet enregistrement sont toujours en place.",
   "RolledBack": "Une annulation ultérieure a rétabli les épinglages remplacés par cette promotion."
  },
  "revisionChangeType": {
   "Changed": "Le champ a une valeur différente dans la révision la plus récente.",
   "Added": "Le champ ou l'élément de liste n'existe que dans la révision la plus récente.",
   "Removed": "Le champ ou l'élément de liste n'existe que dans la révision la plus ancienne."
  }
 },
 "filters": {
  "environment": "Afficher seulement les déploiements d'un environnement, comme dev, staging ou prod. S'applique à la page chargée."
 },
 "resources": {
  "deployments": {
   "environment": "L'environnement auquel appartient ce déploiement. Les promotions font passer une révision d'un environnement au suivant dans l'ordre du locataire.",
   "agentRevisionId": "La révision de l'agent que ce déploiement exécute. Dernière suit chaque nouvelle révision publiée ; une révision épinglée reste jusqu'à modification ou promotion.",
   "environmentBadge": "Ce déploiement s'exécute dans l'environnement {{environment}}.",
   "followsLatest": "Non épinglé : ce déploiement exécute la dernière révision publiée de l'agent.",
   "pinnedRevision": "Épinglé : ce déploiement exécute {{revision}} jusqu'à ce que l'épinglage change.",
   "actions": {
    "promote": "Promouvoir la révision de l'agent d'un environnement au suivant, en mettant à jour l'épinglage de chaque déploiement concerné.",
    "promotions": "Voir les promotions et annulations passées, et annuler une promotion pour rétablir les épinglages précédents."
   }
  }
 },
 "views": {
  "agentDetail": {
   "reviewDraft": "Ouvrir l'onglet Révisions pour comparer le brouillon à la dernière révision publiée, puis le publier ou le supprimer.",
   "tabs": {
    "revisions": "Chaque révision enregistrée de cet agent : comparez-en deux, publiez le brouillon ou supprimez-le."
   },
   "columns": {
    "environment": "L'environnement auquel appartient le déploiement, utilisé par les promotions.",
    "revision": "La révision que le déploiement exécute : Dernière suit chaque publication, un numéro est un épinglage."
   }
  }
 },
 "revisions": {
  "columns": {
   "number": "Numéro de révision. Les numéros augmentent à chaque révision enregistrée de cet agent.",
   "state": "Les brouillons peuvent encore changer ; les révisions publiées sont figées.",
   "author": "Qui a enregistré cette révision : l'utilisateur ou la clé d'accès qui l'a créée ou remplacée en dernier.",
   "changeNote": "Ce qui a changé et pourquoi, tel que noté à la publication.",
   "publishedUtc": "Date de publication de la révision. Vide pour le brouillon.",
   "actions": "Comparer, publier ou supprimer une révision."
  },
  "latest": "La dernière révision publiée. Les déploiements sans épinglage exécutent celle-ci.",
  "compare": "Afficher ce qui a changé entre cette révision et la révision publiée précédente.",
  "publish": "Publier ce brouillon pour qu'il devienne la dernière révision publiée.",
  "discard": "Supprimer ce brouillon. Les révisions publiées ne sont pas concernées.",
  "discardConfirm": "Supprimer définitivement le brouillon. Cette action est irréversible.",
  "from": "Le côté le plus ancien de la comparaison : valeurs affichées comme Avant.",
  "to": "Le côté le plus récent de la comparaison : valeurs affichées comme Après.",
  "publishSubmit": "Publier le brouillon maintenant. Les déploiements qui suivent la dernière révision l'exécutent dès leur prochaine exécution.",
  "changeNote": "Note facultative enregistrée avec la révision publiée et affichée dans la liste des révisions. Jusqu'à 2000 caractères.",
  "diffColumns": {
   "field": "Le champ de révision qui diffère, comme description ou promptPins.",
   "change": "Si le champ a été modifié, ajouté ou supprimé.",
   "before": "La valeur dans la révision la plus ancienne.",
   "after": "La valeur dans la révision la plus récente."
  }
 },
 "promote": {
  "agent": "L'agent dont la révision est promue. Ses déploiements dans l'environnement cible sont mis à jour.",
  "revision": "Laissez la révision source pour promouvoir ce que l'environnement source exécute, ou choisissez une révision publiée.",
  "source": "L'environnement d'où provient la révision.",
  "target": "L'environnement à mettre à jour. Par défaut, celui qui suit la source dans l'ordre du locataire.",
  "allowSkip": "Requis quand la cible n'est pas l'environnement suivant. Les environnements sautés sont enregistrés avec la promotion.",
  "note": "Note facultative enregistrée avec la promotion. Jusqu'à 2000 caractères.",
  "submit": "Appliquer la promotion maintenant. Chaque déploiement de l'agent dans l'environnement cible reçoit le nouvel épinglage."
 },
 "promotions": {
  "agentFilter": "Afficher seulement les promotions et annulations d'un agent.",
  "refresh": "Recharger l'historique des promotions depuis le serveur.",
  "columns": {
   "createdUtc": "Quand la promotion ou l'annulation a été appliquée.",
   "kind": "Promotion, ou annulation d'une promotion antérieure.",
   "outcome": "Si les épinglages sont toujours en place ou ont été annulés depuis.",
   "agent": "L'agent dont les déploiements ont été mis à jour.",
   "revision": "La révision qui a été promue.",
   "environments": "Environnement source et cible de la promotion.",
   "deployments": "Chaque déploiement mis à jour, avec son épinglage avant et après.",
   "actor": "Qui a appliqué la promotion ou l'annulation.",
   "note": "La note saisie à la création de l'enregistrement.",
   "actions": "Annuler une promotion appliquée."
  },
  "skipped": "Cette promotion a sauté au moins un environnement, ce qui a nécessité Autoriser le saut d'environnements.",
  "rollback": "Rétablir les épinglages de révision que ces déploiements avaient avant cette promotion.",
  "rollbackConfirm": "Appliquer l'annulation maintenant. Elle est enregistrée dans l'historique des promotions.",
  "rollbackNote": "Note facultative enregistrée avec l'annulation. Jusqu'à 2000 caractères."
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
   "SystemPrompt": "Le prompt système de l'agent, fourni par un modèle de prompt. Il n'a pas de fichiers envoyés.",
   "Skill": "Un dossier de skill chargé par le harnais, placé là où le profil de harnais range les skills.",
   "ReferenceFile": "Un fichier que l'agent peut lire pendant une exécution, placé dans l'espace de travail de l'exécution.",
   "DocumentTemplate": "Un modèle de document, par exemple un fichier .docx ou .dotx, que l'agent remplit pendant une exécution."
  },
  "runOutcome": {
   "AssetIntegrityFailed": "Un fichier de ressource a échoué à la vérification SHA-256 ou n'a pas pu être téléchargé avant le lancement : le harnais n'a jamais démarré."
  }
 },
 "resources": {
  "agentAssets": {
   "add": "Créer une ressource. Envoyez ensuite ses fichiers comme une version, puis épinglez-la sur une révision d'agent.",
   "name": "Nom unique de la ressource dans ce locataire. Les révisions et les manifestes peuvent désigner la ressource par ce nom.",
   "kind": "Prompt système, skill, fichier de référence ou modèle de document. Fixé après la création de la ressource.",
   "currentVersion": "La version la plus récente. Les épinglages qui suivent la version actuelle l'utilisent dès la prochaine exécution.",
   "description": "Ce que contient la ressource et quels agents l'utilisent, en termes simples.",
   "tags": "Étiquettes pour retrouver et regrouper les ressources. Elles n'ont aucun effet sur les exécutions.",
   "artifactStoreId": "Emplacement de stockage des fichiers de la ressource. Base de données Garrison signifie qu'ils sont conservés dans la base de données du plan de contrôle.",
   "promptTemplateId": "Le modèle de prompt qui fournit le texte d'une ressource de prompt système. Obligatoire uniquement pour les prompts système.",
   "databaseStore": "Les fichiers sont stockés dans la base de données Garrison, pas dans un stockage d'artefacts externe.",
   "kindFilter": "Afficher uniquement les ressources d'un type : prompts système, skills, fichiers de référence ou modèles de document.",
   "actions": {
    "versions": "Ouvrir l'historique des versions : parcourir les fichiers, prévisualiser les fichiers texte, les télécharger et envoyer une nouvelle version."
   }
  }
 },
 "revisions": {
  "columns": {
   "assetPins": "Ressources épinglées par cette révision, chacune à une version fixe ou suivant la version actuelle de la ressource."
  }
 },
 "assets": {
  "files": "Choisissez un ou plusieurs fichiers sur votre ordinateur. Ils sont lus dans le navigateur et envoyés ensemble comme une seule version.",
  "path": "Emplacement du fichier dans la ressource, sous forme de chemin relatif avec des barres obliques, par exemple docs/guide.md.",
  "uploadColumns": {
   "path": "Le chemin de chaque fichier dans la ressource. Modifiez-le avant l'envoi si nécessaire.",
   "mediaType": "Le type de média indiqué par le navigateur. S'il est vide, le serveur le déduit de l'extension.",
   "size": "Taille du fichier lu depuis votre ordinateur.",
   "actions": "Retirer un fichier de cet envoi avant de l'envoyer."
  },
  "removeFile": "Retirer ce fichier de l'envoi. Rien n'est envoyé tant que vous n'avez pas lancé l'envoi.",
  "changeNote": "Note facultative enregistrée avec la nouvelle version et affichée dans l'historique des versions. 2000 caractères au maximum.",
  "upload": "Envoyer les fichiers choisis comme une nouvelle version. Si les fichiers sont identiques, la version actuelle est renvoyée.",
  "current": "Il s'agit de la version actuelle de la ressource, utilisée par les épinglages qui suivent la version actuelle.",
  "showFiles": "Afficher les fichiers de cette version avec leurs tailles, empreintes, aperçus et téléchargements.",
  "versionColumns": {
   "number": "Numéro de version. Chaque envoi avec des fichiers différents ajoute le numéro suivant.",
   "author": "Personne ayant envoyé cette version.",
   "changeNote": "La note saisie lors de l'envoi de cette version.",
   "totalBytes": "Taille cumulée de tous les fichiers de cette version.",
   "createdUtc": "Date d'envoi de cette version.",
   "actions": "Afficher les fichiers d'une version."
  },
  "fileColumns": {
   "path": "Chemin du fichier dans la ressource, c'est-à-dire l'emplacement où il est placé pour une exécution.",
   "mediaType": "Type de média enregistré avec le fichier.",
   "sizeBytes": "Taille du fichier dans cette version.",
   "sha256": "Début de l'empreinte SHA-256 du fichier. Les workers la vérifient avant le démarrage d'une exécution.",
   "actions": "Prévisualiser les fichiers texte sur place ou télécharger n'importe quel fichier."
  },
  "sha256Full": "Empreinte SHA-256 complète de ce fichier : {{sha}}",
  "preview": "Afficher ce fichier texte en lecture seule sous la liste des fichiers. Rien ne peut être modifié ici.",
  "download": "Télécharger ce fichier de cette version sur votre ordinateur.",
  "pinsSave": "Enregistrer ces épinglages de ressources sur le brouillon. Publiez ensuite le brouillon pour que les déploiements les utilisent.",
  "pinAsset": "La ressource à épingler sur cette révision. Chaque ressource ne peut être épinglée qu'une fois.",
  "pinVersion": "Épingler une version fixe, ou choisir Version actuelle pour utiliser la version la plus récente de la ressource au moment de l'exécution.",
  "removePin": "Retirer cette ressource des épinglages de la révision.",
  "addPin": "Ajouter une autre ressource aux épinglages de la révision.",
  "editPins": "Ajouter, retirer ou modifier les épinglages de ressources de cette révision brouillon.",
  "pinsNewDraft": "Créer un nouveau brouillon à partir de la dernière révision publiée et choisir ses épinglages de ressources.",
  "pinnedVersion": "Cette ressource est épinglée à une version fixe : les exécutions continuent de l'utiliser après de nouveaux envois.",
  "pinnedCurrent": "Cette ressource suit sa version actuelle : les exécutions utilisent le dernier envoi."
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
    "turns": "Les tours de cette conversation, du plus ancien au plus récent, et la zone pour envoyer le suivant.",
    "files": "Le dossier partagé que lisent et écrivent chaque tour et chaque agent délégué de cette conversation, avec l'historique des versions et les téléchargements."
   }
  },
  "runDetail": {
   "fileSpace": "L'espace de fichiers partagé que cette exécution copie dans son espace de travail au démarrage et réécrit à la fin. Les exécutions d'une conversation, d'une exécution de pipeline ou d'un arbre de délégation le partagent.",
   "openFiles": "Ouvrir l'onglet Fichiers de la conversation de cette exécution pour parcourir, télécharger ou envoyer les fichiers partagés."
  }
 },
 "resources": {
  "deployments": {
   "fileSpaceMountPath": "Dossier de l'espace de travail de l'exécution où l'espace de fichiers partagé est synchronisé, par exemple files. Relatif, avec des barres obliques, 128 caractères au maximum."
  }
 },
 "files": {
  "summary": "Nombre de fichiers actuels du dossier partagé et leur taille totale. Les fichiers supprimés ne comptent pas.",
  "live": "La liste se met à jour dès qu'un tour, un agent délégué ou une personne modifie un fichier.",
  "polling": "La connexion en direct n'est pas disponible, la liste est donc rechargée toutes les {{seconds}} secondes tant que cet onglet est ouvert.",
  "includeDeleted": "Lister aussi les fichiers supprimés. Leurs versions sont conservées et restent téléchargeables.",
  "refresh": "Recharger maintenant la liste des fichiers depuis le serveur.",
  "columns": {
   "path": "Chemin du fichier dans le dossier partagé. Les exécutions le trouvent dans le dossier de l'espace de fichiers du déploiement.",
   "currentVersion": "La version la plus récente. Chaque écriture par un tour, un agent ou un envoi en ajoute une.",
   "sizeBytes": "Taille de la version actuelle du fichier.",
   "mediaType": "Type de média enregistré avec la version actuelle.",
   "lastUpdateUtc": "Date de la dernière modification du fichier.",
   "actions": "Afficher l'historique des versions, télécharger la version actuelle ou supprimer le fichier."
  },
  "deleted": "Ce fichier a été supprimé. Les tours suivants ne le voient plus, mais ses versions sont conservées.",
  "versions": "Ouvrir l'historique des versions de ce fichier, avec un téléchargement et un aperçu texte pour chaque version.",
  "download": "Télécharger la version actuelle de ce fichier par un lien de courte durée.",
  "delete": "Supprimer ce fichier du dossier partagé. Ses versions sont conservées.",
  "confirmDelete": "Supprimer le fichier maintenant. Les tours suivants ne le verront plus.",
  "versionColumns": {
   "number": "Numéro de version. Chaque écriture ajoute le numéro suivant.",
   "sizeBytes": "Taille du fichier dans cette version.",
   "mediaType": "Type de média enregistré avec cette version.",
   "sha256": "Début de l'empreinte SHA-256 de cette version. Les workers la vérifient lors de la synchronisation du fichier.",
   "writtenBy": "L'agent dont l'exécution a écrit cette version, ou la personne qui l'a envoyée.",
   "createdUtc": "Date d'écriture de cette version.",
   "actions": "Prévisualiser les versions texte sur place ou télécharger n'importe quelle version."
  },
  "current": "C'est la version que voient les tours suivants.",
  "sha256Full": "Empreinte SHA-256 complète de cette version : {{sha}}",
  "openRun": "Ouvrir l'exécution qui a écrit cette version.",
  "preview": "Afficher cette version en lecture seule sous la liste. Rien n'y est modifiable.",
  "downloadVersion": "Télécharger cette version du fichier sur votre ordinateur.",
  "chooseFiles": "Choisissez un ou plusieurs fichiers sur votre ordinateur. Ils sont lus dans le navigateur et envoyés un par un.",
  "uploadColumns": {
   "path": "Emplacement de chaque fichier dans le dossier partagé. Modifiez-le avant l'envoi si besoin.",
   "replaces": "La version de la liste que cet envoi remplace, ou Nouveau fichier. Un fichier modifié entre-temps est conservé sous un nom de conflit.",
   "size": "Taille du fichier lu depuis votre ordinateur.",
   "actions": "Retirer un fichier de cet envoi avant de l'expédier."
  },
  "path": "Chemin dans le dossier partagé, relatif avec des barres obliques, par exemple notes/sources.md.",
  "removeFile": "Retirer ce fichier de l'envoi. Rien n'est expédié avant l'envoi.",
  "upload": "Envoyer chaque fichier choisi dans le dossier partagé, un par un, avec la version qu'il remplace."
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
   "capabilities": "Le catalogue des capacités : agents, outils MCP et outils intégrés aux harness, avec leurs sources, des indications de coût et de latence, et une actualisation."
  }
 },
 "filters": {
  "tag": "N'afficher que les capacités portant exactement ce tag. La liste se met à jour dès que vous cessez de taper.",
  "origin": "N'afficher que les entrées dérivées, qui suivent leur source, ou que les entrées manuelles rédigées par des personnes."
 },
 "enums": {
  "capabilityKind": {
   "Agent": "Un autre agent Garrison, décrit à partir de sa dernière révision publiée. Un agent orchestrateur peut lui déléguer du travail.",
   "McpTool": "Un outil d'un serveur MCP enregistré dans ce locataire, décrit à partir de la liste d'outils du serveur.",
   "HarnessBuiltIn": "Un programme que le harness peut lancer sur l'hôte de son worker, comme pandoc ou LibreOffice, détecté par une sonde d'outil d'un profil de harness."
  },
  "capabilityOrigin": {
   "Derived": "Garrison maintient cette entrée alignée sur sa source. Elle ne peut être ni modifiée ni supprimée ici ; modifiez plutôt la source.",
   "Manual": "Une personne a rédigé cette entrée. Elle peut être modifiée et supprimée ici."
  },
  "capabilityHintStatus": {
   "Unknown": "Trop peu d'exécutions se sont terminées dans la fenêtre des indications pour en tirer quoi que ce soit : aucune valeur n'est donc affichée. Les outils MCP et les outils intégrés ont toujours des indications inconnues.",
   "Known": "Assez d'exécutions se sont terminées dans la fenêtre des indications : les valeurs de durée et de coût reposent donc sur des exécutions réelles."
  },
  "runBlockedReason": {
   "NoToolWorker": "Bloquée : l'agent de cette exécution utilise un outil intégré au harness, comme pandoc, et aucun worker prêt capable de l'exécuter ne signale cet outil. Elle attend dans la file d'attente qu'un tel worker s'enregistre."
  }
 },
 "resources": {
  "capabilities": {
   "add": "Rédiger une entrée manuelle pour ce que Garrison ne peut pas dériver, par exemple un service de conversion que les agents atteignent via une ressource Skill.",
   "name": "Nom sous lequel les agents trouvent la capacité. Les agents portent le nom de l'agent, les outils MCP la forme server/tool, les outils intégrés le nom de l'outil.",
   "kind": "Agent, outil MCP ou outil intégré au harness. Les entrées manuelles peuvent utiliser n'importe quel type.",
   "origin": "Les entrées dérivées suivent leur source et ne peuvent pas être modifiées ici ; les entrées manuelles ont été rédigées par des personnes.",
   "summary": "Ce que fait la capacité et quand l'utiliser, tel que les agents le lisent. Jusqu'à 4000 caractères.",
   "source": "D'où vient l'entrée : l'agent, le serveur MCP et l'outil, ou le profil de harness et l'étiquette de nœud requise par une exécution.",
   "hints": "Durée médiane et 90e centile des exécutions et coût moyen des exécutions terminées récemment, ou Inconnu si trop peu d'exécutions se sont terminées.",
   "tags": "Libellés pour filtrer le catalogue. Les agents peuvent aussi filtrer par tag.",
   "lastRefreshedUtc": "Date à laquelle Garrison a actualisé pour la dernière fois une entrée dérivée depuis sa source. Vide pour les entrées manuelles.",
   "sourceAgentId": "Facultatif. L'agent Garrison que représente cette entrée manuelle.",
   "sourceMcpServerId": "Facultatif. Le serveur MCP dont cette entrée manuelle représente un outil.",
   "sourceToolName": "Le nom de l'outil sur le serveur MCP choisi.",
   "requirements": "Étiquettes de nœud, comme garrison.io/tool-pandoc=true, qu'un worker doit signaler avant de prendre une exécution qui utilise cette capacité.",
   "inputSchema": "JSON Schema de ce que la capacité accepte. Garrison vérifie à l'enregistrement qu'il s'agit d'un JSON Schema valide.",
   "outputSchema": "JSON Schema de ce que la capacité renvoie. Garrison vérifie à l'enregistrement qu'il s'agit d'un JSON Schema valide.",
   "kindFilter": "N'afficher que les agents, que les outils MCP ou que les outils intégrés aux harness. Choisissez Tous pour voir tout le catalogue.",
   "originFilter": "N'afficher que les entrées dérivées, qui suivent leur source, ou que les entrées manuelles rédigées par des personnes.",
   "tagFilter": "N'afficher que les capacités portant exactement ce tag. La liste se met à jour dès que vous cessez de taper.",
   "refresh": "Actualiser maintenant les entrées dérivées : agents, outils intégrés aux harness, outils des serveurs MCP et indications des agents. Affiche ce qui a changé et quels serveurs ont échoué.",
   "warnings": "Les entrées dont la source n'a pas pu être actualisée conservent leur dernier contenu valide et indiquent la raison dans leurs détails.",
   "warningBadge": "La dernière actualisation de la source de cette entrée a échoué : elle affiche donc son dernier contenu valide. Raison : {{warning}}"
  },
  "harnessProfiles": {
   "toolProbes": "Outils que ce harness peut utiliser lorsque l'hôte du worker en dispose, comme pandoc. Chacun devient un outil intégré au harness dans le catalogue des capacités.",
   "toolProbesItems": {
    "name": "Nom de l'outil dans le catalogue et dans l'étiquette de nœud garrison.io/tool-{name} : lettres minuscules, chiffres, points et traits d'union.",
    "executable": "Simple nom de fichier que le worker recherche dans son PATH, par exemple soffice. Aucun dossier n'est autorisé.",
    "argument": "L'unique argument que passe la sonde, comme --version. Seuls les indicateurs de version et d'aide sont autorisés, ou aucun.",
    "description": "Ce que fait l'outil, affiché dans le catalogue des capacités. Jusqu'à 1024 caractères."
   }
  }
 },
 "revisions": {
  "columns": {
   "capabilities": "Capacités qu'utilise cette révision, par nom. Les outils intégrés au harness parmi elles limitent ses exécutions aux workers qui signalent l'outil."
  }
 },
 "capabilities": {
  "sourceAgent": "Ouvrir l'agent {{name}}, que cette entrée décrit à partir de sa dernière révision publiée.",
  "sourceMcpServer": "Ouvrir le serveur MCP {{name}} dans l'onglet Serveurs MCP. Sa liste d'outils est la source de cette entrée.",
  "sourceTool": "Le nom de l'outil sur le serveur MCP : {{tool}}.",
  "sourceProfile": "Ouvrir le profil de harness {{name}}, dont la sonde d'outil est la source de cette entrée.",
  "nodeLabel": "Une exécution qui utilise cette capacité ne va qu'à un worker qui signale l'étiquette de nœud {{label}}.",
  "noSource": "Une entrée manuelle qui ne nomme aucun agent ni serveur MCP. Toute exécution autorisée à lire le catalogue la voit.",
  "hintsUnknown": "Trop peu d'exécutions se sont terminées dans la fenêtre des indications pour en tirer quoi que ce soit : aucune valeur n'est donc affichée. Cela ne signifie jamais zéro.",
  "hintsKnown_one": "Calculé à partir de {{count}} exécution terminée au cours des {{days}} derniers jours.",
  "hintsKnown_other": "Calculé à partir de {{count}} exécutions terminées au cours des {{days}} derniers jours.",
  "refreshWarning": "Garrison n'a pas pu actualiser cette entrée depuis sa source : elle conserve donc son dernier contenu valide jusqu'à la prochaine actualisation réussie.",
  "lockedBanner": "Pourquoi cette entrée ne peut être ni modifiée ni supprimée ici, et où la modifier à la place.",
  "lockedShared": "Partagée par tous les locataires : cette entrée provient d'une sonde d'outil d'un profil de harness intégré, elle ne peut donc être ni modifiée ni supprimée. Clonez le profil pour en changer les sondes.",
  "locked": {
   "Agent": "Dérivée de la dernière révision publiée de l'agent, elle ne peut être ni modifiée ni supprimée ici. Publiez une nouvelle révision pour la changer ; désactiver l'agent la supprime.",
   "McpTool": "Dérivée de la liste d'outils du serveur MCP, elle ne peut être ni modifiée ni supprimée ici. Modifiez le serveur ou ses outils, puis actualisez.",
   "HarnessBuiltIn": "Dérivée d'une sonde d'outil d'un profil de harness, elle ne peut être ni modifiée ni supprimée ici. Modifiez plutôt les sondes d'outil du profil."
  },
  "shared": "Tous les locataires voient cette entrée. Elle provient d'une sonde d'outil d'un profil de harness intégré.",
  "hintsTitle": "Durée et coût des exécutions récentes terminées de cet agent. Les outils MCP et les outils intégrés n'ont pas d'indications.",
  "requirementsTitle": "Étiquettes de nœud qu'un worker doit signaler avant de prendre une exécution dont l'agent utilise cette capacité.",
  "fields": {
   "kind": "Agent, outil MCP ou outil intégré au harness.",
   "origin": "Les entrées dérivées suivent leur source ; les entrées manuelles ont été rédigées par des personnes.",
   "source": "L'agent, le serveur MCP et l'outil, ou le profil de harness dont provient cette entrée.",
   "lastRefreshedUtc": "Date à laquelle Garrison a actualisé cette entrée depuis sa source pour la dernière fois. Vide pour les entrées manuelles.",
   "tags": "Libellés pour filtrer le catalogue.",
   "id": "Identifiant de l'entrée du catalogue, qui commence par cap_.",
   "summary": "Ce que fait la capacité et quand l'utiliser, tel que les agents le lisent.",
   "hintStatus": "Connu si assez d'exécutions se sont terminées dans la fenêtre ; Inconnu sinon, et aucune valeur n'est alors affichée.",
   "sampleSize": "Nombre d'exécutions terminées prises en compte par les indications, les plus récentes d'abord.",
   "medianDurationMs": "Temps médian entre le démarrage et la fin des exécutions prises en compte.",
   "p90DurationMs": "Neuf exécutions prises en compte sur dix se sont terminées dans ce délai.",
   "meanCostUsd": "Coût moyen en dollars US des exécutions prises en compte qui ont enregistré un coût.",
   "windowDays": "Nombre de jours sur lesquels portent les indications (paramètre Capabilities.HintWindowDays).",
   "computedUtc": "Date du dernier calcul des indications par la boucle de maintenance ou par une actualisation.",
   "inputSchema": "JSON Schema de ce que la capacité accepte, ou aucun pour du texte libre.",
   "outputSchema": "JSON Schema de ce que la capacité renvoie, ou aucun."
  },
  "refreshServer": "Lister les outils de tous les serveurs MCP actifs, ou d'un seul serveur. Les serveurs stdio sont listés par l'intermédiaire d'un worker.",
  "refreshRun": "Lancer l'actualisation maintenant. Elle peut prendre du temps si des serveurs MCP tardent à répondre.",
  "refresh": {
   "agents": "Entrées d'agent créées, actualisées ou supprimées par cette actualisation.",
   "harnessBuiltIns": "Entrées d'outils intégrés aux harness créées, actualisées ou supprimées, toutes portées confondues.",
   "hints": "Entrées d'agent dont les indications de coût et de latence ont été recalculées.",
   "servers": "Nombre de serveurs MCP que cette actualisation a tenté de lister.",
   "tools": "Entrées d'outil écrites à partir des serveurs qui ont répondu.",
   "removed": "Entrées d'outil supprimées parce que leur serveur ne liste plus l'outil.",
   "failed": "Serveurs dont les outils n'ont pas pu être listés. Leurs entrées conservent leur dernier contenu valide.",
   "failedBadge": "Les outils de ce serveur n'ont pas pu être listés. Ses entrées conservent leur dernier contenu valide, avec un avertissement.",
   "listedBadge": "Le serveur a répondu et ses entrées d'outil sont à jour.",
   "columns": {
    "server": "Le serveur MCP dont les outils ont été listés.",
    "status": "Indique si les outils du serveur ont pu être listés.",
    "tools": "Entrées d'outil écrites pour ce serveur.",
    "removed": "Entrées d'outil supprimées parce que le serveur ne les liste plus.",
    "warned": "Entrées qui ont conservé leur dernier contenu valide et portent désormais un avertissement d'actualisation.",
    "error": "Pourquoi le listage a échoué, le cas échéant."
   }
  },
  "draftSave": "Enregistrer ces capacités dans le brouillon. Publiez ensuite le brouillon pour que les déploiements les utilisent.",
  "notInCatalog": "Aucune entrée du catalogue ne porte ce nom pour le moment. L'exécution démarre quand même, mais l'agent ne trouvera pas cette capacité.",
  "removeName": "Retirer cette capacité de la révision.",
  "chooseName": "Choisir une capacité du catalogue par son nom. Les noms utilisés par plusieurs types n'apparaissent qu'une fois.",
  "addName": "Ajouter la capacité choisie à la révision.",
  "newDraft": "Créer un nouveau brouillon à partir de la dernière révision publiée et choisir les capacités qu'il utilise.",
  "editDraft": "Ajouter ou retirer les capacités qu'utilise cette révision brouillon.",
  "revisionName": "Cette révision utilise la capacité {{name}}. Les agents la trouvent dans le catalogue sous ce nom."
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
   "Running": "Le groupe attend ses membres. Il se termine quand la règle de rassemblement est remplie, que l'échéance passe, que le budget est épuisé ou que quelqu'un l'annule.",
   "Joined": "La règle de rassemblement est remplie, ou tous les membres sont terminés : l'exécution parente peut utiliser leurs résultats.",
   "TimedOut": "L'échéance est passée avant que la règle de rassemblement soit remplie. Les membres encore en cours ont été annulés.",
   "BudgetExceeded": "Le coût ou les jetons des membres ont dépassé le budget du groupe. Les membres encore en cours ont été annulés.",
   "Cancelled": "Quelqu'un a annulé le groupe, ou son exécution parente s'est terminée ou a été annulée. Les membres encore en cours ont été annulés."
  },
  "fanOutJoinPolicy": {
   "All": "Le groupe se rassemble quand chaque membre est terminé, qu'il ait réussi ou non.",
   "Any": "Le groupe se rassemble dès qu'un membre réussit. Les autres sont annulés, sauf si l'appel a demandé de les laisser tourner.",
   "Quorum": "Le groupe se rassemble dès que le nombre indiqué de membres a réussi, ou dès que trop ont échoué pour que ce soit encore possible."
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "Le groupe de fan-out auquel appartient cette exécution. Son exécution parente l'a lancé avec d'autres membres et rassemble leurs résultats.",
   "openFanOutGroup": "Ouvrir l'arbre d'exécutions de l'exécution parente sur ce groupe de fan-out pour voir les autres membres, la règle et le budget."
  }
 },
 "fanOut": {
  "group": "Exécutions enfants que cette exécution a lancées ensemble avec garrison_fan_out, rassemblées sous une règle, un budget et une échéance.",
  "otherChildren": "Exécutions enfants auxquelles cette exécution a délégué une par une, hors de tout groupe de fan-out.",
  "reason": "Pourquoi le groupe s'est terminé, tel que le serveur l'a enregistré.",
  "policy": "Quand le groupe est considéré comme terminé : Tous attend chaque membre, N'importe lequel un succès, Quorum le nombre de succès indiqué.",
  "progress": "Membres terminés, membres réussis et nombre de membres du groupe.",
  "cost": "Coût enregistré par les membres jusqu'ici, rapporté au coût maximal du groupe s'il y en a un.",
  "costValue": "Coût total enregistré de tous les membres. Les membres dont le modèle n'a pas de prix n'ajoutent rien.",
  "tokens": "Jetons d'entrée et de sortie utilisés par les membres jusqu'ici, rapportés au maximum du groupe s'il y en a un.",
  "tokensValue": "Jetons d'entrée plus jetons de sortie de tous les membres réunis.",
  "budgetBar": "{{percent}} % du budget utilisé. Le groupe se termine en Budget dépassé quand l'usage va au-delà.",
  "deadline": "Moment où le délai du groupe expire. Les membres encore en cours à cet instant sont annulés.",
  "started": "Moment où l'exécution parente a lancé ce groupe.",
  "completed": "Moment où le groupe s'est terminé et a cessé d'attendre ses membres.",
  "pending": "Libellés des membres qui ne sont pas encore terminés.",
  "failed": "Libellés des membres qui se sont terminés sans succès.",
  "live": "Les mises à jour arrivent par la connexion en direct dès que l'état d'un membre ou l'usage du groupe change.",
  "polling": "La connexion en direct n'est pas disponible, le groupe est donc rechargé toutes les {{seconds}} secondes.",
  "cancel": "Annuler ce groupe maintenant. Les membres encore en cours sont annulés et l'exécution parente reçoit les résultats rassemblés jusqu'ici.",
  "confirmCancel": "Annuler le groupe et chaque membre encore en cours. Cette action est irréversible.",
  "openMember": "Ouvrir l'exécution du membre {{label}} pour voir sa transcription, son résultat et sa télémétrie.",
  "columns": {
   "label": "Le nom que l'exécution parente a donné à ce membre en lançant le groupe.",
   "agent": "L'agent qu'exécute ce membre, choisi par l'exécution parente.",
   "status": "Où en est l'exécution du membre et comment elle s'est terminée.",
   "costUsd": "Coût enregistré de l'exécution de ce membre.",
   "tokens": "Jetons d'entrée et de sortie utilisés par l'exécution de ce membre.",
   "run": "L'exécution du membre. Ouvrez-la pour la transcription et le résultat."
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
   "apps": "Applications agentiques : groupes d'agents derrière une seule interface de chat pour les utilisateurs finaux, avec leur graphe d'appels, leur délégation, leurs révisions, leur promotion et leur lien."
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "Tout utilisateur actif de ce locataire peut se connecter à l'application avec son e-mail et son mot de passe.",
   "AppUsers": "Seuls les utilisateurs du locataire qui ont le rôle intégré AppUser sur cette application peuvent se connecter. Attribuez-le avec une portée de ressource sur l'application.",
   "Anonymous": "Toute personne disposant du lien peut utiliser l'application sans se connecter, mais seulement si l'utilisation anonyme est aussi activée."
  }
 },
 "form": {
  "pickColor": "Choisissez {{field}} avec un sélecteur de couleur au lieu de saisir la valeur #RRGGBB."
 },
 "resources": {
  "apps": {
   "add": "Créez une application à partir d'agents existants : des membres, un agent d'entrée, les appels entre eux et la façon dont les personnes se connectent.",
   "name": "Nom de l'application dans ce locataire : lettres minuscules, chiffres et traits d'union. Les manifestes et l'API la désignent par ce nom.",
   "slug": "Le nom dans l'URL : l'application se trouve donc à /apps/{slug}/. Unique dans tout le cluster. Vide signifie le nom.",
   "description": "À quoi sert l'application. Les utilisateurs finaux la voient sur la page de connexion de l'application.",
   "active": "Les applications inactives conservent leurs paramètres, mais leur lien et leurs sessions cessent de fonctionner.",
   "url": "L'adresse de l'application pour les utilisateurs finaux. Copiez-la pour la partager, ou ouvrez-la pour voir ce que voient les utilisateurs finaux.",
   "entryAgentId": "Le membre qui parle aux utilisateurs finaux et démarre chaque conversation. Les autres membres sont joints depuis lui.",
   "members": "Les agents de l'application, chacun avec une note de rôle facultative. Un agent qui appartient à une application ne peut pas être supprimé.",
   "membersItems": {
    "agentId": "Un agent de ce locataire à inclure dans l'application. Chaque agent peut être membre une seule fois.",
    "role": "Une courte note sur ce que fait ce membre dans l'application, jusqu'à 256 caractères."
   },
   "edges": "Quel membre peut appeler quel autre. Ensemble, ils forment le graphe de l'application et deviennent la politique de délégation de chaque membre.",
   "edgesItems": {
    "callerAgentId": "Le membre qui effectue l'appel.",
    "calleeAgentId": "Le membre appelé. Il doit être différent de l'appelant.",
    "fanOutAllowed": "Permet à l'appelant de lancer plusieurs exécutions de ce membre à la fois avec garrison_fan_out."
   },
   "graph": "Les membres et les appels sous forme d'image, en lecture seule. L'agent d'entrée est à gauche ; les membres qu'il ne peut pas joindre sont entourés de rouge.",
   "environments": "Pour chaque environnement, le déploiement de l'agent d'entrée que l'application y utilise. La promotion les maintient alignés.",
   "environmentsItems": {
    "environment": "Un environnement de ce locataire, par exemple dev, staging ou prod.",
    "deploymentId": "Un déploiement de l'agent d'entrée dans cet environnement. Seuls ces déploiements sont listés."
   },
   "liveEnvironment": "L'environnement qu'utilise actuellement l'interface de chat de l'application. Changez-le pour faire passer les utilisateurs finaux à un autre environnement.",
   "authMode": "Les utilisateurs du locataire, les utilisateurs ayant le rôle AppUser sur cette application, ou toute personne disposant du lien (avec l'utilisation anonyme activée).",
   "anonymousEnabled": "Active les sessions anonymes. La connexion anonyme ne fonctionne que si cette option est activée et que le mode est Anonyme.",
   "showOperatorDetail": "Montre aux utilisateurs finaux les appels d'outil, le raisonnement et la progression de chaque tour, pas seulement la réponse.",
   "share": "Le lien à donner aux utilisateurs finaux, avec qui peut se connecter selon le paramètre de connexion choisi plus haut.",
   "displayName": "Le nom affiché dans l'en-tête et sur la page de connexion de l'application. Vide signifie le nom de l'application.",
   "logoAssetId": "Une ressource d'agent dont la version actuelle contient l'image du logo. Téléversez-en une dans Configuration, Ressources.",
   "primaryColor": "Couleur principale de l'interface de l'application, au format #RRGGBB. Vide conserve la couleur par défaut.",
   "accentColor": "Deuxième couleur de l'interface de l'application pour les mises en évidence, au format #RRGGBB. Vide conserve la couleur par défaut.",
   "welcomeText": "Texte que les utilisateurs finaux voient avant leur premier message, jusqu'à 4000 caractères.",
   "id": "L'identifiant de l'application. L'API et les manifestes l'acceptent aussi bien que le nom.",
   "lastUpdateUtc": "Date de la dernière modification des paramètres de l'application.",
   "createdUtc": "Date de création de l'application.",
   "membersCell": "Membres de l'application : {{names}}.",
   "activeBadge": "L'application est active : son lien fonctionne pour les personnes que son paramètre de connexion autorise.",
   "inactiveBadge": "L'application est inactive : ses paramètres sont conservés, mais son lien et ses sessions ne fonctionnent pas.",
   "steps": {
    "general": "Le nom, le slug d'URL et la description de l'application, et si elle est active.",
    "members": "Les agents de l'application, l'agent d'entrée et les appels entre eux, avec une image du graphe.",
    "environments": "Le déploiement d'entrée que l'application utilise dans chaque environnement, et l'environnement sur lequel l'application tourne actuellement.",
    "access": "Qui peut se connecter, si les utilisateurs finaux voient les appels d'outil, et le lien à partager.",
    "branding": "Nom affiché, logo, couleurs et texte d'accueil que voient les utilisateurs finaux."
   },
   "actions": {
    "delegation": "Comparez la délégation publiée de chaque membre avec ce que demande le graphe, et écrivez des brouillons qui corrigent l'écart.",
    "revisions": "Listez les révisions de l'application, créez-en une nouvelle, publiez-la et promouvez l'application vers l'environnement suivant."
   }
  }
 },
 "apps": {
  "denied": "Il vous faut l'autorisation {{operation}} sur {{resource}} pour cela. Demandez à un administrateur un rôle qui l'accorde.",
  "graph": "Image en lecture seule de l'application : les membres, les appels entre eux et ceux que l'agent d'entrée peut joindre.",
  "url": "L'adresse de l'application. {{who}}",
  "open": "Ouvre l'application dans un nouvel onglet du navigateur, telle que la voient les utilisateurs finaux. {{who}}",
  "copyUrl": "Copie l'adresse de l'application pour la partager. {{who}}",
  "signIn": {
   "TenantUsers": "Tout utilisateur actif de ce locataire peut se connecter.",
   "AppUsers": "Seuls les utilisateurs qui ont le rôle AppUser sur cette application peuvent se connecter.",
   "Anonymous": "Toute personne disposant du lien peut l'utiliser sans se connecter.",
   "AnonymousDisabled": "Anonyme est choisi mais pas activé : seuls les utilisateurs connectés ayant accès peuvent entrer."
  },
  "delegation": {
   "apply": "Écrit la délégation du graphe dans une révision brouillon de chaque membre en écart. Rien n'est publié, et les brouillons manuels ne sont pas touchés.",
   "applyNothing": "La délégation publiée de chaque membre correspond déjà au graphe : il n'y a rien à écrire.",
   "openAgent": "Ouvrez l'agent {{name}} pour vérifier et publier sa révision brouillon.",
   "drift": "La délégation publiée du membre diffère de ce que demande le graphe. Écrivez des brouillons pour la corriger, puis publiez-les.",
   "inSync": "La délégation publiée du membre correspond au graphe.",
   "draftConflict": "Le brouillon ouvert du membre modifie déjà la délégation autrement, il n'a donc pas été touché. Publiez ou supprimez d'abord ce brouillon.",
   "skipped": "Ce membre a été ignoré : {{reason}}.",
   "draft": "La délégation du graphe se trouve dans la révision brouillon {{number}} de ce membre. Publiez-la pour l'activer.",
   "columns": {
    "member": "L'agent membre. Ouvrez-le pour vérifier ses révisions.",
    "desiredMode": "Le mode de délégation que demande le graphe : Liste d'autorisation quand le membre en appelle d'autres, Aucune délégation quand il n'appelle personne.",
    "desiredAllowList": "Les membres que ce membre appelle dans le graphe.",
    "desiredMaxDepth": "La plus longue chaîne d'appels sous ce membre dans le graphe.",
    "publishedMode": "Le mode de délégation dans la dernière révision publiée du membre.",
    "publishedAllowList": "La liste d'autorisation dans la dernière révision publiée du membre.",
    "publishedMaxDepth": "La profondeur maximale dans la dernière révision publiée du membre.",
    "status": "Si le membre s'écarte du graphe, et le brouillon écrit ou la raison pour laquelle il a été ignoré."
   }
  },
  "revisions": {
   "promote": "Promouvez une révision d'application publiée : tous les membres passent ensemble à l'environnement suivant, ou rien ne bouge.",
   "promoteNothing": "Publiez d'abord une révision d'application. Seules les révisions publiées peuvent être promues.",
   "changeNote": "Une note sur ce qui a changé, conservée avec la révision. Jusqu'à 2000 caractères.",
   "take": "Crée une révision d'application en brouillon qui épingle la dernière révision publiée de chaque membre et copie les appels.",
   "latest": "La dernière révision publiée de l'application, utilisée par les promotions sauf si vous en choisissez une autre.",
   "pin": "Cette révision épingle la révision {{number}} de {{name}}.",
   "publishedBy": "Publiée par {{name}} le {{when}}.",
   "publish": "Publie cette révision d'application en brouillon. Ensuite, elle ne peut plus changer et peut être promue.",
   "publishConfirm": "Publie la révision maintenant. Elle ne pourra plus être modifiée ensuite.",
   "columns": {
    "number": "Le numéro de révision, compté à partir de 1 pour cette application.",
    "state": "Brouillon jusqu'à la publication. Seules les révisions publiées peuvent être promues.",
    "members": "Les révisions de membres que cette révision d'application épingle.",
    "edges": "Le nombre d'appels entre membres que la révision a copiés.",
    "author": "Qui a créé la révision.",
    "changeNote": "La note écrite lors de la création de la révision.",
    "publishedUtc": "Quand la révision a été publiée, et par qui.",
    "actions": "Publier une révision brouillon."
   }
  },
  "promote": {
   "submit": "Promouvoir maintenant. Les déploiements de chaque membre dans l'environnement cible reçoivent les révisions épinglées, ou rien ne change.",
   "revision": "La révision d'application publiée à promouvoir. La plus récente est utilisée sauf si vous en choisissez une autre.",
   "source": "L'environnement d'origine de la promotion, généralement celui sur lequel l'application tourne actuellement.",
   "target": "L'environnement vers lequel promouvoir. Par défaut, celui qui suit la source."
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
   "studio": "L'atelier d'agents : des brouillons d'agents et d'applications que vous concevez avec l'architecte d'agents, essayez dans le bac à sable et faites appliquer par une personne."
  }
 },
 "enums": {
  "approvalKind": {
   "DraftApply": "Une demande d'application d'un brouillon d'atelier à la configuration active. L'autoriser applique tous les documents du brouillon en une seule application de manifeste."
  },
  "studioDraftStatus": {
   "Open": "Vous et l'architecte d'agents pouvez modifier le brouillon, le valider, l'essayer dans le bac à sable et l'envoyer pour approbation.",
   "PendingApproval": "Le brouillon attend une décision sur son approbation d'application et reste figé jusque-là. Un refus le rouvre.",
   "Applied": "Le brouillon a été appliqué à la configuration active en une seule application de manifeste. Il ne peut plus changer.",
   "Discarded": "Le brouillon a été abandonné. Il ne peut plus changer, et une approbation d'application en attente a été annulée."
  },
  "studioDraftOperation": {
   "Upsert": "L'application du brouillon crée la ressource, ou la met à jour si elle existe déjà.",
   "Delete": "L'application du brouillon supprime la ressource. Seuls les agents, déploiements, pipelines et applications peuvent être supprimés ainsi."
  },
  "studioDiffChange": {
   "Create": "La ressource n'existe pas encore, l'application du brouillon la crée donc.",
   "Update": "La ressource existe et diffère, l'application du brouillon met donc à jour les champs listés.",
   "Delete": "Le brouillon supprime cette ressource lorsqu'il est appliqué.",
   "Unchanged": "Le document correspond à la configuration active, son application ne change donc rien.",
   "Failed": "Le document n'est pas valide. Les détails indiquent pourquoi ; corrigez-le avant de demander l'application."
  }
 },
 "views": {
  "studio": {
   "newDraft": "Commencer un brouillon, vide ou à partir d'une application existante, et ouvrir son espace de travail.",
   "refresh": "Relire la liste des brouillons depuis le serveur.",
   "search": "Trouver les brouillons dont le titre contient ce texte. La recherche est faite par le serveur.",
   "scope": "Afficher uniquement vos brouillons, ou tous les brouillons du locataire que vous pouvez lire.",
   "scopes": {
    "mine": "Afficher uniquement les brouillons que vous avez commencés, ou qu'un architecte a commencés pour vous.",
    "all": "Afficher tous les brouillons du locataire que vous pouvez lire, quelle que soit la personne qui les a commencés."
   },
   "statusChip": "Afficher les brouillons au statut {{status}}. Sans statut choisi, tous les statuts s'affichent.",
   "columns": {
    "title": "Le titre du brouillon. Ouvrez-le pour voir son espace de travail avec l'architecte, les éléments, le graphe et l'application.",
    "status": "Les brouillons ouverts peuvent changer ; ceux en attente attendent une décision ; ceux appliqués ou abandonnés sont définitifs.",
    "owner": "La personne qui a commencé le brouillon. Un architecte ne travaille que sur les brouillons de la personne qui lui parle.",
    "targetApp": "L'application que conçoit le brouillon. Les opérations de graphe et le bac à sable l'utilisent par défaut.",
    "items": "Le nombre de documents de manifeste du brouillon, un par ressource.",
    "version": "Augmente de un à chaque changement du brouillon. Chaque modification indique la version qu'elle a lue.",
    "updated": "La date du dernier changement du brouillon."
   },
   "openDraft": "Ouvrir l'espace de travail du brouillon : discussion avec l'architecte, éléments, graphe, comparaison et application, bac à sable et aperçu.",
   "discard": "Abandonner le brouillon après confirmation. Il ne pourra plus changer ni être appliqué.",
   "discardPending": "Abandonner le brouillon après confirmation. Son approbation d'application en attente est annulée."
  },
  "studioDraft": {
   "version": "Chaque changement augmente la version. Les modifications envoient la version lue, pour que personne n'écrase le changement d'un autre.",
   "live": "Connecté au canal en direct du brouillon : les changements des autres et de l'architecte apparaissent immédiatement.",
   "polling": "Le canal en direct n'est pas disponible, la page relit donc le brouillon toutes les quelques secondes.",
   "back": "Revenir à la liste des brouillons d'atelier.",
   "viewJson": "Afficher le brouillon tel que le serveur l'a renvoyé, avec chaque élément et la disposition du canevas.",
   "architect": "Le déploiement d'architecte avec lequel cet espace de travail dialogue. Choisissez-le dans l'onglet Architecte.",
   "dismissNotice": "Masquer cet avis sur le dernier changement du brouillon.",
   "tabs": {
    "architect": "Dialoguer avec l'architecte d'agents, qui modifie ce brouillon pour vous.",
    "items": "Les documents de manifeste du brouillon, avec un éditeur pour chacun.",
    "graph": "Une vue en lecture seule des applications, appels, profondeurs de délégation et capacités du brouillon.",
    "apply": "Comparer le brouillon avec la configuration active, le valider et demander son application.",
    "playground": "Exécuter les agents du brouillon sur plusieurs tours avant toute publication.",
    "preview": "Compiler un déploiement pour voir sa ligne de commande, ses assets placés et le montage de l'espace de fichiers.",
    "prompts": "Choisir et modifier le prompt avec lequel travaille l'architecte d'agents."
   }
  }
 },
 "studio": {
  "notOpen": "Ce brouillon est {{status}}, et seul un brouillon ouvert peut changer.",
  "newDraft": {
   "titleField": "Un nom court pour le brouillon, affiché dans la liste et à l'architecte. Vide, un titre par défaut est utilisé.",
   "fromApp": "Partir d'une application existante avec tout ce qu'elle référence, ou d'un brouillon vide.",
   "create": "Créer le brouillon et ouvrir son espace de travail. La configuration active ne change pas."
  },
  "architect": {
   "name": "Nom du nouveau déploiement d'architecte dans ce locataire, par exemple architect.",
   "harnessProfileId": "Le harness sur lequel l'architecte s'exécute, par exemple Claude Code. Il lui faut un worker capable de l'exécuter.",
   "model": "Le modèle que le harness utilise pour l'architecte. Vide, le modèle par défaut du profil de harness est utilisé.",
   "promptId": "Le prompt System avec lequel l'architecte travaille. Les prompts intégrés viennent en premier, leurs clones ensuite.",
   "preview": "Le prompt choisi rendu avec des valeurs d'exemple, tel que l'architecte le recevrait.",
   "cloneLink": "Ouvrir ce prompt dans l'écran Modèles de prompt, où vous pouvez le cloner et modifier le clone.",
   "create": "Créer le déploiement de agent-architect avec accès aux brouillons et le prompt choisi.",
   "noAgent": "Aucun architecte ne peut être créé, car ce locataire n'a pas d'agent agent-architect."
  },
  "chat": {
   "title": "Une conversation avec l'architecte d'agents à propos de ce brouillon. Il modifie le brouillon ; vous approuvez son application.",
   "architect": "Le déploiement d'architecte avec lequel dialoguer. En choisir un autre démarre une nouvelle conversation.",
   "newArchitect": "Créer un déploiement d'architecte : profil de harness, modèle et prompt d'architecte.",
   "openConversation": "Ouvrir cette conversation sur sa propre page, chaque tour étant une exécution.",
   "newConversation": "Oublier cette conversation dans ce navigateur et en commencer une nouvelle au prochain message.",
   "you": "Ce que vous avez envoyé à l'architecte lors de ce tour.",
   "architectSays": "La réponse de l'architecte à ce tour. Les changements qu'il a faits au brouillon apparaissent dans les autres onglets.",
   "openRun": "Ouvrir l'exécution de ce tour, avec sa transcription et les outils appelés.",
   "message": "Ce que l'architecte doit concevoir ou changer. L'ID du brouillon accompagne le premier message.",
   "send": "Envoyer le message à l'architecte. La réponse apparaît ici à la fin du tour.",
   "sendBusy": "L'architecte travaille encore sur le dernier message. Attendez qu'il ait terminé.",
   "sendNoArchitect": "Choisissez ou créez un déploiement d'architecte avant d'envoyer un message."
  },
  "items": {
   "title": "Les documents de manifeste du brouillon, un par ressource, identifiés par type et nom.",
   "add": "Ajouter un nouveau document au brouillon. Il est enregistré lorsque vous l'enregistrez dans l'éditeur.",
   "addConfirm": "Ouvrir l'éditeur avec un document de départ de ce type et de ce nom.",
   "kind": "Le type de manifeste du document, par exemple Agent ou Deployment.",
   "name": "Le nom de la ressource, qui doit correspondre au nom dans le document.",
   "operation": "Créer ou mettre à jour la ressource lors de l'application, ou la supprimer.",
   "stale": "Indique si la configuration active a changé après la création du brouillon à partir de ce document.",
   "updated": "La date du dernier changement de cet élément dans le brouillon.",
   "staleBadge": "La configuration active a changé après que le brouillon est parti de ce document. Mettez-le à jour avant d'appliquer.",
   "editItem": "Ouvrir ce document dans l'éditeur pour le modifier et l'enregistrer.",
   "viewItem": "Ouvrir ce document dans l'éditeur pour le lire. Le brouillon ne peut pas changer pour le moment.",
   "remove": "Retirer ce document du brouillon après confirmation. La configuration active ne change pas.",
   "editor": "Le document en YAML de manifeste. L'enregistrement envoie la version que vous avez lue.",
   "document": "YAML de manifeste brut. Son type et son nom doivent correspondre à ceux de l'élément.",
   "save": "Enregistrer le document dans le brouillon à la version que vous avez lue.",
   "closeEditor": "Fermer l'éditeur. Le texte non enregistré est perdu.",
   "dismissConflict": "Masquer cet avis sur le changement qui a refusé votre enregistrement."
  },
  "graph": {
   "title": "Vue en lecture seule des applications du brouillon : membres, appels, profondeur de délégation et capacités.",
   "app": "Une application que le brouillon contient ou référence, dessinée à partir de son agent d'entrée.",
   "deletedApp": "L'application du brouillon supprime cette application.",
   "draftedApp": "Le brouillon contient le document de cette application, son graphe montre donc la version du brouillon.",
   "deletedAgent": "L'application du brouillon supprime cet agent.",
   "loose": "Agents du brouillon qui n'appartiennent à aucune de ses applications.",
   "legend": "Comment lire le graphe : libellés, styles de ligne et capacités sous chaque agent."
  },
  "diff": {
   "title": "Chaque document comparé à la configuration active, la validation et la demande d'application du brouillon.",
   "refresh": "Comparer à nouveau chaque document avec la configuration active.",
   "validate": "Lancer une simulation de manifeste du brouillon. Rien ne change ; les résultats s'affichent par élément.",
   "requestApply": "Valider le brouillon et créer une approbation pour l'appliquer. Le brouillon reste figé jusqu'à la décision.",
   "columns": {
    "item": "Le type et le nom du document.",
    "change": "Ce que l'application du brouillon ferait à cette ressource.",
    "details": "Les champs qui changent, ou la raison pour laquelle le document n'est pas valide."
   },
   "approval": "L'approbation qui décide si ce brouillon est appliqué.",
   "openApproval": "Ouvrir l'approbation avec son résumé complet et sa comparaison.",
   "reason": "Pourquoi vous autorisez ou refusez le brouillon. Le motif est enregistré avec la décision.",
   "allow": "Autoriser l'approbation : le brouillon est validé à nouveau et appliqué en une seule application de manifeste.",
   "deny": "Refuser l'approbation : rien n'est appliqué, et le brouillon est de nouveau ouvert."
  },
  "playground": {
   "title": "Essayer les agents du brouillon sur plusieurs tours avant toute publication.",
   "agent": "L'agent à exécuter. Par défaut, c'est l'agent d'entrée de l'application cible du brouillon.",
   "input": "Ce que l'agent doit faire lors de ce tour.",
   "send": "Enregistrer le document de l'agent comme sa révision de brouillon et l'exécuter dans le bac à sable.",
   "sendBusy": "Le dernier tour est toujours en cours. Attendez qu'il se termine.",
   "openRun": "Ouvrir l'exécution, avec son arbre d'exécution, ses groupes de répartition et les fichiers de la conversation.",
   "conversation": "Ouvrir la conversation du bac à sable, chaque tour étant une exécution.",
   "export": "Télécharger les tours du bac à sable sous forme de fichier Markdown.",
   "reset": "Commencer une nouvelle conversation dans le bac à sable au prochain tour."
  },
  "preview": {
   "title": "Compiler un déploiement avec une entrée d'exemple avant de déployer. Les valeurs secrètes sont masquées.",
   "deploymentId": "Le déploiement à compiler pour l'aperçu.",
   "agentRevisionId": "Une révision d'agent à compiler à la place de celle du déploiement, par exemple une révision de brouillon.",
   "environment": "Compiler le déploiement de l'agent dans cet environnement plutôt que dans celui choisi.",
   "input": "L'entrée d'exemple avec laquelle le prompt compilé est rendu.",
   "compile": "Compiler le déploiement et afficher la ligne de commande, les assets et l'espace de fichiers.",
   "compileNoDeployment": "Choisissez d'abord un déploiement à compiler.",
   "commandLine": "La commande que le worker lancerait, avec les guillemets du shell pour l'affichage.",
   "assets": "Où les assets de la révision seraient écrits avant le démarrage du harness.",
   "columns": {
    "path": "L'emplacement du fichier, relatif aux répertoires de l'exécution.",
    "asset": "L'asset de l'agent dont provient le fichier.",
    "kind": "L'usage de l'asset, par exemple une compétence ou un fichier de référence.",
    "version": "La version de l'asset que la révision épingle.",
    "size": "La taille du fichier placé sur le disque."
   },
   "fileSpace": "L'espace de fichiers partagé de la conversation et l'endroit où l'exécution le verrait."
  },
  "prompts": {
   "title": "Les prompts avec lesquels l'architecte d'agents peut travailler, et celui qu'utilise chaque architecte.",
   "templatesLink": "Ouvrir l'écran Modèles de prompt filtré sur les prompts d'architecte.",
   "columns": {
    "name": "Le nom du modèle de prompt. Les intégrés commencent par builtin/.",
    "description": "Une courte note sur ce que le prompt fait faire différemment à l'architecte.",
    "version": "La version actuelle du prompt. Chaque enregistrement l'augmente de un.",
    "usedBy": "Le nombre de déploiements d'architecte qui utilisent ce prompt. Survolez pour voir leurs noms."
   },
   "defaultBadge": "Les nouveaux déploiements d'architecte utilisent ce prompt sauf si un autre est choisi.",
   "selectedBadge": "Le prompt que {{architect}} utilise actuellement.",
   "select": "En faire le prompt de l'architecte actuel. Il prend effet au prochain tour de l'architecte.",
   "alreadySelected": "L'architecte actuel utilise déjà ce prompt.",
   "selectNoArchitect": "Choisissez d'abord un architecte dans l'onglet Architecte ; la sélection s'applique à ce déploiement.",
   "clone": "Copier ce prompt dans un nouveau modèle que vous pouvez modifier.",
   "edit": "Modifier le nom, la description et le corps. Chaque enregistrement crée une nouvelle version.",
   "delete": "Supprimer ce prompt après confirmation. Un prompt utilisé par un déploiement ne peut pas être supprimé.",
   "builtInLocked": "Les prompts intégrés ne peuvent être ni modifiés ni supprimés. Clonez ce prompt et modifiez le clone.",
   "editor": "Modifier le prompt et le prévisualiser. Les architectes qui suivent sa version actuelle utilisent un enregistrement dès leur prochain tour.",
   "closeEditor": "Fermer l'éditeur. Le texte non enregistré est perdu.",
   "name": "Le nom du modèle dans ce locataire. Il doit rester unique.",
   "description": "Une courte note sur ce que ce prompt fait faire à l'architecte.",
   "body": "Le texte du prompt, avec des variables de modèle et des inclusions de fragments comme builtin/agent-architect-design.",
   "preview": "Le corps rendu avec des valeurs d'exemple, tel que l'architecte le recevrait.",
   "save": "Enregistrer la modification comme nouvelle version du prompt."
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
    "graph": "Modifiez l'application du brouillon sur un canevas : agents, appels, agent d'entrée, propriétés et exécution par environnement."
   }
  }
 },
 "studio": {
  "graph": {
   "title": "L'application du brouillon sous forme de canevas modifiable, avec ses agents, ses appels et sa profondeur de délégation."
  },
  "canvas": {
   "title": "L'application du brouillon sous forme de graphe modifiable. Chaque modification est enregistrée aussitôt dans le brouillon ; rien ne devient actif tant que le brouillon n'est pas appliqué.",
   "appPicker": "L'application affichée par le canevas, quand le brouillon en contient plusieurs.",
   "node": "Un agent de l'application. Faites-le glisser pour le déplacer, faites glisser depuis son bord droit pour le connecter, ou donnez-lui le focus et utilisez les raccourcis clavier.",
   "nodeReadOnly": "Un agent de l'application. Le brouillon ne peut pas changer pour le moment, le canevas est donc en lecture seule.",
   "addAgent": "Saisissez le nom d'un agent ou choisissez-en un parmi les agents du locataire et ceux du brouillon, puis appuyez sur Entrée.",
   "role": "Une note facultative sur ce que fait cet agent dans l'application, conservée avec son appartenance.",
   "add": "Faire de l'agent un membre de {{app}}. Le premier membre devient l'agent d'entrée.",
   "connect": "Commencer un appel depuis {{name}}, puis choisir l'agent qu'il appelle.",
   "needAgent": "Sélectionnez d'abord un agent sur le canevas.",
   "needCall": "Sélectionnez d'abord un appel : cliquez dessus sur le canevas ou choisissez-le dans la liste des appels.",
   "alreadyEntry": "{{name}} est déjà l'agent d'entrée.",
   "setEntry": "Faire de l'agent sélectionné celui qui parle aux personnes qui utilisent l'application.",
   "remove": "Retirer de l'application l'agent sélectionné et ses appels, après confirmation.",
   "disconnect": "Supprimer l'appel sélectionné. Les deux agents restent dans l'application.",
   "fit": "Zoomer et déplacer la vue pour que chaque agent de l'application soit visible.",
   "connectTo": "L'agent que l'appelant peut appeler.",
   "fanOut": "Activé : l'appelant peut lancer plusieurs appels à cet agent en même temps (fan-out). Désactivé : un appel à la fois.",
   "connectConfirm": "Permettre à {{from}} d'appeler {{to}} et enregistrer l'appel dans le brouillon.",
   "connectNoTarget": "Il n'y a pas encore d'autre agent à appeler dans l'application.",
   "connectCancel": "Arrêter la connexion sans ajouter d'appel.",
   "keys": "Afficher les touches qui fonctionnent sur le canevas.",
   "calls": "Chaque appel de l'application, décrit en toutes lettres. Ces boutons permettent de sélectionner et de modifier les appels au clavier.",
   "call": "Sélectionner cet appel. Suppr le déconnecte, F active ou désactive les appels en parallèle.",
   "callReadOnly": "Sélectionner cet appel pour voir ses propriétés. Le brouillon ne peut pas changer pour le moment.",
   "addLoose": "Faire de {{name}} un membre de {{app}}, pour pouvoir le connecter.",
   "retry": "Renvoyer la modification refusée, sur la version du brouillon qui vient d'être lue.",
   "dismissError": "Masquer ce message sur la modification refusée.",
   "panel": {
    "properties": "Le document propre de l'agent : description, schémas, assets et capacités.",
    "runtime": "Les déploiements de l'agent dans chaque environnement : modèle, limites, prompt et approbations.",
    "save": "Écrire ces champs dans l'élément du brouillon, à la version que vous avez lue. Rien ne devient actif.",
    "reset": "Revenir aux valeurs que le brouillon contient maintenant.",
    "nothingToSave": "Rien n'a encore changé, il n'y a donc rien à enregistrer.",
    "nothingToReset": "Rien n'a encore changé, il n'y a donc rien à annuler."
   },
   "agent": {
    "title": "Champs du document de l'agent dans ce brouillon. L'enregistrement réécrit son élément Agent.",
    "bring": "Copier le document actif de l'agent (ou un nouveau) dans le brouillon pour pouvoir le modifier.",
    "description": "Ce que fait l'agent, montré aux personnes et aux agents qui l'appellent.",
    "inputSchema": "Un JSON Schema auquel l'entrée de l'agent doit correspondre. Vide : entrée en texte brut.",
    "outputSchema": "Un JSON Schema que suit la sortie structurée de l'agent. Vide : pas de sortie structurée.",
    "assets": "Les assets d'agent (skills, références, modèles) que la prochaine révision épingle, par nom et version facultative.",
    "assetName": "Le nom de l'asset d'agent dans ce locataire.",
    "assetVersion": "Une version à épingler. Vide : suit la dernière version de l'asset.",
    "removeAsset": "Retirer cet épinglage de la prochaine révision de l'agent lors de l'enregistrement.",
    "addAsset": "Épingler un autre asset d'agent à la prochaine révision de l'agent.",
    "capabilities": "Les capacités que l'agent utilise, comme les outils d'hôte qu'un worker doit avoir (pandoc, git).",
    "systemPrompt": "Le prompt système se définit par déploiement, chaque environnement peut donc utiliser le sien.",
    "showRuntime": "Ouvrir les déploiements de l'agent, où se modifient le prompt système et sa version."
   },
   "edge": {
    "title": "L'appel sélectionné : qui appelle qui, le fan-out et la profondeur de délégation nécessaire.",
    "from": "L'agent qui fait cet appel.",
    "to": "L'agent que cet appel atteint.",
    "depth": "Le nombre de niveaux de délégation dont l'appelant a besoin pour cet appel, calculé à partir du graphe."
   },
   "app": {
    "title": "Champs du document de l'application dans ce brouillon. L'enregistrement réécrit son élément AgenticApp.",
    "entry": "Le membre qui parle aux personnes qui utilisent l'application. Un changement est enregistré aussitôt.",
    "bring": "Copier le document actif de l'application dans le brouillon pour pouvoir modifier sa connexion et son apparence.",
    "description": "À quoi sert l'application, affiché dans la liste des applications de la console.",
    "authMode": "Qui peut se connecter à l'application : les utilisateurs du locataire, les utilisateurs de l'application, ou tout le monde (anonyme).",
    "anonymous": "Permettre d'utiliser l'application sans se connecter, quand le mode de connexion le permet.",
    "branding": "L'apparence de la page de discussion de l'application pour les personnes qui l'utilisent.",
    "brandingFields": {
     "displayName": "Le nom dans l'en-tête de l'application. Vide : le nom de l'application est utilisé.",
     "logo": "Un asset d'agent dont la première image devient le logo de l'application.",
     "primaryColor": "La couleur principale de la page de l'application, en valeur hexadécimale.",
     "accentColor": "La deuxième couleur de la page de l'application, en valeur hexadécimale.",
     "welcomeText": "La première chose que lisent les personnes en ouvrant l'application."
    }
   },
   "runtime": {
    "title": "Les déploiements de l'agent dans ce brouillon, un environnement à la fois.",
    "deployment": "Choisissez le déploiement de l'environnement à modifier. L'enregistrement ne change que l'élément de ce déploiement.",
    "live": "Les déploiements de cet agent qui tournent maintenant mais ne sont pas dans le brouillon. Importez-en un pour le modifier.",
    "bring": "Copier le document actif de {{name}} dans le brouillon comme nouvel élément.",
    "approvals": "Si les appels d'outil des exécutions de ce déploiement attendent une personne, et les règles qui décident d'abord.",
    "fields": {
     "model": "Le modèle utilisé par le harness, par exemple sonnet. Vide : le modèle par défaut du profil de harness.",
     "effort": "L'effort de raisonnement que le harness transmet, par exemple high. Vide : le harness décide.",
     "timeoutSeconds": "Combien de temps une exécution peut durer avant d'être arrêtée, en secondes.",
     "maxTurns": "Combien de tours de modèle une exécution peut faire avant de s'arrêter.",
     "maxBudgetUsd": "Combien une exécution peut coûter en dollars américains avant que le harness l'arrête.",
     "systemTemplate": "Le modèle de prompt utilisé comme prompt système, par son nom. Vide : le prompt par défaut intégré.",
     "systemVersion": "Une version de ce modèle à épingler. Vide : suit sa dernière version.",
     "approvalsEnabled": "Activé : les appels d'outil qu'aucune règle n'autorise attendent une personne dans Approbations.",
     "approvalDefaultAction": "Ce qui arrive à un appel d'outil qu'aucune règle ne couvre : l'autoriser, le refuser ou demander à une personne."
    },
    "rule": {
     "action": "Ce que fait cette règle d'un appel d'outil correspondant.",
     "pattern": "Les appels d'outil auxquels la règle correspond, par exemple Bash(git *).",
     "inputPattern": "Un motif facultatif auquel l'entrée de l'appel d'outil doit aussi correspondre.",
     "remove": "Supprimer cette règle lors de l'enregistrement.",
     "add": "Ajouter une règle ; les règles sont vérifiées dans l'ordre et la première qui correspond décide."
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
  "brand": "Garrison Agent Studio : créez, déployez et exécutez des applications agentiques avec les harnesses d'agents que vous utilisez déjà.",
  "tabs": {
   "serverInfo": "À propos de Garrison Agent Studio : les versions du serveur et du tableau de bord, des liens vers la documentation et le site web, les adresses REST, MCP et A2A, et l'identité avec laquelle vous êtes connecté."
  }
 },
 "common": {
  "openStudio": "Ouvrir l'Atelier d'agents, où l'architecte d'agents rédige avec vous des agents et des applications. Rien n'entre en service avant qu'une personne approuve le brouillon."
 },
 "wizard": {
  "start": "Commencer la configuration : ajouter un identifiant, préparer l'architecte d'agents, appliquer un agent d'exemple et le tester.",
  "skipStudio": "Continuer sans architecte. Vous pourrez en créer un plus tard dans l'Atelier d'agents avec Nouvel architecte.",
  "createArchitect": "Créer un déploiement de agent-architect avec ces choix et passer à l'étape suivante. Ses exécutions ne peuvent modifier que vos brouillons de l'atelier.",
  "continue": "L'architecte existe déjà. Passer à l'étape suivante de la configuration."
 },
 "views": {
  "home": {
   "openStudio": "Ouvrir l'Atelier d'agents et décrire l'application voulue ; l'architecte d'agents la rédige, et une personne l'approuve avant sa mise en service."
  },
  "studioDraft": {
   "tabs": {
    "release": "Les applications de ce brouillon, une fois appliqué : leurs déploiements par environnement, la promotion de dev vers staging et prod, et l'annulation depuis l'historique."
   }
  },
  "serverInfo": {
   "product": "Le produit auquel appartient cette console : l'Atelier d'agents crée des applications agentiques au-dessus du moteur d'exécution Garrison.",
   "docs": "Ouvrir la documentation de Garrison dans un nouvel onglet : architecture, configuration, harnesses, l'atelier, les applications et la sécurité.",
   "studioDocs": "Ouvrir le guide de l'Atelier d'agents dans un nouvel onglet : brouillons, l'architecte d'agents, l'application d'un brouillon et la promotion.",
   "website": "Ouvrir usegarrison.ai dans un nouvel onglet : présentation du produit, captures d'écran et démonstrations.",
   "source": "Ouvrir le dépôt Garrison sur GitHub dans un nouvel onglet : code source, tickets et versions."
  }
 },
 "resources": {
  "apps": {
   "actions": {
    "environments": "Voir les déploiements de l'application par environnement avec leurs révisions épinglées et leurs remplacements, la promouvoir vers l'environnement suivant et annuler une promotion."
   }
  }
 },
 "apps": {
  "release": {
   "live": "L'environnement dont l'URL de l'application utilise le déploiement d'entrée : {{environment}}. Changez-le à l'étape Environnements de l'application.",
   "environments": "Les déploiements de chaque membre dans chaque environnement : la révision que chacun épingle (Dernière quand il suit la dernière révision publiée) et ses remplacements d'environnement.",
   "source": "L'environnement de départ de la comparaison, en général celui où vous avez testé. La promotion part aussi de là.",
   "target": "L'environnement comparé et cible de la promotion. Laissez l'environnement suivant pour respecter l'ordre de promotion.",
   "promote": "Ouvrir la boîte de dialogue de promotion de {{source}} vers {{target}} : la révision épinglée de chaque membre passe à ses déploiements dans {{target}} en une seule transaction.",
   "noNext": "Il n'y a aucun environnement après {{source}}, donc rien vers quoi promouvoir.",
   "denied": "Il vous faut l'autorisation Exécuter sur la promotion pour {{environment}}. Demandez le rôle Releaser à un administrateur.",
   "noDeployment": "Ce membre n'a aucun déploiement dans {{environment}}. Une promotion vers {{environment}} échoue tant qu'il n'en a pas.",
   "overrides": "Remplacements d'environnement de ce déploiement : variables définies pour ses exécutions. Les valeurs secrètes ne sont jamais affichées.",
   "entry": "L'agent d'entrée : les personnes qui utilisent l'application parlent d'abord à ce membre.",
   "history": "Chaque promotion et chaque annulation de cette application, de la plus récente à la plus ancienne. Une promotion appliquée peut être annulée une fois, ce qui rétablit les épinglages qu'elle a remplacés.",
   "refresh": "Relire les déploiements et l'historique des promotions de cette application.",
   "columns": {
    "member": "Les agents membres de l'application, l'agent d'entrée en premier.",
    "environment": "Déploiements de chaque membre dans {{environment}}, avec leur révision épinglée et leurs remplacements d'environnement.",
    "difference": "Si les épinglages et les remplacements de chaque membre concordent entre les deux environnements comparés."
   },
   "diff": {
    "Same": "Les révisions épinglées et les remplacements de {{source}} et {{target}} concordent.",
    "Differs": "Les révisions épinglées ou les remplacements diffèrent entre {{source}} et {{target}}. La promotion déplace les épinglages ; chaque déploiement garde ses propres remplacements.",
    "Missing": "Ce membre n'a aucun déploiement dans {{target}}. Une promotion depuis {{source}} échouerait sans rien déplacer."
   }
  }
 },
 "studio": {
  "release": {
   "title": "Les applications de ce brouillon, lues dans la configuration active : déploiements par environnement, promotion et annulation.",
   "app": "Choisir l'application du brouillon à afficher quand le brouillon en crée plusieurs."
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
   "architects": "Les architectes d'agents réutilisables dans n'importe quel brouillon du studio : créez-les, modifiez-les et supprimez-les, et choisissez le profil de harness, le modèle et le prompt de chacun."
  }
 },
 "resources": {
  "architects": {
   "add": "Créer un architecte d'agents : un déploiement de agent-architect qui ne modifie que vos brouillons du studio et ne les applique jamais.",
   "harnessProfileId": "Le profil de harness sur lequel l'architecte s'exécute, qui détermine la CLI d'agent qu'il utilise (Claude Code, Codex, etc.).",
   "model": "Le modèle que l'architecte demande au harness. Vide utilise le modèle par défaut du profil de harness.",
   "architectPromptTemplateId": "Le modèle System qui indique à l'architecte comment travailler. Les prompts intégrés viennent en premier ; clonez-en un pour le modifier.",
   "architectPromptVersion": "Épingler l'architecte à une version de son prompt. Vide suit la version actuelle, donc une modification enregistrée s'applique à son prochain tour.",
   "defaultModel": "Aucun modèle n'est défini : l'architecte utilise le modèle par défaut du profil de harness.",
   "defaultBadge": "Cet architecte utilise le prompt intégré par défaut, builtin/agent-architect.",
   "activeBadge": "Actif : les brouillons peuvent ouvrir de nouvelles conversations avec cet architecte.",
   "inactiveBadge": "Inactif : l'architecte n'accepte plus de nouveaux tours et les brouillons ne le proposent plus tant que vous ne le réactivez pas.",
   "actions": {
    "prompts": "Gérer les prompts d'architecte : choisir celui qu'utilise cet architecte, et cloner, modifier, réinitialiser ou supprimer des prompts.",
    "deployment": "Ouvrir le déploiement derrière cet architecte pour changer ses limites, son exécuteur, ses règles de sortie et ses autres paramètres."
   }
  }
 },
 "studio": {
  "chat": {
   "manageArchitects": "Ouvrir Agents > Architectes pour créer, modifier ou supprimer les architectes que tout brouillon peut utiliser."
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
  "typeToConfirm": "Saisissez {{word}} tel quel pour activer le bouton Supprimer. Un clic malencontreux ne peut ainsi rien effacer d'irrécupérable.",
  "typeFirst": "Saisissez d'abord {{word}} dans le champ. Le bouton reste inactif tant que le mot ne correspond pas."
 },
 "resources": {
  "agents": {
   "protected": "{{name}} est un agent intégré protégé que Garrison crée dans chaque locataire : il ne peut être ni modifié ni supprimé."
  }
 },
 "views": {
  "agentDetail": {
   "delete": "Supprimer cet agent avec ses déploiements et son historique de révisions. Vous confirmez en saisissant delete ; un déclencheur, un pipeline, une application ou un point de terminaison de notification qui l'utilise empêche la suppression."
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
   "credentialSecretId": "Le secret avec lequel le harness de l'architecte se connecte : une clé d'API Anthropic ou un jeton OAuth Claude Code pour Claude Code, une clé d'API OpenAI ou une connexion ChatGPT pour Codex, etc. Garrison le lie au déploiement de l'architecte."
  },
  "chat": {
   "fixCredential": "Ouvrir Agents > Architectes filtré sur cet architecte, puis le modifier et choisir son secret d'identifiants.",
   "openSecrets": "Ouvrir Configuration > Secrets pour ajouter la clé d'API ou le jeton, ou vérifier la valeur de celui qu'utilise l'architecte."
  }
 },
 "resources": {
  "architects": {
   "credentialSecretId": "Le secret avec lequel le harness de l'architecte se connecte : une clé d'API Anthropic ou un jeton OAuth Claude Code pour Claude Code, une clé d'API OpenAI ou une connexion ChatGPT pour Codex, etc. Garrison le lie au déploiement de l'architecte.",
   "credentialCell": "Le secret avec lequel le harness de cet architecte se connecte ({{kind}}).",
   "noCredential": "Aucun secret d'identifiants n'est lié : les harness qui en ont besoin (Claude Code, Codex, Gemini CLI) échouent avec Not logged in. Modifiez l'architecte pour en choisir un."
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
  "refresh": "Relire cette liste, par exemple après avoir ajouté un enregistrement sur une autre page.",
  "open": "Ouvre {{page}} dans un nouvel onglet, pour que ce formulaire garde ce que vous avez saisi. Revenez ici ensuite ; la liste s'actualise."
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
  "title": "Les étapes pour créer ou trouver ce type d'identifiants chez le fournisseur, et comment Garrison les transmet au harness.",
  "link": "Ouvre {{url}} dans un nouvel onglet."
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
})(tips, {
 "studio": {
  "chat": {
   "wait": "L'architecte prépare sa réponse. Les premiers mots apparaissent ici dès que le modèle les écrit.",
   "waitElapsed": "Depuis combien de temps vous attendez ce tour.",
   "metrics": {
    "model": "Le modèle qui a répondu à ce tour, tel que le harness l'a indiqué."
   },
   "tool": {
    "running": "{{name}} est en cours : l'architecte a appelé cet outil en écrivant sa réponse.",
    "ok": "{{name}} est terminé : l'architecte a appelé cet outil en écrivant sa réponse.",
    "failed": "{{name}} a échoué : l'architecte a appelé cet outil et il a renvoyé une erreur. Ouvrez l'exécution pour les détails."
   },
   "copyMessage": "Copier votre message dans le presse-papiers.",
   "copyAnswer": "Copier la réponse de l'architecte dans le presse-papiers au format Markdown.",
   "thinkingSummary": "Ce que le modèle a pensé avant de répondre, tel que le harness l'a indiqué."
  }
 },
 "copy": {
  "failed": "Le navigateur n'a pas autorisé la copie ici. Sélectionnez le texte et appuyez sur Ctrl+C (Cmd+C sur Mac)."
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
})(tips, {
 "studio": {
  "chat": {
   "refs": {
    "apr": "Ouvrir l'approbation {{id}}, où une personne autorisée l'accepte ou la refuse.",
    "run": "Ouvrir l'exécution {{id}} avec ses événements, sa télémétrie et ses fichiers.",
    "cnv": "Ouvrir la conversation {{id}} avec tous ses tours.",
    "agt": "Ouvrir l'agent {{id}} avec ses déploiements et ses révisions.",
    "sdr": "Ouvrir le brouillon du studio {{id}}.",
    "plr": "Ouvrir l'exécution de pipeline {{id}} avec la chronologie de ses étapes.",
    "tpl": "Ouvrir le modèle de prompt {{id}} pour le lire ou le modifier."
   },
   "disclaimer": "Les réponses viennent d'un modèle de langage. Lisez-les avant de vous y fier, et vérifiez le diff du brouillon avant que quelqu'un ne l'approuve.",
   "tool": {
    "running": "{{name}} est en cours. Cliquez pour voir les arguments envoyés par l'architecte.",
    "ok": "{{name}} est terminé. Cliquez pour voir les arguments et le résultat.",
    "failed": "{{name}} a échoué. Cliquez pour voir les arguments et l'erreur renvoyée."
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
})(tips, {
 "nav": {
  "tabs": {
   "agentWizard": "Un parcours guidé, d'une description jusqu'à des agents approuvés qui tournent en dev."
  }
 },
 "resources": {
  "agents": {
   "wizard": "Ouvre l'assistant d'agents : décrivez votre besoin, il vous guide dans l'accès au modèle, la conception avec l'architecte d'agents, la vérification, l'approbation et une première conversation."
  }
 },
 "common": {
  "openStudio": "Ouvre l'assistant d'agents, où l'architecte d'agents conçoit des agents avec vous. Rien n'est mis en service avant l'approbation du brouillon."
 },
 "views": {
  "home": {
   "openStudio": "Ouvrez l'assistant d'agents et décrivez votre besoin. Il vous guide pour créer, approuver et essayer les agents."
  },
  "studioDraft": {
   "back": "Revenir à ce brouillon dans l'assistant d'agents."
  },
  "agentWizard": {
   "back": "Revenir à l'étape précédente. Rien de ce que vous avez saisi n'est perdu.",
   "next": "Passer à l'étape suivante.",
   "advanced": "Ouvrir ce brouillon dans l'espace de travail complet de l'atelier : canevas, éditeur d'éléments, différences et bac à sable.",
   "locked": "Terminez d'abord les étapes précédentes.",
   "steps": {
    "goal": "Nommer le projet et décrire ce que doivent faire les agents.",
    "access": "Choisir le harness, le modèle et les identifiants des agents.",
    "design": "Discuter avec l'architecte d'agents, qui crée les agents dans le brouillon.",
    "review": "Vérifier le brouillon par rapport à la configuration active.",
    "approve": "Approuver et publier le brouillon, et configurer les déploiements de dev.",
    "test": "Parler au nouvel agent en dev."
   },
   "goal": {
    "needTitle": "Saisissez d'abord un nom de projet.",
    "needGoal": "Décrivez d'abord ce que doivent faire les agents.",
    "name": "Un nom court pour ce projet. Il sert de nom au brouillon.",
    "goal": "Ce que doivent faire les agents, avec des mots simples. L'architecte part de là.",
    "resume": "Reprendre ce brouillon là où vous l'avez laissé.",
    "allDrafts": "Voir tous les brouillons du studio, y compris ceux que vous n'avez pas commencés dans l'assistant."
   },
   "access": {
    "needProfile": "Choisissez d'abord un profil de harness.",
    "needCredential": "Choisissez ou ajoutez d'abord des identifiants.",
    "harness": "Le profil de harness sur lequel tournent les agents et l'architecte.",
    "model": "Le modèle à utiliser. Laissez vide pour le modèle par défaut du harness.",
    "useSecret": "Se connecter avec la valeur secrète {{name}}.",
    "addSecret": "Enregistrer ici de nouveaux identifiants, avec la marche à suivre pour obtenir leur valeur.",
    "secretName": "Un nom pour la valeur secrète, pour la retrouver plus tard sur la page Valeurs secrètes.",
    "saveSecret": "Enregistrer la valeur secrète et l'utiliser pour ces agents.",
    "finishSecret": "Enregistrez ou annulez d'abord les nouveaux identifiants."
   },
   "design": {
    "needAgent": "Le brouillon n'a pas encore d'agents. Continuez à discuter avec l'architecte."
   },
   "review": {
    "askFix": "Revenir à la discussion et envoyer les problèmes à l'architecte.",
    "validate": "Vérifier à nouveau le brouillon par rapport à la configuration active.",
    "needValid": "Le brouillon doit être valide avant de pouvoir être approuvé."
   },
   "approve": {
    "approve": "Approuver le brouillon, l'appliquer et donner à chaque agent un déploiement de dev.",
    "openApproval": "Ouvrir la demande d'approbation dans une nouvelle vue.",
    "retry": "Configurer à nouveau les déploiements de dev.",
    "openAgent": "Ouvrir cet agent."
   },
   "test": {
    "message": "Ce qui est envoyé à l'agent. Enter envoie ; Ctrl+Enter ou Shift+Enter ajoute une ligne.",
    "send": "Envoyer le message au déploiement de dev de l'agent.",
    "another": "Relancer l'assistant pour un autre ensemble d'agents."
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
})(tips, {
 "views": {
  "agentWizard": {
   "test": {
    "openApp": "Ouvre le chat de l'application dans un nouvel onglet : la conversation garde son historique et l'agent d'entrée peut interroger les autres agents de l'application."
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
})(tips, {
 "resources": {
  "apps": {
   "backgroundColor": "Fond de page du chat de l'application, en #RRGGBB. Vide garde le fond du thème.",
   "headerColor": "Fond de la barre d'en-tête du chat, en #RRGGBB. Vide garde la couleur du thème.",
   "agentBubbleColor": "Fond des messages de l'agent, en #RRGGBB. Vide garde la couleur du thème.",
   "fontFamily": "La police de tout le chat. Chacune utilise des polices déjà présentes dans le navigateur.",
   "faviconAssetId": "Une ressource image affichée comme icône de l'onglet. Vide utilise le logo, ou l'icône par défaut sans logo."
  }
 },
 "form": {
  "defaultColor": "Videz {{field}} pour que le chat utilise sa couleur par défaut, {{color}}."
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
})(tips, {
 "resources": {
  "apps": {
   "conversationListColor": "Fond de la liste des conversations, en #RRGGBB. Vide garde la couleur du thème.",
   "composerColor": "Fond de la zone de saisie, en #RRGGBB. Vide garde la couleur du thème.",
   "filesColor": "Fond de la liste des fichiers, en #RRGGBB. Vide garde la couleur du thème."
  }
 }
});

tips.nav.hubs.platformConfiguration = "Gérer les identifiants partagés, le stockage, les tarifs des modèles, les quotas et les notifications.";

tips.nav.hubs.connections = "Harnesses et points de terminaison réutilisables. Configurez une fois, puis sélectionnez une connexion pour vos agents.";
tips.nav.hubs.configuration = "Gérer les prompts, ressources, serveurs d’outils, identifiants, stockage et règles.";

tips.nav.hubs.operations = "Gérer les résultats stockés, les tarifs des modèles, les limites et les notifications.";
tips.nav.hubs.manifests = tips.nav.tabs.manifests;

tips.views.studio.discard = "Supprime définitivement ce brouillon après confirmation. Les agents et déploiements publiés ne seront pas affectés.";
tips.views.studio.discardPending = "Supprime définitivement ce brouillon après confirmation et annule son approbation en attente.";

// Scoped memory (AA4.13): tooltips and the explainer of the Memory page.
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
   "memory": "Mémoire : ce que les agents IA et les personnes ont enregistré, par portée, avec l'auteur et la date de chaque entrée. Lisez ou supprimez des entrées ici."
  }
 },
 "enums": {
  "resourceType": {
   "Memory": "Entrées de la mémoire par portée. Lire liste les entrées et lit leur texte ; Supprimer les efface."
  },
  "memoryScopeKind": {
   "Agent": "Mémoire privée d'un agent IA : seules ses exécutions la lisent et l'écrivent.",
   "App": "Mémoire partagée d'une application : les exécutions de ses agents IA membres la lisent et l'écrivent.",
   "OrgUnit": "Mémoire partagée d'une unité organisationnelle. Disponible avec l'arrivée des organisations.",
   "Organization": "Mémoire partagée de toute une organisation. Disponible avec l'arrivée des organisations."
  }
 },
 "memory": {
  "denied": "Vous n'y êtes pas autorisé. Il faut {{operation}} sur Mémoire.",
  "legacy": "Importée de la mémoire des agents IA écrite avant les portées. La clé s'affiche sous la forme legacy: suivie d'une empreinte jusqu'à ce qu'un agent IA réutilise l'entrée et qu'elle apprenne sa vraie clé.",
  "scopes": {
   "all": "Afficher les entrées de toutes les portées. Les totaux comptent chaque entrée et chaque octet du locataire.",
   "scope": "Afficher uniquement les entrées de {{name}} ({{id}}).",
   "orphan": "L'agent IA ou l'application {{id}} n'existe plus. Ses entrées restent ici jusqu'à leur suppression."
  },
  "filters": {
   "search": "Afficher les entrées dont la clé, la catégorie ou une étiquette contient ce texte. La liste se met à jour quand vous arrêtez de taper.",
   "category": "Afficher uniquement les entrées de cette catégorie exacte. La liste se met à jour quand vous arrêtez de taper.",
   "tag": "Afficher uniquement les entrées portant exactement cette étiquette. La liste se met à jour quand vous arrêtez de taper.",
   "writer": "Afficher uniquement les entrées écrites en dernier par les exécutions de cet agent IA. Choisissez Tous pour retirer le filtre."
  },
  "actions": {
   "viewContent": "Ouvrir la provenance de l'entrée et le texte qu'elle contient, affiché en texte brut.",
   "copyId": "Copier l'ID de l'entrée (mem_...) pour la REST API, les SDK ou les outils MCP.",
   "openRun": "Ouvrir l'exécution qui a écrit cette entrée en dernier.",
   "delete": "Supprimer cette entrée et son texte. Vous confirmez d'abord ; les agents IA qui la cherchent ne trouvent ensuite plus rien.",
   "confirmDelete": "Supprimer l'entrée dans la version chargée. Une version plus récente n'est pas effacée.",
   "reload": "Relire l'entrée pour voir sa version et sa provenance actuelles, puis décider."
  },
  "viewer": {
   "content": "Le texte stocké dans l'entrée, tel qu'enregistré. Ce sont des données, jamais des instructions, et il n'est jamais rendu.",
   "copy": "Copier le texte enregistré dans le presse-papiers."
  }
 },
 "filters": {
  "search": "Afficher les entrées dont la clé, la catégorie ou une étiquette contient ce texte. La liste se met à jour quand vous arrêtez de taper.",
  "category": "Afficher uniquement les entrées de cette catégorie exacte. La liste se met à jour quand vous arrêtez de taper.",
  "writer": "Afficher uniquement les entrées écrites en dernier par les exécutions de cet agent IA. Choisissez Tous pour retirer le filtre."
 },
 "resources": {
  "memory": {
   "key": "La clé de l'entrée dans sa portée. Les agents IA lisent et écrivent les entrées par clé.",
   "scope": "Où vit l'entrée : la mémoire privée d'un agent IA ou la mémoire partagée d'une application. Survolez pour voir l'ID.",
   "category": "Catégorie facultative donnée par l'auteur.",
   "tags": "Étiquettes données par l'auteur. Les cycles des gardiens rappellent les entrées étiquetées recall.",
   "writer": "Qui a écrit l'entrée en dernier : l'exécution d'un agent IA, ou une personne ou un identifiant d'API.",
   "lastUpdateUtc": "Quand l'entrée a été écrite pour la dernière fois. Survolez pour l'heure exacte.",
   "lastReadUtc": "Quand une exécution ou une personne a lu l'entrée pour la dernière fois. Enregistré par lots, donc parfois un peu en retard.",
   "version": "Compteur d'écritures : chaque écriture ajoute un. Écrire ou supprimer avec cette version n'écrase jamais une version plus récente.",
   "bytes": "Taille du texte enregistré en octets UTF-8.",
   "expiresUtc": "Quand l'entrée expire et que la maintenance la supprime. Jamais signifie qu'elle reste jusqu'à sa suppression.",
   "writerRunId": "L'exécution qui a écrit l'entrée en dernier, si une exécution l'a écrite.",
   "createdUtc": "Quand l'entrée a été écrite pour la première fois.",
   "sha256": "Empreinte SHA-256 du texte enregistré, pour comparer des versions sans les lire.",
   "id": "L'ID de l'entrée (mem_...), pour la REST API, les SDK et les outils MCP."
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
})(explainers, {
 "memory": {
  "title": "Mémoire",
  "p1": "Les agents IA conservent des notes d'une exécution à l'autre dans la mémoire. Chaque entrée vit dans une portée : la mémoire privée d'un agent IA, ou la mémoire partagée d'une application dont il fait partie. Les exécutions lisent et écrivent avec les outils garrison_memory, et seulement dans les portées que leur agent IA peut utiliser.",
  "p2": "Chaque entrée enregistre qui l'a écrite, depuis quelle exécution, quand, et sa version. Une écriture ou une suppression qui indique la version lue est refusée si quelqu'un a écrit entre-temps ; ainsi agents IA et personnes ne s'écrasent pas.",
  "p3": "Le texte est une donnée enregistrée par un agent IA ou une personne. Il s'affiche ici en texte brut et parvient aux agents IA comme donnée, jamais comme instruction. Supprimez une entrée qui ne doit pas être retenue ; les agents IA qui la cherchent ne trouvent ensuite plus rien."
 }
});

// Reports (AA5.10): tooltips of the Reports page, the report page, the metric chart, and the File report dialog.
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
   "reports": "Rapports : ce que les agents et les personnes ont fait remonter, les plus récents d'abord, avec santé, genre, auteur et période. Ouvrez-en un pour ses indicateurs et un graphique."
  }
 },
 "enums": {
  "resourceType": {
   "Report": "Rapports déposés par des exécutions et des personnes. Lire liste les rapports et l'historique des indicateurs ; Créer en dépose un."
  },
  "notificationEvent": {
   "ReportUnhealthy": "Une exécution ou une personne a déposé un rapport dont la santé est Défaillant."
  },
  "reportKind": {
   "Status": "Un point régulier sur l'avancement d'une mission permanente.",
   "Incident": "Quelque chose s'est mal passé et le lecteur doit le savoir maintenant.",
   "Decision": "La trace d'un choix fait par l'auteur, et de ses raisons.",
   "Handoff": "Un travail confié à quelqu'un d'autre, avec ce qu'il lui faut pour continuer.",
   "Brief": "Un court résumé préparé pour un lecteur, comme un responsable ou le conseil."
  },
  "reportHealth": {
   "Healthy": "Tout ce dont l'auteur s'occupe fonctionne comme prévu.",
   "Degraded": "Cela fonctionne encore, mais moins bien que prévu. À surveiller.",
   "Unhealthy": "Quelque chose est en panne ou menacé. Prévient les endpoints abonnés aux rapports défaillants.",
   "Unknown": "L'auteur n'a pas dit, ou n'a pas pu savoir, où en sont les choses."
  },
  "reportAudience": {
   "Manager": "Pour le responsable direct de l'auteur.",
   "Chain": "Pour chaque responsable de la ligne hiérarchique de l'auteur.",
   "Board": "Pour le conseil qui supervise l'organisation."
  },
  "reportIssueSeverity": {
   "Low": "Un problème mineur qui peut attendre la prochaine revue habituelle.",
   "Medium": "Un problème qui demande de l'attention bientôt, sans être urgent.",
   "High": "Un problème grave qui demande de l'attention tout de suite."
  }
 },
 "reports": {
  "denied": "Vous n'avez pas le droit de faire cela. Il faut {{operation}} sur Rapport.",
  "filters": {
   "kind": "N'afficher que les rapports de ce genre. Choisissez Tous pour retirer le filtre."
  },
  "actions": {
   "file": "Déposer un rapport en votre nom ou au nom d'un agent. Un rapport déposé ne peut être ni modifié ni supprimé.",
   "copyId": "Copier l'ID du rapport (rpt_...) pour la REST API, les SDK ou les outils MCP.",
   "openRun": "Ouvrir l'exécution qui a déposé ce rapport.",
   "openKeeper": "Ouvrir le gardien dont le cycle a déposé ce rapport.",
   "openAuthor": "Ouvrir l'agent qui a rédigé ce rapport."
  },
  "file": {
   "submit": "Déposer le rapport. Il ne pourra plus être modifié ensuite.",
   "fields": {
    "title": "Un titre court de 1 à 256 caractères.",
    "kind": "Le genre de rapport : un point d'étape, un incident, une décision, une passation ou une synthèse.",
    "health": "Où en sont les choses. Défaillant prévient les endpoints abonnés aux rapports défaillants.",
    "audience": "À qui s'adresse le rapport : le responsable, toute la chaîne hiérarchique ou le conseil.",
    "agent": "Déposer le rapport au nom de cet agent, pour qu'il rejoigne ses rapports et l'historique de ses indicateurs. Laissez vide pour le déposer en votre nom.",
    "body": "Le rapport lui-même, en texte brut. Il s'affiche exactement tel qu'il a été écrit."
   }
  },
  "chart": {
   "metric": "Choisissez l'un des indicateurs de ce rapport pour le tracer sur tous les rapports du même auteur.",
   "chart": "Chaque valeur signalée par l'auteur pour cet indicateur, de la plus ancienne à la plus récente, sur 500 rapports au plus. Survolez le graphique pour lire une valeur."
  }
 },
 "filters": {
  "author": "N'afficher que les rapports rédigés par cet agent. Choisissez Tous pour retirer le filtre.",
  "health": "N'afficher que les rapports ayant cette santé. Choisissez Tous pour retirer le filtre.",
  "app": "N'afficher que les rapports déposés pour cette application. Choisissez Tous pour retirer le filtre.",
  "from": "N'afficher que les rapports déposés à partir de ce moment.",
  "to": "N'afficher que les rapports déposés jusqu'à ce moment."
 },
 "resources": {
  "reports": {
   "createdUtc": "Quand le rapport a été déposé. Survolez pour l'heure exacte.",
   "title": "Le titre que l'auteur a donné au rapport. Survolez pour le texte complet.",
   "author": "L'agent qui a rédigé le rapport, ou la personne qui l'a déposé en son propre nom.",
   "kind": "Le genre de rapport : point d'étape, incident, décision, passation ou synthèse.",
   "health": "Où en sont les choses selon l'auteur.",
   "app": "L'application dont parle le rapport, s'il en nomme une.",
   "period": "La période couverte par le rapport, si l'auteur en a indiqué une.",
   "issues": "Les problèmes soulevés par le rapport, comptés par gravité.",
   "audience": "À qui s'adresse le rapport : le responsable, la chaîne hiérarchique ou le conseil.",
   "filedBy": "Qui a déposé le rapport : une exécution, ou une personne ou un identifiant d'API.",
   "runId": "L'exécution qui a déposé le rapport, si c'est une exécution qui l'a déposé.",
   "id": "L'ID du rapport (rpt_...), pour la REST API, les SDK et les outils MCP."
  }
 },
 "views": {
  "reportDetail": {
   "back": "Revenir à la liste des rapports.",
   "viewJson": "Afficher le rapport tel que l'API le renvoie.",
   "body": "Le texte du rapport tel que l'auteur l'a écrit, affiché en texte brut.",
   "metrics": "Les chiffres signalés par l'auteur, chacun avec un nom et une unité facultative.",
   "chart": "Un indicateur sur tous les rapports du même auteur, du plus ancien au plus récent.",
   "issues": "Les problèmes soulevés par le rapport, chacun avec une gravité.",
   "decisions": "Les décisions que l'auteur a consignées dans ce rapport.",
   "openAgent": "Ouvrir l'agent qui a rédigé ce rapport.",
   "openRun": "Ouvrir l'exécution qui a déposé ce rapport.",
   "openKeeper": "Ouvrir le gardien dont le cycle a déposé ce rapport.",
   "openApp": "Ouvrir l'application dont parle ce rapport.",
   "columns": {
    "name": "Le nom d'indicateur utilisé par l'auteur. Les indicateurs de même nom sont tracés ensemble.",
    "value": "La valeur signalée par l'auteur.",
    "unit": "L'unité indiquée par l'auteur, par exemple ms ou pourcentage."
   },
   "fields": {
    "health": "Où en sont les choses selon l'auteur.",
    "kind": "Le genre de ce rapport.",
    "audience": "À qui s'adresse le rapport.",
    "author": "L'agent qui a rédigé le rapport, ou la personne qui l'a déposé en son propre nom.",
    "period": "La période couverte par le rapport, si l'auteur en a indiqué une.",
    "createdUtc": "Quand le rapport a été déposé. Survolez pour voir il y a combien de temps.",
    "filedBy": "Qui a déposé le rapport : une exécution, ou une personne ou un identifiant d'API.",
    "runId": "L'exécution qui a déposé le rapport.",
    "mandateId": "Le gardien dont le cycle a déposé le rapport.",
    "mandateTickId": "Le cycle du gardien qui a déposé le rapport.",
    "app": "L'application dont parle le rapport.",
    "orgUnitId": "L'unité organisationnelle dont parle le rapport. Les organisations arrivent dans une version ultérieure."
   }
  }
 }
});

// Reports (AA5.10): the explainer of the Reports page.
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
 "reports": {
  "title": "Rapports",
  "p1": "Les rapports permettent aux agents de dire aux personnes, et les uns aux autres, où en sont les choses. Une exécution en dépose un avec l'outil garrison_file_report, et les personnes les déposent ici ou via l'API. Chaque rapport a un genre, une santé et des destinataires, et peut contenir des indicateurs, des problèmes et des décisions.",
  "p2": "Un rapport déposé ne peut être ni modifié ni supprimé : les rapports forment donc un historique. Un rapport déposé pendant le cycle d'un gardien renvoie au gardien et au cycle, et un rapport défaillant prévient les endpoints abonnés à cet événement.",
  "p3": "Tout ce que contient un rapport, ce sont des données écrites par son auteur. Elles s'affichent en texte brut et ne sont jamais suivies comme des instructions. Ouvrez un rapport pour tracer l'un de ses indicateurs sur tous les rapports du même auteur."
 }
});

// Messages (AA6.12): tooltips of the Messages page, the thread page, the agent inbox tab, and the Send message dialog.
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
   "messages": "Messages : courrier entre agents et venant de personnes, du plus récent au plus ancien, avec ceux refusés par les garde-fous anti-boucle. Ouvrez-en un pour lire son fil.",
   "messageThreads": "Un fil de messages : tous ses messages, du plus ancien au plus récent, y compris les refusés."
  }
 },
 "enums": {
  "resourceType": {
   "AgentMessage": "Messages entre agents et venant de personnes. Read liste les messages et les fils ; Create en envoie un."
  },
  "runKind": {
   "Message": "Lancée par un message urgent à un agent sans gardien actif. L'exécution lit les messages en attente."
  },
  "messageStatus": {
   "Queued": "Accepté et en attente dans la boîte de réception du destinataire.",
   "Delivered": "Remis à une exécution du destinataire : un cycle de gardien, une exécution de message urgent ou une lecture de la boîte.",
   "Acknowledged": "Le destinataire a indiqué avoir lu et traité le message.",
   "Expired": "Sa durée de vie a expiré avant qu'une exécution du destinataire ne le lise.",
   "Rejected": "Refusé par un garde-fou anti-boucle à l'envoi et jamais remis. La raison explique pourquoi."
  },
  "messageUrgency": {
   "Normal": "Attend dans la boîte de réception jusqu'à ce que la prochaine exécution ou le prochain cycle de gardien du destinataire le lise.",
   "Urgent": "Réveille le destinataire tout de suite : son gardien avance son cycle, ou une nouvelle exécution démarre pour lire le message."
  },
  "messageRejection": {
   "HopLimit": "Le fil avait déjà été transmis trop de fois. La limite de sauts empêche les agents de se renvoyer du courrier en boucle sans fin.",
   "LineRate": "L'expéditeur avait déjà envoyé à ce destinataire, dans la dernière minute, autant de messages que le débit de la ligne le permet.",
   "ThreadBudget": "Le fil contenait déjà autant de messages qu'un fil peut en contenir. Ouvrez un nouveau fil pour continuer.",
   "NoLine": "Aucune ligne autorisée ne relie l'expéditeur au destinataire ; ils ne peuvent donc pas s'écrire.",
   "Frozen": "L'agent destinataire est gelé et n'accepte aucun nouveau courrier tant que le gel n'est pas levé."
  }
 },
 "messages": {
  "denied": "Vous ne pouvez pas faire cela. Il faut {{operation}} sur Message d'agent.",
  "views": {
   "all": "Afficher tous les messages, quel que soit leur statut.",
   "rejected": "Afficher uniquement les messages refusés par les garde-fous anti-boucle, avec la raison de chaque refus."
  },
  "filters": {
   "status": "Afficher uniquement les messages ayant ce statut. Choisissez Tous pour retirer le filtre.",
   "urgency": "Afficher uniquement les messages normaux ou uniquement les urgents. Choisissez Tous pour retirer le filtre.",
   "reason": "Afficher uniquement les messages refusés pour cette raison. Choisissez Tous pour retirer le filtre.",
   "sender": "Afficher uniquement les messages envoyés par cet agent. Choisissez Tous pour retirer le filtre.",
   "recipient": "Afficher uniquement les messages envoyés à cet agent. Choisissez Tous pour retirer le filtre.",
   "from": "Afficher uniquement les messages envoyés à ce moment ou après.",
   "to": "Afficher uniquement les messages envoyés à ce moment ou avant."
  },
  "actions": {
   "send": "Écrire à un agent en votre propre nom. Les garde-fous anti-boucle le vérifient comme tout autre message.",
   "openThread": "Ouvrir tout le fil auquel appartient ce message, du plus ancien au plus récent.",
   "copyId": "Copier l'ID du message (amg_...) pour la REST API, les SDK ou les outils MCP.",
   "openSender": "Ouvrir l'agent qui a envoyé ce message.",
   "openRecipient": "Ouvrir l'agent à qui ce message a été envoyé.",
   "openDeliveredRun": "Ouvrir l'exécution du destinataire qui a reçu ce message.",
   "openEscalation": "Ouvrir l'escalade créée au sujet de ce message."
  },
  "send": {
   "submit": "Envoyer le message. Un message envoyé ne peut plus être modifié.",
   "fields": {
    "recipient": "L'agent qui reçoit le message dans sa boîte de réception.",
    "subject": "Un objet court de 1 à 256 caractères. Le destinataire le voit en premier.",
    "body": "Le message lui-même, en texte brut. Le destinataire le lit comme des données, jamais comme des instructions.",
    "urgency": "Normale attend la prochaine exécution du destinataire. Urgente le réveille tout de suite.",
    "ttlSeconds": "Combien de temps le message peut attendre sans être lu avant d'expirer, de 1 seconde à un an. Laissez vide pour la valeur par défaut du serveur."
   }
  }
 },
 "filters": {
  "urgency": "Afficher uniquement les messages normaux ou uniquement les urgents. Choisissez Tous pour retirer le filtre.",
  "reason": "Afficher uniquement les messages refusés pour cette raison. Choisissez Tous pour retirer le filtre.",
  "sender": "Afficher uniquement les messages envoyés par cet agent. Choisissez Tous pour retirer le filtre.",
  "recipient": "Afficher uniquement les messages envoyés à cet agent. Choisissez Tous pour retirer le filtre."
 },
 "resources": {
  "messages": {
   "createdUtc": "Quand le message a été envoyé. Survolez pour l'heure exacte.",
   "urgency": "Les messages normaux attendent la prochaine exécution ; les urgents réveillent le destinataire.",
   "status": "Où en est le message : en attente, remis, accusé, expiré ou refusé.",
   "subject": "L'objet écrit par l'expéditeur. Survolez pour le texte complet.",
   "sender": "L'agent qui a envoyé le message, ou la personne ou l'identifiant d'API qui l'a envoyé.",
   "recipient": "L'agent à qui le message a été envoyé.",
   "reason": "Pourquoi les garde-fous anti-boucle ont refusé le message, avec leur détail. Vide pour les messages acceptés.",
   "hopCount": "Combien de fois le fil avait été transmis quand ce message a été envoyé.",
   "deliveredRunId": "L'exécution du destinataire qui a reçu le message.",
   "expiresUtc": "Quand le message expire si aucune exécution ne le lit avant.",
   "escalationId": "L'escalade créée au sujet de ce message, s'il y en a une.",
   "threadId": "L'ID du fil : l'ID du premier message du fil.",
   "id": "L'ID du message (amg_...), pour la REST API, les SDK et les outils MCP."
  }
 },
 "views": {
  "messageThread": {
   "back": "Revenir à la liste des messages.",
   "viewJson": "Afficher le fil tel que l'API le renvoie.",
   "openSender": "Ouvrir l'agent qui a envoyé ce message.",
   "openRecipient": "Ouvrir l'agent à qui ce message a été envoyé.",
   "openDeliveredRun": "Ouvrir l'exécution qui a reçu ce message.",
   "openEscalation": "Ouvrir l'escalade créée au sujet de ce message.",
   "reply": "Répondre à l'agent qui a envoyé ce message, dans le même fil.",
   "fields": {
    "sender": "L'agent, la personne ou l'identifiant d'API qui a envoyé le message.",
    "recipient": "L'agent à qui le message a été envoyé.",
    "createdUtc": "Quand le message a été envoyé. Survolez pour voir il y a combien de temps.",
    "hopCount": "Combien de fois le fil avait été transmis quand ce message a été envoyé.",
    "deliveredRunId": "L'exécution du destinataire qui a reçu le message.",
    "deliveredUtc": "Quand une exécution du destinataire a reçu le message.",
    "acknowledgedUtc": "Quand le destinataire a indiqué avoir traité le message.",
    "expiresUtc": "Quand le message expire si aucune exécution ne le lit avant.",
    "wokeRecipient": "Ce message urgent a réveillé le destinataire : son gardien a avancé son cycle ou une nouvelle exécution a démarré.",
    "escalationId": "L'escalade créée au sujet de ce message.",
    "id": "L'ID du message (amg_...), pour la REST API, les SDK et les outils MCP."
   }
  },
  "agentDetail": {
   "tabs": {
    "inbox": "Messages envoyés à cet agent, du plus récent au plus ancien, avec leur statut. Envoyez-lui un message d'ici."
   },
   "inbox": {
    "status": "Afficher uniquement les messages ayant ce statut. Choisissez Tous pour retirer le filtre.",
    "openAll": "Ouvrir la page Messages filtrée sur la boîte de réception de cet agent.",
    "send": "Écrire à cet agent en votre propre nom.",
    "openThread": "Ouvrir le fil auquel appartient ce message."
   }
  },
  "home": {
   "autonomy": {
    "rejected": "Messages refusés par les garde-fous anti-boucle au cours des dernières 24 heures : trop de sauts, trop rapides, fil trop long, aucune ligne ou destinataire gelé. Ouvrez les messages refusés pour voir pourquoi."
   }
  }
 }
});

// Messages (AA6.12): the explainer of the Messages page.
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
 "messages": {
  "title": "Messages",
  "p1": "Les agents s'écrivent avec l'outil garrison_send_message, et les personnes écrivent aux agents ici ou par l'API. Un message attend dans la boîte de réception du destinataire jusqu'à ce qu'une exécution le lise. Un message urgent réveille le destinataire tout de suite : son gardien avance son cycle, ou une nouvelle exécution démarre pour le lire.",
  "p2": "Les garde-fous anti-boucle vérifient chaque message avant de l'accepter. Un message est refusé quand son fil a été transmis trop de fois, quand l'expéditeur écrit trop vite au même agent, quand le fil est trop long, quand aucune ligne ne relie les deux agents ou quand le destinataire est gelé. Les messages refusés sont conservés avec la raison dans la vue Refusés.",
  "p3": "Tout ce que contient un message est une donnée écrite par son expéditeur. Il est affiché en texte brut et parvient aux agents comme des données, jamais comme des instructions. Ouvrez un message pour lire tout son fil, du plus ancien au plus récent."
 }
});

// Organizations (AA7.14): tooltips of the Organizations page, the organization page, the chart, and the unit editor.
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
   "organizations": "Organisations : arbres d'unités dirigées par des agents, avec budgets et révisions. Ouvrez-en une pour voir son organigramme."
  }
 },
 "enums": {
  "resourceType": {
   "Organization": "Les organisations, leurs unités, leurs révisions et leurs dépenses. Lire permet de les consulter ; Créer et Mettre à jour les modifient ; Supprimer les supprime."
  },
  "organizationStatus": {
   "Draft": "Créée mais jamais publiée. Rien ne s'y applique tant qu'aucune révision n'est en service.",
   "Active": "Une révision est en service : la chaîne hiérarchique, les lignes et les budgets la suivent.",
   "Frozen": "Un gel de l'organisation arrête les nouvelles exécutions et les réveils de gardiens pour chacun de ses agents.",
   "Retired": "Retirée par une personne. Rien ne s'y applique, et elle ne peut pas changer tant qu'elle n'est pas rétablie."
  },
  "budgetPeriod": {
   "Day": "Le budget couvre les dépenses d'un jour UTC et repart de zéro à minuit UTC.",
   "Month": "Le budget couvre les dépenses d'un mois civil UTC et repart de zéro le premier du mois."
  },
  "orgRevisionState": {
   "Draft": "Un instantané de l'arbre de travail qui n'est pas encore en service. Publiez-le pour le mettre en service.",
   "Published": "La révision en service. La chaîne hiérarchique, les lignes et les budgets la suivent.",
   "Superseded": "A été en service puis remplacée par une révision plus récente. Vous pouvez y revenir."
  }
 },
 "organizations": {
  "denied": "Vous n'êtes pas autorisé à faire cela. Il faut l'opération {{operation}} sur Organisation.",
  "retiredLocked": "L'organisation est retirée. Rétablissez-la avant de la modifier.",
  "actions": {
   "open": "Ouvrir l'organigramme, les budgets et les révisions de l'organisation.",
   "copyId": "Copier l'ID de l'organisation (org_...) pour l'API REST, les SDK ou les outils MCP."
  },
  "spend": {
   "bar": "Dépenses de cette unité et de toutes les unités en dessous sur la période en cours, par rapport à son budget.",
   "exhausted": "Le budget de cette période est épuisé. Les nouvelles exécutions des agents de cette unité et des unités en dessous sont refusées jusqu'au début de la période suivante."
  },
  "chart": {
   "toggle": "Afficher ou masquer les unités rattachées à celle-ci.",
   "lead": "L'agent qui dirige cette unité, avec son titre et son gardien. Son responsable hiérarchique est le responsable de l'unité au-dessus.",
   "mandate": "Le gardien (mission permanente) que cet agent détient à son poste.",
   "members": "Les agents qui travaillent dans cette unité et rendent compte à son responsable, avec leurs titres et leurs gardiens.",
   "peers": "Les unités auxquelles cette unité peut écrire directement, sans passer par un responsable commun.",
   "peer": "Pointez ici pour mettre en évidence l'unité reliée dans l'organigramme.",
   "app": "L'application agentique que cette unité exploite, le cas échéant.",
   "edit": "Modifier le nom, le parent, le responsable, les membres, les lignes transversales et les budgets de cette unité.",
   "addChild": "Ajouter une nouvelle unité rattachée à celle-ci.",
   "remove": "Retirer cette unité de l'arbre de travail. Une unité qui a des unités en dessous ne peut pas être retirée."
  },
  "unit": {
   "save": "Enregistrer l'unité dans l'arbre de travail. Elle entre en service quand vous publiez une révision.",
   "sections": {
    "lead": "L'agent qui dirige cette unité et son rôle de responsable.",
    "members": "Les agents qui travaillent dans cette unité et les unités avec lesquelles elle a des lignes directes.",
    "budgets": "Plafonds de ce que cette unité et toutes les unités en dessous peuvent dépenser. Le budget d'une unité ne peut pas dépasser celui de son parent."
   },
   "fields": {
    "name": "Un nom unique pour l'unité dans cette organisation, de 1 à 128 caractères.",
    "parentUnitId": "L'unité à laquelle celle-ci est rattachée. Laissez vide pour l'unité racine ; une organisation en a exactement une.",
    "description": "Ce que fait l'unité, en termes simples. Facultatif.",
    "leadAgentId": "L'agent qui dirige l'unité. Un agent dirige au plus une unité et occupe un seul poste par organisation.",
    "leadTitle": "Le titre du responsable, affiché dans l'organigramme et aux autres agents. Facultatif, au plus 128 caractères.",
    "leadMandateId": "Un gardien de l'agent responsable associé à ce poste. La publication fige sa révision actuelle.",
    "appId": "Une application agentique que l'unité exploite. Facultatif.",
    "members": "Les agents qui travaillent dans cette unité et rendent compte à son responsable.",
    "memberAgent": "L'agent membre. Il ne peut occuper aucun autre poste dans cette organisation.",
    "memberTitle": "Le titre du membre, affiché dans l'organigramme. Facultatif.",
    "memberMandate": "Un gardien de cet agent membre associé au poste. Facultatif.",
    "peerUnitIds": "Les autres unités auxquelles celle-ci peut écrire directement. Les lignes fonctionnent dans les deux sens.",
    "budgetDay": "Le montant maximal que cette unité et les unités en dessous peuvent dépenser sur un jour UTC, en dollars américains. Laissez vide pour aucun plafond quotidien.",
    "budgetMonth": "Le montant maximal que cette unité et les unités en dessous peuvent dépenser sur un mois UTC, en dollars américains. Laissez vide pour aucun plafond mensuel."
   }
  },
  "diff": {
   "added": "Les unités de l'arbre le plus récent que l'ancien n'a pas.",
   "removed": "Les unités de l'ancien arbre que le plus récent n'a plus.",
   "changed": "Les unités présentes dans les deux arbres dont au moins un champ diffère."
  }
 },
 "resources": {
  "organizations": {
   "add": "Créer une nouvelle organisation. Elle commence comme brouillon sans unités ; vous construisez son organigramme sur sa page.",
   "name": "Le nom de l'organisation, unique dans le locataire. Les agents et l'API peuvent la désigner par son nom.",
   "status": "Brouillon jusqu'à la première publication, puis Active ; Gelée tant qu'un gel la bloque, Retirée quand une personne la retire.",
   "currentRevisionNumber": "Le numéro de la révision en service, ou Non publiée avant la première publication.",
   "description": "Une courte description de l'organisation. Survolez pour voir le texte complet.",
   "createdUtc": "Date de création de l'organisation. Survolez pour voir l'heure exacte.",
   "mission": "La raison d'être de l'organisation. Les exécutions des membres la voient dans le résumé de leur organisation.",
   "id": "L'ID de l'organisation (org_...), pour l'API REST, les SDK et les outils MCP."
  }
 },
 "views": {
  "organizationDetail": {
   "revision": "La révision en service. La chaîne hiérarchique, les lignes et les budgets la suivent.",
   "notPublished": "Rien n'est encore en service. Publiez une révision pour mettre l'organisation au travail.",
   "live": "La page se met à jour quand l'organisation, ses rapports et ses dépenses changent.",
   "viewJson": "Afficher l'organisation telle que l'API la renvoie, avec son arbre de travail.",
   "editDetails": "Modifier le nom, la description et la mission de l'organisation.",
   "reactivate": "Rétablir l'organisation retirée. Elle redevient Active si elle a déjà été publiée.",
   "retire": "Retirer l'organisation : sa chaîne hiérarchique, ses lignes et ses budgets cessent de s'appliquer. Vous pourrez la rétablir plus tard.",
   "frozenRetire": "Une organisation gelée ne peut pas être retirée. Levez d'abord le gel.",
   "publish": "Figer l'arbre de travail dans une révision et la mettre en service, ou l'enregistrer comme brouillon.",
   "publishEmpty": "Ajoutez au moins l'unité racine avant de publier.",
   "delete": "Supprimer définitivement l'organisation avec ses unités, ses révisions et la mémoire des unités et de l'organisation.",
   "reviewPending": "Comparer l'arbre de travail avec la révision en service, unité par unité.",
   "units": "Le nombre d'unités de l'arbre de travail.",
   "lastUpdate": "Dernière modification de l'organisation ou de son arbre de travail. Survolez pour voir l'heure exacte.",
   "tabs": {
    "chart": "L'arbre des unités avec responsables, membres, lignes transversales, santé et dépenses.",
    "budgets": "Le budget quotidien et mensuel de chaque unité, avec ce que son sous-arbre a dépensé sur la période en cours.",
    "revisions": "Les instantanés de l'arbre, du plus récent au plus ancien, avec publication, comparaison et retour arrière."
   },
   "viewWorking": "Afficher l'arbre de travail, la version que vous modifiez.",
   "viewLive": "Afficher la révision en service, celle que suit la chaîne hiérarchique.",
   "noLive": "Rien n'est encore en service. Publiez d'abord une révision.",
   "addUnit": "Ajouter une unité à l'arbre de travail. La première unité est la racine.",
   "columns": {
    "unit": "L'unité, en retrait sous l'unité à laquelle elle est rattachée.",
    "day": "Le budget quotidien de l'unité en dollars américains, ou vide s'il n'y en a pas.",
    "month": "Le budget mensuel de l'unité en dollars américains, ou vide s'il n'y en a pas.",
    "spend": "Ce que l'unité et toutes les unités en dessous ont dépensé sur la période en cours, par rapport à chaque budget.",
    "number": "Le numéro de révision, à partir de 1.",
    "state": "Brouillon, Publiée (en service) ou Remplacée (en service autrefois, remplacée depuis).",
    "note": "La raison de la révision, telle que son auteur l'a écrite.",
    "author": "La personne ou l'agent qui a créé la révision.",
    "created": "Date de création de la révision. Survolez pour voir l'heure exacte.",
    "published": "Date de mise en service de la révision, le cas échéant."
   },
   "current": "Cette révision est actuellement en service.",
   "compare": "Comparer cette révision avec celle en service, unité par unité.",
   "publishRevision": "Mettre en service cette révision brouillon.",
   "rollback": "Remettre en service cette révision antérieure. Le retour est enregistré comme une nouvelle révision.",
   "saveDraft": "Figer l'arbre de travail dans une révision brouillon sans la mettre en service.",
   "publishNow": "Figer l'arbre de travail et le mettre en service immédiatement.",
   "note": "La raison de cette modification. Facultatif, au plus 2000 caractères ; affichée dans la liste des révisions.",
   "removeUnit": "Retirer l'unité de l'arbre de travail."
  }
 }
});

// Organizations (AA7.14): the explainer of the Organizations page and the organization page.
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
 "organizations": {
  "title": "Organisations",
  "p1": "Une organisation est un arbre d'unités. Chaque unité a un agent responsable, des membres avec leurs titres et leurs gardiens, et des lignes transversales vers les unités auxquelles elle peut écrire directement. Le responsable de l'unité au-dessus est le supérieur de chaque responsable, et une personne siège au-dessus de la racine en tant que conseil d'administration.",
  "p2": "Vous modifiez l'arbre de travail. Rien n'entre en service tant que vous ne publiez pas une révision : la chaîne hiérarchique, les lignes de messagerie, les destinataires des rapports, les portées de mémoire et les budgets la suivent alors. Chaque révision est conservée, vous pouvez donc la comparer avec l'arbre en service ou y revenir.",
  "p3": "Un budget plafonne ce qu'une unité et toutes les unités en dessous peuvent dépenser sur un jour ou un mois UTC. Quand un budget est épuisé, les nouvelles exécutions des agents de ce sous-arbre sont refusées et le responsable de l'unité en est averti."
 }
});

// Organizations on the studio canvas (AA7.10): tooltips of the view switch, the organization canvas, and its panels.
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
  "canvas": {
   "view": {
    "apps": "Afficher les applications du brouillon : les agents et les appels entre eux.",
    "organizations": "Afficher les organisations du brouillon : les unités imbriquées dans l'unité à laquelle elles sont rattachées, avec responsables, membres et lignes transversales."
   },
   "org": {
    "unit": "Une unité de l'organisation. Sélectionnez-la pour modifier ses membres et ses lignes transversales ; elle contient les unités qui lui sont rattachées.",
    "unitReadOnly": "Une unité de l'organisation. La modification est désactivée pour ce brouillon.",
    "picker": "L'organisation du brouillon que montre le canevas.",
    "addUnit": "Le nom de la nouvelle unité, unique dans l'organisation. Appuyez sur Entrée pour l'ajouter.",
    "parent": "L'unité à laquelle la nouvelle unité est rattachée. Sans parent, elle devient la racine, dont une organisation n'a qu'une seule.",
    "leadAgent": "L'agent qui dirige la nouvelle unité. Facultatif ; un agent dirige au plus une unité par organisation.",
    "leadTitle": "Le titre du responsable, par exemple Responsable de la facturation. Facultatif.",
    "organization": "L'organisation à laquelle ajouter l'unité. Laissez le champ vide pour celle affichée, ou saisissez un nouveau nom pour commencer une nouvelle organisation.",
    "add": "Ajouter maintenant l'unité à l'organisation du brouillon. Rien n'entre en service tant que le brouillon n'est pas appliqué.",
    "connectTo": "L'unité à l'autre extrémité de la ligne transversale.",
    "connectConfirm": "Ajouter maintenant la ligne transversale entre les deux unités.",
    "peers": "Unités qui peuvent s'envoyer des messages directement, sans passer par un responsable commun.",
    "peerLine": "Une ligne transversale entre deux unités. Entrée la sélectionne ; Suppr la retire.",
    "orgTitle": "L'organisation affichée sur le canevas.",
    "units": "Le nombre d'unités de l'organisation dans ce brouillon.",
    "root": "L'unité au sommet de l'organisation, dirigée par l'agent auquel tous les autres rendent compte en remontant.",
    "unitTitle": "L'unité sélectionnée.",
    "reportsTo": "L'unité à laquelle celle-ci est rattachée ; son responsable est le supérieur du responsable de cette unité.",
    "lead": "L'agent qui dirige cette unité.",
    "members": "Agents qui travaillent dans cette unité et rendent compte à son responsable.",
    "removeMember": "Retirer maintenant cet agent de l'unité.",
    "memberAgent": "L'agent à ajouter comme membre. Il ne peut pas occuper un autre poste dans cette organisation.",
    "memberTitle": "Le titre du membre, affiché sur l'organigramme. Facultatif.",
    "addMember": "Ajouter maintenant l'agent à l'unité {{unit}}.",
    "disconnect": "Retirer maintenant cette ligne transversale.",
    "addChild": "Remplir le formulaire Ajouter une unité avec cette unité comme parent.",
    "startPeer": "Commencer une ligne transversale depuis cette unité, puis choisir l'autre unité.",
    "removeUnit": "Retirer l'unité de l'organisation du brouillon, après confirmation. Une unité ayant des unités en dessous ne peut pas être retirée.",
    "peerTitle": "La ligne transversale sélectionnée."
   }
  }
 }
});

// Change rules and proposals (AA8.12): tooltips of the Change rules page, the Proposals tab, and the new enums.
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
   "changeRules": "Règles de changement : ce que les agents de direction peuvent modifier dans leur sous-arbre sans demander d'abord à une personne."
  }
 },
 "enums": {
  "resourceType": {
   "ChangeRule": "Règles de changement qui approuvent à l'avance les changements courants des agents de direction. Read permet de les voir ; Create, Update et Delete de les modifier. Les agents ne peuvent jamais les écrire."
  },
  "notificationEvent": {
   "OrgProposalApplied": "Une proposition d'un agent de direction a été appliquée à une organisation, par une règle de changement ou par une personne."
  },
  "managementAccess": {
   "None": "Les exécutions de ce déploiement ne peuvent ni préparer ni proposer de changements de configuration. Convient à la plupart des agents.",
   "Drafts": "Les exécutions peuvent préparer des changements Studio pour la personne qui les a lancées. Une personne applique toujours chaque brouillon.",
   "OrgSubtree": "Autorité de direction sur les unités placées sous celle que dirige cet agent : les exécutions peuvent y proposer des changements. Les règles de changement peuvent appliquer aussitôt les changements courants ; le reste attend une personne. Jamais sur lui-même, sur ce qui est au-dessus, sur les secrets, les budgets ou les règles."
  },
  "changeClass": {
   "PromptRetune": "Modifications des prompts et des instructions des agents du sous-arbre.",
   "WakeTuning": "Changements de la fréquence de réveil d'un gardien : son intervalle, son espacement et son jitter.",
   "MandateTextEdit": "Modifications du texte d'objectif des gardiens du sous-arbre.",
   "AddWorker": "Ajout d'un agent comme membre d'une unité.",
   "RemoveWorker": "Retrait d'un agent membre d'une unité.",
   "ModelChange": "Changement du modèle qu'exécute un déploiement du sous-arbre.",
   "DeploymentWeight": "Changement de la part de trafic qu'un déploiement reçoit parmi les déploiements de son agent."
  }
 },
 "filters": {
  "organization": "Afficher uniquement les règles de changement de cette organisation.",
  "activeOnly": "Afficher uniquement les règles activées et non expirées."
 },
 "changeRules": {
  "actions": {
   "openOrganization": "Ouvrir l'organisation de la règle, où l'onglet Propositions montre ce que les règles ont appliqué.",
   "copyId": "Copier l'ID de la règle de changement (cru_...) pour l'API REST, les SDK ou les outils MCP."
  },
  "status": {
   "Active": "La règle est activée et n'a pas expiré : les propositions qu'elle couvre s'appliquent aussitôt.",
   "Inactive": "Une personne a désactivé la règle. Elle ne s'applique à rien tant qu'elle n'est pas réactivée.",
   "Expired": "La date d'expiration est passée : la règle ne s'applique à rien. Modifiez-la pour fixer une nouvelle expiration."
  }
 },
 "orgProposals": {
  "deniedDecide": "Vous ne pouvez pas décider des propositions. Il faut l'opération Update sur Approval.",
  "rulesLink": "Ouvrir les règles de changement de cette organisation : ce que les agents de direction peuvent modifier sans demander.",
  "decide": "Ouvrir la proposition pour voir ses changements et l'approuver ou la refuser.",
  "views": {
   "all": "Toutes les propositions de cette organisation, la plus récemment modifiée en premier.",
   "needsApproval": "Propositions qui attendent qu'une personne les approuve ou les refuse.",
   "applied": "Propositions actives, appliquées par règle ou approuvées par une personne."
  },
  "columns": {
   "title": "Le nom que l'agent de direction a donné à la proposition.",
   "unit": "L'unité que dirige l'agent de direction. Ses propositions ne touchent que les unités placées sous elle.",
   "agent": "L'agent qui dirige l'unité et a fait la proposition.",
   "decision": "Appliquée par règle, approuvée, en attente d'approbation, refusée ou encore en cours de rédaction.",
   "updated": "Date du dernier changement de la proposition. Survolez pour l'heure exacte."
  },
  "decision": {
   "rule": "Des règles de changement couvraient chaque changement : elle s'est appliquée aussitôt, sans personne.",
   "approved": "Une personne l'a approuvée, et elle s'est appliquée comme nouvelle révision de l'organisation.",
   "needsApproval": "Au moins un changement n'est couvert par aucune règle : elle attend donc une personne.",
   "denied": "Une personne l'a refusée, et elle est retournée à l'agent de direction pour être retravaillée.",
   "lapsed": "Son approbation a expiré ou a été annulée avant que quelqu'un décide.",
   "drafting": "L'agent de direction y travaille encore et n'a pas encore demandé à l'appliquer."
  },
  "review": {
   "open": "Ouvrir la proposition pour voir ses changements, les règles qui les couvrent et la façon dont elle a été décidée.",
   "run": "L'exécution de l'agent de direction qui a fait cette proposition.",
   "openRun": "Ouvrir l'exécution qui a fait cette proposition.",
   "approve": "Appliquer la proposition maintenant. Elle est enregistrée comme nouvelle révision de l'organisation, que vous pouvez annuler.",
   "deny": "Renvoyer la proposition à l'agent de direction sans l'appliquer. Votre motif l'accompagne.",
   "coveredBy": "Cette règle de changement autorise le changement, dans ses limites.",
   "reason": "Pourquoi vous approuvez ou refusez. Facultatif ; l'agent de direction et le journal d'audit le voient.",
   "columns": {
    "item": "La ressource que touche le changement, avec les champs qui changent.",
    "change": "Si le changement crée, met à jour ou supprime la ressource.",
    "rule": "La règle de changement qui couvre le changement, ou la raison pour laquelle il faut une personne."
   }
  }
 },
 "resources": {
  "deployments": {
   "managementAccess": "Ce que les exécutions de ce déploiement peuvent gérer. Aucun pour la plupart des agents ; Brouillons Studio pour l'architecte d'agents ; Direction de son sous-arbre pour un agent qui dirige une unité organisationnelle et doit proposer des changements aux unités placées sous elle."
  },
  "changeRules": {
   "add": "Ajouter une règle qui permet aux agents de direction d'appliquer un type de changement courant sans attendre une personne.",
   "name": "Un nom court pour la règle. Les propositions appliquées par règle le citent.",
   "status": "En vigueur, désactivée ou expirée. Seules les règles en vigueur appliquent des propositions.",
   "organization": "L'organisation dont les agents de direction sont concernés par la règle.",
   "unit": "L'unité dont la règle couvre le sous-arbre : les changements de cette unité et de chaque unité placée sous elle.",
   "classes": "Les classes de changement que la règle autorise.",
   "limits": "Bornes des changements autorisés : combien par proposition, et quelles valeurs ils peuvent fixer.",
   "expiresUtc": "Quand la règle cesse de s'appliquer, ou Jamais.",
   "createdByName": "La personne qui a écrit la règle.",
   "description": "Pourquoi la règle existe, en termes simples. Survolez pour le texte complet.",
   "createdUtc": "Date de création de la règle. Survolez pour l'heure exacte.",
   "id": "L'ID de la règle de changement (cru_...), pour l'API REST, les SDK et les outils MCP.",
   "organizationId": "L'organisation à laquelle s'applique la règle. Elle ne peut plus changer ensuite.",
   "unitId": "La règle couvre les changements de cette unité et de chaque unité placée sous elle dans l'organigramme actuel.",
   "active": "Désactivez la règle pour qu'elle cesse de s'appliquer sans la supprimer.",
   "limitClass": "La classe de changement que borne cette limite. Elle doit faire partie des classes que la règle autorise.",
   "limitName": "Ce que borne la limite : les changements par proposition pour toute classe, les valeurs de réveil pour Réglage du réveil, ou le poids du trafic pour Poids du déploiement.",
   "minimum": "La plus petite valeur autorisée, ou vide pour aucune borne inférieure. Zéro ou plus.",
   "maximum": "La plus grande valeur autorisée, ou vide pour aucune borne supérieure. Zéro ou plus."
  }
 },
 "views": {
  "organizationDetail": {
   "tabs": {
    "proposals": "Les changements proposés par les agents de direction de cette organisation, avec la décision prise pour chacun."
   },
   "appliedProposal": "Cette révision enregistre une proposition d'un agent de direction qui a été appliquée. Annulez-la pour revenir sur la proposition."
  }
 }
});

// Change rules and proposals (AA8.12): the explainer of the Change rules page.
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
 "changeRules": {
  "title": "Règles de changement",
  "p1": "Un agent de direction est un agent qui dirige une unité organisationnelle et dont le déploiement dispose de l'accès de gestion de direction. Il peut proposer des changements aux unités placées sous lui, jamais à lui-même, à ce qui est au-dessus, aux secrets, aux budgets ni à ces règles.",
  "p2": "Une règle de changement approuve à l'avance des changements courants. Elle désigne l'unité dont elle couvre le sous-arbre, les classes de changement qu'elle autorise et des limites facultatives, par exemple au plus deux changements par proposition ou un intervalle de réveil d'au moins une minute. Quand des règles couvrent chaque changement d'une proposition, celle-ci s'applique aussitôt ; tout le reste attend une personne dans l'onglet Propositions de l'organisation.",
  "p3": "Chaque proposition appliquée est enregistrée comme révision de l'organisation : vous pouvez donc l'annuler. Seules des personnes écrivent les règles."
 }
});

// Evaluations (AA9.9, AA9.15): tooltips of the evaluation pages, forms, and the new enums.
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
   "evaluations": "Jeux d'évaluation : des cas versionnés qui notent un agent, approuvés par une personne avant de conditionner une promotion.",
   "evalRuns": "Exécutions d'évaluation : chaque exécution d'un jeu d'évaluation sur un déploiement ou une révision d'agent, suivie cas par cas.",
   "shadowTrials": "Essais fantômes : un déploiement candidat répond à des copies d'entrées réelles sans agir, et les sorties sont comparées.",
   "canaryReleases": "Diffusions canari : un déploiement candidat reçoit davantage de trafic étape par étape et revient en arrière de lui-même s'il se comporte mal."
  }
 },
 "enums": {
  "resourceType": {
   "EvalSet": "Les jeux d'évaluation et leurs cas. Lecture les affiche ; Création et Mise à jour les écrivent ; seules les personnes les approuvent.",
   "EvalRun": "Les exécutions d'un jeu sur un déploiement ou une révision. Exécution les lance et les annule.",
   "ShadowTrial": "Les essais fantômes qui copient les entrées d'un déploiement vers un candidat. Création en lance un ; Mise à jour l'arrête.",
   "CanaryRelease": "Les diffusions canari qui déplacent le trafic d'un agent par étapes. Création en lance une ; Mise à jour l'interrompt."
  },
  "notificationEvent": {
   "CanaryRolledBack": "Une diffusion canari est revenue en arrière parce que le taux d'erreur ou la note d'évaluation du candidat est sorti de ses limites."
  },
  "runKind": {
   "Eval": "Un cas d'une exécution d'évaluation : l'entrée du cas envoyée au déploiement ou à la révision notée.",
   "Shadow": "Une copie d'une entrée réelle rejouée sur le candidat d'un essai fantôme. Elle ne peut agir sur rien."
  },
  "evalSetState": {
   "Draft": "En cours de rédaction. Les cas peuvent changer, et le jeu ne peut pas encore conditionner une promotion.",
   "Approved": "Une personne a approuvé cette version. Elle reste telle quelle et peut conditionner les promotions et les diffusions canari."
  },
  "evalSetOrigin": {
   "Human": "Une personne a écrit ce jeu dans le tableau de bord ou via l'API.",
   "Evaluator": "Un agent a écrit ce jeu. Il ne conditionne une promotion que s'il vient de l'extérieur de la sous-arborescence de l'agent noté.",
   "Playground": "Le jeu est né de tours enregistrés depuis le bac à sable de l'atelier."
  },
  "evalScorer": {
   "ExactMatch": "La sortie doit être exactement égale au texte, sans tenir compte des espaces autour.",
   "Contains": "La sortie doit contenir le texte quelque part.",
   "JsonSchemaValid": "La sortie doit être du JSON conforme au JSON Schema.",
   "Judge": "L'agent juge du jeu lit l'entrée, la réponse de référence et la sortie, puis la note."
  },
  "evalRunStatus": {
   "Pending": "En attente du lancement de son premier cas.",
   "Running": "Des cas s'exécutent en ce moment ; la page les suit à mesure qu'ils se terminent.",
   "Completed": "Tous les cas sont terminés et l'exécution a une note.",
   "Failed": "L'exécution s'est arrêtée tôt, par exemple quand son budget était épuisé. Le motif figure sur l'exécution.",
   "Cancelled": "Une personne a annulé l'exécution avant la fin de tous les cas."
  },
  "evalRunTarget": {
   "AgentRevision": "Une révision d'agent s'exécute sur un déploiement temporaire : le trafic réel n'est donc pas touché.",
   "Deployment": "Un déploiement exécute les cas avec sa configuration actuelle."
  },
  "evalRunInputMode": {
   "Cases": "Les cas propres au jeu, avec leurs contrôles.",
   "RecentInputs": "Les entrées réussies les plus récentes du déploiement, notées par l'agent juge."
  },
  "shadowTrialStatus": {
   "Running": "Les exécutions de la source sont en train d'être copiées vers le candidat.",
   "Completed": "L'essai a atteint son heure de fin.",
   "Stopped": "Une personne a arrêté l'essai.",
   "Failed": "L'essai n'a pas pu continuer. Le motif figure sur l'essai."
  },
  "canaryStatus": {
   "Running": "Le candidat est sur l'une des étapes et reçoit une partie du trafic.",
   "Promoted": "Toutes les étapes ont réussi, et le candidat reçoit tout le trafic.",
   "RolledBack": "Le candidat est sorti de ses limites, et les poids ont retrouvé leurs valeurs précédentes.",
   "Aborted": "Une personne a interrompu la diffusion, et les poids ont retrouvé leurs valeurs précédentes."
  }
 },
 "filters": {
  "state": "Afficher uniquement les enregistrements dans cet état, par exemple brouillon ou approuvé.",
  "latestOnly": "Afficher uniquement la version la plus récente de chaque jeu d'évaluation, ou toutes les versions.",
  "set": "Afficher uniquement les exécutions de cette version du jeu d'évaluation."
 },
 "evals": {
  "reason": "Pourquoi vous l'arrêtez. Facultatif ; le motif est conservé avec l'enregistrement et dans le journal d'audit.",
  "verdict": {
   "passed": "La note pondérée a atteint le seuil.",
   "failed": "La note pondérée est restée sous le seuil.",
   "none": "L'exécution est encore en cours, ou elle n'a pas de seuil à atteindre."
  },
  "outcome": {
   "passed": "La note pondérée du cas a réussi.",
   "failed": "Le cas s'est exécuté, mais ses contrôles n'ont pas réussi.",
   "errored": "L'exécution du cas a échoué : le cas a donc obtenu zéro."
  },
  "actions": {
   "runSet": "Exécuter un jeu d'évaluation sur un déploiement ou une révision d'agent.",
   "openSet": "Ouvrir la version du jeu d'évaluation utilisée pour noter cette exécution.",
   "cancelRun": "Arrêter l'exécution et annuler les cas non terminés.",
   "stopTrial": "Cesser de copier des exécutions vers le candidat. Les décomptes actuels sont conservés.",
   "abortCanary": "Arrêter la diffusion et remettre les deux déploiements aux poids qu'ils avaient avant.",
   "copyId": "Copier l'ID pour l'API REST, les SDKs ou les outils MCP."
  },
  "case": {
   "name": "Un nom court pour le cas, affiché dans les résultats d'exécution.",
   "inputText": "Ce que l'agent reçoit comme entrée quand le cas s'exécute.",
   "expectedText": "La réponse de référence. Les contrôles sans texte propre s'y comparent.",
   "hidden": "Cacher l'entrée et la sortie attendue aux agents notés. Leurs exécutions ne voient que la note.",
   "checks": "La façon dont la sortie est notée. Chaque contrôle donne une note de 0 à 1, et la note du cas est leur moyenne pondérée.",
   "scorer": "La façon dont ce contrôle note la sortie.",
   "weight": "Le poids de ce contrôle dans la note du cas, de 0 à 100. Zéro affiche le contrôle sans le compter.",
   "argument": {
    "ExactMatch": "Le texte exact auquel la sortie doit être égale. Vide : utilise la sortie attendue du cas.",
    "Contains": "Le texte que la sortie doit contenir. Vide : utilise la sortie attendue du cas.",
    "JsonSchemaValid": "Le JSON Schema auquel la sortie doit se conformer.",
    "Judge": "Ce que le juge recherche, en mots simples. Facultatif ; le juge lit aussi la sortie attendue."
   },
   "addCheck": "Ajouter une autre façon de noter la sortie.",
   "removeCheck": "Retirer ce contrôle du cas.",
   "save": "Enregistrer le cas dans cette version brouillon.",
   "saveNextVersion": "Enregistrer le cas. La version approuvée reste telle quelle, et la modification va dans la version suivante."
  },
  "run": {
   "setId": "La version du jeu d'évaluation à exécuter.",
   "targetType": "Noter un déploiement tel qu'il fonctionne aujourd'hui, ou une révision d'agent sur un déploiement temporaire.",
   "deploymentId": "Le déploiement dont les réponses sont notées.",
   "agentId": "L'agent dont la révision est notée.",
   "agentRevisionId": "Un ID de révision précis. Vide : utilise la révision brouillon de l'agent.",
   "inputMode": "Exécuter les cas du jeu, ou rejouer les entrées récentes du déploiement pour que le juge les note.",
   "recentInputCount": "Le nombre de dernières entrées réussies du déploiement à rejouer.",
   "thresholdPercent": "La note que l'exécution doit atteindre pour réussir. Vide : l'exécution n'a pas de verdict.",
   "budgetUsd": "Le montant maximal que les exécutions des cas et du juge peuvent dépenser ensemble. Vide signifie aucun budget.",
   "start": "Lancer l'exécution d'évaluation et ouvrir sa page."
  },
  "save": {
   "open": "Enregistrer l'entrée et la réponse de ce tour comme cas d'un jeu d'évaluation.",
   "set": "Le jeu d'évaluation qui reçoit le cas. Un cas ajouté à une version approuvée va dans sa version suivante.",
   "newSetName": "Le nom du nouveau jeu d'évaluation. Il reste le même d'une version à l'autre.",
   "submit": "Enregistrer le cas avec l'exécution du bac à sable comme source.",
   "done": "Fermer et rester dans le bac à sable.",
   "openSet": "Ouvrir le jeu d'évaluation avec ses cas.",
   "runSet": "Ouvrir le jeu et l'exécuter sur la révision brouillon exécutée par le bac à sable."
  },
  "setDetail": {
   "back": "Revenir à la liste des jeux d'évaluation.",
   "viewJson": "Voir cette version et ses cas tels que l'API les renvoie.",
   "edit": "Modifier la description, l'agent juge et les étiquettes.",
   "editApproved": "Modifier le jeu. La version approuvée reste telle quelle, et la modification crée la version suivante.",
   "delete": "Supprimer cette version brouillon. Les versions approuvées sont conservées.",
   "approve": "Approuver cette version pour qu'elle puisse conditionner les promotions et les diffusions canari. Seules les personnes approuvent.",
   "approveEmpty": "Ajoutez d'abord un cas. Un jeu vide ne peut pas être approuvé.",
   "runEmpty": "Ajoutez d'abord un cas. Un jeu vide n'a rien à exécuter.",
   "cases": "Les cas de cette version dans l'ordre où ils s'exécutent.",
   "addCase": "Ajouter un cas à la fin de ce brouillon.",
   "addCaseApproved": "Ajouter un cas. Il va dans la version suivante, un nouveau brouillon, et cette version reste telle quelle.",
   "editCase": "Modifier l'entrée, la sortie attendue ou les contrôles de ce cas.",
   "editCaseApproved": "Modifier ce cas. La modification va dans la version suivante, un nouveau brouillon.",
   "removeCase": "Retirer le cas du brouillon.",
   "openSourceRun": "Ouvrir l'exécution depuis laquelle le cas a été enregistré.",
   "versions": "Toutes les versions de ce jeu, de la plus récente à la plus ancienne.",
   "openVersion": "Ouvrir cette version du jeu.",
   "runs": "Les dernières exécutions d'évaluation de cette version.",
   "allRuns": "Ouvrir la liste des exécutions d'évaluation filtrée sur cette version.",
   "openRun": "Ouvrir l'exécution d'évaluation avec les résultats de ses cas.",
   "fields": {
    "state": "Brouillon pendant la rédaction ; Approuvé dès qu'une personne l'a approuvé.",
    "origin": "Qui ou quoi a écrit le jeu : une personne, un agent ou le bac à sable de l'atelier.",
    "judgeAgent": "L'agent qui note les contrôles Agent juge, les cas sans sortie attendue et les entrées récentes.",
    "tags": "Des étiquettes pour retrouver le jeu.",
    "authoredBy": "La personne ou l'agent qui a écrit cette version.",
    "approvedBy": "La personne qui a approuvé cette version, et quand.",
    "previousVersion": "La version à partir de laquelle celle-ci a été créée.",
    "lastUpdateUtc": "La dernière modification de cette version. Survolez pour voir depuis combien de temps.",
    "description": "Ce que le jeu vérifie, en mots simples."
   },
   "columns": {
    "order": "L'ordre dans lequel les cas s'exécutent.",
    "name": "Le nom du cas.",
    "input": "Ce que l'agent reçoit. Survolez pour voir le texte complet.",
    "expected": "La réponse de référence. Survolez pour voir le texte complet.",
    "scorers": "Les contrôles qui notent le cas, ou la notation par défaut s'il n'en a aucun.",
    "hidden": "Les cas masqués ne montrent aux agents notés que leur note.",
    "source": "L'exécution depuis laquelle ce cas a été enregistré, quand il vient du bac à sable."
   },
   "versionColumns": {
    "version": "Le numéro de version.",
    "state": "Brouillon ou approuvé.",
    "caseCount": "Le nombre de cas que contient la version.",
    "approvedBy": "La personne qui a approuvé la version.",
    "lastUpdateUtc": "La dernière modification de la version."
   },
   "runColumns": {
    "run": "L'ID de l'exécution d'évaluation. Ouvrez-la pour voir les résultats des cas.",
    "status": "Où en est l'exécution.",
    "verdict": "Si la note a atteint le seuil.",
    "score": "La note pondérée, de 0 à 100 pour cent.",
    "target": "Le déploiement ou la révision d'agent qui a été noté.",
    "createdUtc": "Le moment où l'exécution a commencé."
   }
  },
  "runDetail": {
   "back": "Revenir à la liste des exécutions d'évaluation.",
   "viewJson": "Voir l'exécution telle que l'API la renvoie.",
   "live": "Les mises à jour arrivent par le canal en direct à mesure que chaque cas se termine.",
   "polling": "Le canal en direct n'est pas connecté : la page vérifie donc les mises à jour toutes les quelques secondes.",
   "progress": "Les cas terminés jusqu'ici, sur l'ensemble des cas de l'exécution.",
   "results": "Une ligne par cas, dans l'ordre. Les lignes en échec et en erreur sont mises en évidence.",
   "failingOnly": "Afficher uniquement les cas en échec ou en erreur.",
   "open": "Ouvrir le cas avec sa sortie attendue, sa sortie et tous ses contrôles.",
   "openAgent": "Ouvrir l'agent qui a été noté.",
   "openDraft": "Ouvrir le brouillon d'atelier dont la révision a été notée.",
   "openCaseRun": "Ouvrir l'exécution qui a répondu à ce cas.",
   "openSourceRun": "Ouvrir l'exécution dont provient le cas ou l'entrée récente.",
   "openJudgeRun": "Ouvrir l'exécution de l'agent juge qui a noté ce contrôle.",
   "input": "Ce que l'agent a reçu.",
   "diff": "Les lignes présentes uniquement dans la sortie attendue sont marquées d'un moins ; celles présentes uniquement dans la sortie de l'agent, d'un plus.",
   "output": "Ce que l'agent a répondu.",
   "checks": "Chaque contrôle avec sa notation, son poids, sa note et la remarque de la notation.",
   "kpi": {
    "score": "La moyenne pondérée des notes des cas, comparée au seuil de réussite.",
    "passed": "Les cas dont les contrôles ont réussi, sur l'ensemble des cas.",
    "errored": "Les cas dont l'exécution a échoué. Ils obtiennent zéro.",
    "cost": "Ce qu'ont dépensé les exécutions des cas et du juge, comparé au budget."
   },
   "fields": {
    "target": "Le déploiement, ou l'agent et la révision, qui a été noté.",
    "targetType": "Si c'est un déploiement ou une révision d'agent qui a été noté.",
    "inputMode": "Les cas du jeu, ou les entrées récentes d'un déploiement.",
    "startedBy": "La personne, l'identifiant ou l'agent qui a lancé l'exécution.",
    "createdUtc": "Le moment où l'exécution a été lancée.",
    "completedUtc": "Le moment où le dernier cas s'est terminé.",
    "studioDraftId": "Le brouillon d'atelier pour lequel un agent de direction a lancé cette évaluation."
   },
   "columns": {
    "order": "L'ordre dans lequel le cas s'est exécuté.",
    "case": "Le nom du cas, ou son numéro.",
    "outcome": "Réussi, échoué ou en erreur.",
    "score": "La note pondérée du cas, de 0 à 100 pour cent.",
    "checks": "Le nombre de contrôles du cas qui ont réussi.",
    "output": "Le début de la réponse de l'agent, ou l'erreur. Survolez pour en voir plus.",
    "open": "Ouvrez un cas pour voir la comparaison et les remarques de notation."
   },
   "checkColumns": {
    "scorer": "La façon dont ce contrôle a noté la sortie.",
    "weight": "Le poids du contrôle dans la note du cas.",
    "score": "La note de ce contrôle, de 0 à 100 pour cent.",
    "outcome": "Si ce contrôle a réussi.",
    "note": "Ce que la notation a dit de la sortie, par exemple le raisonnement du juge.",
    "judgeRun": "L'exécution de l'agent juge pour ce contrôle, quand un juge l'a noté."
   }
  },
  "shadowDetail": {
   "back": "Revenir à la liste des essais fantômes.",
   "viewJson": "Voir l'essai tel que l'API le renvoie.",
   "kpi": {
    "compared": "Les exécutions copiées dont la sortie du candidat a été comparée à celle de la source.",
    "agreed": "Les comparaisons où la sortie du candidat correspondait à celle de la source.",
    "diverged": "Les comparaisons où la sortie du candidat différait de celle de la source.",
    "failures": "Les exécutions copiées qui ont échoué sur le candidat.",
    "agreement": "Les comparaisons concordantes sur l'ensemble des comparaisons."
   },
   "fields": {
    "source": "Le déploiement dont les exécutions réussies sont copiées. Il n'est pas touché.",
    "candidate": "Le déploiement qui rejoue les copies comme exécutions fantômes.",
    "samplePercent": "La part des exécutions de la source qui est copiée.",
    "comparison": "La façon dont les deux sorties sont comparées.",
    "endsUtc": "Le moment où l'essai se termine de lui-même.",
    "createdBy": "La personne qui a lancé l'essai.",
    "createdUtc": "Le moment où l'essai a commencé.",
    "completedUtc": "Le moment où l'essai s'est terminé."
   }
  },
  "canaryDetail": {
   "back": "Revenir à la liste des diffusions canari.",
   "viewJson": "Voir la diffusion telle que l'API la renvoie.",
   "openAgent": "Ouvrir l'agent dont la diffusion déplace le trafic.",
   "steps": "Les étapes de la diffusion dans l'ordre, avec celle où se trouve le candidat.",
   "columns": {
    "step": "Le numéro de l'étape.",
    "weightPercent": "La part du trafic de l'agent que reçoit le candidat pendant l'étape.",
    "minimumRuns": "Les exécutions du candidat qui doivent se terminer avant que l'étape puisse avancer.",
    "minimumMinutes": "Les minutes que l'étape doit durer avant de pouvoir avancer.",
    "state": "Terminée, l'étape en cours, l'étape où la diffusion s'est arrêtée, ou encore à venir."
   },
   "stepStates": {
    "done": "L'étape a réussi et la diffusion est passée à la suivante.",
    "current": "Le candidat est sur cette étape en ce moment.",
    "stopped": "La diffusion s'est terminée sur cette étape.",
    "pending": "La diffusion n'a pas encore atteint cette étape."
   },
   "fields": {
    "agent": "L'agent dont le trafic est déplacé entre les deux déploiements.",
    "candidate": "Le déploiement en cours de diffusion, avec son poids d'avant la diffusion.",
    "baseline": "Le déploiement qui garde le reste du trafic, avec son poids d'avant.",
    "maxErrorRatePercent": "Au-delà de cette part d'exécutions candidates échouées dans une étape, la diffusion revient en arrière.",
    "gate": "Si elle est définie, une étape n'avance que tant que la dernière note d'évaluation reste égale ou supérieure au minimum.",
    "stepStartedUtc": "Le moment où l'étape en cours a commencé.",
    "createdBy": "La personne qui a lancé la diffusion.",
    "completedUtc": "Le moment où la diffusion s'est terminée."
   }
  },
  "filters": {
   "state": "Afficher uniquement les versions brouillon ou uniquement les versions approuvées.",
   "origin": "Afficher uniquement les jeux écrits par des personnes, par des agents, ou enregistrés depuis le bac à sable."
  }
 },
 "resources": {
  "evalSets": {
   "add": "Créer la version 1 d'un nouveau jeu d'évaluation. Ajoutez ses cas sur la page du jeu.",
   "name": "Le nom du jeu. Il reste le même d'une version à l'autre.",
   "version": "Le numéro de version. Modifier une version approuvée crée la suivante.",
   "state": "Brouillon ou approuvé. Seules les versions approuvées peuvent conditionner les promotions.",
   "origin": "Écrit par une personne, par un agent, ou enregistré depuis le bac à sable.",
   "caseCount": "Le nombre de cas que contient cette version.",
   "judgeAgent": "L'agent qui note les contrôles Agent juge et les cas sans sortie attendue.",
   "tags": "Des étiquettes pour retrouver le jeu.",
   "authoredByName": "La personne ou l'agent qui a écrit cette version.",
   "approvedByName": "La personne qui a approuvé cette version. Survolez pour voir quand.",
   "description": "Ce que le jeu vérifie. Survolez pour voir le texte complet.",
   "lastUpdateUtc": "La dernière modification de cette version. Survolez pour voir l'heure exacte.",
   "id": "L'ID de la version du jeu d'évaluation (evs_...), pour l'API REST, les SDKs et les outils MCP."
  },
  "evalRuns": {
   "setName": "Le jeu d'évaluation et la version qui ont été exécutés.",
   "status": "Où en est l'exécution : en attente, en cours, terminée, échouée ou annulée.",
   "verdict": "Si la note a atteint le seuil.",
   "score": "La moyenne pondérée des notes des cas.",
   "threshold": "La note que l'exécution devait atteindre pour réussir.",
   "progress": "Les cas terminés et réussis, sur l'ensemble des cas.",
   "target": "Le déploiement ou la révision d'agent qui a été noté.",
   "inputMode": "Les cas du jeu, ou les entrées récentes d'un déploiement.",
   "costUsd": "Ce qu'ont dépensé les exécutions des cas et du juge.",
   "startedByName": "La personne, l'identifiant ou l'agent qui a lancé l'exécution.",
   "createdUtc": "Le moment où l'exécution a commencé. Survolez pour voir l'heure exacte.",
   "id": "L'ID de l'exécution d'évaluation (evr_...), pour l'API REST, les SDKs et les outils MCP."
  },
  "shadowTrials": {
   "add": "Commencer à copier une part des exécutions d'un déploiement vers un déploiement candidat du même agent.",
   "name": "Un nom court pour l'essai.",
   "status": "En cours, terminé, arrêté ou échoué.",
   "source": "Le déploiement dont les exécutions sont copiées.",
   "candidate": "Le déploiement qui rejoue les copies.",
   "samplePercent": "La part des exécutions de la source qui est copiée.",
   "comparedCount": "Les copies dont les sorties ont été comparées.",
   "agreedCount": "Les comparaisons où les sorties concordaient.",
   "divergedCount": "Les comparaisons où les sorties différaient.",
   "candidateFailureCount": "Les copies qui ont échoué sur le candidat.",
   "agreement": "Les comparaisons concordantes sur l'ensemble des comparaisons.",
   "endsUtc": "Le moment où l'essai se termine de lui-même, ou Jusqu'à l'arrêt.",
   "createdUtc": "Le moment où l'essai a commencé. Survolez pour voir l'heure exacte.",
   "id": "L'ID de l'essai fantôme (shd_...), pour l'API REST, les SDKs et les outils MCP.",
   "sourceDeploymentId": "Le déploiement dont les exécutions réussies sont copiées. Ses propres exécutions ne sont pas touchées.",
   "candidateDeploymentId": "Un autre déploiement du même agent qui répond aux copies sans agir.",
   "comparisonEvalSetId": "Un jeu d'évaluation dont les contrôles comparent les sorties. Vide : compare le texte normalisé.",
   "useJudge": "Demander à l'agent juge si la réponse du candidat concorde avec celle de la source."
  },
  "canaryReleases": {
   "add": "Commencer à déplacer par étapes le trafic d'un agent vers un déploiement candidat.",
   "agent": "L'agent dont le trafic passe d'un déploiement à l'autre.",
   "status": "En cours, promue, revenue en arrière ou interrompue.",
   "candidate": "Le déploiement en cours de diffusion.",
   "baseline": "Le déploiement qui garde le reste du trafic.",
   "step": "L'étape où se trouve la diffusion et la part du trafic du candidat.",
   "maxErrorRatePercent": "Le taux d'erreur du candidat qui fait revenir la diffusion en arrière.",
   "gate": "Le jeu d'évaluation et la note minimale dont une étape a besoin pour avancer, le cas échéant.",
   "rollbackReason": "Pourquoi la diffusion est revenue en arrière ou a été interrompue. Survolez pour voir le texte complet.",
   "createdUtc": "Le moment où la diffusion a commencé. Survolez pour voir l'heure exacte.",
   "id": "L'ID de la diffusion canari (cnr_...), pour l'API REST, les SDKs et les outils MCP.",
   "agentId": "L'agent dont les deux déploiements se partagent le trafic.",
   "baselineDeploymentId": "Le déploiement qui sert le trafic que le candidat ne reçoit pas.",
   "candidateDeploymentId": "Le déploiement qui reçoit davantage de trafic à chaque étape.",
   "steps": "Les parts de trafic que le candidat franchit, chacune avec un minimum d'exécutions et de minutes.",
   "weightPercent": "La part du trafic du candidat pendant cette étape, de 1 à 100.",
   "minimumRuns": "Les exécutions du candidat qui doivent se terminer pendant l'étape avant qu'elle puisse avancer.",
   "minimumMinutes": "Les minutes que l'étape doit durer avant de pouvoir avancer.",
   "evalSetId": "Un jeu d'évaluation dont la dernière exécution doit atteindre la note minimale pour qu'une étape avance.",
   "minEvalScorePercent": "La note d'évaluation la plus basse, en pourcentage, qui permet à une étape d'avancer."
  }
 }
});

// Evaluations (AA9.15): the explainers of the evaluation pages.
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
 "evalSets": {
  "title": "Jeux d'évaluation",
  "p1": "Un jeu d'évaluation est une liste de cas : une entrée, la réponse attendue et des contrôles qui notent la sortie de l'agent de 0 à 1. Un cas peut être masqué pour que les agents notés ne voient que sa note.",
  "p2": "Les jeux sont versionnés. Une personne approuve une version brouillon, et une version approuvée ne change plus jamais : elle peut donc conditionner les promotions vers un environnement et les diffusions canari. Modifier une version approuvée crée la version suivante en brouillon.",
  "p3": "Le plus rapide pour commencer est le bac à sable de l'atelier : enregistrez comme cas un tour qui vous plaît, puis exécutez le jeu sur la révision brouillon."
 },
 "evalRuns": {
  "title": "Exécutions d'évaluation",
  "p1": "Une exécution d'évaluation envoie chaque cas d'une version de jeu à un déploiement, ou à une révision d'agent sur un déploiement temporaire, et note chaque réponse avec les contrôles du cas.",
  "p2": "La note de l'exécution est la moyenne pondérée des notes de ses cas, et elle réussit quand cette note atteint le seuil. Un budget arrête l'exécution dès que les exécutions des cas et du juge l'ont dépensé."
 },
 "shadowTrials": {
  "title": "Essais fantômes",
  "p1": "Un essai fantôme copie une part des exécutions réussies d'un déploiement vers un déploiement candidat du même agent. Les copies tournent comme exécutions fantômes, qui ne peuvent pas utiliser d'outils à effet, envoyer de messages, écrire en mémoire ni déposer de rapports.",
  "p2": "Chaque réponse du candidat est comparée à celle de la source : comme texte normalisé, avec un jeu d'évaluation ou par l'agent juge. L'essai compte combien de fois elles concordent et combien de fois le candidat échoue."
 },
 "canaryReleases": {
  "title": "Diffusions canari",
  "p1": "Une diffusion canari déplace par étapes le trafic d'un agent vers un déploiement candidat. Chaque étape dure un minimum d'exécutions et de minutes avant de pouvoir avancer.",
  "p2": "Tant que le taux d'erreur du candidat, et la dernière note d'évaluation quand la diffusion a une condition d'évaluation, restent dans leurs limites, la diffusion avance et le candidat est promu après la dernière étape. Sinon, elle revient aux poids d'avant, et une notification Diffusion canari revenue en arrière est envoyée."
 }
});

// Tooltips for the Import / Export hub button and the connection links and picker (AA12).
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
 "runtime": {
  "importExport": "Ouvre la page des manifestes pour appliquer un manifeste YAML ou exporter la configuration de ce locataire vers le contrôle de version.",
  "manage": "Ouvre la page Connexions pour ajouter, consulter ou modifier les harnesses et points de terminaison d'API enregistrés utilisés par les agents.",
  "manageThis": "Ouvre cette connexion dans un nouvel onglet de la page Connexions pour consulter ou modifier son modèle, son point de terminaison et ses identifiants.",
  "configureFirst": "Aucune connexion enregistrée pour l'instant. Ce lien ouvre la page Connexions dans un nouvel onglet pour en créer une.",
  "harness": "Le CLI de harness ou l'API HTTP exécuté par cette connexion. En choisir un remplit ses valeurs par défaut ; Harness personnalisé part d'un profil vide."
 }
});

// Tooltips for the activity trail (LP2): views, summary, filters, columns, the step drawer, step kinds, and link kinds.
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
 "trail": {
  "tab": "Suivez cette demande à travers chaque agent : messages, exécutions enfants, rapports, escalades, approbations et effets d'outils, de la demande de départ jusqu'à la réponse.",
  "refresh": "Recharger le parcours maintenant. Tant qu'une étape est en cours, il se rafraîchit aussi à l'intervalle choisi à côté de ce bouton.",
  "exportJson": "Télécharger le parcours en JSON : étapes, liens, états, heures, jetons et coût. Il ne contient aucun texte écrit par des agents.",
  "openTrail": "Ouvrir le parcours d'activité de cette exécution avec cette étape sélectionnée, pour voir ce qui y a mené et ce qui en a découlé.",
  "openStep": "Ouvrir les détails de cette étape : son état, ses heures, son coût et l'enregistrement qui se trouve derrière.",
  "keysHint": "Tab atteint l'étape sélectionnée. Haut et Bas parcourent les étapes dans l'ordre chronologique, Gauche et Droite passent au couloir voisin, Début et Fin vont à la première et à la dernière étape, et Entrée ouvre les détails.",
  "truncationSetting": "Ouvrir les paramètres, où un administrateur peut changer le nombre d'étapes, de sauts de messages et d'heures que peut couvrir un parcours.",
  "views": {
   "sequence": "Un couloir par agent, le temps s'écoulant vers le bas. Idéal pour lire une demande du début jusqu'à la réponse.",
   "graph": "Chaque étape une colonne après sa cause. Idéal pour voir d'un coup d'œil les éventails et les boucles.",
   "list": "Chaque étape sous forme de ligne de tableau à filtrer et à trier. Elle contient les mêmes informations que les diagrammes."
  },
  "zoom": {
   "in": "Agrandir la séquence. Faites glisser le fond vide ou faites défiler pour vous déplacer.",
   "out": "Réduire la séquence pour voir plus d'étapes à la fois.",
   "reset": "Remettre l'échelle à 100 pour cent."
  },
  "summary": {
   "agents": "Combien d'agents différents ont pris part à ce parcours.",
   "hops": "Combien de messages sont passés d'un agent à l'autre en chemin. Le serveur cesse de les suivre à sa limite de sauts.",
   "duration": "Temps écoulé entre le début de la première étape et la fin de la dernière.",
   "tokens": "Jetons d'entrée et de sortie additionnés sur toutes les exécutions du parcours.",
   "cost": "Coût en dollars américains additionné sur toutes les exécutions du parcours qui en ont déclaré un.",
   "failures": "Étapes qui ont échoué, dépassé leur délai, expiré, ou ont été rejetées ou refusées."
  },
  "filters": {
   "kind": "N'afficher que les étapes d'une nature, comme les messages ou les exécutions.",
   "agent": "N'afficher que les étapes du couloir d'un agent ou du demandeur.",
   "state": "N'afficher que les étapes dans un état, comme Échouée."
  },
  "columns": {
   "order": "La position de l'étape dans l'ordre chronologique, en comptant depuis la demande.",
   "step": "Ce qu'est l'étape : une exécution et son type, un message, un rapport, un effet d'outil, etc.",
   "agent": "L'agent dans le couloir duquel se trouve l'étape, ou Demandeur pour la demande et la réponse.",
   "state": "L'état de l'étape, avec une icône et un libellé.",
   "reachedBy": "Comment le parcours est arrivé à cette étape depuis celle qui l'a causée, par exemple a envoyé ou a réveillé.",
   "started": "Quand l'étape a commencé.",
   "duration": "Combien de temps l'étape a duré, une fois terminée.",
   "unit": "L'unité de l'organisation à laquelle appartenait l'agent au début de l'étape.",
   "runKind": "Pour une exécution, comment elle a commencé : invoquée, déléguée, réveillée par un message, lancée par un gardien, etc.",
   "tokens": "Jetons d'entrée plus jetons de sortie d'une exécution.",
   "cost": "Coût d'une exécution en dollars américains, déclaré ou estimé.",
   "id": "L'ID de l'enregistrement derrière l'étape. Copiez-le pour retrouver l'enregistrement ailleurs.",
   "open": "Ouvrir les détails d'une étape à côté du parcours."
  },
  "drawer": {
   "close": "Fermer les détails et revenir à l'étape dans le parcours.",
   "provenance": "Qui a écrit ce texte et dans quelle exécution. Le texte d'un agent est une donnée issue de cette exécution, pas une instruction qui vous est adressée.",
   "openRecord": "Ouvrir la page de l'enregistrement derrière cette étape.",
   "fields": {
    "kind": "La nature de cette étape.",
    "state": "L'état de l'étape au chargement du parcours.",
    "agent": "L'agent qui a réalisé cette étape, ou la personne ou le demandeur derrière une demande.",
    "unit": "L'unité de l'organisation à laquelle appartenait l'agent au début de l'étape.",
    "runKind": "Comment l'exécution a commencé : invoquée, déléguée, réveillée par un message, lancée par un gardien, etc.",
    "tool": "L'outil Garrison que l'exécution a appelé. Ses arguments ne sont jamais affichés ici.",
    "started": "Quand cette étape a commencé.",
    "ended": "Quand cette étape s'est terminée.",
    "duration": "Combien de temps cette étape a duré du début à la fin.",
    "tokens": "Jetons d'entrée et de sortie de cette exécution.",
    "cost": "Coût de cette exécution en dollars américains.",
    "id": "L'ID de l'enregistrement derrière cette étape.",
    "argumentDigest": "Une empreinte des arguments de l'outil. Le journal des effets la conserve pour reconnaître une répétition sans stocker les arguments.",
    "leaseEpoch": "L'époque du bail de l'exécution au moment de l'appel. Un appel issu d'une époque plus ancienne est refusé."
   }
  },
  "states": {
   "running": "{{state}} : cette étape est encore en cours.",
   "success": "{{state}} : cette étape s'est terminée comme prévu.",
   "danger": "{{state}} : cette étape a échoué ou a été refusée.",
   "neutral": "{{state}} : cette étape a été arrêtée avant la fin."
  },
  "kinds": {
   "Caller": "La personne, le client de l'API ou le canal qui a envoyé la demande par laquelle commence ce parcours.",
   "Trigger": "Un déclencheur, comme une planification ou un webhook, qui a lancé la première exécution.",
   "KeeperTick": "Un gardien s'est réveillé selon sa planification et a lancé une exécution.",
   "Run": "Une exécution d'un agent : un seul lancement de son harness.",
   "Message": "Un message d'un agent à un autre. Il peut réveiller le destinataire dans une nouvelle exécution.",
   "Report": "Un rapport qu'un agent a déposé pour son responsable ou pour le conseil.",
   "Escalation": "Une question qu'un agent a posée à une personne ou à un autre agent parce qu'il était bloqué.",
   "Approval": "Une demande d'autorisation faite par une exécution avant d'utiliser un outil.",
   "Effect": "Un appel d'outil qui a changé quelque chose, consigné dans le journal des effets.",
   "FanOutGroup": "Un groupe d'exécutions enfants qu'une exécution a lancées en même temps et attendues.",
   "PipelineRun": "L'exécution de pipeline dont cette exécution était une étape.",
   "Reply": "La réponse renvoyée au demandeur quand la première exécution s'est terminée.",
   "Redacted": "Une étape que vous ne pouvez pas lire. Seules sa nature et son heure sont affichées."
  },
  "edges": {
   "Started": "Le demandeur, le déclencheur ou le gardien a lancé cette exécution.",
   "Spawned": "Une exécution ou un éventail a lancé cette exécution enfant.",
   "FannedOut": "L'exécution a lancé en même temps un groupe d'exécutions enfants.",
   "Retried": "Cette exécution réessaie l'exécution échouée qui la précède.",
   "Sent": "L'exécution a envoyé ce message.",
   "Woke": "Le message a réveillé son destinataire dans une nouvelle exécution.",
   "Filed": "L'exécution a déposé ce rapport.",
   "Raised": "L'exécution a soulevé cette escalade.",
   "Routed": "L'escalade a été transmise à l'exécution d'un autre agent.",
   "Answered": "La réponse à l'escalade est revenue à l'exécution.",
   "Requested": "L'exécution a demandé cette approbation.",
   "Decided": "Une personne ou une règle a statué sur cette approbation.",
   "Performed": "L'exécution a effectué cet effet d'outil.",
   "Replied": "La réponse de l'exécution est revenue au demandeur."
  }
 }
});

// Tooltips for the organization designer (LP3.2 to LP3.10).
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
 "orgDesigner": {
  "tabs": {
   "design": "Concevoir l'arbre de travail de cette organisation sur un canevas : unités, responsables, membres, lignes transversales, gardiens, budgets et règles de changement applicables.",
   "people": "Le responsable, les membres et les lignes transversales de l'unité, ainsi que les actions pour ajouter une unité en dessous, commencer une ligne transversale ou la retirer.",
   "keepers": "Les gardiens rattachés à chaque personne de l'unité, avec leur prochain réveil. Rattachez-les, détachez-les, créez-les ou replanifiez-les ici.",
   "budget": "Les budgets journalier et mensuel de l'unité, ce que son sous-arbre a dépensé et le montant maximal de chaque budget.",
   "rules": "Les règles de changement qui couvrent cette unité. Des personnes écrivent les règles ; cet onglet les liste et ouvre le formulaire de règle."
  },
  "readOnly": "Cette vue affiche seulement l'organisation. Utilisez l'onglet Conception pour la modifier.",
  "unitOverlay": "Une unité avec son état, ses dépenses et son activité. Sélectionnez-la pour voir ses exécutions récentes.",
  "history": {
   "undo": "Annuler la dernière modification ({{change}}) en envoyant la modification inverse.",
   "redo": "Refaire la modification : {{change}}.",
   "nothingToUndo": "Il n'y a encore rien à annuler.",
   "nothingToRedo": "Il n'y a rien à rétablir."
  },
  "palette": {
   "title": "Les agents de ce locataire. Faites-en glisser un sur une unité, ou choisissez-le puis une unité.",
   "search": "Filtrer les agents par nom.",
   "agent": "Faites-le glisser sur une unité pour l'ajouter comme membre, ou sur la ligne du responsable de l'unité pour qu'il la dirige. Appuyez sur Entrée pour le choisir et le placer au clavier.",
   "newAgent": "Ouvrir le formulaire d'agent. Le nouvel agent rejoint l'unité sélectionnée comme membre.",
   "unit": "L'unité où va l'agent choisi.",
   "as": "Si l'agent rejoint l'unité comme membre ou en devient le responsable.",
   "leadOff": "Ce canevas ne peut pas changer de responsable, l'agent rejoint donc l'unité comme membre.",
   "place": "Ajouter l'agent choisi à l'unité choisie.",
   "cancel": "Reposer l'agent sans le placer."
  },
  "structure": {
   "lead": "L'agent qui dirige l'unité. Laissez vide pour aucun responsable.",
   "title": "Le titre du responsable, par exemple Responsable de la facturation.",
   "setLead": "Faire de cet agent le responsable de l'unité. Un membre qui devient responsable quitte la liste des membres.",
   "parent": "L'unité à laquelle celle-ci rend compte. Une unité ne peut pas rendre compte à elle-même ni à une unité située en dessous.",
   "move": "Déplacer l'unité, avec tout ce qui se trouve en dessous, sous l'unité choisie.",
   "sameParent": "L'unité rend déjà compte à celle-ci."
  },
  "keepers": {
   "open": "Ouvrir la page du gardien.",
   "schedule": "Écrire une nouvelle révision du gardien avec un autre calendrier de réveil.",
   "detach": "Retirer le gardien de ce poste. Le gardien lui-même est conservé.",
   "pick": "Un autre gardien de cet agent à rattacher au poste.",
   "attach": "Rattacher le gardien choisi à ce poste.",
   "create": "Ouvrir le formulaire de gardien avec cet agent déjà renseigné. Le nouveau gardien est rattaché au poste."
  },
  "budget": {
   "period": "Une période de budget. Sa fenêtre recommence chaque jour ou chaque mois.",
   "amount": "Le montant maximal que le sous-arbre de l'unité peut dépenser sur la période, en dollars américains. Laissez vide pour aucun budget.",
   "save": "Enregistrer le budget dans l'arbre de travail. Le serveur refuse un budget supérieur à celui du dessus.",
   "clear": "Supprimer ce budget.",
   "cap": "Le montant maximal de ce budget : celui de l'unité la plus proche au-dessus qui en a un pour la même période."
  },
  "rules": {
   "add": "Ouvrir le formulaire de règle de changement pour cette unité. Une règle couvre l'unité et tout ce qui se trouve en dessous.",
   "edit": "Ouvrir cette règle dans le formulaire de règle de changement."
  },
  "problems": {
   "title": "Les problèmes que les vérifications de publication trouvent dans l'arbre de travail. La liste se met à jour après chaque modification.",
   "show": "Sélectionner l'unité sur le canevas."
  },
  "overlay": {
   "range": "Jusqu'où remontent le nombre d'exécutions, les escalades et le coût.",
   "unit": "L'unité que vous avez sélectionnée dans l'organigramme.",
   "runs": "Un échantillon d'exécutions récentes dans le sous-arbre de cette unité, le même que celui de la page Performances.",
   "openRun": "Ouvrir l'exécution.",
   "openTrail": "Ouvrir le parcours d'activité de l'exécution."
  },
  "chartLayout": {
   "tree": "Afficher l'organigramme sous forme d'arbre de cartes.",
   "canvas": "Afficher l'organigramme sur le canevas, avec l'état, les dépenses et l'activité de chaque unité."
  },
  "templates": {
   "open": "Commencer une nouvelle organisation, vide ou à partir de l'une des organisations d'exemple.",
   "preview": "Exécuter le modèle à blanc et lister ce qu'il créerait ou modifierait.",
   "previewFirst": "Vérifiez d'abord ce que le modèle crée.",
   "apply": "Appliquer le modèle par l'application de manifeste et ouvrir la nouvelle organisation.",
   "contents": "Les ressources du manifeste du modèle, par type et par nom.",
   "blank": "Une organisation vide, sans unités.",
   "gerbil": "L'exemple gerbil : un gardien qui surveille une page d'état, dans une organisation d'une seule unité.",
   "siteReliability": "L'exemple de fiabilité du site : un responsable, trois gardiens, un conservateur de mémoire, des budgets et des lignes transversales."
  }
 }
});

// LP4.1 to LP4.4: tooltips for the Learn page, its diagrams, and the sidebar entry.
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
  "learn": "Ouvre la page Apprendre : sept schémas de l'articulation de Garrison, une visite pour chacun et un glossaire.",
  "hubs": {
   "learn": "Sept schémas de l'articulation de Garrison, du moteur d'exécution aux freins, avec une visite pour chacun et un glossaire."
  }
 },
 "learn": {
  "openPage": "Ouvre la page {{page}} dans le tableau de bord.",
  "openDoc": "Ouvre {{doc}} sur GitHub dans un nouvel onglet.",
  "showList": "Affiche les mêmes blocs et flèches sous forme de liste imbriquée, plus lisible avec un lecteur d'écran ou sur un écran étroit.",
  "showDiagram": "Revient au schéma dessiné.",
  "startTour": "Lance la visite {{tour}}, qui parcourt les pages qu'utilise cette partie de Garrison.",
  "toc": "Va à {{title}} sur cette page.",
  "seeDiagram": "Ouvre la page Apprendre sur le schéma qui montre la place de cette page dans Garrison."
 }
});

// Tooltips for the organization designer's errors and warnings (LP3.7).
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
 "orgDesigner": {
  "problems": {
   "errors": "Les problèmes qui empêchent une publication. Corrigez-les avant de publier une révision.",
   "warnings": "Les problèmes à examiner qui n'empêchent pas une publication."
  }
 }
});

// Tooltips for the guided tours (LP4.5 to LP4.8) and the trail's entry surfaces and new edges (LP1.12, LP1.13).
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
 "tours": {
  "skip": "Fermer la visite. Vous pouvez la relancer depuis Apprendre ou depuis Visite guidée dans la barre latérale.",
  "back": "Revenir à l'étape précédente de la visite.",
  "next": "Passer à l'étape suivante. La visite ouvre la page où elle se trouve.",
  "done": "Terminer la visite et la marquer comme faite pour vous.",
  "hub": "Lance la visite {{tour}}, qui parcourt cette partie du tableau de bord étape par étape.",
  "start": "Lance la visite {{tour}}. Elle ouvre chaque page dont elle parle.",
  "replay": "Vous avez terminé {{tour}}. Refaites-la depuis la première étape.",
  "finished": "Vous avez terminé cette visite. Elle reste marquée pour vous dans ce locataire.",
  "pickerLearn": "Ouvre la page Apprendre : des diagrammes de l'assemblage de Garrison, avec une visite pour chaque partie.",
  "sampleLoad": "Applique maintenant le manifeste de l'exemple. La liste ci-dessus montre tout ce qu'il crée ou modifie.",
  "sampleContinue": "Fait la visite sans l'exemple. Les étapes sans rien à montrer sont passées avec une note.",
  "homeCardOpen": "Ouvre la page Apprendre, avec des diagrammes de l'assemblage de Garrison et une visite pour chaque partie.",
  "homeCardDismiss": "Masquer cette carte. Elle reste masquée pour vous dans ce locataire.",
  "wizardLearn": "Ferme l'assistant et ouvre la page Apprendre.",
  "wizardTour": "Ferme l'assistant et lance la visite Exécuter un agent."
 },
 "trail": {
  "entrySurfaces": {
   "Rest": "Un appel à l'API REST, depuis un script, un SDK ou un autre service.",
   "Mcp": "Un appel d'outil via le serveur MCP de Garrison.",
   "A2a": "Une tâche envoyée par un autre agent via le protocole A2A.",
   "App": "Un tour de chat sur la page utilisateur d'une app agentique.",
   "Dashboard": "Lancée par une personne dans ce tableau de bord, par exemple depuis Invoquer.",
   "Trigger": "Une planification cron ou un webhook signé l'a lancée.",
   "Keeper": "Un gardien s'est réveillé selon son calendrier et a exécuté un cycle.",
   "Message": "Un message à un agent l'a réveillé sous forme de nouvelle exécution.",
   "Escalation": "La réponse à une escalade a repris ou réveillé l'exécution.",
   "Eval": "Un cas d'une exécution d'évaluation.",
   "Shadow": "La copie d'une exécution réelle sur le déploiement candidat, issue d'un essai fantôme.",
   "Internal": "Garrison l'a lancée lui-même, par exemple une nouvelle tentative ou une étape de pipeline."
  },
  "columns": {
   "entrySurface": "Comment la requête qui ouvre ce parcours est arrivée dans Garrison."
  },
  "drawer": {
   "fields": {
    "entrySurface": "Comment la requête est arrivée dans Garrison : l'API, MCP, A2A, une app, le tableau de bord, un déclencheur, un gardien, un message, etc."
   }
  },
  "edges": {
   "Shadowed": "Un essai fantôme a exécuté une copie de cette exécution réelle sur le déploiement candidat, pour comparer les deux.",
   "Delivered": "Le message a atteint une exécution déjà en cours, qui l'a lu dans sa boîte, au lieu de réveiller une nouvelle exécution."
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
})(tips, {
 "turnActivity": {
  "worker": "Aucun nœud de travail n'a encore pris cette exécution. Elle démarre dès qu'un nœud disposant d'une place libre la prend.",
  "approval": "L'exécution s'est arrêtée avant un appel d'outil qui demande une personne. Approuvez-le ou refusez-le dans Approbations.",
  "tool": "Un appel d'outil est en cours. Sa carte montre l'entrée, puis la sortie quand il revient.",
  "working": "La dernière étape est terminée et le modèle décide de la suite. D'autres sorties suivent en général.",
  "quiet": "Rien de nouveau depuis un moment, mais l'exécution n'est pas terminée. Ouvrez l'exécution pour vérifier ses événements et son nœud de travail.",
  "elapsed": "Temps écoulé depuis la dernière sortie ou le dernier événement d'outil."
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
})(tips, {
 "resources": {
  "apps": {
   "appearance": "L'apparence de la page de l'app : textes, visuels, couleurs en clair et en sombre, mise en page et questions de départ, avec un aperçu en direct.",
   "steps": {
    "appearance": "Textes, visuels, palette et couleurs, thème, mise en page et questions de départ de la page, avec un aperçu clair et sombre."
   },
   "subtitle": "Une ligne courte sous le nom de l'app, dans l'en-tête et sur l'accueil. Vide, rien ne s'affiche.",
   "welcomeTitle": "Le grand titre visible avant le premier message. Vide, le nom affiché est utilisé.",
   "composerPlaceholder": "L'indication dans la zone de message vide, par exemple quoi demander. Vide, l'indication standard s'affiche.",
   "agentDisplayName": "Le nom d'auteur des réponses de l'agent, par exemple un personnage. Vide, le nom affiché est utilisé.",
   "agentAvatarAssetId": "Une ressource image, petite et ronde, à côté du nom de l'agent. Choisissez-en une ou envoyez-la ici.",
   "paletteId": "Le modèle d'origine des couleurs, ou Personnalisée dès qu'une couleur change. Simple mention : la page utilise les couleurs ci-dessous.",
   "themeDefault": "Le thème à l'ouverture de la page. Comme le système suit le réglage de chaque appareil.",
   "allowThemeSwitch": "Activé, on peut passer du clair au sombre et la page s'en souvient. Désactivé, le thème par défaut reste.",
   "cornerStyle": "L'arrondi des boutons, zones et messages : carrés, arrondis (par défaut) ou en pastille.",
   "density": "L'espace laissé autour des éléments. Compacte en montre davantage ; Confortable est la valeur par défaut.",
   "showFilesPanel": "Désactivé, le bouton Fichiers et la liste des fichiers de l'agent disparaissent. Les liens vers des fichiers restent de simples liens.",
   "showLanguagePicker": "Désactivé, le menu des langues disparaît. La page suit toujours la langue du navigateur ou un lien ?lang=.",
   "showPoweredBy": "Une petite ligne sous la conversation et sur la page de connexion, avec un lien vers le site Garrison. Désactivé, elle disparaît.",
   "starterPrompts": "Jusqu'à 4 questions suggérées, en boutons dans une nouvelle conversation, de 200 caractères au plus chacune."
  }
 },
 "appAppearance": {
  "sections": {
   "text": "Les textes de la page : sous-titre, titre et texte d'accueil, indication de la zone de message et nom de l'agent.",
   "images": "Le logo, l'icône d'onglet et l'avatar de l'agent. Choisissez une ressource image existante ou envoyez-en une.",
   "colors": "Partez d'une palette, puis ajustez les couleurs. Chacune a une valeur claire et une sombre ; une sombre vide est déduite de la claire.",
   "layout": "Le thème à l'ouverture, l'arrondi des coins, le resserrement des espacements et la police.",
   "show": "Masquez des parties de la page : le bouton de thème, la liste des fichiers, le menu des langues et la mention de la plateforme.",
   "prompts": "Premières questions suggérées, en boutons dans une nouvelle conversation. Un clic l'envoie.",
   "preview": "Une esquisse de la page en clair et en sombre qui suit vos champs. Rien n'est enregistré avant Enregistrer."
  },
  "contrastWarning": "Une partie du texte sur cette couleur n'atteint que {{ratio}}:1. WCAG AA demande 4,5:1 : choisissez une teinte plus claire ou plus foncée.",
  "derived": "Aucune couleur sombre n'est définie : la page la déduit de la claire, même teinte, luminosité ajustée.",
  "sameAsLight": "Sans couleur sombre ni palette, le thème sombre garde la couleur claire, comme avant les palettes.",
  "builtIn": "Aucune des deux couleurs n'est définie : le thème sombre utilise la couleur sombre propre à la page.",
  "darkColor": "{{field}} dans le thème sombre, en #RGB ou #RRGGBB. Laissez vide pour la déduire de la couleur claire.",
  "resetColors": "Efface toutes les couleurs claires et sombres et la palette : la page reprend ses couleurs intégrées dans les deux thèmes.",
  "palette": "Remplit toutes les couleurs claires et sombres avec la palette {{name}}. Vous pourrez ensuite ajuster chaque couleur.",
  "lightColumn": "Couleurs du thème clair. Une couleur vide garde la couleur claire intégrée de la page.",
  "darkColumn": "Couleurs du thème sombre. Une couleur vide est déduite de la claire et affichée à côté.",
  "upload": "Envoie une image de cet ordinateur comme nouvelle ressource et l'utilise comme {{field}}.",
  "prompt": "Une question envoyée en un clic. Restez bref ; Alt+Haut et Alt+Bas la déplacent.",
  "addPrompt": "Ajoute une question de départ vide en fin de liste pour en saisir le texte.",
  "promptsFull": "Une app accepte au plus {{max}} questions de départ. Retirez-en une pour en ajouter une autre."
 }
});
