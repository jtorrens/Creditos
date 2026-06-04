# Créditos

Aplicación local Electron para importar Excels de créditos, organizar cartelas, previsualizar páginas y exportar PNG/MOV.

## Estructura

```text
apps/
  desktop/    App Electron: ventanas, diálogos nativos, empaquetado
  renderer/   UI, preview, parser XLSX y exportadores
test/         Fixtures compartidos para probar en Mac y PC
docs/         Documentación técnica y handoffs
```

## Uso rápido

```bash
cd apps/desktop
npm install
npm start
```

Para empaquetar:

```bash
npm run pack
npm run dist
```

Más detalles en `docs/DEVELOPMENT.md`.
