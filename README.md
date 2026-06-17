# Créditos

Aplicación local Electron para importar Excels de créditos, organizar cartelas, previsualizar páginas y exportar PNG/MOV.

La persistencia de proyecto usa una base de datos SQLite global versionada en `data/creditos.db`: primer nivel `productions`, segundo nivel `episodes`.

## Estructura

```text
apps/
  desktop/    App Electron: ventanas, diálogos nativos, empaquetado
  renderer/   UI, preview, parser XLSX y exportadores
test/         Fixtures compartidos para probar en Mac y PC
docs/         Documentación técnica y handoffs
```

## Flujo de proyecto

1. Crea una producción indicando cuántos episodios debe generar.
2. Selecciona producción y episodio.
3. Importa el XLSX del episodio.
4. Los cambios de estructura/render/estilos se autoguardan en `data/creditos.db`.

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
