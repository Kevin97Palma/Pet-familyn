import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import NoteCard from "@/components/NoteCard";
import AddNoteModal from "@/components/AddNoteModal";
import type { Note, Pet } from "@shared/schema";

export default function NotesManager() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [selectedPet, setSelectedPet] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [showAddNote, setShowAddNote] = useState(false);

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

  // Fetch user families
  const { data: families = [] } = useQuery({
    queryKey: ["/api/families"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Set default family
  useEffect(() => {
    if (families.length > 0 && !selectedFamily) {
      setSelectedFamily(families[0].family.id);
    }
  }, [families, selectedFamily]);

  // Fetch family pets for filter
  const { data: pets = [] } = useQuery({
    queryKey: ["/api/families", selectedFamily, "pets"],
    enabled: !!selectedFamily,
    retry: false,
  });

  // Fetch family notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["/api/families", selectedFamily, "notes"],
    enabled: !!selectedFamily,
    retry: false,
  });

  // Filter notes based on selected filters
  const filteredNotes = notes.filter((note: any) => {
    if (selectedPet !== "all" && note.petId !== selectedPet) return false;
    if (selectedType !== "all" && note.type !== selectedType) return false;
    if (dateFilter && !new Date(note.date).toISOString().startsWith(dateFilter)) return false;
    return true;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
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
              <h1 className="text-xl font-bold text-foreground">Gestión de Notas</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Gestión de Notas</h2>
          <p className="text-muted-foreground">
            Lleva un registro completo de las actividades cotidianas y citas veterinarias de tus mascotas.
          </p>
        </div>

        {/* Notes Filters and Actions */}
        <Card className="border-border shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Family Selector */}
                {families.length > 1 && (
                  <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                    <SelectTrigger className="w-[180px]" data-testid="select-family-filter">
                      <SelectValue placeholder="Seleccionar familia" />
                    </SelectTrigger>
                    <SelectContent>
                      {families.map((fm: any) => (
                        <SelectItem key={fm.family.id} value={fm.family.id}>
                          {fm.family.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Pet Filter */}
                <Select value={selectedPet} onValueChange={setSelectedPet}>
                  <SelectTrigger className="w-[180px]" data-testid="select-pet-filter">
                    <SelectValue placeholder="Todas las mascotas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las mascotas</SelectItem>
                    {pets.map((pet: Pet) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]" data-testid="select-type-filter">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="daily">Notas Cotidianas</SelectItem>
                    <SelectItem value="veterinary">Notas Veterinarias</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-[180px]"
                  data-testid="input-date-filter"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  onClick={() => setShowAddNote(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-add-note"
                >
                  <i className="fas fa-plus mr-2"></i>Agregar Nota
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes List */}
        <div className="space-y-4">
          {notesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando notas...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-16">
              <i className="fas fa-sticky-note text-6xl text-muted-foreground mb-6"></i>
              <h3 className="text-xl font-semibold text-foreground mb-2">No hay notas</h3>
              <p className="text-muted-foreground mb-6">
                {notes.length === 0 
                  ? "No tienes notas registradas. ¡Agrega tu primera nota!"
                  : "No se encontraron notas con los filtros seleccionados"
                }
              </p>
              <Button
                onClick={() => setShowAddNote(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <i className="fas fa-plus mr-2"></i>Agregar Primera Nota
              </Button>
            </div>
          ) : (
            <>
              {filteredNotes.map((note: any) => (
                <NoteCard 
                  key={note.id} 
                  note={note}
                  showPetName={true}
                />
              ))}

              {/* Load More Button - placeholder for future pagination */}
              {filteredNotes.length >= 20 && (
                <div className="text-center py-6">
                  <Button variant="outline" size="lg">
                    <i className="fas fa-chevron-down mr-2"></i>Cargar más notas
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Add Note Modal */}
      <AddNoteModal 
        isOpen={showAddNote}
        onClose={() => setShowAddNote(false)}
        petId={selectedPet !== "all" ? selectedPet : undefined}
        familyId={selectedFamily}
      />
    </div>
  );
}
