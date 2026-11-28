// Spanish tooltip (tips.*) and relationship explainer (explainers.*) text. Merged into es.js. Mirrors en.tips.js key for key.

const TELEMETRY = {
  approvalWaitMs: 'Espera de aprobación: tiempo total que esta ejecución pasó esperando aprobaciones de permisos que decidió una persona o un tiempo de espera. Las llamadas que una regla o el valor predeterminado del despliegue deciden al instante no suman nada. Lo mide el servidor; n/d cuando la ejecución nunca esperó.',
  delegationWaitMs: 'Espera por delegación: cuánto esperó esta ejecución a las ejecuciones hijas que inició mediante Garrison (otros agentes a los que delegó), según las marcas de tiempo del servidor de esas ejecuciones. Cero o n/d si la ejecución no delegó nada.',
  timeToFirstTokenExcludingDelegationMs: 'Tiempo hasta el primer token sin delegación: el tiempo hasta el primer token menos el tiempo que la ejecución esperó a las ejecuciones que delegó antes de su primera salida. Úsalo para comparar agentes que delegan con agentes que no lo hacen. Se mide con marcas de tiempo del servidor y nunca es negativo.',
  timeToFirstTokenMs: 'Tiempo hasta el primer token: desde que el nodo de trabajo inicia el proceso del harness hasta que el modelo produce su primera salida (texto o razonamiento). Incluye el arranque del harness, así que un inicio lento de la CLI se refleja aquí. Se mide en el nodo de trabajo con un reloj monotónico.',
  streamingMs: 'Tiempo de transmisión: desde la primera salida del modelo hasta la última. Es el tiempo durante el que el modelo estuvo realmente produciendo salida. Se mide en el nodo de trabajo con un reloj monotónico.',
  executionMs: 'Tiempo de ejecución: desde el inicio del proceso del harness hasta su salida, según lo mide el nodo de trabajo. Los servidores antiguos que no lo informan usan en su lugar las marcas de tiempo de inicio y finalización.',
  queueMs: 'Tiempo en cola: cuánto esperó la ejecución entre entrar en la cola y ser concedida a un nodo de trabajo. Valores altos indican que todos los nodos aptos estaban ocupados o que ninguno cumplía las reglas de ubicación. Lo mide el servidor.',
  totalMs: 'Tiempo total: desde que entra en la cola hasta que se completa, es decir, tiempo en cola más ejecución más envío del resultado. Lo mide el servidor.',
  outputTokensPerSecond: 'Tokens de salida por segundo: tokens de salida divididos entre el tiempo de transmisión. Solo se muestra cuando la transmisión duró al menos 100 ms, porque en ventanas más cortas la tasa no tiene sentido.',
  inputTokens: 'Tokens de entrada que el harness informó para toda la ejecución, incluidos el prompt del sistema, los resultados de herramientas y el historial de la conversación en todos los turnos.',
  outputTokens: 'Tokens de salida que el modelo generó en todos los turnos de la ejecución, según el analizador del harness.',
  cachedTokens: 'Tokens de entrada servidos desde la caché de prompts del proveedor. Los tokens en caché suelen facturarse a una tarifa menor, así que una proporción alta aquí reduce el coste.',
  reasoningTokens: 'Tokens de razonamiento, cuando el harness los informa por separado (por ejemplo, la salida de razonamiento de Codex). Es cero cuando el harness no los desglosa.',
  toolCallCount: 'Número de eventos de llamada a herramientas en la ejecución: herramientas MCP, herramientas integradas del harness y llamadas a otros agentes de Garrison. El nodo de trabajo los cuenta a partir del flujo de eventos.',
  costUsd: 'Coste en dólares estadounidenses según lo informa el harness. Se marca como estimado cuando Garrison lo calculó a partir del recuento de tokens en lugar de recibirlo del harness.',
  firstTokenUtc: 'Hora real (UTC, mostrada en tu zona horaria) del primer evento de salida del modelo en la ejecución.',
  lastTokenUtc: 'Hora real (UTC, mostrada en tu zona horaria) del último evento de salida del modelo en la ejecución.'
};

const FILE_ITEMS = {
  baseDirectory: 'Directorio respecto al cual se interpreta la ruta: el directorio de configuración de la ejecución, el espacio de trabajo o el directorio HOME de la ejecución.',
  pathTemplate: 'Ruta relativa del archivo que se escribe antes del lanzamiento. Se permiten plantillas, por ejemplo settings/{{run.id}}.json.',
  contentTemplate: 'Plantilla que se renderiza como contenido del archivo. Puede hacer referencia a variables y a secretos vinculados con {{secret.alias}}.',
  condition: 'Expresión de plantilla; cuando se renderiza vacía o como false, el archivo no se escribe.',
  mode: 'Modo de archivo Unix en octal, por ejemplo 0600 para archivos que contienen credenciales.',
  isSecret: 'Trata el contenido renderizado como secreto: nunca se escribe en los registros y se oculta en las vistas previas de compilación.'
};

const tips = {
  fieldWarnings: { dismiss: 'Oculta este aviso. El registro ya está guardado con los valores indicados aquí.' },
  approvals: {
    awaiting_one: 'El harness preguntó antes de una llamada a herramienta y espera a una persona. Abre la pestaña Aprobaciones para permitirla o denegarla ({{count}} en espera).',
    awaiting_other: 'El harness preguntó antes de unas llamadas a herramientas y espera a una persona. Abre la pestaña Aprobaciones para permitirlas o denegarlas ({{count}} en espera).',
    awaiting_many: 'El harness preguntó antes de unas llamadas a herramientas y espera a una persona. Abre la pestaña Aprobaciones para permitirlas o denegarlas ({{count}} en espera).',
    decide: {
      decision: 'Elige si el harness puede hacer esta llamada a herramienta. La ejecución continúa en cuanto envías la decisión.',
      allow: 'Deja que el harness haga esta llamada a herramienta. La ejecución continúa con ella.',
      deny: 'Rechaza esta llamada a herramienta. El harness recibe el mensaje de denegación y continúa sin ella.',
      reason: 'Nota opcional que se guarda con la decisión y se escribe en el registro de auditoría. Una denegación se la transmite al agente.',
      remember: 'Añade también una regla al despliegue de esta aprobación, para que el mismo tipo de llamada se decida automáticamente la próxima vez.',
      rulePattern: 'La regla que se añadirá, con la sintaxis de reglas de Claude Code. Empieza como la regla sugerida; amplíala o restríngela antes de guardar.',
      submitAllow: 'Permite la llamada a herramienta ahora. La decisión es definitiva y no se puede cambiar después.',
      submitDeny: 'Deniega la llamada a herramienta ahora. La decisión es definitiva y no se puede cambiar después.'
    }
  },
  approvalCheck: {
    toolName: 'Nombre de la herramienta tal como lo informa el harness, por ejemplo Bash, Edit, WebFetch o una herramienta MCP como mcp__github__create_issue.',
    inputs: {
      command: 'El comando de shell que quieres probar, por ejemplo npm run build && npm test. Cada subcomando debe estar permitido.',
      url: 'La URL que obtendría la herramienta. Las reglas de WebFetch coinciden según su dominio.',
      query: 'La consulta de búsqueda que enviaría la herramienta.',
      file_path: 'Ruta del archivo que la herramienta leería o cambiaría, relativa al espacio de trabajo o absoluta.',
      notebook_path: 'Ruta del notebook que la herramienta cambiaría.',
      pattern: 'El patrón glob o de búsqueda que usaría la herramienta.'
    },
    run: 'Evalúa las reglas guardadas del despliegue para esta llamada a herramienta y muestra el resultado. No se registra nada y ninguna ejecución se ve afectada.',
    suggestedRule: 'La regla que añadiría «recordar» para esta llamada. Cópiala en las reglas de arriba para cubrir llamadas similares.'
  },
  ids: { deleted: 'Este registro se eliminó. ID {{id}}. El botón de copiar copia el ID.', named: 'ID {{id}}. Usa el botón de copiar para copiar el ID para la API, los SDK o una solicitud de soporte.' },
  markdown: {
    column: 'Columna {{name}} de una tabla de la salida del agente. Las tablas anchas se desplazan en horizontal dentro de su marco.',
    showRaw: 'Muestra el texto exacto que devolvió el agente, sin formato Markdown, para que puedas revisarlo o copiarlo.',
    showRendered: 'Vuelve a mostrar el texto con formato Markdown: tablas, listas, bloques de código y enlaces.',
    copy: 'Copia al portapapeles el texto del resultado sin formato, con la sintaxis Markdown incluida.',
    link: 'Abre {{href}} en una pestaña nueva. El enlace viene de la salida del agente, así que revisa la dirección antes de confiar en ella.'
  },
  common: {
    fields: {
      name: 'Nombre único de este registro dentro del inquilino. Otros registros y manifiestos lo referencian por este nombre.',
      description: 'Nota de texto libre para personas. Explica para qué sirve este registro y no se usa en tiempo de ejecución.',
      active: 'Los registros inactivos se conservan pero se ignoran. Desactívalo para pausar algo sin eliminarlo.',
      id: 'Identificador generado por el sistema con un prefijo de tipo. Úsalo en llamadas a la API y en scripts; nunca cambia.',
      createdUtc: 'Cuándo se creó este registro. Pasa el cursor sobre el valor para ver la fecha y hora exactas.',
      lastUpdateUtc: 'Cuándo se modificó este registro por última vez.',
      isBuiltIn: 'Los registros integrados vienen con Garrison y son de solo lectura. Los registros personalizados se crearon en este inquilino y se pueden editar.',
      expiresUtc: 'Después de esta hora el registro deja de funcionar. Déjalo vacío para que no caduque.'
    }
  },
  explainer: {
    reopen: 'Vuelve a mostrar la explicación de {{topic}}: qué gestiona esta página y cómo se relaciona con el resto de Garrison.',
    dismiss: 'Oculta esta explicación. En su lugar queda un pequeño botón "Acerca de" para que puedas recuperarla en cualquier momento.'
  },
  nav: {
    approvalsBadge_one: '{{count}} llamada a herramienta espera a que una persona la permita o la deniegue. Abre Aprobaciones para decidir.',
    approvalsBadge_other: '{{count}} llamadas a herramientas esperan a que una persona las permita o las deniegue. Abre Aprobaciones para decidir.',
    approvalsBadge_many: '{{count}} llamadas a herramientas esperan a que una persona las permita o las deniegue. Abre Aprobaciones para decidir.',
    hubs: {
      approvals: 'La bandeja de aprobaciones: llamadas a herramientas que los agentes pidieron hacer y que esperan a una persona, y el historial de todas las decisiones por regla, valor predeterminado, persona o tiempo de espera.',
      home: 'Empieza aquí: recuentos en vivo de agentes, ejecuciones y nodos de trabajo, tráfico de la API, fallos recientes y accesos directos a tareas comunes.',
      invoke: 'Envía un mensaje a un agente desde el navegador y observa cómo se transmite la transcripción, sin escribir código.',
      runs: 'Cada invocación de agente, con su transcripción, resultado y telemetría, además de la cola de trabajo que espera un nodo.',
      analytics: 'Gráficos de velocidad de ejecución, uso de tokens, coste, resultados y llamadas a herramientas a lo largo del tiempo, filtrables por agente, harness y despliegue.',
      agents: 'Los agentes que los clientes invocan por nombre y los despliegues que deciden cómo se ejecuta realmente cada uno.',
      configuration: 'Las piezas que usan los despliegues: perfiles de harness, plantillas de prompt, servidores MCP, secretos, espacios de trabajo, almacenes de artefactos y manifiestos.',
      fleet: 'Las réplicas del plano de control que sirven la API y planifican las ejecuciones, los nodos de trabajo que las ejecutan y los grupos de nodos que agrupan a los nodos de trabajo para la ubicación.',
      access: 'Quién puede iniciar sesión y qué puede hacer: inquilinos, usuarios, claves de acceso, roles y asignaciones de roles.',
      monitoring: 'Investiga qué ocurrió: solicitudes a la API capturadas, el registro de auditoría de seguridad y el Explorador de API en vivo.',
      system: 'Ajustes del servidor y los endpoints, versiones e identidad del servidor al que estás conectado.'
    },
    tabs: {
      runs: 'Busca, filtra e inspecciona ejecuciones individuales. Abre una para leer su transcripción, resultado y telemetría, o para cancelarla y reintentarla.',
      queue: 'Ejecuciones que esperan un nodo, que están concedidas o que se están ejecutando ahora mismo, agrupadas por agente y harness.',
      agents: 'Agentes con nombre que los clientes invocan por REST, MCP o A2A. Un agente es la identidad; sus despliegues deciden cómo se ejecuta.',
      deployments: 'Cómo se ejecuta cada agente: perfil de harness, modelo, prompts, servidores MCP, secretos, espacio de trabajo, ubicación, límites y peso de tráfico.',
      harnessProfiles: 'Recetas para lanzar un harness de CLI sin interfaz: ejecutable, argumentos, entorno, archivos y análisis de la salida.',
      promptTemplates: 'Cada prompt y archivo de configuración generado que Garrison envía a un harness, versionado y con vista previa en vivo.',
      mcpServers: 'Servidores de herramientas que pueden usar los agentes. Regístralos aquí y luego vincúlalos a los despliegues.',
      secrets: 'Claves de API y tokens cifrados. Los despliegues los vinculan por alias; los valores nunca se vuelven a mostrar.',
      workspaces: 'Plantillas para el directorio en el que trabaja una ejecución: vacío, clonado desde Git o precargado con archivos.',
      agentAssets: 'Prompts de sistema, habilidades, archivos de referencia y plantillas de documento versionados que fijan las revisiones de agentes, con subida e historial.',
      artifactStores: 'Destinos para los archivos que producen las ejecuciones y que quieres conservar cuando la ejecución termina.',
      modelPrices: "Tarifas en USD configuradas por el operador para estimar el coste cuando el harness no lo informa. El coste informado, incluso cero, tiene prioridad.",
      usageQuotas: "Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.",
      manifests: 'Aplica o exporta toda la configuración del inquilino como YAML para que pueda vivir en el control de versiones.',
      nodes: 'Máquinas o pods de trabajo que obtienen ejecuciones y ejecutan harnesses. Acordónalos, drénalos o inspecciónalos aquí.',
      controlNodes: 'Réplicas del servidor (nodos de control) que sirven REST, MCP y A2A y planifican las ejecuciones. Una de ellas es el líder y se encarga del mantenimiento del clúster. Estado, versión y actividad de solo lectura.',
      nodePools: 'Grupos de nodos con nombre, opcionalmente reservados para inquilinos específicos. Los despliegues pueden exigir un grupo.',
      tenants: 'Organizaciones aisladas en este servidor, cada una con sus propios usuarios, agentes, secretos y ejecuciones.',
      users: 'Personas que inician sesión con un correo electrónico y una contraseña. Cada usuario puede tener claves de acceso.',
      credentials: 'Claves de acceso para scripts, SDK y servicios. Cada clave pertenece a un usuario y actúa con los permisos de ese usuario o con menos.',
      roles: 'Conjuntos de permisos con nombre, además de los propios permisos. Asigna roles para conceder acceso.',
      assignments: 'Concesiones que conectan un rol con un usuario o una clave de acceso, para todo el inquilino o para un recurso.',
      requests: 'Solicitudes a la API que este servidor capturó, con encabezados, cuerpos, tiempos y estado, para depurar integraciones.',
      audit: 'Eventos de seguridad y configuración: inicios de sesión, denegaciones, cambios de secretos, aplicaciones de manifiestos y cambios en nodos.',
      explorer: 'Elige cualquier operación de la API del documento OpenAPI del servidor, rellena los parámetros y ejecútala en vivo.',
      settings: 'Ajustes del servidor y del clúster, con su origen y si un cambio se aplica en vivo o requiere reiniciar.',
      serverInfo: 'Direcciones REST, MCP y A2A, versiones del servidor y del panel, y la identidad con la que has iniciado sesión.',
      conversations: 'Conversaciones de varios turnos con agentes: cada turno es una ejecución que reanuda la sesión del turno anterior. Abre una para leer sus turnos y enviar el siguiente mensaje.'
    },
    subtabs: {
      roles: 'Los roles agrupan permisos bajo un nombre, como Operator o Invoker. Asigna un rol para dar a alguien todos sus permisos.',
      permissions: 'Reglas individuales que permiten o deniegan operaciones sobre tipos de recursos. Los roles se componen de ellas; la denegación siempre prevalece.',
      userAssignments: 'Concede roles a personas que inician sesión con un correo electrónico y una contraseña.',
      credentialAssignments: 'Concede roles a claves de acceso usadas por la automatización. Mantén las claves más restringidas que sus propietarios.'
    },
    setup: 'Abre el asistente de configuración: guarda una credencial del harness, aplica un agente de ejemplo y ejecútalo una vez para confirmar que todo funciona.',
    tour: 'Repite la breve visita guiada que muestra la navegación, el contexto y dónde está la configuración.',
    skipToContent: 'Salta la navegación y ve directamente al contenido principal de esta página. Útil sobre todo para quienes usan el teclado.'
  },
  topbar: {
    toggleSidebar: 'Contrae o expande la barra lateral de navegación. En pantallas pequeñas abre la navegación como una superposición.',
    server: 'El servidor de Garrison con el que habla esta consola: {{url}}. El punto indica si su comprobación de estado está pasando.',
    health: {
      healthy: 'El servidor respondió a su comprobación de estado en los últimos 30 segundos.',
      unhealthy: 'El servidor no respondió a su comprobación de estado. Es probable que las solicitudes desde esta página fallen.',
      unknown: 'Esperando el primer resultado de la comprobación de estado del servidor.'
    },
    copyServer: 'Copia la URL del servidor, por ejemplo para configurar un SDK o un comando curl.',
    switchTenant: 'Los administradores del sistema pueden ver cualquier inquilino. Todas las páginas muestran los datos del inquilino seleccionado.',
    tenant: 'Estás trabajando en el inquilino {{tenant}}. Todos los registros y ejecuciones que ves le pertenecen.',
    principal: 'Has iniciado sesión como {{name}}. Las acciones que realizas se registran con esta identidad.',
    role: 'Tu nivel de acceso más alto en este inquilino. Decide qué páginas y acciones están disponibles.',
    liveOn: 'Conectado al servidor por WebSocket, así que los cambios en ejecuciones y nodos aparecen en cuanto ocurren.',
    liveOff: 'Sin conexión en vivo. Las páginas se actualizan con sus propios temporizadores, así que los cambios pueden tardar unos segundos en aparecer.',
    github: 'Abre el repositorio de código fuente de Garrison en GitHub en una pestaña nueva, para consultar documentación e incidencias.',
    themeLight: 'Cambia al tema de color claro. La elección se recuerda en este navegador.',
    themeDark: 'Cambia al tema de color oscuro. La elección se recuerda en este navegador.',
    logout: 'Cierra la sesión y revoca esta sesión del navegador. Tendrás que volver a iniciar sesión.',
    language: 'Cambia el idioma de la interfaz. Las fechas y los números también siguen el idioma, y la elección se recuerda.'
  },
  login: {
    passwordTab: 'Inicia sesión como persona con un inquilino, un correo electrónico y una contraseña.',
    keyTab: 'Inicia sesión con una clave de acceso y una clave secreta, el mismo par que usan los scripts y los SDK.',
    serverUrl: 'Dirección base de otro servidor de Garrison, por ejemplo 127.0.0.1:9700. El navegador solo puede llegar a él si el panel permite su origen (GARRISON_CSP_CONNECT_SRC).',
    useDifferentServer: 'Inicia sesión en un servidor distinto de aquel con el que se desplegó esta consola. Su origen debe estar permitido en GARRISON_CSP_CONNECT_SRC.',
    useDefaultServer: 'Oculta el campo URL del servidor e inicia sesión en el servidor con el que se desplegó esta consola.',
    serverInUse: 'El servidor de Garrison en el que inicia sesión esta consola: GARRISON_API_URL si está definido; si no, el origen de esta página, que hace de proxy de la API.',
    tenantId: 'El inquilino al que pertenece tu cuenta. El inquilino local predeterminado se llama default.',
    email: 'La dirección de correo electrónico de tu cuenta de usuario en este inquilino.',
    password: 'La contraseña de tu cuenta. Se envía una sola vez para obtener un token de sesión y la aplicación del navegador nunca la guarda.',
    accessKey: 'La mitad pública de una clave de acceso, que empieza por access_. Crea claves en Acceso > "Claves de acceso".',
    secretKey: 'La mitad privada de la clave de acceso. Se mostró una sola vez cuando se creó o se rotó la clave.',
    submit: 'Comprueba las credenciales con el servidor y abre la consola de tu inquilino.'
  },
  table: {
    selectAll: 'Selecciona o desmarca todas las filas de esta página, por ejemplo para eliminarlas juntas.',
    selectRow: 'Selecciona esta fila para una acción masiva, como eliminar.',
    sortServer: '{{tip}} Haz clic para ordenar toda la lista por esta columna; vuelve a hacer clic para invertir el orden.',
    sortPageOnly: '{{tip}} Haz clic para ordenar solo las filas de esta página; el servidor no puede ordenar por esta columna.',
    clearSelection: 'Desmarca todas las filas seleccionadas sin cambiar nada.',
    pageSize: 'Cuántas filas se cargan por página. Las páginas más grandes tardan más en cargar. La elección se recuerda para cada tabla.',
    first: 'Ve a la primera página de resultados.',
    prev: 'Retrocede una página de resultados.',
    jump: 'Escribe un número de página entre 1 y {{total}} y pulsa Intro para saltar directamente a ella.',
    next: 'Avanza una página de resultados.',
    last: 'Ve a la última página de resultados.',
    refresh: 'Vuelve a cargar esta lista desde el servidor ahora, manteniendo la página, los filtros y el orden.',
    autoRefresh: 'Vuelve a cargar estos datos automáticamente con un temporizador. Desactivado, los datos no cambian mientras lees.',
    selectColumns: 'Elige qué columnas muestra la tabla. Tu elección se recuerda para cada tabla en este navegador.',
    columnPinned: '{{column}} se muestra siempre porque sin ella no se pueden identificar las filas.',
    columnToggle: 'Muestra u oculta la columna {{column}}. {{tip}}',
    actionsFor: 'Abre las acciones de {{name}}: ver, editar, duplicar, ver JSON, eliminar y acciones propias del registro.',
    actionsMenu: 'Abre las acciones disponibles para esta fila.',
    actionsColumn: 'Acciones por fila. Haz clic en los tres puntos para ver, editar, duplicar, inspeccionar el JSON o eliminar.',
    search: 'Escribe parte de un nombre para acotar la lista. La búsqueda se ejecuta en el servidor cuando dejas de escribir.',
    clearFilters: 'Quita el texto de búsqueda y todos los filtros y vuelve a mostrar la lista completa.',
    bulkDelete: 'Elimina todas las filas seleccionadas. Primero se te pedirá confirmación.'
  },
  filters: {
    decisionSource: 'Muestra solo las aprobaciones decididas de una forma: por una regla, el valor predeterminado del despliegue, una persona, un tiempo de espera o una ejecución detenida.',
    runId: 'Muestra solo las aprobaciones de una ejecución. Pega un ID de ejecución como run_...; la lista se actualiza cuando dejas de escribir.',
    status: 'Muestra solo los registros en este estado. Elige "Todos" para quitar el filtro.',
    harnessType: 'Muestra solo los registros de un harness, como Claude Code o Codex.',
    kind: 'Muestra solo los registros de un tipo. Elige "Todos" para quitar el filtro.',
    eventType: 'Muestra solo los eventos de auditoría de un tipo, como inicios de sesión fallidos o cambios de secretos.',
    fromUtc: 'Muestra solo los registros creados en esta hora o después (en tu zona horaria local).',
    toUtc: 'Muestra solo los registros creados antes de esta hora (en tu zona horaria local).',
    method: 'Muestra solo las solicitudes que usaron este método HTTP.',
    statusCode: 'Muestra solo las solicitudes que devolvieron este código de estado HTTP, por ejemplo 404 o 500.',
    pathContains: 'Muestra solo las solicitudes cuya ruta contiene este texto, por ejemplo /agents.',
    tenantId: 'Muestra solo las solicitudes hechas en este inquilino. Déjalo vacío para incluir todos los inquilinos.',
    apply: 'Ejecuta la búsqueda con los valores de filtro de arriba.',
    clear: 'Vacía todos los filtros de arriba y vuelve a buscar.',
    agentId: 'Muestra solo los registros de un agente. Elige Todos para quitar el filtro.'
  },
  form: {
    option: 'Incluye {{option}} en {{field}}. Las opciones marcadas se guardan; las desmarcadas se omiten.',
    reveal: 'Muestra el valor escrito en texto plano para que puedas revisarlo antes de guardar.',
    hide: 'Vuelve a ocultar el valor para que quien mire tu pantalla no pueda leerlo.',
    key: 'Clave de esta entrada de {{field}}. Las claves deben ser únicas dentro de la lista.',
    value: 'Valor de esta entrada de {{field}}. Se permiten plantillas y referencias a secretos donde se indique.',
    removeRow: 'Quita esta entrada de la lista. No se guarda nada hasta que haces clic en "Guardar".',
    addRow: 'Añade una entrada vacía de clave y valor a {{field}}.',
    moveUp: 'Mueve este elemento una posición antes. El orden importa aquí, por ejemplo en las listas de argumentos.',
    moveDown: 'Mueve este elemento una posición después. El orden importa aquí, por ejemplo en las listas de argumentos.',
    removeItem: 'Quita este elemento de la lista. No se guarda nada hasta que haces clic en "Guardar".',
    addItem: 'Añade un elemento nuevo y vacío a {{field}} y rellena sus campos.'
  },
  actions: {
    openDetail: 'Abre la página de detalle completa de este registro.',
    view: 'Abre este registro en solo lectura para ver todos los campos sin riesgo de cambiarlo.',
    edit: 'Abre este registro en un formulario para cambiarlo. Los cambios se aplican cuando haces clic en "Guardar".',
    duplicate: 'Empieza un registro nuevo con los valores de este y un nombre con -copy. No se crea nada hasta que guardas.',
    viewJson: 'Muestra el JSON sin procesar exactamente como lo devuelve la API, para depurar o copiarlo en scripts.',
    delete: 'Elimina este registro de forma permanente. Se te pedirá confirmación y no se puede deshacer.',
    add: 'Crea un registro nuevo de este tipo en un formulario.',
    switchToEdit: 'Cambia esta vista de solo lectura a un formulario editable.',
    retryLoad: 'Vuelve a intentar cargar estos datos desde el servidor.'
  },
  modal: {
    close: 'Cierra esta ventana. No cambia nada en el servidor.',
    dismiss: 'Cierra esta ventana sin guardar. También puedes pulsar Escape.',
    cancelForm: 'Cierra el formulario y descarta los cambios sin guardar.',
    back: 'Ve al paso anterior del formulario. Los valores que escribiste se conservan.',
    next: 'Ve al siguiente paso del formulario. No se guarda nada hasta que haces clic en "Guardar".',
    saveEdit: 'Guarda tus cambios en este registro. El servidor los valida e indica cualquier campo que necesite atención.',
    saveCreate: 'Crea el registro con estos valores. El servidor los valida e indica cualquier campo que necesite atención.',
    saveValue: 'Envía el valor al servidor. Se cifra al llegar y nunca se vuelve a mostrar.'
  },
  confirm: {
    delete: 'Sí, eliminar este registro de forma permanente.',
    bulkDelete: 'Sí, eliminar de forma permanente todos los registros seleccionados.',
    cancel: 'Vuelve atrás sin hacer nada.',
    danger: 'Realiza esta acción destructiva. No se puede deshacer.',
    confirm: 'Realiza la acción descrita arriba.'
  },
  copy: {
    id: 'Copia el ID del registro al portapapeles, para usarlo con la REST API, los SDK o los filtros.',
    value: 'Copia este valor al portapapeles.',
    block: 'Copia todo el bloque al portapapeles, listo para pegarlo en una terminal o un archivo.',
    done: 'Copiado al portapapeles.'
  },
  chart: {
    ranges: {
      hour: 'Muestra los últimos 60 minutos, en intervalos de un minuto.',
      day: 'Muestra las últimas 24 horas. Los intervalos se ajustan para que el gráfico siga siendo legible.',
      week: 'Muestra los últimos 7 días. Los intervalos se ajustan para que el gráfico siga siendo legible.',
      month: 'Muestra los últimos 30 días. Los intervalos se ajustan para que el gráfico siga siendo legible.',
      custom: 'Elige tu propia hora de inicio y de fin. El servidor rechaza los rangos muy largos.'
    },
    refresh: 'Vuelve a cargar ahora los datos del gráfico desde el servidor.',
    tenant: 'Muestra la actividad de solicitudes de un inquilino o de todos los inquilinos del servidor.'
  },
  badges: {
    approvalsOn_one: 'Las aprobaciones están activadas: el harness pregunta antes de las llamadas a herramientas, y {{count}} regla decide algunas automáticamente.',
    approvalsOn_other: 'Las aprobaciones están activadas: el harness pregunta antes de las llamadas a herramientas, y {{count}} reglas deciden algunas automáticamente.',
    approvalsOn_many: 'Las aprobaciones están activadas: el harness pregunta antes de las llamadas a herramientas, y {{count}} reglas deciden algunas automáticamente.',
    approvalsOff: 'Las aprobaciones están desactivadas: el harness hace llamadas a herramientas según su propia configuración de permisos, sin preguntar.',
    active: 'Activo: este registro está en uso.',
    inactive: 'Inactivo: este registro se conserva pero se ignora hasta que se vuelva a activar.',
    builtIn: 'Integrado: viene con Garrison y es de solo lectura. Clónalo para crear una versión que puedas editar.',
    custom: 'Personalizado: creado en este inquilino, así que se puede editar y eliminar.',
    systemAdmin: 'Administrador del sistema: puede gestionar todos los inquilinos y omite las comprobaciones de autorización.',
    tenantAdmin: 'Administrador del inquilino: puede gestionar todo dentro de este inquilino.',
    user: 'Usuario normal: su acceso proviene solo de las asignaciones de roles.',
    role: 'Esta asignación concede el rol {{role}} y todos sus permisos.',
    deploymentActive: 'Activo: este despliegue recibe su parte del tráfico del agente.',
    deploymentInactive: 'Inactivo: este despliegue no recibe tráfico, pero aún se puede indicar explícitamente al invocar.'
  },
  permissions: {
    source: 'El rol del que proviene esta concesión. Corrige el acceso cambiando ese rol o la asignación que lo concede.',
    type: '"Permitir" concede las operaciones; "Denegar" las bloquea aunque otro rol las permita.',
    resources: 'Los tipos de registros que cubre esta concesión, como Agent o Run.',
    operations: 'Qué se puede hacer con esos registros, como Read, Create o Execute.',
    scope: 'El ámbito "Inquilino" cubre todos los registros del tipo; el ámbito "Recurso" cubre un registro concreto.'
  },
  compilePreview: {
    input: 'Un mensaje de ejemplo de un cliente para compilar. Se convierte en {{input.message}} en la plantilla de tarea.',
    compile: 'Compila este despliegue exactamente como lo haría una ejecución, sin iniciarla, y muestra la línea de comandos, los archivos y el entorno.'
  },
  secretOnce: {
    accessKey: 'La clave de acceso pública. Identifica la clave y es seguro guardarla en la configuración.',
    secretKey: 'La clave secreta. Esta es la única vez que se muestra; cópiala ahora en tu gestor de contraseñas o almacén de secretos.',
    done: 'Cierra esta ventana. La clave secreta no se puede recuperar más tarde, solo rotar.'
  },
  wizard: {
    skip: 'Cierra el asistente y no lo vuelvas a ofrecer para este inquilino. Puedes reabrirlo desde la barra lateral.',
    back: 'Vuelve al paso anterior del asistente.',
    start: 'Empieza la configuración: añade una credencial, aplica un agente de ejemplo y pruébalo.',
    saveSecret: 'Guarda la credencial cifrada en este inquilino y pasa al siguiente paso.',
    skipStep: 'Continúa sin añadir una credencial. El agente de ejemplo no la necesita.',
    apply: 'Crea el agente y el despliegue de ejemplo a partir del manifiesto mostrado arriba.',
    invoke: 'Inicia una ejecución del agente de ejemplo con tu mensaje y abre su página de detalle.',
    secretName: 'Nombre de la credencial guardada. Los despliegues la referencian por este nombre al vincularla.',
    manifest: 'El manifiesto de ejemplo en YAML. Puedes editarlo antes de aplicarlo, por ejemplo para cambiar el nombre del agente.',
    message: 'El mensaje que se envía al agente de ejemplo. El harness simulado lo devuelve tal cual.'
  },
  tour: {
    skip: 'Termina la visita guiada ahora. Puedes repetirlo desde la barra lateral.',
    back: 'Muestra la parada anterior de la visita guiada.',
    next: 'Pasa a la siguiente parada de la visita guiada.',
    done: 'Finaliza la visita guiada. Puedes repetirlo desde la barra lateral.'
  },
  telemetry: {
    ...TELEMETRY,
    panel: 'Cuánto tardó cada fase de esta ejecución y qué consumió. Las duraciones provienen de los relojes del nodo de trabajo y del servidor descritos en cada campo.',
    phases: 'En qué empleó su tiempo la ejecución, de izquierda a derecha: espera en la cola, arranque del harness hasta el primer token, transmisión de la salida y el resto de la ejecución.',
    phase: {
      delegation: 'Tiempo antes de la primera salida del modelo en que la ejecución esperó a las ejecuciones hijas que delegó. No es el arranque del harness.',
      queue: 'Esperando en la cola a que un nodo de trabajo obtenga la concesión de la ejecución.',
      startup: 'Desde el inicio del proceso hasta la primera salida del modelo, incluidos el arranque del harness y la primera solicitud al modelo.',
      streaming: 'Desde la primera hasta la última salida del modelo.',
      tail: 'Ejecución posterior a la última salida del modelo: llamadas a herramientas, gestión del resultado y salida del proceso.'
    }
  },
  blocked: {
    panel: 'Por qué esta ejecución sigue en cola y qué cambiar para que un nodo de trabajo pueda tomarla.',
    openFleet: 'Abre la página Flota para ver qué nodos de trabajo están listos, qué harness informa cada uno y los detalles de sus sondas.',
    openAgent: 'Abre el agente de esta ejecución para revisar sus despliegues, incluido el grupo de nodos y los selectores de nodo de cada uno.',
    homeBanner: 'Ejecuciones en cola que ahora mismo ningún nodo de trabajo listo puede ejecutar. Siguen en cola hasta que aparezca uno compatible, o fallan cuando Runtime.FailBlockedAfterSeconds está definido y se agota.',
    showRuns: 'Abre la página Ejecuciones filtrada por ejecuciones en cola. Las bloqueadas llevan una insignia de aviso que explica el motivo.',
    queueColumn: 'Ejecuciones en cola de este grupo que ahora mismo ningún nodo de trabajo listo puede ejecutar. Pasa el cursor por la insignia para ver el motivo y qué hacer.'
  },
  enums: {
    approvalStatus: {
      Pending: 'Espera a que una persona la permita o la deniegue. Hasta entonces, el harness queda bloqueado en esta llamada.',
      Approved: 'La llamada a herramienta se permitió, por una regla, el valor predeterminado del despliegue, una persona o un tiempo de espera.',
      Denied: 'La llamada a herramienta se rechazó. El harness recibió el mensaje de denegación y continuó sin ella.',
      Expired: 'Nadie decidió a tiempo, así que se aplicó la decisión por tiempo de espera del despliegue.',
      Cancelled: 'La ejecución se detuvo mientras la aprobación estaba pendiente, así que se cerró sin decisión.'
    },
    approvalDecision: {
      Allow: 'Permitir: el harness tuvo permiso para hacer la llamada a herramienta.',
      Deny: 'Denegar: el harness recibió un rechazo con el motivo.'
    },
    approvalSource: {
      DurableResume: "Una aprobación humana de un solo uso conservada desde el punto de control anterior. Solo se aplica a la solicitud de herramienta reanudada que coincida.",
      Rule: 'La decidió al instante una regla del despliegue. La regla coincidente se muestra al lado.',
      Default: 'Ninguna regla coincidió, así que la decidió la acción predeterminada del despliegue.',
      User: 'La decidió una persona en el panel, mediante la API o mediante MCP.',
      Timeout: 'Nadie decidió antes de que caducara, así que se aplicó la decisión por tiempo de espera del despliegue.',
      Cancelled: 'La ejecución se detuvo mientras esta aprobación estaba en espera.'
    },
    approvalRuleAction: {
      Allow: 'Permitir: las llamadas a herramientas coincidentes siguen adelante sin preguntar a nadie.',
      Deny: 'Denegar: las llamadas a herramientas coincidentes se rechazan sin preguntar a nadie. Denegar prevalece sobre cualquier otra regla.',
      Ask: 'Preguntar a una persona: las llamadas a herramientas coincidentes esperan una decisión en la bandeja de Aprobaciones.'
    },
    approvalKind: {
      Tool: 'Una solicitud de permiso de Claude Code para cualquier herramienta, incluidas las herramientas MCP.',
      Command: 'Un comando de shell que una ejecución del app-server de Codex quiere ejecutar. Las reglas lo evalúan como Bash.',
      FileChange: 'Un cambio de archivo que una ejecución del app-server de Codex quiere hacer. Las reglas lo evalúan como Edit.'
    },
    runBlockedReason: {
      NoReadyWorker: 'Bloqueada: ningún nodo de trabajo está listo, así que nadie puede tomar esta ejecución. Inicia un nodo de trabajo o registra uno nuevo y revisa en la página Flota los nodos perdidos, desconectados, drenando o acordonados.',
      NoCapableWorker: 'Bloqueada: hay nodos de trabajo listos, pero ninguno informa del harness de esta ejecución como disponible. Inicia o registra un nodo de trabajo con el harness instalado, o revisa sus credenciales y los resultados de las sondas en la página Flota.',
      NoMatchingPool: 'Bloqueada: un nodo de trabajo listo puede ejecutar este harness, pero ninguno coincide con el grupo de nodos del despliegue, la restricción de inquilino del grupo o sus selectores de nodo. Revisa la ubicación del despliegue o añade un nodo de trabajo a ese grupo.'
    },
    runStatus: {
      Pending: 'Pendiente: la ejecución se aceptó y se está preparando antes de entrar en la cola.',
      Queued: 'En cola: esperando a que un nodo de trabajo con un harness y una ubicación compatibles obtenga su concesión.',
      Leased: 'Concedida: un nodo de trabajo reclamó la ejecución y está preparando el espacio de trabajo.',
      Running: 'En ejecución: el proceso del harness se está ejecutando en un nodo de trabajo.',
      Cancelling: 'Cancelando: se solicitó detenerla y el nodo de trabajo está cerrando el harness.',
      Succeeded: 'Correcta: el harness terminó y produjo un resultado válido.',
      Failed: 'Fallida: la ejecución terminó con un error. La columna de resultado indica el motivo.',
      Cancelled: 'Cancelada: alguien detuvo la ejecución antes de que terminara.',
      TimedOut: 'Tiempo agotado: la ejecución alcanzó su plazo límite y se detuvo.',
      Rejected: 'Rechazada: la ejecución no pudo iniciarse, por ejemplo porque no había ningún despliegue activo.'
    },
    runOutcome: {
      None: 'La ejecución no ha terminado, así que todavía no hay resultado.',
      Succeeded: 'El harness terminó y su resultado superó la validación.',
      HarnessFailed: 'El harness informó de un fallo o salió sin un resultado utilizable. Revisa Stderr y la transcripción.',
      NotInstalled: 'No se encontró el ejecutable del harness en el nodo de trabajo.',
      NotCredentialed: 'El harness no tenía credenciales utilizables. Vincula un secreto al despliegue.',
      McpPreflightFailed: 'Un servidor MCP o una herramienta obligatorios no estaban accesibles cuando el nodo de trabajo hizo la comprobación previa al lanzamiento.',
      NodeLost: 'El nodo de trabajo dejó de enviar latidos mientras tenía la ejecución.',
      OutputLimitExceeded: 'La ejecución produjo demasiada salida: su respuesta superó el máximo de caracteres del asistente del despliegue (una protección) o el harness escribió más de lo que permite el perfil de harness. Se conserva la salida obtenida.',
      SchemaValidationFailed: 'El resultado no coincidía con el JSON Schema de salida del agente: tras un intento de reparación, o de inmediato si el harness no puede reanudar su sesión.',
      TimedOut: 'La ejecución alcanzó su plazo límite.',
      Cancelled: 'La ejecución se canceló a petición.',
      StaleLease: 'El nodo de trabajo informó después de perder su concesión, así que su resultado se ignoró.',
      CompileFailed: 'No se pudo compilar el despliegue, por ejemplo por faltar una variable de plantilla.',
      WorkspaceFailed: 'No se pudo preparar el espacio de trabajo, por ejemplo porque falló un clon de Git.',
      Rejected: 'La solicitud se rechazó antes de que pudiera iniciarse una ejecución.',
      InternalError: 'Garrison encontró un error interno. Los registros del servidor tienen los detalles.',
      NoCapableWorker: 'La ejecución esperó en la cola más tiempo del que permite el ajuste de clúster Runtime.FailBlockedAfterSeconds y ningún nodo de trabajo listo podía ejecutarla, así que falló.',
      RepetitionDetected: 'Una protección detuvo la ejecución porque su respuesta degeneró en el mismo texto corto repetido una y otra vez, o solo en espacios y puntuación. Se conserva la salida obtenida. Ajústala con la Protección contra repeticiones del despliegue.',
      NoProgress: 'Una protección detuvo la ejecución porque no llegó texto, razonamiento ni actividad de herramientas durante más tiempo que el límite sin avance del despliegue. Se conserva la salida obtenida.',
      PodFailed: 'El pod de ejecución falló fuera del harness: no se pudo programar, no se pudo descargar su imagen, se quedó sin memoria, fue desalojado o terminó sin informar. El mensaje de error indica la causa.',
      ConversationStateLost: 'El nodo que debía reanudar este turno de conversación ya no tenía los directorios de la conversación. Garrison vuelve a encolar ese turno una vez para reconstruirlo; este resultado solo queda cuando eso no fue posible.'
    },
    controlNodeStatus: {
      Starting: 'Iniciando: la réplica se está inicializando y todavía no atiende tráfico.',
      Ready: 'Listo: la réplica envía latidos y atiende solicitudes REST, MCP y A2A.',
      Draining: 'Drenando: el apagado ha comenzado. La comprobación de disponibilidad responde 503 y sus flujos y sondeos largos están terminando.',
      Offline: 'Desconectado: la réplica se detuvo de forma ordenada, o estuvo 30 segundos en silencio y el líder la marcó. Las filas desconectadas se eliminan después de 24 horas.'
    },
    backplane: {
      Local: 'Local: los eventos se quedan dentro de este proceso. Sirve para una sola réplica; las demás réplicas no los ven.',
      Polling: 'Sondeo de la base de datos: las réplicas comparten los eventos en vivo consultando la base de datos. Funciona con cualquier base de datos, con un pequeño retraso.',
      PostgresNotify: 'Notificaciones de PostgreSQL: las réplicas comparten los eventos en vivo mediante LISTEN y NOTIFY de PostgreSQL, casi sin retraso.'
    },
    nodeStatus: {
      Ready: 'Listo: envía latidos y acepta nuevas ejecuciones.',
      Draining: 'Drenando: termina sus ejecuciones actuales y no acepta nuevas.',
      Cordoned: 'Acordonado: no acepta nuevas ejecuciones; las actuales continúan con normalidad.',
      Lost: 'Perdido: dejó de enviar latidos. Sus ejecuciones se vuelven a poner en cola o se marcan como fallidas.',
      Offline: 'Desconectado: se apagó de forma ordenada y no tiene ejecuciones.'
    },
    usageQuotaScope: {"Tenant": "Inquilino. Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "Agent": "Agente. Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "Deployment": "Despliegue. Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue."},
    harnessType: {
      ClaudeCode: 'CLI de Claude Code de Anthropic, ejecutada sin interfaz con salida stream-JSON.',
      Codex: 'CLI de Codex de OpenAI, ejecutada con exec y salida JSONL.',
      Mux: 'CLI de Mux con salida JSONL; funciona con endpoints de modelos locales y alojados.',
      GeminiCli: 'Gemini CLI de Google con salida stream-JSON.',
      Generic: 'Cualquier otro agente de línea de comandos, descrito por completo en el perfil de harness.'
    },
    agentKind: {
      Hosted: 'Alojado: Garrison ejecuta este agente por sí mismo mediante sus despliegues en nodos de trabajo.',
      Remote: 'Remoto: el agente se ejecuta en otro lugar y Garrison reenvía las llamadas a su endpoint A2A o MCP.'
    },
    secretStatus: {
      Ok: 'La credencial se puede usar, hasta donde sabe Garrison. Definir un valor nuevo siempre devuelve el secreto a este estado.',
      NeedsReauthentication: 'OpenAI rechazó definitivamente la sesión de ChatGPT guardada, por ejemplo porque su token de actualización ya se había usado. Las ejecuciones que usan este secreto fallan hasta que sustituyas su valor por una sesión nueva.'
    },
    secretKind: {
      AnthropicApiKey: 'Una clave de API de Anthropic, que el perfil de Claude Code inyecta como ANTHROPIC_API_KEY.',
      ClaudeCodeOAuthToken: 'Un token de suscripción de Claude Code. Revisa las condiciones del proveedor antes de usarlo en servidores compartidos.',
      OpenAiApiKey: 'Una clave de API de OpenAI para Codex u otros harnesses basados en OpenAI.',
      CodexAuthJson: 'El contenido de un archivo auth.json de Codex, que se escribe en el HOME de la ejecución.',
      GeminiApiKey: 'Una clave de API de Google Gemini para Gemini CLI.',
      GenericEnv: 'Cualquier valor destinado a una variable de entorno.',
      GenericFile: 'Cualquier valor destinado a escribirse en un archivo.',
      BearerToken: 'Un token bearer, normalmente usado en el encabezado Authorization de un servidor MCP.',
      BasicAuth: 'Un par de nombre de usuario y contraseña para autenticación básica.',
      GitCredential: 'Un token o contraseña para clonar repositorios Git privados para los espacios de trabajo.'
    },
    workspaceKind: {
      Empty: 'Cada ejecución empieza en un directorio nuevo y vacío.',
      GitRepository: 'Cada ejecución empieza con un clon nuevo de un repositorio Git.',
      Seeded: 'Cada ejecución empieza con los archivos indicados en la plantilla.',
      PersistentVolume: 'Cada ejecución monta un PersistentVolumeClaim existente como espacio de trabajo, así que los archivos se conservan entre ejecuciones. Requiere el ejecutor Job de Kubernetes.'
    },
    runExecutor: {
      Process: 'El harness se ejecuta como subproceso del worker, en su contenedor, con sus propios directorios de trabajo, home y configuración.',
      KubernetesJob: 'El worker inicia un Job de Kubernetes por ejecución: el harness se ejecuta en su propio pod sin credenciales de Kubernetes ni de Garrison, con un sistema de archivos raíz de solo lectura y los límites de recursos de la implementación.'
    },
    promptTemplateKind: {
      System: 'Un prompt del sistema: las instrucciones permanentes que configuran el agente.',
      Task: 'Un prompt de tarea: envuelve el mensaje del cliente en lo que recibe el harness.',
      Fragment: 'Una pieza reutilizable que otras plantillas incluyen con {{> name}}.',
      ToolDescription: 'Texto que describe un agente como herramienta MCP o habilidad A2A.',
      ConfigFile: 'El contenido de un archivo de configuración generado, como una configuración MCP.',
      Other: 'Cualquier otro texto que renderice un perfil de harness.'
    },
    mcpTransport: {
      Http: 'Garrison y el harness acceden al servidor por Streamable HTTP en una URL.',
      Stdio: 'El harness inicia el servidor como proceso local y se comunica con él por stdin y stdout.'
    },
    permissionType: {
      Permit: 'Permitir: permite las operaciones indicadas.',
      Deny: 'Denegar: bloquea las operaciones indicadas, aunque otro permiso las permita.'
    },
    artifactStoreKind: {
      Database: 'Los artefactos se guardan en la base de datos de Garrison. Es sencillo, pero conviene para archivos pequeños.',
      Filesystem: 'Los artefactos se escriben en un directorio accesible para el servidor.',
      S3: 'Los artefactos se suben a un bucket compatible con S3.'
    },
    manifestApplyResult: {
      Created: 'Este documento creó un registro nuevo.',
      Updated: 'Este documento cambió un registro existente.',
      Unchanged: 'El registro ya coincidía con este documento, así que no cambió nada.',
      Failed: 'Este documento no superó la validación. No se escribió nada del manifiesto.',
      Validated: 'Simulación: este documento es válido y se aplicaría.'
    },
    auditEventType: {
      ApprovalDecided: 'Una persona permitió o denegó una llamada a herramienta pendiente. El registro indica la herramienta, la ejecución y el motivo.',
      AuthSuccess: 'Alguien inició sesión o autenticó una solicitud correctamente.',
      AuthFailure: 'Falló un intento de inicio de sesión o de autenticación. Los fallos repetidos pueden indicar que alguien está adivinando.',
      SessionIssued: 'Se emitió un token de sesión.',
      SessionRevoked: 'Se revocó un token de sesión, por ejemplo al cerrar la sesión.',
      CredentialCreated: 'Se creó una clave de acceso nueva.',
      CredentialRotated: 'Se reemplazó el secreto de una clave de acceso.',
      CredentialUsed: 'Se usó una clave de acceso para autenticarse.',
      AuthorizationDenied: 'Se rechazó una solicitud porque el llamante no tenía permiso.',
      AuthorizationBypass: 'Una solicitud omitió la autorización mediante una regla de excepción, como la de un administrador del sistema.',
      RoleChanged: 'Se creó, cambió o eliminó un rol.',
      PermissionChanged: 'Se creó, cambió o eliminó un permiso.',
      AssignmentChanged: 'Se creó, cambió o eliminó una asignación de rol.',
      ConfigurationChanged: 'Cambió un agente, despliegue, perfil, plantilla u otro registro de configuración.',
      SecretChanged: 'Se creó, cambió, rotó o eliminó un secreto.',
      SettingsChanged: 'Se cambió la configuración del servidor.',
      RestartRequested: 'Alguien pidió reiniciar el servidor.',
      ManifestApplied: 'Se aplicó un manifiesto al inquilino.',
      NodeRegistered: 'Un nodo de trabajo se registró en el plano de control.',
      NodeStatusChanged: 'Un nodo de trabajo se acordonó, se drenó, se perdió o volvió.',
      RunCancelled: 'Un usuario, una clave de acceso o su ejecución principal canceló una ejecución.',
      ConversationDeleted: 'Alguien eliminó una conversación. Sus turnos se conservan como ejecuciones normales.'
    },
    conversationFallbackReason: {
      AffinityNodeLost: 'El nodo que guarda la conversación dejó de estar listo (perdido, en drenaje, acordonado o eliminado), así que otro nodo tomó el turno.',
      AffinityWaitExpired: 'El nodo que guarda la conversación siguió listo, pero no tomó el turno dentro de Runtime.ConversationAffinityWaitMs, así que lo tomó otro nodo.',
      WorkspaceLost: 'El nodo tomó el turno, pero allí ya no estaban el espacio de trabajo ni el directorio personal de la conversación.',
      SessionMissing: 'Hay turnos anteriores, pero ninguno informó una sesión del harness que reanudar; por ejemplo, porque todos fallaron pronto.',
      HarnessChanged: 'El perfil de harness del despliegue cambió desde que se registró la sesión, así que el perfil nuevo no puede reanudarla.',
      ResumeUnsupported: 'El perfil de harness del despliegue no admite reanudar una sesión, así que cada turno posterior empieza desde la transcripción.',
      ExecutorWithoutState: 'El turno se ejecuta como Kubernetes Job, que empieza siempre con un directorio personal vacío, así que cada turno posterior empieza desde la transcripción.'
    }
  },
  resources: {
    approvals: {
      createdUtc: 'Cuándo preguntó el harness. Pasa el cursor sobre el valor para ver la hora exacta.',
      agentName: 'El agente cuya ejecución pidió esta llamada a herramienta.',
      toolName: 'La herramienta que el harness quiere usar, por ejemplo Bash, Edit, WebFetch o una herramienta MCP.',
      summary: 'Una línea sobre la llamada: el comando, la URL, las rutas o la consulta, con los secretos censurados.',
      status: 'Pendiente hasta que se decide; después Aprobada, Denegada, Caducada (tiempo de espera) o Cancelada (la ejecución se detuvo).',
      decision: 'Permitir o Denegar una vez decidida; vacío mientras la aprobación está pendiente.',
      decisionSource: 'Qué la decidió: una regla, el valor predeterminado del despliegue, una persona, un tiempo de espera o una ejecución detenida.',
      decidedBy: 'La persona o la clave de acceso que decidió, cuando la decidió una persona.',
      expiresUtc: 'Cuándo se agota el tiempo de una aprobación pendiente y se aplica la decisión por tiempo de espera del despliegue.',
      kind: 'Llamada a herramienta (Claude Code), Comando o Cambio de archivo (app-server de Codex).',
      harnessType: 'El harness que preguntó: Claude Code o Codex.',
      runId: 'La ejecución que preguntó. Ábrela para ver la transcripción alrededor de la llamada.',
      rootRunId: 'La ejecución de nivel superior del árbol de delegación, cuando la ejecución que preguntó era delegada.',
      deploymentId: 'El despliegue cuyas reglas evaluaron esta llamada. Las reglas recordadas se añaden a él.',
      leaseEpoch: 'Época de la concesión del intento de ejecución que preguntó, para que una decisión nunca llegue a un intento posterior.',
      requestedUtc: 'Cuándo pidió permiso el harness.',
      decidedUtc: 'Cuándo se tomó la decisión.',
      waitMs: 'Cuánto esperó la llamada desde la solicitud hasta la decisión.',
      timeoutDecision: 'Qué ocurre si nadie decide antes de que caduque la aprobación, según la configuración del despliegue.',
      toolCallId: 'El ID propio del harness para esta llamada a herramienta, para localizarla en la transcripción.',
      reason: 'La nota que escribió la persona que decidió, si la hay.',
      inputPreview: 'La entrada de la herramienta que envió el harness, como JSON, con los secretos y los valores similares a tokens censurados.',
      rulePattern: 'La regla del despliegue que coincidió con esta llamada, cuando una regla la decidió o pidió a una persona.',
      ruleId: 'ID de la regla del despliegue que coincidió.',
      suggestedRule: 'Una regla que coincidiría con esta llamada. Recordar como regla la rellena de antemano.',
      rememberedRuleId: 'ID de la regla que se añadió al despliegue cuando esta aprobación se decidió con la opción de recordar.',
      id: 'Identificador de la aprobación (apr_...) para la API y las herramientas MCP.',
      actions: {
        allow: 'Permite esta llamada a herramienta pendiente, con un motivo opcional y la opción de recordarla como regla.',
        deny: 'Deniega esta llamada a herramienta pendiente, con un motivo opcional y la opción de recordarla como regla.',
        openRun: 'Abre la ejecución que preguntó, para leer su transcripción alrededor de esta llamada a herramienta.'
      }
    },
    tenants: {
      add: 'Crea un inquilino nuevo: un espacio aislado con sus propios usuarios, agentes, secretos y ejecuciones.',
      name: 'Nombre visible del inquilino. Las personas eligen el inquilino por su ID al iniciar sesión.',
      description: 'Para quién o para qué es este inquilino, por ejemplo un equipo o un cliente.',
      active: 'Los inquilinos inactivos no pueden iniciar sesión ni ejecutar agentes. Sus datos se conservan.'
    },
    users: {
      add: 'Crea una persona que inicia sesión con correo electrónico y contraseña. Después dale acceso con una asignación de rol.',
      email: 'La dirección con la que la persona inicia sesión. Es única dentro del inquilino.',
      name: 'Nombre y apellidos, que se muestran en los registros de auditoría y en las listas.',
      role: 'Nivel de administración de la cuenta. Los usuarios normales obtienen acceso mediante asignaciones de roles.',
      password: 'Contraseña de inicio de sesión. Al editar, déjala vacía para conservar la contraseña actual.',
      firstName: 'Nombre de pila, que se muestra en las listas y en los registros de auditoría.',
      lastName: 'Apellido, que se muestra en las listas y en los registros de auditoría.',
      isTenantAdmin: 'Los administradores del inquilino pueden gestionar todo dentro de este inquilino, incluidos usuarios y secretos.',
      isAdmin: 'Los administradores del sistema gestionan todos los inquilinos y omiten la autorización. Concédelo con moderación.',
      active: 'Los usuarios inactivos no pueden iniciar sesión y sus claves de acceso dejan de funcionar.',
      actions: { permissions: 'Muestra todos los permisos que acaba teniendo este usuario tras combinar todos sus roles y asignaciones.' }
    },
    credentials: {
      add: 'Crea una clave de acceso para un script, un SDK o un servicio. El secreto se muestra una sola vez después de guardar.',
      name: 'Para qué es esta clave, por ejemplo ci-pipeline. Te ayuda a encontrarla antes de rotarla o eliminarla.',
      accessKey: 'La mitad pública de la clave, que se envía con cada solicitud. Es seguro guardarla en la configuración.',
      secretKeyLast4: 'Los cuatro últimos caracteres del secreto, para que puedas identificar una clave sin verla.',
      userId: 'El usuario propietario de esta clave. Una clave nunca puede hacer más que su propietario.',
      lastUsedUtc: 'Cuándo autenticó la clave una solicitud por última vez. Las fechas antiguas apuntan a claves sin uso que puedes eliminar.',
      authMode: 'Cómo puede autenticarse la clave: enviada directamente, firmada en cada solicitud, intercambiada por una sesión o cualquiera de estas (Hybrid).',
      expiresUtc: 'Después de esta hora la clave deja de funcionar. Déjalo vacío para una clave que no caduca.',
      active: 'Las claves inactivas se rechazan pero se conservan, así que puedes volver a activarlas.',
      actions: {
        rotate: 'Reemplaza el secreto por uno nuevo. El secreto anterior deja de funcionar de inmediato; el nuevo se muestra una sola vez.',
        permissions: 'Muestra todos los permisos que acaba teniendo esta clave tras combinar su propietario, sus roles y sus asignaciones.'
      }
    },
    roles: {
      add: 'Crea un rol personalizado, luego añádele permisos y asígnalo a usuarios o claves.',
      name: 'Nombre que se ve al asignar el rol, por ejemplo Release Operator.',
      description: 'Para qué sirve el rol y quién debería recibirlo.',
      active: 'Los roles inactivos no conceden nada, ni siquiera donde están asignados.',
      actions: { clone: 'Crea una copia editable de este rol integrado que puedes ajustar.' }
    },
    permissions: {
      add: 'Crea una regla que permite o deniega operaciones sobre tipos de recursos.',
      name: 'Nombre corto de la regla, que se muestra al construir roles.',
      permissionType: '"Permitir" permite las operaciones de abajo. "Denegar" las bloquea y siempre prevalece sobre un permiso.',
      resourceTypes: 'Qué tipos de registros cubre la regla. "All" cubre todos los tipos.',
      operationTypes: 'Qué operaciones cubre la regla, como Read, Create o Execute (invocar).',
      active: 'Los permisos inactivos no tienen efecto.'
    },
    userAssignments: {
      add: 'Da un rol a un usuario, para todo el inquilino o para un registro concreto.',
      userId: 'La persona que recibe el rol.',
      roleName: 'El rol concedido. La persona obtiene todos sus permisos.',
      roleId: 'El rol que se concede. La persona obtiene todos sus permisos.',
      resourceScope: '"Inquilino" aplica el rol a todos los registros. "Recurso" lo limita al registro indicado abajo.',
      resourceId: 'Identificador del registro al que se aplica el rol, por ejemplo el ID de un agente.',
      inheritsToChildren: 'Aplica el rol a todos los registros del inquilino, incluidos los que se creen más adelante.',
      active: 'Las asignaciones inactivas no conceden nada, pero se conservan.'
    },
    credentialAssignments: {
      add: 'Da un rol a una clave de acceso, para todo el inquilino o para un registro concreto.',
      credentialId: 'La clave de acceso que recibe el rol. Aun así, no puede superar a su propietario.',
      roleName: 'El rol concedido a la clave.',
      roleId: 'El rol que se concede. Elige el rol más restringido que permita a la automatización hacer su trabajo.',
      resourceScope: '"Inquilino" aplica el rol a todos los registros. "Recurso" lo limita al registro indicado abajo.',
      resourceId: 'Identificador del registro al que se aplica el rol, por ejemplo el único agente que puede invocar un trabajo de CI.',
      inheritsToChildren: 'Aplica el rol a todos los registros del inquilino, incluidos los que se creen más adelante.',
      active: 'Las asignaciones inactivas no conceden nada, pero se conservan.'
    },
    harnessProfiles: {
      add: 'Describe una nueva forma de lanzar un agente de CLI sin interfaz. Normalmente es más fácil clonar un perfil integrado.',
      name: 'Nombre del perfil. Los despliegues eligen un perfil por este nombre. El prefijo builtin/ está reservado.',
      harnessType: 'Qué harness lanza este perfil. Los nodos de trabajo anuncian los tipos que pueden ejecutar, lo que determina la ubicación.',
      executable: 'Comando que se ejecuta en el nodo de trabajo, encontrado en PATH o indicado como ruta absoluta, por ejemplo claude.',
      outputParser: 'Cómo se convierte la salida del harness en eventos de transcripción y en un resultado final.',
      description: 'Qué tiene de especial este perfil, por ejemplo qué flags añade.',
      probeArguments: 'Argumentos para una comprobación de versión que no gasta tokens, como --version. Los nodos de trabajo la ejecutan al arrancar.',
      active: 'Las ejecuciones nuevas no pueden usar perfiles inactivos.',
      arguments: 'Argumentos de línea de comandos en orden. Cada uno es una plantilla, puede omitirse por una condición y puede repetirse sobre una lista.',
      argumentsItems: {
        template: 'Texto de un argumento, por ejemplo --model o {{deployment.model}}.',
        condition: 'Expresión de plantilla; cuando se renderiza vacía o como false, este argumento se omite.',
        repeatOver: 'Nombre de una variable de lista; el argumento se emite una vez por cada elemento.'
      },
      promptDelivery: 'Cómo llega el prompt de tarea al harness: por la entrada estándar, como argumento o en un archivo.',
      promptArgumentTemplate: 'El argumento o nombre de archivo que se usa cuando el prompt no se envía por la entrada estándar.',
      systemPromptDelivery: 'Cómo llega el prompt del sistema al harness: un archivo, un argumento, una variable de entorno, antepuesto a la tarea o de ninguna forma.',
      systemPromptTarget: 'El flag, la variable o el nombre de archivo que transporta el prompt del sistema.',
      mcpConfigFormat: 'Qué formato de configuración MCP lee este harness. Garrison escribe en él los servidores MCP vinculados a la ejecución.',
      mcpConfigFileName: 'Nombre del archivo de configuración MCP generado, dentro del directorio de configuración de la ejecución.',
      environment: 'Variables de entorno del proceso. Los valores son plantillas; {{secret.alias}} incorpora un secreto vinculado.',
      environmentItems: {
        name: 'Nombre de la variable, por ejemplo ANTHROPIC_API_KEY.',
        valueTemplate: 'Plantilla del valor. Usa {{secret.alias}} para las credenciales.',
        condition: 'Expresión de plantilla; cuando se renderiza vacía o como false, la variable no se define.',
        isSecret: 'Trata el valor como secreto: nunca se escribe en los registros y se oculta en las vistas previas.'
      },
      files: 'Archivos que se escriben antes del lanzamiento, como archivos de configuración o auth.json.',
      filesItems: FILE_ITEMS,
      credentialEnvironmentAllowlist: 'Nombres de variables de entorno que se pueden rellenar con secretos para este harness. Cualquier otra se rechaza.',
      genericTextField: 'Ruta JSON al texto del asistente en cada línea de salida, para el analizador Generic JSONL.',
      genericFinalField: 'Ruta JSON al texto del resultado final, para el analizador Generic JSONL.',
      genericSuccessField: 'Ruta JSON que indica si la ejecución fue correcta, para el analizador Generic JSONL.',
      genericSuccessValue: 'El valor en la ruta de éxito que significa que la ejecución fue correcta, por ejemplo true.',
      resultSource: 'De dónde sale la respuesta final: el evento final del analizador, un archivo con el último mensaje o toda la salida estándar.',
      resultFileName: 'Nombre del archivo en el que el harness escribe su último mensaje, cuando el origen del resultado es un archivo.',
      successPolicy: 'Cómo se decide el éxito: por el evento final del analizador, por el código de salida o por ambos.',
      successExitCodes: 'Códigos de salida que cuentan como éxito cuando la política usa códigos de salida. Uno por línea.',
      defaultTimeoutSeconds: 'Plazo límite de la ejecución en segundos cuando el despliegue no define ninguno. Entre 5 y 86400.',
      killGraceSeconds: 'Segundos entre pedir al proceso que se detenga y terminar su árbol de procesos. Entre 0 y 60.',
      maxOutputBytes: 'Cantidad máxima de salida estándar que puede producir una ejecución antes de fallar con el resultado "Límite de salida superado".',
      stderrTailBytes: 'Cuánto del final de la salida de error estándar se conserva para la página de detalle de la ejecución.',
      isolateHome: 'Da a cada ejecución su propio directorio HOME para que la configuración y las cachés del harness nunca se filtren entre ejecuciones.',
      supportsResume: 'Si este harness puede reanudar una sesión anterior. Lo usan las conversaciones.',
      steps: {
        basics: 'Nombre, tipo de harness, ejecutable y la comprobación de versión.',
        invocation: 'Argumentos, entrega del prompt, configuración MCP, entorno y archivos.',
        output: 'Cómo se analiza la salida y cómo se decide el éxito.',
        limits: 'Tiempos de espera, límites de salida y aislamiento de HOME.'
      },
      actions: { clone: 'Crea una copia editable de este perfil en tu inquilino, con el sufijo -custom en el nombre.' }
    },
    promptTemplates: {
      actions: { clone: 'Copia esta plantilla con un nombre nuevo que eliges y abre la copia en el editor.' },
      add: 'Escribe una nueva plantilla de prompt en el editor con vista previa en vivo. Cada guardado se convierte en una versión.',
      name: 'Nombre de la plantilla, único en el inquilino. Los despliegues vinculan plantillas por ID, así que cambiar el nombre conserva sus vínculos; las inclusiones la referencian por nombre.',
      kind: 'Para qué se usa la plantilla: prompt del sistema, envoltorio de tarea, fragmento, descripción de herramienta o archivo de configuración.',
      currentVersion: 'La versión guardada más reciente. Los despliegues fijan una versión o siguen la más reciente.',
      description: 'Qué hace la plantilla y dónde se usa.'
    },
    mcpServers: {
      add: 'Registra un servidor MCP para que los despliegues puedan vincularlo y sus agentes puedan usar sus herramientas.',
      name: 'Nombre del servidor. Los despliegues lo vinculan por este nombre y le dan un alias.',
      transport: 'A los servidores HTTP se accede en una URL; los servidores stdio los inicia el harness como proceso local.',
      endpoint: 'Dónde se accede al servidor: su URL y ruta, o el comando de un servidor stdio.',
      required: 'Si está activado, una ejecución falla antes del lanzamiento si este servidor o sus herramientas obligatorias no están accesibles.',
      description: 'Qué herramientas ofrece este servidor y qué agentes deberían usarlo.',
      url: 'URL base del servidor tal como la alcanzan los nodos de trabajo, sin la ruta MCP.',
      path: 'Ruta del endpoint MCP en ese servidor, normalmente /mcp.',
      headers: 'Encabezados HTTP que se envían al servidor, como Authorization. Los valores pueden usar {{secret.alias}}.',
      headersItems: {
        name: 'Nombre del encabezado, por ejemplo Authorization.',
        valueTemplate: 'Plantilla del valor del encabezado, por ejemplo Bearer {{secret.github}}.'
      },
      command: 'Ejecutable que inicia el servidor stdio en el nodo de trabajo.',
      arguments: 'Argumentos del comando del servidor stdio, uno por línea.',
      environment: 'Variables de entorno del proceso del servidor stdio. Los valores pueden usar {{secret.alias}}.',
      environmentItems: {
        name: 'Nombre de la variable para el proceso del servidor.',
        valueTemplate: 'Plantilla del valor. Usa {{secret.alias}} para las credenciales.'
      },
      requiredTools: 'Herramientas que deben existir en este servidor. El nodo de trabajo lo comprueba antes del lanzamiento y hace fallar la ejecución si falta alguna.',
      toolTimeoutSeconds: 'Cuánto puede tardar una sola llamada a una herramienta antes de que el harness desista.',
      active: 'Los servidores inactivos quedan fuera de las ejecuciones nuevas aunque un despliegue los vincule.',
      actions: { test: 'Conéctate ahora al servidor y lista sus herramientas, para comprobar la dirección y las credenciales.' }
    },
    secrets: {
      status: 'Si la credencial guardada sigue funcionando. Garrison marca una sesión de Codex como pendiente de volver a iniciar sesión cuando ya no se puede renovar.',
      accessTokenExpiresUtc: 'Cuándo caduca el token de acceso de una sesión de ChatGPT de Codex guardada. Garrison lo renueva antes y guarda los tokens nuevos en el secreto.',
      refreshedUtc: 'Cuándo renovó Garrison esta sesión de Codex por última vez. Las ejecuciones solo reciben una copia sin el token de actualización.',
      statusMessage: 'Por qué no se puede usar la sesión, según el proveedor.',
      statusUtc: 'Cuándo detectó Garrison que la sesión ya no se puede renovar.',
      add: 'Guarda una credencial nueva, como una clave de API o un token, cifrada en reposo. Los despliegues la referencian por alias; el valor nunca se vuelve a mostrar después de guardar.',
      name: 'Nombre del secreto. Los despliegues eligen el secreto por este nombre y le dan un alias.',
      kind: 'Qué tipo de credencial es. Los perfiles integrados usan el tipo para saber qué variable o archivo rellenar.',
      valueLast4: 'Los cuatro últimos caracteres del valor guardado, para distinguir secretos sin revelarlos.',
      rotatedUtc: 'Cuándo se definió o rotó el valor por última vez.',
      expiresUtc: 'Caducidad informativa. Rota el valor antes de esta fecha.',
      description: 'De dónde salió el valor y qué agentes lo necesitan.',
      value: 'El valor secreto. Se cifra al guardarlo y nunca se puede volver a leer, solo reemplazar.',
      newValue: 'El valor de reemplazo. Se aplica a todas las ejecuciones compiladas después de guardar.',
      active: 'Los secretos inactivos no se inyectan en las ejecuciones.',
      saveValue: 'Cifra y guarda el valor nuevo. El valor anterior se descarta y no se puede recuperar.',
      actions: {
        setValue: 'Reemplaza el valor guardado por uno nuevo que escribes. El valor anterior no se puede recuperar.',
        rotate: 'Pon un valor nuevo y registra la hora de rotación, por ejemplo después de que el proveedor emita una clave nueva.'
      }
    },
    workspaces: {
      add: 'Define cómo se prepara el directorio de trabajo de una ejecución: vacío, clonado desde Git o precargado con archivos.',
      name: 'Nombre de la plantilla. Los despliegues eligen una plantilla de espacio de trabajo por este nombre.',
      kind: '"Vacío" empieza sin nada, "Repositorio Git" clona un repositorio y "Archivos precargados" escribe los archivos indicados abajo.',
      gitUrl: 'Repositorio que se clona para cada ejecución. Los repositorios privados necesitan un secreto de credencial de Git.',
      retention: 'Qué pasa con el directorio después de la ejecución: eliminarlo, conservarlo o conservarlo solo si la ejecución falló.',
      description: 'Qué contiene el espacio de trabajo y qué agentes lo usan.',
      gitRef: 'Rama, etiqueta o commit que se extrae. Déjalo vacío para usar la rama predeterminada.',
      gitDepth: 'Cuántos commits se descargan. 1 es lo más rápido; 0 descarga todo el historial.',
      gitCredentialSecretId: 'Secreto que contiene el token o la contraseña para clonar un repositorio privado.',
      persistentVolumeClaim: 'Nombre del PersistentVolumeClaim que se monta en la ruta del espacio de trabajo. Debe existir ya en el espacio de nombres de ejecución; Garrison nunca lo crea ni lo elimina.',
      files: 'Archivos que se escriben en el espacio de trabajo antes de que empiece la ejecución.',
      filesItems: {
        path: 'Ruta del archivo relativa a la raíz del espacio de trabajo.',
        content: 'Contenido de texto del archivo.'
      },
      active: 'Las ejecuciones nuevas no pueden usar plantillas inactivas.'
    },
    modelPrices: {"add": "Añada un precio para un harness y un modelo servido exactos. No hay precios de proveedores precargados.", "name": "Nombre de configuración único para este precio dentro del inquilino.", "description": "Notas del operador sobre el origen y la fecha de vigencia de estas tarifas.", "active": "Los precios inactivos no se usan. Editar o eliminar precios no cambia los costes guardados de las ejecuciones.", "model": "Introduzca el nombre exacto del modelo, de 1 a 256 caracteres sin caracteres de control.", "harnessType": "Harness cuya contabilidad de tokens y nombre exacto de modelo corresponden a estas tarifas.", "inputUsdPerMillion": "Entrada USD / millón de tokens. Introduzca una tarifa finita entre 0 y 1.000.000.000. Cero es válido.", "outputUsdPerMillion": "Salida USD / millón de tokens. Introduzca una tarifa finita entre 0 y 1.000.000.000. Cero es válido.", "cachedInputUsdPerMillion": "Déjelo vacío para usar la tarifa de entrada o salida correspondiente. Cero significa gratis.", "reasoningUsdPerMillion": "Déjelo vacío para usar la tarifa de entrada o salida correspondiente. Cero significa gratis.", "inputIncludesCachedTokens": "Active si la entrada incluye tokens en caché. Desactive para Claude Code, que informa las lecturas de caché por separado.", "outputIncludesReasoningTokens": "Active si la salida incluye tokens de razonamiento. Los subtotales incluidos se restan antes de aplicar su tarifa separada."},
    usageQuotas: {"add": "Añada una cuota para un inquilino, agente o despliegue. Los límites vacíos son ilimitados.", "name": "Nombre. Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "description": "Descripción. Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "active": "Activo. Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "scope": "Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "resourceId": "Añada una cuota para un inquilino, agente o despliegue. Los límites vacíos son ilimitados.", "dailyRunLimit": "Ejecuciones por día UTC. Déjelo vacío para uso ilimitado. Cero impide el uso. Los contadores diarios se reinician a medianoche UTC; la concurrencia cuenta ejecuciones activas.", "dailyTokenLimit": "Tokens por día UTC. Déjelo vacío para uso ilimitado. Cero impide el uso. Los contadores diarios se reinician a medianoche UTC; la concurrencia cuenta ejecuciones activas.", "dailyCostUsdLimit": "USD conocidos por día UTC. Déjelo vacío para uso ilimitado. Cero impide el uso. Los contadores diarios se reinician a medianoche UTC; la concurrencia cuenta ejecuciones activas.", "maxConcurrentRuns": "Máximo de ejecuciones activas. Déjelo vacío para uso ilimitado. Cero impide el uso. Los contadores diarios se reinician a medianoche UTC; la concurrencia cuenta ejecuciones activas.", "actions": {"usage": "Uso diario. Ejecuciones por día UTC. Déjelo vacío para uso ilimitado. Cero impide el uso. Los contadores diarios se reinician a medianoche UTC; la concurrencia cuenta ejecuciones activas."}, "usage": {"windowStartUtc": "Inicio del periodo (UTC). Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "windowEndUtc": "Reinicio diario (UTC). Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "runsUsed": "Ejecuciones admitidas. Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "tokensUsed": "Tokens completados. Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "costUsd": "Coste conocido (USD). Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "unknownCostRuns": "Ejecuciones sin coste. Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "activeRuns": "Ejecuciones activas. Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue."}, "enforcementEnabled": "Desactivado por defecto. Active para rechazar ejecuciones al alcanzar los límites y reducir presupuestos compatibles. Desactivado, solo se registra el uso."},
    artifactStores: {
      add: 'Crea un destino para los archivos que producen las ejecuciones, para que sobrevivan al espacio de trabajo de la ejecución.',
      name: 'Nombre del almacén. Los despliegues eligen un almacén de artefactos por este nombre.',
      kind: 'Dónde se guardan los archivos: la base de datos de Garrison, un directorio del sistema de archivos o un bucket de S3.',
      description: 'Qué se guarda aquí y cuánto tiempo debe conservarse.',
      active: 'Los almacenes inactivos no reciben artefactos nuevos.'
    },
    agents: {
      add: 'Crea una nueva identidad de agente. No hace nada hasta que le añadas al menos un despliegue.',
      name: 'Nombre compatible con DNS que usan los clientes para invocar al agente por REST, MCP y A2A. Letras minúsculas, dígitos y guiones.',
      displayName: 'Nombre descriptivo que se muestra en la consola y en la tarjeta de agente A2A.',
      kind: 'Los agentes alojados se ejecutan aquí mediante despliegues. Los agentes remotos se ejecutan en otro lugar y se llaman a través de su endpoint.',
      exposure: 'Qué protocolos anuncian al agente: A2A le da una tarjeta de agente; MCP lo convierte en una herramienta para clientes MCP.',
      delegationMode: 'Qué otros agentes pueden invocar las ejecuciones de este agente: ninguno, una lista de permitidos o cualquier agente.',
      tags: 'Etiquetas para encontrar y agrupar agentes. No afectan a cómo se ejecuta el agente.',
      description: 'Qué hace el agente, en palabras sencillas. Se muestra a los clientes y en la tarjeta A2A, así que escríbela pensando en ellos.',
      agentVersion: 'Cadena de versión anunciada en la tarjeta A2A. Cámbiala cuando cambie el comportamiento del agente.',
      remoteProtocol: 'Cómo llama Garrison al agente remoto: A2A o MCP.',
      remoteEndpointUrl: 'Dirección del endpoint A2A o MCP del agente remoto.',
      exposeA2A: 'Publica una tarjeta de agente A2A para que otros agentes A2A puedan descubrir y llamar a este agente.',
      exposeMcpTool: 'Ofrece este agente como herramienta propia en el servidor MCP de Garrison, para que los clientes MCP puedan llamarlo directamente.',
      mcpToolName: 'Nombre de la herramienta que ven los clientes MCP. Déjalo vacío para usar el nombre del agente.',
      skills: 'Habilidades A2A que aparecen en la tarjeta de agente. Describen lo que pueden pedir los clientes.',
      skillsItems: {
        skillId: 'Identificador estable de la habilidad en la tarjeta A2A.',
        name: 'Nombre corto de la habilidad que ven los clientes A2A.',
        description: 'Qué hace la habilidad, escrito para el agente que la llama.'
      },
      inputMode: 'Text acepta un mensaje simple. Structured exige una entrada que cumpla el JSON Schema de entrada.',
      inputSchema: "JSON Schema de la entrada del agente. Si se define, cada entrada de invocación debe ser un documento JSON que lo cumpla, e Invocar muestra un formulario generado a partir de él.",
      outputSchema: 'JSON Schema que debe cumplir el resultado. Garrison valida la salida y reintenta una vez con un prompt de reparación.',
      delegationAllowList: 'Los agentes a los que puede llamar este agente cuando la delegación usa una lista de permitidos.',
      delegationMaxDepth: 'Cuántos niveles de llamadas entre agentes pueden seguir por debajo de este agente. Entre 0 y 10.',
      delegationAllowRecursion: 'Permite que el mismo agente aparezca dos veces en una cadena de llamadas. Desactivado evita bucles.',
      active: 'Los agentes inactivos no se pueden invocar.',
      sections: {
        identity: 'Quién es el agente: su nombre, descripción, tipo y versión.',
        exposure: 'Qué protocolos anuncian al agente y qué habilidades enumera.',
        io: 'Qué entrada acepta el agente y qué salida debe devolver.',
        delegation: 'Si este agente puede llamar a otros agentes y con qué profundidad.'
      }
    },
    deployments: {
      approvalsEnabled: 'Hace que el harness pregunte antes de las llamadas a herramientas. Las reglas de abajo deciden la mayoría de las llamadas; el resto espera a una persona en la bandeja de Aprobaciones. Solo perfiles de Claude Code y del app-server de Codex.',
      approvalDefaultAction: 'Qué ocurre cuando ninguna regla coincide con una llamada a herramienta: permitirla, denegarla o preguntar a una persona.',
      approvalTimeoutSeconds: 'Cuánto espera una llamada a una persona antes de que se aplique la decisión por tiempo de espera, de 10 a 3.600 segundos.',
      approvalTimeoutDecision: 'La decisión que se aplica cuando nadie responde a tiempo. Permitir (el valor predeterminado) aprueba la llamada automáticamente tras el tiempo de espera; Denegar la bloquea.',
      approvalRules: 'Reglas ordenadas con la sintaxis de Claude Code. Denegar prevalece sobre Preguntar y Preguntar sobre Permitir; dentro de una misma acción se informa de la primera coincidencia.',
      approvalRulesItems: {
        action: 'Lo que recibe una llamada coincidente: Permitir, Denegar o Preguntar a una persona.',
        pattern: 'Regla de Claude Code, por ejemplo Bash(npm test), Bash(npm run *), Edit(src/**), Read, WebFetch(domain:example.com) o mcp__github__*.',
        inputPattern: 'Expresión regular de .NET opcional con la que también debe coincidir el JSON de entrada de la herramienta, para un control más fino que el patrón.',
        description: 'Por qué existe esta regla, para las personas que la mantienen.'
      },
      approvalTest: 'Prueba una llamada a herramienta contra las reglas guardadas del despliegue y comprueba si se permitiría, se denegaría o se enviaría a una persona.',
      add: 'Crea un despliegue: la forma concreta en que se ejecuta un agente, con un perfil de harness, un modelo, prompts y recursos.',
      name: 'Nombre del despliegue, único en el inquilino, por ejemplo reviewer-claude.',
      agentId: 'El agente que ejecuta este despliegue. Al invocar ese agente se puede elegir este despliegue.',
      harnessProfileId: 'El perfil de harness que lanza la CLI, por ejemplo builtin/claude-code.',
      model: 'Nombre del modelo que se pasa al harness, por ejemplo sonnet o gpt-5. Las plantillas lo tienen disponible como deployment.model.',
      weight: 'Peso de tráfico entre los despliegues activos del agente. Un despliegue con peso 300 recibe tres veces las llamadas de uno con 100.',
      configVersion: 'Aumenta con cada cambio. Cada ejecución registra la versión a partir de la que se compiló.',
      description: 'En qué se diferencia este despliegue de los demás del agente, por ejemplo un modelo más barato.',
      active: 'Los despliegues inactivos no reciben tráfico ponderado, pero los clientes aún pueden indicarlos explícitamente.',
      fallbackModel: 'Modelo que se usa cuando el modelo principal está sobrecargado, si el harness lo admite.',
      effort: 'Indicación de esfuerzo de razonamiento que se pasa a los harnesses que la admiten, como low, medium o high.',
      maxTurns: 'Número máximo de turnos del agente en una ejecución antes de que el harness la detenga.',
      maxBudgetUsd: 'Límite de gasto por ejecución en dólares estadounidenses, para los harnesses que lo aplican.',
      parameters: 'Valores con nombre que las plantillas pueden leer como deployment.parameters.name.',
      parametersItems: {
        name: 'Nombre del parámetro, referenciado como deployment.parameters.name.',
        value: 'Valor predeterminado. Los clientes solo pueden sobrescribirlo si figura en las sobrescrituras por ejecución.'
      },
      promptBindings: 'Qué plantilla de prompt cubre cada rol (System, Task, DelegatedTask, etc.).',
      promptBindingsItems: {
        role: 'El rol de prompt que cubre este vínculo, como System o Task.',
        templateId: 'La plantilla que se usa para ese rol.',
        pinnedVersion: 'Versión que se fija. Déjalo vacío para usar siempre la versión más reciente.'
      },
      resourceBindings: 'Servidores MCP y secretos que usa este despliegue, cada uno bajo un alias para las plantillas.',
      resourceBindingsItems: {
        kind: 'Si este vínculo es un servidor MCP o un secreto.',
        alias: 'Nombre corto que usan las plantillas, por ejemplo anthropic en {{secret.anthropic}}.',
        resourceId: 'El servidor MCP o el secreto que se vincula.'
      },
      workspaceTemplateId: 'Cómo se prepara el directorio de trabajo de cada ejecución. Vacío significa un directorio nuevo y vacío.',
      artifactStoreId: 'Dónde se suben los archivos que producen las ejecuciones cuando terminan.',
      argumentOverrides: 'Cambios en los argumentos del perfil de harness solo para este despliegue: añadir al final, añadir al principio, reemplazar o quitar.',
      argumentOverridesItems: {
        operation: 'Qué hacer: añadir al final, añadir al principio, reemplazar un argumento coincidente o quitarlo.',
        match: 'El argumento existente que se reemplaza o se quita.',
        template: 'El texto del nuevo argumento. Se permiten plantillas.',
        condition: 'Expresión de plantilla; cuando se renderiza vacía o como false, la sobrescritura se omite.'
      },
      environmentOverrides: 'Variables de entorno añadidas o reemplazadas solo para este despliegue.',
      environmentOverridesItems: {
        name: 'Nombre de la variable que se añade o reemplaza.',
        valueTemplate: 'Plantilla del valor. Usa {{secret.alias}} para los secretos vinculados.',
        isSecret: 'Trata el valor como secreto: nunca se escribe en los registros y se oculta en las vistas previas.'
      },
      fileOverrides: 'Archivos añadidos o reemplazados solo para este despliegue.',
      fileOverridesItems: FILE_ITEMS,
      allowedRunOverrides: 'Parámetros que los clientes pueden cambiar en cada ejecución, con validación. Todo lo demás queda fijo.',
      allowedRunOverridesItems: {
        name: 'Parámetro que los clientes pueden definir en cada ejecución, como model o tone.',
        validation: 'Cómo se comprueba el valor del cliente: cualquier valor, una lista de valores, una expresión regular o un rango numérico.',
        pattern: 'Valores permitidos separados por comas, una expresión regular o min,max para un rango numérico.'
      },
      nodePoolId: 'Ejecuta solo en nodos de este grupo. Déjalo vacío para permitir cualquier nodo apto.',
      nodeSelector: 'Etiquetas de nodo que deben coincidir exactamente, por ejemplo gpu=true.',
      nodeSelectorItems: {
        key: 'Nombre de la etiqueta que debe tener el nodo.',
        value: 'Valor de la etiqueta que debe tener el nodo.'
      },
      maxConcurrentRuns: 'Número máximo de ejecuciones simultáneas de este despliegue en todos los nodos. 0 significa sin límite.',
      timeoutSeconds: 'Plazo de la ejecución en segundos. Vacío usa el valor del perfil de harness. El ajuste del clúster Runtime.MaxRunSeconds limita toda ejecución, incluidos los límites por ejecución.',
      maxAttempts: 'Cuántas veces en total se puede intentar una ejecución. Entre 1 y 10.',
      steps: {
        approvals: 'Qué llamadas a herramientas puede hacer el harness, cuáles no y cuáles esperan a una persona.',
        basics: 'Nombre, agente y peso de tráfico.',
        harness: 'Perfil de harness, modelo, límites y parámetros.',
        prompts: 'Qué plantilla cubre cada rol de prompt.',
        resources: 'Servidores MCP, secretos, espacio de trabajo y almacén de artefactos.',
        overrides: 'Cambios por despliegue en argumentos, entorno y archivos, y qué pueden sobrescribir los clientes.',
        placement: 'Dónde pueden ejecutarse las ejecuciones y cuántas a la vez.'
      },
      actions: {
        compilePreview: 'Compila este despliegue con un mensaje de ejemplo y consulta la línea de comandos, los archivos y el entorno exactos que tendría una ejecución.',
        test: 'Abre "Invocar" con este despliegue preseleccionado para enviarle un mensaje real.'
      },
      repetitionGuard: 'Detiene una ejecución cuando su respuesta degenera en el mismo texto corto repetido una y otra vez, o solo en espacios y puntuación (resultado Repetición detectada). Sin definir sigue el valor del clúster; marca o desmarca la casilla para fijarlo en este despliegue.',
      maxAssistantChars: 'Máximo de caracteres de texto del asistente que puede escribir una ejecución antes de que Garrison la detenga (resultado Límite de salida superado). 0 significa sin límite; vacío usa el valor del clúster.',
      noProgressSeconds: 'Detiene una ejecución cuando no llega texto, razonamiento, llamada a herramienta ni resultado de herramienta durante estos segundos mientras no hay ninguna llamada a herramienta en curso (resultado Sin avance). 0 lo desactiva; vacío usa el valor del clúster.',
      executor: 'Cómo se ejecutan las ejecuciones: Proceso (dentro del worker) o Job de Kubernetes (un pod por ejecución, mayor aislamiento). Vacío sigue el ejecutor predeterminado del grupo de nodos y, si no, Proceso.',
      podCpuRequest: 'CPU que solicita el pod de ejecución, por ejemplo 250m. Vacío usa el valor predeterminado del worker.',
      podCpuLimit: 'CPU máxima que puede usar el pod de ejecución, por ejemplo 2. Vacío usa el valor predeterminado del worker.',
      podMemoryRequest: 'Memoria que solicita el pod de ejecución, por ejemplo 512Mi. Vacío usa el valor predeterminado del worker.',
      podMemoryLimit: 'Memoria máxima que puede usar el pod de ejecución, por ejemplo 4Gi. Una ejecución que la supera se detiene con el resultado Falló el pod de ejecución.',
      podEphemeralStorageRequest: 'Disco local que solicita el pod de ejecución para su espacio de trabajo, home y archivos temporales, por ejemplo 1Gi.',
      podEphemeralStorageLimit: 'Disco local máximo que puede usar el pod de ejecución, por ejemplo 10Gi. Un pod que lo supera es desalojado y la ejecución falla.',
      useClusterDefault: 'Borra el ajuste propio de este despliegue para que la protección contra repeticiones vuelva a seguir el valor del clúster.',
      sections: {
        guards: 'Las protecciones de ejecución detienen pronto las ejecuciones descontroladas en cualquier harness. Cada una que dejes vacía sigue su valor del clúster en Ajustes (Tiempo de ejecución).',
        execution: 'Elija dónde se ejecutan las ejecuciones y, para las de Job de Kubernetes, la CPU, la memoria y el disco del pod.'
      }
    },
    nodePools: {
      add: 'Crea un grupo para agrupar nodos y, opcionalmente, reservarlos para ciertos inquilinos.',
      name: 'Nombre del grupo. Los nodos se unen a un grupo al registrarse, y los despliegues pueden exigir uno.',
      description: 'Qué hardware o propósito representa este grupo.',
      tenants: 'Inquilinos que pueden usar el grupo. Vacío significa todos los inquilinos.',
      defaultExecutor: 'Ejecutor para las ejecuciones de implementaciones de este grupo que no eligen uno. Vacío significa Proceso.',
      active: 'Los grupos inactivos no aceptan ejecuciones nuevas.'
    },
    runs: {
      ...TELEMETRY,
      id: 'Identificador de la ejecución. Haz clic en la fila para abrir la transcripción, el resultado y la telemetría.',
      agentName: 'El agente que se invocó. Una ejecución siempre pertenece a un despliegue de ese agente.',
      status: 'En qué punto de su ciclo de vida está la ejecución: en cola, concedida, en ejecución o en uno de los estados finales.',
      outcome: 'Por qué terminó la ejecución, con más detalle que el estado, por ejemplo "Faltan credenciales".',
      harnessType: 'El harness que ejecutó la ejecución, tomado del perfil del despliegue.',
      leaseNodeName: 'El nodo de trabajo que la ejecutó. Vacío mientras la ejecución sigue en cola.',
      depth: 'A cuántos niveles de llamadas entre agentes está esta ejecución. 0 es una ejecución iniciada directamente por un cliente.',
      createdUtc: 'Cuándo se solicitó la ejecución. Pasa el cursor sobre el valor para ver la hora exacta.',
      actions: {
        cancel: 'Detiene esta ejecución. El nodo de trabajo termina el proceso del harness y la ejecución acaba como "Cancelada".',
        retry: 'Inicia una ejecución nueva con la misma entrada y el mismo despliegue. La ejecución original se conserva.'
      },
      conversationId: 'La conversación de la que esta ejecución es un turno, con su número de turno. Vacío en ejecuciones fuera de una conversación.',
      conversationTurn: 'Posición de esta ejecución en su conversación; el turno que la inició es el 1.'
    },
    nodes: {
      containerized: 'Si el nodo de trabajo se ejecuta dentro de un contenedor o pod, según lo informó al registrarse. Las ejecuciones de Codex en un nodo de trabajo en contenedor usan por defecto el sandbox danger-full-access, porque el contenedor es el límite de aislamiento.',
      name: 'Nombre del nodo, normalmente el nombre del pod de Kubernetes del nodo de trabajo.',
      status: 'Si el nodo acepta ejecuciones nuevas. Acordona o drena un nodo antes del mantenimiento.',
      capacity: 'Ejecuciones que tiene el nodo ahora frente al máximo que acepta a la vez.',
      harnesses: 'Harnesses que el nodo encontró instalados y funcionando al comprobarlos durante el arranque.',
      executors: 'Ejecutores que ofrece el nodo. Job de Kubernetes solo aparece cuando el worker se ejecuta en un clúster con permiso para crear Jobs.',
      labels: 'Etiquetas de clave y valor que anuncia el nodo. Los selectores de nodo de los despliegues se comparan con ellas.',
      nodeVersion: 'Versión del software de trabajo en el nodo.',
      lastHeartbeatUtc: 'Cuándo se reportó el nodo por última vez. Los nodos que dejan de reportarse se marcan como perdidos.',
      address: 'Dirección informativa que reportó el nodo.',
      maxConcurrentRuns: 'Número máximo de ejecuciones que este nodo acepta a la vez.',
      childReserveSlots: 'Espacios extra para ejecuciones delegadas cuyo padre las espera: se abre uno por cada ejecución de este nodo que espera a una hija, hasta este número.',
      maxResidentWaiters: 'Máximo de ejecuciones de este nodo que pueden esperar a una ejecución delegada a la vez. 0 significa su capacidad. Una delegación por encima falla con DelegationCapacityExhausted.',
      activeRuns: 'Ejecuciones que tiene el nodo en este momento.',
      capabilities: 'Qué encontró cada comprobación de harness: tipo, versión detectada y si se puede usar.',
      labelsItems: { key: 'Nombre de la etiqueta, comparado por los selectores de nodo de los despliegues.', value: 'Valor de la etiqueta, comparado exactamente por los selectores de nodo de los despliegues.' },
      capabilitiesItems: {
        harnessType: 'Harness que comprobó la sonda.',
        detectedVersion: 'Cadena de versión que informó el harness.',
        available: 'Si el harness puede ejecutarse en este nodo.',
        detail: 'Salida de la comprobación, útil cuando un harness no está disponible.'
      },
      actions: {
        grafana: 'Abre en una pestaña nueva el panel Workers de Grafana, filtrado al nodo {{node}}.',
        cordon: 'Deja de enviar ejecuciones nuevas a este nodo. Las ejecuciones que ya tiene terminan con normalidad.',
        uncordon: 'Permite que este nodo vuelva a aceptar ejecuciones nuevas.',
        drain: 'Detiene las ejecuciones nuevas y deja terminar las actuales; después el nodo queda inactivo. Úsalo antes de apagarlo.',
        runs: 'Abre la lista de ejecuciones filtrada por las que ejecutó este nodo.'
      }
    },
    controlNodes: {
      name: 'Nombre de la réplica: el ID de nodo con el que se ejecuta el servidor (GARRISON_NODE_ID, el nombre del pod en Kubernetes).',
      status: 'Ciclo de vida de la réplica: Iniciando, Listo, Drenando o Desconectado. Solo las réplicas listas atienden tráfico.',
      version: 'Versión del servidor Garrison que ejecuta esta réplica. Solo debería haber versiones distintas durante una actualización gradual.',
      schemaVersion: 'Versión del esquema de la base de datos que la réplica encontró al iniciarse. Todas las réplicas deberían informar el mismo número.',
      backplane: 'Cómo comparte esta réplica los eventos en vivo (flujos de ejecuciones, actualizaciones por WebSocket) con las demás réplicas.',
      uptime: 'Cuánto tiempo lleva en marcha el proceso de la réplica, contado desde su inicio. Pasa el puntero para ver el inicio exacto.',
      lastHeartbeatUtc: 'Cuándo envió la réplica su último latido. Las réplicas envían uno cada 5 segundos; si tiene más de 15 segundos se resalta como sin latido.',
      activeRequests: 'Solicitudes HTTP que la réplica estaba atendiendo en su último latido.',
      openStreams: 'Flujos de eventos enviados por el servidor y conexiones WebSocket abiertos en la réplica en su último latido.',
      heldLongPolls: 'Sondeos largos de concesión de los nodos de trabajo que la réplica retenía en su último latido. Los nodos de trabajo inactivos esperan ahí nuevas ejecuciones.',
      address: 'Dirección IP y puerto REST de la réplica, tal como los informó.',
      hostname: 'Nombre de host de la máquina o del pod donde se ejecuta la réplica.',
      startedUtc: 'Cuándo se inició el proceso de la réplica, en tu zona horaria local.',
      id: 'ID de nodo de la réplica. Coincide con respondingNodeId en las respuestas de la API y con la etiqueta node de las métricas.',
      isLeader: 'Si esta réplica tiene la concesión de líder para el mantenimiento. Solo una réplica es líder a la vez.',
      leaderEpoch: 'Época de exclusión (fencing) de la concesión de líder. Aumenta cada vez que el liderazgo pasa a otra réplica.',
      respondingNodeId: 'La réplica que respondió a esta lectura individual. Detrás de un balanceador de carga puede ser distinta de la réplica mostrada.',
      answeredBy: 'El nodo de control que respondió a la solicitud de esta lista (respondingNodeId). Detrás de un balanceador de carga, cada actualización puede responderla una réplica distinta.',
      badges: {
        leader: 'Líder: esta réplica tiene la concesión de mantenimiento. Se encarga de la limpieza por retención, marca como desconectadas las réplicas en silencio y hace el resto del mantenimiento del clúster.',
        leaderEpoch: 'Líder: esta réplica tiene la concesión de mantenimiento (época {{epoch}}). Se encarga de la limpieza por retención, marca como desconectadas las réplicas en silencio y hace el resto del mantenimiento del clúster.',
        stale: 'Sin latido: no llega ningún latido desde hace más de {{seconds}} segundos, aunque las réplicas envían uno cada 5 segundos. La réplica puede estar sobrecargada, aislada o caída; el líder la marca como desconectada a los 30 segundos.'
      },
      actions: {
        grafana: 'Abre el panel de resumen de Garrison en Grafana en una pestaña nueva, filtrado por el nodo de control {{node}}.'
      }
    },
    audit: {
      createdUtc: 'Cuándo ocurrió el evento, en tu zona horaria local.',
      eventType: 'Qué tipo de evento de seguridad o de configuración fue.',
      principalName: 'Quién lo hizo: un usuario, una clave de acceso o una ejecución que actúa en nombre de un agente.',
      resource: 'El tipo de registro y la operación implicados, por ejemplo Agent / Read.',
      reason: 'Por qué ocurrió el evento o por qué se denegó el acceso.',
      sourceIp: 'Dirección de red de la que vino la solicitud.',
      principalType: 'Si quien actuó fue un usuario, una clave de acceso o un token de ejecución.',
      principalId: 'Identificador del usuario, la clave de acceso o la ejecución que actuó.',
      resourceType: 'Tipo de registro implicado, como Agent o Secret.',
      resourceId: 'Identificador del registro implicado.',
      operation: 'Operación que se intentó, como Read o Execute.',
      method: 'Método HTTP de la solicitud.',
      path: 'Ruta de la solicitud que causó el evento.',
      authResult: 'Resultado de comprobar quién es el llamante.',
      authorizationResult: 'Resultado de comprobar qué puede hacer el llamante.',
      bypassReason: 'Por qué se omitió la autorización, por ejemplo por ser administrador del sistema.',
      statusCode: 'Estado HTTP devuelto al llamante.',
      requestId: 'Identificador de la solicitud. Úsalo para buscar en el historial de solicitudes o en los registros del servidor.'
    },
    manifestApplies: {
      createdUtc: 'Cuándo se aplicó o se simuló el manifiesto.',
      principalName: 'El usuario o la clave de acceso que aplicó el manifiesto.',
      dryRun: '"Sí" significa que solo se validó y no se escribió nada.',
      counts: 'Cuántos documentos crearon, actualizaron, dejaron sin cambios o fallaron registros.'
    },
    conversations: {
      title: 'La primera línea del primer mensaje, que da nombre a la conversación. Haz clic en la fila para abrir sus turnos.',
      agentName: 'El agente con el que es la conversación. Cada turno va a este agente.',
      state: 'Trabajando mientras un turno no ha terminado; hasta entonces se rechaza un mensaje nuevo. En espera cuando ya se puede enviar el siguiente mensaje.',
      turnCount: 'Cuántos turnos (ejecuciones) ha tenido la conversación, incluidos los fallidos.',
      affinityNodeName: 'El nodo worker que guarda el espacio de trabajo y la sesión del harness de la conversación. El siguiente turno prefiere este nodo para poder reanudar.',
      fallbackCount: 'Cuántos turnos no pudieron reanudar la sesión del harness y empezaron una sesión nueva con la transcripción de los turnos anteriores.',
      lastFallbackReason: 'Por qué el turno reconstruido más reciente no pudo reanudar la sesión; por ejemplo, el nodo de afinidad no estaba listo.',
      harnessType: 'El harness que ejecuta cada turno, tomado del despliegue del primer turno.',
      callerName: 'Quién inició la conversación: un usuario, una clave de acceso o la ejecución de otro agente.',
      contextId: 'El ID de contexto A2A que envió el cliente, cuando la conversación llegó por A2A. Vacío en conversaciones iniciadas por REST o MCP.',
      sessionId: 'La sesión del harness que reanuda el siguiente turno. Vacío hasta que un turno informe una.',
      lastActivityUtc: 'Cuándo se envió o terminó el último turno. Pasa el puntero sobre el valor para ver la hora exacta.',
      createdUtc: 'Cuándo el primer turno inició la conversación. Pasa el puntero sobre el valor para ver la hora exacta.',
      id: 'Identificador de la conversación. Pásalo como conversationId al invocar el agente para enviar el siguiente turno.',
      fallbackLast: 'Turnos que empezaron una sesión nueva a partir de la transcripción. Motivo más reciente: {{reason}}.',
      states: {
        busy: 'Un turno de esta conversación sigue en cola o en ejecución. Espera a que termine, o cancélalo, antes de enviar el siguiente mensaje.',
        idle: 'No hay ningún turno en curso. El siguiente mensaje continúa la conversación.'
      },
      actions: {
        continue: 'Abre Invocar con esta conversación seleccionada, para que el siguiente mensaje se envíe como su siguiente turno.',
        runs: 'Abre la lista de ejecuciones filtrada a los turnos de esta conversación, con todas las columnas y filtros de ejecuciones.'
      }
    }
  },
  views: {
    approvalDetail: {
      openRun: 'Abre la ejecución que preguntó, para leer su transcripción alrededor de esta llamada a herramienta.',
      openAgent: 'Abre la página del agente con sus despliegues y ejecuciones recientes.',
      openDeployment: 'Abre la pestaña Despliegues filtrada por este despliegue, donde se editan sus reglas de aprobación.',
      backToInbox: 'Vuelve a la bandeja de aprobaciones con todas las aprobaciones pendientes.',
      viewJson: 'Muestra el registro completo de la aprobación como JSON, exactamente como lo devuelve la API.',
      request: 'Lo que el harness pidió hacer: el resumen de una línea y la entrada completa de la herramienta con los secretos censurados.',
      rules: 'La regla del despliegue que coincidió, la regla que sugiere esta llamada y la regla recordada a partir de la decisión.',
      copyRule: 'Copia la regla sugerida, por ejemplo para pegarla en las reglas de aprobación del despliegue.'
    },
    home: {
      observabilityState: {
        reachable: 'El servidor alcanzó {{service}} en su URL interna en los últimos 30 segundos.',
        unreachable: 'El servidor no pudo alcanzar {{service}} en su URL interna. Comprueba que el servicio esté en marcha y que el ajuste de URL interna apunte a él.',
        checking: 'Preguntando al servidor si {{service}} es accesible.',
        unknown: 'El servidor no informó si {{service}} es accesible. La comprobación de estado falló o este servidor aún no la admite.'
      },
      observabilityVersion: 'Versión que {{service}} informó en la comprobación de estado del servidor.',
      kpisGrafana: 'Abre en una pestaña nueva el panel de resumen de Garrison en Grafana para ver estas cifras a lo largo del tiempo.',
      grafanaDashboards: 'La carpeta Garrison de Grafana tiene un panel por sección. Cada enlace abre ese panel en una pestaña nueva.',
      grafanaSections: {
        overview: 'Estado de un vistazo: réplicas y workers activos, tasas de ejecuciones y solicitudes, errores, coste y problemas recientes.',
        http: 'Tráfico REST por ruta: tasa de solicitudes, percentiles de latencia, errores, tamaños de carga, fallos de autenticación y solicitudes en curso.',
        runs: 'Ciclo de vida de las ejecuciones: creadas y finalizadas por resultado, duración de cada etapa, cancelaciones, validación de salida estructurada y reparaciones.',
        agents: 'Rendimiento por agente: invocaciones, percentiles de duración y de espera en cola, tiempo hasta el primer token, tiempo de streaming, resultados y activaciones de protecciones.',
        models: 'Uso de tokens y coste por modelo y agente: tokens de entrada, salida, caché y razonamiento, coste y rendimiento de salida.',
        workers: 'Nodos worker: asignaciones, ejecuciones por nodo, informes de finalización, latidos, huecos libres y llamadas al plano de control.',
        kubernetes: 'Ejecutor de un pod por ejecución: Jobs creados y eliminados, latencia de arranque del pod, fallos de pod por motivo y limpieza de huérfanos.',
        protocols: 'MCP, A2A y streaming: llamadas a herramientas y su duración, sesiones, métodos A2A y estados de tareas, flujos SSE, WebSockets y delegación.',
        scheduler: 'Planificación: profundidad de la cola por agente y harness, resultados y latencia de reclamación, sondeos largos de asignación, ejecuciones bloqueadas y asignaciones caducadas.',
        database: 'Base de datos: latencia de sentencias por operación y tabla, errores, conexiones en uso, esperas del bloqueo de escritura y retención.',
        controlPlane: 'Réplicas del plano de control: estado, cambios de líder, tráfico y retraso del backplane, latidos e iteraciones de los servicios en segundo plano.',
        security: 'Fallos de autenticación por esquema y motivo, denegaciones de autorización, limitación de tasa, tokens emitidos, descifrado de secretos y renovaciones de tokens de Codex.',
        integrations: 'Llamadas salientes por servicio: pruebas de servidores MCP, sondeos de observabilidad, el proxy MCP, la API de Kubernetes y el plano de control desde los workers.',
        logs: 'Volumen de registros, errores y advertencias por componente e inquilino, líneas de error recientes y enlaces a trazas.',
        autonomy: 'Guardianes: ticks por resultado y origen del despertar, despertares omitidos y fallidos, retraso de inicio de los ticks y los intervalos que aplica el planificador.'
      },
      observabilityDocs: 'Abre la guía de telemetría en una pestaña nueva: cómo recoger las métricas de Garrison y conectar Grafana, Prometheus, Tempo o Loki.',
      observability: 'Enlaces a las herramientas de métricas, paneles y trazas que esta instalación declara como configuradas. Los servicios sin configurar no se muestran.',
      kpis: {
        agents: 'Agentes definidos en este inquilino. Haz clic para abrir la lista de agentes.',
        deployments: 'Despliegues de todos los agentes. Cada uno es una forma en que puede ejecutarse un agente. Haz clic para abrirlos.',
        activeRuns: 'Ejecuciones concedidas o en ejecución en un nodo de trabajo ahora mismo. Haz clic para verlas.',
        queued: 'Ejecuciones que esperan un nodo de trabajo. Si el número no deja de crecer, necesitas más nodos o más capacidad.',
        succeeded: 'Ejecuciones que terminaron correctamente en las últimas 24 horas. Haz clic para listarlas.',
        failed: 'Ejecuciones que fallaron en las últimas 24 horas. Haz clic para listarlas y ver por qué.',
        nodes: 'Nodos de trabajo listos para aceptar ejecuciones, del total de nodos registrados. Haz clic para gestionarlos.',
        controlNodes: 'Réplicas del plano de control que están listas, del total de réplicas registradas (las filas desconectadas siguen en la lista 24 horas). El líder es {{leader}}. Haz clic para abrir Flota > Plano de control.',
        controlNodesNoLeader: 'Réplicas del plano de control que están listas, del total de réplicas registradas (las filas desconectadas siguen en la lista 24 horas). Ahora mismo ninguna réplica tiene la concesión de líder, así que el mantenimiento del clúster está en pausa. Haz clic para abrir Flota > Plano de control.'
      },
      openFailure: 'Abre esta ejecución fallida para leer su transcripción, su error y Stderr.',
      openControlPlane: 'Abre Flota > Plano de control para ver cada réplica con su estado, si es el líder, su versión, su latido y su actividad.',
      openWorkers: 'Abre Flota > Nodos de trabajo para ver cada nodo de trabajo con su capacidad, sus harnesses y su latido, y para acordonarlo o drenarlo.',
      cta: {
        invoke: 'Envía un mensaje a cualquier agente desde el navegador.',
        addAgent: 'Ve a "Agentes" para crear una nueva identidad de agente.',
        applyManifest: 'Aplica configuración como YAML, por ejemplo un agente de ejemplo.',
        inspectRuns: 'Explora todas las ejecuciones con filtros y telemetría.',
        nodes: 'Consulta qué nodos de trabajo están listos y qué pueden ejecutar.',
        apiExplorer: 'Prueba cualquier llamada a la API en vivo contra este servidor.',
        analytics: 'Consulta la velocidad de ejecución, los tokens, el coste y los resultados a lo largo del tiempo.'
      },
      services: {
        loki: 'Abre Loki en una pestaña nueva para buscar en los registros de Garrison.',
        grafana: 'Abre en una pestaña nueva los paneles de Grafana con las métricas de Garrison.',
        prometheus: 'Abre en una pestaña nueva el servidor Prometheus que recopila las métricas de Garrison.',
        tempo: 'Abre Tempo en una pestaña nueva para explorar trazas.'
      },
      serviceGeneric: 'Abre este servicio incluido en una pestaña nueva.'
    },
    runDetail: {
      openApproval: 'Abre esta aprobación con la entrada completa de la herramienta, la regla y la decisión.',
      reviewApprovals: 'Muestra las aprobaciones de esta ejecución, donde puedes permitir o denegar las llamadas a herramientas pendientes.',
      approvalActions: 'Permite o deniega una llamada a herramienta pendiente, o abre la aprobación para ver todos los campos.',
      viewTrace: 'Abre en una pestaña nueva la traza de esta ejecución en Grafana Explore (Tempo). Muestra los tramos de compilación, asignación y harness en el servidor y en el nodo de trabajo.',
      viewLogs: 'Abre en una pestaña nueva las líneas de registro del servidor y del worker sobre esta ejecución en Grafana Explore (Loki), limitadas al intervalo de la ejecución.',
      traceId: 'ID de traza W3C de la traza en la que se compiló esta ejecución. Búscalo en Tempo o usa Ver traza. Vacío en las ejecuciones creadas antes de que se registraran los ID de traza.',
      eventCode: 'Qué tipo de mensaje escribió Garrison aquí, en tu idioma. El texto de al lado es el mensaje original del servidor o del worker.',
      openTemplate: 'Abre la plantilla {{name}}. Esta ejecución usó la versión {{version}}; la pestaña Versiones muestra ese contenido y la diferencia con el actual.',
      templatesUsed: 'Las versiones exactas de las plantillas de prompt con las que se compiló esta ejecución. Haz clic en una para abrir la plantilla y comparar versiones.',
      live: 'Los eventos llegan en vivo desde el servidor a medida que el harness los produce.',
      viewJson: 'Muestra el registro completo de la ejecución como JSON, con todos los campos de telemetría.',
      deployment: 'El despliegue que se eligió para esta ejecución, por nombre o por peso de tráfico.',
      model: 'El modelo que el harness informó haber usado realmente, que puede diferir del modelo solicitado por el despliegue.',
      tokens: 'Tokens de entrada y de salida de toda la ejecución. El panel de telemetría de abajo tiene el desglose completo.',
      caller: 'Quién inició la ejecución: un usuario, una clave de acceso o la ejecución de otro agente.',
      parent: 'La ejecución que delegó en esta, cuando un agente llamó a otro agente.',
      openParent: 'Abre la ejecución principal que delegó este trabajo.',
      attempt: 'Qué intento es este, del máximo que permite el despliegue.',
      outputSchema: 'Indica si la salida final coincidió con el JSON Schema de salida del agente. Si no coincidió y el harness puede reanudar su sesión, Garrison envía una solicitud de reparación en la misma sesión. Los eventos de advertencia de la transcripción enumeran los errores de validación.',
      created: 'Cuándo se solicitó la ejecución.',
      started: 'Cuándo se inició el proceso del harness en el nodo de trabajo.',
      completed: 'Cuándo llegó la ejecución a su estado final.',
      exitCode: 'Código de salida del proceso del harness. El éxito suele decidirse por el evento final, no por este código.',
      tabs: {
        approvals: 'Llamadas a herramientas para las que esta ejecución pidió permiso, cómo se decidió cada una, y Permitir y Denegar para las pendientes.',
        transcript: 'Todos los eventos que produjo el harness: texto del asistente, razonamiento, llamadas a herramientas y sus resultados, y uso.',
        result: 'La respuesta final y cualquier salida estructurada.',
        input: 'Lo que envió el cliente, los parámetros y las versiones exactas de las plantillas de prompt usadas.',
        stderr: 'La última parte de la salida de error estándar del harness, sin secretos. Mira aquí cuando falla una ejecución.',
        children: 'Ejecuciones que inició esta ejecución al llamar a otros agentes.'
      },
      eventFilter: 'Muestra solo un tipo de evento, como llamadas a herramientas o errores.',
      openChild: 'Abre esta ejecución secundaria, iniciada cuando esta ejecución llamó a otro agente.',
      eventCodes: {
        ApprovalRequested: 'El harness preguntó antes de una llamada a herramienta y la llamada espera a una persona. Decídela en la pestaña Aprobaciones.',
        ApprovalDecided: 'Una solicitud de permiso se decidió por una regla, el valor predeterminado del despliegue, una persona o un tiempo de espera. El texto indica cuál.',
        RunGuardTriggered: 'Una protección detuvo esta ejecución. El mensaje indica qué protección actuó y qué vio; la ejecución termina como Fallida con el resultado de esa protección y conserva su salida parcial.',
        ConversationFallback: 'Este turno no pudo reanudar la sesión del harness de la conversación, así que empezó una sesión nueva con la transcripción de los turnos anteriores. El mensaje indica el motivo.',
        ConversationStateLost: 'El nodo tomó este turno, pero faltaban los directorios de la conversación, así que el turno volvió a la cola para ejecutarse reconstruido.'
      },
      conversation: 'La conversación de la que esta ejecución es un turno, y su número de turno. Haz clic para abrir la conversación.',
      openConversation: 'Abre la conversación con todos sus turnos y un cuadro para enviar el siguiente.',
      conversationSession: 'Si este turno reanudó la sesión del harness de la conversación o empezó una nueva a partir de la transcripción, y por qué.',
      resumeSessionId: 'La sesión del harness que reanudó este turno, dejada por el turno anterior.',
      affinityNode: 'El nodo que guarda los directorios de la conversación. Los demás nodos dejan el turno hasta la hora indicada, salvo que este nodo deje de estar listo.'
    },
    agentDetail: {
      name: 'El nombre que usan los clientes para invocar a este agente.',
      viewJson: 'Muestra el registro completo del agente como JSON.',
      invoke: 'Abre "Invocar" con este agente seleccionado. Se elige un despliegue por peso, salvo que elijas uno.',
      grafana: 'Abre en una pestaña nueva el panel de agentes de Grafana filtrado a este agente: invocaciones, percentiles de duración, tiempo hasta el primer token, tiempo de streaming, tokens, coste y activaciones de protecciones.',
      id: 'Identificador del agente para las llamadas a la API.',
      tabs: {
        deployments: 'Las formas en que se ejecuta este agente, con sus pesos y la parte del tráfico que recibe cada una.',
        runs: 'Las ejecuciones más recientes de este agente.',
        card: 'La tarjeta de agente A2A que leen otros agentes para descubrir este agente.'
      },
      addDeployment: 'Ve a "Despliegues" para crear uno para este agente. Sin despliegue no puede ejecutarse.',
      manageDeployments: 'Abre la pestaña "Despliegues" para editar pesos, modelos y vínculos.',
      openRun: 'Abre la transcripción y la telemetría de esta ejecución.',
      columns: {
        name: 'Nombre del despliegue. Los clientes pueden indicarlo explícitamente para saltarse la elección ponderada.',
        harness: 'El perfil de harness que lanza la CLI para este despliegue.',
        model: 'El modelo que este despliegue pide usar al harness.',
        weight: 'El peso de tráfico bruto definido en el despliegue.',
        traffic: 'Parte de las invocaciones que recibe este despliegue: su peso dividido entre la suma de los pesos activos.',
        active: 'Solo los despliegues activos reciben tráfico ponderado.'
      },
      conversations: 'Abre la lista de conversaciones filtrada a este agente.'
    },
    queue: {
      queued: 'Ejecuciones que esperan un nodo. Haz clic para listarlas.',
      leased: 'Ejecuciones que un nodo ha reclamado pero que aún no ha iniciado. Haz clic para listarlas.',
      running: 'Ejecuciones en curso ahora. Haz clic para listarlas.',
      agent: 'El agente al que pertenece el trabajo en espera.',
      harness: 'El harness que necesitan esas ejecuciones. Solo los nodos que lo anuncian pueden aceptarlas.'
    },
    invoke: {
      stream: {
        tabs: {
          preview: 'Sigue la respuesta mientras se transmite, con formato Markdown, razonamiento y llamadas a herramientas. Se selecciona mientras hay una ejecución en curso.',
          response: 'El resultado final de la ejecución: texto del resultado (con formato o sin él), salida estructurada, resultado, errores, telemetría y enlaces.'
        },
        live: 'La ejecución está en curso. Esta vista se actualiza a medida que llega la salida por el flujo de eventos en vivo.',
        finished: 'La ejecución terminó y no llegará más salida. La pestaña Respuesta tiene el resultado final.',
        elapsed: 'Tiempo desde que hiciste clic en Enviar, medido en tu navegador. Se detiene cuando termina la ejecución.',
        firstToken: 'Tiempo desde Enviar hasta la primera salida transmitida (texto o razonamiento), medido en tu navegador, así que incluye la cola y el arranque del harness. La página de la ejecución muestra el valor medido por el worker.',
        tokensPerSecond: 'Tokens de salida por segundo durante la transmisión, según el uso que informó el harness. Al terminar la ejecución muestra la tasa medida por el servidor.',
        codexNote: 'Codex imprime cada mensaje solo cuando está completo (codex exec --json), así que nada se transmite token a token. El tiempo transcurrido sigue contando mientras trabaja.',
        showResponse: 'Cambia a la pestaña Respuesta para ver el resultado final, la salida estructurada y la telemetría.',
        reasoning: 'Texto de razonamiento que el modelo produjo antes o entre respuestas. Plegado por defecto; haz clic para desplegarlo.',
        jump: 'Desplázate a la salida más reciente y vuelve a seguir el flujo a medida que llega.',
        tool: {
          running: 'El agente llamó a la herramienta {{name}} y espera su resultado.',
          ok: 'La herramienta {{name}} devolvió un resultado sin errores.',
          failed: 'La herramienta {{name}} devolvió un error. El agente puede reintentarla o continuar sin ella.'
        }
      },
      applySample: 'Ve a "Manifiestos", donde el manifiesto de ejemplo crea un agente que puedes probar enseguida.',
      agent: 'El agente al que se llama. Solo se listan los agentes activos.',
      deployment: 'Déjalo en "Cualquier despliegue activo (ponderado)" para que Garrison elija por peso de tráfico, o elige un despliegue para probarlo directamente.',
      parameter: 'Valor por ejecución de {{name}}. El despliegue permite a los clientes sobrescribirlo; déjalo vacío para usar el predeterminado.',
      message: 'Lo que quieres que haga el agente. Se envía como entrada de la ejecución, envuelto por la plantilla de tarea.',
      send: 'Inicia una ejecución con este mensaje y transmite aquí su transcripción.',
      openRun: 'Abre la página completa de la ejecución con el resultado, la telemetría y Stderr.',
      stopOnLeave: 'Si está activado, Garrison cancela la ejecución en curso cuando sales de esta página, cierras la pestaña o envías un mensaje nuevo, para que nadie pague por una salida que nadie lee. Desactívalo para que las ejecuciones sigan; quedan en la página Ejecuciones. Se recuerda en este navegador.',
      cancel: 'Detén esta ejecución ahora. El nodo de trabajo termina el proceso del harness en unos segundos y se conserva la salida obtenida.',
      cancelling: 'Cancelación solicitada. El nodo de trabajo está deteniendo el harness; cambia al estado final cuando la ejecución informe Cancelada.',
      sendReplaces: 'Cancela la ejecución en curso y luego inicia una nueva con este mensaje. Desactiva "Detener la ejecución al salir" para que la ejecución actual siga.',
      sendKeeps: 'Inicia una ejecución nueva con este mensaje. La ejecución en curso sigue porque "Detener la ejecución al salir" está desactivado; la encontrarás en la página Ejecuciones.',
      timeLimit: 'Plazo opcional de esta ejecución, en segundos, que este despliegue permite fijar. Déjalo vacío para usar el valor del despliegue. La ejecución agota el tiempo cuando supera el límite.',
      timePreset: 'Fija el límite de tiempo de esta ejecución en {{value}}.',
      timePresetClear: 'Quita el límite de tiempo para que la ejecución use el valor del despliegue.',
      conversation: {
        mode: 'Ejecuta una sola vez, inicia una conversación nueva cuyos turnos posteriores reanudan esta sesión del harness, o envía el siguiente turno de una conversación existente.',
        pick: 'La conversación que continuar. Solo aparecen las conversaciones de este agente, de la más reciente a la más antigua.',
        deploymentPinned: 'Una conversación se queda en el despliegue de su primer turno, así que el despliegue es fijo mientras la continúas.',
        open: 'Abre la conversación a la que pertenece esta ejecución, con todos sus turnos y un cuadro para enviar el siguiente.'
      }
    },
    manifests: {
      warnings: 'Valores de este documento que se aceptaron pero se guardaron de otra forma, por ejemplo un número fuera de su rango que se ajustó. La lista bajo la fila indica cada campo.',
      planned: 'Lo que haría aplicar este documento: crear el registro, actualizarlo o dejarlo igual. Una simulación solo valida y no cambia nada.',
      changes: { after: 'El valor que establece el manifiesto. Los valores largos se cortan a 200 caracteres.', before: 'El valor guardado ahora. Los valores largos se cortan a 200 caracteres.', field: 'El ajuste de este registro que cambia el manifiesto, por ejemplo model o parameters.model.' },
      results: 'Qué hizo la aplicación con cada documento del manifiesto.',
      kind: 'El tipo de registro que describe el documento, como Agent o Deployment.',
      name: 'El nombre del registro según los metadatos del documento.',
      result: 'Si el documento creó, actualizó o dejó sin cambios un registro, o si falló.',
      message: 'Detalles del servidor, como un error de validación.',
      tabs: {
        apply: 'Pega o sube un manifiesto, valídalo con una simulación y aplícalo.',
        export: 'Descarga la configuración de este inquilino como manifiesto. Los valores de los secretos nunca se incluyen.',
        history: 'Todas las aplicaciones y simulaciones anteriores, con los resultados de cada documento.'
      },
      upload: 'Carga en el editor un archivo de manifiesto YAML o JSON desde tu equipo.',
      loadSample: 'Reemplaza el contenido del editor por el manifiesto de ejemplo: un agente de eco sobre el harness simulado.',
      document: 'Uno o más documentos YAML o JSON separados por ---. Los registros se referencian entre sí por nombre.',
      dryRun: 'Valida todos los documentos y muestra lo que cambiaría, sin escribir nada.',
      apply: 'Valida y escribe todos los documentos. Si alguno falla, no se escribe nada.',
      export: 'Genera un manifiesto que recrea la configuración de este inquilino.',
      download: 'Guarda el manifiesto exportado como archivo YAML.',
      confirmApply: 'Escribe ahora el manifiesto en este inquilino.'
    },
    templateEditor: {
      cloneName: 'Nombre de la copia. Funcionan bien minúsculas, dígitos, guiones y barras; el prefijo builtin/ está reservado.',
      cloneConfirm: 'Crea la copia con este nombre y ábrela en el editor.',
      clone: 'Crea una copia editable de esta plantilla. Eliges el nombre de la copia antes de crearla.',
      reset: 'Restaura esta plantilla integrada al contenido que trae Garrison.',
      delete: 'Elimina esta plantilla y sus versiones. El servidor lo rechaza mientras algún despliegue la vincule; la confirmación los enumera.',
      create: 'Crea la plantilla y su primera versión.',
      save: 'Guarda el contenido como una versión nueva. Los despliegues que siguen la versión más reciente la usan en las ejecuciones nuevas.',
      content: 'El texto de la plantilla. Usa {{variables}}, condiciones, bucles e inclusiones; la vista previa se actualiza mientras escribes.',
      changeNote: 'Una nota breve que se guarda con la versión y explica qué cambió y por qué.',
      tabs: {
        preview: 'Renderiza la plantilla con el contexto de ejemplo para ver exactamente lo que recibiría un harness.',
        versions: 'Todas las versiones guardadas, con comparación y restauración.'
      },
      sampleContext: 'JSON que sustituye a los datos de una ejecución real. Edítalo para ver cómo reacciona la plantilla.',
      columns: {
        version: 'Número de versión. Cuanto más alto, más reciente.',
        note: 'La nota de cambio guardada con la versión.',
        author: 'Quién guardó esta versión de la plantilla.',
        saved: 'Cuándo se guardó la versión.'
      },
      diff: 'Compara esta versión con lo que hay ahora en el editor.',
      restore: 'Vuelve a hacer actual esta versión. El contenido actual se queda en el historial.'
    },
    serverInfo: {
      serverInUse: 'La dirección a la que esta consola envía las llamadas a la API. Es GARRISON_API_URL si está definido; si no, el origen del propio panel.',
      rest: 'Dirección base para las llamadas a la API REST y los SDK.',
      mcp: 'Dirección a la que se conectan los clientes MCP. Ahí aparece cada agente expuesto como herramienta.',
      a2a: 'Dirección base de la pasarela A2A para este inquilino. Cada agente tiene su propia tarjeta debajo de ella.',
      openapi: 'El documento OpenAPI que describe todas las operaciones REST.',
      version: 'Versión del servidor de Garrison.',
      dashboardVersion: 'Versión de esta consola.',
      node: 'La réplica del plano de control (nodo de control) que respondió a la solicitud de información del servidor de esta página. Con varias réplicas, al recargar puede responder otra.',
      nodeLink: 'Abre Flota > Plano de control para ver esta réplica junto a las demás, con su estado, su latido y si es el líder.',
      database: 'Motor de base de datos que usa el servidor.',
      health: 'Resultado de la comprobación de estado del servidor.',
      replicas: 'Cuántas réplicas del plano de control espera el clúster.',
      routes: 'Cuántas operaciones de API registró el servidor.',
      serverTime: 'El reloj del servidor. Las diferencias grandes con tu reloj pueden romper las solicitudes firmadas.',
      principalName: 'La identidad con la que has iniciado sesión.',
      principalType: 'Si iniciaste sesión como usuario o con una clave de acceso.',
      role: 'Tu nivel de acceso más alto.',
      tenant: 'El inquilino al que pertenece tu sesión.',
      expires: 'Cuándo termina tu sesión y tendrás que volver a iniciar sesión.',
      rawJson: 'Muestra la respuesta sin procesar con la información del servidor.'
    },
    requests: {
      grafana: 'Abre en una pestaña nueva el panel HTTP de Grafana: tasas de solicitudes, latencia y errores a lo largo del tiempo a partir de las métricas de Prometheus.',
      kpis: {
        total: 'Solicitudes que el servidor guardó en su historial para el rango y los filtros seleccionados.',
        success: 'Solicitudes que devolvieron un estado 2xx o 3xx.',
        failure: 'Solicitudes que devolvieron un estado 4xx o 5xx.',
        avgDuration: 'Tiempo medio que tardó el servidor en responder.'
      },
      columns: {
        time: 'Cuándo llegó la solicitud.',
        method: 'Método HTTP de la solicitud.',
        path: 'Ruta a la que se llamó. Pasa el cursor sobre un valor para verlo completo.',
        status: 'Estado HTTP que devolvió el servidor.',
        duration: 'Cuánto tardó el servidor en responder.',
        principal: 'Quién hizo la solicitud: un usuario, una clave de acceso o un token de ejecución.'
      },
      viewDetails: 'Abre la solicitud con sus encabezados, cuerpos y tiempos.',
      viewJson: 'Abre el registro de la solicitud, incluido su JSON sin procesar.',
      deleteOne: 'Quita esta solicitud del historial.',
      bulkDeleteAll: 'Elimina todas las solicitudes que coinciden con los filtros actuales, no solo las de esta página.'
    },
    explorer: {
      operations: 'Elige una operación de la API, agrupadas por área. El formulario de abajo se adapta a sus parámetros.',
      pathParam: 'Parámetro de ruta {{name}} ({{type}}). Se sustituye en la URL. {{description}}',
      queryParam: 'Parámetro de consulta {{name}} ({{type}}). Se añade a la URL cuando se rellena. {{description}}',
      copyUrl: 'Copia la URL de la solicitud completamente resuelta.',
      headerName: 'Nombre de un encabezado de la solicitud. Authorization se añade automáticamente a partir de tu sesión.',
      headerValue: 'Valor que se envía para este encabezado.',
      removeHeader: 'Quita este encabezado de la solicitud.',
      addHeader: 'Añade otro encabezado a la solicitud.',
      body: 'Cuerpo JSON de la solicitud para operaciones que crean o cambian registros.',
      execute: 'Envía ahora la solicitud al servidor con tu sesión. Los métodos destructivos piden confirmación.',
      stop: 'Cancela la solicitud o deja de leer una respuesta transmitida.',
      snippets: {
        curl: 'La misma solicitud como comando curl para una terminal.',
        fetch: 'La misma solicitud como código fetch de JavaScript.',
        csharp: 'La misma solicitud como código HttpClient de C#.'
      },
      clearHistory: 'Olvida todas las solicitudes recientes guardadas en este navegador.',
      loadHistory: 'Vuelve a cargar esta solicitud en el formulario.',
      deleteHistory: 'Quita esta entrada de la lista de solicitudes recientes.',
      confirmExecute: 'Envía esta solicitud aunque pueda cambiar o eliminar datos.'
    },
    settings: {
      settingPath: 'Ruta del ajuste: {{path}}. Usa este nombre en el archivo de ajustes y en la REST API de ajustes.',
      viewJson: 'Muestra la respuesta de configuración sin procesar.',
      restart: 'Reinicia esta réplica del plano de control para que se apliquen los ajustes que requieren reinicio.',
      save: 'Guarda todos los ajustes modificados. Los ajustes en vivo se aplican al instante; los demás esperan a un reinicio.',
      groupGeneric: 'Ajustes del grupo {{group}}.',
      fieldGeneric: 'Ajuste del servidor {{path}}.',
      applyLive: 'Se aplica inmediatamente al guardar.',
      applyRestart: 'Se aplica después de reiniciar el servidor.',
      source: {
        File: 'Definido actualmente en el archivo de configuración. Guardar aquí lo actualiza.',
        Environment: 'Definido por una variable de entorno, que prevalece sobre cualquier valor guardado aquí.',
        ConfigMap: 'Gestionado por un ConfigMap de Kubernetes. Cámbialo en tus manifiestos.',
        Database: 'Guardado como ajuste del clúster en la base de datos y compartido por todas las réplicas.'
      },
      sourceGeneric: 'De dónde proviene el valor actual.',
      testDatabase: 'Prueba a conectarte con los ajustes de base de datos de arriba antes de guardarlos.',
      groups: {
        Observability: 'Dónde están Grafana, Prometheus, Loki y Tempo. Las URL del navegador alimentan las tarjetas de Inicio y los enlaces a Grafana; las URL internas son las que el servidor comprueba. Vacío significa sin configurar.',
        Runtime: 'Cómo limita el plano de control las ejecuciones: lo máximo que puede durar una ejecución, los valores de protección que siguen los despliegues y cuánto puede esperar una ejecución en cola a un nodo de trabajo capaz.',
        Rest: 'Cómo escucha la API REST: host, puerto, TLS y dirección pública.',
        Mcp: 'Cómo escucha el servidor MCP y cuánto pueden esperar las llamadas a herramientas.',
        Database: 'Qué base de datos usa Garrison y cómo conectarse a ella.',
        Logging: 'Adónde van los registros y cuánto detalle tienen.',
        Auth: 'Firma de tokens, duraciones y límites de frecuencia de inicio de sesión.',
        Security: 'Clave maestra de cifrado y cuentas de arranque.',
        RequestHistory: 'Si se capturan las solicitudes a la API y cuánto se conserva de cada cuerpo.',
        Telemetry: 'Exportación de métricas y trazas.',
        Archive: 'Dónde se archivan las ejecuciones y los eventos antes de que la retención los elimine.',
        Cluster: 'Cuántas réplicas del plano de control se esperan.',
        Scheduling: 'Duración de las concesiones y tiempos de espera de latido de los nodos de trabajo.',
        Runs: 'Valores predeterminados de las ejecuciones y cuánto tiempo se conservan las ejecuciones y los eventos.',
        Audit: 'Cuánto tiempo se conservan los registros de auditoría.'
      },
      fields: {
        Runtime: {
          MaxRunSeconds: 'Lo máximo que puede durar cualquier ejecución, en segundos. Los tiempos de espera de despliegues, los límites por ejecución y los valores de perfil superiores se reducen a este valor.',
          RepetitionGuard: 'Si los despliegues que dejan vacía la Protección contra repeticiones detienen las ejecuciones cuya respuesta degenera en repeticiones (resultado Repetición detectada).',
          MaxAssistantChars: 'Caracteres de texto del asistente tras los que se detiene una ejecución (resultado Límite de salida superado), para despliegues que dejan vacío el límite. 0 es sin límite.',
          NoProgressSeconds: 'Segundos sin texto, razonamiento ni actividad de herramientas tras los que se detiene una ejecución (resultado Sin avance), para despliegues que dejan vacío el límite. 0 lo desactiva.',
          ConversationAffinityWaitMs: 'Cuánto espera un turno de conversación al nodo que guarda su sesión del harness antes de que otro nodo lo tome y empiece una sesión nueva desde la transcripción. Si ese nodo no está listo, otros lo toman al instante. 0 no espera nunca.',
          ConversationTranscriptTurns: 'Máximo de turnos anteriores que recibe un turno de conversación reconstruido en una sesión nueva del harness. Se conservan los más recientes.',
          ConversationTranscriptChars: 'Máximo de caracteres de cada mensaje y respuesta anteriores que recibe un turno reconstruido. Los más largos se recortan y se marcan como truncados.'
        },
        Scheduling: {
          PauseGraceMs: 'Tras una suspensión del host o una pausa de la VM, el líder espera una ventana de latidos más estos milisegundos antes de marcar nodos como Perdido o hacer fallar sus ejecuciones. Por defecto 5000.'
        }
      }
    },
    runGuard: {
      openDeployments: 'Ve a Despliegues para cambiar las protecciones de un despliegue: Protección contra repeticiones, Máximo de caracteres del asistente y Límite sin avance.',
      openSettings: 'Ve a Ajustes para cambiar los valores del clúster (Tiempo de ejecución) que siguen los despliegues sin protecciones propias.'
    },
    conversationDetail: {
      viewJson: 'Muestra el registro completo de la conversación como JSON.',
      openInvoke: 'Abre Invocar con esta conversación seleccionada para enviar el siguiente turno con la vista de streaming completa.',
      delete: 'Elimina esta conversación. Sus turnos se quedan en la página Ejecuciones como ejecuciones normales, pero la conversación ya no se puede continuar.',
      deleteBusy: 'Todavía hay un turno sin terminar, así que el servidor no eliminará la conversación hasta que esa ejecución termine o se cancele.',
      agent: 'El agente de esta conversación. Haz clic para abrir el agente.',
      openAgent: 'Abre la página de este agente con sus despliegues y ejecuciones recientes.',
      deployment: 'Cada turno se ejecuta en este despliegue: el que recibió el primer turno.',
      activeRun: 'El turno que sigue en cola o en ejecución. El siguiente mensaje se rechaza hasta que termine.',
      openRun: 'Abre la página de esta ejecución con su transcripción completa, resultado y telemetría.',
      turns: 'Todos los turnos de la conversación, del más antiguo al más reciente. Cada turno es una ejecución.',
      columns: {
        turn: 'Posición del turno en la conversación, empezando por 1.',
        run: 'La ejecución que procesó este turno. Haz clic para abrir su transcripción.',
        status: 'En qué punto de su ciclo de vida está la ejecución del turno: en cola, en ejecución o en uno de los estados finales.',
        outcome: 'Por qué terminó la ejecución del turno, con más detalle que el estado.',
        session: 'Si el turno reanudó la sesión del harness del turno anterior o empezó una sesión nueva con la transcripción (y por qué).',
        input: 'El inicio del mensaje enviado en este turno. Pasa el puntero para ver más.',
        result: 'El inicio de la respuesta, o el error si la ejecución falló. Pasa el puntero para ver más.',
        node: 'El nodo worker que ejecutó el turno.',
        created: 'Cuándo se envió el turno. Pasa el puntero sobre el valor para ver la hora exacta.'
      },
      session: {
        first: 'El primer turno: inicia la sesión del harness que reanudan los turnos posteriores.',
        resumed: 'Este turno reanudó la sesión del harness {{session}} en el nodo que guarda los directorios de la conversación, así que el agente conservó todo su contexto.',
        fallback: 'Este turno no pudo reanudar la sesión, así que empezó una sesión nueva del harness con la transcripción de los turnos anteriores.',
        pending: 'El turno espera un nodo, así que aún no se sabe si reanudará la sesión o se reconstruirá.'
      },
      continueTitle: 'Envía el siguiente mensaje como el siguiente turno de esta conversación. Se ejecuta con el mismo agente y despliegue.',
      message: 'El siguiente mensaje para el agente. Continúa la conversación con el contexto de los turnos anteriores.',
      send: 'Envía este mensaje como el siguiente turno. El turno aparece en la lista de arriba y se actualiza hasta que termina.',
      sendBusy: 'El turno anterior aún no ha terminado. El servidor rechaza un turno nuevo hasta entonces, así que espera o cancélalo primero.'
    }
  },
  analytics: {
    grafana: 'Abre en una pestaña nueva el panel Runs de Grafana con el mismo intervalo de tiempo que esta página.',
    filters: {
      ttft: 'Si lo marcas, el gráfico de tiempo hasta el primer token omite el tiempo que las ejecuciones esperaron a los agentes en los que delegaron, para comparar con justicia a los agentes que delegan con los que responden directamente.',
      range: 'Ventana de tiempo de todos los gráficos y totales: la última hora, día, semana o 30 días, o un inicio y un fin personalizados.',
      from: 'Inicio del rango personalizado, en tu zona horaria local.',
      to: 'Fin del rango personalizado, en tu zona horaria local.',
      agentId: 'Cuenta solo las ejecuciones de este agente. La lista de despliegues se reduce a los suyos.',
      harnessType: 'Cuenta solo las ejecuciones ejecutadas por este harness.',
      deploymentId: 'Cuenta solo las ejecuciones de este despliegue, por ejemplo para comparar dos modelos de un mismo agente.',
      model: 'Cuenta solo las ejecuciones cuyo harness informó este modelo servido. La lista muestra los modelos vistos en el rango seleccionado.',
      groupBy: 'Divide cada gráfico en una serie por agente, harness, modelo o par de harness y modelo, para poder compararlos.'
    },
    cards: {
      delegationWait: 'Tiempo medio que las ejecuciones esperaron a las ejecuciones hijas que delegaron. n/d si ninguna ejecución del intervalo delegó.',
      ttftExcludingDelegation: 'Tiempo medio hasta el primer token sin el tiempo de espera a los agentes delegados. La nota muestra el percentil 95.',
      runs: 'Ejecuciones solicitadas en el rango que coinciden con los filtros.',
      successRate: 'Ejecuciones correctas como proporción de las ejecuciones terminadas (correctas, fallidas, canceladas y con tiempo agotado).',
      ttft: 'Tiempo medio hasta el primer token en las ejecuciones que produjeron salida. La nota muestra el percentil 95.',
      execution: 'Tiempo medio de ejecución del harness. La nota muestra el percentil 95, que refleja tus ejecuciones lentas.',
      queue: 'Tiempo medio que las ejecuciones esperaron a un nodo de trabajo.',
      tokens: 'Tokens de entrada más tokens de salida de todas las ejecuciones del rango.',
      throughput: 'Media de tokens de salida por segundo durante la transmisión.',
      cost: 'Coste total informado en dólares estadounidenses.',
      toolCalls: 'Total de llamadas a herramientas hechas por las ejecuciones del rango.'
    },
    charts: {
      outcomes: 'Cómo terminaron las ejecuciones en cada intervalo de tiempo. Pasa el cursor sobre una barra para ver los recuentos.',
      ttft: 'Cuánto tardaron las ejecuciones en producir su primer token: media, mediana y percentil 95.',
      duration: 'Cuánto duró la transmisión del modelo y cuánto se ejecutó el harness en total.',
      queue: 'Cuánto esperaron las ejecuciones antes de que un nodo obtuviera su concesión.',
      tokens: 'Tokens consumidos por intervalo, divididos por tipo.',
      throughput: 'Velocidad de generación de salida en tokens por segundo.',
      cost: 'Gasto informado por intervalo.',
      toolCalls: 'Llamadas a herramientas hechas por intervalo.',
      usageTokens: 'Tokens de entrada más salida a lo largo del tiempo, con un segmento apilado por cada par de harness y modelo. Pasa el cursor sobre una barra para ver el desglose.',
      usageCost: 'Coste informado a lo largo del tiempo, con un segmento apilado por cada par de harness y modelo. Pasa el cursor sobre una barra para ver el desglose.'
    },
    metrics: {
      delegationWaitMsAvg: 'Tiempo medio que las ejecuciones esperaron a sus ejecuciones hijas delegadas. Haz clic para ocultar o mostrar esta línea.',
      timeToFirstTokenExcludingDelegationMsP95: 'Percentil 95 del tiempo hasta el primer token sin la espera a ejecuciones delegadas. Haz clic para ocultar o mostrar esta línea.',
      timeToFirstTokenExcludingDelegationMsP50: 'Mediana del tiempo hasta el primer token sin la espera a ejecuciones delegadas. Haz clic para ocultar o mostrar esta línea.',
      timeToFirstTokenExcludingDelegationMsAvg: 'Tiempo medio hasta el primer token sin la espera a ejecuciones delegadas. Haz clic para ocultar o mostrar esta línea.',
      runs: 'Ejecuciones solicitadas en el intervalo.',
      succeeded: 'Ejecuciones que terminaron correctamente. Haz clic para ocultar o mostrar esta serie.',
      failed: 'Ejecuciones que fallaron. Haz clic para ocultar o mostrar esta serie.',
      cancelled: 'Ejecuciones que se cancelaron. Haz clic para ocultar o mostrar esta serie.',
      timedOut: 'Ejecuciones que alcanzaron su plazo límite. Haz clic para ocultar o mostrar esta serie.',
      inputTokens: 'Tokens de entrada enviados al modelo. Haz clic para ocultar o mostrar esta serie.',
      outputTokens: 'Tokens de salida que generó el modelo. Haz clic para ocultar o mostrar esta serie.',
      cachedTokens: 'Tokens de entrada servidos desde la caché de prompts. Haz clic para ocultar o mostrar esta serie.',
      reasoningTokens: 'Tokens de razonamiento, cuando el harness los informa. Haz clic para ocultar o mostrar esta serie.',
      totalTokens: 'Tokens de entrada más tokens de salida de las ejecuciones de cada intervalo.',
      costUsd: 'Coste informado en dólares estadounidenses.',
      toolCalls: 'Llamadas a herramientas hechas por las ejecuciones de cada intervalo. Haz clic para ocultar o mostrar esta serie.',
      timeToFirstTokenMsAvg: 'Tiempo medio hasta el primer token en el intervalo. Haz clic para ocultar o mostrar esta línea.',
      timeToFirstTokenMsP50: 'Mediana del tiempo hasta el primer token: la mitad de las ejecuciones fueron más rápidas. Haz clic para ocultar o mostrar esta línea.',
      timeToFirstTokenMsP95: 'Percentil 95 del tiempo hasta el primer token: solo 1 de cada 20 ejecuciones fue más lenta. Haz clic para ocultar o mostrar esta línea.',
      streamingMsAvg: 'Tiempo medio de transmisión, de la primera a la última salida del modelo. Haz clic para ocultar o mostrar esta línea.',
      executionMsAvg: 'Tiempo medio de ejecución del harness, del inicio del proceso a su salida. Haz clic para ocultar o mostrar esta línea.',
      executionMsP95: 'Percentil 95 del tiempo de ejecución. Haz clic para ocultar o mostrar esta línea.',
      queueMsAvg: 'Tiempo medio desde la entrada en cola hasta la concesión.',
      outputTokensPerSecondAvg: 'Media de tokens de salida por segundo durante la transmisión.'
    },
    groupSeries: {
      none: '{{name}}: {{metric}}.',
      agent: 'Ejecuciones del agente {{name}}: {{metric}}. Haz clic para ocultar o mostrar esta serie.',
      harness: 'Ejecuciones en el harness {{name}}: {{metric}}. Haz clic para ocultar o mostrar esta serie.',
      model: 'Ejecuciones servidas por el modelo {{name}}: {{metric}}. Haz clic para ocultar o mostrar esta serie.',
      harnessModel: 'Ejecuciones en {{name}} (harness / modelo): {{metric}}. Haz clic para ocultar o mostrar esta serie.'
    },
    otherSeries: 'Todos los grupos fuera de los más activos, sumados. Haz clic para ocultarlo o mostrarlo.',
    dataTable: 'Muestra como tabla los números en los que se basa este gráfico, con una fila por intervalo de tiempo.',
    bucketStart: 'Inicio del intervalo de tiempo. Cada fila cubre un intervalo.',
    usage: 'Uso a lo largo del tiempo dividido por harness y modelo, independientemente de la agrupación elegida arriba, con totales para todo el rango.',
    breakdown: 'Totales del rango seleccionado por cada par de harness y modelo. Úsalo para ver qué modelo impulsa tu uso de tokens y tu coste.',
    breakdownColumns: {
      harness: 'El harness que ejecutó estas ejecuciones.',
      model: 'El modelo que el harness informó haber servido. "Modelo desconocido" significa que el harness no informó ninguno.',
      runs: 'Ejecuciones en este harness y modelo dentro del rango.',
      inputTokens: 'Tokens de entrada enviados al modelo en estas ejecuciones.',
      outputTokens: 'Tokens de salida que generó el modelo en estas ejecuciones.',
      cachedTokens: 'Tokens de entrada servidos desde la caché de prompts en estas ejecuciones.',
      reasoningTokens: 'Tokens de razonamiento, para los harnesses que los informan por separado.',
      costUsd: 'Coste total informado en dólares estadounidenses de estas ejecuciones.',
      timeToFirstTokenMsAvg: 'Tiempo medio hasta el primer token, ponderado por el número de ejecuciones de cada intervalo de tiempo.'
    }
  },
  export: {
    menu: 'Descarga {{name}}: los datos como CSV o JSON, o el gráfico como imagen PNG o SVG con su título, leyenda, filtros y rango de tiempo.',
    csv: 'Descarga como CSV los datos exactos de esta vista: una fila por intervalo o registro, marcas de tiempo ISO 8601 en UTC y números simples con punto decimal.',
    png: 'Descarga el gráfico como imagen PNG al doble de la resolución de pantalla, con título, leyenda, filtros activos y rango de tiempo.',
    svg: 'Descarga el gráfico como imagen SVG escalable, con título, leyenda, filtros activos y rango de tiempo.',
    json: 'Descarga los datos como JSON, con las series, los intervalos, los filtros y el rango de tiempo en un solo documento.'
  }
};

const explainers = {
  approvals: {
    title: 'Cómo funcionan las aprobaciones',
    p1: 'Un despliegue con aprobaciones activadas hace que su harness pregunte a Garrison antes de las llamadas a herramientas: Claude Code mediante su herramienta de solicitud de permisos, y las ejecuciones del app-server de Codex para comandos y cambios de archivos.',
    p2: 'Cada solicitud se comprueba con las reglas del despliegue. Denegar prevalece sobre Preguntar, y Preguntar sobre Permitir; cuando nada coincide, se aplica el valor predeterminado del despliegue. Permitir y Denegar responden al instante; Preguntar deja la solicitud aquí y la ejecución espera.',
    p3: 'Permite o deniega una solicitud pendiente con un motivo opcional. Recordar como regla añade una regla al despliegue, para que la próxima llamada similar se decida automáticamente. Las solicitudes que nadie decide caducan con la decisión por tiempo de espera del despliegue.'
  },
  diagram: {
    label: 'Diagrama: un cliente invoca a un agente por nombre, Garrison elige uno de los despliegues del agente por peso y los vínculos de ese despliegue deciden cómo se ejecuta la ejecución.',
    caller: { title: 'Cliente', body: 'REST, MCP, A2A u otro agente', tip: 'Cualquier cosa que invoque a un agente: la API REST, un cliente MCP, un agente A2A o la ejecución de otro agente. Los clientes solo conocen el nombre del agente.' },
    agent: { title: 'Agente', body: 'Nombre, descripción, exposición, delegación, esquema de salida', tip: 'La identidad direccionable. Los clientes la invocan por nombre; indica qué es el agente y cómo se expone, no cómo se ejecuta.' },
    deploymentA: { title: 'Despliegue A, peso 300', body: 'Claude Code, sonnet', tip: 'Una forma de ejecutar el agente. Con peso 300 frente a 100 recibe el 75 % de las invocaciones que no indican un despliegue.' },
    deploymentB: { title: 'Despliegue B, peso 100', body: 'Mux, modelo local', tip: 'Otra forma de ejecutar el mismo agente. Los clientes también pueden indicarlo explícitamente para saltarse la elección ponderada.' },
    binds: { title: 'Cada despliegue vincula', body: 'Perfil de harness, prompts, servidores MCP, secretos, espacio de trabajo, grupo de nodos, límites', tip: 'Todo lo que convierte una solicitud en un proceso concreto: qué CLI, qué prompts, qué herramientas y credenciales, y dónde puede ejecutarse.' },
    run: { title: 'Ejecución', body: 'Una ejecución de un despliegue', tip: 'Cada invocación crea una ejecución, compilada a partir del despliegue elegido y ejecutada en un nodo de trabajo.' }
  },
  agents: {
    title: 'Agentes y despliegues',
    p1: 'Un agente es la identidad que usan los clientes. Tiene un nombre, una descripción, una forma de exposición (tarjeta A2A, herramienta MCP), si puede llamar a otros agentes y el esquema de salida que deben cumplir sus respuestas. Por sí solo, un agente no ejecuta nada.',
    p2: 'Un despliegue es cómo se ejecuta el agente: qué perfil de harness y qué modelo, qué plantillas de prompt, qué servidores MCP y secretos (por alias), qué espacio de trabajo, qué grupo de nodos y qué límites y parámetros por ejecución se aplican. Un agente puede tener varios despliegues, cada uno con un peso de tráfico.',
    p3: 'Cuando alguien invoca al agente, Garrison elige al azar uno de sus despliegues activos según el peso, salvo que el cliente indique un despliegue concreto. Así puedes ejecutar en paralelo una variante con Claude Code y otra con Mux, o pasar tráfico a un modelo nuevo de forma gradual.'
  },
  deployments: {
    title: 'Qué es un despliegue',
    p1: 'Un despliegue convierte un agente en algo ejecutable. Pertenece a un único agente y vincula un perfil de harness (qué CLI lanzar), un modelo, plantillas de prompt para cada rol, servidores MCP y secretos bajo alias, un espacio de trabajo y un almacén de artefactos opcionales, la ubicación en grupos de nodos o etiquetas, y límites como el tiempo de espera y la concurrencia.',
    p2: 'Un agente con varios despliegues activos reparte su tráfico por peso: con pesos 300 y 100, tres de cada cuatro llamadas van al primero. Los despliegues inactivos no reciben tráfico ponderado, pero se pueden indicar explícitamente, lo que resulta útil para probar una configuración nueva antes de darle peso.',
    p3: 'Usa la vista previa de compilación de un despliegue para ver la línea de comandos, los archivos y el entorno exactos que recibiría una ejecución, sin iniciarla.'
  },
  agentDetail: {
    title: 'Cómo se ejecuta este agente',
    p1: 'A este agente se llega por su nombre. Los despliegues de abajo son las formas concretas en que puede ejecutarse. Cada despliegue activo recibe una parte del tráfico igual a su peso dividido entre el peso total de los despliegues activos; los clientes que indican un despliegue se saltan la elección ponderada.'
  },
  harnessProfiles: {
    title: 'Perfiles de harness y despliegues',
    p1: 'Un perfil de harness es una receta de lanzamiento para un agente de línea de comandos: el ejecutable, las plantillas de argumentos, las variables de entorno, los archivos que se escriben, cómo se entregan el prompt y el prompt del sistema, qué formato de configuración MCP lee y cómo se analiza su salida en eventos.',
    p2: 'Los perfiles son piezas compartidas. Un despliegue elige un perfil y luego añade los detalles: el modelo, los prompts, los secretos y cualquier sobrescritura de argumentos o de entorno que se aplique solo a él. Muchos despliegues pueden usar el mismo perfil, así que una corrección en el perfil les llega a todos.',
    p3: 'Los perfiles integrados son de solo lectura. Clona uno para cambiarlo.'
  },
  promptTemplates: {
    title: 'Plantillas de prompt y cómo las usan los despliegues',
    p1: 'Cada texto que Garrison envía a un harness es una plantilla: prompts del sistema, el envoltorio del mensaje del cliente, instrucciones de delegación, descripciones de herramientas y archivos de configuración generados. Las plantillas usan variables como {{input.message}} y {{deployment.model}}, y cada guardado crea una versión nueva.',
    p2: 'Los despliegues vinculan plantillas a roles de prompt (System, Task, DelegatedTask y otros). Un vínculo sigue la versión más reciente o fija una, así que puedes editar una plantilla sin cambiar un despliegue de producción hasta que tú lo decidas. Cada ejecución registra las versiones exactas que usó.'
  },
  mcpServers: {
    title: 'Servidores MCP y vínculos',
    p1: 'Un servidor MCP de esta lista es un proveedor de herramientas: una dirección (o un comando para los servidores stdio), los encabezados o el entorno que necesita y las herramientas que deben estar presentes. Registrar un servidor todavía no lo pone a disposición de ningún agente.',
    p2: 'Un despliegue vincula los servidores que debe usar su agente, cada uno bajo un alias. Al compilar, Garrison los escribe en la configuración MCP del harness, resolviendo las referencias a secretos en los encabezados, y el nodo de trabajo comprueba las herramientas obligatorias antes del lanzamiento. El servidor MCP propio de Garrison se añade automáticamente cuando el agente puede delegar.'
  },
  secrets: {
    title: 'Secretos y alias',
    p1: 'Un secreto es un valor cifrado, como una clave de API o un token. El valor es de solo escritura: después de guardarlo puedes reemplazarlo o rotarlo, pero nadie puede volver a leerlo desde la consola ni desde la API.',
    p2: 'Los despliegues vinculan secretos bajo un alias. Las variables de entorno y los archivos del perfil de harness hacen referencia a {{secret.alias}}, así que el mismo perfil funciona con claves distintas en despliegues distintos. Los valores solo se descifran mientras se compila una ejecución, se envían al nodo de trabajo por TLS y se eliminan de los registros.'
  },
  workspaces: {
    title: 'Espacios de trabajo',
    p1: 'Una plantilla de espacio de trabajo describe el directorio en el que empieza cada ejecución: vacío, un clon nuevo de Git (con un secreto de credencial opcional para repositorios privados) o un conjunto de archivos precargados. La retención decide si el directorio se elimina o se conserva después de la ejecución.',
    p2: 'Un despliegue puede vincular cero o una plantilla de espacio de trabajo. Cada ejecución recibe su propia copia, así que las ejecuciones nunca ven los archivos de las demás.'
  },
  modelPrices: {"title": "Precios de modelos", "p1": "Tarifas en USD configuradas por el operador para estimar el coste cuando el harness no lo informa. El coste informado, incluso cero, tiene prioridad.", "p2": "Los precios inactivos no se usan. Editar o eliminar precios no cambia los costes guardados de las ejecuciones."},
  usageQuotas: {"title": "Cuotas de uso", "p1": "Límites diarios en UTC de ejecuciones, tokens, coste conocido y concurrencia actual para un inquilino, agente o despliegue.", "p2": "Déjelo vacío para uso ilimitado. Cero impide el uso. Los contadores diarios se reinician a medianoche UTC; la concurrencia cuenta ejecuciones activas. Desactivado por defecto. Active para rechazar ejecuciones al alcanzar los límites y reducir presupuestos compatibles. Desactivado, solo se registra el uso."},
  artifactStores: {
    title: 'Almacenes de artefactos',
    p1: 'Un almacén de artefactos es donde se guardan los archivos que producen las ejecuciones cuando el espacio de trabajo de la ejecución ya no existe. Un despliegue puede vincular un almacén, y el nodo de trabajo sube allí los archivos coincidentes cuando termina la ejecución.'
  },
  manifests: {
    title: 'Manifiestos y los registros que crean',
    p1: 'Un manifiesto es la configuración del inquilino escrita como documentos YAML o JSON: secretos (sin valores de forma predeterminada), plantillas de prompt, perfiles de harness, servidores MCP, plantillas de espacio de trabajo, agentes y despliegues. Los documentos se referencian entre sí por nombre, así que un mismo manifiesto funciona en cualquier inquilino.',
    p2: 'Aplicar un manifiesto crea o actualiza registros normales, los mismos que ves en las otras pestañas. Aplicarlo dos veces no cambia nada. Una simulación muestra lo que cambiaría sin escribir nada, y "Exportar" produce un manifiesto que recrea este inquilino.'
  },
  nodes: {
    title: 'Nodos y grupos de nodos',
    p1: 'Un nodo es un proceso de trabajo, normalmente un pod, que obtiene ejecuciones del plano de control, lanza harnesses y transmite sus eventos de vuelta. Los nodos se registran solos, informan de qué harnesses encontraron y envían latidos; no los creas aquí.',
    p2: 'Un nodo puede pertenecer a un grupo de nodos y llevar etiquetas. Los despliegues usan grupos y selectores de etiquetas para decidir dónde pueden ejecutarse sus ejecuciones. Acordona un nodo para que no reciba trabajo nuevo, o drénalo antes del mantenimiento.'
  },
  controlNodes: {
    title: 'Nodos de control y nodos de trabajo',
    p1: 'Un nodo de control es una réplica del servidor Garrison. Los nodos de control sirven la API REST, el servidor MCP y la pasarela A2A, autentican a quien llama, compilan los despliegues en ejecuciones y planifican esas ejecuciones. Cualquier réplica puede responder a cualquier solicitud, así que un balanceador de carga puede repartir el tráfico entre ellas.',
    p2: 'Uno de los nodos de control es el líder. Tiene una concesión en la base de datos y se encarga del mantenimiento de todo el clúster: la limpieza por retención, marcar como desconectadas las réplicas en silencio y eliminar filas antiguas. Si el líder se detiene, otra réplica toma la concesión en pocos segundos.',
    p3: 'Los nodos de trabajo, en la pestaña Nodos de trabajo, hacen la otra mitad: obtienen del plano de control las ejecuciones concedidas y ejecutan los harnesses. Los nodos de control nunca ejecutan un harness y los nodos de trabajo nunca tocan la base de datos. Cada réplica se registra sola y envía un latido cada 5 segundos, por eso esta pestaña es de solo lectura.'
  },
  nodePools: {
    title: 'Grupos de nodos y nodos',
    p1: 'Un grupo de nodos es un conjunto con nombre de nodos de trabajo, por ejemplo máquinas con GPU o nodos reservados para un cliente. Los nodos se unen a un grupo al registrarse. Un grupo puede limitarse a ciertos inquilinos.',
    p2: 'Los despliegues que indican un grupo solo se ejecutan en sus nodos. Los despliegues sin grupo pueden ejecutarse en cualquier nodo apto.'
  },
  tenants: {
    title: 'Inquilinos',
    p1: 'Un inquilino es una organización aislada en este servidor. Los usuarios, las claves de acceso, los agentes, los secretos y las ejecuciones pertenecen a un único inquilino, y nada es visible entre inquilinos. Los grupos de nodos y los nodos de trabajo se comparten, salvo que un grupo esté reservado para inquilinos específicos.'
  },
  users: {
    title: 'Usuarios y claves de acceso',
    p1: 'Un usuario es una persona que inicia sesión con un correo electrónico y una contraseña. Una clave de acceso es la forma en que inicia sesión la automatización. Cada clave de acceso pertenece a un usuario y nunca puede hacer más que ese usuario.',
    p2: 'Ninguno obtiene acceso solo por existir. El acceso proviene de los indicadores de administrador del usuario y de las asignaciones de roles.'
  },
  credentials: {
    title: 'Claves de acceso y usuarios',
    p1: 'Una clave de acceso es un par formado por la clave de acceso pública y la clave secreta para scripts, SDK y servicios. Pertenece a un usuario. Sus permisos efectivos son la intersección de lo que conceden sus propias asignaciones de roles y lo que puede hacer su propietario.',
    p2: 'La clave secreta se muestra una sola vez, cuando la clave se crea o se rota. Rota las claves con regularidad y elimina las que llevan mucho tiempo sin usarse.'
  },
  roles: {
    title: 'Roles, permisos y asignaciones',
    p1: 'Un permiso es una regla individual: permitir o denegar ciertas operaciones (como Read o Execute) sobre ciertos tipos de recursos (como Agent o Run). Un rol es un conjunto de permisos con nombre. La denegación siempre prevalece sobre el permiso.',
    p2: 'Nada cambia para nadie hasta que se asigna un rol. Las asignaciones, en la pestaña siguiente, conectan un rol con un usuario o una clave de acceso, para todo el inquilino o para un registro.'
  },
  assignments: {
    title: 'Asignaciones',
    p1: 'Una asignación concede un rol a un usuario o a una clave de acceso. El ámbito de inquilino aplica el rol a todos los registros de los tipos cubiertos; el ámbito de recurso lo aplica a un único registro, como el único agente que puede invocar un trabajo de CI.',
    p2: 'Usa "Permisos efectivos" en un usuario o una clave de acceso para ver el resultado combinado de todas sus asignaciones.'
  },
  runs: {
    title: 'Ejecuciones y la cola',
    p1: 'Una ejecución es una invocación de un despliegue. Entra en la cola, un nodo de trabajo obtiene su concesión, se ejecuta y termina con un resultado, una transcripción, una respuesta y telemetría como el tiempo hasta el primer token, los tokens y el coste.',
    p2: 'La pestaña "Cola" muestra esas mismas ejecuciones mientras esperan: las que están en cola necesitan un nodo con el harness y la ubicación adecuados, las concedidas ya se han reclamado y las que están en ejecución se están ejecutando. Las ejecuciones que pasan mucho tiempo en la cola indican falta de capacidad o reglas de ubicación que ningún nodo cumple.'
  },
  queue: {
    title: 'La cola',
    p1: 'Esta es la vista en vivo de las ejecuciones que no han terminado: esperando un nodo, concedidas o en ejecución, agrupadas por agente y harness. Son los mismos datos que la pestaña "Ejecuciones", resumidos para mostrar la presión de planificación.',
    p2: 'Un recuento creciente de ejecuciones en cola para un harness suele significar que ningún nodo listo anuncia ese harness, que los nodos compatibles están llenos o que el despliegue exige un grupo o unas etiquetas que ningún nodo tiene.'
  },
  invoke: {
    title: 'Qué ocurre al invocar',
    p1: 'Llamas al agente por su nombre. Salvo que elijas un despliegue, Garrison elige uno de los despliegues activos del agente por peso, valida los parámetros por ejecución frente a lo que permite ese despliegue y pone una ejecución en la cola. La transcripción se transmite aquí mientras el nodo de trabajo la ejecuta.'
  },
  audit: {
    title: 'Auditoría e historial de solicitudes',
    p1: 'Los registros de auditoría son eventos de seguridad y configuración: inicios de sesión, solicitudes denegadas, cambios de secretos y roles, aplicaciones de manifiestos y cambios de estado de los nodos. Se conservan durante el periodo de retención definido en la configuración.',
    p2: 'El historial de solicitudes, en la pestaña anterior, es el tráfico HTTP sin procesar. Usa la auditoría para saber quién cambió qué, y el historial de solicitudes para depurar lo que realmente envió un cliente.'
  },
  requests: {
    title: 'Historial de solicitudes',
    p1: 'Todas las solicitudes a la API que capturó este servidor, con método, ruta, estado, tiempos, encabezados y cuerpos (truncados al tamaño configurado). Úsalo para depurar integraciones y llamadas de los SDK. Haz clic en una barra del gráfico para limitar la tabla a ese momento.'
  },
  analytics: {
    title: 'Qué miden estos gráficos',
    p1: 'El tiempo hasta el primer token va desde el inicio del proceso del harness hasta la primera salida del modelo, así que incluye el arranque de la CLI. El tiempo de transmisión va de la primera a la última salida del modelo, y el tiempo de ejecución, del inicio del proceso a su salida. El tiempo en cola es cuánto esperó una ejecución a un nodo de trabajo. Se miden con los relojes del nodo de trabajo y del servidor.',
    p2: 'Los recuentos de tokens y el coste provienen de lo que informa cada harness. Los tokens en caché son tokens de entrada servidos desde la caché de prompts del proveedor, y los tokens de razonamiento solo aparecen en los harnesses que los informan por separado. Los tokens de salida por segundo son los tokens de salida divididos entre el tiempo de transmisión.',
    p3: 'Las medias ignoran las ejecuciones en las que no se pudo medir un valor. Los percentiles muestran la cola de la distribución: p95 significa que solo una de cada veinte ejecuciones fue más lenta. Agrupa por agente o harness para compararlos lado a lado.'
  },
  conversations: {
    title: 'Conversaciones y turnos',
    p1: 'Una conversación es una serie de ejecuciones con un agente. El primer turno inicia una sesión del harness; cada turno posterior reanuda esa sesión en el mismo nodo worker, así que el agente conserva sus archivos, herramientas y contexto entre mensajes.',
    p2: 'Solo se ejecuta un turno a la vez: se rechaza un mensaje nuevo mientras el turno anterior no haya terminado. Cada turno se queda en el despliegue del primer turno.',
    p3: 'Cuando un turno no puede reanudar (el nodo ya no está o tarda demasiado, se borraron los archivos o el harness no puede reanudar), se reconstruye con una sesión nueva que recibe la transcripción de los turnos anteriores. La columna Reconstrucciones cuenta esos turnos y la lista de turnos indica el motivo.'
  }
};

export { tips, explainers };

tips.views.settings.groups.Leases = "Coordinación opcional; configure todas las réplicas igual y reinicie. Database es el valor predeterminado.";
tips.views.settings.fields.Leases = {"Provider": "Coordinación opcional; configure todas las réplicas igual y reinicie. Database es el valor predeterminado.", "ClutchEndpoint": "Proporcione la clave de Clutch mediante un secreto o variable de entorno; no incluya credenciales en el endpoint.", "ClutchAccessKey": "Proporcione la clave de Clutch mediante un secreto o variable de entorno; no incluya credenciales en el endpoint.", "KeyPrefix": "Coordinación opcional; configure todas las réplicas igual y reinicie. Database es el valor predeterminado.", "RequestTimeoutMs": "Coordinación opcional; configure todas las réplicas igual y reinicie. Database es el valor predeterminado.", "SweepIntervalMs": "Coordinación opcional; configure todas las réplicas igual y reinicie. Database es el valor predeterminado.", "MaxLeaseMs": "Coordinación opcional; configure todas las réplicas igual y reinicie. Database es el valor predeterminado.", "MaxHoldMs": "Coordinación opcional; configure todas las réplicas igual y reinicie. Database es el valor predeterminado."};

tips.enums.harnessType.ProviderApi = "Bucle opcional de API mediante PolyPrompt. Requiere endpoint y modelo; los despliegues CLI se mantienen.";
tips.enums.harnessType.OpenCode = "CLI de opencode, ejecutada sin interfaz con opencode run y eventos JSON. Funciona con Anthropic, OpenAI, Google y otros proveedores de modelos.";
tips.enums.harnessType.Pi = "Agente de programación pi, ejecutado con --mode json. Funciona con Anthropic, OpenAI, Google y otros proveedores de modelos.";

// Pipelines (P12.9).
tips.nav.hubs.approvals = 'Todo lo que espera a una persona: llamadas a herramientas que pidieron los agentes y etapas de canalización que requieren revisión, con el historial de todas las decisiones.';
tips.nav.approvalsBadgeCombined = 'Esperan a una persona: {{approvals}} aprobaciones de llamadas a herramientas y {{reviews}} revisiones de etapas de canalización. Abre Aprobaciones para decidirlas.';
Object.assign(tips.nav.tabs, {
  approvals: 'Llamadas a herramientas que pidieron los agentes y que esperan a que una persona las permita o deniegue, y todas las decisiones pasadas por regla, valor predeterminado, persona o tiempo de espera.',
  pipelineReviews: 'Etapas de canalización que terminaron y esperan a una persona: apruébalas, pide cambios (la etapa se vuelve a ejecutar con tus comentarios) o recházalas.',
  pipelines: 'Cadenas de agentes: cada etapa ejecuta un agente, pasa su salida a la siguiente etapa mediante una plantilla de prompt y puede esperar una revisión.',
  pipelineRuns: 'Cada ejecución de una canalización con su estado y su resultado. Abre una para ver la línea de tiempo de etapas, sus ejecuciones de etapa y sus revisiones.'
});
tips.filters.pipelineId = 'Muestra solo los registros de una canalización. Elige Todas para quitar el filtro.';
tips.filters.pipelineRunId = 'Muestra solo las revisiones de una ejecución de canalización. Pega un ID como plr_...; la lista se actualiza cuando dejas de escribir.';
Object.assign(tips.enums, {
  pipelineRunStatus: {
    Running: 'Una etapa se está ejecutando, iniciando o está a punto de empezar.',
    AwaitingReview: 'Una etapa terminó y espera a que una persona la apruebe, pida cambios o la rechace.',
    Cancelling: 'Se pidió la cancelación; se está deteniendo la ejecución de la etapa actual.',
    Succeeded: 'Todas las etapas terminaron y se aprobaron todos los puntos de revisión.',
    Failed: 'Una etapa falló tras sus intentos, no pudo iniciarse o un revisor la rechazó. Reintentar continúa en esa etapa.',
    Cancelled: 'Alguien canceló la ejecución de canalización. Reintentar continúa en la etapa donde se detuvo.',
    TimedOut: 'La canalización superó su límite de tiempo, incluido el tiempo de espera de las revisiones.'
  },
  pipelineRunOutcome: {
    None: 'La ejecución de canalización aún no ha terminado.',
    Succeeded: 'Todas las etapas terminaron bien y se aprobaron todas las revisiones.',
    StageFailed: 'Una etapa falló en todos sus intentos y no está configurada para continuar si falla.',
    StageStartFailed: 'Una etapa no pudo iniciarse, por ejemplo porque su agente o despliegue ya no existe o su prompt no se compiló.',
    ReviewRejected: 'Un revisor rechazó una etapa, lo que termina la ejecución de canalización.',
    ReviewExpired: 'Una revisión agotó su tiempo y su acción al agotarse el tiempo era Rechazar.',
    Cancelled: 'Alguien canceló la ejecución de canalización o una de sus ejecuciones de etapa.',
    TimedOut: 'La canalización superó su límite de tiempo.',
    InternalError: 'El servidor sufrió un error inesperado al avanzar la canalización. Revisa los registros del servidor.'
  },
  pipelineStageStatus: {
    Pending: 'La etapa no ha empezado; las etapas anteriores siguen en ejecución.',
    Running: 'La ejecución de la etapa está en cola o en curso. Un intento fallido inicia una pasada nueva hasta agotar los intentos.',
    AwaitingReview: 'La etapa terminó y espera a que una persona revise su salida.',
    Succeeded: 'La etapa terminó y, si requiere revisión, se aprobó.',
    Failed: 'La etapa falló en todos sus intentos, no pudo iniciarse o se rechazó.',
    Cancelled: 'La etapa se detuvo porque la ejecución de canalización se canceló o agotó su tiempo.'
  },
  pipelineReviewStatus: {
    Pending: 'Espera a que una persona apruebe, pida cambios o rechace.',
    Approved: 'Aprobada: la canalización pasó a la siguiente etapa, con las notas si las había.',
    ChangesRequested: 'Cambios pedidos: la etapa se volvió a ejecutar con los comentarios.',
    Rejected: 'Rechazada: la ejecución de canalización falló en esta etapa.',
    Expired: 'Nadie decidió a tiempo, así que decidió la acción de tiempo agotado de la etapa.',
    Cancelled: 'La ejecución de canalización se detuvo antes de que nadie decidiera.'
  },
  pipelineReviewDecision: {
    Approve: 'Acepta la salida de la etapa y continúa con la siguiente. Las notas opcionales van a la siguiente etapa.',
    RequestChanges: 'Vuelve a ejecutar la misma etapa con tus comentarios. Lo limita el máximo de correcciones de la etapa.',
    Reject: 'Detiene aquí la ejecución de canalización. Falla con el resultado Revisión rechazada.'
  },
  pipelineReviewSource: {
    User: 'Una persona decidió la revisión.',
    Timeout: 'La revisión agotó su tiempo y la decidió la acción de tiempo agotado de la etapa.',
    Cancelled: 'La ejecución de canalización se canceló o agotó su tiempo mientras la revisión estaba pendiente.'
  }
});
Object.assign(tips.enums.auditEventType, {
  PipelineReviewDecided: 'Una persona o un tiempo de espera aprobó, rechazó o pidió cambios en una revisión de etapa de canalización.',
  PipelineRunCancelled: 'Alguien canceló una ejecución de canalización, su revisión pendiente y la ejecución de su etapa actual.'
});
Object.assign(tips.resources.runs, {
  pipelineRunId: 'La ejecución de canalización de la que esta ejecución es una etapa, con la posición de la etapa y la pasada. Vacío en ejecuciones fuera de canalizaciones.',
  pipelineStage: 'Posición de la etapa en la canalización y qué pasada de esa etapa es esta ejecución (los reintentos y las correcciones añaden pasadas).'
});
tips.resources.pipelines = {
  add: 'Crea una canalización: una lista ordenada de etapas, cada una ejecuta un agente y pasa su salida a la siguiente.',
  name: 'Nombre único de la canalización en este inquilino, usado por la API, las herramientas MCP, los SDK y los manifiestos. Letras minúsculas, dígitos y guiones.',
  stages: 'Las etapas en orden de ejecución. Cada etapa ejecuta un agente; su salida pasa a la siguiente etapa mediante una plantilla de prompt.',
  reviewGates: 'Cuántas etapas esperan a que una persona revise su salida antes de que la canalización continúe.',
  maxDurationSeconds: 'Duración máxima de toda la ejecución de canalización, en segundos, incluidas las esperas de revisión. 0 significa sin límite; al superarlo, la ejecución agota su tiempo.',
  version: 'Aumenta con cada cambio guardado. Las ejecuciones de canalización registran la versión con la que empezaron y conservan sus etapas.',
  stageHeading: 'Una etapa de la canalización, ejecutada en el orden mostrado. Usa las flechas para moverla y la papelera para quitarla.',
  moveUp: 'Mueve esta etapa un puesto antes. Las etapas se ejecutan en el orden mostrado.',
  moveDown: 'Mueve esta etapa un puesto después. Las etapas se ejecutan en el orden mostrado.',
  removeStage: 'Quita esta etapa de la canalización. Una canalización necesita al menos una etapa.',
  addStage: 'Añade una etapa al final de la canalización. Recibe la salida de la etapa anterior.',
  stagesItems: {
    name: 'Nombre de esta etapa, único dentro de la canalización. Se muestra en la línea de tiempo, las revisiones y los prompts de traspaso.',
    agentId: 'El agente que ejecuta esta etapa. Iniciar la canalización requiere permiso para ejecutar todos los agentes de sus etapas.',
    deploymentId: 'Un despliegue fijo del agente de la etapa. Vacío elige uno de los despliegues activos del agente según su peso, como una invocación normal.',
    handoffTemplateId: 'Plantilla de prompt de tarea que envuelve la tarea de esta etapa con las salidas anteriores, las notas de revisión y los comentarios de corrección. Vacío usa la vinculación PipelineStage del despliegue o la plantilla integrada.',
    handoffTemplateVersion: 'Usa esta versión de la plantilla de traspaso aunque la plantilla cambie. Vacío usa siempre la versión actual.',
    outputCharLimit: 'Máximo de caracteres de la salida de cada etapa anterior que recibe esta etapa. Las salidas más largas se recortan y se marcan como truncadas.',
    maxAttempts: 'Cuántas veces se ejecuta la etapa cuando su ejecución falla o agota el tiempo, antes de considerarla fallida.',
    continueOnFailure: 'Si la etapa falla en todos sus intentos, continúa igualmente con la siguiente; esa etapa ve el fallo en el traspaso.',
    requiresReview: 'Cuando la etapa termina, espera a que una persona la apruebe, pida cambios o la rechace en Aprobaciones > Revisiones de etapa.',
    reviewTimeoutSeconds: 'Cuánto puede esperar la revisión antes de que la decida la acción de tiempo agotado. 0 espera hasta que decida una persona.',
    reviewTimeoutAction: 'Qué ocurre cuando la revisión agota su tiempo: aprobar y continuar, o rechazar y hacer fallar la ejecución de canalización.',
    maxRevisions: 'Cuántas veces puede un revisor pedir cambios en esta etapa. Después solo quedan Aprobar y Rechazar.',
    description: 'Nota libre sobre lo que hace esta etapa, para las personas. No se envía al agente.',
    parameters: 'Sobrescrituras de parámetros para las ejecuciones de esta etapa, como el modelo o el formato. Solo se permiten con un despliegue que deje sobrescribirlos.'
  },
  actions: {
    start: 'Inicia esta canalización con un texto de entrada y sigue sus etapas en la página de la ejecución de canalización.',
    preview: 'Genera el prompt de cada etapa a partir de una entrada y unas salidas de ejemplo, sin iniciar ninguna ejecución.',
    runs: 'Muestra las ejecuciones de esta canalización en la pestaña Ejecuciones de canalización.'
  }
};
tips.resources.pipelineRuns = {
  id: 'Identificador de la ejecución de canalización (plr_...). Úsalo con la API, las herramientas MCP y los SDK.',
  pipelineName: 'La canalización que ejecuta. Las ejecuciones de canalización conservan las etapas de la versión con la que empezaron.',
  pipelineVersion: 'La versión de la canalización con la que empezó esta ejecución. Las ediciones posteriores no la cambian.',
  status: 'En qué punto está la ejecución de canalización: en ejecución, pendiente de revisión, cancelando o terminada.',
  outcome: 'Por qué terminó la ejecución de canalización: correcta, una etapa falló o no pudo iniciarse, una revisión se rechazó o caducó, cancelada o tiempo agotado.',
  progress: 'La etapa en la que está la ejecución de canalización, del total de sus etapas.',
  callerName: 'El usuario o la clave de acceso que inició la ejecución de canalización.',
  errorMessage: 'Qué salió mal, cuando la ejecución de canalización falló o agotó su tiempo.',
  priority: 'Prioridad de cola que recibe cada ejecución de etapa. Los números más altos se planifican antes.',
  deadlineUtc: 'Cuándo agota su tiempo la ejecución de canalización, según el límite de tiempo de la canalización. Vacío si no hay límite.',
  completedUtc: 'Cuándo terminó la ejecución de canalización.',
  createdUtc: 'Cuándo se inició la ejecución de canalización. Pasa el cursor sobre el valor para ver la hora exacta.',
  actions: {
    cancel: 'Cancela la ejecución de canalización: se cancela la ejecución de su etapa actual y se cierra la revisión pendiente.',
    retry: 'Reanuda una ejecución de canalización fallida, con tiempo agotado o cancelada en la etapa donde se detuvo, con una pasada nueva de esa etapa.',
    stageRuns: 'Muestra las ejecuciones de todas las etapas de esta ejecución de canalización en la pestaña Ejecuciones.',
    finalRun: 'Abre la ejecución de la última etapa, cuyo resultado es el resultado de la canalización.'
  }
};
tips.resources.pipelineReviews = {
  createdUtc: 'Cuándo terminó la etapa y se solicitó la revisión. Pasa el cursor sobre el valor para ver la hora exacta.',
  pipelineName: 'La canalización cuya etapa espera la revisión.',
  stageName: 'La etapa que hay que revisar, con su posición y la pasada de la etapa que produjo la salida.',
  positionExecution: 'Posición de la etapa en la canalización y qué pasada de la etapa cubre esta revisión. Las correcciones añaden pasadas.',
  status: 'Las revisiones pendientes esperan a una persona; las demás muestran cómo terminó la revisión.',
  decision: 'Aprobar, Pedir cambios o Rechazar, una vez decidida la revisión.',
  decisionSource: 'Quién decidió: una persona, el tiempo de espera de revisión de la etapa o la detención de la ejecución de canalización.',
  comment: 'Notas para la siguiente etapa (aprobar), comentarios con los que la etapa se volvió a ejecutar (pedir cambios) o el motivo (rechazar).',
  decidedBy: 'La persona que decidió la revisión.',
  expiresUtc: 'Cuándo agota su tiempo la revisión y la decide la acción de tiempo agotado de la etapa. Vacío si espera hasta que decida una persona.',
  pipelineRunId: 'La ejecución de canalización a la que pertenece esta revisión. Haz clic en una fila para abrir su línea de tiempo de etapas.',
  runId: 'La ejecución de etapa cuya salida se revisa. Ábrela para leer el resultado antes de decidir.',
  decidedUtc: 'Cuándo se decidió la revisión.',
  id: 'Identificador de la revisión (prv_...). Úsalo con la API, las herramientas MCP y los SDK para decidir la revisión.',
  filters: { decisionSource: 'Muestra solo las revisiones decididas de una forma: por una persona, por el tiempo de espera o por la detención de la ejecución de canalización.' },
  actions: {
    approve: 'Aprueba la salida de la etapa y deja que la canalización continúe, opcionalmente con notas para la siguiente etapa.',
    requestChanges: 'Vuelve a ejecutar la etapa con tus comentarios. Cada petición consume una de las correcciones de la etapa.',
    reject: 'Rechaza la salida de la etapa. La ejecución de canalización falla con el resultado Revisión rechazada.',
    openStageRun: 'Abre la ejecución de etapa en revisión para leer su transcripción y su resultado.'
  }
};
tips.pipelineReviews = {
  revisionsLeft: 'Cuántas veces más se pueden pedir cambios en esta etapa antes de que solo queden Aprobar y Rechazar.',
  decide: {
    decision: 'Elige qué pasa con la salida de la etapa. La ejecución de canalización continúa en cuanto envías la decisión.',
    Approve: 'Acepta la salida de la etapa; la canalización continúa con la siguiente etapa, o termina bien tras la última.',
    RequestChanges: 'Devuelve la etapa con comentarios. Se vuelve a ejecutar y regresa para revisión.',
    Reject: 'Rechaza la salida de la etapa. La ejecución de canalización se detiene y falla.',
    commentApprove: 'Notas opcionales que la siguiente etapa recibe junto con la salida de esta etapa.',
    commentRequestChanges: 'Comentarios obligatorios. La etapa se vuelve a ejecutar con ellos, así que indica qué cambiar.',
    commentReject: 'Motivo opcional, guardado con la decisión y en el registro de auditoría.',
    submitApprove: 'Aprueba la etapa ahora. La decisión es definitiva y no se puede cambiar después.',
    submitRequestChanges: 'Envía los comentarios ahora. La etapa se vuelve a ejecutar; su próxima salida vuelve para revisión.',
    submitReject: 'Rechaza la etapa ahora. La ejecución de canalización falla; no se puede deshacer, pero se puede reintentar.'
  }
};
tips.pipelineStart = {
  input: 'La tarea para la canalización. La primera etapa trabaja en ella, y cada etapa posterior la ve como la tarea original junto a las salidas anteriores.',
  submit: 'Inicia una ejecución de canalización con esta entrada y abre su línea de tiempo de etapas.'
};
tips.pipelinePreview = {
  input: 'Entrada de ejemplo del llamador usada para generar el prompt de cada etapa. No se ejecuta nada.',
  sampleOutput: 'Salida simulada de la etapa {{stage}}, que se pasa a la etapa siguiente en la vista previa.',
  render: 'Genera el prompt de cada etapa con estos ejemplos, tal como lo recibirían las ejecuciones de etapa. Los secretos se ocultan.',
  stage: 'El prompt que recibiría esta etapa, generado desde su plantilla de traspaso con los ejemplos anteriores.',
  rendered: 'El prompt de la etapa se generó sin errores.',
  failed: 'No se pudo generar el prompt de la etapa; el mensaje explica por qué, por ejemplo un agente o despliegue que falta.'
};
Object.assign(tips.views.runDetail, {
  pipelineRun: 'Esta ejecución es una etapa de una ejecución de canalización. El texto tras el ID indica la posición de la etapa y la pasada.',
  openPipelineRun: 'Abre la ejecución de canalización a la que pertenece esta ejecución, con su línea de tiempo de etapas y sus revisiones.'
});
tips.views.pipelineRunDetail = {
  viewJson: 'Muestra la ejecución de canalización completa con sus etapas, ejecuciones de etapa y revisiones como JSON.',
  delete: 'Elimina esta ejecución de canalización terminada y sus revisiones. Sus ejecuciones de etapa se quedan en la página Ejecuciones.',
  live: 'Las actualizaciones llegan por la conexión en vivo en cuanto cambia una etapa o una revisión.',
  polling: 'La conexión en vivo no está disponible, así que la página vuelve a leer la ejecución de canalización cada pocos segundos.',
  pipeline: 'La canalización que ejecuta, con la versión con la que empezó. Haz clic para buscarla en Agentes > Canalizaciones.',
  openPipeline: 'Abre Agentes > Canalizaciones filtrado por esta canalización.',
  openRun: 'Abre esta ejecución de etapa con su transcripción, su resultado y su telemetría.',
  finalRun: 'La ejecución de la última etapa. Su resultado es el resultado de la ejecución de canalización.',
  started: 'Cuándo se creó la ejecución de la primera etapa.',
  input: 'La entrada con la que se inició la ejecución de canalización. Todas las etapas la ven como la tarea original.',
  reviewTitle: 'Una etapa terminó y espera tu decisión. Lee su salida en la ejecución de etapa y luego decide.',
  stages: 'Todas las etapas en orden de ejecución con su estado, pasadas, intentos, correcciones, ejecuciones de etapa y revisiones.',
  current: 'La etapa en la que está ahora la ejecución de canalización.',
  reviewGate: 'Esta etapa espera a que una persona revise su salida antes de que la canalización continúe.',
  agent: 'El agente que ejecuta esta etapa, tal como se registró al iniciar la ejecución de canalización.',
  counts: 'Las pasadas cuentan cada ejecución de la etapa; los intentos, las ejecuciones desde la última revisión; las correcciones, los cambios pedidos.',
  reviewItem: 'Una revisión de una pasada de esta etapa y cómo se decidió.',
  columns: {
    execution: 'Qué pasada de la etapa es esta ejecución. Los reintentos tras fallos y las correcciones tras revisiones añaden pasadas.',
    run: 'La ejecución de etapa. Haz clic para abrir su transcripción y su resultado.',
    status: 'Estado de la ejecución de etapa en este momento.',
    outcome: 'Por qué terminó la ejecución de etapa.',
    error: 'Mensaje de error de la ejecución de etapa, cuando falló.',
    created: 'Cuándo se creó la ejecución de etapa.'
  }
};
tips.views.settings.fields.Runtime.PipelineSweepIntervalMs = 'Cada cuánto el líder hace avanzar las ejecuciones de canalización que perdieron una señal de finalización, reintenta inicios de etapa bloqueados y aplica los tiempos de espera de revisión y los límites de tiempo de las canalizaciones, en milisegundos.';
tips.views.settings.fields.Runtime.PipelineMaxStages = 'Máximo de etapas que puede tener una definición de canalización. Se rechaza guardar una canalización con más etapas.';
tips.views.settings.fields.Runs = Object.assign(tips.views.settings.fields.Runs || {}, {
  DelegationChildQueueDepth: 'Máximo de ejecuciones delegadas en cola cuyo padre las espera, en todo el clúster. Una ejecución que empieza a esperar otra ejecución delegada por encima de este límite falla de inmediato con DelegationCapacityExhausted.',
  DelegationRetryAfterSeconds: 'Segundos sugeridos en Retry-After cuando se rechaza con DelegationCapacityExhausted una delegación que espera.'
});
Object.assign(explainers, {
  pipelines: {
    title: 'Canalizaciones y etapas',
    p1: 'Una canalización encadena agentes. Cada etapa ejecuta un agente, opcionalmente en un despliegue fijo, y pasa su salida (texto, salida estructurada y referencias a artefactos) a la siguiente etapa mediante una plantilla de prompt.',
    p2: 'Una etapa puede reintentar ejecuciones fallidas, continuar tras un fallo y esperar una revisión. Las revisiones aparecen en Aprobaciones > Revisiones de etapa; pedir cambios vuelve a ejecutar la etapa con los comentarios.',
    p3: 'Editar una canalización crea una versión nueva. Las ejecuciones de canalización ya iniciadas conservan las etapas con las que empezaron.'
  },
  pipelineRuns: {
    title: 'Ejecuciones de canalización',
    p1: 'Una ejecución de canalización ejecuta en orden las etapas de una versión de la canalización. Cada pasada de etapa es una ejecución normal, enlazada desde la línea de tiempo de etapas.',
    p2: 'Cancelar detiene la ejecución de la etapa actual y cierra la revisión pendiente. Reintentar reanuda una ejecución de canalización fallida, con tiempo agotado o cancelada en la etapa donde se detuvo.'
  },
  pipelineReviews: {
    title: 'Revisiones de etapa',
    p1: 'Una etapa que requiere revisión espera aquí cuando termina. Aprobar continúa con la siguiente etapa, Pedir cambios vuelve a ejecutar la etapa con tus comentarios y Rechazar hace fallar la ejecución de canalización.',
    p2: 'Las revisiones sin tiempo de espera esperan hasta que decida una persona. Con tiempo de espera, la acción de tiempo agotado de la etapa decide cuando se acaba el tiempo.'
  }
});
tips.views.settings.fields.Scheduling = Object.assign(tips.views.settings.fields.Scheduling || {}, {
  QueueWakeFanout: "Cuántas solicitudes de lease en espera despierta cada réplica para una ejecución recién encolada, entre aquellas cuyo worker podría tomarla. Una solicitud que no puede tomar la ejecución la pasa a la siguiente. 0 despierta todas las solicitudes compatibles en todas las réplicas, como antes. Predeterminado 1.",
  RemoteWakeDelayMs: "Cuánto esperan las demás réplicas antes de despertar una de sus solicitudes de lease para una ejecución cuya réplica ya despertó una, en milisegundos. La espera termina antes si la ejecución se reclama o si esa réplica ya no tiene solicitudes que puedan tomarla. 0 despierta una solicitud en cada réplica de inmediato. Predeterminado 250."
});
tips.views.settings.fields.Auth = Object.assign(tips.views.settings.fields.Auth || {}, {
  CacheSeconds: "Cuánto tiempo guarda cada réplica las sesiones, inquilinos, usuarios y credenciales que lee para autenticar solicitudes, en segundos. Revocar un token o cambiar usuarios, credenciales, roles o inquilinos mediante la API surte efecto en todas las réplicas de inmediato; este es el tiempo máximo que un cambio hecho de otra forma puede pasar inadvertido. 0 desactiva la caché. Predeterminado 5."
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
   "triggers": "Inicia ejecuciones sin un llamador: programaciones cron evaluadas en una zona horaria y URL de webhook que aceptan solicitudes firmadas con HMAC desde otros sistemas.",
   "notifications": "Avisa a otros sistemas: Garrison envía por POST una notificación JSON firmada cuando termina una ejecución o canalización o una aprobación espera a una persona."
  }
 },
 "filters": {
  "type": "Muestra solo disparadores cron o solo de webhook. Elige Todos para ver ambos.",
  "outcome": "Muestra solo disparos que iniciaron una ejecución, fallaron o se omitieron.",
  "deliveryStatus": "Muestra solo entregas en un estado: en espera, enviándose, entregadas o abandonadas."
 },
 "enums": {
  "triggerType": {
   "Cron": "Se dispara según una programación cron de cinco campos que el líder del plano de control evalúa en la zona horaria del disparador.",
   "Webhook": "Se dispara cuando llega a su URL una solicitud firmada con el secreto del disparador."
  },
  "triggerTargetType": {
   "Agent": "Cada disparo pone en cola una ejecución del agente, en un despliegue fijo o según el peso del tráfico.",
   "Pipeline": "Cada disparo inicia una ejecución de la canalización con todas sus etapas."
  },
  "triggerFireSource": {
   "Cron": "La programación cron venció y el líder la disparó.",
   "Webhook": "Llegó una entrega de webhook firmada correctamente.",
   "Manual": "Una persona o credencial usó la acción Disparar ahora."
  },
  "triggerFireOutcome": {
   "Started": "El disparo creó una ejecución o ejecución de canalización; sigue el enlace para verla.",
   "Failed": "No se inició nada: la plantilla falló, la identidad de ejecución perdió acceso o faltaba el destino.",
   "Skipped": "La ocurrencia se perdió durante más tiempo que el límite de recuperación de cron y no se disparó."
  },
  "notificationEvent": {
   "RunSucceeded": "Se envía cuando una ejecución termina correctamente.",
   "RunFailed": "Se envía cuando una ejecución termina con fallo o rechazada.",
   "RunCancelled": "Se envía cuando una ejecución se cancela antes de terminar.",
   "RunTimedOut": "Se envía cuando una ejecución supera su plazo y se detiene.",
   "PipelineCompleted": "Se envía cuando todas las etapas de una ejecución de canalización salieron bien.",
   "PipelineFailed": "Se envía cuando una ejecución de canalización falla, agota el tiempo o se cancela.",
   "ApprovalRequested": "Se envía cuando una aprobación de herramienta o una revisión de etapa espera a una persona.",
   "Test": "Solo lo envía la acción Enviar prueba, para comprobar que el endpoint funciona."
  },
  "notificationDeliveryStatus": {
   "Pending": "Espera su próximo intento; los intentos fallidos se repiten con esperas crecientes.",
   "Delivering": "Una réplica del plano de control la está enviando ahora.",
   "Succeeded": "El endpoint respondió con un estado 2xx y la notificación terminó.",
   "Failed": "Garrison dejó de intentarlo: se agotaron los intentos o el endpoint respondió con un estado que no se reintenta."
  },
  "runKind": {
   "Invoke": "Iniciada por un llamador mediante REST, MCP, A2A o el panel.",
   "Delegated": "Iniciada por otro agente mediante la delegación de Garrison.",
   "Test": "Una ejecución de prueba de un despliegue desde el panel o la API.",
   "Retry": "Un nuevo intento de una ejecución anterior que alguien reintentó.",
   "Pipeline": "Una ejecución de etapa de una ejecución de canalización.",
   "Trigger": "Iniciada por una programación cron, un webhook firmado o un disparo manual."
  },
  "auditEventType": {
   "SigningSecretRotated": "Alguien reemplazó el secreto de firma de un disparador o endpoint de notificación; el anterior dejó de funcionar."
  }
 },
 "resources": {
  "runs": {
   "triggerId": "El disparador que inició esta ejecución. Haz clic para abrir su historial de disparos.",
   "kind": "Cómo se inició la ejecución: por un llamador, otro agente, como prueba, reintento, etapa de canalización o por un disparador.",
   "openTrigger": "Abre el historial de disparos del disparador que inició esta ejecución."
  },
  "triggers": {
   "add": "Crea una programación cron o un webhook firmado que inicie un agente o una canalización sin que nadie lo invoque.",
   "type": "Cron se dispara según una programación; Webhook cuando otro sistema envía una solicitud firmada. No se puede cambiar después.",
   "target": "Qué inicia cada disparo: una ejecución de un agente o de una canalización.",
   "schedule": "La expresión cron y su zona horaria, o la indicación de que el disparador espera entregas de webhook.",
   "lastFire": "Cuándo se disparó por última vez y si ese disparo inició una ejecución.",
   "nextFireUtc": "Cuándo se dispara de nuevo un disparador cron activo. Los de webhook y los inactivos no tienen.",
   "fireCount": "Cuántas veces se disparó, incluidos los disparos fallidos y omitidos.",
   "runAs": "El usuario o credencial con cuyos permisos actúan las ejecuciones. Cada disparo comprueba que aún puede ejecutar el destino.",
   "signingSecretLast4": "Los cuatro últimos caracteres del secreto de firma, para saber qué secreto usa un emisor.",
   "targetType": "Si cada disparo ejecuta un agente o inicia una canalización completa.",
   "agentId": "El agente que ejecuta cada disparo. Necesitas permiso para ejecutarlo.",
   "deploymentId": "Fija las ejecuciones a un despliegue del agente o déjalo vacío para elegir por peso.",
   "pipelineId": "La canalización que inicia cada disparo. Necesitas permiso para iniciarla y para ejecutar sus agentes de etapa.",
   "inputTemplateId": "La plantilla de prompt que convierte el disparo (hora, carga útil, ID de entrega) en la entrada de la ejecución.",
   "priority": "Prioridad en cola de las ejecuciones que inicia, de -100 a 100. Las más altas se asignan antes.",
   "cronExpression": "Cuándo se dispara, como expresión cron de cinco campos o una macro como @hourly.",
   "timeZone": "La zona horaria IANA en la que se lee la expresión cron, por ejemplo Europe/Madrid.",
   "webhook": "Envía aquí solicitudes POST firmadas. Las que no tienen firma, la tienen caducada o incorrecta se rechazan con 401.",
   "actions": {
    "fire": "Dispara este disparador una vez ahora, con una carga útil de prueba opcional, y ve la ejecución que inició.",
    "fires": "Mira cuándo y por qué se disparó y qué ejecución inició cada disparo.",
    "runs": "Abre la lista de ejecuciones filtrada a las que inició este disparador.",
    "rotateSecret": "Crea un nuevo secreto de firma del webhook. El anterior deja de funcionar al instante."
   },
   "fires": {
    "firedUtc": "Cuándo se procesó el disparo. Los disparos cron también muestran la ocurrencia a la que corresponden.",
    "source": "Por qué se disparó: su programación, una entrega de webhook o una persona.",
    "outcome": "Si el disparo inició una ejecución, falló o se omitió.",
    "started": "La ejecución o ejecución de canalización que creó este disparo. Haz clic para abrirla.",
    "deliveryId": "La cabecera X-Garrison-Delivery de la solicitud; las repeticiones con el mismo valor disparan una vez.",
    "error": "Por qué el disparo no inició nada, con un código de error estable.",
    "runId": "La ejecución que creó este disparo. Haz clic para abrirla.",
    "pipelineRunId": "La ejecución de canalización que inició este disparo. Haz clic para abrirla."
   }
  },
  "notifications": {
   "add": "Registra una URL que recibe un POST HTTP firmado cuando ocurren los eventos elegidos en este inquilino.",
   "url": "Dónde envía Garrison las notificaciones. Las direcciones privadas y de metadatos se rechazan y no se siguen redirecciones.",
   "events": "Los eventos que recibe este endpoint. Pasa el cursor por el valor para verlos todos.",
   "filters": "Filtros de agente o despliegue que limitan qué eventos de ejecución y aprobación se envían.",
   "signingSecretLast4": "Los cuatro últimos caracteres del secreto de firma, para que los receptores sepan qué secreto firma.",
   "includeResultText": "Si las notificaciones de ejecución incluyen el texto del resultado, recortado al límite configurado.",
   "agentId": "Envía solo eventos de ejecuciones de este agente. Los eventos de canalización se detienen mientras haya un filtro.",
   "deploymentId": "Envía solo eventos de ejecuciones de este despliegue. Los eventos de canalización se detienen mientras haya un filtro.",
   "resultTextMaxChars": "Texto de resultado más largo incluido en una notificación, en caracteres.",
   "actions": {
    "test": "Envía ahora una notificación de prueba y muestra si el endpoint la aceptó.",
    "deliveries": "Mira todas las notificaciones enviadas a este endpoint con intentos, estado HTTP y fallos.",
    "rotateSecret": "Crea un nuevo secreto de firma. Los reintentos ya en cola también se firman con él."
   },
   "deliveries": {
    "createdUtc": "Cuándo se puso en cola el evento para este endpoint. Haz clic para ver los detalles.",
    "event": "Qué evento informa esta notificación.",
    "status": "Si la notificación espera, se está enviando, se entregó o se abandonó.",
    "attempts": "Intentos realizados hasta ahora y el máximo que se hará.",
    "lastStatusCode": "Estado HTTP que respondió el endpoint en el último intento; vacío si no hubo respuesta.",
    "lastError": "Qué salió mal en el último intento, como un tiempo agotado o un destino rechazado.",
    "lastAttemptUtc": "Cuándo se intentó enviar esta notificación por última vez.",
    "nextAttemptUtc": "Cuándo toca el próximo reintento; vacío cuando la entrega terminó.",
    "deliveredUtc": "Cuándo aceptó el endpoint la notificación.",
    "payload": "El cuerpo JSON exacto que se envía en cada intento. Nunca contiene secretos.",
    "id": "Identificador de entrega, enviado también como X-Garrison-Delivery para que los receptores ignoren repeticiones."
   }
  }
 },
 "views": {
  "runDetail": {
   "trigger": "El disparador que inició esta ejecución y cómo se inició.",
   "openTrigger": "Abre el historial de disparos de este disparador en Agentes > Disparadores."
  },
  "pipelineRunDetail": {
   "trigger": "El disparador que inició esta ejecución de canalización. Sus ejecuciones de etapa llevan el mismo disparador."
  },
  "settings": {
   "groups": {
    "Triggers": "Límites de los webhooks de disparadores, recuperación de cron tras una caída y conservación del historial de disparos.",
    "Notifications": "Entrega de notificaciones salientes: protección SSRF, reintentos y esperas, tiempos límite y conservación del registro de entregas."
   },
   "fields": {
    "Triggers": {
     "WebhookMaxBodyBytes": "Cuerpo de solicitud de webhook más grande en bytes. Las entregas mayores responden 413 antes de comprobar la firma.",
     "WebhookToleranceSeconds": "Diferencia máxima entre la marca de tiempo de la firma y el reloj del servidor. Las entregas antiguas se rechazan, así que no se pueden repetir solicitudes capturadas.",
     "CronMaxLatenessSeconds": "Las ocurrencias de cron perdidas se agrupan en un disparo, salvo que la última sea más antigua que estos segundos; entonces se registra como Omitido. 0 siempre dispara una vez.",
     "FireRetentionDays": "Días que se conserva el historial de disparos."
    },
    "Notifications": {
     "AllowPrivateDestinations": "Permite URL de notificación en redes de loopback y privadas. Desactivado por defecto para evitar la falsificación de solicitudes del lado del servidor; las direcciones de enlace local y de metadatos siguen bloqueadas.",
     "MaxAttempts": "Máximo de intentos de entrega de una notificación antes de abandonarla.",
     "InitialBackoffSeconds": "Espera antes del segundo intento; cada espera siguiente se duplica hasta la espera máxima.",
     "MaxBackoffSeconds": "La espera más larga entre dos intentos de una notificación.",
     "TimeoutSeconds": "Segundos que puede durar un intento de entrega, conexión incluida.",
     "DispatchIntervalMs": "Cada cuánto busca cada réplica del plano de control notificaciones pendientes, en milisegundos.",
     "SweepOverlapSeconds": "Segundos de historial ya revisado que el líder vuelve a leer en cada pasada para no perder eventos tardíos.",
     "DeliveryRetentionDays": "Días que las entregas terminadas permanecen en el registro."
    }
   }
  }
 },
 "signingSecret": {
  "done": "Cierra esta ventana. El secreto no se puede volver a mostrar, así que cópialo antes.",
  "secret": "El secreto de firma. Emisores y receptores lo usan para calcular la firma HMAC-SHA256.",
  "copy": "Copia el secreto de firma al portapapeles para guardarlo en el otro sistema.",
  "url": "La URL a la que otros sistemas envían por POST entregas de webhook firmadas.",
  "copyUrl": "Copia la URL del webhook al portapapeles."
 },
 "triggerFire": {
  "submit": "Dispara el disparador una vez ahora con esta carga útil. La ejecución se inicia con la identidad de ejecución del disparador.",
  "body": "Texto de carga útil opcional. La plantilla de entrada lo ve como webhook.body, y como webhook.json si es JSON.",
  "contentType": "Tipo de medio de la carga útil, como application/json. Vacío para texto plano.",
  "openRun": "Abre la ejecución que inició este disparo.",
  "openPipelineRun": "Abre la ejecución de canalización que inició este disparo."
 },
 "triggerFires": {
  "refresh": "Vuelve a cargar los disparos más recientes de este disparador."
 },
 "notificationDeliveries": {
  "refresh": "Vuelve a cargar las entregas más recientes de este endpoint.",
  "open": "Muestra la carga útil, los intentos y el último fallo de esta entrega debajo de la lista.",
  "detail": "Todos los campos de la entrega seleccionada, incluido el cuerpo JSON enviado."
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
  "title": "Disparadores",
  "p1": "Un disparador inicia una ejecución de agente o de canalización sin que nadie la invoque: según una programación cron o cuando otro sistema envía un webhook firmado con el secreto del disparador.",
  "p2": "La entrada de la ejecución sale de una plantilla de prompt que puede usar la hora del disparo y la carga útil del webhook. Las ejecuciones actúan como el usuario o credencial que guardó el disparador por última vez, y cada disparo comprueba que aún puede ejecutar el destino.",
  "p3": "Si ninguna réplica pudo disparar una programación durante un tiempo, las ocurrencias perdidas se convierten en un único disparo. Las entregas de webhook que repiten un valor X-Garrison-Delivery disparan una vez."
 },
 "notifications": {
  "title": "Notificaciones",
  "p1": "Un endpoint de notificación recibe un POST JSON firmado cuando ocurre un evento suscrito: una ejecución o canalización que termina, o una aprobación que espera a una persona.",
  "p2": "Las entregas se ponen en cola de forma duradera y se reintentan con esperas crecientes. Cada intento lleva el mismo ID de entrega, así que los receptores pueden ignorar repeticiones.",
  "p3": "Las notificaciones nunca incluyen secretos ni la entrada de la ejecución, y la salida solo si lo permites. Las direcciones de redes privadas se rechazan salvo que un operador las permita."
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
   "menu": "Descargue esta transcripción como archivo: entrada, texto del asistente, llamadas a herramientas, aprobaciones, errores, uso y coste, con los secretos ocultos.",
   "markdown": "Descargue una transcripción Markdown legible, adecuada para compartir o adjuntar a una incidencia.",
   "json": "Descargue la transcripción como documento JSON tipado (garrison.transcript/v1) para scripts y otras herramientas.",
   "includeThinking": "Incluya también los eventos de razonamiento del modelo. Se omiten por defecto porque son largos e internos."
  }
 },
 "views": {
  "invoke": {
   "schemaForm": {
    "title": "Este agente tiene un esquema de entrada, así que su entrada es un documento JSON. Rellene el formulario o cambie a JSON sin procesar.",
    "modeForm": "Edite la entrada con un formulario generado a partir del esquema de entrada del agente.",
    "modeJson": "Edite la entrada como texto JSON sin procesar. Los valores se conservan al volver al formulario.",
    "field": "Valor de {{name}}, tal como lo describe el esquema de entrada del agente.",
    "fieldWithDescription": "{{name}}: {{description}}",
    "addItem": "Añada otro elemento a esta lista.",
    "removeItem": "Quite este elemento de la lista.",
    "jsonLabel": "El documento JSON que se envía como entrada de la ejecución. Debe cumplir el esquema de entrada del agente."
   }
  },
  "manifests": {
   "bundle": {
    "scopeAll": "Exporte todos los recursos de este inquilino. Los integrados se omiten salvo que los incluya.",
    "scopeSelected": "Exporte solo los tipos y recursos que elija, opcionalmente con aquello de lo que dependen.",
    "kinds": "Exporte todos los recursos de los tipos marcados.",
    "kind": "Exporte todos los recursos {{kind}} de este inquilino.",
    "resources": "Recursos concretos que exportar, escritos como Tipo/nombre, por ejemplo Agent/triage o Pipeline/release.",
    "followReferences": "Exporte también aquello de lo que depende la selección: implementaciones, perfiles de harness, plantillas de prompt, espacios de trabajo, servidores MCP, disparadores y puntos de notificación. Los secretos se indican como requisitos y nunca se exportan.",
    "includeBuiltIn": "Añada las plantillas de prompt y los perfiles de harness integrados a los que hace referencia el paquete. Al aplicar no se modifican; solo se comprueba que existan."
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
   "Draft": "Una revisión sin publicar. Solo hay un borrador abierto por agente; ningún despliegue lo ejecuta hasta que se publique.",
   "Published": "Una revisión congelada. La ejecutan los despliegues que siguen la última revisión o que fijan esta."
  },
  "promotionKind": {
   "Promote": "Fijó los despliegues de un entorno a una revisión tomada del entorno anterior.",
   "Rollback": "Restauró las fijaciones de revisión que una promoción sustituyó, tal como estaban antes."
  },
  "promotionOutcome": {
   "Applied": "Las fijaciones que estableció este registro siguen vigentes.",
   "RolledBack": "Una reversión posterior restauró las fijaciones que esta promoción sustituyó."
  },
  "revisionChangeType": {
   "Changed": "El campo tiene un valor distinto en la revisión más reciente.",
   "Added": "El campo o la entrada de la lista solo existe en la revisión más reciente.",
   "Removed": "El campo o la entrada de la lista solo existe en la revisión más antigua."
  }
 },
 "filters": {
  "environment": "Mostrar solo los despliegues de un entorno, como dev, staging o prod. Se aplica a la página cargada."
 },
 "resources": {
  "deployments": {
   "environment": "El entorno al que pertenece este despliegue. Las promociones mueven una revisión de un entorno al siguiente en el orden del inquilino.",
   "agentRevisionId": "La revisión del agente que ejecuta este despliegue. Última sigue cada revisión recién publicada; una revisión fijada se mantiene hasta que se cambie o se promueva.",
   "environmentBadge": "Este despliegue se ejecuta en el entorno {{environment}}.",
   "followsLatest": "Sin fijar: este despliegue ejecuta la última revisión publicada del agente.",
   "pinnedRevision": "Fijado: este despliegue ejecuta {{revision}} hasta que cambie la fijación.",
   "actions": {
    "promote": "Promover la revisión del agente de un entorno al siguiente y actualizar las fijaciones de todos sus despliegues allí.",
    "promotions": "Ver las promociones y reversiones anteriores, y revertir una promoción para restaurar las fijaciones previas."
   }
  }
 },
 "views": {
  "agentDetail": {
   "reviewDraft": "Abrir la pestaña Revisiones para comparar el borrador con la última revisión publicada y publicarlo o descartarlo.",
   "tabs": {
    "revisions": "Cada revisión guardada de este agente: compare dos cualesquiera, publique el borrador o descártelo."
   },
   "columns": {
    "environment": "El entorno al que pertenece el despliegue, usado por las promociones.",
    "revision": "La revisión que ejecuta el despliegue: Última sigue cada publicación, un número es una fijación."
   }
  }
 },
 "revisions": {
  "columns": {
   "number": "Número de revisión. Los números aumentan con cada revisión guardada de este agente.",
   "state": "Los borradores aún pueden cambiar; las revisiones publicadas están congeladas.",
   "author": "Quién guardó esta revisión: el usuario o la clave de acceso que la creó o la sustituyó por última vez.",
   "changeNote": "Qué cambió y por qué, tal como se anotó al publicar la revisión.",
   "publishedUtc": "Cuándo se publicó la revisión. Vacío para el borrador.",
   "actions": "Comparar, publicar o descartar una revisión."
  },
  "latest": "La última revisión publicada. Los despliegues sin fijación ejecutan esta.",
  "compare": "Mostrar qué cambió entre esta revisión y la revisión publicada anterior.",
  "publish": "Publicar este borrador para que pase a ser la última revisión publicada.",
  "discard": "Eliminar este borrador. Las revisiones publicadas no se ven afectadas.",
  "discardConfirm": "Eliminar el borrador definitivamente. No se puede deshacer.",
  "from": "El lado más antiguo de la comparación: valores mostrados como Antes.",
  "to": "El lado más reciente de la comparación: valores mostrados como Después.",
  "publishSubmit": "Publicar el borrador ahora. Los despliegues que siguen la última revisión lo ejecutan desde su próxima ejecución.",
  "changeNote": "Nota opcional que se guarda con la revisión publicada y se muestra en la lista de revisiones. Hasta 2000 caracteres.",
  "diffColumns": {
   "field": "El campo de la revisión que difiere, como description o promptPins.",
   "change": "Si el campo se modificó, se añadió o se eliminó.",
   "before": "El valor en la revisión más antigua.",
   "after": "El valor en la revisión más reciente."
  }
 },
 "promote": {
  "agent": "El agente cuya revisión se promueve. Se actualizan sus despliegues en el entorno de destino.",
  "revision": "Déjelo en la revisión de origen para promover lo que ejecuta el entorno de origen, o elija una revisión publicada.",
  "source": "El entorno del que procede la revisión.",
  "target": "El entorno que se actualiza. De forma predeterminada, el siguiente al de origen en el orden del inquilino.",
  "allowSkip": "Necesario cuando el destino no es el entorno siguiente. Los entornos saltados quedan registrados con la promoción.",
  "note": "Nota opcional que se guarda con el registro de promoción. Hasta 2000 caracteres.",
  "submit": "Aplicar la promoción ahora. Cada despliegue del agente en el entorno de destino recibe la nueva fijación."
 },
 "promotions": {
  "agentFilter": "Mostrar solo las promociones y reversiones de un agente.",
  "refresh": "Volver a cargar el historial de promociones desde el servidor.",
  "columns": {
   "createdUtc": "Cuándo se aplicó la promoción o la reversión.",
   "kind": "Promoción, o reversión de una promoción anterior.",
   "outcome": "Si las fijaciones siguen vigentes o se revirtieron después.",
   "agent": "El agente cuyos despliegues se actualizaron.",
   "revision": "La revisión que se promovió.",
   "environments": "Entorno de origen y de destino de la promoción.",
   "deployments": "Cada despliegue actualizado, con su fijación antes y después.",
   "actor": "Quién aplicó la promoción o la reversión.",
   "note": "La nota indicada al crear el registro.",
   "actions": "Revertir una promoción aplicada."
  },
  "skipped": "Esta promoción saltó al menos un entorno, para lo cual hizo falta Permitir saltar entornos.",
  "rollback": "Restaurar las fijaciones de revisión que tenían estos despliegues antes de esta promoción.",
  "rollbackConfirm": "Aplicar la reversión ahora. Queda registrada en el historial de promociones.",
  "rollbackNote": "Nota opcional que se guarda con el registro de reversión. Hasta 2000 caracteres."
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
   "SystemPrompt": "El prompt de sistema del agente, aportado por una plantilla de prompt. No tiene archivos subidos.",
   "Skill": "Una carpeta de habilidad que carga el harness, colocada donde el perfil del harness pone las habilidades.",
   "ReferenceFile": "Un archivo que el agente puede leer durante una ejecución, colocado en el espacio de trabajo de la ejecución.",
   "DocumentTemplate": "Una plantilla de documento, como un archivo .docx o .dotx, que el agente rellena durante una ejecución."
  },
  "runOutcome": {
   "AssetIntegrityFailed": "Un archivo de recurso no superó su comprobación SHA-256 o no se pudo descargar antes del inicio, así que el harness nunca arrancó."
  }
 },
 "resources": {
  "agentAssets": {
   "add": "Cree un recurso nuevo. Después suba sus archivos como una versión y fíjelo en una revisión de agente.",
   "name": "Nombre único del recurso en este inquilino. Las revisiones y los manifiestos pueden referirse al recurso por este nombre.",
   "kind": "Prompt de sistema, habilidad, archivo de referencia o plantilla de documento. No se puede cambiar después de crear el recurso.",
   "currentVersion": "La versión más reciente. Los recursos fijados que siguen la versión actual la usan desde la próxima ejecución.",
   "description": "Qué contiene el recurso y qué agentes lo usan, en palabras sencillas.",
   "tags": "Etiquetas para buscar y agrupar recursos. No afectan a las ejecuciones.",
   "artifactStoreId": "Dónde se almacenan los archivos del recurso. Base de datos de Garrison significa que se guardan en la base de datos del plano de control.",
   "promptTemplateId": "La plantilla de prompt que aporta el texto de un recurso de prompt de sistema. Obligatoria solo para prompts de sistema.",
   "databaseStore": "Los archivos se almacenan en la base de datos de Garrison, no en un almacén de artefactos externo.",
   "kindFilter": "Mostrar solo recursos de un tipo: prompts de sistema, habilidades, archivos de referencia o plantillas de documento.",
   "actions": {
    "versions": "Abrir el historial de versiones: explorar archivos, previsualizar archivos de texto, descargarlos y subir una versión nueva."
   }
  }
 },
 "revisions": {
  "columns": {
   "assetPins": "Recursos que fija esta revisión, cada uno en una versión fija o siguiendo la versión actual del recurso."
  }
 },
 "assets": {
  "files": "Elija uno o varios archivos de su equipo. Se leen en el navegador y se suben juntos como una versión.",
  "path": "Dónde va el archivo dentro del recurso, como ruta relativa con barras normales, por ejemplo docs/guide.md.",
  "uploadColumns": {
   "path": "La ruta de cada archivo dentro del recurso. Edítela antes de subir si hace falta.",
   "mediaType": "El tipo de medio que indicó el navegador. Si está vacío, el servidor lo deduce de la extensión.",
   "size": "Tamaño del archivo leído de su equipo.",
   "actions": "Quitar un archivo de esta subida antes de enviarla."
  },
  "removeFile": "Quitar este archivo de la subida. No se envía nada hasta que suba.",
  "changeNote": "Nota opcional que se guarda con la versión nueva y se muestra en el historial de versiones. Hasta 2000 caracteres.",
  "upload": "Subir los archivos elegidos como una versión nueva. Si los archivos son idénticos, se devuelve la versión actual.",
  "current": "Esta es la versión actual del recurso, que usan los recursos fijados que siguen la versión actual.",
  "showFiles": "Mostrar los archivos de esta versión con sus tamaños, resúmenes, vistas previas y descargas.",
  "versionColumns": {
   "number": "Número de versión. Cada subida con archivos distintos añade el número siguiente.",
   "author": "Quién subió esta versión.",
   "changeNote": "La nota indicada al subir esta versión.",
   "totalBytes": "Tamaño combinado de todos los archivos de esta versión.",
   "createdUtc": "Cuándo se subió esta versión.",
   "actions": "Mostrar los archivos de una versión."
  },
  "fileColumns": {
   "path": "Ruta del archivo dentro del recurso, que es donde se coloca para una ejecución.",
   "mediaType": "Tipo de medio almacenado con el archivo.",
   "sizeBytes": "Tamaño del archivo en esta versión.",
   "sha256": "Inicio del resumen SHA-256 del archivo. Los nodos de trabajo lo comprueban antes de que empiece una ejecución.",
   "actions": "Previsualizar archivos de texto aquí mismo o descargar cualquier archivo."
  },
  "sha256Full": "Resumen SHA-256 completo de este archivo: {{sha}}",
  "preview": "Mostrar este archivo de texto, de solo lectura, debajo de la lista de archivos. Aquí no se puede editar nada.",
  "download": "Descargar este archivo de esta versión a su equipo.",
  "pinsSave": "Guardar estos recursos fijados en el borrador. Después publique el borrador para que los despliegues los usen.",
  "pinAsset": "El recurso que se fija en esta revisión. Cada recurso se puede fijar una sola vez.",
  "pinVersion": "Fije una versión concreta, o elija Versión actual para usar la versión más reciente del recurso en el momento de la ejecución.",
  "removePin": "Quitar este recurso de los recursos fijados de la revisión.",
  "addPin": "Añadir otro recurso a los recursos fijados de la revisión.",
  "editPins": "Añadir, quitar o cambiar los recursos fijados de esta revisión en borrador.",
  "pinsNewDraft": "Iniciar un borrador nuevo a partir de la última revisión publicada y elegir sus recursos fijados.",
  "pinnedVersion": "Este recurso está fijado en una versión concreta, así que las ejecuciones lo siguen usando tras nuevas subidas.",
  "pinnedCurrent": "Este recurso sigue su versión actual, así que las ejecuciones usan la subida más reciente."
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
    "turns": "Los turnos de esta conversación, del más antiguo al más reciente, y el cuadro para enviar el siguiente.",
    "files": "La carpeta compartida que leen y escriben todos los turnos y todos los agentes delegados de esta conversación, con historial de versiones y descargas."
   }
  },
  "runDetail": {
   "fileSpace": "El espacio de archivos compartido que esta ejecución copia a su espacio de trabajo al empezar y escribe de vuelta al terminar. Lo comparten las ejecuciones de una conversación, de una ejecución de pipeline o de un árbol de delegación.",
   "openFiles": "Abrir la pestaña Archivos de la conversación de esta ejecución para ver, descargar o subir los archivos compartidos."
  }
 },
 "resources": {
  "deployments": {
   "fileSpaceMountPath": "Carpeta dentro del espacio de trabajo de la ejecución donde se sincroniza el espacio de archivos compartido, por ejemplo files. Relativa, con barras normales, de 128 caracteres como máximo."
  }
 },
 "files": {
  "summary": "Cuántos archivos actuales tiene la carpeta compartida y su tamaño total. Los archivos eliminados no cuentan.",
  "live": "La lista se actualiza en cuanto un turno, un agente delegado o una persona cambia un archivo.",
  "polling": "La conexión en vivo no está disponible, así que la lista se vuelve a cargar cada {{seconds}} segundos mientras esta pestaña esté abierta.",
  "includeDeleted": "Listar también los archivos eliminados. Sus versiones se conservan y se pueden seguir descargando.",
  "refresh": "Volver a cargar ahora la lista de archivos desde el servidor.",
  "columns": {
   "path": "Ruta del archivo dentro de la carpeta compartida. Las ejecuciones lo encuentran en la carpeta del espacio de archivos de la implementación.",
   "currentVersion": "La versión más reciente. Cada escritura de un turno, un agente o una subida añade una.",
   "sizeBytes": "Tamaño de la versión actual del archivo.",
   "mediaType": "Tipo de medio guardado con la versión actual.",
   "lastUpdateUtc": "Cuándo cambió el archivo por última vez.",
   "actions": "Ver el historial de versiones, descargar la versión actual o eliminar el archivo."
  },
  "deleted": "Este archivo se eliminó. Los turnos siguientes ya no lo ven, pero sus versiones se conservan.",
  "versions": "Abrir el historial de versiones de este archivo, con descarga y vista previa de texto para cada versión.",
  "download": "Descargar la versión actual de este archivo mediante un enlace de corta duración.",
  "delete": "Eliminar este archivo de la carpeta compartida. Sus versiones se conservan.",
  "confirmDelete": "Eliminar el archivo ahora. Los turnos siguientes no lo verán.",
  "versionColumns": {
   "number": "Número de versión. Cada escritura añade el número siguiente.",
   "sizeBytes": "Tamaño del archivo en esta versión.",
   "mediaType": "Tipo de medio guardado con esta versión.",
   "sha256": "Inicio del resumen SHA-256 de esta versión. Los workers lo comprueban al sincronizar el archivo.",
   "writtenBy": "El agente cuya ejecución escribió esta versión, o la persona que la subió.",
   "createdUtc": "Cuándo se escribió esta versión.",
   "actions": "Ver las versiones de texto en vista previa o descargar cualquier versión."
  },
  "current": "Esta es la versión que ven los turnos siguientes.",
  "sha256Full": "Resumen SHA-256 completo de esta versión: {{sha}}",
  "openRun": "Abrir la ejecución que escribió esta versión.",
  "preview": "Mostrar esta versión de solo lectura debajo de la lista. Aquí no se puede editar nada.",
  "downloadVersion": "Descargar esta versión del archivo a su equipo.",
  "chooseFiles": "Elija uno o más archivos de su equipo. Se leen en el navegador y se suben de uno en uno.",
  "uploadColumns": {
   "path": "Dónde va cada archivo en la carpeta compartida. Modifíquela antes de subir si hace falta.",
   "replaces": "La versión de la lista que reemplaza esta subida, o Archivo nuevo. Un archivo que cambió desde entonces se guarda con un nombre de conflicto.",
   "size": "Tamaño del archivo tal como se leyó de su equipo.",
   "actions": "Sacar un archivo de esta subida antes de enviarla."
  },
  "path": "Ruta dentro de la carpeta compartida, relativa y con barras normales, por ejemplo notes/sources.md.",
  "removeFile": "Sacar este archivo de la subida. No se envía nada hasta que suba.",
  "upload": "Enviar cada archivo elegido a la carpeta compartida, de uno en uno, con la versión que reemplaza."
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
   "capabilities": "El catálogo de capacidades: agentes, herramientas MCP e integrados del harness con sus orígenes, indicaciones de coste y latencia, y una opción para actualizarlo."
  }
 },
 "filters": {
  "tag": "Muestra solo las capacidades con esta etiqueta exacta. La lista se actualiza cuando dejas de escribir.",
  "origin": "Muestra solo las entradas derivadas, que siguen a su origen, o solo las manuales, escritas por personas."
 },
 "enums": {
  "capabilityKind": {
   "Agent": "Otro agente de Garrison, descrito a partir de su última revisión publicada. Un agente orquestador puede delegarle trabajo.",
   "McpTool": "Una herramienta de un servidor MCP registrado en este inquilino, descrita a partir de la lista de herramientas del servidor.",
   "HarnessBuiltIn": "Un programa que el harness puede ejecutar en el host de su nodo de trabajo, como pandoc o LibreOffice, detectado por una sonda de herramienta de un perfil de harness."
  },
  "capabilityOrigin": {
   "Derived": "Garrison mantiene esta entrada sincronizada con su origen. No se puede editar ni eliminar aquí; cambia el origen.",
   "Manual": "Una persona escribió esta entrada. Se puede editar y eliminar aquí."
  },
  "capabilityHintStatus": {
   "Unknown": "Terminaron muy pocas ejecuciones en la ventana de indicaciones como para sacar conclusiones, así que no se muestran valores. Las herramientas MCP y los integrados siempre tienen indicaciones Desconocido.",
   "Known": "Terminaron suficientes ejecuciones en la ventana de indicaciones, así que los valores de duración y coste se basan en ejecuciones reales."
  },
  "runBlockedReason": {
   "NoToolWorker": "Bloqueada: el agente de esta ejecución usa una herramienta integrada del harness, como pandoc, y ningún nodo de trabajo listo capaz de ejecutarla informa esa herramienta. Espera en la cola hasta que se registre un nodo de trabajo así."
  }
 },
 "resources": {
  "capabilities": {
   "add": "Escribe una entrada manual para algo que Garrison no puede derivar, por ejemplo un servicio de conversión al que los agentes llegan mediante una skill.",
   "name": "Nombre con el que los agentes encuentran la capacidad. Los agentes llevan el nombre del agente, las herramientas MCP la forma server/tool y los integrados el de la herramienta.",
   "kind": "Agente, herramienta MCP o integrado del harness. Las entradas manuales pueden usar cualquier tipo.",
   "origin": "Las entradas derivadas siguen a su origen y no se pueden cambiar aquí; las manuales las escribieron personas.",
   "summary": "Qué hace la capacidad y cuándo usarla, tal como lo leen los agentes. Hasta 4000 caracteres.",
   "source": "De dónde viene la entrada: el agente, el servidor MCP y la herramienta, o el perfil de harness y la etiqueta de nodo que necesita una ejecución.",
   "hints": "Duración mediana y percentil 90 de las ejecuciones, y coste medio, calculados con ejecuciones terminadas recientes, o Desconocido cuando terminaron muy pocas.",
   "tags": "Etiquetas para filtrar el catálogo. Los agentes también pueden filtrar por etiqueta.",
   "lastRefreshedUtc": "Cuándo actualizó Garrison por última vez una entrada derivada desde su origen. Vacío en las entradas manuales.",
   "sourceAgentId": "Opcional. El agente de Garrison al que representa esta entrada manual.",
   "sourceMcpServerId": "Opcional. El servidor MCP cuya herramienta representa esta entrada manual.",
   "sourceToolName": "El nombre de la herramienta en el servidor MCP elegido.",
   "requirements": "Etiquetas de nodo, como garrison.io/tool-pandoc=true, que un nodo de trabajo debe informar antes de tomar una ejecución que use esta capacidad.",
   "inputSchema": "JSON Schema de lo que recibe la capacidad. Garrison comprueba que sea un JSON Schema válido al guardar.",
   "outputSchema": "JSON Schema de lo que devuelve la capacidad. Garrison comprueba que sea un JSON Schema válido al guardar.",
   "kindFilter": "Muestra solo agentes, solo herramientas MCP o solo integrados del harness. Elige Todos para ver el catálogo completo.",
   "originFilter": "Muestra solo las entradas derivadas, que siguen a su origen, o solo las manuales, escritas por personas.",
   "tagFilter": "Muestra solo las capacidades con esta etiqueta exacta. La lista se actualiza cuando dejas de escribir.",
   "refresh": "Actualiza ahora las entradas derivadas: agentes, integrados del harness, herramientas de los servidores MCP e indicaciones de los agentes. Muestra qué cambió y qué servidores fallaron.",
   "warnings": "Las entradas cuyo origen no se pudo actualizar conservan su último contenido válido y muestran el motivo en sus detalles.",
   "warningBadge": "Falló la última actualización del origen de esta entrada, así que muestra su último contenido válido. Motivo: {{warning}}"
  },
  "harnessProfiles": {
   "toolProbes": "Herramientas que este harness puede usar cuando el host del nodo de trabajo las tiene, como pandoc. Cada una se convierte en un integrado del harness en el catálogo de capacidades.",
   "toolProbesItems": {
    "name": "Nombre de la herramienta en el catálogo y en la etiqueta de nodo garrison.io/tool-{name}: letras minúsculas, dígitos, puntos y guiones.",
    "executable": "Nombre de archivo simple que el nodo de trabajo busca en su PATH, por ejemplo soffice. No se permite ninguna carpeta.",
    "argument": "El único argumento que pasa la sonda, como --version. Solo se permiten opciones de versión y de ayuda, o ninguna.",
    "description": "Qué hace la herramienta; se muestra en el catálogo de capacidades. Hasta 1024 caracteres."
   }
  }
 },
 "revisions": {
  "columns": {
   "capabilities": "Capacidades que usa esta revisión, por nombre. Los integrados del harness que haya entre ellas limitan sus ejecuciones a los nodos de trabajo que informan la herramienta."
  }
 },
 "capabilities": {
  "sourceAgent": "Abre el agente {{name}}, que esta entrada describe a partir de su última revisión publicada.",
  "sourceMcpServer": "Abre el servidor MCP {{name}} en la pestaña Servidores MCP. Su lista de herramientas es el origen de esta entrada.",
  "sourceTool": "El nombre de la herramienta en el servidor MCP: {{tool}}.",
  "sourceProfile": "Abre el perfil de harness {{name}}, cuya sonda de herramienta es el origen de esta entrada.",
  "nodeLabel": "Una ejecución que usa esta capacidad solo va a un nodo de trabajo que informa la etiqueta de nodo {{label}}.",
  "noSource": "Una entrada manual que no nombra ningún agente ni servidor MCP. La ve toda ejecución que pueda leer el catálogo.",
  "hintsUnknown": "Terminaron muy pocas ejecuciones en la ventana de indicaciones como para sacar conclusiones, así que no se muestran valores. Nunca significa cero.",
  "hintsKnown_one": "Resumido a partir de {{count}} ejecución terminada en los últimos {{days}} días.",
  "hintsKnown_other": "Resumido a partir de {{count}} ejecuciones terminadas en los últimos {{days}} días.",
  "refreshWarning": "Garrison no pudo actualizar esta entrada desde su origen, así que conserva su último contenido válido hasta que la próxima actualización funcione.",
  "lockedBanner": "Por qué esta entrada no se puede editar ni eliminar aquí, y dónde cambiarla.",
  "lockedShared": "Compartida por todos los inquilinos: esta entrada viene de una sonda de herramienta de un perfil de harness integrado, así que no se puede editar ni eliminar. Clona el perfil para cambiar sus sondas.",
  "locked": {
   "Agent": "Derivada de la última revisión publicada del agente, así que no se puede editar ni eliminar aquí. Publica una revisión nueva para cambiarla; si desactivas el agente, desaparece.",
   "McpTool": "Derivada de la lista de herramientas del servidor MCP, así que no se puede editar ni eliminar aquí. Cambia el servidor o sus herramientas y luego actualiza.",
   "HarnessBuiltIn": "Derivada de una sonda de herramienta de un perfil de harness, así que no se puede editar ni eliminar aquí. Cambia las sondas de herramientas del perfil."
  },
  "shared": "Todos los inquilinos ven esta entrada. Viene de una sonda de herramienta de un perfil de harness integrado.",
  "hintsTitle": "Duración y coste de las ejecuciones terminadas recientes de este agente. Las herramientas MCP y los integrados no tienen indicaciones.",
  "requirementsTitle": "Etiquetas de nodo que un nodo de trabajo debe informar antes de tomar una ejecución cuyo agente usa esta capacidad.",
  "fields": {
   "kind": "Agente, herramienta MCP o integrado del harness.",
   "origin": "Las entradas derivadas siguen a su origen; las manuales las escribieron personas.",
   "source": "El agente, el servidor MCP y la herramienta, o el perfil de harness del que viene esta entrada.",
   "lastRefreshedUtc": "Cuándo actualizó Garrison por última vez esta entrada desde su origen. Vacío en las entradas manuales.",
   "tags": "Etiquetas para filtrar el catálogo.",
   "id": "Identificador de la entrada del catálogo, que empieza por cap_.",
   "summary": "Qué hace la capacidad y cuándo usarla, tal como lo leen los agentes.",
   "hintStatus": "Conocido cuando terminaron suficientes ejecuciones en la ventana; si no, Desconocido, y entonces no se muestra ningún valor.",
   "sampleSize": "Cuántas ejecuciones terminadas resumen las indicaciones, empezando por las más recientes.",
   "medianDurationMs": "Tiempo mediano desde el inicio hasta la finalización de las ejecuciones resumidas.",
   "p90DurationMs": "Nueve de cada diez ejecuciones resumidas terminaron dentro de este tiempo.",
   "meanCostUsd": "Coste medio en dólares estadounidenses de las ejecuciones resumidas que registraron un coste.",
   "windowDays": "Cuántos días hacia atrás miran las indicaciones (el ajuste Capabilities.HintWindowDays).",
   "computedUtc": "Cuándo se calcularon las indicaciones por última vez, en el ciclo de mantenimiento o en una actualización.",
   "inputSchema": "JSON Schema de lo que recibe la capacidad, o ninguno si recibe texto libre.",
   "outputSchema": "JSON Schema de lo que devuelve la capacidad, o ninguno."
  },
  "refreshServer": "Lista las herramientas de todos los servidores MCP activos o de uno solo. Los servidores stdio se listan a través de un nodo de trabajo.",
  "refreshRun": "Inicia la actualización ahora. Puede tardar un rato si los servidores MCP responden despacio.",
  "refresh": {
   "agents": "Entradas de agente creadas, actualizadas o eliminadas en esta actualización.",
   "harnessBuiltIns": "Entradas de integrados del harness creadas, actualizadas o eliminadas, en todos los ámbitos.",
   "hints": "Entradas de agente cuyas indicaciones de coste y latencia se volvieron a calcular.",
   "servers": "Cuántos servidores MCP intentó listar esta actualización.",
   "tools": "Entradas de herramienta escritas a partir de los servidores que respondieron.",
   "removed": "Entradas de herramienta eliminadas porque su servidor ya no lista la herramienta.",
   "failed": "Servidores cuyas herramientas no se pudieron listar. Sus entradas conservan su último contenido válido.",
   "failedBadge": "No se pudieron listar las herramientas de este servidor. Sus entradas conservan su último contenido válido con una advertencia.",
   "listedBadge": "El servidor respondió y sus entradas de herramienta están al día.",
   "columns": {
    "server": "El servidor MCP cuyas herramientas se listaron.",
    "status": "Si se pudieron listar las herramientas del servidor.",
    "tools": "Entradas de herramienta escritas para este servidor.",
    "removed": "Entradas de herramienta eliminadas porque el servidor ya no las lista.",
    "warned": "Entradas que conservaron su último contenido válido y ahora llevan una advertencia de actualización.",
    "error": "Por qué falló el listado, si falló."
   }
  },
  "draftSave": "Guarda estas capacidades en el borrador. Después publica el borrador para que los despliegues las usen.",
  "notInCatalog": "Ahora mismo ninguna entrada del catálogo tiene este nombre. La ejecución empieza igualmente, pero el agente no puede encontrar esta capacidad.",
  "removeName": "Quita esta capacidad de la revisión.",
  "chooseName": "Elige una capacidad del catálogo por su nombre. Los nombres que usan varios tipos aparecen una sola vez.",
  "addName": "Añade la capacidad elegida a la revisión.",
  "newDraft": "Inicia un borrador nuevo a partir de la última revisión publicada y elige las capacidades que usa.",
  "editDraft": "Añade o quita las capacidades que usa esta revisión en borrador.",
  "revisionName": "Esta revisión usa la capacidad {{name}}. Los agentes la encuentran en el catálogo por este nombre."
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
   "Running": "El grupo espera a sus miembros. Termina cuando se cumple la política de reunión, vence el plazo, se agota el presupuesto o alguien lo cancela.",
   "Joined": "Se cumplió la política de reunión, o terminaron todos los miembros, así que la ejecución principal puede usar sus resultados.",
   "TimedOut": "El plazo venció antes de que se cumpliera la política de reunión. Se cancelaron los miembros que seguían en ejecución.",
   "BudgetExceeded": "El costo o los tokens de los miembros superaron el presupuesto del grupo. Se cancelaron los miembros que seguían en ejecución.",
   "Cancelled": "Alguien canceló el grupo, o su ejecución principal terminó o se canceló. Se cancelaron los miembros que seguían en ejecución."
  },
  "fanOutJoinPolicy": {
   "All": "El grupo se reúne cuando todos los miembros terminan, con éxito o sin él.",
   "Any": "El grupo se reúne en cuanto un miembro tiene éxito. Los demás se cancelan salvo que la llamada pidiera mantenerlos en ejecución.",
   "Quorum": "El grupo se reúne cuando tiene éxito el número indicado de miembros, o en cuanto fallan tantos que ya no es posible."
  }
 },
 "views": {
  "runDetail": {
   "fanOutGroup": "El grupo de fan-out al que pertenece esta ejecución. Su ejecución principal lo inició junto con otros miembros y reúne sus resultados.",
   "openFanOutGroup": "Abrir el árbol de ejecuciones de la ejecución principal en este grupo de fan-out para ver los otros miembros, la política y el presupuesto."
  }
 },
 "fanOut": {
  "group": "Ejecuciones secundarias que esta ejecución inició juntas con garrison_fan_out, reunidas bajo una política, un presupuesto y un plazo.",
  "otherChildren": "Ejecuciones secundarias a las que esta ejecución delegó de una en una, fuera de cualquier grupo de fan-out.",
  "reason": "Por qué terminó el grupo, según lo registró el servidor.",
  "policy": "Cuándo se da el grupo por terminado: Todos espera a cada miembro, Cualquiera a un éxito y Quórum al número indicado de éxitos.",
  "progress": "Miembros que terminaron, miembros con éxito y el número de miembros del grupo.",
  "cost": "Costo registrado por los miembros hasta ahora, frente al costo máximo del grupo cuando hay uno.",
  "costValue": "Costo total registrado de todos los miembros. Los miembros cuyo modelo no tiene precio no suman nada.",
  "tokens": "Tokens de entrada y salida usados por los miembros hasta ahora, frente al máximo del grupo cuando hay uno.",
  "tokensValue": "Tokens de entrada más tokens de salida de todos los miembros juntos.",
  "budgetBar": "{{percent}} % del presupuesto usado. El grupo termina como Presupuesto superado cuando el uso lo rebasa.",
  "deadline": "Cuándo se agota el tiempo del grupo. Los miembros que sigan en ejecución en ese momento se cancelan.",
  "started": "Cuándo la ejecución principal inició este grupo.",
  "completed": "Cuándo terminó el grupo y dejó de esperar a los miembros.",
  "pending": "Etiquetas de los miembros que todavía no han terminado.",
  "failed": "Etiquetas de los miembros que terminaron sin éxito.",
  "live": "Las actualizaciones llegan por la conexión en vivo en cuanto cambia el estado de un miembro o el uso del grupo.",
  "polling": "La conexión en vivo no está disponible, así que el grupo se vuelve a cargar cada {{seconds}} segundos.",
  "cancel": "Cancelar este grupo ahora. Los miembros que siguen en ejecución se cancelan y la ejecución principal recibe los resultados reunidos hasta el momento.",
  "confirmCancel": "Cancelar el grupo y todos los miembros que siguen en ejecución. No se puede deshacer.",
  "openMember": "Abrir la ejecución del miembro {{label}} para ver su transcripción, su resultado y su telemetría.",
  "columns": {
   "label": "El nombre que la ejecución principal dio a este miembro al iniciar el grupo.",
   "agent": "El agente que ejecuta este miembro, elegido por la ejecución principal.",
   "status": "En qué punto está la ejecución del miembro y cómo terminó.",
   "costUsd": "Costo registrado de la ejecución de este miembro.",
   "tokens": "Tokens de entrada y salida que usó la ejecución de este miembro.",
   "run": "La ejecución del miembro. Ábrala para ver la transcripción y el resultado."
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
   "apps": "Aplicaciones agénticas: grupos de agentes tras una sola interfaz de chat para usuarios finales, con su grafo de llamadas, delegación, revisiones, promoción y enlace."
  }
 },
 "enums": {
  "appAuthMode": {
   "TenantUsers": "Cualquier usuario activo de este inquilino puede iniciar sesión en la aplicación con su correo electrónico y su contraseña.",
   "AppUsers": "Solo pueden iniciar sesión los usuarios del inquilino que tienen el rol integrado AppUser en esta aplicación. Asígnalo con ámbito de recurso sobre la aplicación.",
   "Anonymous": "Cualquiera con el enlace puede usar la aplicación sin iniciar sesión, pero solo si el uso anónimo también está activado."
  }
 },
 "form": {
  "pickColor": "Elige {{field}} con un selector de color en lugar de escribir el valor #RRGGBB."
 },
 "resources": {
  "apps": {
   "add": "Crea una aplicación con agentes que ya tienes: miembros, un agente de entrada, las llamadas entre ellos y cómo inician sesión las personas.",
   "name": "Nombre de la aplicación en este inquilino: letras minúsculas, dígitos y guiones. Los manifiestos y la API se refieren a ella por este nombre.",
   "slug": "El nombre en la URL, así que la aplicación está en /apps/{slug}/. Es único en todo el clúster. Vacío significa el nombre.",
   "description": "Para qué sirve la aplicación. Los usuarios finales lo ven en la página de inicio de sesión de la aplicación.",
   "active": "Las aplicaciones inactivas conservan su configuración, pero su enlace y sus sesiones dejan de funcionar.",
   "url": "La dirección de la aplicación para los usuarios finales. Cópiala para compartirla o ábrela para ver lo que ven los usuarios finales.",
   "entryAgentId": "El miembro que habla con los usuarios finales e inicia cada conversación. Los demás miembros se alcanzan desde él.",
   "members": "Los agentes de la aplicación, cada uno con una nota de rol opcional. Un agente que pertenece a una aplicación no se puede eliminar.",
   "membersItems": {
    "agentId": "Un agente de este inquilino que se incluye en la aplicación. Cada agente puede ser miembro una vez.",
    "role": "Una nota breve sobre lo que hace este miembro en la aplicación, de hasta 256 caracteres."
   },
   "edges": "Qué miembro puede llamar a cuál. Juntas forman el grafo de la aplicación y se convierten en la política de delegación de cada miembro.",
   "edgesItems": {
    "callerAgentId": "El miembro que hace la llamada.",
    "calleeAgentId": "El miembro al que se llama. Debe ser un miembro distinto del que llama.",
    "fanOutAllowed": "Permite que quien llama inicie varias ejecuciones de este miembro a la vez con garrison_fan_out."
   },
   "graph": "Los miembros y las llamadas como imagen, de solo lectura. El agente de entrada está a la izquierda; los miembros que no puede alcanzar aparecen con borde rojo.",
   "environments": "Para cada entorno, el despliegue del agente de entrada que usa allí la aplicación. La promoción los mantiene alineados.",
   "environmentsItems": {
    "environment": "Un entorno de este inquilino, como dev, staging o prod.",
    "deploymentId": "Un despliegue del agente de entrada en este entorno. Solo se muestran esos despliegues."
   },
   "liveEnvironment": "El entorno que usa ahora la interfaz de chat de la aplicación. Cámbialo para pasar a los usuarios finales a otro entorno.",
   "authMode": "Usuarios del inquilino, usuarios con el rol AppUser en esta aplicación o cualquiera con el enlace (con el uso anónimo activado).",
   "anonymousEnabled": "Activa las sesiones anónimas. El inicio de sesión anónimo solo funciona si esto está activado y el modo es Anónimo.",
   "showOperatorDetail": "Muestra a los usuarios finales las llamadas a herramientas, el razonamiento y el progreso de cada turno, no solo la respuesta.",
   "share": "El enlace que se da a los usuarios finales, con quién puede iniciar sesión según la opción de inicio de sesión elegida arriba.",
   "displayName": "El nombre que se muestra en el encabezado y en la página de inicio de sesión de la aplicación. Vacío significa el nombre de la aplicación.",
   "logoAssetId": "Un recurso de agente cuya versión actual contiene la imagen del logotipo. Sube uno en Configuración, Recursos.",
   "primaryColor": "Color principal de la interfaz de la aplicación, como #RRGGBB. Vacío mantiene el color predeterminado.",
   "accentColor": "Segundo color de la interfaz de la aplicación para resaltados, como #RRGGBB. Vacío mantiene el color predeterminado.",
   "welcomeText": "Texto que ven los usuarios finales antes de su primer mensaje, de hasta 4000 caracteres.",
   "id": "El identificador de la aplicación. La API y los manifiestos lo aceptan igual que el nombre.",
   "lastUpdateUtc": "Cuándo cambió por última vez la configuración de la aplicación.",
   "createdUtc": "Cuándo se creó la aplicación.",
   "membersCell": "Miembros de la aplicación: {{names}}.",
   "activeBadge": "La aplicación está activa: su enlace funciona para las personas que deja entrar su opción de inicio de sesión.",
   "inactiveBadge": "La aplicación está inactiva: su configuración se conserva, pero su enlace y sus sesiones no funcionan.",
   "steps": {
    "general": "El nombre de la aplicación, el slug de URL, la descripción y si está activa.",
    "members": "Los agentes de la aplicación, el agente de entrada y las llamadas entre ellos, con una imagen del grafo.",
    "environments": "El despliegue de entrada que usa la aplicación en cada entorno y el entorno en el que se ejecuta ahora.",
    "access": "Quién puede iniciar sesión, si los usuarios finales ven las llamadas a herramientas y el enlace para compartir.",
    "branding": "Nombre visible, logotipo, colores y texto de bienvenida que ven los usuarios finales."
   },
   "actions": {
    "delegation": "Compara la delegación publicada de cada miembro con lo que pide el grafo y escribe borradores que corrigen la desviación.",
    "revisions": "Muestra las revisiones de la aplicación, crea una nueva, publícala y promueve la aplicación al siguiente entorno."
   }
  }
 },
 "apps": {
  "denied": "Para esto necesitas el permiso {{operation}} sobre {{resource}}. Pide a un administrador un rol que lo conceda.",
  "graph": "Imagen de solo lectura de la aplicación: los miembros, las llamadas entre ellos y a cuáles puede llegar el agente de entrada.",
  "url": "La dirección de la aplicación. {{who}}",
  "open": "Abre la aplicación en una pestaña nueva del navegador, tal como la ven los usuarios finales. {{who}}",
  "copyUrl": "Copia la dirección de la aplicación para compartirla. {{who}}",
  "signIn": {
   "TenantUsers": "Cualquier usuario activo de este inquilino puede iniciar sesión.",
   "AppUsers": "Solo pueden iniciar sesión los usuarios que tienen el rol AppUser en esta aplicación.",
   "Anonymous": "Cualquiera con el enlace puede usarla sin iniciar sesión.",
   "AnonymousDisabled": "Se eligió Anónimo pero no está activado, así que solo entran los usuarios con sesión iniciada que tienen acceso."
  },
  "delegation": {
   "apply": "Escribe la delegación del grafo en una revisión en borrador de cada miembro desviado. No se publica nada y los borradores manuales no se tocan.",
   "applyNothing": "La delegación publicada de todos los miembros ya coincide con el grafo, así que no hay nada que escribir.",
   "openAgent": "Abre el agente {{name}} para revisar y publicar su revisión en borrador.",
   "drift": "La delegación publicada del miembro difiere de lo que pide el grafo. Escribe borradores para corregirlo y luego publícalos.",
   "inSync": "La delegación publicada del miembro coincide con el grafo.",
   "draftConflict": "El borrador abierto del miembro ya cambia la delegación de otra forma, así que no se tocó. Publica o descarta antes ese borrador.",
   "skipped": "Se omitió este miembro: {{reason}}.",
   "draft": "La delegación del grafo está en la revisión en borrador {{number}} de este miembro. Publícala para que entre en vigor.",
   "columns": {
    "member": "El agente miembro. Ábrelo para revisar sus revisiones.",
    "desiredMode": "El modo de delegación que pide el grafo: Lista de permitidos cuando el miembro llama a otros, Sin delegación cuando no llama a nadie.",
    "desiredAllowList": "Los miembros a los que llama este miembro en el grafo.",
    "desiredMaxDepth": "La cadena de llamadas más larga por debajo de este miembro en el grafo.",
    "publishedMode": "El modo de delegación de la última revisión publicada del miembro.",
    "publishedAllowList": "La lista de permitidos de la última revisión publicada del miembro.",
    "publishedMaxDepth": "La profundidad máxima de la última revisión publicada del miembro.",
    "status": "Si el miembro se desvía del grafo, y el borrador escrito o el motivo por el que se omitió."
   }
  },
  "revisions": {
   "promote": "Promueve una revisión publicada de la aplicación: todos los miembros pasan juntos al siguiente entorno, o no se mueve nada.",
   "promoteNothing": "Publica antes una revisión de la aplicación. Solo se pueden promover las revisiones publicadas.",
   "changeNote": "Una nota sobre lo que cambió, guardada con la revisión. Hasta 2000 caracteres.",
   "take": "Crea una revisión en borrador de la aplicación que fija la última revisión publicada de cada miembro y copia las llamadas.",
   "latest": "La última revisión publicada de la aplicación, que usan las promociones salvo que elijas otra.",
   "pin": "Esta revisión fija la revisión {{number}} de {{name}}.",
   "publishedBy": "Publicada por {{name}} el {{when}}.",
   "publish": "Publica esta revisión en borrador de la aplicación. Después ya no puede cambiar y se puede promover.",
   "publishConfirm": "Publica la revisión ahora. Después no se puede editar.",
   "columns": {
    "number": "El número de revisión, que cuenta desde 1 para esta aplicación.",
    "state": "Borrador hasta que se publica. Solo se pueden promover las revisiones publicadas.",
    "members": "Las revisiones de miembros que fija esta revisión de la aplicación.",
    "edges": "Cuántas llamadas entre miembros copió la revisión.",
    "author": "Quién creó la revisión.",
    "changeNote": "La nota escrita al crear la revisión.",
    "publishedUtc": "Cuándo se publicó la revisión y quién lo hizo.",
    "actions": "Publica una revisión en borrador."
   }
  },
  "promote": {
   "submit": "Promueve ahora. Los despliegues de cada miembro en el entorno de destino reciben las revisiones fijadas, o no cambia nada.",
   "revision": "La revisión publicada de la aplicación que se promueve. Se usa la última salvo que elijas otra.",
   "source": "El entorno desde el que se promueve, normalmente aquel en el que se ejecuta ahora la aplicación.",
   "target": "El entorno al que se promueve. De forma predeterminada, el siguiente al de origen."
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
   "studio": "El estudio de agentes: borradores de agentes y aplicaciones que diseñas con el arquitecto de agentes, pruebas en la zona de pruebas y pides a una persona que aplique."
  }
 },
 "enums": {
  "approvalKind": {
   "DraftApply": "Una solicitud para aplicar un borrador del estudio a la configuración activa. Permitirla aplica todos los documentos del borrador en una sola aplicación de manifiesto."
  },
  "studioDraftStatus": {
   "Open": "Tú y el arquitecto de agentes podéis editar el borrador, validarlo, probarlo en la zona de pruebas y enviarlo a aprobación.",
   "PendingApproval": "El borrador espera una decisión sobre su aprobación de aplicación y queda congelado hasta entonces. Una denegación lo vuelve a abrir.",
   "Applied": "El borrador se aplicó a la configuración activa en una sola aplicación de manifiesto. Ya no puede cambiar.",
   "Discarded": "El borrador se descartó. Ya no puede cambiar y se canceló una aprobación de aplicación pendiente."
  },
  "studioDraftOperation": {
   "Upsert": "Aplicar el borrador crea el recurso, o lo actualiza si ya existe.",
   "Delete": "Aplicar el borrador elimina el recurso. Solo se pueden eliminar así agentes, despliegues, canalizaciones y aplicaciones."
  },
  "studioDiffChange": {
   "Create": "El recurso aún no existe, así que aplicar el borrador lo crea.",
   "Update": "El recurso existe y es distinto, así que aplicar el borrador actualiza los campos indicados.",
   "Delete": "El borrador elimina este recurso cuando se aplica.",
   "Unchanged": "El documento coincide con la configuración activa, así que aplicarlo no cambia nada.",
   "Failed": "El documento no se valida. Los detalles dicen por qué; corrígelo antes de solicitar la aplicación."
  }
 },
 "views": {
  "studio": {
   "newDraft": "Empieza un borrador, vacío o a partir de una aplicación existente, y abre su espacio de trabajo.",
   "refresh": "Vuelve a leer la lista de borradores del servidor.",
   "search": "Busca borradores cuyo título contenga este texto. La búsqueda la hace el servidor.",
   "scope": "Muestra solo tus borradores, o todos los borradores del inquilino que puedes leer.",
   "scopes": {
    "mine": "Muestra solo los borradores que empezaste tú o que un arquitecto empezó por ti.",
    "all": "Muestra todos los borradores del inquilino que puedes leer, sin importar quién los empezó."
   },
   "statusChip": "Muestra los borradores con estado {{status}}. Si no eliges ningún estado, se muestran todos.",
   "columns": {
    "title": "El título del borrador. Ábrelo para ver su espacio de trabajo con el arquitecto, los elementos, el grafo y la aplicación.",
    "status": "Los borradores abiertos pueden cambiar; los pendientes esperan una decisión; los aplicados y descartados son definitivos.",
    "owner": "La persona que empezó el borrador. Un arquitecto solo trabaja en los borradores de la persona que habla con él.",
    "targetApp": "La aplicación que diseña el borrador. Las operaciones del grafo y la zona de pruebas la usan por defecto.",
    "items": "Cuántos documentos de manifiesto contiene el borrador, uno por recurso.",
    "version": "Sube en uno con cada cambio del borrador. Cada edición indica la versión que leyó.",
    "updated": "Cuándo cambió el borrador por última vez."
   },
   "openDraft": "Abre el espacio de trabajo del borrador: chat con el arquitecto, elementos, grafo, comparación y aplicación, zona de pruebas y vista previa.",
   "discard": "Descarta el borrador tras una confirmación. Ya no podrá cambiar ni aplicarse.",
   "discardPending": "Descarta el borrador tras una confirmación. Se cancela su aprobación de aplicación pendiente."
  },
  "studioDraft": {
   "version": "Cada cambio sube la versión. Las ediciones envían la versión que leyeron, para que nadie sobrescriba el cambio de otra persona.",
   "live": "Conectado al canal en vivo del borrador, así que los cambios de otros y del arquitecto aparecen al instante.",
   "polling": "El canal en vivo no está disponible, así que la página vuelve a leer el borrador cada pocos segundos.",
   "back": "Vuelve a la lista de borradores del estudio.",
   "viewJson": "Muestra el borrador tal como lo devolvió el servidor, con todos los elementos y la disposición del lienzo.",
   "architect": "El despliegue de arquitecto con el que habla este espacio de trabajo. Elígelo en la pestaña Arquitecto.",
   "dismissNotice": "Oculta este aviso sobre el último cambio del borrador.",
   "tabs": {
    "architect": "Habla con el arquitecto de agentes, que edita este borrador por ti.",
    "items": "Los documentos de manifiesto del borrador, con un editor para cada uno.",
    "graph": "Una imagen de solo lectura de las aplicaciones, llamadas, profundidad de delegación y capacidades del borrador.",
    "apply": "Compara el borrador con la configuración activa, valídalo y solicita que se aplique.",
    "playground": "Ejecuta los agentes del borrador durante varios turnos antes de publicar nada.",
    "preview": "Compila un despliegue para ver su línea de comandos, los assets colocados y el montaje del espacio de archivos.",
    "prompts": "Elige y edita el prompt con el que trabaja el arquitecto de agentes."
   }
  }
 },
 "studio": {
  "notOpen": "Este borrador está {{status}}, y solo un borrador abierto puede cambiar.",
  "newDraft": {
   "titleField": "Un nombre corto para el borrador, que se muestra en la lista y al arquitecto. Vacío usa un título predeterminado.",
   "fromApp": "Parte de una aplicación existente con todo lo que referencia, o empieza con un borrador vacío.",
   "create": "Crea el borrador y abre su espacio de trabajo. La configuración activa no cambia."
  },
  "architect": {
   "name": "Nombre del nuevo despliegue de arquitecto en este inquilino, por ejemplo architect.",
   "harnessProfileId": "El harness en el que se ejecuta el arquitecto, por ejemplo Claude Code. Necesita un worker que pueda ejecutarlo.",
   "model": "El modelo que usa el harness para el arquitecto. Vacío usa el predeterminado del perfil de harness.",
   "promptId": "El prompt System con el que trabaja el arquitecto. Primero van los integrados y después sus clones.",
   "preview": "El prompt elegido renderizado con valores de ejemplo, tal como lo recibiría el arquitecto.",
   "cloneLink": "Abre este prompt en la pantalla Plantillas de prompt, donde puedes clonarlo y editar el clon.",
   "create": "Crea el despliegue de agent-architect con acceso a borradores y el prompt elegido.",
   "noAgent": "No se puede crear ningún arquitecto porque este inquilino no tiene el agente agent-architect."
  },
  "chat": {
   "title": "Una conversación con el arquitecto de agentes sobre este borrador. Él edita el borrador; tú apruebas aplicarlo.",
   "architect": "El despliegue de arquitecto con el que hablar. Elegir otro inicia una conversación nueva.",
   "newArchitect": "Crea un despliegue de arquitecto: perfil de harness, modelo y prompt del arquitecto.",
   "openConversation": "Abre esta conversación en su propia página, con cada turno como una ejecución.",
   "newConversation": "Olvida esta conversación en este navegador y empieza una nueva con el siguiente mensaje.",
   "you": "Lo que enviaste al arquitecto en este turno.",
   "architectSays": "La respuesta del arquitecto en este turno. Los cambios que hizo en el borrador aparecen en las otras pestañas.",
   "openRun": "Abre la ejecución de este turno, con su transcripción y las herramientas que llamó.",
   "message": "Lo que quieres que el arquitecto diseñe o cambie. El ID del borrador va con el primer mensaje.",
   "send": "Envía el mensaje al arquitecto. La respuesta aparece aquí cuando termina el turno.",
   "sendBusy": "El arquitecto sigue trabajando en el último mensaje. Espera a que termine.",
   "sendNoArchitect": "Elige o crea un despliegue de arquitecto antes de enviar un mensaje."
  },
  "items": {
   "title": "Los documentos de manifiesto del borrador, uno por recurso, identificados por tipo y nombre.",
   "add": "Añade un documento nuevo al borrador. Se guarda cuando lo guardas en el editor.",
   "addConfirm": "Abre el editor con un documento inicial de este tipo y nombre.",
   "kind": "El tipo de manifiesto del documento, por ejemplo Agent o Deployment.",
   "name": "El nombre del recurso, que debe coincidir con el nombre dentro del documento.",
   "operation": "Crear o actualizar el recurso al aplicar, o eliminarlo.",
   "stale": "Indica si la configuración activa cambió después de que el borrador partiera de este documento.",
   "updated": "Cuándo cambió este elemento en el borrador por última vez.",
   "staleBadge": "La configuración activa cambió después de que el borrador partiera de este documento. Actualízalo antes de aplicar.",
   "editItem": "Abre este documento en el editor para cambiarlo y guardarlo.",
   "viewItem": "Abre este documento en el editor para leerlo. El borrador no puede cambiar en este momento.",
   "remove": "Quita este documento del borrador tras una confirmación. La configuración activa no cambia.",
   "editor": "El documento como YAML de manifiesto. Al guardar se envía la versión que leíste.",
   "document": "YAML de manifiesto sin más. Su tipo y nombre deben coincidir con los del elemento.",
   "save": "Guarda el documento en el borrador con la versión que leíste.",
   "closeEditor": "Cierra el editor. El texto sin guardar se pierde.",
   "dismissConflict": "Oculta este aviso sobre el cambio que rechazó tu guardado."
  },
  "graph": {
   "title": "Imagen de solo lectura de las aplicaciones del borrador: miembros, llamadas, profundidad de delegación y capacidades.",
   "app": "Una aplicación que el borrador contiene o referencia, dibujada a partir de su agente de entrada.",
   "deletedApp": "Aplicar el borrador elimina esta aplicación.",
   "draftedApp": "El borrador contiene el documento de esta aplicación, así que su grafo muestra la versión del borrador.",
   "deletedAgent": "Aplicar el borrador elimina este agente.",
   "loose": "Agentes del borrador que no pertenecen a ninguna de sus aplicaciones.",
   "legend": "Cómo leer el grafo: etiquetas, estilos de línea y las capacidades bajo cada agente."
  },
  "diff": {
   "title": "Cada documento frente a la configuración activa, la validación y la solicitud para aplicar el borrador.",
   "refresh": "Vuelve a comparar cada documento con la configuración activa.",
   "validate": "Ejecuta una simulación de manifiesto del borrador. Nada cambia; los resultados se muestran por elemento.",
   "requestApply": "Valida el borrador y crea una aprobación para aplicarlo. El borrador queda congelado hasta que se decida.",
   "columns": {
    "item": "El tipo y el nombre del documento.",
    "change": "Lo que aplicar el borrador haría con este recurso.",
    "details": "Los campos que cambian, o por qué el documento no se valida."
   },
   "approval": "La aprobación que decide si este borrador se aplica.",
   "openApproval": "Abre la aprobación con su resumen completo y la comparación.",
   "reason": "Por qué permites o deniegas el borrador. Se registra con la decisión.",
   "allow": "Permite la aprobación: el borrador se valida de nuevo y se aplica en una sola aplicación de manifiesto.",
   "deny": "Deniega la aprobación: no se aplica nada y el borrador vuelve a estar abierto."
  },
  "playground": {
   "title": "Prueba los agentes del borrador durante varios turnos antes de publicar nada.",
   "agent": "El agente que se ejecuta. Por defecto es el agente de entrada de la aplicación de destino del borrador.",
   "input": "Lo que debe hacer el agente en este turno.",
   "send": "Guarda el documento del agente como su revisión de borrador y lo ejecuta en la zona de pruebas.",
   "sendBusy": "El último turno sigue en ejecución. Espera a que termine.",
   "openRun": "Abre la ejecución, con su árbol de ejecución, sus grupos de distribución y los archivos de la conversación.",
   "conversation": "Abre la conversación de la zona de pruebas, con cada turno como una ejecución.",
   "export": "Descarga los turnos de la zona de pruebas como un archivo Markdown.",
   "reset": "Empieza una nueva conversación en la zona de pruebas con el siguiente turno."
  },
  "preview": {
   "title": "Compila un despliegue con una entrada de ejemplo antes de desplegar. Los valores secretos se ocultan.",
   "deploymentId": "El despliegue que se va a compilar.",
   "agentRevisionId": "Una revisión del agente para compilar en lugar de la propia del despliegue, por ejemplo una revisión de borrador.",
   "environment": "Compila el despliegue del agente en este entorno en lugar del elegido.",
   "input": "La entrada de ejemplo con la que se renderiza el prompt compilado.",
   "compile": "Compila el despliegue y muestra la línea de comandos, los assets y el espacio de archivos.",
   "compileNoDeployment": "Elige primero un despliegue para compilar.",
   "commandLine": "El comando que iniciaría el worker, con comillas de shell para mostrarlo.",
   "assets": "Dónde se escribirían los assets de la revisión antes de que arranque el harness.",
   "columns": {
    "path": "Dónde se coloca el archivo, relativo a los directorios de la ejecución.",
    "asset": "El asset del agente del que procede el archivo.",
    "kind": "Para qué se usa el asset, por ejemplo una skill o un archivo de referencia.",
    "version": "La versión del asset que fija la revisión.",
    "size": "El tamaño del archivo colocado."
   },
   "fileSpace": "El espacio de archivos compartido de la conversación y dónde lo vería la ejecución."
  },
  "prompts": {
   "title": "Los prompts con los que puede trabajar el arquitecto de agentes, y cuál usa cada arquitecto.",
   "templatesLink": "Abre la pantalla Plantillas de prompt filtrada por prompts de arquitecto.",
   "columns": {
    "name": "El nombre de la plantilla de prompt. Los integrados empiezan por builtin/.",
    "description": "Una nota breve sobre lo que el prompt hace que el arquitecto haga de otra forma.",
    "version": "La versión actual del prompt. Cada guardado suma uno.",
    "usedBy": "Cuántos despliegues de arquitecto usan este prompt. Pasa el cursor para ver sus nombres."
   },
   "defaultBadge": "Los nuevos despliegues de arquitecto usan este prompt salvo que se elija otro.",
   "selectedBadge": "El prompt que usa {{architect}} ahora.",
   "select": "Convierte este en el prompt del arquitecto actual. Surte efecto en el siguiente turno del arquitecto.",
   "alreadySelected": "El arquitecto actual ya usa este prompt.",
   "selectNoArchitect": "Elige primero un arquitecto en la pestaña Arquitecto; la selección se aplica a ese despliegue.",
   "clone": "Copia este prompt en una plantilla nueva que puedes editar.",
   "edit": "Edita el nombre, la descripción y el cuerpo. Cada guardado es una versión nueva.",
   "delete": "Elimina este prompt tras una confirmación. Un prompt que usa un despliegue no se puede eliminar.",
   "builtInLocked": "Los prompts integrados no se pueden editar ni eliminar. Clona este prompt y cambia el clon.",
   "editor": "Edita el prompt y obtén una vista previa. Los arquitectos que siguen su versión actual usan lo guardado desde su siguiente turno.",
   "closeEditor": "Cierra el editor. El texto sin guardar se pierde.",
   "name": "El nombre de la plantilla en este inquilino. Debe seguir siendo único.",
   "description": "Una nota breve sobre lo que este prompt hace que haga el arquitecto.",
   "body": "El texto del prompt, con variables de plantilla e inclusiones de fragmentos como builtin/agent-architect-design.",
   "preview": "El cuerpo renderizado con valores de ejemplo, tal como lo recibiría el arquitecto.",
   "save": "Guarda la edición como una nueva versión del prompt."
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
    "graph": "Edita la aplicación del borrador en un lienzo: agentes, llamadas, el agente de entrada, propiedades y la ejecución por entorno."
   }
  }
 },
 "studio": {
  "graph": {
   "title": "La aplicación del borrador como un lienzo editable, con sus agentes, sus llamadas y la profundidad de delegación."
  },
  "canvas": {
   "title": "La aplicación del borrador como un grafo editable. Cada cambio se guarda en el borrador al momento; nada pasa a producción hasta que se aplica el borrador.",
   "appPicker": "La aplicación que muestra el lienzo, cuando el borrador contiene más de una.",
   "node": "Un agente de la aplicación. Arrástralo para moverlo, arrastra desde su borde derecho para conectarlo, o enfócalo y usa los atajos de teclado.",
   "nodeReadOnly": "Un agente de la aplicación. El borrador no puede cambiar en este momento, así que el lienzo es de solo lectura.",
   "addAgent": "Escribe el nombre de un agente o elige uno entre los agentes del inquilino y los del borrador, y pulsa Intro.",
   "role": "Una nota opcional sobre lo que hace este agente en la aplicación, guardada con su pertenencia.",
   "add": "Haz que el agente sea miembro de {{app}}. El primer miembro se convierte en el agente de entrada.",
   "connect": "Empieza una llamada desde {{name}} y luego elige el agente al que llama.",
   "needAgent": "Selecciona primero un agente en el lienzo.",
   "needCall": "Selecciona primero una llamada: haz clic en ella en el lienzo o elígela en la lista de llamadas.",
   "alreadyEntry": "{{name}} ya es el agente de entrada.",
   "setEntry": "Haz que el agente seleccionado sea el que habla con las personas que usan la aplicación.",
   "remove": "Saca de la aplicación el agente seleccionado con sus llamadas, tras una confirmación.",
   "disconnect": "Elimina la llamada seleccionada. Los dos agentes siguen en la aplicación.",
   "fit": "Ajusta el zoom y el encuadre para que se vean todos los agentes de la aplicación.",
   "connectTo": "El agente al que puede llamar quien llama.",
   "fanOut": "Activado: quien llama puede iniciar varias llamadas a este agente a la vez (fan-out). Desactivado: una llamada cada vez.",
   "connectConfirm": "Permite que {{from}} llame a {{to}} y guarda la llamada en el borrador.",
   "connectNoTarget": "Todavía no hay otro agente en la aplicación al que llamar.",
   "connectCancel": "Deja de conectar sin añadir ninguna llamada.",
   "keys": "Muestra las teclas que funcionan en el lienzo.",
   "calls": "Todas las llamadas de la aplicación, en palabras. Estos botones permiten seleccionar y cambiar llamadas con el teclado.",
   "call": "Selecciona esta llamada. Supr la desconecta y F activa o desactiva las llamadas en paralelo.",
   "callReadOnly": "Selecciona esta llamada para ver sus propiedades. El borrador no puede cambiar en este momento.",
   "addLoose": "Haz que {{name}} sea miembro de {{app}}, para poder conectarlo.",
   "retry": "Vuelve a enviar el cambio rechazado, sobre la versión del borrador que se acaba de leer.",
   "dismissError": "Oculta este mensaje sobre el cambio rechazado.",
   "panel": {
    "properties": "El documento propio del agente: descripción, esquemas, assets y capacidades.",
    "runtime": "Los despliegues del agente en cada entorno: modelo, límites, prompt y aprobaciones.",
    "save": "Escribe estos campos en el elemento del borrador, con la versión que leíste. Nada pasa a producción.",
    "reset": "Vuelve a los valores que contiene ahora el borrador.",
    "nothingToSave": "Todavía no ha cambiado nada, así que no hay nada que guardar.",
    "nothingToReset": "Todavía no ha cambiado nada, así que no hay nada que deshacer."
   },
   "agent": {
    "title": "Campos del documento del agente en este borrador. Al guardar se reescribe su elemento Agent.",
    "bring": "Copia el documento activo del agente (o uno nuevo) en el borrador para que puedas editarlo.",
    "description": "Lo que hace el agente, que se muestra a las personas y a los agentes que lo llaman.",
    "inputSchema": "Un JSON Schema con el que debe coincidir la entrada del agente. Vacío significa entrada de texto sin formato.",
    "outputSchema": "Un JSON Schema que sigue la salida estructurada del agente. Vacío significa sin salida estructurada.",
    "assets": "Assets de agente (skills, referencias, plantillas) que fija la próxima revisión, por nombre y versión opcional.",
    "assetName": "El nombre del asset de agente en este inquilino.",
    "assetVersion": "Una versión que fijar. Vacío sigue la versión más reciente del asset.",
    "removeAsset": "Quita esta fijación de la próxima revisión del agente al guardar.",
    "addAsset": "Fija otro asset de agente en la próxima revisión del agente.",
    "capabilities": "Capacidades que usa el agente, como herramientas del host que debe tener un worker (pandoc, git).",
    "systemPrompt": "El prompt de sistema se fija por despliegue, para que cada entorno pueda usar el suyo.",
    "showRuntime": "Abre los despliegues del agente, donde se editan el prompt de sistema y su versión."
   },
   "edge": {
    "title": "La llamada seleccionada: quién llama a quién, el fan-out y la profundidad de delegación que necesita.",
    "from": "El agente que hace esta llamada.",
    "to": "El agente al que llega esta llamada.",
    "depth": "Cuántos niveles de delegación necesita quien llama para esta llamada, calculados a partir del grafo."
   },
   "app": {
    "title": "Campos del documento de la aplicación en este borrador. Al guardar se reescribe su elemento AgenticApp.",
    "entry": "El miembro que habla con las personas que usan la aplicación. Cambiarlo se guarda al momento.",
    "bring": "Copia el documento activo de la aplicación en el borrador para que puedas editar su inicio de sesión y su imagen de marca.",
    "description": "Para qué sirve la aplicación, que se muestra en la lista de aplicaciones de la consola.",
    "authMode": "Quién puede iniciar sesión en la aplicación: usuarios del inquilino, usuarios de la aplicación o cualquiera (anónimo).",
    "anonymous": "Deja que las personas usen la aplicación sin iniciar sesión, cuando el modo de inicio de sesión lo permite.",
    "branding": "Cómo se ve la página de chat de la aplicación para las personas que la usan.",
    "brandingFields": {
     "displayName": "El nombre en la cabecera de la aplicación. Vacío usa el nombre de la aplicación.",
     "logo": "Un asset de agente cuya primera imagen se convierte en el logotipo de la aplicación.",
     "primaryColor": "El color principal de la página de la aplicación, como valor hexadecimal.",
     "accentColor": "El segundo color de la página de la aplicación, como valor hexadecimal.",
     "welcomeText": "Lo primero que leen las personas al abrir la aplicación."
    }
   },
   "runtime": {
    "title": "Los despliegues del agente en este borrador, un entorno cada vez.",
    "deployment": "Elige el despliegue del entorno que quieres editar. Al guardar solo cambia el elemento de ese despliegue.",
    "live": "Despliegues de este agente que se ejecutan ahora pero no están en el borrador. Trae uno para cambiarlo.",
    "bring": "Copia el documento activo de {{name}} en el borrador como un elemento nuevo.",
    "approvals": "Si las llamadas a herramientas de las ejecuciones de este despliegue esperan a una persona, y las reglas que deciden primero.",
    "fields": {
     "model": "El modelo que usa el harness, por ejemplo sonnet. Vacío usa el predeterminado del perfil de harness.",
     "effort": "El esfuerzo de razonamiento que transmite el harness, por ejemplo high. Vacío lo deja en manos del harness.",
     "timeoutSeconds": "Cuánto puede durar una ejecución antes de detenerse, en segundos.",
     "maxTurns": "Cuántos turnos del modelo puede hacer una ejecución antes de detenerse.",
     "maxBudgetUsd": "Cuánto puede costar una ejecución en dólares estadounidenses antes de que el harness la detenga.",
     "systemTemplate": "La plantilla de prompt que se usa como prompt de sistema, por nombre. Vacío usa el predeterminado integrado.",
     "systemVersion": "Una versión de esa plantilla que fijar. Vacío sigue su versión más reciente.",
     "approvalsEnabled": "Activado: las llamadas a herramientas que ninguna regla permite esperan a una persona en Aprobaciones.",
     "approvalDefaultAction": "Qué pasa con una llamada a herramienta que no coincide con ninguna regla: permitirla, denegarla o preguntar a una persona."
    },
    "rule": {
     "action": "Qué hace esta regla con una llamada a herramienta que coincide.",
     "pattern": "Con qué llamadas a herramientas coincide la regla, por ejemplo Bash(git *).",
     "inputPattern": "Un patrón opcional con el que también debe coincidir la entrada de la llamada a herramienta.",
     "remove": "Elimina esta regla al guardar.",
     "add": "Añade una regla; las reglas se comprueban en orden y decide la primera que coincide."
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
  "brand": "Garrison Agent Studio: crea, despliega y ejecuta aplicaciones agénticas con los harnesses de agentes que ya usas.",
  "tabs": {
   "serverInfo": "Acerca de Garrison Agent Studio: las versiones del servidor y del panel, enlaces a la documentación y al sitio web, las direcciones REST, MCP y A2A, y la identidad con la que has iniciado sesión."
  }
 },
 "common": {
  "openStudio": "Abre el Estudio de agentes, donde el arquitecto de agentes redacta agentes y aplicaciones contigo. Nada se activa hasta que una persona aprueba el borrador."
 },
 "wizard": {
  "start": "Empieza la configuración: añade una credencial, prepara el arquitecto de agentes, aplica un agente de ejemplo y pruébalo.",
  "skipStudio": "Continúa sin arquitecto. Puedes crear uno más tarde en el Estudio de agentes con Nuevo arquitecto.",
  "createArchitect": "Crea un despliegue de agent-architect con estas opciones y pasa al siguiente paso. Sus ejecuciones solo pueden editar tus borradores del estudio.",
  "continue": "El arquitecto ya existe. Pasa al siguiente paso de la configuración."
 },
 "views": {
  "home": {
   "openStudio": "Abre el Estudio de agentes y describe la aplicación que quieres; el arquitecto de agentes la redacta y una persona la aprueba antes de que se active."
  },
  "studioDraft": {
   "tabs": {
    "release": "Las aplicaciones que crea este borrador, una vez aplicado: sus despliegues por entorno, la promoción de dev a staging y prod, y la reversión desde el historial."
   }
  },
  "serverInfo": {
   "product": "El producto al que pertenece esta consola: el Estudio de agentes crea aplicaciones agénticas sobre el runtime de Garrison.",
   "docs": "Abre la documentación de Garrison en una pestaña nueva: arquitectura, configuración, harnesses, el estudio, aplicaciones y seguridad.",
   "studioDocs": "Abre la guía del Estudio de agentes en una pestaña nueva: borradores, el arquitecto de agentes, aplicar un borrador y la promoción.",
   "website": "Abre usegarrison.ai en una pestaña nueva para ver la presentación del producto, capturas y recorridos.",
   "source": "Abre el repositorio de Garrison en GitHub en una pestaña nueva: código fuente, incidencias y versiones."
  }
 },
 "resources": {
  "apps": {
   "actions": {
    "environments": "Mira los despliegues de la aplicación por entorno con sus revisiones fijadas y sobrescrituras, promuévela al siguiente entorno y revierte una promoción."
   }
  }
 },
 "apps": {
  "release": {
   "live": "El entorno cuyo despliegue de entrada usa la URL de la aplicación: {{environment}}. Cámbialo en el paso Entornos de la aplicación.",
   "environments": "Los despliegues de cada miembro en cada entorno: la revisión que fija cada uno (Última cuando sigue la última revisión publicada) y sus sobrescrituras de entorno.",
   "source": "El entorno desde el que se compara, normalmente el que probaste. También es donde empieza Promover.",
   "target": "El entorno con el que se compara y al que se promueve. Déjalo en el siguiente entorno para seguir el orden de promoción.",
   "promote": "Abre el diálogo de promoción de {{source}} a {{target}}: la revisión fijada de cada miembro pasa a sus despliegues en {{target}} en una sola transacción.",
   "noNext": "No hay ningún entorno después de {{source}}, así que no hay adónde promover.",
   "denied": "Para esto necesitas el permiso Ejecutar sobre Promoción en {{environment}}. Pide a un administrador el rol Releaser.",
   "noDeployment": "Este miembro no tiene despliegue en {{environment}}. Una promoción a {{environment}} falla hasta que tenga uno.",
   "overrides": "Sobrescrituras de entorno de este despliegue: variables definidas para sus ejecuciones. Los valores secretos nunca se muestran.",
   "entry": "El agente de entrada: quienes usan la aplicación hablan primero con este miembro.",
   "history": "Cada promoción y reversión de esta aplicación, de la más reciente a la más antigua. Una promoción aplicada se puede revertir una vez, lo que restaura las fijaciones que sustituyó.",
   "refresh": "Vuelve a leer los despliegues y el historial de promociones de esta aplicación.",
   "columns": {
    "member": "Los agentes miembros de la aplicación, primero el agente de entrada.",
    "environment": "Despliegues de cada miembro en {{environment}}, con su revisión fijada y sus sobrescrituras de entorno.",
    "difference": "Si las fijaciones y sobrescrituras de cada miembro coinciden entre los dos entornos que comparas."
   },
   "diff": {
    "Same": "Las revisiones fijadas y las sobrescrituras de {{source}} y {{target}} coinciden.",
    "Differs": "Las revisiones fijadas o las sobrescrituras difieren entre {{source}} y {{target}}. Promover mueve las fijaciones; cada despliegue conserva sus propias sobrescrituras.",
    "Missing": "Este miembro no tiene despliegue en {{target}}. Promover desde {{source}} fallaría sin mover nada."
   }
  }
 },
 "studio": {
  "release": {
   "title": "Las aplicaciones que crea este borrador, leídas de la configuración activa: despliegues por entorno, promover y revertir.",
   "app": "Elige qué aplicación del borrador mostrar cuando el borrador crea más de una."
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
   "architects": "Arquitectos de agentes que puedes reutilizar en cualquier borrador del estudio: créalos, edítalos y elimínalos, y elige el perfil de harness, el modelo y el prompt de cada uno."
  }
 },
 "resources": {
  "architects": {
   "add": "Crea un arquitecto de agentes: un despliegue de agent-architect que solo edita tus borradores del estudio y nunca los aplica.",
   "harnessProfileId": "El perfil de harness en el que se ejecuta el arquitecto, que decide la CLI de agente que usa (Claude Code, Codex, etc.).",
   "model": "El modelo que el arquitecto pide al harness. Vacío usa el modelo predeterminado del perfil de harness.",
   "architectPromptTemplateId": "La plantilla System que indica al arquitecto cómo trabajar. Los prompts integrados aparecen primero; clona uno para cambiarlo.",
   "architectPromptVersion": "Fija el arquitecto a una versión de su prompt. Vacío sigue la versión actual, así que una edición guardada se aplica en su siguiente turno.",
   "defaultModel": "No hay ningún modelo definido, así que el arquitecto usa el modelo predeterminado del perfil de harness.",
   "defaultBadge": "Este arquitecto usa el prompt predeterminado integrado, builtin/agent-architect.",
   "activeBadge": "Activo: los borradores pueden iniciar conversaciones nuevas con este arquitecto.",
   "inactiveBadge": "Inactivo: el arquitecto no acepta turnos nuevos y los borradores no lo ofrecen hasta que lo vuelvas a activar.",
   "actions": {
    "prompts": "Gestiona los prompts del arquitecto: elige el que usa este arquitecto y clona, edita, restablece o elimina prompts.",
    "deployment": "Abre el despliegue que hay detrás de este arquitecto para cambiar sus límites, ejecutor, reglas de salida y otros ajustes."
   }
  }
 },
 "studio": {
  "chat": {
   "manageArchitects": "Abre Agentes > Arquitectos para crear, editar o eliminar los arquitectos que puede usar cualquier borrador."
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
  "typeToConfirm": "Escribe {{word}} tal como aparece para activar el botón Eliminar. Así un clic accidental no borra algo que no se puede recuperar.",
  "typeFirst": "Escribe primero {{word}} en el cuadro. El botón sigue desactivado hasta que la palabra coincida."
 },
 "resources": {
  "agents": {
   "protected": "{{name}} es un agente integrado y protegido que Garrison crea en cada inquilino, así que no se puede cambiar ni eliminar."
  }
 },
 "views": {
  "agentDetail": {
   "delete": "Elimina este agente con sus despliegues y su historial de revisiones. Confirmas escribiendo delete, y un disparador, pipeline, aplicación o endpoint de notificación que lo use impide eliminarlo."
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
   "credentialSecretId": "El secreto con el que inicia sesión el harness del arquitecto: una clave de API de Anthropic o un token OAuth de Claude Code para Claude Code, una clave de API de OpenAI o un inicio de sesión de ChatGPT para Codex, etc. Garrison lo vincula al despliegue del arquitecto."
  },
  "chat": {
   "fixCredential": "Abre Agentes > Arquitectos filtrado por este arquitecto, edítalo y elige su secreto de credencial.",
   "openSecrets": "Abre Configuración > Secretos para añadir la clave de API o el token, o para comprobar el valor del que usa el arquitecto."
  }
 },
 "resources": {
  "architects": {
   "credentialSecretId": "El secreto con el que inicia sesión el harness del arquitecto: una clave de API de Anthropic o un token OAuth de Claude Code para Claude Code, una clave de API de OpenAI o un inicio de sesión de ChatGPT para Codex, etc. Garrison lo vincula al despliegue del arquitecto.",
   "credentialCell": "El secreto con el que inicia sesión el harness de este arquitecto ({{kind}}).",
   "noCredential": "No hay ningún secreto de credencial vinculado, así que los harness que lo necesitan (Claude Code, Codex, Gemini CLI) fallan con Not logged in. Edita el arquitecto para elegir uno."
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
  "refresh": "Vuelve a leer esta lista, por ejemplo después de añadir un registro en otra página.",
  "open": "Abre {{page}} en una pestaña nueva para que este formulario conserve lo que escribiste. Vuelve aquí al terminar; la lista se actualiza."
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
  "title": "Pasos para crear o encontrar este tipo de credencial con su proveedor, y cómo Garrison la pasa al harness.",
  "link": "Abre {{url}} en una pestaña nueva."
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
   "wait": "El arquitecto está preparando su respuesta. Las primeras palabras aparecen aquí en cuanto el modelo las escribe.",
   "waitElapsed": "Cuánto llevas esperando este turno.",
   "metrics": {
    "model": "El modelo que respondió este turno, según el harness."
   },
   "tool": {
    "running": "{{name}} está en curso: el arquitecto llamó a esta herramienta mientras escribía su respuesta.",
    "ok": "{{name}} terminó: el arquitecto llamó a esta herramienta mientras escribía su respuesta.",
    "failed": "{{name}} falló: el arquitecto llamó a esta herramienta y devolvió un error. Abre la ejecución para ver los detalles."
   },
   "copyMessage": "Copia tu mensaje al portapapeles.",
   "copyAnswer": "Copia la respuesta del arquitecto al portapapeles como Markdown.",
   "thinkingSummary": "Lo que el modelo pensó antes de responder, según el harness."
  }
 },
 "copy": {
  "failed": "El navegador no permitió copiar aquí. Selecciona el texto y pulsa Ctrl+C (Cmd+C en Mac)."
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
    "apr": "Abre la aprobación {{id}}, donde una persona con permiso la autoriza o la deniega.",
    "run": "Abre la ejecución {{id}} con sus eventos, telemetría y archivos.",
    "cnv": "Abre la conversación {{id}} con todos sus turnos.",
    "agt": "Abre el agente {{id}} con sus despliegues y revisiones.",
    "sdr": "Abre el borrador del estudio {{id}}.",
    "plr": "Abre la ejecución de pipeline {{id}} con la línea de tiempo de sus etapas.",
    "tpl": "Abre la plantilla de prompt {{id}} para leerla o editarla."
   },
   "disclaimer": "Las respuestas vienen de un modelo de lenguaje. Léelas antes de confiar en ellas y revisa la diferencia del borrador antes de que alguien lo apruebe.",
   "tool": {
    "running": "{{name}} está en curso. Haz clic para ver los argumentos que envió el arquitecto.",
    "ok": "{{name}} terminó. Haz clic para ver los argumentos y el resultado.",
    "failed": "{{name}} falló. Haz clic para ver los argumentos y el error que devolvió."
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
   "agentWizard": "Un camino guiado desde una descripción hasta agentes aprobados que se ejecutan en dev."
  }
 },
 "resources": {
  "agents": {
   "wizard": "Abre el asistente de agentes: describa lo que necesita y le guiará por el acceso al modelo, el diseño con el arquitecto de agentes, la revisión, la aprobación y una primera conversación."
  }
 },
 "common": {
  "openStudio": "Abre el asistente de agentes, donde el arquitecto de agentes diseña agentes con usted. Nada se activa hasta que se aprueba el borrador."
 },
 "views": {
  "home": {
   "openStudio": "Abra el asistente de agentes y describa lo que necesita. Le guía para crear, aprobar y probar los agentes."
  },
  "studioDraft": {
   "back": "Volver a este borrador en el asistente de agentes."
  },
  "agentWizard": {
   "back": "Ir al paso anterior. No se pierde nada de lo que introdujo.",
   "next": "Ir al paso siguiente.",
   "advanced": "Abrir este borrador en el espacio de trabajo completo del estudio: lienzo, editor de elementos, diferencias y zona de pruebas.",
   "locked": "Termine primero los pasos anteriores.",
   "steps": {
    "goal": "Nombre el proyecto y describa lo que deben hacer los agentes.",
    "access": "Elija el harness, el modelo y la credencial con los que se ejecutan los agentes.",
    "design": "Converse con el arquitecto de agentes, que crea los agentes en el borrador.",
    "review": "Compruebe el borrador contra la configuración activa.",
    "approve": "Apruebe y publique el borrador, y configure los despliegues de dev.",
    "test": "Hable con el nuevo agente en dev."
   },
   "goal": {
    "needTitle": "Introduzca primero un nombre de proyecto.",
    "needGoal": "Describa primero lo que deben hacer los agentes.",
    "name": "Un nombre corto para este proyecto. Da nombre al borrador.",
    "goal": "Lo que deben hacer los agentes, con palabras sencillas. El arquitecto parte de esto.",
    "resume": "Continuar este borrador donde lo dejó.",
    "allDrafts": "Ver todos los borradores del estudio, incluidos los que no empezó en el asistente."
   },
   "access": {
    "needProfile": "Elija primero un perfil de harness.",
    "needCredential": "Elija o añada primero una credencial.",
    "harness": "El perfil de harness en el que se ejecutan los agentes y el arquitecto.",
    "model": "El modelo que se usará. Déjelo vacío para usar el predeterminado del harness.",
    "useSecret": "Iniciar sesión con el secreto {{name}}.",
    "addSecret": "Guardar aquí una nueva credencial, con los pasos para obtener su valor.",
    "secretName": "Un nombre para el secreto, para encontrarlo después en la página Secretos.",
    "saveSecret": "Guardar el secreto y usarlo para estos agentes.",
    "finishSecret": "Guarde o cancele primero la nueva credencial."
   },
   "design": {
    "needAgent": "El borrador aún no tiene agentes. Siga hablando con el arquitecto."
   },
   "review": {
    "askFix": "Volver al chat y enviar los problemas al arquitecto.",
    "validate": "Comprobar de nuevo el borrador contra la configuración activa.",
    "needValid": "El borrador debe ser correcto antes de poder aprobarse."
   },
   "approve": {
    "approve": "Aprobar el borrador, aplicarlo y dar a cada agente un despliegue de dev.",
    "openApproval": "Abrir la solicitud de aprobación en una vista nueva.",
    "retry": "Configurar de nuevo los despliegues de dev.",
    "openAgent": "Abrir este agente."
   },
   "test": {
    "message": "Lo que se envía al agente. Enter envía; Ctrl+Enter o Shift+Enter añade una línea nueva.",
    "send": "Enviar el mensaje al despliegue de dev del agente.",
    "another": "Iniciar de nuevo el asistente para otro conjunto de agentes."
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
    "openApp": "Abre el chat de la aplicación en una pestaña nueva: la conversación conserva su historial y el agente de entrada puede consultar a los demás agentes de la aplicación."
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
   "backgroundColor": "Fondo de la página del chat de la aplicación, como #RRGGBB. Vacío mantiene el fondo del tema.",
   "headerColor": "Fondo de la barra de encabezado del chat, como #RRGGBB. Vacío mantiene el color del tema.",
   "agentBubbleColor": "Fondo de los mensajes del agente, como #RRGGBB. Vacío mantiene el color del tema.",
   "fontFamily": "La tipografía de todo el chat. Cada una usa fuentes que el navegador ya tiene.",
   "faviconAssetId": "Un recurso de imagen que se muestra como icono de la pestaña. Vacío usa el logotipo, o el icono predeterminado si no hay."
  }
 },
 "form": {
  "defaultColor": "Vacíe {{field}} para que el chat use su color predeterminado, {{color}}."
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
   "conversationListColor": "Fondo de la lista de conversaciones, como #RRGGBB. Vacío mantiene el color del tema.",
   "composerColor": "Fondo del área de escritura, como #RRGGBB. Vacío mantiene el color del tema.",
   "filesColor": "Fondo de la lista de archivos, como #RRGGBB. Vacío mantiene el color del tema."
  }
 }
});

tips.nav.hubs.platformConfiguration = "Gestionar credenciales, almacenamiento, precios de modelos, cuotas y notificaciones.";

tips.nav.hubs.connections = "Harnesses y endpoints API reutilizables. Configura una vez y selecciona la conexión donde se ejecute un agente.";
tips.nav.hubs.configuration = "Gestiona prompts, recursos, servidores de herramientas, credenciales, almacenamiento y políticas.";

tips.nav.hubs.operations = "Gestiona resultados almacenados, precios de modelos, límites de uso y notificaciones.";
tips.nav.hubs.manifests = tips.nav.tabs.manifests;

tips.views.studio.discard = "Elimina permanentemente este borrador tras confirmar. Los agentes y despliegues publicados no se verán afectados.";
tips.views.studio.discardPending = "Elimina permanentemente este borrador tras confirmar y cancela su aprobación pendiente.";

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
   "memory": "Memoria: lo que agentes y personas guardaron, por ámbito, con quién escribió cada entrada y cuándo. Lea o elimine entradas aquí."
  }
 },
 "enums": {
  "resourceType": {
   "Memory": "Entradas de la memoria por ámbitos. Leer lista las entradas y lee su texto; Eliminar las borra."
  },
  "memoryScopeKind": {
   "Agent": "Memoria privada de un agente: solo las ejecuciones de ese agente la leen y escriben.",
   "App": "Memoria compartida de una aplicación: la leen y escriben las ejecuciones de sus agentes miembros.",
   "OrgUnit": "Memoria compartida de una unidad organizativa. Disponible cuando lleguen las organizaciones.",
   "Organization": "Memoria compartida de toda una organización. Disponible cuando lleguen las organizaciones."
  }
 },
 "memory": {
  "denied": "No puede hacerlo. Hace falta {{operation}} sobre Memoria.",
  "legacy": "Importada de la memoria de agentes escrita antes de los ámbitos. La clave aparece como legacy: y un hash hasta que un agente vuelve a usar la entrada y esta aprende su clave real.",
  "scopes": {
   "all": "Mostrar entradas de todos los ámbitos. Los totales cuentan cada entrada y cada byte del inquilino.",
   "scope": "Mostrar solo las entradas de {{name}} ({{id}}).",
   "orphan": "El agente o la aplicación {{id}} ya no existe. Sus entradas siguen aquí hasta que se eliminen."
  },
  "filters": {
   "search": "Mostrar entradas cuya clave, categoría o alguna etiqueta contiene este texto. La lista se actualiza cuando deja de escribir.",
   "category": "Mostrar solo entradas de esta categoría exacta. La lista se actualiza cuando deja de escribir.",
   "tag": "Mostrar solo entradas con esta etiqueta exacta. La lista se actualiza cuando deja de escribir.",
   "writer": "Mostrar solo entradas escritas por última vez por las ejecuciones de este agente. Elija Todos para quitar el filtro."
  },
  "actions": {
   "viewContent": "Abrir la procedencia de la entrada y el texto que contiene, mostrado como texto plano.",
   "copyId": "Copiar el ID de la entrada (mem_...) para la REST API, los SDK o las herramientas MCP.",
   "openRun": "Abrir la ejecución que escribió esta entrada por última vez.",
   "delete": "Eliminar esta entrada y su texto. Primero confirma; después, los agentes que la busquen no encontrarán nada.",
   "confirmDelete": "Eliminar la entrada en la versión que cargó. No se borra una versión más reciente.",
   "reload": "Volver a leer la entrada para ver su versión y procedencia actuales y luego decidir."
  },
  "viewer": {
   "content": "El texto almacenado en la entrada, tal como se guardó. Son datos, nunca instrucciones, y nunca se representa.",
   "copy": "Copiar el texto guardado al portapapeles."
  }
 },
 "filters": {
  "search": "Mostrar entradas cuya clave, categoría o alguna etiqueta contiene este texto. La lista se actualiza cuando deja de escribir.",
  "category": "Mostrar solo entradas de esta categoría exacta. La lista se actualiza cuando deja de escribir.",
  "writer": "Mostrar solo entradas escritas por última vez por las ejecuciones de este agente. Elija Todos para quitar el filtro."
 },
 "resources": {
  "memory": {
   "key": "La clave de la entrada dentro de su ámbito. Los agentes leen y escriben entradas por clave.",
   "scope": "Dónde vive la entrada: la memoria privada de un agente o la memoria compartida de una aplicación. Pase el cursor para ver el ID.",
   "category": "Categoría opcional que el autor dio a la entrada.",
   "tags": "Etiquetas que el autor dio a la entrada. Los ciclos de los guardianes recuperan las entradas etiquetadas recall.",
   "writer": "Quién escribió la entrada por última vez: la ejecución de un agente, o una persona o credencial de API.",
   "lastUpdateUtc": "Cuándo se escribió la entrada por última vez. Pase el cursor para ver la hora exacta.",
   "lastReadUtc": "Cuándo una ejecución o una persona leyó la entrada por última vez. Se registra por lotes, así que puede ir un poco atrasado.",
   "version": "Contador de escrituras: cada escritura suma uno. Escribir o eliminar con esta versión nunca sobrescribe una más reciente.",
   "bytes": "Tamaño del texto guardado en bytes UTF-8.",
   "expiresUtc": "Cuándo caduca la entrada y el barrido de mantenimiento la elimina. Nunca significa que permanece hasta que se elimine.",
   "writerRunId": "La ejecución que escribió la entrada por última vez, si la escribió una ejecución.",
   "createdUtc": "Cuándo se escribió la entrada por primera vez.",
   "sha256": "Hash SHA-256 del texto guardado, para comparar versiones sin leerlas.",
   "id": "El ID de la entrada (mem_...), para la REST API, los SDK y las herramientas MCP."
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
  "title": "Memoria",
  "p1": "Los agentes guardan notas entre ejecuciones en la memoria. Cada entrada vive en un ámbito: la memoria privada de un agente o la memoria compartida de una aplicación a la que pertenece el agente. Las ejecuciones leen y escriben con las herramientas garrison_memory, y solo en los ámbitos que su agente puede usar.",
  "p2": "Cada entrada registra quién la escribió, desde qué ejecución, cuándo y su versión. Una escritura o eliminación que indica la versión leída se rechaza si alguien escribió entretanto, así agentes y personas no se sobrescriben.",
  "p3": "El texto son datos que guardó un agente o una persona. Aquí se muestra como texto plano y llega a los agentes como datos, nunca como instrucciones. Elimine una entrada que no deba recordarse; después, los agentes que la busquen no encontrarán nada."
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
   "reports": "Informes: lo que agentes y personas informaron hacia arriba, los más recientes primero, con salud, tipo, autor y periodo. Abra uno para ver sus métricas y un gráfico."
  }
 },
 "enums": {
  "resourceType": {
   "Report": "Informes presentados por ejecuciones y personas. Leer lista los informes y el historial de métricas; Crear presenta uno."
  },
  "notificationEvent": {
   "ReportUnhealthy": "Una ejecución o una persona presentó un informe cuya salud es En mal estado."
  },
  "reportKind": {
   "Status": "Una actualización periódica sobre cómo va una tarea permanente.",
   "Incident": "Algo salió mal y el lector debería saberlo ya.",
   "Decision": "Constancia de una decisión que tomó el autor y de sus motivos.",
   "Handoff": "Trabajo que pasa a otra persona, con lo que necesita para continuar.",
   "Brief": "Un resumen breve preparado para un lector, como un responsable o el consejo."
  },
  "reportHealth": {
   "Healthy": "Todo lo que el autor supervisa funciona como se espera.",
   "Degraded": "Sigue funcionando, pero peor de lo esperado. Conviene vigilarlo.",
   "Unhealthy": "Algo está roto o en riesgo. Avisa a los endpoints suscritos a los informes en mal estado.",
   "Unknown": "El autor no indicó cómo están las cosas o no pudo saberlo."
  },
  "reportAudience": {
   "Manager": "Para el responsable directo del autor.",
   "Chain": "Para todos los responsables de la línea jerárquica del autor.",
   "Board": "Para el consejo que supervisa la organización."
  },
  "reportIssueSeverity": {
   "Low": "Un problema menor que puede esperar a la próxima revisión habitual.",
   "Medium": "Un problema que requiere atención pronto, pero no es urgente.",
   "High": "Un problema grave que requiere atención inmediata."
  }
 },
 "reports": {
  "denied": "No puede hacer esto. Necesita {{operation}} sobre Informe.",
  "filters": {
   "kind": "Mostrar solo informes de este tipo. Elija Todos para quitar el filtro."
  },
  "actions": {
   "file": "Presentar un informe en su nombre o en el de un agente. Un informe presentado no se puede modificar ni eliminar.",
   "copyId": "Copiar el ID del informe (rpt_...) para la REST API, los SDK o las herramientas MCP.",
   "openRun": "Abrir la ejecución que presentó este informe.",
   "openKeeper": "Abrir el guardián cuyo ciclo presentó este informe.",
   "openAuthor": "Abrir el agente que escribió este informe."
  },
  "file": {
   "submit": "Presentar el informe. Después no se puede modificar.",
   "fields": {
    "title": "Un título breve de 1 a 256 caracteres.",
    "kind": "Qué tipo de informe es: una actualización de estado, un incidente, una decisión, un traspaso o un resumen.",
    "health": "Cómo están las cosas. En mal estado avisa a los endpoints suscritos a los informes en mal estado.",
    "audience": "Para quién es el informe: el responsable, toda la cadena de mando o el consejo.",
    "agent": "Presentar el informe como del agente, para que se sume a sus informes y a su historial de métricas. Déjelo vacío para presentarlo en su nombre.",
    "body": "El informe en sí, como texto sin formato. Se muestra exactamente como se escribió."
   }
  },
  "chart": {
   "metric": "Elija una de las métricas de este informe para verla en todos los informes del mismo autor.",
   "chart": "Todos los valores que el autor informó para esta métrica, del más antiguo al más reciente, de hasta 500 informes. Pase el puntero por el gráfico para leer un valor."
  }
 },
 "filters": {
  "author": "Mostrar solo los informes que escribió este agente. Elija Todos para quitar el filtro.",
  "health": "Mostrar solo los informes con esta salud. Elija Todos para quitar el filtro.",
  "app": "Mostrar solo los informes presentados para esta aplicación. Elija Todos para quitar el filtro.",
  "from": "Mostrar solo los informes presentados en este momento o después.",
  "to": "Mostrar solo los informes presentados en este momento o antes."
 },
 "resources": {
  "reports": {
   "createdUtc": "Cuándo se presentó el informe. Pase el puntero para ver la hora exacta.",
   "title": "El título que el autor dio al informe. Pase el puntero para ver el texto completo.",
   "author": "El agente que escribió el informe, o la persona que lo presentó en su propio nombre.",
   "kind": "Qué tipo de informe es: estado, incidente, decisión, traspaso o resumen.",
   "health": "Cómo dice el autor que están las cosas.",
   "app": "La aplicación de la que trata el informe, si nombra una.",
   "period": "El intervalo de tiempo que cubre el informe, si el autor indicó uno.",
   "issues": "Los problemas que plantea el informe, contados por gravedad.",
   "audience": "Para quién es el informe: el responsable, la cadena de mando o el consejo.",
   "filedBy": "Quién presentó el informe: una ejecución, o una persona o credencial de API.",
   "runId": "La ejecución que presentó el informe, si lo presentó una ejecución.",
   "id": "El ID del informe (rpt_...), para la REST API, los SDK y las herramientas MCP."
  }
 },
 "views": {
  "reportDetail": {
   "back": "Volver a la lista de informes.",
   "viewJson": "Mostrar el informe tal como lo devuelve la API.",
   "body": "El texto del informe tal como lo escribió el autor, mostrado como texto sin formato.",
   "metrics": "Cifras que informó el autor, cada una con un nombre y una unidad opcional.",
   "chart": "Una métrica en todos los informes del mismo autor, del más antiguo al más reciente.",
   "issues": "Problemas que plantea el informe, cada uno con una gravedad.",
   "decisions": "Decisiones que el autor registró en este informe.",
   "openAgent": "Abrir el agente que escribió este informe.",
   "openRun": "Abrir la ejecución que presentó este informe.",
   "openKeeper": "Abrir el guardián cuyo ciclo presentó este informe.",
   "openApp": "Abrir la aplicación de la que trata este informe.",
   "columns": {
    "name": "El nombre de métrica que usó el autor. Las métricas con el mismo nombre se representan juntas.",
    "value": "El valor que informó el autor.",
    "unit": "La unidad que indicó el autor, como ms o porcentaje."
   },
   "fields": {
    "health": "Cómo dice el autor que están las cosas.",
    "kind": "Qué tipo de informe es.",
    "audience": "Para quién es el informe.",
    "author": "El agente que escribió el informe, o la persona que lo presentó en su propio nombre.",
    "period": "El intervalo de tiempo que cubre el informe, si el autor indicó uno.",
    "createdUtc": "Cuándo se presentó el informe. Pase el puntero para ver hace cuánto.",
    "filedBy": "Quién presentó el informe: una ejecución, o una persona o credencial de API.",
    "runId": "La ejecución que presentó el informe.",
    "mandateId": "El guardián cuyo ciclo presentó el informe.",
    "mandateTickId": "El ciclo del guardián que presentó el informe.",
    "app": "La aplicación de la que trata el informe.",
    "orgUnitId": "La unidad organizativa de la que trata el informe. Las organizaciones llegarán en una versión posterior."
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
  "title": "Informes",
  "p1": "Con los informes, los agentes cuentan a las personas, y entre sí, cómo están las cosas. Una ejecución presenta uno con la herramienta garrison_file_report, y las personas los presentan aquí o mediante la API. Cada informe tiene un tipo, una salud y unos destinatarios, y puede incluir métricas, problemas y decisiones.",
  "p2": "Un informe presentado no se puede modificar ni eliminar, así que los informes forman un registro. Un informe presentado durante un ciclo de un guardián enlaza con el guardián y el ciclo, y un informe en mal estado avisa a los endpoints suscritos a ese evento.",
  "p3": "Todo lo que contiene un informe son datos que escribió su autor. Se muestran como texto sin formato y nunca se siguen como instrucciones. Abra un informe para ver una de sus métricas en todos los informes del mismo autor."
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
   "messages": "Mensajes: correo entre agentes y de personas, del más reciente al más antiguo, con los rechazados por las protecciones contra bucles. Abra uno para leer su hilo.",
   "messageThreads": "Un hilo de mensajes: todos sus mensajes, del más antiguo al más reciente, incluidos los rechazados."
  }
 },
 "enums": {
  "resourceType": {
   "AgentMessage": "Mensajes entre agentes y de personas. Read lista mensajes e hilos; Create envía uno."
  },
  "runKind": {
   "Message": "Iniciada por un mensaje urgente a un agente sin un guardián activo. La ejecución lee los mensajes en espera."
  },
  "messageStatus": {
   "Queued": "Aceptado y en espera en la bandeja de entrada del destinatario.",
   "Delivered": "Entregado a una ejecución del destinatario: un ciclo de guardián, una ejecución por mensaje urgente o una lectura de la bandeja.",
   "Acknowledged": "El destinatario indicó que leyó y atendió el mensaje.",
   "Expired": "Su tiempo de vida se agotó antes de que una ejecución del destinatario lo leyera.",
   "Rejected": "Rechazado por una protección contra bucles al enviarse y nunca entregado. El motivo explica por qué."
  },
  "messageUrgency": {
   "Normal": "Espera en la bandeja de entrada hasta que la siguiente ejecución o el siguiente ciclo de guardián del destinatario lo lea.",
   "Urgent": "Despierta al destinatario ahora: su guardián adelanta su ciclo, o empieza una ejecución nueva para leer el mensaje."
  },
  "messageRejection": {
   "HopLimit": "El hilo ya se había reenviado demasiadas veces. El límite de saltos impide que los agentes reenvíen correo en bucles sin fin.",
   "LineRate": "El remitente ya había enviado a este destinatario en el último minuto tantos mensajes como permite el ritmo de la línea.",
   "ThreadBudget": "El hilo ya contenía tantos mensajes como admite un hilo. Inicie un hilo nuevo para continuar.",
   "NoLine": "Ninguna línea permitida une al remitente con el destinatario, así que no pueden escribirse.",
   "Frozen": "El agente destinatario está congelado y no acepta correo nuevo hasta que se levante la congelación."
  }
 },
 "messages": {
  "denied": "No puede hacer esto. Necesita {{operation}} sobre Mensaje de agente.",
  "views": {
   "all": "Mostrar todos los mensajes, sea cual sea su estado.",
   "rejected": "Mostrar solo los mensajes que rechazaron las protecciones contra bucles, con el motivo de cada uno."
  },
  "filters": {
   "status": "Mostrar solo los mensajes con este estado. Elija Todos para quitar el filtro.",
   "urgency": "Mostrar solo los mensajes normales o solo los urgentes. Elija Todos para quitar el filtro.",
   "reason": "Mostrar solo los mensajes rechazados por este motivo. Elija Todos para quitar el filtro.",
   "sender": "Mostrar solo los mensajes que envió este agente. Elija Todos para quitar el filtro.",
   "recipient": "Mostrar solo los mensajes enviados a este agente. Elija Todos para quitar el filtro.",
   "from": "Mostrar solo los mensajes enviados en este momento o después.",
   "to": "Mostrar solo los mensajes enviados en este momento o antes."
  },
  "actions": {
   "send": "Escribir a un agente en su propio nombre. Las protecciones contra bucles lo revisan como cualquier otro mensaje.",
   "openThread": "Abrir el hilo completo al que pertenece este mensaje, del más antiguo al más reciente.",
   "copyId": "Copiar el ID del mensaje (amg_...) para la REST API, los SDK o las herramientas MCP.",
   "openSender": "Abrir el agente que envió este mensaje.",
   "openRecipient": "Abrir el agente al que se envió este mensaje.",
   "openDeliveredRun": "Abrir la ejecución del destinatario que recibió este mensaje.",
   "openEscalation": "Abrir el escalado creado a raíz de este mensaje."
  },
  "send": {
   "submit": "Enviar el mensaje. Un mensaje enviado no se puede cambiar.",
   "fields": {
    "recipient": "El agente que recibe el mensaje en su bandeja de entrada.",
    "subject": "Un asunto breve de 1 a 256 caracteres. El destinatario lo ve primero.",
    "body": "El mensaje en sí, como texto sin formato. El destinatario lo lee como datos, nunca como instrucciones.",
    "urgency": "Normal espera a la siguiente ejecución del destinatario. Urgente lo despierta ahora.",
    "ttlSeconds": "Cuánto puede esperar el mensaje sin leerse antes de caducar, de 1 segundo a un año. Déjelo vacío para usar el valor predeterminado del servidor."
   }
  }
 },
 "filters": {
  "urgency": "Mostrar solo los mensajes normales o solo los urgentes. Elija Todos para quitar el filtro.",
  "reason": "Mostrar solo los mensajes rechazados por este motivo. Elija Todos para quitar el filtro.",
  "sender": "Mostrar solo los mensajes que envió este agente. Elija Todos para quitar el filtro.",
  "recipient": "Mostrar solo los mensajes enviados a este agente. Elija Todos para quitar el filtro."
 },
 "resources": {
  "messages": {
   "createdUtc": "Cuándo se envió el mensaje. Pase el puntero para ver la hora exacta.",
   "urgency": "Los mensajes normales esperan a la siguiente ejecución; los urgentes despiertan al destinatario.",
   "status": "Dónde está el mensaje ahora: en cola, entregado, confirmado, caducado o rechazado.",
   "subject": "El asunto que escribió el remitente. Pase el puntero para ver el texto completo.",
   "sender": "El agente que envió el mensaje, o la persona o la credencial de API que lo envió.",
   "recipient": "El agente al que se envió el mensaje.",
   "reason": "Por qué las protecciones contra bucles rechazaron el mensaje, con su detalle. Vacío en los mensajes aceptados.",
   "hopCount": "Cuántas veces se había reenviado el hilo cuando se envió este mensaje.",
   "deliveredRunId": "La ejecución del destinatario que recibió el mensaje.",
   "expiresUtc": "Cuándo caduca el mensaje si ninguna ejecución lo lee antes.",
   "escalationId": "El escalado creado a raíz de este mensaje, si existe.",
   "threadId": "El ID del hilo: el ID del primer mensaje del hilo.",
   "id": "El ID del mensaje (amg_...), para la REST API, los SDK y las herramientas MCP."
  }
 },
 "views": {
  "messageThread": {
   "back": "Volver a la lista de mensajes.",
   "viewJson": "Mostrar el hilo tal como lo devuelve la API.",
   "openSender": "Abrir el agente que envió este mensaje.",
   "openRecipient": "Abrir el agente al que se envió este mensaje.",
   "openDeliveredRun": "Abrir la ejecución que recibió este mensaje.",
   "openEscalation": "Abrir el escalado creado a raíz de este mensaje.",
   "reply": "Responder al agente que envió este mensaje, en el mismo hilo.",
   "fields": {
    "sender": "El agente, la persona o la credencial de API que envió el mensaje.",
    "recipient": "El agente al que se envió el mensaje.",
    "createdUtc": "Cuándo se envió el mensaje. Pase el puntero para ver cuánto hace.",
    "hopCount": "Cuántas veces se había reenviado el hilo cuando se envió este mensaje.",
    "deliveredRunId": "La ejecución del destinatario que recibió el mensaje.",
    "deliveredUtc": "Cuándo una ejecución del destinatario recibió el mensaje.",
    "acknowledgedUtc": "Cuándo el destinatario indicó que atendió el mensaje.",
    "expiresUtc": "Cuándo caduca el mensaje si ninguna ejecución lo lee antes.",
    "wokeRecipient": "Este mensaje urgente despertó al destinatario: su guardián adelantó su ciclo o empezó una ejecución nueva.",
    "escalationId": "El escalado creado a raíz de este mensaje.",
    "id": "El ID del mensaje (amg_...), para la REST API, los SDK y las herramientas MCP."
   }
  },
  "agentDetail": {
   "tabs": {
    "inbox": "Mensajes enviados a este agente, del más reciente al más antiguo, con su estado. Envíele un mensaje desde aquí."
   },
   "inbox": {
    "status": "Mostrar solo los mensajes con este estado. Elija Todos para quitar el filtro.",
    "openAll": "Abrir la página Mensajes filtrada por la bandeja de entrada de este agente.",
    "send": "Escribir a este agente en su propio nombre.",
    "openThread": "Abrir el hilo al que pertenece este mensaje."
   }
  },
  "home": {
   "autonomy": {
    "rejected": "Mensajes que las protecciones contra bucles rechazaron en las últimas 24 horas: demasiados saltos, demasiado rápido, un hilo demasiado largo, sin línea o un destinatario congelado. Abra los mensajes rechazados para ver el motivo."
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
  "title": "Mensajes",
  "p1": "Los agentes se escriben con la herramienta garrison_send_message, y las personas escriben a los agentes aquí o mediante la API. Un mensaje espera en la bandeja de entrada del destinatario hasta que una ejecución lo lee. Un mensaje urgente despierta al destinatario ahora: su guardián adelanta su ciclo, o empieza una ejecución nueva para leerlo.",
  "p2": "Las protecciones contra bucles revisan cada mensaje antes de aceptarlo. Un mensaje se rechaza cuando su hilo se reenvió demasiadas veces, cuando el remitente escribe al mismo agente demasiado rápido, cuando el hilo es demasiado largo, cuando ninguna línea une a los dos agentes o cuando el destinatario está congelado. Los mensajes rechazados se conservan con el motivo en la vista Rechazados.",
  "p3": "Todo lo que contiene un mensaje son datos que escribió su remitente. Se muestra como texto sin formato y llega a los agentes como datos, nunca como instrucciones. Abra un mensaje para leer su hilo completo, del más antiguo al más reciente."
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
   "organizations": "Organizaciones: árboles de unidades lideradas por agentes, con presupuestos y revisiones. Abra una para ver su organigrama."
  }
 },
 "enums": {
  "resourceType": {
   "Organization": "Organizaciones, sus unidades, revisiones y gasto. Leer las consulta; Crear y Actualizar las modifican; Eliminar las borra."
  },
  "organizationStatus": {
   "Draft": "Creada pero nunca publicada. Nada de ella se aplica hasta que una revisión entre en vigor.",
   "Active": "Hay una revisión en vigor: la cadena de mando, las líneas y los presupuestos la siguen.",
   "Frozen": "Una congelación de la organización detiene las nuevas ejecuciones y los despertares de guardianes de todos sus agentes.",
   "Retired": "Retirada por una persona. Nada de ella se aplica, y no puede cambiar hasta que se reactive."
  },
  "budgetPeriod": {
   "Day": "El presupuesto cubre el gasto de un día UTC y se reinicia a medianoche UTC.",
   "Month": "El presupuesto cubre el gasto de un mes natural UTC y se reinicia el día uno."
  },
  "orgRevisionState": {
   "Draft": "Una instantánea del árbol de trabajo que aún no está en vigor. Publíquela para ponerla en vigor.",
   "Published": "La revisión en vigor. La cadena de mando, las líneas y los presupuestos la siguen.",
   "Superseded": "Estuvo en vigor y después la sustituyó una revisión más reciente. Puede revertir a ella."
  }
 },
 "organizations": {
  "denied": "No puede hacerlo. Hace falta {{operation}} sobre Organización.",
  "retiredLocked": "La organización está retirada. Reactívela antes de modificarla.",
  "actions": {
   "open": "Abrir el organigrama, los presupuestos y las revisiones de la organización.",
   "copyId": "Copiar el ID de la organización (org_...) para la API REST, los SDK o las herramientas MCP."
  },
  "spend": {
   "bar": "Gasto de esta unidad y de todas las que dependen de ella en el periodo actual, frente a su presupuesto.",
   "exhausted": "El presupuesto de este periodo está agotado. Las nuevas ejecuciones de agentes de esta unidad y de las que dependen de ella se rechazan hasta que empiece el siguiente periodo."
  },
  "chart": {
   "toggle": "Mostrar u ocultar las unidades que dependen de esta.",
   "lead": "El agente que lidera esta unidad, con su cargo y su guardián. Su responsable es el líder de la unidad superior.",
   "mandate": "El guardián (tarea permanente) que tiene este agente en su puesto.",
   "members": "Agentes que trabajan en esta unidad y dependen de su líder, con sus cargos y guardianes.",
   "peers": "Unidades a las que esta unidad puede enviar mensajes directamente, sin pasar por un responsable común.",
   "peer": "Señale aquí para resaltar la unidad par en el organigrama.",
   "app": "La aplicación agéntica que ejecuta esta unidad, si la hay.",
   "edit": "Cambiar el nombre, la unidad superior, el líder, los miembros, las líneas entre pares y los presupuestos de esta unidad.",
   "addChild": "Añadir una nueva unidad que dependa de esta.",
   "remove": "Quitar esta unidad del árbol de trabajo. No se puede quitar una unidad que tiene unidades por debajo."
  },
  "unit": {
   "save": "Guardar la unidad en el árbol de trabajo. Entra en vigor cuando publique una revisión.",
   "sections": {
    "lead": "El agente que lidera esta unidad y su función de responsable.",
    "members": "Los agentes que trabajan en esta unidad y las unidades con las que tiene líneas directas.",
    "budgets": "Límites de lo que pueden gastar esta unidad y todas las que dependen de ella. El presupuesto de una unidad no puede superar el de su unidad superior."
   },
   "fields": {
    "name": "Un nombre único para la unidad en esta organización, de 1 a 128 caracteres.",
    "parentUnitId": "La unidad de la que depende esta. Déjelo vacío para la unidad raíz; una organización tiene exactamente una.",
    "description": "Qué hace la unidad, en palabras sencillas. Opcional.",
    "leadAgentId": "El agente que lidera la unidad. Un agente lidera como máximo una unidad y ocupa un solo puesto por organización.",
    "leadTitle": "El cargo del líder, que se muestra en el organigrama y a otros agentes. Opcional, como máximo 128 caracteres.",
    "leadMandateId": "Un guardián del agente líder asociado a este puesto. Al publicar se fija su revisión actual.",
    "appId": "Una aplicación agéntica que ejecuta la unidad. Opcional.",
    "members": "Agentes que trabajan en esta unidad y dependen de su líder.",
    "memberAgent": "El agente miembro. No puede ocupar otro puesto en esta organización.",
    "memberTitle": "El cargo del miembro, que se muestra en el organigrama. Opcional.",
    "memberMandate": "Un guardián de este agente miembro asociado al puesto. Opcional.",
    "peerUnitIds": "Otras unidades a las que esta puede enviar mensajes directamente. Las líneas funcionan en ambos sentidos.",
    "budgetDay": "Lo máximo que pueden gastar esta unidad y las que dependen de ella en un día UTC, en dólares estadounidenses. Déjelo vacío para no fijar un límite diario.",
    "budgetMonth": "Lo máximo que pueden gastar esta unidad y las que dependen de ella en un mes UTC, en dólares estadounidenses. Déjelo vacío para no fijar un límite mensual."
   }
  },
  "diff": {
   "added": "Unidades del árbol más reciente que el anterior no tiene.",
   "removed": "Unidades del árbol anterior que el más reciente ya no tiene.",
   "changed": "Unidades presentes en ambos árboles con al menos un campo distinto."
  }
 },
 "resources": {
  "organizations": {
   "add": "Crear una nueva organización. Empieza como borrador sin unidades; su organigrama se construye en su página.",
   "name": "El nombre de la organización, único en el inquilino. Los agentes y la API pueden referirse a ella por su nombre.",
   "status": "Borrador hasta la primera publicación y después Activa; Congelada mientras la retiene una congelación, Retirada cuando una persona la retira.",
   "currentRevisionNumber": "El número de la revisión en vigor, o Sin publicar antes de la primera publicación.",
   "description": "Una breve descripción de la organización. Pase el cursor para ver el texto completo.",
   "createdUtc": "Cuándo se creó la organización. Pase el cursor para ver la hora exacta.",
   "mission": "Para qué sirve la organización. Las ejecuciones de sus miembros la ven en el resumen de su organización.",
   "id": "El ID de la organización (org_...), para la API REST, los SDK y las herramientas MCP."
  }
 },
 "views": {
  "organizationDetail": {
   "revision": "La revisión en vigor. La cadena de mando, las líneas y los presupuestos la siguen.",
   "notPublished": "Todavía no hay nada en vigor. Publique una revisión para poner en marcha la organización.",
   "live": "La página se actualiza cuando cambian la organización, sus informes y su gasto.",
   "viewJson": "Mostrar la organización tal como la devuelve la API, con su árbol de trabajo.",
   "editDetails": "Cambiar el nombre, la descripción y la misión de la organización.",
   "reactivate": "Reactivar la organización retirada. Vuelve a estar Activa si se publicó alguna vez.",
   "retire": "Retirar la organización: su cadena de mando, sus líneas y sus presupuestos dejan de aplicarse. Puede reactivarla más adelante.",
   "frozenRetire": "Una organización congelada no se puede retirar. Levante primero la congelación.",
   "publish": "Guardar una instantánea del árbol de trabajo como revisión y ponerla en vigor, o guardarla como borrador.",
   "publishEmpty": "Añada al menos la unidad raíz antes de publicar.",
   "delete": "Eliminar de forma permanente la organización con sus unidades, revisiones y la memoria de las unidades y de la organización.",
   "reviewPending": "Comparar el árbol de trabajo con la revisión en vigor, unidad por unidad.",
   "units": "Cuántas unidades tiene el árbol de trabajo.",
   "lastUpdate": "Cuándo cambió por última vez la organización o su árbol de trabajo. Pase el cursor para ver la hora exacta.",
   "tabs": {
    "chart": "El árbol de unidades con líderes, miembros, líneas entre pares, estado de salud y gasto.",
    "budgets": "El presupuesto diario y mensual de cada unidad, con lo que ha gastado su subárbol en el periodo actual.",
    "revisions": "Instantáneas del árbol, de la más reciente a la más antigua, con publicación, comparación y reversión."
   },
   "viewWorking": "Mostrar el árbol de trabajo, la versión que usted edita.",
   "viewLive": "Mostrar la revisión en vigor, la que sigue la cadena de mando.",
   "noLive": "Todavía no hay nada en vigor. Publique primero una revisión.",
   "addUnit": "Añadir una unidad al árbol de trabajo. La primera unidad es la raíz.",
   "columns": {
    "unit": "La unidad, con sangría bajo la unidad de la que depende.",
    "day": "El presupuesto diario de la unidad en dólares estadounidenses, o vacío si no tiene.",
    "month": "El presupuesto mensual de la unidad en dólares estadounidenses, o vacío si no tiene.",
    "spend": "Lo que gastaron la unidad y todas las que dependen de ella en el periodo actual, frente a cada presupuesto.",
    "number": "El número de revisión, contando desde 1.",
    "state": "Borrador, Publicada (en vigor) o Sustituida (estuvo en vigor y luego se reemplazó).",
    "note": "Por qué se hizo la revisión, tal como la escribió su autor.",
    "author": "La persona o el agente que hizo la revisión.",
    "created": "Cuándo se hizo la revisión. Pase el cursor para ver la hora exacta.",
    "published": "Cuándo entró en vigor la revisión, si llegó a hacerlo."
   },
   "current": "Esta revisión está en vigor ahora.",
   "compare": "Comparar esta revisión con la que está en vigor, unidad por unidad.",
   "publishRevision": "Poner en vigor esta revisión en borrador.",
   "rollback": "Poner de nuevo en vigor esta revisión anterior. La reversión queda registrada como una nueva revisión.",
   "saveDraft": "Guardar una instantánea del árbol de trabajo como revisión en borrador sin ponerla en vigor.",
   "publishNow": "Guardar una instantánea del árbol de trabajo y ponerla en vigor ahora.",
   "note": "Por qué hace este cambio. Opcional, como máximo 2000 caracteres; se muestra en la lista de revisiones.",
   "removeUnit": "Quitar la unidad del árbol de trabajo."
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
  "title": "Organizaciones",
  "p1": "Una organización es un árbol de unidades. Cada unidad tiene un agente líder, miembros con cargos y guardianes, y líneas entre pares hacia las unidades a las que puede enviar mensajes directamente. El responsable de cada líder es el líder de la unidad superior, y por encima de la raíz hay una persona que actúa como consejo.",
  "p2": "Usted edita el árbol de trabajo. Nada entra en vigor hasta que publica una revisión: a partir de entonces la cadena de mando, las líneas de mensajes, los destinatarios de los informes, los ámbitos de memoria y los presupuestos la siguen. Se conservan todas las revisiones, así que puede comparar cualquiera con el árbol en vigor o revertir a ella.",
  "p3": "Un presupuesto limita lo que pueden gastar una unidad y todas las que dependen de ella en un día o un mes UTC. Cuando se agota un presupuesto, se rechazan las nuevas ejecuciones de los agentes de ese subárbol y se avisa al responsable de la unidad."
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
    "apps": "Mostrar las aplicaciones del borrador: los agentes y las llamadas entre ellos.",
    "organizations": "Mostrar las organizaciones del borrador: unidades anidadas dentro de la unidad de la que dependen, con líderes, miembros y líneas entre pares."
   },
   "org": {
    "unit": "Una unidad de la organización. Selecciónela para editar sus miembros y sus líneas entre pares; contiene las unidades que dependen de ella.",
    "unitReadOnly": "Una unidad de la organización. La edición está desactivada para este borrador.",
    "picker": "Qué organización del borrador muestra el lienzo.",
    "addUnit": "El nombre de la nueva unidad, único en la organización. Pulse Intro para añadirla.",
    "parent": "La unidad de la que depende la nueva unidad. Sin unidad superior se convierte en la raíz, y una organización solo tiene una.",
    "leadAgent": "El agente que lidera la nueva unidad. Opcional; un agente lidera como máximo una unidad por organización.",
    "leadTitle": "El cargo del líder, por ejemplo Jefe de facturación. Opcional.",
    "organization": "La organización a la que se añade la unidad. Déjelo vacío para la que se muestra, o escriba un nombre nuevo para empezar una organización nueva.",
    "add": "Añadir ahora la unidad a la organización del borrador. Nada entra en vigor hasta que se aplique el borrador.",
    "connectTo": "La unidad en el otro extremo de la línea entre pares.",
    "connectConfirm": "Añadir ahora la línea entre pares entre las dos unidades.",
    "peers": "Unidades que pueden enviarse mensajes directamente, sin pasar por un superior común.",
    "peerLine": "Una línea entre pares entre dos unidades. Intro la selecciona; Supr la quita.",
    "orgTitle": "La organización que se muestra en el lienzo.",
    "units": "Cuántas unidades tiene la organización en este borrador.",
    "root": "La unidad en la cima de la organización, liderada por el agente ante el que responden en última instancia todos los demás.",
    "unitTitle": "La unidad seleccionada.",
    "reportsTo": "La unidad de la que depende esta; su líder es el superior del líder de esta unidad.",
    "lead": "El agente que lidera esta unidad.",
    "members": "Agentes que trabajan en esta unidad y responden ante su líder.",
    "removeMember": "Quitar ahora este agente de la unidad.",
    "memberAgent": "El agente que se añade como miembro. No puede ocupar otro puesto en esta organización.",
    "memberTitle": "El cargo del miembro, que se muestra en el organigrama. Opcional.",
    "addMember": "Añadir ahora el agente a la unidad {{unit}}.",
    "disconnect": "Quitar ahora esta línea entre pares.",
    "addChild": "Rellenar el formulario Añadir unidad con esta unidad como unidad superior.",
    "startPeer": "Empezar una línea entre pares desde esta unidad y después elegir la otra unidad.",
    "removeUnit": "Quitar la unidad de la organización del borrador, tras una confirmación. No se puede quitar una unidad que tiene unidades dependientes.",
    "peerTitle": "La línea entre pares seleccionada."
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
   "changeRules": "Reglas de cambio: lo que los agentes directivos pueden cambiar en sus subárboles sin preguntar antes a una persona."
  }
 },
 "enums": {
  "resourceType": {
   "ChangeRule": "Reglas de cambio que aprueban de antemano los cambios rutinarios de los agentes directivos. Read permite verlas; Create, Update y Delete permiten modificarlas. Los agentes nunca pueden escribirlas."
  },
  "notificationEvent": {
   "OrgProposalApplied": "Se aplicó a una organización una propuesta de un agente directivo, por una regla de cambio o por una persona."
  },
  "managementAccess": {
   "None": "Las ejecuciones de este despliegue no pueden redactar ni proponer cambios de configuración. Lo adecuado para la mayoría de los agentes.",
   "Drafts": "Las ejecuciones pueden redactar cambios de Estudio para la persona que las inició. Cada borrador lo aplica siempre una persona.",
   "OrgSubtree": "Autoridad directiva sobre las unidades que dependen de la que dirige este agente: sus ejecuciones pueden proponer cambios en ellas. Las reglas de cambio pueden aplicar en el acto los rutinarios; el resto espera a una persona. Nunca sobre sí mismo, nada por encima de él, secretos, presupuestos ni reglas."
  },
  "changeClass": {
   "PromptRetune": "Ediciones de los prompts e instrucciones de los agentes del subárbol.",
   "WakeTuning": "Cambios en la frecuencia con la que despierta un guardián: su intervalo, espaciado y jitter.",
   "MandateTextEdit": "Ediciones del texto del objetivo de los guardianes del subárbol.",
   "AddWorker": "Añadir un agente a una unidad como miembro.",
   "RemoveWorker": "Quitar un agente miembro de una unidad.",
   "ModelChange": "Cambiar el modelo que ejecuta un despliegue del subárbol.",
   "DeploymentWeight": "Cambiar cuánto tráfico recibe un despliegue entre los despliegues de su agente."
  }
 },
 "filters": {
  "organization": "Mostrar solo las reglas de cambio de esta organización.",
  "activeOnly": "Mostrar solo las reglas activadas que no han caducado."
 },
 "changeRules": {
  "actions": {
   "openOrganization": "Abrir la organización de la regla, donde la pestaña Propuestas muestra lo que aplicaron las reglas.",
   "copyId": "Copiar el ID de la regla de cambio (cru_...) para la API REST, los SDK o las herramientas MCP."
  },
  "status": {
   "Active": "La regla está activada y no ha caducado, así que las propuestas que cubre se aplican en el acto.",
   "Inactive": "Una persona desactivó la regla. No se aplica a nada hasta que se vuelva a activar.",
   "Expired": "Pasó la fecha de caducidad, así que la regla no se aplica a nada. Edítela para fijar una nueva caducidad."
  }
 },
 "orgProposals": {
  "deniedDecide": "No puede decidir sobre propuestas. Necesita Update sobre Approval.",
  "rulesLink": "Abrir las reglas de cambio de esta organización: lo que los agentes directivos pueden cambiar sin preguntar.",
  "decide": "Abrir la propuesta para ver sus cambios y aprobarla o denegarla.",
  "views": {
   "all": "Todas las propuestas de esta organización, empezando por el cambio más reciente.",
   "needsApproval": "Propuestas que esperan a que una persona las apruebe o deniegue.",
   "applied": "Propuestas en vigor, aplicadas por regla o aprobadas por una persona."
  },
  "columns": {
   "title": "El nombre que el agente directivo dio a la propuesta.",
   "unit": "La unidad que dirige el agente directivo. Sus propuestas solo afectan a las unidades que dependen de ella.",
   "agent": "El agente que dirige la unidad y que hizo la propuesta.",
   "decision": "Aplicada por regla, aprobada, pendiente de aprobación, denegada o aún en redacción.",
   "updated": "Cuándo cambió la propuesta por última vez. Pase el puntero por encima para ver la hora exacta."
  },
  "decision": {
   "rule": "Las reglas de cambio cubrían todos los cambios, así que se aplicó en el acto sin una persona.",
   "approved": "Una persona la aprobó y se aplicó como una nueva revisión de la organización.",
   "needsApproval": "Al menos un cambio no está cubierto por una regla, así que espera a una persona.",
   "denied": "Una persona la denegó y volvió al agente directivo para que la rehaga.",
   "lapsed": "Su aprobación caducó o se canceló antes de que nadie decidiera.",
   "drafting": "El agente directivo sigue trabajando en ella y aún no ha pedido aplicarla."
  },
  "review": {
   "open": "Abrir la propuesta para ver sus cambios, las reglas que los cubren y cómo se decidió.",
   "run": "La ejecución del agente directivo que hizo esta propuesta.",
   "openRun": "Abrir la ejecución que hizo esta propuesta.",
   "approve": "Aplicar la propuesta ahora. Se registra como una nueva revisión de la organización, que puede revertir.",
   "deny": "Devolver la propuesta al agente directivo sin aplicarla. Su motivo se envía con ella.",
   "coveredBy": "Esta regla de cambio permite el cambio, dentro de sus límites.",
   "reason": "Por qué aprueba o deniega. Opcional; lo ven el agente directivo y el registro de auditoría.",
   "columns": {
    "item": "El recurso al que afecta el cambio, con los campos que cambian.",
    "change": "Si el cambio crea, actualiza o elimina el recurso.",
    "rule": "La regla de cambio que cubre el cambio, o por qué necesita a una persona."
   }
  }
 },
 "resources": {
  "deployments": {
   "managementAccess": "Lo que pueden gestionar las ejecuciones de este despliegue. Ninguno para la mayoría de los agentes; Borradores de Estudio para el arquitecto de agentes; Dirección de su subárbol para un agente que dirige una unidad organizativa y debe proponer cambios en las unidades que dependen de ella."
  },
  "changeRules": {
   "add": "Añadir una regla que permite a los agentes directivos aplicar un tipo de cambio rutinario sin esperar a una persona.",
   "name": "Un nombre corto para la regla. Las propuestas que se aplican por regla la nombran.",
   "status": "En vigor, desactivada o caducada. Solo las reglas en vigor aplican propuestas.",
   "organization": "La organización a cuyos agentes directivos se aplica la regla.",
   "unit": "La unidad cuyo subárbol cubre la regla: los cambios en ella y en todas las unidades que dependen de ella.",
   "classes": "Las clases de cambio que permite la regla.",
   "limits": "Límites de los cambios permitidos: cuántos por propuesta y qué valores pueden fijar.",
   "expiresUtc": "Cuándo deja de aplicarse la regla, o Nunca.",
   "createdByName": "La persona que escribió la regla.",
   "description": "Por qué existe la regla, con palabras sencillas. Pase el puntero por encima para ver el texto completo.",
   "createdUtc": "Cuándo se creó la regla. Pase el puntero por encima para ver la hora exacta.",
   "id": "El ID de la regla de cambio (cru_...), para la API REST, los SDK y las herramientas MCP.",
   "organizationId": "La organización a la que se aplica la regla. No se puede cambiar después.",
   "unitId": "La regla cubre los cambios en esta unidad y en todas las unidades que dependen de ella en el organigrama en vigor.",
   "active": "Desactive la regla para que deje de aplicarse sin eliminarla.",
   "limitClass": "La clase de cambio que acota este límite. Debe ser una de las clases que permite la regla.",
   "limitName": "Lo que acota el límite: cambios por propuesta para cualquier clase, valores del despertar para Ajuste del despertar, o peso del tráfico para Peso del despliegue.",
   "minimum": "El valor más pequeño permitido, o vacío para no fijar límite inferior. Cero o más.",
   "maximum": "El valor más grande permitido, o vacío para no fijar límite superior. Cero o más."
  }
 },
 "views": {
  "organizationDetail": {
   "tabs": {
    "proposals": "Cambios que propusieron los agentes directivos de esta organización, con cómo se decidió cada uno."
   },
   "appliedProposal": "Esta revisión registra una propuesta aplicada de un agente directivo. Reviértala para deshacer la propuesta."
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
  "title": "Reglas de cambio",
  "p1": "Un agente directivo es un agente que dirige una unidad organizativa y cuyo despliegue tiene acceso de gestión de dirección. Puede proponer cambios en las unidades que dependen de él, nunca en sí mismo, en nada por encima de él, en secretos, en presupuestos ni en estas reglas.",
  "p2": "Una regla de cambio aprueba de antemano los cambios rutinarios. Indica la unidad cuyo subárbol cubre, las clases de cambio que permite y límites opcionales, como un máximo de dos cambios por propuesta o un intervalo de despertar de al menos un minuto. Cuando las reglas cubren todos los cambios de una propuesta, se aplica en el acto; lo demás espera a una persona en la pestaña Propuestas de la organización.",
  "p3": "Cada propuesta aplicada queda registrada como una revisión de la organización, así que puede revertirla. Solo las personas escriben reglas."
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
   "evaluations": "Conjuntos de evaluación: casos versionados que califican a un agente, aprobados por una persona antes de condicionar una promoción.",
   "evalRuns": "Ejecuciones de evaluación: cada ejecución de un conjunto de evaluación contra un despliegue o una revisión de agente, seguida caso por caso.",
   "shadowTrials": "Pruebas en sombra: un despliegue candidato responde a copias de entradas reales sin actuar, y se comparan las salidas.",
   "canaryReleases": "Lanzamientos canario: un despliegue candidato recibe más tráfico paso a paso y se revierte por sí solo cuando se comporta mal."
  }
 },
 "enums": {
  "resourceType": {
   "EvalSet": "Conjuntos de evaluación y sus casos. Read permite verlos; Create y Update permiten escribirlos; solo las personas los aprueban.",
   "EvalRun": "Ejecuciones de evaluación de un conjunto contra un despliegue o una revisión. Execute permite iniciarlas y cancelarlas.",
   "ShadowTrial": "Pruebas en sombra que copian las entradas de un despliegue a un candidato. Create inicia una; Update la detiene.",
   "CanaryRelease": "Lanzamientos canario que desplazan el tráfico de un agente por pasos. Create inicia uno; Update lo interrumpe."
  },
  "notificationEvent": {
   "CanaryRolledBack": "Un lanzamiento canario se revirtió porque la tasa de errores o la puntuación de evaluación del candidato quedó fuera de sus límites."
  },
  "runKind": {
   "Eval": "Un caso de una ejecución de evaluación: la entrada del caso enviada al despliegue o a la revisión que se califica.",
   "Shadow": "Una copia de una entrada real repetida en el candidato de una prueba en sombra. No puede actuar sobre nada."
  },
  "evalSetState": {
   "Draft": "Todavía se está escribiendo. Los casos pueden cambiar, y el conjunto aún no puede condicionar una promoción.",
   "Approved": "Una persona aprobó esta versión. Se conserva tal cual y puede condicionar promociones y lanzamientos canario."
  },
  "evalSetOrigin": {
   "Human": "Una persona escribió este conjunto en el panel o mediante la API.",
   "Evaluator": "Un agente escribió este conjunto. Solo sirve de requisito cuando viene de fuera del subárbol del agente que se califica.",
   "Playground": "El conjunto nació de turnos guardados desde la zona de pruebas del estudio."
  },
  "evalScorer": {
   "ExactMatch": "La salida debe ser exactamente igual al texto, sin contar los espacios de alrededor.",
   "Contains": "La salida debe contener el texto en alguna parte.",
   "JsonSchemaValid": "La salida debe ser JSON que cumpla el JSON Schema.",
   "Judge": "El agente juez del conjunto lee la entrada, la respuesta de referencia y la salida, y la califica."
  },
  "evalRunStatus": {
   "Pending": "Esperando para empezar su primer caso.",
   "Running": "Los casos se están ejecutando ahora; la página los sigue a medida que terminan.",
   "Completed": "Todos los casos terminaron y la ejecución tiene una puntuación.",
   "Failed": "La ejecución se detuvo antes de tiempo, por ejemplo cuando se agotó su presupuesto. El motivo aparece en la ejecución.",
   "Cancelled": "Una persona canceló la ejecución antes de que terminaran todos los casos."
  },
  "evalRunTarget": {
   "AgentRevision": "Una revisión de agente se ejecuta en un despliegue temporal, así que no se toca el tráfico en vivo.",
   "Deployment": "Un despliegue ejecuta los casos con su configuración actual."
  },
  "evalRunInputMode": {
   "Cases": "Los casos propios del conjunto con sus comprobaciones.",
   "RecentInputs": "Las entradas correctas más recientes del despliegue, calificadas por el agente juez."
  },
  "shadowTrialStatus": {
   "Running": "Las ejecuciones del origen se están copiando ahora al candidato.",
   "Completed": "La prueba llegó a su hora de finalización.",
   "Stopped": "Una persona detuvo la prueba.",
   "Failed": "La prueba no pudo continuar. El motivo aparece en la prueba."
  },
  "canaryStatus": {
   "Running": "El candidato está en uno de los pasos y recibe parte del tráfico.",
   "Promoted": "Todos los pasos se superaron, y el candidato recibe todo el tráfico.",
   "RolledBack": "El candidato quedó fuera de sus límites, y los pesos volvieron a donde estaban.",
   "Aborted": "Una persona interrumpió el lanzamiento, y los pesos volvieron a donde estaban."
  }
 },
 "filters": {
  "state": "Mostrar solo los registros en este estado, como borrador o aprobado.",
  "latestOnly": "Mostrar solo la versión más reciente de cada conjunto de evaluación, o todas las versiones.",
  "set": "Mostrar solo las ejecuciones de esta versión del conjunto de evaluación."
 },
 "evals": {
  "reason": "Por qué lo detienes. Opcional; se guarda con el registro y en el registro de auditoría.",
  "verdict": {
   "passed": "La puntuación ponderada alcanzó el umbral.",
   "failed": "La puntuación ponderada se quedó por debajo del umbral.",
   "none": "La ejecución sigue en curso, o no tiene un umbral que superar."
  },
  "outcome": {
   "passed": "La puntuación ponderada del caso se superó.",
   "failed": "El caso se ejecutó, pero sus comprobaciones no se superaron.",
   "errored": "La ejecución del caso falló, así que el caso puntuó cero."
  },
  "actions": {
   "runSet": "Ejecutar un conjunto de evaluación contra un despliegue o una revisión de agente.",
   "openSet": "Abrir la versión del conjunto de evaluación con la que calificó esta ejecución.",
   "cancelRun": "Detener la ejecución y cancelar los casos que no han terminado.",
   "stopTrial": "Dejar de copiar ejecuciones al candidato. Los recuentos hasta ahora se conservan.",
   "abortCanary": "Detener el lanzamiento y devolver los dos despliegues a los pesos que tenían antes.",
   "copyId": "Copiar el ID para la API REST, los SDKs o las herramientas MCP."
  },
  "case": {
   "name": "Un nombre corto para el caso, que se muestra en los resultados de la ejecución.",
   "inputText": "Lo que recibe el agente como entrada cuando se ejecuta el caso.",
   "expectedText": "La respuesta de referencia. Las comprobaciones sin texto propio se comparan con ella.",
   "hidden": "Ocultar la entrada y la salida esperada a los agentes calificados. Sus ejecuciones solo ven la puntuación.",
   "checks": "Cómo se puntúa la salida. Cada comprobación puntúa de 0 a 1, y la puntuación del caso es su media ponderada.",
   "scorer": "Cómo puntúa la salida esta comprobación.",
   "weight": "Cuánto cuenta esta comprobación en la puntuación del caso, de 0 a 100. Cero muestra la comprobación sin contarla.",
   "argument": {
    "ExactMatch": "El texto exacto al que debe ser igual la salida. Vacío usa la salida esperada del caso.",
    "Contains": "El texto que debe contener la salida. Vacío usa la salida esperada del caso.",
    "JsonSchemaValid": "El JSON Schema que debe cumplir la salida.",
    "Judge": "Lo que busca el juez, en palabras sencillas. Opcional; el juez también lee la salida esperada."
   },
   "addCheck": "Añadir otra forma de puntuar la salida.",
   "removeCheck": "Quitar esta comprobación del caso.",
   "save": "Guardar el caso en esta versión en borrador.",
   "saveNextVersion": "Guardar el caso. La versión aprobada se queda como está, y el cambio va a la siguiente versión."
  },
  "run": {
   "setId": "La versión del conjunto de evaluación que ejecutar.",
   "targetType": "Calificar un despliegue tal como funciona ahora, o una revisión de agente en un despliegue temporal.",
   "deploymentId": "El despliegue cuyas respuestas se califican.",
   "agentId": "El agente cuya revisión se califica.",
   "agentRevisionId": "Un ID de revisión concreto. Vacío usa la revisión en borrador del agente.",
   "inputMode": "Ejecutar los casos del conjunto, o repetir las entradas recientes del despliegue para que las califique el juez.",
   "recentInputCount": "Cuántas de las últimas entradas correctas del despliegue repetir.",
   "thresholdPercent": "La puntuación que debe alcanzar la ejecución para superarse. Vacío deja la ejecución sin veredicto.",
   "budgetUsd": "Lo máximo que pueden gastar juntas las ejecuciones de casos y del juez. Vacío significa sin presupuesto.",
   "start": "Iniciar la ejecución de evaluación y abrir su página."
  },
  "save": {
   "open": "Guardar la entrada y la respuesta de este turno como caso de un conjunto de evaluación.",
   "set": "El conjunto de evaluación al que va el caso. Un caso añadido a una versión aprobada va a su siguiente versión.",
   "newSetName": "El nombre del nuevo conjunto de evaluación. Se mantiene en todas las versiones.",
   "submit": "Guardar el caso con la ejecución de la zona de pruebas como origen.",
   "done": "Cerrar y seguir en la zona de pruebas.",
   "openSet": "Abrir el conjunto de evaluación con sus casos.",
   "runSet": "Abrir el conjunto y ejecutarlo contra la revisión en borrador que ejecutó la zona de pruebas."
  },
  "setDetail": {
   "back": "Volver a la lista de conjuntos de evaluación.",
   "viewJson": "Ver esta versión y sus casos tal como los devuelve la API.",
   "edit": "Cambiar la descripción, el agente juez y las etiquetas.",
   "editApproved": "Editar el conjunto. La versión aprobada se queda como está, y el cambio crea la siguiente versión.",
   "delete": "Eliminar esta versión en borrador. Las versiones aprobadas se conservan.",
   "approve": "Aprobar esta versión para que pueda condicionar promociones y lanzamientos canario. Solo las personas aprueban.",
   "approveEmpty": "Añade un caso primero. Un conjunto vacío no se puede aprobar.",
   "runEmpty": "Añade un caso primero. Un conjunto vacío no tiene nada que ejecutar.",
   "cases": "Los casos de esta versión en el orden en que se ejecutan.",
   "addCase": "Añadir un caso al final de este borrador.",
   "addCaseApproved": "Añadir un caso. Va a la siguiente versión, un borrador nuevo, y esta versión se queda como está.",
   "editCase": "Cambiar la entrada, la salida esperada o las comprobaciones de este caso.",
   "editCaseApproved": "Editar este caso. El cambio va a la siguiente versión, un borrador nuevo.",
   "removeCase": "Quitar el caso del borrador.",
   "openSourceRun": "Abrir la ejecución desde la que se guardó el caso.",
   "versions": "Todas las versiones de este conjunto, de la más reciente a la más antigua.",
   "openVersion": "Abrir esta versión del conjunto.",
   "runs": "Las últimas ejecuciones de evaluación de esta versión.",
   "allRuns": "Abrir la lista de ejecuciones de evaluación filtrada por esta versión.",
   "openRun": "Abrir la ejecución de evaluación con los resultados de sus casos.",
   "fields": {
    "state": "Borrador mientras se escribe; Aprobado cuando una persona lo aprueba.",
    "origin": "Quién o qué escribió el conjunto: una persona, un agente o la zona de pruebas del estudio.",
    "judgeAgent": "El agente que califica las comprobaciones de juez, los casos sin salida esperada y las entradas recientes.",
    "tags": "Etiquetas para encontrar el conjunto.",
    "authoredBy": "La persona o el agente que escribió esta versión.",
    "approvedBy": "La persona que aprobó esta versión, y cuándo.",
    "previousVersion": "La versión a partir de la que se creó esta.",
    "lastUpdateUtc": "Cuándo cambió esta versión por última vez. Pasa el cursor para ver hace cuánto.",
    "description": "Qué comprueba el conjunto, en palabras sencillas."
   },
   "columns": {
    "order": "El orden en que se ejecutan los casos.",
    "name": "El nombre del caso.",
    "input": "Lo que recibe el agente. Pasa el cursor para ver el texto completo.",
    "expected": "La respuesta de referencia. Pasa el cursor para ver el texto completo.",
    "scorers": "Las comprobaciones que puntúan el caso, o la predeterminada cuando no tiene ninguna.",
    "hidden": "Los casos ocultos solo muestran su puntuación a los agentes calificados.",
    "source": "La ejecución desde la que se guardó este caso, cuando viene de la zona de pruebas."
   },
   "versionColumns": {
    "version": "El número de versión.",
    "state": "Borrador o aprobado.",
    "caseCount": "Cuántos casos tiene la versión.",
    "approvedBy": "La persona que aprobó la versión.",
    "lastUpdateUtc": "Cuándo cambió la versión por última vez."
   },
   "runColumns": {
    "run": "El ID de la ejecución de evaluación. Ábrela para ver los resultados de los casos.",
    "status": "En qué punto está la ejecución.",
    "verdict": "Si la puntuación alcanzó el umbral.",
    "score": "La puntuación ponderada, de 0 a 100 por ciento.",
    "target": "El despliegue o la revisión de agente que se calificó.",
    "createdUtc": "Cuándo empezó la ejecución."
   }
  },
  "runDetail": {
   "back": "Volver a la lista de ejecuciones de evaluación.",
   "viewJson": "Ver la ejecución tal como la devuelve la API.",
   "live": "Las actualizaciones llegan por el canal en vivo a medida que termina cada caso.",
   "polling": "El canal en vivo no está conectado, así que la página busca actualizaciones cada pocos segundos.",
   "progress": "Casos terminados hasta ahora, del total de casos de la ejecución.",
   "results": "Una fila por caso, en orden. Las filas no superadas y con error aparecen resaltadas.",
   "failingOnly": "Mostrar solo los casos que no se superaron o tuvieron un error.",
   "open": "Abrir el caso con su salida esperada, su salida y todas las comprobaciones.",
   "openAgent": "Abrir el agente que se calificó.",
   "openDraft": "Abrir el borrador del estudio cuya revisión se calificó.",
   "openCaseRun": "Abrir la ejecución que respondió a este caso.",
   "openSourceRun": "Abrir la ejecución de la que vino el caso o la entrada reciente.",
   "openJudgeRun": "Abrir la ejecución del agente juez que calificó esta comprobación.",
   "input": "Lo que recibió el agente.",
   "diff": "Las líneas que solo están en la salida esperada se marcan con un menos; las que solo están en la salida del agente, con un más.",
   "output": "Lo que respondió el agente.",
   "checks": "Cada comprobación con su calificador, su peso, su puntuación y la nota del calificador.",
   "kpi": {
    "score": "La media ponderada de las puntuaciones de los casos, frente al umbral para superarse.",
    "passed": "Casos cuyas comprobaciones se superaron, del total de casos.",
    "errored": "Casos cuya ejecución falló. Puntúan cero.",
    "cost": "Lo que gastaron las ejecuciones de casos y del juez, frente al presupuesto."
   },
   "fields": {
    "target": "El despliegue, o el agente y la revisión, que se calificó.",
    "targetType": "Si se calificó un despliegue o una revisión de agente.",
    "inputMode": "Los casos del conjunto, o las entradas recientes de un despliegue.",
    "startedBy": "La persona, la credencial o el agente que inició la ejecución.",
    "createdUtc": "Cuándo se inició la ejecución.",
    "completedUtc": "Cuándo terminó el último caso.",
    "studioDraftId": "El borrador del estudio para el que un ejecutivo lanzó esta evaluación."
   },
   "columns": {
    "order": "El orden en que se ejecutó el caso.",
    "case": "El nombre del caso, o su número.",
    "outcome": "Superado, no superado o con error.",
    "score": "La puntuación ponderada del caso, de 0 a 100 por ciento.",
    "checks": "Cuántas comprobaciones del caso se superaron.",
    "output": "El comienzo de la respuesta del agente, o el error. Pasa el cursor para ver más.",
    "open": "Abre un caso para ver las diferencias y las notas del calificador."
   },
   "checkColumns": {
    "scorer": "Cómo puntuó la salida esta comprobación.",
    "weight": "Cuánto cuenta la comprobación en la puntuación del caso.",
    "score": "La puntuación de esta comprobación, de 0 a 100 por ciento.",
    "outcome": "Si esta comprobación se superó.",
    "note": "Lo que dijo el calificador sobre la salida, como el razonamiento del juez.",
    "judgeRun": "La ejecución del agente juez para esta comprobación, cuando la calificó un juez."
   }
  },
  "shadowDetail": {
   "back": "Volver a la lista de pruebas en sombra.",
   "viewJson": "Ver la prueba tal como la devuelve la API.",
   "kpi": {
    "compared": "Ejecuciones copiadas cuya salida del candidato se comparó con la del origen.",
    "agreed": "Comparaciones en las que la salida del candidato coincidió con la del origen.",
    "diverged": "Comparaciones en las que la salida del candidato fue distinta de la del origen.",
    "failures": "Ejecuciones copiadas que fallaron en el candidato.",
    "agreement": "Comparaciones coincidentes sobre el total de comparaciones."
   },
   "fields": {
    "source": "El despliegue cuyas ejecuciones correctas se copian. No se ve afectado.",
    "candidate": "El despliegue que repite las copias como ejecuciones en sombra.",
    "samplePercent": "La parte de las ejecuciones del origen que se copia.",
    "comparison": "Cómo se comparan las dos salidas.",
    "endsUtc": "Cuándo termina la prueba por sí sola.",
    "createdBy": "Quién inició la prueba.",
    "createdUtc": "Cuándo empezó la prueba.",
    "completedUtc": "Cuándo terminó la prueba."
   }
  },
  "canaryDetail": {
   "back": "Volver a la lista de lanzamientos canario.",
   "viewJson": "Ver el lanzamiento tal como lo devuelve la API.",
   "openAgent": "Abrir el agente cuyo tráfico desplaza el lanzamiento.",
   "steps": "Los pasos del lanzamiento en orden, con el paso en el que está el candidato.",
   "columns": {
    "step": "El número de paso.",
    "weightPercent": "La parte del tráfico del agente que recibe el candidato durante el paso.",
    "minimumRuns": "Ejecuciones del candidato que deben terminar antes de que el paso pueda avanzar.",
    "minimumMinutes": "Minutos que debe durar el paso antes de poder avanzar.",
    "state": "Hecho, el paso actual, el paso en el que se detuvo o aún por llegar."
   },
   "stepStates": {
    "done": "El paso se superó y el lanzamiento siguió adelante.",
    "current": "El candidato está ahora en este paso.",
    "stopped": "El lanzamiento terminó en este paso.",
    "pending": "El lanzamiento aún no ha llegado a este paso."
   },
   "fields": {
    "agent": "El agente cuyo tráfico se desplaza entre los dos despliegues.",
    "candidate": "El despliegue que se lanza, con su peso de antes del lanzamiento.",
    "baseline": "El despliegue que se queda con el resto del tráfico, con su peso de antes.",
    "maxErrorRatePercent": "Si en un paso fallan más ejecuciones del candidato que esto, el lanzamiento se revierte.",
    "gate": "Si se define, un paso solo avanza mientras la última puntuación de evaluación se mantenga en el mínimo o por encima.",
    "stepStartedUtc": "Cuándo empezó el paso actual.",
    "createdBy": "Quién inició el lanzamiento.",
    "completedUtc": "Cuándo terminó el lanzamiento."
   }
  },
  "filters": {
   "state": "Mostrar solo las versiones en borrador o solo las aprobadas.",
   "origin": "Mostrar solo los conjuntos escritos por personas, por agentes o guardados desde la zona de pruebas."
  }
 },
 "resources": {
  "evalSets": {
   "add": "Crear la versión 1 de un nuevo conjunto de evaluación. Añade sus casos en la página del conjunto.",
   "name": "El nombre del conjunto. Se mantiene en todas las versiones.",
   "version": "El número de versión. Editar una versión aprobada crea la siguiente.",
   "state": "Borrador o aprobado. Solo las versiones aprobadas pueden condicionar promociones.",
   "origin": "Escrito por una persona, por un agente o guardado desde la zona de pruebas.",
   "caseCount": "Cuántos casos tiene esta versión.",
   "judgeAgent": "El agente que califica las comprobaciones de juez y los casos sin salida esperada.",
   "tags": "Etiquetas para encontrar el conjunto.",
   "authoredByName": "La persona o el agente que escribió esta versión.",
   "approvedByName": "La persona que aprobó esta versión. Pasa el cursor para ver cuándo.",
   "description": "Qué comprueba el conjunto. Pasa el cursor para ver el texto completo.",
   "lastUpdateUtc": "Cuándo cambió esta versión por última vez. Pasa el cursor para ver la hora exacta.",
   "id": "El ID de la versión del conjunto de evaluación (evs_...), para la API REST, los SDKs y las herramientas MCP."
  },
  "evalRuns": {
   "setName": "El conjunto de evaluación y la versión que se ejecutaron.",
   "status": "En qué punto está la ejecución: pendiente, en ejecución, completada, fallida o cancelada.",
   "verdict": "Si la puntuación alcanzó el umbral.",
   "score": "La media ponderada de las puntuaciones de los casos.",
   "threshold": "La puntuación que debía alcanzar la ejecución para superarse.",
   "progress": "Casos terminados y superados, del total de casos.",
   "target": "El despliegue o la revisión de agente que se calificó.",
   "inputMode": "Los casos del conjunto, o las entradas recientes de un despliegue.",
   "costUsd": "Lo que gastaron las ejecuciones de casos y del juez.",
   "startedByName": "La persona, la credencial o el agente que inició la ejecución.",
   "createdUtc": "Cuándo empezó la ejecución. Pasa el cursor para ver la hora exacta.",
   "id": "El ID de la ejecución de evaluación (evr_...), para la API REST, los SDKs y las herramientas MCP."
  },
  "shadowTrials": {
   "add": "Empezar a copiar una parte de las ejecuciones de un despliegue a un despliegue candidato del mismo agente.",
   "name": "Un nombre corto para la prueba.",
   "status": "En ejecución, completada, detenida o fallida.",
   "source": "El despliegue cuyas ejecuciones se copian.",
   "candidate": "El despliegue que repite las copias.",
   "samplePercent": "La parte de las ejecuciones del origen que se copia.",
   "comparedCount": "Copias cuyas salidas se compararon.",
   "agreedCount": "Comparaciones en las que las salidas coincidieron.",
   "divergedCount": "Comparaciones en las que las salidas fueron distintas.",
   "candidateFailureCount": "Copias que fallaron en el candidato.",
   "agreement": "Comparaciones coincidentes sobre el total de comparaciones.",
   "endsUtc": "Cuándo termina la prueba por sí sola, o Hasta que se detenga.",
   "createdUtc": "Cuándo empezó la prueba. Pasa el cursor para ver la hora exacta.",
   "id": "El ID de la prueba en sombra (shd_...), para la API REST, los SDKs y las herramientas MCP.",
   "sourceDeploymentId": "El despliegue cuyas ejecuciones correctas se copian. Sus propias ejecuciones no se ven afectadas.",
   "candidateDeploymentId": "Otro despliegue del mismo agente que responde a las copias sin actuar.",
   "comparisonEvalSetId": "Un conjunto de evaluación cuyas comprobaciones comparan las salidas. Vacío compara el texto normalizado.",
   "useJudge": "Preguntar al agente juez si la respuesta del candidato coincide con la del origen."
  },
  "canaryReleases": {
   "add": "Empezar a llevar el tráfico de un agente a un despliegue candidato por pasos.",
   "agent": "El agente cuyo tráfico pasa de un despliegue a otro.",
   "status": "En ejecución, promovido, revertido o interrumpido.",
   "candidate": "El despliegue que se lanza.",
   "baseline": "El despliegue que se queda con el resto del tráfico.",
   "step": "El paso en el que está el lanzamiento y la parte del tráfico del candidato.",
   "maxErrorRatePercent": "La tasa de errores del candidato que revierte el lanzamiento.",
   "gate": "El conjunto de evaluación y la puntuación mínima que necesita un paso para avanzar, si los hay.",
   "rollbackReason": "Por qué se revirtió o se interrumpió el lanzamiento. Pasa el cursor para ver el texto completo.",
   "createdUtc": "Cuándo empezó el lanzamiento. Pasa el cursor para ver la hora exacta.",
   "id": "El ID del lanzamiento canario (cnr_...), para la API REST, los SDKs y las herramientas MCP.",
   "agentId": "El agente cuyos dos despliegues se reparten el tráfico.",
   "baselineDeploymentId": "El despliegue que atiende el tráfico que no recibe el candidato.",
   "candidateDeploymentId": "El despliegue que recibe más tráfico en cada paso.",
   "steps": "Las partes del tráfico por las que pasa el candidato, cada una con un mínimo de ejecuciones y de minutos.",
   "weightPercent": "La parte del tráfico del candidato durante este paso, de 1 a 100.",
   "minimumRuns": "Ejecuciones del candidato que deben terminar durante el paso antes de que pueda avanzar.",
   "minimumMinutes": "Minutos que debe durar el paso antes de poder avanzar.",
   "evalSetId": "Un conjunto de evaluación cuya última ejecución debe alcanzar la puntuación mínima para que un paso avance.",
   "minEvalScorePercent": "La puntuación de evaluación más baja, en porcentaje, que permite avanzar a un paso."
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
  "title": "Conjuntos de evaluación",
  "p1": "Un conjunto de evaluación es una lista de casos: una entrada, la respuesta que esperas y comprobaciones que puntúan la salida del agente de 0 a 1. Un caso puede estar oculto para que los agentes calificados solo vean su puntuación.",
  "p2": "Los conjuntos tienen versiones. Una persona aprueba una versión en borrador, y una versión aprobada no cambia nunca, así que puede condicionar las promociones a un entorno y los lanzamientos canario. Editar una versión aprobada crea la siguiente versión como borrador.",
  "p3": "La forma más rápida de empezar es la zona de pruebas del estudio: guarda como caso un turno que te guste y luego ejecuta el conjunto contra la revisión en borrador."
 },
 "evalRuns": {
  "title": "Ejecuciones de evaluación",
  "p1": "Una ejecución de evaluación envía cada caso de una versión del conjunto a un despliegue, o a una revisión de agente en un despliegue temporal, y puntúa cada respuesta con las comprobaciones del caso.",
  "p2": "La puntuación de la ejecución es la media ponderada de las puntuaciones de sus casos, y se supera cuando alcanza el umbral. Un presupuesto detiene la ejecución cuando las ejecuciones de casos y del juez lo han gastado."
 },
 "shadowTrials": {
  "title": "Pruebas en sombra",
  "p1": "Una prueba en sombra copia una parte de las ejecuciones correctas de un despliegue a un despliegue candidato del mismo agente. Las copias se ejecutan como ejecuciones en sombra, que no pueden usar herramientas con efectos, enviar mensajes, escribir en la memoria ni presentar informes.",
  "p2": "Cada respuesta del candidato se compara con la del origen, como texto normalizado, con un conjunto de evaluación o mediante el agente juez. La prueba cuenta cuántas veces coinciden y cuántas veces falla el candidato."
 },
 "canaryReleases": {
  "title": "Lanzamientos canario",
  "p1": "Un lanzamiento canario lleva el tráfico de un agente a un despliegue candidato por pasos. Cada paso dura un mínimo de ejecuciones y de minutos antes de poder avanzar.",
  "p2": "Mientras la tasa de errores del candidato, y la última puntuación de evaluación cuando el lanzamiento tiene un requisito de evaluación, se mantengan dentro de los límites, el lanzamiento avanza y se promueve tras el último paso. Si no, se revierte a los pesos de antes y se envía una notificación de Lanzamiento canario revertido."
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
  "importExport": "Abre la página de manifiestos para aplicar un manifiesto YAML o exportar la configuración de este inquilino al control de versiones.",
  "manage": "Abre la página Conexiones para añadir, revisar o cambiar los harnesses y endpoints de API guardados que usan los agentes.",
  "manageThis": "Abre esta conexión en una pestaña nueva de la página Conexiones para revisar o cambiar su modelo, endpoint y credenciales.",
  "configureFirst": "Todavía no hay ninguna conexión guardada. Este enlace abre la página Conexiones en una pestaña nueva para que puedas crear una.",
  "harness": "El CLI de harness o la API HTTP que ejecuta esta conexión. Al elegir uno se rellenan sus valores predeterminados; Harness personalizado empieza con un perfil vacío."
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
  "tab": "Siga esta solicitud por cada agente: los mensajes, las ejecuciones hijas, los informes, los escalados, las aprobaciones y los efectos de herramientas, desde la solicitud inicial hasta la respuesta.",
  "refresh": "Volver a cargar el recorrido ahora. Mientras un paso siga en curso, también se actualiza con el intervalo elegido junto a este botón.",
  "exportJson": "Descargar el recorrido como JSON: pasos, enlaces, estados, horas, tokens y coste. No contiene texto escrito por agentes.",
  "openTrail": "Abrir el recorrido de actividad de esta ejecución con este paso seleccionado, para ver qué llevó a él y qué provocó.",
  "openStep": "Abrir los detalles de este paso: su estado, sus horas, su coste y el registro que hay detrás.",
  "keysHint": "Tab llega al paso seleccionado. Arriba y Abajo recorren los pasos en orden temporal, Izquierda y Derecha pasan al carril siguiente, Inicio y Fin van al primer y al último paso, e Intro abre los detalles.",
  "truncationSetting": "Abrir Ajustes, donde un administrador puede cambiar cuántos pasos, saltos de mensajes y horas puede abarcar un recorrido.",
  "views": {
   "sequence": "Un carril por agente, con el tiempo hacia abajo. Lo mejor para leer una solicitud desde el inicio hasta la respuesta.",
   "graph": "Cada paso una columna después de su causa. Lo mejor para ver abanicos y bucles de un vistazo.",
   "list": "Cada paso como fila de una tabla que puede filtrar y ordenar. Contiene la misma información que los diagramas."
  },
  "zoom": {
   "in": "Ampliar la secuencia. Arrastre el fondo vacío o desplácese para moverse.",
   "out": "Reducir la secuencia para ver más pasos a la vez.",
   "reset": "Volver a poner la ampliación al 100 por ciento."
  },
  "summary": {
   "agents": "Cuántos agentes distintos participaron en este recorrido.",
   "hops": "Cuántos mensajes pasaron entre agentes por el camino. El servidor deja de seguirlos al llegar a su límite de saltos.",
   "duration": "Tiempo desde el inicio del primer paso hasta el final del último.",
   "tokens": "Tokens de entrada y salida sumados en todas las ejecuciones del recorrido.",
   "cost": "Coste en dólares estadounidenses sumado en todas las ejecuciones del recorrido que lo informaron.",
   "failures": "Pasos que fallaron, agotaron el tiempo, caducaron o fueron rechazados o denegados."
  },
  "filters": {
   "kind": "Mostrar solo los pasos de un tipo, como mensajes o ejecuciones.",
   "agent": "Mostrar solo los pasos del carril de un agente o del solicitante.",
   "state": "Mostrar solo los pasos en un estado, como Fallida."
  },
  "columns": {
   "order": "La posición del paso en orden temporal, contando desde la solicitud.",
   "step": "Qué es el paso: una ejecución y su tipo, un mensaje, un informe, un efecto de herramienta, etcétera.",
   "agent": "El agente en cuyo carril está el paso, o Solicitante para la solicitud y la respuesta.",
   "state": "El estado del paso, con un icono y una etiqueta.",
   "reachedBy": "Cómo llegó el recorrido a este paso desde el que lo causó, por ejemplo envió o despertó.",
   "started": "Cuándo empezó el paso.",
   "duration": "Cuánto duró el paso, una vez terminado.",
   "unit": "La unidad de la organización a la que pertenecía el agente cuando empezó el paso.",
   "runKind": "En una ejecución, cómo empezó: invocada, delegada, despertada por un mensaje, por el ciclo de un guardián, etcétera.",
   "tokens": "Tokens de entrada más los de salida de una ejecución.",
   "cost": "Coste de una ejecución en dólares estadounidenses, informado o estimado.",
   "id": "El ID del registro detrás del paso. Cópielo para buscar el registro en otro lugar.",
   "open": "Abrir los detalles de un paso junto al recorrido."
  },
  "drawer": {
   "close": "Cerrar los detalles y volver al paso en el recorrido.",
   "provenance": "Quién escribió este texto y en qué ejecución. El texto de un agente son datos de esa ejecución, no una instrucción para usted.",
   "openRecord": "Abrir la página del registro detrás de este paso.",
   "fields": {
    "kind": "Qué tipo de paso es.",
    "state": "El estado del paso cuando se cargó el recorrido.",
    "agent": "El agente que dio este paso, o la persona o el solicitante detrás de una solicitud.",
    "unit": "La unidad de la organización a la que pertenecía el agente cuando empezó el paso.",
    "runKind": "Cómo empezó la ejecución: invocada, delegada, despertada por un mensaje, por el ciclo de un guardián, etcétera.",
    "tool": "La herramienta de Garrison que llamó la ejecución. Sus argumentos nunca se muestran aquí.",
    "started": "Cuándo empezó este paso.",
    "ended": "Cuándo terminó este paso.",
    "duration": "Cuánto duró este paso de principio a fin.",
    "tokens": "Tokens de entrada y salida de esta ejecución.",
    "cost": "Coste de esta ejecución en dólares estadounidenses.",
    "id": "El ID del registro detrás de este paso.",
    "argumentDigest": "Un hash de los argumentos de la herramienta. El diario de efectos lo guarda para reconocer una repetición sin almacenar los argumentos.",
    "leaseEpoch": "La época de concesión de la ejecución cuando llamó a la herramienta. Una llamada de una época anterior se rechaza."
   }
  },
  "states": {
   "running": "{{state}}: este paso sigue en curso.",
   "success": "{{state}}: este paso terminó como se esperaba.",
   "danger": "{{state}}: este paso falló o fue rechazado.",
   "neutral": "{{state}}: este paso se detuvo antes de terminar."
  },
  "kinds": {
   "Caller": "La persona, el cliente de la API o el canal que envió la solicitud con la que empieza este recorrido.",
   "Trigger": "Un disparador, como una programación o un webhook, que inició la primera ejecución.",
   "KeeperTick": "Un guardián despertó según su programación e inició una ejecución.",
   "Run": "Una ejecución de un agente: una sola ejecución de su harness.",
   "Message": "Un mensaje que un agente envió a otro. Puede despertar al destinatario en una nueva ejecución.",
   "Report": "Un informe que un agente presentó para su responsable o para la junta.",
   "Escalation": "Una pregunta que un agente planteó a una persona o a otro agente porque estaba atascado.",
   "Approval": "Una solicitud de permiso que hizo una ejecución antes de usar una herramienta.",
   "Effect": "Una llamada a herramienta que cambió algo, registrada en el diario de efectos.",
   "FanOutGroup": "Un grupo de ejecuciones hijas que una ejecución inició a la vez y esperó.",
   "PipelineRun": "La ejecución de canalización de la que esta ejecución fue una etapa.",
   "Reply": "La respuesta que volvió al solicitante cuando terminó la primera ejecución.",
   "Redacted": "Un paso que no puede leer. Solo se muestran su tipo y su hora."
  },
  "edges": {
   "Started": "El solicitante, el disparador o el guardián inició esta ejecución.",
   "Spawned": "Una ejecución o un abanico inició esta ejecución hija.",
   "FannedOut": "La ejecución inició a la vez un grupo de ejecuciones hijas.",
   "Retried": "Esta ejecución reintenta la ejecución fallida anterior.",
   "Sent": "La ejecución envió este mensaje.",
   "Woke": "El mensaje despertó a su destinatario en una nueva ejecución.",
   "Filed": "La ejecución presentó este informe.",
   "Raised": "La ejecución planteó este escalado.",
   "Routed": "El escalado se derivó a la ejecución de otro agente.",
   "Answered": "La respuesta al escalado volvió a la ejecución.",
   "Requested": "La ejecución solicitó esta aprobación.",
   "Decided": "Una persona o una regla decidió esta aprobación.",
   "Performed": "La ejecución realizó este efecto de herramienta.",
   "Replied": "La respuesta de la ejecución volvió al solicitante."
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
   "design": "Diseñe el árbol de trabajo de esta organización en un lienzo: unidades, líderes, miembros, líneas entre pares, guardianes, presupuestos y las reglas de cambio que se aplican.",
   "people": "El líder, los miembros y las líneas entre pares de la unidad, y las acciones para añadir una unidad debajo, empezar una línea entre pares o quitarla.",
   "keepers": "Los guardianes asignados a cada persona de la unidad, con su próxima activación. Asígnelos, retírelos, créelos o cambie su calendario aquí.",
   "budget": "Los presupuestos diario y mensual de la unidad, lo que ha gastado su subárbol y el máximo que puede tener cada presupuesto.",
   "rules": "Las reglas de cambio que cubren esta unidad. Las reglas las escriben personas; esta pestaña las lista y abre el formulario de reglas."
  },
  "readOnly": "Esta vista solo muestra la organización. Use la pestaña Diseño para cambiarla.",
  "unitOverlay": "Una unidad con su estado, su gasto y su actividad. Selecciónela para ver sus ejecuciones recientes.",
  "history": {
   "undo": "Deshacer el último cambio ({{change}}) enviando el cambio contrario.",
   "redo": "Volver a hacer el cambio: {{change}}.",
   "nothingToUndo": "Todavía no hay nada que deshacer.",
   "nothingToRedo": "No hay nada que rehacer."
  },
  "palette": {
   "title": "Los agentes de este inquilino. Arrastre uno a una unidad, o elíjalo y luego elija una unidad.",
   "search": "Filtrar los agentes por nombre.",
   "agent": "Arrástrelo a una unidad para añadirlo como miembro, o a la fila del líder de la unidad para que la lidere. Pulse Intro para elegirlo y colocarlo con el teclado.",
   "newAgent": "Abrir el formulario de agentes. El nuevo agente entra como miembro en la unidad seleccionada.",
   "unit": "La unidad a la que va el agente elegido.",
   "as": "Si el agente entra como miembro o pasa a liderar la unidad.",
   "leadOff": "Este lienzo no puede cambiar un líder, así que el agente entra como miembro.",
   "place": "Añadir el agente elegido a la unidad elegida.",
   "cancel": "Devolver el agente sin colocarlo."
  },
  "structure": {
   "lead": "El agente que lidera la unidad. Déjelo vacío para no tener líder.",
   "title": "El cargo del líder, por ejemplo Responsable de facturación.",
   "setLead": "Hacer que este agente lidere la unidad. Un miembro que pasa a ser líder sale de la lista de miembros.",
   "parent": "La unidad de la que depende esta. Una unidad no puede depender de sí misma ni de una unidad que tenga debajo.",
   "move": "Mover la unidad, con todo lo que tiene debajo, bajo la unidad elegida.",
   "sameParent": "La unidad ya depende de esa."
  },
  "keepers": {
   "open": "Abrir la página del guardián.",
   "schedule": "Escribir una nueva revisión del guardián con otro calendario de activación.",
   "detach": "Quitar el guardián de este puesto. El guardián en sí se conserva.",
   "pick": "Otro guardián de este agente para asignarlo al puesto.",
   "attach": "Asignar el guardián elegido a este puesto.",
   "create": "Abrir el formulario de guardianes con este agente ya indicado. El nuevo guardián se asigna al puesto."
  },
  "budget": {
   "period": "Un periodo de presupuesto. Su ventana vuelve a empezar cada día o cada mes.",
   "amount": "Lo máximo que puede gastar el subárbol de la unidad en el periodo, en dólares estadounidenses. Déjelo vacío para no tener presupuesto.",
   "save": "Guardar el presupuesto en el árbol de trabajo. El servidor rechaza un presupuesto mayor que el de la unidad de arriba.",
   "clear": "Quitar este presupuesto.",
   "cap": "Lo máximo que puede ser este presupuesto: el de la unidad más cercana por encima que tenga uno para el mismo periodo."
  },
  "rules": {
   "add": "Abrir el formulario de reglas de cambio para esta unidad. Una regla cubre la unidad y todo lo que tiene debajo.",
   "edit": "Abrir esta regla en el formulario de reglas de cambio."
  },
  "problems": {
   "title": "Problemas que las comprobaciones de publicación encuentran en el árbol de trabajo. La lista se actualiza tras cada cambio.",
   "show": "Seleccionar la unidad en el lienzo."
  },
  "overlay": {
   "range": "Hasta cuándo llegan los recuentos de ejecuciones, los escalados y el coste.",
   "unit": "La unidad que ha seleccionado en el organigrama.",
   "runs": "Una muestra de ejecuciones recientes en el subárbol de esta unidad, la misma que muestra la página Rendimiento.",
   "openRun": "Abrir la ejecución.",
   "openTrail": "Abrir el recorrido de actividad de la ejecución."
  },
  "chartLayout": {
   "tree": "Mostrar el organigrama como un árbol de tarjetas.",
   "canvas": "Mostrar el organigrama en el lienzo, con el estado, el gasto y la actividad de cada unidad."
  },
  "templates": {
   "open": "Empezar una organización nueva, vacía o desde una de las organizaciones de ejemplo.",
   "preview": "Ejecutar la plantilla como simulación y listar lo que crearía o cambiaría.",
   "previewFirst": "Compruebe primero qué crea la plantilla.",
   "apply": "Aplicar la plantilla mediante la aplicación de manifiestos y abrir la nueva organización.",
   "contents": "Los recursos del manifiesto de la plantilla, por tipo y nombre.",
   "blank": "Una organización vacía, sin unidades.",
   "gerbil": "El ejemplo gerbil: un guardián que vigila una página de estado, en una organización de una sola unidad.",
   "siteReliability": "El ejemplo de fiabilidad del sitio: un líder, tres guardianes, un curador de memoria, presupuestos y líneas entre pares."
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
  "learn": "Abre la página Aprender: siete diagramas de cómo encaja Garrison, un recorrido para cada uno y un glosario.",
  "hubs": {
   "learn": "Siete diagramas de cómo encaja Garrison, del entorno de ejecución a los frenos, con un recorrido para cada uno y un glosario."
  }
 },
 "learn": {
  "openPage": "Abre la página {{page}} en el panel.",
  "openDoc": "Abre {{doc}} en GitHub en una pestaña nueva.",
  "showList": "Muestra los mismos recuadros y flechas como una lista anidada, cómoda con un lector de pantalla o en una pantalla estrecha.",
  "showDiagram": "Vuelve al diagrama dibujado.",
  "startTour": "Inicia el recorrido {{tour}}, que pasa por las páginas que usa esta parte de Garrison.",
  "toc": "Salta a {{title}} en esta página.",
  "seeDiagram": "Abre la página Aprender en el diagrama que muestra dónde encaja esta página en Garrison."
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
   "errors": "Problemas que impiden publicar. Corríjalos antes de publicar una revisión.",
   "warnings": "Problemas que conviene revisar pero que no impiden publicar."
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
  "skip": "Cierra el recorrido. Puedes volver a empezarlo desde Aprender o desde Visita guiada en la barra lateral.",
  "back": "Vuelve al paso anterior del recorrido.",
  "next": "Pasa al siguiente paso. El recorrido abre la página donde está.",
  "done": "Termina el recorrido y lo marca como hecho para ti.",
  "hub": "Inicia el recorrido {{tour}}, que recorre esta parte del panel paso a paso.",
  "start": "Inicia el recorrido {{tour}}. Abre cada página de la que habla.",
  "replay": "Terminaste {{tour}}. Hazlo otra vez desde el primer paso.",
  "finished": "Terminaste este recorrido. Queda marcado para ti en este inquilino.",
  "pickerLearn": "Abre la página Aprender: diagramas de cómo encaja Garrison, con un recorrido para cada parte.",
  "sampleLoad": "Aplica ahora el manifiesto del ejemplo. La lista de arriba muestra todo lo que crea o cambia.",
  "sampleContinue": "Hace el recorrido sin el ejemplo. Los pasos sin nada que mostrar se omiten con una nota.",
  "homeCardOpen": "Abre la página Aprender, con diagramas de cómo encaja Garrison y un recorrido para cada parte.",
  "homeCardDismiss": "Oculta esta tarjeta. Sigue oculta para ti en este inquilino.",
  "wizardLearn": "Cierra el asistente y abre la página Aprender.",
  "wizardTour": "Cierra el asistente e inicia el recorrido Ejecutar un agente."
 },
 "trail": {
  "entrySurfaces": {
   "Rest": "Una llamada a la API REST, desde un script, un SDK u otro servicio.",
   "Mcp": "Una llamada a herramienta a través del servidor MCP de Garrison.",
   "A2a": "Una tarea que otro agente envió por el protocolo A2A.",
   "App": "Un turno de chat en la página de usuario final de una app agéntica.",
   "Dashboard": "La inició una persona en este panel, por ejemplo desde Invocar.",
   "Trigger": "La inició una programación cron o un webhook firmado.",
   "Keeper": "Un guardián despertó según su horario y ejecutó un ciclo.",
   "Message": "Un mensaje a un agente lo despertó como una nueva ejecución.",
   "Escalation": "La respuesta a un escalado reanudó o despertó la ejecución.",
   "Eval": "Un caso de una ejecución de evaluación.",
   "Shadow": "La copia de una ejecución real en el despliegue candidato, de una prueba en sombra.",
   "Internal": "La inició el propio Garrison, por ejemplo un reintento o una etapa de canalización."
  },
  "columns": {
   "entrySurface": "Cómo llegó a Garrison la solicitud con la que empieza este recorrido."
  },
  "drawer": {
   "fields": {
    "entrySurface": "Cómo llegó la solicitud a Garrison: la API, MCP, A2A, una app, el panel, un disparador, un guardián, un mensaje, etc."
   }
  },
  "edges": {
   "Shadowed": "Una prueba en sombra ejecutó una copia de esta ejecución real en el despliegue candidato para comparar ambas.",
   "Delivered": "El mensaje llegó a una ejecución que ya estaba en marcha y lo leyó de su bandeja, en vez de despertar una nueva."
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
  "worker": "Ningún nodo de trabajo ha tomado esta ejecución todavía. Empieza en cuanto uno con hueco libre la recoja.",
  "approval": "La ejecución se detuvo antes de una llamada a herramienta que necesita a una persona. Apruébala o recházala en Aprobaciones.",
  "tool": "Se está ejecutando una llamada a herramienta. Su tarjeta muestra la entrada y, cuando termine, la salida.",
  "working": "El último paso terminó y el modelo está decidiendo qué hacer a continuación. Normalmente llega más salida.",
  "quiet": "Hace un rato que no llega nada nuevo, pero la ejecución no ha terminado. Abre la ejecución para revisar sus eventos y su nodo de trabajo.",
  "elapsed": "Tiempo desde la última salida o evento de herramienta."
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
   "appearance": "Cómo se ve la página de la app: textos, imágenes, colores en claro y oscuro, diseño y preguntas iniciales, con vista previa en vivo.",
   "steps": {
    "appearance": "Textos, imágenes, paleta y colores, tema, diseño y preguntas iniciales de la página, con vista previa en claro y oscuro."
   },
   "subtitle": "Una línea corta bajo el nombre de la app en el encabezado y en la bienvenida. Si está vacía no se muestra.",
   "welcomeTitle": "El título grande que se ve antes del primer mensaje. Si está vacío usa el nombre visible.",
   "composerPlaceholder": "La pista dentro del cuadro de mensaje vacío, por ejemplo qué preguntar. Si está vacía usa la habitual.",
   "agentDisplayName": "El nombre del autor en las respuestas del agente, por ejemplo un personaje. Si está vacío usa el nombre visible.",
   "agentAvatarAssetId": "Un recurso de imagen que aparece pequeño y redondo junto al nombre del agente. Elija uno o súbalo aquí.",
   "paletteId": "La paleta de la que partieron los colores, o Personalizada tras cambiar alguno. Es solo una nota: la página usa los colores de abajo.",
   "themeDefault": "El tema con el que se abre la página. Según el sistema sigue el ajuste de cada dispositivo.",
   "allowThemeSwitch": "Si está activado, se puede cambiar entre claro y oscuro y la página lo recuerda. Desactivado mantiene el tema predeterminado.",
   "cornerStyle": "Lo redondeados que son botones, cuadros y mensajes: rectos, redondeados (predeterminado) o en píldora.",
   "density": "Cuánto espacio deja la página alrededor de los elementos. Compacta muestra más; Cómoda es la predeterminada.",
   "showFilesPanel": "Desactivado oculta el botón Archivos y la lista de archivos del agente. Los enlaces a archivos quedan como enlaces simples.",
   "showLanguagePicker": "Desactivado oculta el menú de idioma. La página sigue el idioma del navegador o un enlace ?lang=.",
   "showPoweredBy": "Una línea pequeña bajo el chat y en el inicio de sesión que enlaza al sitio de Garrison. Desactivado la oculta.",
   "starterPrompts": "Hasta 4 preguntas sugeridas como botones en una conversación nueva, de hasta 200 caracteres cada una."
  }
 },
 "appAppearance": {
  "sections": {
   "text": "Los textos de la página: subtítulo, título y texto de bienvenida, la pista del cuadro de mensaje y el nombre del agente.",
   "images": "El logotipo, el icono de la pestaña y el avatar del agente. Elija un recurso de imagen o suba uno nuevo.",
   "colors": "Parta de una paleta y ajuste cualquier color. Cada color tiene un valor claro y uno oscuro; un oscuro vacío se calcula a partir del claro.",
   "layout": "El tema al abrir, lo redondeadas que son las esquinas, lo ajustado del espaciado y la tipografía.",
   "show": "Desactive partes de la página: el botón de tema, la lista de archivos, el menú de idioma y la línea de crédito de la plataforma.",
   "prompts": "Primeras preguntas sugeridas como botones en una conversación nueva. Al pulsar una se envía.",
   "preview": "Un boceto de la página en claro y oscuro que cambia con los campos. No se guarda nada hasta pulsar Guardar."
  },
  "contrastWarning": "Parte del texto sobre este color solo llega a {{ratio}}:1. WCAG AA pide 4,5:1; elija un tono más claro o más oscuro.",
  "derived": "No hay color oscuro, así que la página lo calcula a partir del claro: mismo tono, luminosidad ajustada.",
  "sameAsLight": "Sin color oscuro ni paleta, el tema oscuro mantiene el color claro, como antes de las paletas.",
  "builtIn": "Ningún color está definido, así que el tema oscuro usa el color oscuro propio de la página.",
  "darkColor": "{{field}} en el tema oscuro, como #RGB o #RRGGBB. Déjelo vacío para derivarlo del color claro.",
  "resetColors": "Borra todos los colores claros y oscuros y la paleta, para que la página use sus colores integrados en ambos temas.",
  "palette": "Rellena todos los colores claros y oscuros con la paleta {{name}}. Después puede ajustar cualquier color.",
  "lightColumn": "Colores del tema claro. Uno vacío mantiene el color claro integrado de la página.",
  "darkColumn": "Colores del tema oscuro. Uno vacío se deriva del color claro y se muestra al lado.",
  "upload": "Sube una imagen de este equipo como recurso nuevo y la usa como {{field}}.",
  "prompt": "Una pregunta que se envía con un clic. Manténgala corta; Alt+Arriba y Alt+Abajo la mueven.",
  "addPrompt": "Añade una pregunta inicial vacía al final de la lista para escribir su texto.",
  "promptsFull": "Una app admite como máximo {{max}} preguntas iniciales. Quite una para añadir otra."
 }
});

// Shared tables and states (LP5.5).
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
 "table": {
  "showAll": "Quitar los filtros predeterminados y listar todos los registros de este tipo."
 },
 "resources": {
  "runs": {
   "emptyAction": "Abrir la página Invocar e iniciar una ejecución de un agente."
  }
 }
});

// LP5.5 trail and runs fixes (UXP1-V010, V011, S001, S006, S024).
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
  "moreHint": "El dibujo es más grande que el área visible. Desplázate o arrastra el fondo para ver el resto.",
  "replyFinished": "El llamante recibió su respuesta cuando terminó la ejecución raíz. Los pasos posteriores a esta fila siguieron por su cuenta.",
  "drawer": {
   "fields": {
    "caller": "La persona, app o sistema que envió la solicitud y recibió la respuesta.",
    "outcome": "Cómo terminó la ejecución, según la clasificó Garrison.",
    "exitCode": "El código de salida del proceso del harness. Cero significa que terminó con normalidad."
   }
  }
 },
 "views": {
  "runDetail": {
   "failure": {
    "errorEvent": "El último evento Error de la transcripción de esta ejecución, tal como lo escribió el harness o Garrison.",
    "serverError": "El mensaje de error que Garrison guardó en la ejecución al terminar.",
    "showError": "Abre la pestaña Transcripción filtrada por eventos Error.",
    "showStderr": "Abre la pestaña Stderr: las últimas líneas que el harness escribió en la salida de error estándar.",
    "openDeployment": "Abre la lista de despliegues en el de esta ejecución, para revisar su harness, conexión y ajustes."
   },
   "templatesCount": "Las plantillas de prompt con las que se compiló esta ejecución. Despliégalo para ver cada nombre y versión; la pestaña Entrada también las lista.",
   "telemetryToggle": "Muestra u oculta las fases de tiempo, los recuentos de tokens y el coste de la ejecución. La página recuerda tu elección.",
   "resultRaw": "Alterna entre el resultado con formato, con el JSON indentado, y el texto sin formato que devolvió el harness."
  }
 },
 "resources": {
  "runs": {
   "callerName": "Quién inició la ejecución: una persona, una clave de API, una app o un mensaje de otro agente.",
   "hops": {
    "message": "Un mensaje de otro agente despertó esta ejecución. Abre el recorrido de la solicitud a la que pertenece.",
    "fanOut": "Esta ejecución es un miembro de un fan-out. Abre el recorrido de la solicitud a la que pertenece.",
    "child": "Otra ejecución inició esta. Abre el recorrido de la solicitud a la que pertenece."
   },
   "callerMessage": "Despertada por el mensaje {{id}}.",
   "filters": {
    "agentId": "Muestra solo las ejecuciones de un agente.",
    "outcome": "Muestra solo las ejecuciones que terminaron con un resultado concreto, como Fallo del harness."
   }
  }
 }
});

// LP5.5 (UXP1-V002, S013, S015, S025): tooltips of the organization canvas tree, the read-only chart, and board
// attention.
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
  "collapse": {
   "expand_one": "Muestra en el lienzo la {{count}} unidad que depende de {{name}}.",
   "expand_other": "Muestra en el lienzo las {{count}} unidades que dependen de {{name}}.",
   "collapse_one": "Oculta la {{count}} unidad que depende de {{name}}. Menos (-) en la unidad enfocada hace lo mismo.",
   "collapse_other": "Oculta las {{count}} unidades que dependen de {{name}}. Menos (-) en la unidad enfocada hace lo mismo.",
   "expandAll": "Muestra todas las unidades de la organización. Una grande queda más ancha que el lienzo: arrastra para desplazarte o usa el minimapa.",
   "collapseAll": "Muestra la raíz y las unidades que le reportan, y oculta los niveles inferiores. Expande una unidad para ver quién le reporta.",
   "hidden": "Las unidades bajo una unidad contraída no se dibujan. Expande la unidad o usa Expandir todo."
  },
  "outlineUnits": "Una frase por unidad: a quién reporta y quién la dirige. Los lectores de pantalla reciben el mismo texto.",
  "editAll": "Abre el formulario completo de la unidad: nombre, descripción, responsable y cargo, miembros con cargos y keepers, app, líneas entre pares y presupuestos."
 },
 "board": {
  "chart": {
   "needsPerson": "En esta unidad hay escalaciones abiertas o un tope de presupuesto que esperan a una persona. La salud solo sale de los informes de la unidad, así que puede decir Desconocido o Saludable mientras esto espera."
  },
  "attention": {
   "repeated_one": "El mismo agente hizo esta pregunta {{count}} vez.",
   "repeated_other": "El mismo agente hizo esta pregunta {{count}} veces. El enlace abre la más reciente; la página Escalaciones las lista todas."
  }
 },
 "organizations": {
  "chart": {
   "showMore": "Muestra más unidades de este nivel del organigrama.",
   "expandAll": "Abre todas las unidades del organigrama.",
   "collapseAll": "Muestra la raíz y las unidades que le reportan, y pliega los niveles inferiores. Abre una unidad para ver quién le reporta."
  }
 },
 "views": {
  "organizationDetail": {
   "editOnDesign": "Abre la pestaña Diseño, donde añades y quitas unidades, colocas personas, asignas keepers, fijas presupuestos y ves las comprobaciones."
  }
 }
});

// LP5.5 (UXP1-V002): the organization canvas is a tree, not nested boxes.
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
    "organizations": "Muestra las organizaciones del borrador: un árbol de unidades bajo la unidad a la que reportan, con responsables, miembros y líneas entre pares."
   }
  }
 }
});

// UX pass 1 page fixes (LP5.5): tooltips for the chart note, server info flags, settings sections, and the delete word
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
 "chart": {
  "sparse": "Una tendencia necesita al menos dos puntos. El gráfico se completa a medida que llegan más datos en este intervalo."
 },
 "views": {
  "serverInfo": {
   "noFeatures": "Los indicadores de función son interruptores que el servidor activa desde su configuración, como MCP, A2A y el historial de solicitudes.",
   "flagOn": "La función {{name}} está activada en este servidor.",
   "flagOff": "La función {{name}} está desactivada en este servidor."
  },
  "settings": {
   "groupLive": "La mayoría de los ajustes de esta sección se aplican en cuanto guardas. Un ajuste marcado con Requiere reinicio surte efecto tras reiniciar el servidor.",
   "groupRestart": "La mayoría de los ajustes de esta sección surten efecto tras reiniciar el servidor. Un ajuste marcado con En vivo se aplica en cuanto guardas."
  },
  "agentDetail": {
   "confirmWord": "La palabra que hay que escribir para confirmar la eliminación de este agente.",
   "delete": "Elimina este agente con sus despliegues y su historial de revisiones. Confirmas escribiendo eliminar, y un disparador, pipeline, aplicación o endpoint de notificación que lo use impide eliminarlo."
  }
 }
});
