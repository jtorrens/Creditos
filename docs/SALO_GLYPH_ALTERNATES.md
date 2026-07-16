# Formas alternativas OpenType

## Estado

Implementado en Créditos Refactor `0.1.61`.

La producción puede guardar una forma alternativa por categoría tipográfica, carácter base y fuente. El texto Unicode original no se modifica. La elección se aplica a preview, Canvas/PNG, PDF y MOV.

## Interfaz

En `Producciones > Tipografía`, cada categoría incluye una subcard `Formas alternativas`, plegable y cerrada por defecto. Al abrirla muestra automáticamente las alternativas de su fuente en dos grupos independientes:

```text
MAYÚSCULAS
Carácter       Base ○       Alternativa 1 ●
O                 O                  O

MINÚSCULAS
Carácter       Base ●       Alternativa 1 ○
o                 o                  o
```

Cada opción lleva un radio excluyente. Cabecera, Título de bloque, Cargo y Nombre guardan decisiones separadas aunque utilicen la misma fuente.

## Salo

La fuente Salo probada expone:

```text
opsz: 1..128
ss01: O y variantes acentuadas
ss02: o y variantes acentuadas
ss03: Q
```

Mayúsculas y minúsculas son decisiones independientes. Los diacríticos heredan la decisión de su letra base: una regla para `O` incluye `Ó`, `Ò`, `Ô`, `Õ`, `Ö`, etc.; una regla para `o` incluye sus equivalentes minúsculos.

## Persistencia

Las reglas viven en los ajustes globales de producción:

```json
{
  "glyph_alternates": [
    {
      "category": "page_header",
      "font": {
        "family": "Salo",
        "style": "Regular",
        "postscript_name": "Salo-Regular"
      },
      "character": "O",
      "characters": ["O", "Ò", "Ó", "Ô", "Õ", "Ö"],
      "feature": "ss01"
    }
  ]
}
```

La regla está asociada a la categoría y a la identidad de la fuente. No afecta a las demás categorías ni familias.

## Arquitectura

- `apps/desktop/native/fontAlternates.js`: analiza GSUB con `fontkit`.
- `apps/renderer/domain/settings.js`: normaliza `glyph_alternates`.
- `apps/renderer/appGlyphAlternates.js`: administra fuentes locales, caché, persistencia y caras CSS derivadas.
- `apps/renderer/ui/glyphAlternatesTable.js`: inventario visual con radios por categoría.
- `apps/renderer/preview/canvasPreview.js`: usa la familia efectiva en medición y dibujo.
- `apps/renderer/appPageExport.js`: espera a que las caras derivadas estén cargadas antes de exportar.

El renderer obtiene los bytes mediante `queryLocalFonts()` y `FontData.blob()`. No se guarda una ruta absoluta ni se incluye el archivo de fuente en el proyecto.

## Render

Aplicar `font-feature-settings` directamente al elemento `<canvas>` no afecta a `fillText()`. La implementación crea una cara `@font-face` local derivada con:

```css
@font-face {
  font-family: "CreditosGlyphAlt…";
  src: local("Salo-Regular"), local("Salo");
  font-feature-settings: "ss01" 1;
  unicode-range: U+4F, U+D2, U+D3, U+D4, U+D5, U+D6;
}
```

Esta cara se coloca antes de la fuente base en la familia efectiva. Chromium la usa solo para el carácter configurado y respeta la misma selección en DOM y Canvas.

## Licencia

Créditos utiliza la fuente instalada o activada en el equipo. Salo no debe incluirse en Git, instaladores, fixtures ni recursos de la aplicación.
