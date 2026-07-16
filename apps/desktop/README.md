# Créditos Desktop

App Electron de Créditos. Usa `apps/renderer` como interfaz y servidor local.

## Desarrollo

```bash
cd apps/desktop
npm install
npm start
```

`npm run dev` es equivalente a `npm start`.

En macOS también puedes abrir:

```text
apps/desktop/start.command
```

## Empaquetar

```bash
npm run pack
npm run dist
```

El resultado queda en `apps/desktop/dist/`.

También existen targets explícitos:

```bash
npm run dist:mac
npm run dist:win
```

## Notas

- Electron arranca `apps/renderer/server.py` en un puerto libre y lo cierra al salir.
- Los diálogos de abrir/guardar/exportar son nativos.
- La aplicación empaquetada incluye `ffmpeg` para que la exportación MOV funcione al abrirla desde Finder, el Dock o el menú Inicio.
- El panel de sincronización diferencia el código, la versión del esquema SQLite y los datos editados por el usuario.
- Variables opcionales:
  - `CREDITOS_PYTHON`
  - `CREDITOS_FFMPEG`
  - `CREDITOS_FFPROBE`
