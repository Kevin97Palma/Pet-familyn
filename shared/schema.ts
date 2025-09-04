import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User table for Replit Auth and local auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"), // For local authentication
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Family table
export const families = pgTable("families", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Family members table
export const familyMembers = pgTable("family_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: varchar("family_id").notNull().references(() => families.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar("role").notNull().default('member'), // 'admin', 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Pet table
export const pets = pgTable("pets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  familyId: varchar("family_id").notNull().references(() => families.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  breed: varchar("breed"),
  species: varchar("species").notNull(), // 'dog', 'cat', 'bird', etc.
  gender: varchar("gender"), // 'male', 'female'
  birthDate: timestamp("birth_date"),
  weight: varchar("weight"),
  color: varchar("color"),
  microchip: varchar("microchip"),
  description: text("description"),
  profileImageUrl: varchar("profile_image_url"),
  vetName: varchar("vet_name"),
  vetClinic: varchar("vet_clinic"),
  allergies: text("allergies"),
  medications: text("medications"),
  location: varchar("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notes table
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").notNull().references(() => pets.id, { onDelete: 'cascade' }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // 'daily', 'veterinary', 'task'
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  date: timestamp("date").notNull(),
  dueDate: timestamp("due_date"), // fecha de cumplimiento para tareas
  frequency: varchar("frequency"), // 'daily', 'weekly', 'monthly', 'yearly', 'once'
  completed: boolean("completed").default(false), // para tareas
  vetName: varchar("vet_name"), // for veterinary notes
  vetClinic: varchar("vet_clinic"), // for veterinary notes
  medications: text("medications"), // for veterinary notes
  vaccinations: text("vaccinations"), // for veterinary notes
  mood: varchar("mood"), // for daily notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Files/Documents table
export const petFiles = pgTable("pet_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").notNull().references(() => pets.id, { onDelete: 'cascade' }),
  uploaderId: varchar("uploader_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(),
  fileSize: integer("file_size"),
  filePath: varchar("file_path").notNull(),
  description: text("description"),
  category: varchar("category"), // 'medical', 'photo', 'document', 'vaccination'
  createdAt: timestamp("created_at").defaultNow(),
});

// Vaccination records table
export const vaccinations = pgTable("vaccinations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  petId: varchar("pet_id").notNull().references(() => pets.id, { onDelete: 'cascade' }),
  vaccineName: varchar("vaccine_name").notNull(),
  dateAdministered: timestamp("date_administered").notNull(),
  nextDueDate: timestamp("next_due_date"),
  vetName: varchar("vet_name"),
  vetClinic: varchar("vet_clinic"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  familyMembers: many(familyMembers),
  notes: many(notes),
  petFiles: many(petFiles),
}));

export const familiesRelations = relations(families, ({ many }) => ({
  members: many(familyMembers),
  pets: many(pets),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  family: one(families, {
    fields: [familyMembers.familyId],
    references: [families.id],
  }),
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id],
  }),
}));

export const petsRelations = relations(pets, ({ one, many }) => ({
  family: one(families, {
    fields: [pets.familyId],
    references: [families.id],
  }),
  notes: many(notes),
  files: many(petFiles),
  vaccinations: many(vaccinations),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  pet: one(pets, {
    fields: [notes.petId],
    references: [pets.id],
  }),
  author: one(users, {
    fields: [notes.authorId],
    references: [users.id],
  }),
}));

export const petFilesRelations = relations(petFiles, ({ one }) => ({
  pet: one(pets, {
    fields: [petFiles.petId],
    references: [pets.id],
  }),
  uploader: one(users, {
    fields: [petFiles.uploaderId],
    references: [users.id],
  }),
}));

export const vaccinationsRelations = relations(vaccinations, ({ one }) => ({
  pet: one(pets, {
    fields: [vaccinations.petId],
    references: [pets.id],
  }),
}));

// Insert schemas
export const insertFamilySchema = createInsertSchema(families).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPetSchema = createInsertSchema(pets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPetFileSchema = createInsertSchema(petFiles).omit({
  id: true,
  createdAt: true,
});

export const insertVaccinationSchema = createInsertSchema(vaccinations).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type Pet = typeof pets.$inferSelect;
export type InsertPet = z.infer<typeof insertPetSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type PetFile = typeof petFiles.$inferSelect;
export type InsertPetFile = z.infer<typeof insertPetFileSchema>;
export type Vaccination = typeof vaccinations.$inferSelect;
export type InsertVaccination = z.infer<typeof insertVaccinationSchema>;
