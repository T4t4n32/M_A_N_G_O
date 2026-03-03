Patch coherente con tu estructura real (según tu file tree):
- Dockerfile/requirements/wsgi/entrypoint/db_init están en backend/
- compose.yaml y compose.rx.yaml viven en la raíz
- nginx/default.conf vive en nginx/
- mango (hub) vive en la raíz

Aplicación (paso a paso):
1) Copia estos archivos a la raíz (reemplazando):
   - compose.yaml
   - compose.rx.yaml
   - mango
   - nginx/default.conf
2) chmod +x ./mango
3) (si no tienes .env) cp .env.example .env
4) ./mango up
5) ./mango dummy-on
6) ./mango doctor

Para servir la UI de Lovable:
- En .env: UI_DIR=./lovable_ui/MANGO_PAGE_LOVABLE_V1.3/dist
- Asegúrate de que exista dist/index.html (npm run build dentro de la carpeta Lovable)

URLs:
- UI:   http://localhost:8080/
- API:  http://localhost:8000/api/v1/health
- Data: http://localhost:8080/api/v1/latest/by_type
