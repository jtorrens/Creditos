# Animacion de propiedades de estilo por cartela

## Objetivo

Permitir que una cartela anime propiedades de estilo durante la entrada y la salida sin romper el modelo actual de estilos ni los overrides por cartela.

La referencia visual inicial es una transicion por cartelas con revelado vertical, cascada y borde suavizado. Por eso el modelo separa:

- la transicion visual de cartela;
- las propiedades internas del estilo que pueden interpolarse.

## Reglas de arquitectura

- La normalizacion vive en `apps/renderer/domain/styleAnimation.js`.
- `apps/renderer/domain/styles.js` solo cablea la normalizacion al modelo de estilos.
- El editor de estilos, los overrides de cartela, el preview y el export deben ir en modulos separados.
- No se debe añadir logica de animacion directamente a `app.js`.
- Estilos sin `animation` deben seguir cargando y guardando como antes.

## Modelo de datos

Cada estilo puede declarar:

```js
style.animation = {
  enabled: true,

  in: {
    durationMs: 600,
    delayMs: 0,
    easing: "cubic-bezier(0, 0, 0.2, 1)",
    mode: "cascade",
    direction: "topToBottom",
    featherPx: 80
  },

  out: {
    durationMs: 500,
    delayMs: 0,
    easing: "cubic-bezier(0.4, 0, 1, 1)",
    mode: "cascade",
    direction: "topToBottom",
    featherPx: 80
  },

  properties: {
    line_spacing: {
      animate: true,
      inValue: 1.45,
      outValue: 0.9
    },
    role_name_gap: {
      animate: true,
      inValue: 42,
      outValue: 8
    }
  }
}
```

El valor estable de cada propiedad no se duplica en `animation.properties`; sigue siendo el valor normal del estilo.

## Fases

- `in`: interpola desde `inValue` hasta el valor estable del estilo.
- estable: usa el valor normal del estilo.
- `out`: interpola desde el valor estable del estilo hasta `outValue`.

## Modos

```js
"together" | "cascade"
```

- `together`: toda la cartela progresa a la vez.
- `cascade`: el progreso se reparte espacialmente segun direccion.

## Direcciones

```js
"topToBottom" | "bottomToTop" | "leftToRight" | "rightToLeft"
```

Para creditos, las direcciones verticales son prioritarias. Las horizontales quedan disponibles para grafismos o composiciones laterales.

## Feather

`featherPx` suaviza el borde del efecto cuando `mode` es `cascade`. Pertenece a la transicion visual de cartela, no a cada propiedad animada.

## Propiedades animables iniciales

```js
line_spacing
column_gap
role_name_gap
source_group_gap
block_gap
block_title_gap
vertical_offset
page_top_margin
page_bottom_margin
page_left_margin
page_right_margin
opacity
scale
translate_x
translate_y
```

No se animan inicialmente:

```js
orientation
columns
alignment
auto_text_wrap
text_capitalization
repeat_block_titles
```

Estas propiedades cambian estructura o texto y pueden provocar saltos de layout.

## Overrides por cartela

El mismo bloque `animation` debe poder existir como override de cartela en una fase posterior. La resolucion debe ser:

1. defaults del dominio;
2. `style.animation`;
3. `cartela.animation`.

Los overrides de cartela deben ser explicitos, igual que los overrides actuales de estilo.

## Fases de implementacion

1. Contrato y normalizacion de `style.animation`.
2. UI del editor de estilos.
3. Override de animacion por cartela.
4. Resolver de animacion por frame/cartela.
5. Preview DOM/canvas.
6. Export animado.

## QA inicial

- Estilo sin `animation` carga y guarda sin cambios visuales.
- Estilo con `animation.enabled = true` conserva datos al guardar/cargar.
- Valores invalidos se normalizan sin romper el estilo.
- La primera prueba visual debe hacerse con una cartela tipo `keyboard` o equivalente con movimiento.
