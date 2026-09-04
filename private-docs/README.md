# private-docs

Documentos del proyecto M.A.N.G.O. retirados de la superficie pública bajo el
**Protocolo Legal** (medida de contención).

Antes vivían en `frontend/public/docs/` y se servían sin autenticación en
`/docs/*`, junto con la ruta `/documentacion` y su teaser en el landing. Esa
superficie se eliminó para que la documentación técnica y los PDF del proyecto
no queden expuestos a descarga directa.

- No mover esta carpeta de vuelta a `frontend/public/`.
- El acceso interno a estos archivos es por el panel autenticado, no por el sitio público.
- nginx responde 404 a cualquier `/docs/*` como defensa en profundidad.
