

## Plan: Rediseñar la sección de Contribuyentes Clave

### Problema
Los contribuyentes están en un `BorderGlow` simple con lista plana, lo cual no les da protagonismo frente a la tarjeta inmersiva de UNEARTHED al lado.

### Propuesta
Convertir la sección de contribuyentes en una experiencia visual con **ProfileCards con tilt 3D** para los Pilares Fundamentales (padres) y **SpotlightCards** interactivas para los demás contribuyentes, todo sobre un fondo con partículas sutiles o un gradiente animado que le dé vida propia.

### Cambios

**Archivo: `src/components/AboutSection.tsx`**

1. **Pilares Fundamentales → ProfileCards side-by-side**: Reemplazar la lista simple de los padres por dos `ProfileCard` con efecto tilt 3D, usando sus fotos como avatar, con nombre, rol y un gradiente cálido (tonos dorados/ámbar para diferenciar del accent teal de UNEARTHED). Los ProfileCards se muestran en fila horizontal centrada.

2. **Mención Honorífica**: Mantener el collapsible exactamente como está (texto, cita, estructura), pero envolver en un `SpotlightCard` con un color spotlight dorado sutil para que brille al hover.

3. **Contribuyentes individuales → Grid de SpotlightCards**: Convertir la lista `<ul>` en un grid `grid-cols-2` donde cada contribuyente tiene su propia `SpotlightCard` con el avatar/inicial, nombre y rol. Cada tarjeta tiene bordes suaves (`rounded-2xl`), fondo glassmorphism (`bg-white/[0.03] backdrop-blur-sm`), y spotlight al hover.

4. **Fondo diferenciado**: Cambiar el contenedor de `BorderGlow` por un div con un gradiente radial propio (tonos más cálidos, como `hsl(35 80% 50% / 0.04)`) para que se diferencie visualmente del lado UNEARTHED. Mantener el `BorderGlow` pero con colores más cálidos (`['#f59e0b', '#fb923c', '#fbbf24']`).

5. **Título con animación**: El heading "Contribuyentes Clave" usa `DecryptedText` igual que el título principal, para consistencia y atención.

6. **Contenido y textos**: No se modifica ningún nombre, rol, descripción ni la estructura del collapsible de Mención Honorífica. Solo cambia la presentación visual.

### Resultado visual

```text
┌─────────────────────────────────┐
│      ✦ Contribuyentes Clave    │  ← DecryptedText
│                                 │
│   ┌──────────┐  ┌──────────┐   │
│   │ ProfileCard│  │ProfileCard│  │  ← Padres con tilt 3D
│   │  Héctor   │  │ Yamileth │   │
│   └──────────┘  └──────────┘   │
│                                 │
│  ┌─ Mención Honorífica ──────┐ │  ← SpotlightCard collapsible
│  │  Nini Geohana Chacón      │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │ Samuel   │  │ Víctor   │    │  ← SpotlightCard grid
│  │ Monsalve │  │ Perilla  │    │
│  ├──────────┤  ├──────────┤    │
│  │ Richard  │  │ CALIBOTS │    │
│  │ Suarez   │  │ Submerge │    │
│  └──────────┘  └──────────┘    │
└─────────────────────────────────┘
```

### Archivos modificados
- `src/components/AboutSection.tsx` — rediseño completo de la mitad de contribuyentes

