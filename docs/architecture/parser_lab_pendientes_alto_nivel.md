# Parser Lab: estado y pendientes a alto nivel

Fecha de corte: 23 de julio de 2026

Rama de referencia: `agent/parser-lab-model-workflow`

## Ejecutado en este hilo

- Reforzado el modelo de reglas, incluidas cabeceras ausentes, ambiguas o fuera de orden, trazabilidad de filas y composición.
- Cerrado el comportamiento de la cabecera como primer ítem y de las tres políticas contextuales de filas vacías.
- Incorporada una biblioteca JSON local de modelos con identidad estable, selección
  activa y operaciones de crear, duplicar, renombrar y borrar.
- Migrado una sola vez el modelo experimental previo, sin fallback al contrato retirado.
- Mejorada la navegación y sincronización entre tabla, bloques, editor y previo, incluyendo teclado, foco, scroll, filtros y redimensionado.
- Mejorados el comportamiento con hojas largas, la legibilidad visual y el responsive.
- Reducida de forma incremental la concentración de responsabilidades de la interfaz, sin reescrituras ni cambios compartidos.
- Validado el flujo real con una hoja de 605 filas, tres bloques y una composición multibloque en una cartela.
- Ejecutados los controles completos de arquitectura, seguridad y regresión; empaquetado y abierto `Creditos.app` versión `0.1.76`.
- Confirmado que `data/creditos.db`, los parsers y los modelos de producción permanecen intactos.

Cortes publicados:

- `d5ce723` — endurecimiento del flujo del modelo;
- `58434a6` — navegación y escalabilidad;
- `522b4fc` — separación de soporte de interfaz y responsive.

## Pendientes

No hay un P0 conocido. Los frentes abiertos son:

### P1 — Integración con la aplicación principal

- Guardar la definición activa en la base de datos principal, sin concepto de borrador temporal.
- Añadir el modelo de reglas como otra opción de importación para cada producción.
- Trasladar a la DB la identidad, revisión y selección ya definidas por la biblioteca local.

Este bloque cruza la frontera aislada de Parser Lab y requiere autorización específica.

### P1 — Cierre funcional

- Representar explícitamente inicio de hoja, final de hoja e inicio relativo al bloque anterior.
- Completar la validación con formatos y casos límite adicionales.
- Decidir si el alcance definitivo seguirá limitado a una hoja y a las columnas A–D.

### P2 — Robustez y escalabilidad

- Probar recuperación ante guardados interrumpidos o definiciones inválidas.
- Decidir si además de revisiones se necesita historial recuperable o deshacer.
- Garantizar fluidez con miles de filas y entre 30 y 100 bloques.
- Continuar simplificando la interfaz mediante cortes pequeños.

### P2–P3 — Validación final de UX/UI

- Confirmar con uso real que orientación, creación de ítems, roles y filas vacías se entienden sin ayuda.
- Completar la revisión de accesibilidad, ventanas estrechas, nombres largos y bloques extensos.

### P1 — Integración y liberación

- Incorporar los cortes terminados al PR de integración.
- Probar de extremo a extremo la selección y aplicación del modelo desde una producción.
- Ejecutar regresión combinada, actualizar versión y validar el ejecutable final.

## Orden recomendado

1. Acordar el contrato de integración y la propiedad del modelo en la DB.
2. Cerrar fronteras estructurales y casos límite.
3. Validar rendimiento y UX con archivos grandes.
4. Autorizar e implementar la integración con la aplicación principal.
5. Ejecutar la regresión y liberación combinadas.

## Criterio de cierre

Parser Lab estará listo para integrarse cuando el modelo tenga identidad y persistencia inequívocas, los casos representativos estén aprobados, el rendimiento sea suficiente, exista recuperación segura y la aplicación principal pueda seleccionarlo sin alterar los modelos existentes.

Hasta recibir autorización específica siguen fuera de alcance la DB activa, los modelos y parsers de producción, estructura, render, exportación, sincronización Git/DB y el código general compartido.
