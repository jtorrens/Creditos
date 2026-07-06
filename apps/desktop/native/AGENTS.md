# Native Main-Process Rules

Native modules run in Electron's main process.

Keep each module focused on one platform-facing responsibility: preferences, dialogs, server process lifecycle, database sync, or MOV export.

Renderer/domain rules do not belong here.
