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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Object storage routes for serving files
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = req.user?.claims?.sub;
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
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Family routes
  app.post("/api/families", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const familyData = insertFamilySchema.parse(req.body);
      const family = await storage.createFamily(familyData, userId);
      res.status(201).json(family);
    } catch (error) {
      console.error("Error creating family:", error);
      res.status(500).json({ message: "Failed to create family" });
    }
  });

  app.get("/api/families", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const families = await storage.getUserFamilies(userId);
      res.json(families);
    } catch (error) {
      console.error("Error fetching families:", error);
      res.status(500).json({ message: "Failed to fetch families" });
    }
  });

  app.get("/api/families/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/families/:id/members", isAuthenticated, async (req, res) => {
    try {
      const { userId, role = 'member' } = req.body;
      const member = await storage.addFamilyMember(req.params.id, userId, role);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding family member:", error);
      res.status(500).json({ message: "Failed to add family member" });
    }
  });

  app.delete("/api/families/:familyId/members/:userId", isAuthenticated, async (req, res) => {
    try {
      await storage.removeFamilyMember(req.params.familyId, req.params.userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing family member:", error);
      res.status(500).json({ message: "Failed to remove family member" });
    }
  });

  // QR Code generation
  app.get("/api/families/:id/qr", isAuthenticated, async (req, res) => {
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
  app.post("/api/pets", isAuthenticated, async (req, res) => {
    try {
      const petData = insertPetSchema.parse(req.body);
      const pet = await storage.createPet(petData);
      res.status(201).json(pet);
    } catch (error) {
      console.error("Error creating pet:", error);
      res.status(500).json({ message: "Failed to create pet" });
    }
  });

  app.get("/api/families/:familyId/pets", isAuthenticated, async (req, res) => {
    try {
      const pets = await storage.getFamilyPets(req.params.familyId);
      res.json(pets);
    } catch (error) {
      console.error("Error fetching pets:", error);
      res.status(500).json({ message: "Failed to fetch pets" });
    }
  });

  app.get("/api/pets/:id", isAuthenticated, async (req, res) => {
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

  app.put("/api/pets/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = insertPetSchema.partial().parse(req.body);
      const pet = await storage.updatePet(req.params.id, updates);
      res.json(pet);
    } catch (error) {
      console.error("Error updating pet:", error);
      res.status(500).json({ message: "Failed to update pet" });
    }
  });

  app.delete("/api/pets/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deletePet(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pet:", error);
      res.status(500).json({ message: "Failed to delete pet" });
    }
  });

  // Pet image upload
  app.put("/api/pets/:id/image", isAuthenticated, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    const userId = req.user?.claims?.sub;

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
  app.post("/api/notes", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
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

  app.get("/api/pets/:petId/notes", isAuthenticated, async (req, res) => {
    try {
      const notes = await storage.getPetNotes(req.params.petId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching pet notes:", error);
      res.status(500).json({ message: "Failed to fetch pet notes" });
    }
  });

  app.get("/api/families/:familyId/notes", isAuthenticated, async (req, res) => {
    try {
      const notes = await storage.getFamilyNotes(req.params.familyId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching family notes:", error);
      res.status(500).json({ message: "Failed to fetch family notes" });
    }
  });

  app.get("/api/families/:familyId/notes/recent", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const notes = await storage.getRecentNotes(req.params.familyId, limit);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching recent notes:", error);
      res.status(500).json({ message: "Failed to fetch recent notes" });
    }
  });

  app.put("/api/notes/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = insertNoteSchema.partial().parse(req.body);
      const note = await storage.updateNote(req.params.id, updates);
      res.json(note);
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteNote(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Pet files routes
  app.post("/api/pet-files", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
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

  app.get("/api/pets/:petId/files", isAuthenticated, async (req, res) => {
    try {
      const files = await storage.getPetFiles(req.params.petId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching pet files:", error);
      res.status(500).json({ message: "Failed to fetch pet files" });
    }
  });

  app.delete("/api/pet-files/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deletePetFile(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pet file:", error);
      res.status(500).json({ message: "Failed to delete pet file" });
    }
  });

  // Vaccination routes
  app.post("/api/vaccinations", isAuthenticated, async (req, res) => {
    try {
      const vaccinationData = insertVaccinationSchema.parse(req.body);
      const vaccination = await storage.createVaccination(vaccinationData);
      res.status(201).json(vaccination);
    } catch (error) {
      console.error("Error creating vaccination:", error);
      res.status(500).json({ message: "Failed to create vaccination" });
    }
  });

  app.get("/api/pets/:petId/vaccinations", isAuthenticated, async (req, res) => {
    try {
      const vaccinations = await storage.getPetVaccinations(req.params.petId);
      res.json(vaccinations);
    } catch (error) {
      console.error("Error fetching vaccinations:", error);
      res.status(500).json({ message: "Failed to fetch vaccinations" });
    }
  });

  app.get("/api/families/:familyId/vaccinations/upcoming", isAuthenticated, async (req, res) => {
    try {
      const vaccinations = await storage.getUpcomingVaccinations(req.params.familyId);
      res.json(vaccinations);
    } catch (error) {
      console.error("Error fetching upcoming vaccinations:", error);
      res.status(500).json({ message: "Failed to fetch upcoming vaccinations" });
    }
  });

  app.put("/api/vaccinations/:id", isAuthenticated, async (req, res) => {
    try {
      const updates = insertVaccinationSchema.partial().parse(req.body);
      const vaccination = await storage.updateVaccination(req.params.id, updates);
      res.json(vaccination);
    } catch (error) {
      console.error("Error updating vaccination:", error);
      res.status(500).json({ message: "Failed to update vaccination" });
    }
  });

  app.delete("/api/vaccinations/:id", isAuthenticated, async (req, res) => {
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
