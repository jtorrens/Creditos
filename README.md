# Créditos

Aplicación local Electron para importar Excels de créditos, organizar cartelas, previsualizar páginas y exportar PNG/MOV.

La persistencia de proyecto usa una base de datos SQLite global: primer nivel `productions`, segundo nivel `episodes`.

## Estructura

```text
apps/
  desktop/    App Electron: ventanas, diálogos nativos, empaquetado
  renderer/   UI, preview, parser XLSX y exportadores
test/         Fixtures compartidos para probar en Mac y PC
docs/         Documentación técnica y handoffs
```

## Flujo de proyecto

1. Selecciona o crea una base de datos `.db`.
2. Crea una producción indicando cuántos episodios debe generar.
3. Selecciona producción y episodio.
4. Importa el XLSX del episodio.
5. Guarda estructura/render/estilos en la base de datos.

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
