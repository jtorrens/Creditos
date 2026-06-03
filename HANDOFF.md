# Creditos app handoff

Este documento resume el estado del proyecto para continuar en otro hilo con poco contexto previo. La idea es que el siguiente trabajo empiece leyendo este archivo, `web_app/README.md` y, si hace falta, el codigo de `web_app/`.

## Objetivo

Construir una herramienta local para convertir hojas Excel de creditos finales de TV en una estructura editable, previsualizar cartelas/paginas y exportar una secuencia de PNGs transparentes. A futuro se quiere evolucionar a una app de escritorio independiente y anadir una linea de tiempo para exportar un MOV completo.

## Vocabulario

- **XLSX**: hoja Excel original. Puede venir de distintos departamentos y variar ligeramente entre producciones.
- **source_json**: JSON fiel al Excel parseado. Se genera en memoria al abrir un XLSX; no es necesario exportarlo normalmente.
- **structure_json**: decisiones editoriales y de diseno. Se guarda y se reutiliza al abrir XLSX actualizados.
- **render_json**: salida resuelta para AE/Fusion o para exportadores. Incluye textos con overrides y paginas fisicas.
- **Cartela**: unidad de contenido/diseno que acabara siendo una imagen durante un tiempo determinado.
- **Pagina de cartela**: pagina editorial dentro de una cartela. Puede tener uno o varios bloques.
- **Pagina fisica**: pagina real que se previsualiza/exporta como PNG. Se crea al dividir contenido por limite de lineas.
- **Bloque/material**: seccion de contenido fuente. En `RODILLO FINAL`, las secciones detectadas se convierten en bloques de diseno.
- **Cargo/Nombre**: par tipografico basico. En horizontal cargo a la izquierda y nombre a la derecha; en vertical cargo arriba y nombre abajo.
- **Licencias Musicales**: caso especial. Se agrupa por temas separados por filas en blanco. El nombre del tema usa tipografia de `Cargo`; el resto de lineas del tema usa `Nombre`.

## Repositorio

Ruta local actual:

```text
/Volumes/SD_02/PROYECTOS/CREDITOS
```

Remoto GitHub:

```text
https://github.com/jtorrens/Creditos.git
```

Rama usada:

```text
main
```

Carpetas locales no versionadas:

```text
renders/
test/
```

No borrarlas ni asumir que son basura: se usan para pruebas/exportaciones locales.

## Archivos principales

```text
web_app/index.html      UI de la web app
web_app/styles.css      estilos
web_app/app.js          logica frontend, structure/render, preview y export PNG
web_app/server.py       servidor local y parser XLSX
web_app/start.command   arranque macOS, abre Chrome
web_app/README.md       README de uso actual
google_sheets_extension/ archivos de una extension Apps Script exploratoria
JSON/TEST.xlsx          XLSX de prueba original
JSON/TEST_rodillo_final_first_pass.json  primer source_json de referencia
```

## Como arrancar

Opcion normal en macOS:

```text
doble clic en web_app/start.command
```

Opcion manual:

```bash
python3 web_app/server.py
```

El servidor abre `http://127.0.0.1:8787`. Para no abrir navegador:

```bash
python3 web_app/server.py --no-open
```

La app debe usarse en Chrome para:

- `queryLocalFonts` y fuentes del sistema.
- File System Access API para guardar/guardar como.
- exportar carpetas de PNGs con selector nativo.

## Flujo de datos

1. El usuario abre un `.xlsx`.
2. `server.py` parsea el archivo y devuelve `source_json`.
3. `app.js` normaliza source y crea `materials`.
4. `createStructureFromSource()` crea o fusiona `structure_json`.
5. `buildRenderJson()` crea `render_json`.
6. La pestana `PNG` llama a `buildPhysicalPages()` para generar paginas fisicas.
7. `renderPageToPngBlob()` exporta una pagina a PNG transparente.

## Schemas actuales

En `app.js`:

- `credits_structure_json`, version `10`.
- `credits_render_json`, version `7`.

## Parser XLSX

El parser esta en `web_app/server.py`.

Funciones clave:

- `parse_xlsx(file_bytes, source_name)`
- `parse_crew_row(...)`

Columnas relevantes del Excel: B, C, D, equivalentes a columnas 2, 3, 4 de la hoja. El grupo viene de la columna A.

Reglas importantes:

- Cast normal: actor/personaje en columnas B/D.
- Crew: `RODILLO FINAL` se parsea como bloque grande y luego se divide en materiales/secciones en frontend.
- Se detectan merges B:D y bold para cabeceras.
- Las cabeceras `section` llevan metadata:
  - `source_column`
  - `source_bold`
- `Licencias Musicales`: todo lo que aparece despues de esa cabecera y antes de la siguiente seccion real se trata como lineas de licencias. Los temas se separan por filas en blanco.
- `Doblaje de Figuracion/Figuración`, `Empresas de Servicios`, `Agradecimientos`, `Vestuario`, `Logos`, `closing_copy` son casos especiales o limites conocidos.
- `Logos` se deja como seccion especial. En el XLSX antiguo las filas 557 y 559 eran logotipos.
- `Agradecimientos` puede tener subsecciones por departamento; actualmente se separa por bold de cabecera.

Los XLSX pueden variar entre producciones. No asumir que todas las reglas estan cerradas.

## Materiales y estructura

En `app.js`:

- `createMaterialsFromSource(source)`
- `splitCrewBlockIntoMaterials(block)`
- `normalizeCrewItemsForMaterials(items)`
- `createStructureFromSource(source, materials, previousStructure)`

Puntos importantes:

- Una cartela por bloque/material por defecto.
- Varios bloques pueden juntarse en una cartela.
- Un bloque no puede estar en dos cartelas: al anadirlo a otra, se mueve.
- Si se abre un XLSX nuevo con un `structure_json` anterior:
  - se mantienen referencias existentes cuando coinciden IDs.
  - las referencias que ya no existen quedan excluidas (`enabled = false`).
  - materiales nuevos con contenido se anaden automaticamente.
- Bloques/cartelas vacios excluidos por defecto no se muestran ni se guardan en el `structure_json` final.
- `structure_json` se limpia para salida con `getStructureJsonForOutput()`.

## Ajustes globales

En pestana `Ajustes`:

- Duracion cartela por defecto.
- Lineas antes de salto automatico.
- Tipografia base:
  - `page_header`
  - `block_title`
  - `role`
  - `name`
- Layout global:
  - interlineado base
  - gap columnas
  - gap cargo/nombre
  - gap bloques
  - ancho/alto pagina
  - margen superior/inferior
  - color de fondo de visualizacion

El fondo de pagina solo es para visualizar; los PNG exportados son transparentes.

## Tipografia

La base de tipografia esta en `settings.typography`.

Cada bloque puede tener overrides en:

```text
cartela.pages[].source_ref_settings[ref].typography
```

Overrides por bloque disponibles:

- `block_title`
- `role`
- `name`

No hay override de `page_header` por bloque, porque el titulo de pagina pertenece a la pagina/cartela.

Fuentes:

- La app usa `window.queryLocalFonts()` en Chrome.
- Hay boton de cargar fuentes en Ajustes y tambien dentro de `Tipografia bloque`.
- Si no se concede permiso o Chrome no expone `queryLocalFonts`, se usa lista basica (`FONT_OPTIONS`).
- El JSON guarda familia, estilo y PostScript name cuando existe.

## Cartelas

Campos relevantes:

- `enabled`
- `orientation`: `horizontal` o `vertical`
- `columns`
- `font_size_multiplier`
- `line_spacing_multiplier`
- `vertical_offset`
- `duration`
- `notes`
- `pages`

`vertical_offset`:

- Por defecto `0`.
- Puede ser negativo.
- Se aplica al conjunto de la cartela en PNG preview/export canvas.

En `PNG` se duplicaron controles visuales para la cartela actual:

- Multiplicador letra.
- Multiplicador interlineado.
- Offset vertical.

Esos controles modifican la misma cartela de `structure_json`.

## Layout y separaciones

Reglas actuales:

- `Gap bloques` separa bloques entre si.
- En orientacion vertical:
  - cargo -> primer nombre usa `Gap bloques`.
  - nombres siguientes del mismo cargo usan solo interlineado normal, sin `Gap bloques`.
- En orientacion horizontal:
  - cargo/nombre se separan por `role_name_gap`.
- Temas de Licencias Musicales:
  - nombre del tema usa tipografia `Cargo`.
  - resto de lineas del tema usa tipografia `Nombre`.
- Bloques pueden tener columnas propias (`columns` por source ref).
- Cartela tambien tiene columnas para distribuir bloques.

## Paginacion

Funciones clave:

- `buildPhysicalPages(cartelas, overrides, options)`
- `countBlockVisualLines(...)`
- `countRenderedUnitLines(...)`
- `canvasRowGaps(...)`

Puntos importantes:

- El salto automatico se calcula a nivel de pagina fisica completa, no por bloque individual.
- Los saltos manuales internos de bloque se respetan como cortes obligatorios.
- La cuenta de lineas considera:
  - titulo de pagina si existe.
  - titulo de bloque si existe.
  - lineas reales visibles.
  - creditos verticales como cargo+nombre, salvo continuaciones de nombres del mismo cargo.
  - columnas, contando altura visual por filas.
- En `PNG`, los botones `-` y `+` ajustan el limite de lineas de la pagina fisica actual.
- El estado muestra `lineas globales/lineas pagina`.
- El ajuste de lineas por pagina fisica se guarda en:

```text
structure.page_line_adjustments.__physical[physicalPageId]
```

## Pestanas actuales

### Ajustes

Abrir XLSX, abrir structure_json, guardar estructura, guardar como estructura. Tambien tipografia base y layout global.

### Estructura

Lista de cartelas, editor de cartela y bloques, controles de bloque, overrides, alineaciones, columnas y edicion puntual de textos.

### JSON

Muestra `structure_json` o `render_json`. Guarda render.

### PNG

Preview de una pagina fisica, navegacion de paginas, titulo de pagina, ajuste de lineas por pagina, zoom, controles finos de cartela y exportacion PNG.

## Exportacion PNG

Funciones clave:

- `exportPngPages(mode)`
- `renderPageToPngBlob(page, layout)`
- `drawCanvasPage(ctx, page, layout)`

Exporta:

```text
nombre_base_###.png
```

PNG transparente. El color de fondo solo se ve en preview HTML.

## Guardado

- `structure_json`: desde Ajustes.
- `render_json`: desde JSON.
- En Chrome se usa File System Access API.
- Si no esta disponible, fallback a descarga.

Funciones:

- `saveJsonFile(kind, forceSaveAs)`
- `requestSaveHandle(kind)`
- `writeJsonToHandle(handle, data)`
- `fallbackDownloadJson(kind)`

## Cosas ya resueltas recientemente

- Licencias Musicales ya no se separan en un bloque por linea.
- Licencias Musicales agrupa temas por saltos de fila.
- Nombre de tema musical usa tipografia `Cargo`; lineas restantes usan `Nombre`.
- Nuevos XLSX con mas bloques que la estructura anterior anaden esos bloques automaticamente.
- Los bloques vacios excluidos por defecto no se guardan en structure output.
- Zoom PNG centrado/usable.
- Exportacion PNG transparente.
- Offset vertical por cartela.
- Controles de offset/multiplicadores duplicados en PNG.
- Nombres repetidos bajo el mismo cargo en vertical usan interlineado normal, no gap bloques.

## Pendiente / posibles siguientes pasos

Producto actual:

- Revisar visualmente todos los casos de XLSX nuevo.
- Mejorar reordenacion manual de cartelas/paginas/bloques.
- Anadir presets de estilos.
- IDs mas robustos si cambian filas del Excel.
- Guardar preferencias de app locales.
- Posible import/export de presets tipograficos.
- Mejorar tests automatizados del parser y de reglas de estructura.

Futuro app independiente:

- Crear una app Electron en `desktop_app/`.
- Usar la web actual como renderer.
- Objetivo multiplataforma: macOS y Windows como minimo. No asumir rutas tipo `/Volumes/...`; usar `path`, dialogs nativos y rutas absolutas elegidas por el usuario.
- Lanzar `server.py` internamente al principio, o migrar parser/export a proceso principal.
- Si se mantiene Python, empaquetar el runtime o un binario del parser para que el usuario no tenga que instalar Python manualmente. En Windows esto es especialmente importante.
- Si se mantiene un servidor interno temporal, que sea gestionado por Electron:
  - puerto elegido automaticamente o IPC/local socket.
  - arranque/cierre junto con la app.
  - manejo de errores visible en UI.
  - sin terminal externa para el usuario final.
- Sustituir llamadas HTTP por IPC progresivamente. Objetivo final: parser, guardado, exportacion y acceso a archivos deberian vivir en proceso principal/preload, no depender de un servidor web externo.
- Integrar dialogs nativos de Electron para:
  - abrir XLSX.
  - abrir `structure_json`.
  - guardar/guardar como `structure_json`.
  - guardar/guardar como `render_json`.
  - elegir carpeta de salida PNG.
  - elegir nombre/ruta de salida MOV futuro.
- Reducir dependencia de APIs puras de Chromium donde Electron tenga alternativa nativa:
  - File System Access API -> `dialog.showOpenDialog`, `dialog.showSaveDialog`, `fs`.
  - descargas browser -> escritura directa con `fs`.
  - rutas y permisos -> Electron main/preload.
- Mantener Chromium/Electron solo donde aporta valor real, especialmente UI y posible `queryLocalFonts`. Si `queryLocalFonts` no fuera estable en builds empaquetadas, valorar obtener fuentes desde el sistema en main process o mediante un modulo/plataforma especifica.
- Empaquetar con `electron-builder`.
- Preparar empaquetado de dependencias externas:
  - parser Python/binario.
  - FFmpeg para futuro MOV.
  - plantillas/presets.
  - assets necesarios.
- Para FFmpeg, no asumir instalacion global. Incluir binario por plataforma o resolverlo con una dependencia empaquetable, y permitir configurar ruta solo como fallback avanzado.
- Mantener separada la logica de dominio de la UI para facilitar la transicion:
  - parser XLSX.
  - generacion `structure_json`.
  - generacion `render_json`.
  - export PNG.
  - futuro export MOV/timeline.

Futuro timeline/MOV:

- Mantener export PNG como base.
- Crear JSON de timeline:
  - pagina fisica
  - duracion
  - orden
  - posible entrada/salida
  - offsets/animacion
- Integrar FFmpeg para generar MOV a partir de PNG sequence.
- Decidir si la timeline exporta:
  - solo montaje de PNGs estaticos
  - animaciones por pagina
  - scroll/roll real
  - transiciones

## Recomendacion para el siguiente hilo

Prompt sugerido:

```text
Lee HANDOFF.md y web_app/README.md. Queremos continuar el proyecto Creditos desde el estado actual, sin rehacer la web app. El siguiente objetivo es preparar una version Electron minima que mantenga todas las funciones actuales y abra/lance el parser automaticamente.
```

Si el siguiente objetivo no es Electron, cambiar la ultima frase por la tarea concreta.

## Comandos utiles

Chequeo JS rapido:

```bash
osascript -l JavaScript -e 'ObjC.import("Foundation"); const src = $.NSString.stringWithContentsOfFileEncodingError("/Volumes/SD_02/PROYECTOS/CREDITOS/web_app/app.js", $.NSUTF8StringEncoding, null).js; new Function(src);'
```

Chequeo Python:

```bash
PYTHONPYCACHEPREFIX=/tmp/creditos_pycache python3 -m py_compile web_app/server.py
```

Estado git:

```bash
git status --short
```

Arrancar servidor:

```bash
python3 web_app/server.py
```
