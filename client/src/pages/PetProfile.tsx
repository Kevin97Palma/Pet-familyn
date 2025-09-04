import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import AddNoteModal from "@/components/AddNoteModal";
import type { Pet, Note, Vaccination, PetFile } from "@shared/schema";

export default function PetProfile() {
  const [match, params] = useRoute("/pet/:id");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddNote, setShowAddNote] = useState(false);

  const petId = params?.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  // Fetch pet data
  const { data: pet, isLoading: petLoading } = useQuery({
    queryKey: ["/api/pets", petId],
    enabled: !!petId && isAuthenticated,
    retry: false,
  });

  // Fetch pet notes
  const { data: notes = [] } = useQuery({
    queryKey: ["/api/pets", petId, "notes"],
    enabled: !!petId && isAuthenticated,
    retry: false,
  });

  // Fetch pet vaccinations
  const { data: vaccinations = [] } = useQuery({
    queryKey: ["/api/pets", petId, "vaccinations"],
    enabled: !!petId && isAuthenticated,
    retry: false,
  });

  // Fetch pet files
  const { data: files = [] } = useQuery({
    queryKey: ["/api/pets", petId, "files"],
    enabled: !!petId && isAuthenticated,
    retry: false,
  });

  // Pet image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (imageURL: string) => {
      const response = await apiRequest("PUT", `/api/pets/${petId}/image`, {
        imageURL,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets", petId] });
      toast({
        title: "Éxito",
        description: "Imagen actualizada correctamente",
      });
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
        description: "No se pudo actualizar la imagen",
        variant: "destructive",
      });
    },
  });

  if (authLoading || petLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <i className="fas fa-exclamation-circle text-4xl text-muted-foreground mb-4"></i>
              <h1 className="text-xl font-bold text-foreground mb-2">Mascota no encontrada</h1>
              <p className="text-sm text-muted-foreground mb-4">
                La mascota que buscas no existe o no tienes permisos para verla.
              </p>
              <Link href="/">
                <Button>Volver al Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <i className="fas fa-arrow-left mr-2"></i>Volver
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-foreground">{pet.name}</h1>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => setShowAddNote(true)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                data-testid="button-add-note"
              >
                <i className="fas fa-plus mr-2"></i>Agregar Nota
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-border shadow-sm overflow-hidden">
          {/* Pet Header */}
          <div className="relative">
            <div className="h-48 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6">
              <div className="flex items-end space-x-4">
                <div className="relative">
                  {pet.profileImageUrl ? (
                    <img 
                      src={pet.profileImageUrl} 
                      alt={`Foto de ${pet.name}`}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" 
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted border-4 border-white shadow-lg flex items-center justify-center">
                      <i className="fas fa-paw text-2xl text-muted-foreground"></i>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={async () => {
                        const response = await apiRequest("POST", "/api/objects/upload");
                        const { uploadURL } = await response.json();
                        return {
                          method: 'PUT' as const,
                          url: uploadURL,
                        };
                      }}
                      onComplete={(result) => {
                        if (result.successful && result.successful.length > 0) {
                          const uploadURL = result.successful[0].uploadURL;
                          uploadImageMutation.mutate(uploadURL);
                        }
                      }}
                      buttonClassName="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30"
                    >
                      <i className="fas fa-camera text-sm"></i>
                    </ObjectUploader>
                  </div>
                </div>
                <div className="flex-1 text-white">
                  <h1 className="text-3xl font-bold">{pet.name}</h1>
                  <p className="text-lg opacity-90">{pet.breed}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    {pet.birthDate && (
                      <>
                        <span>{new Date().getFullYear() - new Date(pet.birthDate).getFullYear()} años</span>
                        <span>•</span>
                      </>
                    )}
                    {pet.weight && (
                      <>
                        <span>{pet.weight}</span>
                        <span>•</span>
                      </>
                    )}
                    {pet.gender && <span>{pet.gender}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pet Content Tabs */}
          <Tabs defaultValue="info" className="w-full">
            <div className="border-b border-border">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="info" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-4"
                >
                  Información
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-4"
                >
                  Notas
                </TabsTrigger>
                <TabsTrigger 
                  value="vaccines" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-4"
                >
                  Vacunas
                </TabsTrigger>
                <TabsTrigger 
                  value="files" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-4"
                >
                  Archivos
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Information Tab */}
            <TabsContent value="info" className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Información Básica</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                        <p className="text-foreground">{pet.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Especie</label>
                        <p className="text-foreground">{pet.species}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Raza</label>
                        <p className="text-foreground">{pet.breed || 'No especificada'}</p>
                      </div>
                      {pet.birthDate && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</label>
                          <p className="text-foreground">{new Date(pet.birthDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {pet.color && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Color</label>
                          <p className="text-foreground">{pet.color}</p>
                        </div>
                      )}
                      {pet.microchip && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Microchip</label>
                          <p className="text-foreground font-mono text-sm">{pet.microchip}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Información Médica</h3>
                    <div className="space-y-3">
                      {pet.vetName && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Veterinario</label>
                          <p className="text-foreground">{pet.vetName}</p>
                        </div>
                      )}
                      {pet.vetClinic && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Clínica</label>
                          <p className="text-foreground">{pet.vetClinic}</p>
                        </div>
                      )}
                      {pet.allergies && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Alergias</label>
                          <p className="text-foreground">{pet.allergies}</p>
                        </div>
                      )}
                      {pet.medications && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Medicamentos</label>
                          <p className="text-foreground">{pet.medications}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {pet.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Descripción</h3>
                    <p className="text-muted-foreground leading-relaxed">{pet.description}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="p-6">
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-sticky-note text-4xl text-muted-foreground mb-4"></i>
                    <p className="text-muted-foreground">No hay notas registradas</p>
                    <p className="text-sm text-muted-foreground">¡Agrega la primera nota para comenzar!</p>
                  </div>
                ) : (
                  notes.map((note: any) => (
                    <Card key={note.id} className="border-border hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-xl ${
                              note.type === 'veterinary' 
                                ? 'bg-primary/20 text-primary' 
                                : 'bg-secondary/20 text-secondary'
                            }`}>
                              <i className={`fas ${
                                note.type === 'veterinary' ? 'fa-stethoscope' : 'fa-sticky-note'
                              } text-lg`}></i>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-semibold text-foreground">{note.title}</h3>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                  note.type === 'veterinary' 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'bg-secondary/10 text-secondary'
                                }`}>
                                  {note.type === 'veterinary' ? 'Veterinaria' : 'Cotidiana'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center">
                                  <i className="fas fa-calendar mr-1"></i>
                                  {new Date(note.date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <i className="fas fa-user mr-1"></i>
                                  {note.author?.firstName || note.author?.email}
                                </span>
                              </div>
                              <p className="text-muted-foreground">{note.content}</p>
                              
                              {note.type === 'veterinary' && (
                                <>
                                  {note.vetName && (
                                    <div className="mt-3 flex items-center text-sm text-muted-foreground">
                                      <i className="fas fa-user-md mr-2"></i>
                                      {note.vetName} {note.vetClinic && `- ${note.vetClinic}`}
                                    </div>
                                  )}
                                  {note.vaccinations && (
                                    <div className="mt-3">
                                      <p className="text-sm font-medium text-foreground mb-2">Vacunas:</p>
                                      <p className="text-sm text-muted-foreground">{note.vaccinations}</p>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {note.type === 'daily' && note.mood && (
                                <div className="mt-3 flex items-center space-x-2">
                                  <span className="text-sm font-medium text-foreground">Estado de ánimo:</span>
                                  <span className="text-sm text-muted-foreground">{note.mood}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Vaccinations Tab */}
            <TabsContent value="vaccines" className="p-6">
              <div className="space-y-4">
                {vaccinations.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-syringe text-4xl text-muted-foreground mb-4"></i>
                    <p className="text-muted-foreground">No hay vacunas registradas</p>
                  </div>
                ) : (
                  vaccinations.map((vaccination: Vaccination) => (
                    <Card key={vaccination.id} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-foreground">{vaccination.vaccineName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Aplicada: {new Date(vaccination.dateAdministered).toLocaleDateString()}
                            </p>
                            {vaccination.nextDueDate && (
                              <p className="text-sm text-muted-foreground">
                                Próxima: {new Date(vaccination.nextDueDate).toLocaleDateString()}
                              </p>
                            )}
                            {vaccination.vetName && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {vaccination.vetName} {vaccination.vetClinic && `- ${vaccination.vetClinic}`}
                              </p>
                            )}
                          </div>
                          <div className="bg-accent/10 p-2 rounded-lg">
                            <i className="fas fa-syringe text-accent"></i>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="p-6">
              <div className="space-y-4">
                {files.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-file text-4xl text-muted-foreground mb-4"></i>
                    <p className="text-muted-foreground">No hay archivos subidos</p>
                  </div>
                ) : (
                  files.map((file: PetFile) => (
                    <Card key={file.id} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-foreground">{file.fileName}</h4>
                            <p className="text-sm text-muted-foreground">{file.category}</p>
                            {file.description && (
                              <p className="text-xs text-muted-foreground mt-1">{file.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {file.fileSize && `${Math.round(file.fileSize / 1024)} KB`}
                            </span>
                            <Button variant="outline" size="sm">
                              <i className="fas fa-download mr-2"></i>
                              Descargar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      {/* Add Note Modal */}
      <AddNoteModal 
        isOpen={showAddNote}
        onClose={() => setShowAddNote(false)}
        petId={petId}
      />
    </div>
  );
}
