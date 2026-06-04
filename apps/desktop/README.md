# Créditos Desktop

App Electron de Créditos. Usa `apps/renderer` como interfaz y servidor local.

## Desarrollo

```bash
cd apps/desktop
npm install
npm start
```

En macOS también puedes abrir:

```text
apps/desktop/start.command
```

## Empaquetar

```bash
npm run pack
```

El resultado queda en `apps/desktop/dist/`.

## Notas

- Electron arranca `apps/renderer/server.py` en un puerto libre y lo cierra al salir.
- Los diálogos de abrir/guardar/exportar son nativos.
- La exportación MOV necesita `ffmpeg` instalado.
