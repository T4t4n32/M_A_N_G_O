# scripts/setup-local.sh
#!/bin/bash

echo "🚀 Configurando entorno local M.A.N.G.O."

# 1. Crear entorno virtual Python
echo "📦 Creando entorno virtual Python..."
python3 -m venv venv
source venv/bin/activate

# 2. Instalar dependencias
echo "📦 Instalando dependencias Python..."
pip install --upgrade pip
pip install -r backend/requirements.txt

# 3. Iniciar PostgreSQL y Redis
echo "🐘 Iniciando PostgreSQL y Redis..."
docker-compose up -d postgres redis

# 4. Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a PostgreSQL..."
sleep 5
until docker-compose exec postgres pg_isready -U mango_user; do
    sleep 1
done

# 5. Cargar variables de entorno
echo "🔧 Configurando variables de entorno..."
if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
fi

# 6. Inicializar base de datos
echo "🗄️ Inicializando base de datos..."
docker-compose exec postgres psql -U mango_user -d mango_local -f /docker-entrypoint-initdb.d/init.sql

echo "✅ Configuración local completada!"
echo ""
echo "📋 COMANDOS ÚTILES:"
echo "   • Iniciar Flask:      python backend/main.py"
echo "   • Ver logs DB:        docker-compose logs postgres"
echo "   • Acceder a PgAdmin:  http://localhost:5050"
echo "   • Abrir frontend:     open frontend/index.html"
echo "   • Detener servicios:  docker-compose down"