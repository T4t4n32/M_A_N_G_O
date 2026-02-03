# scripts/run-local.sh
#!/bin/bash

echo "🚀 INICIANDO ENTORNO LOCAL M.A.N.G.O."
echo "======================================"

# 1. Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Instala Docker primero."
    exit 1
fi

# 2. Iniciar base de datos
echo "🐘 Iniciando PostgreSQL y Redis..."
docker-compose up -d postgres redis

# 3. Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a PostgreSQL..."
sleep 3
until docker-compose exec postgres pg_isready -U mango_user &> /dev/null; do
    echo "   PostgreSQL aún no está listo, esperando..."
    sleep 2
done
echo "✅ PostgreSQL listo!"

# 4. Activar entorno virtual si existe
if [ -d "venv" ]; then
    echo "🐍 Activando entorno virtual..."
    source venv/bin/activate
else
    echo "📦 Creando entorno virtual..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r backend/requirements.txt
fi

# 5. Cargar variables de entorno
echo "🔧 Cargando configuración..."
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "⚠️  Archivo .env.local no encontrado, usando valores por defecto"
    export DATABASE_URL="postgresql://mango_user:local_password@localhost:5432/mango_local"
    export SECRET_KEY="local-dev-secret"
fi

# 6. Verificar estructura de backend
if [ ! -f "backend/main.py" ]; then
    echo "❌ Archivo backend/main.py no encontrado"
    exit 1
fi

# 7. Iniciar Flask
echo "🔥 Iniciando Flask API..."
echo ""
echo "📡 URLs importantes:"
echo "   • Flask API:      http://localhost:5000"
echo "   • PgAdmin:        http://localhost:5050 (admin@local.com / admin123)"
echo "   • Frontend Local: file://$(pwd)/frontend/index.html"
echo ""
echo "🔄 Presiona Ctrl+C para detener"
echo ""

cd backend
python main.py