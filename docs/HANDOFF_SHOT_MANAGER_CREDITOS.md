# Handoff · VFX Shot Manager ↔ Créditos

Estado de este documento: integración de contexto v1 implementada. La
resolución de outputs y la ejecución headless quedan fuera de esta fase.

## Objetivo

Créditos es una aplicación consumidora de VFX Shot Manager. Cada producción
local de Créditos puede asociarse con:

- una producción de Shot Manager;
- un elemento estable de la estructura de producción.

La asociación permite que una fase posterior solicite a Shot Manager la ruta
y nomenclatura oficiales de un render o preview sin duplicar esas reglas en
Créditos.

## Propiedad de los datos

Shot Manager es la única fuente de verdad de:

- producciones y jerarquía de temporada/capítulo/secuencia/plano;
- estructura parametrizada;
- nombres técnicos, slugs, anchors y reglas de nomenclatura;
- raíz local de una producción en cada ordenador.

Créditos es la única fuente de verdad de:

- sus producciones y documentos;
- su jerarquía de película o de serie con temporadas y capítulos;
- la composición visual de créditos;
- la configuración y ejecución actual de su exportación MOV/PNG;
- la asociación entre una producción local y los IDs de Shot Manager.

Créditos nunca lee `project.sqlite` ni reconstruye rutas con reglas copiadas.
Toda lectura de Shot Manager pasa por su API local.

## Descubrimiento y seguridad

Shot Manager publica `integration-api.json` dentro de su directorio Electron
`userData`. Créditos lo localiza de forma portable desde el `appData` del
usuario:

- macOS: `~/Library/Application Support/VFX Shot Manager/integration-api.json`
- Windows: `%APPDATA%\VFX Shot Manager\integration-api.json`

El fichero contiene un puerto efímero y un bearer token. Solo el proceso main
de Electron lo lee. La credencial no llega al renderer, a la base de datos, a
logs ni a Git.

Se admite exclusivamente el modelo actual:

```json
{
  "version": 1,
  "apiVersion": 1,
  "baseUrl": "http://127.0.0.1:43210/api/v1",
  "token": "<64 caracteres hexadecimales>",
  "updatedAt": "2026-07-24T12:00:00.000Z"
}
```

No se adivinan puertos, no se escanea localhost y no existen alias ni
fallbacks para modelos anteriores.

## API consumida

Créditos usa únicamente:

- `GET /api/v1/health`
- `GET /api/v1/productions`
- `GET /api/v1/productions/{productionId}`

La API v1 es de solo lectura. Una desconexión no bloquea el trabajo en
Créditos: se conserva la asociación y se indica que no puede verificarse
hasta abrir Shot Manager.

## Persistencia portable

La asociación se guarda en `data/creditos.db`, no en preferencias del equipo:

```text
shot_manager_associations
├── production_id
├── shot_manager_production_id
├── structure_entry_id
└── updated_at
```

Solo se persisten IDs estables; nunca nombres ni rutas. Por eso la misma base
de datos puede sincronizarse entre Mac y PC aunque la raíz de producción sea
distinta en cada equipo.

El esquema actual es v9. La asociación es única por producción y no contiene
duplicaciones de temporada o capítulo. Créditos modela una película
directamente en producción y una serie como producción → temporada →
capítulo. No existen capítulos ficticios para películas, ni secuencias o
planos en Créditos.

La migración v8 → v9 fue un one-off aplicado a la base activa. Todas las
producciones existentes se declararon explícitamente como series, se creó su
temporada 1 y se conservaron capítulos, documentos, archivos fuente y estilos.
El código actual solo admite v9 y no contiene rutas alternativas para el
modelo retirado.

## Comportamiento de la interfaz

En Producciones, el panel «Asociación con Shot Manager» permite:

1. elegir una producción disponible de Shot Manager;
2. elegir un elemento de estructura;
3. guardar o quitar la asociación conscientemente.

La producción activa de Créditos determina la asociación mostrada. El capítulo
se elige únicamente en Cartelas cuando la producción es una serie; una
película trabaja directamente con el contenido de producción.

Al cargar una asociación, la producción, su tipo y el elemento de estructura
se verifican contra el snapshot actual. Si un ID dejó de existir o los tipos
película/serie no coinciden, Créditos muestra el problema y no selecciona otro
elemento por nombre, posición o parecido.

## Auditoría del render actual de Créditos

Créditos ya puede:

- componer previews y frames en el renderer;
- generar secuencias PNG;
- enviar frames al proceso main;
- codificar MOV con FFmpeg en ProRes o H.264;
- cancelar y limpiar una exportación en curso.

Actualmente el usuario elige manualmente la ruta final y el nombre base nace
de la configuración local `pdf_base_name`. Este comportamiento no se cambia
en esta fase.

## Contrato pendiente para outputs

Créditos no debe calcular por sí mismo nombres como:

```text
trz_s01_e01_prev_v01.mov
trz_s01_e01_cred_v01.mov
```

La siguiente fase necesita que Shot Manager publique una operación canónica
que reciba, como mínimo:

```json
{
  "productionId": "production-id",
  "seasonId": "season-id",
  "episodeId": "episode-id",
  "structureEntryId": "structure-entry-id",
  "artifactKind": "PREVIEW",
  "extension": "mov"
}
```

Y devuelva una resolución coherente para el equipo actual:

```json
{
  "directoryPath": "/raiz-local/S01/E01/previews",
  "fileName": "trz_s01_e01_prev_v01.mov",
  "filePath": "/raiz-local/S01/E01/previews/trz_s01_e01_prev_v01.mov",
  "version": 1
}
```

La reserva concurrente de versiones y el registro de artefactos exigen write
access explícito y no forman parte de la API read-only v1.

## Contrato pendiente para render headless

La futura cola no debe automatizar clicks en la interfaz. Créditos expondrá un
worker headless que acepte un job JSON versionado con:

- IDs de producción y capítulo de Créditos;
- rango/cartelas y modo pages o scroll;
- resolución, FPS, códec y perfil;
- opciones de fondo, vídeo y animación;
- destino ya resuelto o una reserva de output;
- identificador de job para progreso, cancelación y reintento.

El worker devolverá estados estructurados y el artefacto final. La cola será
orquestadora; Shot Manager seguirá siendo la autoridad de contexto, rutas y
versiones.

## Criterios para iniciar la siguiente fase

Antes de conectar el render automático deben estar cerrados:

- endpoint de resolución de output en Shot Manager;
- decisión de reserva de versión;
- definición de los artifact kinds de Créditos, al menos `PREVIEW` y
  `FINAL_RENDER`;
- política de registro del resultado final;
- contrato JSON del worker headless.
