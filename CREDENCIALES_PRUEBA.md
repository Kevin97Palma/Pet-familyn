# 🔐 Credenciales de Prueba - Pet-Family

## Autenticación Disponible

La aplicación Pet-Family ahora soporta **autenticación dual**:

### 1. 🔵 Login con Google (Replit Auth)
- Click en "Ingresar con Google" para usar tu cuenta de Google
- Autenticación automática mediante Replit Auth

### 2. ✉️ Login con Email y Contraseña (Local)
- Sistema de autenticación tradicional con registro y login local
- Contraseñas hasheadas y seguras

## 👤 Usuarios de Prueba

Puedes usar estas cuentas pre-creadas para probar la aplicación:

### María Rodríguez
- **Email:** `maria.rodriguez@email.com`
- **Contraseña:** `maria123`
- Tiene familia "Los Rodríguez" con mascotas registradas

### Carlos Martínez
- **Email:** `carlos.martinez@email.com`
- **Contraseña:** `carlos123`
- Miembro de familia con mascotas y notas veterinarias

### Ana García
- **Email:** `ana.garcia@email.com`
- **Contraseña:** `ana123`
- Administradora de familia con historial completo de vacunas

### Luis López
- **Email:** `luis.lopez@email.com`
- **Contraseña:** `luis123`
- Usuario con mascotas exóticas y notas detalladas

## 🎯 Funcionalidades de Prueba

Con estas cuentas puedes probar:

- ✅ Login y logout
- ✅ Gestión de familias y miembros
- ✅ Perfiles completos de mascotas (12 mascotas de ejemplo)
- ✅ Notas diarias y veterinarias (120 notas de ejemplo)
- ✅ Control de vacunas (60 registros de vacunas)
- ✅ Códigos QR para invitaciones familiares
- ✅ Subida de archivos y fotos de mascotas
- ✅ Dashboard con estadísticas y recordatorios

## 🔧 Para Desarrolladores

### Crear Nueva Cuenta
1. Ve a `/auth`
2. Click en "Crear cuenta nueva"
3. Completa: Email, Contraseña, Nombre, Apellido
4. Login automático después del registro

### API Endpoints (para app móvil)
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login con email/contraseña
- `GET /api/auth/user` - Obtener usuario actual
- `POST /api/auth/logout` - Cerrar sesión

Consulta `API_DOCUMENTATION.md` para documentación completa de la API.

## 🔒 Seguridad

- Contraseñas hasheadas con scrypt
- Sesiones seguras con PostgreSQL
- Autenticación híbrida (Google + Local)
- Middleware de protección en todas las rutas

---

**¡La aplicación Pet-Family está lista para usar con autenticación completa!** 🐾