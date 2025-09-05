# Pet-Family - Aplicación de Gestión de Mascotas

## Descripción
Pet-Family es una aplicación web completa para la gestión integral de mascotas y colaboración familiar. Permite a las familias administrar información de sus mascotas, registrar notas veterinarias, controlar vacunas, y compartir archivos relacionados con el cuidado de sus mascotas.

## Características Principales
- ✅ Gestión completa de perfiles de mascotas
- ✅ Sistema multi-familia con roles de usuario
- ✅ Registro de notas diarias y veterinarias  
- ✅ Control de vacunaciones y recordatorios
- ✅ Carga y almacenamiento de archivos/fotos
- ✅ Códigos QR para invitaciones familiares
- ✅ Dashboard con estadísticas y resúmenes
- ✅ Autenticación con email/contraseña
- ✅ API REST para desarrollo móvil

## Tecnologías
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript  
- **Base de Datos**: PostgreSQL con Drizzle ORM
- **Autenticación**: Sesiones con express-session
- **Almacenamiento**: Sistema de archivos local
- **UI**: Tailwind CSS + shadcn/ui

## Requisitos del Sistema
- AlmaLinux 8 o superior
- Node.js 18 o superior
- PostgreSQL 13 o superior
- Git

## Instalación en AlmaLinux

### 1. Preparar el Sistema

```bash
# Actualizar el sistema
sudo dnf update -y

# Instalar herramientas básicas
sudo dnf groupinstall "Development Tools" -y
sudo dnf install curl wget git -y
```

### 2. Instalar Node.js

```bash
# Instalar Node.js 18 LTS usando NodeSource
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install nodejs -y

# Verificar instalación
node --version
npm --version
```

### 3. Instalar PostgreSQL

```bash
# Instalar PostgreSQL
sudo dnf module install postgresql:13/server -y

# Inicializar y configurar
sudo postgresql-setup --initdb
sudo systemctl enable postgresql --now

# Crear usuario y base de datos
sudo -u postgres createuser --interactive --pwprompt petfamily
sudo -u postgres createdb -O petfamily petfamily_db

# Configurar PostgreSQL para conexiones locales
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /var/lib/pgsql/data/postgresql.conf

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### 4. Clonar y Configurar la Aplicación

```bash
# Clonar el repositorio
git clone <tu-repositorio-url> pet-family
cd pet-family

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env con tus configuraciones
nano .env
```

### 5. Configurar Variables de Entorno

Crea el archivo `.env` con el siguiente contenido:

```env
# Base de datos
DATABASE_URL="postgresql://petfamily:tu_password@localhost:5432/petfamily_db"
PGHOST=localhost
PGPORT=5432
PGDATABASE=petfamily_db
PGUSER=petfamily
PGPASSWORD=tu_password

# Sesiones
SESSION_SECRET=tu_clave_secreta_muy_segura_aqui

# Configuración del servidor
NODE_ENV=production
PORT=5000

# Directorios de archivos
UPLOAD_DIR=/var/www/pet-family/uploads
PUBLIC_FILES_DIR=/var/www/pet-family/public
```

### 6. Crear la Base de Datos

```bash
# Ejecutar script de inicialización de la base de datos
psql postgresql://petfamily:tu_password@localhost:5432/petfamily_db -f database/init.sql

# Ejecutar migraciones de Drizzle
npm run db:push
```

### 7. Crear Directorios de Archivos

```bash
# Crear directorios necesarios
sudo mkdir -p /var/www/pet-family/uploads
sudo mkdir -p /var/www/pet-family/public
sudo chown -R $USER:$USER /var/www/pet-family/
chmod -R 755 /var/www/pet-family/
```

### 8. Construir la Aplicación

```bash
# Compilar TypeScript y construir frontend
npm run build

# Verificar que la construcción fue exitosa
ls -la dist/
```

### 9. Configurar como Servicio del Sistema

Crea un archivo de servicio systemd:

```bash
sudo nano /etc/systemd/system/pet-family.service
```

Contenido del archivo:

```ini
[Unit]
Description=Pet Family Application
Documentation=https://github.com/tu-usuario/pet-family
After=network.target postgresql.service

[Service]
Type=simple
User=petfamily
WorkingDirectory=/home/petfamily/pet-family
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=pet-family

[Install]
WantedBy=multi-user.target
```

### 10. Crear Usuario del Sistema

```bash
# Crear usuario para la aplicación
sudo useradd -r -s /bin/false petfamily
sudo mkdir /home/petfamily
sudo chown petfamily:petfamily /home/petfamily

# Copiar archivos de la aplicación
sudo cp -r . /home/petfamily/pet-family/
sudo chown -R petfamily:petfamily /home/petfamily/pet-family/
```

### 11. Iniciar el Servicio

```bash
# Habilitar e iniciar el servicio
sudo systemctl daemon-reload
sudo systemctl enable pet-family
sudo systemctl start pet-family

# Verificar estado
sudo systemctl status pet-family
```

### 12. Configurar Nginx (Opcional)

Si deseas usar Nginx como proxy reverso:

```bash
# Instalar Nginx
sudo dnf install nginx -y

# Configurar sitio
sudo nano /etc/nginx/conf.d/pet-family.conf
```

Configuración de Nginx:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Iniciar Nginx
sudo systemctl enable nginx --now
```

### 13. Configurar Firewall

```bash
# Abrir puertos necesarios
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Scripts de Mantenimiento

### Backup de Base de Datos

```bash
# Crear backup
pg_dump postgresql://petfamily:tu_password@localhost:5432/petfamily_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
psql postgresql://petfamily:tu_password@localhost:5432/petfamily_db < backup_archivo.sql
```

### Logs de la Aplicación

```bash
# Ver logs del servicio
sudo journalctl -u pet-family -f

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Comandos Útiles

```bash
# Desarrollo local
npm run dev          # Iniciar en modo desarrollo
npm run build        # Construir para producción
npm run db:push      # Aplicar cambios de esquema a la base de datos

# Producción
sudo systemctl restart pet-family    # Reiniciar aplicación
sudo systemctl reload nginx          # Recargar configuración de Nginx
```

## Estructura del Proyecto

```
pet-family/
├── client/             # Código del frontend React
├── server/             # Código del backend Express
├── shared/             # Esquemas y tipos compartidos
├── database/           # Scripts de base de datos
├── public/             # Archivos estáticos públicos
├── dist/               # Archivos compilados
└── uploads/            # Archivos subidos por usuarios
```

## Solución de Problemas

### La aplicación no inicia
1. Verificar que PostgreSQL esté funcionando: `sudo systemctl status postgresql`
2. Comprobar logs: `sudo journalctl -u pet-family -f`
3. Verificar variables de entorno en `.env`

### Error de conexión a base de datos
1. Verificar credenciales en `DATABASE_URL`
2. Comprobar que la base de datos existe
3. Verificar permisos del usuario de PostgreSQL

### Problemas de permisos de archivos
1. Verificar propietario: `ls -la /var/www/pet-family/`
2. Corregir permisos: `sudo chown -R petfamily:petfamily /var/www/pet-family/`

## Soporte

Para reportar problemas o solicitar funcionalidades, crear un issue en el repositorio del proyecto.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo `LICENSE` para detalles.