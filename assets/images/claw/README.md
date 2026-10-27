# Arte de la máquina — prototipo interactivo

Generado el 23/10/2026 con la herramienta integrada `image_gen`, usando la propuesta aprobada por el usuario como referencia. No se usó CLI ni se añadió una dependencia de generación a la app. Los PNG se copiaron sin retocarlos; las tres cápsulas se recortan visualmente en ejecución, sin modificar el atlas.

| Archivo | Uso |
| --- | --- |
| exterior.png | Acceso a la máquina, propuesta aprobada |
| chamber.png | Cámara vacía y riel, fondo opaco |
| claw-open.png | Garra abierta, transparencia |
| claw-closed.png | Garra cerrada, transparencia |
| capsules.png | Atlas horizontal de tres celdas: salvia, lavanda y ámbar |

La garra, cable y cápsulas se mueven por separado con React Native Animated. Controles y textos son elementos accesibles reales. Es arte de prototipo: no se garantiza cuadrícula idéntica entre sprites ni física de agarre; se usa alineación asistida. No contiene preguntas ni recompensas todavía.

Pulido posterior: el sprite abierto se divide en cabeza/brazos mediante ventanas de recorte en la interfaz para animar sus articulaciones. No se editaron los PNG. `claw-closed.png` se conserva como recurso original, pero ya no se superponen dos poses para cerrar la garra. La cápsula se mantiene en una sola capa durante toda la entrega y cambia de escala gradualmente.

Referencia y prompts del exterior/interior: `../../../docs/diseno/garra-pixel-v1/PROPUESTA.md`.

## Prompts de producción

### background

Fondo transparente: no. Referencia: interior aprobado.

Use case: stylized-concept. Image 1 is the approved style reference for a mobile pixel-art claw machine. Create a square game background asset showing ONLY the EMPTY glass chamber, front view. Match exact muted sage/cream/lavender/amber pixel art, dark green stepped outline, subtle botanical silhouettes and mint back wall. No screen header, no typography, no buttons or control console, NO CLAW, NO CABLE, NO TROLLEY, NO CAPSULES, no coins. Thin sage cabinet frame around all four edges; stationary metal horizontal rail near top (8% down). Clear unobstructed mint space fills center; floor at 88% down. A small dark collection hatch with lavender border centered at bottom, width 22% canvas, from 89% to 98% down, flush with bottom wall. Square canvas, fully opaque, fills edges, no margins. Pixel art intentional chunky square clusters and limited flat colors, no 3D, no blur, no watermark. This is an EMPTY compositable scene plate for movable sprites added by code, not a complete game screen.

### claw-open

Fondo transparente: sí. Referencia: interior aprobado.

Use case: stylized-concept. Image 1 style and claw reference. Create ONE isolated pixel-art OPEN claw sprite for this machine, on a genuinely transparent background. Same silver/lavender metal, charcoal-green outlines and sage highlights as reference. Frontal symmetrical mechanical claw: short centered vertical attachment stem at top, compact cylindrical silver head, two visibly spread curved gripping arms hanging left and right and a small straight rear prong in center. Empty space between arms, no capsule. Full sprite nearly fills square canvas with 8% clear padding all sides; top stem at 8%, tips at 92%. Crisp stepped pixel edges, consistent chunky pixel grid, restrained flat shading. NO rail, NO trolley, NO long cable, NO background, no floor shadow, no text, no other objects. This will be moved independently over the glass background.

### capsules

Fondo transparente: sí. Referencia: interior aprobado.

Use case: stylized-concept. Image 1 is style and capsule identity reference. Create ONE horizontal sprite atlas asset on a genuinely transparent background, aspect 3:1, divided conceptually into THREE equal SQUARE cells with NO drawn grid. Exactly three isolated two-piece capsule balls, one per cell, front view, each same size and orientation centered in its cell with 10% padding. First cell: muted sage green upper half and cream lower half. Middle cell: soft lavender upper half and cream lower half. Third cell: warm amber upper half and cream lower half. Each round capsule has dark green chunky stepped pixel outline, an equatorial seam, pixel highlight upper-left and minimal pixel shading; match approved reference's capsule style. No faces, no text, no shadows outside sprites, no background, no extra items. Centers at precisely 1/6, 1/2, 5/6 of canvas width and half of canvas height. Equal widths are critical for runtime clipping into three frames. Crisp pixel-art, not smooth vector/3D.

### claw-closed

Fondo transparente: sí. Referencia: garra abierta generada.

Use case: precise-object-edit. Image 1 is the open claw SPRITE to edit, not a full scene. Produce its CLOSED GRIPPING pose, preserving the exact square canvas, alpha transparency, top attachment stem, centered metal head, palette, pixel scale, vertical position, rendering style and size. Only rotate the two lower hinged arms inward so that their hooked tips point toward each other, enclosing an EMPTY round gripping space below the metal head. Keep a gap between tips about one-third of the original open span, sized to hold a ball added later by code. Do not join tips, do not draw a ball. The left/right hinges should remain at the same points. Same short rear center prong. Preserve full transparent padding and no floor shadow. No added cable, text, background, borders or objects. This is the second animation state of exactly the same pixel-art claw.
