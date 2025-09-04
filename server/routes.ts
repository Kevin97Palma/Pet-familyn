import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { 
  insertFamilySchema,
  insertPetSchema,
  insertNoteSchema,
  insertPetFileSchema,
  insertVaccinationSchema,
} from "@shared/schema";
import QRCode from 'qrcode';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Utility functions for password hashing
  async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }

  // Local auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).send("Todos los campos son requeridos");
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).send("El email ya está registrado");
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createLocalUser({
        email,
        password: hashedPassword,
        firstName,
        lastName
      });

      // Log user in by setting session
      req.session.userId = user.id;
      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).send("Error al crear la cuenta");
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).send("Email y contraseña son requeridos");
      }

      // Find user and verify password
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).send("Credenciales inválidas");
      }

      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return res.status(401).send("Credenciales inválidas");
      }

      // Log user in by setting session
      req.session.userId = user.id;
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).send("Error al iniciar sesión");
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).send("Error al cerrar sesión");
      }
      res.json({ message: "Sesión cerrada" });
    });
  });

  // Auth routes (hybrid - works with both Replit Auth and local auth)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let user = null;
      
      // Check for Replit Auth user
      if (req.user && req.user.claims) {
        const userId = req.user.claims.sub;
        user = await storage.getUser(userId);
      }
      // Check for local auth user
      else if (req.session.userId) {
        user = await storage.getUser(req.session.userId);
      }

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Middleware for hybrid authentication
  const hybridAuth = async (req: any, res: any, next: any) => {
    let user = null;
    
    // Check for Replit Auth user
    if (req.user && req.user.claims) {
      const userId = req.user.claims.sub;
      user = await storage.getUser(userId);
    }
    // Check for local auth user
    else if (req.session.userId) {
      user = await storage.getUser(req.session.userId);
    }

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.currentUser = user;
    next();
  };

  // Object storage routes for serving files
  app.get("/objects/:objectPath(*)", hybridAuth, async (req: any, res) => {
    const userId = req.currentUser?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // File upload endpoint
  app.post("/api/objects/upload", hybridAuth, async (req: any, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Family routes
  app.post("/api/families", hybridAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const familyData = insertFamilySchema.parse(req.body);
      const family = await storage.createFamily(familyData, userId);
      res.status(201).json(family);
    } catch (error) {
      console.error("Error creating family:", error);
      res.status(500).json({ message: "Failed to create family" });
    }
  });

  app.get("/api/families", hybridAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const families = await storage.getUserFamilies(userId);
      res.json(families);
    } catch (error) {
      console.error("Error fetching families:", error);
      res.status(500).json({ message: "Failed to fetch families" });
    }
  });

  app.get("/api/families/:id", hybridAuth, async (req: any, res) => {
    try {
      const family = await storage.getFamilyWithMembers(req.params.id);
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }
      res.json(family);
    } catch (error) {
      console.error("Error fetching family:", error);
      res.status(500).json({ message: "Failed to fetch family" });
    }
  });

  app.post("/api/families/:id/members", hybridAuth, async (req: any, res) => {
    try {
      const { userId, role = 'member' } = req.body;
      const member = await storage.addFamilyMember(req.params.id, userId, role);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding family member:", error);
      res.status(500).json({ message: "Failed to add family member" });
    }
  });

  app.delete("/api/families/:familyId/members/:userId", hybridAuth, async (req: any, res) => {
    try {
      await storage.removeFamilyMember(req.params.familyId, req.params.userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing family member:", error);
      res.status(500).json({ message: "Failed to remove family member" });
    }
  });

  // Leave family (remove self)
  app.delete("/api/families/:familyId/members/me", hybridAuth, async (req: any, res) => {
    try {
      const { familyId } = req.params;
      const userId = req.currentUser.id;
      
      // Check if user is a member of the family
      const userMemberships = await storage.getUserFamilies(userId);
      const membership = userMemberships.find((m: any) => m.family.id === familyId);
      
      if (!membership) {
        return res.status(404).json({ error: "You are not a member of this family" });
      }
      
      // Prevent admin from leaving if there are other members
      const familyMembers = await storage.getFamilyMembers(familyId);
      if (membership.role === "admin" && familyMembers.length > 1) {
        return res.status(400).json({ error: "Admin cannot leave family with other members. Transfer admin role first." });
      }
      
      // Remove user from family
      await storage.removeFamilyMember(familyId, userId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error leaving family:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // QR Code generation
  app.get("/api/families/:id/qr", hybridAuth, async (req: any, res) => {
    try {
      const familyId = req.params.id;
      const family = await storage.getFamily(familyId);
      
      if (!family) {
        return res.status(404).json({ message: "Family not found" });
      }

      const inviteData = {
        type: 'family-invite',
        familyId: familyId,
        familyName: family.name,
        timestamp: Date.now(),
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(inviteData));
      res.json({ qrCode: qrCodeDataURL, inviteData });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Pet routes
  app.post("/api/pets", hybridAuth, async (req: any, res) => {
    try {
      const petData = insertPetSchema.parse(req.body);
      const pet = await storage.createPet(petData);
      res.status(201).json(pet);
    } catch (error) {
      console.error("Error creating pet:", error);
      res.status(500).json({ message: "Failed to create pet" });
    }
  });

  app.get("/api/families/:familyId/pets", hybridAuth, async (req: any, res) => {
    try {
      const pets = await storage.getFamilyPets(req.params.familyId);
      res.json(pets);
    } catch (error) {
      console.error("Error fetching pets:", error);
      res.status(500).json({ message: "Failed to fetch pets" });
    }
  });

  app.get("/api/pets/:id", hybridAuth, async (req: any, res) => {
    try {
      const pet = await storage.getPet(req.params.id);
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }
      res.json(pet);
    } catch (error) {
      console.error("Error fetching pet:", error);
      res.status(500).json({ message: "Failed to fetch pet" });
    }
  });

  app.put("/api/pets/:id", hybridAuth, async (req: any, res) => {
    try {
      const updates = insertPetSchema.partial().parse(req.body);
      const pet = await storage.updatePet(req.params.id, updates);
      res.json(pet);
    } catch (error) {
      console.error("Error updating pet:", error);
      res.status(500).json({ message: "Failed to update pet" });
    }
  });

  app.delete("/api/pets/:id", hybridAuth, async (req: any, res) => {
    try {
      await storage.deletePet(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pet:", error);
      res.status(500).json({ message: "Failed to delete pet" });
    }
  });

  // Pet image upload
  app.put("/api/pets/:id/image", hybridAuth, async (req: any, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    const userId = req.currentUser?.id;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          visibility: "public", // Pet profile images are public
        },
      );

      const pet = await storage.updatePet(req.params.id, {
        profileImageUrl: objectPath,
      });

      res.status(200).json({ pet, objectPath });
    } catch (error) {
      console.error("Error setting pet image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Notes routes
  app.post("/api/notes", hybridAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const noteData = insertNoteSchema.parse({
        ...req.body,
        authorId: userId,
      });
      const note = await storage.createNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.get("/api/pets/:petId/notes", hybridAuth, async (req: any, res) => {
    try {
      const notes = await storage.getPetNotes(req.params.petId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching pet notes:", error);
      res.status(500).json({ message: "Failed to fetch pet notes" });
    }
  });

  app.get("/api/families/:familyId/notes", hybridAuth, async (req: any, res) => {
    try {
      const notes = await storage.getFamilyNotes(req.params.familyId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching family notes:", error);
      res.status(500).json({ message: "Failed to fetch family notes" });
    }
  });

  app.get("/api/families/:familyId/notes/recent", hybridAuth, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const notes = await storage.getRecentNotes(req.params.familyId, limit);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching recent notes:", error);
      res.status(500).json({ message: "Failed to fetch recent notes" });
    }
  });

  app.put("/api/notes/:id", hybridAuth, async (req: any, res) => {
    try {
      const updates = insertNoteSchema.partial().parse(req.body);
      const note = await storage.updateNote(req.params.id, updates);
      res.json(note);
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", hybridAuth, async (req: any, res) => {
    try {
      await storage.deleteNote(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Pet files routes
  app.post("/api/pet-files", hybridAuth, async (req: any, res) => {
    try {
      const userId = req.currentUser?.id;
      const fileData = insertPetFileSchema.parse({
        ...req.body,
        uploaderId: userId,
      });
      const file = await storage.createPetFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      console.error("Error creating pet file:", error);
      res.status(500).json({ message: "Failed to create pet file" });
    }
  });

  app.get("/api/pets/:petId/files", hybridAuth, async (req: any, res) => {
    try {
      const files = await storage.getPetFiles(req.params.petId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching pet files:", error);
      res.status(500).json({ message: "Failed to fetch pet files" });
    }
  });

  app.delete("/api/pet-files/:id", hybridAuth, async (req: any, res) => {
    try {
      await storage.deletePetFile(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pet file:", error);
      res.status(500).json({ message: "Failed to delete pet file" });
    }
  });

  // Public pet profile route (no auth required for sharing)
  app.get("/public/pet/:id", async (req, res) => {
    try {
      const petId = req.params.id;
      const pet = await storage.getPet(petId);
      
      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      // Get pet files (photos)
      const files = await storage.getPetFiles(petId);
      
      // Get recent notes (limit to 5 for public view)
      const notes = await storage.getPetNotes(petId);
      const recentNotes = notes.slice(0, 5);

      // Get vaccinations
      const vaccinations = await storage.getPetVaccinations(petId);

      res.json({
        pet,
        files,
        notes: recentNotes,
        vaccinations
      });
    } catch (error) {
      console.error("Error fetching public pet profile:", error);
      res.status(500).json({ message: "Failed to fetch pet profile" });
    }
  });

  // Vaccination routes
  app.post("/api/vaccinations", hybridAuth, async (req: any, res) => {
    try {
      const vaccinationData = insertVaccinationSchema.parse(req.body);
      const vaccination = await storage.createVaccination(vaccinationData);
      res.status(201).json(vaccination);
    } catch (error) {
      console.error("Error creating vaccination:", error);
      res.status(500).json({ message: "Failed to create vaccination" });
    }
  });

  app.get("/api/pets/:petId/vaccinations", hybridAuth, async (req: any, res) => {
    try {
      const vaccinations = await storage.getPetVaccinations(req.params.petId);
      res.json(vaccinations);
    } catch (error) {
      console.error("Error fetching vaccinations:", error);
      res.status(500).json({ message: "Failed to fetch vaccinations" });
    }
  });

  app.get("/api/families/:familyId/vaccinations/upcoming", hybridAuth, async (req: any, res) => {
    try {
      const vaccinations = await storage.getUpcomingVaccinations(req.params.familyId);
      res.json(vaccinations);
    } catch (error) {
      console.error("Error fetching upcoming vaccinations:", error);
      res.status(500).json({ message: "Failed to fetch upcoming vaccinations" });
    }
  });

  app.put("/api/vaccinations/:id", hybridAuth, async (req: any, res) => {
    try {
      const updates = insertVaccinationSchema.partial().parse(req.body);
      const vaccination = await storage.updateVaccination(req.params.id, updates);
      res.json(vaccination);
    } catch (error) {
      console.error("Error updating vaccination:", error);
      res.status(500).json({ message: "Failed to update vaccination" });
    }
  });

  app.delete("/api/vaccinations/:id", hybridAuth, async (req: any, res) => {
    try {
      await storage.deleteVaccination(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vaccination:", error);
      res.status(500).json({ message: "Failed to delete vaccination" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
