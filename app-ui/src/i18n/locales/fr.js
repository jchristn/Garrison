// French catalog for the Garrison app UI. Mirrors en.js key for key.

const fr = {
  common: {
    loading: 'Chargement',
    close: 'Fermer',
    cancel: 'Annuler',
    retry: 'Réessayer',
    defaultTitle: 'Application Garrison'
  },
  app: {
    notFoundTitle: 'Application introuvable',
    notFoundBody: "Il n'y a aucune application à cette adresse. Vérifiez le lien que vous avez reçu.",
    noSlugTitle: 'Aucune application sélectionnée',
    noSlugBody: "Ouvrez le lien d'une application précise. Les liens d'application ressemblent à /apps/your-app/.",
    loadErrorTitle: "L'application n'a pas pu être chargée",
    loadErrorBody: "Le serveur n'a pas répondu. Vérifiez votre connexion et réessayez.",
    skipToChat: 'Aller à la conversation'
  },
  signIn: {
    title: 'Se connecter à {{name}}',
    email: 'E-mail',
    password: 'Mot de passe',
    submit: 'Se connecter',
    submitting: 'Connexion en cours',
    anonymous: 'Continuer sans se connecter',
    anonymousNote: 'Les conversations commencées sans connexion restent dans cet onglet du navigateur.',
    or: 'ou',
    sessionEnded: 'Votre session a expiré. Reconnectez-vous pour continuer.'
  },
  header: {
    conversations: 'Conversations',
    files: 'Fichiers',
    signOut: 'Se déconnecter',
    signedInAs: 'Connecté en tant que {{name}}',
    guest: 'Invité',
    themeLight: 'Passer au thème clair',
    themeDark: 'Passer au thème sombre',
    language: 'Langue',
    logoAlt: 'Logo de {{name}}'
  },
  conversations: {
    title: 'Conversations',
    new: 'Nouvelle conversation',
    empty: 'Aucune conversation pour le moment. Envoyez un message pour en commencer une.',
    untitled: 'Conversation du {{date}}',
    messages: 'Messages : {{count}}',
    working: 'En cours',
    loadError: "Vos conversations n'ont pas pu être chargées."
  },
  chat: {
    welcomeDefault: 'Posez une question pour commencer.',
    composerLabel: 'Message',
    composerPlaceholder: 'Écrivez un message',
    composerHint: 'Entrée envoie le message. Maj et Entrée ajoutent une nouvelle ligne.',
    send: 'Envoyer',
    sending: 'Envoi en cours',
    you: 'Vous',
    waiting: "L'agent s'en occupe",
    approval: "En attente de l'approbation d'une étape par un opérateur",
    reconnecting: 'La connexion a été perdue. Reconnexion en cours',
    failed: "Cette réponse n'a pas abouti.",
    details: "Activité de l'agent",
    loadError: "Cette conversation n'a pas pu être chargée.",
    missing: "Cette conversation est introuvable. Elle appartient peut-être à une autre session.",
    busyComposer: "L'agent répond encore. Vous pourrez envoyer votre prochain message quand il aura terminé.",
    dismiss: 'Masquer'
  },
  statuses: {
    Pending: 'En attente de démarrage',
    Queued: 'En attente de démarrage',
    Leased: 'Démarrage',
    Running: 'En cours',
    Cancelling: 'Arrêt en cours',
    Succeeded: 'Terminé',
    Failed: 'Échec',
    Cancelled: 'Annulé',
    TimedOut: 'Délai dépassé',
    Rejected: 'Non autorisé',
    Suspended: 'En pause'
  },
  detailTypes: {
    Thinking: 'Réflexion',
    ToolCall: "Appel d'outil",
    ToolResult: "Résultat d'outil",
    Progress: 'Progression',
    Warning: 'Avertissement'
  },
  files: {
    title: 'Fichiers',
    empty: "L'agent n'a encore écrit aucun fichier dans cette conversation.",
    noConversation: "Les fichiers écrits par l'agent apparaîtront ici dès qu'une conversation commencera.",
    summary: 'Fichiers : {{count}} ({{size}})',
    download: 'Télécharger',
    versions: 'Versions',
    versionsTitle: 'Versions de {{path}}',
    version: 'Version {{number}}',
    current: 'Actuelle',
    updated: 'Mis à jour {{when}}',
    size: 'Taille',
    newBadge: 'Nouveau',
    downloadFailed: "Le téléchargement n'a pas pu démarrer. Réessayez.",
    loadError: "Les fichiers n'ont pas pu être chargés.",
    versionsError: "Les versions n'ont pas pu être chargées.",
    close: 'Fermer les fichiers'
  },
  errors: {
    InvalidCredentials: "L'e-mail ou le mot de passe est incorrect.",
    AppSignInRequired: 'Connectez-vous pour utiliser cette application.',
    AnonymousDisabled: "L'utilisation anonyme de cette application est désactivée. Connectez-vous.",
    AppAccessDenied: "Ce compte n'a pas accès à cette application. Demandez l'accès au propriétaire de l'application.",
    AppSessionRequired: 'Votre session a expiré. Reconnectez-vous pour continuer.',
    ConversationBusy: "L'agent répond encore au message précédent. Attendez qu'il ait terminé, puis renvoyez votre message.",
    AppRateLimited: 'Vous envoyez des messages trop vite. Patientez une minute, puis réessayez.',
    AppNotDeployed: "Cette application n'est pas encore prête. Réessayez plus tard.",
    NetworkError: 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.',
    generic: "Une erreur s'est produite (HTTP {{status}}). Réessayez."
  },
  tips: {
    email: "L'adresse e-mail de votre compte pour cette application.",
    password: "Le mot de passe de votre compte. Il n'est envoyé qu'à ce serveur pour ouvrir votre session.",
    submit: "Vérifie votre e-mail et votre mot de passe, puis ouvre l'application.",
    anonymous: "Utilisez l'application en tant qu'invité. Vos conversations ne durent que le temps de cet onglet.",
    language: "Choisissez la langue de l'application. Votre choix est enregistré dans ce navigateur.",
    themeLight: 'Utilise des couleurs claires. Ce choix est enregistré dans ce navigateur et remplace le réglage du système.',
    themeDark: 'Utilise des couleurs sombres. Ce choix est enregistré dans ce navigateur et remplace le réglage du système.',
    signOut: "Ferme votre session sur cet appareil et revient à l'écran de connexion.",
    conversationsToggle: 'Affiche ou masque la liste de vos conversations.',
    filesToggle: "Affiche ou masque les fichiers écrits par l'agent dans cette conversation.",
    newConversation: 'Commence une nouvelle conversation. Vos conversations précédentes restent dans la liste.',
    conversation: 'Ouvre cette conversation pour reprendre là où vous vous étiez arrêté.',
    composer: "Écrivez votre message à l'agent. Entrée l'envoie ; Maj et Entrée ajoutent une nouvelle ligne.",
    send: "Envoie votre message à l'agent. La réponse s'affiche en dessous au fur et à mesure.",
    dismiss: 'Masque ce message de l\'écran.',
    retry: "Recharge l'application depuis le début.",
    download: 'Enregistre la version actuelle de ce fichier sur votre appareil.',
    versions: 'Affiche toutes les versions de ce fichier pour en télécharger une plus ancienne.',
    downloadVersion: 'Enregistre cette version du fichier sur votre appareil.',
    closeDialog: 'Ferme cette fenêtre et revient à la conversation.',
    closeFiles: 'Masque le panneau des fichiers et revient à la conversation.',
    details: "Affiche les étapes suivies par l'agent pour répondre : appels d'outils, progression et avertissements.",
    answerLink: 'Ouvre un lien de la réponse dans un nouvel onglet : {{href}}',
    tableHeader: "Colonne d'un tableau de la réponse : {{text}}",
    skipToChat: "Passe l'en-tête et la liste des conversations pour aller directement à la zone de message."
  }
};

export default fr;
