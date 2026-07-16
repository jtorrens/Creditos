# Sincronizacion Mac/PC y compilacion

Estas instrucciones son para mantener en paridad el checkout refactorizado de Creditos entre Mac y PC.

## Reglas del proyecto

- Usar siempre la rama `main`.
- La base de datos canónica es `data/creditos.db`.
- No usar ramas `deprecated/*` ni recrear `data/creditos-refactor.db`; pertenecen al histórico anterior.
- No versionar `node_modules/`, `apps/desktop/dist/`, `.app`, `.dmg`, `.exe`, `.msi` ni otros builds generados.
- Git se usa como transporte manual de snapshots de la DB, no como sincronizacion automatica.
- No editar en Mac y PC a la vez. El flujo esperado es: subir snapshot desde una maquina, bajar snapshot en la otra.

## Primera instalacion en PC

1. Clonar el repositorio:

```powershell
git clone <URL_DEL_REPOSITORIO> CREDITOS_REFACTOR
cd CREDITOS_REFACTOR
```

2. Confirmar la rama activa:

```powershell
git fetch origin
git switch main
```

3. Instalar dependencias desde la app Electron:

```powershell
cd apps\desktop
npm install
```

4. Arrancar la app:

```powershell
npm start
```

En Windows la app debe usar `py` para arrancar el servidor Python. Si hiciera falta forzarlo:

```powershell
$env:CREDITOS_PYTHON="py"
npm start
```

## Actualizar codigo en PC

Desde la raiz del checkout:

```powershell
git status
git fetch origin
git pull --ff-only
```

Si `git status` muestra cambios locales no esperados, resolverlos antes de hacer `pull`.

## Bajar la DB mas reciente en PC

La bajada de la DB debe hacerse desde la interfaz de la app, no con comandos manuales.

1. Abrir la app.
2. Ir al panel de sincronizacion de base de datos.
3. Confirmar que muestra:
   - DB activa: `data/creditos.db`
   - Rama target: `origin/main`
4. Pulsar la accion de bajar/descargar DB.
5. Esperar el modal de proceso.
6. Aceptar solo cuando aparezca confirmacion de exito.

La app crea backup timestamped antes de bajar la DB y valida la base con `PRAGMA quick_check`. Si la validacion falla, restaura el backup y muestra error.

## Subir la DB desde PC

Antes de subir:

1. Cerrar cualquier uso activo de la app en el otro equipo.
2. Verificar en la UI que la DB activa es `data/creditos.db`.
3. Verificar que la rama target es `origin/main`.
4. Pulsar la accion de subir/publicar DB.
5. Esperar el modal de proceso.
6. Confirmar que termina en estado sincronizado.

La app bloquea la subida si:

- El canal no es `refactor` o la rama no es `main`.
- La DB activa no se llama `creditos.db`.
- La validacion SQLite falla.
- Hay un estado Git de error.
- Hay commits locales ahead que ya afectan a la DB.

## Compilar en PC

Desde `apps\desktop`:

```powershell
npm run pack
```

Para generar instalador/distribuible:

```powershell
npm run dist
```

Los builds quedan en `apps\desktop\dist\` y no deben subirse a Git.

Si no hay certificado valido, el build puede quedar sin firmar. Eso es esperado mientras no se configure un certificado de firma.

## Flujo recomendado para mantener paridad

En la maquina donde acabas de trabajar:

1. Abrir la app.
2. Subir/publicar DB desde la UI.
3. Confirmar estado verde sincronizado.
4. Cerrar la app.
5. Subir cambios de codigo si los hay:

```powershell
git status
git add <archivos>
git commit -m "Mensaje descriptivo"
git push origin main
```

En la otra maquina:

1. Actualizar codigo:

```powershell
git fetch origin
git pull --ff-only
```

2. Abrir la app.
3. Bajar/descargar DB desde la UI.
4. Confirmar estado verde sincronizado.
5. Compilar si hace falta:

```powershell
cd apps\desktop
npm run pack
```

## Comprobaciones rapidas

Desde la raiz:

```powershell
git branch --show-current
git status
```

La rama debe ser:

```text
main
```

La DB esperada debe existir:

```powershell
Test-Path data\creditos.db
```

La app debe arrancar desde:

```powershell
cd apps\desktop
npm start
```

## Recuperacion ante errores

- Si la UI marca error de Git, no subir ni bajar DB hasta resolver `git status`.
- Si falla una bajada de DB, revisar `data\db-backups\`; la app intenta restaurar automaticamente el backup previo.
- Si la sincronización muestra una rama distinta de `origin/main`, detenerse y revisar el checkout.
- Si el build falla despues de actualizar codigo, ejecutar `npm install` de nuevo en `apps\desktop`.
