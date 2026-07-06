# Creditos Refactor QA Matrix

Estado de esta matriz:

```text
branch: codex/refactor-parallel
app: Creditos Refactor
db esperada: data/creditos-refactor.db
sync esperado: origin/codex/refactor-parallel
```

## Checklist

| Flujo | Pasos | Resultado esperado | Estado | Observaciones |
|---|---|---|---|---|
| Arranque | Abrir Electron desde `apps/desktop` con `npm start`. | La app abre como `Creditos Refactor`. | Pendiente | Confirmar que no abre la app de producción. |
| DB refactor | Abrir Producciones. | La ruta visible contiene `creditos-refactor.db`. | Pendiente | Si aparece `creditos.db`, detener pruebas. |
| Rama sync | Consultar estado DB. | La rama visible es `origin/codex/refactor-parallel`. | Pendiente | Nunca debe aparecer `origin/main`. |
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
| PNG rango | Exportar rango de páginas. | Carpeta contiene la secuencia esperada. | Pendiente | Revisar nombres. Comparar contra main con `python3 scripts/compare_png_outputs.py <main> <refactor>`. |
| MOV corto | Exportar MOV corto en páginas. | MOV se genera y se puede abrir. | Pendiente | Probar H.264 o ProRes según disponibilidad. |
| MOV scroll | Exportar MOV corto en scroll. | MOV se genera con movimiento continuo. | Pendiente | Revisar frames inicial/final. |
| Sync bajar | Usar solo si DB muestra rama refactor. | Baja desde `origin/codex/refactor-parallel`. | Pendiente | No probar si aparece main. |
| Sync subir | Usar solo si DB muestra rama refactor. | Sube commit DB a rama refactor. | Pendiente | No probar con datos de producción. |

## Criterio de parada

Detener QA y corregir antes de seguir si ocurre cualquiera de estos casos:

```text
La app muestra data/creditos.db como DB runtime.
La app muestra origin/main como rama de sync.
El sync intenta hacer push a main.
La app arranca con nombre o bundle de producción.
```
