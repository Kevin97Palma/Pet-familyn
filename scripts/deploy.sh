#!/bin/bash

# Pet-Family Deployment Script for AlmaLinux
# This script automates the deployment process

set -e

echo "🚀 Pet-Family Deployment Script"
echo "================================"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root for security reasons"
   exit 1
fi

# Variables
APP_DIR="/home/$(whoami)/pet-family"
SERVICE_NAME="pet-family"
DB_NAME="petfamily_db"
DB_USER="petfamily"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

if ! command_exists psql; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

if ! command_exists git; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

echo "✅ Prerequisites check completed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build application
echo "🏗️ Building application..."
npm run build 2>/dev/null || {
    echo "⚠️ Build script not found, compiling TypeScript directly..."
    npx tsc
}

# Create directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p public
mkdir -p logs

# Set permissions
chmod 755 uploads public logs

# Check database connection
echo "🔗 Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "❌ Cannot connect to database. Please check your DATABASE_URL"
    exit 1
fi

# Initialize database if needed
echo "🗄️ Initializing database..."
if [ -f "database/init.sql" ]; then
    psql "$DATABASE_URL" -f database/init.sql
    echo "✅ Database initialized"
else
    echo "⚠️ Database init script not found, skipping..."
fi

# Create systemd service file (requires sudo)
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=Pet Family Application
After=network.target postgresql.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node $APP_DIR/dist/server/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
echo "🔄 Configuring systemd service..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME

# Start service
echo "▶️ Starting application..."
sudo systemctl start $SERVICE_NAME

# Check service status
echo "📊 Checking service status..."
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ Pet-Family is running successfully!"
    echo "🌐 Application should be available at: http://localhost:5000"
else
    echo "❌ Service failed to start. Checking logs..."
    sudo systemctl status $SERVICE_NAME
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📝 Next steps:"
echo "  1. Configure Nginx as reverse proxy (optional)"
echo "  2. Set up SSL certificate (recommended for production)"
echo "  3. Configure firewall rules"
echo "  4. Set up backup scripts"
echo ""
echo "🔧 Useful commands:"
echo "  • View logs: sudo journalctl -u $SERVICE_NAME -f"
echo "  • Restart app: sudo systemctl restart $SERVICE_NAME"
echo "  • Stop app: sudo systemctl stop $SERVICE_NAME"
echo ""