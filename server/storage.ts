import {
  users,
  families,
  familyMembers,
  pets,
  notes,
  petFiles,
  vaccinations,
  type User,
  type UpsertUser,
  type Family,
  type InsertFamily,
  type FamilyMember,
  type Pet,
  type InsertPet,
  type Note,
  type InsertNote,
  type PetFile,
  type InsertPetFile,
  type Vaccination,
  type InsertVaccination,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  // Local auth operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createLocalUser(userData: { email: string; password: string; firstName: string; lastName: string }): Promise<User>;
  
  // Family operations
  createFamily(family: InsertFamily, creatorId: string): Promise<Family>;
  getFamily(id: string): Promise<Family | undefined>;
  getFamilyWithMembers(id: string): Promise<(Family & { members: (FamilyMember & { user: User })[] }) | undefined>;
  getUserFamilies(userId: string): Promise<(FamilyMember & { family: Family })[]>;
  addFamilyMember(familyId: string, userId: string, role?: string): Promise<FamilyMember>;
  removeFamilyMember(familyId: string, userId: string): Promise<void>;
  updateFamilyMemberRole(familyId: string, userId: string, role: string): Promise<void>;
  
  // Pet operations
  createPet(pet: InsertPet): Promise<Pet>;
  updatePet(id: string, updates: Partial<InsertPet>): Promise<Pet>;
  deletePet(id: string): Promise<void>;
  getPet(id: string): Promise<Pet | undefined>;
  getFamilyPets(familyId: string): Promise<Pet[]>;
  
  // Notes operations
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<InsertNote>): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  getNote(id: string): Promise<Note | undefined>;
  getPetNotes(petId: string): Promise<(Note & { author: User })[]>;
  getFamilyNotes(familyId: string): Promise<(Note & { author: User, pet: Pet })[]>;
  getRecentNotes(familyId: string, limit?: number): Promise<(Note & { author: User, pet: Pet })[]>;
  
  // File operations
  createPetFile(file: InsertPetFile): Promise<PetFile>;
  deletePetFile(id: string): Promise<void>;
  getPetFile(id: string): Promise<PetFile | undefined>;
  getPetFiles(petId: string): Promise<PetFile[]>;
  
  // Vaccination operations
  createVaccination(vaccination: InsertVaccination): Promise<Vaccination>;
  updateVaccination(id: string, updates: Partial<InsertVaccination>): Promise<Vaccination>;
  deleteVaccination(id: string): Promise<void>;
  getPetVaccinations(petId: string): Promise<Vaccination[]>;
  getUpcomingVaccinations(familyId: string): Promise<(Vaccination & { pet: Pet })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createLocalUser(userData: { email: string; password: string; firstName: string; lastName: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Family operations
  async createFamily(family: InsertFamily, creatorId: string): Promise<Family> {
    const [newFamily] = await db.insert(families).values(family).returning();
    
    // Add creator as admin
    await db.insert(familyMembers).values({
      familyId: newFamily.id,
      userId: creatorId,
      role: 'admin',
    });
    
    return newFamily;
  }

  async getFamily(id: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family;
  }

  async getFamilyWithMembers(id: string): Promise<(Family & { members: (FamilyMember & { user: User })[] }) | undefined> {
    const family = await this.getFamily(id);
    if (!family) return undefined;

    const members = await db
      .select()
      .from(familyMembers)
      .innerJoin(users, eq(familyMembers.userId, users.id))
      .where(eq(familyMembers.familyId, id));

    return {
      ...family,
      members: members.map(m => ({
        ...m.family_members,
        user: m.users,
      })),
    };
  }

  async getUserFamilies(userId: string): Promise<(FamilyMember & { family: Family })[]> {
    const result = await db
      .select()
      .from(familyMembers)
      .innerJoin(families, eq(familyMembers.familyId, families.id))
      .where(eq(familyMembers.userId, userId));

    return result.map(r => ({
      ...r.family_members,
      family: r.families,
    }));
  }

  async addFamilyMember(familyId: string, userId: string, role = 'member'): Promise<FamilyMember> {
    const [member] = await db
      .insert(familyMembers)
      .values({ familyId, userId, role })
      .returning();
    return member;
  }

  async removeFamilyMember(familyId: string, userId: string): Promise<void> {
    await db
      .delete(familyMembers)
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, userId)
      ));
  }

  async updateFamilyMemberRole(familyId: string, userId: string, role: string): Promise<void> {
    await db
      .update(familyMembers)
      .set({ role })
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, userId)
      ));
  }

  // Pet operations
  async createPet(pet: InsertPet): Promise<Pet> {
    const [newPet] = await db.insert(pets).values(pet).returning();
    return newPet;
  }

  async updatePet(id: string, updates: Partial<InsertPet>): Promise<Pet> {
    const [updatedPet] = await db
      .update(pets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pets.id, id))
      .returning();
    return updatedPet;
  }

  async deletePet(id: string): Promise<void> {
    await db.delete(pets).where(eq(pets.id, id));
  }

  async getPet(id: string): Promise<Pet | undefined> {
    const [pet] = await db.select().from(pets).where(eq(pets.id, id));
    return pet;
  }

  async getFamilyPets(familyId: string): Promise<Pet[]> {
    return await db.select().from(pets).where(eq(pets.familyId, familyId));
  }

  // Notes operations
  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async updateNote(id: string, updates: Partial<InsertNote>): Promise<Note> {
    const [updatedNote] = await db
      .update(notes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();
    return updatedNote;
  }

  async deleteNote(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async getPetNotes(petId: string): Promise<(Note & { author: User })[]> {
    const result = await db
      .select()
      .from(notes)
      .innerJoin(users, eq(notes.authorId, users.id))
      .where(eq(notes.petId, petId))
      .orderBy(desc(notes.date));

    return result.map(r => ({
      ...r.notes,
      author: r.users,
    }));
  }

  async getFamilyNotes(familyId: string): Promise<(Note & { author: User, pet: Pet })[]> {
    const result = await db
      .select()
      .from(notes)
      .innerJoin(users, eq(notes.authorId, users.id))
      .innerJoin(pets, eq(notes.petId, pets.id))
      .where(eq(pets.familyId, familyId))
      .orderBy(desc(notes.date));

    return result.map(r => ({
      ...r.notes,
      author: r.users,
      pet: r.pets,
    }));
  }

  async getRecentNotes(familyId: string, limit = 10): Promise<(Note & { author: User, pet: Pet })[]> {
    const result = await db
      .select()
      .from(notes)
      .innerJoin(users, eq(notes.authorId, users.id))
      .innerJoin(pets, eq(notes.petId, pets.id))
      .where(eq(pets.familyId, familyId))
      .orderBy(desc(notes.date))
      .limit(limit);

    return result.map(r => ({
      ...r.notes,
      author: r.users,
      pet: r.pets,
    }));
  }

  // File operations
  async createPetFile(file: InsertPetFile): Promise<PetFile> {
    const [newFile] = await db.insert(petFiles).values(file).returning();
    return newFile;
  }

  async deletePetFile(id: string): Promise<void> {
    await db.delete(petFiles).where(eq(petFiles.id, id));
  }

  async getPetFile(id: string): Promise<PetFile | undefined> {
    const [file] = await db.select().from(petFiles).where(eq(petFiles.id, id));
    return file;
  }

  async getPetFiles(petId: string): Promise<PetFile[]> {
    return await db.select().from(petFiles).where(eq(petFiles.petId, petId));
  }

  // Vaccination operations
  async createVaccination(vaccination: InsertVaccination): Promise<Vaccination> {
    const [newVaccination] = await db.insert(vaccinations).values(vaccination).returning();
    return newVaccination;
  }

  async updateVaccination(id: string, updates: Partial<InsertVaccination>): Promise<Vaccination> {
    const [updatedVaccination] = await db
      .update(vaccinations)
      .set(updates)
      .where(eq(vaccinations.id, id))
      .returning();
    return updatedVaccination;
  }

  async deleteVaccination(id: string): Promise<void> {
    await db.delete(vaccinations).where(eq(vaccinations.id, id));
  }

  async getPetVaccinations(petId: string): Promise<Vaccination[]> {
    return await db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.petId, petId))
      .orderBy(desc(vaccinations.dateAdministered));
  }

  async getUpcomingVaccinations(familyId: string): Promise<(Vaccination & { pet: Pet })[]> {
    const result = await db
      .select()
      .from(vaccinations)
      .innerJoin(pets, eq(vaccinations.petId, pets.id))
      .where(and(
        eq(pets.familyId, familyId),
        sql`${vaccinations.nextDueDate} > NOW()`
      ))
      .orderBy(vaccinations.nextDueDate);

    return result.map(r => ({
      ...r.vaccinations,
      pet: r.pets,
    }));
  }
}

export const storage = new DatabaseStorage();
