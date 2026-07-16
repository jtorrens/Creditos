# Creditos Refactor QA Matrix

Estado de esta matriz:

```text
branch: main
app: Creditos Refactor
db esperada: data/creditos.db
sync esperado: origin/main
validacion P1: usuario reporta "aparentemente todo bien" el 2026-07-06
```

La matriz sigue siendo el checklist de regresion manual para repetir despues de cortes grandes de P3.

## Checklist

| Flujo | Pasos | Resultado esperado | Estado | Observaciones |
|---|---|---|---|---|
| Arranque | Abrir Electron desde `apps/desktop` con `npm start`. | La app abre como `Creditos Refactor`. | Pendiente | Confirmar que no abre la app de producción. |
| DB activa | Abrir Producciones. | La ruta visible contiene `data/creditos.db`. | Pendiente | Si aparece `creditos-refactor.db`, detener pruebas. |
| Rama sync | Consultar estado DB. | La rama visible es `origin/main`. | Pendiente | Debe usar exclusivamente `creditos.db`. |
| Producción | Crear o seleccionar una producción. | La selección se conserva y carga episodios. | Pendiente | Usar DB refactor. |
| Episodio | Crear o seleccionar episodio. | El episodio carga sin errores. | Pendiente | Revisar que no se pisa otro episodio. |
| XLSX estándar | Importar fixture XLSX estándar. | Se generan bloques/materiales/cartelas. | Pendiente | Cubierto parcialmente por golden parser. |
| ODS TRAZ | Importar fixture ODS TRAZ. | Se genera `source_json` válido. | Pendiente | Cubierto parcialmente por golden parser. |
| Cartela | Editar título, notas, imágenes y fuente asociada. | Cambios visibles en editor y preview. | Pendiente | Probar reset de overrides. |
| Estilo | Editar color, tipografía, alineación y vertical align. | Overrides conservan el resto del estilo. | Pendiente | Bug histórico corregido durante refactor. |
| Preview páginas | Abrir Preview en modo páginas. | Páginas renderizan sin errores. | Pendiente | Probar zoom y márgenes. |
| Preview scroll | Cambiar MOV a scroll. | La animación se ve y sincroniza página actual. | Pendiente | Probar play/seek. |
| Video referencia | Asociar video de referencia. | Se ve en preview/export si está activado. | Pendiente | Probar limpiar video. |
| PNG actual | Exportar PNG de página actual. | Archivo generado correctamente. | Pendiente | Comparar tamaño y contenido. |
| PNG rango | Exportar rango de páginas. | Carpeta contiene la secuencia esperada. | Pendiente | Revisar nombres y comparar contra una exportación de referencia. |
| MOV corto | Exportar MOV corto en páginas. | MOV se genera y se puede abrir. | Pendiente | Probar H.264 o ProRes según disponibilidad. |
| MOV scroll | Exportar MOV corto en scroll. | MOV se genera con movimiento continuo. | Pendiente | Revisar frames inicial/final. |
| Sync bajar | Usar solo si DB muestra `origin/main`. | Baja `creditos.db` desde `origin/main`. | Pendiente | Confirmar que crea backup local. |
| Sync subir | Usar solo si DB muestra `origin/main`. | Sube un commit exclusivo de DB a `main`. | Pendiente | Confirmar `PRAGMA quick_check`. |

## Criterio de parada

Detener QA y corregir antes de seguir si ocurre cualquiera de estos casos:

```text
La app muestra data/creditos-refactor.db como DB runtime.
La app muestra una rama distinta de origin/main como rama de sync.
El sync intenta usar una DB distinta de creditos.db.
La app arranca con nombre o bundle de producción.
```
