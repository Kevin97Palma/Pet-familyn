import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import PetCard from "@/components/PetCard";
import AddPetModal from "@/components/AddPetModal";
import type { Pet, Note, Family, FamilyMember } from "@shared/schema";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [showAddPet, setShowAddPet] = useState(false);

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
  const { data: families = [], isLoading: familiesLoading } = useQuery({
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

  // Fetch family pets
  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ["/api/families", selectedFamily, "pets"],
    enabled: !!selectedFamily,
    retry: false,
  });

  // Fetch recent notes
  const { data: recentNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["/api/families", selectedFamily, "notes", "recent"],
    enabled: !!selectedFamily,
    retry: false,
  });

  // Fetch upcoming vaccinations
  const { data: upcomingVaccinations = [] } = useQuery({
    queryKey: ["/api/families", selectedFamily, "vaccinations", "upcoming"],
    enabled: !!selectedFamily,
    retry: false,
  });

  if (authLoading || familiesLoading) {
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
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-xl p-2">
                <i className="fas fa-paw text-primary-foreground text-xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Pet-Family</h1>
                <p className="text-xs text-muted-foreground">Mi familia peluda</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-primary font-medium">Dashboard</Link>
              <Link href="/notes" className="text-muted-foreground hover:text-foreground">Notas</Link>
              <Link href="/family" className="text-muted-foreground hover:text-foreground">Familia</Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {user?.profileImageUrl && (
                  <img src={user.profileImageUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {user?.firstName || user?.email || 'Usuario'}
                </span>
              </div>
              <Button
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-logout"
              >
                Salir
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-border">
          <div className="flex justify-around py-2">
            <Link href="/" className="flex flex-col items-center p-2 text-primary">
              <i className="fas fa-home text-lg"></i>
              <span className="text-xs mt-1">Inicio</span>
            </Link>
            <Link href="/notes" className="flex flex-col items-center p-2 text-muted-foreground">
              <i className="fas fa-sticky-note text-lg"></i>
              <span className="text-xs mt-1">Notas</span>
            </Link>
            <Link href="/family" className="flex flex-col items-center p-2 text-muted-foreground">
              <i className="fas fa-users text-lg"></i>
              <span className="text-xs mt-1">Familia</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              ¡Bienvenido, {user?.firstName || 'Usuario'}! 🐾
            </h2>
            <p className="text-muted-foreground">
              Aquí tienes un resumen de tus mascotas y actividades recientes.
            </p>
          </div>

          {/* Family Selector */}
          {families.length > 1 && (
            <div className="mb-6">
              <select 
                value={selectedFamily}
                onChange={(e) => setSelectedFamily(e.target.value)}
                className="px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring"
                data-testid="select-family"
              >
                {families.map((fm: any) => (
                  <option key={fm.family.id} value={fm.family.id}>
                    {fm.family.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Mis Mascotas</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-pets-count">
                      {pets.length}
                    </p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <i className="fas fa-paw text-primary text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Notas Recientes</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-notes-count">
                      {recentNotes.length}
                    </p>
                  </div>
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <i className="fas fa-sticky-note text-secondary text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Próximas Vacunas</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-vaccinations-count">
                      {upcomingVaccinations.length}
                    </p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <i className="fas fa-calendar text-accent text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Miembros Familia</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-members-count">
                      {families.find((f: any) => f.family.id === selectedFamily)?.family.members?.length || 0}
                    </p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <i className="fas fa-users text-primary text-xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* My Pets Section */}
            <div className="lg:col-span-2">
              <Card className="border-border shadow-sm">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground">Mis Mascotas</h3>
                    <Button 
                      onClick={() => setShowAddPet(true)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-add-pet"
                    >
                      <i className="fas fa-plus mr-2"></i>Agregar Mascota
                    </Button>
                  </div>
                </div>

                <CardContent className="p-6">
                  {petsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Cargando mascotas...</p>
                    </div>
                  ) : pets.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="fas fa-paw text-4xl text-muted-foreground mb-4"></i>
                      <p className="text-muted-foreground">No tienes mascotas registradas</p>
                      <p className="text-sm text-muted-foreground">¡Agrega tu primera mascota para comenzar!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pets.map((pet: Pet) => (
                        <PetCard key={pet.id} pet={pet} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Notes */}
              <Card className="border-border shadow-sm">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Notas Recientes</h3>
                </div>
                <CardContent className="p-6">
                  {notesLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : recentNotes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay notas recientes</p>
                  ) : (
                    <div className="space-y-4">
                      {recentNotes.slice(0, 3).map((note: any) => (
                        <div key={note.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                          <div className={`p-2 rounded-lg ${
                            note.type === 'veterinary' 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-secondary/20 text-secondary'
                          }`}>
                            <i className={`fas ${
                              note.type === 'veterinary' ? 'fa-stethoscope' : 'fa-sticky-note'
                            } text-sm`}></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{note.title}</p>
                            <p className="text-xs text-muted-foreground">{note.pet?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(note.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}

                      <Link href="/notes">
                        <Button variant="ghost" className="w-full">
                          Ver todas las notas
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Family Quick Access */}
              <Card className="border-border shadow-sm">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Mi Familia</h3>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {families.length > 0 && (
                      <>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {families.find((f: any) => f.family.id === selectedFamily)?.family.name || 'Mi Familia'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Link href="/family">
                            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                              <i className="fas fa-qrcode mr-2"></i>Generar QR
                            </Button>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Add Pet Modal */}
      <AddPetModal 
        isOpen={showAddPet}
        onClose={() => setShowAddPet(false)}
        familyId={selectedFamily}
      />
    </div>
  );
}
