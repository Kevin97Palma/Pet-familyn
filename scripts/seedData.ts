import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema.ts";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

// Datos de ejemplo
const users = [
  {
    id: "user1",
    email: "maria.rodriguez@email.com",
    firstName: "María",
    lastName: "Rodríguez",
    profileImageUrl: null
  },
  {
    id: "user2", 
    email: "carlos.martinez@email.com",
    firstName: "Carlos",
    lastName: "Martínez",
    profileImageUrl: null
  },
  {
    id: "user3",
    email: "ana.garcia@email.com", 
    firstName: "Ana",
    lastName: "García",
    profileImageUrl: null
  },
  {
    id: "user4",
    email: "luis.lopez@email.com",
    firstName: "Luis", 
    lastName: "López",
    profileImageUrl: null
  }
];

const families = [
  {
    id: "family1",
    name: "Familia Rodríguez-Martínez",
    description: "Una familia amante de las mascotas"
  },
  {
    id: "family2", 
    name: "Familia García-López",
    description: "Cuidamos a nuestros amigos peludos con mucho amor"
  },
  {
    id: "family3",
    name: "Familia Rodríguez (Extensión)",
    description: "Segunda familia de María - Casa de la abuela"
  }
];

const familyMembers = [
  { familyId: "family1", userId: "user1", role: "admin" },
  { familyId: "family1", userId: "user2", role: "member" },
  { familyId: "family2", userId: "user3", role: "admin" },
  { familyId: "family2", userId: "user4", role: "member" },
  // María pertenece a una segunda familia (casa de la abuela)
  { familyId: "family3", userId: "user1", role: "admin" }
];

const pets = [
  // Familia 1 - 6 mascotas
  {
    id: "pet1",
    familyId: "family1",
    name: "Luna",
    species: "Perro",
    breed: "Golden Retriever", 
    birthDate: new Date("2020-03-15"),
    gender: "Hembra",
    weight: "25.5",
    microchip: "900123456789012",
    color: "Dorado",
    profileImageUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&auto=format"
  },
  {
    id: "pet2",
    familyId: "family1", 
    name: "Max",
    species: "Perro",
    breed: "Labrador",
    birthDate: new Date("2019-07-20"),
    gender: "Macho", 
    weight: 30.2,
    microchipId: "900123456789013",
    color: "Chocolate",
    profileImageUrl: "https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=400&fit=crop&auto=format"
  },
  {
    id: "pet3",
    familyId: "family1",
    name: "Mia",
    species: "Gato", 
    breed: "Persa",
    birthDate: new Date("2021-01-10"),
    gender: "Hembra",
    weight: 4.8,
    microchipId: "900123456789014",
    color: "Blanco",
    profileImageUrl: "https://images.unsplash.com/photo-1513245543132-31f507417b26?w=400&h=400&fit=crop&auto=format"
  },
  {
    id: "pet4", 
    familyId: "family1",
    name: "Rocky",
    species: "Perro",
    breed: "Pastor Alemán",
    birthDate: new Date("2018-11-05"),
    gender: "Macho",
    weight: 35.7,
    microchipId: "900123456789015", 
    color: "Negro y marrón",
    profileImageUrl: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400&h=400&fit=crop&auto=format"
  },
  {
    id: "pet5",
    familyId: "family1",
    name: "Bella",
    species: "Gato",
    breed: "Siamés", 
    birthDate: new Date("2020-09-22"),
    gender: "Hembra",
    weight: 3.9,
    microchipId: "900123456789016",
    color: "Crema y chocolate",
    profileImageUrl: "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=400&h=400&fit=crop&auto=format"
  },
  {
    id: "pet6",
    familyId: "family1",
    name: "Charlie", 
    species: "Perro",
    breed: "Beagle",
    birthDate: new Date("2021-06-30"),
    gender: "Macho",
    weight: 15.3,
    microchipId: "900123456789017",
    color: "Tricolor",
    profileImageUrl: "https://images.unsplash.com/photo-1544356269-f08e58f4e2d3?w=400&h=400&fit=crop&auto=format"
  },
  // Familia 2 - 6 mascotas
  {
    id: "pet7",
    familyId: "family2",
    name: "Coco",
    species: "Perro", 
    breed: "Poodle",
    birthDate: new Date("2019-12-12"),
    gender: "Hembra",
    weight: 8.7,
    microchipId: "900123456789018",
    color: "Blanco",
    profileImageUrl: "https://images.unsplash.com/photo-1616190264687-b7d7c1516da4?w=400&h=400&fit=crop&auto=format"
  },
  {
    id: "pet8",
    familyId: "family2",
    name: "Simba",
    species: "Gato",
    breed: "Maine Coon", 
    birthDate: new Date("2020-05-18"),
    gender: "Macho",
    weight: 7.2,
    microchipId: "900123456789019",
    color: "Naranja",
    profileImageUrl: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=400&fit=crop&auto=format"
  },
  {
    id: "pet9",
    familyId: "family2",
    name: "Nala",
    species: "Gato",
    breed: "Británico de pelo corto",
    birthDate: new Date("2021-03-08"),
    gender: "Hembra", 
    weight: 5.1,
    microchipId: "900123456789020",
    color: "Gris",
    profileImageUrl: null
  },
  {
    id: "pet10",
    familyId: "family2", 
    name: "Thor",
    species: "Perro",
    breed: "Husky Siberiano",
    birthDate: new Date("2018-08-14"),
    gender: "Macho",
    weight: 28.9,
    microchipId: "900123456789021",
    color: "Blanco y gris",
    profileImageUrl: null
  },
  {
    id: "pet11",
    familyId: "family2",
    name: "Kira", 
    species: "Perro",
    breed: "Border Collie",
    birthDate: new Date("2020-02-25"),
    gender: "Hembra",
    weight: 18.4,
    microchipId: "900123456789022",
    color: "Negro y blanco",
    profileImageUrl: null
  },
  {
    id: "pet12",
    familyId: "family2",
    name: "Oliver",
    species: "Gato",
    breed: "Ragdoll", 
    birthDate: new Date("2021-10-03"),
    gender: "Macho",
    weight: 6.3,
    microchipId: "900123456789023",
    color: "Seal point",
    profileImageUrl: null
  },
  // Familia 3 - Mascotas de la casa de la abuela de María
  {
    id: "pet13",
    familyId: "family3",
    name: "Canela",
    species: "Perro",
    breed: "Cocker Spaniel",
    birthDate: new Date("2017-04-12"),
    gender: "Hembra",
    weight: 13.2,
    microchip: "900123456789024",
    color: "Canela",
    profileImageUrl: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=400&fit=crop&auto=format"
  },
  {
    id: "pet14",
    familyId: "family3", 
    name: "Manchitas",
    species: "Gato",
    breed: "Común Europeo",
    birthDate: new Date("2019-11-28"),
    gender: "Macho",
    weight: 5.8,
    microchip: "900123456789025",
    color: "Atigrado con blanco",
    profileImageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&auto=format"
  }
];

// Generar vacunas (5 por mascota)
const vaccineNames = [
  "Rabia",
  "Parvovirus",
  "Distemper", 
  "Hepatitis",
  "Parainfluenza",
  "Bordetella",
  "Leptospirosis",
  "Coronavirus"
];

function generateVaccinations(petId, petBirthDate) {
  const vaccinations = [];
  const startDate = new Date(petBirthDate);
  startDate.setMonth(startDate.getMonth() + 2); // Empezar vacunas a los 2 meses
  
  for (let i = 0; i < 5; i++) {
    const vaccineDate = new Date(startDate);
    vaccineDate.setMonth(vaccineDate.getMonth() + (i * 3)); // Cada 3 meses
    
    vaccinations.push({
      id: `vaccine_${petId}_${i + 1}`,
      petId,
      vaccineName: vaccineNames[i % vaccineNames.length],
      dateAdministered: vaccineDate,
      vetName: i % 2 === 0 ? "Dr. Martín Vega" : "Dra. Laura Ruiz",
      notes: `Lote: BATCH${Math.floor(Math.random() * 10000)}`,
      nextDueDate: new Date(vaccineDate.getTime() + (365 * 24 * 60 * 60 * 1000)) // 1 año después
    });
  }
  
  return vaccinations;
}

// Generar notas (10 por mascota)
const noteTemplates = [
  {
    type: "daily",
    title: "Paseo matutino",
    content: "Salió muy contento al parque, jugó con otros perros por 30 minutos."
  },
  {
    type: "daily", 
    title: "Comida favorita",
    content: "Le encantó la nueva comida húmeda, se la terminó completamente."
  },
  {
    type: "veterinary",
    title: "Control de rutina",
    content: "Examen general satisfactorio. Peso adecuado, sin problemas detectados."
  },
  {
    type: "daily",
    title: "Juegos en casa", 
    content: "Estuvo muy activo jugando con su pelota favorita toda la tarde."
  },
  {
    type: "veterinary",
    title: "Vacunación anual",
    content: "Aplicada vacuna de refuerzo. Reacción normal, sin efectos secundarios."
  },
  {
    type: "daily",
    title: "Baño semanal",
    content: "Baño completo con champú especial. Se comportó muy bien durante el proceso."
  },
  {
    type: "daily",
    title: "Siesta tranquila", 
    content: "Durmió plácidamente en su cama favorita por 3 horas."
  },
  {
    type: "veterinary",
    title: "Revisión dental",
    content: "Estado dental bueno, sin necesidad de limpieza especial por ahora."
  },
  {
    type: "daily",
    title: "Socialización",
    content: "Interacción positiva con niños del vecindario, muy amigable."
  },
  {
    type: "daily",
    title: "Ejercicio diario",
    content: "Corrió 2km en el parque, excelente condición física."
  }
];

function generateNotes(petId, authorId) {
  const notes = [];
  const baseDate = new Date();
  
  for (let i = 0; i < 10; i++) {
    const noteDate = new Date(baseDate);
    noteDate.setDate(noteDate.getDate() - (i * 3)); // Cada 3 días hacia atrás
    
    const template = noteTemplates[i];
    
    notes.push({
      id: `note_${petId}_${i + 1}`,
      petId,
      authorId,
      type: template.type,
      title: template.title,
      content: template.content,
      date: noteDate
    });
  }
  
  return notes;
}

async function seedDatabase() {
  try {
    console.log("🌱 Iniciando la siembra de datos...");
    
    // 1. Insertar usuarios
    console.log("👥 Insertando usuarios...");
    for (const user of users) {
      await db.insert(schema.users).values(user).onConflictDoUpdate({
        target: schema.users.id,
        set: user
      });
    }
    
    // 2. Insertar familias
    console.log("👨‍👩‍👧‍👦 Insertando familias...");
    for (const family of families) {
      await db.insert(schema.families).values(family).onConflictDoUpdate({
        target: schema.families.id,
        set: family
      });
    }
    
    // 3. Insertar miembros de familia
    console.log("🔗 Insertando miembros de familia...");
    for (const member of familyMembers) {
      await db.insert(schema.familyMembers).values(member).onConflictDoNothing();
    }
    
    // 4. Insertar mascotas
    console.log("🐕 Insertando mascotas...");
    for (const pet of pets) {
      await db.insert(schema.pets).values(pet).onConflictDoUpdate({
        target: schema.pets.id,
        set: pet
      });
    }
    
    // 5. Insertar vacunas
    console.log("💉 Insertando vacunas...");
    for (const pet of pets) {
      const vaccinations = generateVaccinations(pet.id, pet.birthDate);
      for (const vaccination of vaccinations) {
        await db.insert(schema.vaccinations).values(vaccination).onConflictDoUpdate({
          target: schema.vaccinations.id,
          set: vaccination
        });
      }
    }
    
    // 6. Insertar notas
    console.log("📝 Insertando notas...");
    for (const pet of pets) {
      // Usar el primer usuario de la familia como autor
      const familyMember = familyMembers.find(fm => fm.familyId === pet.familyId);
      const authorId = familyMember?.userId || "user1";
      
      const notes = generateNotes(pet.id, authorId);
      for (const note of notes) {
        await db.insert(schema.notes).values(note).onConflictDoUpdate({
          target: schema.notes.id,
          set: note
        });
      }
    }
    
    console.log("✅ Datos de ejemplo insertados correctamente!");
    console.log(`
📊 Resumen:
- Usuarios: ${users.length}
- Familias: ${families.length}
- Mascotas: ${pets.length}
- Vacunas: ${pets.length * 5}
- Notas: ${pets.length * 10}
    `);
    
  } catch (error) {
    console.error("❌ Error al insertar datos:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar el script
seedDatabase().catch(console.error);