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
      artifactStores: 'Destinos para los archivos que producen las ejecuciones y que quieres conservar cuando la ejecución termina.',
      modelPrices: "Tarifas en USD configuradas por el operador para estimar el coste cuando el harness no lo informa. El coste informado, incluso cero, tiene prioridad.",
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
    serverUrl: 'Dirección base de la API REST de Garrison, por ejemplo el servidor con reenvío de puertos en 127.0.0.1:8700.',
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
      inputSchemaJson: 'JSON Schema que debe cumplir la entrada cuando el modo de entrada es Structured.',
      outputSchemaJson: 'JSON Schema que debe cumplir el resultado. Garrison valida la salida y reintenta una vez con un prompt de reparación.',
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
      approvalTimeoutDecision: 'La decisión que se aplica cuando nadie responde a tiempo. Denegar es la opción segura.',
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
      retryOnNodeLoss: 'Vuelve a poner la ejecución en la cola cuando su nodo desaparece, en lugar de marcarla como fallida.',
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
      principalName: 'Quién lo aplicó.',
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
        logs: 'Volumen de registros, errores y advertencias por componente e inquilino, líneas de error recientes y enlaces a trazas.'
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
