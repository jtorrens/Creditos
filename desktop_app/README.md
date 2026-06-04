# Creditos Desktop

Electron wrapper minimo para la web app existente.

## Desarrollo

En macOS puedes hacer doble clic en:

```text
desktop_app/Creditos.app
```

Ese lanzador no abre una ventana de Terminal y se cierra al salir de Electron.

Para diagnostico, tambien puedes abrir:

```text
desktop_app/start.command
```

El script instalara dependencias la primera vez si hace falta.
Si la descarga de Electron se queda a medias, el script detecta que falta `node_modules/electron/path.txt` y reintenta la instalacion del binario.

O manualmente:

```bash
cd desktop_app
npm install
npm start
```

Electron arranca `web_app/server.py` automaticamente en un puerto libre, carga la web desde `127.0.0.1` y cierra el servidor al salir.

## Estado

- Reutiliza la web app actual sin reescribir el frontend.
- Integra dialogs nativos de Electron para:
  - abrir `structure_json`
  - guardar `structure_json`
  - guardar `render_json`
  - exportar PNG actual
  - exportar secuencia PNG a carpeta
  - exportar MOV ProRes 4444 con alpha
- El parseo XLSX sigue usando el servidor Python local, gestionado por Electron.
- La exportacion MOV necesita `ffmpeg` instalado. En macOS con Homebrew:

```bash
brew install ffmpeg
```

## Siguiente paso natural

Para empaquetar una app distribuible habra que decidir como incluir Python y sus dependencias, o convertir el parser en binario/proceso empaquetado.
