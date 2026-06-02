# Google Sheets extension: Creditos JSON

Esta carpeta contiene una primera extension de Google Apps Script para extraer la hoja activa a JSON.

Esta pensada para libros con varias series o capitulos, donde cada pestana de Google Sheets puede ser un capitulo distinto. Antes de ejecutar la extraccion, selecciona la hoja/pestana del capitulo que quieras exportar.

## Instalacion manual

1. Abre el Google Sheet.
2. Ve a `Extensiones > Apps Script`.
3. Crea/pega estos archivos:
   - `Code.gs`
   - `Dialog.html`
4. En `Configuracion del proyecto`, activa la visualizacion del manifiesto y sustituye el contenido por `appsscript.json`.
5. Guarda el proyecto y recarga el Google Sheet.
6. Usa el menu `Creditos JSON`.

## Funciones

- `Ver / descargar JSON de hoja activa`: muestra el JSON de la pestana activa en un dialogo, permite copiarlo o descargarlo.
- `Guardar JSON de hoja activa en Drive`: crea un archivo `*_credits.json` en Drive, en la misma carpeta que el Spreadsheet.

## Reglas implementadas

- Columnas relevantes: A:D.
- Columna A: numero de grupo/cartela.
- Grupos numericos repetidos: se unen en una misma cartela.
- `Han intervenido` y `Pequenas Partes`: actor en B, personaje en D.
- `RODILLO FINAL`: cargo en B, nombre en D; filas posteriores con D y B vacio continuan el cargo anterior.
- Celdas fusionadas `B:D`: se tratan como secciones o lineas especiales.
- Filas `#VALUE!`, `VOLSKWAGEN`, `#VALUE!`: se agrupan en `Logos`.
- `Licencias Musicales`: conserva las lineas tal como vienen.
- `AGRADECIMIENTOS`: separa subsecciones por cabeceras en negrita.

## Nota

Esto es una extension ligada a un Spreadsheet concreto. Si quieres publicarla como add-on instalable para muchos documentos, el mismo codigo puede ser la base, pero habria que preparar despliegue, permisos y versionado.
