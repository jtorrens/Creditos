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
5. En `Estructura`, la app crea por defecto una cartela por bloque de diseno.
6. Selecciona una cartela y usa `Anadir bloque` para juntar varios bloques en una misma cartela.
7. Ajusta orientacion:
   - `Horizontal`: cargo a la izquierda, nombre a la derecha.
   - `Vertical`: cargo arriba, nombre abajo.
8. Ajusta `Columnas` para distribuir los bloques dentro de la cartela.
9. Edita textos o titulos en el panel central solo si hace falta una correccion puntual.
10. En bloques largos usa `Anadir salto de pagina` entre items para dividir ese bloque en paginas internas de render.
11. Revisa `Preview` para ver cartelas, paginas y divisiones internas de bloque.
12. Si un bloque fuente debe funcionar solo como titulo de cartela, copia/usa ese texto en `Titulo cartela` y desactiva `Incluir en salida` en la cartela original.
13. En `Ajustes`, usa `Guardar` o `Guardar como` para conservar el `structure_json`.
14. En `Preview`, usa `Guardar` o `Guardar como` para generar el `render_json`.

Para arrancar sin abrir el navegador automaticamente:

```bash
python3 web_app/server.py --no-open
```

Para parsear `.xlsx` y guardar con selector de archivo necesitas el servidor local en Chrome.

## Estado actual

- Carga `.xlsx` y lo parsea a `source_json` en memoria.
- Genera estructura inicial automaticamente como `cartelas`.
- Pestanas: `Ajustes`, `Estructura`, `JSON`, `Preview` y `PDF`.
- Ajustes comunes: duracion por defecto, lineas antes de salto automatico, tipografia base e interlineado/gaps base.
- Margen superior de pagina para la previsualizacion PDF/render.
- Tipografia base para cabecera, titulo de bloque, cargo y nombre: tamano, fuente, estilo y color.
- Carga fuentes del sistema en Chrome mediante permiso del usuario; el JSON guarda familia, estilo y PostScript name.
- Permite juntar varios bloques fuente en una misma cartela.
- Panel central tipo preview con campos editables.
- Orientacion horizontal/vertical por cartela.
- Orientacion vertical por defecto en cartelas tipo card, licencias, agradecimientos, logos/cierre y bloques sin cargos en columna B.
- Numero de columnas por cartela.
- Multiplicador de tamano de letra por cartela, por defecto 1.
- Multiplicador de interlineado por cartela, por defecto 1.
- Numero de columnas por bloque, por defecto 1, para distribuir los items o temas dentro de ese bloque.
- Alineacion por bloque: cargo/nombre en bloques con pares, o texto unico en bloques simples.
- Si una estructura previa referencia bloques que no existen en el XLSX actual, la cartela queda excluida por defecto.
- Un bloque de diseno solo puede pertenecer a una cartela; al anadirlo a otra se mueve.
- Saltos de pagina internos por bloque/material, guardados en `structure_json`.
- En `Preview`, se pueden editar textos visibles, titulo de cartela, cabecera de pagina y titulo de bloque por pagina interna.
- En `Preview`, los bloques repiten su titulo en cada pagina interna; ese titulo puede borrarse o cambiarse de forma independiente.
- En `Preview`, los cargos repetidos por varias personas se muestran una vez por pagina interna; cada nombre sigue contando como linea independiente.
- En `Preview`, cargos y nombres no hacen wrap: el texto que no entra en su columna queda recortado.
- En `PDF`, previsualiza paginas fisicas 16:9 sin titulo tecnico de pagina ni titulo de cartela; los titulos de bloque vacios no reservan espacio.
- Los cargos con varios nombres se dividen en lineas independientes para preview, render y saltos de pagina.
- Divide `RODILLO FINAL` en bloques de diseno por secciones.
- Agrupa `Licencias Musicales` en temas separados por saltos de fila, tanto en preview como en `render_json`.
- Permite excluir cartelas de la salida sin borrarlas de la estructura.
- Permite cargar estructura previa.
- Permite editar titulos, cargos, nombres, actores, personajes y lineas.
- Guarda `structure_json` desde `Ajustes` y `render_json` desde `Preview`.

## Pendiente

- Reordenar paginas y items manualmente.
- Definir presets de estilo/layout.
- Generar IDs mas robustos si las filas del Excel cambian mucho.
