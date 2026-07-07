# Créditos Renderer

Interfaz, parser XLSX, preview y exportadores de Créditos.

Normalmente se usa desde Electron (`apps/desktop`), pero también puede arrancarse en navegador para depurar.

## Arranque manual

```bash
python3 apps/renderer/server.py
```

En Windows usa:

```powershell
py apps\renderer\server.py
```

Para arrancar sin abrir navegador:

```bash
python3 apps/renderer/server.py --no-open
```

En Windows usa:

```powershell
py apps\renderer\server.py --no-open
```

En macOS también puedes abrir:

```text
apps/renderer/start.command
```

## Qué contiene

- `server.py`: servidor local y parser XLSX.
- `index.html`: estructura de la UI.
- `app.js`: composition root del renderer y cableado de estado.
- `appLifecycle.js`: ciclo de rebuild/render, tabs y preview JSON.
- `appSelectors.js`: lecturas derivadas de estado para estilos, cartela seleccionada y layout.
- `styles.css`: interfaz dark y layout de preview.

## Datos

Los fixtures compartidos viven en `test/`:

- `test/xls/`: Excels de capítulos.
- `test/estilos/`: JSON de estilos.
- `test/creditos_cap1.json`: estructura de prueba.
