# Créditos

Aplicación local Electron para importar Excels de créditos, organizar cartelas, previsualizar páginas y exportar PNG/MOV.

## Estado operativo

- Rama activa y canónica: `main`.
- Aplicación activa: `Creditos`.
- Base de datos activa: `data/creditos.db`.
- Destino de sincronización de la DB: `origin/main`.
- Las ramas `deprecated/*` conservan el histórico anterior y no deben usarse para trabajo nuevo.

La persistencia usa la base SQLite versionada `data/creditos.db`: primer nivel `productions`, segundo nivel `episodes`.

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
