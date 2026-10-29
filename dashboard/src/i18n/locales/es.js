// Spanish catalog for the Garrison dashboard. Mirrors every key in en.js.

import { tips, explainers } from './es.tips.js';

const rp = (title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody) => ({ title, subtitle, add, create, edit, view, deleteTitle, emptyTitle, emptyBody });

const es = {
  processSecurity: { trustedOnly: "Ejecutor Process: solo para tareas de confianza. Las ejecuciones comparten el usuario, sistema de archivos y red del worker, con acceso a otras ejecuciones y sus credenciales. Use KubernetesJob para entradas no confiables." },
  common: {
    eventCodes: { ApprovalRequested: 'Aprobación solicitada', ApprovalDecided: 'Aprobación decidida', StructuredOutputInvalid: 'Salida estructurada no válida', RunBlocked: 'Ejecución bloqueada', EventsDropped: 'Eventos descartados', HarnessExited: 'Harness terminado', McpPreflightWarning: 'Aviso de comprobación previa de MCP', McpPreflightPassed: 'Comprobación previa de MCP superada', RepairAttemptStarted: 'Reparación de salida iniciada', WorkspacePrepared: 'Espacio de trabajo preparado', RunGuardTriggered: 'Una protección detuvo la ejecución', ConversationFallback: 'Conversación reconstruida', ConversationResumed: 'Conversación reanudada', ConversationStateLost: 'Estado de la conversación perdido' },
    fieldCodes: { ExpiryInPast: 'Elige un momento en el futuro.', ParameterInvalid: 'Este valor no es válido para este parámetro.', ParameterNotAllowed: 'Este despliegue no permite que quien llama sobrescriba este parámetro.', SettingsFileReadOnly: 'El archivo de ajustes es de solo lectura, así que este cambio no se puede guardar.', OverriddenByEnvironment: 'Una variable de entorno fija este valor, así que no se puede cambiar aquí.', PathRequired: 'Hace falta la ruta del ajuste.', UnknownSetting: 'Este servidor no tiene este ajuste.', TooLong: 'Este valor es demasiado largo.', NotAllowedValue: 'Elige uno de los valores permitidos.', NotABoolean: 'Elige verdadero o falso.', NotAnInteger: 'Escribe un número entero.', OutOfRange: 'El valor está fuera del rango permitido.' },
    serverText: {
      approvalWaitingExpires: 'Esperando a que una persona apruebe {{subject}}; la aprobación {{id}} caduca el {{expires}}.',
      approvalWaiting: 'Esperando a que una persona apruebe {{subject}}; aprobación {{id}}.',
      notApplied: 'No se aplicó porque otro documento no superó la validación.',
      wouldBeUnchanged: 'Ya está al día; no cambiaría nada.',
      wouldBeUpdated: 'Se actualizaría.',
      wouldBeCreated: 'Se crearía.',
      inUse: '{{what}} sigue vinculado a estos despliegues: {{deployments}}. Quita antes los vínculos.',
      noActiveDeployment: 'El agente {{agent}} no tiene ningún despliegue activo con peso mayor que cero. Añade un despliegue o sube el peso de uno y vuelve a intentarlo.',
      toolCallDenied: 'Llamada a herramienta denegada: {{id}}',
      threadStarted: 'Hilo iniciado.',
      runStartedModel: 'Ejecución iniciada ({{model}}).',
      runStarted: 'Ejecución iniciada.',
      sessionInitializedModel: 'Sesión inicializada ({{model}}).',
      sessionInitialized: 'Sesión inicializada.',
      harnessFailed: 'El harness informó de un error.',
      exitedNoResult: 'El harness terminó con el código {{code}} sin un resultado final.',
      harnessExited: 'El harness terminó: {{status}} ({{outcome}}).',
      harnessExitedCode: 'El harness terminó con el código {{code}}: {{status}} ({{outcome}}).',
      mcpPreflight: 'Comprobación previa de MCP superada. Servidores comprobados: {{count}}.',
      repairAttempt: 'Intento {{attempt}} de reparación de salida estructurada: se reanuda la sesión del harness en {{path}}.',
      workspacePrepared: 'Espacio de trabajo preparado en {{path}}.',
      guardRepetitionUnit: 'Protección contra repeticiones: los últimos {{window}} caracteres del texto del asistente son la unidad de {{size}} caracteres "{{unit}}" repetida {{count}} veces.',
      guardDegenerate: 'Protección contra repeticiones: los últimos {{window}} caracteres del texto del asistente no contienen letras ni dígitos (solo espacios, puntuación o símbolos) y terminan en "{{tail}}".',
      guardNoProgress: 'La ejecución no avanzó durante {{seconds}} segundos (sin texto del asistente, razonamiento, llamada a herramienta ni resultado de herramienta, y sin ninguna llamada a herramienta abierta); su límite noProgressSeconds es {{limit}}.',
      guardOutputLimit: 'El texto del asistente superó el límite maxAssistantChars de la ejecución, de {{limit}} caracteres.',
      valueClamped: 'El valor {{given}} de {{field}} está fuera del rango permitido de {{minimum}} a {{maximum}}; se guardó {{stored}}.'
    },
    appName: 'Garrison',
    language: { label: 'Idioma' },
    theme: { switchToLight: 'Cambiar al tema claro', switchToDark: 'Cambiar al tema oscuro' },
    actions: {
      apply: 'Aplicar',
      back: 'Atrás',
      cancel: 'Cancelar',
      clear: 'Borrar',
      clone: 'Clonar',
      close: 'Cerrar',
      confirm: 'Confirmar',
      copied: 'Copiado',
      copy: 'Copiar',
      delete: 'Eliminar',
      duplicate: 'Duplicar',
      edit: 'Editar',
      hide: 'Ocultar valor',
      logout: 'Cerrar sesión',
      next: 'Siguiente',
      openGithub: 'Abrir el repositorio de Garrison en GitHub',
      remove: 'Quitar',
      retry: 'Reintentar',
      reveal: 'Mostrar valor',
      save: 'Guardar',
      view: 'Ver',
      viewDetails: 'Ver detalles',
      viewJson: 'Ver JSON'
    },
    boolean: { yes: 'Sí', no: 'No' },
    confirm: {
      deleteNamed: '¿Eliminar "{{name}}"? Esta acción no se puede deshacer.',
      bulkDelete: '¿Eliminar {{count}} registros seleccionados? Esta acción no se puede deshacer.'
    },
    errors: {
      listItem: 'Elemento {{index}}: {{message}}',
      chooseOne: 'Elige al menos una opción.',
      fixFields: 'Algunos campos requieren atención. Revisa los valores resaltados.',
      invalidEmail: 'Introduce una dirección de correo electrónico válida.',
      invalidJson: 'No es un JSON válido.',
      loadFailed: 'No se pudieron cargar los datos.',
      requestId: 'Solicitud {{id}}.',
      required: 'Este campo es obligatorio.',
      requiredPermission: 'Requiere {{permission}} sobre {{resource}}.'
    },
    generic: {
      deletedName: '{{name}} (eliminado)',
      actions: 'Acciones',
      active: 'Activo',
      all: 'Todos',
      any: 'Cualquiera',
      builtIn: 'Integrado',
      custom: 'Personalizado',
      inactive: 'Inactivo',
      loading: 'Cargando...',
      never: 'Nunca',
      none: 'Ninguno',
      notAvailable: 'n/d',
      saving: 'Guardando...'
    },
    relativeTime: { now: 'ahora mismo' },
    states: {
      forbiddenTitle: 'No tienes acceso a esta página',
      forbiddenBody: 'Pide a un administrador un rol que conceda acceso, o elige otra página.',
      unavailableTitle: 'Aún no disponible en este servidor',
      unavailableBody: 'El servidor no expone los endpoints de {{resource}}. Actualiza el servidor o consulta el Explorador de API para ver qué admite.'
    },
    toasts: {
      bulkDeleted: 'Se eliminaron {{count}} registros ({{failed}} con error).',
      cloned: 'Clonado.',
      created: 'Creado.',
      deleted: 'Eliminado.',
      saved: 'Guardado.'
    },
    units: { msShort: 'ms', sShort: 's', mShort: 'min', tokPerSec: 'tok/s' }
  },
  errorCodes: {
    ApprovalNotPending: 'Esta aprobación ya se decidió, así que no se puede volver a decidir.',
    MessageIdConflict: 'Este ID de mensaje A2A ya se usó con otro contenido. Envía el mensaje con un ID nuevo.',
    IdempotencyKeyConflict: 'Esta clave de idempotencia ya se usó para otra solicitud. Usa una clave nueva.',
    DeploymentDeleted: 'El despliegue de esta ejecución se eliminó, así que la ejecución no se puede reintentar. Invoca de nuevo al agente.',
    AgentDeleted: 'El agente de esta ejecución se eliminó, así que la ejecución no se puede reintentar.',
    NoActiveDeployment: 'Este agente no tiene ningún despliegue activo con peso mayor que cero. Añade un despliegue o sube el peso de uno.',
    TenantNotFound: 'Ese inquilino no existe. Revisa el ID del inquilino.',
    NetworkError: 'No se pudo contactar con el servidor. Comprueba la URL del servidor y que esté en ejecución.',
    AuthenticationRequired: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
    InvalidCredentials: 'El inquilino, el correo electrónico, la contraseña o las claves son incorrectos.',
    RateLimited: 'Demasiados intentos de inicio de sesión. Espera un minuto e inténtalo de nuevo.',
    AuthorizationDenied: 'No tienes permiso para esta acción.',
    NotFound: 'No se encontró el registro.',
    RouteNotFound: 'Este servidor no admite ese endpoint.',
    ValidationFailed: 'Algunos valores no son válidos.',
    InvalidBody: 'El cuerpo de la solicitud no es válido.',
    InvalidJson: 'El cuerpo de la solicitud no es un JSON válido.',
    Conflict: 'Entra en conflicto con un registro existente.',
    BuiltInImmutable: 'Los registros integrados no se pueden modificar. Clónalo para personalizarlo.',
    Protected: 'Este registro está protegido y no se puede eliminar.',
    StaleLease: 'Ese nodo ya no tiene la concesión de la ejecución.',
    InternalError: 'El servidor sufrió un error interno. Revisa los registros del servidor con el ID de la solicitud.',
    Http400: 'La solicitud se rechazó por no ser válida.',
    Http403: 'No tienes permiso para esta acción.',
    Http404: 'No encontrado.',
    Http409: 'Conflicto con el estado actual.',
    Http500: 'El servidor sufrió un error interno.',
    Http503: 'El servidor no está disponible.',
    ConversationBusy: 'Esta conversación todavía está procesando su turno anterior. Espera a que termine esa ejecución, o cancélala, y vuelve a intentarlo.',
    ConversationAgentMismatch: 'Esta conversación pertenece a otro agente. Envía el turno a ese agente o inicia una conversación nueva.',
    ConversationDeploymentMismatch: 'Cada turno de una conversación se ejecuta en el despliegue de su primer turno. Deja el despliegue vacío o inicia una conversación nueva.',
    ConversationDeploymentUnavailable: 'Se eliminó el despliegue de esta conversación, así que la conversación no puede continuar. Inicia una conversación nueva.'
  },
  enums: {
    approvalStatus: {
      Pending: 'Pendiente',
      Approved: 'Aprobada',
      Denied: 'Denegada',
      Expired: 'Caducada',
      Cancelled: 'Cancelada'
    },
    approvalDecision: {
      Allow: 'Permitir',
      Deny: 'Denegar'
    },
    approvalSource: {
      DurableResume: "Aprobación conservada",
      Rule: 'Regla',
      Default: 'Valor predeterminado del despliegue',
      User: 'Persona',
      Timeout: 'Tiempo de espera agotado',
      Cancelled: 'Ejecución detenida'
    },
    approvalRuleAction: {
      Allow: 'Permitir',
      Deny: 'Denegar',
      Ask: 'Preguntar a una persona'
    },
    approvalKind: {
      Tool: 'Llamada a herramienta',
      Command: 'Comando',
      FileChange: 'Cambio de archivo'
    },
    principalType: { Administrator: 'Administrador del sistema', User: 'Usuario', Credential: 'Clave de acceso', Run: 'Token de ejecución' },
    runBlockedReason: {
      NoReadyWorker: 'Ningún nodo de trabajo listo',
      NoCapableWorker: 'Ningún nodo de trabajo compatible',
      NoMatchingPool: 'Ningún grupo de nodos coincide'
    },
    promptDelivery: { Stdin: 'Entrada estándar', Argument: 'Argumento de línea de comandos', File: 'Archivo', CodexAppServer: 'Servidor de aplicaciones de Codex (JSON-RPC)' },
    systemPromptDelivery: {
      File: 'Archivo',
      Argument: 'Argumento de línea de comandos',
      Environment: 'Variable de entorno',
      PrependToPrompt: 'Antepuesto al prompt',
      None: 'No se entrega'
    },
    mcpConfigFormat: {
      None: 'Sin configuración MCP',
      ClaudeJson: 'Claude Code JSON',
      CodexToml: 'Codex TOML',
      MuxJson: 'Mux JSON',
      GeminiSettings: 'Ajustes de Gemini CLI'
    },
    outputParser: {
      ClaudeStreamJson: 'JSON en streaming de Claude Code',
      CodexJsonl: 'Codex JSONL',
      CodexAppServer: 'JSON-RPC del servidor de aplicaciones de Codex',
      MuxJsonl: 'Mux JSONL',
      GeminiStreamJson: 'JSON en streaming de Gemini CLI',
      GenericJsonl: 'JSONL genérico',
      PlainText: 'Texto sin formato'
    },
    resultSource: { ParserFinalEvent: 'Evento final del analizador', LastMessageFile: 'Archivo del último mensaje', Stdout: 'Stdout' },
    successPolicy: { FinalEvent: 'Evento final', ExitCode: 'Código de salida', FinalEventAndExitCode: 'Evento final y código de salida' },
    fileBaseDirectory: { Config: 'Directorio de configuración', Workspace: 'Espacio de trabajo', Home: 'Directorio personal' },
    artifactStoreKind: { Database: 'Base de datos', Filesystem: 'Sistema de archivos', S3: 'S3' },
    agentInputMode: { Text: 'Texto', Structured: 'JSON estructurado' },
    argumentOverrideOperation: { Append: 'Añadir al final', Prepend: 'Añadir al principio', Remove: 'Quitar', Replace: 'Reemplazar' },
    runOverrideValidation: { Any: 'Cualquier valor', Enum: 'Uno de una lista', Regex: 'Expresión regular', IntegerRange: 'Rango de enteros' },
    credentialAuthMode: {
      DirectHeader: 'Cabeceras directas',
      SignedRequest: 'Solicitudes firmadas',
      SessionExchange: 'Intercambio por token de sesión',
      Hybrid: 'Cualquier método'
    },
    operationType: {
      All: 'Todas las operaciones',
      Create: 'Crear',
      Read: 'Leer',
      Write: 'Escribir',
      Update: 'Actualizar',
      Delete: 'Eliminar',
      Execute: 'Ejecutar',
      Admin: 'Administrar'
    },
    usageQuotaScope: {"Tenant": "Inquilino", "Agent": "Agente", "Deployment": "Despliegue"},
    resourceType: {
      All: 'Todos los recursos',
      Account: 'Cuenta',
      Tenant: 'Inquilino',
      Admin: 'Administración',
      User: 'Usuario',
      Credential: 'Clave de acceso',
      Session: 'Sesión',
      Role: 'Rol',
      Permission: 'Permiso',
      Assignment: 'Asignación',
      Audit: 'Registro de auditoría',
      RequestHistory: 'Historial de solicitudes',
      Settings: 'Ajustes',
      HarnessProfile: 'Perfil de harness',
      PromptTemplate: 'Plantilla de prompt',
      Agent: 'Agente',
      Deployment: 'Despliegue',
      McpServer: 'Servidor MCP',
      Secret: 'Secreto',
      Workspace: 'Espacio de trabajo',
      ArtifactStore: 'Almacén de artefactos',
      ModelPrice: "precio de modelo",
      UsageQuota: "cuota de uso",
      Run: 'Ejecución',
      Node: 'Nodo',
      NodePool: 'Grupo de nodos',
      Manifest: 'Manifiesto',
      Conversation: 'Conversación',
      Approval: 'Aprobación',
      Artifact: 'Artefacto'
    },
    runStatus: {
      Pending: 'Pendiente',
      Queued: 'En cola',
      Leased: 'Concedida',
      Running: 'En ejecución',
      Cancelling: 'Cancelando',
      Succeeded: 'Correcta',
      Failed: 'Fallida',
      Cancelled: 'Cancelada',
      TimedOut: 'Tiempo agotado',
      Rejected: 'Rechazada'
    },
    runOutcome: {
      None: 'Ninguno',
      Succeeded: 'Correcto',
      HarnessFailed: 'Fallo del harness',
      NotInstalled: 'Harness no instalado',
      NotCredentialed: 'Faltan credenciales',
      McpPreflightFailed: 'Falló la comprobación previa de MCP',
      NodeLost: 'Nodo perdido',
      OutputLimitExceeded: 'Límite de salida superado',
      SchemaValidationFailed: 'Esquema de salida no válido',
      TimedOut: 'Tiempo agotado',
      Cancelled: 'Cancelado',
      StaleLease: 'Concesión obsoleta',
      CompileFailed: 'Error de compilación',
      WorkspaceFailed: 'Error del espacio de trabajo',
      Rejected: 'Rechazado',
      InternalError: 'Error interno',
      NoCapableWorker: 'Ningún nodo de trabajo compatible',
      RepetitionDetected: 'Repetición detectada',
      NoProgress: 'Sin avance',
      PodFailed: 'Falló el pod de ejecución',
      ConversationStateLost: 'Estado de la conversación perdido'
    },
    runEventType: {
      Lifecycle: 'Ciclo de vida',
      AssistantText: 'Asistente',
      Thinking: 'Razonamiento',
      ToolCall: 'Llamada a herramienta',
      ToolResult: 'Resultado de herramienta',
      Usage: 'Uso',
      Progress: 'Progreso',
      Warning: 'Advertencia',
      Error: 'Error',
      Stdout: 'Stdout',
      Stderr: 'Stderr',
      Result: 'Resultado'
    },
    nodeStatus: { Ready: 'Listo', Draining: 'Drenando', Cordoned: 'Acordonado', Lost: 'Perdido', Offline: 'Desconectado' },
    controlNodeStatus: { Starting: 'Iniciando', Ready: 'Listo', Draining: 'Drenando', Offline: 'Desconectado' },
    backplane: { Local: 'Local (una réplica)', Polling: 'Sondeo de la base de datos', PostgresNotify: 'Notificaciones de PostgreSQL' },
    harnessType: { ClaudeCode: 'Claude Code', Codex: 'Codex', Mux: 'Mux', GeminiCli: 'Gemini CLI', Generic: 'Genérico' },
    agentKind: { Hosted: 'Alojado', Remote: 'Remoto' },
    delegationMode: { None: 'Sin delegación', AllowList: 'Lista de permitidos', Any: 'Cualquier agente' },
    secretStatus: { Ok: 'Correcto', NeedsReauthentication: 'Requiere volver a iniciar sesión' },
    secretKind: {
      AnthropicApiKey: 'Clave de API de Anthropic',
      ClaudeCodeOAuthToken: 'Token OAuth de Claude Code',
      OpenAiApiKey: 'Clave de API de OpenAI',
      CodexAuthJson: 'auth.json de Codex',
      GeminiApiKey: 'Clave de API de Gemini',
      GenericEnv: 'Valor de entorno',
      GenericFile: 'Contenido de archivo',
      BearerToken: 'Token Bearer',
      BasicAuth: 'Autenticación básica',
      GitCredential: 'Credencial de Git'
    },
    workspaceKind: { Empty: 'Vacío', GitRepository: 'Repositorio Git', Seeded: 'Archivos precargados', PersistentVolume: 'Volumen persistente' },
    runExecutor: { Process: 'Proceso', KubernetesJob: 'Job de Kubernetes' },
    workspaceRetention: { Delete: 'Eliminar', Keep: 'Conservar', KeepOnFailure: 'Conservar si falla' },
    promptTemplateKind: { System: 'Sistema', Task: 'Tarea', Fragment: 'Fragmento', ToolDescription: 'Descripción de herramienta', ConfigFile: 'Archivo de configuración', Other: 'Otro' },
    permissionType: { Permit: 'Permitir', Deny: 'Denegar' },
    resourceScope: { Tenant: 'Inquilino', Resource: 'Recurso' },
    resourceBindingKind: { McpServer: 'Servidor MCP', Secret: 'Secreto' },
    mcpTransport: { Http: 'HTTP', Stdio: 'stdio' },
    remoteProtocol: { A2A: 'A2A', Mcp: 'MCP' },
    manifestApplyResult: { Created: 'Creado', Updated: 'Actualizado', Unchanged: 'Sin cambios', Failed: 'Fallido', Validated: 'Validado' },
    auditEventType: {
      ApprovalDecided: 'Aprobación decidida',
      AuthSuccess: 'Inicio de sesión correcto',
      AuthFailure: 'Inicio de sesión fallido',
      SessionIssued: 'Sesión emitida',
      SessionRevoked: 'Sesión revocada',
      CredentialCreated: 'Clave de acceso creada',
      CredentialRotated: 'Clave de acceso rotada',
      CredentialUsed: 'Clave de acceso usada',
      AuthorizationDenied: 'Autorización denegada',
      AuthorizationBypass: 'Omisión de autorización',
      RoleChanged: 'Rol modificado',
      PermissionChanged: 'Permiso modificado',
      AssignmentChanged: 'Asignación modificada',
      ConfigurationChanged: 'Configuración modificada',
      SecretChanged: 'Secreto modificado',
      SettingsChanged: 'Ajustes del servidor modificados',
      RestartRequested: 'Reinicio solicitado',
      ManifestApplied: 'Manifiesto aplicado',
      NodeRegistered: 'Nodo registrado',
      NodeStatusChanged: 'Estado del nodo modificado',
      RunCancelled: 'Ejecución cancelada',
      ConversationDeleted: 'Conversación eliminada'
    },
    conversationFallbackReason: {
      AffinityNodeLost: 'Nodo de afinidad no disponible',
      AffinityWaitExpired: 'Espera de afinidad agotada',
      WorkspaceLost: 'Espacio de trabajo perdido',
      SessionMissing: 'Sin sesión que reanudar',
      HarnessChanged: 'Perfil de harness cambiado',
      ResumeUnsupported: 'Reanudación no admitida',
      ExecutorWithoutState: 'El ejecutor no guarda estado'
    }
  },
  nav: {
    approvalsPending_one: '{{count}} aprobación en espera',
    approvalsPending_other: '{{count}} aprobaciones en espera',
    approvalsPending_many: '{{count}} aprobaciones en espera',
    primary: 'Navegación principal',
    sections: {
      operate: 'Operación',
      platform: 'Plataforma',
      administration: 'Administración'
    },
    hubs: {
      approvals: {
        label: 'Aprobaciones',
        tip: 'Llamadas a herramientas que esperan a una persona, y todas las decisiones'
      },
      home: { label: 'Inicio', tip: 'Estado de la flota y de las ejecuciones de un vistazo' },
      invoke: { label: 'Invocar', tip: 'Prueba un agente de forma interactiva' },
      runs: { label: 'Ejecuciones', tip: 'Ejecuciones y la cola de planificación' },
      analytics: { label: 'Analítica', tip: 'Velocidad, tokens, coste y resultados de las ejecuciones a lo largo del tiempo' },
      agents: { label: 'Agentes', tip: 'Agentes y los despliegues que los ejecutan' },
      configuration: { label: 'Configuración', tip: 'Perfiles de harness, plantillas de prompt, servidores MCP, secretos, espacios de trabajo, almacenes de artefactos y manifiestos' },
      fleet: { label: 'Flota', tip: 'Plano de control, nodos de trabajo y grupos de nodos' },
      access: { label: 'Acceso', tip: 'Inquilinos, usuarios, claves de acceso, roles y asignaciones' },
      monitoring: { label: 'Supervisión', tip: 'Historial de solicitudes, auditoría y el Explorador de API' },
      system: { label: 'Sistema', tip: 'Ajustes e información del servidor' }
    },
    items: {
      approvals: {
        label: 'Aprobaciones',
        tip: 'Permite o deniega las llamadas a herramientas que piden los agentes'
      },
      home: { label: 'Inicio', tip: 'Estado de la flota y de las ejecuciones de un vistazo' },
      invoke: { label: 'Invocar', tip: 'Prueba un agente de forma interactiva' },
      runs: { label: 'Ejecuciones', tip: 'Busca, inspecciona, cancela y reintenta ejecuciones' },
      queue: { label: 'Cola', tip: 'Presión de planificación por agente y harness' },
      analytics: { label: 'Analítica', tip: 'Velocidad, tokens, coste y resultados de las ejecuciones a lo largo del tiempo' },
      nodes: { label: 'Nodos de trabajo', tip: 'Nodos de trabajo y las capacidades de harness de cada uno' },
      controlNodes: { label: 'Plano de control', tip: 'Réplicas del servidor que sirven la API y planifican las ejecuciones' },
      nodePools: { label: 'Grupos de nodos', tip: 'Agrupa nodos y dedícalos a inquilinos' },
      agents: { label: 'Agentes', tip: 'Agentes expuestos mediante REST, MCP y A2A' },
      deployments: { label: 'Despliegues', tip: 'Vincula agentes a harnesses, prompts y recursos' },
      harnessProfiles: { label: 'Perfiles de harness', tip: 'Cómo se ejecuta cada harness sin interfaz' },
      promptTemplates: { label: 'Plantillas de prompt', tip: 'Todos los prompts que envía Garrison, con versiones' },
      mcpServers: { label: 'Servidores MCP', tip: 'Herramientas disponibles para los agentes' },
      secrets: { label: 'Secretos', tip: 'Credenciales de harnesses e integraciones' },
      workspaces: { label: 'Espacios de trabajo', tip: 'Cómo se preparan los espacios de trabajo de las ejecuciones' },
      artifactStores: { label: 'Almacenes de artefactos', tip: 'Dónde se guardan los artefactos de las ejecuciones' },
      modelPrices: { label: "Precios de modelos", tip: "Tarifas en USD configuradas por el operador para estimar el coste cuando el harness no lo informa. El coste informado, incluso cero, tiene prioridad." },
      usageQuotas: { label: "Cuotas de uso", tip: "Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue." },
      manifests: { label: 'Manifiestos', tip: 'Aplica y exporta la configuración como código' },
      requests: { label: 'Historial de solicitudes', tip: 'Inspecciona el tráfico HTTP y los errores' },
      audit: { label: 'Auditoría', tip: 'Eventos de seguridad y de configuración' },
      explorer: { label: 'Explorador de API', tip: 'Ejecuta llamadas reales a la API' },
      tenants: { label: 'Inquilinos', tip: 'Administra los inquilinos' },
      users: { label: 'Usuarios', tip: 'Administra los usuarios' },
      credentials: { label: 'Claves de acceso', tip: 'Claves de acceso para automatización' },
      roles: { label: 'Roles', tip: 'Roles y permisos' },
      assignments: { label: 'Asignaciones', tip: 'Concede roles a usuarios y claves de acceso' },
      settings: { label: 'Ajustes', tip: 'Edita los ajustes del servidor y del clúster' },
      serverInfo: { label: 'Información del servidor', tip: 'Endpoints, versión y tu identidad' },
      conversations: {
        label: 'Conversaciones',
        tip: 'Intercambios de varios turnos con un agente'
      }
    },
    setup: 'Asistente de configuración',
    setupTip: 'Guarda una credencial, aplica un agente de ejemplo y pruébalo',
    tour: 'Visita guiada',
    tourTip: 'Repetir la visita guiada',
    version: 'Versión {{version}}',
    collapseSidebar: 'Mostrar u ocultar la navegación',
    skipToContent: 'Saltar al contenido'
  },
  login: {
    title: 'Garrison',
    subtitle: 'Inicia sesión en el plano de control de agentes',
    tabs: { password: 'Correo electrónico y contraseña', accessKey: 'Clave de acceso' },
    serverUrl: 'URL del servidor',
    tenantId: 'ID del inquilino',
    email: 'Correo electrónico',
    password: 'Contraseña',
    accessKey: 'Clave de acceso',
    secretKey: 'Clave secreta',
    submit: 'Iniciar sesión',
    connecting: 'Iniciando sesión...',
    restoring: 'Restaurando tu sesión...',
    errorGeneric: 'No se pudo iniciar sesión. Comprueba la URL del servidor y tus credenciales.',
    footerHint: 'Valor predeterminado en desarrollo local: admin@garrison en el inquilino default.'
  },
  topbar: {
    server: 'Servidor',
    tenant: 'Inquilino',
    switchTenant: 'Cambiar de inquilino',
    copyServer: 'Copiar la URL del servidor',
    live: 'En vivo',
    polling: 'Sondeo',
    liveOn: 'Recibiendo actualizaciones en vivo por WebSocket',
    liveOff: 'Actualizaciones en vivo no disponibles; las páginas se actualizan por sondeo',
    health: { healthy: 'Correcto', unhealthy: 'Inaccesible', unknown: 'Comprobando' }
  },
  roles: {
    systemAdmin: 'Administrador del sistema',
    tenantAdmin: 'Administrador del inquilino',
    user: 'Usuario',
    credential: 'Clave de acceso',
    run: 'Token de ejecución'
  },
  components: {
    fieldWarnings: { title_one: 'Guardado con {{count}} valor ajustado', title_other: 'Guardado con {{count}} valores ajustados', body: 'El servidor aceptó la solicitud, pero guardó estos valores de forma distinta a como se enviaron.', dismiss: 'Descartar', codes: { ValueClamped: 'Valor ajustado al rango permitido' } },
    approvals: {
      awaiting: 'Pendiente de aprobación',
      decideTitle: 'Decidir {{tool}}',
      decision: 'Decisión',
      reason: 'Motivo',
      reasonPlaceholder: 'Opcional. Lo ven el agente y el registro de auditoría.',
      remember: 'Recordar como regla para este despliegue',
      rulePattern: 'Patrón de regla',
      rememberHint: 'Añade al despliegue una regla con la acción {{action}}, para que las llamadas coincidentes se decidan sin preguntar. También requiere permiso para actualizar el despliegue.',
      submitAllow: 'Permitir',
      submitDeny: 'Denegar',
      timeoutThen: 'después {{decision}}',
      toasts: {
        allowed: 'Se permitió {{tool}}.',
        denied: 'Se denegó {{tool}}.',
        allowedRemembered: 'Se permitió {{tool}} y se añadió la regla {{pattern}}.',
        deniedRemembered: 'Se denegó {{tool}} y se añadió la regla {{pattern}}.',
        notPending: 'Otra persona o su tiempo de espera ya decidió esta aprobación. La lista muestra ahora el resultado.',
        forbidden: 'Puedes leer aprobaciones, pero no decidirlas. Pide a un administrador el permiso Approval Update.',
        forbiddenRemember: 'Recordar una regla también requiere permiso para actualizar el despliegue. Decide sin recordar, o pide Deployment Update.'
      }
    },
    approvalCheck: {
      title: 'Probar una llamada a herramienta',
      saveFirst: 'Guarda primero el despliegue. La prueba comprueba las reglas que el servidor tiene guardadas.',
      hint: 'Comprueba las reglas guardadas, así que guarda tus cambios antes de probarlos. No se registra nada.',
      toolName: 'Herramienta',
      inputs: {
        command: 'Comando',
        url: 'URL',
        query: 'Consulta de búsqueda',
        file_path: 'Ruta del archivo',
        notebook_path: 'Ruta del notebook',
        pattern: 'Patrón'
      },
      run: 'Comprobar',
      checking: 'Comprobando...',
      byRule: '{{action}} por esta regla:',
      byDefault: '{{action}} por el valor predeterminado del despliegue, porque ninguna regla coincidió.',
      suggestedRule: 'Regla sugerida:',
      disabled: 'Las aprobaciones están desactivadas en este despliegue, así que sus ejecuciones nunca preguntan. Actívalas y guarda para aplicar estas reglas.'
    },
    blocked: {
      title: 'Esperando un nodo de trabajo',
      body: 'Esta ejecución está en cola, pero ahora mismo ningún nodo de trabajo puede tomarla.',
      reasons: {
        NoReadyWorker: 'Ningún nodo de trabajo está listo. Inicia un nodo de trabajo o registra uno nuevo y revisa en la página Flota los nodos perdidos, desconectados, drenando o acordonados.',
        NoCapableWorker: 'Hay nodos de trabajo listos, pero ninguno informa del harness {{harness}} como disponible. Inicia o registra un nodo de trabajo con ese harness instalado, o revisa sus credenciales y los resultados de las sondas en la página Flota.',
        NoMatchingPool: 'Un nodo de trabajo listo puede ejecutar {{harness}}, pero ninguno coincide con el grupo de nodos o los selectores de nodo de este despliegue. Revisa la ubicación del despliegue o añade un nodo de trabajo a ese grupo.'
      },
      failNote: 'Si el ajuste de clúster Runtime.FailBlockedAfterSeconds es mayor que 0, una ejecución que siga bloqueada ese tiempo falla con el resultado «Ningún nodo de trabajo compatible».',
      openFleet: 'Abrir Flota',
      openAgent: 'Abrir los despliegues del agente',
      homeBanner_one: '{{count}} ejecución en cola no puede empezar: ningún nodo de trabajo listo puede ejecutarla.',
      homeBanner_many: '{{count}} ejecuciones en cola no pueden empezar: ningún nodo de trabajo listo puede ejecutarlas.',
      homeBanner_other: '{{count}} ejecuciones en cola no pueden empezar: ningún nodo de trabajo listo puede ejecutarlas.',
      showRuns: 'Ver ejecuciones en cola',
      queueColumn: 'Bloqueadas',
      queueCount_one: '{{count}} bloqueada',
      queueCount_many: '{{count}} bloqueadas',
      queueCount_other: '{{count}} bloqueadas'
    },
    autoRefresh: {
      label: 'Actualización automática',
      none: 'Desactivada',
      seconds_one: 'Cada {{count}} segundo',
      seconds_other: 'Cada {{count}} segundos',
      seconds_many: 'Cada {{count}} segundos'
    },
    chart: {
      success: 'Correctas',
      failure: 'Fallidas',
      total: 'Total',
      avgDuration: 'Duración media',
      noData: 'No hay actividad en este intervalo.',
      range: 'Intervalo de tiempo',
      ranges: { hour: 'Última hora', day: 'Último día', week: 'Última semana', month: 'Último mes', custom: 'Personalizado' }
    },
    compilePreview: {
      title: 'Vista previa de compilación',
      input: 'Entrada de ejemplo',
      compile: 'Compilar',
      compiling: 'Compilando...',
      commandLine: 'Línea de comandos',
      stdin: 'Entrada estándar',
      environment: 'Entorno',
      files_one: '{{count}} archivo',
      files_other: '{{count}} archivos',
      files_many: '{{count}} archivos'
    },
    confirm: { title: 'Confirma la acción', message: '¿Seguro que quieres continuar?' },
    diff: { before: 'Antes', after: 'Después' },
    explainer: { about: 'Acerca de {{topic}}', dismiss: 'Ocultar esta explicación' },
    export: { label: 'Exportar', csv: 'CSV (datos)', png: 'Imagen PNG', svg: 'Imagen SVG', json: 'JSON (datos)', failed: 'Error al exportar. {{message}}', tableTitle: 'tabla {{table}}' },
    filters: {
      allTenants: 'Todos los inquilinos',
      clear: 'Borrar filtros',
      from: 'Desde',
      to: 'Hasta',
      method: 'Método',
      path: 'La ruta contiene',
      pathPlaceholder: 'por ejemplo /v1.0/api/tenants',
      searchName: 'Buscar por nombre',
      status: 'Código de estado',
      statusPlaceholder: 'por ejemplo 404',
      tenant: 'Inquilino'
    },
    form: {
      addItem: 'Añadir elemento',
      addRow: 'Añadir fila',
      key: 'Clave',
      value: 'Valor',
      moveUp: 'Subir',
      moveDown: 'Bajar',
      noItems: 'Aún no hay elementos.',
      onePerLine: 'Un valor por línea',
      steps: 'Pasos del formulario'
    },
    mcpTest: {
      title: 'Prueba de conexión MCP',
      testing: 'Conectando y listando herramientas...',
      ok: 'Conectado',
      failed: 'Error',
      tools_one: '{{count}} herramienta',
      tools_other: '{{count}} herramientas',
      tools_many: '{{count}} herramientas'
    },
    permissions: {
      title: 'Permisos efectivos',
      none: 'Sin concesiones. Esta entidad solo puede usar reglas de omisión, si las hay.',
      source: 'Rol',
      type: 'Tipo',
      resources: 'Tipos de recurso',
      operations: 'Operaciones',
      scope: 'Ámbito'
    },
    requestDetails: {
      title: 'Detalles de la solicitud',
      metadata: 'Metadatos',
      requestHeaders: 'Encabezados de la solicitud',
      requestBody: 'Cuerpo de la solicitud',
      responseHeaders: 'Encabezados de la respuesta',
      responseBody: 'Cuerpo de la respuesta',
      rawJson: 'JSON sin procesar',
      truncated: 'Truncado ({{bytes}} bytes en el original)',
      empty: 'Sin contenido.',
      fields: {
        id: 'ID de la solicitud',
        method: 'Método',
        path: 'Ruta',
        url: 'URL',
        status: 'Estado',
        duration: 'Duración',
        createdUtc: 'Creada',
        completedUtc: 'Completada',
        sourceIp: 'IP de origen',
        principal: 'Entidad',
        tenant: 'Inquilino',
        user: 'Usuario'
      }
    },
    secretOnce: {
      title: 'Copia este secreto ahora',
      warning: 'Es la única vez que se muestra el secreto. Guárdalo en un lugar seguro antes de cerrar.',
      accessKey: 'Clave de acceso',
      secretKey: 'Clave secreta',
      done: 'Ya lo he guardado'
    },
    table: {
      bulkActions: 'Acciones masivas',
      bulkDelete: 'Eliminar seleccionados',
      clearSelection: 'Borrar selección',
      empty: 'No hay registros que mostrar.',
      first: 'Primera página',
      jump: 'Ir a la página',
      last: 'Última página',
      loading: 'Cargando registros...',
      next: 'Página siguiente',
      noMatches: 'Ningún registro coincide con los filtros actuales.',
      pageOf: 'Página {{page}} de {{total}}',
      pageSize: 'Por página',
      pinned: 'Siempre visible',
      prev: 'Página anterior',
      records_one: 'registro',
      records_other: 'registros',
      records_many: 'registros',
      refresh: 'Actualizar',
      selectAll: 'Seleccionar todas las filas de esta página',
      selectColumns: 'Seleccionar columnas',
      selected_one: '{{count}} seleccionado',
      selected_other: '{{count}} seleccionados',
      selected_many: '{{count}} seleccionados',
      selectRow: 'Seleccionar fila',
      showing: 'Mostrando del {{from}} al {{to}}',
      sortBy: 'Ordenar por {{column}}',
      sortPageOnly: 'Ordena solo la página actual'
    }
  },
  resources: {
    approvals: {
      ...rp('Aprobaciones', 'Llamadas a herramientas que los agentes pidieron hacer, decididas por una regla del despliegue, el valor predeterminado del despliegue, una persona o un tiempo de espera. Las pendientes te esperan.', 'Añadir aprobación', 'Crear aprobación', 'Editar aprobación', 'Detalles de la aprobación', 'Eliminar aprobación', 'Aún no hay aprobaciones', 'Las aprobaciones aparecen cuando un despliegue con aprobaciones activadas pregunta antes de una llamada a herramienta.'),
      columns: {
        createdUtc: 'Solicitada',
        agentName: 'Agente',
        toolName: 'Herramienta',
        summary: 'Solicitud',
        status: 'Estado',
        decision: 'Decisión',
        decisionSource: 'Origen',
        decidedBy: 'Decidida por',
        expiresUtc: 'Caduca',
        kind: 'Tipo',
        harnessType: 'Harness',
        runId: 'Ejecución',
        waitMs: 'Espera',
        reason: 'Motivo',
        decidedUtc: 'Decidida',
        id: 'ID'
      },
      fields: {
        status: 'Estado',
        decision: 'Decisión',
        decisionSource: 'Origen de la decisión',
        decidedBy: 'Decidida por',
        toolName: 'Herramienta',
        kind: 'Tipo',
        harnessType: 'Harness',
        agentName: 'Agente',
        runId: 'Ejecución',
        rootRunId: 'Ejecución raíz',
        deploymentId: 'Despliegue',
        leaseEpoch: 'Época de la concesión',
        requestedUtc: 'Solicitada',
        expiresUtc: 'Caduca',
        decidedUtc: 'Decidida',
        waitMs: 'Duración de la espera',
        timeoutDecision: 'Decisión al agotarse el tiempo',
        toolCallId: 'ID de la llamada a herramienta',
        reason: 'Motivo',
        summary: 'Resumen',
        inputPreview: 'Entrada (censurada)',
        rulePattern: 'Regla coincidente',
        ruleId: 'ID de la regla',
        suggestedRule: 'Regla sugerida',
        rememberedRuleId: 'ID de la regla recordada'
      },
      filters: {
        runId: 'ID de ejecución',
        runIdPlaceholder: 'ID de ejecución (run_...)'
      },
      actions: {
        allow: 'Permitir',
        deny: 'Denegar',
        openRun: 'Abrir ejecución'
      }
    },
    tenants: {
      ...rp('Inquilinos', 'Espacios aislados, cada uno con sus propios usuarios, agentes, secretos y ejecuciones.', 'Añadir inquilino', 'Crear inquilino', 'Editar inquilino', 'Detalles del inquilino', 'Eliminar inquilino', 'Aún no hay inquilinos', 'Crea un inquilino para aislar un equipo o un cliente.'),
      columns: { name: 'Nombre', id: 'ID', description: 'Descripción', active: 'Activo', createdUtc: 'Creado' },
      fields: { name: 'Nombre', description: 'Descripción', active: 'Activo' }
    },
    users: {
      ...rp('Usuarios', 'Personas que inician sesión en este inquilino con un correo electrónico y una contraseña.', 'Añadir usuario', 'Crear usuario', 'Editar usuario', 'Detalles del usuario', 'Eliminar usuario', 'Aún no hay usuarios', 'Añade un usuario para que una persona pueda iniciar sesión en este inquilino.'),
      columns: { email: 'Correo electrónico', name: 'Nombre', id: 'ID', role: 'Rol', active: 'Activo', createdUtc: 'Creado' },
      fields: { email: 'Correo electrónico', password: 'Contraseña', firstName: 'Nombre', lastName: 'Apellidos', isTenantAdmin: 'Administrador del inquilino', isAdmin: 'Administrador del sistema', active: 'Activo' },
      hints: { isAdmin: 'Los administradores del sistema pueden gestionar todos los inquilinos y omitir toda autorización.', password: 'Déjalo en blanco al editar para conservar la contraseña actual.' },
      actions: { permissions: 'Permisos efectivos' }
    },
    credentials: {
      ...rp('Claves de acceso', 'Claves de acceso que usan la automatización, los SDK y las integraciones. Los secretos se muestran una sola vez.', 'Añadir clave de acceso', 'Crear clave de acceso', 'Editar clave de acceso', 'Detalles de la clave de acceso', 'Eliminar clave de acceso', 'Aún no hay claves de acceso', 'Crea una clave de acceso para que un script o un servicio pueda llamar a Garrison.'),
      columns: { name: 'Nombre', accessKey: 'Clave de acceso', secretKeyLast4: 'Secreto', userId: 'Propietario', lastUsedUtc: 'Último uso', expiresUtc: 'Caduca', active: 'Activa', id: 'ID' },
      fields: { name: 'Nombre', userId: 'Propietario', authMode: 'Modo de autenticación', expiresUtc: 'Caduca', active: 'Activa' },
      hints: { userId: 'Una clave de acceso nunca puede superar los permisos de su propietario.' },
      actions: { rotate: 'Rotar secreto' }
    },
    roles: {
      ...rp('Roles', 'Los roles agrupan permisos. Los roles integrados son de solo lectura; clona uno para personalizarlo.', 'Añadir rol', 'Crear rol', 'Editar rol', 'Detalles del rol', 'Eliminar rol', 'Aún no hay roles', 'Crea un rol personalizado o clona un rol integrado.'),
      columns: { name: 'Nombre', description: 'Descripción', isBuiltIn: 'Tipo', active: 'Activo', id: 'ID', createdUtc: 'Creado' },
      fields: { name: 'Nombre', description: 'Descripción', active: 'Activo' }
    },
    permissions: {
      ...rp('Permisos', 'Permite o deniega operaciones sobre tipos de recurso. Denegar siempre prevalece.', 'Añadir permiso', 'Crear permiso', 'Editar permiso', 'Detalles del permiso', 'Eliminar permiso', 'Aún no hay permisos', 'Crea un permiso y asócialo a un rol.'),
      columns: { name: 'Nombre', permissionType: 'Tipo', resourceTypes: 'Tipos de recurso', operationTypes: 'Operaciones', isBuiltIn: 'Origen', id: 'ID' },
      fields: { name: 'Nombre', permissionType: 'Tipo', resourceTypes: 'Tipos de recurso', operationTypes: 'Operaciones', active: 'Activo' }
    },
    userAssignments: {
      ...rp('Asignaciones de usuario', 'Concede roles a usuarios en el ámbito del inquilino o de un recurso.', 'Añadir asignación de usuario', 'Crear asignación de usuario', 'Editar asignación de usuario', 'Detalles de la asignación de usuario', 'Eliminar asignación de usuario', 'Aún no hay asignaciones de usuario', 'Asigna un rol a un usuario.'),
      columns: { userId: 'Usuario', roleName: 'Rol', resourceScope: 'Ámbito', resourceId: 'Recurso', active: 'Activa', createdUtc: 'Creada', id: 'ID' },
      fields: { userId: 'Usuario', roleId: 'Rol', resourceScope: 'Ámbito', resourceId: 'ID del recurso', inheritsToChildren: 'Se aplica a los recursos del inquilino', active: 'Activa' }
    },
    credentialAssignments: {
      ...rp('Asignaciones de clave de acceso', 'Concede roles a claves de acceso. Dales menos permisos que a sus propietarios.', 'Añadir asignación de clave de acceso', 'Crear asignación de clave de acceso', 'Editar asignación de clave de acceso', 'Detalles de la asignación de clave de acceso', 'Eliminar asignación de clave de acceso', 'Aún no hay asignaciones de clave de acceso', 'Asigna un rol a una clave de acceso.'),
      columns: { credentialId: 'Clave de acceso', roleName: 'Rol', resourceScope: 'Ámbito', resourceId: 'Recurso', active: 'Activa', createdUtc: 'Creada', id: 'ID' },
      fields: { credentialId: 'Clave de acceso', roleId: 'Rol', resourceScope: 'Ámbito', resourceId: 'ID del recurso', inheritsToChildren: 'Se aplica a los recursos del inquilino', active: 'Activa' }
    },
    harnessProfiles: {
      ...rp('Perfiles de harness', 'Describe con exactitud cómo se ejecuta un harness sin interfaz: ejecutable, argumentos, entorno, archivos y análisis de la salida.', 'Añadir perfil de harness', 'Crear perfil de harness', 'Editar perfil de harness', 'Detalles del perfil de harness', 'Eliminar perfil de harness', 'Aún no hay perfiles de harness', 'Clona un perfil integrado para personalizar cómo se inicia un harness.'),
      steps: { basics: 'Datos básicos', invocation: 'Invocación', output: 'Salida', limits: 'Límites' },
      columns: { name: 'Nombre', harnessType: 'Harness', executable: 'Ejecutable', outputParser: 'Analizador', isBuiltIn: 'Origen', id: 'ID', createdUtc: 'Creado' },
      fields: {
        name: 'Nombre',
        description: 'Descripción',
        harnessType: 'Tipo de harness',
        executable: 'Ejecutable',
        probeArguments: 'Argumentos para detectar la versión',
        active: 'Activo',
        arguments: 'Argumentos',
        argTemplate: 'Plantilla',
        argCondition: 'Condición',
        argRepeatOver: 'Repetir sobre',
        promptDelivery: 'Entrega del prompt',
        promptArgumentTemplate: 'Argumento o nombre de archivo del prompt',
        systemPromptDelivery: 'Entrega del prompt del sistema',
        systemPromptTarget: 'Destino del prompt del sistema',
        mcpConfigFormat: 'Formato de la configuración MCP',
        mcpConfigFileName: 'Nombre del archivo de configuración MCP',
        environment: 'Entorno',
        envName: 'Nombre',
        envValue: 'Plantilla del valor',
        isSecret: 'Secreto',
        files: 'Archivos',
        fileBase: 'Directorio base',
        filePath: 'Ruta',
        fileContent: 'Plantilla del contenido',
        fileMode: 'Modo',
        credentialEnvironmentAllowlist: 'Variables de credenciales permitidas',
        outputParser: 'Analizador de salida',
        genericTextField: 'Ruta del campo de texto',
        genericFinalField: 'Ruta del campo de resultado final',
        genericSuccessField: 'Ruta del campo de éxito',
        genericSuccessValue: 'Valor de éxito',
        resultSource: 'Origen del resultado',
        resultFileName: 'Nombre del archivo de resultado',
        successPolicy: 'Política de éxito',
        successExitCodes: 'Códigos de salida correctos',
        defaultTimeoutSeconds: 'Tiempo de espera predeterminado (segundos)',
        killGraceSeconds: 'Margen antes de forzar la terminación (segundos)',
        maxOutputBytes: 'Salida máxima (bytes)',
        stderrTailBytes: 'Final de Stderr (bytes)',
        isolateHome: 'Aislar HOME en cada ejecución',
        supportsResume: 'Admite reanudar la sesión'
      },
      hints: {
        arguments: 'Cada plantilla genera un argumento. Si una condición se resuelve como vacía o false, el argumento se omite.',
        executable: 'Nombre del comando en el PATH del nodo de trabajo, o una ruta absoluta.',
        environment: 'Haz referencia a los secretos vinculados con {{secret.alias}}. El entorno del proceso empieza vacío salvo por la lista de permitidos.',
        successPolicy: 'De forma predeterminada, Garrison decide el éxito a partir del último evento del analizador, no del código de salida.'
      },
      errors: { reservedPrefix: 'El prefijo builtin/ está reservado.' }
    },
    promptTemplates: {
      deleteBound_many: '"{{name}}" está vinculada a {{count}} despliegues, así que el servidor rechazará eliminarla. Quita antes los vínculos de estos despliegues:',
      deleteBound_other: '"{{name}}" está vinculada a {{count}} despliegues, así que el servidor rechazará eliminarla. Quita antes los vínculos de estos despliegues:',
      deleteBound_one: '"{{name}}" está vinculada a {{count}} despliegue, así que el servidor rechazará eliminarla. Quita antes el vínculo de este despliegue:',
      deleteUnbound: '¿Eliminar "{{name}}" y todas sus versiones? Ningún despliegue la vincula. Esta acción no se puede deshacer.',
      ...rp('Plantillas de prompt', 'Todos los prompts y archivos de configuración que genera Garrison. Cada guardado crea una versión.', 'Añadir plantilla', 'Crear plantilla', 'Editar plantilla', 'Detalles de la plantilla', 'Eliminar plantilla', 'Aún no hay plantillas de prompt', 'Crea una plantilla o clona una integrada.'),
      add: 'Nueva plantilla',
      columns: { name: 'Nombre', kind: 'Tipo', currentVersion: 'Versión', description: 'Descripción', isBuiltIn: 'Origen', id: 'ID', lastUpdateUtc: 'Actualizada' },
      fields: { name: 'Nombre', kind: 'Tipo', description: 'Descripción' }
    },
    mcpServers: {
      ...rp('Servidores MCP', 'Servidores MCP que pueden usar los agentes. Los encabezados y el entorno pueden hacer referencia a secretos.', 'Añadir servidor MCP', 'Crear servidor MCP', 'Editar servidor MCP', 'Detalles del servidor MCP', 'Eliminar servidor MCP', 'Aún no hay servidores MCP', 'Registra un servidor MCP para que los despliegues puedan vincularlo.'),
      columns: { name: 'Nombre', transport: 'Transporte', endpoint: 'Endpoint', required: 'Obligatorio', active: 'Activo', id: 'ID', createdUtc: 'Creado' },
      fields: {
        name: 'Nombre',
        transport: 'Transporte',
        description: 'Descripción',
        url: 'URL base',
        path: 'Ruta MCP',
        headers: 'Encabezados',
        headerName: 'Nombre',
        headerValue: 'Plantilla del valor',
        command: 'Comando',
        arguments: 'Argumentos',
        environment: 'Entorno',
        requiredTools: 'Herramientas obligatorias',
        toolTimeoutSeconds: 'Tiempo de espera de herramienta (segundos)',
        required: 'Hacer fallar la ejecución si no es accesible',
        active: 'Activo'
      },
      hints: { requiredTools: 'La comprobación previa hace fallar la ejecución antes de iniciarla si falta alguna de las herramientas indicadas.' },
      actions: { test: 'Probar conexión' }
    },
    secrets: {
      errors: { expiryPast: 'Elige una caducidad en el futuro, o déjala vacía para que el secreto no caduque nunca.' },
      ...rp('Secretos', 'Credenciales cifradas para harnesses e integraciones. Los valores son de solo escritura.', 'Añadir secreto', 'Crear secreto', 'Editar secreto', 'Detalles del secreto', 'Eliminar secreto', 'Aún no hay secretos', 'Añade la clave de API o el token que necesitan tus agentes, por ejemplo una clave de API de Anthropic.'),
      notSet: 'Sin definir',
      neverRefreshed: 'Todavía no',
      reauth: { title: 'Hay que volver a iniciar sesión con esta cuenta', since: 'Desde {{time}}', action: 'Las ejecuciones que usan este secreto fallan hasta que sustituyas su valor. Vuelve a iniciar sesión con codex login usando un CODEX_HOME aparte y guarda el nuevo auth.json con «Definir valor», o cambia el despliegue a un secreto con clave de API de OpenAI. No sigas usando la misma sesión en otro equipo: ambas copias comparten un mismo token de actualización.' },
      columns: { status: 'Estado', accessTokenExpiresUtc: 'Caducidad del token de acceso', name: 'Nombre', kind: 'Tipo', valueLast4: 'Valor', rotatedUtc: 'Último cambio', expiresUtc: 'Caduca', active: 'Activo', id: 'ID' },
      fields: { refreshedUtc: 'Última renovación por Garrison', accessTokenExpiresUtc: 'Caducidad del token de acceso', name: 'Nombre', kind: 'Tipo', description: 'Descripción', value: 'Valor', newValue: 'Nuevo valor', expiresUtc: 'Caduca', active: 'Activo' },
      hints: { expiresUtc: 'Debe estar en el futuro. Déjala vacía para un secreto que no caduca.', kind: 'Usar tokens de suscripción en servidores compartidos puede infringir las condiciones del proveedor. En despliegues compartidos, es preferible usar claves de API.' },
      actions: { setValue: 'Definir valor', rotate: 'Rotar' }
    },
    workspaces: {
      ...rp('Espacios de trabajo', 'Cómo se prepara el espacio de trabajo de una ejecución: vacío, clonado desde Git o precargado con archivos.', 'Añadir plantilla de espacio de trabajo', 'Crear plantilla de espacio de trabajo', 'Editar plantilla de espacio de trabajo', 'Detalles de la plantilla de espacio de trabajo', 'Eliminar plantilla de espacio de trabajo', 'Aún no hay espacios de trabajo', 'Crea una plantilla de espacio de trabajo para que los despliegues partan de un repositorio o de archivos.'),
      columns: { name: 'Nombre', kind: 'Tipo', gitUrl: 'Repositorio', retention: 'Retención', active: 'Activo', id: 'ID', createdUtc: 'Creado' },
      fields: { name: 'Nombre', kind: 'Tipo', description: 'Descripción', gitUrl: 'URL del repositorio', gitRef: 'Rama, etiqueta o commit', gitDepth: 'Profundidad de clonado', gitCredentialSecretId: 'Credencial de Git', persistentVolumeClaim: 'Nombre del PersistentVolumeClaim', files: 'Archivos', filePath: 'Ruta', fileContent: 'Contenido', retention: 'Retención', active: 'Activo' },
      hints: { persistentVolumeClaim: 'Un claim existente en el espacio de nombres de ejecución. Solo las implementaciones con el ejecutor Job de Kubernetes pueden usar este espacio de trabajo; su contenido se conserva entre ejecuciones.' },
      errors: { claimName: 'Use minúsculas, dígitos, guiones y puntos, empezando y terminando con una letra o un dígito.' }
    },
    modelPrices: {
      ...{"title": "Precios de modelos", "subtitle": "Tarifas en USD configuradas por el operador para estimar el coste cuando el harness no lo informa. El coste informado, incluso cero, tiene prioridad.", "add": "Añadir precio de modelo", "create": "Crear precio de modelo", "edit": "Editar precio de modelo", "view": "Detalles del precio de modelo", "deleteTitle": "Eliminar precio de modelo", "emptyTitle": "Aún no hay precios de modelos", "emptyBody": "Añada un precio para un harness y un modelo servido exactos. No hay precios de proveedores precargados."},
      columns: {"name": "Nombre", "active": "Activo", "id": "ID", "createdUtc": "Creado", "model": "Modelo servido", "harnessType": "Harness", "inputUsdPerMillion": "Entrada USD / millón de tokens", "outputUsdPerMillion": "Salida USD / millón de tokens"},
      fields: {"name": "Nombre", "description": "Descripción", "active": "Activo", "model": "Modelo servido", "harnessType": "Harness", "inputUsdPerMillion": "Entrada USD / millón de tokens", "outputUsdPerMillion": "Salida USD / millón de tokens", "cachedInputUsdPerMillion": "Entrada en caché USD / millón de tokens", "reasoningUsdPerMillion": "Razonamiento USD / millón de tokens", "inputIncludesCachedTokens": "La entrada incluye tokens en caché", "outputIncludesReasoningTokens": "La salida incluye tokens de razonamiento"},
      hints: {"cachedInputUsdPerMillion": "Déjelo vacío para usar la tarifa de entrada o salida correspondiente. Cero significa gratis.", "reasoningUsdPerMillion": "Déjelo vacío para usar la tarifa de entrada o salida correspondiente. Cero significa gratis.", "inputIncludesCachedTokens": "Active si la entrada incluye tokens en caché. Desactive para Claude Code, que informa las lecturas de caché por separado.", "outputIncludesReasoningTokens": "Active si la salida incluye tokens de razonamiento. Los subtotales incluidos se restan antes de aplicar su tarifa separada."},
      errors: {"rate": "Introduzca una tarifa finita entre 0 y 1.000.000.000. Cero es válido.", "model": "Introduzca el nombre exacto del modelo, de 1 a 256 caracteres sin caracteres de control."}
    },
    usageQuotas: {"title": "Cuotas de uso", "subtitle": "Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "add": "Añadir cuota de uso", "create": "Crear cuota de uso", "edit": "Editar cuota de uso", "view": "Detalles de la cuota de uso", "deleteTitle": "Eliminar cuota de uso", "emptyTitle": "Aún no hay cuotas de uso", "emptyBody": "Añada una cuota para un inquilino, agente o despliegue. Los límites vacíos son ilimitados.", "columns": {"name": "Nombre", "active": "Activo", "id": "ID", "createdUtc": "Creado", "scope": "Ámbito", "resourceId": "Recurso de destino", "dailyRunLimit": "Ejecuciones por día UTC", "dailyTokenLimit": "Tokens por día UTC", "dailyCostUsdLimit": "USD conocidos por día UTC", "maxConcurrentRuns": "Máximo de ejecuciones activas", "enforcementEnabled": "Aplicar límites"}, "fields": {"name": "Nombre", "description": "Descripción", "active": "Activo", "scope": "Ámbito", "resourceId": "Recurso de destino", "dailyRunLimit": "Ejecuciones por día UTC", "dailyTokenLimit": "Tokens por día UTC", "dailyCostUsdLimit": "USD conocidos por día UTC", "maxConcurrentRuns": "Máximo de ejecuciones activas", "enforcementEnabled": "Aplicar límites"}, "hints": {"dailyRunLimit": "Déjelo vacío para uso ilimitado. Cero impide el uso. Los contadores diarios se reinician a medianoche UTC; la concurrencia cuenta ejecuciones activas. Los límites solo se aplican si su aplicación está habilitada.", "dailyTokenLimit": "Déjelo vacío para uso ilimitado. Cero impide el uso. Los contadores diarios se reinician a medianoche UTC; la concurrencia cuenta ejecuciones activas. Los límites solo se aplican si su aplicación está habilitada.", "dailyCostUsdLimit": "Déjelo vacío para uso ilimitado. Cero impide el uso. Los contadores diarios se reinician a medianoche UTC; la concurrencia cuenta ejecuciones activas. Los límites solo se aplican si su aplicación está habilitada.", "maxConcurrentRuns": "Déjelo vacío para uso ilimitado. Cero impide el uso. Los contadores diarios se reinician a medianoche UTC; la concurrencia cuenta ejecuciones activas. Los límites solo se aplican si su aplicación está habilitada.", "resourceId": "Añada una cuota para un inquilino, agente o despliegue. Los límites vacíos son ilimitados.", "enforcementEnabled": "Desactivado por defecto. Active para rechazar ejecuciones al alcanzar los límites y reducir presupuestos compatibles. Desactivado, solo se registra el uso."}, "errors": {"limit": "Introduzca un límite no negativo dentro del rango del campo. Los recuentos deben ser enteros."}, "incomplete": "La contabilidad de costos está incompleta: {{count}} ejecuciones finalizadas no tienen costo informado ni estimado. Los límites solo se aplican si están habilitados; la falta de costo por sí sola no bloquea la admisión.", "actions": {"usage": "Uso diario"}, "usage": {"windowStartUtc": "Inicio del periodo (UTC)", "windowEndUtc": "Reinicio diario (UTC)", "runsUsed": "Ejecuciones admitidas", "tokensUsed": "Tokens completados", "costUsd": "Coste conocido (USD)", "unknownCostRuns": "Ejecuciones sin coste", "activeRuns": "Ejecuciones activas"}},
    artifactStores: {
      ...rp('Almacenes de artefactos', 'Dónde se guardan los archivos que producen las ejecuciones.', 'Añadir almacén de artefactos', 'Crear almacén de artefactos', 'Editar almacén de artefactos', 'Detalles del almacén de artefactos', 'Eliminar almacén de artefactos', 'Aún no hay almacenes de artefactos', 'Crea un almacén de artefactos para conservar los resultados de las ejecuciones.'),
      columns: { name: 'Nombre', kind: 'Tipo', description: 'Descripción', active: 'Activo', id: 'ID', createdUtc: 'Creado' },
      fields: { name: 'Nombre', kind: 'Tipo', description: 'Descripción', active: 'Activo' }
    },
    agents: {
      deleteWithDeployments_many: '¿Eliminar "{{name}}" y sus {{count}} despliegues? Los despliegues de abajo también se eliminan. Esta acción no se puede deshacer.',
      deleteWithDeployments_other: '¿Eliminar "{{name}}" y sus {{count}} despliegues? Los despliegues de abajo también se eliminan. Esta acción no se puede deshacer.',
      deleteWithDeployments_one: '¿Eliminar "{{name}}" y su {{count}} despliegue? El despliegue de abajo también se elimina. Esta acción no se puede deshacer.',
      deleteNoDeployments: '¿Eliminar "{{name}}"? No tiene despliegues. Esta acción no se puede deshacer.',
      ...rp('Agentes', 'Capacidades con nombre expuestas mediante REST, MCP y A2A. Los despliegues deciden cómo se ejecutan.', 'Añadir agente', 'Crear agente', 'Editar agente', 'Detalles del agente', 'Eliminar agente', 'Aún no hay agentes', 'Añade un agente o aplica el manifiesto de ejemplo desde Configuración > Manifiestos.'),
      sections: { identity: 'Identidad', exposure: 'Exposición', io: 'Entrada y salida', delegation: 'Delegación' },
      columns: { name: 'Nombre', displayName: 'Nombre visible', kind: 'Tipo', exposure: 'Exposición', delegationMode: 'Delegación', tags: 'Etiquetas', active: 'Activo', id: 'ID', createdUtc: 'Creado' },
      fields: {
        name: 'Nombre',
        displayName: 'Nombre visible',
        description: 'Descripción',
        kind: 'Tipo',
        agentVersion: 'Versión',
        tags: 'Etiquetas',
        remoteProtocol: 'Protocolo remoto',
        remoteEndpointUrl: 'URL del endpoint remoto',
        exposeA2A: 'Exponer mediante A2A',
        exposeMcpTool: 'Exponer como herramienta MCP propia',
        mcpToolName: 'Nombre de la herramienta MCP',
        skills: 'Habilidades A2A',
        skillId: 'ID de la habilidad',
        skillName: 'Nombre',
        skillDescription: 'Descripción',
        inputMode: 'Modo de entrada',
        inputSchemaJson: 'JSON Schema de entrada',
        outputSchemaJson: 'JSON Schema de salida',
        delegationMode: 'Delegación',
        delegationAllowList: 'Agentes a los que puede llamar',
        delegationMaxDepth: 'Profundidad máxima',
        delegationAllowRecursion: 'Permitir recursión',
        active: 'Activo'
      },
      hints: { name: 'Letras minúsculas, dígitos y guiones. Se usa en las URL y en las tarjetas A2A.' },
      errors: { dnsName: 'Usa letras minúsculas, dígitos y guiones, empezando y terminando con una letra o un dígito.' }
    },
    deployments: {
      approvalsOn_one: 'Activadas, {{count}} regla',
      approvalsOn_other: 'Activadas, {{count}} reglas',
      approvalsOn_many: 'Activadas, {{count}} reglas',
      approvalsOff: 'Desactivadas',
      promptRoles: { Repair: 'Reparación de salida estructurada', DelegatedTask: 'Envoltorio de tarea para ejecuciones delegadas', Task: 'Envoltorio de tarea', System: 'Prompt del sistema', ConversationFallback: 'Reconstrucción de conversación (transcripción)' },
      ...rp('Despliegues', 'Vincula un agente a un perfil de harness, prompts, secretos, servidores MCP, ubicación y límites.', 'Añadir despliegue', 'Crear despliegue', 'Editar despliegue', 'Detalles del despliegue', 'Eliminar despliegue', 'Aún no hay despliegues', 'Crea un despliegue para que un agente se pueda ejecutar.'),
      steps: { approvals: 'Aprobaciones', basics: 'Datos básicos', harness: 'Harness', prompts: 'Prompts', resources: 'Recursos', overrides: 'Sobrescrituras', placement: 'Ubicación y límites' },
      columns: { approvalsEnabled: 'Aprobaciones', name: 'Nombre', agentId: 'Agente', harnessProfileId: 'Perfil de harness', model: 'Modelo', executor: 'Ejecutor', weight: 'Peso', configVersion: 'Versión de configuración', active: 'Activo', id: 'ID', createdUtc: 'Creado' },
      fields: {
        approvalsEnabled: 'Preguntar antes de las llamadas a herramientas (aprobaciones)',
        approvalDefaultAction: 'Cuando ninguna regla coincide',
        approvalTimeoutSeconds: 'Tiempo de espera de la aprobación (segundos)',
        approvalTimeoutDecision: 'Decisión cuando nadie responde',
        approvalRules: 'Reglas de aprobación',
        ruleAction: 'Acción',
        rulePattern: 'Regla',
        ruleInputPattern: 'Patrón de entrada',
        ruleDescription: 'Descripción',
        approvalTest: 'Probar una llamada a herramienta',
        name: 'Nombre',
        agentId: 'Agente',
        description: 'Descripción',
        weight: 'Peso del tráfico',
        active: 'Activo',
        harnessProfileId: 'Perfil de harness',
        model: 'Modelo',
        fallbackModel: 'Modelo de respaldo',
        effort: 'Esfuerzo',
        maxTurns: 'Turnos máximos',
        maxBudgetUsd: 'Presupuesto máximo (USD)',
        parameters: 'Parámetros',
        paramName: 'Nombre',
        paramValue: 'Valor',
        promptBindings: 'Vínculos de prompt',
        promptRole: 'Rol',
        template: 'Plantilla',
        pinnedVersion: 'Versión fijada',
        resourceBindings: 'Vínculos de recursos',
        bindingKind: 'Tipo',
        alias: 'Alias',
        resource: 'Recurso',
        workspaceTemplateId: 'Plantilla de espacio de trabajo',
        artifactStoreId: 'Almacén de artefactos',
        argumentOverrides: 'Sobrescrituras de argumentos',
        operation: 'Operación',
        match: 'Coincidencia',
        argTemplate: 'Plantilla',
        condition: 'Condición',
        environmentOverrides: 'Sobrescrituras del entorno',
        envName: 'Nombre',
        envValue: 'Plantilla del valor',
        isSecret: 'Secreto',
        fileOverrides: 'Sobrescrituras de archivos',
        allowedRunOverrides: 'Sobrescrituras por ejecución que pueden definir los llamantes',
        validation: 'Validación',
        pattern: 'Patrón o valores',
        nodePoolId: 'Grupo de nodos',
        nodeSelector: 'Selector de nodos',
        maxConcurrentRuns: 'Máximo de ejecuciones simultáneas',
        timeoutSeconds: 'Tiempo de espera (segundos)',
        maxAttempts: 'Intentos máximos',
        repetitionGuard: 'Protección contra repeticiones',
        maxAssistantChars: 'Máximo de caracteres del asistente',
        noProgressSeconds: 'Límite sin avance (segundos)',
        executor: 'Ejecutor',
        podCpuRequest: 'Solicitud de CPU',
        podCpuLimit: 'Límite de CPU',
        podMemoryRequest: 'Solicitud de memoria',
        podMemoryLimit: 'Límite de memoria',
        podEphemeralStorageRequest: 'Solicitud de almacenamiento efímero',
        podEphemeralStorageLimit: 'Límite de almacenamiento efímero'
      },
      hints: {
        approvalsEnabled: 'Funciona con perfiles de Claude Code y con perfiles que usan el app-server de Codex. Los demás harnesses no tienen enlace de aprobación, así que el servidor rechaza este ajuste para ellos.',
        approvalDefaultAction: 'Preguntar a una persona espera en la bandeja de Aprobaciones hasta que alguien decida o pase el tiempo de espera.',
        approvalTimeoutSeconds: 'De 10 a 3.600 segundos. Si lo dejas vacío, se usan 300.',
        approvalRules: 'Denegar prevalece sobre Preguntar, y Preguntar sobre Permitir. Ejemplos: Bash(npm test), Bash(npm run *), Edit(src/**), WebFetch(domain:example.com), mcp__github__*.',
        secretsKinds: 'El perfil de harness {{profile}} necesita cualquier secreto de tipo {{kinds}}. Vincula uno con cualquier alias.',
        secretsAliases: 'El perfil de harness {{profile}} lee secretos vinculados con estos alias: {{aliases}}.',
        secretsNone: 'El perfil de harness {{profile}} no lee ningún secreto, así que no hace falta vincular ninguno.',
        promptBindings: 'Asocia los roles de prompt (System, Task, DelegatedTask y cualquier rol que use el perfil de harness) a plantillas. Deja la versión vacía para seguir la más reciente.',
        resourceBindings: 'Los alias se convierten en variables de plantilla, por ejemplo {{secret.anthropic}}.',
        weight: 'Las solicitudes sin un despliegue explícito se reparten entre los despliegues activos según su peso.',
        maxConcurrentRuns: '0 significa sin límite.',
        timeoutCap: 'El ajuste del clúster {{setting}} limita cada ejecución a {{value}} segundos.',
        zeroUnlimited: '0 significa sin límite.',
        zeroOff: '0 desactiva la protección.',
        guardDefault: 'Vacío usa el valor del clúster, {{value}}, de {{setting}}.',
        guardDefaultUnknown: 'Vacío usa el ajuste del clúster {{setting}}.',
        guardOwn: 'Definido en este despliegue. El valor del clúster ({{setting}}) es {{value}}.',
        guardOwnUnknown: 'Definido en este despliegue en lugar del ajuste del clúster {{setting}}.',
        guardFollowing: 'Sigue el valor del clúster, {{value}}, de {{setting}}.',
        executorInherit: 'Vacío usa el valor predeterminado del grupo de nodos: {{executor}}.',
        executorSet: 'Proceso ejecuta el harness dentro del worker; Job de Kubernetes lo ejecuta en su propio pod.',
        podCpuRequest: 'Los recursos del pod solo se aplican a ejecuciones con Job de Kubernetes. Use cantidades de Kubernetes como 500m, 2, 512Mi o 4Gi; vacío usa el valor predeterminado del worker.'
      },
      actions: { addRule: 'Añadir regla', compilePreview: 'Vista previa de compilación', test: 'Invocación de prueba', useClusterDefault: 'Usar el valor del clúster' },
      sections: {
        guards: 'Protecciones de ejecución',
        execution: 'Ejecutor y recursos del pod'
      },
      placeholders: {
        ruleInputPattern: 'Expresión regular opcional sobre el JSON de entrada',
        clusterDefault: 'Valor del clúster ({{value}})',
        clusterDefaultUnknown: 'Valor del clúster'
      },
      executorInherit: 'Predeterminado del grupo de nodos',
      executorInheritShort: 'Predeterminado del grupo',
      errors: { rulePatternRequired: 'Introduce un patrón de regla.', rulePatternOneLine: 'Un patrón de regla debe caber en una sola línea.', rulePatternTooLong: 'Un patrón de regla puede tener como máximo 1.000 caracteres.', tooManyRules: 'Un despliegue puede tener como máximo 500 reglas de aprobación.', approvalTimeout: 'Introduce un número entero de segundos entre 10 y 3.600.', quantity: 'Use una cantidad de Kubernetes como 500m, 2, 512Mi o 4Gi.' },
      guardStates: {
        on: 'activada',
        off: 'desactivada'
      }
    },
    nodePools: {
      ...rp('Grupos de nodos', 'Agrupa los nodos de trabajo por etiqueta y, opcionalmente, dedícalos a inquilinos.', 'Añadir grupo de nodos', 'Crear grupo de nodos', 'Editar grupo de nodos', 'Detalles del grupo de nodos', 'Eliminar grupo de nodos', 'Aún no hay grupos de nodos', 'Crea un grupo de nodos para dedicar capacidad.'),
      allTenants: 'Todos los inquilinos',
      columns: { name: 'Nombre', description: 'Descripción', tenants: 'Inquilinos', defaultExecutor: 'Ejecutor predeterminado', active: 'Activo', id: 'ID', createdUtc: 'Creado' },
      fields: { name: 'Nombre', description: 'Descripción', defaultExecutor: 'Ejecutor predeterminado', tenants: 'ID de inquilinos permitidos', active: 'Activo' },
      hints: { tenants: 'Déjalo vacío para permitir todos los inquilinos.' }
    },
    runs: {
      ...rp('Ejecuciones', 'Cada invocación de agente con su estado, nodo, duración y resultado.', 'Añadir ejecución', 'Crear ejecución', 'Editar ejecución', 'Detalles de la ejecución', 'Eliminar ejecución', 'Aún no hay ejecuciones', 'Invoca un agente para iniciar una ejecución.'),
      columns: {
        approvalWaitMs: 'Espera de aprobación',
        delegationWaitMs: 'Espera por delegación',
        timeToFirstTokenExcludingDelegationMs: 'TTFT sin delegación',
        id: 'Ejecución',
        agentName: 'Agente',
        status: 'Estado',
        outcome: 'Resultado',
        harnessType: 'Harness',
        leaseNodeName: 'Nodo',
        timeToFirstTokenMs: 'TTFT',
        streamingMs: 'Transmisión',
        executionMs: 'Duración',
        queueMs: 'Tiempo en cola',
        totalMs: 'Tiempo total',
        inputTokens: 'Tokens de entrada',
        outputTokens: 'Tokens de salida',
        cachedTokens: 'Tokens en caché',
        reasoningTokens: 'Tokens de razonamiento',
        outputTokensPerSecond: 'Tokens/s',
        costUsd: 'Coste',
        toolCallCount: 'Llamadas a herramientas',
        depth: 'Profundidad',
        createdUtc: 'Creada',
        conversationId: 'Conversación'
      },
      actions: { cancel: 'Cancelar ejecución', retry: 'Reintentar ejecución' },
      toasts: { cancelRequested: 'Cancelación solicitada.', retried: 'Reintento iniciado.' },
      turn: 'turno {{turn}}'
    },
    nodes: {
      ...rp('Nodos', 'Nodos de trabajo que obtienen concesiones de ejecuciones y las ejecutan. Acordona o drena un nodo antes del mantenimiento.', 'Añadir nodo', 'Crear nodo', 'Editar nodo', 'Detalles del nodo', 'Eliminar nodo', 'Aún no hay nodos', 'Los nodos de trabajo se registran solos al iniciarse. Despliega el StatefulSet de los nodos de trabajo o ejecuta Garrison.Worker en local.'),
      columns: { name: 'Nombre', status: 'Estado', capacity: 'Ejecuciones', harnesses: 'Harnesses', executors: 'Ejecutores', containerized: 'En contenedor', labels: 'Etiquetas', nodeVersion: 'Versión', lastHeartbeatUtc: 'Último latido', id: 'ID' },
      fields: { address: 'Dirección', maxConcurrentRuns: 'Capacidad', childReserveSlots: 'Reserva para hijas', maxResidentWaiters: 'Máximo de ejecuciones en espera', activeRuns: 'Ejecuciones activas', capabilities: 'Capacidades', detectedVersion: 'Versión', available: 'Disponible', detail: 'Detalle' },
      actions: { cordon: 'Acordonar', uncordon: 'Quitar acordonamiento', drain: 'Drenar', runs: 'Ver ejecuciones', grafana: 'Abrir en Grafana' },
      toasts: { cordoned: 'Nodo acordonado.', uncordoned: 'Acordonamiento del nodo retirado.', draining: 'El nodo se está drenando.' }
    },
    controlNodes: {
      ...rp('Plano de control', 'Réplicas del servidor que sirven la API, MCP y A2A y planifican las ejecuciones. Cada una se registra sola y envía un latido cada 5 segundos.', 'Añadir nodo de control', 'Crear nodo de control', 'Editar nodo de control', 'Detalles del nodo de control', 'Eliminar nodo de control', 'No hay nodos de control registrados', 'Los nodos de control aparecen cuando se inicia una réplica del servidor. Los servidores más antiguos que esta consola no los informan.'),
      columns: { name: 'Nombre', status: 'Estado', version: 'Versión', schemaVersion: 'Esquema', backplane: 'Bus de eventos', uptime: 'Tiempo activo', lastHeartbeatUtc: 'Último latido', activeRequests: 'Solicitudes', openStreams: 'Flujos', heldLongPolls: 'Sondeos largos', address: 'Dirección', hostname: 'Nombre de host', startedUtc: 'Iniciado', id: 'ID' },
      fields: { name: 'Nombre', id: 'ID de nodo', hostname: 'Nombre de host', address: 'Dirección', isLeader: 'Líder', leaderEpoch: 'Época del líder', version: 'Versión', schemaVersion: 'Versión del esquema', backplane: 'Bus de eventos', startedUtc: 'Iniciado', uptime: 'Tiempo activo', lastHeartbeatUtc: 'Último latido', activeRequests: 'Solicitudes activas', openStreams: 'Flujos abiertos', heldLongPolls: 'Sondeos largos retenidos', respondingNodeId: 'Respondido por' },
      leader: 'Líder',
      stale: 'Sin latido',
      answeredBy: 'Qué réplica respondió: {{node}}',
      answeredByLeader: 'Qué réplica respondió: {{node}} (el líder)',
      actions: { grafana: 'Abrir en Grafana' }
    },
    audit: {
      ...rp('Auditoría', 'Eventos de autenticación, autorización y configuración de este inquilino.', 'Añadir registro de auditoría', 'Crear registro de auditoría', 'Editar registro de auditoría', 'Detalles del registro de auditoría', 'Eliminar registro de auditoría', 'Aún no hay registros de auditoría', 'Los eventos de seguridad aparecen aquí a medida que las personas y los agentes usan Garrison.'),
      emptyTitle: 'Aún no hay registros de auditoría',
      columns: { createdUtc: 'Hora', eventType: 'Evento', principalName: 'Entidad', resource: 'Recurso', reason: 'Motivo', sourceIp: 'IP de origen', id: 'ID' },
      fields: {
        eventType: 'Evento',
        principalType: 'Tipo de entidad',
        principalName: 'Entidad',
        principalId: 'ID de la entidad',
        resourceType: 'Tipo de recurso',
        resourceId: 'ID del recurso',
        operation: 'Operación',
        method: 'Método',
        path: 'Ruta',
        authResult: 'Resultado de la autenticación',
        authorizationResult: 'Resultado de la autorización',
        reason: 'Motivo',
        bypassReason: 'Motivo de la omisión',
        statusCode: 'Código de estado',
        sourceIp: 'IP de origen',
        requestId: 'ID de la solicitud',
        createdUtc: 'Hora'
      }
    },
    manifestApplies: {
      ...rp('Historial de aplicaciones', 'Cada aplicación y simulación de manifiesto, con resultados por documento.', 'Añadir aplicación', 'Crear aplicación', 'Editar aplicación', 'Detalles de la aplicación', 'Eliminar aplicación', 'Aún no hay aplicaciones', 'Las aplicaciones aparecen aquí después de aplicar o simular un manifiesto.'),
      columns: { createdUtc: 'Hora', principalName: 'Aplicado por', dryRun: 'Simulación', counts: 'Resultados' }
    },
    conversations: {
      title: 'Conversaciones',
      subtitle: 'Intercambios de varios turnos con un agente. Cada turno es una ejecución que reanuda la sesión del harness del turno anterior.',
      add: 'Añadir conversación',
      create: 'Crear conversación',
      edit: 'Editar conversación',
      view: 'Detalles de la conversación',
      deleteTitle: 'Eliminar conversación',
      emptyTitle: 'Aún no hay conversaciones',
      emptyBody: 'Inicia una en la página Invocar con «Iniciar una conversación nueva» o envía un mensaje A2A: cada contexto A2A es una conversación.',
      untitled: 'Conversación sin título',
      columns: {
        title: 'Título',
        agentName: 'Agente',
        state: 'Estado',
        turnCount: 'Turnos',
        affinityNodeName: 'Nodo de afinidad',
        fallbackCount: 'Reconstrucciones',
        lastFallbackReason: 'Última reconstrucción',
        harnessType: 'Harness',
        callerName: 'Iniciada por',
        contextId: 'ID de contexto',
        sessionId: 'ID de sesión',
        lastActivityUtc: 'Última actividad',
        createdUtc: 'Creada',
        id: 'ID'
      },
      states: {
        busy: 'Trabajando',
        idle: 'En espera'
      },
      actions: {
        continue: 'Continuar',
        runs: 'Ver turnos como ejecuciones'
      }
    }
  },
  views: {
    approvalDetail: {
      title: 'Aprobación',
      titleWithTool: 'Aprobación para {{tool}}',
      backToInbox: 'Todas las aprobaciones',
      pending: 'Esperando a que una persona permita o deniegue esta llamada a herramienta.',
      pendingExpires: 'Esperando a una persona. Si nadie decide, caduca {{when}} con la decisión {{decision}}.',
      request: 'Solicitud',
      rules: 'Reglas',
      noRule: 'Ninguna regla coincidió',
      noInput: 'No se registró ninguna entrada.',
      notFoundTitle: 'Aprobación no encontrada',
      notFoundBody: 'Puede pertenecer a otro inquilino, o el ID es incorrecto.'
    },
    home: {
      observabilityState: { reachable: 'Accesible', unreachable: 'No accesible', checking: 'Comprobando', unknown: 'Estado desconocido' },
      observabilityVersion: 'Versión {{version}}',
      observabilityOpen: 'Abrir {{service}}',
      kpisGrafana: 'Abrir el resumen en Grafana',
      grafanaDashboards: 'Paneles de Grafana',
      grafanaSections: { overview: 'Resumen', http: 'API HTTP', runs: 'Ejecuciones', agents: 'Agentes', models: 'Modelos y tokens', workers: 'Nodos de trabajo', kubernetes: 'Ejecutor de Kubernetes', protocols: 'Protocolos', scheduler: 'Planificador y cola', database: 'Base de datos', controlPlane: 'Plano de control', security: 'Seguridad y autenticación', integrations: 'Integraciones', logs: 'Registros y trazas' },
      observabilitySetup: 'Configurar la observabilidad',
      observabilityNone: 'Esta instalación no tiene configurado ningún servicio de observabilidad (Grafana, Prometheus, Tempo o Loki).',
      observability: 'Observabilidad',
      title: 'Inicio',
      subtitle: 'Lo que están haciendo ahora mismo tus agentes y nodos de trabajo.',
      lastLoaded: 'Actualizado {{time}}',
      partial: 'Algunos paneles no se pudieron cargar. Los valores mostrados son parciales.',
      getStartedTitle: 'Aún no hay agentes en este inquilino',
      getStartedBody: 'El asistente de configuración añade una credencial, aplica un agente de ejemplo y ejecuta una prueba.',
      runSetup: 'Ejecutar configuración',
      kpis: {
        agents: 'Agentes',
        deployments: 'Despliegues',
        activeRuns: 'Ejecuciones activas',
        queued: 'En cola',
        succeeded: 'Correctas',
        failed: 'Fallidas',
        nodes: 'Nodos listos',
        controlNodes: 'Plano de control listo',
        nodesNote: 'Listos / total',
        last24h: 'Últimas 24 horas'
      },
      requestActivity: 'Actividad de solicitudes a la API',
      nodesTitle: 'Nodos',
      noNodesTitle: 'No hay nodos de trabajo registrados',
      noNodesBody: 'Inicia Garrison.Worker o escala el StatefulSet de los nodos de trabajo. Los nodos se registran solos.',
      nodeLoad: '{{active}} de {{max}} ejecuciones',
      controlPlaneSection: 'Plano de control',
      workersSection: 'Nodos de trabajo',
      openControlPlane: 'Ver todo',
      openWorkers: 'Ver todo',
      noControlNodes: 'Todavía no se ha registrado ningún nodo de control.',
      controlNodesUnavailable: 'Los nodos de control no están disponibles: el servidor es más antiguo que esta consola o no puedes leer los nodos.',
      recentFailures: 'Fallos recientes',
      noFailures: 'No hay ejecuciones fallidas recientes.',
      cta: {
        title: 'Tareas habituales',
        invoke: 'Invocar un agente',
        addAgent: 'Añadir un agente',
        applyManifest: 'Aplicar un manifiesto',
        inspectRuns: 'Inspeccionar ejecuciones',
        nodes: 'Revisar los nodos de trabajo',
        apiExplorer: 'Abrir el Explorador de API',
        analytics: 'Ver la analítica de ejecuciones'
      },
      externalServices: 'Servicios externos',
      externalServicesNote: 'Herramientas de observabilidad incluidas. Cambia las credenciales predeterminadas antes de compartir este despliegue.',
      externalServicesNone: 'No hay servicios externos configurados para este despliegue.',
      credentials: 'Credenciales predeterminadas',
      services: { loki: 'Loki', grafana: 'Grafana', prometheus: 'Prometheus', tempo: 'Tempo' }
    },
    markdown: {
      showRaw: 'Ver texto sin formato',
      showRendered: 'Ver con formato'
    },
    invoke: {
      stream: {
        tabsLabel: 'Vistas de la respuesta',
        cardLabel: 'Salida de la ejecución',
        preview: 'Vista previa',
        response: 'Respuesta',
        starting: 'Iniciando la ejecución...',
        live: 'En vivo',
        finished: 'Terminada',
        elapsed: 'Transcurrido',
        firstToken: 'Primer token',
        tokensPerSecond: 'Velocidad',
        finishedHint: 'Ejecución terminada.',
        showResponse: 'Ver la respuesta',
        reasoning: 'Razonamiento',
        waiting: 'Esperando la salida...',
        waitingCodex: 'Esperando la salida. Codex envía su respuesta completa al terminar.',
        codexNote: 'Codex no transmite en streaming: su respuesta aparece aquí completa cuando termina la ejecución.',
        noText: 'La ejecución no transmitió texto. La pestaña Respuesta tiene el resultado.',
        jump: 'Ir a lo más reciente',
        tool: {
          running: 'en curso',
          ok: 'correcta',
          failed: 'fallida'
        }
      },
      noDeployment: 'Este agente no tiene ningún despliegue activo con peso mayor que cero, así que se rechazaría la invocación. Añade un despliegue en la pestaña Despliegues o sube el peso de uno.',
      title: 'Invocar',
      subtitle: 'Envía un mensaje a un agente y observa cómo se transmite la transcripción.',
      request: 'Solicitud',
      agent: 'Agente',
      deployment: 'Despliegue',
      weighted: 'Cualquier despliegue activo (ponderado)',
      default: 'Valor predeterminado del despliegue',
      message: 'Mensaje',
      messagePlaceholder: '¿Qué debe hacer el agente?',
      shortcut: 'Pulsa Ctrl+Enter o Cmd+Enter para enviar.',
      send: 'Enviar',
      sending: 'Enviando...',
      openRun: 'Abrir ejecución',
      idleTitle: 'Aún no hay ninguna ejecución',
      idleBody: 'Envía un mensaje para iniciar una ejecución. La transcripción aparece aquí a medida que se transmite.',
      noAgentsTitle: 'No hay agentes que invocar',
      noAgentsBody: 'Crea un agente y un despliegue, o aplica el manifiesto de ejemplo.',
      applySample: 'Ir a manifiestos',
      stopOnLeave: 'Detener la ejecución al salir',
      cancel: 'Cancelar ejecución',
      cancelling: 'Cancelando...',
      timeLimit: 'Límite de tiempo',
      timeLimitPlaceholder: 'Valor del despliegue',
      timeLimitClear: 'Usar el valor predeterminado',
      timeLimitRange: 'Permitido: de {{min}} a {{max}}.',
      timeLimitAny: 'Segundos que puede durar la ejecución antes de agotar el tiempo.',
      timeLimitCap: 'El clúster detiene toda ejecución tras {{max}}.',
      timeLimitErrors: {
        notInteger: 'Escribe un número entero de segundos.',
        range: 'Escribe un límite de tiempo de {{min}} a {{max}}.',
        aboveCap: 'El clúster permite como máximo {{max}} por ejecución.'
      },
      timeUnits: {
        seconds: '{{value}} s',
        minutes: '{{value}} min',
        hours: '{{value}} h',
        secondsWord: 'segundos'
      },
      conversation: {
        mode: 'Conversación',
        modes: {
          none: 'Ejecución única (sin conversación)',
          start: 'Iniciar una conversación nueva',
          continue: 'Continuar una conversación'
        },
        pick: 'Conversación que continuar',
        choose: 'Elige una conversación',
        option: '{{title}} (turnos: {{turns}})',
        pinned: 'Cada turno se ejecuta en el despliegue del primer turno de la conversación, así que aquí no se puede elegir el despliegue.',
        busy: 'Esta conversación todavía está procesando su turno anterior. Se rechazará un mensaje nuevo hasta que termine esa ejecución.',
        open: 'Abrir conversación (turno {{turn}})'
      }
    },
    runDetail: {
      awaitingApproval_one: 'Esta ejecución espera a que una persona apruebe {{count}} llamada a herramienta.',
      awaitingApproval_other: 'Esta ejecución espera a que una persona apruebe {{count}} llamadas a herramientas.',
      awaitingApproval_many: 'Esta ejecución espera a que una persona apruebe {{count}} llamadas a herramientas.',
      reviewApprovals: 'Revisar',
      approvals_one: 'Aprobaciones ({{count}})',
      approvals_other: 'Aprobaciones ({{count}})',
      approvals_many: 'Aprobaciones ({{count}})',
      noApprovals: 'Esta ejecución no ha pedido ninguna aprobación.',
      openApproval: 'Abrir aprobación',
      viewTrace: 'Ver traza',
      viewLogs: 'Ver registros',
      traceId: 'ID de traza',
      deploymentDeleted: 'El despliegue que usó esta ejecución se eliminó, así que no se puede reintentar. Invoca de nuevo al agente {{agent}}.',
      templatesUsed: 'Plantillas usadas',
      agentDeleted: 'El agente {{agent}} ya no existe, así que esta ejecución no se puede reintentar. Su registro, transcripción y telemetría siguen disponibles aquí.',
      title: 'Ejecución',
      titleWithAgent: 'Ejecución de {{agent}}',
      deployment: 'Despliegue',
      model: 'Modelo servido',
      tokensLabel: 'Tokens',
      tokens: '{{input}} de entrada, {{output}} de salida',
      estimated: 'estimado',
      caller: 'Llamante',
      parent: 'Ejecución principal',
      attempt: 'Intento',
      outputSchema: 'Esquema de salida',
      outputSchemaStates: {
        valid: 'Válido',
        validAfterRepair: 'Válido tras una reparación',
        invalid: 'No válido',
        invalidAfterRepair: 'No válido tras una reparación'
      },
      started: 'Iniciada',
      completed: 'Completada',
      exitCode: 'Código de salida',
      transcript: 'Transcripción',
      result: 'Resultado',
      input: 'Entrada',
      stderr: 'Stderr',
      children_one: 'Ejecuciones secundarias ({{count}})',
      children_other: 'Ejecuciones secundarias ({{count}})',
      children_many: 'Ejecuciones secundarias ({{count}})',
      eventFilter: 'Mostrar',
      eventCount_one: '{{count}} evento',
      eventCount_other: '{{count}} eventos',
      eventCount_many: '{{count}} eventos',
      noEvents: 'Aún no hay eventos. Los eventos aparecen a medida que el harness los genera.',
      failed: 'Fallida',
      noResult: 'La ejecución no generó texto de resultado.',
      pending: 'El resultado aparece cuando termina la ejecución.',
      structuredOutput: 'Salida estructurada',
      templateVersions: 'Versiones de plantillas de prompt utilizadas',
      noStderr: 'No se capturó nada en Stderr.',
      noChildren: 'Esta ejecución no delegó en otros agentes.',
      confirmCancel: '¿Cancelar esta ejecución? El proceso del harness se detiene en su nodo.',
      notFoundTitle: 'Ejecución no encontrada',
      notFoundBody: 'Puede que se haya eliminado o que pertenezca a otro inquilino.',
      telemetry: {
        approvalNote: 'Esta ejecución pasó {{wait}} esperando decisiones de aprobación. El tiempo de ejecución incluye esa espera.',
        delegationNote: 'Esta ejecución esperó {{wait}} a ejecuciones que delegó. El tiempo hasta el primer token es {{ttft}} con esa espera y {{excluding}} sin ella; esta última cifra es la que se compara con agentes que no delegan.',
        title: 'Telemetría',
        phases: 'Tiempo de ejecución por fase',
        phase: { delegation: 'Esperando ejecuciones delegadas', queue: 'Cola', startup: 'Inicio hasta el primer token', streaming: 'Transmisión', tail: 'Tras el último token' },
        fields: {
          approvalWaitMs: 'Espera de aprobación',
          delegationWaitMs: 'Espera por delegación',
          timeToFirstTokenExcludingDelegationMs: 'Tiempo hasta el primer token sin delegación',
          timeToFirstTokenMs: 'Tiempo hasta el primer token',
          streamingMs: 'Tiempo de transmisión',
          executionMs: 'Tiempo de ejecución',
          queueMs: 'Tiempo en cola',
          totalMs: 'Tiempo total',
          outputTokensPerSecond: 'Tokens de salida por segundo',
          inputTokens: 'Tokens de entrada',
          outputTokens: 'Tokens de salida',
          cachedTokens: 'Tokens en caché',
          reasoningTokens: 'Tokens de razonamiento',
          toolCallCount: 'Llamadas a herramientas',
          costUsd: 'Coste',
          firstTokenUtc: 'Primer token a las',
          lastTokenUtc: 'Último token a las'
        }
      },
      conversation: 'Conversación',
      conversationSession: 'Sesión',
      resumeSessionId: 'Sesión reanudada',
      affinityNode: 'Nodo de afinidad',
      affinityUntil: 'hasta {{time}}'
    },
    queue: {
      title: 'Cola',
      subtitle: 'Trabajo que espera un nodo, con concesión o en ejecución, por agente y harness.',
      queued: 'En cola',
      leased: 'Concedidas',
      running: 'En ejecución',
      emptyTitle: 'No hay nada en espera',
      emptyBody: 'Las ejecuciones aparecen aquí mientras esperan un nodo de trabajo.'
    },
    agentDetail: {
      invoke: 'Invocar',
      grafana: 'Abrir en Grafana',
      noActiveDeployment: 'Este agente no tiene ningún despliegue activo, por lo que se rechazarán las invocaciones.',
      deployments_one: 'Despliegues ({{count}})',
      deployments_other: 'Despliegues ({{count}})',
      deployments_many: 'Despliegues ({{count}})',
      recentRuns: 'Ejecuciones recientes',
      card: 'Tarjeta A2A',
      traffic: 'Reparto del tráfico',
      noDeploymentsTitle: 'No hay despliegues',
      noDeploymentsBody: 'Crea un despliegue para vincular este agente a un harness.',
      noRuns: 'Este agente aún no se ha ejecutado.',
      selectionNote: 'Cada invocación sin un despliegue explícito va a un despliegue activo, elegido al azar en proporción a su peso.',
      manageDeployments: 'Administrar despliegues',
      conversations: 'Conversaciones'
    },
    templateEditor: {
      cloneToEdit: 'Clonar para editar',
      builtInReadOnly: 'Las plantillas integradas son de solo lectura, así que todos los campos están bloqueados. Clónala para obtener una copia editable.',
      renameHint: 'Puedes renombrar esta plantilla. Los despliegues conservan sus vínculos porque usan su ID, pero las plantillas que la incluyen por nombre se deben actualizar a mano.',
      cloneDialog: { taken: 'Ya existe una plantilla llamada {{name}}. Elige otro nombre.', reserved: 'Los nombres que empiezan por builtin/ están reservados para las plantillas integradas.', hint: 'Puedes renombrar la copia más tarde en su página.', name: 'Nombre de la copia', body: 'La copia empieza con el contenido actual como versión 1 y se puede editar, renombrar y eliminar.', title: 'Clonar {{name}}' },
      newTitle: 'Nueva plantilla de prompt',
      subtitle: 'Escribe la plantilla, previsualízala con un contexto de ejemplo y guárdala.',
      builtInNote: 'Las plantillas integradas son de solo lectura. Clónala para personalizarla, o restablécela para recuperar el contenido original.',
      content: 'Contenido',
      changeNote: 'Nota del cambio',
      syntaxHint: 'Sintaxis: {{variable}}, {{value | default: "x"}}, {{#if x}}...{{else}}...{{/if}}, {{#each list}}...{{/each}}, {{> template-name}}.',
      variables: 'Variables utilizadas',
      noVariables: 'No se hace referencia a ninguna variable.',
      preview: 'Vista previa en vivo',
      sampleContext: 'Contexto de ejemplo (JSON)',
      rendered: 'Resultado',
      previewEmpty: 'El texto generado aparece aquí.',
      missing: 'Variables que faltan: {{list}}',
      versions_one: 'Versiones ({{count}})',
      versions_other: 'Versiones ({{count}})',
      versions_many: 'Versiones ({{count}})',
      noVersions: 'Aún no hay versiones guardadas.',
      version: 'Versión',
      note: 'Nota',
      author: 'Autor',
      diff: 'Diferencias',
      restore: 'Restaurar',
      diffTitle: 'Versión {{version}} comparada con el editor',
      current: 'Editor',
      reset: 'Restablecer valores predeterminados',
      savedVersion: 'Se guardó una nueva versión.',
      restored: 'Se restauró la versión {{version}}.',
      resetDone: 'Se restableció el contenido original.',
      confirm: {
        restoreTitle: 'Restaurar versión',
        restoreMessage: '¿Restaurar la versión {{version}}? El contenido actual se conserva en el historial.',
        resetTitle: 'Restablecer plantilla',
        resetMessage: '¿Restablecer "{{name}}" al contenido original?',
        deleteTitle: 'Eliminar plantilla',
        deleteMessage: '¿Eliminar "{{name}}"? Los despliegues que la vinculan no podrán compilarse.'
      }
    },
    manifests: {
      warnings_one: '{{count}} advertencia',
      warnings_other: '{{count}} advertencias',
      planned: 'Resultado previsto: {{result}}',
      changes: { count_many: 'Cambian {{count}} campos.', count_other: 'Cambian {{count}} campos.', count_one: 'Cambia {{count}} campo.', empty: '(vacío)', after: 'Después', before: 'Antes', field: 'Campo' },
      title: 'Manifiestos',
      subtitle: 'Aplica la configuración como código. Las simulaciones validan sin escribir nada.',
      applyTab: 'Aplicar',
      exportTab: 'Exportar',
      historyTab: 'Historial',
      upload: 'Subir archivo',
      loadSample: 'Cargar ejemplo',
      document: 'Manifiesto (YAML o JSON, varios documentos)',
      dryRun: 'Simulación',
      apply: 'Aplicar',
      validated: 'Validación finalizada.',
      applied: 'Manifiesto aplicado.',
      results: 'Resultados',
      dryRunResults: 'Resultados de la simulación',
      kind: 'Tipo',
      name: 'Nombre',
      result: 'Resultado',
      message: 'Mensaje',
      confirmTitle: 'Aplicar manifiesto',
      confirmMessage: '¿Aplicar todos los documentos de este manifiesto al inquilino actual?',
      exportHelp: 'Exporta la configuración de este inquilino. Los valores de los secretos nunca se exportan.',
      export: 'Exportar',
      download: 'Descargar',
      counts: '{{created}} creados, {{updated}} actualizados, {{unchanged}} sin cambios, {{failed}} con error'
    },
    requests: {
      grafana: 'Panel HTTP en Grafana',
      title: 'Historial de solicitudes',
      subtitle: 'Tráfico de la API capturado. Examina cualquier solicitud y gestiona la retención.',
      kpis: { total: 'Solicitudes retenidas', success: 'Correctas', failure: 'Con error', avgDuration: 'Duración media' },
      columns: { time: 'Hora', method: 'Método', path: 'Ruta', status: 'Estado', duration: 'Duración', principal: 'Entidad' },
      bulkDeleteTitle: 'Eliminar historial de solicitudes',
      bulkDeleteMessage: '¿Eliminar las {{count}} solicitudes que coinciden con los filtros actuales?',
      bulkDeleteAll: 'Eliminar todas las coincidentes',
      deleteOneTitle: 'Eliminar solicitud',
      deleteOneMessage: '¿Eliminar la solicitud {{id}}?',
      deleted: 'Eliminada.',
      emptyTitle: 'No hay historial de solicitudes',
      emptyBodyNoTraffic: 'Aún no se ha retenido tráfico de la API.',
      emptyBodyNoMatch: 'Ninguna solicitud coincide con los filtros actuales.'
    },
    explorer: {
      title: 'Explorador de API',
      subtitle: 'Ejecuta llamadas reales contra este servidor a partir de su documento OpenAPI.',
      operations: 'Operaciones',
      selectOperation: 'Selecciona una operación para crear una solicitud.',
      selectOperationOption: 'Elige una operación...',
      pathParams: 'Parámetros de ruta',
      queryParams: 'Parámetros de consulta',
      headers: 'Encabezados',
      addHeader: 'Añadir encabezado',
      headerName: 'Nombre del encabezado',
      headerValue: 'Valor del encabezado {{name}}',
      removeHeader: 'Quitar el encabezado {{name}}',
      body: 'Cuerpo de la solicitud',
      resolvedUrl: 'URL resuelta',
      copyUrl: 'Copiar URL',
      execute: 'Ejecutar',
      executing: 'Ejecutando...',
      stop: 'Detener',
      streaming: 'Transmitiendo',
      response: 'Respuesta',
      responseHeaders: 'Encabezados de la respuesta',
      responseBody: 'Cuerpo de la respuesta',
      snippets: 'Fragmentos de código',
      history: 'Solicitudes recientes',
      historyEmpty: 'No hay solicitudes recientes.',
      loadHistory: 'Cargar',
      deleteHistory: 'Eliminar',
      clearHistory: 'Borrar historial',
      required: 'obligatorio',
      confirmTitle: 'Ejecutar operación destructiva',
      confirmMessage: 'Esta solicitud {{method}} puede modificar o eliminar datos. ¿Continuar?',
      noSpecTitle: 'Documento OpenAPI no disponible',
      noSpecBody: 'Este servidor no devolvió un documento /openapi.json utilizable, así que el explorador no puede listar las operaciones.'
    },
    settings: {
      errors: { allowed: 'Elige uno de estos valores: {{values}}.', boolean: 'Elige verdadero o falso.', max: 'Escribe {{max}} o menos.', min: 'Escribe {{min}} o más.', range: 'Escribe un valor entre {{min}} y {{max}}.', integer: 'Escribe un número entero.', number: 'Escribe un número.' },
      notSaved: 'No se guardó nada. Corrige los ajustes marcados y vuelve a guardar.',
      title: 'Ajustes',
      subtitle: 'Ajustes del servidor procedentes del archivo de configuración y ajustes del clúster almacenados en la base de datos.',
      readOnly: 'Estás viendo los ajustes en modo de solo lectura. Solo los administradores del sistema pueden cambiarlos.',
      restartBanner: 'Algunos cambios guardados se aplican tras un reinicio.',
      restarting: 'El servidor se está reiniciando. Esta página se vuelve a conectar automáticamente.',
      restarted: 'El servidor vuelve a estar en línea.',
      restartTimeout: 'El servidor no volvió en tres minutos. Comprueba el estado del pod.',
      restart: 'Reiniciar servidor',
      restartConfirmTitle: 'Reiniciar servidor',
      restartConfirmMessage: '¿Reiniciar ahora este nodo del plano de control? Las solicitudes en curso se drenan y la consola se vuelve a conectar.',
      savedLive: 'Ajustes guardados y aplicados.',
      savedRestart: 'Ajustes guardados. Reinicia el servidor para aplicar todos los cambios.',
      live: 'En vivo',
      restartRequired: 'Requiere reinicio',
      secretSet: 'Definido (introduce un valor nuevo para sustituirlo)',
      secretNotSet: 'Sin definir',
      invalidNumber: 'Introduce un número.',
      range: 'Intervalo permitido: de {{min}} a {{max}}',
      testDatabase: 'Probar la conexión a la base de datos',
      testing: 'Probando...',
      dbOk: 'Conexión correcta',
      dbFailed: 'Error de conexión',
      unavailableTitle: 'Ajustes no disponibles',
      unavailableBody: 'Este servidor no devolvió sus ajustes.',
      sources: { File: 'Archivo de configuración', Environment: 'Entorno', ConfigMap: 'ConfigMap', Database: 'Clúster' },
      lockedBy: {
        Environment: 'Definido por una variable de entorno. El valor del entorno prevalece.',
        ConfigMap: 'Gestionado por un ConfigMap de Kubernetes. Cámbialo en tus manifiestos.',
        other: 'Este ajuste no se puede editar aquí.'
      },
      groups: { Codex: 'Codex', Archive: 'Archivo', General: 'General', Rest: 'REST', Mcp: 'MCP', Database: 'Base de datos', Logging: 'Registro', Auth: 'Autenticación', Security: 'Seguridad', RequestHistory: 'Historial de solicitudes', Telemetry: 'Telemetría', Cluster: 'Clúster', Scheduling: 'Planificación', Runs: 'Ejecuciones', Audit: 'Auditoría', Runtime: 'Tiempo de ejecución', Observability: 'Observabilidad' },
      fields: {
        Observability: {
          GrafanaUrl: 'URL de Grafana',
          PrometheusUrl: 'URL de Prometheus',
          LokiUrl: 'URL de Loki',
          TempoUrl: 'URL de Tempo',
          GrafanaInternalUrl: 'URL interna de Grafana',
          PrometheusInternalUrl: 'URL interna de Prometheus',
          LokiInternalUrl: 'URL interna de Loki',
          TempoInternalUrl: 'URL interna de Tempo'
        },
        Rest: {
          ExternalBaseUrl: 'URL externa de REST',
          PublicBaseUrl: 'URL interna de REST para las ejecuciones',
          Ssl: 'TLS de REST',
          Port: 'Puerto de REST',
          Hostname: 'Nombre de host de escucha de REST'
        },
        Mcp: {
          InternalPort: 'Puerto MCP interno',
          SessionIdleTimeoutSeconds: 'Tiempo de inactividad de las sesiones MCP (segundos)',
          MaxToolWaitSeconds: 'Espera máxima de herramientas MCP (segundos)',
          PublicUrl: 'URL interna de MCP para las ejecuciones',
          Path: 'Ruta de MCP',
          Port: 'Puerto de MCP',
          Hostname: 'Nombre de host de escucha de MCP',
          Enable: 'Servidor MCP activado'
        },
        Database: {
          MinPoolSize: 'Conexiones mínimas del pool',
          ConnectionTimeoutSeconds: 'Espera de conexión (segundos)',
          CommandTimeoutSeconds: 'Tiempo límite de los comandos (segundos)',
          ConnectionIdleLifetimeSeconds: 'Vida de las conexiones inactivas (segundos)',
          MaxPoolSize: 'Tamaño del grupo de conexiones',
          Schema: 'Esquema de la base de datos',
          Password: 'Contraseña de la base de datos',
          Username: 'Usuario de la base de datos',
          DatabaseName: 'Nombre de la base de datos',
          Port: 'Puerto de la base de datos',
          Host: 'Host de la base de datos',
          Filename: 'Archivo de Sqlite',
          Type: 'Proveedor de base de datos'
        },
        Logging: {
          MinimumSeverity: 'Gravedad mínima de registro',
          LogFilename: 'Nombre del archivo de registro',
          LogDirectory: 'Directorio de registros',
          FileLogging: 'Registrar en un archivo',
          ConsoleLogging: 'Registrar en la consola'
        },
        Auth: {
          RateLimitPerMinute: 'Intentos de inicio de sesión por minuto',
          PasswordHashIterations: 'Iteraciones del hash de contraseñas',
          SignedRequestSkewSeconds: 'Desfase de reloj permitido en solicitudes firmadas (segundos)',
          AdminApiKey: 'Clave de API de administrador',
          TokenLifetimeMinutes: 'Duración de la sesión (minutos)',
          SigningKey: 'Clave de firma de tokens',
          Issuer: 'Emisor de tokens'
        },
        Security: {
          NodeSecretKey: 'Clave secreta de los nodos de trabajo',
          NodeAccessKey: 'Clave de acceso de los nodos de trabajo',
          DefaultSecretKey: 'Clave secreta predeterminada',
          DefaultAccessKey: 'Clave de acceso predeterminada',
          AdminPassword: 'Contraseña del administrador inicial',
          AdminEmail: 'Correo del administrador inicial',
          MasterKey: 'Clave maestra de cifrado de secretos'
        },
        RequestHistory: {
          CaptureNodeProtocol: 'Capturar solicitudes correctas del protocolo de workers',
          MaxResponseBodyBytes: 'Cuerpo de respuesta máximo registrado (bytes)',
          MaxRequestBodyBytes: 'Cuerpo de solicitud máximo registrado (bytes)',
          RetentionDays: 'Retención del historial de solicitudes (días)',
          Enabled: 'Registrar el historial de solicitudes'
        },
        Telemetry: {
          OtlpEndpoint: 'Endpoint de OTLP',
          OtlpEnable: 'Exportación OTLP activada',
          PrometheusPort: 'Puerto de Prometheus',
          PrometheusEnable: 'Endpoint de Prometheus activado',
          ServiceName: 'Nombre del servicio de telemetría',
          Enabled: 'Telemetría activada'
        },
        Archive: {
          Directory: 'Directorio de archivo'
        },
        Cluster: {
          Backplane: 'Backplane de eventos',
          BackplanePollMs: 'Intervalo de sondeo del backplane (ms)',
          ExpectedReplicas: 'Réplicas esperadas del plano de control'
        },
        Scheduling: {
          EventPollMs: 'Intervalo de sondeo de eventos (ms)',
          InvocationWaitPollMs: 'Relectura de respaldo al esperar invocaciones (ms)',
          NodeHeartbeatTimeoutMs: 'Tiempo límite de latido de los nodos (ms)',
          LeaseWaitMs: 'Espera de sondeo largo de concesiones (ms)',
          LeaseDurationMs: 'Duración de la concesión de ejecuciones (ms)',
          PauseGraceMs: 'Margen tras una pausa del host (ms)'
        },
        Runs: {
          EventRetentionDays: 'Retención de eventos de ejecución (días)',
          RetentionDays: 'Retención de ejecuciones (días)',
          MaxDelegationDepth: 'Profundidad máxima de delegación',
          DelegationChildQueueDepth: 'Máximo de ejecuciones hijas en cola con padre en espera',
          DelegationRetryAfterSeconds: 'Reintento por capacidad de delegación agotada (segundos)',
          DefaultTimeoutSeconds: 'Tiempo límite predeterminado de ejecución (segundos)'
        },
        Codex: {
          RefreshBeforeExpirySeconds: 'Renovar sesiones de Codex antes de caducar (segundos)',
          RefreshCheckIntervalSeconds: 'Intervalo de la comprobación en segundo plano (segundos)',
          RefreshTimeoutSeconds: 'Tiempo máximo de renovación (segundos)',
          TokenEndpoint: 'Endpoint de tokens OAuth',
          ClientId: 'ID de cliente OAuth'
        },
        Runtime: {
          FailBlockedAfterSeconds: 'Hacer fallar ejecuciones bloqueadas tras (segundos)',
          MaxRunSeconds: 'Duración máxima de una ejecución (segundos)',
          RepetitionGuard: 'Protección contra repeticiones por defecto',
          MaxAssistantChars: 'Máximo de caracteres del asistente por defecto',
          NoProgressSeconds: 'Límite sin avance por defecto (segundos)',
          ConversationAffinityWaitMs: 'Espera de afinidad de conversaciones (ms)',
          ConversationTranscriptTurns: 'Turnos en la transcripción de reconstrucción',
          ConversationTranscriptChars: 'Caracteres por mensaje en la transcripción de reconstrucción'
        },
        Audit: {
          RetentionDays: 'Retención de auditoría (días)'
        }
      }
    },
    analytics: {
      grafana: 'Panel de ejecuciones en Grafana',
      deletedAgent: 'Agente eliminado ({{id}})',
      deletedDeployment: 'Despliegue eliminado ({{id}})',
      title: 'Analítica',
      subtitle: 'Rapidez, coste y fiabilidad de tus ejecuciones a lo largo del tiempo.',
      loading: 'Cargando analítica...',
      filters: { ttft: 'Excluir la espera por delegación del TTFT', range: 'Intervalo', from: 'Desde', to: 'Hasta', agentId: 'Agente', harnessType: 'Harness', deploymentId: 'Despliegue', model: 'Modelo', groupBy: 'Agrupar por' },
      allAgents: 'Todos los agentes',
      allHarnesses: 'Todos los harnesses',
      allDeployments: 'Todos los despliegues',
      allModels: 'Todos los modelos',
      unknownModel: 'Modelo desconocido',
      groupBy: { none: 'Sin agrupar', agent: 'Agente', harness: 'Harness', model: 'Modelo', harnessModel: 'Harness y modelo' },
      export: { window: 'Intervalo de tiempo: de {{from}} a {{to}}' },
      usage: { title: 'Uso por harness y modelo', help: 'Tokens y coste a lo largo del tiempo para cada combinación de harness y modelo del intervalo, más una tabla de desglose.' },
      breakdown: {
        title: 'Desglose de harness por modelo',
        columns: { harness: 'Harness', model: 'Modelo', runs: 'Ejecuciones', inputTokens: 'Tokens de entrada', outputTokens: 'Tokens de salida', cachedTokens: 'Tokens en caché', reasoningTokens: 'Tokens de razonamiento', costUsd: 'Coste', timeToFirstTokenMsAvg: 'TTFT medio' }
      },
      rangeError: {
        incomplete: 'Elige una hora de inicio y una de fin para el intervalo personalizado.',
        reversed: 'El inicio del intervalo personalizado debe ser anterior a su fin.'
      },
      truncated: 'Este intervalo contiene más ejecuciones de las que el servidor agrega en una sola solicitud, así que las cifras solo cubren una parte. Acota el intervalo o añade filtros para obtener cifras exactas.',
      unavailableTitle: 'La analítica aún no está disponible en este servidor',
      unavailableBody: 'Este servidor no expone el endpoint de analítica de ejecuciones. Actualiza el servidor para ver gráficos aquí.',
      emptyTitle: 'No hay ejecuciones en este intervalo',
      emptyBody: 'Nada coincide con el intervalo y los filtros. Amplía el intervalo, quita un filtro o invoca un agente.',
      noDataInChart: 'No hay datos para este gráfico en el intervalo seleccionado.',
      cards: {
        delegationWait: 'Espera media por delegación',
        ttftExcludingDelegation: 'TTFT medio sin delegación',
        runs: 'Ejecuciones',
        runsNote: '{{succeeded}} correctas, {{failed}} fallidas',
        successRate: 'Tasa de éxito',
        ttft: 'Tiempo medio hasta el primer token',
        execution: 'Tiempo medio de ejecución',
        queue: 'Tiempo medio en cola',
        tokens: 'Tokens',
        tokensNote: '{{input}} de entrada, {{output}} de salida',
        throughput: 'Velocidad media de salida',
        cost: 'Coste',
        toolCalls: 'Llamadas a herramientas',
        p95: 'p95 {{value}}'
      },
      charts: {
        outcomes: { title: 'Resultados de las ejecuciones', help: 'Ejecuciones por intervalo según cómo terminaron.' },
        ttft: { helpExcluding: 'Del arranque del harness a la primera salida del modelo, sin el tiempo de espera a las ejecuciones delegadas.', title: 'Tiempo hasta el primer token', help: 'Desde el inicio del harness hasta la primera salida del modelo. Incluye el arranque de la CLI.' },
        duration: { title: 'Tiempo de transmisión y de ejecución', help: 'La transmisión va de la primera a la última salida del modelo; la ejecución, del inicio del proceso a su salida.' },
        queue: { title: 'Tiempo en cola', help: 'Tiempo desde que entra en cola hasta que un nodo de trabajo obtiene la concesión.' },
        tokens: { title: 'Tokens', help: 'Tokens de entrada, salida, en caché y de razonamiento por intervalo.' },
        throughput: { title: 'Tokens de salida por segundo', help: 'Tokens de salida divididos entre el tiempo de transmisión, promediados por intervalo.' },
        cost: { title: 'Coste', help: 'Coste notificado en dólares estadounidenses por intervalo.' },
        toolCalls: { title: 'Llamadas a herramientas', help: 'Eventos de llamada a herramientas por intervalo.' },
        usageTokens: { title: 'Tokens por harness y modelo', help: 'Tokens de entrada más salida por intervalo, apilados por harness y modelo.' },
        usageCost: { title: 'Coste por harness y modelo', help: 'Coste notificado por intervalo, apilado por harness y modelo.' }
      },
      groupedTitle: '{{chart}}: {{metric}}',
      metrics: {
        delegationWaitMsAvg: 'Espera por delegación (media)',
        timeToFirstTokenExcludingDelegationMsP95: 'Sin delegación (p95)',
        timeToFirstTokenExcludingDelegationMsP50: 'Sin delegación (p50)',
        timeToFirstTokenExcludingDelegationMsAvg: 'Sin delegación (media)',
        runs: 'Ejecuciones',
        succeeded: 'Correctas',
        failed: 'Fallidas',
        cancelled: 'Canceladas',
        timedOut: 'Tiempo agotado',
        inputTokens: 'Entrada',
        outputTokens: 'Salida',
        cachedTokens: 'En caché',
        reasoningTokens: 'Razonamiento',
        totalTokens: 'Tokens de entrada más salida',
        costUsd: 'Coste',
        toolCalls: 'Llamadas a herramientas',
        timeToFirstTokenMsAvg: 'Media',
        timeToFirstTokenMsP50: 'Mediana (p50)',
        timeToFirstTokenMsP95: 'p95',
        streamingMsAvg: 'Transmisión (media)',
        executionMsAvg: 'Ejecución (media)',
        executionMsP95: 'Ejecución (p95)',
        queueMsAvg: 'Tiempo medio en cola',
        outputTokensPerSecondAvg: 'Media de tokens por segundo'
      },
      other: 'Otros',
      hiddenGroups_one: 'No se muestra {{count}} grupo con menos actividad.',
      hiddenGroups_other: 'No se muestran {{count}} grupos con menos actividad.',
      hiddenGroups_many: 'No se muestran {{count}} grupos con menos actividad.',
      legend: 'Series de {{chart}}',
      dataTable: 'Tabla de datos',
      bucketStart: 'Inicio del intervalo'
    },
    serverInfo: {
      title: 'Información del servidor',
      subtitle: 'Endpoints, versiones y la identidad con la que has iniciado sesión.',
      endpoints: 'Endpoints',
      rest: 'API REST',
      mcp: 'MCP',
      a2a: 'A2A',
      openapi: 'OpenAPI',
      server: 'Servidor',
      version: 'Versión del servidor',
      dashboardVersion: 'Versión del panel',
      node: 'Nodo de control',
      database: 'Base de datos',
      health: 'Estado',
      replicas: 'Réplicas esperadas',
      routes: 'Operaciones registradas',
      serverTime: 'Hora del servidor',
      principal: 'Sesión iniciada como',
      principalName: 'Entidad',
      principalType: 'Tipo de entidad',
      role: 'Rol',
      tenant: 'Inquilino',
      expires: 'La sesión caduca',
      features: 'Marcas de funcionalidad'
    },
    runGuard: {
      titles: {
        RepetitionDetected: 'Detenida: el modelo se estaba repitiendo',
        NoProgress: 'Detenida: la ejecución dejó de avanzar',
        OutputLimitExceeded: 'Detenida: la respuesta alcanzó su límite de tamaño'
      },
      bodies: {
        RepetitionDetected: 'La protección contra repeticiones vio el mismo texto corto escrito una y otra vez (o solo espacios y puntuación), así que Garrison detuvo la ejecución en lugar de dejarla correr hasta su plazo.',
        NoProgress: 'No llegó texto, razonamiento ni actividad de herramientas durante más tiempo que el límite sin avance, así que Garrison detuvo la ejecución.',
        OutputLimitExceeded: 'La respuesta superó el número máximo de caracteres del asistente permitido por ejecución, así que Garrison detuvo la ejecución.'
      },
      detected: 'Qué se detectó: {{reason}}',
      partialKept: 'La salida escrita antes de detenerse ({{chars}} caracteres) se conserva como resultado de la ejecución.',
      noPartial: 'La ejecución no escribió ninguna salida antes de detenerse.',
      tune: 'Para cambiar cuándo ocurre esto, edita el despliegue {{deployment}}: su paso Ubicación y límites tiene Protección contra repeticiones, Máximo de caracteres del asistente y Límite sin avance. Si los dejas vacíos, siguen los valores del clúster en Ajustes (Tiempo de ejecución).',
      tuneAny: 'Para cambiar cuándo ocurre esto, edita el despliegue: su paso Ubicación y límites tiene Protección contra repeticiones, Máximo de caracteres del asistente y Límite sin avance. Si los dejas vacíos, siguen los valores del clúster en Ajustes (Tiempo de ejecución).',
      openDeployments: 'Abrir despliegues',
      openSettings: 'Abrir ajustes'
    },
    conversationDetail: {
      title: 'Conversación',
      notFoundTitle: 'No se encontró la conversación',
      notFoundBody: 'Puede que se haya eliminado o que pertenezca a otro inquilino. Sus turnos siguen en la página Ejecuciones.',
      deployment: 'Despliegue',
      activeRun: 'Turno sin terminar',
      turns: 'Turnos',
      turnsCount: 'Turnos ({{count}})',
      noTurns: 'Esta conversación aún no tiene turnos.',
      pending: 'Esperando el resultado',
      columns: {
        turn: 'Turno',
        run: 'Ejecución',
        status: 'Estado',
        outcome: 'Resultado',
        session: 'Sesión',
        input: 'Entrada',
        result: 'Respuesta',
        node: 'Nodo',
        created: 'Creado'
      },
      session: {
        first: 'Sesión nueva',
        resumed: 'Reanudada',
        fallback: 'Sesión desde cero',
        pending: 'Aún sin asignar'
      },
      continueTitle: 'Continuar la conversación',
      message: 'Siguiente mensaje',
      messagePlaceholder: 'Haz una pregunta de seguimiento o da la siguiente instrucción...',
      busyNotice: 'El turno anterior sigue trabajando. Podrás enviar el siguiente mensaje cuando termine.',
      send: 'Enviar turno',
      turnStarted: 'Turno {{turn}} iniciado.',
      openInvoke: 'Continuar en Invocar',
      confirmDelete: '¿Eliminar la conversación «{{title}}»? Sus turnos se quedan en la página Ejecuciones como ejecuciones normales, pero ningún turno nuevo podrá continuarla.'
    }
  },
  wizard: {
    title: 'Configurar Garrison',
    stepOf: 'Paso {{step}} de {{total}}',
    steps: { welcome: 'Bienvenida', secret: 'Credencial', manifest: 'Agente de ejemplo', invoke: 'Ejecución de prueba' },
    welcomeBody: 'Este inquilino aún no tiene agentes. En unos pocos pasos podrás:',
    welcomeItem1: 'Guardar una credencial de harness, como una clave de API de Anthropic o de OpenAI (opcional).',
    welcomeItem2: 'Aplicar un agente de ejemplo que usa el harness simulado integrado, de modo que funciona sin credenciales.',
    welcomeItem3: 'Ejecutarlo y ver la transcripción.',
    start: 'Empezar',
    skip: 'Omitir la configuración',
    skipStep: 'Omitir este paso',
    secretBody: 'Añade una credencial que necesitarán tus agentes reales. Puedes omitir este paso y añadir secretos más tarde.',
    saveSecret: 'Guardar y continuar',
    secretSaved: 'Secreto guardado.',
    manifestBody: 'Este manifiesto crea un agente de eco y un despliegue que usa el harness simulado.',
    invokeBody: 'Envía un mensaje al agente de eco. Se te llevará a la ejecución mientras se ejecuta.',
    invoke: 'Ejecutarlo',
    noAgent: 'No se encontró el agente de ejemplo. Aplica primero el manifiesto.'
  },
  tour: {
    title: 'Visita guiada',
    skip: 'Omitir la visita',
    done: 'Listo',
    steps: {
      sidebar: { title: 'Navegación', body: 'Las páginas se agrupan en secciones. Cada sección tiene pestañas en la parte superior de la página, y cada pestaña tiene su propio enlace.' },
      topbar: { title: 'Contexto', body: 'El servidor, el inquilino, tu identidad, el estado y la conexión en vivo siempre están visibles aquí.' },
      kpis: { title: 'De un vistazo', body: 'Cada tarjeta resume un recurso. Haz clic en una tarjeta para abrir la lista filtrada.' },
      invoke: { title: 'Invocar', body: 'Prueba cualquier agente de forma interactiva y observa cómo se transmite su transcripción.' },
      configure: { title: 'Configuración', body: 'Los perfiles de harness, las plantillas de prompt, los servidores MCP y los secretos controlan exactamente qué se ejecuta. Los agentes y los despliegues tienen su propia sección.' },
      observe: { title: 'Supervisión', body: 'El historial de solicitudes, la auditoría y el Explorador de API te ayudan a verificar y depurar.' }
    }
  },
  tips,
  explainers
};


// Executor capability negotiation (P11.18).
Object.assign(es.resources.deployments.fields, {"capIsolation": "Aislamiento mínimo", "capColdStartClass": "Clase de inicio", "capEgressControl": "Exigir control de salida", "capFilesystemSnapshot": "Exigir instantáneas del sistema de archivos", "capSessionContinuation": "Exigir continuidad de sesión", "capCrossNodeRestore": "Exigir restauración en otro nodo"});
Object.assign(es.tips.resources.deployments, {"capIsolation": "Las ejecuciones esperan un trabajador con estas capacidades. Seleccione KubernetesJob para aislar en contenedores. Las capacidades no disponibles mantienen las ejecuciones en cola.", "capColdStartClass": "Las ejecuciones esperan un trabajador con estas capacidades. Seleccione KubernetesJob para aislar en contenedores. Las capacidades no disponibles mantienen las ejecuciones en cola.", "capEgressControl": "Las ejecuciones esperan un trabajador con estas capacidades. Seleccione KubernetesJob para aislar en contenedores. Las capacidades no disponibles mantienen las ejecuciones en cola.", "capFilesystemSnapshot": "Las ejecuciones esperan un trabajador con estas capacidades. Seleccione KubernetesJob para aislar en contenedores. Las capacidades no disponibles mantienen las ejecuciones en cola.", "capSessionContinuation": "Las ejecuciones esperan un trabajador con estas capacidades. Seleccione KubernetesJob para aislar en contenedores. Las capacidades no disponibles mantienen las ejecuciones en cola.", "capCrossNodeRestore": "Las ejecuciones esperan un trabajador con estas capacidades. Seleccione KubernetesJob para aislar en contenedores. Las capacidades no disponibles mantienen las ejecuciones en cola."});
es.resources.deployments.hints.capabilities = "Las ejecuciones esperan un trabajador con estas capacidades. Seleccione KubernetesJob para aislar en contenedores. Las capacidades no disponibles mantienen las ejecuciones en cola.";
es.resources.nodes.columns.executorCapabilities = "Capacidades de ejecución";
es.tips.resources.nodes.executorCapabilities = "Las ejecuciones esperan un trabajador con estas capacidades. Seleccione KubernetesJob para aislar en contenedores. Las capacidades no disponibles mantienen las ejecuciones en cola.";
es.enums.executorIsolation = {"Process": "Proceso", "Container": "Contenedor", "SandboxedRuntime": "Entorno aislado"};
es.enums.executorColdStart = {"Immediate": "Inmediato", "Cold": "Frío", "Warm": "Preparado"};
// Artifact collection and browsing (P12.8).
es.nav.items.artifacts = { label: "Archivos", tip: "Archivos recopilados de ejecuciones." };
es.resources.artifacts = { ...es.resources.artifactStores, title: "Archivos", subtitle: "Archivos recopilados de ejecuciones.", view: "Archivos", deleteTitle: "Archivos", emptyTitle: "Archivos", emptyBody: "Configure un almacén y patrones explícitos en el despliegue para recopilar archivos.", columns: {"name": "Nombre", "runId": "Ejecución", "artifactStoreId": "Almacén", "mediaType": "Tipo de contenido", "sizeBytes": "Tamaño en bytes", "sha256": "Huella SHA-256", "createdUtc": "Creado", "id": "ID", "leaseEpoch": "Época de concesión", "repairAttempt": "Intento de reparación"}, fields: {"name": "Nombre", "runId": "Ejecución", "artifactStoreId": "Almacén", "mediaType": "Tipo de contenido", "sizeBytes": "Tamaño en bytes", "sha256": "Huella SHA-256", "createdUtc": "Creado", "id": "ID", "leaseEpoch": "Época de concesión", "repairAttempt": "Intento de reparación"}, actions: { download: "Descargar" } };
es.tips.resources.artifacts = { ...{"name": "Archivos recopilados de ejecuciones. Nombre", "runId": "Archivos recopilados de ejecuciones. Ejecución", "artifactStoreId": "Archivos recopilados de ejecuciones. Almacén", "mediaType": "Archivos recopilados de ejecuciones. Tipo de contenido", "sizeBytes": "Archivos recopilados de ejecuciones. Bytes", "sha256": "Archivos recopilados de ejecuciones. SHA-256", "createdUtc": "Archivos recopilados de ejecuciones. Creado", "id": "Archivos recopilados de ejecuciones. ID", "leaseEpoch": "Archivos recopilados de ejecuciones. Época de concesión", "repairAttempt": "Archivos recopilados de ejecuciones. Intento de reparación"}, actions: { download: "Descargue este archivo mediante un enlace temporal." }, filters: { runId: "Ejecución", storeId: "Almacén" } };
Object.assign(es.resources.artifactStores.fields, {"pathPrefix": "Prefijo de ruta", "bucket": "Contenedor S3", "endpoint": "Endpoint", "region": "Región", "secretId": "Credencial", "forcePathStyle": "Solicitudes por ruta"});
Object.assign(es.tips.resources.artifactStores, {"pathPrefix": "Endpoint S3 opcional; vacío utiliza AWS. Guarde las credenciales en un secreto GenericEnv como JSON con accessKey, secretKey y sessionToken opcional. Sin credencial utiliza las credenciales del servidor.", "bucket": "Endpoint S3 opcional; vacío utiliza AWS. Guarde las credenciales en un secreto GenericEnv como JSON con accessKey, secretKey y sessionToken opcional. Sin credencial utiliza las credenciales del servidor.", "endpoint": "Endpoint S3 opcional; vacío utiliza AWS. Guarde las credenciales en un secreto GenericEnv como JSON con accessKey, secretKey y sessionToken opcional. Sin credencial utiliza las credenciales del servidor.", "region": "Endpoint S3 opcional; vacío utiliza AWS. Guarde las credenciales en un secreto GenericEnv como JSON con accessKey, secretKey y sessionToken opcional. Sin credencial utiliza las credenciales del servidor.", "secretId": "Endpoint S3 opcional; vacío utiliza AWS. Guarde las credenciales en un secreto GenericEnv como JSON con accessKey, secretKey y sessionToken opcional. Sin credencial utiliza las credenciales del servidor.", "forcePathStyle": "Endpoint S3 opcional; vacío utiliza AWS. Guarde las credenciales en un secreto GenericEnv como JSON con accessKey, secretKey y sessionToken opcional. Sin credencial utiliza las credenciales del servidor."});
es.resources.deployments.fields.artifactGlobs = "Patrones de recopilación";
es.tips.resources.deployments.artifactGlobs = "Recopile solo archivos relativos coincidentes, por ejemplo reports/**/*.json. Vacío desactiva la recopilación.";
es.resources.deployments.hints.artifactGlobs = "Recopile solo archivos relativos coincidentes, por ejemplo reports/**/*.json. Vacío desactiva la recopilación.";
Object.assign(es.common.eventCodes, { ArtifactCollectionWarning: "Advertencia de recopilación", ArtifactsCollected: "Archivos recopilados" });
es.tips.nav.tabs.artifacts = es.nav.items.artifacts.tip + " " + es.tips.resources.artifacts.actions.download;
Object.assign(es.components.mcpTest, {"worker": "Nodo trabajador", "chooseWorker": "Seleccione un trabajador listo. El comando configurado enumera herramientas allí; no se invocan herramientas.", "runTest": "Ejecutar prueba"});
export default es;

es.views.settings.groups.Leases = "Arrendamientos de coordinación";
es.views.settings.fields.Leases = {"Provider": "Proveedor", "ClutchEndpoint": "Endpoint de Clutch", "ClutchAccessKey": "Clave de acceso de Clutch", "KeyPrefix": "Prefijo de claves", "RequestTimeoutMs": "Tiempo de espera (ms)", "SweepIntervalMs": "Intervalo de revisión (ms)", "MaxLeaseMs": "Duración máxima (ms)", "MaxHoldMs": "Retención máxima (ms)"};

es.enums.harnessType.ProviderApi = "API del proveedor";
es.enums.outputParser.ProviderApiJsonl = "JSONL de API del proveedor";
es.enums.harnessType.OpenCode = "opencode";
es.enums.harnessType.Pi = "pi";
es.enums.outputParser.OpenCodeJsonl = "opencode JSONL";
es.enums.outputParser.PiJsonl = "pi JSONL";
es.enums.mcpConfigFormat.OpenCodeJson = "opencode JSON";
es.enums.mcpConfigFormat.PiJson = "pi JSON";

// Pipelines (P12.9): definiciones (Agentes > Canalizaciones), ejecuciones de canalización (Ejecuciones > Ejecuciones de canalización)
// y revisiones de etapa (Aprobaciones > Revisiones de etapa).
es.nav.hubs.approvals.tip = 'Llamadas a herramientas y etapas de canalización que esperan a una persona, y todas las decisiones';
Object.assign(es.nav, { approvalsPending_one: '{{count}} elemento espera a una persona', approvalsPending_other: '{{count}} elementos esperan a una persona', approvalsPending_many: '{{count}} elementos esperan a una persona' });
Object.assign(es.nav.items, {
  pipelines: { label: 'Canalizaciones', tip: 'Etapas ordenadas de agentes con puntos de revisión opcionales' },
  pipelineRuns: { label: 'Ejecuciones de canalización', tip: 'Ejecuciones de canalizaciones, etapa por etapa' },
  pipelineReviews: { label: 'Revisiones de etapa', tip: 'Etapas de canalización que esperan la revisión de una persona' }
});
Object.assign(es.errorCodes, {
  RevisionLimitReached: 'Esta etapa ya agotó todas sus correcciones, así que ya no se pueden pedir cambios. Apruébala o recházala.',
  ReviewNotPending: 'Esta revisión ya se decidió, por otra persona o por su tiempo de espera, así que no se puede volver a decidir.',
  PipelineInUse: 'Esta canalización tiene ejecuciones sin terminar. Espera a que terminen, o cancélalas, y luego elimina la canalización.',
  PipelineRunActive: 'Solo se pueden eliminar ejecuciones de canalización terminadas. Cancela primero esta ejecución de canalización.',
  PipelineRunFinished: 'Esta ejecución de canalización ya terminó, así que no se puede cancelar.',
  PipelineRunNotRetryable: 'Solo se pueden reintentar ejecuciones de canalización fallidas, con tiempo agotado o canceladas.',
  PipelineRunChanged: 'Esta ejecución de canalización cambió mientras se procesaba la solicitud. Vuelve a cargarla e inténtalo de nuevo.',
  PipelineInactive: 'Esta canalización está inactiva. Actívala antes de iniciarla.',
  PipelineEmpty: 'Una canalización necesita al menos una etapa.',
  PipelineStageRun: 'Esta ejecución es una etapa de una ejecución de canalización, así que no se puede reintentar por separado. Reintenta la ejecución de canalización.',
  ReferencedByPipeline: 'Una etapa de canalización usa este agente. Quita el agente de todas las canalizaciones antes de eliminarlo.'
});
es.enums.pipelineRunStatus = { Running: 'En ejecución', AwaitingReview: 'Pendiente de revisión', Cancelling: 'Cancelando', Succeeded: 'Correcta', Failed: 'Fallida', Cancelled: 'Cancelada', TimedOut: 'Tiempo agotado' };
es.enums.pipelineRunOutcome = { None: 'Ninguno', Succeeded: 'Correcto', StageFailed: 'Etapa fallida', StageStartFailed: 'La etapa no pudo iniciarse', ReviewRejected: 'Revisión rechazada', ReviewExpired: 'Revisión caducada', Cancelled: 'Cancelado', TimedOut: 'Tiempo agotado', InternalError: 'Error interno' };
es.enums.pipelineStageStatus = { Pending: 'Pendiente', Running: 'En ejecución', AwaitingReview: 'Pendiente de revisión', Succeeded: 'Correcta', Failed: 'Fallida', Cancelled: 'Cancelada' };
es.enums.pipelineReviewStatus = { Pending: 'Pendiente', Approved: 'Aprobada', ChangesRequested: 'Cambios pedidos', Rejected: 'Rechazada', Expired: 'Caducada', Cancelled: 'Cancelada' };
es.enums.pipelineReviewDecision = { Approve: 'Aprobar', RequestChanges: 'Pedir cambios', Reject: 'Rechazar' };
es.enums.pipelineReviewSource = { User: 'Persona', Timeout: 'Tiempo de espera agotado', Cancelled: 'Ejecución de canalización detenida' };
Object.assign(es.enums.resourceType, { Pipeline: 'Canalización', PipelineRun: 'Ejecución de canalización' });
Object.assign(es.enums.auditEventType, { PipelineReviewDecided: 'Revisión de etapa decidida', PipelineRunCancelled: 'Ejecución de canalización cancelada' });
es.resources.deployments.promptRoles.PipelineStage = 'Etapa de canalización (traspaso)';
Object.assign(es.resources.runs.columns, { pipelineRunId: 'Ejecución de canalización' });
es.resources.runs.pipelineStage = 'etapa {{position}}, pasada {{execution}}';
es.resources.pipelines = {
  ...rp('Canalizaciones', 'Etapas ordenadas de agentes: cada etapa ejecuta un agente y pasa su salida a la siguiente, con puntos de revisión opcionales.', 'Añadir canalización', 'Crear canalización', 'Editar canalización', 'Detalles de la canalización', 'Eliminar canalización', 'Aún no hay canalizaciones', 'Crea una canalización para encadenar agentes: cada etapa recibe la salida de la etapa anterior.'),
  columns: { name: 'Nombre', stages: 'Etapas', reviewGates: 'Puntos de revisión', maxDurationSeconds: 'Límite de tiempo', version: 'Versión', active: 'Activa', description: 'Descripción', id: 'ID', lastUpdateUtc: 'Actualizada', createdUtc: 'Creada' },
  fields: {
    name: 'Nombre',
    description: 'Descripción',
    maxDurationSeconds: 'Límite de tiempo (segundos)',
    active: 'Activa',
    stages: 'Etapas',
    stageName: 'Nombre de la etapa',
    agentId: 'Agente',
    deploymentId: 'Despliegue',
    handoffTemplateId: 'Plantilla de traspaso',
    handoffTemplateVersion: 'Versión fijada de la plantilla',
    outputCharLimit: 'Límite de caracteres del traspaso',
    maxAttempts: 'Intentos máximos',
    continueOnFailure: 'Continuar si falla',
    requiresReview: 'Requiere revisión',
    reviewTimeoutSeconds: 'Tiempo de espera de la revisión (segundos)',
    reviewTimeoutAction: 'Al agotarse el tiempo de revisión',
    maxRevisions: 'Correcciones máximas',
    stageDescription: 'Descripción de la etapa',
    parameters: 'Parámetros de ejecución'
  },
  hints: {
    maxDurationSeconds: 'De {{min}} a {{max}}. 0 significa sin límite. El límite cubre toda la ejecución de canalización, incluido el tiempo de espera de las revisiones.',
    stages: 'Las etapas se ejecutan en este orden. Cada etapa empieza cuando la anterior termina bien (o falla con Continuar si falla) y, si requiere revisión, después de que una persona la apruebe.',
    noDeployments: 'Este agente aún no tiene despliegues. Deja el despliegue vacío o añade uno en Despliegues.',
    handoffTemplateVersion: 'Vacío usa la versión actual de la plantilla.',
    outputCharLimit: 'De {{min}} a {{max}}. Predeterminado: {{default}}.',
    maxAttempts: 'De {{min}} a {{max}}. Predeterminado: {{default}}.',
    reviewTimeoutSeconds: 'De {{min}} a {{max}}. 0 espera indefinidamente.',
    maxRevisions: 'De {{min}} a {{max}}. Predeterminado: {{default}}.',
    parameters: 'Solo con un despliegue, y solo los parámetros que ese despliegue permite sobrescribir.'
  },
  errors: {
    dnsName: 'Usa de 1 a 64 letras minúsculas, dígitos y guiones, empezando y terminando con una letra o un dígito.',
    range: 'Introduce un número entero de {{min}} a {{max}}.',
    noStages: 'Añade al menos una etapa.',
    tooManyStages: 'Una canalización tiene como máximo {{max}} etapas.',
    stageNameLong: 'Los nombres de etapa admiten como máximo 128 caracteres.',
    stageNameDuplicate: 'Ya hay otra etapa llamada {{name}}.',
    version: 'Introduce un número de versión igual o mayor que 1, o déjalo vacío.',
    parametersNeedDeployment: 'Los parámetros de ejecución necesitan un despliegue, porque se comprueban contra las sobrescrituras que permite ese despliegue.',
    parametersUnique: 'Cada nombre de parámetro puede aparecer una sola vez.',
    stageInvalid: 'esta etapa tiene errores.'
  },
  actions: { start: 'Iniciar', preview: 'Previsualizar prompts', runs: 'Ver ejecuciones de canalización' },
  stageHeading: 'Etapa {{position}}: {{name}}',
  stageCount: '{{count}} de un máximo de {{max}}',
  stageSummary: '{{count}} etapas: {{chain}}',
  addStage: 'Añadir etapa',
  removeStage: 'Quitar etapa',
  noStages: 'Aún no hay etapas.',
  chooseAgent: 'Elige un agente',
  anyDeployment: 'Cualquier despliegue activo (ponderado)',
  defaultHandoff: 'Vinculación del despliegue o integrada',
  parameterName: 'Parámetro',
  parameterValue: 'Valor',
  noLimit: 'Sin límite',
  versionNotice: 'Versión {{version}}. Al guardar se crea una versión nueva; las ejecuciones de canalización ya iniciadas conservan sus etapas originales.'
};
es.resources.pipelineRuns = {
  ...rp('Ejecuciones de canalización', 'Cada ejecución de una canalización. Abre una para seguir sus etapas, decidir sus revisiones, o cancelarla y reintentarla.', 'Añadir ejecución de canalización', 'Crear ejecución de canalización', 'Editar ejecución de canalización', 'Detalles de la ejecución de canalización', 'Eliminar ejecución de canalización', 'Aún no hay ejecuciones de canalización', 'Inicia una canalización desde Agentes > Canalizaciones para ver aquí sus ejecuciones.'),
  columns: { id: 'ID', pipelineName: 'Canalización', status: 'Estado', outcome: 'Resultado', progress: 'Etapa', callerName: 'Iniciada por', errorMessage: 'Error', priority: 'Prioridad', deadlineUtc: 'Fecha límite', completedUtc: 'Completada', createdUtc: 'Creada' },
  actions: { cancel: 'Cancelar', retry: 'Reintentar', stageRuns: 'Ver ejecuciones de etapa', finalRun: 'Abrir ejecución final' },
  toasts: { cancelRequested: 'Se pidió cancelar la ejecución de canalización y su etapa actual.', retried: 'La ejecución de canalización se reanuda en la etapa donde se detuvo.' },
  progressValue: '{{position}} de {{count}}',
  versionShort: '(versión {{version}})'
};
es.resources.pipelineReviews = {
  ...rp('Revisiones de etapa', 'Etapas de canalización que esperan a que una persona las apruebe, pida cambios o las rechace.', 'Añadir revisión de etapa', 'Crear revisión de etapa', 'Editar revisión de etapa', 'Detalles de la revisión de etapa', 'Eliminar revisión de etapa', 'Aún no hay revisiones de etapa', 'Las etapas que requieren revisión aparecen aquí cuando terminan.'),
  columns: { createdUtc: 'Solicitada', pipelineName: 'Canalización', stageName: 'Etapa', status: 'Estado', decision: 'Decisión', decisionSource: 'Decidida por', comment: 'Comentario', decidedBy: 'Revisor', expiresUtc: 'Caduca', pipelineRunId: 'Ejecución de canalización', runId: 'Ejecución de etapa', decidedUtc: 'Decidida', id: 'ID' },
  filters: { pipelineRunId: 'ID de la ejecución de canalización', pipelineRunIdPlaceholder: 'ID de la ejecución de canalización (plr_...)' },
  actions: { approve: 'Aprobar', requestChanges: 'Pedir cambios', reject: 'Rechazar', openStageRun: 'Abrir ejecución de etapa' },
  noTimeout: 'Espera indefinidamente'
};
es.components.pipelineReviews = {
  decideTitle: 'Revisar la etapa {{stage}} de {{pipeline}}',
  decision: 'Decisión',
  positionExecution: 'etapa {{position}}, pasada {{execution}}',
  revisionsLeft: 'Correcciones restantes',
  revisionsLeftValue: '{{left}} de {{max}}',
  noRevisionsLeft: 'Esta etapa agotó sus {{max}} correcciones. El servidor rechazará Pedir cambios; apruébala o recházala.',
  timeoutThen: 'después {{decision}}',
  commentApprove: 'Notas para la siguiente etapa',
  commentApprovePlaceholder: 'Opcional. La siguiente etapa recibe estas notas junto con la salida.',
  commentRequestChanges: 'Qué debe cambiar',
  commentRequestChangesPlaceholder: 'Obligatorio. La etapa se vuelve a ejecutar con estos comentarios.',
  commentReject: 'Motivo',
  commentRejectPlaceholder: 'Opcional. Se guarda con la decisión; la ejecución de canalización falla.',
  commentRequired: 'Describe qué debe cambiar. La etapa se vuelve a ejecutar con estos comentarios.',
  commentTooLong: 'Los comentarios admiten como máximo {{max}} caracteres.',
  submit: { Approve: 'Aprobar etapa', RequestChanges: 'Pedir cambios', Reject: 'Rechazar etapa' },
  toasts: {
    Approve: 'Se aprobó la etapa {{stage}} de {{pipeline}}.',
    RequestChanges: 'Se pidieron cambios en la etapa {{stage}} de {{pipeline}}; se vuelve a ejecutar con tus comentarios.',
    Reject: 'Se rechazó la etapa {{stage}} de {{pipeline}}; la ejecución de canalización falla.',
    notPending: 'Otra persona o su tiempo de espera ya decidió esta revisión. La lista muestra ahora el estado actual.',
    revisionLimit: 'Esta etapa ya agotó sus correcciones (máximo {{max}}), así que ya no se pueden pedir cambios. Apruébala o recházala.'
  }
};
es.components.pipelineStart = {
  title: 'Iniciar {{name}}',
  intro_one: 'La entrada va a la única etapa de la canalización.',
  intro_other: 'La entrada va a la primera de {{count}} etapas; todas las etapas la ven también como la tarea original.',
  intro_many: 'La entrada va a la primera de {{count}} etapas; todas las etapas la ven también como la tarea original.',
  input: 'Entrada',
  inputPlaceholder: '¿En qué debe trabajar la canalización?',
  shortcut: 'Pulsa Ctrl+Intro o Cmd+Intro para iniciar.',
  submit: 'Iniciar canalización',
  starting: 'Iniciando...',
  started: 'Se inició {{name}}.'
};
es.components.pipelinePreview = {
  title: 'Previsualizar los prompts de {{name}}',
  input: 'Entrada de ejemplo',
  sampleInput: 'Resume las incidencias abiertas y propón una solución para la más urgente.',
  sampleOutput: 'Salida de ejemplo de {{stage}}.',
  outputOf: 'Salida de ejemplo de la etapa {{position}} ({{stage}})',
  render: 'Generar prompts',
  rendering: 'Generando...',
  stageHeading: 'Etapa {{position}}: {{stage}} ({{agent}})',
  deployment: 'Despliegue: {{deployment}}',
  rendered: 'Generado',
  failed: 'Con errores'
};
es.views.pipelineRunDetail = {
  title: 'Ejecución de canalización',
  heading: 'Ejecución de canalización de {{pipeline}}',
  notFoundTitle: 'No se encontró la ejecución de canalización',
  notFoundBody: 'Puede que se haya eliminado o que pertenezca a otro inquilino.',
  live: 'En vivo',
  polling: 'Actualizando',
  finalRun: 'Ejecución final',
  started: 'Iniciada',
  input: 'Entrada',
  reviewTitle: 'Espera tu revisión',
  reviewBody: 'La etapa {{position}} ({{stage}}) terminó la pasada {{execution}} y espera una revisión. Lee su salida en la ejecución de etapa:',
  reviewExpires: 'Si nadie decide antes de {{time}}, la revisión se decide automáticamente: {{decision}}.',
  reviewNoTimeout: 'La revisión espera hasta que decida una persona, salvo que el límite de tiempo de la canalización termine antes la ejecución.',
  stages: 'Etapas',
  stagesCount_one: '{{count}} etapa',
  stagesCount_other: '{{count}} etapas',
  stagesCount_many: '{{count}} etapas',
  noStages: 'Esta ejecución de canalización no tiene etapas.',
  current: 'Actual',
  reviewGate: 'Punto de revisión',
  agent: 'Agente {{agent}}',
  counts: 'Pasadas {{executions}}, intentos {{attempts}} de {{maxAttempts}}, correcciones {{revisions}} de {{maxRevisions}}',
  startedAt: 'iniciada',
  blocked: 'Esperando para iniciar: {{reason}}.',
  nextAttempt: 'Próximo intento a las {{time}}.',
  reviewItem: 'Revisión de la pasada {{execution}}',
  columns: { execution: 'Pasada', run: 'Ejecución de etapa', status: 'Estado', outcome: 'Resultado', error: 'Error', created: 'Creada' },
  confirmCancelTitle: 'Cancelar ejecución de canalización',
  confirmCancel: '¿Cancelar esta ejecución de canalización de {{pipeline}}? Se cancela la ejecución de su etapa actual y se cierra la revisión pendiente. Puedes reintentarla más tarde.',
  confirmDelete: '¿Eliminar esta ejecución de canalización de {{pipeline}} y sus revisiones? Sus ejecuciones de etapa se quedan en la página Ejecuciones.'
};
Object.assign(es.views.runDetail, { pipelineRun: 'Ejecución de canalización' });
es.views.settings.fields.Runtime.PipelineSweepIntervalMs = 'Intervalo de revisión de canalizaciones (ms)';
es.views.settings.fields.Runtime.PipelineMaxStages = 'Máximo de etapas por canalización';

// Deployment trust level (P11.14).
es.enums.trustLevel = { Trusted: "De confianza", Untrusted: "No de confianza" };
es.enums.runBlockedReason.NoIsolatingWorker = "Ningún nodo de trabajo con aislamiento";
es.components.blocked.reasons.NoIsolatingWorker = "Esta ejecución no es de confianza y necesita aislamiento de contenedor, pero ningún nodo de trabajo listo que pueda ejecutar {{harness}} lo ofrece. Añade un nodo de trabajo con el ejecutor Job de Kubernetes, en un clúster donde pueda crear Jobs.";
es.tips.enums.runBlockedReason.NoIsolatingWorker = "Bloqueada: esta ejecución no de confianza necesita aislamiento de contenedor y ningún nodo de trabajo listo con su harness lo ofrece. Espera en la cola hasta que se registre un nodo de trabajo con el ejecutor Job de Kubernetes.";
es.tips.enums.trustLevel = { Trusted: "La entrada solo llega de llamadores de confianza. Las ejecuciones pueden usar el ejecutor Process, que no está aislado de otras ejecuciones ni del nodo de trabajo.", Untrusted: "La entrada puede venir de fuentes no confiables. Las ejecuciones solo van a un ejecutor con aislamiento de contenedor o superior y esperan en la cola hasta que haya uno disponible." };
Object.assign(es.common.fieldCodes, { TenantRequiresUntrusted: "Este inquilino exige que todos los despliegues sean no de confianza.", UntrustedNeedsIsolation: "Un despliegue no de confianza no puede usar el ejecutor Process. Elige Job de Kubernetes o deja el ejecutor vacío." });
es.resources.deployments.fields.trustLevel = "Nivel de confianza";
es.resources.deployments.columns.trustLevel = "Nivel de confianza";
es.resources.deployments.hints.trustLevel = "Elige No de confianza cuando los llamadores o el contenido puedan no ser fiables. Esas ejecuciones necesitan aislamiento de contenedor: un ejecutor vacío significa entonces Job de Kubernetes, y las ejecuciones esperan hasta que un nodo de trabajo pueda aislarlas.";
es.tips.resources.deployments.trustLevel = "De confianza permite el ejecutor Process, que no está aislado. No de confianza solo se ejecuta en un ejecutor con aislamiento de contenedor o superior.";
es.tips.resources.deployments.trustFlagged = "Este inquilino exige despliegues no de confianza. Este despliegue era de confianza antes de activar la política: sigue ejecutándose tal como está configurado, pero debe cambiarse a No de confianza la próxima vez que se guarde.";
es.resources.deployments.trust = { tenantRequiresUntrusted: "Este inquilino exige despliegues no de confianza. Cambia el nivel de confianza a No de confianza para guardar este despliegue.", untrustedProcess: "Los despliegues no de confianza no pueden usar el ejecutor Process. Elige Job de Kubernetes o deja el ejecutor vacío.", flagged: "De confianza, la política exige No de confianza" };
es.resources.tenants.fields.requireUntrustedDeployments = "Exigir despliegues no de confianza";
es.resources.tenants.columns.requireUntrustedDeployments = "Exige No de confianza";
es.resources.tenants.hints = { ...(es.resources.tenants.hints || {}), requireUntrustedDeployments: "Se rechaza crear o guardar un despliegue de confianza. Los despliegues de confianza existentes siguen ejecutándose y quedan marcados hasta que se guarden como no de confianza." };
es.tips.resources.tenants.requireUntrustedDeployments = "Si está activado, todos los despliegues de este inquilino deben ser no de confianza, de modo que sus ejecuciones solo van a ejecutores aislados.";
es.views.runDetail.trustLevel = "Nivel de confianza";
es.tips.views.runDetail.trustLevel = "El nivel de confianza del despliegue cuando esta ejecución entró en la cola. Las ejecuciones no de confianza solo van a un ejecutor con aislamiento de contenedor o superior.";

// Deployment effect policy (P12.29).
es.enums.effectPolicy = { AtMostOnce: "Como máximo una vez", AtLeastOnce: "Al menos una vez", Journaled: "Con registro" };
es.tips.enums.effectPolicy = { AtMostOnce: "Si el worker se pierde después de que la ejecución empezó, la ejecución falla con Nodo perdido y nunca vuelve a empezar. Ningún efecto externo ocurre dos veces. El valor predeterminado.", AtLeastOnce: "Si el worker se pierde después de que la ejecución empezó, la ejecución vuelve a la cola mientras le queden intentos. Los efectos que ya hizo el intento perdido (un push, un mensaje) pueden repetirse.", Journaled: "Vuelve a encolar solo cuando todos los efectos pasaron por el registro de efectos. El registro aún no existe, así que se comporta como Como máximo una vez." };
Object.assign(es.common.fieldCodes, { EffectPolicyConflict: "La política de efectos no coincide con el valor obsoleto retryOnNodeLoss. Envíe solo la política de efectos." });
es.resources.deployments.fields.effectPolicy = "Política de efectos";
es.resources.deployments.columns.effectPolicy = "Política de efectos";
es.resources.deployments.hints.effectPolicy = "Como máximo una vez (predeterminado) marca como fallida, con Nodo perdido, una ejecución iniciada cuyo worker se pierde. Al menos una vez la vuelve a encolar mientras queden intentos y puede repetir efectos. Con registro se comporta como Como máximo una vez hasta que exista el registro de efectos. Una ejecución que nunca empezó siempre vuelve a la cola.";
es.tips.resources.deployments.effectPolicy = "Qué ocurre con una ejecución iniciada cuando se pierde su worker: fallar (Como máximo una vez), volver a encolar (Al menos una vez) o Con registro, que por ahora se comporta como Como máximo una vez.";
es.views.runDetail.effectPolicy = "Política de efectos";
es.tips.views.runDetail.effectPolicy = "La política de efectos de la implementación cuando esta ejecución entró en la cola. Decide qué ocurre si se pierde el worker de la ejecución; los cambios posteriores en la implementación no afectan a esta ejecución.";
es.views.settings.fields.Scheduling.QueueWakeFanout = "Sondeos despertados por réplica";
es.views.settings.fields.Scheduling.RemoteWakeDelayMs = "Retención de avisos remotos (ms)";
es.views.settings.fields.Auth.CacheSeconds = "Duración de la caché de autenticación (segundos)";

// Deployment egress allowlists (P11.15).
es.resources.deployments.fields.egressRules = "Lista de salida permitida";
es.resources.deployments.fields.egressCidr = "Bloque CIDR";
es.resources.deployments.fields.egressPort = "Puerto de destino";
es.resources.deployments.fields.egressProtocol = "Protocolo";
es.resources.deployments.columns.egressRules = "Salida";
es.resources.deployments.hints.egressRules = "Déjala vacía para usar la salida predeterminada del clúster para ejecuciones (HTTPS a cualquier destino). Con reglas, los pods de ejecución solo alcanzan DNS, el puerto MCP de Garrison y estos bloques, y las ejecuciones necesitan un worker de Kubernetes que las aplique. Escribe bloques CIDR, no nombres de host; resuelve tú los nombres a direcciones. Un puerto vacío permite todos los puertos. Como máximo 64 reglas.";
es.resources.deployments.egress = {"add": "Añadir regla de salida", "allPorts": "Todos los puertos", "default": "Predeterminada", "count_one": "Lista permitida, {{count}} regla", "count_other": "Lista permitida, {{count}} reglas", "note_one": "Este despliegue tiene {{count}} regla de salida. Sus ejecuciones solo se ejecutan en workers de Kubernetes con listas de salida habilitadas, en un pod cuya NetworkPolicy solo permite DNS, el puerto MCP de Garrison y la regla. Si no hay ningún worker así listo, las ejecuciones esperan en la cola (Ningún nodo de trabajo con aislamiento); nunca se ejecutan sin la lista permitida.", "note_other": "Este despliegue tiene {{count}} reglas de salida. Sus ejecuciones solo se ejecutan en workers de Kubernetes con listas de salida habilitadas, en un pod cuya NetworkPolicy solo permite DNS, el puerto MCP de Garrison y las reglas. Si no hay ningún worker así listo, las ejecuciones esperan en la cola (Ningún nodo de trabajo con aislamiento); nunca se ejecutan sin la lista permitida.", "errors": {"cidrRequired": "Escribe un bloque CIDR, por ejemplo 203.0.113.0/24.", "cidrFormat": "Usa notación CIDR con longitud de prefijo, por ejemplo 198.51.100.7/32. No se aceptan nombres de host.", "cidrAddress": "La dirección no es una dirección IPv4 o IPv6 válida.", "cidrPrefix": "La longitud de prefijo está fuera de rango (0 a 32 para IPv4, 0 a 128 para IPv6).", "cidrMapped": "No se permiten direcciones IPv6 mapeadas a IPv4; escribe el bloque IPv4.", "cidrHostBits": "La dirección tiene bits activos después del prefijo; usa la dirección de red del bloque."}};
Object.assign(es.common.fieldCodes, {"InvalidCidr": "Bloque CIDR no válido.", "PortOutOfRange": "El puerto debe estar entre 1 y 65535, o vacío para todos los puertos.", "InvalidProtocol": "Protocolo desconocido; usa TCP o UDP.", "TooManyEgressRules": "Un despliegue puede tener como máximo 64 reglas de salida.", "EgressRulesNeedKubernetesJob": "Las reglas de salida solo se aplican a ejecuciones con Job de Kubernetes. Elige Job de Kubernetes o deja el ejecutor vacío.", "EgressRulesNeedColdStart": "Las reglas de salida necesitan arranque en frío, porque los pods precalentados ya se ejecutan con la salida predeterminada. Vacía la clase de arranque o elige En frío."});
es.components.blocked.reasons.NoIsolatingWorkerEgress = "El despliegue de esta ejecución tiene una lista de salida permitida que solo puede aplicar un worker de Kubernetes con listas de salida habilitadas, y ningún worker listo que pueda ejecutar {{harness}} lo ofrece. La ejecución espera en la cola y nunca se ejecuta sin la lista. Activa las listas de salida en un worker con Job de Kubernetes, en un clúster cuyo plugin de red aplique NetworkPolicy.";
es.tips.enums.runBlockedReason.NoIsolatingWorker = "Bloqueada: esta ejecución necesita un worker con aislamiento (aislamiento de contenedor para una ejecución no de confianza, o control de salida para un despliegue con lista de salida permitida), y ningún worker listo con su harness lo ofrece. Espera en la cola hasta que se registre un worker adecuado con Job de Kubernetes.";
es.tips.resources.deployments.egressRules = "Destinos que pueden alcanzar los pods de ejecución de este despliegue, como bloques CIDR con puerto y protocolo opcionales. Vacía usa la salida predeterminada.";
es.tips.resources.deployments.egressRulesItems = {"cidr": "Bloque de destino en notación CIDR, IPv4 o IPv6, por ejemplo 203.0.113.0/24. Resuelve tú los nombres de host a direcciones.", "port": "Puerto de destino de 1 a 65535. Déjalo vacío para permitir todos los puertos del bloque.", "protocol": "TCP para la mayoría de los servicios, o UDP."};
es.tips.resources.deployments.egressDefault = "Sin lista de salida permitida: los pods de ejecución usan la salida predeterminada del clúster.";

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
})(es, {
 "nav": {
  "items": {
   "triggers": {
    "label": "Disparadores",
    "tip": "Programaciones cron y webhooks firmados que inician ejecuciones"
   },
   "notifications": {
    "label": "Notificaciones",
    "tip": "Webhooks firmados sobre ejecuciones, canalizaciones y aprobaciones"
   }
  }
 },
 "enums": {
  "triggerType": {
   "Cron": "Programación cron",
   "Webhook": "Webhook firmado"
  },
  "triggerTargetType": {
   "Agent": "Ejecución de agente",
   "Pipeline": "Ejecución de canalización"
  },
  "triggerFireSource": {
   "Cron": "Programación",
   "Webhook": "Entrega de webhook",
   "Manual": "Disparado a mano"
  },
  "triggerFireOutcome": {
   "Started": "Iniciado",
   "Failed": "Fallido",
   "Skipped": "Omitido"
  },
  "notificationEvent": {
   "RunSucceeded": "Ejecución correcta",
   "RunFailed": "Ejecución fallida",
   "RunCancelled": "Ejecución cancelada",
   "RunTimedOut": "Ejecución agotó el tiempo",
   "PipelineCompleted": "Canalización completada",
   "PipelineFailed": "Canalización fallida",
   "ApprovalRequested": "Aprobación solicitada",
   "Test": "Notificación de prueba"
  },
  "notificationDeliveryStatus": {
   "Pending": "En espera",
   "Delivering": "Entregando",
   "Succeeded": "Entregada",
   "Failed": "Abandonada"
  },
  "runKind": {
   "Invoke": "Invocación",
   "Delegated": "Delegada",
   "Test": "Ejecución de prueba",
   "Retry": "Reintento",
   "Pipeline": "Etapa de canalización",
   "Trigger": "Iniciada por un disparador"
  },
  "resourceType": {
   "Trigger": "Disparador",
   "NotificationEndpoint": "Endpoint de notificación"
  },
  "auditEventType": {
   "SigningSecretRotated": "Secreto de firma renovado"
  }
 },
 "errorCodes": {
  "ReferencedByTrigger": "Un disparador usa este registro. Cambia o elimina primero ese disparador.",
  "ReferencedByNotificationEndpoint": "Un endpoint de notificación filtra por este registro. Cambia o elimina primero ese endpoint.",
  "NotAWebhookTrigger": "Solo los disparadores de webhook tienen secreto de firma.",
  "TriggerInactive": "Este disparador está inactivo.",
  "InvalidSignature": "La firma del webhook falta, tiene un formato incorrecto, es demasiado antigua o no coincide.",
  "PayloadTooLarge": "La carga útil supera lo que acepta el servidor."
 },
 "common": {
  "fieldCodes": {
   "InvalidUrl": "Introduce una URL HTTP o HTTPS absoluta, sin usuario ni contraseña.",
   "DestinationBlocked": "El servidor rechaza este destino: las direcciones de loopback, privadas, de enlace local y de metadatos están bloqueadas salvo que un operador permita destinos privados.",
   "EventsRequired": "Elige al menos un evento.",
   "InvalidEvent": "Uno de los eventos no está admitido.",
   "InvalidCron": "La expresión cron no es válida. Usa cinco campos: minuto, hora, día del mes, mes y día de la semana.",
   "InvalidTimeZone": "Zona horaria desconocida. Usa un nombre IANA como UTC o Europe/Madrid.",
   "TypeImmutable": "El tipo de un disparador no puede cambiar. Crea un disparador nuevo.",
   "TargetMismatch": "Este campo no corresponde al destino elegido.",
   "PayloadTooLarge": "La carga útil supera lo que acepta el servidor."
  }
 },
 "resources": {
  "runs": {
   "columns": {
    "triggerId": "Disparador",
    "kind": "Tipo de ejecución"
   }
  },
  "triggers": {
   "title": "Disparadores",
   "subtitle": "Programaciones cron y webhooks firmados que inician una ejecución de agente o de canalización.",
   "add": "Añadir disparador",
   "create": "Crear disparador",
   "edit": "Editar disparador",
   "view": "Detalles del disparador",
   "deleteTitle": "Eliminar disparador",
   "emptyTitle": "Aún no hay disparadores",
   "emptyBody": "Crea un disparador para ejecutar un agente según una programación o cuando otro sistema envíe un webhook.",
   "columns": {
    "name": "Nombre",
    "type": "Tipo",
    "target": "Inicia",
    "schedule": "Programación",
    "active": "Activo",
    "lastFire": "Último disparo",
    "nextFireUtc": "Próximo disparo",
    "fireCount": "Disparos",
    "runAs": "Se ejecuta como",
    "signingSecretLast4": "Secreto termina en",
    "description": "Descripción",
    "id": "ID",
    "createdUtc": "Creado"
   },
   "fields": {
    "name": "Nombre",
    "type": "Tipo",
    "description": "Descripción",
    "targetType": "Inicia",
    "agentId": "Agente",
    "deploymentId": "Despliegue",
    "pipelineId": "Canalización",
    "inputTemplateId": "Plantilla de entrada",
    "priority": "Prioridad",
    "cronExpression": "Expresión cron",
    "timeZone": "Zona horaria",
    "active": "Activo",
    "webhook": "URL del webhook"
   },
   "hints": {
    "type": "El tipo no se puede cambiar después de crear el disparador.",
    "inputTemplateId": "Una plantilla Task que genera la entrada de la ejecución con las variables trigger.* y webhook.*. Vacío usa la plantilla integrada trigger-input.",
    "priority": "De {{min}} a {{max}}. Las más altas se ejecutan antes.",
    "cronExpression": "Cinco campos: minuto, hora, día del mes, mes y día de la semana. Ejemplo: 0 9 * * 1-5 se ejecuta a las 09:00 en días laborables.",
    "timeZone": "Nombre IANA como UTC o Europe/Madrid. Los cambios de horario de verano se gestionan solos.",
    "webhookNew": "La URL del webhook y el secreto de firma aparecen al guardar. El secreto se muestra una sola vez."
   },
   "errors": {
    "name": "Usa de 1 a 64 letras minúsculas, dígitos y guiones, empezando y terminando con una letra o un dígito.",
    "description": "Las descripciones tienen un máximo de {{max}} caracteres.",
    "agentRequired": "Elige el agente que ejecuta este disparador.",
    "pipelineRequired": "Elige la canalización que inicia este disparador.",
    "cron": "Introduce cinco campos (minuto hora día mes día-de-semana) o una macro como @daily.",
    "priority": "Introduce un número entero de {{min}} a {{max}}."
   },
   "actions": {
    "fire": "Disparar ahora",
    "fires": "Historial de disparos",
    "runs": "Ver ejecuciones",
    "rotateSecret": "Renovar secreto"
   },
   "fires": {
    "firedUtc": "Disparado",
    "source": "Origen",
    "outcome": "Resultado",
    "started": "Ejecución iniciada",
    "deliveryId": "ID de entrega",
    "error": "Fallo",
    "runId": "Ejecución",
    "pipelineRunId": "Ejecución de canalización"
   },
   "confirmRotateTitle": "Renovar secreto de firma",
   "confirmRotate": "¿Reemplazar el secreto de firma de {{name}}? El secreto anterior deja de funcionar al instante, así que los emisores deben pasar al nuevo.",
   "anyDeployment": "Cualquier despliegue activo (ponderado)",
   "builtinTemplate": "Plantilla integrada trigger-input",
   "webhookSchedule": "Cuando llega un webhook firmado",
   "neverFired": "Aún no se ha disparado",
   "runAsNotice": "Se ejecuta como {{name}}. Al guardar cambios, este disparador pasa a ejecutarse como tú.",
   "secretEnding": "El secreto actual termina en {{last4}}."
  },
  "notifications": {
   "title": "Notificaciones",
   "subtitle": "Endpoints de webhook que reciben notificaciones firmadas cuando terminan ejecuciones y canalizaciones o esperan aprobaciones.",
   "add": "Añadir endpoint",
   "create": "Crear endpoint de notificación",
   "edit": "Editar endpoint de notificación",
   "view": "Detalles del endpoint de notificación",
   "deleteTitle": "Eliminar endpoint de notificación",
   "emptyTitle": "Aún no hay endpoints de notificación",
   "emptyBody": "Añade un endpoint para recibir un POST HTTP firmado cuando falla una ejecución, termina una canalización o espera una aprobación.",
   "columns": {
    "name": "Nombre",
    "url": "URL",
    "events": "Eventos",
    "filters": "Filtros",
    "active": "Activo",
    "signingSecretLast4": "Secreto termina en",
    "includeResultText": "Texto del resultado",
    "description": "Descripción",
    "id": "ID",
    "createdUtc": "Creado",
    "agent": "Agente",
    "deployment": "Despliegue"
   },
   "fields": {
    "name": "Nombre",
    "description": "Descripción",
    "url": "URL",
    "events": "Eventos",
    "agentId": "Solo este agente",
    "deploymentId": "Solo este despliegue",
    "includeResultText": "Incluir el texto del resultado",
    "resultTextMaxChars": "Límite del texto del resultado (caracteres)",
    "active": "Activo"
   },
   "hints": {
    "url": "Una URL HTTP o HTTPS. Las direcciones de loopback, privadas y de metadatos se rechazan salvo que un operador permita destinos privados, y no se siguen redirecciones.",
    "events": "Los eventos de canalización no se envían mientras haya un filtro de agente o de despliegue.",
    "agentId": "Vacío envía eventos de todos los agentes.",
    "deploymentId": "Vacío envía eventos de todos los despliegues.",
    "includeResultText": "Desactivado por defecto: las notificaciones llevan identificadores, estado y marcas de tiempo, pero no la salida de la ejecución.",
    "resultTextMaxChars": "De {{min}} a {{max}}. Por defecto {{default}}."
   },
   "errors": {
    "name": "Usa de 1 a 64 letras minúsculas, dígitos y guiones, empezando y terminando con una letra o un dígito.",
    "url": "Introduce una URL HTTP o HTTPS absoluta, sin usuario ni contraseña.",
    "events": "Elige al menos un evento.",
    "resultTextMaxChars": "Introduce un número entero de {{min}} a {{max}}."
   },
   "actions": {
    "test": "Enviar prueba",
    "deliveries": "Registro de entregas",
    "rotateSecret": "Renovar secreto"
   },
   "deliveries": {
    "createdUtc": "En cola desde",
    "event": "Evento",
    "status": "Estado",
    "attempts": "Intentos",
    "lastStatusCode": "Estado HTTP",
    "lastError": "Último fallo",
    "lastAttemptUtc": "Último intento",
    "nextAttemptUtc": "Próximo intento",
    "deliveredUtc": "Entregada",
    "payload": "Carga útil",
    "id": "ID de entrega"
   },
   "confirmRotateTitle": "Renovar secreto de firma",
   "confirmRotate": "¿Reemplazar el secreto de firma de {{name}}? Desde ahora las notificaciones se firman con el nuevo secreto, incluidos los reintentos ya en cola.",
   "anyAgent": "Todos los agentes",
   "anyDeployment": "Todos los despliegues",
   "noFilter": "Todo",
   "eventCount_one": "{{count}} evento",
   "eventCount_other": "{{count}} eventos",
   "resultTextUpTo_one": "Hasta {{count}} carácter",
   "resultTextUpTo_other": "Hasta {{count}} caracteres",
   "secretNotice": "Las notificaciones se firman con un secreto que termina en {{last4}}, establecido el {{time}}. Renuévalo para obtener uno nuevo."
  }
 },
 "components": {
  "signingSecret": {
   "title": "Secreto de firma",
   "warning": "Copia este secreto ahora. Garrison lo guarda cifrado y no lo volverá a mostrar; renuévalo si se pierde.",
   "secret": "Secreto",
   "url": "URL del webhook",
   "done": "Ya lo guardé",
   "scheme": "Firma cada solicitud con la cabecera {{header}}: {{format}}. Envía {{delivery}} para que las entregas repetidas cuenten una sola vez."
  },
  "triggerFire": {
   "title": "Disparar {{name}}",
   "intro": "Inicia este disparador ahora. La carga útil es opcional; la plantilla de entrada la ve como webhook.body.",
   "body": "Carga útil",
   "contentType": "Tipo de contenido de la carga útil",
   "submit": "Disparar",
   "firing": "Disparando..."
  },
  "triggerFires": {
   "title": "Historial de disparos",
   "count_one": "{{shown}} de {{count}} disparo",
   "count_other": "{{shown}} de {{count}} disparos",
   "empty": "Este disparador aún no se ha disparado.",
   "scheduled": "para {{time}}"
  },
  "notificationDeliveries": {
   "title": "Registro de entregas",
   "count_one": "{{shown}} de {{count}} entrega",
   "count_other": "{{shown}} de {{count}} entregas",
   "empty": "Aún no se ha enviado nada a este endpoint.",
   "detail": "Entrega seleccionada"
  },
  "notificationTest": {
   "title": "Notificación de prueba",
   "sending": "Enviando una notificación de prueba...",
   "succeeded": "El endpoint aceptó la notificación de prueba.",
   "failed": "La notificación de prueba falló y no se reintentará. Consulta el fallo abajo.",
   "pending": "El primer intento falló; Garrison lo reintentará. Consulta el fallo abajo."
  }
 },
 "views": {
  "runDetail": {
   "trigger": "Disparador"
  },
  "settings": {
   "groups": {
    "Triggers": "Disparadores",
    "Notifications": "Notificaciones"
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Cuerpo de webhook más grande (bytes)",
     "WebhookToleranceSeconds": "Tolerancia de marca de tiempo del webhook (segundos)",
     "CronMaxLatenessSeconds": "Límite de recuperación de cron (segundos)",
     "FireRetentionDays": "Retención del historial de disparos (días)"
    },
    "Notifications": {
     "AllowPrivateDestinations": "Permitir destinos privados",
     "MaxAttempts": "Intentos de entrega",
     "InitialBackoffSeconds": "Espera antes del primer reintento (segundos)",
     "MaxBackoffSeconds": "Espera máxima entre reintentos (segundos)",
     "TimeoutSeconds": "Tiempo límite de entrega (segundos)",
     "DispatchIntervalMs": "Intervalo de envío (ms)",
     "SweepOverlapSeconds": "Solapamiento del barrido de eventos (segundos)",
     "DeliveryRetentionDays": "Retención del registro de entregas (días)"
    }
   }
  }
 }
});
Object.assign(es.common.fieldCodes, {"SecretUseDenied": "No tienes permiso para usar este secreto. Pide el rol SecretUser o SecretManager sobre él.", "GrantCeiling": "Solo puedes conceder permisos que tú mismo tienes.", "ReservedRoleName": "Es el nombre de un rol integrado. Elige otro nombre."});
es.components.mcpTest.noWorkers = "Ningún worker listo ofrece diagnósticos stdio. Los workers solo los ejecutan cuando un operador define GARRISON_WORKER_MCP_TESTS_ENABLED=true en ellos, porque el comando se ejecuta en el host del worker, fuera del aislamiento de las ejecuciones.";

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
})(es, {
 "components": {
  "transcriptExport": {
   "label": "Exportar transcripción",
   "exporting": "Exportando...",
   "markdown": "Documento Markdown (.md)",
   "json": "JSON (.json)",
   "includeThinking": "Incluir razonamiento",
   "failed": "No se pudo exportar la transcripción: {{message}}"
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "Entrada estructurada",
    "modeLabel": "Editor de entrada",
    "modeForm": "Formulario",
    "modeJson": "JSON sin procesar",
    "required": "obligatorio",
    "choose": "Seleccione un valor",
    "addItem": "Añadir elemento",
    "removeItem": "Quitar elemento",
    "jsonLabel": "JSON de entrada",
    "jsonPlaceholder": "Valor JSON",
    "unsupported": "Este esquema de entrada no tiene propiedades con las que crear un formulario. Escriba el documento JSON que espera el agente.",
    "invalidRaw": "El JSON no es válido. Corríjalo antes de cambiar al formulario.",
    "errors": {
     "required": "Este campo es obligatorio.",
     "number": "Escriba un número.",
     "integer": "Escriba un número entero.",
     "json": "Escriba un JSON válido."
    }
   }
  },
  "manifests": {
   "bundle": {
    "scope": "Alcance de la exportación",
    "scopeAll": "Todos los recursos",
    "scopeSelected": "Recursos seleccionados",
    "kinds": "Tipos",
    "resources": "Recursos",
    "resourcesHint": "Un Tipo/nombre por línea o separados por comas, por ejemplo Agent/triage.",
    "invalidSelectors": "No es un Tipo/nombre con un tipo conocido: {{entries}}",
    "followReferences": "Incluir lo que referencian",
    "includeBuiltIn": "Incluir los integrados referenciados",
    "exporting": "Exportando...",
    "noSecrets": "Este paquete no necesita secretos.",
    "requiredSecrets": "Cree estos secretos en el inquilino de destino antes de aplicar. Los valores de los secretos nunca se exportan.",
    "requiredArtifactStores": "Cree estos almacenes de artefactos en el inquilino de destino antes de aplicar."
   }
  }
 }
});

// Durable continuation and remote execution.
es.enums.runStatus.Suspended = "Suspendida";
es.resources.deployments.fields.suspensionEnabled = "Suspender mientras espera aprobación";
es.resources.harnessProfiles.fields.sessionFormat = "Formato de sesión del arnés";
es.enums.auditEventType.QueueFull = "Cola llena";
es.enums.runExecutor.RemoteA2A = "A2A remoto";
es.enums.runExecutor.RemoteMcp = "MCP remoto";
es.tips.resources.deployments.suspensionEnabled = "Activa puntos de control persistentes durante la espera. Requiere Process, directorio personal aislado, un arnés compatible con reanudación y almacén de artefactos.";
es.tips.resources.harnessProfiles.sessionFormat = "Formato de sesión versionado para puntos de control portátiles. Cámbielo si una actualización del arnés cambia la compatibilidad.";
es.tips.enums.runStatus.Suspended = "La ejecución tiene un punto de control persistente y no retiene una concesión ni una plaza del trabajador mientras espera.";
es.tips.enums.runExecutor.RemoteA2A = "Ejecuta un agente A2A registrado y autenticado con plazo y cancelación.";
es.tips.enums.runExecutor.RemoteMcp = "Invoca la herramienta MCP remota seleccionada con entrada JSON validada.";
es.tips.enums.auditEventType.QueueFull = "Se rechazó la admisión porque se alcanzó un límite de cola del clúster, inquilino o agente.";

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
})(es, {
 "enums": {
  "agentRevisionState": {
   "Draft": "Borrador",
   "Published": "Publicada"
  },
  "promotionKind": {
   "Promote": "Promoción",
   "Rollback": "Reversión"
  },
  "promotionOutcome": {
   "Applied": "Aplicada",
   "RolledBack": "Revertida"
  },
  "revisionChangeType": {
   "Changed": "Modificado",
   "Added": "Añadido",
   "Removed": "Eliminado"
  },
  "resourceType": {
   "AgentRevision": "Revisión de agente",
   "Promotion": "Promoción"
  }
 },
 "errorCodes": {
  "PromotionOrderViolation": "El destino no es el entorno siguiente al de origen. Active Permitir saltar entornos para promover fuera de orden.",
  "NoNextEnvironment": "El origen es el último entorno, así que no hay adónde promover.",
  "NoTargetDeployments": "Este agente no tiene ningún despliegue en el entorno de destino. Cree uno allí primero.",
  "NoSourceRevision": "No hay revisión que promover: el agente no tiene despliegues en el entorno de origen o no tiene ninguna revisión publicada. Elija una revisión explícitamente.",
  "AmbiguousSourceRevision": "Los despliegues del entorno de origen ejecutan revisiones distintas. Elija la revisión que desea promover.",
  "RevisionNotPublished": "Esa revisión es un borrador. Publíquela antes de promoverla.",
  "PromotionConflict": "Un despliegue cambió mientras se aplicaba la promoción. No se cambió nada; recargue e inténtelo de nuevo.",
  "NotAPromotion": "Solo se pueden revertir promociones, no reversiones.",
  "AlreadyRolledBack": "Esta promoción ya se revirtió.",
  "RevisionUnchanged": "El borrador es igual a la última revisión publicada. Modifíquelo antes de publicarlo o descártelo.",
  "RevisionPublished": "Esta revisión ya está publicada y no puede cambiar.",
  "EnvironmentInUse": "Un entorno que eliminó todavía tiene despliegues. Muévalos o elimínelos primero."
 },
 "views": {
  "agentDetail": {
   "revisions": "Revisiones",
   "draftNotice": "Este agente tiene cambios en borrador sin publicar. Los despliegues siguen ejecutando revisiones publicadas hasta que se publique el borrador.",
   "reviewDraft": "Revisar borrador"
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "number": "Revisión",
    "state": "Estado",
    "author": "Autor",
    "changeNote": "Nota de cambios",
    "publishedUtc": "Publicada",
    "actions": "Acciones"
   },
   "number": "Revisión {{number}}",
   "option": "Revisión {{number}} ({{state}})",
   "latest": "Última",
   "empty": "Este agente todavía no tiene revisiones.",
   "compareTitle": "Comparar revisiones",
   "from": "Desde",
   "to": "Hasta",
   "pickTwo": "Seleccione dos revisiones distintas para compararlas.",
   "identical": "Las revisiones {{from}} y {{to}} tienen el mismo contenido.",
   "diffSummary": "Campos modificados entre la revisión {{from}} y la revisión {{to}}: {{changed}}.",
   "diffColumns": {
    "field": "Campo",
    "change": "Cambio",
    "before": "Antes",
    "after": "Después"
   },
   "emptyValue": "(vacío)",
   "compare": "Comparar",
   "publish": "Publicar",
   "discard": "Descartar borrador",
   "publishTitle": "Publicar la revisión {{number}}",
   "publishBody": "Al publicar, la revisión {{number}} pasa a ser la última revisión publicada. Los despliegues que siguen la última revisión la ejecutan desde su próxima ejecución; los despliegues fijados conservan su revisión.",
   "changeNote": "Nota de cambios",
   "changeNotePlaceholder": "Qué cambió y por qué (opcional)",
   "publishing": "Publicando...",
   "published": "Revisión {{number}} publicada.",
   "discardTitle": "Descartar la revisión en borrador {{number}}",
   "discardMessage": "¿Descartar el borrador? Sus cambios se pierden. Las revisiones publicadas y los despliegues no se ven afectados.",
   "discarded": "Se descartó el borrador."
  },
  "promote": {
   "title": "Promover una revisión",
   "intro": "Fija cada despliegue del agente en el entorno de destino a la revisión que se ejecuta en el entorno de origen. Cada promoción queda registrada y se puede revertir.",
   "agent": "Agente",
   "revision": "Revisión que se promueve",
   "revisionFromSource": "La revisión que se ejecuta en el entorno de origen",
   "source": "Entorno de origen",
   "target": "Entorno de destino",
   "targetNext": "Entorno siguiente ({{name}})",
   "allowSkip": "Permitir saltar entornos",
   "skipWarning": "{{target}} no es el entorno inmediatamente posterior a {{source}}.",
   "note": "Nota",
   "notePlaceholder": "Motivo de esta promoción (opcional)",
   "submit": "Promover",
   "promoting": "Promoviendo...",
   "promoted": "Promovida a {{target}}. Despliegues actualizados: {{deployments}}.",
   "errors": {
    "noNext": "No hay ningún entorno después del entorno de origen.",
    "sameEnvironment": "Elija un entorno de destino distinto del de origen.",
    "needsSkip": "Este destino salta un entorno. Active Permitir saltar entornos para promover fuera de orden."
   }
  },
  "promotions": {
   "title": "Historial de promociones",
   "agentFilter": "Agente",
   "allAgents": "Todos los agentes",
   "empty": "Todavía no hay promociones ni reversiones.",
   "columns": {
    "createdUtc": "Cuándo",
    "kind": "Tipo",
    "outcome": "Resultado",
    "agent": "Agente",
    "revision": "Revisión",
    "environments": "Entornos",
    "deployments": "Despliegues",
    "actor": "Por",
    "note": "Nota",
    "actions": "Acciones"
   },
   "path": "{{source}} a {{target}}",
   "pinChange": "({{from}} a {{to}})",
   "skipped": "Entornos saltados",
   "rollback": "Revertir",
   "rollbackTitle": "Revertir la promoción",
   "rollbackMessage": "¿Restaurar las fijaciones de revisión que tenían antes los despliegues modificados por esta promoción de {{source}} a {{target}}? Despliegues afectados: {{deployments}}.",
   "rollbackNote": "Nota de reversión",
   "rolledBack": "Revertida. Se restauraron las fijaciones de revisión anteriores."
  }
 },
 "resources": {
  "deployments": {
   "columns": {
    "environment": "Entorno",
    "agentRevisionId": "Revisión fijada"
   },
   "fields": {
    "environment": "Entorno",
    "agentRevisionId": "Fijación de revisión"
   },
   "hints": {
    "environment": "La promoción mueve las revisiones por los entornos en el orden del inquilino.",
    "agentRevisionId": "Vacío sigue la última revisión publicada del agente. Una fijación mantiene este despliegue en una revisión hasta que usted o una promoción la cambien."
   },
   "followLatest": "Seguir la última publicada",
   "latest": "Última",
   "selectAgentFirst": "Seleccione primero un agente.",
   "noPublished": "Este agente todavía no tiene ninguna revisión publicada.",
   "actions": {
    "promote": "Promover",
    "promotions": "Historial de promociones"
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
})(es, {
 "nav": {
  "items": {
   "agentAssets": {
    "label": "Recursos",
    "tip": "Prompts de sistema, habilidades, archivos de referencia y plantillas de documento versionados que fijan las revisiones de agente."
   }
  }
 },
 "enums": {
  "agentAssetKind": {
   "SystemPrompt": "Prompt de sistema",
   "Skill": "Habilidad",
   "ReferenceFile": "Archivo de referencia",
   "DocumentTemplate": "Plantilla de documento"
  },
  "runOutcome": {
   "AssetIntegrityFailed": "Falló la integridad del recurso"
  },
  "resourceType": {
   "AgentAsset": "Recurso de agente"
  }
 },
 "errorCodes": {
  "AssetInUse": "Hay revisiones de agente que todavía fijan este recurso. Quítelo de esas revisiones antes de eliminarlo.",
  "AssetKindImmutable": "El tipo de un recurso no puede cambiar después de crearlo. Cree un recurso nuevo.",
  "AssetStoreImmutable": "El almacén de artefactos de un recurso no puede cambiar después de crearlo. Cree un recurso nuevo.",
  "AssetTemplateRequired": "Los recursos de prompt de sistema necesitan una plantilla de prompt, y los demás tipos no pueden tenerla.",
  "AssetFileTooLarge": "Un archivo supera el tamaño que permite el ajuste Assets.MaxFileBytes.",
  "AssetVersionTooLarge": "Los archivos en conjunto superan el tamaño que permite el ajuste Assets.MaxVersionBytes.",
  "AssetTooManyFiles": "Esta subida tiene más archivos de los que permite el ajuste Assets.MaxFilesPerVersion.",
  "AssetHasNoFiles": "Los recursos de prompt de sistema no tienen archivos. Edite su plantilla de prompt."
 },
 "common": {
  "fieldCodes": {
   "InvalidAssetPath": "Use una ruta relativa con barras normales y sin segmentos \".\" ni \"..\", de 512 caracteres como máximo.",
   "MacroFormatRefused": "Se rechazan los archivos de Office con macros (Assets.AllowMacroFormats). Guarde el archivo como .docx o .dotx.",
   "AssetHasNoFiles": "Los recursos de prompt de sistema no tienen archivos. Edite su plantilla de prompt.",
   "AssetTemplateRequired": "Elija una plantilla de prompt para un recurso de prompt de sistema."
  },
  "serverText": {
   "assetInUse": "El recurso {{asset}} está fijado por revisiones de estos agentes: {{agents}}. Quítelo primero de esas revisiones.",
   "assetFileTooLarge": "El archivo {{path}} ocupa {{size}} bytes; el límite es {{limit}} bytes (Assets.MaxFileBytes).",
   "assetVersionTooLarge": "Esta versión supera los {{limit}} bytes (Assets.MaxVersionBytes).",
   "assetTooManyFiles": "Una versión contiene como máximo {{limit}} archivos (Assets.MaxFilesPerVersion); esta subida tiene {{count}}.",
   "assetHasNoFiles": "Los recursos de prompt de sistema no tienen archivos. Edite su plantilla de prompt."
  }
 },
 "resources": {
  "agentAssets": {
   "title": "Recursos",
   "subtitle": "Prompts de sistema, habilidades, archivos de referencia y plantillas de documento versionados que fijan las revisiones de agente.",
   "add": "Añadir recurso",
   "create": "Crear recurso",
   "edit": "Editar recurso",
   "view": "Detalles del recurso",
   "deleteTitle": "Eliminar recurso",
   "emptyTitle": "Todavía no hay recursos",
   "emptyBody": "Cree un recurso, suba sus archivos como una versión y fíjelo en una revisión de agente.",
   "columns": {
    "name": "Nombre",
    "kind": "Tipo",
    "currentVersion": "Versión actual",
    "description": "Descripción",
    "tags": "Etiquetas",
    "artifactStoreId": "Almacén",
    "id": "ID del recurso",
    "createdUtc": "Creado"
   },
   "fields": {
    "name": "Nombre",
    "kind": "Tipo",
    "promptTemplateId": "Plantilla de prompt",
    "artifactStoreId": "Almacén de artefactos",
    "description": "Descripción",
    "tags": "Etiquetas"
   },
   "hints": {
    "kind": "No se puede cambiar después de crearlo. Un recurso de prompt de sistema toma su texto de una plantilla de prompt; los demás tipos contienen archivos subidos.",
    "promptTemplateId": "La plantilla de prompt cuyo texto aporta este recurso como prompt de sistema del agente.",
    "artifactStoreId": "Dónde se guardan los archivos subidos. No se puede cambiar después de crearlo. Déjelo vacío para guardarlos en la base de datos de Garrison."
   },
   "errors": {
    "templateRequired": "Elija la plantilla de prompt que usa este recurso de prompt de sistema."
   },
   "version": "versión {{number}}",
   "noVersion": "Sin versiones",
   "databaseStore": "Base de datos de Garrison",
   "actions": {
    "versions": "Versiones"
   }
  }
 },
 "components": {
  "revisions": {
   "columns": {
    "assetPins": "Recursos"
   }
  },
  "assets": {
   "versionsTitle": "Versiones de {{name}}",
   "current": "Actual",
   "noVersions": "Este recurso todavía no tiene versiones. Suba sus archivos a continuación.",
   "systemPromptNotice": "Los recursos de prompt de sistema no tienen archivos. Su texto procede de su plantilla de prompt, así que edite la plantilla para cambiarlo.",
   "showFiles": "Archivos",
   "filesTitle": "Archivos de la versión {{number}}",
   "noFiles": "Esta versión no tiene archivos.",
   "preview": "Vista previa",
   "download": "Descargar",
   "previewTitle": "{{path}} (versión {{number}})",
   "emptyFile": "Este archivo está vacío.",
   "versionColumns": {
    "number": "Versión",
    "author": "Autor",
    "changeNote": "Nota de cambios",
    "totalBytes": "Tamaño total",
    "createdUtc": "Creada",
    "actions": "Acciones"
   },
   "fileColumns": {
    "path": "Ruta",
    "mediaType": "Tipo de medio",
    "sizeBytes": "Tamaño",
    "sha256": "Resumen SHA-256",
    "actions": "Acciones"
   },
   "uploadTitle": "Subir una versión nueva",
   "uploadHint": "Elija uno o varios archivos. Cada subida es una versión completa: los archivos que no incluya no se conservan de la versión actual.",
   "files": "Archivos",
   "uploadColumns": {
    "path": "Ruta en el recurso",
    "mediaType": "Tipo de medio",
    "size": "Tamaño",
    "actions": "Quitar"
   },
   "mediaTypeGuessed": "Según la extensión del archivo",
   "removeFile": "Quitar este archivo de la subida",
   "changeNote": "Nota de cambios",
   "changeNotePlaceholder": "Qué cambió en esta versión",
   "upload": "Subir versión",
   "uploading": "Subiendo...",
   "uploadCreated": "Se creó la versión {{number}}.",
   "uploadUnchanged": "Los archivos son iguales a los de la versión actual {{number}}, así que no se creó ninguna versión nueva.",
   "limitSetting": "El límite lo define el ajuste del servidor {{setting}}.",
   "duplicatePath": "Otro archivo de esta subida tiene la misma ruta.",
   "pinVersion": "{{name}} versión {{version}}",
   "pinCurrent": "{{name}} (actual)",
   "pinsTitle": "Recursos fijados",
   "pinsSave": "Guardar borrador",
   "pinsSaved": "Se guardaron los recursos fijados en la revisión en borrador {{number}}.",
   "pinsDraft": "Cambia los recursos fijados de la revisión en borrador {{number}}. El resto del borrador no cambia.",
   "pinsNewDraft": "No hay ningún borrador abierto. Al guardar se inicia un borrador nuevo a partir de la revisión publicada {{number}} con estos recursos fijados.",
   "pinsEmpty": "No hay recursos fijados.",
   "pinAsset": "Recurso",
   "pinVersionLabel": "Versión",
   "chooseAsset": "Elija un recurso",
   "assetOption": "{{name}} (tipo: {{kind}})",
   "followCurrent": "Versión actual",
   "removePin": "Quitar este recurso fijado",
   "addPin": "Añadir recurso",
   "editPins": "Recursos",
   "pinsNewDraftButton": "Fijar recursos en un borrador nuevo"
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
})(es, {
 "views": {
  "conversationDetail": {
   "tabsLabel": "Secciones de la conversación",
   "tabs": {
    "turns": "Turnos",
    "files": "Archivos"
   }
  },
  "runDetail": {
   "fileSpace": "Espacio de archivos",
   "openFiles": "Abrir archivos"
  }
 },
 "resources": {
  "deployments": {
   "fields": {
    "fileSpaceMountPath": "Carpeta del espacio de archivos"
   },
   "hints": {
    "fileSpaceMountPath": "Carpeta del espacio de trabajo de la ejecución que recibe los archivos compartidos de la conversación al empezar; sus cambios se escriben de vuelta al terminar. Valor predeterminado: files."
   }
  }
 },
 "errorCodes": {
  "InvalidFilePath": "Use una ruta relativa con barras normales y sin segmentos \".\" ni \"..\".",
  "FileTooLarge": "El archivo supera lo que permite el ajuste FileSpaces.MaxFileBytes.",
  "FileSpaceFull": "El espacio de archivos superaría el ajuste FileSpaces.MaxTotalBytes.",
  "TooManyFiles": "El espacio de archivos ya tiene tantos archivos como permite el ajuste FileSpaces.MaxFiles.",
  "StaleFileUpload": "La ejecución ya no tiene su concesión, así que sus cambios de archivos no se escribieron."
 },
 "common": {
  "fieldCodes": {
   "InvalidFilePath": "Use una ruta relativa con barras normales y sin segmentos \".\" ni \"..\"."
  },
  "serverText": {
   "fileSpaceFileTooLarge": "El archivo {{path}} ocupa {{size}} bytes; el límite es {{limit}} bytes (FileSpaces.MaxFileBytes).",
   "fileSpaceFull": "El espacio de archivos ocuparía más de {{limit}} bytes (FileSpaces.MaxTotalBytes).",
   "fileSpaceTooManyFiles": "El espacio de archivos ya tiene {{count}} archivos (FileSpaces.MaxFiles).",
   "fileNotFound": "No se encontró el archivo {{path}}."
  }
 },
 "components": {
  "files": {
   "title": "Archivos",
   "summary": "Archivos compartidos: {{count}} ({{size}})",
   "live": "En vivo",
   "polling": "Consulta periódica",
   "includeDeleted": "Mostrar archivos eliminados",
   "refresh": "Actualizar",
   "spaceId": "Espacio de archivos {{id}}",
   "emptyTitle": "Todavía no hay archivos",
   "emptyBody": "Aquí aparecen los archivos que los turnos escriben en la carpeta compartida o que usted sube abajo.",
   "emptyBodyDeleted": "No se ha escrito nada en la carpeta compartida de esta conversación, ni siquiera un archivo eliminado después.",
   "columns": {
    "path": "Ruta",
    "currentVersion": "Versión",
    "sizeBytes": "Tamaño",
    "mediaType": "Tipo de medio",
    "lastUpdateUtc": "Actualizado",
    "actions": "Acciones"
   },
   "deleted": "Eliminado",
   "version": "versión {{number}}",
   "versions": "Versiones",
   "download": "Descargar",
   "deleteLabel": "Eliminar {{path}}",
   "deletedToast": "Se eliminó {{path}}. Sus versiones se conservan.",
   "deleteTitle": "Eliminar archivo",
   "confirmDelete": "¿Eliminar {{path}} de los archivos compartidos? Los turnos siguientes no lo verán. Sus versiones se conservan y se pueden seguir descargando.",
   "versionsTitle": "Versiones de {{path}}",
   "noVersions": "Este archivo no tiene versiones.",
   "current": "Actual",
   "versionColumns": {
    "number": "Versión",
    "sizeBytes": "Tamaño",
    "mediaType": "Tipo de medio",
    "sha256": "Resumen SHA-256",
    "writtenBy": "Escrito por",
    "createdUtc": "Escrito",
    "actions": "Acciones"
   },
   "preview": "Vista previa",
   "previewTitle": "{{path}} (versión {{number}})",
   "emptyFile": "Esta versión está vacía.",
   "uploadTitle": "Subir archivos",
   "uploadHint": "Elija uno o más archivos y revise sus rutas. Una ruta que coincide con un archivo de la lista añade una versión nueva de ese archivo. Si un turno lo cambió después de cargar la lista, la subida se guarda a su lado con un nombre de conflicto en lugar de reemplazarlo.",
   "uploadCreated": "Se añadió {{path}} como versión {{version}}.",
   "uploadReplaced": "Se guardó {{path}} como versión {{version}}.",
   "uploadConflict": "{{requested}} cambió después de cargar la lista, así que la subida se guardó como {{path}}. Compare los dos archivos y elimine el que no necesite.",
   "chooseFiles": "Archivos para subir",
   "uploadColumns": {
    "path": "Ruta en la carpeta compartida",
    "replaces": "Reemplaza",
    "size": "Tamaño",
    "actions": "Quitar"
   },
   "replacesVersion": "Versión {{version}}",
   "newFile": "Archivo nuevo",
   "removeFile": "Quitar este archivo de la subida",
   "upload": "Subir",
   "uploading": "Subiendo...",
   "limitSetting": "El límite lo define el ajuste del servidor {{setting}}."
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
})(es, {
 "nav": {
  "items": {
   "capabilities": {
    "label": "Capacidades",
    "tip": "El catálogo de capacidades: agentes, herramientas MCP e integrados del harness que los agentes orquestadores pueden encontrar y usar, con indicaciones de coste y latencia."
   }
  }
 },
 "enums": {
  "capabilityKind": {
   "Agent": "Agente",
   "McpTool": "Herramienta MCP",
   "HarnessBuiltIn": "Integrado del harness"
  },
  "capabilityOrigin": {
   "Derived": "Derivada",
   "Manual": "Manual"
  },
  "capabilityHintStatus": {
   "Unknown": "Desconocido",
   "Known": "Conocido"
  },
  "runBlockedReason": {
   "NoToolWorker": "Ningún nodo de trabajo con la herramienta"
  },
  "resourceType": {
   "ConversationFileSpace": "Espacio de archivos de conversación",
   "Capability": "Capacidad"
  }
 },
 "errorCodes": {
  "InvalidJsonSchema": "Un esquema no es un JSON Schema válido. Corrige el esquema de entrada o de salida y vuelve a guardar.",
  "NameConflict": "Otra capacidad manual ya usa este nombre. Elige un nombre distinto.",
  "CapabilityDerived": "Esta capacidad se deriva de su origen y lo sigue, así que no se puede editar ni eliminar aquí. Cambia el origen.",
  "InvalidTags": "Usa como máximo 32 etiquetas, de 1 a 64 caracteres cada una.",
  "TooManyRequirements": "Usa como máximo 16 requisitos de etiqueta de nodo."
 },
 "common": {
  "fieldCodes": {
   "InvalidJsonSchema": "No es un JSON Schema válido.",
   "InvalidTags": "Usa como máximo 32 etiquetas, de 1 a 64 caracteres cada una.",
   "TooManyRequirements": "Usa como máximo 16 requisitos de etiqueta de nodo."
  },
  "serverText": {
   "capabilityDerivedEdit": "La capacidad {{name}} se deriva de su origen y lo sigue. Cambia el origen.",
   "capabilityDerivedDelete": "La capacidad {{name}} se deriva de su origen y desaparece con él, así que no se puede eliminar directamente.",
   "capabilityShared": "La capacidad {{name}} la comparten todos los inquilinos y viene de un perfil de harness integrado, así que no se puede cambiar.",
   "capabilityNameConflict": "Ya existe una capacidad manual llamada {{name}}.",
   "capabilitySecretsDenied": "No tienes permiso para usar los secretos que envía el servidor MCP {{server}}, así que no se listaron sus herramientas.",
   "capabilityNoStdioWorker": "Ningún nodo de trabajo listo tiene activados los diagnósticos MCP de stdio (GARRISON_WORKER_MCP_TESTS_ENABLED), así que no se pudieron listar las herramientas del servidor stdio.",
   "capabilityRefreshFailed": "La actualización falló el {{when}}: {{error}}",
   "capabilityMissingTools": "Faltan herramientas necesarias: {{tools}}.",
   "capabilityProbeShadowed": "Los nodos de trabajo sondean {{name}} como {{probe}}, que otro perfil de harness definió antes. La definición de este perfil no se sondea."
  }
 },
 "components": {
  "blocked": {
   "reasons": {
    "NoToolWorker": "El agente de esta ejecución usa {{tools}} y ningún nodo de trabajo listo capaz de ejecutar {{harness}} la informa. Instala la herramienta en el host de un nodo de trabajo para que su sonda informe la etiqueta de nodo garrison.io/tool-{name}=true, o añade esa etiqueta a mano a un nodo de trabajo."
   }
  },
  "revisions": {
   "columns": {
    "capabilities": "Capacidades"
   }
  },
  "capabilities": {
   "noSource": "Entrada manual",
   "shared": "Compartida",
   "hintsLine": "Mediana {{median}}, p90 {{p90}}, {{cost}} por ejecución",
   "hintsLineNoCost": "Mediana {{median}}, p90 {{p90}}, sin coste registrado",
   "hintsTitle": "Indicaciones de coste y latencia",
   "noCost": "Sin coste registrado",
   "windowDays_one": "{{count}} día",
   "windowDays_other": "{{count}} días",
   "refreshWarning": "Falló la última actualización del origen de esta entrada.",
   "requirementsTitle": "Etiquetas de nodo que necesita una ejecución",
   "noRequirements": "Ninguna. Las ejecuciones que usan esta capacidad pueden ir a cualquier nodo de trabajo.",
   "noSchema": "Sin esquema",
   "fields": {
    "kind": "Tipo",
    "origin": "Origen",
    "source": "Fuente",
    "lastRefreshedUtc": "Última actualización",
    "tags": "Etiquetas",
    "id": "Identificador",
    "summary": "Resumen",
    "hintStatus": "Estado",
    "sampleSize": "Ejecuciones resumidas",
    "medianDurationMs": "Duración mediana",
    "p90DurationMs": "Duración p90",
    "meanCostUsd": "Coste medio",
    "windowDays": "Ventana",
    "computedUtc": "Calculado",
    "inputSchemaJson": "Esquema de entrada",
    "outputSchemaJson": "Esquema de salida"
   },
   "refreshTitle": "Actualizar el catálogo de capacidades",
   "refreshHint": "Garrison vuelve a derivar las entradas de agentes y de integrados del harness, lista las herramientas de cada servidor MCP (los servidores stdio, a través de un nodo de trabajo con los diagnósticos de stdio activados) y recalcula las indicaciones de los agentes. Para listar un servidor se le envían los secretos que nombran sus plantillas, así que necesitas permiso para usarlos.",
   "refreshServer": "Servidores MCP que listar",
   "refreshAll": "Todos los servidores MCP activos",
   "refreshRun": "Actualizar ahora",
   "refreshing": "Actualizando...",
   "refreshDone": "El catálogo de capacidades está al día.",
   "refreshPartial_one": "El catálogo se actualizó, pero no se pudo listar {{count}} servidor MCP.",
   "refreshPartial_other": "El catálogo se actualizó, pero no se pudieron listar {{count}} servidores MCP.",
   "refresh": {
    "agents": "Entradas de agente cambiadas",
    "harnessBuiltIns": "Entradas de integrados cambiadas",
    "hints": "Indicaciones recalculadas",
    "servers": "Servidores MCP listados",
    "tools": "Entradas de herramienta escritas",
    "removed": "Entradas de herramienta eliminadas",
    "failed": "Servidores que fallaron",
    "noServers": "No se listó ningún servidor MCP.",
    "failedBadge": "Fallido",
    "listedBadge": "Listado",
    "columns": {
     "server": "Servidor MCP",
     "status": "Resultado",
     "tools": "Herramientas",
     "removed": "Eliminadas",
     "warned": "Conservadas con una advertencia",
     "error": "Error"
    }
   },
   "errors": {
    "nameLength": "Usa de 1 a {{max}} caracteres.",
    "summaryLength": "Usa como máximo {{max}} caracteres.",
    "tags": "Usa como máximo {{max}} etiquetas, de 1 a {{length}} caracteres cada una.",
    "requirementCount": "Usa como máximo {{max}} requisitos de etiqueta de nodo.",
    "requirement": "Cada requisito necesita una clave de etiqueta de nodo de 1 a {{max}} caracteres.",
    "toolNeedsServer": "Elige el servidor MCP al que pertenece la herramienta.",
    "probeCount": "Un perfil de harness tiene como máximo {{max}} sondas de herramientas.",
    "probeName": "El nombre de la herramienta tiene de 1 a 63 letras minúsculas, dígitos, puntos y guiones, y empieza por una letra o un dígito.",
    "probeDuplicate": "Otra sonda de este perfil se llama {{name}}.",
    "probeExecutable": "El ejecutable es un nombre de archivo simple que se encuentra en el PATH (letras, dígitos, puntos, guiones bajos, signos más y guiones), sin carpeta.",
    "probeArgument": "No elijas ningún argumento o elige uno de {{allowed}}.",
    "probeDescription": "Usa como máximo {{max}} caracteres."
   },
   "draftTitle": "Capacidades",
   "draftSave": "Guardar borrador",
   "draftSaved": "Se guardaron las capacidades en la revisión en borrador {{number}}.",
   "draftEdit": "Cambia las capacidades de la revisión en borrador {{number}}. El resto del borrador queda como está.",
   "draftNew": "No hay ningún borrador abierto. Al guardar se inicia un borrador nuevo a partir de la revisión publicada {{number}} con estas capacidades.",
   "draftPlacementHint": "Un integrado del harness indicado aquí añade su etiqueta de nodo a las ejecuciones de este agente, así que solo van a nodos de trabajo que informaron la herramienta.",
   "draftEmpty": "Esta revisión no usa ninguna capacidad.",
   "notInCatalog": "No está en el catálogo",
   "removeName": "Quitar {{name}}",
   "chooseName": "Elige una capacidad",
   "nameOption": "{{name}} ({{kinds}})",
   "addName": "Añadir capacidad",
   "newDraftButton": "Elegir capacidades en un borrador nuevo",
   "editDraft": "Capacidades"
  }
 },
 "resources": {
  "capabilities": {
   "title": "Capacidades",
   "subtitle": "Agentes, herramientas MCP e integrados del harness que los agentes orquestadores pueden encontrar y usar, con indicaciones de coste y latencia.",
   "add": "Añadir capacidad",
   "create": "Crear capacidad",
   "edit": "Editar capacidad",
   "view": "Detalles de la capacidad",
   "deleteTitle": "Eliminar capacidad",
   "emptyTitle": "Todavía no hay capacidades",
   "emptyBody": "Publica una revisión de agente, registra un servidor MCP o añade una sonda de herramienta a un perfil de harness y luego actualiza. También puedes añadir una entrada manual.",
   "columns": {
    "name": "Nombre",
    "kind": "Tipo",
    "origin": "Origen",
    "summary": "Resumen",
    "source": "Fuente",
    "hints": "Indicaciones",
    "tags": "Etiquetas",
    "lastRefreshedUtc": "Última actualización",
    "id": "Identificador",
    "createdUtc": "Creada"
   },
   "fields": {
    "name": "Nombre",
    "kind": "Tipo",
    "summary": "Resumen",
    "sourceAgentId": "Agente al que representa",
    "sourceMcpServerId": "Servidor MCP al que pertenece",
    "sourceToolName": "Nombre de la herramienta en ese servidor",
    "tags": "Etiquetas",
    "requirements": "Etiquetas de nodo que necesita una ejecución",
    "inputSchemaJson": "Esquema de entrada",
    "outputSchemaJson": "Esquema de salida"
   },
   "hints": {
    "kind": "Las entradas manuales pueden ser de cualquier tipo, por ejemplo un servicio de conversión al que los agentes llegan mediante una skill.",
    "requirements": "Una ejecución de un agente que usa esta capacidad solo va a nodos de trabajo que tengan todas estas etiquetas de nodo.",
    "sourceMcpServerId": "Opcional. Un token de ejecución solo ve una entrada que nombra un servidor cuando su despliegue vincula ese servidor.",
    "inputSchemaJson": "Un JSON Schema, por ejemplo {\"type\": \"object\"}. Déjalo vacío si la capacidad recibe texto libre."
   },
   "tagFilter": "Etiqueta",
   "refresh": "Actualizar",
   "warningBadge": "Actualización fallida",
   "warnings_one": "{{count}} entrada conservó su último contenido válido porque falló la última actualización de su origen. Ábrela para ver el motivo.",
   "warnings_other": "{{count}} entradas conservaron su último contenido válido porque falló la última actualización de su origen. Abre una para ver el motivo.",
   "noSourceOption": "Ninguno",
   "requirementKey": "Etiqueta de nodo",
   "requirementValue": "Valor"
  },
  "harnessProfiles": {
   "fields": {
    "toolProbes": "Sondas de herramientas",
    "probeName": "Nombre de la herramienta",
    "probeExecutable": "Ejecutable",
    "probeArgument": "Argumento",
    "probeDescription": "Descripción"
   },
   "columns": {
    "toolProbes": "Sondas de herramientas"
   },
   "hints": {
    "toolProbes": "Herramientas que este harness puede usar cuando el host del nodo de trabajo las tiene. Los nodos de trabajo ejecutan cada sonda antes de registrarse e informan las herramientas que responden como etiquetas de nodo garrison.io/tool-{name}=true."
   },
   "addToolProbe": "Añadir sonda de herramienta",
   "probeNoArgument": "Sin argumento"
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
})(es, {
 "enums": {
  "fanOutGroupStatus": {
   "Running": "En ejecución",
   "Joined": "Reunido",
   "TimedOut": "Tiempo agotado",
   "BudgetExceeded": "Presupuesto superado",
   "Cancelled": "Cancelado"
  },
  "fanOutJoinPolicy": {
   "All": "Todos",
   "Any": "Cualquiera",
   "Quorum": "Quórum"
  },
  "resourceType": {
   "FanOutGroup": "Grupo de fan-out"
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "Grupo de fan-out"
  }
 },
 "components": {
  "fanOut": {
   "group": "Grupo de fan-out",
   "groupTitle": "Grupo de fan-out {{id}}",
   "otherChildren": "Otras ejecuciones secundarias",
   "detailsUnavailable": "No se pudieron cargar los detalles del grupo, así que solo se muestran sus ejecuciones miembro.",
   "policy": "Política de reunión",
   "quorumPolicy": "{{policy}}: {{quorum}} de {{total}}",
   "progress": "Progreso",
   "progressValue": "{{finished}} de {{total}} terminados, {{succeeded}} con éxito",
   "cost": "Costo",
   "tokens": "Tokens",
   "usedOf": "{{used}} de {{limit}}",
   "noLimit": "{{used}} (sin límite)",
   "deadline": "Plazo",
   "noDeadline": "Ninguno",
   "started": "Inicio",
   "completed": "Fin",
   "pending": "Aún en ejecución: {{labels}}",
   "failed": "Sin éxito: {{labels}}",
   "live": "En vivo",
   "polling": "Consulta periódica",
   "cancel": "Cancelar grupo",
   "cancelTitle": "Cancelar grupo de fan-out",
   "confirmCancel": "¿Cancelar el grupo de fan-out {{id}}? Los miembros que siguen en ejecución se cancelan y la ejecución principal verá el grupo como cancelado.",
   "cancelledToast": "Se canceló el grupo de fan-out {{id}}.",
   "columns": {
    "label": "Etiqueta",
    "agent": "Agente",
    "status": "Estado",
    "costUsd": "Costo",
    "tokens": "Tokens",
    "run": "Ejecución"
   }
  }
 },
 "common": {
  "serverText": {
   "fanOutParentEnded": "La ejecución principal terminó o se canceló.",
   "fanOutCostExceeded": "Los miembros gastaron {{cost}} USD, por encima del presupuesto de {{budget}} USD.",
   "fanOutTokensExceeded": "Los miembros usaron {{tokens}} tokens, por encima del presupuesto de {{budget}}.",
   "fanOutTimedOut": "Se agotó el tiempo límite del grupo de {{seconds}} segundos con {{running}} miembros aún en ejecución.",
   "fanOutAnySucceeded": "Un miembro tuvo éxito.",
   "fanOutNoneSucceeded": "Todos los miembros terminaron y ninguno tuvo éxito.",
   "fanOutQuorumMet": "{{succeeded}} miembros tuvieron éxito y se alcanzó el quórum de {{quorum}}.",
   "fanOutQuorumUnreachable": "Fallaron demasiados miembros para alcanzar el quórum de {{quorum}}.",
   "fanOutAllFinished": "Todos los miembros terminaron.",
   "fanOutCancelledByTool": "La ejecución principal lo canceló con garrison_cancel_fan_out.",
   "fanOutCancelledBy": "Cancelado por {{who}}."
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
})(es, {
 "nav": {
  "items": {
   "apps": {
    "label": "Aplicaciones",
    "tip": "Aplicaciones agénticas: grupos de agentes tras una sola interfaz de chat para usuarios finales, con su grafo de llamadas, delegación, revisiones y URL para compartir."
   }
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "Usuarios del inquilino",
   "AppUsers": "Usuarios de la aplicación",
   "Anonymous": "Anónimo"
  },
  "resourceType": {
   "AgenticApp": "Aplicación agéntica"
  }
 },
 "errorCodes": {
  "AppSlugTaken": "Otra aplicación ya usa este slug de URL. Los slugs son únicos en todo el clúster, así que elige otro.",
  "NoPublishedRevision": "No hay ninguna revisión publicada que usar. Publica una primero.",
  "AgentInUse": "Este agente es miembro de una aplicación agéntica. Quítalo antes de la aplicación."
 },
 "common": {
  "fieldCodes": {
   "InvalidName": "Usa de 1 a 64 letras minúsculas, dígitos y guiones, empezando y terminando con una letra o un dígito.",
   "InvalidSlug": "Usa de 2 a 63 letras minúsculas, dígitos y guiones, empezando con una letra o un dígito.",
   "UnknownAgent": "No existe ese agente en este inquilino.",
   "DuplicateMember": "Cada agente puede ser miembro una sola vez.",
   "EntryNotMember": "El agente de entrada debe ser uno de los miembros.",
   "EdgeNotMember": "Los dos extremos de una llamada deben ser miembros de la aplicación.",
   "SelfEdge": "Un miembro no puede llamarse a sí mismo.",
   "AppGraphCycle": "Las llamadas entre miembros forman un ciclo. Quita una de las llamadas del bucle.",
   "UnreachableMember": "Todos los miembros deben ser alcanzables desde el agente de entrada a través de llamadas.",
   "UnreachableMemberNamed": "El agente de entrada no puede alcanzar estos miembros a través de llamadas: {{names}}. Añade una llamada a cada uno de ellos o quítalos.",
   "UnknownEnvironment": "Este entorno no existe en el inquilino.",
   "InvalidEntryDeployment": "Elige un despliegue del agente de entrada en este entorno.",
   "DuplicateEnvironment": "Indica cada entorno una sola vez.",
   "InvalidColor": "Usa un color con el formato #RRGGBB, por ejemplo #1F6FEB.",
   "UnknownAsset": "No existe ese recurso de agente en este inquilino.",
   "Required": "Este campo es obligatorio.",
   "TooMany": "Aquí hay demasiados elementos."
  },
  "serverText": {
   "appNameConflict": "Ya existe una aplicación llamada {{name}}.",
   "appSlugTaken": "El slug de URL {{slug}} ya está en uso. Los slugs son únicos en todo el clúster, así que elige otro.",
   "appNoPublishedRevision": "La aplicación {{name}} no tiene ninguna revisión publicada que promover.",
   "appMemberNotPublished": "El miembro {{name}} no tiene ninguna revisión publicada que fijar. Publica una primero.",
   "appRevisionPublished": "La revisión {{number}} de la aplicación {{name}} ya está publicada.",
   "appNoTargetDeployments": "El miembro {{member}} no tiene ningún despliegue en el entorno {{environment}}. Crea uno allí primero. No se promovió nada.",
   "agentInApps": "El agente {{agent}} es miembro de {{apps}}. Quítalo antes de la aplicación."
  }
 },
 "components": {
  "form": {
   "pickColor": "Elige un color para {{field}}"
  },
  "apps": {
   "graph": {
    "empty": "Añade miembros para ver el grafo de la aplicación.",
    "summary": "Grafo de la aplicación con {{members}} miembros y {{edges}} llamadas",
    "edgeFanOut": "{{caller}} llama a {{callee}}, también varias veces a la vez",
    "edgeSingle": "{{caller}} llama a {{callee}}, una llamada cada vez",
    "entryNode": "{{name}}, el agente de entrada",
    "unreachableNode": "{{name}}, que el agente de entrada no puede alcanzar",
    "entry": "agente de entrada",
    "unreachable": "no alcanzable",
    "legendFanOut": "Llamadas en paralelo permitidas",
    "legendSingle": "Una llamada cada vez"
   },
   "share": {
    "noSlug": "Da a la aplicación un nombre o un slug de URL para obtener su enlace.",
    "open": "Abrir",
    "copy": "Copiar la URL de la aplicación",
    "inactive": "La aplicación está inactiva, así que el enlace no funciona hasta que la vuelvas a activar.",
    "signIn": {
     "TenantUsers": "Cualquier usuario activo de este inquilino puede iniciar sesión.",
     "AppUsers": "Solo pueden iniciar sesión los usuarios que tienen el rol AppUser en esta aplicación.",
     "Anonymous": "Cualquiera con el enlace puede usar la aplicación sin iniciar sesión. Los usuarios con sesión iniciada también pueden usarla.",
     "AnonymousDisabled": "Se eligió Anónimo pero no está activado, así que nadie entra sin iniciar sesión y solo pueden iniciar sesión los usuarios del inquilino con acceso."
    }
   },
   "delegation": {
    "title": "Delegación a partir del grafo de la aplicación",
    "intro": "Las llamadas de la aplicación son su política de delegación. Cada miembro debe permitir exactamente los miembros a los que llama, con una profundidad máxima que cubra la cadena más larga por debajo de él. Los miembros cuya revisión publicada dice otra cosa están desviados.",
    "apply": "Escribir borradores",
    "applying": "Escribiendo borradores...",
    "applied": "Se escribieron {{drafts}} revisiones en borrador; se omitieron {{skipped}} miembros.",
    "appliedSummary": "Se escribieron {{drafts}} revisiones en borrador y no se publicó nada. Se omitieron {{skipped}} miembros. Revisa y publica los borradores en la pestaña Revisiones de cada agente.",
    "drifting_one": "La delegación publicada de {{count}} miembro difiere del grafo.",
    "drifting_other": "La delegación publicada de {{count}} miembros difiere del grafo.",
    "inSync": "La delegación publicada de todos los miembros coincide con el grafo.",
    "empty": "Esta aplicación no tiene miembros.",
    "notPublished": "Sin publicar",
    "drift": "Desviación",
    "inSyncBadge": "Sincronizado",
    "draftConflict": "Conflicto de borrador",
    "draft": "Borrador {{number}}",
    "review": "Los borradores aún no están en vigor. Abre cada agente, revisa el borrador en su pestaña Revisiones y publícalo.",
    "columns": {
     "member": "Miembro",
     "desiredMode": "Modo del grafo",
     "desiredAllowList": "Lista de permitidos del grafo",
     "desiredMaxDepth": "Profundidad del grafo",
     "publishedMode": "Modo publicado",
     "publishedAllowList": "Lista de permitidos publicada",
     "publishedMaxDepth": "Profundidad publicada",
     "status": "Estado"
    }
   },
   "revisions": {
    "title": "Revisiones de la aplicación",
    "intro": "Una revisión de la aplicación fija la última revisión publicada de cada miembro y copia las llamadas entre ellos. Publícala y luego promuévela para llevar todos los miembros juntos al siguiente entorno.",
    "changeNote": "Nota del cambio",
    "changeNotePlaceholder": "Qué cambió desde la última revisión",
    "take": "Crear revisión",
    "taking": "Creando...",
    "taken": "Se creó la revisión {{number}} de la aplicación.",
    "published": "Se publicó la revisión {{number}} de la aplicación.",
    "empty": "Aún no hay revisiones de la aplicación. Crea una cuando todos los miembros tengan una revisión publicada.",
    "promote": "Promover",
    "publish": "Publicar",
    "publishTitle": "Publicar la revisión {{number}} de la aplicación",
    "publishConfirm": "¿Publicar la revisión {{number}} de {{name}}? Una revisión publicada no puede cambiar y pasa a ser la que usan las promociones de forma predeterminada.",
    "pin": "{{name}}, revisión {{number}}",
    "columns": {
     "number": "Revisión",
     "state": "Estado",
     "members": "Miembros fijados",
     "edges": "Llamadas",
     "author": "Autor",
     "changeNote": "Nota del cambio",
     "publishedUtc": "Publicada",
     "actions": "Acciones"
    }
   },
   "promote": {
    "title": "Promover la aplicación",
    "intro": "La revisión fijada de cada miembro pasa a todos los despliegues de ese miembro en el entorno de destino, en un solo paso. Si un miembro no tiene ningún despliegue allí, no se mueve nada.",
    "revision": "Revisión de la aplicación",
    "latestRevision": "Última publicada",
    "promoted": "Se promovió la aplicación a {{target}}: {{deployments}} despliegues actualizados.",
    "denied": "No puedes promover a {{target}}. Para promover hace falta Ejecutar sobre Promoción en el entorno de destino."
   }
  }
 },
 "resources": {
  "apps": {
   "title": "Aplicaciones",
   "subtitle": "Grupos de agentes tras una sola interfaz de chat para usuarios finales. El agente de entrada habla con las personas y llama a los demás miembros según las llamadas de la aplicación.",
   "add": "Añadir aplicación",
   "create": "Crear aplicación",
   "edit": "Editar aplicación",
   "view": "Detalles de la aplicación",
   "deleteTitle": "Eliminar aplicación",
   "emptyTitle": "Aún no hay aplicaciones",
   "emptyBody": "Crea una aplicación con agentes que ya tienes: elige los miembros, el agente de entrada que habla con las personas y quién llama a quién.",
   "columns": {
    "name": "Nombre",
    "url": "URL de la aplicación",
    "entryAgentId": "Agente de entrada",
    "members": "Miembros",
    "liveEnvironment": "Entorno en uso",
    "authMode": "Inicio de sesión",
    "active": "Estado",
    "description": "Descripción",
    "id": "ID",
    "lastUpdateUtc": "Actualizada",
    "createdUtc": "Creada"
   },
   "fields": {
    "name": "Nombre",
    "slug": "Slug de URL",
    "description": "Descripción",
    "active": "Activa",
    "members": "Miembros",
    "membersItems": {
     "agentId": "Agente",
     "role": "Rol"
    },
    "entryAgentId": "Agente de entrada",
    "edges": "Llamadas entre miembros",
    "edgesItems": {
     "callerAgentId": "Llamante",
     "calleeAgentId": "Llamado",
     "fanOutAllowed": "Llamadas en paralelo permitidas"
    },
    "graph": "Grafo",
    "environments": "Despliegue de entrada por entorno",
    "environmentsItems": {
     "environment": "Entorno",
     "deploymentId": "Despliegue de entrada"
    },
    "liveEnvironment": "Entorno en uso",
    "authMode": "Quién puede usar la aplicación",
    "anonymousEnabled": "Permitir uso anónimo",
    "showOperatorDetail": "Mostrar llamadas a herramientas y razonamiento a los usuarios finales",
    "share": "Enlace para compartir",
    "displayName": "Nombre visible",
    "logoAssetId": "Logotipo",
    "primaryColor": "Color principal",
    "accentColor": "Color de acento",
    "welcomeText": "Texto de bienvenida"
   },
   "hints": {
    "slug": "La aplicación está en /apps/{slug}/. Déjalo vacío para usar el nombre. Los slugs son únicos en todo el clúster.",
    "members": "Los agentes de la aplicación. El rol es una nota breve sobre lo que hace cada uno.",
    "entryAgentId": "El miembro que habla con los usuarios finales. Todos los demás miembros deben ser alcanzables desde él.",
    "edges": "Quién puede llamar a quién. Las llamadas no deben formar un bucle y se convierten en la política de delegación de cada miembro.",
    "environments": "El despliegue del agente de entrada que usa la aplicación en cada entorno. Sin uno, la aplicación usa allí el primer despliegue activo del agente de entrada, por orden de nombre.",
    "liveEnvironment": "El entorno con el que habla la interfaz de la aplicación.",
    "anonymousEnabled": "Necesario para el inicio de sesión Anónimo. Las sesiones anónimas son cortas y tienen límite de frecuencia.",
    "showOperatorDetail": "Los usuarios finales siempre ven respuestas, resultados y errores. Actívalo para mostrar también las llamadas a herramientas, el razonamiento y el progreso.",
    "logoAssetId": "La primera imagen de la versión actual del recurso.",
    "welcomeText": "Se muestra a los usuarios finales antes de que envíen su primer mensaje."
   },
   "steps": {
    "general": "Aplicación",
    "members": "Miembros y llamadas",
    "environments": "Entornos",
    "access": "Inicio de sesión y enlace",
    "branding": "Imagen de marca"
   },
   "actions": {
    "delegation": "Delegación",
    "revisions": "Revisiones y promoción"
   },
   "errors": {
    "nameTaken": "Otra aplicación de este inquilino ya usa este nombre."
   },
   "addMember": "Añadir miembro",
   "addEdge": "Añadir llamada",
   "addEnvironment": "Añadir entorno",
   "chooseAgent": "Elige un agente",
   "chooseEntry": "Elige un miembro",
   "rolePlaceholder": "Qué hace este miembro",
   "noEntryDeployment": "Primer despliegue activo",
   "noLogo": "Sin logotipo",
   "displayNamePlaceholder": "Se muestra en el encabezado de la aplicación"
  }
 }
});
