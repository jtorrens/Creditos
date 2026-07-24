# Handoff · VFX Shot Manager ↔ Créditos

Estado de este documento: gobierno de producción y resolución de
`FINAL_RENDER` implementados. Preview, registro de artefactos, reserva de
versiones y ejecución headless quedan fuera de esta fase.

## Objetivo

Créditos admite dos modos excluyentes por producción:

- `INDEPENDENT`: Créditos administra su tipo y jerarquía;
- `SHOT_MANAGER`: una producción oficial de Shot Manager gobierna el tipo y
  la jerarquía de temporadas y capítulos.

Una producción gobernada conserva una vinculación explícita entre cada tipo
de artefacto admitido y su salida estable de estructura. El modelo actual
admite `FINAL_RENDER`; no usa una salida genérica ni selecciona por nombre.

## Propiedad de los datos

Shot Manager es la única fuente de verdad de:

- producciones y jerarquía de temporada/capítulo/secuencia/plano;
- estructura parametrizada;
- nombres técnicos, slugs, anchors y reglas de nomenclatura;
- raíz local de una producción en cada ordenador.

Créditos es la única fuente de verdad de:

- sus producciones y documentos;
- la jerarquía de las producciones independientes;
- la composición visual de créditos;
- la configuración y ejecución actual de su exportación MOV/PNG;
- el modo de gobierno y la copia local de la jerarquía oficial.

En una producción `SHOT_MANAGER`, Shot Manager es la autoridad de tipo,
temporadas y capítulos. Créditos guarda una copia local con los IDs oficiales
para poder seguir trabajando sin conexión, pero no crea, elimina ni renombra
esa jerarquía remota.

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
- `GET /api/v1/productions/{productionId}/outputs/resolve`

La API v1 es de solo lectura. Una desconexión no bloquea el trabajo en
Créditos: se usa la jerarquía local ya sincronizada y se indica que no puede
verificarse hasta abrir Shot Manager. El trabajo editorial puede continuar
con la copia local, pero un render final gobernado necesita Shot Manager
abierto para resolver el destino actual del equipo.

## Persistencia portable

La asociación se guarda en `data/creditos.db`, no en preferencias del equipo:

```text
shot_manager_associations
├── production_id
├── shot_manager_production_id
└── updated_at

shot_manager_output_bindings
├── production_id
├── artifact_kind
├── structure_entry_id
└── updated_at
```

Las temporadas y capítulos gobernados guardan además
`shot_manager_season_id` y `shot_manager_episode_id`. Nunca se persisten rutas.
Por eso la misma base de datos puede sincronizarse entre Mac y PC aunque la
raíz de producción sea distinta en cada equipo.

El esquema actual es v11. La asociación es única por producción y cada
`artifact_kind` tiene como máximo una salida oficial. La jerarquía oficial se
materializa en las tablas normales de temporadas y capítulos, sin un modelo
paralelo. Créditos modela una película
directamente en producción y una serie como producción → temporada →
capítulo. No existen capítulos ficticios para películas, ni secuencias o
planos en Créditos.

La migración v10 → v11 fue un one-off aplicado a la base activa después de
crear una copia SQLite coherente. Separó la identidad de la asociación de sus
salidas y transformó cualquier selección v10 en `FINAL_RENDER`. El código
actual solo admite v11; no contiene lectores duales, alias ni conversores.

## Comportamiento de la interfaz

En Producciones, el panel «Gobierno de Shot Manager» permite:

1. elegir una producción disponible de Shot Manager;
2. elegir una salida `OUTPUT` para el render final;
3. convertir la producción independiente activa en gobernada;
4. crear directamente una producción gobernada nueva;
5. sincronizar cambios posteriores de temporadas y capítulos;
6. convertir una producción gobernada en independiente conservando su
   jerarquía y contenido.

La producción activa de Créditos determina la asociación mostrada. El capítulo
se elige únicamente en Cartelas cuando la producción es una serie; una
película trabaja directamente con el contenido de producción.

Al cargar una producción gobernada, la producción, su tipo, su jerarquía y la
salida de render final se verifican contra el snapshot actual. Si la jerarquía
remota cambió, la interfaz exige una sincronización consciente. Los capítulos
coincidentes conservan sus documentos. Los capítulos locales ausentes en Shot
Manager se eliminan automáticamente solo cuando están vacíos; si contienen
documentos o un archivo fuente se pide confirmación explícita. Nunca se
selecciona otro elemento por nombre, posición o parecido.

Duplicar una producción gobernada crea siempre una copia independiente y
elimina todos los IDs externos de la copia.

## Auditoría del render actual de Créditos

Créditos ya puede:

- componer previews y frames en el renderer;
- generar secuencias PNG;
- enviar frames al proceso main;
- codificar MOV con FFmpeg en ProRes o H.264;
- cancelar y limpiar una exportación en curso.

En una producción `INDEPENDENT`, el usuario sigue eligiendo manualmente la
ruta final y el nombre base nace de la configuración local `pdf_base_name`.

En una producción `SHOT_MANAGER`, Créditos solicita `FINAL_RENDER` con los IDs
oficiales de producción, capítulo y salida. Shot Manager devuelve la carpeta,
el nombre y la primera versión libre conforme al separador, slug y padding de
la producción. Créditos muestra el destino antes de renderizar y no abre el
selector manual. Si Shot Manager está cerrado, falta la carpeta oficial o la
versión pasa a existir antes de codificar, la exportación se detiene sin
fallback local ni sobrescritura.

## Contrato implementado para `FINAL_RENDER`

Créditos no debe calcular por sí mismo nombres como:

```text
trz_s01_e01_prev_v01.mov
trz_s01_e01_cred_v01.mov
```

Créditos consulta:

```json
{
  "productionId": "production-id",
  "episodeId": "episode-id",
  "structureEntryId": "structure-entry-id",
  "artifactKind": "FINAL_RENDER",
  "extension": "mov"
}
```

Y recibe una resolución coherente para el equipo actual:

```json
{
  "directoryPath": "/raiz-local/S01/E01/credits",
  "directoryExists": true,
  "fileName": "TRZ_S01_E01_cred_v001.mov",
  "filePath": "/raiz-local/S01/E01/credits/TRZ_S01_E01_cred_v001.mov",
  "fileExists": false,
  "version": 1,
  "reserved": false
}
```

La API elige la primera versión libre mediante inspección de disco, pero no la
reserva. Créditos vuelve a rechazar una colisión antes de iniciar FFmpeg y usa
modo sin sobrescritura. La reserva concurrente y el registro del artefacto
exigen write access explícito y no forman parte de la API read-only v1.

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

## Pendiente para la siguiente fase

Antes de conectar el render automático deben estar cerrados:

- vinculación y resolución de `PREVIEW`;
- decisión de reserva de versión;
- política de registro del resultado final;
- contrato JSON del worker headless.
