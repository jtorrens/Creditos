# Créditos

Aplicación local para importar Excels de créditos, organizar cartelas, previsualizar páginas y exportar PNG/MOV.

## Estructura

```text
apps/
  desktop/    App Electron: ventanas, diálogos nativos, empaquetado
  renderer/   UI, preview, parser XLSX y exportadores
test/         Fixtures compartidos para probar en Mac y PC
JSON/         Material antiguo de referencia
docs/        Documentación técnica y handoffs
```

## Desarrollo

### App de escritorio

```bash
cd apps/desktop
npm install
npm start
```

Para empaquetar:

```bash
npm run pack
```

En macOS también puedes abrir `apps/desktop/start.command`.

### Renderer en navegador

```bash
python3 apps/renderer/server.py
```

Después abre la URL local que indique la terminal.

## Flujo Mac/PC

Trabaja siempre desde la raíz del repo y sincroniza con Git:

```bash
git pull
# trabajar
git status
git add ...
git commit -m "Mensaje"
git push
```

No se versionan builds ni vídeos generados: `dist/`, `.app`, `.mov` y `test/renders/` quedan fuera.

Consulta `DEVELOPMENT.md` para requisitos detallados de macOS/Windows, builds y variables de entorno.
