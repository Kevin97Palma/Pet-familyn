import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertPetSchema } from "@shared/schema";
import { ObjectUploader } from "./ObjectUploader";
import type { UploadResult } from "@uppy/core";

interface AddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
}

export default function AddPetModal({ isOpen, onClose, familyId }: AddPetModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "",
    birthDate: "",
    weight: "",
    color: "",
    microchip: "",
    description: "",
    vetName: "",
    vetClinic: "",
    allergies: "",
    medications: "",
    location: "",
    profileImageUrl: "",
  });

  const createPetMutation = useMutation({
    mutationFn: async (petData: any) => {
      const response = await apiRequest("POST", "/api/pets", petData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/families", familyId, "pets"] });
      toast({
        title: "Éxito",
        description: "Mascota creada correctamente",
      });
      handleClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo crear la mascota",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.species.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      const petData = insertPetSchema.parse({
        ...formData,
        familyId,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
      });
      
      createPetMutation.mutate(petData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Datos de mascota inválidos",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      species: "",
      breed: "",
      gender: "",
      birthDate: "",
      weight: "",
      color: "",
      microchip: "",
      description: "",
      vetName: "",
      vetClinic: "",
      allergies: "",
      medications: "",
      location: "",
      profileImageUrl: "",
    });
    onClose();
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle image upload
  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleImageUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageUrl = uploadedFile.uploadURL;
      
      // Update profile image URL in form data
      updateField("profileImageUrl", imageUrl);
      
      toast({
        title: "Éxito",
        description: "Imagen subida correctamente",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-add-pet">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Mascota</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Información Básica</h3>
            
            {/* Profile Image Upload */}
            <div className="space-y-2">
              <Label>Foto de Perfil</Label>
              <div className="flex items-center space-x-4">
                {formData.profileImageUrl && (
                  <img 
                    src={formData.profileImageUrl} 
                    alt="Vista previa" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                  />
                )}
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5 * 1024 * 1024} // 5MB
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleImageUploadComplete}
                >
                  <div className="flex items-center gap-2">
                    <i className="fas fa-camera"></i>
                    <span>Subir Foto</span>
                  </div>
                </ObjectUploader>
              </div>
              {formData.profileImageUrl && (
                <p className="text-xs text-muted-foreground">
                  Imagen seleccionada correctamente
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Nombre de la mascota"
                  required
                  data-testid="input-pet-name"
                />
              </div>

              <div>
                <Label htmlFor="species">Especie *</Label>
                <Select value={formData.species} onValueChange={(value) => updateField("species", value)}>
                  <SelectTrigger data-testid="select-pet-species">
                    <SelectValue placeholder="Seleccionar especie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Perro</SelectItem>
                    <SelectItem value="cat">Gato</SelectItem>
                    <SelectItem value="bird">Ave</SelectItem>
                    <SelectItem value="rabbit">Conejo</SelectItem>
                    <SelectItem value="hamster">Hámster</SelectItem>
                    <SelectItem value="fish">Pez</SelectItem>
                    <SelectItem value="reptile">Reptil</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="breed">Raza</Label>
                <Input
                  id="breed"
                  value={formData.breed}
                  onChange={(e) => updateField("breed", e.target.value)}
                  placeholder="Raza de la mascota"
                  data-testid="input-pet-breed"
                />
              </div>

              <div>
                <Label htmlFor="gender">Género</Label>
                <Select value={formData.gender} onValueChange={(value) => updateField("gender", value)}>
                  <SelectTrigger data-testid="select-pet-gender">
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Macho</SelectItem>
                    <SelectItem value="female">Hembra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => updateField("birthDate", e.target.value)}
                  data-testid="input-pet-birthdate"
                />
              </div>

              <div>
                <Label htmlFor="weight">Peso</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  placeholder="ej: 5.2 kg"
                  data-testid="input-pet-weight"
                />
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => updateField("color", e.target.value)}
                  placeholder="Color principal"
                  data-testid="input-pet-color"
                />
              </div>

              <div>
                <Label htmlFor="microchip">Microchip</Label>
                <Input
                  id="microchip"
                  value={formData.microchip}
                  onChange={(e) => updateField("microchip", e.target.value)}
                  placeholder="Número de microchip"
                  data-testid="input-pet-microchip"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe la personalidad y características de tu mascota"
                rows={3}
                data-testid="textarea-pet-description"
              />
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Información Médica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vetName">Veterinario</Label>
                <Input
                  id="vetName"
                  value={formData.vetName}
                  onChange={(e) => updateField("vetName", e.target.value)}
                  placeholder="Nombre del veterinario"
                  data-testid="input-pet-vet-name"
                />
              </div>

              <div>
                <Label htmlFor="vetClinic">Clínica Veterinaria</Label>
                <Input
                  id="vetClinic"
                  value={formData.vetClinic}
                  onChange={(e) => updateField("vetClinic", e.target.value)}
                  placeholder="Nombre de la clínica"
                  data-testid="input-pet-vet-clinic"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="allergies">Alergias</Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => updateField("allergies", e.target.value)}
                placeholder="Alergias conocidas o sensibilidades"
                rows={2}
                data-testid="textarea-pet-allergies"
              />
            </div>

            <div>
              <Label htmlFor="medications">Medicamentos</Label>
              <Textarea
                id="medications"
                value={formData.medications}
                onChange={(e) => updateField("medications", e.target.value)}
                placeholder="Medicamentos actuales o tratamientos"
                rows={2}
                data-testid="textarea-pet-medications"
              />
            </div>

            <div>
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Ciudad, región"
                data-testid="input-pet-location"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createPetMutation.isPending}
              data-testid="button-cancel-pet"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createPetMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-save-pet"
            >
              {createPetMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                "Guardar Mascota"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
