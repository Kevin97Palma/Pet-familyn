import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import type { Family, FamilyMember, User } from "@shared/schema";

export default function FamilyManagement() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

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

  // Fetch family details with members
  const { data: familyDetails, isLoading: familyLoading } = useQuery({
    queryKey: ["/api/families", selectedFamily],
    enabled: !!selectedFamily,
    retry: false,
  });

  // Send invite mutation
  const sendInviteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/families/${selectedFamily}/members`, {
        email: inviteEmail,
        message: inviteMessage,
      });
      return response.json();
    },
    onSuccess: () => {
      setInviteEmail("");
      setInviteMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/families", selectedFamily] });
      toast({
        title: "Éxito",
        description: "Invitación enviada correctamente",
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
        description: "No se pudo enviar la invitación",
        variant: "destructive",
      });
    },
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
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <i className="fas fa-arrow-left mr-2"></i>Volver
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-foreground">Gestión de Familia</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Gestión de Familia</h2>
          <p className="text-muted-foreground">
            Administra los miembros de tu familia y comparte el cuidado de tus mascotas.
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Family */}
          <div className="lg:col-span-2">
            <Card className="border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-foreground">
                    {familyDetails?.name || 'Mi Familia'}
                  </h3>
                </div>
              </div>

              <CardContent className="p-6">
                {familyLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando miembros...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Family Members */}
                    {familyDetails?.members?.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center space-x-4">
                          {member.user.profileImageUrl ? (
                            <img 
                              src={member.user.profileImageUrl} 
                              alt={member.user.firstName || member.user.email}
                              className="w-12 h-12 rounded-full" 
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <i className="fas fa-user text-muted-foreground"></i>
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {member.user.firstName && member.user.lastName 
                                ? `${member.user.firstName} ${member.user.lastName}`
                                : member.user.email
                              }
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {member.role === 'admin' ? 'Administrador' : 'Miembro'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Miembro desde {new Date(member.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            member.role === 'admin' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {member.role === 'admin' ? 'Admin' : 'Miembro'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {(!familyDetails?.members || familyDetails.members.length === 0) && (
                      <div className="text-center py-8">
                        <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
                        <p className="text-muted-foreground">No hay miembros en esta familia</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* QR Code & Invitation */}
          <div className="space-y-6">
            {/* QR Code Generation */}
            <Card className="border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Código QR de Familia</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Comparte este código para invitar nuevos miembros
                </p>
              </div>
              <CardContent className="p-6">
                {selectedFamily && (
                  <QRCodeGenerator familyId={selectedFamily} />
                )}
              </CardContent>
            </Card>

            {/* Email Invitation */}
            <Card className="border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Invitar por Email</h3>
              </div>
              <CardContent className="p-6">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!inviteEmail.trim()) {
                    toast({
                      title: "Error",
                      description: "Por favor ingresa un email",
                      variant: "destructive",
                    });
                    return;
                  }
                  sendInviteMutation.mutate();
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Email del Invitado
                    </label>
                    <Input
                      type="email"
                      placeholder="ejemplo@email.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={sendInviteMutation.isPending}
                      data-testid="input-invite-email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Mensaje Personal (Opcional)
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="¡Únete a nuestra familia para cuidar juntos de nuestras mascotas!"
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      disabled={sendInviteMutation.isPending}
                      data-testid="textarea-invite-message"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                    disabled={sendInviteMutation.isPending}
                    data-testid="button-send-invite"
                  >
                    {sendInviteMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-envelope mr-2"></i>
                        Enviar Invitación
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Family Statistics */}
            <Card className="border-border shadow-sm">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Estadísticas</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Miembros</span>
                  <span className="font-semibold text-foreground" data-testid="text-total-members">
                    {familyDetails?.members?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha Creación</span>
                  <span className="font-semibold text-foreground">
                    {familyDetails?.createdAt 
                      ? new Date(familyDetails.createdAt).toLocaleDateString()
                      : 'No disponible'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
