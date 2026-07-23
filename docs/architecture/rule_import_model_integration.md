# Modelos manuales de importación

Fecha: 23 de julio de 2026

## Propiedad

Los modelos manuales de reglas son modelos de importación persistidos en SQLite.
La tabla `import_rule_models` conserva identidad, nombre, revisión, contrato JSON y
selección activa del editor. Cada producción selecciona el modelo que usa mediante
el `import_model_id` existente.

La biblioteca JSON de Parser Lab fue una persistencia de desarrollo. Su contenido
se migra una sola vez y no participa en la ejecución ni actúa como fallback.

## Flujo

1. Parser Lab edita el modelo almacenado en `import_rule_models`.
2. El resumen de proyecto combina importadores estáticos y modelos manuales.
3. La producción guarda el ID estable del modelo en `productions.import_model_id`.
4. La importación carga esa revisión desde la misma DB.
5. `rule_based_credits.py` normaliza ODS/XLSX, resuelve fronteras en orden e
   interpreta los términos.
6. El resultado se valida como `source_json`.
7. Materiales, estructura, render y Preview consumen el contrato estable existente.

## Variantes de trabajo por modelo

Los documentos `source`, `structure` y `render` se guardan por la clave compuesta
producción, capítulo y modelo de importación. Cambiar el modelo activo termina
primero cualquier autoguardado pendiente y carga la variante del modelo elegido.
Por tanto, sus asociaciones de estilos, cartelas, ajustes y paginación no se
sobrescriben entre el importador de IA, un importador estático y un modelo manual.

Las definiciones de estilo pertenecen a la producción y se comparten entre
variantes; cada `structure` conserva independientemente qué estilo aplica. El
vídeo de referencia pertenece al capítulo y también es común a todos los modelos.

La migración a esquema v3 asigna los documentos anteriores al
`import_model_id` declarado por su documento `source`. Solo si el origen no lo
declara usa el modelo seleccionado en la producción.

## Traslado asistido de presentación

Cartelas permite analizar otra variante de modelo o capítulo guardada en la misma
producción y aplicar su presentación al capítulo actual. Es una operación
confirmada y de mejor esfuerzo:

- el título normalizado, las filas de origen y el contenido identifican bloques
  equivalentes;
- una coincidencia razonable permite copiar estilo y overrides;
- una agrupación solo cambia con correspondencia exacta, completa y uno a uno;
- nunca se divide ni reordena una cartela por una aproximación;
- las imágenes existentes en el destino se conservan;
- las imágenes ausentes se copian cuando el destino es inequívoco;
- una cartela gráfica independiente se recrea únicamente si está anclada tras un
  bloque con correspondencia exacta;
- las imágenes ambiguas no se duplican.

Antes de aplicar, la interfaz resume coincidencias exactas y aproximadas,
agrupaciones, bloques sin cambios e imágenes que se copiarán. Cancelar conserva
íntegra la variante actual.

## Fallos explícitos

La importación se detiene si una frontera está ausente, fuera de orden o es
ambigua. No se elige silenciosamente una coincidencia y no se ejecutan contratos
anteriores. El ajuste se realiza en Parser Lab y crea una nueva revisión.

## Presentación

Los roles del modelo se proyectan sobre las categorías tipográficas existentes:

- `principal` → Nombre;
- `secondary` → Cargo;
- nombre del bloque → Título de bloque.

La orientación del bloque se conserva como pista de layout. Los saltos de página
derivados de filas vacías se trasladan a `structure.page_breaks`.

## Compatibilidad

Los importadores `standard_credits_xls` y `traz_credits_ods` no cambian su salida.
El importador manual es una familia registrada y solo se ejecuta cuando una
producción selecciona el ID de un registro de `import_rule_models`.
