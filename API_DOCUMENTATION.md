# Pet-Family API Documentation

## Información General

La API de Pet-Family es una REST API que permite a desarrolladores móviles integrar todas las funcionalidades de gestión de mascotas y familias.

**Base URL:** `https://tu-dominio.replit.app`

## Autenticación

La API utiliza autenticación basada en sesiones con cookies. Los usuarios deben autenticarse a través del flujo OAuth de Replit Auth.

### Endpoints de Autenticación

#### Iniciar Sesión
```
GET /api/login
```
Redirige al usuario al flujo de autenticación de Replit/Google.

#### Cerrar Sesión
```
GET /api/logout
```
Cierra la sesión del usuario.

#### Obtener Usuario Actual
```
GET /api/auth/user
```

**Respuesta exitosa (200):**
```json
{
  "id": "user1",
  "email": "maria.rodriguez@email.com",
  "firstName": "María",
  "lastName": "Rodríguez",
  "profileImageUrl": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Respuesta no autorizado (401):**
```json
{
  "message": "Unauthorized"
}
```

---

## Endpoints de Familias

### Listar Familias del Usuario
```
GET /api/families
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": "family1",
    "name": "Familia Rodríguez-Martínez",
    "description": "Una familia amante de las mascotas",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### Crear Nueva Familia
```
POST /api/families
Content-Type: application/json
```

**Body de la solicitud:**
```json
{
  "name": "Mi Nueva Familia",
  "description": "Descripción opcional de la familia"
}
```

**Respuesta exitosa (201):**
```json
{
  "id": "family_new",
  "name": "Mi Nueva Familia", 
  "description": "Descripción opcional de la familia",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

### Obtener Familia por ID
```
GET /api/families/{familyId}
```

**Respuesta exitosa (200):**
```json
{
  "id": "family1",
  "name": "Familia Rodríguez-Martínez",
  "description": "Una familia amante de las mascotas",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "members": [
    {
      "userId": "user1",
      "role": "admin",
      "user": {
        "id": "user1",
        "firstName": "María",
        "lastName": "Rodríguez",
        "email": "maria.rodriguez@email.com"
      }
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Unirse a Familia por Código
```
POST /api/families/join
Content-Type: application/json
```

**Body de la solicitud:**
```json
{
  "familyCode": "family1"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Te has unido a la familia exitosamente",
  "family": {
    "id": "family1",
    "name": "Familia Rodríguez-Martínez"
  }
}
```

---

## Endpoints de Mascotas

### Listar Mascotas de una Familia
```
GET /api/pets?familyId={familyId}
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": "pet1",
    "familyId": "family1",
    "name": "Luna",
    "species": "Perro",
    "breed": "Golden Retriever",
    "birthDate": "2020-03-15T00:00:00Z",
    "gender": "Hembra",
    "weight": 25.5,
    "microchipId": "900123456789012",
    "color": "Dorado",
    "imageUrl": "/objects/uploads/pet1_image.jpg",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### Crear Nueva Mascota
```
POST /api/pets
Content-Type: application/json
```

**Body de la solicitud:**
```json
{
  "familyId": "family1",
  "name": "Buddy",
  "species": "Perro",
  "breed": "Labrador",
  "birthDate": "2021-06-15",
  "gender": "Macho",
  "weight": 28.3,
  "microchipId": "900123456789024",
  "color": "Amarillo",
  "imageUrl": null
}
```

**Respuesta exitosa (201):**
```json
{
  "id": "pet_new",
  "familyId": "family1",
  "name": "Buddy",
  "species": "Perro", 
  "breed": "Labrador",
  "birthDate": "2021-06-15T00:00:00Z",
  "gender": "Macho",
  "weight": 28.3,
  "microchipId": "900123456789024",
  "color": "Amarillo",
  "imageUrl": null,
  "createdAt": "2024-01-15T11:30:00Z",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

### Obtener Mascota por ID
```
GET /api/pets/{petId}
```

**Respuesta exitosa (200):**
```json
{
  "id": "pet1",
  "familyId": "family1",
  "name": "Luna",
  "species": "Perro",
  "breed": "Golden Retriever", 
  "birthDate": "2020-03-15T00:00:00Z",
  "gender": "Hembra",
  "weight": 25.5,
  "microchipId": "900123456789012",
  "color": "Dorado",
  "imageUrl": "/objects/uploads/pet1_image.jpg",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Actualizar Mascota
```
PUT /api/pets/{petId}
Content-Type: application/json
```

**Body de la solicitud:**
```json
{
  "name": "Luna Bella",
  "weight": 26.0,
  "imageUrl": "/objects/uploads/pet1_new_image.jpg"
}
```

**Respuesta exitosa (200):**
```json
{
  "id": "pet1", 
  "familyId": "family1",
  "name": "Luna Bella",
  "species": "Perro",
  "breed": "Golden Retriever",
  "birthDate": "2020-03-15T00:00:00Z",
  "gender": "Hembra",
  "weight": 26.0,
  "microchipId": "900123456789012",
  "color": "Dorado",
  "imageUrl": "/objects/uploads/pet1_new_image.jpg",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

---

## Endpoints de Notas

### Listar Notas de una Mascota
```
GET /api/notes?petId={petId}&type={daily|veterinary}
```

**Parámetros de consulta:**
- `petId`: ID de la mascota (requerido)
- `type`: Tipo de nota - "daily" o "veterinary" (opcional)

**Respuesta exitosa (200):**
```json
[
  {
    "id": "note1",
    "petId": "pet1",
    "type": "daily",
    "title": "Paseo matutino",
    "content": "Salió muy contento al parque, jugó con otros perros por 30 minutos.",
    "date": "2024-01-15T09:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  {
    "id": "note2",
    "petId": "pet1", 
    "type": "veterinary",
    "title": "Control de rutina",
    "content": "Examen general satisfactorio. Peso adecuado, sin problemas detectados.",
    "date": "2024-01-14T15:30:00Z",
    "createdAt": "2024-01-14T16:00:00Z",
    "updatedAt": "2024-01-14T16:00:00Z"
  }
]
```

### Crear Nueva Nota
```
POST /api/notes
Content-Type: application/json
```

**Body de la solicitud:**
```json
{
  "petId": "pet1",
  "type": "daily",
  "title": "Comida especial",
  "content": "Le encantó la nueva receta de pollo con vegetales.",
  "date": "2024-01-15T18:00:00Z"
}
```

**Respuesta exitosa (201):**
```json
{
  "id": "note_new",
  "petId": "pet1",
  "type": "daily", 
  "title": "Comida especial",
  "content": "Le encantó la nueva receta de pollo con vegetales.",
  "date": "2024-01-15T18:00:00Z",
  "createdAt": "2024-01-15T18:30:00Z",
  "updatedAt": "2024-01-15T18:30:00Z"
}
```

### Obtener Nota por ID
```
GET /api/notes/{noteId}
```

**Respuesta exitosa (200):**
```json
{
  "id": "note1",
  "petId": "pet1",
  "type": "daily",
  "title": "Paseo matutino", 
  "content": "Salió muy contento al parque, jugó con otros perros por 30 minutos.",
  "date": "2024-01-15T09:00:00Z",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Actualizar Nota
```
PUT /api/notes/{noteId}
Content-Type: application/json
```

**Body de la solicitud:**
```json
{
  "title": "Paseo matutino largo",
  "content": "Salió muy contento al parque, jugó con otros perros por 45 minutos y corrió mucho."
}
```

### Eliminar Nota
```
DELETE /api/notes/{noteId}
```

**Respuesta exitosa (204):** Sin contenido

---

## Endpoints de Vacunas

### Listar Vacunas de una Mascota
```
GET /api/vaccinations?petId={petId}
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": "vaccine1",
    "petId": "pet1",
    "name": "Rabia",
    "date": "2024-01-10T14:00:00Z", 
    "veterinarian": "Dr. Martín Vega",
    "batch": "BATCH1234",
    "nextDue": "2025-01-10T14:00:00Z",
    "createdAt": "2024-01-10T14:30:00Z",
    "updatedAt": "2024-01-10T14:30:00Z"
  }
]
```

### Crear Nueva Vacuna
```
POST /api/vaccinations
Content-Type: application/json
```

**Body de la solicitud:**
```json
{
  "petId": "pet1",
  "name": "Parvovirus",
  "date": "2024-01-15T10:00:00Z",
  "veterinarian": "Dra. Laura Ruiz",
  "batch": "BATCH5678", 
  "nextDue": "2025-01-15T10:00:00Z"
}
```

**Respuesta exitosa (201):**
```json
{
  "id": "vaccine_new",
  "petId": "pet1",
  "name": "Parvovirus",
  "date": "2024-01-15T10:00:00Z",
  "veterinarian": "Dra. Laura Ruiz",
  "batch": "BATCH5678",
  "nextDue": "2025-01-15T10:00:00Z",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## Endpoints de Archivos

### Subir Archivo
```
POST /api/objects/upload
```

**Respuesta exitosa (200):**
```json
{
  "uploadURL": "https://storage.googleapis.com/bucket/uploads/file123?signed-params..."
}
```

**Uso:** 
1. Llama a este endpoint para obtener una URL de carga
2. Usa la URL para subir el archivo directamente con PUT
3. Llama a `/api/pet-images` para asociar la imagen con la mascota

### Asociar Imagen de Mascota
```
PUT /api/pet-images
Content-Type: application/json
```

**Body de la solicitud:**
```json
{
  "petImageURL": "https://storage.googleapis.com/bucket/uploads/file123",
  "petId": "pet1"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Imagen de mascota actualizada exitosamente",
  "objectPath": "/objects/uploads/file123"
}
```

### Servir Archivos Públicos
```
GET /public-objects/{filePath}
```

### Servir Archivos Privados
```
GET /objects/{objectPath}
```
*Requiere autenticación y permisos apropiados*

---

## Códigos de Error

### 400 - Bad Request
```json
{
  "message": "Datos de entrada inválidos",
  "errors": [
    {
      "field": "name",
      "message": "El nombre es requerido"
    }
  ]
}
```

### 401 - Unauthorized
```json
{
  "message": "Unauthorized"
}
```

### 403 - Forbidden
```json
{
  "message": "No tienes permisos para acceder a este recurso"
}
```

### 404 - Not Found
```json
{
  "message": "Recurso no encontrado"
}
```

### 500 - Internal Server Error
```json
{
  "message": "Error interno del servidor"
}
```

---

## Notas para Desarrolladores Móviles

### Autenticación
- La API utiliza cookies de sesión para mantener la autenticación
- Los desarrolladores móviles deben implementar un WebView para el flujo OAuth inicial
- Una vez autenticado, las cookies se mantienen automáticamente en las solicitudes

### Paginación
Actualmente no implementada, pero se agregará en futuras versiones para endpoints que retornen listas grandes.

### Rate Limiting
No implementado actualmente, pero se considera para futuras versiones.

### Formatos de Fecha
- Todas las fechas se devuelven en formato ISO 8601 UTC
- Las fechas de entrada pueden ser en formato "YYYY-MM-DD" o ISO 8601 completo

### Subida de Archivos
El flujo de subida de archivos es de dos pasos:
1. Obtener URL de carga presignada del endpoint `/api/objects/upload`
2. Subir el archivo directamente a la URL obtenida usando método PUT
3. Asociar el archivo subido con la entidad correspondiente (mascota, etc.)

### Headers Recomendados
```
Accept: application/json
Content-Type: application/json
User-Agent: Pet-Family-Mobile/1.0.0
```

### Ejemplo de Integración (JavaScript/React Native)

```javascript
class PetFamilyAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async makeRequest(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      credentials: 'include', // Importante para cookies
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Obtener usuario actual
  async getCurrentUser() {
    return this.makeRequest('/api/auth/user');
  }
  
  // Listar familias
  async getFamilies() {
    return this.makeRequest('/api/families');
  }
  
  // Crear mascota
  async createPet(petData) {
    return this.makeRequest('/api/pets', {
      method: 'POST',
      body: JSON.stringify(petData)
    });
  }
  
  // Listar notas de mascota
  async getPetNotes(petId, type = null) {
    const params = new URLSearchParams({ petId });
    if (type) params.append('type', type);
    
    return this.makeRequest(`/api/notes?${params.toString()}`);
  }
}
```

Este documentación proporciona toda la información necesaria para integrar la aplicación móvil con la API de Pet-Family.