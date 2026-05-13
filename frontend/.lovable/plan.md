# Plan: editor de textos publicable, medios por sección y SEO

Alcance acordado:
- Persistencia: queda lista para tu backend FastAPI. El botón **Publicar** llama a endpoints `/api/v1/admin/site-content` (textos), `/api/v1/admin/site-media` (medios) y `/api/v1/admin/seo`. Mientras no respondan, el frontend se queda con localStorage como respaldo y muestra estado "no publicado / publicado / error".
- Medios por sección Proyecto: imagen (con crop), video (mp4/webm), modelo 3D (`.glb/.gltf/.stl/.step`) y galería múltiple. Misma capacidad para los campos de imagen del resto de secciones (Hero, Sobre, Documentación, Contacto, Footer).
- SEO completo: title, description, OpenGraph (title/description/image), Twitter Card, canonical y robots — editables desde la pestaña Textos y reflejados en el `<head>` de la home.

## Estructura de archivos

```
src/lib/siteContent.ts        # ampliar: schema con media + seo, sync remoto
src/lib/siteMedia.ts          # NEW: queue de subida, crop, validación, persistencia
src/lib/siteSeo.ts            # NEW: aplica meta tags al <head> reactivamente
src/components/editor/
  ImageCropField.tsx          # NEW: subir + recortar (react-easy-crop)
  MediaField.tsx              # NEW: imagen / video / 3D / galería
  PublishBar.tsx              # NEW: estado + botón Publicar
src/components/ProjectSection.tsx   # render dinámico de medios por pestaña
src/components/HeroSection.tsx, AboutSection.tsx, ...   # usar MediaField values
src/pages/PanelEmmaDashboard.tsx    # tab Textos: secciones + SEO + PublishBar
index.html                    # quitar metas estáticas que ahora se inyectan
```

## Detalles técnicos

### 1. Modelo de datos (`siteContent.ts`)
- Añadir tipo de campo `media` con `accept` (`image|video|model|gallery`) y `multiple`.
- Para Proyecto se agrega un campo `project.<tab>.media` por cada pestaña.
- SEO se modela como sección `seo` con campos: `seo.title`, `seo.description`, `seo.canonical`, `seo.robots`, `seo.og.title`, `seo.og.description`, `seo.og.image`, `seo.twitter.card`, `seo.twitter.image`.
- Estado `dirty` en memoria por clave; `lastPublishedAt` en localStorage.

### 2. Subida de medios (`siteMedia.ts`)
- Cola con estados `queued|uploading|processing|ok|error` y `progress` 0–100.
- Persistencia local: imágenes/videos pequeños (<3 MB) como dataURL en localStorage; mayores → IndexedDB (`idb-keyval`) con clave estable. Esto evita romper la cuota.
- Validación de tipos (`image/*`, `video/mp4|webm`, `.glb/.gltf/.stl/.step`) y tamaño máx (50 MB).
- Crop opcional con `react-easy-crop` para imágenes; al guardar produce un blob recortado.
- Función `publish()` que para cada medio dirty hace `POST /api/v1/admin/site-media` (multipart). Si falla, mantiene local y marca error sin perder datos.

### 3. Componentes editor
- `ImageCropField`: drop/click, preview, slider de zoom, aspect ratio configurable por campo.
- `MediaField`: detecta tipo y renderiza editor adecuado. Para 3D usa `<model-viewer>` (ya disponible en `effects/ModelViewer.tsx`) para preview de `.glb/.gltf`; para `.stl/.step` muestra solo metadatos (sin preview, los renderiza el visor cuando exista).
- `PublishBar`: indicador "Sin cambios / Cambios sin publicar / Publicando… / Publicado hace X / Error".

### 4. Render público
- `ProjectSection.tsx`: para cada pestaña lee `project.<tab>.media`. Si hay valor, renderiza imagen, `<video controls>`, `<model-viewer>` o carrusel según el tipo. Si no hay, conserva el visual actual (3D para "¿Qué es?", placeholder para el resto).
- Resto de secciones: idem para los campos de imagen ya existentes.

### 5. SEO (`siteSeo.ts`)
- Hook `useSiteSeo()` que actualiza `document.title` y crea/actualiza tags `meta` y `link[rel=canonical]` con `data-managed="site-seo"` para que sean idempotentes.
- Limpia las metas estáticas duplicadas del `index.html` que el editor sustituye.
- En `Index.tsx` (página home) se monta el hook.

### 6. Backend API esperado (queda documentado en `siteContent.ts`)
- `GET /api/v1/admin/site-content` → `{ content: Record<string,string>, seo: {...}, updatedAt }`
- `PUT /api/v1/admin/site-content` (admin) → guarda textos + SEO.
- `POST /api/v1/admin/site-media` (multipart `file`, `key`, `meta`) → `{ url }`.
- `GET /api/v1/site-content` (público) → mismo shape para hidratar al cargar.
- Si los endpoints aún no existen el frontend captura 404/0 y mantiene la copia local; se muestra aviso "Backend no implementado".

### 7. Dependencias nuevas
- `react-easy-crop` (≈12 KB) para recorte.
- `idb-keyval` para almacenar blobs grandes localmente.

### 8. Accesibilidad y diseño
- Todos los inputs con `aria-label`, foco visible y soporte de teclado en drag-drop (ya existente).
- Respeta el tema marino y glassmorphism (semantic tokens).

## Riesgos
- Cuota localStorage (~5 MB): mitigado con IndexedDB para blobs.
- `.stl/.step` sin visor en frontend: se aceptan y publican, preview limitado.
- Sin backend, "Publicar" solo persiste localmente; comunicado claramente en la UI.
