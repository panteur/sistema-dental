#!/bin/bash

# ============================================
# Sistema Dental - Script de Instalación
# ============================================

set -e  # Exit on error

echo "============================================"
echo "  Sistema Dental - Instalación Automática"
echo "============================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funciones auxiliares
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Detectar directorio del proyecto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "📁 Directorio del proyecto: $PROJECT_DIR"
echo ""

# ============================================
# 1. Verificar dependencias
# ============================================
echo "1️⃣  Verificando dependencias..."

if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Instálalo primero."
    exit 1
fi
print_success "Node.js $(node -v) instalado"

if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado."
    exit 1
fi
print_success "npm $(npm -v) instalado"

if ! command -v mysql &> /dev/null; then
    print_warning "MySQL no está instalado. Instálalo manualmente."
fi

# ============================================
# 2. Solicitar configuración
# ============================================
echo ""
echo "2️⃣  Configuración del sistema..."
echo ""

# Base de datos
read -p "DB Host [127.0.0.1]: " DB_HOST
DB_HOST=${DB_HOST:-127.0.0.1}

read -p "DB Port [3306]: " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "DB Name [sistema_dental]: " DB_NAME
DB_NAME=${DB_NAME:-sistema_dental}

read -p "DB User [root]: " DB_USER
DB_USER=${DB_USER:-root}

read -sp "DB Password: " DB_PASSWORD
echo ""

# JWT Secret (generar automáticamente)
JWT_SECRET=$(openssl rand -base64 32)
echo "🔐 JWT_SECRET generado automáticamente"

read -p "JWT Expires In [7d]: " JWT_EXPIRES_IN
JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}

# Email
read -p "SMTP Host [smtp.gmail.com]: " SMTP_HOST
SMTP_HOST=${SMTP_HOST:-smtp.gmail.com}

read -p "SMTP Port [587]: " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-587}

read -p "SMTP User (email): " SMTP_USER
read -sp "SMTP Password (app password): " SMTP_PASS
echo ""

read -p "Email From [$SMTP_USER]: " EMAIL_FROM
EMAIL_FROM=${EMAIL_FROM:-$SMTP_USER}

# Servidor
read -p "Server IP (for frontend API URL): " SERVER_IP
NEXT_PUBLIC_API_URL="http://${SERVER_IP}:4000"

read -p "Backend Port [4000]: " PORT
PORT=${PORT:-4000}

read -p "Frontend Port [3000]: " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# ============================================
# 3. Instalar dependencias
# ============================================
echo ""
echo "3️⃣  Instalando dependencias..."

cd "$PROJECT_DIR/backend"
print_warning "Instalando dependencias del backend..."
npm install --production

cd "$PROJECT_DIR/frontend"
print_warning "Instalando dependencias del frontend..."
npm install --production

print_success "Dependencias instaladas"

# ============================================
# 4. Crear ecosystem.config.js
# ============================================
echo ""
echo "4️⃣  Creando configuración de PM2..."

cat > "$PROJECT_DIR/ecosystem.config.js" <<EOL
module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './backend',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        DB_HOST: '${DB_HOST}',
        DB_PORT: '${DB_PORT}',
        DB_NAME: '${DB_NAME}',
        DB_USER: '${DB_USER}',
        DB_PASSWORD: '${DB_PASSWORD}',
        JWT_SECRET: '${JWT_SECRET}',
        JWT_EXPIRES_IN: '${JWT_EXPIRES_IN}',
        SMTP_HOST: '${SMTP_HOST}',
        SMTP_PORT: '${SMTP_PORT}',
        SMTP_USER: '${SMTP_USER}',
        SMTP_PASS: '${SMTP_PASS}',
        EMAIL_FROM: '${EMAIL_FROM}',
        TZ: 'America/Santiago',
        PORT: '${PORT}'
      }
    },
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: '${FRONTEND_PORT}',
        NEXT_PUBLIC_API_URL: '${NEXT_PUBLIC_API_URL}'
      }
    }
  ]
}
EOL

print_success "ecosystem.config.js creado"

# ============================================
# 5. Configurar base de datos
# ============================================
echo ""
echo "5️⃣  Configurando base de datos..."

read -p "¿Crear base de datos '$DB_NAME'? (y/n) [y]: " CREATE_DB
CREATE_DB=${CREATE_DB:-y}

if [[ "$CREATE_DB" == "y" || "$CREATE_DB" == "Y" ]]; then
    echo "Creando base de datos..."
    mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    print_success "Base de datos '$DB_NAME' lista"
    
    read -p "¿Importar archivo SQL? (y/n) [n]: " IMPORT_SQL
    if [[ "$IMPORT_SQL" == "y" || "$IMPORT_SQL" == "Y" ]]; then
        read -p "Ruta del archivo SQL: " SQL_FILE
        if [[ -f "$SQL_FILE" ]]; then
            mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_FILE"
            print_success "Base de datos importada"
        else
            print_error "Archivo no encontrado: $SQL_FILE"
        fi
    fi
fi

# ============================================
# 6. Iniciar con PM2
# ============================================
echo ""
echo "6️⃣  Iniciando servicios con PM2..."

cd "$PROJECT_DIR"

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 no está instalado. Instalando..."
    npm install -g pm2
fi

# Detener procesos anteriores si existen
pm2 delete all 2>/dev/null || true

# Iniciar con ecosystem
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Configurar inicio automático
echo ""
echo "Configurando inicio automático..."
pm2 startup

print_success "Servicios iniciados con PM2"

# ============================================
# 7. Verificar servicios
# ============================================
echo ""
echo "7️⃣  Verificando servicios..."

sleep 5

# Check backend
if curl -s http://localhost:${PORT}/api/health > /dev/null; then
    print_success "Backend respondiendo en puerto $PORT"
else
    print_error "Backend no responde en puerto $PORT"
fi

# Check frontend
if curl -s http://localhost:${FRONTEND_PORT} > /dev/null; then
    print_success "Frontend respondiendo en puerto $FRONTEND_PORT"
else
    print_error "Frontend no responde en puerto $FRONTEND_PORT"
fi

# ============================================
# Finalización
# ============================================
echo ""
echo "============================================"
echo "  ✅ Instalación completada"
echo "============================================"
echo ""
echo "📋 Resumen:"
echo "  - Backend: http://${SERVER_IP}:${PORT}"
echo "  - Frontend: http://${SERVER_IP}:${FRONTEND_PORT}"
echo "  - API URL: ${NEXT_PUBLIC_API_URL}"
echo ""
echo "📝 Comandos útiles:"
echo "  - Ver estado: pm2 list"
echo "  - Ver logs: pm2 logs"
echo "  - Reiniciar: pm2 restart all"
echo ""
print_warning "IMPORTANTE: El archivo ecosystem.config.js contiene credenciales."
print_warning "Guárdalo en un lugar seguro y no lo compartas."
echo ""
