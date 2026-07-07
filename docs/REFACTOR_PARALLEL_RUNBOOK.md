# Creditos Refactor Parallel Runbook

## Contexto

`main` es producción. La rama `codex/refactor-parallel` vive en un checkout separado y no debe compartir DB runtime con producción.

Checkout recomendado:

```bash
git clone <repo-url> CREDITOS_REFACTOR
cd CREDITOS_REFACTOR
git checkout codex/refactor-parallel
```

Usar siempre rutas relativas al repo. No documentar ni fijar rutas absolutas de una máquina concreta.

Rama: `codex/refactor-parallel`

## Identidad de la app

La app de esta rama mantiene identidad separada:

```text
productName: Creditos Refactor
appId: com.jtorrens.creditos.refactor
channel: refactor
```

## DB

La DB runtime de Refactor es:

```text
data/creditos-refactor.db
```

No usar como default en esta rama:

```text
data/creditos.db
```

`data/creditos.db` pertenece al histórico/snapshot y a producción en `main`; la app Refactor debe arrancar con `creditos-refactor.db`.

## Arranque Electron

Desde:

```bash
cd apps/desktop
npm start
```

El proceso Electron detecta `Creditos Refactor`, fija `CREDITOS_APP_CHANNEL=refactor` para el servidor Python y resuelve la DB a `data/creditos-refactor.db`.

## Arranque renderer solo

Desde el repo:

```bash
./apps/renderer/start.command
```

Ese script exporta:

```text
CREDITOS_APP_CHANNEL=refactor
CREDITOS_DB_PATH=<repo>/data/creditos-refactor.db
```

## Checks

Comando agregado:

```bash
python3 scripts/check_refactor_safety.py
```

Validación completa habitual:

```bash
node --check apps/renderer/*.js apps/renderer/domain/*.js apps/renderer/preview/*.js apps/renderer/export/*.js apps/renderer/ui/field_controls/*.js apps/desktop/main.js apps/desktop/native/*.js apps/desktop/repair-electron.js apps/desktop/run-electron.js
python3 scripts/check_refactor_safety.py
cd apps/desktop && npm run pack
```

El aviso de firma macOS en `npm run pack` es esperado si no hay certificado válido.

## Importar y exportar

Importar créditos:

```text
Usar el botón Asociar archivo dentro de Creditos Refactor.
La subida XLSX/ODS usa /api/parse-xlsx y no depende de cgi.FieldStorage.
```

Exportar PNG/MOV:

```text
1. Confirmar que la DB visible contiene creditos-refactor.db.
2. Confirmar que el capítulo seleccionado es el de pruebas.
3. Usar un directorio de salida fuera de producción.
4. Para MOV, hacer primero una exportación corta.
```

## Sync DB

La sincronización de DB en Refactor debe apuntar a:

```text
origin/codex/refactor-parallel
```

Debe bloquear:

```text
origin/main
HEAD:main
data/creditos.db como DB runtime
```

Antes de usar los botones de DB en la app, confirmar en la pantalla de Producciones que se ve:

```text
data/creditos-refactor.db
rama origin/codex/refactor-parallel
```

Si la rama mostrada es `origin/main`, no usar botones de sincronización y parar la prueba.

El sync de DB es manual:

```text
Bajar de GitHub: para el servidor Python, crea backup timestamped en data/db-backups/, baja la DB, ejecuta PRAGMA quick_check y restaura el backup si la validación falla.
Subir a GitHub: ejecuta PRAGMA quick_check, bloquea main, bloquea una DB que no sea creditos-refactor.db y bloquea commits locales pendientes que ya afecten a la DB.
```

Si el estado Git de DB muestra error, no usar acciones de sync hasta corregirlo.

## QA manual mínima

1. Abrir `Creditos Refactor`.
2. Confirmar que la ruta de DB contiene `creditos-refactor.db`.
3. Confirmar que la rama de sync mostrada no es `origin/main`.
4. Seleccionar producción y episodio.
5. Importar XLSX estándar.
6. Importar ODS TRAZ si aplica.
7. Editar cartela.
8. Editar estilo.
9. Revisar preview páginas y scroll.
10. Exportar PNG.
11. Exportar MOV corto.
12. Probar controles tipográficos: tamaño, familia, estilo, color y Restablecer si hay override.

## Reportar diferencias contra main

Anotar:

```text
producción/capítulo
archivo importado
estilo/cartela afectada
captura o export PNG de main
captura o export PNG de refactor
pasos exactos para reproducir
```

No copiar la DB de producción a Refactor sin decisión explícita.

## Reglas

No hacer merge automático a `main`.

No usar sync DB contra `main`.

No cambiar el default de Refactor a `data/creditos.db`.
