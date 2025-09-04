import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertNoteSchema } from "@shared/schema";
import type { Pet } from "@shared/schema";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId?: string;
  familyId?: string;
}

export default function AddNoteModal({ isOpen, onClose, petId, familyId }: AddNoteModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    petId: petId || "",
    type: "daily" as "daily" | "veterinary" | "task",
    title: "",
    content: "",
    date: new Date().toISOString().split('T')[0],
    dueDate: "",
    frequency: "once" as "daily" | "weekly" | "monthly" | "yearly" | "once",
    vetName: "",
    vetClinic: "",
    medications: "",
    vaccinations: "",
    mood: "",
  });

  // Fetch pets for selection if no specific pet is provided
  const { data: pets = [] } = useQuery({
    queryKey: ["/api/families", familyId, "pets"],
    enabled: !!familyId && !petId,
    retry: false,
  });

  useEffect(() => {
    if (petId) {
      setFormData(prev => ({ ...prev, petId }));
    }
  }, [petId]);

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      const response = await apiRequest("POST", "/api/notes", noteData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/pets", formData.petId, "notes"] });
      if (familyId) {
        queryClient.invalidateQueries({ queryKey: ["/api/families", familyId, "notes"] });
        queryClient.invalidateQueries({ queryKey: ["/api/families", familyId, "notes", "recent"] });
      }
      
      toast({
        title: "Éxito",
        description: "Nota creada correctamente",
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
        description: "No se pudo crear la nota",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.petId || !formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      const noteData = insertNoteSchema.parse({
        ...formData,
        date: new Date(formData.date),
        // Only include vet fields for veterinary notes
        vetName: formData.type === 'veterinary' ? formData.vetName : undefined,
        vetClinic: formData.type === 'veterinary' ? formData.vetClinic : undefined,
        medications: formData.type === 'veterinary' ? formData.medications : undefined,
        vaccinations: formData.type === 'veterinary' ? formData.vaccinations : undefined,
        // Only include mood for daily notes
        mood: formData.type === 'daily' ? formData.mood : undefined,
      });
      
      createNoteMutation.mutate(noteData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Datos de nota inválidos",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFormData({
      petId: petId || "",
      type: "daily",
      title: "",
      content: "",
      date: new Date().toISOString().split('T')[0],
      vetName: "",
      vetClinic: "",
      medications: "",
      vaccinations: "",
      mood: "",
    });
    onClose();
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-add-note">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Nota</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pet Selection */}
              {!petId && (
                <div>
                  <Label htmlFor="petId">Mascota *</Label>
                  <Select value={formData.petId} onValueChange={(value) => updateField("petId", value)}>
                    <SelectTrigger data-testid="select-note-pet">
                      <SelectValue placeholder="Seleccionar mascota" />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map((pet: Pet) => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="type">Tipo de Nota *</Label>
                <Select value={formData.type} onValueChange={(value: "daily" | "veterinary" | "task") => updateField("type", value)}>
                  <SelectTrigger data-testid="select-note-type">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Nota Cotidiana</SelectItem>
                    <SelectItem value="veterinary">Nota Veterinaria</SelectItem>
                    <SelectItem value="task">Tarea/Recordatorio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  required
                  data-testid="input-note-date"
                />
              </div>
            </div>

            {/* Task-specific fields */}
            {formData.type === 'task' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Fecha de Cumplimiento</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => updateField("dueDate", e.target.value)}
                    data-testid="input-task-due-date"
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Frecuencia</Label>
                  <Select value={formData.frequency} onValueChange={(value: "daily" | "weekly" | "monthly" | "yearly" | "once") => updateField("frequency", value)}>
                    <SelectTrigger data-testid="select-task-frequency">
                      <SelectValue placeholder="Seleccionar frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Una vez</SelectItem>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Título de la nota"
                required
                data-testid="input-note-title"
              />
            </div>

            <div>
              <Label htmlFor="content">Contenido *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => updateField("content", e.target.value)}
                placeholder="Describe lo que sucedió..."
                rows={4}
                required
                data-testid="textarea-note-content"
              />
            </div>
          </div>

          {/* Veterinary-specific fields */}
          {formData.type === 'veterinary' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Información Veterinaria</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vetName">Veterinario</Label>
                  <Input
                    id="vetName"
                    value={formData.vetName}
                    onChange={(e) => updateField("vetName", e.target.value)}
                    placeholder="Nombre del veterinario"
                    data-testid="input-note-vet-name"
                  />
                </div>

                <div>
                  <Label htmlFor="vetClinic">Clínica</Label>
                  <Input
                    id="vetClinic"
                    value={formData.vetClinic}
                    onChange={(e) => updateField("vetClinic", e.target.value)}
                    placeholder="Nombre de la clínica"
                    data-testid="input-note-vet-clinic"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="medications">Medicamentos Administrados</Label>
                <Textarea
                  id="medications"
                  value={formData.medications}
                  onChange={(e) => updateField("medications", e.target.value)}
                  placeholder="Medicamentos, dosis y frecuencia"
                  rows={2}
                  data-testid="textarea-note-medications"
                />
              </div>

              <div>
                <Label htmlFor="vaccinations">Vacunas Aplicadas</Label>
                <Textarea
                  id="vaccinations"
                  value={formData.vaccinations}
                  onChange={(e) => updateField("vaccinations", e.target.value)}
                  placeholder="Vacunas aplicadas en esta visita"
                  rows={2}
                  data-testid="textarea-note-vaccinations"
                />
              </div>
            </div>
          )}

          {/* Daily note-specific fields */}
          {formData.type === 'daily' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Información Adicional</h3>
              
              <div>
                <Label htmlFor="mood">Estado de Ánimo</Label>
                <Select value={formData.mood} onValueChange={(value) => updateField("mood", value)}>
                  <SelectTrigger data-testid="select-note-mood">
                    <SelectValue placeholder="¿Cómo estuvo tu mascota?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="muy_feliz">😸 Muy feliz</SelectItem>
                    <SelectItem value="feliz">😊 Feliz</SelectItem>
                    <SelectItem value="normal">😐 Normal</SelectItem>
                    <SelectItem value="triste">😔 Triste</SelectItem>
                    <SelectItem value="enfermo">🤒 No se siente bien</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createNoteMutation.isPending}
              data-testid="button-cancel-note"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createNoteMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-save-note"
            >
              {createNoteMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                "Guardar Nota"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
