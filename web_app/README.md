# Creditos JSON web app

Web app local para parsear Excel, visualizar y editar creditos.

## Modelo de tres JSON

### 1. `source_json`

Es el JSON fiel al Excel. Lo genera la app al abrir un `.xlsx`; no hace falta exportarlo en el flujo normal. Puede regenerarse cuando cambian erratas, nombres que faltaban o lineas sobrantes.

Ejemplo actual:

`JSON/TEST_rodillo_final_first_pass.json`

### 2. `structure_json`

Guarda las decisiones de estructura/editorial:

- cartelas
- paginas dentro de cada cartela
- referencias a uno o varios bloques fuente por pagina
- cartelas excluidas de salida
- orientacion de creditos: horizontal o vertical
- numero de columnas para distribuir los bloques dentro de la cartela
- saltos de pagina internos dentro de bloques largos
- overrides manuales
- notas futuras

Este archivo se conserva entre reimportaciones. Si el `source_json` cambia, la app intenta mantener la estructura mediante IDs de referencia.

### 3. `render_json`

Es la salida limpia para el script de After Effects o Fusion:

- paginas ordenadas
- textos ya resueltos con overrides
- layout por pagina
- datos listos para animacion/render

## Uso

### Opcion rapida en macOS

Haz doble clic en:

`web_app/start.command`

Esto arranca el servidor local y abre la app en Google Chrome. Para cerrar la app, cierra la ventana de Terminal o pulsa `Ctrl+C`.

### Opcion manual

1. Arranca el servidor local:

   ```bash
   python3 web_app/server.py
   ```

2. Se abrira automaticamente `http://127.0.0.1:8787`. Si no se abre, entra manualmente en esa URL.
3. Carga un `.xlsx`.
4. En `Ajustes`, define duracion de cartela por defecto, lineas antes de salto automatico y tipografia base.
   Usa `Carpeta estilos` para elegir la carpeta de estilos JSON de la produccion.
5. En `Estructura`, la app crea por defecto una cartela por bloque de diseno.
6. Selecciona una cartela y usa `Anadir bloque` para juntar varios bloques en una misma cartela.
7. Opcionalmente asigna un estilo a la cartela. Si una cartela usa estilo, sus controles visuales editan ese estilo cargado; al guardar el estilo se actualizan las demas cartelas/estructuras que lo referencien.
8. Ajusta orientacion:
   - `Horizontal`: cargo a la izquierda, nombre a la derecha.
   - `Vertical`: cargo arriba, nombre abajo.
9. Ajusta `Columnas`, alineaciones y titulo visible de bloque si hace falta.
10. Edita textos o titulos en el panel central solo si hace falta una correccion puntual.
11. En bloques largos usa la pestana `PNG` y los botones `+`/`-` para ajustar las lineas de la pagina visible.
12. Revisa `PNG` para ver cartelas, paginas y divisiones internas de bloque.
13. Si un bloque fuente debe funcionar solo como titulo de pagina o bloque, deja su contenido fuera de salida y escribe ese titulo en el campo correspondiente.
14. En `Ajustes`, usa `Guardar` o `Guardar como` para conservar el `structure_json`.
15. En `JSON`, usa `Guardar render` o `Guardar render como` para generar el `render_json`.

Para arrancar sin abrir el navegador automaticamente:

```bash
python3 web_app/server.py --no-open
```

Para parsear `.xlsx` y guardar con selector de archivo necesitas el servidor local en Chrome.

### Opcion Electron

La primera version de escritorio vive en `desktop_app/` y reutiliza esta web app como renderer:

```bash
cd desktop_app
npm install
npm start
```

Electron arranca y cierra `web_app/server.py` automaticamente. Tambien usa dialogs nativos para abrir/guardar JSON y exportar PNGs.

## Estado actual

- Carga `.xlsx` y lo parsea a `source_json` en memoria.
- Genera estructura inicial automaticamente como `cartelas`.
- Pestanas: `Ajustes`, `Estructura`, `JSON` y `PNG`.
- Ajustes comunes: duracion por defecto, lineas antes de salto automatico, tipografia base e interlineado/gaps base.
- Tamano de pagina en pixeles, color de fondo de visualizacion, margen superior/inferior y gap de bloques para la previsualizacion/render.
- Los campos de layout no tienen maximo artificial; el zoom del visor PNG permite trabajar con paginas UHD sin cambiar la exportacion real.
- Tipografia base para cabecera, titulo de bloque, cargo y nombre: tamano, fuente, estilo y color.
- Carpeta de estilos por produccion, con un JSON por estilo de cartela.
- Cada cartela puede referenciar un estilo por `style_id`.
- Los estilos guardan ajustes de cartela y un bloque visual global que se aplica a todos los bloques de la cartela.
- Carga fuentes del sistema en Chrome mediante permiso del usuario; el JSON guarda familia, estilo y PostScript name.
- Permite juntar varios bloques fuente en una misma cartela.
- Panel central tipo preview con campos editables; el ID tecnico del bloque queda separado del titulo visible de bloque.
- Orientacion horizontal/vertical por cartela.
- Orientacion vertical por defecto en cartelas tipo card, licencias, agradecimientos, logos/cierre y bloques sin cargos en columna B.
- Numero de columnas por cartela.
- Multiplicador de tamano de letra por cartela, por defecto 1.
- Multiplicador de interlineado por cartela, por defecto 1.
- Numero de columnas por bloque, por defecto 1, para distribuir los items o temas dentro de ese bloque.
- Alineacion por bloque: cargo/nombre en bloques con pares, o texto unico en bloques simples.
- Alineacion vertical por bloque para colocar el conjunto de bloques de la cartela arriba, centrado o abajo.
- Si una estructura previa referencia bloques que no existen en el XLSX actual, la cartela queda excluida por defecto.
- Un bloque de diseno solo puede pertenecer a una cartela; al anadirlo a otra se mueve.
- Ajustes de lineas por pagina interna, guardados en `structure_json`.
- En `PNG`, previsualiza una pagina fisica cada vez, con navegador lateral, titulo de pagina editable y botones `+`/`-` para ajustar las lineas de esa pagina sin cambiar el valor global.
- En `PNG`, muestra `lineas globales/lineas pagina`, permite definir nombre base y exportar la pagina actual o escribir todas en una carpeta como secuencia `nombre_base_###.png`.
- Los PNG exportados tienen fondo transparente; el color de fondo se usa solo para visualizar.
- Los titulos de pagina son vacios por defecto y no reservan espacio si no tienen texto.
- Los cargos con varios nombres se dividen en lineas independientes para render, PNG y saltos de pagina.
- Divide `RODILLO FINAL` en bloques de diseno por secciones.
- Agrupa `Licencias Musicales` en temas separados por saltos de fila, tanto en preview como en `render_json`.
- Permite excluir cartelas de la salida sin borrarlas de la estructura.
- Permite cargar estructura previa.
- Permite editar titulos, cargos, nombres, actores, personajes y lineas.
- Guarda `structure_json` desde `Ajustes` y `render_json` desde `JSON`.

## Pendiente

- Reordenar paginas y items manualmente.
- Definir presets de estilo/layout.
- Generar IDs mas robustos si las filas del Excel cambian mucho.
